/* ════════════════ ME to WE 점프 · 탭 점프 러너 (60초 · 하트 3) ════════════════
   챗봇이 자동으로 달린다(v4.08 · 원본 래스터 JP_BOT) · 탭 = 점프 · 공중에서 한 번 더 탭 = 2단 점프 (PC 는 스페이스·위 화살표도).
   장애물(상자 · 러버콘 · 계단 블록)에 부딪히면 하트 -1 후 1초 무적(깜빡임) · 첫 충돌로 끝나지 않는다.
   끝 = 60초 완주 또는 하트 3개 소진. 처음 10초는 장애물이 드물고 느리다 → 이후 조금씩 빨라진다.
   코인 = AX 토큰. 점수 = 코인 × 30 + 버틴 초 × 5 (v3.94 넘은 장애물 +20 폐지 · 순위는 생존 시간). 장애물 이름·모양은 중립적인 사물만(회사·동료를 부정적으로 그리지 않는다). */
/* v3.75 (사용자 확정 260918) 60초 제한 폐지 → 오래 버틴 시간이 기록 · 갈수록 빨라지고 장애물이 촘촘해진다.
   안전 상한 5분 · 올림픽 환산은 기록/목표(길수록 좋다) · 목표 60초(6000 = 1/100초) · 팡(빠를수록 좋다)과 반대 방향이다.
   v6.11 (사용자 261007 「점프가 5분을 넘을 가능성」 · 「스태프 계정이 끝판 깼어 · 난이도를 올려 줘」) 시간 제한 없음 · 끝 = 하트 3개 소진 또는 만점 3,000(끝판).
   조사(운영 기록 · 봇) · 5분 상한은 닿은 적도 닿을 수도 없었다(운영 점프 판 최대 82.8초 · 완벽 봇도 만점 3,000 에서 약 77초에 끝) · 끝판 = 만점 3,000.
   30초부터 더 어렵게(JP_HARD · jpSpeed · jpGapPx · jpGapSec · jpNewP) · 처음 30초는 그대로 · 사람 반응 봇(200~300ms) 같은 18판 중앙 67.9초 → 55.1초 · 만점 4판 → 0판 · 완벽 봇은 그대로 만점(풀 수 있는 판). */
var JP_W = 180, JP_H = 240, JP_GY = 196, JP_PX = 30, JP_HEARTS = 3, JP_G = 820, JP_JV = 300, JP_JV2 = 245, JP_INV = 1.0;
var JP_ITEM_EVERY = 15, JP_ITEM_SEC = 5;   /* 아이템 · 15초마다 하나 · 5초 동안 */
/* v3.98 AI 상식 문장 · v4.30 (사용자 확정 260924) 기억력 은행에서 빌려 쓰지 않고 점프 전용 JP_FACTS(O/X 참 명제 결) · JP_BG_MAX 자 이하만
   v4.92 (261001 사용자 승인 · 앱 개편 4묶음) 1층 부스 판 기준 30문장 · 정본 「기억력 문제 은행 v3.json」 jump = 「QA/문제 은행 확정안 v1.json」 jump · dom = 1층 구역
   v4.00 (사용자 요청 260919) 흘러가는 배경 → 공중에 뜬 글자 블록(2단 점프 미션) · 들이받으면 글자가 흩어지며 점수 보너스 · 결과 화면에 획득 목록
   블록 = 바닥에서 80~110 높이(1단 점프 머리 최고 75 · 2단 점프 113) · 앞뒤 장애물과 떨어뜨려 회피와 동시에 요구하지 않는다
   v6.11 (사용자 261007 「AX 상식이 너무 허접하고 주어가 빠진 것들이 많아」) 30문장 전부 다시 씀 · 모든 문장에 주어 · 한 문장 = 사실 하나 · 근거 = 1층 판(assets/tour/tour-boards.js) · id · 난이도 배분(14 · 11 · 5) 그대로 · 정본 「QA/문제 은행 확정안 v1.json」 jump 도 같이 */
var JP_BG_MAX = 21, JP_BG_FIRST = 7, JP_BG_EVERY = 10;
var JP_FACT = { w: 104, h: 30, lo: 80 };   /* v4.02 블록 점수는 올림픽 규칙 jump.fact(기본 100 · v4.00 의 임시 +150 폐지) */
var JP_FACTS = [
  { id: "jp01", lv: 1, dom: "vision", text: "AX는 AI로 일하는 방식을 바꿔요" },
  { id: "jp02", lv: 1, dom: "vision", text: "사람은 목표를 정하고 결과를 판단해요" },
  { id: "jp03", lv: 1, dom: "vision", text: "2026년 로드맵은 공감과 참여예요" },
  { id: "jp04", lv: 1, dom: "lab", text: "아이디어 한 줄은 QR로 남겨요" },
  { id: "jp05", lv: 1, dom: "vision", text: "2027년 로드맵은 확산과 체화예요" },
  { id: "jp06", lv: 1, dom: "vision", text: "2028년 로드맵은 혁신과 연결이에요" },
  { id: "jp07", lv: 1, dom: "lab", text: "DAP는 데이터로 업무 문제를 풀어요" },
  { id: "jp08", lv: 1, dom: "lab", text: "DAP는 코딩을 몰라도 지원해요" },
  { id: "jp09", lv: 1, dom: "lab", text: "내 업무 고민도 DAP 과제가 돼요" },
  { id: "jp10", lv: 1, dom: "action", text: "하이핑거는 보상 직원이 만든 앱이에요" },
  { id: "jp11", lv: 1, dom: "play", text: "HiDI-Q에는 문서를 5개까지 올려요" },
  { id: "jp12", lv: 1, dom: "play", text: "HiDI-Q에는 필요한 장만 올려요" },
  { id: "jp13", lv: 1, dom: "play", text: "HiDI-Q에는 질문을 하나씩 해요" },
  { id: "jp14", lv: 1, dom: "lounge", text: "AX 라운지에서는 업무 고민을 상담해요" },
  { id: "jp15", lv: 2, dom: "vision", text: "2027년 목표는 업무별 Agent예요" },
  { id: "jp16", lv: 2, dom: "vision", text: "Agent는 도구와 작업을 연결해요" },
  { id: "jp17", lv: 2, dom: "vision", text: "데이터는 판단에 필요한 근거가 돼요" },
  { id: "jp18", lv: 2, dom: "action", text: "강북이는 예상 시상금을 알려 줘요" },
  { id: "jp19", lv: 2, dom: "play", text: "HiDI-Q는 올린 문서로 답해요" },
  { id: "jp20", lv: 2, dom: "play", text: "HiDI-Q는 원본 양식대로 번역해요" },
  { id: "jp21", lv: 2, dom: "play", text: "HiDI-Q는 보고서 초안도 써 줘요" },
  { id: "jp22", lv: 2, dom: "play", text: "하이헬퍼는 1분 안에 설계를 추천해요" },
  { id: "jp23", lv: 2, dom: "play", text: "하이헬퍼는 피보험자 동의 후에 추천해요" },
  { id: "jp24", lv: 2, dom: "play", text: "하이헬퍼는 태아보험도 설계해요" },
  { id: "jp25", lv: 2, dom: "lounge", text: "AX 라운지는 실행 방법까지 정해요" },
  { id: "jp26", lv: 3, dom: "play", text: "신상품은 하이헬퍼 반영이 늦어요" },
  { id: "jp27", lv: 3, dom: "action", text: "AI 컨설팅 도우미는 화법을 알려 줘요" },
  { id: "jp28", lv: 3, dom: "action", text: "하이핑거는 통화녹취도 분석해요" },
  { id: "jp29", lv: 3, dom: "vision", text: "법률 Agent는 근거와 함께 답해요" },
  { id: "jp30", lv: 3, dom: "vision", text: "의료심사 Agent는 심사를 도와요" }
];
var JP_FACT_W = [50, 40, 10];   /* v4.30 난이도 가중 · 쉬움 50 · 보통 40 · 어려움 10 (사용자 확정 260924) */
/* 한 판에 나올 문장 순서 · 한 줄마다 난이도를 가중 무작위로 고르고(쉬움 50 · 보통 40 · 어려움 10), 그 난이도에서 아직 안 나온 문장을 무작위로 ·
   다 쓴 난이도는 가중에서 빠진다(한 판 안 같은 문장 반복 없음) · 30문장을 다 쓰면 처음부터 · n = 만들 줄 수(기본 JP_FACTS 개수 · 5분 상한이면 30줄 안팎) */
