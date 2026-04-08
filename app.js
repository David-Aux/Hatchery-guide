// ============================================
//  HATCHERY GUIDE — Supabase Client & Utilities
// ============================================

// ── Supabase Config ──────────────────────────
const SUPABASE_URL = 'https://kmhdojnywtfavrlrzvnv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttaGRvam55d3RmYXZybHJ6dm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzQ2MzQsImV4cCI6MjA5MTI1MDYzNH0.4pEoW3ZQWlzhr7LrVt1jQpOsCXxJsoYdnDOqUOWWTSc';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth Helpers ─────────────────────────────
async function getUser() {
  const { data: { user } } = await db.auth.getUser();
  return user;
}

async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

async function signOut() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

// ── Toast Notifications ──────────────────────
function toast(message, type = 'default', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', warning: '⚠', default: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || icons.default}</span><span>${message}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ── Incubation Constants ─────────────────────
const INCUBATION = {
  TOTAL_DAYS: 21,
  LOCKDOWN_DAY: 18,
  CANDLE_DAYS: [7, 14],

  STAGES: {
    SETTING:  { start: 1,  end: 7,  label: 'Setting',   color: '#F59E0B' },
    MID:      { start: 8,  end: 17, label: 'Mid-Term',  color: '#15803D' },
    LOCKDOWN: { start: 18, end: 19, label: 'Lockdown',  color: '#DC2626' },
    HATCHING: { start: 20, end: 21, label: 'Hatching',  color: '#1D4ED8' },
  },

  // Temperature guidance (Celsius)
  TEMP: {
    SETTER_FORCED_AIR:  { optimal: 37.5, min: 37.2, max: 37.8 },
    SETTER_STILL_AIR:   { optimal: 38.3, min: 38.0, max: 38.6 },
    HATCHER_FORCED_AIR: { optimal: 37.2, min: 37.0, max: 37.5 },
  },

  // Humidity guidance (% RH)
  HUMIDITY: {
    SETTER:  { optimal: 55, min: 50, max: 60 },
    HATCHER: { optimal: 70, min: 65, max: 75 },
  },

  // Turning: stop at day 18
  TURNING: {
    FREQUENCY_HOURS: 4,
    STOP_DAY: 18,
    MIN_ANGLE: 45,
    RECOMMENDED_ANGLE: 90,
  },
};

// ── Analytics Engine ─────────────────────────
const Analytics = {

  calculate(data) {
    const {
      eggs_set = 0,
      fertile = 0,
      hatched = 0,
      early_dead = 0,
      late_dead = 0,
      exploders = 0,
      cull_chicks = 0,
      egg_weight_start = null,
      egg_weight_end = null,
    } = data;

    const infertile = eggs_set - fertile;

    const fertility_pct        = eggs_set  > 0 ? (fertile  / eggs_set  * 100) : 0;
    const total_hatch_pct      = eggs_set  > 0 ? (hatched  / eggs_set  * 100) : 0;
    const hatch_of_fertile_pct = fertile   > 0 ? (hatched  / fertile   * 100) : 0;
    const early_mort_pct       = fertile   > 0 ? (early_dead / fertile  * 100) : 0;
    const late_mort_pct        = fertile   > 0 ? (late_dead  / fertile  * 100) : 0;
    const exploder_pct         = eggs_set  > 0 ? (exploders  / eggs_set * 100) : 0;
    const cull_pct             = hatched   > 0 ? (cull_chicks / hatched * 100) : 0;

    const viable_chicks = hatched - cull_chicks;

    let weight_loss_pct = null;
    if (egg_weight_start && egg_weight_end && egg_weight_start > 0) {
      weight_loss_pct = ((egg_weight_start - egg_weight_end) / egg_weight_start * 100);
    }

    return {
      fertility_pct:        round2(fertility_pct),
      total_hatch_pct:      round2(total_hatch_pct),
      hatch_of_fertile_pct: round2(hatch_of_fertile_pct),
      early_mort_pct:       round2(early_mort_pct),
      late_mort_pct:        round2(late_mort_pct),
      exploder_pct:         round2(exploder_pct),
      cull_pct:             round2(cull_pct),
      weight_loss_pct:      weight_loss_pct !== null ? round2(weight_loss_pct) : null,
      infertile,
      viable_chicks,
    };
  },

  interpret(metrics) {
    const issues = [];
    const good   = [];

    // Fertility
    if (metrics.fertility_pct >= 90) good.push({ text: 'Excellent fertility rate', detail: 'Flock reproductive performance is outstanding.' });
    else if (metrics.fertility_pct >= 80) good.push({ text: 'Good fertility rate', detail: 'Minor flock management improvements may help.' });
    else if (metrics.fertility_pct >= 70) issues.push({ sev: 'warning', text: 'Below-average fertility', detail: 'Check male:female ratio, male health, and mating behavior.' });
    else issues.push({ sev: 'critical', text: 'Poor fertility', detail: 'Urgent — check roosters, nutrition, disease, or flock age.' });

    // Hatch of fertile
    if (metrics.hatch_of_fertile_pct >= 90) good.push({ text: 'Excellent hatch of fertile', detail: 'Incubation conditions are well-controlled.' });
    else if (metrics.hatch_of_fertile_pct >= 80) good.push({ text: 'Good hatch of fertile', detail: 'Minor improvements in humidity or turning may help.' });
    else if (metrics.hatch_of_fertile_pct >= 70) issues.push({ sev: 'warning', text: 'Moderate hatch of fertile', detail: 'Review temperature uniformity and humidity levels.' });
    else issues.push({ sev: 'critical', text: 'Poor hatch of fertile', detail: 'Serious incubation problem. Check temperature, humidity, ventilation.' });

    // Early mortality
    if (metrics.early_mort_pct > 5) issues.push({ sev: 'critical', text: `High early embryo mortality (${metrics.early_mort_pct}%)`, detail: 'Likely cause: incorrect incubation temperature, diseased parent flock, or poor egg storage.' });
    else if (metrics.early_mort_pct > 2.5) issues.push({ sev: 'warning', text: `Elevated early mortality (${metrics.early_mort_pct}%)`, detail: 'Monitor setter temperature closely.' });

    // Late mortality
    if (metrics.late_mort_pct > 5) issues.push({ sev: 'critical', text: `High late embryo mortality (${metrics.late_mort_pct}%)`, detail: 'Likely cause: CO₂ buildup, low humidity at lockdown, or hatching difficulties.' });
    else if (metrics.late_mort_pct > 2) issues.push({ sev: 'warning', text: `Elevated late mortality (${metrics.late_mort_pct}%)`, detail: 'Ensure ventilation and humidity are optimal at lockdown.' });

    // Exploders
    if (metrics.exploder_pct > 2) issues.push({ sev: 'critical', text: `Exploder rate too high (${metrics.exploder_pct}%)`, detail: 'Bacterial contamination in eggs or incubator. Deep clean immediately.' });

    // Weight loss
    if (metrics.weight_loss_pct !== null) {
      if (metrics.weight_loss_pct >= 11 && metrics.weight_loss_pct <= 13) good.push({ text: 'Ideal egg weight loss (11–13%)', detail: 'Humidity management is excellent.' });
      else if (metrics.weight_loss_pct < 11) issues.push({ sev: 'warning', text: `Low egg weight loss (${metrics.weight_loss_pct}%)`, detail: 'Humidity too high — increase ventilation or reduce humidity.' });
      else issues.push({ sev: 'warning', text: `High egg weight loss (${metrics.weight_loss_pct}%)`, detail: 'Humidity too low — chicks may struggle to hatch.' });
    }

    return { issues, good };
  },

  getStage(day) {
    for (const [key, stage] of Object.entries(INCUBATION.STAGES)) {
      if (day >= stage.start && day <= stage.end) return { key, ...stage };
    }
    return null;
  },

  getDayRecommendations(day) {
    const base = {
      turning: day < INCUBATION.TURNING.STOP_DAY,
      candle: INCUBATION.CANDLE_DAYS.includes(day),
      lockdown: day === INCUBATION.LOCKDOWN_DAY,
    };

    if (day <= 17) {
      base.temp = INCUBATION.TEMP.SETTER_FORCED_AIR;
      base.humidity = INCUBATION.HUMIDITY.SETTER;
      base.notes = [];
      if (day === 1)  base.notes.push('Pre-warm eggs to room temp before setting.');
      if (day === 7)  base.notes.push('First candle — remove clear/infertile eggs.');
      if (day === 14) base.notes.push('Second candle — remove late deads.');
    } else {
      base.temp = INCUBATION.TEMP.HATCHER_FORCED_AIR;
      base.humidity = INCUBATION.HUMIDITY.HATCHER;
      base.notes = [];
      if (day === 18) base.notes.push('Stop turning. Move eggs to hatcher. Increase humidity to 70%+.');
      if (day === 21) base.notes.push('Expected hatch day. Do not open incubator until 95% have hatched.');
    }

    return base;
  },
};

// ── Date Helpers ─────────────────────────────
function incubationDay(startDate) {
  const start = new Date(startDate);
  const today = new Date();
  const diff  = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(diff + 1, 21));
}

function hatchDate(startDate) {
  const start = new Date(startDate);
  start.setDate(start.getDate() + 21);
  return start;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const today  = new Date();
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

// ── Misc ─────────────────────────────────────
function round2(n) { return Math.round(n * 100) / 100; }

function pctColor(pct, thresholds) {
  // thresholds: { good: 85, warn: 70 }
  if (pct >= thresholds.good) return 'var(--green-mid)';
  if (pct >= thresholds.warn) return 'var(--amber)';
  return 'var(--red-alert)';
}

function renderMetricRing(canvasId, pct, color) {
  const el = document.getElementById(canvasId);
  if (!el) return;
  const r = 36, cx = 45, cy = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  el.innerHTML = `
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle class="metric-ring-track" cx="${cx}" cy="${cy}" r="${r}"/>
      <circle class="metric-ring-fill" cx="${cx}" cy="${cy}" r="${r}"
        stroke="${color}"
        stroke-dasharray="${circ}"
        stroke-dashoffset="${offset}"/>
    </svg>`;
}

// ── Sidebar Activation ────────────────────────
function activateNavItem(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');

  if (btn && sidebar) {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('open');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

// ── User Avatar Initials ──────────────────────
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
