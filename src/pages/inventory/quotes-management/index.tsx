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
  FormControl
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import { useNavigate } from 'react-router';
import { useTabNavigate } from '@/hooks';

type Quote = {
  id: number;
  cliente_id: number;
  razon_social?: string; // may not come from API, we'll map using clientes
  numero_cotizacion?: string;
  numero_factura?: string | null;
  fecha?: string | null; // prefer fecha_creacion from API
  fecha_creacion?: string | null;
  total: number;
  estado?: string; // maps from API `estado`
  estado_pago?: string; // keep existing if present
  valor_pagado?: number;
  plazo_pago?: number;
  subtotal?: number;
  iva?: number;
  descuento?: number;
  fecha_pago?: string | null;
};

export default function QuotesManagement() {
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [estadoPago, setEstadoPago] = useState<string>('');
  const [clientes, setClientes] = useState<any[]>([]);
  const baseEndpoint = '/inv/cotizaciones';
  const [params, setParams] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const { navigateToTab } = useTabNavigate();

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
    {
      field: 'cliente_id',
      headerName: 'Cliente',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const cliente = clientes.find((c) => c.id === params.value);
        return <Typography>{cliente?.razon_social || `#${params.value}`}</Typography>;
      }
    },
    { field: 'numero_cotizacion', headerName: 'Número Cotización', flex: 1, minWidth: 150 },
    {
      field: 'fecha_creacion',
      headerName: 'Fecha',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography>{params.value ? new Date(params.value).toLocaleDateString() : '-'}</Typography>
      )
    },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        //console.log(params.row);
        const val = params.row?.estado || params.row?.estado_pago || '';
        let color = 'default';
        if (val === 'pendiente' || val === 'PEN') color = 'warning';
        if (val === 'pagado' || val === 'ACT' || val === 'PAI') color = 'success';
        if (val === 'anulado' || val === 'ANU') color = 'error';
        if (val === 'parcial' || val === 'PAR') color = 'info';
        const label = val
          ? `${String(val).charAt(0).toUpperCase()}${String(val).slice(1).toLowerCase()}`
          : '-';
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
            {label}
          </Box>
        );
      }
    },
    {
      field: 'subtotal',
      headerName: 'Subtotal',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <Typography>{'$' + (params.row.subtotal ?? 0).toFixed(2)}</Typography>
    },
    {
      field: 'iva',
      headerName: 'IVA',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <Typography>{'$' + (params.row.iva ?? 0).toFixed(2)}</Typography>
    },
    {
      field: 'descuento',
      headerName: 'Descuento',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography>{'$' + (params.row.descuento ?? 0).toFixed(2)}</Typography>
      )
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography fontWeight={700}>{'$' + (params.row.total ?? 0).toFixed(2)}</Typography>
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
      <CrudDataGrid<Quote>
        title="Cotizaciones"
        endpoint={baseEndpoint}
        mode="redirect"
        params={params}
        onEditClick={(id) =>
          navigateToTab(`/inventory/quote-management/edit/${id.id}`, {
            customTitle: 'Editar Cotización'
          })
        }
        columns={columns}
        onCreateClick={() => navigate('/inventory/quote-management/create')}
        exportToExcel
      />
    </Container>
  );
}
