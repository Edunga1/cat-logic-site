import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"

const Container = styled.div`
  overflow: auto;
  overflow-wrap: break-word;
  color: ${theme.colors.foreground};
  padding: 1.5rem;
  margin-top: 1rem;
  border-radius: .5rem;
  border: 1px solid rgb(238, 238, 238);
  font-family: Arial, Helvetica, sans-serif;

  // heading style
  h1, h2, h3, h4, h5, h6 {
    margin: 1.5rem 0 .8rem;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }
  h2 {
    &:not(:first-of-type) {
      margin-top: 5rem;
    }
  }

  // text style
  p {
    line-height: 1.6;
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
    overflow: auto;
  }

  // limits image size to prevent image overs container
  img {
    max-width: 100%;
  }

  // quote style
  blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1rem;
    margin-left: 0;
    font-style: italic;
  }

  // table style
  table {
    width: 100%;
    border-collapse: collapse;

    td, th {
      padding: .2rem .5rem;
    }

    thead {
      background-color: ${theme.colors.background};
    }

    tbody {
      font-size: .8rem;

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
  }
`

export default function WikiContent(
  { contents }: { contents: string },
) {
  return (
    <Container dangerouslySetInnerHTML={{ __html: contents }} />
  )
}
