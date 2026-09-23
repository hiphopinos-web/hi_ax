/* ══════════════════════════════════════════════════════════════════════════
   AX 단어 소나기 · 공용 엔진 (v4.20 · 260923)
   두 화면이 이 파일 하나를 같이 쓴다. 규칙·단어 풀이 두 곳에서 어긋날 수 없다.
     · 참가자 앱  웹배포용/index.html            (솔로 · 시드 없음)
     · 선수 화면  웹배포용/admin/typing.html     (대전 · 서버 시드)
   담는 것 = 단어 풀 · 난이도 상수 · 팔레트 · 스프라이트 · 시드 난수 · 배치 · 그리기 · 진행 · 판정 · 입력 처리.
   안 담는 것(각 화면이 제 것을 갖는다) = 오버레이 골격(rgPlayOpen·rgPlayClose) · HUD·입력 HTML ·
     일시정지 UI(rgPause·rgResume·rgQuit) · 끝난 뒤 처리(rgEndFinal) · 서버 통신.
   화면 쪽이 반드시 갖춰야 하는 DOM id: rgCv(캔버스) · rgIn(입력창) · rgForm(입력 폼) · rgTip(자판 안내) ·
     rgHudSc(점수) · rgHudTm(시간) · rgHudHt(하트 묶음).
   소리는 있으면 쓴다(전역 sfx) · 없으면 조용히 넘어간다.
   캐릭터는 행사 챗봇 원본(assets/bot.js 의 botDotCv)을 쓴다 · 화면 쪽이 bot.js 를 이 파일보다 먼저 읽는다 · 없으면 캐릭터만 빠지고 게임은 그대로 돈다.

   판정: 입력창의 완성 문자열을 Enter(모바일 완료)로 제출 · 화면 단어와 정확히 같으면 터짐(같은 단어가 여럿이면 가장 아래).
   한 판 = 목숨 RAIN_LIVES · 바닥선에 닿으면 목숨 -1 · RAIN_STAGE_SEC 마다 단계 상승 · 마지막 단계 뒤에도 계속 빨라진다.
   시간 제한은 없다(사용자 확정 260923) · 목숨이 떨어지면 끝난다 · 안전 상한(RAIN_CAP_SEC)은 기계를 오래 붙잡지 않게 하는 장치일 뿐이다.
   점수 = 글자 수 × 10 × 콤보 배수(1 + 0.2 × min(콤보-1, 10), 최대 3배) · 정확도 = 제출 중 명중 비율.
   비주얼: 오렌지 사다리 + 검정 + 흰색 + 웜그레이·웜브라운만 · 도트 단위 고정(판이 작아지면 도트 개수만 준다).
   v4.23(260923) 16비트 레트로 · 단어 = 나무 이름표 · 글자 = Neo둥근모 · 판 안 GAME OVER = 공용 나무 판(rtEnd) · 이 파일 아래 「레트로 틀」 한 벌을 앱 다섯 게임도 같이 쓴다.
     판정(글자 일치 · 바닥선)·시드·단어 순서·단어 상자 높이(L.boxH)는 그대로다 · 글꼴이 바뀌어 상자 폭(bw)만 글자에 맞게 달라진다(자리 잡기에만 쓰는 값).
   ══════════════════════════════════════════════════════════════════════════ */

/* ═══ 단어 풀 · 여기 한 곳 ═══
   260917 원본(행사 어휘 73개 · 뜻 없음)으로 되돌렸다. 260918 의 「AI 기본 소양 30개 + 칸마다 뜻」은 폐기(사용자 확정 260923).
   게임 중에 긴 글·모달·정지를 넣지 않는다. 뜻 표시도 되새김 화면도 두지 않는다.
   확정 문서·앱에 이미 있는 어휘에서 짧은 단어 위주 · 공백이 든 말(ME to WE 등)은 판정이 어려워 뺐다 · 영문은 자판 전환 부담으로 3개만.
   단계가 오를수록 긴 단어 비중이 커진다(1단계 3자 이하 · 2단계부터 전부). */
var RAIN_WORDS = [
  "AX", "AI", "DAP",
  "공감", "참여", "확산", "체화", "혁신", "연결", "실습", "전시", "체험", "상담", "강연", "세션", "설문", "계단", "퀴즈", "경품", "추첨", "시상", "분석", "요약", "현장", "영업", "보상", "전략", "채널", "교안", "동료", "업무", "본사", "룰렛",
  "데이터", "로드맵", "자동화", "커피챗", "스탬프", "리포트", "응모권", "대강당", "광화문", "파이썬", "노트북", "클로드", "키노트", "알림봇", "정리표", "산출물", "체크인", "라이브", "챌린지", "리서치", "실시간", "새정보",
  "에이전트", "프롬프트", "대시보드", "아이디어", "코파일럿", "하이디큐", "기조연설", "예측모델", "포토부스", "우수사례", "파트너사", "외부자료", "문서작성", "통계현황", "반복작업",
  "바이브코딩", "업무혁신", "내부강연"
];
/* 옛 이름 · 참가자 앱의 다른 코드가 아직 TYPE_WORDS 로 부른다 */
var TYPE_WORDS = RAIN_WORDS;

/* ═══ 난이도 ═══ 260917 원본 값으로 되돌렸다(260918 의 완화 8.5/7.5/6.5/5.5/4.7 · 15초 단계 · 처음 10초 쉬운 단어는 폐기).
   시간 제한이 없어지면서 마지막 단계 뒤에도 계속 조이는 램프만 남겼다(이게 없으면 잘 치는 사람이 끝나지 않는다).
   RAIN_LIVES·RAIN_CAP_SEC·램프 세 값은 서버가 판마다 덮어쓸 수 있다(rgApplyTune) · 현장에서 길이를 조절하는 손잡이다. */
