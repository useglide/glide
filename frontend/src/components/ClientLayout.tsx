'use client'

import { GlobalCommandMenu } from './GlobalCommandMenu'
import { Chat } from './chat/Chat'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GlobalCommandMenu />
      <Chat />
    </>
  )
}
