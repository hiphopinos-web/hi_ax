/* ════════════════ v3.45 휴대폰 미니게임 공통 틀 (사용자 결정 260917 · v3.50 전원 공개) ════════════════
   세 게임(AX 단어 소나기 · AX 팡 · ME to WE 점프)이 같은 틀을 쓴다:
   전체화면 오버레이(visualViewport 높이) · 앱 이탈 시 자동 일시정지 · 3초 카운트다운 · 끝나는 순간 1.2초 멈춤 · 같은 결과 화면 ·
   게임 닉네임(타자 게임 닉네임 공용) · 끝까지 하면 미니게임 스탬프(gameClear). 점수는 숫자 하나.
   AX 팡·점프 순위판은 지금은 로컬 테스트용(가짜 닉네임 + 내 최고 기록) · 서버 순위는 게임이 정해진 뒤 연결한다.
   비주얼: 오렌지 사다리 · 검정 · 흰색 · 16비트 도트 · 캐릭터 = 행사 챗봇 원본(assets/bot.js) · 이모지 없음. */
var GS_GAMES = {
  tetris: { name: "테트리스", view: "game_tetris", start: "ttStart()", best: "oly2_best_tetris", line: "블록을 옮기고 돌려서 줄을 채워요 · 아래 버튼으로" },
  pang: { name: "AX 팡", view: "game_pang", start: "pgStart()", best: "oly2_best_pang", line: "같은 그림 3개를 한 줄로 맞춰 터뜨려요 · 밀어서 바꾸기" },
  jump: { name: "ME to WE 점프", view: "game_jump", start: "jpStart()", best: "oly2_best_jump", line: "화면을 탭하면 점프 · 두 번 탭하면 2단 점프 · 꾹 누르면 엎드리기" },
};
/* v4.08 키보드가 올라와도 입력칸과 아래 고정 버튼이 가려지지 않게 · 가려진 높이를 --kb 로 넘긴다 · 포커스한 칸은 보이는 곳 가운데로 */
function kbSync() {
  var vv = window.visualViewport; if (!vv) return;
  var kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  document.documentElement.style.setProperty("--kb", (kb > 80 ? kb : 0) + "px");
  document.documentElement.classList.toggle("kb-on", kb > 80);
}
if (window.visualViewport) { window.visualViewport.addEventListener("resize", kbSync); window.visualViewport.addEventListener("scroll", kbSync); }
function kbFocus(n) { setTimeout(function () { kbSync(); if (n && n.scrollIntoView) try { n.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { n.scrollIntoView(); } }, 320); }
/* v4.25 입력 공통 · 한글 조합(IME) 추적과 Enter 한 곳
   IME.on = 지금 조합이 열려 있다(compositionstart~end) · 안드로이드 키보드는 조합 중 keydown 을 keyCode 229 로 준다.
   onEnter(e, fn) = 조합을 확정하는 Enter(isComposing · 조합 중 229)는 건너뛰고, 같은 칸에서 0.6초 안에 두 번 보내지 않는다. */
var IME = { on: false };
document.addEventListener("compositionstart", function () { IME.on = true; }, true);
/* 조합이 끝난 뒤 한 번 다시 볼 칸 = data-imeend (num = 숫자 정리 · nick = 닉네임 형식 문구) · oncompositionend 는 HTML 이벤트 속성이 아니라 인라인으로 걸면 불리지 않는다 */
document.addEventListener("compositionend", function (e) {
  IME.on = false;
  var t = e.target, k = t && t.getAttribute ? t.getAttribute("data-imeend") : "";
  if (k === "num") setTimeout(function () { numOnly(t); }, 0);
  else if (k === "nick") setTimeout(function () { typeNickInput(t.value); }, 0);
  else if (k === "tsfnick") setTimeout(function () { tsfNickIn(t); }, 0);   /* v4.33 셀프 닉네임 · 조합이 끝나면 공백 버림 · 형식 줄 · v5.12 사번 칸 없음(로그인 = 앱의 내 QR) */
}, true);
document.addEventListener("focusout", function () { IME.on = false; }, true);
/* 숫자 칸 정리(사번 · PIN) · 사번은 전부 숫자(사용자 확정 260924) · 숫자 외 글자(붙여넣은 공백 · 한글 자판에서 친 글자)를 뺀다.
   조합 중에는 값을 절대 다시 쓰지 않는다(삼성 키보드는 조합 중 값이 바뀌면 조합이 깨진다) · 조합이 끝나면(compositionend) 한 번 정리 · 커서는 제자리 */
function numOnly(n, e) {
  if (!n || (e && e.isComposing) || IME.on) return;
  var v = n.value.replace(/[０-９]/g, function (d) { return String.fromCharCode(d.charCodeAt(0) - 0xFEE0); }), c = v.replace(/\D/g, "");   /* v5.76 밤샘 QA · 전각 숫자(일부 키보드 전각 모드)는 지우지 않고 반각으로 바꾼다(예전엔 사번 칸이 통째로 비었다) */
  if (c === n.value) return;
  var at = n.selectionStart == null ? c.length : v.slice(0, n.selectionStart).replace(/\D/g, "").length;
  n.value = c;
  try { n.setSelectionRange(at, at); } catch (x) {}
}
function onEnter(e, fn) {
  if (!e || e.key !== "Enter") return false;
  if (e.isComposing || (e.keyCode === 229 && IME.on)) return false;
  e.preventDefault();
  var t = e.target || {}, now = Date.now();
  if (t._entT && now - t._entT < 600) return true;
  t._entT = now;
  fn();
  return true;
}
/* v5.41 (사용자 261003 「미니 게임이 시작될 때 설명을 충분히 보고 출발할 수 있게 · 특히 점프 게임」) 미니 게임 3종 시작 전 설명 = 목표 · 조작(움직이는 시범) · 끝 · 완주
   처음(이 사람이 이 게임의 START 를 누른 적 없음) = 시작 화면 카드에 펼쳐 둔다 · 두 번째부터 = 조작 한 줄 + 「설명 보기」 · 일시정지 화면에도 「설명 보기」
   본 기록 = gs_how(사람별 · STORE_PERSON · S 저장이 try/catch 라 저장이 막힌 기기는 메모리만 · 다시 열면 또 펼쳐 보인다)
   게임은 START 를 눌러야 시작한다(3 · 2 · 1 카운트다운 그대로) · 게임 규칙 · 점수 · 완주(gameClear) 판정 · 서버 호출은 바꾸지 않는다 */
var GS_HOW = {
  jump: { goal: "장애물을 넘고 코인 · 글자 블록을 모아요", end: "하트 3개를 다 잃거나 3,000점이면 끝 · 시간 제한 없음",
    cells: [["tap", "탭", "점프"], ["dbl", "두 번 탭", "2단 점프"], ["hold", "꾸욱", "엎드리기"]] },
  pang: { goal: "같은 그림 3개를 한 줄로 맞춰 80칸을 터뜨려요 · 빨리 끝낼수록 높은 점수", end: "80칸을 다 터뜨리면 끝 · 최대 2분",
    cells: [["swipe", "밀기", "옆 칸과 바꾸기"], ["tap2", "탭 · 탭", "옆 칸과 바꾸기"]] },
  tetris: { goal: "블록을 쌓아 가로줄을 채우면 줄이 지워져요", end: "블록이 맨 위까지 쌓이면 끝 · 시간 제한 없음",
    cells: [["L R", "", "옮기기"], ["ROT", "", "회전"], ["SOFT", "", "내리기"], ["HARD", "", "바닥까지"]] }
};
var GS_HOW_DONE = "결과 화면까지 가면 완주 · 세 게임 모두 완주하면 스탬프";
function gsHowSeen(key) { var m = S.get("gs_how", {}) || {}; return !!m[key]; }
function gsHowMark(key) { if (!GS_HOW[key] || gsHowSeen(key)) return; var m = S.get("gs_how", {}) || {}; m[key] = 1; S.put("gs_how", m); }   /* put = 다시 그리기(axf-store) 없이 */
/* 테트리스 조작 그림 = 게임 아래 버튼(ttPadHtml)의 그 글리프를 그대로 꺼내 쓴다(그림이 두 벌이 되지 않게) */
function gshTtIcon(k) { var m = ttPadHtml().match(new RegExp('data-k="' + k + '"[^>]*>(<svg[\\s\\S]*?</svg>)')); return m ? m[1] : ""; }
/* key 의 설명 · dk = 일시정지(어두운 판) · id · hide = 접어 둔 채로 */
function gsHowHtml(key, dk, id, hide) {
  var h = GS_HOW[key]; if (!h) return "";
  var row = function (k, v) { return '<div class="gsh-r"><span class="gsh-k">' + k + '</span><div class="gsh-v">' + v + "</div></div>"; };
  var cells = h.cells.map(function (c) {
    var pic = key === "tetris" ? '<span class="gsh-ic" aria-hidden="true">' + c[0].split(" ").map(function (k) { return '<i class="k-' + k + '">' + gshTtIcon(k) + "</i>"; }).join("") + "</span>" :
      '<canvas class="gsh-cv" data-k="' + key + '" data-a="' + c[0] + '" width="184" height="216" aria-hidden="true"></canvas>';
    return '<div class="gsh-c">' + pic + '<span class="gsh-l">' + (c[1] ? "<b>" + esc(c[1]) + "</b>" : "") + esc(c[2]) + "</span></div>";
  }).join("");
  return '<div class="gsh' + (dk ? " dk" : "") + '"' + (id ? ' id="' + id + '"' : "") + (hide ? " hidden" : "") + ">" +
    row("목표", esc(h.goal)) +
    '<div class="gsh-r"><span class="gsh-k">조작</span><div class="gsh-cells' + (key === "tetris" ? " ic" : "") + '" style="--n:' + h.cells.length + '">' + cells + "</div></div>" +
    row("끝", esc(h.end)) + row("완주", esc(GS_HOW_DONE)) + "</div>";
}
/* 시작 화면 · 두 번째부터 「설명 보기」 · 펼치면 조작 한 줄(gs-ctl)은 CSS 가 숨긴다(같은 정보 한 번) */
function gsHowToggle() {
  var b = el("gsHow"), tg = el("gsHowTg"); if (!b || !tg) return;
  var on = b.hidden;
  b.hidden = !on;
  tg.textContent = on ? "설명 접기 ▲" : "설명 보기 ▼"; tg.setAttribute("aria-expanded", on ? "true" : "false");
  if (on) gshMount(b); else gshStop();
  if (el("gsPrev")) gspFit();
}
/* 일시정지 화면 · 「설명 보기」 · 계속하기를 누르면 접힌다(gsPauseUi) */
function gsPauseHow(off) {
  var p = el("rgPause"), b = el("rgPauseHow"), tg = el("rgPauseHowTg"); if (!p || !b || !tg) return;
  var on = off ? false : b.hidden;
  b.hidden = !on; p.classList.toggle("how", on);
  tg.textContent = on ? "설명 접기" : "설명 보기"; tg.setAttribute("aria-expanded", on ? "true" : "false");
  if (on) { p.scrollTop = 0; gshMount(b); } else gshStop();
}
/* ── 조작 시범 그림 · 게임의 실제 그리기 함수(jpWorld · jpObsDraw · jpBotDraw · 코인 · pgPxTile · pgIconDraw)로 짧게 반복 ──
   캔버스 184×216 · 게임 1칸 = 3px(점프) · 보일 때만 돈다(접히거나 화면이 바뀌면 멈춤) · 30fps 상한 · 동작 줄이기 = 대표 장면 한 장 · 게임을 시작하면(gsBegin) 멈춘다 */
var GSH = { raf: 0, t: 0, last: 0, root: null };
function gshStop() { if (GSH.raf) cancelAnimationFrame(GSH.raf); GSH.raf = 0; GSH.root = null; }
function gshMount(root) {
  gshStop(); if (!root) return;
  GSH.root = root; GSH.t = 0;
  jpBotLoad();
  gshDraw(-1);
  if (rgReduced()) { setTimeout(function () { if (!GSH.raf) gshDraw(-1); }, 400); return; }   /* 챗봇 그림이 늦게 읽혀도 한 번 더 */
  GSH.last = performance.now(); GSH.raf = requestAnimationFrame(gshTick);
}
function gshTick(now) {
  GSH.raf = 0;
  var r = GSH.root;
  if (!r || !r.isConnected || r.hidden) { gshStop(); return; }
  if (document.hidden) { GSH.last = now; GSH.raf = requestAnimationFrame(gshTick); return; }
  var dt = (now - GSH.last) / 1000;
  if (dt >= 0.032) { GSH.t += Math.min(0.1, dt); GSH.last = now; gshDraw(GSH.t); }
  GSH.raf = requestAnimationFrame(gshTick);
}
function gshDraw(t) {
  var r = GSH.root; if (!r) return;
  Array.prototype.forEach.call(r.querySelectorAll("canvas.gsh-cv"), function (cv) {
    var ctx = cv.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, cv.width, cv.height);
    if (cv.getAttribute("data-k") === "jump") gshJump(ctx, cv.getAttribute("data-a"), t); else gshPang(ctx, cv.getAttribute("data-a"), t);
  });
}
/* 손가락 · 검정 테 + 흰 면 사각 두 개(검지 + 손등 · 도트 배열 캐릭터가 아니라 도형) · (x, y) = 손끝 · press = 눌림(한 칸 위로) · rip = 0~1 물결 · hold = 누르고 있음 */
function gshHand(ctx, x, y, press, rip, hold) {
  x = Math.round(x); y = Math.round(y);
  if (hold) { ctx.globalAlpha = 0.55; ctx.fillStyle = RAIN_PAL.o100; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; }
  if (rip > 0 && rip < 1) { ctx.globalAlpha = 1 - rip; ctx.strokeStyle = RAIN_PAL.o100; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, 2 + 9 * rip, 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1; }
  var top = y - (press ? 1 : 0), fx = x - 2;
  rgBox(ctx, x - 4, top + 6, 11, 10, RAIN_PAL.w);   /* 손등 */
  rgBox(ctx, fx, top, 4, 8, RAIN_PAL.w);            /* 검지 */
  ctx.fillStyle = RAIN_PAL.w; ctx.fillRect(fx + 1, top + 6, 2, 2);   /* 검지와 손등 이음 */
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x + 2, top + 7, 1, 2); ctx.fillRect(x + 4, top + 7, 1, 2);   /* 접은 손가락 마디 */
}
/* 점프 시범 · 2.4초 반복 · 탭 = 상자를 한 번 뛰어넘는다 · 두 번 탭 = 공중에서 한 번 더 뛰어 높은 코인 · 꾸욱 = 낮은 간판 밑을 엎드려 지나간다
   보이는 판 = 게임 좌표 61 × 72 칸 · 땅 = 위에서 60칸 · 챗봇 x = 4 · 장애물은 초당 80칸으로 다가온다(한 번에 알아보게 게임 첫 속도 55보다 빠르게 · 시범 그림만) */
