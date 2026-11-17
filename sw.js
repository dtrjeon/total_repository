// 저장소 허브 서비스워커 - 앱 화면(셸)만 캐시하고, GitHub API와 다른 페이지 요청은 건드리지 않습니다.
const CACHE = 'repo-hub-v2';
const SHELL = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg'];
const SHELL_URLS = SHELL.map(p => new URL(p, self.location).href);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('repo-hub-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  url.search = ''; url.hash = '';
  if (!SHELL_URLS.includes(url.href)) return; // 앱 셸이 아니면 브라우저 기본 동작
  // 네트워크 우선, 오프라인이면 캐시 사용
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(url.href, copy)); }
      return res;
    }).catch(() => caches.match(url.href).then(r => r || caches.match(SHELL_URLS[0])))
  );
});
