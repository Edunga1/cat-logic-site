import * as React from "react"
import { graphql, PageProps } from "gatsby"
import Wiki from "../../components/templates/Wiki"
import { removeFirstHeading } from "../../utils/html-string"
import Link from "../atoms/Link"
import { createWikiLink } from "../../utils/wiki"

export default function BlogPostTemplate(
  { data }: PageProps<Queries.WikiDetailQuery>,
) {
  const {
    tableOfContents,
    html,
  } = data.file?.childMarkdownRemark ?? {}
  const commitLogs = data.file?.fields?.gitLogs || []
  const { hash: gitLogLatestHash, date: gitLogLatestDate } = commitLogs[0] || {}
  const docTitle = extractDocTitle(data)
  const relatedDocs = extractRelatedDocs(data)
  const relatedLinks = relatedDocs.map(doc => {
    return <Link key={doc.slug} href={createWikiLink(doc.slug)}>{doc.title}</Link>
  })
  const gitHubRepositoryUrl = data.site?.siteMetadata?.gitHubRepositoryUrl || undefined

  return (
    <Wiki
      title={docTitle}
      tableOfContents={tableOfContents || ""}
      relatedLinks={relatedLinks}
      wikiContents={removeFirstHeading(html || "")}
      lastModified={gitLogLatestDate ? new Date(gitLogLatestDate) : undefined}
      lastCommitHash={gitLogLatestHash || undefined}
      gitHubRepositoryUrl={gitHubRepositoryUrl}
    />
  )
}

export const pageQuery = graphql`
  query WikiDetail($id: String!) {
    file(childMarkdownRemark: {id: {eq: $id}}) {
      fields {
        gitLogs {
          hash
          date
        }
      }
      childMarkdownRemark {
        headings(depth: h1) {
          value
        }
        fields {
          slug
          relatedDocs {
            slug
            similarity
          }
        }
        tableOfContents
        html
      }
    }
    allMarkdownRemark {
      nodes {
        headings(depth: h1) {
          value
        }
        fields {
          slug
        }
      }
    }
    site {
      siteMetadata {
        gitHubRepositoryUrl
      }
    }
  }
`

export function Head(
  { data }: PageProps<Queries.WikiDetailQuery>,
) {
  const docTitle = extractDocTitle(data)
  return (
    <title>Cat Logic{docTitle && ` - ${docTitle}`}</title>
  )
}

function extractDocTitle(data: Queries.WikiDetailQuery) {
  const { headings } = data.file?.childMarkdownRemark ?? {}
  return headings?.[0]?.value || undefined
}

function extractRelatedDocs(
  data: Queries.WikiDetailQuery,
  threshold = 0.46,
  count = 7,
): {
  slug: string,
  title: string,
  similarity: number,
}[] {
  const relatedDocs = data.file?.childMarkdownRemark?.fields?.relatedDocs || []
  const mostSimilarDocs = relatedDocs
    .filter(x => x.similarity < 1 && x.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count)
  return mostSimilarDocs.map(x => ({
    slug: x.slug,
    title: getDocTitle(x.slug, data),
    similarity: x.similarity,
  }))
}

function getDocTitle(slug: string, data: Queries.WikiDetailQuery) {
  const doc = data.allMarkdownRemark?.nodes.find(x => x.fields?.slug === `/${slug}/`)
  return doc?.headings?.[0]?.value || "?"
}
