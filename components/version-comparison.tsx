'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { versionComparisonUtils } from '@/lib/version-comparison-utils'
import { WaterfallChart, CategoryComparisonChart, VarianceInsights } from './version-comparison-charts'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { VersionPanel } from './version-panel'
import { useIsMobile } from '@/hooks/use-mobile'
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
  Info,
  Columns, 
  Square, 
  ArrowRight
} from 'lucide-react'

// Types and Interfaces
type ViewMode = "all" | "changed" | "added" | "removed" | "increased" | "decreased"
type PresentationMode = "sheet" | "dialog"

interface BudgetVersion {
  version: number
  totalCost: number
  reason_for_change?: string
  created_at?: string
  costLines: Array<{
    id?: string
    costLineName: string
    category?: string
    sub_business_line?: string
    segment?: string
    totalCost: number
    status?: string
  }>
}

interface ProjectData {
  id: string
  name: string
}

interface VersionComparisonProps {
  isOpen: boolean
  onClose: () => void
  projectData: ProjectData
  versions: BudgetVersion[]
  mode?: PresentationMode // 'sheet' or 'dialog' - defaults to 'sheet'
  showAdvancedFeatures?: boolean // Enable worldclass features
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: string | number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  className?: string
  description?: string
}

// Utility Functions
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  className,
  description 
}: MetricCardProps) {
  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />
  }

  const trendColors = {
    up: 'text-red-600 dark:text-red-400',
    down: 'text-green-600 dark:text-green-400',
    neutral: 'text-muted-foreground'
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-2">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 mt-2", trendColors[trend])}>
            {trendIcons[trend]}
            <span className="text-xs font-medium">{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Unified Component
export function VersionComparison({
  isOpen,
  onClose,
  projectData,
  versions,
  mode = 'sheet',
  showAdvancedFeatures = false
}: VersionComparisonProps) {
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [layout, setLayout] = useState<'side-by-side' | 'unified'>('side-by-side')
  const [selectedV1, setSelectedV1] = useState(1)
  const [selectedV2, setSelectedV2] = useState(2)

  // Ensure we have valid versions
  useEffect(() => {
    if (versions.length >= 2) {
      setSelectedV1(versions[0].version)
      setSelectedV2(versions[1].version)
    }
  }, [versions])

  // Get selected versions
  const v1 = versions.find(v => v.version === selectedV1) || versions[0]
  const v2 = versions.find(v => v.version === selectedV2) || versions[1]

  // Compute comparison data
  const comparisonData = useMemo(() => {
    if (!v1 || !v2) return null

    const v1Map = new Map(v1.costLines.map(line => [line.costLineName, line]))
    const v2Map = new Map(v2.costLines.map(line => [line.costLineName, line]))

    const allLineNames = new Set([...v1Map.keys(), ...v2Map.keys()])
    const differences: any[] = []

    allLineNames.forEach(lineName => {
      const v1Line = v1Map.get(lineName)
      const v2Line = v2Map.get(lineName)

      const v1Amount = v1Line?.totalCost || 0
      const v2Amount = v2Line?.totalCost || 0
      const change = v2Amount - v1Amount
      const changePercent = v1Amount !== 0 ? (change / Math.abs(v1Amount)) * 100 : v2Amount !== 0 ? 100 : 0

      let status: 'added' | 'removed' | 'increased' | 'decreased' | 'unchanged' = 'unchanged'
      if (!v1Line && v2Line) status = 'added'
      else if (v1Line && !v2Line) status = 'removed'
      else if (change > 0) status = 'increased'
      else if (change < 0) status = 'decreased'

      differences.push({
        id: v2Line?.id || v1Line?.id || lineName,
        costLineName: lineName,
        category: v2Line?.category || v1Line?.category || 'Uncategorized',
        v1_amount: v1Amount,
        v2_amount: v2Amount,
        change,
        changePercent,
        status
      })
    })

    // Calculate summary metrics
    const totalChange = v2.totalCost - v1.totalCost
    const changePercent = v1.totalCost !== 0 ? (totalChange / Math.abs(v1.totalCost)) * 100 : 0

    const addedCount = differences.filter(d => d.status === 'added').length
    const removedCount = differences.filter(d => d.status === 'removed').length
    const increasedCount = differences.filter(d => d.status === 'increased').length
    const decreasedCount = differences.filter(d => d.status === 'decreased').length

    return {
      differences,
      summary: {
        v1Total: v1.totalCost,
        v2Total: v2.totalCost,
        totalChange,
        changePercent,
        addedCount,
        removedCount,
        increasedCount,
        decreasedCount,
        totalLines: differences.length
      }
    }
  }, [v1, v2])

  // Filter differences based on view mode and search
  const filteredDifferences = useMemo(() => {
    if (!comparisonData) return []

    let filtered = [...comparisonData.differences]

    // Apply view mode filter
    if (viewMode !== 'all') {
      if (viewMode === 'changed') {
        filtered = filtered.filter(d => d.status !== 'unchanged')
      } else {
        filtered = filtered.filter(d => d.status === viewMode)
      }
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.category === selectedCategory)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(d => 
        d.costLineName.toLowerCase().includes(query) ||
        d.category.toLowerCase().includes(query)
      )
    }

    // Sort by absolute change amount
    return filtered.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }, [comparisonData, viewMode, selectedCategory, searchQuery])

  // Get unique categories
  const categories = useMemo(() => {
    if (!comparisonData) return []
    const cats = new Set(comparisonData.differences.map(d => d.category))
    return Array.from(cats).sort()
  }, [comparisonData])

  // Export functionality
  const handleExport = useCallback(() => {
    if (!comparisonData) return

    const csvContent = [
      ['Cost Line', 'Category', `Version ${v1.version}`, `Version ${v2.version}`, 'Change', 'Change %', 'Status'],
      ...filteredDifferences.map(d => [
        d.costLineName,
        d.category,
        d.v1_amount,
        d.v2_amount,
        d.change,
        `${d.changePercent.toFixed(2)}%`,
        d.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `version-comparison-${projectData.name}-v${v1.version}-v${v2.version}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [comparisonData, filteredDifferences, projectData, v1, v2])

  if (!comparisonData) {
    return null
  }

  // Content to be rendered in both Sheet and Dialog modes
  const content = (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="space-y-4 mb-6">
        {/* Version Selectors */}
        <div className="flex gap-2">
          <Select value={selectedV1.toString()} onValueChange={(v) => setSelectedV1(Number(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map(ver => (
                <SelectItem key={ver.version} value={ver.version.toString()}>
                  Version {ver.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <ArrowRight className="h-5 w-5 self-center text-muted-foreground" />
          
          <Select value={selectedV2.toString()} onValueChange={(v) => setSelectedV2(Number(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map(ver => (
                <SelectItem key={ver.version} value={ver.version.toString()}>
                  Version {ver.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-2">
            {!isMobile && (
              <ToggleGroup type="single" value={layout} onValueChange={(v) => v && setLayout(v as any)}>
                <ToggleGroupItem value="side-by-side" aria-label="Side by side view">
                  <Columns className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="unified" aria-label="Unified view">
                  <Square className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Change"
            value={formatCurrency(comparisonData.summary.totalChange)}
            change={formatPercentage(comparisonData.summary.changePercent)}
            trend={comparisonData.summary.totalChange > 0 ? 'up' : comparisonData.summary.totalChange < 0 ? 'down' : 'neutral'}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <MetricCard
            title="Items Changed"
            value={comparisonData.summary.totalLines - comparisonData.differences.filter(d => d.status === 'unchanged').length}
            description={`of ${comparisonData.summary.totalLines} total`}
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            title="Items Added"
            value={comparisonData.summary.addedCount}
            trend="neutral"
            icon={<Plus className="h-5 w-5" />}
          />
          <MetricCard
            title="Items Removed"
            value={comparisonData.summary.removedCount}
            trend="neutral"
            icon={<Minus className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 w-full max-w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-4">
          <div className="space-y-6">
            {/* Filter Controls */}
            {showAdvancedFeatures && (
              <div className="flex flex-wrap gap-2">
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="changed">Changed Only</SelectItem>
                    <SelectItem value="added">Added</SelectItem>
                    <SelectItem value="removed">Removed</SelectItem>
                    <SelectItem value="increased">Increased</SelectItem>
                    <SelectItem value="decreased">Decreased</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search cost lines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px]"
                />
              </div>
            )}

            {/* Comparison Layout */}
            {layout === 'side-by-side' && !isMobile ? (
              <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
                <ResizablePanel defaultSize={50}>
                  <VersionPanel
                    version={v1}
                    comparisonVersion={v2}
                    height={600}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50}>
                  <VersionPanel
                    version={v2}
                    comparisonVersion={v1}
                    height={600}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cost Line</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">V{v1.version}</TableHead>
                      <TableHead className="text-right">V{v2.version}</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDifferences.map((diff) => (
                      <TableRow key={diff.id}>
                        <TableCell className="font-medium">{diff.costLineName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{diff.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(diff.v1_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(diff.v2_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-medium",
                            diff.change > 0 && "text-red-600",
                            diff.change < 0 && "text-green-600"
                          )}>
                            {formatCurrency(diff.change)}
                            <span className="text-xs ml-1">
                              ({formatPercentage(diff.changePercent)})
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={
                            diff.status === 'added' ? 'default' :
                            diff.status === 'removed' ? 'secondary' :
                            diff.status === 'increased' ? 'destructive' :
                            diff.status === 'decreased' ? 'outline' :
                            'outline'
                          }>
                            {diff.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="flex-1 mt-4">
          <div className="space-y-4">
            <VarianceInsights 
              data={filteredDifferences.map(d => ({
                category: d.category,
                item: d.costLineName,
                change: d.change,
                changePercent: d.changePercent
              }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="charts" className="flex-1 mt-4">
          <div className="space-y-6">
            <WaterfallChart
              data={comparisonData.differences.map(d => ({
                ...d,
                category: d.category || 'Uncategorized'
              }))}
              title="Budget Change Waterfall"
              description="Visual breakdown of changes between versions"
            />
            
            <CategoryComparisonChart
              data={(() => {
                // Aggregate by category
                const categoryMap = new Map<string, {v1: number, v2: number}>()
                comparisonData.differences.forEach(d => {
                  const cat = d.category || 'Uncategorized'
                  const current = categoryMap.get(cat) || {v1: 0, v2: 0}
                  current.v1 += d.v1_amount || 0
                  current.v2 += d.v2_amount || 0
                  categoryMap.set(cat, current)
                })
                
                return Array.from(categoryMap.entries()).map(([category, totals]) => ({
                  category,
                  v1_total: totals.v1,
                  v2_total: totals.v2,
                  change: totals.v2 - totals.v1,
                  changePercent: totals.v1 !== 0 ? ((totals.v2 - totals.v1) / Math.abs(totals.v1)) * 100 : 0
                }))
              })()}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  // Render based on mode
  if (mode === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version Comparison - {projectData.name}</DialogTitle>
            <DialogDescription>
              Compare budget versions to understand changes and trends
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[90%] sm:max-w-[1400px] overflow-y-auto"
        aria-describedby="version-comparison-description"
      >
        <SheetHeader>
          <SheetTitle>Version Comparison - {projectData.name}</SheetTitle>
          <SheetDescription id="version-comparison-description">
            Compare budget versions to understand changes and trends
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        {content}
      </SheetContent>
    </Sheet>
  )
}