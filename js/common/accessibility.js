import { getLanguage, resetLanguage, t } from "./i18n.js";
import { resetTheme } from "./theme.js";

const STORAGE_KEYS = {
  enabled: "sakaAccessibilityEnabled",
  fontSize: "sakaAccessibilityFontSize",
  colorScheme: "sakaAccessibilityColorScheme",
  imagesDisabled: "sakaAccessibilityImagesDisabled",
};

const DEFAULT_SETTINGS = {
  enabled: false,
  fontSize: "normal",
  colorScheme: "black-white",
  imagesDisabled: false,
};

const FONT_SIZES = ["normal", "large", "xlarge"];
const COLOR_SCHEMES = ["black-white", "black-green", "white-black"];
const BODY_CLASSES = [
  "accessibility-mode",
  "a11y-font-normal",
  "a11y-font-large",
  "a11y-font-xlarge",
  "a11y-scheme-black-white",
  "a11y-scheme-black-green",
  "a11y-scheme-white-black",
  "a11y-images-disabled",
];

const PANEL_OPEN_CLASS = "a11y-panel-opened";
const PLACEHOLDER_CLASS = "a11y-image-placeholder";
const PLACEHOLDER_MODE_CLASSES = [
  `${PLACEHOLDER_CLASS}--content`,
  `${PLACEHOLDER_CLASS}--brand`,
  `${PLACEHOLDER_CLASS}--social`,
  `${PLACEHOLDER_CLASS}--silent`,
];
const MEDIA_SELECTOR = "img, iframe, video, canvas";
const TOGGLE_SELECTOR =
  ".header-circle--eye, .mobile-menu__eye, [data-accessibility-toggle]";
const SILENT_MEDIA_CONTEXT_SELECTOR = [
  "button",
  ".button",
  ".brand-marks",
  ".category-strip",
  ".header-circle--search",
  ".cart-link",
  ".login-link",
  ".phone-link",
  ".mobile-menu__cart",
  ".mobile-menu__login",
  ".mobile-menu__phone",
  ".product-card__button",
  ".pagination",
  "[data-header-search-form]",
  "[data-cart-open]",
  "[data-cart-close]",
  "[data-modal-close]",
].join(", ");

function getMediaSource(element) {
  return (element.getAttribute("src") || "").replaceAll("\\", "/").toLowerCase();
}

function getMediaLabel(element, fallback) {
  return (
    element.getAttribute("alt")?.trim() ||
    element.closest("[aria-label]")?.getAttribute("aria-label")?.trim() ||
    fallback
  );
}

let settings = readSettings();
let panel = null;
let noticeTimer = null;
let observer = null;
let lastToggleButton = null;
let accessibilityMediaQuery = null;

const LABELS = {
  ru: {
    title: "Версия для слабовидящих",
    enable: "Включить версию для слабовидящих",
    fontTitle: "Размер шрифта",
    fontNormal: "Обычный",
    fontLarge: "Увеличенный",
    fontXlarge: "Очень крупный",
    schemeTitle: "Цветовая схема",
    schemeBlackWhite: "Черный фон, белый текст",
    schemeBlackGreen: "Черный фон, зеленый текст",
    schemeWhiteBlack: "Белый фон, черный текст",
    images: "Отключить изображения",
    reset: "Сбросить настройки",
    close: "Закрыть",
    imageDisabled: "Изображение отключено",
    mapDisabled: "Карта отключена",
    resetDone: "Настройки сброшены",
  },
  en: {
    title: "Accessibility version",
    enable: "Enable accessibility version",
    fontTitle: "Font size",
    fontNormal: "Normal",
    fontLarge: "Large",
    fontXlarge: "Extra large",
    schemeTitle: "Color scheme",
    schemeBlackWhite: "Black background, white text",
    schemeBlackGreen: "Black background, green text",
    schemeWhiteBlack: "White background, black text",
    images: "Disable images",
    reset: "Reset settings",
    close: "Close",
    imageDisabled: "Image disabled",
    mapDisabled: "Map disabled",
    resetDone: "Settings have been reset",
  },
};

function getLabels() {
  return LABELS[getLanguage()] || LABELS.ru;
}

function parseBoolean(value, fallback = false) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function getStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    return;
  }
}

function removeStoredValue(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
}

