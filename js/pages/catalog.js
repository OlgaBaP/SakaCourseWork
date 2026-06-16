import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../api/api.js";
import { getCurrentUser } from "../common/auth-state.js";
import { t, translateValue } from "../common/i18n.js";
import { openPriceRequestModal } from "../common/price-request-modal.js";

const productsList = document.querySelector("[data-products-list]");
const emptyMessage = document.querySelector("[data-empty-message]");
const searchInput = document.querySelector("[data-search-input]");
const categoryFilters = document.querySelector("[data-category-filters]");
const qualityFilters = document.querySelector("[data-quality-filters]");
const colorFilters = document.querySelector("[data-color-filters]");
const sortSelect = document.querySelector("[data-sort-select]");
const mobileColorSelect = document.querySelector("[data-mobile-color-select]");
const resetButton = document.querySelector("[data-reset-button]");
const filterCount = document.querySelector("[data-filter-count]");
const pagination = document.querySelector("[data-catalog-pagination]");
const paginationPrev = document.querySelector("[data-pagination-prev]");
const paginationNext = document.querySelector("[data-pagination-next]");
const catalogToolbar = document.querySelector(".catalog-toolbar");
const adminOpenButton = document.querySelector("[data-catalog-admin-open]");
const adminModal = document.querySelector("[data-catalog-admin-modal]");
const adminForm = document.querySelector("[data-catalog-admin-form]");
const adminModeSelect = document.querySelector("[data-admin-mode]");
const adminProductField = document.querySelector("[data-admin-product-field]");
const adminProductSelect = document.querySelector("[data-admin-product-select]");
const adminDeleteButton = document.querySelector("[data-admin-delete]");
const adminMessage = document.querySelector("[data-catalog-admin-message]");
const params = new URLSearchParams(window.location.search);
const DESKTOP_ITEMS_PER_PAGE = 9;
const COMPACT_ITEMS_PER_PAGE = 4;
const desktopCatalogMedia = window.matchMedia("(min-width: 1400px)");
const ADMIN_MODAL_OPEN_CLASS = "catalog-admin-modal-opened";

let products = [];
let currentPage = 1;
let itemsPerPage = desktopCatalogMedia.matches
  ? DESKTOP_ITEMS_PER_PAGE
  : COMPACT_ITEMS_PER_PAGE;

const colorMap = {
  Бежевый: "#d8c0a2",
  Белый: "#ffffff",
  Зеленый: "#2f8d52",
  Красный: "#c83a3a",
  Оранжевый: "#f28a2e",
  Розовый: "#e8a3b5",
  "Светло-серый": "#d9d9d9",
  Серый: "#9b9b9b",
  Синий: "#275fba",
  Фиолетовый: "#7350a8",
  Черный: "#1d1d1d",
  Коричневый: "#7a4c34",
};

function isAdmin() {
  return getCurrentUser()?.role === "admin";
}

function getUniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "ru"),
  );
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(
    (input) => input.value,
  );
}

function formatPrice(price) {
  return `${String(price).replace(".", ",")} P`;
}

function createFilterOption(name, value) {
  const label = document.createElement("label");
  label.className = "filter-option";

  label.innerHTML = `
    <span>${translateValue(name === "quality" ? "quality" : "product", value)}</span>
    <input type="checkbox" name="${name}" value="${value}" />
    <span class="filter-option__mark" aria-hidden="true"></span>
  `;

  label.querySelector("input").addEventListener("change", resetPageAndRender);

  return label;
}

function createColorOption(color) {
  const label = document.createElement("label");
  label.className = "color-option";
  label.title = translateValue("color", color);

  label.innerHTML = `
    <input type="checkbox" name="color" value="${color}" />
    <span class="color-option__swatch" aria-hidden="true"></span>
  `;

  const swatch = label.querySelector(".color-option__swatch");
  swatch.style.setProperty("--swatch-color", colorMap[color] || "#ffffff");
  label.querySelector("input").addEventListener("change", resetPageAndRender);

  return label;
}

