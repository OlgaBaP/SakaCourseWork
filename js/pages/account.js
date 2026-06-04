import { getUserById, updateUser } from "../api/api.js";
import {
  clearCurrentUser,
  getCurrentUser,
  saveCurrentUser,
  updateAuthLinks,
} from "../common/auth-state.js";
import { resetLanguage, t } from "../common/i18n.js";
import { resetTheme } from "../common/theme.js";

const PHONE_PATTERN = /^375(25|29|33|44)\d{7}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_SIDE = 512;
const MAX_AVATAR_DATA_URL_LENGTH = 250000;

const profileSection = document.querySelector("[data-account-profile]");
const messageElement = document.querySelector("[data-account-message]");
const form = document.querySelector("[data-account-form]");
const avatarElement = document.querySelector("[data-account-avatar]");
const avatarInput = document.querySelector("[data-account-avatar-input]");
const resetButton = document.querySelector("[data-account-reset]");
const ordersLink = document.querySelector("[data-account-orders-link]");

let currentUserData = null;
let avatarValue = "";
let activeEditor = null;
let hintTimer = null;

function normalizePhone(phone) {
  return String(phone || "")
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^\+/, "");
}

function getFullName(user = {}) {
  return (
    user.fullName ||
    [user.lastName, user.firstName, user.middleName].filter(Boolean).join(" ") ||
    user.name ||
    user.nickname ||
    ""
  ).trim();
}

function getInitials(user) {
  const value = getFullName(user) || user.email || "ST";

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

function getFieldElement(name) {
  return form.querySelector(`[data-account-field="${name}"]`);
}

function getValueButton(name) {
  return form.querySelector(`[data-account-edit="${name}"]`);
}

function setError(name, message) {
  const field = getFieldElement(name);
  const error = field?.querySelector("[data-account-error]");
  const input = field?.querySelector("input");

  if (input) {
    input.classList.toggle("input-error", Boolean(message));
  }

  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
}

function clearError(name) {
  setError(name, "");
}

function clearAllErrors() {
  ["fullName", "phone", "email", "city"].forEach(clearError);
}

function renderAvatar(user) {
  if (!avatarElement) {
    return;
  }

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

function setDisplayValue(name, value) {
  const button = getValueButton(name);

  if (!button) {
    return;
  }

  button.textContent = value || t("account.defaultValue");
}

function renderUser(user) {
  currentUserData = user;
  avatarValue = user.avatar || "";
  clearAllErrors();
  cancelActiveEditor();
  profileSection.hidden = false;
  renderAvatar(user);
  setDisplayValue("fullName", getFullName(user));
  setDisplayValue("phone", user.phone || "");
  setDisplayValue("email", user.email || "");
  setDisplayValue("city", user.city || t("account.defaultValue"));
  if (ordersLink) {
    ordersLink.textContent = user.role === "admin" ? t("account.ordersAdmin") : t("account.ordersUser");
  }
}

function redirectToLogin() {
  currentUserData = null;
  cancelActiveEditor();
  profileSection.hidden = true;
  window.location.replace("login.html");
}

function splitFullName(value) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const [lastName = "", firstName = "", ...middleParts] = parts;

  return {
    firstName,
    fullName: parts.join(" "),
    lastName,
    middleName: middleParts.join(" "),
  };
}

function createPatch(name, rawValue) {
  const value = String(rawValue || "").trim();

  if (name === "fullName") {
    const nameParts = splitFullName(value);

    if (nameParts.lastName.length < 2 || nameParts.firstName.length < 2) {
      return {
        error: t("account.invalidFullName"),
      };
    }

    return {
      data: nameParts,
    };
  }

  if (name === "phone") {
    const phone = normalizePhone(value);

    if (!PHONE_PATTERN.test(phone)) {
      return {
        error: t("account.invalidPhone"),
      };
    }

    return {
      data: {
        phone: `+${phone}`,
      },
    };
  }

  if (name === "email") {
    const email = value.toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      return {
        error: t("account.invalidEmail"),
      };
    }

    return {
      data: {
        email,
      },
    };
  }

  return {
    data: {
      city: value,
    },
  };
}

function getEditorValue(name) {
  if (name === "fullName") {
    return getFullName(currentUserData);
  }

  return currentUserData?.[name] || "";
}

function cancelActiveEditor() {
  if (!activeEditor) {
    return;
  }

  activeEditor.editor.remove();
  activeEditor.button.hidden = false;
  clearError(activeEditor.name);
  activeEditor = null;
}

