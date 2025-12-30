import { GitBranch, Plus, Edit2, Database, Link2, Filter, Layers, ArrowUpDown, BarChart3, Code } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { EditableStageCard } from './EditableStageCard';
import type { TransformationStage } from './types';

export const getStageIcon = (type: TransformationStage['type']) => {
  switch (type) {
    case 'LOAD':
      return <Database size={16} />;
    case 'JOIN':
      return <Link2 size={16} />;
    case 'UNION':
      return <Layers size={16} />;
    case 'FILTER':
      return <Filter size={16} />;
    case 'GROUP':
    case 'AGGREGATE':
      return <BarChart3 size={16} />;
    case 'SORT':
      return <ArrowUpDown size={16} />;
    case 'SELECT':
      return <Database size={16} />;
    case 'CUSTOM':
      return <Code size={16} />;
    default:
      return <GitBranch size={16} />;
  }
};

export const getStageColor = (type: TransformationStage['type']) => {
  switch (type) {
    case 'LOAD':
      return '#10b981';
    case 'JOIN':
      return '#3b82f6';
    case 'UNION':
      return '#8b5cf6';
    case 'FILTER':
      return '#f59e0b';
    case 'GROUP':
    case 'AGGREGATE':
      return '#ec4899';
    case 'SORT':
      return '#06b6d4';
    case 'SELECT':
      return '#14b8a6';
    case 'CUSTOM':
      return '#6b7280';
    default:
      return '#9ca3af';
  }
};

interface Props {
  stages: TransformationStage[];
  tables: Array<{ id: string; name: string }>;
  onStageEdit: (stage: TransformationStage) => void;
  onStageStartEdit: (stageId: string) => void;
  onStageDelete: (stageId: string) => void;
  onStageAdd: () => void;
  editingStageId: string | null;
  newStage: TransformationStage | null;
}


