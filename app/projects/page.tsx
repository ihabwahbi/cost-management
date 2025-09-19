"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { EntryStatusIndicator } from "@/components/entry-status-indicator"
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar"
import { ForecastWizard } from "@/components/forecast-wizard"
import { VersionHistoryTimeline } from "@/components/version-history-timeline"
import { useToast } from "@/hooks/use-toast"
import { LocalStorageService } from "@/lib/local-storage-service"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  name: string
  sub_business_line: string
  created_at: string
}

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  _modified?: boolean
}

interface ForecastVersion {
  id: string
  project_id: string
  version_number: number
  reason_for_change: string
  created_at: string
  created_by: string
}

interface NewCostEntry {
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
}

const SUB_BUSINESS_LINE_OPTIONS = ["WIS", "Drilling", "Production", "Facilities", "Subsea", "FPSO"]

const COST_LINE_OPTIONS = [
  "M&S", // Materials & Services
  "Services",
  "Equipment",
  "Labor",
  "Contractors",
  "Consumables",
]

const SPEND_TYPE_OPTIONS = ["Operational", "Maintenance", "Capital", "Emergency", "Planned"]

export default function ProjectsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [costBreakdowns, setCostBreakdowns] = useState<Record<string, CostBreakdown[]>>({})
  const [editingCost, setEditingCost] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<CostBreakdown | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savingCosts, setSavingCosts] = useState<Set<string>>(new Set())
  const [addingNewCost, setAddingNewCost] = useState<string | null>(null)
  const [newCostValues, setNewCostValues] = useState<NewCostEntry | null>(null)
  const [savingNewCost, setSavingNewCost] = useState(false)
  const [deletingCost, setDeletingCost] = useState<string | null>(null)

  const [isForecasting, setIsForecasting] = useState<string | null>(null) // Holds the projectId being forecasted
  const [forecastChanges, setForecastChanges] = useState<Record<string, number>>({}) // { costItemId: newValue }
  const [forecastReason, setForecastReason] = useState("")
  const [activeVersion, setActiveVersion] = useState<number | "latest">("latest")
  const [forecastVersions, setForecastVersions] = useState<Record<string, ForecastVersion[]>>({})
  const [savingForecast, setSavingForecast] = useState(false)

  const [hasInitialVersion, setHasInitialVersion] = useState<Record<string, boolean>>({})
  const [loadingVersionData, setLoadingVersionData] = useState<Record<string, boolean>>({})

  const [deletingProject, setDeletingProject] = useState<string | null>(null)
  const supabase = createClient()

  const [creatingNewProject, setCreatingNewProject] = useState(false)
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    sub_business_line: "",
  })
  const [savingNewProject, setSavingNewProject] = useState(false)

  const [forecastNewEntries, setForecastNewEntries] = useState<Set<string>>(new Set()) // Track new entries added during forecasting
  const [stagedNewEntries, setStagedNewEntries] = useState<{ [projectId: string]: any[] }>({}) // Using any[] as entries can be either NewCostEntry or CostBreakdown during different stages
  const [isInitialBudgetMode, setIsInitialBudgetMode] = useState<string | null>(null)
  const [unsavedChangesCount, setUnsavedChangesCount] = useState<{ [projectId: string]: number }>({})
  const [showForecastWizard, setShowForecastWizard] = useState<string | null>(null)

  // Helper function to get row class based on cost state
  const getRowClassName = (cost: CostBreakdown) => {
    const isStaged = cost.id?.startsWith('temp_')
    const isModified = cost._modified
    
    let className = "hover:bg-gray-50"
    
    if (isStaged) {
      className += " bg-amber-50/50 border-l-4 border-l-amber-500"
    } else if (isModified) {
      className += " bg-blue-50/50 border-l-4 border-l-blue-500"
    }
    
    return className
  }

  // Retry utility function for transient failures
  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        if (i === maxRetries - 1) throw error

        console.log(`Retry attempt ${i + 1} of ${maxRetries} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retries exceeded')
  }

  // Validation function to catch temporary fields before database operations
  const validateDatabaseEntry = (entry: any): void => {
    // Check for temporary fields that shouldn't go to database
    const invalidFields: string[] = []

    if ('id' in entry && typeof entry.id === 'string' && entry.id.startsWith('temp_')) {
      invalidFields.push('id (temporary)')
    }

    if ('_tempId' in entry) {
      invalidFields.push('_tempId')
    }

    // Check for any fields starting with underscore (convention for temporary)
    Object.keys(entry).forEach(key => {
      if (key.startsWith('_')) {
        invalidFields.push(key)
      }
    })

    if (invalidFields.length > 0) {
      console.error('Invalid fields detected in database entry:', invalidFields)
      console.error('Entry:', entry)
      throw new Error(`Cannot save entry with temporary fields: ${invalidFields.join(', ')}`)
    }

    // Validate required fields
    const requiredFields = ['project_id', 'sub_business_line', 'cost_line', 'spend_type', 'spend_sub_category']
    const missingFields = requiredFields.filter(field => !entry[field] || entry[field] === '')

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }
  }

  // Cleanup utility function to remove temporary fields before database operations
  const cleanEntryForDatabase = (entry: any, projectId: string): any => {
    // Remove all temporary fields
    const { id, _tempId, ...cleanEntry } = entry

    // Ensure all required fields have proper values
    const finalEntry = {
      project_id: cleanEntry.project_id || projectId,
      sub_business_line: cleanEntry.sub_business_line || '',
      cost_line: cleanEntry.cost_line || '',
      spend_type: cleanEntry.spend_type || '',
      spend_sub_category: cleanEntry.spend_sub_category || '',
      budget_cost: typeof cleanEntry.budget_cost === 'number'
        ? cleanEntry.budget_cost
        : parseFloat(cleanEntry.budget_cost) || 0
    }

    // Validate before returning
    validateDatabaseEntry(finalEntry)

    return finalEntry
  }

  // Helper function to calculate unsaved changes
  const calculateUnsavedChanges = (projectId: string) => {
    const stagedCount = stagedNewEntries[projectId]?.length || 0
    const modifiedCount = costBreakdowns[projectId]?.filter(c => c._modified).length || 0
    return stagedCount + modifiedCount
  }

  // Update unsaved changes count whenever staged entries or modifications change
  useEffect(() => {
    const counts: { [projectId: string]: number } = {}
    projects.forEach(project => {
      counts[project.id] = calculateUnsavedChanges(project.id)
    })
    setUnsavedChangesCount(counts)
  }, [stagedNewEntries, costBreakdowns, projects])

  // Auto-save to localStorage
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (Object.keys(stagedNewEntries).some(k => stagedNewEntries[k].length > 0)) {
        LocalStorageService.saveBackup(stagedNewEntries)
        console.log('Auto-saved to localStorage')
      }
    }, 5000) // Save every 5 seconds when there are changes
    
    return () => clearTimeout(saveTimer)
  }, [stagedNewEntries])

  // Recovery on mount
  useEffect(() => {
    const backup = LocalStorageService.loadBackup()
    if (backup && backup.stagedEntries) {
      const hasData = Object.keys(backup.stagedEntries).some(
        k => backup.stagedEntries[k].length > 0
      )
      
      if (hasData) {
        toast({
          title: "Recovery Available",
          description: "Unsaved changes were recovered from your last session",
          action: (
            <Button
              size="sm"
              onClick={() => {
                setStagedNewEntries(backup.stagedEntries)
                // Also restore to display state
                Object.entries(backup.stagedEntries).forEach(([projectId, entries]) => {
                  setCostBreakdowns(prev => ({
                    ...prev,
                    [projectId]: [...(prev[projectId] || []), ...(entries as CostBreakdown[])]
                  }))
                })
              }}
            >
              Restore
            </Button>
          ),
        })
      }
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        variant: "destructive",
        title: "Failed to Load Projects",
        description: "Unable to load projects. Please refresh the page.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCostBreakdown = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("cost_breakdown")
        .select("*")
        .eq("project_id", projectId)
        .order("spend_sub_category")

      if (error) throw error

      setCostBreakdowns((prev) => ({
        ...prev,
        [projectId]: data || [],
      }))
    } catch (error) {
      console.error("Error loading cost breakdown:", error)
      toast({
        variant: "destructive",
        title: "Failed to Load Cost Breakdown",
        description: "Unable to load cost details. Please try again.",
      })
    }
  }

  const loadVersionCostBreakdown = async (projectId: string, versionNumber: number | "latest") => {
    setLoadingVersionData((prev) => ({ ...prev, [projectId]: true }))

    try {
      if (versionNumber === "latest") {
        // Find the actual latest version number
        const versions = forecastVersions[projectId] || []
        if (versions.length > 0) {
          // Get the highest version number
          const latestVersionNumber = Math.max(...versions.map((v) => v.version_number))
          // Load that version's data with proper joins
          const { data, error } = await supabase
            .from("budget_forecasts")
            .select(`
              *,
              cost_breakdown!inner(*),
              forecast_versions!inner(*)
            `)
            .eq("forecast_versions.project_id", projectId)
            .eq("forecast_versions.version_number", latestVersionNumber)
            .order("id")

          if (error) throw error

          // Transform the data to match the expected format
          const transformedData =
            data?.map((item: any) => ({
              ...item.cost_breakdown,
              budget_cost: item.forecasted_cost,
              forecast_id: item.id,
            })) || []

          setCostBreakdowns((prev) => ({
            ...prev,
            [projectId]: transformedData,
          }))
        } else {
          // No forecast versions exist, load original cost breakdown
          const { data, error } = await supabase
            .from("cost_breakdown")
            .select("*")
            .eq("project_id", projectId)
            .order("spend_sub_category")

          if (error) throw error

          setCostBreakdowns((prev) => ({
            ...prev,
            [projectId]: data || [],
          }))
        }
      } else {
        // Load specific version
        if (versionNumber === 0) {
          // Load original cost breakdown for version 0
          const { data, error } = await supabase
            .from("cost_breakdown")
            .select("*")
            .eq("project_id", projectId)
            .order("spend_sub_category")

          if (error) throw error

          setCostBreakdowns((prev) => ({
            ...prev,
            [projectId]: data || [],
          }))
        } else {
          // Load forecast version with proper joins
          const { data, error } = await supabase
            .from("budget_forecasts")
            .select(`
              *,
              cost_breakdown!inner(*),
              forecast_versions!inner(*)
            `)
            .eq("forecast_versions.project_id", projectId)
            .eq("forecast_versions.version_number", versionNumber)
            .order("id")

          if (error) throw error

          // Transform the data to match the expected format
          const transformedData =
            data?.map((item: any) => ({
              ...item.cost_breakdown,
              budget_cost: item.forecasted_cost,
              forecast_id: item.id,
            })) || []

          setCostBreakdowns((prev) => ({
            ...prev,
            [projectId]: transformedData,
          }))
        }
      }
    } catch (error) {
      console.error("Error loading version cost breakdown:", error)
    } finally {
      setLoadingVersionData((prev) => ({ ...prev, [projectId]: false }))
    }
  }

  const loadForecastVersions = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("forecast_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false })

      if (error) throw error

      setForecastVersions((prev) => ({
        ...prev,
        [projectId]: data || [],
      }))

      // Check if project has initial version (version 0)
      const hasVersion0 = data?.some((v) => v.version_number === 0)
      setHasInitialVersion((prev) => ({
        ...prev,
        [projectId]: hasVersion0 || false,
      }))
    } catch (error) {
      console.error("Error loading forecast versions:", error)
    }
  }

  // Validation function for staged entries
  const validateStagedEntries = (entries: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    entries.forEach((entry, index) => {
      // Check required fields
      if (!entry.cost_line || entry.cost_line.trim() === '') {
        errors.push(`Entry ${index + 1}: Cost line is required`)
      }
      if (!entry.spend_type || entry.spend_type.trim() === '') {
        errors.push(`Entry ${index + 1}: Spend type is required`)
      }
      if (!entry.spend_sub_category || entry.spend_sub_category.trim() === '') {
        errors.push(`Entry ${index + 1}: Spend sub-category is required`)
      }
      if (!entry.sub_business_line || entry.sub_business_line.trim() === '') {
        errors.push(`Entry ${index + 1}: Sub-business line is required`)
      }

      // Validate budget cost is a valid number
      const budgetCost = parseFloat(entry.budget_cost)
      if (isNaN(budgetCost) || budgetCost < 0) {
        errors.push(`Entry ${index + 1}: Budget cost must be a valid positive number`)
      }

      // Check for decimal precision (max 2 decimal places)
      if (entry.budget_cost && entry.budget_cost.toString().includes('.')) {
        const decimals = entry.budget_cost.toString().split('.')[1]
        if (decimals && decimals.length > 2) {
          errors.push(`Entry ${index + 1}: Budget cost can have maximum 2 decimal places`)
        }
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  const saveInitialVersion = async (projectId: string) => {
    setSavingForecast(true)

    try {
      // Get staged entries for this project
      const stagedEntries = stagedNewEntries[projectId] || []

      // Add detailed logging
      console.log('=== SAVING INITIAL VERSION DEBUG ===')
      console.log('Project ID:', projectId)
      console.log('Number of staged entries:', stagedEntries.length)
      console.log('Staged entries structure:', JSON.stringify(stagedEntries, null, 2))

      if (stagedEntries.length === 0) {
        toast({
          variant: "destructive",
          title: "No entries to save",
          description: "Please add at least one entry before saving",
        })
        setSavingForecast(false)
        return
      }

      // Validate entries before proceeding
      const validation = validateStagedEntries(stagedEntries)
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors)
        toast({
          variant: "destructive",
          title: "Validation Errors",
          description: validation.errors.join(", "),
        })
        setSavingForecast(false)
        return
      }

      // Use the cleanup utility
      const cleanedEntries = stagedEntries.map(entry =>
        cleanEntryForDatabase(entry, projectId)
      )

      console.log('Cleaned entries for RPC:', JSON.stringify(cleanedEntries, null, 2))

      // Log what we're sending
      console.log('Attempting to save initial version...')
      console.log('Using direct database insertion method (RPC bypass)...')

      // Skip RPC entirely and use direct insertion
      let data, error;

      // ALWAYS use direct insertion to avoid RPC issues
      const useDirectInsertion = true; // Force this for now

      if (useDirectInsertion) {
        console.log('Using direct insertion method instead of RPC...')

        // Fallback: Manual insertion with transaction-like behavior
        try {
          // Step 1: Create forecast version
          const { data: versionData, error: versionError } = await supabase
            .from("forecast_versions")
            .insert({
              project_id: projectId,
              version_number: 0,
              reason_for_change: 'Initial budget creation',
              created_by: 'system'
            })
            .select()
            .single()

          if (versionError) throw versionError

          // Step 2: Insert cost breakdown entries and budget forecasts
          const savedEntries = []
          for (const entry of cleanedEntries) {
            // Insert cost breakdown
            const { data: costData, error: costError } = await supabase
              .from("cost_breakdown")
              .insert({
                ...entry,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (costError) throw costError
            savedEntries.push(costData)

            // Insert budget forecast
            const { error: forecastError } = await supabase
              .from("budget_forecasts")
              .insert({
                forecast_version_id: versionData.id,
                cost_breakdown_id: costData.id,
                forecasted_cost: entry.budget_cost,
                created_at: new Date().toISOString()
              })

            if (forecastError) throw forecastError
          }

          // Success - format response like RPC would
          data = [{
            success: true,
            version_id: versionData.id,
            message: 'Initial forecast created successfully'
          }]
          error = null

        } catch (fallbackError: any) {
          console.error('Fallback method also failed:', fallbackError)
          error = fallbackError
          data = null
        }
      } else {
        // This block won't run since we're forcing direct insertion
        console.log('This should not appear - RPC is bypassed')
      }

      console.log('RPC Response - Data:', data)
      console.log('RPC Response - Error:', error)

      if (error) {
        console.error('RPC Error Details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      // Validate response structure
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Unexpected RPC response format:', data)
        throw new Error('Invalid response format from RPC function')
      }

      const result = data[0]
      console.log('RPC Result:', result)

      if (!result.success) {
        console.error('RPC Function Failed:', result.message)
        throw new Error(result.message || 'RPC function returned failure')
      }

      // Update state after successful save
      setHasInitialVersion((prev) => ({
        ...prev,
        [projectId]: true,
      }))

      // Exit initial budget mode
      setIsInitialBudgetMode(null)
      setStagedNewEntries((prev) => ({ ...prev, [projectId]: [] }))

      // Reload data to reflect changes
      await loadCostBreakdown(projectId)
      await loadForecastVersions(projectId)
      
      // Clear backup after successful save
      LocalStorageService.clearBackup()
      
      // Show success toast
      toast({
        title: "Success",
        description: "Initial budget saved successfully",
      })
    } catch (error: any) {
      console.error("Error saving initial version:", error)

      // Provide specific error messages based on error type
      let userMessage = "Error saving initial version. "

      if (error?.code === 'PGRST202') {
        userMessage += "The database function is not available. Please contact support."
      } else if (error?.code === '23505') {
        userMessage += "An initial version already exists for this project."
      } else if (error?.code === '22P02') {
        userMessage += "Invalid data format. Please check all fields are filled correctly."
      } else if (error?.message?.includes('violates foreign key')) {
        userMessage += "Project reference is invalid. Please refresh and try again."
      } else if (error?.message) {
        userMessage += `Details: ${error.message}`
      } else {
        userMessage += "Please check your entries and try again."
      }

      toast({
        variant: "destructive",
        title: "Error Saving",
        description: userMessage,
      })

      // Don't clear staged entries on error - allow user to fix and retry
      // setStagedNewEntries((prev) => ({ ...prev, [projectId]: [] }))
    } finally {
      setSavingForecast(false)
    }
  }

  const handleVersionChange = async (projectId: string, version: string) => {
    const versionNumber = version === "latest" ? "latest" : Number.parseInt(version)
    setActiveVersion(versionNumber)
    await loadVersionCostBreakdown(projectId, versionNumber)
  }

  const updateCostItem = async (costItem: CostBreakdown) => {
    setSavingCosts((prev) => new Set(prev).add(costItem.id))

    try {
      // Check if this is a staged entry
      if (costItem.id && costItem.id.startsWith('temp_')) {
        // Update staged entries state for temporary entries
        setStagedNewEntries((prev) => ({
          ...prev,
          [costItem.project_id]: prev[costItem.project_id]?.map((entry) =>
            entry.id === costItem.id ? { ...costItem, _modified: true } : entry
          ) || [],
        }))
        
        // Update display state
        setCostBreakdowns((prev) => ({
          ...prev,
          [costItem.project_id]:
            prev[costItem.project_id]?.map((cost) => 
              cost.id === costItem.id ? { ...costItem, _modified: true } : cost
            ) || [],
        }))
        
        // Provide feedback for staged entry update
        console.log("Staged entry updated:", costItem.id)
        toast({
          title: "Changes Staged",
          description: "Your changes will be saved with the initial budget",
        })
      } else {
        // Only update database for persisted entries
        const { error } = await supabase
          .from("cost_breakdown")
          .update({
            sub_business_line: costItem.sub_business_line,
            cost_line: costItem.cost_line,
            spend_type: costItem.spend_type,
            spend_sub_category: costItem.spend_sub_category,
            budget_cost: costItem.budget_cost,
          })
          .eq("id", costItem.id)

        if (error) throw error

        // Update display state for saved entry
        setCostBreakdowns((prev) => ({
          ...prev,
          [costItem.project_id]:
            prev[costItem.project_id]?.map((cost) => 
              cost.id === costItem.id ? costItem : cost
            ) || [],
        }))
      }

      setEditingCost(null)
      setEditingValues(null)
    } catch (error) {
      console.error("Error updating cost item:", error)
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update cost item. Please try again.",
      })
    } finally {
      setSavingCosts((prev) => {
        const newSet = new Set(prev)
        newSet.delete(costItem.id)
        return newSet
      })
    }
  }

  const saveForecastVersion = async (projectId: string) => {
    if (!forecastReason.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide a reason for this forecast.",
      })
      return
    }

    setSavingForecast(true)

    try {
      // Get the next version number
      const versions = forecastVersions[projectId] || []
      const nextVersionNumber = versions.length > 0 ? Math.max(...versions.map((v) => v.version_number)) + 1 : 1

      const stagedEntries = stagedNewEntries[projectId] || []
      const savedNewEntries = []

      for (const newEntry of stagedEntries) {
        const cleanEntry = cleanEntryForDatabase(newEntry, projectId)

        console.log('Saving clean entry to database:', cleanEntry)

        const { data, error } = await supabase
          .from("cost_breakdown")
          .insert([cleanEntry])
          .select()
          .single()

        if (error) throw error
        savedNewEntries.push(data)
      }

      // Create the forecast version
      const { data: versionData, error: versionError } = await supabase
        .from("forecast_versions")
        .insert({
          project_id: projectId,
          version_number: nextVersionNumber,
          reason_for_change: forecastReason,
          created_by: "current_user", // In a real app, this would be the actual user
        })
        .select()
        .single()

      if (versionError) throw versionError

      // This ensures we have a complete snapshot of the forecast version
      // Filter out any staged entries with temporary IDs
      const currentCosts = (costBreakdowns[projectId] || []).filter(
        cost => cost.id && !cost.id.startsWith('temp_')
      )
      const allForecastEntries = currentCosts.map((cost) => ({
        forecast_version_id: versionData.id,
        cost_breakdown_id: cost.id,
        forecasted_cost: forecastChanges[cost.id] !== undefined ? forecastChanges[cost.id] : cost.budget_cost,
      }))

      // Add new entries to the forecast
      const newEntriesInForecast = savedNewEntries.map((cost) => ({
        forecast_version_id: versionData.id,
        cost_breakdown_id: cost.id,
        forecasted_cost: cost.budget_cost,
      }))

      const completeForecastEntries = [...allForecastEntries, ...newEntriesInForecast]

      if (completeForecastEntries.length > 0) {
        const { error: forecastError } = await supabase.from("budget_forecasts").insert(completeForecastEntries)

        if (forecastError) throw forecastError
      }

      // The original values should remain unchanged to preserve version 0

      // Refresh data
      await loadCostBreakdown(projectId)
      await loadForecastVersions(projectId)

      // Clear all forecasting state
      setIsForecasting(null)
      setForecastChanges({})
      setForecastReason("")
      setForecastNewEntries(new Set())
      setStagedNewEntries((prev) => ({ ...prev, [projectId]: [] }))
      
      // Clear localStorage backup after successful save
      LocalStorageService.clearBackup()
      
      // Show success notification
      toast({
        title: "Forecast Saved",
        description: `Version ${nextVersionNumber} has been created successfully`,
      })
    } catch (error: any) {
      console.error("Error saving forecast:", error)

      let userMessage = "Error saving forecast. "

      // Check for specific error types
      if (error?.message?.includes('temporary fields')) {
        userMessage += "Internal error: temporary fields detected. Please refresh and try again."
      } else if (error?.code === 'PGRST204') {
        userMessage += "Database schema error. Please contact support."
      } else if (error?.code === '23505') {
        userMessage += "Duplicate entry detected. Please check your entries."
      } else if (error?.code === '22P02') {
        userMessage += "Invalid data format. Please check all fields."
      } else if (error?.message) {
        userMessage += `Details: ${error.message}`
      } else {
        userMessage += "Please check your entries and try again."
      }

      toast({
        variant: "destructive",
        title: "Error Saving",
        description: userMessage,
      })

      // Log detailed error for debugging
      console.error('Detailed error context:', {
        projectId,
        stagedEntriesCount: stagedNewEntries[projectId]?.length || 0,
        forecastReason,
        error: error
      })
    } finally {
      setSavingForecast(false)
    }
  }

  const startForecasting = (projectId: string) => {
    // Use wizard instead of inline mode
    setShowForecastWizard(projectId)
    setIsForecasting(projectId)
    setForecastChanges({})
    setForecastReason("")
  }

  const cancelForecasting = (projectId: string) => {
    const stagedEntries = stagedNewEntries[projectId] || []
    const stagedIds = new Set(stagedEntries.map((entry) => entry.id))

    setCostBreakdowns((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter((cost) => !stagedIds.has(cost.id)),
    }))

    // Reset all forecasting state
    setIsForecasting(null)
    setForecastChanges({})
    setForecastReason("")
    setForecastNewEntries(new Set())
    setStagedNewEntries((prev) => ({ ...prev, [projectId]: [] }))
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.sub_business_line.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTotalBudget = (costs: CostBreakdown[]) => {
    return costs.reduce((sum, cost) => sum + Number(cost.budget_cost), 0)
  }

  const toggleProjectExpansion = async (project: Project) => {
    const isExpanded = expandedProjects.has(project.id)

    if (isExpanded) {
      setExpandedProjects((prev) => {
        const newSet = new Set(prev)
        newSet.delete(project.id)
        return newSet
      })
    } else {
      setExpandedProjects((prev) => new Set(prev).add(project.id))

      // Load cost breakdown and forecast versions if not already loaded
      if (!costBreakdowns[project.id]) {
        await loadCostBreakdown(project.id)
      }
      if (!forecastVersions[project.id]) {
        await loadForecastVersions(project.id)
      }
    }
  }

  const startEditing = (cost: CostBreakdown) => {
    setEditingCost(cost.id)
    setEditingValues({ ...cost })
  }

  const cancelEditing = () => {
    setEditingCost(null)
    setEditingValues(null)
  }

  const saveEditing = () => {
    if (editingValues) {
      updateCostItem(editingValues)
    }
  }

  const addNewCostEntry = async (newCost: NewCostEntry) => {
    setSavingNewCost(true)

    try {
      if (isInitialBudgetMode === newCost.project_id || isForecasting === newCost.project_id) {
        // Use UUID-like temporary ID to avoid conflicts
        const tempId = `temp_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}`

        // Don't include the temp ID in the actual data structure - use separate field
        const stagedEntry = {
          ...newCost,
          id: tempId,  // Keep for UI display
          _tempId: tempId // Use underscore prefix to clearly mark as metadata
        }

        // Add to staged entries
        setStagedNewEntries((prev) => ({
          ...prev,
          [newCost.project_id]: [...(prev[newCost.project_id] || []), stagedEntry],
        }))

        // Also add to current display for immediate feedback
        setCostBreakdowns((prev) => ({
          ...prev,
          [newCost.project_id]: [...(prev[newCost.project_id] || []), stagedEntry],
        }))
      } else {
        // This should never happen with the new workflow, but keeping as fallback
        const { error } = await supabase.from("cost_breakdown").insert([newCost]).select().single()
        if (error) throw error
        await loadCostBreakdown(newCost.project_id)
      }
    } catch (error) {
      console.error("Error adding new cost entry:", error)
    } finally {
      setSavingNewCost(false)
    }
  }

  const deleteCostEntry = async (costId: string) => {
    setDeletingCost(costId)

    try {
      // Find the project ID for this cost entry
      const projectId = Object.keys(costBreakdowns).find((projectId) =>
        costBreakdowns[projectId].some((cost) => cost.id === costId),
      )
      
      if (!projectId) {
        throw new Error("Could not find project for cost entry")
      }

      // Check if this is a staged entry
      if (costId && costId.startsWith('temp_')) {
        // Remove from staged entries
        setStagedNewEntries((prev) => ({
          ...prev,
          [projectId]: prev[projectId]?.filter((entry) => entry.id !== costId) || [],
        }))
        
        // Remove from display state
        setCostBreakdowns((prev) => ({
          ...prev,
          [projectId]: prev[projectId]?.filter((cost) => cost.id !== costId) || [],
        }))
        
        console.log("Staged entry deleted:", costId)
      } else {
        // Only delete from database for persisted entries
        const { error } = await supabase
          .from("cost_breakdown")
          .delete()
          .eq("id", costId)

        if (error) throw error

        // Refresh data
        await loadCostBreakdown(projectId)
      }
    } catch (error) {
      console.error("Error deleting cost entry:", error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete cost entry. Please try again.",
      })
    } finally {
      setDeletingCost(null)
    }
  }

  const deleteProject = async (projectId: string) => {
    setDeletingProject(projectId)

    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId)
      if (error) throw error

      // Refresh projects
      await loadProjects()
    } catch (error) {
      console.error("Error deleting project:", error)
    } finally {
      setDeletingProject(null)
    }
  }

  const createNewProject = async () => {
    setSavingNewProject(true)

    try {
      const { data, error } = await supabase.from("projects").insert([newProjectData]).select().single()
      if (error) throw error

      // Refresh projects
      await loadProjects()

      // Reset new project state
      setCreatingNewProject(false)
      setNewProjectData({
        name: "",
        sub_business_line: "",
      })
    } catch (error) {
      console.error("Error creating new project:", error)
      toast({
        variant: "destructive",
        title: "Error Creating Project",
        description: "Error creating new project. Please try again.",
      })
    } finally {
      setSavingNewProject(false)
    }
  }

  const cancelNewProject = () => {
    setCreatingNewProject(false)
    setNewProjectData({
      name: "",
      sub_business_line: "",
    })
  }

  const updateForecastChange = (costId: string, newValue: number) => {
    setForecastChanges((prev) => ({
      ...prev,
      [costId]: newValue,
    }))
  }

  const addForecastNewEntry = (newCost: NewCostEntry) => {
    setForecastNewEntries((prev) => new Set(prev).add(newCost.project_id))
    setStagedNewEntries((prev) => ({
      ...prev,
      [newCost.project_id]: [...(prev[newCost.project_id] || []), newCost],
    }))
  }

  const removeForecastNewEntry = (costId: string) => {
    setStagedNewEntries((prev) => {
      const projectId = Object.keys(prev).find((projectId) => prev[projectId].some((entry) => entry.id === costId))
      if (!projectId) return prev

      return {
        ...prev,
        [projectId]: prev[projectId].filter((entry) => entry.id !== costId),
      }
    })
  }

  const startInitialBudgetMode = (projectId: string) => {
    setIsInitialBudgetMode(projectId)
    setStagedNewEntries((prev) => ({ ...prev, [projectId]: [] }))
  }

  const cancelInitialBudgetMode = (projectId: string) => {
    // Remove staged entries from display
    const stagedEntries = stagedNewEntries[projectId] || []
    const stagedIds = new Set(stagedEntries.map((entry) => entry.id))

    setCostBreakdowns((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter((cost) => !stagedIds.has(cost.id)),
    }))

    // Reset state
    setIsInitialBudgetMode(null)
    setStagedNewEntries((prev) => ({ ...prev, [projectId]: [] }))
  }

  // Handler functions for unsaved changes bar
  const handleSaveAllChanges = async (projectId: string) => {
    if (isInitialBudgetMode === projectId) {
      await saveInitialVersion(projectId)
    } else if (isForecasting === projectId) {
      await saveForecastVersion(projectId)
    }
  }

  const handleDiscardChanges = (projectId: string) => {
    if (!confirm("Are you sure you want to discard all unsaved changes?")) {
      return
    }
    
    // Reset staged entries
    setStagedNewEntries(prev => ({ ...prev, [projectId]: [] }))
    
    // Reset modifications
    setCostBreakdowns(prev => ({
      ...prev,
      [projectId]: prev[projectId]?.map(c => ({ ...c, _modified: false })) || []
    }))
    
    toast({
      title: "Changes Discarded",
      description: "All unsaved changes have been discarded",
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cost Management Hub</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {!creatingNewProject && (
            <button
              onClick={() => setCreatingNewProject(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Project
            </button>
          )}
        </div>
      </div>

      {/* Create New Project Form */}
      {creatingNewProject && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Create New Project</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Business Line</label>
              <select
                value={newProjectData.sub_business_line}
                onChange={(e) => setNewProjectData({ ...newProjectData, sub_business_line: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select sub business line</option>
                {SUB_BUSINESS_LINE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createNewProject}
              disabled={savingNewProject || !newProjectData.name.trim() || !newProjectData.sub_business_line.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingNewProject ? "Creating..." : "Create Project"}
            </button>
            <button
              onClick={cancelNewProject}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No projects found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleProjectExpansion(project)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg
                        className={`h-5 w-5 transform transition-transform ${
                          expandedProjects.has(project.id) ? "rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div>
                      <h3 className="text-xl font-semibold">{project.name}</h3>
                      <p className="text-gray-600">{project.sub_business_line}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {costBreakdowns[project.id] && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Budget</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(getTotalBudget(costBreakdowns[project.id]))}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this project? This will permanently delete all project data including budgets, versions, and cost breakdowns.",
                          )
                        ) {
                          deleteProject(project.id)
                        }
                      }}
                      disabled={deletingProject === project.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                    >
                      {deletingProject === project.id ? (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {expandedProjects.has(project.id) && (
                  <div className="mt-6 border-t pt-6">
                    {/* Version History Timeline */}
                    {forecastVersions[project.id] && forecastVersions[project.id].length > 0 && (
                      <div className="mb-6">
                        <VersionHistoryTimeline
                          versions={forecastVersions[project.id]}
                          currentVersion={activeVersion}
                          onVersionSelect={(version) => handleVersionChange(project.id, version.toString())}
                          onCompareVersions={(v1, v2) => {
                            // TODO: Implement comparison view
                            console.log("Compare versions:", v1, v2)
                          }}
                          isLoading={loadingVersionData[project.id]}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Cost Breakdown</h4>
                      <div className="flex items-center gap-2">
                        {forecastVersions[project.id] && forecastVersions[project.id].length > 0 && (
                          <select
                            value={activeVersion}
                            onChange={(e) => handleVersionChange(project.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                            disabled={loadingVersionData[project.id]}
                          >
                            <option value="latest">Latest</option>
                            {forecastVersions[project.id].map((version) => (
                              <option key={version.id} value={version.version_number}>
                                Version {version.version_number}
                              </option>
                            ))}
                          </select>
                        )}

                        {isInitialBudgetMode === project.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-600 font-medium">
                              Initial Budget Mode ({stagedNewEntries[project.id]?.length || 0} entries)
                            </span>
                            <button
                              onClick={() => saveInitialVersion(project.id)}
                              disabled={savingForecast || (stagedNewEntries[project.id]?.length || 0) === 0}
                              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {savingForecast ? "Saving..." : "Save Initial Budget"}
                            </button>
                            <button
                              onClick={() => cancelInitialBudgetMode(project.id)}
                              className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : isForecasting === project.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-600 font-medium">
                              Forecasting Mode (
                              {Object.keys(forecastChanges).length + (stagedNewEntries[project.id]?.length || 0)}{" "}
                              changes)
                            </span>
                            <input
                              type="text"
                              placeholder="Reason for forecast..."
                              value={forecastReason}
                              onChange={(e) => setForecastReason(e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                            />
                            <button
                              onClick={() => saveForecastVersion(project.id)}
                              disabled={savingForecast || !forecastReason.trim()}
                              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {savingForecast ? "Saving..." : "Save Forecast"}
                            </button>
                            <button
                              onClick={() => cancelForecasting(project.id)}
                              className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {!hasInitialVersion[project.id] &&
                            (!costBreakdowns[project.id] || costBreakdowns[project.id].length === 0) ? (
                              <button
                                onClick={() => startInitialBudgetMode(project.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                              >
                                Create Initial Budget
                              </button>
                            ) : !hasInitialVersion[project.id] && costBreakdowns[project.id]?.length > 0 ? (
                              <button
                                onClick={() => saveInitialVersion(project.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                              >
                                Save Initial Version
                              </button>
                            ) : (
                              <button
                                onClick={() => startForecasting(project.id)}
                                className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-700 transition-colors"
                              >
                                Create New Forecast
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {loadingVersionData[project.id] ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading version data...</p>
                      </div>
                    ) : (
                      <>
                        {(!costBreakdowns[project.id] || costBreakdowns[project.id].length === 0) &&
                        !isInitialBudgetMode ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-600 mb-4">No budget has been created for this project yet.</p>
                            <p className="text-sm text-gray-500">Click "Create Initial Budget" to get started.</p>
                          </div>
                        ) : costBreakdowns[project.id] && costBreakdowns[project.id].length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                  <th className="border border-gray-300 px-4 py-2 text-left">Cost Line</th>
                                  <th className="border border-gray-300 px-4 py-2 text-left">Spend Type</th>
                                  <th className="border border-gray-300 px-4 py-2 text-left">Sub Category</th>
                                  <th className="border border-gray-300 px-4 py-2 text-left">Budget Cost</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {costBreakdowns[project.id].map((cost) => (
                                  <tr key={cost.id} className={getRowClassName(cost)}>
                                    {editingCost === cost.id &&
                                    (isForecasting === project.id || isInitialBudgetMode === project.id) ? (
                                      <>
                                        <td className="border border-gray-300 px-4 py-2">
                                          <EntryStatusIndicator 
                                            id={cost.id} 
                                            modified={cost._modified}
                                            saving={savingCosts.has(cost.id)}
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                          <select
                                            value={editingValues?.cost_line || ""}
                                            onChange={(e) =>
                                              setEditingValues(
                                                editingValues ? { ...editingValues, cost_line: e.target.value } : null,
                                              )
                                            }
                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                          >
                                            <option value="">Select cost line</option>
                                            {COST_LINE_OPTIONS.map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                          <select
                                            value={editingValues?.spend_type || ""}
                                            onChange={(e) =>
                                              setEditingValues(
                                                editingValues ? { ...editingValues, spend_type: e.target.value } : null,
                                              )
                                            }
                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                          >
                                            <option value="">Select spend type</option>
                                            {SPEND_TYPE_OPTIONS.map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                          <input
                                            type="text"
                                            value={editingValues?.spend_sub_category || ""}
                                            onChange={(e) =>
                                              setEditingValues(
                                                editingValues
                                                  ? { ...editingValues, spend_sub_category: e.target.value }
                                                  : null,
                                              )
                                            }
                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                          <input
                                            type="number"
                                            value={editingValues?.budget_cost || ""}
                                            onChange={(e) =>
                                              setEditingValues(
                                                editingValues
                                                  ? { ...editingValues, budget_cost: Number(e.target.value) }
                                                  : null,
                                              )
                                            }
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                          <div className="flex gap-1 justify-center">
                                            <button
                                              onClick={saveEditing}
                                              disabled={savingCosts.has(cost.id)}
                                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors"
                                            >
                                              {savingCosts.has(cost.id) ? "..." : "Save"}
                                            </button>
                                            <button
                                              onClick={cancelEditing}
                                              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="border border-gray-300 px-4 py-2">
                                          <EntryStatusIndicator 
                                            id={cost.id} 
                                            modified={cost._modified}
                                            saving={savingCosts.has(cost.id)}
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{cost.cost_line}</td>
                                        <td className="border border-gray-300 px-4 py-2">{cost.spend_type}</td>
                                        <td className="border border-gray-300 px-4 py-2">{cost.spend_sub_category}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right">
                                          {isForecasting === project.id ? (
                                            <input
                                              type="number"
                                              value={forecastChanges[cost.id] ?? cost.budget_cost}
                                              onChange={(e) => updateForecastChange(cost.id, Number(e.target.value))}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-right bg-yellow-50"
                                            />
                                          ) : (
                                            formatCurrency(cost.budget_cost)
                                          )}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                          {(isForecasting === project.id || isInitialBudgetMode === project.id) && (
                                            <div className="flex gap-1 justify-center">
                                              <button
                                                onClick={() => startEditing(cost)}
                                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                onClick={() => {
                                                  if (confirm("Are you sure you want to delete this cost entry?")) {
                                                    deleteCostEntry(cost.id)
                                                  }
                                                }}
                                                disabled={deletingCost === cost.id}
                                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 transition-colors"
                                              >
                                                {deletingCost === cost.id ? "..." : "Delete"}
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}

                        {(isForecasting === project.id || isInitialBudgetMode === project.id) && (
                          <div className="mt-4">
                            {addingNewCost === project.id ? (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h5 className="font-semibold mb-3">Add New Cost Entry</h5>
                                <div className="grid grid-cols-4 gap-3 mb-3">
                                  <select
                                    value={newCostValues?.cost_line || ""}
                                    onChange={(e) =>
                                      setNewCostValues(
                                        newCostValues
                                          ? { ...newCostValues, cost_line: e.target.value }
                                          : {
                                              project_id: project.id,
                                              sub_business_line: project.sub_business_line,
                                              cost_line: e.target.value,
                                              spend_type: "",
                                              spend_sub_category: "",
                                              budget_cost: 0,
                                            },
                                      )
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-md"
                                  >
                                    <option value="">Select cost line</option>
                                    {COST_LINE_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    value={newCostValues?.spend_type || ""}
                                    onChange={(e) =>
                                      setNewCostValues(
                                        newCostValues
                                          ? { ...newCostValues, spend_type: e.target.value }
                                          : {
                                              project_id: project.id,
                                              sub_business_line: project.sub_business_line,
                                              cost_line: "",
                                              spend_type: e.target.value,
                                              spend_sub_category: "",
                                              budget_cost: 0,
                                            },
                                      )
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-md"
                                  >
                                    <option value="">Select spend type</option>
                                    {SPEND_TYPE_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Sub Category"
                                    value={newCostValues?.spend_sub_category || ""}
                                    onChange={(e) =>
                                      setNewCostValues(
                                        newCostValues
                                          ? { ...newCostValues, spend_sub_category: e.target.value }
                                          : {
                                              project_id: project.id,
                                              sub_business_line: project.sub_business_line,
                                              cost_line: "",
                                              spend_type: "",
                                              spend_sub_category: e.target.value,
                                              budget_cost: 0,
                                            },
                                      )
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Budget Cost"
                                    value={newCostValues?.budget_cost || ""}
                                    onChange={(e) =>
                                      setNewCostValues(
                                        newCostValues
                                          ? { ...newCostValues, budget_cost: Number(e.target.value) }
                                          : {
                                              project_id: project.id,
                                              sub_business_line: project.sub_business_line,
                                              cost_line: "",
                                              spend_type: "",
                                              spend_sub_category: "",
                                              budget_cost: Number(e.target.value),
                                            },
                                      )
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (newCostValues) {
                                        addNewCostEntry(newCostValues)
                                        setAddingNewCost(null)
                                        setNewCostValues(null)
                                      }
                                    }}
                                    disabled={
                                      savingNewCost ||
                                      !newCostValues?.cost_line ||
                                      !newCostValues?.spend_type ||
                                      !newCostValues?.spend_sub_category
                                    }
                                    className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                                  >
                                    {savingNewCost ? "Adding..." : "Add Entry"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAddingNewCost(null)
                                      setNewCostValues(null)
                                    }}
                                    className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingNewCost(project.id)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  isForecasting === project.id
                                    ? "bg-orange-600 text-white hover:bg-orange-700"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                Add New Entry
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Forecast Wizard */}
      {showForecastWizard && (
        <ForecastWizard
          isOpen={true}
          onClose={() => {
            setShowForecastWizard(null)
            setIsForecasting(null)
            setForecastChanges({})
            setForecastReason("")
          }}
          projectId={showForecastWizard}
          projectName={projects.find(p => p.id === showForecastWizard)?.name || ""}
          currentCosts={costBreakdowns[showForecastWizard] || []}
          stagedEntries={stagedNewEntries[showForecastWizard] || []}
          onSave={async (changes, newEntries, reason) => {
            // Prepare forecast data
            setForecastChanges(changes)
            setStagedNewEntries(prev => ({
              ...prev,
              [showForecastWizard]: newEntries
            }))
            setForecastReason(reason)
            
            // Save the forecast
            await saveForecastVersion(showForecastWizard)
            
            // Close wizard
            setShowForecastWizard(null)
          }}
          onAddEntry={(entry) => {
            addNewCostEntry(entry as any)
          }}
          onUpdateEntry={(entry) => {
            updateCostItem(entry)
          }}
          onDeleteEntry={(id) => {
            deleteCostEntry(id)
          }}
        />
      )}

      {/* Show unsaved changes bar for expanded projects with unsaved changes */}
      {Array.from(expandedProjects).map((projectId) => (
        unsavedChangesCount[projectId] > 0 && (
          <UnsavedChangesBar
            key={`unsaved-${projectId}`}
            count={unsavedChangesCount[projectId]}
            onSave={() => handleSaveAllChanges(projectId)}
            onDiscard={() => handleDiscardChanges(projectId)}
          />
        )
      ))}
    </div>
  )
}