function jpBgLines(n) {
  var by = [[], [], []], left = [[], [], []], out = [];
  JP_FACTS.forEach(function (f) { if (f.text.length <= JP_BG_MAX && f.lv >= 1 && f.lv <= 3) by[f.lv - 1].push(f.text); });
  var fill = function () { for (var k = 0; k < 3; k++) left[k] = shuf(by[k].slice()); };
  n = n || JP_FACTS.length;
  fill();
  for (var i = 0; i < n; i++) {
    var tot = 0, r, d;
    for (d = 0; d < 3; d++) if (left[d].length) tot += JP_FACT_W[d];
    if (!tot) { fill(); for (d = 0; d < 3; d++) if (left[d].length) tot += JP_FACT_W[d]; }
    if (!tot) break;
    r = Math.random() * tot;
    for (d = 0; d < 3; d++) { if (!left[d].length) continue; r -= JP_FACT_W[d]; if (r < 0) break; }
    if (d > 2) for (d = 2; !left[d].length; d--);
    out.push(left[d].pop());
  }
  return out;
}
/* 장애물 판정 사각형 [가로 시작, 폭, 높이, 바닥에서 뜬 높이(없으면 0)] · 그린 모양과 판정이 같다
   v3.94 중반 이후 새 유형 (사용자 요청 260918 「중간 이후 입체적인 방해 장치」):
   (v4.00 탑 삭제) sign 낮은 간판 = v3.98 엎드려야만 지나간다(간판 밑 16 · 서 있는 몸 20 은 부딪히고 엎드린 몸 12 는 통과 · 위로는 110 이라 못 넘는다) · tower 탑 62 = 2단 점프만 넘는다(1단 최고 57)
   gap 끊긴 바닥 = 점프 · bob 오르내리는 상자(0~34) = 2단 점프면 언제든 넘는다 · 아이템 없이 모두 넘을 수 있다 */
var JP_OBS = { box: { w: 16, rects: [[0, 16, 16]] }, cone: { w: 14, rects: [[3, 8, 17]] }, step: { w: 22, rects: [[0, 11, 8], [11, 11, 15]] },
  sign: { w: 30, rects: [[2, 26, 94, 16]] }, gap: { w: 34, rects: [] }, bob: { w: 14, rects: [[0, 14, 14]] } };   /* v4.00 탑 삭제 · 2단 점프는 상자와 글자 미션이 맡는다 */
/* 새 유형 등장표 · v4.00 (사용자 요청 260919 「1+1+1+1」) ① 단순 장애물(처음부터) → ② 간판 20초 → ③ 구멍 30초 → ④ 오르내리는 상자 40초
   단계가 열리면 풀에 하나씩 더해지고 이전 유형도 계속 섞인다(가방 섞기 jpBagNext) · 처음 나올 때는 먼 거리 + 예고 배너(검정) */
var JP_NEW = [
  { k: "sign", at: 20, tip: "낮은 간판", how: "화면을 꾸욱 누르면 엎드릴 수 있어요" },
  { k: "gap", at: 30, tip: "끊긴 바닥", how: "점프로 건너기" },
  { k: "bob", at: 40, tip: "오르내리는 상자", how: "2단 점프로 넘기" }
];
/* v4.00 일반 장애물 최소 간격(초) · 한 번에 넘기엔 멀고 착지 뒤 다시 뛰기엔 가까운 간격(구 53~77px @200)을 없앤다 */
var JP_GAP_SEC = 0.65;
/* v3.98 난이도 +30% (사용자 요청 260919) · 속도 오르는 기울기·간격 줄어드는 속도·속도 UP 시점을 모두 1.3배 빠르게 · 상한(속도 200·간격 하한 78)은 그대로 */
var JP_RAMP = 1.3;
var JP_BOB_AMP = 34, JP_BOB_PER = 1.5;   /* 오르내리는 상자 · 바닥 0 ~ 34 · 1.5초 주기 */
var JP_NEW_P = 0.45;   /* 새 유형 비율(일반 장애물 뒤 차례마다) · v4.00 20초 30%에서 올라 45초에 45% 상한 */
var JP_COIN = ["...KKKK...", ".KKOOOOKK.", ".KOWOOWOK.", "KOOOWWOOOK", "KOOOWWOOOK", ".KOWOOWOK.", ".KKOOOOKK.", "...KKKK..."];
var JP_COINCV = null;
var JP = { on: false, raf: 0, parts: [], pops: [] };
/* v4.08 (design.md A-5 결정 5) 러너 = 행사 캐릭터 챗봇 · 원본 BOT_SVG 를 줄여 래스터화한 것만 쓴다(새로 그리지 않는다)
   서기 22×26 · 엎드리기 = 같은 그림을 세로로 누른 22×14(스쿼시) · 달리기 = 몸 전체 1칸 튀기기 · 공중 = 같은 그림
   원본 200 상자에서 그림이 있는 곳(40~160 × 18~157)만 잘라 쓴다 · 크기별로 한 번만 래스터화해 둔다 */
