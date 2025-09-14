import assert from "node:assert"
import { describe, it } from "node:test"
import { removeFirstHeading } from "./html-string"

describe("removeFirstHeading method", () => {
  describe("when the HTML contains a single <h1> tag", () => {
    it("removes the <h1> tag and its content", () => {
      assert.strictEqual(removeFirstHeading("<h1>Title</h1><p>Content</p>"), "<p>Content</p>")
    })
  })

  describe("when the HTML contains no <h1> tag", () => {
    it("returns the original HTML without modification", () => {
      assert.strictEqual(removeFirstHeading("<p>Content</p>"), "<p>Content</p>")
    })
  })

  describe("when the HTML contains multiple <h1> tags", () => {
    it("removes only the first <h1> tag and leaves the rest", () => {
      assert.strictEqual(
        removeFirstHeading("<h1>Title</h1><h1>Another Title</h1><p>Content</p>"),
        "<h1>Another Title</h1><p>Content</p>"
      )
    })
  })

  describe("when the <h1> tag has attributes", () => {
    it("removes the <h1> tag along with its attributes", () => {
      assert.strictEqual(removeFirstHeading('<h1 class="title">Title</h1><p>Content</p>'), "<p>Content</p>")
    })
  })

  describe("when the input is an empty string", () => {
    it("returns an empty string", () => {
      assert.strictEqual(removeFirstHeading(""), "")
    })
  })
})
