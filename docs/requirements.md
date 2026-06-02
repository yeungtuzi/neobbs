# Firebird Phoenix — 需求确认过程

## 项目背景

从零重写一个高性能 Web BBS 系统，代号 Firebird Phoenix。核心理念是"数据继承、代码革命"——传统 BBS 的功能内核保留，但用 2025 年技术栈彻底重写前端和后端。

## Firebird BBS 研究

### 经典快捷键体系（源自水木清华 newsmth）

Firebird BBS 的 Telnet 界面建立了一套极为成熟的键盘操作体系。水木清华 (newsmth.net) 是其最著名的部署实例。核心设计哲学：**双手不离主键盘区，所有操作用单键或 Ctrl 组合键完成**。

**讨论区列表导航：**
| 按键 | 功能 |
|------|------|
| `k / ↑` | 上一个讨论区 |
| `j / ↓` | 下一个讨论区 |
| `PgUp / b / Ctrl+B` | 上一页 |
| `PgDn / Space / Ctrl+F` | 下一页 |
| `$ / End` | 跳到最后一个 |
| `Home` | 跳到第一个 |
| `## + Enter` | 跳至第 N 个讨论区 |

**文章列表导航：**
| 按键 | 功能 |
|------|------|
| `→ / Enter` | 阅读光标文章 |
| `← / e` | 返回上级 |
| `$ / End` | 到最后一篇 |
| `Home` | 到第一篇 |
| `/` | 查找标题 |
| `a / A` | 查找作者 |
| `h` | 当前界面快捷键帮助 |

**阅读文章：**
| 按键 | 功能 |
|------|------|
| `s` | 到文章首 |
| `e` | 到文章末 |
| `p` | 同主题阅读 |
| `r / R` | 回复文章 |

**操作：**
| 按键 | 功能 |
|------|------|
| `Ctrl+P` | 发表文章 |
| `e` | 修改自己文章 |
| `x` | 查看精华区 |
| `d` | 删除文章 |

### 经典 ANSI 配色方案

Firebird BBS 使用终端 ANSI 16 色体系，黑底亮字是标志性视觉风格：

| ANSI 码 | 颜色 | 典型用途 |
|---------|------|---------|
| `*[30m` | 黑色 | 背景（`*[40m` 黑底） |
| `*[31m` | 红色 | 警告、未读标记、重要通知 |
| `*[32m` | 绿色 | 在线状态、成功提示 |
| `*[33m` | 黄色 | 高亮、选中项、标题 |
| `*[34m` | 蓝色 | 次要链接 |
| `*[35m` | 洋红 | 特殊标记、精华 |
| `*[36m` | 青色 | 板块名、链接、主色调 |
| `*[37m` | 白色 | 正文 |
| `*[1m` | 高亮 | 加粗/增强可读性 |
| `*[7m` | 反显 | 选中行、光标行 |

### Web 版适配映射

将终端 ANSI 配色映射为现代 Web 深色主题：

```
背景色系:
  主背景:    #0d1117 (深灰黑, 非纯黑护眼)
  卡片背景:  #161b22
  悬停行:    #1c2333 (反显效果)

前景色系 (对应 ANSI 高亮色):
  正文:      #c9d1d9 (white → 柔和灰白)
  板块名/链接: #58a6ff (cyan → 蓝青)
  高亮/选中:  #d2991d (yellow → 琥珀黄)
  在线/成功:  #3fb950 (green → 绿)
  错误/警告:  #f85149 (red → 红)
  精华/特殊:  #bc8cff (magenta → 紫)
  次要信息:   #8b949e (灰色)
```

### 快捷键映射原则

Web 版继承 Telnet 快捷键体系时遵循：
1. **保留单键导航**：`j/k`、`→/←`、`/`、`h` 不变
2. **Ctrl 组合对应**：`Ctrl+P` 发帖、`Ctrl+R` 回复 保留
3. **冲突处理**：浏览器已占用的快捷键（如 `Ctrl+B` 书签）放弃，用 Web 端替代（`PgDn` 已被占用则用 `Space`）
4. **新增 Web 专属**：`Escape` 关闭弹窗、`?` 补充帮助

## 初始需求

用户提出了以下初始设计方向：

### 核心理念
- **键盘即界面**：用户双手可以全程不碰鼠标（类似 Vim 导航模式），但 UI 呈现是 2025 年主流审美
- **即时性幻觉**：所有用户操作（翻页、发帖、编辑）必须在 50ms 内给出视觉反馈，数据在后台静默同步

### 初始技术栈建议
- 前端：Next.js 15 (App Router) + React 19 + TypeScript 5.5
- 后端：NestJS (GraphQL + WebSocket) 或 Hono.js (轻量)
- 数据库：PostgreSQL 16 (主存储) + Redis 7 (会话/热数据/实时计数器)
- 键盘库：Mousetrap (基础) + 自定义 useKeyboardNavigation
- 动画：Motion (原 Framer Motion) + useOptimistic 钩子

