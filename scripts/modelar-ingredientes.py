"""Rebuild the ingredient GLBs from assets/ingredientes/*.webp.

Offline authoring dependencies: numpy, Pillow, opencv-python-headless, scipy,
triangle. Run with Python 3.10+; the website only needs the resulting files.
"""

import json
from pathlib import Path
import struct

import cv2
import numpy as np
from PIL import Image
from scipy.interpolate import LinearNDInterpolator
import triangle


ASSETS = Path(__file__).resolve().parents[1] / "assets"
TEXTURES = ASSETS / "ingredientes"
MODELS = ASSETS / "modelos" / "ingredientes"
SLUGS = ("pina", "mango", "maracuya", "lima", "hielo", "miel", "barquillo", "cobertura")
PADDING = 3

# Landmarks are proportions of the complete source photograph. Their heights
# describe the visible fractured planes, not a normal map baked into the photo.
ICE_FACETS = (
    (.08,.19,-.11),(.36,.015,-.13),(.55,.10,-.115),(.64,.115,-.09),
    (.80,.195,-.12),(.08,.45,.035),(.22,.28,.12),(.32,.19,.16),
    (.36,.07,.135),(.45,.19,.145),(.6,.40,.31),(.54,.49,.32),
    (.32,.585,.19),(.17,.57,.055),(.065,.62,-.05),(.005,.76,-.055),
    (.255,.885,.105),(.39,.98,-.025),(.53,.935,.0),(.79,.91,-.10),
    (.85,.725,.095),(.98,.62,-.025),(.92,.51,.015),(.72,.44,.14),
    (.69,.25,.09),(.80,.255,-.015),(.13,.85,-.055),
)
# Tops of the individual scored mango cubes in their photographic positions.
# The bevel around each top eases into the underlying curved half-fruit.
MANGO_TOPS = (
    ((.327,.126),(.439,.032),(.507,.098),(.493,.248),(.407,.338),(.328,.238)),
    ((.512,.036),(.584,.006),(.654,.026),(.686,.126),(.638,.211),(.547,.192)),
    ((.681,.15),(.736,.072),(.818,.130),(.838,.247),(.745,.345),(.66,.225)),
    ((.137,.304),(.255,.14),(.307,.205),(.359,.315),(.267,.425),(.178,.424)),
    ((.459,.323),(.603,.184),(.687,.299),(.713,.374),(.579,.481),(.447,.433)),
    ((.807,.278),(.869,.201),(.926,.303),(.945,.374),(.858,.423),(.758,.419)),
    ((.045,.474),(.094,.37),(.159,.412),(.189,.515),(.115,.608),(.045,.59)),
    ((.259,.489),(.389,.349),(.452,.442),(.504,.533),(.358,.628),(.268,.604)),
    ((.041,.719),(.179,.569),(.252,.575),(.283,.688),(.202,.777),(.075,.817)),
    ((.38,.68),(.543,.586),(.604,.666),(.645,.741),(.495,.817),(.398,.815)),
    ((.605,.572),(.746,.504),(.842,.509),(.837,.649),(.722,.736),(.61,.68)),
)
MANGO_HEIGHTS = (.16,.16,.155,.17,.265,.14,.14,.265,.18,.20,.19)
PASSION_SEEDS = (
    (.31,.206),(.43,.176),(.527,.171),(.632,.20),(.255,.29),(.378,.30),
    (.49,.304),(.598,.273),(.697,.269),(.80,.337),(.36,.414),(.465,.373),
    (.555,.404),(.675,.361),(.771,.425),(.345,.469),(.50,.470),(.625,.473),
    (.735,.49),(.427,.556),(.539,.551),(.613,.628),(.738,.564),
)


def smooth(low, high, value):
    t = np.clip((value - low) / (high - low), 0, 1)
    return t * t * (3 - 2 * t)


def rounded(distance, reach):
    t = np.clip(distance / reach, 0, 1)
    return np.sqrt(t * (2 - t))


