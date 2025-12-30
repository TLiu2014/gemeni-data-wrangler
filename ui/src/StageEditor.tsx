import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import type { TransformationStage, JoinType, FilterOperator, UnionType } from './types';

interface Props {
  stage: TransformationStage | null;
  tables: Array<{ id: string; name: string }>;
  onSave: (stage: TransformationStage) => void;
  onCancel: () => void;
  onDelete?: (stageId: string) => void;
}

export function StageEditor({ stage, tables, onSave, onCancel, onDelete }: Props) {
  const { themeConfig } = useTheme();
  const [type, setType] = useState<TransformationStage['type']>(stage?.type || 'FILTER');
  const [description, setDescription] = useState(stage?.description || '');
  const [data, setData] = useState<any>(stage?.data || {});

  const handleSave = () => {
    const newStage: TransformationStage = {
      id: stage?.id || `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      timestamp: stage?.timestamp || new Date(),
      data
    };
    onSave(newStage);
  };

  const renderTypeSpecificFields = () => {
    switch (type) {
      case 'JOIN':
        return (
          <>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Join Type
              </label>
              <select
                value={data.joinType || 'INNER'}
                onChange={(e) => setData({ ...data, joinType: e.target.value as JoinType })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              >
                <option value="INNER">INNER</option>
                <option value="LEFT">LEFT</option>
                <option value="RIGHT">RIGHT</option>
                <option value="FULL OUTER">FULL OUTER</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Left Table
              </label>
              <select
                value={data.leftTable || ''}
                onChange={(e) => setData({ ...data, leftTable: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              >
                <option value="">Select table</option>
                {tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Right Table
              </label>
              <select
                value={data.rightTable || ''}
                onChange={(e) => setData({ ...data, rightTable: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              >
                <option value="">Select table</option>
                {tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Left Key
              </label>
              <input
                type="text"
                value={data.leftKey || ''}
                onChange={(e) => setData({ ...data, leftKey: e.target.value })}
                placeholder="Column name"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Right Key
              </label>
              <input
                type="text"
                value={data.rightKey || ''}
                onChange={(e) => setData({ ...data, rightKey: e.target.value })}
                placeholder="Column name"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              />
            </div>
          </>
        );

      case 'FILTER':
        return (
          <>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Table
              </label>
              <select
                value={data.table || ''}
                onChange={(e) => setData({ ...data, table: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              >
                <option value="">Select table</option>
                {tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Column
              </label>
              <input
                type="text"
                value={data.column || ''}
                onChange={(e) => setData({ ...data, column: e.target.value })}
                placeholder="Column name"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Operator
              </label>
              <select
                value={data.operator || '='}
                onChange={(e) => setData({ ...data, operator: e.target.value as FilterOperator })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              >
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
                <option value="LIKE">LIKE</option>
                <option value="IN">IN</option>
                <option value="NOT IN">NOT IN</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Value
              </label>
              <input
                type="text"
                value={data.value || ''}
                onChange={(e) => setData({ ...data, value: e.target.value })}
                placeholder="Filter value"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              />
            </div>
          </>
        );

      case 'UNION':
        return (
          <>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Union Type
              </label>
              <select
                value={data.unionType || 'UNION'}
                onChange={(e) => setData({ ...data, unionType: e.target.value as UnionType })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              >
                <option value="UNION">UNION</option>
                <option value="UNION ALL">UNION ALL</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                Tables (comma-separated)
              </label>
              <input
                type="text"
                value={data.tables?.join(', ') || ''}
                onChange={(e) => setData({ ...data, tables: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="table1, table2"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.surfaceElevated,
                  color: themeConfig.colors.text
                }}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: themeConfig.colors.surfaceElevated,
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: themeConfig.shadows.xl
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: themeConfig.colors.text }}>
            {stage ? 'Edit Stage' : 'Add Stage'}
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: themeConfig.colors.textSecondary,
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
              Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as TransformationStage['type']);
                setData({});
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: `1px solid ${themeConfig.colors.border}`,
                background: themeConfig.colors.surfaceElevated,
                color: themeConfig.colors.text
              }}
            >
              <option value="JOIN">JOIN</option>
              <option value="UNION">UNION</option>
              <option value="FILTER">FILTER</option>
              <option value="GROUP">GROUP</option>
              <option value="SELECT">SELECT</option>
              <option value="SORT">SORT</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this transformation"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: `1px solid ${themeConfig.colors.border}`,
                background: themeConfig.colors.surfaceElevated,
                color: themeConfig.colors.text
              }}
            />
          </div>

          {renderTypeSpecificFields()}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '10px',
                background: themeConfig.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Save
            </button>
            {stage && onDelete && (
              <button
                onClick={() => {
                  if (stage.id && onDelete) {
                    onDelete(stage.id);
                    onCancel();
                  }
                }}
                style={{
                  padding: '10px 16px',
                  background: themeConfig.colors.error,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onCancel}
              style={{
                padding: '10px 16px',
                background: themeConfig.colors.surface,
                color: themeConfig.colors.text,
                border: `1px solid ${themeConfig.colors.border}`,
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

