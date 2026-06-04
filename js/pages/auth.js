import {
  createUser,
  getUsers,
} from "../api/api.js";
import { saveCurrentUser } from "../common/auth-state.js";
import { t } from "../common/i18n.js";

const POPULAR_PASSWORDS = [
  "Password123!",
  "Qwerty123!",
  "Admin123!",
  "User123!",
  "Password1!",
];
const PHONE_PATTERN = /^375(25|29|33|44)\d{7}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-zа-я])(?=.*[A-ZА-Я])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]).{8,20}$/;

const loginForm = document.querySelector("[data-login-form]");
const registerForm = document.querySelector("[data-register-form]");
let users = [];
let nicknameAttempts = 0;

function normalizePhone(phone) {
  return phone
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^\+/, "");
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getUserPhone(user) {
  return normalizePhone(user.phone || "");
}

function setError(input, message) {
  const field = input.closest("[data-auth-field]");
  const error = field?.querySelector("[data-auth-error]");

  input.classList.toggle("input-error", Boolean(message));

  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
}

function clearFormMessage(form) {
  const message = form.querySelector("[data-auth-message]");

  if (message) {
    message.textContent = "";
    message.hidden = true;
    message.classList.remove("is-error");
  }
}

function showFormMessage(form, text, isError = false) {
  const message = form.querySelector("[data-auth-message]");

  if (message) {
    message.textContent = text;
    message.hidden = false;
    message.classList.toggle("is-error", isError);
  }
}

function isNameValid(value, isRequired = true) {
  const trimmed = value.trim();

  if (!isRequired && trimmed === "") {
    return true;
  }

  return trimmed.length >= 2;
}

function isAdultEnough(value) {
  if (!value) {
    return false;
  }

  const birthDate = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 16;
}

function isPasswordValid(password) {
  return (
    PASSWORD_PATTERN.test(password) && !POPULAR_PASSWORDS.includes(password)
  );
}

function generatePassword() {
  const specials = "!@#$%^&*";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const pool = lower + upper + digits + specials;
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];

  while (required.length < 12) {
    required.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return required.sort(() => Math.random() - 0.5).join("");
}

