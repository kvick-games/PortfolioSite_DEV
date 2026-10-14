# EWA parallax layers

All three layers are registered to the original 1800 x 2044 canvas. WebP quality is 84, with lossless alpha on figure and bar. EXIF, XMP, ICC and generation metadata are omitted.

The requested literal source `Resources/Site/img$1.webp` does not exist. The matching source used was `Resources/Site/img/ewa-ewa-redacted.webp` (1800 x 2044), SHA-256 `c4e2b46ee8dc1191098df1f3ece1dac9e3f364c6764ecd887dd33015734ccfa4`. It was not modified. No `src/` files were changed.

The same deliverables are also saved in the requested literal `Resources/Site/img/layers$5/` directory. The manifest URLs resolve to this canonical `Resources/Site/img/layers/ewa/` directory. Keep the copies synchronized if editing them.

## Method

- **Plate:** Built-in GPT image editing, guided by explicit white/black removal masks and gray masked targets. The first fills were rejected for repeated bar texture or excessive grain. The accepted fill is sparse dark-red grunge. A further masked generative repair removed isolated hair wisps. Local compositing restores the exact original RGB outside the union of removal masks before lossy encoding. Feathering is confined inside the removal masks. There is no dedicated mask argument in the built-in tool: masks were supplied as reference images and enforced during local compositing.
- **Figure:** GPT supplied a transparent matte and plausible red-monochrome eyes/hair behind the bar. SIFT feature matching and a smooth thin-plate warp registered it to the source. A trimap and closed-form alpha matting, followed by contour cleanup, refined the source hair edges. The visible figure RGB is copied from the original; generated RGB is limited to the bar removal support, with a narrow seam allowance and boundary tone matching. Facial and neck ink stays on the figure. No generated whole-figure repaint is used as the delivered RGB.
- **Bar:** Manually bounded, source-red-channel matte retaining the ragged ink edges and the enclosed red print scratch. All nontransparent RGB comes from the original before encoding.

The local work directory `.local/ewa-layers/` contains generation outputs, registration data, mattes, build scripts, and numerical verification. No AI model weights were downloaded. OpenCV and PyMatting were installed locally for registration and matting.

## Verification and integration

`layers.json` is ordered back to front, with depths 0, 0.45, and 1. The exploded proof shifts the figure up 37 pixels and the bar up 82 pixels (rounded depth x 4% x 2044); the plate remains fixed.

Proofs are in `.local/shots/`: `ewa-layers-composite.jpg`, `ewa-layers-exploded.jpg`, `ewa-layers-plate.jpg`, and `ewa-layers-sheet.jpg`. The composite is made by decoding and stacking the actual delivered WebPs, not the working PNGs. Metrics are in `.local/ewa-layers/report.json`; RGB MAE is averaged across every pixel and all three channels on the 0–255 scale. The JPEG proof has its own additional encoding error.

Visual assessment: no recognizable figure/bar ghosts remain in the plate. The shifted composite has no transparent interior holes or duplicated silhouette. The hidden eyes are a plausible invention, and fine hair is an approximate matte of a flattened, already-compressed source. Some source-red contamination remains on individual subpixel hair/ink edges at high magnification. The background is intentionally quieter behind the figure than the perimeter. At the 4% stress offset, the finite jacket layer exposes a red strip at the bottom; crop/overscan the stack when integrating parallax. The delivered frames themselves are intentionally not resized or cropped. This is suitable for subtle motion over its red plate, rather than an unrestricted cutout over arbitrary colors.

## Accepted GPT prompts

### Figure matte and occluded reconstruction

Use case: background-extraction / precise-object-edit. Edit target: supplied red horror illustration. Produce a precisely registered FULL FRAME 1800x2044 portrait RGBA image for parallax layer extraction. Keep the woman at EXACTLY the same position, size, proportions, silhouette, hairstyle, pose as the source; no cropping, zooming, recentering or adding margin. Remove the red grunge background completely to genuine transparency outside the woman. Keep hair, face, neck, shoulders and all ink splatters on her face/neck. Remove ONLY the wide black rectangular redaction strip across her eyes, including its protruding ragged extensions, and plausibly reconstruct the hair, bridge of nose and eyes hidden behind it in the exact same deep red monochrome painted illustration. Eyes should be quiet and heavily shadowed, not glowing, no gore. Original visible face, mouth, hair highlights and ink patterns must be unchanged. Preserve fine hair tips sensibly with clean alpha, absolutely no red backdrop or background brush stroke fragments attached. Shoulder silhouette continues to the bottom edge as in the original. No new text. This will serve as a matte and as a reconstruction patch for ONLY the formerly occluded eye strip; precise alignment is paramount.

### Accepted main plate fill

Inpaint the gray hole in image 1 according to white mask in image 2. The required fill is very simple: a nearly uniform deep red painted wall matching the existing dark crimson background along the top and left. Use the same VERY SMOOTH red pigment and extremely faint broad tonal variation as those original areas. Most of the masked region should look like the existing quiet smooth red area at left, just extended across the whole image. A few sparse fine black diagonal dry-brush scratches may continue from existing marks, but the center stays quiet and simple. Absolutely NO dense grain, NO mottled/crackle pattern, NO stone or fabric texture, NO speckle field, NO added speckled noise, NO black cloud. The original has simple smooth red between occasional black strokes: match that. No person, no hair, no face, no figure, no silhouette, no head-shaped tonal patch, no horizontal bar. Fill everything including the bottom edge in the same simple dark red. Keep original pixels outside mask unchanged. Full frame 1800:2044 aspect, no crop, no border.

### Final stray-hair repair

Precise masked inpainting. Replace ONLY the two gray masked zones of image 1 (white in mask image 2) with the same quiet smooth dark red painted background immediately surrounding them. Remove all gray. Continue the surrounding red tone seamlessly, no trace of the mask edges. These zones previously contained stray human hair strands; there must now be NO hair, NO vertical curved wisps, NO figure remnants, NO silhouette and NO added objects. No new black marks inside these two zones, just a subtly worn red pigment continuation. Preserve all unmasked original pixels and existing background drybrush marks. Same full frame 1800:2044 aspect, no crop, opaque.
