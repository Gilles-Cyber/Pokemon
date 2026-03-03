import React from 'react';
import type { Toast } from '../types';

export default function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[120] px-4 pointer-events-none">
      <div className="max-w-md mx-auto flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-none rounded-xl px-4 py-3 shadow-lg border backdrop-blur-md text-sm font-medium transition-all ${
              t.type === 'success'
                ? 'bg-emerald-500/90 text-white border-emerald-400/30'
                : t.type === 'error'
                  ? 'bg-red-500/90 text-white border-red-400/30'
                  : 'bg-slate-900/90 text-white border-white/10'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
