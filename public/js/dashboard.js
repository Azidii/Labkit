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

  // ── Component Highlight Spotlight Carousel ──
  const showcase = document.getElementById("spotlightShowcase");
  const track = document.getElementById("spotlightTrack");
  const prevBtn = document.getElementById("spotlightPrevBtn");
  const nextBtn = document.getElementById("spotlightNextBtn");
  const counter = document.getElementById("spotlightCounter");
  const progressBar = document.getElementById("spotlightProgressBar");
  const slides = showcase ? Array.from(showcase.querySelectorAll(".spotlight-slide")) : [];
  const dots = showcase ? Array.from(showcase.querySelectorAll(".spotlight-dot")) : [];

  if (showcase && track && slides.length > 0) {
    let currentIndex = 0;
    const total = slides.length;
    const intervalMs = 4000;
    let isPaused = false;
    let startTime = performance.now();
    let elapsedPaused = 0;
    let pauseTimestamp = null;
    let animFrameId = null;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateUI = () => {
      slides.forEach((slide, idx) => {
        const isActive = idx === currentIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });
      dots.forEach((dot, idx) => {
        dot.classList.toggle("is-active", idx === currentIndex);
      });
      if (counter) {
        counter.textContent = `${currentIndex + 1} / ${total}`;
      }
    };

    const resetProgress = () => {
      startTime = performance.now();
      elapsedPaused = 0;
      pauseTimestamp = null;
      if (progressBar) progressBar.style.width = "0%";
    };

    const goToSlide = (newIndex) => {
      currentIndex = (newIndex + total) % total;
      updateUI();
      resetProgress();
    };

    const tick = (now) => {
      if (!isPaused && !prefersReducedMotion) {
        const currentElapsed = (now - startTime) - elapsedPaused;
        const progress = Math.min(Math.max(currentElapsed / intervalMs, 0), 1);
        if (progressBar) {
          progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
        }
        if (currentElapsed >= intervalMs) {
          goToSlide(currentIndex + 1);
        }
      }
      animFrameId = requestAnimationFrame(tick);
    };

    if (!prefersReducedMotion) {
      animFrameId = requestAnimationFrame(tick);
    }

    showcase.addEventListener("mouseenter", () => {
      isPaused = true;
      pauseTimestamp = performance.now();
    });

    showcase.addEventListener("mouseleave", () => {
      if (isPaused && pauseTimestamp) {
        elapsedPaused += (performance.now() - pauseTimestamp);
        pauseTimestamp = null;
      }
      isPaused = false;
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", () => goToSlide(currentIndex - 1));
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => goToSlide(currentIndex + 1));
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = Number(dot.dataset.index);
        if (!isNaN(idx)) goToSlide(idx);
      });
    });

    // Keyboard navigation when hovering or focused
    showcase.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToSlide(currentIndex + 1);
      }
    });

    // Mobile touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    showcase.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    showcase.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].clientX;
      const diffX = touchStartX - touchEndX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          goToSlide(currentIndex + 1);
        } else {
          goToSlide(currentIndex - 1);
        }
      }
    }, { passive: true });
  }

  // Staggered Scroll Animations
  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".value-bar__item").forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.09}s`;
    scrollObserver.observe(card);
  });

  document.querySelectorAll(".product-card").forEach((card, i) => {
    card.classList.add("fade-target");
    card.style.transitionDelay = `${(i % 4) * 0.06}s`;
    scrollObserver.observe(card);
  });

  document.querySelectorAll(".cta__card").forEach((card) => {
    card.classList.add("fade-target");
    scrollObserver.observe(card);
  });
});
