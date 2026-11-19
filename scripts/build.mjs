import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site, instagram, messages, whatsapp, tiktok, sabores, sedes, reels, ingredientes } from "../datos/carta.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, "dist");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const theme = p => `--color:${p.color};--ink:${p.tinta};--paper:${p.papel}`;
const product = s => "/sabores/"+s+"/";
const scene = s => "/#sabor-"+s;
const orderURL = p => whatsapp+"?text="+encodeURIComponent("Hola, Faber y Paty. Quisiera hacer un pedido de "+p.nombre.toLocaleLowerCase("es-CO")+".");
const reelURL = r => "https://www.instagram.com/reel/"+r.id+"/";
const mapURL = s => "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(s.busqueda);
const symbols = {
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/>',
  ig:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.9" r="1" fill="currentColor" stroke="none"/>',
  wa:'<path d="M20.8 11.8a8.8 8.8 0 0 1-13.1 7.7l-4.5 1.1 1.2-4.3a8.8 8.8 0 1 1 16.4-4.5Z"/><path d="M8.5 7.2c-.6 0-1.3.8-1.2 1.8.3 2.8 4.3 6.8 7.4 7 .9 0 1.7-.7 1.8-1.6l-2.3-1.2-.9 1c-1.3-.5-2.7-1.8-3.4-3.2l.9-.9-1.2-2.8Z" fill="currentColor" stroke="none"/>',
  play:'<path fill="currentColor" stroke="none" d="M7.5 4.5 20 12 7.5 19.5Z"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  menu:'<path d="M3 8h18M3 16h18"/>',
  pause:'<path d="M8.5 5v14M15.5 5v14" stroke-width="2.8"/>'
};
const icon = n => `<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${symbols[n]}</svg>`;
const brand = `<img class="brand-photo" src="/assets/marca/logo-nav.webp" width="336" height="193" alt="Faber &amp; Paty, cholados y granizados">`;
const links = '<a href="/#carta">La carta</a><a href="/#videos">Videos</a><a href="/#proceso">Nuestra historia</a><a href="/#sedes">Dónde estamos</a>';
function header() {
  return `<a class="skip" href="#contenido">Saltar al contenido</a>
  <header class="masthead"><div class="nav-inner wrap">
    <a href="/" class="brand" aria-label="Faber y Paty, inicio">${brand}</a>
    <nav class="nav-wide" aria-label="Navegación principal">${links}</nav>
    <div class="nav-actions"><a class="ig-contact" href="${messages}" target="_blank" rel="noopener" aria-label="Consultar por Instagram" title="Consultar por Instagram">${icon("ig")}</a><a class="order-top" href="${whatsapp}" target="_blank" rel="noopener" aria-label="Pedir por WhatsApp" title="Pedir por WhatsApp">${icon("wa")}<span>Pedir por WhatsApp</span></a>
    <details class="nav-mobile"><summary aria-label="Menú">${icon("menu")}<span>Menú</span></summary><nav aria-label="Navegación móvil">${links}<a href="${whatsapp}" target="_blank" rel="noopener">Pedir por WhatsApp</a><a href="${messages}" target="_blank" rel="noopener">Consultar por Instagram</a></nav></details></div>
  </div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="wrap footer-inner"><a class="brand" href="/" aria-label="Faber y Paty, inicio">${brand}</a><p>Quimbaya y Armenia, Quindío.</p>
    <nav aria-label="Contacto y redes"><a href="${whatsapp}" target="_blank" rel="noopener">WhatsApp</a><a href="${instagram}" target="_blank" rel="noopener">Instagram</a><a href="${tiktok}" target="_blank" rel="noopener">TikTok</a></nav></div></footer>`;
}
function layout({title,description,url="/",image="/assets/marca/local.webp",body,home=false,extra=""}) {
  return `<!doctype html><html lang="es-CO"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffc6da"><title>${esc(title)}</title><meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${site+url}"><meta property="og:type" content="website"><meta property="og:locale" content="es_CO">
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${site+image}"><meta property="og:url" content="${site+url}">
  <link rel="icon" href="/assets/marca/icono.webp" type="image/webp">
  <link rel="preload" href="/assets/fuentes/climate-crisis.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/estilo.css"><link rel="stylesheet" href="/ingredientes.css">${home ? '<link rel="stylesheet" href="/vitrina.css"><link rel="stylesheet" href="/recorridos.css"><script type="module" src="/vitrina.js"></script><script type="module" src="/recorridos.js"></script>' : ""}
  <script type="module" src="/casa.js"></script></head>
  <body class="${home ? "portada en-vitrina" : "interior"}" ${extra}>${header()}${body}${footer()}</body></html>`;
}
function renderStage() {
  const backgrounds = sabores.map((p,i)=>`<div class="light-set" data-index="${i+1}" data-bg="/assets/fondos/${p.id}.webp" style="${theme(p)}"></div>`).join("");
  const bottles = sabores.map((p,i)=>`<a class="glass" href="${product(p.id)}" data-index="${i+1}" data-slug="${p.id}" aria-label="${esc(p.nombre)}" tabindex="-1" aria-hidden="true">
    <span class="glass-shadow"></span><span class="glass-form"><img data-small="/assets/productos/${p.id}-sm.webp" data-large="/assets/productos/${p.id}.webp" alt="" decoding="async"></span></a>`).join("");
  const props = sabores.map((p,i)=>`<div class="ingredients" data-index="${i+1}">${p.adornos.map((a,j)=>`<span class="ingredient ingredient-${j}"><img data-src="/assets/ingredientes/${a}.webp" alt="" decoding="async"></span>`).join("")}</div>`).join("");
  const labels = sabores.map((p,i)=>`<div class="product-caption${p.nombre.length>13?" long":""}" data-index="${i+1}" style="${theme(p)}" aria-hidden="true" inert><h2>${p.nombre}</h2><p>${p.corto}</p><a class="recipe-trigger" data-recipe="${p.id}" href="${product(p.id)}#ingredientes">Ver ingredientes</a></div>`).join("");
  return `<section class="runway" aria-label="El local y los seis sabores" id="inicio" style="--steps:${sabores.length}">
    <div class="board" role="region" aria-roledescription="carrusel" aria-label="Escaparate de Faber y Paty">
      <div class="stage-light" aria-hidden="true"><div class="opening-paper"></div>${backgrounds}</div>
      <div class="opening"><div class="opening-inner wrap">
        <div class="opening-copy"><p class="place">${icon("pin")}Quindío, Colombia</p>
          <h1>Cholados<span>y granizados</span></h1><p class="lede">Hielo raspado, fruta y mieles de la casa. Del parque de Quimbaya al centro de Armenia.</p>
          <a class="button primary tour-link" href="/#sabor-cholado">Recorrer los sabores</a></div>
        <figure class="postcard"><div class="paper-tape" aria-hidden="true"></div><picture><source media="(max-width:620px) and (min-height:671px) and (orientation:portrait)" srcset="/assets/marca/local-vertical.webp"><source media="(max-width: 700px)" srcset="/assets/marca/local-sm.webp"><img src="/assets/marca/local.webp" alt="El equipo de Faber y Paty frente al local de Armenia, junto al arco de globos de la inauguración." fetchpriority="high" decoding="async" width="1920" height="1080"></picture>
          <figcaption><span>El local de Armenia</span><span class="tiles" aria-hidden="true"></span></figcaption></figure>
      </div></div>
      <div class="product-stage" aria-hidden="true"><div class="prop-plane" aria-hidden="true">${props}</div><div class="rail">${bottles}</div></div>
      <div class="captions">${labels}</div>
      <button class="pause-motion enhanced" type="button" aria-label="Pausar movimiento" title="Pausar movimiento"><span class="when-playing">${icon("pause")}</span><span class="when-paused">${icon("play")}</span></button>
    </div></section>`;
}
const menuPhoto = p => `<img src="/assets/productos/${p.id}-sm.webp" alt="${esc(p.nombre)} de Faber y Paty" loading="lazy" decoding="async" width="450" height="620">`;
function menuCard(p) {
  return `<article class="menu-card" id="sabor-${p.id}" data-group="${p.familia}" style="${theme(p)}"><a href="${product(p.id)}">
    <figure class="menu-photo">${menuPhoto(p)}</figure><div class="card-copy"><h3>${p.nombre}</h3><p>${p.nota}</p></div></a></article>`;
}
function menu() {
  return `<section class="menu-section" id="carta"><div class="wrap"><div class="section-head"><h2>La carta</h2>
    <div class="filters enhanced" aria-label="Filtrar sabores">${["Todos","Con barquillo","Limonadas"].map((x,i)=>`<button type="button" aria-pressed="${!i}" data-filter="${x}">${x}</button>`).join("")}</div></div>
    <div class="menu-grid">${sabores.map(menuCard).join("")}</div></div></section>`;
}
function videos() {
  const panels=reels.map(r=>`<article class="journey-slide video-${r.slug}"><div class="journey-inner wrap">
    <div class="journey-copy"><p class="journey-context">En video <span>·</span> ${r.lugar} <span>·</span> ${r.segundos} s</p>
    <h3>${r.titulo}</h3><p>${r.texto}</p><a class="under reel-profile" href="${instagram}" target="_blank" rel="noopener">${icon("ig")} @choladosfaberypaty</a></div>
    <a class="reel" href="${reelURL(r)}" data-reel="${r.id}" data-title="${esc(r.titulo)}" target="_blank" rel="noopener" aria-label="Reproducir ${esc(r.titulo)}">
    <img src="/assets/reels/${r.slug}.webp" alt="" width="680" height="1209" loading="lazy" decoding="async"><span class="watch">${icon("play")} Ver video</span></a></div></article>`);
  return journey("videos","Videos de Instagram",panels,"proceso","Continuar a nuestra historia");
}

