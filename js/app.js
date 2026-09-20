import { AssemblyViewer } from './viewer.js';
import { PHASES, STEPS } from './steps.js';
import { PARTS } from './parts.js';

const STORAGE_KEY = 'diy-synth-guide-progress-v1';
const THEME_KEY = 'diy-synth-guide-theme-v1';

const state = {
  index: 0,
  done: new Set(),
  variant: {}, // per-step selection for steps with viewer.variants: stepId -> variant key
  exploded: {}, // per-step toggle for steps with viewer.explodable: stepId -> bool
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.done)) state.done = new Set(parsed.done);
    if (typeof parsed.index === 'number' && parsed.index >= 0 && parsed.index < STEPS.length) {
      state.index = parsed.index;
    }
  } catch (e) {
    /* ignore corrupt storage */
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ done: [...state.done], index: state.index }));
  } catch (e) {
    /* storage unavailable (private mode etc) -- fine, just don't persist */
  }
}

const els = {
  app: document.getElementById('app'),
  sidebar: document.getElementById('sidebar'),
  progressFill: document.getElementById('progressFill'),
  progressLabel: document.getElementById('progressLabel'),
  content: document.getElementById('content'),
  layout: document.getElementById('layout'),
  stepBody: document.getElementById('stepBody'),
  stepHeader: document.getElementById('stepHeader'),
  viewerCol: document.getElementById('viewerCol'),
  viewerCanvas: document.getElementById('viewerCanvas'),
  viewerToolbar: document.getElementById('viewerToolbar'),
  viewerLegend: document.getElementById('viewerLegend'),
  viewerAlt: document.getElementById('viewerAlt'),
  approxBadge: document.getElementById('approxBadge'),
  chipRow: document.getElementById('chipRow'),
  navPrev: document.getElementById('navPrev'),
  navNext: document.getElementById('navNext'),
  doneToggle: document.getElementById('doneToggle'),
  menuBtn: document.getElementById('menuBtn'),
  overlay: document.getElementById('overlay'),
  themeBtn: document.getElementById('themeBtn'),
};

let viewer = null;

// Light is the default; the header button toggles dark and remembers the choice.
function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(name, persist) {
  document.documentElement.dataset.theme = name;
  if (els.themeBtn) {
    const dark = name === 'dark';
    els.themeBtn.textContent = dark ? '\u2600' : '\u263E';
    els.themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    els.themeBtn.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  }
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, name);
    } catch (e) {
      /* ignore */
    }
  }
  // the 3D scene's background is read from CSS once, so re-sync it
  if (viewer) {
    viewer.setBackground(getComputedStyle(document.documentElement).getPropertyValue('--viewer-bg').trim());
  }
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
}

function ensureViewer() {
  if (!viewer) viewer = new AssemblyViewer(els.viewerCanvas, PARTS);
  return viewer;
}

function stepPercent() {
  return Math.round((state.done.size / STEPS.length) * 100);
}

function renderSidebar() {
  els.sidebar.innerHTML = '';

  const progressWrap = document.createElement('div');
  progressWrap.className = 'progress-wrap';
  progressWrap.innerHTML = `
    <div class="progress-label"><span>Progress</span><span id="progressLabel">0%</span></div>
    <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
  `;
  els.sidebar.appendChild(progressWrap);

  for (const phase of PHASES) {
    const group = document.createElement('div');
    group.className = 'phase-group';
    const title = document.createElement('div');
    title.className = 'phase-title';
    title.textContent = phase.title;
    group.appendChild(title);

    STEPS.forEach((step, i) => {
      if (step.phase !== phase.id) return;
      const item = document.createElement('div');
      item.className = 'step-item';
      if (i === state.index) item.classList.add('active');
      if (state.done.has(step.id)) item.classList.add('done');
      item.innerHTML = `
        <span class="check">✓</span>
        <span class="step-text"><span class="num">${i + 1}.</span>${step.title}</span>
      `;
      item.addEventListener('click', () => goTo(i));
      group.appendChild(item);
    });

    els.sidebar.appendChild(group);
  }

  // re-bind refs that were just replaced via innerHTML
  els.progressFill = document.getElementById('progressFill');
  els.progressLabel = document.getElementById('progressLabel');
  updateProgressUI();
}

function updateProgressUI() {
  const pct = stepPercent();
  if (els.progressFill) els.progressFill.style.width = pct + '%';
  if (els.progressLabel) els.progressLabel.textContent = pct + '%';
}

function renderChips(step) {
  els.chipRow.innerHTML = '';
  if (!step.checklist || !step.checklist.length) {
    els.chipRow.style.display = 'none';
    return;
  }
  els.chipRow.style.display = 'flex';
  els.chipRow.style.flexWrap = 'wrap';
  els.chipRow.style.gap = '6px';
  els.chipRow.style.margin = '0 0 16px';
  for (const item of step.checklist) {
    const chip = document.createElement('span');
    chip.className = 'badge';
    chip.textContent = '🔩 ' + item;
    els.chipRow.appendChild(chip);
  }
}

