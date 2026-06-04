'use client';

import { useState, useCallback, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { PostCard } from '@/components/post/post-card';
import { KeyboardBus } from '@/components/keyboard/keyboard-bus';
import { PostEditor } from '@/components/post/post-editor';
import { SearchOverlay } from '@/components/search/search-overlay';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import type { ThreadItem } from '@/components/post/post-card';

export default function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [boardName, setBoardName] = useState('');
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [boardId, setBoardId] = useState<string | null>(null);
  const { user, isLoggedIn, requireAuth } = useAuth();
  const [newThreadAlert, setNewThreadAlert] = useState<{ title: string; author: string } | null>(null);
  const [digestMode, setDigestMode] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [cleanupFrom, setCleanupFrom] = useState('');
  const [cleanupTo, setCleanupTo] = useState('');
  const [showRecycle, setShowRecycle] = useState(false);
  const [recycleItems, setRecycleItems] = useState<any[]>([]);
  const isMod = user?.role === 'moderator' || user?.role === 'admin';
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handler = () => setShowSearch(true);
    window.addEventListener('open-search', handler);
    return () => window.removeEventListener('open-search', handler);
  }, []);

  const handleCleanup = async () => {
    const from = parseInt(cleanupFrom), to = parseInt(cleanupTo);
    if (isNaN(from) || isNaN(to) || from > to) return;
    const res: any = await api.batchDelete(slug, from, to);
    alert(`已清理 ${res.deleted} 篇帖子 (保留精华 ${res.protectedPosts || 0} 篇)`);
    setShowCleanup(false); setDigestMode(false);
    api.getThreads(slug, undefined, false).then((data: any) => {
      setThreads(data.items); setNextCursor(data.nextCursor); setHasMore(data.hasMore);
    });
  };

  const loadRecycle = () => {
    api.getDeletedPosts(slug).then((data: any) => setRecycleItems(data.items));
    setShowRecycle(true);
  };

  // WebSocket: join board room, listen for new threads
  const { joinBoard, leaveBoard } = useWebSocket({
    onNewThread: (t) => setNewThreadAlert({ title: t.title, author: t.author.username }),
  });
  useEffect(() => {
    if (boardId) { joinBoard(boardId); return () => { leaveBoard(boardId); }; }
  }, [boardId, joinBoard, leaveBoard]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    api.getBoard(slug).then((b: any) => { setBoardName(b.name); setBoardId(b.id); }).catch(() => {});
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    api.getThreads(slug, undefined, digestMode)
      .then((data: any) => {
        setThreads(data.items);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        // Restore saved scroll position — Virtuoso is always mounted so a single
        // rAF is enough to wait for it to process the new data prop.
        const saved = sessionStorage.getItem(`pos:${slug}`);
        if (saved) {
          const idx = parseInt(saved, 10);
          setFocusedIndex(idx);
          sessionStorage.removeItem(`pos:${slug}`);
          requestAnimationFrame(() => {
            virtuosoRef.current?.scrollToIndex({ index: idx, align: 'center', behavior: 'auto' });
          });
        }
      })
      .finally(() => setLoading(false));
  }, [slug, digestMode]);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor) return;
    api.getThreads(slug, nextCursor, digestMode).then((data: any) => {
      setThreads((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    });
  }, [slug, nextCursor, digestMode]);

  const handleKeyboardAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'next_item':
          setFocusedIndex((i) => Math.min(i + 1, threads.length - 1));
          virtuosoRef.current?.scrollToIndex({
            index: focusedIndex + 1,
            align: 'center',
            behavior: 'auto',
          });
          break;
        case 'prev_item':
          setFocusedIndex((i) => Math.max(0, i - 1));
          virtuosoRef.current?.scrollToIndex({
            index: Math.max(0, focusedIndex - 1),
            align: 'center',
            behavior: 'auto',
          });
          break;
        case 'goto_top':
          setFocusedIndex(0);
          virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'auto' });
          break;
        case 'goto_bottom':
          virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'auto' });
          break;
        case 'enter_thread': {
          const item = threads[focusedIndex];
          if (item) {
            sessionStorage.setItem(`pos:${slug}`, String(focusedIndex));
            router.push(`/b/${slug}/${item.id}`);
          }
          break;
        }
        case 'toggle_digest':
          setDigestMode((v) => !v);
          break;
        case 'new_thread':
          if (!requireAuth()) break;
          setShowEditor(true);
          break;
        case 'go_back':
          router.push('/');
          break;
        case 'refresh':
          setNextCursor(null);
          api.getThreads(slug, undefined, digestMode).then((data: any) => {
            setThreads(data.items);
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
          });
          break;
      }
    },
    [slug, threads, focusedIndex, router],
  );

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full relative">
      {/* KeyboardBus always mounted */}
      <KeyboardBus mode="list" onAction={handleKeyboardAction} hints={['j/↓ 下', 'k/↑ 上', '→ 打开', '← 返回', 'Ctrl+N 发帖', '/ 搜索']} />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--text-secondary)]/10
                         bg-[var(--bg-card)]">
        <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--accent-cyan)]">
            {boardName || slug}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {digestMode ? `精华区 · ${threads.length} 篇` : `${threads.length} 个主题`}
            {digestMode && (
              <button onClick={() => setDigestMode(false)}
                      className="ml-2 text-[var(--accent-cyan)] hover:underline">返回全部</button>
            )}
          </p>
        </div>
        {isLoggedIn && (
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                     bg-[var(--accent-cyan)] text-white hover:opacity-80 transition-opacity"
          onClick={() => setShowEditor(true)}
        >
          <Plus className="w-4 h-4" />
          发帖
        </button>
        )}
        {isMod && (
          <>
            <button onClick={() => setShowCleanup((v) => !v)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors">
              清理
            </button>
            <button onClick={() => loadRecycle()}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors">
              回收站
            </button>
          </>
        )}
      </header>

      {/* New thread alert from WebSocket */}
      {newThreadAlert && (
        <div className="px-4 py-2 bg-[var(--accent-green)]/10 border-b border-[var(--accent-green)]/20
                        text-sm text-[var(--accent-green)] flex items-center gap-2">
          <span>🆕 <strong>{newThreadAlert.author}</strong> 发了新帖: {newThreadAlert.title}</span>
          <button onClick={() => { setNewThreadAlert(null); handleKeyboardAction('refresh'); }}
                  className="ml-auto text-xs text-[var(--accent-cyan)] hover:underline">刷新查看</button>
        </div>
      )}

      {/* Cleanup panel */}
      {showCleanup && (
        <div className="px-4 py-3 bg-[var(--accent-red)]/5 border-b border-[var(--accent-red)]/20 text-sm flex items-center gap-3 flex-wrap">
          <span className="text-[var(--accent-red)]">批量清理:</span>
          <span className="text-[var(--text-secondary)]">从 #</span>
          <input value={cleanupFrom} onChange={(e) => setCleanupFrom(e.target.value)}
                 className="w-16 px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--text-secondary)]/20 text-xs text-center" />
          <span className="text-[var(--text-secondary)]">到 #</span>
          <input value={cleanupTo} onChange={(e) => setCleanupTo(e.target.value)}
                 className="w-16 px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--text-secondary)]/20 text-xs text-center" />
          <button onClick={handleCleanup}
                  className="px-3 py-1 rounded bg-[var(--accent-red)] text-white text-xs hover:opacity-80">执行清理</button>
          <button onClick={() => setShowCleanup(false)}
                  className="text-xs text-[var(--text-secondary)] hover:underline">取消</button>
          <span className="text-[10px] text-[var(--text-secondary)]">跳过精华帖及其父帖</span>
        </div>
      )}

      {/* Recycle bin */}
      {showRecycle && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
             onClick={() => setShowRecycle(false)}>
          <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
               onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-[var(--text-secondary)]/10 flex items-center">
              <h3 className="text-sm font-semibold text-[var(--accent-red)]">回收站</h3>
              <button onClick={() => setShowRecycle(false)}
                      className="ml-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {recycleItems.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-8">回收站为空</p>
              ) : (
                recycleItems.map((item: any) => (
                  <div key={item.id} className="px-3 py-2 border-b border-[var(--text-secondary)]/5 text-sm">
                    <span className="font-mono text-xs text-[var(--text-secondary)]">#{item.postNumber}</span>
                    <span className="ml-2 text-[var(--accent-cyan)]">{item.thread.title}</span>
                    <span className="ml-2 text-xs text-[var(--text-secondary)]">— {item.author.username}</span>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{item.plainText}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thread List — Virtuoso always mounted so scrollToIndex works on first paint */}
      <div className="flex-1 relative">
        <Virtuoso
          ref={virtuosoRef}
          data={threads}
          fixedItemHeight={64}
          overscan={200}
          endReached={handleLoadMore}
          computeItemKey={(_, item) => item.id}
          itemContent={(index, item) => (
            <PostCard
              key={item.id}
              item={item}
              isFocused={index === focusedIndex}
              index={index}
              boardSlug={slug}
            />
          )}
          components={{
            Footer: () =>
              hasMore ? (
                <div className="py-4 text-center text-xs text-[var(--text-secondary)]">
                  加载中...
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-[var(--text-secondary)]">
                  — 已显示全部帖子 —
                </div>
              ),
          }}
          style={{ height: '100%' }}
        />
        {/* Loading overlay — hides Virtuoso while data loads, but Virtuoso stays mounted */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
            加载中...
          </div>
        )}
      </div>

      <PostEditor
        boardSlug={slug}
        open={showEditor}
        onClose={() => setShowEditor(false)}
        onSuccess={() => {
          api.getThreads(slug, undefined, digestMode).then((data: any) => {
            setThreads(data.items);
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
          });
        }}
      />

      <SearchOverlay open={showSearch} onClose={() => setShowSearch(false)} boardSlug={slug} boardName={boardName} />
    </div>
  );
}
