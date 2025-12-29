import { useState, useRef, useMemo } from 'react';
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
import { useVirtualizer } from '@tanstack/react-virtual';
import { useJsonStore } from '../../store/jsonStore';
import { TreeNode } from './TreeNode';
import { VirtualTreeNode } from './VirtualTreeNode';
import { findNodeById, findParentNode } from '../../utils/jsonParser';
import { flattenVisibleNodes, countNodes, type FlatNode } from '../../utils/virtualTree';

// 每行高度（像素）
const ROW_HEIGHT = 32;
// 预渲染行数
const OVERSCAN = 10;
// 虚拟滚动阈值：超过此数量启用虚拟滚动
const VIRTUAL_THRESHOLD = 500;

export function TreeEditor() {
  const { nodes, moveNode, searchTerm, updateNode } = useJsonStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [wasExpanded, setWasExpanded] = useState<boolean>(false);
  const parentRef = useRef<HTMLDivElement>(null);

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

  // 计算节点总数（用于显示）
  const totalNodeCount = useMemo(() => countNodes(nodes), [nodes]);

  // 扁平化可见节点列表
  const flatNodes = useMemo<FlatNode[]>(() => {
    if (!nodes[0]) return [];
    const rootChildren = nodes[0].children || [];
    return flattenVisibleNodes(rootChildren, 1);
  }, [nodes]);

  // 获取所有可见节点的 ID（用于拖拽排序）
  const sortableIds = useMemo(() => flatNodes.map((fn) => fn.node.id), [flatNodes]);

  // 基于可见节点数判断是否使用虚拟滚动（折叠后可启用拖拽）
  const useVirtual = flatNodes.length > VIRTUAL_THRESHOLD;

  // 虚拟滚动（仅在大数据量时使用）
  const virtualizer = useVirtualizer({
    count: useVirtual ? flatNodes.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
    enabled: useVirtual,
  });

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
    if (activeId && wasExpanded) {
      updateNode(activeId, { expanded: true });
    }
    setActiveId(null);
    setWasExpanded(false);
  };

  const activeNode = activeId ? findNodeById(nodes, activeId) : null;
  const rootNode = nodes[0];
  const virtualItems = virtualizer.getVirtualItems();

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
            {useVirtual && (
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                大数据模式 ({flatNodes.length}/{totalNodeCount} 可见节点) - 折叠部分节点可启用拖拽
              </div>
            )}
          </div>
        )}

        {/* 子节点区域 */}
        <div ref={parentRef} className="flex-1 overflow-auto px-4 py-2">
          {useVirtual ? (
            // 大数据量：使用虚拟滚动，禁用拖拽排序
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualItem) => {
                const flatNode = flatNodes[virtualItem.index];
                if (!flatNode) return null;

                return (
                  <VirtualTreeNode
                    key={flatNode.node.id}
                    node={flatNode.node}
                    depth={flatNode.depth}
                    searchTerm={searchTerm}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            // 小数据量：正常渲染，支持拖拽
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {flatNodes.map((flatNode) => (
                <TreeNode
                  key={flatNode.node.id}
                  node={flatNode.node}
                  depth={flatNode.depth}
                  searchTerm={searchTerm}
                />
              ))}
            </SortableContext>
          )}
        </div>

        <DragOverlay>
          {activeNode ? (
            <div className="bg-[var(--bg-secondary)] rounded shadow-lg opacity-80 px-2 py-1">
              <span className="text-[var(--key)]">{activeNode.key}</span>
              <span className="text-[var(--text-muted)]">: </span>
              <span className="text-[var(--text-secondary)]">
                {activeNode.type === 'object'
                  ? '{...}'
                  : activeNode.type === 'array'
                    ? '[...]'
                    : String(activeNode.value)}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
