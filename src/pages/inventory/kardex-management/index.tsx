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
import { useLocation, useNavigate } from 'react-router';
type MovimientoDetalle = {
  producto_id: number;
  cantidad: number;
  precio_unitario?: number;
};

type Movimiento = {
  id: number;
  tipo_movimiento_id: number; // puede mapear a string si quieres
  fecha_movimiento: string;
  proveedor_id?: number | null;
  cliente_id?: number | null;
  observaciones?: string | null;
  estado: string;
  detalles: MovimientoDetalle[];
};

export default function KardexList() {
  const navigate = useNavigate();
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [tiposMovimiento, setTiposMovimiento] = useState<string[]>([]);
  const [proveedores, setProveedores] = useState<{ id: number; nombre: string }[]>([]);
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
  const [estado, setEstado] = useState<string | ''>('');
  const [baseEndpoint, setBaseEndpoint] = useState('/inv/movimientos');

  // Fetch proveedores y clientes para filtros (asumiendo endpoints)
  const getProveedores = async () => {
    const data = await FetchData('/inv/proveedores');
    setProveedores(data);
  };
  const getClientes = async () => {
    const data = await FetchData('/inv/clientes');
    setClientes(data);
  };

  useEffect(() => {
    getProveedores();
    getClientes();
  }, []);

  // Mapear tipo_movimiento_id a string para mostrar en tabla
  const tipoMap: Record<number, string> = {
    1: 'entrada',
    2: 'salida',
    3: 'ajuste'
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1, minWidth: 100 },
    {
      field: 'tipo_movimiento_id',
      headerName: 'Tipo Movimiento',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => tipoMap[params] || 'Desconocido'
    },
    { field: 'fecha_movimiento', headerName: 'Fecha', flex: 1, minWidth: 150 },
    {
      field: 'observaciones',
      headerName: 'Observaciones',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => params.value || '-'
    },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 120 },

    // Para mostrar detalles (puedes hacerlo expandible en tu componente CrudDataGrid)
    {
      field: 'detalles',
      headerName: 'Detalles',
      flex: 2,
      minWidth: 300,
      renderCell: (params) => {
        const detalles: MovimientoDetalle[] = params.value || [];
        return (
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {detalles.map((d, i) => (
              <li key={i}>
                Producto ID: {d.producto_id}, Cantidad: {d.cantidad}, Precio:{' '}
                {d.precio_unitario ?? '-'}
              </li>
            ))}
          </ul>
        );
      }
    }
  ];

  const filterParams = () => {
    const params: Record<string, any> = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio.toISOString();
    if (fechaFin) params.fecha_fin = fechaFin.toISOString();
    if (tiposMovimiento.length > 0) params.tipo = tiposMovimiento; // backend acepta tipo único, tal vez enviar solo uno?
    if (estado) params.estado = estado;
    // Si quieres filtrar por proveedor y cliente agrega aquí:
    // if(proveedorId) params.proveedor_id = proveedorId;
    // if(clienteId) params.cliente_id = clienteId;

    // Maneja tipo (array) para query string
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    });

    setBaseEndpoint(`/inv/movimientos?${searchParams.toString()}`);
  };

  return (
    <Container>
      {/* Filtros */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
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
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Movimiento</InputLabel>
              <Select
                multiple
                value={tiposMovimiento}
                onChange={(e) => setTiposMovimiento(e.target.value as string[])}
              >
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="salida">Salida</MenuItem>
                <MenuItem value="ajuste">Ajuste</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* Nuevo filtro para estado */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="completado">Completado</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Puedes agregar más filtros para proveedor, cliente si quieres */}

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
      <CrudDataGrid<Movimiento>
        title="Movimientos"
        endpoint={baseEndpoint}
        mode="redirect"
        onCreateClick={() => navigate('/inventory/kardex-management/create')}
        showEdit={false}
        columns={columns}
        exportToExcel
      />
    </Container>
  );
}
