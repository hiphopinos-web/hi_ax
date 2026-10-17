/* 261017 hiax.app 주소 옮기기 · 값은 이 파일 한 곳 · 앱 · 콘솔 v2 · 럭키드로우 · TV · 타자 체험 페이지가 함께 쓴다
 * 각 페이지 <head> 첫 줄이 github.io 로 열렸을 때만 이 파일을 읽는다(hiax.app 에서는 읽지 않는다).
 * 1) 나머지 페이지 읽기를 멈추고(window.stop · 앱 코드가 돌기 전) hiax.app/__hiax 에 묻는다.
 * 2) WAIT 안에 「hiax-ok」 를 받으면 같은 경로(/hi_ax 뗌) · 쿼리 · 해시로 hiax.app 에 옮긴다(location.replace · 뒤로 가기에 github.io 가 남지 않는다).
 * 3) 못 받으면(응답 없음 · 오류 · 다른 글자 · 옛 넘겨 주기 Worker) 이 탭은 HOLD 동안 옮기지 않고 github.io 를 한 번 다시 불러 지금처럼 쓴다.
 * interview/ 는 대상 아님(github.io 그대로 · 사용자 261017). sessionStorage 를 못 쓰면 옮기지 않는다(다시 불러오기 고리 막기). */
(function () {
  var HOST = "hiphopinos-web.github.io", BASE = "/hi_ax", TO = "https://hiax.app", PING = "/__hiax", WAIT = 2000, HOLD = 600000, KEY = "axf_hiax_hold";
  var L = window.location, ss, t, done = false, ac, tm;
  if (L.hostname !== HOST || L.pathname.indexOf(BASE + "/") !== 0) return;
  if (/^\/hi_ax\/interview(\/|$)/.test(L.pathname)) return;
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
