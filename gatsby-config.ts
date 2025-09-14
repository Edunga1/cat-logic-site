import { GatsbyConfig } from "gatsby"
import path from "path"

const config: GatsbyConfig = {
  pathPrefix: process.env.GATSBY_PATH_PREFIX || "/",
  siteMetadata: {
    title: "cat logic",
    siteUrl: process.env.GATSBY_SITE_URL || "https://edunga1.github.io/cat-logic",
    // Unset to empty string otherwise GraphQL type generation will fail
    gitHubRepositoryUrl: process.env.GITHUB_REPOSITORY_URL || "",
  },
  graphqlTypegen: true,
  plugins: [
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "content",
        // Path to the directory where the markdown files to be published are located
        path: process.env.GATSBY_CONTENT_PATH || path.join(__dirname, "docs", "wiki"),
      },
    },
    "gatsby-transformer-gitinfo",
    "gatsby-plugin-sharp",
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 590,
            },
          },
          "gatsby-remark-autolink-headers",
          "gatsby-remark-copy-linked-files",
          "gatsby-remark-relative-linker",
          "gatsby-remark-prismjs",
        ],
      },
    },
    "gatsby-plugin-styled-components",
    "gatsby-plugin-catch-links",
    {
      resolve: "gatsby-plugin-fusejs",
      options: {
        query: `
          query LocalSearch {
            allFile(filter: {childMarkdownRemark: {id: {ne: null}}}) {
              edges {
                node {
                  name
                  childMarkdownRemark {
                    headings(depth: h1) {
                      value
                    }
                    rawMarkdownBody
                    fields {
                      head
                    }
                  }
                }
              }
            }
          }
        `,
        keys: ["rawMarkdownBody", "name"],
        normalizer: ({ data }: { data: Queries.Query }) =>
          data.allFile.edges.map(({ node }) => ({
            name: node.name,
            title: node.childMarkdownRemark?.headings?.[0]?.value,
            rawMarkdownBody: node.childMarkdownRemark?.rawMarkdownBody,
            head: node.childMarkdownRemark?.fields?.head,
          })),
      },
    },
    "gatsby-plugin-sitemap",
    "gatsby-plugin-robots-txt",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        icon: "src/assets/favicon-16x16.png",
      },
    },
    // only works in production. `serve` will work
    {
      resolve: "gatsby-plugin-google-gtag",
      options: {
        trackingIds: process.env.GATSBY_GOOGLE_ANALYTICS_TRACKING_ID ? [process.env.GATSBY_GOOGLE_ANALYTICS_TRACKING_ID] : [],
        gtagConfig: {
          anonymize_ip: true,
        },
        pluginConfig: {
          head: false,
        },
      },
    },
  ],
}

export default config
