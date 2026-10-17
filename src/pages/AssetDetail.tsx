import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApi, KIND_NAME, TxLink, AnchorLink, fmtMoney, fmtDateTime, hm, post, ErrorBox, explorerId } from '@/lib';
import type { AssetDetail as Detail } from '@/types';

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-xs">{value}</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, isLoading, mutate } = useApi<Detail>(id ? `/v1/assets/${id}` : null, 10000);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading && !data) return <p className="py-10 text-sm text-muted-foreground">Loading…</p>;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const activate = async () => {
    setMsg(null);
    setBusy(true);
    try {
      await post(`/v1/assets/${id}/activate`, { tag: data.tagId });
      await mutate();
      setMsg({ ok: true, text: 'Tag scan verified — asset is live (BR-01)' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Activation failed' });
    } finally {
      setBusy(false);
    }
  };

  const proofLink = async () => {
    setMsg(null);
    try {
      const r = await post<{ url: string; expiresAt: string }>(`/v1/assets/${id}/proof-links`, {});
      setMsg({ ok: true, text: `Proof link (expires ${fmtDateTime(r.expiresAt)}): ${r.url}` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs text-muted-foreground">
        <Link to="/assets" className="text-blue-600 hover:underline">Assets</Link> / {data.id}
      </p>
      <div className="mt-1 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">Serial {data.serial}</Badge>
            <Badge variant="secondary">NFC tag {data.tagId}</Badge>
            {data.status === 'active' ? <Badge variant="verified">Active</Badge> : <Badge className="border-amber-200 bg-amber-50 text-amber-600">Registered</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {data.status !== 'active' && (
            <Button onClick={activate} disabled={busy}>{busy ? 'Activating…' : 'Simulate tag scan & activate'}</Button>
          )}
          <Button variant="outline" onClick={proofLink}>Share proof link</Button>
        </div>
      </div>
      {msg && <p className={`mt-3 rounded-md px-3 py-2 text-xs ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>}

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[1fr_330px]">
        {/* ------------------------------------------------ custody trail */}
        <Card>
          <CardHeader>
            <CardTitle>Custody trail</CardTitle>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-600" /> On-ledger
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="10"><line x1="0" y1="5" x2="12" y2="5" stroke="#9aa0a6" strokeDasharray="2 2" /></svg>
                Live estimate
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {data.trail.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No custody events yet</p>}
            <ol className="relative space-y-6 border-l border-border pl-6">
              {data.trail.map((e) => (
                <li key={e.id} className="relative">
                  <span
                    className={`absolute -left-[31px] top-1 size-2.5 rounded-full border-2 border-white ${
                      e.status === 'confirmed' ? 'bg-blue-600' : e.status === 'failed' ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                  />
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold">{KIND_NAME[e.kind] ?? e.kind}</span>
                        {e.tripId && <a href={`/trips/${e.tripId}`} className="font-mono text-[11px] text-blue-600 hover:underline">{e.tripId}</a>}
                        {e.offline && <Badge variant="secondary" className="text-amber-600">Offline</Badge>}
                        {e.status !== 'confirmed' && <Badge variant="secondary">{e.status}</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.amount > 0 ? `leg ${e.wp} paid ${fmtMoney(e.amount)} USDC · ` : `waypoint ${e.wp} · `}by {e.actor}
                      </p>
                      <p className="mt-1 flex items-center gap-3">
                        <TxLink txHash={e.txHash} />
                        {e.hash && <AnchorLink label="(hash match)" href={`https://stellar.expert/explorer/testnet/tx/${e.txHash ?? ''}`} />}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {e.ledgerTime ? hm(e.ledgerTime) : fmtDateTime(e.receivedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* ------------------------------------------------- right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>On-chain identity</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-1.5 text-xs text-muted-foreground">Stellar contract</p>
              <CopyField value={data.onChain.contractId} />
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                One account per asset. Every custody event writes to it, so its full history is one lookup on any explorer.
              </p>
              <AnchorLink label="View on explorer →" href={explorerId(data.onChain.contractId)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent>
              {data.documents.length === 0 && <p className="text-xs text-muted-foreground">No documents hashed yet</p>}
              <ul className="space-y-2.5">
                {data.documents.map((d) => (
                  <li key={d.id} className="flex items-baseline justify-between gap-3">
                    <span className="text-xs">{d.name}</span>
                    <span className="shrink-0 text-[11px] text-blue-600">Hash on ledger · {fmtDateTime(d.anchoredAt).slice(0, 6)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Proof for auditors & insurers</CardTitle></CardHeader>
            <CardContent>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                A read-only link to this asset’s trail and the off-chain payloads behind each hash. Expires after 30 days, every view is logged.
              </p>
              <Button variant="dark" size="xl" className="mt-3 w-full" onClick={proofLink}>
                Create proof link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
