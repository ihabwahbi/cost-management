import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface ConfirmStepProps {
  isSaving: boolean
  totalChanges: number
  totalForecast: number
  totalChange: number
  changePercentage: number
  reason: string
}

export function ConfirmStep({
  isSaving,
  totalChanges,
  totalForecast,
  totalChange,
  changePercentage,
  reason,
}: ConfirmStepProps) {
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
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Your forecast is ready to be saved. This will create a new version that can be
          reviewed and compared with previous versions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ready to Save Forecast</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Version will be created with {totalChanges} changes
              </p>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Total:</span>
                <span className="font-semibold">
                  {formatCurrency(totalForecast)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Change:</span>
                <span
                  className={`font-semibold ${
                    totalChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totalChange > 0 ? "+" : ""}
                  {formatCurrency(totalChange)} ({changePercentage > 0 ? "+" : ""}
                  {changePercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reason:</span>
                <span className="font-semibold text-right max-w-[200px] truncate">
                  {reason}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
