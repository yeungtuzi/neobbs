'use client';

import React, { memo } from 'react';

const EMOJI_MAP: Record<string, { emoji: string; anim: string }> = {
  ':rocket:':  { emoji: '🚀', anim: 'animate-bounce' },
  ':fire:':    { emoji: '🔥', anim: 'animate-pulse' },
  ':+1:':      { emoji: '👍', anim: 'animate-bounce' },
  ':heart:':   { emoji: '❤️', anim: 'animate-pulse' },
  ':tada:':    { emoji: '🎉', anim: 'animate-bounce' },
  ':smile:':   { emoji: '😊', anim: 'animate-pulse' },
  ':laugh:':   { emoji: '😂', anim: 'animate-bounce' },
  ':clap:':    { emoji: '👏', anim: 'animate-bounce' },
  ':100:':     { emoji: '💯', anim: 'animate-pulse' },
  ':star:':    { emoji: '⭐', anim: 'animate-pulse' },
};

interface Props {
  text: string;
  className?: string;
}

export const AnimatedEmoji = memo(function AnimatedEmoji({ text, className }: Props) {
  let result: (string | React.JSX.Element)[] = [text];
  let hasMatch = false;

  for (const [code, { emoji, anim }] of Object.entries(EMOJI_MAP)) {
    if (text.includes(code)) {
      hasMatch = true;
      result = result.flatMap((part) => {
        if (typeof part !== 'string') return [part];
        const parts = part.split(code);
        return parts.flatMap((p, i) => {
          const els: (string | React.JSX.Element)[] = [p];
          if (i < parts.length - 1) {
            els.push(
              <span
                key={`${code}-${i}`}
                className={`inline-block ${anim} ${className || ''}`}
                title={code}
              >
                {emoji}
              </span>,
            );
          }
          return els;
        });
      });
    }
  }

  if (!hasMatch) return <>{text}</>;
  return <>{result}</>;
});
