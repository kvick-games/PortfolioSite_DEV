# Portfolio redesign, second direction (October 13, 2026)

The first Taste v2 pass ("split stage": charcoal and yellow, Imbue serif, a sticky painting column) was rejected by the owner. This direction starts over and uses Taste v2 (`design-taste-frontend`) as a set of checks, not a recipe.

## Idea

Show the work as working interfaces. The first screen states the job ("Interfaces for games and creative tools"). Right below it is real God of War menu footage, in a tabbed viewer that behaves like the menus it shows. Each project after that gets its own composition, sized to the material it actually has.

## System

- Ground #e8e7e2 (softened from #ededea so it isn't glaring), tone step #dcdbd5, ink #121314 / #4d5054. Night field #0f1011 for EWA and the private preview. Vermilion #f2481b for actions, focus and the DREAMATRON field.
- One typeface, Instrument Sans (OFL, self-hosted, variable weight and width). Display text is 600 weight at 86% width, tracked -0.035em.
- 12-column grid, pill buttons. No gradients, eyebrows, monospace, shadows or hairline rules.
- **Dark theme is the default:** a near-black ground (#0b0b0c), with ink #e6e5e0 / #9fa2a5. The EWA night field and the DREAMATRON field sit a step lighter (#141416 / #19191b), so sections still separate. In dark mode the DREAMATRON field keeps a vermilion wordmark instead of a full orange slab. The header toggle switches to the light theme and saves the choice (localStorage `theme`). A pre-paint script in index.html applies it, so there is no flash.
- **Brand rule:** DREAMATRON is always set in capitals with open letter spacing. This is done in CSS (`.brand`, `<Brand />`) so screen readers still read one word.

## Page

| Section | Composition |
|---|---|
| Hero | Statement and actions |
| God of War | Tabbed menu viewer: muted loops plus stills, captions from the case study |
| Judas | Image and copy, pushed to the end of the row |
| Tanuki | Header row, mosaic, three design notes |
| EWA | Night field: key art, concept painting, letterbox-cropped captures |
| Level Generator | Pipeline diagram and four rooms |
| DREAMATRON | Vermilion field with a full-width wordmark. The live AI Timeline (dreamatron.ai/timeline) is the public example. DT_Auteur is described in text only, with a door to the client preview |
| Paintings | Justified rows that keep every painting's proportions |
| About | Bio and links |

Inner pages:
- Project pages get a full-bleed cover and end with a next-project block.
- Paintings get a gallery and a detail view with previous/next and a "More paintings" row.

## Private preview (/studio/)

- Same system on the night ground, with DT_Auteur leading.
- Four views of genuine captures sit in a tabbed viewer.
- Three design notes: the timeline note, audio warp lanes and the compact inspector.
- Two of those notes use crops derived from the captures; both crops are allowlisted on the server and recorded in sources.json.
- It is labelled as in development, "real captures from the working app, October 2026".
- No private pixels are in the public build.

## Content rules kept

- No invented clients, metrics, testimonials or mock interfaces.
- All imagery comes from the existing portfolio, the ArtStation archive, the live DREAMATRON timeline, or the owner's private DT_Auteur captures.

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
