import { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'

// ── Canvas dimensions ─────────────────────────────────────────────────────
const W = 630
const H = 880

// ── Layer render order (bottom → top) ────────────────────────────────────
// tint: null | 'skin' | 'hair' | 'outfit'
const LAYER_ORDER = [
  { category: 'frame',      tint: null     }, // z=0  card frame
  { category: 'hair_back',  tint: 'hair'   }, // z=1  hair bulk/length behind head
  { category: 'body',       tint: 'skin'   }, // z=2  body silhouette
  { category: 'face',       tint: 'skin'   }, // z=3  face shape
  { category: 'outfit',     tint: 'outfit' }, // z=4  clothing
  { category: 'facialhair', tint: 'hair'   }, // z=5  beard/stubble
  { category: 'nose',       tint: 'skin'   }, // z=6  nose
  { category: 'mouth',      tint: null     }, // z=7  mouth
  { category: 'eyes',       tint: null     }, // z=8  eyes (real colour assets)
  { category: 'twinkle',    tint: null     }, // z=9  eye shine
  { category: 'brows',      tint: 'hair'   }, // z=10 eyebrows
  { category: 'accessory',  tint: null     }, // z=11 glasses, earrings, etc.
  { category: 'hair_front', tint: 'hair'   }, // z=12 fringe/bangs
]

// ── Tint a loaded HTMLImageElement → offscreen canvas ─────────────────────
// Uses multiply blend to colorise grayscale assets.
function tintImage(img, colour) {
  const canvas = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Draw original greyscale asset
  ctx.drawImage(img, 0, 0, W, H)

  // Multiply-blend the tint colour over it
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, W, H)

  // Restore original alpha (so transparent areas stay transparent)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(img, 0, 0, W, H)

  return canvas
}

// ── Load an image → Promise<HTMLImageElement> ─────────────────────────────
function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ── Resolve asset paths for a given category entry ────────────────────────
// Returns an array of strings (some categories have multi-asset arrays).
function resolveAssets(category, recipe) {
  const raw = recipe.assets[category]
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

// ─────────────────────────────────────────────────────────────────────────
export default function Compositor({ recipe, stageRef }) {
  // Map of assetName → HTMLImageElement | HTMLCanvasElement (tinted)
  const [loadedImages, setLoadedImages] = useState({})
  const prevRecipeRef = useRef(null)

  useEffect(() => {
    if (!recipe) return

    // Collect all asset names this recipe needs
    const needed = {}
    for (const { category, tint } of LAYER_ORDER) {
      const names = resolveAssets(category, recipe)
      for (const name of names) {
        if (name) needed[name] = tint
      }
    }

    // Only reload assets that have changed
    const prev = prevRecipeRef.current
    const toLoad = {}
    for (const [name, tint] of Object.entries(needed)) {
      const prevTint = prev?.tintFor?.[name]
      const prevColour = prev?.colours?.[prevTint]
      const currColour = recipe.colours[tint]
      // Reload if we haven't loaded it before, or the tint colour changed
      if (!loadedImages[name] || prevColour !== currColour) {
        toLoad[name] = tint
      }
    }

    if (Object.keys(toLoad).length === 0) return

    prevRecipeRef.current = {
      colours: { ...recipe.colours },
      tintFor: needed,
    }

    const promises = Object.entries(toLoad).map(async ([name, tint]) => {
      const src = `/assets/${name}.png`
      try {
        const img = await loadImg(src)
        const colour = tint ? recipe.colours[tint] : null
        const drawable = colour ? tintImage(img, colour) : img
        return [name, drawable]
      } catch {
        // Asset PNG not found yet — render nothing for this layer
        return [name, null]
      }
    })

    Promise.all(promises).then(results => {
      setLoadedImages(prev => {
        const next = { ...prev }
        for (const [name, img] of results) {
          next[name] = img
        }
        return next
      })
    })
  }, [recipe]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build the ordered list of Konva Image nodes
  const nodes = []
  for (const { category } of LAYER_ORDER) {
    const names = resolveAssets(category, recipe || { assets: {} })
    for (const name of names) {
      const img = loadedImages[name]
      if (img) {
        nodes.push(
          <KonvaImage
            key={name}
            image={img}
            x={0}
            y={0}
            width={W}
            height={H}
            listening={false}
          />
        )
      }
    }
  }

  return (
    <Stage ref={stageRef} width={W} height={H}>
      <Layer>{nodes}</Layer>
    </Stage>
  )
}
