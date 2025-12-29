import { create } from 'zustand';
import type { JsonNode, JsonValueType } from '../types/json';
import {
  parseJsonToNodes,
  nodesToJson,
  updateNodeInTree,
  deleteNodeFromTree,
  deepCloneNode,
  createNewNode,
  findNodeById,
  findParentNode,
  reindexArrayChildren,
  resetIdCounter,
} from '../utils/jsonParser';
import { validateJson } from '../utils/validation';

const DEFAULT_JSON = {
  name: 'JSON Editor',
  version: '1.0.0',
  features: ['树形编辑', '拖拽排序', '实时预览'],
  settings: {
    theme: 'dark',
    autoSave: true,
    indentSize: 2,
  },
  count: 42,
  enabled: true,
  metadata: null,
};

interface JsonStoreState {
  nodes: JsonNode[];
  history: JsonNode[][];
  historyIndex: number;
  searchTerm: string;
  validationError: string | null;
}

interface JsonStoreActions {
  setNodes: (nodes: JsonNode[]) => void;
  importJson: (json: string) => void;
  updateNode: (id: string, updates: Partial<JsonNode>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  addChild: (parentId: string, type: JsonValueType) => void;
  moveNode: (activeId: string, overId: string) => void;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSearchTerm: (term: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getJson: () => string;
}

const MAX_HISTORY = 50;

const pushToHistory = (
  state: JsonStoreState,
  newNodes: JsonNode[]
): Partial<JsonStoreState> => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(newNodes)));
  
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  
  return {
    nodes: newNodes,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const useJsonStore = create<JsonStoreState & JsonStoreActions>(
  (set, get) => {
    resetIdCounter();
    const initialNode = parseJsonToNodes(DEFAULT_JSON);
    const initialNodes = [initialNode];

    return {
      nodes: initialNodes,
      history: [JSON.parse(JSON.stringify(initialNodes))],
      historyIndex: 0,
      searchTerm: '',
      validationError: null,

      setNodes: (nodes) => {
        set((state) => pushToHistory(state, nodes));
      },

      importJson: (jsonString) => {
        const validation = validateJson(jsonString);
        if (!validation.valid) {
          set({ validationError: validation.error || '无效的 JSON' });
          return;
        }

        try {
          resetIdCounter();
          const parsed = JSON.parse(jsonString);
          const rootNode = parseJsonToNodes(parsed);
          set((state) => ({
            ...pushToHistory(state, [rootNode]),
            validationError: null,
          }));
        } catch (e) {
          set({ validationError: (e as Error).message });
        }
      },

      updateNode: (id, updates) => {
        const { nodes } = get();
        
        // If updating value type, handle children appropriately
        if (updates.type && updates.type !== findNodeById(nodes, id)?.type) {
          const node = findNodeById(nodes, id);
          if (node) {
            if (updates.type === 'object' || updates.type === 'array') {
              updates.children = [];
              updates.expanded = true;
            } else {
              updates.children = undefined;
            }
          }
        }
        
        const newNodes = updateNodeInTree(nodes, id, updates);
        set((state) => pushToHistory(state, newNodes));
      },

      deleteNode: (id) => {
        const { nodes } = get();
        const parent = findParentNode(nodes, id);
        let newNodes = deleteNodeFromTree(nodes, id);
        
        // Reindex array children if parent is an array
        if (parent && parent.type === 'array') {
          newNodes = updateNodeInTree(
            newNodes,
            parent.id,
            reindexArrayChildren({
              ...parent,
              children: parent.children?.filter((c) => c.id !== id),
            })
          );
        }
        
        set((state) => pushToHistory(state, newNodes));
      },

      duplicateNode: (id) => {
        const { nodes } = get();
        const node = findNodeById(nodes, id);
        const parent = findParentNode(nodes, id);
        
        if (!node) return;

        const cloned = deepCloneNode(node, parent?.id);
        
        if (parent && parent.children) {
          const index = parent.children.findIndex((c) => c.id === id);
          const newChildren = [...parent.children];
          newChildren.splice(index + 1, 0, cloned);
          
          let newNodes = updateNodeInTree(nodes, parent.id, { children: newChildren });
          
          // Reindex if parent is array
          if (parent.type === 'array') {
            const updatedParent = findNodeById(newNodes, parent.id);
            if (updatedParent) {
              newNodes = updateNodeInTree(
                newNodes,
                parent.id,
                reindexArrayChildren(updatedParent)
              );
            }
          }
          
          set((state) => pushToHistory(state, newNodes));
        } else {
          // Root level duplication
          set((state) => pushToHistory(state, [...nodes, cloned]));
        }
      },

      addChild: (parentId, type) => {
        const { nodes } = get();
        const parent = findNodeById(nodes, parentId);
        
        if (!parent || (parent.type !== 'object' && parent.type !== 'array')) {
          return;
        }

        const key = parent.type === 'array' 
          ? String(parent.children?.length || 0)
          : 'newKey';
        const newChild = createNewNode(key, type, parentId);
        
        const newChildren = [...(parent.children || []), newChild];
        const newNodes = updateNodeInTree(nodes, parentId, { children: newChildren });
        
        set((state) => pushToHistory(state, newNodes));
      },

      moveNode: (activeId, overId) => {
        const { nodes } = get();
        
        if (activeId === overId) return;
        
        const activeNode = findNodeById(nodes, activeId);
        const overNode = findNodeById(nodes, overId);
        const activeParent = findParentNode(nodes, activeId);
        const overParent = findParentNode(nodes, overId);
        
        if (!activeNode || !overNode || !activeParent || !overParent) return;
        
        // Only allow moving within same parent for now
        if (activeParent.id !== overParent.id) return;
        
        const siblings = [...(activeParent.children || [])];
        const activeIndex = siblings.findIndex((n) => n.id === activeId);
        const overIndex = siblings.findIndex((n) => n.id === overId);
        
        if (activeIndex === -1 || overIndex === -1) return;
        
        // Remove from old position and insert at new position
        const [removed] = siblings.splice(activeIndex, 1);
        siblings.splice(overIndex, 0, removed);
        
        let newNodes = updateNodeInTree(nodes, activeParent.id, { children: siblings });
        
        // Reindex if parent is array
        if (activeParent.type === 'array') {
          const updatedParent = findNodeById(newNodes, activeParent.id);
          if (updatedParent) {
            newNodes = updateNodeInTree(
              newNodes,
              activeParent.id,
              reindexArrayChildren(updatedParent)
            );
          }
        }
        
        set((state) => pushToHistory(state, newNodes));
      },

      toggleExpand: (id) => {
        const { nodes } = get();
        const node = findNodeById(nodes, id);
        if (node) {
          const newNodes = updateNodeInTree(nodes, id, { expanded: !node.expanded });
          set({ nodes: newNodes });
        }
      },

      expandAll: () => {
        const { nodes } = get();
        const setExpandedRecursive = (nodeList: JsonNode[], expanded: boolean): JsonNode[] => {
          return nodeList.map((node) => ({
            ...node,
            expanded: node.children ? expanded : node.expanded,
            children: node.children ? setExpandedRecursive(node.children, expanded) : undefined,
          }));
        };
        set({ nodes: setExpandedRecursive(nodes, true) });
      },

      collapseAll: () => {
        const { nodes } = get();
        const setExpandedRecursive = (nodeList: JsonNode[], expanded: boolean): JsonNode[] => {
          return nodeList.map((node) => ({
            ...node,
            expanded: node.children ? expanded : node.expanded,
            children: node.children ? setExpandedRecursive(node.children, expanded) : undefined,
          }));
        };
        set({ nodes: setExpandedRecursive(nodes, false) });
      },

      setSearchTerm: (term) => {
        set({ searchTerm: term });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
          set({
            historyIndex: historyIndex - 1,
            nodes: JSON.parse(JSON.stringify(history[historyIndex - 1])),
          });
        }
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
          set({
            historyIndex: historyIndex + 1,
            nodes: JSON.parse(JSON.stringify(history[historyIndex + 1])),
          });
        }
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { historyIndex, history } = get();
        return historyIndex < history.length - 1;
      },

      getJson: () => {
        const { nodes } = get();
        if (nodes.length === 0) return '{}';
        return JSON.stringify(nodesToJson(nodes[0]), null, 2);
      },
    };
  }
);

