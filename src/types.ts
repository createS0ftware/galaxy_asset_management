/** Shared API types — mirror the backend's service return shapes. */

export type TripStatus =
  | 'funded'
  | 'accepted'
  | 'in_transit'
  | 'awaiting_signature'
  | 'disputed'
  | 'delivered'
  | 'cancelled'
  | 'closed'
  | 'missed_waypoint'
  | 'behind_schedule';

export interface BoardRow {
  id: string;
  assetId: string;
  driverId: number;
  status: string;
  lastVerified: { wp: number; txHash: string; at: string | null } | null;
  next: { idx: number; name: string; windowStart: string; windowEnd: string } | null;
  escrowLeft: string;
}

export interface AttentionItem {
  tripId: string;
  kind: string;
  detail: string;
  actions: string[];
}

export interface TripsBoard {
  trips: BoardRow[];
  attention: AttentionItem[];
}

export interface WaypointView {
  idx: number;
  name: string;
  type: 'pickup' | 'checkpoint' | 'delivery';
  lat: number;
  lon: number;
  radiusM: number;
  windowStart: string;
  windowEnd: string;
  legPay: string;
  payNote?: string;
  state: 'verified' | 'next' | 'pending' | 'remaining';
  verified: { txHash: string; ledgerTime: string | null; deviceTime: string | null; offline: boolean; forced: boolean } | null;
}

export interface CustodyEvent {
  id: number;
  assetId: string;
  tripId: string | null;
  kind: number;
  wp: number;
  hash: string;
  amount: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  txHash: string | null;
  ledgerTime: string | null;
  deviceTime: string | null;
  receivedAt: string;
  offline: boolean;
  actor: string;
  seq: number | null;
}

export interface TripView {
  id: string;
  status: string;
  asset: { id: string; name: string; serial: string } | null;
  driver: { id: number; name: string; address: string | null } | null;
  vehicle: string | null;
  escrow: { funded: string; released: string; advances: string; left: string; advanceLimit: string; funded_badge: boolean };
  nextWp: number;
  waypoints: WaypointView[];
  live: { lat: number; lon: number; accM: number; at: string; estimate: true } | null;
  advances: { id: number; amount: string; status: string; reason: string | null; expiresAt: string | null }[];
  events: CustodyEvent[];
  trackingUrl: string;
  contractId: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  serial: string;
  value: string | null;
  tagId: string;
  status: 'registered' | 'active';
  regHash: string;
  tagHash: string | null;
  createdAt: string;
}

export interface AssetDetail extends Asset {
  onChain: { contractId: string; assetKey: string; sponsorship: string };
  documents: { id: number; name: string; sha256: string; anchoredAt: string }[];
  trail: CustodyEvent[];
}

export interface Driver {
  id: number;
  phone: string;
  name: string;
  publicKey: string | null;
  walletStatus: 'none' | 'pending' | 'ready';
  momoNumber: string | null;
  createdAt: string;
}

export interface PaymentsSummary {
  treasury: { address: string; usdc: string };
  escrowHeld: string;
  feeAccount: { address: string; xlm: string; alertThreshold: number; alert: boolean };
  escrowByTrip: { trip: string; status: string; funded: string; released: string; advances: string; left: string }[];
  advanceRequests: { id: number; tripId: string; amount: string; status: string; reason: string | null; createdAt: string }[];
  recentPayouts: { trip: string | null; event: string; wp: number; amount: string; txHash: string | null; at: string | null }[];
}

export interface VerifyReport {
  asset: string;
  contractId: string;
  dataSource: string;
  summary: string;
  matched: number;
  total: number;
  flagCount: number;
  chain: { head: string; seq: number; intact: boolean };
  flags: { seq: number; type: string; detail: string }[];
  rows: {
    seq: number;
    event: string;
    trip: string | null;
    place: string | null;
    deviceTime: string | null;
    ledgerTime: string | null;
    signers: string[];
    payloadHash: string | null;
    onChainHash: string;
    result: 'Match' | 'Mismatch' | 'Missing';
    txHash: string | null;
  }[];
}
