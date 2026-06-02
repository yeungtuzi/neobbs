'use client';

import { useRef, useState, useCallback } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { PostCard } from './post-card';
import { KeyboardBus } from '../keyboard/keyboard-bus';
import type { ThreadItem } from './post-card';

interface Props {
  items: ThreadItem[];
  boardSlug: string;
  hasMore: boolean;
  onLoadMore: () => void;
  onKeyboardAction?: (action: string, focusedIndex: number) => void;
}

export function VirtualizedPostList({
  items,
  boardSlug,
  hasMore,
  onLoadMore,
  onKeyboardAction,
}: Props) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'next_item':
          setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
          virtuosoRef.current?.scrollToIndex({
            index: focusedIndex + 1, align: 'center', behavior: 'auto',
          });
          break;
        case 'prev_item':
          setFocusedIndex((i) => Math.max(0, i - 1));
          virtuosoRef.current?.scrollToIndex({
            index: Math.max(0, focusedIndex - 1), align: 'center', behavior: 'auto',
          });
          break;
        case 'goto_top':
          setFocusedIndex(0);
          virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'auto' });
          break;
        case 'goto_bottom':
          virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'auto' });
          break;
        default:
          onKeyboardAction?.(action, focusedIndex);
      }
    },
    [focusedIndex, items.length, onKeyboardAction],
  );

  const loadMore = useCallback(() => {
    if (hasMore) onLoadMore();
  }, [hasMore, onLoadMore]);

  return (
    <div className="flex-1 relative">
      <KeyboardBus mode="list" onAction={handleAction} />

      <Virtuoso
        ref={virtuosoRef}
        data={items}
        fixedItemHeight={64}
        overscan={200}
        endReached={loadMore}
        computeItemKey={(_, item) => item.id}
        itemContent={(index, item) => (
          <PostCard
            key={item.id}
            item={item}
            isFocused={index === focusedIndex}
            index={index}
            boardSlug={boardSlug}
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
  );
}
