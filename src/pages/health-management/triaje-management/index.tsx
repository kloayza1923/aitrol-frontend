import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Chip,
  Card,
  CardContent,
  Divider,
  Slider,
  InputAdornment
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { FetchData } from '@/utils/FetchData';
import { useNotification } from '@/hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import * as Yup from 'yup';

interface PacienteOption {
  id: number;
  codigo_paciente?: string;
  persona?: {
    nombre_completo?: string;
    identificacion?: string;
  } | null;
}

interface CitaPendiente {
  cita_id: number;
  paciente_id: number;
  personal_id: number;
  fecha_hora: string;
  motivo: string;
  estado: string;
  paciente: {
    id: number;
    nombre_completo: string;
    codigo_paciente: string;
    identificacion: string;
  };
  doctor: {
    id: number;
    nombre_completo: string;
    especialidad: string;
  };
}

interface TriajeRecord {
  id?: number;
  paciente_id?: number;
  personal_id?: number;
  fecha_hora?: string;
  temperatura?: number | null;
  presion_sistolica?: number | null;
  presion_diastolica?: number | null;
  frecuencia_cardiaca?: number | null;
  frecuencia_respiratoria?: number | null;
  saturacion_oxigeno?: number | null;
  glicemia?: number | null;
  nivel_dolor?: number | null;
  clasificacion?: string | null;
  observaciones?: string | null;
  paciente?: {
    nombre_completo?: string;
    codigo_paciente?: string;
    identificacion?: string;
  };
}

const CLASIFICACION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ROJO: { bg: '#ef4444', text: 'white', label: 'Emergencia - Atención Inmediata' },
  NARANJA: { bg: '#f97316', text: 'white', label: 'Muy Urgente - 10 min' },
  AMARILLO: { bg: '#eab308', text: 'black', label: 'Urgente - 60 min' },
  VERDE: { bg: '#22c55e', text: 'white', label: 'Menos Urgente - 120 min' },
  AZUL: { bg: '#3b82f6', text: 'white', label: 'No Urgente - 240 min' }
};

const CLASIFICACIONES = ['ROJO', 'NARANJA', 'AMARILLO', 'VERDE', 'AZUL'];