const renderStageDetails = (stage: TransformationStage, themeConfig: ReturnType<typeof useTheme>['themeConfig']) => {
  const { type, data } = stage;
  
  if (!data) return null;

  switch (type) {
    case 'LOAD':
      return (
        <div style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, marginTop: '4px' }}>
          <div><strong>File:</strong> {data.fileName || 'Unknown'}</div>
          <div><strong>Table:</strong> {data.tableName || 'Unknown'}</div>
        </div>
      );
      
    case 'JOIN':
      return (
        <div style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, marginTop: '4px' }}>
          <div><strong>Type:</strong> {data.joinType || 'INNER'}</div>
          <div><strong>Left Table:</strong> {data.leftTable || 'Unknown'}</div>
          <div><strong>Right Table:</strong> {data.rightTable || 'Unknown'}</div>
          <div><strong>Left Key:</strong> {data.leftKey || 'N/A'}</div>
          <div><strong>Right Key:</strong> {data.rightKey || 'N/A'}</div>
          {data.condition && <div><strong>Condition:</strong> {data.condition}</div>}
        </div>
      );
      
    case 'UNION':
      return (
        <div style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, marginTop: '4px' }}>
          <div><strong>Type:</strong> {data.unionType || 'UNION'}</div>
          <div><strong>Tables:</strong> {data.tables?.join(', ') || 'N/A'}</div>
        </div>
      );
      
    case 'FILTER':
      return (
        <div style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, marginTop: '4px' }}>
          <div><strong>Table:</strong> {data.table || 'Unknown'}</div>
          {data.conditions && data.conditions.length > 0 ? (
            <div>
              <strong>Conditions:</strong>
              {data.conditions.map((cond, i) => (
                <div key={i} style={{ marginLeft: '8px' }}>
                  {cond.column} {cond.operator} {String(cond.value)}
                  {cond.logic && ` ${cond.logic}`}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <strong>Column:</strong> {data.column || 'N/A'} 
              <strong> Operator:</strong> {data.operator || 'N/A'} 
              <strong> Value:</strong> {String(data.value || 'N/A')}
            </div>
          )}
        </div>
      );
      
    case 'GROUP':
      return (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          <div><strong>Group By:</strong> {data.groupBy?.join(', ') || 'N/A'}</div>
          {data.aggregations && data.aggregations.length > 0 && (
            <div>
              <strong>Aggregations:</strong>
              {data.aggregations.map((agg, i) => (
                <div key={i} style={{ marginLeft: '8px' }}>
                  {agg.function}({agg.column}){agg.alias ? ` AS ${agg.alias}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      );
      
    case 'SELECT':
      return (
        <div style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, marginTop: '4px' }}>
          <div><strong>Columns:</strong> {data.columns?.join(', ') || 'All'}</div>
        </div>
      );
      
    case 'SORT':
      return (
        <div style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, marginTop: '4px' }}>
          {data.orderBy && data.orderBy.length > 0 ? (
            <div>
              <strong>Order By:</strong>
              {data.orderBy.map((order, i) => (
                <div key={i} style={{ marginLeft: '8px' }}>
                  {order.column} {order.direction}
                </div>
              ))}
            </div>
          ) : (
            <div>No sort specified</div>
          )}
        </div>
      );
      
    case 'CUSTOM':
      return (
        <div style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, marginTop: '4px' }}>
          <div><strong>SQL:</strong></div>
          <pre style={{ 
            background: themeConfig.colors.surface, 
            padding: '8px', 
            borderRadius: '4px', 
            fontSize: '11px',
            overflow: 'auto',
            maxHeight: '100px',
            color: themeConfig.colors.text,
            border: `1px solid ${themeConfig.colors.border}`
          }}>
            {data.sql || 'N/A'}
          </pre>
        </div>
      );
      
    default:
      return null;
  }
};

export function TransformationStages({ stages, tables, onStageEdit, onStageStartEdit, onStageDelete, onStageAdd, editingStageId, newStage }: Props) {
  const { themeConfig } = useTheme();
  
  return (
    <div style={{
      padding: '20px',
      background: themeConfig.colors.surface,
      borderRadius: '8px',
      border: `1px solid ${themeConfig.colors.border}`,
      height: 'fit-content'
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0', 
        fontSize: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: themeConfig.colors.text
      }}>
        <GitBranch size={18} />
        Transformation Pipeline ({stages.length} stages)
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1 && !newStage;
          const isEditing = editingStageId === stage.id;
          
          return (
            <div key={stage.id} style={{ position: 'relative' }}>
              {/* Connection line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '32px',
                  width: '2px',
                  height: '20px',
                  background: themeConfig.colors.border,
                  zIndex: 0
                }} />
              )}
              
              {isEditing ? (
                <EditableStageCard
                  stage={stage}
                  tables={tables}
                  onSave={(updatedStage) => {
                    onStageEdit(updatedStage);
                  }}
                  onCancel={() => {
                    // Cancel editing - call start edit with null to cancel
                    onStageStartEdit('');
                  }}
                  onDelete={onStageDelete}
                />
              ) : (
                <div style={{
                  background: themeConfig.colors.surfaceElevated,
                  border: `2px solid ${getStageColor(stage.type)}`,
                  borderRadius: '8px',
                  padding: '12px',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: themeConfig.shadows.sm
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: getStageColor(stage.type),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getStageIcon(stage.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <strong style={{ color: getStageColor(stage.type) }}>{stage.type}</strong>
                        <span style={{ 
                          fontSize: '11px', 
                          color: themeConfig.colors.textTertiary,
                          background: themeConfig.colors.surface,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          #{index + 1}
                        </span>
                        <span style={{ fontSize: '11px', color: themeConfig.colors.textTertiary, marginLeft: 'auto' }}>
                          {new Date(stage.timestamp).toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => onStageStartEdit(stage.id)}
                          style={{
                            padding: '4px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: themeConfig.colors.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = themeConfig.colors.primary}
                          onMouseLeave={(e) => e.currentTarget.style.color = themeConfig.colors.textSecondary}
                          title="Edit stage"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                      <div style={{ fontSize: '13px', color: themeConfig.colors.textSecondary }}>
                        {stage.description}
                      </div>
                      {renderStageDetails(stage, themeConfig)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* New stage card */}
        {newStage && (
          <div style={{ position: 'relative' }}>
            <EditableStageCard
              stage={null}
              tables={tables}
              onSave={(stage) => {
                onStageEdit(stage);
              }}
              onCancel={() => {
                // Cancel adding new stage
                onStageAdd();
              }}
            />
          </div>
        )}
        
        {/* Add Stage Button at bottom */}
        <button
          onClick={onStageAdd}
          style={{
            width: '100%',
            padding: '10px',
            background: themeConfig.colors.surface,
            color: themeConfig.colors.primary,
            border: `1px dashed ${themeConfig.colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = themeConfig.colors.surfaceElevated;
            e.currentTarget.style.borderColor = themeConfig.colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = themeConfig.colors.surface;
            e.currentTarget.style.borderColor = themeConfig.colors.border;
          }}
        >
          <Plus size={16} />
          Add Stage
        </button>
      </div>
    </div>
  );
}

