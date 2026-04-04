import { useState } from 'react'
import styles from './ExportButton.module.css'

export default function ExportButton({ stageRef }) {
  const [state, setState] = useState('idle') // 'idle' | 'exporting' | 'done'

  async function handleExport() {
    const stage = stageRef.current
    if (!stage || state !== 'idle') return

    setState('exporting')

    // Brief artificial delay for that "satisfying" moment
    await new Promise(r => setTimeout(r, 420))

    try {
      const dataURL = stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `character_${timestamp}.png`

      const link = document.createElement('a')
      link.href = dataURL
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setState('done')
      setTimeout(() => setState('idle'), 2400)
    } catch (err) {
      console.error('[export]', err)
      setState('idle')
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        className={`${styles.btn} ${state === 'done' ? styles.done : ''}`}
        onClick={handleExport}
        disabled={state !== 'idle'}
        aria-label="Export card as PNG"
      >
        {state === 'idle' && (
          <>
            <DownloadIcon />
            Export card
          </>
        )}
        {state === 'exporting' && (
          <>
            <SpinnerIcon />
            Preparing…
          </>
        )}
        {state === 'done' && (
          <>
            <CheckIcon />
            Saved!
          </>
        )}
      </button>
      {state === 'done' && (
        <p className={styles.hint}>Check your downloads folder.</p>
      )}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────
function DownloadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
