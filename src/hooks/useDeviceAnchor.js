import { useCallback, useEffect, useRef, useState } from 'react'

// ── Bevægelses-"anker" (pseudo-AR uden WebXR) ──────────────────────────────
//  Bruger enhedens gyroskop (DeviceOrientation) til at flytte et element, så
//  det føles som om det bliver liggende i rummet, når man drejer/vipper
//  telefonen. Det er IKKE ægte overfladegenkendelse, men en overbevisende
//  illusion der virker i Safari på iPhone.
//
//  Returnerer:
//    anchorRef       – sæt på det element der skal "blive liggende"
//    needsPermission – iOS 13+ kræver et tryk for at give bevægelses-adgang
//    enableMotion    – kald fra et tryk (user gesture) for at bede om adgang
export default function useDeviceAnchor(enabled) {
  const anchorRef = useRef(null)
  const baseRef = useRef(null) // referenceorientering (sat ved første aflæsning)
  const targetRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const [needsPermission, setNeedsPermission] = useState(false)
  const [listening, setListening] = useState(false)

  const handleOrient = useCallback((e) => {
    const { alpha, beta } = e
    if (alpha == null || beta == null) return
    if (!baseRef.current) baseRef.current = { alpha, beta }

    // forskel fra referenceorienteringen (alpha pakkes til -180..180)
    const dAlpha = ((alpha - baseRef.current.alpha + 540) % 360) - 180
    const dBeta = beta - baseRef.current.beta

    const w = window.innerWidth
    const h = window.innerHeight
    const kx = w / 55 // pixels pr. grad vandret
    const ky = h / 50 // pixels pr. grad lodret

    const cx = w * 0.75
    const cy = h * 0.75
    const x = Math.max(-cx, Math.min(cx, -dAlpha * kx))
    const y = Math.max(-cy, Math.min(cy, dBeta * ky))
    targetRef.current = { x, y }
  }, [])

  const startListening = useCallback(() => {
    window.addEventListener('deviceorientation', handleOrient, true)
    setListening(true)
    setNeedsPermission(false)
  }, [handleOrient])

  // Find ud af om vi må lytte med det samme, eller skal bede om adgang (iOS).
  useEffect(() => {
    if (!enabled) return
    const DOE = window.DeviceOrientationEvent
    if (!DOE) return // ingen sensor → ankeret bliver bare stående i midten
    if (typeof DOE.requestPermission === 'function') {
      setNeedsPermission(true) // iOS 13+: kræver et tryk
    } else {
      startListening() // Android m.fl.
    }
  }, [enabled, startListening])

  const enableMotion = useCallback(async () => {
    try {
      const res = await window.DeviceOrientationEvent.requestPermission()
      if (res === 'granted') startListening()
      else setNeedsPermission(false)
    } catch {
      setNeedsPermission(false)
    }
  }, [startListening])

  // Glat bevægelsen (lerp) og skriv transform direkte på elementet.
  useEffect(() => {
    if (!listening) return
    const cur = { x: 0, y: 0 }
    const loop = () => {
      cur.x += (targetRef.current.x - cur.x) * 0.15
      cur.y += (targetRef.current.y - cur.y) * 0.15
      if (anchorRef.current) {
        anchorRef.current.style.transform = `translate(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px)`
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [listening])

  useEffect(
    () => () => window.removeEventListener('deviceorientation', handleOrient, true),
    [handleOrient],
  )

  return { anchorRef, needsPermission, enableMotion }
}