var JP_BOT = { img: null, ok: false, cv: {}, vb: "40 18 120 139" };
function jpBotLoad() {
  if (JP_BOT.img) return;
  var svg = BOT_SVG.replace('<svg viewBox="0 0 200 200"', '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="139" preserveAspectRatio="none" viewBox="' + JP_BOT.vb + '"').replace(/ class="eye"/g, "");
  var im = new Image();
  im.onload = function () { JP_BOT.ok = true; JP_BOT.cv = {}; if (el("jpPrev")) jpPreview(); };
  im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  JP_BOT.img = im;
}
function jpBotCv(w, h) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  if (!JP_BOT.ok) return null;
  var k = w + "x" + h;
  if (!JP_BOT.cv[k]) { var c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(JP_BOT.img, 0, 0, w, h); JP_BOT.cv[k] = c; }
  return JP_BOT.cv[k];
}
var JP_BOT_W = 22, JP_BOT_H = 26, JP_BOT_DH = 14;   /* 서기 22×26 · 엎드리기 22×14 */
/* 그리기 · (x, 바닥 y) 기준 · 원본이 아직 안 읽혔으면 이 프레임은 건너뛴다(v4.22 옛 도트 마스코트 대체 그림 삭제 · 카운트다운 3.2초 사이에 읽힌다) */
function jpBotDraw(ctx, x, gy, k, duck, lift) {
  var w = JP_BOT_W * k, h = (duck ? JP_BOT_DH : JP_BOT_H) * k, c = jpBotCv(w, h);
  if (c) ctx.drawImage(c, Math.round(x), Math.round(gy - h - (lift || 0)));
}
function jpStop() { JP.on = false; if (JP.raf) cancelAnimationFrame(JP.raf); JP.raf = 0; if (JP.onKeyUp) document.removeEventListener("keyup", JP.onKeyUp); JP.duck = false; JP.press = null; gsOverlayClose("jump"); }
function jpStart() {
  jpStop();
  jpBotLoad();
  SFX.site = false;
  JP = { on: true, paused: false, ending: null, raf: 0, cd: 3.2, t0: 0, last: performance.now(), py: JP_GY, vy: 0, jumps: 0, hearts: JP_HEARTS, inv: 0, heartHit: 0,
    obs: [], coins: [], items: [], parts: [], pops: [], banner: null, shake: 0, dist: 0, nextObs: 70, coinN: 0, dodged: 0, hits: 0, jumpsN: 0, score: 0, speedUp: 0,
    item: null, itemT: 0, nextItem: JP_ITEM_EVERY, surv: 0, nextK: null, seen: {}, tx: {},
    bg: jpBgLines(), bgI: 0, bgNext: JP_BG_FIRST, fact: null, facts: [], duck: false, press: null, bag: null, lastSp: "", tip: jpTipHtml(gsTutTake("jump")), say: null, tutSeen: {}, pz: 0 };
  JP.warm = GS.first === "jump" ? JP_WARM_SEC : 0; GS.first = "";   /* v5.41 첫 판만 연습 구간 · 표시는 한 번 쓰고 지운다(다시 하기 = 연습 없음) */
  /* v4.22 첫 안내(카운트다운 동안) · 다른 네 게임과 같은 gsTutTake · v4.00 에 시작 직후 조작 안내 상자를 걷고 장애물 직전 안내만 남긴 뒤,
     v4.08 에 첫 안내 훅을 팡·테트리스·기억력에만 달아서 점프는 첫 장애물이 올 때까지(카운트다운 뒤 약 2초) 아무 안내가 없었다(사용자 신고 260923)
     v4.28 (사용자 260924 「첫 안내가 상단에 나와서 잘 이해가 안 된다 · 장애물 안내와 같은 형태 · 같은 위치로」) 점프만 첫 안내를 장애물 안내 칸(jtHint · jpHintNow)에 띄운다 ·
     오버레이 위쪽 공용 안내(gsTip)는 점프에서 쓰지 않는다(중복 금지) · 매 판(v4.24 무제한 그대로) · 다른 네 게임의 카운트다운 안내는 그대로 */
  gsOverlayOpen({ key: "jump", title: "ME to WE 점프", cw: JP_W, ch: JP_H, canvasId: "jpCv", noGesture: true,
    bottom: '<div class="gs-foot">탭 = 점프 · 두 번 탭 = 2단 점프 · 꾸욱 = 엎드리기</div>',
    down: function (e) { e.preventDefault(); jpDown(); },
    up: function () { jpUp(); },
    keydown: function (e) {
      if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") { e.preventDefault(); if (!e.repeat) jpTap(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (!e.repeat && JP.jumps === 0) JP.duck = true; }   /* PC · 아래 화살표 = 엎드리기 */
    },
    running: function () { return JP.on && !JP.paused && !JP.ending; }, isPaused: function () { return !!JP.paused; },
    pause: function () { JP.duck = false; JP.press = null; gsPauseState(JP); }, resume: function () { gsResumeState(JP, jpFrame); },
    quit: function () { jpStop(); App.render(); }, resized: function (cv, w) { jpTxFit(cv, w); } });
  var foot = document.querySelector("#rgPlay .gs-foot");
  if (foot) { foot.addEventListener("pointerdown", function (e) { e.preventDefault(); jpDown(); }); ["pointerup", "pointercancel"].forEach(function (t) { foot.addEventListener(t, jpUp); }); }
  JP.onKeyUp = function (e) { if (e.key === "ArrowDown") JP.duck = false; };
  document.addEventListener("keyup", JP.onKeyUp);
  var mid = el("gsMid"), tx = document.createElement("div");
  tx.id = "jpTx";
  tx.innerHTML = '<span class="jt-l">ME to WE</span><span class="jt-s" id="jtScore">0</span><span class="jt-sv" id="jtSurv"></span>' +
    '<p class="jt-fact" id="jtFact" hidden></p>' +
    '<div class="gs-qsay jt-say" id="jtSay" aria-live="polite" hidden><p class="gs-qsay-tag">AX 상식</p><p class="gs-qsay-t" id="jtSayT"></p></div>' +   /* v4.28 맞힌 AI 상식 문장 · 위쪽 고정 자리(O/X 문제 말풍선과 같은 조각) */
    '<div class="jt-ban" id="jtBan" hidden></div>' +
    '<div class="jt-hint" id="jtHint" hidden></div>';
  mid.appendChild(tx);
  if (GS.vvh) GS.vvh();
  JP.raf = requestAnimationFrame(jpFrame);
}
function jpFrame() {
  if (!JP.on || JP.paused) return;
  var now = performance.now(), dt = Math.min(0.05, (now - JP.last) / 1000);
  JP.last = now;
  jpUpdate(dt, now);
  var cv = el("jpCv");
  if (!cv) { jpStop(); return; }
  jpDraw(cv.getContext("2d"), now);
  jpTxSync();
  if (JP.on && !JP.paused) JP.raf = requestAnimationFrame(jpFrame);
}
/* v3.94 글자 레이어를 캔버스 안쪽(테두리 2px 안)에 겹친다 · --u = 캔버스 1칸 */
function jpTxFit(cv, w) {
  var tx = el("jpTx"); if (!tx || !cv) return;
  tx.style.left = (cv.offsetLeft + 2) + "px"; tx.style.top = (cv.offsetTop + 2) + "px";
  tx.style.width = w + "px"; tx.style.height = Math.floor(w * JP_H / JP_W) + "px";
  tx.style.setProperty("--u", (w / JP_W).toFixed(4) + "px");
}
/* 매 프레임 · 바뀐 것만 DOM 에 쓴다 */
function jpTxSet(id, key, fn) { var e = el(id); if (!e) return null; if (JP.tx[id] !== key) { JP.tx[id] = key; fn(e); } return e; }
function jpTxSync() {
  var tx = el("jpTx"); if (!tx) return;
  jpTxSet("jtScore", JP.score, function (e) { e.textContent = JP.score; });
  var sv = (Math.round((JP.surv || 0) * 10) / 10).toFixed(1);
  jpTxSet("jtSurv", "", function (e) { e.innerHTML = ""; });   /* v4.02 버틴 시간은 점수가 아니라 HUD 에서 뺐다 (결과 화면 참고 줄에만) */
  /* v4.00 글자 블록 · 판 위치를 따라 움직이고, 먹으면 글자 하나하나가 흩어진다 */
  var f = JP.fact, u0 = tx.clientWidth / JP_W, fe = el("jtFact");
  if (fe) {
    if (!f) { if (!fe.hidden) { fe.hidden = true; fe.className = "jt-fact"; } JP.tx.jtFact = null; }
    else {
      if (JP.tx.jtFact !== f) {
        JP.tx.jtFact = f; fe.hidden = false; fe.className = "jt-fact";
        fe.style.width = (JP_FACT.w * u0).toFixed(1) + "px"; fe.style.height = (JP_FACT.h * u0).toFixed(1) + "px";
        fe.innerHTML = "<span>" + esc(f.text) + "</span>";   /* 한 덩어리로 감싸야 flex 안에서 글자 사이 띄어쓰기·줄바꿈이 산다 · v4.28 글자 흩어짐(--dx · --dy) 삭제 */
      }
      if (f.got && !fe.hidden) fe.hidden = true;   /* v4.28 맞히면 블록 글자는 흩어지지 않고 사라진다 · 문장은 위쪽 말풍선(jtSay)이 받는다 */
      fe.style.transform = "translate(" + (f.x * u0).toFixed(1) + "px," + ((JP_GY - JP_FACT.lo - JP_FACT.h) * u0).toFixed(1) + "px)";
    }
  }
  /* v4.28 (사용자 260924 「AI 상식이 너무 빨리 터져 버려서 외우기 힘들다」) 맞힌 문장 = 위쪽 고정 자리에 JP_SAY_SEC 초 또렷하게 · 게임은 멈추지 않는다 · 끝 0.3초에 옅어진다 */
  var sy = el("jtSay"), say = JP.say;
  if (sy) {
    jpTxSet("jtSay", say ? say.text : "off", function (e) {
      e.hidden = !say; if (!say) return;
      el("jtSayT").textContent = say.text;
      e.classList.remove("in", "out"); void e.offsetWidth; e.classList.add("in");
    });
    if (say) sy.classList.toggle("out", say.t < 0.3);
  }
  var sayB = say && sy && !sy.hidden ? sy.offsetTop + sy.offsetHeight + 8 : 0;   /* 말풍선이 떠 있는 동안 안내·배너는 그 아래로 비킨다(겹치지 않게) */
  /* v4.00 동작 안내 팝업 3종 · 같은 모양(주황 상자) · 필요한 첫 순간 직전에 · 안내마다 기기에서 처음 3번까지(jp_tut) */
  var hint = jpHintNow();
  jpTxSet("jtHint", hint || "off", function (e) { e.hidden = !hint; if (hint) e.innerHTML = gsSayHtml(hint); });   /* v4.08 챗봇 말풍선 */
  var hs = !!hint;
  var b = hs ? null : JP.banner;
  jpTxSet("jtBan", b ? b.text + (b.how || "") : "off", function (e) {
    e.hidden = !b; if (!b) return;
    e.className = "jt-ban" + (b.how ? " new" : "");
    e.innerHTML = b.how ? gsSayHtml(esc(b.text) + "<small>" + esc(b.how) + "</small>") : esc(b.text);   /* v4.08 새 장애물 예고 = 챗봇 말풍선 */
  });
  if (JP.tx.jtShift !== sayB) { JP.tx.jtShift = sayB; ["jtHint", "jtBan"].forEach(function (id) { var n = el(id); if (n) n.style.top = sayB ? Math.max(sayB, 48 * u0) + "px" : ""; }); }
  /* 팝 글자(하트 -1 · +30 · 부쉈다) · 생길 때 만들고 사라지면 지운다 */
  var u = tx.clientWidth / JP_W;
  JP.pops.forEach(function (p) {
    if (!p.el) { p.el = document.createElement("span"); p.el.className = "jt-pop"; p.el.textContent = p.text; p.el.style.color = p.c; tx.appendChild(p.el); }
    p.el.style.left = (Math.max(22, Math.min(JP_W - 22, p.x)) * u).toFixed(1) + "px"; p.el.style.top = (p.y * u).toFixed(1) + "px";
    p.el.style.opacity = Math.min(1, p.t / 0.25).toFixed(2);
  });
  Array.prototype.forEach.call(tx.querySelectorAll(".jt-pop"), function (n) { if (!JP.pops.some(function (p) { return p.el === n; })) n.remove(); });
}
function jpEl(now) { return JP.t0 ? (now - JP.t0) / 1000 : 0; }
/* v4.00 안내 팝업 · tap = 첫 장애물 · dbl = 첫 글자 블록 · duck = 첫 간판 · 대상이 몸 앞 1.6초 안일 때 · 대상을 지나면 끝
   기기에 안내별로 몇 번 봤는지 남겨 3번까지만(판마다 처음 한 번) · 네 번째 판부터는 시작 화면 설명과 예고 배너로 충분하다 */
