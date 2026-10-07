document.addEventListener("DOMContentLoaded", () => {
  console.log("Labkit dashboard loaded");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document
    .querySelectorAll(".value-card, .product-card, .category-card, .cta__card")
    .forEach((el) => {
      el.classList.add("fade-target");
      observer.observe(el);
    });
});
