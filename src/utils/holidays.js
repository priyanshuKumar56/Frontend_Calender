const RECURRING = {
  '01-01': "New Year's Day", '01-26': 'Republic Day',
  '02-14': "Valentine's Day", '03-08': "Women's Day",
  '05-01': 'May Day', '07-04': 'Independence Day (US)',
  '08-15': 'Independence Day (IN)', '10-02': 'Gandhi Jayanti',
  '10-31': 'Halloween', '12-25': 'Christmas', '12-31': "New Year's Eve",
};
const SPECIFIC = {
  '2026-03-17': 'Holi', '2026-04-02': 'Ram Navami',
  '2026-04-03': 'Good Friday', '2026-04-14': 'Ambedkar Jayanti',
  '2026-05-10': "Mother's Day", '2026-06-21': "Father's Day",
  '2026-10-01': 'Dussehra', '2026-10-20': 'Diwali',
  '2026-11-26': 'Thanksgiving',
};
export function getHoliday(date) {
  const mm = String(date.getMonth()+1).padStart(2,'0');
  const dd = String(date.getDate()).padStart(2,'0');
  const full = `${date.getFullYear()}-${mm}-${dd}`;
  const mmdd = `${mm}-${dd}`;
  const name = SPECIFIC[full] || RECURRING[mmdd] || null;
  return { isHoliday: !!name, name };
}
export function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}
