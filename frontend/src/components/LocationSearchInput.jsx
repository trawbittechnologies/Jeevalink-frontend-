import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Navigation } from 'lucide-react';
import { searchLocationPhoton } from '../services/mapService';

export default function LocationSearchInput({
  onSelectLocation,
  placeholder = 'Search address, hospital, or landmark (OSM Photon)...',
  initialValue = '',
  className = '',
  proximityLat = null,
  proximityLng = null
}) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Photon Autocomplete Search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchLocationPhoton(query, {
        limit: 6,
        lat: proximityLat,
        lng: proximityLng
      });
      setSuggestions(results);
      setLoading(false);
      setIsOpen(results.length > 0);
    }, 280);

    return () => clearTimeout(timer);
  }, [query, proximityLat, proximityLng]);

  const handleSelect = (item) => {
    setQuery(item.displayName);
    setIsOpen(false);
    if (onSelectLocation) {
      onSelectLocation(item);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    if (onSelectLocation) {
      onSelectLocation(null);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all shadow-xs"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-150">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-rose-500" /> Photon OpenStreetMap Search
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">{suggestions.length} results</span>
          </div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/40 py-1">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 hover:bg-rose-50/70 dark:hover:bg-zinc-800/60 transition-colors group cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {item.displayName}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
