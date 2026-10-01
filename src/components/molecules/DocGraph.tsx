import * as React from "react"
import styled, { keyframes } from "styled-components"
import { navigate } from "gatsby"
import theme from "../../constants/theme"
import device from "../../constants/device"
import {
  fitViewBox,
  isZoomed,
  panViewBox,
  refitViewBox,
  zoomedViewBox,
  zoomViewBox,
  ViewBox,
} from "../../related-docs/viewbox"

const HUB_COUNT = 6
const LABEL_MAX_LENGTH = 16
const DRIFT_AMPLITUDE = 4
const DRIFT_EASING = 0.08
const STEP_MS = 1000 / 60
const MAX_FRAME_MS = 100
const GRAB: Grab = { homeStiffness: 0.03, linkStiffness: 0.05, damping: 0.82 }
const GLIDE: Glide = { rate: 0.0001, power: 2, minSpeed: 0.5, topSpeed: 6, smoothing: 0.1 }
const DRAG_THRESHOLD = 5
const BUTTON_ZOOM = 1.5
const WHEEL_ZOOM = 0.002
const MOBILE_ZOOM = 2.5

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.18);
  }
`

const Frame = styled.figure`
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  background: #fff;
  overflow: hidden;
`

const Svg = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  touch-action: none;

  .node {
    cursor: grab;
    outline: none;
    transition: opacity 0.15s;
    touch-action: none;
  }

  .hub .dot {
    transform-box: fill-box;
    transform-origin: center;
    animation: ${pulse} 3.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .hub .dot {
      animation: none;
    }
  }

  .label {
    font-size: calc(12px * var(--k, 1));
    fill: ${theme.colors.foreground};
    paint-order: stroke;
    stroke: #fff;
    stroke-width: calc(4px * var(--k, 1));
    stroke-linejoin: round;
    pointer-events: none;
  }

  .label.active {
    font-size: calc(14px * var(--k, 1));
    font-weight: 700;
  }

  .label.related {
    font-size: calc(6px * var(--k, 1));
    stroke-width: calc(2px * var(--k, 1));
  }
`

const Controls = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border: 1px solid ${theme.colors.backgroundHighlight};
    border-radius: 0.25rem;
    background: rgba(255, 255, 255, 0.9);
    color: ${theme.colors.foreground};
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
  }

  button:hover {
    border-color: ${theme.colors.highlight};
    color: ${theme.colors.highlight};
  }
