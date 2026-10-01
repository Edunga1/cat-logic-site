import assert from "node:assert"
import { describe, it } from "node:test"
import { buildDocGraph, toDocId } from "./graph"
import Data from "./similarity-result.json"

function pair(x: string, y: string, similarity: number) {
  return [
    { filename_x: x, filename_y: y, similarity },
    { filename_x: y, filename_y: x, similarity },
  ]
}

const pairs = [
  ...pair("a.md", "b.md", 0.9),
  ...pair("a.md", "c.md", 0.5),
  ...pair("b.md", "c.md", 0.6),
  ...pair("a.md", "d.md", 0.4),
  ...pair("b.md", "d.md", 0.3),
  ...pair("c.md", "d.md", 0.8),
  { filename_x: "a.md", filename_y: "a.md", similarity: 1 },
]

describe("toDocId", () => {
  it("drops the extension and keeps directories", () => {
    assert.strictEqual(toDocId("용어/stack.md"), "용어/stack")
  })
})

describe("buildDocGraph", () => {
  it("links each document to its most similar neighbors only once", () => {
    const { edges } = buildDocGraph(pairs, { neighbors: 1 })
    assert.deepStrictEqual(
      edges.map(it => `${it.source}-${it.target}`),
      ["a-b", "c-d"],
    )
  })

  it("never links a document to itself", () => {
    const { edges } = buildDocGraph(pairs, { neighbors: 3 })
    assert.ok(edges.every(it => it.source !== it.target))
  })

  it("counts degree from the selected edges", () => {
    const { nodes } = buildDocGraph(pairs, { neighbors: 1 })
    assert.deepStrictEqual(nodes.map(it => it.degree), [1, 1, 1, 1])
  })

  it("groups linked documents into a community", () => {
    const { nodes } = buildDocGraph(pairs, { neighbors: 1 })
    const community = (id: string) => nodes.find(it => it.id === id)?.community
    assert.strictEqual(community("a"), community("b"))
    assert.strictEqual(community("c"), community("d"))
    assert.notStrictEqual(community("a"), community("c"))
  })

  it("keeps every node inside the canvas", () => {
    const { nodes, width, height } = buildDocGraph(pairs, { width: 400, height: 300 })
    assert.ok(nodes.every(it => it.x >= 0 && it.x <= width && it.y >= 0 && it.y <= height))
  })

  it("is deterministic", () => {
    assert.deepStrictEqual(buildDocGraph(pairs), buildDocGraph(pairs))
  })
})

describe("buildDocGraph with the real similarity data", () => {
  const graph = buildDocGraph(Data)

  it("places every document", () => {
    const ids = new Set(Data.map(it => toDocId(it.filename_x)))
    assert.strictEqual(graph.nodes.length, ids.size)
  })

  it("keeps the graph sparse enough to read", () => {
    assert.ok(graph.edges.length < graph.nodes.length * 3)
  })
})
