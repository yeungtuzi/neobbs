'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { NavMode } from '@neobbs/shared/constants';

type KeyboardAction =
  | 'next_item' | 'prev_item' | 'page_down' | 'page_up'
  | 'goto_top' | 'goto_bottom' | 'enter_thread' | 'go_back'
  | 'focus_search' | 'show_help'
  | 'goto_start' | 'goto_end' | 'scroll_down' | 'scroll_up'
  | 'next_post' | 'prev_post' | 'expand_reply' | 'back_to_list'
  | 'new_thread' | 'edit_post' | 'reply' | 'like' | 'delete'
  | 'toggle_digest' | 'submit' | 'refresh'
  | 'ai_complete' | 'ai_summary' | 'ai_polish';

type ActionHandler = (action: KeyboardAction) => void;

const MAX_KEY_HISTORY = 10;

function isNextJsDevOverlay(): boolean {
  // Next.js error overlay / dev tools — let all keys pass through
  return !!(
    document.querySelector('nextjs-portal') ||
    document.querySelector('[data-nextjs-dialog]') ||
    document.querySelector('[data-nextjs-toast]') ||
    document.getElementById('__next-dev-tools') ||
    document.querySelector('dialog[open]')
  );
}

function isEditableTarget(el: HTMLElement): boolean {
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable ||
    (tag === 'DIV' && el.getAttribute('role') === 'textbox')
  );
}

/**
 * Check if ANY element in the activeElement chain is editable.
 * This handles TipTap and other rich text editors where the event
 * target might be an inline child (strong, em, etc.) rather than
 * the contenteditable container.
 */
function isCurrentlyEditing(): boolean {
  let el: Element | null = document.activeElement;
  while (el) {
    if (el instanceof HTMLElement && isEditableTarget(el)) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function detectSequence(history: string[], target: string[]): boolean {
  if (history.length < target.length) return false;
  for (let i = 0; i < target.length; i++) {
    if (history[history.length - target.length + i] !== target[i]) return false;
  }
  return true;
}

export function useKeyboardNavigation(
  mode: NavMode,
  onAction: ActionHandler,
) {
  // Use refs so the event listener never re-attaches
  const modeRef = useRef<NavMode>(mode);
  const onActionRef = useRef<ActionHandler>(onAction);
  const keyHistory = useRef<string[]>([]);

  // Keep refs in sync without re-running the effect
  modeRef.current = mode;
  onActionRef.current = onAction;

  const recordKey = useCallback((key: string) => {
    keyHistory.current.push(key);
    if (keyHistory.current.length > MAX_KEY_HISTORY) {
      keyHistory.current.shift();
    }
  }, []);

  useEffect(() => {
    // Focus body so keyboard events flow to our handler
    document.body.setAttribute('tabindex', '-1');
    document.body.focus({ preventScroll: true });

    const handleBlur = () => {
      setTimeout(() => {
        if (!isEditableTarget(document.activeElement as HTMLElement)) {
          document.body.focus({ preventScroll: true });
        }
      }, 0);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isEditableTarget(target) || target.closest('a, button')) return;
      setTimeout(() => {
        if (!isEditableTarget(document.activeElement as HTMLElement)) {
          document.body.focus({ preventScroll: true });
        }
      }, 10);
    };

    document.addEventListener('blur', handleBlur, true);
    document.addEventListener('mousedown', handleMouseDown);

    // ── SINGLE persistent handler, reads latest callbacks from refs ──
    const handleKeyDown = (e: KeyboardEvent) => {
      // Let Next.js error overlay & browser dialogs handle their own keys
      if (isNextJsDevOverlay()) return;

      // DEBUG
      console.log('[KB:hook] key:', e.key, 'editing:', isCurrentlyEditing(), 'active:', document.activeElement?.tagName);

      const mode = modeRef.current;
      const act = onActionRef.current;

      // Editable targets: pass through (use activeElement chain for robustness)
      if (isCurrentlyEditing()) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && mode === 'editor') {
          e.preventDefault();
          act('submit');
        }
        if (e.ctrlKey && e.shiftKey) {
          const k = e.key.toLowerCase();
          if (k === 'k') { e.preventDefault(); act('ai_complete'); }
          if (k === 'p') { e.preventDefault(); act('ai_polish'); }
        }
        return;
      }

      // Browser-reserved Ctrl/Cmd combos: pass through
      if (e.ctrlKey || e.metaKey) {
        const pt = new Set(['t','T','w','W','l','L','d','D','h','H','j','J','q','Q','a','A','c','C','b','B','f','F','g','G']);
        if (e.metaKey && pt.has(e.key)) return;
        if (e.ctrlKey && !e.metaKey && pt.has(e.key)) return;
      }
      if (e.altKey) return;

      // All remaining keys = BBS territory
      e.preventDefault();
      e.stopPropagation();

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        recordKey(e.key);
      }

      const key = e.key;
      const lk = key.toLowerCase();

      // Ctrl combos
      if (e.ctrlKey && !e.shiftKey) {
        if (lk === 'n' || lk === 'p') { act('new_thread'); return; }
        if (lk === 'r') { act(mode === 'list' ? 'refresh' : 'reply'); return; }
        if (lk === 'e') { act('edit_post'); return; }
        if (key === 'Enter') { act('submit'); return; }
      }

      // Ctrl+Shift (AI)
      if (e.ctrlKey && e.shiftKey) {
        if (lk === 'k') act('ai_complete');
        if (lk === 's') act('ai_summary');
        if (lk === 'p') act('ai_polish');
        return;
      }

      // Single-key navigation
      switch (key) {
        case '/': act('focus_search'); return;
        case '?': case 'h': act('show_help'); return;
        case 'ArrowDown': case 'j': act(mode === 'detail' ? 'scroll_down' : 'next_item'); return;
        case 'ArrowUp': case 'k': act(mode === 'detail' ? 'scroll_up' : 'prev_item'); return;
        case 'ArrowRight': case 'Enter': act(mode === 'list' ? 'enter_thread' : 'expand_reply'); return;
        case 'ArrowLeft': case 'Escape': act(mode === 'list' ? 'go_back' : 'back_to_list'); return;
        case ' ': act('page_down'); return;
        case 'b': if (!e.ctrlKey && !e.metaKey) act('page_up'); return;
        case 'g':
          if (detectSequence(keyHistory.current, ['g', 'g'])) act('goto_top');
          return;
        case 'G': case '$': case 'End': act('goto_bottom'); return;
        case 'Home': act('goto_top'); return;
        case 'n': act(mode === 'detail' ? 'next_post' : 'next_item'); return;
        case 'p': act(mode === 'detail' ? 'prev_post' : 'prev_item'); return;
        case 's': if (mode === 'detail') act('goto_start'); return;
        case 'e': act(mode === 'detail' ? 'goto_end' : 'edit_post'); return;
        case 'a': act('like'); return;
        case 'd': act('delete'); return;
        case 'x': act('toggle_digest'); return;
        case 'r': if (!e.ctrlKey) act('reply'); return;
        case 'PageDown': act('page_down'); return;
        case 'PageUp': act('page_up'); return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isCurrentlyEditing()) return;
      if (e.key === '/' || e.key === '\'') e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []); // <── empty deps: runs ONCE, never re-attaches
}
