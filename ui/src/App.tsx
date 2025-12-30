import { useState, useEffect, Component } from 'react';
import type { ReactNode } from 'react';
import { initDB } from './db';
import { SmartTransform } from './SmartTransform';
import { DynamicChart } from './DynamicChart';
import { EnhancedVisualizations } from './EnhancedVisualizations';
import { VisualizationPresets } from './VisualizationPresets';
import { ApiKeyInput } from './ApiKeyInput';
import { useDropzone } from 'react-dropzone';
import * as duckdb from '@duckdb/duckdb-wasm';
import { mockData, mockSchema } from './mockData';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div style={{ padding: '20px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}

function App() {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [schema, setSchema] = useState<any[]>([]); // Current columns
  const [chartConfig, setChartConfig] = useState<any>(null); // From Gemini
  const [status, setStatus] = useState('Initializing Engine...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(() => {
    // Load from localStorage if available
    return localStorage.getItem('gemini_api_key');
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDB().then(async (database) => {
      setDb(database);
      const connection = await database.connect();
      setConn(connection);
      setStatus('Ready for data.');
    });
  }, []);

  const handleApiKeySet = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setError(null); // Clear any previous errors
  };

  // Helper function to parse CSV line (handles quoted values)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!db || !conn) return;
    const file = acceptedFiles[0];
    setStatus(`Loading ${file.name}...`);
    setError(null);

    const internalFileName = 'uploaded_data.csv';
    let success = false;
    let lastError: Error | null = null;

    // Method 1: Try registerFileHandle (most direct)
    try {
      await db.registerFileHandle(
        internalFileName, 
        file, 
        duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, 
        true
      );
      
      await conn.query(`
        CREATE OR REPLACE TABLE data_source AS 
        SELECT * FROM read_csv_auto('${internalFileName}', header=true, auto_detect=true)
      `);
      
      success = true;
    } catch (error1) {
      lastError = error1 instanceof Error ? error1 : new Error(String(error1));
      console.warn('Method 1 (registerFileHandle) failed, trying method 2...');
      
      // Method 2: Read file as text and register as new file
      try {
        const fileText = await file.text();
        const textBlob = new Blob([fileText], { type: 'text/csv' });
        const textFile = new File([textBlob], internalFileName, { type: 'text/csv' });
        
        await db.registerFileHandle(
          internalFileName,
          textFile,
          duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
          true
        );
        
        await conn.query(`
          CREATE OR REPLACE TABLE data_source AS 
          SELECT * FROM read_csv_auto('${internalFileName}', header=true, auto_detect=true)
        `);
        
        success = true;
      } catch (error2) {
        lastError = error2 instanceof Error ? error2 : new Error(String(error2));
        console.warn('Method 2 (file text) failed, trying method 3...');
        
        // Method 3: Parse CSV manually and insert directly (most reliable fallback)
        try {
          setStatus('Parsing CSV manually...');
          const fileText = await file.text();
          const lines = fileText.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
          }
          
          const headerLine = lines[0];
          const headers = parseCSVLine(headerLine);
          
          if (headers.length === 0) {
            throw new Error('Could not parse CSV headers');
          }
          
          const createSQL = `CREATE OR REPLACE TABLE data_source (${headers.map((h: string) => `"${h.replace(/"/g, '""')}" VARCHAR`).join(', ')})`;
          await conn.query(createSQL);
          
          const dataLines = lines.slice(1, 10001); // Limit to 10000 rows
          const insertBatch: string[] = [];
          
          for (const line of dataLines) {
            if (!line.trim()) continue;
            const values = parseCSVLine(line);
            if (values.length === headers.length) {
              const escapedValues = values.map(v => `'${String(v).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`);
              insertBatch.push(`(${escapedValues.join(', ')})`);
              
              if (insertBatch.length >= 100) {
                await conn.query(`INSERT INTO data_source VALUES ${insertBatch.join(', ')}`);
                insertBatch.length = 0;
              }
            }
          }
          
          if (insertBatch.length > 0) {
            await conn.query(`INSERT INTO data_source VALUES ${insertBatch.join(', ')}`);
          }
          
          success = true;
        } catch (error3) {
          lastError = error3 instanceof Error ? error3 : new Error(String(error3));
          console.error('All methods failed:', error3);
        }
      }
    }

    if (success) {
      try {
        const schemaRes = await conn.query(`DESCRIBE data_source`);
        setSchema(schemaRes.toArray().map(r => r.toJSON()));

        const result = await conn.query(`SELECT * FROM data_source LIMIT 10`);
        setRows(result.toArray().map(r => r.toJSON()));
        setStatus('Data loaded.');
        setError(null);
      } catch (error) {
        console.error('Error fetching schema/data:', error);
        setError(`Data loaded but error fetching details: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      const errorMessage = lastError?.message || 'Failed to load CSV';
      setStatus(`Error: ${errorMessage}`);
      setError(`Failed to load CSV: ${errorMessage}. Please ensure the file is a valid CSV.`);
    }
  };

  const handleTransform = async (userPrompt: string) => {
    if (!conn) return;
    
    if (!apiKey) {
      setError('API key is required. Please set your Gemini API key in the top right corner.');
      setStatus('Error: API key not set.');
      return;
    }

    setIsProcessing(true);
    setStatus('Gemini is thinking...');
    setError(null);

    try {
      // 1. Ask Gemini for the SQL
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema, userPrompt, apiKey })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transform data');
      }
      
      const { sql, chartType, xAxis, yAxis, zAxis, explanation } = await response.json();
      
      // 2. Execute Gemini's SQL
      setStatus(`Executing: ${explanation}`);
      const result = await conn.query(sql);
      const resultRows = result.toArray().map(r => r.toJSON());

      // 3. Update UI
      setRows(resultRows);
      setChartConfig({ type: chartType, xAxis, yAxis, zAxis });
      setStatus(`Done! showed ${resultRows.length} rows.`);
      setError(null);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Error transforming data.';
      setError(errorMessage);
      setStatus(`Error: ${errorMessage}`);
      // Don't clear rows - stay on table view as requested
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetVisualize = (config: { type: string; xAxis: string; yAxis: string; zAxis?: string }) => {
    try {
      // Use mock data if no rows are loaded, otherwise use actual data
      const dataToUse = rows.length > 0 ? rows : mockData;
      const firstRow = dataToUse[0];
      
      if (!firstRow) {
        setError('No data available for visualization');
        return;
      }

      if (!firstRow.hasOwnProperty(config.xAxis)) {
        setError(`Column "${config.xAxis}" not found in data`);
        return;
      }
      if (!firstRow.hasOwnProperty(config.yAxis)) {
        setError(`Column "${config.yAxis}" not found in data`);
        return;
      }
      if (config.zAxis && !firstRow.hasOwnProperty(config.zAxis)) {
        setError(`Column "${config.zAxis}" not found in data`);
        return;
      }

      // Apply visualization preset directly without transforming data
      setChartConfig(config);
      setError(null);
      const dataSource = rows.length > 0 ? 'your data' : 'sample data';
      setStatus(`Visualization (${dataSource}): ${config.type} - ${config.yAxis} by ${config.xAxis}${config.zAxis ? ` and ${config.zAxis}` : ''}`);
    } catch (err) {
      console.error('Error in preset visualization:', err);
      setError(`Failed to create visualization: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // Keep the current view - don't clear chartConfig
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {/* Header with API Key Input */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative' }}>
        <h1 style={{ margin: 0 }}>Gemini 3 Data Agent</h1>
        <ApiKeyInput onApiKeySet={handleApiKeySet} currentApiKey={apiKey} />
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '4px',
          color: '#991b1b',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* 1. Upload Section */}
      {!rows.length && (
        <>
          <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', cursor: 'pointer', borderRadius: '8px', position: 'relative', zIndex: 1, marginBottom: '20px' }}>
            <input {...getInputProps()} />
            <p>Drag & drop your CSV here to begin</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>Or try the visualization presets below with sample data</p>
          </div>

          {/* Show presets with mock data */}
          <div style={{ marginTop: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#333' }}>Try Visualization Presets (Sample Data)</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Explore different visualization types with our sample sales data. Upload your own CSV to use your data.
            </p>
            <VisualizationPresets 
              schema={mockSchema}
              data={mockData}
              onVisualize={handlePresetVisualize}
            />
            
            {/* Show sample data table */}
            {chartConfig && (
              <>
                <div style={{ color: '#666', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>
                  Status: <strong>Showing sample data visualization</strong>
                </div>
                {/* Show standard Recharts for basic chart types */}
                {chartConfig && !chartConfig.type?.startsWith('d3-') && !chartConfig.type?.startsWith('3d-') && (
                  <ErrorBoundary fallback={<div style={{ padding: '20px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>Error rendering chart. Please check your axis selections.</div>}>
                    <DynamicChart data={mockData} config={chartConfig} />
                  </ErrorBoundary>
                )}
                {/* Show enhanced visualizations for D3.js and 3D charts */}
                {chartConfig && (chartConfig.type?.startsWith('d3-') || chartConfig.type?.startsWith('3d-')) && (
                  <ErrorBoundary fallback={<div style={{ padding: '20px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>Error rendering visualization. Please check your axis selections.</div>}>
                    <EnhancedVisualizations data={mockData} config={chartConfig} />
                  </ErrorBoundary>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* 2. Transformation Section */}
      {rows.length > 0 && (
        <>
          <SmartTransform 
            schema={schema} 
            onTransform={handleTransform} 
            isProcessing={isProcessing} 
          />

          {/* Visualization Presets */}
          <VisualizationPresets 
            schema={schema}
            data={rows}
            onVisualize={handlePresetVisualize}
          />
          
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
            Status: <strong>{status}</strong>
          </div>

          {/* 3. Visuals */}
          {/* Show standard Recharts for basic chart types */}
          {chartConfig && !chartConfig.type?.startsWith('d3-') && !chartConfig.type?.startsWith('3d-') && (
            <ErrorBoundary fallback={<div style={{ padding: '20px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>Error rendering chart. Please check your axis selections.</div>}>
              <DynamicChart data={rows} config={chartConfig} />
            </ErrorBoundary>
          )}
          {/* Show enhanced visualizations for D3.js and 3D charts */}
          {chartConfig && (chartConfig.type?.startsWith('d3-') || chartConfig.type?.startsWith('3d-')) && (
            <ErrorBoundary fallback={<div style={{ padding: '20px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>Error rendering visualization. Please check your axis selections.</div>}>
              <EnhancedVisualizations data={rows} config={chartConfig} />
            </ErrorBoundary>
          )}

          {/* 4. Data Grid */}
          <div style={{ overflowX: 'auto', marginTop: '20px', border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  {rows.length > 0 && Object.keys(rows[0]).map(key => (
                    <th key={key} style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} style={{ padding: '8px' }}>{val?.toString()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;