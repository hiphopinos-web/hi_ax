/* ════════════════ AX 팡 · 7×7 같은 그림 3개 맞추기 (60초 · 지는 조건 없음) ════════════════
   조작: 이웃한 두 칸을 밀어서 바꾸기 또는 한 칸 탭 → 옆 칸 탭. 맞는 줄이 안 생기면 튕기듯 제자리로 돌아간다.
   3개 이상 한 줄 = 터짐 → 위 그림이 떨어짐(연쇄) · 점수 = 터진 칸 × 10 × 연쇄 배수(1~5).
   4개 이상 한 줄 = 그 자리에 특수 블록(가로 줄로 만들면 가로 한 줄, 세로면 세로 한 줄을 지운다 · 한 종류만).
   움직일 수가 없으면 자동으로 섞고 · 5초 입력이 없으면 가능한 수 두 칸이 부드럽게 맥박친다.
   v3.48 (사용자 피드백 260917 · 16비트 느낌은 필요 없다) · 이 게임만 앱의 모던 플랫 스타일:
   v4.21 (사용자 확정 260923 · 위 v3.48 결정을 뒤집는다 · 이력이라 지우지 않고 남긴다) 게임판 프레임만 16비트로 되돌린다:
   gsOverlayOpen 의 flat 을 떼어 점프·소나기와 같은 공용 프레임(검정 2px 테 · 12px 라운드 · 도트 확대)을 되찾는다.
   타일 외곽선·팔레트 재작업(2단계)은 리허설 뒤 결정이라 손대지 않는다 · 시작·결과·일시정지 화면은 v4.08 AX-TDS 그대로.
   흰 바탕 · 둥근 사각 타일(그림자 없음, 얇은 선) · SICO 문법 벡터 아이콘 5종(모양 + 채움색 둘 다로 구분) ·
   특수 블록 = 검정 타일 + 흰 화살표 선 + O100 테두리 · 앱 기본 글꼴 · 캔버스는 기기 해상도로 그린다(도트 확대 없음).
   채움: 말풍선 흰색 · 톱니 검정 · 차트 O100 · 전구 O10 · 반짝임 O50 (아이콘은 흰색 또는 검정). 점 파티클 = KV 도트 격자 모티프. */
var PG_N = 7, PG_TS = 24, PG_W = 180, PG_H = 236, PG_OX = 6, PG_OY = 38, PG_KINDS = 5;
/* v3.74 (사용자 확정 260918) 60초 제한 → 완주 시간 경쟁 · 목표 타일을 다 터뜨릴 때까지 걸린 시간이 기록이다.
   v4.02 (점수 체계 v2 · 사용자 결정 260919 · 60초 타임어택안 기각) 완주 시간을 점수로 바꾼다 · 1000 × (기준 초 / 완주 초)^지수 · 3,000 상한
   (계수 = 올림픽 규칙 pang.base·pow · 서버 설정 「올림픽_점수」) · 판 안에서 터뜨린 칸 점수·연쇄 배수는 점수가 아니다(진행만 보여 준다). */
var PG_GOAL = 80, PG_MAX_SEC = 120;   /* v3.74 실측 · 한 수에 평균 4~5칸이 터져 40칸은 9수면 끝났다 → 80칸(약 18수)으로 올림 */
/* v3.79 완주 연출을 더 음미할 수 있게 (사용자 피드백 260918) · 무너짐 2초 → 슬로건 한 줄씩 0.4초 간격 → 3.5초 머무름 */
var PG_FIN = { fall: 2.0, hold: 3.5, step: 0.4 };
var PG_MILE = [[0.25, ""], [0.5, "절반"], [0.75, "조금 남았어요"]];   /* 진행 이정표 · 25%는 맥박만 */
/* v4.21 (사용자 확정 260923) 한 번 밀었는데 알아서 계속 터지는 순간 = 이미 게임 안에 있는 「자동화」 장면이다.
   그 순간에만 한 줄이 스친다. 가르치는 말이 아니라 알아채는 말이고, 새 화면·멈춤은 없다(기존 안내 줄 자리).
   v3.73 이 타일마다 낱말·설명을 붙였다가 하루 만에 걷힌 이유(「교육 기능이 어설프다」)를 반복하지 않는다: 타일은 그대로 둔다. */
var PG_CHAIN_MSG = [
  "이 보고서, 지난달에도 같은 틀로 만들었다",
  "이 회신, 저번 주에도 비슷하게 썼다",
  "이 정리, 할 때마다 순서가 같다",
  "이 아이디어, 회의 때마다 다시 나온다",
  "이 화면, 몇 번째 같은 방식으로 채우고 있다"
];
var PG_MSG_AT = [1, 4, 8];   /* 한 판에 최대 3번 · 1·4·8번째 연쇄에서만 (v3.73 의 「매판 여러 번」이 잔소리가 됐다) */
var PG_FIN_MSG = "오늘 몇 번은, AI에게 맡겨도 됐을 반복이었다";   /* 완주 연출 첫 줄 · 결과 카드에는 넣지 않는다(design.md 문구 규칙) */
var PG_HINT_FIRST = 5, PG_HINT_AGAIN = 5;   /* v3.74 힌트 · 첫 5초 · 이후 5초마다 (v3.66 의 3초는 너무 빨랐다) */
var PG_C = { o100: "#FF7E31", o50: "#FFB284", o10: "#FFEBE0", ink: "#111111", w: "#FFFFFF", line: "#E6E0DB", track: "#EFEDEB", muted: "#8A817B", tx: "#1A1A1A" };
/* v3.74 (사용자 피드백 260918 「교육 기능이 어설프다」) v3.73 타일 낱말·설명 줄은 걷어냈다 · 타일은 그냥 그림이다.
   교육 문구는 완주했을 때 뜨는 슬로건 한 번뿐이다(그게 보상이라 어색하지 않다). */
