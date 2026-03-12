import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Drawer,
  TextField,
  Typography,
  Grid,
  Paper,
  IconButton,
  Alert,
  Chip,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Container } from '@/components/container';
import { ConfirmDeleteDialog } from '@/components/modal';
import { FetchData } from '@/utils/FetchData';
import { WeeklyCalendar, WeeklyEvent } from '@/components/calendar/WeeklyCalendar';
import { TimelineCalendar, TimelineEvent } from '@/components/calendar/TimelineCalendar';
import { CitaWizard } from '@/components/wizard/CitaWizard';
import { useNotification } from '@/hooks';
import { format, parse, set } from 'date-fns';
import { es } from 'date-fns/locale';

interface PacienteOption {
  id: number;
  codigo_paciente?: string;
  persona?: {
    nombre_completo?: string;
    identificacion?: string;
  } | null;
}

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

interface SalaOption {
  id: number;
  nombre?: string;
  piso?: number;
  descripcion?: string;
}

interface CamaOption {
  id: number;
  numero?: string | number;
  sala_id?: number;
  descripcion?: string;
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
  cama_id?: number | null;
}

interface CalendarCita {
  id: number;
  start: Date;
  end: Date;
  raw: CitaApiItem;
}

const START_HOUR = 6;
const END_HOUR = 22;
const PX_PER_MINUTE = 1.5;

const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');
const formatTime = (d: Date) => format(d, 'HH:mm:ss');
const formatDateTime = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss");

const startOfWeek = (date: Date) => {
  const d = format(date, 'yyyy-MM-dd');
  return parse(d, 'yyyy-MM-dd', new Date());
};

const startOfDay = (date: Date) => {
  const d = format(date, 'yyyy-MM-dd');
  return parse(d, 'yyyy-MM-dd', new Date());
};

const isSameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const getEstadoColor = (estado?: string) => {
  switch (estado) {
    case 'CONFIRMADA':
      return 'success';
    case 'REALIZADA':
      return 'info';
    case 'CANCELADA':
      return 'error';
    case 'NO_ASIS':
      return 'warning';
    default:
      return 'default';
  }
};

const getEstadoHexColor = (estado?: string) => {
  switch (estado) {
    case 'CONFIRMADA':
      return '#22c55e'; // success
    case 'REALIZADA':
      return '#3b82f6'; // info
    case 'CANCELADA':
      return '#ef4444'; // error
    case 'NO_ASIS':
      return '#f59e0b'; // warning
    default:
      return '#64748b'; // default / pendiente
  }
};

