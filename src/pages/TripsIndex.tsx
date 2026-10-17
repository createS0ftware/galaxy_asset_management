import { useNavigate } from 'react-router-dom';
import { Plus, PhoneCall, Clock, AlertTriangle, CheckCircle2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RouteMap, type MapWp } from '@/components/RouteMap';
import { useApi, useNameMaps, StatusPill, TxLink, RouteLegend, fmtMoney, fmtTime, hm, ErrorBox } from '@/lib';
import type { TripsBoard as Board, TripView } from '@/types';

const CARD_TITLES: Record<string, { label: string; icon: typeof AlertTriangle; cls: string }> = {
  missed_waypoint: { label: 'Missed waypoint', icon: AlertTriangle, cls: 'text-red-600' },
  advance_request: { label: 'Advance request', icon: PenLine, cls: 'text-foreground' },
  signature_overdue: { label: 'Signature overdue', icon: PenLine, cls: 'text-foreground' },
  behind_schedule: { label: 'Behind schedule', icon: Clock, cls: 'text-foreground' },
  disputed: { label: 'Disputed', icon: AlertTriangle, cls: 'text-red-600' },
};

const ACTION_BUTTONS: Record<string, { label: string; icon?: typeof PhoneCall; variant: 'outline' | 'default' | 'secondary' }> = {
  call_driver: { label: 'Call driver', icon: PhoneCall, variant: 'outline' },
  extend_window: { label: 'Extend window', variant: 'outline' },
  force_checkin: { label: 'Force check-in', variant: 'outline' },
  remind_receiver: { label: 'Remind receiver', variant: 'outline' },
  approve: { label: 'Approve', variant: 'default' },
  decline: { label: 'Decline', variant: 'outline' },
  resolve: { label: 'Resolve', variant: 'default' },
};

