export function createWikiLink(slug: string) {
  if (slug.startsWith('/')) return `/wiki${slug}`
  return `/wiki/${slug}`
}

const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"]
const DOUBLE_CHOSEONG: Record<string, string> = { "ㄲ": "ㄱ", "ㄸ": "ㄷ", "ㅃ": "ㅂ", "ㅆ": "ㅅ", "ㅉ": "ㅈ" }
const INITIAL_ORDER = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"]

export function getTitleInitial(title: string): string {
  const ch = title.trim().charAt(0)
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const choseong = CHOSEONG[Math.floor((code - 0xac00) / 588)]
    return DOUBLE_CHOSEONG[choseong] ?? choseong
  }
  if (/[a-z]/i.test(ch)) return ch.toUpperCase()
  return "#"
}

export function compareInitials(a: string, b: string): number {
  return initialRank(a) - initialRank(b)
}

function initialRank(initial: string): number {
  if (/[A-Z]/.test(initial)) return initial.charCodeAt(0)
  const hangul = INITIAL_ORDER.indexOf(initial)
  if (hangul >= 0) return 100 + hangul
  return 200
}
