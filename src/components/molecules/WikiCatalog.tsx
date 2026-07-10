import * as React from "react"
import styled from "styled-components"
import Link from "../atoms/Link"
import ColorfulParagraph from "../atoms/ColorfulParagraph"
import Small from "../atoms/Small"
import theme from "../../constants/theme"

const Container = styled.div`
  width: 100%;
  display: flex;

  a {
    color: ${theme.colors.link};
  }
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
  }
`

const HeadCellInner = styled.div`
  display: flex;
  align-items: baseline;
`

const HeadText = styled.span`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DateText = styled.span`
  flex: 0 0 auto;
  margin-left: 0.5rem;
  font-size: 0.7rem;
  color: ${theme.colors.lowlight};
`

export default function WikiList(
  { items, fallback }: WikiListProps,
) {
  const [now, setNow] = React.useState<number | null>(null)
  React.useEffect(() => setNow(Date.now()), [])
  const hasItems = items.length > 0
  return (
    <Container>
      {hasItems
        ? <CatalogTable>
          {items.map((item, i) => (
            <tr key={i}>
              <th>
                <Link href={item.path}>{item.title}</Link>
              </th>
              <td>
                <HeadCellInner>
                  <HeadText>
                    {item.head && <i><Small>{item.head}</Small></i>}
                  </HeadText>
                  {item.lastModified &&
                    <DateText>{formatModified(item.lastModified, now)}</DateText>}
                </HeadCellInner>
              </td>
            </tr>
          ))}
        </CatalogTable>
        : <ColorfulParagraph>{fallback}</ColorfulParagraph>
      }
    </Container>
  )
}

function formatModified(date: Date, now: number | null) {
  if (now !== null) {
    const hours = Math.floor((now - date.getTime()) / 3600000)
    if (hours >= 0 && hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  }
  return date.toLocaleDateString()
}

interface WikiListProps {
  items: { title: string; path: string; head?: string; lastModified?: Date }[]
  fallback?: string
}
