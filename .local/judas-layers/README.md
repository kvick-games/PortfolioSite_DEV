# Judas parallax layers

Source: `Resources/Site/img/projects-judas-img2.webp`, 1800 x 1013.
The requested literal `Resources/Site/img$1.webp` did not exist. The located source matches the supplied description and dimensions. Its SHA-256 is recorded in verification.json.

Delivery: `Resources/Site/img/layers$5/{plate.webp,judas.webp,layers.json}`.
Identical copies are supplied in `Resources/Site/img/layers/judas/` so the requested manifest URLs resolve without application changes. Each set is 178,666 bytes. Both sets together are 357,332 bytes.

## Methods

- Plate, depth 0: built-in GPT image editing, using an explicit magenta removal-mask guide and the source as a style reference. The built-in tool has no separate native mask parameter, so the mask was provided visually, then enforced by deterministic compositing. Generated pixels are used only within the final removal/blend mask. A six-pixel fully replaced clearance and a 22-pixel smooth transition outside the subject remove edge remnants. All pixels outside that mask are exactly original before lossy WebP encoding. Generated output is resized to the original 1800 x 1013 grid before compositing.
- Judas, depth 0.75: existing local BiRefNet weights in `D:/AIModels/external/triposplat/background_removal/birefnet.safetensors`, run through the installed TripoSplat model implementation using the existing ComfyUI Python environment. Alpha cleanup removes isolated dust, clips near-zero/near-opaque confidence, and retains connected hair wisps. RGB comes exclusively from the original source; GPT cutout RGB is not used. Lossy quality-84 WebP changes RGB slightly, while alpha is encoded losslessly.
- The initial U2NetP matte was rejected for background contamination. A GPT cutout was also reviewed and rejected as a production matte because local segmentation follows the source more faithfully. No model downloads or package installations were required.
- Debris and glass remain in the plate: their soft glow and mixed scene pixels make separate motion less convincing than a restrained two-layer effect.

Both WebPs are full-frame, single-frame, stripped of EXIF/XMP/ICC metadata, and encoded at quality 84, method 6. Judas has alpha; plate is opaque.

## Verification and limitations

All four requested JPEG previews were visually inspected, plus the matte over light and dark backgrounds. The plate shows no visible face, body, or hair ghost; the shifted layer exposes filled scene rather than original subject remnants. The mask has no detached background chunks. Some original blue/orange contamination remains in soft hair-edge pixels, especially the thin left wisps, because original RGB was preserved. This looks acceptable against this scene but is not a neutral-background studio matte.

The decoded layer composite RGB MAE is 1.368409 out of 255, averaged over all RGB channels/pixels. The saved composite JPEG MAE is 1.577343; before WebP encoding it is 0.416335. The zero-offset composite is close, not pixel-identical: the small differences include compression, soft alpha and generated background seen around/through hair.

The exploded preview shifts Judas upward by round(0.75 * 0.04 * 1013) = 30 pixels. Because the original body is cropped at the bottom, this deliberately uncropped stress preview exposes a straight lower edge. Hide this source boundary in the website with an overflow-clipped viewport and approximately 107% centered scaling of the layer stack, or restrict motion to keep the source bottom outside the viewport. The original crown is also near the top and may clip during upward travel. No outpainting of Judas was done, respecting the original-pixels requirement.

The filled background is plausible invented scenery, not recovered trailer content. No source input or src/ file was edited by this task.

## Final generation prompt (built-in image_gen)

Use case: precise-object-edit. Produce a clean far-background plate of this exact 1800x1013-aspect game cinematic. Image 1 is the edit target with an explicit MAGENTA REMOVAL MASK. Inpaint the entire solid magenta region with plausible scene continuation. Image 2 shows the original scene for style/reference ONLY: REMOVE the woman completely, including all hair, body, straps and every trace of her silhouette. Reconstruct deep navy/blue outer space above, sparse dark small asteroids in blue light at left, smoky dark wreckage below, transitioning naturally into orange firelight on right. Do not add a person, face, human-shaped smoke or bright central subject. Match soft cinematic depth, existing lighting and texture. Keep ALL non-magenta pixels, including the left glowing asteroid, right fireball, peripheral broken glass and framing, unchanged and in the exact same positions. No reframing/crop/zoom. The filled region must not follow or reveal the silhouette of the removed person. Output one full-frame background plate with no magenta or transparency.

## Rebuild

Run `python .local/judas-layers/build_layers.py` with Pillow, NumPy and SciPy. The selected generated plate and BiRefNet matte are preserved next to the script, so the delivery rebuild needs no model/API call. `biref_matte.py` documents regeneration of the initial matte using already installed machine-specific dependencies. `make_mask.py` and `prepare_plate.py` document preparation of the original inpainting guide.

Previews: `.local/shots/judas-layers-{composite,exploded,plate,sheet}.jpg`.