function readSettings() {
  const savedFontSize = getStoredValue(STORAGE_KEYS.fontSize);
  const savedColorScheme = getStoredValue(STORAGE_KEYS.colorScheme);

  return {
    enabled: parseBoolean(getStoredValue(STORAGE_KEYS.enabled), DEFAULT_SETTINGS.enabled),
    fontSize: FONT_SIZES.includes(savedFontSize) ? savedFontSize : DEFAULT_SETTINGS.fontSize,
    colorScheme: COLOR_SCHEMES.includes(savedColorScheme)
      ? savedColorScheme
      : DEFAULT_SETTINGS.colorScheme,
    imagesDisabled: parseBoolean(
      getStoredValue(STORAGE_KEYS.imagesDisabled),
      DEFAULT_SETTINGS.imagesDisabled,
    ),
  };
}

function saveSettings(nextSettings = settings) {
  setStoredValue(STORAGE_KEYS.enabled, nextSettings.enabled);
  setStoredValue(STORAGE_KEYS.fontSize, nextSettings.fontSize);
  setStoredValue(STORAGE_KEYS.colorScheme, nextSettings.colorScheme);
  setStoredValue(STORAGE_KEYS.imagesDisabled, nextSettings.imagesDisabled);
}

function clearAccessibilityStorage() {
  Object.values(STORAGE_KEYS).forEach(removeStoredValue);
}

function applyBodyClasses() {
  document.body.classList.remove(...BODY_CLASSES);

  if (!settings.enabled) {
    return;
  }

  document.body.classList.add(
    "accessibility-mode",
    `a11y-font-${settings.fontSize}`,
    `a11y-scheme-${settings.colorScheme}`,
  );

  if (settings.imagesDisabled) {
    document.body.classList.add("a11y-images-disabled");
  }
}

function syncAccessibilityHeader() {
  const searchForm = document.querySelector("[data-header-search-form]");

  if (searchForm) {
    searchForm.hidden = !settings.enabled;
  }
}

function getMediaPresentation(element) {
  if (element.closest(TOGGLE_SELECTOR)) {
    return {
      mode: "keep",
      text: "",
    };
  }

  const mediaSource = getMediaSource(element);

  if (
    element.closest(".site-logo, .mobile-menu__logo, .brand-marks") ||
    mediaSource.includes("/assets/images/logos/") ||
    mediaSource.includes("assets/images/logos/")
  ) {
    return {
      mode: "brand",
      text: getMediaLabel(element, "Saka Holding"),
    };
  }

  const socialLink = element.closest(".site-footer__social a");
  if (socialLink) {
    return {
      mode: "social",
      text: getMediaLabel(element, getLabels().imageDisabled),
    };
  }

  if (
    element.closest(SILENT_MEDIA_CONTEXT_SELECTOR) ||
    mediaSource.includes("/assets/images/icons/") ||
    mediaSource.includes("assets/images/icons/") ||
    (element.tagName === "IFRAME" && !element.closest(".contacts-map"))
  ) {
    return {
      mode: "silent",
      text: "",
    };
  }

  return {
    mode: "content",
    text:
      element.tagName === "IFRAME" && element.closest(".contacts-map")
        ? getLabels().mapDisabled
        : getLabels().imageDisabled,
  };
}

function createPlaceholder(element) {
  const placeholder = document.createElement(
    ["IFRAME", "VIDEO", "CANVAS"].includes(element.tagName) ? "div" : "span",
  );
  placeholder.className = PLACEHOLDER_CLASS;
  placeholder.setAttribute("role", "img");
  return placeholder;
}

function ensureMediaPlaceholder(element) {
  if (element.closest(".a11y-panel")) {
    return null;
  }

  const currentPlaceholder = element.nextElementSibling;
  if (currentPlaceholder?.classList.contains(PLACEHOLDER_CLASS)) {
    return currentPlaceholder;
  }

  const placeholder = createPlaceholder(element);
  element.after(placeholder);
  element.dataset.a11yPlaceholderReady = "true";
  return placeholder;
}

function updateMediaPlaceholder(element) {
  if (element.closest(".a11y-panel")) {
    return;
  }

  const presentation = getMediaPresentation(element);
  const currentPlaceholder = element.nextElementSibling;

  element.dataset.a11yMediaMode = presentation.mode;

  if (["keep", "silent"].includes(presentation.mode)) {
    if (currentPlaceholder?.classList.contains(PLACEHOLDER_CLASS)) {
      currentPlaceholder.remove();
    }
    delete element.dataset.a11yPlaceholderReady;
    return;
  }

  const placeholder = ensureMediaPlaceholder(element);

  if (placeholder?.classList.contains(PLACEHOLDER_CLASS)) {
    placeholder.classList.remove(...PLACEHOLDER_MODE_CLASSES);
    placeholder.classList.add(`${PLACEHOLDER_CLASS}--${presentation.mode}`);
    placeholder.textContent = presentation.text;
    placeholder.setAttribute("aria-hidden", String(presentation.mode === "silent"));
  }
}

