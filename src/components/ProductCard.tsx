import React from 'react';
import { motion } from 'motion/react';
import type { Product } from '../types';

export default function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onClick,
}: {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onAddToCart: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="group bg-surface-light dark:bg-surface-dark rounded-xl p-3 flex flex-col gap-3 shadow-sm border border-border-light dark:border-border-dark hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Shiny Mirror Effect Overlay */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none opacity-40 mix-blend-overlay"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)'
        }}
      />

      <div className="relative w-full aspect-square rounded-lg bg-background-light dark:bg-background-dark overflow-hidden">
        <img
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${product.inStock === false ? 'grayscale opacity-60' : ''}`}
          src={product.image}
          referrerPolicy="no-referrer"
        />
        {product.inStock === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm transition-colors ${isFavorite ? 'text-red-500' : 'text-text-muted'
              }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${isFavorite ? 'filled' : ''}`}>favorite</span>
          </button>
        </div>
      </div>
      <div className="flex flex-col flex-1 justify-between">
        <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="flex items-end justify-between mt-2">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] text-text-muted dark:text-text-muted-dark bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
              {product.lang}
            </span>
            <p className="text-primary font-bold text-base leading-none">${product.price}</p>
          </div>
          <button
            onClick={onAddToCart}
            className="p-2 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-transform active:scale-90 z-20"
          >
            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
