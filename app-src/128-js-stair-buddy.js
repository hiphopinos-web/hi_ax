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
var STB_THANKS = "엘리베이터가 붐벼 불편하시죠?\n계단에 함께해 주셔서 감사해요";   /* 사용자 문장 · 말풍선 두 줄에 맞춤(4차 글자 22px · 「오늘」 덜어 한 줄에) · 한 출발에 한 번 */
var STB_PROG_Q = "오늘 프로그램 참여해 보셨어요?";   /* 5차 · 프로그램 말의 머리(꼬리표 줄) · 내용 = 제안 한 줄 */
/* 5차(사용자 261009 「AX 상식 / 내용 두 줄로 배치」) 행사 말 = 머리(작은 주황 꼬리표 한 줄) + 내용(큰 글씨 2줄 안) · 응원 · 엘리베이터 감사 · 첫 인사 = 머리 없이 */
var STB_HEAD = { fact: "AX 상식", good: "계단 이야기", mile: "함께 걷는 중", arrive: "도착 안내", congr: "스탬프" };
var STB_MILE = [[3, "벌써 3분째예요"], [5, "5분째예요\n도착하면 QR을 꼭 찍어요"]];
var STB_ARRIVE = "아래 버튼으로 QR을 찍어요";
function stbFixLine() { var fl = Number((STR.res || {}).fl); return (fl ? fl + "F " : "") + "출발 30분이 지나면\n도착 층을 직접 골라요"; }   /* 출발 층은 이 안내 안에서만 */
/* [출처 id, 말] · 말이 비면 JP_FACTS 의 그 글 그대로 */
var STB_FACTS = [
  ["jp01"], ["A02", "AI가 자신 있게 말해도 틀릴 수 있어요. 따로 확인해요"], ["jp07"], ["A05", "읽을 사람을 알려 주면 AI가 맞춤 답을 줘요"],
  ["jp02"], ["A28", "AI가 없는 출처를 지어낼 때도 있어요"], ["jp08"], ["A26", "역할을 정해 주면 AI 답의 관점이 맞춰져요"],
  ["jp03"], ["jp05"], ["jp06"], ["A29", "AI 요약은 중요한 내용을 빼먹을 수 있어요"], ["jp09"], ["A30", "「이 자료만 보고 답해 줘」처럼 범위를 정해 줘요"],
  ["jp15"], ["jp16"], ["F02", "AX는 AI Transformation의 약자예요"], ["jp17"], ["F50", "결과물은 A4 1장처럼 형태를 구체적으로 알려 줘요"],
  ["jp19"], ["F22", "지금의 DAP는 나만의 Agent의 첫걸음이에요"], ["jp22"], ["jp29"],
  ["jp11"], ["jp20"], ["jp27"], ["jp13"], ["jp28"], ["jp21"], ["jp30"], ["jp10"]   /* 5차 · 상식 비중을 올려 8개 더(점프 AX 상식 그 글 그대로) */
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
  if (!has("p4")) out.push(["p4", "미니 게임 " + Math.max(1, MG_NEED - mgDone()) + "종목도 있어요"]);   /* 4차 · 한 줄에 */
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
    cute: [STB_CUTE[0]].concat(cute), ci: 0, ev: 0, alog: [], fi: Math.floor(Math.random() * STB_FACTS.length), fn: 0, gi: 0, used: {}, thx: false, congr: false, mile: {}, save: false, rest: false, log: [] };
  if (stbRm()) { STB.n = STB.line.t.length; STB.done = true; }
  return STB;
}
/* 짝수 고리의 행사 말 · j = 짝수 고리 차례(0부터) · 5차 상식 2 : 그 밖 1 = 프로그램 → 상식 · 상식 → 감사 → 상식 · 상식 → 계단 → (상식 · 상식 · 프로그램 · 상식 · 상식 · 계단) 되풀이 */
var STB_EV0 = ["p", "f", "f", "t", "f", "f", "b"], STB_EV = ["f", "f", "p", "f", "f", "b"];
function stbEventLine(b, j) {
  var cat = j < STB_EV0.length ? STB_EV0[j] : STB_EV[(j - STB_EV0.length) % STB_EV.length];
  if (cat === "t") { if (!b.thx) { b.thx = true; return { t: STB_THANKS, m: "smile", k: "thanks" }; } cat = "f"; }
  if (cat === "p") {
    if (stampCount() >= STAMP_DENOM) { if (!b.congr) { b.congr = true; return { t: stbCongr(), tag: STB_HEAD.congr, m: "smile", k: "congr" }; } cat = "f"; }
    else {
      var sg = stbSugs().filter(function (x) { return !b.used[x[0]]; })[0];
      if (sg) { b.used[sg[0]] = 1; return { t: sg[1], tag: STB_PROG_Q, m: "smile", k: "prog:" + sg[0] }; }
      cat = "f";
    }
  }
  if (cat === "b" && b.gi < STB_GOOD.length) return { t: STB_GOOD[b.gi++], tag: STB_HEAD.good, m: "smile", k: "good" };
  var fs = "", i;
  for (i = 0; i < STB_FACTS.length && !fs; i++) fs = stbFactText(STB_FACTS[(b.fi + b.fn++) % STB_FACTS.length]);
  return { t: fs || STB_CUTE[0], tag: fs ? STB_HEAD.fact : "", m: fs ? "wave" : "smile", k: "fact" };
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
  for (i = 0; i < STB_MILE.length && !ln && !b.save; i++) if (age >= STB_MILE[i][0] * 60000 && !b.mile[STB_MILE[i][0]]) { b.mile[STB_MILE[i][0]] = 1; ln = { t: STB_MILE[i][1], tag: STB_HEAD.mile, m: "smile", k: "mile" }; }   /* 한 번에 하나 · 절약 중에는 도착 안내가 대신 */
  if (!ln) ln = b.loop % 2 ? (b.save ? { t: STB_ARRIVE, tag: STB_HEAD.arrive, m: "smile", k: "arrive" } : stbCuteLine(b)) : stbEventLine(b, b.ev++);
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
  return '<h1 class="stb-sr">계단 동행 · ' + esc(o.fl) + "F 출발 · 도착 층 방화문 앞 QR 스캔</h1>" +   /* 5차(사용자 「상단 정보는 크게 필요 없다」) 층 · 경로 · 시작 시각 줄 걷음 · 화면 읽기용 제목 하나만 */
    '<button type="button" class="stb-bub" id="stbBub" aria-label="다음 말 보기" onclick="stbSkip()">' +   /* 말풍선 = 단추(누르면 다 보이기 · 다음으로) · 읽어 주기는 아래 stbSr 한 줄 */
      '<span class="stb-tx" aria-hidden="true">' + (ln.tag ? '<span class="stb-tag" id="stbTag">' + ln.tag + "</span>" : '<span class="stb-tag" id="stbTag" hidden></span>') +
      '<span id="stbTx">' + esc(ln.t.slice(0, b.n)) + '</span></span><i class="stb-more' + (b.done ? " on" : "") + '" id="stbMore"></i></button>' +
    '<p class="stb-sr" id="stbSr" aria-live="polite">' + esc((ln.tag ? ln.tag + " · " : "") + ln.t) + "</p>" +
    '<div class="stb-stage' + (down ? " down" : "") + (stbRm() || b.save || b.rest ? " still" : "") + (STB3.st === 2 ? " is3d" : "") + '" id="stbStage">' +
      '<div class="stb-flip">' + stbStairSvg(down) + stbBotHtml(b) + "</div>" +
      '<span class="stb-cnt" id="stbCnt" aria-hidden="true" style="top:' + stbBotBox().ct.toFixed(2) + '%"></span></div>' +
    '<p class="stb-safe">' + STAIR_SAFE + ((s.goal || 1) > 1 ? " · 누적 " + (s.total || 0) + " / " + s.goal + "개 층" : "") + "</p>";   /* 5차 · 안전 한 줄만 작게(누적은 목표가 2개 층 이상일 때만) */
}
/* 무대 크기 · 아래 고정 단추 위에 다 보이게(키 작은 화면 · 큰 글씨) · 그린 직후 한 번(같은 일 안이라 화면이 튀지 않는다) · 폭 200px 아래로는 줄이지 않는다 */
function stbCongr() { return STAMP_DENOM + "개를 다 모았어요\n축하해요!"; }
/* 이 출발에 나올 수 있는 말 전부(말풍선 높이 미리 재기) */
function stbPool() {
  var L = [["", STB_HELLO], ["", STB_THANKS], [STB_HEAD.arrive, STB_ARRIVE], [STB_HEAD.arrive, stbFixLine()], [STB_HEAD.congr, stbCongr()]];
  STB_CUTE.forEach(function (t) { L.push(["", t]); });
  STB_GOOD.forEach(function (t) { L.push([STB_HEAD.good, t]); });
  stbSugs().forEach(function (x) { L.push([STB_PROG_Q, x[1]]); });
  STB_MILE.forEach(function (m) { L.push([STB_HEAD.mile, m[1]]); });
  STB_FACTS.forEach(function (f) { var t = stbFactText(f); if (t) L.push([STB_HEAD.fact, t]); });
  return L;
}
/* 4 · 5차(사용자 261009 「글자 폰트를 더 크게」 · 「더 올릴 수 있을 것 같다」) · 말풍선 내용 글자 = 26px(옛 17px · 1.5배 · 굵기 700)부터 · 나올 말 전부의 내용이 2줄에 들면 그 크기
   좁은 폭이면 25 · 24 · 23 · 22px 로 한 단계씩(가장 긴 말도 2줄 · 안 되면 줄 수가 가장 적은 큰 크기) · 말풍선 높이 = 머리 줄 + 가장 긴 내용 줄 수로 미리 잡는다(말이 바뀌어도 무대 · 단추가 밀리지 않게)
   줄 수 = 내용 글(#stbTx)의 줄 상자 수 · 폭이 같으면 다시 재지 않는다 · 글자 크기는 px(큰 글씨 설정에서도 같다) */