def circle_points(cx, cy, rx, ry, angle=0, count=28):
    th = np.arange(count)*2*np.pi/count
    p = np.column_stack((rx*np.cos(th), ry*np.sin(th)))
    c, s = np.cos(angle), np.sin(angle)
    return p @ np.array([[c,s],[-s,c]]) + [cx,cy]


def landmarks(kind):
    if kind == "hielo":
        return np.asarray(ICE_FACETS)[:,:2]
    if kind == "mango":
        return np.concatenate([np.asarray(top) for top in MANGO_TOPS])
    if kind == "maracuya":
        return np.vstack((PASSION_SEEDS, circle_points(.552,.374,.447,.303,.41),
                          circle_points(.552,.374,.403,.257,.41)))
    if kind == "barquillo":
        return np.vstack((circle_points(.911,.086,.080,.036,.78),
                          circle_points(.911,.086,.056,.023,.78),
                          circle_points(.083,.934,.068,.018,.65)))
    if kind == "pina":
        return np.array([(.571,.018),(.548,.19),(.528,.39),(.495,.63),(.460,.80),
                         (.446,.882),(.291,.78),(.691,.818)])
    return np.empty((0,2))


def polygon_depth(u, v, polygon):
    """Signed distance to the closest cutting plane of a convex mango cube."""
    points = np.asarray(polygon)
    delta = np.roll(points,-1,axis=0) - points
    area = np.sum(points[:,0]*np.roll(points[:,1],-1)-points[:,1]*np.roll(points[:,0],-1))
    normal = np.sign(area)*np.column_stack((-delta[:,1],delta[:,0]))
    normal /= np.linalg.norm(normal,axis=1)[:,None]
    return np.minimum.reduce([(u-x)*nx+(v-y)*ny for (x,y),(nx,ny) in zip(points,normal)])


def plane_field(controls, u, v):
    anchors = np.array(controls)
    corners = np.array([[-.1,-.1],[1.1,-.1],[1.1,1.1],[-.1,1.1]])
    closest = np.sum((corners[:,None,:]-anchors[None,:,:2])**2,axis=2).argmin(axis=1)
    interpolate = LinearNDInterpolator(np.vstack((anchors[:,:2],corners)),
                                       np.r_[anchors[:,2],anchors[closest,2]])
    return interpolate(u,v)


