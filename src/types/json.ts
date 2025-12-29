export type JsonValueType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonNode {
  id: string;
  key: string;
  value: unknown;
  type: JsonValueType;
  children?: JsonNode[];
  parentId?: string;
  expanded?: boolean;
}

export interface JsonStore {
  nodes: JsonNode[];
  history: JsonNode[][];
  historyIndex: number;
  searchTerm: string;
  validationError: string | null;
  
  // Actions
  setNodes: (nodes: JsonNode[]) => void;
  importJson: (json: string) => void;
  updateNode: (id: string, updates: Partial<JsonNode>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  addChild: (parentId: string, type: JsonValueType) => void;
  moveNode: (activeId: string, overId: string) => void;
  toggleExpand: (id: string) => void;
  setSearchTerm: (term: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getJson: () => string;
}

