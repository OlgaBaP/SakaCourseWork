const preloader = document.createElement("div");

preloader.className = "site-preloader";
preloader.setAttribute("aria-hidden", "true");
preloader.innerHTML = '<div class="site-preloader__mark"></div>';
document.body.prepend(preloader);

function hidePreloader() {
  preloader.classList.add("site-preloader--hidden");
  window.setTimeout(() => {
    preloader.remove();
  }, 400);
}

if (document.readyState === "complete") {
  hidePreloader();
} else {
  window.addEventListener("load", hidePreloader, { once: true });
}
