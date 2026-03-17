const SW_VERSION = '1.0.0';
const CACHE_PREFIX = 'namae-shindan';
const PRECACHE_NAME = `${CACHE_PREFIX}-precache-v${SW_VERSION}`;
const RUNTIME_NAME = `${CACHE_PREFIX}-runtime-v${SW_VERSION}`;

const DATA_URLS = [
  '/data/kanji-strokes.json',
  '/data/fortune-meanings.json'
];

// === ヘルパー ===

/** URLを正規化（絶対パス化＋クエリパラメータ除去）してキャッシュキーを統一 */
function normalizeCacheUrl(requestUrl) {
  const url = new URL(requestUrl, self.location.origin);
  url.search = '';
  return url.href;
}

function isDataUrl(url) {
  const normalized = normalizeCacheUrl(url);
  return DATA_URLS.some(p => new URL(p, self.location.origin).href === normalized);
}

function isFontUrl(url) {
  return url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
}

function isStaticAsset(url) {
  const pathname = new URL(url, self.location.origin).pathname;
  return pathname.startsWith('/css/') || pathname.startsWith('/js/') || pathname.startsWith('/assets/');
}

// === Install ===

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then(async (cache) => {
      for (const url of DATA_URLS) {
        try {
          // ★ CRITICAL: cache:'no-store' でSafariのHTTPキャッシュを完全バイパス
          const response = await fetch(url, { cache: 'no-store' });
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn('[SW] Precache failed:', url, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// === Activate ===

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter(n => n.startsWith(CACHE_PREFIX) && n !== PRECACHE_NAME && n !== RUNTIME_NAME)
          .map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// === Fetch ===

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (isDataUrl(event.request.url)) {
    event.respondWith(networkFirstData(event.request));
  } else if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstNav(event.request));
  } else if (isFontUrl(event.request.url)) {
    event.respondWith(staleWhileRevalidate(event.request));
  } else if (isStaticAsset(event.request.url)) {
    event.respondWith(cacheFirst(event.request));
  }
});

// === データファイル: Network-first（★ cache:'no-store' でHTTPキャッシュ迂回） ===

async function networkFirstData(request) {
  const cacheKey = normalizeCacheUrl(request.url);
  try {
    // ★ これがPWA化の核心。Safariの壊れたHTTPキャッシュを完全に迂回する
    const res = await fetch(request.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cache = await caches.open(PRECACHE_NAME);
    await cache.put(cacheKey, res.clone());
    return res;
  } catch (err) {
    const cached = await caches.match(cacheKey);
    if (cached) return cached;
    // 両方失敗 → 既存のエラーハンドリング（loadError + バナー）に委ねる
    return new Response('{}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// === HTML: Network-first ===

async function networkFirstNav(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_NAME);
      cache.put(request.url, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || new Response('オフラインです。接続を確認してください。', {
      status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// === 静的アセット: Cache-first ===

async function cacheFirst(request) {
  const cacheKey = normalizeCacheUrl(request.url);
  const cached = await caches.match(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_NAME);
      cache.put(cacheKey, res.clone());
    }
    return res;
  } catch (err) {
    return new Response('', { status: 504 });
  }
}

// === フォント: Stale-while-revalidate ===

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then(res => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => null);

  return cached || await networkPromise || new Response('', { status: 504 });
}
