/**
 * LabKit Page Transitions & BF-Cache Restoration
 * Ensures smooth page transitions and guarantees NO white screen on browser Back/Forward navigation.
 */
(function () {
  function getMainElement() {
    return document.querySelector(".page-main") || document.querySelector("main");
  }

  // Restore page visibility immediately (used on load, popstate, and pageshow/bfcache)
  function restorePageVisibility() {
    const main = getMainElement();
    if (main) {
      main.classList.remove("page-transition-exit-active", "page-transition-exit", "page-transition-enter");
      main.classList.add("page-transition-enter-active");
      main.style.opacity = "";
      main.style.transform = "";

      // Clean up enter-active class after transition finishes so DOM stays clean
      setTimeout(() => {
        if (main && !main.classList.contains("page-transition-exit-active")) {
          main.classList.remove("page-transition-enter-active");
        }
      }, 350);
    }

    // Re-enable any form submit buttons that might have been disabled during previous submission
    document.querySelectorAll("button[type='submit'], .btn-submit, .btn-primary, .btn-continue").forEach((btn) => {
      btn.disabled = false;
      btn.style.opacity = "";
      btn.style.pointerEvents = "";
    });
  }

  // Initial page entrance
  function initPageEnter() {
    const main = getMainElement();
    if (!main) return;

    main.classList.remove("page-transition-exit-active", "page-transition-exit");
    main.classList.add("page-transition-enter");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (main) {
          main.classList.add("page-transition-enter-active");
          setTimeout(() => {
            if (main && !main.classList.contains("page-transition-exit-active")) {
              main.classList.remove("page-transition-enter", "page-transition-enter-active");
            }
          }, 350);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPageEnter);
  } else {
    initPageEnter();
  }

  // CRITICAL: Handle browser Back / Forward buttons & BFCache (Back-Forward Cache)
  // pageshow fires whenever page is revealed, including navigating back/forward
  window.addEventListener("pageshow", (event) => {
    restorePageVisibility();
  });

  // popstate fires when session history entry changes (Back / Forward button click)
  window.addEventListener("popstate", () => {
    restorePageVisibility();
  });

  // Before browser captures DOM snapshot into BFCache, clear exit transition classes
  // so the cached snapshot is never stored in an invisible (opacity: 0) state
  window.addEventListener("pagehide", () => {
    const main = getMainElement();
    if (main) {
      main.classList.remove("page-transition-exit-active", "page-transition-exit");
      main.classList.add("page-transition-enter-active");
      main.style.opacity = "";
      main.style.transform = "";
    }
  });

  // Intercept normal internal links for smooth exit transition
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    // Ignore downloads, new tabs, and modifier keys
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.defaultPrevented) return;

    const rawHref = link.getAttribute("href");
    if (!rawHref) return;

    // Ignore anchors, javascript, mailto, tel
    if (
      rawHref.startsWith("#") ||
      rawHref.startsWith("javascript:") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:")
    ) {
      return;
    }

    // Bypass if marked with no-transition
    if (link.classList.contains("no-transition")) return;

    // Only internal same-origin links
    if (link.origin !== window.location.origin) return;

    if (link.classList.contains("navbar__link")) {
      document.querySelectorAll(".navbar__link").forEach((l) => l.classList.remove("navbar__link--active"));
      link.classList.add("navbar__link--active");
    }

    // Ignore clicking link to current exact URL
    if (
      link.pathname === window.location.pathname &&
      link.search === window.location.search &&
      link.hash
    ) {
      return;
    }

    const main = getMainElement();
    if (main) {
      e.preventDefault();
      main.classList.remove("page-transition-enter-active", "page-transition-enter");
      main.classList.add("page-transition-exit-active");

      const targetHref = link.href;

      // Safety fallback: if navigation fails, aborts, or is canceled, restore visibility after 1.2s
      const fallbackTimer = setTimeout(() => {
        restorePageVisibility();
      }, 1200);

      setTimeout(() => {
        clearTimeout(fallbackTimer);
        window.location.href = targetHref;
      }, 180);
    }
  });
})();
