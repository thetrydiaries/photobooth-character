import { useState } from 'react'
import styles from './AssetPanel.module.css'

// ── Colour pickers ────────────────────────────────────────────────────────
const COLOUR_PICKERS = [
  { key: 'hair',   label: 'Hair colour' },
  { key: 'skin',   label: 'Skin tone'   },
  { key: 'outfit', label: 'Outfit colour' },
]

// ── Human-readable category labels ───────────────────────────────────────
const CATEGORY_LABELS = {
  frame:      'Frame',
  body:       'Body',
  outfit:     'Outfit',
  face:       'Face shape',
  facialhair: 'Facial hair',
  nose:       'Nose',
  mouth:      'Mouth',
  brows:      'Brows',
  eyes:       'Eyes',
  hair_back:  'Hair (back)',
  hair_front: 'Hair (front)',
  accessory:  'Accessories',
  twinkle:    'Twinkle',
}

// ── Display order ─────────────────────────────────────────────────────────
const PANEL_ORDER = [
  'face', 'eyes', 'brows', 'nose', 'mouth',
  'hair_back', 'hair_front', 'facialhair',
  'body', 'outfit', 'accessory',
  'frame', 'twinkle',
]

// ── Shorten an asset name to a readable label ─────────────────────────────
function shortLabel(name) {
  if (!name) return '—'
  // Strip the category prefix: "hair_back_straight_long" → "straight long"
  const parts = name.split('_')
  // Find where the variant starts (skip known category tokens)
  // We'll just strip the first 1-2 prefix tokens that match category-like words
  // Simple approach: join from index 2 onward
  if (parts.length > 2) return parts.slice(2).join(' ')
  if (parts.length > 1) return parts.slice(1).join(' ')
  return name
}

// ─────────────────────────────────────────────────────────────────────────
export default function AssetPanel({ recipe, flags, variants, onRecipeChange }) {
  const [expandedCategory, setExpandedCategory] = useState(null)

  function setColour(key, value) {
    onRecipeChange({ ...recipe, colours: { ...recipe.colours, [key]: value } })
  }

  function swapAsset(category, newAsset) {
    const next = {
      ...recipe,
      assets: { ...recipe.assets, [category]: newAsset },
    }
    onRecipeChange(next)
    // keep the category open — user closes by clicking another category or the same header
  }

  const categories = PANEL_ORDER.filter(c => recipe.assets[c] !== undefined || (variants[c] && variants[c].length > 0))

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Customise</h2>
      <p className={styles.panelSub}>Click any row to swap the asset.</p>

      <div className={styles.categoryList}>
        {categories.map(category => {
          const current = recipe.assets[category]
          const isFlagged = flags.includes(category)
          const isOpen = expandedCategory === category
          const categoryVariants = variants[category] || []
          const currentArr = Array.isArray(current) ? current : [current]

          return (
            <div key={category} className={`${styles.categoryRow} ${isFlagged ? styles.flagged : ''}`}>
              {/* ── Row header (click to expand) ── */}
              <button
                className={styles.rowHeader}
                onClick={() => setExpandedCategory(isOpen ? null : category)}
                aria-expanded={isOpen}
              >
                <div className={styles.rowLeft}>
                  {isFlagged && <span className={styles.flagDot} title="AI uncertain — check this one" />}
                  <span className={styles.categoryLabel}>{CATEGORY_LABELS[category] || category}</span>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.currentValue}>
                    {currentArr.map(shortLabel).join(', ')}
                  </span>
                  <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* ── Expanded variant picker ── */}
              {isOpen && (
                <div className={styles.variantGrid}>
                  {categoryVariants.length === 0 && (
                    <p className={styles.noVariants}>No other variants available yet.</p>
                  )}
                  {categoryVariants.map(variant => {
                    const isSelected = Array.isArray(current)
                      ? current.includes(variant)
                      : current === variant
                    return (
                      <button
                        key={variant}
                        className={`${styles.variantTile} ${isSelected ? styles.variantSelected : ''}`}
                        onClick={() => swapAsset(category, variant)}
                        title={variant}
                      >
                        <AssetThumb name={variant} />
                        <span className={styles.variantLabel}>{shortLabel(variant)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Colour pickers ── */}
      <div className={styles.colourSection}>
        <p className={styles.colourHeading}>Colours</p>
        <div className={styles.colourList}>
          {COLOUR_PICKERS.map(({ key, label }) => (
            <div key={key} className={styles.colourRow}>
              <label className={styles.colourLabel}>{label}</label>
              <div className={styles.colourRight}>
                <div
                  className={styles.colourSwatch}
                  style={{ background: recipe.colours?.[key] ?? '#888888' }}
                />
                <input
                  type="color"
                  value={recipe.colours?.[key] ?? '#888888'}
                  onChange={e => setColour(key, e.target.value)}
                  className={styles.colourInput}
                  title={`Pick ${label}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Asset thumbnail — tries to load the PNG, falls back to a placeholder ──
function AssetThumb({ name }) {
  const [loaded, setLoaded] = useState(false)
  const [error,  setError]  = useState(false)

  if (error || !name) {
    return (
      <div className={styles.thumbPlaceholder}>
        <span className={styles.thumbLabel}>{shortLabel(name)}</span>
      </div>
    )
  }

  return (
    <div className={styles.thumbWrap}>
      {!loaded && <div className={styles.thumbSkeleton} />}
      <img
        src={`/assets/${name}.png`}
        alt={name}
        className={styles.thumbImg}
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  )
}
