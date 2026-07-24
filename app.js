
const STATUS_KEY = "tafelplan-2026-seat-status-v4";
const LAYOUT_KEY = "tafelplan-2026-layout-v3";
const ADMIN_PIN = "2026";
const ROOM_ID = "mosselfeest-2026";

const chairsLayer = document.getElementById("chairs");
const plan = document.getElementById("plan");
const freeCount = document.getElementById("freeCount");
const reservedCount = document.getElementById("reservedCount");
const coverCount = document.getElementById("coverCount");
const occupiedCount = document.getElementById("occupiedCount");
const totalCount = document.getElementById("totalCount");
const saveStatus = document.getElementById("saveStatus");
const resetBtn = document.getElementById("resetBtn");
const fullBtn = document.getElementById("fullBtn");
const adminBtn = document.getElementById("adminBtn");
const adminBar = document.getElementById("adminBar");
const addBtn = document.getElementById("addBtn");
const deleteModeBtn = document.getElementById("deleteModeBtn");
const saveLayoutBtn = document.getElementById("saveLayoutBtn");
const cancelAdminBtn = document.getElementById("cancelAdminBtn");
const pinDialog = document.getElementById("pinDialog");
const pinInput = document.getElementById("pinInput");
const pinError = document.getElementById("pinError");
const pinOk = document.getElementById("pinOk");

let status = loadJSON(STATUS_KEY, {});
let layout = loadJSON(LAYOUT_KEY, DEFAULT_CHAIRS);
let workingLayout = structuredClone(layout);
let adminMode = false;
let deleteMode = false;
let drag = null;

let realtime = {
  enabled: false,
  connected: false,
  db: null,
  refs: {}
};

function loadJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

// Brengt bijna-gelijke X- en Y-posities exact op één lijn.
// Hierdoor staan stoelen perfect horizontaal en verticaal uitgelijnd.
function alignAxis(items, key, tolerance = 0.16) {
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
    const average = group.reduce((sum, value) => sum + value, 0) / group.length;
    const aligned = Number(average.toFixed(6));
    for (const value of group) alignedValues.set(value, aligned);
  }

  for (const item of items) {
    const original = Number(item[key]);
    if (alignedValues.has(original)) item[key] = alignedValues.get(original);
  }
}

function alignLayout(source) {
  const aligned = structuredClone(source);
  alignAxis(aligned, "x");
  alignAxis(aligned, "y");
  return aligned;
}

layout = alignLayout(layout);
workingLayout = alignLayout(workingLayout);

function activeLayout() {
  return adminMode ? workingLayout : layout;
}

function setSyncText(text, ok = false) {
  saveStatus.textContent = text;
  saveStatus.style.color = ok ? "#86efac" : "#fca5a5";
}

function flashSaved(text) {
  saveStatus.textContent = text;
  saveStatus.style.color = "#86efac";
  setTimeout(() => {
    if (realtime.enabled) {
      setSyncText(realtime.connected ? "Realtime verbonden" : "Offline – lokaal bewaard", realtime.connected);
    } else {
      saveStatus.textContent = adminMode ? "Beheer actief" : "Lokaal opgeslagen";
      saveStatus.style.color = "#9ca3af";
    }
  }, 700);
}