function renderFilters() {
  const categories = getUniqueValues(products, "category");
  const qualities = getUniqueValues(products, "quality");
  const colors = getUniqueValues(products, "color");

  categoryFilters.innerHTML = "";
  qualityFilters.innerHTML = "";
  colorFilters.innerHTML = "";
  mobileColorSelect.innerHTML = `<option value="">${t("catalog.allColors")}</option>`;

  categories.forEach((category) => {
    categoryFilters.append(createFilterOption("category", category));
  });

  qualities.forEach((quality) => {
    qualityFilters.append(createFilterOption("quality", quality));
  });

  colors.forEach((color) => {
    colorFilters.append(createColorOption(color));

    const option = document.createElement("option");
    option.value = color;
    option.textContent = translateValue("color", color);
    mobileColorSelect.append(option);
  });
}

function getFilteredProducts() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const selectedCategories = getCheckedValues("category");
  const selectedQualities = getCheckedValues("quality");
  const selectedColors = getCheckedValues("color");
  const selectedMobileColor = mobileColorSelect.value;

  const filteredProducts = products.filter((product) => {
    const searchableText = [
      product.title,
      product.category,
      product.color,
      product.quality,
      translateValue("product", product.title),
      translateValue("product", product.category),
      translateValue("color", product.color),
      translateValue("quality", product.quality),
    ]
      .join(" ")
      .toLowerCase();
    const isSearchMatch = searchableText.includes(searchValue);
    const isCategoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);
    const isQualityMatch =
      selectedQualities.length === 0 ||
      selectedQualities.includes(product.quality);
    const isColorMatch =
      selectedColors.length === 0 || selectedColors.includes(product.color);
    const isMobileColorMatch =
      selectedMobileColor === "" || product.color === selectedMobileColor;

    return (
      isSearchMatch &&
      isCategoryMatch &&
      isQualityMatch &&
      isColorMatch &&
      isMobileColorMatch
    );
  });

  if (sortSelect.value === "price-asc") {
    filteredProducts.sort((firstProduct, secondProduct) => {
      return firstProduct.price - secondProduct.price;
    });
  }

  if (sortSelect.value === "price-desc") {
    filteredProducts.sort((firstProduct, secondProduct) => {
      return secondProduct.price - firstProduct.price;
    });
  }

  return filteredProducts;
}

function renderProductCard(product) {
  const card = document.createElement("article");
  const imageSrc = `../${product.image}`;

  card.className = "product-card";
  card.innerHTML = `
    <a class="product-card__image" href="product.html?id=${product.id}">
      <img src="${imageSrc}" alt="${translateValue("product", product.title)} ${translateValue("color", product.color)}" />
    </a>
    <div class="product-card__body">
      <h2 class="product-card__title">${translateValue("product", product.title)}</h2>
      <div class="product-card__meta">
        <span class="product-card__price">${formatPrice(product.price)}</span>
        <span class="product-card__width">${translateValue("unit", product.width)}</span>
      </div>
      <a class="product-card__button" href="product.html?id=${product.id}">
        ${t("catalog.more")}
      </a>
    </div>
  `;

  return card;
}

function updateFilterCount() {
  const checkedFilters = document.querySelectorAll(
    '.catalog-filters input[type="checkbox"]:checked',
  ).length;
  const hasSearch = searchInput.value.trim() !== "";
  const hasMobileColor = mobileColorSelect.value !== "";

  filterCount.textContent =
    checkedFilters + (hasSearch ? 1 : 0) + (hasMobileColor ? 1 : 0);
}

function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  pagination.hidden = totalPages <= 1;

  if (pagination.hidden) {
    return;
  }

  paginationPrev.disabled = currentPage === 1;
  paginationNext.disabled = currentPage === totalPages;
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const safePage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  currentPage = safePage;

  productsList.innerHTML = "";
  paginatedProducts.forEach((product) => {
    productsList.append(renderProductCard(product));
  });

  emptyMessage.hidden = filteredProducts.length > 0;
  updatePagination(filteredProducts.length);
  updateFilterCount();
}

function updateAdminButton() {
  if (!adminOpenButton) {
    return;
  }

  adminOpenButton.hidden = !isAdmin();
  catalogToolbar?.classList.toggle("catalog-toolbar--admin", isAdmin());

  if (!isAdmin()) {
    closeAdminModal();
  }
}

function showAdminMessage(text, type = "error") {
  adminMessage.textContent = text;
  adminMessage.dataset.messageType = type;
  adminMessage.hidden = false;
}

function hideAdminMessage() {
  adminMessage.hidden = true;
  adminMessage.textContent = "";
  adminMessage.removeAttribute("data-message-type");
}

