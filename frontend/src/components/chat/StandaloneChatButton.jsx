'use client';

import { MessageCircleIcon } from 'lucide-react';

/**
 * A standalone chat button that will definitely be visible
 */
export function StandaloneChatButton() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#4169E1', // Glide blue
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        zIndex: 9999,
        border: 'none',
      }}
      onClick={() => alert('Chat button clicked!')}
    >
      <MessageCircleIcon size={24} />
    </div>
  );
}
