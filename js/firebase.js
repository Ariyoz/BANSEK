/* ================================================
   BANSEK Pure Water — Firebase Config & Helpers
   Realtime Database for cross-domain order sync
   ================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, update, remove, get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDbhmAQEeN2QIzRxXYu_ZQVqjOGhaio7I0",
  authDomain:        "bansek-f81f3.firebaseapp.com",
  databaseURL:       "https://bansek-f81f3-default-rtdb.firebaseio.com",
  projectId:         "bansek-f81f3",
  storageBucket:     "bansek-f81f3.firebasestorage.app",
  messagingSenderId: "230268348352",
  appId:             "1:230268348352:web:8f759fd7aa167c4a45ca25"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── Save a new order ──────────────────────────────
export async function saveOrderToFirebase(order) {
  // Use the order's own ID as the key so it's easy to look up
  const orderRef = ref(db, `orders/${order.id}`);
  await set(orderRef, order);
}

// ── Update order status ───────────────────────────
export async function updateOrderStatus(orderId, newStatus) {
  const orderRef = ref(db, `orders/${orderId}`);
  await update(orderRef, { status: newStatus });
}

// ── Delete one order ──────────────────────────────
export async function deleteOrderFromFirebase(orderId) {
  const orderRef = ref(db, `orders/${orderId}`);
  await remove(orderRef);
}

// ── Delete all orders ─────────────────────────────
export async function clearAllOrdersFromFirebase() {
  const ordersRef = ref(db, 'orders');
  await remove(ordersRef);
}

// ── Get all orders once ───────────────────────────
export async function getOrdersOnce() {
  const ordersRef = ref(db, 'orders');
  const snapshot  = await get(ordersRef);
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val());
}

// ── Listen for real-time order changes ────────────
// callback receives the full orders array every time anything changes
export function listenToOrders(callback) {
  const ordersRef = ref(db, 'orders');
  onValue(ordersRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return; }
    const orders = Object.values(snapshot.val());
    // Sort by timestamp ascending (oldest first)
    orders.sort((a, b) => {
      const ta = a.id ? parseInt(a.id.replace('ORD-','')) : 0;
      const tb = b.id ? parseInt(b.id.replace('ORD-','')) : 0;
      return ta - tb;
    });
    callback(orders);
  });
}

export { db, ref };
