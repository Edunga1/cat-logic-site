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

  if (items.length === 0) {
    return <Container><ColorfulParagraph>{fallback}</ColorfulParagraph></Container>
  }

  return (
    <Container>
      {groupItems(items, now).map(group => (
        <Group key={group.key}>
          {group.label && <GroupHeader>{group.label}</GroupHeader>}
          <CatalogTable>
            <tbody>
              {group.items.map((item, i) => (
                <tr key={i}>
                  <th>
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

function dayLabel(dayStart: number, today: number) {
  if (dayStart === today) return "Today"
  if (dayStart === today - DAY) return "Yesterday"
  const d = new Date(dayStart)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}`
}

function groupItems(items: WikiItem[], now: number | null): Group[] {
  if (now === null) {
    return [{ key: "all", label: null, items }]
  }

  const today = startOfDay(now)
  const weekAgo = today - 6 * DAY
  const groups: Group[] = []
  const older: WikiItem[] = []
  let currentDay: number | null = null

  for (const item of items) {
    const modified = item.lastModified?.getTime()
    if (modified === undefined || modified < weekAgo) {
      older.push(item)
      continue
    }
    const day = startOfDay(modified)
    if (day !== currentDay) {
      currentDay = day
      groups.push({ key: `d${day}`, label: dayLabel(day, today), items: [] })
    }
    groups[groups.length - 1].items.push(item)
  }

  if (older.length > 0) {
    groups.push({ key: "earlier", label: groups.length > 0 ? "Earlier" : null, items: older })
  }
  return groups
}

interface WikiItem {
  title: string
  path: string
  head?: string
  lastModified?: Date
}

interface Group {
  key: string
  label: string | null
  items: WikiItem[]
}

interface WikiListProps {
  items: WikiItem[]
  fallback?: string
}
