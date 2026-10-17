import { cn } from '@/lib/utils';

export interface MapWp {
  name?: string;
  sub?: string;
  lat: number;
  lon: number;
  state: 'verified' | 'next' | 'remaining' | 'planned';
  radiusM?: number;
}

const W = 660;
const H = 360;
const PAD = 56;

/**
 * Schematic route map (as in the mock: "schematic · map provider TBD").
 * Solid blue = verified on ledger, dashed blue = estimate to the next waypoint,
 * light dashed gray = remaining route. Orange ring marks the next stop, orange dot = live GPS.
 */
export function RouteMap({
  wps,
  live,
  geofences = false,
  className,
}: {
  wps: MapWp[];
  live?: { lat: number; lon: number; label?: string } | null;
  geofences?: boolean;
  className?: string;
}) {
  const pts = wps.filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lon));
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const minLat = Math.min(...lats, live?.lat ?? Infinity);
  const maxLat = Math.max(...lats, live?.lat ?? -Infinity);
  const minLon = Math.min(...lons, live?.lon ?? Infinity);
  const maxLon = Math.max(...lons, live?.lon ?? -Infinity);
  const spanLat = Math.max(maxLat - minLat, 0.0001);
  const spanLon = Math.max(maxLon - minLon, 0.0001);

  const xy = (lat: number, lon: number): [number, number] => [
    PAD + ((lon - minLon) / spanLon) * (W - 2 * PAD),
    H - PAD - ((lat - minLat) / spanLat) * (H - 2 * PAD),
  ];
  const p = pts.map((w) => ({ ...w, x: xy(w.lat, w.lon)[0], y: xy(w.lat, w.lon)[1] }));
  const liveXY = live ? xy(live.lat, live.lon) : null;

  const maxR = Math.max(...pts.map((w) => w.radiusM ?? 0), 300);

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-border bg-[#faf9f7]', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {/* faint grid */}
        <defs>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e8e6e1" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#map-grid)" />

        {/* geofence halos (planner preview) */}
        {geofences &&
          p.map(
            (w, i) =>
              w.radiusM != null && (
                <circle key={`g${i}`} cx={w.x} cy={w.y} r={Math.max(14, Math.min(46, (w.radiusM / maxR) * 52))} fill="none" stroke="#c2410c" strokeDasharray="3 3" strokeWidth="1.2" opacity="0.55" />
              ),
          )}

        {/* segments */}
        {p.slice(0, -1).map((a, i) => {
          const b = p[i + 1];
          const solid = a.state === 'verified' && (b.state === 'verified' || b.state === 'next');
          const dashedEstimate = (a.state === 'verified' && b.state === 'next') || (a.state === 'next' && b.state !== 'verified');
          const stroke = solid ? '#2467e3' : dashedEstimate ? '#4b90f7' : '#c9c6c0';
          const dash = solid ? undefined : '4 4';
          const opacity = solid ? 1 : dashedEstimate ? 0.9 : 0.8;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth="2" strokeDasharray={dash} opacity={opacity} />;
        })}

        {/* live position */}
        {liveXY && (
          <g>
            <circle cx={liveXY[0]} cy={liveXY[1]} r="9" fill="#2f6df6" opacity="0.15" />
            <circle cx={liveXY[0]} cy={liveXY[1]} r="4" fill="#2f6df6" stroke="#fff" strokeWidth="1.5" />
            <text x={liveXY[0]} y={liveXY[1] - 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#2f6df6">
              {live?.label ?? 'Live'}
            </text>
          </g>
        )}

        {/* waypoints */}
        {p.map((w, i) => {
          const nearRight = w.x > W - 90;
          const anchor = nearRight ? 'end' : 'middle';
          const dx = nearRight ? -8 : 0;
          return (
            <g key={i}>
              {w.state === 'verified' ? (
                <circle cx={w.x} cy={w.y} r="6" fill="#2467e3" stroke="#fff" strokeWidth="2" />
              ) : w.state === 'next' ? (
                <>
                  <circle cx={w.x} cy={w.y} r="16" fill="#c2410c" opacity="0.14" />
                  <circle cx={w.x} cy={w.y} r="5.5" fill="#c2410c" stroke="#fff" strokeWidth="2" />
                </>
              ) : (
                <circle cx={w.x} cy={w.y} r="5" fill="#fff" stroke="#b6b2aa" strokeWidth="1.6" />
              )}
              {w.name && (
                <>
                  <text x={w.x + dx} y={w.y - 14} textAnchor={anchor} fontSize="11.5" fontWeight="600" fill="#3d4046">
                    {w.name}
                  </text>
                  {w.sub && (
                    <text x={w.x + dx} y={w.y - 2} textAnchor={anchor} fontSize="9.5" fill="#8a8d93" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                      {w.sub}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
