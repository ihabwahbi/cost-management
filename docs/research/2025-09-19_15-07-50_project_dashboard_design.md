# Research: Project Dashboard Design for Cost Management System

**Date**: 2025-09-19 15:07:50 AWST  
**Researcher**: System  
**Git Commit**: a82404c  
**Branch**: main  
**Repository**: cost-management-v0

## Research Question
Design a world-class project dashboard that shows insights of specific projects, total budget versus PO value, displayed in a straightforward and easy way with unmatched UX experience, providing essential insights into spend and tracking, while adhering to existing branding and themes.

## Summary
The cost management system currently has two functional pages: Projects (budget management) and PO Mapping (purchase order assignment). This research provides a comprehensive design framework for a new Project Dashboard that leverages existing components, follows established patterns, and introduces advanced visualization capabilities for project spend insights.

## Current System Analysis

### Existing Pages and Features

#### 1. Projects Page (`app/projects/page.tsx`)
- **Purpose**: Manage project budgets and forecast versions
- **Key Features**:
  - Hierarchical cost breakdown (Sub Business Line → Cost Line → Spend Type → Sub Category)
  - Forecast versioning with historical tracking
  - Initial budget creation (Version 0)
  - Inline editing capabilities
  - Budget comparison widget showing PO actuals
  - Version history timeline
  - Auto-save to localStorage
  - Keyboard shortcuts for power users

#### 2. PO Mapping Page (`app/po-mapping/page.tsx`)
- **Purpose**: Assign purchase orders to project budgets
- **Key Features**:
  - Resizable three-panel layout (Filter | Table | Details)
  - Advanced filtering (date range, location, FMT status, mapping status)
  - Batch operations for multiple POs
  - Line item level mapping
  - Real-time mapping status indicators
  - Drill-down to PO line items

### Data Architecture

#### Database Schema
```
projects (1) → (N) cost_breakdown
                         ↓
              (N) po_mappings (N)
                         ↑
            (1) po_line_items (N)
                         ↑
                    (1) pos

forecast_versions (1) → (N) budget_forecasts
        ↓                          ↓
   (1) project            (1) cost_breakdown
```

#### Key Aggregations
- **Total Budget**: Sum of all cost_breakdown.budget_cost for a project
- **Actual Spend**: Sum of mapped PO values from po_mappings
- **Variance**: Budget - Actual Spend
- **Utilization**: (Actual / Budget) × 100%

### UI/UX Design System

#### Brand Colors (SLB Theme)
- **Primary**: #0014dc (SLB Blue)
- **Secondary**: #0099a3 (SLB Aqua)
- **Accent**: #00d2dc (Light Aqua)
- **Background**: #f5f5f5
- **Card**: #ffffff

#### Component Library
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: shadcn/ui (Radix UI + Tailwind)
- **Charts**: Recharts with custom theme integration
- **Icons**: Lucide React
- **State**: React Hooks with Zustand patterns

