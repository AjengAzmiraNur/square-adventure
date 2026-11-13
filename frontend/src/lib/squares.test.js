import { describe, expect, it } from 'vitest'
import { differences, formulaSteps, isPerfectSquare, square, squareSequence, sub, validateTermInput } from './squares'
import { levelInfo } from './levels'

describe('pola bilangan persegi', () => {
  it('menghasilkan barisan 1, 4, 9, 16, 25, 36', () => {
    expect(squareSequence(6)).toEqual([1, 4, 9, 16, 25, 36])
    expect(square(8)).toBe(64)
  })
  it('selisihnya bilangan ganjil berurutan', () => {
    expect(differences(squareSequence(6))).toEqual([3, 5, 7, 9, 11])
  })
  it('mengenali bilangan persegi', () => {
    expect([1, 4, 49, 400].every(isPerfectSquare)).toBe(true)
    expect([2, 10, 50, 63, -4, 2.25].some(isPerfectSquare)).toBe(false)
  })
  it('membuat subskrip', () => {
    expect(sub(12)).toBe('₁₂')
  })
  it('langkah rumus untuk n = 8', () => {
    expect(formulaSteps(8).at(-1)).toBe('8 × 8 = 64.')
  })
})

describe('validasi kalkulator', () => {
  it.each([
    ['', 'Masukkan'],
    ['  ', 'Masukkan'],
    ['-3', 'negatif'],
    ['2.5', 'desimal'],
    ['2,5', 'desimal'],
    ['abc', 'angka'],
    ['3e2', 'angka'],
    ['0', 'dimulai dari 1'],
    ['1001', 'sampai'],
  ])('menolak %j', (input, msg) => {
    const r = validateTermInput(input)
    expect(r.ok).toBe(false)
    expect(r.error).toContain(msg)
  })
  it('menerima bilangan bulat positif', () => {
    expect(validateTermInput(' 8 ')).toEqual({ ok: true, value: 8 })
    expect(validateTermInput('1000')).toEqual({ ok: true, value: 1000 })
  })
})

describe('level petualang', () => {
  it('cocok dengan ambang backend', () => {
    expect(levelInfo(0).level).toBe(1)
    expect(levelInfo(80).level).toBe(2)
    expect(levelInfo(599).level).toBe(5)
    expect(levelInfo(600)).toMatchObject({ level: 6, next: null })
  })
})
