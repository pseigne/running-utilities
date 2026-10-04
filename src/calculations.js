export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const EVENTS = { '800m': 800, '1500m': 1500, Mile: 1609.34, '3000m': 3000, '5000m': 5000, '10,000m': 10000, Other: 'custom' };

export function readNumber(value, { min = 0, max = 100000, integer = false } = {}) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) throw new Error(`Enter ${integer ? 'a whole number' : 'a number'} between ${min} and ${max}.`);
  return number;
}

export function mileageSummary(goal, days) {
  const total = days.reduce((sum, value) => sum + (value ?? 0), 0);
  return { total, remaining: goal === null ? null : goal - total };
}

export function distributeMileage(goal, days) {
  const { remaining } = mileageSummary(goal, days);
  if (goal === null) throw new Error('Set a weekly mileage goal first.');
  if (remaining < -0.000001) throw new Error('Your plan is already over the goal. Reduce a run or raise the goal before distributing.');
  const available = days.filter(value => value === null).length;
  if (!available) throw new Error('Leave at least one day blank to distribute the remaining miles.');
  // Allocate to hundredths without accumulating rounding drift; explicit zero is a rest day.
  const cents = Math.max(0, Math.round(remaining * 100));
  const each = Math.floor(cents / available);
  let extra = cents % available;
  return days.map(value => value === null ? (each + (extra-- > 0 ? 1 : 0)) / 100 : value);
}

export function calculateSplits({ seconds, distance, trackLength }) {
  if (![seconds, distance, trackLength].every(Number.isFinite) || seconds <= 0 || distance <= 0 || trackLength <= 0) throw new Error('Enter a positive finish time, race distance, and track length.');
  const count = Math.ceil(distance / trackLength - 1e-10);
  if (count > 2000) throw new Error('Choose a longer track length to keep the result under 2,000 splits.');
  const first = distance - (count - 1) * trackLength;
  return Array.from({ length: count }, (_, i) => {
    const meters = i === count - 1 ? distance : first + i * trackLength;
    const lapDistance = i === 0 ? first : trackLength;
    return { lap: i + 1, distance: meters, lapDistance, seconds: lapDistance * seconds / distance, cumulative: i === count - 1 ? seconds : meters * seconds / distance };
  });
}

export function formatTime(seconds) {
  const centiseconds = Math.round(seconds * 100);
  const hours = Math.floor(centiseconds / 360000);
  const minutes = Math.floor(centiseconds / 6000) % 60;
  const rest = ((centiseconds % 6000) / 100).toFixed(2).padStart(5, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}
