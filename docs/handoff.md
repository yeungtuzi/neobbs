# NeoBBS — Firebird Phoenix 项目 Handoff

> 最后更新: 2026-06-04

## 项目概述

从零构建的高性能 Web BBS，键盘驱动、深色主题、本地部署。面向 200 人以内的社区使用。

## 技术栈

| 层 | 选型 |
|---|------|
| 前端 | Next.js 16 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS 4 + 自定义 Firebird BBS ANSI 深色主题 |
| 编辑器 | TipTap (Markdown 快捷输入) |
| 虚拟滚动 | react-virtuoso |
| 后端 | NestJS 11 (REST + WebSocket) |
| ORM | Prisma 6 |
| 数据库 | PostgreSQL 16 + Redis 7 |
| 语音识别 | Whisper.cpp (ggml-small.bin, 本地中文) |
| 动画 | Motion (framer-motion) |
| 包管理 | pnpm workspace + Turborepo |
| 容器化 | Docker Compose (OrbStack) |

## 已完成功能

### 认证
- JWT 邮箱密码注册/登录
- JwtAuthGuard 全局守卫 + @Public() 装饰器
- 未登录拦截提示（AuthToast）

### 键盘导航（Firebird BBS 经典体系）
- `j/k` 或 `↓/↑` 上下导航
- `→/Enter` 进入，`←/Esc` 返回
- `gg/G/$/Home/End` 跳转首尾
- `Space/b` 翻页
- `n/p` 下一篇/上一篇
- `/` 搜索，`?/h` 帮助
- `Ctrl+N` 发帖，`r` 回复，`a` 点赞，`e` 编辑，`d` 删除
- KeyboardBus 自包含，监听器挂载一次，ref 保持状态

### 板块 & 帖子
- 首页板块列表（键盘高亮选中）
- 板块帖子列表（react-virtuoso 虚拟滚动，游标分页）
- 帖子详情（树形嵌套回复，真实深度，分支着色）
- 发帖/回复编辑器（TipTap 富文本，Markdown 快捷输入）
- 乐观点赞（AnimatePresence 动画）

