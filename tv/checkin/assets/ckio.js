/* AX Festival 2026 · 체크인존 화면 공용 통신 (261007) · TV 대기판(index.html) · 창구 화면(desk.html)
 * 서버 = ../../assets/server.js 의 AXF_SERVER(?srv= 로 바꿀 수 있다 · workers.dev · localhost 만) · JSONP 읽기 · 웹 소켓(/ws · tv 방은 인증 없음 · ops 방은 스태프 토큰)
 * 소켓은 빨리 알려 주는 통로일 뿐 · 정본은 늘 읽기 응답(폴링) · 끊기면 1 · 2 · 4 · 8초 → 30초 상한으로 다시 */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var i = kv.indexOf("="); Q[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1)); });
  function srvOk(u) { return typeof u === "string" && (/^https:\/\/[a-z0-9.-]+\.workers\.dev\/exec$/.test(u) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/exec$/.test(u)); }
  var SRV = srvOk(Q.srv) ? Q.srv : (typeof AXF_SERVER === "string" && srvOk(AXF_SERVER) ? AXF_SERVER : "");
  function jsonp(params, done, ms) {
    if (!SRV) { done({ ok: false, reason: "noserver" }); return; }
    var name = "axck" + Date.now().toString(36) + Math.floor(Math.random() * 1e6), sc = document.createElement("script"), fin = false;
    var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
    var timer = setTimeout(function () { end({ ok: false, reason: "timeout" }); }, ms || 12000);
    function end(res) {
      if (fin) return; fin = true; clearTimeout(timer);
      window[name] = function () {}; setTimeout(function () { try { delete window[name]; } catch (e) { window[name] = undefined; } }, 30000);
      sc.onerror = sc.onload = null; if (sc.parentNode) sc.parentNode.removeChild(sc);
      done(res || { ok: false });
    }
    window[name] = function (res) { end(res); };
    sc.onerror = function () { end({ ok: false, reason: "network" }); };
    sc.onload = function () { setTimeout(function () { end({ ok: false, reason: "bad" }); }, 0); };
    sc.src = SRV + "?" + qs + "&callback=" + name + "&_=" + Date.now();
    document.head.appendChild(sc);
  }
  /* 소켓 · room = tv | ops · hello = 보낼 인사(방마다) · onMsg(m) · onState(on) */
  function sock(room, hello, onMsg, onState) {
    var S = { ws: null, fails: 0, t: null, ping: null, pong: 0, stop: false };
    var url = /^https:\/\/[a-z0-9.-]+\.workers\.dev\/exec$/.test(SRV) ? SRV.replace(/^https:/, "wss:").replace(/\/exec$/, "/ws?r=" + room) : "";
    function open() {
      if (!url || S.stop || typeof WebSocket === "undefined") return;
      var ws; try { ws = new WebSocket(url); } catch (e) { retry(); return; }
      S.ws = ws;
      ws.onopen = function () { try { ws.send(JSON.stringify(typeof hello === "function" ? hello() : hello)); } catch (e) {} };
      ws.onmessage = function (e) {
        if (e.data === "o") { S.pong = Date.now(); return; }
        var m; try { m = JSON.parse(e.data); } catch (x) { return; }
        if (!m) return;
        if (m.t === "ok") { S.fails = 0; S.pong = Date.now(); onState && onState(true); clearInterval(S.ping); S.ping = setInterval(function () { if (Date.now() - S.pong > 70000) { try { ws.close(); } catch (x) {} return; } try { ws.send("p"); } catch (x) {} }, 25000); return; }
        if (m.t === "no") { S.stop = m.reason === "auth" || m.reason === "ses"; return; }
        onMsg(m);
      };
      ws.onclose = function () { if (S.ws !== ws) return; S.ws = null; clearInterval(S.ping); onState && onState(false); retry(); };
      ws.onerror = function () {};
    }
    function retry() { if (S.stop) return; clearTimeout(S.t); S.fails++; S.t = setTimeout(open, Math.min(30000, 1000 * Math.pow(2, Math.min(5, S.fails - 1))) + Math.random() * 800); }
    open();
    return { close: function () { S.stop = true; if (S.ws) try { S.ws.close(); } catch (e) {} }, live: function () { return !!S.ws && S.ws.readyState === 1; } };
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  window.CKIO = { Q: Q, srv: function () { return SRV; }, jsonp: jsonp, sock: sock, esc: esc };
})();
