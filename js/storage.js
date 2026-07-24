/**
 * Storage operations - localStorage abstraction
 */
import { CONFIG } from './config.js';

export const Storage = {
  /**
   * Load JSON from localStorage with fallback
   */
  loadJSON(key, fallback = null) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? structuredClone(fallback);
    } catch (e) {
      console.error(`Failed to load ${key}:`, e);
      return structuredClone(fallback);
    }
  },

  /**
   * Save JSON to localStorage
   */
  saveJSON(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
      return false;
    }
  },

  /**
   * Load status from storage
   */
  loadStatus() {
    return this.loadJSON(CONFIG.STORAGE.STATUS, {});
  },

  /**
   * Save status to storage
   */
  saveStatus(status) {
    return this.saveJSON(CONFIG.STORAGE.STATUS, status);
  },

  /**
   * Load layout from storage
   */
  loadLayout(defaultLayout) {
    return this.loadJSON(CONFIG.STORAGE.LAYOUT, defaultLayout);
  },

  /**
   * Save layout to storage
   */
  saveLayout(layout) {
    return this.saveJSON(CONFIG.STORAGE.LAYOUT, layout);
  },
};