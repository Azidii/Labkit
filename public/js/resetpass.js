document.addEventListener("DOMContentLoaded", () => {
  const step1Form = document.getElementById("step1Form");
  const step2Form = document.getElementById("step2Form");
  const alertBox = document.getElementById("alertBox");

  const emailInput = document.getElementById("email");
  const otpInput = document.getElementById("otpCode");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const resetPasswordBtn = document.getElementById("resetPasswordBtn");
  const resendOtpBtn = document.getElementById("resendOtpBtn");
  const countdownBadge = document.getElementById("countdownBadge");
  const changeEmailBtn = document.getElementById("changeEmailBtn");

  const resetTitle = document.getElementById("resetTitle");
  const resetSubtitle = document.getElementById("resetSubtitle");
  const displayTargetEmail = document.getElementById("displayTargetEmail");

  let activeEmail = "";
  let resendTimer = null;
  let countdownSeconds = 60;

  // Restore buttons if returning via browser Back button (bfcache)
  window.addEventListener("pageshow", () => {
    if (sendOtpBtn) {
      sendOtpBtn.disabled = false;
      sendOtpBtn.style.opacity = "1";
    }
    if (resetPasswordBtn) {
      resetPasswordBtn.disabled = false;
      resetPasswordBtn.style.opacity = "1";
    }
  });

  // Helper to show alert notifications
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

  // Cooldown countdown timer for resending OTP
  function startResendCooldown() {
    if (resendTimer) clearInterval(resendTimer);
    countdownSeconds = 60;

    resendOtpBtn.disabled = true;
    resendOtpBtn.classList.add("is-disabled");
    countdownBadge.classList.remove("is-hidden");
    countdownBadge.textContent = `${countdownSeconds}s`;

    resendTimer = setInterval(() => {
      countdownSeconds--;
      if (countdownSeconds <= 0) {
        clearInterval(resendTimer);
        resendOtpBtn.disabled = false;
        resendOtpBtn.classList.remove("is-disabled");
        countdownBadge.classList.add("is-hidden");
      } else {
        countdownBadge.textContent = `${countdownSeconds}s`;
      }
    }, 1000);
  }

  // Switch to Step 2
  function showStep2(email) {
    activeEmail = email;
    clearAlert();

    step1Form.classList.add("is-hidden");
    step2Form.classList.remove("is-hidden");

    displayTargetEmail.textContent = email;
    resetTitle.textContent = "Verify & change password";
    resetSubtitle.textContent = "Enter the 6-digit code sent to your email along with your new password.";

    otpInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";

    startResendCooldown();
    setTimeout(() => otpInput.focus(), 150);
  }

  // Switch back to Step 1
  function showStep1() {
    clearAlert();
    if (resendTimer) clearInterval(resendTimer);

    step2Form.classList.add("is-hidden");
    step1Form.classList.remove("is-hidden");

    resetTitle.textContent = "Reset your password";
    resetSubtitle.textContent = "Enter your registered email and we'll send you a single-use verification code.";

    emailInput.focus();
  }

  // STEP 1 SUBMISSION: Send OTP
  if (step1Form) {
    step1Form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();

      const email = emailInput.value.trim();
      if (!email) {
        showAlert("Please enter your email address.");
        return;
      }

      const originalBtnHtml = sendOtpBtn.innerHTML;
      sendOtpBtn.disabled = true;
      sendOtpBtn.style.opacity = "0.75";
      sendOtpBtn.innerHTML = `<span>Sending code...</span>`;

      try {
        const response = await fetch("/resetpass/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          showAlert(data.error || "Failed to send code. Please try again.");
          sendOtpBtn.disabled = false;
          sendOtpBtn.style.opacity = "1";
          sendOtpBtn.innerHTML = originalBtnHtml;
          return;
        }

        // Advance to Step 2
        sendOtpBtn.disabled = false;
        sendOtpBtn.style.opacity = "1";
        sendOtpBtn.innerHTML = originalBtnHtml;

        showStep2(email);
        showAlert(data.message || "Verification code sent to your email.", "success");
      } catch (err) {
        console.error("Error sending OTP:", err);
        showAlert("Network connection error. Please try again.");
        sendOtpBtn.disabled = false;
        sendOtpBtn.style.opacity = "1";
        sendOtpBtn.innerHTML = originalBtnHtml;
      }
    });
  }

  // RESEND OTP BUTTON
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", async () => {
      if (resendOtpBtn.disabled || !activeEmail) return;

      clearAlert();
      resendOtpBtn.disabled = true;

      try {
        const response = await fetch("/resetpass/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ email: activeEmail })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          showAlert("A new verification code has been sent.", "success");
          startResendCooldown();
        } else {
          showAlert(data.error || "Failed to resend code.");
          resendOtpBtn.disabled = false;
        }
      } catch (err) {
        showAlert("Failed to resend code. Please check your connection.");
        resendOtpBtn.disabled = false;
      }
    });
  }

  // CHANGE EMAIL BUTTON
  if (changeEmailBtn) {
    changeEmailBtn.addEventListener("click", () => {
      showStep1();
    });
  }

  // STEP 2 SUBMISSION: Verify & Reset Password
  if (step2Form) {
    step2Form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();

      const code = otpInput.value.trim();
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (!code || code.length !== 6) {
        showAlert("Please enter the complete 6-digit verification code.");
        otpInput.focus();
        return;
      }

      if (newPassword.length < 6) {
        showAlert("New password must be at least 6 characters long.");
        newPasswordInput.focus();
        return;
      }

      if (newPassword !== confirmPassword) {
        showAlert("Passwords do not match.");
        confirmPasswordInput.focus();
        return;
      }

      const originalBtnHtml = resetPasswordBtn.innerHTML;
      resetPasswordBtn.disabled = true;
      resetPasswordBtn.style.opacity = "0.75";
      resetPasswordBtn.innerHTML = `<span>Updating password...</span>`;

      try {
        const response = await fetch("/resetpass/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            email: activeEmail,
            code,
            newPassword,
            confirmPassword
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          showAlert(data.error || "Failed to reset password.");
          resetPasswordBtn.disabled = false;
          resetPasswordBtn.style.opacity = "1";
          resetPasswordBtn.innerHTML = originalBtnHtml;
          return;
        }

        showAlert("Password reset successfully! Redirecting you to login...", "success");

        // Wait a moment for the user to see the success state, then redirect
        setTimeout(() => {
          window.location.href = data.redirect || "/login";
        }, 1200);
      } catch (err) {
        console.error("Error resetting password:", err);
        showAlert("Network error occurred. Please try again.");
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.style.opacity = "1";
        resetPasswordBtn.innerHTML = originalBtnHtml;
      }
    });
  }
});
