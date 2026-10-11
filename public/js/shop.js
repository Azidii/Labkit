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

  const hideSuggestions = () => {
    if (!suggestions) return;
    suggestions.hidden = true;
    suggestions.innerHTML = "";
  };

  const renderSuggestions = () => {
    if (!searchInput || !suggestions) return;
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      hideSuggestions();
      return;
    }

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

    suggestions.innerHTML = "";
    if (!matches.length) {
      hideSuggestions();
      return;
    }

    matches.forEach((product, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "search-suggestion";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.dataset.index = String(index);
      option.innerHTML = `<span class="search-suggestion__name"></span><span class="search-suggestion__meta"></span>`;
      option.querySelector(".search-suggestion__name").textContent = product.name;
      option.querySelector(".search-suggestion__meta").textContent = product.category;
      option.addEventListener("click", () => {
        searchInput.value = product.name;
        document.getElementById("filterForm").submit();
      });
      suggestions.appendChild(option);
    });
    suggestions.hidden = false;
  };

  const filterVisibleProducts = () => {
    if (!searchInput) return;
    const cards = Array.from(document.querySelectorAll(".product-card"));
    const resultCount = document.querySelector(".results-count strong");
    if (!cards.length || !resultCount) return;

    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;
    cards.forEach((card) => {
      const matches = !query || (card.dataset.search || "").toLowerCase().includes(query);
      card.hidden = !matches;
      card.setAttribute("aria-hidden", String(!matches));
      if (matches) visibleCount += 1;
    });

    resultCount.textContent = String(visibleCount);
    let emptyState = document.getElementById("liveSearchEmptyState");
    if (visibleCount === 0) {
      if (!emptyState) {
        emptyState = document.createElement("div");
        emptyState.id = "liveSearchEmptyState";
        emptyState.className = "empty-state";
        emptyState.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3>No parts match your search</h3>
          <p>Try another keyword or clear the search field.</p>`;
        document.querySelector(".shop-products").appendChild(emptyState);
      }
      emptyState.hidden = false;
    } else if (emptyState) {
      emptyState.hidden = true;
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderSuggestions();
      filterVisibleProducts();
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
