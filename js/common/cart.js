import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../api/api.js";

const CART_MODAL_OPENED_CLASS = "cart-modal--opened";
const BODY_LOCK_CLASS = "cart-modal-opened";
const ROOT_SELECTOR = "[data-cart-modal]";
const COUNT_SELECTOR = "[data-cart-count]";
const OPEN_SELECTOR = "[data-cart-open]";

let cartModal = null;
let cartList = null;
let cartMessage = null;
let cartTotal = null;
let cartItems = [];

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getImagePath(image) {
  if (!image || image.startsWith("http") || image.startsWith("/")) {
    return image || "";
  }

  return window.location.pathname.includes("/pages/") ? `../${image}` : image;
}

function getProductId(product) {
  const numberId = Number(product.id);
  return Number.isNaN(numberId) ? product.id : numberId;
}

function getCartQuantity(items) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function updateCountElements(count) {
  document.querySelectorAll(COUNT_SELECTOR).forEach((element) => {
    element.textContent = String(count);
  });
}

function createCartModal() {
  if (document.querySelector(ROOT_SELECTOR)) {
    cartModal = document.querySelector(ROOT_SELECTOR);
    cartList = cartModal.querySelector("[data-cart-list]");
    cartMessage = cartModal.querySelector("[data-cart-message]");
    cartTotal = cartModal.querySelector("[data-cart-total]");
    return;
  }

  cartModal = document.createElement("div");
  cartModal.className = "cart-modal";
  cartModal.setAttribute("aria-hidden", "true");
  cartModal.setAttribute("data-cart-modal", "");
  cartModal.innerHTML = `
    <button class="cart-modal__overlay" type="button" aria-label="Закрыть корзину" data-cart-close></button>
    <section class="cart-modal__panel" role="dialog" aria-modal="true" aria-labelledby="cart-modal-title">
      <div class="cart-modal__header">
        <h2 class="cart-modal__title" id="cart-modal-title">Корзина</h2>
        <button class="cart-modal__close" type="button" aria-label="Закрыть корзину" data-cart-close></button>
      </div>
      <p class="cart-modal__message" data-cart-message hidden></p>
      <div class="cart-modal__list" data-cart-list></div>
      <div class="cart-modal__footer">
        <div class="cart-modal__total">
          <span>Итого</span>
          <strong data-cart-total>0 ₽</strong>
        </div>
        <button class="cart-modal__order" type="button">Оформить заказ</button>
      </div>
    </section>
  `;

  document.body.append(cartModal);
  cartList = cartModal.querySelector("[data-cart-list]");
  cartMessage = cartModal.querySelector("[data-cart-message]");
  cartTotal = cartModal.querySelector("[data-cart-total]");
}

function openCartModal() {
  cartModal.classList.add(CART_MODAL_OPENED_CLASS);
  cartModal.setAttribute("aria-hidden", "false");
  document.body.classList.add(BODY_LOCK_CLASS);
  loadCart(true);
}

function closeCartModal() {
  cartModal.classList.remove(CART_MODAL_OPENED_CLASS);
  cartModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove(BODY_LOCK_CLASS);
}

function setCartMessage(message) {
  cartMessage.textContent = message;
  cartMessage.hidden = false;
  cartList.innerHTML = "";
  cartTotal.textContent = formatPrice(0);
}

function renderCart() {
  cartList.innerHTML = "";

  if (cartItems.length === 0) {
    setCartMessage("Корзина пуста");
    return;
  }

  cartMessage.hidden = true;
  const total = cartItems.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
  }, 0);

  cartItems.forEach((item) => {
    const cartItem = document.createElement("article");
    cartItem.className = "cart-modal__item";
    cartItem.dataset.cartItemId = item.id;

    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

    cartItem.innerHTML = `
      <img class="cart-modal__image" src="${getImagePath(item.image)}" alt="">
      <div class="cart-modal__info">
        <h3>${item.title}</h3>
        <p>${item.color || "Цвет не указан"}</p>
        <p>${item.width || "Ширина не указана"}</p>
        <strong>${formatPrice(item.price)}</strong>
      </div>
      <div class="cart-modal__quantity">
        <button type="button" aria-label="Уменьшить количество" data-cart-action="decrease">-</button>
        <span>${Number(item.quantity) || 1}</span>
        <button type="button" aria-label="Увеличить количество" data-cart-action="increase">+</button>
      </div>
      <strong class="cart-modal__item-total">${formatPrice(itemTotal)}</strong>
      <button class="cart-modal__remove" type="button" aria-label="Удалить товар" data-cart-action="remove">Удалить</button>
    `;

    cartList.append(cartItem);
  });

  cartTotal.textContent = formatPrice(total);
}

async function loadCart(shouldRender = false) {
  try {
    cartItems = await getCart();
    updateCountElements(getCartQuantity(cartItems));

    if (shouldRender) {
      renderCart();
    }
  } catch {
    cartItems = [];
    updateCountElements(0);

    if (shouldRender) {
      setCartMessage("Не удалось загрузить корзину");
    }
  }
}

async function changeCartItemQuantity(itemId, nextQuantity) {
  const quantity = Math.max(1, nextQuantity);
  await updateCartItem(itemId, { quantity });
  await loadCart(true);
}

async function handleCartAction(event) {
  const button = event.target.closest("[data-cart-action]");

  if (!button) {
    return;
  }

  const cartItem = button.closest("[data-cart-item-id]");
  const item = cartItems.find((cartProduct) => cartProduct.id === cartItem.dataset.cartItemId);

  if (!item) {
    return;
  }

  button.disabled = true;

  try {
    if (button.dataset.cartAction === "increase") {
      await changeCartItemQuantity(item.id, (Number(item.quantity) || 1) + 1);
    }

    if (button.dataset.cartAction === "decrease") {
      await changeCartItemQuantity(item.id, (Number(item.quantity) || 1) - 1);
    }

    if (button.dataset.cartAction === "remove") {
      await removeCartItem(item.id);
      await loadCart(true);
    }
  } catch {
    setCartMessage("Не удалось обновить корзину");
  } finally {
    button.disabled = false;
  }
}

async function addProductToCart(product) {
  const itemId = `product-${product.id}`;
  const items = await getCart();
  const currentItem = items.find((item) => {
    return item.id === itemId || String(item.productId) === String(product.id);
  });

  if (currentItem) {
    await updateCartItem(currentItem.id, {
      quantity: (Number(currentItem.quantity) || 1) + 1,
    });
  } else {
    await addToCart({
      id: itemId,
      productId: getProductId(product),
      title: product.title,
      price: Number(product.price) || 0,
      image: product.image,
      color: product.color,
      width: product.width,
      quantity: 1,
    });
  }

  await loadCart(cartModal.classList.contains(CART_MODAL_OPENED_CLASS));
}

function bindCartEvents() {
  document.addEventListener("click", (event) => {
    const openButton = event.target.closest(OPEN_SELECTOR);

    if (openButton) {
      event.preventDefault();
      openCartModal();
    }
  });

  cartModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-cart-close]")) {
      closeCartModal();
    }
  });

  cartList.addEventListener("click", handleCartAction);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      cartModal.classList.contains(CART_MODAL_OPENED_CLASS)
    ) {
      closeCartModal();
    }
  });
}

function initCart() {
  createCartModal();
  bindCartEvents();
  loadCart();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCart);
} else {
  initCart();
}

export { addProductToCart, loadCart };
