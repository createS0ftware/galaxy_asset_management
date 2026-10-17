import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RouteMap, type MapWp } from '@/components/RouteMap';
import { useApi, StatusPill, TxLink, RouteLegend, KIND_NAME, fmtMoney, fmtTime, fmtDateTime, post, hm, ErrorBox } from '@/lib';
import type { TripView } from '@/types';

const tile = (label: string, value: React.ReactNode, caption?: string) => (
  <Card>
    <CardContent className="pt-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
      {caption && <p className="mt-0.5 text-[10.5px] text-muted-foreground">{caption}</p>}
    </CardContent>
  </Card>
);

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, error, isLoading, mutate } = useApi<TripView>(id ? `/v1/trips/${id}` : null, 5000);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [reason, setReason] = useState('');

  if (isLoading && !data) return <p className="py-10 text-sm text-muted-foreground">Loading trip…</p>;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const act = async (label: string, fn: () => Promise<unknown>) => {
    setMsg(null);
    try {
      await fn();
      await mutate();
      setMsg({ ok: true, text: `${label} — done` });
    } catch (e) {
      setMsg({ ok: false, text: `${label} failed: ${e instanceof Error ? e.message : String(e)}` });
    }
  };
  const override = (kind: string) =>
    act(kind.replace(/_/g, ' '), () => post(`/v1/trips/${id}/overrides`, { kind, reason: reason || `${kind} from portal` }));

  const moving = ['funded', 'accepted', 'in_transit'].includes(data.status);
  const lastIdx = data.waypoints.length - 1;

  const mapWps: MapWp[] = data.waypoints.map((w) => ({
    name: w.name,
    sub: w.verified ? hm(w.verified.ledgerTime) : w.state === 'next' ? 'live' : fmtTime(w.windowStart),
    lat: w.lat,
    lon: w.lon,
    state: w.state === 'verified' ? 'verified' : w.state === 'next' ? 'next' : 'remaining',
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs text-muted-foreground">
        <Link to="/" className="text-blue-600 hover:underline">Trips</Link> / <span className="font-mono">{data.id}</span>
      </p>
      <div className="mt-1 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <span className="font-mono">{data.id}</span> <StatusPill kind={data.status} />
            {data.escrow.funded_badge && <Badge variant="verified">Funded</Badge>}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.asset?.name} ({data.asset?.serial}) · {data.driver?.name} {data.vehicle ? `· ${data.vehicle}` : ''} ·{' '}
            <a href={data.trackingUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">tracking link</a>
          </p>
        </div>
      </div>
      {msg && <p className={`mt-3 rounded-md px-3 py-2 text-xs ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {tile('Escrow funded', fmtMoney(data.escrow.funded), 'USDC')}
        {tile('Released to driver', fmtMoney(data.escrow.released), 'USDC')}
        {tile('Advances', fmtMoney(data.escrow.advances), 'USDC')}
        {tile('Escrow left', fmtMoney(data.escrow.left), 'USDC')}
        {tile('Advance limit', fmtMoney(data.escrow.advanceLimit), 'USDC')}
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_330px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route — verified vs live</CardTitle>
              <RouteLegend />
            </CardHeader>
            <CardContent>
              <RouteMap wps={mapWps} live={data.live ? { lat: data.live.lat, lon: data.live.lon, label: `${data.driver?.name ?? 'Driver'} · live` } : null} className="min-h-[280px]" />
              <div className="mt-4">
                {data.waypoints.map((w) => (
                  <div key={w.idx} className="flex items-center gap-3 border-b py-2.5 last:border-0">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${
                        w.state === 'verified' ? 'bg-blue-600' : w.state === 'next' ? 'border-2 border-primary bg-white' : 'border border-dashed border-muted-foreground bg-white'
                      }`}
                    />
                    <span className="text-[13px] font-semibold">{w.name}</span>
                    <Badge variant="secondary">{w.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {fmtTime(w.windowStart)}–{fmtTime(w.windowEnd)} · {w.radiusM} m · {fmtMoney(w.legPay)} USDC
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      {w.verified ? (
                        <>
                          {w.verified.offline && <Badge variant="secondary" className="text-amber-600">Offline</Badge>}
                          {w.verified.forced && <Badge variant="destructive">Forced</Badge>}
                          <Badge variant="verified">Verified</Badge>
                          <TxLink txHash={w.verified.txHash} />
                        </>
                      ) : w.state === 'next' ? (
                        <span className="text-xs text-primary">next · awaiting check-in</span>
                      ) : w.idx === lastIdx ? (
                        <span className="text-xs text-muted-foreground">{w.payNote}</span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Custody events</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>#</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Leg</TableHead>
                    <TableHead>Device · ledger time</TableHead>
                    <TableHead className="text-right">Pay</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{e.seq ?? '—'}</TableCell>
                      <TableCell className="text-xs font-medium">{KIND_NAME[e.kind] ?? e.kind}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.wp}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDateTime(e.deviceTime) || '—'} · {fmtDateTime(e.ledgerTime) || '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs">{e.amount ? fmtMoney(e.amount) : '—'}</TableCell>
                      <TableCell>
                        {e.txHash ? <TxLink txHash={e.txHash} /> : <Badge variant="secondary">{e.status}</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.events.length === 0 && (
                    <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">No events yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* --------------------------------------------------- ops column */}
        <div className="space-y-4">
          {data.advances.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Advances</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.advances.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border-b pb-2 text-xs last:border-0">
                    <span className="font-medium">{fmtMoney(a.amount)} USDC</span>
                    <Badge variant={a.status === 'claimed' || a.status === 'granted' ? 'verified' : ['declined', 'expired'].includes(a.status) ? 'secondary' : 'default'}>
                      {a.status}
                    </Badge>
                    <span className="text-muted-foreground">{fmtDateTime(a.expiresAt)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Ops actions</CardTitle></CardHeader>
            <CardContent>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Reason — anchored with every override (BR-07)</span>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. truck breakdown on A6" />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {moving && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => override('extend_window')}>Extend window</Button>
                    <Button size="sm" variant="outline" onClick={() => act('Force check-in', () => post(`/v1/trips/${id}/force-checkin`, { wp: data.nextWp, reason: reason || 'portal override' }))}>
                      Force check-in (wp {data.nextWp})
                    </Button>
                  </>
                )}
                {data.status === 'disputed' && (
                  <>
                    <Button size="sm" onClick={() => act('Resume trip', () => post(`/v1/trips/${id}/resolve`, { resolution: 'resume', reason: reason || 'resolved from portal' }))}>
                      Resolve — resume
                    </Button>
                    <Button size="sm" onClick={() => act('Release final pay', () => post(`/v1/trips/${id}/resolve`, { resolution: 'release', reason: reason || 'resolved from portal' }))}>
                      Resolve — release pay
                    </Button>
                  </>
                )}
                {['funded', 'accepted'].includes(data.status) && (
                  <Button size="sm" variant="destructive" onClick={() => act('Cancel trip', () => post(`/v1/trips/${id}/cancel`, { reason: reason || 'cancelled from portal' }))}>
                    Cancel trip
                  </Button>
                )}
                {['delivered', 'cancelled'].includes(data.status) && (
                  <Button size="sm" onClick={() => act('Close trip', () => post(`/v1/trips/${id}/close`))}>Close trip & refund escrow</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-xs text-muted-foreground">
              <p>Trip contract <span className="font-mono text-foreground">{data.contractId.slice(0, 16)}…</span></p>
              <p>Trip account funded {fmtMoney(data.escrow.funded)} USDC; advances capped at {fmtMoney(data.escrow.advanceLimit)} (BR-06)</p>
              <p>Created {fmtDateTime(data.createdAt)} · all fees paid by the platform's fee account</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
