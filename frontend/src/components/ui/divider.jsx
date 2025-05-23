import React from 'react';

export function Divider({ children, className = '' }) {
  return (
    <div className={`relative flex items-center py-2 ${className}`}>
      <div className="flex-grow border-t border-gray-300"></div>
      {children && (
        <span className="mx-4 flex-shrink text-sm text-gray-500">{children}</span>
      )}
      <div className="flex-grow border-t border-gray-300"></div>
    </div>
  );
}
