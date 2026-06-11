import { useEffect, useRef, useState } from 'react'
import ARScene from './ARScene.jsx'
import receiptSrc from '../assets/receipt.js'

const CLUE_TEXT = 'BEVÆG DIG FREM OG SE OM DU KAN FINDE EN LEDETRÅD'

// Kamera-landingsskærmen.
//  - Live kamera (getUserMedia) som baggrund — virker på alle mobiler.
//  - Fast UI-overlay ovenpå (blå boks, ?-knap, status-badge).
//  - Krøllet papir der kan trykkes → folder ud → quest.
//  - Hvis WebXR understøttes, kan man starte ægte AR med hit-test (ARScene).
export default function CameraExperience({ active, xrSupported, found, onClueFound }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [camStatus, setCamStatus] = useState('starting') // starting | live | error
  const [placeStage, setPlaceStage] = useState('scanning') // scanning | placed
  const [unfolding, setUnfolding] = useState(false)
  const [xrActive, setXrActive] = useState(false)

  // Start kameraet så hurtigt browseren tillader det (ingen startskærm).
  useEffect(() => {
    if (xrActive) return
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setCamStatus('live')
      } catch {
        setCamStatus('error')
      }
    }

    startCamera()
    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [xrActive])

  // Simuleret "overflade-registrering" i fallback: scan kort, placér så papiret.
  useEffect(() => {
    if (xrActive) return
    setPlaceStage('scanning')
    const t = setTimeout(() => setPlaceStage('placed'), 2400)
    return () => clearTimeout(t)
  }, [xrActive])

  function handlePaperTap() {
    if (unfolding) return
    setUnfolding(true)
    // Lad unfold-animationen spille, afslør derefter quest-kortet.
    setTimeout(() => onClueFound(), 1500)
  }

  if (!active) return null

  // ── Ægte WebXR-tilstand ────────────────────────────────────────────────
  if (xrActive) {
    return (
      <ARScene
        clueText={CLUE_TEXT}
        found={found}
        onClueFound={onClueFound}
        onExit={() => setXrActive(false)}
      />
    )
  }

  // ── Fallback: getUserMedia-kamera + DOM-overlay ────────────────────────
  return (
    <div className={`camera-experience ${unfolding ? 'is-dimmed' : ''}`}>
      <video
        ref={videoRef}
        className="camera-feed"
        playsInline
        muted
        autoPlay
      />

      {camStatus === 'error' && (
        <div className="camera-fallback-bg" aria-hidden="true" />
      )}

      {/* Krøllet papir + unfold-illusion */}
      {placeStage === 'scanning' && !unfolding && (
        <div className="scan-reticle" aria-hidden="true">
          <span className="scan-ring" />
          <span className="scan-label">scanner overflade…</span>
        </div>
      )}

      {placeStage === 'placed' && (
        <button
          type="button"
          className={`clue-paper ${unfolding ? 'is-unfolding' : ''}`}
          onClick={handlePaperTap}
          aria-label="Tryk på det krøllede papir"
        >
          <span className="crumple crumple--1" />
          <span className="crumple crumple--2" />
          <span className="crumple--shadow" />
        </button>
      )}

      {/* Den udfoldede regning der flyver mod kameraet */}
      {unfolding && (
        <div className="unfold-receipt" aria-hidden="true">
          <img src={receiptSrc} alt="" className="unfold-receipt__img" />
        </div>
      )}

      {/* ── Fast UI-overlay ───────────────────────────────────────────── */}
      <div className="ui-overlay">
        <div className="ui-top">
          <div className="clue-box">
            <p className="clue-box__text">{CLUE_TEXT}</p>
            <span className="clue-box__tail" />
          </div>
          <div className="ui-controls">
            <button type="button" className="help-btn" aria-label="Hjælp">
              ?
            </button>
            <span className="status-badge">{found}/3 FUNDET</span>
          </div>
        </div>

        {xrSupported && !unfolding && (
          <button
            type="button"
            className="ar-launch"
            onClick={() => setXrActive(true)}
          >
            Start ægte AR ▸
          </button>
        )}
      </div>
    </div>
  )
}
