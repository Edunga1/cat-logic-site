import assert from "node:assert"
import { describe, it } from "node:test"
import { createWikiLink } from "./wiki"

describe("createWikiLink method", () => {
  describe("when the slug starts with a slash", () => {
    it("returns a link with the slug", () => {
      assert.strictEqual(createWikiLink("/home"), "/wiki/home")
    })
  })

  describe("when the slug does not start with a slash", () => {
    it("returns a link with the slug", () => {
      assert.strictEqual(createWikiLink("home"), "/wiki/home")
    })
  })
})
