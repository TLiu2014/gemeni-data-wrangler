import { useMemo } from 'react';
import { useTheme } from './ThemeProvider';
import { EditableStageCard } from './EditableStageCard';
import { getStageIcon, getStageColor } from './TransformationStages';
import type { TransformationStage } from './types';

interface StageNode {
  id: string;
  stage: TransformationStage;
  inputs: string[];
  level: number;
  x: number;
  y: number;
}

interface Props {
  stages: TransformationStage[];
  tables: Array<{ id: string; name: string }>;
  onStageEdit: (stage: TransformationStage) => Promise<void> | void;
  onStageStartEdit: (stageId: string) => void;
  onStageDelete: (stageId: string) => void;
  onStageAdd: () => void;
  editingStageId: string | null;
  newStage: TransformationStage | null;
}

// Build dependency graph
function buildStageGraph(stages: TransformationStage[]): Map<string, StageNode> {
  const nodes = new Map<string, StageNode>();
  const tableMap = new Map<string, string>();
  
  stages.forEach((stage) => {
    const node: StageNode = {
      id: stage.id,
      stage,
      inputs: [],
      level: 0,
      x: 0,
      y: 0
    };
    nodes.set(stage.id, node);
    
    if (stage.type === 'LOAD' && stage.data?.tableName) {
      tableMap.set(stage.data.tableName, stage.id);
    }
  });
  
  stages.forEach((stage) => {
    const node = nodes.get(stage.id);
    if (!node) return;
    
    switch (stage.type) {
      case 'JOIN':
        if (stage.data?.leftTable) {
          const leftInput = tableMap.get(stage.data.leftTable);
          if (leftInput) node.inputs.push(leftInput);
        }
        if (stage.data?.rightTable) {
          const rightInput = tableMap.get(stage.data.rightTable);
          if (rightInput) node.inputs.push(rightInput);
        }
        if (stage.data?.leftTable && stage.data?.rightTable) {
          const outputTable = `joined_${stage.data.leftTable}_${stage.data.rightTable}`;
          tableMap.set(outputTable, stage.id);
        }
        break;
      case 'UNION':
        if (stage.data?.tables) {
          stage.data.tables.forEach((tableName: string) => {
            const input = tableMap.get(tableName);
            if (input) node.inputs.push(input);
          });
        }
        break;
      case 'FILTER':
      case 'GROUP':
      case 'SELECT':
      case 'SORT':
        if (stage.data?.table) {
          const input = tableMap.get(stage.data.table);
          if (input) node.inputs.push(input);
        }
        break;
    }
    
    if (node.inputs.length > 0) {
      const maxInputLevel = Math.max(...node.inputs.map(id => nodes.get(id)?.level || 0));
      node.level = maxInputLevel + 1;
    }
  });
  
  // Calculate positions - arrange vertically in order
  // For simple cases, maintain the order of stages in the array
  // For JOIN/UNION with dependencies, position based on level
  const verticalGap = 120;
  
  // Position nodes vertically - maintain original order for simple flow
  stages.forEach((stage, index) => {
    const node = nodes.get(stage.id);
    if (node) {
      node.x = 0; // All nodes centered horizontally
      // Use level to determine position, but maintain order for same-level stages
      node.y = index * verticalGap;
    }
  });
  
  return nodes;
}

export function StageGraphSVG({ 
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
  
  const nodes = Array.from(graph.values());
  const connections: Array<{ from: StageNode; to: StageNode }> = [];
  
  // Build connections:
  // 1. For stages with explicit dependencies (JOIN/UNION), use those
  // 2. For general cases, connect previous stage to next stage
  stages.forEach((stage, index) => {
    const node = graph.get(stage.id);
    if (!node) return;
    
    if (node.inputs.length > 0) {
      // Has explicit dependencies (JOIN/UNION) - connect to all inputs
      node.inputs.forEach((inputId) => {
        const inputNode = graph.get(inputId);
        if (inputNode) {
          connections.push({ from: inputNode, to: node });
        }
      });
    } else if (index > 0) {
      // General case: connect to previous stage
      const prevStage = stages[index - 1];
      const prevNode = graph.get(prevStage.id);
      if (prevNode) {
        connections.push({ from: prevNode, to: node });
      }
    }
  });
  
  // Calculate SVG dimensions for vertical layout
  const svgWidth = 300;
  const svgHeight = Math.max(400, stages.length * 120 + 40);
  
  return (
    <div style={{
      padding: '20px',
      background: themeConfig.colors.surface,
      borderRadius: '8px',
      border: `1px solid ${themeConfig.colors.border}`,
      height: 'fit-content',
      minHeight: '400px',
      position: 'relative'
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
        <div style={{ position: 'relative', width: '100%', overflow: 'auto', minHeight: '400px' }}>
          <svg
            width={svgWidth}
            height={svgHeight}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill={themeConfig.colors.border}
                />
              </marker>
            </defs>
            
            {connections.map(({ from, to }) => {
              // Vertical layout: from bottom of source to top of target
              const fromX = from.x + 140; // Center of source node
              const fromY = from.y + 100; // Bottom of source node
              const toX = to.x + 140; // Center of target node
              const toY = to.y; // Top of target node
              
              // For multiple inputs (JOIN/UNION), spread connection points
              const inputIndex = to.inputs.indexOf(from.id);
              const totalInputs = to.inputs.length;
              const spreadWidth = Math.min(80, totalInputs * 20);
              const offsetX = totalInputs > 1 
                ? (inputIndex - (totalInputs - 1) / 2) * (spreadWidth / (totalInputs - 1 || 1))
                : 0;
              
              const adjustedFromX = fromX + offsetX;
              const adjustedToX = toX + offsetX;
              
              // Simple vertical line with slight curve for multiple inputs
              const midY = (fromY + toY) / 2;
              const path = totalInputs > 1
                ? `M ${adjustedFromX} ${fromY} L ${adjustedFromX} ${midY} L ${adjustedToX} ${midY} L ${adjustedToX} ${toY}`
                : `M ${fromX} ${fromY} L ${toX} ${toY}`;
              
              return (
                <path
                  key={`${from.id}-${to.id}`}
                  d={path}
                  fill="none"
                  stroke={themeConfig.colors.border}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          </svg>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            {nodes.map((node) => {
              const isEditing = editingStageId === node.id;
              const hasMultipleInputs = node.inputs.length > 1;
              
              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: `${node.y}px`,
                    width: '280px',
                    zIndex: 1
                  }}
                >
                  {isEditing ? (
                    <EditableStageCard
                      stage={node.stage}
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
                      border: `2px solid ${getStageColor(node.stage.type)}`,
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: themeConfig.shadows.sm,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: getStageColor(node.stage.type),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {getStageIcon(node.stage.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <strong style={{ 
                              color: getStageColor(node.stage.type),
                              fontSize: '13px'
                            }}>
                              {node.stage.type}
                            </strong>
                            {node.stage.type === 'LOAD' && node.stage.data?.tableName && (
                              <span style={{
                                fontSize: '11px',
                                color: themeConfig.colors.textSecondary,
                                marginLeft: '6px'
                              }}>
                                {node.stage.data.tableName}
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
                              onClick={() => onStageStartEdit(node.id)}
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
                            {node.stage.description}
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
      )}
      
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

