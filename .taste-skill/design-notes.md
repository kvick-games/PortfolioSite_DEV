# Portfolio redesign, second direction (October 13, 2026)

The first Taste v2 pass ("split stage": charcoal and yellow, Imbue serif, a sticky painting column) was rejected by the owner. This direction starts over and uses Taste v2 (`design-taste-frontend`) as a set of checks, not a recipe.

## Idea

Show the work as working interfaces. The first screen states the job ("Interfaces for games and creative tools"). Right below it is real God of War menu footage, in a tabbed viewer that behaves like the menus it shows. Each project after that gets its own composition, sized to the material it actually has.

## System

- Ground #e8e7e2 (softened from #ededea so it isn't glaring), tone step #dcdbd5, ink #121314 / #4d5054. Night field #0f1011 for EWA and the private preview. Vermilion #f2481b for actions, focus and the DREAMATRON field.
- One typeface, Instrument Sans (OFL, self-hosted, variable weight and width). Display text is 600 weight at 86% width, tracked -0.035em.
- 12-column grid, pill buttons. No gradients, eyebrows, monospace, shadows or hairline rules.
- **Dark theme is the default:** a pure black ground (#000), with ink #e6e5e0 / #9fa2a5. The EWA and DREAMATRON fields are black too, and the grey step (#161617) is only for small surfaces such as tabs, chips and the résumé sheet. In dark mode the DREAMATRON field keeps a vermilion wordmark instead of a full orange slab. The header toggle switches to the light theme and saves the choice (localStorage `theme`). A pre-paint script in index.html applies it, so there is no flash.
- **Brand rule:** DREAMATRON and its apps (AUTEUR, DREAM ENGINE) are always set in capitals with open letter spacing. This is done in CSS (`.brand`, `<Brand />`) so screen readers still read one word. `withBrand()` applies it to names inside running text (résumé lines, project details), and `.brand` never wraps. Tanuki and EWA are credited to DREAM ENGINE, not Unreal.

## Page

| Section | Composition |
|---|---|
| Hero | One-line statement over a horizontal accordion of seven project panels (ProjectSplash): the panel under the pointer opens in colour, the rest are greyscale slices with vertical titles. Touch and narrow screens get a stacked list |
| God of War | Key art first, then a tabbed menu viewer. Its tabs have a magnetic cursor that snaps into a corner-bracket frame, echoing the skill tree cursor in the caption (fine pointers only; gamepad works too) |
| Judas | The still is a play button: it blinks shut to a slit and opens onto the reveal trailer in place (youtube-nocookie, IGN upload because the official one is age-restricted; nothing loads before the click) |
| Tanuki | Header row, mosaic, three design notes beside a playable recipe sketch: grill a carrot, onion or apple and see which of the three example recipes each satisfies. Labelled as a sketch |
| EWA | Night field: key art, concept painting, and one frame holding five captures that hard-cuts between fixed cameras as the pointer crosses it. Statement is a store-blurb pitch that stays vague about the story |
| Level Generator | A seeded TypeScript sketch of the generator builds a floor plan through the pipeline stages (Generate, Place an objective), with the real diagram one click away, and four rooms. Labelled as a sketch; the real one is UE5 |
| DREAMATRON | Vermilion field (black in dark mode) with a full-width wordmark whose letters are revealed one at a time, each sliding in from the left, as it scrolls into view, and carry on to the right as it leaves (ScrollWordmark, scroll-linked, no vertical movement, off under reduced motion). The AI Timeline is embedded as a full-width pannable, zoomable mini board (TimelineMini, snapshot of the live data as of 2 Oct 2026) with its copy laid over the corner. AUTEUR is shown by name with "In development" only, with a door to the client preview |
| Paintings | Justified rows that keep every painting's proportions, with a brushwork loupe on hover (fine pointers) |
| About | Bio and links. The /about résumé is one paper sheet in the original PDF's layout (navy accent sampled from the PDF), printing to one Letter page |

Inner pages:
- Project pages get a full-bleed cover and end with a next-project block.
- Paintings get a gallery and a detail view with previous/next and a "More paintings" row.

## Section shaders

One fixed WebGL canvas behind the home page (SectionShaders), drawn in a worker through OffscreenCanvas, crossfades between very dark scenes per section: GoW mist and frost motes, a Judas light shaft, Tanuki canopy dapples, EWA red haze, a blueprint scan for the Level Generator, a DREAMATRON glow, watercolour glazes for the paintings. Half resolution, 30 fps cap, about 0.04 ms per frame on the main thread. Off in the light theme, on the splash and About, under reduced motion (one still per scene), on software or missing WebGL, and with `?shaders=off`.

## Private preview (/studio/)

- Same system on the night ground, with AUTEUR leading.
- Four views of genuine captures sit in a tabbed viewer.
- Three design notes: the timeline note, audio warp lanes and the compact inspector.
- Two of those notes use crops derived from the captures; both crops are allowlisted on the server and recorded in sources.json.
- It is labelled as in development, "real captures from the working app, October 2026".
- No private pixels are in the public build.

## Content rules kept

- No invented clients, metrics, testimonials or mock interfaces.
- All imagery comes from the existing portfolio, the ArtStation archive, the live DREAMATRON timeline, or the owner's private AUTEUR captures.

## Rounds

- **Round 1**, home at 1440 / 768 / 390. Fixed:
  - The hero actions were read as an eyebrow.
  - The mobile tabs scrolled sideways.
  - The EWA grid broke because of an nth-of-type miscount.
  - The Tanuki header was scattered.
- **Round 2**. Fixed:
  - On phones, the God of War heading now sits above the footage.
  - The EWA captures were letterboxed.
  - Images in the Tanuki and AI Timeline case studies repeated the cover.
  - The "Back to work" link above the case-study titles became a next-project block at the end.
  - The phone nav overflowed with the spaced brand name.
- **Final inspector results**:
  - Home: 0 FAIL. Two WARNs come from the brand rule (the spaced name at 14px on phones, plus one extra optical size), and they are accepted.
  - Case study: 0 FAIL.
  - Painting detail: the meter wants motion and footage, which a single still painting doesn't need.

Self-scores: design 8, usability 8, creativity 7.5, content 8.

## Open items for the owner

- Copy to confirm:
  - "from the makers of BioShock" (Judas)
  - "film, sound and games"
  - "Teams of 350 and teams of one"
  - the Tanuki description
  - the legacy case-study dates
- No public email exists, so contact goes through LinkedIn.
