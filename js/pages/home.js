import { getProducts } from "../api/api.js";

async function loadProducts() {
  try {
    const products = await getProducts();
  } catch (error) {
    console.error("Products loading error:", error);
  }
}

loadProducts();
