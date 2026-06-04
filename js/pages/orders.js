import {
  deleteOrder,
  getOrders,
  getOrdersByUserId,
  getUsers,
  updateOrder,
} from "../api/api.js";
import { getCurrentUser } from "../common/auth-state.js";
import { getLanguage, t, translateValue } from "../common/i18n.js";

const ORDER_STATUSES = [
  "Ожидает",
  "Принят",
  "В обработке",
  "Отправлен",
  "Доставлен",
  "Получен",
  "Отменён",
];
const SHIPMENT_STATUSES = [
  "Ожидает обработки",
  "Готовится",
  "Отправлен",
  "Доставлен",
  "Получен",
];
const USER_HEADERS = [
  "№ заказа",
  "Дата заказа",
  "Статус",
  "Сумма",
  "Отгрузка",
  "Товары",
  "Детали",
];
const ADMIN_HEADERS = [
  "№ заказа",
  "Дата заказа",
  "Покупатель",
  "Статус",
  "Сумма",
  "Отгрузка",
  "Товары",
  "Действия",
];

const ordersSection = document.querySelector("[data-orders-section]");
const ordersList = document.querySelector("[data-orders-list]");
const emptyMessage = document.querySelector("[data-orders-empty]");
const roleBadge = document.querySelector("[data-orders-role]");
const ordersTitle = document.querySelector("[data-orders-title]");
const ordersHeader = document.querySelector("[data-orders-header]");

let currentUser = null;
let isAdmin = false;
let usersById = new Map();

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) {
    return t("orders.noDate");
  }

  return new Intl.DateTimeFormat(getLanguage() === "en" ? "en-US" : "ru-RU").format(new Date(value));
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
    return t("orders.itemMany", { count });
  }

  if (last === 1) {
    return t("orders.itemOne", { count });
  }

  if (last >= 2 && last <= 4) {
    return t("orders.itemFew", { count });
  }

  return t("orders.itemMany", { count });
}

function getCustomerName(order) {
  const user = usersById.get(String(order.userId));
  const name =
    user?.fullName ||
    [user?.lastName, user?.firstName, user?.middleName].filter(Boolean).join(" ") ||
    user?.nickname ||
    user?.email ||
    t("orders.notFoundUser");

  return translateValue("person", name);
}

function createStatusSelect(value, options, action, orderId) {
  const select = document.createElement("select");
  select.className = "orders-status-select";
  select.dataset.orderId = orderId;
  select.dataset.orderAction = action;

  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = t(option);
    item.selected = option === value;
    select.append(item);
  });

  return select;
}

function createReadonlyStatus(value, type = "order") {
  const status = document.createElement("span");
  status.className = `orders-status orders-status--${type}`;
  status.textContent = t(value);
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

function createDetailsText(order) {
  return (
    (order.items || [])
      .map((item) => {
        return `${translateValue("product", item.title)} × ${Number(item.quantity) || 0}`;
      })
      .join(", ") || t("orders.noItems")
  );
}

function renderHeader() {
  ordersSection.classList.toggle("orders-section--admin", isAdmin);
  ordersSection.classList.toggle("orders-section--user", !isAdmin);
  ordersTitle.textContent = isAdmin ? t("orders.allOrders") : t("orders.userOrders");
  roleBadge.textContent = isAdmin ? t("orders.admin") : t("orders.customer");
  ordersHeader.innerHTML = "";

  (isAdmin ? ADMIN_HEADERS : USER_HEADERS).forEach((label) => {
    const item = document.createElement("span");
    item.textContent = t(label);
    ordersHeader.append(item);
  });
}

function createOrderRow(order) {
  const row = document.createElement("article");
  row.className = "orders-list__row";
  row.dataset.orderId = order.id;

  row.append(
    createCell(t("№ заказа"), getOrderNumber(order)),
    createCell(t("Дата заказа"), formatDate(order.date || order.createdAt)),
  );

  if (isAdmin) {
    row.append(createCell(t("Покупатель"), getCustomerName(order)));
  }

  row.append(
    createCell(
      t("Статус"),
      isAdmin
        ? createStatusSelect(order.status || "Ожидает", ORDER_STATUSES, "status", order.id)
        : createReadonlyStatus(order.status || "Ожидает", "order"),
    ),
    createCell(t("Сумма"), formatPrice(order.total)),
    createCell(
      t("Отгрузка"),
      isAdmin
        ? createStatusSelect(
            getShipmentStatus(order),
            SHIPMENT_STATUSES,
            "shipmentStatus",
            order.id,
          )
        : createReadonlyStatus(getShipmentStatus(order), "shipping"),
    ),
    createCell(t("Товары"), getItemsLabel(getItemsCount(order))),
  );

  if (isAdmin) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "orders-list__delete";
    deleteButton.type = "button";
    deleteButton.textContent = t("orders.delete");
    deleteButton.dataset.orderAction = "delete";
    deleteButton.dataset.orderId = order.id;
    row.append(createCell(t("Действия"), deleteButton));
  } else {
    const details = document.createElement("div");
    details.className = "orders-list__details-text";
    details.textContent = createDetailsText(order);
    row.append(createCell(t("Детали"), details));
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
  if (isAdmin) {
    const [users, orders] = await Promise.all([getUsers(), getOrders()]);
    usersById = new Map(users.map((user) => [String(user.id), user]));
    renderOrders(orders);
    return;
  }

  usersById = new Map([[String(currentUser.id), currentUser]]);
  renderOrders(await getOrdersByUserId(currentUser.id));
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
    ordersSection.hidden = true;
    window.location.replace("login.html");
    return;
  }

  isAdmin = currentUser.role === "admin";
  ordersSection.hidden = false;
  renderHeader();
  await loadOrders();
}

ordersList.addEventListener("change", handleOrderAction);
ordersList.addEventListener("click", handleOrderAction);
window.addEventListener("auth:changed", initOrders);
window.addEventListener("i18n:changed", () => {
  renderHeader();
  loadOrders();
});
initOrders();
