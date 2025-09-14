import React, { useEffect } from "react"
import styled from "styled-components"

const Container = styled.div`
  padding-top: 20rem;
`

export default function Comments() {
  const commentsInjectionRoot: React.RefObject<HTMLDivElement> = React.createRef()

  useEffect(() => {
    if (commentsInjectionRoot.current?.children.length === 0) {
      const scriptEl = document.createElement("script")
      scriptEl.setAttribute("src", "https://utteranc.es/client.js")
      scriptEl.setAttribute("crossorigin", "anonymous")
      scriptEl.setAttribute("async", "true")
      scriptEl.setAttribute(
        "repo",
        "edunga1/cat-logic-comments"
      )
      scriptEl.setAttribute("issue-term", "pathname")
      scriptEl.setAttribute("theme", "github-light")
      commentsInjectionRoot.current?.appendChild(scriptEl)
    }
  }, [])

  return (
    <Container>
      <hr />
      <div ref={commentsInjectionRoot} />
    </Container>
  )
}
