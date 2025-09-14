export function removeFirstHeading(html: string): string {
  return html.replace(/<h1.*?>(.*?)<\/h1>/, '')
}
