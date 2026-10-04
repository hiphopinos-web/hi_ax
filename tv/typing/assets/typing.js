/* 1F 타자왕 TV 광고 루프 · 스탠바이미 세로 TV (261004 재구성 · 사용자 「타자왕 광고 여기서 진행해」 · 같은 날 「너무 정신 없다 · 적정한 속도」 · 순위 게임처럼 공개)
 * 운영 안내 = 디자인 시안/사이니지/운영 안내.md
 * 장면(초) = 광고 18 · 상품 5 · 순위 16 = 39 · 행사일(2026-10-26) 17:00(한국 시간) 뒤 = 최종 순위 16 · 상품 5 = 21 · 화면 위 「AX 타자왕 · 1F」는 늘 그 자리
 *   광고 = 후킹 0~2.6(「당신의 프롬프트 입력 실력은?」이 쳐진다) · 실제 게임 몽타주 2.6~14.2 · 행동 14.2~18(「1F 로비 노트북에서 도전」이 쳐지고 앱 QR → 노트북 카메라 → SPACE)
 *   와르르 전환(261004 사용자 「벽돌이 와르르 무너지듯」) = 후킹 → 게임 · 게임(PERFECT) → 행동 · 행동 → 상품 · 나가는 장면을 캔버스 한 장(#fx)에 그린 뒤 도트 3×2칸 벽돌(약 290개)로 나눠 위 줄부터 중력으로 떨어뜨린다(0.95초) ·
 *     게임 안 연출(CLOUD CLEAR → BONUS 도트 전환)은 그대로 · 상품 → 순위 · 순위 → 광고는 그냥 바뀐다(전환 종류를 하나로)
 *   몽타주 = 실제 게임 엔진(../../assets/rain-engine.js)의 그리기 함수(rgDraw · rgTransDraw · rtPanel …)로 지금 게임(v5.42)과 같은 그림 · 실제 게임에 가까운 속도 · 컷 세 개 ·
 *     ① 구름에서 비 · Enter 없이 터지는 단어 다섯 개(4.2초) ② CLOUD CLEAR → 도트 전체 전환 → 주황 띠 BONUS STAGE(3초) ③ 밤 무대 문장 + 밑줄 따라 쓰기 → PERFECT(4.4초) → 와르르로 행동 장면
 *     문장 · 핵심 단어 = RAIN_BONUS_LINES({ s, w }) 그대로 · 단어 점수 = 엔진 식 · 문장 점수 = rgBonusScore · 엔진을 못 읽으면 몽타주 없이 후킹 · 행동만
 *   상품 = 세 상품을 한 번에(같은 어두운 판 + 얇은 오렌지 선 · 순위 숫자만 오렌지 · 1위만 밝게) · 「1~3위 시상 · 17:00 마감」
 *   순위 = 등수 · 점수가 위에서부터 펼쳐진다(1.2초) → 10위부터 위로 한 줄씩 이름이 게임처럼 쳐지고(커서) 다 쳐지면 이름표가 팡 터지며 이름이 남는다(엔진 rgBurst · rgFx) ·
 *     4~10위 0.75초씩 · 3위 1.2 · 2위 1.3 · 1위 1.9(가장 크게 · 판 흔들림) · 끝난 표는 그대로 남아 읽힌다 · 마지막 2.5초 「다음 이름은 당신」(마감 뒤 = 최종 순위 · 「1~3위 Outro 시상」)
 * 데이터 = 공개 액션 type_rank(mode site · n 10 · 읽기 전용) · JSONP · 주소 = ../../assets/server.js 의 AXF_SERVER(?srv= 로 바꿈) · 응답 moved 가 오면 새 주소로
 *   TV 30초마다 · 실패하면 60 → 120초(+0~5초 지터) · 화면이 가려지면 멈추고 보이면 곧바로 · 마지막 응답은 기기에 저장(새로 고쳐도 바로 보인다)
 *   unit = pts → 「n점」 · cs → 「n.n초」 · 없음 → 숫자만
 * 순위 변동 = 직전 순위 장면에서 보여 준 판과 비교(서버 변경 없음) · 새 이름 · 오른 점수 = 그 줄이 쳐진 뒤 반짝 + NEW
 * 마감 = 행사일(EVENT_DAY 2026-10-26) 17:00 한국 시간 뒤만(261004 · 그 전 날짜에는 17:00 이 지나도 마감 아님) · 시계 = 응답 now(ms)가 있으면 서버 시계 · 없으면 기기 시계
 * 주소 뒤 값: ?demo=1 서버 없이 가짜 순위(20초마다 바뀜) · ?srv=주소 · ?now=13:20(오늘) · ?now=10-26T17:01 · ?now=2026-10-25T18:00 시계 흉내(한국 시간) · ?day=2026-10-26 행사일 · ?close=17:00 마감 시각 · ?after=1 마감 뒤 루프
 *   ?scene=ad|prize|rank 한 장면만 · ?t=초 루프 시작 위치 · ?freeze=1 그 자리에서 멈춤 · ?cap=1 전환 없이 · ?prz4=문구 4~10위 상품 줄 · ?ctl=1 조작판
 *   ?open=1 시각과 관계없이 늘 마감 전 순서(1층 둘러보기 타자왕 판 · 사용자 261003 「등수도」 → 순위 포함) · &rank=0 이면 순위 없이 광고 + 상품
 *   ?promo=1 참가자 앱 홍보 칸 · 광고 + 상품 23초 · 마감 뒤 = 상품만 · 서버 호출 0 · 기기 저장 안 씀 · 키 · 조작판 · 전체 화면 · 꺼짐 방지 끔 · 무음
 *     칸이 화면 밖이거나(IntersectionObserver) 탭이 가려지면 그리기를 멈추고 보이면 이어서 · 누르면 부모 창에 postMessage({ axfTy: "tap" })
 *   ?promo=1&rank=1 앱 「타자 순위」 칸용 가벼운 판 · 광고 + 상품 + 순위 10초(33초) · 순위부터 = &t=23 · 마감 뒤 = 최종 순위 + 상품 · type_rank 60초마다(실패 120 → 240초) · 홍보 칸 규칙 그대로
 * 키: 1 광고 · 2 상품 · 3 순위 · 0 전체 루프 · F 전체 화면 · C 조작판 */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var i = kv.indexOf("="); var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i)); Q[k] = i < 0 ? "1" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); });
  var OPEN = Q.open === "1";   /* 1층 둘러보기 타자왕 판 · 시각과 관계없이 마감 전 순서 */
  var PROMO = Q.promo === "1", PRANK = PROMO && Q.rank === "1", NORANK = !PROMO && Q.rank === "0";
  var DEMO = Q.demo === "1" && (!PROMO || PRANK), NET = !PROMO || PRANK, PRZ4 = Q.prz4 ? String(Q.prz4).slice(0, 40) : "";
  var body = document.body;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }
  function load(k, d) { if (PROMO || DEMO) return d; try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { if (DEMO || PROMO) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ── 화면 맞추기 · 1080×1920 판을 배율로 · 가로 TV = 가운데 + 양옆 도트 ── */
  var stage = $("stage"), FIT = "", K = 1;
  function fit() {
    var key = window.innerWidth + "x" + window.innerHeight; if (key === FIT) return; FIT = key;
    K = Math.min(window.innerWidth / 1080, window.innerHeight / 1920) || 1;
    stage.style.transform = "scale(" + K + ")";
    document.documentElement.style.setProperty("--dot", (36 * K).toFixed(2) + "px");
  }
  window.addEventListener("resize", fit); fit();

  /* ── 시계 · 한국 시간 · 마감 = 행사일 17:00 뒤만 ── */
  var SRV_OFF = 0, SIM_OFF = 0;
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function hms(s) { var m = String(s || "").split(":"); return (+m[0] || 0) * 3600 + (+m[1] || 0) * 60 + (+m[2] || 0); }
  function kstMs() { return Date.now() + SRV_OFF + SIM_OFF; }
  function kstSec() { return ((Math.floor(kstMs() / 1000) + 9 * 3600) % 86400 + 86400) % 86400; }
  function kstDay(ms) { return new Date(ms + 9 * 3600000).toISOString().slice(0, 10); }
  function kstAt(day, sec) { var d = day.split("-"); return Date.UTC(+d[0], +d[1] - 1, +d[2]) + (sec - 9 * 3600) * 1000; }
  var EVENT_DAY = /^\d{4}-\d{2}-\d{2}$/.test(Q.day || "") ? Q.day : "2026-10-26";
  if (Q.now) {   /* HH:MM(오늘) · MM-DD HH:MM · YYYY-MM-DD HH:MM(사이는 T 나 띄어쓰기) */
    var NM = /^(?:(\d{4})-)?(?:(\d{1,2})-(\d{1,2})[T ])?(\d{1,2}:\d{2}(?::\d{2})?)$/.exec(String(Q.now).trim());
    if (NM) { var nday = NM[2] ? (NM[1] || EVENT_DAY.slice(0, 4)) + "-" + p2(+NM[2]) + "-" + p2(+NM[3]) : kstDay(Date.now()); SIM_OFF = kstAt(nday, hms(NM[4])) - Date.now(); }
  }
  var CLOSE = Q.close ? hms(Q.close) : 17 * 3600, CLOSE_AT = kstAt(EVENT_DAY, CLOSE);
  function closed() { return Q.after === "1" || kstMs() >= CLOSE_AT; }
  var CLOSE_TXT = p2(Math.floor(CLOSE / 3600)) + ":" + p2(Math.floor(CLOSE / 60) % 60);

  /* ── 점 글자 ── */
  var DGS = {};
  function dotOn(host, text, h, o, show) {
    var e = $(host);
    if (show && !DGS[host] && typeof DotGlyph !== "undefined") { e.innerHTML = DotGlyph.svg(text, Object.assign({ h: h }, o || {})); e.style.display = "block"; DGS[host] = 1; }
    if (!show && DGS[host]) { e.innerHTML = ""; e.style.display = "none"; DGS[host] = 0; }
  }

  /* ════════ 데이터 ════════ */
  var RK = { data: load("axfTy.last", null), fails: 0, timer: null, busy: false, polls: 0, srv: "", want: false };
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
  var POLL_MS = PRANK ? 60000 : 30000, POLL_MAX = PRANK ? 240000 : 120000;   /* 앱 칸(폰 수백 대)은 60초 이상 */
  function next(ms) { clearTimeout(RK.timer); RK.timer = null; if (!document.hidden) RK.timer = setTimeout(poll, ms); }
  function poll() {
    clearTimeout(RK.timer); RK.timer = null;
    if (!NET) return;   /* 홍보 칸(?promo=1 · 순위 없음) = 서버를 부르지 않는다 */
    if (document.hidden || RK.busy) return;
    if (PAUSED) { RK.want = true; return; }   /* 칸이 화면 밖 · 보이면 그때 */
    if (DEMO) { demoStep(); RK.polls++; next(20000); return; }
    RK.busy = true;
    jsonp({ action: "type_rank", mode: "site", n: 10 }, function (res) {
      RK.busy = false;
      if (res && res.ok) { RK.fails = 0; RK.polls++; body.classList.remove("off"); took(res); next(POLL_MS + (PRANK ? Math.floor(Math.random() * 5000) : 0)); }
      else { RK.fails++; if (RK.fails >= 2) body.classList.add("off"); next(Math.min(POLL_MAX, POLL_MS * Math.pow(2, Math.min(RK.fails, 2))) + Math.floor(Math.random() * 5000)); }
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
  var DUR = { ad: 18, prize: 5, rank: PRANK ? 10 : 16 };
  var PL_OPEN, PL_DONE;
  if (PRANK) { PL_OPEN = ["ad", "prize", "rank"]; PL_DONE = ["rank", "prize"]; }
  else if (PROMO || NORANK) { PL_OPEN = ["ad", "prize"]; PL_DONE = ["prize"]; }
  else { PL_OPEN = ["ad", "prize", "rank"]; PL_DONE = ["rank", "prize"]; }
  var ALIAS = { hook: "ad", game: "ad", how: "ad", close: "prize" }, SC0 = ALIAS[Q.scene] || Q.scene;
  var SOLO = DUR[SC0] && (PL_OPEN.indexOf(SC0) >= 0 || PL_DONE.indexOf(SC0) >= 0) ? SC0 : "";
  var PLAY = { list: PL_OPEN, i: 0, id: "", t0: 0, loops: 0, frozen: false };
  function el(id) { return $("s-" + id); }
  function revealAt(sc, lt) { var a = sc.querySelectorAll("[data-at]"); for (var i = 0; i < a.length; i++) { var on = lt >= +a[i].getAttribute("data-at"); if (a[i].classList.contains("in") !== on) a[i].classList.toggle("in", on); } }
  function cls(e, c, on) { if (e.classList.contains(c) !== !!on) e.classList.toggle(c, !!on); }

  /* ════════ 1 광고 ════════ */
  var ENG = typeof rgLayout === "function" && typeof rgDraw === "function" && typeof rgTransDraw === "function" && typeof rgBurst === "function" && typeof rgFx === "function" &&
    typeof rtPanel === "function" && typeof rtText === "function" && typeof rtStep === "function" && typeof rtFont === "function" && typeof rgPool === "function" && typeof rgCloudGeo === "function" && typeof rgBonusLim === "function" &&
    typeof RG === "object" && !!RG && typeof RAIN_TRANS === "object" && typeof RAIN_CLOUD === "object" && typeof RAIN_PAL === "object" && typeof RT_PAL === "object" &&
    typeof RAIN_BONUS_LINES !== "undefined" && RAIN_BONUS_LINES.some(function (x) { return x && x.s && x.w && x.w.length; });
  /* 몽타주 시각표(몽타주 시작 기준 초) · 실제 게임 전환 길이(RAIN_TRANS wipe 0.6 · title 1.6 · RAIN_CLOUD clear 1.4)에 가깝게 · 컷 세 개 */
  var MT = { clear: 4.2, win: 5.2, title: 5.7, wout: 7.2, type: 7.7, typed: 7.85, typeEnd: 10.0, res: 10.3, bin: 11.6, end: 11.6 };   /* 261004 PERFECT 뒤 = 와르르(옛 bin 도트 전환 0.6초 대신) */
  var T_HOOK = 2.6, T_ACT = ENG ? T_HOOK + MT.end : 6;   /* 엔진이 없으면 몽타주 없이 후킹 · 행동 */
  (function actAt() { var a = document.querySelectorAll("#act [data-off]"); for (var i = 0; i < a.length; i++) a[i].setAttribute("data-at", (T_ACT + +a[i].getAttribute("data-off")).toFixed(2)); })();

  function tpInit(host, lines, o) {   /* 글자 하나 = <i> · 줄 = <p> · o = 줄마다 주황 글자 번호 */
    var h = "", ch = [];
    lines.forEach(function (ln, li) { h += "<p>"; for (var i = 0; i < ln.length; i++) h += "<i" + ((o[li] || []).indexOf(i) >= 0 ? ' class="o"' : "") + ">" + (ln.charAt(i) === " " ? "&nbsp;" : esc(ln.charAt(i))) + "</i>"; h += "</p>"; });
    host.innerHTML = h;
    var a = host.querySelectorAll("i"); for (var j = 0; j < a.length; j++) ch.push(a[j]);
    return { host: host, ch: ch, total: ch.length, n: -1 };
  }
  function tpSet(T, n) {
    n = Math.max(0, Math.min(T.total, n));
    cls(T.host, "idle", n >= T.total);
    if (n === T.n) return;
    T.n = n;
    T.ch.forEach(function (c, i) { cls(c, "on", i < n); cls(c, "cur", i === n - 1); });
    var ps = T.host.children; for (var j = 0; j < ps.length; j++) cls(ps[j], "c0", n === 0 && j === 0);
  }
  /* 후킹 · 프롬프트 창에 질문이 한 글자씩 쳐진다 · 다 쳐진 뒤 1초 남짓 머물고 와르르 */
  var HK = tpInit($("hook"), ["당신의", "프롬프트", "입력 실력은?"], [[], [], [0, 1, 3, 4]]);
  var AH = tpInit($("act-h"), ["1F 로비 노트북에서 도전"], [[0, 1, 3, 4]]);
  function hookDraw(lt) {
    var on = lt < (ENG ? T_HOOK : T_ACT), hk = $("hook");   /* 그다음은 와르르가 덮는다 */
    cls(hk, "on", on); cls($("hook-k"), "on", on);
    if (on) tpSet(HK, Math.floor((lt - 0.2) / 0.085));
  }

  /* 행동 · 앱 QR → 노트북 카메라 → SPACE(눌림) → START */
  var QRM = [];   /* 와르르 전환이 같은 QR 을 다시 그린다 */
  function qrSvg(seed) {
    var n = 21, h = "", r = seed;
    function rnd() { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; }
    function fnd(x, y) { return (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var on;
      if (fnd(x, y)) { var lx = x > 13 ? x - 14 : x, ly = y > 13 ? y - 14 : y; on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4); }
      else on = rnd() > .52;
      if (on) { h += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02"/>'; QRM.push([x, y]); }
    }
    return '<svg viewBox="0 0 21 21" fill="#000" shape-rendering="crispEdges" aria-hidden="true">' + h + "</svg>";
  }
  $("qr").innerHTML = qrSvg(7);
  function actDraw(lt) {
    var a = $("act"), on = lt >= T_ACT;
    cls(a, "on", on);
    if (!on) return;
    var s = lt - T_ACT;
    tpSet(AH, Math.floor((s - 0.15) / 0.065));
    cls(a, "seen", s >= 2.25);
    cls(a, "dn", s >= 2.7 && s < 2.95);
  }

  /* 몽타주 · 실제 게임 엔진 그리기 함수로 · 논리 좌표 = 실제 노트북 게임판(폭 560) · 1.7배로 그린다 */
  var MS = 1.7, LW = 1080 / MS, LH = 1920 / MS, BW = 560, BH = 800, BX = Math.round((LW - BW) / 2), BY = 170, INH = 80, FRW = 10, NOW0 = 7000;
  var CV = $("cv"), CX = CV.getContext("2d"), BC = document.createElement("canvas"), BX2 = BC.getContext("2d"), MQ = 0;
  var MON = null, BL = null;
  var CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  function keys(s) {   /* 글자를 친 순서대로 · 한글은 초성 → 받침 없는 글자 → 받침 있는 글자 */
    var out = [], pre = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), c = ch.charCodeAt(0) - 0xAC00;
      if (c >= 0 && c < 11172) {
        var cho = Math.floor(c / 588), jung = Math.floor((c % 588) / 28), jong = c % 28;
        out.push(pre + CHO.charAt(cho)); if (jong) out.push(pre + String.fromCharCode(0xAC00 + cho * 588 + jung * 28));
      }
      pre += ch; out.push(pre);
    }
    return out;
  }
  function typedAt(s, a, b, m) { if (m < a) return ""; if (m >= b) return s; var k = keys(s); return k[Math.min(k.length - 1, Math.floor((m - a) / (b - a) * k.length))]; }
  function wPts(w, combo) { return Math.round(w.length * 10 * (1 + 0.2 * Math.min(combo - 1, 10))); }   /* 엔진 rgSubmit 과 같은 식 */
  function monBegin(k) {
    if (!ENG) return;
    RG.mode = "site"; RG.big = true; RG.stage = 1; RG.bonusOn = true; RG.cloudN = 1; RG.cloudAt = Infinity; RG.lives = RG.lives0 = 5;
    RG.wait = false; RG.cd = 0; RG.ending = null; RG.banner = null; RG.race = null; RG.t0 = 0; RG.parts = []; RG.pops = []; RG.shot = null; RG.shake = 0; RG.words = []; RG.typed = "";
    if (!BL) BL = rgLayout(BW, BH, true, false);
    RG.L = BL;
    RG.mas = { x: BW / 2, tx: BW / 2, hop: 0, set: true };
    var LNS = RAIN_BONUS_LINES.filter(function (x) { return x && x.s && x.w && x.w.length; }), ln = LNS[k % LNS.length];
    var pool = rgPool().filter(function (w) { return ln.w.indexOf(w) < 0; }), pk = function (i) { return pool.length ? pool[(k * 7 + i * 11) % pool.length] : ln.w[i % ln.w.length]; };
    var wk = function (i) { return ln.w[i % ln.w.length]; }, txt = [wk(0), pk(0), wk(1), pk(1), wk(2)];
    /* 실제 게임에 가까운 속도 · 단어 하나 약 0.9초에 쳐서 터뜨린다 · 낙하 5초(현장 1단계 7.2초의 구름 아래 출발분) · 판에 단어 네 개 남짓 */
    var S = [-3.2, -2.3, -1.4, -0.5, 0.4], H = [0.7, 1.55, 2.4, 3.25, 4.05], FX = [0.12, 0.85, 0.4, 0.95, 0.55], F = 5.0;
    BX2.font = rtFont(BL.tf);
    var C0 = 3, combo = C0, score = 2340, ws = [];
    MON = { k: k, ln: ln, lim: rgBonusLim(ln.s.length), ws: ws, fm: -9, F: F, n: 14 };
    txt.forEach(function (t, i) {
      var bw = Math.ceil(BX2.measureText(t).width) + BL.padX * 2;
      monCloud(S[i]); var G = rgCloudGeo(BL, NOW0 + S[i] * 1000), lo = Math.max(8, G.left), hi = Math.max(lo, Math.min(BL.W - 8 - bw, G.right - bw));
      combo++; var p = wPts(t, combo); score += p;
      ws.push({ text: t, bw: bw, x: Math.round(lo + FX[i] * (hi - lo)), y0: Math.max(BL.top, G.bottom - BL.boxH), s: S[i], h: H[i], a: i ? H[i - 1] + 0.12 : -0.1, pts: p, combo: combo, sum: score, cl: true, fall: F });
    });
    MON.score0 = 2340; MON.wordEnd = score; MON.combo0 = C0;
    var left = MON.lim - (MT.res - MT.type);
    MON.res = typeof rgBonusScore === "function" ? rgBonusScore(ln.s, ln.s, "enter", left) : { ok: ln.s.length, n: ln.s.length, perfect: true, sec: Math.floor(left), pts: 0 };
    MON.left = left;
    monFxReset(0);
  }
  function monSeq(m) { return Math.max(0, Math.ceil(7 * (1 - (m + 0.6) / 1.0))); }   /* 구름에 남은 단어 · 다 내리면 작고 옅어진다 */
  function monCloud(m) {
    var c = RG.cloud && RG.cloud.no === 1 && RG.cloud.mon ? RG.cloud : (RG.cloud = { no: 1, mon: true, text: "", keys: [], seq: [], n: 14, puff: 0 });
    if (MON) { c.text = MON.ln.s; c.keys = MON.ln.w.slice(); }
    var n = monSeq(m); while (c.seq.length > n) c.seq.pop(); while (c.seq.length < n) c.seq.push("");
    var last = -9; if (MON) MON.ws.forEach(function (w) { if (w.s <= m) last = Math.max(last, w.s); });
    c.puff = Math.max(0, PUFF - (m - last));
    return c;
  }
  var PUFF = typeof RAIN_CLOUD_FX === "object" && RAIN_CLOUD_FX ? RAIN_CLOUD_FX.puff : 0.32;
  function monFxReset(m) { RG.parts = []; RG.pops = []; RG.shot = null; RG.shake = 0; RG.mas.x = RG.mas.tx = BW / 2; RG.mas.hop = 0; MON.fm = m; }
  function monHit(w) {
    var L = BL, cx = w.x + w.bw / 2, cy = w.y0 + Math.min(1, (w.h - w.s) / w.fall) * Math.max(10, L.floor - L.boxH - w.y0) + L.boxH / 2;
    RG.mas.tx = Math.max(L.masW / 2, Math.min(L.W - L.masW / 2, cx)); RG.mas.hop = 0.25;
    RG.shot = { x0: RG.mas.tx, y0: L.ground - L.masH, x1: cx, y1: cy, t: 0.12 };
    rgBurst(cx, cy, 16, [RAIN_PAL.o100, RAIN_PAL.ink, RAIN_PAL.w, RAIN_PAL.o50]);
    RG.pops.push({ x: cx, y: cy, text: "+" + w.pts, t: 0.8, c: RAIN_PAL.w, s: 14 });
    if (w.combo >= 3) RG.pops.push({ x: cx, y: cy - 36, text: "COMBO x" + w.combo, t: 0.9, c: RAIN_PAL.o60, s: 16 });
    RG.shake = Math.max(RG.shake, 0.06);
  }
  function monFx(m) {   /* 터짐 · 파편 · 팝 · 챗봇 = 시간을 따라 쌓는다 · 건너뛰면(캡처 · 되감기) 0.6초 앞부터 다시 */
    if (m < MON.fm || m - MON.fm > 0.3) monFxReset(Math.max(-0.2, m - 0.6));
    var guard = 0;
    while (MON.fm < m && guard++ < 200) {
      var dt = Math.min(1 / 60, m - MON.fm), m1 = MON.fm + dt;
      MON.ws.forEach(function (w) { if (w.h > MON.fm && w.h <= m1) monHit(w); });
      rgFx(dt);
      if (RG.shot) { RG.shot.t -= dt; if (RG.shot.t <= 0) RG.shot = null; }
      if (RG.shake > 0) RG.shake -= dt;
      if (RG.mas.hop > 0) RG.mas.hop -= dt;
      RG.mas.x += (RG.mas.tx - RG.mas.x) * Math.min(1, dt * 8);
      if (!(RG.mas.hop > 0)) RG.mas.tx += (BL.W / 2 - RG.mas.tx) * Math.min(1, dt * 1.5);
      MON.fm = m1;
    }
  }
  function monState(m) {   /* 몽타주 시각 m → 엔진 상태(RG) · 보너스 단계는 엔진 이름 그대로(clear · win · title · wout · type · res · bin) */
    var T = RAIN_TRANS, g = MON, ln = g.ln, combo = g.combo0, score = g.score0, typed = "";
    RG.words = [];
    g.ws.forEach(function (w) {
      if (w.h <= m) { combo = w.combo; score = w.sum; return; }
      if (w.s <= m) RG.words.push({ text: w.text, bw: w.bw, x: w.x, y0: w.y0, p: (m - w.s) / w.fall, fall: w.fall, cl: true });
      if (!typed && m >= w.a) typed = typedAt(w.text, w.a, w.h, m);
    });
    RG.combo = combo; RG.typed = m < MT.clear ? typed : ""; RG.stage = 1;
    monCloud(m);
    var b = null, ph = "";
    if (m >= MT.clear) {
      b = { text: ln.s, keys: ln.w, lim: g.lim, left: g.lim, ph: "", t: 0, at: 0, typed: "", res: null, no: 1, go: 0 };
      if (m < MT.win) { ph = "clear"; b.t = RAIN_CLOUD.clear * (1 - (m - MT.clear) / (MT.win - MT.clear)); }
      else if (m < MT.title) { ph = "win"; b.t = T.wipe * (1 - (m - MT.win) / (MT.title - MT.win)); }
      else if (m < MT.wout) { ph = "title"; b.t = T.title - (m - MT.title); }
      else if (m < MT.type) { ph = "wout"; b.t = T.wipe * (1 - (m - MT.wout) / (MT.type - MT.wout)); }
      else if (m < MT.res) { ph = "type"; b.go = Math.max(0, RAIN_CLOUD.go - (m - MT.type)); b.left = g.lim - (m - MT.type); b.typed = typedAt(ln.s, MT.typed, MT.typeEnd, m); }
      else if (m < MT.bin) { ph = "res"; b.left = g.left; b.typed = ln.s; b.res = g.res; b.t = 1; }
      else { ph = "bin"; b.left = g.left; b.typed = ln.s; b.res = g.res; b.t = T.wipe * Math.max(0, 1 - (m - MT.bin) / (MT.end - MT.bin)); }
      b.ph = ph;
      score = g.wordEnd + (m >= MT.res ? Math.round(g.res.pts * ease((m - MT.res) / 0.8)) : 0);
    }
    RG.bonus = b; RG.score = score;
    return ph;
  }
  function monSize() {
    var q = Math.max(0.5, Math.min(2, K * (window.devicePixelRatio || 1)));
    q = Math.round(q * 20) / 20;
    if (q === MQ) return; MQ = q;
    CV.width = Math.round(1080 * q); CV.height = Math.round(1920 * q);
    BC.width = Math.round(BW * MS * q); BC.height = Math.round(BH * MS * q);
  }
  function monFrame(ctx, now) {   /* 판 밖 · 점수 판 · 게임판 틀(먹 · O100 · 먹) · 입력칸 · 실제 게임 왼쪽 판 · 입력칸과 같은 문법 */
    var x = BX - FRW, y = BY - FRW, w = BW + 2 * FRW, h = BH + INH + 2 * FRW;
    rtPanel(ctx, x, 92, w, 64, 2, RT_PAL.night);
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    rtText(ctx, "점수", x + 20, 124, 32, RT_PAL.tan, null);
    ctx.textAlign = "right"; rtText(ctx, RG.score.toLocaleString("en-US"), x + 300, 124, 32, RAIN_PAL.o100, RAIN_PAL.ink);
    if (typeof rgSideHearts === "function") rgSideHearts(ctx, x + w - 20, 124, 4);
    rtStep(ctx, x, y, w, h, 2, RAIN_PAL.ink);
    rtStep(ctx, x + 3, y + 3, w - 6, h - 6, 2, RAIN_PAL.o100);
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
    ctx.fillStyle = RT_PAL.bark; ctx.fillRect(BX, BY + BH, BW, INH);
    if (RG.bonus) return;   /* 보너스 동안 입력칸은 보이지 않는다(엔진 rgFormBns) */
    var ix = BX + 14, iy = BY + BH + 12, iw = BW - 28, ih = 56;
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(ix, iy, iw, ih);
    ctx.fillStyle = RT_PAL.cream; ctx.fillRect(ix + 3, iy + 3, iw - 6, ih - 6);
    ctx.textAlign = "left"; ctx.font = rtFont(32);
    var tv = RG.typed || "", tw = Math.ceil(ctx.measureText(tv).width);
    rtText(ctx, tv, ix + 16, iy + ih / 2, 32, RT_PAL.bark, null);
    if (Math.floor(now / 400) % 2 === 0) { ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(ix + 18 + tw, iy + 12, 4, ih - 24); }
  }
  function monDraw(m) {
    monSize(); monFx(m);
    var ph = monState(m), now = NOW0 + m * 1000, b = RG.bonus;
    if (ph !== "title") {   /* 게임판 = 엔진 rgDraw 그대로 · 전체 화면 전환(rgTransDraw)은 판이 아니라 화면 전체에 따로 그린다 */
      var keep = b ? { ph: b.ph, t: b.t } : null;
      if (b) { if (ph === "win") { b.ph = "clear"; b.t = 0; } else if (ph === "wout") b.ph = "intro"; else if (ph === "bin") b.ph = "res"; }
      RG.L = BL; RG.dpr = MS * MQ;
      BX2.setTransform(1, 0, 0, 1, 0, 0); BX2.clearRect(0, 0, BC.width, BC.height);
      rgDraw(BX2, now);
      if (keep) { b.ph = keep.ph; b.t = keep.t; }
    }
    var c = CX;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, CV.width, CV.height);
    c.setTransform(MS * MQ, 0, 0, MS * MQ, 0, 0); c.imageSmoothingEnabled = false;
    monFrame(c, now);
    if (ph !== "title") c.drawImage(BC, BX, BY, BW, BH);
    if (b) rgTransDraw(c, { CW: LW, CH: LH, big: true, W: LW });
  }
  var CV_ON = false;
  function cvOn(on) { if (on !== CV_ON) { CV_ON = on; cls(CV, "on", on); } }
  function adDraw(lt) {
    hookDraw(lt); actDraw(lt);
    var m = lt - T_HOOK, on = ENG && !!MON && m >= 0 && m < MT.end;
    cvOn(on);
    if (on) monDraw(m);
  }

  /* ════════ 2 상품 ════════ */
  function prizeDraw(lt) {
    dotOn("pz-h", "PRIZE", 100, { anim: true, step: 30, total: 600 }, lt >= 0.05);
    cls($("pzs"), "in", lt >= 0.05);
  }
  if (PRZ4) { $("pz-x").textContent = "4~10위 · " + PRZ4; $("pz-x").style.display = "block"; }

  /* ════════ 3 순위 · 등수 · 점수 펼침 → 10위부터 위로 이름이 쳐지고 팡 · 줄 10개를 처음에 만들어 돌려 쓴다(하루 종일 켜 두어도 DOM 이 늘지 않게) ════════ */
  var POOL = [], NIL = [], RS = { shown: load("axfTy.shown", null), cur: [], ev: [], evm: {}, unit: "", at: 0 };
  var RV = { sch: [], end: 0, fm: 0, CAS: PRANK ? 0.07 : 0.12, R0: PRANK ? 1.0 : 1.9 };
  (function rankInit() {
    var host = $("hs-in"), i, e;
    for (i = 0; i < 10; i++) { e = document.createElement("div"); e.className = "hr nil" + (i % 2 ? " e" : ""); e.style.top = i * 108 + "px"; e.innerHTML = '<span class="no">' + (i + 1) + "</span>"; host.appendChild(e); NIL.push(e); }
    for (i = 0; i < 10; i++) {
      e = document.createElement("div"); e.className = "hr"; e.style.top = i * 108 + "px"; e.style.opacity = 0; e.style.left = "-1100px";
      e.innerHTML = '<span class="no"></span><span class="tag">NEW</span><span class="nm"><b class="nmv"></b><i class="ty"></i></span><span class="sc2"></span>';
      host.appendChild(e); POOL.push(e);
    }
  })();
  function keyed(top) { var seen = {}; return top.map(function (x, i) { var c = seen[x.name] = (seen[x.name] || 0) + 1; return { key: x.name + "#" + c, name: x.name, score: x.score, rank: i + 1 }; }); }
  function hsLong(s) { var u = 0; s = String(s || ""); for (var i = 0; i < s.length; i++) u += s.charCodeAt(i) < 0x1100 ? 0.5 : 1; return u > 9; }
  function rvDur(i) { return i >= 3 ? (PRANK ? 0.45 : 0.75) : i === 2 ? (PRANK ? 0.8 : 1.2) : i === 1 ? (PRANK ? 0.8 : 1.3) : (PRANK ? 1.2 : 1.9); }
  function rankPlan() {   /* 10위 → 1위 · a = 치기 시작 · b = 팡 · e = 다음 줄로 */
    var k = Math.min(10, RS.cur.length), t = RV.R0, sch = [];
    for (var i = k - 1; i >= 0; i--) { var d = rvDur(i); sch[i] = { a: t, b: t + d * (i === 0 ? 0.55 : 0.68), e: t + d }; t += d; }
    RV.sch = sch; RV.end = t;
  }
  function rankBegin() {
    var d = RK.data, cur = keyed(d ? d.top : []), prev = RS.shown, pm = {}, ev = [], evm = {};
    RS.unit = d ? d.unit : ""; RS.at = d ? d.at : 0;
    if (prev) prev.forEach(function (r) { pm[r.key] = r; });
    if (prev) cur.forEach(function (r) { var o = pm[r.key]; if (!o || r.score > o.score) { var x = { k: o ? (r.rank < o.rank ? "up" : "best") : "new", r: r }; ev.push(x); evm[r.key] = x; } });
    RS.cur = cur; RS.ev = ev; RS.evm = evm;
    rankPlan();
    POOL.forEach(function (e, i) {   /* 처음 자리 = 왼쪽 밖 · 한 줄씩 들어온다 · 이름은 비운 자리 */
      e.style.transition = "none"; e.style.left = "-1100px"; e.style.opacity = 0; e.className = "hr w";
      var r = cur[i];
      e.style.display = r ? "flex" : "none";
      if (!r) return;
      var c = e.children;
      c[0].textContent = i + 1;
      c[2].firstChild.textContent = r.name; c[2].lastChild.textContent = ""; c[2].classList.toggle("long", hsLong(r.name));
      c[3].textContent = scoreTxt(r.score, RS.unit);
      c[1].style.display = "none";
      e._ty = "";
    });
    void stage.offsetWidth;
    POOL.forEach(function (e) { e.style.transition = ""; });
    var done = closed() && !OPEN;
    $("hs-you").textContent = done ? "1~3위 Outro 시상" : "다음 이름은 당신";
    $("hs-end").textContent = done ? "기록 마감 · 17F 대강당" : CLOSE_TXT + " 마감";
    $("hs-you").classList.remove("in");
    RV.fm = -1; if (ENG) { RG.parts = []; RG.pops = []; RG.big = true; }
  }
  function rankEnd() { if (!RS.at) return; RS.shown = RS.cur.map(function (r) { return { key: r.key, name: r.name, score: r.score, rank: r.rank }; }); save("axfTy.shown", RS.shown); }
  var FXS = 2.4;   /* 순위 팡 = 게임 터짐을 2.4배로(먼 데서도 보이게) */
  function rvXY(i) {   /* 이름표 가운데 · 논리 좌표 */
    var ty = POOL[i].children[2].lastChild, w = ty.offsetWidth || 240;
    return { x: (64 + 8 + 34 + 116 + w / 2) / FXS, y: (410 + 8 + i * 108 + 54) / FXS };
  }
  function rvPop(i) {   /* 팡 · 엔진 터짐 그대로 · 1~3위는 크게 · 1위는 가장 크게 + 판 흔들림 */
    if (!ENG) return;
    var p = rvXY(i), C = [RAIN_PAL.o100, RAIN_PAL.ink, RAIN_PAL.w, RAIN_PAL.o50];
    if (i >= 3) { rgBurst(p.x, p.y, 18, C); return; }
    rgBurst(p.x, p.y, 28, C); rgBurst(p.x + 50, p.y, 14, [RAIN_PAL.o60, RAIN_PAL.w]);
    RG.pops.push({ x: p.x + 40, y: p.y - 24, text: (i + 1) + "위", t: 1.1, c: i ? RAIN_PAL.o60 : RAIN_PAL.o100, s: 16 });
    if (i === 0) { rgBurst(p.x - 60, p.y, 34, C); rgBurst(p.x + 110, p.y, 34, [RAIN_PAL.o100, RT_PAL.cream, RAIN_PAL.w]); rgBurst(p.x + 220, p.y, 28, C); var l = $("hs-list"); l.classList.remove("shk"); void l.offsetWidth; l.classList.add("shk"); }
  }
  function rankFx(lt) {
    if (!ENG) return;
    if (lt < RV.fm || lt - RV.fm > 0.3) { RG.parts = []; RG.pops = []; RV.fm = Math.max(0, lt - 0.6); }
    var guard = 0;
    while (RV.fm < lt && guard++ < 200) {
      var dt = Math.min(1 / 60, lt - RV.fm), t1 = RV.fm + dt;
      for (var i = 0; i < RV.sch.length; i++) { var s = RV.sch[i]; if (s && s.b > RV.fm && s.b <= t1) rvPop(i); }
      rgFx(dt); RV.fm = t1;
    }
    monSize();
    var c = CX;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, CV.width, CV.height);
    if (!RG.parts.length && !RG.pops.length) return;
    c.setTransform(FXS * MQ, 0, 0, FXS * MQ, 0, 0); c.imageSmoothingEnabled = false;
    RG.parts.forEach(function (p) { c.fillStyle = p.c; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); });
    c.textAlign = "center"; c.textBaseline = "middle";
    RG.pops.forEach(function (p) { rtText(c, p.text, p.x, p.y, 32, p.c, RAIN_PAL.ink); });
  }
  function rankDraw(lt) {
    if (!RS.cur.length && RK.data && RK.data.top.length && RS.at !== RK.data.at) rankBegin();   /* 빈 판으로 시작했는데 장면 도중 첫 응답이 왔다(켠 직후) */
    POOL.forEach(function (e, i) {
      var r = RS.cur[i]; if (!r) return;
      var shown = lt >= 0.1 + i * RV.CAS, s = RV.sch[i] || { a: 0, b: 0, e: 0 };
      var l = shown ? "0px" : "-1100px"; if (e.style.left !== l) { e.style.left = l; e.style.opacity = shown ? 1 : 0; }
      var st = lt < s.a ? " w" : lt < s.b ? " t" : "", x = RS.evm[r.key];
      var c = "hr" + (i < 3 ? " r" + (i + 1) : "") + (i % 2 ? " e" : "") + st + (i === 0 && lt >= s.b && lt < s.b + 1.3 ? " win" : "") + (x && i > 0 && lt >= s.b && lt < s.b + 1.8 ? " hot" : "");
      if (e.className !== c) e.className = c;
      if (st === " t") { var tv = typedAt(r.name, s.a, s.b - 0.1, lt); if (tv !== e._ty) { e._ty = tv; e.children[2].lastChild.textContent = tv; } }
      var tg = !st && x && x.k === "new" ? "block" : "none"; if (e.children[1].style.display !== tg) e.children[1].style.display = tg;
    });
    rankFx(lt);
    var sub = $("hs-sub"), txt, sc = "abs", done = closed() && !OPEN;
    if (!RS.cur.length) { txt = RK.data || !NET ? "첫 기록을 기다리고 있어요" : "순위를 불러오는 중"; sc += " em"; }
    else if (RS.ev.length && lt >= RV.end + 0.3 && lt < DUR.rank - 2.5) { var x2 = RS.ev[0]; txt = (x2.k === "up" ? "RANK UP · " : "NEW RECORD · ") + x2.r.name + " " + x2.r.rank + "위"; sc += " nr"; }
    else txt = done ? "최종 순위 · 1F 현장" : "1F 현장 TOP 10";
    if (sub.textContent !== txt) sub.textContent = txt;
    if (sub.className !== sc) sub.className = sc;
    cls($("hs-you"), "in", lt >= DUR.rank - 2.5);
  }

  /* ════════ 와르르 전환(261004 사용자 「위에서부터 벽돌이 와르르 무너지듯」) ════════
   * 나가는 장면을 캔버스 SN 에 그대로 그린다(DOM 글자 · 상자는 실제 자리를 읽어 같은 글꼴로 · 게임은 그 캔버스를 복사) → 도트 3×2칸(108×72) 벽돌 약 290개 ·
   * 위 줄부터 0.024초씩 늦게 · 살짝 튀었다가(위로 40~180px/s) 중력(5,600px/s²)으로 떨어지며 옆으로 흩어지고 조금 돈다 · 0.95초 · 뒤에서 다음 장면이 이미 돌고 있다 */
  var FXC = $("fx"), FXX = FXC.getContext("2d"), SN = document.createElement("canvas"), SNX = SN.getContext("2d");
  var FW = { key: "", b: [], on: false, pend: false, dbg: false, Y0: 108, BW: 108, BH: 72, D: 0.95, G: 5600 };
  function fxSize() { monSize(); if (FXC.width !== CV.width || FXC.height !== CV.height) { FXC.width = SN.width = CV.width; FXC.height = SN.height = CV.height; } }
  function sxy(e) { var r = e.getBoundingClientRect(), S = stage.getBoundingClientRect(); return { x: (r.left - S.left) / K, y: (r.top - S.top) / K, w: r.width / K, h: r.height / K }; }
  function fnt(c, e) { var cs = getComputedStyle(e); c.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily; return cs; }
  function asc(c, t, px) { var m = c.measureText(t || "가"); return { a: m.fontBoundingBoxAscent || px * 0.93, d: m.fontBoundingBoxDescent || px * 0.24 }; }
  function txIn(c, e, t) {   /* 줄 안 글자(<i>) · 글자 상자 위 = 글꼴 윗선 */
    var cs = fnt(c, e), r = sxy(e), px = parseFloat(cs.fontSize), m = asc(c, t, px);
    c.fillStyle = cs.color; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillText(t, r.x, r.y + m.a);
    return { r: r, px: px, base: r.y + m.a, w: c.measureText(t).width };
  }
  function txBox(c, e, t, mid, sh) {   /* 상자 글자 · mid = 가로 가운데("v" = 세로도 상자 가운데) · 세로는 줄 높이 가운데 · sh = 그림자 색(6px) */
    var cs = fnt(c, e), r = sxy(e), px = parseFloat(cs.fontSize), m = asc(c, t, px), lh = parseFloat(cs.lineHeight) || (m.a + m.d), tw = c.measureText(t).width;
    var x = mid ? r.x + (r.w - tw) / 2 : r.x, y = mid === "v" ? r.y + (r.h - (m.a + m.d)) / 2 + m.a : r.y + (lh - (m.a + m.d)) / 2 + m.a;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    if (sh) { c.fillStyle = sh; c.fillText(t, x + 6, y + 6); }
    c.fillStyle = cs.color; c.fillText(t, x, y);
  }
  function cur(c, g) { c.fillStyle = "#FF7E31"; c.fillRect(g.r.x + g.w + 0.08 * g.px, g.base + 0.09 * g.px - 0.85 * g.px, 0.42 * g.px, 0.85 * g.px); }
  function paintTp(c, T) { var g = null; T.ch.forEach(function (e, i) { var r = txIn(c, e, e.textContent.replace(/ /g, " ")); if (i === T.total - 1) g = r; }); if (g) cur(c, g); }
  function snapBg(c) {
    c.setTransform(MQ, 0, 0, MQ, 0, 0);
    c.fillStyle = "#1B1712"; c.fillRect(0, 0, 1080, 1920);
    c.fillStyle = "#5E3218"; c.beginPath();
    for (var y = 18; y < 1920; y += 36) for (var x = 18; x < 1080; x += 36) { c.moveTo(x + 2.25, y); c.arc(x, y, 2.25, 0, 6.2832); }
    c.fill();
  }
  function paintHook(c) {
    var hk = $("hook"), kk = $("hook-k"), was = [hk.classList.contains("on"), kk.classList.contains("on")];
    cls(hk, "on", true); cls(kk, "on", true); tpSet(HK, HK.total);
    txBox(c, kk, kk.textContent);
    paintTp(c, HK);
    cls(hk, "on", was[0]); cls(kk, "on", was[1]); HK.n = -1;
  }
  function paintMon(c) {
    if (!MON) return;
    monDraw(MT.end - 0.001);
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(CV, 0, 0);
  }
  function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function paintAct(c) {
    var a = $("act"), fz = a.querySelectorAll("[data-at]"), was = a.classList.contains("on"), i;
    for (i = 0; i < fz.length; i++) { fz[i].style.transition = "none"; fz[i].classList.add("in"); }
    cls(a, "on", true); cls(a, "seen", true); cls(a, "dn", false); tpSet(AH, AH.total);
    paintTp(c, AH);
    ["ic1", "ic2", "ic3"].forEach(function (id) {
      var ic = $(id), b = sxy(ic.querySelector(".bx")), lb = ic.querySelector(".lb");
      rect(c, b.x, b.y - 4, b.w, 4, "#000"); rect(c, b.x, b.y + b.h, b.w, 4, "#000"); rect(c, b.x - 4, b.y, 4, b.h, "#000"); rect(c, b.x + b.w, b.y, 4, b.h, "#000");
      rect(c, b.x, b.y, b.w, b.h, "#5E3218"); rect(c, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#D9A066"); rect(c, b.x + 8, b.y + 8, b.w - 16, b.h - 16, "#2A2118");
      txBox(c, lb, lb.textContent, true);
    });
    var ph = sxy(a.querySelector(".phn")), sc = sxy(a.querySelector(".phn .scr")), qv = sxy(a.querySelector(".phn svg")), u = qv.w / 21;
    rect(c, ph.x - 8, ph.y - 8, ph.w + 16, ph.h + 16, "#E3B884"); rect(c, ph.x, ph.y, ph.w, ph.h, "#1B1712"); rect(c, sc.x, sc.y, sc.w, sc.h, "#F3E7D8");
    c.fillStyle = "#000"; QRM.forEach(function (q) { c.fillRect(qv.x + q[0] * u, qv.y + q[1] * u, u * 1.02, u * 1.02); });
    var nb = sxy(a.querySelector(".ntb")), cm = sxy(a.querySelector(".ntb .cam")), ok = a.querySelector(".ntb .ok");
    rect(c, nb.x - 30, nb.y + nb.h + 20, nb.w + 60, 24, "#E3B884"); rect(c, nb.x - 8, nb.y - 8, nb.w + 16, nb.h + 16, "#E3B884"); rect(c, nb.x, nb.y, nb.w, nb.h, "#1B1712");
    rect(c, cm.x - 8, cm.y - 8, cm.w + 16, cm.h + 16, "rgba(255,126,49,.35)"); rect(c, cm.x, cm.y, cm.w, cm.h, "#FF7E31");
    txBox(c, ok, ok.textContent, true);
    var ky = a.querySelector(".key"), k = sxy(ky);
    rect(c, k.x - 6, k.y + 10, k.w + 12, k.h + 12, "#7A3E1C"); rect(c, k.x - 6, k.y - 6, k.w + 12, k.h + 12, "#000"); rect(c, k.x, k.y, k.w, k.h, "#F3E7D8");
    txBox(c, ky, ky.textContent, "v");
    Array.prototype.forEach.call(a.querySelectorAll(".ar"), function (e) { var r = sxy(e); rect(c, r.x + 14, r.y + 28, 24, 24, "#FF7E31"); c.beginPath(); c.moveTo(r.x + 38, r.y + 16); c.lineTo(r.x + 38, r.y + 64); c.lineTo(r.x + 62, r.y + 40); c.closePath(); c.fill(); });
    var st = $("act-s"); txBox(c, st, st.textContent, true, "#D64524");
    for (i = 0; i < fz.length; i++) fz[i].style.transition = "";
    cls(a, "on", was); AH.n = -1;
  }
  function fxStart(key, paint) {
    fxSize();
    SNX.setTransform(1, 0, 0, 1, 0, 0); SNX.clearRect(0, 0, SN.width, SN.height);
    snapBg(SNX); paint(SNX); SNX.setTransform(1, 0, 0, 1, 0, 0);
    var b = [], r = 0, sd = 20261026;
    function rnd() { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff; }
    for (var y = FW.Y0; y < 1920; y += FW.BH, r++) for (var x = r % 2 ? -36 : 0; x < 1080; x += FW.BW) {
      var x0 = Math.max(0, x), w = Math.min(1080, x + FW.BW) - x0, h = Math.min(FW.BH, 1920 - y);
      b.push({ x: x0, y: y, w: w, h: h, d: r * 0.024 + rnd() * 0.04, vx: (rnd() - 0.5) * 260, vy: -(40 + rnd() * 140), va: (rnd() - 0.5) * 2.4 });
    }
    FW.b = b; FW.key = key; FW.dbg = false;
  }
  function fxDraw(t) {
    var c = FXX, q = MQ;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, FXC.width, FXC.height);
    if (!(t >= 0 && t < FW.D)) { cls(FXC, "on", false); return; }
    cls(FXC, "on", true);
    var mv = [];
    FW.b.forEach(function (b) {   /* 아직 안 떨어진 벽돌 = 제자리 · 떨어지는 벽돌은 그 위에 */
      var s = t - b.d;
      if (s <= 0) c.drawImage(SN, b.x * q, b.y * q, b.w * q, b.h * q, b.x * q, b.y * q, b.w * q, b.h * q); else mv.push([b, s]);
    });
    mv.forEach(function (m) {
      var b = m[0], s = m[1], dy = b.vy * s + 0.5 * FW.G * s * s;
      if (b.y + dy > 1990) return;
      c.setTransform(q, 0, 0, q, 0, 0); c.translate(b.x + b.w / 2 + b.vx * s, b.y + b.h / 2 + dy); c.rotate(b.va * s);
      c.drawImage(SN, b.x * q, b.y * q, b.w * q, b.h * q, -b.w / 2, -b.h / 2, b.w, b.h);
      c.globalAlpha = Math.min(1, s * 10); c.strokeStyle = "#000"; c.lineWidth = 3; c.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); c.globalAlpha = 1;
    });
  }
  function fxTick(id, lt) {   /* 지금 장면의 와르르 · 광고 안 둘(후킹 → 게임 · 게임 → 행동) + 상품 첫 0.95초(행동 → 상품) */
    if (FW.dbg) return;
    var tr = null;
    if (id === "ad" && ENG && MON) { if (lt >= T_HOOK && lt < T_HOOK + FW.D) tr = { k: "h", at: T_HOOK }; else if (lt >= T_ACT && lt < T_ACT + FW.D) tr = { k: "m", at: T_ACT }; }
    else if (id === "prize" && FW.pend && lt < FW.D) tr = { k: "a", at: 0 };
    if (!tr) { if (FW.on) { FW.on = false; fxDraw(-1); } return; }
    var key = id + PLAY.loops + tr.k + PLAY.t0.toFixed(2);
    if (tr.k !== "a" && FW.key !== key) fxStart(key, tr.k === "h" ? paintHook : paintMon);
    FW.on = true; fxDraw(lt - tr.at);
  }

  /* ── 진행 ── */
  var DRAW = { ad: adDraw, prize: prizeDraw, rank: rankDraw };
  var HOSTS = { prize: ["pz-h"] };
  function enter(id, now) {
    FW.pend = id === "prize" && PLAY.id === "ad" && T_ACT < DUR.ad;   /* 행동 → 상품 = 와르르 · 행동 장면이 아직 보일 때 그린다 */
    if (FW.pend) fxStart("prize" + PLAY.loops + "a" + now.toFixed(2), paintAct);
    if (PLAY.id) exit(PLAY.id);
    PLAY.id = id; PLAY.t0 = now;
    var s = el(id); s.classList.add("on");
    if (id === "ad") monBegin(PLAY.loops);
    if (id === "rank") { rankBegin(); cvOn(ENG); }
    if (id === "prize") $("pz-cl").textContent = closed() && !OPEN ? "기록 마감" : CLOSE_TXT + " 마감";
  }
  function exit(id) {
    var s = el(id); s.classList.remove("on");
    var a = s.querySelectorAll(".in"); for (var i = 0; i < a.length; i++) a[i].classList.remove("in");
    (HOSTS[id] || []).forEach(function (h) { dotOn(h, "", 0, {}, false); });
    if (id === "ad") cls($("act"), "on", false);
    if (id === "ad" || id === "rank") { cvOn(false); CX.setTransform(1, 0, 0, 1, 0, 0); CX.clearRect(0, 0, CV.width, CV.height); }
    if (id === "ad") HK.n = AH.n = -1;
    if (id === "rank") { rankEnd(); $("hs-list").classList.remove("shk"); }
  }
  function listNow() { return closed() && !OPEN ? PL_DONE : PL_OPEN; }
  function nextScene(now) {
    if (SOLO) { PLAY.loops++; enter(SOLO, now); return; }
    PLAY.i++;
    if (PLAY.i >= PLAY.list.length) { PLAY.i = 0; PLAY.loops++; PLAY.list = listNow(); }
    enter(PLAY.list[PLAY.i], now);
  }
  function startAt(t, now) {   /* t = 루프 안 위치(초) */
    PLAY.list = listNow();
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
    try { revealAt(el(PLAY.id), lt); DRAW[PLAY.id](lt); fxTick(PLAY.id, lt); } catch (e) { if (window.console) console.error(e); }
    TY.loops = PLAY.loops; TY.scene = PLAY.id; TY.lt = lt;
  }
  var TY = window.__ty = { loops: 0, scene: "", lt: 0, eng: ENG, dur: DUR, rv: RV, fw: FW, snap: function (k) { fxStart("dbg" + Math.random(), k === "a" ? paintAct : k === "m" ? paintMon : paintHook); FW.dbg = true; fxDraw(0); }, closed: closed, list: function () { return PLAY.list.slice(); }, rk: RK, rs: RS, play: PLAY, demoStep: demoStep, poll: function () { poll(); },
    go: function (id) { SOLO = DUR[id] ? id : ""; enter(SOLO || PLAY.list[0], performance.now() / 1000); } };

  /* 홍보 칸 · 화면 밖이거나 탭이 가려지면 그리기를 멈추고 보이면 그 자리에서 잇는다 */
  function pauseSet(p) {
    if (p === PAUSED) return;
    var now = performance.now() / 1000; PAUSED = p;
    if (p) { PAUSE_AT = now; if (RAF) cancelAnimationFrame(RAF); RAF = 0; return; }
    if (!last) START += now - PAUSE_AT; else PLAY.t0 += now - PAUSE_AT;
    if (!RAF) RAF = requestAnimationFrame(frame);
    if (RK.want) { RK.want = false; poll(); }
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
  var SCN = ["ad", "prize", "rank"];
  if (!PROMO) document.addEventListener("keydown", function (ev) {
    var k = ev.key;
    if (k >= "1" && k <= "3") TY.go(SCN[+k - 1]);
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
    var c = $("ctl"), h = "<b>타자왕 광고 루프</b><div>장면: ";
    [["ad", "광고"], ["prize", "상품"], ["rank", "순위"]].forEach(function (a) { h += '<button data-go="' + a[0] + '">' + a[1] + "</button>"; });
    h += '</div><div><button data-go="">전체 루프</button> <button id="bFz">일시정지</button> <button id="bPoll">지금 받기</button></div><div id="ctlS"></div>';
    c.innerHTML = h;
    c.onclick = function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-go")) { var g = b.getAttribute("data-go"); if (g) TY.go(g); else { SOLO = ""; startAt(0, performance.now() / 1000); } }
      if (b.id === "bFz") { PLAY.frozen = !PLAY.frozen; b.classList.toggle("on", PLAY.frozen); }
      if (b.id === "bPoll") poll();
    };
    setInterval(function () { if (!body.classList.contains("ctl")) return; var d = RK.data; $("ctlS").textContent = "서버 " + (DEMO ? "데모" : RK.srv ? RK.srv.replace(/^https:\/\//, "").split("/")[0] : "없음") + " · 받기 " + RK.polls + " · 실패 " + RK.fails + " · " + (d ? d.top.length + "명 · " + (d.unit || "단위 없음") : "자료 없음") + " · 한국 " + kstDay(kstMs()) + " " + p2(Math.floor(kstSec() / 3600)) + ":" + p2(Math.floor(kstSec() / 60) % 60) + (closed() ? " · 마감 뒤" : "") + (ENG ? "" : " · 엔진 없음"); }, 1000);
  })();

  if (DEMO) { body.classList.add("demo"); DM.n = 0; demoStep(); RS.shown = keyed(RK.data.top).map(function (r) { return { key: r.key, name: r.name, score: r.score, rank: r.rank }; }); demoStep(); }   /* 데모 첫 순위 장면부터 바뀐 줄이 보이게 */
  START = performance.now() / 1000; startAt(Q.t ? parseFloat(Q.t) : 0, START);
  if (document.fonts && document.fonts.load) try { document.fonts.load("32px NeoDunggeunmo"); } catch (e) {}
  RAF = requestAnimationFrame(frame);
  if (NET) setTimeout(poll, DEMO ? 20000 : Math.floor(Math.random() * 3000));
})();
