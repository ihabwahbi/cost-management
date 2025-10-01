export function buildInFilter(values: Array<string | null | undefined>): string | null {
  const sanitized = values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  if (sanitized.length === 0) {
    return null
  }

  const quotedValues = sanitized.map(value => {
    // PostgREST expects double quotes around UUID/text values; escape embedded quotes.
    const escaped = value.replace(/"/g, '""')
    return `"${escaped}"`
  })

  return `(${quotedValues.join(',')})`
}
