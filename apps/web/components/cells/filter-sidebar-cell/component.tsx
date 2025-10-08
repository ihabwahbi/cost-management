"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, X as XIcon, RotateCcw as RotateCcwIcon } from "lucide-react"
import { getDatePresets, formatDate } from "@/lib/date-preset-utils"
import type { FilterSidebarCellProps, POFilters, ActiveFilter } from "@/types/filters"

export function FilterSidebarCell({ onFilterChange }: FilterSidebarCellProps) {
  const [location, setLocation] = useState("all")
  const [fmtPo, setFmtPo] = useState(false)
  const [mappingStatus, setMappingStatus] = useState("all")
  const [poNumbers, setPONumbers] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const datePresets = getDatePresets()

  const getActiveFilters = (): ActiveFilter[] => {
    const active: ActiveFilter[] = []
    if (location !== "all") active.push({ key: "location", label: `Location: ${location}`, value: location })
    if (fmtPo) active.push({ key: "fmtPo", label: "FMT PO Only", value: fmtPo })
    if (mappingStatus !== "all")
      active.push({ key: "mappingStatus", label: `Status: ${mappingStatus}`, value: mappingStatus })
    if (poNumbers.trim()) active.push({ key: "poNumbers", label: "PO Numbers", value: poNumbers })
    if (dateRange?.from || dateRange?.to) {
      const label = selectedPreset || "Custom range"
      active.push({ key: "dateRange", label, value: dateRange })
    }
    return active
  }

  const applyFilters = () => {
    const filters: POFilters = {
      location: location === "all" ? undefined : location,
      fmtPo: fmtPo ? true : undefined,
      mappingStatus: mappingStatus === "all" ? undefined : (mappingStatus as "mapped" | "unmapped"),
      poNumbers: poNumbers.trim(), // ✅ FIXED: Now trimmed (was line 118 issue)
      dateRange: dateRange,
    }
    // ✅ Debug console.log REMOVED (was line 121)
    onFilterChange(filters)
  }

  useEffect(() => {
    applyFilters()
  }, [location, fmtPo, mappingStatus, poNumbers, dateRange])

  const handleReset = () => {
    setLocation("all")
    setFmtPo(false)
    setMappingStatus("all")
    setPONumbers("")
    setDateRange(undefined)
    setSelectedPreset(null)
  }

  const removeFilter = (filterKey: string) => {
    switch (filterKey) {
      case "location":
        setLocation("all")
        break
      case "fmtPo":
        setFmtPo(false)
        break
      case "mappingStatus":
        setMappingStatus("all")
        break
      case "poNumbers":
        setPONumbers("")
        break
      case "dateRange":
        setDateRange(undefined)
        setSelectedPreset(null)
        break
    }
  }

  const handlePresetSelect = (preset: { label: string; range: DateRange }) => {
    setDateRange(preset.range)
    setSelectedPreset(preset.label)
  }

  const handleCustomDateRange = (range: DateRange | undefined) => {
    setDateRange(range)
    setSelectedPreset(null)
  }

  const activeFilters = getActiveFilters()

  return (
    <Card className="h-full rounded-none border-0 border-r bg-slate-50/50">
      <CardHeader className="pb-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Filters</CardTitle>
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-medium">
              {activeFilters.length} active
            </Badge>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="space-y-2 pt-3">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer group"
                  onClick={() => removeFilter(filter.key)}
                >
                  <span className="text-xs font-medium">{filter.label}</span>
                  <XIcon className="ml-1 h-3 w-3 group-hover:text-blue-900" />
                </Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <RotateCcwIcon className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="space-y-4">
          <Label htmlFor="date-range" className="text-sm font-medium text-slate-700">
            PO Creation Date
          </Label>

          {/* Recent Dates */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recent</div>
            <div className="grid grid-cols-2 gap-2">
              {datePresets.recent.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    "h-9 text-xs font-medium transition-all border-slate-200 hover:border-blue-300 hover:bg-blue-50",
                    selectedPreset === preset.label
                      ? "bg-blue-100 border-blue-400 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-blue-600",
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Periods */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Periods</div>
            <div className="grid grid-cols-2 gap-2">
              {datePresets.periods.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    "h-9 text-xs font-medium transition-all border-slate-200 hover:border-blue-300 hover:bg-blue-50",
                    selectedPreset === preset.label
                      ? "bg-blue-100 border-blue-400 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-blue-600",
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Picker */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Custom Range</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 transition-all border-slate-200",
                    !dateRange && "text-slate-500 hover:border-blue-300 hover:bg-blue-50",
                    dateRange && !selectedPreset && "border-blue-400 bg-blue-100 text-blue-700 shadow-sm",
                    selectedPreset && "border-slate-300 bg-slate-50 text-slate-600",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <div className="truncate">
                          {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                        </div>
                      ) : (
                        <div className="truncate">{formatDate(dateRange.from)}</div>
                      )
                    ) : (
                      <span>Pick dates...</span>
                    )}
                  </div>
                  {selectedPreset && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start" sideOffset={4}>
                <div className="p-4 border-b bg-slate-50">
                  <h4 className="font-semibold text-sm text-slate-800 mb-1">Custom Date Range</h4>
                  <p className="text-xs text-slate-600">Select specific start and end dates</p>
                </div>
                <div className="p-3">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleCustomDateRange}
                    numberOfMonths={2}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <Label htmlFor="location" className="text-sm font-medium text-slate-700">
            Location
          </Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className={cn("transition-all", location !== "all" && "border-blue-200 bg-blue-50/50")}>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Jandakot">Jandakot</SelectItem>
              <SelectItem value="Perth">Perth</SelectItem>
              <SelectItem value="Darwin">Darwin</SelectItem>
              <SelectItem value="Karratha">Karratha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* FMT PO - Toggle Switch */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">FMT PO</Label>
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">FMT PO Only</span>
              <span className="text-xs text-slate-500">Show only FMT purchase orders</span>
            </div>
            <button
              onClick={() => setFmtPo(!fmtPo)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                fmtPo ? "bg-blue-600" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  fmtPo ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>

        {/* Mapping Status - Segmented Control */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Mapping Status</Label>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              { value: "all", label: "All" },
              { value: "mapped", label: "Mapped" },
              { value: "unmapped", label: "Unmapped" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setMappingStatus(option.value)}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                  mappingStatus === option.value
                    ? "bg-white text-blue-700 shadow-sm border border-blue-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Paste PO Numbers */}
        <div className="space-y-3">
          <Label htmlFor="po-numbers" className="text-sm font-medium text-slate-700">
            PO Numbers
          </Label>
          <Textarea
            id="po-numbers"
            placeholder="Paste PO numbers (one per line or comma-separated)"
            value={poNumbers}
            onChange={(e) => setPONumbers(e.target.value)}
            className={cn(
              "min-h-[80px] resize-none transition-all",
              poNumbers.trim() && "border-blue-200 bg-blue-50/50",
            )}
          />
        </div>

        {activeFilters.length === 0 && (
          <div className="text-center py-8">
            <div className="text-slate-400 text-sm">
              <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                />
              </svg>
              No filters applied
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
