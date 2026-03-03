import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, hasSupabaseConfig } from './lib/supabase';

// ─── Constants ───────────────────────────────────────────────────────────────
const LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCN8pKHCJ2QqfK5aLW0p7I8X0LJYAlS29erglGedN1pZFXj-aou5iN2RpQI4o7zshjwouw6aTBWwvyjFtEtynkUIIZq91TsVd-IHHEDl5FwGW1Q003PpiCMQOAQn1wyRm6aGM9iEBUq-yxMXmWcDF8Okp8BXeqTN90D_xPWYMfWdxEfBMKS2xqLiNo4jxlxNsn70gsrHcVvOwa3uWASxEkbJxfT4IcTqIxeJgYyyEobh5niHZIo78A1LYStMHVLgKlxUPpcR-WZY6g";

const STORAGE_KEYS = {
  sessionId:   'ctcg:v3:session_id',
  theme:       'ctcg:v3:theme',
  adminUnlocked: 'ctcg:v3:admin',
  visits:      'ctcg:v3:visits',
  // Local fallback mirrors
  favorites:   'ctcg:v3:favorites',
  cart:        'ctcg:v3:cart',
  orders:      'ctcg:v3:orders',
} as const;

// ─── Session ID (persistent UUID for anonymous users) ────────────────────────
function getOrCreateSessionId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.sessionId);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.sessionId, id);
  }
  return id;
}

// ─── DB helpers ──────────────────────────────────────────────────────────────
async function dbUpsertSession(sessionId: string) {
  if (!supabase || !hasSupabaseConfig) return;
  await supabase.from('anon_sessions').upsert({ session_id: sessionId, last_seen: new Date().toISOString() });
}

async function dbLoadFavorites(sessionId: string): Promise<number[]> {
  if (!supabase || !hasSupabaseConfig) return [];
  const { data } = await supabase.from('favorites').select('product_id').eq('session_id', sessionId);
  return (data || []).map((r: any) => Number(r.product_id));
}

async function dbSaveFavorite(sessionId: string, productId: number, add: boolean) {
  if (!supabase || !hasSupabaseConfig) return;
  if (add) {
    await supabase.from('favorites').upsert({ session_id: sessionId, product_id: productId });
  } else {
    await supabase.from('favorites').delete().eq('session_id', sessionId).eq('product_id', productId);
  }
}

async function dbLoadCart(sessionId: string): Promise<CartItem[]> {
  if (!supabase || !hasSupabaseConfig) return [];
  const { data } = await supabase.from('cart_items').select('product_id, quantity').eq('session_id', sessionId);
  return (data || []).map((r: any) => ({ productId: Number(r.product_id), quantity: Number(r.quantity) }));
}

async function dbSaveCartItem(sessionId: string, productId: number, quantity: number) {
  if (!supabase || !hasSupabaseConfig) return;
  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('session_id', sessionId).eq('product_id', productId);
  } else {
    await supabase.from('cart_items').upsert({ session_id: sessionId, product_id: productId, quantity });
  }
}

async function dbLoadOrders(sessionId: string): Promise<LocalOrder[]> {
  if (!supabase || !hasSupabaseConfig) return [];
  const { data: orders } = await supabase
    .from('orders').select('*').eq('session_id', sessionId).order('created_at', { ascending: false });
  if (!orders) return [];
  const orderIds = orders.map((o: any) => o.id);
  const { data: items } = orderIds.length
    ? await supabase.from('order_items').select('*').in('order_id', orderIds)
    : { data: [] };
  return orders.map((o: any) => ({
    id: o.id,
    createdAt: new Date(o.created_at).getTime(),
    status: o.status as any,
    items: (items || []).filter((i: any) => i.order_id === o.id).map((i: any) => ({ productId: Number(i.product_id), quantity: Number(i.quantity) })),
    subtotal: Number(o.subtotal),
    shipping: Number(o.shipping),
    tax: Number(o.tax),
    total: Number(o.total),
  }));
}

// ─── Toast event helpers ──────────────────────────────────────────────────────
function emitToast(message: string, type: 'success' | 'info' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
}

// ─── Image upload ─────────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string | null> {
  if (!supabase || !hasSupabaseConfig) return null;
  try {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
  } catch (e) {
    console.error(e);
    emitToast('Image upload failed', 'error');
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number; name: string; price: number; lang: string;
  image: string; series: string; isFavorite?: boolean;
  rating?: number; reviews?: number; description?: string;
  features?: string[]; thumbnails?: string[]; inStock?: boolean;
}

interface CartItem { productId: number; quantity: number; }

type LocalOrder = {
  id: string; createdAt: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
  items: { productId: number; quantity: number }[];
  subtotal: number; shipping: number; tax: number; total: number;
};

type View = 'home' | 'favorites' | 'search' | 'settings' | 'admin' | 'chat' | 'cart' | 'product-detail' | 'orders' | 'payment';
type ToastType = 'success' | 'info' | 'error';
type Toast = { id: number; message: string; type: ToastType };

