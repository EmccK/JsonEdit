import type { JsonNode } from '../types/json';

// 扁平化节点，用于虚拟滚动
export interface FlatNode {
  node: JsonNode;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

// 将树形结构扁平化为列表，只包含可见节点
export function flattenVisibleNodes(nodes: JsonNode[], depth: number = 0): FlatNode[] {
  const result: FlatNode[] = [];

  for (const node of nodes) {
    const hasChildren = node.type === 'object' || node.type === 'array';
    const isExpanded = node.expanded !== false;

    result.push({
      node,
      depth,
      hasChildren,
      isExpanded,
    });

    // 只有展开的节点才递归处理子节点
    if (hasChildren && isExpanded && node.children) {
      result.push(...flattenVisibleNodes(node.children, depth + 1));
    }
  }

  return result;
}

// 构建节点索引 Map，用于快速查找
export function buildNodeIndex(nodes: JsonNode[]): Map<string, JsonNode> {
  const index = new Map<string, JsonNode>();

  function traverse(nodeList: JsonNode[]) {
    for (const node of nodeList) {
      index.set(node.id, node);
      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return index;
}

// 使用索引快速查找节点
export function findNodeByIdFast(
  index: Map<string, JsonNode>,
  id: string
): JsonNode | undefined {
  return index.get(id);
}

// 获取节点的所有子节点 ID（用于拖拽排序）
export function getChildIds(node: JsonNode | undefined): string[] {
  if (!node?.children) return [];
  return node.children.map((c) => c.id);
}

// 计算节点总数（用于性能提示）
export function countNodes(nodes: JsonNode[]): number {
  let count = 0;

  function traverse(nodeList: JsonNode[]) {
    for (const node of nodeList) {
      count++;
      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return count;
}
