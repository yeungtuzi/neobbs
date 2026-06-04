'use client';

import { useState, useEffect, useRef } from 'react';
import type { NavMode } from '@neobbs/shared/constants';

interface KeyboardBusProps {
  mode: NavMode;
  onAction: (action: string) => void;
  hints?: string[];
}

const BROWSER_KEYS = new Set([
  't','T','w','W','l','L','d','D','h','H','j','J','q','Q','a','A','c','C','b','B','f','F','g','G',
]);

export function KeyboardBus({ mode, onAction, hints }: KeyboardBusProps) {
  const [lastKey, setLastKey] = useState('');
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // ── Direct key listener ──
  useEffect(() => {
    const ggBuffer: string[] = [];

    const handler = (e: KeyboardEvent) => {
      const m = modeRef.current;
      const act = onActionRef.current;
      // Pass through browser combos
      if ((e.ctrlKey || e.metaKey) && BROWSER_KEYS.has(e.key)) return;
      if (e.altKey) return;

      // Pass through editable elements
      const el = document.activeElement;
      if (el instanceof HTMLElement) {
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return;
      }

      e.preventDefault();
      e.stopPropagation();
      setLastKey(e.key);

      const key = e.key;
      const isList = m === 'list';
      const isDetail = m === 'detail';

      // Ctrl+R
      if (e.ctrlKey && !e.shiftKey && key.toLowerCase() === 'r') {
        act(isList ? 'refresh' : 'reply');
        return;
      }
      // Ctrl+N/P
      if (e.ctrlKey && !e.shiftKey && (key === 'n' || key === 'N' || key === 'p' || key === 'P')) {
        act('new_thread');
        return;
      }

      switch (key) {
        case '/': window.dispatchEvent(new CustomEvent('open-search')); break;
        case 'h': break; // no-op, kept to avoid triggering browser
        case 'H': act('show_all'); break;
        case '.': act('toggle_hide'); break;
        case 'ArrowDown': case 'j': act(isDetail ? 'scroll_down' : 'next_item'); break;
        case 'ArrowUp': case 'k': act(isDetail ? 'scroll_up' : 'prev_item'); break;
        case 'ArrowRight': case 'Enter': act(isList ? 'enter_thread' : 'expand_reply'); break;
        case 'ArrowLeft': case 'Escape': act(isList ? 'go_back' : 'back_to_list'); break;
        case ' ': act('page_down'); break;
        case 'b': if (!e.ctrlKey) act('page_up'); break;
        case 'g':
          ggBuffer.push('g');
          if (ggBuffer.length > 2) ggBuffer.shift();
          if (ggBuffer.length === 2 && ggBuffer[0] === 'g' && ggBuffer[1] === 'g') {
            act('goto_top'); ggBuffer.length = 0;
          }
          break;
        case 'G': case '$': case 'End': act('goto_bottom'); break;
        case 'Home': act('goto_top'); break;
        case 'n': act(isDetail ? 'next_post' : 'next_item'); break;
        case 'p': act(isDetail ? 'prev_post' : 'prev_item'); break;
        case 's': if (isDetail) act('goto_start'); break;
        case 'e': act(isDetail ? 'goto_end' : 'edit_post'); break;
        case 'a': act('like'); break;
        case 'd': act('delete'); break;
        case 'x': act('toggle_digest'); break;
        case 'r': if (!e.ctrlKey) act('reply'); break;
        case 'PageDown': act('page_down'); break;
        case 'PageUp': act('page_up'); break;
      }
    };

    document.body.setAttribute('tabindex', '-1');
    document.body.focus({ preventScroll: true });
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, []); // mount once, refs keep values fresh

  return (
    <>
      <div
        data-testid="keyboard-bus"
        className="absolute top-0 right-0 z-40 rounded-lg
                   bg-[var(--bg-card)]/95 backdrop-blur border border-[var(--text-secondary)]/10
                   shadow-lg px-3 py-2 text-[10px] font-mono
                   text-[var(--text-secondary)] max-w-[360px]"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="px-1 py-0.5 rounded bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-[9px] font-bold">{mode}</span>
          <span className="text-[var(--text-secondary)]/50">{lastKey || '·'}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {(hints || DEFAULT_HINTS[mode] || []).map((h: string) => {
            const isSearch = h.startsWith('/');
            return (
              <span key={h} className={`inline-flex items-baseline gap-0.5 ${isSearch ? 'font-bold' : ''}`}>
                <kbd className={isSearch ? 'text-[var(--accent-yellow)]' : 'text-[var(--accent-cyan)]'}>
                  {h.split(' ')[0]}
                </kbd>
                <span className={isSearch ? 'text-[var(--accent-yellow)]/80' : 'text-[var(--text-secondary)]/50'}>
                  {h.split(' ').slice(1).join(' ')}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

const DEFAULT_HINTS: Record<string, string[]> = {
  list: ['j/↓ 下', 'k/↑ 上', '→ 进入', '← 返回', '. 隐藏', 'Shift+H 全部', '/ 搜索', '? 帮助'],
  detail: ['j/↓ 下', 'k/↑ 上', '← 返回', 'r 回复', 'e 编辑', 'a 点赞', 'd 删除', 'x 精华'],
  editor: ['Ctrl+Enter 提交'],
  search: ['Esc 关闭', 'Enter 搜索'],
};
