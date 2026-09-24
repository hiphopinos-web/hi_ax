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
   v4.29(260924 사용자 확정) 소나기 묶음 네 가지:
     ① 영어 단어 전부 제외(AX · AI · DAP) · 판이 영단어로 열리던 원인이었다.
     ② 영문 자판이어도 한글로 친다 · 누른 로마자 키를 두벌식으로 바꿔 입력창에 넣는다(rgHgAdd · 조합 · 받침 넘김 · Backspace 낱자 단위) · 한글 자판 조합(IME)은 건드리지 않는다.
     ③ 넓은 화면 솔로 = 판 폭을 줄이고 오른쪽 옆판(NEXT 3개 · TOP 5 · 점수·목숨·단계) · 대전과 휴대폰은 그대로.
     ④ 솔로(app · site) 키보드 기기는 대기 화면에서 스페이스를 눌러 본인이 시작한다 · 터치 기기와 대전(방 시작)은 그대로.
   v4.32(260924 사용자 확정) 넓은 화면 3단 배치 · 왼쪽 판(게임 전 = 시작 안내 · 게임 중 = NEXT 3개 + 점수·목숨·단계) · 가운데 게임판(세로가 긴 비율) · 오른쪽 판(순위 TOP 10 · 내 기록 강조).
     앱 솔로(넓은 화면)와 1F 현장 셀프 모드가 같은 배치 · 휴대폰 · 폭 960 미만 · 대전(선수 화면)은 그대로.
     효과음 채움 · 오타(rgmiss) · 콤보 5·10·15…(rgcombo) · 마지막 목숨(rglast) · 소리는 화면 쪽 sfx 가 있을 때만(선수 화면에는 없다).
   ══════════════════════════════════════════════════════════════════════════ */

/* ═══ 단어 풀 · 여기 한 곳 ═══
   260917 원본(행사 어휘 73개 · 뜻 없음)으로 되돌렸다. 260918 의 「AI 기본 소양 30개 + 칸마다 뜻」은 폐기(사용자 확정 260923).
   게임 중에 긴 글·모달·정지를 넣지 않는다. 뜻 표시도 되새김 화면도 두지 않는다.
   확정 문서·앱에 이미 있는 어휘에서 짧은 단어 위주 · 공백이 든 말(ME to WE 등)은 판정이 어려워 뺐다.
   v4.29(260924 사용자 확정) 영어 단어는 하나도 두지 않는다(AX · AI · DAP 삭제) · 1단계(3자 이하)가 영단어로 열려 자판 전환부터 시켰다 · 로마자 키는 두벌식 한글로 바뀌어 들어간다(아래 rgHgAdd).
   단계가 오를수록 긴 단어 비중이 커진다(1단계 3자 이하 · 2단계부터 전부). */
