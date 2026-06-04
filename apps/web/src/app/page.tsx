'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Terminal, User, LogOut, Eye, EyeOff } from 'lucide-react';
import { KeyboardBus } from '@/components/keyboard/keyboard-bus';
import { SearchOverlay } from '@/components/search/search-overlay';
import { api } from '@/lib/api-client';

function loadHiddenBoards(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('hidden_boards');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveHiddenBoards(set: Set<string>) {
  localStorage.setItem('hidden_boards', JSON.stringify([...set]));
}

const BOARDS = [
  { name: '站务管理', slug: 'admin', desc: '站务公告、意见反馈、版主申请', count: 128 },
  { name: '技术讨论', slug: 'tech', desc: '编程技术、开源软件、硬件数码', count: 3560 },
  { name: '闲聊灌水', slug: 'chat', desc: '天南地北、无所不聊', count: 8921 },
  { name: '文学艺术', slug: 'literature', desc: '原创文学、读书笔记、影视音乐', count: 2341 },
  { name: '游戏娱乐', slug: 'games', desc: '电子游戏、桌游、动漫', count: 4567 },
  { name: '校园生活', slug: 'campus', desc: '校园话题、考试求职、留学交流', count: 1892 },
];

interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
}

export default function HomePage() {
  const router = useRouter();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [hiddenBoards, setHiddenBoards] = useState<Set<string>>(loadHiddenBoards);
  const [showAll, setShowAll] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handler = () => setShowSearch(true);
    window.addEventListener('open-search', handler);
    const restoreKey = 'restore_search:home';
    if (sessionStorage.getItem(restoreKey)) {
      sessionStorage.removeItem(restoreKey);
      setShowSearch(true);
    }
    return () => window.removeEventListener('open-search', handler);
  }, []);

  // Restore saved board focus position
  useEffect(() => {
    const saved = sessionStorage.getItem('pos:home');
    if (saved) {
      setFocusedIndex(parseInt(saved, 10) || 0);
      sessionStorage.removeItem('pos:home');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.getMe()
      .then((res: any) => setUser(res))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'next_item':
          setFocusedIndex((i) => Math.min(i + 1, BOARDS.length - 1));
          break;
        case 'prev_item':
          setFocusedIndex((i) => Math.max(0, i - 1));
          break;
        case 'goto_top':
          setFocusedIndex(0);
          break;
        case 'goto_bottom':
          setFocusedIndex(BOARDS.length - 1);
          break;
        case 'enter_thread':
          sessionStorage.setItem('pos:home', String(focusedIndex));
          router.push(`/b/${BOARDS[focusedIndex]!.slug}`);
          break;
        case 'show_all':
          setShowAll((v) => !v);
          break;
        case 'toggle_hide': {
          const slug = BOARDS[focusedIndex]?.slug;
          if (!slug) break;
          const next = new Set(hiddenBoards);
          if (next.has(slug)) next.delete(slug); else next.add(slug);
          setHiddenBoards(next);
          saveHiddenBoards(next);
          break;
        }
        case 'go_back':
          router.push('/');
          break;
      }
    },
    [router, focusedIndex],
  );

  return (
    <div className="max-w-4xl mx-auto w-full p-6 relative">
      <KeyboardBus mode="list" onAction={handleAction} hints={['j/↓ 下', 'k/↑ 上', '→ 进入', '. 隐藏', 'Shift+H 全部', '/ 搜索']} />

      {/* Header */}
      <header className="mb-8 pt-8">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-8 h-8 text-[var(--accent-cyan)]" />
          <h1 className="text-2xl font-bold text-[var(--accent-cyan)]">
            NeoBBS
          </h1>
          <div className="flex-1" />
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/settings" className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors">
                设置
              </Link>
              <span className="flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
                <User className="w-4 h-4 text-[var(--accent-green)]" />
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                退出
              </button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors">
                登录
              </Link>
              <Link href="/auth/register" className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-white hover:opacity-80 transition-opacity">
                注册
              </Link>
            </>
          )}
        </div>
        <p className="text-[var(--text-secondary)]">
          Firebird Phoenix — 键盘驱动的现代 BBS 体验
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>键盘导航：</span>
          <kbd className="px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--accent-yellow)] font-mono text-xs">j/k</kbd>
          <kbd className="px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--accent-yellow)] font-mono text-xs">→</kbd>
          <kbd className="px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--accent-yellow)] font-mono text-xs">?</kbd>
        </div>
      </header>

      {/* Board List */}
      <nav>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          讨论区
          {hiddenBoards.size > 0 && !showAll && (
            <span className="ml-2 text-[10px] text-[var(--text-secondary)] font-normal">
              ({hiddenBoards.size} 个已隐藏)
            </span>
          )}
          {showAll && (
            <span className="ml-2 text-[10px] text-[var(--accent-yellow)] font-normal">
              显示全部 · Shift+H 切换
            </span>
          )}
        </h2>
        <div className="space-y-1">
          {BOARDS.map((board, i) => {
            const isHidden = hiddenBoards.has(board.slug);
            if (isHidden && !showAll) return null;

            return (
            <div
              key={board.slug}
              role="link"
              tabIndex={0}
              onClick={() => {
                setFocusedIndex(i);
                sessionStorage.setItem('pos:home', String(i));
                router.push(`/b/${board.slug}`);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
                         ${isHidden ? 'opacity-50' : ''}
                         transition-colors duration-75 group
                         ${i === focusedIndex
                           ? 'bg-[var(--bg-hover)] border-l-2 border-l-[var(--accent-yellow)]'
                           : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-l-2 border-l-transparent'
                         }`}
            >
              <span className="text-[var(--text-secondary)] font-mono text-sm w-6 text-right">
                {i + 1}
              </span>
              <MessageSquare className="w-5 h-5 text-[var(--accent-cyan)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className={`font-medium transition-colors ${
                  i === focusedIndex
                    ? 'text-[var(--accent-yellow)]'
                    : 'text-[var(--text-primary)] group-hover:text-[var(--accent-yellow)]'
                }`}>
                  {board.name}
                </span>
                <span className="ml-3 text-sm text-[var(--text-secondary)] hidden sm:inline">
                  {board.desc}
                </span>
              </div>
              <span className="text-xs text-[var(--text-secondary)] font-mono">
                {board.count.toLocaleString()}
              </span>
              {showAll && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-primary)]">
                  {isHidden ? <EyeOff className="w-3 h-3 text-[var(--text-secondary)]" /> : <Eye className="w-3 h-3 text-[var(--accent-green)]" />}
                </span>
              )}
            </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-[var(--text-secondary)]">
        NeoBBS · Firebird Phoenix v0.1.0 · {' '}
        <kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] font-mono">.</kbd> 隐藏版面{' '}
        <kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] font-mono">Shift+H</kbd> 全部显示{' '}
        <kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] font-mono">?</kbd> 快捷键
      </footer>

      <SearchOverlay open={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}
