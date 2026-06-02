import {
  addToCart,
  clearCart,
  createOrder,
  getCart,
  getOrders,
  removeCartItem,
  updateCartItem,
} from "../api/api.js";
import { getCurrentUser, openAuthModal } from "./auth-state.js";

const CART_MODAL_OPENED_CLASS = "cart-modal--opened";
const BODY_LOCK_CLASS = "cart-modal-opened";
const ROOT_SELECTOR = "[data-cart-modal]";
const COUNT_SELECTOR = "[data-cart-count]";
const OPEN_SELECTOR = "[data-cart-open]";

let cartModal = null;
let cartList = null;
let cartMessage = null;
let cartTotal = null;
let cartOrderButton = null;
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
    cartOrderButton = cartModal.querySelector("[data-cart-order], .cart-modal__order");
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
  cartOrderButton = cartModal.querySelector(".cart-modal__order");
  cartOrderButton.dataset.cartOrder = "";
  cartOrderButton.textContent = "Оформить заказ";
}

function openCartModal() {
  keepCartModalOpen();
  loadCart(true);
}

function keepCartModalOpen() {
  cartModal.classList.add(CART_MODAL_OPENED_CLASS);
  cartModal.setAttribute("aria-hidden", "false");
  document.body.classList.add(BODY_LOCK_CLASS);
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

function showCartNotice(message) {
  cartMessage.textContent = message;
  cartMessage.hidden = false;
}

function renderCart() {
  cartList.innerHTML = "";

  if (cartItems.length === 0) {
    cartOrderButton.disabled = true;
    setCartMessage("Корзина пуста");
    return;
  }

  cartMessage.hidden = true;
  cartOrderButton.disabled = false;
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

async function refreshCart(shouldKeepOpen = false) {
  await loadCart(shouldKeepOpen);

  if (shouldKeepOpen) {
    keepCartModalOpen();
  }
}

function getOrderItems() {
  return cartItems.map((item) => {
    return {
      productId: String(item.productId || item.id),
      title: item.title,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      image: item.image || "",
    };
  });
}

function getCartTotal() {
  return cartItems.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
  }, 0);
}

async function getNextOrderNumber() {
  const orders = await getOrders();
  const maxNumber = orders.reduce((max, order) => {
    const value = Number(order.orderNumber || order.id) || 0;
    return Math.max(max, value);
  }, 0);

  return maxNumber + 1;
}

async function createOrderFromCart() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    openAuthModal("login", {
      intent: "checkout",
      onSuccess: createOrderFromCart,
    });
    return;
  }

  await loadCart();

  if (cartItems.length === 0) {
    renderCart();
    return;
  }

  cartOrderButton.disabled = true;
  showCartNotice("Оформляем заказ...");

  try {
    const now = new Date();
    const orderNumber = await getNextOrderNumber();

    await createOrder({
      id: `${Date.now()}`,
      userId: String(currentUser.id),
      orderNumber,
      date: now.toISOString().slice(0, 10),
      status: "Ожидает",
      shipmentStatus: "Ожидает обработки",
      shippingStatus: "Ожидает обработки",
      total: getCartTotal(),
      items: getOrderItems(),
      createdAt: now.toISOString(),
    });
    await clearCart();
    cartItems = [];
    updateCountElements(0);
    setCartMessage("Заказ успешно оформлен");
  } catch {
    showCartNotice("Не удалось оформить заказ. Попробуйте позже.");
    cartOrderButton.disabled = false;
  }
}

async function changeCartItemQuantity(itemId, nextQuantity) {
  const quantity = Math.max(1, nextQuantity);
  await updateCartItem(itemId, { quantity });
  await refreshCart(true);
}

async function handleCartAction(event) {
  const button = event.target.closest("[data-cart-action]");

  if (!button) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const cartItem = button.closest("[data-cart-item-id]");

  if (!cartItem) {
    return;
  }

  const item = cartItems.find((cartProduct) => {
    return cartProduct.id === cartItem.dataset.cartItemId;
  });

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
      await refreshCart(true);
    }
  } catch {
    setCartMessage("Не удалось обновить корзину");
    keepCartModalOpen();
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

  await refreshCart(cartModal.classList.contains(CART_MODAL_OPENED_CLASS));
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
    const closeButton = event.target.closest("[data-cart-close]");

    if (closeButton && cartModal.contains(closeButton)) {
      event.preventDefault();
      closeCartModal();
    }
  });

  cartList.addEventListener("click", handleCartAction);
  cartOrderButton.addEventListener("click", createOrderFromCart);

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
