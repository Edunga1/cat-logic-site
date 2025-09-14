import * as React from "react"
import styled from "styled-components"
import { Link as GatsbyLink } from "gatsby"

const StyledGatsbyLink = styled(GatsbyLink)`
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

export default function Link(
  { children, href }: { children: React.ReactNode; href: string },
) {
  return (
    <StyledGatsbyLink to={href}>{children}</StyledGatsbyLink>
  )
}

