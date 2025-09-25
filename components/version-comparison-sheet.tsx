'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Columns, Square, Download, ArrowRight } from 'lucide-react';
import { versionComparisonUtils } from '@/lib/version-comparison-utils';
import { WaterfallChart } from './version-comparison-charts-fixed';
import { cn } from '@/lib/utils';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { VersionPanel } from './version-panel';
import { useIsMobile } from '@/hooks/use-mobile';

interface BudgetVersion {
  version: number;
  totalCost: number;
  costLines: Array<{
    costLineName: string;
    totalCost: number;
    status?: string;
  }>;
}

interface ProjectData {
  id: string;
  name: string;
  // Add other project properties as needed
}

interface VersionComparisonSheetProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectData;
  versions: BudgetVersion[];
}

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'baseline' | 'current' | 'increase' | 'decrease' | 'unchanged';
}

function MetricCard({ label, value, subValue, variant = 'baseline' }: MetricCardProps) {
  const variantStyles = {
    baseline: 'bg-blue-50 border-blue-200 text-blue-900',
    current: 'bg-purple-50 border-purple-200 text-purple-900',
    increase: 'bg-red-50 border-red-200 text-red-900',
    decrease: 'bg-green-50 border-green-200 text-green-900',
    unchanged: 'bg-gray-50 border-gray-200 text-gray-900',
  };
  
  return (
    <div className={cn('p-3 rounded-lg border', variantStyles[variant])}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
      {subValue && (
        <div className="text-sm mt-1 opacity-90">{subValue}</div>
      )}
    </div>
  );
}

