import * as React from "react"
import styled from "styled-components"
import Link from "../atoms/Link"
import ColorfulParagraph from "../atoms/ColorfulParagraph"
import Small from "../atoms/Small"
import theme from "../../constants/theme"

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;

  a {
    color: ${theme.colors.link};
  }
`

const Group = styled.section`
  & + & {
    margin-top: 1.75rem;
  }
`

const GroupHeader = styled.h2`
  width: 40%;
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: right;
  color: ${theme.colors.lowlight};
`

const CatalogTable = styled.table`
  margin: 0;
  padding: 0;
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;

  th {
    width: 40%;
    padding: 0.2rem 0;
    text-align: right;
  }

  td {
    padding: 0;
    width: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export default function WikiList(
  { items, fallback }: WikiListProps,
) {
  const [now, setNow] = React.useState<number | null>(null)
  React.useEffect(() => setNow(Date.now()), [])

  return <GroupedWikiCatalog groups={groupItems(items, now)} fallback={fallback} />
}

export function GroupedWikiCatalog(
  { groups, fallback }: GroupedWikiCatalogProps,
) {
  if (groups.every(group => group.items.length === 0)) {
    return <Container><ColorfulParagraph>{fallback}</ColorfulParagraph></Container>
  }

  return (
    <Container>
      {groups.map(group => (
        <Group key={group.key}>
          {group.label && <GroupHeader>{group.label}</GroupHeader>}
          <CatalogTable>
            <tbody>
              {group.items.map((item, i) => (
                <tr key={i}>
                  <th style={{ fontWeight: "normal" }}>
                    <Link href={item.path}>{item.title}</Link>
                  </th>
                  <td>
                    {item.head && <i><Small>{item.head}</Small></i>}
                  </td>
                </tr>
              ))}
            </tbody>
          </CatalogTable>
        </Group>
      ))}
    </Container>
  )
}

const DAY = 86400000

function startOfDay(ts: number) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function groupItems(items: WikiItem[], now: number | null): Group[] {
  if (now === null) {
    return [{ key: "all", label: null, items }]
  }

  const today = startOfDay(now)
  const weekAgo = today - 6 * DAY
  const buckets: Record<string, WikiItem[]> = { today: [], week: [], earlier: [] }

  for (const item of items) {
    const modified = item.lastModified?.getTime()
    if (modified === undefined || modified < weekAgo) {
      buckets.earlier.push(item)
    } else if (modified >= today) {
      buckets.today.push(item)
    } else {
      buckets.week.push(item)
    }
  }

  const groups: Group[] = []
  if (buckets.today.length > 0) {
    groups.push({ key: "today", label: "Today", items: buckets.today })
  }
  if (buckets.week.length > 0) {
    groups.push({ key: "week", label: "This week", items: buckets.week })
  }
  if (buckets.earlier.length > 0) {
    groups.push({ key: "earlier", label: groups.length > 0 ? "Earlier" : null, items: buckets.earlier })
  }
  return groups
}

interface WikiItem {
  title: string
  path: string
  head?: string
  lastModified?: Date
}

export interface Group {
  key: string
  label: React.ReactNode
  items: WikiItem[]
}

interface WikiListProps {
  items: WikiItem[]
  fallback?: string
}

interface GroupedWikiCatalogProps {
  groups: Group[]
  fallback?: string
}
