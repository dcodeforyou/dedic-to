# dedic.to — App Brief for Claude Code

## What We're Building

A web app where people dedicate a song to someone — an ex, a partner, a friend, someone they can't name — without using any real names. You pick a song, pick a category like "my ex" or "someone who'll never know", write an optional anonymous message, and get a unique shareable link that opens a cinematic page showing the dedication with the song embedded.

The dedicated page has a "make yours" button that loops new people into creating their own dedication. Primary discovery is through Instagram stories — someone posts their dedication as a story with a link sticker pointing to the site, a viewer taps it, lands on the site, makes their own.

---

## Two Pages Only. Nothing Else.

---

## Page 1 — `/` (the create page)

This is the only page where users interact. It is **mobile-first**. It will also be opened inside Instagram's in-app browser when someone taps a link sticker on a story, so it must load fast, feel native on mobile, and work without any login or account.

### Step 1 — Song Search

There is a search input at the top. When the user types a song name, it calls the iTunes Search API:

```
https://itunes.apple.com/search?term=QUERY&media=music&limit=10
```

- No API key needed
- Completely free
- Works directly from the browser (CORS-friendly)
- Results show: album art, song title, artist name
- Use the artwork URL but replace `100x100bb` with `600x600bb` for higher quality
- User taps a result to select it
- Only one song can be selected at a time

### Step 2 — Category Selector

Below the search results, category chips let the user pick who the dedication is for.

**Options:**
- `my ex`
- `my person`
- `the one i can't name`
- `my best friend`
- `someone who'll never know`
- `future me`

- Only one can be selected at a time
- Displayed as pill-shaped buttons
- Default: none selected, user must pick one before generating

### Step 3 — Optional Anonymous Message

- A text input below the category chips
- Placeholder: `"say something... (optional, stays anonymous)"`
- Max 120 characters
- Show a live character counter

### Step 4 — Generate Button

A full-width button at the bottom that says `"generate →"`. When tapped, it does two things simultaneously:

**1. Generates a unique shareable URL**

Built by base64-encoding the dedication state and appending it as a query param:

```
dedic.to/view?d=BASE64STRING
```

State object to encode:
```json
{
  "trackId": "...",
  "trackName": "...",
  "artistName": "...",
  "artworkUrl": "...",
  "previewUrl": "...",
  "category": "...",
  "message": "..."
}
```

No database needed for MVP — all data lives in the URL itself.

**2. Generates a 1080×1920 story card image**

Using the Canvas API or `html2canvas`. The card contains:

| Element | Detail |
|---|---|
| Background | `#0D0A1A` (dark purple-black) |
| Album art | Centered, upper third of card |
| Song title | Below album art, bold, white |
| Artist name | Below title, muted |
| Category pill | Neon green `#BEFF29`, dark text |
| Message | Italic, below pill |
| Arrow | Large `↓` in neon green pointing down |
| CTA text | `"dedicate yours"` above arrow |
| Watermark | `"dedic.to"` at very bottom |

### Step 5 — Share Options

Three buttons appear after generation:

| Button | Action | When to show |
|---|---|---|
| `share to story` | `navigator.share({files: [pngFile]})` → OS share sheet → user picks Instagram | Mobile only, check `navigator.canShare` first |
| `copy link` | Copies `dedic.to/view?d=...` to clipboard | Always |
| `download` | Downloads the PNG card | Always (fallback) |

> On desktop: only show `copy link` and `download`. The share sheet does not work reliably on desktop browsers.

---

## Page 2 — `/view` (the dedicated output page)

This is what opens when someone taps a shared link. It reads the `d` query param, base64-decodes it, and renders the dedication.

**Theme:** Dark (`#0D0A1A` background)

### What it shows, top to bottom:

1. Album art — large, centered
2. Song title — bold, white
3. Artist name — muted
4. Category pill — neon green `#BEFF29`, text: `"dedicated to: [category]"`
5. Anonymous message — italic, if present
6. Audio player — HTML5 `<audio>` element using the iTunes `previewUrl` MP3 (30 seconds, no account needed, free for everyone)
7. `"make yours →"` button — full-width neon green, links back to `/`

### Open Graph Meta Tags

This page needs proper OG tags so link previews work in iMessage, WhatsApp, Twitter, etc.

- **OG image:** Server-generated via `@vercel/og` at `/api/og?d=BASE64STRING`
- **OG title:** `"[Song title] — dedicated to: [category]"`
- **OG description:** The message if present, otherwise `"someone dedicated a song on dedic.to"`

---

## Tech Stack

| Item | Choice |
|---|---|
| Framework | Next.js 14, App Router |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Database | None (MVP — state in URL) |
| Auth | None — fully anonymous |

### Dependencies

```bash
npm install html2canvas @vercel/og
```

---

## APIs Used

### iTunes Search API
```
https://itunes.apple.com/search?term=QUERY&media=music&limit=10
```

- Free, no API key, no auth, CORS-friendly
- Works directly from the browser

**Key fields returned:**

