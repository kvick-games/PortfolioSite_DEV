from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
p=Path(__file__).resolve().parent
im=Image.open(p.parents[1]/'Resources/Site/img/projects-judas-img2.webp').convert('RGB')
m=np.array(Image.open(p/'local-mask.png'))>160
m[:,:590]=False
m=ndi.binary_fill_holes(m)
d=ndi.distance_transform_edt(~m)
mask=Image.fromarray(np.uint8(d<45)*255)
mask.save(p/'removal-mask.png')
guide=im.copy(); guide.paste((255,0,255),(0,0),mask); guide.save(p/'removal-guide.png')
