import * as React from "react"
import styled from "styled-components"
import { Link as GatsbyLink } from "gatsby"
import theme from "../../constants/theme"
import HomeLogo from "../atoms/HomeLogo"
import SearchBox from "../molecules/SearchBox"
import WikiCatalog from "../molecules/WikiCatalog"
import PageLayout from "./layout/PageLayout"

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
`

const GraphButton = styled(GatsbyLink)`
  padding: 0.1rem 0.75rem;
  border: 1px solid ${theme.colors.backgroundHighlight};
  border-radius: 999px;
  color: ${theme.colors.link};
  text-decoration: none;

  &:hover {
    border-color: ${theme.colors.highlight};
    color: ${theme.colors.highlight};
  }
`

const SearchBoxContainer = styled.div`
  width: 75%;
  margin-bottom: 1rem;

  > div {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  > div > :first-child {
    margin-bottom: 0.5rem;
  }
`

export default function Home({
  items,
  setQuery,
}: {
  items: Wiki[];
  setQuery: (arg0: string) => void;
}) {
  return (
    <PageLayout>
      <div>
        <HomeLogo />
        <SearchBoxContainer>
          <div>
            <SearchBox onChange={setQuery} holder=">" />
            <Meta>
              <span>{items.length} docs</span>
              <GraphButton to="/graph/">graph</GraphButton>
            </Meta>
          </div>
        </SearchBoxContainer>
        <WikiCatalog items={items} fallback="No results found :(" />
      </div>
    </PageLayout>
  )
}

export type Wiki = {
  path: string;
  title: string;
  head: string;
  lastModified?: Date;
};
