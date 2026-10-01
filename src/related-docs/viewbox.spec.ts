import assert from "node:assert"
import { describe, it } from "node:test"
import {
  fitViewBox,
  isZoomed,
  MAX_ZOOM,
  panViewBox,
  refitViewBox,
  zoomedViewBox,
  zoomViewBox,
} from "./viewbox"

const full = { width: 800, height: 400 }

describe("fitViewBox", () => {
  it("shows the whole graph when the element has the graph's aspect", () => {
    assert.deepStrictEqual(fitViewBox(full, 2), { x: 0, y: 0, w: 800, h: 400 })
  })

  it("adds side margins for a wider element", () => {
    assert.deepStrictEqual(fitViewBox(full, 4), { x: -400, y: 0, w: 1600, h: 400 })
  })

  it("adds top and bottom margins for a taller element", () => {
    assert.deepStrictEqual(fitViewBox(full, 0.5), { x: 0, y: -600, w: 800, h: 1600 })
  })
})

describe("zoomViewBox", () => {
  const fit = fitViewBox(full, 2)

  it("keeps the point under the cursor fixed", () => {
    const view = zoomViewBox(fit, 2, 600, 100, full, fit)
    assert.ok(Math.abs((600 - fit.x) / fit.w - (600 - view.x) / view.w) < 1e-9)
    assert.strictEqual(view.w, 400)
    assert.strictEqual(view.h, 200)
  })

  it("keeps the element's aspect ratio", () => {
    const tall = fitViewBox(full, 0.5)
    const view = zoomViewBox(tall, 3, 400, 200, full, tall)
    assert.ok(Math.abs(view.w / view.h - 0.5) < 1e-9)
  })

  it("never zooms out beyond the fit", () => {
    assert.deepStrictEqual(zoomViewBox(fit, 0.1, 400, 200, full, fit), fit)
  })

  it("never zooms in beyond the limit", () => {
    assert.strictEqual(zoomViewBox(fit, 1000, 400, 200, full, fit).w, fit.w / MAX_ZOOM)
  })

  it("stays inside the graph after zooming near a corner", () => {
    const view = zoomViewBox(fit, 4, 800, 400, full, fit)
    assert.ok(view.x + view.w <= full.width && view.y + view.h <= full.height)
  })
})

describe("zoomedViewBox", () => {
  it("starts centered on the graph at the requested zoom", () => {
    const fit = fitViewBox(full, 2)
    const view = zoomedViewBox(fit, 2, full)
    assert.deepStrictEqual(view, { x: 200, y: 100, w: 400, h: 200 })
  })
})

describe("panViewBox", () => {
  const fit = fitViewBox(full, 2)
  const zoomed = zoomedViewBox(fit, 2, full)

  it("moves the view opposite to the drag", () => {
    const view = panViewBox(zoomed, 50, 20, full)
    assert.strictEqual(view.x, zoomed.x - 50)
    assert.strictEqual(view.y, zoomed.y - 20)
  })

  it("cannot be dragged outside the graph", () => {
    const view = panViewBox(zoomed, -10000, -10000, full)
    assert.strictEqual(view.x, full.width - zoomed.w)
    assert.strictEqual(view.y, full.height - zoomed.h)
  })
})

describe("refitViewBox", () => {
  it("keeps the zoom level and the center when the element's aspect changes", () => {
    const before = fitViewBox(full, 2)
    const after = fitViewBox(full, 0.5)
    const view = zoomedViewBox(before, 2, full)
    const next = refitViewBox(view, before, after, full)
    assert.ok(Math.abs(after.w / next.w - 2) < 1e-9)
    assert.ok(Math.abs(next.x + next.w / 2 - 400) < 1e-9)
    assert.ok(Math.abs(next.w / next.h - 0.5) < 1e-9)
  })
})

describe("isZoomed", () => {
  it("is false at the fit and true once zoomed", () => {
    const fit = fitViewBox(full, 2)
    assert.strictEqual(isZoomed(fit, fit), false)
    assert.strictEqual(isZoomed(zoomedViewBox(fit, 2, full), fit), true)
  })
})