function UnifiedComparisonView({ v1Data, v2Data }: { v1Data?: BudgetVersion; v2Data?: BudgetVersion }) {
  if (!v1Data || !v2Data) {
    return <div className="p-4 text-center text-muted-foreground">Select versions to compare</div>;
  }
  
  const comparisonData = v1Data.costLines.map(v1Line => {
    const v2Line = v2Data.costLines.find(l => l.costLineName === v1Line.costLineName);
    const change = v2Line ? v2Line.totalCost - v1Line.totalCost : -v1Line.totalCost;
    const changePercent = versionComparisonUtils.safePercentage(v2Line?.totalCost, v1Line.totalCost);
    const status = versionComparisonUtils.getChangeStatus(v1Line.totalCost, v2Line?.totalCost);
    
    return {
      name: v1Line.costLineName,
      v1Cost: v1Line.totalCost,
      v2Cost: v2Line?.totalCost || 0,
      change,
      changePercent,
      status
    };
  });
  
  // Add items that only exist in v2
  v2Data.costLines.forEach(v2Line => {
    if (!v1Data.costLines.find(l => l.costLineName === v2Line.costLineName)) {
      comparisonData.push({
        name: v2Line.costLineName,
        v1Cost: 0,
        v2Cost: v2Line.totalCost,
        change: v2Line.totalCost,
        changePercent: 100,
        status: 'added'
      });
    }
  });
  
  return (
    <div className="space-y-4">
      {/* Waterfall Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Change Waterfall</CardTitle>
          <CardDescription>Visual breakdown of changes between versions</CardDescription>
        </CardHeader>
        <CardContent>
          <WaterfallChart
            data={comparisonData.map(item => ({
              id: item.name,
              category: item.name,
              v1_amount: item.v1Cost,
              v2_amount: item.v2Cost,
              change: item.change
            }))}
            title=""
            description=""
          />
        </CardContent>
      </Card>
      
      {/* Detailed Comparison */}
      <div className="space-y-2">
      {comparisonData.map((item, index) => (
        <div key={index} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-muted-foreground">
                  V{v1Data.version}: {versionComparisonUtils.formatCompactCurrency(item.v1Cost)}
                </span>
                <ArrowRight className="h-3 w-3" />
                <span className="text-sm font-medium">
                  V{v2Data.version}: {versionComparisonUtils.formatCompactCurrency(item.v2Cost)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge 
                variant={item.status === 'increased' ? 'destructive' : item.status === 'decreased' ? 'outline' : 'secondary'}
                className={cn(
                  item.changePercent > 0 && "text-red-600 dark:text-red-400",
                  item.changePercent < 0 && "text-green-600 dark:text-green-400",
                  item.changePercent === 0 && "text-gray-600 dark:text-gray-400"
                )}
              >
                {versionComparisonUtils.getChangeIcon(item.status)} {versionComparisonUtils.formatPercentage(item.changePercent)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {versionComparisonUtils.formatCompactCurrency(item.change)}
              </span>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

export function VersionComparisonSheet({
  isOpen,
  onClose,
  projectData,
  versions
}: VersionComparisonSheetProps) {
  // Initialize with the actual versions being compared
  const [v1, setV1] = useState(versions.length > 0 ? String(versions[0].version) : '0');
  const [v2, setV2] = useState(versions.length > 1 ? String(versions[1].version) : '2');
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(isMobile ? 'unified' : 'split'); 
  const [leftScrollTop, setLeftScrollTop] = useState(0);
  const [rightScrollTop, setRightScrollTop] = useState(0);
  const [syncScroll, setSyncScroll] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(600);
  
  // Calculate metrics with safe math
  const metrics = useMemo(() => {
    const v1Data = versions.find(v => v.version === Number(v1));
    const v2Data = versions.find(v => v.version === Number(v2));
    
    if (!v1Data || !v2Data) return null;
    
    return {
      v1Total: v1Data.totalCost,
      v2Total: v2Data.totalCost,
      change: v2Data.totalCost - v1Data.totalCost,
      changePercent: versionComparisonUtils.safePercentage(
        v2Data.totalCost,
        v1Data.totalCost
      ),
    };
  }, [v1, v2, versions]);
  
  // Measure available height
  useEffect(() => {
    const measureHeight = () => {
      if (contentRef.current) {
        setPanelHeight(contentRef.current.clientHeight);
      }
    };
    
    measureHeight();
    window.addEventListener('resize', measureHeight);
    return () => window.removeEventListener('resize', measureHeight);
  }, []);
  
  // Synchronized scrolling handlers
  const handleLeftScroll = useCallback((scrollTop: number) => {
    if (syncScroll) {
      requestAnimationFrame(() => {
        setRightScrollTop(scrollTop);
      });
    }
  }, [syncScroll]);
  
  const handleRightScroll = useCallback((scrollTop: number) => {
    if (syncScroll) {
      requestAnimationFrame(() => {
        setLeftScrollTop(scrollTop);
      });
    }
  }, [syncScroll]);

  // Adaptive panel sizes based on viewport width
  const getDefaultPanelSizes = useCallback(() => {
    if (typeof window === 'undefined') return [50, 50];
    
    const width = window.innerWidth;
    if (width < 768) return [100, 0]; // Mobile: single panel
    if (width < 1024) return [60, 40]; // Tablet: 60/40 split
    return [50, 50]; // Desktop: equal split
  }, []);

  const [panelSizes, setPanelSizes] = useState(() => getDefaultPanelSizes());

  // Update panel sizes on window resize
  useEffect(() => {
    const handleResize = () => {
      setPanelSizes(getDefaultPanelSizes());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getDefaultPanelSizes]);
  
  // Get data for selected versions
  const v1Data = versions.find(v => v.version === Number(v1));
  const v2Data = versions.find(v => v.version === Number(v2));
  
  // Export functionality
  const handleExport = useCallback(() => {
    const v1Data = versions.find(v => v.version === Number(v1));
    const v2Data = versions.find(v => v.version === Number(v2));
    
    if (!v1Data || !v2Data) return;
    
    const csvHeaders = [
      'Cost Line',
      `Version ${v1} Cost`,
      `Version ${v2} Cost`,
      'Difference',
      'Change %',
      'Status'
    ];
    
    const csvRows: string[][] = [];
    
    // Process all cost lines
    const allCostLines = new Set([
      ...v1Data.costLines.map(l => l.costLineName),
      ...v2Data.costLines.map(l => l.costLineName)
    ]);
    
    allCostLines.forEach(costLine => {
      const v1Line = v1Data.costLines.find(l => l.costLineName === costLine);
      const v2Line = v2Data.costLines.find(l => l.costLineName === costLine);
      
      const v1Cost = v1Line?.totalCost || 0;
      const v2Cost = v2Line?.totalCost || 0;
      const change = v2Cost - v1Cost;
      const changePercent = versionComparisonUtils.safePercentage(v2Cost, v1Cost);
      const status = versionComparisonUtils.getChangeStatus(v1Cost, v2Cost);
      
      csvRows.push([
        costLine,
        v1Cost.toString(),
        v2Cost.toString(),
        change.toString(),
        versionComparisonUtils.formatPercentage(changePercent),
        status
      ]);
    });
    
    // Add totals row
    csvRows.push([
      'TOTAL',
      v1Data.totalCost.toString(),
      v2Data.totalCost.toString(),
      (v2Data.totalCost - v1Data.totalCost).toString(),
      versionComparisonUtils.formatPercentage(metrics?.changePercent || 0),
      ''
    ]);
    
    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `version_comparison_v${v1}_v${v2}_${projectData.name}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [v1, v2, versions, projectData, metrics]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Cmd/Ctrl + E to export
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleExport]);
  
  // Screen reader announcement
  useEffect(() => {
    if (isOpen && metrics) {
      // Create a live region for screen reader announcements
      const announcement = `Budget comparison opened. Comparing version ${v1} at ${versionComparisonUtils.formatCurrency(metrics.v1Total)} to version ${v2} at ${versionComparisonUtils.formatCurrency(metrics.v2Total)}. Change of ${versionComparisonUtils.formatCurrency(metrics.change)} or ${versionComparisonUtils.formatPercentage(metrics.changePercent)}.`;
      
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      document.body.appendChild(liveRegion);
      
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
    }
  }, [isOpen, v1, v2, metrics]);
  
  // Set viewMode to unified on mobile by default
  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('unified');
    }
  }, [isMobile, viewMode]);
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={cn(
          "p-0 flex flex-col",
          isMobile 
            ? "h-[90vh]" 
            : "w-[90vw] max-w-[1200px] lg:w-[1000px] xl:w-[1200px]"
        )}
        aria-describedby="version-comparison-description"
      >
        {/* Fixed Header */}
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Budget Version Comparison</SheetTitle>
            <div className="flex items-center gap-2">
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as 'split' | 'unified')}
              >
                <ToggleGroupItem 
                  value="split" 
                  aria-label="Split view"
                  disabled={isMobile}
                  title={isMobile ? "Split view not available on mobile" : "Split view"}
                >
                  <Columns className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="unified" aria-label="Unified view">
                  <Square className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                aria-label="Export comparison data"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription id="version-comparison-description">
            Compare budget versions for {projectData.name} to track changes and analyze trends
          </SheetDescription>
        </SheetHeader>
        
        {/* Version Selectors */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <Select value={v1} onValueChange={setV1}>
              <SelectTrigger className="w-32" aria-label="Select first version">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem 
                    key={v.version} 
                    value={String(v.version)}
                    disabled={String(v.version) === v2}
                  >
                    Version {v.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            
            <Select value={v2} onValueChange={setV2}>
              <SelectTrigger className="w-32" aria-label="Select second version">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem 
                    key={v.version} 
                    value={String(v.version)}
                    disabled={String(v.version) === v1}
                  >
                    Version {v.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Metrics Summary */}
        {metrics && (
          <div className="p-4 border-b">
            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                label={`Version ${v1}`}
                value={versionComparisonUtils.formatCurrency(metrics.v1Total)}
                variant="baseline"
              />
              <MetricCard
                label={`Version ${v2}`}
                value={versionComparisonUtils.formatCurrency(metrics.v2Total)}
                variant="current"
              />
              <MetricCard
                label="Change"
                value={versionComparisonUtils.formatCurrency(metrics.change)}
                subValue={versionComparisonUtils.formatPercentage(metrics.changePercent)}
                variant={metrics.change > 0 ? 'increase' : metrics.change < 0 ? 'decrease' : 'unchanged'}
              />
            </div>
          </div>
        )}
        
        {/* Content Area */}
        <div ref={contentRef} className="flex-1 overflow-hidden">
          {viewMode === 'split' ? (
            <ResizablePanelGroup 
              direction="horizontal"
              className="h-full"
            >
              <ResizablePanel 
                defaultSize={panelSizes[0]} 
                minSize={30}
                maxSize={70}
              >
                {v1Data && (
                  <VersionPanel
                    version={v1Data}
                    comparisonVersion={v2Data}
                    onScroll={handleLeftScroll}
                    scrollTop={leftScrollTop}
                    height={panelHeight}
                  />
                )}
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel 
                defaultSize={panelSizes[1]}
                minSize={30}
                maxSize={70}
              >
                {v2Data && (
                  <VersionPanel
                    version={v2Data}
                    comparisonVersion={v1Data}
                    onScroll={handleRightScroll}
                    scrollTop={rightScrollTop}
                    height={panelHeight}
                  />
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="p-4 h-full overflow-auto">
              <UnifiedComparisonView 
                v1Data={v1Data}
                v2Data={v2Data}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}