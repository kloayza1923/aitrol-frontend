import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Grid,
  Select,
  InputLabel,
  FormControl,
  IconButton
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState, useRef } from 'react';
import { FetchData } from '@/utils/FetchData';
import { useNavigate } from 'react-router';
import { useTabNavigate } from '@/hooks';
import { useReactToPrint } from 'react-to-print';
import { VoucherPrint } from '@/components/print/VoucherPrint';
import { A4Print } from '@/components/print/A4Print';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';

type FacturaVenta = {
  id: number;
  cliente_id: number;
  razon_social: string;
  numero_factura: string;
  fecha: string;
  total: number;
  estado_pago: string;
  valor_pagado: number;
  plazo_pago: number;
  autorizacion_sri: string;
  dias_atraso: number;
  total_pagado: number;
  subtotal: number;
  iva: number;
  descuento: number;
  fecha_pago: string;
};

export default function VentasList() {
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [estadoPago, setEstadoPago] = useState<string>('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [baseEndpoint] = useState('/inv/ventas');
  const [params, setParams] = useState<Record<string, any>>({});
  const [ventaSeleccionada, setVentaSeleccionada] = useState<FacturaVenta | null>(null);
  const [tipoImpresion, setTipoImpresion] = useState<'voucher' | 'a4' | null>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const a4Ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { navigateToTab } = useTabNavigate();

  const handlePrintVoucher = useReactToPrint({
    contentRef: voucherRef,
    documentTitle: `Voucher_${ventaSeleccionada?.numero_factura || 'factura'}`,
    onAfterPrint: () => {
      setVentaSeleccionada(null);
      setTipoImpresion(null);
    }
  });

  const handlePrintA4 = useReactToPrint({
    contentRef: a4Ref,
    documentTitle: `Factura_${ventaSeleccionada?.numero_factura || 'factura'}`,
    onAfterPrint: () => {
      setVentaSeleccionada(null);
      setTipoImpresion(null);
    }
  });

  const handlePrint = async (venta: FacturaVenta, tipo: 'voucher' | 'a4') => {
    try {
      // Obtener detalles completos de la venta
      const ventaCompleta = await FetchData(`/inv/ventas/${venta.id}`, 'GET');
      const ventaConDetalles = {
        ...ventaCompleta.venta,
        detalles: ventaCompleta.detalles || []
      };
      setVentaSeleccionada(ventaConDetalles);
      setTipoImpresion(tipo);

      // Esperar a que se renderice el componente antes de imprimir
      setTimeout(() => {
        if (tipo === 'voucher') {
          handlePrintVoucher();
        } else {
          handlePrintA4();
        }
      }, 100);
    } catch (error) {
      console.error('Error al obtener detalles de la venta:', error);
    }
  };

  const getClientes = async () => {
    try {
      const data = await FetchData('/inv/clientes', 'GET');
      setClientes(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    getClientes();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1, minWidth: 100 },
    { field: 'razon_social', headerName: 'Cliente', flex: 1, minWidth: 150 },
    { field: 'numero_factura', headerName: 'Número de Factura', flex: 1, minWidth: 150 },
    { field: 'fecha', headerName: 'Fecha', flex: 1, minWidth: 150 },
    {
      field: 'estado_pago',
      headerName: 'Estado Pago',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        //console.log(params.row);
        let color = 'default';
        if (params.row?.estado_pago === 'pendiente') color = 'warning';
        if (params.row?.estado_pago === 'pagado') color = 'success';
        if (params.row?.estado_pago === 'anulado') color = 'error';
        if (params.row?.estado_pago === 'parcial') color = 'info';
        return (
          <Box
            px={1}
            py={0.5}
            borderRadius={1}
            bgcolor={
              color === 'success'
                ? '#C8E6C9'
                : color === 'warning'
                  ? '#FFF9C4'
                  : color === 'error'
                    ? '#FFCDD2'
                    : color === 'info'
                      ? '#BBDEFB'
                      : '#F5F5F5'
            }
            color={
              color === 'success'
                ? '#388E3C'
                : color === 'warning'
                  ? '#FBC02D'
                  : color === 'error'
                    ? '#D32F2F'
                    : color === 'info'
                      ? '#1976D2'
                      : '#616161'
            }
            fontWeight={600}
            textAlign="center"
          >
            {params.row?.estado_pago?.charAt(0).toUpperCase() + params.row?.estado_pago?.slice(1)}
          </Box>
        );
      }
    },
    {
      field: 'valor_pagado',
      headerName: 'Valor Pagado',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography fontWeight={600} color={params.value < params.row.total ? 'error' : 'success'}>
          ${params.value?.toFixed(2)}
        </Typography>
      )
    },
    {
      field: 'plazo_pago',
      headerName: 'Plazo (días)',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => <Typography>{params.value > 0 ? params.value : '-'}</Typography>
    },
    {
      field: 'dias_atraso',
      headerName: 'Días atraso',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography
          color={params.value > 0 ? 'error' : 'inherit'}
          fontWeight={params.value > 0 ? 700 : 400}
        >
          {params.value > 0 ? params.value : '-'}
        </Typography>
      )
    },
    { field: 'autorizacion_sri', headerName: 'Autorización SRI', flex: 1, minWidth: 150 },
    {
      field: 'subtotal',
      headerName: 'Subtotal',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <Typography>${params.row.subtotal?.toFixed(2)}</Typography>
    },
    {
      field: 'iva',
      headerName: 'IVA',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <Typography>${params.row.iva?.toFixed(2)}</Typography>
    },
    {
      field: 'descuento',
      headerName: 'Descuento',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <Typography>${params.row.descuento?.toFixed(2)}</Typography>
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography fontWeight={700}>${params.row.total?.toFixed(2)}</Typography>
      )
    }
  ];

  const filterParams = () => {
    const params: Record<string, any> = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio.toISOString();
    if (fechaFin) params.fecha_fin = fechaFin.toISOString();
    if (clienteId) params.cliente_id = clienteId;
    if (estadoPago) params.estado_pago = estadoPago;
    setParams(params);
  };

  return (
    <Container>
      {/* Filtros */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          {/* Fecha Inicio */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Inicio"
              InputLabelProps={{ shrink: true }}
              value={fechaInicio?.toISOString().split('T')[0] || ''}
              onChange={(e) => setFechaInicio(e.target.value ? new Date(e.target.value) : null)}
            />
          </Grid>
          {/* Fecha Fin */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Fin"
              InputLabelProps={{ shrink: true }}
              value={fechaFin?.toISOString().split('T')[0] || ''}
              onChange={(e) => setFechaFin(e.target.value ? new Date(e.target.value) : null)}
            />
          </Grid>

          {/* Cliente */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={clienteId || ''}
                onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.razon_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Estado Pago */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Estado Pago</InputLabel>
              <Select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value as string)}>
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="pagado">Pagado</MenuItem>
                <MenuItem value="parcial">Parcial</MenuItem>
                <MenuItem value="anulado">Anulado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* Botón Filtrar */}
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ height: '100%' }}
              onClick={filterParams}
            >
              Filtrar
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tabla */}
      <CrudDataGrid<FacturaVenta>
        title="Factura Ventas"
        endpoint={baseEndpoint}
        mode="redirect"
        params={params}
        onEditClick={(id) =>
          navigateToTab(`/inventory/sale-management/show/${id.id}`, { customTitle: 'Ver Venta' })
        }
        columns={columns}
        onCreateClick={() => navigate('/inventory/sale-management/create')}
        exportToExcel
        buttons={(row) => (
          <Box display="flex" gap={1}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handlePrint(row, 'voucher')}
              title="Imprimir Voucher (Térmico)"
            >
              <ReceiptIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="secondary"
              onClick={() => handlePrint(row, 'a4')}
              title="Imprimir A4"
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      {/* Componentes de impresión ocultos */}
      <Box sx={{ display: 'none' }}>
        {ventaSeleccionada && tipoImpresion === 'voucher' && (
          <VoucherPrint
            ref={voucherRef}
            venta={ventaSeleccionada}
            empresa={{
              nombre: 'NOMBRE EMPRESA',
              ruc: '0000000000001',
              direccion: 'Dirección de la empresa',
              telefono: '0000000000',
              email: 'email@empresa.com'
            }}
          />
        )}
        {ventaSeleccionada && tipoImpresion === 'a4' && (
          <A4Print
            ref={a4Ref}
            venta={ventaSeleccionada}
            empresa={{
              nombre: 'NOMBRE EMPRESA',
              ruc: '0000000000001',
              direccion: 'Dirección de la empresa',
              telefono: '0000000000',
              email: 'email@empresa.com'
            }}
          />
        )}
      </Box>
    </Container>
  );
}
