// User types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  signature: string | null;
  role: 'user' | 'moderator' | 'admin';
  createdAt: string;
}

// Board types
export interface BoardNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  threadCount: number;
  postCount: number;
  isHidden: boolean;
  children: BoardNode[];
}

// Thread types
export interface ThreadSummary {
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

export interface ThreadDetail extends ThreadSummary {
  boardId: string;
  boardSlug: string;
  posts: PostDetail[];
}

// Post types
export interface PostDetail {
  id: string;
  threadId: string;
  author: { id: string; username: string; avatar: string | null; signature: string | null };
  content: unknown; // TipTap JSON
  plainText: string;
  createdAt: string;
  updatedAt: string;
  editCount: number;
  isFirstPost: boolean;
  likeCount: number;
  isLiked: boolean;
  attachments: AttachmentSummary[];
}

// Attachment types
export interface AttachmentSummary {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  isImage: boolean;
  imageWidth: number | null;
  imageHeight: number | null;
  thumbnailUrl: string | null;
  url: string;
}

// Pagination
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

// Search
export interface SearchResult {
  threads: ThreadSummary[];
  total: number;
}
