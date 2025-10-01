'use client'

import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export interface DashboardFilters {
  dateRange: { from: Date; to: Date }
  costLine?: string
  spendType?: string
  showForecasts: boolean
  comparisonMode: 'none' | 'period' | 'version'
}

interface DashboardFiltersProps {
  filters: DashboardFilters
  onFilterChange: (filters: Partial<DashboardFilters>) => void
}

interface DatePickerWithRangeProps {
  value: { from: Date; to: Date }
  onChange: (range: { from: Date; to: Date }) => void
  presets?: { label: string; days: number }[]
}

function DatePickerWithRange({ value, onChange, presets }: DatePickerWithRangeProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  })

  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate)
    if (newDate?.from && newDate?.to) {
      onChange({ from: newDate.from, to: newDate.to })
    }
  }

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="grid gap-2">
              {presets?.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newRange = {
                      from: subDays(new Date(), preset.days),
                      to: new Date()
                    }
                    setDate(newRange)
                    onChange(newRange)
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function DashboardFilterPanel({ filters, onFilterChange }: DashboardFiltersProps) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Label className="text-sm mb-2 block">Date Range</Label>
          <DatePickerWithRange
            value={filters.dateRange}
            onChange={(range) => onFilterChange({ dateRange: range })}
            presets={[
              { label: 'Last 30 days', days: 30 },
              { label: 'Last Quarter', days: 90 },
              { label: 'Last 6 Months', days: 180 },
              { label: 'Last Year', days: 365 },
            ]}
          />
        </div>
        
        <div>
          <Label className="text-sm mb-2 block">Cost Line</Label>
          <Select
            value={filters.costLine || 'all'}
            onValueChange={(value) => onFilterChange({ costLine: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Cost Lines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cost Lines</SelectItem>
              <SelectItem value="M&S">Materials & Services</SelectItem>
              <SelectItem value="Services">Services</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
              <SelectItem value="Labor">Labor</SelectItem>
              <SelectItem value="Contractors">Contractors</SelectItem>
              <SelectItem value="Consumables">Consumables</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm mb-2 block">Spend Type</Label>
          <Select
            value={filters.spendType || 'all'}
            onValueChange={(value) => onFilterChange({ spendType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Operational">Operational</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Capital">Capital</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-forecasts"
              checked={filters.showForecasts}
              onCheckedChange={(checked) => onFilterChange({ showForecasts: checked })}
            />
            <Label htmlFor="show-forecasts" className="text-sm">Show Forecasts</Label>
          </div>
        </div>
      </div>
    </Card>
  )
}