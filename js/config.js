/**
 * Application configuration
 */
export const CONFIG = {
  // Storage keys for localStorage
  STORAGE: {
    STATUS: 'tafelplan-2026-seat-status-v4',
    LAYOUT: 'tafelplan-2026-layout-v3',
  },
  // Admin
  ADMIN_PIN: '2026',
  ADMIN_TIMEOUT: 100,
  // Firebase
  ROOM_ID: 'mosselfeest-2026',
  FIREBASE_VERSION: '10.12.5',
  FIREBASE_CDN: 'https://www.gstatic.com/firebasejs',
  // UI
  SYNC_TEXT_TIMEOUT: 700,
  POSITION_PRECISION: 10, // 1 decimal place for chair positions
  ALIGNMENT_TOLERANCE: 0.16,
  // Dimensions
  CHAIR: {
    WIDTH: 0.82,   // percentage
    HEIGHT: 1.16,  // percentage
  },
  // Status values
  STATUS_VALUES: {
    FREE: 'free',
    RESERVED: 'reserved',
    OCCUPIED: 'occupied',
    COVER: 'cover',
  },
};

// Firebase config - injected by environment
export const FIREBASE_CONFIG = window.FIREBASE_CONFIG || {};