import React from 'react';
import NavItem from './NavItem';

export default function BottomNav({
  current,
  favoritesCount,
  cartCount,
  onGo,
}: {
  current: 'home' | 'favorites' | 'cart' | 'orders' | 'chat' | 'settings';
  favoritesCount: number;
  cartCount: number;
  onGo: (view: 'home' | 'favorites' | 'cart' | 'orders' | 'chat' | 'settings') => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-2 pb-5 pt-3 z-[60] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
      <div className="flex justify-center gap-6 sm:gap-8 items-end max-w-2xl mx-auto">
        <NavItem icon="home" label="Home" active={current === 'home'} onClick={() => onGo('home')} />

        <div className="relative flex flex-col items-center">
          <NavItem icon="favorite" label="Favorites" active={current === 'favorites'} onClick={() => onGo('favorites')} />
          {favoritesCount > 0 && (
            <span className="absolute -top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 shadow-sm">
              {favoritesCount > 99 ? '99+' : favoritesCount}
            </span>
          )}
        </div>

        <div className="relative flex flex-col items-center">
          <NavItem icon="shopping_cart" label="Cart" active={current === 'cart'} onClick={() => onGo('cart')} />
          {cartCount > 0 && (
            <span className="absolute -top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 shadow-sm">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </div>

        <NavItem icon="receipt_long" label="Orders" active={current === 'orders'} onClick={() => onGo('orders')} />
        <NavItem icon="chat" label="Chat" active={current === 'chat'} onClick={() => onGo('chat')} />
        <NavItem icon="settings" label="Settings" active={current === 'settings'} onClick={() => onGo('settings')} />
      </div>
    </nav>
  );
}
