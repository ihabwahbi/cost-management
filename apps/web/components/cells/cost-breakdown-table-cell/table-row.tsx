import { TableRow, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, X, Edit2, Trash2 } from 'lucide-react'

interface CostEntry {
  id: string
  projectId: string
  subBusinessLine: string
  costLine: string
  spendType: string
  spendSubCategory: string | null
  budgetCost: number
  createdAt: string | null
  updatedAt: string | null
}

interface CostBreakdownTableRowProps {
  cost: CostEntry
  isEditing: boolean
  editValues: Partial<CostEntry>
  fieldErrors: Record<string, string>
  bulkEditMode: boolean
  isSelected: boolean
  isUpdating: boolean
  isDeleting: boolean
  onDoubleClick: (cost: CostEntry) => void
  onFieldChange: (field: keyof CostEntry, value: string | number) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: (id: string) => void
  onToggleSelect: (id: string) => void
}

export function CostBreakdownTableRow({
  cost,
  isEditing,
  editValues,
  fieldErrors,
  bulkEditMode,
  isSelected,
  isUpdating,
  isDeleting,
  onDoubleClick,
  onFieldChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onToggleSelect,
}: CostBreakdownTableRowProps) {
  return (
    <TableRow
      onDoubleClick={() => !bulkEditMode && onDoubleClick(cost)}
      className={isEditing ? 'bg-muted' : ''}
    >
      {bulkEditMode && (
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(cost.id)}
          />
        </TableCell>
      )}
      <TableCell>
        {isEditing ? (
          <div>
            <Input
              value={editValues.costLine || ''}
              onChange={(e) => onFieldChange('costLine', e.target.value)}
              className={fieldErrors.costLine ? 'border-red-500' : ''}
            />
            {fieldErrors.costLine && (
              <span className="text-xs text-red-500">{fieldErrors.costLine}</span>
            )}
          </div>
        ) : (
          cost.costLine
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editValues.subBusinessLine || ''}
            onChange={(e) => onFieldChange('subBusinessLine', e.target.value)}
          />
        ) : (
          cost.subBusinessLine
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editValues.spendType || ''}
            onChange={(e) => onFieldChange('spendType', e.target.value)}
          />
        ) : (
          cost.spendType
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editValues.spendSubCategory || ''}
            onChange={(e) => onFieldChange('spendSubCategory', e.target.value)}
          />
        ) : (
          cost.spendSubCategory || '-'
        )}
      </TableCell>
      <TableCell className="text-right">
        {isEditing ? (
          <div>
            <Input
              type="number"
              value={editValues.budgetCost || 0}
              onChange={(e) => onFieldChange('budgetCost', parseFloat(e.target.value))}
              className={fieldErrors.budgetCost ? 'border-red-500' : ''}
            />
            {fieldErrors.budgetCost && (
              <span className="text-xs text-red-500">{fieldErrors.budgetCost}</span>
            )}
          </div>
        ) : (
          `$${cost.budgetCost.toLocaleString()}`
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onSaveEdit}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          !bulkEditMode && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDoubleClick(cost)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(cost.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        )}
      </TableCell>
    </TableRow>
  )
}
