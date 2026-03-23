import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"

const Container = styled.div`
  overflow: auto;
  overflow-wrap: break-word;
  background-color: #fff;
  color: ${theme.colors.foreground};
  padding: 2rem 2.5rem;
  margin-top: 1rem;
  border-radius: .5rem;
  border: 1px solid rgb(238, 238, 238);
  font-family: Arial, Helvetica, sans-serif;
  max-width: 48rem;

  // heading style
  h1, h2, h3, h4, h5, h6 {
    margin: 2rem 0 1rem;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }
  h2 {
    &:not(:first-of-type) {
      margin-top: 5rem;
    }
  }
  h3 {
    margin-top: 3rem;
    border-bottom: none;
  }
  h4, h5, h6 {
    margin-top: 2rem;
    border-bottom: none;
  }

  // text style
  p {
    line-height: 1.8;
    margin: 1.2rem 0;
  }

  // list style
  ul, ol {
    line-height: 1.8;

    li {
      margin: 0.4rem 0;
    }
  }

  // link style
  a {
    &:link {
      color: ${theme.colors.link};
      text-decoration: none;
    }

    &:visited {
      color: ${theme.colors.linkVisited};
    }

    &:hover {
      color: ${theme.colors.linkHover};
      text-decoration: underline;
    }
  }

  // inline code block style
  code:not(pre code) {
    font-size: 80%;
    background-color: #e3e6e8;
    border-radius: 4px;
    padding: 2px 4px;
    word-break: break-word;
  }

  // code block style
  pre:has(code) {
    font-size: 85%;
    background-color: #f5f5f5;
    border-radius: .5rem;
    padding: 1rem;
    margin: 1.5rem 0;
    overflow: auto;
  }

  // limits image size to prevent image overs container
  img {
    max-width: 100%;
  }

  // quote style
  blockquote {
    border-left: 4px solid ${theme.colors.lowlight};
    background-color: ${theme.colors.background};
    padding: 1rem 1rem 1rem 1.5rem;
    margin: 1.5rem 0;
    border-radius: 0 .5rem .5rem 0;
    font-style: italic;
  }

  // table style
  table {
    width: 100%;
    border-collapse: collapse;

    td, th {
      padding: .5rem .75rem;
    }

    thead {
      background-color: ${theme.colors.background};
    }

    tbody {
      font-size: .875rem;

      tr:nth-child(even) {
        background-color: ${theme.colors.background};
      }

      tr:hover {
        background-color: ${theme.colors.backgroundHighlight};
      }
    }
  }

  // hr style
  hr {
    border: none;
    border-top: 1px dashed #aaa;
    margin: 2.5rem 0;
  }
`

export default function WikiContent(
  { contents }: { contents: string },
) {
  return (
    <Container dangerouslySetInnerHTML={{ __html: contents }} />
  )
}
