import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Sucursal = {
  id: number;
  codigo?: string;
  direccion?: string;
};

type ClinicalState = {
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

export const useClinicalStore = create<ClinicalState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      userName: null,
      userEmail: null,
      sucursales: [],
      sucursalId: null,
      pacienteId: null,
      citaId: null,
      setAuth: (token, userId, sucursales, userName, userEmail) =>
        set((state) => ({
          token,
          userId,
          userName: userName ?? null,
          userEmail: userEmail ?? null,
          sucursales,
          sucursalId: state.sucursalId ?? sucursales[0]?.id ?? null,
        })),
      setSucursalId: (id) => set({ sucursalId: id }),
      setPacienteId: (id) => set({ pacienteId: id }),
      setCitaId: (id) => set({ citaId: id }),
      clearAuth: () =>
        set({ token: null, userId: null, userName: null, userEmail: null, sucursales: [], sucursalId: null }),
    }),
    {
      name: "clinical-auth",
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        userName: state.userName,
        userEmail: state.userEmail,
        sucursales: state.sucursales,
        sucursalId: state.sucursalId,
      }),
    }
  )
);
