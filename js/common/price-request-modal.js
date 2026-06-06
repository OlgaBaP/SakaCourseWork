import { createPriceRequest } from "../api/api.js";
import { t, translatePage } from "./i18n.js";
import { validateRequestFields } from "./request-validation.js";

const MODAL_OPEN_CLASS = "price-request-modal-opened";
const CLOSE_DELAY = 900;

let modal = null;
let form = null;
let activeContext = {};
let closeTimer = null;

function getAssetPath(path) {
  return window.location.pathname.includes("/pages/") ? `../${path}` : path;
}

function ensureStyles() {
  if (document.querySelector("[data-price-request-style]")) {
    return;
  }

  const style = document.createElement("style");
  style.dataset.priceRequestStyle = "";
  style.textContent = `
    .price-request-modal-opened { overflow: hidden; }
    .price-request-modal { position: fixed; inset: 0; z-index: 130; display: flex; align-items: center; justify-content: center; padding: 40px; background: rgba(25,36,47,.8); color: #19242f; }
    .price-request-modal[hidden] { display: none; }
    .price-request-modal__overlay { position: absolute; inset: 0; border: 0; background: transparent; }
    .price-request-modal__panel { position: relative; z-index: 1; display: grid; grid-template-columns: 420px 1fr; width: 960px; min-height: 588px; max-height: calc(100vh - 80px); overflow: hidden; border-radius: 16px; background: #f8f8f8; }
    .price-request-modal__content { display: flex; flex-direction: column; padding: 50px 40px 44px 58px; }
    .price-request-modal__title { margin: 0 0 8px; color: #19242f; font-size: 24px; font-weight: 600; line-height: 1.334; letter-spacing: .48px; }
    .price-request-modal__lead { margin: 0 0 26px; color: #19242f; font-size: 14px; font-weight: 400; line-height: 1.859; letter-spacing: .28px; }
    .price-request-modal__form { display: grid; gap: 10px; }
    .price-request-modal__field { display: grid; gap: 4px; }
    .price-request-modal__field input { width: 100%; height: 50px; padding: 0 20px; border: 1px solid transparent; border-radius: 16px; outline: none; background: #fff; color: #19242f; font: inherit; font-size: 14px; font-weight: 400; line-height: 1.514; letter-spacing: .28px; }
    .price-request-modal__field input::placeholder { color: rgba(25,36,47,.5); opacity: 1; }
    .price-request-modal__field input.input-error { border-color: #b84747; background: #fff7f5; }
    .price-request-modal__error { min-height: 13px; color: #b84747; font-size: 10px; font-weight: 600; line-height: 1.3; letter-spacing: .2px; }
    .price-request-modal__submit { width: 320px; min-height: 55px; margin: 18px 0 0; padding: 0 30px; border: 0; border-radius: 100px; background: #dbc08d; color: #19242f; font-size: 16px; font-weight: 700; line-height: 1.334; letter-spacing: .4px; }
    .price-request-modal__submit:disabled { opacity: .6; cursor: default; }
    .price-request-modal__agree { width: 320px; margin: 14px 0 0; color: rgba(25,36,47,.5); font-size: 10px; font-weight: 400; line-height: 1.774; letter-spacing: .2px; }
    .price-request-modal__message { margin: 10px 0 0; color: #2f7a46; font-size: 12px; font-weight: 700; line-height: 1.334; }
    .price-request-modal__message.is-error { color: #b84747; }
    .price-request-modal__image { position: relative; min-height: 588px; overflow: hidden; }
    .price-request-modal__image::before { content: ""; position: absolute; inset: 0 auto 0 -76px; z-index: 1; width: 132px; background: #f8f8f8; transform: skewX(-8deg); transform-origin: 0 100%; }
    .price-request-modal__image img { width: 100%; height: 100%; object-fit: cover; }
    .price-request-modal__close { position: absolute; top: 15px; right: 15px; z-index: 2; width: 32px; height: 32px; border: 0; background: transparent; }
    .price-request-modal__close::before, .price-request-modal__close::after { content: ""; position: absolute; top: 15px; left: 2px; width: 28px; height: 2px; background: #fff; }
    .price-request-modal__close::before { transform: rotate(45deg); }
    .price-request-modal__close::after { transform: rotate(-45deg); }
    @media (max-width: 1399px) {
      .price-request-modal { padding: 82px 20px; align-items: flex-start; }
      .price-request-modal__panel { display: block; width: 360px; min-height: 0; max-height: calc(100vh - 40px); overflow-y: auto; }
      .price-request-modal__content { align-items: center; padding: 40px 30px 46px; text-align: center; }
      .price-request-modal__title { width: 230px; font-size: 20px; letter-spacing: .4px; }
      .price-request-modal__lead { width: 316px; margin-bottom: 24px; font-size: 12px; letter-spacing: .24px; }
      .price-request-modal__form, .price-request-modal__field, .price-request-modal__field input, .price-request-modal__submit { width: 300px; }
      .price-request-modal__field input { height: 60px; }
      .price-request-modal__submit { margin-top: 20px; }
      .price-request-modal__agree { width: 296px; text-align: center; }
      .price-request-modal__image { display: none; }
      .price-request-modal__close { top: 10px; right: 10px; }
      .price-request-modal__close::before, .price-request-modal__close::after { background: rgba(25,36,47,.2); }
    }
    @media (max-width: 479px) {
      .price-request-modal { padding: 40px 30px; }
      .price-request-modal__panel { width: 300px; }
      .price-request-modal__content { padding: 40px 20px 44px; }
      .price-request-modal__lead { width: 260px; margin-bottom: 22px; }
      .price-request-modal__form, .price-request-modal__field, .price-request-modal__field input, .price-request-modal__submit, .price-request-modal__agree { width: 260px; }
      .price-request-modal__close { top: 10px; right: -24px; }
    }
  `;
  document.head.append(style);
}