## Proposed Dashboard Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Project Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│  Project Selector    |    Date Range    |   View Options    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ Total Budget │ │ Actual Spend │ │   Variance   │       │
│  │   $2.5M      │ │    $1.8M     │ │   +$700K     │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ Utilization  │ │   Invoiced   │ │ Open Orders  │       │
│  │     72%      │ │    $1.2M     │ │    $600K     │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Budget vs Actual Chart    |    Spend by Category          │
│  [Line/Area Chart]        |    [Donut Chart]              │
│                            |                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Monthly Burn Rate         |    Forecast Accuracy          │
│  [Bar Chart]              |    [Comparison Chart]         │
│                            |                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cost Breakdown Table with Drill-down                      │
│  [Expandable Tree Table with Progress Bars]                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Recent POs | Upcoming Costs | Alerts | Actions            │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Key Performance Indicators (KPIs)
```typescript
interface ProjectKPIs {
  totalBudget: number
  actualSpend: number
  variance: number
  variancePercent: number
  utilization: number
  invoicedAmount: number
  openOrders: number
  burnRate: number
  forecastAccuracy: number
}

const KPICard = ({ title, value, trend, icon, color }) => (
  <Card className={`border-l-4 border-l-${color}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <TrendIndicator value={trend} />}
    </CardContent>
  </Card>
)
```

#### 2. Budget vs Actual Timeline
```typescript
const BudgetTimelineChart = ({ data }) => (
  <ChartContainer>
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="budget" 
          fill="#0014dc20" 
          stroke="#0014dc"
        />
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke="#00d2dc" 
          strokeWidth={2}
        />
        <Bar dataKey="forecast" fill="#0099a3" />
      </ComposedChart>
    </ResponsiveContainer>
  </ChartContainer>
)
```

#### 3. Spend Category Breakdown
```typescript
const SpendCategoryChart = ({ data }) => (
  <PieChart width={400} height={300}>
    <Pie
      data={data}
      cx={200}
      cy={150}
      labelLine={false}
      label={renderCustomLabel}
      outerRadius={80}
      fill="#8884d8"
      dataKey="value"
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend />
  </PieChart>
)
```

#### 4. Hierarchical Cost Table
```typescript
const CostBreakdownTable = ({ project }) => {
  const [expanded, setExpanded] = useState({})
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Actual</TableHead>
          <TableHead>Variance</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map(category => (
          <ExpandableRow
            key={category.id}
            category={category}
            expanded={expanded[category.id]}
            onToggle={() => toggleExpand(category.id)}
          />
        ))}
      </TableBody>
    </Table>
  )
}
```

### Advanced Features

#### 1. Real-time Updates
```typescript
// Use WebSocket or polling for real-time PO updates
const useProjectMetrics = (projectId: string) => {
  const [metrics, setMetrics] = useState<ProjectKPIs>()
  
  useEffect(() => {
    const subscription = supabase
      .from('po_mappings')
      .on('INSERT', payload => {
        if (payload.new.project_id === projectId) {
          refreshMetrics()
        }
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [projectId])
  
  return metrics
}
```

#### 2. Predictive Analytics
```typescript
interface ForecastData {
  projectedSpend: number
  confidenceLevel: number
  riskFactors: string[]
  recommendations: string[]
}

const calculateProjectedSpend = (historicalData, currentBurnRate) => {
  // ML model or statistical projection
  return projectedValue
}
```

#### 3. Drill-down Navigation
```typescript
const DrillDownView = ({ level, data }) => {
  switch(level) {
    case 'project':
      return <ProjectOverview data={data} />
    case 'category':
      return <CategoryBreakdown data={data} />
    case 'subcategory':
      return <SubCategoryDetails data={data} />
    case 'po':
      return <POLineItems data={data} />
  }
}
```

### Mobile Responsive Design

```typescript
const ProjectDashboard = () => {
  const isMobile = useIsMobile()
  
  if (isMobile) {
    return (
      <MobileDashboard>
        <SwipeableViews>
          <KPICards />
          <Charts />
          <DetailsTables />
        </SwipeableViews>
      </MobileDashboard>
    )
  }
  
  return <DesktopDashboard />
}
```

### Performance Optimizations

#### 1. Data Loading Strategy
```typescript
// Lazy load detailed data
const useProgressiveDataLoading = (projectId) => {
  const [data, setData] = useState({ 
    summary: null, 
    details: null 
  })
  
  // Load summary immediately
  useEffect(() => {
    loadSummaryData(projectId).then(setData.summary)
  }, [projectId])
  
  // Load details on demand
  const loadDetails = useCallback(() => {
    loadDetailedData(projectId).then(setData.details)
  }, [projectId])
  
  return { ...data, loadDetails }
}
```

#### 2. Caching Strategy
```typescript
const cache = new Map()

const getCachedData = async (key, fetcher) => {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key)
    if (Date.now() - timestamp < CACHE_TTL) {
      return data
    }
  }
  
  const data = await fetcher()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}
```

### Interactive Elements

#### 1. Filter Panel
```typescript
const DashboardFilters = ({ onFilterChange }) => (
  <Card className="p-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DateRangePicker 
        presets={DATE_PRESETS}
        onChange={dates => onFilterChange({ dateRange: dates })}
      />
      <Select 
        placeholder="Cost Line"
        options={COST_LINES}
        onChange={value => onFilterChange({ costLine: value })}
      />
      <Select
        placeholder="Spend Type"
        options={SPEND_TYPES}
        onChange={value => onFilterChange({ spendType: value })}
      />
      <Toggle
        label="Show Forecasts"
        onChange={value => onFilterChange({ showForecasts: value })}
      />
    </div>
  </Card>
)
```

#### 2. Export Capabilities
```typescript
const exportDashboard = async (format: 'pdf' | 'excel' | 'png') => {
  switch(format) {
    case 'pdf':
      return generatePDFReport(dashboardData)
    case 'excel':
      return generateExcelWorkbook(dashboardData)
    case 'png':
      return captureScreenshot(dashboardRef.current)
  }
}
```

### Alert System

```typescript
interface ProjectAlert {
  type: 'budget_exceeded' | 'unusual_activity' | 'forecast_deviation'
  severity: 'info' | 'warning' | 'critical'
  message: string
  actionRequired: boolean
}

const AlertsPanel = ({ projectId }) => {
  const alerts = useProjectAlerts(projectId)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            variant={alert.severity}
            icon={getAlertIcon(alert.type)}
          >
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
            {alert.actionRequired && (
              <Button size="sm" className="mt-2">
                Take Action
              </Button>
            )}
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
```

## Implementation Roadmap

### Phase 1: Core Dashboard (Week 1-2)
1. Create dashboard route at `/app/projects/[id]/dashboard/page.tsx`
2. Implement KPI cards with real-time data
3. Add basic budget vs actual chart
4. Create spend category breakdown
5. Implement responsive layout

### Phase 2: Advanced Visualizations (Week 3-4)
1. Add monthly burn rate chart
2. Implement forecast accuracy metrics
3. Create hierarchical drill-down table
4. Add timeline view for cost evolution
5. Implement comparison views

### Phase 3: Interactive Features (Week 5-6)
1. Add advanced filtering system
2. Implement export functionality
3. Create alert system
4. Add predictive analytics
5. Implement real-time updates

### Phase 4: Performance & Polish (Week 7-8)
1. Optimize data loading
2. Implement caching strategies
3. Add loading states and skeletons
4. Enhance mobile experience
5. User testing and refinement

## Technical Recommendations

### State Management
```typescript
// Consider Zustand for dashboard state
import { create } from 'zustand'

const useDashboardStore = create((set) => ({
  project: null,
  filters: {},
  viewMode: 'overview',
  setProject: (project) => set({ project }),
  setFilters: (filters) => set({ filters }),
  setViewMode: (mode) => set({ viewMode: mode })
}))
```

### Data Fetching
```typescript
// Use React Query for efficient data management
import { useQuery } from '@tanstack/react-query'

const useProjectDashboard = (projectId) => {
  return useQuery({
    queryKey: ['dashboard', projectId],
    queryFn: () => fetchDashboardData(projectId),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute
  })
}
```

### Testing Strategy
```typescript
// Comprehensive test coverage
describe('ProjectDashboard', () => {
  it('renders all KPI cards', () => {})
  it('updates in real-time when PO is mapped', () => {})
  it('handles large datasets efficiently', () => {})
  it('exports data correctly', () => {})
  it('shows appropriate alerts', () => {})
})
```

## Best Practices

1. **Accessibility**: Ensure WCAG 2.1 AA compliance
2. **Performance**: Target < 100ms interaction response time
3. **Mobile First**: Design for mobile, enhance for desktop
4. **Progressive Enhancement**: Core features work without JavaScript
5. **Error Boundaries**: Graceful error handling
6. **Internationalization**: Prepare for multi-language support
7. **Analytics**: Track user interactions for continuous improvement

## Conclusion

The proposed Project Dashboard design leverages existing components and patterns while introducing advanced visualization and analytics capabilities. By following the phased implementation approach and adhering to the established design system, we can create a world-class dashboard that provides unmatched user experience and essential project spend insights.

## Related Research
- `docs/architecture.md` - System architecture overview
- `docs/front-end-spec.md` - Frontend specifications
- `docs/prd.md` - Product requirements document

## Open Questions
1. Should we implement real-time collaboration features?
2. What level of customization should users have over dashboard layout?
3. Should we integrate with external BI tools?
4. What machine learning models would be most valuable for predictions?
5. How should we handle multi-project portfolio views?