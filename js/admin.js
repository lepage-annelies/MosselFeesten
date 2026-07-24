/**
 * Admin mode management
 */
import { DOM, setAdminMode, setDeleteMode } from './ui.js';

/**
 * Enter admin mode
 */
export function enterAdminMode() {
  setAdminMode(true);
  DOM.saveStatus.textContent = 'Beheer actief';
  DOM.saveStatus.style.color = '#9ca3af';
}

/**
 * Leave admin mode
 */
export function leaveAdminMode(saved) {
  setAdminMode(false);
  setDeleteMode(false);
  DOM.saveStatus.textContent = saved ? 'Indeling opgeslagen' : 'Wijzigingen geannuleerd';
  DOM.saveStatus.style.color = '#9ca3af';
}

/**
 * Show PIN dialog
 */
export function showPinDialog() {
  DOM.pinInput.value = '';
  DOM.pinError.hidden = true;
  DOM.pinDialog.showModal();
  setTimeout(() => DOM.pinInput.focus(), CONFIG.ADMIN_TIMEOUT);
}

/**
 * Verify PIN
 */
export function verifyPin(input, correctPin) {
  if (input !== correctPin) {
    DOM.pinError.hidden = false;
    DOM.pinInput.select();
    return false;
  }
  DOM.pinDialog.close();
  return true;
}

/**
 * Generate next chair ID
 */
export function generateChairId(workingLayout) {
  const maxNum = workingLayout.reduce(
    (max, c) => Math.max(max, Number(c.id.replace(/\D/g, '')) || 0),
    0
  );
  return `s${maxNum + 1}`;
}