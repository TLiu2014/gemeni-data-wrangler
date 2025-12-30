/**
 * Fallback SQL parser to extract transformation stages from SQL
 * Used when Gemini doesn't return transformationStages
 */

export interface ParsedStage {
  type: 'LOAD' | 'JOIN' | 'UNION' | 'FILTER' | 'GROUP' | 'SELECT' | 'SORT' | 'AGGREGATE' | 'CUSTOM';
  description: string;
  data?: any;
}

export function parseSQLToStages(sql: string, explanation: string): ParsedStage[] {
  const stages: ParsedStage[] = [];
  const sqlUpper = sql.toUpperCase();
  
  // 1. Check for JOIN
  const joinMatch = sql.match(/(?:LEFT|RIGHT|FULL\s+OUTER|INNER)?\s+JOIN\s+(\w+)\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
  if (joinMatch) {
    const joinType = sqlUpper.includes('LEFT JOIN') ? 'LEFT' :
                     sqlUpper.includes('RIGHT JOIN') ? 'RIGHT' :
                     sqlUpper.includes('FULL OUTER JOIN') ? 'FULL OUTER' : 'INNER';
    
    // Extract table names from FROM and JOIN clauses
    const fromMatch = sql.match(/FROM\s+(\w+)\s+(\w+)/i);
    const leftTable = fromMatch ? fromMatch[1] : joinMatch[3];
    const rightTable = joinMatch[1];
    const leftKey = joinMatch[4];
    const rightKey = joinMatch[6];
    
    stages.push({
      type: 'JOIN',
      description: `${joinType} join ${leftTable} with ${rightTable}`,
      data: {
        joinType,
        leftTable,
        rightTable,
        leftKey,
        rightKey
      }
    });
  }
  
  // 2. Check for GROUP BY
  const groupByMatch = sql.match(/GROUP\s+BY\s+([^ORDER]+?)(?:\s+ORDER|\s*$)/i);
  if (groupByMatch) {
    const groupByColumns = groupByMatch[1].split(',').map(c => c.trim());
    
    // Extract aggregations from SELECT
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    const aggregations: any[] = [];
    if (selectMatch) {
      const selectClause = selectMatch[1];
      // Look for aggregate functions
      const aggMatches = selectClause.matchAll(/(SUM|COUNT|AVG|MAX|MIN|AVG)\s*\(([^)]+)\)(?:\s+AS\s+(\w+))?/gi);
      for (const match of aggMatches) {
        aggregations.push({
          function: match[1].toUpperCase(),
          column: match[2].trim(),
          alias: match[3] || undefined
        });
      }
    }
    
    stages.push({
      type: 'GROUP',
      description: `Group by ${groupByColumns.join(', ')}`,
      data: {
        groupBy: groupByColumns,
        aggregations: aggregations.length > 0 ? aggregations : undefined
      }
    });
  }
  
  // 3. Check for ORDER BY
  const orderByMatch = sql.match(/ORDER\s+BY\s+(\w+)\s+(ASC|DESC)/i);
  if (orderByMatch) {
    stages.push({
      type: 'SORT',
      description: `Sort by ${orderByMatch[1]} ${orderByMatch[2]}`,
      data: {
        orderBy: [{
          column: orderByMatch[1],
          direction: orderByMatch[2].toUpperCase() as 'ASC' | 'DESC'
        }]
      }
    });
  }
  
  // 4. Check for WHERE (FILTER)
  const whereMatch = sql.match(/WHERE\s+(\w+)\s*([=<>!]+|LIKE|IN|NOT\s+IN)\s*(.+?)(?:\s+GROUP|\s+ORDER|\s*$)/i);
  if (whereMatch) {
    stages.push({
      type: 'FILTER',
      description: `Filter where ${whereMatch[1]} ${whereMatch[2]} ${whereMatch[3]}`,
      data: {
        table: sql.match(/FROM\s+(\w+)/i)?.[1] || '',
        column: whereMatch[1],
        operator: whereMatch[2].replace(/\s+/g, ' ').trim(),
        value: whereMatch[3].trim().replace(/['"]/g, '')
      }
    });
  }
  
  // 5. Check for UNION
  if (sqlUpper.includes('UNION')) {
    const tables = [];
    const fromMatches = sql.matchAll(/FROM\s+(\w+)/gi);
    for (const match of fromMatches) {
      tables.push(match[1]);
    }
    
    stages.push({
      type: 'UNION',
      description: `Union ${tables.join(' and ')}`,
      data: {
        unionType: sqlUpper.includes('UNION ALL') ? 'UNION ALL' : 'UNION',
        tables
      }
    });
  }
  
  // 6. Check for SELECT (specific columns, not *)
  if (!sqlUpper.includes('SELECT *')) {
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selectMatch && !groupByMatch) { // Don't add SELECT if we already have GROUP
      const columns = selectMatch[1].split(',').map(c => c.trim().split(/\s+AS\s+/i)[0].trim());
      stages.push({
        type: 'SELECT',
        description: `Select columns: ${columns.join(', ')}`,
        data: { columns }
      });
    }
  }
  
  // If no stages were found, return CUSTOM
  if (stages.length === 0) {
    stages.push({
      type: 'CUSTOM',
      description: explanation || 'Custom SQL transformation',
      data: { sql }
    });
  }
  
  return stages;
}