var RAIN_WORDS = [
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
var RAIN_SIDE_MIN = 960;                      /* v4.29 옆판을 붙이는 캔버스 최소 폭 · v4.32 3단(왼쪽 판 + 게임판 + 오른쪽 판) · 이보다 좁으면 옛 배치 그대로 */
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

var RG = { on: false, mode: "app", big: false, raf: 0, last: 0, t0: 0, cd: 0, words: [], ghost: [], seq: 0, parts: [], pops: [], lives: RAIN_LIVES, score: 0, hits: 0, tries: 0, combo: 0, maxCombo: 0, stage: 1, spawnT: 0, shake: 0, banner: null, shot: null, mas: { x: 90, tx: 90, hop: 0 }, res: null, L: null, dpr: 1, seed: 0, rs: 0, lives0: RAIN_LIVES, cap: RAIN_CAP_SEC, wait: false, next: null, top: null, topT: "", who: "", hk: false };   /* v4.32 topT = 오른쪽 판 제목 · who = 왼쪽 판 도전자 닉네임(현장 셀프) · 화면 쪽이 넣는다 */
var RGP = { on: false, touch: false, go: false };

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
/* v4.29 side = 넓은 화면 솔로 옆판 · 판 폭(L.W)을 줄이고 캔버스 안에 판을 붙인다 · 판 규칙(레인 · 낙하 · 판정선)은 줄인 폭으로 계산한다
   v4.32 3단 · 게임판 = 높이 × 0.8(440~760 · 세로가 긴 비율) · 캔버스 가운데 · 양옆 판 = 남은 폭을 반씩(200~420) · 왼쪽 L.lp · 오른쪽 L.pan
   좁으면(960 부근) 양옆 판 200 을 먼저 지키고 게임판이 줄어든다 · L.ox = 게임판 왼쪽 끝 */
function rgLayout(W, H, big, side) {
  var L = { W: W, H: H, big: big, CW: W, ox: 0, pan: null, lp: null };
  if (side && big && W >= RAIN_SIDE_MIN) {
    var gap = 16, bw = Math.max(440, Math.min(760, Math.round(H * 0.8))), pw = Math.floor((W - bw - 4 * gap) / 2);
    if (pw < 200) { pw = 200; bw = W - 2 * pw - 4 * gap; }
    pw = Math.min(420, pw);
    var ox = Math.round((W - bw) / 2);
    L.W = W = bw; L.ox = ox;
    L.lp = { x: ox - gap - pw, y: 12, w: pw, h: H - 24 };
    L.pan = { x: ox + bw + gap, y: 12, w: pw, h: H - 24 };
  }
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
/* 옆판을 붙이는 판인가 · 넓은 화면(RG.big) 솔로만 · 대전(race)은 네 기기 화면을 똑같이 둔다 */
function rgSideOn() { return !!RG.big && RG.mode !== "race"; }
function rgFontStr(px) { return "800 " + px + "px " + RAIN_FONT; }
function rtFont(px) { return Math.round(px) + "px " + RT_FONT; }
function rgWordY(w) { var L = RG.L; return L.top + Math.min(1, w.p) * L.fallPx; }
function rgRamp(sec) { return Math.max(RAIN_RAMP_MIN, 1 - Math.max(0, sec - RAIN_RAMP_FROM) / RAIN_RAMP_SPAN * (1 - RAIN_RAMP_MIN)); }
function rgElapsed(now) { return RG.t0 ? (now - RG.t0) / 1000 : 0; }

/* 캔버스 = 보이는 크기 × dpr(상한 2) · 배치 규칙을 다시 계산하고 바로 한 번 그린다 */
function rgFit(cv, w, h) {
  if (!w || !h) return;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  if (RG.L && RG.L.CW === w && RG.L.H === h && cv.width === Math.round(w * dpr)) return;   /* visualViewport scroll 로 같은 크기가 또 오면 무시 */
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  RG.dpr = cv.width / w;
  var oldFont = RG.L ? RG.L.font : 0;
  RG.L = rgLayout(w, h, RG.big, rgSideOn());
  var ctx = cv.getContext("2d"), gw = RG.L.W;   /* 판 폭 · 옆판이 있으면 캔버스보다 좁다 */
  if (oldFont !== RG.L.font) { ctx.font = rtFont(RG.L.tf); RG.words.forEach(function (x) { x.bw = Math.ceil(ctx.measureText(x.text).width) + RG.L.padX * 2; }); }
  RG.words.forEach(function (x) { x.x = Math.max(8, Math.min(gw - 8 - x.bw, x.x)); });
  if (!RG.mas.set) { RG.mas.x = RG.mas.tx = gw / 2; RG.mas.set = true; }
  RG.mas.x = Math.min(RG.mas.x, gw - RG.L.masW / 2); RG.mas.tx = Math.min(RG.mas.tx, gw - RG.L.masW / 2);
  rgDraw(ctx, performance.now());
}

/* ═══ 입력 ═══
   한글 조합(iOS 대응): 입력창 노드는 한 판 내내 절대 바꾸지 않는다(교체하면 사파리에서 포커스·IME 가 끊겨 글자가 먹힌다).
   판정은 input 이벤트에서 조합 중 글자까지 포함해 본다(iOS 는 compositionend 가 늦게 와서 기다리면 단어가 안 터진다) · 같은 단어 중복 판정은 400ms 안에서 막는다.
   비우기는 value = "" 한 줄 · 조합이 열려 있을 때만 같은 노드를 한 번 blur→focus 해서 조합 버퍼를 끊는다.
   실시간 판정(터치 기기만): 입력이 떨어지는 단어와 정확히 같아지는 순간 Enter 없이 터진다 · PC 는 Enter 판정 유지.
   ※ 이 두 가지(아이폰 핫픽스 · 입력창 자동 비우기)는 260923 에도 유지 결정. 재미와 무관한 순수 개선이다.
   v4.29 영문 자판 = 로마자 키를 두벌식 한글로 바꿔 넣는다 · 노트북은 keydown(e.code = 누른 자리 · Shift = 쌍자음 · CapsLock 무시) · 휴대폰은 beforeinput(한 글자씩 들어올 때) ·
     조합으로 들어오는 로마자(휴대폰 영문 자판 단어 조합)는 값을 건드리지 않고 판정만 한글로 본다(조합 중에 값을 바꾸면 자판이 글자를 되풀이한다) · 조합이 끝나면 바꿔 넣는다.
     한글 자판 조합(isComposing · keyCode 229)은 손대지 않는다 · RG.hk = 지금 마지막 글자가 이 변환으로 만든 열린 글자(다음 키가 붙는다) · 다른 입력·지우기·이동이 오면 닫힌다. */
function rgBindInput(inp) {
  if (!inp || inp._rgb) return; inp._rgb = 1;
  inp.addEventListener("compositionstart", function () { RG.composing = true; RG.hk = false; });
  inp.addEventListener("compositionend", function () { rgCompEnd(); });
  inp.addEventListener("keydown", function (e) { if (e.key === "Escape" && inp === rgEl("rgIn")) { e.preventDefault(); rgAutoClear(); return; } rgHgKey(e, inp); });   /* Esc = 즉시 비우기 · 그 밖 = 로마자 → 한글 */
  inp.addEventListener("beforeinput", function (e) { rgHgBefore(e, inp); });
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
  var inp = rgEl("rgIn"); if (!inp) return;
  var raw = inp.value, lat = /[A-Za-z]/.test(raw);
  if (e && !lat) RG.hk = false;                   /* v4.29 다른 입력(한글 자판 조합 · 지우기)이 들어왔다 → 로마자 조합은 닫는다 */
  if (lat && !RG.composing && !(e && e.isComposing)) { raw = rgHangulize(raw, RG.hk).slice(0, 12); inp.value = raw; RG.hk = true; lat = false; }   /* 조합 없이 들어온 로마자는 그 자리에서 한글로 */
  if (!RGP.on || !RG.on || RG.cd > 0 || RG.ending || RG.paused) return;
  var v = (lat ? rgHangulize(raw, RG.hk) : raw).trim();   /* 조합 중 로마자(휴대폰 영문 자판)는 값을 두고 판정만 한글로 본다 */
  RG.typed = v;                                   /* 조합 중 글자도 화면에서 짚어 준다 */
  RG.latT = rgLatinOnly(raw.trim()) ? (RG.latT || performance.now()) : 0;   /* 안내 한 줄은 보조 · 로마자가 한글로 안 바뀐 채 2초 남아 있을 때만 */
  if (!RG.latT) rgTipShow(false);
  if (RGP.touch && v && RG.words.some(function (w) { return w.text === v; })) { rgSubmit(); return; }
  rgCheckInput(v);
}
/* 치던 단어가 사라지면 입력창을 바로 비운다 · 「아직 맞는 앞부분」까지만 남긴다(오타 한 글자 때문에 단어를 통째로 잃지 않게).
   조합이 열려 있을 때는 앞부분만 남기지 않는다(IME 가 그 글자 위에 계속 조합해서 뒤죽박죽이 된다) → 통째로 비운다.
   자동으로 지운 글자는 오타(RG.tries)로 세지 않는다 → 점수·정확도 불변. */
/* v4.25 한글 조합 중간 상태까지 살리는 앞부분 판정 · 두벌식은 치는 도중 「공감」→「고」, 「세션」→「셋」, 「확산」→「홗」 을 반드시 거친다.
   글자 그대로 비교하면 이 순간 「맞는 단어 없음」이 되어 입력창이 비워졌다(260924 · 음절 조합 키보드 = PC 윈도우 IME · Gboard · 아이폰에서 받침 단어를 못 맞힘).
   그래서 값과 단어를 자모열로 풀어 앞부분을 비교한다 · 겹받침·겹모음도 낱자로 푼다(ㄳ→ㄱㅅ · ㅘ→ㅗㅏ). */
var RG_CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ",
  RG_JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅗㅏ", "ㅗㅐ", "ㅗㅣ", "ㅛ", "ㅜ", "ㅜㅓ", "ㅜㅔ", "ㅜㅣ", "ㅠ", "ㅡ", "ㅡㅣ", "ㅣ"],
  RG_JONG = ["", "ㄱ", "ㄲ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ", "ㄹ", "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ", "ㅁ", "ㅂ", "ㅂㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"],
  RG_LONE = { "ㄳ": "ㄱㅅ", "ㄵ": "ㄴㅈ", "ㄶ": "ㄴㅎ", "ㄺ": "ㄹㄱ", "ㄻ": "ㄹㅁ", "ㄼ": "ㄹㅂ", "ㄽ": "ㄹㅅ", "ㄾ": "ㄹㅌ", "ㄿ": "ㄹㅍ", "ㅀ": "ㄹㅎ", "ㅄ": "ㅂㅅ", "ㅘ": "ㅗㅏ", "ㅙ": "ㅗㅐ", "ㅚ": "ㅗㅣ", "ㅝ": "ㅜㅓ", "ㅞ": "ㅜㅔ", "ㅟ": "ㅜㅣ", "ㅢ": "ㅡㅣ" };
function rgJm(s) {
  var o = "";
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i), c = s.charCodeAt(i) - 0xAC00;
    if (c >= 0 && c <= 11171) o += RG_CHO.charAt(Math.floor(c / 588)) + RG_JUNG[Math.floor((c % 588) / 28)] + RG_JONG[c % 28];
    else o += RG_LONE[ch] || ch;
  }
  return o;
}
function rgPre(w, v) { if (w.jm == null || w.jmOf !== w.text) { w.jm = rgJm(w.text); w.jmOf = w.text; } return w.jm.indexOf(rgJm(v)) === 0; }
function rgPrefixAlive(v) { return RG.words.some(function (w) { return rgPre(w, v); }); }
/* ═══ v4.29 두벌식 변환 · 영문 자판으로 눌러도 한글이 들어간다 (260924 사용자 확정) ═══
   영어 단어가 없으니 로마자 입력은 전부 한글 의도다 · 키 자리 = 두벌식 표준 배열 · Shift = 쌍자음(ㄲㄸㅃㅆㅉ)·ㅒ·ㅖ · 다른 글자는 Shift 무시.
   조합 규칙(한글 자판과 같다): 자음은 받침으로 붙고(ㄸㅃㅉ 는 받침이 안 된다) · 받침 + 자음이 겹받침이면 합친다 · 받침 뒤 모음이 오면 받침(겹받침은 뒤 자음)이 다음 글자 초성으로 넘어간다 ·
   모음 + 모음이 겹모음이면 합친다 · 홀로 선 자음 + 모음 = 글자 · Backspace = 마지막 낱자 하나(겹받침·겹모음도 한 낱자씩). */
