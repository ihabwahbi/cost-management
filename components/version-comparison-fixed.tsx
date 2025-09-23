"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WaterfallChart, CategoryComparisonChart, VarianceInsights } from "@/components/version-comparison-charts-fixed"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown, 
  ArrowRight,
  Eye,
  Download,
  FileSpreadsheet,
  ArrowUpDown,
  Plus,
  Minus,
  Equal
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Export dependencies removed - implement as needed

type ViewMode = "all" | "changed" | "added" | "removed" | "increased" | "decreased"
type SortField = "cost_line" | "spend_type" | "sub_category" | "v1_amount" | "v2_amount" | "change"
type SortDirection = "asc" | "desc"

interface ForecastVersion {
  id: string
  version_number: number
  reason_for_change: string
  created_at: string
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
  forecasts: { [key: number]: BudgetForecast[] }
}

export function VersionComparison({
  isOpen,
  onClose,
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

  // Build comparison data with FIXED logic for version 0 comparisons
  const buildComparisonData = () => {
    const comparisonMap = new Map<string, any>()
    
    // Process version 1 data
    if (version1 === 0) {
      // Version 0 uses budget_cost from cost_breakdown
      costBreakdowns.forEach(cost => {
        comparisonMap.set(cost.id, {
          id: cost.id,
          cost_line: cost.cost_line,
          spend_type: cost.spend_type,
          spend_sub_category: cost.spend_sub_category,
          sub_business_line: cost.sub_business_line,
          v1_amount: cost.budget_cost,
          v2_amount: null,
          status: "removed", // Default, will be updated when processing v2
        })
      })
    } else {
      // Other versions use forecasts
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
            status: "removed", // Default, will be updated when processing v2
          })
        }
      })
    }

    // Process version 2 data and determine correct status
    if (version2 === 0) {
      // Version 0 uses budget_cost
      costBreakdowns.forEach(cost => {
        const existing = comparisonMap.get(cost.id)
        if (existing) {
          existing.v2_amount = cost.budget_cost
          // Fix: properly check if values are the same
          if (existing.v1_amount === cost.budget_cost) {
            existing.status = "unchanged"
          } else {
            existing.status = "changed"
          }
        } else {
          // Item exists in v2 but not in v1 - it's new
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
      // Other versions use forecasts
      v2Forecasts.forEach(forecast => {
        const cost = costBreakdowns.find(c => c.id === forecast.cost_breakdown_id)
        if (cost) {
          const existing = comparisonMap.get(cost.id)
          if (existing) {
            existing.v2_amount = forecast.forecasted_cost
            // Fix: properly check if values are the same
            if (existing.v1_amount === forecast.forecasted_cost) {
              existing.status = "unchanged"
            } else {
              existing.status = "changed"
            }
          } else {
            // Item exists in v2 but not in v1 - it's new
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

  const comparisonData = useMemo(() => buildComparisonData(), [version1, version2, v1Forecasts, v2Forecasts])

  // Calculate statistics
  const stats = useMemo(() => {
    let added = 0
    let removed = 0
    let changed = 0
    let unchanged = 0
    let totalV1 = 0
    let totalV2 = 0

    comparisonData.forEach(item => {
      if (item.status === "added") added++
      else if (item.status === "removed") removed++
      else if (item.status === "changed") changed++
      else if (item.status === "unchanged") unchanged++
      
      totalV1 += item.v1_amount || 0
      totalV2 += item.v2_amount || 0
    })

    const totalChange = totalV2 - totalV1
    const changePercent = totalV1 > 0 ? (totalChange / totalV1) * 100 : 0

    return {
      added,
      removed,
      changed,
      unchanged,
      totalV1,
      totalV2,
      totalChange,
      changePercent,
    }
  }, [comparisonData])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    comparisonData.forEach(item => cats.add(item.sub_business_line))
    return ["all", ...Array.from(cats)]
  }, [comparisonData])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
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
          item.v1_amount !== null && item.v2_amount !== null && item.v2_amount > item.v1_amount
        )
        break
      case "decreased":
        filtered = filtered.filter(item => 
          item.v1_amount !== null && item.v2_amount !== null && item.v2_amount < item.v1_amount
        )
        break
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.sub_business_line === selectedCategory)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.cost_line.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.spend_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.spend_sub_category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      
      if (sortField === "change") {
        aValue = (a.v2_amount || 0) - (a.v1_amount || 0)
        bValue = (b.v2_amount || 0) - (b.v1_amount || 0)
      }
      
      if (aValue === null) aValue = 0
      if (bValue === null) bValue = 0
      
      if (typeof aValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [comparisonData, viewMode, selectedCategory, searchTerm, sortField, sortDirection])

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRowClassName = (status: string) => {
    switch (status) {
      case "added":
        return "bg-green-50/50 hover:bg-green-50"
      case "removed":
        return "bg-red-50/50 hover:bg-red-50"
      case "changed":
        return "bg-blue-50/50 hover:bg-blue-50"
      default:
        return "hover:bg-gray-50"
    }
  }

  const getChangeIcon = (v1: number | null, v2: number | null) => {
    if (v1 === null && v2 !== null) return <Plus className="w-4 h-4 text-green-600" />
    if (v1 !== null && v2 === null) return <Minus className="w-4 h-4 text-red-600" />
    if (v1 !== null && v2 !== null) {
      if (v2 > v1) return <ArrowUp className="w-4 h-4 text-green-600" />
      if (v2 < v1) return <ArrowDown className="w-4 h-4 text-red-600" />
      return <Equal className="w-4 h-4 text-gray-600" />
    }
    return null
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    setIsExporting(true)
    
    try {
      if (format === "csv") {
        const exportData = filteredAndSortedData.map(item => ({
          "Status": item.status,
          "Cost Line": item.cost_line,
          "Type": item.spend_type,
          "Sub Category": item.spend_sub_category,
          "Business Line": item.sub_business_line,
          "Version 1 Amount": item.v1_amount || 0,
          "Version 2 Amount": item.v2_amount || 0,
          "Change": (item.v2_amount || 0) - (item.v1_amount || 0),
          "Change %": item.v1_amount ? (((item.v2_amount || 0) - item.v1_amount) / item.v1_amount * 100).toFixed(1) + "%" : "N/A"
        }))
        
        const headers = Object.keys(exportData[0])
        const csvContent = [
          headers.join(","),
          ...exportData.map(row => headers.map((h: string) => (row as any)[h]).join(","))
        ].join("\n")
        
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `version_comparison_${version1}_vs_${version2}.csv`
        a.click()
      } else {
        // Excel and PDF export can be implemented with proper dependencies
        console.log(`Export format ${format} not currently implemented`)
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
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
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isExporting}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
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

              {/* Improved Statistics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Change</p>
                      <p className={`text-lg font-bold ${stats.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.totalChange >= 0 ? '+' : ''}{formatCurrency(stats.totalChange)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Change %</p>
                      <p className={`text-lg font-bold ${stats.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Added</p>
                      <p className="text-lg font-bold text-green-600">{stats.added}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Removed</p>
                      <p className="text-lg font-bold text-red-600">{stats.removed}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Changed</p>
                      <p className="text-lg font-bold text-blue-600">{stats.changed}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Same</p>
                      <p className="text-lg font-bold text-gray-600">{stats.unchanged}</p>
                    </div>
                  </CardContent>
                </Card>
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
                        <TableHead 
                          className="cursor-pointer text-right"
                          onClick={() => handleSort("v1_amount")}
                        >
                          V{version1} Amount
                          {sortField === "v1_amount" && (
                            <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          )}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer text-right"
                          onClick={() => handleSort("v2_amount")}
                        >
                          V{version2} Amount
                          {sortField === "v2_amount" && (
                            <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          )}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer text-right"
                          onClick={() => handleSort("change")}
                        >
                          Change
                          {sortField === "change" && (
                            <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          )}
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedData.map(item => {
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Version {version1} Summary</CardTitle>
                    <CardDescription>{v1Data?.reason_for_change || "Original version"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Budget:</span>
                        <span className="font-semibold">{formatCurrency(stats.totalV1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Line Items:</span>
                        <span className="font-semibold">{comparisonData.filter(d => d.v1_amount !== null).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Version {version2} Summary</CardTitle>
                    <CardDescription>{v2Data?.reason_for_change || "Updated version"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Budget:</span>
                        <span className="font-semibold">{formatCurrency(stats.totalV2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Line Items:</span>
                        <span className="font-semibold">{comparisonData.filter(d => d.v2_amount !== null).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                  
                  {/* Category Comparison - with proper data */}
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