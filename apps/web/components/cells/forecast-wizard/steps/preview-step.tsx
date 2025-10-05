import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calculator, TrendingUp, TrendingDown } from "lucide-react"

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
}

interface PreviewStepProps {
  currentCosts: CostBreakdown[]
  forecastChanges: Record<string, number | null>
  newEntries: CostBreakdown[]
  reason: string
  totals: {
    currentTotal: number
    forecastTotal: number
    totalChange: number
    changePercentage: number
  }
}

export function PreviewStep({
  currentCosts,
  forecastChanges,
  newEntries,
  reason,
  totals,
}: PreviewStepProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Calculator className="h-4 w-4" />
        <AlertDescription>
          Review all changes before saving. This will create a new forecast version.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Summary</CardTitle>
          <CardDescription>{reason}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Before</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total Budget</dt>
                  <dd>{formatCurrency(totals.currentTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Line Items</dt>
                  <dd>{currentCosts.length}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-semibold mb-2">After</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total Forecast</dt>
                  <dd className="font-semibold">{formatCurrency(totals.forecastTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Line Items</dt>
                  <dd className="font-semibold">
                    {currentCosts.length + newEntries.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {totals.totalChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="font-semibold">Total Change:</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-bold ${
                    totals.totalChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totals.totalChange > 0 ? "+" : ""}
                  {formatCurrency(totals.totalChange)}
                </span>
                <Badge variant="outline">
                  {totals.changePercentage > 0 ? "+" : ""}
                  {totals.changePercentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(forecastChanges).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Modified Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {Object.entries(forecastChanges).map(([costId, newValue]) => {
                  const cost = currentCosts.find((c) => c.id === costId)
                  if (!cost) return null
                  
                  // Handle excluded entries (newValue === null)
                  if (newValue === null) {
                    return (
                      <div
                        key={costId}
                        className="flex justify-between items-center text-sm py-1 opacity-60"
                      >
                        <span className="text-muted-foreground">
                          {cost.cost_line} - {cost.spend_sub_category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through">
                            {formatCurrency(cost.budget_cost)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Excluded
                          </Badge>
                        </div>
                      </div>
                    )
                  }
                  
                  const change = newValue - cost.budget_cost
                  return (
                    <div
                      key={costId}
                      className="flex justify-between items-center text-sm py-1"
                    >
                      <span className="text-muted-foreground">
                        {cost.cost_line} - {cost.spend_sub_category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {formatCurrency(cost.budget_cost)}
                        </span>
                        <span>→</span>
                        <span className="font-semibold">
                          {formatCurrency(newValue)}
                        </span>
                        <Badge
                          variant={change > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {change > 0 ? "+" : ""}
                          {formatCurrency(change)}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {newEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {newEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center text-sm py-1"
                  >
                    <span className="text-muted-foreground">
                      {entry.cost_line} - {entry.spend_sub_category}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(entry.budget_cost)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
