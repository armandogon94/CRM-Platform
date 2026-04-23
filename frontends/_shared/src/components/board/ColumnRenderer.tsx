import React from 'react';
import { Check, X, ExternalLink, Paperclip, Star, Mail, Phone } from 'lucide-react';
import type { Column } from '../../types/index';
import { StatusBadge } from '../common/StatusBadge';
import { PersonAvatar } from '../common/PersonAvatar';
import { normalizeStatusValue, type StatusOption } from '../../utils/status';

interface ColumnRendererProps {
  column: Column;
  value: any;
  compact?: boolean;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

function formatNumber(value: number, config: Record<string, any>): string {
  const prefix = config.prefix || '';
  const suffix = config.suffix || '';

  if (config.format === 'currency') {
    const currency = config.currency || 'USD';
    try {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      });
    } catch {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
  }

  if (config.format === 'percentage') {
    return `${value}%`;
  }

  return `${prefix}${value.toLocaleString()}${suffix ? ` ${suffix}` : ''}`;
}

export function ColumnRenderer({ column, value, compact = false }: ColumnRendererProps) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-300">-</span>;
  }

  switch (column.columnType) {
    case 'status': {
      // Normalise the three historical seed shapes (string / {label,color} /
      // {labelId}) to a canonical { label, color }. See utils/status.ts for
      // the full rationale.
      const options = (column.config as { options?: StatusOption[] })?.options;
      const normalised = normalizeStatusValue(value, options);
      if (!normalised) return <span className="text-gray-300">-</span>;
      return (
        <StatusBadge
          label={normalised.label}
          color={normalised.color}
          size={compact ? 'sm' : 'md'}
        />
      );
    }

    case 'text': {
      const text = String(value);
      if (compact && text.length > 30) {
        return (
          <span className="text-sm text-gray-700" title={text}>
            {text.slice(0, 30)}...
          </span>
        );
      }
      return <span className="text-sm text-gray-700">{text}</span>;
    }

    case 'long_text': {
      const text = String(value);
      const maxLen = compact ? 50 : 120;
      if (text.length > maxLen) {
        return (
          <span className="text-sm text-gray-600" title={text}>
            {text.slice(0, maxLen)}...
          </span>
        );
      }
      return <span className="text-sm text-gray-600">{text}</span>;
    }

    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return <span className="text-sm text-gray-400">-</span>;
      return (
        <span className="font-mono text-sm text-gray-700">
          {formatNumber(num, column.config)}
        </span>
      );
    }

    case 'date': {
      const dateStr =
        typeof value === 'object' && value.date ? value.date : String(value);
      const config = column.config as { include_time?: boolean };
      const d = new Date(dateStr);

      if (config.include_time) {
        return (
          <span className="text-sm text-gray-700">
            {formatDate(dateStr)}{' '}
            <span className="text-gray-400">
              {d.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </span>
        );
      }
      return <span className="text-sm text-gray-700">{formatDate(dateStr)}</span>;
    }

    case 'person': {
      const persons = Array.isArray(value) ? value : [value];
      return (
        <div className="flex items-center gap-1">
          {persons.map((person: any, idx: number) => {
            const name =
              typeof person === 'string'
                ? person
                : person.name ||
                  `${person.firstName || ''} ${person.lastName || ''}`.trim();
            const avatar = typeof person === 'object' ? person.avatar : null;
            return (
              <PersonAvatar
                key={idx}
                name={name || 'Unknown'}
                avatar={avatar}
                size={compact ? 'sm' : 'md'}
                showName={!compact && persons.length === 1}
              />
            );
          })}
          {compact && persons.length > 1 && (
            <span className="text-xs text-gray-500 ml-1">+{persons.length - 1}</span>
          )}
        </div>
      );
    }

    case 'email': {
      const email = String(value);
      return (
        <a
          href={`mailto:${email}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail size={12} />
          {compact ? email.split('@')[0] : email}
        </a>
      );
    }

    case 'phone': {
      const phone = String(value);
      return (
        <a
          href={`tel:${phone}`}
          className="text-sm text-gray-700 hover:text-blue-600 inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone size={12} />
          {phone}
        </a>
      );
    }

    case 'dropdown': {
      const items = Array.isArray(value) ? value : [value];
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((item: any, idx: number) => {
            const label = typeof item === 'string' ? item : item.label;
            const color = typeof item === 'object' ? item.color : '#6B7280';
            return (
              <StatusBadge key={idx} label={label} color={color} size={compact ? 'sm' : 'md'} />
            );
          })}
        </div>
      );
    }

    case 'checkbox': {
      const isChecked = Boolean(value);
      return isChecked ? (
        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
          <Check size={14} className="text-white" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded border-2 border-gray-300" />
      );
    }

    case 'url': {
      const url = typeof value === 'object' ? value.url : String(value);
      const displayText =
        typeof value === 'object' && value.text ? value.text : url;
      const truncated =
        compact && displayText.length > 25 ? displayText.slice(0, 25) + '...' : displayText;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
          title={url}
        >
          {truncated}
          <ExternalLink size={12} />
        </a>
      );
    }

    case 'files': {
      const files = Array.isArray(value) ? value : [];
      const count = files.length;
      if (count === 0) return <span className="text-gray-300">-</span>;
      return (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
          <Paperclip size={12} />
          {count} {count === 1 ? 'file' : 'files'}
        </span>
      );
    }

    case 'formula': {
      const display = typeof value === 'object' ? value.result : value;
      return (
        <span className="text-sm font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
          {String(display)}
        </span>
      );
    }

    case 'timeline': {
      const start = value.start || value.from;
      const end = value.end || value.to;
      if (!start || !end) return <span className="text-gray-300">-</span>;
      return (
        <span className="text-sm text-gray-700">
          {formatDate(start)} &mdash; {formatDate(end)}
        </span>
      );
    }

    case 'rating': {
      const rating = Number(value) || 0;
      const maxRating = (column.config as { max?: number })?.max || 5;
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxRating }, (_, i) => (
            <Star
              key={i}
              size={compact ? 12 : 14}
              className={
                i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }
            />
          ))}
        </div>
      );
    }

    default:
      return <span className="text-sm text-gray-700">{String(value)}</span>;
  }
}
