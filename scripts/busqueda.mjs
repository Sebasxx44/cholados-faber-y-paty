import { site, instagram, reels, sabores, sedes, telefono, tiktok } from "../datos/carta.mjs";

export const product = id => "/sabores/"+id+"/";
export const locationAnchor = id => "/#sede-"+id;
export const scene = id => "/#sabor-"+id;
export const mapURL = sede => "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(sede.busqueda);
export const productImage = id => "/assets/productos/"+id+".webp";

const brandId = site+"/#marca";
const websiteId = site+"/#web";
const menuId = site+"/#carta";

function menuItem(p) {
  const url = site+scene(p.id);
  return {
    "@type": "MenuItem", "@id": url, url, name: p.nombre,
    description: p.texto, image: site+productImage(p.id)
  };
}

function branch(s) {
  return {
    "@type": "FoodEstablishment", "@id": site+locationAnchor(s.id), url: site+"/", name: "Faber & Paty",
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
      location: sedes.map(s=>({"@id": site+locationAnchor(s.id)}))},
    ...sedes.map(branch),
    {"@type": "Menu", "@id": menuId, url: menuId, name: "La carta de Faber & Paty", inLanguage: "es-CO", hasMenuItem: sabores.map(menuItem)}
  ];
}
