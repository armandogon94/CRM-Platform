/**
 * Status column value normalization.
 *
 * Slice 19.7 QA surfaced three historical seed shapes for Status column
 * values that accumulated organically across the 10 industries:
 *
 *   1. `{ label: 'Settled', color: '#34D399' }`  — MedVista/canonical
 *   2. `'Settled'`                              — NovaPay / JurisPath / TableSync
 *   3. `{ labelId: 'enrolled' }`                — EduPulse / DentaFlow
 *
 * Three views (ColumnRenderer, KanbanView, ChartView) assumed shape #1
 * exclusively, so anything seeded with #2 or #3 silently rendered as empty
 * cells, unbucketed Kanban lanes, and absent chart slices. Rewriting five
 * seed modules across 10+ files would be noisy and fragile; normalising in
 * the presentation layer is the defensive, localized fix.
 *
 * This helper lives in `utils/` (not inside a component file) so other
 * analytics surfaces — OverviewDashboard KPI tiles, CSV exports, future
 * automation rule builders — can share a single source of truth.
 */

export interface StatusOption {
  label: string;
  color: string;
  order?: number;
  id?: string;
}

export interface NormalizedStatus {
  label: string;
  color: string;
}

const NEUTRAL_COLOR = '#6B7280';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Normalize a raw status column value to `{ label, color }`.
 *
 * @param rawValue The value as stored in ColumnValue.value (any of three shapes).
 * @param options The Column.config.options array, used to resolve labelId→label
 *                and string→color. Safe to pass undefined.
 * @returns The canonical shape, or null if the value is empty / unparseable.
 */
export function normalizeStatusValue(
  rawValue: unknown,
  options: StatusOption[] | undefined
): NormalizedStatus | null {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return null;
  }

  // Shape 1: canonical { label, color }
  if (isPlainObject(rawValue) && typeof rawValue.label === 'string') {
    return {
      label: rawValue.label,
      color: typeof rawValue.color === 'string' ? rawValue.color : NEUTRAL_COLOR,
    };
  }

  // Shape 2: plain string → look up color from options
  if (typeof rawValue === 'string') {
    const match = options?.find((o) => o.label === rawValue);
    return {
      label: rawValue,
      color: match?.color ?? NEUTRAL_COLOR,
    };
  }

  // Shape 3: { labelId } → match to option id, falling back to case-
  // insensitive label comparison for seeds that predate the `id` field.
  if (isPlainObject(rawValue) && typeof rawValue.labelId === 'string') {
    const labelId = rawValue.labelId;
    const matchById = options?.find((o) => o.id === labelId);
    if (matchById) {
      return { label: matchById.label, color: matchById.color };
    }
    const matchByLabel = options?.find(
      (o) => o.label.toLowerCase() === labelId.toLowerCase()
    );
    if (matchByLabel) {
      return { label: matchByLabel.label, color: matchByLabel.color };
    }
    // No option matches — fall through so we return null, mirroring how
    // an unknown plain string with no options would still render (see
    // the "neutral color" case above), except we have no `label` to
    // display for an unresolved labelId.
    return null;
  }

  return null;
}
