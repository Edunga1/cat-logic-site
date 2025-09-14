import * as React from "react"
import styled from "styled-components"

const InputBorder = styled.div`
  max-width: fit-content;
  font-size: 0;
  padding: 2px;

  // gardient border
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
  @media (prefers-reduced-motion: no-preference) {
    animation: move-bg 8s linear infinite;
    @keyframes move-bg {
      to {
        background-position: var(--bg-size) 0;
      }
    }
  }
`

const Input = styled.input`
  border: none;
  outline: none;
  min-width: 1rem;
  height: 1.5rem;
`

export default function SearchBox(
  {
    onChange,
    holder = "",
  }: {
    onChange: (query: string) => void,
    holder?: string,
  }
) {

  return (
    <InputBorder>
      <Input
        type="text"
        onChange={(e) => onChange(e.target.value)}
        placeholder={holder}
      />
    </InputBorder>
  )
}