var PG_TILE = [
  { name: "말풍선", fill: PG_C.w, ic: PG_C.ink, line: "#D9D2CC" },
  { name: "톱니", fill: PG_C.ink, ic: PG_C.w, line: PG_C.ink },
  { name: "차트", fill: PG_C.o100, ic: PG_C.w, line: PG_C.o100 },
  { name: "전구", fill: PG_C.o10, ic: PG_C.ink, line: "#FFD3BA" },
  { name: "반짝임", fill: PG_C.o50, ic: PG_C.ink, line: PG_C.o50 }
];
var PG_FONT = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", sans-serif';
function pgRR(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
/* 아이콘 · 24 단위 상자 기준 벡터 · cx,cy 중심, s = 한 변 길이 */
function pgIconDraw(ctx, t, cx, cy, s, col) {
  var k = s / 24;
  ctx.save(); ctx.translate(cx - 12 * k, cy - 12 * k); ctx.scale(k, k);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.lineCap = "round";
  if (t === 0) {        /* 말풍선 · 선 + 점 세 개 */
    ctx.beginPath(); ctx.moveTo(6.5, 4.5); ctx.lineTo(17.5, 4.5); ctx.arcTo(21, 4.5, 21, 8, 3.2); ctx.lineTo(21, 13); ctx.arcTo(21, 16.5, 17.5, 16.5, 3.2);
    ctx.lineTo(11, 16.5); ctx.lineTo(6.5, 20.5); ctx.lineTo(6.5, 16.5); ctx.arcTo(3, 16.5, 3, 13, 3.2); ctx.lineTo(3, 8); ctx.arcTo(3, 4.5, 6.5, 4.5, 3.2); ctx.closePath(); ctx.stroke();
    [7.8, 12, 16.2].forEach(function (x) { ctx.beginPath(); ctx.arc(x, 10.5, 1.45, 0, 6.2832); ctx.fill(); });
  } else if (t === 1) { /* 톱니 · 면 + 가운데 구멍 */
    ctx.beginPath(); ctx.arc(12, 12, 7, 0, 6.2832); ctx.fill();
    for (var i = 0; i < 6; i++) {   /* 굵은 톱니 6개 · 작은 칸에서도 톱니바퀴로 읽히게 */
      ctx.save(); ctx.translate(12, 12); ctx.rotate(i * 1.0472);
      pgRR(ctx, -2.3, -10.8, 4.6, 5.5, 1); ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(12, 12, 3, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else if (t === 2) { /* 막대 차트 · 오르는 막대 3개 + 바닥선 */
    [[4.5, 13, 4], [10, 9, 4], [15.5, 4.5, 4]].forEach(function (b) { pgRR(ctx, b[0], b[1], b[2], 17.5 - b[1], 1.2); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(3, 20.5); ctx.lineTo(21, 20.5); ctx.stroke();
  } else if (t === 3) { /* 전구 · 선 */
    ctx.beginPath(); ctx.moveTo(9, 16.5); ctx.bezierCurveTo(9, 13.8, 5.5, 12.6, 5.5, 9.3); ctx.arc(12, 9.3, 6.5, Math.PI, 0); ctx.bezierCurveTo(18.5, 12.6, 15, 13.8, 15, 16.5); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9.3, 19.5); ctx.lineTo(14.7, 19.5); ctx.moveTo(10.5, 22); ctx.lineTo(13.5, 22); ctx.stroke();
  } else {              /* 반짝임 · 네 갈래 별 면 */
    ctx.beginPath(); ctx.moveTo(12, 2.5); ctx.quadraticCurveTo(13.3, 10.7, 21.5, 12); ctx.quadraticCurveTo(13.3, 13.3, 12, 21.5); ctx.quadraticCurveTo(10.7, 13.3, 2.5, 12); ctx.quadraticCurveTo(10.7, 10.7, 12, 2.5); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
var PG = { on: false, raf: 0, parts: [], pops: [], k: 1 };
function pgRand() { return Math.floor(Math.random() * PG_KINDS); }
function pgNew(t) { return { t: t, sp: "", ox: 0, oy: 0, clr: 0, ad: 0 }; }
/* 같은 그림 3개 이상 줄 목록 · 가로 먼저 */
function pgRuns(b) {
  var runs = [], r, c, e, k, cells;
  for (r = 0; r < PG_N; r++) for (c = 0; c < PG_N; c = e) {
    for (e = c + 1; e < PG_N && b[r][e].t === b[r][c].t; e++);
    if (e - c >= 3) { cells = []; for (k = c; k < e; k++) cells.push([r, k]); runs.push({ cells: cells, dir: "h" }); }
  }
  for (c = 0; c < PG_N; c++) for (r = 0; r < PG_N; r = e) {
    for (e = r + 1; e < PG_N && b[e][c].t === b[r][c].t; e++);
    if (e - r >= 3) { cells = []; for (k = r; k < e; k++) cells.push([k, c]); runs.push({ cells: cells, dir: "v" }); }
  }
  return runs;
}
function pgSwapRaw(b, a, z) { var t = b[a[0]][a[1]]; b[a[0]][a[1]] = b[z[0]][z[1]]; b[z[0]][z[1]] = t; }
/* 가능한 수 하나 · 없으면 null */
function pgFindMove(b) {
  for (var r = 0; r < PG_N; r++) for (var c = 0; c < PG_N; c++) {
    var nb = [[r, c + 1], [r + 1, c]];
    for (var i = 0; i < 2; i++) {
      var z = nb[i]; if (z[0] >= PG_N || z[1] >= PG_N) continue;
      if (b[r][c].t === b[z[0]][z[1]].t) continue;
      pgSwapRaw(b, [r, c], z);
      var ok = pgRuns(b).length > 0;
      pgSwapRaw(b, [r, c], z);
      if (ok) return [[r, c], z];
    }
  }
  return null;
}
/* 시작 판 · 이미 맞춰진 줄 없음 + 가능한 수 1개 이상 */
function pgBoardInit() {
  var b;
  for (var tries = 0; tries < 100; tries++) {
    b = [];
    for (var r = 0; r < PG_N; r++) {
      b.push([]);
      for (var c = 0; c < PG_N; c++) {
        var t;
        do { t = pgRand(); } while ((c >= 2 && b[r][c - 1].t === t && b[r][c - 2].t === t) || (r >= 2 && b[r - 1][c].t === t && b[r - 2][c].t === t));
        b[r].push(pgNew(t));
      }
    }
    if (pgFindMove(b)) return b;
  }
  return b;
}
/* 타일 이동 애니 · 현재 오프셋에서 0 으로 · ease: inout(바꾸기) · back(튕겨 돌아가기) · drop(떨어짐 · 착지 살짝 튕김) */
function pgAnim(t, ox, oy, d, ease) { t.ox = ox; t.oy = oy; t.ax = ox; t.ay = oy; t.at = 0; t.ad = d; t.ae = ease; }
function pgEase(p, e) {
  if (e === "inout") return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  if (e === "back") { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }
  if (e === "drop") { var d1 = 0.9, d3 = d1 + 1; return 1 + d3 * Math.pow(p - 1, 3) + d1 * Math.pow(p - 1, 2); }
  return 1 - Math.pow(1 - p, 3);
}
/* 움직일 수 없을 때 · 특수 블록은 그대로 두고 자리만 섞는다 */
function pgShuffle() {
  var b = PG.b, all = [];
  b.forEach(function (row) { row.forEach(function (t) { all.push(t); }); });
  for (var tries = 0; tries < 200; tries++) {
    shuf(all);
    for (var i = 0; i < all.length; i++) b[Math.floor(i / PG_N)][i % PG_N] = all[i];
    if (!pgRuns(b).length && pgFindMove(b)) break;
  }
  if (pgRuns(b).length || !pgFindMove(b)) PG.b = pgBoardInit();
  PG.b.forEach(function (row) { row.forEach(function (t) { pgAnim(t, 0, -8, 0.3, "drop"); }); });
  PG.banner = { text: "다시 섞었어요", t: 1.0 };
  PG.shuffles++;
}
function pgStop() { PG.on = false; if (PG.raf) cancelAnimationFrame(PG.raf); PG.raf = 0; gsOverlayClose("pang"); }
/* v3.51 · 팡 효과음은 sfx 이름으로 (톡·슉·뽁·팡팡·쾅·툭) */
/* 캔버스를 화면에 보이는 크기 × 기기 배율로 다시 잡는다(도트 확대 대신 선명한 벡터) · 성능 위해 배율 상한 2.5 */
function pgFit(cv, cssW) {
  var k = Math.min(2.5, window.devicePixelRatio || 1) * cssW / PG_W;
  cv.width = Math.round(PG_W * k); cv.height = Math.round(PG_H * k);
  PG.k = cv.width / PG_W;
  if (PG.on) pgDraw(cv.getContext("2d"), performance.now());
}
function pgStart() {
  pgStop();
  SFX.site = false;
  PG = { on: true, paused: false, ending: null, raf: 0, cd: 3.2, t0: 0, last: performance.now(), b: pgBoardInit(), phase: "idle", sel: null, pair: null, drag: null, k: 1,
    idle: 0, hint: null, hintN: 0, hintT: 0, bar: 0, barPulse: 0, mile: 0, chain: 0, clrT: 0, lines: [], parts: [], pops: [], banner: null, combo: null, msgQ: null, chainEv: 0, score: 0, tiles: 0, maxChain: 0, specials: 0, moves: 0, shuffles: 0, bad: 0, pz: 0 };
  gsOverlayOpen({ key: "pang", title: "AX 팡", cw: PG_W, ch: PG_H, canvasId: "pgCv", noGesture: true, tip: gsTutTake("pang"),
    bottom: '<div class="gs-foot">이웃한 두 칸을 밀어서 바꾸거나, 한 칸 누르고 옆 칸을 누르세요</div>',
    down: pgDown, move: pgMove, up: pgUp, resized: pgFit,
    running: function () { return PG.on && !PG.paused && !PG.ending; }, isPaused: function () { return !!PG.paused; },
    pause: function () { gsPauseState(PG); }, resume: function () { gsResumeState(PG, pgFrame); },
    quit: function () { pgStop(); App.render(); } });
  PG.raf = requestAnimationFrame(pgFrame);
}
function pgFrame() {
  if (!PG.on || PG.paused) return;
  var now = performance.now(), dt = Math.min(0.05, (now - PG.last) / 1000);
  PG.last = now;
  pgUpdate(dt, now);
  var cv = el("pgCv");
  if (!cv) { pgStop(); return; }
  pgDraw(cv.getContext("2d"), now);
  if (PG.on && !PG.paused) PG.raf = requestAnimationFrame(pgFrame);
}
function pgXY(e, cv) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * PG_W / r.width, y: (e.clientY - r.top) * PG_H / r.height }; }
function pgCell(p) {
  var c = Math.floor((p.x - PG_OX) / PG_TS), r = Math.floor((p.y - PG_OY) / PG_TS);
  return r >= 0 && r < PG_N && c >= 0 && c < PG_N ? [r, c] : null;
}
function pgDown(e) {
  e.preventDefault();
  if (!PG.on || PG.paused || PG.ending || PG.cd > 0) return;
  var cv = el("pgCv"); if (!cv) return;
  var p = pgXY(e, cv), cell = pgCell(p);
  PG.drag = cell ? { cell: cell, x: p.x, y: p.y, id: e.pointerId } : null;
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {}
}
function pgMove(e) {
  var d = PG.drag; if (!d || d.id !== e.pointerId) return;
  var cv = el("pgCv"); if (!cv) return;
  var p = pgXY(e, cv), dx = p.x - d.x, dy = p.y - d.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
  PG.drag = null;
  var z = Math.abs(dx) > Math.abs(dy) ? [d.cell[0], d.cell[1] + (dx > 0 ? 1 : -1)] : [d.cell[0] + (dy > 0 ? 1 : -1), d.cell[1]];
  if (z[0] < 0 || z[0] >= PG_N || z[1] < 0 || z[1] >= PG_N) return;
  PG.sel = null;
  pgTrySwap(d.cell, z);
}
function pgUp(e, cancel) {
  var d = PG.drag; PG.drag = null;
  if (!d || cancel || d.id !== e.pointerId) return;
  pgTap(d.cell);
}
/* 탭 두 번 방식 · 옆 칸이면 바꾸고, 아니면 선택을 옮긴다 */
function pgTap(cell) {
  if (!PG.on || PG.paused || PG.ending || PG.cd > 0 || PG.phase !== "idle") return;
  var s = PG.sel;
  if (s && s[0] === cell[0] && s[1] === cell[1]) { PG.sel = null; return; }
  if (s && Math.abs(s[0] - cell[0]) + Math.abs(s[1] - cell[1]) === 1) { PG.sel = null; pgTrySwap(s, cell); return; }
  PG.sel = cell; PG.hint = null; PG.idle = 0; sfx("tok");
}
function pgTrySwap(a, z) {
  if (!PG.on || PG.paused || PG.ending || PG.cd > 0 || PG.phase !== "idle") return false;
  if (Math.abs(a[0] - z[0]) + Math.abs(a[1] - z[1]) !== 1) return false;
  PG.hint = null; PG.idle = 0; PG.moves++;
  pgSwapAnim(a, z, "inout");
  sfx("shook");
  PG.pair = [a, z]; PG.phase = "swap"; PG.chain = 0;
  return true;
}
function pgSwapAnim(a, z, ease) {
  var b = PG.b, ta = b[a[0]][a[1]], tz = b[z[0]][z[1]];
  pgSwapRaw(b, a, z);
  var d = ease === "back" ? 0.26 : 0.15;
  pgAnim(tz, (z[1] - a[1]) * PG_TS, (z[0] - a[0]) * PG_TS, d, ease);
  pgAnim(ta, (a[1] - z[1]) * PG_TS, (a[0] - z[0]) * PG_TS, d, ease);
}
function pgSettle(dt) {
  var moving = false;
  PG.b.forEach(function (row) { row.forEach(function (t) {
    if (!t.ad) return;
    t.at += dt;
    var p = Math.min(1, t.at / t.ad), k = 1 - pgEase(p, t.ae);
    t.ox = t.ax * k; t.oy = t.ay * k;
    if (p >= 1) { t.ox = 0; t.oy = 0; t.ad = 0; } else moving = true;
  }); });
  return moving;
}
/* 점 파티클 · 칸 가운데에서 짧게 퍼진다 */
function pgDots(x, y, n) {
  if (rgReduced()) n = Math.min(n, 3);
  var cols = [PG_C.o100, PG_C.o100, PG_C.o50, PG_C.ink];
  for (var i = 0; i < n && PG.parts.length < 140; i++) {
    var a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    PG.parts.push({ x: x, y: y, a: a, d: 9 + Math.random() * 7, t: 0, life: 0.34 + Math.random() * 0.08, r: 0.9 + Math.random() * 0.7, c: cols[i % cols.length] });
  }
}
/* v4.21 글자가 칸을 넘지 않게 크기를 줄여 맞춘다 (긴 한 줄이 판 밖으로 나가면 읽히지 않는다) */
function pgFitSize(ctx, text, base, maxW, weight) {
  ctx.font = weight + " " + base + "px " + PG_FONT;
  var w = ctx.measureText(text).width;
  return w <= maxW ? base : Math.max(6, base * maxW / w);
}
/* v4.21 연쇄 문구 · 같은 문장이 한 판에 두 번 나오지 않게 비복원으로 뽑는다 */
function pgChainMsg() {
  PG.chainEv = (PG.chainEv || 0) + 1;
  if (PG.ending || PG_MSG_AT.indexOf(PG.chainEv) < 0) return;
  if (!PG.msgQ || !PG.msgQ.length) {
    PG.msgQ = PG_CHAIN_MSG.slice();
    for (var i = PG.msgQ.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = PG.msgQ[i]; PG.msgQ[i] = PG.msgQ[j]; PG.msgQ[j] = t; }
  }
  PG.banner = { text: PG.msgQ.pop(), t: 1.4, msg: true };
}
/* 터뜨리기 · 4개 이상 줄은 그 자리(바꾼 칸이 있으면 그 칸)에 특수 블록 · 특수 블록이 터지면 그 줄 전체 */
function pgClear(runs) {
  PG.chain++;
  /* v3.74 특수 블록(줄 지우기) 폐지 (사용자 피드백 260918 「기능이 이해되지 않고 헷갈린다」)
     4개 이상 한 줄은 그만큼 칸이 많이 터져 점수·목표 진행이 더 빠르다 = 여전히 이득 · 설명이 필요한 장치만 뺐다 */
  var mult = Math.min(PG.chain, 5), b = PG.b, kill = {}, makes = [];
  runs.forEach(function (run) { run.cells.forEach(function (p) { kill[p[0] + "," + p[1]] = 1; }); });
  var n = 0, sx = 0, sy = 0;
  Object.keys(kill).forEach(function (k2) {
    var rc2 = k2.split(","), t2 = b[+rc2[0]][+rc2[1]];
    t2.clr = 1; n++;
    var px = PG_OX + +rc2[1] * PG_TS + 12, py = PG_OY + +rc2[0] * PG_TS + 12;
    sx += px; sy += py;
    pgDots(px, py, n <= 8 ? 7 : 3);
  });
  var cnt = n, gain = cnt * 10 * mult;
  PG.score += gain; PG.tiles += cnt; PG.maxChain = Math.max(PG.maxChain, PG.chain);
  if (n) PG.pops.push({ x: sx / n, y: sy / n, text: "+" + cnt + "칸", t: 0, life: 0.7 });   /* v4.02 점수는 완주 시간 · 팝은 진행(칸)만 */
  if (PG.chain >= 2) PG.combo = { n: mult, t: 0 };
  if (PG.chain === 2) pgChainMsg();   /* v4.21 한 수에 한 번만(연쇄가 3·4단으로 이어져도 다시 뜨지 않는다) · 점수 계산(위 줄)이 끝난 뒤라 올림픽 점수와 무관 */
  /* v3.74 목표 타일을 다 터뜨리면 완주 · 시간이 기록이 된다 */
  if (!PG.ending && PG.tiles >= PG_GOAL) pgEnd("goal");
  sfx(PG.chain >= 2 ? "cascade" : "ppok", PG.chain);
  PG.pair = null; PG.clrT = 0.18; PG.phase = "clear";
}
/* 터진 칸을 비우고 위 그림을 떨어뜨린다 · 새 그림은 위에서 들어온다 · ease-out + 착지 살짝 튕김 */
function pgCollapse() {
  var b = PG.b;
  for (var c = 0; c < PG_N; c++) {
    var w = PG_N - 1;
    for (var r = PG_N - 1; r >= 0; r--) {
      var t = b[r][c];
      if (!t.clr) { if (w !== r) { b[w][c] = t; pgAnim(t, 0, t.oy + (r - w) * PG_TS, 0.2 + 0.035 * (w - r), "drop"); } w--; }
    }
    var miss = w + 1;
    for (var r2 = w; r2 >= 0; r2--) { var nt = pgNew(pgRand()); pgAnim(nt, 0, -miss * PG_TS, 0.2 + 0.035 * miss, "drop"); b[r2][c] = nt; }
  }
}
/* v4.63 (사용자 신고 260929 「게임이 끝났는데 시간이 계속 흐른다」) 끝난 순간(pgEnd)에 시계를 멈춘다 · 완주 연출 5.5초 · 미완주 1.2초 동안 위 줄 초가 계속 올라갔다 */
function pgEl(now) { return PG.t0 ? ((PG.tEnd || now) - PG.t0) / 1000 : 0; }
function pgFx(dt) {
  PG.parts = PG.parts.filter(function (p) { p.t += dt; return p.t < p.life; });
  PG.pops = PG.pops.filter(function (p) { p.t += dt; return p.t < p.life; });
  /* v3.79 진행 막대 · 실제 값으로 0.3초에 걸쳐 따라간다(툭 튀지 않게) · 25·50·75%에서 한 번 맥박 */
  var goalFrac = Math.min(1, PG.tiles / PG_GOAL);
  PG.bar += (goalFrac - PG.bar) * Math.min(1, dt / 0.3);
  if (PG.barPulse > 0) PG.barPulse = Math.max(0, PG.barPulse - dt);
  while (PG.mile < PG_MILE.length && goalFrac >= PG_MILE[PG.mile][0]) {
    var mtxt = PG_MILE[PG.mile][1];
    PG.barPulse = 0.5;
    if (mtxt && !(PG.banner && PG.banner.msg)) PG.banner = { text: mtxt, t: 1.0 };   /* v4.21 연쇄 문구가 떠 있으면 덮지 않는다 */
    PG.mile++;
  }
  if (PG.banner) { PG.banner.t -= dt; if (PG.banner.t <= 0) PG.banner = null; }
  if (PG.combo) { PG.combo.t += dt; if (PG.combo.t > 1.1) PG.combo = null; }
  PG.lines = PG.lines.filter(function (l) { l.t -= dt; return l.t > 0; });
  PG.b.forEach(function (row) { row.forEach(function (t) { if (t.born > 0) t.born = Math.max(0, t.born - dt); }); });
}
function pgUpdate(dt, now) {
  if (PG.ending) {
    PG.ending.t -= dt; pgFx(dt);
    if (PG.ending.t <= 0) pgEndFinal(PG.ending.why);
    return;
  }
  if (PG.cd > 0) {
    var before = Math.ceil(PG.cd); PG.cd -= dt;
    if (Math.ceil(PG.cd) !== before && PG.cd > 0) sfx("tick");
    if (PG.cd <= 0) { PG.t0 = now; sfx("go"); }
    return;
  }
  if (pgEl(now) >= PG_MAX_SEC) { pgEnd("time"); return; }   /* v3.74 120초까지 못 끝내면 미완주 (벌칙 없음) */
  pgFx(dt);
  if (PG.phase === "idle") {
    PG.idle += dt;
    pgSettle(dt);
    /* v3.66 (사용자 피드백 260918 「힌트가 있었는지 몰랐다」) 첫 힌트는 3초, 그 뒤로는 5초마다 다시 켠다.
       입력이 있으면 pgTrySwap·pgTap 이 idle 을 0으로 되돌려 힌트가 꺼진다. 점수에는 영향 없다. */
    if (!PG.hint && PG.idle > (PG.hintN ? PG_HINT_AGAIN : PG_HINT_FIRST)) {
      PG.hint = pgFindMove(PG.b);
      if (PG.hint) {
        PG.hintT = 0;
        if (!PG.hintN) PG.banner = { text: "움직일 수 있는 칸", t: 1.6 };   /* 한 판에 한 번만 · 위 안내 줄 */
        PG.hintN++;
      }
    }
    if (PG.hint) PG.hintT += dt;
  } else if (PG.phase === "swap") {
    if (!pgSettle(dt)) {
      var runs = pgRuns(PG.b);
      if (runs.length) pgClear(runs);
      else { pgSwapAnim(PG.pair[0], PG.pair[1], "back"); PG.pair = null; PG.phase = "back"; PG.bad++; sfx("ttuk"); }
    }
  } else if (PG.phase === "back") {
    if (!pgSettle(dt)) PG.phase = "idle";
  } else if (PG.phase === "clear") {
    PG.clrT -= dt;
    if (PG.clrT <= 0) { pgCollapse(); PG.phase = "fall"; }
  } else if (PG.phase === "fall") {
    if (!pgSettle(dt)) {
      var runs2 = pgRuns(PG.b);
      if (runs2.length) pgClear(runs2);
      else { PG.phase = "idle"; PG.chain = 0; PG.idle = 0; if (!pgFindMove(PG.b)) pgShuffle(); }
    }
  }
}
function pgEnd(why) {
  if (!PG.on || PG.ending) return;
  var done = why === "goal";
  PG.tEnd = performance.now();   /* v4.63 시계 멈춤 · 이 뒤로 pgEl 은 끝난 순간 값 */
  PG.fin = done ? Math.round(pgEl(performance.now()) * 100) : 0;   /* 완주 기록 = 1/100초 */
  PG.sc = done ? olyScore("pang", pgParts()) : 0;                    /* v4.02 완주 시간 → 점수 */
  PG.finBest = done && PG.sc > (Number(S.get("oly2_best_pang", 0)) || 0);
  PG.ending = { t: done ? PG_FIN.fall + PG_FIN.hold : 1.2, why: why, done: done };
  PG.sel = null; PG.hint = null; PG.drag = null;
  if (done) {
    var foot = document.querySelector("#rgPlay .gs-foot");
    if (foot) foot.innerHTML = '<button class="btn mint" style="padding:10px 18px" onclick="pgFinSkip()">결과 보기</button>';
  }
  sfx("fanfare");
}
/* v3.74 완주 연출 · 타일이 아래로 무너지고 뒤에서 슬로건이 드러난다 (transform·투명도만 · 모션 줄이기면 사라지기만) */
/* v3.79 완주 뒤 · 슬로건이 한 줄씩 들어오고, 완주 시간은 크게 · 기록을 깼으면 그 아래 한 줄 */
function pgFinDraw(ctx, now) {
  var e = PG.ending; if (!e || !e.done) return;
  var gone = (PG_FIN.fall + PG_FIN.hold) - e.t, rm = rgReduced();
  var line = function (i) { return rm ? 1 : Math.max(0, Math.min(1, (gone - (PG_FIN.fall * 0.5 + i * PG_FIN.step)) / 0.45)); };
  ctx.save();
  /* v4.21 슬로건 앞 한 줄 · 완주 연출 안에만 둔다(결과 카드에는 넣지 않는다) */
  ctx.globalAlpha = line(0);
  pgText(ctx, PG_FIN_MSG, PG_W / 2, PG_OY + 26, pgFitSize(ctx, PG_FIN_MSG, 9, PG_W - 16, "700"), 700, PG_C.muted, "center");
  ctx.globalAlpha = line(1);
  pgText(ctx, "ME to WE", PG_W / 2, PG_OY + 58, 26, 900, PG_C.o100, "center");
  ctx.globalAlpha = line(2);
  pgText(ctx, "나의 경험을", PG_W / 2, PG_OY + 84, 11, 800, PG_C.tx, "center");   /* v4.83 슬로건 부제 「나의 경험을 우리의 가능성으로」(261001 확정) */
  ctx.globalAlpha = line(3);
  pgText(ctx, "우리의 가능성으로", PG_W / 2, PG_OY + 100, 11, 800, PG_C.tx, "center");
  ctx.globalAlpha = line(4);
  pgText(ctx, (PG.fin / 100).toFixed(1) + "초", PG_W / 2, PG_OY + 132, 26, 900, PG_C.o100, "center");
  pgText(ctx, "완주 = " + olyFmt(PG.sc) + "점", PG_W / 2, PG_OY + 150, 9, 700, PG_C.muted, "center");
  if (PG.finBest) { ctx.globalAlpha = line(5); pgText(ctx, "내 최고 기록", PG_W / 2, PG_OY + 166, 9, 800, PG_C.o100, "center"); }
  ctx.restore();
}
/* 기다리지 않아도 되게 · 아래 버튼이나 화면 탭으로 결과로 넘어간다 */
function pgFinSkip() {
  if (!PG.on || !PG.ending || !PG.ending.done) return;
  pgEndFinal("goal");
}
/* v4.02 제출 구성 요소 · fin 완주 1/100초 · tiles 터뜨린 칸 · moves 바꾼 수 · bad 튕긴 수 · pz 직접 멈춘 횟수 */
function pgParts() { return { fin: PG.fin || 0, tiles: PG.tiles, moves: PG.moves, bad: PG.bad || 0, pz: PG.pz || 0 }; }
function pgEndFinal(why) {
  if (!PG.on) return;
  var done = why === "goal", fin = PG.fin || 0, parts = pgParts();
  PG.ending = null;
  pgStop();
  gameClear("pang_cleared");   /* 미완주여도 스탬프는 적립 */
  var sc = 0;
  if (done) {
    if (PG.finBest) setTimeout(function () { sfx("best"); }, 250);
    sc = olySubmit("pang", parts);
  }
  var root = el("pgRoot"); if (!root) return;
  root.innerHTML = gsResultHtml("pang", done ? { why: "done", reason: "",
    oly: { key: "pang", parts: parts, score: sc, ref: [["터뜨린 칸", PG.tiles + "개"], ["최고 연쇄", PG.maxChain], ["튕긴 수", PG.bad || 0]] } }
    : { why: why, score: "미완주", l2: "완주하면 순위에 올라가요", l3: olyResOly(), ref: [["터뜨린 칸", PG.tiles + " / " + PG_GOAL + "개"], ["최고 연쇄", PG.maxChain]] });
  window.scrollTo(0, 0);
}
function pgText(ctx, text, x, y, size, weight, col, align) {
  ctx.font = weight + " " + size + "px " + PG_FONT; ctx.fillStyle = col; ctx.textAlign = align || "left"; ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}
function pgDraw(ctx, now) {
  ctx.setTransform(PG.k, 0, 0, PG.k, 0, 0);
  ctx.fillStyle = RAIN_PAL.o10; ctx.fillRect(0, 0, PG_W, PG_H);   /* v4.23 살구 바탕(공용 프레임 5-14 · 점프 · 소나기와 같다) */
  /* 위 · 점수(앱 숫자 스타일) · 콤보 팝 · 남은 시간 막대 */
  /* v3.79 진행 막대가 주인공 · 퍼센트를 크게 · 시간은 작게 옆에 */
  var elp = PG.t0 ? pgEl(now) : 0, frac = Math.min(1, PG.tiles / PG_GOAL), shown = Math.max(0, Math.min(1, PG.bar || 0));
  var pctN = Math.round(shown * 100), near = frac >= 0.9;
  /* v4.23 HUD 숫자 = 도트 글꼴 · 캔버스 16 단위(화면 약 25px) · 초 12 단위(화면 약 19px) · 16px 밑으로 그려지지 않는다 */
  ctx.textAlign = "left"; ctx.textBaseline = "middle"; rtText(ctx, pctN + "%", PG_OX, 14, 16, near ? PG_C.o100 : PG_C.tx, null);
  pgText(ctx, PG.tiles + " / " + PG_GOAL, PG_OX + (pctN >= 100 ? 36 : pctN >= 10 ? 28 : 20), 16, 8, 700, PG_C.muted);
  ctx.textAlign = "right"; rtText(ctx, (Math.round(elp * 10) / 10).toFixed(1) + "초", PG_W - PG_OX, 14, 12, PG_C.tx, null);
  if (PG.combo) {
    var cp = Math.min(1, PG.combo.t / 0.2), cs = 1.3 - 0.3 * pgEase(cp, "out"), ca = PG.combo.t > 0.8 ? Math.max(0, 1 - (PG.combo.t - 0.8) / 0.3) : 1;
    ctx.save(); ctx.globalAlpha = ca; ctx.translate(PG_W / 2, 18); ctx.scale(cs, cs);
    pgText(ctx, "콤보 ×" + PG.combo.n, 0, 0, 12, 800, PG_C.o100, "center");
    ctx.restore();
  }
  /* 막대 · 회색 트랙 위 O100 · 이정표에서 한 번 부풀고 · 마지막 10%는 색이 진해지고 테두리가 빛난다 */
  var bh = 7 + (PG.barPulse > 0 ? 2 * Math.sin((0.5 - PG.barPulse) / 0.5 * Math.PI) : 0);
  pgRR(ctx, PG_OX, 27, PG_W - PG_OX * 2, bh, bh / 2); ctx.fillStyle = PG_C.track; ctx.fill();
  if (shown > 0) {
    pgRR(ctx, PG_OX, 27, Math.max(bh, (PG_W - PG_OX * 2) * shown), bh, bh / 2);
    ctx.fillStyle = near ? PG_C.deep || "#D64524" : PG_C.o100; ctx.fill();
    if (near) { ctx.lineWidth = 1.2; ctx.strokeStyle = PG_C.o100; ctx.stroke(); }
  }
  pgBoardDraw(ctx, PG.b, now, true);
  /* 점 파티클 · 떠오르는 점수 */
  PG.parts.forEach(function (p) {
    var q = p.t / p.life, d = p.d * pgEase(q, "out");
    ctx.globalAlpha = 1 - q; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.a) * d, p.y + Math.sin(p.a) * d, p.r, 0, 6.2832); ctx.fill();
  });
  ctx.globalAlpha = 1;
  PG.pops.forEach(function (p) {
    var q = p.t / p.life;
    ctx.globalAlpha = q < 0.6 ? 1 : 1 - (q - 0.6) / 0.4;
    ctx.font = (p.small ? "800 8px " : "800 9px ") + PG_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 2.4; ctx.lineJoin = "round"; ctx.strokeStyle = PG_C.w; ctx.strokeText(p.text, p.x, p.y - 8 * pgEase(q, "out"));
    ctx.fillStyle = p.small ? PG_C.o100 : PG_C.ink; ctx.fillText(p.text, p.x, p.y - 8 * pgEase(q, "out"));
  });
  ctx.globalAlpha = 1;
  var by = PG_OY + PG_N * PG_TS;
  pgText(ctx, "같은 그림 3개를 한 줄로", PG_W / 2, by + 11, 8, 600, PG_C.muted, "center");
  if (PG.banner) {
    /* v3.73 안내 줄은 판 아래 정보 줄 자리에 · 타일을 가리거나 판을 밀지 않는다 */
    /* v4.21 연쇄 문구는 문장이라 길다 · 칸을 넘지 않게 글자 크기를 줄여 맞춘다 */
    var bfs = pgFitSize(ctx, PG.banner.text, 9, PG_W - 24, "700");
    var bw = Math.min(PG_W - 6, ctx.measureText(PG.banner.text).width + 16), by2 = PG_OY + PG_N * PG_TS + 2;
    pgRR(ctx, PG_W / 2 - bw / 2, by2, bw, 17, 8); ctx.fillStyle = PG_C.ink; ctx.fill();
    pgText(ctx, PG.banner.text, PG_W / 2, by2 + 9, bfs, 700, PG_C.w, "center");
  }
  if (PG.ending || PG.cd > 0) {
    if (PG.ending && PG.ending.done) {
      /* v3.74 완주 · 타일이 무너지고 뒤에서 슬로건이 드러난다 (판 위에 흰 막을 서서히 덮는다) */
      var gone2 = (PG_FIN.fall + PG_FIN.hold) - PG.ending.t;
      ctx.fillStyle = "rgba(255,255,255," + Math.min(0.96, Math.max(0, gone2 / PG_FIN.fall)).toFixed(3) + ")";
      ctx.fillRect(0, PG_OY - 4, PG_W, PG_N * PG_TS + 8);
      pgFinDraw(ctx, now);
      return;
    }
    if (PG.ending) {
      /* v4.23 공용 끝 화면(rtEnd · 소나기 · 다섯 게임 한 벌) · 캔버스 단위(180 폭) · 제목 24(화면 약 38px) · 한 줄 12(약 19px) · 옛 「시간 종료」 카드 대신 */
      rtEnd(ctx, PG_W, PG_OY - 4, PG_OY + PG_N * PG_TS + 4, PG.ending.why === "time" ? "TIME UP" : "GAME OVER", "터뜨린 칸 " + PG.tiles + " / " + PG_GOAL, { s: 1.5, tp: 24, sp: 12, maxW: PG_W - 12 });
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.fillRect(0, PG_OY - 4, PG_W, PG_N * PG_TS + 8);
      var n = PG.cd > 1 ? String(Math.ceil(PG.cd - 0.2)) : "시작", f = PG.cd % 1, s = 1 + 0.15 * Math.max(0, f - 0.7) / 0.3;
      ctx.save(); ctx.translate(PG_W / 2, PG_OY + PG_N * PG_TS / 2); ctx.scale(s, s);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      rtText(ctx, n, 0, 0, n.length > 1 ? 24 : 40, PG_C.o100, RAIN_PAL.ink);   /* v4.23 도트 카운트다운 */
      ctx.restore();
    }
  }
}
/* v4.23 2단계(260923 사용자 확정 · 레트로 시안 §2) · 타일 = 먹색 외곽선 1.4 + 모서리 한 칸 비움 + 도트 명암(위·왼쪽 밝게 · 아래·오른쪽 어둡게) · 판정 상자와 무관한 그림뿐 */
function pgPxTile(ctx, h, fill) {
  var e = 1.4, x = -h, w = h * 2, d = 1.6;
  ctx.fillStyle = PG_C.ink; ctx.fillRect(x + e, x, w - 2 * e, w); ctx.fillRect(x, x + e, w, w - 2 * e);
  ctx.fillStyle = fill; ctx.fillRect(x + e, x + e, w - 2 * e, w - 2 * e);
  ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.fillRect(x + e, x + e, w - 2 * e, d); ctx.fillRect(x + e, x + e, d, w - 2 * e);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(x + e, x + w - e - d, w - 2 * e, d); ctx.fillRect(x + w - e - d, x + e, d, w - 2 * e);
}
function pgBoardDraw(ctx, b, now, live) {
  /* v3.74 완주 연출 · 열마다 시차를 두고 아래로 무너진다 · 모션 줄이기면 그 자리에서 사라진다 */
  var fin = PG.ending && PG.ending.done ? Math.min(1, ((PG_FIN.fall + PG_FIN.hold) - PG.ending.t) / PG_FIN.fall) : 0;
  var finRm = fin && rgReduced();
  var bw = PG_N * PG_TS;
  ctx.save();
  pgRR(ctx, PG_OX - 2, PG_OY - 2, bw + 4, bw + 4, 8); ctx.clip();
  var hintOn = live && PG.hint;
  var rmH = rgReduced();
  var pulse = rmH ? 1.06 : 1 + 0.14 * (0.5 + 0.5 * Math.sin(now / 260));   /* v3.66 느리고 크게 · 360px 에서 보이게 */
  for (var r = 0; r < PG_N; r++) for (var c = 0; c < PG_N; c++) {
    var t = b[r][c], cx = PG_OX + c * PG_TS + 12 + t.ox, cy = PG_OY + r * PG_TS + 12 + t.oy;
    var sc = 1, al = 1;
    if (t.clr) { var q = live ? 1 - Math.max(0, PG.clrT / 0.18) : 0; sc = 1 - 0.4 * q; al = 1 - q; }
    var isHint = hintOn && ((PG.hint[0][0] === r && PG.hint[0][1] === c) || (PG.hint[1][0] === r && PG.hint[1][1] === c));
    if (isHint) { sc *= pulse; cy -= rmH ? 0 : 1.2; }
    if (fin) {
      var lag = Math.max(0, Math.min(1, (fin - c * 0.045) / 0.6));
      if (finRm) al *= 1 - fin;
      else { cy += lag * lag * (PG_H + 40); al *= 1 - lag * 0.9; }
    }
    if (t.born > 0) sc *= 1 + 0.25 * (t.born / 0.3);
    if (al <= 0) continue;
    var sel = live && PG.sel && PG.sel[0] === r && PG.sel[1] === c;
    ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy); ctx.scale(sc, sc);
    if (isHint) {   /* v3.66 오렌지 테두리 고리 · 타일보다 한 겹 밖에 */
      pgRR(ctx, -13.4, -13.4, 26.8, 26.8, 1.5);   /* v4.23 각진 고리 */
      ctx.lineWidth = 2.2; ctx.strokeStyle = PG_C.o100; ctx.stroke();
    }
    var st = PG_TILE[t.t], half = 10.8;
    pgPxTile(ctx, half, st.fill);   /* v4.23 2단계 · 둥근 얇은 선 → 먹색 외곽선 + 계단 모서리 + 도트 명암 · 칸 크기 · 자리 · 판정은 그대로(그림만) */
    pgIconDraw(ctx, t.t, 0, 0, 13.5, st.ic);
    if (sel) { pgRR(ctx, -half - 1.4, -half - 1.4, half * 2 + 2.8, half * 2 + 2.8, 1.5); ctx.lineWidth = 1.6; ctx.strokeStyle = PG_C.o100; ctx.stroke(); }
    ctx.restore();
  }
  if (live) PG.lines.forEach(function (l) {
    ctx.globalAlpha = Math.min(1, l.t / 0.28); ctx.fillStyle = PG_C.o100;
    if (l.dir === "h") pgRR(ctx, PG_OX, PG_OY + l.r * PG_TS + 11, bw, 2, 1); else pgRR(ctx, PG_OX + l.c * PG_TS + 11, PG_OY, 2, bw, 1);
    ctx.fill(); ctx.globalAlpha = 1;
  });
  ctx.restore();
}
/* v4.11 시작 화면 미리보기 · 실제 판(pgBoardInit · pgFindMove · pgSwapRaw · pgRuns · pgBoardDraw) · 가능한 수 고리 1초 → 바꾸기 0.3초 → 터진 칸 새 그림 · 2.6초마다 반복 */
var PGD = null;
function pgPreview(t) {
  var cv = el("pgPrev"); if (!cv) return;
  if (t == null) t = 0.5;
  var k = gspK(), P = 2.6, cyc = Math.floor(t / P), u = t - cyc * P;
  if (cv.width !== PG_W * k) { cv.width = PG_W * k; cv.height = 174 * k; }
  if (!PGD || PGD.cv !== cv) PGD = { cv: cv, cyc: null };
  if (PGD.cyc !== cyc) {
    if (!PGD.b || pgRuns(PGD.b).length || !pgFindMove(PGD.b)) PGD.b = pgBoardInit();
    PGD.b.forEach(function (row) { row.forEach(function (x) { x.ox = x.oy = 0; x.born = 0; }); });
    PGD.mv = pgFindMove(PGD.b); PGD.cyc = cyc; PGD.done = false; PGD.nw = [];
  }
  var b = PGD.b, a = PGD.mv[0], z = PGD.mv[1];
  if (u >= 1.3 && !PGD.done) {
    b[a[0]][a[1]].ox = b[a[0]][a[1]].oy = b[z[0]][z[1]].ox = b[z[0]][z[1]].oy = 0;
    pgSwapRaw(b, a, z);
    var cl = []; pgRuns(b).forEach(function (run) { run.cells.forEach(function (q) { cl.push(q); }); });
    for (var tr = 0; tr < 30; tr++) { cl.forEach(function (q) { b[q[0]][q[1]] = pgNew(pgRand()); }); if (!pgRuns(b).length) break; }   /* 새 그림은 줄이 안 생기게 */
    cl.forEach(function (q) { PGD.nw.push(b[q[0]][q[1]]); });
    PGD.done = true;
  }
  if (!PGD.done && u >= 1.0) {
    var p = pgEase(Math.min(1, (u - 1.0) / 0.3), "inout"), dx = (z[1] - a[1]) * PG_TS * p, dy = (z[0] - a[0]) * PG_TS * p;
    b[a[0]][a[1]].ox = dx; b[a[0]][a[1]].oy = dy; b[z[0]][z[1]].ox = -dx; b[z[0]][z[1]].oy = -dy;
  }
  PGD.nw.forEach(function (x) { x.born = Math.max(0, 0.3 - (u - 1.3)); });
  var ctx = cv.getContext("2d");
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = RAIN_PAL.o10; ctx.fillRect(0, 0, PG_W, 174);   /* v4.23 게임과 같은 살구 바탕 */
  ctx.translate(0, -(PG_OY - 3));
  pgBoardDraw(ctx, b, 0, false);
  if (!PGD.done && u < 1.0) [a, z].forEach(function (q) {   /* 게임의 힌트 고리와 같은 모양 */
    pgRR(ctx, PG_OX + q[1] * PG_TS + 12 - 13.4, PG_OY + q[0] * PG_TS + 12 - 13.4, 26.8, 26.8, 6);
    ctx.lineWidth = 2.2; ctx.strokeStyle = PG_C.o100; ctx.stroke();
  });
}