var JP_TUT_MAX = 3, JP_TUT_TEXT = { tap: "탭하면 점프", dbl: "빠르게 두 번 탭하면<br>2단 점프", duck: "화면을 꾸욱 누르면<br>엎드릴 수 있어요" };
/* v4.28 첫 안내 = 장애물 안내와 같은 칸(jtHint) · 세 동작을 한 줄씩(「 · 」 자리에서 줄바꿈) · 카운트다운 동안 + 시작 뒤 첫 점프 전까지 JP_TIP_AFTER 초 · 매 판 */
var JP_TIP_AFTER = 2.0, JP_SAY_SEC = 2.6;
/* v5.41 (사용자 261003 「설명을 안 본 상태에서 하면 정신이 없다」) 이 사람의 첫 판만 카운트다운 뒤 연습 구간 · 챗봇이 달리고 점프만 해 볼 수 있다
   게임 시계(t0)는 연습이 끝나야 간다 · 점수 · 속도 · 장애물 등장표 · 완주 판정은 그대로 · 두 번째 판부터는 없다 */
var JP_WARM_SEC = 4, JP_WARM_HINT = "연습 · 장애물 없음<br>탭하면 점프<br>두 번 탭하면 2단 점프";
function jpTipHtml(line) { return String(line || "").split(" · ").map(esc).join("<br>"); }
function jpHintNow() {
  if (JP.ending) return "";
  if (JP.cd > 0) return JP.tip || "";
  if (JP.warm > 0) return JP_WARM_HINT;   /* v5.41 연습 구간 */
  var h = jpHintObs();
  return h || (JP.tip && (JP.surv || 0) < JP_TIP_AFTER && !JP.jumpsN ? JP.tip : "");
}
function jpHintObs() {
  var lead = jpSpeed(JP.surv || 0) * 1.6, front = JP_PX + 20, seen = S.get("jp_tut", {}) || {}, out = "";
  var cand = [
    ["tap", JP.obs.filter(function (o) { return o.k !== "sign"; })[0], function (o) { return o.x; }],
    ["dbl", JP.fact && !JP.fact.got ? JP.fact : null, function (o) { return o.x; }],
    ["duck", JP.obs.filter(function (o) { return o.k === "sign"; })[0], function (o) { return o.x; }]
  ];
  cand.forEach(function (c) {
    var k = c[0], o = c[1], st = JP.tutSeen[k];
    if (out || st === "done") return;
    if (!st && (seen[k] || 0) >= JP_TUT_MAX) { JP.tutSeen[k] = "done"; return; }
    if (!o) { if (st === "on") JP.tutSeen[k] = "done"; return; }
    var dx = c[2](o) - front;
    if (st === "on" && (dx + (o.w || JP_FACT.w) < -6 || o.got || o.hit || o.passed)) { JP.tutSeen[k] = "done"; return; }
    if (dx < lead) {
      if (!st) { JP.tutSeen[k] = "on"; seen[k] = (seen[k] || 0) + 1; S.set("jp_tut", seen); }
      out = JP_TUT_TEXT[k];
    }
  });
  return out;
}
/* 일반 배너 · 새 장애물 예고가 떠 있는 동안은 덮지 않는다 */
function jpBan(text, t) { if (JP.banner && JP.banner.how && JP.banner.t > 0.3) return; JP.banner = { text: text, t: t }; }
/* ═══ v3.98 입력 · 탭 = 점프 · 공중에서 한 번 더 = 2단 점프 · 꾸욱 = 엎드리기(누르는 동안)
   탭과 꾸욱을 가르는 방식 세 가지를 만들어 비교했다(JP_PRESS):
     "a" 땅에서 누르면 판정 시간(JP_HOLD_MS) 동안 기다린다 · 그 전에 떼면 점프(뗄 때) · 계속 누르면 엎드림 → 모든 점프가 누른 시간만큼 늦다
     "b" 누르면 바로 점프 · 간판이 가까울 때(JP_SIGN_WIN 초 안)만 "a" 처럼 판정
     "c" 누르면 바로 점프 · 간판이 가까울 때만 누르는 즉시 엎드림(판정 대기 없음) · 간판 앞에서 점프는 언제나 부딪히는 선택이라 뺏기는 것이 없다
   실측 비교(봇 · v3.98 보고)로 "c" 를 기본으로 한다 · 공중에서는 어느 방식이든 누르는 즉시 2단 점프. */
var JP_PRESS = "c", JP_HOLD_MS = 130, JP_SIGN_WIN = 1.8;
/* 가까운 간판 · 몸 앞에서 「다음」 장애물이 간판이고 JP_SIGN_WIN 초 안 · 앞에 넘을 장애물이 남아 있으면 그쪽이 먼저(점프)
   창 1.8초 = 첫 간판 안내(1.6초 전)보다 넓게 · 안내를 보고 미리 눌러도 점프가 나가지 않는다 */
function jpSignNear() {
  var sp = jpSpeed(jpEl(performance.now())), front = JP_PX + 20;
  var nx = JP.obs.filter(function (o) { return !o.hit && o.x + o.w > JP_PX + 6; }).sort(function (p, q) { return p.x - q.x; })[0];
  return !!nx && nx.k === "sign" && nx.x - front < sp * JP_SIGN_WIN;
}
function jpDown() {
  if (!JP.on || JP.paused || JP.ending || JP.cd > 0) return;
  var ground = JP.jumps === 0 && JP.py >= JP_GY;
  if (!ground) { jpTap(); return; }   /* 공중 · 2단 점프 */
  var near = jpSignNear();
  if (JP_PRESS === "c") {
    if (near) { JP.duck = true; JP.press = { t: performance.now(), duck: true }; }
    else { jpTap(); JP.press = { t: performance.now(), jumped: true }; }
    return;
  }
  if (JP_PRESS === "b" && !near) { jpTap(); JP.press = { t: performance.now(), jumped: true }; return; }
  JP.press = { t: performance.now(), wait: true };   /* 판정 대기 · jpUpdate 가 JP_HOLD_MS 뒤 엎드림으로 바꾼다 */
}
function jpUp() {
  var p = JP.press;
  JP.press = null; JP.duck = false;
  if (p && p.wait && JP.on && !JP.paused && !JP.ending) jpTap();   /* 판정 전에 뗐다 = 탭 = 점프 */
}
/* 매 프레임 · 판정 대기가 JP_HOLD_MS 를 넘으면 엎드림 */
function jpPressTick() {
  var p = JP.press;
  if (p && p.wait && performance.now() - p.t >= JP_HOLD_MS) { p.wait = false; p.duck = true; JP.duck = true; }
}
function jpTap() {
  if (!JP.on || JP.paused || JP.ending || JP.cd > 0) return;
  var jb = JP.item === "small" ? 1.22 : 1;   /* v3.75 작아지면 더 높이 */
  if (JP.jumps === 0 && JP.py >= JP_GY) { JP.vy = -JP_JV * jb; JP.jumps = 1; JP.jumpsN++; sfx("ppyong"); }
  else if (JP.jumps < 2) {
    JP.vy = -JP_JV2 * jb; JP.jumps = 2; JP.jumpsN++; sfx("ppyong2");
    gsBurst(JP, JP_PX + 14, JP.py, 5, [RAIN_PAL.w, RAIN_PAL.o50]);
  }
}
/* v3.75 속도 램프 · 55에서 시작해 부드럽게 오르고 200에서 멈춘다 (평균 40~70초 · 잘하면 2분대) */
/* v5.60 후반 난이도 안2(사용자 261004) · 상한 200 → 230(약 87초에 닿는다) · 그 뒤로 평탄 구간이 짧아진다 */
/* v6.11 (사용자 261007 「난이도를 올려 줘」) 처음 30초는 그대로(처음 하는 사람) · 30초부터 기울기 JP_HARD.k 배 · JP_HARD.top 에 닿은 뒤에도 초당 JP_HARD.creep 씩 계속 올라 JP_HARD.max 에서 멈춘다
   (예전 = 87초에 230 에서 평탄 · 시간 제한 없음이라 끝없이 버티는 판을 막으려고 끝까지 오른다) */
