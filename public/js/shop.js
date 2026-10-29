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

  // Search submit on Enter
  const searchInput = document.getElementById("searchInput");
  const suggestions = document.getElementById("searchSuggestions");
  const suggestionData = document.getElementById("shopSuggestionData");
  let suggestionProducts = [];

  if (suggestionData) {
    try {
      suggestionProducts = JSON.parse(suggestionData.textContent || "[]");
    } catch (error) {
      console.error("Unable to load shop search suggestions:", error);
    }
  }

  let suggestionDebounceTimer = null;

  const hideSuggestions = () => {
    if (!suggestions) return;
    suggestions.hidden = true;
    suggestions.innerHTML = "";
  };

  const populateSuggestions = (items) => {
    suggestions.innerHTML = "";
    if (!items || !items.length) {
      hideSuggestions();
      return;
    }

    items.forEach((product, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "search-suggestion";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.dataset.index = String(index);
      option.innerHTML = `<span class="search-suggestion__name"></span><span class="search-suggestion__meta"></span>`;
      option.querySelector(".search-suggestion__name").textContent = product.name;
      option.querySelector(".search-suggestion__meta").textContent = product.category || "";
      option.addEventListener("click", () => {
        searchInput.value = product.name;
        document.getElementById("filterForm").submit();
      });
      suggestions.appendChild(option);
    });
    suggestions.hidden = false;
  };

  const renderSuggestions = () => {
    if (!searchInput || !suggestions) return;
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      hideSuggestions();
      return;
    }

    if (suggestionProducts.length) {
      const matches = suggestionProducts
        .filter((product) => {
          const searchableText = [
            product.name,
            product.tagline,
            product.description,
            product.category
          ].join(" ").toLowerCase();
          return searchableText.includes(query);
        })
        .slice(0, 6);
      populateSuggestions(matches);
    } else {
      clearTimeout(suggestionDebounceTimer);
      suggestionDebounceTimer = setTimeout(() => {
        fetch(`/api/shop/suggestions?q=${encodeURIComponent(query)}`)
          .then((res) => (res.ok ? res.json() : []))
          .then((items) => {
            if (searchInput.value.trim().toLowerCase() === query) {
              populateSuggestions(items);
            }
          })
          .catch(() => hideSuggestions());
      }, 150);
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderSuggestions();
    });
    searchInput.addEventListener("focus", renderSuggestions);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        hideSuggestions();
        document.getElementById("filterForm").submit();
      }
    });
  }

  const sortMenu = document.getElementById("sortMenu");
  const sortSelect = document.getElementById("sortSelect");
  const sortOptions = document.getElementById("sortOptions");
  const sortSelectLabel = document.getElementById("sortSelectLabel");
  const filterForm = document.getElementById("filterForm");
  if (sortMenu && sortSelect && sortOptions && sortSelectLabel && filterForm) {
    const closeSortMenu = () => {
      sortMenu.classList.remove("is-open");
      sortSelect.setAttribute("aria-expanded", "false");
      sortOptions.hidden = true;
    };

    sortSelect.addEventListener("click", () => {
      const isOpen = sortMenu.classList.toggle("is-open");
      sortSelect.setAttribute("aria-expanded", String(isOpen));
      sortOptions.hidden = !isOpen;
    });

    sortOptions.querySelectorAll(".sort-option").forEach((option) => {
      option.addEventListener("click", () => {
        const existingSort = filterForm.querySelector('input[name="sort"]');
        if (existingSort) existingSort.remove();
        const sortInput = document.createElement("input");
        sortInput.type = "hidden";
        sortInput.name = "sort";
        sortInput.value = option.dataset.value;
        filterForm.appendChild(sortInput);
        sortSelectLabel.textContent = option.textContent;
        closeSortMenu();
        filterForm.submit();
      });
    });

    document.addEventListener("click", (event) => {
      if (!sortMenu.contains(event.target)) closeSortMenu();
    });
  }

  /* Keep sorting available if the custom menu is not rendered. */
  if (!sortMenu && sortSelect && filterForm) {
    sortSelect.addEventListener("change", () => {
      const existingSort = filterForm.querySelector('input[name="sort"]');
      if (existingSort) existingSort.remove();
      const sortInput = document.createElement("input");
      sortInput.type = "hidden";
      sortInput.name = "sort";
      sortInput.value = sortSelect.value;
      filterForm.appendChild(sortInput);
      filterForm.submit();
    });
  }

  // Mobile filter drawer toggle
  const mobileFilterToggle = document.getElementById("mobileFilterToggle");
  const mobileFilterDrawer = document.getElementById("mobileFilterDrawer");
  const mobileFilterClose = document.getElementById("mobileFilterClose");

  if (mobileFilterToggle && mobileFilterDrawer) {
    const toggleDrawer = (forceOpen) => {
      const willOpen = forceOpen !== undefined ? forceOpen : mobileFilterDrawer.hidden;
      mobileFilterDrawer.hidden = !willOpen;
      mobileFilterToggle.classList.toggle("is-active", willOpen);
      mobileFilterToggle.setAttribute("aria-expanded", String(willOpen));
    };

    mobileFilterToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDrawer();
    });
    if (mobileFilterClose) {
      mobileFilterClose.addEventListener("click", () => toggleDrawer(false));
    }
  }

  // Auto-scroll active category pill into center view in mobile category scrollbar
  const activeMobileCat = document.querySelector(".mobile-cat-pill.is-active");
  if (activeMobileCat) {
    try {
      activeMobileCat.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    } catch (_) {
      const container = activeMobileCat.closest(".mobile-categories-scroll");
      if (container) {
        container.scrollLeft = activeMobileCat.offsetLeft - (container.clientWidth / 2) + (activeMobileCat.clientWidth / 2);
      }
    }
  }

  document.addEventListener("click", (e) => {
    if (suggestions && searchInput && !suggestions.contains(e.target) && e.target !== searchInput) {
      hideSuggestions();
    }
  });

  // Scroll-reveal animation for product cards
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
