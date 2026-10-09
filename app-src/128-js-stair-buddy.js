/* ═══ 계단 동행 · 챗봇이 내 앞에서 같이 계단을 간다 (사용자 261009 · 2차 「준비 운동은 거창 · 대각선 계단이 내려오고 챗봇은 점프 점프 · 다섯 번 오르면 뒤돌아 땀 쪼르륵 · 한마디 · 눈웃음」) ═══
   자리 = 출발 QR 뒤 진행 화면(라우트 stair · STR.mode "start") · 판정 · 서버 · 대기열은 그대로(114 stair_scan) · 이 조각은 화면 경험만
   무대(3차) = 정면 계단(내가 계단 아래에서 올려다봄 · 멀수록 좁아지는 디딤판) · 1층 둘러보기와 같은 3D 챗봇 · 챗봇은 화면 안 제자리 · 점프할 때마다 계단이 한 칸 내 쪽으로 흘러 내려온다
          밟은 칸 앞 띠는 주황 · 18F 출발 = 앞을 보고 내려오고 계단은 안쪽으로 흘러 올라감 · 말은 「계단」 중립 · 3D 를 받는 동안 · 못 그리면 같은 시점의 평면 그림
   한 고리(약 7~9초) = 뒷모습으로 콩콩 점프 5번(작은 숫자 하나 · 둘 · 셋 · 넷 · 다섯) → 앞으로 돌아섬 → 땀방울 쪼르륵 → 말풍선 한 번 + 눈웃음 → 다시 돌아서서 다음 고리
   말 = 홀수 고리 짧은 응원(12개 · 직전과 안 겹치게 섞음 · 첫마디 「힘내요!」) · 짝수 고리 행사 말(프로그램 → AX 상식 → 엘리베이터 감사(한 번) → 계단 → 상식 · 프로그램 · 상식 · 계단 …)
          같은 출발 안에서 행사 말은 다 쓰기 전까지 다시 나오지 않는다 · 3분 · 5분 이정표 한 번씩
   긴 체류 = 8분부터 절약(점프 · 흐름 · 돌기 그림 멈춤 · 말 간격 넓힘 · 응원 자리에 도착 안내) · 15분부터 쉼(말 멈춤 · 도착 안내 한 줄 고정 · 화면 켜 두기 놓음)
          20분부터 고정 줄 = 「30분이 지나면 도착 층을 직접 골라요」(서버 계단_정정분 30 · 그 뒤 도착 스캔은 보정 화면)
   화면 켜 두기 = Wake Lock(지원 기기만 · 실패는 조용히) · 떠나거나 가려지면 놓고 멈춘다 · 다시 보이면 이어서 · 다시 그려져도 그 자리부터(상태 = STB · 출발 leg since 마다 하나)
   동작 줄이기 = 정지 그림(앞모습 눈웃음) + 말풍선만 · 말 순서는 같다
   AX 상식 = 새로 지어내지 않는다 · 점프 AX 상식(JP_FACTS · 1층 판 근거)은 그 글 그대로 · AX 퀴즈 해설(OX_BANK)은 말투만 바꿈 · 출처 id 를 같이 적는다(검사 346)
   계단 말 = 숫자 · 의학 효과 없이 담백한 일반 문장만 · 캐릭터 = 3D 는 둘러보기 buildBot 그대로 · 평면 그림은 원본 BOT_SVG(path 그대로) · 둘 다 안테나 전파 + 눈웃음 + 땀방울(새 요소 하나) */
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
/* ── 무대 · 정면 계단(내가 계단 아래에서 위를 올려다본다 · 계단은 화면 안쪽 위로 뻗는다) · 3차(사용자 261009 「계단은 정면 · 챗봇 크게 · 1층 모형의 챗봇 형태와 디자인 스타일」)
   3D = 1층 둘러보기(assets/tour/tour3.js buildBot)와 같은 챗봇 모델 · 같은 재질 · 같은 빛(하늘빛 반구 + 비스듬한 해 · AgX) · 같은 배경 그러데이션 · 손잡이 = 1층 엘리베이터 로즈골드 봉 재질
   three.js = 둘러보기와 같은 파일 · 같은 주소(assets/tour/three.min.js?v=TOUR.ver)를 이 화면에서 처음 받는다(받은 뒤에는 둘러보기와 같이 씀) · 모형(lobby.glb)은 받지 않는다
   받는 동안 · 3D 를 못 그리는 기기 · 그리기가 느린 기기 = 같은 시점 계산으로 그린 평면 그림(정면 계단 + 원본 BOT_SVG) · 출발 직후 빈 화면 없음
   챗봇은 화면 안 제자리 · 점프할 때마다 계단이 한 칸 내 쪽(아래)으로 흘러 내려온다 · 18F 출발 = 앞을 보고 내려오고 계단은 안쪽(위)으로 흘러 올라간다
   배터리 = 움직일 때만 그린다(말하는 동안 · 절약 · 쉼 · 동작 줄이기 = 멈춘 한 장) · 해상도 1.5배까지 · 전파만 움직일 때는 초당 30장 */
