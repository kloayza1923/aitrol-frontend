"use client";

import { createContext, useContext } from "react";
import { useClinicalStore } from "@/store/clinicalStore";
import type { Sucursal } from "@/store/clinicalStore";

type AuthContextValue = {
  token: string | null;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  sucursales: Sucursal[];
  sucursalId: number | null;
  pacienteId: number | null;
  citaId: number | null;
  setAuth: (token: string, userId: number, sucursales: Sucursal[], userName?: string, userEmail?: string) => void;
  setSucursalId: (id: number | null) => void;
  setPacienteId: (id: number | null) => void;
  setCitaId: (id: number | null) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useClinicalStore();
  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
