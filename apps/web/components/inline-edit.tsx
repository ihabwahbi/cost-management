"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InlineEditProps {
  value: string | number
  onSave: (value: string | number) => void
  type?: "text" | "number"
  className?: string
  placeholder?: string
  disabled?: boolean
  formatter?: (value: any) => string
  validator?: (value: any) => boolean | string
}

export function InlineEdit({
  value,
  onSave,
  type = "text",
  className,
  placeholder = "Click to edit",
  disabled = false,
  formatter,
  validator,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (validator) {
      const validationResult = validator(localValue)
      if (validationResult !== true) {
        setError(typeof validationResult === "string" ? validationResult : "Invalid value")
        return
      }
    }

    if (localValue !== value) {
      onSave(type === "number" ? Number(localValue) : localValue)
    }
    
    setIsEditing(false)
    setError(null)
  }

  const handleCancel = () => {
    setLocalValue(value)
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const displayValue = formatter ? formatter(value) : value

  if (disabled) {
    return (
      <span className={cn("inline-block", className)}>
        {displayValue || <span className="text-gray-400">{placeholder}</span>}
      </span>
    )
  }

  if (isEditing) {
    return (
      <div className="relative inline-block">
        <Input
          ref={inputRef}
          type={type}
          value={localValue}
          onChange={(e) => {
            setLocalValue(type === "number" ? e.target.value : e.target.value)
            setError(null)
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-auto py-1 px-2",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap z-10">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "inline-block cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2 -my-1 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
    >
      {displayValue || <span className="text-gray-400">{placeholder}</span>}
    </button>
  )
}