var STB_V = { W: 300, H: 250, fov: 40, cy: 1.05, cz: 3.0, ty: 0.3, tz: -1.5, rise: 0.24, run: 0.62, sw: 1.7, bz: 0.08, bh: 0.964 };
function stbProj(x, y, z) {   /* 3D 카메라와 같은 계산(세로 시야각 fov · 위치 cy cz · 바라보는 곳 ty tz) → 무대 300 × 250 칸 */
  var v = STB_V, a = Math.atan2(v.ty - v.cy, v.cz - v.tz), dy = y - v.cy, dz = z - v.cz;
  var fw = -dz * Math.cos(a) + dy * Math.sin(a), up = dy * Math.cos(a) + dz * Math.sin(a), F = v.H / 2 / Math.tan(v.fov * Math.PI / 360);
  return [v.W / 2 + x * F / fw, v.H / 2 - up * F / fw];
}
function stbStairSvg(down) {   /* 평면 그림 · 먼 칸부터(앞 칸이 덮는다) · 칸 k 윗면 높이 k·rise · 앞 끝 z = -k·run + run/2 · 밟은 칸 앞 띠 = 주황 */
  var v = STB_V, h = v.sw / 2, out = "", k, y, zf, zb;
  function P(x, yy, z) { var p = stbProj(x, yy, z); return p[0].toFixed(1) + " " + p[1].toFixed(1); }
  for (k = 12; k >= -2; k--) {
    y = k * v.rise; zf = -k * v.run + v.run / 2; zb = zf - v.run;
    out += '<path class="tr" d="M' + P(-h, y, zb) + " L" + P(h, y, zb) + " L" + P(h, y, zf) + " L" + P(-h, y, zf) + 'Z"/>' +
      '<path class="rs" d="M' + P(-h, y, zf) + " L" + P(h, y, zf) + " L" + P(h, y - v.rise, zf) + " L" + P(-h, y - v.rise, zf) + 'Z"/>' +
      '<path class="ns' + ((down ? k >= 0 : k <= 0) ? " on" : "") + '" d="M' + P(-h * 0.94, y, zf - 0.05) + " L" + P(h * 0.94, y, zf - 0.05) + '"/>';
  }
  return '<svg class="stb-st" viewBox="0 0 ' + v.W + " " + v.H + '" preserveAspectRatio="none" aria-hidden="true">' + out + "</svg>";
}
/* 평면 그림 챗봇 자리 · 3D 챗봇 발밑(0, 0, bz) ~ 안테나 공 꼭대기(높이 bh)를 원본 BOT_SVG 의 18.65 ~ 156.2(200 칸)에 맞춘다 · 숫자 = 머리 위 */
function stbBotBox() {
  var v = STB_V, p0 = stbProj(0, 0, v.bz), p1 = stbProj(0, v.bh, v.bz), s = (p0[1] - p1[1]) * 200 / 137.55, pc = stbProj(0, v.bh + 0.42, v.bz);
  return { l: (p0[0] - s / 2) / v.W * 100, t: (p1[1] - s * 18.65 / 200) / v.H * 100, w: s / v.W * 100, ct: pc[1] / v.H * 100 };
}
/* 땀방울 · 원본에 없는 새 요소 하나(머리 오른쪽 위 · 돌아설 때만 흐른다) */
var STB_SWEAT = '<path class="sw" d="M152 52 C157 60 161 65 161 70 A9 9 0 0 1 143 70 C143 65 147 60 152 52Z"/>';
function stbBotHtml(b) {
  var x = stbBotBox();
  return '<span class="stb-bot' + (b.ph === "talk" || stbRm() || b.save || b.rest || stbDown() ? " face" : "") + '" id="stbBot" data-m="' + ((b.line && b.line.m) || "") + '" style="left:' + x.l.toFixed(2) + "%;top:" + x.t.toFixed(2) + "%;width:" + x.w.toFixed(2) + '%"><span class="stb-hop">' +
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
    '<div class="stb-stage' + (down ? " down" : "") + (stbRm() || b.save || b.rest ? " still" : "") + (STB3.st === 2 ? " is3d" : "") + '" id="stbStage">' +
      '<div class="stb-flip">' + stbStairSvg(down) + stbBotHtml(b) + "</div>" +
      '<span class="stb-cnt" id="stbCnt" aria-hidden="true" style="top:' + stbBotBox().ct.toFixed(2) + '%"></span></div>' +
    '<p class="axs-safe">' + STAIR_SAFE + "</p>" +
    '<p class="ax-meta stb-cap">도착 층 방화문 앞 QR 스캔 · ' + ((s.goal || 1) > 1 ? "누적 " + (s.total || 0) + " / " + s.goal + "개 층" : (s.total || 0) >= 1 ? "오늘 " + s.total + "개 층 이동" : "한 개 층만 이동해도 적립") + "</p>";
}
/* 무대 크기 · 아래 고정 단추 위에 다 보이게(키 작은 화면 · 큰 글씨) · 그린 직후 한 번(같은 일 안이라 화면이 튀지 않는다) · 폭 200px 아래로는 줄이지 않는다 */
function stbFit() {
  var g = el("stbStage"), go = el("stbGo"); if (!g || !go) return;
  g.style.maxWidth = "";
  var top = g.getBoundingClientRect().top + (window.scrollY || 0), avail = go.getBoundingClientRect().top - 12 - top;
  if (avail > 0 && avail * 6 / 5 < g.clientWidth) g.style.maxWidth = Math.max(200, Math.floor(avail * 6 / 5)) + "px";
}
/* ── 3D · 한 번 만들어 두고(STB3) 무대가 다시 그려지면 캔버스를 옮겨 붙인다(WebGL 문맥 하나) ── */
var STB3 = { st: 0, r: null, sc: null, cam: null, flow: null, bot: null, body: null, eyes: [], smiles: [], waves: [], sweat: null, shadow: null, nose: [], mOn: null, mOff: null,
  raf: 0, hop: null, turn: null, sw: null, face: false, mood: "", dir: 1, n: 0, last: 0, gaps: [] };
