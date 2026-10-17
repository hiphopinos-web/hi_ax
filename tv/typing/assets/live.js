/* 1F 타자왕 실시간 송출 화면 (261017 사용자 결정 · ③단계 · 데이터 중계)
 * 게임 노트북 2대(자리 1 · 2)의 판 진행을 서버 소켓(tv 방)으로 받아 같은 엔진 그리기(../../assets/rain-engine.js 의 rgDraw)로 다시 그린다.
 * 프로토콜 = 디자인 시안/사이니지 명세/타자왕_실시간송출_프로토콜_261017.md 4절 · 운영 = 디자인 시안/사이니지/운영 안내.md 「타자왕 실시간 송출」
 *
 * 주소: tv/typing/?live=1 (+ &mode=auto|1|2|split · &seat=1|2 · &o=land|port · &test=1 · &delay=200)
 *   mode auto(기본) = 한 자리면 그 판을 크게 · 두 자리면 좌우(세로 TV 는 위아래) 분할 · 1 = 늘 한 판(두 자리면 나중에 시작한 판) · 2 · split = 늘 분할(빈 자리는 「대기」)
 *   seat = 그 자리만 따라간다(TV 두 대가 자리 하나씩 맡을 때) · o = 방향 고정(안 붙이면 화면 비율) · test = 테스트 사번 판(리허설)도 보인다 · delay = 사건 없는 진행의 재생 지연 ms(100~2000)
 *   ws = 소켓 주소 바꾸기(ws://127.0.0.1 · ws://localhost · wss://*.workers.dev 만) · 없으면 서버 주소(../../assets/server.js · &srv=)에서 만든다 · &demo=1 이면 ws 를 줄 때만 붙는다
 * 화면: 아무도 안 함 = 기존 광고 루프(typing.js) 그대로 · 판이 오면 광고 루프를 멈추고 중계 · 판 끝 = 결과(「N위 진입!」) 6초 → 두 자리 모두 끝나면 순위 장면부터 광고 루프
 *   끊김 = 자리마다 마지막 진행 뒤 15초 · 소켓이 끊긴 채 15초 · 「over」 뒤 15초 안에 결과가 없으면 조용히 내린다(오류 글자 없음) · QR 없음 · 사번 · 실명 없음(닉네임만)
 * 그리기 = 자리마다 엔진 상태(RG) 한 벌 · 그릴 때만 전역 RG 를 바꿔 끼우고 rgDraw 를 부른 뒤 되돌린다 · 판정 코드는 없다(받은 값을 그린다)
 * 보간 = 사건 없는 진행은 약 0.2초 늦게 · 사건(ev 1 또는 직전 진행과 맞힘 · 목숨 · 점수 · 단계 · 단어 · 입력 · 장면이 다름)은 받는 즉시 그린다(261017 지연 개선 · 옛 0.6초)
 *   단어 위치는 그 진행 이후 지금 시각까지 f(바닥까지 ms)로 앞질러 그린다(외삽 · hu = 목숨을 잃은 뒤 느려진 남은 ms) · 새 진행이 오면 어긋난 만큼을 0.18초에 걸쳐 녹인다
 * 서버 호출 추가 없음 · 순위(지금 N위)는 광고 루프가 30초마다 받는 type_rank TOP 10 과 비교 · 판 끝 결과는 화면의 TOP 10 에만 넣는다(다음 폴링이 정본으로 바로잡는다) */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var i = kv.indexOf("="); var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i)); Q[k] = i < 0 ? "1" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); });
  if (Q.live !== "1" || Q.promo === "1") return;
  var TY = window.__ty;
  var ENG = !!TY && typeof rgLayout === "function" && typeof rgDraw === "function" && typeof rgFx === "function" && typeof rgBurst === "function" && typeof rgWordY === "function" &&
    typeof rtFont === "function" && typeof rgBonusLim === "function" && typeof rgBonusScore === "function" && typeof rgClY0 === "function" && typeof RG === "object" && !!RG &&
    typeof RAIN_PAL === "object" && typeof RT_PAL === "object" && typeof RAIN_CLOUD === "object" && typeof RAIN_TRANS === "object" && typeof RAIN_BONUS === "object";
  if (!ENG) return;   /* 엔진이 없으면 광고 루프만 */

  var MODE = Q.mode === "1" ? 1 : (Q.mode === "2" || Q.mode === "split") ? 2 : 0;
  var ONLY = Q.seat === "1" ? 1 : Q.seat === "2" ? 2 : 0;
  var TEST = Q.test === "1";
  var DELAY = Math.max(100, Math.min(2000, parseInt(Q.delay, 10) || 200));   /* 261017 지연 개선 · 0.6 → 0.2초 · 사건은 기다리지 않는다 */
  var HURT_SLOW = typeof RAIN_SITE === "object" && RAIN_SITE && RAIN_SITE.hurtSlow > 0 ? RAIN_SITE.hurtSlow : 0.3;
  var DROP_MS = 15000, RESULT_MS = 6000, OVER_MS = 15000, MAX_LAG = 1500;
  var body = document.body;
  function $(id) { return document.getElementById(id); }
  function fmt(n) { return Math.round(n || 0).toLocaleString("en-US"); }
  function clip(s, n) { s = String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f]/g, ""); return s.length > n ? s.slice(0, n) : s; }
  function now() { return Date.now(); }

  /* ── 겉모습 · 스타일 한 장(assets/live.css) ── */
  var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "assets/live.css?v=261017"; document.head.appendChild(css);
  var LV = document.createElement("div"); LV.id = "lv"; LV.setAttribute("aria-hidden", "true");
  LV.innerHTML = '<div id="lvSt"><div id="lvHead"><b>AX 타자왕 · 1F</b><span><i></i>LIVE</span></div><div id="lvLine"></div></div>';
  body.appendChild(LV);
  var ST = $("lvSt"), HEAD = $("lvHead"), LINE = $("lvLine");

  /* 배치 · 논리 좌표(가로 1920×1080 · 세로 1080×1920) · bd = 게임판 [x, y, 판 폭, 판 높이](틀 10 · 입력칸 ih 는 판 아래) */
  var LAY = {
    land1: { W: 1920, H: 1080, head: true, seats: [{ x: 0, y: 0, w: 1920, h: 1080, bd: [96, 150, 760, 792], ih: 80, tag: [970, 150], nick: [970, 214, 860, 100, 84], scl: [970, 344], sc: [970, 384, 176], rk: [970, 580, 64, 120], life: [970, 744, 48], stg: [1830, 744, 48], race: [970, 836, 860, 62] }] },
    land2: { W: 1920, H: 1080, head: false, line: [956, 0, 8, 1080], seats: [
      { x: 0, y: 0, w: 956, h: 1080, bd: [148, 298, 660, 640], ih: 64, tag: [48, 40], nick: [212, 30, 696, 72, 60, 1], sc: [48, 118, 112], rk: [908, 128, 44, 80, "r"], life: [48, 250, 32], stg: [908, 250, 36] },
      { x: 964, y: 0, w: 956, h: 1080, bd: [148, 298, 660, 640], ih: 64, tag: [48, 40], nick: [212, 30, 696, 72, 60, 1], sc: [48, 118, 112], rk: [908, 128, 44, 80, "r"], life: [48, 250, 32], stg: [908, 250, 36] }] },
    port1: { W: 1080, H: 1920, head: true, seats: [{ x: 0, y: 0, w: 1080, h: 1920, bd: [110, 600, 860, 1090], ih: 80, tag: [64, 150], nick: [64, 214, 952, 96, 80], sc: [64, 330, 160], rk: [1016, 346, 56, 104, "r"], life: [64, 520, 44], stg: [1016, 520, 44] }] },
    port2: { W: 1080, H: 1920, head: false, line: [0, 956, 1080, 8], seats: [
      { x: 0, y: 0, w: 1080, h: 956, bd: [450, 34, 580, 790], ih: 64, tag: [48, 48], nick: [48, 116, 360, 64, 48], sc: [48, 200, 96], rk: [48, 340, 40, 72], life: [48, 470, 30], stg: [48, 530, 36, "l"] },
      { x: 0, y: 964, w: 1080, h: 956, bd: [450, 34, 580, 790], ih: 64, tag: [48, 48], nick: [48, 116, 360, 64, 48], sc: [48, 200, 96], rk: [48, 340, 40, 72], life: [48, 470, 30], stg: [48, 530, 36, "l"] }] }
  };
  var HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
  function heartSvg() { var h = ""; HEART.forEach(function (r, y) { for (var x = 0; x < 7; x++) if (r.charAt(x) === "X") h += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; }); return '<svg viewBox="0 0 7 6" shape-rendering="crispEdges">' + h + "</svg>"; }
  var HS = heartSvg();

  /* ── 자리 UI 한 벌 · 배치가 바뀌면 다시 만든다 ── */
  function uiMake(P, n, one) {
    var u = { P: P, n: n }, e = document.createElement("div");
    e.className = "lvSeat"; e.style.left = P.x + "px"; e.style.top = P.y + "px"; e.style.width = P.w + "px"; e.style.height = P.h + "px";
    var h = '<div class="lvTag"></div><div class="lvNick"></div>' + (P.scl ? '<div class="lvScl">점수</div>' : "") + '<div class="lvSc">0</div><div class="lvRk"></div>' +
      '<div class="lvLife">' + [0, 1, 2, 3, 4].map(function () { return '<i class="on">' + HS + "</i>"; }).join("") + '</div><div class="lvStg"></div>' + (P.race ? '<div class="lvRace"></div>' : "") +
      '<div class="lvBd"><canvas></canvas><div class="lvIn"><span></span><i></i></div><div class="lvPz">일시정지</div><div class="lvRes"><b></b><em></em><small></small></div></div><div class="lvIdle"><b></b><span>대기</span></div>';
    e.innerHTML = h;
    ST.appendChild(e);
    function q(c) { return e.querySelector(c); }
    u.e = e; u.tag = q(".lvTag"); u.nick = q(".lvNick"); u.scl = q(".lvScl"); u.sc = q(".lvSc"); u.rk = q(".lvRk"); u.life = q(".lvLife"); u.stg = q(".lvStg"); u.race = q(".lvRace");
    u.bd = q(".lvBd"); u.cv = q("canvas"); u.ctx = u.cv.getContext("2d"); u.inp = q(".lvIn span"); u.pz = q(".lvPz"); u.res = q(".lvRes"); u.idle = q(".lvIdle");
    function at(el, a, fs) { if (!el || !a) return; el.style.top = a[1] + "px"; if (a[a.length - 1] === "r") { el.style.right = (P.w - a[0]) + "px"; el.style.textAlign = "right"; } else el.style.left = a[0] + "px"; if (fs) el.style.fontSize = fs + "px"; }
    at(u.tag, P.tag); u.tag.textContent = n + "번 자리";
    at(u.nick, P.nick, P.nick[4]); u.nick.style.width = P.nick[2] + "px"; u.nick.style.height = P.nick[3] + "px"; u.nick.style.lineHeight = P.nick[3] + "px";
    if (u.scl) at(u.scl, P.scl);
    at(u.sc, P.sc, P.sc[2]); u.sc.style.lineHeight = P.sc[2] + "px";
    at(u.rk, P.rk); u.rk.style.fontSize = P.rk[2] + "px"; u.rk.style.setProperty("--big", P.rk[3] + "px");
    at(u.life, P.life); u.life.style.setProperty("--hz", P.life[2] + "px");
    at(u.stg, P.stg, P.stg[2]); if (P.stg[3] !== "l") { u.stg.style.left = ""; u.stg.style.right = (P.w - P.stg[0]) + "px"; }
    if (u.race) { u.race.style.left = P.race[0] + "px"; u.race.style.top = P.race[1] + "px"; u.race.style.width = P.race[2] + "px"; u.race.style.setProperty("--rh", P.race[3] + "px"); }
    var b = P.bd; u.bd.style.left = (b[0] - 10) + "px"; u.bd.style.top = (b[1] - 10) + "px"; u.bd.style.width = (b[2] + 20) + "px"; u.bd.style.height = (b[3] + 6 + P.ih + 20) + "px";
    u.cv.style.width = b[2] + "px"; u.cv.style.height = b[3] + "px";
    var ib = u.e.querySelector(".lvIn"); ib.style.top = (10 + b[3] + 6) + "px"; ib.style.height = P.ih + "px"; ib.style.width = b[2] + "px"; ib.style.fontSize = Math.round(P.ih * 0.5) + "px";
    u.idle.style.left = (b[0] - 10) + "px"; u.idle.style.top = (b[1] - 10) + "px"; u.idle.style.width = (b[2] + 20) + "px"; u.idle.style.height = (b[3] + 6 + P.ih + 20) + "px";
    u.idle.querySelector("b").textContent = n + "번 자리";
    u.L = rgLayout(b[2], b[3], true, false);
    u.c = {};   /* 값 기억 · 바뀔 때만 DOM 을 고친다 */
    e.classList.toggle("one", !!one);
    return u;
  }
  function nickFit(u) {   /* 분할 · 닉네임은 자리 이름표 바로 오른쪽(이름표 폭은 글꼴에 따라 다르다) */
    var P = u.P; if (!P.nick[5]) return;
    var x = u.tag.offsetLeft + u.tag.offsetWidth + 24; u.nick.style.left = x + "px"; u.nick.style.width = Math.max(120, P.w - 48 - x) + "px";
  }
  function set(u, k, v, fn) { if (u.c[k] === v) return false; u.c[k] = v; fn(v); return true; }

  /* ── 자리 상태 ── */
  var SEATS = { 1: null, 2: null }, DONE = {}, DONE_Q = [], ANY_END = false;
  function mkRG() {
    var r = {}; for (var k in RG) if (Object.prototype.hasOwnProperty.call(RG, k)) r[k] = RG[k];
    r.on = true; r.mode = "site"; r.big = true; r.words = []; r.ghost = []; r.parts = []; r.pops = []; r.lives = 5; r.lives0 = 5; r.score = 0; r.hits = 0; r.combo = 0; r.stage = 1;
    r.shake = 0; r.banner = null; r.shot = null; r.mas = { x: 380, tx: 380, hop: 0 }; r.res = null; r.L = null; r.dpr = 1; r.seed = 0; r.wait = false; r.paused = false; r.cd = 0; r.cdQ = 0; r.cdAt = 0;
    r.goT = 0; r.goAt = 0; r.t0 = 1; r.typed = ""; r.bonusOn = true; r.bonus = null; r.bns = 0; r.bnsN = 0; r.capBns = 0; r.race = null; r.cloud = null; r.cloudN = RAIN_CLOUD.max; r.cloudAt = Infinity;
    r.ending = null; r.heartHit = 0; r.hurt = 0; r.next = []; r.top = null; r.who = ""; r.hud = ""; r.spawnT = 0;
    return r;
  }
  function seatNew(n, m) {
    return { n: n, g: m.g, nick: clip(m.nick || "도전자", 16), test: m.test ? 1 : 0, best0: Number(m.best0) || 0, rank0: m.rank0 == null ? null : Number(m.rank0), total: Number(m.total) || 0,
      fr: [], q: -1, recv: now(), start: now(), cur: null, wm: {}, rg: mkRG(), scD: 0, cloudNo: 0, bns: null, over: 0, end: null, endAt: 0, lives0: 0, rkPrev: 0, lat: [], hub: [] };
  }
  function seatOk(n, test) { return (n === 1 || n === 2) && (!ONLY || ONLY === n) && (!test || TEST); }
  function done(g) { if (DONE[g]) return; DONE[g] = 1; DONE_Q.push(g); if (DONE_Q.length > 64) delete DONE[DONE_Q.shift()]; }
  var G8 = /^[0-9a-f]{8}$/;

  function onSeats(m) {
    var seen = {};
    (m.seats || []).forEach(function (s) {
      var n = Number(s.seat); if (!seatOk(n, s.test) || !G8.test(s.g || "") || DONE[s.g]) return;
      seen[n] = 1;
      var S = SEATS[n]; if (S && S.g === s.g) { S.recv = now(); return; }
      SEATS[n] = seatNew(n, s);
    });
    [1, 2].forEach(function (n) { var S = SEATS[n]; if (S && !S.end && !seen[n]) SEATS[n] = null; });   /* 끊긴 동안 끝난 판 · 결과 보이는 중이면 둔다 */
  }
  function onStart(m) {
    var n = Number(m.seat); if (!seatOk(n, m.test) || !G8.test(m.g || "") || DONE[m.g]) return;
    var S = SEATS[n]; if (S && S.g === m.g) return;
    SEATS[n] = seatNew(n, m);
  }
  function onLive(m) {
    (m.f || []).forEach(function (it) {
      var n = Number(it.seat); if (!seatOk(n, it.test) || !G8.test(it.g || "") || DONE[it.g]) return;
      var S = SEATS[n];
      if (!S || S.g !== it.g) { S = SEATS[n] = seatNew(n, it); }   /* 모르는 판 · 시작을 놓쳤어도 진행으로 연다 */
      var q = Number(it.q); if (!(q > S.q)) return;
      S.q = q; S.recv = now();
      if (it.nick) S.nick = clip(it.nick, 16);
      it._rx = performance.now(); it._ev = !!it.ev || evLike(it, S.fr.length ? S.fr[S.fr.length - 1] : null);
      S.fr.push(it); if (S.fr.length > 16) S.fr.shift();
      if (it.x === "over" && !S.over) S.over = now();
      if (it.x === "quit") { done(it.g); SEATS[n] = null; }
    });
  }
  /* 사건 · 직전에 받은 진행과 그림이 달라지는 값(옛 Hub 는 ev 를 버리므로 화면이 스스로도 본다) */
  function wIds(F) { var a = []; (F.w || []).forEach(function (w) { a.push(w[0]); }); return a.join(","); }
  function evLike(F, P) {
    if (!P) return true;
    return F.ht !== P.ht || F.lv !== P.lv || F.sc !== P.sc || F.st !== P.st || F.cd !== P.cd || F.pz !== P.pz || F.x !== P.x || F.inp !== P.inp ||
      (F.bn ? F.bn.ph + "|" + F.bn.ty : "") !== (P.bn ? P.bn.ph + "|" + P.bn.ty : "") || wIds(F) !== wIds(P);
  }
  function onEnd(m) {
    if (G8.test(m.g || "")) done(m.g);
    var n = Number(m.seat), S = SEATS[n]; if (!S || S.g !== m.g || S.end) return;
    S.end = m; S.endAt = now(); ANY_END = true;
    if (!m.test) topMerge(S.nick, Number(m.best) || Number(m.score) || 0);
  }
  function onStop(m) {
    if (G8.test(m.g || "")) done(m.g);
    var n = Number(m.seat), S = SEATS[n]; if (S && S.g === m.g && !S.end) SEATS[n] = null;
  }

  /* ── 순위 · 광고 루프가 받은 TOP 10(type_rank) · 판 동안 서버를 더 부르지 않는다 ── */
  function topList(S) {
    var d = TY.rk && TY.rk.data, top = d && d.top ? d.top : null; if (!top) return null;
    var out = [], skip = false;
    top.forEach(function (x) { if (!skip && x.name === S.nick) { skip = true; return; } out.push(x); });   /* 내 옛 기록 한 줄은 뺀다(지금 점수와 겨룬다) */
    return out;
  }
  function liveRank(S, sc) {
    var l = topList(S); if (!l) return null;
    var r = 1; for (var i = 0; i < l.length; i++) if (l[i].score > sc) r++;
    return { r: r, l: l };
  }
  function topMerge(nick, sc) {
    var d = TY.rk && TY.rk.data; if (!d || !d.top || !sc) return;
    var top = d.top.slice(), i;
    for (i = 0; i < top.length; i++) if (top[i].name === nick) break;
    if (i < top.length) { if (top[i].score >= sc) return; top[i] = { name: nick, score: sc }; } else top.push({ name: nick, score: sc });
    top.sort(function (a, b) { return b.score - a.score; });
    d.top = top.slice(0, 10); d.unit = d.unit || "pts";
  }

  /* ── 시계 · 서버 ms ≈ Date.now() + OFF · 받은 ts 로 가장 덜 늦은 표본을 쓴다 ── */
  var OFF = 0, OFF_N = 0, OFF_S = [];
  function offTake(srvMs, at) {
    if (!(srvMs > 1.6e12)) return;
    OFF_S.push(srvMs - at); if (OFF_S.length > 40) OFF_S.shift();
    var b = -Infinity; for (var i = 0; i < OFF_S.length; i++) b = Math.max(b, OFF_S[i]);
    OFF = b; OFF_N++;
  }

  /* ── 소켓 · tv 방 듣기(인증 없음 · 공개 정보만) ── */
  var WS = { s: null, up: false, down: now(), back: 0, timer: 0, ping: 0, last: 0, ids: [], idm: {}, url: "", n: 0 };
  function wsUrl() {
    if (Q.ws) return /^wss:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/ws(\?|$)/.test(Q.ws) || /^ws:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(Q.ws) ? Q.ws + (Q.ws.indexOf("r=tv") < 0 ? (Q.ws.indexOf("?") < 0 ? "?" : "&") + "r=tv" : "") : "";
    if (Q.demo === "1") return "";   /* 데모 = 서버에 붙지 않는다(가짜 송신기는 &ws=) */
    var s = TY.rk && TY.rk.srv;
    return typeof s === "string" && /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/exec$/.test(s) ? s.replace(/^https:/, "wss:").replace(/\/exec$/, "/ws?r=tv") : "";
  }
  function wsOpen() {
    clearTimeout(WS.timer); WS.timer = 0;
    var u = wsUrl(); WS.url = u; if (!u || typeof WebSocket === "undefined") return;
    var s; try { s = new WebSocket(u); } catch (e) { wsRetry(); return; }
    WS.s = s; WS.n++;
    s.onopen = function () { WS.last = now(); try { s.send(JSON.stringify({ t: "hello", v: "tv-live-1", live: 1 })); } catch (e) {} };
    s.onmessage = function (ev) {
      var at = now(); WS.last = at;
      if (typeof ev.data !== "string" || ev.data === "o") return;
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (!m || typeof m !== "object") return;
      if (m.t === "ok") { WS.up = true; WS.back = 0; offTake(Number(m.now), at); return; }
      if (m.t === "no") { try { s.close(); } catch (e) {} return; }
      if (m.t !== "tv") return;
      if (m.id != null) { var id = String(m.id); if (WS.idm[id]) return; WS.idm[id] = 1; WS.ids.push(id); if (WS.ids.length > 64) delete WS.idm[WS.ids.shift()]; }
      offTake(Number(m.ts), at);
      try {
        if (m.k === "live") onLive(m);
        else if (m.k === "type_start") onStart(m);
        else if (m.k === "type_end") onEnd(m);
        else if (m.k === "type_stop") onStop(m);
        else if (m.k === "live_seats") onSeats(m);
      } catch (e) { if (window.console) console.error(e); }
    };
    s.onclose = function () { if (WS.s !== s) return; WS.s = null; if (WS.up) WS.down = now(); WS.up = false; wsRetry(); };
    s.onerror = function () {};
  }
  function wsRetry() {
    clearTimeout(WS.timer);
    var steps = [1, 2, 4, 8, 16, 30], ms = steps[Math.min(WS.back, steps.length - 1)] * 1000 + Math.floor(Math.random() * 1000);
    WS.back++; WS.timer = setTimeout(wsOpen, ms);
  }
  setInterval(function () {   /* 생존 · 25초 p → o · 70초 답이 없으면 닫고 다시 */
    var s = WS.s; if (!s || s.readyState !== 1) return;
    if (now() - WS.last > 70000) { try { s.close(); } catch (e) {} WS.s = null; if (WS.up) WS.down = now(); WS.up = false; wsRetry(); return; }
    try { s.send("p"); } catch (e) {}
  }, 25000);

  /* ── 한 자리 재생 · 받은 진행(fr)에서 지금 재생 시각 T 의 상태를 만든다 ── */
  var DUR = { clear: RAIN_CLOUD.clear, win: RAIN_TRANS.wipe, title: RAIN_TRANS.title, wout: RAIN_TRANS.wipe, intro: RAIN_BONUS.intro, count: RAIN_CLOUD.count, res: RAIN_BONUS.show, bin: RAIN_TRANS.wipe, btitle: RAIN_TRANS.back, bout: RAIN_TRANS.wipe };
  var KEYS = {}; if (typeof RAIN_BONUS_LINES !== "undefined") RAIN_BONUS_LINES.forEach(function (x) { if (x && x.s) KEYS[x.s] = x.w || []; });
  var BW = {};
  function tagW(ctx, L, text) { var k = L.tf + "|" + text; if (BW[k] == null) { ctx.font = rtFont(L.tf); BW[k] = Math.ceil(ctx.measureText(text).width) + L.padX * 2; } return BW[k]; }
  function pick(S, T) {
    var fr = S.fr, F = null;
    for (var i = fr.length - 1; i >= 0; i--) if (fr[i].hs <= T || fr[i]._ev) { F = fr[i]; break; }   /* 사건은 받는 즉시 · 한 번 고른 진행보다 앞의 것으로 돌아가지 않는다(사건 · 지난 시각은 계속 고를 수 있다) */
    if (!F && fr.length && fr[0].hs > T + 3000) F = fr[fr.length - 1];   /* 시계가 크게 어긋났을 때만 · 보통은 첫 진행이 재생 시각에 닿을 때까지 기다린다 */
    return F;
  }
  function running(F) { return !!F && !F.pz && !F.bn && !(F.cd > 0) && !F.x; }
  function wordP(w, F, T) {   /* 외삽 · 그 진행(Hub 가 받은 시각) 뒤 지금까지 · 목숨을 잃은 뒤 느려진 동안(hu)은 그 배속 */
    var dt = running(F) ? Math.max(0, Math.min(MAX_LAG, T - F.hs)) : 0, hu = Number(F.hu) || 0;
    if (hu > 0) dt = Math.min(dt, hu) * HURT_SLOW + Math.max(0, dt - hu);
    return (Number(w[3]) + dt / Math.max(300, Number(w[4])) * 1000) / 1000;
  }

  /* 새 진행으로 넘어갈 때 · 효과(터짐 · 놓침 · 단계 · 카운트다운 · 보너스 단계)와 보간 이음새 */
  function step(S, u, F, P, T, pnow) {
    var r = S.rg, L = u.L, hw = {}, prevLv = P ? P.lv : F.lv;
    (F.hw || []).forEach(function (h) { hw[h[0]] = h[1]; });
    if (!S.lives0) S.lives0 = Math.max(1, F.lv);
    var nowIds = {}; (F.w || []).forEach(function (w) { nowIds[w[0]] = w; });
    if (P && !F.bn) {   /* 사라진 단어 · 목숨이 준 만큼은 놓친 것(가장 아래부터) · 나머지는 터진 것 */
      var gone = []; for (var id in S.wm) if (!nowIds[id]) gone.push(S.wm[id]);
      var miss = Math.max(0, prevLv - F.lv);
      gone.sort(function (a, b) { return b.pd - a.pd; });
      gone.forEach(function (o) {
        if (!o.wd) return;   /* 그려 본 적 없는 단어(0.5초 안에 생겼다 사라짐) · 효과 없음 */
        var cx = o.x + o.bw / 2;
        if (miss > 0 && !(o.id in hw)) {
          miss--;
          rgBurst(cx, L.floor, 6, [RAIN_PAL.dim, RAIN_PAL.ink]);
          r.pops.push({ x: cx, y: L.floor - 10, text: "놓침 · 하트 -1", t: 0.9, c: RAIN_PAL.deep, s: 14 });
          r.shake = 0.22; r.heartHit = 0.5;
          return;
        }
        var cy = rgWordY(o.wd) + L.boxH / 2, pts = hw[o.id] != null ? hw[o.id] : Math.round(o.text.length * 10 * (1 + 0.2 * Math.min(Math.max(1, F.cb) - 1, 10)));
        r.mas.tx = Math.max(L.masW / 2, Math.min(L.W - L.masW / 2, cx)); r.mas.hop = 0.25;
        r.shot = { x0: r.mas.tx, y0: L.ground - L.masH, x1: cx, y1: cy, t: 0.12 };
        rgBurst(cx, cy, 16, [RAIN_PAL.o100, RAIN_PAL.ink, RAIN_PAL.w, RAIN_PAL.o50]);
        r.pops.push({ x: cx, y: cy, text: "+" + pts, t: 0.8, c: RAIN_PAL.w, s: 14 });
        if (F.cb >= 3) r.pops.push({ x: cx, y: cy - 36, text: "COMBO x" + F.cb, t: 0.9, c: RAIN_PAL.o60, s: 16 });
        r.shake = Math.max(r.shake, 0.06);
      });
    }
    if (P && F.lv === 1 && P.lv > 1) r.banner = { text: "마지막 목숨", t: 1.0 };
    if (P && F.st > P.st && !F.bn) r.banner = { text: "LEVEL " + F.st, t: 1.3 };
    if (F.cd > 0 && r.cd !== F.cd) { r.cdAt = pnow; }
    if (P && P.cd > 0 && !(F.cd > 0)) { r.goT = RAIN_CLOUD.go; r.goAt = pnow; }
    r.cd = F.cd > 0 ? F.cd : 0;
    /* 비구름 · 구름 단어(c 1)가 보이면 구름 하나를 세운다(남은 칸 수는 모른다 · 판 위 구름 단어 수로) */
    var ncl = 0; (F.w || []).forEach(function (w) { if (w[5]) ncl++; });
    if (ncl && !r.cloud && !F.bn) { S.cloudNo++; r.cloud = { no: S.cloudNo, text: "", keys: [], seq: [], n: ncl, puff: 0 }; }
    if (r.cloud) r.cloud.n = Math.max(r.cloud.n, ncl);
    /* 보너스 단계 */
    var bn = F.bn;
    if (bn && bn.ph) {
      var b = S.bns;
      if (!b) { b = S.bns = { text: clip(bn.t, 80), keys: KEYS[bn.t] || [], lim: rgBonusLim(String(bn.t || "").length), left: 0, ph: "", t: 0, at: pnow, typed: "", res: null, no: Math.max(1, S.cloudNo), phAt: F.hs, typeAt: 0, sc0: P ? P.sc : F.sc }; }
      b.text = clip(bn.t, 80); b.typed = clip(bn.ty, 80);
      if (b.ph !== bn.ph) {
        b.ph = bn.ph; b.phAt = F.hs;
        if (bn.ph === "type") { b.typeAt = F.hs; }
        if (bn.ph === "res" && !b.res) {
          var left = b.typeAt ? Math.max(0, b.lim - (F.hs - b.typeAt) / 1000) : 0;
          b.res = rgBonusScore(b.typed, b.text, b.typed === b.text ? "enter" : "time", left);
          if (F.sc > b.sc0) b.res.pts = F.sc - b.sc0;
        }
        if (bn.ph === "bin" || bn.ph === "btitle" || bn.ph === "bout") r.cloud = null;
      }
      r.bonus = b; r.words = [];
    } else if (S.bns) { S.bns = null; r.bonus = null; r.cloud = null; }
    if (F.x === "over" && !r.ending && !S.end) { r.ending = { why: F.lv > 0 ? "cap" : "lives", t: 1e9 }; r.capBns = F.lv > 0 ? F.lv * (typeof RAIN_LIFE_BONUS === "number" ? RAIN_LIFE_BONUS : 500) : 0; r.lives0 = S.lives0; }
    /* 보간 이음새 · 같은 단어가 새 진행에서 다른 자리에 있으면 그 차이를 녹인다 */
    var wm = {};
    (F.w || []).forEach(function (w) {
      var o = S.wm[w[0]], tp = wordP(w, F, T);
      wm[w[0]] = { id: w[0], text: clip(w[1], 12), xm: Number(w[2]) || 0, c: w[5] ? 1 : 0, w: w, corr: o ? (Math.abs(o.pd - tp) < 0.2 ? o.pd - tp : 0) : 0, pd: tp, y0: o ? o.y0 : null, x: o ? o.x : 0, bw: o ? o.bw : 0, wd: null };
      if (!o && w[5] && r.cloud) r.cloud.puff = typeof RAIN_CLOUD_FX === "object" ? RAIN_CLOUD_FX.puff : 0.32;
    });
    S.wm = wm;
    r.score = Number(F.sc) || 0; r.lives = Number(F.lv) || 0; r.stage = Number(F.st) || 1; r.combo = Number(F.cb) || 0; r.hits = Number(F.ht) || 0;
    r.typed = F.bn ? "" : clip(F.inp, 24);
    S.cur = F;
    S.lat.push(now() - Number(F.at)); S.hub.push(now() + OFF - Number(F.hs));
    if (S.lat.length > 4000) { S.lat.splice(0, 1000); S.hub.splice(0, 1000); }
    LAT.push(now() - Number(F.at)); if (LAT.length > 20000) LAT.splice(0, 5000);
  }
  var LAT = [];

  /* 그 자리 한 프레임 · 단어 위치 · 시계 · 효과 줄이기 */
  function tickSeat(S, u, T, Tx, dt, pnow) {   /* T = 사건 없는 진행을 고르는 시각(지연) · Tx = 지금 시각(앞질러 그리기 · 보너스 시계) */
    var r = S.rg, L = u.L, F = pick(S, T);
    if (F && F !== S.cur) { step(S, u, F, S.cur, Tx, pnow); S.nd = 1; }
    F = S.cur;
    var words = [], k = Math.exp(-dt / 0.18);
    if (F && !F.bn) for (var id in S.wm) {
      var o = S.wm[id];
      o.corr *= k;
      var p = Math.max(0, Math.min(1, wordP(o.w, F, Tx) + o.corr));
      if (!o.bw) o.bw = tagW(u.ctx, L, o.text);
      o.x = Math.round(Math.max(8, Math.min(L.W - 8 - o.bw, o.xm / 1000 * L.W)));
      if (o.c && o.y0 == null) o.y0 = r.cloud ? rgClY0(L, pnow) : L.top;
      o.pd = p;
      var wd = { text: o.text, bw: o.bw, x: o.x, p: p, fall: Number(o.w[4]) / 1000 }; if (o.c) { wd.y0 = o.y0; wd.cl = true; }
      o.wd = wd; words.push(wd);
    }
    r.words = words;
    if (r.bonus && S.bns && F) {   /* 단계 시계 · 받은 단계가 시작된 때부터 */
      var b = S.bns, e = Math.max(0, (Tx - b.phAt) / 1000);
      b.t = Math.max(0, (DUR[b.ph] || 0) - e);
      if (b.ph === "type") { var et = Math.max(0, (Tx - b.typeAt) / 1000); b.left = Math.max(0, b.lim - et); b.go = Math.max(0, RAIN_CLOUD.go - et); }
      else if (b.ph === "intro" || b.ph === "count" || b.ph === "wout") b.left = b.lim;
    }
    rgFx(dt);
    if (r.banner) { r.banner.t -= dt; if (r.banner.t <= 0) r.banner = null; }
    if (r.shot) { r.shot.t -= dt; if (r.shot.t <= 0) r.shot = null; }
    if (r.shake > 0) r.shake -= dt;
    if (r.heartHit > 0) r.heartHit -= dt;
    if (r.goT > 0) r.goT -= dt;
    if (r.cloud && r.cloud.puff > 0) r.cloud.puff -= dt;
    if (r.mas.hop > 0) r.mas.hop -= dt;
    r.mas.x += (r.mas.tx - r.mas.x) * Math.min(1, dt * 8);
    if (!(r.mas.hop > 0)) r.mas.tx += (L.W / 2 - r.mas.tx) * Math.min(1, dt * 1.5);
  }

  /* HUD · 닉네임 · 점수(올라가며) · 지금 N위 · 목숨 · 단계 · 추월 줄 · 입력 · 결과 */
  function hud(S, u, dt) {
    var F = S.cur, r = S.rg;
    set(u, "nick", S.nick, function (v) { u.nick.textContent = v; });
    set(u, "test", S.test, function (v) { u.tag.textContent = u.n + "번 자리" + (v ? " · 리허설" : ""); nickFit(u); });
    var sc = F ? Number(F.sc) || 0 : 0;
    S.scD = sc < S.scD ? sc : S.scD + (sc - S.scD) * Math.min(1, dt * 7); if (sc - S.scD < 1) S.scD = sc;
    set(u, "sc", Math.round(S.scD), function (v) { u.sc.textContent = fmt(v); });
    var lr = liveRank(S, sc), rt = "", rk = 0;
    if (S.end) rt = "";
    else if (F && F.x === "over") rt = "<span>결과 집계 중</span>";
    else if (lr) {
      rk = lr.r;
      if (rk <= 10) rt = "지금 <b>" + rk + "위</b>";
      else rt = "<span>TOP 10까지 " + fmt(lr.l[9].score - sc + 1) + "점</span>";
    }
    if (set(u, "rk", rt, function (v) { u.rk.innerHTML = v; }) && rk && S.rkPrev && rk < S.rkPrev) { u.rk.classList.remove("up"); void u.rk.offsetWidth; u.rk.classList.add("up"); }
    if (rk) S.rkPrev = rk;
    var lv = F ? Number(F.lv) : 5, hit = r.heartHit > 0 ? 1 : 0;
    set(u, "lv", lv + "|" + hit, function () { Array.prototype.forEach.call(u.life.children, function (h, i) { h.className = i < lv ? "on" : i === lv && hit ? "hit" : ""; h.style.display = i < Math.max(5, S.lives0) ? "" : "none"; }); });
    set(u, "stg", F ? "단계 " + (Number(F.st) || 1) : "", function (v) { u.stg.textContent = v; });
    if (u.race) set(u, "race", raceHtml(S, lr, sc), function (v) { u.race.innerHTML = v; });
    var typing = F && !F.bn && !F.x && !(F.cd > 0) ? clip(F.inp, 24) : "";
    set(u, "inp", typing, function (v) { u.inp.textContent = v; });
    set(u, "inOn", F && !F.bn && !F.x ? 1 : 0, function (v) { u.bd.classList.toggle("noin", !v); });
    set(u, "pz", F && F.pz ? 1 : 0, function (v) { u.pz.classList.toggle("on", !!v); });
    set(u, "res", S.end ? S.end.id || S.end.g : "", function (v) {
      u.res.classList.toggle("on", !!v); if (!v) return;
      var m = S.end, t = resText(m);
      u.res.querySelector("b").textContent = t[0]; u.res.querySelector("em").textContent = t[1]; u.res.querySelector("small").textContent = t[2];
      u.res.classList.toggle("hi", !!t[3]);
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function raceHtml(S, lr, sc) {
    if (!lr || !S.cur || S.end) return "";
    var l = lr.l, r = lr.r, rows = [], me = { no: r <= 10 ? r : 0, name: S.nick, score: sc, me: 1 };
    if (r === 1) rows = [me, l[0] && { no: 2, name: l[0].name, score: l[0].score }, l[1] && { no: 3, name: l[1].name, score: l[1].score }];
    else if (r > 10) rows = [l[8] && { no: 9, name: l[8].name, score: l[8].score }, l[9] && { no: 10, name: l[9].name, score: l[9].score }, me];
    else rows = [{ no: r - 1, name: l[r - 2].name, score: l[r - 2].score }, me, l[r - 1] && { no: r + 1, name: l[r - 1].name, score: l[r - 1].score }];
    return rows.filter(Boolean).map(function (x) { return '<p class="' + (x.me ? "me" : "") + '"><i>' + (x.no ? x.no + "위" : "") + "</i><b>" + esc(x.name) + "</b><em>" + fmt(x.score) + "</em></p>"; }).join("");
  }
  function resText(m) {   /* [큰 줄, 둘째 줄, 작은 줄, 강조] */
    var sc = fmt(m.score) + "점", rank = m.rank == null ? 0 : Number(m.rank), prev = m.prevRank == null ? 0 : Number(m.prevRank);
    if (m.test) return ["리허설 판", sc, "순위에 넣지 않음", 0];
    if (m.pb && rank && rank <= 10 && (!prev || rank < prev)) return [rank + "위 진입!", sc, "최고 기록", 1];
    if (m.pb && rank && rank <= 10) return [rank + "위", sc, "최고 기록", 1];
    if (m.pb && rank) return ["최고 기록", sc, rank + "위", 0];
    return [sc, rank ? "최고 기록 " + fmt(m.best) + "점 · " + rank + "위" : "", "", 0];
  }

  /* ── 화면 맞추기 · 방향 · 배치 ── */
  var VIEW = { key: "", lay: null, ui: [], K: 1, ori: "" };
  function ori() { return Q.o === "port" ? "port" : Q.o === "land" ? "land" : (window.innerHeight > window.innerWidth * 1.05 ? "port" : "land"); }
  function shown() {   /* 화면에 올릴 자리 [n, ...] · 분할이면 [1, 2] */
    var a = [1, 2].filter(function (n) { return !!SEATS[n]; });
    if (!a.length) return [];
    if (MODE === 2 && !ONLY) return [1, 2];
    if (a.length === 1 || MODE === 1 || ONLY) {
      if (a.length === 1) return a;
      return [SEATS[1].start >= SEATS[2].start ? 1 : 2];
    }
    return [1, 2];
  }
  function layout(list) {
    var o = ori(), key = o + list.join("") + "|" + window.innerWidth + "x" + window.innerHeight;
    if (key === VIEW.key) return;
    VIEW.key = key; VIEW.ori = o;
    var lay = LAY[o + (list.length > 1 ? "2" : "1")];
    VIEW.lay = lay;
    VIEW.ui.forEach(function (u) { if (u && u.e.parentNode) u.e.parentNode.removeChild(u.e); });
    VIEW.K = Math.min(window.innerWidth / lay.W, window.innerHeight / lay.H) || 1;
    ST.style.width = lay.W + "px"; ST.style.height = lay.H + "px"; ST.style.marginLeft = -lay.W / 2 + "px"; ST.style.marginTop = -lay.H / 2 + "px"; ST.style.transform = "scale(" + VIEW.K + ")";
    HEAD.style.display = lay.head ? "" : "none"; HEAD.className = o;
    LINE.style.display = lay.line ? "" : "none";
    if (lay.line) { LINE.style.left = lay.line[0] + "px"; LINE.style.top = lay.line[1] + "px"; LINE.style.width = lay.line[2] + "px"; LINE.style.height = lay.line[3] + "px"; }
    var dpr = Math.min(2, Math.max(1, VIEW.K * (window.devicePixelRatio || 1)));
    VIEW.ui = list.map(function (n, i) {
      var u = uiMake(lay.seats[i], n, list.length === 1);
      u.dpr = dpr; u.cv.width = Math.round(lay.seats[i].bd[2] * dpr); u.cv.height = Math.round(lay.seats[i].bd[3] * dpr);
      return u;
    });
    [1, 2].forEach(function (n) { var S = SEATS[n]; if (S) { S.wm = {}; S.cur = null; S.bns = null; S.rg.cloud = null; S.rg.bonus = null; S.rg.parts = []; S.rg.pops = []; } });   /* 판 크기가 바뀌면 다음 진행부터 다시 맞춘다 */
  }

  /* ── 켜기 · 끄기 · 광고 루프 멈춤 ── */
  var ON = false, OFF_T = 0;
  function liveOn(on) {
    if (on === ON) return;
    ON = on; clearTimeout(OFF_T);
    if (on) {
      if (TY.hold) TY.hold(true);
      LV.classList.remove("out"); LV.classList.add("on"); void LV.offsetWidth; LV.classList.add("in");
      body.classList.add("lvOn");
    } else {
      LV.classList.add("out"); LV.classList.remove("in");
      var from = ANY_END ? "rank" : "ad"; ANY_END = false;
      if (TY.from) TY.from(from);
      if (TY.hold) TY.hold(false);
      OFF_T = setTimeout(function () { if (!ON) { LV.classList.remove("on", "out"); body.classList.remove("lvOn"); VIEW.key = ""; VIEW.ui.forEach(function (u) { if (u.e.parentNode) u.e.parentNode.removeChild(u.e); }); VIEW.ui = []; } }, 260);
    }
  }

  /* ── 한 프레임 ── */
  var LAST = 0, FPS = { n: 0, t0: 0, v: 0 }, DRAW = [], DRAW_EV = [], COST = [];
  function frame(ms) {
    requestAnimationFrame(frame);
    var c0 = performance.now();
    var dt = LAST ? Math.min(0.1, (ms - LAST) / 1000) : 0.016; LAST = ms;
    FPS.n++; if (ms - FPS.t0 >= 1000) { FPS.v = FPS.n * 1000 / (ms - FPS.t0); FPS.n = 0; FPS.t0 = ms; }
    var t = now();
    [1, 2].forEach(function (n) {   /* 내리기 · 15초 규칙 · 결과 6초 */
      var S = SEATS[n]; if (!S) return;
      if (S.end) { if (t - S.endAt > RESULT_MS) SEATS[n] = null; return; }
      if (S.over && t - S.over > OVER_MS) { done(S.g); SEATS[n] = null; return; }
      if (t - S.recv > DROP_MS) { SEATS[n] = null; return; }
      if (!WS.up && t - WS.down > DROP_MS) SEATS[n] = null;
    });
    var list = shown();
    if (!list.length) { liveOn(false); return; }
    liveOn(true);
    layout(list);
    var Tx = t + OFF, T = Tx - DELAY, keep = window.RG;
    VIEW.ui.forEach(function (u) {
      var S = SEATS[u.n];
      u.e.classList.toggle("empty", !S);
      if (!S) return;
      S.rg.L = u.L; S.rg.dpr = u.dpr;
      window.RG = S.rg;
      try {
        tickSeat(S, u, S.end ? Infinity : T, S.end ? Infinity : Tx, dt, ms);
        if (S.end) S.rg.ending = null;   /* 결과 카드가 덮는다 · 판 안 TIME UP · GAME OVER 는 걷는다 */
        if (S.cur) rgDraw(u.ctx, ms);
        else { u.ctx.setTransform(1, 0, 0, 1, 0, 0); u.ctx.fillStyle = RT_PAL.night; u.ctx.fillRect(0, 0, u.cv.width, u.cv.height); }
        if (S.nd && S.cur && S.cur._rx) { var dw = performance.now() - S.cur._rx; DRAW.push(dw); if (S.cur._ev) DRAW_EV.push(dw); if (DRAW.length > 6000) { DRAW.splice(0, 2000); DRAW_EV.splice(0, Math.min(DRAW_EV.length, 2000)); } }   /* 점검 · 소켓 받음 → 그 진행을 그린 때 */
        S.nd = 0;
      } catch (e) { if (window.console) console.error(e); }
      finally { window.RG = keep; }
      hud(S, u, dt);
    });
    COST.push(performance.now() - c0); if (COST.length > 6000) COST.splice(0, 2000);
  }

  /* ── 점검 · 시험(헤드리스)용 · 화면에는 아무것도 더하지 않는다 ── */
  function pct(a, p) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }
  window.__tvlive = {
    seats: SEATS, ws: WS, q: Q, delay: DELAY,
    off: function () { return OFF; }, fps: function () { return FPS.v; }, on: function () { return ON; },
    lat: function () { return { n: LAT.length, p50: pct(LAT, 0.5), p95: pct(LAT, 0.95), max: pct(LAT, 1) }; },
    latReset: function () { LAT.length = 0; DRAW.length = 0; DRAW_EV.length = 0; COST.length = 0; },
    draw: function () { function s(a) { return { n: a.length, p50: pct(a, 0.5), p95: pct(a, 0.95), max: pct(a, 1) }; } return { all: s(DRAW), ev: s(DRAW_EV), cost: s(COST) }; },
    feed: function (m) { if (m && m.t === "tv") { if (m.k === "live") onLive(m); else if (m.k === "type_start") onStart(m); else if (m.k === "type_end") onEnd(m); else if (m.k === "type_stop") onStop(m); else if (m.k === "live_seats") onSeats(m); } }
  };

  window.addEventListener("resize", function () { VIEW.key = ""; });
  requestAnimationFrame(frame);
  wsOpen();
})();
