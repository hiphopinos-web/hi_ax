/* AX FESTIVAL · 서비스워커
 * 목적: 안드로이드 "홈 화면에 추가" 설치창 · v4.76 웹 푸시 받기(아래) · 261019 앱 첫 문서 캐시(사용자 결정 「hiax.app 유지 + 캐시」).
 * 261020 (사용자 「1 + 2 + 3 모두 지금」 · 계단 QR 이 느린 까닭 = 카메라 링크마다 앱을 처음부터 여는 것) 캐시가 있으면 바로 쓰고 새 판은 뒤에서 받는다.
 * 캐시하는 것 = 이 서비스워커 범위의 앱 첫 문서(hiax.app 은 / · /index.html, github.io 는 /hi_ax/ · /hi_ax/index.html · 쿼리 · 해시 무시 · 한 항목)
 *   + 첫 화면을 막는 하위 파일 5개(SUB_FILES · 쿼리 무시).
 *   · 캐시가 있으면 곧바로 캐시 판 · 같은 때 네트워크로 새 판(문서 + 하위 파일 5개)을 끝까지 받아 캐시만 바꾼다(다음 열기 = 새 판).
 *   · 캐시가 없으면(첫 열기 · 지워짐 · 깨져 읽지 못함) · 직접 새로고침(request.cache = reload · no-cache)이면 네트워크를 그대로 기다린다.
 *   · 문서를 네트워크로 받은 뒤 20초(FRESH_MS) 동안은 하위 파일도 네트워크 먼저(새로 고침 · 앱의 최소 판 새로 고침 때 새 문서와 옛 하위 파일이 섞이지 않게).
 *   · 네트워크 오류 · 5xx 면 캐시 · 캐시도 없으면 오류 그대로 · 200 이 아닌 응답 · 다른 형식은 캐시에 넣지 않는다.
 *   · 새 서비스워커 설치 때 첫 문서와 하위 파일을 한 번 받아 넣어 둔다(실패해도 설치는 계속).
 * 나머지(admin · draw · typing · king · tv · interview · wall 등 다른 경로 · 미디어 · API)는 손대지 않는다(브라우저 기본 동작 · mp4 Range 그대로). */
var SW_VERSION = "axf-2026-10-20-v815";   /* v8.15 · 261020 캐시 먼저 + 뒤에서 새 판(문서 · 하위 파일 5개) · v5.20 261019 앱 첫 문서 캐시(네트워크 우선 3초) */
var APP_CACHE = "axf-app-doc";            /* 이름을 바꾸지 않는다(서비스워커 판이 바뀌어도 첫 문서 캐시는 남아 다음 열기가 빠르다 · 내용은 네트워크가 늘 갈아 끼운다) */
var SUB_CACHE = "axf-app-sub";            /* 하위 파일 5개 · activate 는 이 둘만 남긴다 */
var SUB_FILES = ["design-handoff/design-system/tokens.css", "design-handoff/design-system/components.css", "assets/bot.js", "assets/rain-engine.js", "assets/server.js"];
var FRESH_MS = 20000;                     /* 문서를 네트워크로 받은 뒤 하위 파일 네트워크 먼저 */
var FRESH = { t: 0 };