function stbLines(e) { var r = e.getClientRects(), seen = {}, n = 0, i, k; for (i = 0; i < r.length; i++) { if (r[i].width < 1) continue; k = Math.round(r[i].top); if (!seen[k]) { seen[k] = 1; n++; } } return n; }   /* 줄 수 = 글자가 있는 줄 상자의 높이 자리 수 */
var STB_FITK = { k: "", fs: 26, n: 2 };
var STB_FS = [26, 25, 24, 23, 22];
function stbBubFit() {
  var box = document.querySelector(".stb-tx"), tx = el("stbTx"), tg = el("stbTag"); if (!box || !tx || !tg) return;
  var k = box.clientWidth + "/" + stbSugs().length;
  if (STB_FITK.k !== k) {
    var keep = [tx.textContent, tg.textContent, tg.hidden], pool = stbPool(), best = null;
    box.style.minHeight = "0px";
    STB_FS.forEach(function (fs) {
      if (best && best.n <= 2) return;
      var lh = Math.round(fs * 1.41), mx = 1;
      box.style.fontSize = fs + "px"; box.style.lineHeight = lh + "px";
      pool.forEach(function (x) { tg.hidden = !x[0]; tg.textContent = x[0]; tx.textContent = x[1]; mx = Math.max(mx, stbLines(tx)); });
      if (!best || mx < best.n) best = { fs: fs, n: mx };
    });
    tg.hidden = false; tg.textContent = STB_HEAD.fact; var th = tg.getBoundingClientRect().height + 6;   /* 머리 줄 높이(아래 6px 띄움) */
    tx.textContent = keep[0]; tg.textContent = keep[1]; tg.hidden = keep[2];
    STB_FITK = { k: k, fs: best.fs, n: Math.max(2, best.n), th: th };
  }
  var l2 = Math.round(STB_FITK.fs * 1.41);
  box.style.fontSize = STB_FITK.fs + "px"; box.style.lineHeight = l2 + "px"; box.style.minHeight = Math.round(STB_FITK.th + STB_FITK.n * l2) + "px";
}
function stbFit() {
  var g = el("stbStage"), go = el("stbGo"); if (!g || !go) return;
  stbBubFit();
  var bub = el("stbBub"); if (bub) bub.style.marginTop = "";
  g.style.maxWidth = "";
  var top = g.getBoundingClientRect().top + (window.scrollY || 0), avail = go.getBoundingClientRect().top - 12 - top;
  if (avail > 0 && avail * 6 / 5 < g.clientWidth) g.style.maxWidth = Math.max(200, Math.floor(avail * 6 / 5)) + "px";
  var spare = avail - g.getBoundingClientRect().height;   /* 5차 · 남는 자리 절반을 말풍선 위에 · 말풍선과 무대가 화면 가운데로 */
  if (bub && spare > 16) bub.style.marginTop = Math.min(96, Math.floor(spare / 2)) + "px";
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
function stb3Attach(g0) {
  var g = g0 || el("stbStage"); if (!g || STB3.st !== 2) return;
  var v = STB_V, cv = STB3.r.domElement; if (cv.parentNode !== g) g.insertBefore(cv, g.firstChild);
  var w = g.clientWidth, h = g.clientHeight; if (w && h) STB3.r.setSize(w, h, false);
  STB3.cam.position.set(0, v.cy, v.cz); STB3.cam.lookAt(0, v.ty, v.tz);   /* 도착 장면이 당겨 둔 카메라를 제자리로 */
  if (g0) return;
  g.classList.add("is3d");
  stb3Sync();
}
/* 지금 상태에 맞춘 자세(움직임 없이) · 다시 그려졌을 때 · 절약 · 쉼 · 동작 줄이기 */
function stb3Sync() {
  var b = STB; if (STB3.st !== 2 || !b) return;
  var down = stbDown(), still = stbRm() || b.save || b.rest;
  STB3.dir = down ? -1 : 1; STB3.hop = null; STB3.turn = null; STB3.sw = null; STB3.act = null; STB3.wink = false;
  STB3.face = still || down || b.ph === "talk"; STB3.mood = STB3.face ? (b.line && b.line.m) || "" : "";
  STB3.nose.forEach(function (n) { n.material = (down ? n.userData.k >= 0 : n.userData.k <= 0) ? STB3.mOn : STB3.mOff; });
  stb3Kick();
}
function stb3Still() { return !STB || stbRm() || STB.save || STB.rest; }
/* o = { big: 크게 폴짝(한 칸 그대로 · 높이만) · sway: 몸 기울기 방향(리듬 타기) } */
function stb3Hop(o) { if (STB3.st !== 2 || stb3Still()) return; o = o || {}; STB3.hop = { t0: performance.now(), big: !!o.big, sway: o.sway || 0 }; stb3Kick(); }
function stb3Face(on, sweat, spin) {
  if (STB3.st !== 2) return;
  if (stb3Still() || STB3.dir < 0) on = true;   /* 내려가기 = 늘 앞모습 */
  if (STB3.face !== on && !stb3Still()) STB3.turn = { t0: performance.now(), to: on, spin: !!spin && on, d: spin && on ? 640 : 360 };
  STB3.face = on; if (!on) STB3.mood = "";
  if (sweat && !stb3Still()) STB3.sw = { t0: performance.now() };
  stb3Kick();
}
/* 동작 · nod 끄덕(아하) · bounce 신나서 통통 · stretch 기지개 · lean 기울여 가리키기 · bow 꾸벅 · wiggle 몸 흔들어 인사 · look 두리번 · breath 숨 고르기 · wipe 땀 닦기 · cheer 도착 축하(폴짝 + 한 바퀴)
   계단에서 따라 하면 위험한 것(뛰기 · 두 칸 · 넘어짐 · 미끄러짐)은 없다 · 폴짝도 한 칸 그대로 */
var STB_ACT_MS = { nod: 900, bounce: 1000, stretch: 1100, lean: 1100, bow: 1000, wiggle: 1100, look: 900, breath: 700, wipe: 900, cheer: 1100 };
var STB_ACT_OF = { fact: "nod", cute: "bounce", good: "stretch", prog: "lean", thanks: "bow", mile: "wiggle", arrive: "wiggle", congr: "wiggle" };   /* 상식 = 아하 끄덕(+ 안테나 전파) · 응원 = 통통 · 계단 이야기 = 기지개 · 프로그램 = 기울여 가리키기 · 감사 = 꾸벅 · 그 밖 = 몸 흔들어 인사 */
function stb3Act(n, ms) { if (STB3.st !== 2 || (stb3Still() && n !== "cheer")) return; STB3.act = { n: n, t0: performance.now(), d: ms || STB_ACT_MS[n] || 900 }; stb3Kick(); }
function stb3Mood(m) { if (STB3.st !== 2) return; STB3.mood = m || ""; stb3Kick(); }
function stb3Halt() { if (STB3.raf) { cancelAnimationFrame(STB3.raf); STB3.raf = 0; } STB3.last = 0; }
function stb3Kick() { if (STB3.st === 2 && !STB3.raf && !document.hidden && !SA.d) STB3.raf = requestAnimationFrame(stb3Frame); }
function stbEaseIO(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
function stbKey(k, ks) { for (var i = 1; i < ks.length; i++) if (k <= ks[i][0]) { var a = ks[i - 1], c = ks[i], u = (k - a[0]) / (c[0] - a[0]); return a[1] + (c[1] - a[1]) * u; } return ks[ks.length - 1][1]; }
/* 그 시각의 자세 · 움직이는 중 = 1 · 전파만 = 2 · 멈춤 = 0 */
function stb3Pose(now) {
  var v = STB_V, busy = 0, k, off = 0, lift = 0, sy = 1, rz = 0, rx = 0, ry = 0, px = 0, fa = STB3.face ? 1 : 0, hp = STB3.hop, tn = STB3.turn, sw = STB3.sw, a = STB3.act, spin = 0;
  if (hp) {   /* 점프 0.5초 · 웅크림 → 솟음(늘어남) → 착지(눌림) · 그동안 계단이 한 칸 흐른다 · 폴짝 = 더 높이(한 칸 그대로) · 리듬 = 몸을 좌우로 */
    k = (now - hp.t0) / 500;
    if (k >= 1) STB3.hop = null;
    else { busy = 1; off = stbEaseIO(Math.min(1, Math.max(0, (k - 0.15) / 0.7))); lift = Math.sin(Math.PI * Math.min(1, Math.max(0, (k - 0.12) / 0.76))) * (hp.big ? 0.5 : 0.3); sy = stbKey(k, [[0, 1], [0.18, hp.big ? 0.84 : 0.9], [0.55, hp.big ? 1.1 : 1.05], [0.85, 0.94], [1, 1]]); rz = hp.sway * 0.16 * Math.sin(Math.PI * k); }
  }
  if (a) {
    k = (now - a.t0) / a.d;
    if (k >= 1) STB3.act = null;
    else {
      busy = 1; var s = Math.sin(Math.PI * k);
      if (a.n === "nod") rx = Math.sin(k * Math.PI * 4) * 0.2 * (1 - k * 0.5);
      else if (a.n === "bounce") lift += Math.abs(Math.sin(k * Math.PI * 3)) * 0.13;
      else if (a.n === "stretch") { sy *= 1 + 0.18 * stbKey(k, [[0, 0], [0.35, 1], [0.7, 1], [1, 0]]); rz += Math.sin(k * Math.PI * 2) * 0.05; }
      else if (a.n === "lean") { rz -= 0.26 * stbKey(k, [[0, 0], [0.3, 1], [0.75, 1], [1, 0]]); px = 0.07 * s; }
      else if (a.n === "bow") rx = 0.5 * stbKey(k, [[0, 0], [0.3, 1], [0.55, 1], [1, 0]]);
      else if (a.n === "wiggle") rz += Math.sin(k * Math.PI * 4) * 0.16 * s;
      else if (a.n === "look") ry = Math.sin(k * Math.PI * 2) * 0.75;
      else if (a.n === "breath") { sy *= 1 - 0.16 * stbKey(k, [[0, 0], [0.5, 1], [0.75, 0], [1, 0]]); lift += k > 0.6 ? Math.sin(Math.PI * (k - 0.6) / 0.4) * 0.12 : 0; }
      else if (a.n === "wipe") rz += Math.sin(k * Math.PI * 6) * 0.08 * s;
      else if (a.n === "cheer") { lift += Math.sin(Math.PI * Math.min(1, k / 0.75)) * 0.55; spin = k < 0.75 ? Math.PI * 2 * stbEaseIO(k / 0.75) : 0; sy *= stbKey(k, [[0, 1], [0.1, 0.85], [0.35, 1.1], [0.75, 0.9], [0.85, 1.05], [1, 1]]); }
    }
  }
  STB3.flow.position.set(0, -off * v.rise * STB3.dir, off * v.run * STB3.dir);
  STB3.bot.position.set(px, lift, v.bz); STB3.body.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy)); STB3.body.rotation.set(rx, 0, rz);
  var ss = 1 - Math.min(0.5, lift * 1.4); STB3.shadow.scale.set(ss, ss, 1);
  if (tn) { k = (now - tn.t0) / tn.d; if (k >= 1) STB3.turn = null; else { busy = 1; fa = tn.to ? stbEaseIO(k) : 1 - stbEaseIO(k); if (tn.spin) spin += Math.PI * 2 * stbEaseIO(k); } }   /* 돌아서기 0.36초 · 한 바퀴 돌며 돌아서기 0.64초 */
  STB3.bot.rotation.y = Math.PI * (1 - fa) + ry + spin;
  var smile = fa > 0.8 && STB3.mood === "smile";
  STB3.eyes.forEach(function (o, i) { o.visible = !(smile || (STB3.wink && i === 0)); }); STB3.smiles.forEach(function (o, i) { o.visible = smile && !(STB3.wink && i === 1) || (STB3.wink && i === 0); });   /* 찡끗 = 왼눈만 반달 */
  var wv = fa > 0.8 && STB3.mood === "wave" && (!stb3Still() || SA.d), tt = (now / 1000) % 1.6;
  STB3.waves.forEach(function (sp, i) { var q = (tt * 0.9 - i * 0.16) / 0.62, o = wv && q >= 0 && q <= 1; sp.material.opacity = o ? 1 - q : 0; var s2 = 0.24 + (o ? q : 0) * 0.6; sp.scale.set(s2, s2, 1); sp.position.y = 1.0 + (o ? q : 0) * 0.12; });
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
  b.loop++; b.ph = "climb"; b.hop = 0; b.sty = stbStyle(b);
  var go = el("stbGo"); if (go && stbAge() >= STB_NUDGE_MS) go.classList.add("nudge");   /* 출발 20초 뒤 = 도착 단추 숨 쉬기 */
  var bot = el("stbBot"); if (bot) bot.classList.toggle("face", b.save || stbRm() || stbDown());   /* 오를 때 = 뒷모습 · 정지 그림 · 내려가기 = 앞모습 */
  if (b.save || stbRm()) { stb3Sync(); stbNext(stbFace, b.save ? 6000 : 3000); return; }
  if (b.sty === "breath") { stb3Act("breath"); stbBotAct("breath"); stbNext(stbHop, 120 + STB_ACT_MS.breath); return; }   /* 숨 고르기(낮췄다 퐁) 뒤 오르기 */
  stbNext(stbHop, 120);
}
/* 5차(사용자 261009 「오를 때 더 다양한 행동 · 지금은 단조롭다」) 오르는 묶음 · 콩콩(기본 두 몫) · 콩콩 폴짝(셋째만 높이 · 한 칸 그대로) · 리듬 타기(몸 좌우) · 두리번(셋째 뒤) · 숨 고르기(첫 점프 전)
   주머니에서 하나씩 꺼낸다 · 직전 고리와 같은 묶음은 건너뛴다 · 다 쓰면 다시 섞는다 */
