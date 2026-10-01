export type ViewBox = { x: number; y: number; w: number; h: number }
export type Size = { width: number; height: number }

export const MAX_ZOOM = 4

export function fitViewBox({ width, height }: Size, aspect: number): ViewBox {
  if (aspect >= width / height) {
    const w = height * aspect
    return { x: (width - w) / 2, y: 0, w, h: height }
  }
  const h = width / aspect
  return { x: 0, y: (height - h) / 2, w: width, h }
}

export function isZoomed(view: ViewBox, fit: ViewBox): boolean {
  return view.w < fit.w - 0.001
}

export function zoomViewBox(
  view: ViewBox,
  factor: number,
  cx: number,
  cy: number,
  full: Size,
  fit: ViewBox,
  maxZoom = MAX_ZOOM,
): ViewBox {
  const w = clamp(view.w / factor, fit.w / maxZoom, fit.w)
  const ratio = w / view.w
  return clampViewBox({
    x: cx - (cx - view.x) * ratio,
    y: cy - (cy - view.y) * ratio,
    w,
    h: view.h * ratio,
  }, full)
}

export function zoomedViewBox(fit: ViewBox, zoom: number, full: Size): ViewBox {
  const w = fit.w / zoom
  const h = fit.h / zoom
  return clampViewBox({ x: full.width / 2 - w / 2, y: full.height / 2 - h / 2, w, h }, full)
}

export function panViewBox(view: ViewBox, dx: number, dy: number, full: Size): ViewBox {
  return clampViewBox({ ...view, x: view.x - dx, y: view.y - dy }, full)
}

export function refitViewBox(view: ViewBox, before: ViewBox, after: ViewBox, full: Size): ViewBox {
  const zoom = before.w / view.w
  const w = after.w / zoom
  const h = after.h / zoom
  return clampViewBox({ x: view.x + view.w / 2 - w / 2, y: view.y + view.h / 2 - h / 2, w, h }, full)
}

function clampViewBox(view: ViewBox, full: Size): ViewBox {
  return {
    ...view,
    x: clampAxis(view.x, view.w, full.width),
    y: clampAxis(view.y, view.h, full.height),
  }
}

function clampAxis(position: number, size: number, limit: number): number {
  return size >= limit ? (limit - size) / 2 : clamp(position, 0, limit - size)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
