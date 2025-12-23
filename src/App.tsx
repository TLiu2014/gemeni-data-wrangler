// src/App.tsx
import { useState, useEffect } from 'react';
import { initDB } from './db';
import { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import * as duckdb from '@duckdb/duckdb-wasm';
import { useDropzone } from 'react-dropzone';

function App() {
  const [db, setDb] = useState<AsyncDuckDB | null>(null);
  const [status, setStatus] = useState('Initializing DB...');
  const [rows, setRows] = useState<any[]>([]);

  // 1. Initialize DB on mount
  useEffect(() => {
    initDB().then((database) => {
      setDb(database);
      setStatus('Ready for data.');
    });
  }, []);

  // 2. Handle File Upload
  const onDrop = async (acceptedFiles: File[]) => {
    if (!db) return;
    const file = acceptedFiles[0];
    setStatus(`Loading ${file.name}...`);

    // Register the file in DuckDB's virtual file system
    await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

    // Create a table from the CSV automatically
    const conn = await db.connect();
    // Safety: sanitize table name or use standard name
    const tableName = 'uploaded_data'; 
    
    await conn.insertCSVFromPath(file.name, {
        name: tableName,
        schema: "main",
        header: true,
        detect: true // Auto-detect column types!
    });

    setStatus('Data loaded. Querying...');
    
    // 3. Run a test query (e.g., select first 5 rows)
    const result = await conn.query(`SELECT * FROM ${tableName} LIMIT 5`);
    
    // Convert Arrow table to JSON for React to render
    const resultJson = result.toArray().map((row) => row.toJSON());
    
    setRows(resultJson);
    setStatus(`Success! Loaded ${file.name}`);
    await conn.close();
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Gemini Data Wrangler</h1>
      <p>Status: <strong>{status}</strong></p>
      
      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        style={{ border: '2px dashed #ccc', padding: '20px', cursor: 'pointer', background: '#f9f9f9' }}
      >
        <input {...getInputProps()} />
        <p>Drag & drop a CSV here, or click to select files</p>
      </div>

      {/* Results Table */}
      {rows.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Preview Data:</h3>
          <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {Object.keys(rows[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val: any, j) => (
                    <td key={j}>{val?.toString()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;