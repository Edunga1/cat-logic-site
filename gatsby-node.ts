import { GatsbyNode, Node } from "gatsby"
import { createFilePath } from "gatsby-source-filesystem"
import path from "path"
import getRelatedDocs from "./src/related-docs/RelatedDocs"

export const onCreateNode: GatsbyNode["onCreateNode"] = ({
  node,
  actions: { createNodeField },
  getNode,
}) => {
  if (node.internal.type === "MarkdownRemark") {
    createNodeField({
      name: "slug",
      node,
      value: createFilePath({ node, getNode }),
    })

    createNodeField({
      name: "head",
      node,
      value: getHead(node),
    })

    createNodeField({
      name: "relatedDocs",
      node,
      value: parseRelatedDocs(node),
    })
  }
}

export const createSchemaCustomization: GatsbyNode["createSchemaCustomization"] =
  ({ actions: { createTypes } }) => {
    createTypes(
      `
      type MarkdownRemark implements Node {
        fields: Fields
      }
      type Doc {
        slug: String!
        similarity: Float!
      }
      type Fields {
        relatedDocs: [Doc!]!
      }
    `,
    )
  }

export const createPages: GatsbyNode["createPages"] = async ({
  graphql,
  actions: { createPage },
}) => {
  const wikiTemplate = path.resolve("src/components/gatsby-templates/Wiki.tsx")
  const query = graphql<Queries.PagesLoadedQuery>(
    `
      query PagesLoaded($limit: Int!) {
        allMarkdownRemark(limit: $limit) {
          edges {
            node {
              id
              fields {
                slug
              }
            }
          }
        }
      }
    `,
    { limit: 1000 },
  )
  return query.then((result) => {
    if (result.errors) {
      throw result.errors
    }

    result.data?.allMarkdownRemark.edges.forEach((edge) => {
      createPage({
        path: path.join("wiki", edge.node.fields?.slug ?? ""),
        component: wikiTemplate,
        context: {
          id: edge.node.id,
        },
      })
    })
  })
}

//- Helpers

// TODO: heading 제외하도록 개선 필요
function getHead(node: Node) {
  const content = node.internal.content ?? ""
  const regex = /^#[^#].*\n*(.+)/gm
  const matched = regex.exec(content)?.at(1) ?? ""
  return matched.replace(/^[#\s]*/, "").trim()
}

function parseRelatedDocs(node: Node) {
  type FieldSlug = {
    fields?: {
      slug?: string;
    };
  };
  const slug = (node as FieldSlug).fields?.slug as string | undefined
  if (!slug) return []
  return getRelatedDocs(slug).map((x) => ({
    slug: x.path.replace(/.md$/, ""),
    similarity: x.similarity,
  }))
}
