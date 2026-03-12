import { useState, useEffect } from 'react';
import { TextField, Button, Box, Grid, Typography, Autocomplete, Alert } from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DoctorOption {
  id: number;
  codigo_personal?: string;
  especialidad?: string;
  disponibilidad?: any;
  raw?: any;
  persona?: {
    nombre_completo?: string;
    identificacion?: string;
    disponibilidad?: any;
  } | null;
}

interface CitaData {
  personal_id: number;
  fecha_hora: string;
  duracion_minutos: number;
  motivo?: string;
  tipo: string;
  estado: string;
}

interface CitaStepProps {
  onCreateCita: (data: CitaData) => Promise<void>;
  isLoading: boolean;
  selectedDateTime?: { start: Date; end: Date } | null;
  doctores: DoctorOption[];
}

const formatDateTime = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss");

export function CitaStep({ onCreateCita, isLoading, selectedDateTime, doctores }: CitaStepProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [motivo, setMotivo] = useState('');
  const [tipo, setTipo] = useState('CONSULTA');
  const [estado, setEstado] = useState('PENDIENTE');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState(30);

  useEffect(() => {
    if (selectedDateTime) {
      setStartDateTime(formatDateTime(selectedDateTime.start));
      setEndDateTime(formatDateTime(selectedDateTime.end));
      const duration = Math.round(
        (selectedDateTime.end.getTime() - selectedDateTime.start.getTime()) / 60000
      );
      setDuracionMinutos(duration);
    }
  }, [selectedDateTime]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedDoctor) {
      newErrors.doctor = 'Selecciona un profesional de salud';
    }
    if (!startDateTime) {
      newErrors.fecha = 'Fecha y hora son requeridas';
    }
    if (duracionMinutos <= 0) {
      newErrors.duracion = 'La duración debe ser mayor a 0 minutos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedDoctor) return;

    const citaData: CitaData = {
      personal_id: selectedDoctor.id,
      fecha_hora: startDateTime,
      duracion_minutos: duracionMinutos,
      motivo,
      tipo,
      estado
    };

    await onCreateCita(citaData);
  };

  const doctorLabel = (doc: DoctorOption) => {
    const nombre = doc.persona?.nombre_completo || 'Sin nombre';
    const especialidad = doc.especialidad ? ` - ${doc.especialidad}` : '';
    const codigo = doc.codigo_personal ? ` (${doc.codigo_personal})` : '';
    return `${nombre}${especialidad}${codigo}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {selectedDateTime && (
        <Alert severity="success">
          Rango horario seleccionado: de{' '}
          {format(selectedDateTime.start, 'dd MMM HH:mm', { locale: es })} hasta{' '}
          {format(selectedDateTime.end, 'dd MMM yyyy HH:mm', { locale: es })}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Autocomplete
            options={doctores}
            value={selectedDoctor}
            onChange={(_, value) => {
              setSelectedDoctor(value);
              setErrors((prev) => ({ ...prev, doctor: '' }));
              if (value) {
                const docSlot =
                  value.raw?.disponibilidad?.slot_duration ||
                  value.disponibilidad?.slot_duration ||
                  value.persona?.disponibilidad?.slot_duration;
                if (docSlot) {
                  setDuracionMinutos(docSlot);
                }
              }
            }}
            getOptionLabel={(option) => doctorLabel(option)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Profesional de Salud"
                size="small"
                error={!!errors.doctor}
                helperText={errors.doctor}
                required
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Fecha y Hora Inicio"
            name="fecha_inicio"
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => {
              setStartDateTime(e.target.value);
              setErrors((prev) => ({ ...prev, fecha: '' }));
            }}
            InputLabelProps={{ shrink: true }}
            error={!!errors.fecha}
            helperText={errors.fecha}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Duración (minutos)"
            name="duracion"
            type="number"
            value={duracionMinutos}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setDuracionMinutos(val);
              setErrors((prev) => ({ ...prev, duracion: '' }));
            }}
            inputProps={{ min: 15, step: 15 }}
            error={!!errors.duracion}
            helperText={errors.duracion}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Motivo de la Cita"
            name="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            multiline
            rows={2}
            placeholder="Describe el motivo de la cita"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Tipo de Cita"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            select
            SelectProps={{
              native: true
            }}
          >
            <option value="CONSULTA">Consulta</option>
            <option value="CONTROL">Control</option>
            <option value="PROCEDIMIENTO">Procedimiento</option>
            <option value="SEGUIMIENTO">Seguimiento</option>
            <option value="DIAGNOSTICO">Diagnóstico</option>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Estado"
            name="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            select
            SelectProps={{
              native: true
            }}
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="REALIZADA">Realizada</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="NO_ASIS">No Asistió</option>
          </TextField>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{ minWidth: '200px' }}
        >
          {isLoading ? 'Creando...' : 'Crear Cita'}
        </Button>
      </Box>
    </Box>
  );
}
