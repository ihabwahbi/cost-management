'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProjectAlert {
  id: string
  type: 'budget_exceeded' | 'unusual_activity' | 'forecast_deviation' | 'positive_variance'
  severity: 'info' | 'warning' | 'critical' | 'success'
  title: string
  message: string
  actionRequired: boolean
  action?: () => void
  actionLabel?: string
}

interface ProjectMetrics {
  totalBudget: number
  actualSpend: number
  variance: number
  variancePercent: number
  utilization: number
  invoicedAmount: number
  openOrders: number
  burnRate: number
  poCount: number
  lineItemCount: number
}

interface ProjectAlertsProps {
  projectId: string
  metrics: ProjectMetrics | null
}

export function ProjectAlerts({ projectId, metrics }: ProjectAlertsProps) {
  const [alerts, setAlerts] = useState<ProjectAlert[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (metrics) {
      checkAlerts()
    }
  }, [projectId, metrics])

  const checkAlerts = () => {
    if (!metrics) return
    
    const newAlerts: ProjectAlert[] = []

    // Check budget overrun
    if (metrics.utilization > 100) {
      newAlerts.push({
        id: 'budget-overrun',
        type: 'budget_exceeded',
        severity: 'critical',
        title: 'Budget Exceeded',
        message: `Project is ${(metrics.utilization - 100).toFixed(1)}% over budget. Immediate action required.`,
        actionRequired: true,
        actionLabel: 'Review Spending',
        action: () => console.log('Navigate to spending details')
      })
    }
    // Check high utilization
    else if (metrics.utilization > 90) {
      newAlerts.push({
        id: 'high-utilization',
        type: 'unusual_activity',
        severity: 'warning',
        title: 'High Budget Utilization',
        message: `${metrics.utilization.toFixed(1)}% of budget consumed. Consider reviewing upcoming expenses.`,
        actionRequired: false
      })
    }
    // Check if approaching budget limit
    else if (metrics.utilization > 75) {
      newAlerts.push({
        id: 'approaching-limit',
        type: 'unusual_activity',
        severity: 'info',
        title: 'Approaching Budget Limit',
        message: `${metrics.utilization.toFixed(1)}% of budget used. Monitor spending closely.`,
        actionRequired: false
      })
    }

    // Check positive variance
    if (metrics.variancePercent > 20) {
      newAlerts.push({
        id: 'positive-variance',
        type: 'positive_variance',
        severity: 'success',
        title: 'Under Budget',
        message: `Project is ${metrics.variancePercent.toFixed(1)}% under budget. Good cost management!`,
        actionRequired: false
      })
    }

    // Check high burn rate
    const remainingBudget = metrics.totalBudget - metrics.actualSpend
    const monthsAtCurrentRate = remainingBudget / metrics.burnRate
    if (monthsAtCurrentRate < 3 && monthsAtCurrentRate > 0) {
      newAlerts.push({
        id: 'high-burn-rate',
        type: 'forecast_deviation',
        severity: 'warning',
        title: 'High Burn Rate',
        message: `At current spending rate, budget will be exhausted in ${monthsAtCurrentRate.toFixed(1)} months.`,
        actionRequired: true,
        actionLabel: 'Adjust Forecast',
        action: () => console.log('Navigate to forecast')
      })
    }

    // Check for large open orders
    const openOrdersPercent = metrics.totalBudget > 0 ? (metrics.openOrders / metrics.totalBudget) * 100 : 0
    if (openOrdersPercent > 30) {
      newAlerts.push({
        id: 'large-open-orders',
        type: 'unusual_activity',
        severity: 'info',
        title: 'Significant Open Orders',
        message: `${openOrdersPercent.toFixed(1)}% of budget is in open orders awaiting invoicing.`,
        actionRequired: false
      })
    }

    // Filter out dismissed alerts
    setAlerts(newAlerts.filter(alert => !dismissed.has(alert.id)))
  }

  const dismissAlert = (alertId: string) => {
    setDismissed(prev => new Set(prev).add(alertId))
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const getIcon = (severity: string) => {
    switch(severity) {
      case 'critical': return <AlertCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'success': return <CheckCircle className="h-4 w-4" />
      default: return <TrendingUp className="h-4 w-4" />
    }
  }

  const getAlertVariant = (severity: string): "default" | "destructive" => {
    return severity === 'critical' ? 'destructive' : 'default'
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <Alert key={alert.id} variant={getAlertVariant(alert.severity)} className="relative">
          <div className="flex items-start gap-2">
            {getIcon(alert.severity)}
            <div className="flex-1">
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription className="mt-2">
                {alert.message}
                {alert.actionRequired && alert.action && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 mr-2"
                    onClick={alert.action}
                  >
                    {alert.actionLabel}
                  </Button>
                )}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => dismissAlert(alert.id)}
            >
              ×
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  )
}