import { useMemo, useRef } from 'react';
import { Box, Typography, Avatar, useTheme, alpha, IconButton, Button } from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { format as dfFormat, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export interface TimelineResource {
  id: string | number;
  name: string;
  avatar?: string;
  color?: string;
}

export interface TimelineEvent {
  id: string | number;
  resourceId: string | number;
  start: Date;
  end: Date;
  title: string;
  subtitle?: string;
  color?: string;
  meta?: any;
}

export interface TimelineCalendarProps {
  date: Date; // El día que se está mostrando
  resources: TimelineResource[];
  events: TimelineEvent[];
  onChangeDate?: (newDate: Date) => void;
  onEventClick?: (event: TimelineEvent) => void;
  onSlotClick?: (resourceId: string | number, minutesFromStart: number) => void;
  startHour?: number; // Ej: 0
  endHour?: number; // Ej: 24
  slotMinutes?: number; // Ej: 30
  pxPerMinute?: number; // Escala horizontal
}

const formatDate = (date: Date, pattern: string) => dfFormat(date, pattern, { locale: es });

const formatTime = (date: Date) => dfFormat(date, 'h:mma').toLowerCase();

interface LayoutedEvent extends TimelineEvent {
  column: number;
  totalColumns: number;
}

function layoutOverlappingEvents(events: TimelineEvent[], startHour: number): LayoutedEvent[] {
  if (events.length === 0) return [];

  const toMinutes = (d: Date) => (d.getHours() - startHour) * 60 + d.getMinutes();

  const sorted = [...events].sort((a, b) => {
    const startDiff = toMinutes(a.start) - toMinutes(b.start);
    if (startDiff !== 0) return startDiff;
    return toMinutes(b.end) - toMinutes(a.end);
  });

  const layouted: LayoutedEvent[] = sorted.map((e) => ({
    ...e,
    column: 0,
    totalColumns: 1
  }));

  const groups: LayoutedEvent[][] = [];
  let currentGroup: LayoutedEvent[] = [];
  let currentGroupEnd = -Infinity;

  for (const event of layouted) {
    const eventStart = toMinutes(event.start);
    const eventEnd = toMinutes(event.end);

    if (eventStart >= currentGroupEnd) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [event];
      currentGroupEnd = eventEnd;
    } else {
      currentGroup.push(event);
      currentGroupEnd = Math.max(currentGroupEnd, eventEnd);
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  for (const group of groups) {
    const columns: number[] = [];

    for (const event of group) {
      const eventStart = toMinutes(event.start);

      let col = 0;
      while (columns[col] !== undefined && columns[col] > eventStart) {
        col++;
      }

      event.column = col;
      columns[col] = toMinutes(event.end);
    }

    const maxCols = Math.max(...group.map((e) => e.column)) + 1;
    for (const event of group) {
      event.totalColumns = maxCols;
    }
  }

  return layouted;
}

export function TimelineCalendar(props: TimelineCalendarProps) {
  const {
    date,
    resources,
    events,
    onChangeDate,
    onEventClick,
    onSlotClick,
    startHour = 6,
    endHour = 22,
    slotMinutes = 30,
    pxPerMinute = 3
  } = props;

  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalMinutes = (endHour - startHour) * 60;
  const timelineWidth = totalMinutes * pxPerMinute;

  const hours = useMemo(() => {
    const arr = [];
    for (let h = startHour; h < endHour; h++) {
      arr.push(h);
    }
    return arr;
  }, [startHour, endHour]);

  const slotSegments = useMemo(() => {
    const segments = [];
    for (let m = 0; m < totalMinutes; m += slotMinutes) {
      segments.push(m);
    }
    return segments;
  }, [totalMinutes, slotMinutes]);

  const rowHeight = 72; // Altura de cada fila

  const handleToday = () => {
    if (onChangeDate) onChangeDate(startOfDay(new Date()));
  };

  const handlePrevDay = () => {
    if (onChangeDate) onChangeDate(addDays(date, -1));
  };

  const handleNextDay = () => {
    if (onChangeDate) onChangeDate(addDays(date, 1));
  };

  return (
    <Box>
      {/* Cabecera de Navegación */}
      <Box className="flex items-center justify-between mb-3">
        <Box className="flex items-center gap-2">
          <Button
            size="small"
            variant="outlined"
            startIcon={<TodayIcon fontSize="small" />}
            onClick={handleToday}
          >
            Hoy
          </Button>

          <IconButton size="small" onClick={handlePrevDay}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleNextDay}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="subtitle1" className="font-semibold capitalize">
          {formatDate(date, 'EEEE, dd MMMM yyyy')}
        </Typography>
      </Box>

      <Box
        className="flex flex-col rounded-xl overflow-hidden shadow-sm border"
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? '#111827' : '#f8fafc',
          borderColor: theme.palette.mode === 'dark' ? '#374151' : '#e2e8f0'
        }}
      >
        <Box className="flex" sx={{ overflow: 'hidden' }}>
          {/* Columna Izquierda (Resources header vacío) */}
          <Box
            sx={{
              width: 80,
              minWidth: 80,
              borderRight: 1,
              borderColor: theme.palette.mode === 'dark' ? '#374151' : '#e2e8f0',
              backgroundColor: theme.palette.mode === 'dark' ? '#1f2937' : '#ffffff',
              zIndex: 10
            }}
          />

          {/* Cabecera del Timeline (Horas) */}
          <Box
            className="flex-1 overflow-hidden relative"
            sx={{
              height: 48,
              backgroundColor: theme.palette.mode === 'dark' ? '#1f2937' : '#ffffff',
              borderBottom: 1,
              borderColor: theme.palette.mode === 'dark' ? '#374151' : '#e2e8f0'
            }}
          >
            <Box
              className="absolute top-0 bottom-0 left-0"
              sx={{
                width: timelineWidth,
                transform: `translateX(-${scrollRef.current?.scrollLeft || 0}px)`
              }} // Para sincronizar scroll (opcional o usar onScroll sync)
            >
              {hours.map((hour) => {
                const left = (hour - startHour) * 60 * pxPerMinute;
                const d = new Date(date);
                d.setHours(hour, 0, 0, 0);
                return (
                  <Box
                    key={hour}
                    className="absolute top-0 bottom-0 flex flex-col justify-end pb-1"
                    sx={{ left, width: 60 * pxPerMinute }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 1,
                        color: theme.palette.mode === 'dark' ? '#9ca3af' : '#64748b',
                        fontWeight: 500
                      }}
                    >
                      {formatTime(d)}
                    </Typography>
                    <Box className="flex justify-between w-full px-1">
                      <Box
                        sx={{
                          width: 1,
                          height: 4,
                          bgcolor: theme.palette.mode === 'dark' ? '#4b5563' : '#cbd5e1'
                        }}
                      />
                      <Box
                        sx={{
                          width: 1,
                          height: 4,
                          bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#f1f5f9'
                        }}
                      />
                      <Box
                        sx={{
                          width: 1,
                          height: 4,
                          bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#f1f5f9'
                        }}
                      />
                      <Box
                        sx={{
                          width: 1,
                          height: 4,
                          bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#f1f5f9'
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Cuerpo del Timeline */}
        <Box
          className="flex flex-1 overflow-auto"
          sx={{ maxHeight: '70vh' }}
          ref={scrollRef}
          onScroll={(e) => {
            // Sincronizar scroll horizontal del header
            const header = e.currentTarget.previousElementSibling?.children[1]
              ?.children[0] as HTMLElement;
            if (header) {
              header.style.transform = `translateX(-${e.currentTarget.scrollLeft}px)`;
            }
          }}
        >
          {/* Columna Izquierda (Resources) */}
          <Box
            className="flex flex-col sticky left-0 z-10"
            sx={{
              width: 80,
              minWidth: 80,
              backgroundColor: theme.palette.mode === 'dark' ? '#111827' : '#f8fafc',
              borderRight: 1,
              borderColor: theme.palette.mode === 'dark' ? '#374151' : '#e2e8f0'
            }}
          >
            {resources.map((res) => (
              <Box
                key={res.id}
                className="flex items-center justify-center border-b"
                sx={{
                  height: rowHeight,
                  borderColor: theme.palette.mode === 'dark' ? '#1f2937' : '#e2e8f0'
                }}
              >
                <Avatar
                  src={res.avatar}
                  sx={{
                    bgcolor: res.color || theme.palette.primary.main,
                    fontWeight: 'bold',
                    width: 48,
                    height: 48
                  }}
                >
                  {!res.avatar && res.name.substring(0, 2).toUpperCase()}
                </Avatar>
              </Box>
            ))}
          </Box>

          {/* Grilla de Eventos */}
          <Box
            className="relative"
            sx={{ width: timelineWidth, minHeight: resources.length * rowHeight }}
          >
            {/* Líneas verticales de las horas */}
            <Box className="absolute inset-0 pointer-events-none flex">
              {hours.map((hour) => (
                <Box
                  key={hour}
                  sx={{
                    width: 60 * pxPerMinute,
                    borderRight: 1,
                    borderColor: theme.palette.mode === 'dark' ? '#1f2937' : '#f1f5f9'
                  }}
                />
              ))}
            </Box>

            {/* Filas */}
            {resources.map((res, rowIndex) => {
              const resEvents = events.filter((e) => e.resourceId === res.id);
              return (
                <Box
                  key={res.id}
                  className="absolute w-full border-b flex"
                  sx={{
                    top: rowIndex * rowHeight,
                    height: rowHeight,
                    borderColor: theme.palette.mode === 'dark' ? '#1f2937' : '#e2e8f0'
                  }}
                >
                  {/* Slots Clickable Background */}
                  {slotSegments.map((m) => (
                    <Box
                      key={m}
                      className="hover:bg-blue-50/10 cursor-pointer"
                      sx={{
                        width: slotMinutes * pxPerMinute,
                        minWidth: slotMinutes * pxPerMinute,
                        height: '100%',
                        borderRight: 1,
                        borderColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.05)'
                      }}
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (onSlotClick) {
                          onSlotClick(res.id, m);
                        }
                      }}
                    />
                  ))}

                  {/* Eventos en la fila */}
                  <Box className="absolute inset-0 pointer-events-none">
                    {layoutOverlappingEvents(resEvents, startHour).map((event) => {
                      const startMins =
                        (event.start.getHours() - startHour) * 60 + event.start.getMinutes();
                      const endMins =
                        (event.end.getHours() - startHour) * 60 + event.end.getMinutes();

                      if (endMins <= 0 || startMins >= totalMinutes) return null;

                      const left = Math.max(0, startMins) * pxPerMinute;
                      const width = Math.max(
                        (Math.min(endMins, totalMinutes) - Math.max(0, startMins)) * pxPerMinute,
                        20
                      );

                      const isDark = theme.palette.mode === 'dark';
                      const baseBg = event.color || (isDark ? '#334155' : '#3b82f6');

                      const padding = 3;
                      const availableHeight = rowHeight - padding * 2;
                      const gap = 2;
                      const eventHeight =
                        (availableHeight - gap * (event.totalColumns - 1)) / event.totalColumns;
                      const eventTop = padding + event.column * (eventHeight + gap);

                      return (
                        <Box
                          key={event.id}
                          className="absolute rounded-md cursor-pointer overflow-hidden flex flex-col px-2 py-0.5 shadow-sm transition-all hover:brightness-110 hover:z-10"
                          sx={{
                            left,
                            width,
                            top: eventTop,
                            height: eventHeight,
                            backgroundColor: isDark ? alpha(baseBg, 0.4) : baseBg,
                            border: 1,
                            borderColor: isDark ? alpha(baseBg, 0.5) : 'transparent',
                            color: isDark ? '#e2e8f0' : '#ffffff',
                            pointerEvents: 'auto',
                            zIndex: event.column
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEventClick) onEventClick(event);
                          }}
                        >
                          <Typography
                            variant="body2"
                            className="font-semibold truncate leading-tight"
                            sx={{ fontSize: event.totalColumns > 2 ? '0.7rem' : undefined }}
                          >
                            {event.title}
                          </Typography>
                          {event.totalColumns <= 2 && (
                            <Typography
                              variant="caption"
                              className="truncate opacity-80"
                              sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}
                            >
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </Typography>
                          )}
                          {event.subtitle && event.totalColumns <= 1 && (
                            <Typography
                              variant="caption"
                              className="truncate mt-auto opacity-70"
                              sx={{ fontSize: '0.65rem' }}
                            >
                              {event.subtitle}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
