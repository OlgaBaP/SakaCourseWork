import { getProducts } from "../api/api.js";

async function loadProducts() {
  try {
    const products = await getProducts();
    console.log(products);
  } catch (error) {
    console.error("Products loading error:", error);
  }
}

loadProducts();
