import { createContactRequest } from "../api/api.js";
import { validateRequestFields } from "../common/request-validation.js";

const contactForm = document.querySelector("[data-contact-form]");
const nameInput = document.querySelector("[data-contact-name]");
const phoneInput = document.querySelector("[data-contact-phone]");
const emailInput = document.querySelector("[data-contact-email]");
const nameError = document.querySelector("[data-error-name]");
const phoneError = document.querySelector("[data-error-phone]");
const emailError = document.querySelector("[data-error-email]");
const contactMessage = document.querySelector("[data-contact-message]");
const submitButton = contactForm?.querySelector("button[type='submit']");

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

function showContactMessage(text, isError = false) {
  contactMessage.textContent = text;
  contactMessage.hidden = false;
  contactMessage.classList.toggle("is-error", isError);
}

function clearContactMessage() {
  contactMessage.textContent = "";
  contactMessage.hidden = true;
  contactMessage.classList.remove("is-error");
}

function validateContactForm() {
  const validation = validateRequestFields({
    name: nameInput.value,
    phone: phoneInput.value,
    email: emailInput.value,
  });

  clearFieldError(nameInput, nameError);
  clearFieldError(phoneInput, phoneError);
  clearFieldError(emailInput, emailError);
  clearContactMessage();

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

async function handleContactSubmit(event) {
  event.preventDefault();

  const validation = validateContactForm();

  if (!validation.isValid) {
    return;
  }

  const requestData = {
    name: validation.values.name,
    phone: validation.values.phone,
    email: validation.values.email,
    source: "Контакты",
    createdAt: new Date().toISOString(),
  };

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    await createContactRequest(requestData);
    contactForm.reset();
    showContactMessage("Заявка успешно отправлена");
  } catch {
    showContactMessage("Не удалось отправить заявку. Попробуйте позже.", true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

if (contactForm) {
  contactForm.addEventListener("submit", handleContactSubmit);
}
