/* ================================================
   BANSEK Pure Water — main.js
   Orders saved to Firebase Realtime Database
   ================================================ */

import { saveOrderToFirebase } from './firebase.js';

// ── Init notifications ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (window.BansekNotif) window.BansekNotif.init();
  initUserNotifBell();
});

// ── UPDATE THIS with the real WhatsApp number ──
const WHATSAPP_NUMBER = '2348000000000';

// ── Navbar scroll effect ─────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Mobile menu ──────────────────────────────────
function toggleMenu() {
  document.getElementById('nav-menu').classList.toggle('open');
}
window.toggleMenu = toggleMenu;

document.querySelectorAll('#nav-menu a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('nav-menu').classList.remove('open');
  });
});

// ── FAQ accordion ────────────────────────────────
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const answer = question.nextElementSibling;
    const item   = question.parentElement;
    const isOpen = answer.classList.contains('open');
    document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('active'));
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active-item'));
    if (!isOpen) {
      answer.classList.add('open');
      question.classList.add('active');
      item.classList.add('active-item');
    }
  });
});

// ── Payment method selector ──────────────────────
function selectPayment(el) {
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  const hidden = document.getElementById('payment-method');
  if (hidden) hidden.value = el.getAttribute('data-value');
  const err = document.getElementById('payment-error');
  if (err) err.style.display = 'none';
}
window.selectPayment = selectPayment;

