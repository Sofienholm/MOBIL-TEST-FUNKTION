import { useEffect, useState } from 'react'
import CameraExperience from './components/CameraExperience.jsx'
import QuestOverlay from './components/QuestOverlay.jsx'
import EndScreen from './components/EndScreen.jsx'

// Globale faser i oplevelsen:
//   'camera' → kamera/AR med det krøllede papir (landingsskærm)
//   'quest'  → quest-kortet "En mystisk regning??" er foldet ud
//   'end'    → afsluttende skærm efter "VIDERE →"
export default function App() {
  const [phase, setPhase] = useState('camera')
  const [found, setFound] = useState(0)
  const [xrSupported, setXrSupported] = useState(false)

  // Tjek om enheden understøtter rigtig WebXR immersive-ar (med hit-test).
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        if (navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar'))) {
          if (!cancelled) setXrSupported(true)
        }
      } catch {
        /* ingen XR — vi falder tilbage til getUserMedia */
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  // Kaldes når brugeren har trykket på papiret, og det er foldet ud.
  function handleClueFound() {
    setFound((n) => Math.max(n, 1))
    setPhase('quest')
  }

  return (
    <div className="app">
      <CameraExperience
        active={phase === 'camera'}
        xrSupported={xrSupported}
        found={found}
        onClueFound={handleClueFound}
      />

      {phase === 'quest' && (
        <QuestOverlay onContinue={() => setPhase('end')} />
      )}

      {phase === 'end' && (
        <EndScreen
          onRestart={() => {
            setFound(0)
            setPhase('camera')
          }}
        />
      )}
    </div>
  )
}