var JP_HARD = { at: 30, k: 2.2, top: 320, creep: 0.5, max: 380, pNew: 0.6, gapAt: 30, gapTo: 55, gapMin: 0.5, gk: 6 };
function jpSpeed(t) {
  var H = JP_HARD, a = 55 + Math.min(t, H.at) * 1.55 * JP_RAMP;
  if (t <= H.at) return a;
  var b = a + (t - H.at) * 1.55 * JP_RAMP * H.k;
  if (b <= H.top) return b;
  var tTop = H.at + (H.top - a) / (1.55 * JP_RAMP * H.k);
  return Math.min(H.max, H.top + (t - tTop) * H.creep);
}
/* v6.11 간격 거리 하한(픽셀) · 30초까지 175 → 130 그대로 · 30초부터 줄어드는 기울기 JP_HARD.gk 배 · 78 아래로는 안 간다 */
function jpGapPx(t) { var H = JP_HARD, r = 1.15 * JP_RAMP; return Math.max(78, t <= H.at ? 175 - t * r : 175 - H.at * r - (t - H.at) * r * H.gk); }
/* v6.11 일반 장애물 최소 간격(초) · 30초까지 JP_GAP_SEC 0.65 그대로 → 55초에 0.5 · 사람은 이 간격에서 주로 부딪힌다(봇 실측) · 물리 한계(약 0.25초)보다 넉넉히 크다 */
function jpGapSec(t) { var H = JP_HARD; return t <= H.gapAt ? JP_GAP_SEC : Math.max(H.gapMin, JP_GAP_SEC - (t - H.gapAt) * (JP_GAP_SEC - H.gapMin) / (H.gapTo - H.gapAt)); }
/* v6.11 새 유형(간판 · 구멍 · 오르내리는 상자) 비율 · 45초에 45% · 60초부터 초당 0.6%p 더 올라 85초에 60% */
function jpNewP(t) { var p = Math.min(JP_NEW_P, 0.3 + (t - JP_NEW[0].at) * 0.006); return t < 60 ? p : Math.min(JP_HARD.pNew, p + (t - 60) * 0.006); }
/* v5.60 새 유형 앞뒤 착지 보장 · 60초까지 1.3초 → 100초에 1.0초로 점차 줄어든다 */
function jpLandSec(t) { return t < 60 ? 1.3 : Math.max(1.0, 1.3 - (t - 60) * 0.0075); }
/* v3.75 몸 크기 = 아이템 상태 그대로 (그린 크기와 판정이 같아야 한다) */
function jpScale() { return JP.item === "big" ? 1.5 : JP.item === "small" ? 0.7 : 1; }
function jpBody() {
  var k = jpScale();
  /* v4.08 챗봇 러너 · 그림 가운데(JP_PX+14)에 판정 상자를 맞췄다 · 크기는 v3.98 값 그대로(서기 12×18 머리 20 · 엎드리기 14×10 머리 12 · 간판 밑 16 · 1단 점프 머리 최고 75 < 글자 블록 80)
     가로 14 로 넓힌 안을 봇 150판 × 3단계로 비교하니 중간 실력 만점 도달이 55→44판으로 줄어 점수 체계 v2 계수가 흔들려 넓히지 않았다 */
  if (jpDucking()) return { x: JP_PX + 7 + (1 - k) * 3, y: JP.py - 12 * k, w: 14 * k, h: 10 * k };   /* v3.98 엎드림 · 머리 높이 12 (간판 밑 16) */
  return { x: JP_PX + 8 + (1 - k) * 3, y: JP.py - 20 * k, w: 12 * k, h: 18 * k };
}
/* 엎드림은 땅에 있을 때만 · 공중에서 누르면 2단 점프뿐(빠른 낙하 같은 부가 동작 없음) */
function jpDucking() { return !!JP.duck && JP.py >= JP_GY && JP.jumps === 0; }
function jpOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
/* 부딪힘 · 무적 중이면 무시 · 1초 무적 */
function jpHit(o) {
  if (JP.inv > 0 || JP.ending) return false;
  if (JP.item === "big") {   /* v3.75 커진 동안은 부수고 지나간다 · 하트 안 깎임 */
    o.hit = true; o.smash = 1;
    gsBurst(JP, o.x + 8, JP_GY - 8, 8, [RAIN_PAL.deep, RAIN_PAL.o100, RAIN_PAL.w]);
    JP.pops.push({ x: o.x + 8, y: JP_GY - 30, text: "부쉈다", t: 0.7, c: RAIN_PAL.o100 });
    sfx("kwang");
    return false;
  }
  o.hit = true;
  JP.hearts--; JP.hits++; JP.inv = JP_INV; JP.heartHit = 0.5; JP.shake = rgReduced() ? 0 : 0.25;
  JP.pops.push({ x: JP_PX + 14, y: JP.py - 30, text: "하트 -1", t: 0.9, c: RAIN_PAL.deep });
  sfx("puck");   /* 무적 중에는 jpHit 이 먼저 돌아가 소리도 없다 */
  if (JP.hearts === 1) jpBan("마지막 하트", 1.0);
  if (JP.hearts <= 0) jpEnd("lives");
  return true;
}
function jpUpdate(dt, now) {
  if (JP.ending) {
    JP.ending.t -= dt; gsFx(JP, dt);
    if (JP.ending.t <= 0) jpEndFinal(JP.ending.why);
    return;
  }
  if (JP.cd > 0) {
    var before = Math.ceil(JP.cd); JP.cd -= dt;
    if (Math.ceil(JP.cd) !== before && JP.cd > 0) sfx("tick");
    if (JP.cd <= 0) { if (!(JP.warm > 0)) JP.t0 = now; sfx("go"); }
    return;
  }
  if (JP.warm > 0) {   /* v5.41 연습 구간 · 달리기 · 점프만 · 끝나면 시계 시작 */
    JP.warm -= dt;
    jpPressTick(); gsFx(JP, dt);
    JP.dist += jpSpeed(0) * dt;
    JP.vy += JP_G * dt; JP.py += JP.vy * dt;
    if (JP.py >= JP_GY) { JP.py = JP_GY; JP.vy = 0; JP.jumps = 0; }
    if (JP.warm <= 0) { JP.warm = 0; JP.t0 = now; jpBan("연습 끝", 1.2); sfx("level"); }
    return;
  }
  var t = jpEl(now);
  JP.surv = t;
  if (JP.say) { JP.say.t -= dt; if (JP.say.t <= 0) JP.say = null; }   /* v4.28 AI 상식 말풍선 · 게임 시간으로 센다(멈추면 같이 멈춘다) */
  jpPressTick();
  gsFx(JP, dt);
  if (JP.inv > 0) JP.inv = Math.max(0, JP.inv - dt);
  if (JP.heartHit > 0) JP.heartHit -= dt;
  /* 아이템 · 한 번에 하나 · 5초 */
  if (JP.item) { JP.itemT -= dt; if (JP.itemT <= 0) { JP.item = null; jpBan("원래 크기", 0.8); } }
  JP.nextItem -= dt;
  if (JP.nextItem <= 0 && !JP.item) {
    JP.nextItem = JP_ITEM_EVERY;
    var kind = Math.random() < 0.5 ? "big" : "small";
    JP.items.push({ k: kind, x: JP_W + 6, y: JP_GY - 34 - Math.random() * 18, got: false });
  }
  var tr = t * JP_RAMP, su = tr >= 100 ? 6 : tr >= 80 ? 5 : tr >= 60 ? 4 : tr >= 40 ? 3 : tr >= 25 ? 2 : tr >= 10 ? 1 : 0;   /* v3.98 속도 UP 시점도 1.3배 앞당김 · v5.60 5 · 6번째(약 62 · 77초) 추가 */
  if (su > JP.speedUp) { JP.speedUp = su; jpBan("속도 UP", 1.0); sfx("level"); }
  var dx = jpSpeed(t) * dt;
  JP.dist += dx;
  jpFactTick(t, dx);   /* v4.00 AI 상식 글자 블록 */
  JP.vy += JP_G * dt; JP.py += JP.vy * dt;
  if (JP.py >= JP_GY) { JP.py = JP_GY; JP.vy = 0; JP.jumps = 0; }
  JP.nextObs -= dx;
  if (JP.nextObs <= 0) {
    var kinds = t < 10 ? ["box", "cone"] : ["box", "cone", "step"], k = JP.nextK || kinds[Math.floor(Math.random() * kinds.length)];
    JP.nextK = null;
    JP.obs.push({ k: k, x: JP_W + 4, w: JP_OBS[k].w, passed: false, hit: false, ph: Math.random() * Math.PI * 2 });
    /* v3.75 간격이 계속 좁아진다(부드럽게) · 하한 78 */
    var gMin = Math.max(jpGapPx(t), jpSpeed(t) * jpGapSec(t)), gMax = gMin + Math.max(34, 70 - t * 0.4 * JP_RAMP);
    JP.nextObs = gMin + Math.random() * (gMax - gMin);
    /* v3.94 다음 장애물을 지금 정한다 · 새 유형이 앞뒤에 오면 착지할 거리(속도 × 1.3초)를 보장 · 처음 나오는 유형은 거리를 더 두고 예고 배너 */
    var sp0 = jpSpeed(t), open = JP_NEW.filter(function (n) { return t >= n.at; });
    var first = open.filter(function (n) { return !JP.seen[n.k]; })[0];
    var isNew = !!JP_NEW.filter(function (n) { return n.k === k; })[0];
    var pNew = open.length ? jpNewP(t) : 0;
    var nx = first || (!isNew && Math.random() < pNew ? jpBagNext(open) : null);
    if (nx) {
      JP.nextK = nx.k;
      JP.nextObs = Math.max(JP.nextObs, sp0 * (first ? (nx.k === "sign" ? 3.2 : 2.2) : jpLandSec(t)));   /* v3.98 간판 첫 등장은 3.2초 앞에서 안내 */
      if (first) { JP.seen[nx.k] = 1; JP.banner = { text: "새 장애물 · " + nx.tip, how: nx.how, t: nx.k === "sign" ? 3.4 : 2.6 }; sfx("level"); }
    }
    if (isNew) JP.nextObs = Math.max(JP.nextObs, sp0 * jpLandSec(t));
    if (!isNew && Math.random() < 0.75) {
      var cx0 = JP_W + 4 + JP_OBS[k].w + 28 + Math.random() * 12;
      /* 2단 점프로만 닿는 높은 코인 아치(3~5개, 2배) 또는 낮은 코인 3개 */
      if (Math.random() < 0.45) {
        var nHi = 3 + Math.floor(Math.random() * 3);
        for (var hi = 0; hi < nHi; hi++) {
          var arc = Math.sin((hi + 1) / (nHi + 1) * Math.PI);
          JP.coins.push({ x: cx0 + hi * 13, y: JP_GY - 74 - arc * 16, got: false, hi: 1 });
        }
      } else {
        var hg = 10 + Math.random() * 30;
        for (var i = 0; i < 3; i++) JP.coins.push({ x: cx0 + i * 14, y: JP_GY - hg - (i === 1 ? 8 : 0) - 8, got: false });
      }
    }
  }
  var body = jpBody();
  JP.obs.forEach(function (o) {
    o.x -= dx;
    if (o.k === "bob") o.ph += dt * Math.PI * 2 / JP_BOB_PER;
    JP_OBS[o.k].rects.forEach(function (rc) {
      var lift = o.k === "bob" ? jpBobLift(o) : rc[3] || 0;
      if (!o.hit && jpOverlap(body, { x: o.x + rc[0], y: JP_GY - lift - rc[2], w: rc[1], h: rc[2] })) jpHit(o);
    });
    /* 끊긴 바닥 · 땅에 닿은 채로 구멍 위(가장자리 4칸 여유)를 지나면 부딪힘 · 떨어지지는 않고 하트만 깎인다 */
    if (o.k === "gap" && !o.hit && JP.py >= JP_GY - 0.5 && body.x + body.w - 4 > o.x && body.x + 4 < o.x + o.w) jpHit(o);
    /* v3.94 2단 점프 +20 폐지(사용자 260918 「주는 이유를 모르겠다」) · 넘은 개수만 센다 */
    if (!o.passed && o.x + o.w < body.x) { o.passed = true; if (!o.hit) { JP.dodged++; JP.pops.push({ x: JP_PX + 10, y: JP_GY - 44, text: "+" + olyRule().jump.obs, t: 0.55, c: RAIN_PAL.ink }); } }
  });
  JP.obs = JP.obs.filter(function (o) { return o.x + o.w > -8 && !o.smash; });
  JP.coins.forEach(function (c) {
    c.x -= dx;
    if (!c.got && jpOverlap(body, { x: c.x, y: c.y, w: 10, h: 8 })) {
      c.got = true; JP.coinN += c.hi ? 2 : 1;
      JP.pops.push({ x: c.x + 5, y: c.y - 4, text: "+" + olyRule().jump.coin * (c.hi ? 2 : 1), t: 0.6, c: RAIN_PAL.o100 });
      gsBurst(JP, c.x + 5, c.y + 4, 4, [RAIN_PAL.o100, RAIN_PAL.w]);
      sfx("ting");
    }
  });
  JP.coins = JP.coins.filter(function (c) { return !c.got && c.x > -12; });
  /* v3.75 아이템 · 커지기(무적 · 장애물을 부순다) · 작아지기(높이 점프) */
  JP.items.forEach(function (it) {
    it.x -= dx;
    if (!it.got && jpOverlap(body, { x: it.x, y: it.y, w: 12, h: 12 })) {
      it.got = true; JP.item = it.k; JP.itemT = JP_ITEM_SEC;
      jpBan(it.k === "big" ? "커졌다 · 부수고 지나가요" : "작아졌다 · 더 높이 점프", 1.2);
      gsBurst(JP, it.x + 6, it.y + 6, 6, [RAIN_PAL.o100, RAIN_PAL.w]);
      sfx("ting");
    }
  });
  JP.items = JP.items.filter(function (it) { return !it.got && it.x > -14; });
  JP.score = olyScore("jump", jpParts());   /* v4.02 넘은 장애물 × 40 + 코인 × 5 + AI 상식 × 100 · 버틴 시간은 점수 아님 */
  if (JP.score >= olyCap() && !JP.ending) jpEnd("full");   /* 만점 3,000 · 결승 */
}
function jpEnd(why) {
  if (!JP.on || JP.ending) return;
  JP.ending = { t: 1.2, why: why }; JP.banner = null;
  sfx(why === "full" ? "fanfare" : "over");   /* v6.11 시간 끝(time) 없음 */
}
/* v4.02 제출 구성 요소 · obs 넘은 장애물 · coin 코인 단위(높은 코인 2) · fact AI 상식 · hits 부딪힘 · surv 버틴 1/100초(참고) · pz 직접 멈춘 횟수 */
function jpParts() { return { obs: JP.dodged, coin: JP.coinN, fact: JP.facts.length, hits: JP.hits, surv: Math.round((JP.surv || 0) * 100), pz: JP.pz || 0 }; }
function jpEndFinal(why) {
  if (!JP.on) return;
  JP.ending = null;
  jpStop();
  var parts = jpParts(), prev = Number(S.get("oly2_best_jump", 0)) || 0;
  gameClear("jump_cleared");
  var root = el("jpRoot"); if (!root) return;
  var sc = olySubmit("jump", parts);
  if (sc > prev) setTimeout(function () { sfx("best"); }, 250);
  var facts = JP.facts.slice();
  /* v4.00 AI 상식 획득 목록 · v4.02 1개 = 점수 +100 */
  var fh = '<section class="ax-card ax-stack-tight jp-facts"><h2 class="ax-card-title">AX 상식 ' + facts.length + "개 획득</h2>" +   /* v4.28 「1개 = 점수 +100」은 결과 접힘(점수 구성 · 점수 규칙)으로 */
    (facts.length ? '<ul class="gs-list">' + facts.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"
      : '<p class="ax-description">공중의 글자 블록을 2단 점프로 들이받으면 모을 수 있어요</p>') + "</section>";
  root.innerHTML = gsResultHtml("jump", { why: why === "full" ? "done" : "over", label: why === "full" ? "만점" : "결과", title: why === "full" ? "만점" : "GAME OVER", reason: "",
    oly: { key: "jump", parts: parts, score: sc, ref: [["버틴 시간", ttSecTxt(parts.surv / 100)], ["부딪힘", JP.hits + "번"]] }, banner: fh });   /* v6.11 시간 제한 없음 · 1분부터 「1분 05.2초」(테트리스와 같은 ttSecTxt) */
  window.scrollTo(0, 0);
}
/* v4.00 새 유형 섞기 · 열린 유형을 가방에 한 번씩 넣고 하나씩 꺼낸다 · 비면 다시 채운다 · 바로 전과 같은 유형은 뒤로 미룬다
   (구 v3.98 원인: 새 유형 첫 소개가 늘 우선이고 비율이 16%에서 시작해 균등 추첨이라 30초 뒤 간판이 10초에 0.4~0.7번으로 줄었다) */
