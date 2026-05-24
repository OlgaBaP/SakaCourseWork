const burgerButton = document.querySelector("[data-burger-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

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
