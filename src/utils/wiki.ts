export function createWikiLink(slug: string) {
  if (slug.startsWith('/')) return `/wiki${slug}`
  return `/wiki/${slug}`
}
