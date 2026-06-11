// Lille afsluttende skærm efter "VIDERE →".
// Markerer at sidequesten er gennemført og giver mulighed for at starte forfra
// (praktisk til en mundtlig fremlæggelse).
export default function EndScreen({ onRestart }) {
  return (
    <div className="end-screen">
      <span className="starburst starburst--a" aria-hidden="true" />
      <div className="end-card">
        <p className="end-kicker">LEDETRÅD FUNDET</p>
        <h1 className="end-title">1/3</h1>
        <p className="end-text">
          Du har fundet den mystiske regning. Find de næste ledetråde rundt i
          lejligheden for at løse mysteriet.
        </p>
        <button type="button" className="quest-cta" onClick={onRestart}>
          PRØV IGEN ↺
        </button>
      </div>
    </div>
  )
}
