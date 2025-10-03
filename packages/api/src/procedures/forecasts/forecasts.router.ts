import { router } from '../../trpc'
import { createForecastVersion } from './create-forecast-version.procedure'
import { getForecastVersions } from './get-forecast-versions.procedure'
import { getForecastData } from './get-forecast-data.procedure'

export const forecastsRouter = router({
  createForecastVersion,
  getForecastVersions,
  getForecastData,
})
