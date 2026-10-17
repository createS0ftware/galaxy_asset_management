import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { post, setToken } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoMark } from '@/lib';

export default function Login() {
  const [email, setEmail] = useState('ops@example.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await post<{ token: string; user: { id: number; name: string; role: string } }>('/v1/auth/staff/login', { email, password });
      setToken(res.token);
      localStorage.setItem('sat.user', JSON.stringify({ name: res.user.name, role: 'Operations' }));
      nav('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-10 text-xl" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Galaxy Asset Portal</h1>
            <p className="mt-1 text-xs text-muted-foreground">Proof and pay in one transaction</p>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </label>
          <label className="relative block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</span>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-[30px] text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </label>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={busy || !password} className="w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </div>
  );
}
