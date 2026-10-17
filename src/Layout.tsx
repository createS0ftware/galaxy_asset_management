import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Truck, RouteIcon, Package, Users, Wallet, LogoMark, clearToken } from '@/lib';

const NAV = [
  { to: '/', label: 'Trips', icon: Truck, end: true },
  { to: '/routes/new', label: 'Routes', icon: RouteIcon },
  { to: '/assets', label: 'Assets', icon: Package },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/payments', label: 'Payments', icon: Wallet },
];

function SidebarContent() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('sat.user') ?? '{"name":"Ops Admin","role":"Operations"}');
  return (
    <>
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
          className="mt-3 min-h-9 text-[11px] text-white/40 hover:text-white/80"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex min-h-dvh">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="-ml-1.5 p-2 text-foreground"
        >
          <Menu className="size-5" />
        </button>
        <LogoMark className="size-6 text-xs" />
        <span className="text-sm font-semibold tracking-tight">Galaxy Asset Portal</span>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col bg-sidebar text-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute left-0 top-0 flex h-dvh w-64 flex-col bg-sidebar text-white shadow-2xl transition-transform duration-200 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="absolute right-3 top-5 p-1.5 text-white/50 hover:text-white"
          >
            <X className="size-4" />
          </button>
          <SidebarContent />
        </aside>
      </div>

      <main className="min-w-0 flex-1 px-4 pb-10 pt-[4.5rem] sm:px-6 lg:px-8 lg:pb-7 lg:pt-7">
        <Outlet />
      </main>
    </div>
  );
}
