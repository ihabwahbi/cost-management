import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface ChangeSummaryFooterProps {
  modifiedCount: number
  newEntriesCount: number
  excludedCount?: number
  totalChange: number
  changePercentage: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function ChangeSummaryFooter({
  modifiedCount,
  newEntriesCount,
  excludedCount = 0,
  totalChange,
  changePercentage,
}: ChangeSummaryFooterProps) {
  const totalModifications = modifiedCount + newEntriesCount + excludedCount

  const getBreakdownText = () => {
    const parts = []
    if (modifiedCount > 0) parts.push(`${modifiedCount} modified`)
    if (newEntriesCount > 0) parts.push(`${newEntriesCount} new`)
    if (excludedCount > 0) parts.push(`${excludedCount} excluded`)
    return parts.length > 0 ? `(${parts.join(', ')})` : ''
  }

  return (
    <Card className="bg-gray-50">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Total Changes: {totalModifications} items
            {totalModifications > 0 && (
              <span className="ml-2">
                {getBreakdownText()}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {totalChange !== 0 && (
              <>
                <span className="text-sm text-muted-foreground">Change:</span>
                <Badge
                  variant={totalChange > 0 ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {totalChange > 0 ? '+' : ''}
                  {formatCurrency(totalChange)}
                  <span className="ml-1">
                    ({changePercentage > 0 ? '+' : ''}
                    {changePercentage.toFixed(1)}%)
                  </span>
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
