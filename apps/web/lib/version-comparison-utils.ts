/**
 * Version Comparison Utilities
 * Safe mathematical operations and formatters for budget version comparison
 */

export const versionComparisonUtils = {
  /**
   * Calculate percentage change safely, handling edge cases like division by zero
   */
  safePercentage: (value: number | null | undefined, base: number | null | undefined): number => {
    // Handle null/undefined
    if (value == null || base == null) return 0;
    
    // Handle division by zero
    if (base === 0) {
      if (value === 0) return 0;
      return value > 0 ? 100 : -100; // Represent as 100% increase/decrease
    }
    
    // Safe calculation with rounding
    return Number(((value - base) / Math.abs(base) * 100).toFixed(2));
  },
  
  /**
   * Safe division operation
   */
  safeDivision: (numerator: number, denominator: number): number => {
    if (denominator === 0) return 0;
    return numerator / denominator;
  },
  
  /**
   * Format currency values with proper null handling
   */
  formatCurrency: (value: number | null | undefined): string => {
    if (value == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },
  
  /**
   * Format currency values in compact notation (1.2M, 988K)
   */
  formatCompactCurrency: (value: number | null | undefined): string => {
    if (value == null) return '$0';
    
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1000000) {
      return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${sign}$${(absValue / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },
  
  /**
   * Format percentage values with proper null handling
   */
  formatPercentage: (value: number | null | undefined): string => {
    if (value == null || Number.isNaN(value)) return '0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  },
  
  /**
   * Determine the status of a change between two values
   */
  getChangeStatus: (v0: number | null | undefined, v2: number | null | undefined): 'added' | 'removed' | 'unchanged' | 'increased' | 'decreased' => {
    const safeV0 = v0 ?? 0;
    const safeV2 = v2 ?? 0;
    
    if (safeV0 === 0 && safeV2 > 0) return 'added';
    if (safeV0 > 0 && safeV2 === 0) return 'removed';
    if (safeV0 === safeV2) return 'unchanged';
    return safeV2 > safeV0 ? 'increased' : 'decreased';
  },
  
  /**
   * Validate if a value is a finite number
   */
  isValidNumber: (value: any): boolean => {
    return typeof value === 'number' && Number.isFinite(value);
  },
  
  /**
   * Safe sum calculation for arrays
   */
  safeSum: (values: (number | null | undefined)[]): number => {
    return values.reduce<number>((sum, value) => {
      const safeValue = Number.isFinite(value) ? (value as number) : 0;
      return sum + safeValue;
    }, 0);
  },
  
  /**
   * Get color class based on change status
   */
  getChangeColorClass: (status: 'added' | 'removed' | 'unchanged' | 'increased' | 'decreased'): string => {
    switch (status) {
      case 'added':
        return 'text-blue-600 bg-blue-50';
      case 'removed':
        return 'text-red-600 bg-red-50';
      case 'increased':
        return 'text-orange-600 bg-orange-50';
      case 'decreased':
        return 'text-green-600 bg-green-50';
      case 'unchanged':
      default:
        return 'text-gray-600 bg-gray-50';
    }
  },
  
  /**
   * Get icon based on change status
   */
  getChangeIcon: (status: 'added' | 'removed' | 'unchanged' | 'increased' | 'decreased'): string => {
    switch (status) {
      case 'added':
        return '⊕'; // Plus in circle
      case 'removed':
        return '⊖'; // Minus in circle
      case 'increased':
        return '↑';
      case 'decreased':
        return '↓';
      case 'unchanged':
      default:
        return '→';
    }
  },
  
  /**
   * Validate and clean version data
   */
  validateVersionData: (data: any): any => {
    if (!data) return null;
    
    return {
      version: Number(data.version) || 0,
      totalCost: Number(data.totalCost) || 0,
      costLines: (data.costLines || []).map((line: any) => ({
        costLineName: line.costLineName || line.cost_line || 'Unknown',
        totalCost: Number(line.totalCost || line.total_cost) || 0,
        status: line.status || 'unchanged',
      })),
    };
  }
};

export default versionComparisonUtils;