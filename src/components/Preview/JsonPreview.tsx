import { useMemo, useDeferredValue, useState, useEffect } from 'react';
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

      // 跳过空白
      if (/\s/.test(char)) {
        tokens.push(<span key={key++}>{char}</span>);
        charIdx++;
        continue;
      }

      // 标点符号
      if (['{', '}', '[', ']', ':', ','].includes(char)) {
        tokens.push(
          <Token key={key++} type="punctuation">
            {char}
          </Token>
        );
        charIdx++;
        continue;
      }

      // 字符串（键或值）
      if (char === '"') {
        let end = charIdx + 1;
        while (end < line.length && line[end] !== '"') {
          if (line[end] === '\\') end++;
          end++;
        }
        const str = line.slice(charIdx, end + 1);

        // 检查是否为键（后面跟冒号）
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

      // 数字
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

      // 布尔值或 null
      if (line.slice(charIdx, charIdx + 4) === 'true') {
        tokens.push(
          <Token key={key++} type="boolean">
            true
          </Token>
        );
        charIdx += 4;
        continue;
      }
      if (line.slice(charIdx, charIdx + 5) === 'false') {
        tokens.push(
          <Token key={key++} type="boolean">
            false
          </Token>
        );
        charIdx += 5;
        continue;
      }
      if (line.slice(charIdx, charIdx + 4) === 'null') {
        tokens.push(
          <Token key={key++} type="null">
            null
          </Token>
        );
        charIdx += 4;
        continue;
      }

      // 回退
      tokens.push(<span key={key++}>{char}</span>);
      charIdx++;
    }

    if (lineIdx < lines.length - 1) {
      tokens.push(<br key={key++} />);
    }
  }

  return tokens;
}

// 大文件阈值（字符数）
const LARGE_FILE_THRESHOLD = 100000;
// 预览截断长度
const PREVIEW_TRUNCATE_LENGTH = 50000;

export function JsonPreview() {
  const getJson = useJsonStore((state) => state.getJson);
  const nodes = useJsonStore((state) => state.nodes);
  const [isUpdating, setIsUpdating] = useState(false);

  // 使用 useDeferredValue 实现防抖效果
  const deferredNodes = useDeferredValue(nodes);

  const jsonString = useMemo(() => {
    return getJson();
  }, [deferredNodes, getJson]);

  // 检测是否为大文件
  const isLargeFile = jsonString.length > LARGE_FILE_THRESHOLD;

  // 显示更新状态
  useEffect(() => {
    if (nodes !== deferredNodes) {
      setIsUpdating(true);
    } else {
      setIsUpdating(false);
    }
  }, [nodes, deferredNodes]);

  // 大文件时截断预览
  const displayString = useMemo(() => {
    if (isLargeFile) {
      return jsonString.slice(0, PREVIEW_TRUNCATE_LENGTH) + '\n\n... (内容过长，已截断)';
    }
    return jsonString;
  }, [jsonString, isLargeFile]);

  const highlighted = useMemo(() => {
    return syntaxHighlight(displayString);
  }, [displayString]);

  return (
    <div className="h-full overflow-auto bg-[var(--bg-secondary)] border-l border-[var(--border)]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            预览
            {isUpdating && (
              <span className="ml-2 text-xs text-[var(--text-muted)]">更新中...</span>
            )}
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            {jsonString.length.toLocaleString()} 字符
            {isLargeFile && ' (大文件)'}
          </span>
        </div>
        {isLargeFile && (
          <div className="mb-3 px-2 py-1 bg-[var(--accent)]/10 rounded text-xs text-[var(--text-muted)]">
            文件较大，预览已简化以提升性能
          </div>
        )}
        <pre className="text-sm leading-relaxed font-mono whitespace-pre-wrap break-all">
          <code>{highlighted}</code>
        </pre>
      </div>
    </div>
  );
}
