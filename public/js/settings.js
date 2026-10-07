document.addEventListener("DOMContentLoaded", () => {
  const avatarBtn = document.getElementById("avatarBtn");
  const dropdownWrapper = avatarBtn?.closest(".profile-dropdown-wrapper");

  if (avatarBtn && dropdownWrapper) {
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

  const toggle = document.getElementById("themeToggleCheckbox");
  const modeText = document.getElementById("themeModeText");

  function syncThemeState() {
    const isDark = document.documentElement.classList.contains("dark");
    if (toggle) toggle.checked = isDark;
    if (modeText) modeText.textContent = isDark ? "Dark mode" : "Light mode";
  }

  syncThemeState();

  if (toggle) {
    toggle.addEventListener("change", () => {
      if (toggle.checked) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      syncThemeState();
    });
  }

  const savedName = localStorage.getItem("userName");
  const savedEmail = localStorage.getItem("userEmail");
  if (savedName) {
    const nameEl = document.getElementById("displayName");
    if (nameEl) nameEl.textContent = savedName;
  }
  if (savedEmail) {
    const emailEl = document.getElementById("displayEmail");
    if (emailEl) emailEl.textContent = savedEmail;
  }
});