const dolorMarks = [
  { value: 0, label: '0' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
  { value: 6, label: '6' },
  { value: 8, label: '8' },
  { value: 10, label: '10' }
];

const triajeSchema = Yup.object().shape({
  paciente_id: Yup.number().required('El paciente es requerido'),
  temperatura: Yup.number().nullable().min(30, 'Mínimo 30°C').max(45, 'Máximo 45°C'),
  presion_sistolica: Yup.number().nullable().min(50, 'Mínimo 50').max(300, 'Máximo 300'),
  presion_diastolica: Yup.number().nullable().min(30, 'Mínimo 30').max(200, 'Máximo 200'),
  frecuencia_cardiaca: Yup.number().nullable().min(20, 'Mínimo 20').max(300, 'Máximo 300'),
  frecuencia_respiratoria: Yup.number().nullable().min(5, 'Mínimo 5').max(60, 'Máximo 60'),
  saturacion_oxigeno: Yup.number().nullable().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
  glicemia: Yup.number().nullable().min(0, 'Mínimo 0').max(600, 'Máximo 600'),
  nivel_dolor: Yup.number().nullable().min(0, 'Mínimo 0').max(10, 'Máximo 10'),
  clasificacion: Yup.string().oneOf(CLASIFICACIONES, 'Clasificación inválida'),
  observaciones: Yup.string().nullable()
});

export default function TriajeManagementPage() {
  const notification = useNotification();
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [pacienteSearch, setPacienteSearch] = useState('');

  const [citasPendientes, setCitasPendientes] = useState<CitaPendiente[]>([]);
  const [loadingPendientes, setLoadingPendientes] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const notificationRef = useRef(notification);

  const loadPendientes = useCallback(async () => {
    setLoadingPendientes(true);
    try {
      const data = await FetchData('/salud/triajes/pendientes', 'GET');
      setCitasPendientes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando pendientes', e);
      notificationRef.current.error('Error', 'No se pudieron cargar las citas pendientes');
    } finally {
      setLoadingPendientes(false);
    }
  }, []);

  useEffect(() => {
    loadPendientes();
  }, [loadPendientes]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoadingPacientes(true);
      try {
        const data = await FetchData('/salud/pacientes', 'GET', {
          page: 1,
          limit: 50,
          search: pacienteSearch || undefined
        });
        setPacientes(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error buscando pacientes', e);
      } finally {
        setLoadingPacientes(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [pacienteSearch]);

  const handleRefresh = useCallback(() => {
    loadPendientes();
    setRefreshKey((prev) => prev + 1);
  }, [loadPendientes]);

  const pacienteLabel = (p: PacienteOption) => {
    const nombre = p.persona?.nombre_completo || 'Sin nombre';
    const codigo = p.codigo_paciente ? ` (${p.codigo_paciente})` : '';
    return `${nombre}${codigo}`;
  };

  const getClasificacionColor = (clasificacion: string) => {
    return CLASIFICACION_COLORS[clasificacion] || { bg: '#64748b', text: 'white' };
  };

  const columns: GridColDef<TriajeRecord>[] = [
    {
      field: 'fecha_hora',
      headerName: 'Fecha/Hora',
      width: 150,
      valueFormatter: (value) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '-')
    },
    {
      field: 'paciente',
      headerName: 'Paciente',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (value, row) => row.paciente?.nombre_completo || '',
      renderCell: (params: GridRenderCellParams<TriajeRecord>) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.row.paciente?.nombre_completo || '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.paciente?.codigo_paciente}
          </Typography>
        </Box>
      )
    },
    {
      field: 'presion',
      headerName: 'PA',
      width: 100,
      valueGetter: (value, row) =>
        row.presion_sistolica && row.presion_diastolica
          ? `${row.presion_sistolica}/${row.presion_diastolica}`
          : '-'
    },
    {
      field: 'frecuencia_cardiaca',
      headerName: 'FC',
      width: 80,
      valueFormatter: (value) => (value ? `${value}` : '-')
    },
    {
      field: 'temperatura',
      headerName: 'T°',
      width: 80,
      valueFormatter: (value) => (value ? `${value}°` : '-')
    },
    {
      field: 'saturacion_oxigeno',
      headerName: 'SpO2',
      width: 80,
      valueFormatter: (value) => (value ? `${value}%` : '-')
    },
    {
      field: 'nivel_dolor',
      headerName: 'Dolor',
      width: 70,
      valueFormatter: (value) => (value !== null && value !== undefined ? `${value}/10` : '-')
    },
    {
      field: 'clasificacion',
      headerName: 'Clasificación',
      width: 130,
      renderCell: (params: GridRenderCellParams<TriajeRecord>) => {
        const clasificacion = params.value as string;
        if (!clasificacion) return '-';
        const colors = getClasificacionColor(clasificacion);
        return (
          <Chip
            label={clasificacion}
            size="small"
            sx={{
              bgcolor: colors.bg,
              color: colors.text,
              fontWeight: 'bold'
            }}
          />
        );
      }
    }
  ];

  return (
    <Container>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospitalIcon color="primary" />
            Triaje de Enfermería
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registro de signos vitales y clasificación de pacientes
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
          Actualizar
        </Button>
      </Box>

      {/* Panel de citas pendientes */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon color="warning" />
          Citas Pendientes de Triaje Hoy ({citasPendientes.length})
        </Typography>

        {loadingPendientes ? (
          <Typography color="text.secondary">Cargando...</Typography>
        ) : citasPendientes.length === 0 ? (
          <Typography color="text.secondary">No hay citas pendientes de triaje</Typography>
        ) : (
          <Grid container spacing={2}>
            {citasPendientes.slice(0, 6).map((cita) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={cita.cita_id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover', transform: 'scale(1.02)' },
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s'
                  }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" fontWeight="medium" noWrap>
                      {cita.paciente?.nombre_completo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {cita.paciente?.identificacion}
                    </Typography>
                    <Chip
                      label={format(new Date(cita.fecha_hora), 'HH:mm', { locale: es })}
                      size="small"
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {citasPendientes.length > 6 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  +{citasPendientes.length - 6} citas más pendientes
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      {/* Grid principal de triajes */}
      <CrudDataGrid<TriajeRecord>
        key={refreshKey}
        title="Triajes Registrados"
        endpoint="/salud/triajes"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          paciente_id: undefined,
          temperatura: null,
          presion_sistolica: null,
          presion_diastolica: null,
          frecuencia_cardiaca: null,
          frecuencia_respiratoria: null,
          saturacion_oxigeno: null,
          glicemia: null,
          nivel_dolor: 0,
          clasificacion: 'VERDE',
          observaciones: ''
        }}
        schema={triajeSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => {
          const selectedPaciente = pacientes.find(
            (p) => String(p.id) === String(formValues.paciente_id)
          );

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Selección de Paciente */}
              <Autocomplete
                options={pacientes}
                loading={loadingPacientes}
                value={selectedPaciente || null}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input') {
                    setPacienteSearch(newInputValue);
                  }
                }}
                onChange={(_, newValue) => {
                  setFormValues((prev: TriajeRecord) => ({
                    ...prev,
                    paciente_id: newValue?.id || undefined
                  }));
                }}
                filterOptions={(x) => x}
                getOptionLabel={(option) => pacienteLabel(option)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Paciente *"
                    error={Boolean(errors?.paciente_id)}
                    helperText={errors?.paciente_id}
                    placeholder="Buscar paciente..."
                  />
                )}
              />

              <Divider />
              <Typography variant="subtitle2" color="text.secondary">
                Signos Vitales
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Temperatura"
                    name="temperatura"
                    type="number"
                    value={formValues.temperatura ?? ''}
                    onChange={handleChange}
                    error={Boolean(errors?.temperatura)}
                    helperText={errors?.temperatura}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ThermostatIcon fontSize="small" color="error" />
                        </InputAdornment>
                      ),
                      endAdornment: <InputAdornment position="end">°C</InputAdornment>
                    }}
                    inputProps={{ step: '0.1', min: '30', max: '45' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Saturación O2"
                    name="saturacion_oxigeno"
                    type="number"
                    value={formValues.saturacion_oxigeno ?? ''}
                    onChange={handleChange}
                    error={Boolean(errors?.saturacion_oxigeno)}
                    helperText={errors?.saturacion_oxigeno}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AirIcon fontSize="small" color="info" />
                        </InputAdornment>
                      ),
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    inputProps={{ min: '0', max: '100' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="PA Sistólica"
                    name="presion_sistolica"
                    type="number"
                    value={formValues.presion_sistolica ?? ''}
                    onChange={handleChange}
                    error={Boolean(errors?.presion_sistolica)}
                    helperText={errors?.presion_sistolica}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <WaterDropIcon fontSize="small" color="error" />
                        </InputAdornment>
                      ),
                      endAdornment: <InputAdornment position="end">mmHg</InputAdornment>
                    }}
                    inputProps={{ min: '50', max: '300' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="PA Diastólica"
                    name="presion_diastolica"
                    type="number"
                    value={formValues.presion_diastolica ?? ''}
                    onChange={handleChange}
                    error={Boolean(errors?.presion_diastolica)}
                    helperText={errors?.presion_diastolica}
                    fullWidth
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mmHg</InputAdornment>
                    }}
                    inputProps={{ min: '30', max: '200' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Frec. Cardíaca"
                    name="frecuencia_cardiaca"
                    type="number"
                    value={formValues.frecuencia_cardiaca ?? ''}
                    onChange={handleChange}
                    error={Boolean(errors?.frecuencia_cardiaca)}
                    helperText={errors?.frecuencia_cardiaca}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FavoriteIcon fontSize="small" color="error" />
                        </InputAdornment>
                      ),
                      endAdornment: <InputAdornment position="end">lpm</InputAdornment>
                    }}
                    inputProps={{ min: '20', max: '300' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Frec. Respiratoria"
                    name="frecuencia_respiratoria"
                    type="number"
                    value={formValues.frecuencia_respiratoria ?? ''}
                    onChange={handleChange}
                    error={Boolean(errors?.frecuencia_respiratoria)}
                    helperText={errors?.frecuencia_respiratoria}
                    fullWidth
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">rpm</InputAdornment>
                    }}
                    inputProps={{ min: '5', max: '60' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Glicemia"
                    name="glicemia"
                    type="number"
                    value={formValues.glicemia ?? ''}
                    onChange={handleChange}
                    error={Boolean(errors?.glicemia)}
                    helperText={errors?.glicemia}
                    fullWidth
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mg/dL</InputAdornment>
                    }}
                    inputProps={{ min: '0', max: '600' }}
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* Nivel de Dolor */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Nivel de Dolor (EVA): {formValues.nivel_dolor ?? 0}
                </Typography>
                <Slider
                  value={formValues.nivel_dolor ?? 0}
                  onChange={(_, value) => {
                    setFormValues((prev: TriajeRecord) => ({
                      ...prev,
                      nivel_dolor: value as number
                    }));
                  }}
                  min={0}
                  max={10}
                  step={1}
                  marks={dolorMarks}
                  valueLabelDisplay="auto"
                  sx={{
                    '& .MuiSlider-thumb': {
                      bgcolor:
                        (formValues.nivel_dolor ?? 0) <= 3
                          ? 'success.main'
                          : (formValues.nivel_dolor ?? 0) <= 6
                            ? 'warning.main'
                            : 'error.main'
                    },
                    '& .MuiSlider-track': {
                      bgcolor:
                        (formValues.nivel_dolor ?? 0) <= 3
                          ? 'success.main'
                          : (formValues.nivel_dolor ?? 0) <= 6
                            ? 'warning.main'
                            : 'error.main'
                    }
                  }}
                />
              </Box>

              <Divider />

              {/* Clasificación Manchester */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Clasificación de Triaje (Manchester)
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(CLASIFICACION_COLORS).map(([key, value]) => (
                    <Grid item xs={12} key={key}>
                      <Button
                        fullWidth
                        variant={formValues.clasificacion === key ? 'contained' : 'outlined'}
                        onClick={() => {
                          setFormValues((prev: TriajeRecord) => ({
                            ...prev,
                            clasificacion: key
                          }));
                        }}
                        size="small"
                        sx={{
                          justifyContent: 'flex-start',
                          bgcolor: formValues.clasificacion === key ? value.bg : 'transparent',
                          color: formValues.clasificacion === key ? value.text : value.bg,
                          borderColor: value.bg,
                          '&:hover': {
                            bgcolor: formValues.clasificacion === key ? value.bg : `${value.bg}20`,
                            borderColor: value.bg
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: value.bg
                            }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {key}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            - {value.label}
                          </Typography>
                        </Box>
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <TextField
                label="Observaciones"
                name="observaciones"
                value={formValues.observaciones ?? ''}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Notas adicionales del triaje..."
              />
            </Box>
          );
        }}
      />
    </Container>
  );
}
