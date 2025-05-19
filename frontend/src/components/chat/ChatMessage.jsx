'use client';

import { cn } from '@/lib/utils';
import { BotIcon, UserIcon } from 'lucide-react';

/**
 * A component to display a chat message
 * @param {Object} props - Component props
 * @param {string} props.content - The message content
 * @param {boolean} props.isUser - Whether the message is from the user
 * @param {string} props.className - Additional CSS classes
 */
export function ChatMessage({ content, isUser, className }) {
  return (
    <div
      className={cn(
        'flex w-full items-start gap-2 py-2',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-white">
          <BotIcon className="h-5 w-5" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-sidebar-primary text-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
