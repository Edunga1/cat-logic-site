export type SimilarityPair = {
  filename_x: string;
  filename_y: string;
  similarity: number;
}

export type GraphNode = {
  id: string;
  x: number;
  y: number;
  degree: number;
  community: number;
}

export type GraphEdge = {
  source: string;
  target: string;
  similarity: number;
}

export type DocGraph = {
  width: number;
  height: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

type Options = {
  neighbors?: number;
  width?: number;
  height?: number;
  iterations?: number;
  seed?: number;
}

const PADDING = 24

export function buildDocGraph(
  pairs: SimilarityPair[],
  {
    neighbors = 3,
    width = 760,
    height = 460,
    iterations = 300,
    seed = 1,
  }: Options = {},
): DocGraph {
  const edges = selectEdges(pairs, neighbors)
  const ids = Array.from(new Set(edges.flatMap(it => [it.source, it.target]))).sort()
  const adjacency = toAdjacency(ids, edges)
  const communities = detectCommunities(ids, adjacency)
  const positions = layout(ids, edges, { width, height, iterations, seed })

  return {
    width,
    height,
    nodes: ids.map(id => ({
      id,
      x: positions.get(id)?.x ?? 0,
      y: positions.get(id)?.y ?? 0,
      degree: adjacency.get(id)?.size ?? 0,
      community: communities.get(id) ?? 0,
    })),
    edges,
  }
}

export function toDocId(filename: string): string {
  return filename.replace(/\.md$/, "").normalize("NFC")
}

function selectEdges(pairs: SimilarityPair[], neighbors: number): GraphEdge[] {
  const byDoc = new Map<string, { id: string; similarity: number }[]>()
  for (const { filename_x, filename_y, similarity } of pairs) {
    const x = toDocId(filename_x)
    const y = toDocId(filename_y)
    if (x === y) continue
    if (!byDoc.has(x)) byDoc.set(x, [])
    byDoc.get(x)?.push({ id: y, similarity })
  }

  const edges = new Map<string, GraphEdge>()
  for (const [source, candidates] of byDoc) {
    candidates
      .sort((a, b) => b.similarity - a.similarity || a.id.localeCompare(b.id))
      .slice(0, neighbors)
      .forEach(({ id, similarity }) => {
        const [a, b] = [source, id].sort()
        edges.set(`${a}\n${b}`, { source: a, target: b, similarity })
      })
  }

  return Array.from(edges.values())
    .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target))
}

function toAdjacency(ids: string[], edges: GraphEdge[]): Map<string, Map<string, number>> {
  const adjacency = new Map(ids.map(id => [id, new Map<string, number>()]))
  for (const { source, target, similarity } of edges) {
    adjacency.get(source)?.set(target, similarity)
    adjacency.get(target)?.set(source, similarity)
  }
  return adjacency
}

function detectCommunities(
  ids: string[],
  adjacency: Map<string, Map<string, number>>,
): Map<string, number> {
  const label = new Map(ids.map((id, i) => [id, i]))

  for (let round = 0; round < 20; round++) {
    let changed = false
    for (const id of ids) {
      const weights = new Map<number, number>()
      for (const [neighbor, weight] of adjacency.get(id) ?? []) {
        const l = label.get(neighbor) ?? 0
        weights.set(l, (weights.get(l) ?? 0) + weight)
      }
      const best = Array.from(weights.entries())
        .sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0]
      if (best !== undefined && best !== label.get(id)) {
        label.set(id, best)
        changed = true
      }
    }
    if (!changed) break
  }

  const sizes = new Map<number, number>()
  label.forEach(l => sizes.set(l, (sizes.get(l) ?? 0) + 1))
  const order = Array.from(sizes.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([l]) => l)
  return new Map(ids.map(id => [id, order.indexOf(label.get(id) ?? 0)]))
}

function layout(
  ids: string[],
  edges: GraphEdge[],
  { width, height, iterations, seed }: Required<Pick<Options, "width" | "height" | "iterations" | "seed">>,
): Map<string, { x: number; y: number }> {
  const random = mulberry32(seed)
  const index = new Map(ids.map((id, i) => [id, i]))
  const n = ids.length
  const x = ids.map(() => random() * width)
  const y = ids.map(() => random() * height)
  const k = Math.sqrt((width * height) / Math.max(n, 1)) * 0.9
  const links = edges.map(it => [index.get(it.source) ?? 0, index.get(it.target) ?? 0])

  for (let step = 0; step < iterations; step++) {
    const temperature = (width / 10) * (1 - step / iterations) + 0.5
    const dx = new Array<number>(n).fill(0)
    const dy = new Array<number>(n).fill(0)

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let vx = x[i] - x[j]
        let vy = y[i] - y[j]
        const distance = Math.max(Math.hypot(vx, vy), 0.01)
        const force = (k * k) / distance
        vx /= distance
        vy /= distance
        dx[i] += vx * force
        dy[i] += vy * force
        dx[j] -= vx * force
        dy[j] -= vy * force
      }
    }

    for (const [a, b] of links) {
      const vx = x[a] - x[b]
      const vy = y[a] - y[b]
      const distance = Math.max(Math.hypot(vx, vy), 0.01)
      const force = (distance * distance) / k
      dx[a] -= (vx / distance) * force
      dy[a] -= (vy / distance) * force
      dx[b] += (vx / distance) * force
      dy[b] += (vy / distance) * force
    }

    for (let i = 0; i < n; i++) {
      dx[i] += (width / 2 - x[i]) * 0.05
      dy[i] += (height / 2 - y[i]) * 0.05
      const length = Math.max(Math.hypot(dx[i], dy[i]), 0.01)
      const move = Math.min(length, temperature)
      x[i] += (dx[i] / length) * move
      y[i] += (dy[i] / length) * move
    }
  }

  return fit(ids, x, y, width, height)
}

function fit(
  ids: string[],
  x: number[],
  y: number[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const [minX, maxX] = [Math.min(...x), Math.max(...x)]
  const [minY, maxY] = [Math.min(...y), Math.max(...y)]
  const scaleX = (width - PADDING * 2) / Math.max(maxX - minX, 1)
  const scaleY = (height - PADDING * 2) / Math.max(maxY - minY, 1)
  return new Map(ids.map((id, i) => [id, {
    x: round(PADDING + (x[i] - minX) * scaleX),
    y: round(PADDING + (y[i] - minY) * scaleY),
  }]))
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
