import { createDeliveryQuestion } from "../api/api.js";
import { t } from "../common/i18n.js";

const deliveryForm = document.querySelector("[data-delivery-form]");
const nameInput = document.querySelector("[data-delivery-name]");
const phoneInput = document.querySelector("[data-delivery-phone]");
const nameError = document.querySelector("[data-error-name]");
const phoneError = document.querySelector("[data-error-phone]");
const deliveryMessage = document.querySelector("[data-delivery-message]");
const submitButton = deliveryForm?.querySelector("button[type='submit']");

const ERROR_MESSAGES = {
  name: "validation.name",
  phone: "validation.phone",
};

function normalizePhone(phone) {
  return phone
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^\+/, "");
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

function showDeliveryMessage(text, isError = false) {
  deliveryMessage.textContent = text;
  deliveryMessage.hidden = false;
  deliveryMessage.classList.toggle("is-error", isError);
}

function clearDeliveryMessage() {
  deliveryMessage.textContent = "";
  deliveryMessage.hidden = true;
  deliveryMessage.classList.remove("is-error");
}

function validateDeliveryForm() {
  const values = {
    name: nameInput.value.trim(),
    phone: normalizePhone(phoneInput.value),
  };
  const errors = {};

  clearFieldError(nameInput, nameError);
  clearFieldError(phoneInput, phoneError);
  clearDeliveryMessage();

  if (values.name.length < 2) {
    errors.name = t(ERROR_MESSAGES.name);
  }

  if (!/^375(25|29|33|44)\d{7}$/.test(values.phone)) {
    errors.phone = t(ERROR_MESSAGES.phone);
  }

  if (errors.name) {
    showFieldError(nameInput, nameError, errors.name);
  }

  if (errors.phone) {
    showFieldError(phoneInput, phoneError, errors.phone);
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values: {
      name: values.name,
      phone: values.phone ? `+${values.phone}` : "",
    },
  };
}

async function handleDeliverySubmit(event) {
  event.preventDefault();

  const validation = validateDeliveryForm();

  if (!validation.isValid) {
    return;
  }

  const questionData = {
    name: validation.values.name,
    phone: validation.values.phone,
    source: t("Доставка и оплата"),
    createdAt: new Date().toISOString(),
  };

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    await createDeliveryQuestion(questionData);
    deliveryForm.reset();
    showDeliveryMessage(t("common.requestSuccess"));
  } catch {
    showDeliveryMessage(t("common.requestFailed"), true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

if (deliveryForm) {
  deliveryForm.addEventListener("submit", handleDeliverySubmit);
}
