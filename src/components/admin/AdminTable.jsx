import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';

/**
 * AdminTable — Generic sortable, paginated, bulk-selectable table.
 *
 * Props:
 *   columns      { key, label, sortable?, render? }[]
 *   data         object[]
 *   pageSize     number (default 25)
 *   onExport     () => void  — optional CSV export handler
 *   rowActions   (row) => ReactNode — inline action buttons per row
 *   searchKeys   string[]  — keys to search across
 *   emptyMessage string
 *   loading      boolean
 *   onBulkAction (selectedIds) => void
 *   bulkLabel    string
 */
export default function AdminTable({
  columns = [],
  data = [],
  pageSize = 25,
  onExport,
  rowActions,
  searchKeys = [],
  emptyMessage = 'No records found.',
  loading = false,
  onBulkAction,
  bulkLabel = 'Bulk Action',
  selectable = false,
}) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    let d = data;
    if (search.trim() && searchKeys.length) {
      const q = search.toLowerCase();
      d = d.filter(row => searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q)));
    }
    return d;
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setPage(1);
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map(r => r._id || r.id)));
    }
  };

  const toggleRow = (id) => {
    setSelected(s => {
      const ns = new Set(s);
      ns.has(id) ? ns.delete(id) : ns.add(id);
      return ns;
    });
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectable && selected.size > 0 && onBulkAction && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => { onBulkAction(Array.from(selected)); setSelected(new Set()); }}
              className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              {bulkLabel} ({selected.size})
            </motion.button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold rounded-lg hover:text-slate-200 hover:bg-white/8 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-white/20 bg-white/5 accent-red-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sort.key === col.key && (
                      sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-red-400" /> : <ChevronDown className="w-3 h-3 text-red-400" />
                    )}
                  </span>
                </th>
              ))}
              {rowActions && <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {(selectable ? [null] : []).concat(columns).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-white/5 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-12 text-center text-slate-600 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {paginated.map((row, idx) => {
                  const id = row._id || row.id;
                  const isSelected = selected.has(id);
                  return (
                    <motion.tr
                      key={id || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b border-white/[0.04] transition-colors ${isSelected ? 'bg-red-500/5' : 'hover:bg-white/[0.02]'}`}
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                            className="rounded border-white/20 bg-white/5 accent-red-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map(col => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {col.render ? col.render(row[col.key], row) : (
                            <span className="text-slate-300 text-xs">{row[col.key] ?? '—'}</span>
                          )}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-4 py-3">
                          {rowActions(row)}
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <span className="text-slate-600 text-xs">
            {sorted.length} records • Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    p === page ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
