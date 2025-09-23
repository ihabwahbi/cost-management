"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, X } from "lucide-react"

export interface FilterState {
  status: {
    added: boolean
    modified: boolean
    removed: boolean
    unchanged: boolean
  }
  categories: string[]
  amountRange: [number, number]
  searchTerm: string
}

interface FilterPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableCategories: string[]
  maxAmount: number
}

export function FilterPanel({
  filters,
  onFiltersChange,
  availableCategories,
  maxAmount = 100000
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleStatusChange = (status: keyof FilterState["status"]) => {
    onFiltersChange({
      ...filters,
      status: {
        ...filters.status,
        [status]: !filters.status[status]
      }
    })
  }
  
  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    })
  }
  
  const handleAmountRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      amountRange: [value[0], value[1]]
    })
  }
  
  const handleReset = () => {
    onFiltersChange({
      status: {
        added: true,
        modified: true,
        removed: true,
        unchanged: false
      },
      categories: [],
      amountRange: [0, maxAmount],
      searchTerm: ""
    })
  }
  
  const activeFilterCount = 
    Object.values(filters.status).filter(v => !v).length +
    filters.categories.length +
    (filters.amountRange[0] > 0 || filters.amountRange[1] < maxAmount ? 1 : 0) +
    (filters.searchTerm ? 1 : 0)
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </Button>
      
      {isOpen && (
        <Card className="absolute top-10 left-0 z-50 w-80 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusFilter
              status={filters.status}
              onStatusChange={handleStatusChange}
            />
            
            <CategoryFilter
              selectedCategories={filters.categories}
              availableCategories={availableCategories}
              onCategoryToggle={handleCategoryToggle}
            />
            
            <AmountRangeFilter
              range={filters.amountRange}
              max={maxAmount}
              onRangeChange={handleAmountRangeChange}
            />
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Status Filter Component
interface StatusFilterProps {
  status: FilterState["status"]
  onStatusChange: (status: keyof FilterState["status"]) => void
}

export function StatusFilter({ status, onStatusChange }: StatusFilterProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Status</Label>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="added"
            checked={status.added}
            onCheckedChange={() => onStatusChange("added")}
          />
          <Label htmlFor="added" className="text-sm font-normal cursor-pointer">
            ➕ Added
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="modified"
            checked={status.modified}
            onCheckedChange={() => onStatusChange("modified")}
          />
          <Label htmlFor="modified" className="text-sm font-normal cursor-pointer">
            🔄 Modified
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="removed"
            checked={status.removed}
            onCheckedChange={() => onStatusChange("removed")}
          />
          <Label htmlFor="removed" className="text-sm font-normal cursor-pointer">
            ➖ Removed
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="unchanged"
            checked={status.unchanged}
            onCheckedChange={() => onStatusChange("unchanged")}
          />
          <Label htmlFor="unchanged" className="text-sm font-normal cursor-pointer">
            ⏸️ Unchanged
          </Label>
        </div>
      </div>
    </div>
  )
}

// Category Filter Component
interface CategoryFilterProps {
  selectedCategories: string[]
  availableCategories: string[]
  onCategoryToggle: (category: string) => void
}

export function CategoryFilter({
  selectedCategories,
  availableCategories,
  onCategoryToggle
}: CategoryFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  
  const filteredCategories = availableCategories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Categories</Label>
      <Input
        type="text"
        placeholder="Search categories..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-8"
      />
      <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => onCategoryToggle(category)}
              />
              <Label
                htmlFor={`cat-${category}`}
                className="text-sm font-normal cursor-pointer truncate"
              >
                {category}
              </Label>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No categories found</p>
        )}
      </div>
    </div>
  )
}

// Amount Range Filter Component
interface AmountRangeFilterProps {
  range: [number, number]
  max: number
  onRangeChange: (range: number[]) => void
}

export function AmountRangeFilter({
  range,
  max,
  onRangeChange
}: AmountRangeFilterProps) {
  const formatAmount = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value}`
  }
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Amount Range</Label>
      <div className="px-2">
        <Slider
          defaultValue={range}
          max={max}
          min={0}
          step={max / 100}
          onValueChange={onRangeChange}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatAmount(range[0])}</span>
          <span>{formatAmount(range[1])}</span>
        </div>
      </div>
    </div>
  )
}