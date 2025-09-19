import { AlertCircle, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UnsavedChangesBarProps {
  count: number
  onSave: () => void
  onDiscard: () => void
}

export function UnsavedChangesBar({ 
  count, 
  onSave, 
  onDiscard 
}: UnsavedChangesBarProps) {
  if (count === 0) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-100 border-2 border-amber-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">
            {count} unsaved {count === 1 ? 'change' : 'changes'}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Your changes will be lost if you leave
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button 
          size="sm" 
          onClick={onSave}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          <Save className="w-3 h-3 mr-1" />
          Save All
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={onDiscard}
          className="flex-1"
        >
          <X className="w-3 h-3 mr-1" />
          Discard
        </Button>
      </div>
    </div>
  )
}