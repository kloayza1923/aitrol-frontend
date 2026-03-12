import React, { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import {
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
  Typography
} from '@mui/material';
import { toast } from 'sonner';

export default function CreditNoteCreate() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
  const [venta, setVenta] = useState<any | null>(null);
  const [detalles, setDetalles] = useState<any[]>([]);

  const [serie, setSerie] = useState('');
  const [numero, setNumero] = useState('');
  const [motivo, setMotivo] = useState('Devolución');
  const [tipoNota, setTipoNota] = useState<'DEVOLUCION' | 'DESCUENTO'>('DEVOLUCION');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadVentas = async () => {
      setLoadingVentas(true);
      try {
        const resp = await FetchData.get('inv/ventas', { page: 1, limit: 1000 });
        // API may return array or { data: [...] }
        const list = Array.isArray(resp) ? resp : resp?.data || resp || [];
        setVentas(list);
      } catch (err) {
        console.error('Error cargando ventas:', err);
        toast.error('Error cargando ventas');
      } finally {
        setLoadingVentas(false);
      }
    };
    loadVentas();
  }, []);

  useEffect(() => {
    if (!selectedVentaId) return;
    const loadVenta = async () => {
      try {
        const resp = await FetchData.get(`inv/ventas/${selectedVentaId}`);
        const ventaObj = resp?.venta || resp;
        const det = resp?.detalles || resp?.detalles || ventaObj?.detalles || [];
        setVenta(ventaObj || null);
        setDetalles(Array.isArray(det) ? det : []);
      } catch (err) {
        console.error('Error cargando venta:', err);
        toast.error('Error cargando venta seleccionada');
      }
    };
    loadVenta();
  }, [selectedVentaId]);

  const computeSubtotal = () => {
    return detalles.reduce(
      (s, d) => s + (Number(d.subtotal ?? d.precio_unitario * d.cantidad ?? 0) || 0),
      0
    );
  };

  const handleSubmit = async () => {
    if (!selectedVentaId || !venta) {
      toast.error('Seleccione una venta');
      return;
    }
    if (!serie || !numero) {
      toast.error('Complete serie y número');
      return;
    }

    const payload = {
      venta_id: Number(selectedVentaId),
      cliente_id: Number(venta.cliente_id ?? venta.cliente_id ?? venta.cliente?.id ?? 0),
      sucursal_id: Number(venta.id_sucursal ?? venta.id_sucursal ?? 1),
      usuario_id: 1,
      serie,
      numero,
      motivo,
      tipo_nota: tipoNota,
      detalles: detalles.map((d: any) => ({
        producto_id: d.producto_id,
        cantidad: d.cantidad ?? 1,
        precio_unitario: d.precio_unitario ?? 0,
        subtotal: d.subtotal ?? Number(d.precio_unitario ?? 0) * Number(d.cantidad ?? 1),
        venta_detalle_id: d.id ?? null
      }))
    };

    setSubmitting(true);
    try {
      const res = await FetchData.post('cont/notas-credito', payload);
      toast.success('Nota de crédito creada');
      // redirect to list or clear
      setSelectedVentaId(null);
      setVenta(null);
      setDetalles([]);
      setSerie('');
      setNumero('');
      setMotivo('');
    } catch (err: any) {
      console.error('Error creando nota:', err);
      toast.error(err?.message || 'Error creando nota de crédito');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Crear Nota de Crédito</Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="venta-select-label">Venta</InputLabel>
          <Select
            labelId="venta-select-label"
            value={selectedVentaId ?? ''}
            label="Venta"
            onChange={(e) => setSelectedVentaId(e.target.value ? Number(e.target.value) : null)}
          >
            <MenuItem value="">-- Seleccionar --</MenuItem>
            {ventas.map((v: any) => (
              <MenuItem key={v.id} value={v.id}>
                {v.numero_factura ?? v.numero ?? `Venta ${v.id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField label="Serie" value={serie} onChange={(e) => setSerie(e.target.value)} />
          <TextField label="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
          <FormControl>
            <InputLabel id="tipo-nota-label">Tipo</InputLabel>
            <Select
              labelId="tipo-nota-label"
              value={tipoNota}
              label="Tipo"
              onChange={(e) => setTipoNota(e.target.value as any)}
            >
              <MenuItem value={'DEVOLUCION'}>DEVOLUCIÓN</MenuItem>
              <MenuItem value={'DESCUENTO'}>DESCUENTO</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          fullWidth
          label="Motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle1">Detalles de la venta</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detalles.map((d, idx) => (
              <TableRow key={idx}>
                <TableCell>{d.nombre ?? d.producto_nombre ?? d.producto_id}</TableCell>
                <TableCell>{d.cantidad}</TableCell>
                <TableCell>{Number(d.precio_unitario ?? 0).toFixed(2)}</TableCell>
                <TableCell>
                  {Number(d.subtotal ?? d.precio_unitario * d.cantidad ?? 0).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <strong>Total</strong>
              </TableCell>
              <TableCell>
                <strong>{computeSubtotal().toFixed(2)}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Crear Nota de Crédito'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setSelectedVentaId(null);
              setVenta(null);
              setDetalles([]);
            }}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
