export type ToastType = 'success' | 'info' | 'error';

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

export type View =
  | 'home'
  | 'favorites'
  | 'search'
  | 'settings'
  | 'admin'
  | 'chat'
  | 'cart'
  | 'product-detail'
  | 'orders'
  | 'payment';

export type Product = {
  id: number;
  name: string;
  price: number;
  lang: string;
  image: string;
  series: string;
  isFavorite?: boolean;
  rating?: number;
  reviews?: number;
  description?: string;
  features?: string[];
  thumbnails?: string[];
  inStock?: boolean;
};

export type CartItem = {
  productId: number;
  quantity: number;
};

export type LocalOrderItem = {
  productId: number;
  quantity: number;
};

export type LocalOrder = {
  id: string;
  createdAt: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: LocalOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};
