import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle } from "lucide-react"

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  _modified?: boolean
  _tempId?: string
}

interface BudgetReviewStepProps {
  costs: CostBreakdown[]
  projectName: string
}

export function BudgetReviewStep({ costs, projectName }: BudgetReviewStepProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTotalBudget = () => {
    return costs.reduce((sum, cost) => sum + cost.budget_cost, 0)
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Review the current budget before making modifications. This will be your baseline for the forecast.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(getTotalBudget())}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Line Items</p>
              <p className="text-2xl font-bold">{costs.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-2xl font-bold">Current</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cost Line</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell>{cost.cost_line}</TableCell>
                <TableCell>{cost.spend_type}</TableCell>
                <TableCell>{cost.spend_sub_category}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(cost.budget_cost)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
