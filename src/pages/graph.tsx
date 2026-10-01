import * as React from "react"
import { graphql, HeadFC, PageProps } from "gatsby"
import styled from "styled-components"
import "./global.css"
import Link from "../components/atoms/Link"
import DocGraph, { DocGraphDocs } from "../components/molecules/DocGraph"
import { createWikiLink } from "../utils/wiki"

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
`

const Bar = styled.div`
  flex: none;
  padding: 0.75rem 1rem;
`

const Canvas = styled.div`
  flex: 1;
  min-height: 0;
`

export default function GraphPage({ data }: PageProps<Queries.GraphPageQuery>) {
  const docs = React.useMemo(() => parseGraphDocs(data.allFile.nodes), [data])

  return (
    <Page>
      <Bar>
        <Link href="/">← Home</Link>
      </Bar>
      <Canvas>
        {data.docGraph && <DocGraph graph={data.docGraph} docs={docs} />}
      </Canvas>
    </Page>
  )
}

export const Head: HeadFC = () => <title>Cat Logic - Graph</title>

export const pageQuery = graphql`
  query GraphPage {
    allFile(filter: {childMarkdownRemark: {id: {ne: null}}}) {
      nodes {
        childMarkdownRemark {
          headings(depth: h1) {
            value
          }
          fields {
            slug
          }
        }
      }
    }

    docGraph {
      width
      height
      nodes {
        id
        x
        y
        degree
        community
      }
      edges {
        source
        target
        similarity
      }
    }
  }
`

function parseGraphDocs(nodes: Queries.GraphPageQuery["allFile"]["nodes"]): DocGraphDocs {
  return Object.fromEntries(
    nodes.flatMap(({ childMarkdownRemark }) => {
      const slug = childMarkdownRemark?.fields?.slug
      if (!slug) return []
      return [[
        slug.replace(/^\/|\/$/g, "").normalize("NFC"),
        {
          title: childMarkdownRemark?.headings?.at(0)?.value ?? "(Untitled)",
          path: createWikiLink(slug),
        },
      ]]
    }),
  )
}
