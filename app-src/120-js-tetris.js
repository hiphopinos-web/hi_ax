/* ════════════════ v3.86 테트리스 (사용자 확정 260918 · 휴대폰의 단어 소나기 자리) ════════════════
   왜 바꿨나: 휴대폰 한글 입력(IME)에 기대는 게임이라 실기에서 오류가 잦았다 → 글자 입력이 아예 없는 게임으로 바꾼다.
   1F 현장 타자왕전(노트북 · 물리 키보드 · 경품)은 그대로다 · 소나기 엔진과 화면은 type_site 전용으로 살아 있다.
   규칙: 10×20 · 블록 7종 · 회전(막히면 좌우·위로 한 칸씩 밀어 본다) · 한 칸 내리기 · 즉시 떨어뜨리기 ·
        한 번에 지운 줄 1/2/3/4 = 100/300/500/800 × 레벨 · TT_LV_LINES 줄마다 레벨 +1 → 낙하가 빨라진다 · 안전 상한 5분.
   기록 = 버틴 시간(1/100초 · 길수록 좋다 · v3.87 사용자 확정) · 지운 줄·점수·레벨은 결과 카드의 보조 지표 · 올림픽 목표 60초.
   조작: 화면 아래 가상 버튼이 기본이다(늘 보인다 · 최소 54px + 히트 영역 5~8px · 좌·우·한 칸은 누르고 있으면 0.17초 뒤 0.05초마다 반복 · 마지막 누름 우선).
        쓸어넘기기(좌우 이동 · 아래 내리기 · 위로 즉시 떨어뜨리기 · 탭 회전)는 보조로 같이 동작한다.
   보기: v3.48 플랫 · 흰 바탕 · 블록 7종은 채움이 모두 다르다 · 유령 블록 · 다음 블록 · 줄 지울 때 번쩍임. 이모지 없음. */
