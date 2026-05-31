import { createPriceRequest, getProductById, getProducts } from "../api/api.js";
import { addProductToCart } from "../common/cart.js";
import { validateRequestFields } from "../common/request-validation.js";

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
const calculatorTotalSum = document.querySelector("[data-calculator-total-sum]");

const requestForm = document.querySelector("[data-request-form]");
const nameInput = document.querySelector("[data-request-name]");
const phoneInput = document.querySelector("[data-request-phone]");
const emailInput = document.querySelector("[data-request-email]");
const nameError = document.querySelector("[data-error-name]");
const phoneError = document.querySelector("[data-error-phone]");
const emailError = document.querySelector("[data-error-email]");
const requestMessage = document.querySelector("[data-request-message]");

let currentProduct = null;

const ROLL_WEIGHT = 20;
const PACK_WEIGHT = 2;

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
  productMessage.textContent = "Товар не найден";
  productBreadcrumb.textContent = "Товар не найден";
  document.title = "Товар не найден | Saka Tekstil";
}

function setMainImage(product) {
  productImage.src = getImagePath(product.image);
  productImage.alt = `${product.title} ${product.color}`;
}

function renderThumbnails(thumbnails) {
  thumbnailsList.innerHTML = "";

  thumbnails.forEach((product, index) => {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.className = "product-thumb";
    button.type = "button";
    button.setAttribute("aria-label", `${product.title} ${product.color}`);

    if (index === 0) {
      button.classList.add("product-thumb--active");
    }

    image.src = getImagePath(product.image);
    image.alt = "";

    button.append(image);
    button.addEventListener("click", () => {
      setMainImage(product);
      thumbnailsList
        .querySelectorAll(".product-thumb")
        .forEach((thumb) => thumb.classList.remove("product-thumb--active"));
      button.classList.add("product-thumb--active");
    });

    thumbnailsList.append(button);
  });
}

function renderColorSwatches(products) {
  const colors = [...new Set(products.map((product) => product.color))];

  productColors.innerHTML = "";

  colors.forEach((color) => {
    const swatch = document.createElement("span");
    swatch.className = "color-swatch";
    swatch.title = color;
    swatch.style.setProperty("--swatch-color", colorMap[color] || "#d9d9d9");
    productColors.append(swatch);
  });
}

function renderSpecs(product) {
  const specs = [
    ["Материал:", product.category],
    ["Качество:", product.quality],
    ["Состав:", product.composition],
    ["Цвет:", product.color],
    ["Плотность:", product.density],
    ["Ширина рулона:", product.width],
    ["Производство:", "Турция"],
  ];

  productSpecs.innerHTML = "";

  specs.forEach(([label, value]) => {
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = label;
    description.textContent = value || "Не указано";

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
  calculatorWeight.textContent = `${weight} кг`;
  calculatorSum.textContent = formatPrice(total);
  calculatorTotalWeight.textContent = `${weight} кг`;
  calculatorTotalSum.textContent = formatPrice(total);
}

function renderProduct(product, products) {
  const sameCategoryProducts = products.filter(
    (item) => item.category === product.category,
  );
  const thumbnails = [
    product,
    ...sameCategoryProducts.filter((item) => item.id !== product.id),
  ].slice(0, 4);

  currentProduct = product;
  productBreadcrumb.textContent = product.title;
  productTitle.textContent = product.title;
  productPrice.textContent = formatPrice(product.price);
  productColor.textContent = product.color;
  document.title = `${product.title} | Saka Tekstil`;

  setMainImage(product);
  renderThumbnails(thumbnails);
  renderColorSwatches(
    sameCategoryProducts.length > 0 ? sameCategoryProducts : [product],
  );
  renderSpecs(product);

  calculatorProduct.textContent = product.title;
  calculatorTotalProduct.textContent = product.title;
  calculatorImage.src = getImagePath(product.image);
  calculatorImage.alt = `${product.title} ${product.color}`;
  updateCalculator();

  productMessage.hidden = true;
  productContent.hidden = false;
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
    button.dataset.calculatorStep === "rolls" ? calculatorRolls : calculatorPacks;
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
    await addProductToCart(currentProduct);
    showAddToCartMessage("Товар добавлен в корзину");
  } catch {
    showAddToCartMessage("Не удалось добавить товар в корзину", true);
  } finally {
    addToCartButton.disabled = false;
  }
}

function showFieldError(input, errorElement, message) {
  input.classList.add("input-error");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearFieldError(input, errorElement) {
  input.classList.remove("input-error");
  errorElement.textContent = "";
  errorElement.hidden = true;
}

function showRequestMessage(text, isError = false) {
  requestMessage.textContent = text;
  requestMessage.hidden = false;
  requestMessage.classList.toggle("is-error", isError);
}

function clearRequestMessage() {
  requestMessage.textContent = "";
  requestMessage.hidden = true;
  requestMessage.classList.remove("is-error");
}

function validateForm() {
  const validation = validateRequestFields({
    name: nameInput.value,
    phone: phoneInput.value,
    email: emailInput.value,
  });

  clearFieldError(nameInput, nameError);
  clearFieldError(phoneInput, phoneError);
  clearFieldError(emailInput, emailError);
  clearRequestMessage();

  if (validation.errors.name) {
    showFieldError(nameInput, nameError, validation.errors.name);
  }

  if (validation.errors.phone) {
    showFieldError(phoneInput, phoneError, validation.errors.phone);
  }

  if (validation.errors.email) {
    showFieldError(emailInput, emailError, validation.errors.email);
  }

  return validation;
}

async function handleRequestSubmit(event) {
  event.preventDefault();

  const validation = validateForm();

  if (!currentProduct || !validation.isValid) {
    return;
  }

  const requestData = {
    name: validation.values.name,
    phone: validation.values.phone,
    email: validation.values.email,
    productId: getNumericProductId(currentProduct.id),
    productTitle: currentProduct.title,
    createdAt: new Date().toISOString(),
  };

  try {
    await createPriceRequest(requestData);
    requestForm.reset();
    showRequestMessage("Заявка успешно отправлена");
  } catch {
    showRequestMessage("Не удалось отправить заявку. Попробуйте позже.", true);
  }
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
calculatorRolls.addEventListener("input", handleCalculatorInput);
calculatorPacks.addEventListener("input", handleCalculatorInput);
calculator.addEventListener("click", handleCalculatorStep);
requestForm.addEventListener("submit", handleRequestSubmit);

initProductPage();
