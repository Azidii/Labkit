document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const alertBox = document.getElementById("alertBox");
  const submitBtn = form?.querySelector(".btn-submit");

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

      const firstName = document.getElementById("firstName")?.value.trim();
      const lastName = document.getElementById("lastName")?.value.trim();
      const username = document.getElementById("username")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value;
      const confirmPassword = document.getElementById("confirmPassword")?.value;

      if (!firstName || !lastName || !username || !email || !password) {
        showAlert("All fields are required.");
        return;
      }

      if (password !== confirmPassword) {
        showAlert("Passwords do not match.");
        return;
      }

      if (password.length < 6) {
        showAlert("Password must be at least 6 characters.");
        return;
      }

      // UI Loading state
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.75";
        submitBtn.innerHTML = `<span>Creating account...</span>`;
      }

      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            firstName,
            lastName,
            username,
            email,
            password,
            confirmPassword
          })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();

          if (!response.ok || !data.success) {
            showAlert(data.error || "Failed to create account.");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.style.opacity = "1";
              submitBtn.innerHTML = originalBtnHTML;
            }
            return;
          }

          // Store registered email temporarily to prefill login form
          if (data.email) {
            sessionStorage.setItem("justRegisteredEmail", data.email);
          }

          // Redirect to success screen
          window.location.href = data.redirect || "/success?type=register";
        } else {
          // If server responded with a standard redirect
          if (response.redirected) {
            window.location.href = response.url;
          } else {
            window.location.href = "/";
          }
        }
      } catch (err) {
        console.error("Register fetch error:", err);
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
