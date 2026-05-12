/* ================================================
   BANSEK Pure Water — Cart Engine
   ================================================ */

const CART_KEY = 'bansek_cart';

const PRODUCTS = [
  { id: '1bag',   name: '1 Bag of Water',   price: 500,   sachets: '20 sachets',  label: '1 Bag – ₦500 (20 sachets)' },
  { id: '5bags',  name: '5 Bags of Water',  price: 2500,  sachets: '100 sachets', label: '5 Bags – ₦2,500 (100 sachets)' },
  { id: '10bags', name: '10 Bags of Water', price: 5000,  sachets: '200 sachets', label: '10 Bags – ₦5,000 (200 sachets)' },
  { id: '20bags', name: '20 Bags of Water', price: 9500,  sachets: '400 sachets', label: '20 Bags – ₦9,500 (400 sachets)' },
  { id: '50bags', name: '50 Bags of Water', price: 22000, sachets: '1,000 sachets', label: '50 Bags – ₦22,000 (1,000 sachets)' },
];

// ── Storage helpers ───────────────────────────────
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ── Add item to cart ──────────────────────────────
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const cart = loadCart();
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  updateCartUI();
  showCartAdded(product.name);
  openCart();
}

// ── Remove item ───────────────────────────────────
function removeFromCart(productId) {
  const cart = loadCart().filter(i => i.id !== productId);
  saveCart(cart);
  updateCartUI();
}

// ── Change quantity ───────────────────────────────
function changeQty(productId, delta) {
  const cart = loadCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  updateCartUI();
}

// ── Clear cart ────────────────────────────────────
function clearCart() {
  saveCart([]);
  updateCartUI();
}

// ── Cart totals ───────────────────────────────────
function getCartTotal() {
  return loadCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getCartCount() {
  return loadCart().reduce((sum, i) => sum + i.qty, 0);
}

// ── Format currency ───────────────────────────────
function fmt(n) {
  return '₦' + n.toLocaleString('en-NG');
}

// ── Update all cart UI elements ───────────────────
function updateCartUI() {
  const cart  = loadCart();
  const count = getCartCount();
  const total = getCartTotal();

  // Badge on cart button
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });

  // Cart drawer items
  const itemsEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '';
    if (emptyEl)  emptyEl.style.display  = 'flex';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (emptyEl)  emptyEl.style.display  = 'none';
  if (footerEl) footerEl.style.display = 'block';

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" id="ci-${item.id}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-sub">${item.sachets} · ${fmt(item.price)} each</div>
      </div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
        <span class="cart-qty-num">${item.qty}</span>
        <button class="cart-qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
      <div class="cart-item-total">${fmt(item.price * item.qty)}</div>
      <button class="cart-item-del" onclick="removeFromCart('${item.id}')" title="Remove">×</button>
    </div>`).join('');

  // Total
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = fmt(total);
}

// ── Open / close cart drawer ──────────────────────
function openCart() {
  const drawer  = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer)  drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  updateCartUI();
}

function closeCart() {
  const drawer  = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer)  drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ── "Added to cart" flash on button ──────────────
function showCartAdded(name) {
  const flash = document.getElementById('cart-flash');
  if (!flash) return;
  flash.textContent = `✅ ${name} added to cart!`;
  flash.classList.add('show');
  setTimeout(() => flash.classList.remove('show'), 2500);
}

// ── Checkout: go to order.html with cart data ─────
function checkout() {
  const cart = loadCart();
  if (cart.length === 0) return;

  // Build a summary string for the product field
  // If single item use its label, else "Multiple items"
  let productLabel, totalQty;
  if (cart.length === 1) {
    productLabel = cart[0].label;
    totalQty     = cart[0].qty;
  } else {
    productLabel = cart.map(i => `${i.name} ×${i.qty}`).join(', ');
    totalQty     = cart.reduce((s, i) => s + i.qty, 0);
  }

  // Store checkout data for order.html to pick up
  localStorage.setItem('bansek_checkout', JSON.stringify({
    productLabel,
    totalQty,
    total: getCartTotal(),
    items: cart
  }));

  window.location.href = 'order.html?from=cart';
}

// ── Expose globally ───────────────────────────────
window.BansekCart = {
  add:    addToCart,
  remove: removeFromCart,
  changeQty,
  clear:  clearCart,
  open:   openCart,
  close:  closeCart,
  checkout,
  loadCart,
  getCartTotal,
  getCartCount,
  updateUI: updateCartUI,
  PRODUCTS,
  fmt
};

// Expose individual functions for inline onclick handlers
window.addToCart    = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty    = changeQty;
window.openCart     = openCart;
window.closeCart    = closeCart;
window.checkout     = checkout;

// Init on load
document.addEventListener('DOMContentLoaded', updateCartUI);
