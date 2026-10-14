from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import onnxruntime as ort

root = Path(__file__).resolve().parents[2]
work = Path(__file__).resolve().parent
im = Image.open(root/'Resources/Site/img/projects-judas-img2.webp').convert('RGB')
a = np.array(im.resize((320,320), Image.Resampling.LANCZOS), dtype=np.float32)/255
a = (a-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)
s=ort.InferenceSession('D:/AIModels/models/rembg/u2netp.onnx',providers=['CPUExecutionProvider'])
p=s.run(None, {s.get_inputs()[0].name:a.transpose(2,0,1)[None]})[0][0,0]
p=(p-p.min())/(p.max()-p.min())
mask=Image.fromarray(np.uint8(p*255)).resize(im.size,Image.Resampling.LANCZOS)
mask.save(work/'local-mask.png')
cut=im.convert('RGBA'); cut.putalpha(mask); cut.save(work/'local-cut.png')
support=Image.fromarray(np.uint8(np.array(mask)>8)*255).filter(ImageFilter.MaxFilter(65))
support.save(work/'removal-mask.png')
guide=im.copy(); guide.paste((255,0,255),(0,0),support); guide.save(work/'removal-guide.png')
