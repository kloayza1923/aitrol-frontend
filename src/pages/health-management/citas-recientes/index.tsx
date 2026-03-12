import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Button
} from '@mui/material';
import { addDays, format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { useNotification } from '@/hooks';

interface PacienteOption {
  id: number;
  codigo_paciente?: string;
  persona?: {
    nombre_completo?: string;
  } | null;
}

interface DoctorOption {
  id: number;
  codigo_personal?: string;
  especialidad?: string;
  persona?: {
    nombre_completo?: string;
  } | null;
}

interface SalaOption {
  id: number;
  nombre?: string;
  piso?: number;
}

interface CitaApiItem {
  id: number;
  paciente_id: number;
  personal_id: number;
  fecha_hora?: string | null;
  duracion_minutos?: number | null;
  motivo?: string | null;
  tipo?: string | null;
  estado?: string | null;
  sala_id?: number | null;
}

const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');

const parseLocalDate = (value?: string | null) => {
  if (!value) return null;
  const safe = value.length > 19 ? value.substring(0, 19) : value;
  return new Date(safe);
};

const getEstadoChip = (estado?: string | null) => {
  switch (estado) {
    case 'CONFIRMADA':
      return { label: 'Confirmada', color: 'success' as const };
    case 'REALIZADA':
      return { label: 'Realizada', color: 'info' as const };
    case 'CANCELADA':
      return { label: 'Cancelada', color: 'error' as const };
    case 'NO_ASIS':
      return { label: 'No asistio', color: 'warning' as const };
    default:
      return { label: 'Pendiente', color: 'warning' as const };
  }
};

export default function CitasRecientesPage() {
  const notification = useNotification();
  const [citas, setCitas] = useState<CitaApiItem[]>([]);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [doctores, setDoctores] = useState<DoctorOption[]>([]);
  const [salas, setSalas] = useState<SalaOption[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const fecha_desde = formatDate(subDays(now, 7));
      const fecha_hasta = formatDate(addDays(now, 7));

      const [citasData, pacientesData, doctoresData, salasData] = await Promise.all([
        FetchData('/salud/citas', 'GET', { fecha_desde, fecha_hasta, page_size: 2000 }),
        FetchData('/salud/pacientes', 'GET', { page: 1, limit: 100 }),
        FetchData('/salud/personal', 'GET', { page: 1, page_size: 500 }),
        FetchData('/salud/unidades/salas', 'GET', { page: 1, page_size: 500 })
      ]);

      const citasArray = Array.isArray(citasData) ? citasData : citasData?.items || [];
      const pacientesArray = Array.isArray(pacientesData.items)
        ? pacientesData.items
        : Array.isArray(pacientesData)
          ? pacientesData
          : [];
      const doctoresArray = Array.isArray(doctoresData.items) ? doctoresData.items : [];
      const salasArray = Array.isArray(salasData.items) ? salasData.items : [];

      setCitas(citasArray as CitaApiItem[]);
      setPacientes(pacientesArray as PacienteOption[]);
      setDoctores(doctoresArray as DoctorOption[]);
      setSalas(salasArray as SalaOption[]);
    } catch (e) {
      console.error('Error cargando citas recientes', e);
      notification.error('Error', 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pacientesById = useMemo(() => {
    return new Map(pacientes.map((p) => [p.id, p]));
  }, [pacientes]);

  const doctoresById = useMemo(() => {
    return new Map(doctores.map((d) => [d.id, d]));
  }, [doctores]);

  const salasById = useMemo(() => {
    return new Map(salas.map((s) => [s.id, s]));
  }, [salas]);

  const citasConFecha = useMemo(() => {
    return citas
      .map((c) => ({
        ...c,
        start: parseLocalDate(c.fecha_hora)
      }))
      .filter((c) => c.start);
  }, [citas]);

  const recientes = useMemo(() => {
    const now = new Date();
    const lowerBound = subDays(now, 7).getTime();
    const upperBound = now.getTime();
    return citasConFecha
      .filter((c) => {
        const time = (c.start as Date).getTime();
        return time >= lowerBound && time <= upperBound;
      })
      .sort((a, b) => (b.start as Date).getTime() - (a.start as Date).getTime());
  }, [citasConFecha]);

  const proximas = useMemo(() => {
    const now = new Date();
    const lowerBound = now.getTime();
    const upperBound = addDays(now, 7).getTime();
    return citasConFecha
      .filter((c) => {
        const time = (c.start as Date).getTime();
        return time >= lowerBound && time <= upperBound;
      })
      .sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime());
  }, [citasConFecha]);

  const pacienteLabel = (pacienteId: number) => {
    const paciente = pacientesById.get(pacienteId);
    if (!paciente) return `Paciente #${pacienteId}`;
    const nombre = paciente.persona?.nombre_completo || `Paciente #${pacienteId}`;
    const codigo = paciente.codigo_paciente ? ` (${paciente.codigo_paciente})` : '';
    return `${nombre}${codigo}`;
  };

  const doctorLabel = (doctorId: number) => {
    const doctor = doctoresById.get(doctorId);
    if (!doctor) return `Profesional #${doctorId}`;
    const nombre = doctor.persona?.nombre_completo || `Profesional #${doctorId}`;
    const especialidad = doctor.especialidad ? ` - ${doctor.especialidad}` : '';
    return `${nombre}${especialidad}`;
  };

  const salaLabel = (salaId?: number | null) => {
    if (!salaId) return 'Sin sala';
    const sala = salasById.get(salaId);
    if (!sala) return `Sala ${salaId}`;
    const piso = sala.piso ? ` (Piso ${sala.piso})` : '';
    return `${sala.nombre || `Sala ${sala.id}`}${piso}`;
  };

  const renderCitaItem = (cita: CitaApiItem & { start?: Date | null }) => {
    const start = cita.start as Date;
    const estado = getEstadoChip(cita.estado);
    return (
      <ListItem key={cita.id} divider>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" fontWeight="medium">
                {pacienteLabel(cita.paciente_id)}
              </Typography>
              <Chip label={estado.label} color={estado.color} size="small" />
            </Box>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {format(start, "dd MMM yyyy '•' HH:mm", { locale: es })} | {doctorLabel(cita.personal_id)}
              {' | '} {salaLabel(cita.sala_id)}
              {cita.motivo ? ` | ${cita.motivo}` : ''}
            </Typography>
          }
        />
      </ListItem>
    );
  };

  return (
    <Container>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Citas recientes y proximas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ultimos 7 dias y proximos 7 dias.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => void loadData()} disabled={loading}>
          Actualizar
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
              Recientes
            </Typography>
            {recientes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay citas recientes.
              </Typography>
            ) : (
              <List disablePadding>{recientes.map(renderCitaItem)}</List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
              Proximas
            </Typography>
            {proximas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay citas proximas.
              </Typography>
            ) : (
              <List disablePadding>{proximas.map(renderCitaItem)}</List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