var STB_STY = ["hop", "big", "sway", "look", "breath", "hop"];
function stbStyle(b) {
  if (!b.sbag || !b.sbag.length) b.sbag = shuf(STB_STY.slice());
  var i = 0; while (i < b.sbag.length && b.sbag[i] === b.lastSty) i++;
  if (i >= b.sbag.length) { b.sbag = b.sbag.concat(shuf(STB_STY.slice())); while (b.sbag[i] === b.lastSty) i++; }   /* 남은 것이 직전과 같은 것뿐이면 새로 섞어 붙인다 */
  var s = b.sbag.splice(i, 1)[0];
  b.lastSty = s; return s;
}
/* 평면 그림 대체본 동작 이름(CSS data-act) · 3D 와 같은 이름 */
function stbBotAct(n) { var bot = el("stbBot"); if (!bot) return; delete bot.dataset.act; if (n && !stbRm()) { void bot.offsetWidth; bot.dataset.act = n; } }
function stbHop() {
  var b = STB; if (!b) return;
  b.hop++;
  var bot = el("stbBot"), cn = el("stbCnt"), ab = b.hop % 2 ? "a" : "b";
  var big = b.sty === "big" && b.hop === 3, sway = b.sty === "sway" ? (b.hop % 2 ? 1 : -1) : 0;
  if (bot) { delete bot.dataset.t; delete bot.dataset.act; bot.dataset.h = big ? "big" + ab : sway ? "s" + ab : ab; }   /* 점프와 돌기는 같은 칸(.stb-hop)을 움직인다 · 하나만 */
  if (cn) { cn.textContent = STB_COUNT[b.hop - 1] || ""; cn.dataset.h = ab; }
  stb3Hop({ big: big, sway: sway });
  if (b.sty === "look" && b.hop === 3) { stbNext(function () { stb3Act("look"); stbBotAct("look"); stbNext(stbHop, STB_ACT_MS.look); }, STB_HOP_MS); return; }   /* 두리번 */
  if (b.hop < STB_HOPS) stbNext(stbHop, STB_HOP_MS); else stbNext(stbFace, STB_HOP_MS + 150);
}
/* 앞으로 돌아섬 → 땀 쪼르륵 → 한마디 + 눈웃음 → 다 말하면 기다렸다 다시 돌아섬 */
function stbFace() {
  var b = STB; if (!b) return;
  b.ph = "talk";
  var bot = el("stbBot"), still = b.save || stbRm(), spin = !still && !stbDown() && b.loop % 3 === 0;   /* 세 고리에 한 번 = 한 바퀴 돌며 돌아섬 */
  b.turn = spin ? "spin" : "turn";
  stb3Face(true, !still, spin); stb3Mood("");
  if (!still && b.loop % 2 === 0) { stb3Act("wipe"); b.turn += "+wipe"; }   /* 짝수 고리 = 땀 닦기(몸 털기) */
  if (bot && !still && !stbDown()) { delete bot.dataset.h; delete bot.dataset.act; bot.dataset.t = bot.dataset.t === "a" ? "b" : "a"; setTimeout(function () { var e = el("stbBot"); if (e && STB === b && b.ph === "talk") e.classList.add("face"); }, STB_TURN_MS / 2); }
  if (bot && !still) { bot.dataset.s = bot.dataset.s === "a" ? "b" : "a"; bot.dataset.m = ""; }
  b.said = false;
  stbNext(stbSpeak, still ? 0 : (spin ? 640 : STB_TURN_MS) + 420);
}
function stbSpeak() {
  var b = STB; if (!b) return;
  var ln = stbPick(b);
  b.said = true;
  var act = STB_ACT_OF[String(ln.k).split(":")[0]] || "wiggle";   /* 말과 동작 짝 */
  if (ln.k === "cute") act = (b.cuteN = (b.cuteN || 0) + 1) % 2 ? "bounce" : "wiggle";   /* 응원 = 통통 · 몸 흔들기 번갈아(한 동작이 몰리지 않게) */
  if (act === b.lastAct) act = act === "bounce" ? "wiggle" : "bounce";   /* 직전과 같은 동작 없음 */
  b.lastAct = act;
  if (!stbRm() && !b.save) { stb3Act(act); stbBotAct(act); }
  if (b.alog && b.alog.length < 400) b.alog.push([Math.round(stbAge() / 1000), b.loop, b.sty || "", b.turn || "", act]);
  stbSay(ln, function () { stbNext(stbBack, stbHoldMs(ln)); });
}
function stbBack() {
  var b = STB; if (!b) return;
  var bot = el("stbBot");
  if (bot) delete bot.dataset.act;
  if (bot && !b.save && !stbRm() && !stbDown()) { stb3Face(false); bot.dataset.t = bot.dataset.t === "a" ? "b" : "a"; setTimeout(function () { var e = el("stbBot"); if (e && STB === b) e.classList.remove("face"); }, STB_TURN_MS / 2); stbNext(stbLoop, STB_TURN_MS + 80); return; }
  stbLoop();
}
/* 15분 = 쉼 · 말 멈춤 · 도착 안내 한 줄 고정(20분부터 30분 보정 안내) · 화면 켜 두기 놓음 · 다음 바뀔 때 한 번만 깨운다 */
function stbRestLine(b) {
  b.rest = true; b.save = true; b.ph = "rest";
  b.line = { t: stbAge() >= STB_FIX_MS ? stbFixLine() : STB_ARRIVE, tag: STB_HEAD.arrive, m: "smile", k: "rest" }; b.n = b.line.t.length; b.done = true;
}
function stbRest() {
  var b = STB; if (!b) return;
  stbStop(); stbRestLine(b); stbPaintLine(); stbWake(false);
  var sr = el("stbSr"); if (sr) sr.textContent = b.line.tag + " · " + b.line.t;
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
/* ═══ 5차 · 도착 장면 (사용자 261009 「종료를 누르면 고생했다는 전환 효과를 귀염뽀짝하게 전체 화면으로 · 스탬프가 알아서 팡 · QR 하나로 끝 · 마지막은 응원이나 다른 프로그램 제안 · 아웃은 엘리베이터 닫히듯 찡끗」) ═══
   도착 QR 판정이 end 로 오면(stairDone · 처음 스캔만) 곧바로 전체 화면 장면 하나 · 누를 단추 없음 · 아무 곳이나 누르면 나감으로 건너뜀 · 약 5.5초
   들어옴 = 1층 둘러보기 엘리베이터 아이리스(검은 막이 챗봇 얼굴에서 열림) · 챗봇(계단과 같은 3D 모델 · 빛) 폴짝 + 한 바퀴 · 꽃가루 · 「고생했어요!」 + 「7F → 9F 계단 완료」
   스탬프 팡 = 기존 도장(stampMarkHtml · stampDrop · 잉크 링 · inkSplash · 진동)을 장면 안에서 · 「스탬프 N / 6」 + 다음 보상 한 줄 · 따로 뜨는 팝업 · 「확인」 없음
   안 붙는 경우 = 팡 없이 사실 한 줄(이미 받음 · 6개를 다 모음 · 누적이 목표 아래 · 대기열 = 곧 들어와요) · 실패(같은 층 · 30분 지나 고르기 · 서버 실패)는 장면 없이 지금 안내
   마무리 말풍선 = 6개 미만이면 다음 참여 제안(stbSugs 첫째) · 6개면 「오늘도 힘내세요!」
   나감 = 아이리스가 얼굴 크기까지 줄었다 멈춤(찡끗 · 왼눈 반달) → 톡 닫힘 → 스탬프 탭(방금 받은 계단 줄로 · expStamp) → 검은 막 걷힘
   보상 알림(룰렛 · 행운권 · 선착순)은 적립 순간 줄에 서 있다가(noticeBusy = 계단 화면) 스탬프 탭으로 간 뒤 지금 방식대로 뜬다
   동작 줄이기 = 아이리스 · 움직임 없이 정지 장면 + 도장 + 말 · 3초 뒤 넘어감 · 3D 를 못 그리면 원본 BOT_SVG */
var SA = { d: null, t: [], raf: 0, go: null, out: false, rm: false, ir: null, done: false, log: [] };
function stbArrInfo(res, q) {
  var st = res && res.stamp, pop = false, line = "", hint = "", n = Math.min(STAMP_DENOM, stampCount());
  if (q) line = "스탬프는 곧 들어와요";
  else if (st && st.id === "st" && !st.dup && !st.revoked && !st.kept) {
    if (stampGot() > STAMP_DENOM) line = "스탬프 " + STAMP_DENOM + "개를 다 모았어요";
    else { pop = true; line = "스탬프 " + n + " / " + STAMP_DENOM; hint = srGoalLine(n); }
  }
  else if (st && st.dup) line = "스탬프는 이미 받았어요";
  else if (res && (res.goal || 1) > 1) line = "누적 " + (res.total || 0) + " / " + res.goal + "개 층";
  var sg = stampCount() >= STAMP_DENOM ? null : stbSugs()[0];
  return { pop: pop, line: line, hint: hint, tag: sg ? "다음 참여" : "", say: sg ? sg[1] : "오늘도 힘내세요!" };
}
function stbArrive(res, q) {
  if (SA.d) return;
  var from = q ? q.from : res && res.from && res.from.fl, to = q ? q.to : res && res.to && res.to.fl, f = stbArrInfo(res, q), rm = stbRm(), i, conf = "";
  for (i = 0; i < 14; i++) conf += '<i style="left:' + (6 + i * 6.6).toFixed(1) + "%;animation-delay:" + (0.25 + (i % 5) * 0.09).toFixed(2) + 's"></i>';
  var d = document.createElement("div");
  d.id = "stbArr"; d.className = "stb-arr" + (rm ? " rm" : ""); d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "계단 도착");
  d.innerHTML = '<div class="sa-in">' +
      '<p class="sa-big">고생했어요!</p><p class="sa-sub">' + esc(from) + "F → " + esc(to) + "F 계단 완료</p>" +
      '<div class="sa-wrap"><div class="sa-stage" id="saStage">' + (STB3.st === 2 ? "" : '<span class="sa-bot"><span class="stb-hop">' + BOT_SVG.replace("</svg>", BOT_WAVE + TOUR_BOT_SM + "</svg>") + "</span></span>") + "</div>" +
        (rm ? "" : '<span class="sa-conf" aria-hidden="true">' + conf + "</span>") + '<span class="sa-mk" id="saMk"></span></div>' +
      (f.line ? '<p class="sa-st' + (f.pop ? " pop" : "") + '">' + esc(f.line) + (f.hint ? "<span>" + esc(f.hint) + "</span>" : "") + "</p>" : "") +
      '<div class="sa-bub">' + (f.tag ? '<span class="stb-tag">' + f.tag + "</span>" : "") + '<span class="sa-tx">' + esc(f.say) + "</span></div>" +
      (q ? "" : '<button type="button" class="sa-re" onclick="stbArrRe(event)">종료가 아니라 새로 시작이에요</button>') +
    '</div><canvas class="sa-iris" id="saIris" aria-hidden="true"></canvas>' +
    '<p class="stb-sr" aria-live="polite">고생했어요 · ' + esc(from) + "F에서 " + esc(to) + "F 계단 완료 · " + esc(f.line) + " · " + esc(f.say) + "</p>";
  document.body.appendChild(d);
  SA.d = d; SA.t = []; SA.out = false; SA.rm = rm; SA.done = false; SA.go = function () { expStamp("st"); }; SA.log = [["in", 0]]; SA.t0 = performance.now(); SA.f = f;
  stbLeave();
  var at = function (fn, ms) { SA.t.push(setTimeout(fn, ms)); };
  d.addEventListener("click", function () { stbArrOut(); });
  var stg = el("saStage");
  if (STB3.st === 2) {   /* 계단과 같은 3D 장면을 당겨 쓴다 · 앞모습 · 모든 칸 앞 띠 주황(다 올랐다) */
    stb3Attach(stg); STB3.cam.position.set(0, 0.92, 2.25); STB3.cam.lookAt(0, 0.5, -0.8);
    STB3.hop = null; STB3.turn = null; STB3.sw = null; STB3.act = null; STB3.wink = false; STB3.face = true; STB3.mood = "smile"; STB3.flow.position.set(0, 0, 0);
    STB3.nose.forEach(function (n) { n.material = STB3.mOn; });
  }
  if (rm) {   /* 동작 줄이기 · 멈춘 한 장 · 도장 바로 · 3초 뒤 */
    if (f.pop) { el("saMk").innerHTML = stampMarkHtml(false, 104); stampBuzz(25); }
    if (STB3.st === 2) { stb3Pose(performance.now()); STB3.r.render(STB3.sc, STB3.cam); }
    stbArrDraw(performance.now());
    at(stbArrOut, 3000);
    return;
  }
  SA.ir = { k: "in", t0: performance.now(), d: 1100 };
  at(function () { if (STB3.st === 2) stb3Act("cheer"); SA.log.push(["cheer", 150]); }, 150);
  if (f.pop) at(function () { var mk = el("saMk"); if (!mk) return; mk.innerHTML = stampMarkHtml(true, 104); inkSplash(mk.querySelector(".stampmk"), 10, 1.4); SA.log.push(["stamp", 1300]); at(function () { stampBuzz([25, 40, 70]); }, 420); }, 1300);
  at(function () { if (STB3.st === 2) { STB3.mood = "wave"; } SA.log.push(["say", 2300]); }, 2300);
  at(function () { if (STB3.st === 2) STB3.mood = "smile"; }, 3700);
  at(stbArrOut, 4300);
  stbArrTick();
}
/* 종료가 아니라 새로 시작 · 장면을 닫고 계단 화면의 재분류로(누르지 않아도 되는 작은 글 링크) */
function stbArrRe(e) { if (e) e.stopPropagation(); stbArrEnd(true); stairReclassOpen(); }
function stbArrOut() {
  if (!SA.d || SA.out) return;
  SA.out = true; SA.t.forEach(clearTimeout); SA.t = []; SA.log.push(["out", Math.round(performance.now() - SA.t0)]);
  if (SA.rm) { SA.d.classList.add("fade"); SA.t.push(setTimeout(function () { stbArrEnd(); }, 220)); return; }
  SA.ir = { k: "out", t0: performance.now(), d: 1350 };
  stbArrTick();
}
/* 끝 · 검은 막 아래에서 스탬프 탭으로 간 뒤 막을 걷는다 */
function stbArrEnd(stay) {
  if (!SA.d || SA.done) return;
  SA.done = true; SA.t.forEach(clearTimeout); SA.t = []; if (SA.raf) { cancelAnimationFrame(SA.raf); SA.raf = 0; }
  var d = SA.d; STB3.wink = false;
  var cv = STB3.r && STB3.r.domElement; if (cv && cv.parentNode && cv.parentNode.id === "saStage") cv.parentNode.removeChild(cv);
  if (!stay && SA.go) SA.go();
  SA.log.push(["end", Math.round(performance.now() - SA.t0)]);
  d.classList.add("gone");
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); if (SA.d === d) SA.d = null; }, SA.rm || stay ? 0 : 260);
}
/* 얼굴 자리(창 기준) · 3D = 카메라 투영 · 평면 그림 = 챗봇 그림 머리 */
function stbArrFace() {
  var g = el("saStage"); if (!g) return { x: innerWidth / 2, y: innerHeight / 2, r: 40 };
  var r = g.getBoundingClientRect();
  if (STB3.st === 2 && window.THREE) {
    var T = window.THREE, V = new T.Vector3(0, 0.52 * 0.95 + STB3.bot.position.y, STB_V.bz), V2 = new T.Vector3(0.36 * 0.95, 0.52 * 0.95 + STB3.bot.position.y, STB_V.bz);
    STB3.cam.updateMatrixWorld(); V.project(STB3.cam); V2.project(STB3.cam);
    var x = r.left + (V.x + 1) / 2 * r.width, y = r.top + (1 - V.y) / 2 * r.height, x2 = r.left + (V2.x + 1) / 2 * r.width;
    return { x: x, y: y, r: Math.max(24, Math.abs(x2 - x)) };
  }
  var b = g.querySelector(".sa-bot"), q = b ? b.getBoundingClientRect() : r;
  return { x: q.left + q.width / 2, y: q.top + q.height * 0.5, r: Math.max(24, q.width * 0.3) };
}
function stbArrDraw(now) {
  var cv = el("saIris"), ir = SA.ir; if (!cv) return;
  var W = innerWidth, H = innerHeight, dp = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dp) || cv.height !== Math.round(H * dp)) { cv.width = Math.round(W * dp); cv.height = Math.round(H * dp); }
  var c = cv.getContext("2d"); c.setTransform(dp, 0, 0, dp, 0, 0); c.clearRect(0, 0, W, H);
  if (!ir) return;
  var t = now - ir.t0, f = stbArrFace(), R0 = Math.max(Math.hypot(f.x, f.y), Math.hypot(W - f.x, f.y), Math.hypot(f.x, H - f.y), Math.hypot(W - f.x, H - f.y)) + 2, Rf = f.r * 1.25, r;
  if (ir.k === "out") r = t < 800 ? Rf + (R0 - Rf) * (1 - stbEaseIO(t / 800)) : t < 1150 ? Rf : Rf * (1 - Math.pow(Math.min(1, (t - 1150) / (ir.d - 1150)), 2));   /* 둘러보기 엘리베이터 닫힘과 같은 박자 */
  else r = t < 120 ? 0 : t < 340 ? Rf * (1 - Math.pow(1 - (t - 120) / 220, 3)) : t < 480 ? Rf : Rf + (R0 - Rf) * stbEaseIO(Math.min(1, (t - 480) / (ir.d - 480)));
  if (ir.k === "in" && t >= ir.d) { SA.ir = null; return; }
  c.fillStyle = "#000000"; c.fillRect(0, 0, W, H);
  if (r > 0.5) { c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(f.x, f.y, r, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = "source-over"; }
}
function stbArrTick() {
  if (SA.raf || !SA.d || SA.done) return;
  SA.raf = requestAnimationFrame(function (now) {
    SA.raf = 0; if (!SA.d || SA.done) return;
    if (SA.ir && SA.ir.k === "out") { var t = now - SA.ir.t0; STB3.wink = t > 780; if (t > 780) STB3.mood = ""; if (t >= SA.ir.d) { stbArrDraw(now); stbArrEnd(); return; } }   /* 얼굴 크기에서 멈춘 동안 찡끗 */
    if (STB3.st === 2 && STB3.r && STB3.r.domElement.parentNode && STB3.r.domElement.parentNode.id === "saStage") { stb3Pose(now); STB3.r.render(STB3.sc, STB3.cam); }
    stbArrDraw(now);
    stbArrTick();
  });
}
/* 대기열(연결 없음 · 서버 붐빔)로 저장된 도착 스캔 · 진행 중 출발이 있고 다른 층이면 같은 장면(「스탬프는 곧 들어와요」) · 아니면 지금 안내 */
function stbArriveQ(it) {
  var s = stairState(), fl = Number(it && it.fl);
  if (!s.leg || !fl || fl === Number(s.leg.fl) || SA.d) return false;
  stbArrive(null, { from: s.leg.fl, to: fl });
  return true;
}
