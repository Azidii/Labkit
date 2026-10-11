document.addEventListener("DOMContentLoaded", () => {
  const adminNavLink = document.querySelector('.navbar__link[href="/admin"]');
  const keepAdminNavActive = () => {
    if (adminNavLink) adminNavLink.classList.add("navbar__link--active");
  };

  keepAdminNavActive();
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".navbar__link")) keepAdminNavActive();
  }, true);

  const avatarBtn = document.getElementById("avatarBtn");
  const dropdownWrapper = avatarBtn?.closest(".profile-dropdown-wrapper");
  avatarBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = dropdownWrapper.classList.toggle("is-open");
    avatarBtn.setAttribute("aria-expanded", String(isOpen));
  });
  document.addEventListener("click", (event) => {
    if (dropdownWrapper && !dropdownWrapper.contains(event.target)) {
      dropdownWrapper.classList.remove("is-open");
      avatarBtn.setAttribute("aria-expanded", "false");
    }
  });

  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  function selectTab(name) {
    tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === name));
    panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
    document.querySelector(".tabs")?.classList.toggle("accounts-active", name === "accounts");
  }
  selectTab(requestedTab === "accounts" ? "accounts" : "products");
  tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab.dataset.tab)));

  document.getElementById("focusBundleForm")?.addEventListener("click", () => {
    document.getElementById("bundleForm")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("bundleName")?.focus();
  });

  const name = document.getElementById("bundleName");
  const slug = document.getElementById("bundleSlug");
  const tagline = document.getElementById("bundleTagline");
  const image = document.getElementById("bundleImage");
  const description = document.getElementById("bundleDescription");
  const price = document.getElementById("bundlePrice");
  const previewImage = document.getElementById("previewImage");
  const syncPreview = () => {
    document.getElementById("previewName").textContent = name?.value || "Bundle name";
    document.getElementById("previewTagline").textContent = tagline?.value || "A short, punchy tagline appears here.";
    document.getElementById("previewPrice").textContent = `₱${Number(price?.value || 0).toFixed(2)}`;
    if (slug) slug.value = (name?.value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (image?.value) previewImage.innerHTML = `<img src="${image.value}" alt="Bundle preview">`;
    else previewImage.innerHTML = "<span>▧</span>";
  };
  [name, tagline, image, description, price].forEach((field) => field?.addEventListener("input", syncPreview));

  document.getElementById("adminPasswordForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/settings/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    alert(data.message || data.error || "Password update failed.");
    if (data.success) event.currentTarget.reset();
  });
  syncPreview();
});
