import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"

interface ReasonStepProps {
  reason: string
  onReasonChange: (value: string) => void
  changeSummary: {
    modifiedCount: number
    newEntriesCount: number
    excludedCount: number
    totalChange: number
    changePercentage: number
  }
}

export function ReasonStep({
  reason,
  onReasonChange,
  changeSummary,
}: ReasonStepProps) {
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
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Provide a clear reason for this forecast. This will be stored with the version for future reference.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Forecast</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Explain the business rationale for these changes..."
          className="min-h-[200px]"
        />
        <p className="text-xs text-muted-foreground">
          Be specific about what drove these changes (e.g., "Q3 market conditions require
          additional equipment maintenance budget")
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Change Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Items Modified</dt>
              <dd className="font-semibold">{changeSummary.modifiedCount} existing</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Items Added</dt>
              <dd className="font-semibold">{changeSummary.newEntriesCount} new</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Items Excluded</dt>
              <dd className="font-semibold">{changeSummary.excludedCount} excluded</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total Change</dt>
              <dd className="font-semibold">
                {changeSummary.totalChange > 0 ? "+" : ""}
                {formatCurrency(changeSummary.totalChange)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Change %</dt>
              <dd className="font-semibold">
                {changeSummary.changePercentage > 0 ? "+" : ""}
                {changeSummary.changePercentage.toFixed(1)}%
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
