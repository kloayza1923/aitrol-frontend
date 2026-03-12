import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Button
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { useNotification } from '@/hooks';

interface SalaOption {
  id: number;
  nombre?: string;
  piso?: number;
}

interface PacienteOption {
  id: number;
  codigo_paciente?: string;
  persona?: {
    nombre_completo?: string;
  } | null;
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

type QueueStatus = 'EN_ESPERA' | 'LLAMADO' | 'EN_CONSULTA' | 'ATENDIDA' | 'CANCELADA' | 'NO_ASIS';

const CALL_WINDOW_MINUTES = 5;
const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');

const parseLocalDate = (value?: string | null) => {
  if (!value) return null;
  const safe = value.length > 19 ? value.substring(0, 19) : value;
  return new Date(safe);
};

const getQueueStatus = (cita: CitaApiItem, now: Date): QueueStatus => {
  if (cita.estado === 'CANCELADA') return 'CANCELADA';
  if (cita.estado === 'NO_ASIS') return 'NO_ASIS';
  if (cita.estado === 'REALIZADA') return 'ATENDIDA';

  const start = parseLocalDate(cita.fecha_hora);
  if (!start) return 'EN_ESPERA';

  const duration = cita.duracion_minutos || 30;
  const end = new Date(start.getTime() + duration * 60000);

  if (now < start) return 'EN_ESPERA';
  if (now >= start && now < new Date(start.getTime() + CALL_WINDOW_MINUTES * 60000)) {
    return 'LLAMADO';
  }
  if (now >= start && now <= end) return 'EN_CONSULTA';
  return 'EN_ESPERA';
};

const getStatusChip = (status: QueueStatus) => {
  switch (status) {
    case 'LLAMADO':
      return { label: 'Llamado', color: 'info' as const };
    case 'EN_CONSULTA':
      return { label: 'En consulta', color: 'success' as const };
    case 'ATENDIDA':
      return { label: 'Atendida', color: 'success' as const };
    case 'CANCELADA':
      return { label: 'Cancelada', color: 'error' as const };
    case 'NO_ASIS':
      return { label: 'No asistio', color: 'warning' as const };
    default:
      return { label: 'En espera', color: 'warning' as const };
  }
};

export default function TurnosManagementPage() {
  const notification = useNotification();
  const [citas, setCitas] = useState<CitaApiItem[]>([]);
  const [salas, setSalas] = useState<SalaOption[]>([]);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [selectedSalaId, setSelectedSalaId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const fecha_desde = formatDate(today);
      const fecha_hasta = formatDate(today);
      const [citasData, salasData, pacientesData] = await Promise.all([
        FetchData('/salud/citas', 'GET', { fecha_desde, fecha_hasta, page_size: 1000 }),
        FetchData('/salud/unidades/salas', 'GET', { page: 1, page_size: 500 }),
        FetchData('/salud/pacientes', 'GET', { page: 1, limit: 100 })
      ]);

      const citasArray = Array.isArray(citasData) ? citasData : citasData?.items || [];
      const salasArray = Array.isArray(salasData.items) ? salasData.items : [];
      const pacientesArray = Array.isArray(pacientesData.items)
        ? pacientesData.items
        : Array.isArray(pacientesData)
          ? pacientesData
          : [];

      setCitas(citasArray as CitaApiItem[]);
      setSalas(salasArray as SalaOption[]);
      setPacientes(pacientesArray as PacienteOption[]);
    } catch (e) {
      console.error('Error cargando turnos', e);
      notification.error('Error', 'No se pudieron cargar los turnos');
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData();
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [loadData]);

  const pacientesById = useMemo(() => {
    return new Map(pacientes.map((p) => [p.id, p]));
  }, [pacientes]);

  const citasHoy = useMemo(() => {
    const now = new Date();
    return citas
      .filter((c) => !!parseLocalDate(c.fecha_hora))
      .map((c) => ({
        ...c,
        status: getQueueStatus(c, now),
        start: parseLocalDate(c.fecha_hora) as Date
      }))
      .filter((c) => (selectedSalaId === 'all' ? true : c.sala_id === selectedSalaId))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [citas, selectedSalaId]);

  const counts = useMemo(() => {
    return citasHoy.reduce(
      (acc, cita) => {
        acc.total += 1;
        if (cita.status === 'EN_ESPERA') acc.enEspera += 1;
        if (cita.status === 'LLAMADO') acc.llamado += 1;
        if (cita.status === 'EN_CONSULTA') acc.enConsulta += 1;
        return acc;
      },
      { total: 0, enEspera: 0, llamado: 0, enConsulta: 0 }
    );
  }, [citasHoy]);

  const citasPorSala = useMemo(() => {
    return citasHoy.reduce<Record<string, typeof citasHoy>>((acc, cita) => {
      const key = cita.sala_id ? String(cita.sala_id) : 'sin-sala';
      if (!acc[key]) acc[key] = [];
      acc[key].push(cita);
      return acc;
    }, {});
  }, [citasHoy]);

  const salaLabel = (salaId?: number | null) => {
    if (!salaId) return 'Sin sala asignada';
    const sala = salas.find((s) => s.id === salaId);
    if (!sala) return `Sala ${salaId}`;
    const piso = sala.piso ? ` (Piso ${sala.piso})` : '';
    return `${sala.nombre || `Sala ${sala.id}`}${piso}`;
  };

  const pacienteLabel = (pacienteId: number) => {
    const paciente = pacientesById.get(pacienteId);
    if (!paciente) return `Paciente #${pacienteId}`;
    const nombre = paciente.persona?.nombre_completo || `Paciente #${pacienteId}`;
    const codigo = paciente.codigo_paciente ? ` (${paciente.codigo_paciente})` : '';
    return `${nombre}${codigo}`;
  };

  return (
    <Container>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Sistema de turnos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Colas por sala con estado en espera, llamado y en consulta.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Sala"
            value={selectedSalaId}
            onChange={(e) =>
              setSelectedSalaId(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Todas</MenuItem>
            {salas.map((sala) => (
              <MenuItem key={sala.id} value={sala.id}>
                {sala.nombre || `Sala ${sala.id}`}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={() => void loadData()} disabled={loading}>
            Actualizar
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Total hoy
            </Typography>
            <Typography variant="h6">{counts.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              En espera
            </Typography>
            <Typography variant="h6">{counts.enEspera}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Llamados
            </Typography>
            <Typography variant="h6">{counts.llamado}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              En consulta
            </Typography>
            <Typography variant="h6">{counts.enConsulta}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {Object.keys(citasPorSala).length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No hay turnos para mostrar en este momento.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          Object.entries(citasPorSala).map(([salaId, items]) => (
            <Grid item xs={12} md={6} lg={4} key={salaId}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {salaLabel(salaId === 'sin-sala' ? null : Number(salaId))}
                  </Typography>
                  <Chip label={`${items.length} turnos`} size="small" />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {items.map((cita) => {
                    const start = cita.start as Date;
                    const status = getStatusChip(cita.status as QueueStatus);
                    return (
                      <Box
                        key={cita.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'grey.50'
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {pacienteLabel(cita.paciente_id)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(start, 'HH:mm', { locale: es })} - {cita.motivo || 'Sin motivo'}
                          </Typography>
                        </Box>
                        <Chip label={status.label} color={status.color} size="small" />
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}
