import { describe, it, expect } from 'vitest'
import { normalizeSeverity } from '../severity'

describe('normalizeSeverity', () => {
  describe('usgs (earthquake magnitude)', () => {
    it('returns critical for M5+', () => {
      expect(normalizeSeverity('usgs', 5.0)).toBe('critical')
      expect(normalizeSeverity('usgs', 7.2)).toBe('critical')
    })

    it('returns high for M4-4.9', () => {
      expect(normalizeSeverity('usgs', 4.0)).toBe('high')
      expect(normalizeSeverity('usgs', 4.9)).toBe('high')
    })

    it('returns moderate for M3-3.9', () => {
      expect(normalizeSeverity('usgs', 3.0)).toBe('moderate')
      expect(normalizeSeverity('usgs', 3.5)).toBe('moderate')
    })

    it('returns low for M<3', () => {
      expect(normalizeSeverity('usgs', 2.5)).toBe('low')
      expect(normalizeSeverity('usgs', 1.0)).toBe('low')
    })
  })

  describe('gdelt (Goldstein scale)', () => {
    it('returns critical for <= -7', () => {
      expect(normalizeSeverity('gdelt', -7)).toBe('critical')
      expect(normalizeSeverity('gdelt', -10)).toBe('critical')
    })

    it('returns high for <= -5', () => {
      expect(normalizeSeverity('gdelt', -5)).toBe('high')
      expect(normalizeSeverity('gdelt', -6.9)).toBe('high')
    })

    it('returns moderate for <= -3', () => {
      expect(normalizeSeverity('gdelt', -3)).toBe('moderate')
      expect(normalizeSeverity('gdelt', -4.9)).toBe('moderate')
    })

    it('returns low for > -3', () => {
      expect(normalizeSeverity('gdelt', -2)).toBe('low')
      expect(normalizeSeverity('gdelt', 5)).toBe('low')
    })
  })

  describe('firms (fire radiative power MW)', () => {
    it('returns critical for > 500MW', () => {
      expect(normalizeSeverity('firms', 501)).toBe('critical')
      expect(normalizeSeverity('firms', 2000)).toBe('critical')
    })

    it('returns high for > 100MW', () => {
      expect(normalizeSeverity('firms', 101)).toBe('high')
      expect(normalizeSeverity('firms', 500)).toBe('high')
    })

    it('returns moderate for > 10MW', () => {
      expect(normalizeSeverity('firms', 11)).toBe('moderate')
      expect(normalizeSeverity('firms', 100)).toBe('moderate')
    })

    it('returns low for <= 10MW', () => {
      expect(normalizeSeverity('firms', 10)).toBe('low')
      expect(normalizeSeverity('firms', 1)).toBe('low')
    })
  })

  it('returns low for unknown feeds', () => {
    expect(normalizeSeverity('unknown', 999)).toBe('low')
  })
})
