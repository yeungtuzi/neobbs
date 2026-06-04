# Firebird Phoenix — 实施计划

## Firebird BBS 经典配色（Web 深色主题）

沿用 Firebird BBS 终端 ANSI 16 色体系的深色美学，映射为现代 Web 颜色：

```css
:root {
  --bg-primary:    #0d1117;  /* 主背景 (ANSI 40 黑底) */
  --bg-card:       #161b22;  /* 卡片/列表项背景 */
  --bg-hover:      #1c2333;  /* 悬停/选中行 (ANSI 7 反显) */
  --text-primary:  #c9d1d9;  /* 正文 (ANSI 37 高亮白) */
  --text-secondary:#8b949e;  /* 次要信息 */
  --accent-cyan:   #58a6ff;  /* 板块名/链接 (ANSI 36 高亮青) */
  --accent-yellow: #d2991d;  /* 高亮/选中项 (ANSI 33 高亮黄) */
  --accent-green:  #3fb950;  /* 在线/成功 (ANSI 32 高亮绿) */
  --accent-red:    #f85149;  /* 错误/警告 (ANSI 31 高亮红) */
  --accent-purple: #bc8cff;  /* 精华/特殊 (ANSI 35 高亮洋红) */
}
```

## 固定快捷键（沿用 Firebird BBS 经典体系）

```
导航 (列表模式):
  j / ↓            下一个帖子/下一行
  k / ↑            上一个帖子/上一行
  Space / PgDn     下一页
  b / PgUp         上一页
  gg / Home        跳到列表顶部
  G / $ / End      跳到列表底部
  → / Enter        进入帖子
  ← / Escape       返回上级列表
  n                下一篇帖子（同主题）
  p                上一篇帖子（同主题）
  /                搜索标题
  h / ?            当前界面快捷键帮助

阅读模式:
  s                跳到文章开头
  e                跳到文章末尾
  j / ↓            向下滚动
  k / ↑            向上滚动
  → / Enter        进入下一层（展开回复）
  ← / Escape       返回文章列表
  n                下一篇
  p                上一篇

操作:
  Ctrl+P / Ctrl+N  发新帖
  e                编辑自己的帖子
  r / Ctrl+R       回复
  a                点赞
  d                删除（作者/版主）
  x                查看精华区（版主可加/取消）
  Ctrl+Enter       提交编辑
  Ctrl+R           刷新列表（保持滚动位置）

AI (新增 Web 专属):
  Ctrl+Shift+K     句子补全
  Ctrl+Shift+S     帖子摘要 (TL;DR)
  Ctrl+Shift+P     润色草稿
```

## 数据模型

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| username | text unique | |
| email | text unique | |
| password_hash | text | bcrypt 哈希 |
| avatar | text nullable | 头像 URL |
| signature | text nullable | 签名档 |
| role | enum(user, moderator, admin) | 角色 |
| status | enum(active, banned) | 状态 |
| created_at | timestamp | |
| updated_at | timestamp | |
| last_active_at | timestamp | |

### boards
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| name | text | 板块名 |
| slug | text unique | URL 标识 |
| description | text nullable | 描述 |
| parent_id | uuid FK self-ref nullable | 父板块（子板块） |
| sort_order | int | 排序 |
| thread_count | int default 0 | 主题数 |
| post_count | int default 0 | 总帖数 |
| is_hidden | boolean default false | 隐藏板块 |

### threads
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| board_id | uuid FK | 所属板块 |
| author_id | uuid FK | 发帖人 |
| title | text | 标题 |
| created_at | timestamp | |
| updated_at | timestamp | |
| last_reply_at | timestamp | 最后回复时间 |
| last_reply_user_id | uuid FK nullable | 最后回复人 |
| view_count | int default 0 | 浏览数 |
| reply_count | int default 0 | 回复数 |
| is_pinned | boolean default false | 置顶 |
| is_locked | boolean default false | 锁定 |
| tags | text[] | 标签数组 |

### posts
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| thread_id | uuid FK | 所属主题 |
| board_id | uuid FK | 冗余，加速查询 |
| author_id | uuid FK | 作者 |
| content | jsonb | TipTap 结构化内容 |
| plain_text | text | 搜索用纯文本 |
| created_at | timestamp | |
| updated_at | timestamp | |
| edit_count | int default 0 | 编辑次数 |
| is_deleted | boolean default false | 软删除 |
| is_first_post | boolean | 是否首帖 |

索引:
- `(thread_id, created_at ASC)` — 楼层排序
- `GIN to_tsvector('chinese', plain_text)` — 全文搜索

### attachments
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| post_id | uuid FK | |
| user_id | uuid FK | 上传者 |
| filename | text | 存储文件名 |
| original_name | text | 原始文件名 |
| mime_type | text | MIME 类型 |
| size_bytes | bigint | 文件大小 |
| storage_path | text | 本地路径 |
| is_image | boolean | |
| image_width | int nullable | |
| image_height | int nullable | |
| thumbnail_path | text nullable | 缩略图路径 |
| created_at | timestamp | |

