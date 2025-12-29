// 支持的语言
export type Locale = 'zh-CN' | 'en-US';

// 翻译键值结构
export interface Translations {
  // 应用标题
  'app.title': string;
  'app.seoTitle': string;

  // 工具栏
  'toolbar.search': string;
  'toolbar.undo': string;
  'toolbar.redo': string;
  'toolbar.expandAll': string;
  'toolbar.collapseAll': string;
  'toolbar.import': string;
  'toolbar.uploadFile': string;
  'toolbar.export': string;
  'toolbar.copy': string;

  // 导入弹窗
  'import.title': string;
  'import.placeholder': string;
  'import.cancel': string;
  'import.confirm': string;

  // 预览
  'preview.title': string;
  'preview.updating': string;
  'preview.characters': string;
  'preview.largeFile': string;
  'preview.truncated': string;
  'preview.largeFileHint': string;

  // 编辑器
  'editor.treeLabel': string;
  'editor.previewLabel': string;
  'editor.virtualMode': string;
  'editor.visibleNodes': string;
  'editor.virtualHint': string;

  // 节点操作
  'node.addChild': string;
  'node.duplicate': string;
  'node.delete': string;

  // 验证
  'validation.invalidJson': string;
  'validation.fileTooLarge': string;

  // 设置
  'settings.theme': string;
  'settings.language': string;
}
