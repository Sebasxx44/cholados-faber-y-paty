import { initRecipes } from "./ingredientes.js";
document.documentElement.classList.add("js");
initRecipes();

const menu=document.querySelector(".nav-mobile");
document.addEventListener("click",e=>{
  if(menu.open&&(!menu.contains(e.target)||e.target.closest("a"))) menu.open=false;
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&menu.open){menu.open=false;menu.querySelector("summary").focus();}
});
for(const button of document.querySelectorAll("[data-filter]")){
  button.addEventListener("click",()=>{
    for(const choice of button.parentElement.children) choice.setAttribute("aria-pressed",String(choice===button));
    for(const dish of document.querySelectorAll(".menu-card")) dish.hidden=button.dataset.filter!=="Todos"&&dish.dataset.group!==button.dataset.filter;
  });
}

const clips=[...document.querySelectorAll(".reel video")];
if(clips.length){
  const visibility=new IntersectionObserver(entries=>{
    for(const entry of entries) if(!entry.isIntersecting) entry.target.pause();
  });
  for(const video of clips){
    const card=video.closest(".reel");
    const start=card.querySelector(".reel-start"),label=start.querySelector(".watch span");
    const notice=card.querySelector(".reel-notice");
    const title=document.getElementById(video.getAttribute("aria-labelledby")).textContent;
    function showStart(text){
      video.controls=false;video.tabIndex=-1;
      card.classList.remove("has-controls");
      label.textContent=text;start.setAttribute("aria-label",text+" · "+title);start.hidden=false;
    }
    function failed(){
      showStart("Reintentar");notice.hidden=false;
    }
    showStart("Ver video");
    start.addEventListener("click",event=>{
      notice.hidden=true;
      if(video.error) video.load();
      if(video.ended) video.currentTime=0;
      start.hidden=true;video.controls=true;video.tabIndex=0;card.classList.add("has-controls");
      // Safari grants audible playback to this gesture. Keep play() in the click handler.
      const playback=video.play();
      if(event.detail===0) video.focus({preventScroll:true});
      playback.catch(error=>{
        if(error.name==="AbortError"){
          if(video.paused&&!video.error) showStart("Continuar");
        }else failed();
      });
    });
    video.addEventListener("play",()=>{for(const other of clips) if(other!==video) other.pause()});
    video.addEventListener("ended",()=>showStart("Volver a ver"));
    video.addEventListener("error",failed);
    visibility.observe(video);
  }
  const pauseAll=()=>{for(const video of clips) video.pause()};
  document.addEventListener("visibilitychange",()=>{if(document.hidden) pauseAll()});
  window.addEventListener("pagehide",pauseAll);
}