export default function TripsIndex() {
  const { data, error, isLoading, dataUpdatedAt } = useApi<Board>('/v1/trips', 5000);
  const { assetName, driverName } = useNameMaps();
  const nav = useNavigate();

  const active = data?.trips ?? [];
  // The board map shows the first moving trip, like the mock.
  const featured = active.find((t) => ['in_transit', 'funded', 'accepted', 'missed_waypoint', 'behind_schedule'].includes(t.status)) ?? active[0];
  const { data: featuredTrip } = useApi<TripView>(featured ? `/v1/trips/${featured.id}` : null, 5000);

  if (error) return <ErrorBox error={error} />;

  const mapWps =
    featuredTrip?.waypoints.map((w) => ({
      name: w.name,
      sub: w.verified ? hm(w.verified.ledgerTime) : w.state === 'next' ? 'live' : hm(w.windowStart),
      lat: w.lat,
      lon: w.lon,
    state: (w.state === 'verified' ? 'verified' : w.state === 'next' ? 'next' : 'remaining') as MapWp['state'],
    })) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ------------------------------------------------------- header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-page-title">Trips</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {active.filter((t) => !['delivered', 'cancelled'].includes(t.status)).length} active · updated{' '}
            {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden md:block">
            <RouteLegend />
          </div>
          <Button variant="dark" onClick={() => nav('/routes/new')} className="w-full sm:w-auto">
            <Plus className="size-4" /> Plan a route
          </Button>
        </div>
      </div>

      {/* ------------------------------------------- map + needs attention */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_350px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              {featuredTrip ? (
                <>
                  <span className="font-mono">{featuredTrip.id}</span> · {featuredTrip.waypoints[0]?.name} →{' '}
                  {featuredTrip.waypoints.at(-1)?.name}
                </>
              ) : (
                'Route overview'
              )}
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">Schematic · map provider TBD</span>
          </CardHeader>
          <CardContent>
            {featuredTrip?.live && (
              <p className="mb-2 text-[11px] text-blue-600">
                Kwame A. · live — dashed line to the next waypoint is a GPS estimate, not a ledger check-in
              </p>
            )}
            <RouteMap wps={mapWps} live={featuredTrip?.live ? { lat: featuredTrip.live.lat, lon: featuredTrip.live.lon, label: 'Kwame A. · live' } : null} className="min-h-56 sm:min-h-[300px]" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Needs attention · {data?.attention.length ?? 0}</h2>
          {isLoading && !data && <div className="text-xs text-muted-foreground">Loading…</div>}
          {!isLoading && (data?.attention.length ?? 0) === 0 && (
            <Card>
              <CardContent className="flex items-center gap-2 pt-5 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" /> Nothing needs attention
              </CardContent>
            </Card>
          )}
          {data?.attention.map((a, i) => {
            const meta = CARD_TITLES[a.kind] ?? { label: a.kind, icon: PenLine, cls: 'text-foreground' };
            return (
              <Card key={i} className="@container">
                <CardHeader className="items-start">
                  <div>
                    <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${meta.cls}`}>
                      <meta.icon className="size-3.5" /> {meta.label}
                    </span>
                  </div>
                  <a href={`/trips/${a.tripId}`} className="font-mono text-[11px] text-muted-foreground hover:text-blue-600">
                    {a.tripId}
                  </a>
                </CardHeader>
                <CardContent>
                  <p className="text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.actions
                      .filter((x) => x !== 'call_driver' || a.kind === 'missed_waypoint')
                      .map((act) => {
                        const btn = ACTION_BUTTONS[act] ?? { label: act, variant: 'outline' as const };
                        return (
                          <Button key={act} size="sm" variant={btn.variant} onClick={() => nav(`/trips/${a.tripId}`)}>
                            {btn.icon && <btn.icon className="size-3.5" />}
                            {btn.label}
                          </Button>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------ active trips table */}
      {/* Mobile: compact cards (responsive-tables pattern); Desktop: full table */}
      <div className="space-y-3 md:hidden">
        {active.map((t) => (
          <Card key={t.id} className="@container cursor-pointer" onClick={() => nav(`/trips/${t.id}`)}>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-medium">{t.id}</span>
                <StatusPill kind={t.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 [&_dd]:text-xs [&_dt]:text-[10px] uppercase tracking-wide text-muted-foreground [&_dd]:font-medium [&_dt]:block">
                <div>
                  <dt>Asset</dt>
                  <dd>
                    <a href={`/assets/${t.assetId}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">
                      {assetName(t.assetId)}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Driver</dt>
                  <dd>{driverName(t.driverId)}</dd>
                </div>
                <div>
                  <dt>Next waypoint</dt>
                  <dd>{t.next ? `${t.next.name} · ${fmtTime(t.next.windowStart)}` : '—'}</dd>
                </div>
                <div>
                  <dt>Escrow left</dt>
                  <dd>{fmtMoney(t.escrowLeft)} USDC</dd>
                </div>
              </div>
              {t.lastVerified && (
                <div className="text-[11px] text-muted-foreground">
                  Last verified wp {t.lastVerified.wp} · {fmtTime(t.lastVerified.at)} · <TxLink txHash={t.lastVerified.txHash} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="hidden md:block">
        <Table className="min-w-[768px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Trip</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Last verified</TableHead>
              <TableHead>Next waypoint</TableHead>
              <TableHead>Escrow left</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => nav(`/trips/${t.id}`)}>
                <TableCell className="font-mono text-xs font-medium">{t.id}</TableCell>
                <TableCell>
                  <a href={`/assets/${t.assetId}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">
                    {assetName(t.assetId)}
                  </a>
                </TableCell>
                <TableCell className="text-muted-foreground">{driverName(t.driverId)}</TableCell>
                <TableCell>
                  {t.lastVerified ? (
                    <div className="leading-tight">
                      <span className="text-xs">wp {t.lastVerified.wp} · {fmtTime(t.lastVerified.at)}</span>
                      <div><TxLink txHash={t.lastVerified.txHash} /></div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {t.next ? (
                    <div className="text-xs leading-tight">
                      {t.next.name} · ETA {fmtTime(t.next.windowStart)}
                    </div>
                  ) : t.status === 'delivered' ? (
                    <span className="text-xs text-muted-foreground">Delivered</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">{fmtMoney(t.escrowLeft)} USDC</TableCell>
                <TableCell>
                  <StatusPill kind={t.status} />
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && active.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                  No active trips — <a href="/routes/new" className="text-blue-600 hover:underline">plan a route</a>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