function stb3Load() {   /* st 0 처음 · 1 받는 중 · 2 준비 · -1 못 그림 · -2 느려서 평면 그림 */
  if (STB3.st) return;
  STB3.st = 1;
  if (window.THREE) { setTimeout(stb3Init, 0); return; }
  var n = document.createElement("script");
  n.src = "assets/tour/three.min.js?v=" + (typeof TOUR !== "undefined" ? TOUR.ver : "1"); n.async = true;   /* 둘러보기와 같은 주소 = 브라우저 저장본을 같이 쓴다 */
  n.onload = stb3Init; n.onerror = function () { STB3.st = -1; };
  document.head.appendChild(n);
}
function stb3Init() {
  var T = window.THREE, v = STB_V, i;
  if (!T || STB3.st !== 1) { if (STB3.st === 1) STB3.st = -1; return; }
  try {
    var cv = document.createElement("canvas"); cv.className = "stb-cv"; cv.setAttribute("aria-hidden", "true");
    var r = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "low-power" });
    if (!r.getContext()) throw new Error("gl");
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); r.toneMapping = T.AgXToneMapping; r.toneMappingExposure = 1.0;
    var sc = new T.Scene(), bc = document.createElement("canvas"); bc.width = 4; bc.height = 256;
    var bg = bc.getContext("2d"), gr = bg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#FAFBFC"); gr.addColorStop(0.55, "#EEF0F2"); gr.addColorStop(1, "#DADDE1"); bg.fillStyle = gr; bg.fillRect(0, 0, 4, 256);   /* 둘러보기 배경 그대로 */
    sc.background = new T.CanvasTexture(bc); sc.background.colorSpace = T.SRGBColorSpace;
    sc.add(new T.HemisphereLight(0xFFFFFF, 0xC9CED4, 2.0));
    var dl = new T.DirectionalLight(0xFFFFFF, 1.3); dl.position.set(-8, 20, 12); sc.add(dl);
    var cam = new T.PerspectiveCamera(v.fov, v.W / v.H, 0.1, 60); cam.position.set(0, v.cy, v.cz); cam.lookAt(0, v.ty, v.tz);
    function lam(c) { return new T.MeshLambertMaterial({ color: c }); }
    /* 계단 · 칸마다 상자(윗면 = 디딤판 · 앞면 = 챌판 · 빛이 면을 나눈다) · 앞 끝 미끄럼 방지 띠(밟은 칸 = 주황 · 앞 칸 = 회색) · 양옆 벽 · 손잡이 */
    var flow = new T.Group(); sc.add(flow);
    var mStep = lam(0xF0F1F3), mOn = lam(0xFF7F32), mOff = lam(0xB9BDC2), nose = [];
    for (i = -4; i <= 20; i++) {
      var y = i * v.rise, zf = -i * v.run + v.run / 2, hh = y + 3;
      var st = new T.Mesh(new T.BoxGeometry(v.sw, hh, v.run), mStep); st.position.set(0, y - hh / 2, zf - v.run / 2); flow.add(st);
      var ns = new T.Mesh(new T.BoxGeometry(v.sw * 0.94, 0.02, 0.07), mOff); ns.position.set(0, y + 0.006, zf - 0.06); ns.userData.k = i; flow.add(ns); nose.push(ns);
    }
    var rose = new T.MeshPhongMaterial({ color: 0xC0866A, specular: 0x8A5A44, shininess: 60 }), L = Math.hypot(v.rise, v.run);   /* 1층 엘리베이터 손잡이와 같은 로즈골드 */
    [-1, 1].forEach(function (sd) {
      var w = new T.Mesh(new T.PlaneGeometry(40, 24), new T.MeshLambertMaterial({ color: 0xF2F3F5, side: T.DoubleSide })); w.rotation.y = Math.PI / 2; w.position.set(sd * (v.sw / 2 + 0.01), 4, -10); sc.add(w);
      var rl = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 40, 12), rose); rl.rotation.x = Math.atan2(-v.run, v.rise);
      rl.position.set(sd * (v.sw / 2 - 0.09), v.rise * (v.run / 2 + 8) / v.run + 0.9, -8); flow.add(rl);
    });
    /* 챗봇 · tour3.js buildBot 과 같은 모양 · 같은 숫자 · 같은 재질(머리 돔 노랑 · 아래 띠 · 바닥 · 안테나 공 주황 · 발 · 눈 먹색 · 웃는 눈 반달 고리 · 안테나 전파) */
    var mOr = lam(0xFF7F32), mYe = new T.MeshLambertMaterial({ color: 0xFFC56E, side: T.DoubleSide }), mInk = new T.MeshBasicMaterial({ color: 0x282320 }), mFoot = lam(0xE5671E);
    var bot = new T.Group(), body = new T.Group(); bot.add(body);
    var pts = [new T.Vector2(0.335, 0.24)];
    for (i = 0; i <= 14; i++) { var a = i / 14 * Math.PI / 2; pts.push(new T.Vector2(Math.max(0.0001, Math.cos(a) * 0.335), 0.43 + Math.sin(a) * 0.36)); }
    body.add(new T.Mesh(new T.LatheGeometry(pts, 32), mYe));
    var band = new T.Mesh(new T.CylinderGeometry(0.355, 0.33, 0.2, 32), mOr); band.position.y = 0.14; body.add(band);
    var b0 = new T.Mesh(new T.SphereGeometry(0.33, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mOr); b0.scale.y = 0.25; b0.position.y = 0.04; body.add(b0);
    var stm = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.13, 8), mYe); stm.position.y = 0.85; body.add(stm);
    var ball = new T.Mesh(new T.SphereGeometry(0.075, 16, 12), mOr); ball.position.y = 0.94; body.add(ball);
    var smG = new T.TorusGeometry(0.038, 0.012, 6, 14, Math.PI), eyes = [], smiles = [];
    [-1, 1].forEach(function (s) {
      var e = new T.Mesh(new T.SphereGeometry(0.046, 12, 10), mInk); e.scale.set(1, 1.15, 0.45); e.position.set(s * 0.12, 0.55, 0.305); body.add(e); eyes.push(e);
      var sm = new T.Mesh(smG, mInk); sm.position.set(s * 0.12, 0.535, 0.31); sm.rotation.x = -0.12; sm.visible = false; body.add(sm); smiles.push(sm);
      var f = new T.Mesh(new T.SphereGeometry(0.085, 12, 8), mFoot); f.scale.set(1, 0.6, 1.35); f.position.set(s * 0.15, 0.035, 0.04); bot.add(f);
    });
    var ac = document.createElement("canvas"); ac.width = ac.height = 128; var ag = ac.getContext("2d");   /* 안테나 전파 = 둘러보기 arcTex 그대로 */
    ag.strokeStyle = "#FF7F32"; ag.lineWidth = 13; ag.lineCap = "round"; ag.beginPath(); ag.arc(64, 84, 48, Math.PI * 1.22, Math.PI * 1.78); ag.stroke();
    var at = new T.CanvasTexture(ac); at.colorSpace = T.SRGBColorSpace;
    var waves = [0, 1, 2].map(function () { var sp = new T.Sprite(new T.SpriteMaterial({ map: at, transparent: true, depthWrite: false, opacity: 0 })); sp.position.y = 1.0; sp.scale.set(0.3, 0.3, 1); body.add(sp); return sp; });
    var sw = new T.Group(), mSw = new T.MeshPhongMaterial({ color: 0xFFFFFF, emissive: 0x5A5C5E, specular: 0xFFFFFF, shininess: 90, transparent: true, opacity: 0 });   /* 땀방울(새 요소 하나) · 흰 물방울 + 반짝임 · 파랑 없음 */
    var sw1 = new T.Mesh(new T.SphereGeometry(0.062, 16, 12), mSw), sw2 = new T.Mesh(new T.ConeGeometry(0.046, 0.09, 16), mSw); sw2.position.y = 0.066; sw.add(sw1); sw.add(sw2); sw.visible = false; body.add(sw);
    var shc = document.createElement("canvas"); shc.width = shc.height = 64; var sg = shc.getContext("2d"), rg = sg.createRadialGradient(32, 32, 2, 32, 32, 32);
    rg.addColorStop(0, "rgba(25,31,40,0.32)"); rg.addColorStop(1, "rgba(25,31,40,0)"); sg.fillStyle = rg; sg.fillRect(0, 0, 64, 64);   /* 둘러보기 발밑 그림자 그대로 */
    var shadow = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shc), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, 0.012, v.bz); shadow.renderOrder = 3; sc.add(shadow);
    bot.scale.setScalar(0.95); bot.position.set(0, 0, v.bz); sc.add(bot);
    cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stb3Off(-1); });
    Object.assign(STB3, { r: r, sc: sc, cam: cam, flow: flow, bot: bot, body: body, eyes: eyes, smiles: smiles, waves: waves, sweat: sw, swM: mSw, shadow: shadow, nose: nose, mOn: mOn, mOff: mOff });
  } catch (e) { STB3.st = -1; return; }
  STB3.st = 2;
  if (typeof App !== "undefined" && App.current === "stair" && STR.mode === "start") stb3Attach();
}
/* 3D 를 내려놓고 평면 그림으로(문맥 잃음 · 느린 기기) */
function stb3Off(code) {
  STB3.st = code; if (STB3.raf) { cancelAnimationFrame(STB3.raf); STB3.raf = 0; }
  var g = el("stbStage"); if (g) g.classList.remove("is3d");
  var cv = STB3.r && STB3.r.domElement; if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
  try { if (STB3.r) { STB3.r.dispose(); if (code === -2) STB3.r.forceContextLoss(); } } catch (e) {}
}
function stb3Attach() {
  var g = el("stbStage"); if (!g || STB3.st !== 2) return;
  var cv = STB3.r.domElement; if (cv.parentNode !== g) g.insertBefore(cv, g.firstChild);
  var w = g.clientWidth, h = g.clientHeight; if (w && h) STB3.r.setSize(w, h, false);
  g.classList.add("is3d");
  stb3Sync();
}
/* 지금 상태에 맞춘 자세(움직임 없이) · 다시 그려졌을 때 · 절약 · 쉼 · 동작 줄이기 */
function stb3Sync() {
  var b = STB; if (STB3.st !== 2 || !b) return;
  var down = stbDown(), still = stbRm() || b.save || b.rest;
  STB3.dir = down ? -1 : 1; STB3.hop = null; STB3.turn = null; STB3.sw = null;
  STB3.face = still || down || b.ph === "talk"; STB3.mood = STB3.face ? (b.line && b.line.m) || "" : "";
  STB3.nose.forEach(function (n) { n.material = (down ? n.userData.k >= 0 : n.userData.k <= 0) ? STB3.mOn : STB3.mOff; });
  stb3Kick();
}
function stb3Still() { return !STB || stbRm() || STB.save || STB.rest; }
function stb3Hop() { if (STB3.st !== 2 || stb3Still()) return; STB3.hop = { t0: performance.now() }; stb3Kick(); }
function stb3Face(on, sweat) {
  if (STB3.st !== 2) return;
  if (stb3Still() || STB3.dir < 0) on = true;   /* 내려가기 = 늘 앞모습 */
  if (STB3.face !== on && !stb3Still()) STB3.turn = { t0: performance.now(), to: on };
  STB3.face = on; if (!on) STB3.mood = "";
  if (sweat && !stb3Still()) STB3.sw = { t0: performance.now() };
  stb3Kick();
}
function stb3Mood(m) { if (STB3.st !== 2) return; STB3.mood = m || ""; stb3Kick(); }
function stb3Halt() { if (STB3.raf) { cancelAnimationFrame(STB3.raf); STB3.raf = 0; } STB3.last = 0; }
function stb3Kick() { if (STB3.st === 2 && !STB3.raf && !document.hidden) STB3.raf = requestAnimationFrame(stb3Frame); }
function stbEaseIO(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
function stbKey(k, ks) { for (var i = 1; i < ks.length; i++) if (k <= ks[i][0]) { var a = ks[i - 1], c = ks[i], u = (k - a[0]) / (c[0] - a[0]); return a[1] + (c[1] - a[1]) * u; } return ks[ks.length - 1][1]; }
/* 그 시각의 자세 · 움직이는 중 = 1 · 전파만 = 2 · 멈춤 = 0 */
function stb3Pose(now) {
  var v = STB_V, busy = 0, k, off = 0, lift = 0, sy = 1, fa = STB3.face ? 1 : 0, hp = STB3.hop, tn = STB3.turn, sw = STB3.sw;
  if (hp) {   /* 점프 0.5초 · 웅크림 → 솟음(늘어남) → 착지(눌림) · 그동안 계단이 한 칸 흐른다 */
    k = (now - hp.t0) / 500;
    if (k >= 1) STB3.hop = null;
    else { busy = 1; off = stbEaseIO(Math.min(1, Math.max(0, (k - 0.15) / 0.7))); lift = Math.sin(Math.PI * Math.min(1, Math.max(0, (k - 0.12) / 0.76))) * 0.3; sy = stbKey(k, [[0, 1], [0.18, 0.9], [0.55, 1.05], [0.85, 0.94], [1, 1]]); }
  }
  STB3.flow.position.set(0, -off * v.rise * STB3.dir, off * v.run * STB3.dir);
  STB3.bot.position.y = lift; STB3.body.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
  var ss = 1 - Math.min(0.5, lift * 1.4); STB3.shadow.scale.set(ss, ss, 1);
  if (tn) { k = (now - tn.t0) / 360; if (k >= 1) STB3.turn = null; else { busy = 1; fa = tn.to ? stbEaseIO(k) : 1 - stbEaseIO(k); } }   /* 돌아서기 0.36초 · 둘러보기 엘리베이터 돌아보기와 같은 축 */
  STB3.bot.rotation.y = Math.PI * (1 - fa);
  var smile = fa > 0.8 && STB3.mood === "smile";
  STB3.eyes.forEach(function (o) { o.visible = !smile; }); STB3.smiles.forEach(function (o) { o.visible = smile; });
  var wv = fa > 0.8 && STB3.mood === "wave" && !stb3Still(), tt = (now / 1000) % 1.6;
  STB3.waves.forEach(function (sp, i) { var q = (tt * 0.9 - i * 0.16) / 0.62, o = wv && q >= 0 && q <= 1; sp.material.opacity = o ? 1 - q : 0; var s = 0.24 + (o ? q : 0) * 0.6; sp.scale.set(s, s, 1); sp.position.y = 1.0 + (o ? q : 0) * 0.12; });
  if (wv && !busy) busy = 2;
  STB3.sweat.visible = false;
  if (sw) {   /* 돌아선 뒤 0.2초 · 머리 오른쪽 위에서 돔을 따라 1.3초 쪼르륵 */
    k = (now - sw.t0 - 200) / 1300;
    if (k >= 1) STB3.sw = null;
    else { busy = 1; if (k > 0) { var ang = (52 - 40 * k) * Math.PI / 180, R = Math.cos(ang) * 0.335 + 0.045, az = 0.7; STB3.sweat.visible = true; STB3.sweat.position.set(Math.sin(az) * R, 0.43 + Math.sin(ang) * 0.36, Math.cos(az) * R); STB3.swM.opacity = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1; } }
  }
  return busy;
}
function stb3Frame(now) {
  STB3.raf = 0;
  var cv = STB3.r && STB3.r.domElement; if (STB3.st !== 2 || !cv || !cv.isConnected) { STB3.last = 0; return; }
  var busy = stb3Pose(now);
  if (busy !== 2 || !(STB3.n++ & 1)) STB3.r.render(STB3.sc, STB3.cam);   /* 전파만 = 한 장 건너 한 장 */
  if (busy === 1 && STB3.last) {   /* 느린 기기 = 움직이는 동안 장 사이 간격 40장 평균 55ms 넘으면 평면 그림으로 */
    STB3.gaps.push(now - STB3.last); if (STB3.gaps.length > 40) STB3.gaps.shift();
    if (STB3.gaps.length === 40 && STB3.gaps.reduce(function (s, x) { return s + x; }, 0) / 40 > 55) { stb3Off(-2); return; }
  }
  STB3.last = busy === 1 ? now : 0;
  if (busy) STB3.raf = requestAnimationFrame(stb3Frame);
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
  stb3Mood(ln.m);
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
  var bot = el("stbBot"); if (bot) bot.classList.toggle("face", b.save || stbRm() || stbDown());   /* 오를 때 = 뒷모습 · 정지 그림 · 내려가기 = 앞모습 */
  if (b.save || stbRm()) { stb3Sync(); stbNext(stbFace, b.save ? 6000 : 3000); return; }
  stbNext(stbHop, 120);
}
function stbHop() {
  var b = STB; if (!b) return;
  b.hop++;
  var bot = el("stbBot"), cn = el("stbCnt"), ab = b.hop % 2 ? "a" : "b";
  if (bot) { delete bot.dataset.t; bot.dataset.h = ab; }   /* 점프와 돌기는 같은 칸(.stb-hop)을 움직인다 · 하나만 */
  if (cn) { cn.textContent = STB_COUNT[b.hop - 1] || ""; cn.dataset.h = ab; }
  stb3Hop();
  if (b.hop < STB_HOPS) stbNext(stbHop, STB_HOP_MS); else stbNext(stbFace, STB_HOP_MS + 150);
}
/* 앞으로 돌아섬 → 땀 쪼르륵 → 한마디 + 눈웃음 → 다 말하면 기다렸다 다시 돌아섬 */
function stbFace() {
  var b = STB; if (!b) return;
  b.ph = "talk";
  var bot = el("stbBot"), still = b.save || stbRm();
  stb3Face(true, !still); stb3Mood("");
  if (bot && !still && !stbDown()) { delete bot.dataset.h; bot.dataset.t = bot.dataset.t === "a" ? "b" : "a"; setTimeout(function () { var e = el("stbBot"); if (e && STB === b && b.ph === "talk") e.classList.add("face"); }, STB_TURN_MS / 2); }
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
  if (bot && !b.save && !stbRm() && !stbDown()) { stb3Face(false); bot.dataset.t = bot.dataset.t === "a" ? "b" : "a"; setTimeout(function () { var e = el("stbBot"); if (e && STB === b) e.classList.remove("face"); }, STB_TURN_MS / 2); stbNext(stbLoop, STB_TURN_MS + 80); return; }
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
  stb3Sync();
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
  stbFit(); stb3Load(); stb3Attach();   /* 3D 는 처음 한 번 받고 · 다시 그려지면 캔버스만 옮겨 붙인다 */
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
function stbLeave() { stbStop(); stbWake(false); stb3Halt(); }
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
  if (document.hidden) { stbStop(); stbWake(false); stb3Halt(); var g = el("stbStage"); if (g) g.classList.add("hold"); return; }
  if (typeof App !== "undefined" && App.current === "stair" && STR.mode === "start") { var g2 = el("stbStage"); if (g2) g2.classList.remove("hold"); stbMount(); }
});
