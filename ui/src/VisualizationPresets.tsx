import { useState, useEffect } from 'react';
import { BarChart3, LineChart, Box, Layers, AreaChart, Circle } from 'lucide-react';

interface Props {
  schema: any[];
  data: any[];
  onVisualize: (config: { type: string; xAxis: string; yAxis: string; zAxis?: string }) => void;
}

export function VisualizationPresets({ schema, data, onVisualize }: Props) {
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [zAxis, setZAxis] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Get numeric columns for axis selection
  const numericColumns = schema
    .filter(col => {
      const colName = col.column_name || col.name;
      if (!data.length) return false;
      const sample = data[0][colName];
      return typeof sample === 'number' || !isNaN(parseFloat(sample));
    })
    .map(col => col.column_name || col.name);

  const allColumns = schema.map(col => col.column_name || col.name);

  // Auto-select first columns when data changes
  useEffect(() => {
    if (allColumns.length > 0 && !xAxis) {
      setXAxis(allColumns[0]);
    }
    if (numericColumns.length > 0 && !yAxis) {
      setYAxis(numericColumns[0]);
    }
    if (numericColumns.length > 1 && !zAxis) {
      setZAxis(numericColumns[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.length, data.length]);

  const handleVisualize = (type: string) => {
    try {
      if (!xAxis || !yAxis) {
        alert('Please select X and Y axes');
        return;
      }

      if ((type === '3d-scatter' || type === '3d-surface') && !zAxis) {
        alert('Please select Z axis for 3D visualization');
        return;
      }

      // Validate axes exist in schema
      const axisNames = schema.map(col => col.column_name || col.name);
      if (!axisNames.includes(xAxis)) {
        alert(`Column "${xAxis}" not found in data`);
        return;
      }
      if (!axisNames.includes(yAxis)) {
        alert(`Column "${yAxis}" not found in data`);
        return;
      }
      if (zAxis && !axisNames.includes(zAxis)) {
        alert(`Column "${zAxis}" not found in data`);
        return;
      }

      onVisualize({ type, xAxis, yAxis, zAxis: zAxis || undefined });
    } catch (error) {
      console.error('Error in handleVisualize:', error);
      alert(`Error creating visualization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Allow presets to show even with empty data (for mock data on homepage)
  if (!schema.length) return null;

  return (
    <div style={{ 
      margin: '20px 0', 
      padding: '15px', 
      background: '#f8f9fa', 
      borderRadius: '8px', 
      border: '1px solid #e0e0e0' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <Layers size={18} color="#4b6cb7" />
          Visualization Presets
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '6px 12px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Axis Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                X Axis
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select X axis...</option>
                {allColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                Y Axis
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Y axis...</option>
                {numericColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                Z Axis (for 3D)
              </label>
              <select
                value={zAxis}
                onChange={(e) => setZAxis(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Optional...</option>
                {numericColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2D Visualization Presets */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>2D Visualizations</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => handleVisualize('bar')}
                disabled={!xAxis || !yAxis}
                style={{
                  padding: '10px 16px',
                  background: !xAxis || !yAxis ? '#e0e0e0' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis) ? 0.6 : 1
                }}
              >
                <BarChart3 size={16} />
                Bar Chart
              </button>

              <button
                onClick={() => handleVisualize('line')}
                disabled={!xAxis || !yAxis}
                style={{
                  padding: '10px 16px',
                  background: !xAxis || !yAxis ? '#e0e0e0' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis) ? 0.6 : 1
                }}
              >
                <LineChart size={16} />
                Line Chart
              </button>

              <button
                onClick={() => handleVisualize('scatter')}
                disabled={!xAxis || !yAxis}
                style={{
                  padding: '10px 16px',
                  background: !xAxis || !yAxis ? '#e0e0e0' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis) ? 0.6 : 1
                }}
              >
                <Circle size={16} />
                Scatter Plot
              </button>

              <button
                onClick={() => handleVisualize('area')}
                disabled={!xAxis || !yAxis}
                style={{
                  padding: '10px 16px',
                  background: !xAxis || !yAxis ? '#e0e0e0' : '#14b8a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis) ? 0.6 : 1
                }}
              >
                <AreaChart size={16} />
                Area Chart
              </button>

              <button
                onClick={() => handleVisualize('d3-scatter')}
                disabled={!xAxis || !yAxis}
                style={{
                  padding: '10px 16px',
                  background: !xAxis || !yAxis ? '#e0e0e0' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis) ? 0.6 : 1
                }}
              >
                <Circle size={16} />
                D3 Scatter
              </button>

              <button
                onClick={() => handleVisualize('d3-line')}
                disabled={!xAxis || !yAxis}
                style={{
                  padding: '10px 16px',
                  background: !xAxis || !yAxis ? '#e0e0e0' : '#ec4899',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis) ? 0.6 : 1
                }}
              >
                <LineChart size={16} />
                D3 Line
              </button>

              <button
                onClick={() => handleVisualize('d3-bar')}
                disabled={!xAxis || !yAxis}
                style={{
                  padding: '10px 16px',
                  background: !xAxis || !yAxis ? '#e0e0e0' : '#06b6d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis) ? 0.6 : 1
                }}
              >
                <BarChart3 size={16} />
                D3 Bar
              </button>
            </div>
          </div>

          {/* 3D Visualization Presets */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>3D Visualizations</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => handleVisualize('3d-scatter')}
                disabled={!xAxis || !yAxis || !zAxis}
                style={{
                  padding: '10px 16px',
                  background: (!xAxis || !yAxis || !zAxis) ? '#e0e0e0' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis || !zAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis || !zAxis) ? 0.6 : 1
                }}
              >
                <Box size={16} />
                3D Scatter
              </button>

              <button
                onClick={() => handleVisualize('3d-surface')}
                disabled={!xAxis || !yAxis || !zAxis}
                style={{
                  padding: '10px 16px',
                  background: (!xAxis || !yAxis || !zAxis) ? '#e0e0e0' : '#ea580c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!xAxis || !yAxis || !zAxis) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: (!xAxis || !yAxis || !zAxis) ? 0.6 : 1
                }}
              >
                <Layers size={16} />
                3D Surface
              </button>
            </div>
            {!zAxis && (
              <p style={{ fontSize: '12px', color: '#999', margin: '8px 0 0 0' }}>
                💡 Select a Z axis to enable 3D visualizations
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

