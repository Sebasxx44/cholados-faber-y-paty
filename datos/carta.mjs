const origin = new URL(globalThis.process?.env?.SITE_URL || "https://cholados-faber-y-paty.vercel.app");
if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password) {
  throw new Error("SITE_URL debe ser el origen HTTPS público, sin ruta, parámetros ni credenciales.");
}
export const site = origin.origin;
export const instagram = "https://www.instagram.com/choladosfaberypaty/";
export const messages = "https://ig.me/m/choladosfaberypaty";
export const telefono = "+573122075750";
export const whatsapp = "https://wa.me/"+telefono.slice(1);
export const tiktok = "https://www.tiktok.com/@choladospatyfaber";

export const ingredientes = {
  raspado: { pieza: "hielo", nombre: "Hielo raspado", detalle: "La base fría que recoge las mieles." },
  hielo: { pieza: "hielo", nombre: "Hielo", detalle: "Mantiene el vaso bien frío." },
  fruta: { pieza: "pina", nombre: "Fruta en trozos", detalle: "La fruta va en capas con el hielo." },
  miel: { pieza: "miel", nombre: "Mieles de la casa", detalle: "Bañan el hielo y le dan su color." },
  barquillo: { pieza: "barquillo", nombre: "Barquillos", detalle: "El toque crujiente que corona el vaso." },
  mango: { pieza: "mango", nombre: "Mango", detalle: "La parte dulce del maracumango." },
  maracuya: { pieza: "maracuya", nombre: "Maracuyá", detalle: "Su pulpa aporta el sabor ácido de la fruta." },
  limon: { pieza: "lima", nombre: "Limón", detalle: "La base cítrica de la limonada." },
  cobertura: { pieza: "cobertura", nombre: "Cobertura oscura", detalle: "La última capa, entre los barquillos." }
};

export const sabores = [
  {
    id: "cholado", nombre: "Cholado", familia: "Con barquillo",
    anchoFoto: 905,
    nota: "Fruta en capas y hielo raspado",
    texto: "Hielo raspado, fruta y mieles de colores. Los barquillos se sirven al final, para comerlos crujientes.",
    corto: "Fruta, hielo raspado y barquillos.",
    receta: ["raspado", "fruta", "miel", "barquillo"],
    color: "#ffa9d0", tinta: "#62142e", papel: "#ffe4ef",
    adornos: ["pina", "barquillo", "hielo", "miel"]
  },
  {
    id: "maracumango", nombre: "Maracumango", familia: "Con barquillo",
    anchoFoto: 762,
    nota: "Mango y maracuyá",
    texto: "Mango y maracuyá se mezclan en un vaso de hielo y fruta. Los tonos amarillos y rojos se encuentran debajo de los barquillos.",
    corto: "Mango, maracuyá y hielo.",
    receta: ["mango", "maracuya", "hielo", "barquillo"],
    color: "#8fd8f6", tinta: "#173b52", papel: "#d9f4fc",
    adornos: ["mango", "maracuya", "barquillo", "hielo"]
  },
  {
    id: "granizado", nombre: "Granizados", familia: "Con barquillo",
    anchoFoto: 949,
    nota: "Hielo fino con barquillos",
    texto: "Hielo de textura fina con una cobertura oscura y dos barquillos crujientes.",
    corto: "Hielo fino y barquillos crujientes.",
    receta: ["hielo", "cobertura", "barquillo"],
    color: "#f6e660", tinta: "#4a3019", papel: "#fff7b1",
    adornos: ["chocolate", "barquillo", "hielo", "chocolate"]
  },
  {
    id: "raspado", nombre: "Raspado", familia: "Con barquillo",
    anchoFoto: 895,
    nota: "Hielo raspado y miel",
    texto: "Hielo raspado con miel que va tiñendo el vaso de rojo. Arriba quedan el hielo y los barquillos.",
    corto: "Hielo raspado, miel y barquillo.",
    receta: ["raspado", "miel", "barquillo"],
    color: "#bda4f2", tinta: "#43264f", papel: "#e9dbff",
    adornos: ["miel", "hielo", "barquillo", "hielo"]
  },
  {
    id: "limonada-maracuya", nombre: "Limonada de maracuyá", familia: "Limonadas",
    anchoFoto: 933,
    nota: "Cítrica y tropical",
    texto: "Limón y maracuyá en una bebida fría, de color ámbar y sabor cítrico.",
    corto: "Limón, maracuyá y hielo.",
    receta: ["maracuya", "limon", "hielo"],
    color: "#85dfc7", tinta: "#174a43", papel: "#d3f5e7",
    adornos: ["maracuya", "lima", "hielo", "maracuya"]
  },
  {
    id: "limonada-especial", nombre: "Limonada especial", familia: "Limonadas",
    anchoFoto: 888,
    nota: "La limonada roja de la casa",
    texto: "La limonada roja de Faber & Paty se sirve bien fría. Pídela en el puesto del parque o en el local de Armenia.",
    corto: "La limonada roja de Faber & Paty.",
    receta: ["limon", "hielo"],
    color: "#ff998d", tinta: "#671f32", papel: "#ffdad5",
    adornos: ["lima", "hielo", "miel", "lima"]
  }
];

export const sedes = [
  {
    id: "quimbaya", ciudad: "Quimbaya", lugar: "El puesto del parque",
    calle: "Parque principal de Quimbaya", direccion: "Parque principal de Quimbaya, Quindío",
    busqueda: "Parque Principal de Quimbaya, Quindío, Colombia",
    descripcion: "En el puesto del parque servimos el cholado con fruta y el raspado con miel de la casa. También puedes pedir una limonada de maracuyá o la especial.",
    foto: "/assets/historia/inauguracion-4.jpg"
  },
  {
    id: "armenia", ciudad: "Armenia", lugar: "El local",
    calle: "Calle 20 #14-17", direccion: "Calle 20 #14-17, Armenia, Quindío",
    busqueda: "Calle 20 #14-17, Armenia, Quindío, Colombia",
    descripcion: "En el centro de Armenia encuentras los seis sabores de la carta. Si vienes por una limonada, elige entre la de maracuyá y la roja de la casa.",
    foto: "/assets/marca/local.webp"
  }
];

export const reels = [
  {id:"DfViRQFNpjt", slug:"mieles", titulo:"Entre mieles y hielo", lugar:"Quimbaya", segundos:34, publicado:"2026-11-04T17:31:57-05:00", texto:"Mira lo que pasa cuando las mieles de la casa tocan el hielo del cholado."},
  {id:"DfxR0fpBfVq", slug:"apertura", titulo:"Abrimos en Armenia", lugar:"Armenia", segundos:15, publicado:"2026-11-15T12:07:16-05:00", texto:"Faber y Paty te invitan a conocer el local de la Calle 20."},
  {id:"DfvSFLePrBE", slug:"nueva-sede", titulo:"Del puesto al nuevo local", lugar:"Quindío", segundos:59, publicado:"2026-11-14T17:30:06-05:00", texto:"Acompaña a la familia desde el puesto en Quimbaya hasta la puerta del nuevo local."}
];