def depths(kind, uv, edge, aspect, part_radius):
    """Positive z is the camera-facing side. Edge distances are in image heights."""
    u,v = uv.T
    # A thin visible rim seals every part even where its recovery of depth is zero.
    rim = .004
    if kind == "cobertura":
        if part_radius<.035:
            half=part_radius*1.25*rounded(edge,max(part_radius,.004))
            return half+rim,-half-rim
        # A loose mound has a broad base, a slightly off-centre crown, and a
        # steeper rear slope. Real clusters supply the smaller surface relief.
        crown=np.exp(-((u-.49)/.285)**2-((v-.40)/.43)**2)
        slope=.32+.29*crown+.14*v
        seam=-.081+.085*v
        return seam+slope*rounded(edge,.25)+rim,seam-(.23+.13*crown)*rounded(edge,.24)-rim
    if kind == "barquillo":
        center = .115*(u-v)
        half = .208*rounded(edge,.099)
        dx,dy = (u-.911)*aspect,v-.086
        wide,narrow = (dx+dy)*.7071,(dy-dx)*.7071
        aperture = np.sqrt((wide/.086)**2 + (narrow/.039)**2)
        opening = 1-smooth(.46,1.,aperture)
        lip = np.exp(-((aperture-1.04)/.23)**2)
        near = center+half+.021*lip-.187*opening
        far = center-half-rim
        return np.maximum(near+rim,far+.012),far
    if kind == "miel":
        # The three droplets get depth in proportion to their own radius.
        r = min(part_radius,.175)
        half = (r*1.68)*rounded(edge,r*.95)
        center = (.095*(v-.45)-.04*(u-.5)) if part_radius>.05 else -.04+.12*(.5-v)
        return center+half+rim, center-half-rim
    if kind == "hielo":
        near = plane_field(ICE_FACETS,u,v)
        far = -.24 - .34*rounded(edge,.235) + .04*(v-.5)
        seam = -.092+.035*(u-.45)
        front = seam+(near-seam)*smooth(0,.065,edge)
        return front+rim, np.minimum(front-rim,seam+(far-seam)*rounded(edge,.185)-rim)
    if kind == "pina":
        # Two cut planes converge towards the core and spread towards the rind.
        ridge = .575-.117*v
        face = .058+.31*v - np.maximum((ridge-u)*.45,(u-ridge)*.295)
        skirt = smooth(.72,.9,v)
        face -= .103*skirt
        seam = -.019+.08*(v-.45)
        near = seam+(face-seam)*rounded(edge,.078)
        far = seam-(.10+.31*v)*rounded(edge,.19)
        return near+rim, far-rim
    if kind == "lima":
        # Straight chord of the cut face above, bowed outside of the peel below.
        chord = v-(.734-.835*u)
        cut = .015+.49*chord+.055*(u-.48)
        rind = smooth(.53,.79,np.maximum(chord,0))
        cut -= .29*rind
        seam = -.07+.095*(v-.5)-.035*(u-.5)
        front = seam+(cut-seam)*rounded(edge,.065)
        back = seam-(.29+.20*np.clip(chord,0,.8))*rounded(edge,.182)
        return front+rim,back-rim
    if kind == "mango":
        center = -.068+.070*(v-.5)
        shell = .19*rounded(edge,.21)
        base = center+.026+shell*.65
        cubes = np.zeros_like(u)
        for top,height in zip(MANGO_TOPS,MANGO_HEIGHTS):
            dist = polygon_depth(u,v,top)
            # A broad sloped wall meets a nearly flat top with a narrow bevel.
            block = height*np.clip((dist+.065)/.07,0,1)
            cubes = np.maximum(cubes,block)
        cut = (base+(.11+.07*v)*smooth(.75,.86,v))*(1-.24*smooth(.84,.96,v))
        near = center+(cut+cubes-center)*rounded(edge,.062)
        return near+rim,center-.34*rounded(edge,.19)-rim
    if kind == "maracuya":
        dx,dy=u-.552,v-.374
        c,s=np.cos(.41),np.sin(.41)
        long=c*dx+s*dy;short=-s*dx+c*dy
        radius=np.sqrt((long/.455)**2+(short/.313)**2)
        inside=1-smooth(.91,1.04,radius)
        # The juicy surface is recessed into the cut shell; the pale ring and
        # individual seeds sit above that bowl. The skin closes as a deep cup.
        face=.065+.27*v+.05*(u-.5)
        face+=.070*np.exp(-((radius-.945)/.111)**2)
        face-=.084*inside*np.clip(1-radius*radius,0,1)
        seed_relief=np.zeros_like(u)
        for cx,cy in PASSION_SEEDS:
            kernel=np.exp(-(((u-cx)/.034)**2+((v-cy)/.027)**2)*1.35)
            seed_relief=np.maximum(seed_relief,kernel)
        face+=.030*seed_relief*inside
        face-=.16*smooth(.04,.37,radius-1)
        center=-.064+.088*(v-.48)
        near=center+(face-center)*rounded(edge,.11)
        return near+rim,center-.46*rounded(edge,.25)-rim
    raise ValueError(kind)


def crumb_relief(color, uv, edge):
    luminance=cv2.cvtColor(color,cv2.COLOR_RGB2GRAY).astype(np.float32)/255
    fine=cv2.GaussianBlur(luminance,(0,0),1.4)
    coarse=cv2.GaussianBlur(luminance,(0,0),7)
    detail=np.clip((fine-coarse)*.32,-.04,.045)
    h,w=detail.shape
    items=np.clip(np.rint(uv*[w,h]-.5).astype(int),[0,0],[w-1,h-1])
    return detail[items[:,1],items[:,0]]*smooth(.005,.04,edge)