function gshJump(ctx, a, t) {
  var P = 2.4, u = t < 0 ? (a === "tap" ? 0.8 : a === "dbl" ? 0.97 : 1.1) : t % P, GY = 60, sp = 80, g = 313, v1 = 130, v2 = 90;
  ctx.save(); ctx.scale(3, 3); ctx.translate(0, GY - JP_GY);
  jpWorld(ctx, (t < 0 ? 1 : t) * sp);
  var lift = 0, duck = false, press = false, rip = 0, hold = false, tip = 0;
  if (a === "tap") {
    jpObsDraw(ctx, { k: "box", x: 72 - sp * u });
    tip = 0.44;
    var q = u - tip; if (q > 0 && q < 2 * v1 / g) lift = v1 * q - g * q * q / 2;
  } else if (a === "dbl") {
    var s1 = 0.4, s2 = 0.58, q1 = u - s1, q2 = u - s2, l0 = v1 * (s2 - s1) - g * (s2 - s1) * (s2 - s1) / 2, hit = s2 + v2 / g;
    if (q1 > 0 && q2 <= 0) lift = v1 * q1 - g * q1 * q1 / 2;
    else if (q2 > 0) lift = Math.max(0, l0 + v2 * q2 - g * q2 * q2 / 2);
    if (u < hit) [0, 12].forEach(function (d) { var x = 8 + sp * (hit - u) + d; if (x < 70) ctx.drawImage(jpCoinCv(), Math.round(x), JP_GY - 52); });
    else if (u < hit + 0.25) { var e = 1 + (u - hit) * 5; ctx.fillStyle = RAIN_PAL.o100; [[-4, -3], [5, -5], [9, 2], [-2, 4]].forEach(function (p) { ctx.fillRect(Math.round(14 + p[0] * e), Math.round(JP_GY - 48 + p[1] * e), 2, 2); }); }
    tip = s1;
    if (u >= s2 && u < s2 + 0.12) press = true;
    if (u > s2 && u < s2 + 0.4) rip = (u - s2) / 0.4;
  } else {
    jpObsDraw(ctx, { k: "sign", x: 72 - sp * (u - 0.2) });
    tip = 0.55; hold = u > tip && u < 1.55; duck = hold; press = hold;
  }
  if (u >= tip && u < tip + 0.12) press = true;
  if (!rip && u > tip && u < tip + 0.4) rip = (u - tip) / 0.4;
  jpBotDraw(ctx, 4, JP_GY, 1, duck, Math.round(lift));
  gshHand(ctx, 50, JP_GY - 3, press, rip, hold);   /* 오른쪽 아래 · 손끝이 땅 위 */
  ctx.restore();
}
/* AX 팡 시범 · 2.6초 반복 · 3×3 판 · 가운데 줄 오른쪽 칸을 아래 칸과 바꾸면 가운데 줄 차트 3개가 맞아 터진다
   밀기 = 손가락이 눌러서 아래로 끈다 · 탭 · 탭 = 한 칸을 눌러 고르고(주황 테) 아래 칸을 누른다 */