`

export type DocGraphData = {
  readonly width: number;
  readonly height: number;
  readonly nodes: ReadonlyArray<{
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly degree: number;
    readonly community: number;
  }>;
  readonly edges: ReadonlyArray<{
    readonly source: string;
    readonly target: string;
    readonly similarity: number;
  }>;
}

export type DocGraphDocs = Record<string, { title: string; path: string }>

type Gesture =
  | { kind: "node"; id: string; index: number; pointerId: number; startX: number; startY: number; moved: boolean }
  | { kind: "pan"; pointerId: number; startX: number; startY: number; startView: ViewBox }
  | { kind: "pinch"; startDistance: number; startCenter: { x: number; y: number }; startView: ViewBox }

export default function DocGraph(
  { graph, docs }: { graph: DocGraphData; docs: DocGraphDocs },
) {
  const [active, setActive] = React.useState<string>()
  const [featured, setFeatured] = React.useState<ReadonlySet<string>>()
  const pointerType = React.useRef("mouse")
  const svgRef = React.useRef<SVGSVGElement>(null)
  const activeRef = React.useRef<string>()
  const suppressClick = React.useRef(false)
  const dragging = React.useRef(false)
  const controls = React.useRef<{ zoomBy: (factor: number) => void; reset: () => void }>()
  activeRef.current = active

  const nodes = React.useMemo(
    () => graph.nodes.filter(it => docs[it.id]),
    [graph, docs],
  )
  const edges = React.useMemo(
    () => graph.edges.filter(it => docs[it.source] && docs[it.target]),
    [graph, docs],
  )
  const neighbors = React.useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const { source, target } of edges) {
      if (!map.has(source)) map.set(source, new Set())
      if (!map.has(target)) map.set(target, new Set())
      map.get(source)?.add(target)
      map.get(target)?.add(source)
    }
    return map
  }, [edges])
  const hubs = React.useMemo(
    () => new Set(
      [...nodes].sort((a, b) => b.degree - a.degree).slice(0, HUB_COUNT).map(it => it.id),
    ),
    [nodes],
  )
  const byId = React.useMemo(() => new Map(nodes.map(it => [it.id, it])), [nodes])
  const shown = featured ?? hubs

  React.useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const full = { width: graph.width, height: graph.height }
    const index = new Map(nodes.map((node, i) => [node.id, i]))
    const links = edges.map(it => [index.get(it.source) ?? 0, index.get(it.target) ?? 0] as const)
    const sim = createMotion(nodes, links)
    const waves = nodes.map((_, i) => ({
      speed: 0.25 + (i % 7) * 0.04,
      phaseX: i * 1.7,
      phaseY: i * 2.3,
    }))

    const startView = (from: ViewBox) =>
      window.matchMedia(`(${device.larger})`).matches ? from : zoomedViewBox(from, MOBILE_ZOOM, full)
    let fit = fitViewBox(full, full.width / full.height)
    let initial = fit
    let view = fit
    let ready = false
    let gesture: Gesture | undefined
    const pointers = new Map<number, { x: number; y: number }>()
    let strength = 1
    let wasIdle = false
    let moving = false
    let last = 0
    let carry = 0
    let frame = 0

    const syncLabelScale = () => {
      const width = svg.getBoundingClientRect().width
      if (width > 0) svg.style.setProperty("--k", String(view.w / width))
    }
    const applyView = () => {
      svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`)
      syncLabelScale()
    }
    const onResize = () => {
      const rect = svg.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const next = fitViewBox(full, rect.width / rect.height)
      view = ready ? refitViewBox(view, fit, next, full) : startView(next)
      initial = startView(next)
      fit = next
      ready = true
      applyView()
    }
    const toSvg = (clientX: number, clientY: number, from: ViewBox = view) => {
      const rect = svg.getBoundingClientRect()
      return {
        x: from.x + ((clientX - rect.left) * from.w) / rect.width,
        y: from.y + ((clientY - rect.top) * from.h) / rect.height,
      }
    }
    const zoomAt = (factor: number, cx: number, cy: number) => {
      view = zoomViewBox(view, factor, cx, cy, full, fit)
      applyView()
    }

    controls.current = {
      zoomBy: factor => zoomAt(factor, view.x + view.w / 2, view.y + view.h / 2),
      reset: () => {
        view = initial
        applyView()
      },
    }

    const render = (time: number) => {
      const offsets = nodes.map((_, i) => {
        if (strength === 0) return { dx: 0, dy: 0 }
        const { speed, phaseX, phaseY } = waves[i]
        return {
          dx: DRIFT_AMPLITUDE * strength * (
            0.7 * Math.sin(time * speed + phaseX) + 0.3 * Math.sin(time * speed * 2.3 + phaseY)
          ),
          dy: DRIFT_AMPLITUDE * strength * (
            0.7 * Math.cos(time * speed * 0.8 + phaseY) + 0.3 * Math.cos(time * speed * 1.9 + phaseX)
          ),
        }
      })
      const shift = (i: number) => ({
        x: sim.x[i] - nodes[i].x + offsets[i].dx,
        y: sim.y[i] - nodes[i].y + offsets[i].dy,
      })

      svg.querySelectorAll<SVGElement>("[data-drift-node]").forEach(el => {
        const i = index.get(el.dataset.driftNode ?? "")
        if (i === undefined) return
        const { x, y } = shift(i)
        el.setAttribute("transform", `translate(${x} ${y})`)
      })
      svg.querySelectorAll<SVGLineElement>("line[data-drift-source]").forEach(el => {
        const a = index.get(el.dataset.driftSource ?? "")
        const b = index.get(el.dataset.driftTarget ?? "")
        if (a === undefined || b === undefined) return
        el.setAttribute("x1", String(nodes[a].x + shift(a).x))
        el.setAttribute("y1", String(nodes[a].y + shift(a).y))
        el.setAttribute("x2", String(nodes[b].x + shift(b).x))
        el.setAttribute("y2", String(nodes[b].y + shift(b).y))
      })
    }

    const tick = (now: number) => {
      carry = Math.min(carry + (last ? now - last : STEP_MS), MAX_FRAME_MS)
      last = now
      while (carry >= STEP_MS) {
        moving = sim.step()
        carry -= STEP_MS
      }
      const interacting = activeRef.current !== undefined || sim.isPinned()
      const target = reduceMotion || interacting || moving ? 0 : 1
      strength += (target - strength) * DRIFT_EASING
      if (target === 0 && strength < 0.005) strength = 0

      const idle = !moving && strength === 0
      if (!(idle && wasIdle)) render(now / 1000)
      wasIdle = idle
      frame = requestAnimationFrame(tick)
    }

    const startPinch = () => {
      if (gesture?.kind === "node" && gesture.moved) suppressClick.current = true
      sim.release()
      const [a, b] = Array.from(pointers.values())
      gesture = {
        kind: "pinch",
        startDistance: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1),
        startCenter: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        startView: view,
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 2) return startPinch()
      if (pointers.size > 2) return

      const nodeEl = (e.target as Element).closest<SVGElement>("g.node")
      const id = nodeEl?.dataset.driftNode
      const nodeIndex = id === undefined ? undefined : index.get(id)
      if (id !== undefined && nodeIndex !== undefined) {
        gesture = {
          kind: "node", id, index: nodeIndex, pointerId: e.pointerId,
          startX: e.clientX, startY: e.clientY, moved: false,
        }
      } else {
        setActive(undefined)
        if (isZoomed(view, fit)) {
          gesture = {
            kind: "pan", pointerId: e.pointerId,
            startX: e.clientX, startY: e.clientY, startView: view,
          }
        }
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (!gesture) return

      if (gesture.kind === "pinch") {
        if (pointers.size < 2) return
        const [a, b] = Array.from(pointers.values())
        const distance = Math.hypot(a.x - b.x, a.y - b.y)
        const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const anchor = toSvg(gesture.startCenter.x, gesture.startCenter.y, gesture.startView)
        const zoomed = zoomViewBox(
          gesture.startView, distance / gesture.startDistance, anchor.x, anchor.y, full, fit,
        )
        const rect = svg.getBoundingClientRect()
        view = panViewBox(
          zoomed,
          ((center.x - gesture.startCenter.x) * zoomed.w) / rect.width,
          ((center.y - gesture.startCenter.y) * zoomed.h) / rect.height,
          full,
        )
        applyView()
        return
      }

      if (gesture.pointerId !== e.pointerId) return

      if (gesture.kind === "pan") {
        const rect = svg.getBoundingClientRect()
        view = panViewBox(
          gesture.startView,
          ((e.clientX - gesture.startX) * gesture.startView.w) / rect.width,
          ((e.clientY - gesture.startY) * gesture.startView.h) / rect.height,
          full,
        )
        applyView()
        return
      }

      if (!gesture.moved) {
        if (Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) < DRAG_THRESHOLD) return
        gesture.moved = true
        dragging.current = true
        setActive(gesture.id)
      }
      const point = toSvg(e.clientX, e.clientY)
      sim.pin(
        gesture.index,
        Math.min(Math.max(point.x, 0), full.width),
        Math.min(Math.max(point.y, 0), full.height),
      )
    }

    const onPointerEnd = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return
      if (gesture?.kind === "pinch") {
        if (pointers.size < 2) gesture = undefined
        return
      }
      if (gesture && gesture.pointerId === e.pointerId) {
        if (gesture.kind === "node" && gesture.moved) {
          suppressClick.current = true
          window.setTimeout(() => { suppressClick.current = false }, 0)
          const under = document.elementFromPoint(e.clientX, e.clientY)?.closest<SVGElement>("g.node")
          if (e.pointerType === "mouse" && under?.dataset.driftNode !== gesture.id) setActive(undefined)
        }
        dragging.current = false
        sim.release()
        gesture = undefined
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const point = toSvg(e.clientX, e.clientY)
      zoomAt(Math.exp(-e.deltaY * WHEEL_ZOOM), point.x, point.y)
    }
    const onDoubleClick = (e: MouseEvent) => {
      if ((e.target as Element).closest("g.node")) return
      controls.current?.reset()
    }
    const onTouchMove = (e: TouchEvent) => {
      if (gesture) e.preventDefault()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (svg.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
      setActive(undefined)
    }

    svg.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerEnd)
    window.addEventListener("pointercancel", onPointerEnd)
    svg.addEventListener("wheel", onWheel, { passive: false })
    svg.addEventListener("dblclick", onDoubleClick)
    svg.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("keydown", onKeyDown)

    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame)
      last = 0
      if (entry.isIntersecting) frame = requestAnimationFrame(tick)
    })
    observer.observe(svg)

    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(svg)

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
      cancelAnimationFrame(frame)
      svg.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerEnd)
      window.removeEventListener("pointercancel", onPointerEnd)
      svg.removeEventListener("wheel", onWheel)
      svg.removeEventListener("dblclick", onDoubleClick)
      svg.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKeyDown)
      controls.current = undefined
    }
  }, [graph, nodes, edges])

  if (nodes.length === 0) return null

  const isRelated = (id: string) =>
    id === active || neighbors.get(active ?? "")?.has(id) === true
  const labeled = nodes.filter(it => active ? isRelated(it.id) : shown.has(it.id))

  const open = (id: string) => navigate(docs[id].path)

  return (
    <Frame>
      <Svg
        ref={svgRef}
        viewBox={`0 0 ${graph.width} ${graph.height}`}
        role="group"
        aria-label="문서 연관 그래프"
        onPointerLeave={() => pointerType.current === "mouse" && setActive(undefined)}
        onPointerMove={e => {
          if (e.pointerType !== "mouse" || active === undefined || dragging.current) return
          if (!(e.target as Element).closest("g.node")) setActive(undefined)
        }}
      >
        <rect width={graph.width} height={graph.height} fill="transparent" />
        <g>
          {edges.map(({ source, target, similarity }) => {
            const from = byId.get(source)
            const to = byId.get(target)
            if (!from || !to) return null
            const highlighted = active === source || active === target
            return (
              <line
                key={`${source}|${target}`}
                data-drift-source={source}
                data-drift-target={target}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={highlighted ? color(from.community, 45) : theme.colors.lowlight}
                strokeWidth={highlighted ? 2 : 1}
                strokeOpacity={
                  active
                    ? highlighted ? 0.9 : 0.06
                    : 0.15 + Math.max(similarity - 0.6, 0) * 1.5
                }
              />
            )
          })}
        </g>
        <g>
          {nodes.map((node, i) => {
            const radius = 4 + Math.sqrt(node.degree) * 1.6
            return (
              <g
                key={node.id}
                data-drift-node={node.id}
                className={shown.has(node.id) ? "node hub" : "node"}
                role="link"
                tabIndex={0}
                aria-label={docs[node.id].title}
                opacity={!active || isRelated(node.id) ? 1 : 0.15}
                onPointerDown={e => { pointerType.current = e.pointerType }}
                onPointerEnter={e => e.pointerType === "mouse" && setActive(node.id)}
                onPointerLeave={e => e.pointerType === "mouse" && !dragging.current && setActive(undefined)}
                onFocus={() => setActive(node.id)}
                onBlur={() => setActive(undefined)}
                onClick={() => {
                  if (suppressClick.current) return
                  if (pointerType.current === "touch" && active !== node.id) {
                    setActive(node.id)
                    return
                  }
                  open(node.id)
                }}
                onKeyDown={e => e.key === "Enter" && open(node.id)}
              >
                <circle cx={node.x} cy={node.y} r={radius + 6} fill="transparent" />
                <circle
                  className="dot"
                  style={{ animationDelay: `${-(i % HUB_COUNT) * 0.6}s` }}
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={color(node.community, 52)}
                  stroke={active === node.id ? theme.colors.foreground : "#fff"}
                  strokeWidth={active === node.id ? 2 : 1.5}
                />
              </g>
            )
          })}
        </g>
        <g>
          {labeled.map(node => {
            const radius = 4 + Math.sqrt(node.degree) * 1.6
            const ratio = node.x / graph.width
            return (
              <text
                key={node.id}
                data-drift-node={node.id}
                className={`label${node.id === active ? " active" : active ? " related" : ""}`}
                x={node.x}
                y={node.y - radius - 6}
                textAnchor={ratio < 0.2 ? "start" : ratio > 0.8 ? "end" : "middle"}
              >
                {truncate(docs[node.id].title)}
              </text>
            )
          })}
        </g>
      </Svg>
      <Controls>
        <button type="button" aria-label="확대" onClick={() => controls.current?.zoomBy(BUTTON_ZOOM)}>+</button>
        <button type="button" aria-label="축소" onClick={() => controls.current?.zoomBy(1 / BUTTON_ZOOM)}>−</button>
        <button
          type="button"
          aria-label="원래대로"
          onClick={() => {
            controls.current?.reset()
            setFeatured(undefined)
          }}
        >
          ↺
        </button>
        <button
          type="button"
          aria-label="제목 무작위 표시"
          onClick={() => setFeatured(new Set(pickRandom(nodes.map(it => it.id), HUB_COUNT)))}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2" y="2" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <g fill="currentColor">
              <circle cx="5.5" cy="5.5" r="1" />
              <circle cx="10.5" cy="5.5" r="1" />
              <circle cx="8" cy="8" r="1" />
              <circle cx="5.5" cy="10.5" r="1" />
              <circle cx="10.5" cy="10.5" r="1" />
            </g>
          </svg>
        </button>
      </Controls>
    </Frame>
  )
}

