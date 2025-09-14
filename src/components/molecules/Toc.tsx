import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"

const Header = styled.h3`
  margin: 0;
  padding: 1rem 0 .5rem 1rem;
  font-size: 1rem;
  display: inline-block;
`

const Container = styled.div`
  box-sizing: border-box;
  padding: 0 1rem 1rem 0;

  ul {
    list-style: none;
    padding-left: 1rem;
    margin: 0;
    font-size: .875rem;

    p {
      margin: 0;
    }

    li {
      margin-top: 6px;
    }

    li, li code {
      padding: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  // link style
  a {
    text-decoration: none;
    color: ${theme.colors.link};

    &:hover {
      color: ${theme.colors.highlight};
    }
  }
`

export default function Toc(
  {
    className,
    contents,
  }: {
    className?: string,
    contents: string,
  },
) {
  return (
    <div className={className} >
      <details open>
        <summary>
          <Header>Table of Contents</Header>
        </summary>
        <Container dangerouslySetInnerHTML={{ __html: contents }} />
      </details>
    </div>
  )
}
