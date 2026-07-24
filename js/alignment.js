/**
 * Chair layout alignment utilities
 * Aligns nearly-equal X and Y positions to exact grid lines
 */
import { CONFIG } from './config.js';

/**
 * Group values by proximity and return aligned values
 */
function alignAxis(items, key, tolerance = CONFIG.ALIGNMENT_TOLERANCE) {
  const values = [...new Set(items.map(item => Number(item[key])))]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const groups = [];
  for (const value of values) {
    const last = groups.at(-1);
    if (!last || Math.abs(value - last.at(-1)) > tolerance) {
      groups.push([value]);
    } else {
      last.push(value);
    }
  }

  const alignedValues = new Map();
  for (const group of groups) {
    const average = group.reduce((sum, val) => sum + val, 0) / group.length;
    const aligned = Number(average.toFixed(6));
    for (const val of group) alignedValues.set(val, aligned);
  }

  for (const item of items) {
    const original = Number(item[key]);
    if (alignedValues.has(original)) {
      item[key] = alignedValues.get(original);
    }
  }
}

/**
 * Align layout both horizontally and vertically
 */
export function alignLayout(source) {
  const aligned = structuredClone(source);
  alignAxis(aligned, 'x');
  alignAxis(aligned, 'y');
  return aligned;
}