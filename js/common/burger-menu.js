const burgerButton = document.querySelector("[data-burger-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const headerSearchToggle = document.querySelector("[data-header-search-toggle]");
const headerSearchForm = document.querySelector("[data-header-search-form]");
const headerSearchInput = document.querySelector("[data-header-search-input]");

if (headerSearchToggle && headerSearchForm && headerSearchInput) {
  function openHeaderSearch() {
    headerSearchForm.hidden = false;
    headerSearchInput.focus();
  }

  function closeHeaderSearch() {
    headerSearchForm.hidden = true;
    headerSearchInput.value = "";
  }

  headerSearchToggle.addEventListener("click", (event) => {
    event.preventDefault();

    if (headerSearchForm.hidden) {
      openHeaderSearch();
      return;
    }

    closeHeaderSearch();
  });

  headerSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = headerSearchInput.value.trim();

    if (query === "") {
      headerSearchInput.focus();
      return;
    }

    const searchUrl = new URL(
      headerSearchForm.getAttribute("action"),
      window.location.href,
    );
    searchUrl.searchParams.set("search", query);
    window.location.href = searchUrl.toString();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !headerSearchForm.hidden) {
      closeHeaderSearch();
    }
  });
}

if (burgerButton && mobileMenu) {
  const closeButtons = mobileMenu.querySelectorAll("[data-mobile-menu-close]");
  const menuLinks = mobileMenu.querySelectorAll("a");

  function openMenu() {
    mobileMenu.classList.add("mobile-menu--opened");
    mobileMenu.setAttribute("aria-hidden", "false");
    burgerButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("mobile-menu-opened");
  }

  function closeMenu() {
    mobileMenu.classList.remove("mobile-menu--opened");
    mobileMenu.setAttribute("aria-hidden", "true");
    burgerButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-menu-opened");
  }

  burgerButton.addEventListener("click", () => {
    if (mobileMenu.classList.contains("mobile-menu--opened")) {
      closeMenu();
      return;
    }

    openMenu();
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeMenu);
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}
