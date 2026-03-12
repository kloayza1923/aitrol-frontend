import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  MenuItem,
  Alert,
  Grid,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Autocomplete,
  Button
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { GridColDef } from '@mui/x-data-grid';
import * as Yup from 'yup';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { FetchData } from '../../../utils/FetchData';
import { Container } from '@/components';

type Gasto = {
  id?: number;
  numero?: string;
  fecha: string;
  proveedor?: string;
  id_proveedor: string;
  descripcion: string;
  subtotal: string;
  impuesto: string;
  total: string;
  pagado?: number;
  saldo?: number;
  estado?: string;
  cuenta_gasto?: string;
  id_cuenta_gasto: string;
  observaciones?: string;
};

type Proveedor = {
  id: number;
  nombre: string;
  ruc?: string;
};

const gastoSchema = Yup.object({
  fecha: Yup.string().required('La fecha es obligatoria'),
  id_proveedor: Yup.string().required('El proveedor es obligatorio'),
  descripcion: Yup.string().required('La descripción es obligatoria'),
  subtotal: Yup.string(),
  impuesto: Yup.string(),
  total: Yup.string().required('El total es obligatorio'),
  id_cuenta_gasto: Yup.string().required('La cuenta de gasto es obligatoria'),
  observaciones: Yup.string()
});

