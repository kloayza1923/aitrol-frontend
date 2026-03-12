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

type FacturaCompra = {
  id: number;
  producto_id: number;
  producto: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  precio_unitario: number;
  fecha: string;
  descripcion: string;
};

export default function ComprasList() {
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [proveedores, setProveedores] = useState<string[]>([]);
  const [baseEndpoint, setBaseEndpoint] = useState('/inv/compras');
  const location = useNavigate();
  const { navigateToTab } = useTabNavigate();
  const getProveedores = async () => {
    const data = await FetchData('/inv/proveedores', 'GET');
    setProveedores(data);
  };

  useEffect(() => {
    getProveedores();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1, minWidth: 100 },
    { field: 'proveedor_id', headerName: 'Proveedor', flex: 1, minWidth: 150 },
    { field: 'numero_factura', headerName: 'Número de Factura', flex: 1, minWidth: 150 },
    { field: 'fecha', headerName: 'Fecha', flex: 1, minWidth: 150 },
    { field: 'total', headerName: 'Total', flex: 1, minWidth: 150 }
  ];

  const filterParams = () => {
    const params: Record<string, any> = {};
    if (fechaInicio) params.fechaInicio = fechaInicio.toISOString();
    if (fechaFin) params.fechaFin = fechaFin.toISOString();
    if (proveedorId) params.proveedor_id = proveedorId;
    setBaseEndpoint('/inv/compras?' + new URLSearchParams(params).toString());
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
              <InputLabel>Proveedor</InputLabel>
              <Select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value as number)}
              >
                {proveedores.map((proveedor) => (
                  <MenuItem key={proveedor.id} value={proveedor.id}>
                    {proveedor.razon_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
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
      <CrudDataGrid<FacturaCompra>
        title="Factura Compras"
        endpoint={baseEndpoint}
        mode="redirect"
        onEditClick={(id) => {
          navigateToTab(`/inventory/purchase-management/show/${id.id}`, {
            customTitle: 'Ver Compra'
          });
        }}
        columns={columns}
        onCreateClick={() => location('/inventory/purchase-management/create')}
        exportToExcel
      />
    </Container>
  );
}
