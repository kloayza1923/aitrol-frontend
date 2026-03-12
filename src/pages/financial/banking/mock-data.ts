// src/pages/financial/banking/mock-data.ts

export type EstadoCheque = 'PENDIENTE' | 'COBRADO' | 'ANULADO' | 'PROTESTADO';
export type TipoMovimiento = 'INGRESO' | 'EGRESO';

export interface CuentaBancaria {
  id: number;
  banco: string;
  numeroCuenta: string;
  tipo: 'CORRIENTE' | 'AHORROS';
  moneda: string;
  saldo: number;
  titular: string;
  logo: string; // URL o clase de icono
  color: string; // Para estilizar la tarjeta
}

export interface MovimientoBancario {
  id: number;
  cuentaId: number;
  fecha: string;
  descripcion: string;
  referencia: string;
  tipo: TipoMovimiento;
  monto: number;
  saldoPosterior: number;
}

export interface Cheque {
  id: number;
  numero: string;
  banco: string;
  beneficiario: string;
  fechaEmision: string;
  fechaCobro: string; // Fecha efectiva
  monto: number;
  estado: EstadoCheque;
  tipo: 'EMITIDO' | 'RECIBIDO';
}

// --- DATOS FALSOS ---

export const MOCK_CUENTAS: CuentaBancaria[] = [
  {
    id: 1,
    banco: 'Banco Pichincha',
    numeroCuenta: '2100456789',
    tipo: 'CORRIENTE',
    moneda: 'USD',
    saldo: 15420.5,
    titular: 'Horizon ERP S.A.',
    logo: 'BP',
    color: 'bg-yellow-400 text-yellow-900'
  },
  {
    id: 2,
    banco: 'Banco de Guayaquil',
    numeroCuenta: '1450098231',
    tipo: 'CORRIENTE',
    moneda: 'USD',
    saldo: 8300.0,
    titular: 'Horizon ERP S.A.',
    logo: 'BG',
    color: 'bg-magenta-600 text-white' // Ajustar color real
  },
  {
    id: 3,
    banco: 'Produbanco',
    numeroCuenta: '1200054321',
    tipo: 'AHORROS',
    moneda: 'USD',
    saldo: 45000.75,
    titular: 'Fondo de Reserva',
    logo: 'PR',
    color: 'bg-blue-600 text-white'
  }
];

export const MOCK_MOVIMIENTOS: MovimientoBancario[] = [
  {
    id: 1,
    cuentaId: 1,
    fecha: '2023-12-28',
    descripcion: 'Pago Factura #9901 Cliente X',
    referencia: 'TRF-998877',
    tipo: 'INGRESO',
    monto: 1200.0,
    saldoPosterior: 15420.5
  },
  {
    id: 2,
    cuentaId: 1,
    fecha: '2023-12-27',
    descripcion: 'Pago Nómina Diciembre',
    referencia: 'NOM-001',
    tipo: 'EGRESO',
    monto: 3500.0,
    saldoPosterior: 14220.5
  },
  {
    id: 3,
    cuentaId: 2,
    fecha: '2023-12-26',
    descripcion: 'Transferencia entre cuentas',
    referencia: 'TRF-INT-01',
    tipo: 'INGRESO',
    monto: 5000.0,
    saldoPosterior: 8300.0
  },
  {
    id: 4,
    cuentaId: 1,
    fecha: '2023-12-25',
    descripcion: 'Pago Servicios Básicos',
    referencia: 'DEB-AUTO',
    tipo: 'EGRESO',
    monto: 150.25,
    saldoPosterior: 9220.5
  },
  {
    id: 5,
    cuentaId: 3,
    fecha: '2023-12-20',
    descripcion: 'Intereses Ganados',
    referencia: 'NC-INT',
    tipo: 'INGRESO',
    monto: 45.0,
    saldoPosterior: 45000.75
  }
];

export const MOCK_CHEQUES: Cheque[] = [
  {
    id: 101,
    numero: '000456',
    banco: 'Banco Pichincha',
    beneficiario: 'Proveedor ABC Corp',
    fechaEmision: '2023-12-01',
    fechaCobro: '2023-12-15',
    monto: 2500.0,
    estado: 'COBRADO',
    tipo: 'EMITIDO'
  },
  {
    id: 102,
    numero: '000457',
    banco: 'Banco Pichincha',
    beneficiario: 'Servicios Logísticos S.A.',
    fechaEmision: '2023-12-20',
    fechaCobro: '2024-01-05',
    monto: 850.0,
    estado: 'PENDIENTE',
    tipo: 'EMITIDO'
  },
  {
    id: 103,
    numero: '998877',
    banco: 'Banco del Pacífico',
    beneficiario: 'Horizon ERP S.A.',
    fechaEmision: '2023-12-10',
    fechaCobro: '2023-12-10',
    monto: 1200.0,
    estado: 'COBRADO',
    tipo: 'RECIBIDO'
  },
  {
    id: 104,
    numero: '000458',
    banco: 'Banco Pichincha',
    beneficiario: 'Consultora Externa',
    fechaEmision: '2023-12-22',
    fechaCobro: '2023-12-22',
    monto: 300.0,
    estado: 'ANULADO',
    tipo: 'EMITIDO'
  },
  {
    id: 105,
    numero: '554433',
    banco: 'Produbanco',
    beneficiario: 'Horizon ERP S.A.',
    fechaEmision: '2023-12-28',
    fechaCobro: '2024-01-15',
    monto: 5000.0,
    estado: 'PENDIENTE',
    tipo: 'RECIBIDO'
  } // Cheque postfechado recibido
];
