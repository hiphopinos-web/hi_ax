/* AX Festival 2026 · 1F 스탠바이미 「ME to WE 스탬프 월」 v2 (261003)
 *
 * 화면 · 로고가 주인공 · 홍보부 원본 심볼(01_Me_to_WE · 1,037점)이 화면 가운데 · 위 모서리 = 워드마크(정지) + 슬로건 줄(점으로 풀렸다 바뀜) · 아래 = 얇은 띠(스탬프 소개 카드 롤 전환)
 *        정보 칸 · 큰 숫자 · 앱 QR · 「QR을 찍고 스탬프를 모으세요」는 없다(사용자 261003) · 블랙 스테이지 + 점 격자(30px · 1.5% 오렌지)
 * 점등 · D안 = 처음부터 로고 전체가 잉걸색 점(유령 윤곽) · 스탬프 1개 = 점 하나가 켜진다 · 주변 점이 약하게 번진다 · 켜지는 순서는 가장자리에 가산점을 준 무작위(씨앗 고정)
 *        디머 단계(STAGE) · 진행률이 정해진 칸을 넘을 때마다 로고 전체가 한 칸 밝아진다 · 켜진 점 = 지금 단계의 최대 밝기 · 안 켜진 점도 단계마다 잔상 밝기가 오른다
 *        로고는 글자마다 젤리처럼 출렁이고 11초마다 차례로 통통 튄다 · 워드마크는 정지
 * 순환 · 점등 장면 CFG.wallSec(45초) ↔ 광고 장면 하나(12~15초 · 광고판 시퀀스 → 스탬프 8종 → 최초 로그인 장면 → 경품) · 행사일 16:40~17:25 에는 Outro 안내가 사이사이
 *        이정표 · 심볼 완성은 그때그때 · 광고 중에 들어온 스탬프는 점등 장면으로 돌아온 뒤 켠다(따라잡기)
 * 데이터 · 공개 집계 stats(관리코드 없음) 15초 폴링 · kinds 의 stamp:<8종> − unstamp:<8종> = 스탬프 수 · 끊기면 마지막 값 유지 · 다시 연결
 * 주소 · ?demo=1 가짜 적립 · ?o=land|port 방향 고정(없으면 화면 비율) · ?base=숫자 빼고 셈 · ?srv=주소 서버 바꾸기(시험) · ?n=숫자 데모 시작 수
 *        ?rate=분당 · ?rec=1 녹화용 고정 시계 · ?wall=초 점등 장면 길이 · ?lq=1 저사양(번짐 · 격자 파문 · 반짝임 끔) */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var p = kv.split("="); Q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
  var DEMO = Q.demo === "1", REC = Q.rec === "1";

  /* ── 상수 한 곳 ── */
  var CFG = {
    pollSec: Q.poll ? Math.max(3, +Q.poll) : 15,   /* 서버 집계는 20초 캐시 · 15초면 충분 · ?poll=초 는 시험용 */
    wallSec: Q.wall ? +Q.wall : 45,     /* 점등 장면 길이 · 광고 장면(12~15초)과 번갈아 돈다 · 점등이 화면 시간의 약 75% */
    rotation: ["seq", "stamps", "login", "prizes"],   /* 광고 장면 순환 · 광고판 시퀀스(14초) → 스탬프 8종(13초) → 최초 로그인 장면(약 11초) → 경품(15초) */
    outro: { day: "2026-10-26", s: "16:40", e: "17:25" },   /* 이 시간에는 순환 사이사이 Outro 안내 · 서버 추첨_창 기본값과 같다 */
    milestones: [100, 300, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
    soloPerMin: 12,                     /* 큰 파문은 분당 12회까지 · 넘치면 작은 파문(군집) */
    catchupSec: 3.2,                    /* 광고 장면 뒤 따라잡기 · 밀린 몫을 이 시간 안에 켠다 */
    catchupMin: 12,                     /* 밀린 몫이 이보다 적으면 따라잡기 대신 하나씩(큰 파문) */
    demoRate: Q.rate ? +Q.rate : 24,    /* 데모 · 분당 가짜 적립 */
    loginSlow: 1.1                      /* 최초 로그인 장면 · 앱보다 10% 느리게(로비 화면) */
  };
  /* 디머 단계 · 조명 디머처럼 로고 전체의 밝기가 단계마다 한 칸씩 오른다(사용자 261003 「10%만 들어와도 30% 정도 수준의 점등, 그 다음 한 단계 더 밝아지고」)
     at    = 단계가 오르는 진행률(이번 심볼에서 켜진 점 ÷ 1,037)
     lit   = 켜진 점 밝기(원본 3색에 곱하는 값 · 1 = 원본 그대로) · ghost = 안 켜진 점(잔상) 밝기 · size = 안 켜진 점 크기(켜진 점 = 1)
     fade  = 한 칸 오를 때 밝기가 옮겨 가는 초 · lift = 그때 로고 위에서 아래로 지나가는 밝은 띠 세기 · pulse = 그동안 로고 전체가 한 번 더 밝아졌다 가라앉는 폭
     체감 밝기(로고 상자 안 평균 휘도 ÷ 100% 화면 · 1920 캡처 실측 261003) = 0% 0.18 → 10% 직전 0.28 · 10% 0.34 → 20% 직전 0.43 · 20% 0.48 → 0.53 · 35% 0.59 → 0.66 · 50% 0.75 → 0.82 · 70% 0.88 → 0.89 · 90% 0.99 · 100% 1 */
  var STAGE = {
    at:    [0,    0.10, 0.20, 0.35, 0.50, 0.70, 0.90],
    lit:   [0.44, 0.52, 0.60, 0.68, 0.78, 0.88, 1.00],
    ghost: [0.20, 0.21, 0.27, 0.31, 0.38, 0.49, 0.66],
    size:  [0.70, 0.72, 0.75, 0.78, 0.82, 0.86, 0.90],
    fade: 2.4, lift: 0.4, pulse: 0.1
  };
  var LOOK = { halo: 0.3, haloMax: 0.78, haloCap: 0.35, haloSize: 0.3, shimmer: 0.26, mixBias: 2.4, roundGhost: 0.08 };   /* 번짐 세기 · 번짐 상한(잔상 ~ 켜진 점 사이 비율) · 번짐 크기 · 잔상 물결 폭 · 가장자리 가산점 · 2번째 심볼부터 잔상 바닥 */
  var IDS = ["lg", "qz", "p4", "p2", "p5", "p3", "st", "sv"];
  var NAMES = { lg: "최초 로그인", qz: "AX 퀴즈", p4: "미니 게임", p2: "AX PLAY", p5: "아이디어 한 줄", p3: "프로그램 참여", st: "계단 이용", sv: "설문 참여" };
  var COL = { o: "#FF7E31", hi: "#FF963E", txt: "rgba(255,255,255,0.88)", sub: "rgba(255,255,255,0.58)" };
  var FONT = "AXP, \"Pretendard Variable\", Pretendard, \"Malgun Gothic\", sans-serif";

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function EO(x) { x = cl(x); return 1 - Math.pow(1 - x, 3); }
  function EIO(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hh(i) { var v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
  function comma(n) { n = Math.max(0, Math.round(n)); var s = String(n), o = ""; while (s.length > 3) { o = "," + s.slice(-3) + o; s = s.slice(0, -3); } return s + o; }
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var spring = lgsSpring;

  var cv = $("cv"), cx = cv.getContext("2d"), frameEl = $("frame"), body = document.body;
  if (DEMO) body.classList.add("demo");

  /* ════════ 심볼 · 글자 나누기 · 가장자리 깊이 · 번짐 이웃표 · 켜는 순서 ════════ */
  var SYM = AXF_DATA.me.D.points, N = SYM.length, ME_A = AXF_DATA.me.A;
  var G = {};            /* 기하 · resize 가 채운다 */
  var LAY = {};          /* 캐시 캔버스 */
  var ORDER = null, ORANK = new Int16Array(N), GRP = null, RANK = null, GC = [], NB = [], H1 = new Float32Array(N), H2 = new Float32Array(N);
  function buildSymbol() {
    var sy = lgsSym(), i, j, a, b; GRP = sy.g; RANK = sy.rank;
    var sx = [], syy = [], cn = [];
    for (i = 0; i < N; i++) { var g = GRP[i]; sx[g] = (sx[g] || 0) + SYM[i][0]; syy[g] = (syy[g] || 0) + SYM[i][1]; cn[g] = (cn[g] || 0) + 1; H1[i] = hh(i); H2[i] = hh(i + 91); }
    for (g = 0; g < cn.length; g++) GC[g] = [sx[g] / cn[g], syy[g] / cn[g]];
    /* 가장자리 깊이 · 8방향 중 비어 있는 칸이 있으면 0 · 안쪽으로 1, 2, … */
    var GX = new Int16Array(N), GY = new Int16Array(N), CELL = {}, DEPTH = new Int8Array(N).fill(-1), q = [], qi = 0;
    for (i = 0; i < N; i++) { GX[i] = Math.round((SYM[i][0] - 11.54) / 24); GY[i] = Math.round((SYM[i][1] - 9.27) / 24); CELL[GX[i] + "," + GY[i]] = i; }
    for (i = 0; i < N; i++) { var edge = false; for (a = -1; a <= 1; a++) for (b = -1; b <= 1; b++) { if ((a || b) && CELL[(GX[i] + a) + "," + (GY[i] + b)] === undefined) edge = true; } if (edge) { DEPTH[i] = 0; q.push(i); } }
    while (qi < q.length) { var cur = q[qi++]; for (a = -1; a <= 1; a++) for (b = -1; b <= 1; b++) { var nb = CELL[(GX[cur] + a) + "," + (GY[cur] + b)]; if (nb !== undefined && DEPTH[nb] < 0) { DEPTH[nb] = DEPTH[cur] + 1; q.push(nb); } } }
    var MAXD = 1; for (i = 0; i < N; i++) if (DEPTH[i] > MAXD) MAXD = DEPTH[i];
    /* 번짐 이웃표 · 반경 78(원본 단위 약 3칸) 안의 점들과 가중치 exp(-d²/30²) */
    for (i = 0; i < N; i++) NB.push([]);
    for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
      var dx = SYM[i][0] - SYM[j][0], dy = SYM[i][1] - SYM[j][1], d2 = dx * dx + dy * dy;
      if (d2 > 78 * 78) continue;
      var w = Math.exp(-d2 / 900); NB[i].push(j, w); NB[j].push(i, w);
    }
    /* 켜는 순서 · 최선 후보(이미 켠 점에서 먼 것) + 가장자리 가산점 · 씨앗 고정이라 새로고침해도 같은 자리(데모 D안과 같은 순서) */
    var rnd = mulberry(20261026), left = [], out = [], dmin = new Float64Array(N);
    for (i = 0; i < N; i++) { left.push(i); dmin[i] = 1e18; }
    function take(k) {
      var id = left[k]; left[k] = left[left.length - 1]; left.pop(); out.push(id);
      var px = SYM[id][0], py = SYM[id][1];
      for (var jj = 0; jj < N; jj++) { var ex = SYM[jj][0] - px, ey = SYM[jj][1] - py, dd = ex * ex + ey * ey; if (dd < dmin[jj]) dmin[jj] = dd; }
    }
    take(Math.floor(rnd() * left.length));
    while (left.length) {
      var best = -1, bs = -1e18, tries = Math.min(14, left.length);
      for (var c = 0; c < tries; c++) {
        var k = Math.floor(rnd() * left.length), id = left[k];
        var sc = Math.sqrt(dmin[id]) / 24 * (0.85 + rnd() * 0.3) + LOOK.mixBias * (1 - DEPTH[id] / MAXD) * (DEPTH[id] === 0 ? 1.2 : 1);
        if (sc > bs) { bs = sc; best = k; }
      }
      take(best);
    }
    ORDER = out;
    for (i = 0; i < N; i++) ORANK[ORDER[i]] = i;
  }

  /* ════════ 무대 배치 · 가로 1920×1080 / 세로 1080×1920 논리 좌표 ════════ */
  function resize() {
    var w = REC ? (+Q.w || 1920) : window.innerWidth, h = REC ? (+Q.h || 1080) : window.innerHeight;
    var dpr = REC ? 1 : Math.min(window.devicePixelRatio || 1, 2), cap = 2560 * 1440;
    if (w * h * dpr * dpr > cap) dpr *= Math.sqrt(cap / (w * h * dpr * dpr));
    var port = Q.o === "port" ? true : Q.o === "land" ? false : h > w * 1.05;
    body.classList.toggle("port", port);
    var FW = port ? 1080 : 1920, FH = port ? 1920 : 1080, k = Math.min(w / FW, h / FH), ox = (w - FW * k) / 2, oy = (h - FH * k) / 2;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px";
    frameEl.style.transform = "translate(" + ox + "px," + oy + "px) scale(" + k + ")";
    /* 로고 = 가운데 · 글자 상자 합 가로 12.5% · 세로 14.8%(v2 계획 §3) */
    var S, cxs, top, band, wm, zone;
    if (!port) {
      S = 0.745; cxs = 960; top = 36;
      band = { x: 48, y: 962, w: 1824, h: 96, r: 24 };
      wm = { x: 72, y: 54, w: 300 };
      zone = { x: 1388, y: 54, w: 470, s1: 60, s2: 32, h: 112 };
    } else {
      S = 1.04; cxs = 540; top = 232;
      band = { x: 40, y: 1636, w: 1000, h: 246, r: 28 };
      wm = { x: 56, y: 56, w: 250 };
      zone = { x: 620, y: 56, w: 410, s1: 46, s2: 25, h: 96 };
    }
    G = { w: w, h: h, dpr: dpr, port: port, FW: FW, FH: FH, k: k, ox: ox, oy: oy, S: S, cxs: cxs, top: top, band: band, wm: wm, zone: zone, D: 38 * S,
      xL: -ox / k, xR: (w - ox) / k, yT: -oy / k, yB: (h - oy) / k };
    G.map = function (px, py) { return [cxs + (px - 533) * S, top + (py - 158) * S]; };
    G.cy = top + (765 - 158) * S;
    G.pos = SYM.map(function (p) { return G.map(p[0], p[1]); });
    G.gc = GC.map(function (c) { return G.map(c[0], c[1]); });
    G.ny = G.pos.map(function (p) { return cl((p[1] - top) / (1214 * S)); });
    G.bot = top + (1372 - 158) * S; G.left = cxs - 500 * S; G.right = cxs + 500 * S;
    /* axfDraw 상자 · 원본 엔진의 「me」가 월의 심볼 자리에 정확히 겹치게 */
    var bs = S / ME_A.scale, ac = G.map(ME_A.cx, ME_A.cy);
    G.box = { x: ac[0] - 540 * bs, y: ac[1] - 540 * bs, s: bs };
    G.scR = 420 * S;   /* 흩어짐 반경 */
    buildGrid(); NODES = null; cacheBoxes();
    LAY.full = mkCanvas(); LAY.fullOk = false; LAY.base = mkCanvas(); LIT.baseDirty = true; LAY.il = mkCanvas(); LAY.ilc = LAY.il.getContext("2d");
    if (FONTOK) zoneBuild();
    LGX_CUR = null; prewarm();
  }
  function devT(c, o) { c.setTransform(G.k * G.dpr, 0, 0, G.k * G.dpr, G.ox * G.dpr + (o ? o.x : 0), G.oy * G.dpr + (o ? o.y : 0)); }
  function mkCanvas() { var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; return c; }
  /* 격자 · 움직이지 않는다 · 레터박스 바깥까지 · 30px · 1.5% 오렌지(design.md §2) */
  function buildGrid() {
    LAY.grid = mkCanvas(); var g = LAY.grid.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, LAY.grid.width, LAY.grid.height); devT(g);
    var Pt = 30, i0 = Math.floor(G.xL / Pt) - 1, i1 = Math.ceil(G.xR / Pt) + 1, j0 = Math.floor(G.yT / Pt) - 1, j1 = Math.ceil(G.yB / Pt) + 1;
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
      var on = (((i * 7919 + j * 104729) * 2654435761) >>> 0) % 1000 < 15;
      g.fillStyle = on ? "rgba(255,126,49,0.55)" : "#1f1f1f"; g.fillRect(i * Pt + Pt / 2 - 1.5, j * Pt + Pt / 2 - 1.5, 3, 3);
    }
  }
  var ORB = { x: 0, y: 0 };
  function blit(c, a) { if (a <= 0) return; cx.globalAlpha = a; cx.drawImage(c, ORB.x, ORB.y); cx.globalAlpha = 1; }
  function logical() { devT(cx, ORB); }
  function ident() { cx.setTransform(1, 0, 0, 1, 0, 0); }

  /* ════════ 상태 ════════ */
  var T = 0;                                   /* 화면 시계(초) */
  var ST = { target: 0, lit: 0, kinds: null, lastKind: null, mile: 0, off: false, polls: 0, disp: null };
  var LIT = { pops: [], solo: [], acc: 0, catchup: 0, lastAt: -99, doneRound: {}, baseDirty: true, flourish: -1e4 };
  var litT = new Float32Array(N).fill(-1e4), HALO = new Float32Array(N), HD = new Float32Array(N);
  function roundOf(n) { return Math.floor(n / N); }
  function inRound(n) { return n - roundOf(n) * N; }
  /* 지금 켜진 점 수(이번 심볼) · 완성 연출이 끝나기 전에는 꽉 찬 심볼로 둔다 */
  function litNow() { var r = inRound(ST.lit); return (r === 0 && ST.lit > 0 && !LIT.doneRound[roundOf(ST.lit)]) ? N : r; }
  function baseOn() { var r = roundOf(ST.lit); if (inRound(ST.lit) === 0 && ST.lit > 0 && !LIT.doneRound[r]) r--; return r >= 1; }
  function addHalo(id, s) { var L = NB[id]; for (var j = 0; j < L.length; j += 2) HALO[L[j]] += s * L[j + 1]; }
  /* 켜진 점 · 번짐 · 단계를 지금 수에 맞춰 다시 세운다(처음 · 따라잡기 점프 · 새 심볼) · 연출 없이 */
  function rebuildState() {
    var n = litNow(); litT.fill(-1e4); HALO.fill(0); LIT.pops = [];
    for (var k = 0; k < n; k++) addHalo(ORDER[k], 1);
    HD.set(HALO); INC.fill(0); CGEN++;
    stageSet(true);
  }

  /* ── 디머 단계 ── */
  var STG = { s: 0, from: null, t0: -1e4, ups: 0 };
  function stageOf(p) { var s = 0; for (var k = 1; k < STAGE.at.length; k++) if (p >= STAGE.at[k] - 1e-9) s = k; return s; }
  function stageVals(s) { return { lit: STAGE.lit[s], ghost: STAGE.ghost[s], size: STAGE.size[s] }; }
  function stageNow() {
    var b = stageVals(STG.s), a = STG.from, r = (T - STG.t0) / STAGE.fade, u = EIO(r);
    if (!a || r >= 1 || r < 0) return b;
    var pu = STAGE.pulse * Math.sin(3.1416 * r);   /* 디머를 돌린 순간 · 한 번 환해졌다가 새 단계에 안착 */
    return { lit: Math.min(1, a.lit + (b.lit - a.lit) * u + pu), ghost: a.ghost + (b.ghost - a.ghost) * u + pu, size: a.size + (b.size - a.size) * u };
  }
  function stageSet(jump) {
    var s = stageOf(litNow() / N);
    if (s === STG.s && !jump) return;
    if (jump || s < STG.s) { STG.s = s; STG.from = null; STG.t0 = -1e4; return; }
    STG.from = stageNow(); STG.s = s; STG.t0 = T; STG.ups++;   /* 한 칸 오름 · 지금 밝기에서 다음 칸으로 옮겨 간다 */
  }

  /* 스탬프 하나 켜기 */
  function lightOne(fast) {
    var n = ST.lit, slot = ORDER[inRound(n)];
    ST.lit = n + 1;
    var now = T, solo = !fast;
    if (solo) { LIT.solo = LIT.solo.filter(function (x) { return now - x < 60; }); if (LIT.solo.length >= CFG.soloPerMin) solo = false; else LIT.solo.push(now); }
    litT[slot] = now; addHalo(slot, 1);
    LIT.pops.push({ id: slot, t0: now, solo: solo }); LIT.lastAt = now;
    if (inRound(ST.lit) === 0) { LIT.flourish = now; queueSpecial({ name: "complete", round: roundOf(ST.lit), n: ST.lit }); }
    else for (var m = 0; m < CFG.milestones.length; m++) { var ms = CFG.milestones[m]; if (n < ms && ST.lit >= ms && ms > ST.mile) { ST.mile = ms; queueSpecial({ name: "milestone", m: ms }); } }
    stageSet(false);
  }
  /* 따라잡기 · 처음 불러올 때는 연출 없이 바로 */
  function jumpTo(n) {
    ST.lit = n;
    for (var r = 1; r <= roundOf(n); r++) LIT.doneRound[r] = 1;
    ST.mile = 0; CFG.milestones.forEach(function (m) { if (m <= n) ST.mile = m; });
    LIT.baseDirty = true; ST.disp = n;
    rebuildState();
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

  /* ════════ 점 그림 · 밝기 24단(원본 3색에 곱함) · 번진 빛 ════════ */
  var K = 24, SPR = null, BLOOM = null;
  function sprites() {
    if (SPR) return SPR; SPR = { o: [], i: [], c: [], il: [] };
    var Z = 96, C0 = [255, 127, 50], C1 = [255, 150, 62], C2 = [230, 204, 255];
    var mk = function () { var c = document.createElement("canvas"); c.width = c.height = Z; return c; };
    var col = function (c, f) { return "rgb(" + Math.round(c[0] * f) + "," + Math.round(c[1] * f) + "," + Math.round(c[2] * f) + ")"; };
    for (var l = 0; l < K; l++) {
      var L = l / (K - 1), f1 = Math.pow(L, 0.8), f2 = Math.pow(L, 1.7);
      var o = mk(), x = o.getContext("2d"); x.fillStyle = col(C0, L); x.beginPath(); x.arc(Z / 2, Z / 2, Z / 2, 0, 6.2832); x.fill();
      var n = mk(); x = n.getContext("2d");
      x.fillStyle = col(C1, f1); x.beginPath(); x.arc(Z / 2, Z / 2, Z * 9 / 38, 0, 6.2832); x.fill();
      x.fillStyle = col(C2, f2); x.beginPath(); x.arc(Z / 2, Z / 2, Z * 4 / 38, 0, 6.2832); x.fill();
      var m = mk(); x = m.getContext("2d"); x.drawImage(o, 0, 0); x.drawImage(n, 0, 0);   /* 한 장으로 합친 점 · 작은 점(잔상)은 이웃 바깥 원이 핵을 덮지 않아 한 번에 찍어도 같다 */
      var q = mk(); x = q.getContext("2d");   /* 켜진 점 안쪽 · 단계가 낮아 어두워도 가운데 · 연보라 핵은 덜 어둡게(켜진 점이라는 표시) */
      x.fillStyle = col(C1, Math.pow(L, 0.5)); x.beginPath(); x.arc(Z / 2, Z / 2, Z * 9 / 38, 0, 6.2832); x.fill();
      x.fillStyle = col(C2, Math.pow(L, 0.6)); x.beginPath(); x.arc(Z / 2, Z / 2, Z * 4 / 38, 0, 6.2832); x.fill();
      SPR.o.push(o); SPR.i.push(n); SPR.c.push(m); SPR.il.push(q);
    }
    BLOOM = document.createElement("canvas"); BLOOM.width = BLOOM.height = 128; var bx = BLOOM.getContext("2d"), gr = bx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,150,62,1)"); gr.addColorStop(0.35, "rgba(255,126,49,0.45)"); gr.addColorStop(1, "rgba(255,126,49,0)"); bx.fillStyle = gr; bx.fillRect(0, 0, 128, 128);
    return SPR;
  }

  /* ════════ 점 움직임 · 시간 T 의 함수 ════════ */
  var DX = { x: new Float32Array(N), y: new Float32Array(N), d: new Float32Array(N), l: new Float32Array(N), lit: new Uint8Array(N), age: new Float32Array(N), key: new Uint8Array(N) };
  var GSX = [], GSY = [], GB = [], SETC = new Int16Array(8), GLOB = 1, MOTION = Q.motion !== "0";
  function frameDots() {
    var S = G.S, mo = MOTION ? 1 : 0, lq = LQ.on, i, g, n = litNow(), sv = stageNow();
    var gh = Math.min(0.85, sv.ghost + (baseOn() ? LOOK.roundGhost : 0)), gs = sv.size, Lm = sv.lit;
    var fl = T - LIT.flourish, flA = fl >= 0 && fl < 3.2, crest = ((T / 12.5) % 1) * 1.5 - 0.25, fcrest = flA ? fl / 2.2 * 1.4 - 0.2 : -9;
    var su = (T - STG.t0) / STAGE.fade, sA = su >= 0 && su < 1, screst = sA ? su * 1.5 - 0.25 : -9;
    var glob = 1 + 0.006 * Math.sin(T * 6.2832 / 6) * mo; GLOB = glob; SETC.fill(0);
    /* 글자 6개(M e t o W e) · 젤리(찌그러짐 ±3%) + 위아래 흔들림 · 11초마다 차례로 통통 튄다 */
    for (g = 0; g < GC.length; g++) {
      var ph = g * 1.05 + 0.4, u = Math.sin(T * 6.2832 / 4.2 + ph) * mo, sx = 1 + 0.03 * u, sy = 1 - 0.03 * u;
      var bob = 4.5 * S * Math.sin(T * 6.2832 / 5.6 + ph * 1.3) * mo, hu = ((T + 3) % 11) - g * 0.15;
      if (mo && hu > 0 && hu < 1.6) { var bn = Math.exp(-3.2 * hu) * Math.sin(10 * hu); bob -= 15 * S * Math.max(0, bn); sy -= 0.07 * Math.max(0, -bn); sx += 0.04 * Math.max(0, -bn); }
      GSX[g] = sx; GSY[g] = sy; GB[g] = bob;
    }
    for (i = 0; i < N; i++) {
      var lit = ORANK[i] < n, pp = G.pos[i], gg = GRP[i], gc = G.gc[gg];
      var x = gc[0] + (pp[0] - gc[0]) * GSX[gg], y = gc[1] + (pp[1] - gc[1]) * GSY[gg] + GB[gg];
      x = G.cxs + (x - G.cxs) * glob; y = G.cy + (y - G.cy) * glob;
      if (mo && !lq) { x += 0.9 * Math.sin(T * 1.7 + 6.28 * H1[i]); y += 0.9 * Math.sin(T * 1.3 + 6.28 * H2[i]); }
      var ny = G.ny[i], dw = (ny - crest) / 0.05, wv = mo && dw > -3 && dw < 3 ? Math.exp(-dw * dw) : 0, fw = 0, sw = 0;
      if (flA) { var df = (ny - fcrest) / 0.07; fw = Math.exp(-df * df); }
      if (sA) { var ds = (ny - screst) / 0.12; sw = Math.exp(-ds * ds) * (1 - 0.4 * su); }
      y -= (5 * S * wv + 9 * S * fw + 5 * S * sw);
      var L, size, age = T - litT[i];
      if (lit) {
        L = Lm; size = 1; if (age >= 0.7) SETC[gg]++;
        if (age >= 0 && age < 0.7) { var sc = spring(age / 0.7, 0.45, 1.4); size = (gs + (1 - gs) * sc) * (1 + 0.2 * Math.max(0, 1 - age / 0.35)); L = Math.min(1, Lm + 0.3 * (1 - age / 0.7)); }
      } else {
        var shim = lq ? 0.5 : 0.5 + 0.5 * Math.sin(T * 6.2832 / 7.5 - (pp[0] * 0.0036 + ny * 1.8) * 6.2832 + H1[i] * 0.6);
        L = gh * (1 + (shim - 0.5) * LOOK.shimmer * 2 * mo) + 0.2 * wv + 0.35 * fw;
        size = gs;
        var hd = HD[i];
        if (hd > 0.001) {   /* 번짐 · 켜진 이웃이 많을수록 따뜻해진다 · 켜진 점보다는 늘 어둡게 */
          var add = (1 - Math.exp(-hd * 0.62 * LOOK.halo)) * LOOK.haloMax;
          L = Math.max(L, Math.min(gh + (Lm - gh) * LOOK.haloCap, gh + add * (1 + (shim - 0.5) * 0.18 * mo))); size = gs + (1 - gs) * cl(add / 0.7) * LOOK.haloSize;
        }
      }
      if (fw > 0.01) { size *= 1 + 0.12 * fw; L = Math.min(1, L + 0.3 * fw); }
      if (sw > 0.01) { size *= 1 + 0.08 * sw; L = Math.min(1, L + STAGE.lift * sw); }
      DX.x[i] = x; DX.y[i] = y; DX.d[i] = G.D * size; DX.l[i] = L; DX.lit[i] = lit ? 1 : 0; DX.age[i] = age;
      var b = clamp(Math.round(L * (K - 1)), 0, K - 1); DX.key[i] = b * 2 + (lit ? 1 : 0);
    }
    /* 켜지는 순간 밀어내는 물결 · 주변 점이 살짝 밀렸다 돌아온다 · 최근 8개만 */
    if (mo && !lq) for (var pi = LIT.pops.length - 1, cnt = 0; pi >= 0 && cnt < 8; pi--) {
      var pop = LIT.pops[pi], a2 = T - pop.t0; if (a2 < 0 || a2 > 1.4) continue; cnt++;
      var c0 = G.pos[pop.id], amp = 3.2 * S * Math.exp(-a2 * 2.6) * Math.sin(a2 * 9) * (pop.solo ? 1 : 0.5), R = 130 * S;
      for (i = 0; i < N; i++) { var dx = DX.x[i] - c0[0], dy = DX.y[i] - c0[1]; if (dx > R || dx < -R || dy > R || dy < -R) continue; var dd = Math.sqrt(dx * dx + dy * dy); if (dd < 1 || dd > R) continue; var f2 = amp * (1 - dd / R); DX.x[i] += dx / dd * f2; DX.y[i] += dy / dd * f2; }
    }
  }
  var BKC = new Int32Array(K * 2 + 1), BKO = new Int16Array(N), BIG = new Int16Array(N), OVR = new Int16Array(N);
  /* 글자별 캐시(켜진 점) · resize 가 상자를 만들고 · 자리 잡은 켜진 점 수나 밝기 단이 바뀌면 그 글자만 다시 찍는다(한 프레임에 두 글자까지) */
  var CACHE_ON = Q.cache !== "0", GCH = [], INC = new Uint8Array(N), CGEN = 0;
  function cacheBoxes() {
    var s = G.k * G.dpr, r = G.D / 2 + 3; GCH = []; INC.fill(0); CGEN++;
    for (var g = 0; g < GC.length; g++) GCH.push({ ids: [], x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, key: null, gen: -1 });
    for (var i = 0; i < N; i++) { var o = GCH[GRP[i]], p = G.pos[i]; o.ids.push(i); o.x0 = Math.min(o.x0, p[0] - r); o.y0 = Math.min(o.y0, p[1] - r); o.x1 = Math.max(o.x1, p[0] + r); o.y1 = Math.max(o.y1, p[1] + r); }
    GCH.forEach(function (o) { o.w = o.x1 - o.x0; o.h = o.y1 - o.y0; o.cv = document.createElement("canvas"); o.cv.width = Math.ceil(o.w * s); o.cv.height = Math.ceil(o.h * s); o.ctx = o.cv.getContext("2d"); });
  }
  function cacheSync(lmB) {
    var built = 0;
    for (var g = 0; g < GCH.length; g++) {
      var o = GCH[g], key = SETC[g] * 64 + lmB;
      if ((o.key === key && o.gen === CGEN) || built >= 2) continue;
      var c = o.ctx, sp = sprites(), D = G.D, r = D / 2, s = G.k * G.dpr, n = litNow(), j, id, pass;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, o.cv.width, o.cv.height); c.setTransform(s, 0, 0, s, -o.x0 * s, -o.y0 * s);
      for (j = 0; j < o.ids.length; j++) { id = o.ids[j]; INC[id] = (ORANK[id] < n && T - litT[id] >= 0.7) ? 1 : 0; }
      for (pass = 0; pass < 2; pass++) for (j = 0; j < o.ids.length; j++) { id = o.ids[j]; if (!INC[id]) continue; var p = G.pos[id]; c.drawImage(pass ? sp.il[lmB] : sp.o[lmB], p[0] - r, p[1] - r, D, D); }
      o.key = key; o.gen = CGEN; built++;
    }
  }
  function drawCaches(a, sv) {
    function all(alpha) {
      cx.globalAlpha = alpha;
      for (var g = 0; g < GCH.length; g++) {
        var o = GCH[g]; if (o.gen !== CGEN) continue;
        var gc = G.gc[g], ax = G.cxs + GLOB * (gc[0] - G.cxs), ay = G.cy + GLOB * (gc[1] + GB[g] - G.cy);
        cx.save(); cx.translate(ax, ay); cx.scale(GLOB * GSX[g], GLOB * GSY[g]); cx.drawImage(o.cv, o.x0 - gc[0], o.y0 - gc[1], o.w, o.h); cx.restore();
      }
    }
    all(a);
    /* 지나가는 밝은 띠(12.5초 물결 · 단계 오름)를 캐시 위에도 · 띠 모양으로 잘라 한 번 더 가산 */
    var H = 1214 * G.S, crest = ((T / 12.5) % 1) * 1.5 - 0.25, su = (T - STG.t0) / STAGE.fade, bands = [];
    if (MOTION) bands.push([crest, 0.05, 0.16]);
    if (su >= 0 && su < 1) bands.push([su * 1.5 - 0.25, 0.12, STAGE.lift * 0.8 * (1 - 0.4 * su)]);
    for (var b = 0; b < bands.length; b++) {
      var yc = G.top + bands[b][0] * H, hw = bands[b][1] * H * 1.6;
      if (yc + hw < G.top || yc - hw > G.top + H) continue;
      cx.save(); cx.beginPath(); cx.rect(G.xL, yc - hw, G.xR - G.xL, hw * 2); cx.clip(); cx.globalCompositeOperation = "lighter"; all(a * bands[b][2]); cx.restore();
    }
    cx.globalAlpha = 1;
  }
  function drawLogo(a) {
    if (a <= 0) return;
    var sp = sprites(), i, k, lq = LQ.on, sv = stageNow();
    var tf = PROF ? performance.now() : 0; frameDots(); if (PROF) PROF.frameDots = (PROF.frameDots || 0) + performance.now() - tf;
    /* 밝기 단계별로 모아 어두운 점부터 · 같은 단계면 켜진 점이 위에(셈 정렬) */
    BKC.fill(0); for (i = 0; i < N; i++) BKC[DX.key[i] + 1]++;
    for (k = 1; k < BKC.length; k++) BKC[k] += BKC[k - 1];
    for (i = 0; i < N; i++) BKO[BKC[DX.key[i]]++] = i;
    /* 그리기 호출 줄이기
       ① 안 켜진 작은 점(지름 0.85배 이하 · 이웃 바깥 원이 핵에 닿지 않음)은 합친 한 장으로 한 번
       ② 자리 잡은 켜진 점(켜진 지 0.7초 넘음)은 글자별 캐시 한 장(바깥 → 안쪽 두 번 찍어 둠)을 글자 젤리 · 통통 변형 그대로 옮겨 그린다
       ③ 방금 켜진 점 · 캐시에 아직 없는 점만 하나씩 바깥 → 안쪽 */
    var fl = T - LIT.flourish, useC = CACHE_ON && !(fl >= 0 && fl < 3.2), lmB = clamp(Math.round(sv.lit * (K - 1)), 0, K - 1);
    if (useC) cacheSync(lmB);
    cx.globalAlpha = a;
    var big = BIG, nb = 0, over = OVR, no = 0, dS = G.D * 0.85, d2, lv;
    for (k = 0; k < N; k++) {
      i = BKO[k]; d2 = DX.d[i]; if (d2 < 0.5) continue;
      if (DX.lit[i]) { if (!(useC && INC[i])) over[no++] = i; continue; }
      lv = DX.key[i] >> 1;
      if (d2 <= dS) cx.drawImage(sp.c[lv], DX.x[i] - d2 / 2, DX.y[i] - d2 / 2, d2, d2); else { cx.drawImage(sp.o[lv], DX.x[i] - d2 / 2, DX.y[i] - d2 / 2, d2, d2); big[nb++] = i; }
    }
    for (k = 0; k < nb; k++) { i = big[k]; d2 = DX.d[i]; cx.drawImage(sp.i[DX.key[i] >> 1], DX.x[i] - d2 / 2, DX.y[i] - d2 / 2, d2, d2); }
    if (useC) drawCaches(a, sv);
    cx.globalAlpha = a;
    for (var ps = 0; ps < 2; ps++) { var set = ps ? sp.il : sp.o; for (k = 0; k < no; k++) { i = over[k]; d2 = DX.d[i]; cx.drawImage(set[DX.key[i] >> 1], DX.x[i] - d2 / 2, DX.y[i] - d2 / 2, d2, d2); } }
    if (PROF) PROF.sprites = (PROF.sprites || 0) + performance.now() - tf;
    /* 번진 빛(켜진 점 둘레) · 가산 · 단계 밝기를 따른다 */
    if (!lq) {
      cx.globalCompositeOperation = "lighter";
      var rec = 0; for (k = 0; k < LIT.pops.length; k++) if (T - LIT.pops[k].t0 < 1.5) rec++;
      var bs = 1 / (1 + rec / 8), bl = sv.lit * a;   /* 한꺼번에 많이 켜지면 번짐을 줄여 하얗게 타지 않게 */
      for (i = 0; i < N; i++) {
        if (!DX.lit[i]) continue; var ag = DX.age[i];
        if (ag < 0 || ag > 40) continue;   /* 오래된 점의 옅은 번짐(0.014)은 그리지 않는다 · 그리기 호출 절약 · 40초에 걸쳐 0으로 */
        var a3 = (0.014 + 0.035 * Math.exp(-ag / 20)) * (1 - ag / 40) + 0.2 * bs * Math.exp(-ag / 1.8), r3 = G.D * (1.4 + 0.5 * Math.exp(-ag / 1.2));
        cx.globalAlpha = Math.min(0.45, a3) * bl; cx.drawImage(BLOOM, DX.x[i] - r3, DX.y[i] - r3, r3 * 2, r3 * 2);
      }
      cx.globalCompositeOperation = "source-over";
    }
    /* 켜지는 순간 번쩍임 · 파문 */
    var bigs = 0;
    for (k = 0; k < LIT.pops.length; k++) {
      var pop = LIT.pops[k], u = T - pop.t0; if (u < 0 || u > 2.2) continue;
      var px = DX.x[pop.id], py = DX.y[pop.id];
      if (pop.solo && u < 0.5) { cx.globalAlpha = a * 0.9 * (1 - u / 0.5); cx.fillStyle = "#FFF3E8"; cx.beginPath(); cx.arc(px, py, G.D * 0.22 * (1 + u), 0, 6.2832); cx.fill(); }
      var life = pop.solo ? 1.8 : 0.9;
      if (u < life && bigs < 12) { bigs++; var ru = u / life; cx.globalAlpha = a * (pop.solo ? 0.5 : 0.3) * (1 - ru); cx.strokeStyle = COL.hi; cx.lineWidth = pop.solo ? 2.2 : 1.4; cx.beginPath(); cx.arc(px, py, G.D / 2 + EO(ru) * (pop.solo ? 110 * G.S / 0.745 : 40), 0, 6.2832); cx.stroke(); }
    }
    /* 반짝임 · 켜진 점 하나가 0.45초마다 핵을 번쩍(3개) */
    var nl = litNow();
    if (MOTION && !lq && nl > 0) {
      var slot = Math.floor(T / 0.45), tu = (T - slot * 0.45) / 0.45;
      cx.fillStyle = "#FFFFFF";
      for (k = 0; k < 3; k++) { var id = ORDER[Math.floor(hh(slot * 3 + k) * nl)]; cx.globalAlpha = a * 0.9 * Math.sin(tu * 3.1416) * sv.lit; cx.beginPath(); cx.arc(DX.x[id], DX.y[id], G.D * 0.13, 0, 6.2832); cx.fill(); }
    }
    cx.globalAlpha = 1;
  }
  /* 격자 점 파문 · 평소 9초마다 로고 가운데에서 바깥으로 · 스탬프가 켜질 때(큰 파문)마다 그 점에서 바깥으로 · 단계가 오를 때 한 번 크게 */
  var NODES = null;
  function nodes() {
    if (NODES) return NODES; var Pt = 30, xs = [], ys = [];
    for (var j = Math.floor(G.yT / Pt) - 1; j <= Math.ceil(G.yB / Pt) + 1; j++) for (var i = Math.floor(G.xL / Pt) - 1; i <= Math.ceil(G.xR / Pt) + 1; i++) { xs.push(i * Pt + Pt / 2); ys.push(j * Pt + Pt / 2); }
    NODES = { x: new Float32Array(xs), y: new Float32Array(ys) }; return NODES;
  }
  function drawLattice(a) {
    if (a <= 0 || LQ.on) return;
    var nd = nodes(), n = nd.x.length, src = [], i, k;
    if (MOTION) { var r0 = ((T / 9) % 1) * 1250; src.push([G.cxs, G.cy, r0, 0.42 * (1 - r0 / 1250)]); }
    var su = T - STG.t0; if (su >= 0 && su < 3.4) src.push([G.cxs, G.cy, su * 420, 0.7 * (1 - su / 3.4)]);
    var cnt = 0;
    for (k = LIT.pops.length - 1; k >= 0 && cnt < 6; k--) { var pop = LIT.pops[k], u = T - pop.t0; if (!pop.solo || u < 0 || u > 2.2) continue; cnt++; var pc = G.pos[pop.id]; src.push([pc[0], pc[1], u * 300, 0.6 * (1 - u / 2.2)]); }
    if (!src.length) return;
    cx.fillStyle = "#FF8A3A";
    for (k = 0; k < src.length; k++) {
      var s0 = src[k], sx = s0[0], sy = s0[1], r = s0[2], am = s0[3] * a, w = 50, lim = r + 2.2 * w;
      for (i = 0; i < n; i++) {
        var dx = nd.x[i] - sx, dy = nd.y[i] - sy; if (dx > lim || dx < -lim || dy > lim || dy < -lim) continue;
        var e = (Math.sqrt(dx * dx + dy * dy) - r) / w; if (e > 2.2 || e < -2.2) continue;
        var al = am * Math.exp(-e * e); if (al < 0.03) continue;
        cx.globalAlpha = al; cx.fillRect(nd.x[i] - 2.5, nd.y[i] - 2.5, 5, 5);
      }
    }
    cx.globalAlpha = 1;
  }

  /* ════════ 위 모서리 · 워드마크(정지 · 홍보부 원본 SVG 합성) + 슬로건 줄(점으로 풀렸다 모인다) ════════ */
  var FORMS = [
    { l1: "ME to WE :", l2: "나의 경험을 우리의 가능성으로" },
    { l1: "2026.10.26 (월)", l2: "현대해상 광화문 본사 9:30~17:30" }
  ];
  var ZM = { pairs: null, pitch: 4 }, WMIMG = null, WMREADY = false, FONTOK = false;
  function wmLoad() {
    var svg = (typeof AXF_WORDMARK === "string" ? AXF_WORDMARK : "").replace(/currentColor/g, COL.o);
    WMIMG = new Image(); WMIMG.onload = function () { WMREADY = true; }; WMIMG.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function drawForm(c, form, x, y, alpha) {
    var Z = G.zone; if (alpha <= 0) return; c.globalAlpha = alpha; c.textBaseline = "alphabetic"; c.textAlign = "left";
    c.fillStyle = COL.o; c.font = "600 " + Z.s1 + "px " + FONT; c.fillText(form.l1, x, y + Z.s1 * 0.86);
    c.fillStyle = COL.hi; c.font = "600 " + Z.s2 + "px " + FONT; c.fillText(form.l2, x, y + Z.s1 * 0.86 + Z.s2 * 1.55);
    c.globalAlpha = 1;
  }
  function sampleForm(form) {
    var Z = G.zone, off = document.createElement("canvas"), W = Math.ceil(Z.w + 40), H = Math.ceil(Z.h + 40); off.width = W; off.height = H;
    var c = off.getContext("2d"); drawForm(c, form, 0, 0, 1);
    var d = c.getImageData(0, 0, W, H).data, pts = [], pt = ZM.pitch;
    for (var y = 0; y < H - 1; y += pt) for (var x = 0; x < W - 1; x += pt) { if (d[((y + 1) * W + (x + 1)) * 4 + 3] > 110) pts.push([x, y]); }
    return pts;
  }
  function zoneBuild() {
    var sets = FORMS.map(sampleForm); ZM.pairs = [];
    for (var f = 0; f < 2; f++) {
      var A = sets[f].slice().sort(function (p, q) { return p[0] - q[0] || p[1] - q[1]; }), B = sets[1 - f].slice().sort(function (p, q) { return p[0] - q[0] || p[1] - q[1]; });
      var m = Math.max(A.length, B.length), rnd = mulberry(77 + f), list = [];
      if (!A.length || !B.length) { ZM.pairs.push([]); continue; }
      for (var k = 0; k < m; k++) {
        var a0 = A[Math.floor(k * A.length / m)], b0 = B[Math.floor(k * B.length / m)];
        list.push({ ax: a0[0], ay: a0[1], bx: b0[0], by: b0[1], d: rnd() * 0.34, sw: (rnd() - 0.5) * 120, s: 3 + rnd() * 1.6 });
      }
      ZM.pairs.push(list);
    }
  }
  var ZCYC = [9.0, 1.7, 4.6, 1.7];   /* 슬로건 유지 · 풀림 · 일정 유지 · 모임(17초) */
  function zoneState(t) {
    var tot = ZCYC[0] + ZCYC[1] + ZCYC[2] + ZCYC[3]; t = t % tot;
    if (t < ZCYC[0]) return { form: 0 };
    t -= ZCYC[0]; if (t < ZCYC[1]) return { from: 0, morph: true, u: t / ZCYC[1] };
    t -= ZCYC[1]; if (t < ZCYC[2]) return { form: 1 };
    t -= ZCYC[2]; return { from: 1, morph: true, u: t / ZCYC[3] };
  }
  function drawHeader() {
    if (WMREADY) { var wm = G.wm; cx.drawImage(WMIMG, wm.x, wm.y, wm.w, wm.w * 179 / 497.6); }
    var Z = G.zone, st = zoneState(T);
    if (!st.morph || !ZM.pairs) { drawForm(cx, FORMS[st.form || 0], Z.x, Z.y, 1); return; }
    var u = st.u, from = st.from, list = ZM.pairs[from];
    drawForm(cx, FORMS[from], Z.x, Z.y, 1 - cl(u / 0.12));
    drawForm(cx, FORMS[1 - from], Z.x, Z.y, cl((u - 0.88) / 0.12));
    var da = Math.min(1, u / 0.1, (1 - u) / 0.1);
    cx.fillStyle = "#FF8A3A"; cx.globalAlpha = da * 0.95;
    for (var k = 0; k < list.length; k++) {
      var p = list[k], t = EIO((u - p.d) / 0.66);
      var mx = (p.ax + p.bx) / 2 + p.sw * 0.6, my = (p.ay + p.by) / 2 - p.sw, iu = 1 - t;
      var x = iu * iu * p.ax + 2 * iu * t * mx + t * t * p.bx, y = iu * iu * p.ay + 2 * iu * t * my + t * t * p.by, s = p.s * (1 + 0.3 * Math.sin(t * 3.1416));
      cx.fillRect(Z.x + x - s / 2, Z.y + y - s / 2, s, s);
    }
    cx.globalAlpha = 1;
  }

  /* ════════ 하단 띠 · 엘리베이터 광고 문법 · 3.4초마다 카드 롤 전환(조건 소개 어조 · 방금 적립 카드 4장에 1장) ════════ */
  var ADS = [
    { id: "lg", name: "최초 로그인", cond: "앱 설치 후 첫 로그인" },
    { id: "qz", name: "AX 퀴즈", cond: "한 판 완주 · 약 2분" },
    { live: 1 },
    { id: "p4", name: "미니 게임", cond: "테트리스 · AX팡 · 점프 3종 완주" },
    { id: "p2", name: "AX PLAY", cond: "하이디큐 · 하이헬퍼 체험 후 스태프 인증" },
    { id: "p5", name: "아이디어 한 줄", cond: "앱 또는 현장 QR로 제출" },
    { live: 1 },
    { id: "p3", name: "프로그램 참여", cond: "실습 · 강연 · 커피챗 · 상담 중 하나" },
    { id: "st", name: "계단 이용", cond: "한 층만 오르내려도 적립" },
    { id: "sv", name: "설문 참여", cond: "행사 설문 제출" },
    { live: 1 },
    { id: "all", name: "3개 룰렛 · 4개 이상 행운권", cond: "스탬프 8종 중 최대 6개" }
  ];
  var OUTRO_AD = { id: "out", name: "17:00 Outro · 17F 대강당", cond: "입구 화면 QR로 추첨 체크인" };
  var CARD_SEC = 3.4;
  function cardSeq() {
    var s = ST.lastKind ? ADS : ADS.filter(function (x) { return !x.live; });
    if (outroNow()) { s = s.slice(); s.splice(6, 0, OUTRO_AD); s.push(OUTRO_AD); }
    return s;
  }
  function cardText(ad) {
    if (ad.live) { var k = ST.lastKind || "lg"; return { name: NAMES[k] + " 스탬프", cond: "방금 적립", id: k }; }
    return ad;
  }
  function fitFont(wgt, size, txt, maxW) {
    cx.font = wgt + " " + size + "px " + FONT;
    var w = cx.measureText(txt).width;
    if (w > maxW) { size = Math.max(12, Math.floor(size * maxW / w)); cx.font = wgt + " " + size + "px " + FONT; }
    return size;
  }
  function bandLine(txt, size, wgt, col, x, y, prog, dir, delay, maxW, mul) {
    /* prog 0 → 1 · dir = +1 들어옴(아래에서) · -1 나감(위로) · 0 = 제자리(투명도만) · mul = 띠 전체 투명도 */
    if (!txt) return;
    var B = G.band, p = cl((prog - delay) / (1 - delay)), e = EO(p), a, dy;
    if (dir > 0) { a = e; dy = (1 - e) * size * 0.9; } else if (dir < 0) { a = 1 - e; dy = -e * size * 0.9; } else { a = prog; dy = 0; }
    a *= (mul == null ? 1 : mul);
    if (a <= 0.01) return;
    cx.save(); cx.beginPath(); cx.rect(B.x + 6, B.y + 4, B.w - 12, B.h - 8); cx.clip();
    cx.globalAlpha = a; cx.fillStyle = col; fitFont(wgt, size, txt, maxW); cx.textBaseline = "alphabetic"; cx.textAlign = "left"; cx.fillText(txt, x, y + dy); cx.restore();
  }
  function drawBand(il) {
    var B = G.band, port = G.port, ia0 = il ? il.a : 0, ba = 1 - cl(ia0 * 2), ia = cl(ia0 * 2 - 1);   /* 띠 · 카드가 다 빠진 뒤 장면 문구가 들어온다(겹쳐 보이지 않게) */
    cx.fillStyle = "#0d0d0d"; cx.beginPath(); if (cx.roundRect) cx.roundRect(B.x, B.y, B.w, B.h, B.r); else cx.rect(B.x, B.y, B.w, B.h); cx.fill();
    var nameS = port ? 74 : 46, condS = port ? 36 : 30, gap = port ? 54 : 38, x, y, maxW;
    if (!port) { x = B.x + 560; y = B.y + 41; maxW = 1060; } else { x = B.x + 48; y = B.y + 104; maxW = 904; }
    var lx = port ? B.x + 48 : B.x + 44, ly = port ? B.y + B.h - 40 : B.y + 62;
    var seq = cardSeq(), idx = Math.floor(T / CARD_SEC), u = T % CARD_SEC, cur = cardText(seq[idx % seq.length]), prev = cardText(seq[(idx + seq.length - 1) % seq.length]);
    if (ba > 0.01) {
      cx.save();
      /* 카드 · 나간 뒤 들어온다(두 줄이 어긋난 시간) */
      if (u < 0.34) { var po = cl(u / 0.3); bandLine(prev.name, nameS, 700, COL.o, x, y, po, -1, 0, maxW, ba); bandLine(prev.cond, condS, 500, COL.txt, x, y + gap, po, -1, 0.14, maxW, ba); }
      else { var pr = cl((u - 0.3) / 0.62); bandLine(cur.name, nameS, 700, COL.o, x, y, pr, +1, 0, maxW, ba); bandLine(cur.cond, condS, 500, COL.txt, x, y + gap, pr, +1, 0.14, maxW, ba); }
      /* 오늘 모인 스탬프 */
      cx.globalAlpha = ba; cx.textBaseline = "alphabetic"; cx.textAlign = "left";
      var cntS = comma(ST.disp == null ? ST.lit : ST.disp), numS = port ? 48 : 52;
      cx.fillStyle = COL.sub; cx.font = "500 " + (port ? 26 : 22) + "px " + FONT; cx.fillText("오늘 모인 스탬프", lx, ly);
      var lw = cx.measureText("오늘 모인 스탬프").width;
      cx.fillStyle = COL.o; cx.font = "700 " + numS + "px " + FONT; cx.fillText(cntS, lx + lw + 16, ly + (port ? 4 : 5));
      var nw = cx.measureText(cntS).width;
      cx.font = "600 " + (port ? 24 : 22) + "px " + FONT; cx.fillText("개", lx + lw + 16 + nw + 6, ly + (port ? 4 : 5));
      /* 8점 페이저 · 지금 소개 중인 스탬프의 점이 켜진다 */
      var pd = port ? 15 : 13, pg = port ? 26 : 22, total = 8 * pd + 7 * (pg - pd), pxs = port ? B.x + B.w - 48 - total : B.x + B.w - 44 - total, pys = port ? B.y + B.h - 52 : B.y + B.h / 2;
      var tid = u < 0.34 ? prev.id : cur.id;
      for (var i = 0; i < 8; i++) {
        var on = tid === IDS[i] || tid === "all";
        cx.globalAlpha = ba * (on ? (tid === "all" ? 0.6 : 1) : 0.2); cx.fillStyle = COL.o; cx.beginPath(); cx.arc(pxs + i * pg + pd / 2, pys, on ? pd / 2 : pd / 2 - 3, 0, 6.2832); cx.fill();
        if (on && tid !== "all") { cx.fillStyle = "#E6CCFF"; cx.beginPath(); cx.arc(pxs + i * pg + pd / 2, pys, pd / 5, 0, 6.2832); cx.fill(); }
      }
      cx.restore();
    }
    /* 광고 장면 · 띠는 카드 순환을 멈추고 그 장면 문구만(투명도로) */
    if (ia > 0.01 && il) {
      var o = il.o;
      cx.save();
      if (o.eye) { cx.globalAlpha = ia; cx.fillStyle = COL.hi; fitFont(600, port ? 28 : 24, o.eye, port ? 520 : 480); cx.textBaseline = "alphabetic"; cx.textAlign = "left"; cx.fillText(o.eye, lx, ly); }
      bandLine(o.title, nameS, 700, COL.o, x, y, ia, 0, 0, port ? maxW : 1260);
      bandLine(o.meta, condS, 500, COL.txt, x, y + gap, ia, 0, 0, port ? maxW : 1260);
      cx.restore();
    }
    cx.globalAlpha = 1;
  }

  /* ════════ 광고 장면(막간) ════════ */
  var IL = { cur: null, nextAt: CFG.wallSec, rot: 0, lastOutro: false, count: 0 };
  var SPECIAL = [];
  function queueSpecial(o) { if (o.name === "complete") SPECIAL = SPECIAL.filter(function (x) { return x.name !== "milestone"; }); SPECIAL.push(o); }
  function outroNow() {
    var d = new Date(), ds = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2), hm = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    if (Q.outro === "1") return true;
    return ds === CFG.outro.day && hm >= CFG.outro.s && hm < CFG.outro.e;
  }
  function startIL(name, o) {
    var def = ILS[name]; if (!def) return;
    IL.cur = { name: name, t0: T, o: o || {}, dur: def.dur(o || {}), st: {}, ba: 0, bo: null };
    IL.count++;
    body.classList.add("il");
    if (def.start) def.start(IL.cur);
  }
  function endIL() {
    var c = IL.cur; if (!c) return;
    var def = ILS[c.name]; if (def.end) def.end(c);
    IL.cur = null; body.classList.remove("il");
    IL.nextAt = T + CFG.wallSec;
    var q = ST.target - ST.lit; if (q > CFG.catchupMin) LIT.catchup = q;   /* 따라잡기 · 적게 밀렸으면 하나씩 */
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
  /* 띠 문구 · 장면이 주는 문구를 투명도로 들이고 끝나기 1초 전에 뺀다 */
  function bandIL(c, t, dt) {
    var def = ILS[c.name], o = def.band ? def.band(c, t) : null, want = o && t < c.dur - 1.0 ? 1 : 0;
    if (o) c.bo = o;
    c.ba = clamp(c.ba + clamp(want - c.ba, -dt / 0.5, dt / 0.6), 0, 1);
    return c.bo && c.ba > 0.01 ? { o: c.bo, a: c.ba } : null;
  }
  var BRAND = { eye: "AX Festival 2026", title: "ME to WE :", meta: "나의 경험을 우리의 가능성으로" };
  /* 원본 엔진(axfDraw) 한 장면 · 흩어짐 sc */
  function axf(name, f, a, sc) { axfDraw(cx, name, f, G.box, null, a, sc); }
  var SEQ = [["dot", 2.2], ["run", 3.6], ["me", 4.2]], SEQ_TR = 1.5;   /* 광고판 시퀀스 14초(점 → 달리는 사람 → ME to WE) */
  /* 스탬프 8종 장면 · 짧은 조건 줄(띠보다 짧게) */
  var AD_ST = [["lg", "최초 로그인", "앱 첫 로그인"], ["qz", "AX 퀴즈", "한 판 완주 · 약 2분"], ["p4", "미니 게임", "게임 3종 완주"], ["p2", "AX PLAY", "체험 후 스태프 인증"],
    ["p5", "아이디어 한 줄", "앱 · 현장 QR로 제출"], ["p3", "프로그램 참여", "실습 · 강연 · 커피챗 · 상담"], ["st", "계단 이용", "한 층만 오르내려도"], ["sv", "설문 참여", "행사 설문 제출"]];
  /* 경품 장면 · 사진 = ../assets/prize/(앱과 같은 파일 · 가격 없음) · 이름은 앱 PRIZES 와 똑같이(상품권의 10만원은 액면가라 상품 이름의 일부) */
  var PZ_DIR = "../assets/prize/";
  var PZ_DRAW = [["1등", "아이패드", "ld1_ipad"], ["2등", "신라호텔 파크뷰 뷔페 식사권 2매", "ld2_shilla"], ["3등", "미닉스 음식물 처리기", "ld3_minix"], ["4등", "에어팟 4", "ld4_airpods"], ["5등", "풀리오 종아리 마사지기", "ld5_pulio"], ["6등", "현대백화점 상품권 10만원", "ld6_hyundai"]];
  var PZ_RL = [["1등", "텀블러", "rl1_tumbler"], ["2등", "커피 + 키캡 키링", "rl2_coffee_keyring"], ["3등", "컵받침", "rl3_coaster"], ["4등", "판스티커", "rl4_sticker"], ["5등", "볼펜", "rl5_pen"]];
  var PZ_IMG = {}, PZ_PAGE = 7.4;
  function pzLoad() {
    PZ_DRAW.concat(PZ_RL).forEach(function (p) { var im = new Image(); im.decoding = "async"; im.onload = function () { im.ok = true; }; im.src = PZ_DIR + p[2] + ".webp"; PZ_IMG[p[2]] = im; });
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function drawTile(p, x, y, sz, a, nameS, rankS, colW) {
    if (a <= 0.01) return;
    var im = PZ_IMG[p[2]], e = EO(a), s = sz * (0.94 + 0.06 * e), ox = x - s / 2, oy = y + (sz - s) / 2;
    cx.save(); cx.globalAlpha = e;
    rrect(cx, ox, oy, s, s, s * 0.08); cx.fillStyle = "#141414"; cx.fill();
    if (im && im.ok) { cx.clip(); cx.drawImage(im, ox, oy, s, s); }
    cx.restore();
    cx.save(); cx.globalAlpha = cl(a * 1.4 - 0.2); cx.textAlign = "center"; cx.textBaseline = "alphabetic";
    cx.fillStyle = COL.hi; cx.font = "600 " + rankS + "px " + FONT; cx.fillText(p[0], x, y + sz + rankS + 18);
    cx.fillStyle = COL.txt; fitFont(600, nameS, p[1], colW - 16); cx.fillText(p[1], x, y + sz + rankS + 22 + nameS * 1.15);
    cx.restore();
  }
  function drawPrizePage(list, t0, t, out) {
    var port = G.port, n = list.length, k, cols, sz, cw, rh, y0;
    if (!port) { cols = n === 6 ? 3 : 5; sz = n === 6 ? 250 : 236; cw = n === 6 ? 420 : 320; rh = 380; y0 = n === 6 ? 120 : 300; }
    else { cols = 2; sz = 270; cw = 470; rh = 412; y0 = 300; }
    var nameS = port ? 34 : 30, rankS = port ? 26 : 24;
    for (k = 0; k < n; k++) {
      var col = k % cols, row = Math.floor(k / cols), inRow = Math.min(cols, n - row * cols);
      var x = G.cxs + (col - (inRow - 1) / 2) * cw, y = y0 + row * rh;
      var a = cl((t - t0 - 0.3 - k * 0.12) / 0.6) * (1 - cl((t - out) / 0.7));
      drawTile(list[k], x, y, sz, a, nameS, rankS, cw);
    }
  }
  function drawStamps(t, dur) {
    var port = G.port, cols = port ? 2 : 4, cw = port ? 470 : 380, rh = port ? 300 : 360, D = port ? 132 : 116;
    var x0 = G.cxs - (cols - 1) * cw / 2, y0 = port ? 380 : 250, sp = lgsSprites();
    var nameS = port ? 44 : 38, condS = port ? 28 : 24, out = 1 - cl((t - (dur - 1.6)) / 1.2);
    for (var k = 0; k < AD_ST.length; k++) {
      var col = k % cols, row = Math.floor(k / cols), px = x0 + col * cw, py = y0 + row * rh;
      var at = 0.35 + k * 0.12, e = spring((t - at) / 0.8, 0.5, 1.3); if (e <= 0) continue;
      var hiT = t - (2.0 + k * 1.05), bump = hiT >= 0 && hiT < 0.6 ? Math.sin(3.1416 * hiT / 0.6) : 0, d = D * e * (1 + 0.14 * bump), fa = cl((t - at) / 0.3) * out;
      cx.globalAlpha = fa; cx.drawImage(sp.o0, px - d / 2, py - d / 2, d, d); cx.drawImage(sp.o1, px - d / 2, py - d / 2, d, d);
      if (hiT >= 0 && hiT < 1.2) {
        var ru = hiT / 1.2; cx.globalAlpha = 0.5 * (1 - ru) * out; cx.strokeStyle = COL.hi; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(px, py, D / 2 + EO(ru) * 70, 0, 6.2832); cx.stroke();
        if (hiT < 0.4) { cx.globalAlpha = 0.8 * (1 - hiT / 0.4) * out; cx.fillStyle = "#FFFFFF"; cx.beginPath(); cx.arc(px, py, D * 0.12, 0, 6.2832); cx.fill(); }
      }
      var ta = cl((t - at - 0.2) / 0.5) * out; if (ta <= 0) continue;
      cx.globalAlpha = ta; cx.textAlign = "center"; cx.textBaseline = "alphabetic";
      cx.fillStyle = COL.o; fitFont(600, nameS, AD_ST[k][1], cw - 20); cx.fillText(AD_ST[k][1], px, py + D / 2 + nameS + 18);
      cx.fillStyle = COL.txt; fitFont(500, condS, AD_ST[k][2], cw - 20); cx.fillText(AD_ST[k][2], px, py + D / 2 + nameS + 26 + condS * 1.35);
    }
    cx.globalAlpha = 1; cx.textAlign = "left";
  }
  var ILS = {
    /* 1 · 홈 광고판 시퀀스(14초) · 점 → 달리는 사람 → ME to WE(월의 심볼 자리에 안착) */
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
      },
      band: function (c, t) { return t > 0.4 ? BRAND : null; },
      handoff: 1.4
    },
    /* 2 · 최초 로그인 장면 · 앱 LGX(v5.02 · 원 단계 없음)를 검정 스테이지로 · 점 하나 → Me → We → to → 월의 심볼 자리 */
    login: {
      dur: function () { return (LGS.PRE + LGS.T.land + 2.2) * CFG.loginSlow + 1.4; },
      start: function (c) { c.st.L = LGX_CUR || (LGX_CUR = lgsLayout(lgsGeom())); c.st.L.sparks = null; },
      draw: function (c, t) {
        var ts = Math.min(t / CFG.loginSlow, LGS.PRE + LGS.T.land + 2.2) - LGS.PRE;   /* 앞 구간(점이 생김)은 음수 시각 */
        c.st.ts = ts;
        lgsFrame(c.st.L, cx, ts, { lq: LQ.on, water: waterFill });
      },
      band: function (c) { return c.st.ts > LGS.T.land - 0.1 ? BRAND : null; },
      handoff: 1.4
    },
    /* 3 · 이정표(8초) · 공(3중 원)이 쏟아져 굴렀다가 심볼의 점이 된다 · 로고 위 반투명 큰 숫자 한 번 */
    milestone: {
      dur: function () { return 8; },
      start: function (c) {
        var rnd = mulberry(c.o.m || 7), n = LQ.on ? 48 : 96, balls = [], lit = litNow(), pool = baseOn() ? N : Math.max(1, lit);
        for (var i = 0; i < n; i++) { var rk = i * 13 % 36; balls.push({ x: G.left + 40 + rnd() * (G.right - G.left - 80), y: G.yT - 60 - rnd() * 700, vx: (rnd() - 0.5) * 120, vy: rnd() * 200, d: (rk < 7 ? 38 : rk < 18 ? 24 : 14) * G.S * 1.7, at: rnd() * 1.2, tgt: ORDER[Math.floor(rnd() * pool)], fly: 3.7 + i * 0.014 + rnd() * 0.3 }); }
        c.st.b = balls; c.st.lastT = 0;
      },
      draw: function (c, t) {
        var dt = clamp(t - c.st.lastT, 0, 0.05); c.st.lastT = t;
        var floor = G.bot, gL = G.left - 40, gR = G.right + 40, P = [], i;
        var m = c.o.m || 100, cu = EO((t - 0.5) / 1.8), na = cl((t - 0.3) / 0.6) * (1 - cl((t - 6.2) / 0.9));
        if (na > 0) { cx.globalAlpha = 0.72 * na; cx.fillStyle = COL.o; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.font = "700 " + (G.port ? 300 : 260) + "px " + FONT; cx.fillText(comma(Math.round(m * 0.5 + m * 0.5 * cu)), G.cxs, G.cy); cx.globalAlpha = 1; cx.textAlign = "left"; cx.textBaseline = "alphabetic"; }
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
      },
      band: function (c) { return { eye: "Milestone.", title: "오늘 모인 스탬프 " + comma(c.o.m || 100) + "개", meta: "" }; },
      wallAlpha: function (t) { return 0.3 + 0.7 * Math.max(1 - cl(t / 0.6), cl((t - 5.0) / 1.2)); }
    },
    /* 4 · Outro 안내 · 16:40~17:25 · 02 Connection 고리 */
    outro: {
      dur: function () { return 15; },
      draw: function (c, t) {
        var f = T * 30, R = G.scR, e = EO(t / 1.2), x = EIO((t - (c.dur - 1.6)) / 1.4);
        axf("circle", f, e * (1 - x), (1 - e) * R + x * R);
      },
      band: function (c, t) { return t > 0.5 ? { eye: "Lucky Draw", title: "17:00 Outro", meta: "17F 대강당 · 입구 화면 QR로 추첨 체크인" } : null; },
      handoff: 1.5
    },
    /* 5 · 심볼 완성 · 1,037개마다 · 출렁임 · 파문 · 옅은 겹으로 남는다 */
    complete: {
      dur: function () { return 10.5; },
      start: function (c) { if (!c.o.round) { c.o.round = roundOf(ST.lit) || 1; c.o.n = ST.lit; } },
      draw: function (c, t) {
        var sp = lgsSprites(), D = G.D, i, p, wb = 1 + 0.05 * Math.exp(-3.2 * t) * Math.sin(12 * t), cxx = G.cxs, cyy = G.cy;
        var dim = EIO((t - 6.6) / 2.4), wave = (t * 0.7) % 1;
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
      },
      band: function (c, t) { return t > 0.8 ? { eye: "Complete.", title: c.o.round + "번째 심볼 완성", meta: "스탬프 " + comma(c.o.n) + "개" } : null; },
      end: function (c) { LIT.doneRound[c.o.round] = 1; LIT.baseDirty = true; rebuildState(); },
      wallAlpha: function () { return 0; }
    },
    /* 6 · 스탬프 8종(13초) · 큰 3중 원 점 8개가 차례로 나타나고 하나씩 통통 · 이름 · 조건(투명도로만) */
    stamps: {
      dur: function () { return 13; },
      draw: function (c, t) { drawStamps(t, c.dur); },
      band: function (c, t) { return t > 0.5 ? { eye: "Stamp.", title: "스탬프 8종 · 최대 6개", meta: "3개 모으면 룰렛 1회 · 4개부터 행운권" } : null; },
      handoff: 1.4
    },
    /* 7 · 경품(15초) · 행운권 1~6등 → 룰렛 1~5등 · 사진 · 등수 · 이름(가격 없음 · 상품권 액면가는 이름) */
    prizes: {
      dur: function () { return 15; },
      draw: function (c, t) {
        if (t < PZ_PAGE + 0.8) drawPrizePage(PZ_DRAW, 0, t, PZ_PAGE - 0.8);
        if (t > PZ_PAGE - 0.2) drawPrizePage(PZ_RL, PZ_PAGE, t, c.dur + 9);
      },
      band: function (c, t) {
        if (t > 0.4 && t < PZ_PAGE - 0.9) return { eye: "Lucky Draw.", title: "행운권 경품", meta: "스탬프 4개부터 행운권 · 17:00 Outro 추첨" };
        if (t > PZ_PAGE) return { eye: "Roulette.", title: "룰렛 경품", meta: "스탬프 3개 모으면 룰렛 1회" };
        return null;
      },
      handoff: 1.4
    }
  };
  function lgsGeom() {
    return { cx: G.cxs, cy: G.cy, S: G.S, map: G.map, fw: G.port ? 1000 : 1060, hh: G.port ? 1150 : 1080, xR: G.xR, yB: G.yB };
  }
  function waterFill(line, a) {
    cx.save(); cx.beginPath(); cx.rect(G.xL - 10, line, G.xR - G.xL + 20, G.yB - line + 20); cx.clip();
    cx.globalAlpha = a * 0.92; cx.fillStyle = "#120904"; cx.fillRect(G.xL - 10, line, G.xR - G.xL + 20, G.yB - line + 20); cx.restore(); cx.globalAlpha = 1;
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
  var LGX_CUR = null;
  function prewarm() {
    /* 막간 전환 순간 끊김 방지 · 글자 나누기 · 점 그림 · 배치 · 한 장씩 미리 그려 둔다(화면 밖 캔버스) */
    try {
      lgsSprites(); sprites(); LGX_CUR = lgsLayout(lgsGeom());
      var off = document.createElement("canvas"); off.width = 64; off.height = 64; var oc = off.getContext("2d");
      [-0.3, 0.9, 2.3, 4.2, 5.5].forEach(function (t) { lgsFrame(LGX_CUR, oc, t, { lq: false, water: function () {} }); });
      LGX_CUR.sparks = null;
      ["dot", "circle", "run", "me"].forEach(function (nm) { axfDraw(oc, nm, 10, { x: 0, y: 0, s: 0.05 }, null, 1, 0); });
    } catch (e) { if (window.console) console.warn("prewarm", e); }
  }

  /* ════════ 방금 적립 · 띠의 「방금 적립」 카드에 종류만(익명) ════════ */
  function feedPush(id) { if (NAMES[id]) ST.lastKind = id; }

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
    if (ST.kinds && kinds) IDS.forEach(function (id) { var d = ((+kinds["stamp:" + id] || 0) - (+ST.kinds["stamp:" + id] || 0)); if (d > 0) feedPush(id); });
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
      feedPush(id);
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
  var IL_KEYS = ["seq", "login", "milestone", "outro", "complete", "stamps", "prizes"];
  function trigger(nm) {
    if (IL.cur) endIL();
    startIL(nm, nm === "milestone" ? { m: CFG.milestones.filter(function (m) { return m <= Math.max(100, ST.lit); }).pop() || 100 } : nm === "complete" ? { round: Math.max(1, roundOf(ST.lit)), n: Math.max(N, ST.lit) } : {});
  }
  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "f" || k === "F") fsToggle();
    else if (k === "h" || k === "H") body.classList.toggle("help-on");
    else if (k === "g" || k === "G") body.classList.toggle("hud-on");
    else if (k === "n" || k === "N") { if (IL.cur) endIL(); IL.nextAt = T; }
    else if (k >= "1" && k <= "7") trigger(IL_KEYS[+k - 1]);
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
  var FPS = { n: 0, t: 0, v: 0 }, ILB = null, HUDN = 0;
  function frame(dt, now) {
    T += dt;
    demoStep(dt);
    release(dt);
    schedule();
    /* 번인 방지 궤도 · 8분에 한 바퀴 · ±4px */
    var oa = T * 6.2832 / 480; ORB.x = Math.round(Math.cos(oa) * 4 * G.k * G.dpr); ORB.y = Math.round(Math.sin(oa * 2) * 3 * G.k * G.dpr);
    if (LIT.pops.length && T - LIT.pops[0].t0 > 2.4) LIT.pops = LIT.pops.filter(function (p) { return T - p.t0 < 2.4; });
    var ks = 1 - Math.exp(-dt / 0.9); for (var i = 0; i < N; i++) { var dh = HALO[i] - HD[i]; if (dh) HD[i] += dh * ks; }
    if (ST.disp == null) ST.disp = ST.lit; ST.disp += (ST.lit - ST.disp) * (1 - Math.exp(-dt / 0.35)); if (Math.abs(ST.lit - ST.disp) < 0.5) ST.disp = ST.lit;
    ident(); cx.globalAlpha = 1; cx.fillStyle = "#000"; cx.fillRect(0, 0, cv.width, cv.height);
    cx.drawImage(LAY.grid, ORB.x, ORB.y);
    logical();
    var c = IL.cur; ILB = null;
    if (c && T - c.t0 >= c.dur) { endIL(); c = null; }
    if (c) {
      var t = T - c.t0, def = ILS[c.name];
      /* 들어갈 때 · 월이 0.6초에 걸쳐 빠진다 · 나올 때(handoff) · 장면이 투명도로 빠지며 지금의 월이 드러난다 */
      var ho = def.handoff || 0, hk = ho ? cl((t - (c.dur - ho)) / ho) : 0;
      var wa = def.wallAlpha ? def.wallAlpha(t, c.dur) : Math.max(1 - cl(t / 0.6), hk);
      safe(drawLattice, wa); if (wa > 0) safe(drawLogo, wa);
      if (hk > 0) {
        var main = cx; cx = LAY.ilc; ident(); cx.clearRect(0, 0, LAY.il.width, LAY.il.height); logical();
        try { def.draw(c, t); } catch (e1) { if (window.console) console.error(e1); }
        cx = main; ident(); blit(LAY.il, 1 - hk); logical();
      } else {
        logical(); cx.globalAlpha = 1;
        try { def.draw(c, t); } catch (e2) { if (window.console) console.error(e2); endIL(); }
      }
      logical(); cx.globalAlpha = 1;
      if (IL.cur === c) ILB = bandIL(c, t, dt);
    } else { safe(drawLattice, 1); safe(drawLogo, 1); }
    logical(); cx.globalAlpha = 1;
    safe(drawHeader); safe(drawBand, ILB);
    ident();
    FPS.n++; FPS.t += dt; if (FPS.t >= 1) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
    if (!REC && now) { LQ.dts.push(dt); if (LQ.dts.length > 90) LQ.dts.shift(); if (!LQ.on && LQ.dts.length === 90 && T > 20) { var md = LQ.dts.slice().sort(function (a, b) { return a - b; })[45]; if (md > 0.045) LQ.on = true; } }
    if (body.classList.contains("hud-on") && (HUDN++ % 6 === 0)) { var sv = stageNow(); $("hud").textContent = "fps " + FPS.v.toFixed(0) + (LQ.on ? " lq" : "") + "\nlit " + ST.lit + " / target " + ST.target + " · stage " + STG.s + " (lit " + sv.lit.toFixed(2) + " ghost " + sv.ghost.toFixed(2) + ")\nil " + (IL.cur ? IL.cur.name + " " + (T - IL.cur.t0).toFixed(1) : "-") + " · next " + Math.max(0, IL.nextAt - T).toFixed(0) + "s" + (SPECIAL.length ? " · q " + SPECIAL.map(function (s) { return s.name; }).join(",") : "") + (DEMO ? "\ndemo " + DM.rate.toFixed(0) + "/min" + (DM.paused ? " paused" : "") : "\npolls " + ST.polls + (ST.off ? " OFF" : "")); }
  }
  var PROF = Q.prof === "1" ? {} : null;
  function safe(fn, a) { var t0 = PROF ? performance.now() : 0; try { fn(a); } catch (e) { if (window.console) console.error(e); } if (PROF) { var nm = fn.name; PROF[nm] = (PROF[nm] || 0) + performance.now() - t0; } }

  /* ════════ 시작 ════════ */
  buildSymbol();
  wmLoad(); pzLoad();
  resize();
  window.addEventListener("resize", function () { if (!REC) resize(); });
  if (DEMO) { var n0 = Q.n ? +Q.n : 0; jumpTo(n0); ST.target = n0; }
  else { var last = load("axfWall.last", null); if (last && last.n >= 0) { POLL.restored = true; jumpTo(last.n); ST.target = last.n; ST.kinds = last.kinds || null; } }
  keepAwake();
  if (!DEMO && !REC) poll();
  var fontP = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("600 40px AXP"), document.fonts.load("700 40px AXP"), document.fonts.load("500 30px AXP")]).catch(function () {}) : Promise.resolve();
  var ready = fontP.then(function () { FONTOK = true; zoneBuild(); });
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
    ready: ready.then(function () { return new Promise(function (r) { var n = 0; (function w() { var pz = Object.keys(PZ_IMG).every(function (k) { return PZ_IMG[k].ok || PZ_IMG[k].complete; }); if ((WMREADY && pz) || ++n > 200) r(); else setTimeout(w, 30); })(); }); }),
    T: function () { return T; }, st: function () { var sv = stageNow(); return { lit: ST.lit, target: ST.target, il: IL.cur && IL.cur.name, ilT: IL.cur ? T - IL.cur.t0 : 0, ils: IL.count, fps: FPS.v, lq: LQ.on, port: G.port, special: SPECIAL.length, stage: STG.s, ups: STG.ups, slit: sv.lit, sghost: sv.ghost, next: IL.nextAt - T }; },
    trigger: function (nm) { trigger(nm); }, end: function () { if (IL.cur) endIL(); }, calm: function () { SPECIAL = []; if (IL.cur) endIL(); IL.nextAt = T + 1e6; },
    add: function (n) { ST.target += n; }, light: function (k) { for (var i = 0; i < (k || 1); i++) { ST.target = Math.max(ST.target, ST.lit + 1); lightOne(false); } }, jump: function (n, exact) { jumpTo(n); ST.target = exact ? n : Math.max(ST.target, n); },
    rate: function (r) { DM.rate = r; }, pause: function (p) { DM.paused = !!p; },
    feed: function (id) { feedPush(id); },
    took: function (total, kinds) { took(total, kinds); },
    step: function (dt) { frame(dt, 0); },
    settle: function (sec, dt) { dt = dt || 1 / 30; for (var i = 0; i < sec / dt; i++) frame(dt, 0); },
    set: function (o) { if ("nextAt" in o) IL.nextAt = T + o.nextAt; if ("lq" in o) LQ.on = !!o.lq; if ("motion" in o) MOTION = !!o.motion; },
    resize: function () { resize(); }, prof: function () { var o = PROF; PROF = Q.prof === "1" ? {} : null; return o; },
    stage: STAGE, look: LOOK, cfg: CFG
  };
})();