async function saveField(name, input, saveButton) {
  const patch = createPatch(name, input.value);

  clearError(name);
  showMessage("");

  if (patch.error) {
    setError(name, patch.error);
    input.focus();
    return;
  }

  saveButton.disabled = true;

  try {
    const updatedUser = await updateUser(currentUserData.id, patch.data);
    const safeUser = saveCurrentUser(updatedUser);
    updateAuthLinks();
    renderUser({
      ...updatedUser,
      ...safeUser,
    });
    showMessage(t("account.dataSaved"));
  } catch {
    setError(name, t("account.saveFailed"));
    showMessage(t("account.saveFailedLong"), true);
    saveButton.disabled = false;
  }
}

function startEdit(name) {
  if (!currentUserData) {
    return;
  }

  cancelActiveEditor();
  clearError(name);
  showMessage("");

  const field = getFieldElement(name);
  const button = getValueButton(name);

  if (!field || !button) {
    return;
  }

  window.clearTimeout(hintTimer);
  field.classList.add("is-hint");
  hintTimer = window.setTimeout(() => {
    field.classList.remove("is-hint");
  }, 900);

  const editor = document.createElement("div");
  editor.className = "account-edit";
  editor.innerHTML = `
    <input type="${name === "email" ? "email" : name === "phone" ? "tel" : "text"}" />
    <span class="account-edit__actions">
      <button type="button" data-account-save>${t("Сохранить")}</button>
      <button type="button" data-account-cancel>${t("Отмена")}</button>
    </span>
  `;

  const input = editor.querySelector("input");
  const saveButton = editor.querySelector("[data-account-save]");
  const cancelButton = editor.querySelector("[data-account-cancel]");

  input.value = getEditorValue(name);
  button.hidden = true;
  button.after(editor);

  activeEditor = {
    button,
    editor,
    name,
  };

  saveButton.addEventListener("click", () => {
    saveField(name, input, saveButton);
  });

  cancelButton.addEventListener("click", () => {
    cancelActiveEditor();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveField(name, input, saveButton);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelActiveEditor();
    }
  });

  input.focus();
  input.select();
}

async function initAccount() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    redirectToLogin();
    return;
  }

  renderUser(currentUser);

  try {
    const user = await getUserById(currentUser.id);
    saveCurrentUser(user);
    updateAuthLinks();
    renderUser(user);
  } catch {
    clearCurrentUser();
    updateAuthLinks();
    redirectToLogin();
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.addEventListener("load", () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    });

    image.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    });

    image.src = objectUrl;
  });
}

function isAvatarValidationError(error) {
  return [
    t("account.chooseImage"),
    t("account.imageTooLarge"),
    t("account.imageProcessFailed"),
  ].includes(error.message);
}

async function compressAvatar(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error(t("account.chooseImage"));
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_AVATAR_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(t("account.imageProcessFailed"));
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    throw new Error(t("account.imageTooLarge"));
  }

  return dataUrl;
}

async function handleAvatarChange() {
  const file = avatarInput.files?.[0];

  if (!file || !currentUserData) {
    return;
  }

  showMessage("");

  try {
    avatarValue = await compressAvatar(file);
    renderAvatar({
      ...currentUserData,
      avatar: avatarValue,
    });

    const updatedUser = await updateUser(currentUserData.id, {
      avatar: avatarValue,
    });
    saveCurrentUser(updatedUser);
    updateAuthLinks();
    renderUser(updatedUser);
    showMessage(t("account.avatarSaved"));
  } catch (error) {
    renderAvatar(currentUserData);
    showMessage(
      isAvatarValidationError(error)
        ? error.message
        : t("account.avatarSaveFailed"),
      true,
    );
  } finally {
    avatarInput.value = "";
  }
}

form.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-account-edit]");

  if (!editButton) {
    return;
  }

  startEdit(editButton.dataset.accountEdit);
});

avatarInput.addEventListener("change", handleAvatarChange);

resetButton.addEventListener("click", () => {
  const resetMessage = t("account.settingsReset");
  resetLanguage();
  resetTheme();
  showMessage(resetMessage);
});

window.addEventListener("auth:changed", () => {
  initAccount();
});

window.addEventListener("i18n:changed", () => {
  if (currentUserData) {
    renderUser(currentUserData);
  }
});

initAccount();
