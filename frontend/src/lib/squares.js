// Utilitas matematika pola bilangan persegi (murni, mudah diuji).

export const square = (n) => n * n

export const isPerfectSquare = (x) => {
  if (!Number.isInteger(x) || x < 0) return false
  const r = Math.round(Math.sqrt(x))
  return r * r === x
}

export const squareSequence = (count, start = 1) =>
  Array.from({ length: count }, (_, i) => square(start + i))

export const differences = (seq) => seq.slice(1).map((v, i) => v - seq[i])

const SUB = '₀₁₂₃₄₅₆₇₈₉'
export const sub = (n) => String(n).replace(/[0-9]/g, (d) => SUB[Number(d)])

export const formatId = (n) => Number(n).toLocaleString('id-ID')

export const MAX_TERM = 1000

/**
 * Validasi input nomor suku untuk Formula Calculator.
 * @returns {{ok: true, value: number} | {ok: false, error: string}}
 */
export function validateTermInput(raw) {
  const text = String(raw ?? '').trim()
  if (text === '') return { ok: false, error: 'Masukkan nomor suku terlebih dahulu.' }
  if (/^-/.test(text)) return { ok: false, error: 'Nomor suku tidak boleh negatif. Mulailah dari 1.' }
  if (/^[0-9]+[.,][0-9]*$/.test(text)) return { ok: false, error: 'Nomor suku harus bilangan bulat, bukan desimal.' }
  if (!/^[0-9]+$/.test(text)) return { ok: false, error: 'Nomor suku hanya boleh berisi angka.' }
  const value = Number(text)
  if (value === 0) return { ok: false, error: 'Nomor suku dimulai dari 1, bukan 0.' }
  if (value > MAX_TERM) return { ok: false, error: `Masukkan nomor suku dari 1 sampai ${formatId(MAX_TERM)}.` }
  return { ok: true, value }
}

/** Langkah perhitungan Uₙ = n² untuk ditampilkan. */
export function formulaSteps(n) {
  return [
    `Diketahui nomor suku n = ${n}.`,
    `Rumus pola bilangan persegi: U${sub('n')} = n².`,
    `U${sub(n)} = ${n}² = ${n} × ${n}.`,
    `${n} × ${n} = ${formatId(square(n))}.`,
  ]
}