var GSH_PG = [[1, 3, 0], [2, 2, 0], [0, 1, 2]];
function gshPang(ctx, a, t) {
  var P = 2.6, u = t < 0 ? 0.85 : t % P, f = 52 / 24, x0 = 14, y0 = 30, p = 52;
  var sw = a === "swipe" ? [0.6, 0.9] : [1.0, 1.3], pop = sw[1], q = Math.max(0, Math.min(1, (u - sw[0]) / (sw[1] - sw[0])));
  q = q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q);
  ctx.fillStyle = RAIN_PAL.o10; ctx.fillRect(0, 0, 184, 216);
  var swapped = u >= sw[1];
  for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
    var k = GSH_PG[r][c], dy = 0, sc = 1, al = 1;
    if (swapped && r === 1 && c === 2) k = 2;
    if (swapped && r === 2 && c === 2) k = 0;
    if (!swapped && c === 2 && (r === 1 || r === 2)) dy = (r === 1 ? 1 : -1) * p * q;
    if (swapped && r === 1) {
      if (u < pop + 0.3) { var z = (u - pop) / 0.3; sc = 1 - 0.4 * z; al = 1 - z; }
      else if (u < pop + 0.6) { k = [3, 4, 1][c]; sc = 1 + 0.25 * (1 - (u - pop - 0.3) / 0.3); }
      else k = [3, 4, 1][c];
    }
    if (al <= 0) continue;
    var st = PG_TILE[k];
    ctx.save(); ctx.globalAlpha = al; ctx.translate(x0 + c * p + p / 2, y0 + r * p + p / 2 + dy); ctx.scale(f * sc, f * sc);
    pgPxTile(ctx, 10.8, st.fill); pgIconDraw(ctx, k, 0, 0, 13.5, st.ic);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  var cx = x0 + 2 * p + p / 2, ya = y0 + p + p / 2, yb = y0 + 2 * p + p / 2;
  if (a === "tap2" && u >= 0.45 && u < 1.0) { pgRR(ctx, cx - 26, ya - 26, 52, 52, 3); ctx.lineWidth = 3; ctx.strokeStyle = PG_C.o100; ctx.stroke(); }   /* 고른 칸 = 게임의 주황 테 */
  ctx.save(); ctx.scale(3, 3);
  var hx = cx / 3 + 2, hy;
  if (a === "swipe") {
    if (u < 0.6) hy = ya / 3; else if (u < 0.9) hy = (ya + (yb - ya) * q) / 3; else hy = yb / 3;
    if (u > 0.3 && u < 1.2) gshHand(ctx, hx, hy, u >= 0.5 && u < 0.92, u > 0.5 && u < 0.9 ? (u - 0.5) / 0.4 : 0, u >= 0.5 && u < 0.92);
  } else {
    hy = (u < 0.8 ? ya : yb) / 3;
    var tp = u < 0.8 ? 0.4 : 0.95;
    if (u > 0.2 && u < 1.25) gshHand(ctx, hx, hy, u >= tp && u < tp + 0.12, u > tp && u < tp + 0.4 ? (u - tp) / 0.4 : 0, false);
  }
  ctx.restore();
}
var GS = { cur: null, vvh: null, onVis: null, onKey: null };
/* v4.08 게임 안내 팝업 = 챗봇 말풍선 (design.md A-5 결정 5) · 문구는 그대로 · 원본 BOT_SVG 합성만
   v4.23 바람의 나라식 대화창 · 초상 칸 = 원본 도트(rtBotImg) · 아직 안 읽혔으면 원본 BOT_SVG 그대로 */
