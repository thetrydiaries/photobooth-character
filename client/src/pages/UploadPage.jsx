import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Camera from '../components/Camera'
import styles from './UploadPage.module.css'

export default function UploadPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [screen, setScreen] = useState('capture') // 'capture' | 'analysing'

  async function handleCapture(file) {
    setError(null)
    const photoURL = URL.createObjectURL(file)
    setScreen('analysing')
    try {
      const form = new FormData()
      form.append('photo', file)
      const res = await fetch('/analyse', { method: 'POST', body: form })
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        throw new Error(msg || `Server error ${res.status}`)
      }
      const { recipe, flags, detectedFeatures } = await res.json()
      navigate('/maker', { state: { recipe, flags, detectedFeatures, photoURL } })
    } catch (err) {
      setError(err.message)
      setScreen('capture')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>bhotopooth</span>
      </header>

      <main className={styles.main}>
        {/* ── CAPTURE ── */}
        <section className={styles.screen} data-active={screen === 'capture'}>
          <div className={styles.captureLayout}>
            <div className={styles.captureHero}>
              <h1 className={styles.headline}>pake thoto on bhotopooth</h1>
              <p className={styles.subline}>
                bogos binted 👽
              </p>
              {error && <p className={styles.errorBanner}>{error}</p>}
            </div>
            <Camera onCapture={handleCapture} />
          </div>
        </section>

        {/* ── ANALYSING ── */}
        <section className={styles.screen} data-active={screen === 'analysing'}>
          <div className={styles.analysingLayout}>
            <div className={styles.pulseCard}>
              <div className={styles.pulseInner} />
            </div>
            <p className={styles.analysingLabel}>Reading your features…</p>
          </div>
        </section>
      </main>
    </div>
  )
}
