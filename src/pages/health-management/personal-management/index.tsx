import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  Switch,
  FormControlLabel,
  Autocomplete,
  MenuItem,
  Chip,
  Box,
  Typography,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { personalSchema } from '@/validations/HealthValidation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FetchData } from '@/utils/FetchData';

type Persona = {
  id: number;
  identificacion: string;
  nombre_completo: string;
  tipo_identificacion: string;
  telefono_movil?: string;
  email?: string;
};

type Personal = {
  id?: number;
  persona_id: number;
  codigo_personal?: string;
  tipo_personal?: string;
  sis_sucursal_id?: number;
  especialidad?: string;
  registro_senescyt?: string;
  registro_msp?: string;
  licencia_activa?: boolean;
  disponibilidad?: any; // JSON
  correo_institucional?: string;
  telefono_institucional?: string;
  usuario_id?: number;
  persona?: Persona;
};

const TIPOS_PERSONAL = [
  'MEDICO',
  'ENFERMERA',
  'TECNICO',
  'LABORATORISTA',
  'RADIOLOGO',
  'ANESTESIOLOGO',
  'FARMACEUTICO',
  'ADMINISTRATIVO',
  'OTRO'
];

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export default function PersonalList() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setLoadingPersonas(true);
    try {
      const response = await FetchData<any>('/salud/personas', 'GET');
      setPersonas(response.items || []);
    } catch (error) {
      console.error('Error cargando personas:', error);
    } finally {
      setLoadingPersonas(false);
    }
  };

  const columns: GridColDef<Personal>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'codigo_personal',
      headerName: 'Código',
      flex: 0.8,
      minWidth: 120
    },
    {
      field: 'persona',
      headerName: 'Personal',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Personal>) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.row.persona?.nombre_completo || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.persona?.identificacion || ''}
          </Typography>
        </Box>
      )
    },
    {
      field: 'tipo_personal',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams<Personal>) => {
        const colorMap: Record<string, any> = {
          MEDICO: 'primary',
          ENFERMERA: 'secondary',
          TECNICO: 'info',
          LABORATORISTA: 'warning',
          ADMINISTRATIVO: 'default'
        };
        return params.value ? (
          <Chip label={params.value} size="small" color={colorMap[params.value] || 'default'} />
        ) : null;
      }
    },
    {
      field: 'especialidad',
      headerName: 'Especialidad',
      flex: 1,
      minWidth: 160
    },
    {
      field: 'licencia_activa',
      headerName: 'Licencia',
      width: 100,
      renderCell: (params: GridRenderCellParams<Personal>) => (
        <Chip
          label={params.value ? 'Activa' : 'Inactiva'}
          size="small"
          color={params.value ? 'success' : 'error'}
          variant="outlined"
        />
      )
    },
    {
      field: 'correo_institucional',
      headerName: 'Email',
      flex: 1,
      minWidth: 180
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Personal>
        title="Personal"
        endpoint="/salud/personal"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          persona_id: 0,
          codigo_personal: '',
          tipo_personal: '',
          sis_sucursal_id: undefined,
          especialidad: '',
          registro_senescyt: '',
          registro_msp: '',
          licencia_activa: true,
          disponibilidad: {},
          correo_institucional: '',
          telefono_institucional: '',
          usuario_id: undefined
        }}
        schema={personalSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => {
          const selectedPersona = personas.find((p) => p.id === formValues.persona_id);

          return (
            <>
              {errors && Object.keys(errors).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {Object.entries(errors).map(([field, error]) => (
                    <Typography key={field} variant="body2" color="error">
                      {error}
                    </Typography>
                  ))}
                </Box>
              )}
              <Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
                Información Personal
              </Typography>

              <Autocomplete
                options={personas}
                loading={loadingPersonas}
                getOptionLabel={(option) => `${option.nombre_completo} - ${option.identificacion}`}
                value={selectedPersona || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    persona_id: newValue?.id || 0
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Persona"
                    error={Boolean(errors?.persona_id)}
                    helperText={errors?.persona_id || 'Busca por nombre o identificación'}
                    margin="normal"
                    required
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2">{option.nombre_completo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.tipo_identificacion}: {option.identificacion}
                      </Typography>
                    </Box>
                  </li>
                )}
                fullWidth
              />

              <TextField
                label="Código Personal"
                name="codigo_personal"
                value={formValues.codigo_personal ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.codigo_personal)}
                helperText={errors?.codigo_personal || 'Dejar vacío para generar automáticamente'}
                fullWidth
                margin="normal"
              />

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Información Profesional
              </Typography>

              <Autocomplete
                options={TIPOS_PERSONAL}
                value={formValues.tipo_personal || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    tipo_personal: newValue || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tipo de Personal"
                    error={Boolean(errors?.tipo_personal)}
                    helperText={errors?.tipo_personal || 'Selecciona el tipo de personal'}
                    margin="normal"
                    required
                  />
                )}
                fullWidth
              />

              {/*  <TextField 
                label="Especialidad" 
                name="especialidad" 
                value={formValues.especialidad ?? ''} 
                onChange={handleChange} 
                fullWidth 
                margin="normal"
                placeholder="Ej: Cardiología, Medicina General, etc."
              /> */}

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                <TextField
                  label="Registro Senescyt"
                  name="registro_senescyt"
                  value={formValues.registro_senescyt ?? ''}
                  onChange={handleChange}
                  margin="normal"
                />

                <TextField
                  label="Registro MSP"
                  name="registro_msp"
                  value={formValues.registro_msp ?? ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(formValues.licencia_activa)}
                    onChange={(e) =>
                      setFormValues((v: any) => ({ ...v, licencia_activa: e.target.checked }))
                    }
                    name="licencia_activa"
                  />
                }
                label="Licencia Activa"
                sx={{ mt: 2 }}
              />

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Información de Contacto
              </Typography>

              <TextField
                label="Correo Institucional"
                name="correo_institucional"
                type="email"
                value={formValues.correo_institucional ?? ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="ejemplo@clinica.com"
              />

              <TextField
                label="Teléfono Institucional"
                name="telefono_institucional"
                value={formValues.telefono_institucional ?? ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Ej: 02-123-4567"
              />

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Disponibilidad horaria
              </Typography>

              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <InputLabel id="slot-duration-label">Duración de cada cita (minutos)</InputLabel>
                <Select
                  labelId="slot-duration-label"
                  value={formValues.disponibilidad?.slot_duration || 30}
                  label="Duración de cada cita (minutos)"
                  onChange={(e) => {
                    setFormValues((prev: any) => ({
                      ...prev,
                      disponibilidad: {
                        ...(prev.disponibilidad || {}),
                        slot_duration: Number(e.target.value)
                      }
                    }));
                  }}
                >
                  <MenuItem value={15}>15 minutos</MenuItem>
                  <MenuItem value={20}>20 minutos</MenuItem>
                  <MenuItem value={30}>30 minutos</MenuItem>
                  <MenuItem value={40}>40 minutos</MenuItem>
                  <MenuItem value={45}>45 minutos</MenuItem>
                  <MenuItem value={60}>60 minutos</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {DIAS_SEMANA.map((dia) => {
                  const disponibilidadPorDia = (formValues.disponibilidad || {})[dia.key];

                  let activo = false;
                  let inicio = '08:00';
                  let fin = '17:00';

                  if (
                    typeof disponibilidadPorDia === 'string' &&
                    disponibilidadPorDia.includes('-')
                  ) {
                    const [iniStr, finStr] = disponibilidadPorDia
                      .split('-')
                      .map((s: string) => s.trim());
                    if (iniStr) inicio = iniStr;
                    if (finStr) fin = finStr;
                    activo = true;
                  } else if (disponibilidadPorDia && typeof disponibilidadPorDia === 'object') {
                    activo = disponibilidadPorDia.activo ?? true;
                    inicio = disponibilidadPorDia.inicio ?? inicio;
                    fin = disponibilidadPorDia.fin ?? fin;
                  }

                  return (
                    <Box
                      key={dia.key}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '110px auto 1fr 1fr',
                        alignItems: 'center',
                        columnGap: 1
                      }}
                    >
                      <Typography variant="body2">{dia.label}</Typography>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={activo}
                            onChange={(_, checked) => {
                              setFormValues((prev: any) => {
                                const prevDisp = prev.disponibilidad || {};
                                const prevDia = prevDisp[dia.key] || {};
                                return {
                                  ...prev,
                                  disponibilidad: {
                                    ...prevDisp,
                                    [dia.key]: {
                                      activo: checked,
                                      inicio: prevDia.inicio ?? inicio,
                                      fin: prevDia.fin ?? fin
                                    }
                                  }
                                };
                              });
                            }}
                          />
                        }
                        label="Disponible"
                      />

                      <TextField
                        type="time"
                        label="Hora inicio"
                        value={inicio}
                        onChange={(e) => {
                          const newInicio = e.target.value;
                          setFormValues((prev: any) => {
                            const prevDisp = prev.disponibilidad || {};
                            const prevDia = prevDisp[dia.key] || {};
                            return {
                              ...prev,
                              disponibilidad: {
                                ...prevDisp,
                                [dia.key]: {
                                  activo: prevDia.activo ?? true,
                                  inicio: newInicio,
                                  fin: prevDia.fin ?? fin
                                }
                              }
                            };
                          });
                        }}
                        disabled={!activo}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                      />

                      <TextField
                        type="time"
                        label="Hora fin"
                        value={fin}
                        onChange={(e) => {
                          const newFin = e.target.value;
                          setFormValues((prev: any) => {
                            const prevDisp = prev.disponibilidad || {};
                            const prevDia = prevDisp[dia.key] || {};
                            return {
                              ...prev,
                              disponibilidad: {
                                ...prevDisp,
                                [dia.key]: {
                                  activo: prevDia.activo ?? true,
                                  inicio: prevDia.inicio ?? inicio,
                                  fin: newFin
                                }
                              }
                            };
                          });
                        }}
                        disabled={!activo}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  );
                })}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Los horarios se guardan automáticamente en un formato JSON por día, y la duración
                  de la cita indica los slots horarios.
                </Typography>
              </Box>
            </>
          );
        }}
      />
    </Container>
  );
}
