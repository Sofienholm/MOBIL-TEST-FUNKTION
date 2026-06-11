import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import receiptSrc from '../assets/receipt.js'

// ── Ægte WebXR-oplevelse ───────────────────────────────────────────────────
//  Starter en immersive-ar session med:
//    - hit-test  → registrerer en flad overflade (fx et bord)
//    - dom-overlay → vores UI-overlay (blå boks m.m.) vises ovenpå kameraet
//
//  Flow:
//    1. En reticle følger den registrerede overflade.
//    2. Når overfladen er stabil, placeres et krøllet papir automatisk.
//    3. Tryk (select) på papiret → det folder ud til kvitteringen, der
//       bevæger sig mod kameraet → quest-kortet vises (onClueFound).
export default function ARScene({ clueText, found, onClueFound, onExit }) {
  const overlayRef = useRef(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    const overlayRoot = overlayRef.current
    let renderer, session
    let raf = 0
    let disposed = false

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 20)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 1.1))
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(0.5, 1, 0.25)
    scene.add(dir)

    // Reticle (cirkel der ligger fladt på overfladen)
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.065, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff7a1a }),
    )
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)

    const crumpled = makeCrumpledPaper()
    crumpled.visible = false
    scene.add(crumpled)

    let receiptMesh = null
    let placed = false
    let unfolding = false
    let unfoldT = 0
    let hitTestSource = null
    let hitStableFrames = 0

    function placePaper() {
      crumpled.position.setFromMatrixPosition(reticle.matrix)
      crumpled.visible = true
      reticle.visible = false
      placed = true
    }

    function startUnfold() {
      if (unfolding || !placed) return
      unfolding = true

      const tex = new THREE.TextureLoader().load(receiptSrc)
      tex.colorSpace = THREE.SRGBColorSpace
      receiptMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.32),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
      )
      receiptMesh.position.copy(crumpled.position)
      receiptMesh.scale.setScalar(0.01)
      scene.add(receiptMesh)
    }

    function onSelect() {
      if (!placed) return
      startUnfold()
    }

    function finish() {
      if (finishedRef.current) return
      finishedRef.current = true
      onClueFound()
      session?.end().catch(() => {})
    }

    function onXRFrame(_, frame) {
      const refSpace = renderer.xr.getReferenceSpace()

      if (!placed && hitTestSource) {
        const results = frame.getHitTestResults(hitTestSource)
        if (results.length > 0) {
          const pose = results[0].getPose(refSpace)
          reticle.visible = true
          reticle.matrix.fromArray(pose.transform.matrix)
          hitStableFrames++
          // Auto-placér papiret når overfladen har været stabil et øjeblik.
          if (hitStableFrames > 30) placePaper()
        } else {
          reticle.visible = false
          hitStableFrames = 0
        }
      }

      if (unfolding && receiptMesh) {
        unfoldT = Math.min(1, unfoldT + 0.016)
        const e = easeOutCubic(unfoldT)
        // krøllet papir forsvinder
        crumpled.scale.setScalar(1 - e)
        crumpled.visible = unfoldT < 1
        // regning skalerer op, retter sig op og bevæger sig mod kameraet
        const camPos = new THREE.Vector3()
        camera.getWorldPosition(camPos)
        const target = camPos.clone().add(
          new THREE.Vector3(0, -0.05, -0.35).applyQuaternion(camera.quaternion),
        )
        receiptMesh.position.lerpVectors(crumpled.position, target, e)
        receiptMesh.scale.setScalar(THREE.MathUtils.lerp(0.01, 1, e))
        receiptMesh.lookAt(camPos)
        receiptMesh.rotation.z = (1 - e) * 0.6
        if (unfoldT >= 1) finish()
      }

      renderer.render(scene, camera)
    }

    async function start() {
      try {
        const canvas = document.createElement('canvas')
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.xr.enabled = true

        session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay'],
          domOverlay: { root: overlayRoot },
        })
        if (disposed) {
          session.end().catch(() => {})
          return
        }

        await renderer.xr.setSession(session)

        const viewerSpace = await session.requestReferenceSpace('viewer')
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace })

        session.addEventListener('select', onSelect)
        session.addEventListener('end', () => {
          if (!finishedRef.current) onExit()
        })

        renderer.setAnimationLoop(onXRFrame)
      } catch {
        // WebXR kunne ikke starte → tilbage til fallback-kameraet.
        onExit()
      }
    }

    start()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      if (renderer) {
        renderer.setAnimationLoop(null)
        renderer.dispose()
      }
      if (session && !finishedRef.current) session.end().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // DOM-overlay der vises ovenpå AR-kameraet.
  return (
    <div ref={overlayRef} className="ui-overlay xr-overlay">
      <div className="ui-top">
        <div className="clue-box">
          <p className="clue-box__text">{clueText}</p>
          <span className="clue-box__tail" />
        </div>
        <div className="ui-controls">
          <button type="button" className="help-btn" aria-label="Hjælp">
            ?
          </button>
          <span className="status-badge">{found}/3 FUNDET</span>
        </div>
      </div>
      <button type="button" className="ar-launch ar-exit" onClick={onExit}>
        Afslut AR ✕
      </button>
    </div>
  )
}

// Procedurelt "krøllet" off-white papir: en flad klump med ujævn overflade.
function makeCrumpledPaper() {
  const geo = new THREE.IcosahedronGeometry(0.08, 3)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n =
      Math.sin(v.x * 30) * Math.cos(v.y * 28) +
      Math.sin(v.z * 26) * 0.8 +
      Math.cos(v.x * 18 + v.z * 22) * 0.6
    v.multiplyScalar(1 + n * 0.12)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf3ecd8,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.scale.set(1.2, 0.55, 1.2) // tryk fladt så det ligger naturligt på bordet
  return mesh
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}
