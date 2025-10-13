/**
 * PLCommandCenter - Smart Cell
 * 
 * Self-contained Cell that fetches P&L metrics and timeline via tRPC
 * and displays comprehensive P&L analysis with gap visualization.
 */
'use client';

import React, { useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Activity,
  Calendar,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePLCommandCenterStore } from './state';

interface PLCommandCenterProps {
  projectId: string;
  onViewGapAnalysis?: () => void;
}

/**
 * Format currency with appropriate compaction
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: value > 1000000 ? 'compact' : 'standard'
  }).format(value);
}

/**
 * Format date as short month/day
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PLCommandCenter({ projectId, onViewGapAnalysis }: PLCommandCenterProps) {
  console.log('[PLCommandCenter] Component rendering with projectId:', projectId);
  
  const { isLive, toggleLive } = usePLCommandCenterStore();

  // Stabilize date range to prevent infinite re-renders
  const dateRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - 6);
    from.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const to = new Date(now);
    to.setMonth(to.getMonth() + 6);
    to.setHours(23, 59, 59, 999); // Normalize to end of day
    
    return { 
      from: from.toISOString(),  // Convert to ISO string for HTTP serialization
      to: to.toISOString()       // Convert to ISO string for HTTP serialization
    };
  }, []);

  // BA-001, BA-002, BA-003, BA-004: Fetch P&L metrics via tRPC
  const { data: plData, isLoading: plLoading, error: plError, status: plStatus } = trpc.dashboard.getPLMetrics.useQuery(
    { projectId },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );
  
  console.log('[PLCommandCenter] getPLMetrics:', { plLoading, plStatus, plError, hasData: !!plData, plData });

  // BA-006, BA-007, BA-008: Fetch monthly timeline
  const { data: timelineData, isLoading: timelineLoading, error: timelineError, status: timelineStatus } = trpc.dashboard.getPLTimeline.useQuery(
    {
      projectId,
      dateRange,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );
  
  console.log('[PLCommandCenter] getPLTimeline:', { timelineLoading, timelineStatus, timelineError, hasData: !!timelineData, timelineData });

  // Fetch promise dates for next P&L hits
  const { data: promiseDatesData, isLoading: promiseDatesLoading, error: promiseDatesError, status: promiseDatesStatus } = trpc.dashboard.getPromiseDates.useQuery(
    { projectId },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );
  
  console.log('[PLCommandCenter] getPromiseDates:', { promiseDatesLoading, promiseDatesStatus, promiseDatesError, hasData: !!promiseDatesData, promiseDatesData });

  // Debug logging
  console.log('PLCommandCenter Debug:', {
    projectId,
    plLoading,
    timelineLoading,
    promiseDatesLoading,
    plError: plError?.message,
    timelineError: timelineError?.message,
    promiseDatesError: promiseDatesError?.message,
    plData,
    timelineData,
    promiseDatesData,
  });

  // Pulse animation for live indicator
  useEffect(() => {
    const interval = setInterval(() => {
      toggleLive();
    }, 2000);
    return () => clearInterval(interval);
  }, [toggleLive]);

  // BA-010: Loading state
  if (plLoading || timelineLoading || promiseDatesLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              P&L COMMAND CENTER
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" role="status">
              <span className="sr-only">Loading P&L metrics...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (plError || !plData) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load P&L metrics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // BA-002, BA-003: Calculate percentages
  const budget = plData.totalBudget;
  const committed = plData.totalCommitted;
  const plImpact = plData.actualPLImpact;
  const plGap = plData.plGap;

  const committedPercent = budget > 0 ? (committed / budget) * 100 : 0;
  const plPercent = budget > 0 ? (plImpact / budget) * 100 : 0;

  // BA-006: Get monthly breakdown (up to 6 months)
  const monthlyBreakdown = (timelineData || []).slice(0, 6).map(entry => ({
    month: entry.month,
    actual: entry.actualPL,
    projected: entry.projectedPL,
  }));

  return (
    <Card className="w-full border-2 border-blue-100 shadow-xl" aria-label="P&L Command Center">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
            P&L COMMAND CENTER
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1",
              isLive ? "border-green-500 text-green-600" : "border-gray-400"
            )}
          >
            <Zap className="h-3 w-3" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Financial Reality Check Section */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">FINANCIAL REALITY CHECK</h3>
          
          {/* BA-001: Budget Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">APPROVED BUDGET</span>
              <span className="text-lg font-bold">{formatCurrency(budget)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                style={{ width: '100%' }}
                data-testid="budget-bar"
              />
            </div>
          </div>

          {/* BA-002: Total PO Value Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">TOTAL PO VALUE</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{formatCurrency(committed)}</span>
                <Badge variant="secondary">{committedPercent.toFixed(1)}%</Badge>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(committedPercent, 100)}%` }}
                data-testid="committed-bar"
              />
            </div>
            {/* BA-005: Gap indicator shows when plGap > 0 */}
            {plGap > 0 && (
              <div className="flex items-center gap-2 mt-2 text-sm text-amber-600" data-testid="gap-indicator">
                <AlertCircle className="h-4 w-4" />
                <span>Open PO (Not Yet Invoiced): {formatCurrency(plGap)}</span>
              </div>
            )}
          </div>

          {/* BA-003: Actual Cost Impact Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">ACTUAL COST (Invoiced)</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">{formatCurrency(plImpact)}</span>
                <Badge variant="outline" className="border-green-500 text-green-600">
                  {plPercent.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(plPercent, 100)}%` }}
                data-testid="pl-impact-bar"
              />
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <Activity className="h-4 w-4" />
              <span>Actual costs in books</span>
            </div>
          </div>
        </div>

        {/* BA-006, BA-007, BA-008: Monthly Cost Timeline */}
        {monthlyBreakdown && monthlyBreakdown.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200" data-testid="monthly-breakdown">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Monthly Cost Breakdown - When Costs Hit
            </h4>
            <div className="grid grid-cols-6 gap-2">
              {monthlyBreakdown.map((month, idx) => {
                const hasActual = month.actual > 0;
                const hasProjected = month.projected > 0;
                
                return (
                  <div key={idx} className="text-center">
                    <div className="text-xs font-medium text-gray-600 mb-1">{month.month}</div>
                    <div className="space-y-1">
                      {/* BA-007: Actual costs render as green bars */}
                      {hasActual && (
                        <div className="bg-green-500 rounded px-1 py-0.5" data-testid="actual-bar">
                          <div className="text-xs text-white font-medium">
                            {formatCurrency(month.actual)}
                          </div>
                        </div>
                      )}
                      {/* BA-008: Projected costs render as amber bars with opacity */}
                      {hasProjected && (
                        <div className="bg-amber-400 rounded px-1 py-0.5 opacity-75" data-testid="projected-bar">
                          <div className="text-xs text-white font-medium">
                            +{formatCurrency(month.projected)}
                          </div>
                        </div>
                      )}
                      {!hasActual && !hasProjected && (
                        <div className="text-xs text-gray-400">-</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600">Actual (Invoiced)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-400 rounded opacity-75" />
                <span className="text-gray-600">Expected (Promise Dates)</span>
              </div>
            </div>
          </div>
        )}

        {/* BA-004: P&L Gap Analysis */}
        {plGap > 0 && (
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200" data-testid="gap-analysis">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-amber-900">P&L Gap Analysis</div>
                  <div className="text-sm text-amber-700">
                    {((plGap / committed) * 100).toFixed(1)}% of committed spend hasn&apos;t hit P&L
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-900">{formatCurrency(plGap)}</div>
                <div className="text-xs text-amber-600">Future P&L Impact</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
