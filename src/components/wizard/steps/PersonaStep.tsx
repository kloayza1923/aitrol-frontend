import { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';

interface PersonaData {
  tipo_identificacion: string;
  identificacion: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  lugar_nacimiento?: string;
  nacionalidad?: string;
  estado_civil?: string;
  direccion?: string;
  telefono_local?: string;
  telefono_movil?: string;
  email?: string;
  grupo_etnico?: string;
  foto_url?: string;
  discapacidad?: boolean;
}

interface PersonaStepProps {
  onCreatePersona: (data: PersonaData) => Promise<void>;
  isLoading: boolean;
}

export function PersonaStep({ onCreatePersona, isLoading }: PersonaStepProps) {
  const [formData, setFormData] = useState<PersonaData>({
    tipo_identificacion: 'CEDULA',
    identificacion: '',
    primer_nombre: '',
    primer_apellido: '',
    nacionalidad: 'ECUATORIANA',
    discapacidad: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.identificacion.trim()) {
      newErrors.identificacion = 'Identificación es requerida';
    }
    if (!formData.primer_nombre.trim()) {
      newErrors.primer_nombre = 'Primer nombre es requerido';
    }
    if (!formData.primer_apellido.trim()) {
      newErrors.primer_apellido = 'Primer apellido es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await onCreatePersona(formData);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Identificación
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de Identificación</InputLabel>
            <Select
              name="tipo_identificacion"
              value={formData.tipo_identificacion}
              onChange={handleChange as any}
              label="Tipo de Identificación"
            >
              <MenuItem value="CEDULA">Cédula</MenuItem>
              <MenuItem value="PASAPORTE">Pasaporte</MenuItem>
              <MenuItem value="RUC">RUC</MenuItem>
              <MenuItem value="OTRO">Otro</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Identificación"
            name="identificacion"
            value={formData.identificacion}
            onChange={handleChange}
            error={!!errors.identificacion}
            helperText={errors.identificacion}
            required
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
        Información Personal
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Primer Nombre"
            name="primer_nombre"
            value={formData.primer_nombre}
            onChange={handleChange}
            error={!!errors.primer_nombre}
            helperText={errors.primer_nombre}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Segundo Nombre"
            name="segundo_nombre"
            value={formData.segundo_nombre || ''}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Primer Apellido"
            name="primer_apellido"
            value={formData.primer_apellido}
            onChange={handleChange}
            error={!!errors.primer_apellido}
            helperText={errors.primer_apellido}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Segundo Apellido"
            name="segundo_apellido"
            value={formData.segundo_apellido || ''}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Fecha de Nacimiento"
            name="fecha_nacimiento"
            type="date"
            value={formData.fecha_nacimiento || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Sexo</InputLabel>
            <Select
              name="sexo"
              value={formData.sexo || ''}
              onChange={handleChange as any}
              label="Sexo"
            >
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="F">Femenino</MenuItem>
              <MenuItem value="O">Otro</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Lugar de Nacimiento"
            name="lugar_nacimiento"
            value={formData.lugar_nacimiento || ''}
            onChange={handleChange}
            placeholder="Ej: Quito, Ecuador"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Nacionalidad"
            name="nacionalidad"
            value={formData.nacionalidad || ''}
            onChange={handleChange}
            placeholder="Ej: ECUATORIANA"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            <InputLabel>Estado Civil</InputLabel>
            <Select
              name="estado_civil"
              value={formData.estado_civil || ''}
              onChange={handleChange as any}
              label="Estado Civil"
            >
              <MenuItem value="">Selecciona...</MenuItem>
              <MenuItem value="SOLTERO">Soltero</MenuItem>
              <MenuItem value="CASADO">Casado</MenuItem>
              <MenuItem value="DIVORCIADO">Divorciado</MenuItem>
              <MenuItem value="VIUDO">Viudo</MenuItem>
              <MenuItem value="UNION_LIBRE">Unión Libre</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
        Contacto
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Dirección"
            name="direccion"
            value={formData.direccion || ''}
            onChange={handleChange}
            multiline
            rows={2}
            placeholder="Dirección completa de domicilio"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Teléfono Local"
            name="telefono_local"
            value={formData.telefono_local || ''}
            onChange={handleChange}
            placeholder="Ej: 02-123-4567"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Teléfono Móvil"
            name="telefono_movil"
            value={formData.telefono_movil || ''}
            onChange={handleChange}
            placeholder="Ej: 0987654321"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Correo Electrónico"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="ejemplo@correo.com"
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
        Información Adicional
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Grupo Étnico"
            name="grupo_etnico"
            value={formData.grupo_etnico || ''}
            onChange={handleChange}
            placeholder="Ej: Mestizo, Indígena, Afroecuatoriano, etc."
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="URL de Foto"
            name="foto_url"
            value={formData.foto_url || ''}
            onChange={handleChange}
            placeholder="https://ejemplo.com/foto.jpg"
            helperText="URL completa de la foto de perfil"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.discapacidad || false}
                onChange={handleChange}
                name="discapacidad"
              />
            }
            label="Persona con Discapacidad"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{ minWidth: '200px' }}
        >
          {isLoading ? 'Creando...' : 'Crear Persona y Continuar'}
        </Button>
      </Box>
    </Box>
  );
}
