import * as React from "react"
import styled from "styled-components"

const P = styled.p`
  font-weight: bold;
  --bg-size: 400%;
  --color-one: hsl(15 90% 55%);
  --color-two: hsl(40 95% 55%);
  background: linear-gradient(
      90deg,
      var(--color-one),
      var(--color-two),
      var(--color-one)
    )
    0 0 / var(--bg-size) 100%;
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;

  @media (prefers-reduced-motion: no-preference) {
    animation: move-bg 8s linear infinite;
    @keyframes move-bg {
      to {
        background-position: var(--bg-size) 0;
      }
    }
  }
`

export default function ColorfulParagraph(
  {children}: { children: React.ReactNode }
) {
  return (<P>{children}</P>)
}
