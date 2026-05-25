import { createPriceRequest, getProductById, getProducts } from "../api/api.js";

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
const calculatorProduct = document.querySelector("[data-calculator-product]");
const calculatorImage = document.querySelector("[data-calculator-image]");

const requestForm = document.querySelector("[data-request-form]");
const nameInput = document.querySelector("[data-request-name]");
const phoneInput = document.querySelector("[data-request-phone]");
const emailInput = document.querySelector("[data-request-email]");
const nameError = document.querySelector("[data-error-name]");
const phoneError = document.querySelector("[data-error-phone]");
const emailError = document.querySelector("[data-error-email]");
const requestMessage = document.querySelector("[data-request-message]");

let currentProduct = null;

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
  return `${String(price).replace(".", ",")} P`;
}

function getImagePath(image) {
  if (!image) {
    return "";
  }

  return image.startsWith("http") ? image : `../${image}`;
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
  calculatorImage.src = getImagePath(product.image);
  calculatorImage.alt = `${product.title} ${product.color}`;

  productMessage.hidden = true;
  productContent.hidden = false;
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

function isBelarusPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return /^375(25|29|33|44)\d{7}$/.test(digits);
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm() {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  let isValid = true;

  clearFieldError(nameInput, nameError);
  clearFieldError(phoneInput, phoneError);
  clearFieldError(emailInput, emailError);
  clearRequestMessage();

  if (name.length < 2) {
    showFieldError(nameInput, nameError, "Введите имя");
    isValid = false;
  }

  if (!isBelarusPhone(phone)) {
    showFieldError(
      phoneInput,
      phoneError,
      "Введите белорусский номер телефона",
    );
    isValid = false;
  }

  if (!isEmailValid(email)) {
    showFieldError(emailInput, emailError, "Введите корректный E-mail");
    isValid = false;
  }

  return isValid;
}

async function handleRequestSubmit(event) {
  event.preventDefault();

  if (!currentProduct || !validateForm()) {
    return;
  }

  const requestData = {
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    productId: currentProduct.id,
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

requestForm.addEventListener("submit", handleRequestSubmit);

initProductPage();
