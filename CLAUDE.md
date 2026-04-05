# Photobooth Character — CLAUDE.md

Internal development guide for Claude Code sessions.

---

## What this app does

A web-based photobooth experience. The user uploads a photo or takes one with their camera. An AI (Claude Vision) analyses the photo and suggests a set of illustrated character assets. The user sees the composited character in an editor, can swap any asset manually, then exports their card as a PNG. Exported cards are added to an on-screen binder/collection for the session.

This is a single-user, single-session app — no accounts, no database, no guest lists.

---

## Visual design & aesthetic

**Overall vibe:** Clean, modern, playful. White space with punchy accent colours. Smooth animations throughout. Think modern SaaS meets arcade cabinet — fun but not childish.

**Colours:**
- Background: white or very light grey (#F8F7F4)
- Primary accent: a bold punchy colour (e.g. coral #FF5C3A or electric blue #3B5BFF — pick one and commit)
- Secondary accent: soft yellow or mint for highlights
- Text: near-black (#1A1A1A), never pure black
- Cards: white with a subtle shadow, slightly rounded corners

**Typography:**
- Playfair Display — display headings, card titles, anything that needs personality
- DM Sans — UI labels, body text, buttons
- Load both via Google Fonts

**Motion & animation:**
- Cards slide in from the bottom when added to the binder (spring easing)
- Asset swaps in the compositor animate with a quick fade/pop (150ms)
- Screen transitions use a smooth slide or fade
- Export button has a satisfying press animation
- Loading state during AI analysis: a fun animated illustration or pulsing card outline — not a generic spinner
- All animations respect prefers-reduced-motion

**Layout:**
- Generous white space — breathe between elements
- The compositor takes centre stage — large canvas, controls tucked to the side
- Binder sits below or beside the main flow, like a physical card collection spreading out
- Desktop-first, mobile-responsive is nice-to-have

**Components:**
- Buttons: rounded, bold, with hover lift effect (subtle box-shadow change + translateY(-1px))
- Asset panel thumbnails: small rounded card tiles, selected state with accent border + slight scale-up
- Flagged categories (AI uncertainty): yellow dot or yellow border, not a scary red warning
- Card in compositor shown with a soft drop shadow as if it's a physical card sitting on a desk

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Canvas / compositor | Konva.js |
| Backend | Node.js + Express |
| AI photo analysis | Claude Vision API (claude-sonnet-4-6) |
| Image processing | Sharp (HEIC/JPEG conversion, resize) |
| File upload | Multer (memory storage) |
| Styling | CSS modules or plain CSS — no Tailwind needed |

No database. No auth. No bulk upload.

---

## Project structure

```
photobooth-character/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera.jsx          # Webcam capture
│   │   │   ├── Compositor.jsx      # Konva canvas + layer rendering
│   │   │   ├── AssetPanel.jsx      # Swap UI — click to change assets
│   │   │   ├── Binder.jsx          # Collection of exported cards
│   │   │   └── ExportButton.jsx    # Export current card as PNG
│   │   ├── assets/                 # PNG asset files
│   │   └── App.jsx
├── server/
│   ├── routes/
│   │   └── analyse.js              # Claude Vision endpoint
│   ├── assetMapping.json           # Feature → asset rules
│   └── index.js
└── CLAUDE.md
```

---

## Asset library

Assets are hand-drawn PNG files. Canvas size: exactly 630 × 880px with transparent background (RGBA).

**Layer order (bottom to top):**

| Layer | Category | Notes |
|---|---|---|
| 1 | frame | Card border — one style per session |
| 2 | body | Body silhouette + outfit |
| 3 | face | Face shape — tinted for skin tone |
| 4 | facialhair | Beard/stubble/none |
| 5 | nose | |
| 6 | mouth | |
| 7 | eyes | Includes eyebrows |
| 8 | hair_length | Back/length layer |
| 9 | hair_front | Front/fringe layer |
| 10 | accessory | Glasses, blush, eyelashes — **multiselect**, stored as an array |
| 11 | twinkle | Always circle — decorative |

**Multiselect:** `accessory` supports stacking — `recipe.assets.accessory` is an array of selected asset names. Clicking a tile toggles it in/out. All other categories are single-select strings.

**Body auto-select:** `body` has only one variant and is auto-selected when variants load (`MakerPage.jsx`). It is intentionally hidden from the asset panel — there's nothing to swap.

**Tinting:** Hair and skin tinted at render time using multiply blending. Assets drawn in black (hair) or mid-grey (skin/outfit). Compositor applies colour on top.

**File naming:** `category_variant.png` — lowercase, underscores only.

---

## API

### POST /analyse

Accepts a photo upload. Returns an asset recipe.

**Query params:**
- `?mock=true` — skips Claude API call, returns hardcoded mock features (use for dev/testing)

**Request:** `multipart/form-data` with field `photo`

**Response:**
```json
{
  "recipe": {
    "assets": {
      "face": "face_oval",
      "hair_length": "hair_length_short",
      "eyes": "eyes_almond_brown"
    },
    "colours": {
      "skin": "#C08060",
      "hair": "#3D1F0A",
      "outfit": "#2D3561"
    }
  },
  "flags": ["facialhair"],
  "detectedFeatures": { ... }
}
```

`flags` = categories where no rule matched and the default was used. Show these with a yellow highlight in the asset panel.

---

## Asset mapping

Rules live in `server/assetMapping.json`. Edit this file to change mappings — no code changes needed.

Rules evaluate top-to-bottom. First full match wins. If no rule matches and rules array is non-empty → use default and flag that category. Empty rules array = intentional default, never flagged.

---

## Export — core feature, do not skip

**Single card export:**
- Exports the current compositor state as a PNG at 630 × 880px
- Uses Konva's `stage.toDataURL()` or `stage.toBlob()` to capture the canvas
- Triggers a browser download with filename `character_[timestamp].png`
- Also adds the exported PNG to the binder collection in React state

**Export button behaviour:**
- Shows a brief loading state for satisfaction even if near-instant
- Plays a subtle animation on success — card "flies" into the binder
- Button label: "Export card" with a download icon

**Binder:**
- Stores exported cards as data URLs in React state (no backend needed)
- Renders as a grid of card thumbnails — like polaroids spread on a table
- Clicking a binder card re-opens it in the editor
- Cards animate in with a slide-up + fade when added
- Session only — clears on page refresh (fine for MVP)

---

## Camera

- Uses browser `getUserMedia` API
- Capture button takes a still frame from the video stream
- Captured frame sent to `/analyse` the same as an uploaded photo
- Falls back gracefully to file upload if camera permission denied
- Camera view styled like a photobooth viewfinder — fun framing, maybe a countdown on capture

---

## What this app does NOT have

- User accounts or login
- Multiple guests or guest lists
- Bulk upload or bulk export
- Wedding orders or order management
- Approval/revision workflow
- Database or persistent storage
- Backend file storage

Keep scope tight. Single-user, single-session photobooth toy.

---

## Environment variables

```
ANTHROPIC_API_KEY=your_key_here
```

---

## Development workflow

1. `cd server && npm start` — runs on port 3001
2. `cd client && npm run dev` — runs on port 5173
3. Use `?mock=true` on the analyse endpoint to test without burning API credits
4. Edit `assetMapping.json` to tune feature → asset rules
5. Edit `MOCK_FEATURES` in `analyse.js` to test different character types

---

## Common issues

- **White background on export:** PNG background layer not hidden in Procreate export.
- **Assets misaligned:** File not drawn on the shared 630×880 canvas.
- **Claude returns unexpected feature values:** Check allowed values in `SYSTEM_PROMPT` inside `analyse.js`. Add a rule to `assetMapping.json`.
- **JSON parse error on server start:** `assetMapping.json` has a syntax error. Validate at jsonlint.com.
- **Export produces blank PNG:** Konva stage must be fully rendered before calling toDataURL. Ensure all image assets are loaded before triggering export.
