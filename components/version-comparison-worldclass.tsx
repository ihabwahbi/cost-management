"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WaterfallChart, CategoryComparisonChart, VarianceInsights } from "@/components/version-comparison-charts-fixed"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown,
  Plus,
  Minus,
  Equal,
  Search,
  Filter,
  Download,
  ChevronRight,
  Activity,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react"

type ViewMode = "all" | "changed" | "added" | "removed" | "increased" | "decreased"

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

// World-class metric card component
function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  className 
}: {
  title: string
  value: string | number
  change?: string
  icon?: any
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}) {
  return (
    <Card className={cn("relative overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {change && (
                <span className={cn(
                  "text-xs font-medium",
                  trend === 'up' ? "text-green-600" : 
                  trend === 'down' ? "text-red-600" : 
                  "text-gray-600"
                )}>
                  {change}
                </span>
              )}
            </div>
          </div>
          {Icon && (
            <div className={cn(
              "p-2 rounded-lg",
              trend === 'up' ? "bg-green-100 text-green-600" : 
              trend === 'down' ? "bg-red-100 text-red-600" : 
              "bg-gray-100 text-gray-600"
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Status badge with improved design
function StatusBadge({ status }: { status: string }) {
  const config = {
    added: { label: "New", icon: Plus, className: "bg-green-100 text-green-700 border-green-200" },
    removed: { label: "Removed", icon: Minus, className: "bg-red-100 text-red-700 border-red-200" },
    changed: { label: "Changed", icon: Activity, className: "bg-blue-100 text-blue-700 border-blue-200" },
    unchanged: { label: "Same", icon: Equal, className: "bg-gray-100 text-gray-700 border-gray-200" }
  }
  
  const { label, icon: Icon, className } = config[status as keyof typeof config] || config.unchanged
  
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("overview")

  // Debug logging for data investigation
  useEffect(() => {
    console.log('[VersionComparison] Data loaded:', {
      version1,
      version2,
      costBreakdownsCount: costBreakdowns.length,
      v1ForecastsCount: forecasts[version1]?.length || 0,
      v2ForecastsCount: forecasts[version2]?.length || 0,
      costBreakdownIds: costBreakdowns.map(c => c.id),
      v1ForecastIds: forecasts[version1]?.map(f => f.cost_breakdown_id) || [],
      v2ForecastIds: forecasts[version2]?.map(f => f.cost_breakdown_id) || []
    })
  }, [version1, version2, costBreakdowns, forecasts])

  const v1Forecasts = forecasts[version1] || []
  const v2Forecasts = forecasts[version2] || []

  // FIXED comparison logic - properly handles version 0 and non-existent items
  const buildComparisonData = () => {
    const comparisonMap = new Map<string, any>()
    
    // For version 0, we use ALL cost breakdowns with their budget_cost
    // For other versions, we only use items that have forecasts
    
    if (version1 === 0) {
      // Version 0: Use all cost breakdowns with budget_cost
      costBreakdowns.forEach(cost => {
        comparisonMap.set(cost.id, {
          id: cost.id,
          cost_line: cost.cost_line,
          spend_type: cost.spend_type,
          spend_sub_category: cost.spend_sub_category,
          sub_business_line: cost.sub_business_line,
          v1_amount: cost.budget_cost,
          v2_amount: null,
          status: "removed", // Default status, will be updated
          existsInV1: true,
          existsInV2: false
        })
      })
    } else {
      // Other versions: Only include items with forecasts
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
            existsInV1: true,
            existsInV2: false
          })
        }
      })
    }

    // Process version 2 data
    if (version2 === 0) {
      // Version 0: Check all cost breakdowns
      costBreakdowns.forEach(cost => {
        const existing = comparisonMap.get(cost.id)
        if (existing) {
          // Item exists in both versions
          existing.v2_amount = cost.budget_cost
          existing.existsInV2 = true
          
          // Determine status based on amounts
          if (existing.v1_amount === cost.budget_cost) {
            existing.status = "unchanged"
          } else {
            existing.status = "changed"
          }
        } else {
          // Item only exists in version 2 - it's NEW
          comparisonMap.set(cost.id, {
            id: cost.id,
            cost_line: cost.cost_line,
            spend_type: cost.spend_type,
            spend_sub_category: cost.spend_sub_category,
            sub_business_line: cost.sub_business_line,
            v1_amount: null,
            v2_amount: cost.budget_cost,
            status: "added",
            existsInV1: false,
            existsInV2: true
          })
        }
      })
    } else {
      // Other versions: Only process items with forecasts
      v2Forecasts.forEach(forecast => {
        const cost = costBreakdowns.find(c => c.id === forecast.cost_breakdown_id)
        if (cost) {
          const existing = comparisonMap.get(cost.id)
          if (existing) {
            // Item exists in both versions
            existing.v2_amount = forecast.forecasted_cost
            existing.existsInV2 = true
            
            // Determine status based on amounts
            if (existing.v1_amount === forecast.forecasted_cost) {
              existing.status = "unchanged"
            } else {
              existing.status = "changed"
            }
          } else {
            // Item only exists in version 2 - it's NEW
            comparisonMap.set(cost.id, {
              id: cost.id,
              cost_line: cost.cost_line,
              spend_type: cost.spend_type,
              spend_sub_category: cost.spend_sub_category,
              sub_business_line: cost.sub_business_line,
              v1_amount: null,
              v2_amount: forecast.forecasted_cost,
              status: "added",
              existsInV1: false,
              existsInV2: true
            })
          }
        }
      })
    }

    // Final validation: Items that exist only in v1 should be marked as "removed"
    // Items that exist only in v2 should be marked as "added"
    // This is already handled above, but let's ensure it's correct
    const results = Array.from(comparisonMap.values())
    
    console.log('[VersionComparison] Comparison results:', {
      total: results.length,
      added: results.filter(r => r.status === 'added').length,
      removed: results.filter(r => r.status === 'removed').length,
      changed: results.filter(r => r.status === 'changed').length,
      unchanged: results.filter(r => r.status === 'unchanged').length,
      sample: results.slice(0, 3)
    })
    
    return results
  }

  const comparisonData = useMemo(() => buildComparisonData(), [version1, version2, v1Forecasts, v2Forecasts, costBreakdowns])

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
      total: comparisonData.length
    }
  }, [comparisonData])

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>()
    comparisonData.forEach(item => cats.add(item.sub_business_line))
    return ["all", ...Array.from(cats).sort()]
  }, [comparisonData])

  // Filter data
  const filteredData = useMemo(() => {
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
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(item => 
        item.cost_line.toLowerCase().includes(search) ||
        item.spend_type.toLowerCase().includes(search) ||
        item.spend_sub_category.toLowerCase().includes(search) ||
        item.sub_business_line.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [comparisonData, viewMode, selectedCategory, searchTerm])

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "—"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getChangeIndicator = (v1: number | null, v2: number | null) => {
    if (v1 === null && v2 !== null) return { icon: Plus, color: "text-green-600" }
    if (v1 !== null && v2 === null) return { icon: Minus, color: "text-red-600" }
    if (v1 !== null && v2 !== null) {
      if (v2 > v1) return { icon: TrendingUp, color: "text-green-600" }
      if (v2 < v1) return { icon: TrendingDown, color: "text-red-600" }
    }
    return { icon: Equal, color: "text-gray-400" }
  }

  const handleExport = () => {
    // Prepare CSV data
    const csvHeaders = [
      "Sub Business Line",
      "Cost Line",
      "Spend Type", 
      "Spend Sub-Category",
      `Version ${version1} Cost`,
      `Version ${version2} Cost`,
      "Difference",
      "% Change",
      "Status"
    ]
    
    const csvRows = filteredData.map(item => [
      item.sub_business_line,
      item.cost_line,
      item.spend_type,
      item.spend_sub_category,
      item.version1_cost?.toString() || "0",
      item.version2_cost?.toString() || "0",
      (item.version2_cost! - item.version1_cost!).toString(),
      item.version1_cost && item.version2_cost 
        ? ((item.version2_cost - item.version1_cost) / item.version1_cost * 100).toFixed(2) + "%"
        : "N/A",
      item.status
    ])
    
    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")
    
    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `version_comparison_v${version1}_v${version2}_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Version Comparison
              </DialogTitle>
              <DialogDescription className="mt-1">
                {projectName} • Version {version1} → Version {version2}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                <Activity className="h-3 w-3 mr-1" />
                {stats.total} items
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 py-3 border-b bg-white">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
                <TabsTrigger value="insights">Visual Insights</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-auto p-6 m-0">
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Key Metrics */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      title="Total Change"
                      value={formatCurrency(stats.totalChange)}
                      change={`${stats.changePercent >= 0 ? '+' : ''}${stats.changePercent.toFixed(1)}%`}
                      icon={DollarSign}
                      trend={stats.totalChange > 0 ? 'up' : stats.totalChange < 0 ? 'down' : 'neutral'}
                    />
                    <MetricCard
                      title="Items Added"
                      value={stats.added}
                      icon={Plus}
                      trend={stats.added > 0 ? 'up' : 'neutral'}
                      className="border-green-200"
                    />
                    <MetricCard
                      title="Items Changed"
                      value={stats.changed}
                      icon={Activity}
                      trend={stats.changed > 0 ? 'up' : 'neutral'}
                      className="border-blue-200"
                    />
                    <MetricCard
                      title="Items Removed"
                      value={stats.removed}
                      icon={Minus}
                      trend={stats.removed > 0 ? 'down' : 'neutral'}
                      className="border-red-200"
                    />
                  </div>
                </div>

                {/* Version Summaries */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Version {version1}</CardTitle>
                      <CardDescription>
                        {version1 === 0 ? "Original Budget" : versions.find(v => v.version_number === version1)?.reason_for_change || "Forecast Version"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Amount</span>
                          <span className="font-semibold">{formatCurrency(stats.totalV1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Line Items</span>
                          <span className="font-semibold">
                            {comparisonData.filter(d => d.v1_amount !== null).length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Version {version2}</CardTitle>
                      <CardDescription>
                        {version2 === 0 ? "Original Budget" : versions.find(v => v.version_number === version2)?.reason_for_change || "Forecast Version"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Amount</span>
                          <span className="font-semibold">{formatCurrency(stats.totalV2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Line Items</span>
                          <span className="font-semibold">
                            {comparisonData.filter(d => d.v2_amount !== null).length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Changes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Significant Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredData
                        .filter(item => item.status === 'changed' || item.status === 'added')
                        .sort((a, b) => {
                          const aChange = Math.abs((a.v2_amount || 0) - (a.v1_amount || 0))
                          const bChange = Math.abs((b.v2_amount || 0) - (b.v1_amount || 0))
                          return bChange - aChange
                        })
                        .slice(0, 5)
                        .map(item => {
                          const change = (item.v2_amount || 0) - (item.v1_amount || 0)
                          const { icon: Icon, color } = getChangeIndicator(item.v1_amount, item.v2_amount)
                          
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                              <div className="flex items-center gap-3">
                                <Icon className={cn("h-4 w-4", color)} />
                                <div>
                                  <p className="font-medium text-sm">{item.cost_line}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.spend_type} • {item.spend_sub_category}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={cn("font-semibold text-sm", change > 0 ? "text-green-600" : "text-red-600")}>
                                  {change > 0 ? '+' : ''}{formatCurrency(change)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(item.v1_amount)} → {formatCurrency(item.v2_amount)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Detailed Analysis Tab */}
            <TabsContent value="details" className="flex-1 flex flex-col p-6 m-0 gap-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
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

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Package className="h-4 w-4 mr-2" />
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

                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Results summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {comparisonData.length} items
                </p>
              </div>

              {/* Table */}
              <div className="flex-1 border rounded-lg overflow-hidden">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead>Cost Line</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Business Line</TableHead>
                        <TableHead className="text-right">V{version1} Amount</TableHead>
                        <TableHead className="text-right">V{version2} Amount</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item, index) => {
                        const change = (item.v2_amount || 0) - (item.v1_amount || 0)
                        const changePercent = item.v1_amount 
                          ? (change / item.v1_amount * 100) 
                          : item.v2_amount ? 100 : 0
                        const { icon: Icon, color } = getChangeIndicator(item.v1_amount, item.v2_amount)

                        return (
                          <TableRow 
                            key={item.id} 
                            className={cn(
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/50",
                              "hover:bg-gray-100 transition-colors"
                            )}
                          >
                            <TableCell>
                              <StatusBadge status={item.status} />
                            </TableCell>
                            <TableCell className="font-medium">{item.cost_line}</TableCell>
                            <TableCell>{item.spend_type}</TableCell>
                            <TableCell>{item.spend_sub_category}</TableCell>
                            <TableCell>{item.sub_business_line}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(item.v1_amount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(item.v2_amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {change !== 0 && (
                                <div className="flex items-center justify-end gap-2">
                                  <Icon className={cn("h-4 w-4", color)} />
                                  <div className="text-right">
                                    <p className={cn("font-semibold text-sm", color)}>
                                      {change > 0 ? '+' : ''}{formatCurrency(change)}
                                    </p>
                                    {changePercent !== 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Visual Insights Tab */}
            <TabsContent value="insights" className="flex-1 overflow-auto p-6 m-0">
              <div className="space-y-6 max-w-7xl mx-auto">
                <WaterfallChart
                  data={comparisonData.map(item => ({
                    id: item.id,
                    category: item.sub_business_line,
                    v1_amount: item.v1_amount,
                    v2_amount: item.v2_amount,
                    change: (item.v2_amount || 0) - (item.v1_amount || 0)
                  }))}
                  title="Budget Change Waterfall"
                  description="Category-level breakdown of changes between versions"
                />
                
                <CategoryComparisonChart
                  data={(() => {
                    const categoryMap = new Map()
                    comparisonData.forEach(item => {
                      if (!categoryMap.has(item.sub_business_line)) {
                        categoryMap.set(item.sub_business_line, {
                          category: item.sub_business_line,
                          v1_total: 0,
                          v2_total: 0
                        })
                      }
                      const cat = categoryMap.get(item.sub_business_line)
                      cat.v1_total += item.v1_amount || 0
                      cat.v2_total += item.v2_amount || 0
                    })
                    
                    return Array.from(categoryMap.values()).map(cat => ({
                      ...cat,
                      change: cat.v2_total - cat.v1_total,
                      changePercent: cat.v1_total > 0 ? ((cat.v2_total - cat.v1_total) / cat.v1_total) * 100 : 0
                    }))
                  })()}
                />
                
                <div className="grid md:grid-cols-2 gap-6">
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}