function getSelectedAdminProduct() {
  return (
    products.find((product) => {
      return String(product.id) === String(adminProductSelect.value);
    }) || null
  );
}

function fillAdminForm(product = null) {
  const elements = adminForm.elements;

  elements.title.value = product?.title || "";
  elements.category.value = product?.category || "";
  elements.categoryId.value = product?.categoryId || "";
  elements.price.value = product?.price ?? "";
  elements.color.value = product?.color || "";
  elements.image.value = product?.image || "";
  elements.description.value = product?.description || "";
  elements.composition.value = product?.composition || "";
  elements.width.value = product?.width || "";
  elements.density.value = product?.density || "";
  elements.quality.value = product?.quality || "";
  elements.inStock.checked = product?.inStock ?? true;
}

function renderAdminProductOptions(preferredProductId = adminProductSelect.value) {
  adminProductSelect.innerHTML = "";

  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${translateValue("product", product.title)} / ${translateValue("color", product.color)} / ${formatPrice(
      product.price,
    )}`;
    adminProductSelect.append(option);
  });

  if (products.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("admin.noProducts");
    adminProductSelect.append(option);
  }

  if (
    preferredProductId &&
    products.some((product) => String(product.id) === String(preferredProductId))
  ) {
    adminProductSelect.value = preferredProductId;
  }
}

function setAdminMode(mode) {
  const isEditMode = mode === "edit";
  adminModeSelect.value = isEditMode ? "edit" : "add";
  adminProductField.hidden = !isEditMode;
  adminDeleteButton.hidden = !isEditMode || products.length === 0;
  hideAdminMessage();

  if (isEditMode) {
    renderAdminProductOptions();
    fillAdminForm(getSelectedAdminProduct());
    return;
  }

  fillAdminForm();
}

function getAdminFormData() {
  const elements = adminForm.elements;

  return {
    title: elements.title.value.trim(),
    category: elements.category.value.trim(),
    categoryId: Number(elements.categoryId.value),
    price: Number(elements.price.value),
    color: elements.color.value.trim(),
    image: elements.image.value.trim(),
    description: elements.description.value.trim(),
    composition: elements.composition.value.trim(),
    width: elements.width.value.trim(),
    density: elements.density.value.trim(),
    quality: elements.quality.value.trim(),
    inStock: elements.inStock.checked,
  };
}

async function reloadCatalogAfterAdminChange(preferredProductId = "") {
  products = await getProducts();
  currentPage = 1;
  renderFilters();
  renderProducts();
  renderAdminProductOptions(preferredProductId);

  if (adminModeSelect.value === "edit") {
    fillAdminForm(getSelectedAdminProduct());
  }
}

function openAdminModal() {
  if (!isAdmin() || !adminModal) {
    return;
  }

  renderAdminProductOptions();
  setAdminMode(adminModeSelect.value);
  adminModal.hidden = false;
  adminModal.setAttribute("aria-hidden", "false");
  document.body.classList.add(ADMIN_MODAL_OPEN_CLASS);
}

function closeAdminModal() {
  if (!adminModal) {
    return;
  }

  adminModal.hidden = true;
  adminModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove(ADMIN_MODAL_OPEN_CLASS);
  hideAdminMessage();
}

function resetPageAndRender() {
  currentPage = 1;
  renderProducts();
}

function resetFilters() {
  searchInput.value = "";
  sortSelect.value = "default";
  mobileColorSelect.value = "";

  document
    .querySelectorAll('.catalog-filters input[type="checkbox"]')
    .forEach((input) => {
      input.checked = false;
    });

  resetPageAndRender();
}

function scrollToCatalogProducts() {
  window.requestAnimationFrame(() => {
    productsList.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function showPreviousPage() {
  if (currentPage > 1) {
    currentPage -= 1;
    renderProducts();
    scrollToCatalogProducts();
  }
}

function showNextPage() {
  const totalPages = Math.ceil(getFilteredProducts().length / itemsPerPage);

  if (currentPage < totalPages) {
    currentPage += 1;
    renderProducts();
    scrollToCatalogProducts();
  }
}

function handleCatalogBreakpointChange(event) {
  const firstVisibleItemIndex = (currentPage - 1) * itemsPerPage;

  itemsPerPage = event.matches
    ? DESKTOP_ITEMS_PER_PAGE
    : COMPACT_ITEMS_PER_PAGE;
  currentPage = Math.floor(firstVisibleItemIndex / itemsPerPage) + 1;
  renderProducts();
}

async function handleAdminSubmit(event) {
  event.preventDefault();

  if (!isAdmin()) {
    closeAdminModal();
    return;
  }

  const productData = getAdminFormData();

  try {
    if (adminModeSelect.value === "edit") {
      const selectedProduct = getSelectedAdminProduct();

      if (!selectedProduct) {
        showAdminMessage(t("admin.chooseEdit"));
        return;
      }

      const updatedProduct = await updateProduct(selectedProduct.id, productData);
      await reloadCatalogAfterAdminChange(updatedProduct.id);
      showAdminMessage(t("admin.updated"), "success");
      return;
    }

    const createdProduct = await createProduct(productData);
    await reloadCatalogAfterAdminChange(createdProduct.id);
    setAdminMode("edit");
    adminProductSelect.value = createdProduct.id;
    fillAdminForm(createdProduct);
    showAdminMessage(t("admin.added"), "success");
  } catch {
    showAdminMessage(t("admin.saveFailed"));
  }
}

async function handleAdminDelete() {
  if (!isAdmin()) {
    closeAdminModal();
    return;
  }

  const selectedProduct = getSelectedAdminProduct();

  if (!selectedProduct) {
    showAdminMessage(t("admin.chooseDelete"));
    return;
  }

  const isConfirmed = window.confirm(
    t("admin.confirmDelete", { title: translateValue("product", selectedProduct.title) }),
  );

  if (!isConfirmed) {
    return;
  }

  try {
    await deleteProduct(selectedProduct.id);
    await reloadCatalogAfterAdminChange();
    setAdminMode(products.length > 0 ? "edit" : "add");
    showAdminMessage(t("admin.deleted"), "success");
  } catch {
    showAdminMessage(t("admin.deleteFailed"));
  }
}

async function initCatalog() {
  try {
    products = await getProducts();
    renderFilters();
    searchInput.value = params.get("search") || "";
    renderProducts();
    updateAdminButton();
    openPriceRequestModal({
      source: t("Каталог"),
    });
  } catch {
    emptyMessage.hidden = false;
    emptyMessage.textContent = t("catalog.loadFailed");
  }
}

searchInput.addEventListener("input", resetPageAndRender);
sortSelect.addEventListener("change", resetPageAndRender);
mobileColorSelect.addEventListener("change", resetPageAndRender);
resetButton.addEventListener("click", resetFilters);
paginationPrev.addEventListener("click", showPreviousPage);
paginationNext.addEventListener("click", showNextPage);
desktopCatalogMedia.addEventListener("change", handleCatalogBreakpointChange);
adminOpenButton?.addEventListener("click", openAdminModal);
adminModeSelect?.addEventListener("change", () => {
  setAdminMode(adminModeSelect.value);
});
adminProductSelect?.addEventListener("change", () => {
  hideAdminMessage();
  fillAdminForm(getSelectedAdminProduct());
});
adminForm?.addEventListener("submit", handleAdminSubmit);
adminDeleteButton?.addEventListener("click", handleAdminDelete);
adminModal?.addEventListener("click", (event) => {
  if (event.target.closest("[data-catalog-admin-close]")) {
    closeAdminModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !adminModal?.hidden) {
    closeAdminModal();
  }
});
window.addEventListener("auth:changed", updateAdminButton);
window.addEventListener("i18n:changed", () => {
  const selectedCategories = getCheckedValues("category");
  const selectedQualities = getCheckedValues("quality");
  const selectedColors = getCheckedValues("color");
  const selectedMobileColor = mobileColorSelect.value;

  renderFilters();
  document.querySelectorAll('input[name="category"]').forEach((input) => {
    input.checked = selectedCategories.includes(input.value);
  });
  document.querySelectorAll('input[name="quality"]').forEach((input) => {
    input.checked = selectedQualities.includes(input.value);
  });
  document.querySelectorAll('input[name="color"]').forEach((input) => {
    input.checked = selectedColors.includes(input.value);
  });
  mobileColorSelect.value = selectedMobileColor;
  renderProducts();
  renderAdminProductOptions();
});

initCatalog();
