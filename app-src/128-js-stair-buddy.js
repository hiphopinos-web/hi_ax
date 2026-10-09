/* ═══ 계단 동행 · 챗봇이 같이 계단을 간다 (사용자 261009 「계단실 QR을 찍으면 챗봇이 계단을 오르고 응원 · 화면을 닫지 않게 · 동물의 숲 감성」) ═══
   자리 = 출발 QR 뒤 진행 화면(라우트 stair · STR.mode "start") · 판정 · 서버 · 대기열은 그대로(114 stair_scan · 계단_목표층) · 이 조각은 화면 경험만
   흐름 = 준비 운동(말 3줄 · 몸 풀기 · 화면 켜 두기 한 줄) → 아이리스 → 계단 걷기 고리(1초에 한 칸 · 7칸 = 한 층 · 끝나면 아이리스로 다음 층)
          말풍선 = 응원 · AX 상식 · 다음 참여 · 도착 QR 안내가 돌아가며 · 아래 고정 큰 단추 「도착 층 QR 찍기」는 처음부터 늘 보인다(20초 뒤 고리가 숨 쉰다)
   센서 없음(웹 앱은 층 · 고도를 모른다) = 시간 흐름만 · 말은 「계단」 중립(오르기 · 내려가기 모두) · 18F 출발 = 내려가는 그림
   1층 둘러보기 엘리베이터(tour3.js v5.55)에서 빌린 감성 = 얼굴 가운데 아이리스(얼굴 크기까지 줄었다 멈칫 · 톡 닫힘 · 톡 열림 · 끝까지) · 둥근 말풍선 · 글자 한 자씩 · 통통 튀기
   캐릭터 = 원본 BOT_SVG(path 그대로) + 안테나 전파(BOT_WAVE · AX 상식 말할 때) + 눈웃음(TOUR_BOT_SM · 응원할 때) · 움직임은 transform 만
   이어 보기 = 상태는 이 기기 메모리(STB) · 같은 출발(leg since)이면 화면을 떠났다 와도 · 다시 그려져도 그 자리부터 · 새 출발 20초 안에 들어와야 준비 운동부터
   화면 켜 두기 = Wake Lock(지원 기기만 · 실패는 조용히) · 화면을 떠나거나 가려지면 놓고 멈춘다(타이머 · 그림 정지) · 다시 보이면 이어서
   동작 줄이기 = 그림 + 말풍선만(타자 · 걷기 · 몸 풀기 · 아이리스 없음 · 말은 6초마다 바뀜)
   AX 상식 = 새로 지어내지 않는다 · 점프 AX 상식(JP_FACTS · 1층 판 근거)은 그 글 그대로 · AX 퀴즈 해설(OX_BANK)은 말투만 바꿈 · 출처 id 를 같이 적는다(검사 346) */
