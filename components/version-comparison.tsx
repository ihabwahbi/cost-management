"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { WaterfallChart, CategoryComparisonChart, VarianceInsights } from "@/components/version-comparison-charts-fixed"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  ArrowUpDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ForecastVersion {
  id: string
  project_id: string
  version_number: number
  reason_for_change: string
  created_at: string
  created_by: string
}

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
}

interface BudgetForecast {
  id: string
  forecast_version_id: string
  cost_breakdown_id: string
  forecasted_cost: number
}

interface VersionComparisonProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  version1: number
  version2: number
  versions: ForecastVersion[]
  costBreakdowns: CostBreakdown[]
  forecasts: Record<number, BudgetForecast[]>
}

type ViewMode = "all" | "changed" | "added" | "removed" | "increased" | "decreased"
type SortField = "cost_line" | "spend_type" | "sub_category" | "v1_amount" | "v2_amount" | "change"
type SortDirection = "asc" | "desc"

export function VersionComparison({
  isOpen,
  onClose,
  projectId,
  projectName,
  version1,
  version2,
  versions,
  costBreakdowns,
  forecasts,
}: VersionComparisonProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("all")
  const [sortField, setSortField] = useState<SortField>("cost_line")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isExporting, setIsExporting] = useState(false)

  // Get version data
  const v1Data = versions.find(v => v.version_number === version1)
  const v2Data = versions.find(v => v.version_number === version2)
  
  const v1Forecasts = forecasts[version1] || []
  const v2Forecasts = forecasts[version2] || []

  // Build comparison data
  const buildComparisonData = () => {
    const comparisonMap = new Map<string, any>()
    
    // Process version 1 data
    if (version1 === 0) {
      // Use original cost breakdown for version 0
      costBreakdowns.forEach(cost => {
        comparisonMap.set(cost.id, {
          id: cost.id,
          cost_line: cost.cost_line,
          spend_type: cost.spend_type,
          spend_sub_category: cost.spend_sub_category,
          sub_business_line: cost.sub_business_line,
          v1_amount: cost.budget_cost,
          v2_amount: null,
          status: "removed",
        })
      })
    } else {
      v1Forecasts.forEach(forecast => {
        const cost = costBreakdowns.find(c => c.id === forecast.cost_breakdown_id)
        if (cost) {
          comparisonMap.set(cost.id, {
            id: cost.id,
            cost_line: cost.cost_line,
            spend_type: cost.spend_type,
            spend_sub_category: cost.spend_sub_category,
            sub_business_line: cost.sub_business_line,
            v1_amount: forecast.forecasted_cost,
            v2_amount: null,
            status: "removed",
          })
        }
      })
    }

    // Process version 2 data
    if (version2 === 0) {
      costBreakdowns.forEach(cost => {
        const existing = comparisonMap.get(cost.id)
        if (existing) {
          existing.v2_amount = cost.budget_cost
          existing.status = existing.v1_amount === cost.budget_cost ? "unchanged" : "changed"
        } else {
          comparisonMap.set(cost.id, {
            id: cost.id,
            cost_line: cost.cost_line,
            spend_type: cost.spend_type,
            spend_sub_category: cost.spend_sub_category,
            sub_business_line: cost.sub_business_line,
            v1_amount: null,
            v2_amount: cost.budget_cost,
            status: "added",
          })
        }
      })
    } else {
      v2Forecasts.forEach(forecast => {
        const cost = costBreakdowns.find(c => c.id === forecast.cost_breakdown_id)
        if (cost) {
          const existing = comparisonMap.get(cost.id)
          if (existing) {
            existing.v2_amount = forecast.forecasted_cost
            existing.status = existing.v1_amount === forecast.forecasted_cost ? "unchanged" : "changed"
          } else {
            comparisonMap.set(cost.id, {
              id: cost.id,
              cost_line: cost.cost_line,
              spend_type: cost.spend_type,
              spend_sub_category: cost.spend_sub_category,
              sub_business_line: cost.sub_business_line,
              v1_amount: null,
              v2_amount: forecast.forecasted_cost,
              status: "added",
            })
          }
        }
      })
    }

    return Array.from(comparisonMap.values())
  }

  const comparisonData = buildComparisonData()

  // Calculate statistics
  const calculateStats = () => {
    const stats = {
      totalV1: 0,
      totalV2: 0,
      totalChange: 0,
      changePercent: 0,
      added: 0,
      removed: 0,
      changed: 0,
      unchanged: 0,
      increased: 0,
      decreased: 0,
    }

    comparisonData.forEach(item => {
      stats.totalV1 += item.v1_amount || 0
      stats.totalV2 += item.v2_amount || 0

      switch (item.status) {
        case "added":
          stats.added++
          break
        case "removed":
          stats.removed++
          break
        case "changed":
          stats.changed++
          if ((item.v2_amount || 0) > (item.v1_amount || 0)) {
            stats.increased++
          } else {
            stats.decreased++
          }
          break
        case "unchanged":
          stats.unchanged++
          break
      }
    })

    stats.totalChange = stats.totalV2 - stats.totalV1
    stats.changePercent = stats.totalV1 > 0 ? (stats.totalChange / stats.totalV1) * 100 : 0

    return stats
  }

  const stats = calculateStats()

  // Filter and sort data
  const getFilteredData = () => {
    let filtered = [...comparisonData]

    // Apply view mode filter
    switch (viewMode) {
      case "changed":
        filtered = filtered.filter(item => item.status === "changed")
        break
      case "added":
        filtered = filtered.filter(item => item.status === "added")
        break
      case "removed":
        filtered = filtered.filter(item => item.status === "removed")
        break
      case "increased":
        filtered = filtered.filter(item => 
          item.status === "changed" && (item.v2_amount || 0) > (item.v1_amount || 0)
        )
        break
      case "decreased":
        filtered = filtered.filter(item => 
          item.status === "changed" && (item.v2_amount || 0) < (item.v1_amount || 0)
        )
        break
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.sub_business_line === selectedCategory)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item => 
        item.cost_line.toLowerCase().includes(term) ||
        item.spend_type.toLowerCase().includes(term) ||
        item.spend_sub_category.toLowerCase().includes(term)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0
      
      switch (sortField) {
        case "cost_line":
          compareValue = a.cost_line.localeCompare(b.cost_line)
          break
        case "spend_type":
          compareValue = a.spend_type.localeCompare(b.spend_type)
          break
        case "sub_category":
          compareValue = a.spend_sub_category.localeCompare(b.spend_sub_category)
          break
        case "v1_amount":
          compareValue = (a.v1_amount || 0) - (b.v1_amount || 0)
          break
        case "v2_amount":
          compareValue = (a.v2_amount || 0) - (b.v2_amount || 0)
          break
        case "change":
          const changeA = (a.v2_amount || 0) - (a.v1_amount || 0)
          const changeB = (b.v2_amount || 0) - (b.v1_amount || 0)
          compareValue = changeA - changeB
          break
      }
      
      return sortDirection === "asc" ? compareValue : -compareValue
    })

    return filtered
  }

  const filteredData = getFilteredData()

  // Get unique categories
  const categories = Array.from(new Set(comparisonData.map(item => item.sub_business_line)))

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getChangeIcon = (v1: number | null, v2: number | null) => {
    if (v1 === null || v2 === null) return null
    if (v2 > v1) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (v2 < v1) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getRowClassName = (status: string) => {
    switch (status) {
      case "added":
        return "bg-green-50"
      case "removed":
        return "bg-red-50"
      case "changed":
        return "bg-blue-50"
      default:
        return ""
    }
  }

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    setIsExporting(true)
    
    try {
      // Prepare data for export
      const exportData = filteredData.map(item => ({
        "Cost Line": item.cost_line,
        "Spend Type": item.spend_type,
        "Sub Category": item.spend_sub_category,
        "Business Line": item.sub_business_line,
        [`Version ${version1}`]: item.v1_amount || 0,
        [`Version ${version2}`]: item.v2_amount || 0,
        "Change": (item.v2_amount || 0) - (item.v1_amount || 0),
        "Change %": item.v1_amount ? 
          (((item.v2_amount || 0) - item.v1_amount) / item.v1_amount * 100).toFixed(1) + "%" : 
          "N/A",
        "Status": item.status,
      }))

      // Convert to CSV
      if (format === "csv") {
        const headers = Object.keys(exportData[0] || {})
        const csvContent = [
          headers.join(","),
          ...exportData.map(row => 
            headers.map(header => {
              const value = row[header as keyof typeof row]
              return typeof value === "string" && value.includes(",") 
                ? `"${value}"` 
                : value
            }).join(",")
          )
        ].join("\n")

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${projectName}_v${version1}_vs_v${version2}_comparison.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
      
      // For Excel and PDF, you would typically use libraries like xlsx or jsPDF
      // For now, we'll just show a message
      if (format === "xlsx" || format === "pdf") {
        console.log("Export format not yet implemented:", format)
        // TODO: Implement Excel and PDF export
      }
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle>Version Comparison - {projectName}</DialogTitle>
          <DialogDescription>
            Comparing Version {version1} vs Version {version2}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6">
          <Tabs defaultValue="table" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0 my-4">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="summary">Summary View</TabsTrigger>
              <TabsTrigger value="insights">Visual Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="flex-1 overflow-hidden space-y-4">
            {/* Filters and Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border rounded-md w-64"
              />

              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="changed">Changed Only</SelectItem>
                  <SelectItem value="added">Added Only</SelectItem>
                  <SelectItem value="removed">Removed Only</SelectItem>
                  <SelectItem value="increased">Increased</SelectItem>
                  <SelectItem value="decreased">Decreased</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Enhanced Statistics Bar with Visual Indicators */}
            <div className="space-y-4">
              {/* Primary Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className={stats.totalChange > 0 ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {stats.totalChange > 0 ? "+" : ""}{formatCurrency(stats.totalChange)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total Change</p>
                      </div>
                      {stats.totalChange !== 0 && (
                        <div className={`p-2 rounded-full ${stats.totalChange > 0 ? "bg-green-100" : "bg-red-100"}`}>
                          {stats.totalChange > 0 ? 
                            <TrendingUp className="w-4 h-4 text-green-600" /> : 
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          }
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className={stats.changePercent > 0 ? "border-green-200" : stats.changePercent < 0 ? "border-red-200" : ""}>
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold">
                      {stats.changePercent > 0 ? "+" : ""}{stats.changePercent.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Change %</p>
                    <Progress 
                      value={Math.abs(stats.changePercent)} 
                      className="h-1 mt-2" 
                      style={{
                        background: stats.changePercent > 0 ? '#dcfce7' : '#fee2e2'
                      }}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-green-600">{stats.added}</div>
                    <p className="text-xs text-muted-foreground">Added</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-red-600">{stats.removed}</div>
                    <p className="text-xs text-muted-foreground">Removed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-blue-600">{stats.changed}</div>
                    <p className="text-xs text-muted-foreground">Changed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-gray-600">{stats.unchanged}</div>
                    <p className="text-xs text-muted-foreground">Unchanged</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Insights Section */}
              {stats.totalChange !== 0 && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Key Insights</p>
                        <ul className="mt-1 text-xs text-blue-800 space-y-1">
                          {stats.totalChange > 0 && (
                            <li>• Budget increased by {formatCurrency(Math.abs(stats.totalChange))} ({stats.changePercent.toFixed(1)}%)</li>
                          )}
                          {stats.totalChange < 0 && (
                            <li>• Budget decreased by {formatCurrency(Math.abs(stats.totalChange))} ({Math.abs(stats.changePercent).toFixed(1)}%)</li>
                          )}
                          {stats.changed > 0 && (
                            <li>• {stats.changed} line items were modified ({stats.increased} increased, {stats.decreased} decreased)</li>
                          )}
                          {stats.added > 0 && (
                            <li>• {stats.added} new line items added to the budget</li>
                          )}
                          {stats.removed > 0 && (
                            <li>• {stats.removed} line items removed from the budget</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Comparison Table */}
            <div className="w-full overflow-x-auto">
              <ScrollArea className="h-[400px]">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("cost_line")}
                    >
                      Cost Line
                      {sortField === "cost_line" && (
                        <ArrowUpDown className="w-3 h-3 inline ml-1" />
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("spend_type")}
                    >
                      Type
                      {sortField === "spend_type" && (
                        <ArrowUpDown className="w-3 h-3 inline ml-1" />
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("sub_category")}
                    >
                      Sub Category
                      {sortField === "sub_category" && (
                        <ArrowUpDown className="w-3 h-3 inline ml-1" />
                      )}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer"
                      onClick={() => handleSort("v1_amount")}
                    >
                      Version {version1}
                      {sortField === "v1_amount" && (
                        <ArrowUpDown className="w-3 h-3 inline ml-1" />
                      )}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer"
                      onClick={() => handleSort("v2_amount")}
                    >
                      Version {version2}
                      {sortField === "v2_amount" && (
                        <ArrowUpDown className="w-3 h-3 inline ml-1" />
                      )}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer"
                      onClick={() => handleSort("change")}
                    >
                      Change
                      {sortField === "change" && (
                        <ArrowUpDown className="w-3 h-3 inline ml-1" />
                      )}
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(item => {
                    const change = (item.v2_amount || 0) - (item.v1_amount || 0)
                    const changePercent = item.v1_amount 
                      ? (change / item.v1_amount * 100) 
                      : null
                    
                    return (
                      <TableRow key={item.id} className={getRowClassName(item.status)}>
                        <TableCell>
                          {item.status === "added" && (
                            <Badge className="bg-green-500">New</Badge>
                          )}
                          {item.status === "removed" && (
                            <Badge className="bg-red-500">Removed</Badge>
                          )}
                          {item.status === "changed" && (
                            <Badge className="bg-blue-500">Changed</Badge>
                          )}
                          {item.status === "unchanged" && (
                            <Badge variant="outline">Same</Badge>
                          )}
                        </TableCell>
                        <TableCell>{item.cost_line}</TableCell>
                        <TableCell>{item.spend_type}</TableCell>
                        <TableCell>{item.spend_sub_category}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.v1_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.v2_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {change !== 0 && (
                            <div className="flex items-center justify-end gap-2">
                              {getChangeIcon(item.v1_amount, item.v2_amount)}
                              <span className={change > 0 ? "text-green-600" : "text-red-600"}>
                                {change > 0 ? "+" : ""}{formatCurrency(change)}
                              </span>
                              {changePercent !== null && (
                                <span className="text-xs text-muted-foreground">
                                  ({changePercent > 0 ? "+" : ""}{changePercent.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Version 1 Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Version {version1}</CardTitle>
                  {v1Data && (
                    <CardDescription>
                      Created on {format(new Date(v1Data.created_at), "MMM d, yyyy")}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.totalV1)}</p>
                    </div>
                    {v1Data && (
                      <div>
                        <p className="text-sm text-muted-foreground">Reason</p>
                        <p className="text-sm">{v1Data.reason_for_change}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="text-sm">{v1Data?.created_by || "System"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Version 2 Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Version {version2}</CardTitle>
                  {v2Data && (
                    <CardDescription>
                      Created on {format(new Date(v2Data.created_at), "MMM d, yyyy")}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.totalV2)}</p>
                    </div>
                    {v2Data && (
                      <div>
                        <p className="text-sm text-muted-foreground">Reason</p>
                        <p className="text-sm">{v2Data.reason_for_change}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="text-sm">{v2Data?.created_by || "System"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Change Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Change Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Increased Items</span>
                    <span>{stats.increased}</span>
                  </div>
                  <Progress value={(stats.increased / Math.max(stats.changed, 1)) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Decreased Items</span>
                    <span>{stats.decreased}</span>
                  </div>
                  <Progress value={(stats.decreased / Math.max(stats.changed, 1)) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Unchanged Items</span>
                    <span>{stats.unchanged}</span>
                  </div>
                  <Progress value={(stats.unchanged / Math.max(comparisonData.length, 1)) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insights" className="relative h-[calc(90vh-200px)]">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
            {/* Waterfall Chart */}
            <WaterfallChart
              data={comparisonData.map(item => ({
                id: item.id,
                category: item.sub_business_line,
                v1_amount: item.v1_amount,
                v2_amount: item.v2_amount,
                change: (item.v2_amount || 0) - (item.v1_amount || 0)
              }))}
              title="Budget Change Waterfall Analysis"
              description="Visual representation of how each category contributes to the total budget change"
            />
            
            {/* Category Comparison */}
            <CategoryComparisonChart
              data={(() => {
                const categoryMap = new Map()
                comparisonData.forEach(item => {
                  if (!categoryMap.has(item.sub_business_line)) {
                    categoryMap.set(item.sub_business_line, {
                      category: item.sub_business_line,
                      v1_total: 0,
                      v2_total: 0,
                      items: 0
                    })
                  }
                  const cat = categoryMap.get(item.sub_business_line)
                  cat.v1_total += item.v1_amount || 0
                  cat.v2_total += item.v2_amount || 0
                  cat.items++
                })
                
                return Array.from(categoryMap.values()).map(cat => ({
                  ...cat,
                  change: cat.v2_total - cat.v1_total,
                  changePercent: cat.v1_total > 0 ? ((cat.v2_total - cat.v1_total) / cat.v1_total) * 100 : 0
                }))
              })()}
            />
            
            {/* Variance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Variance Drivers</h3>
                <VarianceInsights
                  data={comparisonData
                    .filter(item => item.v1_amount !== null || item.v2_amount !== null)
                    .map(item => ({
                      category: item.sub_business_line,
                      item: `${item.cost_line} - ${item.spend_sub_category}`,
                      change: (item.v2_amount || 0) - (item.v1_amount || 0),
                      changePercent: item.v1_amount ? 
                        (((item.v2_amount || 0) - item.v1_amount) / item.v1_amount) * 100 : 
                        item.v2_amount ? 100 : 0
                    }))}
                />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Summary</CardTitle>
                  <CardDescription>Quick overview of changes between versions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{comparisonData.length}</p>
                      <p className="text-xs text-muted-foreground">Total Line Items</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round((stats.changed / Math.max(comparisonData.length, 1)) * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Items Changed</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Largest Increase</span>
                      <span className="text-sm font-medium text-green-600">
                        {(() => {
                          const maxIncrease = comparisonData
                            .map(item => ({
                              name: item.spend_sub_category,
                              change: (item.v2_amount || 0) - (item.v1_amount || 0)
                            }))
                            .sort((a, b) => b.change - a.change)[0]
                          return maxIncrease?.change > 0 ? 
                            `+${formatCurrency(maxIncrease.change)}` : 
                            "No increases"
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Largest Decrease</span>
                      <span className="text-sm font-medium text-red-600">
                        {(() => {
                          const maxDecrease = comparisonData
                            .map(item => ({
                              name: item.spend_sub_category,
                              change: (item.v2_amount || 0) - (item.v1_amount || 0)
                            }))
                            .sort((a, b) => a.change - b.change)[0]
                          return maxDecrease?.change < 0 ? 
                            formatCurrency(Math.abs(maxDecrease.change)) : 
                            "No decreases"
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Net Impact</span>
                      <span className={`text-sm font-bold ${stats.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.totalChange >= 0 ? '+' : ''}{formatCurrency(stats.totalChange)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
          </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}