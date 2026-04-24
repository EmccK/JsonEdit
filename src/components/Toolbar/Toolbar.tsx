import { useState, useRef, useEffect } from 'react';
import {
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
  Moon,
  Sun,
  Languages,
  ClipboardPaste,
  FolderOpen,
} from 'lucide-react';
import { useJsonStore } from '../../store/jsonStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTranslation } from '../../i18n';

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

  const { resolvedTheme, toggleTheme, toggleLocale, locale } = useSettingsStore();
  const { t } = useTranslation();

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [quickImportText, setQuickImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 文件大小限制：10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

  const handleQuickImport = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickImportText.trim()) {
      importJson(quickImportText);
      setQuickImportText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        setFileError(t('validation.fileTooLarge'));
        setTimeout(() => setFileError(null), 3000);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importJson(content);
        setFileError(null);
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
        {/* 左侧: 按使用频率排列 */}
        <div className="flex items-center gap-1">
          {/* 标题 */}
          <FileJson className="text-[var(--accent)]" size={20} />
          <span className="font-semibold text-[var(--text-primary)] mr-2">{t('app.title')}</span>

          <div className="w-px h-6 bg-[var(--border)] opacity-50" />

          {/* 第一优先: 快速导入输入框 + 导入JSON按钮 */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <ClipboardPaste
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={quickImportText}
                onChange={(e) => setQuickImportText(e.target.value)}
                onKeyDown={handleQuickImport}
                placeholder={t('toolbar.quickImport')}
                className="pl-7 pr-6 py-1.5 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-56"
              />
              {quickImportText && (
                <button
                  onClick={() => setQuickImportText('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <ClipboardPaste size={15} />
              <span>{t('toolbar.import')}</span>
            </button>
          </div>

          <div className="w-px h-6 bg-[var(--border)] opacity-50" />

          {/* 第二优先: 展开/折叠 */}
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              title={t('toolbar.expandAll')}
            >
              <ChevronsUpDown size={15} />
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              title={t('toolbar.collapseAll')}
            >
              <ChevronsDownUp size={15} />
            </button>
          </div>

          <div className="w-px h-6 bg-[var(--border)] opacity-50" />

          {/* 第三优先: 搜索 */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('toolbar.search')}
              className="pl-7 pr-6 py-1.5 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-40"
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

          <div className="w-px h-6 bg-[var(--border)] opacity-50" />

          {/* 第四优先: 上传文件 + 复制（纯图标） */}
          <div className="flex items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              title={t('toolbar.uploadFile')}
            >
              <FolderOpen size={16} />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              title={t('toolbar.copy')}
            >
              {copySuccess ? (
                <Check size={16} className="text-[var(--success)]" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>

          <div className="w-px h-6 bg-[var(--border)] opacity-50" />

          {/* 最低优先: 撤销/重做（纯图标） */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-2 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)]"
              title={t('toolbar.undo')}
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-2 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)]"
              title={t('toolbar.redo')}
            >
              <Redo2 size={16} />
            </button>
          </div>
        </div>

        {/* 右侧: 导出 + 语言 + 主题 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            title={t('toolbar.export')}
          >
            <Download size={16} />
            <span>{t('toolbar.export')}</span>
          </button>
          <div className="w-px h-6 bg-[var(--border)] opacity-50" />
          <button
            onClick={toggleLocale}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] flex items-center gap-1"
            title={t('settings.language')}
          >
            <Languages size={16} />
            <span className="text-xs">{locale === 'zh-CN' ? '中' : 'EN'}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            title={t('settings.theme')}
          >
            {resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>

      {/* Validation Error */}
      {(validationError || fileError) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--danger)]/10 border-b border-[var(--danger)]/30">
          <AlertCircle size={16} className="text-[var(--danger)]" />
          <span className="text-sm text-[var(--danger)]">{validationError || fileError}</span>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-lg mx-4 border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h3 className="font-medium text-[var(--text-primary)]">{t('import.title')}</h3>
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
                placeholder={t('import.placeholder')}
                className="w-full h-64 p-3 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              >
                {t('import.cancel')}
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {t('import.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
