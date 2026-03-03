export const STORAGE_KEYS = {
  favorites: 'ctcg:v1:favorites',
  cart: 'ctcg:v1:cart',
  notifications: 'ctcg:v1:notifications',
  orders: 'ctcg:v1:orders',
} as const;

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function safeLocalStorageGet<T>(key: string): T | null {
  try {
    return safeJsonParse<T>(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
