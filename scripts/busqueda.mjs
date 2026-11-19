import { site, instagram, reels, sabores, sedes, telefono, tiktok } from "../datos/carta.mjs";

export const product = id => "/sabores/"+id+"/";
export const locationPath = id => "/sedes/"+id+"/";
export const mapURL = sede => "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(sede.busqueda);
export const productImage = id => "/assets/productos/"+id+".webp";

const brandId = site+"/#marca";
const websiteId = site+"/#web";
const menuId = site+"/#carta";

function menuItem(p) {
  const url = site+product(p.id);
  return {
    "@type": "MenuItem", "@id": url+"#sabor", url, name: p.nombre,
    description: p.texto, image: site+productImage(p.id)
  };
}

function branch(s) {
  const url = site+locationPath(s.id);
  return {
    "@type": "FoodEstablishment", "@id": url+"#negocio", url, name: "Faber & Paty",
    parentOrganization: {"@id": brandId, "@type": "Organization", name: "Faber & Paty", url: site+"/"},
    description: s.descripcion, telephone: telefono,
    address: {
      "@type": "PostalAddress", streetAddress: s.calle, addressLocality: s.ciudad,
      addressRegion: "Quindío", addressCountry: "CO"
    },
    hasMap: mapURL(s), hasMenu: menuId, image: site+s.foto
  };
}

export function homeData() {
  return [
    {"@type": "WebSite", "@id": websiteId, name: "Faber & Paty", alternateName: "Cholados Faber y Paty", url: site+"/", inLanguage: "es-CO", publisher: {"@id": brandId}},
    {"@type": "WebPage", "@id": site+"/#pagina", url: site+"/", isPartOf: {"@id": websiteId}, about: {"@id": brandId},
      mainEntity: {"@id": menuId}, video: reels.map(r=>({
        "@type": "VideoObject", "@id": site+"/#reel-"+r.slug, name: r.titulo, description: r.texto,
        uploadDate: r.publicado, duration: "PT"+r.segundos+"S", inLanguage: "es-CO",
        thumbnailUrl: site+"/assets/reels/"+r.slug+".webp", contentUrl: site+"/assets/reels/"+r.slug+".mp4",
        sameAs: "https://www.instagram.com/reel/"+r.id+"/"
      }))},
    {"@type": "Organization", "@id": brandId, name: "Faber & Paty", alternateName: "Cholados Faber y Paty",
      url: site+"/", logo: site+"/assets/marca/logo.webp", telephone: telefono, sameAs: [instagram,tiktok],
      location: sedes.map(s=>({"@id": site+locationPath(s.id)+"#negocio"}))},
    ...sedes.map(branch),
    {"@type": "Menu", "@id": menuId, url: menuId, name: "La carta de Faber & Paty", inLanguage: "es-CO", hasMenuItem: sabores.map(menuItem)}
  ];
}

function detailData(entity, parentName, parentPath, pageName) {
  const url = entity.url;
  const crumbId = url+"#ruta";
  return [
    {"@type": "WebPage", "@id": url+"#pagina", url, name: pageName, inLanguage: "es-CO",
      isPartOf: {"@id": websiteId}, mainEntity: {"@id": entity["@id"]}, breadcrumb: {"@id": crumbId}},
    {"@type": "BreadcrumbList", "@id": crumbId, itemListElement: [
      {"@type":"ListItem", position:1, name:parentName, item:site+parentPath},
      {"@type":"ListItem", position:2, name:pageName, item:url}
    ]},
    entity
  ];
}

export const productData = p => detailData(menuItem(p), "La carta", "/#carta", p.nombre);
export const locationData = s => detailData(branch(s), "Dónde estamos", "/#sedes", s.ciudad);
