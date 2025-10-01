"use client"

import { Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const shortcuts = [
  {
    category: "General",
    items: [
      { keys: ["⌘/Ctrl", "S"], description: "Save changes" },
      { keys: ["⌘/Ctrl", "N"], description: "New entry" },
      { keys: ["Esc"], description: "Cancel/Close" },
    ]
  },
  {
    category: "Selection",
    items: [
      { keys: ["⌘/Ctrl", "A"], description: "Select all items" },
      { keys: ["Delete"], description: "Delete selected items" },
      { keys: ["Space"], description: "Toggle item selection" },
    ]
  },
  {
    category: "Navigation",
    items: [
      { keys: ["Tab"], description: "Next field" },
      { keys: ["Shift", "Tab"], description: "Previous field" },
      { keys: ["Enter"], description: "Save and next" },
    ]
  },
  {
    category: "Editing",
    items: [
      { keys: ["Click"], description: "Start inline edit" },
      { keys: ["Enter"], description: "Save edit" },
      { keys: ["Esc"], description: "Cancel edit" },
    ]
  },
]

export function KeyboardShortcutsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 px-3">
          <Keyboard className="w-4 h-4" />
          <span className="hidden lg:inline">Shortcuts</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to work faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, index) => (
                        <span key={index}>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                            {key}
                          </kbd>
                          {index < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-gray-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}