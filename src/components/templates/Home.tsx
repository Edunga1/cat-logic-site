import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"
import HomeLogo from "../atoms/HomeLogo"
import SearchBox from "../molecules/SearchBox"
import WikiCatalog from "../molecules/WikiCatalog"
import PageLayout from "./layout/PageLayout"

const Counter = styled.div`
  font-size: 0.8rem;
  color: ${theme.fonts.body};
`

const SearchBoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 1rem;

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
            <Counter>{items.length} docs</Counter>
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
