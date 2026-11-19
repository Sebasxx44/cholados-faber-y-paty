// The print and the mesh share front-facing UVs. One canvas serves the six models.
const vertex = `
  attribute vec3 position, normal;
  attribute vec2 uv;
  uniform vec2 fit;
  uniform vec4 rotation;
  varying vec2 photoUV;
  varying float light;
  vec3 turn(vec3 p) {
    vec3 v = vec3(rotation.y*p.x + rotation.x*p.z, p.y, -rotation.x*p.x + rotation.y*p.z);
    return vec3(v.x, rotation.w*v.y - rotation.z*v.z, rotation.z*v.y + rotation.w*v.z);
  }
  void main() {
    vec3 v = turn(position);
    gl_Position = vec4(v.xy*fit, -v.z*.72, 1.);
    photoUV = uv;
    light = max(dot(normalize(turn(normal)), vec3(-.31,.46,.82)),0.);
  }`;
const fragment = `
  precision mediump float;
  varying vec2 photoUV;
  varying float light;
  uniform sampler2D artwork;
  void main() {
    vec4 p = texture2D(artwork,photoUV);
    if (p.a < .16) discard;
    gl_FragColor = vec4(p.rgb*(.979 + .021*light)*p.a,p.a);
  }`;

export function makeViewer() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden","true");
  const gl = canvas.getContext("webgl",{alpha:true,antialias:true,powerPreference:"low-power"});
  if (!gl) return null;
  const program = gl.createProgram();
  for (const [type,code] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,code);
    gl.compileShader(shader);
    gl.attachShader(program,shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  const slots=Object.fromEntries(["position","normal","uv"].map(k=>[k,gl.getAttribLocation(program,k)]));
  const rotation=gl.getUniformLocation(program,"rotation"), fit=gl.getUniformLocation(program,"fit");
  const texture=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
  for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);
  const models=new Map();
  let active=null, activeSlug="", buffers=[], draws=[], serial=0, aspect=1, yaw=0, pitch=0;
  let lost=false,paintedY=NaN,paintedPitch=NaN;
  function clear(){
    ++serial;
    active?.classList.remove("has-model");
    active=null;activeSlug="";
    canvas.remove();
    for(const b of buffers) gl.deleteBuffer(b);
    buffers=[]; draws=[];
  }
  canvas.addEventListener("webglcontextlost",()=>{lost=true;clear()});
  function paint(y,p){
    yaw=y;pitch=p;
    if(!active||!draws.length||lost||(paintedY===y&&paintedPitch===p)) return;
    paintedY=y;paintedPitch=p;
    gl.uniform4f(rotation,Math.sin(y),Math.cos(y),Math.sin(p),Math.cos(p));
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    for(const d of draws){
      for(const [field,attr,n] of [[d.pos,slots.position,3],[d.norm,slots.normal,3],[d.tex,slots.uv,2]]){
        gl.bindBuffer(gl.ARRAY_BUFFER,field.buf);
        gl.enableVertexAttribArray(attr);
        gl.vertexAttribPointer(attr,n,field.type,field.norm,field.stride,field.offset);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,d.indices.buf);
      gl.drawElements(gl.TRIANGLES,d.indices.count,d.indices.type,d.indices.offset);
    }
  }
  function resize(){
    if(!active) return;
    const w=active.clientWidth,h=active.clientHeight;
    if(!w||!h) return;
    const density=Math.min(window.devicePixelRatio||1,2,1600/Math.max(w,h));
    const cw=Math.round(w*density),ch=Math.round(h*density);
    if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
    gl.viewport(0,0,cw,ch);
    const ratio=w/h, scale=Math.min(1,ratio/aspect);
    gl.uniform2f(fit,scale/ratio,scale);
    paintedY=NaN;paint(yaw,pitch);
  }
  async function select(link){
    const holder=link?.querySelector(".glass-form");
    const slug=link?.dataset.slug;
    if((active===holder&&activeSlug===slug)||lost) return;
    clear();
    if(!holder) return;
    const id=serial,photo=holder.querySelector("img");
    try{
      if(!models.has(slug)) models.set(slug,fetch("/assets/modelos/"+slug+".glb").then(r=>{
        if(!r.ok) throw Error("Modelo no disponible");
        return r.arrayBuffer();
      }).catch(e=>{models.delete(slug);throw e}));
      const [bytes]=await Promise.all([models.get(slug),photo.decode()]);
      if(id!==serial||lost) return;
      const view=new DataView(bytes),length=view.getUint32(12,true);
      const doc=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,length)));
      const base=28+length;
      const fields=[];
      function field(i,target){
        const a=doc.accessors[i],v=doc.bufferViews[a.bufferView];
        if(!fields[a.bufferView]){
          const buf=gl.createBuffer();
          gl.bindBuffer(target,buf);
          gl.bufferData(target,new Uint8Array(bytes,base+(v.byteOffset||0),v.byteLength),gl.STATIC_DRAW);
          fields[a.bufferView]=buf;buffers.push(buf);
        }
        return {buf:fields[a.bufferView],offset:a.byteOffset||0,stride:v.byteStride||0,type:a.componentType,norm:!!a.normalized,count:a.count};
      }
      draws=doc.meshes.flatMap(mesh=>mesh.primitives.map(p=>({
        pos:field(p.attributes.POSITION,gl.ARRAY_BUFFER),norm:field(p.attributes.NORMAL,gl.ARRAY_BUFFER),
        tex:field(p.attributes.TEXCOORD_0,gl.ARRAY_BUFFER),indices:field(p.indices,gl.ELEMENT_ARRAY_BUFFER)
      })));
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,photo);
      aspect=photo.naturalWidth/photo.naturalHeight;
      active=holder;activeSlug=slug;holder.append(canvas);resize();holder.classList.add("has-model");
    }catch{if(id===serial) clear();}
  }
  return {select,paint,resize};
}
