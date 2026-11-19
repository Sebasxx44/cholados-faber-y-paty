let viewerPromise;
function viewer() {
  viewerPromise ??= import("./modelo.js").then(m=>m.makeViewer()).catch(()=>null);
  return viewerPromise;
}

function activatePanel(panel) {
  const display=panel.querySelector(".ingredient-view"),photo=display.querySelector("img");
  const hint=panel.querySelector(".rotate-hint"),note=panel.querySelector(".recipe-note");
  const buttons=[...panel.querySelectorAll("[data-piece]")];
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const events=new AbortController();
  let revision=0,mesh=null,frame=0,yaw=0,pitch=0,drag=null;

  function cancelEntrance(){cancelAnimationFrame(frame);frame=0}
  function rotate(x,y){
    cancelEntrance();yaw=clamp(x,-.38,.38);pitch=clamp(y,-.20,.20);mesh?.paint(yaw,pitch);
  }
  async function choose(button){
    const serial=++revision,title=button.querySelector("span").textContent;
    cancelEntrance();mesh?.select(null);
    for(const choice of buttons) choice.setAttribute("aria-pressed",String(choice===button));
    display.dataset.slug="ingredientes/"+button.dataset.piece;
    photo.src="/assets/ingredientes/"+button.dataset.piece+".webp";
    photo.alt=title;
    note.querySelector("h3").textContent=title;
    note.querySelector("p").textContent=button.dataset.description;
    display.setAttribute("aria-label",title);display.tabIndex=-1;
    yaw=pitch=0;drag=null;hint.hidden=true;
    const renderer=await viewer();
    if(serial!==revision||!renderer) return;
    mesh=renderer;mesh.paint(0,0);
    await mesh.select(display);
    if(serial!==revision||!display.querySelector(".has-model canvas")) return;
    display.tabIndex=0;display.setAttribute("aria-label",title+" en 3D. Usa las flechas para girar.");
    hint.hidden=false;
    if(reduced.matches) return;
    const start=performance.now();
    function entrance(now){
      const t=clamp((now-start)/800,0,1);
      mesh.paint(Math.sin(t*Math.PI)*.19,Math.sin(t*Math.PI)*-.055);
      frame=t<1?requestAnimationFrame(entrance):0;
    }
    frame=requestAnimationFrame(entrance);
  }
  panel.querySelector(".recipe-options").addEventListener("click",e=>{
    const choice=e.target.closest("[data-piece]");
    if(choice&&choice.getAttribute("aria-pressed")!=="true") choose(choice);
  },{signal:events.signal});
  display.addEventListener("pointerdown",e=>{
    if(!e.isPrimary||e.button!==0||!mesh) return;
    cancelEntrance();drag={id:e.pointerId,x:e.clientX,y:e.clientY,startYaw:yaw,startPitch:pitch};
    display.setPointerCapture(e.pointerId);display.classList.add("dragging");
  },{signal:events.signal});
  display.addEventListener("pointermove",e=>{
    if(drag?.id!==e.pointerId) return;
    rotate(drag.startYaw+(e.clientX-drag.x)*.006,drag.startPitch-(e.clientY-drag.y)*.0045);
  },{signal:events.signal});
  display.addEventListener("lostpointercapture",()=>{drag=null;display.classList.remove("dragging")},{signal:events.signal});
  display.addEventListener("keydown",e=>{
    if(e.altKey||e.ctrlKey||e.metaKey) return;
    const direction={ArrowLeft:[-.10,0],ArrowRight:[.10,0],ArrowUp:[0,-.07],ArrowDown:[0,.07],Home:[-yaw,-pitch]}[e.key];
    if(!direction) return;
    e.preventDefault();rotate(yaw+direction[0],pitch+direction[1]);
  },{signal:events.signal});
  const size=new ResizeObserver(()=>mesh?.resize());size.observe(display);
  choose(buttons[0]);
  return ()=>{revision++;cancelEntrance();events.abort();size.disconnect();mesh?.select(null)};
}

export function initRecipes(){
  const inline=document.querySelector(".detail-recipe [data-recipe-panel]");
  if(inline){
    if("IntersectionObserver" in window){
      const lazy=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){lazy.disconnect();activatePanel(inline)}},{rootMargin:"120px"});
      lazy.observe(inline);
    }else activatePanel(inline);
  }
  const dialog=document.querySelector(".recipe-dialog");
  if(!dialog||typeof dialog.showModal!=="function") return;
  const slot=dialog.querySelector(".recipe-slot"),close=dialog.querySelector(".recipe-close");
  let trigger,release;
  document.addEventListener("click",e=>{
    const link=e.target.closest("[data-recipe]");
    if(!link||e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey) return;
    const template=document.getElementById("lista-"+link.dataset.recipe);
    if(!template) return;
    e.preventDefault();trigger=link;
    slot.replaceChildren(template.content.cloneNode(true));
    const panel=slot.firstElementChild;
    dialog.setAttribute("aria-labelledby",panel.querySelector("h2").id);
    dialog.style.setProperty("--ink",panel.style.getPropertyValue("--ink"));
    dialog.style.setProperty("--paper",panel.style.getPropertyValue("--paper"));
    dialog.showModal();close.focus({preventScroll:true});release=activatePanel(panel);
  });
  close.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{
    if(e.target!==dialog) return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close();
  });
  dialog.addEventListener("close",()=>{
    release?.();release=null;slot.replaceChildren();trigger?.focus({preventScroll:true});
  });
}