var RAIN_LIVES = 5;                           /* 목숨 · 바닥에 닿은 단어 하나에 1 */
var RAIN_CAP_SEC = 180;                       /* 안전 상한 · 이 시간에 닿으면 판을 끝낸다(한 사람이 기계를 오래 잡지 않게) */
var RAIN_FALL = [7, 6, 5, 4, 3.2];            /* 단계별 · 위에서 바닥선까지 걸리는 초 */
var RAIN_SPAWN = [2.2, 1.9, 1.6, 1.35, 1.1];  /* 단계별 · 새 단어 간격 초 */
var RAIN_STAGE_SEC = 12;                      /* 단계가 오르는 간격 */
var RAIN_RAMP_FROM = 48;                      /* 마지막 단계(5단계 = 48초)부터 추가로 조인다 */
var RAIN_RAMP_SPAN = 60;                      /* 이 초에 걸쳐 RAIN_RAMP_MIN 까지 */
var RAIN_RAMP_MIN = 0.45;                     /* 낙하 시간·등장 간격의 하한 배율 */
var RAIN_EXTRA_EVERY = 30;                    /* 램프 시작 뒤 이 초마다 동시 단어 +1 (최대 +2) */
var RAIN_BANDS = [[330, 2, 3], [420, 3, 4], [520, 4, 5], [1e9, 5, 5]];   /* [판 높이 미만, 동시 단어 최대, 단계 수] · 휴대폰 */
var RAIN_FONT = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", sans-serif';
var RAIN_PAL = { o100: "#FF7E31", o60: "#FFA46E", o50: "#FFB284", o30: "#FFCFB0", o25: "#FFD8C1", o10: "#FFEBE0", deep: "#D64524", ink: "#000000", w: "#FFFFFF", gray: "#B8AEA6", dim: "#8A817B", soil: "#7A3E1C", soil2: "#6A3417", trunk: "#5E3218" };
/* ═══ v4.23 레트로 틀 · 게임판 안 공용 한 벌 (260923 사용자 확정 · design.md A-5 5-16 · 정본 시안 「레트로 시안/시안.html」) ═══
   쓰는 곳 = 단어 소나기(앱 솔로 · 1F 현장 · 선수 화면 admin/typing.html) + 앱 다섯 게임의 판 안 GAME OVER·카운트다운(팡 · 테트리스 · 점프 · O/X).
   글꼴 = Neo둥근모(assets/neodgm.woff2 · OFL 1.1 · 한글 완성형 11,172자 전부 들어 있음 · 260923 실측) · 없는 글자(한자 · 이모지 · 화살표)는 Pretendard로 넘어간다.
     굵기가 하나뿐이라 굵게를 주지 않는다(가짜 굵게가 도트를 뭉갠다) · 화면에 그려지는 크기 16px 이상에서만 쓴다 · 캔버스는 글꼴이 읽히기 전에는 Pretendard로 그리고 다음 프레임부터 바뀐다.
   색 = 오렌지 사다리 · 검정 · 흰색 · 위 RAIN_PAL 의 웜브라운(trunk = 진한 나무) · 밝은 나무 두 톤 · 어두운 판 두 톤 · 크림 글자. 파랑·민트 없음.
   넥슨 이미지·UI, NES.css·RPGUI 파일은 쓰지 않는다 · 이중 테두리 · 계단 모서리 · 하드 테두리 글자라는 문법만 직접 그린다. */
var RT_FONT = '"NeoDunggeunmo", ' + RAIN_FONT;
var RT_PAL = { night: "#1B1712", bark: "#2A2118", wood: "#5E3218", tan: "#D9A066", tan2: "#E3B884", cream: "#F3E7D8" };
/* 캐릭터 = 행사 챗봇 원본(assets/bot.js) · 260923 사용자 지시로 옛 오렌지 도트 마스코트(세로로 벌어지는 입 · 콤보 친구)를 걷어냈다(design.md A-5 5-15).
   원본 형태는 바꾸지 않는다 · 옛 연출은 몸 전체 움직임으로만 옮겼다: 입 벌리기 → 명중 때 몸 전체 한 번 튀기기(RG.mas.hop) · 콤보 5 이상 = 작은 챗봇 하나가 옆에 붙는다(개수·크기만 · ME 가 WE 가 되는 연출).
   크기는 도트 칸 수로 고정한다(서기 22×26 = 점프 러너와 같은 칸 수 · 친구 17×20) · 도트 한 칸 = L.D / 2 CSS px · 그리는 상자는 옛 마스코트 자리(L.masW × L.masH) 안이다. */
var RG_BOT = { w: 22, h: 26, bw: 17, bh: 20 };

var RG = { on: false, mode: "app", big: false, raf: 0, last: 0, t0: 0, cd: 0, words: [], ghost: [], seq: 0, parts: [], pops: [], lives: RAIN_LIVES, score: 0, hits: 0, tries: 0, combo: 0, maxCombo: 0, stage: 1, spawnT: 0, shake: 0, banner: null, shot: null, mas: { x: 90, tx: 90, hop: 0 }, res: null, L: null, dpr: 1, seed: 0, rs: 0, lives0: RAIN_LIVES, cap: RAIN_CAP_SEC };
var RGP = { on: false, touch: false };

/* ── 화면에 기대지 않는 작은 도구 ── */
function rgEl(id) { return document.getElementById(id); }
function rgSfx(a, b) { try { if (typeof sfx === "function") sfx(a, b); } catch (e) {} }
function rgReduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
function rgMobile() {
  try { return (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || window.innerWidth < 600; } catch (e) { return window.innerWidth < 600; }
}
function rgTouch() { try { return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches); } catch (e) { return false; } }

/* ═══ 시드 난수 (mulberry32) ═══
   대전은 서버가 정수 시드 하나를 발급하고, 기기마다 이 난수로 같은 단어 순서를 독립 실행한다.
   GAS 왕복이 1.0~1.6초라 떨어지는 단어를 그림으로 맞출 수는 없다(실측) · 그래서 순서만 맞추고 진행 요약만 올린다.
   시드 난수를 쓰는 곳은 세 군데뿐이다: 단어 가방 섞기 · 레인 섞기 · 낙하 시간 흔들림.
   파티클·화면 흔들림처럼 눈요기는 Math.random 을 그대로 쓴다(기기마다 달라도 판정에 영향이 없고, 쓰면 시드 흐름이 어긋난다). */
