'use client';

import { useState, useEffect } from 'react';
import { ChatButton } from './ChatButton';
import { ChatPanel } from './ChatPanel';

/**
 * A component that combines the chat button and panel
 */
export function Chat() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

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
  }, [isOpen]); // Re-run effect when isOpen changes to get the latest toggleChat function

  return (
    <>
      <ChatButton isOpen={isOpen} onClick={toggleChat} />
      <ChatPanel isOpen={isOpen} onClose={closeChat} />
    </>
  );
}