function axfNoop() {}
function axfScope() { return new URL(self.registration.scope); }
function axfAppKey(u) {                    /* 앱 첫 문서면 캐시 열쇠(범위 주소 · 쿼리 없음) · 아니면 "" */
  var sc = axfScope();
  if (u.origin !== sc.origin) return "";
  return u.pathname === sc.pathname || u.pathname === sc.pathname + "index.html" ? sc.origin + sc.pathname : "";
}
function axfSubKey(u) {                    /* 하위 파일 5개면 캐시 열쇠(범위 주소 + 경로 · 쿼리 없음) · 아니면 "" */
  var sc = axfScope();
  if (u.origin !== sc.origin || u.pathname.indexOf(sc.pathname) !== 0) return "";
  return SUB_FILES.indexOf(u.pathname.slice(sc.pathname.length)) >= 0 ? sc.origin + u.pathname : "";
}
function axfOkDoc(r) { return !!r && r.status === 200 && r.type === "basic" && !r.redirected && /text\/html/i.test(r.headers.get("content-type") || ""); }
function axfOkSub(r) { return !!r && r.status === 200 && r.type === "basic" && !r.redirected && /css|javascript/i.test(r.headers.get("content-type") || ""); }
function axfGet(name, key) { return caches.open(name).then(function (c) { return c.match(key, { ignoreSearch: true, ignoreVary: true }); }).catch(axfNoop); }
function axfPut(name, key, res) { return caches.open(name).then(function (c) { return c.put(key, res); }).catch(axfNoop); }
/* 하위 파일 5개를 네트워크로 받아 캐시만 바꾼다(no-cache = 바뀌지 않았으면 304 로 짧게) */
function axfSubWarm() {
  var sc = axfScope();
  return Promise.all(SUB_FILES.map(function (p) {
    var key = sc.origin + sc.pathname + p;
    return fetch(new Request(key, { cache: "no-cache", credentials: "same-origin" })).then(function (res) { return axfOkSub(res) ? axfPut(SUB_CACHE, key, res) : null; }, axfNoop);
  }));
}
function axfWarm() {                       /* 설치 때 첫 문서 · 하위 파일을 받아 둔다 · 30초 넘으면 설치를 붙잡지 않는다 */
  var key = axfAppKey(axfScope());
  if (!key) return Promise.resolve();
  var job = fetch(new Request(key, { cache: "no-cache", credentials: "same-origin" })).then(function (res) {
    return axfOkDoc(res) ? axfPut(APP_CACHE, key, res) : null;
  }).then(axfSubWarm);
  return Promise.race([job, new Promise(function (ok) { setTimeout(ok, 30000); })]).catch(axfNoop);
}

self.addEventListener("install", function (event) {
  self.skipWaiting();                 // 새 버전이 곧바로 적용되도록
  event.waitUntil(axfWarm());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== APP_CACHE && k !== SUB_CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
      .catch(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var u = new URL(req.url);
  if (req.mode !== "navigate") {                                 // 미디어 · API 는 손대지 않음 · 하위 파일 5개만
    var sk = axfSubKey(u);
    if (sk) event.respondWith(axfSub(event, req, sk));
    return;
  }
  var key = axfAppKey(u);
  if (!key) return;                                              // 앱 첫 문서가 아니면(admin 등) 그대로 통과
  event.respondWith(axfAppDoc(event, req, key));
});

function axfAppDoc(event, req, key) {
  return axfGet(APP_CACHE, key).then(function (old) {
    var reload = req.cache === "reload" || req.cache === "no-cache";
    if (!old || reload) {                 /* 첫 열기 · 캐시 없음 · 직접 새로고침 = 네트워크를 그대로(받는 대로 그린다) */
      FRESH.t = Date.now();
      return fetch(req).then(function (res) {
        if (axfOkDoc(res)) { FRESH.t = Date.now(); event.waitUntil(axfPut(APP_CACHE, key, res.clone())); }
        if (old && res.status >= 500) return old;
        return res;
      }, function (e) { if (old) return old; throw e; });
    }
    /* 캐시 판을 곧바로 · 뒤에서 새 문서 + 하위 파일을 끝까지 받아 캐시만 바꾼다(다음 열기 = 새 판) */
    event.waitUntil(fetch(req).then(function (res) { return axfOkDoc(res) ? axfPut(APP_CACHE, key, res) : null; }).then(axfSubWarm).catch(axfNoop));
    return old;
  });
}
function axfSub(event, req, key) {
  return axfGet(SUB_CACHE, key).then(function (old) {
    var fresh = Date.now() - FRESH.t < FRESH_MS, reload = req.cache === "reload" || req.cache === "no-cache";
    if (!old || fresh || reload) {        /* 캐시 없음 · 방금 문서를 네트워크로 받음 · 직접 새로고침 = 네트워크 먼저 · 오류면 캐시 */
      return fetch(req, fresh ? { cache: "no-cache" } : undefined).then(function (res) {
        if (axfOkSub(res)) event.waitUntil(axfPut(SUB_CACHE, key, res.clone()));
        if (old && res.status >= 500) return old;
        return res;
      }, function (e) { if (old) return old; throw e; });
    }
    return old;                           /* 뒤에서 새 판 받기는 문서 쪽(axfAppDoc · axfSubWarm)이 한다 */
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
