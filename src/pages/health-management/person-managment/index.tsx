import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  Autocomplete,
  Chip,
  Box,
  Typography,
  Switch,
  FormControlLabel
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { personaSchema } from '@/validations/HealthValidation';

type Persona = {
  id?: number;
  uuid?: string;
  tipo_identificacion: string;
  identificacion: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  nombre_completo?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  lugar_nacimiento?: string;
  nacionalidad?: string;
  estado_civil?: string;
  direccion?: string;
  telefono_local?: string;
  telefono_movil?: string;
  email?: string;
  foto_url?: string;
  discapacidad?: boolean;
  grupo_etnico?: string;
};

const TIPOS_IDENTIFICACION = ['CEDULA', 'PASAPORTE', 'RUC', 'OTRO'];
const SEXOS = ['M', 'F', 'O'];
const ESTADOS_CIVILES = ['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_LIBRE'];

export default function PersonasList() {
  const columns: GridColDef<Persona>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'identificacion',
      headerName: 'Identificación',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<Persona>) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.row.identificacion}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.tipo_identificacion}
          </Typography>
        </Box>
      )
    },
    {
      field: 'nombre_completo',
      headerName: 'Nombre Completo',
      flex: 2,
      minWidth: 250,
      valueGetter: (value, row) =>
        row.nombre_completo ||
        `${row.primer_nombre || ''} ${row.segundo_nombre || ''} ${row.primer_apellido || ''} ${row.segundo_apellido || ''}`.trim()
    },
    {
      field: 'sexo',
      headerName: 'Sexo',
      width: 90,
      renderCell: (params: GridRenderCellParams<Persona>) => {
        if (!params.value) return null;
        const colorMap: Record<string, any> = {
          M: 'info',
          F: 'secondary',
          O: 'default'
        };
        const labelMap: Record<string, string> = {
          M: 'Masculino',
          F: 'Femenino',
          O: 'Otro'
        };
        return (
          <Chip
            label={labelMap[params.value as string] || params.value}
            size="small"
            color={colorMap[params.value as string] || 'default'}
          />
        );
      }
    },
    {
      field: 'fecha_nacimiento',
      headerName: 'F. Nacimiento',
      width: 120,
      valueFormatter: (value) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString('es-EC');
      }
    },
    {
      field: 'telefono_movil',
      headerName: 'Teléfono',
      flex: 1,
      minWidth: 130
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Persona>
        title="Personas"
        endpoint="/salud/personas"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          tipo_identificacion: 'CEDULA',
          identificacion: '',
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
          fecha_nacimiento: '',
          sexo: '',
          lugar_nacimiento: '',
          nacionalidad: 'ECUATORIANA',
          estado_civil: '',
          direccion: '',
          telefono_local: '',
          telefono_movil: '',
          email: '',
          foto_url: '',
          discapacidad: false,
          grupo_etnico: ''
        }}
        schema={personaSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
              Identificación
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
              <Autocomplete
                options={TIPOS_IDENTIFICACION}
                value={formValues.tipo_identificacion || 'CEDULA'}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    tipo_identificacion: newValue || 'CEDULA'
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tipo Identificación"
                    error={Boolean(errors?.tipo_identificacion)}
                    helperText={errors?.tipo_identificacion}
                    margin="normal"
                    required
                  />
                )}
              />

              <TextField
                label="Número de Identificación"
                name="identificacion"
                value={formValues.identificacion ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.identificacion)}
                helperText={errors?.identificacion}
                fullWidth
                margin="normal"
                required
                placeholder="Ej: 1234567890"
              />
            </Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Información Personal
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Primer Nombre"
                name="primer_nombre"
                value={formValues.primer_nombre ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.primer_nombre)}
                helperText={errors?.primer_nombre}
                margin="normal"
              />

              <TextField
                label="Segundo Nombre"
                name="segundo_nombre"
                value={formValues.segundo_nombre ?? ''}
                onChange={handleChange}
                margin="normal"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Primer Apellido"
                name="primer_apellido"
                value={formValues.primer_apellido ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.primer_apellido)}
                helperText={errors?.primer_apellido}
                margin="normal"
              />

              <TextField
                label="Segundo Apellido"
                name="segundo_apellido"
                value={formValues.segundo_apellido ?? ''}
                onChange={handleChange}
                margin="normal"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 1 }}>
              <TextField
                label="Fecha de Nacimiento"
                name="fecha_nacimiento"
                type="date"
                value={formValues.fecha_nacimiento ?? ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />

              <Autocomplete
                options={SEXOS}
                value={formValues.sexo || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    sexo: newValue || ''
                  }));
                }}
                getOptionLabel={(option) => {
                  const labels: Record<string, string> = {
                    M: 'Masculino',
                    F: 'Femenino',
                    O: 'Otro'
                  };
                  return labels[option] || option;
                }}
                renderInput={(params) => <TextField {...params} label="Sexo" margin="normal" />}
              />

              <Autocomplete
                options={ESTADOS_CIVILES}
                value={formValues.estado_civil || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    estado_civil: newValue || ''
                  }));
                }}
                getOptionLabel={(option) => option.replace('_', ' ')}
                renderInput={(params) => (
                  <TextField {...params} label="Estado Civil" margin="normal" />
                )}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Lugar de Nacimiento"
                name="lugar_nacimiento"
                value={formValues.lugar_nacimiento ?? ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Ej: Quito, Ecuador"
              />

              <TextField
                label="Nacionalidad"
                name="nacionalidad"
                value={formValues.nacionalidad ?? ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Ej: ECUATORIANA"
              />
            </Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Información de Contacto
            </Typography>

            <TextField
              label="Dirección"
              name="direccion"
              value={formValues.direccion ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={2}
              placeholder="Dirección completa de domicilio"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Teléfono Local"
                name="telefono_local"
                value={formValues.telefono_local ?? ''}
                onChange={handleChange}
                margin="normal"
                placeholder="Ej: 02-123-4567"
              />

              <TextField
                label="Teléfono Móvil"
                name="telefono_movil"
                value={formValues.telefono_movil ?? ''}
                onChange={handleChange}
                margin="normal"
                placeholder="Ej: 0987654321"
              />
            </Box>

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formValues.email ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              placeholder="ejemplo@correo.com"
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Información Adicional
            </Typography>

            <TextField
              label="Grupo Étnico"
              name="grupo_etnico"
              value={formValues.grupo_etnico ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              placeholder="Ej: Mestizo, Indígena, Afroecuatoriano, etc."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formValues.discapacidad)}
                  onChange={(e) =>
                    setFormValues((v: any) => ({ ...v, discapacidad: e.target.checked }))
                  }
                  name="discapacidad"
                />
              }
              label="Persona con Discapacidad"
              sx={{ mt: 2 }}
            />

            <TextField
              label="URL de Foto"
              name="foto_url"
              value={formValues.foto_url ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              placeholder="https://ejemplo.com/foto.jpg"
              helperText="URL completa de la foto de perfil"
            />
          </>
        )}
      />
    </Container>
  );
}
