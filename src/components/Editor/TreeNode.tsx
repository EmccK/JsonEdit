import { useState, useRef, useEffect, memo } from 'react';
import type { KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, GripVertical, Copy, Check } from 'lucide-react';
import type { JsonNode, JsonValueType } from '../../types/json';
import { useJsonStore } from '../../store/jsonStore';
import { NodeValue, TypeSelector } from './NodeValues';
import { NodeActions } from './NodeActions';
import { getDefaultValue, findParentFromRoot, nodesToJson } from '../../utils/jsonParser';
import { useTranslation } from '../../i18n';

interface TreeNodeProps {
  node: JsonNode;
  depth?: number;
  isRoot?: boolean;
  searchTerm?: string;
  style?: React.CSSProperties;
}

// 使用 memo 优化，避免不必要的重渲染
export const TreeNode = memo(function TreeNode({
  node,
  depth = 0,
  isRoot = false,
  searchTerm = '',
  style,
}: TreeNodeProps) {
  const { updateNode, deleteNode, duplicateNode, addChild, toggleExpand, setSelectedNodeId, selectedNodeId } = useJsonStore();
  const [isEditingKey, setIsEditingKey] = useState(false);
  // 仅在编辑时使用本地状态，非编辑时直接使用 node.key
  const [editingKeyValue, setEditingKeyValue] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditingKey && keyInputRef.current) {
      keyInputRef.current.focus();
      keyInputRef.current.select();
    }
  }, [isEditingKey]);

  const hasChildren = node.type === 'object' || node.type === 'array';
  const isExpanded = node.expanded !== false;

  const handleKeyDoubleClick = () => {
    if (node.parentId) {
      // 检查父节点是否为数组 - 不允许编辑数组索引
      const root = useJsonStore.getState().nodes[0];
      const parentNode = findParentFromRoot(root, node.id);
      if (parentNode?.type === 'array') return;
    }
    setEditingKeyValue(node.key);
    setIsEditingKey(true);
  };

  const handleKeyBlur = () => {
    commitKeyChange();
  };

  const handleKeyKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitKeyChange();
    } else if (e.key === 'Escape') {
      setIsEditingKey(false);
    }
  };

  const commitKeyChange = () => {
    setIsEditingKey(false);
    if (editingKeyValue.trim() && editingKeyValue !== node.key) {
      updateNode(node.id, { key: editingKeyValue.trim() });
    }
  };

  const handleValueChange = (value: unknown, newType?: JsonValueType) => {
    const updates: Partial<JsonNode> = { value };
    if (newType && newType !== node.type) {
      updates.type = newType;
      updates.value = getDefaultValue(newType);
      if (newType === 'object' || newType === 'array') {
        updates.children = [];
        updates.expanded = true;
      } else {
        updates.children = undefined;
        updates.value = value;
      }
    }
    updateNode(node.id, updates);
  };

  const handleTypeChange = (newType: JsonValueType) => {
    const newValue = getDefaultValue(newType);
    const updates: Partial<JsonNode> = {
      type: newType,
      value: newValue,
    };
    if (newType === 'object' || newType === 'array') {
      updates.children = [];
      updates.expanded = true;
    } else {
      updates.children = undefined;
    }
    updateNode(node.id, updates);
  };

  // 复制节点到剪贴板（带兼容性处理）
  const copyNodeToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发选中
    try {
      let text: string;
      // 根节点需要从 store 获取完整数据（因为传入的 node.children 被设为 undefined）
      const targetNode = isRoot ? useJsonStore.getState().nodes[0] : node;

      if (targetNode.type === 'string') {
        // 字符串类型不带双引号
        text = String(targetNode.value);
      } else if (targetNode.type === 'object' || targetNode.type === 'array') {
        // 对象和数组格式化输出
        const json = nodesToJson(targetNode);
        text = JSON.stringify(json, null, 2);
      } else {
        // 其他简单类型直接转字符串
        text = String(targetNode.value);
      }

      // 使用 Clipboard API（带兼容性 fallback）
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback: 使用 textarea + execCommand
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    } catch (err) {
      console.error(t('node.copyFailed'), err);
    }
  };

  // 搜索高亮
  const matchesSearch =
    searchTerm &&
    (node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(node.value).toLowerCase().includes(searchTerm.toLowerCase()));

  // 是否被选中
  const isSelected = selectedNodeId === node.id;

  return (
    <div ref={setNodeRef} style={{ ...sortableStyle, ...style }} className="select-none relative">
      {/* 缩进引导线 */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
          {Array.from({ length: depth }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px bg-[var(--border)]/30"
              style={{ left: `${i * 20 + 16}px`, top: 0, bottom: 0 }}
            />
          ))}
        </div>
      )}
      <div
        className={`group flex items-center gap-2 py-1 px-2 rounded hover:bg-[var(--bg-secondary)] cursor-pointer ${
          matchesSearch ? 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]' : ''
        } ${isSelected ? 'bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/50' : ''}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => setSelectedNodeId(node.id)}
      >
        {/* 拖拽手柄 - 悬停时显示 */}
        {!isRoot && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <GripVertical size={14} />
          </button>
        )}

        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(node.id)}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-0.5 flex-shrink-0"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        {/* 键名 */}
        {!isRoot && (
          <>
            {isEditingKey ? (
              <input
                ref={keyInputRef}
                type="text"
                value={editingKeyValue}
                onChange={(e) => setEditingKeyValue(e.target.value)}
                onBlur={handleKeyBlur}
                onKeyDown={handleKeyKeyDown}
                className="bg-[var(--bg-tertiary)] border border-[var(--accent)] rounded px-1 py-0.5 text-sm outline-none min-w-[40px] text-[var(--key)]"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="text-[var(--key)] cursor-text hover:opacity-80 flex-shrink-0"
                onDoubleClick={handleKeyDoubleClick}
              >
                {node.key}
              </span>
            )}
            <span className="text-[var(--text-muted)] opacity-40 flex-shrink-0">:</span>
          </>
        )}

        {/* 类型选择器 */}
        <span className="flex-shrink-0">
          <TypeSelector currentType={node.type} onTypeChange={handleTypeChange} />
        </span>

        {/* 值 - 可截断 */}
        <span className="min-w-0 truncate block max-w-[50%]">
          <NodeValue value={node.value} type={node.type} onChange={handleValueChange} />
        </span>

        {/* 复制按钮 - 悬停时显示 */}
        <button
          onClick={copyNodeToClipboard}
          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--accent)] flex-shrink-0"
          title={copySuccess ? t('node.copySuccess') : t('node.copyValue')}
        >
          {copySuccess ? (
            <Check size={12} className="text-[var(--success)]" />
          ) : (
            <Copy size={12} />
          )}
        </button>

        {/* 操作按钮 */}
        <NodeActions
          nodeType={node.type}
          onDelete={() => deleteNode(node.id)}
          onDuplicate={() => duplicateNode(node.id)}
          onAddChild={(type) => addChild(node.id, type)}
          isRoot={isRoot}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键属性变化时重渲染
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.key === nextProps.node.key &&
    prevProps.node.value === nextProps.node.value &&
    prevProps.node.type === nextProps.node.type &&
    prevProps.node.expanded === nextProps.node.expanded &&
    prevProps.node.children?.length === nextProps.node.children?.length &&
    prevProps.depth === nextProps.depth &&
    prevProps.isRoot === nextProps.isRoot &&
    prevProps.searchTerm === nextProps.searchTerm
  );
});
