import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface EntryStatusIndicatorProps {
  id: string
  modified?: boolean
  saving?: boolean
  error?: boolean | string
}

// Standardized status configuration
const STATUS_CONFIG = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
    label: 'Pending'
  },
  saved: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle,
    label: 'Saved'
  },
  error: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
    label: 'Error'
  },
  syncing: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: RefreshCw,
    label: 'Syncing'
  },
  staged: {
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: AlertCircle,
    label: 'Staged'
  },
  modified: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: AlertCircle,
    label: 'Modified'
  }
}

export function EntryStatusIndicator({ 
  id, 
  modified = false, 
  saving = false,
  error = false
}: EntryStatusIndicatorProps) {
  const isStaged = id?.startsWith('temp_')
  
  // Determine current status
  let status = 'saved'
  if (error) {
    status = 'error'
  } else if (saving) {
    status = 'syncing'
  } else if (isStaged) {
    status = 'staged'
  } else if (modified) {
    status = 'modified'
  }
  
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
  const Icon = config.icon
  const errorMessage = typeof error === 'string' ? error : config.label
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.color,
        saving && "animate-pulse",
        "transition-all duration-200"
      )}
      title={status === 'error' && typeof error === 'string' ? error : undefined}
    >
      <Icon className={cn(
        "w-3 h-3 mr-1",
        status === 'syncing' && "animate-spin"
      )} />
      {status === 'error' && typeof error === 'string' ? 'Error' : config.label}
    </Badge>
  )
}