/**
 * LabKit Auth Success Transition Handler
 * Auto-redirects to target destination with history replacement to keep browser back button clean.
 */
document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector(".page-main");
  if (main?.dataset.purchaseSuccess === "true") return;
  if (window.location.search.includes("noredirect")) return;

  const continueBtn = document.getElementById("continueBtn");
  const targetUrl = continueBtn ? continueBtn.getAttribute("href") : "/";

  let hasNavigated = false;
  let redirectTimeoutId = null;

  function navigateToDestination() {
    if (hasNavigated) return;
    hasNavigated = true;

    if (redirectTimeoutId) {
      clearTimeout(redirectTimeoutId);
      redirectTimeoutId = null;
    }

    if (main) {
      main.classList.remove("page-transition-enter-active", "page-transition-enter");
      main.classList.add("page-transition-exit-active");
      setTimeout(() => {
        // Use window.location.replace so transient splash screen does not trap back button
        window.location.replace(targetUrl);
      }, 180);
    } else {
      window.location.replace(targetUrl);
    }
  }

  // Handle manual continue click
  if (continueBtn) {
    continueBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToDestination();
    });
  }

  // Start auto-redirect timer (2.2s allows user to see the success confirmation and progress bar)
  function startRedirectTimer() {
    if (redirectTimeoutId) clearTimeout(redirectTimeoutId);
    redirectTimeoutId = setTimeout(() => {
      navigateToDestination();
    }, 2200);
  }

  startRedirectTimer();

  // If user navigates back to /success using browser Back button (pageshow event):
  window.addEventListener("pageshow", (event) => {
    hasNavigated = false;
    if (main) {
      main.classList.remove("page-transition-exit-active", "page-transition-exit");
      main.classList.add("page-transition-enter-active");
      main.style.opacity = "";
      main.style.transform = "";
    }
    // Restart progress bar animation if returning from cache
    const progress = document.querySelector(".countdown-progress");
    if (progress) {
      progress.style.animation = "none";
      void progress.offsetWidth; // Trigger reflow
      progress.style.animation = "";
    }
    startRedirectTimer();
  });

  // Clear timer when leaving page
  window.addEventListener("pagehide", () => {
    if (redirectTimeoutId) {
      clearTimeout(redirectTimeoutId);
      redirectTimeoutId = null;
    }
    if (main) {
      main.classList.remove("page-transition-exit-active");
      main.style.opacity = "";
      main.style.transform = "";
    }
  });
});
