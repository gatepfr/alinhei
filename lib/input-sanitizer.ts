const MAX_CURRICULO = 15_000
const MAX_VAGA = 5_000

export function sanitizeCurriculo(text: string): { text: string; truncated: boolean } {
  const normalized = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim()
  if (normalized.length <= MAX_CURRICULO) return { text: normalized, truncated: false }
  return { text: normalized.slice(0, MAX_CURRICULO), truncated: true }
}

export function sanitizeVaga(text: string): { text: string; truncated: boolean } {
  const normalized = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim()
  if (normalized.length <= MAX_VAGA) return { text: normalized, truncated: false }
  return { text: normalized.slice(0, MAX_VAGA), truncated: true }
}
