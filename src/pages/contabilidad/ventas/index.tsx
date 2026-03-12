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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { GridColDef } from '@mui/x-data-grid';
import * as Yup from 'yup';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { FetchData } from '../../../utils/FetchData';
import { Container } from '@/components';

type Venta = {
  id?: number;
  numero?: string;
  fecha: string;
  cliente?: string;
  id_cliente: string;
  descripcion: string;
  subtotal: string;
  impuesto: string;
  total: string;
  cobrado?: number;
  saldo?: number;
  estado?: string;
  cuenta_ingreso?: string;
  id_cuenta_ingreso: string;
  observaciones?: string;
};

type Cliente = {
  id: number;
  nombre: string;
  ruc?: string;
};

const ventaSchema = Yup.object({
  fecha: Yup.string().required('La fecha es obligatoria'),
  id_cliente: Yup.string().required('El cliente es obligatorio'),
  descripcion: Yup.string().required('La descripción es obligatoria'),
  subtotal: Yup.string(),
  impuesto: Yup.string(),
  total: Yup.string().required('El total es obligatorio'),
  id_cuenta_ingreso: Yup.string().required('La cuenta de ingreso es obligatoria'),
  observaciones: Yup.string()
});

export default function VentasContablesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cuentasIngreso, setCuentasIngreso] = useState<any[]>([]);
  const [cuentasBanco, setCuentasBanco] = useState<any[]>([]);
  const [bancoCuentas, setBancoCuentas] = useState<any[]>([]);
  const [openCobroDialog, setOpenCobroDialog] = useState(false);
  const [openCobrosDialog, setOpenCobrosDialog] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<any>(null);
  const [cobrosHistorial, setCobrosHistorial] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [cobroData, setCobroData] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    id_cuenta_cobro: '',
    referencia: '',
    observaciones: '',
    registrar_en_banking: false,
    banco_cuenta_id: ''
  });

  useEffect(() => {
    loadClientes();
    loadCuentasIngreso();
    loadCuentasBanco();
    loadBancoCuentas();
  }, []);

  const loadClientes = async () => {
    try {
      const response = await FetchData('inv/clientes', 'GET', { limit: 500 });
      setClientes(response || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const loadCuentasIngreso = async () => {
    try {
      const response = await FetchData('contabilidad/plan_cuentas', 'GET', { limit: 200 });
      const cuentas = (response.data || []).filter((c: any) => c.tipo === 'I' && c.es_movimiento);
      setCuentasIngreso(cuentas);
    } catch (error) {
      console.error('Error cargando cuentas de ingreso:', error);
    }
  };

  const loadCuentasBanco = async () => {
    try {
      const response = await FetchData('contabilidad/plan_cuentas', 'GET', { limit: 200 });
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

  const handleOpenCobro = (venta: any) => {
    setSelectedVenta(venta);
    setCobroData({
      monto: venta.saldo.toString(),
      fecha: new Date().toISOString().split('T')[0],
      id_cuenta_cobro: '',
      referencia: '',
      observaciones: '',
      registrar_en_banking: false,
      banco_cuenta_id: ''
    });
    setOpenCobroDialog(true);
  };

  const handleCloseCobro = () => {
    setOpenCobroDialog(false);
    setSelectedVenta(null);
    setMessage(null);
  };

  const handleSubmitCobro = async () => {
    if (!selectedVenta) return;

    try {
      if (!cobroData.monto || !cobroData.id_cuenta_cobro) {
        setMessage({ type: 'error', text: 'Complete monto y cuenta de cobro' });
        return;
      }

      if (cobroData.registrar_en_banking && !cobroData.banco_cuenta_id) {
        setMessage({ type: 'error', text: 'Debe seleccionar una cuenta bancaria' });
        return;
      }

      const payload = {
        monto: parseFloat(cobroData.monto),
        fecha: cobroData.fecha,
        id_cuenta_cobro: parseInt(cobroData.id_cuenta_cobro),
        referencia: cobroData.referencia,
        observaciones: cobroData.observaciones,
        id_usuario: 1,
        registrar_en_banking: cobroData.registrar_en_banking,
        banco_cuenta_id: cobroData.banco_cuenta_id ? parseInt(cobroData.banco_cuenta_id) : undefined
      };

      await FetchData(`cont-transacciones/ventas/${selectedVenta.id}/cobrar`, 'POST', payload);
      setMessage({ type: 'success', text: 'Cobro registrado correctamente' });
      setTimeout(() => handleCloseCobro(), 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error al registrar cobro: ${error.message}` });
    }
  };

  const handleViewCobros = async (venta: any) => {
    try {
      const response = await FetchData(`cont-transacciones/ventas/${venta.id}/cobros`, 'GET');
      setCobrosHistorial(response.data || []);
      setSelectedVenta(venta);
      setOpenCobrosDialog(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error al cargar cobros: ${error.message}` });
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'cobrado':
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
    { field: 'cliente', headerName: 'Cliente', width: 200 },
    { field: 'descripcion', headerName: 'Descripción', width: 250 },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      align: 'right',
      renderCell: (params) => `$${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'cobrado',
      headerName: 'Cobrado',
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
        <Box sx={{ fontWeight: 'bold', color: params.value > 0 ? 'warning.main' : 'success.main' }}>
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
      <CrudDataGrid<Venta>
        title="Ventas Contables (Servicios)"
        endpoint="cont-transacciones/ventas"
        columns={columns}
        defaultFormValues={{
          fecha: new Date().toISOString().split('T')[0],
          id_cliente: '',
          descripcion: '',
          subtotal: '',
          impuesto: '',
          total: '',
          id_cuenta_ingreso: '',
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
                  options={clientes}
                  getOptionLabel={(option) =>
                    `${option.nombre}${option.ruc ? ` - ${option.ruc}` : ''}`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente *"
                      error={!!errors.id_cliente}
                      helperText={errors.id_cliente}
                    />
                  )}
                  onChange={(_, value) =>
                    setFormValues((prev) => ({ ...prev, id_cliente: value?.id.toString() || '' }))
                  }
                  value={clientes.find((c) => c.id.toString() === formValues.id_cliente) || null}
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
                  label="Cuenta de Ingreso *"
                  fullWidth
                  name="id_cuenta_ingreso"
                  value={formValues.id_cuenta_ingreso}
                  onChange={handleChange}
                  error={!!errors.id_cuenta_ingreso}
                  helperText={errors.id_cuenta_ingreso}
                >
                  {cuentasIngreso.map((cuenta) => (
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
        schema={ventaSchema}
        buttons={(row) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Ver cobros">
              <IconButton size="small" onClick={() => handleViewCobros(row)} color="info">
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {row.estado !== 'cobrado' && row.estado !== 'anulado' && (
              <Tooltip title="Registrar cobro">
                <IconButton size="small" onClick={() => handleOpenCobro(row)} color="primary">
                  <AccountBalanceIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      />

      {/* Dialog Registrar Cobro */}
      <Dialog open={openCobroDialog} onClose={handleCloseCobro} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Cobro - {selectedVenta?.numero}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Cliente: <strong>{selectedVenta?.cliente}</strong>
                <br />
                Saldo pendiente: <strong>${selectedVenta?.saldo.toFixed(2)}</strong>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                value={cobroData.fecha}
                onChange={(e) => setCobroData({ ...cobroData, fecha: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Monto *"
                type="number"
                fullWidth
                value={cobroData.monto}
                onChange={(e) => setCobroData({ ...cobroData, monto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Cuenta de Cobro *"
                fullWidth
                value={cobroData.id_cuenta_cobro}
                onChange={(e) => setCobroData({ ...cobroData, id_cuenta_cobro: e.target.value })}
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
                value={cobroData.referencia}
                onChange={(e) => setCobroData({ ...cobroData, referencia: e.target.value })}
                placeholder="Cheque #, Transferencia #, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observaciones"
                fullWidth
                multiline
                rows={2}
                value={cobroData.observaciones}
                onChange={(e) => setCobroData({ ...cobroData, observaciones: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cobroData.registrar_en_banking}
                    onChange={(e) =>
                      setCobroData({ ...cobroData, registrar_en_banking: e.target.checked })
                    }
                  />
                }
                label="Registrar también en módulo de banking"
              />
            </Grid>
            {cobroData.registrar_en_banking && (
              <Grid item xs={12}>
                <TextField
                  select
                  label="Cuenta Bancaria Real *"
                  fullWidth
                  value={cobroData.banco_cuenta_id}
                  onChange={(e) => setCobroData({ ...cobroData, banco_cuenta_id: e.target.value })}
                  error={cobroData.registrar_en_banking && !cobroData.banco_cuenta_id}
                  helperText={
                    cobroData.registrar_en_banking && !cobroData.banco_cuenta_id
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
          <Button onClick={handleCloseCobro}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitCobro}>
            Registrar Cobro
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Historial de Cobros */}
      <Dialog
        open={openCobrosDialog}
        onClose={() => setOpenCobrosDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Historial de Cobros - {selectedVenta?.numero}</DialogTitle>
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
                {cobrosHistorial.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay cobros registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  cobrosHistorial.map((cobro, index) => (
                    <TableRow key={index}>
                      <TableCell>{cobro.fecha}</TableCell>
                      <TableCell align="right">${cobro.monto.toFixed(2)}</TableCell>
                      <TableCell>{cobro.cuenta_cobro}</TableCell>
                      <TableCell>{cobro.referencia || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCobrosDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
