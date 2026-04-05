import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface FormulaConfig extends ColumnConfig {
  expression: string;
  resultType: 'number' | 'text' | 'date';
}

export class FormulaHandler extends ColumnTypeHandler {
  readonly type = 'formula';
  readonly label = 'Formula';
  readonly icon = 'function-square';

  validate(_value: any, _config?: ColumnConfig): ValidationResult {
    // Formula values are always computed, so they are always valid
    return { valid: true };
  }

  serialize(value: any): any {
    // Store the computed result as-is
    if (value === null || value === undefined) return null;
    return value;
  }

  deserialize(json: any): any {
    if (json === null || json === undefined) return null;
    return json;
  }

  formatDisplay(value: any, config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';

    const formulaConfig = config as FormulaConfig | undefined;
    const resultType = formulaConfig?.resultType ?? 'text';

    switch (resultType) {
      case 'number': {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return String(value);
        return num.toLocaleString('en-US');
      }
      case 'date': {
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getUTCMonth()]} ${date.getUTCDate().toString().padStart(2, '0')}, ${date.getUTCFullYear()}`;
      }
      case 'text':
      default:
        return String(value);
    }
  }

  getDefaultValue(_config?: ColumnConfig): null {
    return null;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const nonNull = values.filter(v => v !== null && v !== undefined);
    return [
      { type: 'count', value: nonNull.length },
    ];
  }

  /**
   * Evaluate a formula expression with a given context of column values.
   *
   * Supports:
   * - Basic math: +, -, *, /
   * - Column references: {column_name}
   * - Functions: SUM(...), AVG(...), IF(condition, then, else), CONCAT(...)
   */
  evaluate(expression: string, context: Record<string, any>): any {
    try {
      // Replace column references {column_name} with their values
      let resolved = expression.replace(/\{([^}]+)\}/g, (_match, colName: string) => {
        const val = context[colName];
        if (val === null || val === undefined) return '0';
        if (typeof val === 'string') return JSON.stringify(val);
        return String(val);
      });

      // Process function calls
      resolved = this.processFunctions(resolved, context);

      // Evaluate the final math expression safely
      return this.safeEval(resolved);
    } catch {
      return null;
    }
  }

  private processFunctions(expr: string, _context: Record<string, any>): string {
    // Process nested functions from inside out
    let result = expr;
    let maxIterations = 50;

    while (maxIterations-- > 0) {
      const fnMatch = result.match(/\b(SUM|AVG|IF|CONCAT)\s*\(([^()]*)\)/i);
      if (!fnMatch) break;

      const [fullMatch, fnName, argsStr] = fnMatch;
      const args = this.splitArgs(argsStr);
      let replacement: string;

      switch (fnName.toUpperCase()) {
        case 'SUM': {
          const nums = args.map(a => this.safeEval(a.trim())).filter(v => typeof v === 'number' && !isNaN(v));
          replacement = String(nums.reduce((sum, n) => sum + n, 0));
          break;
        }
        case 'AVG': {
          const nums = args.map(a => this.safeEval(a.trim())).filter(v => typeof v === 'number' && !isNaN(v));
          replacement = nums.length > 0 ? String(nums.reduce((sum, n) => sum + n, 0) / nums.length) : '0';
          break;
        }
        case 'IF': {
          if (args.length < 3) {
            replacement = '0';
          } else {
            const condition = this.safeEval(args[0].trim());
            replacement = condition ? args[1].trim() : args[2].trim();
          }
          break;
        }
        case 'CONCAT': {
          const parts = args.map(a => {
            const trimmed = a.trim();
            // Strip surrounding quotes for string literals
            if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
              return trimmed.slice(1, -1);
            }
            const evaluated = this.safeEval(trimmed);
            return String(evaluated);
          });
          replacement = JSON.stringify(parts.join(''));
          break;
        }
        default:
          replacement = '0';
      }

      result = result.replace(fullMatch, replacement);
    }

    return result;
  }

  private splitArgs(argsStr: string): string[] {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (const char of argsStr) {
      if (inString) {
        current += char;
        if (char === stringChar) inString = false;
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === '(') {
        depth++;
        current += char;
      } else if (char === ')') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        args.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(current);
    }

    return args;
  }

  /**
   * Safely evaluate a simple math expression.
   * Only allows numbers, basic operators (+, -, *, /), parentheses,
   * comparison operators (>, <, >=, <=, ==, !=), and string literals.
   */
  private safeEval(expr: string): any {
    const trimmed = expr.trim();

    // Handle string literals
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Handle pure numbers
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    // Validate the expression only contains safe characters
    const safePattern = /^[\d\s+\-*/.()><=!]+$/;
    if (!safePattern.test(trimmed)) {
      return trimmed;
    }

    try {
      // Use Function constructor with strict validation
      // We've already validated the expression only contains safe math characters
      const fn = new Function(`"use strict"; return (${trimmed});`);
      const result = fn();
      return result;
    } catch {
      return null;
    }
  }
}
