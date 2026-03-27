import { useState, useCallback, useRef, useEffect } from 'react';
import { TreeEditor } from './Editor/TreeEditor';
import { JsonPreview } from './Preview/JsonPreview';
import { Toolbar } from './Toolbar/Toolbar';
import { useTranslation } from '../i18n';

const STORAGE_KEY = 'jsonedit-split-ratio';

export function Layout() {
  const { t } = useTranslation();
  const [splitRatio, setSplitRatio] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 70;
  });
  const splitRatioRef = useRef(splitRatio);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 20), 80);
      splitRatioRef.current = newRatio;
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(STORAGE_KEY, String(splitRatioRef.current));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <main className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <h1 className="sr-only">{t('app.seoTitle')}</h1>

      <header>
        <Toolbar />
      </header>

      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        <section
          className="overflow-hidden"
          style={{ width: `${splitRatio}%` }}
          aria-label={t('editor.treeLabel')}
        >
          <TreeEditor />
        </section>
        <div
          className="w-[5px] cursor-col-resize flex-shrink-0 bg-[var(--border)] hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors"
          onMouseDown={handleMouseDown}
        />
        <aside
          className="overflow-hidden"
          style={{ width: `${100 - splitRatio}%` }}
          aria-label={t('editor.previewLabel')}
        >
          <JsonPreview />
        </aside>
      </div>
    </main>
  );
}
