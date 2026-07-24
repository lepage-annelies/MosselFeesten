/**
 * UI management - DOM queries and updates
 */
import { CONFIG } from './config.js';

/**
 * DOM element cache
 */
export const DOM = {
  // Main elements
  body: document.body,
  chairsLayer: document.getElementById('chairs'),
  plan: document.getElementById('plan'),

  // Counters
  freeCount: document.getElementById('freeCount'),
  reservedCount: document.getElementById('reservedCount'),
  coverCount: document.getElementById('coverCount'),
  occupiedCount: document.getElementById('occupiedCount'),
  totalCount: document.getElementById('totalCount'),

  // Status
  saveStatus: document.getElementById('saveStatus'),

  // Buttons
  resetBtn: document.getElementById('resetBtn'),
  fullBtn: document.getElementById('fullBtn'),
  adminBtn: document.getElementById('adminBtn'),
  addBtn: document.getElementById('addBtn'),
  deleteModeBtn: document.getElementById('deleteModeBtn'),
  saveLayoutBtn: document.getElementById('saveLayoutBtn'),
  cancelAdminBtn: document.getElementById('cancelAdminBtn'),

  // Admin bar
  adminBar: document.getElementById('adminBar'),

  // Dialog
  pinDialog: document.getElementById('pinDialog'),
  pinInput: document.getElementById('pinInput'),
  pinError: document.getElementById('pinError'),
  pinOk: document.getElementById('pinOk'),
};

/**
 * Update sync status text and color
 */
export function setSyncText(text, ok = false) {
  DOM.saveStatus.textContent = text;
  DOM.saveStatus.style.color = ok ? '#86efac' : '#fca5a5';
}

/**
 * Flash saved confirmation (temporary)
 */
export function flashSaved(text, realtimeEnabled, realtimeConnected, adminMode) {
  DOM.saveStatus.textContent = text;
  DOM.saveStatus.style.color = '#86efac';

  setTimeout(() => {
    if (realtimeEnabled) {
      setSyncText(
        realtimeConnected ? 'Realtime verbonden' : 'Offline – lokaal bewaard',
        realtimeConnected
      );
    } else {
      DOM.saveStatus.textContent = adminMode ? 'Beheer actief' : 'Lokaal opgeslagen';
      DOM.saveStatus.style.color = '#9ca3af';
    }
  }, CONFIG.SYNC_TEXT_TIMEOUT);
}

/**
 * Update counter displays
 */
export function updateCounters(counts) {
  DOM.totalCount.textContent = counts.total;
  DOM.reservedCount.textContent = counts.reserved;
  DOM.occupiedCount.textContent = counts.occupied;
  DOM.coverCount.textContent = counts.cover;
  DOM.freeCount.textContent = counts.free;
}

/**
 * Toggle admin mode CSS class
 */
export function setAdminMode(enabled) {
  DOM.body.classList.toggle('admin', enabled);
  DOM.adminBar.hidden = !enabled;
  DOM.adminBtn.textContent = enabled ? '🔓 Beheer' : '🔒 Beheer';
}

/**
 * Toggle delete mode CSS class
 */
export function setDeleteMode(enabled) {
  DOM.body.classList.toggle('delete-mode', enabled);
  DOM.deleteModeBtn.classList.toggle('active-danger', enabled);
  DOM.deleteModeBtn.textContent = enabled ? 'Verwijderen stoppen' : 'Stoel verwijderen';
}