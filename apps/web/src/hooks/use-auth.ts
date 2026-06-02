'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

interface UserInfo {
  id: string;
  username: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setChecked(true); return; }
    api.getMe()
      .then((res: any) => setUser(res))
      .catch(() => { localStorage.removeItem('token'); setUser(null); })
      .finally(() => setChecked(true));
  }, []);

  const requireAuth = (): boolean => {
    if (user) return true;
    // Signal need for login
    window.dispatchEvent(new CustomEvent('auth-required'));
    return false;
  };

  return { user, checked, requireAuth, isLoggedIn: !!user };
}
