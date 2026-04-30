import { ArrowLeft, Maximize2, Minus, Plus, RotateCw, Save, Ticket } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, PointerEvent } from 'react'
import { Link } from 'react-router-dom'

type SeatTone = 'vip' | 'reserved' | 'standard' | 'balcony'
type SeatShape = 'rect' | 'circle' | 'triangle'

type SeatBlock = {
  id: string
  name: string
  capacity: number
  price: number
  tone: SeatTone
  shape: SeatShape
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

type StageItem = {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

const designerBounds = { width: 1800, height: 1000 }

const presets: Array<Omit<SeatBlock, 'id' | 'x' | 'y' | 'rotation'>> = [
  { name: 'VIP Pod', capacity: 70, price: 140, tone: 'vip', shape: 'circle', width: 130, height: 130 },
  { name: 'Reserved Block', capacity: 160, price: 89, tone: 'reserved', shape: 'rect', width: 240, height: 90 },
  { name: 'Standard Lane', capacity: 230, price: 58, tone: 'standard', shape: 'rect', width: 270, height: 82 },
  { name: 'Balcony Wing', capacity: 120, price: 45, tone: 'balcony', shape: 'triangle', width: 180, height: 140 },
]

const defaultBlocks: SeatBlock[] = [
  { id: 'a', ...presets[0], x: 260, y: 260, rotation: 0 },
  { id: 'b', ...presets[1], x: 580, y: 310, rotation: 0 },
]

export function SeatMapDesignerPage() {
  const [blocks, setBlocks] = useState<SeatBlock[]>(defaultBlocks)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(defaultBlocks[0]?.id ?? null)
  const [selectedItem, setSelectedItem] = useState<'stage' | 'block'>('block')
  const [stage, setStage] = useState<StageItem>({ x: 700, y: 70, width: 420, height: 90, rotation: 0 })
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 0.72 })
  const [dragState, setDragState] = useState<{ kind: 'stage' | 'block'; id?: string; dx: number; dy: number } | null>(
    null,
  )
  const [resizeState, setResizeState] = useState<{ kind: 'stage' | 'block'; id?: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null)
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const [saveNote, setSaveNote] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)

  const selectedBlock = useMemo(() => blocks.find((block) => block.id === selectedBlockId) ?? null, [blocks, selectedBlockId])

  function toCanvasPoint(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: (clientX - rect.left - viewport.x) / viewport.scale,
      y: (clientY - rect.top - viewport.y) / viewport.scale,
    }
  }

  function clampPosition(width: number, height: number, x: number, y: number) {
    return {
      x: Math.max(0, Math.min(designerBounds.width - width, x)),
      y: Math.max(0, Math.min(designerBounds.height - height, y)),
    }
  }

  function onCanvasDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const presetIndex = Number(event.dataTransfer.getData('application/x-seat-preset'))
    if (!Number.isFinite(presetIndex) || !presets[presetIndex]) return
    const point = toCanvasPoint(event.clientX, event.clientY)
    if (!point) return

    const preset = presets[presetIndex]
    const position = clampPosition(preset.width, preset.height, point.x - preset.width / 2, point.y - preset.height / 2)
    const block: SeatBlock = {
      id: crypto.randomUUID(),
      ...preset,
      rotation: 0,
      ...position,
    }
    setBlocks((current) => [...current, block])
    setSelectedItem('block')
    setSelectedBlockId(block.id)
  }

  function onCanvasPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    setPanStart({ x: event.clientX, y: event.clientY, panX: viewport.x, panY: viewport.y })
    setSelectedBlockId(null)
  }

  function onBlockPointerDown(event: PointerEvent<HTMLButtonElement>, block: SeatBlock) {
    event.preventDefault()
    event.stopPropagation()
    const point = toCanvasPoint(event.clientX, event.clientY)
    if (!point) return
    setSelectedItem('block')
    setSelectedBlockId(block.id)
    setDragState({ kind: 'block', id: block.id, dx: point.x - block.x, dy: point.y - block.y })
  }

  function onStagePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    const point = toCanvasPoint(event.clientX, event.clientY)
    if (!point) return
    setSelectedItem('stage')
    setSelectedBlockId(null)
    setDragState({ kind: 'stage', dx: point.x - stage.x, dy: point.y - stage.y })
  }

  function onCanvasPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (resizeState) {
      const point = toCanvasPoint(event.clientX, event.clientY)
      if (!point) return
      const deltaX = point.x - resizeState.startX
      const deltaY = point.y - resizeState.startY
      const nextWidth = Math.max(60, resizeState.startWidth + deltaX)
      const nextHeight = Math.max(60, resizeState.startHeight + deltaY)

      if (resizeState.kind === 'stage') {
        setStage((current) => ({ ...current, width: nextWidth, height: nextHeight }))
      } else if (resizeState.id) {
        setBlocks((current) =>
          current.map((block) =>
            block.id === resizeState.id ? { ...block, width: nextWidth, height: nextHeight } : block,
          ),
        )
      }
      return
    }

    if (dragState) {
      const point = toCanvasPoint(event.clientX, event.clientY)
      if (!point) return

      if (dragState.kind === 'stage') {
        const next = clampPosition(stage.width, stage.height, point.x - dragState.dx, point.y - dragState.dy)
        setStage((current) => ({ ...current, ...next }))
      } else if (dragState.kind === 'block' && dragState.id) {
        setBlocks((current) =>
          current.map((block) => {
            if (block.id !== dragState.id) return block
            const next = clampPosition(block.width, block.height, point.x - dragState.dx, point.y - dragState.dy)
            return { ...block, ...next }
          }),
        )
      }
      return
    }

    if (!panStart) return
    setViewport((current) => ({
      ...current,
      x: panStart.panX + (event.clientX - panStart.x),
      y: panStart.panY + (event.clientY - panStart.y),
    }))
  }

  function onCanvasPointerUp() {
    setDragState(null)
    setResizeState(null)
    setPanStart(null)
  }

  function applyZoom(deltaY: number) {
    setViewport((current) => ({
      ...current,
      scale: Math.max(0.45, Math.min(2.4, current.scale - deltaY * 0.0014)),
    }))
  }

  function updateSelectedBlock(patch: Partial<SeatBlock>) {
    if (!selectedBlockId) return
    setBlocks((current) => current.map((block) => (block.id === selectedBlockId ? { ...block, ...patch } : block)))
  }

  function onBlockResizePointerDown(event: PointerEvent<HTMLSpanElement>, block: SeatBlock) {
    event.preventDefault()
    event.stopPropagation()
    const point = toCanvasPoint(event.clientX, event.clientY)
    if (!point) return
    setSelectedItem('block')
    setSelectedBlockId(block.id)
    setResizeState({
      kind: 'block',
      id: block.id,
      startX: point.x,
      startY: point.y,
      startWidth: block.width,
      startHeight: block.height,
    })
  }

  function onStageResizePointerDown(event: PointerEvent<HTMLSpanElement>) {
    event.preventDefault()
    event.stopPropagation()
    const point = toCanvasPoint(event.clientX, event.clientY)
    if (!point) return
    setSelectedItem('stage')
    setSelectedBlockId(null)
    setResizeState({
      kind: 'stage',
      startX: point.x,
      startY: point.y,
      startWidth: stage.width,
      startHeight: stage.height,
    })
  }

  function compactLayout() {
    const sorted = [...blocks].sort((a, b) => a.y - b.y || a.x - b.x)
    const startX = 80
    const startY = Math.max(stage.y + stage.height + 80, 180)
    const gapX = 24
    const gapY = 22
    const maxRowWidth = designerBounds.width - 120

    let cursorX = startX
    let cursorY = startY
    let currentRowHeight = 0

    const nextBlocks = sorted.map((block) => {
      if (cursorX + block.width > maxRowWidth) {
        cursorX = startX
        cursorY += currentRowHeight + gapY
        currentRowHeight = 0
      }
      const next = { ...block, x: cursorX, y: cursorY }
      cursorX += block.width + gapX
      currentRowHeight = Math.max(currentRowHeight, block.height)
      return next
    })

    setBlocks(nextBlocks)
    setSaveNote('Layout adjusted for tighter spacing.')
  }

  function saveMap() {
    setSaveNote(`Seat map saved with ${blocks.length} sections.`)
  }

  const resetViewToContent = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasWidth = canvas.clientWidth
    const canvasHeight = canvas.clientHeight
    if (!canvasWidth || !canvasHeight) return

    const allItems = [
      { x: stage.x, y: stage.y, width: stage.width, height: stage.height },
      ...blocks.map((block) => ({
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
      })),
    ]

    const minX = Math.min(...allItems.map((item) => item.x))
    const minY = Math.min(...allItems.map((item) => item.y))
    const maxX = Math.max(...allItems.map((item) => item.x + item.width))
    const maxY = Math.max(...allItems.map((item) => item.y + item.height))
    const contentWidth = Math.max(1, maxX - minX)
    const contentHeight = Math.max(1, maxY - minY)

    const padding = 80
    const fitScaleX = (canvasWidth - padding) / contentWidth
    const fitScaleY = (canvasHeight - padding) / contentHeight
    const nextScale = Math.max(0.45, Math.min(2.4, Math.min(fitScaleX, fitScaleY)))

    const centeredX = (canvasWidth - contentWidth * nextScale) / 2 - minX * nextScale
    const centeredY = (canvasHeight - contentHeight * nextScale) / 2 - minY * nextScale

    setViewport({
      x: centeredX,
      y: centeredY,
      scale: nextScale,
    })
  }, [blocks, stage.height, stage.width, stage.x, stage.y])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function handleNativeWheel(event: globalThis.WheelEvent) {
      event.preventDefault()
      event.stopPropagation()
      applyZoom(event.deltaY)
    }

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel)
    }
  }, [])

  return (
    <section className="seat-designer-page" aria-labelledby="seat-designer-title">
      <div className="seat-designer-topbar">
        <div>
          <p className="eyebrow">
            <Ticket size={18} strokeWidth={2.5} />
            Seat map studio
          </p>
          <h1 id="seat-designer-title">Design a custom venue map.</h1>
        </div>
        <Link className="secondary-button compact-link" to="/admin/events/new">
          <ArrowLeft size={18} strokeWidth={2.5} />
          Back to create event
        </Link>
      </div>

      <div className="seat-designer-layout">
        <aside className="admin-panel seat-designer-sidebar">
          <h2>Seat presets</h2>
          <div className="custom-seat-library">
            {presets.map((preset, index) => (
              <button
                key={`${preset.name}-${index}`}
                className={`library-seat-pill ${preset.tone}`}
                type="button"
                draggable
                onDragStart={(event) => event.dataTransfer.setData('application/x-seat-preset', String(index))}
              >
                <strong>{preset.name}</strong>
                <span>{preset.capacity} seats</span>
              </button>
            ))}
          </div>

          <div className="designer-inspector">
            <h3>Inspector</h3>
            {saveNote && <p className="designer-note">{saveNote}</p>}
            <div className="designer-action-row">
              <button className="secondary-button" type="button" onClick={compactLayout}>
                Compact layout
              </button>
              <button className="primary-button compact-button" type="button" onClick={saveMap}>
                Save map
                <span>
                  <Save size={16} strokeWidth={2.5} />
                </span>
              </button>
            </div>
            {selectedItem === 'stage' ? (
              <div className="designer-inspector-grid">
                <label className="field">
                  <span>Selected</span>
                  <input value="Stage" readOnly />
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setStage((s) => ({ ...s, rotation: (s.rotation + 90) % 360 }))}
                >
                  <RotateCw size={16} strokeWidth={2.5} />
                  Rotate 90deg
                </button>
              </div>
            ) : selectedBlock ? (
              <div className="designer-inspector-grid">
                <label className="field">
                  <span>Section name</span>
                  <input value={selectedBlock.name} onChange={(event) => updateSelectedBlock({ name: event.target.value })} />
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    type="number"
                    value={selectedBlock.capacity}
                    min={0}
                    onChange={(event) => updateSelectedBlock({ capacity: Number(event.target.value) || 0 })}
                  />
                </label>
                <label className="field">
                  <span>Price</span>
                  <input
                    type="number"
                    value={selectedBlock.price}
                    min={0}
                    onChange={(event) => updateSelectedBlock({ price: Number(event.target.value) || 0 })}
                  />
                </label>
                <label className="field">
                  <span>Shape</span>
                  <div className="select-shell">
                    <select value={selectedBlock.shape} onChange={(event) => updateSelectedBlock({ shape: event.target.value as SeatShape })}>
                      <option value="rect">Rectangle</option>
                      <option value="circle">Circle</option>
                      <option value="triangle">Triangle</option>
                    </select>
                  </div>
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => updateSelectedBlock({ rotation: (selectedBlock.rotation + 90) % 360 })}
                >
                  <RotateCw size={16} strokeWidth={2.5} />
                  Rotate 90deg
                </button>
              </div>
            ) : (
              <p>Select a seat block or stage to edit.</p>
            )}
          </div>
        </aside>

        <section className="admin-panel seat-designer-canvas-panel">
          <div
            className="seat-designer-canvas"
            ref={canvasRef}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onCanvasDrop}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerLeave={onCanvasPointerUp}
          >
            <div className="canvas-hint">Drag presets into canvas. Drag stage/sections. Wheel zoom. Drag empty space to pan.</div>
            <div className="designer-canvas-tools" role="group" aria-label="Canvas zoom controls">
              <button
                className="tiny-icon-button"
                type="button"
                onClick={() => setViewport((v) => ({ ...v, scale: Math.max(0.45, v.scale - 0.1) }))}
                aria-label="Zoom out"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <button
                className="tiny-icon-button"
                type="button"
                onClick={() => setViewport((v) => ({ ...v, scale: Math.min(2.4, v.scale + 0.1) }))}
                aria-label="Zoom in"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
              <button
                className="tiny-icon-button"
                type="button"
                onClick={resetViewToContent}
                aria-label="Reset view"
              >
                <Maximize2 size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="designer-canvas-scale">{Math.round(viewport.scale * 100)}%</div>
            <div
              className="custom-canvas-content"
              style={{
                width: `${designerBounds.width}px`,
                height: `${designerBounds.height}px`,
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
              }}
            >
              <button
                className={selectedItem === 'stage' ? 'designer-stage selected' : 'designer-stage'}
                type="button"
                onPointerDown={onStagePointerDown}
                style={{
                  width: `${stage.width}px`,
                  height: `${stage.height}px`,
                  left: `${stage.x}px`,
                  top: `${stage.y}px`,
                  transform: `rotate(${stage.rotation}deg)`,
                }}
              >
                Stage
                <span className="resize-corner" onPointerDown={onStageResizePointerDown} />
              </button>
              {blocks.map((block) => (
                <button
                  className={[
                    'custom-seat-block',
                    block.tone,
                    `shape-${block.shape}`,
                    selectedBlockId === block.id && selectedItem === 'block' ? 'selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={block.id}
                  type="button"
                  onPointerDown={(event) => onBlockPointerDown(event, block)}
                  style={{
                    width: `${block.width}px`,
                    height: `${block.height}px`,
                    left: `${block.x}px`,
                    top: `${block.y}px`,
                    transform: `rotate(${block.rotation}deg)`,
                  }}
                >
                  <strong>{block.name}</strong>
                  <span>{block.capacity} seats</span>
                <span className="resize-corner" onPointerDown={(event) => onBlockResizePointerDown(event, block)} />
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
