/* 1F 타자왕 순위판 루프 · 스탠바이미 세로 TV (261003)
 * 시안 = 디자인 시안/타자왕 순위판/타자왕_순위판_루프.html (사용자 승인 방향) · 운영 안내 = 디자인 시안/사이니지/운영 안내.md
 * 장면(초) = 후킹 5 · 게임 9 · 하는 법 7.5 · 상품 8 · 순위 12.5 · 마감 5.5 = 47.5 · 17:00(한국 시간) 뒤 = 순위 · 상품 · 마감 = 26
 * 게임 장면의 단어 · 보너스 문장 · 점수 = ../../assets/rain-engine.js(RAIN_WORDS · RAIN_BONUS_LINES · rgBonusScore) 그대로 · 엔진을 못 읽으면 아래 예비 목록
 * 데이터 = 공개 액션 type_rank(mode site · n 10) · JSONP · 주소 = ../../assets/server.js 의 AXF_SERVER(?srv= 로 바꿈) · 응답 moved 가 오면 새 주소로
 *   30초마다 · 실패하면 60 → 120초(+0~5초 지터) · 화면이 가려지면 멈추고 보이면 곧바로 · 마지막 응답은 기기에 저장(새로 고쳐도 바로 보인다)
 *   unit = pts(새 서버 · 점수) → 「n점」 · cs(시간) → 「n.n초」 · 없음(옛 서버) → 숫자만
 * 순위 변동 = 화면이 직전 순위 장면에서 보여 준 판과 지금 판을 비교(서버 변경 없음) · 새 이름/점수 = NEW RECORD · 같은 사람 점수 올라 순위 오름 = RANK UP
 * 마감 시계 = 응답에 now(ms)가 있으면 서버 시계 · 없으면 기기 시계 · 둘 다 한국 시간(UTC+9)으로 센다
 * 주소 뒤 값: ?demo=1 서버 없이 가짜 순위(20초마다 바뀜) · ?srv=주소 · ?now=13:20 시계 흉내(한국 시간) · ?close=17:00 마감 시각 · ?after=1 마감 뒤 루프
 *   ?scene=hook|game|how|prize|rank|close 한 장면만 · ?t=초 루프 시작 위치 · ?prz4=문구 4~10위 상품 줄 켜기(기본 꺼짐 · 상품 미정) · ?ctl=1 조작판
 *   ?promo=1 참가자 앱 홍보 칸(261003) · 후킹 → 게임 → 하는 법 → 상품 → 마감(35초) · 17:00 뒤 = 상품 → 마감(13.5초 · 마감 장면 「기록 마감」)
 *     순위 장면 없음 · 서버 호출 0(type_rank 안 부름 · 기기 저장도 안 읽고 안 씀) · 키 · 조작판 · 전체 화면 · 꺼짐 방지 끔 · 무음
 *     칸이 화면 밖이거나(IntersectionObserver) 탭이 가려지면 그리기를 멈추고 보이면 이어서 · 누르면 부모 창에 postMessage({ axfTy: "tap" })
 * 키: 1~6 장면 · 0 전체 루프 · F 전체 화면 · C 조작판 */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var i = kv.indexOf("="); var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i)); Q[k] = i < 0 ? "1" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); });
  var PROMO = Q.promo === "1", DEMO = Q.demo === "1" && !PROMO, PRZ4 = Q.prz4 ? String(Q.prz4).slice(0, 40) : "";
  var body = document.body;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { if (DEMO || PROMO) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ── 실제 게임 데이터 · 엔진 그대로 ── */
  var WORDS = typeof RAIN_WORDS !== "undefined" && RAIN_WORDS.length ? RAIN_WORDS : ["공감", "참여", "확산", "체화", "혁신", "연결", "요약", "번역", "보상", "영업", "질문", "설계"];
  var LINES = (typeof RAIN_BONUS_LINES !== "undefined" ? RAIN_BONUS_LINES : []).map(function (x) { return typeof x === "string" ? x : x && x.s; }).filter(Boolean);   /* 엔진 v5.24 부터 { s: 문장, w: 구름 단어 } · 문장만 쓴다(구름 없음) */
  if (!LINES.length) LINES = ["나의 경험을 우리의 가능성으로", "아이디어 한 줄이 우리의 시작"];
  var SHORT = WORDS.filter(function (w) { return w.length <= 3; });   /* 1단계 = 세 글자 이하(엔진 rgPool) */
  function bonusLim(n) { return typeof rgBonusLim === "function" ? rgBonusLim(n) : Math.ceil(n * 0.8) + 6; }
  function bonusPts(text, left) { return typeof rgBonusScore === "function" ? rgBonusScore(text, text, "enter", left).pts : text.length * 20 + 300 + Math.floor(left) * 30; }
  function wordPts(w, combo) { return Math.round(w.length * 10 * (1 + 0.2 * Math.min(combo - 1, 10))); }   /* 엔진 rgHit 와 같은 식 */

  /* ── 화면 맞추기 · 1080×1920 판을 배율로 · 가로 TV = 가운데 + 양옆 도트 ── */
  var stage = $("stage");
  var FIT = "";
  function fit() {
    var key = window.innerWidth + "x" + window.innerHeight; if (key === FIT) return; FIT = key;
    var k = Math.min(window.innerWidth / 1080, window.innerHeight / 1920) || 1;
    stage.style.transform = "scale(" + k + ")";
    document.documentElement.style.setProperty("--dot", (36 * k).toFixed(2) + "px");
  }
  window.addEventListener("resize", fit); fit();

  /* ── 시계 · 한국 시간 ── */
  var SRV_OFF = 0, SIM_OFF = 0;
  function hms(s) { var m = String(s || "").split(":"); return (+m[0] || 0) * 3600 + (+m[1] || 0) * 60 + (+m[2] || 0); }
  function kstSec() { var ms = Date.now() + SRV_OFF + SIM_OFF; return ((Math.floor(ms / 1000) + 9 * 3600) % 86400 + 86400) % 86400; }
  if (Q.now) SIM_OFF = (hms(Q.now) - kstSec()) * 1000;
  var CLOSE = Q.close ? hms(Q.close) : 17 * 3600;
  function closed() { return Q.after === "1" || kstSec() >= CLOSE; }
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  var CLOSE_TXT = p2(Math.floor(CLOSE / 3600)) + ":" + p2(Math.floor(CLOSE / 60) % 60);

  /* ── 도트 글자 ── */
  var DGS = {};
  function dotOn(host, text, h, o, show) {
    var e = $(host);
    if (show && !DGS[host] && typeof DotGlyph !== "undefined") { e.innerHTML = DotGlyph.svg(text, Object.assign({ h: h }, o || {})); e.style.display = "block"; DGS[host] = 1; }
    if (!show && DGS[host]) { e.innerHTML = ""; e.style.display = "none"; DGS[host] = 0; }
  }
  var BOT = typeof BOT_SVG === "string" ? BOT_SVG : "";
  ["bot1", "bot2", "cl-bot"].forEach(function (id) { $(id).innerHTML = BOT; });

  /* ════════ 데이터 ════════ */
  var RK = { data: DEMO || PROMO ? null : load("axfTy.last", null), fails: 0, timer: null, busy: false, polls: 0, srv: "" };
  function srvOk(u) { return typeof u === "string" && (/^https:\/\/[a-z0-9.-]+\.workers\.dev\/exec$/.test(u) || /^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,}\/exec$/.test(u) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u)); }
  RK.srv = srvOk(Q.srv) ? Q.srv : (typeof AXF_SERVER === "string" && srvOk(AXF_SERVER) ? AXF_SERVER : "");
  function jsonp(params, done) {
    if (!RK.srv) { done({ ok: false, reason: "noserver" }); return; }
    var name = "axty" + Date.now().toString(36) + Math.floor(Math.random() * 1e6), sc = document.createElement("script"), fin = false;
    var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
    var timer = setTimeout(function () { end({ ok: false, reason: "timeout" }); }, 15000);
    function end(res) {
      if (fin) return; fin = true; clearTimeout(timer);
      window[name] = function () {}; setTimeout(function () { try { delete window[name]; } catch (e) { window[name] = undefined; } }, 30000);   /* 늦게 온 응답이 오류를 내지 않게 잠시 빈 함수로 두고 지운다 */
      sc.onerror = sc.onload = null; if (sc.parentNode) sc.parentNode.removeChild(sc);
      done(res || { ok: false });
    }
    window[name] = function (res) { end(res); };
    sc.onerror = function () { end({ ok: false, reason: "network" }); };
    sc.onload = function () { setTimeout(function () { end({ ok: false, reason: "bad" }); }, 0); };   /* 받았는데 콜백이 없다 = 오류 페이지 */
    sc.src = RK.srv + (RK.srv.indexOf("?") >= 0 ? "&" : "?") + qs + "&callback=" + name + "&_=" + Date.now();
    document.head.appendChild(sc);
  }
  function took(res) {
    if (typeof res.now === "number" && res.now > 1.6e12) SRV_OFF = res.now - Date.now();
    if (srvOk(res.moved) && res.moved !== RK.srv) RK.srv = res.moved;
    RK.data = { top: (res.top || []).slice(0, 10).map(function (x) { return { name: String(x.name == null ? "" : x.name), score: Number(x.score) || 0 }; }), unit: res.unit || "", tries: res.tries || 3, at: Date.now() };
    save("axfTy.last", RK.data);
  }
  function next(ms) { clearTimeout(RK.timer); RK.timer = null; if (!document.hidden) RK.timer = setTimeout(poll, ms); }
  function poll() {
    clearTimeout(RK.timer); RK.timer = null;
    if (PROMO) return;   /* 홍보 칸 = 서버를 부르지 않는다(폰 수백 대) */
    if (document.hidden || RK.busy) return;
    if (DEMO) { demoStep(); RK.polls++; next(20000); return; }
    RK.busy = true;
    jsonp({ action: "type_rank", mode: "site", n: 10 }, function (res) {
      RK.busy = false;
      if (res && res.ok) { RK.fails = 0; RK.polls++; body.classList.remove("off"); took(res); next(30000); }
      else { RK.fails++; if (RK.fails >= 2) body.classList.add("off"); next(Math.min(120000, 30000 * Math.pow(2, Math.min(RK.fails, 2))) + Math.floor(Math.random() * 5000)); }
    });
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { clearTimeout(RK.timer); RK.timer = null; } else poll(); });

  /* 가짜 순위(?demo=1) · 20초마다 새 기록 하나 또는 기존 도전자 점수 경신 */
  var DM = { n: 0, list: [["엔터키장인", 18420], ["프롬프트러", 17150], ["단어사냥꾼", 16780], ["키보드요정", 15210], ["야근탈출", 14630], ["조용한고수", 13900], ["오타없음", 12750], ["손가락빠름", 11980], ["소나기피해자", 10840], ["백스페이스", 9960]],
    pool: ["하이큐", "새벽타자", "한방에", "무한자동화", "점심은짬뽕", "광화문청년", "타자치는곰", "새내기A", "보고서장인", "삼시탈출"] };
  function demoStep() {
    var L = DM.list.slice().sort(function (a, b) { return b[1] - a[1]; });
    if (DM.n > 0) {
      if (DM.n % 2) { var nm = DM.pool[(DM.n >> 1) % DM.pool.length] + (DM.n >= 20 ? DM.n : ""); L.push([nm, Math.round((L[2][1] + L[4][1]) / 2 / 10) * 10]); }
      else { var r = L[7]; r[1] = Math.min(L[3][1] + 120, L[2][1] - 10); }
    }
    DM.n++; DM.list = L.sort(function (a, b) { return b[1] - a[1]; }).slice(0, 14);
    RK.data = { top: DM.list.slice(0, 10).map(function (r) { return { name: r[0], score: r[1] }; }), unit: "pts", tries: 3, at: Date.now() };
  }
  function scoreTxt(v, unit) { return unit === "pts" ? fmt(v) + "점" : unit === "cs" ? (Number(v || 0) / 100).toFixed(1) + "초" : fmt(v); }

  /* ════════ 장면 ════════ */
  var DUR = { hook: 5, game: 9, how: 7.5, prize: 8, rank: 12.5, close: 5.5 };
  var PL_OPEN = PROMO ? ["hook", "game", "how", "prize", "close"] : ["hook", "game", "how", "prize", "rank", "close"], PL_DONE = PROMO ? ["prize", "close"] : ["rank", "prize", "close"];
  var SOLO = DUR[Q.scene] && !(PROMO && Q.scene === "rank") ? Q.scene : "";
  var PLAY = { list: PL_OPEN, i: 0, id: "", t0: 0, loops: 0, frozen: false };
  function el(id) { return $("s-" + id); }
  function revealAt(sc, lt) { var a = sc.querySelectorAll("[data-at]"); for (var i = 0; i < a.length; i++) { var on = lt >= +a[i].getAttribute("data-at"); if (a[i].classList.contains("in") !== on) a[i].classList.toggle("in", on); } }

  /* 1 후킹 */
  function hookDraw(lt) {
    dotOn("hs1", "HIGH SCORE", 86, { anim: true, step: 14, total: 800 }, lt >= 1.0);
    var p = $("press"), inv = lt >= 3.4 && Math.floor(lt * 2) % 2 === 1;
    if (p.classList.contains("inv") !== inv) p.classList.toggle("inv", inv);
  }

  /* 2 게임 · 단어 5개(1단계) → 보너스 스테이지(문장 하나 · PERFECT) → LEVEL 2 */
  var GM = null;
  var GX = [70, 500, 300, 600, 140], GS = [[.2, 1.0, 1.6], [.6, 1.7, 2.3], [1.1, 2.4, 3.0], [1.6, 3.1, 3.7], [2.1, 3.8, 4.3]], GV = 300;
  function gameBegin(k) {
    var ws = [], i, combo = 0, total = 0;
    for (i = 0; i < 5; i++) { var w = SHORT[(k * 5 + i * 7) % SHORT.length]; combo++; var p = wordPts(w, combo); total += p; ws.push({ t: w, x: GX[i], s: GS[i][0], a: GS[i][1], b: GS[i][2], p: p, sum: total, combo: combo }); }
    var text = LINES[k % LINES.length], lim = bonusLim(text.length), leftEnd = Math.max(0, Math.floor(lim - 2.3 * 3));
    GM = { ws: ws, text: text, lim: lim, leftEnd: leftEnd, bp: bonusPts(text, leftEnd), wordSum: total };
    var h = ""; ws.forEach(function (w, j) { h += '<div class="gw" id="gw' + j + '"></div><div class="gp" id="gp' + j + '"></div>'; });
    $("g-words").innerHTML = h;
  }
  function show(id, on, disp) { var e = $(id), d = on ? (disp || "block") : "none"; if (e.style.display !== d) e.style.display = d; return e; }
  function gameDraw(lt) {
    var g = GM, score = 0, combo = 0, act = null, actN = 0;
    g.ws.forEach(function (w, j) {
      var e = $("gw" + j), p = $("gp" + j), fin = lt >= w.b, vis = lt >= w.s && !fin, y = (lt - w.s) * GV;
      e.style.display = vis ? "block" : "none";
      if (vis) {
        var n = lt >= w.a ? Math.floor(w.t.length * (lt - w.a) / (w.b - w.a)) : 0;
        e.style.left = w.x + "px"; e.style.top = Math.round(y) + "px";
        e.innerHTML = "<i>" + esc(w.t.slice(0, n)) + "</i>" + esc(w.t.slice(n));
        if (lt >= w.a) { act = w; actN = n; }
      }
      var q = lt - w.b;
      if (fin) { score = w.sum; combo = w.combo; }
      p.style.display = fin && q < 0.7 ? "block" : "none";
      if (fin && q < 0.7) { p.style.left = w.x + "px"; p.style.top = Math.round((w.b - w.s) * GV - q * 120) + "px"; p.textContent = "+" + w.p; }
    });
    var bOn = lt >= 4.5 && lt < 8.5, typing = lt >= 5.5 && lt < 7.8, res = lt >= 7.8, lvup = lt >= 8.5;
    $("g-field").classList.toggle("bonus", bOn);
    var bn = show("g-bonus", lt >= 4.5 && lt < 5.5); bn.style.opacity = Math.floor(lt * 5) % 2 ? .5 : 1;
    var n = typing ? Math.floor(g.text.length * (lt - 5.5) / 2.3) : res ? g.text.length : 0;
    var se = show("g-sent", bOn);
    if (bOn) se.innerHTML = "<i>" + esc(g.text.slice(0, n)) + "</i>" + esc(g.text.slice(n));
    var left = lt < 5.5 ? g.lim : typing ? Math.max(0, g.lim - (lt - 5.5) * 3) : g.leftEnd;
    show("g-left", bOn).firstChild.style.width = (100 * left / g.lim).toFixed(1) + "%";
    show("g-leftt", bOn).textContent = "남은 시간 " + Math.ceil(left) + "초";
    var rs = show("g-res", res && !lvup);
    if (res && !lvup) rs.innerHTML = "PERFECT<small>+" + fmt(g.bp) + "</small>";
    show("g-lvup", lvup);
    if (res) score = g.wordSum + g.bp;
    $("g-score").textContent = fmt(score);
    $("g-lv").textContent = lvup ? "LEVEL 2" : "LEVEL 1";
    $("g-combo").innerHTML = combo >= 2 && !bOn && !lvup ? "COMBO <b>x" + combo + "</b>" : "";
    var gi = $("g-in"), tx = bOn ? g.text.slice(0, n) : act ? act.t.slice(0, actN) : "";
    gi.classList.toggle("long", bOn);
    $("g-typed").innerHTML = "<i>" + esc(tx.length > 12 ? tx.slice(-12) : tx) + "</i>";
  }

  /* 3 하는 법 · 1층 판 46번 3단계 · 1인 3회 · 최고 점수 1개로 순위 */
  function qrSvg(seed) {
    var n = 21, h = "", r = seed;
    function rnd() { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; }
    function fnd(x, y) { return (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var on;
      if (fnd(x, y)) { var lx = x > 13 ? x - 14 : x, ly = y > 13 ? y - 14 : y; on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4); }
      else on = rnd() > .52;
      if (on) h += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02"/>';
    }
    return '<svg viewBox="0 0 21 21" fill="#000" shape-rendering="crispEdges" aria-hidden="true">' + h + "</svg>";
  }
  (function howInit() {
    var qr = qrSvg(7);
    $("i1").innerHTML = '<div class="lt"><div class="cam" id="cam"></div><div class="tx">NOTEBOOK</div></div>' +
      '<div class="ph" id="ph1" style="left:326px;top:470px"><div class="scr">' + qr + '<span>앱 내 QR</span><div id="beam"></div></div></div><div id="ok">인식 완료</div>';
    $("i2").innerHTML = '<div class="lt"><div class="ps" id="ps">PRESS<br>SPACE</div><div class="tx">NOTEBOOK</div></div><div id="key">SPACE</div>';
    $("i3").innerHTML = '<div id="i3w"><span id="i3s"></span></div>' +
      '<div class="tr" style="top:300px"><b>1회</b><span>9,840점</span></div><div class="tr best" style="top:460px"><b>2회</b><span>12,750점</span></div><div class="tr" style="top:620px"><b>3회</b><span>11,020점</span></div>' +
      '<div id="rule">1인 <em id="ruleN">3</em>회 · <em>최고 점수 1개</em>로 순위</div>';
  })();
  function howDraw(lt) {
    var a = lt < 2.6 ? 1 : lt < 4.6 ? 2 : 3;
    for (var i = 1; i <= 3; i++) {
      var c = "abs st" + (i === a ? " act" : i < a ? " done" : ""), s = $("st" + i); if (s.className !== c) s.className = c;
      var d = $("i" + i), dc = i === a ? "on" : ""; if (d.className !== dc) d.className = dc;
    }
    if (a === 1) {
      var k = ease(lt / 0.9); $("ph1").style.top = Math.round(470 - 330 * k) + "px";
      var sw = lt - 0.9, b = $("beam"); b.style.display = sw > 0 && sw < 1.0 ? "block" : "none"; b.style.top = Math.round(((sw / 0.5) % 1) * 330 + 10) + "px";
      $("cam").className = "cam" + (lt > .6 ? " on" : "");
      $("ok").style.display = lt > 1.9 ? "flex" : "none";
    } else if (a === 2) {
      var s2 = lt - 2.6, dn = s2 > 0.7 && s2 < 1.0, go = s2 >= 1.0;
      $("key").className = dn ? "dn" : "";
      var ps = $("ps"); ps.innerHTML = go ? "START" : "PRESS<br>SPACE"; ps.className = "ps" + (!go && Math.floor(s2 * 3) % 2 ? " inv" : "");
      ps.style.top = go ? "145px" : "100px";
    } else {
      var s3 = lt - 4.6, w = "프롬프트", n = s3 < 0.3 ? 0 : Math.min(w.length, Math.floor(w.length * (s3 - 0.3) / 0.8));
      var ww = $("i3w"); ww.style.top = Math.round(40 + Math.min(1, s3 / 1.1) * 120) + "px"; ww.style.opacity = s3 < 1.3 ? 1 : Math.max(0, 1 - (s3 - 1.3) / .3);
      $("i3s").innerHTML = "<i>" + esc(w.slice(0, n)) + "</i>" + esc(w.slice(n));
      var trs = $("i3").querySelectorAll(".tr"); for (var j = 0; j < trs.length; j++) trs[j].style.opacity = s3 > 1.0 + j * .35 ? 1 : 0;
      $("rule").style.opacity = s3 > 2.0 ? 1 : 0;
    }
  }

  /* 4 상품 */
  function prizeDraw(lt) {
    dotOn("pz-h", "PRIZE", 110, { anim: true, step: 40, total: 600 }, lt >= 0.05);
    show("pz-x", !!PRZ4 && lt > 5.6);
  }
  if (PRZ4) { body.classList.add("prz"); $("pz-x").textContent = "4~10위 · " + PRZ4; $("hs-prz2").innerHTML = "<br>4~10위 · " + esc(PRZ4); }

  /* 5 순위 · 줄 20개를 처음에 만들어 돌려 쓴다(하루 종일 켜 두어도 DOM 이 늘지 않게) */
  var POOL = [], NIL = [], RS = { shown: DEMO || PROMO ? null : load("axfTy.shown", null), cur: [], prev: null, ev: [], map: {}, unit: "", hotOn: false };
  (function rankInit() {
    var host = $("hs-in"), i, e;
    for (i = 0; i < 10; i++) { e = document.createElement("div"); e.className = "hr nil" + (i % 2 ? " e" : ""); e.style.top = i * 108 + "px"; e.innerHTML = '<span class="no">' + (i + 1) + "</span>"; host.appendChild(e); NIL.push(e); }
    for (i = 0; i < 20; i++) {
      e = document.createElement("div"); e.className = "hr"; e.style.opacity = 0;
      e.innerHTML = '<span class="no"></span><span class="tag">NEW</span><span class="nm"></span><span class="gf"></span><span class="sc2"></span>';
      host.appendChild(e); POOL.push(e);
    }
  })();
  function keyed(top) { var seen = {}; return top.map(function (x, i) { var c = seen[x.name] = (seen[x.name] || 0) + 1; return { key: x.name + "#" + c, name: x.name, score: x.score, rank: i + 1 }; }); }
  function hsLong(s) { var u = 0; s = String(s || ""); for (var i = 0; i < s.length; i++) u += s.charCodeAt(i) < 0x1100 ? 0.5 : 1; return u > 9; }
  function rankBegin() {
    var d = RK.data, cur = keyed(d ? d.top : []), prev = RS.shown, pm = {}, ev = [];
    RS.unit = d ? d.unit : ""; RS.at = d ? d.at : 0;
    if (prev) prev.forEach(function (r) { pm[r.key] = r; });
    if (prev) cur.forEach(function (r) {
      var o = pm[r.key];
      if (!o) ev.push({ k: "new", r: r });
      else if (r.score > o.score) ev.push({ k: r.rank < o.rank ? "up" : "new", r: r, from: o.score });
    });
    RS.cur = cur; RS.prev = prev; RS.ev = ev.slice(0, 3); RS.evAll = ev; RS.hotOn = false;
    var keys = {}, list = cur.concat(prev && ev.length ? prev : []); RS.map = {};
    var used = 0;
    list.forEach(function (r) { if (keys[r.key] || used >= POOL.length) return; keys[r.key] = 1; RS.map[r.key] = POOL[used++]; });
    var startBoard = ev.length && prev ? prev : cur, sp = {}; startBoard.forEach(function (r, i) { sp[r.key] = i; });
    POOL.forEach(function (e, i) {
      e.style.transition = "none"; e.className = "hr"; e.style.left = "1100px"; e.style.opacity = 0;
      var k = null; for (var kk in RS.map) if (RS.map[kk] === e) k = kk;
      e.style.top = (k != null && sp[k] != null ? sp[k] : 10) * 108 + "px"; e.style.display = i < used ? "flex" : "none";
      e._k = k;
    });
    void stage.offsetWidth;
    POOL.forEach(function (e) { e.style.transition = ""; });
    var tr = d ? d.tries : 3;
    $("hs-rule").innerHTML = "1인 " + tr + "회 · 최고 점수 1개로 순위<br>" + (closed() ? "기록 마감" : CLOSE_TXT + " 마감") + " · 1~3위 Outro 시상";
  }
  function rankEnd() { if (!RS.at) return; RS.shown = RS.cur.map(function (r) { return { key: r.key, name: r.name, score: r.score, rank: r.rank }; }); save("axfTy.shown", RS.shown); }
  function rankDraw(lt) {
    if (!RS.cur.length && RK.data && RK.data.top.length && RS.at !== RK.data.at) rankBegin();   /* 빈 판으로 시작했는데 장면 도중 첫 응답이 왔다(켠 직후) */
    var hasEv = RS.ev.length > 0 && !!RS.prev, ph = hasEv && lt < 3.2 ? 0 : 1, board = ph ? RS.cur : RS.prev, pos = {}, evm = {};
    board.forEach(function (r, i) { pos[r.key] = r; });
    if (ph) RS.evAll.forEach(function (x) { evm[x.r.key] = x; });
    var hot = ph === 1 && hasEv && lt < 7.2, pm = {};
    if (RS.prev) RS.prev.forEach(function (r) { pm[r.key] = r; });
    POOL.forEach(function (e) {
      var k = e._k; if (k == null) return;
      var r = pos[k];
      if (!r) { e.style.top = 1080 + "px"; e.style.opacity = 0; return; }
      var i = r.rank - 1, shown = ph === 1 && hasEv ? 1 : lt >= 0.15 + i * 0.07 ? 1 : 0;
      e.style.left = (shown ? 0 : 1100) + "px"; e.style.opacity = shown; e.style.top = i * 108 + "px";
      var x = evm[k], isHot = hot && !!x;
      var cls = "hr" + (i < 3 ? " r" + (i + 1) : "") + (i % 2 ? " e" : "") + (i >= 3 ? " g" : "") + (isHot ? " hot" : "");
      if (e.className !== cls) e.className = cls;
      var sc = r.score;
      if (x && x.from != null && lt >= 3.2 && lt < 4.4) sc = x.from + (r.score - x.from) * ease((lt - 3.2) / 1.2);
      var nmTxt = r.name, c = e.children;
      if (c[0].textContent !== String(i + 1)) c[0].textContent = i + 1;
      if (c[2].textContent !== nmTxt) { c[2].textContent = nmTxt; c[2].classList.toggle("long", hsLong(nmTxt)); }
      var st = scoreTxt(sc, RS.unit); if (c[4].textContent !== st) c[4].textContent = st;
      var tg = isHot && x.k === "new" && lt < 6.6 ? "block" : "none"; if (c[1].style.display !== tg) c[1].style.display = tg;
    });
    var sub = $("hs-sub"), txt, cls = "abs";
    if (!RS.cur.length) { txt = RK.data ? "첫 기록을 기다리고 있어요" : "순위를 불러오는 중"; cls += " em"; }
    else {
      var j = ph === 1 && hasEv ? Math.floor((lt - 3.2) / 3) : -1, x2 = j >= 0 && j < RS.ev.length ? RS.ev[j] : null;
      if (x2) { txt = (x2.k === "up" ? "RANK UP · " : "NEW RECORD · ") + x2.r.name + " " + x2.r.rank + "위"; cls += " nr"; }
      else txt = "1F 타자왕 · " + (closed() ? "최종" : "현장") + " TOP 10";
    }
    if (sub.textContent !== txt) sub.textContent = txt;
    if (sub.className !== cls) sub.className = cls;
  }

  /* 6 마감 */
  function closeDraw(lt) {
    var done = closed(), left = Math.max(0, CLOSE - kstSec());
    dotOn("cl-t", CLOSE_TXT, 170, { anim: true, step: 22, total: 800 }, lt >= .4);
    $("cl-cdk").style.visibility = $("cl-cd").style.visibility = done ? "hidden" : "visible";
    $("cl-cd").textContent = p2(Math.floor(left / 3600)) + ":" + p2(Math.floor(left / 60) % 60) + ":" + p2(left % 60);
    $("cl-fin").style.opacity = lt > 4.6 ? Math.min(1, (lt - 4.6) / .5) : 0;
  }

  /* ── 진행 ── */
  var DRAW = { hook: hookDraw, game: gameDraw, how: howDraw, prize: prizeDraw, rank: rankDraw, close: closeDraw };
  var HOSTS = { hook: ["hs1"], prize: ["pz-h"], close: ["cl-t"] };
  function enter(id, now) {
    if (PLAY.id) exit(PLAY.id);
    PLAY.id = id; PLAY.t0 = now;
    var s = el(id); s.classList.add("on");
    if (id === "game") gameBegin(PLAY.loops);
    if (id === "rank") rankBegin();
  }
  function exit(id) {
    var s = el(id); s.classList.remove("on");
    var a = s.querySelectorAll(".in"); for (var i = 0; i < a.length; i++) a[i].classList.remove("in");
    (HOSTS[id] || []).forEach(function (h) { dotOn(h, "", 0, {}, false); });
    if (id === "game") $("g-words").innerHTML = "";
    if (id === "rank") rankEnd();
  }
  function nextScene(now) {
    if (SOLO) { PLAY.loops++; enter(SOLO, now); return; }
    PLAY.i++;
    if (PLAY.i >= PLAY.list.length) { PLAY.i = 0; PLAY.loops++; PLAY.list = closed() ? PL_DONE : PL_OPEN; }
    enter(PLAY.list[PLAY.i], now);
  }
  function startAt(t, now) {   /* t = 루프 안 위치(초) */
    PLAY.list = closed() ? PL_DONE : PL_OPEN;
    if (SOLO) { enter(SOLO, now - (t || 0)); return; }
    var tot = PLAY.list.reduce(function (a, id) { return a + DUR[id]; }, 0), r = ((t || 0) % tot + tot) % tot, i = 0;
    while (r >= DUR[PLAY.list[i]]) { r -= DUR[PLAY.list[i]]; i++; }
    PLAY.i = i; enter(PLAY.list[i], now - r);
  }
  var last = 0, START = 0, RAF = 0, PAUSED = false, PAUSE_AT = 0, IO_VIS = true;
  function frame(ms) {
    RAF = 0; if (PAUSED) return;
    RAF = requestAnimationFrame(frame);
    var now = ms / 1000;
    if (!last) PLAY.t0 += now - START;   /* 첫 프레임 = 루프 시작 위치를 그때에 맞춘다(글꼴 · 그림 받느라 늦어도) */
    fit();
    if (PLAY.frozen) { PLAY.t0 += now - (last || now); last = now; }
    else last = now;
    if (now - PLAY.t0 > 30) PLAY.t0 = now;   /* 화면이 오래 가려졌다 돌아오면 그 장면 처음부터 */
    var lt = now - PLAY.t0;
    if (lt >= DUR[PLAY.id]) { nextScene(now); lt = 0; }
    try { revealAt(el(PLAY.id), lt); DRAW[PLAY.id](lt); } catch (e) { if (window.console) console.error(e); }
    TY.loops = PLAY.loops; TY.scene = PLAY.id;
  }
  var TY = window.__ty = { loops: 0, scene: "", rk: RK, rs: RS, play: PLAY, demoStep: demoStep, poll: function () { poll(); }, go: function (id) { SOLO = DUR[id] ? id : ""; enter(SOLO || PLAY.list[0], performance.now() / 1000); } };

  /* 홍보 칸 · 화면 밖이거나 탭이 가려지면 그리기를 멈추고 보이면 그 자리에서 잇는다 */
  function pauseSet(p) {
    if (p === PAUSED) return;
    var now = performance.now() / 1000; PAUSED = p;
    if (p) { PAUSE_AT = now; if (RAF) cancelAnimationFrame(RAF); RAF = 0; return; }
    if (!last) START += now - PAUSE_AT; else PLAY.t0 += now - PAUSE_AT;
    if (!RAF) RAF = requestAnimationFrame(frame);
  }
  TY.paused = function () { return PAUSED; };
  if (PROMO) {
    body.classList.add("promo");
    document.addEventListener("visibilitychange", function () { pauseSet(document.hidden || !IO_VIS); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { IO_VIS = es[es.length - 1].isIntersecting; pauseSet(document.hidden || !IO_VIS); }, { threshold: 0 }).observe(document.documentElement);
    document.addEventListener("click", function () { try { if (window.parent && window.parent !== window) window.parent.postMessage({ axfTy: "tap" }, location.origin); } catch (e) {} });
  }

  /* ── 조작 · 전체 화면 · 꺼짐 방지(홍보 칸에서는 모두 끔) ── */
  function fs() { var d = document.documentElement; try { if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen(); } catch (e) {} }
  if (!PROMO) document.addEventListener("click", function (ev) { if (!ev.target.closest || !ev.target.closest("#ctl")) fs(); });
  var ptrT = null;
  if (!PROMO) document.addEventListener("mousemove", function () { body.classList.add("ptr"); clearTimeout(ptrT); ptrT = setTimeout(function () { body.classList.remove("ptr"); }, 3000); });
  var SCN = ["hook", "game", "how", "prize", "rank", "close"];
  if (!PROMO) document.addEventListener("keydown", function (ev) {
    var k = ev.key;
    if (k >= "1" && k <= "6") TY.go(SCN[+k - 1]);
    else if (k === "0") { SOLO = ""; startAt(0, performance.now() / 1000); }
    else if (k === "f" || k === "F") fs();
    else if (k === "c" || k === "C") body.classList.toggle("ctl");
  });
  var WL = null;
  function wake() { try { if (navigator.wakeLock && !WL && !document.hidden) navigator.wakeLock.request("screen").then(function (l) { WL = l; l.addEventListener("release", function () { WL = null; }); }, function () {}); } catch (e) {} }
  if (!PROMO) { document.addEventListener("visibilitychange", wake); wake(); }
  if (Q.ctl === "1" && !PROMO) body.classList.add("ctl");
  if (Q.freeze === "1") PLAY.frozen = true;
  if (Q.cap === "1") body.classList.add("cap");   /* 캡처용 · ?t= 위치에서 멈춤 */
  if (!PROMO) (function ctl() {
    var c = $("ctl"), h = "<b>타자왕 순위판</b><div>장면: ";
    [["hook", "후킹"], ["game", "게임"], ["how", "하는 법"], ["prize", "상품"], ["rank", "순위"], ["close", "마감"]].forEach(function (a) { h += '<button data-go="' + a[0] + '">' + a[1] + "</button>"; });
    h += '</div><div><button data-go="">전체 루프</button> <button id="bFz">일시정지</button> <button id="bPoll">지금 받기</button></div><div id="ctlS"></div>';
    c.innerHTML = h;
    c.onclick = function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-go")) { var g = b.getAttribute("data-go"); if (g) TY.go(g); else { SOLO = ""; startAt(0, performance.now() / 1000); } }
      if (b.id === "bFz") { PLAY.frozen = !PLAY.frozen; b.classList.toggle("on", PLAY.frozen); }
      if (b.id === "bPoll") poll();
    };
    setInterval(function () { if (!body.classList.contains("ctl")) return; var d = RK.data; $("ctlS").textContent = "서버 " + (DEMO ? "데모" : RK.srv ? RK.srv.replace(/^https:\/\//, "").split("/")[0] : "없음") + " · 받기 " + RK.polls + " · 실패 " + RK.fails + " · " + (d ? d.top.length + "명 · " + (d.unit || "단위 없음") : "자료 없음") + " · 한국 " + p2(Math.floor(kstSec() / 3600)) + ":" + p2(Math.floor(kstSec() / 60) % 60) + (closed() ? " · 마감 뒤" : ""); }, 1000);
  })();

  if (DEMO) { body.classList.add("demo"); DM.n = 0; demoStep(); RS.shown = keyed(RK.data.top).map(function (r) { return { key: r.key, name: r.name, score: r.score, rank: r.rank }; }); demoStep(); }   /* 데모 첫 순위 장면부터 NEW RECORD 가 보이게 */
  START = performance.now() / 1000; startAt(Q.t ? parseFloat(Q.t) : 0, START);
  RAF = requestAnimationFrame(frame);
  if (!PROMO) setTimeout(poll, DEMO ? 20000 : Math.floor(Math.random() * 3000));
})();
