import { useState, useRef, useEffect, memo } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { JsonNode, JsonValueType } from '../../types/json';
import { useJsonStore } from '../../store/jsonStore';
import { NodeValue, TypeSelector } from './NodeValues';
import { NodeActions } from './NodeActions';
import { getDefaultValue, findParentFromRoot } from '../../utils/jsonParser';

interface VirtualTreeNodeProps {
  node: JsonNode;
  depth?: number;
  searchTerm?: string;
  style?: React.CSSProperties;
}

// 虚拟滚动专用节点组件（无拖拽功能）
export const VirtualTreeNode = memo(function VirtualTreeNode({
  node,
  depth = 0,
  searchTerm = '',
  style,
}: VirtualTreeNodeProps) {
  const { updateNode, deleteNode, duplicateNode, addChild, toggleExpand } = useJsonStore();
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [keyValue, setKeyValue] = useState(node.key);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingKey && keyInputRef.current) {
      keyInputRef.current.focus();
      keyInputRef.current.select();
    }
  }, [isEditingKey]);

  useEffect(() => {
    setKeyValue(node.key);
  }, [node.key]);

  const hasChildren = node.type === 'object' || node.type === 'array';
  const isExpanded = node.expanded !== false;

  const handleKeyDoubleClick = () => {
    if (node.parentId) {
      const root = useJsonStore.getState().nodes[0];
      const parentNode = findParentFromRoot(root, node.id);
      if (parentNode?.type === 'array') return;
    }
    setKeyValue(node.key);
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
    if (keyValue.trim() && keyValue !== node.key) {
      updateNode(node.id, { key: keyValue.trim() });
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

  const matchesSearch =
    searchTerm &&
    (node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(node.value).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={style} className="select-none">
      <div
        className={`group flex items-center gap-2 py-1 px-2 rounded hover:bg-[var(--bg-secondary)] ${
          matchesSearch ? 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]' : ''
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(node.id)}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-0.5"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* 键名 */}
        {isEditingKey ? (
          <input
            ref={keyInputRef}
            type="text"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            onBlur={handleKeyBlur}
            onKeyDown={handleKeyKeyDown}
            className="bg-[var(--bg-tertiary)] border border-[var(--accent)] rounded px-1 py-0.5 text-sm outline-none min-w-[40px] text-[var(--key)]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-[var(--key)] cursor-pointer hover:opacity-80"
            onDoubleClick={handleKeyDoubleClick}
            title="双击编辑键名"
          >
            {node.key}
          </span>
        )}
        <span className="text-[var(--text-muted)]">:</span>

        {/* 类型选择器 */}
        <TypeSelector currentType={node.type} onTypeChange={handleTypeChange} />

        {/* 值 */}
        <NodeValue value={node.value} type={node.type} onChange={handleValueChange} />

        {/* 操作按钮 */}
        <NodeActions
          nodeType={node.type}
          onDelete={() => deleteNode(node.id)}
          onDuplicate={() => duplicateNode(node.id)}
          onAddChild={(type) => addChild(node.id, type)}
          isRoot={false}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.key === nextProps.node.key &&
    prevProps.node.value === nextProps.node.value &&
    prevProps.node.type === nextProps.node.type &&
    prevProps.node.expanded === nextProps.node.expanded &&
    prevProps.node.children?.length === nextProps.node.children?.length &&
    prevProps.depth === nextProps.depth &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.style?.transform === nextProps.style?.transform &&
    prevProps.style?.height === nextProps.style?.height
  );
});
