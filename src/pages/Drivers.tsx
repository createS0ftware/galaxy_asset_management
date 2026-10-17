import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApi, post, shortTx, ErrorBox } from '@/lib';
import type { Driver } from '@/types';

export default function Drivers() {
  const { data, error, isLoading, mutate } = useApi<Driver[]>('/v1/drivers', 10000);
  const [f, setF] = useState({ name: '', phone: '', momoNumber: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await post('/v1/drivers', { name: f.name, phone: f.phone, momoNumber: f.momoNumber || undefined });
      setF({ name: '', phone: '', momoNumber: '' });
      await mutate();
      setMsg('Driver registered — they onboard their wallet in the driver app');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Wallet-ready drivers can be assigned to trips. Keys live in the driver's phone — never here.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add driver</CardTitle></CardHeader>
        <CardContent>
          {msg && <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{msg}</p>}
          {err && <ErrorBox error={err} />}
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Name</span>
              <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Kwame A." />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Phone</span>
              <Input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+233540000111" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">MoMo number (optional)</span>
              <Input value={f.momoNumber} onChange={(e) => setF({ ...f, momoNumber: e.target.value })} placeholder="+233540000111" />
            </label>
            <div>
              <Button type="submit" disabled={busy} className="mt-7">{busy ? 'Adding…' : 'Add driver'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && <ErrorBox error={error} />}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Stellar address</TableHead>
              <TableHead>MoMo</TableHead>
              <TableHead>Wallet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-[13px] font-semibold">{d.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{d.phone}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{d.publicKey ? shortTx(d.publicKey, 8) : '—'}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{d.momoNumber ?? '—'}</TableCell>
                <TableCell>
                  {d.walletStatus === 'ready' ? <Badge variant="verified">Ready</Badge> : d.walletStatus === 'pending' ? <Badge className="border-amber-200 bg-amber-50 text-amber-600">Pending</Badge> : <Badge variant="secondary">Not onboarded</Badge>}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground">No drivers yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
