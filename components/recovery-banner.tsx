import { AlertCircle, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RecoveryBannerProps {
  onRestore: () => void
  onDismiss: () => void
  itemCount: number
}

export function RecoveryBanner({ 
  onRestore, 
  onDismiss, 
  itemCount 
}: RecoveryBannerProps) {
  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          Found {itemCount} unsaved {itemCount === 1 ? 'entry' : 'entries'} from your previous session
        </span>
        <div className="flex gap-2 ml-4">
          <Button 
            size="sm" 
            onClick={onRestore}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Restore
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onDismiss}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}