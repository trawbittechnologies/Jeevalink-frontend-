import { Search, X, Calendar } from 'lucide-react';

/**
 * FilterBar — Reusable admin filter row with search, dropdowns, and optional date range.
 *
 * Props:
 *   search        string
 *   onSearch      (val) => void
 *   searchPlaceholder string
 *   filters       { key, label, options: {value, label}[] }[]
 *   filterValues  { [key]: value }
 *   onFilterChange (key, value) => void
 *   dateFrom      string
 *   dateTo        string
 *   onDateFrom    (val) => void
 *   onDateTo      (val) => void
 *   onReset       () => void
 */
export default function FilterBar({
  search = '',
  onSearch,
  searchPlaceholder = 'Search...',
  filters = [],
  filterValues = {},
  onFilterChange,
  dateFrom,
  dateTo,
  onDateFrom,
  onDateTo,
  onReset,
}) {
  const hasActiveFilters = search ||
    Object.values(filterValues).some(v => v && v !== 'all') ||
    dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        <input
          value={search}
          onChange={e => onSearch?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/[0.08] rounded-lg text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 transition-colors"
        />
      </div>

      {/* Filter dropdowns */}
      {filters.map(filter => (
        <select
          key={filter.key}
          value={filterValues[filter.key] || 'all'}
          onChange={e => onFilterChange?.(filter.key, e.target.value)}
          className="py-2 pl-3 pr-7 bg-white/5 border border-white/[0.08] rounded-lg text-slate-300 text-xs focus:outline-none focus:border-red-500/40 transition-colors cursor-pointer appearance-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
        >
          <option value="all">{filter.label}: All</option>
          {filter.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}

      {/* Date range */}
      {(onDateFrom || onDateTo) && (
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          {onDateFrom && (
            <input
              type="date"
              value={dateFrom || ''}
              onChange={e => onDateFrom(e.target.value)}
              className="py-2 px-2 bg-white/5 border border-white/[0.08] rounded-lg text-slate-300 text-xs focus:outline-none focus:border-red-500/40 transition-colors cursor-pointer"
            />
          )}
          {onDateTo && (
            <>
              <span className="text-slate-600 text-xs">—</span>
              <input
                type="date"
                value={dateTo || ''}
                onChange={e => onDateTo(e.target.value)}
                className="py-2 px-2 bg-white/5 border border-white/[0.08] rounded-lg text-slate-300 text-xs focus:outline-none focus:border-red-500/40 transition-colors cursor-pointer"
              />
            </>
          )}
        </div>
      )}

      {/* Reset */}
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-2 bg-white/5 border border-white/[0.08] rounded-lg text-slate-500 text-xs hover:text-slate-300 hover:bg-white/8 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" /> Reset
        </button>
      )}
    </div>
  );
}
