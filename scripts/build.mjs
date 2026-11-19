import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site, instagram, messages, tiktok, sabores, sedes, reels } from "../datos/carta.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, "dist");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const theme = p => `--color:${p.color};--ink:${p.tinta};--paper:${p.papel}`;
const product = s => "/sabores/"+s+"/";
const scene = s => "/#sabor-"+s;
const reelURL = r => "https://www.instagram.com/reel/"+r.id+"/";
const mapURL = s => "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(s.busqueda);
const symbols = {
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/>',
  ig:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.9" r="1" fill="currentColor" stroke="none"/>',
  play:'<path fill="currentColor" stroke="none" d="M7.5 4.5 20 12 7.5 19.5Z"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  menu:'<path d="M3 8h18M3 16h18"/>',
  pause:'<path d="M8.5 5v14M15.5 5v14" stroke-width="2.8"/>'
};
const icon = n => `<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${symbols[n]}</svg>`;
const brand = `<img class="brand-photo" src="/assets/marca/logo-nav.webp" width="336" height="193" alt="Faber &amp; Paty, cholados y granizados">`;
const links = '<a href="/#carta">La carta</a><a href="/#videos">Videos</a><a href="/#sedes">Dónde estamos</a>';
function header() {
  return `<a class="skip" href="#contenido">Saltar al contenido</a>
  <header class="masthead"><div class="nav-inner wrap">
    <a href="/" class="brand" aria-label="Faber y Paty, inicio">${brand}</a>
    <nav class="nav-wide" aria-label="Navegación principal">${links}</nav>
    <div class="nav-actions"><a class="order-top" href="${messages}" target="_blank" rel="noopener" aria-label="Hacer un pedido por Instagram">${icon("ig")}<span>Hacer un pedido</span></a>
    <details class="nav-mobile"><summary aria-label="Menú">${icon("menu")}<span>Menú</span></summary><nav aria-label="Navegación móvil">${links}<a href="${messages}" target="_blank" rel="noopener">Pedir por Instagram</a></nav></details></div>
  </div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="wrap footer-inner"><a class="brand" href="/" aria-label="Faber y Paty, inicio">${brand}</a><p>Quimbaya y Armenia, Quindío.</p>
    <nav aria-label="Redes sociales"><a href="${instagram}" target="_blank" rel="noopener">Instagram</a><a href="${tiktok}" target="_blank" rel="noopener">TikTok</a></nav></div></footer>`;
}
function layout({title,description,url="/",image="/assets/marca/local.webp",body,home=false,extra=""}) {
  return `<!doctype html><html lang="es-CO"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffc6da"><title>${esc(title)}</title><meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${site+url}"><meta property="og:type" content="website"><meta property="og:locale" content="es_CO">
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${site+image}"><meta property="og:url" content="${site+url}">
  <link rel="icon" href="/assets/marca/icono.webp" type="image/webp">
  <link rel="preload" href="/assets/fuentes/climate-crisis.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/estilo.css">${home ? '<link rel="stylesheet" href="/vitrina.css"><script type="module" src="/vitrina.js"></script>' : ""}
  <script type="module" src="/casa.js"></script></head>
  <body class="${home ? "portada en-vitrina" : "interior"}" ${extra}>${header()}${body}${footer()}</body></html>`;
}
function renderStage() {
  const backgrounds = sabores.map((p,i)=>`<div class="light-set" data-index="${i+1}" data-bg="/assets/fondos/${p.id}.webp" style="${theme(p)}"></div>`).join("");
  const bottles = sabores.map((p,i)=>`<a class="glass" href="${product(p.id)}" data-index="${i+1}" data-slug="${p.id}" aria-label="${esc(p.nombre)}" tabindex="-1" aria-hidden="true">
    <span class="glass-shadow"></span><span class="glass-form"><img data-small="/assets/productos/${p.id}-sm.webp" data-large="/assets/productos/${p.id}.webp" alt="" decoding="async"></span></a>`).join("");
  const props = sabores.map((p,i)=>`<div class="ingredients" data-index="${i+1}">${p.adornos.map((a,j)=>`<span class="ingredient ingredient-${j}"><img data-src="/assets/ingredientes/${a}.webp" alt="" decoding="async"></span>`).join("")}</div>`).join("");
  const labels = sabores.map((p,i)=>`<div class="product-caption${p.nombre.length>13?" long":""}" data-index="${i+1}" style="${theme(p)}" aria-hidden="true"><h2>${p.nombre}</h2><p>${p.corto}</p></div>`).join("");
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
  const tiles = reels.map(r=>{
    return `<a class="reel" href="${reelURL(r)}" data-reel="${r.id}" data-title="${esc(r.titulo)}" target="_blank" rel="noopener"><figure>
      <img src="/assets/reels/${r.slug}.webp" alt="" width="450" height="700" loading="lazy" decoding="async">
      <span class="reel-play">${icon("play")}</span><figcaption><span>${r.lugar}</span><h3>${r.titulo}</h3></figcaption></figure></a>`;
  });
  return `<section id="videos" class="reels-section"><div class="wrap"><div class="section-head"><h2>En video</h2>
    <a class="under" href="${instagram}" target="_blank" rel="noopener">${icon("ig")} @choladosfaberypaty</a></div><div class="reels-grid">${tiles.join("")}</div></div></section>`;
}
function locations() {
  return `<section class="places-section" id="sedes"><div class="wrap"><div class="section-head"><h2>Dónde estamos</h2></div><div class="places-grid">${sedes.map((s,i)=>`<article class="place-card place-${i}"><div class="place-line">${icon("pin")}<span>${s.lugar}</span></div><h3>${s.ciudad}</h3><p>${s.direccion}</p><a class="under" href="${esc(mapURL(s))}" target="_blank" rel="noopener">Cómo llegar</a></article>`).join("")}</div></div></section>`;
}
function player() {
  return `<dialog class="player" aria-labelledby="video-title"><div class="player-head"><h2 id="video-title">Video de Faber y Paty</h2><button type="button" class="player-close" aria-label="Cerrar video">${icon("close")}</button></div><div class="player-box"></div><a class="player-source under" href="${instagram}" target="_blank" rel="noopener">Ver en Instagram</a></dialog>`;
}
function detail(p, index) {
  const next = sabores[(index+1)%sabores.length];
  return layout({title:p.nombre+" · Faber & Paty",description:p.texto,url:product(p.id),image:"/assets/productos/"+p.id+".webp",extra:`style="${theme(p)}"`,body:`<main id="contenido" class="detail-main"><div class="wrap"><nav class="crumbs" aria-label="Ruta"><a href="/#carta">La carta</a><span aria-hidden="true">/</span><span>${p.nombre}</span></nav>
  <article class="product-page"><figure style="background-color:${p.color};background-image:url('/assets/fondos/${p.id}.webp')"><img src="/assets/productos/${p.id}.webp" alt="Vaso de ${esc(p.nombre)}" width="800" height="1300" fetchpriority="high"></figure>
  <div class="detail-copy"><p class="place">${p.familia}</p><h1 class="${p.id==="maracumango"?"compact":""}">${p.nombre}</h1><p>${p.texto}</p><a class="button primary" href="${messages}" target="_blank" rel="noopener">Consultar por Instagram</a><a class="under" href="${scene(p.id)}">Ver en el escaparate</a></div></article>
  <div class="more"><a class="under" href="/#carta">Volver a la carta</a><a class="under" href="${product(next.id)}">Siguiente sabor · ${next.nombre}</a></div></div></main>`});
}
await mkdir(out,{recursive:true});
await Promise.all(["web","assets"].map(dir=>cp(path.join(root,dir),dir==="assets"?path.join(out,dir):out,{recursive:true})));
const page = layout({title:"Faber & Paty · Cholados y granizados en Quindío",description:"Conoce los cholados, granizados y limonadas de Faber y Paty. Recorre los seis sabores y encuentra el puesto en Quimbaya y el local de Armenia.",home:true,
  body:`<main id="contenido">${renderStage()}${menu()}${videos()}${locations()}</main>${player()}`});
await writeFile(path.join(out,"index.html"),page);
for (const [i,p] of sabores.entries()) {
  const dest=path.join(out,"sabores",p.id); await mkdir(dest,{recursive:true});
  await writeFile(path.join(dest,"index.html"),detail(p,i));
}
await writeFile(path.join(out,"sitemap.xml"),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+["/",...sabores.map(p=>product(p.id))].map(p=>"<url><loc>"+site+p+"</loc></url>").join("")+"</urlset>");
await writeFile(path.join(out,"robots.txt"),"User-agent: *\nAllow: /\nSitemap: "+site+"/sitemap.xml\n");
console.log("Faber & Paty · portada y "+sabores.length+" fichas en dist/");
