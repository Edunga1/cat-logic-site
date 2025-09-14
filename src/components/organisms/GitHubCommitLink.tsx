import React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"

const Container = styled.div`
  font-size: .7rem;
  color: ${theme.colors.lowlight};

  a {
    color: ${theme.colors.lowlight};
    text-decoration: none;
  }
`

export default function GitHubCommitLink(
  {
    lastModified,
    gitHubRepositoryUrl,
    hash,
  }: {
    lastModified: Date,
    gitHubRepositoryUrl?: string,
    hash?: string
  },
) {
  const lastModifiedStr = lastModified.toLocaleString()
  const element = gitHubRepositoryUrl && hash
    ? <a href={`${gitHubRepositoryUrl}/commit/${hash}`}>{lastModifiedStr}</a>
    : <span>{lastModifiedStr}</span>
  return (
    <Container>{element}</Container>
  )
}
