# MOBIL-TEST-FUNKTION

WebAR-prototype (React + Vite + Three.js + WebXR) der demonstrerer **én** sidequest
fra en museumsoplevelse til **Industrimuseets Arbejderboliger 1955**.

Quest: **"En mystisk regning??"** — brugeren bevæger sig rundt i lejligheden,
finder et sammenkrøllet stykke papir i AR, trykker på det, og papiret folder sig
ud til en regning fra en smykkeforretning.

---

## 1. Hvilke filer er lavet

```
index.html                    – mobil viewport (vertikal, viewport-fit=cover)
vite.config.js                – Vite + React, host:true så mobilen kan tilgå serveren
package.json                  – afhængigheder (react, three) + scripts

src/
  main.jsx                    – React-entry
  App.jsx                     – global tilstand: faser (camera → quest → end) + XR-detektering
  components/
    CameraExperience.jsx      – landingsskærm: getUserMedia-kamera + fast UI-overlay
                                 + krøllet papir + unfold-illusion (fallback)
    ARScene.jsx               – ÆGTE WebXR (immersive-ar, hit-test, dom-overlay) i Three.js
    QuestOverlay.jsx          – quest-kortet "En mystisk regning??" (retro 1950'er-stil)
    EndScreen.jsx             – lille afslutningsskærm efter "VIDERE →"
  styles/
    global.css                – al styling: UI-overlay (matcher referencebilledet),
                                 krøllet papir, unfold-animation, quest-kort, dekorationer
  assets/
    receipt.svg               – PLADSHOLDER-kvittering (smykkeforretning, 1955)
    receipt.js                – ét sted at vælge kvitteringsbilledet (svg eller din png)
```

---

## 2. Hvor kvitteringsbilledet skal ligge

Som standard bruges pladsholderen `src/assets/receipt.svg`.

Sådan bruger du dit eget billede:

1. Læg din fil her: **`src/assets/receipt.png`**
2. Åbn **`src/assets/receipt.js`** og skift importen:

   ```js
   // import receiptSrc from './receipt.svg'
   import receiptSrc from './receipt.png'   // ← din fil
   ```

Billedet bruges automatisk begge steder: som **texture på den udfoldede regning** i AR
(`ARScene`) og som **hovedbillede i quest-visningen** (`QuestOverlay`).

> Anbefalet format: stående (portræt), fx ~620×900 px, PNG/JPG.

---

## 3. Sådan startes projektet lokalt

```bash
npm install
npm run dev
```

Vite starter på `http://localhost:5173` (og udskriver også en `Network:`-adresse,
fx `http://192.168.x.x:5173`, som du bruger på mobilen).

Produktion:

```bash
npm run build      # bygger til dist/
npm run preview    # server til at teste build'et
```

---

## 4. Sådan testes det på mobil

WebXR og kamera kræver en **sikker kontekst (HTTPS)** på en rigtig telefon.
`localhost` er undtaget, men en LAN-IP er det ikke — så vælg én af:

- **Nemmest (anbefalet):** tunnelér dev-serveren med HTTPS:
  ```bash
  npx localtunnel --port 5173      # eller: npx cloudflared tunnel --url http://localhost:5173
  ```
  Åbn det udleverede `https://…`-link på telefonen.

- **Samme WiFi uden HTTPS:** virker til at se UI'et, men kamera/WebXR kræver typisk
  HTTPS i Chrome/Safari.

På telefonen:
1. Åbn linket → giv **kameraadgang**.
2. Du lander direkte i kameraet med UI-overlayet.
3. Vent på "scanner overflade…", tryk på det **krøllede papir** → det folder ud til
   regningen → quest-kortet fader ind → tryk **"VIDERE →"**.
4. Understøtter enheden ægte AR (typisk **Android + Chrome** med ARCore), vises også
   knappen **"Start ægte AR ▸"** for den rigtige WebXR-oplevelse med hit-test.

> iOS/Safari understøtter pt. ikke WebXR immersive-ar → der bruges automatisk fallback.

---

## 5. Hvad er rigtig WebXR, og hvad er fallback

**Rigtig WebXR — `src/components/ARScene.jsx`:**
- `navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], … })`
- **Hit-test** registrerer en rigtig flad overflade (fx et bord); en reticle følger den.
- Når overfladen er stabil, placeres et **procedurelt krøllet 3D-papir** (Three.js,
  forskudte vertices + flad skygge) automatisk på overfladen.
- Tryk (`select`) folder papiret ud: krøllen skaleres væk, en plane med
  kvitteringens texture skalerer/retter sig op og **bevæger sig mod kameraet**.
- `dom-overlay` viser det samme UI (blå boks, ?-knap, badge) ovenpå kamerabilledet.

**Fallback — `src/components/CameraExperience.jsx`:**
- Bruges når WebXR ikke er tilgængeligt (fx iOS, desktop), og er altid landingsskærmen.
- `getUserMedia({ video: { facingMode: 'environment' } })` viser det rigtige kamera
  som baggrund, med præcis det samme UI-overlay ovenpå.
- En kort "scanner overflade…" beat → et **krøllet papir som DOM/CSS-objekt** vises.
- Tryk afspiller samme illusion via CSS: krøllet papir fader/skaleres ud, og en flad
  plane med kvitteringen skaleres + roteres ind og flyver frem mod kameraet, hvorefter
  baggrunden dæmpes og quest-indholdet fader ind.

Begge veje ender samme sted: `onClueFound()` → status-badge skifter til **"1/3 FUNDET"**
og quest-kortet vises.

---

## Teknologi

React · Vite · Three.js · WebXR (hit-test, dom-overlay) · getUserMedia (fallback).
Ingen login, ingen backend, ingen database.
