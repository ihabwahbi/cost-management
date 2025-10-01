'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  DollarSign,
  Package
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PromiseDate {
  date: string
  amount: number
  supplier: string
  lineItems: number
  isOverdue?: boolean
  isHighValue?: boolean
}

interface SupplierPromiseCalendarProps {
  promises: PromiseDate[]
  currentDate?: Date
  onDateClick?: (date: string, promises: PromiseDate[]) => void
  loading?: boolean
}

export function SupplierPromiseCalendar({
  promises,
  currentDate = new Date(),
  onDateClick,
  loading = false
}: SupplierPromiseCalendarProps) {
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth())
  const [viewYear, setViewYear] = useState(currentDate.getFullYear())

  // Group promises by date
  const promisesByDate = promises.reduce((acc, promise) => {
    const dateKey = promise.date.split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(promise)
    return acc
  }, {} as Record<string, PromiseDate[]>)

  // Get calendar days for the month
  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value > 100000 ? 'compact' : 'standard'
    }).format(value)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (viewMonth === 0) {
        setViewMonth(11)
        setViewYear(viewYear - 1)
      } else {
        setViewMonth(viewMonth - 1)
      }
    } else {
      if (viewMonth === 11) {
        setViewMonth(0)
        setViewYear(viewYear + 1)
      } else {
        setViewMonth(viewMonth + 1)
      }
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const days = getDaysInMonth(viewMonth, viewYear)

  // Calculate month totals
  const monthTotal = Object.entries(promisesByDate).reduce((total, [date, datePromises]) => {
    const d = new Date(date)
    if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
      return total + datePromises.reduce((sum, p) => sum + p.amount, 0)
    }
    return total
  }, 0)

  const monthBudgetImpact = monthTotal > 0 ? ((monthTotal / 2500000) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>P&L FORECAST CALENDAR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          P&L FORECAST CALENDAR
        </CardTitle>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{monthNames[viewMonth]} {viewYear}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-20" />
            }

            const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const datePromises = promisesByDate[dateKey] || []
            const dayTotal = datePromises.reduce((sum, p) => sum + p.amount, 0)
            const hasOverdue = datePromises.some(p => p.isOverdue)
            const hasHighValue = datePromises.some(p => p.amount > 100000)
            
            const isToday = 
              day === currentDate.getDate() &&
              viewMonth === currentDate.getMonth() &&
              viewYear === currentDate.getFullYear()

            return (
              <div
                key={`day-${day}`}
                className={cn(
                  "h-20 p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                  isToday && "border-blue-500 bg-blue-50",
                  datePromises.length > 0 && "bg-amber-50 border-amber-200",
                  hasOverdue && "bg-red-50 border-red-300",
                  !datePromises.length && !isToday && "border-gray-200"
                )}
                onClick={() => datePromises.length > 0 && onDateClick?.(dateKey, datePromises)}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday && "text-blue-600",
                    hasOverdue && "text-red-600"
                  )}>
                    {day}
                  </span>
                  {hasOverdue && <AlertCircle className="h-3 w-3 text-red-500" />}
                  {!hasOverdue && hasHighValue && <DollarSign className="h-3 w-3 text-amber-500" />}
                </div>
                
                {datePromises.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-gray-900">
                      {formatCurrency(dayTotal)}
                    </div>
                    {datePromises.length > 1 && (
                      <div className="text-xs text-gray-500">
                        {datePromises.length} items
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Month Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Month Total</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(monthTotal)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-600">Budget Impact</div>
              <div className="text-xl font-bold text-blue-600">{monthBudgetImpact}%</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span className="text-gray-600">Overdue</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-amber-500" />
            <span className="text-gray-600">High Value</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-blue-500" />
            <span className="text-gray-600">Major Supplier</span>
          </div>
        </div>

        <div className="mt-2 text-center text-xs text-gray-500">
          Click any date for line item details
        </div>
      </CardContent>
    </Card>
  )
}