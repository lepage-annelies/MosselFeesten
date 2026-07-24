/**
 * Chair status management
 */
import { CONFIG } from './config.js';

const STATUS = CONFIG.STATUS_VALUES;

/**
 * Normalize any status value to standard form
 */
export function normalizeStatus(value) {
  if (value === true || value === STATUS.OCCUPIED) return STATUS.OCCUPIED;
  if (value === STATUS.RESERVED) return STATUS.RESERVED;
  if (value === STATUS.COVER) return STATUS.COVER;
  return STATUS.FREE;
}

/**
 * Get next status in cycle: free -> reserved -> occupied -> cover -> free
 */
export function nextStatus(value) {
  const current = normalizeStatus(value);
  const cycle = {
    [STATUS.FREE]: STATUS.RESERVED,
    [STATUS.RESERVED]: STATUS.OCCUPIED,
    [STATUS.OCCUPIED]: STATUS.COVER,
    [STATUS.COVER]: STATUS.FREE,
  };
  return cycle[current];
}

/**
 * Get aria label for status
 */
export function getStatusLabel(status) {
  const labels = {
    [STATUS.RESERVED]: 'Gereserveerd',
    [STATUS.OCCUPIED]: 'Bezet',
    [STATUS.COVER]: 'Te dekken',
    [STATUS.FREE]: 'Vrij',
  };
  return labels[normalizeStatus(status)] || 'Vrij';
}

/**
 * Count chairs by status
 */
export function countByStatus(layout, status) {
  const ids = new Set(layout.map(c => c.id));
  let reserved = 0, occupied = 0, cover = 0;

  for (const id of ids) {
    const value = normalizeStatus(status[id]);
    if (value === STATUS.RESERVED) reserved++;
    if (value === STATUS.OCCUPIED) occupied++;
    if (value === STATUS.COVER) cover++;
  }

  return {
    total: ids.size,
    reserved,
    occupied,
    cover,
    free: ids.size - reserved - occupied - cover,
  };
}