function rgSeed(seed) {
  RG.seed = (Number(seed) || 0) >>> 0;
  RG.rs = RG.seed;
}
function rgRnd() {
  if (!RG.seed) return Math.random();
  RG.rs = (RG.rs + 0x6D2B79F5) >>> 0;
  var t = RG.rs;
  t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
  t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rgShuf(a) {
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rgRnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
/* 서버가 준 판 설정 · 없는 값은 건드리지 않는다 */
function rgApplyTune(o) {
  o = o || {};
  if (o.lives > 0) RG.lives0 = Math.max(1, Math.min(9, Math.round(o.lives)));
  if (o.cap > 0) RG.cap = Math.max(30, Math.min(900, Math.round(o.cap)));
}

/* ── 도트 배열 그리기 · 지금은 점프 코인(JP_COIN)만 쓴다 · 캐릭터를 도트 배열로 새로 그리지 않는다(원본 챗봇만) ── */
function rgSprite(ctx, rows, x, y, pal) {
  for (var r = 0; r < rows.length; r++) for (var c = 0; c < rows[r].length; c++) {
    var k = rows[r].charAt(c); if (k === ".") continue;
    ctx.fillStyle = pal[k]; ctx.fillRect(x + c, y + r, 1, 1);
  }
}
/* 챗봇 그리기 · (가운데 x, 바닥 y) 기준 · 원본 도트가 아직 안 읽혔으면 이 프레임은 건너뛴다(카운트다운 사이에 읽힌다) */
function rgBotDraw(ctx, cx, gy, dw, dh, u) {
  if (typeof botDotCv !== "function") return;
  var c = botDotCv(dw, dh); if (!c) return;
  ctx.drawImage(c, Math.round(cx - dw * u / 2), Math.round(gy - dh * u), Math.round(dw * u), Math.round(dh * u));
}

/* ── 배치 ── 판 크기 → 규칙 · 모든 값은 CSS px ── */
function rgLayout(W, H, big) {
  var L = { W: W, H: H, big: big };
  L.D = big ? 4 : 3;                                        /* 도트 단위 */
  L.font = big ? (W >= 1200 ? 32 : W >= 900 ? 30 : 28) : 18;
  L.boxH = Math.round(L.font * 1.6); L.padX = Math.round(L.font * 0.5);
  L.tf = big ? 32 : 16;                                       /* v4.23 이름표 글자 · 도트 글꼴은 16의 배수에서 또렷하다 · 상자 높이(L.boxH)는 위 값 그대로 */
  L.masW = 14 * L.D; L.masH = 13 * L.D;                      /* 캐릭터 자리 · 판정선(L.floor)이 이 높이에 기댄다 · v4.20 값 그대로 · 챗봇(22×26 도트 × L.D/2)은 이 상자 안에 선다 */
  L.soil = (H < 330 ? 6 : 9) * L.D;
  L.ground = H - L.soil;
  L.floor = L.ground - L.masH - L.D;                          /* 단어 상자 아래가 여기 닿으면 놓침 */
  L.top = 8;
  if (big) { L.maxWords = H >= 640 ? 6 : 5; L.stages = 5; }
  else { for (var i = 0; i < RAIN_BANDS.length; i++) if (H < RAIN_BANDS[i][0]) { L.maxWords = RAIN_BANDS[i][1]; L.stages = RAIN_BANDS[i][2]; break; } }
  L.laneW = big ? 190 : 100;
  L.lanes = Math.max(1, Math.floor((W - 16) / L.laneW));
  L.fallPx = Math.max(10, L.floor - L.boxH - L.top);
  return L;
}
function rgFontStr(px) { return "800 " + px + "px " + RAIN_FONT; }
function rtFont(px) { return Math.round(px) + "px " + RT_FONT; }
function rgWordY(w) { var L = RG.L; return L.top + Math.min(1, w.p) * L.fallPx; }
function rgRamp(sec) { return Math.max(RAIN_RAMP_MIN, 1 - Math.max(0, sec - RAIN_RAMP_FROM) / RAIN_RAMP_SPAN * (1 - RAIN_RAMP_MIN)); }
function rgElapsed(now) { return RG.t0 ? (now - RG.t0) / 1000 : 0; }

/* 캔버스 = 보이는 크기 × dpr(상한 2) · 배치 규칙을 다시 계산하고 바로 한 번 그린다 */
function rgFit(cv, w, h) {
  if (!w || !h) return;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  if (RG.L && RG.L.W === w && RG.L.H === h && cv.width === Math.round(w * dpr)) return;   /* visualViewport scroll 로 같은 크기가 또 오면 무시 */
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  RG.dpr = cv.width / w;
  var oldFont = RG.L ? RG.L.font : 0;
  RG.L = rgLayout(w, h, RG.big);
  var ctx = cv.getContext("2d");
  if (oldFont !== RG.L.font) { ctx.font = rtFont(RG.L.tf); RG.words.forEach(function (x) { x.bw = Math.ceil(ctx.measureText(x.text).width) + RG.L.padX * 2; }); }
  RG.words.forEach(function (x) { x.x = Math.max(8, Math.min(w - 8 - x.bw, x.x)); });
  if (!RG.mas.set) { RG.mas.x = RG.mas.tx = w / 2; RG.mas.set = true; }
  RG.mas.x = Math.min(RG.mas.x, w - RG.L.masW / 2); RG.mas.tx = Math.min(RG.mas.tx, w - RG.L.masW / 2);
  rgDraw(ctx, performance.now());
}

/* ═══ 입력 ═══
   한글 조합(iOS 대응): 입력창 노드는 한 판 내내 절대 바꾸지 않는다(교체하면 사파리에서 포커스·IME 가 끊겨 글자가 먹힌다).
   판정은 input 이벤트에서 조합 중 글자까지 포함해 본다(iOS 는 compositionend 가 늦게 와서 기다리면 단어가 안 터진다) · 같은 단어 중복 판정은 400ms 안에서 막는다.
   비우기는 value = "" 한 줄 · 조합이 열려 있을 때만 같은 노드를 한 번 blur→focus 해서 조합 버퍼를 끊는다.
   실시간 판정(터치 기기만): 입력이 떨어지는 단어와 정확히 같아지는 순간 Enter 없이 터진다 · PC 는 Enter 판정 유지.
   ※ 이 두 가지(아이폰 핫픽스 · 입력창 자동 비우기)는 260923 에도 유지 결정. 재미와 무관한 순수 개선이다. */
function rgBindInput(inp) {
  if (!inp || inp._rgb) return; inp._rgb = 1;
  inp.addEventListener("compositionstart", function () { RG.composing = true; });
  inp.addEventListener("compositionend", function () { rgCompEnd(); });
  inp.addEventListener("keydown", function (e) { if (e.key === "Escape" && inp === rgEl("rgIn")) { e.preventDefault(); rgAutoClear(); } });   /* Esc = 즉시 비우기 */
}
function rgFocus() { var i = rgEl("rgIn"); if (i && document.activeElement !== i) i.focus(); }
function rgCompEnd() {
  RG.composing = false;
  if (RG.pendingEnter) { RG.pendingEnter = false; setTimeout(rgSubmit, 0); }
  else setTimeout(function () { rgLive(null); }, 0);   /* 조합이 끝난 글자로 다시 본다 (자동 비우기 판정) */
}
/* 조합 중 글자인지 · 「ㄷ」 같은 낱자는 접두사 판정에서 뺀다 (안 그러면 치는 족족 지워진다) */
function rgJamoTail(v) { var c = v.charCodeAt(v.length - 1); return c >= 0x3131 && c <= 0x318e; }
function rgLatinOnly(v) { return !!v && /^[A-Za-z]+$/.test(v); }
/* 영문 자판 안내 · 로마자만 2초 이상 들고 있으면 입력창 위에 한 줄 (팝업 없음 · 한글이 오면 바로 사라진다) */
function rgTipShow(on) {
  if (!!RG.tip === !!on) return;
  RG.tip = !!on;
  var t = rgEl("rgTip"); if (t) t.hidden = !on;
}
function rgTipTick(now) {
  if (!RG.latT) { rgTipShow(false); return; }
  if (now - RG.latT >= 2000) rgTipShow(true);
}
/* Enter · 조합 중이면 조합이 끝난 뒤 판정 */
function rgEnter() {
  if (RG.composing) { RG.pendingEnter = true; return; }
  setTimeout(rgSubmit, 0);
}
function rgLive(e) {
  if (!RGP.on || !RG.on || RG.cd > 0 || RG.ending || RG.paused) return;
  var inp = rgEl("rgIn"); if (!inp) return;
  var v = inp.value.trim();
  RG.typed = v;                                   /* 조합 중 글자도 화면에서 짚어 준다 */
  RG.latT = rgLatinOnly(v) ? (RG.latT || performance.now()) : 0;
  if (!RG.latT) rgTipShow(false);
  if (RGP.touch && v && RG.words.some(function (w) { return w.text === v; })) { rgSubmit(); return; }
  rgCheckInput(v);
}
/* 치던 단어가 사라지면 입력창을 바로 비운다 · 「아직 맞는 앞부분」까지만 남긴다(오타 한 글자 때문에 단어를 통째로 잃지 않게).
   조합이 열려 있을 때는 앞부분만 남기지 않는다(IME 가 그 글자 위에 계속 조합해서 뒤죽박죽이 된다) → 통째로 비운다.
   자동으로 지운 글자는 오타(RG.tries)로 세지 않는다 → 점수·정확도 불변. */
function rgPrefixAlive(v) { return RG.words.some(function (w) { return w.text.indexOf(v) === 0; }); }
function rgAutoClear() {
  var inp = rgEl("rgIn"); if (!inp || !inp.value) return;
  var v = inp.value.trim(), keep = "";
  for (var n = v.length - 1; n > 0; n--) { if (rgPrefixAlive(v.slice(0, n))) { keep = v.slice(0, n); break; } }
  if (keep && !RG.composing) { inp.value = keep; RG.typed = keep; if (document.activeElement !== inp) inp.focus(); }
  else { rgClearInput(); RG.typed = ""; }
  rgFlash("auto");
  rgSfx("tik");
}
function rgCheckInput(v) {
  if (!RG.on || RG.cd > 0 || RG.ending || RG.paused) return;
  var inp = rgEl("rgIn"); if (!inp) return;
  if (v == null) v = inp.value.trim();
  RG.typed = v;   /* 지금 치고 있는 글자 · 그리기에서 맞는 단어를 짚어 준다 */
  if (!v) return;
  if (rgJamoTail(v)) return;    /* 아직 만들어지는 중인 낱자 · 자동 비우기 보류 */
  if (rgLatinOnly(v)) return;   /* 영문 자판이면 지우지 말고 안내 한 줄로 알려 준다 */
  if (!rgPrefixAlive(v)) rgAutoClear();
}
/* 치던 글자와 맞는 단어 중 가장 아래 것 (화면에서 짚어 준다) */
function rgTypedIdx() {
  var v = RG.typed || "", hit = -1;
  if (!v) return -1;
  RG.words.forEach(function (w, i) { if (w.text.indexOf(v) === 0 && (hit < 0 || w.p > RG.words[hit].p)) hit = i; });
  return hit;
}
function rgClearInput() {
  RG.typed = "";
  var inp = rgEl("rgIn"); if (!inp) return;
  inp.value = "";
  if (RG.composing) {
    RG.composing = false;
    try { inp.blur(); inp.focus(); } catch (e) {}
    if (inp.value) inp.value = "";
  } else if (document.activeElement !== inp) inp.focus();
}
/* 입력 막대 반응 · 맞힘 = 테두리 O100 0.15초 · 틀림 = 회색 + 짧은 흔들림 */
function rgFlash(kind) {
  var f = rgEl("rgForm"); if (!f) return;
  f.classList.remove("hit", "miss", "auto"); void f.offsetWidth; f.classList.add(kind);
  clearTimeout(RG.flashT); RG.flashT = setTimeout(function () { f.classList.remove("hit", "miss", "auto"); }, kind === "hit" ? 150 : 320);
}

/* ═══ 단어 뽑기 ═══
   가방에서 꺼내기(섞어 두고 하나씩 · 다 쓰면 다시 섞는다) · 화면에 있는 단어와 최근 뽑은 6개는 건너뛴다.
   대전에서는 「화면에 있는 단어」를 실제 화면이 아니라 유령 목록(rgLive 목록 · 아무도 안 친 셈 친 가상 위치)으로 본다.
   그러지 않으면 잘 치는 사람의 화면이 비어 단어 순서가 갈라진다. */
function rgOnScreen() {
  var a = RG.seed ? RG.ghost : RG.words, o = [];
  for (var i = 0; i < a.length; i++) o.push(a[i].text);
  return o;
}
function rgPool() {
  if (RG.stage <= 1) return RAIN_WORDS.filter(function (w) { return w.length <= 3; });
  return RAIN_WORDS;
}
function rgPickWord() {
  var pool = rgPool();
  if (!pool.length) pool = RAIN_WORDS;
  var onScreen = rgOnScreen();
  var recent = RG.recent || (RG.recent = []);
  for (var pass = 0; pass < 2; pass++) {
    for (var k = 0; k < pool.length + 2; k++) {
      if (!RG.bag || !RG.bag.length) RG.bag = rgShuf(pool.slice());
      var w = RG.bag.pop();
      if (!w) break;
      if (onScreen.indexOf(w) >= 0) continue;
      if (pass === 0 && recent.indexOf(w) >= 0) continue;
      recent.push(w); if (recent.length > 6) recent.shift();
      return w;
    }
    RG.bag = rgShuf(pool.slice());
  }
  return pool[0];
}

/* ═══ 판 ═══ */
function rgStop() { RG.on = false; if (RG.raf) cancelAnimationFrame(RG.raf); RG.raf = 0; if (typeof rgPlayClose === "function") rgPlayClose(); }
/* mode: "app" 솔로 · "site" 스태프 노트북 솔로 · "race" 서버 대전(시드 필수)
   opt: { seed, lives, cap, t0, cd } · t0 을 주면(대전) 그 시각에 맞춰 시작한다 */
function rgStart(mode, opt) {
  opt = opt || {};
  rgStop();
  RG.mode = mode || "app";
  rgSeed(RG.mode === "race" ? (opt.seed || 1) : 0);
  RG.lives0 = RAIN_LIVES; RG.cap = RAIN_CAP_SEC;
  rgApplyTune(opt);
  RG.words = []; RG.ghost = []; RG.seq = 0; RG.parts = []; RG.pops = []; RG.bag = null; RG.recent = []; RG.surv = 0;
  RG.lives = RG.lives0; RG.score = 0; RG.hits = 0; RG.tries = 0;
  RG.combo = 0; RG.maxCombo = 0; RG.stage = 1; RG.spawnT = 0.3; RG.shake = 0; RG.banner = null; RG.shot = null; RG.res = null; RG.ending = null; RG.heartHit = 0;
  RG.mas = { x: 90, tx: 90, hop: 0, set: false };
  RG.cd = opt.cd != null ? opt.cd : 3.2; RG.t0 = 0; RG.on = true; RG.last = performance.now(); RG.L = null; RG.hud = "";
  RG.paused = false; RG.composing = false; RG.pendingEnter = false; RG.typed = ""; RG.lastHit = null; RG.latT = 0; RG.tip = false;
  RG.big = RG.mode !== "app" || (!rgTouch() && window.innerWidth >= 700);
  try { if (typeof SFX !== "undefined") SFX.site = RG.mode !== "app"; } catch (e) {}
  if (typeof rgPlayOpen === "function") rgPlayOpen();
  var inp = rgEl("rgIn"); rgBindInput(inp); if (inp) inp.focus();
  RG.raf = requestAnimationFrame(rgFrame);
}
function rgFrame() {
  if (!RG.on || RG.paused) return;
  var now = performance.now(), dt = Math.min(0.05, (now - RG.last) / 1000);
  RG.last = now;
  rgUpdate(dt, now);
  var cv = rgEl("rgCv");
  if (!cv) { rgStop(); return; }
  rgDraw(cv.getContext("2d"), now);
  if (RG.on) RG.raf = requestAnimationFrame(rgFrame);
}
function rgFx(dt) {
  RG.parts = RG.parts.filter(function (p) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; return p.t > 0; });
  RG.pops = RG.pops.filter(function (p) { p.t -= dt; p.y -= 30 * dt; return p.t > 0; });
}
/* 새 단어 · 레인을 섞어 윗부분 단어 상자와 겹치지 않는 자리 · 좌우 8px 여백
   대전에서는 겹침 검사도 유령 목록으로 본다(누가 얼마나 쳤는지와 무관하게 같은 자리) */
function rgSpawn(sec) {
  var L = RG.L, cv = rgEl("rgCv"); if (!L || !cv) return false;
  var ctx = cv.getContext("2d"), text = rgPickWord();
  ctx.font = rtFont(L.tf);
  var bw = Math.ceil(ctx.measureText(text).width) + L.padX * 2;
  var maxX = Math.max(8, L.W - 8 - bw), lw = (L.W - 16) / L.lanes, upper = L.top + L.boxH * 3;
  var near = RG.seed ? RG.ghost : RG.words;
  var lanes = []; for (var i = 0; i < L.lanes; i++) lanes.push(i);
  rgShuf(lanes);
  var jit = rgRnd(), fj = rgRnd();
  for (var k = 0; k < lanes.length; k++) {
    var x = Math.round(Math.min(maxX, Math.max(8, 8 + lanes[k] * lw + jit * Math.max(0, lw - bw))));
    var clash = near.some(function (w) { return rgWordY(w) < upper && x < w.x + w.bw + 8 && x + bw + 8 > w.x; });
    if (!clash || k === lanes.length - 1) {
      var wd = { text: text, bw: bw, x: x, p: 0, fall: RAIN_FALL[RG.stage - 1] * rgRamp(sec) * (0.94 + fj * 0.12) };
      RG.words.push(wd);
      if (RG.seed) RG.ghost.push({ text: text, bw: bw, x: x, p: 0, fall: wd.fall });
      RG.seq++;
      return true;
    }
  }
  return false;
}
function rgUpdate(dt, now) {
  if (RG.ending) {   /* 끝나는 순간 1.2초 멈춰 이유를 보여 준다 */
    RG.ending.t -= dt; rgFx(dt);
    if (RG.shake > 0) RG.shake -= dt;
    if (RG.ending.t <= 0) { var w = RG.ending.why; RG.ending = null; if (typeof rgEndFinal === "function") rgEndFinal(w); }
    return;
  }
  if (RG.heartHit > 0) RG.heartHit -= dt;
  if (RG.cd > 0) {
    var before = Math.ceil(RG.cd);
    RG.cd -= dt;
    if (Math.ceil(RG.cd) !== before && RG.cd > 0) rgSfx("tick");
    if (RG.cd <= 0) { RG.t0 = now; rgSfx("go"); }
    return;
  }
  var L = RG.L; if (!L) return;
  var sec = rgElapsed(now);
  RG.surv = sec;
  rgTipTick(now);
  if (sec >= RG.cap) { rgEnd("cap"); return; }   /* 안전 상한 · 현장에서 서버 값으로 조절한다 */
  var st = Math.min(L.stages, 1 + Math.floor(sec / RAIN_STAGE_SEC));
  if (st > RG.stage) { RG.stage = st; RG.banner = { text: "LEVEL " + st, t: 1.3 }; rgSfx("level"); }
  /* 유령 목록 · 아무도 안 친 셈 친 가상 위치 · 바닥을 지나면 버린다 */
  if (RG.seed) for (var gi = RG.ghost.length - 1; gi >= 0; gi--) { RG.ghost[gi].p += dt / RG.ghost[gi].fall; if (RG.ghost[gi].p >= 1) RG.ghost.splice(gi, 1); }
  RG.spawnT -= dt;
  var extra = Math.min(2, Math.floor(Math.max(0, sec - RAIN_RAMP_FROM) / RAIN_EXTRA_EVERY));
  /* 대전은 화면에 몇 개 남았는지로 등장을 막지 않는다(막으면 사람마다 단어 순서가 갈라진다) · 솔로는 원래대로 상한을 둔다 */
  var room = RG.seed ? RG.ghost.length <= L.maxWords + extra : RG.words.length < L.maxWords + extra;
  if (RG.spawnT <= 0 && room) RG.spawnT = rgSpawn(sec) ? RAIN_SPAWN[RG.stage - 1] * rgRamp(sec) : 0.25;
  for (var i = RG.words.length - 1; i >= 0; i--) {
    var wd = RG.words[i];
    wd.p += dt / wd.fall;
    if (wd.p >= 1) {
      RG.words.splice(i, 1);
      RG.lives--; RG.combo = 0; RG.shake = rgReduced() ? 0 : 0.22; RG.heartHit = 0.5;
      rgBurst(wd.x + wd.bw / 2, L.floor, 6, [RAIN_PAL.dim, RAIN_PAL.ink]);
      RG.pops.push({ x: wd.x + wd.bw / 2, y: L.floor - 10, text: "놓침 · 하트 -1", t: 0.9, c: RAIN_PAL.deep, s: 14 });
      rgSfx("floor");
      rgCheckInput();   /* 치고 있던 단어가 바닥에 닿아 사라졌으면 입력창을 바로 비운다 */
      if (RG.lives === 1) RG.banner = { text: "마지막 목숨", t: 1.0 };
      if (RG.lives <= 0) { rgEnd("lives"); return; }
    }
  }
  rgFx(dt);
  if (RG.banner) { RG.banner.t -= dt; if (RG.banner.t <= 0) RG.banner = null; }
  if (RG.shot) { RG.shot.t -= dt; if (RG.shot.t <= 0) RG.shot = null; }
  if (RG.shake > 0) RG.shake -= dt;
  if (RG.mas.hop > 0) RG.mas.hop -= dt;
  RG.mas.x += (RG.mas.tx - RG.mas.x) * Math.min(1, dt * 8);
  if (!(RG.mas.hop > 0)) RG.mas.tx += (L.W / 2 - RG.mas.tx) * Math.min(1, dt * 1.5);
}
/* 파티클 · 눈요기라 시드를 쓰지 않는다 */
function rgBurst(x, y, n, cols) {
  if (rgReduced()) n = Math.min(n, 4);
  var cap = RGP.touch ? 80 : 140;   /* 저사양 휴대폰 대비 */
  for (var i = 0; i < n && RG.parts.length < cap; i++) {
    var a = (Math.PI * 2 * i) / n + Math.random() * 0.3, sp = 90 + Math.random() * 110;
    RG.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, t: 0.45 + Math.random() * 0.3, c: cols[i % cols.length], s: (RG.big ? 6 : 4) + Math.floor(Math.random() * 3) });
  }
}
function rgSubmit() {
  var inp = rgEl("rgIn"); if (!inp || !RG.on || RG.cd > 0 || RG.ending || RG.paused) return;
  var v = inp.value.trim();
  if (!v) { if (inp.value) { rgClearInput(); rgFlash("auto"); }  /* 빈 판정(공백만)도 즉시 비움 · 오타 아님 */
    return; }
  var tnow = performance.now();
  if (RG.lastHit && RG.lastHit.v === v && tnow - RG.lastHit.t < 400) { rgClearInput(); return; }   /* 한 단어가 두 번 터지지 않게 (iOS 는 input 이 연달아 온다) */
  rgClearInput();
  RG.tries++;
  var hit = -1;
  RG.words.forEach(function (w, i) { if (w.text === v && (hit < 0 || w.p > RG.words[hit].p)) hit = i; });
  if (hit < 0) {
    /* 오타에 벌칙 없음 · 콤보를 끊지 않고 테두리 한 번 + 짧은 소리만 · 하트도 줄지 않는다 */
    rgFlash("miss");
    rgSfx("tik");
    return;
  }
  var L = RG.L, wd = RG.words.splice(hit, 1)[0];
  RG.lastHit = { v: v, t: tnow };
  RG.combo++; RG.hits++; RG.maxCombo = Math.max(RG.maxCombo, RG.combo);
  var mult = 1 + 0.2 * Math.min(RG.combo - 1, 10), pts = Math.round(wd.text.length * 10 * mult);
  RG.score += pts;
  var cx = wd.x + wd.bw / 2, cy = rgWordY(wd) + L.boxH / 2;
  if (!rgReduced()) { RG.mas.tx = Math.max(L.masW / 2, Math.min(L.W - L.masW / 2, cx)); RG.mas.hop = 0.25; }   /* 동작 줄이기 = 제자리에서 쏜다(옮겨 가기·튀기기 없음) */
  RG.shot = { x0: RG.mas.tx, y0: L.ground - L.masH, x1: cx, y1: cy, t: 0.12 };
  rgBurst(cx, cy, 16, [RAIN_PAL.o100, RAIN_PAL.ink, RAIN_PAL.w, RAIN_PAL.o50]);
  RG.pops.push({ x: cx, y: cy, text: "+" + pts, t: 0.8, c: RAIN_PAL.w, s: 14 });
  if (RG.combo >= 3) RG.pops.push({ x: cx, y: cy - (RG.L && RG.L.big ? 36 : 20), text: "COMBO x" + RG.combo, t: 0.9, c: RAIN_PAL.o60, s: 16 });   /* v4.23 노트북 배치는 팝 글자가 32 라 한 줄 더 띄운다(표시만) */
  if (!rgReduced()) RG.shake = Math.max(RG.shake, 0.06);
  rgFlash("hit");
  rgSfx("hit", RG.combo);
}
function rgEnd(why) {
  if (!RG.on || RG.ending) return;
  RG.ending = { t: 1.2, why: why };
  RG.words = []; RG.banner = null;
  rgSfx(why === "cap" ? "fanfare" : "over");
  var inp = rgEl("rgIn"); if (inp) inp.disabled = true;
}
/* 지금 성적 · 결과 보고와 진행 보고가 같은 값을 쓴다 */
function rgStat() {
  return { score: RG.score, hits: RG.hits, combo: RG.maxCombo, acc: RG.tries ? Math.round(RG.hits / RG.tries * 100) : 0, lives: Math.max(0, RG.lives), el: Math.round((RG.surv || 0) * 1000) };
}

