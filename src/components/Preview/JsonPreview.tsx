import { useMemo } from 'react';
import { useJsonStore } from '../../store/jsonStore';

interface TokenProps {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation';
  children: React.ReactNode;
}

function Token({ type, children }: TokenProps) {
  const colors: Record<string, string> = {
    key: 'var(--key)',
    string: 'var(--string)',
    number: 'var(--number)',
    boolean: 'var(--boolean)',
    null: 'var(--null)',
    punctuation: 'var(--text-muted)',
  };

  return <span style={{ color: colors[type] }}>{children}</span>;
}

function syntaxHighlight(json: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let key = 0;

  const lines = json.split('\n');
  
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    let charIdx = 0;
    
    while (charIdx < line.length) {
      const char = line[charIdx];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        tokens.push(<span key={key++}>{char}</span>);
        charIdx++;
        continue;
      }

      // Punctuation
      if (['{', '}', '[', ']', ':', ','].includes(char)) {
        tokens.push(<Token key={key++} type="punctuation">{char}</Token>);
        charIdx++;
        continue;
      }

      // String (key or value)
      if (char === '"') {
        let end = charIdx + 1;
        while (end < line.length && line[end] !== '"') {
          if (line[end] === '\\') end++;
          end++;
        }
        const str = line.slice(charIdx, end + 1);
        
        // Check if this is a key (followed by colon)
        const afterStr = line.slice(end + 1).trim();
        const isKey = afterStr.startsWith(':');
        
        tokens.push(
          <Token key={key++} type={isKey ? 'key' : 'string'}>
            {str}
          </Token>
        );
        charIdx = end + 1;
        continue;
      }

      // Number
      if (/[-\d]/.test(char)) {
        let end = charIdx;
        while (end < line.length && /[-\d.eE+]/.test(line[end])) {
          end++;
        }
        tokens.push(
          <Token key={key++} type="number">
            {line.slice(charIdx, end)}
          </Token>
        );
        charIdx = end;
        continue;
      }

      // Boolean or null
      if (line.slice(charIdx, charIdx + 4) === 'true') {
        tokens.push(<Token key={key++} type="boolean">true</Token>);
        charIdx += 4;
        continue;
      }
      if (line.slice(charIdx, charIdx + 5) === 'false') {
        tokens.push(<Token key={key++} type="boolean">false</Token>);
        charIdx += 5;
        continue;
      }
      if (line.slice(charIdx, charIdx + 4) === 'null') {
        tokens.push(<Token key={key++} type="null">null</Token>);
        charIdx += 4;
        continue;
      }

      // Fallback
      tokens.push(<span key={key++}>{char}</span>);
      charIdx++;
    }
    
    if (lineIdx < lines.length - 1) {
      tokens.push(<br key={key++} />);
    }
  }

  return tokens;
}

export function JsonPreview() {
  const getJson = useJsonStore((state) => state.getJson);
  const nodes = useJsonStore((state) => state.nodes);

  const jsonString = useMemo(() => {
    return getJson();
  }, [nodes, getJson]);

  const highlighted = useMemo(() => {
    return syntaxHighlight(jsonString);
  }, [jsonString]);

  return (
    <div className="h-full overflow-auto bg-[var(--bg-secondary)] border-l border-[var(--border)]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">预览</h3>
          <span className="text-xs text-[var(--text-muted)]">
            {jsonString.length} 字符
          </span>
        </div>
        <pre className="text-sm leading-relaxed font-mono whitespace-pre-wrap break-all">
          <code>{highlighted}</code>
        </pre>
      </div>
    </div>
  );
}

