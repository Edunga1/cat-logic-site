const { describe, it } = require("node:test")
const assert = require("node:assert/strict")
const plugin = require("./index")

function makeParagraphWithLink(url, text) {
  return {
    type: "paragraph",
    children: [
      {
        type: "link",
        url,
        children: [{ type: "text", value: text || url }],
      },
    ],
  }
}

function makeAST(children) {
  return { type: "root", children }
}

describe("gatsby-remark-youtube", () => {
  it("converts youtube.com/watch?v=ID link to iframe", () => {
    const ast = makeAST([
      makeParagraphWithLink("https://www.youtube.com/watch?v=abc123"),
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "html")
    assert.ok(ast.children[0].value.includes("youtube.com/embed/abc123"))
  })

  it("converts youtu.be link to iframe", () => {
    const ast = makeAST([
      makeParagraphWithLink("https://youtu.be/xyz789"),
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "html")
    assert.ok(ast.children[0].value.includes("youtube.com/embed/xyz789"))
  })

  it("converts youtube.com/live/ID link to iframe", () => {
    const ast = makeAST([
      makeParagraphWithLink("https://www.youtube.com/live/xEqGW7Adqt8"),
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "html")
    assert.ok(ast.children[0].value.includes("youtube.com/embed/xEqGW7Adqt8"))
  })

  it("converts youtube.com without www", () => {
    const ast = makeAST([
      makeParagraphWithLink("https://youtube.com/watch?v=abc123"),
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "html")
    assert.ok(ast.children[0].value.includes("youtube.com/embed/abc123"))
  })

  it("converts t param in seconds to start", () => {
    const ast = makeAST([
      makeParagraphWithLink("https://youtu.be/xEqGW7Adqt8?t=960"),
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "html")
    assert.ok(ast.children[0].value.includes("youtube.com/embed/xEqGW7Adqt8?start=960"))
  })

  it("converts t param in hms format to start in seconds", () => {
    const ast = makeAST([
      makeParagraphWithLink("https://www.youtube.com/watch?v=abc123&t=1h6m57s"),
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "html")
    assert.ok(ast.children[0].value.includes("youtube.com/embed/abc123?start=4017"))
  })

  it("does not convert inline link with other text in paragraph", () => {
    const ast = makeAST([
      {
        type: "paragraph",
        children: [
          { type: "text", value: "Check this: " },
          {
            type: "link",
            url: "https://www.youtube.com/watch?v=abc123",
            children: [{ type: "text", value: "video" }],
          },
        ],
      },
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "paragraph")
  })

  it("does not convert link with custom text", () => {
    const ast = makeAST([
      makeParagraphWithLink("https://youtu.be/xEqGW7Adqt8?t=960", "16:00"),
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "paragraph")
  })

  it("does not convert non-YouTube links", () => {
    const ast = makeAST([
      makeParagraphWithLink("https://example.com"),
    ])
    plugin({ markdownAST: ast })
    assert.equal(ast.children[0].type, "paragraph")
  })
})
