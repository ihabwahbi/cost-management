import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Eye } from "lucide-react"

interface SuccessStepProps {
  versionNumber: number
  onClose: () => void
  onViewVersion?: () => void
}

export function SuccessStep({
  versionNumber,
  onClose,
  onViewVersion,
}: SuccessStepProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-600">Success!</h3>
              <p className="text-muted-foreground mt-2">
                Forecast version {versionNumber} has been created successfully
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-4">
              {onViewVersion && (
                <Button onClick={onViewVersion} variant="default">
                  <Eye className="w-4 h-4 mr-2" />
                  View Version
                </Button>
              )}
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
