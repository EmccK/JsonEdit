import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useJsonStore } from '../../store/jsonStore';
import { TreeNode } from './TreeNode';
import type { JsonNode } from '../../types/json';
import { findNodeById, findParentNode } from '../../utils/jsonParser';

function getAllNodeIds(nodes: JsonNode[]): string[] {
  const ids: string[] = [];
  const collect = (nodeList: JsonNode[]) => {
    for (const node of nodeList) {
      ids.push(node.id);
      if (node.children) {
        collect(node.children);
      }
    }
  };
  collect(nodes);
  return ids;
}

export function TreeEditor() {
  const { nodes, moveNode, searchTerm, updateNode } = useJsonStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  // 记录拖拽前的展开状态
  const [wasExpanded, setWasExpanded] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);

    // 如果是对象或数组且已展开，先折叠
    const node = findNodeById(nodes, id);
    if (node && (node.type === 'object' || node.type === 'array') && node.expanded) {
      setWasExpanded(true);
      updateNode(id, { expanded: false });
    } else {
      setWasExpanded(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = String(active.id);

    // 恢复展开状态
    if (wasExpanded) {
      updateNode(draggedId, { expanded: true });
    }

    setActiveId(null);
    setWasExpanded(false);

    if (!over || active.id === over.id) return;

    // 检查是否在同一层级
    const activeParent = findParentNode(nodes, draggedId);
    const overParent = findParentNode(nodes, String(over.id));

    // 只允许同层级拖拽
    if (activeParent?.id !== overParent?.id) return;

    moveNode(draggedId, String(over.id));
  };

  const handleDragCancel = () => {
    // 恢复展开状态
    if (activeId && wasExpanded) {
      updateNode(activeId, { expanded: true });
    }
    setActiveId(null);
    setWasExpanded(false);
  };

  const allIds = getAllNodeIds(nodes);
  const activeNode = activeId ? findNodeById(nodes, activeId) : null;
  const rootNode = nodes[0];
  // 获取子节点的 ID 列表（用于拖拽排序）
  const childIds = rootNode?.children?.map(c => c.id) || [];

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* 根节点固定在顶部 */}
        {rootNode && (
          <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-[var(--border)]">
            <TreeNode
              node={{ ...rootNode, children: undefined }}
              isRoot={true}
              searchTerm={searchTerm}
            />
          </div>
        )}

        {/* 子节点可滚动区域 */}
        <div className="flex-1 overflow-auto px-4 py-2">
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            {rootNode?.children?.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={1}
                searchTerm={searchTerm}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeNode ? (
            <div className="bg-[var(--bg-secondary)] rounded shadow-lg opacity-80 px-2 py-1">
              <span className="text-[var(--key)]">{activeNode.key}</span>
              <span className="text-[var(--text-muted)]">: </span>
              <span className="text-[var(--text-secondary)]">
                {activeNode.type === 'object' ? '{...}' :
                 activeNode.type === 'array' ? '[...]' :
                 String(activeNode.value)}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

