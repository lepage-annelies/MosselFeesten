/**
 * Rendering logic for chairs and counters
 */
import { CONFIG } from './config.js';
import { DOM, updateCounters } from './ui.js';
import { normalizeStatus, getStatusLabel, countByStatus } from './status.js';

/**
 * Render all chairs to DOM
 */
export function render(layout, status, onChairClick, onChairDragStart) {
  DOM.chairsLayer.innerHTML = '';

  for (const chair of layout) {
    const button = document.createElement('button');
    const chairStatus = normalizeStatus(status[chair.id]);

    button.className = 'chair' + (chairStatus === CONFIG.STATUS_VALUES.FREE ? '' : ` ${chairStatus}`);
    button.style.left = chair.x + '%';
    button.style.top = chair.y + '%';
    button.style.width = CONFIG.CHAIR.WIDTH + '%';
    button.style.height = CONFIG.CHAIR.HEIGHT + '%';
    button.dataset.id = chair.id;
    button.setAttribute('aria-label', getStatusLabel(chairStatus));

    button.addEventListener('click', () => onChairClick(chair.id));
    button.addEventListener('pointerdown', (e) => onChairDragStart(e, chair.id, button));

    DOM.chairsLayer.appendChild(button);
  }

  // Update counters
  const counts = countByStatus(layout, status);
  updateCounters(counts);
}

/**
 * Create a chair element (for preview)
 */
export function createChairElement(chair, status) {
  const button = document.createElement('button');
  const chairStatus = normalizeStatus(status[chair.id]);

  button.className = 'chair' + (chairStatus === CONFIG.STATUS_VALUES.FREE ? '' : ` ${chairStatus}`);
  button.style.left = chair.x + '%';
  button.style.top = chair.y + '%';
  button.style.width = CONFIG.CHAIR.WIDTH + '%';
  button.style.height = CONFIG.CHAIR.HEIGHT + '%';
  button.dataset.id = chair.id;
  button.setAttribute('aria-label', getStatusLabel(chairStatus));

  return button;
}