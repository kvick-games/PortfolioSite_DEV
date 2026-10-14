from pathlib import Path
import json,hashlib
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont
from scipy.ndimage import binary_fill_holes, gaussian_filter
ROOT=Path(__file__).resolve().parents[4]
P=Path(__file__).resolve().parent; O=ROOT/'Resources/Site/img/layers/gow'; S=ROOT/'.local/shots'; M=P/'masters'
for folder in [O,S,M]: folder.mkdir(exist_ok=True,parents=True)
src=Image.open(P/'source.png').convert('RGB');rgb=np.array(src);H,W=rgb.shape[:2]
def read(n):return np.array(Image.open(P/(n+'.png')))>0
def union(*names):return np.logical_or.reduce([read(n) for n in names])
def drawlines(m,lines):
 a=Image.fromarray(m.astype('uint8')*255);d=ImageDraw.Draw(a)
 for pts,width in lines:d.line(pts,fill=255,width=width)
 return np.array(a)>0
masks={}
masks['troll']=union('troll-sam-1','skulls-sam-0','skulls-sam-3','skulls-sam-4','strap-sam-13','stone-sam-8')
masks['kratos']=union('kratos-sam-0','axe-sam-0')
masks['atreus']=union('atreus-sam-0','bow-sam-0','quiver-sam-1','quiver_crop-sam-2','strap-sam-12')
# Bowstring and arrow retain only the narrow original source pixels.
masks['atreus']=drawlines(masks['atreus'],[([(1135,275),(1268,807)],4), ([(1265,914),(1593,642)],5)])
logo=read('logo-sam-0'); grey=rgb.mean(2);red=(rgb[:,:,0].astype(float)>rgb[:,:,1]*1.6)&(rgb[:,:,0]>65)
dist=cv2.distanceTransform(logo.astype('uint8'),cv2.DIST_L2,5)
logo &= (dist>5)|(grey>65)|red
# Remove mistakenly included dark background around OF; preserve the real stone lettering.
x1,y1,x2,y2=1825,1075,2010,1190
r=rgb[y1:y2,x1:x2].astype(float); a=(r.mean(2)>84)&(r.max(2)-r.min(2)<90)
a=cv2.morphologyEx(a.astype('uint8'),cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))>0
logo[y1:y2,x1:x2] &= a
# TM is too small for whole-frame semantic segmentation.
x1,y1,x2,y2=2760,1196,2800,1228
logo[y1:y2,x1:x2]=rgb[y1:y2,x1:x2].min(2)>130
masks['logo']=logo
# Generated clean pass supplies only missing silhouette masks near the logo.
# Its RGB is never used for figures without explicit permission.
roi=np.zeros((H,W),bool);roi[965:1480,1020:2870]=True
for name,clean in [('troll','troll_clean-sam-0'),('atreus','atreus_clean-sam-0')]:
 masks[name] |= read(clean)&roi
 # Remove original printed glyphs, retaining original RGB in every visible pixel.
 masks[name] &= ~logo
# The rear leg is mostly mist and was omitted by whole-frame SAM.
rear=np.zeros((H,W),bool);rear[900:1490,2590:2890]=True
masks['troll'] |= read('troll_clean-sam-0')&rear&~logo
# Trace the low-contrast rear foot hidden in fog; semantic model missed this edge.
rearfoot=Image.new('L',(W,H));rd=ImageDraw.Draw(rearfoot)
rd.polygon([(2660,845),(2738,858),(2770,872),(2811,878),(2851,911),(2861,987),(2896,1030),(2932,1106),(2920,1160),(2877,1207),(2862,1256),(2870,1290),(2825,1340),(2770,1380),(2690,1360),(2650,1310),(2602,1190),(2530,1105),(2480,1005)],fill=255)
rf=np.array(rearfoot)>0
masks['troll'] |= rf&~logo&~masks['kratos']
# All alphas remain full-frame and all cutout RGB samples remain source RGB.
alphas={}
for name,m in masks.items():
 d1=cv2.distanceTransform(m.astype('uint8'),cv2.DIST_L2,5);d0=cv2.distanceTransform((~m).astype('uint8'),cv2.DIST_L2,5)
 a=np.clip(.5+(d1-d0)/2.4,0,1)
 if name=='troll':
  a=gaussian_filter(a,.7)
  soft=gaussian_filter(a,5)
  yy,xx=np.indices(a.shape); region=(xx>2650)&(yy>940)
  a[region]=soft[region]
 alphas[name]=a
 Image.fromarray(np.round(a*255).astype('uint8')).save(P/(name+'-alpha.png'))
