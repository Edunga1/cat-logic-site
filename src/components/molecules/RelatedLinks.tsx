import React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"
import Details from "../atoms/Details"

const Links = styled.ul`
  list-style: none;
  padding-left: 1rem;
  margin: 0;
  font-size: .875rem;

  > li {
    margin-top: 6px;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    > a {
      &:link {
        color: ${theme.colors.link};
        text-decoration: none;
      }

      &:visited {
        color: ${theme.colors.linkVisited};
      }

      &:hover {
        color: ${theme.colors.linkHover};
        text-decoration: underline;
      }
    }
  }
`

export default function RelatedLinks(
  {
    className,
    children,
  }: {
    className?: string,
    children: JSX.Element[],
  },
) {
  return (
    <div className={className}>
      {children.length > 0 &&
        <Details>
          <>Related</>
          <Links>
            {children.map((child, index) => (
              <li key={index}>{child}</li>
            ))}
          </Links>
        </Details>
      }
    </div>
  )
}