### 附件
- 拖拽/选择文件上传
- sharp 生成缩略图
- 图片就地展开（含 lightbox）、视频/音频/pdf 嵌入、其他下载链接
- 安全白名单：image/*, video/mp4, audio/*, application/pdf

### 语音输入（本地）
- Whisper.cpp ggml-small.bin 模型
- MediaRecorder → ffmpeg 转 WAV → whisper-cli 识别
- 智能路由：标题框获焦时文字进标题，否则进正文
- Apple Silicon Metal 加速

### WebSocket 实时
- 板块房间广播：新帖通知（绿条提示）
- 回复通知：推送到帖子作者
- 在线人数追踪

### 帖子管理
- 帖子永久编号（postNumber，全板块唯一递增）
- 单帖精华标记（版主/管理员），精华链保护祖先帖
- 批量清理（输入编号范围，跳过精华帖及其祖先）
- 回收站视图（版主/管理员查看已删帖子）
- 帖子编辑（e 键，回填原文，PATCH API）
- 帖子删除（d 键确认，软删除）

### 版面管理
- 版面隐藏/反隐藏（. 键，Shift+H 切换全部显示）
- 精华区过滤（x 键，仅显示精华帖）

### 搜索
- 弹出式搜索浮层（不离开当前页面）
- 全站搜索（首页 /）或当前版面搜索（板块页 /）
- 搜索帖子正文 + 标题（OR 条件）
- 搜索结果键盘导航（j/k + Enter）
- ESC 关闭搜索浮层

### 用户体验
- 进入帖子后返回保持滚动位置（sessionStorage）
- 编辑器打开自动清空上次内容
- 鼠标选文字不触发编辑器关闭
- 右下角热键提示面板（页面自适应）

## 未实现（明确排除）

| 功能 | 原因 |
|------|------|
| Firebird 数据迁移 | 暂无样本数据 |
| 微信/OpenID 登录 | 简化认证流程 |
| 可视化快捷键设置 | 固定快捷键足够 |
| AI 摘要/补全/润色 | 用户不需要 |
| Service Worker 离线 | 不需要 |

## API 端点

```
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/boards
GET    /api/boards/:slug
GET    /api/boards/:slug/threads?cursor=&limit=20
POST   /api/boards/:slug/threads
GET    /api/threads/:id
POST   /api/threads/:id/replies
POST   /api/posts/:id/like
PATCH  /api/posts/:id
PATCH  /api/posts/:id/digest
DELETE /api/posts/:id
POST   /api/boards/:slug/cleanup
GET    /api/boards/:slug/deleted
POST   /api/attachments/upload
GET    /api/search?q=&board=&limit=
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read
POST   /api/ai/speech
WS     /ws  (Socket.IO namespace)
```

## WebSocket 事件

| 客户端 emit | 服务端 broadcast | 说明 |
|-------------|-----------------|------|
| `join-board` (boardId) | — | 加入板块房间 |
| `leave-board` (boardId) | — | 离开板块房间 |
| — | `new-thread` | 新帖通知 |
| — | `notification` | 回复通知 |
| — | `online-count` | 在线人数 |

## 开发命令

```bash
# 启动数据库
docker compose -f docker-compose.dev.yml up -d

# 安装依赖
pnpm install

# 数据库迁移
cd apps/server && npx prisma migrate dev

# 种子数据
pnpm run db:seed

# 启动开发（前端 :3000 + 后端 :4000）
pnpm dev

# 生产部署
docker compose up -d
```

## 环境变量

**apps/server/.env:**
```
DATABASE_URL=postgresql://neobbs:neobbs_dev@localhost:5432/neobbs
JWT_SECRET=dev-secret-change-in-production
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=../uploads
```

**apps/web/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## 项目结构

```
neobbs/
├── apps/
│   ├── web/                         # Next.js 16 前端
│   │   └── src/
│   │       ├── app/                 # 路由页面
│   │       │   ├── page.tsx         # 首页（板块列表）
│   │       │   ├── b/[slug]/page.tsx          # 板块帖子列表
│   │       │   ├── b/[slug]/[threadId]/page.tsx # 帖子详情+树形回复
│   │       │   ├── search/page.tsx  # 搜索
│   │       │   └── auth/           # 登录/注册
│   │       ├── components/
│   │       │   ├── post/           # PostCard, PostEditor, VirtualizedPostList, AttachmentRenderer
│   │       │   ├── keyboard/       # KeyboardBus, KeyboardHints
│   │       │   ├── editor/         # TiptapEditor, VoiceInput
│   │       │   ├── auth/           # AuthToast
│   │       │   └── ui/             # Button, Input, Tooltip
│   │       ├── hooks/              # useKeyboardNavigation, useWebSocket, useAuth
│   │       └── lib/                # api-client, keyboard-bindings, utils
│   │
│   └── server/                      # NestJS 11 后端
│       └── src/
│           ├── auth/               # JWT 认证
│           ├── users/              # 用户
│           ├── boards/             # 板块
│           ├── threads/            # 帖子
│           ├── posts/              # 回复+点赞
│           ├── attachments/        # 文件上传
│           ├── search/             # 全文搜索
│           ├── notifications/      # 通知 + WebSocket
│           ├── ai/                 # Whisper 语音
│           └── common/             # PrismaService, RedisService
│
├── packages/shared/                 # @neobbs/shared 类型+常量
├── prisma/                         # schema + seed + migrations
├── models/                         # Whisper 模型文件
├── docker-compose.yml              # 生产容器
├── docker-compose.dev.yml          # 开发容器（仅 PG+Redis）
└── docs/                           # 需求文档、设计文档、本 handoff
```

## 已知限制

1. 语音输入需要 Whisper 模型文件 (~465MB)，首次需手动下载
2. 语音识别耗时约 2-5 秒（本地模型，Apple Silicon 加速）
3. WebSocket 连接失败不阻塞页面（降级可用）
4. 键盘导航不支持输入法组合键
5. 全文搜索使用 ILIKE（非 tsvector），中文支持有限
