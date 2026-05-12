/* ================================================
   BANSEK Admin — Firebase Config & Helpers
   Copy of js/firebase.js for the admin repo
   ================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, onValue, update, remove, get
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

export async function updateOrderStatus(orderId, newStatus) {
  await update(ref(db, `orders/${orderId}`), { status: newStatus });
}

export async function deleteOrderFromFirebase(orderId) {
  await remove(ref(db, `orders/${orderId}`));
}

export async function clearAllOrdersFromFirebase() {
  await remove(ref(db, 'orders'));
}

export function listenToOrders(callback) {
  onValue(ref(db, 'orders'), (snapshot) => {
    if (!snapshot.exists()) { callback([]); return; }
    const orders = Object.values(snapshot.val());
    orders.sort((a, b) => {
      const ta = a.id ? parseInt(a.id.replace('ORD-', '')) : 0;
      const tb = b.id ? parseInt(b.id.replace('ORD-', '')) : 0;
      return ta - tb;
    });
    callback(orders);
  });
}
