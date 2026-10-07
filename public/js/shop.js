function setFilter(type, value) {
  const form = document.getElementById("filterForm");
  if (!form) return;
  if (type === "category") {
    document.getElementById("categoryInput").value = value;
  } else if (type === "difficulty") {
    document.getElementById("difficultyInput").value = value;
  }
  form.submit();
}

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

  document.querySelectorAll(".product-card").forEach((card, i) => {
    card.classList.add("fade-target");
    card.style.transitionDelay = `${i * 0.05}s`;
    scrollObserver.observe(card);
  });
});