/**
 * Text description of what the 3D scene currently shows, for screen-reader
 * users (a <canvas> has no inherent accessible content of its own). Picks
 * the cover-variant-specific wording when the step has one, and appends an
 * optional note about a toggle state (exploded view, etc).
 */
function describeStep(step, extra) {
  const variant = state.variant[step.id];
  let text = step.alt || '3D model preview for this step.';
  if (step.altVariants && variant && step.altVariants[variant]) {
    text = step.altVariants[variant];
  }
  return extra ? `${text} ${extra}` : text;
}

function setViewerAlt(text) {
  els.viewerCanvas.setAttribute('aria-label', text);
  // aria-live region: proactively announces the change (e.g. after a toggle
  // click), since updating a plain aria-label doesn't announce on its own.
  els.viewerAlt.textContent = text;
}

// A step opts into a variant-swap toolbar (e.g. two interchangeable part
// options) via `step.viewer.variants: [{key, label}, ...]` plus an optional
// `defaultVariant`. resolveShow() then substitutes whichever variant key is
// currently selected for ANY of that list's keys appearing in show/highlight/dim.
function resolveShow(step, list) {
  const variants = step.viewer && step.viewer.variants;
  if (!variants || !variants.length) return list;
  const keys = new Set(variants.map((v) => v.key));
  const current = state.variant[step.id] || step.viewer.defaultVariant || variants[0].key;
  return list.map((k) => (keys.has(k) ? current : k));
}

function renderViewerToolbar(step) {
  els.viewerToolbar.innerHTML = '';
  const cfg = step.viewer;
  const v = ensureViewer();

  const resetBtn = document.createElement('button');
  resetBtn.className = 'chip-btn';
  resetBtn.textContent = '↺ Reset view';
  resetBtn.addEventListener('click', () => applyStepToViewer(step));
  els.viewerToolbar.appendChild(resetBtn);

  if (cfg.explodable) {
    const isExploded = () => !!state.exploded[step.id];
    const assembledBtn = document.createElement('button');
    const explodedBtn = document.createElement('button');
    assembledBtn.textContent = 'Assembled';
    explodedBtn.textContent = 'Exploded';
    const syncActive = () => {
      assembledBtn.classList.toggle('active', !isExploded());
      explodedBtn.classList.toggle('active', isExploded());
    };
    assembledBtn.className = 'chip-btn';
    explodedBtn.className = 'chip-btn';
    syncActive();
    assembledBtn.addEventListener('click', () => {
      state.exploded[step.id] = false;
      v.setExplode(false);
      v.setCamera(cfg.camera);
      syncActive();
      setViewerAlt(describeStep(step));
    });
    explodedBtn.addEventListener('click', () => {
      state.exploded[step.id] = true;
      v.setExplode(true);
      v.setCamera(cfg.explodedCamera);
      syncActive();
      setViewerAlt(describeStep(step, 'Currently shown exploded, with the parts spaced apart to see how they stack.'));
    });
    els.viewerToolbar.appendChild(assembledBtn);
    els.viewerToolbar.appendChild(explodedBtn);
    v.setExplode(isExploded());
  }

  if (cfg.variants && cfg.variants.length) {
    const current = state.variant[step.id] || cfg.defaultVariant || cfg.variants[0].key;
    state.variant[step.id] = current;

    const buttons = cfg.variants.map((variant) => {
      const btn = document.createElement('button');
      btn.className = 'chip-btn' + (current === variant.key ? ' active' : '');
      btn.textContent = variant.label;
      btn.addEventListener('click', () => {
        state.variant[step.id] = variant.key;
        for (const b of buttons) b.classList.remove('active');
        btn.classList.add('active');
        applyStepToViewer(step);
      });
      els.viewerToolbar.appendChild(btn);
      return btn;
    });
  }
}

