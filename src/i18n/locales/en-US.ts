import type { Translations } from '../types';

export const enUS: Translations = {
  // App title
  'app.title': 'JSON Editor',
  'app.seoTitle': 'JSON Editor - Online Visual Editor',

  // Toolbar
  'toolbar.search': 'Search...',
  'toolbar.undo': 'Undo (Ctrl+Z)',
  'toolbar.redo': 'Redo (Ctrl+Shift+Z)',
  'toolbar.expandAll': 'Expand All',
  'toolbar.collapseAll': 'Collapse All',
  'toolbar.import': 'Import JSON',
  'toolbar.uploadFile': 'Upload File',
  'toolbar.export': 'Export JSON',
  'toolbar.copy': 'Copy to Clipboard',

  // Import modal
  'import.title': 'Import JSON',
  'import.placeholder': 'Paste JSON content...',
  'import.cancel': 'Cancel',
  'import.confirm': 'Import',

  // Preview
  'preview.title': 'Preview',
  'preview.updating': 'Updating...',
  'preview.characters': 'characters',
  'preview.largeFile': 'Large file',
  'preview.truncated': '... (Content truncated)',
  'preview.largeFileHint': 'Large file, preview simplified for performance',

  // Editor
  'editor.treeLabel': 'JSON Tree Editor',
  'editor.previewLabel': 'JSON Preview',
  'editor.virtualMode': 'Virtual Mode',
  'editor.visibleNodes': 'visible nodes',
  'editor.virtualHint': 'Collapse nodes to enable drag & drop',

  // Node actions
  'node.addChild': 'Add Child',
  'node.duplicate': 'Duplicate',
  'node.delete': 'Delete',

  // Validation
  'validation.invalidJson': 'Invalid JSON',
  'validation.fileTooLarge': 'File too large, max 10MB',

  // Settings
  'settings.theme': 'Toggle Theme',
  'settings.language': 'Toggle Language',
};
