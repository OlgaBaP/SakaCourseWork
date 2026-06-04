import { createPriceRequest, getProducts } from "../api/api.js";
import { t } from "../common/i18n.js";
import { validateRequestFields } from "../common/request-validation.js";

const requestForm = document.querySelector("[data-request-form]");
const nameInput = document.querySelector("[data-request-name]");
const phoneInput = document.querySelector("[data-request-phone]");
const emailInput = document.querySelector("[data-request-email]");
const nameError = document.querySelector("[data-error-name]");
const phoneError = document.querySelector("[data-error-phone]");
const emailError = document.querySelector("[data-error-email]");
const requestMessage = document.querySelector("[data-request-message]");
const heroTitle = document.querySelector("[data-hero-title]");
const heroImage = document.querySelector("[data-hero-image]");
const heroCounter = document.querySelector("[data-hero-counter]");
const heroLines = document.querySelectorAll("[data-hero-slide]");

const heroSlides = [
  {
    title:
      "Большой выбор качественных тканей для производства и пошива одежды",
    image: "assets/images/banners/hero-fabrics.png",
  },
  {
    title: "Лёгкие ткани для стильных и воздушных коллекций",
    image: "assets/images/banners/hero-white-fabric-model.png",
  },
  {
    title:
      "Качественные полотна для летней и повседневной одежды",
    image: "assets/images/banners/hero-white-fabric-outdoor.png",
  },
  {
    title: "Пастельная палитра тканей для уютных изделий",
    image: "assets/images/banners/hero-fabric-stack-pastel.png",
  },
  {
    title: "Подберите ткань под цвет и стиль вашего бренда",
    image: "assets/images/banners/hero-fabric-swatches-hand.png",
  },
  {
    title: "Мягкие оттенки для современных коллекций одежды",
    image: "assets/images/banners/hero-fabric-palette-soft.png",
  },
];

let activeHeroSlide = 0;
let heroSliderTimer = null;

function formatSlideNumber(index) {
  return String(index + 1).padStart(2, "0");
}

function renderHeroSlide(index) {
  if (!heroTitle || !heroImage || !heroCounter || heroLines.length === 0) {
    return;
  }

  activeHeroSlide = index;
  const slide = heroSlides[activeHeroSlide];

  heroTitle.textContent = t(slide.title);
  heroImage.src = slide.image;
  heroCounter.innerHTML = `<b>${formatSlideNumber(activeHeroSlide)}</b> / ${formatSlideNumber(heroSlides.length)}`;

  heroLines.forEach((line) => {
    const isActive = Number(line.dataset.heroSlide) === activeHeroSlide;
    line.classList.toggle("hero-slider__line--active", isActive);
  });
}

function showNextHeroSlide() {
  renderHeroSlide((activeHeroSlide + 1) % heroSlides.length);
}

function restartHeroSlider() {
  window.clearInterval(heroSliderTimer);
  heroSliderTimer = window.setInterval(showNextHeroSlide, 5000);
}

function initHeroSlider() {
  if (!heroTitle || !heroImage || heroLines.length === 0) {
    return;
  }

  heroLines.forEach((line) => {
    line.addEventListener("click", () => {
      renderHeroSlide(Number(line.dataset.heroSlide));
      restartHeroSlider();
    });
  });

  renderHeroSlide(0);
  restartHeroSlider();
}

async function loadProducts() {
  try {
    await getProducts();
  } catch {
    return;
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

  if (!validation.isValid) {
    return;
  }

  const requestData = {
    name: validation.values.name,
    phone: validation.values.phone,
    email: validation.values.email,
    source: t("home.requestSource"),
    createdAt: new Date().toISOString(),
  };

  try {
    await createPriceRequest(requestData);
    requestForm.reset();
    showRequestMessage(t("common.requestSuccess"));
  } catch {
    showRequestMessage(t("common.requestFailed"), true);
  }
}

loadProducts();
initHeroSlider();
window.addEventListener("i18n:changed", () => {
  renderHeroSlide(activeHeroSlide);
});

if (requestForm) {
  requestForm.addEventListener("submit", handleRequestSubmit);
}