function jpBagNext(open) {
  if (!JP.bag || !JP.bag.length) JP.bag = shuf(open.slice());
  var n = JP.bag.pop();
  if (n.k === JP.lastSp && JP.bag.length) { var m = JP.bag.pop(); JP.bag.push(n); n = m; }
  JP.lastSp = n.k;
  return n;
}
/* v4.00 글자 블록 · 생성 조건: 새 유형 대기 없음 + 앞 장애물이 1초 이상 앞 · 생성하면 다음 장애물을 블록 뒤 1.1초로 미룬다 */
function jpFactTick(t, dx) {
  var sp = jpSpeed(t), f = JP.fact;
  if (!f && t >= JP.bgNext && JP.bg.length && !JP.nextK) {
    var last = JP.obs[JP.obs.length - 1];
    if (!last || last.x + last.w < JP_W + 4 - sp * 1.0) {
      JP.fact = f = { text: JP.bg[JP.bgI % JP.bg.length], x: JP_W + 4, got: false, gone: 0 };
      JP.bgI++; JP.bgNext = t + JP_BG_EVERY;
      JP.nextObs = Math.max(JP.nextObs, JP_FACT.w + sp * 1.1);
      JP.tx.jtFact = null;
    }
  }
  if (!f) return;
  f.x -= dx;
  if (f.got) { f.gone += dx / sp; if (f.gone > 0.6) JP.fact = null; return; }
  var b = jpBody(), top = JP_GY - JP_FACT.lo - JP_FACT.h;
  if (jpOverlap(b, { x: f.x, y: top, w: JP_FACT.w, h: JP_FACT.h })) {
    f.got = true; JP.facts.push(f.text); JP.say = { text: f.text, t: JP_SAY_SEC };
    JP.pops.push({ x: JP_PX + 16, y: top - 6, text: "+" + olyRule().jump.fact + " AX 상식", t: 1.0, c: RAIN_PAL.o100 });
    for (var i = 0; i < 44; i++) {   /* 글자가 흩어지는 도트 · 블록 전체에서 사방으로 */
      var px = f.x + 6 + Math.random() * (JP_FACT.w - 12), py = top + 4 + Math.random() * (JP_FACT.h - 8), a = Math.random() * Math.PI * 2, v = 25 + Math.random() * 55;
      JP.parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, t: 0.45 + Math.random() * 0.4, c: [RAIN_PAL.ink, RAIN_PAL.o100, RAIN_PAL.o60, "#5E5750"][i % 4] });
    }
    sfx("ting");
  }
  if (f.x + JP_FACT.w < -8) JP.fact = null;
}
/* 글자 블록 그리기(캔버스 판) · 글자는 DOM(.jt-fact) */
function jpFactDraw(ctx) {
  var f = JP.fact; if (!f || f.got) return;
  var x = Math.round(f.x), y = JP_GY - JP_FACT.lo - JP_FACT.h;
  rgBox(ctx, x, y, JP_FACT.w, JP_FACT.h, "#FFF6F0");
  ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(x + 1, y + 1, JP_FACT.w - 2, 2);
  ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(x + 4, JP_GY - 1, JP_FACT.w - 8, 2);   /* 공중에 떠 있다 · 옅은 그림자 */
}
/* 오르내리는 상자의 뜬 높이 · 0 ~ JP_BOB_AMP */
function jpBobLift(o) { return Math.round(JP_BOB_AMP * (1 - Math.cos(o.ph || 0)) / 2); }
function jpObsDraw(ctx, o) {
  if (o.k === "sign" || o.k === "gap" || o.k === "bob") { jpObsDraw2(ctx, o); return; }
  var x = Math.round(o.x), g = JP_GY;
  var wsh = o.k === "step" ? 24 : o.k === "cone" ? 16 : 18;
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(x - 1, g - 1, wsh, 2);   /* v3.72 바닥 그림자 · 지면 위 물체로 읽히게 */
  if (o.k === "box") {
    rgBox(ctx, x, g - 16, 16, 16, RAIN_PAL.deep);   /* v3.72 러너 몸통(주황)과 구분되게 한 단 진하게 */
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x + 1, g - 9, 14, 1);
    for (var i = 0; i < 12; i++) { ctx.fillRect(x + 2 + i, g - 14 + Math.floor(i / 2), 1, 1); }
    ctx.fillStyle = RAIN_PAL.o30; ctx.fillRect(x + 2, g - 14, 4, 2);
  } else if (o.k === "cone") {
    for (var r = 0; r < 15; r++) {
      var w = 2 + Math.floor(r * 8 / 14), cx = x + 7 - Math.floor(w / 2);
      ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(cx - 1, g - 17 + r, w + 2, 1);
      ctx.fillStyle = r >= 6 && r <= 8 ? RAIN_PAL.w : RAIN_PAL.o100; ctx.fillRect(cx, g - 17 + r, w, 1);
    }
    rgBox(ctx, x, g - 3, 14, 3, RAIN_PAL.deep);
  } else {
    rgBox(ctx, x, g - 8, 12, 8, RAIN_PAL.deep);
    rgBox(ctx, x + 11, g - 15, 11, 15, RAIN_PAL.deep);
    ctx.fillStyle = RAIN_PAL.o60; ctx.fillRect(x + 1, g - 7, 10, 2); ctx.fillRect(x + 12, g - 14, 9, 2);
  }
}
/* v3.94 새 유형 그리기 · 기존 장애물 문법(진한 채움 + 검정 외곽 + 바닥 그림자) 그대로 */
function jpObsDraw2(ctx, o) {
  var x = Math.round(o.x), g = JP_GY, i;
  if (o.k === "sign") {   /* 천장에서 늘어진 간판 · 밑면이 머리 위 4칸 */
    var top = g - 16 - 94;
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x + 7, 30, 1, top - 30); ctx.fillRect(x + 23, 30, 1, top - 30);
    rgBox(ctx, x + 2, top, 26, 94, RAIN_PAL.deep);
    ctx.fillStyle = RAIN_PAL.o60; ctx.fillRect(x + 3, top + 1, 24, 2);
    for (i = 0; i < 5; i++) { ctx.fillStyle = RAIN_PAL.w; ctx.fillRect(x + 5, top + 12 + i * 17, 20, 3); }
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x + 3, g - 17, 24, 1);
    ctx.fillStyle = "rgba(0,0,0,0.10)"; ctx.fillRect(x + 1, g - 1, 28, 2);   /* 바닥 그림자는 옅게 · 공중에 떠 있다 */
  } else if (o.k === "gap") {   /* 끊긴 바닥 · 땅과 흙을 지우고 검은 구멍 */
    ctx.fillStyle = "#1B120D"; ctx.fillRect(x, g, o.w, JP_H - g);
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x - 1, g, 1, JP_H - g); ctx.fillRect(x + o.w, g, 1, JP_H - g);
    ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(x - 3, g - 1, 3, 2); ctx.fillRect(x + o.w + 1, g - 1, 3, 2);
  } else {   /* 오르내리는 상자 · 위아래 화살표 · 바닥 그림자는 높이에 따라 옅어진다 */
    var lf = jpBobLift(o), by = g - lf - 14;
    ctx.fillStyle = "rgba(0,0,0," + (0.2 - lf / JP_BOB_AMP * 0.12).toFixed(3) + ")"; ctx.fillRect(x, g - 1, 14, 2);
    ctx.fillStyle = "#E8DED6"; ctx.fillRect(x + 6, g - JP_BOB_AMP - 14, 2, JP_BOB_AMP + 13);   /* 오르내리는 길 · 옅은 레일 */
    rgBox(ctx, x, by, 14, 14, RAIN_PAL.deep);
    ctx.fillStyle = RAIN_PAL.w;
    ctx.fillRect(x + 6, by + 3, 2, 1); ctx.fillRect(x + 5, by + 4, 4, 1);
    ctx.fillRect(x + 5, by + 9, 4, 1); ctx.fillRect(x + 6, by + 10, 2, 1);
  }
}
/* v3.72 (사용자 피드백 260918 「배경이 장애물과 비슷하다」)
   배경 = 아주 옅은 무채색·O5 한 톤 · 장애물 실루엣을 닮은 형태(검은 나무 상자 등)를 두지 않는다.
   장애물 = 진한 채움 + 검정 외곽선 + 바닥 그림자 → 지면 위의 물체로 읽힌다. */