function gsSayHtml(html) { var u = rtBotImg(); return '<div class="gs-say">' + (u ? '<img class="rt-bot" src="' + u + '" alt="">' : BOT_SVG) + '<p class="gs-say-b">' + html + "</p></div>"; }
/* 첫 안내 · 260924 사용자 확정: 횟수 제한 없이 매 판 시작 카운트다운 동안 보여준다(gs_tut 카운터는 더 이상 조건으로 쓰지 않는다 · 예전 3판 제한이
   기기당 남은 스탬프처럼 소진돼 다시 열어 본 사람에게 영영 안 뜨는 사고가 있었다) · 문구 = GS_GAMES[key].line (시작 화면 줄과 같다) */
function gsTutTake(key) {
  return (GS_GAMES[key] && GS_GAMES[key].line) || "";
}
/* o = { key, title, top(v3.36d 위 줄 HTML 교체), fill(v3.36d 캔버스 꽉 채움), cls, cw, ch, canvasId, bottom, noGesture, flat(v3.48 플랫 스타일 오버레이), resized(cv, cssW, cssH), down(e), move(e), up(e), keydown(e), running(), isPaused(), pause(), resume(), quit() } */
function gsOverlayOpen(o) {
  gsOverlayClose();
  GS.cur = o;
  var d = document.createElement("div");
  d.id = "rgPlay";
  d.className = (o.flat ? "flat " : "") + (o.cls || "") + " rt";   /* v4.23 레트로 경계 */
  d.innerHTML = '<div class="rgp-top">' + (o.top || '<span class="rgp-t">' + esc(o.title) + '</span><span class="row" style="gap:6px;align-items:center">' + sndBtnHtml(false) + '<button class="rgp-x" type="button" onpointerdown="event.preventDefault()" onclick="gsPauseToggle()">일시정지</button></span>') + "</div>" +
    '<div class="rgp-mid' + (o.noGesture ? " nogest" : "") + (o.fill ? " fill" : "") + '" id="gsMid"><canvas id="' + o.canvasId + '" width="' + o.cw + '" height="' + o.ch + '" role="img" aria-label="' + esc(o.title || "게임 화면") + '"></canvas>' +
    (o.tip ? '<div class="gs-tip" id="gsTip">' + gsSayHtml(esc(o.tip)) + "</div>" : "") +
    '<div class="rgp-pause" id="rgPause" hidden><p>일시정지</p><small id="rgPauseLeft"></small>' + gsHowHtml(o.key, true, "rgPauseHow", true) + '<button class="ax-button rt-btn" type="button" onclick="gsResume()">계속하기</button><button class="ax-button ax-button-weak rt-btn weak" type="button" onclick="gsQuit()">그만하기</button>' +
    (GS_HOW[o.key] ? '<button class="ax-button ax-button-weak rt-btn weak" type="button" id="rgPauseHowTg" aria-expanded="false" aria-controls="rgPauseHow" onclick="gsPauseHow()">설명 보기</button>' : "") + "</div></div>" +   /* v5.41 일시정지에서 설명 다시 보기 · 펼친 설명은 제목 바로 아래 */
    (o.bottom || "");
  document.body.appendChild(d);
  document.documentElement.classList.add("rg-lock");
  var mid = d.querySelector(".rgp-mid");
  if (o.tip) setTimeout(function () { var t = el("gsTip"); if (t) t.classList.add("off"); }, 3200);   /* 카운트다운 동안만 · 시작과 함께 걷힌다 */
  mid.addEventListener("pointerdown", function (e) {
    var tp = el("gsTip"); if (tp) tp.classList.add("off");
    if (e.target.closest && e.target.closest(".rgp-pause")) return;
    if (o.down) o.down(e);
  });
  if (o.move) mid.addEventListener("pointermove", function (e) { o.move(e); });
  if (o.up) { mid.addEventListener("pointerup", function (e) { o.up(e); }); mid.addEventListener("pointercancel", function (e) { o.up(e, true); }); }
  GS.vvh = function () {
    var vv = window.visualViewport, h = vv ? vv.height : window.innerHeight, top = vv ? vv.offsetTop : 0;
    d.style.height = Math.round(h) + "px"; d.style.top = Math.round(top) + "px";
    var cv = el(o.canvasId);
    if (!cv) return;
    if (o.fill) {   /* v3.36d · 캔버스가 중간 영역을 꽉 채우고 게임이 실제 크기로 다시 배치한다 */
      var fw = mid.clientWidth, fh = mid.clientHeight;
      cv.style.width = fw + "px"; cv.style.height = fh + "px";
      if (o.resized) o.resized(cv, fw, fh);
      return;
    }
    var mh = mid.clientHeight - 8, mw = mid.clientWidth - 16;
    var w = Math.min(mw, mh * o.cw / o.ch);
    cv.style.width = Math.floor(w) + "px"; cv.style.height = Math.floor(w * o.ch / o.cw) + "px";
    if (o.resized) o.resized(cv, Math.floor(w));
  };
  if (window.visualViewport) { window.visualViewport.addEventListener("resize", GS.vvh); window.visualViewport.addEventListener("scroll", GS.vvh); }
  window.addEventListener("resize", GS.vvh);
  GS.onVis = function () { if (document.hidden && GS.cur && GS.cur.running()) GS.cur.pause(); };
  document.addEventListener("visibilitychange", GS.onVis);
  GS.onKey = function (e) { if (GS.cur && GS.cur.keydown) GS.cur.keydown(e); };
  document.addEventListener("keydown", GS.onKey);
  GS.vvh();
}
/* key 를 주면 그 게임이 연 오버레이일 때만 닫는다(다른 게임 오버레이를 잘못 닫지 않게) */
function gsOverlayClose(key) {
  if (key && (!GS.cur || GS.cur.key !== key)) return;
  if (GS.vvh) {
    if (window.visualViewport) { window.visualViewport.removeEventListener("resize", GS.vvh); window.visualViewport.removeEventListener("scroll", GS.vvh); }
    window.removeEventListener("resize", GS.vvh);
  }
  if (GS.onVis) document.removeEventListener("visibilitychange", GS.onVis);
  if (GS.onKey) document.removeEventListener("keydown", GS.onKey);
  GS.vvh = null; GS.onVis = null; GS.onKey = null; GS.cur = null;
  var d = el("rgPlay");
  if (d && d.parentNode) d.parentNode.removeChild(d);
  document.documentElement.classList.remove("rg-lock");
}
function gsPauseUi(on) {
  var p = el("rgPause"); if (p) p.hidden = !on;
  if (!on && el("rgPauseHow")) gsPauseHow(true);   /* v5.41 계속하면 설명은 접는다 */
  var x = document.querySelector("#rgPlay .rgp-x"); if (x) x.textContent = on ? (x.getAttribute("data-on") || "계속하기") : (x.getAttribute("data-off") || "일시정지");
}
function gsPauseToggle() {
  if (!GS.cur) return;
  if (GS.cur.isPaused()) { GS.cur.resume(); return; }
  GS.manual = true;
  try { GS.cur.pause(); } finally { GS.manual = false; }
}
/* v4.02 (점수 체계 v2 §3.1 · 결정 6) 판당 멈춤 상한 · 올림픽 규칙 pauseMax(기본 3) · 없는 게임은 무제한 */
function gsPauseMax() { var R = GS.cur && olyRule()[GS.cur.key]; return R && R.pauseMax != null ? R.pauseMax : 99; }
function gsPauseBtnSync(G) {
  var x = document.querySelector("#rgPlay .rgp-x"); if (!x || G.paused) return;
  var left = gsPauseMax() - (G.pz || 0);
  x.disabled = left <= 0; x.classList.toggle("off", left <= 0);
}
function gsResume() { if (GS.cur) GS.cur.resume(); }
function gsQuit() { if (GS.cur) GS.cur.quit(); }
/* 게임 상태 객체 공용 일시정지 · 멈춘 시간은 60초에서 빠지지 않는다 */
function gsPauseState(G) {
  if (!G.on || G.paused || G.ending) return;
  if (GS.manual) {   /* 직접 누른 멈춤만 센다 · 상한에 닿으면 멈추지 않는다 (전화·앱 전환 자동 멈춤은 그대로 · 멈춤 화면은 불투명이라 판이 보이지 않는다) */
    if ((G.pz || 0) >= gsPauseMax()) { toast("이번 판 일시정지를 다 썼어요"); return; }
    G.pz = (G.pz || 0) + 1;
  }
  G.paused = true; G.pauseAt = performance.now();
  if (G.raf) cancelAnimationFrame(G.raf); G.raf = 0;
  gsPauseUi(true);
  var lf = el("rgPauseLeft"), left = gsPauseMax() - (G.pz || 0);
  if (lf) lf.textContent = gsPauseMax() < 99 ? (left > 0 ? "이번 판 일시정지 " + left + "번 남음" : "이번 판 일시정지를 다 썼어요") : "";
}
function gsResumeState(G, frame) {
  if (!G.on || !G.paused) return;
  var gap = performance.now() - (G.pauseAt || performance.now());
  if (G.t0) G.t0 += gap;
  G.paused = false; G.last = performance.now();
  gsPauseUi(false);
  gsPauseBtnSync(G);
  G.raf = requestAnimationFrame(frame);
}
function gsBurst(G, x, y, n, cols) {
  if (rgReduced()) n = Math.min(n, 4);
  for (var i = 0; i < n && G.parts.length < 80; i++) {
    var a = (Math.PI * 2 * i) / n + Math.random() * 0.3, sp = 30 + Math.random() * 40;
    G.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, t: 0.5 + Math.random() * 0.3, c: cols[i % cols.length] });
  }
}
function gsFx(G, dt) {
  G.parts = G.parts.filter(function (p) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; return p.t > 0; });
  G.pops = G.pops.filter(function (p) { p.t -= dt; p.y -= 16 * dt; return p.t > 0; });
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  if (G.shake > 0) G.shake -= dt;
}
function gsFxDraw(ctx, G, W) {
  G.parts.forEach(function (p) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); });
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 9px sans-serif";
  G.pops.forEach(function (p) { rgStroke(ctx, p.text, Math.round(Math.max(28, Math.min(W - 28, p.x))), Math.round(p.y), p.c, RAIN_PAL.ink, 3); });
}
/* HUD 공용 · 흰 박스 + 점수 + 모래시계 막대 */
function gsHud(ctx, W, label, score, frac) {
  rgBox(ctx, 2, 2, W - 4, 15, RAIN_PAL.w);
  ctx.font = "bold 9px sans-serif"; ctx.textBaseline = "middle";
  ctx.fillStyle = RAIN_PAL.deep; ctx.textAlign = "left"; ctx.fillText(label, 6, 10);
  ctx.fillStyle = RAIN_PAL.ink; ctx.textAlign = "right"; ctx.fillText(String(score), W - 6, 10);
  rgBox(ctx, 14, 20, W - 18, 7, RAIN_PAL.w);
  ctx.fillStyle = frac < 0.2 ? RAIN_PAL.deep : RAIN_PAL.o100; ctx.fillRect(15, 21, Math.round((W - 20) * frac), 5);
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(4, 19, 7, 1); ctx.fillRect(4, 28, 7, 1); ctx.fillRect(5, 20, 5, 1); ctx.fillRect(6, 21, 3, 2); ctx.fillRect(7, 23, 1, 2); ctx.fillRect(6, 25, 3, 1); ctx.fillRect(5, 26, 5, 2);
}
function gsHeart(ctx, hx, y, state, jy) {
  jy = jy || 0;
  ctx.fillStyle = state === "on" ? RAIN_PAL.o100 : state === "blink" ? RAIN_PAL.o25 : state === "hit" ? RAIN_PAL.deep : RAIN_PAL.o25;
  ctx.fillRect(hx, y + jy, 3, 2); ctx.fillRect(hx + 4, y + jy, 3, 2); ctx.fillRect(hx, y + 2 + jy, 7, 2); ctx.fillRect(hx + 1, y + 4 + jy, 5, 1); ctx.fillRect(hx + 2, y + 5 + jy, 3, 1);
  if (state === "off" || state === "hit") { ctx.fillStyle = RAIN_PAL.w; ctx.fillRect(hx + 3, y + 1 + jy, 1, 4); }
}
/* v4.23 배너 · 어두운 이름표 + 주황 도트 글자(rain-engine.js 레트로 틀) */
function gsBannerDraw(ctx, G, W, y) {
  if (!G.banner) return;
  ctx.font = rtFont(16); var bw = Math.min(W - 8, Math.ceil(ctx.measureText(G.banner.text).width) + 24);
  rtTag(ctx, W / 2 - bw / 2, y, bw, 26, RT_PAL.night, RT_PAL.bark, RAIN_PAL.ink);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  rtText(ctx, G.banner.text, W / 2, y + 13, 16, RAIN_PAL.o100, null);
}
/* v4.23 카운트다운 = 도트 글자(rtCount) · 48 = 도트 3배 */
function gsCountDraw(ctx, cd, W, y0, y1) { rtCount(ctx, cd, W, y0, y1, 48); }
/* v4.23 판 안 끝 화면 = 공용 나무 판(rtEnd · 소나기와 같은 한 벌) · 점프(180 폭 도트 판)는 한 칸 2 · 제목 32(도트 2배) */
function gsEndDraw(ctx, ending, W, y0, y1, small) {
  if (!ending) return;
  rtEnd(ctx, W, y0, y1, ending.why === "full" ? "만점 " + olyFmt(olyCap()) : ending.why === "time" ? "TIME UP" : "GAME OVER", small, { s: 2, tp: 32, sp: 16, maxW: W - 8 });
}
/* ── 공용 화면 조각 · 닉네임 · 시작 · 결과 ── */
/* v4.08 AX-TDS 4단계 · 닉네임 = 입력·제출 화면 형식(전체 화면 · 아래 고정 주 버튼 + 약한 버튼) */
function gsNickHtml(key) {
  var nick = typeNick();
  return '<div class="ax-stack gs-root"><div class="ax-stack-tight">' +
    '<h1 class="ax-type-t2">닉네임 정하기</h1><p class="ax-description">순위판에는 닉네임만 나와요</p></div>' +
    '<div class="ax-stack-tight"><label class="ax-sr-only" for="tnIn">닉네임</label><input id="tnIn" class="ax-field" maxlength="8" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="예: 타자요정" value="' + esc(nick) + '" oninput="typeNickInput(this.value, event)" data-imeend="nick" onkeydown="onEnter(event, typeNickSave)" onfocus="kbFocus(this)">' +
    '<p class="ax-meta" id="tnMsg">' + (nick ? "지금 닉네임 · " + esc(nick) : "한글·영문·숫자 2~8자") + "</p></div></div>" +
    '<div class="ax-bottom axs-fix"><button type="button" class="ax-button" onclick="typeNickSave()">닉네임 저장하기</button></div>';   /* v4.09 버튼 하나 · 나가기는 헤더 뒤로(바꾸던 중이면 게임을 떠날 때 원래대로) */
}
function gsNeedNick() { return !typeNick() || S.get("type_nick_edit", false); }
/* o = { rootId, sub(부제 · v4.12) }
   v4.11 한 틀(사용자 요청 260922) · 흰 카드(미리보기 · 조작 한 줄 · 내 최고) + 작은 링크 줄(닉네임 · 순위판 · 소리) + 아래 고정 주 버튼 하나(design.md A-5 5-7)
   v4.28 (사용자 260924 「읽히지도 않고 가독성도 떨어지고 불필요」) 점수 공식 줄을 뺐다 · 시작 화면 = 이름 · 조작 한 줄 · 내 최고 · ▶ START · 공식은 결과 「점수 계산 보기」(gsRuleText)
   미리보기는 오락실 대기 화면 문법 = 「DEMO · 예시 화면」 깜빡임 + 흐리게(「이거 시작된 거야?」 혼란 · 동작 줄이기면 고정 표시) */
