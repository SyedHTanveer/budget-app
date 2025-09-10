import { describe, it, expect } from 'vitest'
import { classifyUtilization, computeCycleProgress, classifyUsagePercent } from './severity'

const baseDates = () => {
  const now = new Date('2025-09-01T12:00:00Z')
  const cycleStart = new Date('2025-09-01T00:00:00Z')
  const cycleEnd = new Date('2025-09-30T23:59:59Z')
  const nextPayDate = new Date('2025-09-15T00:00:00Z')
  return { now, cycleStart, cycleEnd, nextPayDate }
}

describe('computeCycleProgress', () => {
  it('returns 0 early', () => {
    const { now, cycleStart, cycleEnd } = baseDates()
    expect(computeCycleProgress(cycleStart, cycleEnd, cycleStart)).toBe(0)
  })
})

describe('classifyUtilization basic usage thresholds', () => {
  it('good below 50%', () => {
    const { now, cycleStart, cycleEnd, nextPayDate } = baseDates()
    const r = classifyUtilization({
      spent: 400,
      totalBudget: 1000,
      now, cycleStart, cycleEnd, nextPayDate,
      recurringBills: [], cashOnHand: 2000, metricType: 'spend'
    })
    expect(r.level).toBe('good')
  })

  it('caution 50-85%', () => {
    const { now, cycleStart, cycleEnd, nextPayDate } = baseDates()
    const r = classifyUtilization({
      spent: 600,
      totalBudget: 1000,
      now, cycleStart, cycleEnd, nextPayDate,
      recurringBills: [], cashOnHand: 2000, metricType: 'spend'
    })
    expect(r.level).toBe('caution')
  })

  it('danger above 85%', () => {
    const { now, cycleStart, cycleEnd, nextPayDate } = baseDates()
    const r = classifyUtilization({
      spent: 900,
      totalBudget: 1000,
      now, cycleStart, cycleEnd, nextPayDate,
      recurringBills: [], cashOnHand: 2000, metricType: 'spend'
    })
    expect(r.level).toBe('danger')
  })
})

describe('classifyUsagePercent helper', () => {
  it('good under 50%', () => {
    expect(classifyUsagePercent(0.49)).toBe('good')
  })
  it('caution 50-85%', () => {
    expect(classifyUsagePercent(0.75)).toBe('caution')
  })
  it('danger above 85%', () => {
    expect(classifyUsagePercent(0.9)).toBe('danger')
  })
})

describe('pace adjustments', () => {
  it('escalates fast early pace after threshold', () => {
    // Simulate later in cycle to trigger pace check
    const cycleStart = new Date('2025-09-01T00:00:00Z')
    const cycleEnd = new Date('2025-09-30T23:59:59Z')
    const now = new Date('2025-09-10T12:00:00Z')
    const nextPayDate = new Date('2025-09-15T00:00:00Z')
    const r = classifyUtilization({
      spent: 480, // 48% spent at ~30% progress -> paceRatio > 1.25
      totalBudget: 1000,
      now, cycleStart, cycleEnd, nextPayDate,
      recurringBills: [], cashOnHand: 2000, metricType: 'spend'
    })
    expect(r.level === 'caution' || r.level === 'danger').toBeTruthy()
  })
})

describe('reserve pressure', () => {
  it('forces danger when deficit > 25%', () => {
    const { now, cycleStart, cycleEnd, nextPayDate } = baseDates()
    const r = classifyUtilization({
      spent: 200, // would be good
      totalBudget: 1000,
      now, cycleStart, cycleEnd, nextPayDate,
      recurringBills: [ { amount: 1000, dueDate: new Date('2025-09-10') } ],
      cashOnHand: 600, // deficit 400 / 1000 = 40% > 25%
      metricType: 'spend'
    })
    expect(r.level).toBe('danger')
  })
})

describe('income change shortcut', () => {
  it('income increase returns good', () => {
    const { now, cycleStart, cycleEnd, nextPayDate } = baseDates()
    const r = classifyUtilization({
      spent: 0,
      totalBudget: 1000,
      now, cycleStart, cycleEnd, nextPayDate,
      recurringBills: [], cashOnHand: 0,
      metricType: 'incomeChange', incomeDelta: 500
    })
    expect(r.level).toBe('good')
  })
})
