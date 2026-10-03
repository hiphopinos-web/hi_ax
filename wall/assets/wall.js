/* AX Festival 2026 · 1F 스탠바이미 「ME to WE 스탬프 월」 v5 「모션 그래픽」 (261003 · 사용자 승인 · 같은 날 목표 2,026 하나 · 흩어졌다 모이기 · Lv3 하나로)
 * 화면 · 워드마크(위 왼쪽) · 로고(가운데 · 점 2,026개) · 오늘 목표 2,026 진행 링 + 「목표 2,026」(가로 왼쪽 아래 · 세로 오른쪽 아래) · 점 숫자 · 「오늘 모인 스탬프」 묶음(가로 오른쪽 아래 · 세로 왼쪽 아래)
 *  0  불씨 · 로고 2,026점이 어두운 오렌지 불씨로 놓여 있고, 은은한 빛 한 줄기가 아래에서 위로 천천히 지나간다(1차 완성 전 움직임은 이것 하나)
 *  1막 모으기 · 1차 완성 목표 CFG.g1(250) · 스탬프 1개 = 혜성 1개 · 닿으면 하얀 점이 팡 · 닿은 덩어리(점 약 8개)가 번쩍인다
 *     온기 = 로고 전체가 진행도만큼 고르게 달아오른다(얼룩 없음) · 앉은 자리 = 씨앗 점 하나만 O100 · 씨앗 순서 = 먼 곳부터라 밝은 점이 고르게 흩어진다
 *  1차 완성 · 마지막 혜성이 닿으면 로고 전체가 차례로 점화 → 하얀 점 폭죽 → 무대가 오렌지로 한 번 뒤집히고 로고가 하얗게 숨쉰다(약 10초)
 *  2막 · 누적이 CFG.lv 경계를 넘을 때마다 움직임이 하나씩 열린다 · 500 물결 · 1,000 하나로(흩어졌다 모이기에 「한 점으로」가 열림) · 2,026 목표 달성(무대 오렌지 뒤집기)
 *     목표 = 2,026 하나 · 링은 0 → 2,026 · 넘으면 링은 꽉 찬 채 체크 · 「목표 2,026 초과 달성」 · 그 뒤는 숫자만 오른다(장면 없음)
 *  흩어졌다 모이기 · CFG.actEvery(단계마다 90~120초 → 40~55초)마다 5~7초 · 로고 점이 풀렸다 다시 모여 글자가 된다 · 변주 5가지(단계가 오를수록 늘고 · 커지고 · 잦아진다) · 도는 동안에도 혜성이 날아와 함께 앉는다
 *  단계마다 혜성이 없을 때도 보이는 차이(정지) · 250 로고 전부 점화 · 500 빛 번짐 짙게 + 끝나면 물결 · 1,000 씨앗 자리 하얀 별 + 끝나면 잔광 · 2,026 가장자리 흰 빛
 *  다시 보기 · CFG.tlEvery(240초)마다 로고가 흩어졌다가 오늘 모인 스탬프가 사방에서 날아들어 다시 로고가 되고 숫자가 0에서 n까지 오른다
 * 데이터 · 공개 집계 stats(관리코드 없음) 15초 폴링 · kinds 의 stamp:<8종> − unstamp:<8종> = 스탬프 수 · 실패하면 15 → 30 → 60초로 늦추고 마지막 값 유지 + 「연결 다시 시도 중」
 *        늘어난 수를 다음 15초(92%)에 고르게 나눠 혜성으로 · 몰리면 떼로 · 처음 열 때 · 새로고침 · 서버 수가 줄었을 때 = 지금 수로 바로(1차 완성 · 레벨 장면 다시 틀지 않음)
 * 주소 · ?o=land|port 방향 고정(없으면 화면 비율) · ?base=숫자 빼고 셈(비상용) · ?demo=1 서버 없이 0개부터(↑ +10 혜성 하나씩 · → +10 빨리 감기 · ↓ ← −10 · 숫자 + Enter · S 사이클 ×6 · 위 가운데 상태 줄) · 조작표 H(데모) · ?rec=1 녹화용 고정 시계 */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var p = kv.split("="); Q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
  var DEMO = Q.demo === "1", REC = Q.rec === "1";

  var CFG = {
    g1: 250,                                     /* 1차 완성 목표(스탬프 수) · Lv1 경계 */
    goal: 2026,                                  /* 오늘 목표(스탬프 수) · 링 = 이것 하나에 대한 % · 넘으면 숫자만 오른다 */
    names: ["모으기", "1차 완성", "물결", "하나로", "목표 달성"],
    pollSec: 15, spread: 0.92, swarmAt: 24, swarmGap: 0.12,   /* 서버 집계 주기(초 · 서버는 20초 캐시) · 바꾸지 않는다 */
    maxFly: 28, maxQueue: 300,
    tlEvery: 240, tlMin: 5,                      /* 「오늘 하루 다시 보기」 주기(초) · 스탬프가 이만큼은 있어야 */
    actEvery: [[90, 120], [75, 100], [60, 80], [50, 70], [40, 55]], actQuiet: 30,   /* 흩어졌다 모이기 · 간격(초 · 단계 0 모으기 ~ 4 목표 달성마다 짧아진다) · 다시 보기 앞뒤 쉼(초) */
    actAmp: [0.32, 0.6, 0.8, 0.95, 1.08],       /* 흩어지는 폭 · 1차 완성 전에는 살짝 풀렸다 묶이는 정도 · 단계가 오를수록 크게 */
    dotRatio: 1.16,                              /* 점 지름 ÷ 점 간격 · 모든 점 같은 크기 */
    warm: [0.18, 0.7, 0.45],                     /* 로고 전체 온기(밝기 사다리) · 0개 → 1차 완성 직전 · 진행도^0.45 로 고르게(초반에 빨리) 오른다 */
    lift: [0.08, 0],                             /* 스탬프가 앉은 덩어리 · 씨앗 바로 옆 · 그 바깥이 온기보다 이만큼 더 밝다(씨앗 점 하나만 O100) */
    ignStep: 0.085                               /* 덩어리 안에서 한 걸음 번지는 시간(초) */
  };
  CFG.lv = [CFG.g1, 500, 1000, CFG.goal];          /* 단계 경계 · 1차 완성 · 물결 · 하나로 · 목표 달성(이후 단계 없음) */
  var CYC = 1;                                     /* 사이클 빠르기 · 데모 S 키로 ×6(흩어졌다 모이기 · 다시 보기 주기만 · 혜성 박자는 그대로) · 운영은 늘 1 */
  function cy(s) { return s / CYC; }

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
    LOGO.rim = new Uint8Array(n); for (i = 0; i < n; i++) LOGO.rim[i] = n8[i].length < 7 ? 1 : 0;   /* 가장자리 점(이웃 7 미만) · 목표 달성 뒤 흰 테두리 빛 */
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
      box: { x: 490, y: 46, w: 940, h: 988 },
      wm: { x: 72, y: 64, w: 210 },
      ring: { x: 207, y: 861, d: 270 },
      num: { x: 1848, by: 1042, h: 100, maxW: 420, al: "right", ls: 28, ts: 32 },
      ttl: { x: 1700, y: 470, s1: 36, s2: 92, w: 400 }, tl: { x: 1848, y: 100, s: 30 }, st: { x: 72, y: 178, s: 20 }, dm: { y: [44, 236, 278, 28], w: 1240 }
    } : {
      box: { x: 50, y: 250, w: 980, h: 1240 },
      wm: { x: 64, y: 72, w: 190 },
      num: { x: 64, by: 1838, h: 110, maxW: 430, al: "left", ls: 28, ts: 32 },
      ring: { x: 890, y: 1712, d: 250, cap: "left" },
      ttl: { x: 540, y: 1560, s1: 34, s2: 84, w: 900 }, tl: { x: 1016, y: 110, s: 30 }, st: { x: 64, y: 172, s: 20 }, dm: { y: [38, 66, 200, 27], w: 1000 }
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
    buildGrids(); LAY.logo = mkCanvas(); LAY.dirty = true; DIG = null; NUMC = {};
    if (SHOW) SHOW.cache = null;
    if (SHOW && SHOW.act) SHOW.act = actSetup(SHOW.act.v, SHOW.act.big, SHOW.act.seed);
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
    SPR.star = mk(function (x) { circ(x, "#FFCFAE", Z / 2); circ(x, "#FFF3EA", Z * 0.3); });   /* 하나로 뒤 · 스탬프 씨앗 자리 = 하얀 별(정지) */
    SPR.rim = mk(function (x) { circ(x, "#FFC6A2", Z / 2); circ(x, "#FFE6D6", Z * 0.3); });    /* 목표 달성 뒤 · 가장자리 점 = 흰 테두리(정지) */
    var bl = function (c0, c1, c2) { var B = document.createElement("canvas"); B.width = B.height = 128; var bx = B.getContext("2d"), gr = bx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, c0); gr.addColorStop(0.3, c1); gr.addColorStop(1, c2); bx.fillStyle = gr; bx.fillRect(0, 0, 128, 128); return B; };
    SPR.bloom = bl("rgba(255,200,150,1)", "rgba(255,150,62,0.5)", "rgba(255,126,49,0)");
    SPR.wbloom = bl("rgba(255,255,255,1)", "rgba(255,235,220,0.55)", "rgba(255,178,132,0)");
    return SPR;
  }
  function sprB(b) { return sprites().ramp[Math.max(0, Math.min(NL - 1, Math.round(b * (NL - 1))))]; }
  function dot(s, x, y, sc) { var d = G.D * (sc || 1); cx.drawImage(s, x - d / 2, y - d / 2, d, d); }

  /* ════════ 상태 ════════ */
  var T = 0;
  var ST = { n: 0, target: 0, lvl: 0, hitAt: -1e4, off: false, polls: 0 };
  var lit, ign, flashT, IGN = [], FL = [], litC = 0;
  function levelOf(n) { var l = 0; for (var i = 0; i < CFG.lv.length; i++) if (n >= CFG.lv[i]) l = i + 1; return l; }
  /* 온기 · 얼룩 대신 로고 전체가 진행도만큼 고르게 달아오른다 · 스탬프 자리는 씨앗 점 하나만 O100 · 그 덩어리는 온기보다 조금만 더 밝다
     씨앗 = 먼 곳부터 고른 순서라 밝은 점은 로고 위에 고르게 흩어진 반짝임이 된다 · 1차 완성 뒤 = 전부 O100 */
  function warmB(m) { return CFG.warm[0] + (CFG.warm[1] - CFG.warm[0]) * Math.pow(cl(m / CFG.g1), CFG.warm[2]); }
  function emberB() { return warmB(litC); }
  function liftB(i, w) { var d = clDepth[i]; return d === 0 ? 1 : Math.min(0.9, w + (d === 1 ? CFG.lift[0] : CFG.lift[1])); }
  function bOf(i) { if (litC >= CFG.g1) return 1; var w = warmB(litC); return lit[i] ? liftB(i, w) : w; }
  /* 단계마다 혜성이 없을 때도 보이는 차이(정지 · 상시 움직임 아님) · 하나로(Lv3)부터 씨앗 자리 = 하얀 별 */
  function sprOf(i) { return ST.lvl >= 3 && clDepth[i] === 0 ? sprites().star : ST.lvl >= 4 && LOGO.rim[i] ? sprites().rim : sprB(bOf(i)); }
  function setLit(m) {
    lit.fill(0); litC = Math.min(m, CFG.g1);
    for (var k = 0; k < litC; k++) CL[k].dots.forEach(function (i) { lit[i] = 1; });
    LAY.dirty = true;
  }
  function renderLogo() {
    var c = LAY.logo.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, LAY.logo.width, LAY.logo.height); devT(c);
    var full = litC >= CFG.g1, d = G.D, sp = sprites(), bd = d * 3.4, lv = ST.lvl, fb = lv >= 2 ? 0.17 : 0.11, rb = d * 3.2;
    /* 빛 번짐(캐시) · 1차 완성 전 = 씨앗 점 아래만 · 뒤 = 모든 점(물결부터 더 짙게) · 목표 달성 뒤 = 가장자리에 흰 빛 */
    c.globalCompositeOperation = "lighter";
    for (var j = 0; j < LOGO.n; j++) { var hb = full ? fb : lit[j] && !clDepth[j] ? 0.16 : 0; if (!hb) continue; c.globalAlpha = hb; c.drawImage(sp.bloom, G.pos[j][0] - bd / 2, G.pos[j][1] - bd / 2, bd, bd); }
    if (lv >= 4) for (j = 0; j < LOGO.n; j++) { if (!LOGO.rim[j]) continue; c.globalAlpha = 0.12; c.drawImage(sp.wbloom, G.pos[j][0] - rb / 2, G.pos[j][1] - rb / 2, rb, rb); }
    c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
    for (var i = 0; i < LOGO.n; i++) {
      var p = G.pos[i];
      c.drawImage(sprOf(i), p[0] - d / 2, p[1] - d / 2, d, d);
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
  /* 잔광 · 하나로(Lv3)부터 흩어졌다 모이기가 끝나면 하얀 빛 한 줄이 로고 위를 왼쪽 위에서 오른쪽 아래로 천천히 한 번 훑는다(약 3초 · 그때만) */
  var GLINT = { t0: -1e4, dur: 3.2 };
  function drawGlint() {
    var t = T - GLINT.t0; if (t < 0 || t > GLINT.dur) return;
    var u = t / GLINT.dur, dx = 0.8, dy = 0.6, S0 = G.hw * dx + G.hh * dy, w = 150, f = -S0 - w + (2 * S0 + 2 * w) * ESIO(u), env = Math.min(1, u / 0.15, (1 - u) / 0.15);
    var o = dsp(sprites().white), K = G.k * G.dpr, ox = G.ox * G.dpr, oy = G.oy * G.dpr;
    ident();
    for (var i = 0; i < LOGO.n; i++) {
      var p = G.pos[i], v = 1 - Math.abs((p[0] - G.cx) * dx + (p[1] - G.cy) * dy - f) / w; if (v <= 0.05) continue;
      cx.globalAlpha = 0.62 * v * v * env; cx.drawImage(o.c, (p[0] * K + ox - o.h + 0.5) | 0, (p[1] * K + oy - o.h + 0.5) | 0);
    }
    cx.globalAlpha = 1; logical();
  }

  /* ════════ 흩어졌다 모이기 · 「점이 모여 하나(WE)가 된다」를 되풀이하는 숨 · CFG.actEvery(60~90초)마다 6~7초 ════════
     지금 켜진 상태(점마다 밝기) 그대로 모양만 풀렸다 모인다 · 점 크기는 그대로 · 다 모인 순간 하얀 반짝임 한 번
     변주 · 터졌다 되감기 · 흩날렸다 내려앉기 · ME가 WE로(처음부터) · 물결(500 부터) · 한 점으로(1,000 「하나로」 부터)
     단계가 오를수록 흩어지는 폭(CFG.actAmp · 1차 완성 전은 살짝)과 반짝임이 커지고 간격(CFG.actEvery)이 짧아진다 · 목표 달성 뒤에는 한 점으로 · 터졌다 되감기 위주
     도는 동안에도 혜성은 날아온다 · 제 점이 제자리 가까이 있으면 바로 앉고 · 흩어져 있으면 글자 자리에서 기다렸다가 점이 돌아올 때 함께 앉는다
     경계 혜성(250 · 500 · 1,000 · 2,026)만 끝난 뒤에 날아온다(장면이 겹치지 않게) · 다시 보기 앞뒤 CFG.actQuiet(30초) · 1차 완성 · 단계 장면 중에는 하지 않는다 */
  var ACTN = { burst: "터졌다 되감기", dust: "흩날렸다 내려앉기", mewe: "ME가 WE로", wave: "물결", one: "한 점으로" };
  var ACTALL = ["burst", "dust", "mewe", "wave", "one"];
  var ACT = { next: 0, due: false, force: "", seen: {}, bag: [], last: "", log: [], ak: -1 };
  function actPool(lv) {
    if (lv >= 4) return ["one", "burst", "one", "burst", "mewe", "wave", "dust"];
    var a = ["burst", "dust", "mewe"]; if (lv >= 2) a.push("wave"); if (lv >= 3) a.push("one"); return a;
  }
  function actGap() { var e = CFG.actEvery[Math.min(4, ST.lvl)]; return cy(e[0] + RND() * (e[1] - e[0])); }
  function actPick() {
    var pool = actPool(ST.lvl), i;
    for (i = 0; i < pool.length; i++) if (!ACT.seen[pool[i]]) return pool[i];   /* 새로 열린 변주 먼저 */
    ACT.bag = ACT.bag.filter(function (v) { return pool.indexOf(v) >= 0; });
    if (!ACT.bag.length) {
      ACT.bag = pool.slice();
      for (i = ACT.bag.length - 1; i > 0; i--) { var j = Math.floor(RND() * (i + 1)), x = ACT.bag[i]; ACT.bag[i] = ACT.bag[j]; ACT.bag[j] = x; }
    }
    if (ACT.bag[0] === ACT.last && ACT.bag.length > 1) ACT.bag.push(ACT.bag.shift());
    return ACT.bag.shift();
  }
  function stepAct() {
    if (!ACT.next) ACT.next = T + actGap();
    if (SHOW) { ACT.due = false; return; }
    if (!ACT.force && !ACT.due) {   /* 한 번 정해지면(due) 경계 혜성이 날고 있지 않을 때 바로 시작 */
      if (T < ACT.next) return;
      if (TLS.due || TLS.next - T < cy(CFG.actQuiet + 8)) { ACT.due = false; ACT.next = Math.max(ACT.next, TLS.next + 18 + cy(CFG.actQuiet)); return; }
    }
    ACT.due = true;   /* 보통 혜성은 기다리지 않는다(도는 동안 함께 날아와 앉는다) · 경계 혜성만 끝나기를 기다린다 */
    if (!FLY.some(function (f) { return f.big; })) { var v = ACT.force || actPick(); ACT.due = false; ACT.force = ""; startShow("act", v); }
  }
  function actAfter(S) {
    if (S.kind === "act") { ACT.next = actFit(T + actGap()); actLook(); }
    else { ACT.next = Math.max(ACT.next, T + (S.kind === "tl" ? cy(CFG.actQuiet + RND() * 15) : cy(20))); if (S.kind === "lv3" || S.kind === "lv4") actLook(); }
  }
  /* 다 모인 뒤 · 단계마다 하나 더(혜성이 없을 때도 보이는 차이) · 물결(Lv2) = 가운데서 물결 한 번 · 하나로(Lv3)부터 = 하얀 잔광이 천천히 훑는다 */
  function actLook() {
    if (ST.lvl >= 3) GLINT.t0 = T + 0.3;
    else if (ST.lvl >= 2) wave(G.cx, G.cy, { sp: 800, w: 120, a: 0.5, R: 1600 });
  }
  /* 다시 보기 앞뒤 쉼에 걸리면 · 앞당겨 들어갈 자리(지난 것이 끝나고 40초 이상)가 있으면 앞으로 · 없으면 다시 보기 뒤로 */
  function actFit(t) {
    var a = TLS.next - cy(CFG.actQuiet + 12), b = TLS.next + 17 + cy(CFG.actQuiet);
    if (t > a && t < b) return a >= T + cy(40) ? a : b + cy(RND() * 10);
    return t;
  }
  function aFl(z) { return z < 0 || z > 0.42 ? 0 : 0.95 * Math.pow(1 - z / 0.42, 1.5); }   /* 제자리에 닿은 점의 하얀 반짝임 */
  function actHome(A, x, y, k) {   /* 다 모인 순간 · 하얀 빛 한 번 · 단계가 높을수록 반짝임 더 */
    k = k || 1; glow(x, y, 1000 * A.a * k, 0.6, 0.42 * k, true);
    if (A.sp >= 1.3) ringWave(x, y, Math.round(30 * A.sp), 900 * A.a * k, 2.4, 0, 0.7, 1.4);
    if (A.sp >= 1.8) sphere(x, y, Math.round(130 * A.sp * k), 760 * k, 1.2);
  }
  function actSetup(v, big, seed) {
    var n = LOGO.n, lv = ST.lvl, i;
    seed = seed || 1 + Math.floor(RND() * 1e9);
    var r = mulberry(seed), F32 = function () { return new Float32Array(n); };
    var A = { v: v, big: !!big, seed: seed, n: n, X: F32(), Y: F32(), F: F32(), ta: F32(), r1: F32(), r2: F32(), r3: F32(), spr: [], hits: [],
      a: big ? 1.2 : [0.8, 0.85, 0.92, 1, 1.12][Math.min(4, lv)], m: big ? 1.2 : CFG.actAmp[Math.min(4, lv)], sp: big ? 2 : lv >= 4 ? 1.8 : lv >= 2 ? 1.3 : 1, ghost: 0.07 };
    for (i = 0; i < n; i++) { A.r1[i] = r(); A.r2[i] = r(); A.r3[i] = r(); }
    actSpr(A);
    for (i = 0; i < n; i++) A.X[i] = -1e5;   /* 첫 그림 전 · 아직 자리 모름(혜성은 기다린다) */
    ACTV[v].setup(A, F32);
    var mx = 0; for (i = 0; i < n; i++) if (A.ta[i] > mx) mx = A.ta[i];
    A.tHome = mx; A.dur = mx + 0.75;
    return A;
  }
  function actSpr(A) { A.spr = []; for (var i = 0; i < A.n; i++) A.spr.push(sprOf(i)); A.dsp = A.spr.map(dsp); }   /* 점마다 지금 밝기 그림(혜성이 앉으면 다시) */
  /* 도는 동안 혜성이 앉으면 · 밝기 그림을 다시 맞추고 · 앉은 점과 이웃이 움직이는 자리에서 하얗게 번쩍인다 */
  function actHit(A, ti) {
    actSpr(A);
    A.hits.push([ti, T]); LOGO.n8[ti].forEach(function (j) { A.hits.push([j, T + 0.06]); });
    if (A.hits.length > 600) A.hits.splice(0, A.hits.length - 600);
  }
  /* 그리기 · 로고 캐시는 처음 0.35초에 흐릿한 자국(ghost)으로 식고 다 모이면 다시 켜진다 · 점 2,026개는 매 프레임 자리만 바꿔 같은 그림(밝기 사다리)으로 */
  function actDraw(A, t) {
    var la = A.ghost + (1 - A.ghost) * Math.max(1 - cl(t / 0.35), cl((t - A.tHome) / 0.45));
    ident(); cx.globalAlpha = la; cx.drawImage(LAY.logo, 0, 0); cx.globalAlpha = 1; logical();
    var V = ACTV[A.v]; V.pos(A, t);
    if (V.under) V.under(A, t);
    /* 점 2,026개 · 화면 픽셀 크기로 줄여 둔 그림을 확대 · 축소 없이 정수 자리에 찍는다(저하 CPU 에서도 45fps 이상) */
    var X = A.X, Y = A.Y, F = A.F, ds = A.dsp, n = A.n, i, K = G.k * G.dpr, ox = G.ox * G.dpr, oy = G.oy * G.dpr, w = dsp(sprites().white), o;
    ident();
    for (i = 0; i < n; i++) if (X[i] > -9e3) { o = ds[i]; cx.drawImage(o.c, (X[i] * K + ox - o.h + 0.5) | 0, (Y[i] * K + oy - o.h + 0.5) | 0); }
    for (i = 0; i < n; i++) if (F[i] > 0.02) { cx.globalAlpha = F[i]; cx.drawImage(w.c, (X[i] * K + ox - w.h + 0.5) | 0, (Y[i] * K + oy - w.h + 0.5) | 0); }
    for (var h = 0; h < A.hits.length; h++) {   /* 도는 중에 앉은 혜성 자리 */
      var hz = (T - A.hits[h][1]) / 0.7, hi = A.hits[h][0]; if (hz >= 1) { A.hits.splice(h--, 1); continue; }
      if (hz < 0 || X[hi] < -9e3) continue;
      cx.globalAlpha = Math.pow(1 - hz, 1.3); cx.drawImage(w.c, (X[hi] * K + ox - w.h + 0.5) | 0, (Y[hi] * K + oy - w.h + 0.5) | 0);
    }
    cx.globalAlpha = 1; logical();
    if (V.over) V.over(A, t);
  }
  var DSPR = { key: "", m: null };
  function dsp(c) {   /* 점 그림 하나를 화면 픽셀 크기로 한 번 줄여 둔다(크기가 바뀌면 다시) */
    var s = G.D * G.k * G.dpr, key = s.toFixed(3);
    if (DSPR.key !== key || !DSPR.m) { DSPR.key = key; DSPR.m = new Map(); }
    var o = DSPR.m.get(c); if (o) return o;
    var z = Math.ceil(s) + 2, c2 = document.createElement("canvas"); c2.width = c2.height = z;
    c2.getContext("2d").drawImage(c, (z - s) / 2, (z - s) / 2, s, s);
    o = { c: c2, h: z / 2 }; DSPR.m.set(c, o); return o;
  }
  var ACTV = {
    /* ① 터졌다 되감기 · 잠깐 숨을 들이쉬듯 모였다가 가운데서 바깥으로 팡 · 퍼진 채 잠깐 떠 있다가 같은 길을 되감아 한꺼번에 제자리로(작은 스프링) */
    burst: {
      setup: function (A, F32) {
        var P = G.pos, M = Math.max(G.hw, G.hh), k2 = Math.min(1, A.m); A.th = F32(); A.R = F32(); A.sw = F32();   /* k2 · 폭이 작을 때는 흩어짐(제각각)도 줄여 글자 모양이 남는다 */
        for (var i = 0; i < A.n; i++) {
          var dx = P[i][0] - G.cx, dy = P[i][1] - G.cy;
          A.th[i] = Math.atan2(dy, dx) + (A.r1[i] - 0.5) * 0.4 * k2;
          A.R[i] = A.m * (30 + 190 * Math.hypot(dx, dy) / M + 90 * A.r2[i] * k2);   /* 로고가 두 배 남짓 부풀어 터진 모양 · 화면 밖으로 흩지 않는다 */
          A.sw[i] = (A.r3[i] - 0.5) * 0.5 * k2;
          A.ta[i] = 4.2 + 0.12 * A.r1[i];
        }
      },
      out: function (s) { return EO((s - 0.45) / 1.2) * (1 + 0.1 * EO((s - 1.65) / 1.6)); },
      pos: function (A, t) {
        var P = G.pos, X = A.X, Y = A.Y, F = A.F, kx = G.port ? 0.6 : 1, ky = G.port ? 1 : 0.7, out = this.out, pre = t < 0.45 ? -0.035 * ESIO(t / 0.45) : -0.035 * (1 - cl((t - 0.45) / 0.3)), mo = out(t);
        for (var i = 0; i < A.n; i++) {
          var ta = A.ta[i], tin = ta - 1.05, R = A.R[i], m;
          if (t < tin) m = mo + pre;
          else if (t < ta) m = out(tin) * (1 - Math.pow((t - tin) / 1.05, 2.2));
          else { var z = (t - ta) / 0.42; m = z < 1 ? -(9 * A.m / R) * Math.sin(Math.PI * z) * (1 - z) : 0; }
          var ang = A.th[i] + A.sw[i] * (m > 0 ? m : 0), d = R * m;
          X[i] = P[i][0] + Math.cos(ang) * d * kx; Y[i] = P[i][1] + Math.sin(ang) * d * ky; F[i] = aFl(t - ta);   /* 긴 쪽으로는 덜 퍼진다(글자 묶음 · 화면 밖) */
        }
      },
      ev: function (A, S) {
        once(S, "pop", 0.45, function () { pop(G.cx, G.cy, 1.1 * A.a * (0.45 + 0.55 * Math.min(1, A.m))); });
        once(S, "home", A.tHome - 0.1, function () { actHome(A, G.cx, G.cy); });
      }
    },
    /* ② 흩날렸다 내려앉기 · 위쪽 점부터 먼지처럼 위로 흩날려 떠오르고 · 비처럼 곧게 떨어져 아래부터 글자가 다시 생긴다 */
    dust: {
      setup: function (A, F32) {
        var P = G.pos, k2 = Math.min(1, A.m); A.rd = F32(); A.H = F32(); A.wx = F32(); A.fs = F32(); A.xf = F32(); A.yf = F32();
        for (var i = 0; i < A.n; i++) {
          var q = cl((P[i][1] - (G.cy - G.hh)) / (2 * G.hh));   /* 0 = 위 · 1 = 아래 */
          A.rd[i] = 0.2 + q * 0.9 + 0.15 * A.r1[i];
          A.H[i] = A.m * (360 + 320 * A.r2[i] * k2);
          A.wx[i] = A.m * k2 * (-60 + 200 * A.r3[i]);
          A.fs[i] = 3.3 + (1 - q) * 1.5 + 0.12 * A.r2[i];
          A.ta[i] = A.fs[i] + 0.62;
          var e = this.e(A, i, A.fs[i]); A.xf[i] = P[i][0] + e[0]; A.yf[i] = P[i][1] + e[1];
        }
        A.ord = Array.prototype.slice.call(A.ta).map(function (x, i) { return i; }).sort(function (a, b) { return A.ta[a] - A.ta[b]; }); A.lk = 0;
      },
      e: function (A, i, t) {
        var s = t - A.rd[i]; if (s <= 0) return [0, 0];
        var u = s / 1.5, e = u < 1 ? Math.pow(u, 1.7) : 1 + 0.2 * EO((s - 1.5) / 2.6);
        return [A.wx[i] * e + 14 * A.m * Math.sin(A.r1[i] * 6.2832 + e * 2.4) * e, -A.H[i] * e];
      },
      pos: function (A, t) {
        var P = G.pos, X = A.X, Y = A.Y, F = A.F;
        for (var i = 0; i < A.n; i++) {
          if (t < A.fs[i]) { var e = this.e(A, i, t); X[i] = P[i][0] + e[0]; Y[i] = P[i][1] + e[1]; F[i] = 0; continue; }
          var v = (t - A.fs[i]) / 0.62;
          if (v < 1) { Y[i] = A.yf[i] + (P[i][1] - A.yf[i]) * v * v; X[i] = A.xf[i] + (P[i][0] - A.xf[i]) * EO(v * 1.6); }
          else { X[i] = P[i][0]; Y[i] = P[i][1]; }
          F[i] = aFl(t - A.ta[i]);
        }
      },
      under: function (A, t) {   /* 떨어지는 점 · 위로 짧은 빗줄기 꼬리 */
        var P = G.pos, D = G.D, h = D / 2;
        for (var i = 0; i < A.n; i++) {
          var v = (t - A.fs[i]) / 0.62; if (v <= 0.08 || v >= 1) continue;
          for (var k = 1; k <= 2; k++) {
            var vk = v - k * 0.07; cx.globalAlpha = k === 1 ? 0.38 : 0.16;
            cx.drawImage(A.spr[i], A.xf[i] + (P[i][0] - A.xf[i]) * EO(vk * 1.6) - h, A.yf[i] + (P[i][1] - A.yf[i]) * vk * vk - h, D, D);
          }
        }
        cx.globalAlpha = 1;
      },
      ev: function (A, S, t) {
        var P = G.pos, step = A.sp >= 1.8 ? 9 : 18;
        while (A.lk < A.n && A.ta[A.ord[A.lk]] <= t) {   /* 빗방울 튐(500 부터) */
          var i = A.ord[A.lk];
          if (A.sp >= 1.3 && A.lk % step === 0) for (var k = 0; k < 2; k++) spark(P[i][0], P[i][1], (RND() - 0.5) * 220, -110 - RND() * 170, 0.4 + RND() * 0.2, 1.4 + RND(), RND() < 0.7 ? 0 : 1, 700, 1.2);
          A.lk++;
        }
        once(S, "home", A.tHome - 0.1, function () { actHome(A, G.cx, G.cy - G.hh * 0.4, 0.8); });
      }
    },
    /* ③ ME가 WE로 · ME 글자의 점이 아래부터 풀려 to 를 지나 WE 로 흘러가 WE 를 촘촘히 채우고 · 같은 길로 돌아와 위부터 다시 ME 가 된다 */
    mewe: {
      setup: function (A, F32) {
        var P = G.pos, me = [], we = [], i;
        A.mv = new Uint8Array(A.n); A.tx = F32(); A.ty = F32(); A.qx = F32(); A.qy = F32(); A.l0 = F32(); A.r0 = F32();
        for (i = 0; i < A.n; i++) { A.ta[i] = -1e4; if (LOGO.part[i] === 0) me.push(i); else if (LOGO.part[i] === 2) we.push(i); }
        var bx = function (a, b) { return (P[a][0] - P[b][0]) || (P[a][1] - P[b][1]); };
        me.sort(bx); we.sort(bx);
        var y0 = 1e9, y1 = -1e9; me.forEach(function (id) { y0 = Math.min(y0, P[id][1]); y1 = Math.max(y1, P[id][1]); });
        var c1 = G.partC[1], hp = LOGO.pitch * G.S * 0.5;
        me.forEach(function (id, k) {
          var w = we[Math.floor(k * we.length / me.length)], q = (y1 - P[id][1]) / Math.max(1, y1 - y0);   /* 0 = ME 아래 · 1 = 위 */
          A.mv[id] = 1; A.tx[id] = P[w][0] + hp; A.ty[id] = P[w][1] + hp;   /* WE 점 사이에 앉아 WE 가 촘촘해진다 */
          A.qx[id] = c1[0] + (A.r3[id] - 0.5) * G.hw * 0.5; A.qy[id] = c1[1];
          A.l0[id] = 0.3 + q * 1.2 + 0.1 * A.r1[id]; A.r0[id] = 3.5 + (1 - q) * 1.2 + 0.1 * A.r2[id];
          A.ta[id] = A.r0[id] + 1.05;
          var arr = A.l0[id] + 1.05; if (A.ta[w] < 0 || arr < A.ta[w]) A.ta[w] = arr;
        });
      },
      pos: function (A, t) {
        var P = G.pos, X = A.X, Y = A.Y, F = A.F;
        for (var i = 0; i < A.n; i++) {
          var x = P[i][0], y = P[i][1];
          if (A.mv[i]) {
            var e = -1, fx, fy, tx, ty;
            if (t >= A.l0[i] && t < A.r0[i]) { e = EIO((t - A.l0[i]) / 1.05); fx = x; fy = y; tx = A.tx[i]; ty = A.ty[i]; }
            else if (t >= A.r0[i] && t < A.ta[i]) { e = EIO((t - A.r0[i]) / 1.05); fx = A.tx[i]; fy = A.ty[i]; tx = x; ty = y; }
            if (e >= 0) { var iu = 1 - e; x = iu * iu * fx + 2 * iu * e * A.qx[i] + e * e * tx; y = iu * iu * fy + 2 * iu * e * A.qy[i] + e * e * ty; }
          }
          X[i] = x; Y[i] = y; F[i] = aFl(t - A.ta[i]);
        }
      },
      ev: function (A, S) {
        once(S, "we", 2.75, function () { var p = G.partC[2]; glow(p[0], p[1], 900 * A.a, 0.7, 0.5, true); if (A.sp >= 1.3) sphere(p[0], p[1], Math.round(110 * A.sp), 560, 1.0); });
        once(S, "home", A.tHome - 0.05, function () { var p = G.partC[0]; actHome(A, p[0], p[1], 0.8); });
      }
    },
    /* ④ 물결 · 왼쪽에서 오른쪽으로 물결이 지나가며 점이 위로 흩어져 한 바퀴 구르고 · 뒤따르는 물결이 다시 묶는다 */
    wave: {
      setup: function (A, F32) {
        var P = G.pos, x0 = G.cx - G.hw, w = 2 * G.hw; A.dl = F32(); A.vx = F32(); A.vy = F32(); A.lr = F32();
        for (var i = 0; i < A.n; i++) {
          A.dl[i] = 0.15 + (P[i][0] - x0) / w * 2.8 + 0.1 * A.r1[i];
          A.vx[i] = A.m * (20 + 70 * A.r2[i]); A.vy[i] = -A.m * (80 + 170 * A.r3[i]); A.lr[i] = A.m * (22 + 26 * A.r1[i]);
          A.ta[i] = A.dl[i] + 2.05;
        }
      },
      pos: function (A, t) {
        var P = G.pos, X = A.X, Y = A.Y, F = A.F;
        for (var i = 0; i < A.n; i++) {
          var s = t - A.dl[i], x = P[i][0], y = P[i][1];
          if (s > 0 && s < 2.05) {
            var m = s < 0.5 ? EO(s / 0.5) : s < 1.45 ? 1 + 0.1 * (s - 0.5) / 0.95 : 1.1 * (1 - Math.pow((s - 1.45) / 0.6, 2.2)), ph = 6.2832 * ESIO(s / 2.05);
            x += m * A.vx[i] + A.lr[i] * Math.sin(ph); y += m * A.vy[i] - A.lr[i] * (1 - Math.cos(ph)) * 0.5;
          } else if (s >= 2.05) { var z = (s - 2.05) / 0.4; if (z < 1) y += 7 * A.m * Math.sin(Math.PI * z) * (1 - z); }
          X[i] = x; Y[i] = y; F[i] = aFl(t - A.ta[i]);
        }
      },
      ev: function (A, S) { once(S, "home", A.tHome - 0.1, function () { actHome(A, G.cx + G.hw * 0.5, G.cy, 0.8); }); }
    },
    /* ⑤ 한 점으로(하나로) · 모든 점이 소용돌이로 빨려 들어가 가운데 하나의 빛이 되고 · 하얀 팡과 함께 다시 제자리로 퍼져 글자가 된다 */
    one: {
      setup: function (A, F32) {
        var P = G.pos; A.tc = A.big ? 2.2 : 1.9; A.tb = A.tc + (A.big ? 1.0 : 0.65); A.r0 = F32(); A.th = F32(); A.ts = F32(); A.sw = F32(); A.od = F32();
        for (var i = 0; i < A.n; i++) {
          var dx = P[i][0] - G.cx, dy = P[i][1] - G.cy;
          A.r0[i] = Math.hypot(dx, dy); A.th[i] = Math.atan2(dy, dx); A.ts[i] = 0.15 + 0.45 * A.r1[i]; A.sw[i] = 1.0 + 0.5 * A.r2[i];
          A.od[i] = A.tb + 0.06 * A.r3[i]; A.ta[i] = A.od[i] + 0.85;
        }
      },
      pos: function (A, t) {
        var X = A.X, Y = A.Y, F = A.F, P = G.pos;
        for (var i = 0; i < A.n; i++) {
          var r, ang;
          if (t < A.tc) { var e = Math.pow(cl((t - A.ts[i]) / (A.tc - A.ts[i])), 2.2); r = A.r0[i] * (1 - e); ang = A.th[i] + A.sw[i] * e; }
          else if (t < A.od[i]) { X[i] = -1e5; Y[i] = 0; F[i] = 0; continue; }
          else if (t < A.ta[i]) { var v = (t - A.od[i]) / 0.85; r = A.r0[i] * EOB(v); ang = A.th[i] - 0.35 * (1 - EO(v)); }
          else { X[i] = P[i][0]; Y[i] = P[i][1]; F[i] = aFl(t - A.ta[i]); continue; }
          X[i] = G.cx + Math.cos(ang) * r; Y[i] = G.cy + Math.sin(ang) * r; F[i] = 0;
        }
      },
      over: function (A, t) {   /* 가운데 하나의 빛 · 모이는 동안 커지고 터지면 사라진다(맥박 없음) */
        var t0 = A.tc - 0.5; if (t < t0 || t > A.tb + 0.3) return;
        var k = EO((t - t0) / (A.tb - t0)), f = 1 - cl((t - A.tb) / 0.3), s = G.D * (A.big ? 18 : 12) * (0.45 + 0.55 * k), sp = sprites();
        cx.globalAlpha = 0.95 * f * cl((t - t0) / 0.3); cx.drawImage(sp.wbloom, G.cx - s / 2, G.cy - s / 2, s, s);
        cx.globalAlpha = f; dot(sp.white, G.cx, G.cy); cx.globalAlpha = 1;
      },
      ev: function (A, S) {
        once(S, "burst", A.tb, function () { pop(G.cx, G.cy, 1.5 * A.a); sphere(G.cx, G.cy, Math.round(240 * A.sp), 900 * A.a, 1.3); });
        once(S, "home", A.tHome - 0.1, function () { actHome(A, G.cx, G.cy, 0.7); });
      }
    }
  };

  /* ════════ 혜성 · 스탬프 1개 ════════ */
  var FLY = [], SCH = [];
  function targetFor(k) {
    if (k < CFG.g1) return CL[k].seed;
    return Math.floor(RND() * LOGO.n);
  }
  function isBig(k) { return CFG.lv.indexOf(k + 1) >= 0; }
  function launch() {
    var k = ST.n + FLY.length, ti = targetFor(k), d = G.pos[ti], big = isBig(k);
    var src = [Math.max(G.xL + 40, Math.min(G.xR - 40, d[0] + (RND() - 0.5) * (G.port ? 700 : 1100))), G.yB + 40];
    var c = [src[0] + (d[0] - src[0]) * 0.12, d[1] + (src[1] - d[1]) * 0.42];
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
      var hv = T - f.t0 - f.dur, tf = hv > 0 ? 1 - cl(hv / 0.35) : 1;   /* 글자 자리에 닿아 점이 돌아오기를 기다리는 중 · 꼬리는 걷히고 머리만 조용히 */
      /* 꼬리 · 빛 번짐 줄기 + 점 줄(머리 쪽은 하양 · 뒤로 갈수록 주황 · 작게) */
      for (var j = TL; j >= 1 && tf > 0; j--) {
        var uj = u - j * gap; if (uj <= 0) continue;
        var q = bez(f, fe(uj)), a = (1 - j / (TL + 1)) * tf;
        if (j % 3 === 0) { cx.globalAlpha = 0.22 * a * born; var gs = D * 3.2 * k * (0.5 + 0.5 * a); cx.drawImage(sp.bloom, q[0] - gs / 2, q[1] - gs / 2, gs, gs); }
        cx.globalAlpha = a * born; dot(j < 4 ? sp.white : sprB(0.55 + 0.45 * a), q[0], q[1], (0.35 + 0.95 * a) * k);
      }
      var p = bez(f, fe(u)), hk = 0.55 + 0.45 * tf;
      cx.globalAlpha = 0.75 * born * hk; var bs = D * 9 * k * hk; cx.drawImage(sp.wbloom, p[0] - bs / 2, p[1] - bs / 2, bs, bs);
      cx.globalAlpha = born; dot(sp.white, p[0], p[1], 2.0 * k * (0.6 + 0.4 * tf));
    }
    cx.globalAlpha = 1;
  }
  /* 흩어졌다 모이기는 혜성을 막지 않는다(blocks 없음) · 경계 혜성만 장면이 끝난 뒤에 */
  function stepFlights(dt) {
    var hold = SHOW && SHOW.blocks || TLS.due || (SHOW && SCH.length && isBig(ST.n + FLY.length));
    if (hold) SCH.forEach(function (s) { s.t += dt; });
    else while (SCH.length && SCH[0].t <= T && FLY.length < CFG.maxFly) { SCH.shift(); launch(); }
    while (FLY.length && T - FLY[0].t0 >= FLY[0].dur && canLand(FLY[0]) && (T - FLY[0].t0 - FLY[0].dur < 0.05 || T - ST.hitAt > 0.14)) impact(FLY.shift());   /* 기다리던 혜성은 한꺼번에 말고 0.14초씩 차례로 */
  }
  /* 흩어졌다 모이기 중 · 제 점이 제자리 가까이(점 1.5개 안) 있으면 앉고 · 아니면 글자 자리에서 기다린다(숫자는 닿는 순서대로) */
  function canLand(f) {
    var A = SHOW && SHOW.act; if (!A || SHOW.kind !== "act") return true;
    var i = f.ti; if (A.X[i] < -9e3) return false;
    return Math.abs(A.X[i] - G.pos[i][0]) + Math.abs(A.Y[i] - G.pos[i][1]) < G.D * 1.5;
  }
  /* 닿음 · 숫자 +1 · 하얀 팡 · 1막 = 덩어리가 번져 켜진다 · 2막 = 단계별 빛 */
  function impact(f) {
    ST.n++; ST.hitAt = T;
    var x = f.d[0], y = f.d[1], lv = ST.lvl, quiet = SHOW && SHOW.own, A = SHOW && SHOW.kind === "act" ? SHOW.act : null, ka = A ? 0.7 : 1;   /* 도는 중에 앉으면 팡을 조금 작게(어수선하지 않게) */
    pop(x, y, (f.big ? 2.6 : lv >= 4 ? 2.1 : 1.7) * ka);
    sphere(x, y, Math.round((f.big ? 200 : lv >= 4 ? 150 : 90) * ka), f.big ? 700 : lv >= 4 ? 560 : 440, lv >= 4 ? 1.3 : 1.0);
    if (f.k < CFG.g1) {
      var C = CL[f.k];
      C.dots.forEach(function (i) { lit[i] = 1; ign[i] = T + clDepth[i] * CFG.ignStep; IGN.push(i); });
      litC = f.k + 1; LAY.dirty = true;
      wave(x, y, { sp: 620, w: 60, a: 0.75, R: G.D * 13 });
    } else if (!quiet) {
      if (lv >= 2) wave(x, y, { sp: 1100, w: 80, a: 0.75, R: 1500 });
      else wave(x, y, { sp: 650, w: 64, a: 0.9, R: G.D * 15 });
    }
    if (A) actHit(A, f.ti);
    var nl = levelOf(ST.n);
    if (nl > ST.lvl) { ST.lvl = nl; LAY.dirty = true; startShow(nl === 1 ? "complete" : "lv" + nl); }
    if (FF.at && ST.n >= FF.at) { FF.at = 0; if (ST.target > ST.n) ffRun(); }   /* 데모 빨리 감기 · 경계 혜성이 앉은 뒤 남은 몫은 바로 */
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

  /* ════════ 장면 · 1차 완성 · 물결 · 하나로 · 목표 달성 · 흩어졌다 모이기 · 다시 보기 ════════ */
  var SHOW = null, DIG = null;
  function startShow(kind, arg) {
    if (REC_NOSHOW) return;
    var S = { kind: kind, t0: T, arg: arg, blocks: kind !== "act", own: false, fired: {} };   /* 흩어졌다 모이기만 혜성을 막지 않는다 */
    S.dur = { complete: 10.5, lv2: 5.5, lv4: 12, tl: 15 }[kind] || 6;
    if (kind === "tl") tlSetup(S);
    if (kind === "lv4") digits();
    if (kind === "act" || kind === "lv3") {   /* 하나로(Lv3) = 「한 점으로」를 처음 크게 한 번 */
      S.act = actSetup(kind === "act" ? arg : "one", kind === "lv3"); S.own = true; S.dur = S.act.dur + (kind === "lv3" ? 0.6 : 0);
      ACT.seen[S.act.v] = 1; ACT.last = S.act.v;
      if (DEMO && kind === "act" && T > SC.until - 1.5) note("흩어졌다 모이기 · " + ACTN[S.act.v]);
    }
    if (ACT.log.length < 400) ACT.log.push([kind, Math.round(T * 10) / 10, kind === "act" ? S.act.v : ""]);
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
    } else if (S.act) {
      S.own = true; ACTV[S.act.v].ev(S.act, S, t);
    } else if (S.kind === "lv4") {
      S.own = t > 0.15 && t < 8.2;
      once(S, "p", 0, function () { pop(c[0], c[1], 2); });
      once(S, "boom", 1.9, function () { sphere(c[0], c[1], 900, 1300, 3.0); ringWave(c[0], c[1], 80, 1500, 6, 0, 1.0); ringWave(c[0], c[1], 50, 1000, 8, 1, 1.2); stageTo("orange", c[0], c[1], 0.75); });
      once(S, "back", 5.7, function () { stageTo("black", c[0], c[1], 0.9); });
      once(S, "land", 8.1, function () { pop(c[0], c[1], 2.2); wave(c[0], c[1], { sp: 1000, w: 100, a: 0.8, R: 1600 }); });
      once(S, "joy1", 8.6, function () { var p = G.partC[0]; sphere(p[0], p[1], 220, 650, 1.3); });   /* 목표 달성 · 기쁨의 팡 두 번 */
      once(S, "joy2", 9.15, function () { var p = G.partC[2]; sphere(p[0], p[1], 220, 650, 1.3); });
    } else if (S.kind === "tl") {
      tlStep(S, t);
    }
    if (t >= S.dur) { SHOW = null; if (S.kind === "tl") tlEnd(); actAfter(S); }
  }
  function drawShow() {
    if (!SHOW) return;
    var S = SHOW, t = T - S.t0, sp = sprites();
    if (S.act) actDraw(S.act, t);
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
  function tlEnd() { TLS.next = T + cy(CFG.tlEvery); }
  function stepTL() {
    if (!TLS.next) TLS.next = T + cy(CFG.tlEvery);
    if (SHOW || ST.n < CFG.tlMin) { if (!SHOW && T >= TLS.next) TLS.next = T + cy(CFG.tlEvery); TLS.due = false; return; }
    if (T >= TLS.next) { TLS.due = true; if (!FLY.length) { TLS.due = false; startShow("tl"); } }
  }

  /* ════════ 글자 · 워드마크 · 숫자 · 다음 목표 · Lv · 규칙 한 줄 · 장면 제목 ════════ */
  var WM = {}, WMREADY = false;
  function wmLoad() {
    var src = typeof AXF_WORDMARK === "string" ? AXF_WORDMARK : "", n = 0;
    [["o", COL.o], ["w", "#FFFFFF"]].forEach(function (c) { var im = new Image(); im.onload = function () { if (++n === 2) WMREADY = true; }; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src.replace(/currentColor/g, c[1])); WM[c[0]] = im; });
  }
  var AM = 1;   /* 묶음 투명도 · 큰 장면 동안 링 묶음 · 숫자 묶음을 숨길 때만 1 이 아니다(글자 · 점 글자 · 링 모두 곱한다) */
  function text(txt, wgt, size, col, x, y, align, maxW, a) {
    cx.globalAlpha = (a == null ? 1 : a) * AM; cx.fillStyle = col; cx.font = wgt + " " + size + "px " + FONT;
    var w = cx.measureText(txt).width; if (maxW && w > maxW) { size = Math.max(12, Math.floor(size * maxW / w)); cx.font = wgt + " " + size + "px " + FONT; w = cx.measureText(txt).width; }
    cx.textAlign = align || "left"; cx.textBaseline = "alphabetic"; cx.fillText(txt, x, y); cx.globalAlpha = 1; return w;
  }
  /* ════════ 점 숫자 · 디자인 시안/도트 글자/글자표.json 의 숫자(5×5 점 · 이웃 25% 겹침) · 쉼표는 이 화면용(바닥 점 + 아래 꼬리 점) ════════
     0 만 사이니지 전용 = 사선 없는 둥근 고리(261003 사용자 · 글자표의 0 은 가운데 사선) · 1~9 는 글자표 그대로
     자리(오른쪽부터 셈)마다 글자를 기억해 바뀐 자리만 바뀐다 · 글자 그림은 자리 글자 × 색 × 크기별 오프스크린 캐시 */
  var DGT = { "0": [".XXX.", "X...X", "X...X", "X...X", ".XXX."], "1": ["..X..", ".XX..", "..X..", "..X..", ".XXX."], "2": [".XXX.", "X...X", "...X.", "..X..", "XXXXX"], "3": ["XXXX.", "....X", ".XXX.", "....X", "XXXX."], "4": ["X...X", "X...X", "XXXXX", "....X", "....X"], "5": ["XXXXX", "X....", "XXXX.", "....X", "XXXX."], "6": [".XXX.", "X....", "XXXX.", "X...X", ".XXX."], "7": ["XXXXX", "....X", "...X.", "..X..", "..X.."], "8": [".XXX.", "X...X", ".XXX.", "X...X", ".XXX."], "9": [".XXX.", "X...X", ".XXXX", "....X", ".XXX."] };
  var DGP = { PY: 0.9715, D: 1.3081, LG: 0.571 }; DGP.H = 4 * DGP.PY + DGP.D;
  var NUMC = {}, NUM = { s: "", slot: [], reset: true };
  function dgW(ch) { return ch === "," ? DGP.D : 4 + DGP.D; }
  function dgLayout(s) { var x = 0, xs = []; for (var i = 0; i < s.length; i++) { if (i) x += DGP.LG; xs.push(x); x += dgW(s.charAt(i)); } return { xs: xs, w: x }; }
  function dgDots(ch) {
    if (ch === ",") return [[0, 4 * DGP.PY, 1], [-0.2, 4 * DGP.PY + 0.82, 0.74]];
    var rows = DGT[ch], out = []; if (!rows) return out;
    for (var r = 0; r < 5; r++) for (var k = 0; k < 5; k++) if (rows[r].charAt(k) === "X") out.push([k, r * DGP.PY, 1]);
    return out;
  }
  function dgSprite(ch, col, u) {
    var sc = G.k * G.dpr, key = ch + "|" + col + "|" + u.toFixed(3); if (NUMC[key]) return NUMC[key];
    var m = 0.6, w = (dgW(ch) + 2 * m) * u, h = (DGP.H + 2 * m) * u, c = document.createElement("canvas");
    c.width = Math.ceil(w * sc); c.height = Math.ceil(h * sc);
    var g = c.getContext("2d"); g.scale(sc, sc); g.fillStyle = col; g.beginPath();
    dgDots(ch).forEach(function (q) { var r = DGP.D / 2 * q[2] * u, x = (m + q[0] + DGP.D / 2) * u, y = (m + q[1] + DGP.D / 2) * u; g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.2832); });
    g.fill();
    return (NUMC[key] = { c: c, m: m * u, w: c.width / sc, h: c.height / sc });
  }
  function dgBlit(ch, col, u, x, y, a, s) {
    a *= AM; if (a <= 0.01) return; var sp = dgSprite(ch, col, u), k = s || 1, gw = dgW(ch) * u, gh = DGP.H * u;
    var cxp = x + gw / 2, cyp = y + gh / 2;
    cx.globalAlpha = Math.min(1, a); cx.drawImage(sp.c, cxp - (gw / 2 + sp.m) * k, cyp - (gh / 2 + sp.m) * k, sp.w * k, sp.h * k); cx.globalAlpha = 1;
  }
  /* n 을 그리고 숫자 윗변 y 를 돌려준다 · 다시 보기 · 시점 점프 = 바로 바꿈(깜박임 없음) · 평소 = 바뀐 자리만 새 글자가 주황에서 하양으로 들어앉는다 */
  function drawNum(n, instant, org) {
    var N = G.num, s = comma(n), u = Math.min(N.h / DGP.H, N.maxW / dgLayout("8,888").w), gh = DGP.H * u;
    var y = N.by - N.ls - 22 - gh, i;
    if (NUM.reset) { instant = true; NUM.reset = false; }
    if (s !== NUM.s) {
      for (i = 0; i < s.length; i++) {
        var a = s.charAt(s.length - 1 - i), sl = NUM.slot[i] || (NUM.slot[i] = { ch: "", prev: "", t0: -1e4 });
        if (a !== sl.ch) { sl.prev = instant ? "" : sl.ch; sl.ch = a; sl.t0 = instant ? -1e4 : T; }
      }
      NUM.slot.length = s.length; NUM.s = s;
    }
    var L = dgLayout(s), x0 = N.al === "right" ? N.x - L.w * u : N.x;
    for (i = 0; i < s.length; i++) {
      var sl2 = NUM.slot[s.length - 1 - i], x = x0 + L.xs[i] * u, e = (T - sl2.t0) / 0.6;
      if (e >= 1) { dgBlit(sl2.ch, "#FFFFFF", u, x, y, 1); continue; }
      if (sl2.prev) dgBlit(sl2.prev, "#FFFFFF", u, x, y, 1 - cl(e / 0.3), 1 - 0.12 * EO(e / 0.3));
      var inA = EO(e / 0.3), sz = 1 + 0.14 * (1 - EOB(e / 0.55));
      dgBlit(sl2.ch, "#FFFFFF", u, x, y, inA, sz);
      if (!org) dgBlit(sl2.ch, COL.hi, u, x, y, inA * Math.pow(1 - cl(e), 1.4), sz);
    }
    return y;
  }
  /* ════════ 진행 링 · 오늘 목표 CFG.goal(2,026) 하나에 대한 %(도넛) · 트랙 어두운 회색 + O100 호 + 둥근 끝 ════════
     목표를 채우면 작은 팡과 함께 가운데 「n%」가 체크(꺾인 흰 선 하나)로 바뀌고 · 그 뒤로는 꽉 찬 링 그대로(숫자만 오른다) */
  var RING = { v: 0, from: 0, to: 0, t0: -1e4, tl: false, init: false, doneAt: 1e9 };
  function ringStep(n, isTL) {
    var p = cl(n / CFG.goal);
    if (isTL !== RING.tl) { RING.tl = isTL; RING.init = false; }
    if (isTL) { RING.v = p; return p; }                                              /* 다시 보기 · 숫자와 함께 바로 따라간다 */
    if (!RING.init) { RING.init = true; RING.v = RING.from = RING.to = p; RING.t0 = -1e4; RING.doneAt = p >= 1 ? -1e4 : 1e9; return p; }   /* 첫 로드 · 점프 */
    if (p !== RING.to) { RING.from = RING.v; RING.to = p; RING.t0 = T; }
    RING.v = RING.from + (RING.to - RING.from) * EO((T - RING.t0) / 0.55);
    if (RING.v >= 0.9999 && RING.doneAt > T) { RING.doneAt = T; var R = G.ring, r = R.d / 2 - R.d * 0.095; pop(R.x, R.y - r, 0.6); }
    return RING.v;
  }
  function drawRing(n, isTL, org, frozen) {
    var v = frozen ? RING.v : ringStep(n, isTL), R = G.ring, d = R.d, lw = d * 0.19, r = (d - lw) / 2, done = v >= 0.9999;
    cx.globalAlpha = AM; cx.lineWidth = lw; cx.strokeStyle = org ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.16)";
    cx.beginPath(); cx.arc(R.x, R.y, r, 0, 6.2832); cx.stroke();
    if (v > 0.004) { cx.lineCap = "round"; cx.strokeStyle = org ? "#FFFFFF" : COL.o; cx.beginPath(); cx.arc(R.x, R.y, r, -1.5708, -1.5708 + 6.2832 * v); cx.stroke(); cx.lineCap = "butt"; }
    var inner = d - lw * 2;
    if (done) {   /* 가운데 체크 · 채운 순간 0.5초에 그려진다 */
      var u = isTL ? 1 : EO((T - RING.doneAt) / 0.5), k = inner / 2, a = [R.x - 0.36 * k, R.y + 0.02 * k], b = [R.x - 0.1 * k, R.y + 0.3 * k], c = [R.x + 0.4 * k, R.y - 0.26 * k];
      var l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), L = (l1 + l2) * u;
      cx.globalAlpha = AM; cx.lineWidth = k * 0.17; cx.lineCap = "round"; cx.lineJoin = "round"; cx.strokeStyle = "#FFFFFF"; cx.beginPath(); cx.moveTo(a[0], a[1]);
      if (L <= l1) cx.lineTo(a[0] + (b[0] - a[0]) * L / l1, a[1] + (b[1] - a[1]) * L / l1);
      else { cx.lineTo(b[0], b[1]); cx.lineTo(b[0] + (c[0] - b[0]) * (L - l1) / l2, b[1] + (c[1] - b[1]) * (L - l1) / l2); }
      cx.stroke(); cx.lineCap = "butt"; cx.lineJoin = "miter"; cx.globalAlpha = 1;
    } else {
      cx.globalAlpha = 1;
      /* 가운데 n% · 숫자 폭 기준 = 「88%」가 안쪽 지름의 62% · 「%」는 숫자의 0.6배 · 길면 안쪽 지름의 78% 안으로 줄인다 */
      var pct = String(Math.floor(v * 100 + 0.0001)), ps = 100;
      var pw = function (str, s) { cx.font = "700 " + s + "px " + FONT; var q = cx.measureText(str).width; cx.font = "700 " + (s * 0.6) + "px " + FONT; return [q, cx.measureText("%").width, s * 0.04]; };
      var m0 = pw("88", ps); ps = ps * inner * 0.62 / (m0[0] + m0[1] + m0[2]);
      var m1 = pw(pct, ps), tw = m1[0] + m1[1] + m1[2]; if (tw > inner * 0.78) { ps *= inner * 0.78 / tw; m1 = pw(pct, ps); tw = m1[0] + m1[1] + m1[2]; }
      var px0 = R.x - tw / 2, pby = R.y + ps * 0.36;
      text(pct, 700, ps, "#FFFFFF", px0, pby, "left"); text("%", 700, ps * 0.6, "#FFFFFF", px0 + m1[0] + m1[2], pby, "left");
    }
    /* 링 이름 · 「목표 2,026」 · 넘으면 「목표 2,026 달성」 · 「목표 2,026 초과 달성」 */
    var dim = org ? "rgba(255,255,255,0.85)" : COL.sub, hot = org ? "#FFFFFF" : COL.o, nm = comma(CFG.goal) + (n > CFG.goal ? " 초과 달성" : done ? " 달성" : "");
    if (R.cap === "left") { text("목표", 500, 26, dim, R.x - d / 2 - 22, R.y - 8, "right"); text(nm, 600, 32, hot, R.x - d / 2 - 22, R.y + 32, "right", 230); }
    else { var w = text("목표", 500, 28, dim, R.x - d / 2, R.y + d / 2 + 46); text(nm, 600, 32, hot, R.x - d / 2 + w + 12, R.y + d / 2 + 46, "left", 330 - w); }
  }
  /* 큰 장면(1차 완성 · 500 · 하나로 · 목표 달성 · 다시 보기) 동안 진행 링 묶음(링 + 「목표 2,026」)을 0.4초에 지우고 장면이 끝나면 0.6초에 되살린다 · 얼려 둔 링은 돌아올 때 새 값으로 차오른다
     점 숫자 묶음 = 오렌지 뒤집기(1차 완성 0.9~6.3초) · 2026 점 숫자 장면(0~8.3초)에서만 같이 숨는다 · 다시 보기는 숫자가 0부터 치솟으니 남긴다 · 흩어졌다 모이기 · 혜성 중에는 그대로 */
  var HIDE = { t: 0, rp: 1, np: 1, ring: 1, num: 1, frozen: false };
  function hideStep(S, t) {
    var dt = Math.max(0, Math.min(0.25, T - HIDE.t)); HIDE.t = T;
    var big = !!S && S.kind !== "act", hn = !!S && (S.kind === "complete" ? t >= 0.9 && t < 6.3 : S.kind === "lv4" ? t < 8.3 : false);
    HIDE.rp = cl(HIDE.rp + (big ? -dt / 0.4 : dt / 0.6)); HIDE.np = cl(HIDE.np + (hn ? -dt / 0.4 : dt / 0.6));
    HIDE.ring = ESIO(HIDE.rp); HIDE.num = ESIO(HIDE.np); HIDE.frozen = big;
  }
  function drawText() {
    AM = 1;
    var org = ORANGE(), S = SHOW, isTL = S && S.kind === "tl", t = S ? T - S.t0 : 0;
    hideStep(S, t);
    if (WMREADY) { var wm = G.wm; cx.drawImage(org ? WM.w : WM.o, wm.x, wm.y, wm.w, wm.w * 179 / 497.6); }
    var n = isTL ? tlCount(S, t) : ST.n;
    /* 숫자 묶음 · 점 숫자 + 아래 「오늘 모인 스탬프」(가로 오른쪽 아래 · 세로 왼쪽 아래) · 단계 이름은 장면 제목으로만 */
    var N = G.num; AM = HIDE.num; drawNum(n, isTL, org);
    text("오늘 모인 스탬프", 500, N.ls, org ? "rgba(255,255,255,0.85)" : COL.sub, N.x, N.by, N.al);
    AM = HIDE.ring; if (AM > 0.004) drawRing(ST.n, false, org, HIDE.frozen);
    AM = 1; cx.globalAlpha = 1;
    if (isTL) text("오늘 하루 다시 보기", 600, G.tl.s, COL.o, G.tl.x, G.tl.y, "right", null, cl(t / 0.5) * cl((S.dur - t) / 0.6));
    /* 상태 줄 · 평소에는 없다 · 데모 표시 · 연결이 끊겼을 때만 */
    var sy = G.st.y; if (DEMO) { text("DEMO · 자동 적립 " + (DM.paused ? "꺼짐" : "켜짐"), 600, G.st.s, org ? "rgba(255,255,255,0.7)" : COL.faint, G.st.x, sy); sy += 32; }
    if (ST.off) text("연결 다시 시도 중 · 마지막 값 표시", 500, G.st.s, org ? "rgba(255,255,255,0.7)" : COL.faint, G.st.x, sy);
    if (DEMO) {   /* 데모만 · 위 가운데 작게 = 지금 수 · 다음 경계(또는 입력 중인 수) · 장면 이름 2초 · 사이클 상태 줄(가로 = 왼쪽 · 세로 = 위 가운데) · 운영 화면에는 없다 */
      var dc = org ? "rgba(255,255,255,0.85)" : COL.sub;
      var Y = G.dm.y, ds = demoStatus(), fc = org ? "rgba(255,255,255,0.7)" : COL.faint;
      text(ENT.s ? "입력 " + comma(+ENT.s) + " · Enter 이동 · Esc 취소" : demoLine(), 600, 24, ENT.s ? "#FFFFFF" : dc, G.FW / 2, Y[0], "center", G.dm.w);
      if (T < SC.until) text(SC.label, 600, 22, ENT.s ? dc : "#FFFFFF", G.port ? G.FW / 2 : G.st.x, Y[1], G.port ? "center" : "left", G.port ? G.dm.w : 470, cl((SC.until - T) / 0.5));
      if (G.port) [ds.slice(0, 3), ds.slice(3, 5), ds.slice(5)].forEach(function (g, k) { text(g.join(" · "), 500, 19, fc, G.FW / 2, Y[2] + k * Y[3], "center", G.dm.w); });   /* 세로 = 워드마크 아래 가운데 세 줄 */
      else for (var di = 0; di < ds.length; di++) text(ds[di], di ? 500 : 600, 19, di ? fc : dc, G.st.x, Y[2] + di * Y[3], "left", 470);   /* 가로 = 왼쪽 워드마크 아래 세로 줄 */
    }
    drawTitle();
  }
  function drawTitle() {
    var S = SHOW; if (!S || S.kind === "tl" || S.kind === "act") return;
    var t = T - S.t0, a1, lv = S.kind === "complete" ? 1 : +S.kind.slice(2), l1 = "스탬프 " + comma(CFG.lv[lv - 1]) + "개", l2 = CFG.names[lv];
    if (lv === 1) a1 = cl((t - 1.5) / 0.5) * cl((S.dur - 0.8 - t) / 0.8);
    else a1 = cl((t - (lv === 4 ? 8.1 : 0.4)) / 0.5) * cl((S.dur - 0.6 - t) / 0.7);
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
  function burstIn(n, win) {   /* 줄 끝에 이어 붙인다(앞 혜성보다 먼저 닿지 않게) */
    ST.target += n; var b = Math.max(T + 0.3, SCH.length ? SCH[SCH.length - 1].t + 0.06 : 0);
    for (var a = 0; a < n; a++) SCH.push({ t: b + a * win / Math.max(1, n) });
  }
  function jumpBy(m) { RING.init = false; var n = ST.n + m; ST.n = n; setLit(n); ST.lvl = levelOf(n); }
  /* 데모 빨리 감기 · 혜성 없이 그 수로 바로(숫자 · 링은 평소처럼 오르고 · 1막이면 새로 앉은 씨앗만 하얗게 번쩍) · 흩어졌다 모이기 중이면 그 그림도 맞춘다 */
  function jumpTo(n) {
    var o = litC; ST.n = n; setLit(n); ST.lvl = levelOf(n);
    for (var k = o; k < litC; k++) { var s = CL[k].seed; flashT[s] = T + 0.25 * (k - o) / Math.max(1, litC - o); FL.push(s); }
    if (SHOW && SHOW.kind === "act") actSpr(SHOW.act);
  }
  var FF = { at: 0 };
  function ffRun() {   /* 날던 혜성 · 대기 줄은 바로 켜고 · 다음 경계 바로 앞까지 바로 · 경계는 혜성 하나로(그 장면이 실제처럼) */
    FLY = []; SCH = [];
    var b = 0; for (var i = 0; i < CFG.lv.length; i++) if (CFG.lv[i] > ST.n) { b = CFG.lv[i]; break; }
    if (b && b <= ST.target) { jumpTo(b - 1); FF.at = b; SCH.push({ t: T }); }
    else jumpTo(ST.target);
  }
  function setNow(n) {
    n = Math.max(0, n); RING.init = false; NUM.reset = true; FF.at = 0;
    FLY = []; SCH = []; WAVES = []; IGN = []; FL = []; GLOWS = []; pn = 0; SHOW = null; STG.base = "black"; STG.to = null;
    ST.n = ST.target = n; ST.lvl = levelOf(n); ST.hitAt = -1e4;
    ACT.due = false; ACT.force = ""; ACT.next = T + actGap();   /* 다시 보기는 240초 뒤라 겹치지 않는다 */
    setLit(n); ign.fill(-1e9); TLS.next = T + cy(CFG.tlEvery); TLS.due = false;
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
  /* 데모(?demo=1) · 0개에서 시작 · 자동 적립은 꺼 둔다(Space 로 켜면 분당 14개를 15초마다 묶어 보낸다) */
  var DM = { rate: 14, next: CFG.pollSec, paused: true, rnd: mulberry(1026) };
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
  /* 데모 조작(?demo=1 에서만) · 경계를 넘으면 그 장면이 실제처럼 · 내려가면 그 단계 상태로 바로(축하 없음)
     ↑ +10(혜성 10개가 0.4초 간격으로 하나씩 날아와 박힌다) · ↓ −10(바로) · → +10 빨리 감기(혜성 없이 바로 · 경계는 그 혜성 하나와 장면만 실제처럼) · ← −10(바로)
     PageUp +100 빨리 감기 · PageDown −100(바로) · 누르고 있으면 반복(↑ 는 4초마다 10개씩)
     숫자 + Enter = 그 수로 바로 · [ ] 장면 목록 · A 흩어졌다 모이기 지금(누를 때마다 다음 변주) · T 다시 보기 · S 사이클 ×6 · Space 자동 적립 */
  var DMAX = 99999, ENT = { s: "" }, SC = { i: -1, until: -1e4, label: "" };
  function note(s) { SC.label = s; SC.until = T + 2.2; }
  function goTo(n) { setNow(Math.max(0, Math.min(DMAX, Math.round(n)))); DM.next = T + CFG.pollSec; }
  function plus(m) { m = Math.min(m, DMAX - ST.target); if (m <= 0) return; burstIn(m, m === 1 ? 0 : 0.4 * m); }
  function ffwd(m) { m = Math.min(m, DMAX - ST.target); if (m <= 0) return; ST.target += m; if (!FF.at || (!FLY.length && !SCH.length)) ffRun(); }
  function minus(m) { goTo(ST.target - m); }
  function demoLine() {
    var n = ST.n, s = comma(n) + (ST.target > n ? " (+" + comma(ST.target - n) + " 날아오는 중)" : "");
    for (var i = 0; i < CFG.lv.length; i++) if (n < CFG.lv[i]) return s + " · 다음 " + comma(CFG.lv[i]) + " " + CFG.names[i + 1];
    return s + " · 목표 " + comma(CFG.goal) + " 넘음(숫자만 오른다)";
  }
  /* 데모 상태 줄 · 단계 · 열린 움직임 · 다음 흩어졌다 모이기 · 다음 다시 보기 · 지금 장면 · 사이클 빠르기(운영 화면에는 없다) */
  var LOOK = [["불씨 · 빛줄기 7.5초마다", "흩어졌다 모이기 3종(작게)"], ["로고 전부 점화", "흩어졌다 모이기 3종"], ["빛 번짐 짙게 · 끝나면 물결", "흩어졌다 모이기 4종(+물결)"],
    ["하얀 씨앗 별 · 끝나면 잔광", "흩어졌다 모이기 5종(+한 점으로)"], ["흰 테두리 빛 · 끝나면 잔광", "흩어졌다 모이기 5종(가장 크게)"]];
  var SHOWN = { complete: "1차 완성 장면", lv2: "물결 장면", lv3: "하나로 장면", lv4: "목표 달성 장면", tl: "오늘 하루 다시 보기" };
  function sec(s) { s = Math.max(0, Math.round(s)); return s >= 60 ? Math.floor(s / 60) + "분 " + (s % 60) + "초" : s + "초"; }
  function demoStatus() {   /* 7줄 · 단계 · 보이는 차이 · 열린 흩어졌다 모이기와 간격 · 지금 · 다음 흩어졌다 모이기 · 다음 다시 보기 · 사이클 */
    var lv = Math.min(4, ST.lvl), e = CFG.actEvery[lv], S = SHOW, now = !S ? (FLY.length ? "혜성" : "쉼") : S.kind === "act" ? "흩어졌다 모이기 · " + ACTN[S.act.v] : SHOWN[S.kind] || S.kind;
    var a = S && S.kind === "act" ? "지금" : ACT.due ? "곧" : sec(ACT.next - T), b = ST.n < CFG.tlMin ? "없음(" + CFG.tlMin + "개부터)" : S && S.kind === "tl" ? "지금" : TLS.due ? "곧" : sec(TLS.next - T);
    return ["단계 " + lv + " · " + CFG.names[lv], "혜성 · " + LOOK[lv][0], LOOK[lv][1] + " · " + Math.round(cy(e[0])) + "~" + Math.round(cy(e[1])) + "초마다",
      "지금 · " + now, "다음 흩어졌다 모이기 · " + a, "다음 다시 보기 · " + b, "사이클 · " + (CYC > 1 ? "×" + CYC + " 빠르게(S)" : "실제 속도(S)")];
  }
  function cycKey() {
    var k = CYC === 1 ? 6 : 1, r = CYC / k; CYC = k;
    ACT.next = T + Math.max(0, ACT.next - T) * r; TLS.next = T + Math.max(0, TLS.next - T) * r;
    note("S · 사이클 " + (k > 1 ? "×" + k + " 빠르게(흩어졌다 모이기 · 다시 보기 주기만)" : "실제 속도"));
  }
  function actKey() { if (SHOW) return; ACT.ak = (ACT.ak + 1) % ACTALL.length; var v = ACTALL[ACT.ak]; ACT.force = v; note("A · 흩어졌다 모이기 · " + ACTN[v]); }
  var DKEYS = {
    "ArrowUp": function () { plus(10); }, "ArrowDown": function () { minus(10); },
    "ArrowRight": function () { ffwd(10); }, "ArrowLeft": function () { minus(10); },
    "PageUp": function () { ffwd(100); }, "PageDown": function () { minus(100); },
    "Enter": function () { if (ENT.s) goTo(+ENT.s); ENT.s = ""; }, "Escape": function () { ENT.s = ""; }, "Backspace": function () { ENT.s = ENT.s.slice(0, -1); },
    "[": function () { sceneGo(-1); }, "]": function () { sceneGo(1); },
    "a": actKey, "t": function () { if (!SHOW) startShow("tl"); }, "s": cycKey,
    " ": function () { DM.paused = !DM.paused; DM.next = T + 1; }, "h": function () { body.classList.toggle("help-on"); }
  };
  "0123456789".split("").forEach(function (d) { DKEYS[d] = function () { ENT.s = (ENT.s + d).replace(/^0+(?=\d)/, "").slice(0, 5); }; });
  /* 장면 목록 · [ ] 로 앞뒤(양 끝에서 멈춤) · 위 가운데 둘째 줄에 「3 / 20 · 이름」 2초 */
  var SCENES = [
    ["불씨 0개", function () { goTo(0); }],
    ["37개", function () { goTo(34); burstIn(3, 5); }],
    ["37개 · 터졌다 되감기", function () { goTo(37); ACT.force = "burst"; }],
    ["37개 · 흩날렸다 내려앉기", function () { goTo(37); ACT.force = "dust"; }],
    ["37개 · ME가 WE로", function () { goTo(37); ACT.force = "mewe"; }],
    ["120개", function () { goTo(120); }],
    ["1차 완성 순간(250)", function () { moment(CFG.g1); }],
    ["물결 순간(500)", function () { moment(CFG.lv[1]); }],
    ["600개", function () { goTo(600); }],
    ["하나로 순간(1,000)", function () { moment(CFG.lv[2]); }],
    ["1,200개", function () { goTo(1200); }],
    ["1,200개 · 터졌다 되감기", function () { goTo(1200); ACT.force = "burst"; }],
    ["1,200개 · 흩날렸다 내려앉기", function () { goTo(1200); ACT.force = "dust"; }],
    ["1,200개 · ME가 WE로", function () { goTo(1200); ACT.force = "mewe"; }],
    ["1,200개 · 물결", function () { goTo(1200); ACT.force = "wave"; }],
    ["1,200개 · 한 점으로", function () { goTo(1200); ACT.force = "one"; }],
    ["목표 달성 순간(2,026)", function () { moment(CFG.goal); }],
    ["2,500개", function () { goTo(2500); }],
    ["2,500개 · 한 점으로", function () { goTo(2500); ACT.force = "one"; }],
    ["다시 보기", function () { goTo(1500); startShow("tl"); }]
  ];
  function sceneGo(d) {
    var i = SC.i + d; if (i < 0 || i >= SCENES.length) return;
    SC.i = i; note((i + 1) + " / " + SCENES.length + " · " + SCENES[i][0]); SCENES[i][1]();
  }
  /* 누르고 있으면 반복 · 처음 0.4초 뒤 초당 8번 · 3초 넘게 누르면 초당 16번 · ↑ 만 4초마다(앞 10개가 다 박힐 즈음 다음 10개) */
  var HOLDK = { ArrowRight: 1, ArrowLeft: 1, ArrowUp: 4000, ArrowDown: 1, PageUp: 1, PageDown: 1 }, REP = { k: null, t: 0, t0: 0, fastMs: 3e3 };
  function repStop() { clearTimeout(REP.t); REP.k = null; }
  function repRun(k, f) {
    repStop(); f(); REP.k = k; REP.t0 = Date.now();
    var slow = HOLDK[k] > 1 ? HOLDK[k] : 0;
    var tick = function () { if (REP.k !== k) return; f(); REP.t = setTimeout(tick, slow || (Date.now() - REP.t0 > REP.fastMs ? 62 : 125)); };
    REP.t = setTimeout(tick, slow || 400);
  }
  window.addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key, f = KEYS[k] || (DEMO && DKEYS[k]); if (!f) return;
    e.preventDefault(); if (e.repeat) return;
    if (DEMO && HOLDK[k]) repRun(k, f); else f();
  });
  window.addEventListener("keyup", function (e) { if (REP.k === e.key) repStop(); });
  window.addEventListener("blur", repStop);
  /* 화면 왼쪽 · 오른쪽 가장자리 클릭(리모컨 포인터) = ← · →(−10 · +10 빨리 감기) · 데모에서만 */
  window.addEventListener("click", function (e) {
    if (!DEMO || body.classList.contains("help-on") || (e.target && e.target.id === "fsBtn")) return;
    var x = e.clientX / window.innerWidth; if (x < 0.12) minus(10); else if (x > 0.88) ffwd(10);
  });

  /* ════════ 프레임 ════════ */
  var FPS = { n: 0, t: 0, v: 0 }, HUDN = 0;
  function frame(dt) {
    T += dt;
    demoStep(); stepShow(); stepTL(); stepAct(); stepFlights(dt); stepParticles(dt);
    if (LAY.dirty) renderLogo();
    drawStage();
    logical();
    var own = SHOW && SHOW.own;
    if (!own) { ident(); cx.drawImage(LAY.logo, 0, 0); logical(); safe(drawEmberFlow); safe(drawIgnite); safe(drawWaves); safe(drawGlint); }
    safe(drawShow);
    if (own && SHOW.kind !== "tl") safe(drawWaves);
    safe(drawFlights); drawParticles(); drawGlows(); safe(drawText);
    ident();
    FPS.n++; FPS.t += dt; if (FPS.t >= 1) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
    if (body.classList.contains("hud-on") && (HUDN++ % 6 === 0)) $("hud").textContent = "fps " + FPS.v.toFixed(0) + " · D " + G.D.toFixed(1) + " · particles " + pn + "\nn " + ST.n + " · target " + ST.target + " · fly " + FLY.length + " · queued " + SCH.length + " · Lv " + ST.lvl + " · litC " + litC + "\nshow " + (SHOW ? SHOW.kind + " " + (T - SHOW.t0).toFixed(1) : "-") + " · tl in " + Math.max(0, TLS.next - T).toFixed(0) + "s · act in " + Math.max(0, ACT.next - T).toFixed(0) + "s" + (DEMO ? " · demo" + (DM.paused ? " paused" : "") : " · polls " + ST.polls + (ST.off ? " OFF" : ""));
  }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }

  /* ════════ 시작 ════════ */
  buildLogo(); buildClusters(CFG.g1);
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
    st: function () { return { n: ST.n, target: ST.target, lvl: ST.lvl, litC: litC, fly: FLY.length, queued: SCH.length, show: SHOW ? SHOW.kind : null, act: SHOW && SHOW.act ? SHOW.act.v : null, actIn: +(ACT.next - T).toFixed(1), tlIn: +(TLS.next - T).toFixed(1), ring: +RING.v.toFixed(4), particles: pn, port: G.port, D: +G.D.toFixed(2), clusters: CL.length, groups: LOGO.groups, off: ST.off, polls: ST.polls, demo: DEMO, paused: DM.paused }; },
    set: function (n) { setNow(n); }, moment: moment, burst: burstIn, batch: function (n) { took(ST.target + n); },
    tl: function () { startShow("tl"); }, hold: function () { DM.paused = true; }, tlNext: function (s) { TLS.next = T + s; },
    act: function (v) { ACT.force = v || actPick(); }, actNext: function (s) { ACT.next = T + s; }, log: function () { return ACT.log; }, go: function (n) { goTo(n); }, plus: function (m) { plus(m); },
    key: function (k) { var f = KEYS[k] || (DEMO && DKEYS[k]); if (f) f(); }, took: function (n) { took(n); }, cfg: CFG
  };
})();
