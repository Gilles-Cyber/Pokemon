import type { ToastType } from '../types';

export function emitToast(message: string, type: ToastType = 'info') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
}

export function emitAddToCart(productId: number) {
  window.dispatchEvent(new CustomEvent('app-add-to-cart', { detail: { productId } }));
}
