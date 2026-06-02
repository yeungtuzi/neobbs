'use client';

import { memo } from 'react';
import Link from 'next/link';
import { MessageSquare, Eye, Pin, Lock, Star } from 'lucide-react';

export interface ThreadItem {
  id: string;
  title: string;
  author: { id: string; username: string; avatar: string | null };
  replyCount: number;
  viewCount: number;
  lastReplyAt: string;
  lastReplyUser: { id: string; username: string } | null;
  isPinned: boolean;
  isLocked: boolean;
  isDigest: boolean;
  tags: string[];
  createdAt: string;
}

interface PostCardProps {
  item: ThreadItem;
  isFocused: boolean;
  index: number;
  boardSlug: string;
}

export const PostCard = memo(function PostCard({
  item,
  isFocused,
  index,
  boardSlug,
}: PostCardProps) {
  const timeAgo = formatTimeAgo(item.lastReplyAt);

  return (
    <Link
      href={`/b/${boardSlug}/${item.id}`}
      className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--text-secondary)]/5
                  transition-colors duration-75
                  ${isFocused
                    ? 'bg-[var(--bg-hover)] border-l-2 border-l-[var(--accent-yellow)]'
                    : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-l-2 border-l-transparent'
                  }`}
    >
      {/* Index */}
      <span className="font-mono text-xs text-[var(--text-secondary)] w-8 text-right flex-shrink-0">
        {index + 1}
      </span>

      {/* Icons */}
      <div className="flex gap-1 flex-shrink-0">
        {item.isPinned && <Pin className="w-3.5 h-3.5 text-[var(--accent-red)]" />}
        {item.isDigest && <Star className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />}
        {item.isLocked && <Lock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${
            isFocused ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-primary)]'
          }`}>
            {item.title}
          </span>
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-primary)]
                         text-[var(--accent-cyan)] font-mono flex-shrink-0"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-secondary)]">
          <span>{item.author.username}</span>
          <span>{formatTime(item.createdAt)}</span>
          {item.lastReplyUser && (
            <span>最后回复: {item.lastReplyUser.username} · {timeAgo}</span>
          )}
        </div>
      </div>

      {/* Counts */}
      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-shrink-0">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {item.replyCount}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {item.viewCount}
        </span>
      </div>
    </Link>
  );
});

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatTime(dateStr);
}
