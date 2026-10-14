from pathlib import Path
import hashlib, json, shutil
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageDraw

WORK=Path(__file__).resolve().parent
ROOT=WORK.parents[1]
OUT=ROOT/'Resources/Site/img/layers$5'
URL_DIR=ROOT/'Resources/Site/img/layers/judas'
SHOTS=ROOT/'.local/shots'
for d in [OUT,URL_DIR,SHOTS]: d.mkdir(parents=True,exist_ok=True)
source=ROOT/'Resources/Site/img/projects-judas-img2.webp'
im=Image.open(source).convert('RGB')
w,h=im.size
rgb=np.array(im)
a=np.array(Image.open(WORK/'biref-mask.png')).astype(np.float32)/255
# Remove isolated segmentation dust, retaining connected fine hair.
support=a>0.018
labels,n=ndi.label(support)
sizes=np.bincount(labels.ravel()); sizes[0]=0
main=labels==sizes.argmax()
near=ndi.distance_transform_edt(~main)<3
a[~near]=0
a[a<0.018]=0
a[a>.985]=1
alpha=np.uint8(np.round(a*255))
Image.fromarray(alpha).save(WORK/'judas-matte.png')
cut=im.convert('RGBA'); cut.putalpha(Image.fromarray(alpha))
cut.save(WORK/'judas-original-pixels.png')

gen=Image.open(WORK/'generated-plate.png').convert('RGB').resize(im.size,Image.Resampling.LANCZOS)
g=np.array(gen,dtype=np.float32)
# Replace all subject pixels and a surrounding clearance, blending only outside
# the cutout. Original pixels remain exact outside the removal blend region.
dist=ndi.distance_transform_edt(~(alpha>0))
blend=np.clip((28-dist)/22,0,1)
blend=blend*blend*(3-2*blend)
plate=Image.fromarray(np.uint8(np.round(g*blend[:,:,None]+rgb*(1-blend[:,:,None]))))
plate.save(WORK/'plate-master.png')
Image.fromarray(np.uint8(np.round(blend*255))).save(WORK/'plate-blend-mask.png')
plate.save(OUT/'plate.webp',quality=84,method=6)
cut.save(OUT/'judas.webp',quality=84,method=6,alpha_quality=100,exact=True)
layers=[{'name':'plate','src':'/Resources/Site/img/layers/judas/plate.webp','depth':0},
        {'name':'judas','src':'/Resources/Site/img/layers/judas/judas.webp','depth':.75}]
(OUT/'layers.json').write_text(json.dumps(layers,indent=2)+'\n',encoding='utf-8')
for filename in ['plate.webp','judas.webp','layers.json']:
    shutil.copyfile(OUT/filename,URL_DIR/filename)

saved_plate=Image.open(OUT/'plate.webp').convert('RGBA')
saved_cut=Image.open(OUT/'judas.webp').convert('RGBA')
comp=Image.alpha_composite(saved_plate,saved_cut).convert('RGB')
comp.save(SHOTS/'judas-layers-composite.jpg',quality=95,subsampling=0)
exploded=saved_plate.copy()
exploded.alpha_composite(saved_cut,(0,-round(.75*.04*h)))
exploded.convert('RGB').save(SHOTS/'judas-layers-exploded.jpg',quality=95,subsampling=0)
saved_plate.convert('RGB').save(SHOTS/'judas-layers-plate.jpg',quality=95,subsampling=0)
yy,xx=np.indices((h,w)); checker=np.where(((xx//24+yy//24)%2)==0,85,115).astype(np.uint8)
bg=Image.fromarray(np.repeat(checker[:,:,None],3,axis=2)).convert('RGBA')
panels=[]
for name,layer in [('PLATE | depth 0',saved_plate),('JUDAS | depth 0.75',saved_cut)]:
    panel=Image.new('RGB',(900,547),(25,25,28))
    panel.paste(Image.alpha_composite(bg,layer).convert('RGB').resize((900,507),Image.Resampling.LANCZOS),(0,40))
    ImageDraw.Draw(panel).text((16,13),name,fill=(240,240,240))
    panels.append(panel)
sheet=Image.new('RGB',(1800,547)); sheet.paste(panels[0],(0,0));sheet.paste(panels[1],(900,0))
sheet.save(SHOTS/'judas-layers-sheet.jpg',quality=95,subsampling=0)
# Dedicated inspection on light and dark backgrounds, at original resolution.
for shade in [30,180]:
    bg=Image.new('RGBA',im.size,(shade,shade,shade,255))
    Image.alpha_composite(bg,saved_cut).convert('RGB').save(WORK/f'edge-review-{shade}.jpg',quality=95,subsampling=0)
diff=np.abs(np.array(comp).astype(float)-rgb)
jpgdiff=np.abs(np.array(Image.open(SHOTS/'judas-layers-composite.jpg')).astype(float)-rgb)
mastercomp=Image.alpha_composite(plate.convert('RGBA'),cut).convert('RGB')
masterdiff=np.abs(np.array(mastercomp).astype(float)-rgb)
metrics={'source':str(source.relative_to(ROOT)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'dimensions':[w,h], 'mae_rgb_0_255':float(diff.mean()),'composite_jpeg_mae_rgb_0_255':float(jpgdiff.mean()),
 'pre_encoding_composite_mae_rgb_0_255':float(masterdiff.mean()),
 'plate_unchanged_outside_mask':bool(np.array_equal(np.array(plate)[blend==0],rgb[blend==0])),
 'cutout_original_rgb_before_encoding':bool(np.array_equal(np.array(cut)[:,:,:3],rgb)),
 'exploded_shift_pixels':round(.75*.04*h),
 'files':{f.name:f.stat().st_size for f in OUT.iterdir() if f.is_file()}}
(WORK/'verification.json').write_text(json.dumps(metrics,indent=2)+'\n')
print(json.dumps(metrics,indent=2))