var GS_DEMO_TAG = '<span class="gs-demo">DEMO · 예시 화면</span>';
function gsStartHtml(key, o) {
  var g = GS_GAMES[key], nick = typeNick(), best = S.get(g.best, 0), D = GSP_DEMO[key];
  var H = GS_HOW[key], hOpen = !!H && !gsHowSeen(key);   /* v5.41 설명 · 처음이면 펼쳐 둔다 */
  if (hOpen) setTimeout(function () { var b = el("gsHow"); if (b) gshMount(b); }, 0);
  if (D) setTimeout(function () { gspMount(key); }, 0);
  if (olyEv(key)) olyPull();   /* v4.28 서버 최고를 미리 받아 둔다(결과 「신기록!」 판정 · 20초 간격 · 읽기 전용) */
  return '<div id="' + o.rootId + '" class="ax-stack gs-root gs-start">' +
    '<section class="ax-card gs-card rt-frame"><h1 class="ax-sr-only">' + esc(g.name) + "</h1>" +   /* 게임 이름은 헤더가 알린다(5-4) */
    (D ? '<div class="gs-prev" id="gsPrev" aria-hidden="true">' + D.html() + GS_DEMO_TAG + "</div>" :
      "") +
    '<div class="gs-info">' + (o.sub ? '<p class="gs-sub">' + esc(o.sub) + "</p>" : "") + (H ? gsHowHtml(key, false, "gsHow", !hOpen) : "") + '<p class="gs-ctl">' + esc(g.line) + "</p>" +   /* v5.41 설명이 펼쳐지면 조작 한 줄은 CSS 가 숨긴다(.gsh ~ .gs-ctl) */
    (H && !hOpen ? '<button type="button" class="gsh-tg" id="gsHowTg" aria-expanded="false" aria-controls="gsHow" onclick="gsHowToggle()">설명 보기 ▼</button>' : "") +   /* v4.12 부제(AI O/X · 유리다리 건너기) */   /* 조작 한 줄 · 첫 안내 말풍선과 같은 문구 · 3판 제한 없이 항상 보인다 */
    (best > 0 ? '<p class="gs-best">내 최고 ' + olyFmt(best) + "점" + "</p>" : "") + "</div></section>" +
    (olyIsQuiz(key) ? '<div class="gs-links">' + sndBtnHtml(false) + "</div>" :   /* v4.83 AX 퀴즈 = 닉네임 · 순위판 링크 없음 */
    '<div class="gs-links"><span>닉네임 <b>' + esc(nick) + '</b></span><button type="button" class="gs-edit" onclick="S.set(\'type_nick_edit\', true); App.render()">변경</button>' +
    '<span aria-hidden="true">·</span><button type="button" class="gs-edit" onclick="' + gsRankGo(key) + '">' + "순위판" + "</button>" + sndBtnHtml(false) + "</div>") +
    '<div class="ax-bottom axs-fix"><button type="button" class="ax-button rt-btn" id="gsGo" aria-label="게임 시작하기" onclick="gsBegin(\'' + key + '\')">▶ START</button></div></div>';   /* v4.23 오락실 버튼 · 읽기 프로그램에는 「게임 시작하기」 */
}
/* ── v4.11 시작 화면 미리보기 · 게임의 실제 그리기 함수(판·장애물·블록·타일·문제 카드)로 짧은 데모를 반복한다 ──
   화면에 보일 때만 돈다(IntersectionObserver · 탭 숨김이면 멈춤) · 30fps 상한 · 동작 줄이기 = 대표 장면 한 장(still) ·
   게임을 시작하면(gsBegin) 멈춘다 · 시작 화면이 사라지면(다시 그리기 · 결과 화면) 다음 틱에 스스로 멈춘다 */
