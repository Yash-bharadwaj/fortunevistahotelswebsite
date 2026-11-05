# Fortune Vista Stay Inn, one-page website

A single-page site for Fortune Vista Stay Inn (Hafeezpet, Hyderabad): hotel rooms,
the Vedika Banquet Hall, and Sampradhaya Spicy Kitchen catering.

Plain HTML, CSS and vanilla JavaScript. **No build step, no framework, no dependencies.**
Open `index.html` or upload the folder to any static host.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly via `file://` also works, except the Google Maps embed.)

## Deploying to Cloudflare

This folder **is** the deployable site. There is nothing to compile, so the
build command is always empty.

**Workers (what the dashboard offers by default)** — `wrangler.jsonc` declares
the repo root as the assets directory and serves `404.html` for unmatched
paths. In the dashboard: leave *Build command* empty, keep the deploy command
as `npx wrangler deploy`. Locally: `npx wrangler deploy`.

**Pages (the legacy workflow)** — connect the repo, leave the build command
empty, set the build output directory to `/`. Or `npx wrangler pages deploy .`

`_headers` and `_redirects` are honoured by both. Remember to point
`robots.txt`, `sitemap.xml` and the `<link rel="canonical">` plus the Open
Graph URLs in `index.html` at the final domain.

## Layout

```
index.html              the whole page
404.html                not-found page (Cloudflare serves this automatically)
wrangler.jsonc          Workers deploy config (assets-only)
_headers                cache + security headers
_redirects              /menu, /rooms, /banquet ... to the matching anchor
robots.txt, sitemap.xml
assets/css/styles.css   all styles
assets/js/main.js       nav, carousels, menu modal, lightbox
assets/fonts/           self-hosted Fraunces (woff2, 2 subsets)
assets/img/             optimised AVIF + WebP, several widths each
```

Full-resolution source photos and the brand logo files are kept **outside**
this folder, in `../fortuneVista-source/`, so they are never deployed.

## Content on the page

Hero (4-photo auto-rotating carousel, fixed headline) · quick links · About ·
Rooms (3 tiers) · Amenities · Vedika Banquet Hall · Sampradhaya catering
(with a full menu modal) · Gallery · Location · Contact.

The hero rotates every 6s, pauses on hover and when the tab is hidden, supports
swipe and dot navigation, and does not auto-rotate under `prefers-reduced-motion`.

### Room tariffs

| Room | Per night |
|---|---|
| Superior | ₹2,499 |
| Deluxe | ₹1,999 |
| Twin Bed Executive | ₹1,499 |

Shown as "+ 5% GST", with a note that an extra mattress is ₹500 + GST.

### Contact used throughout

`+91 96406 12413` and `fortunehotelstayinn@gmail.com`, taken from the business card
in the project folder. Every Call / WhatsApp / email button and the schema.org block uses these.
To change them, search and replace `9640612413` and the email in `index.html`.

## Editing

**Prices / text**: all in `index.html`, no templating.

**Catering menu**: the `MENU` array near the top of the JS section in
`assets/js/main.js`. Each item is `{ n: name, d: description, p: price }`.
`yoursite.com/#menu` opens the menu directly, which is handy to share on WhatsApp.

**Photos**: images are pre-sized into `assets/img/` as `<name>-<width>.webp|avif`.
To swap one, regenerate the same filenames at the same widths, or point the
`<picture>` block in `index.html` at new files.

## Performance notes

- Hero slide 1 is preloaded (~47 KB AVIF) and stays the LCP image; the other
  three hero slides are only built in JS ~1s after `load`, so they never
  compete with it. Everything below the fold is lazy-loaded.
- Every photo ships as AVIF with a WebP fallback, at 2–3 widths with `sizes`.
- Fraunces is **self-hosted** (`assets/fonts/`), so there is no connection to
  fonts.googleapis.com or fonts.gstatic.com. The latin subset is preloaded.
  Body text uses the system font stack, so it costs nothing.
- No third-party requests at all on first load.
- All icons are one inline SVG sprite, so no icon font and no extra requests.
- Total image payload on disk is ~3.7 MB across all variants; a first view
  loads only a small fraction of that.

## Browser support

Modern evergreen browsers. Degrades gracefully: without JavaScript every section
is still visible and all links work. Only the carousels, menu modal and lightbox
are inert.