// ── Order form → Firebase + WhatsApp ─────────────
const orderForm = document.getElementById('order-form');
if (orderForm) {

  // Pre-select product from URL param e.g. order.html?product=5bags
  const params  = new URLSearchParams(window.location.search);
  const product = params.get('product');
  if (product) {
    const select = document.getElementById('product-select');
    if (select) {
      const map = {
        '1bag':   '1 Bag – ₦500 (20 sachets)',
        '5bags':  '5 Bags – ₦2,500 (100 sachets)',
        '10bags': '10 Bags – ₦5,000 (200 sachets)',
        '20bags': '20 Bags – ₦9,500 (400 sachets)',
        '50bags': '50 Bags – ₦22,000 (1,000 sachets)',
      };
      Array.from(select.options).forEach(opt => {
        if (opt.value === map[product]) opt.selected = true;
      });
    }
  }

  orderForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name    = (document.getElementById('name').value || '').trim();
    const phone   = (document.getElementById('phone').value || '').trim();
    const product = (document.getElementById('product-select').value || '').trim();
    const qty     = (document.getElementById('quantity').value || '').trim();
    const address = (document.getElementById('address').value || '').trim();
    const date    = (document.getElementById('delivery-date').value || '').trim();
    const notes   = (document.getElementById('notes').value || '').trim();
    const payment = (document.getElementById('payment-method').value || '').trim();

    // Remove previous error
    const oldErr = document.getElementById('form-error');
    if (oldErr) oldErr.remove();

    // Validate payment
    if (!payment) {
      const payErr = document.getElementById('payment-error');
      if (payErr) {
        payErr.style.display = 'block';
        payErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!name || !phone || !product || !qty || !address) {
      const err = document.createElement('div');
      err.id = 'form-error';
      err.style.cssText = 'background:#fef2f2;color:#991b1b;border:1px solid #fca5a5;padding:14px 18px;border-radius:12px;margin-bottom:18px;font-size:.88rem;font-weight:600;';
      err.textContent = '⚠️ Please fill in all required fields (marked with *).';
      orderForm.prepend(err);
      err.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Disable submit button while saving
    const submitBtn = orderForm.querySelector('.submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    const orderId  = 'ORD-' + Date.now();
    const datetime = new Date().toLocaleString('en-NG', {
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit', hour12:true
    });
    const newOrder = {
      id: orderId, name, phone, product,
      quantity: qty, address,
      payment, deliveryDate: date,
      notes, status: 'Pending', datetime
    };

    // ── Save to Firebase (syncs to admin across domains) ──
    try {
      await saveOrderToFirebase(newOrder);
    } catch (err) {
      console.error('Firebase save failed:', err);
      // Fallback: save to localStorage so order isn't lost
      try {
        const existing = JSON.parse(localStorage.getItem('bansek_orders') || '[]');
        existing.push(newOrder);
        localStorage.setItem('bansek_orders', JSON.stringify(existing));
      } catch(_) {}
    }

    // ── User confirmation notification ────────────
    if (window.BansekNotif) {
      window.BansekNotif.push({
        type:     'new_order',
        title:    '✅ Order Placed Successfully!',
        body:     `Your order #${orderId} for ${product} has been received. We'll confirm it shortly.`,
        orderId,
        audience: 'user',
        url:      '/order.html'
      });
    }

    // ── Build WhatsApp message ────────────────────
    let msg = `🛒 *New Order — BANSEK Pure Water*\n\n`;
    msg += `🆔 *Order ID:* ${orderId}\n`;
    msg += `👤 *Name:* ${name}\n`;
    msg += `📞 *Phone:* ${phone}\n`;
    msg += `📦 *Product:* ${product}\n`;
    msg += `🔢 *Quantity:* ${qty} bag(s)\n`;
    msg += `📍 *Delivery Address:* ${address}\n`;
    msg += `💳 *Payment Method:* ${payment}\n`;
    if (date)  msg += `📅 *Preferred Date:* ${date}\n`;
    if (notes) msg += `📝 *Notes:* ${notes}\n`;
    msg += `📅 *Ordered:* ${datetime}\n`;
    msg += `\n_Sent from BANSEK website_`;

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');

    // Re-enable button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Send Order on WhatsApp`;
    }

    const successMsg = document.getElementById('success-msg');
    if (successMsg) {
      successMsg.style.display = 'block';
      orderForm.reset();
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      const hidden = document.getElementById('payment-method');
      if (hidden) hidden.value = '';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// ── Scroll-in animation ──────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll(
  '.product-card, .feature-card, .testimonial-card, .faq-item, .stat-item, .process-step, .about-float-card, .about-float-card2'
).forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(32px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── User notification bell ────────────────────────
function initUserNotifBell() {
  if (!window.BansekNotif) return;
  const bell = document.getElementById('user-notif-bell');
  if (!bell) return;

  function refreshBell() {
    const count = window.BansekNotif.getUnreadCount('user');
    const badge = document.getElementById('user-notif-badge');
    if (badge) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  bell.addEventListener('click', () => {
    const panel = document.getElementById('user-notif-panel');
    if (!panel) return;
    const isOpen = panel.classList.toggle('open');
    if (isOpen) {
      renderUserNotifPanel();
      window.BansekNotif.markAllRead('user');
      refreshBell();
    }
  });

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('user-notif-panel');
    const b     = document.getElementById('user-notif-bell');
    if (panel && !panel.contains(e.target) && b && !b.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  const ch = window.BansekNotif.getChannel();
  if (ch) {
    ch.onmessage = (ev) => {
      if (ev.data.type === 'NEW_NOTIFICATION') {
        refreshBell();
        window.BansekNotif.playSound();
      }
    };
  }

  refreshBell();
}

function renderUserNotifPanel() {
  const panel = document.getElementById('user-notif-panel');
  if (!panel || !window.BansekNotif) return;
  const notifs = window.BansekNotif.getFor('user');

  if (notifs.length === 0) {
    panel.innerHTML = `<div class="unp-header"><span>Notifications</span></div><div class="unp-empty">No notifications yet</div>`;
    return;
  }

  const items = notifs.map(n => `
    <div class="unp-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <div class="unp-icon">${n.type === 'new_order' ? '🛒' : n.type === 'status_update' ? '📦' : '🔔'}</div>
      <div class="unp-body">
        <div class="unp-title">${escHtml(n.title)}</div>
        <div class="unp-text">${escHtml(n.body)}</div>
        <div class="unp-time">${window.BansekNotif.timeAgo(n.timestamp)}</div>
      </div>
      <button class="unp-del" onclick="deleteUserNotif('${n.id}')">×</button>
    </div>`).join('');

  panel.innerHTML = `
    <div class="unp-header">
      <span>Notifications</span>
      <button onclick="clearUserNotifs()">Clear all</button>
    </div>
    <div class="unp-list">${items}</div>`;
}

function deleteUserNotif(id) {
  if (window.BansekNotif) window.BansekNotif.deleteNotification(id);
  renderUserNotifPanel();
}
window.deleteUserNotif = deleteUserNotif;

function clearUserNotifs() {
  if (window.BansekNotif) window.BansekNotif.clearAll('user');
  renderUserNotifPanel();
}
window.clearUserNotifs = clearUserNotifs;

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
