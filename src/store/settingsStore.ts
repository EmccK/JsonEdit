import { create } from 'zustand';
import type { Locale } from '../i18n/types';

// 主题类型：system 表示跟随系统，dark/light 表示用户手动选择
export type Theme = 'system' | 'dark' | 'light';

interface SettingsState {
  locale: Locale;
  theme: Theme;
  // 实际应用的主题（根据 theme 和系统偏好计算）
  resolvedTheme: 'dark' | 'light';
}

interface SettingsActions {
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  toggleTheme: () => void;
}

// 获取系统主题偏好
const getSystemTheme = (): 'dark' | 'light' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 计算实际应用的主题
const resolveTheme = (theme: Theme): 'dark' | 'light' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

// 应用主题到 DOM
const applyTheme = (resolvedTheme: 'dark' | 'light') => {
  document.documentElement.setAttribute('data-theme', resolvedTheme);
};

// 安全读取 localStorage（隐私模式或禁用时可能抛异常）
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// 安全写入 localStorage
const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage 不可用，忽略
  }
};

// 从 localStorage 读取初始语言
const getInitialLocale = (): Locale => {
  const saved = safeGetItem('locale');
  if (saved === 'zh-CN' || saved === 'en-US') return saved;
  // 根据浏览器语言自动检测
  return navigator.language.startsWith('zh') ? 'zh-CN' : 'en-US';
};

// 从 localStorage 读取初始主题
const getInitialTheme = (): Theme => {
  const saved = safeGetItem('theme');
  if (saved === 'system' || saved === 'dark' || saved === 'light') return saved;
  // 默认跟随系统
  return 'system';
};

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => {
  const initialTheme = getInitialTheme();
  const initialResolvedTheme = resolveTheme(initialTheme);

  // 初始化时应用主题
  applyTheme(initialResolvedTheme);

  // 监听系统主题变化（仅在 system 模式下生效）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const { theme } = get();
    if (theme === 'system') {
      const newResolvedTheme = getSystemTheme();
      applyTheme(newResolvedTheme);
      set({ resolvedTheme: newResolvedTheme });
    }
  });

  return {
    locale: getInitialLocale(),
    theme: initialTheme,
    resolvedTheme: initialResolvedTheme,

    setLocale: (locale) => {
      safeSetItem('locale', locale);
      set({ locale });
    },

    toggleLocale: () => {
      const { locale } = get();
      const newLocale: Locale = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
      safeSetItem('locale', newLocale);
      set({ locale: newLocale });
    },

    toggleTheme: () => {
      const { resolvedTheme } = get();
      // 切换到相反的主题，并固定（不再跟随系统）
      const newTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
      const newResolvedTheme = newTheme;
      safeSetItem('theme', newTheme);
      applyTheme(newResolvedTheme);
      set({ theme: newTheme, resolvedTheme: newResolvedTheme });
    },
  };
});
