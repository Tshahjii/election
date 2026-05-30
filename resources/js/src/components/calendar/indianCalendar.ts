export type IndianFestival = {
  date: string;
  title: string;
  type: 'national' | 'gazetted' | 'festival' | 'regional';
};

export const indianFestivals: IndianFestival[] = [
  { date: '2026-01-01', title: 'New Year', type: 'festival' },
  { date: '2026-01-14', title: 'Makar Sankranti / Pongal', type: 'festival' },
  { date: '2026-01-26', title: 'Republic Day', type: 'national' },
  { date: '2026-02-15', title: 'Maha Shivaratri', type: 'festival' },
  { date: '2026-03-04', title: 'Holi', type: 'gazetted' },
  { date: '2026-03-20', title: 'Jamat-ul-Vida', type: 'festival' },
  { date: '2026-03-21', title: 'Eid-ul-Fitr', type: 'gazetted' },
  { date: '2026-03-26', title: 'Ram Navami', type: 'festival' },
  { date: '2026-03-31', title: 'Mahavir Jayanti', type: 'gazetted' },
  { date: '2026-04-03', title: 'Good Friday', type: 'gazetted' },
  { date: '2026-04-14', title: 'Ambedkar Jayanti / Vaisakhi', type: 'festival' },
  { date: '2026-05-01', title: 'May Day', type: 'regional' },
  { date: '2026-05-27', title: 'Eid-ul-Zuha (Bakrid)', type: 'gazetted' },
  { date: '2026-05-31', title: 'Buddha Purnima', type: 'gazetted' },
  { date: '2026-06-26', title: 'Muharram', type: 'gazetted' },
  { date: '2026-08-15', title: 'Independence Day', type: 'national' },
  { date: '2026-08-26', title: 'Onam', type: 'regional' },
  { date: '2026-08-28', title: 'Milad-un-Nabi', type: 'gazetted' },
  { date: '2026-09-04', title: 'Janmashtami', type: 'festival' },
  { date: '2026-09-14', title: 'Ganesh Chaturthi', type: 'festival' },
  { date: '2026-10-02', title: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-10-20', title: 'Dussehra', type: 'gazetted' },
  { date: '2026-10-26', title: 'Karva Chauth', type: 'festival' },
  { date: '2026-11-08', title: 'Diwali (Deepavali)', type: 'gazetted' },
  { date: '2026-11-09', title: 'Govardhan Puja', type: 'festival' },
  { date: '2026-11-10', title: 'Bhai Dooj', type: 'festival' },
  { date: '2026-11-24', title: 'Guru Nanak Jayanti', type: 'gazetted' },
  { date: '2026-12-25', title: 'Christmas Day', type: 'gazetted' }
];

export const festivalByDate = new Map(indianFestivals.map((festival) => [festival.date, festival]));

export const formatIndianCalendarDate = (date: Date) => {
  try {
    return new Intl.DateTimeFormat('en-IN-u-ca-indian', { day: 'numeric', month: 'short' }).format(date);
  } catch {
    return '';
  }
};
