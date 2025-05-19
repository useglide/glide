'use client';

import { useState, useEffect } from 'react';

/**
 * A debug component to verify chat rendering
 */
export function ChatDebug() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        backgroundColor: 'red',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000,
        fontWeight: 'bold'
      }}
    >
      Chat Debug
    </div>
  );
}
