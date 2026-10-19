import { describe, expect, it } from 'vitest'
import { whoName } from '../who'

describe('whoName', () => {
  it('uses the email local part', () => {
    expect(whoName('first.last@example.com')).toBe('first.last')
  })
  it('passes through a string without @', () => {
    expect(whoName('someone')).toBe('someone')
  })
  it('falls back for missing email', () => {
    expect(whoName(null)).toBe('未知')
    expect(whoName(undefined)).toBe('未知')
    expect(whoName('')).toBe('未知')
  })
  it('keeps the whole string when the local part is empty', () => {
    expect(whoName('@example.com')).toBe('@example.com')
  })
})
