import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Type, Hash, ToggleLeft, CircleSlash, Braces, Brackets } from 'lucide-react';
import type { JsonValueType } from '../../types/json';

interface NodeValueProps {
  value: unknown;
  type: JsonValueType;
  onChange: (value: unknown, newType?: JsonValueType) => void;
}

const typeColors: Record<JsonValueType, string> = {
  string: 'text-[var(--string)]',
  number: 'text-[var(--number)]',
  boolean: 'text-[var(--boolean)]',
  null: 'text-[var(--null)]',
  object: 'text-[var(--text-secondary)]',
  array: 'text-[var(--text-secondary)]',
};

// 类型图标映射（带颜色）
const TypeIcon = ({ type, colored = false }: { type: JsonValueType; colored?: boolean }) => {
  const iconProps = { size: 12, strokeWidth: 2 };
  const colorClass = colored ? typeColors[type] : '';

  const icon = (() => {
    switch (type) {
      case 'string':
        return <Type {...iconProps} />;
      case 'number':
        return <Hash {...iconProps} />;
      case 'boolean':
        return <ToggleLeft {...iconProps} />;
      case 'null':
        return <CircleSlash {...iconProps} />;
      case 'object':
        return <Braces {...iconProps} />;
      case 'array':
        return <Brackets {...iconProps} />;
      default:
        return null;
    }
  })();

  return <span className={colorClass}>{icon}</span>;
};

export function NodeValue({ value, type, onChange }: NodeValueProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (type === 'object' || type === 'array') return;
    setEditValue(type === 'string' ? String(value) : JSON.stringify(value));
    setIsEditing(true);
  };

  const handleBlur = () => {
    commitChange();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitChange();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const commitChange = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    
    // Try to parse as different types
    if (trimmed === 'null') {
      onChange(null, 'null');
      return;
    }
    if (trimmed === 'true') {
      onChange(true, 'boolean');
      return;
    }
    if (trimmed === 'false') {
      onChange(false, 'boolean');
      return;
    }
    
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') {
      onChange(num, 'number');
      return;
    }
    
    // Default to string
    onChange(trimmed, 'string');
  };

  const displayValue = () => {
    if (type === 'null') return 'null';
    if (type === 'boolean') return value ? 'true' : 'false';
    if (type === 'string') return `"${value}"`;
    if (type === 'object') return `{${(value as object) ? Object.keys(value as object).length : 0}}`;
    if (type === 'array') return `[${Array.isArray(value) ? (value as unknown[]).length : 0}]`;
    return String(value);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="bg-[var(--bg-tertiary)] border border-[var(--accent)] rounded px-1 py-0.5 text-sm outline-none min-w-[60px] text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={`${typeColors[type]} cursor-text hover:opacity-80 select-none truncate`}
      onDoubleClick={handleDoubleClick}
    >
      {displayValue()}
    </span>
  );
}

interface TypeSelectorProps {
  currentType: JsonValueType;
  onTypeChange: (type: JsonValueType) => void;
}

export function TypeSelector({ currentType, onTypeChange }: TypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const types: JsonValueType[] = ['string', 'number', 'boolean', 'null', 'object', 'array'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded cursor-pointer transition-colors"
        title={currentType}
      >
        <TypeIcon type={currentType} colored />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded shadow-lg py-1 min-w-[100px]">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => {
                  onTypeChange(t);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 w-full text-left px-3 py-1 text-sm hover:bg-[var(--bg-tertiary)] ${
                  t === currentType ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                <TypeIcon type={t} colored />
                <span>{t}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

