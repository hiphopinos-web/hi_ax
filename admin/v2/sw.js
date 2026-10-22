/* AXF CONTROL v2 · 관리자 알림 서비스워커(261022 관리자 주요 이슈 푸시) · 범위 /admin/v2/ · 참가자 앱 /sw.js 와 따로(그대로)
 * 받기 = 늘 OS 알림(콘솔 창이 보여도 · 관리자 알림은 놓치지 않게) · 본문 = { t 제목, b 내용, go 콘솔 화면, tag, u 급함 }
 * 누르기 = 열린 콘솔 창이 있으면 화면 이동(postMessage axf go)하고 앞으로 · 없으면 index.html#화면 으로 연다(설치 앱 · 아이폰 홈 화면 앱 포함)
 * fetch 처리 없음 = 캐시 없음(콘솔 파일 · 서버 호출은 늘 네트워크 · 지금 동작 그대로) */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) { event.waitUntil(self.clients.claim()); });
function axfGo(v) { v = String(v || ""); return /^[a-z0-9_-]{1,20}(\/[a-z0-9_-]{1,20}){0,2}$/.test(v) ? v : "now"; }
self.addEventListener("push", function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { try { d = { t: event.data.text() }; } catch (x) { d = {}; } }
  var o = { body: String(d.b || ""), icon: "icons/adm-192.png", badge: "../../icons/badge-72.png", tag: String(d.tag || "axf-adm"), renotify: true, data: { go: axfGo(d.go) } };
  if (d.u) o.requireInteraction = true;
  event.waitUntil(self.registration.showNotification(String(d.t || "AXF 관리"), o));
});
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var go = axfGo((event.notification.data || {}).go), url = self.registration.scope + "index.html#" + go;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.registration.scope) === 0 && "focus" in c) { try { c.postMessage({ axf: "go", go: go }); } catch (e) {} return c.focus(); }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
/* 푸시 서비스가 구독을 바꿨다 · 여기에는 로그인 정보가 없어 새 구독만 만든다 · 서버 등록은 콘솔을 열 때(admpush.js 가 adm_push_sub 를 다시 보낸다) */
self.addEventListener("pushsubscriptionchange", function (event) {
  var o = event.oldSubscription && event.oldSubscription.options;
  if (!o || !o.applicationServerKey) return;
  event.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: o.applicationServerKey }).then(function () {}, function () {}));
});
