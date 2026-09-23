/* AX FESTIVAL · 최소 서비스워커
 * 목적은 오직 하나: 안드로이드에서 "홈 화면에 추가" 네이티브 설치창을 띄울 수 있게 하는 것.
 * ⚠ 캐시를 전혀 하지 않는다. 구버전이 폰에 고착되는 사고를 원천 차단하기 위함.
 *   (페이지 이동 요청만 네트워크로 그대로 통과시키고, 나머지는 브라우저 기본 동작에 맡긴다) */
var SW_VERSION = "axf-2026-08-23";

self.addEventListener("install", function () {
  self.skipWaiting();                 // 새 버전이 곧바로 적용되도록
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
      .catch(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.mode !== "navigate") return;   // 미디어·API는 손대지 않음
  event.respondWith(fetch(event.request));         // 항상 최신 · 캐시 없음
});
