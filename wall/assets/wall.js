/* AX Festival 2026 · 1F 스탠바이미 「ME to WE 스탬프 월」 (261002)
 *
 * 화면 · 검정 스테이지 + 회색 점 격자(1/64 · 30px · 1.5% 오렌지 · design.md §2) · 홍보부 원본 심볼(01_Me_to_WE · 1,037점) 자리는 옅은 회색 점
 *        스탬프 1개 = 심볼 점 하나가 원본 3중 원(바깥 #FF7F32 · 가운데 #FF963E · 핵 #E6CCFF)으로 켜진다 · 켜지는 순간 120% 온셋 + 파문
 *        상시 · 숨쉬기 · 원본 보라 핵 물결 · 가끔 격자를 지나는 빛 · 켜진 Me 점과 We 점을 잇는 선 · 번인 방지 궤도(±4px · 8분)
 * 순서 · 무작위 산포(기존 월 결정) · 처음 몇 개가 한쪽에 몰리지 않게 최선 후보(best candidate) 순서 · 같은 씨앗이라 새로고침해도 같은 자리
 * 가득 · 1,037개마다 「심볼 완성」 연출 → 그 심볼은 옅은 겹(지난 심볼)으로 남고 다음 심볼을 처음부터 켠다(n번째 심볼)
 * 막간 · 월 WALL_SEC 초마다 하나(광고판 시퀀스 → 최초 로그인 장면 순환 · 16:40~17:25 행사일엔 Outro 안내가 사이사이) · 이정표 · 완성은 그때그때
 *        막간 동안 들어온 스탬프는 끝난 뒤 한꺼번에 몰아서 켠다(따라잡기)
 * 데이터 · 공개 집계 stats(관리코드 없음) 15초 폴링 · kinds 의 stamp:<8종> − unstamp:<8종> = 스탬프 수 · 끊기면 마지막 값 유지 · 다시 연결
 * 주소 · ?demo=1 가짜 적립 · ?srv=주소 서버 바꾸기(시험) · ?n=숫자 데모 시작 수 · ?rate=분당 · ?rec=1 녹화용 고정 시계 · ?wall=초 막간 간격 */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var p = kv.split("="); Q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
  var DEMO = Q.demo === "1", REC = Q.rec === "1";

  /* ── 상수 한 곳 ── */
  var CFG = {
    pollSec: Q.poll ? Math.max(3, +Q.poll) : 15,   /* 서버 집계는 20초 캐시 · 15초면 충분 · ?poll=초 는 시험용 */
    wallSec: Q.wall ? +Q.wall : 210,    /* 월을 이만큼 보여 준 뒤 막간 하나 */
    rotation: ["seq", "login"],         /* 순환 막간 · 광고판 시퀀스 → 최초 로그인 장면 */
    outro: { day: "2026-10-26", s: "16:40", e: "17:25" },   /* 이 시간에는 순환 사이사이 Outro 안내 · 서버 추첨_창 기본값과 같다 */
    milestones: [100, 300, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
    soloPerMin: 12,                     /* 큰 파문은 분당 12회까지 · 넘치면 작은 파문(군집) */
    catchupSec: 3.2,                    /* 막간 뒤 따라잡기 */
    demoRate: Q.rate ? +Q.rate : 24,    /* 데모 · 분당 가짜 적립 */
    loginSlow: 1.1                      /* 최초 로그인 장면 · 앱보다 10% 느리게(로비 화면) */
  };
  var IDS = ["lg", "qz", "p4", "p2", "p5", "p3", "st", "sv"];
  var NAMES = { lg: "최초 로그인", qz: "AX 퀴즈", p4: "미니 게임", p2: "AX PLAY", p5: "아이디어 한 줄", p3: "프로그램 참여", st: "계단 이용", sv: "설문 참여" };
  var COL = { o: "#FF7E31", hi: "#FF963E", grid: "#1f1f1f", slot: "#3a3a3a" };

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function EO(x) { x = cl(x); return 1 - Math.pow(1 - x, 3); }
  function EIO(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function comma(n) { n = Math.max(0, Math.round(n)); var s = String(n), o = ""; while (s.length > 3) { o = "," + s.slice(-3) + o; s = s.slice(0, -3); } return s + o; }
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var cv = $("cv"), cx = cv.getContext("2d"), frameEl = $("frame"), body = document.body;
  if (DEMO) body.classList.add("demo");
  try { $("wm").innerHTML = window.AXF_WORDMARK || ""; } catch (e) {}

  /* ════════ 무대 · 심볼 자리 ════════ */
  var SYM = AXF_DATA.me.D.points, N = SYM.length, ME_A = AXF_DATA.me.A;
  var G = {};            /* 기하 · resize 가 채운다 */
  var LAY = {};          /* 캐시 캔버스 */
  var ORDER = null, RANK = null, GRP = null;
  function buildOrder() {
    /* 최선 후보 순서 · 후보 10개 중 이미 켠 점들에서 가장 먼 것 · 씨앗 고정 · 앞쪽은 고르게 퍼지고 뒤로 갈수록 빈틈을 메운다 */
    var rnd = mulberry(20261026), left = [], i, out = [], dmin = new Float64Array(N);
    for (i = 0; i < N; i++) { left.push(i); dmin[i] = 1e18; }
    function take(k) {
      var id = left[k]; left[k] = left[left.length - 1]; left.pop(); out.push(id);
      var px = SYM[id][0], py = SYM[id][1];
      for (var j = 0; j < N; j++) { var dx = SYM[j][0] - px, dy = SYM[j][1] - py, d = dx * dx + dy * dy; if (d < dmin[j]) dmin[j] = d; }
    }
    take(Math.floor(rnd() * left.length));
    while (left.length) {
      var best = -1, bd = -1, tries = Math.min(10, left.length);
      for (var c = 0; c < tries; c++) { var k = Math.floor(rnd() * left.length), dd = dmin[left[k]] * (0.85 + rnd() * 0.3); if (dd > bd) { bd = dd; best = k; } }
      take(best);
    }
    ORDER = out;
    var sy = lgsSym(); RANK = sy.rank; GRP = sy.g;
  }
  function resize() {
    var w = REC ? (+Q.w || 1920) : window.innerWidth, h = REC ? (+Q.h || 1080) : window.innerHeight;
    var dpr = REC ? 1 : Math.min(window.devicePixelRatio || 1, 2), cap = 2560 * 1440;
    if (w * h * dpr * dpr > cap) dpr *= Math.sqrt(cap / (w * h * dpr * dpr));
    var port = h > w * 1.05;
    body.classList.toggle("port", port);
    var FW = port ? 1080 : 1920, FH = port ? 1920 : 1080, k = Math.min(w / FW, h / FH), ox = (w - FW * k) / 2, oy = (h - FH * k) / 2;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px";
    frameEl.style.transform = "translate(" + ox + "px," + oy + "px) scale(" + k + ")";
    /* 심볼 칸 · 가로 = 왼쪽(정보 칸 앞까지) · 세로 = 위쪽 · 원본 단위 x 33~1033(지름 포함) · y 158~1372 */
    var S, cxs, top;
    if (port) { S = 860 / 1000; cxs = 540; top = 210; }
    else { S = 840 / 1214; cxs = 560; top = 170; }
    G = { w: w, h: h, dpr: dpr, port: port, FW: FW, FH: FH, k: k, ox: ox, oy: oy, S: S, cxs: cxs, top: top,
      xL: -ox / k, xR: (w - ox) / k, yT: -oy / k, yB: (h - oy) / k, D: 38 * S };
    G.map = function (px, py) { return [cxs + (px - 533) * S, top + (py - 158) * S]; };
    G.cy = top + (765 - 158) * S;
    G.pos = SYM.map(function (p) { return G.map(p[0], p[1]); });
    G.bot = top + (1372 - 158) * S; G.left = cxs - 500 * S; G.right = cxs + 500 * S;
    /* axfDraw 상자 · 원본 엔진의 「me」가 월의 심볼 자리에 정확히 겹치게 */
    var bs = S / ME_A.scale, ac = G.map(ME_A.cx, ME_A.cy);
    G.box = { x: ac[0] - 540 * bs, y: ac[1] - 540 * bs, s: bs };
    G.scR = 420 * S;   /* 흩어짐 반경 */
    buildLayers();
    LGX_CUR = null; prewarm();
    LIT.dirty = true; LIT.baseDirty = true;
  }
  function devT(c) { c.setTransform(G.k * G.dpr, 0, 0, G.k * G.dpr, G.ox * G.dpr, G.oy * G.dpr); }
  function mkCanvas() { var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; return c; }
  /* 격자 · 움직이지 않는다 · 레터박스 바깥까지 · 심볼 점 근처의 격자 점은 비운다(월) */
  function buildLayers() {
    var near = {}, P = 30, i;
    G.pos.forEach(function (p) { var gx = Math.round((p[0] - P / 2) / P), gy = Math.round((p[1] - P / 2) / P); for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) { var x = (gx + a) * P + P / 2, y = (gy + b) * P + P / 2; if (Math.abs(x - p[0]) < P * 0.9 && Math.abs(y - p[1]) < P * 0.9) near[(gx + a) + "," + (gy + b)] = 1; } });
    function grid(c, mode) {
      var g = c.getContext("2d"); devT(g);
      var sz = 3, i0 = Math.floor(G.xL / P) - 1, i1 = Math.ceil(G.xR / P) + 1, j0 = Math.floor(G.yT / P) - 1, j1 = Math.ceil(G.yB / P) + 1;
      for (var j = j0; j <= j1; j++) for (var ii = i0; ii <= i1; ii++) {
        if (mode !== "plain" && mode !== "water" && near[ii + "," + j]) continue;
        var on = (((ii * 7919 + j * 104729) * 2654435761) >>> 0) % 1000 < 15, x = ii * P + P / 2, y = j * P + P / 2;
        if (mode === "bright") g.fillStyle = on ? "rgba(255,150,62,0.9)" : "rgba(255,255,255,0.30)";
        else if (mode === "water") g.fillStyle = on ? "rgba(255,150,62,0.45)" : "rgba(255,126,49,0.16)";
        else g.fillStyle = on ? "rgba(255,126,49,0.55)" : COL.grid;
        g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    LAY.plain = mkCanvas(); var pc = LAY.plain.getContext("2d"); pc.fillStyle = "#000"; pc.fillRect(0, 0, cv.width, cv.height); grid(LAY.plain, "plain");
    LAY.wall = mkCanvas(); var wc = LAY.wall.getContext("2d"); wc.fillStyle = "#000"; wc.fillRect(0, 0, cv.width, cv.height); grid(LAY.wall, "wall");
    devT(wc); wc.fillStyle = COL.slot;
    var sr = 5.5 * G.S * 1.0 + 1.2;
    for (i = 0; i < N; i++) { wc.beginPath(); wc.arc(G.pos[i][0], G.pos[i][1], sr, 0, 6.2832); wc.fill(); }
    LAY.bright = mkCanvas(); grid(LAY.bright, "bright");
    LAY.water = mkCanvas(); var wt = LAY.water.getContext("2d"); wt.fillStyle = "#120904"; wt.fillRect(0, 0, cv.width, cv.height); grid(LAY.water, "water");
    LAY.lit = mkCanvas(); LAY.base = mkCanvas(); LAY.full = mkCanvas(); LAY.fullOk = false; LAY.il = mkCanvas(); LAY.ilc = LAY.il.getContext("2d");
  }

  /* ════════ 상태 ════════ */
  var T = 0;                                   /* 화면 시계(초) */
  var ST = { target: 0, lit: 0, kinds: null, feed: [], mile: 0, off: false, polls: 0 };
  var LIT = { dirty: true, baseDirty: true, anim: [], animSet: {}, solo: [], acc: 0, catchup: 0, lastAt: -99, connNext: 9, conn: null, sweepNext: 30, sweep: null };
  function roundOf(n) { return Math.floor(n / N); }
  function inRound(n) { return n - roundOf(n) * N; }
  /* 지금 켜진 점 수(이번 심볼) · 완성 연출이 끝나기 전에는 꽉 찬 심볼로 둔다 */
  function litNow() { var r = inRound(ST.lit); return (r === 0 && ST.lit > 0 && !LIT.doneRound[roundOf(ST.lit)]) ? N : r; }
  LIT.doneRound = {};
  function baseOn() { var r = roundOf(ST.lit); if (inRound(ST.lit) === 0 && ST.lit > 0 && !LIT.doneRound[r]) r--; return r >= 1; }

  /* 스탬프 하나 켜기 */
  function lightOne(fast) {
    var n = ST.lit, slot = ORDER[inRound(n)];
    ST.lit = n + 1;
    var now = T, solo = !fast;
    if (solo) { LIT.solo = LIT.solo.filter(function (x) { return now - x < 60; }); if (LIT.solo.length >= CFG.soloPerMin) solo = false; else LIT.solo.push(now); }
    LIT.anim.push({ i: slot, t0: now, solo: solo }); LIT.animSet[slot] = 1;
    LIT.dirty = true; LIT.lastAt = now;
    if (inRound(ST.lit) === 0) queueSpecial({ name: "complete", round: roundOf(ST.lit), n: ST.lit });
    else for (var m = 0; m < CFG.milestones.length; m++) { var ms = CFG.milestones[m]; if (n < ms && ST.lit >= ms && ms > ST.mile) { ST.mile = ms; queueSpecial({ name: "milestone", m: ms }); } }
    panel();
  }
  /* 따라잡기 · 처음 불러올 때는 연출 없이 바로 */
  function jumpTo(n) {
    ST.lit = n; LIT.anim = []; LIT.animSet = {}; LIT.dirty = true; LIT.baseDirty = true;
    for (var r = 1; r <= roundOf(n); r++) LIT.doneRound[r] = 1;
    ST.mile = 0; CFG.milestones.forEach(function (m) { if (m <= n) ST.mile = m; });
    panel();
  }
  function release(dt) {
    if (IL.cur || SPECIAL.length) return;
    var q = ST.target - ST.lit;
    if (q <= 0) { LIT.catchup = 0; return; }
    if (q > 60 && !LIT.catchup) LIT.catchup = q;
    var spread = DEMO ? 1.5 : CFG.pollSec * 0.85;   /* 폴링 한 번에 온 몫을 다음 폴링까지 고르게 나눠 켠다 */
    var rate = LIT.catchup ? LIT.catchup / CFG.catchupSec : clamp(q / spread, 0.25, 8);
    LIT.acc += rate * dt;
    while (LIT.acc >= 1 && ST.target > ST.lit && !SPECIAL.length) { LIT.acc -= 1; lightOne(!!LIT.catchup); }
    if (LIT.acc > 1) LIT.acc = 1;
  }

  /* ════════ 캐시 층 ════════ */
  function rebuildLit() {
    var c = LAY.lit.getContext("2d"), sp = lgsSprites(), n = litNow(), D = G.D, r = D / 2, i, p;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, LAY.lit.width, LAY.lit.height); devT(c);
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < n; i++) { var s = ORDER[i]; if (LIT.animSet[s]) continue; p = G.pos[s]; c.drawImage(pass ? sp.o1 : sp.o0, p[0] - r, p[1] - r, D, D); }
    LIT.dirty = false;
  }
  function rebuildBase() {
    var c = LAY.base.getContext("2d"), sp = lgsSprites(), D = G.D, r = D / 2, i, p;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, LAY.base.width, LAY.base.height); devT(c);
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < N; i++) { p = G.pos[i]; c.drawImage(pass ? sp.d1 : sp.d0, p[0] - r, p[1] - r, D, D); }
    LIT.baseDirty = false;
  }
  function rebuildFull() {
    var c = LAY.full.getContext("2d"), sp = lgsSprites(), D = G.D, r = D / 2, i, p;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, LAY.full.width, LAY.full.height); devT(c);
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < N; i++) { p = G.pos[i]; c.drawImage(pass ? sp.o1 : sp.o0, p[0] - r, p[1] - r, D, D); }
    LAY.fullOk = true;
  }
  var ORB = { x: 0, y: 0 };
  function blit(c, a) { if (a <= 0) return; cx.globalAlpha = a; cx.drawImage(c, ORB.x, ORB.y); cx.globalAlpha = 1; }
  function logical() { cx.setTransform(G.k * G.dpr, 0, 0, G.k * G.dpr, G.ox * G.dpr + ORB.x, G.oy * G.dpr + ORB.y); }
  function ident() { cx.setTransform(1, 0, 0, 1, 0, 0); }

  /* ════════ 월 그리기 ════════ */
  function drawWall(a) {
    if (a <= 0) return;
    if (LIT.dirty) rebuildLit();
    var bOn = baseOn();
    if (bOn && LIT.baseDirty) rebuildBase();
    ident();
    var br = 0.92 + 0.08 * (0.5 + 0.5 * Math.sin(T * 6.2832 / 6));   /* 숨쉬기 · 6초 */
    if (bOn) blit(LAY.base, a * (0.95 - 0.12 * (br - 0.92) / 0.08));
    blit(LAY.lit, a * br);
    logical();
    var sp = lgsSprites(), D = G.D, n = litNow(), i;
    /* 원본 보라 핵 물결 · 켜진 점의 약 6%가 파도처럼 꺼졌다 켜진다 */
    if (!LQ.on) {
      var wave = (T * 0.25) % 1;
      cx.globalAlpha = a * br;
      for (i = 0; i < n; i++) { var s = ORDER[i]; if (LIT.animSet[s]) continue; if ((((RANK[s] - wave) % 1) + 1) % 1 < 0.06) { var p = G.pos[s]; cx.drawImage(sp.o2, p[0] - D / 2, p[1] - D / 2, D, D); } }
      cx.globalAlpha = 1;
    }
    /* 방금 켜진 점 · 120% 온셋 → 제자리 · 파문 */
    var keep = [], done = false;
    for (i = 0; i < LIT.anim.length; i++) {
      var an = LIT.anim[i], u = T - an.t0, pp = G.pos[an.i], life = an.solo ? 1.8 : 0.9;
      if (u >= life) { delete LIT.animSet[an.i]; done = true; continue; }
      keep.push(an);
      var R = an.solo ? 120 : 40, ru = cl(u / life);
      cx.globalAlpha = a * (an.solo ? 0.6 : 0.35) * (1 - ru); cx.strokeStyle = COL.hi; cx.lineWidth = an.solo ? 2.5 : 1.5;
      cx.beginPath(); cx.arc(pp[0], pp[1], D / 2 + EO(ru) * R, 0, 6.2832); cx.stroke();
      var sc = lgsSpring(u / 0.7, 0.45, 1.4), dd = D * (an.solo ? sc * (1 + 0.2 * Math.max(0, 1 - u / 0.35)) : Math.min(1, u / 0.25));
      if (dd > 0.5) { cx.globalAlpha = a; cx.drawImage(sp.o0, pp[0] - dd / 2, pp[1] - dd / 2, dd, dd); cx.drawImage(sp.o1, pp[0] - dd / 2, pp[1] - dd / 2, dd, dd); }
      if (an.solo && u < 0.4) { cx.globalAlpha = a * 0.5 * (1 - u / 0.4); cx.fillStyle = "#FFFFFF"; cx.beginPath(); cx.arc(pp[0], pp[1], dd * 0.18, 0, 6.2832); cx.fill(); }
    }
    LIT.anim = keep; if (done) LIT.dirty = true;
    cx.globalAlpha = 1;
    drawConn(a);
  }
  /* 켜진 Me 점 → We 점을 잇는 선 · 8~12초마다 하나 · 옅게 */
  function drawConn(a) {
    var n = litNow(), bOn = baseOn();
    if (!LIT.conn && T >= LIT.connNext && (n >= 24 || bOn)) {
      var pool = bOn ? ORDER : ORDER.slice(0, n), A = [], B = [], i;
      for (i = 0; i < pool.length; i++) { var g = GRP[pool[i]]; if (g <= 1) A.push(pool[i]); else if (g >= 4) B.push(pool[i]); }
      if (A.length && B.length) {
        var h = (T * 7.13) % 1, h2 = (T * 3.71) % 1;
        LIT.conn = { a: A[Math.floor(h * A.length)], b: B[Math.floor(h2 * B.length)], t0: T, bend: (h - 0.5) * 0.6 };
      }
      LIT.connNext = T + 8 + ((T * 1.618) % 1) * 4;
    }
    var c = LIT.conn; if (!c) return;
    var u = T - c.t0; if (u > 2.8) { LIT.conn = null; return; }
    var p0 = G.pos[c.a], p1 = G.pos[c.b], mx = (p0[0] + p1[0]) / 2 - (p1[1] - p0[1]) * c.bend, my = (p0[1] + p1[1]) / 2 + (p1[0] - p0[0]) * c.bend;
    var head = EIO(u / 1.3), fade = 1 - cl((u - 1.3) / 1.5), steps = 28;
    cx.globalAlpha = a * 0.42 * fade; cx.strokeStyle = COL.hi; cx.lineWidth = 1.6; cx.beginPath();
    for (var s = 0; s <= steps; s++) { var tt = head * s / steps, iu = 1 - tt, x = iu * iu * p0[0] + 2 * iu * tt * mx + tt * tt * p1[0], y = iu * iu * p0[1] + 2 * iu * tt * my + tt * tt * p1[1]; if (s) cx.lineTo(x, y); else cx.moveTo(x, y); }
    cx.stroke();
    if (u < 1.5) { var iu2 = 1 - head, hx = iu2 * iu2 * p0[0] + 2 * iu2 * head * mx + head * head * p1[0], hy = iu2 * iu2 * p0[1] + 2 * iu2 * head * my + head * head * p1[1]; cx.globalAlpha = a * 0.9; cx.fillStyle = COL.hi; cx.beginPath(); cx.arc(hx, hy, 4, 0, 6.2832); cx.fill(); }
    cx.globalAlpha = 1;
  }
  /* 격자를 지나는 빛 · 45~70초마다 한 번 · 5초 */
  function drawSweep(a) {
    if (!LIT.sweep && T >= LIT.sweepNext) { LIT.sweep = { t0: T, dir: ((T * 0.37) % 1) < 0.5 ? 1 : -1 }; LIT.sweepNext = T + 45 + ((T * 2.39) % 1) * 25; }
    var s = LIT.sweep; if (!s) return;
    var u = (T - s.t0) / 5.5; if (u >= 1) { LIT.sweep = null; return; }
    var span = (G.xR - G.xL) + (G.yB - G.yT) + 600, pos = G.xL - 300 + EIO(u) * span, wdt = 220, tilt = (G.yB - G.yT);
    if (s.dir < 0) pos = G.xR + 300 - EIO(u) * span;
    cx.save(); logical();
    cx.beginPath(); cx.moveTo(pos - wdt, G.yT); cx.lineTo(pos + wdt, G.yT); cx.lineTo(pos + wdt - tilt * 0.5 * s.dir, G.yB); cx.lineTo(pos - wdt - tilt * 0.5 * s.dir, G.yB); cx.closePath(); cx.clip();
    ident(); blit(LAY.bright, a * 0.38 * Math.sin(u * 3.1416));
    cx.restore();
    cx.save(); logical();
    cx.beginPath(); cx.moveTo(pos - 60, G.yT); cx.lineTo(pos + 60, G.yT); cx.lineTo(pos + 60 - tilt * 0.5 * s.dir, G.yB); cx.lineTo(pos - 60 - tilt * 0.5 * s.dir, G.yB); cx.closePath(); cx.clip();
    ident(); blit(LAY.bright, a * 0.5 * Math.sin(u * 3.1416));
    cx.restore();
  }

  /* ════════ 막간 ════════ */
  var IL = { cur: null, nextAt: CFG.wallSec, rot: 0, lastOutro: false };
  var SPECIAL = [];
  function queueSpecial(o) { if (o.name === "complete") SPECIAL = SPECIAL.filter(function (x) { return x.name !== "milestone"; }); SPECIAL.push(o); }
  /* 글자 칸 투명도는 화면 시계(T)로 움직인다(CSS 전환을 쓰지 않는다 · 녹화 · 점검 시계와 어긋나지 않게) */
  var cardShown = false, UI = { pa: 1, ca: 0, pS: "", cS: "" };
  function card(on, eye, title, meta, big) {
    if (on && !cardShown) { $("cEye").textContent = eye || ""; $("cTitle").textContent = title || ""; $("cMeta").textContent = meta || ""; $("card").classList.toggle("big", !!big); }
    cardShown = on;
  }
  function uiFade(dt) {
    var c = IL.cur, pt = 1;
    if (c) { var def = ILS[c.name], t = T - c.t0, ho = def.handoff || 1.0; pt = cl((t - (c.dur - ho)) / ho); }
    UI.pa += clamp(pt - UI.pa, -dt / 0.6, dt / 0.6); UI.ca += clamp((cardShown ? 1 : 0) - UI.ca, -dt / 0.6, dt / 0.7);
    var ps = UI.pa.toFixed(2), cs = UI.ca.toFixed(2);
    if (ps !== UI.pS) { $("panel").style.opacity = ps; UI.pS = ps; }
    if (cs !== UI.cS) { $("card").style.opacity = cs; UI.cS = cs; }
  }
  function outroNow() {
    var d = new Date(), ds = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2), hm = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    if (Q.outro === "1") return true;
    return ds === CFG.outro.day && hm >= CFG.outro.s && hm < CFG.outro.e;
  }
  function startIL(name, o) {
    var def = ILS[name]; if (!def) return;
    IL.cur = { name: name, t0: T, o: o || {}, dur: def.dur(o || {}), st: {} };
    body.classList.add("il");
    if (def.start) def.start(IL.cur);
    card(false);
  }
  function endIL() {
    var c = IL.cur; if (!c) return;
    var def = ILS[c.name]; if (def.end) def.end(c);
    IL.cur = null; body.classList.remove("il"); card(false);
    IL.nextAt = T + CFG.wallSec;
    if (ST.target - ST.lit > 0) LIT.catchup = ST.target - ST.lit;   /* 따라잡기 */
    panel();
  }
  function schedule() {
    if (IL.cur) return;
    if (SPECIAL.length && T - LIT.lastAt > 1.2) { var s = SPECIAL.shift(); startIL(s.name, s); return; }
    if (T >= IL.nextAt && !SPECIAL.length) {
      var nm;
      if (outroNow() && !IL.lastOutro) { nm = "outro"; IL.lastOutro = true; }
      else { nm = CFG.rotation[IL.rot % CFG.rotation.length]; IL.rot++; IL.lastOutro = false; }
      startIL(nm);
    }
  }
  /* 원본 엔진(axfDraw) 한 장면 · 흩어짐 sc */
  function axf(name, f, a, sc) { axfDraw(cx, name, f, G.box, null, a, sc); }
  var SEQ = [["dot", 3.0], ["circle", 5.0], ["run", 4.5], ["me", 5.0]], SEQ_TR = 1.5;
  var ILS = {
    /* 1 · 홈 광고판 시퀀스 · 점 → 고리 → 달리는 사람 → ME to WE(월의 심볼 자리에 안착) */
    seq: {
      dur: function () { var t = 0; SEQ.forEach(function (x) { t += x[1]; }); return t + SEQ_TR * (SEQ.length - 1) + 1.0; },
      draw: function (c, t) {
        var u = t - 1.0, f = T * 30, R = G.scR;
        if (u < 0) { var e0 = EO(t / 1.0); axf("dot", f, e0, (1 - e0) * R); return; }
        var cur = 0;
        for (var k = 0; k < SEQ.length; k++) {
          var hold = SEQ[k][1];
          if (u < cur + hold || k === SEQ.length - 1) { axf(SEQ[k][0], f, 1, 0); break; }
          if (u < cur + hold + SEQ_TR) { var e = axfEase((u - cur - hold) / SEQ_TR); axf(SEQ[k][0], f, 1 - e, e * R); axf(SEQ[k + 1][0], f, e, (1 - e) * R); break; }
          cur += hold + SEQ_TR;
        }
        card(t > 0.4 && t < c.dur - 1.2, "AX Festival 2026", "ME to WE :", "나의 경험을 우리의 가능성으로");
      },
      handoff: 1.4
    },
    /* 2 · 최초 로그인 장면 · 앱 LGX 를 검정 스테이지로 · 마지막 = 월의 심볼 자리 */
    login: {
      dur: function () { return (LGS.T.land + 2.2) * CFG.loginSlow + 1.4; },
      start: function (c) { c.st.L = LGX_CUR || (LGX_CUR = lgsLayout(lgsGeom())); c.st.L.sparks = null; },
      draw: function (c, t) {
        var ts = Math.min(t / CFG.loginSlow, LGS.T.land + 2.2);
        lgsFrame(c.st.L, cx, ts, { lq: LQ.on, water: waterFill });
        card(ts > LGS.T.land - 0.1 && t < c.dur - 1.2, "AX Festival 2026", "ME to WE :", "나의 경험을 우리의 가능성으로");
      },
      handoff: 1.4
    },
    /* 3 · 이정표 · 공(3중 원)이 쏟아져 굴렀다가 심볼의 점이 된다 · 숫자 카운트업 */
    milestone: {
      dur: function () { return 10; },
      start: function (c) {
        var rnd = mulberry(c.o.m || 7), n = LQ.on ? 48 : 96, balls = [], lit = litNow(), pool = baseOn() ? N : Math.max(1, lit);
        for (var i = 0; i < n; i++) { var rk = i * 13 % 36; balls.push({ x: G.left + 40 + rnd() * (G.right - G.left - 80), y: G.yT - 60 - rnd() * 700, vx: (rnd() - 0.5) * 120, vy: rnd() * 200, d: (rk < 7 ? 38 : rk < 18 ? 24 : 14) * G.S * 1.7, at: rnd() * 1.4, tgt: ORDER[Math.floor(rnd() * pool)], fly: 4.9 + i * 0.018 + rnd() * 0.3 }); }
        c.st.b = balls; c.st.lastT = 0;
      },
      draw: function (c, t) {
        var dt = clamp(t - c.st.lastT, 0, 0.05); c.st.lastT = t;
        var floor = G.bot, gL = G.left - 40, gR = G.right + 40, P = [], i;
        for (i = 0; i < c.st.b.length; i++) {
          var b = c.st.b[i];
          if (t < b.at) continue;
          if (t < b.fly) {
            for (var sub = 0; sub < 2; sub++) {
              var h = dt / 2; b.vy += 2600 * h; b.x += b.vx * h; b.y += b.vy * h;
              if (b.y > floor - b.d / 2) { b.y = floor - b.d / 2; if (b.vy > 0) b.vy *= -0.42; b.vx *= 0.9; if (Math.abs(b.vy) < 40) b.vy = 0; }
              if (b.x < gL + b.d / 2) { b.x = gL + b.d / 2; b.vx = Math.abs(b.vx) * 0.6; } if (b.x > gR - b.d / 2) { b.x = gR - b.d / 2; b.vx = -Math.abs(b.vx) * 0.6; }
            }
            b.fx = b.x; b.fy = b.y;
            P.push([b.x, b.y, b.d, 0]);
          } else {
            var k = EIO((t - b.fly) / 0.9), tp = G.pos[b.tgt];
            if (k >= 1) { if (!b.hit) { b.hit = t; } var ru = (t - b.hit) / 0.8; if (ru < 1) { cx.globalAlpha = 0.5 * (1 - ru); cx.strokeStyle = COL.hi; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(tp[0], tp[1], G.D / 2 + ru * 40, 0, 6.2832); cx.stroke(); cx.globalAlpha = 1; } continue; }
            var iu = 1 - k, mx = (b.fx + tp[0]) / 2, my = Math.min(b.fy, tp[1]) - 160;
            P.push([iu * iu * b.fx + 2 * iu * k * mx + k * k * tp[0], iu * iu * b.fy + 2 * iu * k * my + k * k * tp[1], b.d + (G.D - b.d) * k, 0]);
          }
        }
        lgsDots(cx, P, 1, LQ.on);
        var m = c.o.m || 100, cu = EO((t - 0.5) / 1.8);
        card(t > 0.3 && t < c.dur - 1.0, "Milestone.", comma(Math.round(m * 0.5 + m * 0.5 * cu)), "오늘 모인 스탬프", true);
        if (cardShown) $("cTitle").textContent = comma(Math.round(m * 0.5 + m * 0.5 * cu));
      },
      wallAlpha: function (t, dur) { return 0.3 + 0.7 * Math.max(1 - cl(t / 0.6), cl((t - 6.4) / 1.2)); }
    },
    /* 4 · Outro 안내 · 16:40~17:25 · 02 Connection 고리 */
    outro: {
      dur: function () { return 15; },
      draw: function (c, t) {
        var f = T * 30, R = G.scR, e = EO(t / 1.2), x = EIO((t - (c.dur - 1.6)) / 1.4);
        axf("circle", f, e * (1 - x), (1 - e) * R + x * R);
        card(t > 0.5 && t < c.dur - 1.3, "Lucky Draw", "17:00 Outro", "17F 대강당 · 입구 화면 QR로 추첨 체크인");
      },
      handoff: 1.5
    },
    /* 5 · 심볼 완성 · 1,037개마다 · 출렁임 · 파문 · 옅은 겹으로 남는다 */
    complete: {
      dur: function () { return 10.5; },
      start: function (c) { if (!c.o.round) { c.o.round = roundOf(ST.lit) || 1; c.o.n = ST.lit; } },
      draw: function (c, t) {
        var sp = lgsSprites(), D = G.D, i, p, wb = 1 + 0.05 * Math.exp(-3.2 * t) * Math.sin(12 * t), cxx = G.cxs, cyy = G.cy;
        var dim = EIO((t - 6.6) / 2.4), wave = (t * 0.7) % 1;
        if (c.o.round >= 2) { if (LIT.baseDirty) rebuildBase(); ident(); blit(LAY.base, 1); logical(); }
        for (var r3 = 0; r3 < 3; r3++) { var ru = cl((t - 0.15 - r3 * 0.35) / 2.4); if (ru <= 0 || ru >= 1) continue; cx.globalAlpha = 0.5 * (1 - ru); cx.strokeStyle = COL.hi; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(cxx, cyy, 200 * G.S + EO(ru) * 1100 * G.S, 0, 6.2832); cx.stroke(); }
        cx.globalAlpha = 1;
        /* 꽉 찬 심볼 · 미리 그린 한 장을 가운데 기준으로 키웠다 줄인다(점 2,000번을 매 프레임 찍지 않는다) · 가라앉으면 옅은 겹(base)으로 */
        if (!LAY.fullOk) rebuildFull();
        if (LIT.baseDirty) rebuildBase();
        var dcx = (G.ox + cxx * G.k) * G.dpr + ORB.x, dcy = (G.oy + cyy * G.k) * G.dpr + ORB.y, W2 = LAY.full.width, H2 = LAY.full.height;
        ident();
        cx.globalAlpha = 1 - dim; cx.drawImage(LAY.full, dcx - (dcx - ORB.x) * wb, dcy - (dcy - ORB.y) * wb, W2 * wb, H2 * wb);
        if (dim > 0) { cx.globalAlpha = dim; cx.drawImage(LAY.base, dcx - (dcx - ORB.x) * wb, dcy - (dcy - ORB.y) * wb, W2 * wb, H2 * wb); }
        logical();
        if (!LQ.on && dim < 1) {   /* 보라 핵 물결 · 빠르게 한 바퀴 */
          cx.globalAlpha = 1 - dim;
          for (i = 0; i < N; i++) { if ((((RANK[i] - wave) % 1) + 1) % 1 >= 0.08) continue; p = G.pos[i]; var x = cxx + (p[0] - cxx) * wb, y = cyy + (p[1] - cyy) * wb, d = D * wb; cx.drawImage(sp.o2, x - d / 2, y - d / 2, d, d); }
        }
        cx.globalAlpha = 1;
        card(t > 0.8 && t < c.dur - 1.2, "Complete.", "ME to WE :", c.o.round + "번째 심볼 완성 · 스탬프 " + comma(c.o.n));
      },
      end: function (c) { LIT.doneRound[c.o.round] = 1; LIT.dirty = true; LIT.baseDirty = true; },
      wallAlpha: function () { return 0; }
    }
  };
  function lgsGeom() {
    return { cx: G.cxs, cy: G.cy, S: G.S, map: G.map, fw: G.port ? 1000 : 1060, hh: G.port ? 1150 : 1080, xR: G.xR, yB: G.yB };
  }
  function waterFill(line, a) {
    cx.save(); cx.beginPath(); cx.rect(G.xL - 10, line, G.xR - G.xL + 20, G.yB - line + 20); cx.clip();
    ident(); blit(LAY.water, a); cx.restore(); logical();
  }
  var LGX_CUR = null;
  function prewarm() {
    /* 막간 전환 순간 끊김 방지 · 글자 나누기 · 점 그림 · 배치 · 한 장씩 미리 그려 둔다(화면 밖 캔버스) */
    try {
      lgsSprites(); LGX_CUR = lgsLayout(lgsGeom());
      var off = document.createElement("canvas"); off.width = 64; off.height = 64; var oc = off.getContext("2d");
      [1.0, 3.0, 4.2, 6.0, 7.5].forEach(function (t) { lgsFrame(LGX_CUR, oc, t, { lq: false, water: function () {} }); });
      LGX_CUR.sparks = null;
      ["dot", "circle", "run", "me"].forEach(function (nm) { axfDraw(oc, nm, 10, { x: 0, y: 0, s: 0.05 }, null, 1, 0); });
    } catch (e) { if (window.console) console.warn("prewarm", e); }
  }

  /* 앱 QR · QR코드/1_앱 의 인쇄용 그림(일반 QR · ECC Q · 버전 4 · 33칸)과 같은 칸을 그대로 그린다 · 주소 https://hiphopinos-web.github.io/hi_ax/
     공개 저장소에 QR 그림 파일을 두지 않는다(검사 §121) · 줄마다 33칸을 16진수 9자리(뒤 3칸 0)로 · 여백 4칸 */
  var QR_APP = "fe81313f8,8272cfa08,ba9a482e8,bab5d22e8,ba46132e8,82e44ca08,feaaaabf8,00b95e800,578734f68,38fc88f08,5a5a50da8,58b5442c8,46a087640,d91dc3a98,8b914b670,5139f7290,a77337a90,90c541d50,cf1364c38,39292d718,23b8d3810,6cb478f78,fe7aeeca8,454de4740,bbca5dfd8,00df528c8,fea66caf0,82d400898,ba5f12fc0,baa2592d0,ba77a40e8,82dc45e00,fe312ced0";
  function drawQr() {
    var c = $("qr"); if (!c) return;
    var rows = QR_APP.split(","), n = 33, q = 4, k = 4, x = c.getContext("2d");
    c.width = c.height = (n + q * 2) * k; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = "#000";
    for (var r = 0; r < n; r++) { var v = parseInt(rows[r], 16); for (var i = 0; i < n; i++) if ((v / Math.pow(2, 35 - i)) % 2 >= 1) x.fillRect((q + i) * k, (q + r) * k, k, k); }
  }

  /* ════════ 정보 칸 ════════ */
  var PN = { n: -1, r: -1, p: -1, q: "" };
  function panel() {
    var n = ST.lit, r = roundOf(n) + 1, p = inRound(n);
    if (p === 0 && n > 0 && !LIT.doneRound[roundOf(n)]) { r--; p = N; }
    if (n !== PN.n) { $("nBig").textContent = comma(n); PN.n = n; }
    if (r !== PN.r) { $("nRound").textContent = r + "번째 심볼"; PN.r = r; }
    if (p !== PN.p) { $("nPart").textContent = comma(p) + " / " + comma(N); $("nBar").style.width = (p / N * 100).toFixed(2) + "%"; PN.p = p; }
    var q = outroNow() ? "17:00 Outro · 17F 대강당 추첨" : "스탬프 하나가 점 하나로 켜집니다";
    if (q !== PN.q) { $("qNote").textContent = q; PN.q = q; }
  }
  function feedPush(id, k) {
    if (!NAMES[id]) return;
    ST.feed.unshift({ id: id, k: k || 1 });
    if (ST.feed.length > 3) ST.feed.length = 3;
    $("feed").innerHTML = ST.feed.map(function (x) { return '<p class="frow"><s></s><span>' + (x === ST.feed[0] ? "방금 · " : "") + NAMES[x.id] + " 스탬프" + (x.k > 1 ? " " + x.k + "개" : "") + "</span></p>"; }).join("");
  }

  /* ════════ 데이터 ════════ */
  function stampsOf(k) { var n = 0; IDS.forEach(function (id) { n += (+k["stamp:" + id] || 0) - (+k["unstamp:" + id] || 0); }); return Math.max(0, n); }
  function jsonp(params, done) {
    var url = Q.srv || window.AXF_SERVER || "";
    if (!/^https:\/\//.test(url) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) { done({ ok: false, reason: "noserver" }); return; }
    var name = "axw" + Date.now().toString(36) + Math.floor(Math.random() * 1e6), sc = document.createElement("script"), fin = false;
    var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
    var timer = setTimeout(function () { end({ ok: false, reason: "timeout" }); window[name] = function () {}; }, 12000);
    function end(res) { if (fin) return; fin = true; clearTimeout(timer); try { delete window[name]; } catch (e) { window[name] = undefined; } if (sc.parentNode) sc.parentNode.removeChild(sc); done(res || { ok: false }); }
    window[name] = function (res) { end(res); };
    sc.onerror = function () { end({ ok: false, reason: "network" }); };
    sc.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + qs + "&callback=" + name + "&_=" + Date.now();
    document.head.appendChild(sc);
  }
  var POLL = { fails: 0, timer: null, first: true };
  function took(total, kinds) {
    var base = Q.base ? +Q.base : 0;
    total = Math.max(0, total - base);
    if (ST.kinds && kinds) IDS.forEach(function (id) { var d = ((+kinds["stamp:" + id] || 0) - (+ST.kinds["stamp:" + id] || 0)); if (d > 0) feedPush(id, d); });
    if (kinds) ST.kinds = kinds;
    if (POLL.first) { POLL.first = false; if (!POLL.restored || total < ST.lit || total - ST.lit > 300) jumpTo(total); }   /* 처음 · 저장해 둔 값에서 조금 늘었으면 켜는 연출로 · 아니면 바로 */
    else if (total < ST.lit) jumpTo(total);   /* 서버 초기화 · 시험 데이터 비움 */
    ST.target = total;
    save("axfWall.last", { n: total, kinds: kinds || null, at: Date.now() });
  }
  function poll() {
    if (DEMO) return;
    jsonp({ action: "stats" }, function (res) {
      if (res && res.ok && res.kinds) { POLL.fails = 0; body.classList.remove("off"); ST.off = false; ST.polls++; took(stampsOf(res.kinds), res.kinds); }
      else { POLL.fails++; if (POLL.fails >= 2) { body.classList.add("off"); ST.off = true; } }
      var wait = POLL.fails ? Math.min(60, CFG.pollSec * Math.pow(2, Math.min(POLL.fails - 1, 2))) : CFG.pollSec;
      POLL.timer = setTimeout(poll, wait * 1000);
    });
  }
  /* 데모 · 서버 없이 가짜 적립(포아송) · 종류는 실제 비율과 비슷하게 */
  var DM = { rate: CFG.demoRate, paused: false, acc: 0, rnd: mulberry(1026), wts: [["lg", 30], ["qz", 18], ["p4", 10], ["p2", 9], ["p5", 10], ["p3", 12], ["st", 5], ["sv", 6]] };
  function demoStep(dt) {
    if (!DEMO || DM.paused) return;
    DM.acc += DM.rate / 60 * dt;
    while (DM.acc >= 1) {
      DM.acc -= 1 + (DM.rnd() - 0.5) * 0.6;
      var r = DM.rnd() * 100, id = "lg";
      for (var i = 0; i < DM.wts.length; i++) { r -= DM.wts[i][1]; if (r <= 0) { id = DM.wts[i][0]; break; } }
      ST.target++;
      if (DM.rnd() < 0.5 || !ST.feed.length) feedPush(id, 1);
    }
  }

  /* ════════ 입력 · 전체 화면 · 꺼짐 방지 ════════ */
  var wake = null;
  function keepAwake() { try { if (!wake && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; w.addEventListener("release", function () { wake = null; }); }).catch(function () {}); } catch (e) {} }
  function fsToggle() {
    var d = document, de = d.documentElement;
    try {
      if (!(d.fullscreenElement || d.webkitFullscreenElement)) { (de.requestFullscreen || de.webkitRequestFullscreen || function () {}).call(de); }
      else { (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d); }
    } catch (e) {}
    keepAwake();
  }
  function fsSync() { body.classList.toggle("fs", !!(document.fullscreenElement || document.webkitFullscreenElement)); }
  document.addEventListener("fullscreenchange", fsSync); document.addEventListener("webkitfullscreenchange", fsSync);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) keepAwake(); });
  $("fsBtn").addEventListener("click", function (e) { e.preventDefault(); fsToggle(); });
  var ptrT = null;
  function ptr() { body.classList.add("ptr"); clearTimeout(ptrT); ptrT = setTimeout(function () { body.classList.remove("ptr"); }, 6000); }
  ["mousemove", "pointerdown", "touchstart"].forEach(function (ev) { window.addEventListener(ev, function () { ptr(); keepAwake(); }, { passive: true }); });
  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "f" || k === "F") fsToggle();
    else if (k === "h" || k === "H") body.classList.toggle("help-on");
    else if (k === "g" || k === "G") body.classList.toggle("hud-on");
    else if (k === "n" || k === "N") { if (IL.cur) endIL(); IL.nextAt = T; }
    else if (k >= "1" && k <= "5") { if (IL.cur) endIL(); var nm = ["seq", "login", "milestone", "outro", "complete"][+k - 1]; startIL(nm, nm === "milestone" ? { m: CFG.milestones.filter(function (m) { return m <= Math.max(100, ST.lit); }).pop() || 100 } : nm === "complete" ? { round: Math.max(1, roundOf(ST.lit)), n: Math.max(N, ST.lit) } : {}); }
    else if (DEMO && k === "ArrowUp") DM.rate = Math.min(960, DM.rate * 2);
    else if (DEMO && k === "ArrowDown") DM.rate = Math.max(3, DM.rate / 2);
    else if (DEMO && k === " ") DM.paused = !DM.paused;
    else if (DEMO && (k === "j" || k === "J")) ST.target += 100;
    else if (DEMO && (k === "k" || k === "K")) { var to = (roundOf(ST.lit) + 1) * N - 6; if (to > ST.lit) { jumpTo(to); ST.target = Math.max(ST.target, to); } }
    else return;
    e.preventDefault();
  });

  /* ════════ 프레임 ════════ */
  var LQ = { on: Q.lq === "1", dts: [] };
  var FPS = { n: 0, t: 0, v: 0 };
  function frame(dt, now) {
    T += dt;
    demoStep(dt);
    release(dt);
    schedule();
    /* 번인 방지 궤도 · 8분에 한 바퀴 · ±4px */
    var oa = T * 6.2832 / 480; ORB.x = Math.round(Math.cos(oa) * 4 * G.k * G.dpr); ORB.y = Math.round(Math.sin(oa * 2) * 3 * G.k * G.dpr);
    ident(); cx.globalAlpha = 1; cx.fillStyle = "#000"; cx.fillRect(0, 0, cv.width, cv.height);
    var c = IL.cur;
    if (c) {
      var t = T - c.t0, def = ILS[c.name];
      if (t >= c.dur) { endIL(); c = null; }
      else {
        /* 들어갈 때 · 월이 0.6초에 걸쳐 빠진다 · 나올 때(handoff) · 장면의 꽉 찬 심볼이 투명도로 빠지며 지금의 월 상태(회색 빈자리)가 드러난다 */
        var ho = def.handoff || 0, hk = ho ? cl((t - (c.dur - ho)) / ho) : 0;
        var wa = def.wallAlpha ? def.wallAlpha(t, c.dur) : Math.max(1 - cl(t / 0.6), hk), gw = def.wallAlpha ? 1 : wa;
        blit(LAY.plain, 1); if (gw > 0) blit(LAY.wall, gw);
        if (wa > 0) drawWallSafe(wa);
        if (hk > 0) {
          var main = cx; cx = LAY.ilc; ident(); cx.clearRect(0, 0, LAY.il.width, LAY.il.height); logical();
          try { def.draw(c, t); } catch (e1) { if (window.console) console.error(e1); }
          cx = main; ident(); blit(LAY.il, 1 - hk);
        } else {
          logical(); cx.globalAlpha = 1;
          try { def.draw(c, t); } catch (e2) { if (window.console) console.error(e2); endIL(); }
        }
      }
    }
    if (!c) { blit(LAY.wall, 1); drawSweep(1); drawWallSafe(1); }
    uiFade(dt);
    FPS.n++; FPS.t += dt; if (FPS.t >= 1) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
    if (!REC && now) { LQ.dts.push(dt); if (LQ.dts.length > 90) LQ.dts.shift(); if (!LQ.on && LQ.dts.length === 90 && T > 20) { var md = LQ.dts.slice().sort(function (a, b) { return a - b; })[45]; if (md > 0.045) LQ.on = true; } }
    if (body.classList.contains("hud-on")) $("hud").textContent = "fps " + FPS.v.toFixed(0) + (LQ.on ? " lq" : "") + "\nlit " + ST.lit + " / target " + ST.target + "\nil " + (IL.cur ? IL.cur.name + " " + (T - IL.cur.t0).toFixed(1) : "-") + " · next " + Math.max(0, IL.nextAt - T).toFixed(0) + "s" + (SPECIAL.length ? " · q " + SPECIAL.map(function (s) { return s.name; }).join(",") : "") + (DEMO ? "\ndemo " + DM.rate.toFixed(0) + "/min" + (DM.paused ? " paused" : "") : "\npolls " + ST.polls + (ST.off ? " OFF" : ""));
  }
  function drawWallSafe(a) { try { drawWall(a); } catch (e) { if (window.console) console.error(e); } }

  /* ════════ 시작 ════════ */
  buildOrder();
  resize();
  window.addEventListener("resize", function () { if (!REC) resize(); });
  if (DEMO) { var n0 = Q.n ? +Q.n : 0; jumpTo(n0); ST.target = n0; }
  else { var last = load("axfWall.last", null); if (last && last.n >= 0) { POLL.restored = true; jumpTo(last.n); ST.target = last.n; ST.kinds = last.kinds || null; } }
  drawQr();
  panel();
  keepAwake();
  if (!DEMO && !REC) poll();
  if (!REC) {
    var lastNow = 0;
    var loop = function (now) {
      requestAnimationFrame(loop);
      var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1 / 60; lastNow = now;
      try { frame(dt, now); } catch (e) { if (window.console) console.error(e); }
    };
    requestAnimationFrame(loop);
  }
  /* 녹화 · 점검 훅 */
  window.__wall = {
    T: function () { return T; }, st: function () { return { lit: ST.lit, target: ST.target, il: IL.cur && IL.cur.name, fps: FPS.v, lq: LQ.on, port: G.port, special: SPECIAL.length }; },
    trigger: function (nm, o) { if (IL.cur) endIL(); startIL(nm, o || (nm === "milestone" ? { m: 100 } : {})); },
    add: function (n) { ST.target += n; }, jump: function (n) { jumpTo(n); ST.target = Math.max(ST.target, n); },
    rate: function (r) { DM.rate = r; }, pause: function (p) { DM.paused = !!p; },
    feed: function (id) { feedPush(id, 1); },
    took: function (total, kinds) { took(total, kinds); },
    step: function (dt) { frame(dt, 0); },
    resize: function () { resize(); }
  };
})();