var STB_STEPS = 7, STB_STEP_MS = 1000, STB_TYPE_MS = 45, STB_WARM_FRESH = 20000, STB_NUDGE_MS = 20000, STB_RM_MS = 6000;
var STB_WARM = ["출발 전에 가볍게 몸 풀어요", "하나, 둘! 화면은 켠 채로 같이 가요", "좋아요, 이제 계단으로 가요!"];
var STB_CHEER = ["뛰지 말고 한 칸씩 천천히 가요", "좋아요, 잘 가고 있어요!", "숨이 차면 잠깐 쉬어 가도 돼요", "난간을 잡고 가요", "한 걸음씩, 같이 가요"];
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
/* 다음 참여 · 지금 스탬프(8종 중 안 받은 것 · 6개 상한) · 시각으로 · 6개면 축하 한 줄 · 사은품 · 가격 · 10F 말 없음 */
function stbSugs() {
  var st = S.get("stamps", []) || [], has = function (id) { return st.indexOf(id) >= 0; };
  if (stampCount() >= STAMP_DENOM) return [];
  var ph = evPhase(), hm = hmNow(), out = [];
  if (!has("sv") && surveyOpen()) out.push("오늘 한 판 설문은 60초면 끝나요");   /* 14:30부터(서버 survey_submit 와 같은 surveyOpen) */
  if (ph === "live" && progUnits() < 2 && hm >= 780 && hm < 1000) out.push("17F 오후 강연은 입장 · 끝 QR로 스탬프 2개예요");   /* 13:00~16:40 · AWS 13:30 · MS 15:10 */
  if (ph === "live" && !has("p2") && hm >= 570 && hm < 990) out.push("1F AX PLAY에서 HiDI-Q를 체험해 봐요");   /* 09:30~16:30 */
  if (!has("qz")) out.push("AX 퀴즈 5문제, 모두 답하면 스탬프예요");
  if (!has("p4")) { var mg = Math.max(1, MG_NEED - mgDone()); out.push("미니 게임 " + mg + "종목, 한 판씩이면 돼요"); }
  if (!has("p5")) out.push("아이디어 한 줄을 남기면 스탬프예요");
  return out;
}
function stbArriveLine() {
  var st = S.get("stamps", []) || [], n = stampCount();
  if (st.indexOf("st") < 0 && n < STAMP_DENOM) return "도착하면 아래 버튼으로 QR을 찍어요. 스탬프 " + (n + 1) + "개째예요";
  return "도착하면 아래 버튼으로 QR을 찍어요";
}
function stbSince() { var o = STR.res || {}, s = stairState(); return o.since || (s.leg && s.leg.since) || 0; }
function stbDown() { return Number((STR.res || {}).fl) >= 18; }
function stbEnsure(since) {
  if (STB && STB.leg === since) return STB;
  var warm = Date.now() - since < STB_WARM_FRESH;
  STB = { leg: since, scene: warm ? "warm" : "walk", k: stbRm() ? 3 : 0, wi: 0, seq: 0, ci: 0, si: 0, fi: Math.floor(Math.random() * STB_FACTS.length),
    line: null, n: 0, done: false, tType: 0, tHold: 0, tStep: 0, raf: 0, iris: null, t0: Date.now() };
  STB.line = warm ? { t: STB_WARM[0], m: "smile" } : stbNextWalk();
  STB.n = stbRm() ? STB.line.t.length : 0; STB.done = stbRm();
  return STB;
}
/* 걷는 동안 말 순서 = 응원 → AX 상식 → 다음 참여(없으면 상식) → 도착 안내 · 6개를 다 모았으면 다음 참여 자리에 축하 한 줄 */
function stbNextWalk() {
  var kind = ["c", "f", "s", "r"][STB.seq % 4], fs, sg;
  STB.seq++;
  if (kind === "s") {
    if (stampCount() >= STAMP_DENOM) return { t: "스탬프 " + STAMP_DENOM + "개를 다 모았어요. 축하해요!", m: "smile" };
    sg = stbSugs();
    if (sg.length) return { t: sg[STB.si++ % Math.min(2, sg.length)], tag: "다음 참여", m: "smile" };   /* 앞의 두 개를 번갈아 */
    kind = "f";
  }
  if (kind === "c") return { t: STB_CHEER[STB.ci++ % STB_CHEER.length], m: "smile" };
  if (kind === "r") return { t: stbArriveLine(), m: "smile", go: 1 };
  for (var i = 0; i < STB_FACTS.length; i++) { fs = stbFactText(STB_FACTS[STB.fi++ % STB_FACTS.length]); if (fs) break; }
  return { t: fs || STB_CHEER[0], tag: fs ? "AX 상식" : "", m: fs ? "wave" : "smile" };
}
/* ── 그림 · 320 × 220 칸 · 점 간격 8 · 칸 i(0~7) = 점 4열 · 높이 (i + 1) × 2줄 · 맨 윗줄 = 디딤판(진한 점) · 지나간 칸은 주황(격자는 제자리 · 켜지기만) ── */
function stbStairSvg(k, down) {
  var d = "", i, c, r, on;
  for (i = 0; i <= STB_STEPS; i++) {
    on = down ? i >= STB_STEPS - k : i <= k;
    d += '<g data-i="' + i + '"' + (on ? ' class="on"' : "") + ">";
    for (c = 0; c < 4; c++) for (r = 0; r < (i + 1) * 2; r++) d += '<circle' + (r === (i + 1) * 2 - 1 ? ' class="t"' : "") + ' cx="' + (30 + (i * 4 + c) * 8) + '" cy="' + (208 - r * 8) + '" r="2.6"/>';   /* t = 디딤판 줄(계단 윤곽) */
    d += "</g>";
  }
  return '<svg class="stb-st" viewBox="0 0 320 220" aria-hidden="true">' + d + "</svg>";
}
function stbBotHtml(k, down, mood) {
  var p = down ? STB_STEPS - k : k;
  return '<span class="stb-bot" id="stbBot" data-m="' + (mood || "") + '" style="--k:' + p + '"><span class="stb-hop">' +
    BOT_SVG.replace("</svg>", BOT_WAVE + TOUR_BOT_SM + "</svg>") + "</span></span>";
}
function stbHtml(o, s, since) {
  var b = stbEnsure(since), down = stbDown(), ln = b.line || { t: "" }, rm = stbRm();
  var warmAt = b.scene === "warm" ? ' style="--wd:-' + ((Date.now() - b.t0) % 1600) + 'ms"' : "";   /* 다시 그려도 몸 풀기 박자가 이어지게 */
  return '<div class="ax-stack-tight stb-where"><h1 class="ax-title">' + esc(o.fl) + "F · " + esc(o.route || stairRoute(o.r)) + "</h1>" +
    '<p class="ax-meta" id="stElapsed">시작 ' + esc(o.at || (s.leg && s.leg.at) || "") + " · " + stairElapsed(since) + "</p></div>" +
    '<button type="button" class="stb-bub" id="stbBub" aria-label="다음 말 보기" onclick="stbSkip()">' +   /* 말풍선 = 단추(누르면 다 보이기 · 다음 말) · 읽어 주기는 아래 stbSr 한 줄 */
      '<span class="stb-tx" aria-hidden="true">' + (ln.tag ? '<span class="stb-tag" id="stbTag">' + ln.tag + "</span>" : '<span class="stb-tag" id="stbTag" hidden></span>') +
      '<span id="stbTx">' + esc(ln.t.slice(0, b.n)) + '</span><i class="stb-more' + (b.done ? " on" : "") + '" id="stbMore"></i></span></button>' +
      '<p class="stb-sr" id="stbSr" aria-live="polite">' + esc((ln.tag ? ln.tag + " · " : "") + ln.t) + "</p>" +
    '<div class="stb-stage' + (down ? " down" : "") + (rm ? " rm" : "") + '" id="stbStage" data-sc="' + b.scene + '"' + warmAt + ">" +
      '<div class="stb-flip">' + stbStairSvg(b.k, down) + stbBotHtml(b.k, down, ln.m) + "</div>" +
      '<canvas class="stb-iris" id="stbIris" aria-hidden="true"></canvas></div>' +
    '<p class="axs-safe">' + STAIR_SAFE + "</p>" +
    '<p class="ax-meta stb-cap">도착 층 방화문 앞 QR 스캔 · ' + ((s.goal || 1) > 1 ? "누적 " + (s.total || 0) + " / " + s.goal + "개 층" : (s.total || 0) >= 1 ? "오늘 " + s.total + "개 층 이동" : "한 개 층만 이동해도 적립") + "</p>";
}
/* 아래 고정 큰 단추 · 처음부터 늘 · 출발 20초 뒤 = 숨 쉬는 고리(도착할 즈음) */
function stbFoot(since) {
  return '<div class="axs-fix ax-bottom stb-foot"><button type="button" class="ax-button stb-go' + (Date.now() - since >= STB_NUDGE_MS ? " nudge" : "") + '" id="stbGo" onclick="scanOpen(\'st\')">' +
    '<svg aria-hidden="true"><use href="#qr-corners"/></svg><span>도착 층 QR 찍기</span></button></div>';
}
/* ── 움직임 ── */
function stbPaintBot(hop) {
  var b = STB, bot = el("stbBot"), stg = el("stbStage"); if (!b || !bot || !stg) return;
  var down = stg.classList.contains("down"), p = down ? STB_STEPS - b.k : b.k;
  bot.style.setProperty("--k", p);
  if (hop) bot.dataset.h = bot.dataset.h === "a" ? "b" : "a";
  stg.querySelectorAll(".stb-st g").forEach(function (g) { var i = +g.getAttribute("data-i"); g.classList.toggle("on", down ? i >= STB_STEPS - b.k : i <= b.k); });
  stg.dataset.sc = b.scene;
}
function stbPaintLine() {
  var b = STB, ln = b && b.line; if (!ln) return;
  var tx = el("stbTx"), tg = el("stbTag"), mo = el("stbMore"), bot = el("stbBot");
  if (tx) tx.textContent = ln.t.slice(0, b.n);
  if (tg) { tg.hidden = !ln.tag; tg.textContent = ln.tag || ""; }
  if (mo) mo.classList.toggle("on", b.done);
  if (bot) bot.dataset.m = ln.m || "";
}
function stbSay(ln) {
  var b = STB; if (!b) return;
  if (b.tType) { clearInterval(b.tType); b.tType = 0; }
  if (b.tHold) { clearTimeout(b.tHold); b.tHold = 0; }
  b.line = ln; b.n = 0; b.done = false;
  var sr = el("stbSr"); if (sr) sr.textContent = (ln.tag ? ln.tag + " · " : "") + ln.t;
  var bub = el("stbBub"); if (bub && !stbRm()) { bub.classList.remove("pop"); void bub.offsetWidth; bub.classList.add("pop"); }   /* 새 말 = 말풍선이 톡 */
  if (stbRm()) { b.n = ln.t.length; b.done = true; stbPaintLine(); stbHold(STB_RM_MS); return; }
  stbPaintLine(); stbType();
}
function stbType() {
  var b = STB; if (!b || b.tType || b.done) return;
  b.tType = setInterval(function () {
    if (!STB || STB !== b) return;
    b.n = Math.min(b.line.t.length, b.n + 1);
    if (b.n >= b.line.t.length) { clearInterval(b.tType); b.tType = 0; b.done = true; stbPaintLine(); stbHold(b.scene === "warm" ? 1500 : Math.min(5000, 2200 + 70 * b.line.t.length)); return; }   /* 준비 운동은 짧게(합 7초 안팎) */
    var tx = el("stbTx"); if (tx) tx.textContent = b.line.t.slice(0, b.n);
  }, STB_TYPE_MS);
}
function stbHold(ms) {
  var b = STB; if (!b) return;
  if (b.tHold) clearTimeout(b.tHold);
  b.tHold = setTimeout(function () { b.tHold = 0; if (STB === b) stbAdvance(); }, ms);
}
function stbAdvance() {
  var b = STB; if (!b) return;
  if (b.scene === "warm") {
    b.wi++;
    if (b.wi < STB_WARM.length) { stbSay({ t: STB_WARM[b.wi], m: "smile" }); return; }
    stbIris(function () { b.scene = "walk"; b.k = 0; stbPaintBot(false); stbStepOn(); });   /* 검은 동안 걷기 장면으로 · 걸음은 그때부터 */
    stbSay(stbNextWalk());
    return;
  }
  stbSay(stbNextWalk());
}
/* 말풍선 누름 = 쓰는 중이면 다 보이기 · 다 보였으면 다음 말 */
function stbSkip() {
  var b = STB; if (!b || !b.line) return;
  if (!b.done) { if (b.tType) { clearInterval(b.tType); b.tType = 0; } b.n = b.line.t.length; b.done = true; stbPaintLine(); stbHold(3500); return; }
  if (b.tHold) { clearTimeout(b.tHold); b.tHold = 0; }
  stbAdvance();
}
function stbStepOn() {
  var b = STB; if (!b || b.tStep || b.scene !== "walk" || stbRm()) return;
  b.tStep = setInterval(function () {
    if (!STB || STB !== b) return;
    var go = el("stbGo"); if (go && Date.now() - b.leg >= STB_NUDGE_MS) go.classList.add("nudge");
    if (b.iris) return;
    if (b.k >= STB_STEPS) { stbIris(function () { b.k = 0; stbPaintBot(false); }); return; }   /* 한 층 끝 = 아이리스 · 검은 동안 첫 칸으로 */
    b.k++; stbPaintBot(true);
  }, STB_STEP_MS);
}
/* 아이리스(tour3.js v5.55 irDraw 와 같은 그림 · 짙은 면 + 얼굴 가운데 구멍) · 무대 안만 덮는다(말풍선 · 단추는 그대로 보임)
   0~650 얼굴 크기까지 줄기 · 650~900 멈칫 · 900~1050 톡 닫힘 · 1050~1250 닫힌 채(이때 mid) · 1250~1430 얼굴 크기로 톡 · 1430~1530 멈칫 · 1530~2000 끝까지 */
