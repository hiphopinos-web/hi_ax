/* ═══ 계단 동행 · 챗봇이 내 앞에서 같이 계단을 간다 (사용자 261009 · 2차 「준비 운동은 거창 · 대각선 계단이 내려오고 챗봇은 점프 점프 · 다섯 번 오르면 뒤돌아 땀 쪼르륵 · 한마디 · 눈웃음」) ═══
   자리 = 출발 QR 뒤 진행 화면(라우트 stair · STR.mode "start") · 판정 · 서버 · 대기열은 그대로(114 stair_scan) · 이 조각은 화면 경험만
   무대 = 대각선 계단(점 무늬 · 디딤판 점 줄) · 챗봇은 화면 안 제자리(가운데 약간 위) · 점프할 때마다 계단이 한 칸씩 대각선 아래로 흘러 내려온다(내 앞에서 오르는 것처럼)
          밟은 칸 디딤판은 주황으로 켜진다 · 18F 출발 = 좌우 뒤집고 반대로 흐름(내려가기) · 말은 「계단」 중립
   한 고리(약 7~9초) = 뒷모습으로 콩콩 점프 5번(작은 숫자 하나 · 둘 · 셋 · 넷 · 다섯) → 앞으로 돌아섬 → 땀방울 쪼르륵 → 말풍선 한 번 + 눈웃음 → 다시 돌아서서 다음 고리
   말 = 홀수 고리 짧은 응원(12개 · 직전과 안 겹치게 섞음 · 첫마디 「힘내요!」) · 짝수 고리 행사 말(프로그램 → AX 상식 → 엘리베이터 감사(한 번) → 계단 → 상식 · 프로그램 · 상식 · 계단 …)
          같은 출발 안에서 행사 말은 다 쓰기 전까지 다시 나오지 않는다 · 3분 · 5분 이정표 한 번씩
   긴 체류 = 8분부터 절약(점프 · 흐름 · 돌기 그림 멈춤 · 말 간격 넓힘 · 응원 자리에 도착 안내) · 15분부터 쉼(말 멈춤 · 도착 안내 한 줄 고정 · 화면 켜 두기 놓음)
          20분부터 고정 줄 = 「30분이 지나면 도착 층을 직접 골라요」(서버 계단_정정분 30 · 그 뒤 도착 스캔은 보정 화면)
   화면 켜 두기 = Wake Lock(지원 기기만 · 실패는 조용히) · 떠나거나 가려지면 놓고 멈춘다 · 다시 보이면 이어서 · 다시 그려져도 그 자리부터(상태 = STB · 출발 leg since 마다 하나)
   동작 줄이기 = 정지 그림(앞모습 눈웃음) + 말풍선만 · 말 순서는 같다
   AX 상식 = 새로 지어내지 않는다 · 점프 AX 상식(JP_FACTS · 1층 판 근거)은 그 글 그대로 · AX 퀴즈 해설(OX_BANK)은 말투만 바꿈 · 출처 id 를 같이 적는다(검사 346)
   계단 말 = 숫자 · 의학 효과 없이 담백한 일반 문장만 · 캐릭터 = 원본 BOT_SVG(path 그대로) + 안테나 전파 + 눈웃음 + 땀방울(새 요소 하나) · 뒷모습 = 눈을 숨긴 원본 */
