// Type definitions for transformation stages

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL OUTER';
export type FilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN';
export type UnionType = 'UNION' | 'UNION ALL';

export interface TransformationStage {
  id: string;
  type: 'LOAD' | 'JOIN' | 'UNION' | 'FILTER' | 'GROUP' | 'SELECT' | 'SORT' | 'AGGREGATE' | 'CUSTOM';
  description: string;
  timestamp: Date;
  
  // Stage-specific data
  data?: {
    // For LOAD
    tableName?: string;
    fileName?: string;
    
    // For JOIN
    joinType?: JoinType;
    leftTable?: string;
    rightTable?: string;
    leftKey?: string;
    rightKey?: string;
    condition?: string;
    
    // For UNION
    unionType?: UnionType;
    tables?: string[];
    
    // For FILTER
    table?: string;
    column?: string;
    operator?: FilterOperator;
    value?: any;
    conditions?: Array<{
      column: string;
      operator: FilterOperator;
      value: any;
      logic?: 'AND' | 'OR';
    }>;
    
    // For GROUP
    groupBy?: string[];
    aggregations?: Array<{
      function: string;
      column: string;
      alias?: string;
    }>;
    
    // For SELECT
    columns?: string[];
    
    // For SORT
    orderBy?: Array<{
      column: string;
      direction: 'ASC' | 'DESC';
    }>;
    
    // For CUSTOM
    sql?: string;
  };
}

export interface TableData {
  id: string;
  name: string;
  fileName: string;
  schema: any[];
  rows: any[];
  createdAt: Date;
}