function jpWorld(ctx, dist) {
  var off = Math.floor(dist * 0.3) % 20;
  for (var ty = 0; ty < JP_GY; ty += 10) for (var tx = -20; tx < JP_W + 20; tx += 10) {
    ctx.fillStyle = ((tx + ty) / 10) % 2 ? "#FBF8F6" : "#FFFFFF"; ctx.fillRect(tx - off, ty, 10, 10);
  }
  var toff = Math.floor(dist * 0.35) % 90;
  for (var k = 0; k < 4; k++) {   /* 배경 표식 = 옅은 점선 기둥 (장애물과 닮지 않은 형태) */
    var tx2 = 16 + k * 90 - toff;
    ctx.fillStyle = "#F1ECE8";
    for (var yy = JP_GY - 34; yy < JP_GY - 4; yy += 6) ctx.fillRect(tx2, yy, 2, 3);
  }
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(0, JP_GY, JP_W, 1);
  ctx.fillStyle = JP_BRICK.top; ctx.fillRect(0, JP_GY + 1, JP_W, 1);   /* 윗면 밝은 테 한 줄 */
  /* v6.01 바닥 = 붉은 벽돌(사용자 261007) · 무늬 한 장을 반복 · 땅과 같은 속도(정수 칸)로 흐른다 */
  var boff = Math.floor(dist) % JP_BRICK.w;
  ctx.save(); ctx.translate(-boff, JP_GY + 2);
  ctx.fillStyle = jpBrickPat(ctx); ctx.fillRect(0, 0, JP_W + JP_BRICK.w, JP_H - JP_GY - 2);
  ctx.restore();
}
/* v6.01 (사용자 261007 「바닥을 붉은 벽돌로 · 성처럼 네모난 벽돌」) 벽돌 무늬 · 한 장 = 16 × 8칸(줄눈 포함 · 가로 2 : 세로 1) · 줄마다 반 장 엇갈림
   벽돌 면 · 위와 왼쪽 밝은 칸 · 아래 어두운 칸 · 어두운 줄눈 · 무늬 16 × 16 한 장을 오프스크린 캔버스에 한 번 그리고 createPattern 으로 깐다
   색 = 오렌지 사다리 끝의 붉은 주황 · 웜브라운 줄눈(design.md 5-16 레트로 판 안 색 · 파랑 없음) · 판정 · 규칙과 상관없는 그림 */
