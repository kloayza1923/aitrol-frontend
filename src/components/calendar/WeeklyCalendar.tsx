import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import {
  addDays as dfAddDays,
  addMinutes as dfAddMinutes,
  startOfWeek as dfStartOfWeek,
  startOfDay as dfStartOfDay,
  startOfMonth as dfStartOfMonth,
  isSameDay as dfIsSameDay,
  format as dfFormat
} from 'date-fns';
import { es } from 'date-fns/locale';

export interface WeeklyEvent {
  id: string | number;
  start: Date;
  end: Date;
  title: string;
  color?: string;
  meta?: any;
}

export interface WeeklyCalendarProps {
  weekStart: Date;
  events: WeeklyEvent[];
  onChangeWeek: (newWeekStart: Date) => void;
  onSlotClick?: (day: Date, minutesFromStart: number) => void;
  onRangeSelect?: (day: Date, startMinutes: number, endMinutes: number) => void;
  onEventClick?: (event: WeeklyEvent) => void;
  onEventChange?: (event: WeeklyEvent, newStart: Date, newEnd: Date) => void;
  startHour?: number; // 0-23
  endHour?: number; // 0-23
  slotMinutes?: number; // e.g. 30
  pxPerMinute?: number; // for vertical scale, e.g. 1.5
}

const defaultStartHour = 6;
const defaultEndHour = 22;
const defaultSlotMinutes = 30;
const defaultPxPerMinute = 1.5;

const startOfWeek = (date: Date) => dfStartOfWeek(date, { weekStartsOn: 1, locale: es });

const isSameDay = (a: Date, b: Date) => dfIsSameDay(a, b);

const startOfMonth = (date: Date) => dfStartOfMonth(dfStartOfDay(date));

const addDays = (date: Date, days: number) => dfAddDays(date, days);

const formatDate = (date: Date, pattern: string) => dfFormat(date, pattern, { locale: es });

const formatTime = (date: Date) => dfFormat(date, 'HH:mm', { locale: es });

