import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"
import Details from "../atoms/Details"

const Container = styled.div`
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
    <Container className={className}>
      <Details>
        <>Table of Contents</>
        <div dangerouslySetInnerHTML={{ __html: contents }} />
      </Details>
    </Container>
  )
}
