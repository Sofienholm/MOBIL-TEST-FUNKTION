import { useEffect, useState } from 'react'
import receiptSrc from '../assets/receipt.js'

// Quest-kortet "En mystisk regning??".
// Fader ind efter unfold-animationen, med retro 1950'er-stil:
// orange overskrift, atom/starburst-dekoration, roteret kvittering.
export default function QuestOverlay({ onContinue }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div className={`quest-overlay ${shown ? 'is-shown' : ''}`}>
      {/* Dekorative retro-elementer */}
      <span className="starburst starburst--a" aria-hidden="true" />
      <span className="starburst starburst--b" aria-hidden="true" />
      <span className="atom" aria-hidden="true">
        <span className="atom__ring" />
        <span className="atom__ring" />
        <span className="atom__ring" />
        <span className="atom__core" />
      </span>

      <div className="quest-card">
        <figure className="quest-receipt">
          <img src={receiptSrc} alt="Regning fra smykkeforretning" />
        </figure>

        <h1 className="quest-title">EN MYSTISK REGNING??</h1>

        <p className="quest-lead">
          PÅ SPISEBORDET FINDER DU EN SAMMENFOLDET REGNING??
        </p>

        <p className="quest-body">
          DEN ER FRA EN SMYKKEFORRETNING, BELØBET ER HØJT, HØJERE END I PLEJER
          AT BRUGE, MEN DER STÅR IKKE PÅ HVAD?
        </p>

        <button type="button" className="quest-cta" onClick={onContinue}>
          VIDERE →
        </button>
      </div>
    </div>
  )
}
