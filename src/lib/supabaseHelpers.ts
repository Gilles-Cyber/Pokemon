import { supabase } from './supabase';
import type { Product } from '../types';

export async function fetchProducts(): Promise<Product[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    lang: p.lang,
    series: p.series,
    image: p.image ?? '',
    rating: p.rating,
    reviews: p.reviews,
    description: p.description,
    features: [],
    thumbnails: p.thumbnails ?? [],
    inStock: p.in_stock,
  }));
}

export async function toggleFavorite(productId: number): Promise<boolean> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('No session');

  const { data: existing } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', session.user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', session.user.id)
      .eq('product_id', productId);
    return false;
  } else {
    await supabase
      .from('favorites')
      .insert({ user_id: session.user.id, product_id: productId });
    return true;
  }
}

export async function fetchFavoriteProductIds(): Promise<number[]> {
  if (!supabase) return [];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', session.user.id);

  return (data ?? []).map((f) => f.product_id);
}

export async function addToCart(productId: number, quantity = 1): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('No session');

  const { data: existing } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', session.user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('user_id', session.user.id)
      .eq('product_id', productId);
  } else {
    await supabase
      .from('cart_items')
      .insert({ user_id: session.user.id, product_id: productId, quantity });
  }
}

export async function fetchCartItems() {
  if (!supabase) return [];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', session.user.id);

  return (data ?? []).map((ci) => ({
    productId: ci.product_id,
    quantity: ci.quantity,
  }));
}

export async function updateCartItemQuantity(productId: number, delta: number): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('No session');

  const { data: existing } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', session.user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (!existing) return;

  const newQty = Math.max(1, existing.quantity + delta);
  if (newQty <= 0) {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', session.user.id)
      .eq('product_id', productId);
  } else {
    await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('user_id', session.user.id)
      .eq('product_id', productId);
  }
}

export async function removeFromCart(productId: number): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('No session');

  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', session.user.id)
    .eq('product_id', productId);
}
