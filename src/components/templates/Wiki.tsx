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

const backgroundPattern =
  "data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cline%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%2240%22%20y2%3D%2240%22%20stroke%3D%22%23c4b07a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%224%206%22%20stroke-linecap%3D%22round%22/%3E%3Cline%20x1%3D%2240%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%2240%22%20stroke%3D%22%23c4b07a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%224%206%22%20stroke-linecap%3D%22round%22/%3E%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%221.5%22%20fill%3D%22%23c4b07a%22/%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%220%22%20r%3D%221.5%22%20fill%3D%22%23c4b07a%22/%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2240%22%20r%3D%221.5%22%20fill%3D%22%23c4b07a%22/%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%2240%22%20r%3D%221.5%22%20fill%3D%22%23c4b07a%22/%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221.5%22%20fill%3D%22%23c4b07a%22/%3E%3C/svg%3E"

const Main = styled.div`
  overflow: auto;

  ::before {
    content: "";
    background-image: url("${backgroundPattern}");
    background-color: ${theme.colors.background};
    opacity: 0.2;
    inset: 0;
    position: fixed;
    z-index: -1;
  }
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
