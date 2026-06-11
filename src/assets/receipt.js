// ──────────────────────────────────────────────────────────────────────────
//  KVITTERINGSBILLEDE
//
//  Som standard bruges den vedlagte pladsholder `receipt.svg` (en stiliseret
//  regning fra en smykkeforretning anno 1955).
//
//  SÅDAN BRUGER DU DIT EGET BILLEDE:
//    1. Læg din fil her:  src/assets/receipt.png
//    2. Skift importen herunder til:  import receiptSrc from './receipt.png'
//
//  `receiptSrc` bruges to steder:
//    - som texture på den udffoldede regning i AR (ARScene)
//    - som hovedbillede i quest-visningen (QuestOverlay)
// ──────────────────────────────────────────────────────────────────────────

import receiptSrc from "./receipt.svg";
// import receiptSrc from './receipt.png'  // ← aktivér denne linje for dit eget billede

export default receiptSrc;
