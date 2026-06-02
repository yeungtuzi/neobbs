// Firebird BBS 经典 ANSI 配色 → Web 深色主题
export const COLORS = {
  bg: {
    primary: '#0d1117',
    card: '#161b22',
    hover: '#1c2333',
  },
  text: {
    primary: '#c9d1d9',
    secondary: '#8b949e',
  },
  accent: {
    cyan: '#58a6ff',
    yellow: '#d2991d',
    green: '#3fb950',
    red: '#f85149',
    purple: '#bc8cff',
  },
} as const;

// Keyboard navigation mode
export type NavMode = 'list' | 'detail' | 'editor' | 'search';

// Key binding definition
export interface KeyBinding {
  keys: string[];
  description: string;
  mode: NavMode | NavMode[];
  action: string;
}

// Firebird BBS 经典快捷键定义
export const KEY_BINDINGS: KeyBinding[] = [
  // 导航 (list mode)
  { keys: ['j', 'ArrowDown'], description: '下一个帖子', mode: 'list', action: 'next_item' },
  { keys: ['k', 'ArrowUp'], description: '上一个帖子', mode: 'list', action: 'prev_item' },
  { keys: [' '], description: '下一页', mode: 'list', action: 'page_down' },
  { keys: ['b'], description: '上一页', mode: 'list', action: 'page_up' },
  { keys: ['g g'], description: '跳到顶部', mode: 'list', action: 'goto_top' },
  { keys: ['Shift+4', 'G', 'End'], description: '跳到底部', mode: 'list', action: 'goto_bottom' },
  { keys: ['ArrowRight', 'Enter'], description: '进入帖子', mode: 'list', action: 'enter_thread' },
  { keys: ['ArrowLeft', 'Escape'], description: '返回上级', mode: 'list', action: 'go_back' },
  { keys: ['/'], description: '搜索标题', mode: 'list', action: 'focus_search' },
  { keys: ['h', '?'], description: '快捷键帮助', mode: 'list', action: 'show_help' },

  // 导航 (detail/阅读模式)
  { keys: ['s'], description: '跳到开头', mode: 'detail', action: 'goto_start' },
  { keys: ['e'], description: '跳到末尾', mode: 'detail', action: 'goto_end' },
  { keys: ['j', 'ArrowDown'], description: '向下滚动', mode: 'detail', action: 'scroll_down' },
  { keys: ['k', 'ArrowUp'], description: '向上滚动', mode: 'detail', action: 'scroll_up' },
  { keys: ['n'], description: '下一篇', mode: 'detail', action: 'next_post' },
  { keys: ['p'], description: '上一篇', mode: 'detail', action: 'prev_post' },
  { keys: ['ArrowRight', 'Enter'], description: '展开回复', mode: 'detail', action: 'expand_reply' },
  { keys: ['ArrowLeft', 'Escape'], description: '返回列表', mode: 'detail', action: 'back_to_list' },
  { keys: ['h', '?'], description: '快捷键帮助', mode: 'detail', action: 'show_help' },

  // 操作（全局）
  { keys: ['Ctrl+n', 'Ctrl+p'], description: '发新帖', mode: ['list', 'detail'], action: 'new_thread' },
  { keys: ['e'], description: '编辑帖子', mode: ['list', 'detail'], action: 'edit_post' },
  { keys: ['r', 'Ctrl+r'], description: '回复帖子', mode: ['list', 'detail'], action: 'reply' },
  { keys: ['a'], description: '点赞', mode: ['list', 'detail'], action: 'like' },
  { keys: ['d'], description: '删除', mode: ['list', 'detail'], action: 'delete' },
  { keys: ['x'], description: '精华区', mode: ['list', 'detail'], action: 'toggle_digest' },
  { keys: ['Ctrl+Enter'], description: '提交编辑', mode: 'editor', action: 'submit' },
  { keys: ['Ctrl+r'], description: '刷新列表', mode: ['list'], action: 'refresh' },

  // AI (Web 专属)
  { keys: ['Ctrl+Shift+k'], description: 'AI 句子补全', mode: 'editor', action: 'ai_complete' },
  { keys: ['Ctrl+Shift+s'], description: 'AI 摘要', mode: 'detail', action: 'ai_summary' },
  { keys: ['Ctrl+Shift+p'], description: 'AI 润色', mode: 'editor', action: 'ai_polish' },
];
