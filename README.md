# Cholados Faber & Paty

Sitio para recorrer los seis productos de la carta de Faber & Paty, ver tres videos del negocio y encontrar sus dos puntos en Quindío. El puesto queda en el parque principal de Quimbaya y el local de Armenia en la Calle 20 #14-17.

[Ver el sitio](https://cholados-faber-y-paty.vercel.app/)

## Desarrollo

Se necesita Node.js 20 o posterior. `npm run build` genera la portada, seis fichas de producto y el mapa del sitio en `dist/`. La carpeta se puede servir con cualquier servidor HTTP estático. Vercel ejecuta el mismo comando de compilación.

- `datos/carta.mjs` reúne los sabores, las sedes y los videos.
- `scripts/build.mjs` genera el HTML. `web/` contiene los estilos y la interacción.
- `assets/modelos/` contiene las mallas GLB de los seis vasos y sus complementos. Usan como textura los WebP de `assets/productos/`. El visor carga el modelo enfocado. El catálogo y las fichas también funcionan con imágenes estáticas.

## Material de referencia

Se reconstruyó la foto de apertura a partir de las fotografías de la misma inauguración. El logotipo y los nombres de los productos proceden de la carta de Faber & Paty. Las imágenes de estudio, las mallas y los ingredientes del escaparate son interpretaciones visuales del cartel. [Carrusel de la inauguración](https://www.instagram.com/p/Df0cDA-DEEu/)

Los videos se reproducen desde las publicaciones de la cuenta cuando la persona los abre. [Preparación de las mieles](https://www.instagram.com/reel/DfViRQFNpjt/) · [Apertura de Armenia](https://www.instagram.com/reel/DfxR0fpBfVq/) · [Del puesto al nuevo local](https://www.instagram.com/reel/DfvSFLePrBE/)

El diseño se trabajó con [Unslop de Damir](https://github.com/heydamir/unslop), publicado bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Las tipografías locales Climate Crisis y DM Sans incluyen sus licencias SIL Open Font License en `assets/fuentes/`.