安全内容白名单（就地展开）: `image/*`, `video/mp4`, `audio/*`, `application/pdf`
其余类型 → 下载链接

### post_likes
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | uuid FK | |
| post_id | uuid FK | |
| created_at | timestamp | |
| PK | (user_id, post_id) | 联合主键 |

### notifications
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK | 接收者 |
| type | enum(reply, mention, like) | 通知类型 |
| actor_id | uuid FK | 触发者 |
| thread_id | uuid FK | 相关主题 |
| post_id | uuid FK nullable | 相关帖子 |
| is_read | boolean default false | |
| created_at | timestamp | |

### user_board_subscriptions
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | uuid FK | |
| board_id | uuid FK | |
| PK | (user_id, board_id) | WebSocket 房间跟踪 |

## 目录结构

```
neobbs/
├── apps/
│   ├── web/                        # Next.js 16 前端
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx              # 根布局 + KeyboardBus
│   │   │   │   ├── page.tsx                # 首页 → 板块列表
│   │   │   │   ├── b/[slug]/
│   │   │   │   │   ├── page.tsx            # 帖子列表（虚拟滚动）
│   │   │   │   │   └── [threadId]/page.tsx # 帖子详情（楼层）
│   │   │   │   ├── search/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── auth/
│   │   │   │       ├── login/page.tsx
│   │   │   │       └── register/page.tsx
│   │   │   ├── components/
│   │   │   │   ├── post/
│   │   │   │   │   ├── virtualized-post-list.tsx
│   │   │   │   │   ├── post-card.tsx
│   │   │   │   │   ├── post-editor.tsx
│   │   │   │   │   └── attachment-renderer.tsx
│   │   │   │   ├── board/
│   │   │   │   │   ├── board-nav.tsx
│   │   │   │   │   └── thread-list-item.tsx
│   │   │   │   ├── keyboard/
│   │   │   │   │   ├── keyboard-bus.tsx
│   │   │   │   │   └── keyboard-hints.tsx
│   │   │   │   ├── editor/
│   │   │   │   │   ├── tiptap-editor.tsx
│   │   │   │   │   ├── ai-toolbar.tsx
│   │   │   │   │   └── voice-input.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login-form.tsx
│   │   │   │   │   └── auth-guard.tsx
│   │   │   │   └── ui/                     # shadcn/ui
│   │   │   ├── hooks/
│   │   │   │   ├── use-keyboard-navigation.ts
│   │   │   │   ├── use-websocket.ts
│   │   │   │   ├── use-optimistic-post.ts
│   │   │   │   └── use-preload.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts
│   │   │   │   ├── keyboard-bindings.ts
│   │   │   │   └── attachment-utils.ts
│   │   │   └── styles/globals.css
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── server/                     # NestJS 后端
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── auth/
│           ├── users/
│           ├── boards/
│           ├── threads/
│           ├── posts/
│           ├── attachments/
│           ├── search/
│           ├── notifications/
│           │   └── notifications.gateway.ts  # WebSocket
│           ├── ai/
│           └── common/
│               ├── prisma.service.ts
│               └── redis.service.ts
│
├── packages/
│   └── shared/src/
│       ├── types/
│       └── constants/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── docker-compose.yml              # 全栈
├── docker-compose.dev.yml          # 仅 PG + Redis (开发)
├── nginx.conf
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 分阶段实施

### Phase 0 — 基础设施 (~Day 1)

| # | 任务 | 产出 |
|---|------|------|
| 0.1 | pnpm workspace + turbo.json + root tsconfig | 项目骨架 |
| 0.2 | docker-compose.dev.yml (PG 16 + Redis 7) | 本地开发环境 |
| 0.3 | Prisma schema + migrate + seed | 数据库表结构 |
| 0.4 | `nest new apps/server` + Prisma/Redis 连接 | `/api/health` |
| 0.5 | `create-next-app apps/web` (Next 16 + TS + Tailwind) | 前端骨架 |
| 0.6 | shadcn/ui init + Motion + react-virtuoso + TipTap + Mousetrap | 前端依赖 |
| 0.7 | packages/shared 共享类型和常量 | DTO 类型包 |

### Phase 1 — P0: 认证 + 核心浏览

| # | 任务 |
|---|------|
| 1.1 | 认证: register + login → JWT httpOnly cookie, JwtAuthGuard, AuthGuard 组件 |
| 1.2 | 板块 API: GET /boards, GET /boards/:slug |
| 1.3 | 帖子 API: 列表(游标分页), 发帖, 详情, 回帖, 点赞 |
| 1.4 | useKeyboardNavigation: 全局 keydown, 模式互斥(list/detail/editor), gg 检测 |
| 1.5 | virtualized-post-list: react-virtuoso, 瞬时 scrollToIndex, j/k 驱动 focusedIndex |
| 1.6 | 乐观更新: useOptimistic 发帖/点赞 |
| 1.7 | 路由: 首页 → 板块列表 → 帖子详情 |

### Phase 2 — P1: 编辑器 + 附件 + 搜索

| # | 任务 |
|---|------|
| 2.1 | TipTap: 工具栏 + Markdown 快捷输入 + Ctrl+Enter |
| 2.2 | 附件上传: multer → ./uploads/ → sharp 缩略图 |
| 2.3 | attachment-renderer: image/video/audio/pdf 就地展开 |
| 2.4 | 语音输入: Web Speech API |
| 2.5 | 全文搜索: PG tsvector, / 快捷键聚焦, debounce |

### Phase 3 — P2: AI + WebSocket 实时

| # | 任务 |
|---|------|
| 3.1 | WebSocket 网关: 房间=板块, join/leave, 新帖广播 |
| 3.2 | 通知: @回复 → WS 推送 → 标题未读计数 |
| 3.3 | AI API: summary/polish/complete → Vercel AI SDK streamText |
| 3.4 | AI UI: 补全浮层, 摘要侧边栏, 润色 Diff 视图 |

### Phase 4 — P3: 动画 + 打磨

| # | 任务 |
|---|------|
| 4.1 | 点赞动画: +1 粒子, Web Audio API 可选音效 |
| 4.2 | 新帖提示: 列表顶部淡入横幅, 10s 消失 |
| 4.3 | Lottie Emoji: :rocket: :fire: :+1: → 动画 JSON |
| 4.4 | 键盘 HUD: ? → 半透明快捷键浮层 |

## API 端点总览

```
认证:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/logout
  GET  /api/auth/me

