const DAY_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (value) => {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const dateKey = (value) => toDateOnly(value).toISOString().slice(0, 10);

const parseTimeToMinutes = (time) => {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return NaN;
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const combineDateAndMinutes = (date, minutes) => {
  const base = toDateOnly(date);
  return new Date(base.getTime() + minutes * 60 * 1000);
};

const addMinutes = (date, minutes) => new Date(new Date(date).getTime() + minutes * 60 * 1000);

const rangesOverlap = (startA, endA, startB, endB) => {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
};

const enumerateDates = (from, to) => {
  const dates = [];
  for (let cursor = toDateOnly(from); cursor <= toDateOnly(to); cursor = new Date(cursor.getTime() + DAY_MS)) {
    dates.push(new Date(cursor));
  }
  return dates;
};

module.exports = {
  addMinutes,
  combineDateAndMinutes,
  dateKey,
  enumerateDates,
  minutesToTime,
  parseTimeToMinutes,
  rangesOverlap,
  toDateOnly,
};
