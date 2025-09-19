import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

interface EntryStatusIndicatorProps {
  id: string
  modified?: boolean
  saving?: boolean
}

export function EntryStatusIndicator({ 
  id, 
  modified = false, 
  saving = false 
}: EntryStatusIndicatorProps) {
  const isStaged = id?.startsWith('temp_')
  
  if (saving) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 animate-pulse">
        <Clock className="w-3 h-3 mr-1" />
        Saving...
      </Badge>
    )
  }
  
  if (isStaged) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
        <AlertCircle className="w-3 h-3 mr-1" />
        Staged
      </Badge>
    )
  }
  
  if (modified) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        <AlertCircle className="w-3 h-3 mr-1" />
        Modified
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
      <CheckCircle className="w-3 h-3 mr-1" />
      Saved
    </Badge>
  )
}