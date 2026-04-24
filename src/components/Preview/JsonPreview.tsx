import { useMemo, useDeferredValue, useRef, useEffect } from 'react';
import { useJsonStore } from '../../store/jsonStore';
import { useTranslation } from '../../i18n';
import { getNodePath, nodesToJson } from '../../utils/jsonParser';

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

// 按行分割高亮内容
function syntaxHighlightByLine(json: string): React.ReactNode[][] {
  const lines = json.split('\n');
  const result: React.ReactNode[][] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineTokens: React.ReactNode[] = [];
    let charIdx = 0;
    let key = 0;

    while (charIdx < line.length) {
      const char = line[charIdx];

      // 跳过空白
      if (/\s/.test(char)) {
        lineTokens.push(<span key={key++}>{char}</span>);
        charIdx++;
        continue;
      }

      // 标点符号
      if (['{', '}', '[', ']', ':', ','].includes(char)) {
        lineTokens.push(
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

        lineTokens.push(
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
        lineTokens.push(
          <Token key={key++} type="number">
            {line.slice(charIdx, end)}
          </Token>
        );
        charIdx = end;
        continue;
      }

      // 布尔值或 null
      if (line.slice(charIdx, charIdx + 4) === 'true') {
        lineTokens.push(
          <Token key={key++} type="boolean">
            true
          </Token>
        );
        charIdx += 4;
        continue;
      }
      if (line.slice(charIdx, charIdx + 5) === 'false') {
        lineTokens.push(
          <Token key={key++} type="boolean">
            false
          </Token>
        );
        charIdx += 5;
        continue;
      }
      if (line.slice(charIdx, charIdx + 4) === 'null') {
        lineTokens.push(
          <Token key={key++} type="null">
            null
          </Token>
        );
        charIdx += 4;
        continue;
      }

      // 回退
      lineTokens.push(<span key={key++}>{char}</span>);
      charIdx++;
    }

    result.push(lineTokens);
  }

  return result;
}

// 大文件阈值（字符数）
const LARGE_FILE_THRESHOLD = 100000;
// 预览截断长度
const PREVIEW_TRUNCATE_LENGTH = 50000;

// 根据路径在 JSON 字符串中找到对应的行范围
function findLineRangeForPath(jsonString: string, path: string[]): { start: number; end: number } | null {
  if (path.length === 0) return null;

  const lines = jsonString.split('\n');

  // 跳过根节点 'root'
  const searchPath = path.slice(1);
  if (searchPath.length === 0) {
    return { start: 0, end: lines.length - 1 };
  }

  // 追踪当前搜索状态
  let pathIndex = 0;
  let startLine = -1;
  let bracketDepth = 0;
  let arrayIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 如果已找到开始行，追踪括号找结束行
    if (startLine !== -1) {
      const openBraces = (line.match(/[{[]/g) || []).length;
      const closeBraces = (line.match(/[}\]]/g) || []).length;
      bracketDepth += openBraces - closeBraces;
      if (bracketDepth <= 0) {
        return { start: startLine, end: i };
      }
      continue;
    }

    // 还在查找目标路径
    if (pathIndex < searchPath.length) {
      const keyToFind = searchPath[pathIndex];

      // 尝试匹配对象键名
      const keyMatch = trimmed.match(/^"([^"]+)"\s*:/);
      if (keyMatch && keyMatch[1] === keyToFind) {
        pathIndex++;
        if (pathIndex === searchPath.length) {
          // 找到目标，确定范围
          startLine = i;
          const afterColon = trimmed.slice(trimmed.indexOf(':') + 1).trim();
          if (afterColon && !afterColon.startsWith('{') && !afterColon.startsWith('[')) {
            return { start: i, end: i };
          }
          const openBraces = (line.match(/[{[]/g) || []).length;
          const closeBraces = (line.match(/[}\]]/g) || []).length;
          bracketDepth = openBraces - closeBraces;
          if (bracketDepth <= 0) {
            return { start: i, end: i };
          }
        }
        continue;
      }

      // 尝试匹配数组元素索引
      const targetArrayIndex = parseInt(keyToFind, 10);
      if (!isNaN(targetArrayIndex) && !keyMatch && trimmed.length > 0) {
        // 追踪数组状态
        if (trimmed === '[' || trimmed.endsWith('[')) {
          arrayIndex = -1;
        } else if (trimmed === ']' || trimmed.startsWith(']')) {
          arrayIndex = -1;
        } else if (arrayIndex >= 0 || (i > 0 && lines[i - 1].trim().endsWith('['))) {
          if (arrayIndex < 0) arrayIndex = 0;

          if (arrayIndex === targetArrayIndex) {
            pathIndex++;
            if (pathIndex === searchPath.length) {
              startLine = i;
              if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                return { start: i, end: i };
              }
              const openBraces = (line.match(/[{[]/g) || []).length;
              const closeBraces = (line.match(/[}\]]/g) || []).length;
              bracketDepth = openBraces - closeBraces;
              if (bracketDepth <= 0) {
                return { start: i, end: i };
              }
            }
          }

          // 单行元素或带逗号结尾时增加索引
          if (trimmed.endsWith(',')) {
            arrayIndex++;
          } else {
            const openBraces = (line.match(/[{[]/g) || []).length;
            const closeBraces = (line.match(/[}\]]/g) || []).length;
            if (openBraces === 0 && closeBraces === 0) {
              arrayIndex++;
            }
          }
        }
      }
    }
  }

  if (startLine !== -1) {
    return { start: startLine, end: lines.length - 1 };
  }

  return null;
}