// ─── Mock Products ────────────────────────────────────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "Silver Tempest Booster Box", price: 140, lang: "Eng", series: "Sword & Shield", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYjsqDdpF3v7wftG_7lQHRh2WZ4tvV_Srd48m8STAdJ-0S8ZQ0y1IMybRhuZJ9H-MjUTXrDBo3CZIyIvQ4Vkoqtps0chaM4KNnXGV5F6RXaIC2vmHxD09dmHSVdmA9WzURCqYYRJG1dG-Bi9wbhcPIVMb4fgGWc2vqIij8GbVUtKPSxQ_qgX0hwzgcsmuqFL_RkbAs9hkDc3nGEiKFr33ggvpU8BB5tY-6J9treqvkn0A3zvuOY7AsnRnsSTO19gFzrPQtWX4ZMnY", rating: 4.8, reviews: 92, description: "Uncover the mystery of the deep in the Silver Tempest Booster Box.", features: ["100% Authentic Factory Sealed", "36 Booster Packs", "Chase Lugia VSTAR"], inStock: true },
  { id: 2, name: "Lost Origin Booster Box", price: 180, lang: "Eng", series: "Sword & Shield", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOe_AHLszFhNQdRC1O5HWJKuRHEfzG5fvTvyq99vXlI2wcWyq63T6YaadabCrCSYjQhOv--OCsNbOSNygIuS3qFaHWOY2SmuSyUDJKdr_G4FZnewOhe0-zxVh45iMcgqpqh9W1qP4-OEiGjn2QTuAV4Kht4zYOjhxABMp4p2PGRoqphTLHig8IVcAprbExw6iorW6S_Z6YASNZ6SZxqYWiw9V9J0kDSZZm2oVLCSQSfMCpENsMXfPL5VZQ5zrfRKSDIKPbDLxDbF8", inStock: true },
  { id: 3, name: "Brilliant Stars Booster Box", price: 160, lang: "Eng", series: "Sword & Shield", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ2O0Oh30YCgRAr73tn-X-0UGdAxtj6Et9ejZBWOGVVc5Z4oFy5SGa6Gt6gPxSg14XE5iP9M5dKmHCukgQEYoMAldW7pZPbZW2Fh3nZXVCCxQ3lxnTTQsYBWdvBngP92O3gJfftMQbY-HEBFopGFlRGRLacDpIwQdV1UcBp85ecS-LrNqkKwv8ML-te4RxURdJArlMdKjAIaUmp1TSLTCJZ0o3iJQMLba4lm3xCZaW-_hlcm9YsAzeXBTvfbQl7OfokzlvisdpjCE", inStock: true },
  { id: 4, name: "Evolving Skies Booster Box", price: 450, lang: "Eng", series: "Sword & Shield", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLwUdzjYX7qApwYRtaXuX3n_TmFUhQY4uP530toSh6JJF16OSgV_mA-YYt9luAegOavXC5SLSJkrdeOqfvw7UOH8EVKcTJxGjZikoWzCTyUK1FhnybTK33SrnUPwWLkq7AtoE-5cvMEy2nfIja-2tKjMrnnhSQGDqTyfERwQLj4IinAEkt_F1WR0APCz4HGBaP6sG1bauJx3yzPAgPRPS94ZfvlnUGLaapiYn1aJgnp0PbsbdFet5y5Ibm0PrO5CXglOmfDCiFrLw", inStock: false },
  { id: 5, name: "Fusion Strike Booster Box", price: 120, lang: "Eng", series: "Sword & Shield", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHEjLhEPpxnSthwyM5vQvfjh_5gIP_hYeDuOopB0mcXHresollbu_hraDhjLt40vcZ5QAcM7YhbgPhcWPBqYIUrRUWSIwUlvZJGm_h-tnUFa_zOPY0CmmtQrSSAsPhWnMFL60VNo0R3UIWrvyt8v9e_LNdSprzSmgzEiNBbEaCVyDMShZwg1EySfbLjdtXik0vHIKjqxkY50oL-1xj3giFrl0_T9WbYA07FE5PBkJhvCAple5DoQRX-XvBgHaNXDih86WCmqJhao0", inStock: true },
  { id: 6, name: "Chilling Reign Booster Box", price: 145, lang: "Eng", series: "Sword & Shield", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAA9fmzTYBLiOysFKVKVowHPMO_ymIUs1nmNKHUGbc-6ZxMOx7TKsoRFHWowEzRi5BZjyLcovD2FOKn1kjtThh8RzxADpyQXDdXwS719aqX8tEhUroyN0lwyz6zce4SI9AA9XInKyw0CFDTeanTeiD8cM3J6JtQ3ED8FwD9TxSfAa1Ls5KSuG_14f8o-fUmgUY3m_qAwW2vNUmAclCoFEgzNdBBfQaPgcdt9HK6e6PNNeOESuVEvPstYIttb9NqhWxQNIKhgs2OP2I", inStock: true },
  { id: 7, name: "VMAX Climax Japanese Box", price: 110, lang: "Jpn", series: "Sword & Shield", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZIPxmrbgHLKJwa2Zr8mXCpKxS890q0f5_K7joqXn-Fa8J3iJJTw3nGXhLTp3o2P55OagFm2Ro6odlZ0TgCcaU_zj5KOK0ePdHvsycGvAbUqfciBz-crDaIAaZZVmLye6LqxjCVCvv3nHLNI7xjp1I0Jj7Lw1gazpB_plsCBtprjKYGcVQL4qJJTyHWgC7xBU5xrt-jyZWmwTh2TMRv6FsPqqirvZs-6sKfYeF2fmieybyFs43XgMjwonikp593BZ29FikUnK1FPI", inStock: true },
  { id: 8, name: "Vivid Voltage Booster Box", price: 130, lang: "Eng", series: "Sword & Shield", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZpfU9IIDfISZRij9nq1zq5uIkiQQiG0F0gjHDcYmd8g3knG5_wobE0sCmm67VWqFDWq6aX967h0I4W67fddu1Pp8BhsaOYVIzV4J4UwqVl6j0IKyjcz_SKGoJqwzGOmS2neRER_Hb2Oyv7NgHcFUwt2HP0i8payi6oxypH1cv4sjs-WsR4vNycC2bAS_t7sRaLCaqgNpgya-Xhbfncki9pz2sEjsOTsIdVrsZdkEV3M8jAA3lkwQvK5iqVqOovDeU2YTUtqsKWbo", inStock: true },
  { id: 11, name: "151 Ultra Premium Collection", price: 119.99, lang: "Eng", series: "Scarlet & Violet", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAY_bpB95tDoe4tnRxhaKwnuIUbXFKeeUSr_0d17LN2M8DVR95SOWmu-dfzMC-l3zcwfcGtdI-dFdWYwofoXQhGoMiCn0N-9jlBuaFK7ekvalFoRc46VMSFArPwPzceS0ZgTu10KOKh0vBtdsKZrx8L6fx6ThiKVYKy-JK40maLzklCrsl0WpdqmOJ2pMFAQuAoI89xtDCoMYQGvkp2aRMgZg4fe43AkNnSZtuNykPqXd9DMESS9n07_kc7OaAkGJN5wX0yw9oyo9o", inStock: true },
  { id: 13, name: "Scarlet & Violet: 151 Booster Box", price: 140.00, lang: "Jpn", series: "Scarlet & Violet", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEg0FL8fVF3SrWrTznZHG98V0sPOZFKZoks7X4cw79L0PPs5OHBPipPbUJpw_axQlbuoP5_65a3ODL92M1qnQ1ERZNgjpf47Fo6nd2sFw154XySCt_SgLH0DSJcGO98UvzFJsPon8JsPvLDVw-5Feds2U3EefB6-LJ_Io9751dm6oB2w0E_s440tYev3btEKmfVar2bk496cxCQkhcxcceSMGmzEEmr3fJavVLDhKUYm2iK5FQmag7DUYAPCJo4mz9TUTsRdktmf0", rating: 4.9, reviews: 128, description: "Relive the original Kanto journey with the Scarlet & Violet: 151 Booster Box.", features: ["100% Authentic Factory Sealed", "36 Booster Packs", "Chase Illustration Rares"], inStock: true },
  { id: 16, name: "Paldea Evolved Booster Box", price: 125.00, lang: "Eng", series: "Scarlet & Violet", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4KwVqKSwPUGOlvjpreBqF-nNiXkv2OmviQFtWmIPVpZOcMiXeegrfQ62yWCU-3bHS2cF5GGbAyUQkcrFwLmwUdtSA3931NSlul9As2l-wjBNzvVhhzD2hRps__fqiny2OzCf9PWM8i6tBvvN52cxuYAji1HR8QigjvgJsUeihP0m8b2qSRXPLD8x_2evVN1Mbcsf6HZGvV6d7qSx_nKQOc8wKHXBWCKFntCcFl0-AAQBIZqLe8phZQoeiWCVeNL5fhjAHYoeOzH8", inStock: true, rating: 4.7, reviews: 45 },
  { id: 17, name: "Obsidian Flames Booster Box", price: 110.00, lang: "Eng", series: "Scarlet & Violet", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuATY0O4QU6HrASu5KHXd11tu5SrdT5vtHbQn1jEywLhMGNRuotZNu5jrrmQWu8HHI1MUFPNpt4auaPkWzgPlzGc2QabK-mDXGa_Ce6wgn5YYYiDB6x_QMvrmTWQ4RhkCBhdNlebaEqEGlQAn2RRMqlCYK1MWXgvGSk3OOmk65beKRXAYjf0fX1FTgAGx6FMctDXLkmHhKBzb80trcifkr9lY9fB_HRxfHLFc-U5fn7bbnVlprZbXY15OECHnFdFctGB-M5Hq7rSS4w", inStock: true, rating: 4.6, reviews: 38 },
  { id: 19, name: "Skyridge Booster Box", price: 45000.00, lang: "Eng", series: "Vintage", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuArsSwDAgYjbP0qJUwbWDdjronk6f1Qq0qjYozYeEEh5LZOI2_CfApOYh4FPwcJxcc0DaQP4hVuTCPzm-KRUJh9qJncbb4mKy13-HHPNDvVGx1s2Wr3e2aAoM2NSvm2iOeOd1Qx80VTV3Cy-j70yGCG5DYQjuGAsy0UZNaVLk4IOLjUywhYaafyL10ZTEP0KrjnpIkvC_zIUpKymGrM_4qdvv0hj5CtH-MMPPcnJQKJwh6UfHLKVy1HIc-kV9bg", inStock: true, rating: 5.0, reviews: 12 },
  { id: 20, name: "Base Set (Unlimited) Booster Box", price: 15000.00, lang: "Eng", series: "Vintage", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu3Q_G81gKl6hjWgJ2Bc7g19Dn2Zx7vc-o52fwase-txCqXMBfpF6FIvA1tHYcHGzH2pNglVpR2huxG24j88almRA7zVh4bhpGsMaM-xAlnu3VHI_zpT4qMXIXZMSamm97ChOb4oXvgjo2C061wbOsildWlEidhQKP6dlPM0xji124x9NwCDFWUOh4wwuD_nZX8hutgdn_g_uwTlRb6QPMNEZgqT27Z1fLZNPDIn1jB0DI96SV4qenNjuqKbAEPzVIIjI9wwsDChQ", inStock: true, rating: 5.0, reviews: 25 },
];

// ─── Safe localStorage helpers ───────────────────────────────────────────────
function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Products
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const PRODUCTS = React.useMemo(() => {
    const merged = [...dbProducts];
    MOCK_PRODUCTS.forEach(p => { if (!merged.find(m => Number(m.id) === p.id)) merged.push(p); });
    return merged;
  }, [dbProducts]);

  // User data — initialized from localStorage immediately (no flicker)
  const [favorites, setFavorites] = useState<number[]>(() => lsGet<number[]>(STORAGE_KEYS.favorites) || []);
  const [cart, setCart] = useState<CartItem[]>(() => lsGet<CartItem[]>(STORAGE_KEYS.cart) || []);
  const [orders, setOrders] = useState<LocalOrder[]>(() => lsGet<LocalOrder[]>(STORAGE_KEYS.orders) || []);

  // Flags to prevent overwriting local state before DB load
  const dbLoaded = useRef({ favorites: false, cart: false, orders: false });

  const [notifications, setNotifications] = useState({ priceDrop: true, orderStatus: true, newArrivals: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSeries, setActiveSeries] = useState('All Sets');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem(STORAGE_KEYS.theme) as any) || 'light');

  // Admin
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminPinGate, setShowAdminPinGate] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(() => sessionStorage.getItem(STORAGE_KEYS.adminUnlocked) === '1');

  // Product form
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(1);
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = toastIdRef.current++;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Register session + splash
  useEffect(() => {
    dbUpsertSession(sessionId);
    setTimeout(() => setShowSplash(false), 2400);
  }, [sessionId]);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // Toast event bridge
  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{ message: string; type: ToastType }>;
      showToast(ce.detail.message, ce.detail.type ?? 'info');
    };
    window.addEventListener('app-toast', h as EventListener);
    return () => window.removeEventListener('app-toast', h as EventListener);
  }, [showToast]);

  // Load products from DB
  useEffect(() => {
    if (!supabase || !hasSupabaseConfig) return;
    supabase.from('products').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setDbProducts(data.map((p: any) => ({ id: Number(p.id), name: p.name, price: Number(p.price), lang: p.lang, image: p.image, series: p.series, rating: p.rating, reviews: p.reviews, description: p.description, features: p.features, thumbnails: p.thumbnails, inStock: p.in_stock })));
    });
  }, []);

  // Load favorites from DB (merge with local)
  useEffect(() => {
    dbLoadFavorites(sessionId).then(dbFavs => {
      if (!dbLoaded.current.favorites) {
        // Merge DB + local (union)
        setFavorites(prev => {
          const merged = Array.from(new Set([...prev, ...dbFavs]));
          lsSet(STORAGE_KEYS.favorites, merged);
          return merged;
        });
        dbLoaded.current.favorites = true;
      }
    });
  }, [sessionId]);

  // Load cart from DB
  useEffect(() => {
    dbLoadCart(sessionId).then(dbCart => {
      if (!dbLoaded.current.cart) {
        setCart(prev => {
          // Merge: prefer DB quantity if exists, else keep local
          const merged = [...dbCart];
          prev.forEach(localItem => {
            if (!merged.find(i => i.productId === localItem.productId)) merged.push(localItem);
          });
          lsSet(STORAGE_KEYS.cart, merged);
          return merged;
        });
        dbLoaded.current.cart = true;
      }
    });
  }, [sessionId]);

  // Load orders from DB
  useEffect(() => {
    dbLoadOrders(sessionId).then(dbOrders => {
      if (!dbLoaded.current.orders && dbOrders.length > 0) {
        setOrders(dbOrders);
        lsSet(STORAGE_KEYS.orders, dbOrders);
        dbLoaded.current.orders = true;
      } else {
        dbLoaded.current.orders = true;
      }
    });
  }, [sessionId]);

  // Persist favorites/cart to localStorage on every change
  useEffect(() => { lsSet(STORAGE_KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { lsSet(STORAGE_KEYS.cart, cart); }, [cart]);
  useEffect(() => { lsSet(STORAGE_KEYS.orders, orders); }, [orders]);

  // Logo click → admin gate
  useEffect(() => {
    if (logoClicks === 0) return;
    const t = setTimeout(() => setLogoClicks(0), 3000);
    return () => clearTimeout(t);
  }, [logoClicks]);

  // Route sync
  useEffect(() => {
    const p = location.pathname;
    if (p === '/') { setCurrentView('home'); return; }
    if (p === '/favorites') { setCurrentView('favorites'); return; }
    if (p === '/cart') { setCurrentView('cart'); return; }
    if (p === '/orders') { setCurrentView('orders'); return; }
    if (p === '/settings') { setCurrentView('settings'); return; }
    if (p === '/chat') { setCurrentView('chat'); return; }
    if (p === '/admin') {
      if (!adminUnlocked) { showToast('Admin locked. Tap logo 7×.', 'info'); navigate('/', { replace: true }); return; }
      setCurrentView('admin'); return;
    }
    if (p === '/payment') { setCurrentView('payment'); return; }
    if (p.startsWith('/product/')) {
      const id = parseInt(p.replace('/product/', ''), 10);
      if (isFinite(id)) { setSelectedProductId(id); setCurrentView('product-detail'); return; }
    }
    navigate('/', { replace: true });
  }, [location.pathname]);

  // Visitor tracking
  useEffect(() => {
    const track = async () => {
      try {
        const geo = await fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => ({}));
        const today = new Date().toISOString().split('T')[0];
        if (supabase && hasSupabaseConfig) {
          await supabase.from('visitors').insert({ session_id: sessionId, ip: geo.ip || 'unknown', country: geo.country_name || 'unknown', city: geo.city || 'unknown', user_agent: navigator.userAgent, referrer: document.referrer || 'direct', date: today }).then(() => {});
        }
        const visits: any[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.visits) || '[]');
        if (!visits.some((v: any) => v.session_id === sessionId && v.date === today)) {
          visits.unshift({ session_id: sessionId, ip: geo.ip, country: geo.country_name, city: geo.city, visited_at: new Date().toISOString(), date: today, referrer: document.referrer || 'direct' });
          localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(visits.slice(0, 200)));
        }
      } catch {}
    };
    track();
  }, [sessionId]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goBack = () => { window.history.length > 1 ? navigate(-1) : navigate('/', { replace: true }); };
  const nav = (view: View) => {
    const routes: Record<View, string> = { home: '/', favorites: '/favorites', cart: '/cart', orders: '/orders', settings: '/settings', chat: '/chat', admin: '/admin', payment: '/payment', search: '/search', 'product-detail': selectedProductId ? `/product/${selectedProductId}` : '/' };
    navigate(routes[view] || '/');
  };

  // ── Favorites ──────────────────────────────────────────────────────────────
  const toggleFavorite = useCallback((id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const removing = favorites.includes(id);
    const name = PRODUCTS.find(p => p.id === id)?.name;
    setFavorites(prev => removing ? prev.filter(f => f !== id) : [...prev, id]);
    dbSaveFavorite(sessionId, id, !removing);
    showToast(removing ? `Removed from favorites` : `❤️ Added ${name ?? ''} to favorites`, removing ? 'info' : 'success');
  }, [favorites, sessionId, PRODUCTS, showToast]);

  // ── Cart ────────────────────────────────────────────────────────────────────
  const addToCart = useCallback((productId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const name = PRODUCTS.find(p => p.id === productId)?.name;
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      const newQty = (existing?.quantity || 0) + 1;
      const updated = existing ? prev.map(i => i.productId === productId ? { ...i, quantity: newQty } : i) : [...prev, { productId, quantity: 1 }];
      dbSaveCartItem(sessionId, productId, newQty);
      return updated;
    });
    showToast(`🛒 Added ${name ?? ''} to cart`, 'success');
  }, [PRODUCTS, sessionId, showToast]);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
    dbSaveCartItem(sessionId, productId, 0);
  }, [sessionId]);

  const updateCartQty = useCallback((productId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = Math.max(1, i.quantity + delta);
      dbSaveCartItem(sessionId, productId, newQty);
      return { ...i, quantity: newQty };
    }));
  }, [sessionId]);

  // ── Admin ────────────────────────────────────────────────────────────────────
  const handleLogoClick = () => {
    const n = logoClicks + 1;
    if (n === 7) { setShowAdminPinGate(true); setLogoClicks(0); }
    else setLogoClicks(n);
  };

  const onAdminPinDigit = (d: string) => {
    setAdminPin(prev => {
      const next = (prev + d).slice(0, 4);
      if (next.length === 4) setTimeout(() => submitPin(next), 0);
      return next;
    });
  };
  const submitPin = (pin: string) => {
    if (pin === '1966') {
      setAdminUnlocked(true); sessionStorage.setItem(STORAGE_KEYS.adminUnlocked, '1');
      setShowAdminPinGate(false); setAdminPin('');
      showToast('✅ Admin access granted', 'success');
      navigate('/admin');
    } else { showToast('Incorrect PIN', 'error'); setAdminPin(''); }
  };

  // ── Product CRUD ─────────────────────────────────────────────────────────────
  const saveProduct = async (p: Partial<Product>) => {
    if (!supabase || !hasSupabaseConfig) return;
    try {
      if (p.id) {
        await supabase.from('products').update({ name: p.name, price: p.price, lang: p.lang, image: p.image, series: p.series, in_stock: p.inStock, description: p.description, features: p.features }).eq('id', p.id);
        setDbProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...p } as Product : x));
        showToast('Product updated', 'success');
      } else {
        const { data } = await supabase.from('products').insert([{ name: p.name, price: p.price, lang: p.lang, image: p.image, series: p.series, in_stock: p.inStock, description: p.description, features: p.features }]).select().single();
        if (data) setDbProducts(prev => [{ id: Number(data.id), name: data.name, price: Number(data.price), lang: data.lang, image: data.image, series: data.series, inStock: data.in_stock } as Product, ...prev]);
        showToast('Product added', 'success');
      }
      setShowProductModal(false); setEditingProduct(null);
    } catch (err: any) { showToast(err.message || 'Save failed', 'error'); }
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm('Delete this product?')) return;
    await supabase?.from('products').delete().eq('id', id);
    setDbProducts(prev => prev.filter(p => p.id !== id));
    showToast('Deleted', 'info');
  };

  // ── Checkout / Place order ────────────────────────────────────────────────────
  const placeOrder = async () => {
    const subtotal = cart.reduce((s, i) => s + (PRODUCTS.find(p => p.id === i.productId)?.price || 0) * i.quantity, 0);
    const shipping = 12.50;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    try {
      const { data: order, error } = await supabase!.from('orders').insert({ session_id: sessionId, status: 'Processing', subtotal, shipping, tax, total }).select().single();
      if (error) throw error;
      const items = cart.map(i => ({ order_id: order.id, product_id: i.productId, quantity: i.quantity, price_at_time: PRODUCTS.find(p => p.id === i.productId)?.price || 0 }));
      await supabase!.from('order_items').insert(items);
      const newOrder: LocalOrder = { id: order.id, createdAt: Date.now(), status: 'Processing', items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })), subtotal, shipping, tax, total };
      setOrders(prev => [newOrder, ...prev]);
      // Clear cart
      await supabase!.from('cart_items').delete().eq('session_id', sessionId);
      setCart([]);
      showToast('🎉 Order placed successfully!', 'success');
      nav('orders');
    } catch (err: any) { showToast(err.message || 'Failed to place order', 'error'); }
  };

  // ── Filtered products ─────────────────────────────────────────────────────────
  const filteredProducts = PRODUCTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = activeCategory === 'All' ||
      (activeCategory === 'Japanese' && p.lang === 'Jpn') ||
      (activeCategory === 'English' && p.lang === 'Eng') ||
      (activeCategory === 'Modern' && ['Sword & Shield', 'Scarlet & Violet', 'Sun & Moon'].includes(p.series)) ||
      (activeCategory === 'Vintage' && p.series === 'Vintage');
    return matchSearch && matchCat;
  });

  const favoriteProducts = PRODUCTS.filter(p => favorites.includes(p.id)).filter(p => activeSeries === 'All Sets' || p.series === activeSeries);
  const cartTotal = cart.reduce((s, i) => s + (PRODUCTS.find(p => p.id === i.productId)?.price || 0) * i.quantity, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="flex flex-col min-h-screen w-full max-w-screen-xl mx-auto bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden">

        {/* Admin PIN Gate */}
        <AdminPinGate
          show={showAdminPinGate}
          pin={adminPin}
          onDigit={onAdminPinDigit}
          onBackspace={() => setAdminPin(p => p.slice(0, -1))}
          onClear={() => setAdminPin('')}
          onClose={() => { setShowAdminPinGate(false); setAdminPin(''); }}
        />

        {/* Toasts */}
        {toasts.length > 0 && (
          <div className="fixed top-4 left-0 right-0 z-[120] px-4 pointer-events-none">
            <div className="max-w-md mx-auto flex flex-col gap-2">
              {toasts.map(t => (
                <motion.div key={t.id} initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }}
                  className={`rounded-xl px-4 py-3 shadow-xl text-sm font-semibold backdrop-blur-md ${t.type === 'success' ? 'bg-emerald-500/95 text-white' : t.type === 'error' ? 'bg-red-500/95 text-white' : 'bg-slate-900/90 text-white'}`}>
                  {t.message}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Views */}
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" />
          ) : currentView === 'admin' ? (
            <AdminDashboard key="admin" sessionId={sessionId} products={PRODUCTS} orders={orders} onBack={goBack} onAddNew={() => { setEditingProduct(null); setShowProductModal(true); }} onEdit={p => { setEditingProduct(p); setShowProductModal(true); }} onDelete={deleteProduct} onSettings={() => nav('settings')} />
          ) : currentView === 'chat' ? (
            <ChatInterface key="chat" sessionId={sessionId} onBack={goBack} adminMode={false} />
          ) : currentView === 'settings' ? (
            <SettingsView key="settings" onBack={goBack} notifications={notifications} setNotifications={setNotifications} theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} isAdminMode={adminUnlocked} onExitAdmin={() => { setAdminUnlocked(false); sessionStorage.removeItem(STORAGE_KEYS.adminUnlocked); nav('home'); }} onNavigate={nav} />
          ) : currentView === 'cart' ? (
            <CartView key="cart" cart={cart} products={PRODUCTS} onBack={goBack} onUpdateQuantity={updateCartQty} onRemove={removeFromCart} onNavigate={nav} />
          ) : currentView === 'product-detail' ? (
            <ProductDetailView key="product-detail" productId={selectedProductId} products={PRODUCTS} onBack={goBack} isFavorite={selectedProductId ? favorites.includes(selectedProductId) : false} onToggleFavorite={() => selectedProductId && toggleFavorite(selectedProductId)} onAddToCart={() => selectedProductId && addToCart(selectedProductId)} />
          ) : currentView === 'orders' ? (
            <OrderHistoryView key="orders" products={PRODUCTS} onBack={goBack} orders={orders} />
          ) : currentView === 'payment' ? (
            <PaymentView key="payment" products={PRODUCTS} onBack={goBack} cart={cart} total={cartTotal + 12.50 + cartTotal * 0.08} onPaid={placeOrder} onOtherPayment={() => showToast('Coming soon', 'info')} />
          ) : currentView === 'favorites' ? (
            <FavoritesView key="favorites" products={favoriteProducts} activeSeries={activeSeries} setActiveSeries={setActiveSeries} onToggleFavorite={id => toggleFavorite(id)} onBack={goBack} onAddToCart={addToCart} onProductClick={id => { setSelectedProductId(id); nav('product-detail'); }} />
          ) : (
            /* HOME */
            <HomeView
              key="home"
              products={filteredProducts}
              allProducts={PRODUCTS}
              favorites={favorites}
              cart={cart}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              setSearchQuery={setSearchQuery}
              setActiveCategory={setActiveCategory}
              onLogoClick={handleLogoClick}
              onToggleFavorite={toggleFavorite}
              onAddToCart={addToCart}
              onProductClick={id => { setSelectedProductId(id); nav('product-detail'); }}
              onNavigate={nav}
              theme={theme}
              toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            />
          )}
        </AnimatePresence>

        {/* Bottom Nav (on main views) */}
        {!showSplash && ['home', 'favorites', 'chat', 'orders', 'settings', 'product-detail'].includes(currentView) && (
          <BottomNav currentView={currentView} favCount={favorites.length} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} onNavigate={nav} />
        )}

        {/* Product Form Modal */}
        <ProductFormModal isOpen={showProductModal} product={editingProduct} onClose={() => { setShowProductModal(false); setEditingProduct(null); }} onSave={saveProduct} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME VIEW