function prepareMediaPlaceholders(root = document) {
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
    return;
  }

  if (root.matches?.(MEDIA_SELECTOR)) {
    updateMediaPlaceholder(root);
  }

  root.querySelectorAll?.(MEDIA_SELECTOR).forEach(updateMediaPlaceholder);
}

function updateToggleButtons() {
  document.querySelectorAll(TOGGLE_SELECTOR).forEach((button) => {
    button.setAttribute("role", "button");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", String(panel?.hidden === false));
    button.setAttribute("aria-label", getLabels().title);
    button.classList.toggle("a11y-toggle-active", settings.enabled);
  });
}

function syncPanelControls() {
  if (!panel) {
    return;
  }

  const labels = getLabels();
  panel.querySelector("[data-a11y-title]").textContent = labels.title;
  panel.querySelector("[data-a11y-enable-label]").textContent = labels.enable;
  panel.querySelector("[data-a11y-font-title]").textContent = labels.fontTitle;
  panel.querySelector("[data-a11y-scheme-title]").textContent = labels.schemeTitle;
  panel.querySelector("[data-a11y-images-label]").textContent = labels.images;
  panel.querySelector("[data-a11y-reset]").textContent = labels.reset;
  panel.querySelector("[data-a11y-close]").setAttribute("aria-label", labels.close);

  panel.querySelector("[data-a11y-enabled]").checked = settings.enabled;
  panel.querySelector("[data-a11y-images]").checked = settings.imagesDisabled;
  panel.querySelector(`[name="a11y-font"][value="${settings.fontSize}"]`).checked = true;
  panel.querySelector(`[name="a11y-scheme"][value="${settings.colorScheme}"]`).checked = true;

  panel.querySelector('[data-font-label="normal"]').textContent = labels.fontNormal;
  panel.querySelector('[data-font-label="large"]').textContent = labels.fontLarge;
  panel.querySelector('[data-font-label="xlarge"]').textContent = labels.fontXlarge;
  panel.querySelector('[data-scheme-label="black-white"]').textContent = labels.schemeBlackWhite;
  panel.querySelector('[data-scheme-label="black-green"]').textContent = labels.schemeBlackGreen;
  panel.querySelector('[data-scheme-label="white-black"]').textContent = labels.schemeWhiteBlack;
}

function applySettings({ persist = true } = {}) {
  applyBodyClasses();
  syncAccessibilityHeader();
  closeDesktopMobileMenu();
  prepareMediaPlaceholders(document);
  updateToggleButtons();
  syncPanelControls();

  if (persist) {
    saveSettings();
  }

  window.dispatchEvent(
    new CustomEvent("accessibility:changed", {
      detail: {
        ...settings,
      },
    }),
  );
}

function setSettings(partialSettings) {
  settings = {
    ...settings,
    ...partialSettings,
  };
  applySettings();
}

function openPanel() {
  createPanel();
  panel.hidden = false;
  document.body.classList.add(PANEL_OPEN_CLASS);
  syncPanelControls();
  updateToggleButtons();
  panel.querySelector("[data-a11y-enabled]").focus();
}

function closePanel() {
  if (!panel) {
    return;
  }

  panel.hidden = true;
  document.body.classList.remove(PANEL_OPEN_CLASS);
  updateToggleButtons();
  lastToggleButton?.focus();
}

function togglePanel() {
  if (panel && !panel.hidden) {
    closePanel();
    return;
  }

  openPanel();
}

function showResetNotice() {
  const labels = getLabels();
  let notice = document.querySelector("[data-a11y-notice]");

  if (!notice) {
    notice = document.createElement("div");
    notice.className = "a11y-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.dataset.a11yNotice = "";
    document.body.append(notice);
  }

  notice.textContent = t("account.settingsReset") || labels.resetDone;
  notice.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.hidden = true;
  }, 2600);
}

function resetAccessibilitySettings({ notify = true } = {}) {
  clearAccessibilityStorage();
  settings = {
    ...DEFAULT_SETTINGS,
  };
  applySettings({ persist: false });
  closePanel();

  if (notify) {
    showResetNotice();
  }

  window.dispatchEvent(new CustomEvent("accessibility:reset"));
  return t("account.settingsReset");
}

function resetSiteSettings({ notify = true } = {}) {
  resetLanguage();
  resetTheme();
  return resetAccessibilitySettings({ notify });
}

