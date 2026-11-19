"""Rebuild the six photographic GLB models. Optional build tools: Pillow and NumPy.

Run `python scripts/modelar-vasos.py` from any directory. No modelling library or
runtime dependency is required by the website. Each source is the complete,
alpha-trimmed large WebP in assets/productos, including its transparent border.
"""
from pathlib import Path
import json
import math
import struct

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / 'assets' / 'productos'
MODELS = ROOT / 'assets' / 'modelos'

# Pixel-space traces are expressed in fractions of the complete source. A trace
# describes a utensil's centre and half-width at a given vertical position. The
# generated surface follows the observed alpha within that envelope.
def stick(name, points, end, depth, roundness, lean=0.025):
    return dict(name=name, points=points, end=end, depth=depth, roundness=roundness, lean=lean)


DEFAULT_RIM_X = [0, .055, .11, .20, .30, .40, .50, .60, .70, .80, .90, .95, 1]
TRACES = {
    'cholado': (
        [.45,.374,.346,.323,.299,.282,.271,.277,.293,.318,.351,.399,.45],
        [stick('Barquillo izquierdo',[(.115,.058,.072),(.32,.182,.069)],.39,-.025,.90),
         stick('Barquillo derecho',[(.13,.943,.071),(.33,.797,.070)],.389,.016,.90),
         stick('Cuchara blanca',[(.012,.435,.040),(.22,.468,.042),(.245,.478,.057),(.277,.487,.104),(.30,.495,.124)],.34,-.175,.34,.045)]),
    'maracumango': (
        [.47,.383,.359,.339,.319,.303,.297,.297,.314,.327,.359,.383,.46],
        [stick('Barquillo izquierdo',[(.211,.084,.085),(.345,.231,.088)],.405,.014,.90),
         stick('Barquillo derecho',[(.255,.887,.083),(.367,.79,.083)],.422,.046,.90),
         stick('Cuchara blanca',[(.018,.174,.057),(.34,.398,.055)],.371,-.145,.47,.045),
         stick('Pitillo verde',[(.012,.736,.044),(.347,.699,.042)],.391,-.174,1.0,.025)]),
    'granizado': (
        [.455,.382,.354,.334,.297,.277,.268,.271,.289,.317,.351,.386,.454],
        [stick('Barquillo izquierdo',[(.146,.055,.086),(.348,.202,.083)],.413,-.009,.93),
         stick('Barquillo derecho',[(.164,.945,.085),(.345,.815,.087)],.41,.027,.93),
         stick('Pitillo blanco',[(.083,.354,.038),(.32,.413,.038)],.374,-.143,.96,.037),
         stick('Pitillo verde',[(.014,.598,.035),(.333,.626,.038)],.38,-.173,.98,.035)]),
    'raspado': (
        [.45,.386,.357,.340,.306,.29,.284,.284,.299,.319,.357,.392,.45],
        [stick('Barquillo izquierdo',[(.157,.067,.088),(.36,.172,.082)],.417,.012,.94),
         stick('Barquillo derecho',[(.157,.943,.086),(.349,.813,.079)],.397,-.021,.94),
         stick('Cuchara blanca',[(.09,.484,.035),(.319,.452,.034)],.366,-.108,.49,.036),
         stick('Pitillo translúcido',[(.012,.56,.032),(.324,.534,.035)],.371,-.178,.98,.018)]),
    'limonada-maracuya': (
        [.288,.241,.219,.203,.192,.187,.186,.188,.195,.205,.222,.242,.285],
        [stick('Pitillo translúcido',[(.014,.808,.042),(.25,.684,.040)],.326,-.077,.98,.055)]),
    'limonada-especial': (
        [.292,.246,.226,.207,.194,.186,.185,.188,.192,.202,.220,.241,.285],
        [stick('Pitillo verde',[(.013,.599,.039),(.25,.576,.040)],.315,-.090,.97,.024)]),
}


def intervals(mask):
    """Subpixel outer extent of every occupied row, with gaps left separate in UV."""
    ys = np.where(mask.any(axis=1))[0]
    if not len(ys):
        raise ValueError('Empty part')
    rows = mask[ys]
    left = np.argmax(rows,axis=1).astype(float)
    right = rows.shape[1] - np.argmax(rows[:,::-1],axis=1).astype(float)
    return ys.astype(float) + .5, left, right


def trace_mask(alpha, rim, specs):
    h,w = alpha.shape
    x = (np.arange(w,dtype=float)+.5)[None,:] / w
    y = (np.arange(h,dtype=float)+.5)[:,None] / h
    cap = np.interp(x,DEFAULT_RIM_X,rim)
    body = alpha.copy()
    parts=[];obscured=np.zeros_like(alpha)
    for spec in specs:
        anchors = np.array(spec['points'],float)
        center = np.interp(y,anchors[:,0],anchors[:,1])
        radius = np.interp(y,anchors[:,0],anchors[:,2])
        # Continue the lean for the short length submerged inside the shaved ice.
        slope=(anchors[-1,1]-anchors[-2,1])/(anchors[-1,0]-anchors[-2,0])
        center += np.maximum(0,y-anchors[-1,0])*slope
        gate = (np.abs(x-center)<=radius) & (y >= anchors[0,0]-.035) & (y < spec['end'])
        layer = alpha & gate
        body &= ~(gate & (y < cap))
        obscured |= gate & (y < np.minimum(spec['end'],cap+.07))
        parts.append((spec,layer))
    return body,parts,body & ~obscured


