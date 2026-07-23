// Notifica a IndexNow (Bing + Yandex) que las paginas del sitio cambiaron.
// Se corre solo en cada deploy desde GitHub Actions.
//
// Por que importa: ChatGPT Search consulta el indice de Bing. Una pagina que
// Bing no tiene indexada no puede aparecer en una respuesta de ChatGPT.
// IndexNow mete las URLs al indice en horas en vez de semanas.
//
// La llave vive en public/<KEY>.txt y debe seguir accesible en el dominio.

import { readFileSync, readdirSync } from 'node:fs';

const HOST = 'grupospazimonterrey.com';
const KEY = 'e3f7bece190d51d086f78ed7c91219f9';

// Lee el sitemap para no mantener la lista de URLs en dos lugares.
function urlsDesdeSitemap() {
  const xml = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

async function main() {
  const urlList = urlsDesdeSitemap();
  if (urlList.length === 0) {
    console.log('IndexNow: no se encontraron URLs en el sitemap.');
    return;
  }

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  };

  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  // 200 y 202 son exito. 422 suele ser llave no verificable todavia.
  console.log(`IndexNow: ${res.status} ${res.statusText} para ${urlList.length} URLs`);
  if (!res.ok) {
    console.log('Detalle:', await res.text().catch(() => ''));
  }
}

main().catch(err => {
  console.error('IndexNow fallo:', err.message);
});
