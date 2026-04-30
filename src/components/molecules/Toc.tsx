import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"

const Container = styled.div`
  background-color: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 0 0.5px rgba(0, 0, 0, 0.14), 0 1px 1px rgba(0, 0, 0, 0.24);
  padding: 1rem;

  summary {
    list-style: none;
    cursor: pointer;
    padding: 0 0 0.5rem;

    &::-webkit-details-marker {
      display: none;
    }
  }

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

const Header = styled.h3`
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${theme.colors.foreground};
  display: inline-block;
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
    <Container className={className}>
      <details open>
        <summary>
          <Header>Table of Contents</Header>
        </summary>
        <div dangerouslySetInnerHTML={{ __html: contents }} />
      </details>
    </Container>
  )
}
