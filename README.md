# Cholados Faber & Paty

Sitio para recorrer los seis productos de la carta de Faber & Paty, ver tres videos del negocio y encontrar sus dos puntos en Quindío. El puesto queda en el parque principal de Quimbaya y el local de Armenia en la Calle 20 #14-17.

[Ver el sitio](https://cholados-faber-y-paty.vercel.app/)

## Desarrollo

Se necesita Node.js 20 o posterior. `npm run build` genera la portada, seis fichas de producto, `robots.txt` y `sitemap.xml` en `dist/`. La carpeta se puede servir con cualquier servidor HTTP estático. Vercel ejecuta el mismo comando de compilación.

- `datos/carta.mjs` reúne los sabores, las sedes y los videos.
- `scripts/build.mjs` genera el HTML. `web/` contiene los estilos y la interacción.
- `assets/modelos/` contiene las mallas GLB de los seis vasos y sus complementos. Usan como textura los WebP de `assets/productos/`. El visor carga el modelo enfocado. El catálogo y las fichas también funcionan con imágenes estáticas.

## Dominio e indexación

La portada concentra el posicionamiento del negocio. Incluye los seis sabores, las direcciones del parque de Quimbaya y del local de Armenia y sus datos estructurados en el HTML. El sitemap contiene una sola URL. Las fichas se abren desde la carta y llevan la directiva `noindex, follow` en el HTML y en las cabeceras de Vercel. Las antiguas rutas de sedes redirigen permanentemente a la portada. Las URLs absolutas se calculan a partir de `SITE_URL` en `datos/carta.mjs`.

Cuando `choladosfaberypaty.online` esté registrado, agrégalo al proyecto de Vercel y configura los registros que indique el panel. Una vez que sirva el sitio por HTTPS, fija `SITE_URL=https://choladosfaberypaty.online` en el entorno de producción y vuelve a desplegar. Configura una redirección permanente del dominio anterior y, si se usa, de la variante con `www`, al mismo camino en el dominio principal. Comprueba la portada, el sitemap y las redirecciones antes de anunciar el cambio. [Guía de migraciones de Google](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=es)

La propiedad de dominio en Search Console se verifica mediante DNS. Envía `/sitemap.xml` desde esa propiedad e inspecciona la portada. Si también administras la propiedad anterior, solicita el cambio de dirección. Para verificar una propiedad de prefijo de URL mediante la etiqueta HTML, la compilación admite el valor público de `GOOGLE_SITE_VERIFICATION`. [Verificación en Search Console](https://support.google.com/webmasters/answer/9008080?hl=es)

## Material de referencia

Se reconstruyó la foto de apertura a partir de las fotografías de la misma inauguración. El logotipo y los nombres de los productos proceden de la carta de Faber & Paty. Las imágenes de estudio, las mallas y los ingredientes del escaparate son interpretaciones visuales del cartel. [Carrusel de la inauguración](https://www.instagram.com/p/Df0cDA-DEEu/)

Los tres reels se reproducen con sonido en su propia tarjeta al pulsar «Ver video». Los archivos MP4 están en `assets/reels` y se solicitan al iniciar la reproducción. [Preparación de las mieles](https://www.instagram.com/reel/DfViRQFNpjt/) · [Apertura de Armenia](https://www.instagram.com/reel/DfxR0fpBfVq/) · [Del puesto al nuevo local](https://www.instagram.com/reel/DfvSFLePrBE/)

«Nuestra historia» muestra las cuatro fotografías del carrusel de la inauguración en su orden original. Los tres retratos de la familia juegan con el brillo de la foto y el álbum cierra con una fotografía antigua del puesto. El mensaje de los 23 años proviene del pie de esa misma publicación. [Carrusel de la inauguración](https://www.instagram.com/p/Df0cDA-DEEu/)

Las fichas y la vitrina comparten los desgloses de la carta y los modelos de ingredientes. Las piezas se pueden explorar con el dedo, el ratón o las flechas del teclado. El enlace de WhatsApp de cada ficha prepara un mensaje con el nombre del producto.

El diseño se trabajó con [Unslop de Damir](https://github.com/heydamir/unslop), publicado bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Las tipografías locales Climate Crisis y DM Sans incluyen sus licencias SIL Open Font License en `assets/fuentes/`.
