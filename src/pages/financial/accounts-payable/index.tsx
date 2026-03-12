import React, { useState } from 'react';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import { Button, Tooltip, IconButton } from '@mui/material';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import PaidOutlined from '@mui/icons-material/PaidOutlined';
import { FetchData } from '@/utils/FetchData';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useNotification } from '@/hooks';

export default function AccountsPayable() {
  const notification = useNotification();
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'compra_numero',
      headerName: 'Compra',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'proveedor_nombre',
      headerName: 'Proveedor',
      flex: 1,
      minWidth: 160
    },
    { field: 'fecha', headerName: 'Fecha', flex: 1, minWidth: 140 },
    { field: 'fecha_vencimiento', headerName: 'Vencimiento', flex: 1, minWidth: 140 },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'saldo',
      headerName: 'Saldo',
      flex: 1,
      minWidth: 120
    },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 120 }
  ];

  const handleProcess = async (row: any) => {
    try {
      const previewData = await FetchData.post(`fin/cxp/${row.id}/process`, {
        auto: true,
        id_usuario: 1,
        preview: true
      });
      if (!previewData.balanced) {
        notification.error(
          `Asiento desbalanceado. Debe: ${previewData.suma_debe}, Haber: ${previewData.suma_haber}`
        );
        return;
      }
      setPreviewData(previewData);
      setPreviewOpen(true);
      setPreviewRow(row);
    } catch (e: any) {
      console.error(e);
      notification.error(e.message || 'Error al obtener previsualización');
    }
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewRow, setPreviewRow] = useState<any | null>(null);

  const handleConfirmProcess = async () => {
    if (!previewRow) return;
    try {
      const data = await FetchData.post(`fin/cxp/${previewRow.id}/process`, {
        auto: true,
        id_usuario: 1
      });
      notification.success('Contabilizado correctamente');
      setPreviewOpen(false);
      setPreviewData(null);
      setPreviewRow(null);
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      notification.error(e.message || 'Error al contabilizar');
    }
  };

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    monto: 0,
    cuenta_pago_id: '',
    fecha: new Date().toISOString().slice(0, 10),
    registrar_en_banking: false,
    banco_cuenta_id: '',
    referencia: ''
  });
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [bancoCuentas, setBancoCuentas] = useState<any[]>([]);

  const loadBancoCuentas = async () => {
    try {
      const response = await FetchData.get('fin/bank/accounts');
      if (response && Array.isArray(response.data)) {
        setBancoCuentas(response.data);
      }
    } catch (error) {
      console.error('Error cargando cuentas bancarias:', error);
    }
  };

  const handleOpenPayment = (row: any) => {
    setSelectedRow(row);
    setPaymentForm({
      monto: row.saldo || 0,
      cuenta_pago_id: '',
      fecha: new Date().toISOString().slice(0, 10),
      registrar_en_banking: false,
      banco_cuenta_id: '',
      referencia: ''
    });
    FetchData.get('contabilidad/plan_cuentas', { page: 1, limit: 1000 })
      .then((data) => {
        if (data && Array.isArray(data.data)) setAccountsList(data.data || []);
      })
      .catch((e) => console.error('Error cargando cuentas:', e));
    loadBancoCuentas();
    setPaymentOpen(true);
  };

  const handleClosePayment = () => {
    setPaymentOpen(false);
    setSelectedRow(null);
  };

  const handleSubmitPayment = async () => {
    if (!selectedRow) return;
    const monto = parseFloat(String(paymentForm.monto) || '0');
    if (!monto || monto <= 0) {
      notification.error('Monto inválido');
      return;
    }

    if (paymentForm.registrar_en_banking && !paymentForm.banco_cuenta_id) {
      notification.error('Debe seleccionar una cuenta bancaria');
      return;
    }

    try {
      const data = await FetchData.post(`fin/cxp/${selectedRow.id}/apply-payment`, {
        monto,
        id_usuario: 1,
        fecha: paymentForm.fecha,
        cuenta_pago_id: paymentForm.cuenta_pago_id || undefined,
        auto: paymentForm.cuenta_pago_id ? false : true,
        registrar_en_banking: paymentForm.registrar_en_banking,
        banco_cuenta_id: paymentForm.banco_cuenta_id || undefined,
        referencia: paymentForm.referencia || undefined
      });
      notification.success('Pago aplicado');
      handleClosePayment();
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      notification.error(e.message || 'Error aplicando pago');
    }
  };

  return (
    <Container>
      <CrudDataGrid
        title="Cuentas por Pagar"
        endpoint="/fin/cxp"
        columns={columns}
        mode="table"
        handleSearch={true}
        buttons={(row: any) => {
          const isPaid = String(row?.estado || '').toLowerCase() === 'pagado';
          if (isPaid) return null;
          return (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Tooltip title="Contabilizar" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleProcess(row)}
                  sx={{
                    color: 'secondary.main',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'secondary.dark',
                      bgcolor: 'secondary.lighter',
                      transform: 'scale(1.1)',
                      boxShadow: 2
                    },
                    '&:active': { transform: 'scale(0.95)' }
                  }}
                >
                  <ReceiptLongOutlined fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Aplicar pago" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleOpenPayment(row)}
                  sx={{
                    color: 'secondary.main',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'secondary.dark',
                      bgcolor: 'secondary.lighter',
                      transform: 'scale(1.1)',
                      boxShadow: 2
                    },
                    '&:active': { transform: 'scale(0.95)' }
                  }}
                >
                  <PaidOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          );
        }}
      />

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Previsualización de asiento</DialogTitle>
        <DialogContent>
          {previewData ? (
            <div>
              <p>
                Debe: <strong>{previewData.suma_debe}</strong> — Haber:{' '}
                <strong>{previewData.suma_haber}</strong>
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Cuenta</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>Debe</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>Haber</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.detalles.map((d: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px 4px' }}>{d.descripcion || d.id_cuenta}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>{d.debe || 0}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>{d.haber || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>Cargando...</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmProcess}>
            Contabilizar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentOpen} onClose={handleClosePayment} fullWidth maxWidth="sm">
        <DialogTitle>Aplicar pago</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <TextField
              label="Monto"
              type="number"
              value={paymentForm.monto}
              onChange={(e) =>
                setPaymentForm((p) => ({ ...p, monto: parseFloat(e.target.value || '0') }))
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="cuenta-select-label">Cuenta (opcional)</InputLabel>
              <Select
                labelId="cuenta-select-label"
                label="Cuenta (opcional)"
                value={paymentForm.cuenta_pago_id}
                onChange={(e) => setPaymentForm((p) => ({ ...p, cuenta_pago_id: e.target.value }))}
                fullWidth
              >
                <MenuItem value="">Automático</MenuItem>
                {accountsList.map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    {a.codigo ? `${a.codigo} - ${a.nombre}` : a.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div style={{ marginTop: 12 }}>
            <TextField
              label="Fecha"
              type="date"
              value={paymentForm.fecha}
              onChange={(e) => setPaymentForm((p) => ({ ...p, fecha: e.target.value }))}
              fullWidth
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={paymentForm.registrar_en_banking}
                  onChange={(e) =>
                    setPaymentForm((p) => ({ ...p, registrar_en_banking: e.target.checked }))
                  }
                />
              }
              label="Registrar también en módulo de banking"
            />
          </div>

          {paymentForm.registrar_en_banking && (
            <>
              <div style={{ marginTop: 12 }}>
                <TextField
                  label="Cuenta Bancaria Real *"
                  select
                  value={paymentForm.banco_cuenta_id}
                  onChange={(e) =>
                    setPaymentForm((p) => ({ ...p, banco_cuenta_id: e.target.value }))
                  }
                  fullWidth
                  error={paymentForm.registrar_en_banking && !paymentForm.banco_cuenta_id}
                  helperText={
                    paymentForm.registrar_en_banking && !paymentForm.banco_cuenta_id
                      ? 'Debe seleccionar una cuenta bancaria'
                      : ''
                  }
                >
                  {bancoCuentas.map((banco) => (
                    <MenuItem key={banco.id} value={banco.id}>
                      {banco.banco} - {banco.numeroCuenta} (Saldo: ${banco.saldo?.toFixed(2)})
                    </MenuItem>
                  ))}
                </TextField>
              </div>
              <div style={{ marginTop: 12 }}>
                <TextField
                  label="Referencia (opcional)"
                  value={paymentForm.referencia}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, referencia: e.target.value }))}
                  fullWidth
                  placeholder="Ej: Cheque #1234, Transferencia #5678"
                />
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePayment}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitPayment}>
            Aplicar pago
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
