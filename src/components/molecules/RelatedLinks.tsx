import React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"

const Container = styled.div`
  background-color: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 0 0.5px rgba(0, 0, 0, 0.14), 0 1px 1px rgba(0, 0, 0, 0.24);
  padding: 1rem;
`

const Header = styled.h3`
  margin: 0 0 0.5rem;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${theme.colors.foreground};
`

const Links = styled.ul`
  list-style: none;
  padding-left: 1rem;
  margin: 0;
  font-size: .875rem;

  > li {
    margin-top: 6px;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    > a {
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
  }
`

export default function RelatedLinks(
  {
    className,
    children,
  }: {
    className?: string,
    children: JSX.Element[],
  },
) {
  return (
    <>
      {children.length > 0 &&
        <Container className={className}>
          <Header>Related</Header>
          <Links>
            {children.map((child, index) => (
              <li key={index}>{child}</li>
            ))}
          </Links>
        </Container>
      }
    </>
  )
}
