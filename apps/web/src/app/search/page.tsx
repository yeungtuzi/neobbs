'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, ArrowLeft, MessageSquare, Clock } from 'lucide-react';
import { KeyboardBus } from '@/components/keyboard/keyboard-bus';
import { api } from '@/lib/api-client';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) return;
    setLoading(true);
    try {
      const data = await api.search(q);
      setResults((data as any).items || []);
      setTotal((data as any).total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) doSearch(query.trim());
  };

  const handleKeyboardAction = useCallback(
    (action: string) => {
      if (action === 'focus_search') {
        inputRef.current?.focus();
      }
    },
    [],
  );

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full">
      <KeyboardBus mode="search" onAction={handleKeyboardAction} />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--text-secondary)]/10
                         bg-[var(--bg-card)]">
        <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            data-search-input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索帖子 (输入后按 Enter)..."
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-primary)]
                       border border-[var(--text-secondary)]/20
                       text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
                       focus:outline-none focus:border-[var(--accent-cyan)] text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--accent-cyan)] text-white text-sm
                       hover:opacity-80 transition-opacity"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
        </form>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--text-secondary)]">
            搜索中...
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="px-4 py-2 text-xs text-[var(--text-secondary)] border-b border-[var(--text-secondary)]/5">
              找到 {total} 条结果
            </div>
            {results.map((item) => (
              <Link
                key={item.id}
                href={`/b/${item.boardSlug}/${item.threadId}`}
                className="block px-5 py-4 border-b border-[var(--text-secondary)]/5
                           bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-[var(--accent-cyan)]">{item.boardName}</span>
                  <span>·</span>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                  <span>·</span>
                  <span>{item.author?.username}</span>
                </div>
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  {item.threadTitle}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                  {item.snippet}
                </p>
              </Link>
            ))}
          </div>
        ) : query.length > 0 ? (
          <div className="flex items-center justify-center py-20 text-[var(--text-secondary)]">
            无搜索结果
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-[var(--text-secondary)] text-sm">
            <p>输入关键词搜索帖子内容，按 Enter 搜索</p>
          </div>
        )}
      </div>
    </div>
  );
}
