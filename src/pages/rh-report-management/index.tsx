import { useState, useMemo, useEffect } from 'react';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import {
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Typography,
  Stack
} from '@mui/material';
import { FetchData } from '@/utils/FetchData';

export default function ReportesRRHH() {
  const [reporte, setReporte] = useState('empleados');

  // Estado para filtros temporales (inputs)
  const [tempFiltros, setTempFiltros] = useState<Record<string, any>>({});

  // Estado filtros usados para fetch (endpoint)
  const [filtros, setFiltros] = useState<Record<string, any>>({});

  // Define columnas y título según reporte
  const { columns, title, baseEndpoint } = useMemo(() => {
    switch (reporte) {
      case 'empleados':
        return {
          title: 'Reporte de Empleados',
          baseEndpoint: '/reportes/empleados',
          columns: [
            { field: 'cedula', headerName: 'Cédula', flex: 1, minWidth: 120 },
            { field: 'nombres', headerName: 'Nombres', flex: 1, minWidth: 180 },
            { field: 'apellidos', headerName: 'Apellidos', flex: 1, minWidth: 180 },
            { field: 'cargo', headerName: 'Cargo', flex: 1, minWidth: 150 },
            {
              field: 'sueldo_basico',
              headerName: 'Sueldo Básico',
              flex: 1,
              minWidth: 130,
              valueFormatter: (params) => `$${params.value?.toFixed(2)}`
            },
            {
              field: 'estado',
              headerName: 'Activo',
              flex: 1,
              minWidth: 100,
              valueFormatter: (params) => (params.value ? 'Sí' : 'No')
            }
          ] as GridColDef[]
        };
      case 'permisos':
        return {
          title: 'Reporte de Permisos',
          baseEndpoint: '/reportes/permisos',
          columns: [
            { field: 'empleado', headerName: 'Empleado', flex: 1, minWidth: 180 },
            { field: 'tipo_permiso', headerName: 'Tipo Permiso', flex: 1, minWidth: 150 },
            { field: 'motivo', headerName: 'Motivo', flex: 1, minWidth: 200 },
            { field: 'fecha_inicio', headerName: 'Inicio', flex: 1, minWidth: 120 },
            { field: 'fecha_fin', headerName: 'Fin', flex: 1, minWidth: 120 },
            { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 120 }
          ] as GridColDef[]
        };
      case 'roles':
        return {
          title: 'Reporte de Roles de Pago',
          baseEndpoint: '/reportes/roles-pago',
          columns: [
            { field: 'tipo_rol', headerName: 'Tipo Rol', flex: 1, minWidth: 150 },
            { field: 'fecha_generacion', headerName: 'Generado', flex: 1, minWidth: 150 },
            { field: 'mes_correspondiente', headerName: 'Mes', flex: 1, minWidth: 100 },
            { field: 'anio_correspondiente', headerName: 'Año', flex: 1, minWidth: 100 },
            { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 120 }
          ] as GridColDef[]
        };
      case 'marcaciones':
        return {
          title: 'Reporte de Marcaciones',
          baseEndpoint: '/reportes/marcaciones',
          columns: [
            { field: 'empleado', headerName: 'Empleado', flex: 1, minWidth: 180 },
            { field: 'tipo', headerName: 'Tipo', flex: 1, minWidth: 120 },
            {
              field: 'latitud',
              headerName: 'Latitud',
              flex: 1,
              minWidth: 120,
              valueFormatter: (params) => params.value?.toFixed(4)
            },
            {
              field: 'longitud',
              headerName: 'Longitud',
              flex: 1,
              minWidth: 120,
              valueFormatter: (params) => params.value?.toFixed(4)
            },
            {
              field: 'timestamp',
              headerName: 'Fecha/Hora',
              flex: 1,
              minWidth: 180,
              valueFormatter: (params) =>
                new Date(String(params.value).replace(' ', 'T')).toLocaleString()
            }
          ] as GridColDef[]
        };
      default:
        return { title: '', baseEndpoint: '', columns: [] as GridColDef[] };
    }
  }, [reporte]);

  const [area, setArea] = useState<string | null>(null);
  const [jefe, setJefe] = useState<string | null>(null);
  const [empleado, setEmpleado] = useState<string | null>(null);

  const getFilterData = () => {
    const a = FetchData('/rrhh/areas');
    const j = FetchData('/rrhh/empleados');
    const e = FetchData('/rrhh/empleados');
    return Promise.all([a, j, e]).then(([areas, jefes, empleados]) => ({
      areas,
      jefes,
      empleados
    }));
  };

  useEffect(() => {
    getFilterData().then((data) => {
      setArea(data.areas);
      setJefe(data.jefes);
      setEmpleado(data.empleados);
    });
  }, []);

  // Construir endpoint con filtros actuales
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return baseEndpoint + (params.toString() ? `?${params.toString()}` : '');
  }, [filtros, baseEndpoint]);

  // Renderizar filtros según reporte
  function renderFiltros() {
    const commonBoxStyles = {
      display: 'flex',
      gap: 2,
      mb: 3,
      flexWrap: 'wrap',
      alignItems: 'center'
    };

    switch (reporte) {
      case 'empleados':
        return (
          <Box sx={{ ...commonBoxStyles, flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tempFiltros.activos === 'true'}
                    onChange={(e) =>
                      setTempFiltros((prev) => ({
                        ...prev,
                        activos: e.target.checked ? 'true' : ''
                      }))
                    }
                  />
                }
                label="Solo Activos"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Área */}
              <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                <InputLabel id="select-area-label">Área</InputLabel>
                <Select
                  labelId="select-area-label"
                  value={tempFiltros.area_id || ''}
                  label="Área"
                  onChange={(e) => setTempFiltros((prev) => ({ ...prev, area_id: e.target.value }))}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {Array.isArray(area) &&
                    area.map((a: any) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.nombre || `${a.id}`}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              {/* Jefe */}
              <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                <InputLabel id="select-jefe-label">Jefe</InputLabel>
                <Select
                  labelId="select-jefe-label"
                  value={tempFiltros.jefe_id || ''}
                  label="Jefe"
                  onChange={(e) => setTempFiltros((prev) => ({ ...prev, jefe_id: e.target.value }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Array.isArray(jefe) &&
                    jefe.map((j: any) => (
                      <MenuItem key={j.id} value={j.id}>
                        {j.nombres} {j.apellidos}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => setFiltros(tempFiltros)}>
                Buscar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setTempFiltros({});
                  setFiltros({});
                }}
              >
                Limpiar Filtros
              </Button>
            </Box>
          </Box>
        );

      case 'permisos':
        return (
          <Box sx={{ ...commonBoxStyles, flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Empleado */}
              <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                <InputLabel id="select-empleado-label">Empleado</InputLabel>
                <Select
                  labelId="select-empleado-label"
                  value={tempFiltros.empleado_id || ''}
                  label="Empleado"
                  onChange={(e) =>
                    setTempFiltros((prev) => ({ ...prev, empleado_id: e.target.value }))
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Array.isArray(empleado) &&
                    empleado.map((emp: any) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.nombres} {emp.apellidos}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              {/* Estado */}
              <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                <InputLabel id="select-estado-permisos-label">Estado</InputLabel>
                <Select
                  labelId="select-estado-permisos-label"
                  value={tempFiltros.estado || ''}
                  label="Estado"
                  onChange={(e) => setTempFiltros((prev) => ({ ...prev, estado: e.target.value }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="aprobado">Aprobado</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={tempFiltros.fecha_inicio || ''}
                onChange={(e) =>
                  setTempFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value }))
                }
                sx={{ flex: 1, minWidth: 180 }}
              />
              <TextField
                label="Fecha Fin"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={tempFiltros.fecha_fin || ''}
                onChange={(e) => setTempFiltros((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                sx={{ flex: 1, minWidth: 180 }}
              />
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => setFiltros(tempFiltros)}>
                Buscar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setTempFiltros({});
                  setFiltros({});
                }}
              >
                Limpiar Filtros
              </Button>
            </Box>
          </Box>
        );

      case 'roles':
        return (
          <Box sx={{ ...commonBoxStyles, flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Mes"
                type="number"
                size="small"
                inputProps={{ min: 1, max: 12 }}
                value={tempFiltros.mes || ''}
                onChange={(e) => setTempFiltros((prev) => ({ ...prev, mes: e.target.value }))}
                sx={{ minWidth: 120, flex: 1 }}
              />
              <TextField
                label="Año"
                type="number"
                size="small"
                inputProps={{ min: 2000, max: 2100 }}
                value={tempFiltros.anio || ''}
                onChange={(e) => setTempFiltros((prev) => ({ ...prev, anio: e.target.value }))}
                sx={{ minWidth: 120, flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                <InputLabel id="select-estado-roles-label">Estado</InputLabel>
                <Select
                  labelId="select-estado-roles-label"
                  value={tempFiltros.estado || ''}
                  label="Estado"
                  onChange={(e) => setTempFiltros((prev) => ({ ...prev, estado: e.target.value }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="pagado">Pagado</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => setFiltros(tempFiltros)}>
                Buscar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setTempFiltros({});
                  setFiltros({});
                }}
              >
                Limpiar Filtros
              </Button>
            </Box>
          </Box>
        );

      case 'marcaciones':
        return (
          <Box sx={{ ...commonBoxStyles, flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                <InputLabel id="select-empleado-marc-label">Empleado</InputLabel>
                <Select
                  labelId="select-empleado-marc-label"
                  value={tempFiltros.empleado_id || ''}
                  label="Empleado"
                  onChange={(e) =>
                    setTempFiltros((prev) => ({ ...prev, empleado_id: e.target.value }))
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Array.isArray(empleado) &&
                    empleado.map((emp: any) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.nombres} {emp.apellidos}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={tempFiltros.fecha_inicio || ''}
                onChange={(e) =>
                  setTempFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value }))
                }
                sx={{ flex: 1, minWidth: 180 }}
              />
              <TextField
                label="Fecha Fin"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={tempFiltros.fecha_fin || ''}
                onChange={(e) => setTempFiltros((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                sx={{ flex: 1, minWidth: 180 }}
              />
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => setFiltros(tempFiltros)}>
                Buscar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setTempFiltros({});
                  setFiltros({});
                }}
              >
                Limpiar Filtros
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  }

  return (
    <Container>
      {/* Selector reporte */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="select-reporte-label">Seleccionar Reporte</InputLabel>
          <Select
            labelId="select-reporte-label"
            value={reporte}
            label="Seleccionar Reporte"
            onChange={(e) => {
              setReporte(e.target.value);
              setTempFiltros({});
              setFiltros({});
            }}
          >
            <MenuItem value="empleados">Empleados</MenuItem>
            <MenuItem value="permisos">Permisos</MenuItem>
            <MenuItem value="roles">Roles de Pago</MenuItem>
            <MenuItem value="marcaciones">Marcaciones</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Filtros dinámicos */}
      <Stack spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Filtros para {title}
        </Typography>
      </Stack>
      {renderFiltros()}

      {/* Grid con datos */}
      <CrudDataGrid
        key={`reporte-${reporte} - ${endpoint}`} // Forzar re-render al cambiar reporte o filtros
        title={title}
        endpoint={endpoint}
        mode="list"
        columns={columns}
        showEdit={false}
        exportToExcel
      />
    </Container>
  );
}
