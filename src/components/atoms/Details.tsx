import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"

const StyledSummary = styled.summary`
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${theme.colors.foreground};

  // Prevent text selection
  user-select: none;
  -webkit-user-select: none;
`

const StyledDetails = styled.details`
  background-color: #fff;
  box-shadow:
    0 0 0.5px rgba(0, 0, 0, 0.14),
    0 1px 1px rgba(0, 0, 0, 0.24);
  padding: 1rem;

  summary {
    list-style: none;
    cursor: pointer;
    padding: 0 0 0.5rem;

    &::-webkit-details-marker {
      display: none;
    }
  }
`

export default function Details({ children }: { children: JSX.Element[] }) {
  const summaryElement = children[0]
  const restElements = children?.slice(1)
  return (
    <StyledDetails open>
      <StyledSummary>{summaryElement}</StyledSummary>
      {restElements}
    </StyledDetails>
  )
}
