'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserIcon } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onLogout?: () => Promise<void>;
}

export function Header({ title = 'Dashboard', onLogout }: HeaderProps) {
  const router = useRouter();

  const triggerCommandMenu = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-20 bg-[var(--white-grey)] border-b border-[var(--nav-border)] w-full">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search Command Menu Trigger */}
          <button
            type="button"
            onClick={triggerCommandMenu}
            className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2 rounded-md bg-[var(--white-grey)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-[var(--white-grey)] px-1.5 font-mono text-xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* User Profile Button */}
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--glide-blue)] text-white hover:bg-[var(--blue-accent-hover)] transition-colors cursor-pointer"
            aria-label="User profile settings"
          >
            <UserIcon className="h-5 w-5" />
          </button>

          {/* Logout Button (conditionally rendered) */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
