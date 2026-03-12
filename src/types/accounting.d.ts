export interface NotaCredito {
  id: number;
  venta_id: number;
  cliente_id: number;
  sucursal_id: number;
  usuario_id: number;
  serie: string;
  numero: string;
  fecha: string;
  motivo: string;
  tipo_nota: 'DEVOLUCION' | 'DESCUENTO';
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  cliente_nombre?: string;
  factura_origen?: string;
}

export interface NotaCreditoDetalle {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto_nombre?: string; // Para mostrar en visualización
  venta_detalle_id?: number;
}

export interface CreateNotaCreditoRequest {
  venta_id: number;
  cliente_id: number;
  sucursal_id: number;
  usuario_id: number;
  serie: string;
  numero: string;
  motivo: string;
  tipo_nota: string;
  detalles: NotaCreditoDetalle[];
}
