/**
 * Firebase Realtime Database integration
 */
import { CONFIG, FIREBASE_CONFIG } from './config.js';
import { alignLayout } from './alignment.js';

export const RealtimeState = {
  enabled: false,
  connected: false,
  db: null,
  refs: {},
};

/**
 * Initialize Firebase Realtime Database
 */
export async function initializeRealtime(
  setSyncText,
  onStatusUpdate,
  onLayoutUpdate,
  currentStatus,
  currentLayout
) {
  const cfg = FIREBASE_CONFIG || {};
  const isComplete = cfg.apiKey && cfg.databaseURL && cfg.projectId && cfg.appId;

  if (!isComplete) {
    setSyncText('Firebase nog niet ingesteld', false);
    return;
  }

  try {
    const appModule = await import(
      `${CONFIG.FIREBASE_CDN}/${CONFIG.FIREBASE_VERSION}/firebase-app.js`
    );
    const dbModule = await import(
      `${CONFIG.FIREBASE_CDN}/${CONFIG.FIREBASE_VERSION}/firebase-database.js`
    );

    const firebaseApp = appModule.initializeApp(cfg);
    const db = dbModule.getDatabase(firebaseApp);

    const roomRef = dbModule.ref(db, `rooms/${CONFIG.ROOM_ID}`);
    const statusRef = dbModule.ref(db, `rooms/${CONFIG.ROOM_ID}/status`);
    const layoutRef = dbModule.ref(db, `rooms/${CONFIG.ROOM_ID}/layout`);
    const connectedRef = dbModule.ref(db, '.info/connected');

    RealtimeState.enabled = true;
    RealtimeState.db = db;
    RealtimeState.refs = {
      status: statusRef,
      layout: layoutRef,
      child: dbModule.child,
      set: dbModule.set,
    };

    // Listen for connection status
    dbModule.onValue(connectedRef, (snap) => {
      RealtimeState.connected = snap.val() === true;
      setSyncText(
        RealtimeState.connected ? 'Realtime verbonden' : 'Offline – lokaal bewaard',
        RealtimeState.connected
      );
    });

    // Listen for status updates
    dbModule.onValue(statusRef, (snap) => {
      const remote = snap.val();
      if (remote !== null) {
        onStatusUpdate(remote || {});
      }
    });

    // Listen for layout updates
    dbModule.onValue(layoutRef, (snap) => {
      const remote = snap.val();
      if (Array.isArray(remote) && remote.length > 0) {
        onLayoutUpdate(alignLayout(remote));
      } else {
        dbModule.set(layoutRef, currentLayout);
      }
    });

    // Ensure room exists
    dbModule.get(roomRef).then((snap) => {
      if (!snap.exists()) {
        dbModule.set(roomRef, { status: currentStatus, layout: currentLayout });
      }
    });
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    setSyncText('Firebaseverbinding mislukt', false);
  }
}

/**
 * Update status via Realtime Database
 */
export async function setRealtimeStatus(id, value) {
  if (!RealtimeState.enabled || !RealtimeState.refs.status) {
    return false;
  }

  try {
    await RealtimeState.refs.set(
      RealtimeState.refs.child(RealtimeState.refs.status, id),
      value
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Update layout via Realtime Database
 */
export async function setRealtimeLayout(layout) {
  if (!RealtimeState.enabled || !RealtimeState.refs.layout) {
    return false;
  }

  try {
    await RealtimeState.refs.set(RealtimeState.refs.layout, layout);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset all statuses via Realtime Database
 */
export async function clearRealtimeStatus() {
  if (!RealtimeState.enabled || !RealtimeState.refs.status) {
    return false;
  }

  try {
    await RealtimeState.refs.set(RealtimeState.refs.status, {});
    return true;
  } catch {
    return false;
  }
}