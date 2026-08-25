import assert from "node:assert"
import { describe, it } from "node:test"
import { compareInitials, createWikiLink, getTitleInitial } from "./wiki"

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

describe("getTitleInitial method", () => {
  it("returns the uppercase letter for an alphabet title", () => {
    assert.strictEqual(getTitleInitial("airflow"), "A")
  })

  it("returns the choseong for a hangul title", () => {
    assert.strictEqual(getTitleInitial("고양이"), "ㄱ")
  })

  it("returns the single consonant for a double choseong", () => {
    assert.strictEqual(getTitleInitial("까치"), "ㄱ")
  })

  it("returns # for other characters", () => {
    assert.strictEqual(getTitleInitial("2025"), "#")
    assert.strictEqual(getTitleInitial(""), "#")
  })

  it("ignores leading whitespace", () => {
    assert.strictEqual(getTitleInitial(" cat"), "C")
  })
})

describe("compareInitials method", () => {
  it("sorts alphabet, hangul, then others", () => {
    const subject = ["ㄴ", "#", "B", "ㄱ", "A"].sort(compareInitials)
    assert.deepStrictEqual(subject, ["A", "B", "ㄱ", "ㄴ", "#"])
  })
})