var RG_HV = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ",
  RG_HT = "_ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ",   /* 받침 · 0 = 없음 */
  RG_HVV = { "ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ", "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ", "ㅡㅣ": "ㅢ" },
  RG_HTT = { "ㄱㅅ": "ㄳ", "ㄴㅈ": "ㄵ", "ㄴㅎ": "ㄶ", "ㄹㄱ": "ㄺ", "ㄹㅁ": "ㄻ", "ㄹㅂ": "ㄼ", "ㄹㅅ": "ㄽ", "ㄹㅌ": "ㄾ", "ㄹㅍ": "ㄿ", "ㄹㅎ": "ㅀ", "ㅂㅅ": "ㅄ" },
  RG_HKEY = { Q: "ㅂㅃ", W: "ㅈㅉ", E: "ㄷㄸ", R: "ㄱㄲ", T: "ㅅㅆ", Y: "ㅛ", U: "ㅕ", I: "ㅑ", O: "ㅐㅒ", P: "ㅔㅖ", A: "ㅁ", S: "ㄴ", D: "ㅇ", F: "ㄹ", G: "ㅎ", H: "ㅗ", J: "ㅓ", K: "ㅏ", L: "ㅣ", Z: "ㅋ", X: "ㅌ", C: "ㅊ", V: "ㅍ", B: "ㅠ", N: "ㅜ", M: "ㅡ" };
