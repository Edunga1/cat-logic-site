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
    font-weight: normal;
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
                {item.head && <i><Small>{item.head}</Small></i>}
              </td>
            </tr>
          ))}
        </CatalogTable>
        : <ColorfulParagraph>{fallback}</ColorfulParagraph>
      }
    </Container>
  )
}

interface WikiListProps {
  items: { title: string; path: string; head?: string }[]
  fallback?: string
}
