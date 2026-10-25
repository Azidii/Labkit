document.addEventListener("DOMContentLoaded", () => {
  const searchContainers = document.querySelectorAll(".navbar-search");
  if (!searchContainers || searchContainers.length === 0) return;

  searchContainers.forEach((search) => {
    if (!search) return;
    const toggle = search.querySelector(".navbar-search__toggle");
    const form = search.querySelector(".navbar-search__form");
    const input = search.querySelector(".navbar-search__input");
    if (!toggle || !form || !input) return;

    const suggestionItems = [
      { label: "Microcontrollers", type: "Category" },
      { label: "Sensors & Modules", type: "Category" },
      { label: "Displays & Power", type: "Category" },
      { label: "Buzzers & Audio", type: "Category" },
      { label: "IoT Kits", type: "Category" },
      { label: "Arduino", type: "Component" },
      { label: "Raspberry Pi", type: "Component" },
      { label: "ESP32", type: "Component" },
      { label: "Robotics", type: "Use case" },
      { label: "Wireless projects", type: "Use case" }
    ];
    const suggestions = document.createElement("div");
    suggestions.className = "navbar-search__suggestions";
    suggestions.setAttribute("role", "listbox");
    suggestions.hidden = true;
    search.appendChild(suggestions);

    const renderSuggestions = () => {
      const query = input.value.trim().toLowerCase();
      const matches = suggestionItems
        .filter((item) => !query || item.label.toLowerCase().includes(query))
        .slice(0, 7);
      suggestions.innerHTML = "";
      matches.forEach((item) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "navbar-search__suggestion";
        option.setAttribute("role", "option");
        const label = document.createElement("span");
        label.className = "navbar-search__suggestion-label";
        label.textContent = item.label;
        const type = document.createElement("span");
        type.className = "navbar-search__suggestion-type";
        type.textContent = item.type;
        option.append(label, type);
        option.addEventListener("click", () => {
          input.value = item.label;
          form.submit();
        });
        suggestions.appendChild(option);
      });
      suggestions.hidden = matches.length === 0;
    };

    toggle.addEventListener("click", () => {
      const isOpen = search.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        input.focus();
        renderSuggestions();
      } else {
        suggestions.hidden = true;
      }
    });

    input.addEventListener("input", renderSuggestions);
    input.addEventListener("focus", renderSuggestions);

    form.addEventListener("submit", (event) => {
      if (!input.value.trim()) {
        event.preventDefault();
        input.focus();
        return;
      }
      suggestions.hidden = true;
    });

    document.addEventListener("click", (event) => {
      if (!search.contains(event.target)) {
        search.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        suggestions.hidden = true;
      }
    });
  });
});