| Field | Use |
|---|---|
| `trackName` | Song title |
| `artistName` | Artist |
| `artworkUrl100` | Replace with `artworkUrl600` for quality |
| `previewUrl` | 30-second MP3, plays in HTML5 audio, no account needed |

> No Spotify API needed. iTunes preview gives 30 seconds of audio to everyone for free.

---

## Folder Structure

```
/app
  /page.tsx              ← Page 1: create page
  /view/page.tsx         ← Page 2: dedicated output page
  /api/og/route.tsx      ← Server-side OG image generation
  /api/image/route.tsx   ← Artwork proxy (fixes CORS for canvas)

/components
  /SongSearch.tsx        ← Search input + results list
  /CategoryPicker.tsx    ← Category chip selector
  /MessageInput.tsx      ← Optional message textarea
  /GenerateButton.tsx    ← Generate CTA
  /ShareOptions.tsx      ← Share / copy / download buttons
  /DedicationCard.tsx    ← Output view (Page 2 content)
  /AudioPlayer.tsx       ← iTunes preview player

/lib
  /encode.ts             ← Base64 encode/decode dedication state
  /itunes.ts             ← iTunes API fetch function
  /generateCard.ts       ← html2canvas story card generator
```

---

## Design Tokens

```css
/* dedic.to — Design Tokens */
/* Paste into globals.css */

:root {
  /* Backgrounds */
  --bg-page:         #F7F4FF;
  --bg-surface:      #FFFFFF;
  --bg-tinted:       #EDE6FF;

  /* Brand Purple */
  --purple-light:    #C4ACFF;
  --purple:          #7C4DFF;
  --purple-deep:     #5B2FE8;

  /* Neon Accent (Brat green) */
  --neon:            #BEFF29;
  --neon-dark:       #8ACE00;
  --neon-text:       #5A8A00;

  /* Periwinkle (Y2K) */
  --blue-soft:       #A8C4FF;
  --blue:            #5B8FE8;

  /* Text */
  --text-primary:    #0D0A18;
  --text-secondary:  #6B6080;
  --text-muted:      #A89EC0;

  /* Borders */
  --border:          #E4DEFF;
  --border-strong:   #C8BEFF;

  /* Functional */
  --pink:            #FF6B9D;

  /* Dark card (output page) */
  --card-bg:         #0D0A1A;
  --card-surface:    #1C1535;
  --card-border:     #2A2048;
  --card-text:       #F5F0FF;
  --card-muted:      #7A6FA8;

  /* Border Radius */
  --r-sm:            8px;
  --r-md:            14px;
  --r-lg:            20px;
  --r-pill:          50px;

  /* Font */
  --font:            'Plus Jakarta Sans', sans-serif;
}
```

### Typography

- **Font:** Plus Jakarta Sans (free on Google Fonts)
- **Weights:** 400, 500, 700, 800
- **Scale:** 13 / 15 / 18 / 24 / 32 / 48px
- **Style:** lowercase everything — `"dedicate a song"` not `"Dedicate A Song"`. Lowercase = authentic, Gen Z native.

### Border Radius

| Token | Value | Used for |
|---|---|---|
| `--r-sm` | 8px | Inputs, small tags |
| `--r-md` | 14px | Cards |
| `--r-lg` | 20px | Panels, sheets |
| `--r-pill` | 50px | Buttons, chips |

---

## Key Behaviors and Edge Cases

### URL encoding
The base64 URL param must be URL-safe. Use `btoa`/`atob` and:
- Replace `+` with `-`
- Replace `/` with `_`
- Strip `=` padding

On decode, reverse this.

### CORS fix for canvas
`html2canvas` will fail if the album art image blocks due to CORS. Fix this by proxying the artwork URL through a Next.js API route:

```
/api/image?url=ENCODED_ARTWORK_URL
```

This route fetches the image server-side and returns it — avoiding the browser CORS restriction.

### Missing preview URL
If the iTunes `previewUrl` is null for a track (some tracks don't have previews), still allow the dedication to be created but hide the audio player on the view page and show `"preview not available"` instead.

### Desktop vs mobile share
- Check `navigator.canShare` before rendering the share button
- On desktop: show only `copy link` and `download`
- On mobile: show all three options

### Instagram in-app browser
The create page must work inside Instagram's in-app browser. The Web Share API behaves differently in IG's browser vs native Safari. Always show the `download` button as the guaranteed fallback regardless of platform.

---

## What This Is NOT

- No user accounts
- No stored data anywhere
- No social feed or public gallery
- No analytics dashboard
- No admin panel
- No payments
- No push notifications

Just two pages, one API call, one canvas generation, and one share flow. Keep it as simple as possible.

---

## Viral Loop (How It Spreads)

```
Someone posts their dedication as an Instagram story
        ↓
They add a Link sticker pointing to dedic.to
        ↓
A viewer sees the story and taps the sticker
        ↓
dedic.to opens in Instagram's in-app browser
        ↓
They search a song, pick a category, write a message
        ↓
They tap generate → get their card + shareable link
        ↓
They share the card to their own story
        ↓
They add a link sticker pointing to dedic.to
        ↓
The cycle repeats
```

---

*dedic.to — a song for someone. no name. just a feeling.*
