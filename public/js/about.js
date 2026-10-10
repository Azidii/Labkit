/**
 * LabKit Market — About / How It Works page scripts
 */

document.addEventListener("DOMContentLoaded", () => {
  initProfileDropdown();
  initVaultTabs();
  initFaqAccordion();
  initCartDrawer();
});

/**
 * Initializes avatar profile menu dropdown toggle and outside-click dismiss
 */
function initProfileDropdown() {
  const avatarBtn = document.getElementById("avatarBtn");
  const dropdownWrapper = avatarBtn?.closest(".profile-dropdown-wrapper");

  if (!avatarBtn || !dropdownWrapper) return;

  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdownWrapper.classList.toggle("is-open");
    avatarBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!dropdownWrapper.contains(e.target)) {
      dropdownWrapper.classList.remove("is-open");
      avatarBtn.setAttribute("aria-expanded", "false");
    }
  });
}

/**
 * Handles tab switching in the interactive download vault demo
 */
function initVaultTabs() {
  const tabButtons = document.querySelectorAll(".demo-tab-btn");
  if (!tabButtons.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const targetId = btn.getAttribute("data-target");
      document.querySelectorAll(".vault-tab-pane").forEach((pane) => {
        pane.classList.toggle("is-active", pane.id === targetId);
      });
    });
  });
}

/**
 * Handles interactive accordion toggle for FAQ items
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector(".faq-question");
    if (!questionBtn) return;

    questionBtn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // Close all other items
      faqItems.forEach((other) => other.classList.remove("is-open"));

      // Toggle current item
      if (!isOpen) {
        item.classList.add("is-open");
      }
    });
  });
}

/**
 * Wires up opening and closing triggers for the shopping cart drawer
 */
function initCartDrawer() {
  const openBtn = document.getElementById("openCartBtn");
  const closeBtn = document.getElementById("closeCartBtn");
  const backdrop = document.getElementById("cartBackdrop");

  if (typeof openCart === "function" && openBtn) {
    openBtn.addEventListener("click", openCart);
  }
  if (typeof closeCart === "function") {
    closeBtn?.addEventListener("click", closeCart);
    backdrop?.addEventListener("click", closeCart);
  }
}