function saveLocal() {
  localStorage.setItem(STATUS_KEY, JSON.stringify(status));
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

function normalizeStatus(value) {
  if (value === true || value === "occupied") return "occupied";
  if (value === "reserved") return "reserved";
  if (value === "cover") return "cover";
  return "free";
}

function nextStatus(value) {
  const current = normalizeStatus(value);
  if (current === "free") return "reserved";
  if (current === "reserved") return "occupied";
  if (current === "occupied") return "cover";
  return "free";
}

function updateCounters() {
  const ids = new Set(activeLayout().map(c => c.id));
  let reserved = 0;
  let occupied = 0;
  let cover = 0;
  for (const id of ids) {
    const value = normalizeStatus(status[id]);
    if (value === "reserved") reserved++;
    if (value === "occupied") occupied++;
    if (value === "cover") cover++;
  }
  totalCount.textContent = ids.size;
  reservedCount.textContent = reserved;
  occupiedCount.textContent = occupied;
  coverCount.textContent = cover;
  freeCount.textContent = ids.size - reserved - occupied - cover;
}

function render() {
  chairsLayer.innerHTML = "";
  for (const chair of activeLayout()) {
    const button = document.createElement("button");
    const chairStatus = normalizeStatus(status[chair.id]);
    button.className = "chair" + (chairStatus === "free" ? "" : " " + chairStatus);
    button.style.left = chair.x + "%";
    button.style.top = chair.y + "%";
    button.style.width = "2%";
    button.style.height = "2.5%";
    button.dataset.id = chair.id;
    button.setAttribute(
      "aria-label",
      chairStatus === "reserved" ? "Gereserveerd" :
      chairStatus === "occupied" ? "Bezet" :
      chairStatus === "cover" ? "Te dekken" :
      "Vrij"
    );

    button.addEventListener("click", () => {
      if (drag?.moved) return;
      if (adminMode) {
        if (deleteMode) removeChair(chair.id);
        return;
      }
      setChairStatus(chair.id, nextStatus(status[chair.id]));
    });

    button.addEventListener("pointerdown", event => startDrag(event, chair.id, button));
    chairsLayer.appendChild(button);
  }
  updateCounters();
}

async function setChairStatus(id, value) {
  status[id] = value;
  localStorage.setItem(STATUS_KEY, JSON.stringify(status));
  render();

  if (realtime.enabled && realtime.refs.status) {
    try {
      await realtime.refs.set(realtime.refs.child(realtime.refs.status, id), value);
      flashSaved("Realtime opgeslagen");
    } catch {
      setSyncText("Offline – lokaal bewaard", false);
    }
  } else {
    flashSaved("Lokaal opgeslagen");
  }
}

function startDrag(event, id, button) {
  if (!adminMode || deleteMode) return;
  event.preventDefault();
  button.setPointerCapture(event.pointerId);
  drag = {id, button, moved:false};

  const move = e => {
    const rect = plan.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const chair = workingLayout.find(c => c.id === id);
    if (!chair) return;
    chair.x = Number((Math.round(x * 10) / 10).toFixed(1));
    chair.y = Number((Math.round(y * 10) / 10).toFixed(1));
    button.style.left = chair.x + "%";
    button.style.top = chair.y + "%";
    drag.moved = true;
  };

  const end = () => {
    button.removeEventListener("pointermove", move);
    button.removeEventListener("pointerup", end);
    button.removeEventListener("pointercancel", end);
    setTimeout(() => drag = null, 0);
  };

  button.addEventListener("pointermove", move);
  button.addEventListener("pointerup", end);
  button.addEventListener("pointercancel", end);
}

function removeChair(id) {
  workingLayout = workingLayout.filter(c => c.id !== id);
  render();
}

adminBtn.addEventListener("click", () => {
  if (adminMode) {
    leaveAdmin(false);
    return;
  }
  pinInput.value = "";
  pinError.hidden = true;
  pinDialog.showModal();
  setTimeout(() => pinInput.focus(), 100);
});

pinOk.addEventListener("click", event => {
  event.preventDefault();
  if (pinInput.value !== ADMIN_PIN) {
    pinError.hidden = false;
    pinInput.select();
    return;
  }
  pinDialog.close();
  enterAdmin();
});

function enterAdmin() {
  adminMode = true;
  deleteMode = false;
  workingLayout = structuredClone(layout);
  document.body.classList.add("admin");
  adminBar.hidden = false;
  adminBtn.textContent = "🔓 Beheer";
  saveStatus.textContent = "Beheer actief";
  render();
}

function leaveAdmin(saved) {
  adminMode = false;
  deleteMode = false;
  document.body.classList.remove("admin", "delete-mode");
  adminBar.hidden = true;
  adminBtn.textContent = "🔒 Beheer";
  saveStatus.textContent = saved ? "Indeling opgeslagen" : "Wijzigingen geannuleerd";
  render();
}

addBtn.addEventListener("click", () => {
  const maxNum = workingLayout.reduce((max, c) => Math.max(max, Number(c.id.replace(/\D/g,"")) || 0), 0);
  workingLayout.push({id:"s" + (maxNum + 1), x:50, y:50});
  render();
});

deleteModeBtn.addEventListener("click", () => {
  deleteMode = !deleteMode;
  document.body.classList.toggle("delete-mode", deleteMode);
  deleteModeBtn.classList.toggle("active-danger", deleteMode);
  deleteModeBtn.textContent = deleteMode ? "Verwijderen stoppen" : "Stoel verwijderen";
});

saveLayoutBtn.addEventListener("click", async () => {
  workingLayout = alignLayout(workingLayout);
  layout = structuredClone(workingLayout);
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));

  if (realtime.enabled && realtime.refs.layout) {
    try {
      await realtime.refs.set(realtime.refs.layout, layout);
      flashSaved("Indeling realtime opgeslagen");
    } catch {
      setSyncText("Indeling lokaal opgeslagen", false);
    }
  }
  leaveAdmin(true);
});

