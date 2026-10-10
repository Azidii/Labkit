document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const alertBox = document.getElementById("alertBox");
  const submitBtn = form?.querySelector(".btn-submit");

  // If redirected after registration, prefill the registered email
  const prefillEmail = sessionStorage.getItem("justRegisteredEmail");
  if (prefillEmail) {
    const emailField = document.getElementById("email");
    if (emailField && !emailField.value) {
      emailField.value = prefillEmail;
    }
    sessionStorage.removeItem("justRegisteredEmail");
  }

  // Restore button if returning via browser Back button (bfcache)
  const defaultBtnHTML = submitBtn ? submitBtn.innerHTML : "";
  window.addEventListener("pageshow", () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      if (defaultBtnHTML) submitBtn.innerHTML = defaultBtnHTML;
    }
  });

  function showAlert(message, type = "error") {
    if (!alertBox) return;
    alertBox.innerHTML = `
      <div class="auth-alert auth-alert--${type}" role="alert">
        <svg class="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${
            type === "error"
              ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
              : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
          }
        </svg>
        <span>${message}</span>
      </div>
    `;
  }

  function clearAlert() {
    if (alertBox) alertBox.innerHTML = "";
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();

      const identifier = (document.getElementById("email")?.value || "").trim();
      const password = document.getElementById("password")?.value;

      if (!identifier || !password) {
        showAlert("Please fill in both fields.");
        return;
      }

      // UI Loading state
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.75";
        submitBtn.innerHTML = `<span>Signing in...</span>`;
      }

      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            email: identifier,
            username: identifier,
            identifier,
            password
          })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();

          if (!response.ok || !data.success) {
            showAlert(data.error || "Invalid credentials.");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.style.opacity = "1";
              submitBtn.innerHTML = originalBtnHTML;
            }
            return;
          }

          // Cache user info in localStorage
          if (data.user) {
            localStorage.setItem("userEmail", data.user.email);
            localStorage.setItem("userName", data.user.username || data.user.firstName);
          }

          // Redirect to intended destination
          window.location.href = data.redirect || "/";
        } else {
          // If server redirected
          if (response.redirected) {
            window.location.href = response.url;
          } else {
            window.location.href = "/";
          }
        }
      } catch (err) {
        console.error("Login fetch error:", err);
        showAlert("Failed to connect to server. Please try again.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = "1";
          submitBtn.innerHTML = originalBtnHTML;
        }
      }
    });
  }
});
