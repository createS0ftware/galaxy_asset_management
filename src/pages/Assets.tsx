import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApi, fmtDateTime, post, ErrorBox } from '@/lib';
import type { Asset } from '@/types';

export default function Assets() {
  const { data, error, isLoading, mutate } = useApi<Asset[]>('/v1/assets', 10000);
  const [showForm, setShowForm] = useState(false);
  const nav = useNavigate();

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Registered physical assets with their on-chain identity. Only tag-activated assets can be dispatched (BR-01).
          </p>
        </div>
        <Button variant="dark" onClick={() => setShowForm((s) => !s)}>
          <Plus className="size-4" /> Register asset
        </Button>
      </div>

      {showForm && <RegisterForm onDone={() => { setShowForm(false); mutate(); }} />}

      {error && <ErrorBox error={error} />}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((a) => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => nav(`/assets/${a.id}`)}>
                <TableCell>
                  <Link to={`/assets/${a.id}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    {a.name}
                  </Link>
                  <div className="font-mono text-[11px] text-muted-foreground">{a.id}</div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.type}</TableCell>
                <TableCell className="font-mono text-xs">{a.serial}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.tagId}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</TableCell>
                <TableCell>
                  {a.status === 'active' ? <Badge variant="verified">Active</Badge> : <Badge className="border-amber-200 bg-amber-50 text-amber-600">Registered</Badge>}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="py-10 text-center text-xs text-muted-foreground">No assets registered yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ id: '', name: '', type: '', serial: '', tagId: '', value: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await post('/v1/assets', { id: f.id.trim(), name: f.name, type: f.type, serial: f.serial, tagId: f.tagId, value: f.value || undefined });
      onDone();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Register asset — T1, anchors the registration payload</CardTitle></CardHeader>
      <CardContent>
        {err && <ErrorBox error={err} />}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">ID</span>
            <Input required value={f.id} onChange={set('id')} placeholder="GX400-0041" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-medium">Name</span>
            <Input required value={f.name} onChange={set('name')} placeholder="Diesel generator 400 kVA" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Type</span>
            <Input required value={f.type} onChange={set('type')} placeholder="generator" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Serial</span>
            <Input required value={f.serial} onChange={set('serial')} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Value (optional)</span>
            <Input value={f.value} onChange={set('value')} placeholder="45000" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-medium">NFC / QR tag ID</span>
            <Input required value={f.tagId} onChange={set('tagId')} placeholder="04:A3:7E:91" />
          </label>
        </div>
        <Button type="button" onClick={submit} disabled={busy} className="mt-4">{busy ? 'Registering…' : 'Register & anchor'}</Button>
      </CardContent>
    </Card>
  );
}
