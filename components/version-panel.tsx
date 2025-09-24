'use client';

import { useRef, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { versionComparisonUtils } from '@/lib/version-comparison-utils';
import { cn } from '@/lib/utils';

interface BudgetVersion {
  version: number;
  totalCost: number;
  costLines: Array<{
    costLineName: string;
    totalCost: number;
    status?: string;
  }>;
}

interface VersionPanelProps {
  version: BudgetVersion;
  comparisonVersion?: BudgetVersion;
  highlights?: string[];
  onScroll?: (scrollTop: number) => void;
  scrollTop?: number;
  height: number;
}

export function VersionPanel({
  version,
  comparisonVersion,
  highlights = [],
  onScroll,
  scrollTop = 0,
  height
}: VersionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Sync scroll position
  useEffect(() => {
    if (!isScrolling && scrollRef.current && scrollTop !== undefined) {
      scrollRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop, isScrolling]);
  
  const handleScroll = () => {
    if (scrollRef.current) {
      setIsScrolling(true);
      onScroll?.(scrollRef.current.scrollTop);
      
      // Debounce scroll end
      setTimeout(() => setIsScrolling(false), 150);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-muted/30 sticky top-0 z-10">
        <h3 className="font-semibold">Version {version.version}</h3>
        <p className="text-sm text-muted-foreground">
          Total: {versionComparisonUtils.formatCurrency(version.totalCost)}
        </p>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
        style={{ height: height - 80 }}
      >
        {version.costLines.map((item, index) => {
          const comparisonItem = comparisonVersion?.costLines.find(
            c => c.costLineName === item.costLineName
          );
          
          const change = comparisonItem 
            ? versionComparisonUtils.safePercentage(comparisonItem.totalCost, item.totalCost)
            : null;
          
          const status = comparisonItem
            ? versionComparisonUtils.getChangeStatus(item.totalCost, comparisonItem.totalCost)
            : 'unchanged';
          
          const isHighlighted = highlights.includes(item.costLineName);
          
          return (
            <div 
              key={index}
              className={cn(
                'px-4 py-3 border-b flex items-center justify-between transition-colors hover:bg-muted/50',
                isHighlighted && 'bg-yellow-50',
                status === 'increased' && 'bg-red-50',
                status === 'decreased' && 'bg-green-50'
              )}
            >
              <div className="flex-1">
                <div className="font-medium">{item.costLineName}</div>
                <div className="text-lg">
                  {versionComparisonUtils.formatCurrency(item.totalCost)}
                </div>
              </div>
              
              {change !== null && change !== 0 && (
                <Badge 
                  variant={status === 'increased' ? 'destructive' : status === 'decreased' ? 'outline' : 'secondary'}
                  className="ml-2"
                >
                  {versionComparisonUtils.formatPercentage(change)}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}