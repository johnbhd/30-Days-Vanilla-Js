# Isla — Philippine Journeys

A responsive, single-page landing site for a Philippine nature/travel brand.
Plain HTML, CSS and JavaScript — no frameworks, no build step, no dependencies.

![Hero: Big Lagoon, El Nido](https://commons.wikimedia.org/w/thumb.php?f=Big_Lagoon_at_El_Nido%2C_Palawan%2C_Philippines.jpg&w=1200)

## Run it

Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

A local server is only needed if your browser blocks remote images from `file://`
(it usually doesn't, but serving is the safer habit).

## What's inside

```
index.html        all markup, semantic sections, inline SVG icons
css/styles.css    design tokens → base → components → breakpoints
js/main.js        every interaction, vanilla, progressive
README.md
```

## Sections

1. **Hero** — full-viewport photo, scroll parallax, dual CTA, scroll cue
2. **Marquee** — infinite strip of destination names
3. **Why the Philippines** — split layout with count-up stats
4. **Destinations** — six-card asymmetric grid (large feature card + five)
5. **Experiences** — full-bleed parallax band with four feature cards
6. **Gallery** — nine-photo mosaic with keyboard-navigable lightbox
7. **Quote** — typographic pull-quote on sand
8. **Plan** — inquiry form with client-side validation and success state
9. **Footer** — link columns, newsletter, photo credits

## Interactions

- Sticky header that switches to a solid, blurred state on scroll
- Full-screen mobile menu: focus trap, `Escape` to close, scroll lock, focus restore
- Scroll-spy that marks the current section in the nav
- Staggered reveal-on-scroll with `IntersectionObserver`
- Count-up statistics
- Hero/band parallax driven by `requestAnimationFrame`
- Photo lightbox on native `<dialog>`: arrows, prev/next, backdrop click, focus restore
- Form validation with inline errors, `aria-invalid`, and a success state
- Newsletter validation
- Every motion effect is disabled under `prefers-reduced-motion`

## Responsive behaviour

Mobile-first, with breakpoints at **640**, **900**, and **1000** px.

- Destination cards: 1 → 2 → 3 columns (the feature card spans 2×2 from 900px)
- Gallery: 2-column mosaic → 6-column mosaic with a tall lead image
- Hero uses `svh` so mobile browser chrome doesn't clip it
- Fluid type and spacing via `clamp()`; tap targets ≥ 44px

## Customising

**Colours, type and spacing** all live in `:root` at the top of `css/styles.css`:

```css
--teal-900: #062b2c;   /* deep ocean */
--jade:     #136a5b;   /* forest */
--sand:     #efe3cc;   /* beach */
--gold:     #c9a227;   /* accent */
--cream:    #faf7f1;   /* page background */
--font-display: "Fraunces", Georgia, serif;
--font-sans:    "Manrope", system-ui, sans-serif;
```

**Photography** is hot-linked from Wikimedia Commons through a thumbnail endpoint:

```
https://commons.wikimedia.org/w/thumb.php?f=<FILE_NAME>&w=<WIDTH>
```

To use your own photos, replace each `src` / `srcset` pair — and keep the
`width`/`height` attributes on every `<img>` so the layout doesn't shift.
Each image sits on a dark gradient fallback, so a failed request degrades to a
coloured panel instead of a broken-image icon.

**The form is front-end only.** On a valid submit it swaps to a success message;
nothing is sent anywhere. Point `#tripForm`'s submit handler in `js/main.js` at
your endpoint (Formspree, Netlify Forms, your API) when you're ready.

## Accessibility

- Skip link, landmark elements, logical heading order
- Descriptive alt text on every photograph; decorative icons are `aria-hidden`
- Visible focus rings throughout
- Mobile menu and lightbox both trap/restore focus and close on `Escape`
- Inline form errors announced via `aria-live` and linked by `aria-describedby`
- Reduced-motion support

## Performance

- Hero image preloaded with `imagesrcset`; everything below the fold is `lazy`
- `srcset` + `sizes` serve 480/640/800–1200/1600/2000px variants
- No JavaScript libraries, no CSS framework, no web fonts beyond two families
- `defer` on the single script; no layout thrash in scroll handlers (rAF-throttled)

## Photo credits

All photographs are from [Wikimedia Commons](https://commons.wikimedia.org/),
under CC BY 4.0, CC BY-SA 3.0/4.0, or CC0. Full per-image attribution is in the
**Photo credits** disclosure in the footer of the page — keep it (and the
licence notices) if you publish this.

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses `IntersectionObserver`,
`<dialog>`, `clamp()`, `svh` units, and CSS custom properties; older browsers
receive static content with reduced motion rather than a broken page.
