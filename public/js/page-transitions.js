document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector(".page-main") || document.querySelector("main");
  if (main) {
    main.classList.add("page-transition-enter");
    requestAnimationFrame(() => {
      main.classList.add("page-transition-enter-active");
    });
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || link.target === "_blank") return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.origin !== window.location.origin) return;

    if (link.classList.contains("navbar__link")) {
      document.querySelectorAll(".navbar__link").forEach((l) => l.classList.remove("navbar__link--active"));
      link.classList.add("navbar__link--active");
    }

    if (main) {
      e.preventDefault();
      main.classList.remove("page-transition-enter-active");
      main.classList.add("page-transition-exit-active");
      setTimeout(() => {
        window.location.href = href;
      }, 200);
    }
  });
});
