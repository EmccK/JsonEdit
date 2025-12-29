export interface ValidationResult {
  valid: boolean;
  error?: string;
  position?: {
    line: number;
    column: number;
  };
}

export const validateJson = (jsonString: string): ValidationResult => {
  if (!jsonString.trim()) {
    return { valid: false, error: 'JSON 不能为空' };
  }

  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (e) {
    if (e instanceof SyntaxError) {
      const match = e.message.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1], 10);
        const lines = jsonString.substring(0, position).split('\n');
        return {
          valid: false,
          error: e.message,
          position: {
            line: lines.length,
            column: lines[lines.length - 1].length + 1,
          },
        };
      }
      return { valid: false, error: e.message };
    }
    return { valid: false, error: '未知解析错误' };
  }
};

export const formatJson = (jsonString: string, indent: number = 2): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch {
    return jsonString;
  }
};

export const minifyJson = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch {
    return jsonString;
  }
};

