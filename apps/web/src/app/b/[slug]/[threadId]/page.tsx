'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, MessageSquare, Clock, User, CornerDownRight } from 'lucide-react';
import { KeyboardBus } from '@/components/keyboard/keyboard-bus';
import { PostEditor } from '@/components/post/post-editor';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';

interface PostData {
  id: string;
  parentPostId: string | null;
  content: any;
  plainText: string;
  createdAt: string;
  updatedAt: string;
  editCount: number;
  isFirstPost: boolean;
  author: { id: string; username: string; avatar: string | null; signature: string | null };
  attachments: { id: string; originalName: string; mimeType: string; isImage: boolean; url: string }[];
  likeCount: number;
  isLiked: boolean;
  replies: PostData[];
}

interface FlatPost extends PostData {
  depth: number;
  branchIndex: number; // which top-level reply branch this belongs to
}

function computeDepth(postMap: Map<string, PostData>, postId: string | null): number {
  let depth = 0;
  let current = postId;
  while (current) {
    const p = postMap.get(current);
    if (!p?.parentPostId) break;
    depth++;
    current = p.parentPostId;
  }
  return depth;
}

function computeBranchRoot(postMap: Map<string, PostData>, postId: string): string {
  let current: string | null = postId;
  let root = postId;
  while (current) {
    const p = postMap.get(current);
    if (!p?.parentPostId) break;
    root = current;
    current = p.parentPostId;
    // Walk all the way up, keeping the node just below the main post
    const parent = postMap.get(current);
    if (parent && !parent.parentPostId) {
      root = current;
      break;
    }
  }
  return root;
}