def tessellate(mask, kind):
    h,w = mask.shape
    padded=np.pad(mask,PADDING)
    contours,_=cv2.findContours(padded,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    for contour in sorted(contours,key=cv2.contourArea,reverse=True):
        if cv2.contourArea(contour)<18:
            continue
        shape=np.zeros_like(padded)
        cv2.fillPoly(shape,[contour],255)
        distance=cv2.distanceTransform(shape,cv2.DIST_L2,5)
        loop=cv2.approxPolyDP(contour,.58 if cv2.contourArea(contour)>650 else .4,True).reshape(-1,2)
        if len(loop)<3:
            continue
        points=list(map(tuple,loop.tolist()))
        # Even, staggered tessellation and two extra bands of samples just inside
        # the photographed contour preserve rounded sides at oblique angles.
        radius=float(distance.max())
        step=12 if kind not in ("barquillo","mango","maracuya") else 10
        if radius<16:
            step=3
        for y in range(PADDING,distance.shape[0]-PADDING,step):
            start=PADDING+(step//2 if (y-PADDING)//step%2 else 0)
            for x in range(start,distance.shape[1]-PADDING,step):
                if distance[y,x]>step*.42:
                    points.append((x,y))
        for inset in ((2,6) if radius>16 else (2,)):
            bands,_=cv2.findContours((distance>=inset).astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
            for band in bands:
                if len(band)<5:
                    continue
                for x,y in band.reshape(-1,2)[::(8 if radius>16 else 3)]:
                    if distance[y,x]>1:
                        points.append((int(x),int(y)))
        for u,v in landmarks(kind):
            x,y=np.rint([u*w-.5+PADDING,v*h-.5+PADDING]).astype(int)
            if 0<=y<distance.shape[0] and 0<=x<distance.shape[1] and distance[y,x]>2:
                points.append((x,y))
        points=list(dict.fromkeys(points))
        segments=np.column_stack((np.arange(len(loop)),np.roll(np.arange(len(loop)),-1)))
        plan=triangle.triangulate({"vertices":np.asarray(points,float),"segments":segments},"pQ")
        raw=plan["triangles"]
        used,indices=np.unique(raw,return_inverse=True)
        points=plan["vertices"][used]
        front=indices.reshape(raw.shape)[:,[0,2,1]]
        xy=np.rint(points).astype(int)
        uv=(points-PADDING+.5)/[w,h]
        edge=np.maximum(distance[xy[:,1],xy[:,0]]-1.0,0)/h
        limits=(radius-1)/h
        yield uv,front,edge,limits


def surface(uv, front, near, far, aspect):
    plane=np.column_stack(((uv[:,0]-.5)*2*aspect,1-2*uv[:,1]))
    n=len(uv)
    xyz=np.vstack((np.column_stack((plane,near)),np.column_stack((plane,far))))
    edges={}
    for face in front:
        for a,b in zip(face,np.roll(face,-1)):
            if (b,a) in edges:
                del edges[(b,a)]
            else:
                edges[(a,b)]=True
    walls=[tri for a,b in edges for tri in ((b,a,a+n),(b,a+n,b+n))]
    faces=np.vstack((front,front[:,::-1]+n,np.asarray(walls)))
    tri=xyz[faces]
    cross=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
    areas=np.linalg.norm(cross,axis=1)
    if areas.min()<1e-11 or np.min(near-far)<=0 or np.einsum("ij,ij->",tri[:,0],cross)<=0:
        raise ValueError("Degenerate or inverted shell")
    normals=np.zeros_like(xyz)
    for index in range(3):
        np.add.at(normals,faces[:,index],cross)
    lengths=np.linalg.norm(normals,axis=1,keepdims=True)
    if min(lengths[:,0])<1e-12 or len(xyz)>65535:
        raise ValueError("Invalid normal or mesh too large for uint16")
    return xyz.astype("<f4"),(normals/lengths).astype("<f4"),np.vstack((uv,uv)).astype("<f4"),faces.astype("<u2")


class Model:
    def __init__(self,slug):
        self.binary=bytearray()
        self.doc={
            "asset":{"version":"2.0","generator":"Faber & Paty · ingredientes"},
            "extensionsUsed":["EXT_texture_webp"],"extensionsRequired":["EXT_texture_webp"],
            "scene":0,"scenes":[{"name":slug,"nodes":[]}],"nodes":[],"meshes":[],
            "bufferViews":[],"accessors":[],
            "images":[{"uri":"../../ingredientes/"+slug+".webp","mimeType":"image/webp"}],
            "samplers":[{"magFilter":9729,"minFilter":9987,"wrapS":33071,"wrapT":33071}],
            "textures":[{"sampler":0,"extensions":{"EXT_texture_webp":{"source":0}}}],
            "materials":[{"name":"Fotografía del ingrediente","pbrMetallicRoughness":{
                "baseColorTexture":{"index":0},"metallicFactor":0,"roughnessFactor":.8},
                "alphaMode":"MASK","alphaCutoff":.16}],
        }

    def accessor(self,data,kind,component,target,limits=False):
        self.binary.extend(b"\0"*(-len(self.binary)%4))
        raw=np.ascontiguousarray(data).tobytes()
        view=len(self.doc["bufferViews"])
        self.doc["bufferViews"].append({"buffer":0,"byteOffset":len(self.binary),"byteLength":len(raw),"target":target})
        self.binary.extend(raw)
        record={"bufferView":view,"componentType":component,"count":len(data),"type":kind}
        if limits:
            record.update(min=data.min(axis=0).tolist(),max=data.max(axis=0).tolist())
        self.doc["accessors"].append(record)
        return len(self.doc["accessors"])-1

    def add(self,label,data):
        xyz,normal,uv,indices=data
        attrs={"POSITION":self.accessor(xyz,"VEC3",5126,34962,True),
               "NORMAL":self.accessor(normal,"VEC3",5126,34962),
               "TEXCOORD_0":self.accessor(uv,"VEC2",5126,34962)}
        primitive={"attributes":attrs,"indices":self.accessor(indices.flatten(),"SCALAR",5123,34963),"material":0}
        node=len(self.doc["nodes"])
        self.doc["meshes"].append({"name":label,"primitives":[primitive]})
        self.doc["nodes"].append({"name":label,"mesh":node})
        self.doc["scenes"][0]["nodes"].append(node)

    def save(self,path):
        self.doc["buffers"]=[{"byteLength":len(self.binary)}]
        self.binary.extend(b"\0"*(-len(self.binary)%4))
        meta=json.dumps(self.doc,ensure_ascii=False,separators=(",",":")).encode("utf8")
        meta+=b" "*(-len(meta)%4)
        size=28+len(meta)+len(self.binary)
        path.write_bytes(struct.pack("<4sII",b"glTF",2,size)+struct.pack("<I4s",len(meta),b"JSON")+meta+
                         struct.pack("<I4s",len(self.binary),b"BIN\0")+self.binary)


def main():
    MODELS.mkdir(exist_ok=True,parents=True)
    for slug in SLUGS:
        with Image.open(TEXTURES/(slug+".webp")) as photo:
            rgba=np.asarray(photo.convert("RGBA"))
        original_h,original_w=rgba.shape[:2]
        # Retain the native texture for sampling. Large source photographs only
        # need this contour resolution for a subpixel edge at catalogue size.
        if max(original_h,original_w)>520:
            scale=520/max(original_h,original_w)
            rgba=cv2.resize(rgba,(round(original_w*scale),round(original_h*scale)),interpolation=cv2.INTER_AREA)
        alpha=rgba[:,:,3]
        h,w=alpha.shape
        model=Model(slug)
        counts=[]
        mask=(alpha>=38).astype(np.uint8)*255
        for index,(uv,faces,edge,radius) in enumerate(tessellate(mask,slug)):
            near,far=depths(slug,uv,edge,w/h,radius)
            if slug=="cobertura":
                near+=crumb_relief(rgba[:,:,:3],uv,edge)
            data=surface(uv,faces,near,far,original_w/original_h)
            label=slug if index==0 else ("Gota " if slug=="miel" else "Miga ")+str(index)
            model.add(label,data)
            counts.append(len(data[3]))
        path=MODELS/(slug+".glb")
        model.save(path)
        print(f"{slug:9s} {len(counts)} piezas, {sum(counts):5d} triángulos, {path.stat().st_size:6d} bytes")


if __name__=="__main__":
    main()
