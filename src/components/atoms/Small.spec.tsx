import { describe, it } from "node:test"
import assert from "node:assert/strict"
import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"

import Small from "./Small"

describe("Small component", () => {
  describe("rendering", () => {
    cleanup()

    render(<Small>Hello</Small>)

    it("children을 small 태그로 감싼다", () => {
      const text = screen.getByText("Hello")
      assert.equal(text.tagName, "SMALL")
    })

    it("foreground 색상은 #333333 이다", () => {
      const text = screen.getByText("Hello")
      assert.equal(getComputedStyle(text).color, "rgb(51, 51, 51)")
    })
  })
})
