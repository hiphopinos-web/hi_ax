/* AX FESTIVAL · 최소 서비스워커
 * 목적: 안드로이드에서 "홈 화면에 추가" 네이티브 설치창을 띄울 수 있게 하는 것 · v4.76 웹 푸시 받기(아래).
 * ⚠ 캐시를 전혀 하지 않는다. 구버전이 폰에 고착되는 사고를 원천 차단하기 위함.
 *   (페이지 이동 요청만 네트워크로 그대로 통과시키고, 나머지는 브라우저 기본 동작에 맡긴다) */
var SW_VERSION = "axf-2026-09-30-push2";

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

/* ── v4.76 (260930) 웹 푸시 · 받기 · 누르기 · 구독 바뀜 · 캐시 없음 원칙은 그대로 ─────────────
 * 본문 = { t: 제목, b: 내용, go: 열 화면, tag: 사건키, j: 작업, u: 급함, q: 소리 없이 } · 서버가 RFC 8291 로 암호화해 보낸다(브라우저가 풀어 준다).
 * v4.78 q = 1 이면 silent(소리 · 진동 없이 · 안드로이드 크롬 · 아이폰은 OS 설정을 따른다) · 혼잡 해소 · 관람 시간 · 콘솔 「소리 없이」.
 * 앱 화면이 보이면(안드로이드 크롬 · PC) OS 알림 대신 앱에 넘긴다(앱 안 팝업 한 곳) · 아이폰 · 맥 사파리는 늘 OS 알림(보이지 않는 푸시를 되풀이하면 구독이 끊긴다).
 * 누르면 열린 앱 창에 화면 이동을 넘기고 앞으로 · 창이 없으면 index.html#go=화면&n=사건키 로 연다. */
function axfLenient() { var u = self.navigator.userAgent || ""; return /Chrome|Edg|SamsungBrowser|Firefox/.test(u) && !/iPhone|iPad|iPod/.test(u); }
self.addEventListener("push", function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { try { d = { t: event.data.text() }; } catch (x) { d = {}; } }
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    var vis = list.filter(function (c) { return c.visibilityState === "visible"; });
    list.forEach(function (c) { try { c.postMessage({ axf: "push", d: d }); } catch (e) {} });
    if (vis.length && axfLenient()) return;
    var o = { body: String(d.b || ""), icon: "icons/icon-192.png", badge: "icons/badge-72.png", data: { go: d.go || "home", tag: d.tag || "" } };
    if (d.tag) { o.tag = String(d.tag); o.renotify = !!d.u && !d.q; }
    if (d.q) o.silent = true;
    return self.registration.showNotification(String(d.t || "AX Festival"), o);
  }));
});
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var dt = event.notification.data || {}, go = /^[a-z_]{2,20}$/.test(dt.go || "") ? dt.go : "home", tag = String(dt.tag || "");
  var url = self.registration.scope + "index.html#go=" + go + (tag ? "&n=" + encodeURIComponent(tag) : "");
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.registration.scope) === 0 && "focus" in c) { try { c.postMessage({ axf: "go", go: go, tag: tag }); } catch (e) {} return c.focus(); }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
/* 푸시 서비스가 구독을 바꿨다 · 서비스워커에는 로그인 정보가 없어 새 구독만 만들어 둔다 · 서버 등록은 앱을 열 때(push_sub · 같은 기기 덮어쓰기) */
self.addEventListener("pushsubscriptionchange", function (event) {
  var o = event.oldSubscription && event.oldSubscription.options;
  if (!o || !o.applicationServerKey) return;
  event.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: o.applicationServerKey }).then(function () {}, function () {}));
});
