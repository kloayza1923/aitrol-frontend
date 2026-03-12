import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  MenuItem,
  Button,
  Box,
  Grid,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState, useMemo } from 'react';
import { FetchData } from '@/utils/FetchData';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';

type UtilidadItem = {
  producto_id: number;
  producto_nombre: string;
  ingreso: number;
  costo: number;
  utilidad: number;
};

export default function ReporteUtilidad() {
  const [almacenes, setAlmacenes] = useState<{ id: number; nombre: string }[]>([]);
  const [almacenId, setAlmacenId] = useState<number | ''>('');
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().slice(0, 10));
  const [baseEndpoint, setBaseEndpoint] = useState('/inv/reporte_utilidad');

  // Traer almacenes para filtro
  const getAlmacenes = async () => {
    const data = await FetchData('/inv/almacenes');
    setAlmacenes(data);
  };

  useEffect(() => {
    getAlmacenes();
  }, []);

  const columns: GridColDef[] = [
    { field: 'producto_id', headerName: 'ID Producto', flex: 1, minWidth: 100 },
    { field: 'producto_nombre', headerName: 'Producto', flex: 2, minWidth: 200 },
    {
      field: 'ingreso',
      headerName: 'Ingreso ($)',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => params.value?.toFixed(2)
    },
    {
      field: 'costo',
      headerName: 'Costo ($)',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => params.value?.toFixed(2)
    },
    {
      field: 'utilidad',
      headerName: 'Utilidad ($)',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => params.value?.toFixed(2)
    }
  ];

  const filterParams = () => {
    const searchParams = new URLSearchParams();
    if (almacenId) searchParams.append('almacen_id', String(almacenId));
    if (fechaInicio) searchParams.append('fecha_inicio', fechaInicio);
    if (fechaFin) searchParams.append('fecha_fin', fechaFin);
    setBaseEndpoint(`/inv/reporte_utilidad?${searchParams.toString()}`);
  };

  return (
    <Container>
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          {/* Filtro almacén */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Almacén</InputLabel>
              <Select value={almacenId} onChange={(e) => setAlmacenId(e.target.value as number)}>
                <MenuItem value="">Todos</MenuItem>
                {almacenes.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro fechas */}
          <Grid item xs={12} sm={3}>
            <TextField
              type="date"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              type="date"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </Grid>

          {/* Botón filtrar */}
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

      <CrudDataGrid<UtilidadItem>
        title="Reporte de Utilidad"
        endpoint={baseEndpoint}
        mode="table"
        numericFields={[
          {
            field: 'ingreso',
            type: 'column'
          },
          {
            field: 'costo',
            type: 'column'
          },
          {
            field: 'utilidad',
            type: 'column'
          }
        ]}
        columns={columns}
        exportToExcel
      />
    </Container>
  );
}