/* ── 그리기 ── */
function rgBox(ctx, x, y, w, h, fill) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill || RAIN_PAL.w; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}
/* 단어·배너 상자 · 외곽선 2px 고정 */
function rgBox2(ctx, x, y, w, h, fill) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill || RAIN_PAL.w; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
}
/* ── v4.23 레트로 틀 (그리기) ── */
/* 계단 모서리 사각 · 네 모서리를 한 칸(s)씩 두 단 깎는다 */
function rtStep(ctx, x, y, w, h, s, fill) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 2 * s, y, w - 4 * s, h); ctx.fillRect(x + s, y + s, w - 2 * s, h - 2 * s); ctx.fillRect(x, y + 2 * s, w, h - 4 * s);
}
/* 나무 이중 테두리 판 · 바깥 검정 한 칸 → 진한 나무 두 칸 → 밝은 나무 한 칸 → 속판 · s = 도트 한 칸 */
function rtPanel(ctx, x, y, w, h, s, body) {
  rtStep(ctx, x, y, w, h, s, RAIN_PAL.ink);
  rtStep(ctx, x + s, y + s, w - 2 * s, h - 2 * s, s, RT_PAL.wood);
  ctx.fillStyle = RT_PAL.tan; ctx.fillRect(Math.round(x + 3 * s), Math.round(y + 3 * s), Math.round(w - 6 * s), Math.round(h - 6 * s));
  ctx.fillStyle = body || RT_PAL.night; ctx.fillRect(Math.round(x + 4 * s), Math.round(y + 4 * s), Math.round(w - 8 * s), Math.round(h - 8 * s));
}
/* 이름표 · 검정 계단 테두리 두 칸 + 도트 명암(위 밝게 · 아래 어둡게) · 떨어지는 단어 · 소나기 배너가 쓴다 */
function rtTag(ctx, x, y, w, h, fill, lite, dark) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  rtStep(ctx, x, y, w, h, 2, RAIN_PAL.ink);
  ctx.fillStyle = fill; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = lite; ctx.fillRect(x + 4, y + 2, w - 8, 2);
  ctx.fillStyle = dark; ctx.fillRect(x + 4, y + h - 4, w - 8, 2);
}
/* 도트 글자 · 여덟 방향 검정 테두리(번짐 없음 · 16px 마다 한 칸) · 정렬·기준선은 부른 쪽이 정한다 */
function rtText(ctx, text, x, y, px, fill, line) {
  ctx.font = rtFont(px);
  if (line) {
    var o = Math.max(1, Math.round(px / 16));
    ctx.fillStyle = line;
    for (var dy = -o; dy <= o; dy += o) for (var dx = -o; dx <= o; dx += o) if (dx || dy) ctx.fillText(text, Math.round(x + dx), Math.round(y + dy));
  }
  ctx.fillStyle = fill; ctx.fillText(text, Math.round(x), Math.round(y));
}
/* 판 안 끝 화면 · 다섯 게임 + 소나기 공용 · 판(y0~y1)을 어둡게 덮고 가운데 나무 판에 제목(주황 · 검정 테두리) + 게임 고유 한 줄(크림)
   o = { s 도트 한 칸, tp 제목 크기, sp 한 줄 크기, maxW 판 최대 폭, col 제목 색 } · 제목이 폭을 넘으면 8px 씩 줄인다(16 밑으로는 안 줄인다) */