var TT_COLS = 10, TT_ROWS = 20, TT_MAX_SEC = 300;
var TT_DAS = 0.17, TT_ARR = 0.05, TT_SOFT_REP = 0.05;      /* v4.01 누르고 있을 때 · 첫 반복까지 0.17초, 그다음 0.05초 (구 0.22 / 0.07) */
var TT_LOCK = 0.5, TT_LOCK_MAX = 12;                        /* 바닥에 닿고 고정될 때까지 · 움직이면 미뤄지되 12번까지 */
/* v4.02 (점수 체계 v2) 줄 점수 × 레벨 · 한 칸 내리기 +1 · 바닥까지 +2 는 폐지 · 점수 = olyScore("tetris", ttParts()) · 레벨은 낙하 속도에만 쓴다 */
var TT_PIECES = {
  I: { c: "o100", m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
  O: { c: "ink", m: [[1, 1], [1, 1]] },
  T: { c: "o50", m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
  S: { c: "deep", m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
  Z: { c: "o25", m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
  J: { c: "w", m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
  L: { c: "gray", m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] }
};
var TT_KEYS = ["I", "O", "T", "S", "Z", "J", "L"];
/* v3.95 블록 채움 7색 · 오렌지 사다리 4단 + 무채색 3단(숯·회·웜화이트) · 가장자리는 채움을 한 단 어둡게 1px · 글자는 채움 밝기로 흰/먹 */
var TT_FILL = { I: "#FF7E31", O: "#2A2522", T: "#FFA46E", S: "#D64524", Z: "#FFCFB0", J: "#F6F1ED", L: "#B8AEA6" };
var TT_INK = { I: "#FFFFFF", O: "#FFFFFF", T: "#1F1B18", S: "#FFFFFF", Z: "#1F1B18", J: "#1F1B18", L: "#1F1B18" };
function ttFill(k) { return TT_FILL[k] || RAIN_PAL.gray; }
function ttInk(k) { return TT_INK[k] || RAIN_PAL.ink; }
/* 지금 떨어지는 블록 = 채움을 흰색 쪽으로 14% 밝힌다 */
function ttLift(hex) {
  var n = parseInt(hex.slice(1), 16), m = function (v) { return Math.round(v + (255 - v) * 0.14); };
  return "rgb(" + m(n >> 16) + "," + m((n >> 8) & 255) + "," + m(n & 255) + ")";
}
/* v3.87 (사용자 요청 260918) 블록마다 짧은 말 한 조각 · 장식일 뿐 설명·팝업은 없다.
   블록 한 칸에만 찍는다(모든 칸에 쓰면 판이 지저분하다) · 칸이 TT_TOK_MIN 보다 작으면 글자를 아예 안 쓴다(뭉개느니 빼는 쪽). */
var TT_TOKEN = { I: "ME", O: "to", T: "WE", S: "AX", Z: "공감", J: "참여", L: "연결" };
/* v4.21 (사용자 확정 260923) 흩어져 떨어지던 조각이 맞물려 한 번에 여러 줄이 사라지는 순간에만 한 줄.
   한 줄 지우기는 너무 자주 일어나 걸지 않는다(플래시카드가 되면 재미가 죽는다 · 단어 소나기에서 겪은 실패).
   블록 위 브랜드 글자(TT_TOKEN)는 그대로 두고, 자리도 겹치지 않는다. 점수·판정에는 관여하지 않는다. */
var TT_LINE_MSG = [
  "흩어진 기록이 한 번에 모여 답이 됐다",
  "따로면 못 봤을 걸 한 번에 봤다",
  "쌓여만 있던 것이 정리됐다",
  "조각들이 맞아떨어지니 그림이 보였다",
  "여기저기 있던 자료가 하나로 합쳐졌다"
];
var TT_LINE_MSG4 = "이만큼이 한 번에 풀리는 걸, 보통은 못 본다";   /* 4줄 = 가장 드문 한 판 · 이때만 따로 */
var TT_TOK_MIN = 23;
var TT_CLEAR_SEC = 0.2, TT_FLASH_SEC = 0.08;   /* v3.95 줄 지우기 연출 · 흰 번쩍 0.08초 → 세로로 접힘 0.12초 (구 0.28초 깜빡임) */
var TT_LV_LINES = 3;   /* v3.87e (사용자 피드백 260918 「단계가 30% 정도 빨리 올라가면 좋겠다」) 레벨 상승에 필요한 줄 수 5 → 3 · 4줄로는 보통 한 판(2~4줄)에서 레벨이 한 번도 안 올랐다(실측) */
var TT_KICK = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]];   /* 벽·블록에 막히면 이 순서로 밀어 본다 */
var TT = { on: false, raf: 0, L: null, parts: [], pops: [] };

function ttStop() { TT.on = false; if (TT.raf) cancelAnimationFrame(TT.raf); TT.raf = 0; gsOverlayClose("tetris"); }
/* 진동 · 지원 기기만(iOS 는 navigator.vibrate 가 없어 조용히 넘어간다) · 동작 줄이기 설정이면 끈다 · 소리 설정과는 묶지 않는다(소리는 기본 꺼짐) */
function ttVib(ms) { try { if (navigator.vibrate && !rgReduced() && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) {} }
function ttGridNew() { var g = []; for (var y = 0; y < TT_ROWS; y++) { g.push([]); for (var x = 0; x < TT_COLS; x++) g[y].push(""); } return g; }
/* 글자를 얹을 칸 = 블록 중심에 가장 가까운 칸 (회전해도 자연스럽게 따라간다) */
function ttTokCell(m) {
  var cells = [], sx = 0, sy = 0;
  for (var y = 0; y < m.length; y++) for (var x = 0; x < m[y].length; x++) if (m[y][x]) { cells.push([x, y]); sx += x; sy += y; }
  if (!cells.length) return null;
  var cx = sx / cells.length, cy = sy / cells.length, best = cells[0], bd = 1e9;
  cells.forEach(function (c) { var d = (c[0] - cx) * (c[0] - cx) + (c[1] - cy) * (c[1] - cy); if (d < bd) { bd = d; best = c; } });
  return best;
}
function ttBag() { return shuf(TT_KEYS.slice()); }
function ttNextKey() { if (!TT.bag || !TT.bag.length) TT.bag = ttBag(); return TT.bag.pop(); }
function ttMake(k) {
  var m = TT_PIECES[k].m.map(function (r) { return r.slice(); });
  return { k: k, m: m, x: Math.floor((TT_COLS - m[0].length) / 2), y: k === "O" ? 0 : -1 };
}
function ttHit(m, px, py) {
  for (var y = 0; y < m.length; y++) for (var x = 0; x < m[y].length; x++) {
    if (!m[y][x]) continue;
    var bx = px + x, by = py + y;
    if (bx < 0 || bx >= TT_COLS || by >= TT_ROWS) return true;
    if (by >= 0 && TT.grid[by][bx]) return true;
  }
  return false;
}
function ttSpawn() {
  TT.cur = ttMake((TT.nextQ && TT.nextQ.length ? TT.nextQ.shift() : ttNextKey()));
  while (!TT.nextQ || TT.nextQ.length < 2) { TT.nextQ = TT.nextQ || []; TT.nextQ.push(ttNextKey()); }
  TT.nextK = TT.nextQ[0];
  TT.lockT = 0; TT.lockN = 0; TT.gt = 0; TT.pieces++;
  if (ttHit(TT.cur.m, TT.cur.x, TT.cur.y)) { TT.cur.dead = 1; ttEnd("top"); }
}
function ttMove(dx) {
  if (ttHit(TT.cur.m, TT.cur.x + dx, TT.cur.y)) return false;
  TT.cur.x += dx; ttTouch(); sfx("tik");
  return true;
}
function ttRotate(dir) {
  var n = TT.cur.m.length, out = [];
  for (var y = 0; y < n; y++) { out.push([]); for (var x = 0; x < n; x++) out[y].push(dir > 0 ? TT.cur.m[n - 1 - x][y] : TT.cur.m[x][n - 1 - y]); }
  for (var i = 0; i < TT_KICK.length; i++) {
    var kx = TT.cur.x + TT_KICK[i][0], ky = TT.cur.y + TT_KICK[i][1];
    if (!ttHit(out, kx, ky)) { TT.cur.m = out; TT.cur.x = kx; TT.cur.y = ky; ttTouch(); sfx("ppyong"); return true; }
  }
  return false;
}
/* 바닥에 닿은 뒤 움직이면 고정을 조금 미뤄 준다 (열두 번까지) */
function ttTouch() { if (ttHit(TT.cur.m, TT.cur.x, TT.cur.y + 1)) { TT.lockT = 0; TT.lockN++; } }
function ttSoft() {
  if (ttHit(TT.cur.m, TT.cur.x, TT.cur.y + 1)) return false;
  TT.cur.y++; TT.gt = 0; TT.lockT = 0;
  return true;
}
function ttHard() {
  var n = 0;
  while (!ttHit(TT.cur.m, TT.cur.x, TT.cur.y + 1)) { TT.cur.y++; n++; }
  TT.drop = { y: TT.cur.y, t: 0.18 };
  TT.shake = rgReduced() ? 0 : 0.12;
  sfx("kwang"); ttVib(16);
  ttLock();
  return true;
}
/* v5.57 (사용자 261004 「테트리스 게임의 가이드는 2단계 넘어가면 없애자」) 유령 블록(떨어질 자리 점선 외곽선)은 LEVEL 1 · 2 에서만 · LEVEL 3 부터는 그리지 않는다 · 점수 · 판정 · 서버 그대로 */
var TT_GHOST_LV = 2;
function ttGhostY() {
  var gy = TT.cur.y;
  while (!ttHit(TT.cur.m, TT.cur.x, gy + 1)) gy++;
  return gy;
}
function ttLock() {
  var c = TT.cur, full = [], tk = ttTokCell(c.m);
  for (var y = 0; y < c.m.length; y++) for (var x = 0; x < c.m[y].length; x++) {
    if (!c.m[y][x]) continue;
    var by = c.y + y, bx = c.x + x;
    if (by < 0) { ttEnd("top"); return; }
    TT.grid[by][bx] = c.k;
    TT.tok[by][bx] = (tk && tk[0] === x && tk[1] === y) ? (TT_TOKEN[c.k] || "") : "";   /* 글자는 한 칸에만 남는다 */
  }
  TT.cur = null;
  var s0 = TT.score;
  TT.locked++;   /* v4.02 바닥에 고정된 블록만 센다 (천장에 닿아 못 놓인 마지막 블록은 빠진다) */
  for (var r = 0; r < TT_ROWS; r++) {
    var ok = true;
    for (var q = 0; q < TT_COLS; q++) if (!TT.grid[r][q]) { ok = false; break; }
    if (ok) full.push(r);
  }
  if (full.length) {
    TT.flash = { rows: full, t: TT_CLEAR_SEC };
    TT.clears[full.length - 1]++;
    ttScore(s0, full.length);
    sfx(full.length >= 4 ? "fanfare" : "ting"); ttVib(full.length >= 2 ? 24 : 12);
    return;
  }
  ttScore(s0, 0);
  sfx("puck");
  if (!TT.ending) ttSpawn();
}
/* v4.02 제출 구성 요소 · blk 놓은 블록 · c1~c4 한 번에 1~4줄 지운 횟수 · lines 지운 줄 · lv 레벨 · surv 버틴 1/100초(참고) · pz 직접 멈춘 횟수
   줄 수는 지운 횟수에서 바로 센다(줄이 사라지는 연출 중에 판이 끝나도 앞뒤가 맞게) */
function ttParts() {
  var c = TT.clears, lines = c[0] + 2 * c[1] + 3 * c[2] + 4 * c[3];
  return { blk: TT.locked || 0, c1: c[0], c2: c[1], c3: c[2], c4: c[3], lines: lines, lv: Math.min(15, 1 + Math.floor(lines / TT_LV_LINES)), surv: Math.round((TT.surv || 0) * 100), pz: TT.pz || 0 };
}
/* v4.21 2줄 이상 한 번에 지웠을 때 한 줄 · 같은 문장이 연달아 나오지 않게 비복원으로 뽑는다 */
function ttLineMsg(n) {
  if (TT.ending) return;
  if (n >= 4) { TT.msg = { text: TT_LINE_MSG4, t: 1.6 }; return; }
  if (!TT.msgQ || !TT.msgQ.length) {
    TT.msgQ = TT_LINE_MSG.slice();
    for (var i = TT.msgQ.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = TT.msgQ[i]; TT.msgQ[i] = TT.msgQ[j]; TT.msgQ[j] = t; }
  }
  TT.msg = { text: TT.msgQ.pop(), t: 1.4 };
}
/* 블록을 놓을 때마다 점수 다시 계산 · 팝 = 블록 +10(60개까지) · 줄 「2줄 +120」 · 3,000 에 닿으면 만점 종료 */
function ttScore(s0, n) {
  TT.score = olyScore("tetris", ttParts());
  var d = TT.score - s0, x = TT.L ? TT.L.bw / 2 : 100;
  if (n) TT.pops.push({ x: x, y: 40, text: n + "줄 +" + d, t: 0.9, c: RAIN_PAL.o100 });
  if (n >= 2) ttLineMsg(n);   /* v4.21 점수(위 줄)를 다 계산한 뒤 표시만 얹는다 */
  else if (d > 0) TT.pops.push({ x: x, y: 58, text: "+" + d, t: 0.5, c: RAIN_PAL.ink });
  if (TT.score >= olyCap() && !TT.ending) ttEnd("full");
}
function ttCollapse() {
  var rows = TT.flash.rows;
  TT.flash = null;
  rows.sort(function (a, b) { return a - b; }).forEach(function (r) {
    TT.grid.splice(r, 1); TT.grid.unshift(["", "", "", "", "", "", "", "", "", ""]);
    TT.tok.splice(r, 1); TT.tok.unshift(["", "", "", "", "", "", "", "", "", ""]);
  });
  TT.lines += rows.length;
  var lv = Math.min(15, 1 + Math.floor(TT.lines / TT_LV_LINES));
  if (lv > TT.level) { TT.level = lv; TT.banner = { text: "LEVEL " + lv, t: 1.1 }; sfx("level"); }
  ttSpawn();
}
/* 레벨이 오를수록 빨라진다 · 15레벨에서 0.06초 → 어떤 실력이어도 결국 쌓여서 끝난다 */
function ttGrav() { return Math.max(0.06, 0.85 * Math.pow(0.8, TT.level - 1)); }
function ttAct(k) {
  if (!TT.on || TT.paused || TT.ending || TT.cd > 0 || TT.flash || !TT.cur) return false;
  if (k === "L") return ttMove(-1);
  if (k === "R") return ttMove(1);
  if (k === "ROT") return ttRotate(1);
  if (k === "ROTL") return ttRotate(-1);   /* v3.87b 반시계 회전 */
  if (k === "SOFT") return ttSoft();
  if (k === "HARD") return ttHard();
  return false;
}
/* rep = 반복 중인 호출 또는 키보드(진동·반복 예약 없음 · 키보드는 OS 반복을 쓴다)
   v4.01 누르고 있는 이동 버튼 목록 TT.held · 마지막에 누른 것이 반복한다 · 그걸 떼면 아직 누르고 있는 것으로 이어간다 */
var TT_HOLD = { L: 1, R: 1, SOFT: 1 };
function ttDo(k, rep) {
  var ok = ttAct(k);
  if (!rep) {
    ttVib(k === "HARD" ? 14 : 10);
    if (TT_HOLD[k] && TT.on && !TT.paused && !TT.ending) {
      TT.held = (TT.held || []).filter(function (h) { return h !== k; }); TT.held.push(k);
      TT.rep = { k: k, t: TT_DAS };
    }
  }
  return ok;
}
function ttRelease(k) {
  if (!TT_HOLD[k]) return;
  TT.held = (TT.held || []).filter(function (h) { return h !== k; });
  if (TT.rep && TT.rep.k === k) {
    var nk = TT.held.length ? TT.held[TT.held.length - 1] : "";
    TT.rep = nk ? { k: nk, t: TT_DAS } : null;
  }
}
/* 모든 누름을 푼다 · 일시정지 · 화면 이탈 · 창 포커스 잃음 · 끝 */
function ttPadReset() {
  TT.rep = null; TT.held = [];
  var pad = el("ttPad");
  if (pad) Array.prototype.forEach.call(pad.querySelectorAll("[data-k]"), function (b) { b._pid = null; b.classList.remove("on"); });
}
function ttStart() {
  ttStop();
  SFX.site = false;
  TT = { on: true, paused: false, ending: null, raf: 0, cd: 3.2, t0: 0, last: performance.now(), L: null, dpr: 1,
    grid: ttGridNew(), tok: ttGridNew(), bag: null, cur: null, nextK: null, lines: 0, score: 0, level: 1, pieces: 0, surv: 0,
    clears: [0, 0, 0, 0], gt: 0, lockT: 0, lockN: 0, flash: null, drop: null, rep: null, held: [], sw: null, locked: 0, pz: 0,
    parts: [], pops: [], banner: null, msg: null, shake: 0, hud: "" };
  TT.nextQ = [ttNextKey(), ttNextKey()];   /* v3.87b 다음 블록 두 개를 보여 준다 */
  TT.nextK = TT.nextQ[0];
  gsOverlayOpen({ key: "tetris", title: "테트리스", top: ttTopHtml(), fill: true, cls: "tetris", cw: 200, ch: 360, canvasId: "ttCv", flat: true, tip: gsTutTake("tetris"),
    bottom: ttPadHtml(),
    resized: ttFit,
    down: function (e) { e.preventDefault(); TT.sw = { x: e.clientX, y: e.clientY, mx: e.clientX, my: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), moved: 0 }; },
    move: function (e) {
      var s = TT.sw; if (!s) return;
      var cell = (TT.L && TT.L.cell) || 24, dx = e.clientX - s.mx, dy = e.clientY - s.my;
      s.lx = e.clientX; s.ly = e.clientY;
      if (Math.abs(dx) >= cell) { var n = Math.round(dx / cell); for (var i = 0; i < Math.abs(n); i++) ttAct(n > 0 ? "R" : "L"); s.mx += n * cell; s.moved++; }
      if (dy >= cell) { ttAct("SOFT"); s.my += cell; s.moved++; }
    },
    up: function (e, cancel) {
      var s = TT.sw; TT.sw = null;
      if (!s) return;
      /* v3.87d 취소(pointercancel)로 끝나도 마지막으로 본 위치로 판정한다 · 실기에서 위로 쓸기가 취소로 끝나는 일이 있다 */
      var ex = cancel ? s.lx : e.clientX, ey = cancel ? s.ly : e.clientY;
      var dt = performance.now() - s.t, dx = ex - s.x, dy = ey - s.y;
      if (!s.moved && Math.abs(dx) < 14 && Math.abs(dy) < 14 && dt < 320 && !cancel) { ttDo("ROT", false); return; }
      if (dy < -55 && dt < 450) ttDo("HARD", false);            /* 위로 쓸기 = 즉시 떨어뜨리기 */
      else if (dy > 150 && dt < 550) ttDo("HARD", false);       /* 아래로 길게 쓸기도 즉시 떨어뜨리기 */
    },
    keydown: function (e) {
      var k = e.key === "ArrowLeft" ? "L" : e.key === "ArrowRight" ? "R" : e.key === "ArrowDown" ? "SOFT" : (e.key === "ArrowUp" || e.key === "x") ? "ROT" : (e.key === "z" || e.key === "Z") ? "ROTL" : (e.code === "Space" || e.key === " ") ? "HARD" : "";
      if (!k) return;
      e.preventDefault();
      ttDo(k, true);   /* v4.01 키보드는 OS 반복을 쓴다 · 뗌(keyup)을 받지 않으므로 버튼 반복을 걸면 멈추지 않는다 */
    },
    running: function () { return TT.on && !TT.paused && !TT.ending; }, isPaused: function () { return !!TT.paused; },
    pause: function () { ttPadReset(); gsPauseState(TT); }, resume: function () { gsResumeState(TT, ttFrame); },
    quit: function () { ttStop(); App.render(); } });
  ttBindPad();
  if (!ttPadReset.bound) { ttPadReset.bound = true; window.addEventListener("blur", ttPadReset); }
  TT.raf = requestAnimationFrame(ttFrame);
}
function ttTopHtml() {
  return '<div class="rg-hud">' +
    '<span class="rg-sc tm"><small>점수</small><b id="ttHudSc">0</b></span>' +   /* v4.02 생존 칸 → 점수 (시간은 점수가 아니다) */
    '<span class="rg-sc"><small>줄</small><b id="ttHudLn">0</b></span>' +
    '<span class="rg-sc"><small>레벨</small><b id="ttHudLv">1</b></span>' +
    '<span style="flex:1"></span>' +
    sndBtnHtml(false) +
    '<button class="rg-ib rgp-x" type="button" data-on="계속" data-off="멈춤" aria-label="일시정지" onpointerdown="event.preventDefault()" onclick="gsPauseToggle()">멈춤</button></div>';   /* v3.87b 멈춤은 위 줄에 둔다 · 조작 묶음 옆에 두면 360px 폭에서 겹치고 잘못 눌린다 */
}
/* v3.87d (사용자 확정 260918) 버튼 네 개.
   왼손 = 왼쪽 · 오른쪽 · 한 칸 내리기 (십자의 위 칸은 없앴다) · 오른손 = 아래 안쪽 회전(시계만) · 대각선 위 바닥까지.
   판 아래 빈 띠에만 두어 블록이 떨어지는 자리를 가리지 않는다 · 쓸어넘기기(위로 쓸면 바닥까지)는 그대로 보조로 동작한다. */
function ttPadHtml() {
  /* v4.01 벡터 글리프 · 이동 = 둥근 삼각형(채움) · 회전 = 시계 방향 원호 + 화살촉 · 바닥까지 = 겹화살 + 바닥 선 */
  var A = ' fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"', S = ' fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  var L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path' + A + ' d="M15.5 5.5 L7.5 12 L15.5 18.5 Z"/></svg>';
  var R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path' + A + ' d="M8.5 5.5 L16.5 12 L8.5 18.5 Z"/></svg>';
  var DN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path' + A + ' d="M5.5 8.5 L12 16.5 L18.5 8.5 Z"/></svg>';
  var HD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path' + S + ' stroke-width="2.6" d="M6.5 3.5 L12 9 L17.5 3.5 M6.5 10 L12 15.5 L17.5 10 M5 20.5 H19"/></svg>';
  var CW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path' + S + ' stroke-width="2.6" d="M12 4.5 A7.5 7.5 0 1 1 4.5 12"/><path' + A + ' stroke-width="1.4" d="M1 12.8 L4.5 7 L8 12.8 Z"/></svg>';
  return '<div class="tt-pad" id="ttPad">' +
    '<div class="tt-dpad">' + ttBtnHtml("L", "왼쪽으로", L, "mv lf") + ttBtnHtml("R", "오른쪽으로", R, "mv rt") +
      ttBtnHtml("SOFT", "한 칸 내리기", DN, "mv dn") + "</div>" +
    '<div class="tt-rot">' + ttBtnHtml("ROT", "회전", CW, "cw") + ttBtnHtml("HARD", "바닥까지 떨어뜨리기", HD, "up") + "</div>" +
    '<p class="tt-cap">왼쪽 = 좌우·한 칸씩 · 오른쪽 아래 = 회전 · 위 = 바닥까지</p></div>';
}
function ttBtnHtml(k, label, svg, cls) {
  return '<button type="button" class="tt-c' + (cls ? " " + cls : "") + '" data-k="' + k + '" aria-label="' + label + '">' + svg + "</button>";
}
/* v3.87c (실기 제보 260918 「조작 버튼이 먹히지 않는다」) 버튼을 찾는 기준은 data-k 하나다.
   v3.87b 에서 버튼 class 를 tt-b → tt-c 로 바꾸면서 여기 선택자를 같이 못 바꿔 리스너가 한 개도 안 붙었다.
   class 이름에 기대지 않게 [data-k] 로 찾는다 · 포인터 이벤트가 없는 기기를 위해 touch 도 같이 받는다. */
/* v4.01 버튼마다 누른 손가락 하나만 받는다(b._pid) · 뗌·취소·캡처 잃음·화면 이탈·일시정지 어느 쪽으로 끝나도 반복이 멈춘다. */
function ttBindPad() {
  var pad = el("ttPad"); if (!pad) return;
  var down = function (b, k, e, pid) {
    if (e.cancelable) e.preventDefault();
    if (b._pid != null) return;   /* 같은 버튼을 두 손가락이 누르면 첫 손가락만 */
    b._pid = pid;
    b.classList.add("on");
    ttDo(k, false);
  };
  var up = function (b, k, pid) {
    if (b._pid == null || (pid != null && b._pid !== pid)) return;
    b._pid = null;
    b.classList.remove("on"); ttRelease(k);
  };
  Array.prototype.forEach.call(pad.querySelectorAll("[data-k]"), function (b) {
    var k = b.getAttribute("data-k");
    b._pid = null;
    if (window.PointerEvent) {
      b.addEventListener("pointerdown", function (e) {
        try { if (b.setPointerCapture) b.setPointerCapture(e.pointerId); } catch (x) {}
        down(b, k, e, e.pointerId);
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { b.addEventListener(t, function (e) { up(b, k, e.pointerId); }); });
      b.addEventListener("contextmenu", function (e) { e.preventDefault(); });   /* 길게 누를 때 메뉴가 뜨지 않게 */
    } else {
      b.addEventListener("touchstart", function (e) { down(b, k, e, "t"); }, { passive: false });
      ["touchend", "touchcancel"].forEach(function (t) { b.addEventListener(t, function (e) { if (e.cancelable) e.preventDefault(); up(b, k, "t"); }, { passive: false }); });
      b.addEventListener("mousedown", function (e) { down(b, k, e, "m"); });
      ["mouseup", "mouseleave"].forEach(function (t) { b.addEventListener(t, function () { up(b, k, "m"); }); });
    }
  });
}
/* 판 크기 · 조작판을 뺀 나머지 높이에 20칸이 다 들어가게 잡는다 (스크롤 없음) */
function ttFit(cv, w, h) {
  if (!w || !h) return;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  TT.dpr = cv.width / w;
  var M = 10, MV = 6, SIDE_MIN = 54, cell = Math.floor((h - MV * 2) / TT_ROWS);   /* v3.95 판 둘레 액자(4px)가 들어갈 여백 */   /* v3.87b 세로 여백은 2px · 조작판이 커진 만큼 판을 최대한 크게 */
  if (TT_COLS * cell + SIDE_MIN + M * 3 > w) cell = Math.floor((w - M * 3 - SIDE_MIN) / TT_COLS);   /* 다음 블록 칸이 눌리지 않게 폭을 먼저 확보한다 */
  cell = Math.max(8, cell);
  var side = Math.max(SIDE_MIN, Math.min(Math.round(cell * 2.3), w - TT_COLS * cell - M * 3));
  var bw = TT_COLS * cell, bh = TT_ROWS * cell;
  var ox = Math.max(M, Math.round((w - bw - side - M) / 2)), oy = Math.max(MV, Math.round((h - bh) / 2));
  TT.L = { W: w, H: h, cell: cell, ox: ox, oy: oy, bw: bw, bh: bh, sx: ox + bw + M, side: side };
  var ctx = cv.getContext("2d");
  ttDraw(ctx, performance.now());
}
function ttFrame() {
  if (!TT.on || TT.paused) return;
  var now = performance.now(), dt = Math.min(0.05, (now - TT.last) / 1000);
  TT.last = now;
  ttUpdate(dt, now);
  var cv = el("ttCv");
  if (!cv) { ttStop(); return; }
  ttDraw(cv.getContext("2d"), now);
  ttHud();
  if (TT.on && !TT.paused) TT.raf = requestAnimationFrame(ttFrame);
}
function ttUpdate(dt, now) {
  if (TT.msg) { TT.msg.t -= dt; if (TT.msg.t <= 0) TT.msg = null; }   /* v4.21 줄 문구 · 연출뿐이라 멈춤·끝남과 무관하게 스스로 사라진다 */
  if (TT.ending) {
    TT.ending.t -= dt; gsFx(TT, dt);
    if (TT.ending.t <= 0) ttEndFinal(TT.ending.why);
    return;
  }
  if (TT.cd > 0) {
    TT.cd -= dt;
    if (TT.cd <= 0) { TT.cd = 0; TT.t0 = now; ttSpawn(); }
    return;
  }
  var el0 = (now - TT.t0) / 1000;
  TT.surv = el0;
  gsFx(TT, dt);
  if (TT.drop) { TT.drop.t -= dt; if (TT.drop.t <= 0) TT.drop = null; }
  if (el0 >= TT_MAX_SEC) { ttEnd("time"); return; }
  if (TT.flash) { TT.flash.t -= dt; if (TT.flash.t <= 0) ttCollapse(); return; }
  if (TT.rep) {
    TT.rep.t -= dt;
    var guard = 0;
    while (TT.rep && TT.rep.t <= 0 && guard++ < 6) { ttAct(TT.rep.k); if (TT.rep) TT.rep.t += (TT.rep.k === "SOFT" ? TT_SOFT_REP : TT_ARR); }
  }
  if (!TT.cur || TT.flash) return;
  if (ttHit(TT.cur.m, TT.cur.x, TT.cur.y + 1)) {
    TT.lockT += dt;
    if (TT.lockT >= TT_LOCK || TT.lockN > TT_LOCK_MAX) ttLock();
  } else {
    TT.lockT = 0;
    TT.gt += dt;
    var iv = ttGrav(), guard2 = 0;
    while (TT.gt >= iv && TT.cur && !TT.flash && guard2++ < 20) {
      TT.gt -= iv;
      if (ttHit(TT.cur.m, TT.cur.x, TT.cur.y + 1)) break;
      TT.cur.y++;
    }
  }
}
function ttHud() {
  var key = TT.lines + "|" + TT.score + "|" + TT.level;
  if (key === TT.hud) return;
  TT.hud = key;
  var a = el("ttHudLn"), b = el("ttHudSc"), c = el("ttHudLv");
  if (a) a.textContent = String(TT.lines);
  if (b) b.textContent = olyFmt(TT.score);
  if (c) c.textContent = String(TT.level);
}
function ttEnd(why) {
  if (!TT.on || TT.ending) return;
  ttPadReset();
  TT.ending = { t: 1.2, why: why };
  TT.banner = null;
  sfx(why === "full" ? "fanfare" : "over");   /* v4.02 만점 종료는 축하음 */
}
function ttEndFinal(why) {
  if (!TT.on) return;
  TT.ending = null;
  var parts = ttParts(), surv = TT.surv, prev = Number(S.get("oly2_best_tetris", 0)) || 0;
  ttStop();
  gameClear("tetris_cleared");
  var root = el("ttRoot"); if (!root) return;
  var sc = olySubmit("tetris", parts);
  if (sc > prev) setTimeout(function () { sfx("best"); }, 250);
  root.innerHTML = gsResultHtml("tetris", { why: why === "full" ? "done" : "over", label: why === "full" ? "만점" : "결과", title: why === "full" ? "만점" : why === "time" ? "5분 완주" : "GAME OVER", reason: "",
    oly: { key: "tetris", parts: parts, score: sc, ref: [["버틴 시간", surv.toFixed(1) + "초"], ["레벨", parts.lv]] } });
  window.scrollTo(0, 0);
}
/* ── 그리기 · 전부 CSS px 좌표 (캔버스는 기기 해상도) ── */
/* v3.95 블록 한 칸 · 모서리 3~4px · 가장자리 1px(채움보다 한 단 어둡게) · 위쪽 안쪽 하이라이트 1px · 아래쪽 안쪽 그늘 1px
   active = 지금 떨어지는 블록(더 밝게 · 하이라이트 진하게) · 글자는 채움 밝기에 맞춰 흰/먹 */
/* v4.23 2단계(260923 사용자 확정 · 레트로 시안 §2) · 둥근 모서리 → 먹색 외곽선(큰 칸 2px) + 모서리 한 칸 비움 + 도트 명암(위·왼쪽 밝게 · 아래·오른쪽 어둡게)
   칸 크기 · 자리 · 충돌 판정(ttHit)은 그대로다 · 그림만 바뀐다 · 옛 가장자리 색(TT_EDGE)은 이제 쓰지 않는다 */
function ttCell(ctx, x, y, cell, kind, alpha, token, active) {
  var col = ttFill(kind), pad = 1, w = cell - pad * 2, dark = ttInk(kind) === "#FFFFFF", e = cell >= 20 ? 2 : 1.5, hl = Math.max(1.5, Math.round(cell * 0.12));
  var x0 = x + pad, y0 = y + pad;
  ctx.globalAlpha = alpha || 1;
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x0 + e, y0, w - 2 * e, w); ctx.fillRect(x0, y0 + e, w, w - 2 * e);
  ctx.fillStyle = active ? ttLift(col) : col; ctx.fillRect(x0 + e, y0 + e, w - 2 * e, w - 2 * e);
  ctx.fillStyle = dark ? "rgba(255,255,255," + (active ? 0.34 : 0.24) + ")" : "rgba(255,255,255," + (active ? 0.85 : 0.65) + ")";
  ctx.fillRect(x0 + e, y0 + e, w - 2 * e, hl); ctx.fillRect(x0 + e, y0 + e, hl, w - 2 * e);
  ctx.fillStyle = "rgba(0,0,0," + (dark ? 0.3 : 0.16) + ")";
  ctx.fillRect(x0 + e, y0 + w - e - hl, w - 2 * e, hl); ctx.fillRect(x0 + w - e - hl, y0 + e, hl, w - 2 * e);
  if (token && cell >= TT_TOK_MIN) {   /* v3.87 글자 한 조각 */
    var two = token.length > 2 || /[가-힣]/.test(token) && token.length > 1;
    var fs = Math.round(cell * (two ? 0.38 : 0.46));
    ctx.font = "800 " + fs + "px " + RAIN_FONT;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = ttInk(kind);
    ctx.fillText(token, x + cell / 2, y + cell / 2 + 0.5);
  }
  ctx.globalAlpha = 1;
}
function ttRound(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ttDraw(ctx, now) {
  var L = TT.L; if (!L) return;
  var d = TT.dpr || 1, cell = L.cell;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, L.W, L.H);
  ctx.fillStyle = RT_PAL.bark; ctx.fillRect(0, 0, L.W, L.H);   /* v4.23 어두운 오락실 몸통 */
  var sh = TT.shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0;
  ctx.save(); ctx.translate(L.ox + sh, L.oy);
  /* v3.95 판 = 액자 패널 · 바깥 4px 웜그레이 테 + 얕은 그림자 · 안쪽 바탕 + 옅은 격자
     v4.23 나무 이중 테두리(rtPanel · 6px · 세로 여백 MV 안에 든다) + 어두운 속판 + 옅은 크림 격자 */
  rtPanel(ctx, -6, -6, L.bw + 12, L.bh + 12, 1.5, RT_PAL.bark);
  ctx.strokeStyle = "rgba(243,231,216,0.08)"; ctx.lineWidth = 1;
  for (var gx = 1; gx < TT_COLS; gx++) { ctx.beginPath(); ctx.moveTo(gx * cell + 0.5, 0); ctx.lineTo(gx * cell + 0.5, L.bh); ctx.stroke(); }
  for (var gy = 1; gy < TT_ROWS; gy++) { ctx.beginPath(); ctx.moveTo(0, gy * cell + 0.5); ctx.lineTo(L.bw, gy * cell + 0.5); ctx.stroke(); }
  /* 쌓인 블록 */
  for (var y = 0; y < TT_ROWS; y++) for (var x = 0; x < TT_COLS; x++) {
    var k = TT.grid[y][x];
    if (k) ttCell(ctx, x * cell, y * cell, cell, k, 1, TT.tok[y][x]);
  }
  /* 유령 블록 · 지금 블록 · v5.57 유령은 LEVEL TT_GHOST_LV(2)까지만 */
  if (TT.cur && !TT.flash) {
    var ghost = TT.level <= TT_GHOST_LV, gyy = ghost ? ttGhostY() : 0, c = TT.cur;
    for (var yy = 0; yy < c.m.length; yy++) for (var xx = 0; xx < c.m[yy].length; xx++) {
      if (!c.m[yy][xx]) continue;
      var gy2 = gyy + yy;
      if (ghost && gy2 >= 0 && gy2 !== c.y + yy) {
        ctx.strokeStyle = "rgba(255,164,110,0.75)"; ctx.lineWidth = 1.5;   /* v3.95 유령 = 채움 없는 외곽선 */   /* v4.23 어두운 판 위라 밝은 주황 */
        ctx.setLineDash([Math.max(2, Math.round(cell * 0.2)), Math.max(2, Math.round(cell * 0.12))]);
        ttRound(ctx, (c.x + xx) * cell + 2.25, gy2 * cell + 2.25, cell - 4.5, cell - 4.5, cell >= 20 ? 3.5 : 2.5);
        ctx.stroke(); ctx.setLineDash([]);
      }
    }
    var tkc = ttTokCell(c.m);
    for (var py = 0; py < c.m.length; py++) for (var px = 0; px < c.m[py].length; px++) {
      if (!c.m[py][px]) continue;
      var ry = c.y + py;
      if (ry >= 0) ttCell(ctx, (c.x + px) * cell, ry * cell, cell, c.k, 1, (tkc && tkc[0] === px && tkc[1] === py) ? TT_TOKEN[c.k] : "", true);
    }
  }
  /* 지우는 줄 번쩍임 */
  if (TT.flash) {
    var el0 = TT_CLEAR_SEC - TT.flash.t, fk = Math.max(0, Math.min(1, (el0 - TT_FLASH_SEC) / (TT_CLEAR_SEC - TT_FLASH_SEC)));
    TT.flash.rows.forEach(function (r) {
      if (el0 < TT_FLASH_SEC) {   /* 번쩍 · 줄 전체를 흰색으로 덮고 오렌지 테두리 */
        ctx.fillStyle = "rgba(255,255,255," + (0.92 - el0 / TT_FLASH_SEC * 0.2).toFixed(2) + ")"; ctx.fillRect(0, r * cell, L.bw, cell);
        ctx.strokeStyle = RAIN_PAL.o100; ctx.lineWidth = 2; ctx.strokeRect(1, r * cell + 1, L.bw - 2, cell - 2);
      } else {   /* 접힘 · 줄 가운데로 얇아지며 사라진다 */
        var hh = cell * (1 - fk * fk);
        ctx.fillStyle = RT_PAL.bark; ctx.fillRect(0, r * cell, L.bw, cell);
        ctx.fillStyle = "rgba(255,126,49," + (0.85 * (1 - fk)).toFixed(2) + ")"; ctx.fillRect(0, r * cell + (cell - hh) / 2, L.bw, hh);
      }
    });
  }
  /* 즉시 떨어뜨린 자리 잔상 */
  if (TT.drop) {
    ctx.fillStyle = "rgba(255,126,49," + Math.max(0, TT.drop.t * 2) + ")";
    ctx.fillRect(0, Math.max(0, (TT.drop.y - 1) * cell), L.bw, cell);
  }
  ctx.restore();   /* v4.23 판 둘레 선은 나무 틀(rtPanel)이 맡는다 */
  /* 옆 칸 · 다음 블록 */
  ctx.save(); ctx.translate(L.sx, L.oy);
  var qh = Math.min(L.bh, Math.round(cell * 5.2) + 30);
  rtPanel(ctx, 0, 0, L.side, qh, 1, RT_PAL.bark);   /* v4.23 나무 틀(4px) · 도트 제목 */
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  rtText(ctx, "다음", L.side / 2, 7, 16, RT_PAL.cream, null);
  /* v3.87b 다음 블록 두 개 · 빈 줄·빈 칸을 떼고 실제 모양만 그린다 (좁은 옆 칸에서도 크게 보인다) */
  var q = (TT.nextQ || []).slice(0, 2), qy = 28;
  q.forEach(function (nk, qi) {
    var nm = TT_PIECES[nk].m, x0 = 9, x1 = -1, y0 = 9, y1 = -1;
    for (var ry = 0; ry < nm.length; ry++) for (var rx = 0; rx < nm[ry].length; rx++) if (nm[ry][rx]) {
      if (rx < x0) x0 = rx; if (rx > x1) x1 = rx; if (ry < y0) y0 = ry; if (ry > y1) y1 = ry;
    }
    var cw = x1 - x0 + 1, ch2 = y1 - y0 + 1;
    var nc = Math.max(7, Math.min(Math.round(cell * (qi ? 0.52 : 0.76)), Math.floor((L.side - 10) / cw)));
    var offx = Math.round((L.side - cw * nc) / 2);
    for (var ny = y0; ny <= y1; ny++) for (var nx = x0; nx <= x1; nx++) if (nm[ny][nx]) ttCell(ctx, offx + (nx - x0) * nc, qy + (ny - y0) * nc, nc, nk, qi ? 0.75 : 1, "");
    qy += ch2 * nc + 12;
  });
  ctx.restore();
  gsFxDraw(ctx, TT, L.W);
  if (TT.banner) { ctx.save(); ctx.translate(L.ox, 0); gsBannerDraw(ctx, TT, L.bw, L.oy + 8); ctx.restore(); }
  if (TT.msg) ttMsgDraw(ctx, L);
  gsCountDraw(ctx, TT.cd, L.W, L.oy, L.oy + L.bh);
  if (TT.ending) ttEndDraw(ctx, L);
}
/* v4.21 줄 문구 · 기존 줄 팝 바로 아래 · 상자 없이 흰 테두리 글자만 써서 떨어지는 블록을 가리지 않는다 · 1.4초 뒤 사라진다 */
function ttMsgDraw(ctx, L) {
  var m = TT.msg, up = m.t > 1.05 ? (m.t - 1.05) / 0.35 : 0;
  var size = 12, maxW = L.bw - 6;
  ctx.font = "800 " + size + "px " + RAIN_FONT;
  var w = ctx.measureText(m.text).width;
  if (w > maxW) { size = Math.max(8, size * maxW / w); ctx.font = "800 " + size + "px " + RAIN_FONT; }
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, m.t / 0.4));
  rgStroke(ctx, m.text, L.ox + L.bw / 2, L.oy + 58 + (rgReduced() ? 0 : up * 5), RAIN_PAL.ink, RAIN_PAL.w, 4);
  ctx.restore();
}
/* v4.23 공용 끝 화면(rtEnd) · 문구는 그대로 */
function ttEndDraw(ctx, L) {
  rtEnd(ctx, L.W, L.oy, L.oy + L.bh, TT.ending.why === "full" ? "만점 " + olyFmt(olyCap()) : TT.ending.why === "time" ? "5분 완주" : "GAME OVER",
    olyFmt(TT.score) + "점 · " + ttParts().lines + "줄", { s: 3, tp: 32, sp: 16, maxW: 320 });
}
/* 시작 화면 미리보기 · 정지 화면 */
/* v4.11 시작 화면 미리보기 · 실제 칸 그림(ttCell) · I 블록이 떨어져 맨 아래 줄을 채우고 지워진다 · 3.6초마다 반복 */
function ttPreview(t) {
  var cv = el("ttPrev"); if (!cv) return;
  if (t == null) t = 0.9;
  var k = gspK(), W = 120, H = 120, cell = 14, cols = 7, rows = 7;
  if (cv.width !== W * k) { cv.width = W * k; cv.height = H * k; }
  var ctx = cv.getContext("2d"); ctx.setTransform(k, 0, 0, k, 0, 0);
  var ox = Math.round((W - cols * cell) / 2), oy = Math.round((H - rows * cell) / 2);
  ctx.clearRect(0, 0, W, H);
  rtPanel(ctx, ox - 6, oy - 6, cols * cell + 12, rows * cell + 12, 1.5, RT_PAL.bark);   /* v4.23 게임과 같은 나무 틀 · 어두운 속판 */
  ctx.strokeStyle = "rgba(243,231,216,0.08)"; ctx.lineWidth = 1;
  for (var i = 1; i < cols; i++) { ctx.beginPath(); ctx.moveTo(ox + i * cell + 0.5, oy); ctx.lineTo(ox + i * cell + 0.5, oy + rows * cell); ctx.stroke(); }
  for (var j = 1; j < rows; j++) { ctx.beginPath(); ctx.moveTo(ox, oy + j * cell + 0.5); ctx.lineTo(ox + cols * cell, oy + j * cell + 0.5); ctx.stroke(); }
  var stack = [[0, 6, "O"], [1, 6, "O"], [0, 5, "O"], [1, 5, "O"], [3, 6, "L"], [4, 6, "L"], [5, 6, "L"], [3, 5, "L"], [6, 6, "S"], [6, 5, "S"], [5, 5, "S"], [5, 4, "S"]];
  var P = 3.6, u = t % P, fall = 1.5, flash = 0.45;
  var iy = u < fall ? Math.min(3, -4 + Math.floor(u / fall * 8)) : 3, piece = [0, 1, 2, 3].map(function (d) { return [2, iy + d, "I"]; });
  var cells = stack.concat(piece), full = u >= fall + flash;
  if (full) cells = cells.filter(function (c) { return c[1] !== 6; }).map(function (c) { return [c[0], c[1] + 1, c[2]]; });   /* 맨 아래 줄이 지워지고 위가 한 칸 내려온다 */
  cells.forEach(function (c) { if (c[1] >= 0) ttCell(ctx, ox + c[0] * cell, oy + c[1] * cell, cell, c[2], 1, ""); });
  if (u >= fall && !full) { ctx.globalAlpha = 0.35 + 0.35 * Math.sin((u - fall) / flash * Math.PI); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(ox, oy + 6 * cell, cols * cell, cell); ctx.globalAlpha = 1; }
}

