import test from 'node:test';
import assert from 'node:assert/strict';
import { distributeMileage, mileageSummary, calculateSplits, formatTime, readNumber } from '../src/calculations.js';

test('50 mile week distributes 30 remaining miles, preserving a rest day', () => {
  const result = distributeMileage(50, [10, 10, 0, null, null, null, null]);
  assert.deepEqual(result, [10, 10, 0, 7.5, 7.5, 7.5, 7.5]);
  assert.equal(mileageSummary(50, result).remaining, 0);
});
test('distribution rounds without losing mileage', () => {
  const result = distributeMileage(10, [null, null, null]);
  assert.deepEqual(result, [3.34, 3.33, 3.33]);
});
test('missing goals, full schedules and over-goal weeks do not distribute', () => {
  assert.throws(() => distributeMileage(null, [null]));
  assert.throws(() => distributeMileage(50, [0, 20]));
  assert.throws(() => distributeMileage(10, [20, null]));
});
test('invalid values are rejected while empty and explicit zero remain distinct', () => {
  assert.equal(readNumber(''), null); assert.equal(readNumber('0'), 0);
  for (const value of ['-1', 'Infinity', 'wat']) assert.throws(() => readNumber(value));
  assert.throws(() => readNumber('1.5', { integer: true }));
});
test('800m in two minutes has two 60-second laps', () => {
  const rows = calculateSplits({ seconds: 120, distance: 800, trackLength: 400 });
  assert.deepEqual(rows.map(r => r.seconds), [60, 60]);
  assert.equal(rows.at(-1).cumulative, 120);
});
test('1500m opens with a partial lap and ends exactly on the finish time', () => {
  const rows = calculateSplits({ seconds: 240, distance: 1500, trackLength: 400 });
  assert.deepEqual(rows.map(r => r.distance), [300, 700, 1100, 1500]);
  assert.equal(rows[0].seconds, 48); assert.equal(rows.at(-1).cumulative, 240);
});
test('mile and custom tracks handle fractional distances', () => {
  const rows = calculateSplits({ seconds: 300, distance: 1609.34, trackLength: 300 });
  assert.equal(rows.length, 6); assert.equal(rows.at(-1).distance, 1609.34);
  assert.equal(rows.at(-1).cumulative, 300);
});
test('invalid lengths and excessive results are bounded', () => {
  for (const trackLength of [0, -2, NaN, Infinity]) assert.throws(() => calculateSplits({ seconds: 120, distance: 800, trackLength }));
  assert.throws(() => calculateSplits({ seconds: 100, distance: 100000, trackLength: 1 }));
});
test('time rounding rolls into the next minute and hour', () => {
  assert.equal(formatTime(59.999), '1:00.00');
  assert.equal(formatTime(3599.999), '1:00:00.00');
});
