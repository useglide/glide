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
  const [searchValue, setSearchValue] = React.useState('')
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

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue('')
    }
  }, [open])

  // Determine if we should show limited results
  const showLimitedResults = searchValue.trim() === ''
  const itemLimit = 3

  // Define navigation items in the new order
  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'To-Do', path: '/todo' },
    { label: 'Calendar', path: '/calendar' },
    { label: 'Study Center', path: '/study-center' },
    { label: 'Courses', path: '/courses' },
    { label: 'Assignments', path: '/assignments' },
    { label: 'Settings', path: '/settings' },
  ]

  // Define study center items
  const studyCenterItems = [
    { label: 'Resource Finder', path: '/study-center/resource-finder' },
    { label: 'Video Recommender', path: '/study-center/video-recommender' },
    { label: 'Deep Research', path: '/study-center/deep-research' },
    { label: 'Graphing Calculator', path: '/study-center/graphing-calculator' },
    { label: 'Lecture Summarizer', path: '/study-center/lecture-summarizer' },
    { label: 'Flashcard Maker', path: '/study-center/flashcard-maker' },
    { label: 'Study Guide Maker', path: '/study-center/study-guide-maker' },
    { label: 'Past Notes Viewer', path: '/study-center/past-notes-viewer' },
  ]

  // Define study techniques items
  const studyTechniquesItems = [
    { label: 'Study Techniques', path: '/study-center/study-techniques' },
    { label: 'Pomodoro Technique', path: '/study-center/study-techniques/pomodoro' },
    { label: 'Active Recall', path: '/study-center/study-techniques/active-recall' },
    { label: 'Spaced Repetition', path: '/study-center/study-techniques/spaced-repetition' },
    { label: 'Deep Study', path: '/study-center/deep-study' },
    { label: 'Refresh Study', path: '/study-center/refresh-study' },
    { label: 'Feynman Technique', path: '/study-center/study-techniques/feynman' },
    { label: 'Mind Mapping', path: '/study-center/study-techniques/mind-mapping' },
    { label: 'Time Blocking', path: '/study-center/study-techniques/time-blocking' },
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {(showLimitedResults ? navigationItems.slice(0, itemLimit) : navigationItems).map((item) => (
            <CommandItem key={item.path} onSelect={() => runCommand(() => router.push(item.path))}>
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Study Center Tools">
          {(showLimitedResults ? studyCenterItems.slice(0, itemLimit) : studyCenterItems).map((item) => (
            <CommandItem key={item.path} onSelect={() => runCommand(() => router.push(item.path))}>
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Study Techniques">
          {(showLimitedResults ? studyTechniquesItems.slice(0, itemLimit) : studyTechniquesItems).map((item) => (
            <CommandItem key={item.path} onSelect={() => runCommand(() => router.push(item.path))}>
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />

      </CommandList>
    </CommandDialog>
  )
}
