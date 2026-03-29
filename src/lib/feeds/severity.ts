type Severity = 'critical' | 'high' | 'moderate' | 'low'

export function normalizeSeverity(feed: string, rawValue: number): Severity {
  switch (feed) {
    case 'usgs':
      // Earthquake magnitude (Richter-like)
      if (rawValue >= 5) return 'critical'
      if (rawValue >= 4) return 'high'
      if (rawValue >= 3) return 'moderate'
      return 'low'

    case 'gdelt':
      // Goldstein scale: -10 (most conflict) to +10 (most cooperative)
      if (rawValue <= -7) return 'critical'
      if (rawValue <= -5) return 'high'
      if (rawValue <= -3) return 'moderate'
      return 'low'

    case 'firms':
      // Fire Radiative Power in MW
      if (rawValue > 500) return 'critical'
      if (rawValue > 100) return 'high'
      if (rawValue > 10) return 'moderate'
      return 'low'

    default:
      return 'low'
  }
}

// NWS uses text severity levels rather than numeric values
export function mapNWSSeverity(nwsSeverity: string): Severity {
  switch (nwsSeverity) {
    case 'Extreme':
      return 'critical'
    case 'Severe':
      return 'high'
    case 'Moderate':
      return 'moderate'
    default:
      return 'low'
  }
}
