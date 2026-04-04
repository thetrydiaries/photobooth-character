import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './Camera.module.css'

// ── Camera component ──────────────────────────────────────────────────────
// Modes: 'choose' → 'camera' | 'upload'
// Always falls back to upload if getUserMedia is denied or unavailable.

export default function Camera({ onCapture }) {
  const [mode,      setMode]      = useState('choose')   // 'choose' | 'camera' | 'upload'
  const [countdown, setCountdown] = useState(null)       // null | 3 | 2 | 1
  const [preview,   setPreview]   = useState(null)       // data URL of capture preview
  const [camError,  setCamError]  = useState(null)
  const [dragOver,  setDragOver]  = useState(false)

  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const timerRef   = useRef(null)

  // ── Start camera ──────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamError(null)
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setCamError('Camera access denied — use file upload instead.')
      setMode('upload')
    }
  }, [])

  // ── Stop camera ───────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    clearInterval(timerRef.current)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── Capture a frame ───────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      stopCamera()
      setPreview(URL.createObjectURL(blob))
      onCapture(blob)
    }, 'image/jpeg', 0.9)
  }, [onCapture, stopCamera])

  // ── Countdown → capture ───────────────────────────────────────────────
  function startCountdown() {
    let n = 3
    setCountdown(n)
    timerRef.current = setInterval(() => {
      n -= 1
      if (n === 0) {
        clearInterval(timerRef.current)
        setCountdown(null)
        captureFrame()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  // ── File upload ───────────────────────────────────────────────────────
  function handleFile(file) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onCapture(file)
  }

  function handleInputChange(e) {
    handleFile(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function reset() {
    stopCamera()
    setMode('choose')
    setPreview(null)
    setCountdown(null)
    setCamError(null)
  }

  // ─────────────────────────────────────────────────────────────────────

  if (preview) {
    return (
      <div className={styles.previewWrap}>
        <img src={preview} alt="Your photo" className={styles.preview} />
        <p className={styles.previewCaption}>Sending to AI analyser…</p>
        <button className={styles.btnGhost} onClick={reset}>Try a different photo</button>
      </div>
    )
  }

  // ── MODE: choose ──────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className={styles.choose}>
        <button className={styles.btnPrimary} onClick={startCamera}>
          <CameraIcon /> Use camera
        </button>
        <span className={styles.or}>or</span>
        <button className={styles.btnSecondary} onClick={() => setMode('upload')}>
          <UploadIcon /> Upload a photo
        </button>
      </div>
    )
  }

  // ── MODE: camera ──────────────────────────────────────────────────────
  if (mode === 'camera') {
    return (
      <div className={styles.cameraWrap}>
        <div className={styles.viewfinder}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.video}
          />
          <div className={styles.viewfinderFrame} />
          {countdown !== null && (
            <div className={styles.countdown}>{countdown}</div>
          )}
        </div>
        <div className={styles.cameraControls}>
          <button className={styles.btnGhost} onClick={() => { stopCamera(); setMode('choose') }}>
            Cancel
          </button>
          <button
            className={styles.captureBtn}
            onClick={startCountdown}
            disabled={countdown !== null}
            aria-label="Take photo"
          >
            <div className={styles.captureBtnInner} />
          </button>
          <button className={styles.btnGhost} onClick={() => { stopCamera(); setMode('upload') }}>
            Upload instead
          </button>
        </div>
      </div>
    )
  }

  // ── MODE: upload ──────────────────────────────────────────────────────
  return (
    <div className={styles.uploadWrap}>
      {camError && <p className={styles.camError}>{camError}</p>}
      <label
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={handleInputChange}
        />
        <UploadIcon size={32} />
        <span className={styles.dropLabel}>Drop a photo here</span>
        <span className={styles.dropSub}>or click to browse · JPG, PNG, HEIC</span>
      </label>
      <button className={styles.btnGhost} onClick={() => setMode('choose')}>
        ← Back
      </button>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────
function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function UploadIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
