import { createDeliveryQuestion } from "../api/api.js";
import { t } from "../common/i18n.js";

const deliveryForm = document.querySelector("[data-delivery-form]");
const nameInput = document.querySelector("[data-delivery-name]");
const phoneInput = document.querySelector("[data-delivery-phone]");
const topicInput = document.querySelector("[data-delivery-topic]");
const questionInput = document.querySelector("[data-delivery-question]");
const nameError = document.querySelector("[data-error-name]");
const phoneError = document.querySelector("[data-error-phone]");
const topicError = document.querySelector("[data-error-topic]");
const questionError = document.querySelector("[data-error-question]");
const deliveryMessage = document.querySelector("[data-delivery-message]");
const submitButton = deliveryForm?.querySelector("button[type='submit']");

const ERROR_MESSAGES = {
  name: "delivery.validationName",
  phone: "validation.phone",
  topic: "delivery.validationTopic",
  questionRequired: "delivery.validationQuestionRequired",
  questionLength: "delivery.validationQuestionLength",
};

function normalizePhone(phone) {
  return phone
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^\+/, "");
}

function showFieldError(input, errorElement, message) {
  input.classList.add("input-error");
  input.setAttribute("aria-invalid", "true");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearFieldError(input, errorElement) {
  input.classList.remove("input-error");
  input.removeAttribute("aria-invalid");
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
    topic: topicInput.value,
    question: questionInput.value.trim(),
  };
  const errors = {};

  clearFieldError(nameInput, nameError);
  clearFieldError(phoneInput, phoneError);
  clearFieldError(topicInput, topicError);
  clearFieldError(questionInput, questionError);
  clearDeliveryMessage();

  if (values.name.length < 2) {
    errors.name = t(ERROR_MESSAGES.name);
  }

  if (!/^375(25|29|33|44)\d{7}$/.test(values.phone)) {
    errors.phone = t(ERROR_MESSAGES.phone);
  }

  if (!values.topic) {
    errors.topic = t(ERROR_MESSAGES.topic);
  }

  if (!values.question) {
    errors.question = t(ERROR_MESSAGES.questionRequired);
  } else if (values.question.length < 10 || values.question.length > 500) {
    errors.question = t(ERROR_MESSAGES.questionLength);
  }

  if (errors.name) {
    showFieldError(nameInput, nameError, errors.name);
  }

  if (errors.phone) {
    showFieldError(phoneInput, phoneError, errors.phone);
  }

  if (errors.topic) {
    showFieldError(topicInput, topicError, errors.topic);
  }

  if (errors.question) {
    showFieldError(questionInput, questionError, errors.question);
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values: {
      name: values.name,
      phone: values.phone ? `+${values.phone}` : "",
      topic: values.topic,
      question: values.question,
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
    topic: validation.values.topic,
    question: validation.values.question,
    createdAt: new Date().toISOString(),
  };

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    await createDeliveryQuestion(questionData);
    deliveryForm.reset();
    showDeliveryMessage(t("delivery.success"));
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

  [
    [nameInput, nameError],
    [phoneInput, phoneError],
    [topicInput, topicError],
    [questionInput, questionError],
  ].forEach(([input, errorElement]) => {
    const eventName = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(eventName, () => {
      clearFieldError(input, errorElement);
      clearDeliveryMessage();
    });
  });
}