var GSP = { key: "", fn: null, box: null, io: null, vis: false, raf: 0, t: 0, last: 0 };
var GSP_DEMO = {
  pang: { html: function () { return '<canvas id="pgPrev" width="180" height="174" aria-hidden="true"></canvas>'; }, draw: function (t) { pgPreview(t); }, still: 0.5 },
  jump: { html: function () { return '<canvas id="jpPrev" class="px" width="180" height="120" aria-hidden="true"></canvas>'; }, draw: function (t) { jpPreview(t); }, still: 1.77 },
  tetris: { html: function () { return '<canvas id="ttPrev" width="120" height="120" aria-hidden="true"></canvas>'; }, draw: function (t) { ttPreview(t); }, still: 0.9 },
};
function gspK() { return Math.min(3, window.devicePixelRatio || 1) * 2; }   /* 캔버스 해상도 배수 · 칸 그림을 선명하게(도트 점프 제외) */
function gspStop() {
  if (GSP.raf) cancelAnimationFrame(GSP.raf);
  if (GSP.io) GSP.io.disconnect();
  GSP.raf = 0; GSP.io = null; GSP.fn = null; GSP.box = null; GSP.vis = false;
}
function gspMount(key) {
  gspStop();
  var D = GSP_DEMO[key], box = el("gsPrev"); if (!D || !box) return;
  GSP.key = key; GSP.box = box; GSP.t = 0;
  D.draw(D.still);   /* 대표 장면으로 크기를 잰다 */
  gspFit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (GSP.box === box) { gspFit(); if (!GSP.fn) D.draw(D.still); } });   /* v4.23 도트 글꼴이 늦게 와도 정지 화면을 다시 그린다 */
  if (rgReduced()) return;   /* 동작 줄이기 · 정지 화면 */
  GSP.fn = D.draw;
  D.draw(0);
  if (window.IntersectionObserver) {
    GSP.io = new IntersectionObserver(function (es) { GSP.vis = es[es.length - 1].isIntersecting; gspKick(); });
    GSP.io.observe(box);
  } else { GSP.vis = true; gspKick(); }
}
function gspKick() { if (GSP.fn && GSP.vis && !document.hidden && !GSP.raf) { GSP.last = performance.now(); GSP.raf = requestAnimationFrame(gspTick); } }
function gspTick(now) {
  GSP.raf = 0;
  if (!GSP.fn) return;
  if (!GSP.box || !GSP.box.isConnected) { gspStop(); return; }
  if (!GSP.vis || document.hidden) return;
  var dt = (now - GSP.last) / 1000;
  if (dt >= 0.032) { GSP.t += Math.min(0.1, dt); GSP.last = now; GSP.fn(GSP.t); }
  GSP.raf = requestAnimationFrame(gspTick);
}
document.addEventListener("visibilitychange", gspKick);
/* 스크롤 없이 한 화면 · 미리보기 높이로 맞춘다(360 → 넘친 만큼 줄임 · 최소 140) · 글자 판(기억력·O/X)은 상자 안에 맞춰 줄인다 */
function gspFit() {
  var box = el("gsPrev"); if (!box) return;
  var cv = box.querySelector("canvas"), d = box.querySelector(".gsp-dom"), W = box.clientWidth - 24, h = 360;
  if (cv) h = Math.min(h, Math.round(W * cv.height / cv.width) + 24);   /* 넓은 그림은 그림 비율만큼만 */
  if (d) { d.style.transform = ""; d.style.width = W + "px"; h = Math.min(h, d.offsetHeight + 24); }
  box.style.height = h + "px";
  var over = document.documentElement.scrollHeight - window.innerHeight;
  if (over > 0) box.style.height = Math.max(140, h - over) + "px";
  if (!d) return;
  var H = box.clientHeight - 24;
  var s = Math.min(1, H / Math.max(1, d.offsetHeight));
  if (s < 1) { d.style.width = W / s + "px"; s = Math.min(s, H / Math.max(1, d.offsetHeight), 1); }
  d.style.transform = "scale(" + s + ")";
  d.style.top = 12 + Math.max(0, (H - d.offsetHeight * s) / 2) + "px";
}
window.addEventListener("resize", function () { if (el("gsPrev")) gspFit(); });
function gsRankGo(key) { return "S.set('oly_tab', 'event'); S.set('oly_ev', '" + key + "'); App.go('oly_rank')"; }
/* v4.23 공용 GAME OVER 패널 · 다섯 게임 + 단어 소나기(앱 솔로 · 1F 현장 타자왕전) 결과가 모두 이 한 틀을 쓴다(사용자 확정 260923 · design.md A-5 5-16 · 검사 82절)
   어두운 판 · 나무 이중 테두리 · 계단 모서리 · 도트 글꼴 · 각진 오락실 버튼(부른 쪽이 rt-btn 으로 둔다) · 시안 §3
   o = { title 큰 도트 제목(GAME OVER · TIME UP · CLEAR · 만점 …), sub 게임 이름 · 닉네임, line 게임 고유 한 줄(O/X 「풍덩」 · 소나기 「단어 5개를 놓쳤어요」), body 점수 · 구성 표 HTML } */
