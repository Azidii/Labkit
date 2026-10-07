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

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".value-card").forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.08}s`;
    scrollObserver.observe(card);
  });

  document.querySelectorAll(".product-card").forEach((card, i) => {
    card.classList.add("fade-target");
    card.style.transitionDelay = `${i * 0.05}s`;
    scrollObserver.observe(card);
  });

  document.querySelectorAll(".cta__card").forEach((card) => {
    card.classList.add("fade-target");
    scrollObserver.observe(card);
  });
});
