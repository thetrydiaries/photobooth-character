import { useState, useRef, useEffect } from 'react'
import Camera from './components/Camera'
import Compositor from './components/Compositor'
import AssetPanel from './components/AssetPanel'
import ExportButton from './components/ExportButton'
import styles from './App.module.css'

// ── Screens: 'capture' → 'analysing' → 'compositor' ──────────────────────

export default function App() {
  const [screen,   setScreen]   = useState('capture')
  const [recipe,   setRecipe]   = useState(null)
  const [flags,    setFlags]    = useState([])
  const [variants, setVariants] = useState({})
  const [error,    setError]    = useState(null)
  const stageRef = useRef(null)

  // Load variant manifest once on mount
  useEffect(() => {
    fetch('/variants')
      .then(r => r.json())
      .then(setVariants)
      .catch(() => {})
  }, [])

  async function handleCapture(file) {
    setError(null)
    setScreen('analysing')
    try {
      const form = new FormData()
      form.append('photo', file)
      const res = await fetch('/analyse', { method: 'POST', body: form })
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        throw new Error(msg || `Server error ${res.status}`)
      }
      const { recipe: r, flags: f } = await res.json()
      setRecipe(r)
      setFlags(f || [])
      setScreen('compositor')
    } catch (err) {
      setError(err.message)
      setScreen('capture')
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.logo}>Photobooth</span>
        {screen === 'compositor' && (
          <button className={styles.restart} onClick={() => setScreen('capture')}>
            ← New photo
          </button>
        )}
      </header>

      <main className={styles.main}>
        {/* ── CAPTURE ── */}
        <section
          className={styles.screen}
          data-active={screen === 'capture'}
          aria-hidden={screen !== 'capture'}
        >
          <div className={styles.captureLayout}>
            <div className={styles.captureHero}>
              <h1 className={styles.headline}>Make your<br />character.</h1>
              <p className={styles.subline}>
                Take a photo or upload one — AI will build<br />your illustrated character in seconds.
              </p>
              {error && <p className={styles.errorBanner}>{error}</p>}
            </div>
            <Camera onCapture={handleCapture} />
          </div>
        </section>

        {/* ── ANALYSING ── */}
        <section
          className={styles.screen}
          data-active={screen === 'analysing'}
          aria-hidden={screen !== 'analysing'}
        >
          <div className={styles.analysingLayout}>
            <div className={styles.pulseCard}>
              <div className={styles.pulseInner} />
            </div>
            <p className={styles.analysingLabel}>Reading your features…</p>
          </div>
        </section>

        {/* ── COMPOSITOR ── */}
        <section
          className={styles.screen}
          data-active={screen === 'compositor'}
          aria-hidden={screen !== 'compositor'}
        >
          {recipe && (
            <div className={styles.compositorLayout}>
              <div className={styles.canvasArea}>
                <div className={styles.cardShadow}>
                  <Compositor recipe={recipe} stageRef={stageRef} />
                </div>
                <ExportButton stageRef={stageRef} />
              </div>
              <aside className={styles.panelArea}>
                <AssetPanel
                  recipe={recipe}
                  flags={flags}
                  variants={variants}
                  onRecipeChange={setRecipe}
                />
              </aside>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
