import assert from "node:assert"
import { describe, it } from "node:test"
import getRelatedDocs from "./RelatedDocs"

const toPath = (name: string) => `/any/path/${name}`

describe("getRelatedDocs method", () => {
  describe("when the filepath basename exists in data (reverse-engineering.md)", () => {
    it("returns a non-empty related docs list", () => {
      const filename = "reverse-engineering.md"
      const result = getRelatedDocs(toPath(filename))
      assert.ok(Array.isArray(result) && result.length > 0)
    })
  })

  describe("when the filepath basename does not exist in data", () => {
    it("returns an empty array", () => {
      const result = getRelatedDocs("/no/such/file-xyz-123.md")
      assert.deepStrictEqual(result, [])
    })
  })
})
