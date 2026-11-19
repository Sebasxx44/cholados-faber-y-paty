import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site, instagram, messages, telefono, whatsapp, tiktok, sabores, sedes, reels, ingredientes } from "../datos/carta.mjs";
import { product, productImage, locationAnchor, scene, mapURL, homeData } from "./busqueda.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, "dist");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const theme = p => `--color:${p.color};--ink:${p.tinta};--paper:${p.papel}`;
const orderURL = p => whatsapp+"?text="+encodeURIComponent("Hola, Faber y Paty. Quisiera hacer un pedido de "+p.nombre.toLocaleLowerCase("es-CO")+".");
const telefonoVisible = telefono.replace(/^\+57(\d{3})(\d{3})(\d{4})$/, "+57 $1 $2 $3");
const reelURL = r => "https://www.instagram.com/reel/"+r.id+"/";
const openingPost = "https://www.instagram.com/p/Df0cDA-DEEu/";
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
const storefront = "/assets/marca/local.webp";
const storefrontSrcset = "/assets/marca/local-640.webp 640w, /assets/marca/local-sm.webp 960w, "+storefront+" 1920w";
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
  return `<footer class="footer"><div class="wrap footer-inner"><a class="brand" href="/" aria-label="Faber y Paty, inicio">${brand}</a><p>${sedes.map(s=>`<a href="${locationAnchor(s.id)}">${s.ciudad}</a>`).join(" y ")}, Quindío.</p>
    <nav aria-label="Contacto y redes"><a href="${whatsapp}" target="_blank" rel="noopener">WhatsApp ${telefonoVisible}</a><a href="${instagram}" target="_blank" rel="noopener">Instagram</a><a href="${tiktok}" target="_blank" rel="noopener">TikTok</a></nav></div></footer>`;
}
function layout({title,description,url="/",image="/assets/marca/local.webp",body,home=false,extra=""}) {
  const jsonLD = home ? JSON.stringify({"@context":"https://schema.org","@graph":homeData()}).replaceAll("<","\\u003c") : "";
  const verification = home && process.env.GOOGLE_SITE_VERIFICATION;
  return `<!doctype html><html lang="es-CO"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffc6da"><title>${esc(title)}</title><meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${site+url}"><meta name="robots" content="${home ? "index, follow, max-image-preview:large" : "noindex, follow"}">
  <meta property="og:type" content="website"><meta property="og:locale" content="es_CO"><meta property="og:site_name" content="Faber &amp; Paty">
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${site+image}"><meta property="og:url" content="${site+url}">
  <link rel="icon" href="/assets/marca/favicon-48.png" sizes="48x48" type="image/png">
  ${verification ? `<meta name="google-site-verification" content="${esc(verification)}">` : ""}
  ${home ? `<script type="application/ld+json">${jsonLD}</script>` : ""}
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
          <h1>Cholados <span>y granizados</span></h1><p class="lede">Raspados con miel, fruta en trozos y limonadas. Del parque de Quimbaya al centro de Armenia.</p>
          <a class="button primary tour-link" href="/#sabor-cholado">Recorrer los sabores</a></div>
        <figure class="postcard"><div class="paper-tape" aria-hidden="true"></div><picture><source media="(max-width:620px) and (min-height:671px) and (orientation:portrait)" srcset="/assets/marca/local-vertical-720.webp 720w, /assets/marca/local-vertical.webp 900w" sizes="min(92vw, 42svh)" width="900" height="976"><img src="${storefront}" srcset="${storefrontSrcset}" sizes="(max-width:700px) 90vw, min(50vw, 990px)" alt="El equipo de Faber y Paty frente al local de Armenia, junto al arco de globos de la inauguración." fetchpriority="high" decoding="async" width="1920" height="1080"></picture>
          <figcaption><span>El local de Armenia</span><span class="tiles" aria-hidden="true"></span></figcaption></figure>
      </div></div>
      <div class="product-stage" aria-hidden="true"><div class="prop-plane" aria-hidden="true">${props}</div><div class="rail">${bottles}</div></div>
      <div class="captions">${labels}</div>
      <button class="pause-motion enhanced" type="button" aria-label="Pausar movimiento" title="Pausar movimiento"><span class="when-playing">${icon("pause")}</span><span class="when-paused">${icon("play")}</span></button>
    </div></section>`;
}
const menuPhoto = p => `<img src="/assets/productos/${p.id}-sm.webp" alt="${esc(p.nombre)} de Faber y Paty" loading="lazy" decoding="async" width="${Math.round(p.anchoFoto*560/1512)}" height="560">`;
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
    <h3 id="reel-${r.slug}">${r.titulo}</h3><p>${r.texto}</p><a class="under reel-profile" href="${reelURL(r)}" target="_blank" rel="noopener">${icon("ig")} Ver en Instagram</a></div>
    <div class="reel">
      <video aria-labelledby="reel-${r.slug}" width="720" height="1280" controls playsinline preload="none" poster="/assets/reels/${r.slug}.webp" src="/assets/reels/${r.slug}.mp4"><a href="${reelURL(r)}">Ver ${r.titulo} en Instagram</a></video>
      <button class="reel-start" type="button" aria-label="Reproducir ${esc(r.titulo)}" hidden><span class="watch">${icon("play")}<span>Ver video</span></span></button>
      <p class="reel-notice" role="status" hidden>El video no pudo cargarse. <a href="${reelURL(r)}" target="_blank" rel="noopener">Abrir en Instagram</a></p>
    </div></div></article>`);
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
    ["retrato","Armenia","El día de la apertura","La familia se reunió frente al local de la Calle 20 para la foto de inauguración.","La familia frente al letrero de Faber & Paty junto al arco de globos. El texto pide subir el brillo de la foto."],
    ["brillo","El álbum de la familia","Un poco más de luz","En la segunda foto del carrusel se aclara la fachada. Los tres siguen en el mismo lugar.","El mismo retrato con más brillo y el texto «No tanto, bájale porfa»."],
    ["inicio","El álbum de la familia","Volver al inicio","La tercera foto se oscurece. La familia cierra el juego del brillo con una foto que lleva años guardada.","La foto de la inauguración con menos luz y un texto que pide volver al inicio."],
    ["apertura","Los primeros años","¡Esto apenas comienza!","Después de tanto esfuerzo, trabajo y constancia, hoy empezamos a ver los frutos de un sueño que nació hace mucho tiempo.","Una mano sostiene una fotografía antigua de tres personas en un puesto con un letrero de cholao."]
  ];
  const panels=entries.map(([id,context,title,copy,alt],i)=>{
    const picture=`<img src="/assets/historia/inauguracion-${i+1}.jpg" alt="${esc(alt)}" width="1080" height="608" loading="lazy" decoding="async">`;
    const narrative=id==="apertura"?`<blockquote cite="${openingPost}"><p>${copy}</p><p class="quote-lead">23 años de historia y muchos sueños por cumplir.</p><h3>${title}</h3></blockquote><a class="under" href="${openingPost}" target="_blank" rel="noopener">Ver el carrusel original</a>`:`<h3>${title}</h3><p>${copy}</p>`;
    return `<article class="journey-slide history-${id}"><div class="journey-inner wrap"><div class="journey-copy"><p class="journey-context">Nuestra historia <span>·</span> ${context}</p>${narrative}</div><figure class="history-photo">${picture}</figure></div></article>`;
  });
  return journey("proceso","Nuestra historia",panels,"sedes","Continuar a las sedes");
}
function locations() {
  const cards = sedes.map((s,i)=>{
    const inquiry = whatsapp+"?text="+encodeURIComponent("Hola, Faber y Paty. Quisiera consultar el horario y los sabores de hoy en "+s.ciudad+".");
    return `<article class="place-card place-${i}" id="sede-${s.id}"><div class="place-line">${icon("pin")}<span>${s.lugar}</span></div>
    <h3>${s.ciudad}</h3><p>${s.descripcion}</p><address>${s.direccion}</address><div class="sede-links">
    <a class="under" href="${esc(mapURL(s))}" target="_blank" rel="noopener">Cómo llegar</a>
    <a class="under" href="${esc(inquiry)}" target="_blank" rel="noopener">Consultar por WhatsApp</a></div></article>`;
  });
  return `<section class="places-section" id="sedes"><div class="wrap"><div class="section-head"><h2>Dónde estamos</h2></div><div class="places-grid">${cards.join("")}</div></div></section>`;
}
function recipePanel(p,instance) {
  const items=p.receta.map(key=>ingredientes[key]),first=items[0];
  const triggers=items.map((item,i)=>`<li><button type="button" data-piece="${item.pieza}" data-description="${esc(item.detalle)}" aria-pressed="${i===0}">
    <img src="/assets/ingredientes/${item.pieza}.webp" width="56" height="56" loading="lazy" alt=""><span>${item.nombre}</span></button></li>`).join("");
  return `<div class="recipe-panel" style="${theme(p)}" data-recipe-panel>
    <header class="recipe-intro"><p>Ingredientes</p><h2 id="receta-${instance}-${p.id}"><span class="sr-only">Ingredientes de </span>${p.nombre}</h2></header>
    <div class="recipe-display"><div class="ingredient-view" data-slug="ingredientes/${first.pieza}" tabindex="-1" role="group" aria-label="${esc(first.nombre)}">
    <span class="glass-form"><img src="/assets/ingredientes/${first.pieza}.webp" alt="${esc(first.nombre)}" width="360" height="360" decoding="async"></span></div><span class="rotate-hint" hidden>Arrastra para girar</span></div>
    <div class="recipe-details"><div class="recipe-info"><ul class="recipe-options" aria-label="Elegir un ingrediente">${triggers}</ul>
    <div class="recipe-note" aria-live="polite" aria-atomic="true"><h3>${first.nombre}</h3><p>${first.detalle}</p></div>
    <noscript><dl class="plain-ingredients">${items.map(it=>`<dt>${it.nombre}</dt><dd>${it.detalle}</dd>`).join("")}</dl></noscript></div>
    <a class="under recipe-order" href="${esc(orderURL(p))}" target="_blank" rel="noopener">${icon("wa")} Pedir este sabor</a></div></div>`;
}
function recipeDialog(){
  return `<dialog class="recipe-dialog" aria-label="Ingredientes del producto"><button type="button" class="recipe-close" aria-label="Cerrar ingredientes">${icon("close")}</button><div class="recipe-slot"></div></dialog>
    ${sabores.map(p=>`<template id="lista-${p.id}">${recipePanel(p,"dialogo")}</template>`).join("")}`;
}
function detail(p, index) {
  const next = sabores[(index+1)%sabores.length];
  const source = "/assets/productos/"+p.id;
  const widths = [Math.round(p.anchoFoto*560/1512), Math.round(p.anchoFoto*960/1512), p.anchoFoto];
  const srcset = [source+"-sm.webp "+widths[0]+"w", source+"-md.webp "+widths[1]+"w", productImage(p.id)+" "+widths[2]+"w"].join(", ");
  return layout({title:p.nombre+" | Faber & Paty",description:p.texto,url:product(p.id),image:productImage(p.id),extra:`style="${theme(p)}"`,body:`<main id="contenido" class="detail-main"><div class="wrap"><nav class="crumbs" aria-label="Ruta"><a href="/#carta">La carta</a><span aria-hidden="true">/</span><span aria-current="page">${p.nombre}</span></nav>
  <article class="product-page"><figure style="background-color:${p.color};background-image:url('/assets/fondos/${p.id}.webp')"><img src="${productImage(p.id)}" srcset="${srcset}" sizes="(max-width:620px) min(48vw, 27vh), min(40vw, 36vh, 440px)" alt="Vaso de ${esc(p.nombre)}" width="${p.anchoFoto}" height="1512" fetchpriority="high"></figure>
  <div class="detail-copy"><p class="place">${p.familia}</p><h1 class="${p.id==="maracumango"?"compact":""}">${p.nombre}</h1><p>${p.texto}</p><div class="detail-actions"><a class="button primary" href="${esc(orderURL(p))}" target="_blank" rel="noopener">${icon("wa")} Pedir por WhatsApp</a><a class="under" href="#ingredientes">Ver ingredientes</a></div><div class="detail-links"><a class="under" href="${messages}" target="_blank" rel="noopener">Consultar por Instagram</a><a class="under" href="${scene(p.id)}">Ver en el escaparate</a></div></div></article>
  <section id="ingredientes" class="detail-recipe" aria-labelledby="receta-ficha-${p.id}">${recipePanel(p,"ficha")}</section>
  <section class="pickup-section"><h2>Dónde pedir ${p.nombre.toLocaleLowerCase("es-CO")}</h2><ul>${sedes.map(s=>`<li><a class="under" href="${locationAnchor(s.id)}">${s.ciudad}</a><span>${s.calle}</span></li>`).join("")}</ul></section>
  <div class="more"><a class="under" href="/#carta">Volver a la carta</a><a class="under" href="${product(next.id)}">Siguiente sabor · ${next.nombre}</a></div></div></main>`});
}


await mkdir(out,{recursive:true});
// A local build may still contain the two location pages from the previous release.
for (const s of sedes) await rm(path.join(out,"sedes",s.id,"index.html"),{force:true});
await Promise.all(["web","assets"].map(dir=>cp(path.join(root,dir),dir==="assets"?path.join(out,dir):out,{recursive:true})));
const page = layout({title:"Cholados, raspados y limonadas en Quimbaya y Armenia | Faber & Paty",description:"Prueba el cholado con fruta, el raspado con miel y las dos limonadas de Faber & Paty. Encuéntranos en el parque de Quimbaya y en la Calle 20 de Armenia.",home:true,
  body:`<main id="contenido">${renderStage()}${menu()}${videos()}${history()}${locations()}</main>${recipeDialog()}`});
await writeFile(path.join(out,"index.html"),page);
for (const [i,p] of sabores.entries()) {
  const dest = path.join(out,product(p.id));
  await mkdir(dest,{recursive:true});
  await writeFile(path.join(dest,"index.html"),detail(p,i));
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${esc(site)}/</loc></url>\n</urlset>\n`;
await writeFile(path.join(out,"sitemap.xml"),sitemap);
await writeFile(path.join(out,"robots.txt"),"User-agent: *\nAllow: /\nSitemap: "+site+"/sitemap.xml\n");
console.log("Faber & Paty · portada indexable en "+site+"/ y "+sabores.length+" fichas para la carta.");
