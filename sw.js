// Nascente — service worker: a app funciona sem internet e atualiza-se sozinha quando há ligação.
const CACHE = 'nascente-v4';
const FICHEIROS = ['./', './index.html', './estilo.css', './motor.js', './app.js', './acoes.js', './cormorant.woff2', './cormorant-it.woff2', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('nascente-') && k !== CACHE).map(k => caches.delete(k))))  // só as da Nascente: as outras apps partilham o mesmo endereço
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // Só a própria app; os pedidos ao Gemini e ao GitHub passam diretos.
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'})
      .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