var STB_HOPS = 5, STB_HOP_MS = 600, STB_TURN_MS = 360, STB_TYPE_MS = 45, STB_NUDGE_MS = 20000;
var STB_SAVE_MS = 8 * 60000, STB_REST_MS = 15 * 60000, STB_FIX_MS = 20 * 60000;
var STB_COUNT = ["하나", "둘", "셋", "넷", "다섯"];
var STB_HELLO = "같이 가요! 화면은 켠 채로 두세요";
var STB_CUTE = ["힘내요!", "화이팅!", "한 칸만 더!", "잘하고 있어요", "같이 가요!", "거의 다 왔어요", "멋져요!", "한 걸음씩 차근차근", "뛰지 말고 천천히", "숨 고르고 가요", "벌써 이만큼 왔어요", "오늘도 최고예요"];
/* 계단 말 · 숫자 · 의학 효과 없이 */
var STB_GOOD = ["계단은 가까이 있는 좋은 운동이에요", "따로 시간 내지 않아도 하는 운동이에요", "천천히 걸어도 좋은 운동이 돼요", "계단을 쓰면 엘리베이터가 덜 붐벼요", "엘리베이터 기다리는 시간도 아껴요", "걷다 보면 생각이 정리되기도 해요"];
var STB_THANKS = "오늘 엘리베이터가 붐벼 불편하시죠?\n계단에 함께해 주셔서 감사해요";   /* 사용자 문장 · 말풍선 두 줄에 맞춤 · 한 출발에 한 번 */
var STB_PROG_Q = "오늘 프로그램 참여해 보셨어요?";
var STB_MILE = [[3, "벌써 3분째 같이 걷고 있어요"], [5, "5분째 함께예요\n도착하면 QR을 꼭 찍어요"]];
var STB_ARRIVE = "도착하면 아래 버튼으로 QR을 찍어요";
var STB_FIXLINE = "출발 30분이 지나면\n도착 층을 직접 골라요";
/* [출처 id, 말] · 말이 비면 JP_FACTS 의 그 글 그대로 */
var STB_FACTS = [
  ["jp01"], ["A02", "AI가 자신 있게 말해도 틀릴 수 있어요. 따로 확인해요"], ["jp07"], ["A05", "읽을 사람을 알려 주면 AI가 맞춤 답을 줘요"],
  ["jp02"], ["A28", "AI가 없는 출처를 지어낼 때도 있어요"], ["jp08"], ["A26", "역할을 정해 주면 AI 답의 관점이 맞춰져요"],
  ["jp03"], ["jp05"], ["jp06"], ["A29", "AI 요약은 중요한 내용을 빼먹을 수 있어요"], ["jp09"], ["A30", "「이 자료만 보고 답해 줘」처럼 범위를 정해 줘요"],
  ["jp15"], ["jp16"], ["F02", "AX는 AI Transformation의 약자예요"], ["jp17"], ["F50", "결과물은 A4 1장처럼 형태를 구체적으로 알려 줘요"],
  ["jp19"], ["F22", "지금의 DAP는 나만의 Agent의 첫걸음이에요"], ["jp22"], ["jp29"]
];
var STB = null, STBWL = { l: null, req: false };
function stbRm() { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
function stbFactText(f) {
  if (f[1]) return f[1];
  var j = (typeof JP_FACTS !== "undefined" ? JP_FACTS : []).filter(function (x) { return x.id === f[0]; })[0];
  return j ? j.text : "";
}
/* 다음 참여 · 지금 스탬프(8종 중 안 받은 것 · 6개 상한) · 시각으로 · [키, 짧은 말] · 6개면 빈 목록 · 사은품 · 가격 · 10F 말 없음 */
function stbSugs() {
  var st = S.get("stamps", []) || [], has = function (id) { return st.indexOf(id) >= 0; };
  if (stampCount() >= STAMP_DENOM) return [];
  var ph = evPhase(), hm = hmNow(), out = [];
  if (!has("sv") && surveyOpen()) out.push(["sv", "설문은 60초면 끝나요"]);   /* 14:30부터(서버 survey_submit 와 같은 surveyOpen) */
  if (ph === "live" && progUnits() < 2 && hm >= 780 && hm < 1000) out.push(["p3", "17F 오후 강연, 스탬프 2개예요"]);   /* 13:00~16:40 · AWS 13:30 · MS 15:10 */
  if (ph === "live" && !has("p2") && hm >= 570 && hm < 990) out.push(["p2", "1F AX PLAY도 체험해 봐요"]);   /* 09:30~16:30 */
  if (!has("qz")) out.push(["qz", "AX 퀴즈 5문제도 있어요"]);
  if (!has("p4")) out.push(["p4", "미니 게임 " + Math.max(1, MG_NEED - mgDone()) + "종목, 한 판씩 어때요?"]);
  if (!has("p5")) out.push(["p5", "아이디어 한 줄도 남겨 봐요"]);
  return out;
}
function stbSince() { var o = STR.res || {}, s = stairState(); return o.since || (s.leg && s.leg.since) || 0; }
function stbDown() { return Number((STR.res || {}).fl) >= 18; }
function stbAge() { return STB ? Date.now() - STB.leg : 0; }
function stbEnsure(since) {
  if (STB && STB.leg === since) return STB;
  var cute = STB_CUTE.slice(1);
  shuf(cute);
  STB = { leg: since, loop: 0, ph: "climb", hop: 0, line: { t: STB_HELLO, m: "smile" }, n: 0, done: false, t: 0, tType: 0,
    cute: [STB_CUTE[0]].concat(cute), ci: 0, ev: 0, fi: Math.floor(Math.random() * STB_FACTS.length), fn: 0, gi: 0, used: {}, thx: false, congr: false, mile: {}, save: false, rest: false, log: [] };
  if (stbRm()) { STB.n = STB.line.t.length; STB.done = true; }
  return STB;
}
/* 짝수 고리의 행사 말 · j = 짝수 고리 차례(0부터) · 프로그램 → 상식 → 감사 → 계단 → (상식 · 프로그램 · 상식 · 계단) 되풀이 */
function stbEventLine(b, j) {
  var cat = j === 0 ? "p" : j === 1 ? "f" : j === 2 ? "t" : j === 3 ? "b" : ["f", "p", "f", "b"][(j - 4) % 4];
  if (cat === "t") { if (!b.thx) { b.thx = true; return { t: STB_THANKS, m: "smile", k: "thanks" }; } cat = "f"; }
  if (cat === "p") {
    if (stampCount() >= STAMP_DENOM) { if (!b.congr) { b.congr = true; return { t: "스탬프 " + STAMP_DENOM + "개를 다 모았어요\n축하해요!", m: "smile", k: "congr" }; } cat = "f"; }
    else {
      var sg = stbSugs().filter(function (x) { return !b.used[x[0]]; })[0];
      if (sg) { b.used[sg[0]] = 1; return { t: STB_PROG_Q + "\n" + sg[1], m: "smile", k: "prog:" + sg[0] }; }
      cat = "f";
    }
  }
  if (cat === "b" && b.gi < STB_GOOD.length) return { t: STB_GOOD[b.gi++], tag: "계단", m: "smile", k: "good" };
  var fs = "", i;
  for (i = 0; i < STB_FACTS.length && !fs; i++) fs = stbFactText(STB_FACTS[(b.fi + b.fn++) % STB_FACTS.length]);
  return { t: fs || STB_CUTE[0], tag: fs ? "AX 상식" : "", m: fs ? "wave" : "smile", k: "fact" };
}
function stbCuteLine(b) {
  if (b.ci >= b.cute.length) {   /* 한 바퀴를 다 쓰면 다시 섞기 · 첫 말이 직전 말과 같지 않게 */
    var last = b.cute[b.cute.length - 1], nx = shuf(STB_CUTE.slice());
    if (nx[0] === last) nx.push(nx.shift());
    b.cute = nx; b.ci = 0;
  }
  return { t: b.cute[b.ci++], m: "smile", k: "cute" };
}
/* 고리 끝에 할 말 · 이정표(3분 · 5분 한 번씩)가 먼저 · 홀수 고리 = 응원(절약 중이면 도착 안내) · 짝수 고리 = 행사 말 */
function stbPick(b) {
  var age = stbAge(), i, ln;
  for (i = 0; i < STB_MILE.length && !ln && !b.save; i++) if (age >= STB_MILE[i][0] * 60000 && !b.mile[STB_MILE[i][0]]) { b.mile[STB_MILE[i][0]] = 1; ln = { t: STB_MILE[i][1], m: "smile", k: "mile" }; }   /* 한 번에 하나 · 절약 중에는 도착 안내가 대신 */
  if (!ln) ln = b.loop % 2 ? (b.save ? { t: STB_ARRIVE, m: "smile", k: "arrive" } : stbCuteLine(b)) : stbEventLine(b, b.ev++);
  if (b.log.length < 400) b.log.push([Math.round(age / 1000), b.loop, ln.k, ln.t]);
  return ln;
}
/* ── 그림 · 320 × 220 칸 · 점 간격 8 · 한 칸 = 오른쪽 32 · 위 16 · 칸 0 = 챗봇이 선 칸(디딤판 왼쪽 x 132 · y 148) · 앞뒤로 넉넉히(흐를 때 빈 곳 없게) ── */
function stbStairSvg() {
  var X0 = 132, Y0 = 148, i, x, y, prof = "M" + (X0 - 32 * 7) + " 280", lit = "", gray = "";
  for (i = -7; i <= 8; i++) {
    x = X0 + 32 * i; y = Y0 - 16 * i;
    prof += " L" + x + " " + (y + 4) + " L" + (x + 32) + " " + (y + 4);
    if (i <= 0) lit += "M" + x + " " + y + "h28"; else gray += "M" + x + " " + y + "h28";
  }
  prof += " L" + (X0 + 32 * 9) + " 280Z";
  return '<svg class="stb-st" viewBox="0 0 320 220" aria-hidden="true"><defs><pattern id="stbDot" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.4"/></pattern></defs>' +
    '<path class="pf" d="' + prof + '"/><path class="tr" d="' + gray + '"/><path class="tr on" d="' + lit + '"/></svg>';
}
/* 땀방울 · 원본에 없는 새 요소 하나(머리 오른쪽 위 · 돌아설 때만 흐른다) */
var STB_SWEAT = '<path class="sw" d="M152 52 C157 60 161 65 161 70 A9 9 0 0 1 143 70 C143 65 147 60 152 52Z"/>';
function stbBotHtml(b) {
  return '<span class="stb-bot' + (b.ph === "talk" || stbRm() || b.save || b.rest ? " face" : "") + '" id="stbBot" data-m="' + ((b.line && b.line.m) || "") + '"><span class="stb-hop">' +
    BOT_SVG.replace("</svg>", BOT_WAVE + TOUR_BOT_SM + STB_SWEAT + "</svg>") + "</span></span>";
}
function stbHtml(o, s, since) {
  var b = stbEnsure(since), down = stbDown(), ln = b.line || { t: "" };
  if (!b.rest && stbAge() >= STB_REST_MS) stbRestLine(b);
  return '<div class="ax-stack-tight stb-where"><h1 class="ax-title">' + esc(o.fl) + "F · " + esc(o.route || stairRoute(o.r)) + "</h1>" +
    '<p class="ax-meta" id="stElapsed">시작 ' + esc(o.at || (s.leg && s.leg.at) || "") + " · " + stairElapsed(since) + "</p></div>" +
    '<button type="button" class="stb-bub" id="stbBub" aria-label="다음 말 보기" onclick="stbSkip()">' +   /* 말풍선 = 단추(누르면 다 보이기 · 다음으로) · 읽어 주기는 아래 stbSr 한 줄 */
      '<span class="stb-tx" aria-hidden="true">' + (ln.tag ? '<span class="stb-tag" id="stbTag">' + ln.tag + "</span>" : '<span class="stb-tag" id="stbTag" hidden></span>') +
      '<span id="stbTx">' + esc(ln.t.slice(0, b.n)) + '</span><i class="stb-more' + (b.done ? " on" : "") + '" id="stbMore"></i></span></button>' +
    '<p class="stb-sr" id="stbSr" aria-live="polite">' + esc((ln.tag ? ln.tag + " · " : "") + ln.t) + "</p>" +
    '<div class="stb-stage' + (down ? " down" : "") + (stbRm() || b.save || b.rest ? " still" : "") + '" id="stbStage">' +
      '<div class="stb-flip"><div class="stb-flow" id="stbFlow">' + stbStairSvg() + "</div>" + stbBotHtml(b) + "</div>" +
      '<span class="stb-cnt" id="stbCnt" aria-hidden="true"></span></div>' +
    '<p class="axs-safe">' + STAIR_SAFE + "</p>" +
    '<p class="ax-meta stb-cap">도착 층 방화문 앞 QR 스캔 · ' + ((s.goal || 1) > 1 ? "누적 " + (s.total || 0) + " / " + s.goal + "개 층" : (s.total || 0) >= 1 ? "오늘 " + s.total + "개 층 이동" : "한 개 층만 이동해도 적립") + "</p>";
}
/* 아래 고정 큰 단추 · 처음부터 늘 · 출발 20초 뒤 = 숨 쉬는 고리 */
function stbFoot(since) {
  return '<div class="axs-fix ax-bottom stb-foot"><button type="button" class="ax-button stb-go' + (Date.now() - since >= STB_NUDGE_MS ? " nudge" : "") + '" id="stbGo" onclick="scanOpen(\'st\')">' +
    '<svg aria-hidden="true"><use href="#qr-corners"/></svg><span>도착 층 QR 찍기</span></button></div>';
}
/* ── 말풍선 ── */
function stbPaintLine() {
  var b = STB, ln = b && b.line; if (!ln) return;
  var tx = el("stbTx"), tg = el("stbTag"), mo = el("stbMore"), bot = el("stbBot");
  if (tx) tx.textContent = ln.t.slice(0, b.n);
  if (tg) { tg.hidden = !ln.tag; tg.textContent = ln.tag || ""; }
  if (mo) mo.classList.toggle("on", b.done);
  if (bot) bot.dataset.m = ln.m || "";
}
function stbSay(ln, after) {
  var b = STB; if (!b) return;
  if (b.tType) { clearInterval(b.tType); b.tType = 0; }
  b.line = ln; b.n = 0; b.done = false; b.after = after || null;
  var sr = el("stbSr"); if (sr) sr.textContent = (ln.tag ? ln.tag + " · " : "") + ln.t;
  var bub = el("stbBub"); if (bub && !stbRm()) { bub.classList.remove("pop"); void bub.offsetWidth; bub.classList.add("pop"); }   /* 새 말 = 말풍선이 톡 */
  if (stbRm()) { b.n = ln.t.length; b.done = true; stbPaintLine(); if (b.after) b.after(); return; }
  stbPaintLine(); stbType();
}
function stbType() {
  var b = STB; if (!b || b.tType || b.done) return;
  b.tType = setInterval(function () {
    if (STB !== b) return;
    b.n = Math.min(b.line.t.length, b.n + 1);
    if (b.n >= b.line.t.length) { clearInterval(b.tType); b.tType = 0; b.done = true; stbPaintLine(); if (b.after) b.after(); return; }
    var tx = el("stbTx"); if (tx) tx.textContent = b.line.t.slice(0, b.n);
  }, STB_TYPE_MS);
}
/* ── 고리 · 한 타이머(b.t)로 다음 일을 잇는다 ── */
function stbNext(fn, ms) { var b = STB; if (!b) return; if (b.t) clearTimeout(b.t); b.t = setTimeout(function () { b.t = 0; if (STB === b) fn(); }, ms); }
function stbHoldMs(ln) { return STB.save ? 6000 : stbRm() ? 4000 : Math.min(4500, Math.max(2800, 1200 + 70 * ln.t.length)); }
function stbLoop() {
  var b = STB; if (!b) return;
  if (!b.rest && stbAge() >= STB_REST_MS) { stbRest(); return; }
  if (!b.save && stbAge() >= STB_SAVE_MS) { b.save = true; var g = el("stbStage"); if (g) g.classList.add("still"); }   /* 8분 = 절약 · 그림 멈춤 */
  b.loop++; b.ph = "climb"; b.hop = 0;
  var go = el("stbGo"); if (go && stbAge() >= STB_NUDGE_MS) go.classList.add("nudge");   /* 출발 20초 뒤 = 도착 단추 숨 쉬기 */
  var bot = el("stbBot"); if (bot) bot.classList.toggle("face", b.save || stbRm());   /* 오를 때 = 뒷모습 · 정지 그림 = 앞모습 */
  if (b.save || stbRm()) { stbNext(stbFace, b.save ? 6000 : 3000); return; }
  stbNext(stbHop, 120);
}
function stbHop() {
  var b = STB; if (!b) return;
  b.hop++;
  var bot = el("stbBot"), fl = el("stbFlow"), cn = el("stbCnt"), ab = b.hop % 2 ? "a" : "b";
  if (bot) { delete bot.dataset.t; bot.dataset.h = ab; }   /* 점프와 돌기는 같은 칸(.stb-hop)을 움직인다 · 하나만 */
  if (fl) fl.dataset.h = ab;   /* 계단 한 칸 흘러 내려옴 · 점프와 같은 길이 */
  if (cn) { cn.textContent = STB_COUNT[b.hop - 1] || ""; cn.dataset.h = ab; }
  if (b.hop < STB_HOPS) stbNext(stbHop, STB_HOP_MS); else stbNext(stbFace, STB_HOP_MS + 150);
}
/* 앞으로 돌아섬 → 땀 쪼르륵 → 한마디 + 눈웃음 → 다 말하면 기다렸다 다시 돌아섬 */
function stbFace() {
  var b = STB; if (!b) return;
  b.ph = "talk";
  var bot = el("stbBot"), still = b.save || stbRm();
  if (bot && !still) { delete bot.dataset.h; bot.dataset.t = bot.dataset.t === "a" ? "b" : "a"; setTimeout(function () { var e = el("stbBot"); if (e && STB === b && b.ph === "talk") e.classList.add("face"); }, STB_TURN_MS / 2); }
  if (bot && !still) { bot.dataset.s = bot.dataset.s === "a" ? "b" : "a"; bot.dataset.m = ""; }
  b.said = false;
  stbNext(stbSpeak, still ? 0 : STB_TURN_MS + 420);
}
function stbSpeak() {
  var b = STB; if (!b) return;
  var ln = stbPick(b);
  b.said = true;
  stbSay(ln, function () { stbNext(stbBack, stbHoldMs(ln)); });
}
function stbBack() {
  var b = STB; if (!b) return;
  var bot = el("stbBot");
  if (bot && !b.save && !stbRm()) { bot.dataset.t = bot.dataset.t === "a" ? "b" : "a"; setTimeout(function () { var e = el("stbBot"); if (e && STB === b) e.classList.remove("face"); }, STB_TURN_MS / 2); stbNext(stbLoop, STB_TURN_MS + 80); return; }
  stbLoop();
}
/* 15분 = 쉼 · 말 멈춤 · 도착 안내 한 줄 고정(20분부터 30분 보정 안내) · 화면 켜 두기 놓음 · 다음 바뀔 때 한 번만 깨운다 */
function stbRestLine(b) {
  b.rest = true; b.save = true; b.ph = "rest";
  b.line = { t: stbAge() >= STB_FIX_MS ? STB_FIXLINE : STB_ARRIVE, m: "smile", k: "rest" }; b.n = b.line.t.length; b.done = true;
}
function stbRest() {
  var b = STB; if (!b) return;
  stbStop(); stbRestLine(b); stbPaintLine(); stbWake(false);
  var sr = el("stbSr"); if (sr) sr.textContent = b.line.t;
  var g = el("stbStage"); if (g) g.classList.add("still");
  var bot = el("stbBot"); if (bot) bot.classList.add("face");
  if (stbAge() < STB_FIX_MS) stbNext(stbRest, STB_FIX_MS - stbAge() + 500);
}
/* 말풍선 누름 = 쓰는 중이면 다 보이기 · 다 보였으면 곧바로 돌아서서 다음 · 오르는 중이면 곧바로 돌아서서 한마디 */
function stbSkip() {
  var b = STB; if (!b || b.rest) return;
  if (b.ph === "talk" && !b.done) { if (b.tType) { clearInterval(b.tType); b.tType = 0; } b.n = b.line.t.length; b.done = true; stbPaintLine(); stbNext(stbBack, 2500); return; }
  if (b.ph === "talk") { stbNext(stbBack, 0); return; }
  stbNext(stbFace, 0);
}
/* ── 붙이기 · 떼기 · 라우터가 stair 화면을 그린 뒤 부른다 ── */
function stbMount() {
  if (App.current !== "stair" || STR.mode !== "start" || !el("stbStage") || !STB) { stbLeave(); return; }
  var b = STB;
  if (b.rest) { if (!b.t && stbAge() < STB_FIX_MS) stbNext(stbRest, STB_FIX_MS - stbAge() + 500); return; }   /* 쉼 = 화면 켜 두기 없음 */
  stbWake(true);
  if (document.hidden || b.t) return;
  if (!b.done) { if (!b.tType) stbType(); }   /* 쓰다 만 말 · 첫 인사 */
  if (b.ph === "talk") {
    if (!b.said) { var bt = el("stbBot"); if (bt) bt.classList.add("face"); stbNext(stbSpeak, 300); }   /* 돌아선 뒤 말하기 전에 멈췄다 */
    else if (b.done) stbNext(stbBack, 1500); else b.after = function () { stbNext(stbBack, stbHoldMs(b.line)); };
    return;
  }
  if (b.loop === 0 || b.hop >= STB_HOPS) { stbNext(b.loop === 0 ? stbLoop : stbFace, 300); return; }
  if (b.save || stbRm()) stbNext(stbFace, 3000); else stbNext(stbHop, 300);
}
function stbStop() {
  var b = STB; if (!b) return;
  if (b.tType) { clearInterval(b.tType); b.tType = 0; if (b.ph === "talk") b.after = null; }
  if (b.t) { clearTimeout(b.t); b.t = 0; }
}
function stbLeave() { stbStop(); stbWake(false); }
function stbWake(on) {
  if (!on) { var l = STBWL.l; STBWL.l = null; if (l) { try { var p = l.release(); if (p && p.catch) p.catch(function () {}); } catch (e) {} } return; }
  if (STBWL.l || STBWL.req || document.hidden) return;
  try {
    if (!navigator.wakeLock || typeof navigator.wakeLock.request !== "function") return;
    STBWL.req = true;
    navigator.wakeLock.request("screen").then(function (l) {
      STBWL.req = false;
      if (App.current !== "stair" || STR.mode !== "start" || (STB && STB.rest)) { try { var p = l.release(); if (p && p.catch) p.catch(function () {}); } catch (e) {} return; }
      STBWL.l = l;
      try { l.addEventListener("release", function () { if (STBWL.l === l) STBWL.l = null; }); } catch (e) {}
    }, function () { STBWL.req = false; });
  } catch (e) { STBWL.req = false; }
}
document.addEventListener("visibilitychange", function () {
  if (document.hidden) { stbStop(); stbWake(false); var g = el("stbStage"); if (g) g.classList.add("hold"); return; }
  if (typeof App !== "undefined" && App.current === "stair" && STR.mode === "start") { var g2 = el("stbStage"); if (g2) g2.classList.remove("hold"); stbMount(); }
});
