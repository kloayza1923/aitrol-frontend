// src/pages/financial/credit-cards/mock-data.ts

export type Franquicia = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DINERS';

export interface TarjetaCredito {
  id: number;
  alias: string; // Ej: "Visa Gold Gerencia"
  banco: string;
  ultimos4: string;
  franquicia: Franquicia;
  cupoTotal: number;
  cupoDisponible: number;
  deudaTotal: number;
  diaCorte: number; // Día del mes
  diaPago: number; // Día límite de pago
  color: string; // Gradiente para el CSS
}

export interface MovimientoTC {
  id: number;
  tarjetaId: number;
  fecha: string;
  descripcion: string;
  referencia: string; // Voucher
  cuotas: { actual: number; total: number }; // Ej: 3 de 12
  montoOriginal: number;
  montoCuotaMes: number; // Lo que impacta este mes
  categoria: string;
}

export const MOCK_TARJETAS: TarjetaCredito[] = [
  {
    id: 1,
    alias: 'Visa Corporativa',
    banco: 'Banco Pichincha',
    ultimos4: '4589',
    franquicia: 'VISA',
    cupoTotal: 10000,
    cupoDisponible: 6500.5,
    deudaTotal: 3499.5,
    diaCorte: 15,
    diaPago: 5,
    color: 'from-blue-700 to-blue-900'
  },
  {
    id: 2,
    alias: 'Mastercard Compras',
    banco: 'Banco Guayaquil',
    ultimos4: '1234',
    franquicia: 'MASTERCARD',
    cupoTotal: 5000,
    cupoDisponible: 4800.0,
    deudaTotal: 200.0,
    diaCorte: 30,
    diaPago: 15,
    color: 'from-orange-600 to-red-600'
  },
  {
    id: 3,
    alias: 'Amex Viajes',
    banco: 'Banco Guayaquil',
    ultimos4: '9876',
    franquicia: 'AMEX',
    cupoTotal: 15000,
    cupoDisponible: 1200.0,
    deudaTotal: 13800.0,
    diaCorte: 20,
    diaPago: 10,
    color: 'from-slate-700 to-slate-900'
  }
];

export const MOCK_MOVIMIENTOS_TC: MovimientoTC[] = [
  {
    id: 1,
    tarjetaId: 1,
    fecha: '2023-12-20',
    descripcion: 'Suscripción AWS',
    referencia: 'AWS-999',
    cuotas: { actual: 1, total: 1 },
    montoOriginal: 150.0,
    montoCuotaMes: 150.0,
    categoria: 'Servicios'
  },
  {
    id: 2,
    tarjetaId: 1,
    fecha: '2023-11-15',
    descripcion: 'Compra Laptops Dell',
    referencia: 'V-2231',
    cuotas: { actual: 2, total: 12 },
    montoOriginal: 2400.0,
    montoCuotaMes: 200.0,
    categoria: 'Equipos'
  },
  {
    id: 3,
    tarjetaId: 3,
    fecha: '2023-12-05',
    descripcion: 'Boletos Aéreos Madrid',
    referencia: 'IB-223',
    cuotas: { actual: 1, total: 6 },
    montoOriginal: 1800.0,
    montoCuotaMes: 300.0,
    categoria: 'Viáticos'
  },
  {
    id: 4,
    tarjetaId: 2,
    fecha: '2023-12-28',
    descripcion: 'Almuerzo Ejecutivo',
    referencia: 'R-998',
    cuotas: { actual: 1, total: 1 },
    montoOriginal: 45.5,
    montoCuotaMes: 45.5,
    categoria: 'Alimentación'
  }
];
