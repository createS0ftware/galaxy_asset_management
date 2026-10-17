import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useApi, StatusPill, TxLink, fmtMoney, fmtTime, fmtDateTime, post, ErrorBox, api } from '@/lib';
import type { PaymentsSummary as Summary } from '@/types';

export default function Payments() {
  const { data, error, isLoading, mutate } = useApi<Summary>('/v1/payments/summary', 8000);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const nav = useNavigate();

  if (isLoading && !data) return <p className="py-10 text-sm text-muted-foreground">Loading payments…</p>;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const decide = async (id: number, action: 'approve' | 'decline') => {
    setMsg(null);
    try {
      await post(`/v1/advances/${id}/${action}`, {});
      await mutate();
      setMsg({ ok: true, text: action === 'approve' ? 'Advance approved — sent as a claimable balance (T6)' : 'Advance declined' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' });
    }
  };

  const tile = (label: string, value: string, caption: string, alert = false) => (
    <Card className={alert ? 'border-red-200' : ''}>
      <CardContent className="pt-4">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`mt-1 text-[22px] font-bold tracking-tight ${alert ? 'text-red-600' : ''}`}>{value}</p>
        <p className="mt-0.5 text-[10.5px] text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );

  const firstRequest = data.advanceRequests[0];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">All amounts are USDC on Stellar.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/v1/payments/reconciliation.csv" download>
              <Download className="size-4" /> Export reconciliation (CSV)
            </a>
          </Button>
        </div>
      </div>

      {msg && <p className={`rounded-md px-3 py-2 text-xs ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {tile('Treasury', fmtMoney(data.treasury.usdc), 'Escrows funded from here')}
        {tile('Held for trips (accounts + contracted)', fmtMoney(data.escrowHeld), `${data.escrowByTrip.length} active trips`)}
        {tile(
          'Fee account (pays network fees & sponsors reserves)',
          `${fmtMoney(data.feeAccount.xlm)} XLM`,
          `Alert below ${data.feeAccount.alertThreshold} XLM`,
          data.feeAccount.alert,
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_330px]">
        <Card>
          <CardHeader><CardTitle>Escrow by trip</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Trip</TableHead>
                  <TableHead className="text-right">Funded</TableHead>
                  <TableHead className="text-right">Released</TableHead>
                  <TableHead>Advances</TableHead>
                  <TableHead className="text-right">Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.escrowByTrip.map((t) => (
                  <TableRow key={t.trip} className="cursor-pointer" onClick={() => nav(`/trips/${t.trip}`)}>
                    <TableCell className="font-mono text-xs font-medium">{t.trip} <StatusPill kind={t.status} /></TableCell>
                    <TableCell className="text-right text-xs">{fmtMoney(t.funded)}</TableCell>
                    <TableCell className="text-right text-xs">{fmtMoney(t.released)}</TableCell>
                    <TableCell className="text-xs">
                      {Number(t.advances) > 0 ? (
                        <span className="font-medium text-red-600">{fmtMoney(t.advances)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs">{fmtMoney(t.left)}</TableCell>
                  </TableRow>
                ))}
                {data.escrowByTrip.length === 0 && (
                  <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">No open trips</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {firstRequest ? (
          <Card>
            <CardHeader><CardTitle>Fuel advance request</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">
                Driver #{firstRequest.tripId} · <span className="font-mono">{firstRequest.tripId}</span> · {fmtMoney(firstRequest.amount)} USDC
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{firstRequest.reason || 'No reason given.'}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Sent as a claimable balance. The driver can claim it until it expires; after that it returns to escrow. Deducted from the final leg.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => decide(firstRequest.id, 'approve')}>Approve {fmtMoney(firstRequest.amount)}</Button>
                <Button size="sm" variant="outline" onClick={() => decide(firstRequest.id, 'decline')}>Decline</Button>
              </div>
              {data.advanceRequests.slice(1).map((a) => (
                <p key={a.id} className="mt-3 border-t pt-2 text-[11px] text-muted-foreground">
                  <span className="font-mono">{a.tripId}</span> · {fmtMoney(a.amount)} · <button className="text-blue-600 hover:underline" onClick={() => decide(a.id, 'approve')}>approve</button> / <button className="text-blue-600 hover:underline" onClick={() => decide(a.id, 'decline')}>decline</button>
                </p>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-5 text-xs text-muted-foreground">No pending advance requests</CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent payouts to drivers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">Time</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentPayouts.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{fmtTime(p.at) || '—'}</TableCell>
                  <TableCell>
                    <button onClick={() => nav(`/trips/${p.trip}`)} className="font-mono text-xs text-blue-600 hover:underline">
                      {p.trip ?? '—'}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.event} {p.wp > 0 ? `· leg ${p.wp}` : ''}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium">{fmtMoney(p.amount)}</TableCell>
                  <TableCell><TxLink txHash={p.txHash} /></TableCell>
                </TableRow>
              ))}
              {data.recentPayouts.length === 0 && (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">No payouts yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">
            Each payout shares a transaction with its check-in, so pay and proof of location can't drift apart. Network fees are paid by
            the platform's fee account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
