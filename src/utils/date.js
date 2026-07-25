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
