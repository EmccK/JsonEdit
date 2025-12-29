import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Copy,
  Undo2,
  Redo2,
  Search,
  FileJson,
  X,
  Check,
  AlertCircle,
  ChevronsUpDown,
  ChevronsDownUp,
} from 'lucide-react';
import { useJsonStore } from '../../store/jsonStore';

export function Toolbar() {
  const {
    importJson,
    getJson,
    undo,
    redo,
    canUndo,
    canRedo,
    searchTerm,
    setSearchTerm,
    validationError,
    expandAll,
    collapseAll,
  } = useJsonStore();

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框或文本区域内，不拦截快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo()) redo();
        } else {
          e.preventDefault();
          if (canUndo()) undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleImport = () => {
    if (importText.trim()) {
      importJson(importText);
      setShowImportModal(false);
      setImportText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importJson(content);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const json = getJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getJson());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <FileJson className="text-[var(--accent)]" size={20} />
          <span className="font-semibold text-[var(--text-primary)]">JSON 编辑器</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索..."
              className="pl-7 pr-3 py-1.5 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-40"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-[var(--border)]" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)]"
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)]"
            title="重做 (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>

          <div className="w-px h-6 bg-[var(--border)]" />

          {/* Expand/Collapse All */}
          <button
            onClick={expandAll}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            title="全部展开"
          >
            <ChevronsUpDown size={16} />
          </button>
          <button
            onClick={collapseAll}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            title="全部折叠"
          >
            <ChevronsDownUp size={16} />
          </button>

          <div className="w-px h-6 bg-[var(--border)]" />

          {/* Import */}
          <button
            onClick={() => setShowImportModal(true)}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            title="导入 JSON"
          >
            <Upload size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-sm rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)]"
          >
            上传文件
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            title="导出 JSON"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] relative"
            title="复制到剪贴板"
          >
            {copySuccess ? (
              <Check size={16} className="text-[var(--success)]" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--danger)]/10 border-b border-[var(--danger)]/30">
          <AlertCircle size={16} className="text-[var(--danger)]" />
          <span className="text-sm text-[var(--danger)]">{validationError}</span>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-lg mx-4 border border-[var(--border)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h3 className="font-medium text-[var(--text-primary)]">导入 JSON</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="粘贴 JSON 内容..."
                className="w-full h-64 p-3 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm rounded-md bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:opacity-90"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

