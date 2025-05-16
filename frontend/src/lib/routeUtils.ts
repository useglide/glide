'use client';

import { usePathname } from 'next/navigation';

/**
 * Check if the current route is the landing page
 * @returns {boolean} True if the current route is the landing page
 */
export const useIsLandingPage = (): boolean => {
  const pathname = usePathname();
  return pathname === '/landing' || pathname === '/';
};