function transliterate(value) {
  const dictionary = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ы: "y",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  return value
    .trim()
    .toLowerCase()
    .split("")
    .map((letter) => dictionary[letter] || letter)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

function isNicknameUnique(nickname) {
  return !users.some((user) => {
    return (user.nickname || "").toLowerCase() === nickname.toLowerCase();
  });
}

function generateNickname(firstName, lastName) {
  const firstPart = transliterate(firstName).slice(0, 5) || "user";
  const lastPart = transliterate(lastName).slice(0, 5) || "saka";

  for (let i = 0; i < 20; i += 1) {
    const nextNickname = `${firstPart}${lastPart}${Math.floor(
      100 + Math.random() * 900,
    )}`;

    if (isNicknameUnique(nextNickname)) {
      return nextNickname;
    }
  }

  return `${firstPart}${lastPart}${Date.now().toString().slice(-4)}`;
}

function getRegisterFields() {
  return {
    lastName: registerForm.querySelector("[data-register-last-name]"),
    firstName: registerForm.querySelector("[data-register-first-name]"),
    middleName: registerForm.querySelector("[data-register-middle-name]"),
    phone: registerForm.querySelector("[data-register-phone]"),
    email: registerForm.querySelector("[data-register-email]"),
    birthDate: registerForm.querySelector("[data-register-birth-date]"),
    passwordMode: registerForm.querySelector(
      "input[name='passwordMode']:checked",
    ),
    password: registerForm.querySelector("[data-register-password]"),
    passwordRepeat: registerForm.querySelector("[data-register-password-repeat]"),
    nickname: registerForm.querySelector("[data-register-nickname]"),
    agreement: registerForm.querySelector("[data-register-agreement]"),
  };
}

function validateRegisterSync(shouldShowErrors = false) {
  const fields = getRegisterFields();
  const errors = new Map();
  const passwordMode = fields.passwordMode?.value || "manual";
  const phone = normalizePhone(fields.phone.value);
  const email = normalizeEmail(fields.email.value);

  if (!isNameValid(fields.lastName.value)) {
    errors.set(fields.lastName, t("auth.invalidLastName"));
  }

  if (!isNameValid(fields.firstName.value)) {
    errors.set(fields.firstName, t("auth.invalidFirstName"));
  }

  if (!isNameValid(fields.middleName.value, false)) {
    errors.set(fields.middleName, t("auth.invalidMiddleName"));
  }

  if (!PHONE_PATTERN.test(phone)) {
    errors.set(fields.phone, t("auth.invalidPhone"));
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.set(fields.email, t("auth.invalidEmail"));
  }

  if (!isAdultEnough(fields.birthDate.value)) {
    errors.set(fields.birthDate, t("auth.tooYoung"));
  }

  if (!isPasswordValid(fields.password.value)) {
    errors.set(
      fields.password,
      t("auth.invalidPassword"),
    );
  }

  if (passwordMode === "manual" && fields.password.value !== fields.passwordRepeat.value) {
    errors.set(fields.passwordRepeat, t("auth.passwordMismatch"));
  }

  if (!fields.nickname.value.trim()) {
    errors.set(fields.nickname, t("auth.nicknameRequired"));
  }

  if (!fields.agreement.checked) {
    errors.set(fields.agreement, t("auth.agreementRequired"));
  }

  if (shouldShowErrors) {
    Object.values(fields).forEach((field) => {
      if (field instanceof HTMLElement && field.matches("input")) {
        setError(field, errors.get(field) || "");
      }
    });
  }

  return {
    errors,
    fields,
    isValid: errors.size === 0,
    values: {
      firstName: fields.firstName.value.trim(),
      lastName: fields.lastName.value.trim(),
      middleName: fields.middleName.value.trim(),
      phone: phone ? `+${phone}` : "",
      email,
      birthDate: fields.birthDate.value,
      nickname: fields.nickname.value.trim(),
      password: fields.password.value,
    },
  };
}

function updateRegisterButton() {
  const submitButton = registerForm.querySelector("button[type='submit']");
  submitButton.disabled = !validateRegisterSync().isValid;
}

function setPasswordMode() {
  const fields = getRegisterFields();
  const isAuto = fields.passwordMode?.value === "auto";

  fields.password.readOnly = isAuto;
  fields.passwordRepeat.readOnly = isAuto;

  if (isAuto) {
    const password = generatePassword();
    fields.password.value = password;
    fields.passwordRepeat.value = password;
  }

  updateRegisterButton();
}

function fillNickname() {
  const fields = getRegisterFields();
  nicknameAttempts += 1;
  fields.nickname.value = generateNickname(
    fields.firstName.value,
    fields.lastName.value,
  );
  fields.nickname.readOnly = nicknameAttempts < 5;
  setError(fields.nickname, "");
  updateRegisterButton();
}

function findUserByLogin(login) {
  const normalizedLogin = normalizeEmail(login);
  const normalizedPhone = normalizePhone(login);

  return users.find((user) => {
    return (
      normalizeEmail(user.email || "") === normalizedLogin ||
      getUserPhone(user) === normalizedPhone
    );
  });
}

async function loadUsers() {
  users = await getUsers();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  await loadUsers();

  const loginInput = loginForm.querySelector("[data-login-identity]");
  const passwordInput = loginForm.querySelector("[data-login-password]");
  const user = findUserByLogin(loginInput.value);

  clearFormMessage(loginForm);
  setError(loginInput, "");
  setError(passwordInput, "");

  if (!user) {
    setError(loginInput, t("auth.notFound"));
    return;
  }

  if (user.password !== passwordInput.value) {
    setError(passwordInput, t("auth.wrongPassword"));
    return;
  }

  saveCurrentUser(user);
  window.location.href = "account.html";
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  await loadUsers();

  const validation = validateRegisterSync(true);

  clearFormMessage(registerForm);

  if (!validation.isValid) {
    updateRegisterButton();
    return;
  }

  const { fields, values } = validation;
  const emailExists = users.some((user) => {
    return normalizeEmail(user.email || "") === values.email;
  });
  const phoneExists = users.some((user) => {
    return getUserPhone(user) === normalizePhone(values.phone);
  });

  if (emailExists) {
    setError(fields.email, t("auth.emailExists"));
    return;
  }

  if (phoneExists) {
    setError(fields.phone, t("auth.phoneExists"));
    return;
  }

  if (!isNicknameUnique(values.nickname)) {
    setError(fields.nickname, t("auth.nicknameExists"));
    return;
  }

  const userData = {
    id: Date.now().toString(),
    role: "user",
    firstName: values.firstName,
    lastName: values.lastName,
    middleName: values.middleName,
    fullName: [values.lastName, values.firstName, values.middleName]
      .filter(Boolean)
      .join(" "),
    phone: values.phone,
    email: values.email,
    birthDate: values.birthDate,
    city: "",
    nickname: values.nickname,
    password: values.password,
    createdAt: new Date().toISOString(),
  };

  const submitButton = registerForm.querySelector("button[type='submit']");
  submitButton.disabled = true;

  try {
    const createdUser = await createUser(userData);
    saveCurrentUser(createdUser);
    registerForm.reset();
    showFormMessage(registerForm, t("auth.registerSuccess"));
    window.setTimeout(() => {
      window.location.href = "account.html";
    }, 900);
  } catch {
    showFormMessage(registerForm, t("auth.registerFailed"), true);
    updateRegisterButton();
  }
}

function initLoginForm() {
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener("submit", handleLoginSubmit);
}

function initRegisterForm() {
  if (!registerForm) {
    return;
  }

  const passwordRepeat = registerForm.querySelector(
    "[data-register-password-repeat]",
  );
  const nicknameButton = registerForm.querySelector("[data-generate-nickname]");
  const agreementButton = registerForm.querySelector("[data-agreement-toggle]");
  const agreementText = registerForm.querySelector("[data-agreement-text]");

  registerForm.addEventListener("input", () => {
    clearFormMessage(registerForm);
    validateRegisterSync(true);
    updateRegisterButton();
  });

  registerForm.addEventListener("change", () => {
    setPasswordMode();
    validateRegisterSync(true);
    updateRegisterButton();
  });

  registerForm.addEventListener("submit", handleRegisterSubmit);

  passwordRepeat.addEventListener("paste", (event) => {
    event.preventDefault();
  });

  nicknameButton.addEventListener("click", fillNickname);

  agreementButton.addEventListener("click", () => {
    agreementText.hidden = !agreementText.hidden;
  });

  fillNickname();
  setPasswordMode();
  updateRegisterButton();
}

loadUsers().catch(() => {
  users = [];
});
initLoginForm();
initRegisterForm();
