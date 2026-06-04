'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { NavMode } from '@neobbs/shared/constants';

interface Props {
  mode: NavMode;
  open: boolean;
  onClose: () => void;
}

const HINTS_BY_MODE: Record<NavMode, { keys: string; desc: string }[]> = {
  list: [
    { keys: 'j / ↓', desc: '下一个' },
    { keys: 'k / ↑', desc: '上一个' },
    { keys: 'Space', desc: '下一页' },
    { keys: 'b', desc: '上一页' },
    { keys: 'gg', desc: '跳顶部' },
    { keys: 'G / $', desc: '跳底部' },
    { keys: '→ / Enter', desc: '进入' },
    { keys: '← / Esc', desc: '返回' },
    { keys: '.', desc: '隐藏版面' },
    { keys: 'Shift+H', desc: '全部显示' },
    { keys: '/', desc: '搜索' },
    { keys: 'Ctrl+N', desc: '发新帖' },
  ],
  detail: [
    { keys: 'j / ↓', desc: '向下' },
    { keys: 'k / ↑', desc: '向上' },
    { keys: 's', desc: '开头' },
    { keys: 'e', desc: '末尾' },
    { keys: 'n', desc: '下一篇' },
    { keys: 'p', desc: '上一篇' },
    { keys: '← / Esc', desc: '返回列表' },
    { keys: 'r', desc: '回复' },
    { keys: 'a', desc: '点赞' },
    { keys: 'Ctrl+Shift+S', desc: 'AI 摘要' },
  ],
  editor: [
    { keys: 'Ctrl+Enter', desc: '提交' },
    { keys: 'Ctrl+Shift+K', desc: 'AI 补全' },
    { keys: 'Ctrl+Shift+P', desc: 'AI 润色' },
  ],
  search: [
    { keys: 'Esc', desc: '关闭' },
    { keys: 'Enter', desc: '搜索' },
    { keys: '↓ / ↑', desc: '选择结果' },
  ],
};

export function KeyboardHints({ mode, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 8000);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?' || e.key === 'h') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  const hints = HINTS_BY_MODE[mode];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                     bg-[var(--bg-card)] border border-[var(--text-secondary)]/20
                     rounded-xl shadow-2xl p-5 max-w-lg w-[90vw]"
        >
          <h3 className="text-sm font-semibold text-[var(--accent-yellow)] mb-3">
            快捷键 ({mode})
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {hints.map((hint) => (
              <div key={hint.keys} className="flex justify-between items-center">
                <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-[var(--bg-primary)]
                               text-[var(--accent-cyan)] border border-[var(--text-secondary)]/10">
                  {hint.keys}
                </kbd>
                <span className="text-xs text-[var(--text-secondary)]">
                  {hint.desc}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-secondary)]/60 mt-3 text-center">
            按 ? 或 Esc 关闭 · 8s 自动消失
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
