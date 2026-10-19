/* 261017 hiax.app 주소 옮기기 · 값은 이 파일 한 곳 · 261019 스태프 페이지(콘솔 v2 · 타자 선수 · 럭키드로우 · TV)만 옮긴다
 * 261019 사용자 「진행」 = 참가자 앱은 github.io 에서 연다 · 앱 index.html 은 이 파일을 더 읽지 않는다 · 옛 캐시 앱이 읽어도 admin · draw · tv 밖이면 아무것도 안 한다
 * 각 페이지 <head> 첫 줄이 github.io 로 열렸을 때만 이 파일을 읽는다(hiax.app 에서는 읽지 않는다).
 * 1) 나머지 페이지 읽기를 멈추고(window.stop) hiax.app/__hiax?k=staff 에 묻는다(쿼리 없는 /__hiax 는 옛 파일용 · 늘 「옮기지 않음」).
 * 2) WAIT 안에 「hiax-ok」 를 받으면 같은 경로(/hi_ax 뗌) · 쿼리 · 해시로 hiax.app 에 옮긴다(location.replace · 뒤로 가기에 github.io 가 남지 않는다).
 * 3) 못 받으면(응답 없음 · 오류 · 다른 글자) 이 탭은 HOLD 동안 옮기지 않고 github.io 를 한 번 다시 불러 지금처럼 쓴다.
 * 앱 · interview/ 등 admin · draw · tv 밖은 대상 아님. sessionStorage 를 못 쓰면 옮기지 않는다(다시 불러오기 고리 막기). */
(function () {
  var HOST = "hiphopinos-web.github.io", BASE = "/hi_ax", TO = "https://hiax.app", PING = "/__hiax?k=staff", STAFF = /^\/hi_ax\/(admin|draw|tv)\//, WAIT = 2000, HOLD = 600000, KEY = "axf_hiax_hold";
  var L = window.location, ss, t, done = false, ac, tm;
  if (L.hostname !== HOST || L.pathname.indexOf(BASE + "/") !== 0 || !STAFF.test(L.pathname)) return;
  if (!window.fetch || !window.AbortController) return;
  try { ss = window.sessionStorage; ss.setItem(KEY + "_t", "1"); ss.removeItem(KEY + "_t"); t = Number(ss.getItem(KEY) || 0); } catch (e) { return; }
  if (t && Date.now() >= t && Date.now() - t < HOLD) return;
  var dest = TO + L.pathname.slice(BASE.length) + L.search + L.hash;
  ac = new AbortController();
  function stay() {
    if (done) return; done = true; clearTimeout(tm);
    try { ac.abort(); } catch (e) {}
    try { ss.setItem(KEY, String(Date.now())); } catch (e) {}
    L.reload();
  }
  try { window.stop(); } catch (e) {}
  tm = setTimeout(stay, WAIT);
  fetch(TO + PING, { cache: "no-store", credentials: "omit", mode: "cors", signal: ac.signal })
    .then(function (r) { return r.ok ? r.text() : ""; })
    .then(function (s) {
      if (done) return;
      if (String(s).indexOf("hiax-ok") === 0) { done = true; clearTimeout(tm); L.replace(dest); } else stay();
    }, stay);
})();
