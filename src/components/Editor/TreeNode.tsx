import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import type { JsonNode, JsonValueType } from '../../types/json';
import { useJsonStore } from '../../store/jsonStore';
import { NodeValue, TypeSelector } from './NodeValues';
import { NodeActions } from './NodeActions';
import { getDefaultValue } from '../../utils/jsonParser';

interface TreeNodeProps {
  node: JsonNode;
  depth?: number;
  isRoot?: boolean;
  searchTerm?: string;
}

export function TreeNode({ node, depth = 0, isRoot = false, searchTerm = '' }: TreeNodeProps) {
  const { updateNode, deleteNode, duplicateNode, addChild, toggleExpand } = useJsonStore();
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [keyValue, setKeyValue] = useState(node.key);
  const keyInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
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
      // Check if parent is array - don't allow editing array indices
      const parent = useJsonStore.getState().nodes[0];
      const findParent = (n: JsonNode): JsonNode | null => {
        if (n.children?.some((c) => c.id === node.id)) return n;
        for (const child of n.children || []) {
          const found = findParent(child);
          if (found) return found;
        }
        return null;
      };
      const parentNode = findParent(parent);
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

  // Search highlight
  const matchesSearch = searchTerm && (
    node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(node.value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div
        className={`group flex items-center gap-2 py-1 px-2 rounded hover:bg-[var(--bg-secondary)] ${
          matchesSearch ? 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]' : ''
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Drag Handle */}
        {!isRoot && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-0.5"
          >
            <GripVertical size={14} />
          </button>
        )}

        {/* Expand/Collapse Toggle */}
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

        {/* Key */}
        {!isRoot && (
          <>
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
          </>
        )}

        {/* Type Selector */}
        <TypeSelector currentType={node.type} onTypeChange={handleTypeChange} />

        {/* Value */}
        <NodeValue
          value={node.value}
          type={node.type}
          onChange={handleValueChange}
        />

        {/* Actions */}
        <NodeActions
          nodeType={node.type}
          onDelete={() => deleteNode(node.id)}
          onDuplicate={() => duplicateNode(node.id)}
          onAddChild={(type) => addChild(node.id, type)}
          isRoot={isRoot}
        />
      </div>

      {/* Children */}
      {hasChildren && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

