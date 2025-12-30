import { useMemo } from 'react';
import { useTheme } from './ThemeProvider';
import { EditableStageCard } from './EditableStageCard';
import { getStageIcon, getStageColor } from './TransformationStages';
import type { TransformationStage } from './types';

interface StageNode {
  id: string;
  stage: TransformationStage;
  inputs: string[]; // IDs of input stages/tables
  level: number; // Depth in the graph
}

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

// Build dependency graph to understand stage relationships
function buildStageGraph(stages: TransformationStage[]): Map<string, StageNode> {
  const nodes = new Map<string, StageNode>();
  const tableMap = new Map<string, string>(); // table name -> stage id
  
  // First pass: create nodes and map tables
  stages.forEach((stage) => {
    const node: StageNode = {
      id: stage.id,
      stage,
      inputs: [],
      level: 0
    };
    nodes.set(stage.id, node);
    
    // Map output tables
    if (stage.type === 'LOAD' && stage.data?.tableName) {
      tableMap.set(stage.data.tableName, stage.id);
    }
  });
  
  // Second pass: build connections and calculate levels
  stages.forEach((stage) => {
    const node = nodes.get(stage.id);
    if (!node) return;
    
    switch (stage.type) {
      case 'JOIN':
        // JOIN has two inputs
        if (stage.data?.leftTable) {
          const leftInput = tableMap.get(stage.data.leftTable);
          if (leftInput) {
            node.inputs.push(leftInput);
          }
        }
        if (stage.data?.rightTable) {
          const rightInput = tableMap.get(stage.data.rightTable);
          if (rightInput) {
            node.inputs.push(rightInput);
          }
        }
        // Map output table
        if (stage.data?.leftTable && stage.data?.rightTable) {
          const outputTable = `joined_${stage.data.leftTable}_${stage.data.rightTable}`;
          tableMap.set(outputTable, stage.id);
        }
        break;
        
      case 'UNION':
        // UNION has multiple inputs
        if (stage.data?.tables) {
          stage.data.tables.forEach((tableName: string) => {
            const input = tableMap.get(tableName);
            if (input) {
              node.inputs.push(input);
            }
          });
        }
        break;
        
      case 'FILTER':
      case 'GROUP':
      case 'SELECT':
      case 'SORT':
        // These operations have one input (the table they operate on)
        if (stage.data?.table) {
          const input = tableMap.get(stage.data.table);
          if (input) {
            node.inputs.push(input);
          }
        }
        break;
    }
    
    // Calculate level based on inputs
    if (node.inputs.length > 0) {
      const maxInputLevel = Math.max(...node.inputs.map(id => nodes.get(id)?.level || 0));
      node.level = maxInputLevel + 1;
    }
  });
  
  return nodes;
}

export function StageGraph({ 
  stages, 
  tables, 
  onStageEdit, 
  onStageStartEdit, 
  onStageDelete, 
  onStageAdd,
  editingStageId,
  newStage 
}: Props) {
  const { themeConfig } = useTheme();
  
  const graph = useMemo(() => buildStageGraph(stages), [stages]);
  
  // Group stages by level for better layout
  const stagesByLevel = useMemo(() => {
    const levels = new Map<number, TransformationStage[]>();
    stages.forEach((stage) => {
      const node = graph.get(stage.id);
      const level = node?.level || 0;
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(stage);
    });
    return Array.from(levels.entries()).sort((a, b) => a[0] - b[0]);
  }, [stages, graph]);
  
  return (
    <div style={{
      padding: '20px',
      background: themeConfig.colors.surface,
      borderRadius: '8px',
      border: `1px solid ${themeConfig.colors.border}`,
      height: 'fit-content',
      minHeight: '400px'
    }}>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        fontSize: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: themeConfig.colors.text
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Transformation Pipeline ({stages.length} stages)
      </h3>
      
      {stages.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: themeConfig.colors.textSecondary 
        }}>
          No transformation stages yet. Add a stage to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stagesByLevel.map(([level, levelStages]) => (
            <div key={level} style={{ position: 'relative' }}>
              {/* Level indicator */}
              {level > 0 && (
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '-8px',
                  width: '2px',
                  height: '16px',
                  background: themeConfig.colors.border,
                  zIndex: 0
                }} />
              )}
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                position: 'relative',
                paddingLeft: level > 0 ? '40px' : '0'
              }}>
                {levelStages.map((stage, stageIndex) => {
                  const node = graph.get(stage.id);
                  const isEditing = editingStageId === stage.id;
                  const hasMultipleInputs = node?.inputs.length && node.inputs.length > 1;
                  const isFirstInLevel = stageIndex === 0;
                  
                  return (
                    <div key={stage.id} style={{ position: 'relative' }}>
                      {/* Connection line from previous level */}
                      {level > 0 && isFirstInLevel && (
                        <div style={{
                          position: 'absolute',
                          left: '-28px',
                          top: '16px',
                          width: '28px',
                          height: '2px',
                          background: themeConfig.colors.border,
                          zIndex: 0
                        }} />
                      )}
                      
                      {/* Multiple input indicator */}
                      {hasMultipleInputs && (
                        <div style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          zIndex: 1
                        }}>
                          {node.inputs.map((inputId) => {
                            const inputNode = graph.get(inputId);
                            return (
                              <div
                                key={inputId}
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: inputNode ? getStageColor(inputNode.stage.type) : themeConfig.colors.border,
                                  border: `2px solid ${themeConfig.colors.surface}`
                                }}
                                title={inputNode?.stage.type}
                              />
                            );
                          })}
                        </div>
                      )}
                      
                      {isEditing ? (
                        <EditableStageCard
                          stage={stage}
                          tables={tables}
                          onSave={async (updatedStage) => {
                            await onStageEdit(updatedStage);
                          }}
                          onCancel={() => {
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
                          boxShadow: themeConfig.shadows.sm,
                          position: 'relative',
                          zIndex: 1
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
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                marginBottom: '4px'
                              }}>
                                <strong style={{ 
                                  color: getStageColor(stage.type),
                                  fontSize: '13px'
                                }}>
                                  {stage.type}
                                </strong>
                                {stage.type === 'LOAD' && stage.data?.tableName && (
                                  <span style={{
                                    fontSize: '11px',
                                    color: themeConfig.colors.textSecondary,
                                    marginLeft: '6px'
                                  }}>
                                    {stage.data.tableName}
                                  </span>
                                )}
                                {hasMultipleInputs && (
                                  <span style={{
                                    fontSize: '10px',
                                    color: themeConfig.colors.textTertiary,
                                    background: themeConfig.colors.surface,
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}>
                                    {node.inputs.length} inputs
                                  </span>
                                )}
                                <button
                                  onClick={() => onStageStartEdit(stage.id)}
                                  style={{
                                    padding: '4px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: themeConfig.colors.textSecondary,
                                    marginLeft: 'auto',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Edit stage"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: themeConfig.colors.textSecondary,
                                wordBreak: 'break-word'
                              }}>
                                {stage.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* New stage card */}
      {newStage && (
        <div style={{ marginTop: '12px' }}>
          <EditableStageCard
            stage={null}
            tables={tables}
            onSave={async (stage) => {
              await onStageEdit(stage);
            }}
            onCancel={() => {
              onStageAdd();
            }}
          />
        </div>
      )}
      
      {/* Add Stage Button */}
      <button
        onClick={onStageAdd}
        style={{
          width: '100%',
          padding: '10px',
          marginTop: '12px',
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Stage
      </button>
    </div>
  );
}

