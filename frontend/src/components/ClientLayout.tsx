'use client'

import { GlobalCommandMenu } from './GlobalCommandMenu'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GlobalCommandMenu />
    </>
  )
}
