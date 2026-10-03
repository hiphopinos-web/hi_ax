/* AX Festival 2026 · 1F 스탠바이미 「ME to WE 스탬프 월」 v4c 「모여들기 · 최소 구성」 (261003 · 사용자 승인)
 *
 * 화면 · 워드마크(위 왼쪽) · 로고(가운데 · 점 2,026개) · 오늘 모인 스탬프 숫자(아래 왼쪽 · 2판부터 작은 「n판」) · 「● 점 1개 = 스탬프 1개」(아래 오른쪽). 그 외 없음
 *        같은 1층에 홍보부 영상이 계속 돌아가므로 이 화면은 조용하게 · 광고 장면 · 막간 · 이정표 · Outro 칸 · 상시 울렁임 없음
 * 점    · 스탬프 1개 = 점 1개가 화면 아래 가장자리에서 떠올라 로고 자리에 앉는다 · 한 번 앉은 점은 그대로
 *        로고 = 홍보부 원본 심볼(1,037점)의 모양을 더 촘촘한 격자로 다시 뽑은 정확히 2,026점 · 쌓는 순서 = 윤곽 먼저 → 안으로
 * 판    · 한 판 = 2,026개 · 판이 차면 빛이 한 번 훑고 「n판 완성」 8초 · 지난 판은 가라앉아 바탕이 된다(2판 동안 1판 = O50 · 3판부터 바탕 = O25)
 *        다음 판은 같은 2,026자리에 같은 순서로 밝게 · 판이 넘어가는 순간은 실제 2,026번째 스탬프가 앉을 때뿐
 * 데이터 · 공개 집계 stats(관리코드 없음) 15초 폴링 · kinds 의 stamp:<8종> − unstamp:<8종> = 스탬프 수 · 끊기면 마지막 값 유지 · 다시 연결
 *        폴링 한 번에 늘어난 n개를 다음 15초(92%) 안에 고르게 나눠 날린다(30개 넘으면 작은 떼)
 *        처음 열 때 · 새로고침 · 재접속 · 서버 수가 줄었을 때 = 지금 수까지 바로 채운다(날리지 않음 · 판 완성 연출 다시 틀지 않음)
 * 주소 · ?o=land|port 방향 고정(없으면 화면 비율) · ?base=숫자 빼고 셈 · ?srv=주소 서버 바꾸기(시험) · ?poll=초(시험)
 *        ?demo=1 서버 없이 가짜 적립(하루 곡선 압축 재생 · ?t=12:00 시작 시각 · ?n= 시작 수 · ?speed=8) · 조작표 H · ?rec=1 녹화용 고정 시계 */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var p = kv.split("="); Q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
  var DEMO = Q.demo === "1", REC = Q.rec === "1";

  /* ── 상수 한 곳 ── */
  var CFG = {
    goal: 2026,                                  /* 한 판 · AX Festival 2026 · 로고 점 수와 같다(점 1개 = 스탬프 1개) */
    pen: 14,                                     /* 같은 겹 안에서 펜 한 자루가 맡는 점 수(윤곽을 이만큼씩 나눠 동시에 그린다) */
    sink: [0.5, 0.25],                           /* 지난 판의 밝기 · 2판 동안 1판 = O50 · 3판부터 = O25(검정 위 O100 의 50% · 25%) */
    doneShow: 8,                                 /* 「n판 완성」 보이는 시간(초) · 그 뒤 판 표시 「n판」 */
    pollSec: Q.poll ? Math.max(3, +Q.poll) : 15, /* 서버 집계 주기(서버는 20초 캐시) · ?poll=초 는 시험용 */
    spread: 0.92,                                /* 한 번에 온 몫을 다음 폴링 간격의 92% 안에 고르게 나눠 날린다 */
    swarmAt: 30,                                 /* 한 묶음이 30개를 넘으면 작은 떼(30칸에 나눠 담아 한 칸에 여러 개) */
    swarmGap: 0.08,                              /* 떼 안에서 점 사이 간격(초) */
    maxFly: 40,                                  /* 동시에 나는 점 상한 · 넘으면 다음 칸을 기다린다 */
    maxQueue: 390,                               /* 한 창에 날릴 수 있는 최대 · 넘는 몫(연결이 오래 끊겼다 붙을 때)은 제자리에서 바로 켠다 */
    flySec: 2.2,                                 /* 비행 시간 · 거리에 따라 2.2~3.2초 */
    glowSec: 0.9,                                /* 도착 때 한 번 은은하게 빛나는 시간 */
    dotRatio: 1.31                               /* 점 지름 ÷ 점 간격 */
  };
  var COL = { o: "#FF7E31", txt: "rgba(255,255,255,0.88)", sub: "rgba(255,255,255,0.58)" };
  var IDS = ["lg", "qz", "p4", "p2", "p5", "p3", "st", "sv"];
  var FONT = "AXP, \"Pretendard Variable\", Pretendard, \"Malgun Gothic\", sans-serif";

  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function EO(x) { x = cl(x); return 1 - Math.pow(1 - x, 3); }
  function ESIO(x) { x = cl(x); return 0.5 - 0.5 * Math.cos(Math.PI * x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function comma(n) { n = Math.max(0, Math.round(n)); var s = String(n), o = ""; while (s.length > 3) { o = "," + s.slice(-3) + o; s = s.slice(0, -3); } return s + o; }
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var cv = $("cv"), cx = cv.getContext("2d"), frameEl = $("frame"), body = document.body;
  if (DEMO) body.classList.add("demo");

  /* ════════ 로고 점 만들기 ════════
     원본 = 홍보부 심볼 1,037점(24 간격 격자, 글자마다 기울기 · 원점이 조금씩 다름)
     2,026점 = 원본 점마다 부드러운 언덕(가우스 σ 11)을 얹은 높이 지도를 더 촘촘한 한 격자(간격 약 17.2)로 다시 읽어,
              높이가 「안쪽 높이의 절반」을 넘는 자리 = 원본 글자 면. 간격을 0.01씩 바꿔 2,026에 가장 가까운 간격을 고르고
              높이 순으로 정확히 2,026개를 남긴다 */
  var SYM = AXF_DATA.me.D.points;
  var LOGO = null;   /* { P: [[x, y]], n, pitch, order: [점 번호 · 켜지는 순서] } */
  function resample(target) {
    var P = SYM, n = P.length, i, SIG = 11, CELL = 48, H = {};
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (i = 0; i < n; i++) {
      x0 = Math.min(x0, P[i][0]); x1 = Math.max(x1, P[i][0]); y0 = Math.min(y0, P[i][1]); y1 = Math.max(y1, P[i][1]);
      var key = Math.floor(P[i][0] / CELL) + "," + Math.floor(P[i][1] / CELL); (H[key] || (H[key] = [])).push(i);
    }
    var s2 = 2 * SIG * SIG;
    function field(x, y) {
      var cx0 = Math.floor(x / CELL), cy0 = Math.floor(y / CELL), f = 0;
      for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
        var L = H[(cx0 + a) + "," + (cy0 + b)]; if (!L) continue;
        for (var k = 0; k < L.length; k++) { var dx = P[L[k]][0] - x, dy = P[L[k]][1] - y; f += Math.exp(-(dx * dx + dy * dy) / s2); }
      }
      return f;
    }
    var fin = 0; for (var a = -4; a <= 4; a++) for (var b = -4; b <= 4; b++) fin += Math.exp(-576 * (a * a + b * b) / s2);
    var TH = fin * 0.5, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    function sample(p) {
      var out = [], ni = Math.ceil((x1 - x0) / 2 / p) + 2, nj = Math.ceil((y1 - y0) / 2 / p) + 2;
      for (var j = -nj; j <= nj; j++) for (var ii = -ni; ii <= ni; ii++) {
        var x = mx + ii * p, y = my + j * p, f = field(x, y);
        if (f > TH * 0.6) out.push({ x: x, y: y, f: f });
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
  function buildLogo(N) {
    var r = resample(N), P = [];
    r.pts.forEach(function (q) { P.push([q.x, q.y]); });
    LOGO = { P: P, n: P.length, pitch: r.pitch };
    LOGO.order = byLevel(LOGO, depthOut(LOGO), function (s) { return trace(s, LOGO); });
  }
  /* ── 쌓는 순서 · 윤곽 먼저 → 안으로 · 처음부터 ME to WE 전체가 함께 자란다 ──
     이웃 = 격자 이웃(상하좌우 n4 · 대각 포함 n8) · 겉 = 상하좌우 이웃이 하나라도 빈 점 · 겹 = 겉에서 몇 걸음 안쪽인지
     겹 0(겉) 전부 → 겹 1 → … · 이른 시간에 이미 선 글씨 ME to WE 가 읽히고 하루가 갈수록 획이 굵어진다 */
  function nbrOf(L) {
    if (L.nb) return L.nb;
    var n = L.n, P = L.P, R4 = L.pitch * 1.2, R8 = L.pitch * 1.6, a4 = [], a8 = [], i, j;
    for (i = 0; i < n; i++) { a4.push([]); a8.push([]); }
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      var dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], d = dx * dx + dy * dy;
      if (d <= R8 * R8) { a8[i].push(j); a8[j].push(i); if (d <= R4 * R4) { a4[i].push(j); a4[j].push(i); } }
    }
    return (L.nb = { n4: a4, n8: a8 });
  }
  function bfs(n, seeds, adj) {
    var d = new Int32Array(n).fill(-1), q = seeds.slice(), h = 0;
    seeds.forEach(function (s) { d[s] = 0; });
    while (h < q.length) { var a = q[h++]; adj[a].forEach(function (b) { if (d[b] < 0) { d[b] = d[a] + 1; q.push(b); } }); }
    for (var i = 0; i < n; i++) if (d[i] < 0) d[i] = 0;
    return d;
  }
  function depthOut(L) { var nb = nbrOf(L), s = []; for (var i = 0; i < L.n; i++) if (nb.n4[i].length < 4) s.push(i); return bfs(L.n, s, nb.n4); }
  /* 한 겹 안의 순서 · 이어진 조각마다 점을 한 줄로 꿰고(이웃으로만 걸음) 그 줄을 펜 여러 자루(펜당 약 CFG.pen 점)로 나눈다
     모든 펜이 같은 빠르기로 동시에 나아간다 = 겹 전체에 짧은 선분이 고르게 자라 이어진다 · 같은 걸음이면 왼쪽 펜부터 */
  function trace(ids, L) {
    var nb = nbrOf(L), P = L.P, inS = {}, seen = {}, out = [];
    ids.forEach(function (k) { inS[k] = 1; });
    ids.forEach(function (k0) {
      if (seen[k0]) return;
      var comp = [], st = [k0]; seen[k0] = 1;
      while (st.length) { var a = st.pop(); comp.push(a); nb.n8[a].forEach(function (b) { if (inS[b] && !seen[b]) { seen[b] = 1; st.push(b); } }); }
      var left = {}, cnt = comp.length, seq = [], cur = comp[0];
      comp.forEach(function (k) { left[k] = 1; if (P[k][1] < P[cur][1] - 0.01 || (Math.abs(P[k][1] - P[cur][1]) <= 0.01 && P[k][0] < P[cur][0])) cur = k; });
      var deg = function (b) { var c = 0; nb.n8[b].forEach(function (x) { if (left[x]) c++; }); return c; };
      while (true) {
        seq.push(cur); delete left[cur]; if (!--cnt) break;
        var cand = nb.n4[cur].filter(function (b) { return left[b]; });
        if (!cand.length) cand = nb.n8[cur].filter(function (b) { return left[b]; });
        if (!cand.length) {   /* 막힘 · 남은 점 중 가장 가까운 곳에서 다시 */
          var best = -1, bd = 1e18;
          Object.keys(left).forEach(function (s) { var k = +s, dx = P[k][0] - P[cur][0], dy = P[k][1] - P[cur][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } });
          cur = best; continue;
        }
        cand.sort(function (a, b) { return deg(a) - deg(b) || a - b; }); cur = cand[0];
      }
      var m = seq.length, np = Math.max(1, Math.round(m / CFG.pen));
      seq.forEach(function (k, q) { var u = q * np / m, pen = Math.floor(u); out.push({ k: k, f: u - pen, x: P[seq[Math.floor(pen * m / np)]][0] }); });
    });
    out.sort(function (a, b) { return (a.f - b.f) || (a.x - b.x); });
    return out.map(function (o) { return o.k; });
  }
  function byLevel(L, lvl, inner) {
    var lv = [], i, out = [];
    for (i = 0; i < L.n; i++) (lv[lvl[i]] || (lv[lvl[i]] = [])).push(i);
    lv.forEach(function (ids) { if (ids && ids.length) out = out.concat(inner(ids)); });
    return out;
  }

  /* ════════ 무대 배치 · 가로 1920×1080 / 세로 1080×1920 논리 좌표 ════════
     로고 상자(box)에 로고 점 전체를 꽉 맞춰 가운데 · 글자는 모서리에만(위 왼쪽 워드마크 · 아래 왼쪽 숫자 · 아래 오른쪽 규칙) */
  var G = {}, LAY = {};
  function resize() {
    var w = REC ? (+Q.w || 1920) : window.innerWidth, h = REC ? (+Q.h || 1080) : window.innerHeight;
    var dpr = REC ? 1 : Math.min(window.devicePixelRatio || 1, 2), cap = 2560 * 1440;
    if (w * h * dpr * dpr > cap) dpr *= Math.sqrt(cap / (w * h * dpr * dpr));
    var port = Q.o === "port" ? true : Q.o === "land" ? false : h > w * 1.05;
    body.classList.toggle("port", port);
    var FW = port ? 1080 : 1920, FH = port ? 1920 : 1080, k = Math.min(w / FW, h / FH), ox = (w - FW * k) / 2, oy = (h - FH * k) / 2;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px";
    frameEl.style.transform = "translate(" + ox + "px," + oy + "px) scale(" + k + ")";
    var L;
    if (!port) L = {
      box: { x: 420, y: 44, w: 1080, h: 992 },
      wm: { x: 72, y: 64, w: 210 },
      cnt: { x: 72, y: 1012, ns: 84, ls: 24 },
      rule: { x: 1848, y: 1012, s: 26 }
    };
    else L = {
      box: { x: 40, y: 330, w: 1000, h: 1240 },
      wm: { x: 64, y: 72, w: 190 },
      cnt: { x: 64, y: 1830, ns: 84, ls: 24 },
      rule: { x: 1016, y: 1830, s: 26 }
    };
    G = L; G.w = w; G.h = h; G.dpr = dpr; G.port = port; G.FW = FW; G.FH = FH; G.k = k; G.ox = ox; G.oy = oy;
    G.xL = -ox / k; G.xR = (w - ox) / k; G.yT = -oy / k; G.yB = (h - oy) / k;
    var bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9;
    LOGO.P.forEach(function (p) { bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); by0 = Math.min(by0, p[1]); by1 = Math.max(by1, p[1]); });
    var pad = LOGO.pitch * CFG.dotRatio / 2, B = L.box;
    G.S = Math.min(B.w / (bx1 - bx0 + 2 * pad), B.h / (by1 - by0 + 2 * pad));
    var mcx = (bx0 + bx1) / 2, mcy = (by0 + by1) / 2, scx = B.x + B.w / 2, scy = B.y + B.h / 2;
    G.D = LOGO.pitch * G.S * CFG.dotRatio;
    G.pos = LOGO.P.map(function (p) { return [scx + (p[0] - mcx) * G.S, scy + (p[1] - mcy) * G.S]; });
    /* 날던 점은 새 배치의 제자리로 다시 겨눈다 */
    FLY.forEach(function (f) { f.d = G.pos[LOGO.order[slotOf(f.k)]]; });
    buildGrid(); LAY.logo = mkCanvas(); LAY.bloom = null; renderLogo();
  }
  function devT(c) { c.setTransform(G.k * G.dpr, 0, 0, G.k * G.dpr, G.ox * G.dpr, G.oy * G.dpr); }
  function mkCanvas() { var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; return c; }
  function logical() { devT(cx); }
  function ident() { cx.setTransform(1, 0, 0, 1, 0, 0); }
  /* 바탕 격자 · 움직이지 않는다 · 30px · 1.5% 오렌지(design.md §2) */
  function buildGrid() {
    LAY.grid = mkCanvas(); var g = LAY.grid.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, LAY.grid.width, LAY.grid.height); devT(g);
    var Pt = 30, i0 = Math.floor(G.xL / Pt) - 1, i1 = Math.ceil(G.xR / Pt) + 1, j0 = Math.floor(G.yT / Pt) - 1, j1 = Math.ceil(G.yB / Pt) + 1;
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
      var on = (((i * 7919 + j * 104729) * 2654435761) >>> 0) % 1000 < 15;
      g.fillStyle = on ? "rgba(255,126,49,0.32)" : "rgba(255,255,255,0.05)";
      var r = on ? 1.6 : 1.1; g.fillRect(i * Pt - r, j * Pt - r, r * 2, r * 2);
    }
  }

  /* ════════ 점 그림 · 원본 3색(바깥 오렌지 · 가운데 연오렌지 · 핵 연보라) ════════ */
  var SPR = null;
  function sprites() {
    if (SPR) return SPR; SPR = {};
    var Z = 96, C0 = [255, 127, 50], C1 = [255, 150, 62], C2 = [230, 204, 255];
    var mk = function (fn) { var c = document.createElement("canvas"); c.width = c.height = Z; fn(c.getContext("2d")); return c; };
    var col = function (c, f) { return "rgb(" + Math.round(c[0] * f) + "," + Math.round(c[1] * f) + "," + Math.round(c[2] * f) + ")"; };
    var circ = function (x, c, r) { x.fillStyle = c; x.beginPath(); x.arc(Z / 2, Z / 2, r, 0, 6.2832); x.fill(); };
    SPR.lit = mk(function (x) { circ(x, col(C0, 1), Z / 2); circ(x, col(C1, 1), Z * 9 / 38); circ(x, col(C2, 1), Z * 4 / 38); });
    SPR.ghost = mk(function (x) { circ(x, col(C0, 0.13), Z / 2); });
    /* 지난 판 · 같은 세 겹 점을 통째로 어둡게(검정 위 O50 · O25) */
    SPR.sink = CFG.sink.map(function (f) { return mk(function (x) { circ(x, col(C0, f), Z / 2); circ(x, col(C1, f), Z * 9 / 38); circ(x, col(C2, f), Z * 4 / 38); }); });
    var B = document.createElement("canvas"); B.width = B.height = 128; var bx = B.getContext("2d"), gr = bx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,200,150,1)"); gr.addColorStop(0.3, "rgba(255,150,62,0.55)"); gr.addColorStop(1, "rgba(255,126,49,0)"); bx.fillStyle = gr; bx.fillRect(0, 0, 128, 128);
    SPR.bloom = B;
    return SPR;
  }

  /* ════════ 상태 ════════
     스탬프 k(0부터)는 그 판의 (k mod 2,026)번째 자리에 앉는다 · plates() = 다 찬 판 수 · inPlate() = 지금 판에 앉은 수 */
  var T = 0;
  var ST = { landed: 0, target: 0, doneAt: -1e4, donePlate: 0, off: false, polls: 0 };
  var FLY = [], GLOW = [], SCH = [];   /* 나는 점 · 도착 빛 · 날릴 예정(시각) */
  function plates() { return Math.floor(ST.landed / CFG.goal); }
  function inPlate() { return ST.landed - plates() * CFG.goal; }
  function sinkSpr(p) { var a = sprites().sink; return a[Math.min(p, a.length) - 1]; }
  function slotOf(k) { return k % CFG.goal; }
  function drawSlot(c, s, pass) {
    var sp = sprites(), p = G.pos[LOGO.order[s]], d = G.D;
    if (s >= inPlate()) { if (pass !== 2) { var pl = plates(); c.drawImage(pl > 0 ? sinkSpr(pl) : sp.ghost, p[0] - d / 2, p[1] - d / 2, d, d); } return; }
    if (pass !== 1) c.drawImage(sp.lit, p[0] - d / 2, p[1] - d / 2, d, d);
  }
  /* 로고 캐시 · 빈자리 · 지난 판 먼저 → 이번 판 켜진 칸 · 도착할 때는 그 칸만 덧그린다(지름 ÷ 간격 1.38 이하면 이웃 핵을 덮지 않아 결과가 같다) */
  function renderLogo() {
    var c = LAY.logo.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, LAY.logo.width, LAY.logo.height); devT(c);
    for (var s = 0; s < LOGO.n; s++) drawSlot(c, s, 1);
    for (s = 0; s < LOGO.n; s++) drawSlot(c, s, 2);
    LAY.dirty = false;
  }
  function paintSlot(s) { var c = LAY.logo.getContext("2d"); devT(c); drawSlot(c, s, 2); }
  function bloomLayer() {
    if (LAY.bloom) return LAY.bloom;
    LAY.bloom = mkCanvas(); var c = LAY.bloom.getContext("2d"); devT(c); var sp = sprites(), d = G.D * 2.6;
    for (var i = 0; i < LOGO.n; i++) { var p = G.pos[i]; c.globalAlpha = 0.5; c.drawImage(sp.bloom, p[0] - d / 2, p[1] - d / 2, d, d); }
    return LAY.bloom;
  }

  /* 서버 합계가 바뀜(폴링 한 번) · 늘어난 몫을 다음 폴링까지 고르게 나눠 날린다 */
  function took(total) {
    if (total < ST.landed + FLY.length + SCH.length) { setNow(total); return; }   /* 줄었다(초기화) · 바로 맞춘다 */
    var add = total - ST.target; ST.target = total; if (add <= 0) return;
    var n = SCH.length + add;
    if (n > CFG.maxQueue) {   /* 너무 밀렸다(연결이 오래 끊겼다 붙음) · 나는 점과 넘친 몫을 제자리에서 바로 켜고 나머지만 날린다 */
      var over = n - CFG.maxQueue; ST.landed += FLY.length + over; FLY = []; n = CFG.maxQueue;
      renderLogo();
    }
    var W = CFG.pollSec * CFG.spread; SCH = [];
    if (n <= CFG.swarmAt) for (var a = 0; a < n; a++) SCH.push({ t: T + (a + 0.5) * W / n });
    else { var per = Math.ceil(n / CFG.swarmAt); for (var b = 0; b < n; b++) SCH.push({ t: T + (Math.floor(b / per) + 0.5) * W / CFG.swarmAt + (b % per) * CFG.swarmGap }); }
  }
  /* 지금 수로 바로(처음 · 새로고침 · 재접속 · 서버 수가 줄었을 때) · 날리지 않고 축하 연출도 틀지 않는다 */
  function setNow(n) {
    FLY = []; GLOW = []; SCH = [];
    ST.landed = ST.target = Math.max(0, n); ST.doneAt = -1e4; ST.donePlate = 0;
    if (LAY.logo) renderLogo();
  }
  var RND = mulberry(20261026);
  function launch() {
    var k = ST.landed + FLY.length, dst = G.pos[LOGO.order[slotOf(k)]];
    var src = [dst[0] + (RND() - 0.5) * 160, G.yB + G.D];   /* 아래 가장자리 · 제자리 바로 아래쯤에서 거의 곧게 떠오른다 */
    var dx = dst[0] - src[0], dy = dst[1] - src[1], dl = Math.sqrt(dx * dx + dy * dy) || 1, sgn = (k % 2) ? 1 : -1, bend = (0.05 + RND() * 0.05) * dl * sgn;
    var c = [(src[0] + dst[0]) / 2 - dy / dl * bend, (src[1] + dst[1]) / 2 + dx / dl * bend];
    var dur = CFG.flySec + cl(dl / G.FH) * 1.0, prev = FLY[FLY.length - 1];
    if (prev) dur = Math.max(dur, prev.t0 + prev.dur - T + 0.02);   /* 앞 점보다 먼저 앉지 않게(숫자 · 판 계산은 앉는 순서대로) */
    FLY.push({ k: k, s: src, c: c, d: dst, t0: T, dur: dur });
  }
  /* 판 완성 · 실제 2,026번째(4,052번째 …) 스탬프가 앉을 때만 */
  function onLanded(k) { if ((k + 1) % CFG.goal === 0) { ST.doneAt = T; ST.donePlate = (k + 1) / CFG.goal; LAY.dirty = true; } }
  function stepFlights() {
    while (SCH.length && SCH[0].t <= T && FLY.length < CFG.maxFly) { SCH.shift(); launch(); }
    while (FLY.length && T - FLY[0].t0 >= FLY[0].dur) {   /* 도착 · 날린 순서대로 내린다 */
      var f = FLY.shift();
      ST.landed++;
      paintSlot(slotOf(f.k)); GLOW.push({ x: f.d[0], y: f.d[1], t0: T });
      onLanded(f.k);
    }
    if (GLOW.length && T - GLOW[0].t0 > CFG.glowSec) GLOW = GLOW.filter(function (g) { return T - g.t0 < CFG.glowSec; });
  }
  function bez(f, e) { var iu = 1 - e; return [iu * iu * f.s[0] + 2 * iu * e * f.c[0] + e * e * f.d[0], iu * iu * f.s[1] + 2 * iu * e * f.c[1] + e * e * f.d[1]]; }
  function drawFlights() {
    var sp = sprites(), D = G.D;
    for (var i = 0; i < FLY.length; i++) {
      /* 꼬리 없음 · 크기 맥동 거의 없음(1.06배) · 주위 빛 옅게 */
      var f = FLY[i], u = cl((T - f.t0) / f.dur), e = ESIO(u), sc = 1 + 0.06 * Math.sin(Math.PI * u);
      var p = bez(f, e), d = D * sc, bd = d * 2.2;
      cx.globalAlpha = 0.16; cx.drawImage(sp.bloom, p[0] - bd / 2, p[1] - bd / 2, bd, bd);
      cx.globalAlpha = 1; cx.drawImage(sp.lit, p[0] - d / 2, p[1] - d / 2, d, d);
    }
    for (var j = 0; j < GLOW.length; j++) {
      var g = GLOW[j], v = cl((T - g.t0) / CFG.glowSec), bs = D * (2.0 + 0.6 * EO(v));
      cx.globalAlpha = 0.32 * (1 - v) * (1 - v); cx.drawImage(sp.bloom, g.x - bs / 2, g.y - bs / 2, bs, bs);
    }
    cx.globalAlpha = 1;
  }
  /* 완성 · 2,026번째 점이 앉으면 쌓인 순서대로 빛이 한 번 훑고(1.6초) 글자 전체가 한 번 밝아졌다 가라앉는다(1.2~3.2초)
     그 뒤 · 다 찬 판은 3.4초까지 밝게 머물다 1.4초에 걸쳐 한 단계 낮은 오렌지로 가라앉는다(이미 앉은 다음 판 점은 덮지 않는다) */
  function drawComplete() {
    var t = T - ST.doneAt; if (t < 0 || t > 4.8) return;
    var sp = sprites(), D = G.D * 2.4, n = LOGO.n;
    var lid = t < 3.4 ? 1 : 1 - ESIO((t - 3.4) / 1.4);
    if (lid > 0.002) { cx.globalAlpha = lid; for (var u = inPlate(); u < n; u++) { var pu = G.pos[LOGO.order[u]]; cx.drawImage(sp.lit, pu[0] - G.D / 2, pu[1] - G.D / 2, G.D, G.D); } cx.globalAlpha = 1; }
    if (t > 3.4) return;
    for (var s = 0; s < n; s++) {
      var ph = t - 1.6 * s / n; if (ph < 0 || ph > 0.5) continue;
      var p = G.pos[LOGO.order[s]]; cx.globalAlpha = 0.5 * Math.sin(Math.PI * ph / 0.5); cx.drawImage(sp.bloom, p[0] - D / 2, p[1] - D / 2, D, D);
    }
    var sw = 0.28 * (t < 1.2 ? 0 : t < 1.9 ? EO((t - 1.2) / 0.7) : 1 - ESIO((t - 1.9) / 1.3));
    if (sw > 0.01) { ident(); cx.globalAlpha = sw; cx.globalCompositeOperation = "lighter"; cx.drawImage(bloomLayer(), 0, 0); cx.globalCompositeOperation = "source-over"; logical(); }
    cx.globalAlpha = 1;
  }

  /* ════════ 글자(정지) ════════ */
  var WMIMG = null, WMREADY = false;
  function wmLoad() {
    var svg = (typeof AXF_WORDMARK === "string" ? AXF_WORDMARK : "").replace(/currentColor/g, COL.o);
    if (!svg) return;
    WMIMG = new Image(); WMIMG.onload = function () { WMREADY = true; }; WMIMG.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function text(txt, wgt, size, col, x, y, align, a) {
    cx.globalAlpha = a == null ? 1 : a; cx.fillStyle = col; cx.font = wgt + " " + size + "px " + FONT; cx.textAlign = align || "left"; cx.textBaseline = "alphabetic"; cx.fillText(txt, x, y);
    var w = cx.measureText(txt).width; cx.globalAlpha = 1; return w;
  }
  function drawHeader() { if (WMREADY) { var wm = G.wm; cx.drawImage(WMIMG, wm.x, wm.y, wm.w, wm.w * 179 / 497.6); } }
  /* 숫자 · 앉을 때마다 1씩 오른다 · 판이 차면 옆에 「n판 완성」 8초 → 그 뒤 「n+1판」 작게 */
  function drawCount() {
    var C = G.cnt, pl = plates();
    var w = text(comma(ST.landed), 700, C.ns, COL.txt, C.x, C.y);
    var td = T - ST.doneAt, x = C.x + w + 22, y = C.y;
    var dA = ST.donePlate ? cl((td - 1.0) / 0.5) * (1 - cl((td - CFG.doneShow) / 0.6)) : 0;
    if (dA > 0) text(ST.donePlate + "판 완성", 600, C.ls + 4, COL.o, x, y, "left", dA);
    else if (pl > 0) text((pl + 1) + "판", 500, C.ls + 2, COL.sub, x, y, "left", ST.donePlate ? cl((td - CFG.doneShow - 0.6) / 0.6) : 1);
  }
  function drawRule() {
    var R = G.rule, sp = sprites(), d = R.s * 0.8;
    var w = text("점 1개 = 스탬프 1개", 500, R.s, COL.sub, R.x, R.y, "right");
    cx.globalAlpha = 1; cx.drawImage(sp.lit, R.x - w - 14 - d, R.y - R.s * 0.36 - d / 2, d, d);
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
  var POLL = { fails: 0, first: true };
  function gotTotal(total) {
    total = Math.max(0, total - (Q.base ? +Q.base : 0));
    if (POLL.first) { POLL.first = false; setNow(total); }   /* 처음 · 지금 수까지 바로 */
    else took(total);
    save("axfWall.last", { n: total, at: Date.now() });
  }
  function poll() {
    jsonp({ action: "stats" }, function (res) {
      if (res && res.ok && res.kinds) { POLL.fails = 0; body.classList.remove("off"); ST.off = false; ST.polls++; gotTotal(stampsOf(res.kinds)); }
      else { POLL.fails++; if (POLL.fails >= 2) { body.classList.add("off"); ST.off = true; } }   /* 끊김 · 화면은 마지막 값 그대로 */
      var wait = POLL.fails ? Math.min(60, CFG.pollSec * Math.pow(2, Math.min(POLL.fails - 1, 2))) : CFG.pollSec;
      setTimeout(poll, wait * 1000);
    });
  }

  /* ════════ 데모(?demo=1) · 서버 없이 하루 곡선 압축 재생 · 15초 묶음 도착을 흉내 낸다 ════════
     가짜 곡선 · 09:30 0 → 12:30 2,026(1판 완성) → 15:00 약 3,700(2판) → 17:00 약 5,000(3판 진행 중) */
  var CURVE = [[9.5, 0], [10, 230], [10.5, 560], [11, 940], [11.5, 1330], [12, 1700], [12.5, 2026], [13, 2280], [13.5, 2600], [14, 2980], [14.5, 3350], [15, 3700], [15.5, 4040], [16, 4370], [16.5, 4690], [17, 5000], [17.5, 5150], [18, 5180]];
  function cum(V) {
    var h = V / 3600; if (h <= CURVE[0][0]) return 0;
    for (var i = 1; i < CURVE.length; i++) if (h <= CURVE[i][0]) { var a = CURVE[i - 1], b = CURVE[i]; return a[1] + (b[1] - a[1]) * (h - a[0]) / (b[0] - a[0]); }
    return CURVE[CURVE.length - 1][1];
  }
  function hm(V) { var m = Math.floor(V / 60), h = Math.floor(m / 60); return h + ":" + ("0" + (m % 60)).slice(-2); }
  function parseHM(s) { var p = String(s).split(":"); return (+p[0]) * 3600 + (+(p[1] || 0)) * 60; }
  var DM = { V: parseHM(Q.t || "9:30"), speed: Q.speed ? +Q.speed : 8, paused: false, next: CFG.pollSec, total: 0, rnd: mulberry(1026) };
  function demoJump(V, n) { DM.V = V; DM.total = n != null ? n : Math.floor(cum(V)); DM.next = T + CFG.pollSec; setNow(DM.total); }
  function demoBatch(n) { DM.total += n; took(DM.total); }
  function demoStep(dt) {
    if (!DEMO || DM.paused) return;
    DM.V += dt * DM.speed;
    if (T >= DM.next) {
      DM.next = T + CFG.pollSec;
      var add = Math.floor(cum(DM.V) + (DM.rnd() - 0.5) * 3) - DM.total;
      if (add > 0) demoBatch(add);
    }
  }

  /* ════════ 입력 · 전체 화면 · 꺼짐 방지 ════════ */
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
  var JUMPS = { "1": "9:30", "2": "10:30", "3": "12:29", "4": "15:00", "5": "17:00" };   /* 데모 · 3 = 1판 완성 직전 */
  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "f" || k === "F") fsToggle();
    else if (k === "h" || k === "H") body.classList.toggle("help-on");
    else if (k === "g" || k === "G") body.classList.toggle("hud-on");
    else if (DEMO && JUMPS[k]) demoJump(parseHM(JUMPS[k]));
    else if (DEMO && k === "ArrowUp") DM.speed = Math.min(256, DM.speed * 2);
    else if (DEMO && k === "ArrowDown") DM.speed = Math.max(1, DM.speed / 2);
    else if (DEMO && k === " ") DM.paused = !DM.paused;
    else if (DEMO && (k === "b" || k === "B")) demoBatch(8);
    else if (DEMO && (k === "j" || k === "J")) demoBatch(100);
    else return;
    e.preventDefault();
  });

  /* ════════ 프레임 ════════ */
  var FPS = { n: 0, t: 0, v: 0 }, HUDN = 0;
  function frame(dt) {
    T += dt;
    demoStep(dt);
    stepFlights();
    if (LAY.dirty) renderLogo();
    ident(); cx.globalAlpha = 1; cx.drawImage(LAY.grid, 0, 0);
    cx.drawImage(LAY.logo, 0, 0);
    logical();
    safe(drawComplete); safe(drawHeader); safe(drawCount); safe(drawRule); safe(drawFlights);
    ident();
    FPS.n++; FPS.t += dt; if (FPS.t >= 1) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
    if (body.classList.contains("hud-on") && (HUDN++ % 6 === 0)) $("hud").textContent = "fps " + FPS.v.toFixed(0) + " · dots " + LOGO.n + " · D " + G.D.toFixed(1) + "px\nlanded " + ST.landed + " · flying " + FLY.length + " · queued " + SCH.length + " · target " + ST.target + " · plates " + plates() + (DEMO ? "\ndemo " + hm(DM.V) + " ×" + DM.speed + (DM.paused ? " paused" : "") : "\npolls " + ST.polls + (ST.off ? " OFF" : ""));
  }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }

  /* ════════ 시작 ════════ */
  buildLogo(CFG.goal);
  wmLoad();
  resize();
  window.addEventListener("resize", function () { if (!REC) resize(); });
  if (DEMO) demoJump(DM.V, Q.n != null && Q.n !== "" ? +Q.n : null);
  else { var last = load("axfWall.last", null); if (last && last.n >= 0) setNow(Math.max(0, +last.n || 0)); }   /* 서버 응답 전 · 마지막 값으로 바로 */
  keepAwake();
  if (!DEMO && !REC) poll();
  var fontP = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("600 40px AXP"), document.fonts.load("700 40px AXP"), document.fonts.load("500 30px AXP")]).catch(function () {}) : Promise.resolve();
  if (!REC) {
    var lastNow = 0;
    var loop = function (now) { requestAnimationFrame(loop); var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1 / 60; lastNow = now; try { frame(dt); } catch (e) { if (window.console) console.error(e); } };
    requestAnimationFrame(loop);
  }
  /* 녹화 · 점검 훅 */
  window.__wall = {
    ready: fontP.then(function () { return new Promise(function (r) { var n = 0; (function w() { if (WMREADY || ++n > 300) r(); else setTimeout(w, 30); })(); }); }),
    step: function (dt) { frame(dt); },
    st: function () { return { dots: LOGO.n, landed: ST.landed, target: ST.target, flying: FLY.length, queued: SCH.length, plates: plates(), inPlate: inPlate(), port: G.port, off: ST.off, polls: ST.polls, demo: DEMO }; },
    took: function (total) { took(total); }, now: function (n) { setNow(n); },
    jump: function (t, n) { demoJump(parseHM(t), n); }, batch: function (n) { demoBatch(n); }, speed: function (s) { DM.speed = s; }, pause: function (p) { DM.paused = !!p; },
    cfg: CFG
  };
})();