function createPanel() {
  if (panel) {
    return panel;
  }

  panel = document.createElement("section");
  panel.className = "a11y-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "a11y-panel-title");
  panel.innerHTML = `
    <div class="a11y-panel__head">
      <h2 id="a11y-panel-title" data-a11y-title></h2>
      <button class="a11y-panel__close" type="button" data-a11y-close></button>
    </div>
    <label class="a11y-panel__switch">
      <input type="checkbox" data-a11y-enabled />
      <span data-a11y-enable-label></span>
    </label>
    <fieldset class="a11y-panel__group">
      <legend data-a11y-font-title></legend>
      <label><input type="radio" name="a11y-font" value="normal" /><span data-font-label="normal"></span></label>
      <label><input type="radio" name="a11y-font" value="large" /><span data-font-label="large"></span></label>
      <label><input type="radio" name="a11y-font" value="xlarge" /><span data-font-label="xlarge"></span></label>
    </fieldset>
    <fieldset class="a11y-panel__group">
      <legend data-a11y-scheme-title></legend>
      <label><input type="radio" name="a11y-scheme" value="black-white" /><span data-scheme-label="black-white"></span></label>
      <label><input type="radio" name="a11y-scheme" value="black-green" /><span data-scheme-label="black-green"></span></label>
      <label><input type="radio" name="a11y-scheme" value="white-black" /><span data-scheme-label="white-black"></span></label>
    </fieldset>
    <label class="a11y-panel__switch">
      <input type="checkbox" data-a11y-images />
      <span data-a11y-images-label></span>
    </label>
    <button class="a11y-panel__reset" type="button" data-a11y-reset></button>
  `;
  document.body.append(panel);
  bindPanelEvents();
  syncPanelControls();
  return panel;
}

function bindPanelEvents() {
  panel.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-a11y-close]");
    const resetButton = event.target.closest("[data-a11y-reset]");

    if (closeButton) {
      event.preventDefault();
      closePanel();
      return;
    }

    if (resetButton) {
      event.preventDefault();
      resetSiteSettings();
    }
  });

  panel.addEventListener("change", (event) => {
    const target = event.target;

    if (target.matches("[data-a11y-enabled]")) {
      setSettings({
        enabled: target.checked,
      });
      return;
    }

    if (target.matches('[name="a11y-font"]')) {
      setSettings({
        enabled: true,
        fontSize: target.value,
      });
      return;
    }

    if (target.matches('[name="a11y-scheme"]')) {
      setSettings({
        enabled: true,
        colorScheme: target.value,
      });
      return;
    }

    if (target.matches("[data-a11y-images]")) {
      setSettings({
        enabled: true,
        imagesDisabled: target.checked,
      });
    }
  });
}

function bindToggleButtons() {
  document.addEventListener("click", (event) => {
    const toggleButton = event.target.closest(TOGGLE_SELECTOR);

    if (!toggleButton) {
      return;
    }

    event.preventDefault();
    lastToggleButton = toggleButton;
    togglePanel();
  });

  document.addEventListener("keydown", (event) => {
    const toggleButton = event.target.closest(TOGGLE_SELECTOR);

    if (toggleButton && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      lastToggleButton = toggleButton;
      togglePanel();
      return;
    }

    if (event.key === "Escape" && panel && !panel.hidden) {
      closePanel();
    }
  });
}

function bindLanguageUpdates() {
  window.addEventListener("i18n:changed", () => {
    syncPanelControls();
    updateToggleButtons();
    prepareMediaPlaceholders(document);
  });
}

function closeDesktopMobileMenu() {
  if (!settings.enabled || !accessibilityMediaQuery?.matches) {
    return;
  }

  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const burgerButton = document.querySelector("[data-burger-button]");

  mobileMenu?.classList.remove("mobile-menu--opened");
  mobileMenu?.setAttribute("aria-hidden", "true");
  burgerButton?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("mobile-menu-opened");
}

function bindAccessibilityViewport() {
  accessibilityMediaQuery = window.matchMedia("(min-width: 768px)");
  accessibilityMediaQuery.addEventListener("change", closeDesktopMobileMenu);
  closeDesktopMobileMenu();
}

function observeDynamicMedia() {
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.target.matches?.(MEDIA_SELECTOR)) {
        updateMediaPlaceholder(mutation.target);
      }

      mutation.addedNodes.forEach((node) => {
        prepareMediaPlaceholders(node);
      });
    });
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["alt", "aria-label", "title"],
    childList: true,
    subtree: true,
  });
}

function initAccessibility() {
  createPanel();
  bindToggleButtons();
  bindLanguageUpdates();
  bindAccessibilityViewport();
  observeDynamicMedia();
  applySettings({ persist: false });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAccessibility);
} else {
  initAccessibility();
}

window.SakaAccessibility = {
  closePanel,
  getSettings() {
    return {
      ...settings,
    };
  },
  openPanel,
  resetAccessibilitySettings,
  resetSiteSettings,
  setSettings,
};

export { resetAccessibilitySettings, resetSiteSettings };
