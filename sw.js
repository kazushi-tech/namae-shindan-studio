// 全キャッシュを削除して自己解除するService Worker
// 前バージョンのSWが古いCSS/JSをキャッシュして更新をブロックしていたため、
// このスクリプトで既存SWを置換→キャッシュ全削除→自己解除する。
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.map(n => caches.delete(n))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then(clients => clients.forEach(c => c.navigate(c.url)))
  );
});
