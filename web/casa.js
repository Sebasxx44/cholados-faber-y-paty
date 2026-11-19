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

const player=document.querySelector(".player");
if(player && typeof player.showModal==="function"){
  const box=player.querySelector(".player-box"),source=player.querySelector(".player-source");
  let trigger;
  for(const link of document.querySelectorAll("[data-reel]")){
    link.addEventListener("click",e=>{
      if(e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey) return;
      e.preventDefault();
      trigger=link;
      player.querySelector("h2").textContent=link.dataset.title;
      source.href=link.href;
      const frame=document.createElement("iframe");
      frame.title=link.dataset.title+" en Instagram";
      frame.src=link.href+"embed/";
      frame.allow="autoplay; encrypted-media; fullscreen; picture-in-picture";
      frame.allowFullscreen=true;
      frame.referrerPolicy="strict-origin-when-cross-origin";
      box.replaceChildren(frame);player.showModal();
      player.querySelector(".player-close").focus();
    });
  }
  player.querySelector(".player-close").addEventListener("click",()=>player.close());
  player.addEventListener("click",e=>{
    if(e.target!==player) return;
    const rect=player.getBoundingClientRect();
    if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom) player.close();
  });
  player.addEventListener("close",()=>{box.replaceChildren();trigger?.focus({preventScroll:true});});
}
