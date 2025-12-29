import type { JsonNode, JsonValueType } from '../types/json';

let idCounter = 0;

const generateId = (): string => {
  return `node_${++idCounter}_${Date.now()}`;
};

export const resetIdCounter = () => {
  idCounter = 0;
};

export const getValueType = (value: unknown): JsonValueType => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const type = typeof value;
  if (type === 'object') return 'object';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  return 'string';
};

export const parseJsonToNodes = (
  json: unknown,
  key: string = 'root',
  parentId?: string
): JsonNode => {
  const type = getValueType(json);
  const id = generateId();

  const node: JsonNode = {
    id,
    key,
    value: json,
    type,
    parentId,
    expanded: true,
  };

  if (type === 'object' && json !== null) {
    node.children = Object.entries(json as Record<string, unknown>).map(
      ([childKey, childValue]) => parseJsonToNodes(childValue, childKey, id)
    );
  } else if (type === 'array') {
    node.children = (json as unknown[]).map((item, index) =>
      parseJsonToNodes(item, String(index), id)
    );
  }

  return node;
};

export const nodesToJson = (node: JsonNode): unknown => {
  if (node.type === 'object') {
    const obj: Record<string, unknown> = {};
    node.children?.forEach((child) => {
      obj[child.key] = nodesToJson(child);
    });
    return obj;
  }

  if (node.type === 'array') {
    return node.children?.map((child) => nodesToJson(child)) || [];
  }

  return node.value;
};

export const findNodeById = (
  nodes: JsonNode[],
  id: string,
  index?: Map<string, JsonNode>
): JsonNode | undefined => {
  // 如果提供了索引，直接使用索引查找（O(1)）
  if (index) {
    return index.get(id);
  }
  // 否则使用递归查找（O(n)）
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

export const findParentNode = (
  nodes: JsonNode[],
  childId: string
): JsonNode | undefined => {
  for (const node of nodes) {
    if (node.children?.some((child) => child.id === childId)) {
      return node;
    }
    if (node.children) {
      const found = findParentNode(node.children, childId);
      if (found) return found;
    }
  }
  return undefined;
};

export const deepCloneNode = (node: JsonNode, newParentId?: string): JsonNode => {
  const newId = generateId();
  const cloned: JsonNode = {
    ...node,
    id: newId,
    parentId: newParentId,
  };

  if (node.children) {
    cloned.children = node.children.map((child) => deepCloneNode(child, newId));
  }

  return cloned;
};

export const getDefaultValue = (type: JsonValueType): unknown => {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'object':
      return {};
    case 'array':
      return [];
    default:
      return null;
  }
};

export const createNewNode = (
  key: string,
  type: JsonValueType,
  parentId?: string
): JsonNode => {
  const value = getDefaultValue(type);
  const node: JsonNode = {
    id: generateId(),
    key,
    value,
    type,
    parentId,
    expanded: true,
  };

  if (type === 'object' || type === 'array') {
    node.children = [];
  }

  return node;
};

export const updateNodeInTree = (
  nodes: JsonNode[],
  id: string,
  updates: Partial<JsonNode>
): JsonNode[] => {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeInTree(node.children, id, updates),
      };
    }
    return node;
  });
};

export const deleteNodeFromTree = (nodes: JsonNode[], id: string): JsonNode[] => {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children) {
        return {
          ...node,
          children: deleteNodeFromTree(node.children, id),
        };
      }
      return node;
    });
};

export const reindexArrayChildren = (node: JsonNode): JsonNode => {
  if (node.type === 'array' && node.children) {
    return {
      ...node,
      children: node.children.map((child, index) => ({
        ...child,
        key: String(index),
      })),
    };
  }
  return node;
};

// 从根节点查找指定节点的父节点（用于判断父节点类型）
export const findParentFromRoot = (
  root: JsonNode | undefined,
  childId: string
): JsonNode | null => {
  if (!root) return null;

  const search = (node: JsonNode): JsonNode | null => {
    if (node.children?.some((c) => c.id === childId)) return node;
    for (const child of node.children || []) {
      const found = search(child);
      if (found) return found;
    }
    return null;
  };

  return search(root);
};

