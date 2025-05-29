'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function GlobalCommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/courses'))}>
            Courses
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/assignments'))}>
            Assignments
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/calendar'))}>
            Calendar
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/todo'))}>
            To-Do
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />

      </CommandList>
    </CommandDialog>
  )
}
