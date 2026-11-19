import { createWheelGesture } from "./gesto.js";
const runway=document.querySelector(".runway");
if(runway) startShowcase();

function startShowcase() {
  const board=runway.querySelector(".board"),opening=board.querySelector(".opening"),stage=board.querySelector(".product-stage");
  const rail=stage.querySelector(".rail"),propPlane=stage.querySelector(".prop-plane"),captions=board.querySelector(".captions");
  const pause=board.querySelector(".pause-motion"),header=document.querySelector(".masthead");
  const gifts=[...rail.querySelectorAll(".glass")];
  // A real fragment target prevents WebKit from jumping back to a catalog card after images load.
  const stops=gifts.map(gift=>{
    const id="sabor-"+gift.dataset.slug,card=document.getElementById(id);
    if(card) card.id="ficha-"+gift.dataset.slug;
    const stop=document.createElement("span");
    stop.id=id;stop.className="scene-stop";stop.setAttribute("aria-hidden","true");
    runway.append(stop);
    return stop;
  });
  const scenes=gifts.map((link,i)=>({
    link,img:link.querySelector("img"),back:board.querySelectorAll(".light-set")[i],
    props:propPlane.children[i],label:captions.children[i]
  }));
  const last=gifts.length,reduce=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
  document.documentElement.classList.add("js");
  let start=0,travel=0,step=1,w=1,h=1,inView=false,focus=-1,frame=0,prev=0,pos=0,goal=0,ready=false,drawn=NaN;
  let paused=false,mouseX=0,mouseY=0,aimX=0,aimY=0,viewer=null,viewerLoading=false,modelIndex=-1,arrivalAt=0;
  let swipe=null,ignoreClick=0,capture=false;
  let focusFirst=false;
  const isNewGesture=createWheelGesture();
  const saving=navigator.connection?.saveData===true;
  function prepare(i,big=false){
    const scene=scenes[i-1];if(!scene) return;
    if(!scene.img.getAttribute("src")||big&&!scene.img.dataset.big){
      scene.img.src=big?scene.img.dataset.large:scene.img.dataset.small;
      if(big) scene.img.dataset.big="1";
    }
    if(big&&!scene.back.dataset.ready){
      scene.back.style.backgroundImage="url("+scene.back.dataset.bg+")";
      scene.back.dataset.ready="1";
      for(const img of scene.props.querySelectorAll("img")) img.src=img.dataset.src;
    }
  }
  function syncModel(){
    const wanted=!inView||reduce.matches||paused||saving||focus<1?0:focus;
    // A moving poster already carries the studio lighting. Upload the mesh once it lands.
    if(wanted && (pos!==goal||focus!==goal)) return;
    if(modelIndex===wanted) return;
    if(!viewer&&wanted){
      if(!viewerLoading){
        viewerLoading=true;
        import("./modelo.js").then(m=>{viewer=m.makeViewer();if(viewer) syncModel()}).catch(()=>{});
      }
      return;
    }
    modelIndex=wanted;
    arrivalAt=0;
    if(viewer) viewer.select(wanted?gifts[wanted-1]:null).then(()=>{
      if(wanted&&modelIndex===wanted&&gifts[wanted-1].querySelector(".has-model")){
        arrivalAt=performance.now();queue();
      }
    });
  }
  function refresh(index){
    if(index!==focus){
      focus=index;
      board.classList.toggle("flavor",index>0);
      board.dataset.scene=String(index);
      opening.inert=index!==0;
      opening.setAttribute("aria-hidden",String(index!==0));
      stage.setAttribute("aria-hidden",String(!index));
      pause.tabIndex=index?0:-1;
      const active=scenes[index-1];
      document.body.style.setProperty("--scene-ink",active?.back.style.getPropertyValue("--ink")||"#65152f");
      scenes.forEach((s,j)=>{
        const current=j+1===index;
        s.link.setAttribute("aria-hidden",String(!current));s.link.tabIndex=current?0:-1;
        s.label.inert=!current;s.label.setAttribute("aria-hidden",String(!current));s.props.classList.toggle("visible",current);
      });
      if(active){
        prepare(index,true);
        prepare((index%last)+1);
        prepare(((index+last-2)%last)+1);
        if(focusFirst&&index===1){active.link.focus({preventScroll:true});focusFirst=false;}
      }
    }
    syncModel();
  }
  function render(){
    const index=clamp(Math.round(pos),0,last);
    refresh(index);
    const intro=clamp(1-pos),products=clamp(pos);
    opening.style.opacity=String(clamp(1-pos*1.23));
    opening.style.visibility=intro?"visible":"hidden";
    opening.style.transform="translate3d("+(-pos*22*w/100)+"px,0,0)";
    stage.style.opacity=String(products);captions.style.opacity=String(products);
    const spacing=w*(w<620?.586:.473);
    for(const [j,s] of scenes.entries()){
      const i=j+1;
      const mix=clamp(pos-i+1);
      s.back.style.opacity=String(mix);
      s.back.style.visibility=i===Math.floor(pos)||i===Math.ceil(pos)?"visible":"hidden";
      let offset=i-pos;
      if(pos>=.65){
        if(offset>last/2) offset-=last;
        if(offset < -last/2) offset+=last;
      }
      const dist=Math.abs(offset),weight=Math.max(0,1-dist),edge=clamp((1.42-dist)/.42);
      const alpha=edge*(.135+.865*weight*weight);
      s.link.style.visibility=alpha&&products?"visible":"hidden";
      if(alpha&&products){
        prepare(i,weight>.1);
        const scale=.68+.32*(1-(1-weight)**2);
        s.link.style.transform="translate3d(calc(-50% + "+(offset*spacing).toFixed(2)+"px),-50%,0) scale("+scale.toFixed(4)+") rotate("+(-offset*2.4).toFixed(2)+"deg)";
        s.link.style.opacity=alpha.toFixed(3);
        s.link.style.zIndex=String(Math.round(8*weight)+1);
      }
      const caption=clamp(1-Math.abs(i-pos)*1.85);
      s.label.style.opacity=caption.toFixed(3);
      s.label.style.visibility=caption?"visible":"hidden";
      if(caption) s.label.style.transform="translate3d("+(offset*38).toFixed(1)+"px,0,0)";
      const light=clamp(1-Math.abs(i-pos)*1.55);
      s.props.style.opacity=light.toFixed(3);s.props.style.visibility=light?"visible":"hidden";
    }
  }
  function measure(){
    start=runway.getBoundingClientRect().top+scrollY;
    w=board.clientWidth;h=board.clientHeight;
    travel=Math.max(1,runway.offsetHeight-h);
    step=Math.floor(travel)/last;
    stops.forEach((stop,i)=>{stop.style.top=Math.round((i+1)*step)+"px"});
    drawn=NaN;viewer?.resize();readScroll();
  }
  function readScroll(){
    const local=scrollY-start;
    goal=clamp(Math.round(local/step),0,last);
    const visible=local>=-h && local<travel+h;
    document.body.classList.toggle("en-vitrina",local>=-.75&&local<=travel+.75);
    board.classList.toggle("outside",!visible||document.hidden);
    if(visible!==inView){
      inView=visible;
      if(visible) window.addEventListener("wheel",wheel,{passive:false});
      else window.removeEventListener("wheel",wheel);
      syncModel();
    }
    if(!ready||!visible||reduce.matches) pos=goal;
    ready=true;queue();
  }
  function queue(){if(!frame) frame=requestAnimationFrame(tick)}
  function tick(now){
    frame=0;
    const dt=Math.min((now-(prev||now-16))/1000,.06);prev=now;
    const follow=reduce.matches?1:1-Math.exp(-9.7*dt);
    const next=pos+(goal-pos)*follow;
    pos=Math.abs(next-goal)<.0015?goal:next;
    const eased=(from,to)=>Math.abs(to-from)<.002?to:from+(to-from)*(1-Math.exp(-12*dt));
    aimX=eased(aimX,mouseX);aimY=eased(aimY,mouseY);
    if(pos!==drawn){render();drawn=pos}
    propPlane.style.setProperty("--px",(aimX*Math.min(33,w*.023)).toFixed(2)+"px");
    propPlane.style.setProperty("--py",(aimY*Math.min(23,h*.025)).toFixed(2)+"px");
    const progress=arrivalAt?clamp((now-arrivalAt)/720):1;
    const turn=Math.sin(progress*Math.PI)*(1-progress)*.12*(focus%2?1:-1);
    if(pos===goal) viewer?.paint(clamp(aimX*.105+turn,-.11,.11),-aimY*.052);
    if(progress===1) arrivalAt=0;
    if(inView&&!document.hidden&&(pos!==goal||aimX!==mouseX||aimY!==mouseY||arrivalAt)) queue();else prev=0;
  }
  function go(index,immediate=false){
    const target=clamp(index,0,last);
    window.scrollTo({top:start+target*step,behavior:"instant"});
    goal=target;if(immediate||reduce.matches) pos=target;
    readScroll();
  }
  const occupied=()=>!!document.querySelector("dialog[open],.nav-mobile[open]");
  const onStage=()=>scrollY-start>=-.75&&scrollY-start<=travel+.75&&!occupied();
  function wheel(e){
    if(e.defaultPrevented||!e.cancelable||e.ctrlKey||e.metaKey||occupied()) return;
    const local=scrollY-start,unit=e.deltaMode===1?16:e.deltaMode===2?h:1;
    const horizontal=Math.abs(e.deltaX)>Math.abs(e.deltaY);
    const delta=(horizontal?e.deltaX:e.deltaY)*unit,dir=Math.sign(delta);
    if(!dir||local<-.75) return;
    const returning=local>travel+.75;
    if(returning&&(e.deltaY>=0||local+e.deltaY*unit>travel)) return;
    const next=returning?last:Math.round(local/step)+dir;
    const fresh=isNewGesture(e,delta,horizontal,pos!==goal,returning);
    if(fresh) capture=next>=0&&next<=last;
    if(capture){e.preventDefault();if(fresh) go(next);}
  }
  function touchStart(e){
    swipe=null;ignoreClick=0;
    if(e.touches.length!==1||!onStage()) return;
    const finger=e.touches[0];swipe={x:finger.clientX,y:finger.clientY,index:goal,used:false};
  }
  function touchMove(e){
    if(e.touches.length!==1){swipe=null;return}
    if(!swipe||!e.cancelable) return;
    if(swipe.used){e.preventDefault();return}
    const f=e.touches[0],dx=swipe.x-f.clientX,dy=swipe.y-f.clientY;
    const delta=Math.abs(dx)>Math.abs(dy)?dx:dy;
    if(Math.abs(delta)<8) return;
    const next=swipe.index+Math.sign(delta);
    if(next<0||next>last){swipe=null;return}
    e.preventDefault();swipe.used=true;go(next);
  }
  function touchEnd(){if(swipe?.used) ignoreClick=performance.now()+350;swipe=null}
  function pointer(e){
    if(!focus||paused||reduce.matches||e.pointerType==="touch"||!onStage()) return;
    mouseX=clamp(2*e.clientX/w-1,-1,1);mouseY=clamp(2*e.clientY/h-1,-1,1);queue();
  }
  for(const surface of [board,header]){
    surface.addEventListener("pointermove",pointer);
    surface.addEventListener("pointerleave",()=>{mouseX=0;mouseY=0;queue()});
    surface.addEventListener("touchstart",touchStart,{passive:true});
    surface.addEventListener("touchmove",touchMove,{passive:false});
    surface.addEventListener("touchend",touchEnd);surface.addEventListener("touchcancel",touchEnd);
  }
  gifts.forEach((gift,i)=>gift.addEventListener("click",e=>{
    if(e.detail&&performance.now()<ignoreClick){e.preventDefault();return}
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0) return;
    if(i+1!==focus||Math.abs(pos-focus)>.15){e.preventDefault();go(i+1);}
  }));
  window.addEventListener("keydown",e=>{
    const directions={ArrowRight:1,ArrowDown:1,PageDown:1,ArrowLeft:-1,ArrowUp:-1,PageUp:-1," ":e.shiftKey?-1:1};
    if(!Object.hasOwn(directions,e.key)||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||!onStage()) return;
    if(e.target.closest?.("input,textarea,button,summary,select,[contenteditable=true]")) return;
    const i=goal+directions[e.key];if(i<0||i>last) return;
    e.preventDefault();go(i);
  });
  function toggleMotion(){
    board.classList.toggle("still",paused||reduce.matches);
    const text=paused?"Reanudar movimiento":"Pausar movimiento";
    pause.setAttribute("aria-label",text);pause.title=text;
    mouseX=0;mouseY=0;syncModel();queue();
  }
  pause.addEventListener("click",()=>{paused=!paused;toggleMotion()});
  reduce.addEventListener("change",()=>{toggleMotion();readScroll()});
  opening.querySelector(".tour-link").addEventListener("click",e=>{
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey) return;
    e.preventDefault();focusFirst=e.detail===0;go(1);
  });
  function hashScene(){
    const i=gifts.findIndex(a=>location.hash==="#sabor-"+a.dataset.slug);
    if(i>=0) go(i+1,true);
  }
  window.addEventListener("scroll",readScroll,{passive:true});window.addEventListener("resize",measure,{passive:true});
  window.addEventListener("pageshow",()=>{measure();hashScene()});window.addEventListener("hashchange",hashScene);
  document.addEventListener("visibilitychange",readScroll);
  measure();hashScene();toggleMotion();
  // Decode the first neighbor after the storefront has had the network to itself.
  function warm(){prepare(1);prepare(2)}
  if(document.readyState==="complete") warm();else window.addEventListener("load",warm,{once:true});
}
