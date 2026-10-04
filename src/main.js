import Chart from 'chart.js/auto';
import { DAYS, EVENTS, readNumber, mileageSummary, distributeMileage, calculateSplits, formatTime, formatNumber } from './calculations.js';
import './styles.css';

const $ = id => document.getElementById(id);
const STORAGE = 'running-utilities.inputs.v1';
const defaults = () => ({ goal: '', days: Array(7).fill(''), hours: '', minutes: '', seconds: '', event: '800', track: '400', customDistance: '', customTrack: '' });
let state = defaults();
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE));
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(state)) {
      if (key === 'days' && Array.isArray(saved.days) && saved.days.length === 7) state.days = saved.days.map(v => typeof v === 'string' ? v : '');
      else if (typeof saved[key] === 'string') state[key] = saved[key];
    }
  }
} catch { /* A blocked or corrupt store should never prevent calculations. */ }
function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); }
  catch { $('save-note').textContent = 'Inputs stay available while this page is open. Browser storage is unavailable.'; }
}
function feedback(id, message, error = false) {
  $(id).textContent = message;
  $(id).classList.toggle('error', error);
}
function parseField(id, options) {
  const el = $(id);
  try { const result = readNumber(el.value, options); if (el.validity.badInput) throw new Error('Enter a valid number.'); el.removeAttribute('aria-invalid'); return result; }
  catch (error) { el.setAttribute('aria-invalid', 'true'); throw error; }
}

