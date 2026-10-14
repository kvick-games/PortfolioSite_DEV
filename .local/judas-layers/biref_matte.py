import os, sys
from pathlib import Path
os.environ['AI_MODELS_ROOT']='D:/AIModels'
os.environ['HF_HOME']='D:/AIModels/huggingface'
os.environ['HF_HUB_CACHE']='D:/AIModels/huggingface/hub'
os.environ['TORCH_HOME']='D:/AIModels/torch'
sys.path.insert(0,'D:/Dreamatron/_vendor/TripoSplat')
from model import BiRefNet
from PIL import Image
import torch
p=Path(__file__).resolve().parent
m=BiRefNet()
m.load_safetensors('D:/AIModels/external/triposplat/background_removal/birefnet.safetensors')
m=m.eval().to('cuda',torch.float32)
im=Image.open(p.parents[1]/'Resources/Site/img/projects-judas-img2.webp').convert('RGB')
out=m.remove_background(im)
out.getchannel('A').save(p/'biref-mask.png')
out.save(p/'biref-cut.png')
bg=Image.new('RGBA',im.size,(100,100,100,255)); bg.alpha_composite(out); bg.convert('RGB').save(p/'biref-review.jpg',quality=95)
print('Saved original-pixel BiRefNet cutout.')