function stbIris(mid) {
  var b = STB; if (!b) return;
  if (stbRm() || document.hidden || !el("stbIris")) { mid(); return; }
  if (b.raf) cancelAnimationFrame(b.raf);
  b.iris = { t0: 0, mid: mid, midDone: false };
  var ease = function (x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
  var tick = function (now) {
    b.raf = 0;
    var I = b.iris; if (!I || STB !== b) return;
    if (!I.t0) I.t0 = now;
    var t = now - I.t0, cv = el("stbIris"), stg = el("stbStage"), bot = el("stbBot");
    if (!I.midDone && t >= 1050) { I.midDone = true; I.mid(); }
    if (t >= 2000 || !cv || !stg || !bot) { stbIrisDraw(cv, -1); b.iris = null; return; }
    var sr = stg.getBoundingClientRect(), br = bot.getBoundingClientRect();
    var x = br.left + br.width / 2 - sr.left, y = br.top + br.height / 2 - sr.top, rf = br.width * 0.42;
    var r0 = Math.max(Math.hypot(x, y), Math.hypot(sr.width - x, y), Math.hypot(x, sr.height - y), Math.hypot(sr.width - x, sr.height - y)) + 2, r;
    if (t < 650) r = rf + (r0 - rf) * (1 - ease(t / 650));
    else if (t < 900) r = rf;
    else if (t < 1050) r = rf * (1 - Math.pow((t - 900) / 150, 2));
    else if (t < 1250) r = 0;
    else if (t < 1430) r = rf * (1 - Math.pow(1 - (t - 1250) / 180, 3));
    else if (t < 1530) r = rf;
    else r = rf + (r0 - rf) * ease((t - 1530) / 470);
    stbIrisDraw(cv, r, x, y, sr.width, sr.height);
    b.raf = requestAnimationFrame(tick);
  };
  b.raf = requestAnimationFrame(tick);
}
function stbIrisDraw(cv, r, x, y, W, H) {
  if (!cv) return;
  var c = cv.getContext("2d");
  if (r < 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); return; }
  var dp = Math.min(2, window.devicePixelRatio || 1), cw = Math.round(W * dp), ch = Math.round(H * dp);
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  c.setTransform(dp, 0, 0, dp, 0, 0); c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, W, H);
  c.fillStyle = getComputedStyle(cv).color || "#191F28"; c.fillRect(0, 0, W, H);
  if (r > 0.5) { c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = "source-over"; }
}
/* 아이리스 도중에 멈추면 = 그 자리에서 끝내기(mid 를 빠뜨리지 않는다) */
function stbIrisEnd() {
  var b = STB; if (!b) return;
  if (b.raf) { cancelAnimationFrame(b.raf); b.raf = 0; }
  if (b.iris) { var I = b.iris; b.iris = null; if (!I.midDone) I.mid(); stbIrisDraw(el("stbIris"), -1); }
}
/* ── 붙이기 · 떼기 · 라우터가 stair 화면을 그린 뒤 부른다 ── */
function stbMount() {
  if (App.current !== "stair" || STR.mode !== "start" || !el("stbStage") || !STB) { stbLeave(); return; }
  var b = STB;   /* 상태는 그리는 쪽(stbHtml · stbEnsure)이 만든다 · 여기서는 이어 돌리기만 */
  stbWake(true);
  if (document.hidden) return;
  if (b.done) { if (!b.tHold) stbHold(stbRm() ? STB_RM_MS : 1500); }
  else if (!b.tType) { if (stbRm()) { b.n = b.line.t.length; b.done = true; stbPaintLine(); stbHold(STB_RM_MS); } else stbType(); }
  if (b.scene === "walk") stbStepOn();
}
function stbStop() {
  var b = STB; if (!b) return;
  stbIrisEnd();
  if (b.tType) { clearInterval(b.tType); b.tType = 0; }
  if (b.tHold) { clearTimeout(b.tHold); b.tHold = 0; }
  if (b.tStep) { clearInterval(b.tStep); b.tStep = 0; }
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
      if (App.current !== "stair" || STR.mode !== "start") { try { var p = l.release(); if (p && p.catch) p.catch(function () {}); } catch (e) {} return; }
      STBWL.l = l;
      try { l.addEventListener("release", function () { if (STBWL.l === l) STBWL.l = null; }); } catch (e) {}
    }, function () { STBWL.req = false; });
  } catch (e) { STBWL.req = false; }
}
document.addEventListener("visibilitychange", function () {
  if (document.hidden) { stbStop(); stbWake(false); var g = el("stbStage"); if (g) g.classList.add("hold"); return; }
  if (typeof App !== "undefined" && App.current === "stair" && STR.mode === "start") { var g2 = el("stbStage"); if (g2) g2.classList.remove("hold"); stbMount(); }
});
