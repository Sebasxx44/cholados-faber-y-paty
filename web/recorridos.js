import { createWheelGesture } from "./gesto.js";

const galleries=[...document.querySelectorAll(".journey")].map(setup);
if(galleries.length) connect();

function setup(section){
  const viewport=section.querySelector(".journey-window");
  const track=section.querySelector(".journey-track");
  const slides=[...track.children],last=slides.length-1;
  const nav=section.querySelector(".journey-nav");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const freshGesture=createWheelGesture();
  let index=-1,movingUntil=0,start=0,end=0,stride=1,captured=false;
  let warmed=-1;

  function measure(){
    start=section.getBoundingClientRect().top+window.scrollY;
    const travel=Math.max(1,section.offsetHeight-viewport.offsetHeight);
    // Round the end down so the last stop remains inside the sticky range on fractional screens.
    end=start+travel;stride=travel/Math.max(last,1);
  }
  function render(next){
    if(index===next) return;
    movingUntil=index>=0&&!reduced.matches?performance.now()+540:0;
    index=next;
    track.style.transform="translate3d("+(-100*index)+"%,0,0)";
    section.dataset.stop=String(index);
    for(const [i,slide] of slides.entries()){
      slide.inert=i!==index;
      slide.setAttribute("aria-hidden",String(i!==index));
      if(i!==index) slide.querySelector("video")?.pause();
    }
    const ink=getComputedStyle(slides[index]).getPropertyValue("--tone-ink");
    section.style.setProperty("--nav-ink",ink);
    for(const button of nav.querySelectorAll("button")){
      const destination=index+Number(button.dataset.shift);
      button.disabled=destination<0||destination>last;
    }
  }
  function read(){
    const next=Math.round((scrollY-start)/stride);
    render(Math.max(0,Math.min(last,next)));
    if(nearby(scrollY)&&warmed!==index){
      for(const s of slides.slice(Math.max(0,index-1),index+2)){
        const photo=s.querySelector("img");if(photo) photo.loading="eager";
      }
      warmed=index;
    }
  }
  function go(next){
    if(next<0||next>last) return false;
    window.scrollTo({top:Math.round(start+next*stride),behavior:"instant"});
    render(next);
    return true;
  }
  function wheel(e,delta,xAxis,entry){
    const next=entry===null?index+Math.sign(delta):entry;
    const fresh=freshGesture(e,delta,xAxis,performance.now()<movingUntil,entry!==null);
    if(fresh) captured=next>=0&&next<=last;
    if(!captured) return false;
    e.preventDefault();
    if(fresh) go(next);
    return true;
  }
  function position(y){return y>=start-1&&y<=end+1}
  function nearby(y){return y+innerHeight*1.6>=start&&y-innerHeight*1.6<=end}
  function crossing(y,dy){
    if(dy>0&&y<start-1&&y+dy>=start) return 0;
    if(dy<0&&y>end+1&&y+dy<=end) return last;
    return null;
  }
  nav.addEventListener("click",e=>{
    const button=e.target.closest("[data-shift]");
    if(button&&!button.disabled) go(index+Number(button.dataset.shift));
  });
  section.classList.add("with-track");
  return {section,measure,read,go,wheel,position,nearby,crossing,get index(){return index}};
}

function connect(){
  let frame=0,measureAtFrame=true,finger=null,swallowClick=0,watchingWheel=false;
  const busy=()=>!!(document.fullscreenElement||document.querySelector("dialog[open], .nav-mobile[open]"));
  const at=y=>galleries.find(g=>g.position(y));
  function refresh(){
    frame=0;
    if(measureAtFrame){for(const g of galleries) g.measure();measureAtFrame=false;}
    for(const g of galleries) g.read();
    const needed=galleries.some(g=>g.nearby(scrollY));
    if(needed!==watchingWheel){
      watchingWheel=needed;
      if(needed) window.addEventListener("wheel",wheel,{passive:false});
      else window.removeEventListener("wheel",wheel);
    }
  }
  function schedule(measure=false){
    measureAtFrame||=measure;
    if(!frame) frame=requestAnimationFrame(refresh);
  }
  function invalidate(){schedule(true)}
  refresh();
  window.addEventListener("scroll",()=>schedule(),{passive:true});
  window.addEventListener("resize",invalidate,{passive:true});
  window.addEventListener("pageshow",invalidate);
  // The menu filters above these sections can move both tracks without resizing the viewport.
  const layout=new ResizeObserver(invalidate);layout.observe(document.querySelector("main"));
  layout.observe(document.getElementById("carta"));
  function wheel(e){
    if(e.defaultPrevented||!e.cancelable||e.ctrlKey||e.metaKey||busy()) return;
    if(measureAtFrame) refresh();
    const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;
    const xAxis=Math.abs(e.deltaX)>Math.abs(e.deltaY);
    const delta=(xAxis?e.deltaX:e.deltaY)*unit;
    if(!delta) return;
    const y=scrollY,here=at(y);
    if(here){here.read();if(here.wheel(e,delta,xAxis,null)) return}
    if(xAxis) return;
    const order=delta>0?galleries:[...galleries].reverse();
    for(const g of order){
      if(g===here) continue;
      const edge=g.crossing(y,delta);
      if(edge!==null){g.wheel(e,delta,false,edge);return}
    }
  }
  window.addEventListener("touchstart",e=>{
    finger=null;swallowClick=0;
    if(e.touches.length!==1||busy()) return;
    const gallery=at(scrollY);if(!gallery) return;
    const touch=e.touches[0];
    const player=e.target.closest?.("video[controls]");
    if(player && touch.clientY>=player.getBoundingClientRect().bottom-68) return;
    finger={gallery,index:gallery.index,x:touch.clientX,y:touch.clientY,used:false};
  },{passive:true});
  function touchMove(e){
    if(e.touches.length!==1){finger=null;return}
    if(!finger||!e.cancelable||busy()) return;
    if(finger.used){e.preventDefault();return}
    const t=e.touches[0],dx=finger.x-t.clientX,dy=finger.y-t.clientY;
    const distance=Math.abs(dx)>Math.abs(dy)?dx:dy;
    if(Math.abs(distance)<10) return;
    if(finger.gallery.go(finger.index+Math.sign(distance))){finger.used=true;e.preventDefault()}
    else finger=null;
  }
  for(const area of [...galleries.map(g=>g.section),document.querySelector(".masthead")]) area.addEventListener("touchmove",touchMove,{passive:false});
  function endTouch(){if(finger?.used) swallowClick=performance.now()+320;finger=null}
  window.addEventListener("touchend",endTouch);window.addEventListener("touchcancel",endTouch);
  document.addEventListener("click",e=>{
    if(e.detail&&performance.now()<swallowClick&&e.target.closest(".journey")){e.preventDefault();e.stopPropagation()}
  },true);
  window.addEventListener("keydown",e=>{
    if(e.defaultPrevented||busy()||e.ctrlKey||e.altKey||e.metaKey||e.target.closest?.("input,textarea,select,summary,video,[contenteditable=true]")) return;
    if(e.key===" "&&e.target.closest?.("button,a")) return;
    const step={ArrowDown:1,ArrowRight:1,PageDown:1,ArrowUp:-1,ArrowLeft:-1,PageUp:-1," ":e.shiftKey?-1:1}[e.key];
    if(!step) return;
    const g=at(scrollY);
    if(g&&g.go(g.index+step)) e.preventDefault();
  });
}
