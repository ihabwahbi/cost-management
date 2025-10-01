'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface DebugPanelProps {
  metrics: any
  plMetrics: any
  plTimeline: any[]
  promiseDates: any[]
  categoryData?: any[]
  breakdownData?: any[]
  timelineData?: any[]
  subcategoryData?: any[]
}

export function DebugPanel({ 
  metrics, 
  plMetrics, 
  plTimeline, 
  promiseDates,
  categoryData = [],
  breakdownData = [],
  timelineData = [],
  subcategoryData = []
}: DebugPanelProps) {
  const formatCurrency = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <Card className="border-2 border-yellow-300 bg-yellow-50">
      <CardHeader className="bg-yellow-100">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Dashboard Debug Panel (Development Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Metrics from dashboard-metrics.ts */}
        <div>
          <h3 className="font-semibold text-sm mb-2">📊 Dashboard Metrics (calculateProjectMetrics)</h3>
          <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
            {metrics ? (
              <>
                <div>totalBudget: {formatCurrency(metrics.totalBudget)}</div>
                <div>actualSpend (Total Committed): {formatCurrency(metrics.actualSpend)}</div>
                <div>invoicedAmount (P&L Impact): {formatCurrency(metrics.invoicedAmount)}</div>
                <div>openOrders (Future P&L): {formatCurrency(metrics.openOrders)}</div>
                <div>variance: {formatCurrency(metrics.variance)}</div>
                <div>utilization: {metrics.utilization?.toFixed(1)}%</div>
                <div>poCount: {metrics.poCount}</div>
                <div>lineItemCount: {metrics.lineItemCount}</div>
              </>
            ) : (
              <div className="text-red-600">No metrics data</div>
            )}
          </div>
        </div>

        {/* Category Data */}
        <div>
          <h3 className="font-semibold text-sm mb-2">📁 Category Data (getCategoryBreakdown)</h3>
          <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
            {categoryData && categoryData.length > 0 ? (
              <>
                <div>Categories found: {categoryData.length}</div>
                {categoryData.slice(0, 3).map((cat: any, idx: number) => (
                  <div key={idx} className="ml-4">
                    {cat.name}: budget={formatCurrency(cat.budget)}, value={formatCurrency(cat.value)}
                  </div>
                ))}
                <div>Total category value: {formatCurrency(categoryData.reduce((sum: number, c: any) => sum + (c.value || 0), 0))}</div>
              </>
            ) : (
              <div className="text-red-600">No category data (this is why pie chart is empty)</div>
            )}
          </div>
        </div>

        {/* Breakdown Data */}
        <div>
          <h3 className="font-semibold text-sm mb-2">📋 Breakdown Data (getHierarchicalBreakdown)</h3>
          <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
            {breakdownData && breakdownData.length > 0 ? (
              <>
                <div>Business lines found: {breakdownData.length}</div>
                {breakdownData.slice(0, 2).map((bl: any, idx: number) => (
                  <div key={idx} className="ml-4">
                    <div>{bl.name}: {bl.children?.length || 0} cost lines</div>
                    {bl.children?.slice(0, 2).map((cl: any, idx2: number) => (
                      <div key={idx2} className="ml-8">
                        {cl.name}: {cl.children?.length || 0} spend types
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-red-600">No breakdown data (this is why cost table is empty)</div>
            )}
          </div>
        </div>

        {/* Timeline Data */}
        <div>
          <h3 className="font-semibold text-sm mb-2">📈 Timeline Data (getTimelineData)</h3>
          <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
            {timelineData && timelineData.length > 0 ? (
              <>
                <div>Timeline months: {timelineData.length}</div>
                {timelineData.slice(0, 3).map((month: any, idx: number) => (
                  <div key={idx} className="ml-4">
                    {month.month}: budget={formatCurrency(month.budget)}, actual={formatCurrency(month.actual)}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-red-600">No timeline data (Budget Timeline chart won't show)</div>
            )}
          </div>
        </div>

        {/* Subcategory Data */}
        <div>
          <h3 className="font-semibold text-sm mb-2">📂 Subcategory Data</h3>
          <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
            {subcategoryData && subcategoryData.length > 0 ? (
              <>
                <div>Subcategories found: {subcategoryData.length}</div>
                {subcategoryData.slice(0, 3).map((sub: any, idx: number) => (
                  <div key={idx} className="ml-4">
                    {sub.category} / {sub.subcategory}: {formatCurrency(sub.value)}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-red-600">No subcategory data (subcategory chart won't show)</div>
            )}
          </div>
        </div>

        {/* P&L Metrics from pl-tracking-service.ts */}
        <div>
          <h3 className="font-semibold text-sm mb-2">💰 P&L Metrics (getProjectPLMetrics)</h3>
          <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
            {plMetrics ? (
              <>
                <div>totalBudget: {formatCurrency(plMetrics.totalBudget)}</div>
                <div>totalCommitted: {formatCurrency(plMetrics.totalCommitted)}</div>
                <div>actualPLImpact: {formatCurrency(plMetrics.actualPLImpact)}</div>
                <div>futurePLImpact: {formatCurrency(plMetrics.futurePLImpact)}</div>
                <div>plGap: {formatCurrency(plMetrics.plGap)}</div>
              </>
            ) : (
              <div className="text-red-600">No P&L metrics data</div>
            )}
          </div>
        </div>

        {/* P&L Timeline */}
        <div>
          <h3 className="font-semibold text-sm mb-2">📅 P&L Timeline (getPLImpactByMonth)</h3>
          <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
            {plTimeline && plTimeline.length > 0 ? (
              <>
                <div>Timeline entries: {plTimeline.length}</div>
                <div>First 3 months:</div>
                {plTimeline.slice(0, 3).map((entry: any, idx: number) => (
                  <div key={idx} className="ml-4">
                    {entry.month}: actual={formatCurrency(entry.actualPL)}, projected={formatCurrency(entry.projectedPL)}
                  </div>
                ))}
                <div>Total actual P&L: {formatCurrency(plTimeline.reduce((sum: number, e: any) => sum + (e.actualPL || 0), 0))}</div>
                <div>Total projected P&L: {formatCurrency(plTimeline.reduce((sum: number, e: any) => sum + (e.projectedPL || 0), 0))}</div>
              </>
            ) : (
              <div className="text-red-600">No timeline data</div>
            )}
          </div>
        </div>

        {/* Promise Dates */}
        <div>
          <h3 className="font-semibold text-sm mb-2">📦 Promise Dates (getOpenPOsByPromiseDate)</h3>
          <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
            {promiseDates && promiseDates.length > 0 ? (
              <>
                <div>Total promise dates: {promiseDates.length}</div>
                <div>First 3 dates:</div>
                {promiseDates.slice(0, 3).map((promise: any, idx: number) => (
                  <div key={idx} className="ml-4">
                    {promise.date}: {formatCurrency(promise.amount)}
                  </div>
                ))}
                <div>Total future P&L: {formatCurrency(promiseDates.reduce((sum: number, p: any) => sum + (p.amount || 0), 0))}</div>
              </>
            ) : (
              <div className="text-red-600">No promise date data</div>
            )}
          </div>
        </div>

        {/* Data Consistency Checks */}
        <div>
          <h3 className="font-semibold text-sm mb-2">✅ Data Consistency Checks</h3>
          <div className="bg-white p-3 rounded space-y-2">
            {metrics && plMetrics && (
              <>
                <div className="flex items-center gap-2">
                  {Math.abs(metrics.totalBudget - plMetrics.totalBudget) < 1 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-xs">Budget consistency</span>
                </div>
                <div className="flex items-center gap-2">
                  {Math.abs(metrics.actualSpend - plMetrics.totalCommitted) < 1 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-xs">Committed amount consistency</span>
                </div>
                <div className="flex items-center gap-2">
                  {Math.abs(metrics.invoicedAmount - plMetrics.actualPLImpact) < 1 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-xs">P&L impact consistency</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              {categoryData && categoryData.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs">Category data available for pie chart</span>
            </div>
            <div className="flex items-center gap-2">
              {breakdownData && breakdownData.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs">Breakdown data available for cost table</span>
            </div>
            <div className="flex items-center gap-2">
              {timelineData && timelineData.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs">Timeline data available for budget chart</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}