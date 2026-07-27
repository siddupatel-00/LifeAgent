// Calendar dates must be created in the user's local timezone, not UTC.
export const todayKey = (timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
};

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const formatDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getFormattedDateTitle = (timeZone, dateStr) => {
  let targetDate = new Date();
  if (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    targetDate = new Date(y, m - 1, d);
  }
  const day = targetDate.getDate();
  const month = targetDate.toLocaleDateString('en-US', { month: 'long' });
  const year = targetDate.getFullYear();
  return `📝 ${day} ${month} ${year}`;
};

export const getTomorrowKey = (todayStr) => {
  const [y, m, d] = todayStr.split('-').map(Number);
  const todayDate = new Date(y, m - 1, d);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  return formatDateStr(tomorrowDate);
};

export const getThisWeekRange = (todayStr) => {
  const [y, m, d] = todayStr.split('-').map(Number);
  const todayDate = new Date(y, m - 1, d);
  const dayOfWeek = todayDate.getDay(); // 0 is Sunday, 6 is Saturday
  const sunday = new Date(todayDate);
  sunday.setDate(todayDate.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return { startStr: formatDateStr(sunday), endStr: formatDateStr(saturday) };
};

export const getNextWeekRange = (todayStr) => {
  const [y, m, d] = todayStr.split('-').map(Number);
  const todayDate = new Date(y, m - 1, d);
  const dayOfWeek = todayDate.getDay();
  const nextSunday = new Date(todayDate);
  nextSunday.setDate(todayDate.getDate() - dayOfWeek + 7);
  const nextSaturday = new Date(nextSunday);
  nextSaturday.setDate(nextSunday.getDate() + 6);
  return { startStr: formatDateStr(nextSunday), endStr: formatDateStr(nextSaturday) };
};

export const TIME_RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: '3d', label: 'Last 3 Days' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '14d', label: 'Last 14 Days' },
  { id: '25d', label: 'Last 25 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: '12m', label: '12 Months' },
  { id: 'lifetime', label: 'Lifetime' }
];

export const getTimeRangeDates = (timeRange, timeZone) => {
  const todayStr = todayKey(timeZone);
  const [y, m, d] = todayStr.split('-').map(Number);
  const endDateStr = todayStr;

  if (!timeRange || timeRange === 'today') {
    return { startDateStr: todayStr, endDateStr, todayStr };
  }
  if (timeRange === 'lifetime') {
    return { startDateStr: '1970-01-01', endDateStr, todayStr };
  }

  const startDateObj = new Date(y, m - 1, d);
  if (timeRange === '3d') startDateObj.setDate(startDateObj.getDate() - 2);
  else if (timeRange === '7d') startDateObj.setDate(startDateObj.getDate() - 6);
  else if (timeRange === '14d') startDateObj.setDate(startDateObj.getDate() - 13);
  else if (timeRange === '25d') startDateObj.setDate(startDateObj.getDate() - 24);
  else if (timeRange === '30d') startDateObj.setDate(startDateObj.getDate() - 29);
  else if (timeRange === '1m') startDateObj.setMonth(startDateObj.getMonth() - 1);
  else if (timeRange === '3m') startDateObj.setMonth(startDateObj.getMonth() - 3);
  else if (timeRange === '6m') startDateObj.setMonth(startDateObj.getMonth() - 6);
  else if (timeRange === '12m') startDateObj.setMonth(startDateObj.getMonth() - 12);
  else startDateObj.setDate(startDateObj.getDate() - 6);

  return {
    startDateStr: formatDateStr(startDateObj),
    endDateStr,
    todayStr
  };
};


