'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        const res = await api.register(username, email, password);
        localStorage.setItem('token', (res as any).token);
        router.push('/');
      } catch (err: any) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    },
    [username, email, password, router],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--text-secondary)]/10 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-6 h-6 text-[var(--accent-cyan)]" />
            <h1 className="text-lg font-bold text-[var(--text-primary)]">注册 NeoBBS</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">用户名</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="2-20 个字符"
                required
                minLength={2}
                maxLength={20}
                className="bg-[var(--bg-primary)] border-[var(--text-secondary)]/20"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">邮箱</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-[var(--bg-primary)] border-[var(--text-secondary)]/20"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                required
                minLength={6}
                className="bg-[var(--bg-primary)] border-[var(--text-secondary)]/20"
              />
            </div>

            {error && (
              <p className="text-xs text-[var(--accent-red)]">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-cyan)] text-white hover:opacity-80"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-[var(--text-secondary)]">
            已有账号？{' '}
            <Link href="/auth/login" className="text-[var(--accent-cyan)] hover:underline">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
