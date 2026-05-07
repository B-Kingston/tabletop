export interface RecipeSourceLink {
  url: string
  host: string
  faviconUrl: string
}

export function getRecipeSourceLinks(urls: (string | undefined)[]): RecipeSourceLink[] {
  const seen = new Set<string>()

  return urls.flatMap((rawUrl) => {
    if (!rawUrl || seen.has(rawUrl)) return []

    try {
      const url = new URL(rawUrl)
      seen.add(rawUrl)
      const host = url.hostname.replace(/^www\./, '')
      return [{
        url: rawUrl,
        host,
        faviconUrl: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`,
      }]
    } catch {
      return []
    }
  })
}
