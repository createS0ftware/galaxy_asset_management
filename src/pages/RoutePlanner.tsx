import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RouteMap } from '@/components/RouteMap';
import { useApi, fmtMoney, ErrorBox, post } from '@/lib';
import type { Asset, Driver } from '@/types';

interface Wp {
  name: string;
  lat: string;
  lon: string;
  radiusM: string;
  windowStart: string;
  windowEnd: string;
  legPay: string;
}

const todayAt = (h: number) => {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const newWp = (): Wp => ({ name: '', lat: '', lon: '', radiusM: '', windowStart: todayAt(9), windowEnd: todayAt(10), legPay: '' });

const wpType = (idx: number, total: number) => (idx === 0 ? 'Pickup' : idx === total - 1 ? 'Delivery' : 'Checkpoint');
const fmtWindow = (w: Wp) => `${w.windowStart.slice(11, 16)}–${w.windowEnd.slice(11, 16)}`;

export default function RoutePlanner() {
  const { data: assets } = useApi<Asset[]>('/v1/assets', 0);
  const { data: drivers } = useApi<Driver[]>('/v1/drivers', 0);
  const { data: payments } = useApi<{ treasury: { usdc: string } }>('/v1/payments/summary', 0);
  const nav = useNavigate();

  const [tripId, setTripId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('+233 ');
  const [receiverName, setReceiverName] = useState('');
  const [advanceLimit, setAdvanceLimit] = useState('40.00');
  const [wps, setWps] = useState<Wp[]>([newWp(), newWp(), newWp()]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const setWp = (i: number, patch: Partial<Wp>) => setWps((prev) => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  const addWp = () => setWps((p) => [...p.slice(0, -1), newWp(), newWp()]);
  const dropLast = () => setWps((p) => (p.length > 2 ? p.slice(0, -1) : p));

  const legTotal = wps.reduce((a, w) => a + (Number(w.legPay) || 0), 0);
  const finalLeg = Number(wps.at(-1)?.legPay ?? 0) || 0;
  const paidAtCheckins = legTotal - finalLeg;
  const escrow = legTotal + (Number(advanceLimit) || 0);
  const treasury = Number(payments?.treasury.usdc ?? 0);
  const canDispatch = !!assetId && !!driverId && wps.length >= 2 && Number(wps.at(-1)?.lat) && Number(wps.at(-1)?.lon) && wps[0].name !== '';

  const preview = useMemo(
    () =>
      wps.map((w, i) => {
        const lat = Number(w.lat);
        const lon = Number(w.lon);
        const ok = Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0) && w.lat !== '' && w.lon !== '';
        // fall back to an evenly spread curve so the preview still draws while typing
        const fx = ok ? lat : 5.6 + i * 0.4;
        const fy = ok ? lon : -0.2 - i * 0.35;
        return {
          lat: fx,
          lon: fy,
          name: w.name || wpType(i, wps.length),
          state: 'planned' as const,
          radiusM: Number(w.radiusM) || undefined,
          sub: fmtWindow(w),
        };
      }),
    [wps],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await post<{ trip: { id: string } }>('/v1/trips', {
        id: tripId.trim() || undefined,
        assetId: assetId.trim(),
        driverId: Number(driverId),
        vehicle: vehicle || undefined,
        advanceLimit: String(Number(advanceLimit) || 0),
        receiver: { phone: receiverPhone.replace(/\s/g, ''), name: receiverName || undefined },
        waypoints: wps.map((w, i) => ({
          name: w.name || wpType(i, wps.length),
          type: i === 0 ? 'pickup' : i === wps.length - 1 ? 'delivery' : 'checkpoint',
          lat: Number(w.lat) || preview[i].lat,
          lon: Number(w.lon) || preview[i].lon,
          radiusM: w.radiusM ? Number(w.radiusM) : undefined,
          windowStart: new Date(w.windowStart).toISOString(),
          windowEnd: new Date(w.windowEnd).toISOString(),
          legPay: String(Number(w.legPay) || 0),
        })),
      });
      nav(`/trips/${res.trip.id}`);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Failed to fund trip');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs text-muted-foreground">
        <Link to="/" className="text-blue-600 hover:underline">Trips</Link> / New trip
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-page-title">Plan route {tripId.trim() ? `· ${tripId}` : ''}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Draft. Nothing is on the ledger until you fund and dispatch.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
          <Button variant="dark" onClick={() => setNote('Drafts aren’t stored in this demo — fund and dispatch to create the trip.')}>
            Save draft
          </Button>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ------------------------------------------------------- left */}
          <div className="min-w-0 space-y-4">
            <Card>
              <CardHeader><CardTitle>Trip details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">Asset</span>
                  <Select required value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                    <option value="">Select an asset</option>
                    {assets?.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.status !== 'active'}>
                        {a.name} {a.id} {a.status === 'active' ? '· tag active' : '· not activated'}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">Driver</span>
                  <Select required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                    <option value="">Select a driver</option>
                    {drivers?.map((d) => (
                      <option key={d.id} value={d.id} disabled={d.walletStatus !== 'ready'}>
                        {d.name} · wallet {d.walletStatus}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">Vehicle</span>
                  <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="GT 4471-24" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">Receiver’s phone (gets the tracking link)</span>
                  <Input required value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
                  <Input className="mt-2" placeholder="Receiver name (optional)" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Waypoints & pay per leg</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addWp}>
                  <Plus className="size-3.5" /> Add waypoint
                </Button>
              </CardHeader>
              <CardContent>
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Waypoint</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Geofence</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Leg pay</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wps.map((w, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <Input value={w.name} onChange={(e) => setWp(i, { name: e.target.value })} placeholder={wpType(i, wps.length)} className="h-8" />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{wpType(i, wps.length)}</TableCell>
                        <TableCell>
                          <Input type="number" value={w.radiusM} onChange={(e) => setWp(i, { radiusM: e.target.value })} placeholder="auto" className="h-8 w-20" />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1">
                            <Input type="datetime-local" required value={w.windowStart} onChange={(e) => setWp(i, { windowStart: e.target.value })} className="h-8 w-full text-xs sm:w-36" />
                            {/* end shares the second slot visually */}
                            <Input type="datetime-local" required value={w.windowEnd} onChange={(e) => setWp(i, { windowEnd: e.target.value })} className="h-8 w-full text-xs sm:w-36" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" min="0" value={w.legPay} onChange={(e) => setWp(i, { legPay: e.target.value })} placeholder="—" className="h-8 w-full sm:w-20" />
                        </TableCell>
                        <TableCell>
                          {wps.length > 2 && i !== 0 && i !== wps.length - 1 && (
                            <button type="button" onClick={() => setWps((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-600">
                              ×
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {wps.length > 2 && (
                  <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={dropLast}>
                    − Remove last waypoint
                  </Button>
                )}
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Each check-in pays its leg in the same Stellar transaction that records the location hash. The final leg is paid by
                  the delivery escrow contract. Amounts in USDC.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ------------------------------------------------------ right */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Route preview</CardTitle>
                <CardDescription>Geofences to scale</CardDescription>
              </CardHeader>
              <CardContent>
                <RouteMap wps={preview} geofences className="min-h-[220px]" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Fund the trip</CardTitle></CardHeader>
              <CardContent className="space-y-0 text-sm">
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Paid at check-ins</span>
                  <span className="font-medium">{fmtMoney(paidAtCheckins)} USDC</span>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    Final leg, locked in the delivery contract
                  </span>
                  <span className="font-medium">{fmtMoney(finalLeg)} USDC</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Contract deadline</span>
                  <Select defaultValue="24" className="h-8 w-36 text-xs" onChange={() => undefined}>
                    <option value="12">[N] 12 h after arrival</option>
                    <option value="24">[N] 24 h after arrival</option>
                    <option value="48">[N] 48 h after arrival</option>
                  </Select>
                </div>
                <label className="block py-2">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Fuel advance limit</span>
                  <Input type="number" step="0.01" min="0" value={advanceLimit} onChange={(e) => setAdvanceLimit(e.target.value)} className="h-9" />
                </label>

                <div className="mt-2 border-t pt-3">
                  <div className="text-xs text-muted-foreground">Escrow to fund</div>
                  <div className="text-lg font-bold text-primary">{fmtMoney(escrow)} <span className="text-xs font-medium">USDC</span></div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Treasury available {fmtMoney(treasury)} USDC
                  </div>
                </div>

                <label className="mt-3 flex items-start gap-2 text-[11px] leading-snug text-muted-foreground">
                  <span className="mt-0.5 inline-flex size-3.5 items-center justify-center rounded-[4px] bg-primary text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" className="size-2.5" /></svg>
                  </span>
                  Anchor the route-plan hash on Stellar when dispatched
                </label>

                {err && <ErrorBox error={err} />}
                <div className="mt-3 space-y-2">
                  <Button type="submit" size="xl" disabled={busy || !canDispatch} className="h-10 w-full">
                    {busy ? 'Funding escrow…' : 'Fund escrow and dispatch'}
                  </Button>
                  {escrow > treasury && (
                    <p className="text-[11px] text-red-600">Escrow ({fmtMoney(escrow)}) exceeds the treasury balance — dispatch is blocked (BR-02).</p>
                  )}
                </div>
                <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">
                  The driver can’t accept until escrow is funded. The final leg sits in the delivery contract; it pays when the receiver
                  approves, or after the deadline if no dispute is raised. Unused funds return to treasury. Network fees are paid by the
                  platform’s fee account.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