var JP_BRICK = { w: 16, h: 8, face: "#C2541E", hi: "#D96A2E", lo: "#A4441A", joint: "#4A2210", top: "#FFA46E" }, JP_BRICKCV = null;
function jpBrickCv() {
  if (JP_BRICKCV) return JP_BRICKCV;
  var B = JP_BRICK, c = document.createElement("canvas"); c.width = B.w; c.height = B.h * 2;
  var g = c.getContext("2d");
  g.fillStyle = B.joint; g.fillRect(0, 0, B.w, B.h * 2);
  [[0, 0, B.w - 1], [B.h, B.w / 2, B.w - 1]].forEach(function (r) {   /* [위 y, 벽돌 왼쪽 x, 면 폭] · 아랫줄은 반 장 밀려 무늬 가장자리에서 이어진다 */
    for (var s = -B.w; s <= 0; s += B.w) {
      var x = r[1] + s, y = r[0];
      g.fillStyle = B.face; g.fillRect(x, y, r[2], B.h - 1);
      g.fillStyle = B.lo; g.fillRect(x + 1, y + B.h - 2, r[2] - 1, 1);
      g.fillStyle = B.hi; g.fillRect(x, y, r[2], 1); g.fillRect(x, y, 1, B.h - 1);
    }
  });
  return (JP_BRICKCV = c);
}
function jpBrickPat(ctx) { return ctx._jpBrick || (ctx._jpBrick = ctx.createPattern(jpBrickCv(), "repeat")); }
function jpCoinCv() {
  if (JP_COINCV) return JP_COINCV;
  var c = document.createElement("canvas"); c.width = 10; c.height = 8;
  rgSprite(c.getContext("2d"), JP_COIN, 0, 0, { K: RAIN_PAL.ink, W: RAIN_PAL.w, O: RAIN_PAL.o100 });
  return (JP_COINCV = c);
}
function jpDraw(ctx, now) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (JP.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
  jpWorld(ctx, JP.dist);

  jpFactDraw(ctx);
  JP.coins.forEach(function (c) { ctx.drawImage(jpCoinCv(), Math.round(c.x), Math.round(c.y + (Math.floor(now / 200 + c.x) % 2))); });
  JP.items.forEach(function (it) { jpItemDraw(ctx, it, now); });
  JP.obs.forEach(function (o) { jpObsDraw(ctx, o); });
  /* v4.08 챗봇 · 무적 중 깜빡임 · 땅에서 달릴 때 몸 전체가 1칸 튄다 · 엎드리면 세로로 눌린다 · 아이템으로 커지거나 작아진다(판정도 같이) */
  var blink = JP.inv > 0 && Math.floor(now / 90) % 2 === 0;
  if (!blink) {
    var air = JP.py < JP_GY, step = !air && Math.floor(now / 140) % 2, k = jpScale();
    jpBotDraw(ctx, JP_PX + 14 - JP_BOT_W * k / 2, JP.py, k, jpDucking(), step ? 1 : 0);
  }
  var frac = JP.item ? Math.max(0, JP.itemT / JP_ITEM_SEC) : 0;   /* v3.75 막대 = 아이템 남은 시간 */
  gsHud(ctx, JP_W, "", "", frac);   /* v3.94 글자(라벨·점수·생존 시간·안내·로드맵·배너·팝)는 DOM 글자 레이어 jpTxSync 가 그린다 */
  var blinkLast = JP.hearts === 1 && Math.floor(now / 250) % 2 === 0;
  for (var h = 0; h < JP_HEARTS; h++) {
    var on = h < JP.hearts, justLost = h === JP.hearts && JP.heartHit > 0;
    var jy = justLost && !rgReduced() ? Math.round((Math.random() - 0.5) * 3) : 0;
    gsHeart(ctx, 74 + h * 11, 7, on ? (blinkLast ? "blink" : "on") : justLost ? "hit" : "off", jy);
  }
  JP.parts.forEach(function (p) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); });
  gsEndDraw(ctx, JP.ending, JP_W, 30, JP_GY, olyFmt(JP.score) + "점");
  gsCountDraw(ctx, JP.cd, JP_W, 100, JP_GY);   /* v4.28 숫자를 아래로 · 위쪽은 첫 안내(jtHint · 장애물 안내 자리)가 쓴다 */
  ctx.restore();
}

/* v3.75 아이템 · 커지기(위 화살표) · 작아지기(아래 화살표) · 코인과 헷갈리지 않게 사각 배지 */
function jpItemDraw(ctx, it, now) {
  var x = Math.round(it.x), y = Math.round(it.y + (Math.floor(now / 220) % 2));
  rgBox(ctx, x, y, 12, 12, it.k === "big" ? RAIN_PAL.o100 : RAIN_PAL.w);
  ctx.strokeStyle = RAIN_PAL.ink; ctx.lineWidth = 1.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (it.k === "big") { ctx.moveTo(x + 6, y + 9); ctx.lineTo(x + 6, y + 3); ctx.moveTo(x + 3, y + 6); ctx.lineTo(x + 6, y + 3); ctx.lineTo(x + 9, y + 6); }
  else { ctx.moveTo(x + 6, y + 3); ctx.lineTo(x + 6, y + 9); ctx.moveTo(x + 3, y + 6); ctx.lineTo(x + 6, y + 9); ctx.lineTo(x + 9, y + 6); }
  ctx.stroke();
}
/* v4.11 시작 화면 미리보기 · 실제 그리기(jpWorld · jpObsDraw · jpBotDraw · 코인) · 상자는 점프로 · 간판은 엎드려서 · 코인 두 개 · 거리 300 마다 반복 */
function jpPreview(t) {
  var cv = el("jpPrev"); if (!cv) return;
  if (t == null) t = 1.77;
  var ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
  jpBotLoad();
  var L = 300, dist = t * 64, d = dist % L, fx = JP_PX + JP_BOT_W, lift = 0, duck = false;
  var at = function (wx) { var x = wx - d; return x < -60 ? x + L : x; };
  ctx.save(); ctx.translate(0, cv.height - 24 - JP_GY);
  jpWorld(ctx, dist);
  var bx = at(150), sx = at(280);
  jpObsDraw(ctx, { k: "box", x: bx });
  jpObsDraw(ctx, { k: "sign", x: sx });
  [196, 210].forEach(function (wx) { var x = at(wx); if (x > fx - 2) ctx.drawImage(jpCoinCv(), Math.round(x), JP_GY - 18); });
  var p = (fx + 12 - bx) / 54; if (p > 0 && p < 1) lift = 4 * 38 * p * (1 - p);
  if (sx < fx + 10 && sx + 30 > JP_PX - 4) duck = true;
  jpBotDraw(ctx, JP_PX, JP_GY, 1, duck, lift);
  ctx.restore();
}

