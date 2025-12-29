import { useSettingsStore } from '../store/settingsStore';
import { zhCN } from './locales/zh-CN';
import { enUS } from './locales/en-US';
import type { Locale, Translations } from './types';

// 翻译映射
const translations: Record<Locale, Translations> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

// 翻译 hook
export function useTranslation() {
  const locale = useSettingsStore((state) => state.locale);

  const t = (key: keyof Translations): string => {
    return translations[locale][key] || key;
  };

  return { t, locale };
}

// 导出类型
export type { Locale, Translations } from './types';
