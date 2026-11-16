import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { extractSnippet } from "./search"

describe("extractSnippet", () => {
  const value = "0123456789 hello\nworld abcdefghij"

  it("returns the longest matched range with surrounding text", () => {
    const snippet = extractSnippet(
      [{ key: "body", value, indices: [[0, 0], [11, 15]] }],
      "body",
      { before: 3, after: 6 },
    )
    assert.deepEqual(snippet, { before: "89 ", match: "hello", after: " world" })
  })

  it("returns undefined when the key did not match", () => {
    assert.equal(extractSnippet([{ key: "name", value, indices: [[0, 1]] }], "body"), undefined)
    assert.equal(extractSnippet(undefined, "body"), undefined)
  })
})
