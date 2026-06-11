import { useEffect, useRef, useState } from 'react'
import ARScene from './ARScene.jsx'
import receiptSrc from '../assets/receipt.js'
import crumpledSrc from '../assets/crumpled-paper.svg'

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
  const [camError, setCamError] = useState('')
  const [placeStage, setPlaceStage] = useState('scanning') // scanning | placed
  const [unfolding, setUnfolding] = useState(false)
  const [xrActive, setXrActive] = useState(false)

  // Start kameraet så hurtigt browseren tillader det (ingen startskærm).
  useEffect(() => {
    if (xrActive) return
    let cancelled = false

    async function startCamera() {
      // Kameraet kræver en sikker kontekst (HTTPS eller localhost).
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setCamError(
          'Kameraet kræver en sikker forbindelse (https://). Åbn siden via ' +
            'localhost eller et https-link — fx en tunnel som "npx localtunnel --port 5173".',
        )
        setCamStatus('error')
        return
      }
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
      } catch (err) {
        // Giv en forståelig forklaring i stedet for en mørk skærm.
        if (err?.name === 'NotAllowedError') {
          setCamError('Kameraadgang blev afvist. Tillad kamera i browseren og genindlæs siden.')
        } else if (err?.name === 'NotFoundError') {
          setCamError('Der blev ikke fundet et kamera på enheden.')
        } else {
          setCamError('Kameraet kunne ikke startes. Tjek tilladelser og at siden åbnes via https://.')
        }
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
        <div className="camera-fallback-bg">
          <div className="camera-error">
            <span className="camera-error__icon" aria-hidden="true">📷</span>
            <p className="camera-error__msg">{camError}</p>
          </div>
        </div>
      )}

      {/* Krøllet papir + unfold-illusion */}
      {placeStage === 'scanning' && !unfolding && (
        <div className="scan-reticle" aria-hidden="true">
          <span className="scan-ring" />
          <span className="scan-label">find en flad overflade…</span>
        </div>
      )}

      {placeStage === 'placed' && (
        <button
          type="button"
          className={`clue-paper ${unfolding ? 'is-unfolding' : ''}`}
          onClick={handlePaperTap}
          aria-label="Tryk på det krøllede papir"
        >
          <img src={crumpledSrc} alt="" className="clue-paper__img" />
          <span className="clue-paper__hint">tryk på papiret</span>
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
