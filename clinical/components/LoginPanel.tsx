'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPanel() {
  const { token, sucursales, sucursalId, setAuth, setSucursalId, clearAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/login', { email, password });
      setAuth(
        response.data.token,
        response.data.id,
        response.data.sucursales || [],
        response.data.nombre || response.data.name,
        email
      );
    } catch (err) {
      setError('No se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-panel shadow-panel">
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Acceso</div>
          <h2 className="text-2xl">Doctor console</h2>
        </div>
        {token && (
          <button
            className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-ink-contrast"
            onClick={clearAuth}
          >
            Salir
          </button>
        )}
      </div>
      <div className="px-6 pb-6 grid gap-3">
        {!token && (
          <>
            <div>
              <label className="text-xs text-muted">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast focus:border-white/30 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Clave</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast focus:border-white/30 focus:outline-none"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="text-xs text-muted">{error}</div>}
            <button
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#041b14] disabled:opacity-60"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Ingresar'}
            </button>
          </>
        )}
        {token && (
          <>
            <div>
              <label className="text-xs text-muted">Sucursal activa</label>
              <select
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast focus:border-white/30 focus:outline-none"
                value={sucursalId ?? ''}
                onChange={(e) => setSucursalId(Number(e.target.value))}
              >
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.codigo || `Sucursal ${sucursal.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-muted">Token activo, listo para consumir servicios.</div>
          </>
        )}
      </div>
    </div>
  );
}
