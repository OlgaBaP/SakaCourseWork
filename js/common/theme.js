const THEME_KEY = "sakaInterfaceTheme";
const DEFAULT_THEME = "light";
const THEMES = ["light", "dark"];
const DARK_CLASS = "dark-theme";

function getTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    return;
  }
}

function updateThemeControls() {
  const theme = getTheme();

  document.querySelectorAll("[data-theme-toggle]").forEach((control) => {
    control.innerHTML = theme === "dark" ? "<b>Dark</b> / Light" : "Dark / <b>Light</b>";
    control.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch theme to light" : "Переключить тему на темную",
    );
  });
}

function applyTheme(theme = getTheme()) {
  document.body.classList.toggle(DARK_CLASS, theme === "dark");
  updateThemeControls();
}

function setTheme(theme) {
  const nextTheme = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  saveTheme(nextTheme);
  applyTheme(nextTheme);
  window.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme: nextTheme } }));
}

function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

function resetTheme() {
  setTheme(DEFAULT_THEME);
}

function bindThemeControls() {
  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-theme-toggle]");

    if (!control) {
      return;
    }

    event.preventDefault();
    toggleTheme();
  });

  document.addEventListener("keydown", (event) => {
    const control = event.target.closest("[data-theme-toggle]");

    if (!control || !["Enter", " "].includes(event.key)) {
      return;
    }

    event.preventDefault();
    toggleTheme();
  });
}

function initTheme() {
  applyTheme();
  bindThemeControls();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}

window.SakaTheme = {
  getTheme,
  resetTheme,
  setTheme,
};

export { getTheme, resetTheme, setTheme };