板块:
  GET  /api/boards
  GET  /api/boards/:slug

帖子:
  GET  /api/boards/:slug/threads?cursor=&limit=20
  POST /api/boards/:slug/threads
  GET  /api/threads/:id
  POST /api/threads/:id/replies
  POST /api/posts/:id/like

附件:
  POST /api/attachments/upload
  GET  /api/attachments/:id

搜索:
  GET  /api/search?q=&board=&page=

通知:
  GET  /api/notifications
  PATCH /api/notifications/:id/read
  PATCH /api/notifications/read-all

AI:
  POST /api/ai/summary
  POST /api/ai/polish
  POST /api/ai/complete

用户:
  GET  /api/users/:id
  PATCH /api/users/me
```

## 开发命令

```bash
# 首次启动
orb compose -f docker-compose.dev.yml up -d
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev

# 生产部署 (OrbStack)
orb compose up -d

# 访问
open http://localhost:3000          # 前端
curl http://localhost:4000/api/health  # 后端
```

## Verification 检查点

- **Phase 0**: PG + Redis 可连接，NestJS health 200，Next.js 渲染首页
- **Phase 1**: 注册/登录可用，虚拟滚动列表渲染，j/k 导航生效，发帖乐观插入
- **Phase 2**: TipTap 编辑器可用，图片上传后就地展开，/ 搜索返回结果
- **Phase 3**: 两个窗口同一板块 → 新帖实时提示，@回复 WS 通知，Ctrl+Shift+S 流式摘要
- **Phase 4**: 点赞 +1 动画，:rocket: → Lottie，? → 快捷键 HUD

---

## 实际实施状态（2026-06-03）

### Phase 0 ✅ 完成
- pnpm monorepo + Turborepo
- Docker Compose (PG 16 + Redis 7)
- Prisma schema + migration + seed
- NestJS + Next.js 脚手架
- shadcn/ui (Button, Input, Tooltip 自实现)
- packages/shared

### Phase 1 ✅ 完成
- JWT 认证 (register/login/me)
- 板块 API (GET /boards, GET /boards/:slug)
- 帖子 API (列表/发帖/详情/回帖/点赞)
- useKeyboardNavigation Hook → KeyboardBus 自包含
- react-virtuoso 虚拟滚动
- 乐观更新（点赞）
- 首页板块列表 + 板块帖子列表 + 帖子详情
- 登录状态检测 + AuthToast 拦截提示
- 返回保持滚动位置

### Phase 2 ✅ 完成
- TipTap 编辑器 + Markdown 快捷输入 + 工具栏
- 附件上传 (multer → sharp 缩略图 → 本地文件系统)
- AttachmentRenderer (图片 lightbox / video / audio / pdf / 下载)
- 本地语音输入 (Whisper.cpp + ffmpeg 转码)
- 全文搜索 (ILIKE)
- 树形嵌套回复（真实深度 + 分支着色）

### Phase 3 ✅ 完成（部分）
- WebSocket 网关 (Socket.IO, 板块房间, 新帖广播)
- 回复通知推送
- 在线人数追踪
- ~~AI (排除)~~

### Phase 4 ✅ 完成（部分）
- 点赞粒子动画 (Motion AnimatePresence)
- 键盘 HUD (按 ? 显示)
- 新帖提示绿条
- 帖子永久编号 + 单帖精华 + 批量清理 + 回收站
- 版面隐藏/反隐藏 + 精华区过滤
- 搜索重构（弹出浮层，标题+正文，键盘导航）
- 热键提示面板（页面自适应）
- 帖子编辑/删除 UI
- ~~Lottie Emoji (排除)~~
