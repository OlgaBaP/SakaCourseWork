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

async function getProducts() {
  const response = await fetch(`${API_URL}/products`);
  return checkResponse(response);
}

async function getProductById(id) {
  const response = await fetch(`${API_URL}/products/${id}`);
  return checkResponse(response);
}

async function getCategories() {
  const response = await fetch(`${API_URL}/categories`);
  return checkResponse(response);
}

async function getCart() {
  const response = await fetch(`${API_URL}/cart`);
  return checkResponse(response);
}

async function getReviews() {
  const response = await fetch(`${API_URL}/reviews`);
  return checkResponse(response);
}

async function addToCart(product) {
  const response = await fetch(
    `${API_URL}/cart`,
    createRequestOptions("POST", product),
  );

  return checkResponse(response);
}

async function removeCartItem(id) {
  const response = await fetch(`${API_URL}/cart/${id}`, {
    method: "DELETE",
  });

  return checkResponse(response);
}

async function createOrder(orderData) {
  const response = await fetch(
    `${API_URL}/orders`,
    createRequestOptions("POST", orderData),
  );

  return checkResponse(response);
}

async function createPriceRequest(requestData) {
  const response = await fetch(
    `${API_URL}/priceRequests`,
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

async function loginUser(email, password) {
  const params = new URLSearchParams({
    email,
    password,
  });

  const response = await fetch(`${API_URL}/users?${params.toString()}`);
  const users = await checkResponse(response);

  return users.length > 0 ? users[0] : null;
}

export {
  getProducts,
  getProductById,
  getCategories,
  getCart,
  getReviews,
  addToCart,
  removeCartItem,
  createOrder,
  createPriceRequest,
  createReview,
  registerUser,
  loginUser,
};
