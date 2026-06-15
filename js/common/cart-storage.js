const CART_STORAGE_PREFIX = "sakaCart:";

function getCartStorageKey(userId) {
  return `${CART_STORAGE_PREFIX}${String(userId)}`;
}

function readStoredCart(userId) {
  if (!userId) {
    return [];
  }

  const storageKey = getCartStorageKey(userId);

  try {
    const value = sessionStorage.getItem(storageKey);

    if (!value) {
      return [];
    }

    const items = JSON.parse(value);

    if (!Array.isArray(items)) {
      sessionStorage.removeItem(storageKey);
      return [];
    }

    return items;
  } catch {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      return [];
    }

    return [];
  }
}

function writeStoredCart(userId, items) {
  if (!userId) {
    return;
  }

  sessionStorage.setItem(getCartStorageKey(userId), JSON.stringify(items));
}

function clearStoredCart(userId) {
  if (!userId) {
    return;
  }

  sessionStorage.removeItem(getCartStorageKey(userId));
}

export {
  clearStoredCart,
  getCartStorageKey,
  readStoredCart,
  writeStoredCart,
};
