/* AX Festival 2026 · 1F 스탠바이미 「ME to WE 스탬프 월」 v5 「모션 그래픽」 (261003 · 사용자 승인)
 * 화면 · 워드마크(위 왼쪽) · 로고(가운데 · 점 2,026개) · 오늘 모인 스탬프 숫자와 다음 목표(아래 왼쪽) · Lv(아래 오른쪽) · 「빛 하나 = 스탬프 하나」
 *  0  불씨 · 로고 2,026점이 어두운 오렌지 불씨로 놓여 있고, 은은한 빛 한 줄기가 아래에서 위로 천천히 지나간다(1차 완성 전 움직임은 이것 하나)
 *  1막 모으기 · 1차 완성 목표 CFG.g1(250) · 스탬프 1개 = 혜성 1개 · 닿으면 하얀 점이 팡 · 닿은 덩어리(점 약 8개)가 번쩍인다
 *     온기 = 로고 전체가 진행도만큼 고르게 달아오른다(얼룩 없음) · 앉은 자리 = 씨앗 점 하나만 O100 · 씨앗 순서 = 먼 곳부터라 밝은 점이 고르게 흩어진다
 *  1차 완성 · 마지막 혜성이 닿으면 로고 전체가 차례로 점화 → 하얀 점 폭죽 → 무대가 오렌지로 한 번 뒤집히고 로고가 하얗게 숨쉰다(약 10초)
 *  2막 · 누적이 CFG.lv 경계를 넘을 때마다 움직임이 하나씩 열린다 · Lv2 물결(500) · Lv3 궤도(1,000) · Lv4 2026(2,026 · 무대 오렌지 뒤집기) · Lv5 ME to WE(3,000) · 이후 CFG.mile(1,000)마다
 *  다시 보기 · CFG.tlEvery(240초)마다 로고가 흩어졌다가 오늘 모인 스탬프가 사방에서 날아들어 다시 로고가 되고 숫자가 0에서 n까지 오른다
 * 데이터 · 공개 집계 stats(관리코드 없음) 15초 폴링 · kinds 의 stamp:<8종> − unstamp:<8종> = 스탬프 수 · 실패하면 15 → 30 → 60초로 늦추고 마지막 값 유지 + 「연결 다시 시도 중」
 *        늘어난 수를 다음 15초(92%)에 고르게 나눠 혜성으로 · 몰리면 떼로 · 처음 열 때 · 새로고침 · 서버 수가 줄었을 때 = 지금 수로 바로(1차 완성 · 레벨 장면 다시 틀지 않음)
 * 주소 · ?o=land|port 방향 고정(없으면 화면 비율) · ?base=숫자 빼고 셈(비상용) · ?demo=1 서버 없이 가짜 적립 · 조작표 H(데모) · ?rec=1 녹화용 고정 시계 */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var p = kv.split("="); Q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
  var DEMO = Q.demo === "1", REC = Q.rec === "1";

  var CFG = {
    g1: 250,                                     /* 1차 완성 목표(스탬프 수) · Lv1 경계 */
    names: ["모으기", "완성", "물결", "궤도", "2026", "ME to WE"],
    mile: 1000,                                  /* Lv5 뒤 1,000마다 ME to WE 장면 다시 */
    pollSec: 15, spread: 0.92, swarmAt: 24, swarmGap: 0.12,   /* 서버 집계 주기(초 · 서버는 20초 캐시) · 바꾸지 않는다 */
    maxFly: 28, maxQueue: 300,
    tlEvery: 240, tlMin: 5,                      /* 「오늘 하루 다시 보기」 주기(초) · 스탬프가 이만큼은 있어야 */
    dotRatio: 1.16,                              /* 점 지름 ÷ 점 간격 · 모든 점 같은 크기 */
    warm: [0.18, 0.7, 0.45],                     /* 로고 전체 온기(밝기 사다리) · 0개 → 1차 완성 직전 · 진행도^0.45 로 고르게(초반에 빨리) 오른다 */
    lift: [0.08, 0],                             /* 스탬프가 앉은 덩어리 · 씨앗 바로 옆 · 그 바깥이 온기보다 이만큼 더 밝다(씨앗 점 하나만 O100) */
    ignStep: 0.085                               /* 덩어리 안에서 한 걸음 번지는 시간(초) */
  };
  CFG.lv = [CFG.g1, 500, 1000, 2026, 3000];        /* 레벨 경계 · Lv1 완성 · Lv2 물결 · Lv3 궤도 · Lv4 2026 · Lv5 ME to WE */

  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function EO(x) { x = cl(x); return 1 - Math.pow(1 - x, 3); }
  function EI(x) { x = cl(x); return x * x * x; }
  function EIO(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function ESIO(x) { x = cl(x); return 0.5 - 0.5 * Math.cos(Math.PI * x); }
  function EOB(x) { x = cl(x); var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function bell(x) { x = cl(x); return Math.sin(Math.PI * x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function comma(n) { n = Math.max(0, Math.round(n)); var s = String(n), o = ""; while (s.length > 3) { o = "," + s.slice(-3) + o; s = s.slice(0, -3); } return s + o; }
  function $(id) { return document.getElementById(id); }
  var RND = mulberry(20261026);

  var cv = $("cv"), cx = cv.getContext("2d"), body = document.body;
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var FONT = "AXP, \"Pretendard Variable\", Pretendard, \"Malgun Gothic\", sans-serif";
  var COL = { o: "#FF7E31", hi: "#FF963E", o50: "#FFB284", txt: "rgba(255,255,255,0.92)", sub: "rgba(255,255,255,0.6)", faint: "rgba(255,255,255,0.36)" };

  /* ════════ 로고 점 · v4c 와 같은 2,026점(홍보부 심볼 1,037점을 더 촘촘한 격자로 다시 뽑음) ════════ */
  var SYM = AXF_DATA.me.D.points, LOGO = null;
  function groupsOf(P, tol) {
    var n = P.length, par = [], i, j;
    for (i = 0; i < n; i++) par.push(i);
    function f(a) { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (Math.abs(P[i][0] - P[j][0]) <= tol && Math.abs(P[i][1] - P[j][1]) <= tol) par[f(i)] = f(j);
    var G = {}, ks = [];
    for (i = 0; i < n; i++) { var r = f(i); if (!G[r]) { G[r] = []; ks.push(r); } G[r].push(i); }
    var top = function (a) { var m = 1e9; a.forEach(function (q) { m = Math.min(m, P[q][1]); }); return m; };
    var gs = ks.map(function (k) { return G[k]; }).sort(function (a, b) { return top(a) - top(b); });
    var g = new Int8Array(n); gs.forEach(function (arr, k) { arr.forEach(function (q) { g[q] = k; }); });
    return { g: g, count: gs.length };
  }
  function resample(target) {
    var P = SYM, n = P.length, i, SIG = 11, CELL = 48, H = {};
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (i = 0; i < n; i++) {
      x0 = Math.min(x0, P[i][0]); x1 = Math.max(x1, P[i][0]); y0 = Math.min(y0, P[i][1]); y1 = Math.max(y1, P[i][1]);
      var key = Math.floor(P[i][0] / CELL) + "," + Math.floor(P[i][1] / CELL); (H[key] || (H[key] = [])).push(i);
    }
    var s2 = 2 * SIG * SIG;
    function field(x, y) {
      var cx0 = Math.floor(x / CELL), cy0 = Math.floor(y / CELL), f = 0, best = -1, bd = 1e18;
      for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
        var L = H[(cx0 + a) + "," + (cy0 + b)]; if (!L) continue;
        for (var k = 0; k < L.length; k++) { var dx = P[L[k]][0] - x, dy = P[L[k]][1] - y, d2 = dx * dx + dy * dy; f += Math.exp(-d2 / s2); if (d2 < bd) { bd = d2; best = L[k]; } }
      }
      return [f, best];
    }
    var fin = 0; for (var a = -4; a <= 4; a++) for (var b = -4; b <= 4; b++) fin += Math.exp(-576 * (a * a + b * b) / s2);
    var TH = fin * 0.5, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    function sample(p) {
      var out = [], ni = Math.ceil((x1 - x0) / 2 / p) + 2, nj = Math.ceil((y1 - y0) / 2 / p) + 2;
      for (var j = -nj; j <= nj; j++) for (var ii = -ni; ii <= ni; ii++) {
        var x = mx + ii * p, y = my + j * p, fb = field(x, y);
        if (fb[0] > TH * 0.6) out.push({ x: x, y: y, f: fb[0], src: fb[1] });
      }
      return out;
    }
    var bestP = 24, bestErr = 1e9, bestC = null;
    for (var p = 14; p <= 22; p += 0.01) {
      var c = sample(p), cnt = 0; for (i = 0; i < c.length; i++) if (c[i].f > TH) cnt++;
      var err = Math.abs(cnt - target); if (err < bestErr && c.length >= target) { bestErr = err; bestP = p; bestC = c; }
      if (err === 0) break;
    }
    bestC.sort(function (a, b) { return b.f - a.f; });
    return { pts: bestC.slice(0, target), pitch: bestP };
  }
  function buildLogo() {
    var gr = groupsOf(SYM, 26), r = resample(2026), P = [], g = [];
    r.pts.forEach(function (q) { P.push([q.x, q.y]); g.push(gr.g[q.src]); });
    LOGO = { P: P, g: g, n: P.length, pitch: r.pitch, groups: gr.count };
    /* 이웃(8방향) · 데우기 반경 안 이웃(무게) */
    var n = LOGO.n, R8 = LOGO.pitch * 1.6, n8 = [], i, j, CELL = R8, H = {};
    for (i = 0; i < n; i++) { n8.push([]); var k = Math.floor(P[i][0] / CELL) + "," + Math.floor(P[i][1] / CELL); (H[k] || (H[k] = [])).push(i); }
    for (i = 0; i < n; i++) {
      var ci = Math.floor(P[i][0] / CELL), cj = Math.floor(P[i][1] / CELL);
      for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
        var L = H[(ci + a) + "," + (cj + b)]; if (!L) continue;
        for (var q = 0; q < L.length; q++) {
          j = L[q]; if (j === i) continue;
          var dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], d = Math.sqrt(dx * dx + dy * dy);
          if (d <= R8) n8[i].push(j);
        }
      }
    }
    LOGO.n8 = n8;
    /* ME · to · WE 묶음(위에서부터 M e t o W e) */
    var y0 = 1e9, y1 = -1e9; P.forEach(function (p) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    LOGO.part = new Int8Array(n);
    for (i = 0; i < n; i++) {
      if (LOGO.groups === 6) LOGO.part[i] = g[i] <= 1 ? 0 : g[i] <= 3 ? 1 : 2;
      else { var v = (P[i][1] - y0) / (y1 - y0); LOGO.part[i] = v < 0.36 ? 0 : v < 0.6 ? 1 : 2; }
    }
  }
  /* 덩어리 · 먼 곳부터 고르게(farthest point) 고른 g1 개의 씨앗 + 격자 이웃으로 동시에 번져 나눈 영역 · 씨앗 순서 = 켜지는 순서 */
  var CL = [], clOf = null, clDepth = null;
  function buildClusters(K) {
    var n = LOGO.n, P = LOGO.P, i, mx = 0, my = 0;
    P.forEach(function (p) { mx += p[0]; my += p[1]; }); mx /= n; my /= n;
    var dmin = new Float64Array(n).fill(1e18), cur = 0, bd = 1e18, seeds = [];
    for (i = 0; i < n; i++) { var d0 = (P[i][0] - mx) * (P[i][0] - mx) + (P[i][1] - my) * (P[i][1] - my); if (d0 < bd) { bd = d0; cur = i; } }
    var jr = mulberry(7);
    for (var k = 0; k < K; k++) {
      seeds.push(cur); var best = -1, bv = -1;
      for (i = 0; i < n; i++) {
        var dx = P[i][0] - P[cur][0], dy = P[i][1] - P[cur][1], d = dx * dx + dy * dy;
        if (d < dmin[i]) dmin[i] = d;
        var v = dmin[i] * (0.85 + 0.3 * jr());   /* 조금 흔들어 격자처럼 딱딱한 순서를 피한다 */
        if (v > bv) { bv = v; best = i; }
      }
      cur = best;
    }
    clOf = new Int32Array(n).fill(-1); clDepth = new Int32Array(n);
    /* 이웃으로만 번지되 씨앗에서 직선거리가 가까운 쪽이 먼저 차지한다(둥근 덩어리) */
    var key = new Float64Array(n).fill(1e18), hp = [], done = new Uint8Array(n);
    var push = function (d, i, k) { hp.push([d, i, k]); var c = hp.length - 1; while (c > 0) { var pa = (c - 1) >> 1; if (hp[pa][0] <= hp[c][0]) break; var t = hp[pa]; hp[pa] = hp[c]; hp[c] = t; c = pa; } };
    var popH = function () { var top = hp[0], last = hp.pop(); if (hp.length) { hp[0] = last; var c = 0; for (;;) { var l = 2 * c + 1, r = l + 1, m = c; if (l < hp.length && hp[l][0] < hp[m][0]) m = l; if (r < hp.length && hp[r][0] < hp[m][0]) m = r; if (m === c) break; var t = hp[m]; hp[m] = hp[c]; hp[c] = t; c = m; } } return top; };
    seeds.forEach(function (s, k) { key[s] = 0; push(0, s, k); });
    while (hp.length) {
      var e = popH(), a = e[1]; if (done[a]) continue; done[a] = 1; clOf[a] = e[2];
      var sd = P[seeds[e[2]]];
      LOGO.n8[a].forEach(function (b) { if (done[b]) return; var dx = P[b][0] - sd[0], dy = P[b][1] - sd[1], d = Math.sqrt(dx * dx + dy * dy); if (d < key[b]) { key[b] = d; push(d, b, e[2]); } });
    }
    for (i = 0; i < n; i++) if (clOf[i] >= 0) { var sd2 = P[seeds[clOf[i]]]; clDepth[i] = Math.round(Math.hypot(P[i][0] - sd2[0], P[i][1] - sd2[1]) / LOGO.pitch); }
    for (i = 0; i < n; i++) if (clOf[i] < 0) {   /* 씨앗 없는 조각 · 가장 가까운 씨앗 */
      var bb = 1e18, bk = 0; seeds.forEach(function (s, k) { var dx = P[i][0] - P[s][0], dy = P[i][1] - P[s][1], d = dx * dx + dy * dy; if (d < bb) { bb = d; bk = k; } });
      clOf[i] = bk; clDepth[i] = 3;
    }
    CL = seeds.map(function (s) { return { seed: s, dots: [] }; });
    for (i = 0; i < n; i++) CL[clOf[i]].dots.push(i);
  }

  /* ════════ 무대 배치 · 가로 1920×1080 / 세로 1080×1920 논리 좌표 ════════ */
  var G = {}, LAY = {};
  function resize() {
    var w = REC ? (+Q.w || 1920) : window.innerWidth, h = REC ? (+Q.h || 1080) : window.innerHeight;
    var dpr = REC ? 1 : Math.min(window.devicePixelRatio || 1, 2), cap = 2560 * 1440;
    if (w * h * dpr * dpr > cap) dpr *= Math.sqrt(cap / (w * h * dpr * dpr));
    var port = Q.o === "port" ? true : Q.o === "land" ? false : h > w * 1.05;
    var FW = port ? 1080 : 1920, FH = port ? 1920 : 1080, k = Math.min(w / FW, h / FH), ox = (w - FW * k) / 2, oy = (h - FH * k) / 2;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px";
    var L = !port ? {
      box: { x: 560, y: 46, w: 940, h: 988 },
      wm: { x: 72, y: 64, w: 210 },
      lab: { x: 72, y: 856, s: 28 }, num: { x: 66, y: 990, s: 140 }, sub: { x: 72, y: 1042, s: 28 },
      tag: { x: 1848, y: 990, s: 34 }, rule: { x: 1848, y: 1042, s: 24 },
      ttl: { x: 1710, y: 470, s1: 36, s2: 92, w: 380 }, tl: { x: 1848, y: 100, s: 30 }, st: { x: 72, y: 178, s: 20 }
    } : {
      box: { x: 50, y: 250, w: 980, h: 1240 },
      wm: { x: 64, y: 72, w: 190 },
      lab: { x: 64, y: 1676, s: 28 }, num: { x: 64, y: 1822, s: 156 }, sub: { x: 64, y: 1872, s: 28 },
      tag: { x: 1016, y: 1822, s: 34 }, rule: { x: 1016, y: 1872, s: 24 },
      ttl: { x: 540, y: 1560, s1: 34, s2: 84, w: 900 }, tl: { x: 1016, y: 110, s: 30 }, st: { x: 64, y: 172, s: 20 }
    };
    G = L; G.w = w; G.h = h; G.dpr = dpr; G.port = port; G.FW = FW; G.FH = FH; G.k = k; G.ox = ox; G.oy = oy;
    G.xL = -ox / k; G.xR = (w - ox) / k; G.yT = -oy / k; G.yB = (h - oy) / k;
    var bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9;
    LOGO.P.forEach(function (p) { bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); by0 = Math.min(by0, p[1]); by1 = Math.max(by1, p[1]); });
    var pad = LOGO.pitch * CFG.dotRatio / 2, B = L.box;
    G.S = Math.min(B.w / (bx1 - bx0 + 2 * pad), B.h / (by1 - by0 + 2 * pad));
    var mcx = (bx0 + bx1) / 2, mcy = (by0 + by1) / 2, scx = B.x + B.w / 2, scy = B.y + B.h / 2;
    G.pos = LOGO.P.map(function (p) { return [scx + (p[0] - mcx) * G.S, scy + (p[1] - mcy) * G.S]; });
    G.D = LOGO.pitch * G.S * CFG.dotRatio;
    G.cx = scx; G.cy = scy; G.hw = (bx1 - bx0) * G.S / 2; G.hh = (by1 - by0) * G.S / 2;
    G.byY = []; for (var i = 0; i < LOGO.n; i++) G.byY.push(i); G.byY.sort(function (a, b) { return G.pos[a][1] - G.pos[b][1]; });
    /* ME · to · WE 가운데 */
    var acc = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (i = 0; i < LOGO.n; i++) { var a = acc[LOGO.part[i]]; a[0] += G.pos[i][0]; a[1] += G.pos[i][1]; a[2]++; }
    G.partC = acc.map(function (a) { return [a[0] / Math.max(1, a[2]), a[1] / Math.max(1, a[2])]; });
    buildGrids(); LAY.logo = mkCanvas(); LAY.dirty = true; DIG = null;
    if (SHOW) SHOW.cache = null;
  }
  function devT(c) { c.setTransform(G.k * G.dpr, 0, 0, G.k * G.dpr, G.ox * G.dpr, G.oy * G.dpr); }
  function mkCanvas() { var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; return c; }
  function logical() { devT(cx); }
  function ident() { cx.setTransform(1, 0, 0, 1, 0, 0); }
  var PITCH = 30;
  function buildGrids() {
    ["black", "orange"].forEach(function (kind) {
      var c = mkCanvas(), g = c.getContext("2d");
      g.fillStyle = kind === "black" ? "#000" : COL.o; g.fillRect(0, 0, c.width, c.height); devT(g);
      var i0 = Math.floor(G.xL / PITCH) - 1, i1 = Math.ceil(G.xR / PITCH) + 1, j0 = Math.floor(G.yT / PITCH) - 1, j1 = Math.ceil(G.yB / PITCH) + 1;
      for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
        var on = (((i * 7919 + j * 104729) * 2654435761) >>> 0) % 1000 < 15;
        g.fillStyle = kind === "black" ? (on ? "rgba(255,126,49,0.30)" : "rgba(255,255,255,0.045)") : (on ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.16)");
        var r = on ? 1.6 : 1.1; g.fillRect(i * PITCH - r, j * PITCH - r, r * 2, r * 2);
      }
      LAY[kind] = c;
    });
  }

  /* ════════ 점 그림 · 밝기 사다리(불씨 → O100) · 하양 · 빛 ════════ */
  var SPR = null, NL = 40;
  var STOPS = [[0, [34, 12, 3]], [0.2, [78, 29, 8]], [0.45, [150, 60, 20]], [0.72, [226, 102, 38]], [1, [255, 126, 49]]];
  function ramp(b) {
    for (var i = 1; i < STOPS.length; i++) if (b <= STOPS[i][0]) { var a = STOPS[i - 1], c = STOPS[i], u = (b - a[0]) / (c[0] - a[0]); return [0, 1, 2].map(function (k) { return Math.round(a[1][k] + (c[1][k] - a[1][k]) * u); }); }
    return STOPS[STOPS.length - 1][1];
  }
  function sprites() {
    if (SPR) return SPR; SPR = { ramp: [] };
    var Z = 64;
    var mk = function (fn) { var c = document.createElement("canvas"); c.width = c.height = Z; fn(c.getContext("2d")); return c; };
    var circ = function (x, c, r) { x.fillStyle = c; x.beginPath(); x.arc(Z / 2, Z / 2, r, 0, 6.2832); x.fill(); };
    var rgb = function (a) { return "rgb(" + a[0] + "," + a[1] + "," + a[2] + ")"; };
    for (var l = 0; l < NL; l++) (function (b) {
      SPR.ramp.push(mk(function (x) {
        circ(x, rgb(ramp(b)), Z / 2);
        if (b > 0.8) { var u = (b - 0.8) / 0.2; circ(x, "rgba(255,150,62," + u + ")", Z * 0.28); circ(x, "rgba(255,216,193," + u + ")", Z * 0.12); }
      }));
    })(l / (NL - 1));
    SPR.lit = SPR.ramp[NL - 1];
    SPR.white = mk(function (x) { circ(x, "#FFF3EA", Z / 2); circ(x, "#FFFFFF", Z * 0.3); });
    var bl = function (c0, c1, c2) { var B = document.createElement("canvas"); B.width = B.height = 128; var bx = B.getContext("2d"), gr = bx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, c0); gr.addColorStop(0.3, c1); gr.addColorStop(1, c2); bx.fillStyle = gr; bx.fillRect(0, 0, 128, 128); return B; };
    SPR.bloom = bl("rgba(255,200,150,1)", "rgba(255,150,62,0.5)", "rgba(255,126,49,0)");
    SPR.wbloom = bl("rgba(255,255,255,1)", "rgba(255,235,220,0.55)", "rgba(255,178,132,0)");
    return SPR;
  }
  function sprB(b) { return sprites().ramp[Math.max(0, Math.min(NL - 1, Math.round(b * (NL - 1))))]; }
  function dot(s, x, y, sc) { var d = G.D * (sc || 1); cx.drawImage(s, x - d / 2, y - d / 2, d, d); }

  /* ════════ 상태 ════════ */
  var T = 0;
  var ST = { n: 0, target: 0, lvl: 0, mileNext: 0, hitAt: -1e4, off: false, polls: 0 };
  var lit, ign, flashT, IGN = [], FL = [], litC = 0;
  function levelOf(n) { var l = 0; for (var i = 0; i < CFG.lv.length; i++) if (n >= CFG.lv[i]) l = i + 1; return l; }
  /* 온기 · 얼룩 대신 로고 전체가 진행도만큼 고르게 달아오른다 · 스탬프 자리는 씨앗 점 하나만 O100 · 그 덩어리는 온기보다 조금만 더 밝다
     씨앗 = 먼 곳부터 고른 순서라 밝은 점은 로고 위에 고르게 흩어진 반짝임이 된다 · 1차 완성 뒤 = 전부 O100 */
  function warmB(m) { return CFG.warm[0] + (CFG.warm[1] - CFG.warm[0]) * Math.pow(cl(m / CFG.g1), CFG.warm[2]); }
  function emberB() { return warmB(litC); }
  function liftB(i, w) { var d = clDepth[i]; return d === 0 ? 1 : Math.min(0.9, w + (d === 1 ? CFG.lift[0] : CFG.lift[1])); }
  function bOf(i) { if (litC >= CFG.g1) return 1; var w = warmB(litC); return lit[i] ? liftB(i, w) : w; }
  function setLit(m) {
    lit.fill(0); litC = Math.min(m, CFG.g1);
    for (var k = 0; k < litC; k++) CL[k].dots.forEach(function (i) { lit[i] = 1; });
    LAY.dirty = true;
  }
  function renderLogo() {
    var c = LAY.logo.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, LAY.logo.width, LAY.logo.height); devT(c);
    var full = litC >= CFG.g1, d = G.D, sp = sprites(), bd = d * 3.4;
    /* 빛 번짐(캐시) · 1차 완성 전 = 씨앗 점 아래만 · 뒤 = 모든 점 */
    c.globalCompositeOperation = "lighter";
    for (var j = 0; j < LOGO.n; j++) { var hb = full ? 0.11 : lit[j] && !clDepth[j] ? 0.16 : 0; if (!hb) continue; c.globalAlpha = hb; c.drawImage(sp.bloom, G.pos[j][0] - bd / 2, G.pos[j][1] - bd / 2, bd, bd); }
    c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
    for (var i = 0; i < LOGO.n; i++) {
      var b = bOf(i), p = G.pos[i];
      c.drawImage(sprB(b), p[0] - d / 2, p[1] - d / 2, d, d);
    }
    LAY.dirty = false;
  }

  /* ════════ 입자 · 하얀 점 팡(럭키드로우 draw.js 의 spark · ringWave 문법 + 구 모양 폭죽) ════════ */
  var PMAX = 6000, pn = 0;
  var px_ = new Float32Array(PMAX), py_ = new Float32Array(PMAX), pvx = new Float32Array(PMAX), pvy = new Float32Array(PMAX);
  var plife = new Float32Array(PMAX), pmax = new Float32Array(PMAX), psz = new Float32Array(PMAX), pgr = new Float32Array(PMAX), pdr = new Float32Array(PMAX), pcol = new Uint8Array(PMAX);
  var PCOL = ["#FFFFFF", "#FFEBE0", "#FFB284", "#FF963E", "#FF7E31"];
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
    for (var c = 0; c < PCOL.length; c++) {
      cx.fillStyle = (ORANGE() && c >= 3) ? "#FFFFFF" : PCOL[c]; cx.beginPath();
      for (var i = 0; i < pn; i++) {
        if (pcol[i] !== c) continue;
        var u = plife[i] / pmax[i], r = psz[i] * (u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4);
        if (r < 0.3) continue;
        cx.moveTo(px_[i] + r, py_[i]); cx.arc(px_[i], py_[i], r, 0, 6.2832);
      }
      cx.fill();
    }
  }
  var GLOWS = [];
  function glow(x, y, size, dur, a, white) { GLOWS.push({ x: x, y: y, s: size, t0: T, dur: dur, a: a, w: !!white }); }
  function drawGlows() {
    var sp = sprites();
    for (var i = 0; i < GLOWS.length; i++) {
      var g = GLOWS[i], u = (T - g.t0) / g.dur; if (u >= 1) { GLOWS.splice(i--, 1); continue; }
      var s = g.s * (0.7 + 0.5 * EO(u)); cx.globalAlpha = g.a * (1 - u) * (1 - u);
      cx.drawImage(g.w ? sp.wbloom : sp.bloom, g.x - s / 2, g.y - s / 2, s, s);
    }
    cx.globalAlpha = 1;
  }
  /* 작은 팡 · 혜성이 닿을 때 */
  function pop(x, y, s) {
    s = s || 1;
    var n = Math.round(26 * s);
    for (var k = 0; k < n; k++) { var a = RND() * 6.2832, v = (220 + RND() * 480) * s; spark(x, y, Math.cos(a) * v, Math.sin(a) * v - 60, 0.45 + RND() * 0.5, 1.8 + RND() * 2.6, RND() < 0.62 ? 0 : RND() < 0.5 ? 1 : 3, 320, 2.7); }
    ringWave(x, y, Math.round(16 * Math.sqrt(s)), 560 * s, 2.6, 0, 0.42, 3.2);
    glow(x, y, 150 * s, 0.38, 0.95, true);
  }
  function ringWave(x, y, n, speed, size, col, life, drag) {
    for (var k = 0; k < n; k++) { var a = k / n * 6.2832; spark(x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(a) * speed, Math.sin(a) * speed, life || 1.1, size, col, 0, drag == null ? 0.9 : drag); }
  }
  /* 큰 팡 · 구 모양으로 터지는 하얀 점(럭키드로우 burst 영상의 결) · 앞쪽 점은 크고 하얗고 뒤쪽은 작고 주황 */
  function sphere(x, y, N, spd, life) {
    for (var k = 0; k < N; k++) {
      var z = RND() * 2 - 1, ph = RND() * 6.2832, s = Math.sqrt(1 - z * z), v = spd * (0.2 + 0.8 * Math.pow(RND(), 0.55));
      var size = (1.6 + 3.8 * (z + 1) / 2) * (0.75 + 0.5 * RND());
      var col = z > 0.15 ? (RND() < 0.72 ? 0 : 1) : z > -0.45 ? (RND() < 0.5 ? 1 : 2) : (RND() < 0.5 ? 2 : 3);
      spark(x, y, Math.cos(ph) * s * v, Math.sin(ph) * s * v, life * (0.55 + 0.65 * RND()), size, col, 90, 1.5);
    }
    glow(x, y, spd * 0.9, 0.7, 1, true);
    glow(x, y, spd * 1.6, 1.2, 0.5, false);
  }

  /* ════════ 무대 뒤집기 · 원점에서 퍼지는 점 파면(draw.js stageTo 와 같은 문법) ════════ */
  var STG = { base: "black", to: null };
  function stageTo(to, ox, oy, dur) { STG.to = to; STG.t0 = T; STG.dur = dur || 0.7; STG.ox = ox; STG.oy = oy; }
  function ORANGE() { if (STG.to) { var p = (T - STG.t0) / STG.dur; return p > 0.45 ? STG.to === "orange" : STG.base === "orange"; } return STG.base === "orange"; }
  function drawStage() {
    ident(); cx.globalAlpha = 1; cx.drawImage(LAY[STG.base], 0, 0);
    if (!STG.to) return;
    var p = (T - STG.t0) / STG.dur;
    if (p >= 1) { STG.base = STG.to; STG.to = null; cx.drawImage(LAY[STG.base], 0, 0); return; }
    logical();
    var band = 520, maxD = 2300, front = EIO(p) * (maxD + band);
    cx.fillStyle = STG.to === "orange" ? COL.o : "#000"; cx.beginPath();
    var sx0 = Math.floor(G.xL / PITCH) * PITCH + PITCH / 2, sy0 = Math.floor(G.yT / PITCH) * PITCH + PITCH / 2;
    for (var y = sy0; y < G.yB + PITCH; y += PITCH) for (var x = sx0; x < G.xR + PITCH; x += PITCH) {
      var dx = x - STG.ox, dy = y - STG.oy, u = cl((front - Math.sqrt(dx * dx + dy * dy)) / band);
      if (u <= 0) continue;
      var r = u * PITCH * 0.74; cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
    }
    cx.fill();
  }

  /* ════════ 빛 물결 · 로고 위를 지나가는 하얀 띠(Lv1 = 닿은 자리 둘레만 · Lv2 부터 글자 전체 · Lv5 = ME 에서 아래로) ════════ */
  var WAVES = [];
  function wave(x, y, o) { WAVES.push({ x: x, y: y, t0: T, sp: o.sp || 1000, w: o.w || 80, a: o.a || 0.8, R: o.R || 4000, down: !!o.down }); }
  function drawWaves() {
    if (!WAVES.length) return;
    var sp = sprites().white, n = LOGO.n, i, k;
    for (k = 0; k < WAVES.length; k++) { var w0 = WAVES[k]; if ((T - w0.t0) * w0.sp - w0.w > w0.R) WAVES.splice(k--, 1); }
    for (i = 0; i < n; i++) {
      var p = G.pos[i], best = 0;
      for (k = 0; k < WAVES.length; k++) {
        var W = WAVES[k], f = (T - W.t0) * W.sp, d;
        if (W.down) { var dy = p[1] - W.y; d = dy >= 0 ? dy + Math.abs(p[0] - W.x) * 0.25 : -dy * 3 + 200; }
        else { var dx = p[0] - W.x, dy2 = p[1] - W.y; d = Math.sqrt(dx * dx + dy2 * dy2); }
        if (d > W.R) continue;
        var u = 1 - Math.abs(d - f) / W.w; if (u <= 0) continue;
        var v = W.a * u * u * (1 - 0.6 * d / W.R); if (v > best) best = v;
      }
      if (best > 0.03) { cx.globalAlpha = Math.min(1, best); dot(sp, p[0], p[1]); }
    }
    cx.globalAlpha = 1;
  }

  /* ════════ 궤도(Lv3) · 기울어진 고리를 도는 점 · 뒤쪽은 로고 뒤에 어둡게 · 앞쪽은 로고 앞에 ════════ */
  var ORB = { on: false, a: 0, form: -1e4, pulses: [] }, ORBP = [];
  function buildOrbit() {
    var r = mulberry(33); ORBP = [];
    for (var i = 0; i < 520; i++) { var o = (r() + r() + r()) / 3 * 2 - 1; ORBP.push({ th: r() * 6.2832, w: 0.16 + r() * 0.05 - Math.abs(o) * 0.04, off: o, sz: 1.8 + r() * 2.4, b: 0.5 + r() * 0.5 }); }
  }
  function orbXY(th, off) {
    var R = Math.max(G.hw, G.hh * (G.port ? 0.9 : 0.62)) * (G.port ? 1.0 : 1.12) + off * 46, ry = R * 0.27, tilt = -0.2;
    var x = Math.cos(th) * R, y = Math.sin(th) * ry, z = Math.sin(th);
    return [G.cx + x * Math.cos(tilt) - y * Math.sin(tilt), G.cy + x * Math.sin(tilt) + y * Math.cos(tilt) + off * 6, z];
  }
  function stepOrbit(dt) { if (!ORB.on) return; ORBP.forEach(function (p) { p.th += p.w * dt; }); ORB.pulses = ORB.pulses.filter(function (q) { return T - q.t0 < 2.4; }); }
  function drawOrbit(front) {
    if (!ORB.on || ORB.a <= 0.01) return;
    var form = EO((T - ORB.form) / 2.2), cols = [["#FFFFFF", []], ["#FFD8C1", []], ["#FF963E", []], ["#B04D17", []]];
    for (var i = 0; i < ORBP.length; i++) {
      var p = ORBP[i], q = orbXY(p.th, p.off); if ((q[2] > 0) !== front) continue;
      var x = G.cx + (q[0] - G.cx) * form, y = G.cy + (q[1] - G.cy) * form, hot = 0;
      for (var k = 0; k < ORB.pulses.length; k++) { var P = ORB.pulses[k], dth = Math.abs(((p.th - P.th - (T - P.t0) * 2.2) % 6.2832 + 9.4248) % 6.2832 - 3.1416); hot = Math.max(hot, (1 - dth / 0.5) * (1 - (T - P.t0) / 2.4)); }
      var depth = (q[2] + 1) / 2, lvl = hot > 0.4 ? 0 : (depth * p.b > 0.55 ? 1 : depth * p.b > 0.25 ? 2 : 3);
      cols[lvl][1].push(x, y, p.sz * (0.55 + 0.8 * depth) * (1 + hot * 0.6));
    }
    cx.globalAlpha = ORB.a;
    cols.forEach(function (c) { var a = c[1]; if (!a.length) return; cx.fillStyle = c[0]; cx.beginPath(); for (var j = 0; j < a.length; j += 3) { cx.moveTo(a[j] + a[j + 2], a[j + 1]); cx.arc(a[j], a[j + 1], a[j + 2], 0, 6.2832); } cx.fill(); });
    cx.globalAlpha = 1;
  }

  /* ════════ 혜성 · 스탬프 1개 ════════ */
  var FLY = [], SCH = [];
  function targetFor(k) {
    if (k < CFG.g1) return CL[k].seed;
    var tries = 0, i;
    do { i = Math.floor(RND() * LOGO.n); tries++; } while (k >= CFG.lv[4] && LOGO.part[i] !== 0 && tries < 40);
    return i;
  }
  function isBig(k) { var m = k + 1; return CFG.lv.indexOf(m) >= 0 || (m > CFG.lv[4] && (m - CFG.lv[4]) % CFG.mile === 0); }
  function launch() {
    var k = ST.n + FLY.length, ti = targetFor(k), d = G.pos[ti], big = isBig(k), src, c;
    if (levelOf(k) >= 3 && ORB.on) {
      var p = ORBP[Math.floor(RND() * ORBP.length)], q = orbXY(p.th, p.off);
      src = [q[0], q[1]]; c = [(src[0] + d[0]) / 2 + (RND() - 0.5) * 200, Math.min(src[1], d[1]) - 120];
      ORB.pulses.push({ th: p.th, t0: T });
    } else {
      src = [Math.max(G.xL + 40, Math.min(G.xR - 40, d[0] + (RND() - 0.5) * (G.port ? 700 : 1100))), G.yB + 40];
      c = [src[0] + (d[0] - src[0]) * 0.12, d[1] + (src[1] - d[1]) * 0.42];
    }
    var dur = big ? 2.0 : 1.25 + RND() * 0.45, prev = FLY[FLY.length - 1];
    if (prev) dur = Math.max(dur, prev.t0 + prev.dur - T + 0.06);   /* 앞 혜성보다 먼저 닿지 않게(숫자는 닿는 순서대로) */
    FLY.push({ k: k, ti: ti, s: src, c: c, d: d, t0: T, dur: dur, big: big });
  }
  function bez(f, e) { var iu = 1 - e; return [iu * iu * f.s[0] + 2 * iu * e * f.c[0] + e * e * f.d[0], iu * iu * f.s[1] + 2 * iu * e * f.c[1] + e * e * f.d[1]]; }
  function fe(u) { return 0.3 * u + 0.7 * u * u; }   /* 점점 빨라지며 꽂힌다 */
  function drawFlights() {
    var sp = sprites(), D = G.D;
    for (var i = 0; i < FLY.length; i++) {
      var f = FLY[i], u = cl((T - f.t0) / f.dur), born = EO(u / 0.12), TL = f.big ? 30 : 22, gap = f.big ? 0.012 : 0.016, k = f.big ? 1.35 : 1;
      /* 꼬리 · 빛 번짐 줄기 + 점 줄(머리 쪽은 하양 · 뒤로 갈수록 주황 · 작게) */
      for (var j = TL; j >= 1; j--) {
        var uj = u - j * gap; if (uj <= 0) continue;
        var q = bez(f, fe(uj)), a = 1 - j / (TL + 1);
        if (j % 3 === 0) { cx.globalAlpha = 0.22 * a * born; var gs = D * 3.2 * k * (0.5 + 0.5 * a); cx.drawImage(sp.bloom, q[0] - gs / 2, q[1] - gs / 2, gs, gs); }
        cx.globalAlpha = a * born; dot(j < 4 ? sp.white : sprB(0.55 + 0.45 * a), q[0], q[1], (0.35 + 0.95 * a) * k);
      }
      var p = bez(f, fe(u));
      cx.globalAlpha = 0.75 * born; var bs = D * 9 * k; cx.drawImage(sp.wbloom, p[0] - bs / 2, p[1] - bs / 2, bs, bs);
      cx.globalAlpha = born; dot(sp.white, p[0], p[1], 2.0 * k);
    }
    cx.globalAlpha = 1;
  }
  function stepFlights(dt) {
    var hold = SHOW && SHOW.blocks || TLS.due;
    if (hold) SCH.forEach(function (s) { s.t += dt; });
    else while (SCH.length && SCH[0].t <= T && FLY.length < CFG.maxFly) { SCH.shift(); launch(); }
    while (FLY.length && T - FLY[0].t0 >= FLY[0].dur) impact(FLY.shift());
  }
  /* 닿음 · 숫자 +1 · 하얀 팡 · 1막 = 덩어리가 번져 켜진다 · 2막 = 단계별 빛 */
  function impact(f) {
    ST.n++; ST.hitAt = T;
    var x = f.d[0], y = f.d[1], lv = ST.lvl, quiet = SHOW && SHOW.own;
    pop(x, y, f.big ? 2.6 : lv >= 4 ? 2.1 : 1.7);
    sphere(x, y, f.big ? 200 : lv >= 4 ? 150 : 90, f.big ? 700 : lv >= 4 ? 560 : 440, lv >= 4 ? 1.3 : 1.0);
    if (f.k < CFG.g1) {
      var C = CL[f.k];
      C.dots.forEach(function (i) { lit[i] = 1; ign[i] = T + clDepth[i] * CFG.ignStep; IGN.push(i); });
      litC = f.k + 1; LAY.dirty = true;
      wave(x, y, { sp: 620, w: 60, a: 0.75, R: G.D * 13 });
    } else if (!quiet) {
      if (lv >= 5) { wave(x, y, { sp: 900, w: 70, a: 0.85, down: true, R: 1400 }); }
      else if (lv >= 2) wave(x, y, { sp: 1100, w: 80, a: 0.75, R: 1500 });
      else wave(x, y, { sp: 650, w: 64, a: 0.9, R: G.D * 15 });
    }
    var nl = levelOf(ST.n);
    if (nl > ST.lvl) { ST.lvl = nl; startShow(nl === 1 ? "complete" : "lv" + nl); }
    else if (ST.lvl >= 5 && ST.n >= ST.mileNext) { var m = ST.mileNext; ST.mileNext += CFG.mile; startShow("mile", m); }
  }
  /* 켜지는 중인 점 · 아직 차례가 아니면 불씨로 덮고 · 차례가 되면 하얗게 번쩍였다 주황으로 */
  function drawIgnite() {
    var sp = sprites(), eb = emberB();
    for (var k = 0; k < IGN.length; k++) {
      var i = IGN[k], t = T - ign[i], p = G.pos[i];
      if (t > 0.9) { IGN.splice(k--, 1); continue; }
      if (t < 0) { cx.globalAlpha = 1; dot(sprB(eb), p[0], p[1]); continue; }
      var u = t / 0.9; cx.globalAlpha = Math.pow(1 - u, 1.2); dot(sp.white, p[0], p[1]);
      if (t < 0.4) { cx.globalAlpha = 0.45 * (1 - t / 0.4); var bs = G.D * 3.4; cx.drawImage(sp.bloom, p[0] - bs / 2, p[1] - bs / 2, bs, bs); }
    }
    for (k = 0; k < FL.length; k++) {
      var j = FL[k], t2 = T - flashT[j], q = G.pos[j];
      if (t2 > 0.7) { FL.splice(k--, 1); continue; }
      if (t2 < 0) continue;
      cx.globalAlpha = Math.pow(1 - t2 / 0.7, 1.3); dot(sp.white, q[0], q[1]);
    }
    cx.globalAlpha = 1;
  }
  function flashAll(ids, delayFn) { ids.forEach(function (i) { flashT[i] = T + delayFn(i); FL.push(i); }); }
  /* 불씨의 숨 · 0~1막에서만 · 은은한 빛 한 줄기가 7.5초마다 로고 아래에서 위로 5초 동안 지나간다(아직 안 켜진 점만) */
  function drawEmberFlow() {
    if (litC >= CFG.g1) return;
    var per = 7.5, t = T % per; if (t > 5) return;
    var y0 = G.cy + G.hh + 140, y1 = G.cy - G.hh - 140, yc = y0 + (y1 - y0) * ESIO(t / 5), hb = 150, eb = emberB(), env = bell(t / 5);
    var lo = yc - hb, hi = yc + hb, A = G.byY, a = 0, b = A.length;
    while (a < b) { var m = (a + b) >> 1; if (G.pos[A[m]][1] < lo) a = m + 1; else b = m; }
    cx.globalAlpha = 1;
    for (var k = a; k < A.length; k++) {
      var i = A[k], p = G.pos[i]; if (p[1] > hi) break;
      if ((lit[i] && !clDepth[i]) || ign[i] > T) continue;
      var u = 1 - Math.abs(p[1] - yc) / hb, add = 0.2 * u * u * env;
      if (add < 0.02) continue;
      dot(sprB(bOf(i) + add), p[0], p[1]);
    }
  }

  /* ════════ 장면 · 1차 완성 · Lv2~5 · 1,000마다 · 다시 보기 ════════ */
  var SHOW = null, DIG = null;
  function startShow(kind, arg) {
    if (REC_NOSHOW) return;
    var S = { kind: kind, t0: T, arg: arg, blocks: true, own: false, fired: {} };
    S.dur = { complete: 10.5, lv2: 5.5, lv3: 6, lv4: 11.5, lv5: 7.2, mile: 7.2, tl: 15 }[kind] || 6;
    if (kind === "tl") tlSetup(S);
    if (kind === "lv4") digits();
    if (kind === "lv5" || kind === "mile") meweSetup(S);
    SHOW = S;
  }
  var REC_NOSHOW = false;
  function once(S, key, t, fn) { if (!S.fired[key] && T - S.t0 >= t) { S.fired[key] = 1; fn(); } }
  function stepShow() {
    if (!SHOW) return;
    var S = SHOW, t = T - S.t0, c = [G.cx, G.cy];
    if (S.kind === "complete") {
      S.own = t > 1.55 && t < 6.3;
      once(S, "sweep", 0, function () {
        var ip = G.pos[CL[CFG.g1 - 1].seed], mx = 1;
        var ds = G.pos.map(function (p) { var d = Math.hypot(p[0] - ip[0], p[1] - ip[1]); if (d > mx) mx = d; return d; });
        flashAll(G.byY, function (i) { return 0.15 + 1.0 * ds[i] / mx; });
      });
      once(S, "boom", 1.25, function () { sphere(c[0], c[1], 900, 1250, 3.0); ringWave(c[0], c[1], 80, 1500, 6, 0, 1.0); ringWave(c[0], c[1], 54, 1050, 8, 1, 1.2); ringWave(c[0], c[1], 40, 700, 10, 2, 1.4); stageTo("orange", c[0], c[1], 0.75); });
      once(S, "back", 5.4, function () { stageTo("black", c[0], c[1], 0.9); });
      once(S, "breath", 7.4, function () { wave(c[0], G.cy + G.hh + 60, { sp: 700, w: 160, a: 0.55, down: false, R: 2400 }); });
    } else if (S.kind === "lv2") {
      [0, 0.55, 1.1].forEach(function (d, k) { once(S, "w" + k, d, function () { wave(c[0], c[1], { sp: 950, w: 90, a: 0.9, R: 1600 }); if (!k) { sphere(c[0], c[1], 320, 700, 1.8); } }); });
      once(S, "w3", 2.6, function () { wave(c[0], c[1], { sp: 950, w: 140, a: 0.7, R: 1600 }); });
    } else if (S.kind === "lv3") {
      once(S, "o", 0, function () { sphere(c[0], c[1], 360, 800, 2.0); ORB.on = true; ORB.a = 1; ORB.form = T + 0.2; });
      once(S, "w", 0.3, function () { wave(c[0], c[1], { sp: 900, w: 90, a: 0.8, R: 1600 }); });
      once(S, "p", 2.6, function () { for (var k = 0; k < 6; k++) ORB.pulses.push({ th: k * 1.047, t0: T }); });
    } else if (S.kind === "lv4") {
      S.own = t > 0.15 && t < 8.2;
      once(S, "p", 0, function () { pop(c[0], c[1], 2); });
      once(S, "boom", 1.9, function () { sphere(c[0], c[1], 900, 1300, 3.0); ringWave(c[0], c[1], 80, 1500, 6, 0, 1.0); ringWave(c[0], c[1], 50, 1000, 8, 1, 1.2); stageTo("orange", c[0], c[1], 0.75); });
      once(S, "back", 5.7, function () { stageTo("black", c[0], c[1], 0.9); });
      once(S, "land", 8.1, function () { pop(c[0], c[1], 2.2); wave(c[0], c[1], { sp: 1000, w: 100, a: 0.8, R: 1600 }); });
    } else if (S.kind === "lv5" || S.kind === "mile") {
      meweStep(S, t);
    } else if (S.kind === "tl") {
      tlStep(S, t);
    }
    if (t >= S.dur) { SHOW = null; if (S.kind === "tl") tlEnd(); }
  }
  function drawShow() {
    if (!SHOW) return;
    var S = SHOW, t = T - S.t0, sp = sprites();
    if (S.kind === "complete" && S.own) {
      /* 오렌지 무대 · 로고는 하얀 점 · 아래에서 위로 크기 물결(draw.js 당첨 번호처럼 숨쉰다) */
      var wv = t - 1.55, intro = EO(wv / 0.3 + 0.6), cache = intro >= 1 ? whiteCache(G.pos, "wl") : null;
      if (cache) { ident(); cx.drawImage(cache, 0, 0); logical(); }
      for (var i = 0; i < LOGO.n; i++) {
        var p = G.pos[i], r = 1 + 0.16 * Math.max(0, Math.sin((G.cy + G.hh - p[1]) * 0.006 - wv * 3.0));
        if (cache && r < 1.004) continue;   /* 숨 물결 밖의 점은 캐시 그대로 */
        dot(sp.white, p[0], p[1], r * intro);
      }
    }
    if (S.kind === "complete" && t >= 6.3 && t < 7.4) {   /* 하양 → 주황으로 식는다 */
      cx.globalAlpha = 1 - ESIO((t - 6.3) / 1.1); for (var j = 0; j < LOGO.n; j++) dot(sp.white, G.pos[j][0], G.pos[j][1]); cx.globalAlpha = 1;
    }
    if (S.kind === "lv4" && S.own) drawDigits(t);
    if (S.kind === "lv5" || S.kind === "mile") meweDraw(S, t);
    if (S.kind === "tl") tlDraw(S, t);
  }
  /* Lv4 · 2026 · 로고 점이 하얀 숫자가 되었다 돌아온다 */
  function digits() {
    if (DIG) return;
    var w = G.port ? 980 : 1500, h = G.port ? 520 : 700, c = document.createElement("canvas"); c.width = w; c.height = h;
    var g = c.getContext("2d"), fs = 600; g.font = "800 " + fs + "px " + FONT; var mw = g.measureText("2026").width; fs = Math.floor(fs * Math.min(1, (w * 0.96) / mw, (h * 0.95) / (fs * 0.75)));
    g.font = "800 " + fs + "px " + FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText("2026", w / 2, h / 2 + fs * 0.04);
    var d = g.getImageData(0, 0, w, h).data, best = null, bd = 1e9;
    for (var st = 6; st <= 30; st += 0.25) {
      var pts = [];
      for (var y = st / 2; y < h; y += st) for (var x = st / 2; x < w; x += st) if (d[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 110) pts.push([x - w / 2 + G.cx, y - h / 2 + G.cy]);
      var e = Math.abs(pts.length - LOGO.n); if (e < bd && pts.length) { bd = e; best = pts; }
    }
    var ids = []; for (var i = 0; i < LOGO.n; i++) ids.push(i);
    ids.sort(function (a, b) { return (G.pos[a][0] - G.pos[b][0]) || (G.pos[a][1] - G.pos[b][1]); });
    best.sort(function (a, b) { return (a[0] - b[0]) || (a[1] - b[1]); });
    var M = best.length, tgt = new Array(LOGO.n), dl = new Float32Array(LOGO.n);
    ids.forEach(function (id, k) { var q = best[Math.min(M - 1, Math.floor(k * M / LOGO.n))]; tgt[id] = [q[0], q[1]]; dl[id] = 0.35 * k / LOGO.n + 0.12 * RND(); });
    DIG = { tgt: tgt, dl: dl };
  }
  /* 하얀 점 캐시(1차 완성 로고 · 2026 숫자) · 숨 물결이 지나가는 점만 매 프레임 덧그린다 */
  function whiteCache(P, key, sc) {
    if (LAY[key] && LAY[key].src === P) return LAY[key];
    var c = mkCanvas(), g = c.getContext("2d"), sp = sprites(), d = G.D * (sc || 1); devT(g);
    for (var i = 0; i < P.length; i++) g.drawImage(sp.white, P[i][0] - d / 2, P[i][1] - d / 2, d, d);
    c.src = P; LAY[key] = c; return c;
  }
  function drawDigits(t) {
    var sp = sprites(), n = LOGO.n;
    if (t > 2.2 && t < 6.0) {
      var cache = whiteCache(DIG.tgt, "wd", 0.92); ident(); cx.drawImage(cache, 0, 0); logical();
      for (var j = 0; j < n; j++) {
        var q2 = DIG.tgt[j], r2 = 1 + 0.22 * Math.max(0, Math.sin((q2[0] - G.cx) * 0.006 - (t - 2.2) * 3.2));
        if (r2 > 1.004) dot(sp.white, q2[0], q2[1], r2 * 0.92);
      }
      return;
    }
    for (var i = 0; i < n; i++) {
      var p = G.pos[i], q = DIG.tgt[i], go = EIO((t - 0.25 - DIG.dl[i]) / 1.4), back = EIO((t - 6.0 - DIG.dl[i]) / 1.6), u = go * (1 - back);
      var mxp = p[0] + (q[0] - p[0]) * u, myp = p[1] + (q[1] - p[1]) * u + Math.sin(Math.PI * u) * 0;
      var r = 1;
      if (t > 2.2 && t < 6.0) r *= 1 + 0.22 * Math.max(0, Math.sin((q[0] - G.cx) * 0.006 - (t - 2.2) * 3.2));
      if (u > 0.5) dot(sp.white, mxp, myp, r * 0.92);
      else { dot(sp.lit, mxp, myp); cx.globalAlpha = u * 2; dot(sp.white, mxp, myp); cx.globalAlpha = 1; }
    }
  }
  /* Lv5 · ME to WE · ME 의 빛이 to 를 지나 WE 로 흘러들고, ME 는 위에서부터 다시 켜진다 */
  function meweSetup(S) {
    var me = [], we = []; for (var i = 0; i < LOGO.n; i++) { if (LOGO.part[i] === 0) me.push(i); else if (LOGO.part[i] === 2) we.push(i); }
    var bx = function (a, b) { return (G.pos[a][0] - G.pos[b][0]) || (G.pos[a][1] - G.pos[b][1]); };
    me.sort(bx); we.sort(bx);
    S.me = me; S.we = we; S.map = me.map(function (id, k) { return we[Math.floor(k * we.length / me.length)]; });
    S.dl = me.map(function (id) { return 0.6 * (G.pos[id][1] - (G.cy - G.hh)) / (G.hh * 0.8) * 0.5 + 0.2 * RND(); });
  }
  function meweStep(S, t) {
    var c0 = G.partC[0], c2 = G.partC[2];
    once(S, "p", 0, function () { pop(c0[0], c0[1], 2); flashAll(S.me, function () { return 0; }); });
    once(S, "we", 2.35, function () { sphere(c2[0], c2[1], 520, 900, 2.4); flashAll(S.we, function (i) { return 0.4 * Math.abs(G.pos[i][0] - c2[0]) / G.hw; }); });
    once(S, "re", 3.3, function () { flashAll(S.me, function (i) { return 1.1 * (G.pos[i][1] - (G.cy - G.hh)) / (c0[1] - (G.cy - G.hh) + G.hh * 0.25); }); });
    once(S, "w", 4.8, function () { wave(c0[0], G.cy - G.hh, { sp: 900, w: 90, a: 0.7, down: true, R: 1800 }); });
  }
  function meweDraw(S, t) {
    var sp = sprites(), c1 = G.partC[1];
    for (var k = 0; k < S.me.length; k++) {
      var id = S.me[k], p = G.pos[id], q = G.pos[S.map[k]], u = cl((t - 0.45 - S.dl[k]) / 1.5);
      var dim = t > 0.45 + S.dl[k] && t < 3.3 + 1.1 * (p[1] - (G.cy - G.hh)) / (G.partC[0][1] - (G.cy - G.hh) + G.hh * 0.25);
      if (dim) { cx.globalAlpha = 1; dot(sprB(0.22), p[0], p[1]); }
      if (u > 0 && u < 1) {
        var e = EIO(u), ccx = c1[0] + (k % 7 - 3) * 14, ccy = c1[1], iu = 1 - e;
        var x = iu * iu * p[0] + 2 * iu * e * ccx + e * e * q[0], y = iu * iu * p[1] + 2 * iu * e * ccy + e * e * q[1];
        cx.globalAlpha = 1; dot(u < 0.5 ? sp.lit : sp.white, x, y, 0.9);
      }
    }
    cx.globalAlpha = 1;
  }

  /* ════════ 오늘 하루 다시 보기(타임랩스) ════════ */
  var TLS = { next: 0, due: false, show: 0 };
  function tlSetup(S) {
    var N = ST.n, m = Math.min(N, CFG.g1), r = mulberry(4242 + Math.floor(T));
    S.N = N; S.m = m; S.full = m >= CFG.g1; S.w = warmB(m);   /* 앉는 덩어리의 밝기 = 지금 화면과 같은 결(씨앗 O100 · 덩어리 은은히 · 바탕 온기) */
    /* 덩어리마다 들어오는 방향 · 거리(화면 밖) · 소용돌이로 감겨 들어온다 */
    S.ca = CL.map(function () { return r() * 6.2832; });
    S.cr = CL.map(function () { return (G.port ? 1150 : 1250) + r() * 500; });
    S.sd = G.pos.map(function (p) { return 0.3 * Math.hypot(p[0] - G.cx, p[1] - G.cy) / Math.max(G.hw, G.hh) + 0.06 * r(); });
    S.oa = G.pos.map(function () { return r() * 6.2832; });
    S.g0 = 1.6; S.Dg = Math.max(3.0, Math.min(7.5, m * 0.05)); S.e0 = S.g0 + 0.5 + S.Dg + 0.3;
    S.De = N > m ? Math.min(3.5, 1.5 + (N - m) / 800) : 0; S.tE = S.e0 + S.De; S.dur = S.tE + 2.4;
    S.ta = CL.map(function (C, k) { return k < m ? S.g0 + 0.5 + S.Dg * Math.sqrt((k + 1) / m) : 0; });
    S.landed = 0; S.extra = []; S.cnt = 0;
    var ex = Math.min(N - m, 140); for (var j = 0; j < ex; j++) S.extra.push({ t: S.e0 + S.De * Math.sqrt((j + 1) / ex), i: Math.floor(r() * LOGO.n), a: r() * 6.2832, done: false });
    ORB.a = 0;
  }
  function tlCount(S, t) {
    if (t < S.g0) return Math.round(S.N * (1 - ESIO(t / 1.2)));
    var c = 0; for (var k = 0; k < S.m; k++) if (t >= S.ta[k]) c++;
    if (S.De && t > S.e0) c = S.m + Math.round((S.N - S.m) * Math.pow(cl((t - S.e0) / S.De), 2));
    return Math.min(S.N, c);
  }
  function tlStep(S, t) {
    S.own = true;
    once(S, "blow", 0, function () { sphere(G.cx, G.cy, 240, 650, 1.3); glow(G.cx, G.cy, 900, 0.8, 0.6, false); });
    for (var k = S.landed; k < S.m; k++) {
      if (t < S.ta[k]) break;
      var sp = G.pos[CL[k].seed];
      if (S.m <= 60 || k % 3 === 0) pop(sp[0], sp[1], S.m <= 60 ? 0.9 : 0.55);
      S.landed = k + 1;
    }
    S.extra.forEach(function (e) { if (!e.done && t >= e.t) { e.done = true; var p = G.pos[e.i]; pop(p[0], p[1], 0.7); } });
    once(S, "end", S.tE, function () { sphere(G.cx, G.cy, 700, 1100, 2.6); wave(G.cx, G.cy, { sp: 1000, w: 110, a: 0.8, R: 1600 }); });
  }
  function tlSpr(S, id) { return S.full ? sprites().lit : sprB(liftB(id, S.w)); }
  function tlDraw(S, t) {
    var sp = sprites(), ghost = sprB(0.2), n = LOGO.n, D = G.D, SW = 2.2;
    /* 바탕 · 로고 자리는 불씨 윤곽으로 남는다(무엇이 다시 만들어질지 보인다) · 덩어리가 앉을수록 로고 전체가 고르게 다시 데워진다
       모여듦 동안은 캐시 세 장(불씨 윤곽 · 온기 · 앉은 덩어리)에 앉을 때만 덧그린다 · 매 프레임 그리는 것은 나는 덩어리와 번쩍임뿐 */
    var gather = t >= S.g0 && t <= S.tE;
    if (t > S.tE) { ident(); cx.drawImage(LAY.logo, 0, 0); logical(); }   /* 끝 · 지금 상태 그대로 */
    else if (gather) {
      if (!S.cache) {
        S.cache = mkCanvas(); S.warm = mkCanvas(); S.paint = mkCanvas(); S.painted = 0;
        var c0 = S.cache.getContext("2d"), c1 = S.warm.getContext("2d"), wsp = sprB(S.w); devT(c0); devT(c1);
        for (var g = 0; g < n; g++) { c0.drawImage(ghost, G.pos[g][0] - D / 2, G.pos[g][1] - D / 2, D, D); c1.drawImage(wsp, G.pos[g][0] - D / 2, G.pos[g][1] - D / 2, D, D); }
      }
      var cc = S.paint.getContext("2d"); devT(cc);
      while (S.painted < S.m && t >= S.ta[S.painted]) { CL[S.painted].dots.forEach(function (id) { cc.drawImage(tlSpr(S, id), G.pos[id][0] - D / 2, G.pos[id][1] - D / 2, D, D); }); S.painted++; }
      ident(); cx.drawImage(S.cache, 0, 0); cx.globalAlpha = ESIO(S.painted / S.m); cx.drawImage(S.warm, 0, 0); cx.globalAlpha = 1; cx.drawImage(S.paint, 0, 0); logical();
      for (var f = Math.max(0, S.painted - 60); f < S.painted; f++) {
        var wf0 = 1 - cl((t - S.ta[f]) / 0.45); if (wf0 <= 0) continue;
        cx.globalAlpha = wf0; CL[f].dots.forEach(function (id) { dot(sp.white, G.pos[id][0], G.pos[id][1]); });
      }
      cx.globalAlpha = 1;
    } else for (var i = 0; i < n; i++) {   /* 흩어지기 전 · 지금 상태가 불씨로 식는다 */
      var hp = G.pos[i];
      dot(sprB(Math.max(0.2, bOf(i) * (1 - EO((t - S.sd[i]) / 0.5)))), hp[0], hp[1]);
    }
    /* 흩어짐 · 켜져 있던 빛이 로고에서 떨어져 바깥으로 날아간다 */
    if (t < S.g0 + 0.2) {
      for (var j = 0; j < n; j++) {
        if (!lit[j]) continue;
        var u = (t - S.sd[j]) / 1.2; if (u <= 0 || u >= 1) continue;
        var e = EI(u) * 0.5 + EO(u) * 0.5, p = G.pos[j], R = 1300 * e, a = S.oa[j];
        var x = p[0] + (p[0] - G.cx) * e * 1.4 + Math.cos(a) * R * 0.5, y = p[1] + (p[1] - G.cy) * e * 1.4 + Math.sin(a) * R * 0.5;
        cx.globalAlpha = 1 - u * 0.5; dot(sprB(bOf(j)), x, y);
      }
      cx.globalAlpha = 1;
    }
    /* 모여듦 · 덩어리가 모양을 지킨 채 소용돌이로 감겨 들어와 제자리에 앉는다 */
    for (var c = 0; c < S.m; c++) {
      var fd = 1.25, v = (t - (S.ta[c] - fd)) / fd; if (v <= 0 || v >= 1 || t < S.g0) continue;
      var C = CL[c], sd = G.pos[C.seed], e2 = 0.35 * v + 0.65 * v * v, rr = S.cr[c] * (1 - e2), ang = S.ca[c] + SW * Math.pow(1 - e2, 1.5);
      var ox = Math.cos(ang) * rr, oy = Math.sin(ang) * rr;
      for (var q = 3; q >= 1; q--) {   /* 앞머리 꼬리 */
        var vq = Math.max(0, v - q * 0.035), eq = 0.35 * vq + 0.65 * vq * vq, rq = S.cr[c] * (1 - eq), aq = S.ca[c] + SW * Math.pow(1 - eq, 1.5);
        cx.globalAlpha = 0.35 * (1 - q / 4); dot(sp.lit, sd[0] + Math.cos(aq) * rq, sd[1] + Math.sin(aq) * rq, 0.8);
      }
      cx.globalAlpha = 1;
      for (var z = 0; z < C.dots.length; z++) { var id = C.dots[z], hp2 = G.pos[id]; dot(v > 0.85 ? sp.white : tlSpr(S, id), hp2[0] + ox, hp2[1] + oy); }
      cx.globalAlpha = 0.45; var bs = D * 4; cx.drawImage(sp.wbloom, sd[0] + ox - bs / 2, sd[1] + oy - bs / 2, bs, bs); cx.globalAlpha = 1;
    }
    /* 2막 몫 · 사방에서 혜성이 꽂힌다 */
    S.extra.forEach(function (e) {
      if (e.done || t < e.t - 0.7) return;
      var u = cl(1 - (e.t - t) / 0.7), p = G.pos[e.i], R = 1100, sx2 = p[0] + Math.cos(e.a) * R, sy2 = p[1] + Math.sin(e.a) * R;
      for (var j2 = 5; j2 >= 0; j2--) { var qj = fe(Math.max(0, u - j2 * 0.04)); cx.globalAlpha = (1 - j2 / 6) * 0.9; dot(j2 ? sp.lit : sp.white, sx2 + (p[0] - sx2) * qj, sy2 + (p[1] - sy2) * qj, 0.9 - j2 * 0.08); }
    });
    cx.globalAlpha = 1;
  }
  function tlEnd() { ORB.a = ORB.on ? 1 : 0; TLS.next = T + CFG.tlEvery; }
  function stepTL() {
    if (!TLS.next) TLS.next = T + CFG.tlEvery;
    if (SHOW || ST.n < CFG.tlMin) { if (!SHOW && T >= TLS.next) TLS.next = T + CFG.tlEvery; TLS.due = false; return; }
    if (T >= TLS.next) { TLS.due = true; if (!FLY.length) { TLS.due = false; startShow("tl"); } }
  }

  /* ════════ 글자 · 워드마크 · 숫자 · 다음 목표 · Lv · 규칙 한 줄 · 장면 제목 ════════ */
  var WM = {}, WMREADY = false;
  function wmLoad() {
    var src = typeof AXF_WORDMARK === "string" ? AXF_WORDMARK : "", n = 0;
    [["o", COL.o], ["w", "#FFFFFF"]].forEach(function (c) { var im = new Image(); im.onload = function () { if (++n === 2) WMREADY = true; }; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src.replace(/currentColor/g, c[1])); WM[c[0]] = im; });
  }
  function text(txt, wgt, size, col, x, y, align, maxW, a) {
    cx.globalAlpha = a == null ? 1 : a; cx.fillStyle = col; cx.font = wgt + " " + size + "px " + FONT;
    var w = cx.measureText(txt).width; if (maxW && w > maxW) { size = Math.max(12, Math.floor(size * maxW / w)); cx.font = wgt + " " + size + "px " + FONT; w = cx.measureText(txt).width; }
    cx.textAlign = align || "left"; cx.textBaseline = "alphabetic"; cx.fillText(txt, x, y); cx.globalAlpha = 1; return w;
  }
  function subLine(n, lv) {
    if (lv === 0) return "1차 완성까지 " + comma(CFG.g1 - n);
    if (lv < 5) return "Lv " + (lv + 1) + "까지 " + comma(CFG.lv[lv] - n);
    var nx = ST.mileNext || (CFG.lv[4] + CFG.mile); return comma(nx) + "까지 " + comma(nx - n);
  }
  function drawText() {
    var org = ORANGE(), S = SHOW, isTL = S && S.kind === "tl", t = S ? T - S.t0 : 0;
    if (WMREADY) { var wm = G.wm; cx.drawImage(org ? WM.w : WM.o, wm.x, wm.y, wm.w, wm.w * 179 / 497.6); }
    var n = isTL ? tlCount(S, t) : ST.n, lv = levelOf(n);
    text("오늘 모인 스탬프", 500, G.lab.s, org ? "rgba(255,255,255,0.85)" : COL.sub, G.lab.x, G.lab.y);
    var hit = isTL ? 0 : cl(1 - (T - ST.hitAt) / 0.5);
    text(comma(n), 700, G.num.s, COL.txt, G.num.x, G.num.y);
    if (hit > 0 && !org) text(comma(n), 700, G.num.s, COL.hi, G.num.x, G.num.y, "left", null, hit * 0.8);
    if (!isTL) text(subLine(n, lv), 500, G.sub.s, org ? "rgba(255,255,255,0.85)" : COL.sub, G.sub.x, G.sub.y);
    if (lv >= 1) text("Lv " + lv + " · " + CFG.names[lv], 600, G.tag.s, org ? "#FFFFFF" : COL.o, G.tag.x, G.tag.y, "right");
    /* 규칙 한 줄 · 작은 혜성 그림 */
    var R = G.rule, w = text("빛 하나 = 스탬프 하나", 500, R.s, org ? "rgba(255,255,255,0.8)" : COL.faint, R.x, R.y, "right");
    var ix = R.x - w - 22, iy = R.y - R.s * 0.36, sp = sprites();
    for (var j = 5; j >= 1; j--) { cx.globalAlpha = 0.7 * (1 - j / 6); cx.drawImage(sp.lit, ix - j * 7 - 4, iy + j * 5 - 4, 8, 8); }
    cx.globalAlpha = 1; cx.drawImage(sp.white, ix - 6, iy - 6, 12, 12);
    if (isTL) text("오늘 하루 다시 보기", 600, G.tl.s, COL.o, G.tl.x, G.tl.y, "right", null, cl(t / 0.5) * cl((S.dur - t) / 0.6));
    /* 상태 줄 · 평소에는 없다 · 데모 표시 · 연결이 끊겼을 때만 */
    var sy = G.st.y; if (DEMO) { text("DEMO · 가짜 적립", 600, G.st.s, org ? "rgba(255,255,255,0.7)" : COL.faint, G.st.x, sy); sy += 32; }
    if (ST.off) text("연결 다시 시도 중 · 마지막 값 표시", 500, G.st.s, org ? "rgba(255,255,255,0.7)" : COL.faint, G.st.x, sy);
    drawTitle();
  }
  function drawTitle() {
    var S = SHOW; if (!S || S.kind === "tl") return;
    var t = T - S.t0, a1, l1, l2;
    if (S.kind === "complete") { a1 = cl((t - 1.5) / 0.5) * cl((S.dur - 0.8 - t) / 0.8); l1 = "스탬프 " + comma(CFG.g1) + "개"; l2 = "1차 완성"; }
    else if (S.kind === "mile") { a1 = cl((t - 0.4) / 0.5) * cl((S.dur - 0.6 - t) / 0.7); l1 = "ME to WE"; l2 = comma(S.arg); }
    else { var lv = +S.kind.slice(2); a1 = cl((t - (lv === 4 ? 8.1 : 0.4)) / 0.5) * cl((S.dur - 0.6 - t) / 0.7); l1 = "Lv " + lv; l2 = CFG.names[lv]; }
    if (a1 <= 0) return;
    var Tt = G.ttl, org = ORANGE(), al = G.port ? "center" : "center";
    text(l1, 600, Tt.s1, org ? "#FFFFFF" : COL.o, Tt.x, Tt.y - Tt.s2 * 0.95, al, Tt.w, a1);
    text(l2, 700, Tt.s2, "#FFFFFF", Tt.x, Tt.y, al, Tt.w, a1);
  }

  /* ════════ 데이터 · 15초 묶음을 고르게 나눠 혜성으로 ════════ */
  function took(total) {
    if (total < ST.n + FLY.length + SCH.length) { setNow(total); return; }
    var add = total - ST.target; ST.target = total; if (add <= 0) return;
    var q = SCH.length + add;
    if (q > CFG.maxQueue) { var over = q - CFG.maxQueue; jumpBy(FLY.length + over); FLY = []; q = CFG.maxQueue; }
    var W = CFG.pollSec * CFG.spread, n = q, t0 = T; SCH = [];
    if (n <= CFG.swarmAt) for (var a = 0; a < n; a++) SCH.push({ t: t0 + (a + 0.5) * W / n });
    else { var per = Math.ceil(n / CFG.swarmAt); for (var b = 0; b < n; b++) SCH.push({ t: t0 + (Math.floor(b / per) + 0.5) * W / CFG.swarmAt + (b % per) * CFG.swarmGap }); }
  }
  function burstIn(n, win) { ST.target += n; for (var a = 0; a < n; a++) SCH.push({ t: T + 0.3 + a * win / Math.max(1, n) }); }
  function jumpBy(m) { var n = ST.n + m; ST.n = n; setLit(n); ST.lvl = levelOf(n); ORB.on = ST.lvl >= 3; ORB.a = ORB.on ? 1 : 0; mileInit(); }
  function mileInit() { ST.mileNext = CFG.lv[4] + CFG.mile * Math.max(1, Math.floor((ST.n - CFG.lv[4]) / CFG.mile) + 1); }
  function setNow(n) {
    n = Math.max(0, n);
    FLY = []; SCH = []; WAVES = []; IGN = []; FL = []; GLOWS = []; pn = 0; SHOW = null; STG.base = "black"; STG.to = null;
    ST.n = ST.target = n; ST.lvl = levelOf(n); ST.hitAt = -1e4; mileInit();
    ORB.on = ST.lvl >= 3; ORB.a = ORB.on ? 1 : 0; ORB.form = -1e4;
    setLit(n); ign.fill(-1e9); TLS.next = T + CFG.tlEvery; TLS.due = false;
  }
  /* 운영 서버 읽기 · 공개 집계 stats(관리코드 없음) · v4c 와 같은 방식 */
  var IDS = ["lg", "qz", "p4", "p2", "p5", "p3", "st", "sv"];
  function stampsOf(k) { var n = 0; IDS.forEach(function (id) { n += (+k["stamp:" + id] || 0) - (+k["unstamp:" + id] || 0); }); return Math.max(0, n); }
  function jsonp(params, done) {
    var url = window.AXF_SERVER || "";
    if (!/^https:\/\//.test(url)) { done({ ok: false, reason: "noserver" }); return; }
    var name = "axw" + Date.now().toString(36) + Math.floor(Math.random() * 1e6), sc = document.createElement("script"), fin = false;
    var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
    var timer = setTimeout(function () { end({ ok: false, reason: "timeout" }); window[name] = function () {}; }, 12000);
    function end(res) { if (fin) return; fin = true; clearTimeout(timer); try { delete window[name]; } catch (e) { window[name] = undefined; } if (sc.parentNode) sc.parentNode.removeChild(sc); done(res || { ok: false }); }
    window[name] = function (res) { end(res); };
    sc.onerror = function () { end({ ok: false, reason: "network" }); };
    sc.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + qs + "&callback=" + name + "&_=" + Date.now();
    document.head.appendChild(sc);
  }
  var POLL = { fails: 0, first: true };
  function gotTotal(total) {
    total = Math.max(0, total - (Q.base ? +Q.base : 0));
    if (POLL.first) { POLL.first = false; setNow(total); }   /* 처음 · 지금 수까지 바로(축하 장면 없음) */
    else took(total);
    save("axfWall.last", { n: total, at: Date.now() });
  }
  function poll() {
    jsonp({ action: "stats" }, function (res) {
      if (res && res.ok && res.kinds) { POLL.fails = 0; ST.off = false; ST.polls++; gotTotal(stampsOf(res.kinds)); }
      else { POLL.fails++; if (POLL.fails >= 2) ST.off = true; }   /* 끊김 · 화면은 마지막 값 그대로 */
      var wait = POLL.fails ? Math.min(60, CFG.pollSec * Math.pow(2, Math.min(POLL.fails - 1, 2))) : CFG.pollSec;
      setTimeout(poll, wait * 1000);
    });
  }
  /* 데모(?demo=1) · 서버 없이 분당 14개를 15초마다 묶어 보낸다 */
  var DM = { rate: 14, next: CFG.pollSec, paused: false, rnd: mulberry(1026) };
  function demoStep() {
    if (!DEMO || DM.paused || T < DM.next) return;
    DM.next = T + CFG.pollSec;
    var mean = DM.rate / 4, add = Math.max(0, Math.round(mean + (DM.rnd() - 0.5) * mean * 1.2));
    if (add) took(ST.target + add);
  }

  /* ════════ 입력 · 전체 화면 · 꺼짐 방지 · 시점 점프 · T · H · 가짜 적립은 ?demo=1 에서만 ════════ */
  var wake = null;
  function keepAwake() { try { if (!wake && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; w.addEventListener("release", function () { wake = null; }); }).catch(function () {}); } catch (e) {} }
  function fsToggle() {
    var d = document, de = d.documentElement;
    try { if (!(d.fullscreenElement || d.webkitFullscreenElement)) (de.requestFullscreen || de.webkitRequestFullscreen || function () {}).call(de); else (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d); } catch (e) {}
    keepAwake();
  }
  function fsSync() { body.classList.toggle("fs", !!(document.fullscreenElement || document.webkitFullscreenElement)); }
  document.addEventListener("fullscreenchange", fsSync); document.addEventListener("webkitfullscreenchange", fsSync);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) keepAwake(); });
  $("fsBtn").addEventListener("click", function (e) { e.preventDefault(); fsToggle(); });
  var ptrT = null;
  ["mousemove", "pointerdown", "touchstart"].forEach(function (ev) { window.addEventListener(ev, function () { body.classList.add("ptr"); clearTimeout(ptrT); ptrT = setTimeout(function () { body.classList.remove("ptr"); }, 6000); keepAwake(); }, { passive: true }); });
  function moment(at) { setNow(at - 3); DM.next = T + CFG.pollSec; burstIn(3, 3.2); }
  var KEYS = { "f": fsToggle, "g": function () { body.classList.toggle("hud-on"); } };
  var DKEYS = {
    "1": function () { setNow(0); }, "2": function () { setNow(37); }, "3": function () { setNow(120); },
    "4": function () { moment(CFG.g1); }, "5": function () { setNow(600); }, "6": function () { setNow(1200); },
    "7": function () { moment(CFG.lv[3]); }, "8": function () { setNow(3500); },
    "q": function () { moment(CFG.lv[1]); }, "w": function () { moment(CFG.lv[2]); }, "e": function () { moment(CFG.lv[4]); },
    "t": function () { if (!SHOW) startShow("tl"); }, "b": function () { took(ST.target + 4); }, "j": function () { took(ST.target + 40); },
    " ": function () { DM.paused = !DM.paused; }, "h": function () { body.classList.toggle("help-on"); }
  };
  window.addEventListener("keydown", function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key, f = KEYS[k] || (DEMO && DKEYS[k]); if (!f) return; f(); e.preventDefault(); });

  /* ════════ 프레임 ════════ */
  var FPS = { n: 0, t: 0, v: 0 }, HUDN = 0;
  function frame(dt) {
    T += dt;
    demoStep(); stepShow(); stepTL(); stepFlights(dt); stepParticles(dt); stepOrbit(dt);
    if (LAY.dirty) renderLogo();
    drawStage();
    logical(); drawOrbit(false);
    var own = SHOW && SHOW.own;
    if (!own) { ident(); cx.drawImage(LAY.logo, 0, 0); logical(); safe(drawEmberFlow); safe(drawIgnite); safe(drawWaves); }
    safe(drawShow);
    if (own && SHOW.kind !== "tl") safe(drawWaves);
    drawOrbit(true);
    safe(drawFlights); drawParticles(); drawGlows(); safe(drawText);
    ident();
    FPS.n++; FPS.t += dt; if (FPS.t >= 1) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
    if (body.classList.contains("hud-on") && (HUDN++ % 6 === 0)) $("hud").textContent = "fps " + FPS.v.toFixed(0) + " · D " + G.D.toFixed(1) + " · particles " + pn + "\nn " + ST.n + " · target " + ST.target + " · fly " + FLY.length + " · queued " + SCH.length + " · Lv " + ST.lvl + " · litC " + litC + "\nshow " + (SHOW ? SHOW.kind + " " + (T - SHOW.t0).toFixed(1) : "-") + " · tl in " + Math.max(0, TLS.next - T).toFixed(0) + "s" + (DEMO ? " · demo" + (DM.paused ? " paused" : "") : " · polls " + ST.polls + (ST.off ? " OFF" : ""));
  }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }

  /* ════════ 시작 ════════ */
  buildLogo(); buildClusters(CFG.g1); buildOrbit();
  lit = new Uint8Array(LOGO.n); ign = new Float32Array(LOGO.n).fill(-1e9); flashT = new Float32Array(LOGO.n).fill(-1e9);
  wmLoad(); resize();
  window.addEventListener("resize", function () { if (!REC) resize(); });
  if (!DEMO) { var last = load("axfWall.last", null); setNow(last && last.n >= 0 ? Math.max(0, +last.n || 0) : 0); }   /* 서버 응답 전 · 마지막 값으로 바로 */
  else setNow(0);
  keepAwake();
  if (!DEMO && !REC) poll();
  var fontP = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("800 40px AXP"), document.fonts.load("700 40px AXP"), document.fonts.load("600 40px AXP"), document.fonts.load("500 30px AXP")]).catch(function () {}) : Promise.resolve();
  if (!REC) {
    var lastNow = 0;
    var loop = function (now) { requestAnimationFrame(loop); var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1 / 60; lastNow = now; try { frame(dt); } catch (e) { if (window.console) console.error(e); } };
    requestAnimationFrame(loop);
  }
  /* 녹화 · 점검 훅 */
  window.__wall = {
    ready: fontP.then(function () { return new Promise(function (r) { var n = 0; (function w() { if (WMREADY || ++n > 300) r(); else setTimeout(w, 30); })(); }); }),
    step: function (dt) { frame(dt); },
    st: function () { return { n: ST.n, target: ST.target, lvl: ST.lvl, litC: litC, fly: FLY.length, queued: SCH.length, show: SHOW ? SHOW.kind : null, particles: pn, port: G.port, D: +G.D.toFixed(2), clusters: CL.length, groups: LOGO.groups, off: ST.off, polls: ST.polls, demo: DEMO }; },
    set: function (n) { setNow(n); }, moment: moment, burst: burstIn, batch: function (n) { took(ST.target + n); },
    tl: function () { startShow("tl"); }, hold: function () { DM.paused = true; }, tlNext: function (s) { TLS.next = T + s; },
    key: function (k) { var f = KEYS[k] || (DEMO && DKEYS[k]); if (f) f(); }, took: function (n) { took(n); }, cfg: CFG
  };
})();
