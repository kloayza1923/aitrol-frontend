import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { Container } from '@/components/container';
import { ConfirmDeleteDialog } from '@/components/modal';
import { FetchData } from '@/utils/FetchData';
import { WeeklyCalendar, WeeklyEvent } from '@/components/calendar/WeeklyCalendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
interface DoctorOption {
  id: number;
  codigo_personal?: string;
  especialidad?: string;
  persona?: {
    nombre_completo?: string;
    identificacion?: string;
  } | null;
}

interface AgendaItemApi {
  id: number;
  personal_id: number;
  fecha?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  intervalo_minutos?: number | null;
  tipo_consulta?: string | null;
  estado?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
}

interface CalendarEvent {
  id: number;
  start: Date;
  end: Date;
  raw: AgendaItemApi;
}

const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const PX_PER_MINUTE = 1.5;

const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const formatTime = (d: Date) => d.toTimeString().slice(0, 8);

const combineDateTime = (dateStr?: string | null, timeStr?: string | null) => {
  if (!dateStr || !timeStr) return undefined;
  return new Date(`${dateStr}T${timeStr}`);
};

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // lunes como inicio
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export default function DoctorAgendaPage() {
  const [doctores, setDoctores] = useState<DoctorOption[]>([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStart, setDialogStart] = useState<Date | null>(null);
  const [dialogEnd, setDialogEnd] = useState<Date | null>(null);
  const [dialogTipoConsulta, setDialogTipoConsulta] = useState('Consulta externa');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const loadDoctores = async () => {
      setLoadingDoctores(true);
      try {
        const data = await FetchData('/salud/personal', 'GET');
        setDoctores(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        console.error('Error cargando doctores', e);
      } finally {
        setLoadingDoctores(false);
      }
    };

    loadDoctores();
  }, []);

  const loadEvents = async (doctorId: number, start: Date, end: Date) => {
    try {
      const fecha_desde = formatDate(start);
      const fecha_hasta = formatDate(end);
      const data: AgendaItemApi[] = await FetchData(`/salud/agendas/doctor/${doctorId}`, 'GET', {
        fecha_desde,
        fecha_hasta
      });

      const mapped = (data || []).map((item) => {
        const startDate =
          (item.start_datetime && new Date(item.start_datetime)) ||
          combineDateTime(item.fecha ?? undefined, item.hora_inicio ?? undefined);
        const endDate =
          (item.end_datetime && new Date(item.end_datetime)) ||
          combineDateTime(item.fecha ?? undefined, item.hora_fin ?? undefined);

        if (!startDate) return null;

        const safeEnd = endDate || new Date(startDate.getTime() + SLOT_MINUTES * 60000);

        return {
          id: item.id,
          start: startDate,
          end: safeEnd,
          raw: item
        } as CalendarEvent;
      });

      const filtered = mapped.filter((e): e is CalendarEvent => Boolean(e));
      setEvents(filtered);
    } catch (e) {
      console.error('Error cargando agenda', e);
    }
  };

  const handleDoctorChange = (_: any, newValue: DoctorOption | null) => {
    setSelectedDoctor(newValue);
  };

  const openDialogForRange = (day: Date, startMinutes: number, endMinutes: number) => {
    if (!selectedDoctor) {
      setSnackbar({
        open: true,
        message: 'Primero selecciona un doctor',
        severity: 'warning'
      });
      return;
    }

    const base = new Date(day);
    base.setHours(START_HOUR, 0, 0, 0);

    const start = new Date(base);
    start.setMinutes(start.getMinutes() + startMinutes);

    const end = new Date(base);
    end.setMinutes(end.getMinutes() + endMinutes);

    setDialogStart(start);
    setDialogEnd(end);
    setDialogTipoConsulta('Consulta externa');
    setDialogOpen(true);
  };

  const handleCreateAgenda = async () => {
    if (!selectedDoctor || !dialogStart || !dialogEnd) return;

    const payload = {
      personal_id: selectedDoctor.id,
      fecha: formatDate(dialogStart),
      hora_inicio: formatTime(dialogStart),
      hora_fin: formatTime(dialogEnd),
      intervalo_minutos: 30,
      tipo_consulta: dialogTipoConsulta,
      estado: 'ACTIVO'
    };

    try {
      await FetchData('/salud/agendas', 'POST', payload);
      setDialogOpen(false);
      if (selectedDoctor) {
        const start = currentWeekStart;
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        await loadEvents(selectedDoctor.id, start, end);
      }
    } catch (e) {
      console.error('Error creando agenda', e);
    }
  };

  const handleEventDelete = async (id: number) => {
    try {
      await FetchData(`/salud/agendas/${id}`, 'DELETE');
      if (selectedDoctor) {
        const start = currentWeekStart;
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        await loadEvents(selectedDoctor.id, start, end);
      }
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (e) {
      console.error('Error eliminando agenda', e);
    }
  };

  const handleEventMove = async (ev: WeeklyEvent, newStart: Date, newEnd: Date) => {
    const base = ev.meta as CalendarEvent | undefined;
    if (!base) return;

    const payload = {
      fecha: formatDate(newStart),
      hora_inicio: formatTime(newStart),
      hora_fin: formatTime(newEnd)
    };

    try {
      await FetchData(`/salud/agendas/${base.id}`, 'PUT', payload);
      if (selectedDoctor) {
        const start = currentWeekStart;
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        await loadEvents(selectedDoctor.id, start, end);
      }
    } catch (e) {
      console.error('Error actualizando agenda (drag & drop)', e);
    }
  };

  const doctorLabel = (doc: DoctorOption) => {
    const nombre = doc.persona?.nombre_completo || 'Sin nombre';
    const especialidad = doc.especialidad ? ` - ${doc.especialidad}` : '';
    const codigo = doc.codigo_personal ? ` (${doc.codigo_personal})` : '';
    return `${nombre}${especialidad}${codigo}`;
  };

  const calendarKey = useMemo(
    () => (selectedDoctor ? `calendar-doctor-${selectedDoctor.id}` : 'calendar-empty'),
    [selectedDoctor]
  );

  useEffect(() => {
    if (!selectedDoctor) {
      setEvents([]);
      return;
    }
    const start = currentWeekStart;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    loadEvents(selectedDoctor.id, start, end);
  }, [selectedDoctor, currentWeekStart]);

  return (
    <Container>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Agenda de profesionales de salud
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecciona un profesional de salud y arrastra en el calendario para crear bloques de
          agenda.
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 480, mb: 3 }}>
        <Autocomplete
          options={doctores}
          loading={loadingDoctores}
          value={selectedDoctor}
          onChange={handleDoctorChange}
          getOptionLabel={(option) => doctorLabel(option)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Seleccionar profesional de salud"
              placeholder="Buscar por nombre o código"
            />
          )}
        />
      </Box>
      <WeeklyCalendar
        weekStart={currentWeekStart}
        events={events.map<WeeklyEvent>((e) => ({
          id: e.id,
          start: e.start,
          end: e.end,
          title: e.raw.tipo_consulta || 'Consulta',
          meta: e
        }))}
        onChangeWeek={setCurrentWeekStart}
        startHour={START_HOUR}
        endHour={END_HOUR}
        slotMinutes={SLOT_MINUTES}
        pxPerMinute={PX_PER_MINUTE}
        onRangeSelect={openDialogForRange}
        onEventClick={(ev) => {
          const base = ev.meta as CalendarEvent | undefined;
          if (base) {
            setDeleteId(base.id);
            setDeleteDialogOpen(true);
          }
        }}
        onEventChange={handleEventMove}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva agenda para el doctor</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {dialogStart &&
                dialogEnd &&
                `Desde ${format(dialogStart, 'dd MMM HH:mm', { locale: es })} hasta ${format(dialogEnd, 'dd MMM yyyy HH:mm', { locale: es })}`}
            </Typography>
            <TextField
              label="Tipo de consulta"
              value={dialogTipoConsulta}
              onChange={(e) => setDialogTipoConsulta(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateAgenda}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        title="Eliminar bloque de agenda"
        description="¿Estás seguro de que deseas eliminar este bloque de agenda? Esta acción no se puede deshacer."
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId != null) {
            void handleEventDelete(deleteId);
          }
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
