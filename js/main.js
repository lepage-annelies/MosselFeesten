/**
 * Main application entry point
 */
import { CONFIG, FIREBASE_CONFIG } from './config.js';
import { Storage } from './storage.js';
import { alignLayout } from './alignment.js';
import { normalizeStatus, nextStatus, countByStatus } from './status.js';
import { DOM, setSyncText, flashSaved, setAdminMode, setDeleteMode } from './ui.js';
import { render } from './render.js';
import { initializeRealtime, setRealtimeStatus, setRealtimeLayout, clearRealtimeStatus, RealtimeState } from './realtime.js';
import { startDrag } from './drag.js';
import { enterAdminMode, leaveAdminMode, showPinDialog, verifyPin, generateChairId } from './admin.js';

// Load default chairs
const defaultChairsResponse = await fetch('./data/chairs.json');
const defaultChairsData = await defaultChairsResponse.json();
const DEFAULT_CHAIRS = defaultChairsData.chairs;

// Application state
let status = Storage.loadStatus();
let layout = alignLayout(Storage.loadLayout(DEFAULT_CHAIRS));
let workingLayout = structuredClone(layout);
let adminMode = false;
let deleteMode = false;
let drag = null;

/**
 * Update chair status
 */
async function setChairStatus(id, value) {
  status[id] = value;
  Storage.saveStatus(status);
  render(activeLayout(), status, onChairClick, onChairDragStart);

  if (RealtimeState.enabled && RealtimeState.refs.status) {
    const success = await setRealtimeStatus(id, value);
    if (success) {
      flashSaved('Realtime opgeslagen', RealtimeState.enabled, RealtimeState.connected, adminMode);
    } else {
      setSyncText('Offline – lokaal bewaard', false);
    }
  } else {
    flashSaved('Lokaal opgeslagen', RealtimeState.enabled, RealtimeState.connected, adminMode);
  }
}

/**
 * Get active layout (working in admin mode, otherwise saved)
 */
function activeLayout() {
  return adminMode ? workingLayout : layout;
}

/**
 * Chair click handler
 */
function onChairClick(id) {
  if (drag?.moved) return;
  if (adminMode) {
    if (deleteMode) removeChair(id);
    return;
  }
  setChairStatus(id, nextStatus(status[id]));
}

/**
 * Chair drag start handler
 */
function onChairDragStart(event, id, button) {
  if (!adminMode || deleteMode) return;
  drag = startDrag(event, id, button, workingLayout, () => render(activeLayout(), status, onChairClick, onChairDragStart));
}

/**
 * Remove chair from layout
 */
function removeChair(id) {
  workingLayout = workingLayout.filter((c) => c.id !== id);
  render(activeLayout(), status, onChairClick, onChairDragStart);
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Admin button - show PIN dialog
 */
DOM.adminBtn.addEventListener('click', () => {
  if (adminMode) {
    leaveAdminMode(false);
    return;
  }
  showPinDialog();
});

/**
 * PIN dialog submit
 */
DOM.pinOk.addEventListener('click', (event) => {
  event.preventDefault();
  if (verifyPin(DOM.pinInput.value, CONFIG.ADMIN_PIN)) {
    adminMode = true;
    deleteMode = false;
    workingLayout = structuredClone(layout);
    enterAdminMode();
    render(activeLayout(), status, onChairClick, onChairDragStart);
  }
});

/**
 * Full screen button
 */
DOM.fullBtn.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      DOM.fullBtn.textContent = 'Scherm sluiten';
    } else {
      await document.exitFullscreen();
    }
  } catch {
    alert("Gebruik op dit toestel de browseroptie 'Toevoegen aan beginscherm' of 'Volledig scherm'.");
  }
});

document.addEventListener('fullscreenchange', () => {
  DOM.fullBtn.textContent = document.fullscreenElement ? 'Scherm sluiten' : 'Volledig scherm';
});

/**
 * Delete mode toggle
 */
DOM.deleteModeBtn.addEventListener('click', () => {
  deleteMode = !deleteMode;
  setDeleteMode(deleteMode);
});

/**
 * Add chair
 */
DOM.addBtn.addEventListener('click', () => {
  const id = generateChairId(workingLayout);
  workingLayout.push({ id, x: 50, y: 50 });
  render(activeLayout(), status, onChairClick, onChairDragStart);
});

/**
 * Save layout
 */
DOM.saveLayoutBtn.addEventListener('click', async () => {
  workingLayout = alignLayout(workingLayout);
  layout = structuredClone(workingLayout);
  Storage.saveLayout(layout);

  if (RealtimeState.enabled && RealtimeState.refs.layout) {
    const success = await setRealtimeLayout(layout);
    if (success) {
      flashSaved('Indeling realtime opgeslagen', RealtimeState.enabled, RealtimeState.connected, false);
    } else {
      setSyncText('Indeling lokaal opgeslagen', false);
    }
  }
  adminMode = false;
  leaveAdminMode(true);
  render(activeLayout(), status, onChairClick, onChairDragStart);
});

/**
 * Cancel admin mode
 */
DOM.cancelAdminBtn.addEventListener('click', () => {
  adminMode = false;
  leaveAdminMode(false);
  render(activeLayout(), status, onChairClick, onChairDragStart);
});

/**
 * Reset all statuses
 */
DOM.resetBtn.addEventListener('click', async () => {
  if (!confirm('Alle stoelen opnieuw groen/vrij zetten?')) return;
  status = {};
  Storage.saveStatus(status);
  render(activeLayout(), status, onChairClick, onChairDragStart);

  if (RealtimeState.enabled && RealtimeState.refs.status) {
    const success = await clearRealtimeStatus();
    if (success) {
      flashSaved('Alle stoelen realtime vrijgezet', RealtimeState.enabled, RealtimeState.connected, true);
    } else {
      setSyncText('Alleen lokaal vrijgezet', false);
    }
  }
});

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initial render
 */
render(activeLayout(), status, onChairClick, onChairDragStart);

/**
 * Initialize Realtime Database
 */
await initializeRealtime(
  setSyncText,
  (remoteStatus) => {
    status = remoteStatus || {};
    Storage.saveStatus(status);
    render(activeLayout(), status, onChairClick, onChairDragStart);
  },
  (remoteLayout) => {
    layout = remoteLayout;
    Storage.saveLayout(layout);
    if (!adminMode) render(activeLayout(), status, onChairClick, onChairDragStart);
  },
  status,
  layout
);

/**
 * Service Worker registration
 */
if ('serviceWorker' in navigator) {
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register('service-worker.js', { updateViaCache: 'none' })
    .then(() => {})
    .catch(() => {});
}