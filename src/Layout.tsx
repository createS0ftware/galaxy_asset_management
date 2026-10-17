import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Truck, RouteIcon, Package, Users, Wallet, LogoMark, clearToken } from '@/lib';

const NAV = [
  { to: '/', label: 'Trips', icon: Truck, end: true },
  { to: '/routes/new', label: 'Routes', icon: RouteIcon },
  { to: '/assets', label: 'Assets', icon: Package },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/payments', label: 'Payments', icon: Wallet },
];

export default function Layout() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('sat.user') ?? '{"name":"Ops Admin","role":"Operations"}');
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-sidebar text-white">
        <div className="flex items-center gap-2.5 px-4 pb-6 pt-5">
          <LogoMark className="size-8 text-[15px]" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Galaxy Asset Portal</div>
            <div className="text-[10px] text-white/45">Custody · proof · pay</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 px-2.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'
                }`
              }
            >
              <Icon className="size-4" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border px-4 py-4">
          <div className="text-[13px] font-medium">{user.name}</div>
          <div className="text-[11px] text-white/45">{user.role ?? 'Operations'}</div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/45">
            <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
            Stellar · testnet
          </div>
          <button
            onClick={() => {
              clearToken();
              nav('/login');
            }}
            className="mt-3 text-[11px] text-white/40 hover:text-white/80"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-7">
        <Outlet />
      </main>
    </div>
  );
}