function journey(id,title,panels,next,skip){
  return `<section class="journey" id="${id}" aria-labelledby="titulo-${id}" style="--tramos:${panels.length-1}">
    <h2 class="sr-only" id="titulo-${id}">${title}</h2><a class="journey-skip" href="#${next}">${skip}</a><div class="journey-window">
    <div class="journey-track">${panels.join("")}</div><div class="journey-nav enhanced" aria-label="Controles de ${title}">
    <button type="button" data-shift="-1" aria-label="Anterior en ${title}">Anterior</button><button type="button" data-shift="1" aria-label="Siguiente en ${title}">Siguiente</button></div>
    </div></section>`;
}

function history(){
  const entries=[
    ["puesto","Quimbaya","El puesto del parque","En el parque de Quimbaya, la familia sirve cholados bajo el toldo rojo.","/assets/historia/puesto.webp","El puesto de Faber y Paty bajo su toldo rojo en Quimbaya."],
    ["preparacion","La preparación","Hielo y mieles","Primero va el hielo raspado. Después llegan las mieles de colores que se ven caer sobre el vaso.","/assets/historia/preparacion.webp","Una persona del equipo sirve miel roja sobre el hielo en el puesto."],
    ["montaje","El nuevo local","Antes de abrir","En Armenia, Faber pinta a mano una pieza para el local. Detrás ya asoma el rosa de las paredes.","/assets/historia/montaje.webp","Faber pintando una pieza del nuevo local de Armenia."],
    ["apertura","La familia, el día de la apertura","¡Esto apenas comienza!","Después de tanto esfuerzo, trabajo y constancia, hoy empezamos a ver los frutos de un sueño que nació hace mucho tiempo.","/assets/marca/local.webp","La familia frente a su nuevo local de Armenia el día de la inauguración."]
  ];
  const panels=entries.map(([id,context,title,copy,img,alt])=>{
    const opening=id==="apertura";
    const picture=opening?`<picture><source media="(max-width:680px) and (orientation:portrait)" srcset="/assets/marca/local-vertical.webp"><img src="${img}" alt="${alt}" width="1920" height="1080" loading="lazy" decoding="async"></picture>`:`<img src="${img}" alt="${alt}" width="720" height="1280" loading="lazy" decoding="async">`;
    const narrative=opening?`<blockquote cite="https://www.instagram.com/p/Df0cDA-DEEu/"><p>${copy}</p><p class="quote-lead">23 años de historia y muchos sueños por cumplir.</p><h3>${title}</h3></blockquote><a class="under" href="https://www.instagram.com/p/Df0cDA-DEEu/" target="_blank" rel="noopener">Faber &amp; Paty en Instagram</a>`:`<h3>${title}</h3><p>${copy}</p>`;
    return `<article class="journey-slide history-${id}"><div class="journey-inner wrap"><div class="journey-copy"><p class="journey-context">Nuestra historia <span>·</span> ${context}</p>${narrative}</div><figure class="history-photo">${picture}</figure></div></article>`;
  });
  return journey("proceso","Nuestra historia",panels,"sedes","Continuar a las sedes");
}
function locations() {
  return `<section class="places-section" id="sedes"><div class="wrap"><div class="section-head"><h2>Dónde estamos</h2></div><div class="places-grid">${sedes.map((s,i)=>`<article class="place-card place-${i}"><div class="place-line">${icon("pin")}<span>${s.lugar}</span></div><h3>${s.ciudad}</h3><p>${s.direccion}</p><a class="under" href="${esc(mapURL(s))}" target="_blank" rel="noopener">Cómo llegar</a></article>`).join("")}</div></div></section>`;
}
function player() {
  return `<dialog class="player" aria-labelledby="video-title"><div class="player-head"><h2 id="video-title">Video de Faber y Paty</h2><button type="button" class="player-close" aria-label="Cerrar video">${icon("close")}</button></div><div class="player-box"></div><a class="player-source under" href="${instagram}" target="_blank" rel="noopener">Ver en Instagram</a></dialog>`;
}
function recipePanel(p,instance) {
  const items=p.receta.map(key=>ingredientes[key]),first=items[0];
  const triggers=items.map((item,i)=>`<li><button type="button" data-piece="${item.pieza}" data-description="${esc(item.detalle)}" aria-pressed="${i===0}">
    <img src="/assets/ingredientes/${item.pieza}.webp" width="56" height="56" loading="lazy" alt=""><span>${item.nombre}</span></button></li>`).join("");
  return `<div class="recipe-panel" style="${theme(p)}" data-recipe-panel>
    <header class="recipe-intro"><p>Ingredientes</p><h2 id="receta-${instance}-${p.id}"><span class="sr-only">Ingredientes de </span>${p.nombre}</h2></header>
    <div class="recipe-display"><div class="ingredient-view" data-slug="ingredientes/${first.pieza}" tabindex="-1" role="group" aria-label="${esc(first.nombre)}">
    <span class="glass-form"><img src="/assets/ingredientes/${first.pieza}.webp" alt="${esc(first.nombre)}" width="360" height="360" decoding="async"></span></div><span class="rotate-hint" hidden>Arrastra para girar</span></div>
    <div class="recipe-details"><ul class="recipe-options" aria-label="Elegir un ingrediente">${triggers}</ul>
    <div class="recipe-note" aria-live="polite" aria-atomic="true"><h3>${first.nombre}</h3><p>${first.detalle}</p></div>
    <noscript><dl class="plain-ingredients">${items.map(it=>`<dt>${it.nombre}</dt><dd>${it.detalle}</dd>`).join("")}</dl></noscript>
    <a class="under recipe-order" href="${esc(orderURL(p))}" target="_blank" rel="noopener">${icon("wa")} Pedir este sabor</a></div></div>`;
}
function recipeDialog(){
  return `<dialog class="recipe-dialog" aria-label="Ingredientes del producto"><button type="button" class="recipe-close" aria-label="Cerrar ingredientes">${icon("close")}</button><div class="recipe-slot"></div></dialog>
    ${sabores.map(p=>`<template id="lista-${p.id}">${recipePanel(p,"dialogo")}</template>`).join("")}`;
}
function detail(p, index) {
  const next = sabores[(index+1)%sabores.length];
  return layout({title:p.nombre+" · Faber & Paty",description:p.texto,url:product(p.id),image:"/assets/productos/"+p.id+".webp",extra:`style="${theme(p)}"`,body:`<main id="contenido" class="detail-main"><div class="wrap"><nav class="crumbs" aria-label="Ruta"><a href="/#carta">La carta</a><span aria-hidden="true">/</span><span>${p.nombre}</span></nav>
  <article class="product-page"><figure style="background-color:${p.color};background-image:url('/assets/fondos/${p.id}.webp')"><img src="/assets/productos/${p.id}.webp" alt="Vaso de ${esc(p.nombre)}" width="800" height="1300" fetchpriority="high"></figure>
  <div class="detail-copy"><p class="place">${p.familia}</p><h1 class="${p.id==="maracumango"?"compact":""}">${p.nombre}</h1><p>${p.texto}</p><div class="detail-actions"><a class="button primary" href="${esc(orderURL(p))}" target="_blank" rel="noopener">${icon("wa")} Pedir por WhatsApp</a><a class="under" href="#ingredientes">Ver ingredientes</a></div><div class="detail-links"><a class="under" href="${messages}" target="_blank" rel="noopener">Consultar por Instagram</a><a class="under" href="${scene(p.id)}">Ver en el escaparate</a></div></div></article>
  <section id="ingredientes" class="detail-recipe" aria-labelledby="receta-ficha-${p.id}">${recipePanel(p,"ficha")}</section>
  <div class="more"><a class="under" href="/#carta">Volver a la carta</a><a class="under" href="${product(next.id)}">Siguiente sabor · ${next.nombre}</a></div></div></main>`});
}
await mkdir(out,{recursive:true});
await Promise.all(["web","assets"].map(dir=>cp(path.join(root,dir),dir==="assets"?path.join(out,dir):out,{recursive:true})));
const page = layout({title:"Faber & Paty · Cholados y granizados en Quindío",description:"Conoce los cholados, granizados y limonadas de Faber y Paty. Recorre los seis sabores y encuentra el puesto en Quimbaya y el local de Armenia.",home:true,
  body:`<main id="contenido">${renderStage()}${menu()}${videos()}${history()}${locations()}</main>${player()}${recipeDialog()}`});
await writeFile(path.join(out,"index.html"),page);
for (const [i,p] of sabores.entries()) {
  const dest=path.join(out,"sabores",p.id); await mkdir(dest,{recursive:true});
  await writeFile(path.join(dest,"index.html"),detail(p,i));
}
await writeFile(path.join(out,"sitemap.xml"),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+["/",...sabores.map(p=>product(p.id))].map(p=>"<url><loc>"+site+p+"</loc></url>").join("")+"</urlset>");
await writeFile(path.join(out,"robots.txt"),"User-agent: *\nAllow: /\nSitemap: "+site+"/sitemap.xml\n");
console.log("Faber & Paty · portada y "+sabores.length+" fichas en dist/");
