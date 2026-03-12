import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface VoucherPrintProps {
  venta: {
    id: number;
    numero_factura: string;
    fecha: string;
    razon_social: string;
    cliente_ruc?: string;
    cliente_direccion?: string;
    cliente_telefono?: string;
    subtotal: number;
    iva: number;
    descuento: number;
    total: number;
    detalles?: Array<{
      nombre: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }>;
    autorizacion_sri?: string;
  };
  empresa?: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email: string;
  };
}

export const VoucherPrint = React.forwardRef<HTMLDivElement, VoucherPrintProps>(
  ({ venta, empresa }, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          width: '80mm', // Ancho estándar de impresora térmica (58mm o 80mm)
          padding: '5mm',
          fontFamily: 'monospace',
          fontSize: '10px',
          backgroundColor: 'white',
          color: 'black',
          '@media print': {
            padding: '2mm',
            fontSize: '9px'
          }
        }}
      >
        {/* Encabezado Empresa */}
        <Box textAlign="center" mb={1}>
          <Typography variant="h6" fontSize="14px" fontWeight="bold" fontFamily="monospace">
            {empresa?.nombre || 'NOMBRE EMPRESA'}
          </Typography>
          <Typography fontSize="9px" fontFamily="monospace">
            RUC: {empresa?.ruc || '0000000000001'}
          </Typography>
          <Typography fontSize="9px" fontFamily="monospace">
            {empresa?.direccion || 'Dirección de la empresa'}
          </Typography>
          <Typography fontSize="9px" fontFamily="monospace">
            Tel: {empresa?.telefono || '0000000000'}
          </Typography>
          {empresa?.email && (
            <Typography fontSize="9px" fontFamily="monospace">
              {empresa.email}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        {/* Información de Factura */}
        <Box mb={1}>
          <Typography fontSize="11px" fontWeight="bold" textAlign="center" fontFamily="monospace">
            FACTURA DE VENTA
          </Typography>
          <Typography fontSize="10px" fontFamily="monospace">
            No: {venta.numero_factura}
          </Typography>
          <Typography fontSize="10px" fontFamily="monospace">
            Fecha: {new Date(venta.fecha).toLocaleDateString('es-ES')}
          </Typography>
          {venta.autorizacion_sri && (
            <Typography fontSize="8px" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
              Aut. SRI: {venta.autorizacion_sri}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        {/* Información del Cliente */}
        <Box mb={1}>
          <Typography fontSize="10px" fontFamily="monospace">
            <strong>Cliente:</strong> {venta.razon_social}
          </Typography>
          {venta.cliente_ruc && (
            <Typography fontSize="9px" fontFamily="monospace">
              RUC: {venta.cliente_ruc}
            </Typography>
          )}
          {venta.cliente_direccion && (
            <Typography fontSize="9px" fontFamily="monospace">
              Dir: {venta.cliente_direccion}
            </Typography>
          )}
          {venta.cliente_telefono && (
            <Typography fontSize="9px" fontFamily="monospace">
              Tel: {venta.cliente_telefono}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        {/* Detalle de Productos */}
        {venta.detalles && venta.detalles.length > 0 && (
          <>
            <Box mb={1}>
              <Typography
                fontSize="9px"
                fontWeight="bold"
                fontFamily="monospace"
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span>PRODUCTO</span>
                <span>TOTAL</span>
              </Typography>
              {venta.detalles.map((detalle, index) => (
                <Box key={index} mt={0.5}>
                  <Typography fontSize="9px" fontFamily="monospace">
                    {detalle.nombre}
                  </Typography>
                  <Typography
                    fontSize="9px"
                    fontFamily="monospace"
                    sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}
                  >
                    <span>
                      {detalle.cantidad} x ${detalle.precio_unitario.toFixed(2)}
                    </span>
                    <span>${(detalle?.cantidad * detalle?.precio_unitario).toFixed(2)}</span>
                  </Typography>
                </Box>
              ))}
            </Box>
            <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
          </>
        )}

        {/* Totales */}
        <Box mb={1}>
          <Typography
            fontSize="10px"
            fontFamily="monospace"
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <span>Subtotal:</span>
            <span>${venta?.subtotal?.toFixed(2)}</span>
          </Typography>
          {venta?.descuento > 0 && (
            <Typography
              fontSize="10px"
              fontFamily="monospace"
              sx={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <span>Descuento:</span>
              <span>-${venta.descuento.toFixed(2)}</span>
            </Typography>
          )}
          <Typography
            fontSize="10px"
            fontFamily="monospace"
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <span>IVA:</span>
            <span>${venta.iva.toFixed(2)}</span>
          </Typography>
          <Divider sx={{ my: 0.5 }} />
          <Typography
            fontSize="12px"
            fontWeight="bold"
            fontFamily="monospace"
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <span>TOTAL:</span>
            <span>${venta.total.toFixed(2)}</span>
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        {/* Pie de página */}
        <Box textAlign="center" mt={1}>
          <Typography fontSize="9px" fontFamily="monospace">
            ¡Gracias por su compra!
          </Typography>
          <Typography fontSize="8px" fontFamily="monospace" mt={0.5}>
            Sistema Horizon ERP
          </Typography>
        </Box>
      </Box>
    );
  }
);

VoucherPrint.displayName = 'VoucherPrint';