def profile_samples(y,left,right,tolerance,max_gap):
    """Retain both contour bends and enough axial stations for smooth highlights."""
    if len(y)<3:return np.arange(len(y))
    keep={0,len(y)-1};todo=[(0,len(y)-1)]
    while todo:
        a,b=todo.pop()
        if b<=a+1:continue
        t=(y[a+1:b]-y[a])/(y[b]-y[a])
        error=np.maximum(np.abs(left[a+1:b]-(left[a]+t*(left[b]-left[a]))),
                         np.abs(right[a+1:b]-(right[a]+t*(right[b]-right[a]))))
        peak=int(np.argmax(error));deviation=error[peak]
        if deviation>tolerance:
            m=a+1+peak
        elif y[b]-y[a]>max_gap:
            m=(a+b)//2
        else:
            continue
        keep.add(m);todo.extend(((a,m),(m,b)))
    return sorted(keep)


def lathe_image(mask,shape,spec=None,unobstructed=None):
    h,w=shape
    y,left,right=intervals(mask)
    # Suppress isolated alpha dust, keeping the actual utensil tips and the tiny
    # rounded foot. Wider transparent gaps remain transparent in the material.
    useful=(right-left)>1
    y,left,right=y[useful],left[useful],right[useful]
    rings=profile_samples(y,left,right,1.6 if spec is None else 1.05,31 if spec is None else 38)
    y,left,right=y[rings],left[rings],right[rings]
    divisions=40 if spec is None else 20
    phi=np.arange(divisions)*2*math.pi/divisions
    sn,cs=np.sin(phi),np.cos(phi)
    points=[];faces=[];wrap=[]
    highest=y[0]/h
    for row,lo,hi in zip(y,left,right):
        v=row/h; mid=(lo+hi)*.5; half=(hi-lo)*.5
        rx=half*2/h
        if spec is None:
            # A circular tapered cup in the straight section. Its uppermost ice
            # sits behind the front lip in this slightly elevated camera view.
            z0=(.53-v)*.115-.16*math.exp(-((v-highest)/.076)**2)
            rz=rx*.985
        else:
            z0=spec['depth']-spec['lean']*(spec['end']-v)*2
            rz=rx*spec['roundness']
        u=(mid+half*sn)/w
        points.extend(zip((u-.5)*2*w/h,np.full(divisions,1-2*v),z0+rz*cs))
        # A second UV set supplies colour at glancing angles: the transparent
        # edge of a cutout has no samples of the previously unseen side. Pull its
        # lateral seam onto the same material a short way inside the photograph.
        # Fold the source material onto the rest of the circumference at nearly
        # native texel density, using an arc-length parameter, not the tangent's
        # flattened horizontal projection. Both sides of a fold meet at a single
        # sample inside the material, never at the transparent image border.
        safe_s=(2/math.pi)*np.arcsin(np.clip(np.sin(2*phi),-1,1))*(.83 if spec is None else .75)
        sample_y=np.clip(row,y[0]+min(6,(y[-1]-y[0])*.06),y[-1]-min(5,(y[-1]-y[0])*.05))
        plate=unobstructed if unobstructed is not None else mask
        avail=np.flatnonzero(plate[int(sample_y)])
        if not len(avail) and unobstructed is not None:
            new_row=int(sample_y)
            while new_row<min(h-1,sample_y+45) and not len(avail):
                new_row+=1;avail=np.flatnonzero(plate[new_row])
            if len(avail):sample_y=new_row+.5
        sample_x=mid+half*safe_s
        if len(avail):
            hits=np.searchsorted(avail,sample_x);low=avail[np.maximum(0,hits-1)];high=avail[np.minimum(len(avail)-1,hits)]
            sample_x=np.where(np.abs(high-sample_x)<np.abs(low-sample_x),high,low)+.5
        wrap.extend(zip(sample_x/w,np.full(divisions,sample_y/h)))
    for i in range(len(y)-1):
        for j in range(divisions):
            jn=(j+1)%divisions
            a,b=i*divisions+j,i*divisions+jn
            c,d=(i+1)*divisions+j,(i+1)*divisions+jn
            faces.extend(((a,c,b),(b,c,d)))
    for top in (True,False):
        i=0 if top else len(y)-1; row=i*divisions
        center=np.mean(points[row:row+divisions],axis=0)
        center[1]+=(1 if top else -1)*.8/h
        pole=len(points);points.append(center)
        wrap.append(np.mean(wrap[row:row+divisions],axis=0))
        for j in range(divisions):
            a=row+j;b=row+(j+1)%divisions
            faces.append((pole,a,b) if top else (pole,b,a))
    xyz=np.asarray(points,dtype=np.float64);index=np.asarray(faces,dtype=np.uint16)
    tri=xyz[index]
    normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
    # Orient every closed part consistently, independent of the tracing direction.
    volume=np.einsum('ij,ij->i',tri[:,0],normal).sum()/6
    if volume<0:
        index=index[:,[0,2,1]].copy();normal=-normal;volume=-volume
    if volume<=1e-9 or np.any(np.linalg.norm(normal,axis=1)<1e-11):raise ValueError('Collapsed triangle or shell')
    normals=np.zeros_like(xyz)
    for i in range(3):np.add.at(normals,index[:,i],normal)
    norms=np.linalg.norm(normals,axis=1,keepdims=True)
    if np.any(norms<1e-12):raise ValueError('Undefined vertex normal')
    uv=np.column_stack((xyz[:,0]*h/(2*w)+.5,(1-xyz[:,1])*.5))
    return xyz.astype('<f4'),(normals/norms).astype('<f4'),uv.astype('<f4'),np.asarray(wrap,dtype='<f4'),index.astype('<u2')


