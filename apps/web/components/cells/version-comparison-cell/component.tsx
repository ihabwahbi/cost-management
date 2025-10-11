'use client'

import { useState, useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
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
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { versionComparisonUtils } from '@/lib/version-comparison-utils'
import { WaterfallChart, CategoryComparisonChart, VarianceInsights } from './charts'
import { MetricCard } from './helpers'
import { Download, Search, DollarSign, Activity, Plus, Minus } from 'lucide-react'

type ViewMode = "all" | "changed" | "added" | "removed" | "increased" | "decreased"
type DiffStatus = 'added' | 'removed' | 'increased' | 'decreased' | 'unchanged'

interface VersionComparisonCellProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  selectedVersion1: number
  selectedVersion2: number
  mode?: 'sheet' | 'dialog'
}

interface ComparisonDiff {
  id: string
  costLineName: string
  category: string
  v1Amount: number
  v2Amount: number
  change: number
  changePercent: number
  status: DiffStatus
}

export function VersionComparisonCell({
  isOpen,
  onClose,
  projectId,
  projectName,
  selectedVersion1,
  selectedVersion2,
  mode = 'sheet'
}: VersionComparisonCellProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Memoize query input to prevent infinite loops
  const queryInput = useMemo(() => ({
    projectId,
    version1: selectedVersion1,
    version2: selectedVersion2
  }), [projectId, selectedVersion1, selectedVersion2])
  
  const { data, isLoading, error } = trpc.forecasts.getComparisonData.useQuery(
    queryInput,
    {
      enabled: !!projectId && selectedVersion1 !== selectedVersion2,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  )
  
  const comparisonData = useMemo(() => {
    if (!data) return null
    
    const costBreakdownMap = new Map(data.originalCostBreakdown.map(cb => [cb.id, cb]))
    const v1Map = new Map(data.version1.items.map(item => [item.costBreakdownId, item]))
    const v2Map = new Map(data.version2.items.map(item => [item.costBreakdownId, item]))
    const allCostBreakdownIds = new Set([...v1Map.keys(), ...v2Map.keys()])
    const differences: ComparisonDiff[] = []
    
    allCostBreakdownIds.forEach(cbId => {
      const costBreakdown = costBreakdownMap.get(cbId)
      const v1Item = v1Map.get(cbId)
      const v2Item = v2Map.get(cbId)
      
      const v1Amount = v1Item?.forecastedCost || 0
      const v2Amount = v2Item?.forecastedCost || 0
      const change = v2Amount - v1Amount
      const changePercent = versionComparisonUtils.safePercentage(v2Amount, v1Amount)
      
      let status: DiffStatus = 'unchanged'
      if (!v1Item && v2Item) status = 'added'
      else if (v1Item && !v2Item) status = 'removed'
      else if (change > 0) status = 'increased'
      else if (change < 0) status = 'decreased'
      
      differences.push({
        id: cbId,
        costLineName: costBreakdown?.costLine || 'Unknown',
        category: costBreakdown?.subBusinessLine || 'Uncategorized',
        v1Amount,
        v2Amount,
        change,
        changePercent,
        status
      })
    })
    
    const totalChange = differences.reduce((sum, d) => sum + d.change, 0)
    const v1Total = differences.reduce((sum, d) => sum + d.v1Amount, 0)
    const v2Total = differences.reduce((sum, d) => sum + d.v2Amount, 0)
    
    return {
      differences,
      summary: {
        v1Total,
        v2Total,
        totalChange,
        changePercent: versionComparisonUtils.safePercentage(v2Total, v1Total),
        addedCount: differences.filter(d => d.status === 'added').length,
        removedCount: differences.filter(d => d.status === 'removed').length,
        increasedCount: differences.filter(d => d.status === 'increased').length,
        decreasedCount: differences.filter(d => d.status === 'decreased').length,
        totalLines: differences.length
      }
    }
  }, [data])
  
  const filteredDifferences = useMemo(() => {
    if (!comparisonData) return []
    let filtered = [...comparisonData.differences]
    if (viewMode !== 'all') {
      filtered = viewMode === 'changed' ? filtered.filter(d => d.status !== 'unchanged') : filtered.filter(d => d.status === viewMode)
    }
    if (selectedCategory !== 'all') filtered = filtered.filter(d => d.category === selectedCategory)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(d => d.costLineName.toLowerCase().includes(query) || d.category.toLowerCase().includes(query))
    }
    return filtered.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }, [comparisonData, viewMode, selectedCategory, searchQuery])
  
  const categories = useMemo(() => {
    if (!comparisonData) return []
    const cats = new Set(comparisonData.differences.map(d => d.category))
    return Array.from(cats).sort()
  }, [comparisonData])
  
  const handleExport = useCallback(() => {
    if (!comparisonData) return
    
    const csvContent = [
      ['Cost Line', 'Category', `Version ${selectedVersion1}`, `Version ${selectedVersion2}`, 'Change', 'Change %', 'Status'],
      ...filteredDifferences.map(d => [
        d.costLineName,
        d.category,
        d.v1Amount,
        d.v2Amount,
        d.change,
        `${d.changePercent.toFixed(2)}%`,
        d.status
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `version-comparison-${projectName}-v${selectedVersion1}-v${selectedVersion2}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [comparisonData, filteredDifferences, projectName, selectedVersion1, selectedVersion2])
  
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading comparison: {error.message}
        </AlertDescription>
      </Alert>
    )
  }
  
  if (!comparisonData) {
    return null
  }
  
  const waterfallData = filteredDifferences.map(d => ({
    id: d.id, category: d.category, v1_amount: d.v1Amount, v2_amount: d.v2Amount, change: d.change
  }))
  
  const categoryMap = new Map<string, { v1_total: number, v2_total: number }>()
  filteredDifferences.forEach(d => {
    const cat = categoryMap.get(d.category) || { v1_total: 0, v2_total: 0 }
    cat.v1_total += d.v1Amount
    cat.v2_total += d.v2Amount
    categoryMap.set(d.category, cat)
  })
  
  const categoryChartData = Array.from(categoryMap.entries()).map(([category, totals]) => ({
    category, v1_total: totals.v1_total, v2_total: totals.v2_total,
    change: totals.v2_total - totals.v1_total,
    changePercent: versionComparisonUtils.safePercentage(totals.v2_total, totals.v1_total)
  }))
  
  const varianceData = filteredDifferences.slice(0, 10).map(d => ({
    category: d.category, item: d.costLineName, change: d.change, changePercent: d.changePercent
  }))
  
  const content = (
    <div className="flex flex-col h-full space-y-4 px-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />Export
        </Button>
      </div>
      
      <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} className="justify-start">
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="changed">Changed</ToggleGroupItem>
        <ToggleGroupItem value="added">Added</ToggleGroupItem>
        <ToggleGroupItem value="removed">Removed</ToggleGroupItem>
        <ToggleGroupItem value="increased">Increased</ToggleGroupItem>
        <ToggleGroupItem value="decreased">Decreased</ToggleGroupItem>
      </ToggleGroup>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Change" value={versionComparisonUtils.formatCurrency(comparisonData.summary.totalChange)} 
          change={versionComparisonUtils.formatPercentage(comparisonData.summary.changePercent)}
          trend={comparisonData.summary.totalChange > 0 ? 'up' : comparisonData.summary.totalChange < 0 ? 'down' : 'neutral'}
          icon={<DollarSign className="h-5 w-5" />} />
        <MetricCard title="Items Changed" value={comparisonData.differences.filter(d => d.status !== 'unchanged').length}
          description={`of ${comparisonData.summary.totalLines} total`} icon={<Activity className="h-5 w-5" />} />
        <MetricCard title="Items Added" value={comparisonData.summary.addedCount} icon={<Plus className="h-5 w-5" />} />
        <MetricCard title="Items Removed" value={comparisonData.summary.removedCount} icon={<Minus className="h-5 w-5" />} />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Version {selectedVersion1} Total:</span>
                <span>{versionComparisonUtils.formatCurrency(comparisonData.summary.v1Total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Version {selectedVersion2} Total:</span>
                <span>{versionComparisonUtils.formatCurrency(comparisonData.summary.v2Total)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Net Change:</span>
                <span className={cn(
                  comparisonData.summary.totalChange > 0 ? 'text-red-600' : 
                  comparisonData.summary.totalChange < 0 ? 'text-green-600' : 'text-gray-600'
                )}>
                  {versionComparisonUtils.formatCurrency(comparisonData.summary.totalChange)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cost Line</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">V{selectedVersion1}</TableHead>
                <TableHead className="text-right">V{selectedVersion2}</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDifferences.map((diff) => (
                <TableRow key={diff.id}>
                  <TableCell className="font-medium">{diff.costLineName}</TableCell>
                  <TableCell>{diff.category}</TableCell>
                  <TableCell className="text-right">{versionComparisonUtils.formatCurrency(diff.v1Amount)}</TableCell>
                  <TableCell className="text-right">{versionComparisonUtils.formatCurrency(diff.v2Amount)}</TableCell>
                  <TableCell className={cn("text-right font-medium", 
                    diff.change > 0 ? 'text-red-600' : diff.change < 0 ? 'text-green-600' : 'text-gray-600'
                  )}>
                    {diff.change > 0 ? '+' : ''}{versionComparisonUtils.formatCurrency(diff.change)}
                  </TableCell>
                  <TableCell className="text-right">{versionComparisonUtils.formatPercentage(diff.changePercent)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      diff.status === 'added' && 'border-blue-600 text-blue-600',
                      diff.status === 'removed' && 'border-red-600 text-red-600',
                      diff.status === 'increased' && 'border-orange-600 text-orange-600',
                      diff.status === 'decreased' && 'border-green-600 text-green-600',
                      diff.status === 'unchanged' && 'border-gray-400 text-gray-600'
                    )}>
                      {diff.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          <WaterfallChart data={waterfallData} />
          <CategoryComparisonChart data={categoryChartData} />
          <VarianceInsights data={varianceData} />
        </TabsContent>
      </Tabs>
    </div>
  )
  
  const Wrapper = mode === 'dialog' ? Dialog : Sheet
  const Content = mode === 'dialog' ? DialogContent : SheetContent
  const Header = mode === 'dialog' ? DialogHeader : SheetHeader
  const Title = mode === 'dialog' ? DialogTitle : SheetTitle
  const Desc = mode === 'dialog' ? DialogDescription : SheetDescription
  
  return (
    <Wrapper open={isOpen} onOpenChange={onClose}>
      <Content 
        className={mode === 'dialog' ? "max-w-[90vw] max-h-[90vh] overflow-y-auto" : "w-full sm:w-[90%] sm:max-w-[1400px] overflow-y-auto"}
        {...(mode === 'sheet' && { side: "right" as const })}
      >
        <Header>
          <Title>Version Comparison - {projectName}</Title>
          <Desc>Comparing Version {selectedVersion1} vs Version {selectedVersion2}</Desc>
        </Header>
        {content}
      </Content>
    </Wrapper>
  )
}
