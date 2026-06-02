'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, ImagePlus, Send, Mic } from 'lucide-react';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { api } from '@/lib/api-client';
import { VoiceInput } from '@/components/editor/voice-input';

interface Props {
  boardSlug: string;
  threadId?: string; // if replying
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  parentPostId?: string;
}

export function PostEditor({ boardSlug, threadId, open, onClose, onSuccess, parentPostId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [contentJson, setContentJson] = useState<object>({});
  const [contentHtml, setContentHtml] = useState('');
  const [contentText, setContentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const editorRef = useRef<any>(null);
  const voiceTargetRef = useRef<'title' | 'body'>('body');
  const [attachments, setAttachments] = useState<
    { id: string; file: File; preview?: string }[]
  >([]);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTitle('');
      setContentJson({});
      setContentHtml('');
      setContentText('');
      setAttachments([]);
      setAttachmentIds([]);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!contentText.trim()) return;
    if (!threadId && !title.trim()) return;

    setSubmitting(true);
    try {
      if (threadId) {
        await api.createReply(threadId, { json: contentJson, html: contentHtml }, attachmentIds, parentPostId);
      } else {
        const thread = await api.createThread(boardSlug, title, { json: contentJson, html: contentHtml }, attachmentIds);
        router.push(`/b/${boardSlug}/${(thread as any).id}`);
      }
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('Post failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [title, contentJson, contentHtml, contentText, attachmentIds, boardSlug, threadId, router, onClose]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const result = await api.uploadAttachment(file);
        const attId = (result as any).id;
        setAttachments((prev) => [
          ...prev,
          { id: attId, file, preview: URL.createObjectURL(file) },
        ]);
        setAttachmentIds((prev) => [...prev, attId]);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    },
    [],
  );

  const handleVoiceResult = useCallback((text: string) => {
    if (voiceTargetRef.current === 'title') {
      setTitle((prev) => prev + text);
    } else if (editorRef.current) {
      editorRef.current.commands.insertContent(text);
    }
  }, []);

  if (!open) return null;

  const isReply = !!threadId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
         onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-2xl mx-4
                      max-h-[90vh] flex flex-col border border-[var(--text-secondary)]/10">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--text-secondary)]/10">
          <h2 className="text-sm font-semibold text-[var(--accent-cyan)]">
            {isReply ? '回复帖子' : `发新帖 · ${boardSlug}`}
          </h2>
          <div className="flex-1" />
          <button
            onClick={() => setShowVoice((v) => !v)}
            className={`p-1.5 rounded transition-colors ${
              showVoice ? 'bg-[var(--accent-red)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="语音输入"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button onClick={onClose}
                  className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Input */}
        {showVoice && (
          <div className="px-5 py-3 bg-[var(--bg-hover)] border-b border-[var(--text-secondary)]/10">
            <VoiceInput
              onResult={handleVoiceResult}
              onClose={() => setShowVoice(false)}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!isReply && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="帖子标题"
              onFocus={() => { voiceTargetRef.current = 'title'; }}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)]
                         border border-[var(--text-secondary)]/20
                         text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
                         focus:outline-none focus:border-[var(--accent-cyan)] text-sm"
              autoFocus
            />
          )}

          <div onFocus={() => { voiceTargetRef.current = 'body'; }}>
          <TiptapEditor
            content={Object.keys(contentJson).length > 0 ? (contentJson as any) : null}
            onReady={(ed) => { editorRef.current = ed; }}
            onChange={(json, html, text) => {
              setContentJson(json);
              setContentHtml(html);
              setContentText(text);
            }}
            autofocus={isReply}
          />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div key={att.id} className="relative group">
                  {att.preview && att.file.type.startsWith('image/') ? (
                    <img
                      src={att.preview}
                      alt={att.file.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-[var(--bg-primary)] rounded-lg
                                    flex items-center justify-center text-xs
                                    text-[var(--text-secondary)]">
                      {att.file.name.slice(0, 6)}
                    </div>
                  )}
                  <button
                    onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full
                               bg-[var(--accent-red)] text-white text-xs
                               flex items-center justify-center opacity-0
                               group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[var(--text-secondary)]/10">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                       text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]
                       hover:bg-[var(--bg-hover)] transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            附件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/mp4,audio/*,application/pdf,.txt,.zip"
          />
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm text-[var(--text-secondary)]
                       hover:bg-[var(--bg-hover)] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !contentText.trim()}
            className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-sm
                       bg-[var(--accent-cyan)] text-white font-medium
                       hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4" />
            {submitting ? '发送中...' : isReply ? '回复' : '发帖'}
          </button>
        </div>
      </div>
    </div>
  );
}
