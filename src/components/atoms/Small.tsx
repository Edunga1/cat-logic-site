import * as React from "react"
import styled from "styled-components"
import theme from "../../constants/theme"

const S = styled.small`
  margin-left: .5rem;
  color: ${theme.colors.foreground};
  word-break: keep-all;
`

export default function Small(
  { children }: { children: React.ReactNode },
) {
  return (
    <S>{children}</S>
  )
}
