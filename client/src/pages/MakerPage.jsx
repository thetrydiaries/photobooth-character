import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Compositor from '../components/Compositor'
import AssetPanel from '../components/AssetPanel'
import ExportButton from '../components/ExportButton'
import styles from './MakerPage.module.css'

const EMPTY_RECIPE = {
  assets: {},
  colours: { skin: '#C08060', hair: '#3D1F0A', outfit: '#2D3561' },
}

export default function MakerPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const stageRef = useRef(null)

  const [recipe,           setRecipe]           = useState(location.state?.recipe           ?? EMPTY_RECIPE)
  const [flags,            setFlags]            = useState(location.state?.flags            ?? [])
  const [detectedFeatures, setDetectedFeatures] = useState(location.state?.detectedFeatures ?? null)
  const [photoURL,         setPhotoURL]         = useState(location.state?.photoURL         ?? null)
  const [variants,         setVariants]         = useState({})
  const [debugOpen,        setDebugOpen]        = useState(false)

  useEffect(() => {
    fetch('/variants')
      .then(r => r.json())
      .then(setVariants)
      .catch(() => {})
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>bhotopooth</span>
        <button className={styles.restart} onClick={() => navigate('/upload')}>
          ← New photo
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.compositorLayout}>
          {/* Left: photo + canvas side by side */}
          <div className={styles.canvasCol}>
            {/* Original photo */}
            {photoURL && (
              <div className={styles.photoPane}>
                <p className={styles.photoLabel}>Your photo</p>
                <img src={photoURL} alt="Your photo" className={styles.photo} />
              </div>
            )}

            {/* Character canvas */}
            <div className={styles.canvasArea}>
              <div className={styles.stageWrap}>
                <div className={styles.cardShadow}>
                  <Compositor recipe={recipe} stageRef={stageRef} />
                </div>
              </div>
              <ExportButton stageRef={stageRef} />
            </div>
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
      </main>

      {/* ── AI DEBUG PANEL ── */}
      {detectedFeatures && (
        <>
          <button
            className={styles.debugToggle}
            onClick={() => setDebugOpen(o => !o)}
          >
            {debugOpen ? 'Hide' : 'AI debug'}
          </button>

          {debugOpen && (
            <div className={styles.debugDrawer}>
              <div className={styles.debugCol}>
                <p className={styles.debugHeading}>Claude detected features</p>
                <pre className={styles.debugPre}>
                  {JSON.stringify(detectedFeatures, null, 2)}
                </pre>
              </div>
              <div className={styles.debugDivider} />
              <div className={styles.debugCol}>
                <p className={styles.debugHeading}>Asset recipe</p>
                <pre className={styles.debugPre}>
                  {JSON.stringify(recipe, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
