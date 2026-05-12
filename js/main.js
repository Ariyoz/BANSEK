/* ================================================
   BANSEK Pure Water — main.js
   Orders sent directly to WhatsApp
   ================================================ */

// ── Load notification engine ──────────────────────
// (notifications.js must be loaded before main.js)
document.addEventListener('DOMContentLoaded', () => {
  if (window.BansekNotif) window.BansekNotif.init();
});

// ── UPDATE THIS with the real WhatsApp number ──
// Format: country code + number, no + or spaces
// Nigeria example: 08012345678 → 2348012345678
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

// ── Order form → WhatsApp ────────────────────────
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

  orderForm.addEventListener('submit', function (e) {
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

    // ── Save order to localStorage (feeds the admin dashboard) ──
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
    try {
      const existing = JSON.parse(localStorage.getItem('bansek_orders') || '[]');
      existing.push(newOrder);
      localStorage.setItem('bansek_orders', JSON.stringify(existing));
    } catch(e) { /* storage unavailable */ }

    // ── Push notifications ────────────────────────
    if (window.BansekNotif) {
      // Admin notification: new order arrived
      window.BansekNotif.push({
        type:     'new_order',
        title:    '🛒 New Order Received!',
        body:     `${name} ordered ${product} (×${qty}) — ${payment}`,
        orderId,
        audience: 'admin',
        url:      '/admin/dashboard.html',
        requireInteraction: true
      });

      // User notification: order confirmation
      window.BansekNotif.push({
        type:     'new_order',
        title:    '✅ Order Placed Successfully!',
        body:     `Your order #${orderId} for ${product} has been received. We'll confirm it shortly.`,
        orderId,
        audience: 'user',
        url:      '/order.html'
      });
    }

    // ── Build WhatsApp message ──
    let msg = `🛒 *New Order — BANSEK Pure Water*\n\n`;
    msg += `🆔 *Order ID:* ${orderId}\n`;
    msg += `👤 *Name:* ${name}\n`;
    msg += `📞 *Phone:* ${phone}\n`;
    msg += `📦 *Product:* ${product}\n`;
    msg += `🔢 *Quantity:* ${qty} bag(s)\n`;
    msg += `📍 *Delivery Address:* ${address}\n`;
    msg += `💳 *Payment Method:* ${payment}\n`;
    if (date) msg += `📅 *Preferred Date:* ${date}\n`;
    if (notes) msg += `📝 *Notes:* ${notes}\n`;
    msg += `📅 *Ordered:* ${datetime}\n`;
    msg += `\n_Sent from BANSEK website_`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    const successMsg = document.getElementById('success-msg');
    if (successMsg) {
      successMsg.style.display = 'block';
      orderForm.reset();
      // Reset payment selection
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      const hidden = document.getElementById('payment-method');
      if (hidden) hidden.value = '';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// ── Listen for order status updates (user side) ──
// When admin changes a status, notify the user if they're on the site
window.addEventListener('storage', function(e) {
  if (e.key !== 'bansek_orders' || !window.BansekNotif) return;
  try {
    const newOrders  = JSON.parse(e.newValue || '[]');
    const oldOrders  = JSON.parse(e.oldValue || '[]');
    const oldMap     = {};
    oldOrders.forEach(o => { oldMap[o.id] = o.status; });

    newOrders.forEach(order => {
      const prevStatus = oldMap[order.id];
      if (prevStatus && prevStatus !== order.status) {
        const statusEmoji = {
          Confirmed: '✅', Delivered: '🚚', Cancelled: '❌', Pending: '⏳'
        }[order.status] || '📦';

        window.BansekNotif.push({
          type:     'status_update',
          title:    `${statusEmoji} Order ${order.status}`,
          body:     `Your order #${order.id} (${order.product}) is now ${order.status}.`,
          orderId:  order.id,
          audience: 'user',
          url:      '/order.html'
        });

        // Show in-page user notification banner if element exists
        showUserStatusBanner(order);
      }
    });
  } catch (_) {}
});

// ── In-page status update banner for users ────────
function showUserStatusBanner(order) {
  let banner = document.getElementById('bansek-status-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'bansek-status-banner';
    banner.style.cssText = [
      'position:fixed', 'top:80px', 'right:20px', 'z-index:9999',
      'background:#0f172a', 'color:#fff', 'padding:16px 20px',
      'border-radius:14px', 'max-width:320px', 'box-shadow:0 8px 32px rgba(0,0,0,.35)',
      'font-family:Poppins,sans-serif', 'font-size:.85rem', 'line-height:1.5',
      'border-left:4px solid #22c55e', 'transform:translateX(360px)',
      'transition:transform .35s cubic-bezier(.4,0,.2,1)'
    ].join(';');
    document.body.appendChild(banner);
  }
  const statusColor = { Confirmed:'#22c55e', Delivered:'#3b82f6', Cancelled:'#ef4444', Pending:'#f59e0b' };
  banner.style.borderLeftColor = statusColor[order.status] || '#22c55e';
  banner.innerHTML = `
    <div style="font-weight:700;margin-bottom:4px">Order Status Updated</div>
    <div>Your order <strong>#${order.id}</strong> is now <strong>${order.status}</strong>.</div>
    <div style="margin-top:4px;color:#94a3b8;font-size:.78rem">${order.product}</div>
    <button onclick="this.parentElement.style.transform='translateX(360px)'"
      style="position:absolute;top:10px;right:12px;background:none;border:none;color:#94a3b8;font-size:1.1rem;cursor:pointer">×</button>
  `;
  setTimeout(() => { banner.style.transform = 'translateX(0)'; }, 50);
  setTimeout(() => { banner.style.transform = 'translateX(360px)'; }, 6000);
}

// ── User notification bell (for order.html / any page) ──
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

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('user-notif-panel');
    const bell  = document.getElementById('user-notif-bell');
    if (panel && !panel.contains(e.target) && !bell.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  // Listen for new notifications from other tabs
  const ch = window.BansekNotif.getChannel();
  if (ch) {
    ch.onmessage = (e) => {
      if (e.data.type === 'NEW_NOTIFICATION') {
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
    panel.innerHTML = `
      <div class="unp-header"><span>Notifications</span></div>
      <div class="unp-empty">No notifications yet</div>`;
    return;
  }

  const items = notifs.map(n => `
    <div class="unp-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <div class="unp-icon">${n.type === 'new_order' ? '🛒' : n.type === 'status_update' ? '📦' : '🔔'}</div>
      <div class="unp-body">
        <div class="unp-title">${escHtmlUser(n.title)}</div>
        <div class="unp-text">${escHtmlUser(n.body)}</div>
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

function clearUserNotifs() {
  if (window.BansekNotif) window.BansekNotif.clearAll('user');
  renderUserNotifPanel();
}

function escHtmlUser(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init bell on page load
document.addEventListener('DOMContentLoaded', initUserNotifBell);

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
