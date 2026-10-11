function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  }).format(Number(amount) || 0);
}

function getCart() {
  if (!isAuthenticated()) {
    return [];
  }
  try {
    const raw = localStorage.getItem("circuitCart");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function getSelectedCartIds(cart = getCart()) {
  const availableIds = new Set(cart.map((item) => String(item.id)));
  try {
    const raw = localStorage.getItem("circuitCartSelected");
    if (!raw) return new Set(availableIds);
    const storedIds = JSON.parse(raw);
    if (!Array.isArray(storedIds)) return new Set(availableIds);
    return new Set(storedIds.map(String).filter((id) => availableIds.has(id)));
  } catch (error) {
    console.error("Unable to load selected cart items:", error);
    return new Set(availableIds);
  }
}

function saveSelectedCartIds(selectedIds) {
  localStorage.setItem("circuitCartSelected", JSON.stringify([...selectedIds]));
}

function toggleCartItemSelection(id, checked) {
  const selectedIds = getSelectedCartIds();
  if (checked) selectedIds.add(String(id));
  else selectedIds.delete(String(id));
  saveSelectedCartIds(selectedIds);
  renderCart();
}

function getSelectedCart() {
  const cart = getCart();
  const selectedIds = getSelectedCartIds(cart);
  return cart.filter((item) => selectedIds.has(String(item.id)));
}

function saveCart(cart) {
  if (!isAuthenticated()) {
    try {
      localStorage.removeItem("circuitCart");
    } catch (e) {}
    return;
  }
  localStorage.setItem("circuitCart", JSON.stringify(cart));
  renderCart();
}

function isAuthenticated() {
  const attr = document.documentElement.getAttribute("data-auth");
  return attr === "true";
}

function requireAuthentication() {
  if (isAuthenticated()) return true;

  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?error=${encodeURIComponent("Please log in to add items to your cart.")}&returnTo=${encodeURIComponent(returnTo)}`;
  return false;
}

function addToCart(id, name, price, img, maxPurchaseQuantity) {
  if (!isAuthenticated()) {
    requireAuthentication();
    return;
  }

  const cart = getCart();
  const existing = cart.find((item) => String(item.id) === String(id));
  if (existing) {
    const limit = Number(existing.maxPurchaseQuantity || maxPurchaseQuantity || 10);
    if (existing.qty < limit) existing.qty += 1;
  } else {
    getSelectedCartIds(cart).add(String(id));
    saveSelectedCartIds(getSelectedCartIds(cart));
    cart.push({
      id: String(id),
      name,
      price: Number(price),
      qty: 1,
      img: img || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
      maxPurchaseQuantity: Number(maxPurchaseQuantity) || 10
    });
  }
  saveCart(cart);
  openCart();
}

function updateCartQty(id, delta) {
  if (!isAuthenticated()) {
    requireAuthentication();
    return;
  }

  let cart = getCart();
  const item = cart.find((i) => String(i.id) === String(id));
  if (!item) return;
  const limit = Number(item.maxPurchaseQuantity) || 10;
  item.qty = Math.min(limit, item.qty + delta);
  if (item.qty <= 0) {
    cart = cart.filter((i) => String(i.id) !== String(id));
    const selectedIds = getSelectedCartIds(cart);
    selectedIds.delete(String(id));
    saveSelectedCartIds(selectedIds);
  }
  saveCart(cart);
}

function removeCartItem(id) {
  if (!isAuthenticated()) {
    requireAuthentication();
    return;
  }

  let cart = getCart();
  cart = cart.filter((i) => String(i.id) !== String(id));
  const selectedIds = getSelectedCartIds(cart);
  selectedIds.delete(String(id));
  saveSelectedCartIds(selectedIds);
  saveCart(cart);
}

function openCart() {
  if (!isAuthenticated()) {
    requireAuthentication();
    return;
  }
  ensureCartDrawerDom();
  document.getElementById("cartDrawer")?.classList.add("is-open");
  document.getElementById("cartBackdrop")?.classList.add("is-open");
}

function closeCart() {
  document.getElementById("cartDrawer")?.classList.remove("is-open");
  document.getElementById("cartBackdrop")?.classList.remove("is-open");
}

function ensureCartDrawerDom() {
  if (document.getElementById("cartDrawer")) return;

  const backdrop = document.createElement("div");
  backdrop.className = "cart-drawer-backdrop";
  backdrop.id = "cartBackdrop";

  const drawer = document.createElement("aside");
  drawer.className = "cart-drawer";
  drawer.id = "cartDrawer";
  drawer.setAttribute("aria-label", "Shopping Cart");
  drawer.innerHTML = `
    <div class="cart-drawer__header">
      <div class="cart-drawer__title-wrap">
        <svg class="cart-drawer__bag-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <h2>Your Cart</h2>
      </div>
      <button type="button" class="cart-drawer__close" id="closeCartBtn" aria-label="Close cart">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="cart-drawer__body" id="cartDrawerBody"></div>
    <div class="cart-drawer__footer" id="cartDrawerFooter">
      <div class="cart-drawer__subtotal">
        <span>Subtotal</span>
        <strong id="cartSubtotal">₱0.00</strong>
      </div>
      <div class="cart-drawer__notice">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M7 8h10"/>
          <path d="M7 12h10"/>
          <path d="M7 16h6"/>
        </svg>
        <span>Every bundle unlocks instant digital assets at checkout.</span>
      </div>
      <a href="/checkout" class="btn-checkout" id="checkoutBtn">
        Checkout · <span id="checkoutTotal">₱0.00</span>
      </a>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  document.getElementById("closeCartBtn")?.addEventListener("click", closeCart);
  backdrop.addEventListener("click", closeCart);
}

function renderCart() {
  if (!isAuthenticated()) {
    try {
      localStorage.removeItem("circuitCart");
    } catch (e) {}
    document.querySelectorAll("#cartBadge, .navbar__cart-badge").forEach((badge) => {
      badge.textContent = "0";
      badge.style.display = "none";
    });
    return;
  }

  ensureCartDrawerDom();

  const cart = getCart();
  const selectedCart = getSelectedCart();
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = selectedCart.reduce((sum, item) => sum + item.price * item.qty, 0);

  document.querySelectorAll("#cartBadge, .navbar__cart-badge").forEach((badge) => {
    badge.textContent = String(totalCount);
    badge.style.display = totalCount > 0 ? "inline-flex" : "none";
  });

  const bodyEl = document.getElementById("cartDrawerBody");
  const footerEl = document.getElementById("cartDrawerFooter");
  const subtotalEl = document.getElementById("cartSubtotal");
  const checkoutTotalEl = document.getElementById("checkoutTotal");

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (checkoutTotalEl) checkoutTotalEl.textContent = formatCurrency(subtotal);
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.classList.toggle("is-disabled", selectedCart.length === 0);
    checkoutBtn.setAttribute("aria-disabled", String(selectedCart.length === 0));
  }

  if (!bodyEl) return;

  if (cart.length === 0) {
    if (footerEl) footerEl.style.display = "none";
    bodyEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h3 class="cart-empty__title">Your cart is empty</h3>
        <p class="cart-empty__desc">Browse project-ready bundles — each one includes instant digital assets.</p>
        <a href="/shop" class="btn-explore-bundles" id="exploreBundlesBtn">Explore</a>
      </div>
    `;
    document.getElementById("exploreBundlesBtn")?.addEventListener("click", () => {
      closeCart();
    });
  } else {
    if (footerEl) footerEl.style.display = "flex";
    bodyEl.innerHTML = `
      <div class="cart-items" id="cartItemsList">
        ${cart
          .map(
            (item) => `
          <div class="cart-item-card" data-id="${item.id}">
              <label class="cart-item-select" title="Select item for checkout">
                <input type="checkbox" ${getSelectedCartIds(cart).has(String(item.id)) ? "checked" : ""}
                  onchange="toggleCartItemSelection('${item.id}', this.checked)" aria-label="Select ${item.name} for checkout" />
                <span aria-hidden="true"></span>
              </label>
              <img src="${item.img}" alt="${item.name}" class="cart-item-card__img" />
            <div class="cart-item-card__content">
              <div class="cart-item-card__top">
                <h4 class="cart-item-card__title">${item.name}</h4>
                <div class="cart-item-card__price">${formatCurrency(item.price)}</div>
              </div>
              <div class="cart-item-card__bottom">
                <div class="cart-qty-control">
                  <button type="button" class="cart-qty-btn" onclick="updateCartQty('${item.id}', -1)" aria-label="Decrease quantity">−</button>
                  <span class="cart-qty-num">${item.qty}</span>
                  <button type="button" class="cart-qty-btn" onclick="updateCartQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" class="cart-item-delete" onclick="removeCartItem('${item.id}')" aria-label="Remove item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }
}

// Global capture-phase click listener: guarantees guests are immediately intercepted and redirected to login
document.addEventListener(
  "click",
  (event) => {
    const addBtn = event.target.closest(".product-card__add-btn, .js-add-to-cart, [data-add-to-cart]");
    if (addBtn) {
      if (!isAuthenticated()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        requireAuthentication();
        return false;
      }
      // If authenticated and button has dataset values, trigger addToCart
      const { id, name, price, img, max } = addBtn.dataset;
      if (id && name && price) {
        event.preventDefault();
        addToCart(id, name, Number(price), img, Number(max) || 10);
      }
    }

    const openCartTrigger = event.target.closest("#openCartBtn, .navbar__cart, [data-open-cart]");
    if (openCartTrigger) {
      if (!isAuthenticated()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        requireAuthentication();
        return false;
      }
      event.preventDefault();
      openCart();
    }

    const checkoutBtn = event.target.closest("#checkoutBtn");
    if (checkoutBtn) {
      if (getSelectedCart().length === 0) {
        event.preventDefault();
        event.stopPropagation();
        checkoutBtn.classList.add("is-disabled");
        return false;
      }
      if (!isAuthenticated()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        requireAuthentication();
        return false;
      }
    }
  },
  true // true = capture phase
);

window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.removeCartItem = removeCartItem;
window.toggleCartItemSelection = toggleCartItemSelection;
window.openCart = openCart;
window.closeCart = closeCart;
window.getCart = getCart;
window.isAuthenticated = isAuthenticated;
window.requireAuthentication = requireAuthentication;
window.getSelectedCart = getSelectedCart;
window.getSelectedCartIds = getSelectedCartIds;
window.saveSelectedCartIds = saveSelectedCartIds;

document.addEventListener("DOMContentLoaded", () => {
  if (!isAuthenticated()) {
    try {
      localStorage.removeItem("circuitCart");
    } catch (e) {}
    document.querySelectorAll("#cartBadge, .navbar__cart-badge").forEach((badge) => {
      badge.textContent = "0";
      badge.style.display = "none";
    });
  } else {
    renderCart();
  }

  document.getElementById("closeCartBtn")?.addEventListener("click", closeCart);
  document.getElementById("cartBackdrop")?.addEventListener("click", closeCart);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });
});