cancelAdminBtn.addEventListener("click", () => leaveAdmin(false));

resetBtn.addEventListener("click", async () => {
  if (!confirm("Alle stoelen opnieuw groen/vrij zetten?")) return;
  status = {};
  localStorage.setItem(STATUS_KEY, JSON.stringify(status));
  render();

  if (realtime.enabled && realtime.refs.status) {
    try {
      await realtime.refs.set(realtime.refs.status, {});
      flashSaved("Alle stoelen realtime vrijgezet");
    } catch {
      setSyncText("Alleen lokaal vrijgezet", false);
    }
  }
});

fullBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      fullBtn.textContent = "Scherm sluiten";
    } else {
      await document.exitFullscreen();
    }
  } catch {
    alert("Gebruik op dit toestel de browseroptie 'Toevoegen aan beginscherm' of 'Volledig scherm'.");
  }
});

document.addEventListener("fullscreenchange", () => {
  fullBtn.textContent = document.fullscreenElement ? "Scherm sluiten" : "Volledig scherm";
});

async function startRealtime() {
  const cfg = window.FIREBASE_CONFIG || {};
  const complete = cfg.apiKey && cfg.databaseURL && cfg.projectId && cfg.appId;

  if (!complete) {
    setSyncText("Firebase nog niet ingesteld", false);
    return;
  }

  try {
    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const dbModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");

    const firebaseApp = appModule.initializeApp(cfg);
    const db = dbModule.getDatabase(firebaseApp);
    const roomRef = dbModule.ref(db, `rooms/${ROOM_ID}`);
    const statusRef = dbModule.ref(db, `rooms/${ROOM_ID}/status`);
    const layoutRef = dbModule.ref(db, `rooms/${ROOM_ID}/layout`);
    const connectedRef = dbModule.ref(db, ".info/connected");

    realtime.enabled = true;
    realtime.db = db;
    realtime.refs = {
      status: statusRef,
      layout: layoutRef,
      child: dbModule.child,
      set: dbModule.set
    };

    dbModule.onValue(connectedRef, snap => {
      realtime.connected = snap.val() === true;
      setSyncText(realtime.connected ? "Realtime verbonden" : "Offline – lokaal bewaard", realtime.connected);
    });

    dbModule.onValue(statusRef, snap => {
      const remote = snap.val();
      if (remote !== null) {
        status = remote || {};
        localStorage.setItem(STATUS_KEY, JSON.stringify(status));
        render();
      }
    });

    dbModule.onValue(layoutRef, snap => {
      const remote = snap.val();
      if (Array.isArray(remote) && remote.length > 0) {
        layout = alignLayout(remote);
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
        if (!adminMode) render();
      } else {
        dbModule.set(layoutRef, layout);
      }
    });

    // Ensure room exists.
    dbModule.get(roomRef).then(snap => {
      if (!snap.exists()) {
        dbModule.set(roomRef, {status, layout});
      }
    });

  } catch (error) {
    console.error(error);
    setSyncText("Firebaseverbinding mislukt", false);
  }
}

render();
startRealtime();

if ("serviceWorker" in navigator) {
  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("service-worker.js", {updateViaCache: "none"})
    .then(registration => {
      registration.update().catch(() => {});
    })
    .catch(() => {});
}
