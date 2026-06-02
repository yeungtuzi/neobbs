'use client';

import { useState } from 'react';
import { File, Download, X } from 'lucide-react';

interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  isImage: boolean;
  url: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
}

interface Props {
  attachments: Attachment[];
}

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

export function AttachmentRenderer({ attachments }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!attachments.length) return null;

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) => {
          const url = `${BASE}${att.url}`;

          if (att.isImage) {
            return (
              <img
                key={att.id}
                src={url}
                alt={att.originalName}
                loading="lazy"
                onClick={() => setLightbox(url)}
                className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer
                           hover:opacity-80 transition-opacity border border-[var(--text-secondary)]/10"
                style={{
                  ...(att.imageWidth && att.imageHeight
                    ? { aspectRatio: `${att.imageWidth}/${att.imageHeight}` }
                    : {}),
                }}
              />
            );
          }

          if (att.mimeType.startsWith('video/')) {
            return (
              <video
                key={att.id}
                src={url}
                controls
                className="max-w-md max-h-64 rounded-lg"
              />
            );
          }

          if (att.mimeType.startsWith('audio/')) {
            return (
              <audio key={att.id} src={url} controls className="w-full max-w-md" />
            );
          }

          if (att.mimeType === 'application/pdf') {
            return (
              <iframe
                key={att.id}
                src={url}
                className="w-full max-w-md h-64 rounded-lg border border-[var(--text-secondary)]/10"
              />
            );
          }

          // Other files: download link
          return (
            <a
              key={att.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)]
                         hover:bg-[var(--bg-hover)] transition-colors text-sm
                         text-[var(--accent-cyan)] hover:underline"
            >
              <File className="w-4 h-4" />
              <span className="truncate max-w-[200px]">{att.originalName}</span>
              <Download className="w-3.5 h-3.5 ml-1" />
            </a>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10
                       text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox}
            alt="Lightbox"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
