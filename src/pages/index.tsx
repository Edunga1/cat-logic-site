import * as React from "react"
import { graphql, HeadFC, PageProps } from "gatsby"
import "./global.css"
import { createWikiLink } from "../utils/wiki"
import { useGatsbyPluginFusejs } from "react-use-fusejs"
import Home, { Wiki } from "../components/templates/Home"

export default function IndexPage(
  { data }: PageProps<Queries.IndexPageQuery>,
) {
  const allItems = parseWikiItems(data.allFile.nodes)
  const [items, setItems] = React.useState(allItems)
  const [query, setQuery] = React.useState("")
  const result = useGatsbyPluginFusejs(query, data.fusejs)

  React.useEffect(() => {
    if (query) {
      setItems(mapSearchResultToWikiItem(result))
    } else {
      setItems(allItems)
    }
  }, [query, result])

  return (
    <Home
      items={items}
      setQuery={setQuery}
    />
  )
}

export const Head: HeadFC = () => <title>Cat Logic - Home</title>

export const pageQuery = graphql`
  query IndexPage {
    allFile(
      filter: {childMarkdownRemark: {id: {ne: null}}}
      sort: {fields: {gitLogs: {date: DESC}}}
    ) {
      nodes {
        name
        childMarkdownRemark {
          headings(depth: h1) {
            value
          }
          fields {
            slug
            head
          }
          frontmatter {
            created
          }
        }
        fields {
          gitLogs {
            date
          }
        }
      }
    }

    # search data
    fusejs {
      index
      data
    }
  }
`
interface SearchResult {
  item: { name: string; title: string; head: string }
  refIndex: number
}

function mapSearchResultToWikiItem(result: SearchResult[]): Wiki[] {
  return result
    .map(it => ({
      path: createWikiLink(it.item.name),
      title: it.item.title ?? "(Untitled)",
      head: it.item.head ?? "",
    }))
}

function parseWikiItems(nodes: Queries.IndexPageQuery["allFile"]["nodes"]): Wiki[] {
  return nodes
    .concat()
    .map(({ childMarkdownRemark, fields }) => {
      const gitLogLatestDate = fields?.gitLogs?.at(0)?.date
      const lastModified = gitLogLatestDate ? new Date(gitLogLatestDate) : undefined
      const created = childMarkdownRemark?.frontmatter?.created ? new Date(childMarkdownRemark.frontmatter.created) : undefined
      return {
        path: createWikiLink(childMarkdownRemark?.fields?.slug ?? ""),
        title: childMarkdownRemark?.headings?.at(0)?.value ?? "(Untitled)",
        head: childMarkdownRemark?.fields?.head ?? "",
        lastModified: lastModified ?? created,
      }
    })
    .sort((a, b) => {
      const aa = a.lastModified?.getTime() ?? 0
      const bb = b.lastModified?.getTime() ?? 0
      return bb - aa
    })
}
