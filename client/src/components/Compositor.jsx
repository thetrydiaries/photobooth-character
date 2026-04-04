import { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'

// ── Canvas dimensions ─────────────────────────────────────────────────────
const W = 630
const H = 880

// ── Layer render order (bottom → top) ────────────────────────────────────
// tint: null | 'skin' | 'hair' | 'outfit'
const LAYER_ORDER = [
  { category: 'frame',      tint: null     },
  { category: 'body',       tint: null     },
  { category: 'outfit',     tint: 'outfit' },
  { category: 'face',       tint: 'skin'   },
  { category: 'facialhair', tint: 'hair'   },
  { category: 'nose',       tint: 'skin'   },
  { category: 'mouth',      tint: null     },
  { category: 'brows',      tint: 'hair'   },
  { category: 'eyes',       tint: null     },
  { category: 'hair_back',  tint: 'hair'   },
  { category: 'hair_front', tint: 'hair'   },
  { category: 'accessory',  tint: null     },
  { category: 'twinkle',    tint: null     },
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
