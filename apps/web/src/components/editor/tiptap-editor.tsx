'use client';

import { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Strikethrough, Code, Quote, List, ListOrdered,
  Heading1, Heading2, Undo, Redo,
} from 'lucide-react';

interface Props {
  content?: object;
  placeholder?: string;
  onChange?: (json: object, html: string, text: string) => void;
  onReady?: (editor: any) => void;
  autofocus?: boolean;
}

export function TiptapEditor({
  content,
  placeholder = '输入内容... 支持 Markdown 快捷语法: # 标题, > 引用, ` 代码',
  onChange,
  onReady,
  autofocus = true,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    immediatelyRender: false,
    autofocus,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(
        editor.getJSON(),
        editor.getHTML(),
        editor.getText(),
      );
    },
  });

  useEffect(() => {
    if (editor) onReady?.(editor);
  }, [editor, onReady]);

  const ToolbarBtn = useCallback(
    ({ onClick, isActive, icon: Icon, title }: {
      onClick: () => void; isActive: boolean; icon: any; title: string;
    }) => (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded transition-colors ${
          isActive
            ? 'bg-[var(--accent-cyan)] text-white'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
        }`}
      >
        <Icon className="w-4 h-4" />
      </button>
    ),
    [],
  );

  if (!editor) return null;

  return (
    <div className="border border-[var(--text-secondary)]/20 rounded-lg overflow-hidden
                    bg-[var(--bg-primary)]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-[var(--text-secondary)]/10
                      bg-[var(--bg-card)] flex-wrap">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="加粗 (Ctrl+B)"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="斜体 (Ctrl+I)"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={Strikethrough}
          title="删除线"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          icon={Code}
          title="行内代码"
        />
        <div className="w-px h-5 bg-[var(--text-secondary)]/20 mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          title="标题 1 (# )"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="标题 2 (## )"
        />
        <div className="w-px h-5 bg-[var(--text-secondary)]/20 mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="无序列表 (- )"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="有序列表 (1. )"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="引用 (> )"
        />
        <div className="flex-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          isActive={false}
          icon={Undo}
          title="撤销"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          isActive={false}
          icon={Redo}
          title="重做"
        />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
