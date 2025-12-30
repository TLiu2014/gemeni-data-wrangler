import { X } from 'lucide-react';
import type { TableData } from './types';

interface Props {
  tables: TableData[];
  activeTableId: string | null;
  onTableSelect: (tableId: string) => void;
  onTableClose: (tableId: string) => void;
}

export function TableTabs({ tables, activeTableId, onTableSelect, onTableClose }: Props) {
  if (tables.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      gap: '4px', 
      borderBottom: '2px solid #e0e0e0',
      marginBottom: '20px',
      overflowX: 'auto'
    }}>
      {tables.map((table) => (
        <div
          key={table.id}
          onClick={() => onTableSelect(table.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            cursor: 'pointer',
            borderBottom: activeTableId === table.id ? '2px solid #2563eb' : '2px solid transparent',
            background: activeTableId === table.id ? '#f0f4ff' : 'transparent',
            color: activeTableId === table.id ? '#2563eb' : '#666',
            fontWeight: activeTableId === table.id ? '600' : '400',
            whiteSpace: 'nowrap',
            position: 'relative',
            marginBottom: '-2px'
          }}
        >
          <span>{table.name}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>({table.rows.length} rows)</span>
          {tables.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTableClose(table.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                color: '#999',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#999';
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

