const visit = require("unist-util-visit")

function parseTime(value) {
  if (/^\d+$/.test(value)) return value
  let seconds = 0
  const h = value.match(/(\d+)h/)
  const m = value.match(/(\d+)m/)
  const s = value.match(/(\d+)s/)
  if (h) seconds += parseInt(h[1]) * 3600
  if (m) seconds += parseInt(m[1]) * 60
  if (s) seconds += parseInt(s[1])
  return String(seconds)
}

function extractYouTubeInfo(url) {
  try {
    const parsed = new URL(url)
    let videoId = null
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      const liveMatch = parsed.pathname.match(/^\/live\/(.+)/)
      videoId = liveMatch ? liveMatch[1] : parsed.searchParams.get("v")
    } else if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1)
    }
    if (!videoId) return null
    const t = parsed.searchParams.get("t")
    const start = t ? parseTime(t) : null
    return { videoId, start }
  } catch {
    return null
  }
}

module.exports = ({ markdownAST }) => {
  visit(markdownAST, "paragraph", (node, index, parent) => {
    if (node.children.length !== 1 || node.children[0].type !== "link") {
      return
    }

    const link = node.children[0]
    const linkText =
      link.children.length === 1 && link.children[0].type === "text"
        ? link.children[0].value
        : null
    if (linkText !== link.url) return

    const info = extractYouTubeInfo(link.url)
    if (!info) return

    const embedUrl = info.start
      ? `https://www.youtube.com/embed/${info.videoId}?start=${info.start}`
      : `https://www.youtube.com/embed/${info.videoId}`
    const iframeHTML = `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`

    parent.children.splice(index, 1, {
      type: "html",
      value: iframeHTML,
    })
  })

  return markdownAST
}
