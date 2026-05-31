import { getProducts } from "../api/api.js";

async function loadProducts() {
  try {
    await getProducts();
  } catch {
    return;
  }
}

loadProducts();
