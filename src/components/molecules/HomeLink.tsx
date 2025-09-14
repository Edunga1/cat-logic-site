import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"
import Link from "../atoms/Link"

const Container = styled.div`
  font-size: 1.5rem;
  text-align: right;

  a {
    color: ${theme.colors.foreground};
    opacity: 0.2;
    font-weight: 700;

    &:hover {
      text-decoration: none;
    }

    &:after {
      content: "»";
      margin-left: .1rem;
    }
  }
`

export default function HomeLink() {
  return (
    <Container>
      <Link href="/">CAT</Link>
    </Container>
  )
}
