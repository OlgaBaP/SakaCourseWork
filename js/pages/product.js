import { getProductById, getProducts } from "../api/api.js";
import { addProductToCart } from "../common/cart.js";
import { t, translateValue } from "../common/i18n.js";
import { openPriceRequestModal } from "../common/price-request-modal.js";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const productContent = document.querySelector("[data-product-content]");
const productMessage = document.querySelector("[data-product-message]");
const productBreadcrumb = document.querySelector("[data-product-breadcrumb]");
const productTitle = document.querySelector("[data-product-title]");
const productPrice = document.querySelector("[data-product-price]");
const productImage = document.querySelector("[data-product-image]");
const thumbnailsList = document.querySelector("[data-product-thumbnails]");
const productColor = document.querySelector("[data-product-color]");
const productColors = document.querySelector("[data-product-colors]");
const productSpecs = document.querySelector("[data-product-specs]");
const addToCartButton = document.querySelector("[data-product-cart-button]");
const addToCartMessage = document.querySelector("[data-product-cart-message]");
const productQuantity = document.querySelector("[data-product-quantity]");
const productQuantityControls = document.querySelectorAll(
  "[data-product-quantity-step]",
);
const calculator = document.querySelector("[data-calculator]");
const calculatorProduct = document.querySelector("[data-calculator-product]");
const calculatorImage = document.querySelector("[data-calculator-image]");
const calculatorRolls = document.querySelector("[data-calculator-rolls]");
const calculatorPacks = document.querySelector("[data-calculator-packs]");
const calculatorPrice = document.querySelector("[data-calculator-price]");
const calculatorWeight = document.querySelector("[data-calculator-weight]");
const calculatorSum = document.querySelector("[data-calculator-sum]");
const calculatorTotalProduct = document.querySelector(
  "[data-calculator-total-product]",
);
const calculatorTotalWeight = document.querySelector(
  "[data-calculator-total-weight]",
);
const calculatorTotalSum = document.querySelector(
  "[data-calculator-total-sum]",
);

const requestForm = document.querySelector("[data-request-form]");
const nameInput = document.querySelector("[data-request-name]");
const phoneInput = document.querySelector("[data-request-phone]");
const emailInput = document.querySelector("[data-request-email]");

let currentProduct = null;
let currentProducts = [];
let currentVariants = [];
let selectedQuantity = 1;

const ROLL_WEIGHT = 20;
const PACK_WEIGHT = 2;
const MAX_PRODUCT_QUANTITY = 99;

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
  Коричневый: "#7a5038",
};

function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);
}

function getImagePath(image) {
  if (!image) {
    return "";
  }

  return image.startsWith("http") ? image : `../${image}`;
}

function getNumericProductId(id) {
  const numberId = Number(id);
  return Number.isNaN(numberId) ? id : numberId;
}

function showProductNotFound() {
  productContent.hidden = true;
  productMessage.hidden = false;
  productMessage.textContent = t("product.notFound");
  productBreadcrumb.textContent = t("product.notFound");
  document.title = `${t("product.notFound")} | Saka Tekstil`;
}

function setMainImage(product) {
  productImage.src = getImagePath(product.image);
  productImage.alt = `${translateValue("product", product.title)} ${translateValue("color", product.color)}`;
}

function renderThumbnails(thumbnails) {
  thumbnailsList.innerHTML = "";

  thumbnails.forEach((product) => {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.className = "product-thumb";
    button.type = "button";
    button.dataset.productVariantId = String(product.id);
    button.setAttribute("aria-label", `${translateValue("product", product.title)} ${translateValue("color", product.color)}`);

    if (String(product.id) === String(currentProduct.id)) {
      button.classList.add("product-thumb--active");
      button.setAttribute("aria-current", "true");
    }

    image.src = getImagePath(product.image);
    image.alt = "";

    button.append(image);
    button.addEventListener("click", () => {
      selectProductVariant(product);
    });

    thumbnailsList.append(button);
  });
}

function renderColorSwatches(products) {
  productColors.innerHTML = "";

  products.forEach((product) => {
    const color = product.color;
    const swatch = document.createElement("button");

    swatch.className = "color-swatch";
    swatch.type = "button";
    swatch.dataset.productVariantId = String(product.id);
    swatch.title = translateValue("color", color);
    swatch.setAttribute("aria-label", translateValue("color", color));
    swatch.setAttribute(
      "aria-pressed",
      String(String(product.id) === String(currentProduct.id)),
    );
    swatch.style.setProperty("--swatch-color", colorMap[color] || "#d9d9d9");
    swatch.classList.toggle(
      "color-swatch--active",
      String(product.id) === String(currentProduct.id),
    );
    swatch.addEventListener("click", () => {
      selectProductVariant(product);
    });
    productColors.append(swatch);
  });
}

function renderSpecs(product) {
  const specs = [
    [t("Материал:"), translateValue("product", product.category)],
    [t("Качество:"), translateValue("quality", product.quality)],
    [t("Состав:"), translateValue("unit", product.composition)],
    [t("Цвет:"), translateValue("color", product.color)],
    [t("Плотность:"), translateValue("unit", product.density)],
    [t("Ширина рулона:"), translateValue("unit", product.width)],
    [t("Производство:"), t("product.production")],
  ];

  productSpecs.innerHTML = "";

  specs.forEach(([label, value]) => {
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = label;
    description.textContent = value || t("account.defaultValue");

    productSpecs.append(term, description);
  });
}