export function JsonPreview() {
  const nodes = useJsonStore((state) => state.nodes);
  const selectedNodeId = useJsonStore((state) => state.selectedNodeId);
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 使用 useDeferredValue 实现防抖效果
  const deferredNodes = useDeferredValue(nodes);

  // 直接基于 deferredNodes 计算 JSON 字符串，避免不必要的依赖
  const jsonString = useMemo(() => {
    if (deferredNodes.length === 0) return '{}';
    return JSON.stringify(nodesToJson(deferredNodes[0]), null, 2);
  }, [deferredNodes]);

  // 检测是否为大文件
  const isLargeFile = jsonString.length > LARGE_FILE_THRESHOLD;

  // 基于引用比较判断是否正在更新，无需 useState + useEffect
  const isUpdating = nodes !== deferredNodes;

  // 大文件时截断预览
  const displayString = useMemo(() => {
    if (isLargeFile) {
      return jsonString.slice(0, PREVIEW_TRUNCATE_LENGTH) + '\n\n' + t('preview.truncated');
    }
    return jsonString;
  }, [jsonString, isLargeFile, t]);

  // 按行高亮
  const highlightedLines = useMemo(() => {
    return syntaxHighlightByLine(displayString);
  }, [displayString]);

  // 计算选中节点对应的行范围
  const selectedLineRange = useMemo(() => {
    if (!selectedNodeId || isLargeFile) return null;
    const path = getNodePath(nodes, selectedNodeId);
    return findLineRangeForPath(jsonString, path);
  }, [selectedNodeId, nodes, jsonString, isLargeFile]);

  // 当选中行范围变化时，自动滚动到目标行并居中显示
  useEffect(() => {
    if (!selectedLineRange || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current.querySelector('[data-highlight-start="true"]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedLineRange]);

  return (
    <div ref={scrollContainerRef} className="h-full overflow-auto bg-[var(--bg-secondary)]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            {t('preview.title')}
            {isUpdating && (
              <span className="ml-2 text-xs text-[var(--text-muted)]">{t('preview.updating')}</span>
            )}
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            {jsonString.length.toLocaleString()} {t('preview.characters')}
            {isLargeFile && ` (${t('preview.largeFile')})`}
          </span>
        </div>
        {isLargeFile && (
          <div className="mb-3 px-2 py-1 bg-[var(--accent)]/10 rounded text-xs text-[var(--text-muted)]">
            {t('preview.largeFileHint')}
          </div>
        )}
        <div className="flex font-mono text-sm">
          {/* 行号列 */}
          <div className="select-none text-right pr-3 text-[var(--text-muted)] border-r border-[var(--border)] mr-3 leading-relaxed">
            {highlightedLines.map((_, i) => (
              <div
                key={i}
                className={
                  selectedLineRange && i >= selectedLineRange.start && i <= selectedLineRange.end
                    ? 'text-[var(--accent)]'
                    : ''
                }
              >
                {i + 1}
              </div>
            ))}
          </div>
          {/* 代码列 */}
          <pre className="flex-1 whitespace-pre-wrap break-all leading-relaxed">
            <code>
              {highlightedLines.map((lineTokens, i) => (
                <div
                  key={i}
                  data-highlight-start={selectedLineRange && i === selectedLineRange.start ? 'true' : undefined}
                  className={`${
                    selectedLineRange && i >= selectedLineRange.start && i <= selectedLineRange.end
                      ? 'bg-[var(--accent)]/10'
                      : ''
                  }`}
                >
                  {lineTokens.length > 0 ? lineTokens : '\u00A0'}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
