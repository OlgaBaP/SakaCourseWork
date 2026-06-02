import { createUser, getUsers } from "../api/api.js";

const CURRENT_USER_KEY = "currentUser";
const BODY_OPEN_CLASS = "auth-modal-opened";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^375(25|29|33|44)\d{7}$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-zа-я])(?=.*[A-ZА-Я])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]).{8,20}$/;
const POPULAR_PASSWORDS = [
  "Password123!",
  "Qwerty123!",
  "Admin123!",
  "User123!",
  "Password1!",
];

let authModal = null;
let activeIntent = "header";
let successCallback = null;
let users = [];
let nicknameAttempts = 0;

function normalizePhone(phone) {
  return String(phone || "")
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^\+/, "");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getCurrentUser() {
  try {
    const value = localStorage.getItem(CURRENT_USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

function saveCurrentUser(user) {
  const safeUser = {
    id: user.id,
    role: user.role,
    fullName: user.fullName || user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    nickname: user.nickname || user.firstName || user.email || "",
    city: user.city || "",
    avatar: user.avatar || "",
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
  return safeUser;
}

function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function getPagePath(pageName) {
  return window.location.pathname.includes("/pages/")
    ? pageName
    : `pages/${pageName}`;
}

function dispatchAuthChange(user, intent) {
  window.dispatchEvent(
    new CustomEvent("auth:changed", {
      detail: {
        user,
        intent,
      },
    }),
  );
}

function updateAuthLinks() {
  const currentUser = getCurrentUser();
  const accountHref = getPagePath("account.html");
  const loginHref = getPagePath("login.html");
  const text = currentUser
    ? currentUser.nickname || currentUser.fullName || "Личный кабинет"
    : "Войти";
  const href = currentUser ? accountHref : loginHref;

  document.querySelectorAll(".login-link, .mobile-menu__login").forEach((link) => {
    link.setAttribute("href", href);
    const textElement = link.querySelector("span");

    if (textElement) {
      textElement.textContent = text;
    } else {
      link.textContent = text;
    }
  });

  document.querySelectorAll(".login-link").forEach((link) => {
    if (link.parentElement?.querySelector("[data-auth-logout='header']")) {
      return;
    }

    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Выйти";
    logoutLink.dataset.authLogout = "header";
    logoutLink.style.cssText =
      "margin:23px 0 0 14px;color:#fff;font-size:12px;font-weight:600;line-height:1.334;letter-spacing:.24px;white-space:nowrap;";
    link.after(logoutLink);
  });

  document.querySelectorAll(".mobile-menu__login").forEach((link) => {
    const actions = link.closest(".mobile-menu__actions");

    if (!actions || actions.querySelector("[data-auth-logout='mobile']")) {
      return;
    }

    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Выйти";
    logoutLink.dataset.authLogout = "mobile";
    logoutLink.style.cssText =
      "display:flex;align-items:center;justify-content:center;min-width:74px;height:44px;border-radius:100px;background:rgba(255,255,255,.08);color:#fff;font-size:12px;font-weight:600;letter-spacing:.24px;";
    actions.append(logoutLink);
  });

  document.querySelectorAll("[data-auth-logout]").forEach((button) => {
    button.hidden = !currentUser;
  });
}

function ensureAuthStyles() {
  if (document.querySelector("[data-auth-modal-style]")) {
    return;
  }

  const style = document.createElement("style");
  style.dataset.authModalStyle = "";
  style.textContent = `
    .auth-modal-opened { overflow: hidden; }
    .auth-modal { position: fixed; inset: 0; z-index: 120; display: flex; align-items: center; justify-content: center; padding: 28px; visibility: hidden; opacity: 0; pointer-events: none; transition: opacity .2s ease, visibility .2s ease; }
    .auth-modal.is-open { visibility: visible; opacity: 1; pointer-events: auto; }
    .auth-modal__overlay { position: fixed; inset: 0; border: 0; background: rgba(25,36,47,.72); }
    .auth-modal__panel { position: relative; z-index: 1; width: min(760px, 100%); max-height: calc(100vh - 56px); overflow-y: auto; padding: 34px; border-radius: 16px; background: #fff; color: #19242f; box-shadow: 0 24px 80px rgba(25,36,47,.24); }
    .auth-modal__close { position: absolute; top: 18px; right: 18px; width: 42px; height: 42px; border: 0; border-radius: 50%; background: #f7f2e8; }
    .auth-modal__close::before, .auth-modal__close::after { content: ""; position: absolute; top: 20px; left: 11px; width: 20px; height: 2px; background: #19242f; }
    .auth-modal__close::before { transform: rotate(45deg); }
    .auth-modal__close::after { transform: rotate(-45deg); }
    .auth-modal__view[hidden] { display: none; }
    .auth-modal h2 { margin: 0 56px 26px 0; font-size: 32px; font-weight: 600; line-height: 1.25; letter-spacing: 0; }
    .auth-modal__form { display: grid; gap: 16px; }
    .auth-modal__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .auth-modal__field { display: grid; gap: 8px; color: rgba(25,36,47,.72); font-size: 13px; font-weight: 600; }
    .auth-modal__field--wide, .auth-modal__agreement, .auth-modal__message, .auth-modal__actions { grid-column: 1 / -1; }
    .auth-modal input { width: 100%; min-height: 52px; padding: 0 18px; border: 1px solid rgba(25,36,47,.14); border-radius: 8px; background: #f7f2e8; color: #19242f; font: inherit; outline: none; }
    .auth-modal input.input-error { border-color: #b84747; background: #fff7f5; }
    .auth-modal__error { color: #b84747; font-size: 12px; font-weight: 600; }
    .auth-modal__password-mode, .auth-modal__nickname, .auth-modal__agreement-check { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .auth-modal__password-mode label, .auth-modal__agreement-check { color: #19242f; font-size: 13px; font-weight: 600; }
    .auth-modal__password-mode input, .auth-modal__agreement-check input { width: auto; min-height: 0; }
    .auth-modal__nickname input { flex: 1 1 220px; }
    .auth-modal__link, .auth-modal__small-button, .auth-modal__agreement-toggle { border: 0; background: transparent; color: #bfa470; font: inherit; font-weight: 700; text-decoration: underline; }
    .auth-modal__agreement-text { margin: 8px 0 0; color: rgba(25,36,47,.64); font-size: 13px; line-height: 1.5; }
    .auth-modal__message { margin: 0; color: #2f7a46; font-size: 14px; font-weight: 700; }
    .auth-modal__message.is-error { color: #b84747; }
    .auth-modal__submit { min-height: 56px; padding: 0 28px; border: 0; border-radius: 100px; background: #dbc08d; color: #19242f; font-size: 16px; font-weight: 700; }
    .auth-modal__submit:disabled { opacity: .55; cursor: default; }
    .auth-modal__actions { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
    @media (max-width: 639px) {
      .auth-modal { align-items: flex-end; padding: 12px; }
      .auth-modal__panel { max-height: calc(100vh - 24px); padding: 28px 18px 20px; border-radius: 16px; }
      .auth-modal h2 { font-size: 26px; }
      .auth-modal__grid { grid-template-columns: 1fr; }
      .auth-modal__actions { align-items: stretch; flex-direction: column; }
      .auth-modal__submit { width: 100%; }
    }
  `;
  document.head.append(style);
}

function createField(label, inputHtml) {
  return `
    <label class="auth-modal__field" data-auth-field>
      <span>${label}</span>
      ${inputHtml}
      <span class="auth-modal__error" data-auth-error hidden></span>
    </label>
  `;
}

function createAuthModal() {
  if (authModal) {
    return authModal;
  }

  ensureAuthStyles();
  authModal = document.createElement("div");
  authModal.className = "auth-modal";
  authModal.setAttribute("aria-hidden", "true");
  authModal.setAttribute("data-auth-modal", "");
  authModal.innerHTML = `
    <button class="auth-modal__overlay" type="button" aria-label="Закрыть" data-auth-close></button>
    <section class="auth-modal__panel" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button class="auth-modal__close" type="button" aria-label="Закрыть" data-auth-close></button>
      <div class="auth-modal__view" data-auth-view="login">
        <h2 id="auth-modal-title">Войти</h2>
        <form class="auth-modal__form" data-auth-login-form novalidate>
          ${createField("Email или телефон", '<input type="text" autocomplete="username" data-login-identity />')}
          ${createField("Пароль", '<input type="password" autocomplete="current-password" data-login-password />')}
          <p class="auth-modal__message" data-auth-message hidden></p>
          <div class="auth-modal__actions">
            <button class="auth-modal__submit" type="submit">Войти</button>
            <button class="auth-modal__link" type="button" data-auth-switch="register">Регистрация</button>
          </div>
        </form>
      </div>
      <div class="auth-modal__view" data-auth-view="register" hidden>
        <h2>Регистрация</h2>
        <form class="auth-modal__form auth-modal__grid" data-auth-register-form novalidate>
          ${createField("Фамилия", '<input type="text" autocomplete="family-name" data-register-last-name />')}
          ${createField("Имя", '<input type="text" autocomplete="given-name" data-register-first-name />')}
          ${createField("Отчество", '<input type="text" data-register-middle-name />')}
          ${createField("Телефон", '<input type="tel" autocomplete="tel" data-register-phone />')}
          ${createField("E-mail", '<input type="email" autocomplete="email" data-register-email />')}
          ${createField("Дата рождения", '<input type="date" data-register-birth-date />')}
          <div class="auth-modal__password-mode auth-modal__field--wide">
            <label><input type="radio" name="modalPasswordMode" value="manual" checked /> Придумать пароль</label>
            <label><input type="radio" name="modalPasswordMode" value="auto" /> Сгенерировать пароль</label>
          </div>
          ${createField("Пароль", '<input type="text" autocomplete="new-password" data-register-password />')}
          ${createField("Повторите пароль", '<input type="password" autocomplete="new-password" data-register-password-repeat />')}
          <label class="auth-modal__field auth-modal__field--wide" data-auth-field>
            <span>Никнейм</span>
            <span class="auth-modal__nickname">
              <input type="text" data-register-nickname readonly />
              <button class="auth-modal__small-button" type="button" data-generate-nickname>Сгенерировать ещё</button>
            </span>
            <span class="auth-modal__error" data-auth-error hidden></span>
          </label>
          <div class="auth-modal__agreement" data-auth-field>
            <label class="auth-modal__agreement-check">
              <input type="checkbox" data-register-agreement />
              <span>Согласен с условиями обработки данных</span>
            </label>
            <span class="auth-modal__error" data-auth-error hidden></span>
            <button class="auth-modal__agreement-toggle" type="button" data-agreement-toggle>Открыть соглашение</button>
            <p class="auth-modal__agreement-text" data-agreement-text hidden>Нажимая кнопку регистрации, вы соглашаетесь на обработку данных для создания аккаунта и оформления заказов Saka Tekstil.</p>
          </div>
          <p class="auth-modal__message" data-auth-message hidden></p>
          <div class="auth-modal__actions">
            <button class="auth-modal__submit" type="submit">Зарегистрироваться</button>
            <button class="auth-modal__link" type="button" data-auth-switch="login">Уже есть аккаунт</button>
          </div>
        </form>
      </div>
    </section>
  `;
  document.body.append(authModal);
  bindAuthModalEvents();
  return authModal;
}

function showAuthView(mode) {
  createAuthModal()
    .querySelectorAll("[data-auth-view]")
    .forEach((view) => {
      view.hidden = view.dataset.authView !== mode;
    });
}

function openAuthModal(mode = "login", options = {}) {
  if (getCurrentUser() && mode === "login") {
    return;
  }

  activeIntent = options.intent || "header";
  successCallback = typeof options.onSuccess === "function" ? options.onSuccess : null;
  createAuthModal();
  showAuthView(mode);
  authModal.classList.add("is-open");
  authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add(BODY_OPEN_CLASS);

  const firstInput = authModal.querySelector(`[data-auth-view="${mode}"] input`);

  if (firstInput) {
    firstInput.focus();
  }
}

function closeAuthModal() {
  if (!authModal) {
    return;
  }

  authModal.classList.remove("is-open");
  authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove(BODY_OPEN_CLASS);
  successCallback = null;
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

function showFormMessage(form, text, isError = false) {
  const message = form.querySelector("[data-auth-message]");

  if (!message) {
    return;
  }

  message.textContent = text;
  message.hidden = !text;
  message.classList.toggle("is-error", isError);
}

function clearFormErrors(form) {
  form.querySelectorAll("input").forEach((input) => {
    setError(input, "");
  });
  showFormMessage(form, "");
}

function getUserPhone(user) {
  return normalizePhone(user.phone || "");
}

async function loadUsers() {
  users = await getUsers();
}

function findUserByLogin(login) {
  const email = normalizeEmail(login);
  const phone = normalizePhone(login);

  return users.find((user) => {
    return normalizeEmail(user.email) === email || getUserPhone(user) === phone;
  });
}

function isNameValid(value, isRequired = true) {
  const trimmed = String(value || "").trim();

  if (!isRequired && !trimmed) {
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

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 16;
}

function isPasswordValid(password) {
  return PASSWORD_PATTERN.test(password) && !POPULAR_PASSWORDS.includes(password);
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

  return String(value || "")
    .trim()
    .toLowerCase()
    .split("")
    .map((letter) => dictionary[letter] || letter)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

function isNicknameUnique(nickname) {
  return !users.some((user) => {
    return normalizeEmail(user.nickname || "") === normalizeEmail(nickname);
  });
}

function generatePassword() {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specials = "!@#$%^&*";
  const pool = lower + upper + digits + specials;
  const chars = [
    lower[Math.floor(Math.random() * lower.length)],
    upper[Math.floor(Math.random() * upper.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];

  while (chars.length < 12) {
    chars.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return chars.sort(() => Math.random() - 0.5).join("");
}

function generateNickname(firstName, lastName) {
  const firstPart = transliterate(firstName).slice(0, 5) || "user";
  const lastPart = transliterate(lastName).slice(0, 5) || "saka";

  for (let i = 0; i < 20; i += 1) {
    const nickname = `${firstPart}${lastPart}${Math.floor(100 + Math.random() * 900)}`;

    if (isNicknameUnique(nickname)) {
      return nickname;
    }
  }

  return `${firstPart}${lastPart}${Date.now().toString().slice(-4)}`;
}

function getRegisterFields(form) {
  return {
    lastName: form.querySelector("[data-register-last-name]"),
    firstName: form.querySelector("[data-register-first-name]"),
    middleName: form.querySelector("[data-register-middle-name]"),
    phone: form.querySelector("[data-register-phone]"),
    email: form.querySelector("[data-register-email]"),
    birthDate: form.querySelector("[data-register-birth-date]"),
    passwordMode: form.querySelector("input[name='modalPasswordMode']:checked"),
    password: form.querySelector("[data-register-password]"),
    passwordRepeat: form.querySelector("[data-register-password-repeat]"),
    nickname: form.querySelector("[data-register-nickname]"),
    agreement: form.querySelector("[data-register-agreement]"),
  };
}

function validateRegisterForm(form, shouldShowErrors = false) {
  const fields = getRegisterFields(form);
  const errors = new Map();
  const passwordMode = fields.passwordMode?.value || "manual";
  const phone = normalizePhone(fields.phone.value);
  const email = normalizeEmail(fields.email.value);

  if (!isNameValid(fields.lastName.value)) {
    errors.set(fields.lastName, "Введите фамилию");
  }

  if (!isNameValid(fields.firstName.value)) {
    errors.set(fields.firstName, "Введите имя");
  }

  if (!isNameValid(fields.middleName.value, false)) {
    errors.set(fields.middleName, "Введите корректное отчество");
  }

  if (!PHONE_PATTERN.test(phone)) {
    errors.set(fields.phone, "Введите белорусский номер телефона");
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.set(fields.email, "Введите корректный E-mail");
  }

  if (!isAdultEnough(fields.birthDate.value)) {
    errors.set(fields.birthDate, "Регистрация доступна с 16 лет");
  }

  if (!isPasswordValid(fields.password.value)) {
    errors.set(fields.password, "Пароль 8-20 символов: буквы, цифра и спецсимвол");
  }

  if (passwordMode === "manual" && fields.password.value !== fields.passwordRepeat.value) {
    errors.set(fields.passwordRepeat, "Пароли должны совпадать");
  }

  if (!fields.nickname.value.trim()) {
    errors.set(fields.nickname, "Сгенерируйте никнейм");
  }

  if (!fields.agreement.checked) {
    errors.set(fields.agreement, "Подтвердите соглашение");
  }

  if (shouldShowErrors) {
    Object.values(fields).forEach((field) => {
      if (field instanceof HTMLInputElement) {
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

function fillNickname(form) {
  const fields = getRegisterFields(form);
  nicknameAttempts += 1;
  fields.nickname.value = generateNickname(fields.firstName.value, fields.lastName.value);
  fields.nickname.readOnly = nicknameAttempts < 5;
  setError(fields.nickname, "");
}

function setPasswordMode(form) {
  const fields = getRegisterFields(form);
  const isAuto = fields.passwordMode?.value === "auto";

  fields.password.readOnly = isAuto;
  fields.passwordRepeat.readOnly = isAuto;

  if (isAuto) {
    const password = generatePassword();
    fields.password.value = password;
    fields.passwordRepeat.value = password;
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const loginInput = form.querySelector("[data-login-identity]");
  const passwordInput = form.querySelector("[data-login-password]");

  clearFormErrors(form);

  try {
    await loadUsers();
  } catch {
    showFormMessage(form, "Не удалось выполнить вход. Попробуйте позже.", true);
    return;
  }

  const user = findUserByLogin(loginInput.value);

  if (!user) {
    setError(loginInput, "Пользователь не найден");
    return;
  }

  if (user.password !== passwordInput.value) {
    setError(passwordInput, "Неверный пароль");
    return;
  }

  const safeUser = saveCurrentUser(user);
  updateAuthLinks();
  closeAuthModal();
  dispatchAuthChange(safeUser, activeIntent);

  if (successCallback) {
    const callback = successCallback;
    successCallback = null;
    callback(safeUser);
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;

  clearFormErrors(form);

  try {
    await loadUsers();
  } catch {
    showFormMessage(form, "Не удалось зарегистрироваться. Попробуйте позже.", true);
    return;
  }

  const validation = validateRegisterForm(form, true);

  if (!validation.isValid) {
    return;
  }

  const { fields, values } = validation;

  if (users.some((user) => normalizeEmail(user.email) === values.email)) {
    setError(fields.email, "Такой E-mail уже зарегистрирован");
    return;
  }

  if (users.some((user) => getUserPhone(user) === normalizePhone(values.phone))) {
    setError(fields.phone, "Такой телефон уже зарегистрирован");
    return;
  }

  if (!isNicknameUnique(values.nickname)) {
    setError(fields.nickname, "Такой никнейм уже существует");
    return;
  }

  const userData = {
    id: Date.now().toString(),
    role: "user",
    firstName: values.firstName,
    lastName: values.lastName,
    middleName: values.middleName,
    fullName: [values.lastName, values.firstName, values.middleName].filter(Boolean).join(" "),
    phone: values.phone,
    email: values.email,
    birthDate: values.birthDate,
    city: "",
    nickname: values.nickname,
    password: values.password,
    avatar: "",
    createdAt: new Date().toISOString(),
  };
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;

  try {
    const createdUser = await createUser(userData);
    const safeUser = saveCurrentUser(createdUser);
    form.reset();
    updateAuthLinks();
    closeAuthModal();
    dispatchAuthChange(safeUser, "registration");
    window.location.href = getPagePath("account.html");
  } catch {
    showFormMessage(form, "Не удалось зарегистрироваться. Попробуйте позже.", true);
    submitButton.disabled = false;
  }
}

function bindAuthModalEvents() {
  const loginForm = authModal.querySelector("[data-auth-login-form]");
  const registerForm = authModal.querySelector("[data-auth-register-form]");
  const passwordRepeat = registerForm.querySelector("[data-register-password-repeat]");
  const nicknameButton = registerForm.querySelector("[data-generate-nickname]");
  const agreementButton = registerForm.querySelector("[data-agreement-toggle]");
  const agreementText = registerForm.querySelector("[data-agreement-text]");

  authModal.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-auth-close]");
    const switchButton = event.target.closest("[data-auth-switch]");

    if (closeButton) {
      event.preventDefault();
      closeAuthModal();
      return;
    }

    if (switchButton) {
      event.preventDefault();
      showAuthView(switchButton.dataset.authSwitch);
    }
  });

  loginForm.addEventListener("submit", handleLoginSubmit);
  registerForm.addEventListener("submit", handleRegisterSubmit);
  registerForm.addEventListener("input", () => {
    clearFormErrors(registerForm);
    validateRegisterForm(registerForm, true);
  });
  registerForm.addEventListener("change", () => {
    setPasswordMode(registerForm);
    validateRegisterForm(registerForm, true);
  });
  passwordRepeat.addEventListener("paste", (event) => {
    event.preventDefault();
  });
  nicknameButton.addEventListener("click", () => {
    fillNickname(registerForm);
  });
  agreementButton.addEventListener("click", () => {
    agreementText.hidden = !agreementText.hidden;
  });
  fillNickname(registerForm);
  setPasswordMode(registerForm);
}

function getAuthIntent(target) {
  if (target.closest("[data-cart-modal]")) {
    return "checkout";
  }

  if (window.location.pathname.endsWith("/account.html")) {
    return "account";
  }

  return target.dataset.authIntent || "header";
}

function initAuthState() {
  updateAuthLinks();

  document.addEventListener("click", (event) => {
    const logoutButton = event.target.closest("[data-auth-logout]");
    const authButton = event.target.closest("[data-auth-open]");
    const loginLink = event.target.closest(".login-link, .mobile-menu__login");

    if (logoutButton) {
      event.preventDefault();
      clearCurrentUser();
      updateAuthLinks();
      dispatchAuthChange(null, "logout");
      return;
    }

    if (authButton) {
      event.preventDefault();
      openAuthModal(authButton.dataset.authOpen || "login", {
        intent: authButton.dataset.authIntent || getAuthIntent(authButton),
      });
      return;
    }

    if (loginLink && !getCurrentUser()) {
      event.preventDefault();
      openAuthModal("login", {
        intent: getAuthIntent(loginLink),
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && authModal?.classList.contains("is-open")) {
      closeAuthModal();
    }
  });

  window.addEventListener("auth:open", (event) => {
    openAuthModal(event.detail?.mode || "login", {
      intent: event.detail?.intent || "header",
      onSuccess: event.detail?.onSuccess,
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthState);
} else {
  initAuthState();
}

export {
  clearCurrentUser,
  getCurrentUser,
  openAuthModal,
  saveCurrentUser,
  updateAuthLinks,
};
