'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, MessageSquare, Clock, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';

interface Props {
  open: boolean;
  onClose: () => void;
  boardSlug?: string; // if provided, search within this board
  boardName?: string;
}

export function SearchOverlay({ open, onClose, boardSlug, boardName }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [open, onClose]);

  const doSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const data: any = await api.search(query, boardSlug);
      setResults(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [query, boardSlug]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }

    // If input is focused, only handle Enter for search
    if (document.activeElement === inputRef.current) {
      if (e.key === 'Enter') { e.preventDefault(); doSearch(); setFocusedIdx(-1); }
      if (e.key === 'ArrowDown' && results.length > 0) {
        e.preventDefault(); setFocusedIdx(0);
        setTimeout(() => resultRefs.current.get(0)?.focus(), 0);
      }
      return;
    }

    // Results navigation
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(0, i - 1));
    }
    if (e.key === 'Enter' && focusedIdx >= 0 && results[focusedIdx]) {
      e.preventDefault();
      onClose();
    }
    // Type to refocus input
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      inputRef.current?.focus();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
         onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden border border-[var(--text-secondary)]/10"
           onMouseDown={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--text-secondary)]/10">
          <Search className="w-4 h-4 text-[var(--accent-cyan)] flex-shrink-0" />
          <input
            ref={inputRef}
            data-search-input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={boardSlug ? `搜索「${boardName || boardSlug}」版面...` : '全站搜索...'}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
                       focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono text-[var(--text-secondary)] border-l border-[var(--text-secondary)]/10 pl-2">
            Enter 搜索 · Esc 关闭
          </span>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[var(--text-secondary)]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> 搜索中...
            </div>
          ) : searched && results.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-secondary)]">无结果</div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-4 py-2 text-xs text-[var(--text-secondary)] border-b border-[var(--text-secondary)]/5">
                找到 {total} 条{boardSlug ? `（仅限「${boardName || boardSlug}」版面）` : ''}
              </div>
              {results.map((item: any, idx: number) => (
                <Link
                  key={item.id}
                  href={`/b/${item.boardSlug}/${item.threadId}`}
                  ref={(el) => { if (el) resultRefs.current.set(idx, el); }}
                  onClick={onClose}
                  className={`block px-4 py-3 border-b border-[var(--text-secondary)]/5 transition-colors ${
                    idx === focusedIdx ? 'bg-[var(--bg-hover)] border-l-2 border-l-[var(--accent-yellow)]' : 'hover:bg-[var(--bg-hover)]'
                  }`}
                  onMouseEnter={() => setFocusedIdx(idx)}
                >
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-[var(--accent-cyan)]">{item.boardName}</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                    <span>{item.author?.username}</span>
                  </div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">{item.threadTitle}</h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{item.snippet}</p>
                </Link>
              ))}
            </div>
          ) : query.length > 0 && !searched ? (
            <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
              按 Enter 搜索
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