function rtGoHtml(o) {
  return '<section class="ax-card gs-res rt-go rt-frame dk"><p class="rt-go-t">' + esc(o.title) + "</p>" +
    '<p class="rt-go-s">' + esc(o.sub) + "</p>" + (o.line ? '<p class="rt-go-l">' + esc(o.line) + "</p>" : "") + (o.body || "") + "</section>";
}
/* r = { why, title(v4.23 큰 제목 · 없으면 why 로), line(게임 고유 한 줄), oly(올림픽 종목) 또는 score · l2 · l3 · ref · fold(올림픽 밖 · 팡 미완주 · 소나기), banner } · 여섯 게임 결과 화면 형식이 같다 */
function gsResultHtml(key, r) {
  var g = GS_GAMES[key];
  /* v4.08 AX-TDS 4단계 · 결과 = 카드(점수 · 구성 표 · 내 위치) + 아래 버튼 줄(주 1 + 약한 2)
     v4.23 카드 = 공용 GAME OVER 패널(rtGoHtml) · 버튼 = 오락실 버튼 · 아래 카드(AI 상식 · 라운드 · 틀린 문제)는 밝은 나무 틀(rt-extra)
     v4.28 (사용자 260924 「점수가 왜 이렇게 산정됐는지가 너무 구구절절」) 보이는 것 = 세 줄(점수 · 내 최고 비교 · AX 올림픽 진행) · 나머지는 「점수 계산 보기」 접힘 */
  var qzR = olyIsQuiz(key);   /* v4.83 AX 퀴즈 = 순위판 없음 · 닉네임 없음 · 두 번째 버튼은 AX 퀴즈 목록 */
  if (!qzR) tourRetDone(false);   /* v5.57 미니 게임 한 판 결과 = 마침(둘러보기에서 출발했으면 뒤로 = 1층) · 3종 스탬프가 새로 들어오면 연출 뒤 자동 */
  var tr = tourRetLive();
  return rtGoHtml({ title: r.title || (r.why === "done" ? "CLEAR" : r.why === "time" ? "TIME UP" : "GAME OVER"), sub: qzR ? g.name : g.name + " · " + (typeNick() || "익명 참가자"), line: r.line || "",
      body: r.oly ? olyResultBody(r.oly) : gsPlainBody(key, r) }) +
    (r.banner ? '<div class="rt-extra">' + r.banner + "</div>" : "") +
    '<div class="ax-stack-tight gs-res-go"><button type="button" class="ax-button rt-btn" onclick="' + g.start + '">다시 하기</button>' +
    (qzR ? '<button type="button" class="ax-button ax-button-weak rt-btn weak" onclick="App.go(\'quiz\')">AX 퀴즈 보기</button>' :
      '<button type="button" class="ax-button ax-button-weak rt-btn weak" onclick="' + gsRankGo(key) + '">' + "순위판 보기" + "</button>") +   /* v5.30 타자 = 1F 현장 순위판만 있다(사용자 261003) */
    (tr ? "" : '<button type="button" class="ax-button ax-button-weak rt-btn weak" onclick="App.go(\'passport\')">스탬프 보기</button>') + "</div>";   /* v5.67 둘러보기에서 출발 = 아래 버튼 없음 · 떠 있는 「3D로 돌아가기」(trf) 하나 */
}
/* v4.28 결과 접힘 조각 · 여섯 곳(다섯 게임 + 단어 소나기 앱 솔로 · 1F 현장)이 같이 쓴다 · 「점수에는 들어가지 않아요」 같은 설명 문장 대신 제목 줄(점수 구성 · 참고 기록 · 점수 규칙 · 내 위치)로 나눈다 */
function rtFoldHtml(label, body) {
  return '<details class="rt-fold"><summary>' + esc(label) + ' <span class="rt-fold-a" aria-hidden="true">▾</span></summary><div class="rt-fold-b">' + body + "</div></details>";
}
function rtFoldSec(title, html) { return html ? '<p class="rt-fold-h">' + esc(title) + "</p>" + html : ""; }
/* 참고 기록 표 · rows = [[이름, 값]] · 값이 없는 줄은 뺀다 */
function rtRefTable(rows) {
  rows = (rows || []).filter(function (x) { return x && x[1] !== "" && x[1] != null; });
  return rows.length ? '<table class="oly-brk ref">' + rows.map(function (x) { return "<tr><th>" + esc(x[0]) + '</th><td class="n">' + esc(String(x[1])) + "</td></tr>"; }).join("") + "</table>" : "";
}
/* 점수 공식 한 줄 · 시작 화면에서 걷어 결과 접힘 안으로 옮겼다(v4.28) */
function gsRuleText(key) {
  if (key === "jump") return "하트 " + JP_HEARTS + "개 · " + olyRuleLine("jump");
  if (key === "ox") { var R = olyRule().ox; return R.sec / 100 + "초 · " + (R.per[0] + R.per[1] + R.per[2]) + "줄 · 목숨 " + R.lives + " · " + olyRuleLine("ox"); }
  return olyRuleLine(key);
}
/* 올림픽 밖 결과(팡 미완주 · 단어 소나기) · r = { score, l2, l3, ref, fold } · 같은 세 줄 + 접힘 */
function gsPlainBody(key, r) {
  return '<p class="gs-sc">' + esc(String(r.score)) + "</p>" + (r.l2 ? '<p class="gs-l2">' + esc(r.l2) + "</p>" : "") + (r.l3 ? '<p class="gs-l3">' + esc(r.l3) + "</p>" : "") +
    rtFoldHtml(r.fold || "점수 계산 보기", rtFoldSec("참고 기록", rtRefTable(r.ref)) + rtFoldSec("점수 규칙", '<p class="rt-fold-p">' + esc(gsRuleText(key)) + "</p>"));
}
