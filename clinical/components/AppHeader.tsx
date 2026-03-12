'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';
import ThemeSettings from './ThemeSettings';
import { APP_LOGO_URL, APP_NAME } from '@/lib/constants';

export default function AppHeader() {
  const router = useRouter();
  const { userName, userEmail, sucursales, sucursalId, setSucursalId, clearAuth } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const sucursalActual = sucursales.find((s) => s.id === sucursalId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : userEmail?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-panel/90 border-b border-border">
      <div className="px-5 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20 cursor-pointer overflow-hidden"
                onClick={() => router.push('/')}
              >
                {APP_LOGO_URL ? (
                  <Image
                    src={APP_LOGO_URL}
                    alt={APP_NAME}
                    width={36}
                    height={36}
                  />
                ) : (
                  <svg
                    className="w-5 h-5 text-[#041b14]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                )}
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push('/')}
              >
                <span className="text-lg font-semibold text-ink-contrast tracking-tight">
                  {APP_NAME}
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <a
                href="/consulta"
                className="px-4 py-2 rounded-lg text-sm font-medium text-ink-contrast bg-panel-2 hover:bg-border transition-colors"
              >
                Consulta
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSettings />

            {sucursales.length > 1 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel-2 border border-border">
                <svg
                  className="w-4 h-4 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <select
                  className="bg-transparent text-sm text-ink-contrast cursor-pointer focus:outline-none"
                  value={sucursalId ?? ''}
                  onChange={(e) => setSucursalId(Number(e.target.value))}
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id} className="bg-ink text-ink-contrast">
                      {s.codigo || `Sucursal ${s.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sucursales.length === 1 && sucursalActual && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel-2 border border-border">
                <svg
                  className="w-4 h-4 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="text-sm text-ink-contrast">
                  {sucursalActual.codigo || `Sucursal ${sucursalActual.id}`}
                </span>
              </div>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-border transition-colors group"
              >
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-ink-contrast">
                    {userName || 'Usuario'}
                  </div>
                  <div className="text-xs text-muted">{userEmail}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/20 flex items-center justify-center group-hover:border-accent/40 transition-colors">
                  <span className="text-sm font-bold text-accent">{initials}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-muted transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-panel shadow-panel overflow-hidden animate-rise">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-sm font-medium text-ink-contrast">
                      {userName || 'Usuario'}
                    </div>
                    <div className="text-xs text-muted">{userEmail}</div>
                  </div>

                  {sucursales.length > 1 && (
                    <div className="px-4 py-3 border-b border-white/5 sm:hidden">
                      <label className="text-xs text-muted">Sucursal</label>
                      <select
                        className="mt-1 w-full bg-ink-2 border border-border rounded-lg px-3 py-2 text-sm text-ink-contrast focus:outline-none focus:border-muted"
                        value={sucursalId ?? ''}
                        onChange={(e) => setSucursalId(Number(e.target.value))}
                      >
                        {sucursales.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.codigo || `Sucursal ${s.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
