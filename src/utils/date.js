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

export const ALL_WEEK_DAYS = [
  { name: 'Sunday', code: 'Sun', letter: 'S', dayIdx: 0 },
  { name: 'Monday', code: 'Mon', letter: 'M', dayIdx: 1 },
  { name: 'Tuesday', code: 'Tue', letter: 'T', dayIdx: 2 },
  { name: 'Wednesday', code: 'Wed', letter: 'W', dayIdx: 3 },
  { name: 'Thursday', code: 'Thu', letter: 'T', dayIdx: 4 },
  { name: 'Friday', code: 'Fri', letter: 'F', dayIdx: 5 },
  { name: 'Saturday', code: 'Sat', letter: 'S', dayIdx: 6 }
];

export const getWeekDays = (startDayName = 'Monday') => {
  const startIdx = ALL_WEEK_DAYS.findIndex(
    d => d.name.toLowerCase() === (startDayName || 'Monday').toLowerCase()
  );
  const validStartIdx = startIdx >= 0 ? startIdx : 1;
  const result = [];
  for (let i = 0; i < 7; i++) {
    result.push(ALL_WEEK_DAYS[(validStartIdx + i) % 7]);
  }
  return result;
};

export const getEpochDays = (d) => {
  if (!d) return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  let dateObj;
  if (d instanceof Date) {
    dateObj = d;
  } else if (typeof d === 'string') {
    if (d.includes('-')) {
      const parts = d.split('T')[0].split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        dateObj = new Date(d);
      }
    } else {
      dateObj = new Date(d);
    }
  } else if (typeof d === 'number') {
    dateObj = new Date(d);
  } else {
    dateObj = new Date();
  }
  if (isNaN(dateObj.getTime())) dateObj = new Date();
  return Math.floor(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) / (1000 * 60 * 60 * 24));
};

export const isHabitScheduledOnDay = (habit, day) => {
  if (!habit) return true;
  const intervalDays = Number(habit.interval_days || habit.intervalDays) || 0;
  if (intervalDays > 0) {
    const startStr = habit.start_date || habit.startDate || habit.created_at || habit.createdAt || habit.date;
    const habitStartIndex = getEpochDays(startStr);
    
    let targetDayIndex;
    if (typeof day === 'number') {
      targetDayIndex = day;
    } else if (day && (day instanceof Date || (typeof day === 'string' && day.includes('-')))) {
      targetDayIndex = getEpochDays(day);
    } else if (day && typeof day === 'object' && (day.date || day.dateStr)) {
      targetDayIndex = getEpochDays(day.dateStr || day.date);
    } else {
      const dayCode = typeof day === 'string' ? day : (day?.code || day?.name || '');
      const todayObj = new Date();
      const todayJsDay = todayObj.getDay();
      const matched = ALL_WEEK_DAYS.find(d => d.code === dayCode || d.name === dayCode);
      const targetJsDay = matched ? matched.dayIdx : todayJsDay;
      const diff = targetJsDay - todayJsDay;
      const targetDate = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate() + diff);
      targetDayIndex = getEpochDays(targetDate);
    }

    const elapsedDays = targetDayIndex - habitStartIndex;
    return Math.abs(elapsedDays) % intervalDays === 0;
  }

  if (!habit.frequency || habit.frequency === 'daily') return true;
  if (habit.frequency === 'custom') {
    const rawDays = habit.customDays || habit.custom_days || '';
    let dayList = [];
    if (Array.isArray(rawDays)) {
      dayList = rawDays;
    } else if (typeof rawDays === 'string') {
      if (rawDays.trim().startsWith('[')) {
        try { dayList = JSON.parse(rawDays); } catch (e) { dayList = rawDays.split(','); }
      } else {
        dayList = rawDays.split(',');
      }
    }
    const cleanDays = dayList.map(d => String(d).trim().slice(0, 3));
    const dayCode = typeof day === 'string' ? day : (day?.code || day?.name || '');
    return cleanDays.includes(dayCode);
  }
  return true;
};

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


