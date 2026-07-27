const todayStr = '2026-07-27';
const getNormalizedDate = (dStr) => {
  if (!dStr || dStr === 'Today') return todayStr;
  if (dStr === 'Yesterday') {
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  if (dStr.includes('days ago')) {
    const num = parseInt(dStr, 10) || 1;
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() - num);
    return d.toISOString().split('T')[0];
  }
  return dStr.split('T')[0];
};

console.log(getNormalizedDate('2026-07-27') === todayStr); // true
console.log(getNormalizedDate('2026-07-27T10:00') === todayStr); // true
console.log(getNormalizedDate(undefined) === todayStr); // true
