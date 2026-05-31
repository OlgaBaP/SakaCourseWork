import { getProducts } from "../api/api.js";

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
const params = new URLSearchParams(window.location.search);

let products = [];

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

function getUniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]))].sort((a, b) =>
    a.localeCompare(b, "ru"),
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
    <span>${value}</span>
    <input type="checkbox" name="${name}" value="${value}" />
    <span class="filter-option__mark" aria-hidden="true"></span>
  `;

  label.querySelector("input").addEventListener("change", renderProducts);

  return label;
}

function createColorOption(color) {
  const label = document.createElement("label");
  label.className = "color-option";
  label.title = color;

  label.innerHTML = `
    <input type="checkbox" name="color" value="${color}" />
    <span class="color-option__swatch" aria-hidden="true"></span>
  `;

  const swatch = label.querySelector(".color-option__swatch");
  swatch.style.setProperty("--swatch-color", colorMap[color] || "#ffffff");
  label.querySelector("input").addEventListener("change", renderProducts);

  return label;
}

function renderFilters() {
  const categories = getUniqueValues(products, "category");
  const qualities = getUniqueValues(products, "quality");
  const colors = getUniqueValues(products, "color");

  categoryFilters.innerHTML = "";
  qualityFilters.innerHTML = "";
  colorFilters.innerHTML = "";
  mobileColorSelect.innerHTML = '<option value="">Все цвета</option>';

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
    option.textContent = color;
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
      <img src="${imageSrc}" alt="${product.title} ${product.color}" />
    </a>
    <div class="product-card__body">
      <h2 class="product-card__title">${product.title}</h2>
      <div class="product-card__meta">
        <span class="product-card__price">${formatPrice(product.price)}</span>
        <span class="product-card__width">${product.width}</span>
      </div>
      <a class="product-card__button" href="product.html?id=${product.id}">
        Подробнее
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

function renderProducts() {
  const filteredProducts = getFilteredProducts();

  productsList.innerHTML = "";
  filteredProducts.forEach((product) => {
    productsList.append(renderProductCard(product));
  });

  emptyMessage.hidden = filteredProducts.length > 0;
  updateFilterCount();
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

  renderProducts();
}

async function initCatalog() {
  try {
    products = await getProducts();
    renderFilters();
    searchInput.value = params.get("search") || "";
    renderProducts();
  } catch {
    emptyMessage.hidden = false;
    emptyMessage.textContent = "Не удалось загрузить товары";
  }
}

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);
mobileColorSelect.addEventListener("change", renderProducts);
resetButton.addEventListener("click", resetFilters);

initCatalog();
