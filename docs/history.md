# NeoBBS — 开发历史

## 2026-06-04 (late)

### 修复
- **搜索完全重写**: raw SQL 查询（plain_text + title + content::text JSONB 兼容新旧帖）
- **plainText 提取修复**: 正确处理 `{ json, html }` 包装结构
- **搜索最小长度降为 1**: 中文单字搜索
- **搜索实时增量**: 输入即搜，200ms 防抖
- **搜索结果键盘导航**: j/k 导航 + Enter 跳转 + Backspace 始终编辑输入
- **返回恢复搜索**: sessionStorage 保存/恢复搜索状态
- **键盘总线暂停**: 搜索浮层打开时页面键盘停止响应，关闭后恢复

## 2026-06-04

### 新功能
- **版面隐藏**: `.` 键隐藏当前版面，`Shift+H` 显示全部，隐藏版面变灰可反隐藏
- **帖子永久编号**: 每篇帖子有唯一递增 `postNumber`（全板块范围），删除不移位
- **单帖精华**: 版主/管理员可标记任意回复为精华，精华帖及其所有祖先帖受批量清理保护
- **批量清理**: 版主输入编号范围批量软删除，自动跳过精华链
- **回收站**: 版主/管理员查看已删帖子列表
- **帖子编辑**: `e` 键弹出编辑器回填原文，`PATCH /api/posts/:id` 保存
- **帖子删除**: `d` 键确认弹窗软删除

### 优化
- **搜索重构**: 改为弹出式浮层（不离开页面），支持全站/当前版面搜索
- **搜索增强**: 同时搜索帖子标题和正文，最低 1 字符
- **搜索结果键盘导航**: `j/k` 选择，`Enter` 跳转
- **热键提示面板**: 右下角固定 → 内容区域右上角位置自适应，每页不同提示
- **移除 `?` 帮助浮层**: 热键面板已覆盖
- **Safari 版面列表位置恢复**: 用 `<div onClick>` 替代 `<Link href>` 确保 sessionStorage 写入
- **PostCard 鼠标点击保存位置**: 确保返回时焦点保持
- **ESC 全局返回**: 所有页面统一，搜素浮层内关闭不导航
- **移除未使用的 shadcn 组件**: dialog, dropdown-menu, avatar, separator, badge

## 2026-06-03

### 新功能
- **Firebird Phoenix BBS 初版**
- JWT 认证（注册/登录）+ 未登录拦截
- Firebird BBS 经典键盘导航体系
- react-virtuoso 虚拟滚动帖子列表
- TipTap 富文本编辑器（Markdown 快捷输入）
- 树形嵌套回复（真实深度 + 分支着色）
- 附件上传（sharp 缩略图 + 图片 lightbox）
- 本地中文语音识别（Whisper.cpp + ffmpeg）
- WebSocket 实时通知（新帖广播 + 回复通知）
- 全文搜索（PostgreSQL ILIKE）
- Firebird BBS ANSI 深色主题
- 返回保持滚动位置（sessionStorage）
