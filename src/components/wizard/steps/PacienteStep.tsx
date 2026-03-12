import { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Grid,
  Typography,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

interface PersonaData {
  tipo_identificacion: string;
  identificacion: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  [key: string]: any;
}

interface PacienteData {
  tipo_sangre?: string;
  alergias?: Record<string, string[]>;
  antecedentes?: Record<string, string[]>;
  nombre_contacto_legal?: string;
  telefono_contacto_legal?: string;
}

interface PacienteStepProps {
  personaData: PersonaData;
  onCreatePaciente: (data: PacienteData) => Promise<void>;
  isLoading: boolean;
}

export function PacienteStep({ personaData, onCreatePaciente, isLoading }: PacienteStepProps) {
  const [formData, setFormData] = useState<PacienteData>({
    tipo_sangre: 'O+',
    alergias: { medicamentos: [], alimentos: [], otros: [] },
    antecedentes: { patologicos: [], quirurgicos: [], familiares: [], otros: [] },
    nombre_contacto_legal: '',
    telefono_contacto_legal: ''
  });

  // Estados para agregar alergias
  const [nuevaAlergia, setNuevaAlergia] = useState('');
  const [tipoAlergia, setTipoAlergia] = useState('medicamentos');

  // Estados para agregar antecedentes
  const [nuevoAntecedente, setNuevoAntecedente] = useState('');
  const [tipoAntecedente, setTipoAntecedente] = useState('patologicos');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const agregarAlergia = () => {
    if (nuevaAlergia.trim()) {
      setFormData((prev) => {
        const alergias = prev.alergias || { medicamentos: [], alimentos: [], otros: [] };
        const nuevasAlergias = { ...alergias };
        if (!nuevasAlergias[tipoAlergia]) {
          nuevasAlergias[tipoAlergia] = [];
        }
        nuevasAlergias[tipoAlergia] = [...nuevasAlergias[tipoAlergia], nuevaAlergia.trim()];
        return { ...prev, alergias: nuevasAlergias };
      });
      setNuevaAlergia('');
    }
  };

  const eliminarAlergia = (tipo: string, index: number) => {
    setFormData((prev) => {
      const alergias = prev.alergias || {};
      const nuevasAlergias = { ...alergias };
      nuevasAlergias[tipo] = nuevasAlergias[tipo]?.filter((_, i) => i !== index) || [];
      return { ...prev, alergias: nuevasAlergias };
    });
  };

  const agregarAntecedente = () => {
    if (nuevoAntecedente.trim()) {
      setFormData((prev) => {
        const antecedentes = prev.antecedentes || {
          patologicos: [],
          quirurgicos: [],
          familiares: [],
          otros: []
        };
        const nuevosAntecedentes = { ...antecedentes };
        if (!nuevosAntecedentes[tipoAntecedente]) {
          nuevosAntecedentes[tipoAntecedente] = [];
        }
        nuevosAntecedentes[tipoAntecedente] = [
          ...nuevosAntecedentes[tipoAntecedente],
          nuevoAntecedente.trim()
        ];
        return { ...prev, antecedentes: nuevosAntecedentes };
      });
      setNuevoAntecedente('');
    }
  };

  const eliminarAntecedente = (tipo: string, index: number) => {
    setFormData((prev) => {
      const antecedentes = prev.antecedentes || {};
      const nuevosAntecedentes = { ...antecedentes };
      nuevosAntecedentes[tipo] = nuevosAntecedentes[tipo]?.filter((_, i) => i !== index) || [];
      return { ...prev, antecedentes: nuevosAntecedentes };
    });
  };

  const handleSubmit = async () => {
    await onCreatePaciente(formData);
  };

  const getNombreCompleto = () => {
    return `${personaData.primer_nombre} ${personaData.segundo_nombre || ''} ${personaData.primer_apellido} ${personaData.segundo_apellido || ''}`.trim();
  };

  const alergias = formData.alergias || {};
  const antecedentes = formData.antecedentes || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert severity="info">
        Creando paciente para: <strong>{getNombreCompleto()}</strong> ({personaData.identificacion})
      </Alert>

      {/* Tipo de Sangre */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Información Médica
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Tipo de Sangre"
              name="tipo_sangre"
              value={formData.tipo_sangre || ''}
              onChange={handleChange}
              select
              SelectProps={{
                native: true
              }}
            >
              <option value="">Selecciona...</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Alergias */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Alergias
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
            size="small"
            label="Agregar alergia"
            value={nuevaAlergia}
            onChange={(e) => setNuevaAlergia(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && agregarAlergia()}
            placeholder="Ej: Penicilina"
            sx={{ flex: 1 }}
          />

          <Button
            variant="contained"
            size="small"
            onClick={agregarAlergia}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Agregar
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(alergias).map(
            ([tipo, items]) =>
              items &&
              items.length > 0 &&
              items.map((alergia: string, index: number) => (
                <Chip
                  key={`${tipo}-${index}`}
                  label={`${alergia} (${tipo})`}
                  onDelete={() => eliminarAlergia(tipo, index)}
                  color={
                    tipo === 'medicamentos' ? 'error' : tipo === 'alimentos' ? 'warning' : 'default'
                  }
                  size="small"
                />
              ))
          )}
          {Object.values(alergias).every((arr: any) => !arr || arr.length === 0) && (
            <Typography variant="caption" color="text.secondary">
              Sin alergias registradas
            </Typography>
          )}
        </Box>
      </Box>

      {/* Antecedentes */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Antecedentes Médicos
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
            size="small"
            label="Agregar antecedente"
            value={nuevoAntecedente}
            onChange={(e) => setNuevoAntecedente(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && agregarAntecedente()}
            placeholder="Ej: Diabetes"
            sx={{ flex: 1 }}
          />

          <Button
            variant="contained"
            size="small"
            onClick={agregarAntecedente}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Agregar
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(antecedentes).map(
            ([tipo, items]) =>
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
              Sin antecedentes registrados
            </Typography>
          )}
        </Box>
      </Box>

      {/* Contacto Legal */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Contacto Legal/Emergencia
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Nombre Contacto Legal"
              name="nombre_contacto_legal"
              value={formData.nombre_contacto_legal || ''}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Teléfono Contacto Legal"
              name="telefono_contacto_legal"
              value={formData.telefono_contacto_legal || ''}
              onChange={handleChange}
              placeholder="0987654321"
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{ minWidth: '200px' }}
        >
          {isLoading ? 'Creando...' : 'Crear Paciente y Continuar'}
        </Button>
      </Box>
    </Box>
  );
}
