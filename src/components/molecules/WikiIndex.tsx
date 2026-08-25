import * as React from "react"
import styled from "styled-components"
import Link from "../atoms/Link"
import theme from "../../constants/theme"
import device from "../../constants/device"
import { compareInitials, getTitleInitial } from "../../utils/wiki"

const Columns = styled.div`
  a {
    color: ${theme.colors.link};
  }

  @media (${device.larger}) {
    columns: 2;
    column-gap: 2rem;
  }
`

const Group = styled.section`
  break-inside: avoid;
  margin-bottom: 1rem;
`

const Initial = styled.h3`
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: ${theme.colors.lowlight};
`

const Row = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.1rem 0;
`

export default function WikiIndex({ items }: WikiIndexProps) {
  return (
    <Columns>
      {groupByInitial(items).map(group => (
        <Group key={group.initial}>
          <Initial>{group.initial}</Initial>
          {group.items.map((item, i) => (
            <Row key={i}>
              <Link href={item.path}>{item.title}</Link>
            </Row>
          ))}
        </Group>
      ))}
    </Columns>
  )
}

function groupByInitial(items: IndexItem[]): InitialGroup[] {
  const buckets = new Map<string, IndexItem[]>()
  for (const item of items) {
    const initial = getTitleInitial(item.title)
    buckets.set(initial, [...(buckets.get(initial) ?? []), item])
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => compareInitials(a, b))
    .map(([initial, grouped]) => ({
      initial,
      items: grouped.concat().sort((a, b) => a.title.localeCompare(b.title, "ko")),
    }))
}

interface IndexItem {
  title: string
  path: string
}

interface InitialGroup {
  initial: string
  items: IndexItem[]
}

interface WikiIndexProps {
  items: IndexItem[]
}
