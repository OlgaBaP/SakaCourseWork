import { getUserById, updateUser } from "../api/api.js";
import {
  clearCurrentUser,
  getCurrentUser,
  saveCurrentUser,
  updateAuthLinks,
} from "../common/auth-state.js";

const PHONE_PATTERN = /^375(25|29|33|44)\d{7}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const guestSection = document.querySelector("[data-account-guest]");
const profileSection = document.querySelector("[data-account-profile]");
const messageElement = document.querySelector("[data-account-message]");
const form = document.querySelector("[data-account-form]");
const avatarElement = document.querySelector("[data-account-avatar]");
const avatarInput = document.querySelector("[data-account-avatar-input]");

let currentUserData = null;
let avatarValue = "";

const FIELD_NAMES = {
  city: "city",
  email: "email",
  firstName: "first-name",
  lastName: "last-name",
  middleName: "middle-name",
  phone: "phone",
};

function normalizePhone(phone) {
  return String(phone || "")
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^\+/, "");
}

function getInitials(user) {
  const parts = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const value = parts || user.fullName || user.name || user.email || "ST";

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function showMessage(text, isError = false) {
  if (!messageElement) {
    return;
  }

  messageElement.textContent = text;
  messageElement.hidden = !text;
  messageElement.classList.toggle("is-error", isError);
}

function setField(name, value) {
  const input = form.querySelector(`[data-account-${name}]`);

  if (input) {
    input.value = value || "";
  }
}

function getField(name) {
  return form.querySelector(`[data-account-${name}]`);
}

function setError(name, message) {
  const input = getField(FIELD_NAMES[name] || name);
  const error = form.querySelector(`[data-account-error="${name}"]`);

  if (input) {
    input.classList.toggle("input-error", Boolean(message));
  }

  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
}

function clearErrors() {
  ["lastName", "firstName", "middleName", "phone", "email", "city"].forEach((name) => {
    setError(name, "");
  });
  showMessage("");
}

function renderAvatar(user) {
  avatarElement.innerHTML = "";

  if (user.avatar) {
    const image = document.createElement("img");
    image.src = user.avatar;
    image.alt = "";
    avatarElement.append(image);
    return;
  }

  avatarElement.textContent = getInitials(user);
}

function renderUser(user) {
  currentUserData = user;
  avatarValue = user.avatar || "";
  guestSection.hidden = true;
  profileSection.hidden = false;
  renderAvatar(user);
  setField("last-name", user.lastName);
  setField("first-name", user.firstName);
  setField("middle-name", user.middleName);
  setField("phone", user.phone);
  setField("email", user.email);
  setField("city", user.city);
}

function showGuest() {
  currentUserData = null;
  guestSection.hidden = false;
  profileSection.hidden = true;
}

function validateForm() {
  clearErrors();

  const lastName = getField("last-name").value.trim();
  const firstName = getField("first-name").value.trim();
  const middleName = getField("middle-name").value.trim();
  const phone = normalizePhone(getField("phone").value);
  const email = getField("email").value.trim().toLowerCase();
  let isValid = true;

  if (lastName.length < 2) {
    setError("lastName", "Введите фамилию");
    isValid = false;
  }

  if (firstName.length < 2) {
    setError("firstName", "Введите имя");
    isValid = false;
  }

  if (middleName && middleName.length < 2) {
    setError("middleName", "Введите корректное отчество");
    isValid = false;
  }

  if (!PHONE_PATTERN.test(phone)) {
    setError("phone", "Введите белорусский номер телефона");
    isValid = false;
  }

  if (!EMAIL_PATTERN.test(email)) {
    setError("email", "Введите корректный E-mail");
    isValid = false;
  }

  return {
    isValid,
    values: {
      lastName,
      firstName,
      middleName,
      phone: phone ? `+${phone}` : "",
      email,
      city: getField("city").value.trim(),
    },
  };
}

async function initAccount() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    showGuest();
    return;
  }

  try {
    const user = await getUserById(currentUser.id);
    saveCurrentUser(user);
    updateAuthLinks();
    renderUser(user);
  } catch {
    clearCurrentUser();
    updateAuthLinks();
    showGuest();
    showMessage("Войдите в аккаунт", true);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!currentUserData) {
    return;
  }

  const validation = validateForm();

  if (!validation.isValid) {
    return;
  }

  const data = {
    ...validation.values,
    fullName: [
      validation.values.lastName,
      validation.values.firstName,
      validation.values.middleName,
    ]
      .filter(Boolean)
      .join(" "),
    avatar: avatarValue,
  };
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;

  try {
    const updatedUser = await updateUser(currentUserData.id, data);
    saveCurrentUser(updatedUser);
    updateAuthLinks();
    renderUser(updatedUser);
    showMessage("Данные сохранены");
  } catch {
    showMessage("Не удалось сохранить данные. Попробуйте позже.", true);
  } finally {
    submitButton.disabled = false;
  }
}

function handleAvatarChange() {
  const file = avatarInput.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    avatarValue = String(reader.result || "");
    renderAvatar({
      ...currentUserData,
      avatar: avatarValue,
    });
  });
  reader.readAsDataURL(file);
}

form.addEventListener("submit", handleSubmit);
avatarInput.addEventListener("change", handleAvatarChange);
window.addEventListener("auth:changed", () => {
  initAccount();
});

initAccount();