/* 키 → 낱자 · k = 로마자(대소문자 무관) · sh = Shift */
function rgHgMap(k, sh) { var m = RG_HKEY[String(k).toUpperCase()] || ""; return sh && m.length > 1 ? m.charAt(1) : m.charAt(0); }
function rgHgSyl(c, v, t) { return String.fromCharCode(0xAC00 + (c * 21 + v) * 28 + t); }
function rgHgKey2(map, ch) { for (var k in map) if (map[k] === ch) return k; return ""; }
/* 문자열 s 끝에 낱자 j 를 친다 · open = 마지막 글자가 아직 열려 있다(이어 붙여도 된다) */
function rgHgAdd(s, j, open) {
  if (!j) return s;
  var last = s.slice(-1), head = s.slice(0, -1), code = last ? last.charCodeAt(0) - 0xAC00 : -1, isV = RG_HV.indexOf(j) >= 0;
  if (open && last) {
    if (code >= 0 && code <= 11171) {
      var c = Math.floor(code / 588), v = Math.floor((code % 588) / 28), t = code % 28;
      if (!isV) {
        if (!t) { var ti = RG_HT.indexOf(j); if (ti > 0) return head + rgHgSyl(c, v, ti); }
        else { var tt = RG_HTT[RG_HT.charAt(t) + j]; if (tt) return head + rgHgSyl(c, v, RG_HT.indexOf(tt)); }
      } else if (t) {   /* 받침 넘김 · 겹받침은 뒤 자음만 넘어간다 */
        var sp = rgHgKey2(RG_HTT, RG_HT.charAt(t)), mv = sp ? sp.charAt(1) : RG_HT.charAt(t);
        return head + rgHgSyl(c, v, sp ? RG_HT.indexOf(sp.charAt(0)) : 0) + rgHgSyl(RG_CHO.indexOf(mv), RG_HV.indexOf(j), 0);
      } else { var vv = RG_HVV[RG_HV.charAt(v) + j]; if (vv) return head + rgHgSyl(c, RG_HV.indexOf(vv), 0); }
    } else if (isV) {
      var ci = RG_CHO.indexOf(last); if (ci >= 0) return head + rgHgSyl(ci, RG_HV.indexOf(j), 0);
      var lv = RG_HVV[last + j]; if (lv) return head + lv;
    }
  }
  return s + j;
}
/* 마지막 낱자 하나 지우기 · { s, on } · 글자가 다 지워지면 닫힌다(다음 Backspace 는 앞 글자를 통째로) */
function rgHgBack(s) {
  var last = s.slice(-1), head = s.slice(0, -1), code = last ? last.charCodeAt(0) - 0xAC00 : -1;
  if (code >= 0 && code <= 11171) {
    var c = Math.floor(code / 588), v = Math.floor((code % 588) / 28), t = code % 28;
    if (t) { var sp = rgHgKey2(RG_HTT, RG_HT.charAt(t)); return { s: head + rgHgSyl(c, v, sp ? RG_HT.indexOf(sp.charAt(0)) : 0), on: true }; }
    var vs = rgHgKey2(RG_HVV, RG_HV.charAt(v));
    return { s: head + (vs ? rgHgSyl(c, RG_HV.indexOf(vs.charAt(0)), 0) : RG_CHO.charAt(c)), on: true };
  }
  var lv = rgHgKey2(RG_HVV, last); if (lv) return { s: head + lv.charAt(0), on: true };
  return { s: head, on: false };
}
/* 로마자가 섞인 값 전체를 한글로 · 첫 로마자 앞은 그대로 두고 그 앞 글자가 열려 있으면(open) 이어 붙인다 · 대문자 = Shift */
function rgHangulize(raw, open) {
  var f = raw.search(/[A-Za-z]/); if (f < 0) return raw;
  var out = raw.slice(0, f), op = !!open && f > 0;
  for (var i = f; i < raw.length; i++) {
    var ch = raw.charAt(i);
    if (/[A-Za-z]/.test(ch)) { out = rgHgAdd(out, rgHgMap(ch, ch !== ch.toLowerCase()), op); op = true; }
    else { out += ch; op = false; }
  }
  return out;
}
/* 입력창 값 = 판정에 쓰는 글자(로마자가 남아 있으면 한글로 본 값) */
function rgInVal() { var inp = rgEl("rgIn"); if (!inp) return ""; var raw = inp.value; return (/[A-Za-z]/.test(raw) ? rgHangulize(raw, RG.hk) : raw).trim(); }
/* 노트북 · 로마자 키 = 누른 자리(e.code)로 · 한글 자판 조합(229 · isComposing)과 단축키는 그대로 둔다 */
function rgHgKey(e, inp) {
  if (e.isComposing || e.keyCode === 229 || RG.composing || e.ctrlKey || e.metaKey || e.altKey || inp.disabled) return;
  var k = e.key || "", m = /^Key([A-Z])$/.exec(e.code || "");
  if (k === "Backspace") { if (RG.hk && inp.value && inp.selectionStart === inp.value.length && inp.selectionEnd === inp.value.length) { e.preventDefault(); rgHgDel(inp); } return; }
  if (m && /^[A-Za-z]$/.test(k)) { e.preventDefault(); rgHgPut(inp, rgHgMap(m[1], e.shiftKey)); return; }
  if (k.length === 1 || /^(Enter|Tab|Delete|Home|End|Arrow)/.test(k)) RG.hk = false;   /* 다른 글자 · 이동 = 조합 끝 */
}
/* 휴대폰 · 조합 없이 한 글자씩 들어오는 로마자(쿼티 영문 · 예측 끔) · 조합으로 들어오면 rgLive 가 판정만 한글로 본다 */
function rgHgBefore(e, inp) {
  if (e.isComposing || RG.composing || inp.disabled) return;
  var d = e.data || "";
  if (e.inputType === "insertText" && /^[A-Za-z]$/.test(d)) { e.preventDefault(); rgHgPut(inp, rgHgMap(d, d !== d.toLowerCase())); }
  else if (e.inputType === "deleteContentBackward" && RG.hk && inp.value && inp.selectionStart === inp.value.length && inp.selectionEnd === inp.value.length) { e.preventDefault(); rgHgDel(inp); }
}
function rgHgPut(inp, j) {
  if (!j) return;
  var s = rgHgAdd(inp.value, j, RG.hk);
  if (s.length > 12) return;   /* 입력창 maxlength 12 · 값을 코드로 넣으면 maxlength 가 걸리지 않는다 */
  inp.value = s; RG.hk = true;
  rgLive(null);
}
function rgHgDel(inp) { var b = rgHgBack(inp.value); inp.value = b.s; RG.hk = b.on; rgLive(null); }
function rgAutoClear() {
  var inp = rgEl("rgIn"); if (!inp || !inp.value) return;
  var v = rgInVal(), keep = "";
  for (var n = v.length - 1; n > 0; n--) { if (rgPrefixAlive(v.slice(0, n))) { keep = v.slice(0, n); break; } }
  if (keep && !RG.composing) { inp.value = keep; RG.typed = keep; if (document.activeElement !== inp) inp.focus(); }
  else { rgClearInput(); RG.typed = ""; }
  rgFlash("auto");
  rgSfx("tik");
}
function rgCheckInput(v) {
  if (!RG.on || RG.cd > 0 || RG.ending || RG.paused) return;
  var inp = rgEl("rgIn"); if (!inp) return;
  if (v == null) v = rgInVal();
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
  RG.words.forEach(function (w, i) { if (rgPre(w, v) && (hit < 0 || w.p > RG.words[hit].p)) hit = i; });   /* v4.25 조합 중간(셋·홗)에도 짚은 단어가 깜빡이지 않게 */
  return hit;
}
function rgClearInput() {
  RG.typed = ""; RG.hk = false;
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
/* v4.29 솔로는 다음 세 단어를 미리 뽑아 둔다 · 옆판 NEXT = RG.next 그대로 = 실제로 내려올 차례(rgSpawn 이 앞에서 하나씩 꺼낸다).
   미리 뽑아도 겹치지 않는다: 뽑을 때 화면 단어와 최근 6개를 거르고, 그 사이에 나올 단어(앞 차례 셋)는 최근 6개 안에 있다.
   대전(시드)은 v4.28 순서 그대로 둔다(옆판이 없고, 뽑는 시점이 바뀌면 옛 판과 순서가 달라진다). */
function rgNextFill() { var q = RG.next || (RG.next = []); while (q.length < 3) q.push(rgPickWord()); return q; }
function rgNextWord() {
  if (RG.seed) return rgPickWord();
  var w = rgNextFill().shift(); rgNextFill();
  return w;
}

/* ═══ 판 ═══ */
function rgStop() { RG.on = false; if (RG.raf) cancelAnimationFrame(RG.raf); RG.raf = 0; if (typeof rgPlayClose === "function") rgPlayClose(); }
/* mode: "app" 솔로 · "site" 스태프 노트북 솔로 · "race" 서버 대전(시드 필수)
   opt: { seed, lives, cap, t0, cd, wait } · t0 을 주면(대전) 그 시각에 맞춰 시작한다
   v4.29 wait = 대기 화면(「SPACE를 눌러 시작」) · 기본 = 솔로 + 키보드 기기 · 터치 기기와 대전은 바로 카운트다운 · RGP.go = 스페이스로 들어왔으니 대기를 건너뛴다 */
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
  RG.wait = opt.wait != null ? !!opt.wait : (RG.mode !== "race" && !rgTouch() && !RGP.go);
  RGP.go = false;
  RG.next = null; RG.top = null; RG.hk = false;
  if (!RG.seed) rgNextFill();   /* 대기 화면부터 옆판 NEXT 가 보인다 */
  try { if (typeof SFX !== "undefined") SFX.site = RG.mode !== "app"; } catch (e) {}
  if (typeof rgPlayOpen === "function") rgPlayOpen();
  var inp = rgEl("rgIn"); rgBindInput(inp); if (inp) inp.focus();
  RG.raf = requestAnimationFrame(rgFrame);
}
/* 대기 → 카운트다운 · 스페이스(키보드) · 판을 누르기(마우스) */
function rgBegin() {
  if (!RG.on || !RG.wait || RG.paused) return;
  RG.wait = false; RG.last = performance.now();
  rgClearInput();   /* 기다리는 동안 친 글자는 버린다 */
  rgSfx("click");
}
/* 문서 전체에서 스페이스를 먼저 받는다(입력창에 공백이 들어가기 전) · 대기 중일 때만 · 판 도중 스페이스는 원래대로 */
function rgKeyDoc(e) {
  if (!RG.on || !RG.wait || RG.paused) return;
  if (e.code !== "Space" && e.key !== " ") return;
  if (e.isComposing || e.keyCode === 229) return;
  e.preventDefault();
  if (!e.repeat) rgBegin();
}
if (typeof document !== "undefined" && document && typeof document.addEventListener === "function") document.addEventListener("keydown", rgKeyDoc, true);
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
  var ctx = cv.getContext("2d"), text = rgNextWord();
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
  if (RG.wait) { rgFx(dt); return; }   /* v4.29 대기 · 스페이스를 기다린다 */
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
      if (RG.lives === 1) { RG.banner = { text: "마지막 목숨", t: 1.0 }; rgSfx("rglast"); }   /* v4.32 경고음 */
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
  var v = rgInVal();
  if (!v) { if (inp.value) { rgClearInput(); rgFlash("auto"); }  /* 빈 판정(공백만)도 즉시 비움 · 오타 아님 */
    return; }
  var tnow = performance.now();
  if (RG.lastHit && RG.lastHit.v === v && tnow - RG.lastHit.t < 400) { rgClearInput(); return; }   /* 한 단어가 두 번 터지지 않게 (iOS 는 input 이 연달아 온다) */
  rgClearInput();
  RG.tries++;
  var hit = -1;
  RG.words.forEach(function (w, i) { if (w.text === v && (hit < 0 || w.p > RG.words[hit].p)) hit = i; });
  if (hit < 0) {
    /* 오타에 벌칙 없음 · 콤보를 끊지 않고 테두리 한 번 + 짧은 소리만 · 하트도 줄지 않는다 · v4.32 오타 소리(rgmiss · 낮은 두 음) · 자동 비우기(tik)와 구별 */
    rgFlash("miss");
    rgSfx("rgmiss");
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
  if (RG.combo >= 5 && RG.combo % 5 === 0) rgSfx("rgcombo", RG.combo / 5);   /* v4.32 콤보 5 · 10 · 15 … 오르는 음 한 줄 */
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
  if (L.pan) {   /* v4.29 옆판 배치 · 바깥은 어두운 판 · 게임판 양옆 먹색 테두리 */
    ctx.fillStyle = RT_PAL.night; ctx.fillRect(0, 0, L.CW, L.H);
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(L.ox - 4, 0, L.W + 8, L.H);
  }
  ctx.save();
  if (L.pan) { ctx.translate(L.ox, 0); ctx.beginPath(); ctx.rect(0, 0, L.W, L.H); ctx.clip(); }
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
  if (RG.wait) rgWaitDraw(ctx, L, now);
  else if (RG.cd > 0) rtCount(ctx, RG.cd, L.W, 0, L.floor, L.big ? 96 : 64);
  ctx.restore();
  if (L.pan) { rgLeftDraw(ctx, L); rgSideDraw(ctx, L); }   /* v4.32 3단 · 흔들림 밖 */
}
/* v4.29 대기 화면 · 어두운 이름표 + 도트 글자 밝기 깜빡임(0.53초마다 O100 ↔ 어두운 오렌지 · 글자는 늘 보인다) · 동작 줄이기 = 주황 고정 */
function rgWaitDraw(ctx, L, now) {
  var on = rgReduced() || Math.floor(now / 530) % 2 === 0, px = L.big ? 32 : 16, th = L.big ? 56 : 34, t = "SPACE를 눌러 시작";
  ctx.save();
  ctx.font = rtFont(px); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  var tw = Math.ceil(ctx.measureText(t).width) + (L.big ? 48 : 28), y = Math.round(L.floor * 0.42);
  rtTag(ctx, L.W / 2 - tw / 2, y, tw, th, RT_PAL.night, RT_PAL.bark, RAIN_PAL.ink);
  rtText(ctx, t, L.W / 2, y + th / 2, px, on ? RAIN_PAL.o100 : RAIN_PAL.deep, null);   /* 글자는 사라지지 않고 밝기만 오간다(O100 ↔ 어두운 오렌지) · 빈 상자로 보이지 않게 */
  ctx.restore();
}
/* v4.32 3단 배치의 양옆 판 · 나무 이중 테두리 판(rtPanel) · 글자는 16 · 32(도트 글꼴이 또렷한 크기)만 쓴다 · 판 높이 500 미만은 제목도 16 · 순위 줄은 높이 700 · 폭 400 이상에서만 32 */
/* 한 줄 폭을 넘으면 띄어쓰기에서 나눈다(16px 안내 문장용) */
function rgWrap(ctx, text, maxW) {
  var out = [], line = "";
  String(text).split(" ").forEach(function (w) {
    var t = line ? line + " " + w : w;
    if (line && ctx.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
  });
  if (line) out.push(line);
  return out;
}
/* 왼쪽 판 · 도전자(현장 셀프 · RG.who) · 게임 전(대기) = 시작 안내 · 게임 중 = NEXT 3개(RG.next) · 아래 점수·목숨·단계 */
function rgLeftDraw(ctx, L) {
  var P = L.lp; if (!P) return;
  var s = 2, cmp = P.h < 500, hp = cmp ? 16 : 32, tp = cmp ? 16 : 32, th = cmp ? 32 : 52, bh = cmp ? 36 : 46, lh = cmp ? 24 : 30;
  var ix = P.x + 5 * s + 8, right = P.x + P.w - 5 * s - 8, iw = right - ix, cy = P.y + 5 * s + 10;
  ctx.save();
  rtPanel(ctx, P.x, P.y, P.w, P.h, s, RT_PAL.night);
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  if (RG.who) {
    ctx.font = rtFont(hp); var who = String(RG.who);
    while (who.length > 1 && ctx.measureText(who).width > iw) who = who.slice(0, -1);
    rtText(ctx, who, ix, cy + hp / 2, hp, RAIN_PAL.o100, RAIN_PAL.ink); cy += hp + (cmp ? 4 : 8);
    rtText(ctx, "도전 중", ix, cy + 8, 16, RT_PAL.tan, null); cy += 16 + (cmp ? 12 : 20);
  }
  if (RG.wait) {
    rtText(ctx, "시작 안내", ix, cy + hp / 2, hp, RAIN_PAL.o100, RAIN_PAL.ink); cy += hp + (cmp ? 10 : 16);
    ctx.font = rtFont(16);
    ["SPACE를 누르면 시작", "떨어지는 단어를 치고 Enter", "단어가 바닥에 닿으면 목숨 하나", "목숨 " + (RG.lives0 || RAIN_LIVES) + "개를 다 잃으면 끝"].forEach(function (t, k) {
      rgWrap(ctx, t, iw).forEach(function (ln) { rtText(ctx, ln, ix, cy + lh / 2, 16, k === 0 ? RAIN_PAL.o60 : RT_PAL.cream, null); cy += lh; });
      cy += cmp ? 4 : 8;
    });
  } else {
    rtText(ctx, "NEXT", ix, cy + hp / 2, hp, RAIN_PAL.o100, RAIN_PAL.ink); cy += hp + (cmp ? 8 : 12);
    var q = RG.next || [];
    for (var i = 0; i < 3; i++) {
      if (q[i]) {
        ctx.font = rtFont(tp); var bw = Math.min(iw, Math.ceil(ctx.measureText(q[i]).width) + tp);
        if (i === 0) rtTag(ctx, ix, cy, bw, th, RT_PAL.tan2, RT_PAL.cream, RT_PAL.tan);
        else rtTag(ctx, ix, cy, bw, th, RT_PAL.bark, RT_PAL.wood, RAIN_PAL.ink);
        ctx.textAlign = "left"; rtText(ctx, q[i], ix + tp / 2, cy + th / 2, tp, i === 0 ? RT_PAL.bark : RT_PAL.cream, null);
      }
      cy += th + (cmp ? 6 : 10);
    }
  }
  var by = P.y + P.h - 5 * s - 10 - bh * 3;
  [["점수", RG.score.toLocaleString()], ["목숨", null], ["단계", String(RG.stage)]].forEach(function (r, k) {
    var yy = by + k * bh + bh / 2;
    ctx.textAlign = "left"; rtText(ctx, r[0], ix, yy, hp, RT_PAL.tan, null);
    if (r[1] != null) { ctx.textAlign = "right"; rtText(ctx, r[1], right, yy, 32, RAIN_PAL.o100, RAIN_PAL.ink); }
    else rgSideHearts(ctx, right, yy, cmp ? 3 : 4);
  });
  ctx.restore();
}
/* 오른쪽 판 · 순위 TOP 10(RG.top · 화면 쪽이 서버 순위판을 읽어 넣는다) · 내 기록(me) = 진한 나무 띠 + 주황 글자
   RG.top = null(불러오는 중) · [](기록 없음) · [{ no, name, val, me }] · 제목 = RG.topT(화면 쪽) 또는 「TOP 10」 · 넓은 판(400 이상 · 높이 700 이상)은 32 */
function rgSideDraw(ctx, L) {
  var P = L.pan; if (!P) return;
  var s = 2, cmp = P.h < 500, hp = cmp ? 16 : 32, rf = P.h >= 700 && P.w >= 400 ? 32 : 16, rh = rf === 32 ? 46 : cmp ? 26 : 34;
  var ix = P.x + 5 * s + 8, right = P.x + P.w - 5 * s - 8, iw = right - ix, cy = P.y + 5 * s + 10, lim = P.y + P.h - 5 * s - 10;
  ctx.save();
  rtPanel(ctx, P.x, P.y, P.w, P.h, s, RT_PAL.night);
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  rtText(ctx, RG.topT || "TOP 10", ix, cy + hp / 2, hp, RAIN_PAL.o100, RAIN_PAL.ink); cy += hp + (cmp ? 10 : 18);
  var top = RG.top;
  if (!top || !top.length) rtText(ctx, top ? "아직 기록이 없어요" : "불러오는 중", ix, cy + rh / 2, 16, RT_PAL.tan, null);
  else for (var j = 0; j < Math.min(10, top.length) && cy + rh <= lim; j++) {
    var x = top[j], yy = cy + rh / 2, val = String(x.val || ""), nm = String(x.name || ""), no = String(x.no);
    if (x.me) rtTag(ctx, ix - 6, cy + 2, iw + 12, rh - 4, RT_PAL.wood, RAIN_PAL.soil, RAIN_PAL.ink);
    ctx.font = rtFont(rf);
    var nx = ix + ctx.measureText("10").width + 10;
    ctx.textAlign = "left"; rtText(ctx, no, ix, yy, rf, x.me || x.no <= 3 ? RAIN_PAL.o100 : RT_PAL.tan, null);
    ctx.textAlign = "right"; rtText(ctx, val, right, yy, rf, x.me ? RAIN_PAL.o100 : RT_PAL.cream, null);
    ctx.font = rtFont(rf);
    var mw = right - ctx.measureText(val).width - 12 - nx;
    while (nm.length > 1 && ctx.measureText(nm).width > mw) nm = nm.slice(0, -1);
    ctx.textAlign = "left"; rtText(ctx, nm, nx, yy, rf, x.me ? RAIN_PAL.o100 : RT_PAL.cream, null);
    cy += rh;
  }
  ctx.restore();
}
/* 옆판 하트 · 앱 HUD 하트와 같은 7×6 도트 · 남은 목숨 O100 · 잃은 목숨 진한 나무 · 오른쪽 끝 맞춤 */
function rgSideHearts(ctx, right, cy, k) {
  var n = RG.lives0 || RAIN_LIVES, w = 7 * k, x0 = right - n * (w + k) + k, y = Math.round(cy - 3 * k);
  for (var i = 0; i < n; i++) {
    var x = x0 + i * (w + k);
    ctx.fillStyle = i < RG.lives ? RAIN_PAL.o100 : RT_PAL.wood;
    [[0, 0, 3, 2], [4, 0, 3, 2], [0, 2, 7, 2], [1, 4, 5, 1], [2, 5, 3, 1]].forEach(function (r) { ctx.fillRect(x + r[0] * k, y + r[1] * k, r[2] * k, r[3] * k); });
  }
}

/* Node 에서 규칙만 따로 돌려 보기 위한 통로(판 길이 시뮬레이션) · 브라우저에서는 쓰지 않는다 */
if (typeof module !== "undefined" && module.exports) module.exports = { RG: RG, RAIN_WORDS: RAIN_WORDS, rgSeed: rgSeed, rgRnd: rgRnd, rgShuf: rgShuf, rgPickWord: rgPickWord, rgLayout: rgLayout, rgUpdate: rgUpdate, rgSpawn: rgSpawn, rgStat: rgStat, rgRamp: rgRamp,
  rgNextFill: rgNextFill, rgNextWord: rgNextWord, rgWrap: rgWrap, rgHgMap: rgHgMap, rgHgAdd: rgHgAdd, rgHgBack: rgHgBack, rgHangulize: rgHangulize, RGP: RGP };
