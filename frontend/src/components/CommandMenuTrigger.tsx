'use client'

import { Search } from 'lucide-react'

export function CommandMenuTrigger() {
  const triggerCommandMenu = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  return (
    <button
      type="button"
      onClick={triggerCommandMenu}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Search className="h-4 w-4" />
      <span>Search...</span>
      <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