export default function CitasManagementPage() {
  const notification = useNotification();
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [doctores, setDoctores] = useState<DoctorOption[]>([]);
  const [salas, setSalas] = useState<SalaOption[]>([]);
  const [camas, setCamas] = useState<CamaOption[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<PacienteOption | null>(null);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<DoctorOption | null>(null);
  const [citas, setCitas] = useState<CalendarCita[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  const [calendarView, setCalendarView] = useState<'week' | 'timeline'>('timeline');
  const [currentTimelineDate, setCurrentTimelineDate] = useState<Date>(() =>
    startOfDay(new Date())
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogId, setDialogId] = useState<number | null>(null);
  const [dialogStart, setDialogStart] = useState<Date | null>(null);
  const [dialogEnd, setDialogEnd] = useState<Date | null>(null);
  const [dialogMotivo, setDialogMotivo] = useState('');
  const [dialogDoctor, setDialogDoctor] = useState<DoctorOption | null>(null);
  const [dialogSala, setDialogSala] = useState<SalaOption | null>(null);
  const [dialogCama, setDialogCama] = useState<CamaOption | null>(null);
  const [dialogEstado, setDialogEstado] = useState('PENDIENTE');
  const [dialogTipo, setDialogTipo] = useState('CONSULTA');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Wizard states
  const [showWizard, setShowWizard] = useState(false);

  // Load doctores, salas y camas on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [doctoresData, salasData, camasData] = await Promise.all([
          FetchData('/salud/personal', 'GET', { page: 1, page_size: 500 }),
          FetchData('/salud/unidades/salas', 'GET', { page: 1, page_size: 500 }),
          FetchData('/salud/unidades/camas', 'GET', { page: 1, page_size: 500 })
        ]);
        setDoctores(Array.isArray(doctoresData.items) ? doctoresData.items : []);
        setSalas(Array.isArray(salasData.items) ? salasData.items : []);
        setCamas(Array.isArray(camasData.items) ? camasData.items : []);
      } catch (e) {
        console.error('Error cargando datos', e);
        notification.error('Error', 'No se pudieron cargar datos iniciales');
      }
    };

    loadData();
  }, []);

  // Async search for pacientes
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

  const loadCitas = async (pacienteId: number | null, start: Date, end: Date) => {
    try {
      const fecha_desde = formatDate(start);
      const fecha_hasta = formatDate(end);
      const endpoint = pacienteId ? `/salud/citas/paciente/${pacienteId}` : '/salud/citas';
      const data = await FetchData(endpoint, 'GET', { fecha_desde, fecha_hasta, page_size: 1000 });

      const citasArray = Array.isArray(data) ? data : data?.items || [];

      const mapped = (citasArray as CitaApiItem[])
        .filter((item: any) => item.fecha_hora) // Solo items con fecha
        .map((item: any) => {
          // Remover la informacion de timezone si existiera para interpretarlo como hora local
          const fechaHoraStr =
            item.fecha_hora.length > 19 ? item.fecha_hora.substring(0, 19) : item.fecha_hora;
          const startDate = new Date(fechaHoraStr);
          const duracion = item.duracion_minutos || slotMinutes;
          const endDate = new Date(startDate.getTime() + duracion * 60000);

          return {
            id: item.id,
            start: startDate,
            end: endDate,
            raw: item
          } as CalendarCita;
        });

      setCitas(mapped);
    } catch (e) {
      console.error('Error cargando citas', e);
      notification.error('Error', 'No se pudieron cargar las citas');
    }
  };

  const handlePacienteChange = (_: any, newValue: PacienteOption | null) => {
    setSelectedPaciente(newValue);
  };

  const openDialogForRange = (
    day: Date,
    startMinutes: number,
    endMinutes: number,
    doctorId?: number
  ) => {
    const base = new Date(day);
    base.setHours(START_HOUR, 0, 0, 0);

    const start = new Date(base);
    start.setMinutes(start.getMinutes() + startMinutes);

    const end = new Date(base);
    end.setMinutes(end.getMinutes() + endMinutes);

    if (!selectedPaciente) {
      // Open wizard to create new patient
      setShowWizard(true);
      return;
    }

    // Patient exists, open drawer to create cita
    setDialogId(null);
    setDialogStart(start);
    setDialogEnd(end);
    setDialogMotivo('');
    setDialogDoctor(
      doctorId
        ? doctores.find((d) => d.id === doctorId) || selectedDoctorFilter || null
        : selectedDoctorFilter || null
    );
    setDialogSala(null);
    setDialogCama(null);
    setDialogEstado('PENDIENTE');
    setDialogTipo('CONSULTA');
    setDrawerOpen(true);
  };

  const openEditDialog = (base: CalendarCita) => {
    setDialogId(base.id);
    setDialogStart(base.start);
    setDialogEnd(base.end);
    setDialogMotivo(base.raw.motivo || '');
    setDialogDoctor(doctores.find((d) => d.id === base.raw.personal_id) || null);
    setDialogSala(salas.find((s) => s.id === base.raw.sala_id) || null);
    setDialogCama(camas.find((c) => c.id === base.raw.cama_id) || null);
    setDialogEstado(base.raw.estado || 'PENDIENTE');
    setDialogTipo(base.raw.tipo || 'CONSULTA');
    setDrawerOpen(true);
  };

  const handleSaveCita = async () => {
    if (!dialogStart || !dialogEnd || !dialogDoctor || !dialogSala) {
      notification.warning(
        'Campos Requeridos',
        'Completa todos los campos requeridos (Profesional, Sala)'
      );
      return;
    }
    if (!dialogId && !selectedPaciente) {
      notification.warning('Campos Requeridos', 'Selecciona un paciente para crear la cita');
      return;
    }

    const payload: any = {
      personal_id: dialogDoctor.id,
      sala_id: dialogSala.id,
      ...(dialogCama && { cama_id: dialogCama.id }),
      fecha_hora: formatDateTime(dialogStart),
      duracion_minutos: Math.round((dialogEnd.getTime() - dialogStart.getTime()) / 60000),
      motivo: dialogMotivo,
      tipo: dialogTipo,
      estado: dialogEstado
    };

    if (!dialogId && selectedPaciente) {
      payload.paciente_id = selectedPaciente.id;
    }

    try {
      if (dialogId) {
        await FetchData(`/salud/citas/${dialogId}`, 'PUT', payload);
        notification.success('Éxito', 'Cita actualizada exitosamente');
      } else {
        await FetchData('/salud/citas', 'POST', payload);
        notification.success('Éxito', 'Cita creada exitosamente');
      }
      setDrawerOpen(false);
      const start = currentWeekStart;
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      await loadCitas(selectedPaciente ? selectedPaciente.id : null, start, end);
    } catch (e) {
      console.error('Error guardando cita', e);
      notification.error('Error', e instanceof Error ? e.message : 'No se pudo guardar la cita');
    }
  };

  const handleCitaDelete = async (id: number) => {
    try {
      await FetchData(`/salud/citas/${id}`, 'DELETE');
      notification.success('Éxito', 'Cita eliminada exitosamente');
      const start = currentWeekStart;
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      await loadCitas(selectedPaciente ? selectedPaciente.id : null, start, end);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (e) {
      console.error('Error eliminando cita', e);
      notification.error('Error', 'No se pudo eliminar la cita');
    }
  };

  const handleCitaMove = async (ev: WeeklyEvent, newStart: Date, newEnd: Date) => {
    const base = ev.meta as CalendarCita | undefined;
    if (!base || !base.raw.fecha_hora) return;

    try {
      const duracion_minutos = Math.round((newEnd.getTime() - newStart.getTime()) / 60000);

      const payload = {
        fecha_hora: formatDateTime(newStart),
        duracion_minutos: duracion_minutos || base.raw.duracion_minutos
      };

      await FetchData(`/salud/citas/${base.id}`, 'PUT', payload);
      notification.success('Éxito', 'Cita actualizada exitosamente');
      const start = currentWeekStart;
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      await loadCitas(selectedPaciente ? selectedPaciente.id : null, start, end);
    } catch (e) {
      console.error('Error actualizando cita', e);
      notification.error('Error', e instanceof Error ? e.message : 'No se pudo actualizar la cita');
    }
  };

  const handleWizardSuccess = async () => {
    // Reload data after wizard
    setLoadingPacientes(true);
    setShowWizard(false);
    try {
      const [pacientesData, doctoresData, salasData, camasData] = await Promise.all([
        FetchData('/salud/pacientes', 'GET', {
          page: 1,
          limit: 50,
          search: pacienteSearch || undefined
        }),
        FetchData('/salud/personal', 'GET', { page: 1, page_size: 500 }),
        FetchData('/salud/unidades/salas', 'GET', { page: 1, page_size: 500 }),
        FetchData('/salud/unidades/camas', 'GET', { page: 1, page_size: 500 })
      ]);
      setPacientes(
        Array.isArray(pacientesData.items)
          ? pacientesData.items
          : Array.isArray(pacientesData)
            ? pacientesData
            : []
      );
      setDoctores(Array.isArray(doctoresData.items) ? doctoresData.items : []);
      setSalas(Array.isArray(salasData.items) ? salasData.items : []);
      setCamas(Array.isArray(camasData.items) ? camasData.items : []);
    } catch (e) {
      console.error('Error reloading data', e);
    } finally {
      setLoadingPacientes(false);
    }
  };

  const pacienteLabel = (p: PacienteOption) => {
    const nombre = p.persona?.nombre_completo || 'Sin nombre';
    const codigo = p.codigo_paciente ? ` (${p.codigo_paciente})` : '';
    return `${nombre}${codigo}`;
  };

  const doctorLabel = (doc: DoctorOption) => {
    const nombre = doc.persona?.nombre_completo || 'Sin nombre';
    const especialidad = doc.especialidad ? ` - ${doc.especialidad}` : '';
    const codigo = doc.codigo_personal ? ` (${doc.codigo_personal})` : '';
    return `${nombre}${especialidad}${codigo}`;
  };

  const salaLabel = (sala: SalaOption) => {
    const nombre = sala.nombre || `Sala ${sala.id}`;
    const piso = sala.piso ? ` (Piso ${sala.piso})` : '';
    return `${nombre}${piso}`;
  };

  const camaLabel = (cama: CamaOption) => {
    return `Cama ${cama.numero}`;
  };

  const camasFiltradas = useMemo(() => {
    if (!dialogSala) return camas;
    return camas.filter((c) => c.sala_id === dialogSala.id);
  }, [camas, dialogSala]);

  // Limpiar cama cuando cambia la sala
  useEffect(() => {
    if (dialogSala && dialogCama && dialogCama.sala_id !== dialogSala.id) {
      setDialogCama(null);
    }
  }, [dialogSala, dialogCama]);

  const calendarKey = useMemo(
    () => (selectedPaciente ? `calendar-paciente-${selectedPaciente.id}` : 'calendar-empty'),
    [selectedPaciente]
  );

  useEffect(() => {
    const start = currentWeekStart;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    loadCitas(selectedPaciente ? selectedPaciente.id : null, start, end);
  }, [selectedPaciente, currentWeekStart]);

  const handleTimelineDateChange = (newDate: Date) => {
    setCurrentTimelineDate(newDate);
    const newWeekStart = startOfWeek(newDate);
    if (newWeekStart.getTime() !== currentWeekStart.getTime()) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const timelineResources = useMemo(() => {
    const filtered = selectedDoctorFilter
      ? doctores.filter((d) => d.id === selectedDoctorFilter.id)
      : doctores;
    return filtered.map((doc) => ({
      id: doc.id,
      name: doc.persona?.nombre_completo || 'Doctor sin nombre',
      subtitle: doc.especialidad,
      color: '#475569'
    }));
  }, [doctores, selectedDoctorFilter]);

  const timelineEvents = useMemo(() => {
    return citas
      .filter((c) => isSameDay(c.start, currentTimelineDate))
      .filter((c) => !selectedDoctorFilter || c.raw.personal_id === selectedDoctorFilter.id)
      .map<TimelineEvent>((c) => ({
        id: c.id,
        resourceId: c.raw.personal_id,
        start: c.start,
        end: c.end,
        title: c.raw.motivo || 'Cita',
        subtitle: c.raw.estado || 'PENDIENTE',
        meta: c,
        color: getEstadoHexColor(c.raw.estado as string)
      }));
  }, [citas, currentTimelineDate, selectedDoctorFilter]);

  return (
    <Container>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Gestión de Citas Médicas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sigue los pasos para agendar una cita médica.
        </Typography>
      </Box>

      {showWizard && !selectedPaciente ? (
        <CitaWizard
          onCancel={() => setShowWizard(false)}
          onSuccess={handleWizardSuccess}
          selectedDateTime={null}
          doctores={doctores}
        />
      ) : (
        <>
          {/* Paso 1 y 2: Selección de Paciente y Profesional */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              {/* PASO 1: Paciente */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: selectedPaciente ? 'success.main' : 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    1
                  </Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Seleccionar Paciente
                  </Typography>
                  {selectedPaciente && <Chip label="Completado" color="success" size="small" />}
                </Box>

                {!selectedPaciente ? (
                  <Box>
                    <Autocomplete
                      options={pacientes}
                      loading={loadingPacientes}
                      value={selectedPaciente}
                      onChange={handlePacienteChange}
                      onInputChange={(_, newInputValue) => {
                        setPacienteSearch(newInputValue);
                      }}
                      filterOptions={(x) => x}
                      getOptionLabel={(option) => pacienteLabel(option)}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar Paciente"
                          placeholder="Nombre, documento o código..."
                          size="small"
                        />
                      )}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setShowWizard(true)}
                    >
                      Crear Nuevo Paciente
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'success.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'success.200'
                    }}
                  >
                    <Typography variant="body1" fontWeight="medium">
                      {selectedPaciente.persona?.nombre_completo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Código: {selectedPaciente.codigo_paciente}
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setSelectedPaciente(null)}
                      sx={{ mt: 1, p: 0 }}
                    >
                      Cambiar paciente
                    </Button>
                  </Box>
                )}
              </Grid>

              {/* PASO 2: Profesional */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: selectedDoctorFilter ? 'success.main' : 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    2
                  </Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Seleccionar Profesional
                  </Typography>
                  {selectedDoctorFilter && <Chip label="Completado" color="success" size="small" />}
                </Box>

                {!selectedDoctorFilter ? (
                  <Autocomplete
                    options={doctores}
                    value={selectedDoctorFilter}
                    onChange={(_, value) => {
                      setSelectedDoctorFilter(value);
                      if (value) {
                        const docSlot =
                          value.raw?.disponibilidad?.slot_duration ||
                          value.disponibilidad?.slot_duration ||
                          value.persona?.disponibilidad?.slot_duration;
                        if (docSlot) setSlotMinutes(docSlot);
                      }
                    }}
                    getOptionLabel={(option) => doctorLabel(option)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar Profesional"
                        placeholder="Nombre o especialidad..."
                        size="small"
                      />
                    )}
                  />
                ) : (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'success.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'success.200'
                    }}
                  >
                    <Typography variant="body1" fontWeight="medium">
                      {selectedDoctorFilter.persona?.nombre_completo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDoctorFilter.especialidad || 'Sin especialidad'}
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setSelectedDoctorFilter(null)}
                      sx={{ mt: 1, p: 0 }}
                    >
                      Cambiar profesional
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Paso 3: Calendario - Solo visible cuando hay paciente y profesional */}
          {selectedPaciente && selectedDoctorFilter ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}
                >
                  3
                </Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Seleccionar Horario
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
                <TextField
                  select
                  size="small"
                  value={slotMinutes}
                  onChange={(e) => setSlotMinutes(Number(e.target.value))}
                  label="Intervalo"
                  disabled
                  sx={{ width: 130 }}
                >
                  <MenuItem value={15}>15 min</MenuItem>
                  <MenuItem value={20}>20 min</MenuItem>
                  <MenuItem value={30}>30 min</MenuItem>
                  <MenuItem value={60}>60 min</MenuItem>
                </TextField>
                <Button
                  size="small"
                  variant={calendarView === 'week' ? 'contained' : 'outlined'}
                  onClick={() => setCalendarView('week')}
                >
                  Semanal
                </Button>
                <Button
                  size="small"
                  variant={calendarView === 'timeline' ? 'contained' : 'outlined'}
                  onClick={() => setCalendarView('timeline')}
                >
                  Timeline
                </Button>
              </Box>

              {calendarView === 'week' && (
                <WeeklyCalendar
                  key={calendarKey}
                  weekStart={currentWeekStart}
                  events={citas
                    .filter((c) => c.raw.personal_id === selectedDoctorFilter.id)
                    .map<WeeklyEvent>((c) => ({
                      id: c.id,
                      start: c.start,
                      end: c.end,
                      title: c.raw.motivo || 'Cita',
                      meta: c,
                      color:
                        c.raw.estado === 'CONFIRMADA'
                          ? 'success'
                          : c.raw.estado === 'REALIZADA'
                            ? 'info'
                            : c.raw.estado === 'CANCELADA'
                              ? 'error'
                              : 'warning'
                    }))}
                  onChangeWeek={setCurrentWeekStart}
                  startHour={START_HOUR}
                  endHour={END_HOUR}
                  slotMinutes={slotMinutes}
                  pxPerMinute={PX_PER_MINUTE}
                  onRangeSelect={(day, startMinutes, endMinutes) =>
                    openDialogForRange(day, startMinutes, endMinutes, selectedDoctorFilter.id)
                  }
                  onEventClick={(ev) => {
                    const base = ev.meta as CalendarCita | undefined;
                    if (base) {
                      openEditDialog(base);
                    }
                  }}
                  onEventChange={handleCitaMove}
                />
              )}

              {calendarView === 'timeline' && (
                <TimelineCalendar
                  key={`${calendarKey}-timeline`}
                  date={currentTimelineDate}
                  onChangeDate={handleTimelineDateChange}
                  resources={timelineResources}
                  events={timelineEvents}
                  startHour={START_HOUR}
                  endHour={END_HOUR}
                  slotMinutes={slotMinutes}
                  pxPerMinute={3}
                  onSlotClick={(resourceId, minutesFromStart) => {
                    const docSlot =
                      selectedDoctorFilter?.raw?.disponibilidad?.slot_duration ||
                      selectedDoctorFilter?.disponibilidad?.slot_duration ||
                      selectedDoctorFilter?.persona?.disponibilidad?.slot_duration ||
                      slotMinutes;
                    openDialogForRange(
                      currentTimelineDate,
                      minutesFromStart,
                      minutesFromStart + docSlot,
                      selectedDoctorFilter.id
                    );
                  }}
                  onEventClick={(ev) => {
                    const base = ev.meta as CalendarCita | undefined;
                    if (base) {
                      openEditDialog(base);
                    }
                  }}
                />
              )}
            </Paper>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              {!selectedPaciente && !selectedDoctorFilter
                ? 'Completa los pasos 1 y 2 para ver el calendario de citas disponibles.'
                : !selectedPaciente
                  ? 'Selecciona un paciente (paso 1) para continuar.'
                  : 'Selecciona un profesional (paso 2) para ver el calendario.'}
            </Alert>
          )}
        </>
      )}

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box
          sx={{
            width: 400,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: '100%'
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">
              {dialogId ? 'Editar Cita Médica' : 'Nueva Cita Médica'}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ p: 1, borderRadius: 1 }}>
            {dialogStart &&
              dialogEnd &&
              `Desde ${format(dialogStart, 'dd MMM HH:mm', { locale: es })} hasta ${format(dialogEnd, 'dd MMM yyyy HH:mm', { locale: es })}`}
          </Typography>

          <Autocomplete
            options={doctores}
            value={dialogDoctor}
            onChange={(_, value) => {
              setDialogDoctor(value);
              if (value && dialogStart && !dialogId) {
                const docSlot =
                  value.raw?.disponibilidad?.slot_duration ||
                  value.disponibilidad?.slot_duration ||
                  value.persona?.disponibilidad?.slot_duration ||
                  slotMinutes;
                const newEnd = new Date(dialogStart);
                newEnd.setMinutes(newEnd.getMinutes() + docSlot);
                setDialogEnd(newEnd);
              }
            }}
            getOptionLabel={(option) => doctorLabel(option)}
            renderInput={(params) => <TextField {...params} label="Profesional de Salud *" />}
          />

          <Autocomplete
            options={salas}
            value={dialogSala}
            onChange={(_, value) => setDialogSala(value)}
            getOptionLabel={(option) => salaLabel(option)}
            renderInput={(params) => <TextField {...params} label="Sala *" />}
          />

          <Autocomplete
            options={camasFiltradas}
            value={dialogCama}
            onChange={(_, value) => setDialogCama(value)}
            getOptionLabel={(option) => camaLabel(option)}
            renderInput={(params) => <TextField {...params} label="Cama (Opcional)" />}
          />

          <TextField
            label="Motivo de la Cita"
            value={dialogMotivo}
            onChange={(e) => setDialogMotivo(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Describe el motivo de la cita"
          />

          <TextField
            label="Tipo de Cita *"
            select
            value={dialogTipo}
            onChange={(e) => setDialogTipo(e.target.value)}
            fullWidth
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

          <TextField
            label="Estado"
            select
            value={dialogEstado}
            onChange={(e) => setDialogEstado(e.target.value)}
            fullWidth
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

          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
            {dialogId && (
              <Button
                color="error"
                variant="outlined"
                onClick={() => {
                  setDeleteId(dialogId);
                  setDeleteDialogOpen(true);
                  setDrawerOpen(false);
                }}
              >
                Eliminar
              </Button>
            )}
            <Button onClick={() => setDrawerOpen(false)} fullWidth variant="outlined">
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSaveCita} fullWidth>
              {dialogId ? 'Guardar Cambios' : 'Guardar Cita'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        title="Eliminar Cita"
        description={`¿Estás seguro de que deseas eliminar esta cita?${deleteId && citas.find((c) => c.id === deleteId)?.raw.motivo ? ` (${citas.find((c) => c.id === deleteId)?.raw.motivo})` : ''} Esta acción no se puede deshacer.`}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId != null) {
            void handleCitaDelete(deleteId);
          }
        }}
      />
    </Container>
  );
}
