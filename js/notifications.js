/* ================================================
   BANSEK Pure Water — Notification Engine
   Works on static hosting (no server required)
   Uses: Notification API + BroadcastChannel + localStorage
   ================================================ */

const BANSEK_NOTIF_KEY   = 'bansek_notifications';
const BANSEK_NOTIF_PREFS = 'bansek_notif_prefs';
const BANSEK_CHANNEL     = 'bansek_channel';

// ── BroadcastChannel for cross-tab messaging ─────
let _channel = null;
function getChannel() {
  if (!_channel && typeof BroadcastChannel !== 'undefined') {
    _channel = new BroadcastChannel(BANSEK_CHANNEL);
  }
  return _channel;
}

// ── Register Service Worker ───────────────────────
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      // SW registration failed — OS notifications won't work but in-app will
    }
  }
}

// ── Request notification permission ──────────────
async function requestNotifPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

// ── Show OS-level notification via SW ─────────────
async function showOSNotification({ title, body, tag, url, requireInteraction = false }) {
  if (!('serviceWorker' in navigator)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title, body, tag, url, requireInteraction
    });
  } catch (e) {
    // Fallback: direct Notification API
    try { new Notification(title, { body, tag }); } catch (_) {}
  }
}

// ── Notification storage helpers ──────────────────
function loadNotifications() {
  try { return JSON.parse(localStorage.getItem(BANSEK_NOTIF_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveNotifications(list) {
  try { localStorage.setItem(BANSEK_NOTIF_KEY, JSON.stringify(list)); }
  catch (e) {}
}

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(BANSEK_NOTIF_PREFS) || '{}'); }
  catch (e) { return {}; }
}

function savePrefs(prefs) {
  try { localStorage.setItem(BANSEK_NOTIF_PREFS, JSON.stringify(prefs)); }
  catch (e) {}
}

// ── Create a notification record ──────────────────
// type: 'new_order' | 'status_update' | 'admin_message' | 'system'
// audience: 'admin' | 'user' | 'both'
function createNotification({ type, title, body, orderId, audience = 'admin', url = '' }) {
  return {
    id:        'NOTIF-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    type,
    title,
    body,
    orderId:   orderId || null,
    audience,
    url,
    read:      false,
    timestamp: new Date().toISOString(),
    datetime:  new Date().toLocaleString('en-NG', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  };
}

// ── Push a notification (save + broadcast + OS alert) ──
async function pushNotification(notifData) {
  const notif = createNotification(notifData);

  // Save to localStorage
  const list = loadNotifications();
  list.push(notif);
  // Keep max 100 notifications
  if (list.length > 100) list.splice(0, list.length - 100);
  saveNotifications(list);

  // Broadcast to other tabs
  const ch = getChannel();
  if (ch) ch.postMessage({ type: 'NEW_NOTIFICATION', notif });

  // OS notification (if permission granted)
  const prefs = loadPrefs();
  if (prefs.osNotifications !== false) {
    await showOSNotification({
      title: notif.title,
      body:  notif.body,
      tag:   notif.id,
      url:   notif.url || '/',
      requireInteraction: notifData.requireInteraction || false
    });
  }

  return notif;
}

// ── Mark notification(s) as read ──────────────────
function markRead(id) {
  const list = loadNotifications();
  const idx  = list.findIndex(n => n.id === id);
  if (idx !== -1) { list[idx].read = true; saveNotifications(list); }
}

function markAllRead(audience) {
  const list = loadNotifications().map(n => {
    if (!audience || n.audience === audience || n.audience === 'both') n.read = true;
    return n;
  });
  saveNotifications(list);
}

// ── Delete a notification ─────────────────────────
function deleteNotification(id) {
  const list = loadNotifications().filter(n => n.id !== id);
  saveNotifications(list);
}

function clearAllNotifications(audience) {
  if (!audience) { saveNotifications([]); return; }
  const list = loadNotifications().filter(n => n.audience !== audience && n.audience !== 'both');
  saveNotifications(list);
}

// ── Get unread count ──────────────────────────────
function getUnreadCount(audience) {
  return loadNotifications().filter(n =>
    !n.read && (!audience || n.audience === audience || n.audience === 'both')
  ).length;
}

// ── Get notifications for audience ───────────────
function getNotificationsFor(audience) {
  return loadNotifications()
    .filter(n => !audience || n.audience === audience || n.audience === 'both')
    .slice()
    .reverse(); // newest first
}

// ── Notification sound ────────────────────────────
function playNotifSound() {
  const prefs = loadPrefs();
  if (prefs.sound === false) return;
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

// ── Format relative time ──────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Init: register SW + request permission ────────
async function initNotifications() {
  await registerSW();
  const prefs = loadPrefs();
  if (prefs.osNotifications !== false) {
    await requestNotifPermission();
  }
}

// ── Export (used by other scripts via window) ─────
window.BansekNotif = {
  init:              initNotifications,
  push:              pushNotification,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll:          clearAllNotifications,
  getUnreadCount,
  getFor:            getNotificationsFor,
  loadPrefs,
  savePrefs,
  playSound:         playNotifSound,
  timeAgo,
  requestPermission: requestNotifPermission,
  getChannel,
  BANSEK_CHANNEL
};