function createField(name, type, placeholderKey, autocomplete) {
  return `
    <label class="price-request-modal__field" data-price-field="${name}">
      <input type="${type}" name="${name}" placeholder="${t(placeholderKey)}" autocomplete="${autocomplete}" data-i18n-placeholder="${placeholderKey}" data-price-input="${name}" />
      <span class="price-request-modal__error" data-price-error="${name}" hidden></span>
    </label>
  `;
}

function createModal() {
  if (modal) {
    return modal;
  }

  ensureStyles();
  modal = document.createElement("div");
  modal.className = "price-request-modal";
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("data-price-request-modal", "");
  modal.innerHTML = `
    <button class="price-request-modal__overlay" type="button" aria-label="${t("common.close")}" data-i18n-aria-label="common.close" data-price-request-close></button>
    <section class="price-request-modal__panel" role="dialog" aria-modal="true" aria-labelledby="price-request-title">
      <button class="price-request-modal__close" type="button" aria-label="${t("common.close")}" data-i18n-aria-label="common.close" data-price-request-close></button>
      <div class="price-request-modal__content">
        <h2 class="price-request-modal__title" id="price-request-title" data-i18n="price.title">${t("price.title")}</h2>
        <p class="price-request-modal__lead" data-i18n="price.lead">${t("price.lead")}</p>
        <form class="price-request-modal__form" data-price-request-form novalidate>
          ${createField("name", "text", "price.name", "name")}
          ${createField("email", "email", "E-Mail", "email")}
          ${createField("phone", "tel", "+375 (__) ___-__-__", "tel")}
          ${createField("address", "text", "price.address", "street-address")}
          <button class="price-request-modal__submit" type="submit" data-i18n="price.submit">${t("price.submit")}</button>
          <p class="price-request-modal__agree" data-i18n="price.agree">${t("price.agree")}</p>
          <p class="price-request-modal__message" data-price-request-message hidden></p>
        </form>
      </div>
      <div class="price-request-modal__image" aria-hidden="true">
        <img src="${getAssetPath("assets/images/banners/heroo.jpg")}" alt="" />
      </div>
    </section>
  `;

  document.body.append(modal);
  translatePage(modal);
  form = modal.querySelector("[data-price-request-form]");
  form.addEventListener("submit", handleSubmit);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-price-request-close]")) {
      closePriceRequestModal();
    }
  });

  return modal;
}

function getField(name) {
  return form.querySelector(`[data-price-input="${name}"]`);
}

function getError(name) {
  return form.querySelector(`[data-price-error="${name}"]`);
}

function showFieldError(name, message) {
  const input = getField(name);
  const error = getError(name);

  input.classList.add("input-error");
  error.textContent = message;
  error.hidden = false;
}

function clearFieldErrors() {
  form.querySelectorAll("[data-price-input]").forEach((input) => {
    input.classList.remove("input-error");
  });
  form.querySelectorAll("[data-price-error]").forEach((error) => {
    error.textContent = "";
    error.hidden = true;
  });
}

function showMessage(text, isError = false) {
  const message = form.querySelector("[data-price-request-message]");
  message.textContent = text;
  message.hidden = false;
  message.classList.toggle("is-error", isError);
}

function clearMessage() {
  const message = form.querySelector("[data-price-request-message]");
  message.textContent = "";
  message.hidden = true;
  message.classList.remove("is-error");
}

function fillInitialValues(values = {}) {
  ["name", "email", "phone", "address"].forEach((name) => {
    getField(name).value = values[name] || "";
  });
}

function openPriceRequestModal(context = {}) {
  createModal();
  window.clearTimeout(closeTimer);
  activeContext = { ...context };
  clearFieldErrors();
  clearMessage();
  form.reset();
  fillInitialValues(context.initialValues);
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add(MODAL_OPEN_CLASS);
  getField("name").focus();
}

function closePriceRequestModal() {
  if (!modal) {
    return;
  }

  window.clearTimeout(closeTimer);
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove(MODAL_OPEN_CLASS);
  activeContext = {};
}

function getFormValues() {
  return {
    name: getField("name").value,
    email: getField("email").value,
    phone: getField("phone").value,
    address: getField("address").value,
  };
}

async function handleSubmit(event) {
  event.preventDefault();

  clearFieldErrors();
  clearMessage();

  const validation = validateRequestFields(getFormValues());

  if (!validation.isValid) {
    Object.entries(validation.errors).forEach(([name, message]) => {
      showFieldError(name, message);
    });
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  const requestData = {
    name: validation.values.name,
    phone: validation.values.phone,
    email: validation.values.email,
    address: validation.values.address,
    source: activeContext.source || t("price.source"),
    createdAt: new Date().toISOString(),
  };

  if (activeContext.productId) {
    requestData.productId = activeContext.productId;
  }

  if (activeContext.productTitle) {
    requestData.productTitle = activeContext.productTitle;
  }

  submitButton.disabled = true;

  try {
    await createPriceRequest(requestData);
    form.reset();
    showMessage(t("common.requestSuccess"));
    closeTimer = window.setTimeout(closePriceRequestModal, CLOSE_DELAY);
  } catch {
    showMessage(t("common.requestFailed"), true);
  } finally {
    submitButton.disabled = false;
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.hidden) {
    closePriceRequestModal();
  }
});

window.addEventListener("price-request:open", (event) => {
  openPriceRequestModal(event.detail || {});
});

window.addEventListener("i18n:changed", () => {
  if (modal) {
    translatePage(modal);
  }
});

export { closePriceRequestModal, openPriceRequestModal };
