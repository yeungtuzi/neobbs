'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, X } from 'lucide-react';

export function AuthToast() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener('auth-required', handler);
    return () => window.removeEventListener('auth-required', handler);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50
                     bg-[var(--accent-yellow)] text-black
                     px-5 py-3 rounded-xl shadow-2xl
                     flex items-center gap-3 text-sm font-medium"
        >
          <span>请先登录后再操作</span>
          <button
            onClick={() => { setShow(false); router.push('/auth/login'); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/10
                       hover:bg-black/20 transition-colors text-xs"
          >
            <LogIn className="w-3.5 h-3.5" /> 去登录
          </button>
          <button onClick={() => setShow(false)} className="hover:opacity-60">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
