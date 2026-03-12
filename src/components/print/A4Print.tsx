import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  Divider
} from '@mui/material';

interface A4PrintProps {
  venta: {
    id: number;
    numero_factura: string;
    fecha: string;
    razon_social: string;
    cliente_ruc?: string;
    cliente_direccion?: string;
    cliente_telefono?: string;
    cliente_email?: string;
    subtotal: number;
    iva: number;
    descuento: number;
    total: number;
    estado_pago: string;
    valor_pagado: number;
    detalles?: Array<{
      serie?: string;
      producto_nombre: string;
      producto_codigo?: string;
      cantidad: number;
      precio_unitario: number;
      descuento?: number;
      subtotal: number;
    }>;
    autorizacion_sri?: string;
    forma_pago?: string;
    observaciones?: string;
  };
  empresa?: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email: string;
    logo?: string;
  };
}

export const A4Print = React.forwardRef<HTMLDivElement, A4PrintProps>(({ venta, empresa }, ref) => {
  return (
    <Box
      ref={ref}
      sx={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        backgroundColor: 'white',
        color: 'black',
        '@media print': {
          padding: '10mm',
          margin: 0,
          '@page': {
            size: 'A4',
            margin: '10mm'
          }
        }
      }}
    >
      {/* Encabezado */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={8}>
          <Box>
            {empresa?.logo && (
              <Box component="img" src={empresa.logo} alt="Logo" sx={{ maxHeight: 60, mb: 1 }} />
            )}
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {empresa?.nombre || 'NOMBRE DE LA EMPRESA'}
            </Typography>
            <Typography variant="body2">RUC: {empresa?.ruc || '0000000000001'}</Typography>
            <Typography variant="body2">
              {empresa?.direccion || 'Dirección de la empresa'}
            </Typography>
            <Typography variant="body2">Tel: {empresa?.telefono || '0000000000'}</Typography>
            {empresa?.email && <Typography variant="body2">Email: {empresa.email}</Typography>}
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box
            sx={{
              border: 2,
              borderColor: 'primary.main',
              p: 2,
              textAlign: 'center',
              backgroundColor: '#f5f5f5'
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="primary">
              FACTURA
            </Typography>
            <Typography variant="body1" fontWeight="bold" mt={1}>
              {venta.numero_factura}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {new Date(venta.fecha).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Información del Cliente */}
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          p: 2,
          mb: 3,
          backgroundColor: '#fafafa'
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
          INFORMACIÓN DEL CLIENTE
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Cliente:</strong> {venta.razon_social}
            </Typography>
            {venta.cliente_ruc && (
              <Typography variant="body2">
                <strong>RUC/CI:</strong> {venta.cliente_ruc}
              </Typography>
            )}
            {venta.cliente_telefono && (
              <Typography variant="body2">
                <strong>Teléfono:</strong> {venta.cliente_telefono}
              </Typography>
            )}
          </Grid>
          <Grid item xs={6}>
            {venta.cliente_direccion && (
              <Typography variant="body2">
                <strong>Dirección:</strong> {venta.cliente_direccion}
              </Typography>
            )}
            {venta.cliente_email && (
              <Typography variant="body2">
                <strong>Email:</strong> {venta.cliente_email}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Tabla de Productos */}
      <Table sx={{ mb: 3 }} size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
              Cantidad
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              P. Unitario
            </TableCell>
            {venta.detalles?.some((d) => d.descuento && d.descuento > 0) && (
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                Descuento
              </TableCell>
            )}
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              Subtotal
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {venta.detalles && venta.detalles.length > 0 ? (
            venta.detalles.map((detalle, index) => (
              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableCell>{detalle.serie || '-'}</TableCell>
                <TableCell>{detalle.nombre}</TableCell>
                <TableCell align="center">{detalle.cantidad}</TableCell>
                <TableCell align="right">${detalle.precio_unitario.toFixed(2)}</TableCell>
                {venta.detalles?.some((d) => d.descuento && d.descuento > 0) && (
                  <TableCell align="right">
                    {detalle?.descuento ? `-$${detalle.descuento.toFixed(2)}` : '-'}
                  </TableCell>
                )}
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  $
                  {(
                    detalle?.cantidad * detalle?.precio_unitario -
                    (detalle?.descuento || 0)
                  ).toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="text.secondary">
                  No hay detalles disponibles
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Totales y Observaciones */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={7}>
          {venta.observaciones && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Observaciones:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {venta.observaciones}
              </Typography>
            </Box>
          )}
          {venta.autorizacion_sri && (
            <Box mt={2}>
              <Typography variant="caption" display="block">
                <strong>Autorización SRI:</strong>
              </Typography>
              <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                {venta.autorizacion_sri}
              </Typography>
            </Box>
          )}
        </Grid>
        <Grid item xs={5}>
          <Box sx={{ border: 1, borderColor: 'divider', p: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">${venta.subtotal.toFixed(2)}</Typography>
            </Box>
            {venta.descuento > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Descuento:</Typography>
                <Typography variant="body2" color="error">
                  -${venta.descuento.toFixed(2)}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">IVA (12%):</Typography>
              <Typography variant="body2">${venta.iva.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                TOTAL:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                ${venta.total.toFixed(2)}
              </Typography>
            </Box>
            {venta.valor_pagado > 0 && (
              <>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Pagado:</Typography>
                  <Typography variant="body2" color="success.main">
                    ${venta.valor_pagado.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Saldo:</Typography>
                  <Typography
                    variant="body2"
                    color={venta.total - venta.valor_pagado > 0 ? 'error' : 'inherit'}
                  >
                    ${(venta.total - venta.valor_pagado).toFixed(2)}
                  </Typography>
                </Box>
              </>
            )}
            {venta.forma_pago && (
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  Forma de pago: {venta.forma_pago}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Pie de página */}
      <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 'auto' }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box
              sx={{
                borderTop: 1,
                borderColor: 'text.secondary',
                pt: 1,
                mt: 5,
                textAlign: 'center'
              }}
            >
              <Typography variant="caption">Firma del Cliente</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                borderTop: 1,
                borderColor: 'text.secondary',
                pt: 1,
                mt: 5,
                textAlign: 'center'
              }}
            >
              <Typography variant="caption">Firma Autorizada</Typography>
            </Box>
          </Grid>
        </Grid>
        <Box textAlign="center" mt={3}>
          <Typography variant="caption" color="text.secondary">
            Este documento es una representación impresa de la factura electrónica
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Sistema Horizon ERP - {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

A4Print.displayName = 'A4Print';
