require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const fs      = require('fs')
const path    = require('path')

const app  = express()
const PORT = process.env.PORT || 3001

const ASSETS_DIR = path.join(__dirname, '..', 'assets')

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ── Asset serving — search subdirectories for the requested filename ────────
app.get('/assets/:filename', (req, res) => {
  const filename = req.params.filename
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).send('Invalid filename')
  }
  const subdirs = fs.readdirSync(ASSETS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
  for (const subdir of subdirs) {
    const filepath = path.join(ASSETS_DIR, subdir, filename)
    if (fs.existsSync(filepath)) {
      return res.sendFile(filepath)
    }
  }
  res.status(404).send('Asset not found')
})

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/analyse', require('./routes/analyse'))

// GET /variants — derive all unique asset values per category from the mapping
// Used by AssetPanel to render swap thumbnails
const MAPPING = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'assetMapping.json'), 'utf8')
)

app.get('/variants', (_req, res) => {
  const variants = {}
  for (const [category, config] of Object.entries(MAPPING.categories)) {
    const seen = new Set()
    // Always include the default
    if (config.default) {
      if (Array.isArray(config.default)) config.default.forEach(a => seen.add(a))
      else seen.add(config.default)
    }
    for (const rule of config.rules) {
      if (Array.isArray(rule.asset)) rule.asset.forEach(a => seen.add(a))
      else if (rule.asset) seen.add(rule.asset)
    }
    // extras: panel-only variants, never auto-selected by rules
    if (config.extras) config.extras.forEach(a => seen.add(a))
    variants[category] = [...seen].filter(Boolean)
  }
  res.json(variants)
})

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`)
  console.log(`[server] ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'NOT SET'}`)
})