function buildTree(posts: PostData[]): PostData[] {
  const map = new Map<string, PostData>();
  const roots: PostData[] = [];
  for (const p of posts) {
    map.set(p.id, { ...p, replies: [] });
  }
  for (const p of posts) {
    const node = map.get(p.id)!;
    if (p.parentPostId && map.has(p.parentPostId)) {
      map.get(p.parentPostId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function flattenTree(nodes: PostData[]): FlatPost[] {
  const postMap = new Map<string, PostData>();
  const walkMap = (list: PostData[]) => {
    for (const n of list) { postMap.set(n.id, n); walkMap(n.replies); }
  };
  walkMap(nodes);

  // Assign branch indices to top-level replies
  const branchRoots = nodes.length > 1
    ? nodes.slice(1).map((n) => computeBranchRoot(postMap, n.id))
    : [];
  const uniqueBranches = [...new Set(branchRoots)];

  const result: FlatPost[] = [];
  const walk = (list: PostData[], depth: number) => {
    for (const n of list) {
      const branchRoot = computeBranchRoot(postMap, n.id);
      const branchIndex = uniqueBranches.indexOf(branchRoot);
      result.push({ ...n, depth, branchIndex: branchIndex >= 0 ? branchIndex : 0 });
      walk(n.replies, depth + 1);
    }
  };
  walk(nodes, 0);
  return result;
}

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = use(params);
  const router = useRouter();

  const [thread, setThread] = useState<any>(null);
  const [flatPosts, setFlatPosts] = useState<FlatPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [focusedPostIndex, setFocusedPostIndex] = useState(0);
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { isLoggedIn, requireAuth } = useAuth();

  const fetchThread = useCallback(() => {
    api.getThread(threadId)
      .then((data: any) => {
        setThread(data);
        const tree = buildTree(data.posts);
        setFlatPosts(flattenTree(tree));
      })
      .finally(() => setLoading(false));
  }, [threadId]);

  useEffect(() => {
    setLoading(true);
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const handleLike = useCallback(async (postId: string) => {
    setFlatPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) } : p)),
    );
    try { await api.toggleLike(postId); } catch {
      setFlatPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) } : p)),
      );
    }
  }, []);

  const scrollToPost = useCallback((index: number) => {
    setFocusedPostIndex(index);
    const post = flatPosts[index];
    if (post) {
      const el = postRefs.current.get(post.id);
      el?.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  }, [flatPosts]);

  const handleKeyboardAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'next_item':
        case 'scroll_down':
          scrollToPost(Math.min(focusedPostIndex + 1, flatPosts.length - 1));
          break;
        case 'prev_item':
        case 'scroll_up':
          scrollToPost(Math.max(0, focusedPostIndex - 1));
          break;
        case 'goto_top':
          scrollToPost(0);
          break;
        case 'goto_bottom':
          scrollToPost(flatPosts.length - 1);
          break;
        case 'reply': {
          if (!requireAuth()) break;
          const target = flatPosts[focusedPostIndex];
          setReplyTarget(target?.id || null);
          setShowEditor(true);
          break;
        }
        case 'like':
          if (!requireAuth()) break;
          if (flatPosts[focusedPostIndex]) handleLike(flatPosts[focusedPostIndex]!.id);
          break;
        case 'back_to_list':
          router.push(`/b/${slug}`);
          break;
      }
    },
    [flatPosts, focusedPostIndex, scrollToPost, handleLike, router, slug],
  );

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">加载中...</div>;
  }

  const depthColor = (depth: number) => {
    if (depth === 0) return 'var(--accent-cyan)';
    const colors = ['var(--accent-green)', 'var(--accent-yellow)', 'var(--accent-purple)', 'var(--accent-red)', 'var(--accent-cyan)'];
    return colors[(depth - 1) % colors.length];
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full">
      <KeyboardBus mode="detail" onAction={handleKeyboardAction} />

      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--text-secondary)]/10 bg-[var(--bg-card)]">
        <Link href={`/b/${slug}`} className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{thread?.title}</h1>
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-0.5">
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{thread?.author?.username}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(thread?.createdAt).toLocaleDateString('zh-CN')}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thread?.replyCount} 回复</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {flatPosts.map((post, index) => {
          const isFocused = index === focusedPostIndex;
          const depth = post.depth;
          // Distinct branch colors with visible contrast against dark bg
          const branchColors = [
            '#1a2a33', // teal dark
            '#2a1f2e', // plum dark
            '#1e2d1e', // forest dark
            '#2d2418', // bronze dark
            '#1f2430', // steel dark
            '#2e1f1f', // rose dark
          ];
          const branchBg = post.branchIndex > 0
            ? branchColors[(post.branchIndex - 1) % branchColors.length]
            : '#161b22'; // root posts: standard card bg
          return (
            <article
              key={post.id}
              ref={(el: HTMLDivElement | null) => { if (el) postRefs.current.set(post.id, el); }}
              className={`px-6 py-4 border-l-4 transition-colors ${
                isFocused ? 'bg-[var(--bg-hover)] border-l-[var(--accent-yellow)]' : ''
              }`}
              style={{
                paddingLeft: `${24 + depth * 24}px`,
                backgroundColor: isFocused ? undefined : branchBg,
              }}
            >
              {post.parentPostId && (
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mb-2">
                  <CornerDownRight className="w-3 h-3" style={{ color: depthColor(depth) }} />
                  <span>回复 #{flatPosts.findIndex(p => p.id === post.parentPostId) + 1}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-cyan)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-cyan)]">
                    {post.author.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{post.author.username}</span>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">#{index + 1}</span>
                </div>
              </div>

              <div className="tiptap-content text-sm text-[var(--text-primary)] leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: (post.content as any)?.html || post.plainText.replace(/\n/g, '<br/>') }} />

              {post.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.attachments.map((att) =>
                    att.isImage ? (
                      <img key={att.id} src={`http://localhost:4000${att.url}`} alt={att.originalName}
                           className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-80" loading="lazy" />
                    ) : (
                      <a key={att.id} href={`http://localhost:4000${att.url}`}
                         className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--accent-cyan)] hover:underline" target="_blank">
                        {att.originalName}
                      </a>
                    ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--text-secondary)]/5">
                {isLoggedIn && (
                <button onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 text-xs transition-colors"
                        style={{ color: post.isLiked ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={post.isLiked ? 'liked' : 'unliked'} initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </motion.div>
                  </AnimatePresence>
                  {post.likeCount > 0 && post.likeCount}
                </button>
                )}
                {isLoggedIn && (
                <button onClick={() => { setReplyTarget(post.id); setShowEditor(true); }}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />回复
                </button>
                )}
                <span className="text-xs text-[var(--text-secondary)] ml-auto">
                  {new Date(post.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <PostEditor
        boardSlug={slug}
        threadId={threadId}
        parentPostId={replyTarget ?? undefined}
        open={showEditor}
        onClose={() => { setShowEditor(false); setReplyTarget(null); }}
        onSuccess={() => fetchThread()}
      />
    </div>
  );
}