function rtEnd(ctx, W, y0, y1, title, sub, o) {
  o = o || {};
  var s = o.s || 2, tp = o.tp || 32, sp = o.sp || 16, pw = Math.min(W - 2 * s, o.maxW || 320);
  ctx.save();
  ctx.fillStyle = "rgba(27,23,18,0.55)"; ctx.fillRect(0, y0, W, y1 - y0);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = rtFont(tp);
  while (tp > 16 && ctx.measureText(title).width > pw - 14 * s) { tp -= 8; ctx.font = rtFont(tp); }
  if (sub) { ctx.font = rtFont(sp); pw = Math.min(W - 2 * s, Math.max(pw, Math.ceil(ctx.measureText(sub).width) + 14 * s)); }
  var ph = 14 * s + Math.round(tp * 1.15) + (sub ? Math.round(sp * 1.25) + 2 * s : 0);
  var px = Math.round(W / 2 - pw / 2), py = Math.round((y0 + y1) / 2 - ph / 2);
  rtPanel(ctx, px, py, pw, ph, s, RT_PAL.night);
  var ty = py + 7 * s + Math.round(tp * 0.575);
  rtText(ctx, title, W / 2, ty, tp, o.col || RAIN_PAL.o100, RAIN_PAL.ink);
  if (sub) rtText(ctx, sub, W / 2, ty + Math.round(tp * 0.575) + 2 * s + Math.round(sp * 0.625), sp, RT_PAL.cream, null);
  ctx.restore();
}
/* 카운트다운 · 3 · 2 · 1 · GO (도트 글자) */
function rtCount(ctx, cd, W, y0, y1, px) {
  if (cd <= 0) return;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(0, y0, W, y1 - y0);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  rtText(ctx, cd > 1 ? String(Math.ceil(cd - 0.2)) : "GO", W / 2, (y0 + y1) / 2, px || 48, RAIN_PAL.o100, RAIN_PAL.ink);
  ctx.restore();
}
/* 떨어지는 단어 한 개 · 게임과 시작 화면 미리보기가 같이 쓴다 · on = 지금 치고 있는 단어 · danger = 바닥선 가까이 · tv = 친 앞부분 */
function rgWordDraw(ctx, L, x, y, bw, text, on, danger, tv) {
  if (on) rtTag(ctx, x, y, bw, L.boxH, RAIN_PAL.o10, RAIN_PAL.w, RAIN_PAL.o30);
  else if (danger) rtTag(ctx, x, y, bw, L.boxH, RAIN_PAL.o60, RAIN_PAL.o30, RAIN_PAL.deep);
  else rtTag(ctx, x, y, bw, L.boxH, RT_PAL.tan2, RT_PAL.cream, RT_PAL.tan);
  if (on) { ctx.strokeStyle = RAIN_PAL.o100; ctx.lineWidth = 2; ctx.strokeRect(Math.round(x) - 2, Math.round(y) - 2, Math.round(bw) + 4, Math.round(L.boxH) + 4); }
  ctx.font = rtFont(L.tf); ctx.textAlign = "left"; ctx.textBaseline = "middle";
  var tx = Math.round(x + L.padX), ty = Math.round(y + L.boxH / 2);
  if (on && tv) {
    ctx.fillStyle = RAIN_PAL.deep; ctx.fillText(tv, tx, ty);
    ctx.fillStyle = RT_PAL.bark; ctx.fillText(text.slice(tv.length), tx + ctx.measureText(tv).width, ty);
  } else { ctx.fillStyle = RT_PAL.bark; ctx.fillText(text, tx, ty); }
}
function rgStroke(ctx, text, x, y, fill, line, lw) {
  ctx.lineWidth = lw || 3; ctx.strokeStyle = line || RAIN_PAL.ink; ctx.lineJoin = "round";
  ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
}
/* 배경 · 도트 단위 D 로 그린다(판이 커지면 도트 개수만 는다) · 두 톤 체크무늬 · 나무 · 풀 · 흙 · 벽돌 */
function rgWorldD(ctx, L) {
  var D = L.D, T = 6 * D, W = L.W, g = L.ground;
  for (var ty = 0; ty < g; ty += T) for (var tx = 0; tx < W; tx += T) {
    ctx.fillStyle = ((tx + ty) / T) % 2 ? RAIN_PAL.o25 : RAIN_PAL.o10; ctx.fillRect(tx, ty, T, T);
  }
  [2 * D, W - 7 * D].forEach(function (x) {
    ctx.fillStyle = RAIN_PAL.trunk; ctx.fillRect(x + 2 * D, g - 3 * D, D, 3 * D);
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x, g - 8 * D, 5 * D, 5 * D);
    ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(x + 2, g - 8 * D + 2, 5 * D - 4, 5 * D - 4);
    ctx.fillStyle = RAIN_PAL.o50; ctx.fillRect(x + D, g - 7 * D, 2 * D, D);
  });
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(0, g, W, 2);
  ctx.fillStyle = RAIN_PAL.o50; ctx.fillRect(0, g + 2, W, D);
  for (var gx = 0; gx < W; gx += 2 * D) { ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(gx, g + 2, D, D); }
  for (var ri = 0, dy = g + 2 + D; dy < L.H; ri++, dy += 2 * D) for (var ci = 0, dx = 0; dx < W; ci++, dx += 2 * D) {
    ctx.fillStyle = (ri + ci) % 2 ? RAIN_PAL.soil : RAIN_PAL.soil2; ctx.fillRect(dx, dy, 2 * D, 2 * D);
  }
  if (L.soil >= 9 * D) {   /* 흙 속 벽돌 · 장식 · 폭에 맞춰 개수만 달라진다 */
    var bw = 8 * D, gap = D, n = Math.max(1, Math.floor((W - 2 * D) / (bw + gap))), x0 = Math.round((W - n * (bw + gap) + gap) / 2), by = L.H - 4 * D;
    for (var b = 0; b < n; b++) { rgBox2(ctx, x0 + b * (bw + gap), by, bw, 3 * D, RAIN_PAL.o100); ctx.fillStyle = RAIN_PAL.o50; ctx.fillRect(x0 + b * (bw + gap) + 4, by + 4, bw - 8, D - 1); }
  }
}
/* HUD 는 DOM · 값이 바뀔 때만 고친다 · 시간 제한이 없으므로 버틴 시간을 센다 */
function rgHud(now) {
  var surv = RG.t0 ? rgElapsed(now) : 0, survT = (Math.round(surv * 10) / 10).toFixed(1);
  var key = RG.score + "|" + survT + "|" + RG.lives + "|" + (RG.heartHit > 0 ? 1 : 0);
  if (key === RG.hud) return;
  RG.hud = key;
  var sc = rgEl("rgHudSc"), tm = rgEl("rgHudTm"), ht = rgEl("rgHudHt");
  if (sc) sc.textContent = RG.score.toLocaleString();
  if (tm) { tm.textContent = survT + "초"; tm.classList.toggle("hot", RG.lives <= 1); }
  if (ht) Array.prototype.forEach.call(ht.children, function (h, i) {
    h.className = i < RG.lives ? (RG.lives === 1 ? "on last" : "on") : (i === RG.lives && RG.heartHit > 0 ? "hit" : "");
  });
}
function rgDraw(ctx, now) {
  var L = RG.L; if (!L) return;
  rgHud(now);
  ctx.setTransform(RG.dpr, 0, 0, RG.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (RG.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 6));
  rgWorldD(ctx, L);
  /* 위험선 (점선) */
  ctx.fillStyle = RAIN_PAL.deep;
  for (var lx = 0; lx < L.W; lx += 3 * L.D) ctx.fillRect(lx, L.floor, 2 * L.D, 2);
  /* 단어 · v4.23 나무 이름표(rgWordDraw) · 글자 크기 고정 · 지금 치고 있는 글자와 맞는 단어를 짚어 준다 */
  var tIdx = rgTypedIdx(), tv = RG.typed || "";
  RG.words.forEach(function (w, wi) {
    rgWordDraw(ctx, L, w.x, rgWordY(w), w.bw, w.text, wi === tIdx, w.p > 0.78, tv);
  });
  if (RG.shot) {
    var k = 1 - RG.shot.t / 0.12, sx = RG.shot.x0 + (RG.shot.x1 - RG.shot.x0) * k, sy = RG.shot.y0 + (RG.shot.y1 - RG.shot.y0) * k, q = 2 * L.D;
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(Math.round(sx - q / 2), Math.round(sy - q / 2), q, q);
    ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(Math.round(sx - q / 2) + 2, Math.round(sy - q / 2) + 2, q - 4, q - 4);
  }
  /* 챗봇 · 원본 도트(22×26 칸 · 한 칸 L.D/2) · 떠 있기 = 몸 전체 한 칸 오르내림 · 명중 = 몸 전체 한 번 튀기기 · 콤보 5 이상 = 작은 챗봇이 옆에 · 동작 줄이기 = 전부 멈춘다 */
  var rm = rgReduced(), u = L.D / 2, bob = rm ? 0 : Math.floor(now / 300) % 2 * Math.round(L.D / 3);
  var hop = rm || !(RG.mas.hop > 0) ? 0 : Math.round(Math.sin(Math.PI * (1 - RG.mas.hop / 0.25)) * 2 * L.D);
  rgBotDraw(ctx, RG.mas.x, L.ground + bob - hop, RG_BOT.w, RG_BOT.h, u);
  if (RG.combo >= 5) rgBotDraw(ctx, RG.mas.x + L.masW / 2 + RG_BOT.bw * u / 2, L.ground + (rm ? 0 : Math.round(L.D / 3) - bob), RG_BOT.bw, RG_BOT.bh, u);
  RG.parts.forEach(function (p) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); });
  ctx.textAlign = "center";
  RG.pops.forEach(function (p) {   /* v4.23 도트 글자 · 16 밑으로 줄이지 않는다 · 노트북 배치는 한 단계 크게(32) */
    var ps = L.big ? 32 : 16; ctx.font = rtFont(ps);
    var tw = ctx.measureText(p.text).width / 2 + 6;
    rtText(ctx, p.text, Math.max(tw, Math.min(L.W - tw, p.x)), p.y, ps, p.c, RAIN_PAL.ink);
  });
  if (RG.banner) {   /* v4.23 어두운 이름표 배너 · 주황 도트 글자 */
    var bs = L.big ? 32 : 16, bh = L.big ? 52 : 34;
    ctx.font = rtFont(bs); var bw = ctx.measureText(RG.banner.text).width + 32, by = Math.round(L.floor * 0.42);
    rtTag(ctx, L.W / 2 - bw / 2, by, bw, bh, RT_PAL.night, RT_PAL.bark, RAIN_PAL.ink);
    rtText(ctx, RG.banner.text, L.W / 2, by + bh / 2, bs, RAIN_PAL.o100, null);
  }
  if (RG.ending) {   /* v4.23 공용 끝 화면(rtEnd) · 게임 고유 한 줄은 판 안에 그대로 */
    rtEnd(ctx, L.W, 0, L.floor, RG.ending.why === "cap" ? "여기까지" : "GAME OVER", RG.ending.why === "cap" ? "최대 시간에 닿았어요" : "단어 " + RG.lives0 + "개를 놓쳤어요",
      { s: L.D, tp: L.big ? 48 : 32, sp: L.big ? 32 : 16, maxW: L.big ? 640 : 320 });
  }
  if (RG.cd > 0) rtCount(ctx, RG.cd, L.W, 0, L.floor, L.big ? 96 : 64);
  ctx.restore();
}

/* Node 에서 규칙만 따로 돌려 보기 위한 통로(판 길이 시뮬레이션) · 브라우저에서는 쓰지 않는다 */
if (typeof module !== "undefined" && module.exports) module.exports = { RG: RG, RAIN_WORDS: RAIN_WORDS, rgSeed: rgSeed, rgRnd: rgRnd, rgShuf: rgShuf, rgPickWord: rgPickWord, rgLayout: rgLayout, rgUpdate: rgUpdate, rgSpawn: rgSpawn, rgStat: rgStat, rgRamp: rgRamp };
