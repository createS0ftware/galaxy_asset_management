import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useSWR, { type SWRResponse } from 'swr';
import {
  Truck,
  Route as RouteIcon,
  Package,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { api, post, getToken as _getToken, clearToken } from '@/api';
import type { Driver, PaymentsSummary, TripView } from '@/types';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ api */
export { api, post, clearToken };
export const getToken = _getToken;

export function useApi<T>(path: string | null, refreshMs = 8000) {
  return useSWR<T, Error>(path, api, {
    refreshInterval: refreshMs,
    keepPreviousData: true,
  }) as SWRResponse<T, Error> & { dataUpdatedAt: number };
}

/* ------------------------------------------------------------- helpers */
export const fmtMoney = (v: string | number | null | undefined) =>
  v === null || v === undefined ? '—' : `${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const hm = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

export const shortTx = (h: string | null | undefined, size = 6) => (h ? `${h.slice(0, size)}…${h.slice(-4)}` : '—');

export const explorerTx = (h: string) => `https://stellar.expert/explorer/testnet/tx/${h}`;
export const explorerId = (id: string) => `https://stellar.expert/explorer/testnet/contract/${id}`;

export const KIND_NAME: Record<number, string> = {
  1: 'Registered',
  2: 'Activated',
  3: 'Escrow funded',
  4: 'Pickup',
  5: 'Checked in',
  6: 'Arrived',
  7: 'Delivery',
  8: 'Dispute',
  9: 'Dispute resolved',
  10: 'Override',
  11: 'Forced check-in',
  12: 'Cancelled',
  13: 'Advance',
  14: 'Refund',
};

/* --------------------------------------------------------------- atoms */
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  in_transit: { label: 'On route', cls: 'bg-neutral-900 text-white' },
  funded: { label: 'On route', cls: 'bg-neutral-900 text-white' },
  accepted: { label: 'On route', cls: 'bg-neutral-900 text-white' },
  behind_schedule: { label: 'Behind schedule', cls: 'bg-card border text-foreground' },
  awaiting_signature: { label: 'Awaiting signature', cls: 'bg-card border text-foreground' },
  missed_waypoint: { label: 'Missed waypoint', cls: 'bg-red-600 text-white' },
  disputed: { label: 'Disputed', cls: 'bg-red-600 text-white' },
  delivered: { label: 'Delivered', cls: 'bg-card border text-foreground' },
  cancelled: { label: 'Cancelled', cls: 'bg-muted text-muted-foreground' },
  closed: { label: 'Closed', cls: 'bg-muted text-muted-foreground' },
};

export function StatusPill({ kind, label }: { kind: string; label?: string }) {
  const s = STATUS_MAP[kind] ?? { label: kind.replace(/_/g, ' '), cls: 'bg-muted text-muted-foreground' };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', s.cls)}>{label ?? s.label}</span>;
}

export function TxLink({ txHash, className }: { txHash: string | null | undefined; className?: string }) {
  if (!txHash) return null;
  return (
    <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className={cn('font-mono text-xs text-blue-600 hover:underline', className)}>
      {shortTx(txHash)}
    </a>
  );
}

export function AnchorLink({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-600 hover:underline">
      {label}
    </a>
  );
}

/** Legend used on route cards: solid = ledger, dashed = estimate (principle 5). */
export function RouteLegend() {
  return (
    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke="#2467e3" strokeWidth="2" /></svg>
        Verified on ledger
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke="#9aa0a6" strokeWidth="2" strokeDasharray="3 3" /></svg>
        Live GPS estimate
      </span>
    </div>
  );
}

/** Asterisk logo mark for sidebar / login. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex size-7 items-center justify-center rounded-lg bg-primary text-base font-bold text-white', className)}>S</span>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : String(error);
  return <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">⚠ {msg}</div>;
}

/* -- id-name lookup for board rows -- */
export function useNameMaps() {
  const { data: assets } = useApi<Array<{ id: string; name: string; serial: string }>>('/v1/assets', 0);
  const { data: drivers } = useApi<Driver[]>('/v1/drivers', 0);
  const assetName = (id: string) => assets?.find((a) => a.id === id)?.name ?? id;
  const driverName = (id: number) => drivers?.find((d) => d.id === id)?.name ?? `Driver #${id}`;
  return { assetName, driverName, assets, drivers };
}

export type { Driver, PaymentsSummary, TripView };
export { useNavigate, Link, Truck, RouteIcon, Package, Users, Wallet, type LucideIcon };
