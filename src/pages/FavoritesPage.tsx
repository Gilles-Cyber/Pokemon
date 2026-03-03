import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product } from '../types';

export default function FavoritesPage({
  goBack,
  activeSeries,
  setActiveSeries,
  favoriteProducts,
  onToggleFavorite,
}: {
  goBack: () => void;
  activeSeries: string;
  setActiveSeries: (next: string) => void;
  favoriteProducts: Product[];
  onToggleFavorite: (productId: number) => void;
}) {
  const SERIES_FILTERS = ['All Sets', 'Sword & Shield', 'Scarlet & Violet', 'Sun & Moon', 'Vintage'];

  return (
    <motion.div
      key="favorites"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1"
    >
      <header className="sticky top-0 z-50 bg-surface-light border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-50 text-text-primary"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">My Favorites</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4">
          <h2 className="text-2xl font-bold mb-4">Saved Boxes</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {SERIES_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSeries(filter)}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-all ${
                  activeSeries === filter
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'bg-white border border-gray-200 text-text-primary hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">{filter}</span>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {favoriteProducts.length > 0 ? (
              favoriteProducts.map((product) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={product.id}
                  className="bg-surface-light rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 group"
                >
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => onToggleFavorite(product.id)}
                        className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full text-red-500 shadow-sm hover:bg-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl filled">favorite</span>
                      </button>
                    </div>
                    <img
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={product.image}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col gap-1 px-1">
                    <h3 className="font-bold text-text-primary text-base line-clamp-1">{product.name}</h3>
                    <p className="text-text-secondary text-xs font-medium">{product.series} Series</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
                      <button
                        onClick={() => onToggleFavorite(product.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 bg-red-50 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <span className="material-symbols-outlined text-3xl">heart_broken</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">No favorites yet</h3>
                <p className="text-text-secondary text-sm max-w-xs">
                  Start exploring booster boxes and tap the heart icon to save them here.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}
