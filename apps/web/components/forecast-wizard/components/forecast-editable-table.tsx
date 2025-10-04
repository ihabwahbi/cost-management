'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  _tempId?: string
}

interface ForecastEditableTableProps {
  entries: CostBreakdown[]
  forecastChanges: Record<string, number | null> // null = excluded from forecast
  onValueChange: (id: string, newValue: number) => void
  onResetChange: (id: string) => void
  onDeleteEntry: (id: string) => void
  onExcludeEntry: (id: string) => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function ForecastEditableTable({
  entries,
  forecastChanges,
  onValueChange,
  onResetChange,
  onDeleteEntry,
  onExcludeEntry,
}: ForecastEditableTableProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<number>(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  const regularEntries = entries.filter((e) => !e._tempId)
  const stagedEntries = entries.filter((e) => e._tempId)

  const handleStartEdit = (id: string, currentValue: number) => {
    setEditingItem(id)
    setEditingValue(currentValue)
    setValidationError(null)
  }

  const handleValueInput = (value: string) => {
    const numValue = parseFloat(value)
    
    // ✅ PITFALL #2 FIX: Validate positive numbers only
    if (isNaN(numValue) || numValue <= 0) {
      setValidationError('Value must be greater than $0')
      setEditingValue(parseFloat(value) || 0)
    } else {
      setValidationError(null)
      setEditingValue(numValue)
    }
  }

  const handleSaveEdit = (id: string) => {
    // Only save if valid (> 0)
    if (editingValue > 0 && !validationError) {
      onValueChange(id, editingValue)
      setEditingItem(null)
      setValidationError(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setValidationError(null)
  }

  return (
    <div className="relative border rounded-md flex-1 min-h-0">
      <div className="h-full max-h-[500px] overflow-auto">
        <Table className="w-full min-w-[800px]">
          <TableHeader className="sticky top-0 bg-background z-10 border-b">
            <TableRow>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Cost Line</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="whitespace-nowrap">Sub Category</TableHead>
              <TableHead className="text-right whitespace-nowrap">Original</TableHead>
              <TableHead className="text-right whitespace-nowrap">Forecast</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Existing cost items */}
            {regularEntries.map((cost) => {
              const isEditing = editingItem === cost.id
              const isExcluded = forecastChanges[cost.id] === null
              const isModified = forecastChanges[cost.id] !== undefined && forecastChanges[cost.id] !== null
              const forecastValue = isExcluded ? 0 : (forecastChanges[cost.id] ?? cost.budget_cost)

              return (
                <TableRow key={cost.id} className={isExcluded ? 'opacity-50 bg-gray-50' : ''}>
                  <TableCell className="whitespace-nowrap">
                    {isExcluded && (
                      <Badge variant="secondary" className="text-xs">
                        Excluded
                      </Badge>
                    )}
                    {isModified && !isExcluded && (
                      <Badge variant="outline" className="text-xs">
                        Modified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{cost.cost_line}</TableCell>
                  <TableCell className="whitespace-nowrap">{cost.spend_type}</TableCell>
                  <TableCell
                    className="whitespace-nowrap truncate max-w-[150px]"
                    title={cost.spend_sub_category}
                  >
                    {cost.spend_sub_category}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(cost.budget_cost)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap p-1">
                    {isExcluded ? (
                      <span className="text-muted-foreground line-through">
                        {formatCurrency(cost.budget_cost)}
                      </span>
                    ) : isEditing ? (
                      <div className="flex flex-col items-end gap-1">
                        <Input
                          type="number"
                          value={editingValue}
                          onChange={(e) => handleValueInput(e.target.value)}
                          className={`w-28 text-right text-sm ${validationError ? 'border-red-500' : ''}`}
                          autoFocus
                          onBlur={handleCancelEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !validationError) {
                              handleSaveEdit(cost.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                        />
                        {validationError && (
                          <span className="text-xs text-red-500">{validationError}</span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(cost.id, forecastValue)}
                        className="hover:underline text-right w-full"
                      >
                        {formatCurrency(forecastValue)}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="p-1">
                    {isExcluded ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => onResetChange(cost.id)}
                      >
                        Include
                      </Button>
                    ) : isModified ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => onResetChange(cost.id)}
                      >
                        Reset
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-red-600"
                        onClick={() => onExcludeEntry(cost.id)}
                      >
                        Exclude
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}

            {/* Staged new entries */}
            {stagedEntries.map((entry) => (
              <TableRow key={entry.id} className="bg-amber-50/50">
                <TableCell className="whitespace-nowrap">
                  <Badge className="text-xs bg-amber-500">New</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{entry.cost_line}</TableCell>
                <TableCell className="whitespace-nowrap">{entry.spend_type}</TableCell>
                <TableCell
                  className="whitespace-nowrap truncate max-w-[150px]"
                  title={entry.spend_sub_category}
                >
                  {entry.spend_sub_category}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">-</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatCurrency(entry.budget_cost)}
                </TableCell>
                <TableCell className="p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => onDeleteEntry(entry.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