### 初始功能范围
- 一键热切换的键盘配置（BBS Classic / Vim Style）
- 零延迟浏览架构（虚拟滚动 + 键盘导航 + IndexedDB 预加载）
- Firebird 数据迁移脚本
- TipTap 编辑器 + 语音输入 + AI 集成
- 动画 Emoji + 点赞动画
- WebSocket 实时通知

## 讨论与决策过程

### 第一轮：技术选型细化

| 问题 | 建议 | 结果 |
|------|------|------|
| NestJS vs Hono.js | NestJS 更适合（WebSocket Gateway 装饰器、依赖注入、模块化） | ✅ NestJS |
| GraphQL vs REST | BBS 数据结构固定，REST 更直观 | ✅ REST |
| Next.js 15 vs 16 | 16 带来 PPR、Cache Components，与即时性目标配合更好 | ✅ Next.js 16 |
| 预加载策略 | SW + IndexedDB 调试成本高，推迟到 P2 | ✅ P0/P1 先不用 SW |
| Firebird 数据迁移 | 暂时不做，后续再开发 | ✅ 移除 Phase 2 迁移任务 |

### 第二轮：部署与认证

| 问题 | 建议 | 结果 |
|------|------|------|
| 部署目标 | OrbStack Docker 自托管，macOS 本地运行 | ✅ OrbStack |
| 用户规模 | 不超过 200 人，追求简洁和超级快速 | ✅ 简化架构 |
| 微信登录 | 涉及测试号申请、ngrok 等额外步骤，推迟 | ✅ 先做邮箱密码本地登录 |
| 附件存储 | 本地文件系统最简洁 | ✅ 直接写 ./uploads/ |
| 域名 | localhost:3000 本地开发 | ✅ localhost |

### 第三轮：功能精简

基于"用户不超过 200 人，追求简洁和超级快速"的定位，做出以下决策：

| 功能 | 决策 | 原因 |
|------|------|------|
| 可视化快捷键修改 | ❌ 移除 | 固定快捷键足够，200 人用户无需定制 UI |
| Firebird 数据迁移 | ❌ 移除 | 暂无样本数据，后续需要时再开发 |
| OpenID/微信扫码 | ❌ 移除 | 简化认证流程 |
| IndexedDB 预加载 | ❌ 移除 | 虚拟滚动 + 乐观更新已覆盖 95% 场景 |
| GraphQL | ❌ 移除 | REST 更简单直接 |

### 最终功能范围

**P0 — 核心浏览体验**
- JWT 邮箱密码认证
- 板块 CRUD
- 帖子/回帖 API
- useKeyboardNavigation Hook（j/k/gg/G 等固定快捷键）
- react-virtuoso 虚拟滚动列表
- 乐观更新（发帖、点赞）
- 板块列表页 + 帖子详情页

**P1 — 编辑器 + 附件 + 搜索**
- TipTap 富文本编辑器（Markdown 快捷输入）
- 附件上传（图片/视频/音频/pdf 就地展开）
- Web Speech API 语音输入
- PostgreSQL 全文搜索

**P2 — AI + 实时**
- WebSocket 网关（板块房间广播）
- 实时通知（@回复推送）
- Vercel AI SDK 流式对接 OpenAI/DeepSeek
- AI 命令：/summary, /polish, Ctrl+Shift+K 补全

**P3 — 动画 + 打磨**
- 点赞粒子动画 + 可选音效
- 新帖淡入提示
- Lottie Emoji 替换
- 键盘快捷键 HUD

## 最终技术栈

| 层 | 选型 |
|---|------|
| 前端框架 | Next.js 16 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS + shadcn/ui |
| 编辑器 | TipTap |
| 虚拟滚动 | react-virtuoso |
| 键盘 | Mousetrap + 自定义 useKeyboardNavigation |
| 动画 | Motion (framer-motion) |
| 后端 | NestJS (REST + WebSocket) |
| ORM | Prisma |
| 数据库 | PostgreSQL 16 + Redis 7 |
| 搜索 | PostgreSQL tsvector + GIN |
| AI SDK | Vercel AI SDK |
| 包管理 | pnpm workspace + Turborepo |
| 容器化 | Docker Compose (OrbStack) |

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

> **设计原则**：沿用 Firebird BBS Telnet 界面 20+ 年验证的单键操作体系。`j/k` 上下、`Space` 翻页、`→/←` 进出、`h` 帮助 等核心快捷键与终端版保持一致。浏览器冲突键（如 `Ctrl+B` 书签）用 Web 端替代方案处理。
