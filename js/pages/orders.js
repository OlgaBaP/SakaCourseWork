import {
  deleteOrder,
  getOrders,
  getOrdersByUserId,
  updateOrder,
} from "../api/api.js";
import { getCurrentUser } from "../common/auth-state.js";

const ORDER_STATUSES = [
  "Ожидает",
  "Принят",
  "В обработке",
  "Доставлен",
  "Отменён",
];
const SHIPMENT_STATUSES = [
  "Ожидает обработки",
  "Готовится",
  "Отправлен",
  "Доставлен",
];

const guestSection = document.querySelector("[data-orders-guest]");
const ordersSection = document.querySelector("[data-orders-section]");
const ordersList = document.querySelector("[data-orders-list]");
const emptyMessage = document.querySelector("[data-orders-empty]");
const roleBadge = document.querySelector("[data-orders-role]");

let currentUser = null;
let isAdmin = false;

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) {
    return "Не указана";
  }

  return new Intl.DateTimeFormat("ru-RU").format(new Date(value));
}

function getShipmentStatus(order) {
  return order.shipmentStatus || order.shippingStatus || "Ожидает обработки";
}

function getOrderNumber(order) {
  return order.orderNumber || order.id;
}

function getItemsCount(order) {
  return (order.items || []).reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0);
  }, 0);
}

function getItemsLabel(count) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${count} товаров`;
  }

  if (last === 1) {
    return `${count} товар`;
  }

  if (last >= 2 && last <= 4) {
    return `${count} товара`;
  }

  return `${count} товаров`;
}

function createStatusSelect(value, options, action, orderId) {
  const select = document.createElement("select");
  select.className = "orders-status-select";
  select.dataset.orderId = orderId;
  select.dataset.orderAction = action;

  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option;
    item.selected = option === value;
    select.append(item);
  });

  return select;
}

function createReadonlyStatus(value, type = "order") {
  const status = document.createElement("span");
  status.className = `orders-status orders-status--${type}`;
  status.textContent = value;
  return status;
}

function createCell(label, content) {
  const cell = document.createElement("div");
  cell.className = "orders-list__cell";
  cell.dataset.label = label;

  if (content instanceof HTMLElement) {
    cell.append(content);
  } else {
    cell.textContent = content;
  }

  return cell;
}

function createOrderRow(order) {
  const row = document.createElement("article");
  row.className = "orders-list__row";
  row.dataset.orderId = order.id;

  row.append(
    createCell("№ заказа", getOrderNumber(order)),
    createCell("Дата заказа", formatDate(order.date || order.createdAt)),
    createCell(
      "Статус",
      isAdmin
        ? createStatusSelect(order.status, ORDER_STATUSES, "status", order.id)
        : createReadonlyStatus(order.status || "Ожидает", "order"),
    ),
    createCell("Сумма", formatPrice(order.total)),
    createCell(
      "Отгрузка",
      isAdmin
        ? createStatusSelect(
            getShipmentStatus(order),
            SHIPMENT_STATUSES,
            "shipmentStatus",
            order.id,
          )
        : createReadonlyStatus(getShipmentStatus(order), "shipping"),
    ),
    createCell("Товары", getItemsLabel(getItemsCount(order))),
  );

  if (isAdmin) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "orders-list__delete";
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить";
    deleteButton.dataset.orderAction = "delete";
    deleteButton.dataset.orderId = order.id;
    row.append(createCell("Действия", deleteButton));
  } else {
    const details = document.createElement("div");
    details.className = "orders-list__details-text";
    details.textContent = (order.items || [])
      .map((item) => {
        return `${item.title} × ${Number(item.quantity) || 0}`;
      })
      .join(", ");
    row.append(createCell("Детали", details.textContent || "Товары не указаны"));
  }

  return row;
}

function renderOrders(orders) {
  ordersList.innerHTML = "";
  emptyMessage.hidden = orders.length > 0;

  orders
    .slice()
    .sort((first, second) => {
      return Number(getOrderNumber(second)) - Number(getOrderNumber(first));
    })
    .forEach((order) => {
      ordersList.append(createOrderRow(order));
    });
}

async function loadOrders() {
  const orders = isAdmin
    ? await getOrders()
    : await getOrdersByUserId(currentUser.id);

  renderOrders(orders);
}

async function handleOrderAction(event) {
  const target = event.target.closest("[data-order-action]");

  if (!target || !isAdmin) {
    return;
  }

  const orderId = target.dataset.orderId;

  try {
    if (target.dataset.orderAction === "delete") {
      target.disabled = true;
      await deleteOrder(orderId);
      await loadOrders();
      return;
    }

    target.disabled = true;

    if (target.dataset.orderAction === "shipmentStatus") {
      await updateOrder(orderId, {
        shipmentStatus: target.value,
        shippingStatus: target.value,
      });
    } else {
      await updateOrder(orderId, {
        [target.dataset.orderAction]: target.value,
      });
    }

    target.disabled = false;
  } catch {
    await loadOrders();
  }
}

async function initOrders() {
  currentUser = getCurrentUser();

  if (!currentUser) {
    guestSection.hidden = false;
    ordersSection.hidden = true;
    return;
  }

  isAdmin = currentUser.role === "admin";
  guestSection.hidden = true;
  ordersSection.hidden = false;
  roleBadge.textContent = isAdmin ? "Администратор" : "Покупатель";
  await loadOrders();
}

ordersList.addEventListener("change", handleOrderAction);
ordersList.addEventListener("click", handleOrderAction);
window.addEventListener("auth:changed", initOrders);
initOrders();
