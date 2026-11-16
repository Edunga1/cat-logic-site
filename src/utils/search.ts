export interface SearchMatch {
  key?: string
  value?: string
  indices: readonly [number, number][]
}

export interface Snippet {
  before: string
  match: string
  after: string
}

export function extractSnippet(
  matches: readonly SearchMatch[] | undefined,
  key: string,
  { before = 15, after = 60 } = {},
): Snippet | undefined {
  const match = matches?.find(it => it.key === key)
  if (!match?.value || match.indices.length === 0) return undefined

  const [start, end] = match.indices.reduce((longest, it) =>
    it[1] - it[0] > longest[1] - longest[0] ? it : longest,
  )
  const value = match.value
  const flatten = (s: string) => s.replace(/\s+/g, " ")
  return {
    before: flatten(value.slice(Math.max(0, start - before), start)),
    match: flatten(value.slice(start, end + 1)),
    after: flatten(value.slice(end + 1, end + 1 + after)),
  }
}
