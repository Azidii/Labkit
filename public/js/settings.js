document.addEventListener("DOMContentLoaded", () => {
  // Profile dropdown toggle
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

  // Dark mode appearance toggle
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
      const isAuth = document.documentElement.getAttribute("data-auth") === "true" || !!localStorage.getItem("userEmail");
      if (!isAuth) {
        alert("Dark mode is only available for logged-in accounts. Please sign in to enable dark mode.");
        toggle.checked = false;
        document.documentElement.classList.remove("dark");
        localStorage.removeItem("theme");
        syncThemeState();
        return;
      }

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

  // Toast notification helper
  const toastContainer = document.getElementById("settingsToast");
  function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `settings-toast settings-toast--${type}`;
    toast.innerHTML = `
      <svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${
          type === "success"
            ? '<polyline points="20 6 9 17 4 12"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
        }
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("is-visible");
    }, 10);
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Helper for inline modal alerts
  function showModalAlert(boxId, message, type = "error") {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = `
      <div class="modal-alert modal-alert--${type}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${
            type === "error"
              ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
              : '<polyline points="20 6 9 17 4 12"/>'
          }
        </svg>
        <span>${message}</span>
      </div>
    `;
  }

  function clearModalAlert(boxId) {
    const box = document.getElementById(boxId);
    if (box) box.innerHTML = "";
  }

  // Modal open/close helpers
  function openModal(backdrop) {
    if (!backdrop) return;
    backdrop.classList.remove("is-hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal(backdrop, alertBoxId) {
    if (!backdrop) return;
    backdrop.classList.add("is-hidden");
    document.body.style.overflow = "";
    if (alertBoxId) clearModalAlert(alertBoxId);
  }

  // --- USERNAME MODAL ---
  const usernameModalBackdrop = document.getElementById("usernameModalBackdrop");
  const openUsernameModalBtn = document.getElementById("openUsernameModalBtn");
  const closeUsernameModalBtn = document.getElementById("closeUsernameModalBtn");
  const cancelUsernameBtn = document.getElementById("cancelUsernameBtn");
  const usernameForm = document.getElementById("usernameForm");
  const usernameInput = document.getElementById("usernameInput");
  const displayUsername = document.getElementById("displayUsername");
  const usernameBtnText = document.getElementById("usernameBtnText");
  const usernameModalTitle = document.getElementById("usernameModalTitle");
  const saveUsernameBtn = document.getElementById("saveUsernameBtn");

  if (openUsernameModalBtn) {
    openUsernameModalBtn.addEventListener("click", () => {
      openModal(usernameModalBackdrop);
      clearModalAlert("usernameAlertBox");
      setTimeout(() => usernameInput?.focus(), 100);
    });
  }

  if (closeUsernameModalBtn) {
    closeUsernameModalBtn.addEventListener("click", () => {
      closeModal(usernameModalBackdrop, "usernameAlertBox");
    });
  }

  if (cancelUsernameBtn) {
    cancelUsernameBtn.addEventListener("click", () => {
      closeModal(usernameModalBackdrop, "usernameAlertBox");
    });
  }

  if (usernameModalBackdrop) {
    usernameModalBackdrop.addEventListener("click", (e) => {
      if (e.target === usernameModalBackdrop) {
        closeModal(usernameModalBackdrop, "usernameAlertBox");
      }
    });
  }

  if (usernameForm) {
    usernameForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearModalAlert("usernameAlertBox");

      const username = usernameInput?.value.trim();
      if (!username) {
        showModalAlert("usernameAlertBox", "Please enter a username.");
        return;
      }

      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        showModalAlert(
          "usernameAlertBox",
          "Username must be 3-30 characters (letters, numbers, and underscores only)."
        );
        return;
      }

      const origBtnText = saveUsernameBtn?.textContent;
      if (saveUsernameBtn) {
        saveUsernameBtn.disabled = true;
        saveUsernameBtn.textContent = "Saving...";
      }

      try {
        const response = await fetch("/settings/username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          showModalAlert("usernameAlertBox", data.error || "Failed to update username.");
          if (saveUsernameBtn) {
            saveUsernameBtn.disabled = false;
            saveUsernameBtn.textContent = origBtnText;
          }
          return;
        }

        // Update UI
        if (displayUsername) displayUsername.textContent = `@${data.username}`;
        if (usernameBtnText) usernameBtnText.textContent = "Edit";
        if (usernameModalTitle) usernameModalTitle.textContent = "Edit Username";
        localStorage.setItem("userName", data.username);

        closeModal(usernameModalBackdrop, "usernameAlertBox");
        showToast("Username updated successfully!");
      } catch (err) {
        console.error("Save username error:", err);
        showModalAlert("usernameAlertBox", "Network error. Please try again.");
      } finally {
        if (saveUsernameBtn) {
          saveUsernameBtn.disabled = false;
          saveUsernameBtn.textContent = origBtnText;
        }
      }
    });
  }

  // --- CHANGE PASSWORD MODAL ---
  const passwordModalBackdrop = document.getElementById("passwordModalBackdrop");
  const openPasswordModalBtn = document.getElementById("openPasswordModalBtn");
  const closePasswordModalBtn = document.getElementById("closePasswordModalBtn");
  const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
  const passwordForm = document.getElementById("passwordForm");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const savePasswordBtn = document.getElementById("savePasswordBtn");

  if (openPasswordModalBtn) {
    openPasswordModalBtn.addEventListener("click", () => {
      openModal(passwordModalBackdrop);
      clearModalAlert("passwordAlertBox");
      if (currentPasswordInput) currentPasswordInput.value = "";
      if (newPasswordInput) newPasswordInput.value = "";
      if (confirmPasswordInput) confirmPasswordInput.value = "";
      setTimeout(() => (currentPasswordInput || newPasswordInput)?.focus(), 100);
    });
  }

  if (closePasswordModalBtn) {
    closePasswordModalBtn.addEventListener("click", () => {
      closeModal(passwordModalBackdrop, "passwordAlertBox");
    });
  }

  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener("click", () => {
      closeModal(passwordModalBackdrop, "passwordAlertBox");
    });
  }

  if (passwordModalBackdrop) {
    passwordModalBackdrop.addEventListener("click", (e) => {
      if (e.target === passwordModalBackdrop) {
        closeModal(passwordModalBackdrop, "passwordAlertBox");
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearModalAlert("passwordAlertBox");

      const currentPassword = currentPasswordInput ? currentPasswordInput.value : undefined;
      const newPassword = newPasswordInput?.value;
      const confirmPassword = confirmPasswordInput?.value;

      if (currentPasswordInput && !currentPassword) {
        showModalAlert("passwordAlertBox", "Please enter your current password.");
        currentPasswordInput.focus();
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        showModalAlert("passwordAlertBox", "New password must be at least 6 characters.");
        newPasswordInput?.focus();
        return;
      }

      if (newPassword !== confirmPassword) {
        showModalAlert("passwordAlertBox", "New passwords do not match.");
        confirmPasswordInput?.focus();
        return;
      }

      const origBtnText = savePasswordBtn?.textContent;
      if (savePasswordBtn) {
        savePasswordBtn.disabled = true;
        savePasswordBtn.textContent = "Updating...";
      }

      try {
        const response = await fetch("/settings/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          showModalAlert("passwordAlertBox", data.error || "Failed to update password.");
          if (savePasswordBtn) {
            savePasswordBtn.disabled = false;
            savePasswordBtn.textContent = origBtnText;
          }
          return;
        }

        closeModal(passwordModalBackdrop, "passwordAlertBox");
        showToast("Password changed successfully!");
      } catch (err) {
        console.error("Change password error:", err);
        showModalAlert("passwordAlertBox", "Network error. Please try again.");
      } finally {
        if (savePasswordBtn) {
          savePasswordBtn.disabled = false;
          savePasswordBtn.textContent = origBtnText;
        }
      }
    });
  }

  // Close modals on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (usernameModalBackdrop && !usernameModalBackdrop.classList.contains("is-hidden")) {
        closeModal(usernameModalBackdrop, "usernameAlertBox");
      }
      if (passwordModalBackdrop && !passwordModalBackdrop.classList.contains("is-hidden")) {
        closeModal(passwordModalBackdrop, "passwordAlertBox");
      }
    }
  });

  // Sync saved name/email
  const savedName = localStorage.getItem("userName");
  const savedEmail = localStorage.getItem("userEmail");
  if (savedName) {
    const nameEl = document.getElementById("displayName");
    if (nameEl && !nameEl.textContent.trim()) nameEl.textContent = savedName;
  }
  if (savedEmail) {
    const emailEl = document.getElementById("displayEmail");
    if (emailEl && !emailEl.textContent.trim()) emailEl.textContent = savedEmail;
  }
});