export default function GastosContablesPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cuentasGasto, setCuentasGasto] = useState<any[]>([]);
  const [cuentasBanco, setCuentasBanco] = useState<any[]>([]);
  const [bancoCuentas, setBancoCuentas] = useState<any[]>([]);
  const [openPagoDialog, setOpenPagoDialog] = useState(false);
  const [openPagosDialog, setOpenPagosDialog] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<any>(null);
  const [pagosHistorial, setPagosHistorial] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [pagoData, setPagoData] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    id_cuenta_pago: '',
    referencia: '',
    observaciones: '',
    registrar_en_banking: false,
    banco_cuenta_id: ''
  });

  useEffect(() => {
    loadProveedores();
    loadCuentasGasto();
    loadCuentasBanco();
    loadBancoCuentas();
  }, []);

  const loadProveedores = async () => {
    try {
      const response = await FetchData('inv/proveedores', 'GET');
      setProveedores(response || []);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const loadCuentasGasto = async () => {
    try {
      const response = await FetchData('/contabilidad/plan_cuentas', 'GET', {
        tipo: 'Gasto',
        es_movimiento: true,
        limit: 200
      });
      console.log('Cuentas Gasto Response:', response);
      const cuentas = (response.data || []).filter((c: any) => c.tipo === 'G' && c.es_movimiento);
      setCuentasGasto(cuentas);
    } catch (error) {
      console.error('Error cargando cuentas de gasto:', error);
    }
  };

  const loadCuentasBanco = async () => {
    try {
      const response = await FetchData('contabilidad/plan_cuentas', 'GET', {
        tipo: 'Activo',
        es_movimiento: true,
        limit: 200
      });
      const cuentas = (response.data || []).filter(
        (c: any) =>
          (c.tipo === 'A' &&
            (c.nombre.toLowerCase().includes('banco') ||
              c.nombre.toLowerCase().includes('caja'))) ||
          c.es_movimiento
      );
      setCuentasBanco(cuentas);
    } catch (error) {
      console.error('Error cargando cuentas bancarias:', error);
    }
  };

  const loadBancoCuentas = async () => {
    try {
      const response = await FetchData.get('fin/bank/accounts');
      if (response && Array.isArray(response.data)) {
        setBancoCuentas(response.data);
      }
    } catch (error) {
      console.error('Error cargando cuentas bancarias reales:', error);
    }
  };

  const handleOpenPago = (gasto: any) => {
    setSelectedGasto(gasto);
    setPagoData({
      monto: gasto.saldo.toString(),
      fecha: new Date().toISOString().split('T')[0],
      id_cuenta_pago: '',
      referencia: '',
      observaciones: '',
      registrar_en_banking: false,
      banco_cuenta_id: ''
    });
    setOpenPagoDialog(true);
  };

  const handleClosePago = () => {
    setOpenPagoDialog(false);
    setSelectedGasto(null);
    setMessage(null);
  };

  const handleSubmitPago = async () => {
    if (!selectedGasto) return;

    try {
      if (!pagoData.monto || !pagoData.id_cuenta_pago) {
        setMessage({ type: 'error', text: 'Complete monto y cuenta de pago' });
        return;
      }

      if (pagoData.registrar_en_banking && !pagoData.banco_cuenta_id) {
        setMessage({ type: 'error', text: 'Debe seleccionar una cuenta bancaria' });
        return;
      }

      const payload = {
        monto: parseFloat(pagoData.monto),
        fecha: pagoData.fecha,
        id_cuenta_pago: parseInt(pagoData.id_cuenta_pago),
        referencia: pagoData.referencia,
        observaciones: pagoData.observaciones,
        registrar_en_banking: pagoData.registrar_en_banking,
        banco_cuenta_id: pagoData.banco_cuenta_id ? parseInt(pagoData.banco_cuenta_id) : undefined
      };

      await FetchData(`cont-transacciones/gastos/${selectedGasto.id}/pagar`, 'POST', payload);
      setMessage({ type: 'success', text: 'Pago registrado correctamente' });
      setTimeout(() => handleClosePago(), 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error al registrar pago: ${error.message}` });
    }
  };

  const handleViewPagos = async (gasto: any) => {
    try {
      const response = await FetchData(`cont-transacciones/gastos/${gasto.id}/pagos`, 'GET');
      setPagosHistorial(response.data || []);
      setSelectedGasto(gasto);
      setOpenPagosDialog(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error al cargar pagos: ${error.message}` });
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pagado':
        return 'success';
      case 'parcial':
        return 'warning';
      case 'pendiente':
        return 'error';
      case 'anulado':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'numero', headerName: 'Número', width: 150 },
    { field: 'fecha', headerName: 'Fecha', width: 120 },
    { field: 'proveedor', headerName: 'Proveedor', width: 200 },
    { field: 'descripcion', headerName: 'Descripción', width: 250 },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      align: 'right',
      renderCell: (params) => `$${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'pagado',
      headerName: 'Pagado',
      width: 120,
      align: 'right',
      renderCell: (params) => `$${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'saldo',
      headerName: 'Saldo',
      width: 120,
      align: 'right',
      renderCell: (params) => (
        <Box sx={{ fontWeight: 'bold', color: params.value > 0 ? 'error.main' : 'success.main' }}>
          ${params.value?.toFixed(2) || '0.00'}
        </Box>
      )
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={getEstadoColor(params.value)} size="small" />
      )
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Gasto>
        title="Gastos Contables (Servicios)"
        endpoint="cont-transacciones/gastos"
        columns={columns}
        defaultFormValues={{
          fecha: new Date().toISOString().split('T')[0],
          id_proveedor: '',
          descripcion: '',
          subtotal: '',
          impuesto: '',
          total: '',
          id_cuenta_gasto: '',
          observaciones: ''
        }}
        renderForm={(formValues, handleChange, setFormValues, errors) => {
          const calcularTotal = () => {
            const subtotal = parseFloat(formValues.subtotal || '0');
            const impuesto = parseFloat(formValues.impuesto || '0');
            setFormValues((prev) => ({
              ...prev,
              total: (subtotal + impuesto).toFixed(2)
            }));
          };

          return (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha"
                  type="date"
                  fullWidth
                  name="fecha"
                  value={formValues.fecha}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.fecha}
                  helperText={errors.fecha}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={proveedores}
                  getOptionLabel={(option) =>
                    `${option?.nombre_contacto}${option.ruc ? ` - ${option.ruc}` : ''}`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Proveedor *"
                      error={!!errors.id_proveedor}
                      helperText={errors.id_proveedor}
                    />
                  )}
                  onChange={(_, value) =>
                    setFormValues((prev) => ({ ...prev, id_proveedor: value?.id.toString() || '' }))
                  }
                  value={
                    proveedores.find((p) => p.id.toString() === formValues.id_proveedor) || null
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción *"
                  fullWidth
                  multiline
                  rows={2}
                  name="descripcion"
                  value={formValues.descripcion}
                  onChange={handleChange}
                  error={!!errors.descripcion}
                  helperText={errors.descripcion}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Subtotal"
                  type="number"
                  fullWidth
                  name="subtotal"
                  value={formValues.subtotal}
                  onChange={handleChange}
                  onBlur={calcularTotal}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Impuesto"
                  type="number"
                  fullWidth
                  name="impuesto"
                  value={formValues.impuesto}
                  onChange={handleChange}
                  onBlur={calcularTotal}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Total *"
                  type="number"
                  fullWidth
                  name="total"
                  value={formValues.total}
                  onChange={handleChange}
                  error={!!errors.total}
                  helperText={errors.total}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Cuenta de Gasto *"
                  fullWidth
                  name="id_cuenta_gasto"
                  value={formValues.id_cuenta_gasto}
                  onChange={handleChange}
                  error={!!errors.id_cuenta_gasto}
                  helperText={errors.id_cuenta_gasto}
                >
                  {cuentasGasto.map((cuenta) => (
                    <MenuItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.codigo} - {cuenta.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  fullWidth
                  multiline
                  rows={2}
                  name="observaciones"
                  value={formValues.observaciones}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          );
        }}
        schema={gastoSchema}
        buttons={(row) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Ver pagos">
              <IconButton size="small" onClick={() => handleViewPagos(row)} color="info">
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {row.estado !== 'pagado' && row.estado !== 'anulado' && (
              <Tooltip title="Registrar pago">
                <IconButton size="small" onClick={() => handleOpenPago(row)} color="primary">
                  <PaymentIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      />

      {/* Dialog Registrar Pago */}
      <Dialog open={openPagoDialog} onClose={handleClosePago} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago - {selectedGasto?.numero}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Proveedor: <strong>{selectedGasto?.proveedor}</strong>
                <br />
                Saldo pendiente: <strong>${selectedGasto?.saldo.toFixed(2)}</strong>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                value={pagoData.fecha}
                onChange={(e) => setPagoData({ ...pagoData, fecha: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Monto *"
                type="number"
                fullWidth
                value={pagoData.monto}
                onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Cuenta de Pago *"
                fullWidth
                value={pagoData.id_cuenta_pago}
                onChange={(e) => setPagoData({ ...pagoData, id_cuenta_pago: e.target.value })}
              >
                {cuentasBanco.map((cuenta) => (
                  <MenuItem key={cuenta.id} value={cuenta.id}>
                    {cuenta.codigo} - {cuenta.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Referencia"
                fullWidth
                value={pagoData.referencia}
                onChange={(e) => setPagoData({ ...pagoData, referencia: e.target.value })}
                placeholder="Cheque #, Transferencia #, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observaciones"
                fullWidth
                multiline
                rows={2}
                value={pagoData.observaciones}
                onChange={(e) => setPagoData({ ...pagoData, observaciones: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={pagoData.registrar_en_banking}
                    onChange={(e) =>
                      setPagoData({ ...pagoData, registrar_en_banking: e.target.checked })
                    }
                  />
                }
                label="Registrar también en módulo de banking"
              />
            </Grid>
            {pagoData.registrar_en_banking && (
              <Grid item xs={12}>
                <TextField
                  select
                  label="Cuenta Bancaria Real *"
                  fullWidth
                  value={pagoData.banco_cuenta_id}
                  onChange={(e) => setPagoData({ ...pagoData, banco_cuenta_id: e.target.value })}
                  error={pagoData.registrar_en_banking && !pagoData.banco_cuenta_id}
                  helperText={
                    pagoData.registrar_en_banking && !pagoData.banco_cuenta_id
                      ? 'Debe seleccionar una cuenta bancaria'
                      : ''
                  }
                >
                  {bancoCuentas.map((banco: any) => (
                    <MenuItem key={banco.id} value={banco.id}>
                      {banco.banco} - {banco.numeroCuenta} (Saldo: ${banco.saldo?.toFixed(2)})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </Grid>

          {message && (
            <Alert severity={message.type} sx={{ mt: 2 }}>
              {message.text}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePago}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitPago}>
            Registrar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Historial de Pagos */}
      <Dialog
        open={openPagosDialog}
        onClose={() => setOpenPagosDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Historial de Pagos - {selectedGasto?.numero}</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Fecha</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Monto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Cuenta</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Referencia</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagosHistorial.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay pagos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  pagosHistorial.map((pago, index) => (
                    <TableRow key={index}>
                      <TableCell>{pago.fecha}</TableCell>
                      <TableCell align="right">${pago.monto.toFixed(2)}</TableCell>
                      <TableCell>{pago.cuenta_pago}</TableCell>
                      <TableCell>{pago.referencia || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPagosDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