// ─────────────────────────────────────────────────────────────────────────────
function HomeView({ products, allProducts, favorites, cart, searchQuery, activeCategory, setSearchQuery, setActiveCategory, onLogoClick, onToggleFavorite, onAddToCart, onProductClick, onNavigate, theme, toggleTheme }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div onClick={onLogoClick} className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">CHRIS TCG</h1>
            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>BOOSTER BOX SHOP</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={() => onNavigate('chat')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">chat</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Hero */}
        <div className="px-4 pt-6 pb-8 overflow-visible perspective-[1200px]">
          <div className="relative w-full aspect-[16/10] flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 z-0"></div>
            <motion.div className="relative w-[180px] h-[240px] preserve-3d z-10" animate={{ rotateY: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
              {[
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDEg0FL8fVF3SrWrTznZHG98V0sPOZFKZoks7X4cw79L0PPs5OHBPipPbUJpw_axQlbuoP5_65a3ODL92M1qnQ1ERZNgjpf47Fo6nd2sFw154XySCt_SgLH0DSJcGO98UvzFJsPon8JsPvLDVw-5Feds2U3EefB6-LJ_Io9751dm6oB2w0E_s440tYev3btEKmfVar2bk496cxCQkhcxcceSMGmzEEmr3fJavVLDhKUYm2iK5FQmag7DUYAPCJo4mz9TUTsRdktmf0",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBooVJEPhWsiSijLZFSZR3LMNNGivN8QyaxJHifLde6MpoahT-eqNZf_FvE0ZnYgoMTgdm7wA285cAVmZjC9QM8lfU-oEDW-xqpMcoqSTGpm3hdqBtBIOjf965npqEjSSA3d5KzdyThV1YmBRHjRYSc1DRh0-sKvkfB9B1IewoOSN6fx70R-zAqCqgv_csFQN3aaumnq2c_KTooGgLNFXVr6sTu5EpWzcyeNbqyblIjlEFceYxV4VyePn50DZV9Pv7lty3p-QdhIos",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuATY0O4QU6HrASu5KHXd11tu5SrdT5vtHbQn1jEywLhMGNRuotZNu5jrrmQWu8HHI1MUFPNpt4auaPkWzgPlzGc2QabK-mDXGa_Ce6wgn5YYYiDB6x_QMvrmTWQ4RhkCBhdNlebaEqEGlQAn2RRMqlCYK1MWXgvGSk3OOmk65beKRXAYjf0fX1FTgAGx6FMctDXLkmHhKBzb80trcifkr9lY9fB_HRxfHLFc-U5fn7bbnVlprZbXY15OECHnFdFctGB-M5Hq7rSS4w",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuC4KwVqKSwPUGOlvjpreBqF-nNiXkv2OmviQFtWmIPVpZOcMiXeegrfQ62yWCU-3bHS2cF5GGbAyUQkcrFwLmwUdtSA3931NSlul9As2l-wjBNzvVhhzD2hRps__fqiny2OzCf9PWM8i6tBvvN52cxuYAji1HR8QigjvgJsUeihP0m8b2qSRXPLD8x_2evVN1Mbcsf6HZGvV6d7qSx_nKQOc8wKHXBWCKFntCcFl0-AAQBIZqLe8phZQoeiWCVeNL5fhjAHYoeOzH8",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDYjsqDdpF3v7wftG_7lQHRh2WZ4tvV_Srd48m8STAdJ-0S8ZQ0y1IMybRhuZJ9H-MjUTXrDBo3CZIyIvQ4Vkoqtps0chaM4KNnXGV5F6RXaIC2vmHxD09dmHSVdmA9WzURCqYYRJG1dG-Bi9wbhcPIVMb4fgGWc2vqIij8GbVUtKPSxQ_qgX0hwzgcsmuqFL_RkbAs9hkDc3nGEiKFr33ggvpU8BB5tY-6J9treqvkn0A3zvuOY7AsnRnsSTO19gFzrPQtWX4ZMnY"
              ].map((img, i) => (
                <div key={i} className="absolute inset-0 bg-cover bg-center rounded-xl shadow-2xl border border-white/20" style={{ transform: `rotateY(${i * 72}deg) translateZ(160px)`, backgroundImage: `url("${img}")` }} />
              ))}
            </motion.div>
            <div className="absolute inset-x-0 bottom-[-20px] pointer-events-none flex flex-col items-center justify-end z-[20]">
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-3 px-6 rounded-3xl border border-white/30 dark:border-slate-700/50 shadow-xl">
                <span className="inline-block bg-gradient-to-r from-primary to-purple-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg mb-1">✨ Featured Hits</span>
                <h2 className="text-[22px] font-black text-slate-900 dark:text-white leading-tight">Premium TCG<br />Booster Boxes</h2>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="relative w-full overflow-hidden bg-primary/10 border-y border-primary/20 py-2 mb-4">
          <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 15 }} className="flex w-[200%] gap-8 items-center whitespace-nowrap">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-8 items-center">
                <span className="text-xs font-bold text-primary flex items-center gap-1">🔥 JUST PULLED: Charizard ex!</span>
                <span className="text-[10px] text-primary/50">•</span>
                <span className="text-xs font-bold text-primary flex items-center gap-1">✨ RESTOCK: Evolving Skies</span>
                <span className="text-[10px] text-primary/50">•</span>
                <span className="text-xs font-bold text-primary flex items-center gap-1">🎁 FREE SHIPPING above $150</span>
                <span className="text-[10px] text-primary/50">•</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-around px-4 py-3 mx-4 mb-4 bg-primary/5 rounded-2xl border border-primary/10">
          {[{ label: 'Products', value: `${allProducts.length}+` }, { label: 'Sold', value: '2.1k' }, { label: 'Rating', value: '4.9★' }].map(s => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-base font-black text-primary">{s.value}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {['All', 'English', 'Japanese', 'Modern', 'Vintage'].map(cat => (
            <motion.button key={cat} whileTap={{ scale: 0.93 }} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/30 border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700'}`}>
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 mb-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center material-symbols-outlined text-slate-400 text-[20px]">search</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search booster boxes..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-base font-black text-slate-900 dark:text-white">All Products</h2>
          <span className="text-xs text-slate-400">{products.length} items</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-6">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} isFavorite={favorites.includes(product.id)} onToggleFavorite={e => { e.stopPropagation(); onToggleFavorite(product.id); }} onAddToCart={e => { e.stopPropagation(); onAddToCart(product.id); }} onClick={() => onProductClick(product.id)} />
          ))}
        </div>
      </main>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
function BottomNav({ currentView, favCount, cartCount, onNavigate }: { currentView: View; favCount: number; cartCount: number; onNavigate: (v: View) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pb-4 pt-2 z-[60]">
      <div className="grid grid-cols-6 items-end max-w-2xl mx-auto">
        {[
          { icon: 'home', label: 'Home', view: 'home' as View },
          { icon: 'favorite', label: 'Saved', view: 'favorites' as View, badge: favCount },
          { icon: 'shopping_cart', label: 'Cart', view: 'cart' as View, badge: cartCount },
          { icon: 'receipt_long', label: 'Orders', view: 'orders' as View },
          { icon: 'chat', label: 'Chat', view: 'chat' as View },
          { icon: 'settings', label: 'Settings', view: 'settings' as View },
        ].map(item => (
          <div key={item.view} className="relative w-full">
            <button onClick={() => onNavigate(item.view)} className={`flex flex-col items-center justify-center gap-1 w-full transition-all ${currentView === item.view ? 'text-primary scale-110' : 'text-slate-400'}`}>
              <span className={`material-symbols-outlined text-[24px] ${currentView === item.view ? 'filled' : ''}`}>{item.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
            {item.badge && item.badge > 0 && (
              <span className="absolute top-0 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">{item.badge}</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart, onClick }: any) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.04 }}
      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); x.set(e.clientX - r.left - r.width / 2); y.set(e.clientY - r.top - r.height / 2); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onClick={onClick} className="group bg-white dark:bg-slate-800 rounded-xl p-3 flex flex-col gap-3 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow cursor-pointer relative overflow-hidden">
      <div style={{ transform: 'translateZ(25px)' }} className="relative w-full aspect-square rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
        <img alt={product.name} className={`w-full h-full object-cover transition-transform group-hover:scale-110 duration-500 ${!product.inStock ? 'grayscale opacity-60' : ''}`} src={product.image} referrerPolicy="no-referrer" />
        {!product.inStock && <div className="absolute inset-0 flex items-center justify-center"><span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Out of Stock</span></div>}
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <button onClick={onToggleFavorite} className={`p-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm ${isFavorite ? 'text-red-500' : 'text-slate-400'}`}>
            <span className={`material-symbols-outlined text-[18px] ${isFavorite ? 'filled' : ''}`}>favorite</span>
          </button>
          <button onClick={onAddToCart} className="p-1.5 rounded-full bg-primary text-white opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-lg">
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
          </button>
        </div>
      </div>
      <div style={{ transform: 'translateZ(15px)' }}>
        <h3 className="text-sm font-semibold line-clamp-2 text-slate-800 dark:text-slate-100 min-h-[2.5em]">{product.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-primary font-bold">${product.price.toLocaleString()}</p>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{product.lang}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITES VIEW
// ─────────────────────────────────────────────────────────────────────────────
function FavoritesView({ products, activeSeries, setActiveSeries, onToggleFavorite, onBack, onAddToCart, onProductClick }: any) {
  const SERIES = ['All Sets', 'Sword & Shield', 'Scarlet & Violet', 'Sun & Moon', 'Vintage'];
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span></button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1">Saved Items</h1>
        <span className="text-sm text-slate-400">{products.length}</span>
      </header>
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {SERIES.map(s => <button key={s} onClick={() => setActiveSeries(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${activeSeries === s ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700'}`}>{s}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">favorite_border</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No saved items</h3>
            <p className="text-slate-500 text-sm">Tap the heart on any product to save it here.</p>
            <button onClick={onBack} className="mt-6 bg-primary text-white px-6 py-2 rounded-full font-bold">Browse Products</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 py-2">
            {products.map((p: Product) => <ProductCard key={p.id} product={p} isFavorite={true} onToggleFavorite={(e: any) => { e.stopPropagation(); onToggleFavorite(p.id); }} onAddToCart={(e: any) => { e.stopPropagation(); onAddToCart(p.id); }} onClick={() => onProductClick(p.id)} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT INTERFACE (anonymous user ↔ admin)
// ─────────────────────────────────────────────────────────────────────────────
function ChatInterface({ sessionId, onBack, adminMode = false, adminThreadId }: { sessionId: string; onBack: () => void; adminMode?: boolean; adminThreadId?: string }) {
  const [threadId, setThreadId] = useState<string | null>(adminThreadId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize thread
  useEffect(() => {
    if (!supabase || !hasSupabaseConfig) { setLoading(false); return; }
    const init = async () => {
      let tid = adminThreadId || threadId;
      if (!tid && !adminMode) {
        // Find or create thread for this session
        const { data: existing } = await supabase.from('chat_threads').select('id').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (existing) {
          tid = existing.id;
        } else {
          const { data: created } = await supabase.from('chat_threads').insert({ session_id: sessionId, subject: 'Support Chat' }).select().single();
          if (created) tid = created.id;
        }
      }
      if (!tid) { setLoading(false); return; }
      setThreadId(tid);

      // Load messages
      const { data: msgs } = await supabase.from('chat_messages').select('*').eq('thread_id', tid).order('created_at', { ascending: true });
      if (msgs) setMessages(msgs);
      setLoading(false);

      // Mark thread as read for admin
      if (adminMode) {
        await supabase.from('chat_threads').update({ unread_by_admin: false }).eq('id', tid);
      }

      // Realtime subscription
      const channel = supabase.channel(`thread:${tid}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${tid}` }, payload => {
          setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [sessionId, adminThreadId, adminMode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !threadId || sending || !supabase) return;
    setSending(true);
    setNewMessage('');
    const optimistic = { id: `temp-${Date.now()}`, thread_id: threadId, body: text, sender: adminMode ? 'admin' : 'user', created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    try {
      const { data, error } = await supabase.from('chat_messages').insert({ thread_id: threadId, body: text, sender: adminMode ? 'admin' : 'user' }).select().single();
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      emitToast('Failed to send', 'error');
    } finally { setSending(false); }
  };

  const greeting = !adminMode && messages.length === 0 && !loading;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-[100dvh] bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined text-slate-600 dark:text-slate-300">arrow_back_ios_new</span></button>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 relative">
          <img src={LOGO_URL} alt="Support" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{adminMode ? 'Customer' : 'Chris Support'}</p>
          <p className="text-xs text-emerald-500 font-medium">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-900/50 p-4">
        {loading && <div className="flex justify-center py-8"><span className="text-slate-400 text-sm">Loading...</span></div>}

        {greeting && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center py-8 px-4 gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
              <img src={LOGO_URL} alt="Support" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Hi there! 👋</h3>
              <p className="text-sm text-slate-500 mt-1">Send us a message and we'll get back to you ASAP.<br />No login needed!</p>
            </div>
            {/* Quick replies */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['Stock inquiry 📦', 'Shipping question 🚚', 'Price check 💰', 'Returns & refunds ↩️'].map(q => (
                <button key={q} onClick={() => setNewMessage(q)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">{q}</button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isMe = adminMode ? msg.sender === 'admin' : msg.sender === 'user';
              const consecutive = idx > 0 && messages[idx - 1].sender === msg.sender;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${consecutive ? 'mt-0' : 'mt-2'}`}>
                  {!isMe && !consecutive && (
                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-200"><img src={LOGO_URL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>
                  )}
                  {!isMe && consecutive && <div className="w-7 shrink-0" />}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 rounded-bl-sm'}`}>
                    <p>{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-slate-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-3 pb-[calc(env(safe-area-inset-bottom,12px)+12px)] shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-full px-4 pr-1 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
          <input ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={!supabase ? 'Chat unavailable (no Supabase config)' : 'Message...'}
            disabled={!supabase || !hasSupabaseConfig}
            className="flex-1 bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none" />
          <button onClick={sendMessage} disabled={!newMessage.trim() || sending || !supabase}
            className={`p-2.5 rounded-full transition-all ${newMessage.trim() && supabase ? 'bg-primary text-white shadow-md shadow-primary/30 active:scale-95' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
            <span className="material-symbols-outlined text-[18px]">{sending ? 'sync' : 'send'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard({ sessionId, products, orders, onBack, onAddNew, onEdit, onDelete, onSettings }: any) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'inventory'>('dashboard');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('chat_threads').select('id', { count: 'exact' }).eq('unread_by_admin', true).then(({ count }: any) => setUnread(count || 0));
    const ch = supabase.channel('admin_unread').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_threads' }, () => {
      supabase.from('chat_threads').select('id', { count: 'exact' }).eq('unread_by_admin', true).then(({ count }: any) => setUnread(count || 0));
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col pb-20 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded-lg"><span className="material-symbols-outlined">grid_view</span></div>
          <div><h1 className="font-bold text-slate-900 dark:text-white">Admin Dashboard</h1><p className="text-xs text-slate-500">Chris TCG Store</p></div>
        </div>
        <button onClick={onBack} className="flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-bold transition-colors">
          <span className="material-symbols-outlined text-xl">logout</span> Exit
        </button>
      </header>

      {/* Welcome card */}
      <div className="p-4">
        <div className="flex items-center gap-4 bg-gradient-to-r from-primary to-blue-600 text-white p-5 rounded-2xl shadow-lg shadow-primary/20">
          <div className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/10 overflow-hidden">
            <img src={LOGO_URL} alt="Admin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl">Hello, Chris! 👋</h2>
            <p className="text-white/80 text-sm">Store Owner • Online</p>
          </div>
          <button onClick={onSettings} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg"><span className="material-symbols-outlined text-white">settings</span></button>
        </div>
      </div>

      {activeTab === 'inbox' ? (
        <AdminChatInbox onBack={() => setActiveTab('dashboard')} />
      ) : activeTab === 'inventory' ? (
        <AdminInventory products={products} onAddNew={onAddNew} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <>
          {/* Stats */}
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
            {[
              { label: 'Total Sales', value: '$12,450', icon: 'attach_money', color: 'text-primary bg-primary/10', badge: '+12%' },
              { label: 'Active Orders', value: String(orders.length), icon: 'package_2', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20', badge: 'LIVE' },
              { label: 'Products', value: String(products.length), icon: 'inventory', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20', badge: 'Total' },
            ].map(s => (
              <div key={s.label} className="min-w-[150px] flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${s.color}`}><span className="material-symbols-outlined text-xl">{s.icon}</span></div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{s.badge}</span>
                </div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </div>
          <VisitorPanel />
        </>
      )}

      {/* Admin Nav */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 pb-5 pt-3 flex justify-around items-end z-[60]">
        {[
          { tab: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
          { tab: 'inbox', icon: 'chat_bubble', label: 'Inbox', badge: unread },
          { tab: 'inventory', icon: 'inventory_2', label: 'Inventory' },
        ].map(item => (
          <button key={item.tab} onClick={() => setActiveTab(item.tab as any)} className={`flex flex-col items-center gap-1 p-2 rounded-xl relative ${activeTab === item.tab ? 'text-primary' : 'text-slate-400'}`}>
            <span className={`material-symbols-outlined text-[26px] ${activeTab === item.tab ? 'filled' : ''}`}>{item.icon}</span>
            <span className="text-[10px] font-semibold">{item.label}</span>
            {item.badge && item.badge > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{item.badge}</span>}
          </button>
        ))}
        <div className="relative -top-5">
          <button className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-slate-50 dark:border-slate-950">
            <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          </button>
        </div>
        <button onClick={onSettings} className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400">
          <span className="material-symbols-outlined text-[26px]">settings</span>
          <span className="text-[10px] font-semibold">Settings</span>
        </button>
      </nav>
    </motion.div>
  );
}

// Admin inventory tab
function AdminInventory({ products, onAddNew, onEdit, onDelete }: any) {
  return (
    <div className="px-4 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Inventory</h3>
        <button onClick={onAddNew} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-lg shadow-primary/30 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-sm">add</span>Add New
        </button>
      </div>
      <div className="flex flex-col gap-3 pb-28">
        {products.map((p: Product) => (
          <div key={p.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-3 items-center">
            <div className="w-14 h-18 rounded-lg flex-shrink-0 bg-cover bg-center bg-slate-100" style={{ backgroundImage: `url("${p.image}")`, height: '72px' }} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">{p.name}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.inStock ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>{p.inStock ? 'In Stock' : 'Sold Out'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{p.series} • {p.lang}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-primary font-bold">${p.price.toLocaleString()}</p>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(p)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                  <button onClick={() => onDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Admin chat inbox
function AdminChatInbox({ onBack }: { onBack: () => void }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    if (!supabase) return;
    const { data: ths } = await supabase.from('chat_threads').select('*').order('last_message_at', { ascending: false });
    if (!ths) return;
    const { data: msgs } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false });
    setThreads(ths.map((t: any) => ({ ...t, latestMsg: (msgs || []).find((m: any) => m.thread_id === t.id) })).filter((t: any) => t.latestMsg));
  }, []);

  useEffect(() => {
    loadThreads();
    if (!supabase) return;
    const ch = supabase.channel('admin_inbox_live').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, loadThreads).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadThreads]);

  if (selectedThread) {
    return <ChatInterface sessionId="admin" onBack={() => { setSelectedThread(null); loadThreads(); }} adminMode={true} adminThreadId={selectedThread} />;
  }

  return (
    <div className="flex-1 px-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chat Inbox</h2>
        <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">{threads.filter(t => t.unread_by_admin).length} Unread</span>
      </div>
      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">chat_bubble_outline</span>
          <p className="text-slate-500">No conversations yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((t: any) => (
            <button key={t.id} onClick={() => setSelectedThread(t.id)} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all text-left">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                <span className="material-symbols-outlined text-[22px]">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`text-sm ${t.unread_by_admin ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>Visitor</p>
                  <span className="text-[10px] text-slate-400 shrink-0">{t.latestMsg ? new Date(t.latestMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${t.unread_by_admin ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-500'}`}>{t.latestMsg?.body || 'No messages'}</p>
              </div>
              {t.unread_by_admin && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-2"></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VISITOR PANEL
// ─────────────────────────────────────────────────────────────────────────────
function VisitorPanel() {
  const [visitors, setVisitors] = useState<any[]>([]);
  useEffect(() => {
    try { setVisitors(JSON.parse(localStorage.getItem(STORAGE_KEYS.visits) || '[]')); } catch {}
  }, []);
  const timeAgo = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };
  return (
    <div className="px-4 mb-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">travel_explore</span>
            <h3 className="font-bold text-slate-900 dark:text-white">Live Visitors</h3>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{visitors.length} tracked</span>
        </div>
        {visitors.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8 px-4">No visitors logged yet.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto no-scrollbar divide-y divide-slate-50 dark:divide-slate-800">
            {visitors.map((v: any, i: number) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">📍</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{v.city !== 'unknown' ? v.city : 'Unknown'} · {v.country || '?'}</p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{timeAgo(v.visited_at)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{v.referrer !== 'direct' ? `via ${v.referrer}` : 'Direct'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CART VIEW
// ─────────────────────────────────────────────────────────────────────────────
function CartView({ cart, products, onBack, onUpdateQuantity, onRemove, onNavigate }: any) {
  const subtotal = cart.reduce((s: number, i: CartItem) => s + (products.find((p: Product) => p.id === i.productId)?.price || 0) * i.quantity, 0);
  const shipping = cart.length > 0 ? 12.50 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const totalBoxes = cart.reduce((s: number, i: CartItem) => s + i.quantity, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-white dark:bg-slate-900">
      <div className="sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 pb-2 justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="size-12 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shopping Cart</h2>
        <div className="w-12" />
      </div>
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">shopping_cart_off</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h3>
            <p className="text-slate-500 text-sm">Add some booster boxes to get started.</p>
            <button onClick={onBack} className="mt-6 bg-primary text-white px-6 py-2 rounded-full font-bold">Browse</button>
          </div>
        ) : (
          <>
            {cart.map((item: CartItem) => {
              const p = products.find((x: Product) => x.id === item.productId);
              if (!p) return null;
              return (
                <div key={item.productId} className="flex gap-4 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-20 h-20 rounded-lg bg-cover bg-center bg-slate-100 shrink-0" style={{ backgroundImage: `url("${p.image}")` }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.lang === 'Jpn' ? 'Japanese' : 'English'}</p>
                    <p className="text-primary font-bold mt-1">${p.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <button onClick={() => onRemove(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
                      <button onClick={() => onUpdateQuantity(item.productId, -1)} className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-700 shadow-sm"><span className="material-symbols-outlined text-[14px]">remove</span></button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.productId, 1)} className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-700 shadow-sm"><span className="material-symbols-outlined text-[14px]">add</span></button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="px-6 py-4 space-y-3">
              {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Shipping', `$${shipping.toFixed(2)}`], ['Tax (8%)', `$${tax.toFixed(2)}`]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-900 dark:text-white">{v}</span></div>
              ))}
              <div className="h-px bg-slate-100 dark:bg-slate-800" />
              <div className="flex justify-between"><span className="font-bold text-slate-900 dark:text-white">Total</span><span className="text-xl font-bold text-primary">${total.toFixed(2)}</span></div>
            </div>
          </>
        )}
      </div>
      {cart.length > 0 && (
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 shadow-xl">
          {totalBoxes < 5 ? (
            <div className="space-y-2">
              <p className="text-red-500 text-xs font-semibold text-center">Minimum 5 boxes required. Add {5 - totalBoxes} more.</p>
              <button disabled className="w-full bg-slate-200 dark:bg-slate-700 text-slate-400 font-bold py-4 rounded-xl cursor-not-allowed">Checkout · ${total.toFixed(2)}</button>
            </div>
          ) : (
            <button onClick={() => onNavigate('payment')} className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-between px-6 shadow-lg shadow-primary/30 transition-all">
              <span>Checkout</span><span>${total.toFixed(2)}</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ProductDetailView({ productId, products, onBack, isFavorite, onToggleFavorite, onAddToCart }: any) {
  const product = products.find((p: Product) => p.id === productId);
  const [activeThumb, setActiveThumb] = useState(0);
  if (!product) return null;
  const thumbs = product.thumbnails?.length ? product.thumbnails : [product.image];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-white dark:bg-slate-900 overflow-hidden z-50">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button onClick={onToggleFavorite} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
          <span className={`material-symbols-outlined text-[22px] ${isFavorite ? 'filled text-red-400' : 'text-white'}`}>favorite</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pb-36 no-scrollbar">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800">
          <motion.img key={activeThumb} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={thumbs[activeThumb]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          {thumbs.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {thumbs.map((_: any, i: number) => <div key={i} className={`w-2 h-2 rounded-full ${i === activeThumb ? 'bg-white' : 'bg-white/40'}`} />)}
            </div>
          )}
        </div>
        {/* Thumbnails */}
        {thumbs.length > 1 && (
          <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
            {thumbs.map((t: string, i: number) => (
              <button key={i} onClick={() => setActiveThumb(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${i === activeThumb ? 'border-primary scale-105' : 'border-slate-100 opacity-60'}`}>
                <img src={t} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}
        {/* Info */}
        <div className="px-4 py-4">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-3">{product.series}</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{product.name}</h1>
          {product.rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => <span key={i} className={`material-symbols-outlined text-[16px] ${i < Math.floor(product.rating) ? 'filled' : ''}`}>star</span>)}</div>
              <span className="text-sm text-slate-500">({product.reviews || 0})</span>
            </div>
          )}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-3xl font-black text-primary">${product.price.toFixed(2)}</p>
            <span className={`flex items-center gap-1.5 text-sm font-bold ${product.inStock !== false ? 'text-emerald-600' : 'text-red-600'}`}>
              {product.inStock !== false && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />}
              {product.inStock !== false ? 'In Stock' : 'Sold Out'}
            </span>
          </div>
          {product.description && <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">{product.description}</p>}
          {product.features?.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {product.features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-[18px]">{i === 0 ? 'verified_user' : i === 1 ? 'package_2' : 'cards'}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="fixed bottom-[84px] left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 z-[70]">
        <div className="flex gap-3 max-w-md mx-auto">
          <button onClick={onBack} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold py-3.5 px-4 rounded-xl flex items-center"><span className="material-symbols-outlined">arrow_back</span></button>
          <div className="flex flex-col justify-center ml-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Price</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
          </div>
          <button onClick={onAddToCart} disabled={product.inStock === false} className={`flex-1 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all ${product.inStock === false ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700 text-white shadow-lg shadow-primary/20 active:scale-[0.98]'}`}>
            <span className="material-symbols-outlined">shopping_cart</span>Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER HISTORY
// ─────────────────────────────────────────────────────────────────────────────
function OrderHistoryView({ products, orders, onBack }: any) {
  const [filter, setFilter] = useState('All');
  const filtered = orders.filter((o: LocalOrder) => filter === 'All' || o.status === filter);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-white dark:bg-slate-900">
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">arrow_back</span></button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">My Orders</h1>
          <div className="w-10" />
        </div>
        <div className="flex gap-3 px-4 pb-3 overflow-x-auto no-scrollbar">
          {['All', 'Processing', 'Shipped', 'Delivered'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{f}</button>
          ))}
        </div>
      </div>
      <main className="flex-1 px-4 py-4 space-y-4 pb-24 overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">receipt_long</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No orders yet</h3>
            <p className="text-slate-500 text-sm">Your orders will appear here after checkout.</p>
          </div>
        ) : filtered.map((order: LocalOrder) => {
          const firstProduct = products.find((p: Product) => p.id === order.items[0]?.productId);
          return (
            <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex gap-3 mb-3">
                <div className="w-16 h-16 rounded-xl bg-cover bg-center bg-slate-100 shrink-0" style={{ backgroundImage: `url("${firstProduct?.image || ''}")` }} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{firstProduct?.name || 'Order'}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{order.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">#{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-primary font-bold mt-1">${order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT VIEW
// ─────────────────────────────────────────────────────────────────────────────
function PaymentView({ onBack, total, onPaid, onOtherPayment, products, cart }: any) {
  const COINBASE_KEY = '663f548e-7abc-4143-bb26-e1e62438b82d';
  const [status, setStatus] = useState<'idle' | 'creating' | 'awaiting' | 'paid' | 'error'>('idle');
  const [chargeUrl, setChargeUrl] = useState<string | null>(null);
  const [chargeCode, setChargeCode] = useState<string | null>(null);
  const pollRef = useRef<any>(null);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const createCharge = async () => {
    if (status !== 'idle') return;
    setStatus('creating');
    try {
      const res = await fetch('https://api.commerce.coinbase.com/charges', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CC-Api-Key': COINBASE_KEY, 'X-CC-Version': '2018-03-22' }, body: JSON.stringify({ name: 'Chris TCG Order', description: 'Booster Box Purchase', pricing_type: 'fixed_price', local_price: { amount: total.toFixed(2), currency: 'USD' }, metadata: {} }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'API error');
      setChargeUrl(json.data.hosted_url); setChargeCode(json.data.code);
      setStatus('awaiting');
      window.open(json.data.hosted_url, '_blank');
      pollRef.current = setInterval(async () => {
        const pr = await fetch(`https://api.commerce.coinbase.com/charges/${json.data.code}`, { headers: { 'X-CC-Api-Key': COINBASE_KEY, 'X-CC-Version': '2018-03-22' } });
        const pj = await pr.json();
        if ((pj.data?.timeline || []).find((t: any) => t.status === 'COMPLETED' || t.status === 'CONFIRMED')) { clearInterval(pollRef.current); setStatus('paid'); }
      }, 5000);
    } catch (e: any) { setStatus('error'); emitToast(e.message || 'Failed', 'error'); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-white dark:bg-slate-900">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Payment</h1>
        <button onClick={onOtherPayment} className="text-primary text-sm font-semibold px-2 py-1">Other</button>
      </div>
      <div className="flex-1 overflow-y-auto pb-28 p-4 space-y-4 no-scrollbar">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex items-center justify-between">
          <div><p className="text-xs font-semibold uppercase text-slate-500">Total due</p><p className="text-3xl font-extrabold text-slate-900 dark:text-white">${total.toFixed(2)}</p></div>
          <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border">Coinbase Commerce</span>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center"><span className="material-symbols-outlined text-white text-[18px]">currency_bitcoin</span></div>
              <div><h2 className="font-bold text-slate-900 dark:text-white">Pay with Coinbase</h2><p className="text-xs text-slate-500">Crypto payments</p></div>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'paid' ? 'bg-emerald-100 text-emerald-700' : status === 'awaiting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{status === 'paid' ? '✅ Confirmed' : status === 'awaiting' ? '⌛ Awaiting...' : 'Ready'}</span>
          </div>
          {status === 'awaiting' && chargeUrl && <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><p className="text-sm text-amber-700 mb-2 font-medium">Complete payment in the new tab, then return here.</p><a href={chargeUrl} target="_blank" className="text-xs text-primary underline">Re-open ↗</a></div>}
          <button onClick={createCharge} disabled={status !== 'idle' && status !== 'error'} className={`w-full rounded-xl px-4 py-3.5 font-bold text-white flex items-center justify-center gap-2 ${status !== 'idle' && status !== 'error' ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black shadow-lg'}`}>
            {status === 'creating' ? 'Creating...' : <><span className="material-symbols-outlined text-[18px]">open_in_new</span>Pay ${total.toFixed(2)} with Crypto</>}
          </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 px-4 py-4 z-[80]">
        <button onClick={() => status === 'paid' ? onPaid() : emitToast('Waiting for payment...', 'error')} className={`w-full font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all ${status === 'paid' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
          <span className="material-symbols-outlined">check_circle</span>
          {status === 'paid' ? 'Confirm Order' : 'Waiting for payment...'}
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function SettingsView({ onBack, notifications, setNotifications, theme, toggleTheme, isAdminMode, onExitAdmin, onNavigate }: any) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 pb-2 justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
        <div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* Appearance */}
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-4 pt-6 pb-2">Appearance</h3>
        <div className="mx-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span></div>
              <div><p className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p><p className="text-xs text-slate-400">Toggle appearance</p></div>
            </div>
            <button onClick={toggleTheme} className={`w-12 h-6 rounded-full transition-all relative ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200'}`}>
              <motion.div animate={{ x: theme === 'dark' ? 26 : 2 }} className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-4 pt-6 pb-2">Notifications</h3>
        <div className="mx-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
          {[
            { key: 'priceDrop', icon: 'notifications_active', label: 'Price Drop Alerts', sub: 'Wishlist sale notifications' },
            { key: 'orderStatus', icon: 'package_2', label: 'Order Status', sub: 'Shipping & delivery updates' },
            { key: 'newArrivals', icon: 'mail', label: 'New Arrivals', sub: 'Weekly newsletter' },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-4 p-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">{item.icon}</span></div>
                <div><p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p><p className="text-xs text-slate-400">{item.sub}</p></div>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notifications[item.key]} onChange={() => setNotifications((n: any) => ({ ...n, [item.key]: !n[item.key] }))} />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          ))}
        </div>

        {/* Admin */}
        {isAdminMode && (
          <>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-4 pt-6 pb-2">Admin</h3>
            <div className="mx-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <button onClick={onExitAdmin} className="flex items-center gap-3 p-4 w-full hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"><span className="material-symbols-outlined">admin_panel_settings</span></div>
                <p className="text-red-600 font-medium">Exit Admin Mode</p>
              </button>
            </div>
          </>
        )}

        <div className="text-center py-8 text-xs text-slate-400">Version 3.0.0 · Session-Based Architecture</div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PIN GATE
// ─────────────────────────────────────────────────────────────────────────────
function AdminPinGate({ show, pin, onDigit, onBackspace, onClear, onClose }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">ADMIN ACCESS</h2>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Enter security PIN</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center"><span className="material-symbols-outlined text-slate-500">close</span></button>
        </div>
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white">{pin[i] ? '•' : ''}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} onClick={() => onDigit(d)} className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-700">{d}</button>
          ))}
          <button onClick={onClear} className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700">CLR</button>
          <button onClick={() => onDigit('0')} className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-700">0</button>
          <button onClick={onBackspace} className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"><span className="material-symbols-outlined text-slate-600 dark:text-slate-300">backspace</span></button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ProductFormModal({ isOpen, product, onClose, onSave }: any) {
  const [form, setForm] = useState<Partial<Product>>({ name: '', price: 0, lang: 'Eng', image: '', series: 'Scarlet & Violet', inStock: true, description: '', features: [] });
  useEffect(() => { setForm(product || { name: '', price: 0, lang: 'Eng', image: '', series: 'Scarlet & Violet', inStock: true, description: '', features: [] }); }, [product, isOpen]);
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{product ? 'Edit Product' : 'Add Product'}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><span className="material-symbols-outlined text-slate-500">close</span></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {[
              { label: 'Product Name', key: 'name', type: 'text', placeholder: 'e.g. Silver Tempest Booster Box' },
              { label: 'Price ($)', key: 'price', type: 'number', placeholder: '0' },
              { label: 'Image URL', key: 'image', type: 'text', placeholder: 'https://...' },
              { label: 'Series', key: 'series', type: 'text', placeholder: 'Sword & Shield' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  placeholder={f.placeholder} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-medium" />
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Language</label>
              <select value={form.lang} onChange={e => setForm(p => ({ ...p, lang: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-medium">
                <option value="Eng">English</option><option value="Jpn">Japanese</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Description</label>
              <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div><p className="text-sm font-bold text-slate-900 dark:text-white">In Stock</p><p className="text-xs text-slate-400">Toggle availability</p></div>
              <button onClick={() => setForm(p => ({ ...p, inStock: !p.inStock }))} className={`w-12 h-6 rounded-full transition-all relative ${form.inStock ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <motion.div animate={{ x: form.inStock ? 26 : 2 }} className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={() => onSave(form)} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-700 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">{product ? 'Save Changes' : 'Create'}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLASH SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5 }}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-white dark:bg-slate-900">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary blur-[100px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-primary/20">
          <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">CHRIS TCG</h1>
          <p className="text-primary font-medium text-sm tracking-[0.2em] uppercase mt-1">Booster Box Shop</p>
        </div>
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map(i => <div key={i} className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
      <div className="absolute bottom-8 text-slate-400 text-xs">v3.0.0 · Session Persistence</div>
    </motion.div>
  );
}