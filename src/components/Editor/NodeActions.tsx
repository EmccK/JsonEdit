import { Plus, Copy, Trash2 } from 'lucide-react';
import type { JsonValueType } from '../../types/json';
import { useState } from 'react';
import { useTranslation } from '../../i18n';

interface NodeActionsProps {
  nodeType: JsonValueType;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddChild?: (type: JsonValueType) => void;
  isRoot?: boolean;
}

export function NodeActions({
  nodeType,
  onDelete,
  onDuplicate,
  onAddChild,
  isRoot,
}: NodeActionsProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { t } = useTranslation();
  const canAddChildren = nodeType === 'object' || nodeType === 'array';
  const types: JsonValueType[] = ['string', 'number', 'boolean', 'null', 'object', 'array'];

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {canAddChildren && onAddChild && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddMenu(!showAddMenu);
            }}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--success)]"
            title={t('node.addChild')}
          >
            <Plus size={14} />
          </button>
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded shadow-lg py-1 min-w-[80px]">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChild(type);
                      setShowAddMenu(false);
                    }}
                    className="block w-full text-left px-3 py-1 text-sm hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--accent)]"
        title={t('node.duplicate')}
      >
        <Copy size={14} />
      </button>
      {!isRoot && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--danger)]"
          title={t('node.delete')}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
