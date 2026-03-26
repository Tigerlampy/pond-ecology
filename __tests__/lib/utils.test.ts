import { getSeasonFromDate, formatDate, formatCount } from '@/lib/utils'

describe('getSeasonFromDate', () => {
  it('3월은 봄', () => expect(getSeasonFromDate('2026-03-15')).toBe('봄'))
  it('7월은 여름', () => expect(getSeasonFromDate('2026-07-10')).toBe('여름'))
  it('10월은 가을', () => expect(getSeasonFromDate('2026-10-20')).toBe('가을'))
  it('12월은 겨울', () => expect(getSeasonFromDate('2026-12-01')).toBe('겨울'))
  it('2월은 겨울', () => expect(getSeasonFromDate('2026-02-14')).toBe('겨울'))
})

describe('formatDate', () => {
  it('YYYY.MM.DD 형식 반환', () => {
    expect(formatDate('2026-03-26T09:00:00Z')).toBe('2026.03.26')
  })
})

describe('formatCount', () => {
  it('1마리', () => expect(formatCount(1)).toBe('1마리'))
  it('5마리', () => expect(formatCount(5)).toBe('5마리'))
})
