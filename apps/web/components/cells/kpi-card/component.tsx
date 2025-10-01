/**
 * KPICard - Smart KPI Card Cell
 * 
 * A self-contained Cell that fetches budget metrics via tRPC
 * and displays them with variance indicators.
 * 
 * This is a SMART component (fetches its own data).
 */
'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface KPICardProps {
  projectId: string;
}

/**
 * Format number as currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format number as percentage
 */
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get variance color and indicator
 */
function getVarianceStyle(variance: number) {
  if (variance > 0) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: TrendingUp,
      label: 'Under Budget',
    };
  } else if (variance < 0) {
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: TrendingDown,
      label: 'Over Budget',
    };
  } else {
    return {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      icon: DollarSign,
      label: 'On Budget',
    };
  }
}

export function KPICard({ projectId }: KPICardProps) {
  // BA-001: Fetch project metrics via tRPC
  const { data, isLoading, error } = trpc.dashboard.getKPIMetrics.useQuery({
    projectId,
  });

  // BA-005: Loading state shows Skeleton
  if (isLoading) {
    return (
      <Card aria-label="Budget KPI Card Loading">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[120px] mb-2" />
          <Skeleton className="h-4 w-[150px] mb-2" />
          <Skeleton className="h-6 w-[100px]" />
        </CardContent>
      </Card>
    );
  }

  // BA-006: Error state shows Alert component
  if (error) {
    return (
      <Alert variant="destructive" aria-label="Budget KPI Card Error">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load KPI metrics</AlertTitle>
        <AlertDescription>
          {error.message || 'Unable to fetch budget data. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  // No data (shouldn't happen if query succeeds, but handle gracefully)
  if (!data) {
    return (
      <Alert aria-label="Budget KPI Card No Data">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>
          Budget metrics are not available for this project.
        </AlertDescription>
      </Alert>
    );
  }

  // BA-003: Variance already calculated by API
  // Get variance styling
  const varianceStyle = getVarianceStyle(data.variance);
  const VarianceIcon = varianceStyle.icon;

  return (
    <Card 
      className="hover:shadow-md transition-shadow"
      aria-label="Budget KPI Card with Variance Indicator"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Budget Overview
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* BA-002: Budget total with currency formatting */}
        <div className="text-2xl font-bold" data-testid="budget-total">
          {formatCurrency(data.budgetTotal)}
        </div>
        
        {/* Committed amount */}
        <p className="text-xs text-muted-foreground mt-1">
          Committed: <span className="font-medium">{formatCurrency(data.committed)}</span>
        </p>
        
        {/* BA-004: Variance indicator with color coding */}
        <div 
          className={`flex items-center gap-2 mt-3 p-2 rounded-md ${varianceStyle.bgColor}`}
          data-testid="variance-indicator"
          aria-label={`${varianceStyle.label}: ${formatCurrency(Math.abs(data.variance))}`}
        >
          <VarianceIcon className={`h-4 w-4 ${varianceStyle.color}`} />
          <div className="flex-1">
            <div className={`text-sm font-semibold ${varianceStyle.color}`}>
              {formatCurrency(Math.abs(data.variance))}
            </div>
            <div className="text-xs text-muted-foreground">
              {varianceStyle.label} ({formatPercent(Math.abs(data.variancePercent))})
            </div>
          </div>
          <Badge 
            variant={data.variance > 0 ? 'default' : 'destructive'}
            className={data.variance > 0 ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
          >
            {data.variance > 0 ? '+' : ''}{formatPercent(data.variancePercent)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
