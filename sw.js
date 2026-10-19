/* AX FESTIVAL · 서비스워커
 * 목적: 안드로이드 "홈 화면에 추가" 설치창 · v4.76 웹 푸시 받기(아래) · 261019 앱 첫 문서 캐시(사용자 결정 「hiax.app 유지 + 캐시」).
 * 앱 첫 문서만 캐시한다 = 이 서비스워커 범위의 앱 주소(hiax.app 은 / · /index.html, github.io 는 /hi_ax/ · /hi_ax/index.html · 쿼리 · 해시 무시 · 한 항목).
 *   · 네트워크 우선 · 본문을 다 받을 때까지 3초와 겨룬다(헤더만 빨리 오고 본문이 느린 경우가 실제 문제 · 국내 접속이 LAX 거점으로 가는 회선).
 *   · 3초 안에 200 · html 본문이 다 오면 그 판을 보여 주고 캐시를 바꾼다.
 *   · 3초가 지나면 캐시 판을 보여 주고, 네트워크는 끝까지 받아 캐시만 바꾼다(다음 열기 = 새 판 · 옛 판 고착 방지).
 *   · 캐시가 없으면(첫 열기) · 직접 새로고침(request.cache = reload · no-cache)이면 예전처럼 네트워크를 그대로 기다린다.
 *   · 네트워크 오류 · 5xx 면 캐시 · 캐시도 없으면 오류 그대로 · 200 이 아닌 응답은 캐시에 넣지 않는다.
 *   · 새 서비스워커 설치 때 첫 문서를 한 번 받아 넣어 둔다(실패해도 설치는 계속).
 * 나머지(admin · draw · typing · king · tv · interview · wall 등 다른 경로 · 미디어 · API)는 손대지 않는다(브라우저 기본 동작 · mp4 Range 그대로). */
var SW_VERSION = "axf-2026-10-19-v520";   /* v5.20 · 261019 앱 첫 문서 캐시(네트워크 우선 3초) · activate 는 APP_CACHE 하나만 남기고 지운다 */
var APP_CACHE = "axf-app-doc";            /* 이름을 바꾸지 않는다(서비스워커 판이 바뀌어도 첫 문서 캐시는 남아 다음 열기가 빠르다 · 내용은 네트워크가 늘 갈아 끼운다) */
var NET_WAIT = 3000;                      /* 네트워크 본문을 기다리는 시간(ms) · 넘으면 캐시 판 */

function axfNoop() {}
function axfAppKey(u) {                    /* 앱 첫 문서면 캐시 열쇠(범위 주소 · 쿼리 없음) · 아니면 "" */
  var sc = new URL(self.registration.scope);
  if (u.origin !== sc.origin) return "";
  return u.pathname === sc.pathname || u.pathname === sc.pathname + "index.html" ? sc.origin + sc.pathname : "";
}
function axfOkDoc(r) { return !!r && r.status === 200 && r.type === "basic" && !r.redirected && /text\/html/i.test(r.headers.get("content-type") || ""); }
function axfWarm() {                       /* 설치 때 첫 문서를 받아 둔다 · 30초 넘으면 설치를 붙잡지 않는다 */
  var key = axfAppKey(new URL(self.registration.scope));
  if (!key) return Promise.resolve();
  var job = fetch(new Request(key, { cache: "no-cache", credentials: "same-origin" })).then(function (res) {
    return axfOkDoc(res) ? caches.open(APP_CACHE).then(function (c) { return c.put(key, res); }) : null;
  });
  return Promise.race([job, new Promise(function (ok) { setTimeout(ok, 30000); })]).catch(axfNoop);
}

self.addEventListener("install", function (event) {
  self.skipWaiting();                 // 새 버전이 곧바로 적용되도록
  event.waitUntil(axfWarm());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== APP_CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
      .catch(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.mode !== "navigate" || req.method !== "GET") return;   // 미디어·API는 손대지 않음
  var key = axfAppKey(new URL(req.url));
  if (!key) return;                                              // 앱 첫 문서가 아니면(admin 등) 그대로 통과
  event.respondWith(axfAppDoc(event, req, key));
});

function axfAppDoc(event, req, key) {
  return caches.open(APP_CACHE).then(function (cache) {
    return cache.match(key, { ignoreSearch: true, ignoreVary: true }).catch(axfNoop).then(function (old) {
      var reload = req.cache === "reload" || req.cache === "no-cache";
      if (!old || reload) {               /* 첫 열기 · 직접 새로고침 = 네트워크를 그대로(받는 대로 그린다) */
        return fetch(req).then(function (res) {
          if (axfOkDoc(res)) event.waitUntil(cache.put(key, res.clone()).catch(axfNoop));
          if (old && res.status >= 500) return old;
          return res;
        }, function (e) { if (old) return old; throw e; });
      }
      var full = fetch(req).then(function (res) {   /* 본문을 다 받아 캐시에 넣은 뒤에 끝난다 */
        return axfOkDoc(res) ? cache.put(key, res.clone()).then(function () { return res; }) : res;
      });
      event.waitUntil(full.catch(axfNoop));         /* 캐시 판을 보여 줘도 끝까지 받아 다음 열기에 새 판 */
      var late = new Promise(function (ok) { setTimeout(function () { ok(null); }, NET_WAIT); });
      return Promise.race([full.catch(function () { return null; }), late]).then(function (res) {
        if (!res || res.status >= 500) return old;  /* 3초 넘음 · 오류 · 5xx = 캐시 판 */
        return res;
      });
    });
  });
}

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
