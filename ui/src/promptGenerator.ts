import type { TransformationStage } from './types';

/**
 * Validates a transformation stage to check if all required fields are filled
 */
export function validateStage(stage: TransformationStage): boolean {
  // Description is optional, so we don't validate it

  switch (stage.type) {
    case 'JOIN':
      return !!(stage.data?.leftTable && stage.data?.rightTable && stage.data?.leftKey && stage.data?.rightKey);
    
    case 'UNION':
      return !!(stage.data?.tables && Array.isArray(stage.data.tables) && stage.data.tables.length > 0);
    
    case 'FILTER':
      return !!(stage.data?.table && stage.data?.column && stage.data?.operator && stage.data?.value !== undefined && stage.data.value !== '');
    
    case 'GROUP':
      return !!(stage.data?.groupBy && Array.isArray(stage.data.groupBy) && stage.data.groupBy.length > 0);
    
    case 'SELECT':
      return !!(stage.data?.columns && Array.isArray(stage.data.columns) && stage.data.columns.length > 0);
    
    case 'SORT':
      return !!(stage.data?.orderBy && Array.isArray(stage.data.orderBy) && stage.data.orderBy.length > 0);
    
    case 'CUSTOM':
      return !!(stage.data?.sql && stage.data.sql.trim());
    
    case 'LOAD':
      return !!(stage.data?.tableName || stage.data?.fileName);
    
    default:
      return true; // For other types, just require description
  }
}

/**
 * Generates a natural language prompt from a single transformation stage
 */
export function generatePromptFromStage(stage: TransformationStage): string {
  if (!validateStage(stage)) {
    return '';
  }

  switch (stage.type) {
    case 'JOIN':
      if (stage.data?.leftTable && stage.data?.rightTable && stage.data?.leftKey && stage.data?.rightKey) {
        const joinType = stage.data.joinType || 'INNER';
        return `Perform a ${joinType} JOIN between ${stage.data.leftTable} and ${stage.data.rightTable} on ${stage.data.leftTable}.${stage.data.leftKey} = ${stage.data.rightTable}.${stage.data.rightKey}`;
      }
      break;

    case 'UNION':
      if (stage.data?.tables && stage.data.tables.length > 0) {
        const unionType = stage.data.unionType || 'UNION';
        return `Perform ${unionType} on tables: ${stage.data.tables.join(', ')}`;
      }
      break;

    case 'FILTER':
      if (stage.data?.table && stage.data?.column && stage.data?.operator && stage.data?.value !== undefined) {
        return `Filter ${stage.data.table} where ${stage.data.column} ${stage.data.operator} ${stage.data.value}`;
      }
      break;

    case 'GROUP':
      if (stage.data?.groupBy && stage.data.groupBy.length > 0) {
        const groupBy = stage.data.groupBy.join(', ');
        let aggText = '';
        if (stage.data.aggregations && stage.data.aggregations.length > 0) {
          aggText = ' with ' + stage.data.aggregations.map(agg => 
            `${agg.function}(${agg.column})${agg.alias ? ` as ${agg.alias}` : ''}`
          ).join(', ');
        }
        return `Group by ${groupBy}${aggText}`;
      }
      break;

    case 'SELECT':
      if (stage.data?.columns && stage.data.columns.length > 0) {
        return `Select columns: ${stage.data.columns.join(', ')}`;
      }
      break;

    case 'SORT':
      if (stage.data?.orderBy && stage.data.orderBy.length > 0) {
        const orderBy = stage.data.orderBy.map(o => 
          `${o.column} ${o.direction}`
        ).join(', ');
        return `Sort by ${orderBy}`;
      }
      break;

    case 'CUSTOM':
      if (stage.data?.sql) {
        return `Execute custom SQL: ${stage.data.sql}`;
      }
      break;

    default:
      if (stage.description) {
        return stage.description;
      }
  }

  return '';
}

/**
 * Generates a natural language prompt from transformation stages
 */
export function generatePromptFromStages(stages: TransformationStage[]): string {
  if (stages.length === 0) {
    return '';
  }

  const prompts: string[] = [];

  for (const stage of stages) {
    const prompt = generatePromptFromStage(stage);
    if (prompt) {
      prompts.push(prompt);
    }
  }

  return prompts.join('. ') + (prompts.length > 0 ? '.' : '');
}