function color(community: number, lightness: number) {
  return `hsl(${Math.round((community * 137.508) % 360)} 62% ${lightness}%)`
}

function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

function truncate(text: string) {
  return text.length > LABEL_MAX_LENGTH ? `${text.slice(0, LABEL_MAX_LENGTH)}…` : text
}

type Point = { x: number; y: number }

type Grab = {
  homeStiffness: number;
  linkStiffness: number;
  damping: number;
}

type Glide = {
  rate: number;
  power: number;
  minSpeed: number;
  topSpeed: number;
  smoothing: number;
}

type MotionOptions = {
  grab?: Grab;
  glide?: Glide;
  maxSpeed?: number;
}

function createMotion(
  rest: ReadonlyArray<Point>,
  links: ReadonlyArray<readonly [number, number]>,
  { grab = GRAB, glide = GLIDE, maxSpeed = 12 }: MotionOptions = {},
) {
  const x = rest.map(it => it.x)
  const y = rest.map(it => it.y)
  const vx = rest.map(() => 0)
  const vy = rest.map(() => 0)
  const speed = rest.map(() => 0)
  let pinned: { index: number; x: number; y: number } | undefined

  const stepGrab = (target: { index: number; x: number; y: number }) => {
    const fx = rest.map(() => 0)
    const fy = rest.map(() => 0)

    rest.forEach((home, i) => {
      fx[i] += (home.x - x[i]) * grab.homeStiffness
      fy[i] += (home.y - y[i]) * grab.homeStiffness
    })
    for (const [a, b] of links) {
      const dx = (x[b] - x[a]) - (rest[b].x - rest[a].x)
      const dy = (y[b] - y[a]) - (rest[b].y - rest[a].y)
      fx[a] += dx * grab.linkStiffness
      fy[a] += dy * grab.linkStiffness
      fx[b] -= dx * grab.linkStiffness
      fy[b] -= dy * grab.linkStiffness
    }

    rest.forEach((_, i) => {
      if (i === target.index) {
        x[i] = target.x
        y[i] = target.y
        vx[i] = 0
        vy[i] = 0
        return
      }

      vx[i] = (vx[i] + fx[i]) * grab.damping
      vy[i] = (vy[i] + fy[i]) * grab.damping
      const velocity = Math.hypot(vx[i], vy[i])
      if (velocity > maxSpeed) {
        vx[i] = (vx[i] / velocity) * maxSpeed
        vy[i] = (vy[i] / velocity) * maxSpeed
      }
      x[i] += vx[i]
      y[i] += vy[i]
    })
  }

  const stepGlide = (): boolean => {
    let moving = false
    rest.forEach((home, i) => {
      const dx = home.x - x[i]
      const dy = home.y - y[i]
      const distance = Math.hypot(dx, dy)
      if (distance === 0) {
        speed[i] = 0
        return
      }

      const wanted = Math.min(Math.max(glide.rate * distance ** glide.power, glide.minSpeed), glide.topSpeed)
      speed[i] += (wanted - speed[i]) * glide.smoothing
      if (distance <= speed[i]) {
        x[i] = home.x
        y[i] = home.y
        speed[i] = 0
        return
      }
      x[i] += (dx / distance) * speed[i]
      y[i] += (dy / distance) * speed[i]
      moving = true
    })
    return moving
  }

  const stop = () => {
    vx.fill(0)
    vy.fill(0)
    speed.fill(0)
  }

  return {
    x,
    y,

    pin(index: number, px: number, py: number) {
      if (pinned === undefined) stop()
      pinned = { index, x: px, y: py }
    },

    release() {
      if (pinned !== undefined) stop()
      pinned = undefined
    },

    isPinned() {
      return pinned !== undefined
    },

    step(): boolean {
      if (pinned) {
        stepGrab(pinned)
        return true
      }
      return stepGlide()
    },
  }
}
