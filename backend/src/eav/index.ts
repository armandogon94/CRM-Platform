import { ColumnTypeHandler } from './ColumnTypeHandler';
import { StatusHandler } from './handlers/StatusHandler';
import { TextHandler } from './handlers/TextHandler';
import { LongTextHandler } from './handlers/LongTextHandler';
import { NumberHandler } from './handlers/NumberHandler';
import { DateHandler } from './handlers/DateHandler';
import { PersonHandler } from './handlers/PersonHandler';
import { EmailHandler } from './handlers/EmailHandler';
import { PhoneHandler } from './handlers/PhoneHandler';
import { DropdownHandler } from './handlers/DropdownHandler';
import { CheckboxHandler } from './handlers/CheckboxHandler';
import { UrlHandler } from './handlers/UrlHandler';
import { FilesHandler } from './handlers/FilesHandler';
import { FormulaHandler } from './handlers/FormulaHandler';
import { TimelineHandler } from './handlers/TimelineHandler';
import { RatingHandler } from './handlers/RatingHandler';

// ─── Handler Registry ──────────────────────────────────────────────────────────

const handlerRegistry = new Map<string, ColumnTypeHandler>();

handlerRegistry.set('status', new StatusHandler());
handlerRegistry.set('text', new TextHandler());
handlerRegistry.set('long_text', new LongTextHandler());
handlerRegistry.set('number', new NumberHandler());
handlerRegistry.set('date', new DateHandler());
handlerRegistry.set('person', new PersonHandler());
handlerRegistry.set('email', new EmailHandler());
handlerRegistry.set('phone', new PhoneHandler());
handlerRegistry.set('dropdown', new DropdownHandler());
handlerRegistry.set('checkbox', new CheckboxHandler());
handlerRegistry.set('url', new UrlHandler());
handlerRegistry.set('files', new FilesHandler());
handlerRegistry.set('formula', new FormulaHandler());
handlerRegistry.set('timeline', new TimelineHandler());
handlerRegistry.set('rating', new RatingHandler());

// ─── Public API ─────────────────────────────────────────────────────────────────

export function getHandler(columnType: string): ColumnTypeHandler {
  const handler = handlerRegistry.get(columnType);
  if (!handler) {
    throw new Error(`Unknown column type: ${columnType}`);
  }
  return handler;
}

export function getAllHandlers(): Map<string, ColumnTypeHandler> {
  return handlerRegistry;
}

export function getColumnTypes(): string[] {
  return Array.from(handlerRegistry.keys());
}

// ─── Re-exports ─────────────────────────────────────────────────────────────────

export { ColumnTypeHandler, ColumnConfig, AggregateResult, ValidationResult } from './ColumnTypeHandler';

export { StatusHandler } from './handlers/StatusHandler';
export { TextHandler } from './handlers/TextHandler';
export { LongTextHandler } from './handlers/LongTextHandler';
export { NumberHandler } from './handlers/NumberHandler';
export { DateHandler } from './handlers/DateHandler';
export { PersonHandler } from './handlers/PersonHandler';
export { EmailHandler } from './handlers/EmailHandler';
export { PhoneHandler } from './handlers/PhoneHandler';
export { DropdownHandler } from './handlers/DropdownHandler';
export { CheckboxHandler } from './handlers/CheckboxHandler';
export { UrlHandler } from './handlers/UrlHandler';
export { FilesHandler } from './handlers/FilesHandler';
export { FormulaHandler } from './handlers/FormulaHandler';
export { TimelineHandler } from './handlers/TimelineHandler';
export { RatingHandler } from './handlers/RatingHandler';
