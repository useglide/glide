'use client'

import { GlobalCommandMenu } from './GlobalCommandMenu'
import { Chat } from './chat/Chat'
import { useIsLandingPage } from '@/lib/routeUtils'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const isLandingPage = useIsLandingPage();

  return (
    <>
      {children}
      <GlobalCommandMenu />
      {!isLandingPage && <Chat />}
    </>
  )
}
