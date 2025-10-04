'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  _tempId?: string
}

interface NewEntryFormProps {
  projectId: string
  onSubmit: (entry: CostBreakdown) => void
  options: {
    costLines: string[]
    spendTypes: string[]
    subCategories: string[]
    subBusinessLines: string[]
  }
}

export function NewEntryForm({ projectId, onSubmit, options }: NewEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<CostBreakdown>>({
    sub_business_line: options.subBusinessLines[0],
    cost_line: '',
    spend_type: '',
    spend_sub_category: '',
    budget_cost: 0,
  })

  const handleSubmit = () => {
    // ✅ PITFALL #2 FIX: Explicit positive number validation
    if (
      formData.cost_line &&
      formData.spend_type &&
      formData.spend_sub_category &&
      formData.budget_cost !== undefined &&
      formData.budget_cost > 0  // ← Prevents zero-value entries
    ) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const entry: CostBreakdown = {
        id: tempId,
        project_id: projectId,
        sub_business_line: formData.sub_business_line || options.subBusinessLines[0],
        cost_line: formData.cost_line,
        spend_type: formData.spend_type,
        spend_sub_category: formData.spend_sub_category,
        budget_cost: formData.budget_cost,
        _tempId: tempId,
      }

      onSubmit(entry)

      // Reset form
      setFormData({
        sub_business_line: options.subBusinessLines[0],
        cost_line: '',
        spend_type: '',
        spend_sub_category: '',
        budget_cost: 0,
      })
      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setFormData({
      sub_business_line: options.subBusinessLines[0],
      cost_line: '',
      spend_type: '',
      spend_sub_category: '',
      budget_cost: 0,
    })
  }

  const isFormValid = 
    formData.cost_line &&
    formData.spend_type &&
    formData.spend_sub_category &&
    formData.budget_cost !== undefined &&
    formData.budget_cost > 0  // ✅ Zero-value validation

  return (
    <>
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Entry
        </Button>
      )}

      {isOpen && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sub Business Line</Label>
                <Select
                  value={formData.sub_business_line}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sub_business_line: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.subBusinessLines.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cost Line</Label>
                <Select
                  value={formData.cost_line}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cost_line: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cost line" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.costLines.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Spend Type</Label>
                <Select
                  value={formData.spend_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, spend_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select spend type" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.spendTypes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub Category</Label>
                <Input
                  value={formData.spend_sub_category}
                  onChange={(e) =>
                    setFormData({ ...formData, spend_sub_category: e.target.value })
                  }
                  placeholder="Enter sub category"
                />
              </div>
              <div>
                <Label>Budget Cost</Label>
                <Input
                  type="number"
                  value={formData.budget_cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget_cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={!isFormValid}
              >
                Add Entry
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
