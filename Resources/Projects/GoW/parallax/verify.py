from pathlib import Path
import numpy as np,json,hashlib
from PIL import Image
P=Path('Resources/Projects/GoW/parallax'); O=Path('Resources/Site/img/layers/gow');S=Path('.local/shots')
names=['plate','troll','kratos','atreus','logo'];src=np.array(Image.open(P/'source.png').convert('RGB')); report=json.loads((P/'verification.json').read_text())
for n in names:
 im=Image.open(P/'masters'/f'{n}.png');assert im.size==(3840,2160)
 web=Image.open(O/f'{n}.webp');assert web.size==(2000,1125)
 assert not any(k in web.info for k in ['exif','icc_profile','xmp'])
 if n!='plate':
  a=np.array(im);assert a.shape[2]==4;assert np.array_equal(a[:,:,:3][a[:,:,3]>0],src[a[:,:,3]>0]);assert a[:,:,3].min()==0
mask=np.array(Image.open(P/'plate-applied-mask.png'));plate=np.array(Image.open(P/'masters/plate.png'))
assert np.array_equal(plate[mask==0],src[mask==0])
assert hashlib.sha256(Path('.local/tmp/gow-banner-clean-full.png').read_bytes()).hexdigest()==report['source_sha256']
ref=np.array(Image.fromarray(src).resize((2000,1125),Image.Resampling.LANCZOS)).astype(float)
jpg=np.array(Image.open(S/'gow-layers-composite.jpg')).astype(float)
report.update({'jpeg_composite_mae_0_255':float(np.abs(ref-jpg).mean()),'web_total_bytes':sum(report['web_bytes'].values()),'master_bytes':{n:(P/'masters'/f'{n}.png').stat().st_size for n in names},'verification_images_bytes':{n:(S/f'gow-layers-{n}.jpg').stat().st_size for n in ['composite','exploded','plate','sheet']},'depths':{x['name']:x['depth'] for x in json.loads((O/'layers.json').read_text())},'checks':{'master_dimensions':True,'web_dimensions':True,'metadata_stripped':True,'visible_cutout_rgb_equals_source':True,'plate_outside_mask_equals_source':True,'input_unchanged':True},'limitation':'Troll, Atreus and logo must share depth. Logo-occluded pixels are unavailable in the source; no generated figure RGB was applied. Independent depths expose glyph-shaped holes. Thin hair, bowstring and mist edges are approximate.'})
(P/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
