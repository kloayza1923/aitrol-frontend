import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  Autocomplete,
  Chip,
  Box,
  Typography,
  Button,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { pacienteSchema } from '@/validations/HealthValidation';
import { useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { FetchData } from '@/utils/FetchData';

type Persona = {
  id: number;
  identificacion: string;
  nombre_completo: string;
  tipo_identificacion: string;
  telefono_movil?: string;
  email?: string;
};

type Paciente = {
  id?: number;
  persona_id: number;
  codigo_paciente?: string;
  tipo_sangre?: string;
  alergias?: any; // JSON object
  antecedentes?: any; // JSON object
  nombre_contacto_legal?: string;
  telefono_contacto_legal?: string;
  cliente_id?: number;
  sis_sucursal_id?: number;
  persona?: Persona;
};

export default function PacientesList() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setLoadingPersonas(true);
    try {
      const response = await FetchData<any>('/salud/personas', 'GET');
      console.log('Personas cargadas:', response);
      setPersonas(response.items || []);
    } catch (error) {
      console.error('Error cargando personas:', error);
    } finally {
      setLoadingPersonas(false);
    }
  };

  const columns: GridColDef<Paciente>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'codigo_paciente',
      headerName: 'Código Paciente',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'persona',
      headerName: 'Paciente',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (value, row) => {
        return row.persona ? row.persona.nombre_completo : '';
      }
    },
    {
      field: 'tipo_sangre',
      headerName: 'Tipo Sangre',
      width: 120,
      valueGetter: (value, row) => row.tipo_sangre || ''
    },
    {
      field: 'telefono',
      headerName: 'Teléfono',
      width: 140
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 180
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Paciente>
        title="Pacientes"
        endpoint="/salud/pacientes"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          persona_id: 0,
          codigo_paciente: '',
          tipo_sangre: '',
          alergias: {},
          antecedentes: {},
          nombre_contacto_legal: '',
          telefono_contacto_legal: '',
          cliente_id: undefined,
          sis_sucursal_id: undefined
        }}
        schema={pacienteSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => {
          const selectedPersona = personas.find((p) => p.id === formValues.persona_id);

          // Estados locales para alergias y antecedentes
          const [nuevaAlergia, setNuevaAlergia] = useState('');
          const [tipoAlergia, setTipoAlergia] = useState('medicamentos');
          const [nuevoAntecedente, setNuevoAntecedente] = useState('');
          const [tipoAntecedente, setTipoAntecedente] = useState('patologicos');

          // Inicializar estructuras si están vacías
          const alergias = formValues.alergias || { medicamentos: [], alimentos: [], otros: [] };
          const antecedentes = formValues.antecedentes || {
            patologicos: [],
            quirurgicos: [],
            familiares: [],
            otros: []
          };

          const agregarAlergia = () => {
            if (nuevaAlergia.trim()) {
              const nuevasAlergias = { ...alergias };
              if (!nuevasAlergias[tipoAlergia]) {
                nuevasAlergias[tipoAlergia] = [];
              }
              nuevasAlergias[tipoAlergia].push(nuevaAlergia.trim());
              setFormValues((prev: any) => ({ ...prev, alergias: nuevasAlergias }));
              setNuevaAlergia('');
            }
          };

          const eliminarAlergia = (tipo: string, index: number) => {
            const nuevasAlergias = { ...alergias };
            nuevasAlergias[tipo].splice(index, 1);
            setFormValues((prev: any) => ({ ...prev, alergias: nuevasAlergias }));
          };

          const agregarAntecedente = () => {
            if (nuevoAntecedente.trim()) {
              const nuevosAntecedentes = { ...antecedentes };
              if (!nuevosAntecedentes[tipoAntecedente]) {
                nuevosAntecedentes[tipoAntecedente] = [];
              }
              nuevosAntecedentes[tipoAntecedente].push(nuevoAntecedente.trim());
              setFormValues((prev: any) => ({ ...prev, antecedentes: nuevosAntecedentes }));
              setNuevoAntecedente('');
            }
          };

          const eliminarAntecedente = (tipo: string, index: number) => {
            const nuevosAntecedentes = { ...antecedentes };
            nuevosAntecedentes[tipo].splice(index, 1);
            setFormValues((prev: any) => ({ ...prev, antecedentes: nuevosAntecedentes }));
          };

          return (
            <>
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
                label="Código Paciente"
                name="codigo_paciente"
                value={formValues.codigo_paciente ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.codigo_paciente)}
                helperText={errors?.codigo_paciente || 'Dejar vacío para generar automáticamente'}
                fullWidth
                margin="normal"
              />

              {/*  <TextField
                label="Tipo de Sangre"
                name="tipo_sangre"
                value={formValues.tipo_sangre ?? ''}
                onChange={handleChange}
                placeholder="Ej: O+, A-, AB+"
                fullWidth
                margin="normal"
              /> */}
              <Autocomplete
                options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']}
                value={formValues.tipo_sangre || ''}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    tipo_sangre: newValue || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Tipo de Sangre" margin="normal" fullWidth />
                )}
              />

              {/* Sección de Alergias */}
              <Typography
                variant="subtitle2"
                sx={{ mt: 3, mb: 1, fontWeight: 'bold', color: 'primary.main' }}
              >
                Alergias
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={tipoAlergia}
                    label="Tipo"
                    onChange={(e) => setTipoAlergia(e.target.value)}
                  >
                    <MenuItem value="medicamentos">Medicamentos</MenuItem>
                    <MenuItem value="alimentos">Alimentos</MenuItem>
                    <MenuItem value="otros">Otros</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Agregar alergia"
                  value={nuevaAlergia}
                  onChange={(e) => setNuevaAlergia(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarAlergia()}
                  fullWidth
                />

                <Button variant="contained" onClick={agregarAlergia}>
                  Agregar
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {Object.entries(alergias).map(
                  ([tipo, items]: [string, any]) =>
                    items &&
                    items.length > 0 &&
                    items.map((alergia: string, index: number) => (
                      <Chip
                        key={`${tipo}-${index}`}
                        label={`${alergia} (${tipo})`}
                        onDelete={() => eliminarAlergia(tipo, index)}
                        color={
                          tipo === 'medicamentos'
                            ? 'error'
                            : tipo === 'alimentos'
                              ? 'warning'
                              : 'default'
                        }
                        size="small"
                      />
                    ))
                )}
                {Object.values(alergias).every((arr: any) => !arr || arr.length === 0) && (
                  <Typography variant="caption" color="text.secondary">
                    No hay alergias registradas
                  </Typography>
                )}
              </Box>

              {/* Sección de Antecedentes Médicos */}
              <Typography
                variant="subtitle2"
                sx={{ mt: 3, mb: 1, fontWeight: 'bold', color: 'primary.main' }}
              >
                Antecedentes Médicos
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={tipoAntecedente}
                    label="Tipo"
                    onChange={(e) => setTipoAntecedente(e.target.value)}
                  >
                    <MenuItem value="patologicos">Patológicos</MenuItem>
                    <MenuItem value="quirurgicos">Quirúrgicos</MenuItem>
                    <MenuItem value="familiares">Familiares</MenuItem>
                    <MenuItem value="otros">Otros</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Agregar antecedente"
                  value={nuevoAntecedente}
                  onChange={(e) => setNuevoAntecedente(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarAntecedente()}
                  fullWidth
                />

                <Button variant="contained" size="small" onClick={agregarAntecedente}>
                  Agregar
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {Object.entries(antecedentes).map(
                  ([tipo, items]: [string, any]) =>
                    items &&
                    items.length > 0 &&
                    items.map((antecedente: string, index: number) => (
                      <Chip
                        key={`${tipo}-${index}`}
                        label={`${antecedente} (${tipo})`}
                        onDelete={() => eliminarAntecedente(tipo, index)}
                        color={
                          tipo === 'patologicos'
                            ? 'error'
                            : tipo === 'quirurgicos'
                              ? 'warning'
                              : tipo === 'familiares'
                                ? 'info'
                                : 'default'
                        }
                        size="small"
                      />
                    ))
                )}
                {Object.values(antecedentes).every((arr: any) => !arr || arr.length === 0) && (
                  <Typography variant="caption" color="text.secondary">
                    No hay antecedentes registrados
                  </Typography>
                )}
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Contacto de Emergencia
              </Typography>

              <TextField
                label="Nombre Contacto Legal"
                name="nombre_contacto_legal"
                value={formValues.nombre_contacto_legal ?? ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />

              <TextField
                label="Teléfono Contacto Legal"
                name="telefono_contacto_legal"
                value={formValues.telefono_contacto_legal ?? ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </>
          );
        }}
      />
    </Container>
  );
}
