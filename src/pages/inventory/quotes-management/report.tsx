import { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import { Box, TextField, Typography, MenuItem, Button, Stack } from '@mui/material';
import { FetchData } from '@/utils/FetchData';

type Venta = {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  numero_factura: string;
  fecha: string;
  total: number;
  estado_pago: string;
  dias_atraso: number;
};

export default function VentasReporte() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
  const [params, setParams] = useState<Record<string, any>>({});

  const columns: GridColDef[] = [
    { field: 'numero_factura', headerName: 'Factura', flex: 1, minWidth: 120 },
    { field: 'cliente_nombre', headerName: 'Cliente', flex: 1, minWidth: 180 },
    { field: 'fecha', headerName: 'Fecha', flex: 1, minWidth: 120 },
    { field: 'total', headerName: 'Total', flex: 1, minWidth: 120 },
    { field: 'estado_pago', headerName: 'Estado Pago', flex: 1, minWidth: 150 },
    { field: 'dias_atraso', headerName: 'Días Atraso', flex: 1, minWidth: 120 }
  ];

  const getClients = async () => {
    const data = await FetchData('/inv/clientes');
    setClientes(data);
  };

  const getReportData = async (filters: Record<string, any> = {}) => {
    const query = new URLSearchParams(filters).toString();
    const data = await FetchData(`/inv/ventas_reporte`, 'GET', query);
    setVentas(data);
    setParams(filters);
  };

  useEffect(() => {
    getClients();
    getReportData();
  }, []);

  // Aplicar filtros
  const handleFilter = () => {
    const filters: Record<string, any> = {};
    if (fechaInicio) filters.fecha_inicio = fechaInicio;
    if (fechaFin) filters.fecha_fin = fechaFin;
    if (clienteId) filters.cliente_id = clienteId;
    getReportData(filters);
  };
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Reporte de Ventas
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField
          label="Fecha inicio"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
        <TextField
          label="Fecha fin"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />
        <TextField
          label="Cliente"
          select
          value={clienteId || ''}
          onChange={(e) => setClienteId(Number(e.target.value))}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {clientes.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.nombre}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleFilter}>
          Filtrar
        </Button>
      </Stack>

      <CrudDataGrid<Venta>
        title="Ventas"
        endpoint="/inv/ventas_reporte"
        mode="table"
        columns={columns}
        params={params}
        numericFields={[
          { field: 'total', type: 'column' },
          { field: 'dias_atraso', type: 'line' }
        ]}
        defaultFormValues={{}}
      />
    </Container>
  );
}