class Model:
    def __init__(self,slug):
        self.bin=bytearray();self.slug=slug
        self.doc={'asset':{'version':'2.0','generator':'Faber & Paty · modelado de producto'},
                  'extensionsUsed':['EXT_texture_webp'],'extensionsRequired':['EXT_texture_webp'],
                  'scene':0,'scenes':[{'name':slug,'nodes':[]}],'nodes':[],'meshes':[],
                  'bufferViews':[],'accessors':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}],
                  'images':[{'uri':'../productos/'+slug+'.webp','mimeType':'image/webp'}],
                  'textures':[{'sampler':0,'extensions':{'EXT_texture_webp':{'source':0}}}],
                  'materials':[{'name':'Foto del producto','pbrMetallicRoughness':{'baseColorTexture':{'index':0,'texCoord':0},'metallicFactor':0,'roughnessFactor':.88},'alphaMode':'MASK','alphaCutoff':.12}]}

    def accessor(self,array,kind,component,target,limits=False):
        self.bin.extend(b'\x00'*(-len(self.bin)%4));data=np.ascontiguousarray(array).tobytes()
        i=len(self.doc['bufferViews']);self.doc['bufferViews'].append({'buffer':0,'byteOffset':len(self.bin),'byteLength':len(data),'target':target});self.bin.extend(data)
        record={'bufferView':i,'componentType':component,'count':len(array),'type':kind}
        if limits:record.update(min=array.min(axis=0).tolist(),max=array.max(axis=0).tolist())
        self.doc['accessors'].append(record);return len(self.doc['accessors'])-1

    def add(self,name,data):
        xyz,normal,uv,wrap,idx=data
        attrs={'POSITION':self.accessor(xyz,'VEC3',5126,34962,True),'NORMAL':self.accessor(normal,'VEC3',5126,34962),'TEXCOORD_0':self.accessor(uv,'VEC2',5126,34962),'TEXCOORD_1':self.accessor(wrap,'VEC2',5126,34962)}
        primitive={'attributes':attrs,'indices':self.accessor(idx.reshape(-1),'SCALAR',5123,34963),'material':0,'mode':4}
        mesh=len(self.doc['meshes']);self.doc['meshes'].append({'name':name,'primitives':[primitive]})
        node=len(self.doc['nodes']);self.doc['nodes'].append({'name':name,'mesh':mesh});self.doc['scenes'][0]['nodes'].append(node)

    def save(self):
        self.doc['buffers']=[{'byteLength':len(self.bin)}];self.bin.extend(b'\0'*(-len(self.bin)%4))
        js=json.dumps(self.doc,separators=(',',':'),ensure_ascii=False).encode('utf8');js+=b' '*(-len(js)%4)
        length=28+len(js)+len(self.bin)
        f=MODELS/(self.slug+'.glb')
        f.write_bytes(struct.pack('<4sII',b'glTF',2,length)+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(self.bin),b'BIN\0')+self.bin)
        return length-1


def main():
    MODELS.mkdir(exist_ok=True,parents=True);ranges={}
    for slug,(rim,sticks) in TRACES.items():
        with Image.open(PRODUCTS/(slug+'.webp')) as photo:alpha=np.asarray(photo.convert('RGBA'))[:,:,3] > 32
        body,parts,uncovered=trace_mask(alpha,rim,sticks);scene=Model(slug)
        scene.add('Vaso y contenido',lathe_image(body,alpha.shape,unobstructed=uncovered))
        for spec,layer in parts:scene.add(spec['name'],lathe_image(layer,alpha.shape,spec))
        ranges[slug]=scene.save()
        print(slug,len(parts)+1,'piezas',ranges[slug]+1,'bytes')
    (MODELS/'indices.json').write_text(json.dumps(ranges,indent=2)+'\n',encoding='utf8')


if __name__=='__main__':main()
