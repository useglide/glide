'use client'

import { GlobalCommandMenu } from './GlobalCommandMenu'
import { Chat } from './chat/Chat'
import { Sidebar } from './Sidebar'
import { usePathname } from 'next/navigation'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on landing, login, or register pages
  const isPublicPage = ['/landing', '/login', '/register'].includes(pathname)

  if (isPublicPage) {
    return (
      <>
        {children}
        <GlobalCommandMenu />
        <Chat />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Sidebar />
      <div className="ml-60">
        {children}
      </div>
      <GlobalCommandMenu />
      <Chat />
    </div>
  )
}
