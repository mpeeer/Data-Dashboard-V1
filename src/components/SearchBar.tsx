// Data search bar for the topbar. Searches across all columns and rows
// case-insensitively, shows results in a dropdown, and lets the user
// click a result to select that column in the sidebar outline.
// Supports keyboard nav (arrows, Enter, Escape) and click-outside-to-close.
// Shows "No matches found" when the query has zero results.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Row } from '../utils/fileParser';

export interface SearchResult {
  column: string;
  value: string;
  rowIndex: number;
}

interface SearchBarProps {
  rows: Row[];
  columns: string[];
  onSelectColumn: (column: string) => void;
  onSearch?: (query: string) => void;
}

const MAX_RESULTS = 20;
const DEBOUNCE_MS = 150;

export function SearchBar({ rows, columns, onSelectColumn, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeIdxRef = useRef(activeIdx);
  activeIdxRef.current = activeIdx;

  // Debounce
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  // Notify parent of debounced query for table highlighting
  useEffect(() => {
    onSearch?.(debounced.trim());
  }, [debounced, onSearch]);

  // Search
  const results = useMemo<SearchResult[]>(() => {
    if (!debounced.trim() || rows.length === 0) return [];
    const q = debounced.toLowerCase();
    const out: SearchResult[] = [];
    for (let ri = 0; ri < rows.length && out.length < MAX_RESULTS; ri++) {
      const row = rows[ri];
      for (const col of columns) {
        const v = row[col];
        if (v === null || v === undefined) continue;
        const s = String(v);
        if (s.toLowerCase().includes(q)) {
          out.push({ column: col, value: s, rowIndex: ri + 1 });
          if (out.length >= MAX_RESULTS) break;
        }
      }
    }
    return out;
  }, [debounced, rows, columns]);

  const hasQuery = !!debounced.trim();

  // Open/close based on query and results
  useEffect(() => {
    if (hasQuery) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [hasQuery]);

  // Instant close when the user clears the input (don't wait for debounce).
  useEffect(() => {
    if (!query.trim()) setOpen(false);
  }, [query]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [results]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keyboard navigation — uses ref for activeIdx to avoid recreating the
  // callback on every arrow key press.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;

      // "No results" state: only Escape works
      if (results.length === 0) {
        if (e.key === 'Escape') {
          setOpen(false);
          setQuery('');
        }
        return;
      }

      const idx = activeIdxRef.current;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIdx((idx + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIdx((idx - 1 + results.length) % results.length);
          break;
        case 'Enter': {
          e.preventDefault();
          const r = results[idx];
          if (r) {
            onSelectColumn(r.column);
            setOpen(false);
            setQuery('');
          }
          break;
        }
        case 'Escape':
          setOpen(false);
          setQuery('');
          break;
      }
    },
    [open, results, onSelectColumn],
  );

  const selectResult = useCallback(
    (r: SearchResult) => {
      onSelectColumn(r.column);
      setOpen(false);
      setQuery('');
    },
    [onSelectColumn],
  );

  const truncated = results.length >= MAX_RESULTS;

  return (
    <div className="search-bar" ref={rootRef}>
      <div className="search-input-wrap">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search data…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (hasQuery) setOpen(true);
          }}
          aria-label="Search dataset"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => {
              setQuery('');
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div className="search-drop" role="listbox">
          {results.length > 0 ? (
            <>
              <div className="search-drop-head">
                {results.length} match{results.length !== 1 ? 'es' : ''}
                {truncated && ' (first 20 shown)'}
              </div>
              <div className="search-results">
                {results.map((r, i) => (
                  <button
                    key={`${r.rowIndex}-${r.column}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === activeIdx}
                    className={`search-result ${i === activeIdx ? 'is-active' : ''}`}
                    onClick={() => selectResult(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <span className="search-result-col">{r.column}</span>
                    <span className="search-result-val">{r.value}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="search-drop-head">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
