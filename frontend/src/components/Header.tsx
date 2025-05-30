'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserIcon, Sparkles } from 'lucide-react';
import { ChatPanel } from './chat/ChatPanel';

interface HeaderProps {
  title?: string;
  onLogout?: () => Promise<void>;
}

export function Header({ title = 'Dashboard', onLogout }: HeaderProps) {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const triggerCommandMenu = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  // Add keyboard shortcut for chat (Cmd+I or Ctrl+I)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Command+I (Mac) or Ctrl+I (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault(); // Prevent browser's default "Inspect" action
        toggleChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen]); // Re-run effect when isChatOpen changes to get the latest toggleChat function

  return (
    <header className="sticky top-0 z-20 bg-[var(--white-grey)] border-b border-[var(--nav-border)] w-full">
      <div className="flex items-center h-16 px-6">
        {/* Left Section - Title */}
        <div className="flex items-center space-x-4 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        </div>

        {/* Center Section - Ask Genoa Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={toggleChat}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
            aria-label="Ask Genoa AI Assistant"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Ask Genoa</span>
          </button>
        </div>

        {/* Right Section - User Controls */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          {/* Search Command Menu Trigger */}
          <button
            type="button"
            onClick={triggerCommandMenu}
            className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2 rounded-md bg-[var(--white-grey)] cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <kbd className="ml-2 cursor-pointer inline-flex h-5 select-none items-center gap-1 rounded border bg-[var(--white-grey)] px-1.5 font-mono text-xs">
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

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={closeChat} />
    </header>
  );
}
