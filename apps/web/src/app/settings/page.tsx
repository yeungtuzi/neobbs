'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Terminal, Key, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { KeyboardBus } from '@/components/keyboard/keyboard-bus';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [signature, setSignature] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMe().then((res: any) => {
      setUser(res);
      setSignature(res.signature || '');
    }).catch(() => router.push('/auth/login'));
  }, [router]);

  const updateSignature = async () => {
    setMsg(''); setError('');
    try {
      await api.request('/users/me', { method: 'PATCH', body: JSON.stringify({ signature }) });
      setMsg('签名已更新');
    } catch (err: any) { setError(err.message); }
  };

  const changePassword = async () => {
    setMsg(''); setError('');
    if (!newPassword || newPassword.length < 6) { setError('新密码至少 6 位'); return; }
    try {
      await api.request('/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
      setMsg('密码已更改');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-6">
      <KeyboardBus mode="list" onAction={(a) => { if (a === 'go_back') router.push('/'); }} hints={['← 返回']} />
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回首页
      </Link>

      <div className="flex items-center gap-2 mb-8">
        <Terminal className="w-6 h-6 text-[var(--accent-cyan)]" />
        <h1 className="text-xl font-bold text-[var(--text-primary)]">用户设置</h1>
      </div>

      {user && (
        <div className="space-y-8">
          {/* Signature */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--text-secondary)]/10">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4">
              <FileText className="w-4 h-4 text-[var(--accent-cyan)]" /> 签名档
            </h2>
            <Input value={signature} onChange={(e) => setSignature(e.target.value)}
                   placeholder="签名会显示在你发的每篇帖子下方" className="mb-3" />
            <Button onClick={updateSignature} size="sm">保存签名</Button>
          </div>

          {/* Password */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--text-secondary)]/10">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4">
              <Key className="w-4 h-4 text-[var(--accent-yellow)]" /> 修改密码
            </h2>
            <div className="space-y-3 mb-3">
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                     placeholder="当前密码" />
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                     placeholder="新密码（至少 6 位）" />
            </div>
            <Button onClick={changePassword} size="sm" variant="outline">修改密码</Button>
          </div>

          {msg && <p className="text-sm text-[var(--accent-green)]">{msg}</p>}
          {error && <p className="text-sm text-[var(--accent-red)]">{error}</p>}
        </div>
      )}
    </div>
  );
}
