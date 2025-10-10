import { router } from '../../trpc'
import { createForecastVersion } from './create-forecast-version.procedure'
import { getForecastVersions } from './get-forecast-versions.procedure'
import { getForecastData } from './get-forecast-data.procedure'  // Direct import
import { getComparisonData } from './get-comparison-data.procedure'  // Direct import
import { deleteForecastVersion } from './delete-forecast-version.procedure'  // Direct import

export const forecastsRouter = router({
  createForecastVersion,
  getForecastVersions,
  getForecastData,  // Primary going forward - Direct reference (no spread)
  getComparisonData,  // New - Direct reference (no spread)
  deleteForecastVersion,  // New - Direct reference (no spread)
})
