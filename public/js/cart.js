/* ═══════════════════════════════════════════════════════════════
   ShopZone — cart.js
   localStorage cart: add · remove · qty · total · render
   ═══════════════════════════════════════════════════════════════ */

const CART_KEY = 'shopzone_cart';

/* ── Core helpers ───────────────────────────────────────────── */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  if (window.updateCartBadge) updateCartBadge();
}

function getCount() {
  return getCart().reduce((s, i) => s + (i.qty || 1), 0);
}

function getSubtotal() {
  return getCart().reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
}

function addToCart(product) {
  /* product: { id, name, price, image, brand, category } */
  const cart = getCart();
  const idx  = cart.findIndex(i => i.id === product.id);
  if (idx > -1) {
    cart[idx].qty = (cart[idx].qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  if (window.showToast) showToast(`${product.name.slice(0,28)}… added to cart`, '🛒');
  return cart;
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

function updateQty(id, delta) {
  const cart = getCart();
  const idx  = cart.findIndex(i => i.id === id);
  if (idx === -1) return;
  cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + delta);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  if (window.updateCartBadge) updateCartBadge();
}

/* ── Format price (PKR) ─────────────────────────────────────── */
function fmtPrice(p) {
  return 'PKR ' + Number(p).toLocaleString('en-PK');
}

/* ── Render cart page ───────────────────────────────────────── */
function renderCart() {
  const container = document.getElementById('cart-items-container');
  const emptyEl   = document.getElementById('cart-empty');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl    = document.getElementById('cart-total');
  const shippingEl = document.getElementById('cart-shipping');
  const countEl    = document.getElementById('cart-item-count');
  const checkoutBtn = document.getElementById('cart-checkout-btn');

  if (!container) return;

  const cart = getCart();

  /* empty state */
  if (cart.length === 0) {
    container.innerHTML = '';
    if (emptyEl)   emptyEl.style.display = 'block';
    if (subtotalEl) subtotalEl.textContent = fmtPrice(0);
    if (totalEl)   totalEl.textContent = fmtPrice(0);
    if (shippingEl) shippingEl.textContent = fmtPrice(0);
    if (countEl)   countEl.textContent = '0 items';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (checkoutBtn) checkoutBtn.disabled = false;

  /* build rows */
  container.innerHTML = cart.map(item => {
    const lineTotal = item.price * (item.qty || 1);
    const imgHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}" class="cart-item-image">`
      : `<div class="cart-item-img-placeholder">📦</div>`;
    return `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-product">
        ${imgHtml}
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-brand">${item.brand || item.category || ''}</div>
        </div>
      </div>
      <div class="cart-item-price">${fmtPrice(item.price)}</div>
      <div class="cart-qty-controls">
        <button class="cart-qty-btn" onclick="cartQty('${item.id}', -1)">−</button>
        <span class="cart-qty-value">${item.qty || 1}</span>
        <button class="cart-qty-btn" onclick="cartQty('${item.id}', 1)">+</button>
      </div>
      <div class="cart-item-total">${fmtPrice(lineTotal)}</div>
      <button class="cart-remove" onclick="cartRemove('${item.id}')" title="Remove">✕</button>
    </div>`;
  }).join('');

  /* totals */
  const sub      = getSubtotal();
  const shipping = sub >= 5000 ? 0 : 299;
  const total    = sub + shipping;

  if (subtotalEl) subtotalEl.textContent = fmtPrice(sub);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : fmtPrice(shipping);
  if (totalEl)   totalEl.textContent = fmtPrice(total);
  if (countEl)   countEl.textContent = cart.length + (cart.length === 1 ? ' item' : ' items');
}

/* ── Inline action handlers (called from onclick) ───────────── */
function cartQty(id, delta) {
  updateQty(id, delta);
  renderCart();
}

function cartRemove(id) {
  removeFromCart(id);
  renderCart();
}

/* ── "Add to Cart" buttons on product pages ─────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* render if cart page */
  renderCart();

  /* bind all [data-add-to-cart] buttons */
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const el = e.currentTarget;
      addToCart({
        id:       el.dataset.id,
        name:     el.dataset.name,
        price:    Number(el.dataset.price),
        image:    el.dataset.image || '',
        brand:    el.dataset.brand || '',
        category: el.dataset.category || ''
      });

      /* brief button feedback */
      const orig = el.innerHTML;
      el.innerHTML = '✓ Added!';
      el.style.background = '#2a9d8f';
      setTimeout(() => {
        el.innerHTML = orig;
        el.style.background = '';
      }, 1200);
    });
  });

  /* checkout button */
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      const cart = getCart();
      if (!cart.length) return;

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processing…';

      try {
        const res = await fetch('/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart })
        });

        if (res.status === 401 || res.redirected) {
          window.location.href = '/login';
          return;
        }

        const data = await res.json();
        if (data.success) {
          clearCart();
          window.location.href = '/order-success?id=' + data.orderId;
        } else {
          alert(data.message || 'Checkout failed. Please try again.');
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = 'Proceed to Checkout';
        }
      } catch(err) {
        alert('Something went wrong. Please try again.');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Proceed to Checkout';
      }
    });
  }
});

/* expose for inline onclick */
window.cartQty    = cartQty;
window.cartRemove = cartRemove;
window.addToCart  = addToCart;
