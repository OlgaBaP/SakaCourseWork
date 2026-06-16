const API_URL = "http://localhost:3000";

async function checkResponse(response) {
  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}

function createRequestOptions(method, data) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

async function getProducts(options = {}) {
  const searchParams = new URLSearchParams();

  if (options.category) {
    searchParams.set("category", options.category);
  }

  if (options.quality) {
    searchParams.set("quality", options.quality);
  }

  if (options.color) {
    searchParams.set("color", options.color);
  }

  if (options.sort === "price-asc") {
    searchParams.set("_sort", "price");
  }

  if (options.sort === "price-desc") {
    searchParams.set("_sort", "-price");
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    `${API_URL}/products${queryString ? `?${queryString}` : ""}`,
  );
  return checkResponse(response);
}

async function getProductById(id) {
  const response = await fetch(`${API_URL}/products/${id}`);
  return checkResponse(response);
}

async function createProduct(productData) {
  const response = await fetch(
    `${API_URL}/products`,
    createRequestOptions("POST", productData),
  );

  return checkResponse(response);
}

async function updateProduct(id, productData) {
  const response = await fetch(
    `${API_URL}/products/${id}`,
    createRequestOptions("PATCH", productData),
  );

  return checkResponse(response);
}

async function deleteProduct(id) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });

  return checkResponse(response);
}

async function getCategories() {
  const response = await fetch(`${API_URL}/categories`);
  return checkResponse(response);
}

async function getReviews() {
  const response = await fetch(`${API_URL}/reviews`);
  return checkResponse(response);
}

async function getUsers() {
  const response = await fetch(`${API_URL}/users`);
  return checkResponse(response);
}

async function getUserById(id) {
  const response = await fetch(`${API_URL}/users/${id}`);
  return checkResponse(response);
}

async function updateUser(id, data) {
  const response = await fetch(
    `${API_URL}/users/${id}`,
    createRequestOptions("PATCH", data),
  );

  return checkResponse(response);
}

async function getUserByEmail(email) {
  const users = await getUsers();

  return (
    users.find((user) => {
      return String(user.email || "").toLowerCase() === email.toLowerCase();
    }) || null
  );
}

function normalizePhone(phone) {
  return String(phone)
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^\+/, "");
}

async function getUserByPhone(phone) {
  const users = await getUsers();
  const normalizedPhone = normalizePhone(phone);

  return (
    users.find((user) => {
      return normalizePhone(user.phone || "") === normalizedPhone;
    }) || null
  );
}

async function getOrders() {
  const response = await fetch(`${API_URL}/orders`);
  return checkResponse(response);
}

async function getOrdersByUserId(userId) {
  const orders = await getOrders();

  return orders.filter((order) => {
    return String(order.userId) === String(userId);
  });
}

async function createOrder(orderData) {
  const response = await fetch(
    `${API_URL}/orders`,
    createRequestOptions("POST", orderData),
  );

  return checkResponse(response);
}

async function updateOrder(id, data) {
  const response = await fetch(
    `${API_URL}/orders/${id}`,
    createRequestOptions("PATCH", data),
  );

  return checkResponse(response);
}

async function deleteOrder(id) {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    method: "DELETE",
  });

  return checkResponse(response);
}

async function createPriceRequest(requestData) {
  const response = await fetch(
    `${API_URL}/priceRequests`,
    createRequestOptions("POST", requestData),
  );

  return checkResponse(response);
}

async function createDeliveryQuestion(questionData) {
  const response = await fetch(
    `${API_URL}/deliveryQuestions`,
    createRequestOptions("POST", questionData),
  );

  return checkResponse(response);
}

async function createContactRequest(requestData) {
  const response = await fetch(
    `${API_URL}/contactRequests`,
    createRequestOptions("POST", requestData),
  );

  return checkResponse(response);
}

async function createReview(reviewData) {
  const response = await fetch(
    `${API_URL}/reviews`,
    createRequestOptions("POST", reviewData),
  );

  return checkResponse(response);
}

async function registerUser(userData) {
  const response = await fetch(
    `${API_URL}/users`,
    createRequestOptions("POST", userData),
  );

  return checkResponse(response);
}

async function createUser(userData) {
  return registerUser(userData);
}

async function loginUser(email, password) {
  const users = await getUsers();
  const user = users.find((item) => {
    return (
      String(item.email || "").toLowerCase() === email.toLowerCase() &&
      item.password === password
    );
  });

  return user || null;
}

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getReviews,
  getUsers,
  getUserById,
  updateUser,
  getUserByEmail,
  getUserByPhone,
  createOrder,
  getOrders,
  getOrdersByUserId,
  updateOrder,
  deleteOrder,
  createPriceRequest,
  createDeliveryQuestion,
  createContactRequest,
  createReview,
  createUser,
  registerUser,
  loginUser,
};
