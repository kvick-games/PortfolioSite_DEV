# God of War parallax assets

Five aligned 3840x2160 PNG masters are in `masters/`; web outputs are 2000x1125 quality-84 WebP in `Resources/Site/img/layers/gow/`. `layers.json` is ordered back to front. The original input is unchanged. `source.png` is its byte-identical preservation copy.

## Important depth constraint

The source logo occludes both the troll and Atreus. There are no original figure pixels beneath those glyphs. No generated RGB has been used in any figure or logo layer. Consequently **troll, Atreus and logo share depth 0.6**; Kratos is 0.55 and the plate is 0. The supplied exploded preview uses these values times -60 pixels. Changing the three linked layers to independent depths exposes glyph-shaped transparency. Independent motion requires approval to reconstruct hidden figure patches. This is a constrained original-pixel result, not a fully independent five-depth reconstruction.

## Methods

- Plate: built-in GPT image editing, original source plus white-edit/black-preserve mask reference. The built-in tool has no native mask parameter: `plate-guide-mask.png` was supplied as a second image. The result is resized to source resolution, locally color-matched and composited through the saved `plate-applied-mask.png`. All pixels outside this applied mask are byte-identical to the input. Original right-hand rocks, carved stone and flying debris remain in the plate; no separate foreground layer.
- Troll: cached local facebook/SAM3 segmentation of the original, separate skull and strap masks, manually traced foggy rear foot, and soft mist edge. A second GPT edit removing only the logo was used solely to recover missing silhouette masks near the logo. All visible RGB is copied from the original.
- Kratos: original SAM3 person mask unioned with original axe mask, with a narrow antialiased edge. Original RGB only.
- Atreus: original SAM3 boy, bow, quiver, arrows and strap masks; narrow manually traced bowstring/arrow details. Original RGB only. Ground is retained in the plate.
- Logo: original SAM3 text mask refined by source color/edge constraints; corrected OF counters and separately thresholded TM. Original letter and omega textures are retained.

SAM3 was reused from `D:/AIModels/huggingface/hub/models--facebook--sam3/snapshots/3c879f39826c281e95690f02c7821c4de09afae7`. No model weights were downloaded. Masks are preserved here, so rebuilding does not require SAM3 or image generation.

## Verification and honest assessment

- Decoded WebP stack versus Lanczos-downscaled input: RGB mean absolute difference **4.530408/255 (1.7766%)**.
- Saved JPEG composite versus the same reference: **4.719648/255** (includes JPEG compression).
- Total WebP bytes: **646,936**.
- Full-resolution plate pixels retained exactly: **60.4016%**; removal, shadow and feather support occupies the rest. The removal support includes some surrounding background for seam blending, so this is not a claim that every originally visible forest pixel was retained.
- All masters and WebP dimensions, stripped EXIF/ICC/XMP, cutout RGB equality on nonzero-alpha master pixels, unchanged input SHA-256, and exact plate pixels outside the applied mask were checked.
- Visually reviewed composite, shifted preview, plate and checkerboard sheet. No recognizable figure or logo ghosts remain in the plate. Generated forest structure and lighting in the removal support differ from the source; the aligned composite is close, not pixel-identical.
- Main silhouettes are usable for subtle motion at the supplied linked depths. Fine hair, blurred bowstring, ragged fabric and the foggy rear foot are approximate; some edge background contamination remains. These are not production roto mattes for large independent displacement. The contact sheet intentionally shows logo-shaped gaps in the original-only troll and Atreus layers.
- `review/` preserves the same verification JPEGs delivered to `.local/shots/`.

## Rebuild

From repository root, with Python containing Pillow, NumPy, SciPy and OpenCV:

```powershell
& C:/Users/mikek/miniconda3/envs/comfyui/python.exe Resources/Projects/GoW/parallax/build.py
& C:/Users/mikek/miniconda3/envs/comfyui/python.exe Resources/Projects/GoW/parallax/verify.py
```

The build preserves metadata-free masters, masks, WebPs, manifest and verification images. `verification.json` records dimensions/pixel checks, sizes and errors. Do not change linked depths without repairing occlusions.

## Preservation

These assets, reconstruction inputs and reviews are preserved in local Git commits. DT_Backup's source list did not show this portfolio as a selected project. The latest inspected suite run (2026-10-12) failed; app profile failed and project profile succeeded. No new backup or remote push is claimed; no backup selections or warning files were changed.
