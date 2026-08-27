import * as React from "react"
import styled from "styled-components"
import Details from "../atoms/Details"
import HomeLogo from "../atoms/HomeLogo"
import SearchBox from "../molecules/SearchBox"
import WikiCatalog, { GroupedWikiCatalog } from "../molecules/WikiCatalog"
import WikiIndex from "../molecules/WikiIndex"
import PageLayout from "./layout/PageLayout"

const RECENT_COUNT = 10
const NEW_COUNT = 5
const RANDOM_COUNT = 3

const Counter = styled.div`
  font-size: 0.8rem;
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

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const TimelineSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`

const RerollButton = styled.button`
  border: none;
  padding: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
`

export default function Home({
  items,
  searching,
  setQuery,
}: {
  items: Wiki[];
  searching: boolean;
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
        {searching
          ? <WikiCatalog items={items} fallback="No results found :(" />
          : <Overview items={items} />}
      </div>
    </PageLayout>
  )
}

function Overview({ items }: { items: Wiki[] }) {
  const created = newlyCreated(items)
  const [picks, reroll] = useRandomPicks(items)
  return (
    <Sections>
      <LabeledDetails label="Timeline">
        <TimelineSections>
          <WikiCatalog items={items.slice(0, RECENT_COUNT)} />
          {created.length > 0 && (
            <GroupedWikiCatalog groups={[{ key: "new", label: "New", items: created }]} />
          )}
          {picks.length > 0 && (
            <GroupedWikiCatalog
              groups={[{
                key: "random",
                label: <>Random <RerollButton onClick={reroll} aria-label="pick again">↻</RerollButton></>,
                items: picks,
              }]}
            />
          )}
        </TimelineSections>
      </LabeledDetails>
      <LabeledDetails label="Index">
        <WikiIndex items={items} />
      </LabeledDetails>
    </Sections>
  )
}

function LabeledDetails({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Details>
      <span>{label}</span>
      <>{children}</>
    </Details>
  )
}

function newlyCreated(items: Wiki[]): Wiki[] {
  return items
    .filter(it => it.created)
    .sort((a, b) => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0))
    .slice(0, NEW_COUNT)
}

function useRandomPicks(items: Wiki[]): [Wiki[], () => void] {
  const [picks, setPicks] = React.useState<Wiki[]>([])
  const reroll = React.useCallback(() => {
    const pool = items.concat()
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setPicks(pool.slice(0, RANDOM_COUNT))
  }, [items])
  React.useEffect(() => reroll(), [reroll])
  return [picks, reroll]
}

export type Wiki = {
  path: string;
  title: string;
  head: string;
  created?: Date;
  lastModified?: Date;
};
