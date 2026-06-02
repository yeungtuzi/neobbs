"use client";

import * as React from "react";

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  const [show, setShow] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 100);
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && (
        <div
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                     px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-[var(--bg-card)] text-[var(--text-primary)]
                     border border-[var(--text-secondary)]/10 shadow-lg
                     whitespace-nowrap pointer-events-none"
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { TooltipProvider, Tooltip };
