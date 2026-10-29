document.addEventListener("DOMContentLoaded", () => {
  const adminNavLink = document.querySelector('.navbar__link[href="/admin"]');
  const keepAdminNavActive = () => {
    if (adminNavLink) adminNavLink.classList.add("navbar__link--active");
  };

  keepAdminNavActive();
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".navbar__link")) keepAdminNavActive();
  }, true);

  const avatarBtn = document.getElementById("avatarBtn");
  const dropdownWrapper = avatarBtn?.closest(".profile-dropdown-wrapper");
  avatarBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = dropdownWrapper.classList.toggle("is-open");
    avatarBtn.setAttribute("aria-expanded", String(isOpen));
  });
  document.addEventListener("click", (event) => {
    if (dropdownWrapper && !dropdownWrapper.contains(event.target)) {
      dropdownWrapper.classList.remove("is-open");
      avatarBtn.setAttribute("aria-expanded", "false");
    }
  });

  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  function selectTab(name) {
    tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === name));
    panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
    document.querySelector(".tabs")?.classList.toggle("accounts-active", name === "accounts");
  }
  selectTab(requestedTab === "accounts" ? "accounts" : "products");

  document.getElementById("focusBundleForm")?.addEventListener("click", () => {
    exitEditMode();
    document.getElementById("bundleForm")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("bundleName")?.focus();
  });

  const name = document.getElementById("bundleName");
  const slug = document.getElementById("bundleSlug");
  const tagline = document.getElementById("bundleTagline");
  const image = document.getElementById("bundleImage");
  const description = document.getElementById("bundleDescription");
  const price = document.getElementById("bundlePrice");
  const category = document.getElementById("bundleCategory");
  const difficulty = document.getElementById("bundleDifficulty");
  const previewImage = document.getElementById("previewImage");
  const previewName = document.getElementById("previewName");
  const previewTagline = document.getElementById("previewTagline");
  const previewPrice = document.getElementById("previewPrice");
  const previewCategory = document.getElementById("previewCategory");
  const previewDifficulty = document.getElementById("previewDifficulty");

  // File upload elements
  const fileInput = document.getElementById("itemImageInput");
  const dropzone = document.getElementById("imageDropzone");
  const uploadPlaceholder = document.getElementById("uploadPlaceholder");
  const fileUploadPreview = document.getElementById("fileUploadPreview");
  const filePreviewThumb = document.getElementById("filePreviewThumb");
  const filePreviewName = document.getElementById("filePreviewName");
  const filePreviewSize = document.getElementById("filePreviewSize");
  const removeFileBtn = document.getElementById("removeFileBtn");
  const toggleUrlBtn = document.getElementById("toggleUrlInputBtn");
  const urlContainer = document.getElementById("urlInputContainer");
  const toggleUrlText = document.getElementById("toggleUrlText");

  let uploadedImageSrc = null;

  const defaultPlaceholder = `
    <div class="preview-placeholder">
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
      <span>Image Preview</span>
    </div>`;

  const syncPreview = () => {
    if (previewName) previewName.textContent = name?.value?.trim() || "Item name";
    if (previewTagline) previewTagline.textContent = tagline?.value?.trim() || "A short, punchy tagline appears here.";
    if (previewPrice) previewPrice.textContent = `₱${Number(price?.value || 0).toFixed(2)}`;
    if (previewCategory && category) previewCategory.textContent = category.value;
    if (previewDifficulty && difficulty) previewDifficulty.textContent = difficulty.value;

    if (slug) {
      slug.value = (name?.value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (previewImage) {
      const activeImg = uploadedImageSrc || image?.value?.trim();
      if (activeImg) {
        if (previewImage.querySelector("img")?.getAttribute("src") !== activeImg) {
          const img = document.createElement("img");
          img.alt = "Item preview";
          img.addEventListener("error", () => { previewImage.innerHTML = defaultPlaceholder; }, { once: true });
          img.src = activeImg;
          previewImage.replaceChildren(img);
        }
      } else {
        previewImage.innerHTML = defaultPlaceholder;
      }
    }
  };

  const handleSelectedFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageSrc = e.target.result;
      if (filePreviewThumb) filePreviewThumb.src = uploadedImageSrc;
      if (filePreviewName) filePreviewName.textContent = file.name;
      if (filePreviewSize) filePreviewSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      if (uploadPlaceholder) uploadPlaceholder.style.display = "none";
      if (fileUploadPreview) fileUploadPreview.style.display = "flex";
      syncPreview();
    };
    reader.readAsDataURL(file);
  };

  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleSelectedFile(file);
  });

  // Drag and drop support
  if (dropzone) {
    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "dragend", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file && fileInput) {
        fileInput.files = e.dataTransfer.files;
        handleSelectedFile(file);
      }
    });
  }

  // Remove uploaded file
  removeFileBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInput) fileInput.value = "";
    if (existingImageUrl) existingImageUrl.value = "";
    uploadedImageSrc = null;
    if (uploadPlaceholder) uploadPlaceholder.style.display = "flex";
    if (fileUploadPreview) fileUploadPreview.style.display = "none";
    syncPreview();
  });

  // Toggle URL input
  toggleUrlBtn?.addEventListener("click", () => {
    if (!urlContainer) return;
    const isHidden = urlContainer.style.display === "none";
    urlContainer.style.display = isHidden ? "block" : "none";
    if (toggleUrlText) {
      toggleUrlText.textContent = isHidden ? "Hide image URL input" : "Or enter image URL instead";
    }
    if (isHidden && image) {
      image.focus();
    }
  });

  [name, tagline, image, description, price, category, difficulty].forEach((field) => {
    field?.addEventListener("input", syncPreview);
    field?.addEventListener("change", syncPreview);
  });

  function enableAutoBullet(textarea) {
    if (!textarea) return;
    const bullet = "• ";

    textarea.addEventListener("focus", () => {
      if (!textarea.value.trim()) {
        textarea.value = bullet;
        textarea.setSelectionRange(bullet.length, bullet.length);
      }
    });

    textarea.addEventListener("input", () => {
      if (textarea.value && !textarea.value.startsWith("•") && !textarea.value.startsWith("-")) {
        const pos = textarea.selectionStart;
        textarea.value = bullet + textarea.value.replace(/^[•\-\*]\s*/, "");
        const newPos = Math.max(bullet.length, pos + bullet.length);
        textarea.setSelectionRange(newPos, newPos);
      }
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;

        const lastNL = val.lastIndexOf("\n", start - 1);
        const currentLine = val.substring(lastNL + 1, start);

        if (currentLine.trim() === "•" || currentLine.trim() === "") {
          const before = val.substring(0, lastNL === -1 ? 0 : lastNL);
          const after = val.substring(start);
          textarea.value = before + (before && after ? "\n" : "") + after;
          const newPos = before.length + (before && after ? 1 : 0);
          textarea.setSelectionRange(newPos, newPos);
          return;
        }

        const insert = "\n" + bullet;
        textarea.value = val.substring(0, start) + insert + val.substring(end);
        const nextPos = start + insert.length;
        textarea.setSelectionRange(nextPos, nextPos);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (e.key === "Backspace") {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        if (start === end) {
          const lastNL = val.lastIndexOf("\n", start - 1);
          const currentLine = val.substring(lastNL + 1, start);
          if (currentLine === bullet) {
            e.preventDefault();
            const before = val.substring(0, lastNL === -1 ? 0 : lastNL);
            const after = val.substring(start);
            textarea.value = before + after;
            textarea.setSelectionRange(before.length, before.length);
          }
        }
      }
    });

    textarea.addEventListener("paste", () => {
      setTimeout(() => {
        const lines = textarea.value.split("\n");
        const bulleted = lines.map((l) => {
          const trimmed = l.trim();
          if (!trimmed) return "";
          return trimmed.startsWith("•") ? trimmed : `${bullet}${trimmed.replace(/^[•\-\*]\s*/, "")}`;
        });
        textarea.value = bulleted.join("\n");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }, 10);
    });
  }

  enableAutoBullet(document.getElementById("bundleComponents"));
  enableAutoBullet(document.getElementById("bundleFeatures"));

  document.getElementById("adminPasswordForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/settings/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    alert(data.message || data.error || "Password update failed.");
    if (data.success) event.currentTarget.reset();
  });

  // ── Styled Confirmation Modal Logic ──
  const modalBackdrop = document.getElementById("deleteConfirmModal");
  const modalCloseBtn = document.getElementById("confirmModalClose");
  const modalCancelBtn = document.getElementById("confirmModalCancel");
  const modalConfirmBtn = document.getElementById("confirmModalConfirm");
  const modalTitle = document.getElementById("confirmModalTitle");
  const modalSubtitle = document.getElementById("confirmModalSubtitle");
  const modalMessage = document.getElementById("confirmModalMessage");
  const modalEntityName = document.getElementById("confirmModalEntityName");
  const modalEntityDetail = document.getElementById("confirmModalEntityDetail");
  const modalWarningText = document.getElementById("confirmModalWarningText");

  let pendingFormToSubmit = null;

  const openDeleteModal = ({ title, subtitle, message, entityName, entityDetail, warning, form }) => {
    if (!modalBackdrop) return;
    pendingFormToSubmit = form;
    if (modalTitle) modalTitle.textContent = title || "Are you sure to remove acc?";
    if (modalSubtitle) modalSubtitle.textContent = subtitle || "This action cannot be undone.";
    if (modalMessage) modalMessage.textContent = message || "Are you sure you want to delete this account?";
    if (modalEntityName) modalEntityName.textContent = entityName || "Account";
    if (modalEntityDetail) modalEntityDetail.textContent = entityDetail || "";
    if (modalWarningText) modalWarningText.textContent = warning || "All permissions and access will be revoked immediately.";

    modalBackdrop.classList.add("is-open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    modalCancelBtn?.focus();
  };

  const closeDeleteModal = () => {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("is-open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    pendingFormToSubmit = null;
  };

  modalCloseBtn?.addEventListener("click", closeDeleteModal);
  modalCancelBtn?.addEventListener("click", closeDeleteModal);

  modalBackdrop?.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeDeleteModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop?.classList.contains("is-open")) {
      closeDeleteModal();
    }
  });

  modalConfirmBtn?.addEventListener("click", () => {
    if (pendingFormToSubmit) {
      modalConfirmBtn.disabled = true;
      modalConfirmBtn.innerHTML = `
        <svg class="spin-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        <span>Removing...</span>`;
      pendingFormToSubmit.submit();
    }
  });

  // Account removal triggers
  document.querySelectorAll(".js-remove-account-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const form = btn.closest(".js-delete-account-form");
      const name = form?.dataset?.name || "User";
      const email = form?.dataset?.email || "Account";
      openDeleteModal({
        title: "Are you sure to remove acc?",
        subtitle: "Account deletion is irreversible.",
        message: "Are you sure you want to delete this account?",
        entityName: name,
        entityDetail: email,
        warning: "User login privileges and active sessions will be terminated immediately.",
        form: form
      });
    });
  });

  // Item removal triggers
  document.querySelectorAll(".js-remove-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const form = btn.closest(".js-delete-item-form");
      const name = form?.dataset?.name || "Catalog item";
      openDeleteModal({
        title: "Are you sure to remove item?",
        subtitle: "Catalog item removal",
        message: "Are you sure you want to delete this item from the catalog?",
        entityName: name,
        entityDetail: "Shop Catalog Item",
        warning: "This component will no longer be visible or purchasable in the shop.",
        form: form
      });
    });
  });

  // Bundle removal triggers
  document.querySelectorAll(".js-remove-kit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const form = btn.closest(".js-delete-kit-form");
      const name = form?.dataset?.name || "Kit bundle";
      openDeleteModal({
        title: "Are you sure to remove bundle?",
        subtitle: "Hardware bundle removal",
        message: "Are you sure you want to delete this bundle from the catalog?",
        entityName: name,
        entityDetail: "Hardware Kit Bundle",
        warning: "This kit will no longer be visible or purchasable in the shop.",
        form: form
      });
    });
  });

  // ── Edit Catalog Item / Bundle Logic ──
  const bundleForm = document.getElementById("bundleForm");
  const existingImageUrl = document.getElementById("existingImageUrl");
  const formItemId = document.getElementById("formItemId");
  const editModeBanner = document.getElementById("editModeBanner");
  const editingItemName = document.getElementById("editingItemName");
  const cancelEditBannerBtn = document.getElementById("cancelEditBannerBtn");
  const discardChangesBtn = document.getElementById("discardChangesBtn");
  const adminResetLink = document.getElementById("adminResetLink");
  const submitItemBtnText = document.getElementById("submitItemBtnText");
  const submitItemBtnIcon = document.getElementById("submitItemBtnIcon");
  const comparePrice = document.getElementById("bundleComparePrice");
  const stock = document.getElementById("bundleStock");
  const maxPurchase = document.getElementById("bundleMaxPurchase");
  const components = document.getElementById("bundleComponents");
  const features = document.getElementById("bundleFeatures");
  let editGeneration = 0;

  if (bundleForm?.dataset.editId) {
    if (editModeBanner) editModeBanner.style.display = "flex";
    if (editingItemName) editingItemName.textContent = name?.value || "Selected item";
    if (submitItemBtnText) submitItemBtnText.textContent = bundleForm.dataset.editType === "kit" ? "Update Bundle" : "Update Item";
    if (discardChangesBtn) discardChangesBtn.style.display = "inline-flex";
    if (adminResetLink) adminResetLink.style.display = "none";
  }

  function enterEditMode(itemData, itemType = "item") {
    if (!bundleForm || !itemData) return;

    // Set form action and hidden fields
    bundleForm.action = itemType === "kit" ? `/admin/bundles/${itemData._id}/edit` : `/admin/items/${itemData._id}/edit`;
    if (formItemId) formItemId.value = itemData._id;

    // Populate standard fields
    if (name) name.value = itemData.name || "";
    if (slug) slug.value = itemData.slug || "";
    if (tagline) tagline.value = itemData.tagline || "";
    if (description) description.value = itemData.description || "";
    if (price) price.value = itemData.price !== undefined && itemData.price !== null ? itemData.price : "";
    if (comparePrice) comparePrice.value = itemData.compare_at_price !== undefined && itemData.compare_at_price !== null ? itemData.compare_at_price : "";

    const rawStock = itemData.stockQuantity !== undefined ? itemData.stockQuantity : (itemData.stock_quantity !== undefined ? itemData.stock_quantity : 25);
    if (stock) stock.value = rawStock;
    if (maxPurchase) maxPurchase.value = itemData.maxPurchaseQuantity || 10;

    if (category) {
      const catVal = itemData.category || "Sensors & Modules";
      const catOption = Array.from(category.options).find((opt) => opt.value.toLowerCase() === catVal.toLowerCase());
      if (catOption) {
        category.value = catOption.value;
      } else {
        category.value = catVal;
      }
    }

    if (difficulty) {
      const diffVal = itemData.difficulty || "Beginner";
      const diffOption = Array.from(difficulty.options).find((opt) => opt.value.toLowerCase() === diffVal.toLowerCase());
      if (diffOption) {
        difficulty.value = diffOption.value;
      } else {
        difficulty.value = diffVal;
      }
    }

    // Populate components
    if (components) {
      if (Array.isArray(itemData.components) && itemData.components.length > 0) {
        components.value = itemData.components
          .map((c) => {
            if (typeof c === "string") return `• ${c}`;
            const parts = [c.name || ""];
            if (c.qty && c.qty > 1) parts.push(c.qty);
            else if (c.spec) parts.push(c.qty || 1);
            if (c.spec) parts.push(c.spec);
            return `• ${parts.join(" | ")}`;
          })
          .join("\n");
      } else {
        components.value = "";
      }
    }

    // Populate features
    if (features) {
      if (Array.isArray(itemData.features) && itemData.features.length > 0) {
        features.value = itemData.features.map((f) => `• ${f}`).join("\n");
      } else {
        features.value = "";
      }
    }

    // Handle existing image
    const imgUrl = itemData.imageUrl || itemData.image_url || "";
    if (existingImageUrl) existingImageUrl.value = imgUrl;
    uploadedImageSrc = imgUrl || null;
    if (fileInput) fileInput.value = "";
    if (image) image.value = imgUrl.startsWith("http") ? imgUrl : "";

    if (imgUrl) {
      if (filePreviewThumb) filePreviewThumb.src = imgUrl;
      if (filePreviewName) filePreviewName.textContent = "Current image from database";
      if (filePreviewSize) filePreviewSize.textContent = "(Saved in DB)";
      if (uploadPlaceholder) uploadPlaceholder.style.display = "none";
      if (fileUploadPreview) fileUploadPreview.style.display = "flex";
    } else {
      if (uploadPlaceholder) uploadPlaceholder.style.display = "flex";
      if (fileUploadPreview) fileUploadPreview.style.display = "none";
    }

    // Show edit banner
    if (editModeBanner) editModeBanner.style.display = "flex";
    if (editingItemName) editingItemName.textContent = itemData.name || "Selected item";

    // Update buttons
    if (submitItemBtnText) submitItemBtnText.textContent = itemType === "kit" ? "Update Bundle" : "Update Item";
    if (submitItemBtnIcon) {
      submitItemBtnIcon.innerHTML = '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>';
    }
    if (discardChangesBtn) discardChangesBtn.style.display = "inline-flex";
    if (adminResetLink) adminResetLink.style.display = "none";

    // Highlight row
    document.querySelectorAll(".bundle-row").forEach((r) => r.classList.remove("is-editing"));
    const currentRow = document.querySelector(`.bundle-row[data-id="${itemData._id}"]`);
    if (currentRow) currentRow.classList.add("is-editing");

    // Sync preview card
    syncPreview();

    // Smooth scroll into view
    bundleForm.scrollIntoView({ behavior: "smooth" });
    name?.focus();
  }

  function exitEditMode() {
    if (!bundleForm) return;
    editGeneration++;

    // Reset action and hidden values
    bundleForm.action = "/admin/items";
    if (formItemId) formItemId.value = "";
    if (existingImageUrl) existingImageUrl.value = "";
    uploadedImageSrc = null;

    // Reset file input & URL input
    if (fileInput) fileInput.value = "";
    if (image) image.value = "";
    if (uploadPlaceholder) uploadPlaceholder.style.display = "flex";
    if (fileUploadPreview) fileUploadPreview.style.display = "none";

    // Clear fields
    if (name) name.value = "";
    if (slug) slug.value = "";
    if (tagline) tagline.value = "";
    if (description) description.value = "";
    if (price) price.value = "";
    if (comparePrice) comparePrice.value = "";
    if (stock) stock.value = "25";
    if (maxPurchase) maxPurchase.value = "10";
    if (components) components.value = "";
    if (features) features.value = "";
    if (category) category.selectedIndex = 0;
    if (difficulty) difficulty.value = "Beginner";

    // Hide edit banner
    if (editModeBanner) editModeBanner.style.display = "none";

    // Reset buttons
    if (submitItemBtnText) submitItemBtnText.textContent = "Add Item";
    if (submitItemBtnIcon) {
      submitItemBtnIcon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    }
    if (discardChangesBtn) discardChangesBtn.style.display = "none";
    if (adminResetLink) adminResetLink.style.display = "inline-flex";

    // Remove row highlight
    document.querySelectorAll(".bundle-row").forEach((r) => r.classList.remove("is-editing"));

    // Sync preview
    syncPreview();
  }

  let editingRequest = false;
  document.querySelectorAll(".js-edit-product-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (editingRequest) return;
      const row = btn.closest(".bundle-row");
      const errorBox = document.getElementById("catalogActionError");
      if (!row) return;
      editingRequest = true;
      const generation = ++editGeneration;
      btn.disabled = true;
      btn.textContent = "Loading…";
      if (errorBox) errorBox.hidden = true;
      try {
        const response = await fetch("/admin/products/" + encodeURIComponent(row.dataset.type) + "/" + encodeURIComponent(row.dataset.id), {
          headers: { Accept: "application/json" }, cache: "no-store"
        });
        if (!response.ok || response.redirected) throw new Error("Unable to load product details. Please sign in again or retry.");
        const product = await response.json();
        if (generation !== editGeneration) return;
        enterEditMode(product, row.dataset.type);
      } catch (err) {
        if (errorBox) { errorBox.textContent = err.message; errorBox.hidden = false; }
      } finally {
        editingRequest = false;
        btn.disabled = false;
        btn.textContent = "Edit";
      }
    });
  });

  // Cancel edit triggers
  cancelEditBannerBtn?.addEventListener("click", exitEditMode);
  discardChangesBtn?.addEventListener("click", exitEditMode);

  syncPreview();
});

