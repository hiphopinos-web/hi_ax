/* ═══════════════════════════════════════════════════════════════════════════
 * AX Festival 2026 · Outro 럭키드로우 송출 화면 (17F 대강당 · 16:9)
 *   디자인 정본 = AX페스티벌/design.md v29 (블랙·오렌지 스테이지 · 도트 격자 · KV 오브젝트 · 글자 정지 · 점으로 모이고 흩어진다)
 *   홍보부 원본 = assets/axf_engine.js (01 Me to WE · 02 Circle 좌표·계산식) · assets/wordmark.js (09 워드마크 아웃라인)
 *   공 1개 = 응모권 1장(4·5·6개 스탬프 = 1·2·3장, 번호 0001~9999 · 서버 raffle 원장과 같은 형식)
 *   당첨은 공 단위 균등 무작위(crypto.getRandomValues) · 물리 연출은 결과를 바꾸지 않는다.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var Q = new URLSearchParams(location.search);
  var REC = Q.has("rec"), BENCH = +Q.get("bench") || 0;
  var CONTROL = location.hash === "#control";
  if (CONTROL) { window.addEventListener("DOMContentLoaded", function () { window.AXDRAW_CONTROL && window.AXDRAW_CONTROL(); }); return; }

  /* ─────────────── 상수 · 무대 좌표(1920×1080 논리 좌표) ─────────────── */
  var W0 = 1920, H0 = 1080, PITCH = 30;               /* 도트 격자 = 폭/64 */
  var DX = 505, DY = 578, DR = 392;                     /* 추첨 통(원) 중심·안쪽 반지름 · 왼쪽 50% 가 오브젝트 자리 */
  var RING = DR + 20, GATE = 0.92, INLET = -Math.PI / 2; /* 점 고리 반지름 · 배출구 각도(오른쪽 아래) · 투입구(위) */
  var TRAY = { x: 1015, y: 985 };
  var C = { o: "#FF7E31", o7: "#FF7F32", hi: "#FF963E", pu: "#E6CCFF", o50: "#FFB284", o25: "#FFD8C1", w: "#FFFFFF", k: "#000000", g: "#6B6B6B" };
  var FONT = '"AXP", "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
  var LS_CFG = "axfDraw.cfg.v1", LS_ST = "axfDraw.state.v1";

  /* ─────────────── 설정 (조작 창에서 바꾼다 · 기본값은 결정 대기 항목) ─────────────── */
  var DEF = {
    mode: "demo",            /* demo | server */
    demoN: 170,              /* 데모 참가자 수 */
    demoRate: 9,             /* 데모 체크인 속도(명/초 최대) */
    rounds: [                /* 경품 단계 · 기획 문서에 품목이 없어 자리표시 · 중간워크숍 「앱 행운권 추첨 5인」 기준 합계 5명 */
      { name: "ROUND 01", prize: "경품 A", count: 3 },
      { name: "ROUND 02", prize: "경품 B", count: 1 },
      { name: "FINAL", prize: "경품 C", count: 1 }
    ],
    onePerPerson: true,      /* 1인 1회 당첨 · 당첨 즉시 그 사람의 나머지 공을 뺀다 */
    absentRemove: true,      /* 재추첨(부재) 때 그 사람의 공을 뺀다 */
    checkinOnly: true,       /* 체크인한 사람만 대상 · 끄면 응모권 보유자 전원 */
    nameMode: "mask",        /* mask(홍*동) | none(번호만) */
    showDept: false,
    tickerNames: true,       /* 체크인 티커에 가린 이름 */
    beat: true,
    server: ""
  };
  var CFG = load(LS_CFG, null);
  CFG = Object.assign(JSON.parse(JSON.stringify(DEF)), CFG || {});
  if (REC || BENCH) CFG = JSON.parse(JSON.stringify(DEF));
  if (REC) { CFG.rounds = [{ name: "ROUND 01", prize: "경품 A", count: 2 }, { name: "FINAL", prize: "경품 C", count: 1 }]; CFG.demoRate = 20; }   /* 쇼릴 대본 전용 */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ─────────────── 난수 ─────────────── */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rng = mulberry(REC ? 20261026 : (Date.now() & 0xffffff));
  function fair(n) {                                   /* 0..n-1 균등 · 실제 추첨은 암호 난수(나머지 편향 제거) */
    if (REC) return Math.floor(rng() * n);
    var a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n;
    do { crypto.getRandomValues(a); } while (a[0] >= lim);
    return a[0] % n;
  }
  function hash(i) { var v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function EO(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function EIO(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function EOB(x) { x = clamp(x, 0, 1); var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function pad4(n) { return ("000" + n).slice(-4); }
  function mask(n) {                                   /* 서버 maskName_ 과 같은 규칙 · 김하나 → 김*나 · 남궁하나 → 남**나 */
    n = String(n || ""); if (!n) return "";
    if (n.length <= 1) return n; if (n.length === 2) return n.charAt(0) + "*";
    return n.charAt(0) + new Array(n.length - 1).join("*") + n.charAt(n.length - 1);
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ─────────────── 추첨 상태 (새로고침·브라우저 재시작에도 이어진다) ───────────────
   * pool.people[pk] = { nm, dp, nos:[번호…] } · arrived = 체크인 순서 · results = 당첨 기록(결정 즉시 저장 · 새로고침으로 다시 뽑을 수 없다) */
  var ST = (REC || BENCH) ? null : load(LS_ST, null);
  if (!ST || ST.v !== 1) ST = { v: 1, seed: Math.floor(Math.random() * 1e9), scene: "idle", pool: null, arrived: [], closed: false, round: 0, results: [], out: {}, src: CFG.mode };
  function persist() { if (!REC && !BENCH) save(LS_ST, ST); pushCtl(); }

  /* ─────────────── 데이터 어댑터 ─────────────── */
  var SUR = "김이박최정강조윤장임한오서신권황안송류홍전고문양손배백허유남심노하곽성차주우구민진나지엄원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용".split("");
  var GIV = "민서준우지현수아은도윤하예진서연주원시영태경가채유호재성다온나혜인소희동건규빈승환정미선지훈석".split("");
  var DEPT = ["경영지원", "디지털전략", "장기보험", "자동차보험", "일반보험", "리스크관리", "재무", "인사총무", "영업기획", "보상서비스"];
  function demoPool(n, seed) {
    var r = mulberry(seed), people = {}, order = [], used = {};
    for (var i = 0; i < n; i++) {
      var k = r() < 0.5 ? 1 : r() < 0.6 ? 2 : 3;      /* 응모권 1장 50% · 2장 30% · 3장 20% (가정) */
      var nm = SUR[Math.floor(r() * SUR.length)] + GIV[Math.floor(r() * GIV.length)] + GIV[Math.floor(r() * GIV.length)];
      var nos = [];
      while (nos.length < k) { var no = 1 + Math.floor(r() * 9999); if (used[no]) continue; used[no] = 1; nos.push(pad4(no)); }
      var pk = "d" + i;
      people[pk] = { nm: nm, dp: DEPT[Math.floor(r() * DEPT.length)], nos: nos };
      order.push(pk);
    }
    return { people: people, order: order, kind: "demo" };
  }

  /* 서버 · JSONP(콘솔과 같은 방식) · 주소는 ../assets/server.js 의 AXF_SERVER */
  var SRV = { status: "", polling: null, since: "", queue: load("axfDraw.q", []) };
  function jsonp(action, params, done) {
    var url = CFG.server || window.AXF_SERVER || "";
    if (!url) { done({ ok: false, reason: "noserver" }); return; }
    var name = "__axd" + Math.floor(Math.random() * 1e9), sc = document.createElement("script"), q = [];
    params = Object.assign({}, params, { action: action, callback: name, _: Date.now() });
    var code = sessionKey(); if (code) params.key = code;
    for (var k in params) if (params[k] != null) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    var timer = setTimeout(function () { clean(); done({ ok: false, reason: "timeout" }); }, 15000);
    function clean() { clearTimeout(timer); try { delete window[name]; } catch (e) { window[name] = undefined; } if (sc.parentNode) sc.parentNode.removeChild(sc); }
    window[name] = function (res) { clean(); done(res || { ok: false }); };
    sc.onerror = function () { clean(); done({ ok: false, reason: "network" }); };
    sc.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + q.join("&");
    document.head.appendChild(sc);
  }
  function sessionKey() { try { return sessionStorage.getItem("axfDraw.key") || ""; } catch (e) { return ""; } }
  /* 서버 풀 읽기 · 새 액션 draw_pool(체크인 명단 + 가린 이름) 이 있으면 그것, 없으면 기존 raffle_list(응모권 전원 · 이름 없음) */
  function serverLoad(done) {
    SRV.status = "불러오는 중";
    jsonp("draw_pool", { since: SRV.since || "" }, function (res) {
      if (res && res.ok) {
        SRV.status = "draw_pool 연결"; SRV.hasPool = true;
        if (!ST.pool || ST.pool.kind !== "server") ST.pool = { people: {}, order: [], kind: "server" };
        (res.rows || []).forEach(function (r) {
          if (!ST.pool.people[r.pk]) { ST.pool.people[r.pk] = { nm: r.nm || "", dp: r.dp || "", nos: (r.no || []).map(String) }; ST.pool.order.push(r.pk); }
          else ST.pool.people[r.pk].nos = (r.no || []).map(String);
          if (r.in && CFG.checkinOnly) queueArrival(r.pk);
        });
        SRV.since = res.cursor || SRV.since;
        if (!CFG.checkinOnly) ST.pool.order.forEach(queueArrival);
        done(true); return;
      }
      if (res && res.err === "unknown action") {
        jsonp("raffle_list", {}, function (r2) {
          if (!r2 || !r2.ok) { SRV.status = "실패 · " + (r2 && (r2.reason || r2.err) || "응답 없음"); done(false); return; }
          SRV.status = "raffle_list(체크인 없음 · 응모권 전원 · 이름 없음)"; SRV.hasPool = false;
          var people = {}, order = [], first = {};
          r2.rows.forEach(function (x) {
            var pk = "e" + x.emp;                    /* 사번은 화면에 쓰지 않는다 · 한 사람의 공을 묶는 열쇠로만 */
            if (!people[pk]) { people[pk] = { nm: "", dp: "", nos: [] }; order.push(pk); first[pk] = x.ts; }
            people[pk].nos.push(String(x.no));
          });
          order.sort(function (a, b) { return String(first[a]).localeCompare(String(first[b])); });
          ST.pool = { people: people, order: order, kind: "server" };
          order.forEach(queueArrival);
          done(true);
        });
        return;
      }
      SRV.status = "실패 · " + (res && (res.reason || res.err) || "응답 없음"); done(false);
    });
  }
  /* 당첨 기록 전송 · 새 액션 draw_log · 없거나 끊기면 로컬 큐에 두고 다시 보낸다(화면 진행은 막지 않는다) */
  function serverLog(r) {
    if (CFG.mode !== "server") return;
    SRV.queue.push({ id: r.id, round: r.round, slot: r.slot, no: r.no, pk: r.pk, st: r.st, prize: r.prize, at: r.at });
    save("axfDraw.q", SRV.queue); flushQueue();
  }
  function flushQueue() {
    if (!SRV.queue.length || SRV.flushing) return;
    SRV.flushing = true;
    var e = SRV.queue[0];
    jsonp("draw_log", e, function (res) {
      SRV.flushing = false;
      if (res && (res.ok || res.reason === "dup")) { SRV.queue.shift(); save("axfDraw.q", SRV.queue); flushQueue(); }
      else { SRV.logStatus = res && res.err === "unknown action" ? "draw_log 없음 · 로컬 기록만" : "전송 대기 " + SRV.queue.length; if (!(res && res.err === "unknown action")) setTimeout(flushQueue, 5000); }
    });
  }

  /* ─────────────── 캔버스 · 뷰 변환 ─────────────── */
  var cv, cx, vw = 0, vh = 0, dpr = 1, vs = 1, vox = 0, voy = 0, frameEl;
  var gridBlack = null, gridOrange = null, BASEVS = 0;
  function resize() {
    var w = REC ? 1920 : window.innerWidth, h = REC ? 1080 : window.innerHeight;
    dpr = REC ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    var px = w * h * dpr * dpr, cap = 2560 * 1440;       /* 4K 노트북에서도 내장 그래픽이 버티게 픽셀 수 상한 */
    if (px > cap) dpr *= Math.sqrt(cap / px);
    vw = Math.round(w * dpr); vh = Math.round(h * dpr);
    cv.width = vw; cv.height = vh; cv.style.width = w + "px"; cv.style.height = h + "px";
    var s = Math.min(w / W0, h / H0);
    vs = s * dpr; vox = (w - W0 * s) / 2 * dpr; voy = (h - H0 * s) / 2 * dpr; BASEVS = vs;
    frameEl.style.transform = "translate(" + (w - W0 * s) / 2 + "px," + (h - H0 * s) / 2 + "px) scale(" + s + ")";
    ["vIntro", "vBurst"].forEach(function (id) { var v = document.getElementById(id); if (v) v.style.transform = frameEl.style.transform; });
    gridBlack = makeGrid("black"); gridOrange = makeGrid("orange");
    atlas.key = "";
  }
  /* 도트 격자 · 움직이지 않는다 · 1.5% 점등(design.md §2) · 레터박스 바깥까지 같은 격자로 채운다 */
  function makeGrid(kind) {
    var g = document.createElement("canvas"); g.width = vw; g.height = vh;
    var c = g.getContext("2d"), p = PITCH * vs, sz = Math.max(1, 3 * vs);
    var x0 = vox % p, y0 = voy % p, i0 = Math.floor(vox / p), j0 = Math.floor(voy / p);
    c.fillStyle = kind === "black" ? C.k : C.o; c.fillRect(0, 0, vw, vh);
    for (var y = y0 + p / 2, j = 0; y < vh; y += p, j++) for (var x = x0 + p / 2, i = 0; x < vw; x += p, i++) {
      var id = (i - i0) * 7919 + (j - j0) * 104729, on = ((id * 2654435761) >>> 0) % 1000 < 15;
      c.fillStyle = kind === "black" ? (on ? "rgba(255,126,49,0.55)" : "#1f1f1f") : (on ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.16)");
      c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
    return g;
  }

  /* ─────────────── 스테이지 · 하프톤 전환(격자 점이 자라서 면이 된다 · 컷·와이프 대신) ─────────────── */
  var STG = { base: "black", to: null, t0: 0, dur: 0.6, ox: 0, oy: 0 };
  function stageTo(to, ox, oy, dur) {
    if (STG.base === to && !STG.to) return;
    STG.to = to; STG.t0 = T; STG.dur = dur || 0.6; STG.ox = ox == null ? 960 : ox; STG.oy = oy == null ? 540 : oy;
    STG.flipAt = T + STG.dur * 0.45;
  }
  function drawStage() {
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.drawImage(STG.base === "black" ? gridBlack : gridOrange, 0, 0);
    if (!STG.to) return;
    var p = (T - STG.t0) / STG.dur;
    if (STG.flipAt && T >= STG.flipAt) { document.body.classList.toggle("st-orange", STG.to === "orange"); STG.flipAt = 0; }
    if (p >= 1) { STG.base = STG.to; STG.to = null; cx.drawImage(STG.base === "black" ? gridBlack : gridOrange, 0, 0); return; }
    /* 원점에서 퍼지는 파면 · 파면 뒤의 점이 격자 칸을 덮을 만큼 자란다 */
    var pp = PITCH, band = 520, maxD = 2300, front = EIO(p) * (maxD + band);
    var colr = STG.to === "orange" ? C.o : C.k;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.fillStyle = colr; cx.beginPath();
    var xs = -vox / vs, ys = -voy / vs, xe = (vw - vox) / vs, ye = (vh - voy) / vs;
    var sx0 = Math.floor(xs / pp) * pp + pp / 2, sy0 = Math.floor(ys / pp) * pp + pp / 2;
    for (var y = sy0; y < ye + pp; y += pp) for (var x = sx0; x < xe + pp; x += pp) {
      var d = Math.hypot(x - STG.ox, y - STG.oy), u = clamp((front - d) / band, 0, 1);
      if (u <= 0) continue;
      var r = u * pp * 0.74;
      cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
    }
    cx.fill();
  }

  /* ─────────────── 물리 · Verlet + 공간 격자 (공 수천 개 60fps) ───────────────
   * 상태 bs: 0 없음 · 1 떨어지는 중(통 밖) · 2 통 안 · 3 당첨 공(키네마틱) */
  var MAXB = 8192;
  var bx = new Float32Array(MAXB), by = new Float32Array(MAXB), bpx = new Float32Array(MAXB), bpy = new Float32Array(MAXB);
  var ba = new Float32Array(MAXB), bph = new Float32Array(MAXB), bborn = new Float32Array(MAXB), bland = new Float32Array(MAXB);
  var bs = new Uint8Array(MAXB), bno = new Array(MAXB), bpk = new Array(MAXB), bnoI = new Int32Array(MAXB);
  var NB = 0, R = 22, RT = 22, nAlive = 0, nInside = 0;
  var MIX = { e: 0, target: 0, omega: 0.06, rot: 0 };
  var PH = { acc: 0, h: 1 / 120, impacts: 0, impactV: 0, ms: 0 };
  var grid = { cs: 0, gw: 0, gh: 0, x0: 0, y0: 0, cnt: null, idx: null, cell: new Int32Array(MAXB) };
  var ballOfNo = {};
  function addBall(no, pk, x, y, vx, vy, st) {
    var i = NB++;
    if (i >= MAXB) { NB--; return -1; }
    bx[i] = x; by[i] = y; bpx[i] = x - (vx || 0) * PH.h; bpy[i] = y - (vy || 0) * PH.h;
    ba[i] = rng() * 6.28; bph[i] = hash(i + 1); bborn[i] = T; bland[i] = -9; bs[i] = st || 1; bno[i] = no; bpk[i] = pk; bnoI[i] = +no;
    ballOfNo[no] = i;
    return i;
  }
  function killBall(i) { if (bs[i]) { bs[i] = 0; delete ballOfNo[bno[i]]; } }
  function countAlive() {
    var a = 0, n = 0;
    for (var i = 0; i < NB; i++) if (bs[i]) { a++; if (bs[i] === 2) n++; }
    nAlive = a; nInside = n;
  }
  function targetRadius() { return clamp(Math.sqrt(0.5 * DR * DR / Math.max(nAlive, 150)), 5.2, 23); }
  function physStep(h) {
    var g = 2600, i, j, e = MIX.e, rr = R, lim = DR - rr, tt = T;
    /* 1. 적분 + 믹싱 힘(바닥 공기 분사 · 소용돌이 · 난류) */
    var damp = e > 0.05 ? 0.9985 : 0.996, vmax = rr * 0.9;
    for (i = 0; i < NB; i++) {
      var s = bs[i]; if (!s || s === 3) continue;
      var vx = (bx[i] - bpx[i]) * damp, vy = (by[i] - bpy[i]) * damp;
      var sp = Math.hypot(vx, vy); if (sp > vmax) { vx *= vmax / sp; vy *= vmax / sp; }
      var ax = 0, ay = g;
      if (s === 2 && e > 0) {
        var dx = bx[i] - DX, dy = by[i] - DY, d = Math.hypot(dx, dy) + 1e-3, ph = bph[i] * 6.2832;
        if (dy > -DR * 0.1) ay -= e * 5400 * (0.5 + 0.5 * Math.sin(tt * 6.1 + ph * 3 + dx * 0.02)) * (dy / DR + 0.5);   /* 바닥 공기 분사 */
        ax += e * 380 * (-dy / d) - e * dx * 2.4;                                                                   /* 약한 소용돌이 + 가운데로 */
        ay += e * 380 * (dx / d) - e * dy * 1.2;
        ax += e * 2600 * Math.sin(by[i] * 0.012 + tt * 2.7 + ph) * Math.cos(bx[i] * 0.009 - tt * 1.3);               /* 소용돌이 난류(자리마다 다르다) */
        ay += e * 2600 * Math.cos(bx[i] * 0.011 + tt * 2.1) * Math.sin(by[i] * 0.008 + tt * 1.7 + ph);
        if (rng() < e * 0.007) { var ka = rng() * 6.2832, kv = rr * (0.3 + rng() * 0.4); vx += Math.cos(ka) * kv; vy += Math.sin(ka) * kv - rr * 0.2; }   /* 튀는 공 */
      }
      bpx[i] = bx[i]; bpy[i] = by[i];
      bx[i] += vx + ax * h * h; by[i] += vy + ay * h * h;
      if (bx[i] !== bx[i] || by[i] !== by[i]) { bx[i] = DX; by[i] = DY; bpx[i] = DX; bpy[i] = DY; }   /* NaN 방어 */
    }
    /* 2. 충돌 · 격자에 담고 이웃 칸만 본다 */
    var cs = rr * 2, x0 = DX - DR - cs, y0 = DY - DR - cs * 3, gw = Math.ceil((DR * 2 + cs * 2) / cs) + 1, gh = Math.ceil((DR * 2 + cs * 4) / cs) + 1, nc = gw * gh;
    if (!grid.cnt || grid.cnt.length < nc + 1) { grid.cnt = new Int32Array(nc + 1); grid.idx = new Int32Array(MAXB); }
    var cnt = grid.cnt, idx = grid.idx, cell = grid.cell;
    for (var it = 0; it < 2; it++) {
      cnt.fill(0, 0, nc + 1);
      for (i = 0; i < NB; i++) {
        if (!bs[i]) { cell[i] = -1; continue; }
        var gx = Math.floor((bx[i] - x0) / cs), gy = Math.floor((by[i] - y0) / cs);
        if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) { cell[i] = -1; continue; }
        var c = gy * gw + gx; cell[i] = c; cnt[c + 1]++;
      }
      for (c = 0; c < nc; c++) cnt[c + 1] += cnt[c];
      var fillp = grid.fillp || (grid.fillp = new Int32Array(MAXB));
      if (fillp.length < nc) fillp = grid.fillp = new Int32Array(nc + 64);
      for (c = 0; c < nc; c++) fillp[c] = cnt[c];
      for (i = 0; i < NB; i++) if (cell[i] >= 0) idx[fillp[cell[i]]++] = i;
      var dd = cs * cs, imp = 0, impV = 0;
      for (var gyy = 0; gyy < gh; gyy++) for (var gxx = 0; gxx < gw; gxx++) {
        var c0 = gyy * gw + gxx, a0 = cnt[c0], a1 = cnt[c0 + 1];
        if (a0 === a1) continue;
        for (var nb = 0; nb < 5; nb++) {                /* 자기 칸 + 오른쪽 · 아래 세 칸(쌍을 한 번만) */
          var ox = nb === 0 ? 0 : nb === 1 ? 1 : nb - 3, oy = nb <= 1 ? 0 : 1;
          var nx2 = gxx + ox, ny2 = gyy + oy;
          if (nx2 < 0 || nx2 >= gw || ny2 >= gh) continue;
          var c1 = ny2 * gw + nx2, b0 = cnt[c1], b1 = cnt[c1 + 1];
          for (var pa = a0; pa < a1; pa++) {
            i = idx[pa];
            for (var pb = (nb === 0 ? pa + 1 : b0); pb < b1; pb++) {
              j = idx[pb];
              var ddx = bx[j] - bx[i], ddy = by[j] - by[i], d2 = ddx * ddx + ddy * ddy;
              if (d2 >= dd || d2 < 1e-6 || (bs[i] === 1 && bs[j] === 1)) continue;
              var dist = Math.sqrt(d2), ov = (cs - dist), nxx = ddx / dist, nyy = ddy / dist;
              var wi = bs[i] === 3 ? 0 : 1, wj = bs[j] === 3 ? 0 : 1, ws = wi + wj; if (!ws) continue;
              var mi = ov * wi / ws, mj = ov * wj / ws;
              bx[i] -= nxx * mi; by[i] -= nyy * mi; bx[j] += nxx * mj; by[j] += nyy * mj;
              if (it === 0) {
                var rv = ((bx[j] - bpx[j]) - (bx[i] - bpx[i])) * nxx + ((by[j] - bpy[j]) - (by[i] - bpy[i])) * nyy;
                if (rv < -1.6) { imp++; if (-rv > impV) impV = -rv; }
              }
            }
          }
        }
      }
      if (it === 0) { PH.impacts += imp; if (impV > PH.impactV) PH.impactV = impV; }
      /* 3. 벽 · 통 안의 공은 원 안으로 · 벽이 돌면 마찰로 끌려간다 */
      var wall = MIX.omega * DR * h, eRest = e > 0.05 ? 0.55 : 0.25;
      for (i = 0; i < NB; i++) {
        var st = bs[i]; if (!st || st === 3) continue;
        var wx = bx[i] - DX, wy = by[i] - DY, wd = Math.hypot(wx, wy);
        if (st === 1) {
          if (by[i] < DY - DR + rr * 2) { var cw = Math.max(4, 58 - rr); if (bx[i] < DX - cw) bx[i] = DX - cw; if (bx[i] > DX + cw) bx[i] = DX + cw; bpx[i] = bx[i] - (bx[i] - bpx[i]) * 0.3; }
          if (wd < lim - 1 && by[i] > DY - DR + rr) { bs[i] = 2; bland[i] = T; if (!REC || true) landSound(); }
          continue;
        }
        if (wd > lim) {
          if (wd > DR + rr * 6) { bx[i] = DX + (rng() - 0.5) * 40; by[i] = DY; bpx[i] = bx[i]; bpy[i] = by[i]; continue; }   /* 빠져나간 공 복구 */
          var nx = wx / wd, ny = wy / wd;
          bx[i] = DX + nx * lim; by[i] = DY + ny * lim;
          var vx2 = bx[i] - bpx[i], vy2 = by[i] - bpy[i], vn = vx2 * nx + vy2 * ny;
          if (vn > 0) { vx2 -= (1 + eRest) * vn * nx; vy2 -= (1 + eRest) * vn * ny; }
          var tx = -ny, ty = nx, vt = vx2 * tx + vy2 * ty, k = 0.025;
          vx2 += tx * (wall - vt) * k; vy2 += ty * (wall - vt) * k;
          bpx[i] = bx[i] - vx2; bpy[i] = by[i] - vy2;
        }
      }
    }
    /* 4. 굴림 · 접선 속도로 회전(숫자가 돌아간다) */
    for (i = 0; i < NB; i++) if (bs[i] === 2) ba[i] += (bx[i] - bpx[i]) / rr * 0.9;
  }
  var lastDrop = 0;
  function landSound() { if (T - lastDrop > 0.045) { lastDrop = T; SFX.play("drop", rng()); } }

  /* ─────────────── 공 스프라이트 아틀라스 · 번호가 적힌 오렌지 공(평면 · 그림자 없음) ─────────────── */
  var atlas = { c: null, key: "", cell: 0, cols: 0, map: {} };
  function VS0() { return BASEVS || vs; }
  function buildAtlas() {
    var ps = R * VS0(), key = Math.round(ps * 2) / 2 + "|" + NB;
    if (atlas.key === key) return;
    if (ps < 6.5) { atlas.key = key; atlas.small = true; return; }
    atlas.small = false;
    var cell = Math.ceil(ps * 2 + 2), n = NB, cols = Math.max(1, Math.floor(4096 / cell)), rows = Math.ceil(n / cols);
    if (!atlas.c) atlas.c = document.createElement("canvas");
    atlas.c.width = cols * cell; atlas.c.height = Math.max(1, rows * cell);
    var c = atlas.c.getContext("2d");
    c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "700 " + (ps * 0.74).toFixed(1) + "px " + FONT;
    for (var i = 0; i < n; i++) {
      var col = i % cols, row = Math.floor(i / cols), x = col * cell + cell / 2, y = row * cell + cell / 2;
      c.fillStyle = C.o; c.beginPath(); c.arc(x, y, ps, 0, 6.2832); c.fill();
      if (ps >= 10) { c.fillStyle = "#1A0B02"; c.fillText(bno[i] || "", x, y + ps * 0.05); }
      else { c.fillStyle = C.pu; c.beginPath(); c.arc(x, y, ps * 0.22, 0, 6.2832); c.fill(); }   /* 번호가 안 읽히는 크기에서는 KV 01 링 점(보라 핵) */
    }
    atlas.cell = cell; atlas.cols = cols; atlas.key = key;
  }

  /* ─────────────── 입자 (흩어짐 · 파문 · 축하 점) ─────────────── */
  var PMAX = 9000, pn = 0;
  var px_ = new Float32Array(PMAX), py_ = new Float32Array(PMAX), pvx = new Float32Array(PMAX), pvy = new Float32Array(PMAX);
  var plife = new Float32Array(PMAX), pmax = new Float32Array(PMAX), psz = new Float32Array(PMAX), pgr = new Float32Array(PMAX), pdr = new Float32Array(PMAX), pcol = new Uint8Array(PMAX);
  var PCOL = [C.o, C.hi, C.pu, C.w, C.o25];
  function spark(x, y, vx, vy, life, size, col, grav, drag) {
    if (pn >= PMAX) return;
    var i = pn++;
    px_[i] = x; py_[i] = y; pvx[i] = vx; pvy[i] = vy; plife[i] = 0; pmax[i] = life; psz[i] = size; pcol[i] = col; pgr[i] = grav || 0; pdr[i] = drag == null ? 1.6 : drag;
  }
  function stepParticles(dt) {
    for (var i = 0; i < pn; i++) {
      plife[i] += dt;
      if (plife[i] >= pmax[i]) { pn--; if (i < pn) { px_[i] = px_[pn]; py_[i] = py_[pn]; pvx[i] = pvx[pn]; pvy[i] = pvy[pn]; plife[i] = plife[pn]; pmax[i] = pmax[pn]; psz[i] = psz[pn]; pcol[i] = pcol[pn]; pgr[i] = pgr[pn]; pdr[i] = pdr[pn]; } i--; continue; }
      var k = Math.exp(-pdr[i] * dt);
      pvx[i] *= k; pvy[i] = pvy[i] * k + pgr[i] * dt;
      px_[i] += pvx[i] * dt; py_[i] += pvy[i] * dt;
    }
  }
  function drawParticles() {
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    for (var c = 0; c < PCOL.length; c++) {
      cx.fillStyle = PCOL[c]; cx.beginPath();
      for (var i = 0; i < pn; i++) {
        if (pcol[i] !== c) continue;
        var u = plife[i] / pmax[i], r = psz[i] * (u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3);
        if (r < 0.3) continue;
        cx.moveTo(px_[i] + r, py_[i]); cx.arc(px_[i], py_[i], r, 0, 6.2832);
      }
      cx.fill();
    }
  }
  function popBall(i) {                                /* 같은 분의 다른 공 · 점 8개로 흩어진다 */
    var x = bx[i], y = by[i];
    for (var k = 0; k < 8; k++) { var a = k / 8 * 6.2832 + rng(), s = 160 + rng() * 220; spark(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.7 + rng() * 0.4, R * 0.28, k % 3 === 0 ? 1 : 0, 300, 2.2); }
    killBall(i); SFX.play("pop");
  }
  function ringWave(x, y, n, speed, size, col, life) {
    for (var k = 0; k < n; k++) { var a = k / n * 6.2832; spark(x + Math.cos(a) * 20, y + Math.sin(a) * 20, Math.cos(a) * speed, Math.sin(a) * speed, life || 1.1, size, col, 0, 0.9); }
  }

  /* ─────────────── 추첨 통 · 점 고리(KV 02 Connection) ─────────────── */
  var DRUM = { inlet: 0, inletT: 0, gate: 0, gateT: 0, pulse: 0, alpha: 1, glow: 0 };
  function drawDrum() {
    var n = 132, i, beatWave = DRUM.pulse;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.globalAlpha = DRUM.alpha;
    var tiers = [C.o, C.hi, C.pu];
    for (var tier = 0; tier < 3; tier++) {
      cx.fillStyle = tiers[tier]; cx.beginPath();
      for (i = 0; i < n; i++) {
        var rank = i * 13 % 36, base = rank < 7 ? 8 : rank < 18 ? 4.6 : 2.6;
        if (tier > 0 && rank >= 7) continue;
        var a = i / n * 6.2832 + MIX.rot;
        /* 투입구·배출구 자리에서는 점이 작아져 틈이 열린다(고리 자체는 계속 돈다) */
        var gi = gapK(a, INLET, 0.2) * DRUM.inlet, gg = gapK(a, GATE, 0.2) * DRUM.gate;
        var k = 1 - Math.max(gi, gg);
        if (k <= 0.02) continue;
        var wave = 1 + 0.45 * beatWave * Math.max(0, Math.cos(a - MIX.rot * 3 - T * 4)) + 0.25 * DRUM.glow;
        var r = base * k * wave * (tier === 0 ? 1 : tier === 1 ? 18 / 38 : 8 / 38);
        var rr = RING + (rank < 7 ? 0 : rank < 18 ? 6 : 12) * 0 + 0;
        var x = DX + Math.cos(a) * rr, y = DY + Math.sin(a) * rr;
        cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
      }
      cx.fill();
    }
    /* 투입구 위 안내 점선 · 체크인 중에만 */
    if (DRUM.inlet > 0.05) {
      cx.fillStyle = "rgba(255,150,62," + (0.5 * DRUM.inlet).toFixed(3) + ")"; cx.beginPath();
      for (var y2 = DY - RING - 30; y2 > -20; y2 -= 26) { var ph = ((T * 90) % 26); cx.moveTo(DX + 2.4, y2 + ph); cx.arc(DX, y2 + ph, 2.4, 0, 6.2832); }
      cx.fill();
    }
    cx.globalAlpha = 1;
  }
  function gapK(a, c, w) { var d = Math.atan2(Math.sin(a - c), Math.cos(a - c)); return Math.max(0, 1 - Math.abs(d) / w); }

  function drawBalls(alphaAll) {
    buildAtlas();
    var i, ps = R * vs;
    cx.globalAlpha = alphaAll == null ? 1 : alphaAll;
    if (atlas.small) {
      cx.setTransform(vs, 0, 0, vs, vox, voy);
      cx.fillStyle = C.o; cx.beginPath();
      for (i = 0; i < NB; i++) { if (!bs[i] || bs[i] === 3 || i === HOP.cur) continue; cx.moveTo(bx[i] + R, by[i]); cx.arc(bx[i], by[i], R, 0, 6.2832); }
      cx.fill();
    } else {
      var cell = atlas.cell, cols = atlas.cols, sc = ps / ((cell - 2) / 2), half = cell / 2;   /* 아틀라스는 기본 배율로 한 번 · 카메라 배율은 여기서 곱한다 */
      for (i = 0; i < NB; i++) {
        if (!bs[i] || bs[i] === 3 || i === HOP.cur) continue;
        var co = Math.cos(ba[i]) * sc, si = Math.sin(ba[i]) * sc;
        cx.setTransform(co, si, -si, co, vox + bx[i] * vs, voy + by[i] * vs);
        cx.drawImage(atlas.c, (i % cols) * cell, Math.floor(i / cols) * cell, cell, cell, -half, -half, cell, cell);
      }
    }
    /* 방금 들어온 공 · Hi Orange 고리가 한 번 퍼진다 */
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.lineWidth = 2.5; cx.strokeStyle = C.hi; cx.beginPath();
    for (i = 0; i < NB; i++) {
      if (bs[i] !== 2) continue;
      var u = (T - bland[i]) / 0.55; if (u < 0 || u > 1) continue;
      var rr = R * (1.1 + u * 1.3); cx.moveTo(bx[i] + rr, by[i]); cx.arc(bx[i], by[i], rr, 0, 6.2832);
    }
    cx.globalAlpha = (alphaAll == null ? 1 : alphaAll) * 0.9; cx.stroke(); cx.globalAlpha = 1;
    /* 긴장 구간 · 옮겨 다니는 하이라이트 */
    if (HOP.cur >= 0 && bs[HOP.cur] === 2) {
      var j = HOP.cur, big = HOP.locked ? 1 + 0.12 * Math.sin(T * 18) : 1.18;
      cx.setTransform(vs, 0, 0, vs, vox, voy);
      cx.fillStyle = C.w; cx.beginPath(); cx.arc(bx[j], by[j], R * big * 1.28, 0, 6.2832); cx.fill();
      cx.fillStyle = HOP.locked ? C.hi : C.o; cx.beginPath(); cx.arc(bx[j], by[j], R * big, 0, 6.2832); cx.fill();
      if (R * vs >= 7) { cx.fillStyle = "#1A0B02"; cx.font = "700 " + (R * big * 0.74).toFixed(1) + "px " + FONT; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(bno[j], bx[j], by[j] + R * 0.05); }
    }
  }

  /* ─────────────── 힉스필드 영상 · 장면 시계로 재생(녹화 모드에서는 프레임마다 위치를 맞춘다) ─────────────── */
  var VID = {};
  function vid(name) {
    if (!VID[name]) { var el = document.getElementById(name === "intro" ? "vIntro" : "vBurst"); VID[name] = { el: el, on: false, t0: 0, ok: true }; if (el) el.addEventListener("error", function () { VID[name].ok = false; }); }
    return VID[name];
  }
  function vidStart(name) {
    var v = vid(name); if (!v.el || !v.ok) return false;
    v.on = true; v.t0 = T; v.cut = 0;
    if (!REC) { try { v.el.currentTime = 0; var pr = v.el.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
    return true;
  }
  function vidCut(name) { var v = vid(name); if (v.on && !v.cut) v.cut = T; }
  function vidStop(name) { var v = vid(name); v.on = false; if (v.el) { v.el.style.opacity = 0; if (!REC) try { v.el.pause(); } catch (e) {} } }
  function stepVideos() {
    for (var k in VID) {
      var v = VID[k]; if (!v.on) continue;
      var t = T - v.t0, dur = (v.el.duration && isFinite(v.el.duration)) ? v.el.duration : 5, op;
      if (k === "intro") op = clamp(t / 0.3, 0, 1) * clamp((dur - 0.1 - t) / 0.6, 0, 1);
      else op = 0.95 * clamp(t / 0.15, 0, 1) * clamp((4.2 - t) / 1.2, 0, 1);
      if (v.cut) op *= clamp(1 - (T - v.cut) / 0.3, 0, 1);
      v.el.style.opacity = op.toFixed(3);
      if (t >= (k === "intro" ? dur - 0.1 : 4.2)) { vidStop(k); if (k === "intro" && SC === "intro") { scene("idle"); lock(0.4); } }
    }
  }
  function vidSeeks() {                                  /* 녹화용 · [요소, 초] */
    var out = [];
    for (var k in VID) { var v = VID[k]; if (v.on) out.push([v.el.id, Math.max(0, Math.min((v.el.duration || 5) - 0.05, T - v.t0))]); }
    return out;
  }

  /* ─────────────── 장면 ─────────────── */
  var T = 0, sceneT0 = 0, SC = ST.scene === "idle" ? "idle" : "restore";
  var HOP = { cur: -1, list: [], k: 0, locked: false };
  var WIN = { i: -1, r: null, x: 0, y: 0, rad: 0, path: null };
  var DIG = { n: 0, sx: null, sy: null, tx: null, ty: null, dl: null, t0: 0, out: 0, ox: 0, oy: 0 };
  var ARR = { q: [], acc: 0, t: 0, lastPk: [] };
  var ME = { pts: null, t0: 0, from: null };
  var busyUntil = 0, confirmKey = null, confirmT = 0;
  function scene(s) { SC = s; sceneT0 = T; ST.scene = s === "restore" ? ST.scene : s; document.body.dataset.scene = s; persist(); uiScene(); }
  function sT() { return T - sceneT0; }
  function rounds() { return CFG.rounds && CFG.rounds.length ? CFG.rounds : DEF.rounds; }
  function curRound() { return rounds()[Math.min(ST.round, rounds().length - 1)]; }
  function roundWins(ri, shown) { return ST.results.filter(function (r) { return r.round === ri && r.st === "win" && !(shown && r.id === ST.pending); }); }
  function eligible() {
    var out = [];
    for (var i = 0; i < NB; i++) if (bs[i] === 2 && !ST.out[bpk[i]]) out.push(i);
    return out;
  }

  /* 체크인 · 한 사람의 공 1~3개가 차례로 투입구로 떨어진다 */
  function queueArrival(pk) {
    if (ST.arrived.indexOf(pk) >= 0 || ARR.q.indexOf(pk) >= 0) return;
    ARR.q.push(pk);
  }
  function arrive(pk) {
    var p = ST.pool.people[pk]; if (!p || ST.arrived.indexOf(pk) >= 0) return;
    ST.arrived.push(pk);
    p.nos.forEach(function (no, k) {
      DROPS.push({ at: T + k * 0.13, no: no, pk: pk });
    });
    ARR.lastPk.unshift(pk); if (ARR.lastPk.length > 4) ARR.lastPk.length = 4;
    ARR.dirty = true;
  }
  var DROPS = [];
  function stepDrops() {
    for (var k = 0; k < DROPS.length; k++) {
      var d = DROPS[k]; if (T < d.at) continue;
      DROPS.splice(k--, 1);
      if (ballOfNo[d.no] != null) continue;
      var jx = (rng() - 0.5) * Math.min(60, DR * 0.14);
      addBall(d.no, d.pk, DX + jx, -30 - rng() * 30, jx * 0.4, 420 + rng() * 200, 1);
    }
  }
  function stepArrivals(dt) {
    if (SC !== "checkin") return;
    if (ST.pool && ST.pool.kind === "demo" && ARR.auto) {
      /* 데모 · 처음엔 드문드문, 점점 몰린다(실제 입장 곡선 가정) */
      var rate = CFG.demoRate * (0.25 + 0.75 * EIO(sT() / 12));
      ARR.acc += rate * dt;
      while (ARR.acc >= 1) { ARR.acc -= 1; var nxt = ST.pool.order.filter(function (pk) { return ST.arrived.indexOf(pk) < 0 && ARR.q.indexOf(pk) < 0; })[0]; if (nxt) ARR.q.push(nxt); else break; }
    }
    ARR.t -= dt;
    if (ARR.q.length && ARR.t <= 0) {
      arrive(ARR.q.shift());
      ARR.t = ARR.q.length > 30 ? 0.03 : ARR.q.length > 8 ? 0.07 : 0.11;
      if (!(ST.arrived.length % 8)) persist();
    }
  }

  /* 공개용 · 체크인 없이 복원(새로고침) · 공을 통 안에 바로 앉힌다 */
  function rebuildBalls() {
    NB = 0; ballOfNo = {};
    if (!ST.pool) return;
    var list = [], won = {};
    ST.results.forEach(function (r) { if (r.st === "win") won[r.no] = 1; });
    ST.arrived.forEach(function (pk) { if (ST.out[pk]) return; var p = ST.pool.people[pk]; if (p) p.nos.forEach(function (no) { if (!won[no]) list.push([no, pk]); }); });
    nAlive = list.length; R = RT = targetRadius();
    list.forEach(function (x, k) {
      var a = rng() * 6.2832, d = Math.sqrt(rng()) * (DR - R * 1.5);
      addBall(x[0], x[1], DX + Math.cos(a) * d, DY + Math.abs(Math.sin(a)) * d * 0.6 + DR * 0.25, 0, 0, 2);
    });
    for (var k = 0; k < 360; k++) physStep(PH.h);
    countAlive();
  }

  /* ── 행동 ── */
  var wake = null;
  function keepAwake() {                               /* 발표 중 화면 꺼짐 방지(지원 브라우저) */
    try { if (!wake && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; w.addEventListener("release", function () { wake = null; }); }).catch(function () {}); } catch (e) {}
  }
  function act(cmd, arg) {
    keepAwake();
    if (T < busyUntil && cmd !== "mute" && cmd !== "fs" && cmd !== "help" && cmd !== "hud") return;
    SFX.ensure();
    switch (cmd) {
      case "next": return next();
      case "close": return twice("close", "한 번 더 누르면 체크인을 마감합니다", closeCheckin);
      case "redraw": return twice("redraw", "한 번 더 누르면 부재 처리 후 다시 뽑습니다", redraw);
      case "undo": return twice("undo", "한 번 더 누르면 마지막 당첨을 취소합니다", undoLast);
      case "end": return twice("end", "한 번 더 누르면 끝 화면으로 갑니다", function () { goEnd(); });
      case "idle": return twice("idle", "한 번 더 누르면 대기 화면으로 갑니다", function () { goIdle(); });
      case "round": if (SC === "mix" || SC === "card") { var ri = +arg; if (ri >= 0 && ri < rounds().length) { ST.round = ri; goCard(); } } return;
      case "add": if (SC === "checkin" && ST.pool) { var c = 0; ST.pool.order.forEach(function (pk) { if (c < (arg || 10) && ST.arrived.indexOf(pk) < 0 && ARR.q.indexOf(pk) < 0) { ARR.q.push(pk); c++; } }); } return;
      case "auto": ARR.auto = !ARR.auto; toast(ARR.auto ? "자동 체크인 켬(데모)" : "자동 체크인 끔(데모)"); return;
      case "mute": SFX.mute(SFX.on); toast(SFX.on ? "소리 켬" : "소리 끔"); pushCtl(); return;
      case "fs": if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen && document.exitFullscreen(); return;
      case "help": document.body.classList.toggle("help-on"); return;
      case "hud": document.body.classList.toggle("hud-on"); return;
      case "ctl": openControl(); return;
      case "intro": if (SC === "idle" && vidStart("intro")) { scene("intro"); lock(1); SFX.play("riser", 3.6); setTimeoutSim(function () { SFX.play("hit"); }, 3.9); } return;
      case "reset": resetAll(); return;
      case "reload": if (CFG.mode === "server") serverLoad(function () { pushCtl(); }); return;
    }
  }
  function twice(k, msg, fn) {
    if (confirmKey === k && T - confirmT < 2.5) { confirmKey = null; toast(""); fn(); return; }
    confirmKey = k; confirmT = T; toast(msg);
  }
  function lock(sec) { busyUntil = T + sec; }
  function next() {
    switch (SC) {
      case "idle": return startCheckin();
      case "checkin": return twice("close", "한 번 더 누르면 체크인을 마감합니다", closeCheckin);
      case "closed": return goCard();
      case "card": if (sT() > 0.8) return goMix(); return;
      case "mix": if (sT() > 1.2) return draw(); return;
      case "reveal": if (sT() > 1.4) return confirmWin(); return;
      case "board": return goEnd();
      case "end": return;
    }
  }
  function startCheckin() {
    if (CFG.mode === "demo" && (!ST.pool || ST.pool.kind !== "demo")) ST.pool = demoPool(CFG.demoN, ST.seed);
    if (CFG.mode === "server" && !ST.pool) serverLoad(function () { pushCtl(); });
    ARR.auto = CFG.mode === "demo";
    /* ME to WE 심볼 점이 흩어져 떨어진다 → 빈 통 */
    scatterSymbol();
    DRUM.inletT = 1; scene("checkin"); lock(0.6);
    SFX.play("whoosh", 0.9);
    if (CFG.mode === "server") SRV.polling = setInterval(function () { if (SC === "checkin" && SRV.hasPool) serverLoad(function () {}); }, 3000);
  }
  function closeCheckin() {
    if (SC !== "checkin") return;
    ARR.q.length = 0; ARR.auto = false; DROPS.length = DROPS.filter(function (d) { return d.at <= T + 0.5; }).length ? DROPS.length : 0;
    ST.closed = true; DRUM.inletT = 0; if (SRV.polling) clearInterval(SRV.polling);
    scene("closed"); lock(0.8); SFX.play("stamp");
  }
  function goCard() {
    stageTo("orange", DX, DY, 0.7); scene("card"); lock(0.8); SFX.play("whoosh", 0.8); setTimeoutSim(function () { SFX.play("bell", 784, 0.12); SFX.play("bell", 1175, 0.08); }, 0.35);
  }
  function goMix() {
    stageTo("black", 960, 540, 0.6); scene("mix"); lock(0.6); MIX.target = 1;
  }
  function draw() {
    var el = eligible();
    if (!el.length) { toast("통에 공이 없습니다"); return; }
    var r = curRound(), wins = roundWins(ST.round).length;
    if (wins >= r.count) { toast("이 라운드 인원이 다 찼습니다"); return; }
    var w = el[fair(el.length)];
    /* 결정 즉시 기록 · 새로고침해도 같은 결과로 돌아온다 */
    var res = { id: "r" + Date.now().toString(36) + Math.floor(rng() * 1e4), round: ST.round, slot: wins + 1, no: bno[w], pk: bpk[w],
      nm: (ST.pool.people[bpk[w]] || {}).nm || "", dp: (ST.pool.people[bpk[w]] || {}).dp || "", prize: r.prize, rname: r.name, at: new Date().toISOString(), st: "win", pool: el.length };
    ST.results.push(res); ST.pending = res.id; if (CFG.onePerPerson) ST.out[res.pk] = "win"; persist(); serverLog(res);
    WIN.i = w; WIN.r = res;
    /* 틱 스케줄 · 빠르게 옮겨 다니다 느려지며 당첨 공에 멈춘다 */
    HOP.list = []; var t = 0, n = 26;
    for (var k = 0; k < n; k++) {
      var u = k / (n - 1), gap = 0.045 + 0.34 * Math.pow(u, 2.4);
      t += gap;
      var pick = k === n - 1 ? w : el[Math.floor(rng() * el.length)];
      if (pick === w && k < n - 1) pick = el[(el.indexOf(w) + 1) % el.length];
      HOP.list.push([t, pick, u]);
    }
    HOP.k = 0; HOP.cur = -1; HOP.locked = false; HOP.dur = t + 0.45;
    scene("tension"); lock(99);
    SFX.play("riser", t);
    [0, 0.85, 1.55, 2.15, 2.6].forEach(function (d) { if (d < t) HEARTS.push(T + d); });
  }
  var HEARTS = [];
  function stepTension() {
    var u = sT() / HOP.dur;
    MIX.target = u < 0.55 ? 1.35 : Math.max(0.12, 1.35 * (1 - (u - 0.55) / 0.35));
    while (HOP.k < HOP.list.length && sT() >= HOP.list[HOP.k][0]) {
      var hp = HOP.list[HOP.k]; HOP.cur = hp[1];
      if (HOP.k === HOP.list.length - 1) { HOP.locked = true; SFX.play("lock"); DRUM.glow = 1; }
      else SFX.play("tick", hp[2]);
      HOP.k++;
    }
    if (sT() >= HOP.dur) startExit();
  }
  function startExit() {
    var i = WIN.i;
    bs[i] = 3; WIN.x = bx[i]; WIN.y = by[i]; WIN.a = ba[i];
    var gin = { x: DX + Math.cos(GATE) * (DR - R * 1.2), y: DY + Math.sin(GATE) * (DR - R * 1.2) };
    var gout = { x: DX + Math.cos(GATE) * (RING + 60), y: DY + Math.sin(GATE) * (RING + 60) };
    WIN.path = { s: { x: bx[i], y: by[i] }, gin: gin, gout: gout, tray: TRAY };
    DRUM.gateT = 1; MIX.target = 0.08; WIN.z = 0; WIN.zs = 0;
    scene("exit"); lock(99);
    SFX.play("roll", 1.1);
  }
  function stepExit() {
    var t = sT(), P = WIN.path, i = WIN.i, x, y;
    if (t < 0.55) { var u = EIO(t / 0.55); x = P.s.x + (P.gin.x - P.s.x) * u; y = P.s.y + (P.gin.y - P.s.y) * u; }
    else if (t < 1.3) {
      var v = EIO((t - 0.55) / 0.75), a = 1 - v;
      x = a * a * P.gin.x + 2 * a * v * P.gout.x + v * v * P.tray.x;
      y = a * a * P.gin.y + 2 * a * v * P.gout.y + v * v * P.tray.y;
      if (t > 0.95) DRUM.gateT = 0;
    } else { x = P.tray.x; y = P.tray.y - Math.abs(Math.sin((t - 1.3) * 14)) * 18 * Math.max(0, 1 - (t - 1.3) / 0.35); }
    var mv = Math.hypot(x - bx[i], y - by[i]);
    bpx[i] = bx[i]; bpy[i] = by[i]; bx[i] = x; by[i] = y; ba[i] += mv / R;
    WIN.x = x; WIN.y = y; WIN.a = ba[i];
    /* 줌 · 공이 화면 가운데로 커진다 */
    WIN.z = EIO((t - 1.55) / 1.05);
    if (t > 1.55 && !WIN.zs) { WIN.zs = 1; WIN.aZ = Math.atan2(Math.sin(ba[i]), Math.cos(ba[i])); SFX.play("whoosh", 1.0); fade($("pMix"), 0, 0.35); }
    if (t >= 2.6) startReveal();
  }
  function winRad() { return R + (330 - R) * (WIN.z || 0); }
  function winPos() { var z = WIN.z || 0; return { x: WIN.x + (960 - WIN.x) * z, y: WIN.y + (470 - WIN.y) * z }; }

  /* 공개 · 공이 터져 점이 되고, 점이 모여 번호가 된다(도트 레터링) */
  var digCanvas = null;
  function buildDigits(text) {
    if (!digCanvas) digCanvas = document.createElement("canvas");
    var w = 1600, h = 520; digCanvas.width = w; digCanvas.height = h;
    var c = digCanvas.getContext("2d");
    c.clearRect(0, 0, w, h); c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "800 440px " + FONT; c.fillText(text, w / 2, h / 2 + 20);
    var d = c.getImageData(0, 0, w, h).data, pts = [], step = 15;
    for (var y = step / 2; y < h; y += step) for (var x = step / 2; x < w; x += step) {
      var a = d[(Math.floor(y) * w + Math.floor(x)) * 4 + 3];
      if (a > 110) pts.push([x - w / 2 + 960, y - h / 2 + 430]);
    }
    return pts;
  }
  function startReveal() {
    var p = winPos(), rad = winRad();
    var pts = buildDigits(WIN.r.no), n = pts.length;
    DIG.n = n; DIG.tx = new Float32Array(n); DIG.ty = new Float32Array(n); DIG.sx = new Float32Array(n); DIG.sy = new Float32Array(n); DIG.dl = new Float32Array(n);
    for (var k = 0; k < n; k++) {
      DIG.tx[k] = pts[k][0]; DIG.ty[k] = pts[k][1];
      var a = rng() * 6.2832, d = Math.sqrt(rng()) * rad;
      DIG.sx[k] = p.x + Math.cos(a) * d; DIG.sy[k] = p.y + Math.sin(a) * d;
      DIG.dl[k] = 0.05 + (pts[k][0] - 460) / 1000 * 0.35 + rng() * 0.12;
    }
    DIG.t0 = T; DIG.out = 0;
    stageTo("orange", p.x, p.y, 0.5);
    /* 파문 3겹 + 축하 점 */
    ringWave(p.x, p.y, 72, 1500, 7, 3, 1.0); ringWave(p.x, p.y, 48, 1050, 9, 1, 1.2); ringWave(p.x, p.y, 36, 700, 12, 2, 1.4);
    for (var k2 = 0; k2 < 420; k2++) { var a2 = rng() * 6.2832, s2 = 300 + rng() * 1500; spark(p.x, p.y, Math.cos(a2) * s2, Math.sin(a2) * s2 - 400, 1.6 + rng() * 1.6, 3 + rng() * 9, [3, 3, 4, 2, 1][k2 % 5], 900, 1.4); }
    SFX.play("hit");
    vidStart("burst");
    bs[WIN.i] = 0; delete ballOfNo[bno[WIN.i]];
    HOP.cur = -1; DRUM.glow = 0; WIN.zs = 0;
    scene("reveal"); lock(1.2);
    uiReveal(WIN.r);
  }
  function drawDigits() {
    if (!DIG.n) return;
    var t = T - DIG.t0, o = DIG.out, n = DIG.n;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.fillStyle = o > 0 ? C.o : C.w;
    cx.beginPath();
    for (var k = 0; k < n; k++) {
      var u = EOB((t - DIG.dl[k]) / 0.75), x = DIG.sx[k] + (DIG.tx[k] - DIG.sx[k]) * u, y = DIG.sy[k] + (DIG.ty[k] - DIG.sy[k]) * u;
      var r = 6.2 * (0.35 + 0.65 * clamp(u, 0, 1));
      /* 정지 뒤에는 01 Me to WE 처럼 점 크기가 파도처럼 숨 쉰다 */
      if (t > 1.2) r *= 1 + 0.2 * Math.max(0, Math.sin((DIG.tx[k] - 400) * 0.006 - (t - 1.2) * 3.2));
      if (o > 0) { var v = EIO(o); x += (DIG.ox - x) * v; y += (DIG.oy - y) * v; r *= 1 - v * 0.8; }
      cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
    }
    cx.fill();
  }
  function confirmWin() {
    var r = WIN.r, ri = ST.round, need = curRound().count;
    ST.pending = null;
    DIG.out = 0.001; DIG.ox = 1010; DIG.oy = 520; vidCut("burst");
    stageTo("black", 960, 540, 0.6);
    SFX.play("whoosh", 0.6);
    lock(0.9);
    OUTPOP = { t: T + 0.7, pk: r.pk };
    var done = roundWins(ri).length >= need;
    if (!done) { scene("mix"); MIX.target = 1; }
    else if (ri + 1 < rounds().length) { scene("mix"); ST.round = ri + 1; persist(); MIX.target = 0.4; NEXTCARD = T + 1.6; }
    else { scene("board"); MIX.target = 0.15; }
  }
  var OUTPOP = null, NEXTCARD = 0, CARDC = null;
  function popPerson(pk) {                            /* 1인 1회 · 같은 분의 나머지 공을 뺀다 */
    var n = 0;
    for (var i = 0; i < NB; i++) if (bs[i] === 2 && bpk[i] === pk) { (function (ii, d) { POPS.push([T + d, ii]); })(i, n * 0.16); n++; }
    if (n) toast("같은 분의 공 " + n + "개 제외", true);
    return n;
  }
  var POPS = [];
  function redraw() {
    if (SC !== "reveal") return;
    var r = WIN.r; r.st = "absent"; ST.pending = null; ST.out[r.pk] = CFG.absentRemove ? "absent" : undefined; if (!CFG.absentRemove) delete ST.out[r.pk];
    serverLog(Object.assign({}, r, { st: "absent" }));
    persist();
    uiAbsent();
    DIG.out = 0.001; DIG.ox = 960; DIG.oy = 1300; vidCut("burst");
    stageTo("black", 960, 540, 0.6); SFX.play("stamp");
    if (CFG.absentRemove) OUTPOP = { t: T + 0.7, pk: r.pk };
    else { var p = ST.pool.people[r.pk]; if (p) DROPS.push({ at: T + 0.8, no: r.no, pk: r.pk }); }   /* 공을 되돌린다 */
    scene("mix"); MIX.target = 1; lock(1.2);
  }
  function undoLast() {
    for (var k = ST.results.length - 1; k >= 0; k--) {
      var r = ST.results[k]; if (r.st !== "win") continue;
      r.st = "undone"; delete ST.out[r.pk]; serverLog(Object.assign({}, r, { st: "undo" }));
      var p = ST.pool && ST.pool.people[r.pk];
      if (p) p.nos.forEach(function (no, j) { if (ballOfNo[no] == null) DROPS.push({ at: T + 0.3 + j * 0.15, no: no, pk: r.pk }); });
      if (r.round < ST.round && roundWins(r.round).length < rounds()[r.round].count) ST.round = r.round;
      if (SC === "reveal" || SC === "board") { DIG.out = 0.001; DIG.ox = 960; DIG.oy = 1300; stageTo("black"); scene("mix"); MIX.target = 1; }
      persist(); toast("마지막 당첨을 취소했습니다 · " + r.no, true); uiMix(); return;
    }
    toast("취소할 당첨이 없습니다");
  }
  function goIdle() {
    stageTo("black"); DIG.n = 0; MIX.target = 0; scene(ST.arrived.length ? "closed" : "idle");
    if (!ST.arrived.length) ME.t0 = T;
  }
  function goEnd() {
    DIG.n = 0; stageTo("black"); MIX.target = 0;
    /* 통 안의 공이 모두 날아가 ME to WE 심볼(홍보부 원본 좌표 1,037점)이 된다 */
    var K = AXF_DATA.me, A = K.A, D = K.D, n = A.count, s = 0.84, ox = DX - 540 * s, oy = DY - 540 * s - 10;
    var from = [], alive = [];
    for (var i = 0; i < NB; i++) if (bs[i] === 2) alive.push(i);
    for (var k = 0; k < n; k++) {
      var p = axfSample(A, D, k, 0, 0), tx = ox + p[0] * s, ty = oy + p[1] * s;
      var b = alive[k];
      if (b != null) from.push([bx[b], by[b], R, tx, ty]);
      else { var a = rng() * 6.2832, rr = 1300 + rng() * 500; from.push([960 + Math.cos(a) * rr, 540 + Math.sin(a) * rr, 3, tx, ty]); }
    }
    ME.from = from; ME.t0 = T; ME.box = { x: ox, y: oy, s: s };
    for (var j = n; j < alive.length; j++) popBallQuiet(alive[j]);
    for (k = 0; k < alive.length && k < n; k++) bs[alive[k]] = 0;
    ballOfNo = {};
    scene("end"); lock(1.5); SFX.play("whoosh", 1.2); SFX.play("riser", 2.2);
    setTimeoutSim(function () { SFX.play("finale"); }, 2.3);
  }
  function popBallQuiet(i) { var x = bx[i], y = by[i]; for (var k = 0; k < 4; k++) { var a = rng() * 6.28; spark(x, y, Math.cos(a) * 200, Math.sin(a) * 200, 0.8, R * 0.3, 0, 200, 2); } bs[i] = 0; }
  function scatterSymbol() {
    var K = AXF_DATA.me, A = K.A, D = K.D, n = A.count, b = meBox();
    for (var k = 0; k < n; k += 1) {
      var p = axfSample(A, D, k, axfF(), 0), x = b.x + p[0] * b.s, y = b.y + p[1] * b.s;
      spark(x, y, (rng() - 0.5) * 240, -rng() * 260, 1.0 + rng() * 0.8, p[2] * b.s / 2, k % 9 === 0 ? 2 : 0, 1500, 0.6);
    }
  }
  function meBox() { var s = 0.62; return { x: DX - 540 * s, y: DY - 540 * s - 8, s: s }; }
  function axfF() { return T * 30; }
  function drawSymbolIdle(alpha) {
    var b = meBox(), f = axfF();
    var breathe = 1 + 0.02 * Math.sin(T * 1.25);
    var bb = { x: DX - (DX - b.x) * breathe, y: DY - 8 - (DY - 8 - b.y) * breathe, s: b.s * breathe };
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    axfDraw(cx, "me", f, bb, null, alpha);
  }
  function drawEnd() {
    var t = sT(), from = ME.from; if (!from) return;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    var u0 = 2.4, K = AXF_DATA.me, b = ME.box;
    if (t < u0 + 0.6) {
      cx.fillStyle = C.o; cx.beginPath();
      for (var k = 0; k < from.length; k++) {
        var f = from[k], d = 0.25 * hash(k * 7 + 3) + 0.35 * (f[4] - 100) / 900, u = EIO((t - d) / 1.4);
        var x = f[0] + (f[3] - f[0]) * u, y = f[1] + (f[4] - f[1]) * u, r = f[2] + (38 * b.s / 2 - f[2]) * u;
        x += Math.sin(u * 3.14159) * (hash(k) - 0.5) * 160; y += Math.sin(u * 3.14159) * (hash(k + 9) - 0.5) * 160;
        cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
      }
      cx.globalAlpha = t < u0 ? 1 : 1 - (t - u0) / 0.6; cx.fill(); cx.globalAlpha = 1;
    }
    if (t > u0) axfDraw(cx, "me", axfF(), b, null, clamp((t - u0) / 0.6, 0, 1));
  }

  /* ─────────────── 매 프레임 ─────────────── */
  var beatT = 0, beatN = 0, clackT = 0, lastAir = -1, TIMERS = [];
  function setTimeoutSim(fn, sec) { TIMERS.push([T + sec, fn]); }
  function update(dt) {
    T += dt;
    /* 믹싱 에너지 · 목표로 부드럽게 */
    MIX.e += (MIX.target - MIX.e) * Math.min(1, dt * (MIX.target > MIX.e ? 2.2 : 1.6));
    var om = SC === "idle" || SC === "checkin" || SC === "closed" ? 0.07 : 0.07 + MIX.e * 1.5;
    MIX.omega += (om - MIX.omega) * Math.min(1, dt * 1.5);
    MIX.rot += MIX.omega * dt * 0.35;
    DRUM.inlet += (DRUM.inletT - DRUM.inlet) * Math.min(1, dt * 4);
    DRUM.gate += (DRUM.gateT - DRUM.gate) * Math.min(1, dt * 7);
    DRUM.pulse *= Math.exp(-dt * 5);
    DRUM.glow *= Math.exp(-dt * 1.5);
    CAM.t = SC === "tension" ? 1 + 0.08 * EIO(sT() / 3.2) : 1;
    CAM.s += (CAM.t - CAM.s) * Math.min(1, dt * (SC === "tension" ? 3 : 1.6));
    /* 박자 · 섞는 동안 120bpm · 고리 점이 박자에 맞춰 부푼다 */
    if (MIX.e > 0.3 && (SC === "mix" || SC === "tension")) {
      beatT -= dt;
      if (beatT <= 0) { beatT += SC === "tension" ? 0.25 : 0.5; beatN++; DRUM.pulse = 1; if (CFG.beat && SC === "mix") SFX.play("beat", beatN % 4 === 1); }
    } else beatT = 0;
    var airL = MIX.e > 0.05 ? Math.round(Math.min(1, MIX.e) * 20) / 20 : 0;
    if (airL !== lastAir) { lastAir = airL; SFX.play("air", airL); }
    for (var h = 0; h < HEARTS.length; h++) if (T >= HEARTS[h]) { SFX.play("heart"); HEARTS.splice(h--, 1); }
    stepDrops();
    stepArrivals(dt);
    if (OUTPOP && T >= OUTPOP.t) { if (CFG.onePerPerson || ST.out[OUTPOP.pk] === "absent") popPerson(OUTPOP.pk); OUTPOP = null; }
    for (var pp = 0; pp < POPS.length; pp++) if (T >= POPS[pp][0]) { if (bs[POPS[pp][1]] === 2) popBall(POPS[pp][1]); POPS.splice(pp--, 1); }
    if (NEXTCARD && T >= NEXTCARD) { NEXTCARD = 0; goCard(); }
    if (DIG.out > 0) { DIG.out += dt / 0.7; if (DIG.out >= 1) { DIG.n = 0; DIG.out = 0; } }
    if (SC === "tension") stepTension();
    if (SC === "exit") stepExit();
    /* 반지름 · 공이 늘면 작아진다 */
    countAlive(); RT = targetRadius(); R += (RT - R) * Math.min(1, dt * 1.2);
    /* 물리 · 고정 스텝 */
    var t0 = performance.now();
    PH.acc += dt; var steps = 0;
    while (PH.acc >= PH.h && steps < 6) { physStep(PH.h); PH.acc -= PH.h; steps++; }
    if (steps >= 6) PH.acc = 0;
    PH.ms = PH.ms * 0.9 + (performance.now() - t0) * 0.1;
    if (MIX.e > 0.25 && PH.impacts) {
      clackT -= dt;
      if (clackT <= 0) { SFX.play("clack", Math.min(1, PH.impactV / 8)); if (PH.impacts > 30) SFX.play("clack", 0.4); clackT = 0.035 + rng() * 0.03; }
    }
    PH.impacts = 0; PH.impactV = 0;
    stepParticles(dt);
    if (ARR.dirty) { ARR.dirty = false; uiCheck(); }
    if (toastUntil && T > toastUntil) { toastUntil = 0; fade($("toast"), 0, 0.3); }
    stepFades();
    stepVideos();
    for (var ti = 0; ti < TIMERS.length; ti++) if (T >= TIMERS[ti][0]) { var fn = TIMERS[ti][1]; TIMERS.splice(ti--, 1); fn(); }
    uiTick();
  }
  function render() {
    var t0 = performance.now();
    drawStage();
    var worldA = 1;
    if (SC === "exit") worldA = 1 - 0.75 * (WIN.z || 0);
    if (SC === "reveal" || SC === "card") worldA = STG.to ? 0.3 * (1 - clamp((T - STG.t0) / STG.dur, 0, 1)) : 0;
    if (SC === "end") worldA = 0;
    if (SC === "board") worldA = 0.55;
    if (worldA > 0.01) {
      /* 카메라 · 추첨 연출 동안 통으로 천천히 다가간다 */
      var vs0 = vs, vox0 = vox, voy0 = voy, cs = CAM.s;
      vs = vs0 * cs; vox = vox0 + DX * vs0 * (1 - cs); voy = voy0 + (DY - 20) * vs0 * (1 - cs);
      DRUM.alpha = worldA;
      drawDrum();
      if (SC === "idle") drawSymbolIdle(clamp(sT() / 0.8, 0, 1));
      drawBalls(worldA);
      vs = vs0; vox = vox0; voy = voy0;
    }
    if (SC === "exit" || (SC === "tension" && false)) drawWinner();
    if (SC === "card") drawCardObject();
    drawDigits();
    if (SC === "end") drawEnd();
    drawParticles();
    RD.ms = RD.ms * 0.9 + (performance.now() - t0) * 0.1;
  }
  var RD = { ms: 0 }, CAM = { s: 1, t: 1 };
  function drawWinner() {
    var p = winPos(), r = winRad(), z = WIN.z || 0;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    if (z > 0) { cx.fillStyle = "rgba(0,0,0," + (0.55 * z).toFixed(3) + ")"; cx.fillRect(-vox / vs, -voy / vs, vw / vs, vh / vs); }
    cx.fillStyle = C.w; cx.beginPath(); cx.arc(p.x, p.y, r * 1.12 + 4 * (1 - z), 0, 6.2832); cx.fill();
    cx.fillStyle = C.o; cx.beginPath(); cx.arc(p.x, p.y, r, 0, 6.2832); cx.fill();
    cx.save(); cx.translate(p.x, p.y); cx.rotate(z > 0 ? WIN.aZ * (1 - z) : WIN.a);
    cx.fillStyle = "#1A0B02"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.font = "800 " + (r * 0.62).toFixed(1) + "px " + FONT;
    cx.fillText(WIN.r.no, 0, r * 0.05); cx.restore();
  }
  /* 라운드 카드 · 오렌지 스테이지 + 흰 점 고리(홍보부 02 Circle 원본) 왼쪽에 잘려 걸린다 */
  function drawCardObject() {
    var a = clamp(sT() / 0.5, 0, 1);
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    if (!CARDC) {                                      /* 원본 고리의 중심·반지름을 원본 좌표에서 잰다 */
      var K = AXF_DATA.circle, sx = 0, sy = 0, n = K.A.count, pts = [];
      for (var i = 0; i < n; i++) { var q = axfSample(K.A, K.D, i, 0, 0); pts.push(q); sx += q[0]; sy += q[1]; }
      sx /= n; sy /= n; CARDC = { x: sx, y: sy, r: Math.hypot(pts[0][0] - sx, pts[0][1] - sy) };
    }
    var s = 470 / CARDC.r;                               /* 고리 반지름 470 · 중심은 왼쪽 끝 가까이 → 화면 밖으로 잘린다(design.md §4 원칙 5) */
    axfDraw(cx, "circle", axfF() * 0.6, { x: 330 - CARDC.x * s, y: 540 - CARDC.y * s, s: s }, [C.w, "#FFE3D2", C.pu], a);
  }

  /* ─────────────── DOM · 글자는 움직이지 않는다(투명도만) ─────────────── */
  var E = {};
  function $(id) { return E[id] || (E[id] = document.getElementById(id)); }
  function set(id, html) { var el = $(id); if (el && el._h !== html) { el._h = html; el.innerHTML = html; } }
  /* 글자 페이드 · 장면 시계(T)로 돈다 · 녹화 모드에서도 프레임과 맞는다 */
  var FADES = [];
  function fade(el, to, dur, delay) {
    if (!el) return;
    var cur = el._op == null ? 0 : el._op;
    FADES = FADES.filter(function (f) { return f.el !== el; });
    if (!dur) { el._op = to; el.style.opacity = to; return; }
    FADES.push({ el: el, a0: cur, a1: to, t0: T + (delay || 0), dur: dur });
  }
  function stepFades() {
    for (var i = 0; i < FADES.length; i++) {
      var f = FADES[i], u = clamp((T - f.t0) / f.dur, 0, 1), v = f.a0 + (f.a1 - f.a0) * u;
      f.el._op = v; f.el.style.opacity = v.toFixed(3);
      if (u >= 1) FADES.splice(i--, 1);
    }
  }
  var PANELS = { intro: "", idle: "pIdle", checkin: "pCheck", closed: "pCheck", mix: "pMix", tension: "pMix", exit: "pMix", reveal: "pReveal", card: "pCard", board: "pBoard", end: "pEnd" };
  function uiScene() {
    var s = SC, on = PANELS[s];
    ["pIdle", "pCheck", "pMix", "pReveal", "pCard", "pBoard", "pEnd"].forEach(function (id) {
      if (id === on) { if (s !== "exit") fade($(id), 1, 0.35, 0.22); }
      else fade($(id), 0, 0.2);
    });
    if (s === "idle") set("idleMeta", idleMeta());
    if (s === "checkin" || s === "closed") uiCheck();
    if (s === "mix" || s === "tension" || s === "exit") uiMix();
    if (s === "card") uiCard();
    if (s === "board") uiBoard();
    pushCtl();
  }
  function idleMeta() {
    return "<p>앱 응모권 1장 = 공 1개</p><p>" + (CFG.checkinOnly ? "체크인한 분의 공만 통에 들어갑니다" : "응모권을 가진 모든 분의 공이 들어갑니다") + "</p>" + (CFG.onePerPerson ? "<p>한 분은 한 번만 당첨됩니다</p>" : "");
  }
  function uiCheck() {
    var balls = 0; ST.arrived.forEach(function (pk) { var p = ST.pool && ST.pool.people[pk]; if (p) balls += p.nos.length; });
    set("cEye", ST.closed ? "Check-in closed." : "Check-in");
    set("cBig", balls.toLocaleString("en-US"));
    set("cMeta", (ST.closed ? "체크인 마감 · " : "체크인 ") + ST.arrived.length.toLocaleString("en-US") + "명");
    var rows = ST.closed ? "" : ARR.lastPk.map(function (pk) {
      var p = ST.pool.people[pk]; if (!p) return "";
      var nm = CFG.tickerNames && CFG.nameMode === "mask" && p.nm ? '<b>' + esc(mask(p.nm)) + "</b>" : "";
      return '<div class="trow">' + nm + p.nos.map(function (n) { return '<span class="chip">' + n + "</span>"; }).join("") + "</div>";
    }).join("");
    set("ticker", rows);
    document.body.classList.toggle("closed", !!ST.closed);
  }
  function uiMix() {
    var r = curRound(), wins = roundWins(ST.round, true), n = wins.length;
    set("mEye", esc(r.name));
    set("mTitle", esc(r.prize));
    set("mMeta", SC === "mix" && n >= r.count ? "추첨 완료" : r.count + "명 중 " + Math.min(r.count, n + 1) + "번째 추첨");
    set("mList", wins.map(function (w) { return '<div class="wrow"><span class="no">' + w.no + '</span><span class="nm">' + esc(nameOf(w)) + "</span></div>"; }).join(""));
  }
  function nameOf(w) { if (CFG.nameMode !== "mask" || !w.nm) return "응모 번호 " + w.no; return mask(w.nm) + (CFG.showDept && w.dp ? " · " + w.dp : ""); }
  function uiReveal(r) {
    var ri = r.round, rr = rounds()[ri];
    set("rEye", esc(rr.name) + " · " + r.slot + " / " + rr.count);
    set("rName", CFG.nameMode === "mask" && r.nm ? esc(mask(r.nm)) + (CFG.showDept && r.dp ? '<small>' + esc(r.dp) + "</small>" : "") : "앱의 응모 번호를 확인해 주세요");
    set("rPrize", esc(rr.prize));
    fade($("rName"), 0, 0); fade($("rPrize"), 0, 0); fade($("rAbs"), 0, 0);
    fade($("rName"), 1, 0.35, 0.95); fade($("rPrize"), 1, 0.35, 1.05);
  }
  function uiAbsent() { fade($("rName"), 0, 0.2); fade($("rPrize"), 0, 0.2); fade($("rAbs"), 1, 0.2); }
  function uiCard() { var r = curRound(); set("kEye", esc(r.name)); set("kTitle", esc(r.prize)); set("kMeta", r.count + "명 추첨"); }
  function uiBoard() {
    var all = ST.results.filter(function (r) { return r.st === "win" && r.id !== ST.pending; });
    set("bList", all.map(function (w) { return '<div class="brow"><span class="no">' + w.no + '</span><span class="nm">' + esc(nameOf(w)) + '</span><span class="pz">' + esc(w.prize) + "</span></div>"; }).join(""));
    $("bList").style.setProperty("--rows", Math.max(5, all.length));
  }
  var tickN = 0;
  function uiTick() {
    if ((tickN++ % 6) !== 0) return;
    set("mCount", "통 안의 공 " + nInside.toLocaleString("en-US") + "개");
    if (document.body.classList.contains("hud-on")) set("hud", Math.round(FPS.v) + " fps · 공 " + nAlive + " · r " + R.toFixed(1) + " · 물리 " + PH.ms.toFixed(1) + "ms · 그리기 " + RD.ms.toFixed(1) + "ms");
    if (SC === "mix") { var r = curRound(), n = roundWins(ST.round, true).length; set("mMeta", n >= r.count ? "추첨 완료" : r.count + "명 중 " + Math.min(r.count, n + 1) + "번째 추첨"); }
  }
  var toastUntil = 0;
  function toast(msg, soft) {
    if (REC && !soft) return;
    var el = $("toast"); el.textContent = msg; el.classList.toggle("soft", !!soft);
    fade(el, msg ? 1 : 0, 0.2); toastUntil = msg ? T + 2.6 : 0;
    pushCtl(msg);
  }

  /* ─────────────── 조작 창 연결 (노트북 화면에 조작 창, LED 에 이 화면) ─────────────── */
  var ctlWin = null, bc = null;
  try { bc = new BroadcastChannel("axf-draw"); bc.onmessage = function (e) { onMsg(e.data); }; } catch (e) {}
  window.addEventListener("message", function (e) { if (e.data && e.data.axd) onMsg(e.data); });
  function openControl() { ctlWin = window.open(location.pathname + location.search + "#control", "axfDrawControl", "width=520,height=900"); }
  function onMsg(m) {
    if (!m || !m.axd) return;
    if (m.type === "cmd") act(m.cmd, m.arg);
    if (m.type === "cfg") {
      CFG = Object.assign(CFG, m.cfg); save(LS_CFG, CFG);
      if (m.cfg.mode && m.cfg.mode !== ST.src && SC === "idle") { ST.pool = null; ST.src = m.cfg.mode; }
      if (m.cfg.key != null) { try { sessionStorage.setItem("axfDraw.key", m.cfg.key); } catch (e) {} delete CFG.key; }
      uiScene();
    }
    if (m.type === "hello") pushCtl();
  }
  function snapshot(msg) {
    return { axd: 1, type: "state", scene: SC, cfg: CFG, round: ST.round, results: ST.results, arrived: ST.arrived.length, balls: nAlive, inside: nInside,
      closed: ST.closed, muted: !SFX.on, srv: { status: SRV.status, log: SRV.logStatus || "", queue: SRV.queue.length, hasPool: !!SRV.hasPool, url: CFG.server || window.AXF_SERVER || "" },
      pool: ST.pool ? ST.pool.order.length : 0, toast: msg || "", fps: Math.round(FPS.v), demo: CFG.mode === "demo" };
  }
  var lastPush = 0;
  function pushCtl(msg) {
    if (REC) return;
    var s = snapshot(msg);
    try { if (ctlWin && !ctlWin.closed) ctlWin.postMessage(s, "*"); } catch (e) {}
    try { bc && bc.postMessage(s); } catch (e) {}
  }
  function resetAll() {
    ST = { v: 1, seed: Math.floor(Math.random() * 1e9), scene: "idle", pool: null, arrived: [], closed: false, round: 0, results: [], out: {}, src: CFG.mode };
    NB = 0; ballOfNo = {}; pn = 0; DIG.n = 0; DROPS.length = 0; ARR.q.length = 0; ARR.lastPk.length = 0; POPS.length = 0; HEARTS.length = 0;
    SRV.queue = []; save("axfDraw.q", []); SRV.since = "";
    stageTo("black"); MIX.target = 0; DRUM.inletT = 0; ME.t0 = T; save(LS_ST, ST);
    document.body.classList.remove("closed");
    scene("idle"); toast("처음 상태로 되돌렸습니다", true);
  }

  /* ─────────────── 키보드 (프레젠터 리모컨의 PageDown · → 도 「다음」) ─────────────── */
  function onKey(e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key;
    if (e.repeat) return;                             /* 길게 눌러도 한 번 */
    var map = { " ": "next", Enter: "next", PageDown: "next", ArrowRight: "next", c: "close", C: "close", r: "redraw", R: "redraw", u: "undo", U: "undo",
      e: "end", E: "end", i: "idle", I: "idle", m: "mute", M: "mute", f: "fs", F: "fs", h: "help", H: "help", "?": "help", g: "hud", G: "hud", p: "ctl", P: "ctl",
      d: "add", D: "add", a: "auto", A: "auto", v: "intro", V: "intro" };
    if (map[k]) { e.preventDefault(); act(map[k]); return; }
    if (/^[1-9]$/.test(k)) act("round", +k - 1);
  }

  /* ─────────────── FPS ─────────────── */
  var FPS = { v: 60, n: 0, t: 0 };
  var lastNow = 0;
  function loop(now) {
    var dt = lastNow ? (now - lastNow) / 1000 : 1 / 60; lastNow = now;
    FPS.n++; FPS.t += dt; if (FPS.t >= 0.5) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
    update(Math.min(dt, 1 / 30));
    render();
    requestAnimationFrame(loop);
  }

  /* ─────────────── 시작 ─────────────── */
  function boot() {
    cv = document.getElementById("cv"); cx = cv.getContext("2d", { alpha: false }); frameEl = document.getElementById("frame");
    set("wm", AXF_WORDMARK);
    resize(); window.addEventListener("resize", function () { resize(); });
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", function () { setTimeout(resize, 50); });
    document.body.classList.toggle("demo", CFG.mode === "demo");
    if (document.fonts && document.fonts.load) document.fonts.load("700 40px AXP").then(function () { atlas.key = ""; });
    if (BENCH) {
      ST.pool = demoPool(BENCH, 99); ST.arrived = []; var c = 0;
      ST.pool.order.forEach(function (pk) { var p = ST.pool.people[pk]; if (c < BENCH) { if (c + p.nos.length > BENCH) p.nos.length = BENCH - c; ST.arrived.push(pk); c += p.nos.length; } });
      rebuildBalls(); ST.closed = true; scene("mix"); MIX.target = 1; document.body.classList.add("hud-on");
    } else if (SC === "restore") {
      rebuildBalls();
      var s = ST.scene, last = ST.results[ST.results.length - 1];
      document.body.classList.toggle("closed", !!ST.closed);
      if ((s === "tension" || s === "exit" || s === "reveal") && last && last.st === "win") {
        /* 결정된 당첨을 그대로 다시 보여 준다 */
        WIN.r = last; WIN.x = 960; WIN.y = 470; WIN.z = 1; WIN.i = -1;
        var bi = ballOfNo[last.no]; if (bi != null) killBall(bi);
        SC = "exit"; startRevealRestore();
      } else if (s === "checkin") { SC = "checkin"; DRUM.inletT = 1; scene("checkin"); ARR.auto = false; }
      else if (s === "card") { SC = "mix"; goCard(); }
      else if (s === "board") scene("board");
      else if (s === "end") { scene("mix"); goEnd(); }
      else if (s === "closed") scene("closed");
      else if (s === "intro") scene("idle");
      else { scene("mix"); MIX.target = 1; }
      toast("이어서 진행합니다 · 당첨 " + ST.results.filter(function (r) { return r.st === "win"; }).length + "건", true);
    } else scene("idle");
    if (CFG.mode === "server" && ST.pool == null) serverLoad(function () { pushCtl(); });
    if (SRV.queue.length) flushQueue();
    if (!REC) requestAnimationFrame(loop);
    window.__axd = { act: act, state: function () { return ST; }, cfg: function () { return CFG; },
      debug: function () { var out = 0, nan = 0, maxd = 0; for (var i = 0; i < NB; i++) { if (bs[i] !== 2) continue; var d = Math.hypot(bx[i] - DX, by[i] - DY); if (d !== d) nan++; if (d > DR + 2) out++; if (d > maxd) maxd = d; } return { n: nInside, out: out, nan: nan, maxd: Math.round(maxd), R: +R.toFixed(1), fps: Math.round(FPS.v) }; } };
  }
  function startRevealRestore() {
    var bi = WIN.i; WIN.i = 0; bs[0] = bs[0];
    var r = WIN.r, pts = buildDigits(r.no), n = pts.length;
    DIG.n = n; DIG.tx = new Float32Array(n); DIG.ty = new Float32Array(n); DIG.sx = new Float32Array(n); DIG.sy = new Float32Array(n); DIG.dl = new Float32Array(n);
    for (var k = 0; k < n; k++) { DIG.tx[k] = DIG.sx[k] = pts[k][0]; DIG.ty[k] = DIG.sy[k] = pts[k][1]; DIG.dl[k] = 0; }
    DIG.t0 = T - 2; DIG.out = 0;
    STG.base = "orange"; document.body.classList.add("st-orange");
    scene("reveal"); uiReveal(r);
  }

  /* ─────────────── 쇼릴 녹화 모드 (?rec=1) · 고정 시계 · 대본대로 조작 ─────────────── */
  if (REC) {
    SFX.log = []; SFX.clock = function () { return T; };
    var SCRIPT = [
      [0.0, "intro"],                /* 힉스필드 인트로 스팅 */
      [7.3, "next"],                 /* 체크인 시작 */
      [18.8, "close"], [19.05, "close"],
      [20.4, "next"],                /* ROUND 01 카드 */
      [22.8, "next"],                /* 섞기 */
      [25.6, "next"],                /* 추첨 1 */
      [36.4, "next"],                /* 확정 */
      [38.0, "next"],                /* 추첨 2 */
      [47.8, "redraw"], [48.05, "redraw"],   /* 부재 · 다시 추첨 */
      [49.6, "next"],                /* 추첨 3 */
      [60.4, "next"],                /* 확정 → FINAL 카드(자동) */
      [64.4, "next"],                /* 섞기 */
      [66.2, "next"],                /* FINAL 추첨 */
      [77.4, "next"],                /* 확정 → 결과판 */
      [81.2, "next"]                 /* 끝 화면 */
    ];
    var si = 0;
    window.__rec = {
      boot: function () { boot(); },
      frame: function (dt) {
        dt = dt || 1 / 30;
        while (si < SCRIPT.length && T >= SCRIPT[si][0]) {
          var c = SCRIPT[si][1];
          busyUntil = 0; act(c);
          si++;
        }
        update(dt); render();
        return T;
      },
      frameAsync: async function (dt) {
        this.frame(dt);
        var sk = vidSeeks();
        for (var q = 0; q < sk.length; q++) {
          var el = document.getElementById(sk[q][0]);
          if (Math.abs(el.currentTime - sk[q][1]) < 0.002) continue;
          await new Promise(function (res) { var done = false; var f = function () { if (!done) { done = true; res(); } }; el.addEventListener("seeked", f, { once: true }); setTimeout(f, 800); el.currentTime = sk[q][1]; });
        }
        return T;
      },
      sfx: function () { return SFX.log; },
      t: function () { return T; }
    };
  }
  if (!REC) window.addEventListener("DOMContentLoaded", boot);
})();
