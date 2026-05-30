import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AccessTimeTwoToneIcon from '@mui/icons-material/AccessTimeTwoTone';
import EventNoteTwoToneIcon from '@mui/icons-material/EventNoteTwoTone';

import { CalendarEventItem, fetchCalendarReminders } from 'api/calendarEvents';

type ReminderEntry = CalendarEventItem & {
  reminderKey: string;
};

const formatTime = (value?: string) => (value ? value.slice(11, 16) : '--:--');

const uniqueEvents = (events: ReminderEntry[]) => {
  const map = new Map<string, ReminderEntry>();
  events.forEach((event) => map.set(event.reminderKey, event));
  return Array.from(map.values()).sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)));
};

export default function CalendarReminderProvider() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const [events, setEvents] = useState<ReminderEntry[]>([]);
  const [dismissedKeys, setDismissedKeys] = useState<string[]>([]);
  const [openedToday, setOpenedToday] = useState(false);
  const todayKey = new Date().toLocaleDateString('en-CA');
  const storageKey = `calendar_reminders_closed:${user?.id || 'guest'}:${todayKey}`;

  const visibleEvents = useMemo(() => events.filter((event) => !dismissedKeys.includes(event.reminderKey)), [dismissedKeys, events]);
  const open = isAuthenticated && visibleEvents.length > 0;

  const loadReminders = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await fetchCalendarReminders();
      const todayEvents = openedToday ? [] : (data.today || []).map((event) => ({ ...event, reminderKey: `today:${event.id}` }));
      const dueEvents = (data.due || []).map((event) => ({ ...event, reminderKey: `due:${event.id}` }));
      const nextEvents = uniqueEvents([...todayEvents, ...dueEvents]);
      if (nextEvents.length) {
        setEvents(nextEvents);
        setOpenedToday(true);
      }
    } catch {
      // Reminder polling should not interrupt normal panel work.
    }
  }, [isAuthenticated, openedToday]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEvents([]);
      setDismissedKeys([]);
      setOpenedToday(false);
      return undefined;
    }

    try {
      setDismissedKeys(JSON.parse(localStorage.getItem(storageKey) || '[]'));
    } catch {
      setDismissedKeys([]);
    }

    loadReminders();
    const timer = window.setInterval(loadReminders, 30000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, loadReminders, storageKey]);

  const handleClose = () => {
    setDismissedKeys((prev) => {
      const next = Array.from(new Set([...prev, ...visibleEvents.map((event) => event.reminderKey)]));
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
      }}
      maxWidth="sm"
      fullWidth
      keepMounted
    >
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <EventNoteTwoToneIcon color="primary" />
          <Box>
            <Typography variant="h4">Calendar reminders</Typography>
            <Typography variant="caption" color="text.secondary">
              Scheduled or pending events for today
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack sx={{ gap: 1.5 }}>
          {visibleEvents.map((event, index) => (
            <Box key={event.id}>
              {index > 0 && <Divider sx={{ mb: 1.5 }} />}
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                    {event.title}
                  </Typography>
                  {event.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
                      {event.description}
                    </Typography>
                  )}
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, mt: 1 }}>
                    <AccessTimeTwoToneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(event.start_at)} - {formatTime(event.end_at)}
                    </Typography>
                  </Stack>
                </Box>
                <Chip size="small" label={event.status || 'scheduled'} color={event.status === 'pending' ? 'warning' : 'primary'} />
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button variant="contained" onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