# Fill the deleted subjects and counters of the logo on the plate; preserve all other pixels.
remove=np.logical_or.reduce([binary_fill_holes(m) for m in masks.values()])
remove |= read('troll_clean-sam-0')|read('atreus_clean-sam-0')|rf
# Include hanging wrist straps and bowstring remnants in the background removal.
extra=Image.new('L',(W,H));ed=ImageDraw.Draw(extra)
ed.polygon([(1320,563),(1380,570),(1425,844),(1400,900),(1330,1000),(1230,960),(1200,845)],fill=255)
ed.polygon([(1410,542),(1600,570),(1580,685),(1470,735),(1395,655)],fill=255)
ed.ellipse((1065,225,1200,430),fill=255)
remove |= np.array(extra)>0
# Logo shadow and detached ragged hem need a continuous removal zone.
shadow=Image.new('L',(W,H));d=ImageDraw.Draw(shadow)
d.polygon([(int(x*1.875),int(y*1.875)) for x,y in [(550,546),(920,510),(1090,505),(1460,545),(1500,670),(1390,712),(1110,704),(908,710),(550,696)]],fill=255)
remove |= np.array(shadow)>0
remove=cv2.dilate(remove.astype('uint8'),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(37,37)))
blend=gaussian_filter(remove.astype(float),12)
blend[remove>0]=1;blend[blend<.001]=0;blend=np.round(blend*255)/255
# Blend support is explicit and saved. A broad guide was supplied to GPT; only this local mask is applied.
gen=np.array(Image.open(P/'plate-generated.png').convert('RGB').resize(src.size,Image.Resampling.LANCZOS))
# Match nearby low-frequency illumination across the edge of the inpaint support.
valid=1-cv2.dilate(remove.astype('uint8'),np.ones((25,25),np.uint8)).astype(float)
small=(960,540);v=cv2.resize(valid,small);delta=cv2.resize(rgb.astype(float)-gen.astype(float),small)
den=gaussian_filter(v,10);correction=np.stack([gaussian_filter(delta[:,:,c]*v,10)/np.maximum(den,.001) for c in range(3)],axis=2)
correction=cv2.resize(correction,(W,H));gen=np.clip(gen.astype(float)+correction,0,255)
plate=np.round(rgb*(1-blend[:,:,None])+gen*blend[:,:,None]).astype('uint8')
Image.fromarray(np.round(blend*255).astype('uint8')).save(P/'plate-applied-mask.png')
Image.fromarray(plate).save(M/'plate.png')
Image.fromarray(plate).resize((2000,1125),Image.Resampling.LANCZOS).save(O/'plate.webp',quality=84,method=6)
for name,a in alphas.items():
 cutrgb=rgb.copy();cutrgb[a==0]=0
 rgba=Image.fromarray(np.dstack((cutrgb,np.round(a*255).astype('uint8'))));rgba.save(M/(name+'.png'))
 rgba.resize((2000,1125),Image.Resampling.LANCZOS).save(O/(name+'.webp'),quality=84,method=6,exact=True)
names=['plate','troll','kratos','atreus','logo'];depths=[0,.6,.55,.6,.6]
manifest=[{'name':n,'src':'/Resources/Site/img/layers/gow/'+n+'.webp','depth':d} for n,d in zip(names,depths)]
(O/'layers.json').write_text(json.dumps(manifest,indent=2)+'\n')
layers=[Image.open(O/(n+'.webp')).convert('RGBA') for n in names]; comp=layers[0].copy();exp=layers[0].copy()
for im,d in zip(layers[1:],depths[1:]):comp.alpha_composite(im);exp.alpha_composite(im,(0,-round(d*60)))
comp.convert('RGB').save(S/'gow-layers-composite.jpg',quality=95,subsampling=0)
exp.convert('RGB').save(S/'gow-layers-exploded.jpg',quality=95,subsampling=0)
layers[0].convert('RGB').save(S/'gow-layers-plate.jpg',quality=95,subsampling=0)
out=Image.new('RGB',(1600,1410),(24,28,31));draw=ImageDraw.Draw(out)
y,x=np.indices((450,800));ch=np.where(((x//20+y//20)%2)[:,:,None],110,155).astype('uint8');ch=np.repeat(ch,3,2)
for i,(name,im) in enumerate(zip(names,layers)):
 bg=Image.fromarray(ch).convert('RGBA');bg.alpha_composite(im.resize((800,450),Image.Resampling.LANCZOS));xx=i%2*800;yy=i//2*470;out.paste(bg,(xx,yy+20));draw.text((xx+10,yy+4),name,fill='white')
out.save(S/'gow-layers-sheet.jpg',quality=95,subsampling=0)
ref=np.array(src.resize((2000,1125),Image.Resampling.LANCZOS)).astype(float); diff=np.abs(np.array(comp.convert('RGB')).astype(float)-ref)
report={'source_sha256':hashlib.sha256((P/'source.png').read_bytes()).hexdigest(),'composite_mae_0_255':float(diff.mean()),'composite_mae_percent':float(diff.mean()/255*100),'web_bytes':{n:(O/(n+'.webp')).stat().st_size for n in names},'plate_unchanged_percent':float((blend==0).mean()*100),'figure_rgb_original':True,'hidden_logo_repairs':False}
(P/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
