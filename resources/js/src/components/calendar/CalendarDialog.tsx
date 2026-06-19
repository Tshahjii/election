import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';

import AddCircleOutlineTwoToneIcon from '@mui/icons-material/AddCircleOutlineTwoTone';
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EventAvailableTwoToneIcon from '@mui/icons-material/EventAvailableTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';

import {
  CalendarEventItem,
  CalendarEventPayload,
  CalendarEventStatus,
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent
} from 'api/calendarEvents';
import { festivalByDate, formatIndianCalendarDate } from './indianCalendar';

type CalendarDialogProps = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  id?: number | string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  color: string;
  status: CalendarEventStatus;
};

const emptyForm: FormState = {
  title: '',
  description: '',
  start_at: '',
  end_at: '',
  color: '#1976d2',
  status: 'scheduled'
};

const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#00838f'];
const statuses: CalendarEventStatus[] = ['scheduled', 'pending', 'completed', 'cancelled'];

const toInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const defaultRangeForDate = (date: Date) => {
  const start = new Date(date);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  return { start_at: toInputValue(start), end_at: toInputValue(end) };
};

const eventDateKey = (value?: string) => (value ? value.slice(0, 10) : '');

export default function CalendarDialog({ open, onClose }: CalendarDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const calendarRef = useRef<FullCalendar | null>(null);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [range, setRange] = useState<{ start?: string; end?: string }>({});
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [hoverAnchor, setHoverAnchor] = useState<HTMLElement | null>(null);
  const [hoverDate, setHoverDate] = useState('');

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEventItem[]>();
    events.forEach((event) => {
      const key = eventDateKey(event.start_at || event.start);
      grouped.set(key, [...(grouped.get(key) || []), event]);
    });
    return grouped;
  }, [events]);

  const loadEvents = async (nextRange = range) => {
    if (!open) return;
    setLoading(true);
    setError('');
    try {
      setEvents(await fetchCalendarEvents(nextRange));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadEvents(range);
  }, [open]);

  const openCreateForm = (date: Date) => {
    setForm({ ...emptyForm, ...defaultRangeForDate(date) });
    setFormOpen(true);
  };

  const openEditForm = (event: CalendarEventItem) => {
    setForm({
      id: event.id,
      title: event.title || '',
      description: event.description || event.extendedProps?.description || '',
      start_at: event.start_at || event.extendedProps?.start_at || '',
      end_at: event.end_at || event.extendedProps?.end_at || '',
      color: event.color || '#1976d2',
      status: event.status || event.extendedProps?.status || 'scheduled'
    });
    setFormOpen(true);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    const nextRange = { start: arg.startStr, end: arg.endStr };
    setRange(nextRange);
    if (open) loadEvents(nextRange);
  };

  const handleDateClick = (arg: { date: Date }) => openCreateForm(arg.date);
  const handleEventClick = (arg: EventClickArg) => openEditForm(arg.event.extendedProps.rawEvent as CalendarEventItem);

  const handleEventMove = async (arg: any) => {
    const raw = arg.event.extendedProps.rawEvent as CalendarEventItem;
    const nextPayload: CalendarEventPayload = {
      title: raw.title,
      description: raw.description || raw.extendedProps?.description || '',
      start_at: toInputValue(arg.event.start || new Date(raw.start)),
      end_at: toInputValue(arg.event.end || arg.event.start || new Date(raw.end)),
      color: raw.color,
      status: raw.status || raw.extendedProps?.status || 'scheduled'
    };

    try {
      await updateCalendarEvent(raw.id, nextPayload);
      await loadEvents();
    } catch {
      arg.revert();
      setError('Unable to reschedule this event.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: CalendarEventPayload = {
        title: form.title,
        description: form.description,
        start_at: form.start_at,
        end_at: form.end_at,
        color: form.color,
        status: form.status
      };

      form.id ? await updateCalendarEvent(form.id, payload) : await createCalendarEvent(payload);
      setFormOpen(false);
      await loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save event. Please check title, date and time.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    setSaving(true);
    try {
      await deleteCalendarEvent(form.id);
      setFormOpen(false);
      await loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete event.');
    } finally {
      setSaving(false);
    }
  };

  const hoverEvents = hoverDate ? eventsByDate.get(hoverDate) || [] : [];
  const calendarEvents = events.map((event) => ({
    id: String(event.id),
    title: event.title,
    start: event.start,
    end: event.end,
    color: event.color,
    borderColor: event.color,
    extendedProps: { rawEvent: event }
  }));

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          onClose();
        }}
        fullScreen={fullScreen}
        maxWidth="xl"
        fullWidth
        sx={{ zIndex: (theme) => theme.zIndex.modal + 20 }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: fullScreen ? 0 : 2,
              width: fullScreen ? '100%' : undefined,
              maxWidth: fullScreen ? '100%' : undefined
            }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <EventAvailableTwoToneIcon color="primary" />
              <Box>
                <Typography variant="h4">Calendar</Typography>
                <Typography variant="caption" color="text.secondary">
                  Month, week and day event planner
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} aria-label="close calendar">
              <CloseTwoToneIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <Stack sx={{ gap: 1.5 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Box
              sx={{
                minHeight: { xs: 520, sm: 620, md: 720 },
                '& .fc': { fontFamily: 'inherit' },
                '& .fc-toolbar': { gap: 1, flexWrap: 'wrap' },
                '& .fc-toolbar-title': { fontSize: { xs: 18, md: 24 }, fontWeight: 700 },
                '& .fc-button': { borderRadius: 1, textTransform: 'capitalize', boxShadow: 'none !important' },
                '& .fc-header-toolbar': { alignItems: 'flex-start' },
                '& .fc-toolbar-chunk': { display: 'flex', flexWrap: 'wrap', gap: 0.5 },
                '& .fc-daygrid-day': { cursor: 'pointer' },
                '& .fc-day-today': { background: `${alpha(theme.palette.primary.main, 0.08)} !important` },
                '& .fc-event': { borderRadius: 1, border: 0, padding: '2px 4px', cursor: 'pointer' },
                '& .fc-list-event': { cursor: 'pointer' },
                '& .calendar-day-meta': { mt: 0.25, display: 'grid', gap: 0.25, minHeight: 34 },
                '& .calendar-indian-date': { fontSize: 10, color: 'text.secondary', lineHeight: 1.15 },
                '& .calendar-festival': {
                  maxWidth: '100%',
                  width: 'fit-content',
                  px: 0.5,
                  py: 0.15,
                  borderRadius: 0.75,
                  bgcolor: alpha(theme.palette.warning.main, 0.14),
                  color: theme.palette.warning.dark,
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              }}
            >
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day', list: 'List' }}
                events={calendarEvents}
                editable
                selectable
                nowIndicator
                height="auto"
                loading={setLoading}
                datesSet={handleDatesSet}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventDrop={handleEventMove}
                eventResize={handleEventMove}
                dayMaxEvents={3}
                dayCellContent={(arg) => {
                  const key = toInputValue(arg.date).slice(0, 10);
                  const festival = festivalByDate.get(key);

                  return (
                    <Box sx={{ width: 1, minWidth: 0 }}>
                      <Typography component="span" sx={{ display: 'block', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                        {arg.dayNumberText}
                      </Typography>
                      <Box className="calendar-day-meta">
                        <Box className="calendar-indian-date">{formatIndianCalendarDate(arg.date)}</Box>
                        {festival && <Box className="calendar-festival" title={festival.title}>{festival.title}</Box>}
                      </Box>
                    </Box>
                  );
                }}
                dayCellDidMount={(arg) => {
                  const key = toInputValue(arg.date).slice(0, 10);
                  arg.el.addEventListener('mouseenter', () => {
                    setHoverDate(key);
                    setHoverAnchor(arg.el);
                  });
                  arg.el.addEventListener('mouseleave', () => setHoverAnchor(null));
                }}
              />
            </Box>
            {loading && <Typography color="text.secondary">Loading calendar events...</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button startIcon={<AddCircleOutlineTwoToneIcon />} variant="contained" onClick={() => openCreateForm(new Date())}>
            Add event
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(hoverAnchor) && hoverEvents.length > 0}
        anchorEl={hoverAnchor}
        onClose={() => setHoverAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 300, p: 1.5, borderRadius: 1.5, pointerEvents: 'none' } } }}
        disableRestoreFocus
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Events on {hoverDate}
        </Typography>
        <Stack sx={{ gap: 1 }}>
          {hoverEvents.map((event) => (
            <Box key={event.id}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                  {event.title}
                </Typography>
                <Chip size="small" label={event.status} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {event.start_at?.slice(11)} - {event.end_at?.slice(11)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Popover>

      <Dialog
        open={formOpen}
        onClose={(_, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          setFormOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{form.id ? 'Edit event' : 'Create event'}</DialogTitle>
        <DialogContent dividers>
          <Stack sx={{ gap: 2, pt: 0.5 }}>
            <TextField label="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required fullWidth />
            <TextField
              label="Description / Task"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              multiline
              minRows={3}
              fullWidth
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Start time"
                type="datetime-local"
                value={form.start_at}
                onChange={(event) => setForm((prev) => ({ ...prev, start_at: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
              <TextField
                label="End time"
                type="datetime-local"
                value={form.end_at}
                onChange={(event) => setForm((prev) => ({ ...prev, end_at: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
              <TextField select label="Status" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as CalendarEventStatus }))}>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {colors.map((color) => (
                  <IconButton
                    key={color}
                    aria-label={`select ${color}`}
                    onClick={() => setForm((prev) => ({ ...prev, color }))}
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: color,
                      border: `3px solid ${form.color === color ? theme.palette.text.primary : 'transparent'}`,
                      '&:hover': { bgcolor: color }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 2.5, py: 1.5 }}>
          <Box>{form.id && <Button color="error" startIcon={<DeleteTwoToneIcon />} onClick={handleDelete} disabled={saving}>Delete</Button>}</Box>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<SaveTwoToneIcon />} onClick={handleSave} disabled={saving || !form.title || !form.start_at || !form.end_at}>
              Save
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
