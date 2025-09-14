import * as React from "react"
import styled from "styled-components"
import Toc from "../../components/molecules/Toc"
import WikiContent from "../../components/molecules/WikiContent"
import device from "../../constants/device"
import theme from "../../constants/theme"
import Link from "../atoms/Link"
import Comments from "../molecules/Comments"
import HomeLink from "../molecules/HomeLink"
import RelatedLinks from "../molecules/RelatedLinks"
import GitHubCommitLink from "../organisms/GitHubCommitLink"
import PageLayout from "./layout/PageLayout"

const Main = styled.div`
  overflow: auto;
`

const TitleContainer = styled.div`
  display: flex;
  margin: 1rem 0;
  gap: 0.5rem;
`

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${theme.colors.foreground};
`

const TitleBottom = styled.div`
  display: flex;
  justify-content: flex-end;
`

const TocMain = styled(Toc)`
  display: block;

  @media (${device.larger}) {
    display: none;
  }
`

const TocSide = styled(Toc)`
  margin-top: 1rem;
  max-width: 20rem;
`

const RelatedLinksSide = styled(RelatedLinks)``

export default function Wiki({
  title,
  tableOfContents,
  relatedLinks,
  wikiContents,
  lastModified,
  lastCommitHash,
  gitHubRepositoryUrl,
}: {
  title?: string;
  tableOfContents: string;
  relatedLinks: JSX.Element[];
  wikiContents: string;
  lastModified?: Date;
  lastCommitHash?: string;
  gitHubRepositoryUrl?: string;
  activityDates?: Date[];
}) {
  const githubLink = lastModified ? (
    <GitHubCommitLink
      lastModified={lastModified}
      gitHubRepositoryUrl={gitHubRepositoryUrl}
      hash={lastCommitHash}
    />
  ) : null

  return (
    <PageLayout>
      <Main>
        <TitleContainer>
          <HomeLink />
          <Link href=".">
            <Title>{title}</Title>
          </Link>
        </TitleContainer>
        <TitleBottom>{githubLink}</TitleBottom>
        <TocMain contents={tableOfContents} />
        <WikiContent contents={wikiContents} />
        <Comments />
      </Main>
      <RelatedLinksSide>{relatedLinks}</RelatedLinksSide>
      <TocSide contents={tableOfContents} />
    </PageLayout>
  )
}