$('days').innerHTML = DAYS.map((day, i) => `<div class="day"><label for="day-${i}"><span aria-hidden="true">${day.slice(0, 3)}</span><span class="sr-only">${day} mileage</span></label><input id="day-${i}" type="number" min="0" max="100000" step="any" inputmode="decimal" placeholder="—" /></div>`).join('');
$('event-options').innerHTML = Object.entries(EVENTS).map(([label, value]) => `<label class="choice"><input type="radio" name="event" value="${value}" /><span>${label}</span></label>`).join('');
const chart = new Chart($('mileage-chart'), {
  type: 'bar',
  data: { labels: DAYS.map(day => day.slice(0, 3)), datasets: [{ data: Array(7).fill(0), borderRadius: 5, maxBarThickness: 38 }] },
  options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${formatNumber(ctx.raw)} miles` } } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, border: { display: false }, ticks: { precision: 0 } } } }
});
function chartTheme() {
  const css = getComputedStyle(document.documentElement);
  chart.data.datasets[0].backgroundColor = css.getPropertyValue('--accent').trim();
  chart.options.scales.x.ticks.color = chart.options.scales.y.ticks.color = css.getPropertyValue('--muted').trim();
  chart.options.scales.y.grid.color = css.getPropertyValue('--grid').trim();
  chart.update();
  $('theme-toggle').textContent = document.documentElement.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode';
}
$('theme-toggle').addEventListener('click', () => {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('running-utilities.theme', document.documentElement.dataset.theme); } catch { /* Optional persistence. */ }
  chartTheme();
});
chartTheme();

function readMileage() { return { goal: parseField('goal-mileage'), days: DAYS.map((_, i) => parseField(`day-${i}`)) }; }
function captureMileage() {
  state.goal = $('goal-mileage').value;
  state.days = DAYS.map((_, i) => $(`day-${i}`).value);
  save();
}
function updateMileage() {
  captureMileage();
  try {
    const { goal, days } = readMileage();
    const { total, remaining } = mileageSummary(goal, days);
    $('planned-total').textContent = formatNumber(total);
    $('remaining-total').textContent = remaining === null ? '—' : formatNumber(Math.abs(remaining));
    $('remaining-label').textContent = remaining !== null && remaining < -0.000001 ? 'Over goal' : 'Remaining';
    $('week-summary').textContent = goal === null ? 'Set a weekly goal to get started.' : Math.abs(remaining) < .005 ? 'Your week is right on target.' : remaining < 0 ? `${formatNumber(-remaining)} miles over your goal.` : `${formatNumber(remaining)} miles left to plan.`;
    chart.data.datasets[0].data = days.map(v => v ?? 0);
    $('mileage-chart').setAttribute('aria-label', `Daily planned mileage: ${DAYS.map((day, i) => `${day} ${days[i] ?? 0} miles`).join(', ')}.`);
    feedback('mileage-feedback', '');
    chart.update();
  } catch (error) {
    $('planned-total').textContent = $('remaining-total').textContent = '—';
    $('week-summary').textContent = 'Check the highlighted mileage input.';
    feedback('mileage-feedback', error.message, true);
    chart.data.datasets[0].data = Array(7).fill(0); chart.update();
  }
}
$('weekly-mileage').addEventListener('input', updateMileage);
$('distribute').addEventListener('click', () => {
  try {
    const { goal, days } = readMileage();
    const next = distributeMileage(goal, days);
    next.forEach((v, i) => { $(`day-${i}`).value = v; });
    updateMileage(); feedback('mileage-feedback', 'Remaining miles distributed. Your rest days stayed in place.');
  } catch (error) { feedback('mileage-feedback', error.message, true); }
});
$('reset-mileage').addEventListener('click', () => {
  $('goal-mileage').value = ''; DAYS.forEach((_, i) => { $(`day-${i}`).value = ''; });
  updateMileage(); feedback('mileage-feedback', 'Week reset.');
});

function selected(name) { return document.querySelector(`input[name="${name}"]:checked`)?.value; }
function captureSplits() {
  for (const [key, id] of [['hours','goal-hours'],['minutes','goal-minutes'],['seconds','goal-seconds'],['customDistance','custom-distance'],['customTrack','custom-track']]) state[key] = $(id).value;
  state.event = selected('event') || '800'; state.track = selected('track') || '400'; save();
}
function clearSplits() {
  $('finish-time').textContent = '—'; $('split-count').textContent = 'Even pace';
  $('race-description').textContent = 'Your next finish line starts here.';
  $('split-table-wrap').hidden = true; $('split-empty').hidden = false; $('split-rows').replaceChildren();
}
function updateSplits() {
  captureSplits();
  $('custom-distance-label').hidden = state.event !== 'custom';
  $('custom-track-label').hidden = state.track !== 'custom';
  try {
    const hours = parseField('goal-hours', { max: 99, integer: true }) ?? 0;
    const minutes = parseField('goal-minutes', { max: 59, integer: true }) ?? 0;
    const seconds = parseField('goal-seconds', { max: 59.99 }) ?? 0;
    const distance = state.event === 'custom' ? parseField('custom-distance', { min: 1 }) : Number(state.event);
    const trackLength = state.track === 'custom' ? parseField('custom-track', { min: 1 }) : Number(state.track);
    const target = hours * 3600 + minutes * 60 + seconds;
    if (!target || distance === null || trackLength === null) {
      clearSplits(); feedback('splits-feedback', !target ? 'Enter a finish time to see your splits.' : 'Enter your custom distance or track length.'); return;
    }
    const rows = calculateSplits({ seconds: target, distance, trackLength });
    $('finish-time').textContent = formatTime(target);
    $('race-description').textContent = `${formatNumber(distance)}m race · ${formatNumber(trackLength)}m track`;
    $('split-count').textContent = `${rows.length} ${rows.length === 1 ? 'split' : 'splits'}`;
    $('split-rows').innerHTML = rows.map(row => `<tr><td>${row.lap}</td><td>${formatNumber(row.distance)}m</td><td>${formatTime(row.seconds)}<span class="sr-only"> over ${formatNumber(row.lapDistance)} meters</span></td><td>${formatTime(row.cumulative)}</td></tr>`).join('');
    $('split-empty').hidden = true; $('split-table-wrap').hidden = false;
    feedback('splits-feedback', rows[0].lapDistance < trackLength - .001 ? `Opening split: ${formatNumber(rows[0].lapDistance)}m, then full laps.` : 'Even pace for every lap.');
  } catch (error) { clearSplits(); feedback('splits-feedback', error.message, true); }
}
$('track-splits').addEventListener('input', updateSplits);
$('reset-splits').addEventListener('click', () => {
  for (const id of ['goal-hours','goal-minutes','goal-seconds','custom-distance','custom-track']) $(id).value = '';
  document.querySelector('input[name="event"][value="800"]').checked = true;
  document.querySelector('input[name="track"][value="400"]').checked = true;
  updateSplits(); feedback('splits-feedback', 'Splits reset. Enter a finish time to start again.');
});

function route() {
  const tool = location.hash === '#track-splits' ? 'track-splits' : 'weekly-mileage';
  for (const id of ['weekly-mileage', 'track-splits']) $(id).hidden = id !== tool;
  document.querySelectorAll('[data-tool]').forEach(link => {
    if (link.dataset.tool === tool) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (tool === 'weekly-mileage') chart.resize();
}
// Hashes identify views rather than scroll targets; keep navigation stable.
document.querySelectorAll('a[href="#weekly-mileage"],a[href="#track-splits"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); if (location.hash !== link.hash) history.pushState(null, '', link.hash); route();
}));
window.addEventListener('hashchange', route); window.addEventListener('popstate', route);
$('goal-mileage').value = state.goal; DAYS.forEach((_, i) => { $(`day-${i}`).value = state.days[i]; });
for (const [key, id] of [['hours','goal-hours'],['minutes','goal-minutes'],['seconds','goal-seconds'],['customDistance','custom-distance'],['customTrack','custom-track']]) $(id).value = state[key];
for (const name of ['event', 'track']) {
  const options = [...document.querySelectorAll(`input[name="${name}"]`)];
  (options.find(el => el.value === state[name]) || options.find(el => el.value === (name === 'event' ? '800' : '400'))).checked = true;
}
updateMileage(); updateSplits(); route();
