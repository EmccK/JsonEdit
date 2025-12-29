import { TreeEditor } from './Editor/TreeEditor';
import { JsonPreview } from './Preview/JsonPreview';
import { Toolbar } from './Toolbar/Toolbar';
import { useTranslation } from '../i18n';

export function Layout() {
  const { t } = useTranslation();

  return (
    <main className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* 页面标题 - 对 SEO 友好 */}
      <h1 className="sr-only">{t('app.seoTitle')}</h1>

      <header>
        <Toolbar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <section
          className="flex-[7] overflow-hidden"
          aria-label={t('editor.treeLabel')}
        >
          <TreeEditor />
        </section>
        <aside
          className="flex-[3] overflow-hidden"
          aria-label={t('editor.previewLabel')}
        >
          <JsonPreview />
        </aside>
      </div>
    </main>
  );
}