export function WeeklyCalendar(props: WeeklyCalendarProps) {
  const {
    weekStart,
    events,
    onChangeWeek,
    onSlotClick,
    onRangeSelect,
    onEventClick,
    onEventChange,
    startHour = defaultStartHour,
    endHour = defaultEndHour,
    slotMinutes = defaultSlotMinutes,
    pxPerMinute = defaultPxPerMinute
  } = props;

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(weekStart);
  const [miniMonthStart, setMiniMonthStart] = useState<Date>(startOfMonth(weekStart));

  const [dragState, setDragState] = useState<{
    event: WeeklyEvent;
    originalStart: Date;
    originalEnd: Date;
    startY: number;
    startX: number;
    deltaMinutes: number;
    deltaDays: number;
    mode: 'move' | 'resize-end';
  } | null>(null);

  const [selectionState, setSelectionState] = useState<{
    day: Date;
    startMinutes: number;
    endMinutes: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    setSelectedDate(weekStart);
    setMiniMonthStart(startOfMonth(weekStart));
  }, [weekStart]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const timeSlots = useMemo(() => {
    const slots: { minutesFromStart: number; label: string }[] = [];
    const totalMinutes = (endHour - startHour) * 60;
    for (let m = 0; m < totalMinutes; m += slotMinutes) {
      const hour = startHour + Math.floor(m / 60);
      const minute = m % 60;
      const label = minute === 0 ? `${hour.toString().padStart(2, '0')}:00` : '';
      slots.push({ minutesFromStart: m, label });
    }
    return slots;
  }, [startHour, endHour, slotMinutes]);

  const handleToday = () => {
    const today = dfStartOfDay(new Date());
    const newWeek = startOfWeek(today);
    onChangeWeek(newWeek);
    setSelectedDate(today);
    setViewMode('week');
  };

  const handlePrevWeek = () => {
    if (viewMode === 'week') {
      const prev = new Date(weekStart);
      prev.setDate(prev.getDate() - 7);
      onChangeWeek(startOfWeek(prev));
    } else {
      const prevDay = addDays(selectedDate, -1);
      setSelectedDate(prevDay);
      const newWeekStart = startOfWeek(prevDay);
      if (newWeekStart.getTime() !== weekStart.getTime()) {
        onChangeWeek(newWeekStart);
      }
    }
  };

  const handleNextWeek = () => {
    if (viewMode === 'week') {
      const next = new Date(weekStart);
      next.setDate(next.getDate() + 7);
      onChangeWeek(startOfWeek(next));
    } else {
      const nextDay = addDays(selectedDate, 1);
      setSelectedDate(nextDay);
      const newWeekStart = startOfWeek(nextDay);
      if (newWeekStart.getTime() !== weekStart.getTime()) {
        onChangeWeek(newWeekStart);
      }
    }
  };

  const columnHeight = (endHour - startHour) * 60 * pxPerMinute;

  const applyDeltaAndClamp = (
    baseStart: Date,
    baseEnd: Date,
    deltaMinutes: number,
    deltaDays: number = 0
  ) => {
    const totalMinutes = (endHour - startHour) * 60;
    const duration = (baseEnd.getTime() - baseStart.getTime()) / 60000;

    let minutesFromStart =
      (baseStart.getHours() - startHour) * 60 + baseStart.getMinutes() + deltaMinutes;

    // Snap to ensure dragged appointments don't start at random minutes
    minutesFromStart = Math.round(minutesFromStart / slotMinutes) * slotMinutes;

    minutesFromStart = Math.max(0, Math.min(minutesFromStart, totalMinutes - duration));

    let dayStart = dfStartOfDay(baseStart);
    if (deltaDays !== 0) {
      dayStart = dfAddDays(dayStart, deltaDays);
    }
    const newStart = dfAddMinutes(dfAddMinutes(dayStart, startHour * 60), minutesFromStart);

    const newEnd = dfAddMinutes(newStart, duration);
    return { newStart, newEnd };
  };

  const applyResizeEndAndClamp = (baseStart: Date, baseEnd: Date, deltaMinutes: number) => {
    const totalMinutes = (endHour - startHour) * 60;

    const startFromStart = (baseStart.getHours() - startHour) * 60 + baseStart.getMinutes();
    let endFromStart = (baseEnd.getHours() - startHour) * 60 + baseEnd.getMinutes() + deltaMinutes;

    // Snap resized end times
    endFromStart = Math.round(endFromStart / slotMinutes) * slotMinutes;

    const minEnd = startFromStart + slotMinutes;
    const maxEnd = totalMinutes;
    endFromStart = Math.max(minEnd, Math.min(endFromStart, maxEnd));

    const dayStart = dfStartOfDay(baseEnd);
    const newEnd = dfAddMinutes(dfAddMinutes(dayStart, startHour * 60), endFromStart);

    return { newStart: new Date(baseStart), newEnd };
  };

  const startDrag = (e: ReactMouseEvent, event: WeeklyEvent, mode: 'move' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startX = e.clientX;
    const originalStart = event.start;
    const originalEnd = event.end;

    setDragState({
      event,
      originalStart,
      originalEnd,
      startY,
      startX,
      deltaMinutes: 0,
      deltaDays: 0,
      mode
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setDragState((current) => {
        if (!current) return null;
        const deltaY = moveEvent.clientY - current.startY;
        const deltaX = moveEvent.clientX - current.startX;

        const approxMinutes = deltaY / pxPerMinute;
        const quantized = Math.round(approxMinutes / slotMinutes) * slotMinutes;

        let deltaDays = 0;
        if (viewMode === 'week' && current.mode === 'move') {
          // Columns are 120px wide in week view
          deltaDays = Math.round(deltaX / 120);
        }

        return { ...current, deltaMinutes: quantized, deltaDays };
      });
    };

    const handleMouseUp = () => {
      setDragState((current) => {
        if (!current) return null;

        const { originalStart, originalEnd, deltaMinutes, event: ev, mode } = current;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        if (mode === 'move' && Math.abs(deltaMinutes) < slotMinutes / 2) {
          if (onEventClick) {
            onEventClick(ev);
          }
          return null;
        }

        const { newStart, newEnd } =
          mode === 'move'
            ? applyDeltaAndClamp(originalStart, originalEnd, deltaMinutes, current.deltaDays)
            : applyResizeEndAndClamp(originalStart, originalEnd, deltaMinutes);

        if (onEventChange) {
          onEventChange(ev, newStart, newEnd);
        }

        return null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleEventMouseDown = (e: ReactMouseEvent, event: WeeklyEvent) => {
    startDrag(e, event, 'move');
  };

  const handleResizeMouseDown = (e: ReactMouseEvent, event: WeeklyEvent) => {
    startDrag(e, event, 'resize-end');
  };

  const handleSlotMouseDown = (e: ReactMouseEvent, day: Date, minutesFromStart: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const originMinutes = minutesFromStart;

    setSelectionState({
      day,
      startMinutes: originMinutes,
      endMinutes: originMinutes + slotMinutes,
      startY
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setSelectionState((current) => {
        if (!current) return null;

        const deltaY = moveEvent.clientY - current.startY;
        const slotHeightPx = slotMinutes * pxPerMinute;
        const deltaSlots = Math.round(deltaY / slotHeightPx);

        const totalMinutes = (endHour - startHour) * 60;

        let selStart = originMinutes;
        let selEnd = originMinutes + slotMinutes;

        if (deltaSlots > 0) {
          selEnd = originMinutes + (deltaSlots + 1) * slotMinutes;
        } else if (deltaSlots < 0) {
          selStart = originMinutes + deltaSlots * slotMinutes;
        }

        selStart = Math.max(0, Math.min(selStart, totalMinutes - slotMinutes));
        selEnd = Math.max(selStart + slotMinutes, Math.min(selEnd, totalMinutes));

        return {
          ...current,
          startMinutes: selStart,
          endMinutes: selEnd
        };
      });
    };

    const handleMouseUp = () => {
      setSelectionState((current) => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        if (!current) return null;

        const { day: currentDay, startMinutes, endMinutes } = current;

        if (onRangeSelect) {
          onRangeSelect(currentDay, startMinutes, endMinutes);
        } else if (onSlotClick) {
          onSlotClick(currentDay, startMinutes);
        }

        return null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMiniPrevMonth = () => {
    setMiniMonthStart((current) => {
      const d = new Date(current);
      d.setMonth(d.getMonth() - 1);
      return startOfMonth(d);
    });
  };

  const handleMiniNextMonth = () => {
    setMiniMonthStart((current) => {
      const d = new Date(current);
      d.setMonth(d.getMonth() + 1);
      return startOfMonth(d);
    });
  };

  const handleSelectDate = (day: Date) => {
    setSelectedDate(day);
    const newWeekStart = startOfWeek(day);
    if (newWeekStart.getTime() !== weekStart.getTime()) {
      onChangeWeek(newWeekStart);
    }
    setViewMode('day');
  };

  const visibleDays = viewMode === 'week' ? weekDays : [selectedDate];

  const miniWeeks = useMemo(() => {
    const firstOfMonth = startOfMonth(miniMonthStart);
    const firstGridDay = startOfWeek(firstOfMonth);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(firstGridDay, i));
    }
    return days;
  }, [miniMonthStart]);

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
        p: 2
      }}
    >
      <Box className="flex items-center justify-between mb-3">
        <Box className="flex items-center gap-2">
          {/* Botón Hoy */}
          {isSmall ? (
            <IconButton size="small" color="primary" onClick={handleToday}>
              <TodayIcon fontSize="small" />
            </IconButton>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<TodayIcon fontSize="small" />}
              onClick={handleToday}
            >
              Hoy
            </Button>
          )}

          {/* Navegación anterior / siguiente */}
          <IconButton size="small" onClick={handlePrevWeek}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleNextWeek}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>

          {/* Cambio de vista */}
          <Box className="flex items-center gap-1 ml-2">
            <Button
              size="small"
              variant={viewMode === 'week' ? 'contained' : 'text'}
              startIcon={!isSmall ? <CalendarViewWeekIcon fontSize="small" /> : undefined}
              onClick={() => setViewMode('week')}
            >
              {!isSmall && 'Semana'}
              {isSmall && <CalendarViewWeekIcon fontSize="small" />}
            </Button>
            <Button
              size="small"
              variant={viewMode === 'day' ? 'contained' : 'text'}
              startIcon={!isSmall ? <CalendarViewDayIcon fontSize="small" /> : undefined}
              onClick={() => setViewMode('day')}
            >
              {!isSmall && 'Día'}
              {isSmall && <CalendarViewDayIcon fontSize="small" />}
            </Button>
          </Box>
        </Box>
        <Typography variant="subtitle1" className="font-semibold">
          {viewMode === 'week'
            ? isSmall
              ? `${formatDate(weekStart, 'dd/MM')} - ${formatDate(addDays(weekStart, 6), 'dd/MM')}`
              : `${formatDate(weekStart, 'dd MMM')} - ${formatDate(addDays(weekStart, 6), 'dd MMM yyyy')}`
            : isSmall
              ? formatDate(selectedDate, 'dd MMM yyyy')
              : formatDate(selectedDate, 'EEEE, dd MMMM yyyy')}
        </Typography>
      </Box>
      <Box className="grid gap-3" sx={{ gridTemplateColumns: { xs: '1fr', md: '220px 1fr' } }}>
        {/* Mini calendario lateral */}
        <Box
          className="hidden md:block border rounded-lg p-2"
          sx={{
            fontSize: 12,
            userSelect: 'none',
            minHeight: 220,
            backgroundColor: 'background.paper'
          }}
        >
          <Box className="flex items-center justify-between mb-2">
            <IconButton size="small" onClick={handleMiniPrevMonth}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2">{formatDate(miniMonthStart, 'MMMM yyyy')}</Typography>
            <IconButton size="small" onClick={handleMiniNextMonth}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box className="grid grid-cols-7 text-center text-[11px] text-gray-500 mb-1">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <Box key={d}>{d}</Box>
            ))}
          </Box>
          <Box className="grid grid-cols-7 text-center text-xs gap-1">
            {miniWeeks.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = day.getMonth() === miniMonthStart.getMonth();

              return (
                <Box
                  key={day.toISOString()}
                  onClick={() => handleSelectDate(day)}
                  className="cursor-pointer rounded-full flex items-center justify-center"
                  sx={{
                    height: 26,
                    border: isToday ? '1px solid rgba(59,130,246,0.7)' : 'none',
                    backgroundColor: isSelected ? 'rgba(59,130,246,0.9)' : 'transparent',
                    color: isSelected ? '#fff' : isCurrentMonth ? 'text.primary' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: isSelected ? 'rgba(37,99,235,1)' : 'rgba(229,231,235,1)'
                    }
                  }}
                >
                  {day.getDate()}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box
          className="border rounded-lg overflow-hidden"
          sx={{ overflowX: 'auto', overflowY: 'hidden' }}
        >
          {/* Cabecera días */}
          <Box
            className="grid"
            sx={{
              gridTemplateColumns: viewMode === 'week' ? '64px repeat(7, 120px)' : '64px 1fr',
              backgroundColor: 'background.paper',
              width: viewMode === 'week' ? 'max-content' : 'auto'
            }}
          >
            <Box className="border-b" sx={{ backgroundColor: 'background.paper' }} />
            {visibleDays.map((day) => (
              <Box
                key={day.toISOString()}
                className="border-b px-2 py-1 text-center"
                sx={{ backgroundColor: 'background.paper' }}
              >
                <Typography variant="caption" className="uppercase text-gray-500">
                  {formatDate(day, 'EEE')}
                </Typography>
                <Typography variant="body2" className="font-semibold">
                  {day.getDate()}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Cuerpo calendario */}
          <Box
            className="grid"
            sx={{
              gridTemplateColumns: viewMode === 'week' ? '64px repeat(7, 120px)' : '64px 1fr',
              width: viewMode === 'week' ? 'max-content' : 'auto'
            }}
          >
            {/* Columna de horas */}
            <Box className="border-r" sx={{ backgroundColor: 'background.paper' }}>
              {timeSlots.map((slot, idx) => (
                <Box
                  key={idx}
                  className="flex items-start justify-end pr-1 text-[11px] text-gray-500"
                  sx={{ height: slotMinutes * pxPerMinute }}
                >
                  {slot.label}
                </Box>
              ))}
            </Box>

            {/* Columnas por día */}
            {visibleDays.map((day) => {
              const dayEvents = events.filter((e) => isSameDay(e.start, day));

              return (
                <Box key={day.toISOString()} className="relative border-l">
                  {/* slots de fondo */}
                  {timeSlots.map((slot, idx) => (
                    <Box
                      key={idx}
                      className="border-b hover:bg-blue-50/10 cursor-pointer"
                      sx={{
                        height: slotMinutes * pxPerMinute,
                        borderColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.05)'
                      }}
                      onMouseDown={(e) => handleSlotMouseDown(e, day, slot.minutesFromStart)}
                    />
                  ))}

                  {/* eventos */}
                  <Box
                    className="absolute inset-0 pointer-events-none"
                    sx={{ height: columnHeight }}
                  >
                    {selectionState && isSameDay(selectionState.day, day) && (
                      <Box
                        className="absolute left-1 right-1 rounded-md border border-dashed border-blue-400 bg-blue-100/40"
                        sx={{
                          top: selectionState.startMinutes * pxPerMinute,
                          height:
                            (selectionState.endMinutes - selectionState.startMinutes) * pxPerMinute
                        }}
                      />
                    )}
                    {dayEvents.map((event) => {
                      const isDragging = dragState && dragState.event.id === event.id;

                      const baseStart = isDragging
                        ? dragState.mode === 'move'
                          ? applyDeltaAndClamp(
                              dragState.originalStart,
                              dragState.originalEnd,
                              dragState.deltaMinutes,
                              0 // We apply deltaDays visually via translateX, so we keep the logical column height calculations independent
                            ).newStart
                          : applyResizeEndAndClamp(
                              dragState.originalStart,
                              dragState.originalEnd,
                              dragState.deltaMinutes
                            ).newStart
                        : event.start;
                      const baseEnd = isDragging
                        ? dragState.mode === 'move'
                          ? applyDeltaAndClamp(
                              dragState.originalStart,
                              dragState.originalEnd,
                              dragState.deltaMinutes,
                              0
                            ).newEnd
                          : applyResizeEndAndClamp(
                              dragState.originalStart,
                              dragState.originalEnd,
                              dragState.deltaMinutes
                            ).newEnd
                        : event.end;

                      const startMinutes =
                        (baseStart.getHours() - startHour) * 60 + baseStart.getMinutes();
                      const endMinutes =
                        (baseEnd.getHours() - startHour) * 60 + baseEnd.getMinutes();
                      const top = Math.max(startMinutes, 0) * pxPerMinute;
                      const height = Math.max(endMinutes - startMinutes, slotMinutes) * pxPerMinute;

                      return (
                        <Box
                          key={event.id}
                          className="absolute left-1 right-1 rounded-md text-white text-[11px] px-1 py-0.5 shadow-sm pointer-events-auto cursor-pointer hover:brightness-110"
                          sx={{
                            top,
                            height,
                            backgroundColor: event.color || 'rgba(59,130,246,0.8)',
                            position: 'absolute',
                            transform:
                              isDragging && dragState.mode === 'move' && dragState.deltaDays
                                ? `translateX(${dragState.deltaDays * 120}px)`
                                : 'none',
                            zIndex: isDragging ? 20 : 1,
                            '&:hover .resize-handle': {
                              opacity: 1
                            }
                          }}
                          onMouseDown={(mouseEvent) => handleEventMouseDown(mouseEvent, event)}
                        >
                          <Typography variant="caption" className="font-semibold leading-tight">
                            {event.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="block leading-tight"
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            {formatTime(baseStart)} - {formatTime(baseEnd)}
                          </Typography>
                          <Box
                            className="resize-handle"
                            sx={{
                              position: 'absolute',
                              left: 4,
                              right: 4,
                              bottom: 4,
                              height: 6,
                              cursor: 'ns-resize',
                              backgroundColor: 'rgba(255,255,255,0.6)',
                              borderRadius: 9999,
                              opacity: 0,
                              transition: 'opacity 0.15s ease-in-out'
                            }}
                            onMouseDown={(mouseEvent) => handleResizeMouseDown(mouseEvent, event)}
                          />
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
      {/* Vista de eventos resumida */}
      {events.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {viewMode === 'week' ? 'Eventos de la semana' : 'Eventos del día'}
          </Typography>
          {visibleDays.map((day) => {
            const dayEvents = events
              .filter((e) => isSameDay(e.start, day))
              .sort((a, b) => a.start.getTime() - b.start.getTime());

            if (!dayEvents.length) return null;

            return (
              <Box key={day.toISOString()} sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(day, 'EEEE dd/MM')}
                </Typography>
                {dayEvents.map((ev) => (
                  <Box
                    key={ev.id}
                    className="flex items-center justify-between text-xs px-2 py-1 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => onEventClick && onEventClick(ev)}
                  >
                    <Box className="flex items-center gap-2">
                      <Box
                        className="w-2 h-2 rounded-full"
                        sx={{ backgroundColor: ev.color || 'rgba(59,130,246,0.8)' }}
                      />
                      <Typography variant="body2" sx={{ fontSize: 12 }}>
                        {ev.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {formatTime(ev.start)} - {formatTime(ev.end)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
