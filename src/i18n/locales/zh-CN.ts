import type { Translations } from '../types';

export const zhCN: Translations = {
  // 应用标题
  'app.title': 'JSON 编辑器',
  'app.seoTitle': 'JSON 编辑器 - 在线可视化编辑工具',

  // 工具栏
  'toolbar.search': '搜索...',
  'toolbar.undo': '撤销 (Ctrl+Z)',
  'toolbar.redo': '重做 (Ctrl+Shift+Z)',
  'toolbar.expandAll': '全部展开',
  'toolbar.collapseAll': '全部折叠',
  'toolbar.import': '导入 JSON',
  'toolbar.uploadFile': '上传文件',
  'toolbar.export': '导出 JSON',
  'toolbar.copy': '复制到剪贴板',

  // 导入弹窗
  'import.title': '导入 JSON',
  'import.placeholder': '粘贴 JSON 内容...',
  'import.cancel': '取消',
  'import.confirm': '导入',

  // 预览
  'preview.title': '预览',
  'preview.updating': '更新中...',
  'preview.characters': '字符',
  'preview.largeFile': '大文件',
  'preview.truncated': '... (内容过长，已截断)',
  'preview.largeFileHint': '文件较大，预览已简化以提升性能',

  // 编辑器
  'editor.treeLabel': 'JSON 树形编辑器',
  'editor.previewLabel': 'JSON 预览',
  'editor.virtualMode': '大数据模式',
  'editor.visibleNodes': '可见节点',
  'editor.virtualHint': '折叠部分节点可启用拖拽',

  // 节点操作
  'node.addChild': '添加子项',
  'node.duplicate': '复制节点',
  'node.delete': '删除节点',

  // 验证
  'validation.invalidJson': '无效的 JSON',
  'validation.fileTooLarge': '文件过大，最大支持 10MB',

  // 设置
  'settings.theme': '切换主题',
  'settings.language': '切换语言',
};
