'use client';

import { useState, useCallback, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { PostCard } from '@/components/post/post-card';
import { KeyboardBus } from '@/components/keyboard/keyboard-bus';
import { PostEditor } from '@/components/post/post-editor';
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
  const { isLoggedIn, requireAuth } = useAuth();
  const [newThreadAlert, setNewThreadAlert] = useState<{ title: string; author: string } | null>(null);

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
    api.getThreads(slug)
      .then((data: any) => {
        setThreads(data.items);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        // Restore saved scroll position
        const saved = sessionStorage.getItem(`pos:${slug}`);
        if (saved) {
          const idx = parseInt(saved, 10);
          setFocusedIndex(idx);
          setTimeout(() => {
            virtuosoRef.current?.scrollToIndex({ index: idx, align: 'center', behavior: 'auto' });
          }, 100);
          sessionStorage.removeItem(`pos:${slug}`);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor) return;
    api.getThreads(slug, nextCursor).then((data: any) => {
      setThreads((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    });
  }, [slug, nextCursor]);

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
        case 'new_thread':
          if (!requireAuth()) break;
          setShowEditor(true);
          break;
        case 'go_back':
          router.push('/');
          break;
        case 'refresh':
          setNextCursor(null);
          api.getThreads(slug).then((data: any) => {
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full">
      {/* KeyboardBus always mounted */}
      <KeyboardBus mode="list" onAction={handleKeyboardAction} />

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
            {threads.length} 个主题
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

      {/* Thread List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
          加载中...
        </div>
      ) : (
        <div className="flex-1">
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
        </div>
      )}

      <PostEditor
        boardSlug={slug}
        open={showEditor}
        onClose={() => setShowEditor(false)}
        onSuccess={() => {
          api.getThreads(slug).then((data: any) => {
            setThreads(data.items);
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
          });
        }}
      />
    </div>
  );
}