function renderViewerLegend(step) {
  const cfg = step.viewer;
  els.viewerLegend.innerHTML = '';
  if (!cfg) return;
  const rows = [];
  if (cfg.highlight && cfg.highlight.length) {
    rows.push({ label: 'This step', color: 'var(--accent)' });
  }
  if (cfg.dim && cfg.dim.length) {
    rows.push({ label: 'Already placed', color: '#9a978d' });
  }
  for (const r of rows) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span class="swatch" style="background:${r.color}"></span><span>${r.label}</span>`;
    els.viewerLegend.appendChild(row);
  }
}

async function applyStepToViewer(step) {
  const cfg = step.viewer;
  if (!cfg) return;
  const v = ensureViewer();
  await v.applyStep({
    show: resolveShow(step, cfg.show || []),
    highlight: resolveShow(step, cfg.highlight || []),
    dim: resolveShow(step, cfg.dim || []),
    camera: cfg.camera,
    autoRotate: cfg.autoRotate,
  });
  const exploded = cfg.explodable ? !!state.exploded[step.id] : false;
  v.setExplode(exploded);
  if (exploded) v.setCamera(cfg.explodedCamera);
  setViewerAlt(describeStep(step, exploded ? 'Currently shown exploded, with the parts spaced apart to see how they stack.' : null));
  // trigger a resize in case layout just changed visibility
  window.dispatchEvent(new Event('resize'));
}

function renderStep() {
  const step = STEPS[state.index];

  els.stepHeader.innerHTML = `
    <div class="step-header">
      <span class="kicker">${step.kicker || ''}</span>
      ${step.approx ? '<span class="badge">📍 approximate 3D placement</span>' : ''}
    </div>
    <h1>${step.title}</h1>
  `;

  renderChips(step);
  els.stepBody.innerHTML = step.body;

  const isDone = state.done.has(step.id);
  els.doneToggle.classList.toggle('done', isDone);
  els.doneToggle.innerHTML = isDone ? '✓ Marked complete' : 'Mark step complete';

  els.app.classList.toggle('no-viewer', !step.viewer); // lets CSS centre the immersive card
  // a step can open already exploded (the cover step does)
  if (step.viewer && step.viewer.startExploded && !(step.id in state.exploded)) state.exploded[step.id] = true;

  if (step.viewer) {
    els.layout.classList.remove('no-viewer');
    els.viewerCol.style.display = '';
    applyStepToViewer(step);
    renderViewerToolbar(step);
    renderViewerLegend(step);
  } else {
    els.layout.classList.add('no-viewer');
    els.viewerCol.style.display = 'none';
  }

  els.navPrev.disabled = state.index === 0;
  els.navPrev.querySelector('.label').innerHTML = state.index > 0
    ? `<small>Back</small>${STEPS[state.index - 1].title}`
    : '<small>Back</small>—';

  const isLast = state.index === STEPS.length - 1;
  els.navNext.querySelector('.label').innerHTML = isLast
    ? '<small>Finish</small>You\'re done!'
    : `<small>Next</small>${STEPS[state.index + 1].title}`;
  els.navNext.disabled = false;

  els.content.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  history.replaceState(null, '', '#' + step.id);
  renderSidebar();
  saveProgress();
}

function goTo(index) {
  state.index = Math.max(0, Math.min(STEPS.length - 1, index));
  closeMobileSidebar();
  renderStep();
}

function markDoneAndAdvance() {
  const step = STEPS[state.index];
  state.done.add(step.id);
  if (state.index < STEPS.length - 1) {
    goTo(state.index + 1);
  } else {
    renderStep();
  }
}

function toggleDone() {
  const step = STEPS[state.index];
  if (state.done.has(step.id)) state.done.delete(step.id);
  else state.done.add(step.id);
  renderStep();
}

function initLayout() {
  // The viewer is position:fixed to cover the whole viewport, but
  // main.content gets a `backdrop-filter` for its glass-card look, and a
  // `filter`/`backdrop-filter` ancestor becomes the containing block for
  // fixed descendants (same rule as `transform`), so the "full-screen"
  // viewer would be sized relative to that small card instead of the
  // viewport. Hang it directly off #app instead.
  els.app.dataset.layout = 'immersive';
  els.app.appendChild(els.viewerCol);
  closeMobileSidebar();
  // canvas dimensions depend on the new CSS, so re-measure once it's applied
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

function closeMobileSidebar() {
  els.sidebar.classList.remove('open');
  els.overlay.classList.remove('open');
}

function initFromHash() {
  const hash = location.hash.replace('#', '');
  if (hash) {
    const idx = STEPS.findIndex((s) => s.id === hash);
    if (idx >= 0) state.index = idx;
  }
}

function bindEvents() {
  els.navPrev.addEventListener('click', () => goTo(state.index - 1));
  els.navNext.addEventListener('click', markDoneAndAdvance);
  els.doneToggle.addEventListener('click', toggleDone);
  els.menuBtn.addEventListener('click', () => {
    els.sidebar.classList.add('open');
    els.overlay.classList.add('open');
  });
  els.overlay.addEventListener('click', closeMobileSidebar);
  if (els.themeBtn) els.themeBtn.addEventListener('click', () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true));
  window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight') goTo(state.index + 1);
    if (e.key === 'ArrowLeft') goTo(state.index - 1);
  });
}

function main() {
  loadProgress();
  initFromHash();
  bindEvents();
  applyTheme(loadTheme(), false);
  initLayout();
  renderStep();
}

main();