function getPositiveInteger(value) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function updateCalculator() {
  if (!currentProduct) {
    return;
  }

  const rolls = getPositiveInteger(calculatorRolls.value);
  const packs = getPositiveInteger(calculatorPacks.value);
  const price = Number(currentProduct.price) || 0;
  const weight = rolls * ROLL_WEIGHT + packs * PACK_WEIGHT;
  const total = weight * price;

  calculatorPrice.textContent = formatPrice(price);
  calculatorWeight.textContent = `${weight} ${t("common.kg")}`;
  calculatorSum.textContent = formatPrice(total);
  calculatorTotalWeight.textContent = `${weight} ${t("common.kg")}`;
  calculatorTotalSum.textContent = formatPrice(total);
}

function getProductVariants(product, products) {
  const variants = products.filter((item) => item.title === product.title);

  return variants.length > 0 ? variants : [product];
}

function renderSelectedVariant() {
  const thumbnails = [
    currentProduct,
    ...currentVariants.filter(
      (item) => String(item.id) !== String(currentProduct.id),
    ),
  ].slice(0, 4);

  productBreadcrumb.textContent = translateValue(
    "product",
    currentProduct.title,
  );
  productTitle.textContent = translateValue("product", currentProduct.title);
  productPrice.textContent = formatPrice(currentProduct.price);
  productColor.textContent = translateValue("color", currentProduct.color);
  document.title = `${translateValue("product", currentProduct.title)} | Saka Tekstil`;

  setMainImage(currentProduct);
  renderThumbnails(thumbnails);
  renderColorSwatches(currentVariants);
  renderSpecs(currentProduct);

  calculatorProduct.textContent = translateValue(
    "product",
    currentProduct.title,
  );
  calculatorTotalProduct.textContent = translateValue(
    "product",
    currentProduct.title,
  );
  calculatorImage.src = getImagePath(currentProduct.image);
  calculatorImage.alt = `${translateValue("product", currentProduct.title)} ${translateValue("color", currentProduct.color)}`;
  updateCalculator();
}

function selectProductVariant(product) {
  currentProduct = product;
  addToCartMessage.hidden = true;
  renderSelectedVariant();
}

function renderProduct(product, products) {
  currentProduct = product;
  currentProducts = products;
  currentVariants = getProductVariants(product, products);
  renderSelectedVariant();
  productMessage.hidden = true;
  productContent.hidden = false;
}

function updateProductQuantity(nextQuantity) {
  selectedQuantity = Math.min(
    MAX_PRODUCT_QUANTITY,
    Math.max(1, nextQuantity),
  );
  productQuantity.textContent = String(selectedQuantity);

  productQuantityControls.forEach((button) => {
    const direction = Number(button.dataset.productQuantityStep);
    button.disabled =
      (direction < 0 && selectedQuantity === 1) ||
      (direction > 0 && selectedQuantity === MAX_PRODUCT_QUANTITY);
  });
}

function handleProductQuantityStep(event) {
  const direction = Number(event.currentTarget.dataset.productQuantityStep);
  updateProductQuantity(selectedQuantity + direction);
}

function normalizeCounterValue(input) {
  if (input.value === "") {
    return;
  }

  input.value = String(getPositiveInteger(input.value));
}

function handleCalculatorInput(event) {
  normalizeCounterValue(event.target);
  updateCalculator();
}

function handleCalculatorStep(event) {
  const button = event.target.closest("[data-calculator-step]");

  if (!button) {
    return;
  }

  const input =
    button.dataset.calculatorStep === "rolls"
      ? calculatorRolls
      : calculatorPacks;
  const direction = Number(button.dataset.calculatorDirection);
  const nextValue = getPositiveInteger(input.value) + direction;

  input.value = String(Math.max(0, nextValue));
  updateCalculator();
}

function showAddToCartMessage(text, isError = false) {
  addToCartMessage.textContent = text;
  addToCartMessage.hidden = false;
  addToCartMessage.classList.toggle("is-error", isError);
}

async function handleAddToCart() {
  if (!currentProduct) {
    return;
  }

  addToCartButton.disabled = true;
  addToCartMessage.hidden = true;

  try {
    const isAdded = await addProductToCart(currentProduct, selectedQuantity);

    if (isAdded === false) {
      return;
    }

    showAddToCartMessage(t("product.added"));
    updateProductQuantity(1);
  } catch {
    showAddToCartMessage(t("product.addFailed"), true);
  } finally {
    addToCartButton.disabled = false;
  }
}

function handleRequestSubmit(event) {
  event.preventDefault();

  if (!currentProduct) {
    return;
  }

  openPriceRequestModal({
    source: t("product.pageRequestSource"),
    productId: getNumericProductId(currentProduct.id),
    productTitle: currentProduct.title,
    initialValues: {
      name: nameInput.value,
      phone: phoneInput.value,
      email: emailInput.value,
    },
  });
}

async function initProductPage() {
  if (!productId) {
    showProductNotFound();
    return;
  }

  try {
    const product = await getProductById(productId);
    let products = [product];

    try {
      products = await getProducts();
    } catch {
      products = [product];
    }

    renderProduct(product, products);
  } catch {
    showProductNotFound();
  }
}

addToCartButton.addEventListener("click", handleAddToCart);
productQuantityControls.forEach((button) => {
  button.addEventListener("click", handleProductQuantityStep);
});
calculatorRolls.addEventListener("input", handleCalculatorInput);
calculatorPacks.addEventListener("input", handleCalculatorInput);
calculator.addEventListener("click", handleCalculatorStep);
requestForm.addEventListener("submit", handleRequestSubmit);
window.addEventListener("i18n:changed", () => {
  if (currentProduct) {
    currentVariants = getProductVariants(currentProduct, currentProducts);
    renderSelectedVariant();
  }
});

updateProductQuantity(1);
initProductPage();
