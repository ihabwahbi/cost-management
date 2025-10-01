// Type for entries that can be either NewCostEntry or CostBreakdown
type StagedEntry = {
  id?: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  _modified?: boolean
}

export interface BackupData {
  stagedEntries: { [projectId: string]: StagedEntry[] }
  timestamp: number
  version: string
}

const BACKUP_KEY = 'cost-management-backup'
const BACKUP_VERSION = '1.0.0'

export class LocalStorageService {
  static saveBackup(stagedEntries: { [projectId: string]: StagedEntry[] }): void {
    try {
      const backup: BackupData = {
        stagedEntries,
        timestamp: Date.now(),
        version: BACKUP_VERSION
      }
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    } catch (error) {
      console.error('Failed to save backup:', error)
    }
  }
  
  static loadBackup(): BackupData | null {
    try {
      const data = localStorage.getItem(BACKUP_KEY)
      if (!data) return null
      
      const backup = JSON.parse(data) as BackupData
      
      // Check if backup is recent (less than 24 hours old)
      const hoursSinceBackup = (Date.now() - backup.timestamp) / (1000 * 60 * 60)
      if (hoursSinceBackup > 24) {
        this.clearBackup()
        return null
      }
      
      // Check version compatibility
      if (backup.version !== BACKUP_VERSION) {
        console.warn('Backup version mismatch, discarding')
        this.clearBackup()
        return null
      }
      
      return backup
    } catch (error) {
      console.error('Failed to load backup:', error)
      return null
    }
  }
  
  static clearBackup(): void {
    try {
      localStorage.removeItem(BACKUP_KEY)
    } catch (error) {
      console.error('Failed to clear backup:', error)
    }
  }
  
  static hasBackup(): boolean {
    return localStorage.getItem(BACKUP_KEY) !== null
  }
}