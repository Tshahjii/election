import apiClient from './client';

export type CalendarEventStatus = 'scheduled' | 'pending' | 'completed' | 'cancelled';

export type CalendarEventPayload = {
  id?: number | string;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  color?: string;
  status?: CalendarEventStatus;
};

export type CalendarEventItem = CalendarEventPayload & {
  id: number;
  start: string;
  end: string;
  extendedProps?: {
    description?: string;
    status?: CalendarEventStatus;
    start_at?: string;
    end_at?: string;
  };
};

export const fetchCalendarEvents = async (params?: { start?: string; end?: string }) => {
  const { data } = await apiClient.get('/calendar-events', { params });
  return data.data as CalendarEventItem[];
};

export const createCalendarEvent = async (payload: CalendarEventPayload) => {
  const { data } = await apiClient.post('/calendar-events', payload);
  return data.data as CalendarEventItem;
};

export const updateCalendarEvent = async (id: number | string, payload: CalendarEventPayload) => {
  const { data } = await apiClient.put(`/calendar-events/${id}`, payload);
  return data.data as CalendarEventItem;
};

export const deleteCalendarEvent = async (id: number | string) => {
  const { data } = await apiClient.delete(`/calendar-events/${id}`);
  return data;
};

export const fetchCalendarReminders = async () => {
  const { data } = await apiClient.get('/calendar-events/reminders');
  return data as { today: CalendarEventItem[]; due: CalendarEventItem[]; server_time: string };
};
