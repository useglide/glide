'use client';

import { MessageCircleIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A button that toggles the chat panel
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the chat panel is open
 * @param {Function} props.onClick - Function to call when the button is clicked
 * @param {string} props.className - Additional CSS classes
 */
export function ChatButton({ isOpen, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--glide-blue)] text-white shadow-lg transition-all hover:bg-[var(--blue-accent-hover)]',
        isOpen && 'rotate-90 transform',
        className
      )}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      style={{ visibility: 'visible', opacity: 1 }}
    >
      {isOpen ? (
        <XIcon className="h-6 w-6" />
      ) : (
        <MessageCircleIcon className="h-6 w-6" />
      )}
    </button>
  );
}
