import { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  Position,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme } from './ThemeProvider';
import { EditableStageCard } from './EditableStageCard';
import { getStageIcon, getStageColor } from './TransformationStages';
import type { TransformationStage } from './types';

interface StageNode {
  id: string;
  stage: TransformationStage;
  inputs: string[];
  level: number;
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
      level: 0
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
  
  return nodes;
}

// Custom node component
function StageNodeComponent({ data }: { data: any }) {
  const { themeConfig } = useTheme();
  const { stage, isEditing, hasMultipleInputs, onEdit, onDelete, inputCount } = data;
  
  if (isEditing) {
    return (
      <div style={{ width: '280px', position: 'relative' }}>
        <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
        <EditableStageCard
          stage={stage}
          tables={data.tables}
          onSave={data.onSave}
          onCancel={data.onCancel}
          onDelete={onDelete}
        />
        <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      </div>
    );
  }
  
  // Determine number of source handles needed (for nodes with multiple outputs)
  const sourceHandleCount = 1; // Most nodes have one output
  // Determine number of target handles needed (for nodes with multiple inputs like JOIN/UNION)
  const targetHandleCount = hasMultipleInputs && inputCount > 1 ? inputCount : 1;
  
  return (
    <div style={{
      background: themeConfig.colors.surfaceElevated,
      border: `2px solid ${getStageColor(stage.type)}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: themeConfig.shadows.sm,
      width: '280px',
      minWidth: '280px',
      position: 'relative'
    }}>
      {/* Target handles (top) - where connections enter */}
      {targetHandleCount > 1 ? (
        Array.from({ length: targetHandleCount }).map((_, idx) => (
          <Handle
            key={`target-${idx}`}
            type="target"
            position={Position.Top}
            id={`target-${idx}`}
            style={{
              left: `${50 + (idx - (targetHandleCount - 1) / 2) * 15}%`,
              visibility: 'hidden'
            }}
          />
        ))
      ) : (
        <Handle type="target" position={Position.Top} id="target" style={{ visibility: 'hidden' }} />
      )}
      
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
                {inputCount} inputs
              </span>
            )}
            <button
              onClick={() => onEdit(stage.id)}
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
      
      {/* Source handles (bottom) - where connections leave */}
      {sourceHandleCount > 1 ? (
        Array.from({ length: sourceHandleCount }).map((_, idx) => (
          <Handle
            key={`source-${idx}`}
            type="source"
            position={Position.Bottom}
            id={`source-${idx}`}
            style={{
              left: `${50 + (idx - (sourceHandleCount - 1) / 2) * 15}%`,
              visibility: 'hidden'
            }}
          />
        ))
      ) : (
        <Handle type="source" position={Position.Bottom} id="source" style={{ visibility: 'hidden' }} />
      )}
    </div>
  );
}

const nodeTypes = {
  stage: StageNodeComponent,
};

export function StageGraphFlow({ 
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
  
  // Convert stages to react-flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const verticalGap = 150;
    const horizontalCenter = 200;
    
    // Create nodes
    stages.forEach((stage, index) => {
      const node = graph.get(stage.id);
      if (!node) return;
      
      const isEditing = editingStageId === stage.id;
      const hasMultipleInputs = node.inputs.length > 1;
      
      nodes.push({
        id: stage.id,
        type: 'stage',
        position: { 
          x: horizontalCenter - 140, // Center the 280px wide node
          y: index * verticalGap 
        },
        data: {
          stage,
          isEditing,
          hasMultipleInputs,
          inputCount: node.inputs.length,
          tables,
          onSave: async (updatedStage: TransformationStage) => {
            await onStageEdit(updatedStage);
          },
          onCancel: () => {
            onStageStartEdit('');
          },
          onEdit: onStageStartEdit,
          onDelete: onStageDelete,
        },
        draggable: !isEditing,
      });
    });
    
    // Create edges
    stages.forEach((stage, index) => {
      const node = graph.get(stage.id);
      if (!node) return;
      
      // Skip LOAD stages - they should not be linked to each other
      if (stage.type === 'LOAD') {
        return;
      }
      
      if (node.inputs.length > 0) {
        // Has explicit dependencies (JOIN/UNION) - connect to all inputs
        node.inputs.forEach((inputId, inputIndex) => {
          const totalInputs = node.inputs.length;
          const sourceHandle = 'source'; // Source is always on bottom
          const targetHandle = totalInputs > 1
            ? `target-${inputIndex}`
            : 'target';
          
          edges.push({
            id: `${inputId}-${stage.id}-${inputIndex}`,
            source: inputId,
            target: stage.id,
            sourceHandle,
            targetHandle,
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: {
              stroke: themeConfig.colors.border,
              strokeWidth: 2,
            },
          });
        });
      } else if (index > 0) {
        // General case: connect to previous stage, but skip if previous is LOAD
        const prevStage = stages[index - 1];
        if (prevStage.type !== 'LOAD') {
          edges.push({
            id: `${prevStage.id}-${stage.id}`,
            source: prevStage.id,
            target: stage.id,
            sourceHandle: 'source',
            targetHandle: 'target',
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: {
              stroke: themeConfig.colors.border,
              strokeWidth: 2,
            },
          });
        }
      }
    });
    
    return { initialNodes: nodes, initialEdges: edges };
  }, [stages, graph, editingStageId, tables, onStageEdit, onStageStartEdit, onStageDelete, themeConfig.colors.border]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Update nodes when stages change
  useEffect(() => {
    setNodes(prevNodes => {
      return initialNodes.map(node => {
        const existingNode = prevNodes.find(n => n.id === node.id);
        if (existingNode) {
          // Preserve position if node exists
          return {
            ...node,
            position: existingNode.position,
            data: {
              ...node.data,
              isEditing: editingStageId === node.id,
            },
          };
        }
        return node;
      });
    });
  }, [initialNodes, editingStageId, setNodes]);
  
  // Update edges when stages change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);
  
  // Prevent edge connection/editing
  const onConnect = useCallback(() => {
    // Disable edge creation
  }, []);
  
  const onEdgeUpdate = useCallback(() => {
    // Disable edge editing
    return false;
  }, []);
  
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
        <div style={{ width: '100%', height: '600px', minHeight: '400px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeUpdate={onEdgeUpdate}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
            nodesDraggable={true}
            nodesConnectable={false}
            edgesUpdatable={false}
            edgesFocusable={false}
            elementsSelectable={true}
            panOnDrag={[1, 2]} // Allow panning with left and middle mouse buttons
            zoomOnScroll={true}
            zoomOnPinch={true}
            preventScrolling={false}
            style={{
              background: themeConfig.colors.surface,
            }}
          >
            <Background color={themeConfig.colors.border} gap={16} />
            <Controls 
              showInteractive={false}
              style={{
                background: themeConfig.colors.surfaceElevated,
                border: `1px solid ${themeConfig.colors.border}`,
              }}
            />
          </ReactFlow>
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

