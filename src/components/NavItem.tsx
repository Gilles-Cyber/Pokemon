import React from 'react';

export default function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-center justify-end gap-1 group transition-colors ${
        active ? 'text-primary' : 'text-text-muted dark:text-text-muted-dark hover:text-primary'
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          active ? 'bg-primary-light/50 dark:bg-primary-dark/30' : ''
        }`}
      >
        <span className={`material-symbols-outlined text-xl ${active ? 'filled' : ''}`}>{icon}</span>
      </div>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}
