import { TreeEditor } from './Editor/TreeEditor';
import { JsonPreview } from './Preview/JsonPreview';
import { Toolbar } from './Toolbar/Toolbar';

export function Layout() {
  return (
    <main className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* 页面标题 - 对 SEO 友好 */}
      <h1 className="sr-only">JSON 编辑器 - 在线可视化编辑工具</h1>

      <header>
        <Toolbar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <section
          className="flex-[7] overflow-hidden"
          aria-label="JSON 树形编辑器"
        >
          <TreeEditor />
        </section>
        <aside
          className="flex-[3] overflow-hidden"
          aria-label="JSON 预览"
        >
          <JsonPreview />
        </aside>
      </div>
    </main>
  );
}
