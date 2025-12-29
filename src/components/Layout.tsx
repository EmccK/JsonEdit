import { TreeEditor } from './Editor/TreeEditor';
import { JsonPreview } from './Preview/JsonPreview';
import { Toolbar } from './Toolbar/Toolbar';

export function Layout() {
  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-[7] overflow-hidden">
          <TreeEditor />
        </div>
        <div className="flex-[3] overflow-hidden">
          <JsonPreview />
        </div>
      </div>
    </div>
  );
}

