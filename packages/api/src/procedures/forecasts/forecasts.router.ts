import { router } from '../../trpc'
import { createForecastVersion } from './create-forecast-version.procedure'
import { getForecastVersions } from './get-forecast-versions.procedure'
import { getForecastDataEnhanced } from './get-forecast-data-enhanced.procedure'  // Direct import
import { getComparisonData } from './get-comparison-data.procedure'  // Direct import
import { deleteForecastVersion } from './delete-forecast-version.procedure'  // Direct import

export const forecastsRouter = router({
  createForecastVersion,
  getForecastVersions,
  getForecastDataEnhanced,  // Primary going forward - Direct reference (no spread)
  getComparisonData,  // New - Direct reference (no spread)
  deleteForecastVersion,  // New - Direct reference (no spread)
})
