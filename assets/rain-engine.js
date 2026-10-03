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
   v4.51(260925 사용자) 3단 모양 · 가운데 게임판만 전체 높이 + 강한 틀(rgFrameDraw) · 왼쪽 = 위쪽 작은 상자 두 개(도전자·점수·목숨·단계 / NEXT) · 오른쪽 = 순위표(머리띠 · 줄무늬 · 행 수만큼)
     입력칸은 화면 쪽이 가운데 판 폭에 맞춰 판 바로 아래에 둔다(L.ox · L.W · L.fr) · 낙하 · 판정 · 시드는 그대로 · 대전(옆판 없음)은 모양도 그대로.
   v5.12(261003 사용자 결정) 1F 타자왕 아케이드 · 셀프 모드(site + bonus)만 · 보너스 스테이지(단계가 바뀔 때마다 행사 문장) · 오른쪽 판 = 추월 레이스(RG.race) ·
     목숨 보너스(안전 상한) · 대기 데모(rgAttractDraw) · 점 글자(rtDots) · 아래 「v5.12」 절 · 앱 솔로 · 대전 · 단어 판정 · 낙하 · 시드는 그대로.
   v5.24(261003 사용자 피드백) 보너스 스테이지 = 「비구름」 · 단계마다 튀어나오던 문장을 없앴다 · 판 위 비구름 하나가 단어 14~16개를 비로 내리고 다 내리면 걷히며 숨은 문장이 나온다(한 판 최대 3번) ·
     구름 HUD(남은 단어 칸) · CLOUD CLEAR → BONUS STAGE + 문장 → 3 · 2 · 1 → 입력 · 전환 · 카운트다운 · 결과 동안 입력칸을 비우고 막는다(readOnly · 조합 정리) · 아래 「v5.24」 절.
   v5.30(261003 사용자 피드백) 비는 구름에서 내린다 · 구름 단어는 구름 폭 안에서 생겨 구름 아래 가장자리에서 나온다(구름이 좌우로 천천히 움직이고 · 생길 때 출렁 · 빗줄기 꼬리) · 내릴수록 구름이 작고 옅어진다 ·
     보너스 들어갈 때 · 나올 때 전체 화면 도트 전환 + 제목 카드(BONUS STAGE · STAGE n) · 보너스 무대 = 밤 무대 · 문장 바로 밑 한 줄에 내가 친 글자(아래 입력칸은 숨김 · rgFormBns) · 점수 · 판정은 그대로.
   ══════════════════════════════════════════════════════════════════════════ */

/* ═══ 단어 풀 · 여기 한 곳 ═══
   260917 원본(행사 어휘 73개 · 뜻 없음)으로 되돌렸다. 260918 의 「AI 기본 소양 30개 + 칸마다 뜻」은 폐기(사용자 확정 260923).
   게임 중에 긴 글·모달·정지를 넣지 않는다. 뜻 표시도 되새김 화면도 두지 않는다.
   확정 문서·앱에 이미 있는 어휘에서 짧은 단어 위주 · 공백이 든 말(ME to WE 등)은 판정이 어려워 뺐다.
   v4.29(260924 사용자 확정) 영어 단어는 하나도 두지 않는다(AX · AI · DAP 삭제) · 1단계(3자 이하)가 영단어로 열려 자판 전환부터 시켰다 · 로마자 키는 두벌식 한글로 바뀌어 들어간다(아래 rgHgAdd).
   단계가 오를수록 긴 단어 비중이 커진다(1단계 3자 이하 · 2단계부터 전부).
   v4.92(261001 사용자 승인 · 앱 개편 4묶음) 1층 부스 판 어휘로 교체 · 79개(구역 71 + 행사 공통 8 · 3자 이하 61) · 정본 「QA/문제 은행 확정안 v1.json」 rain ·
   경품 · 추첨 · 사은품 · 응모권과 10F 세션 어휘(파이썬 · 클로드 · 노트북 등)는 뺐다 · 판정 · 낙하 · 시드 로직은 그대로. */
var RAIN_WORDS = [
  "공감", "참여", "확산", "체화", "혁신", "연결", "사람", "판단", "근거", "경험", "우리", "변화", "가능성", "로드맵", "데이터",
  "에이전트", "자동화", "업무", "현업", "분석", "프로젝트", "우수과제", "최우수", "예측모델", "보험사기", "판결문", "고도화", "대시보드",
  "아이디어", "현장", "영업", "보상", "시상", "판매화법", "강북이", "하이핑거", "약도", "판례", "의료기록", "통화녹취", "컨설팅", "하이디큐",
  "하이헬퍼", "질문", "요약", "번역", "보고서", "초안", "업로드", "암호화", "동의", "추천", "원클릭", "태아보험", "종합보험", "설계",
  "바로컨설팅", "신담보", "후기", "존댓말", "체험", "방향", "라운지", "상담", "고민", "실행", "포토부스", "룰렛", "스탬프", "타자왕",
  "프롬프트", "커피챗", "광화문", "대강당", "실습", "강연", "세션", "설문", "계단"
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
var RAIN_SIDE_GAP = 28;                       /* v4.51 3단 · 게임판과 양옆 판 사이 틈(틀 10 + 빈 18) */
var RAIN_FRAME = 10;                          /* v4.51 3단 · 게임판 틀 두께(먹 3 · O100 4 · 먹 3) · 입력칸 틀도 같은 두께 */
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

var RG = { on: false, mode: "app", big: false, raf: 0, last: 0, t0: 0, cd: 0, words: [], ghost: [], seq: 0, parts: [], pops: [], lives: RAIN_LIVES, score: 0, hits: 0, tries: 0, combo: 0, maxCombo: 0, stage: 1, spawnT: 0, shake: 0, banner: null, shot: null, mas: { x: 90, tx: 90, hop: 0 }, res: null, L: null, dpr: 1, seed: 0, rs: 0, lives0: RAIN_LIVES, cap: RAIN_CAP_SEC, wait: false, next: null, top: null, topT: "", who: "", hk: false,
  bonusOn: false, bonus: null, bns: 0, bnsN: 0, bnsBag: null, capBns: 0, inMax: 12, race: null, raceRank: 0, racePops: [], raceSlide: 0, cloud: null, cloudN: 0, cloudAt: 0 };   /* v4.32 topT = 오른쪽 판 제목 · who = 왼쪽 판 도전자 닉네임(현장 셀프) · 화면 쪽이 넣는다 · v5.12 bonusOn ~ raceSlide = 1F 타자왕(아래 v5.12 절) */
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
   좁으면(960 부근) 양옆 판 200 을 먼저 지키고 게임판이 줄어든다 · L.ox = 게임판 왼쪽 끝
   v4.51(260925 사용자) 가운데 게임판만 전체 높이 · 테두리 한 단계 강하게(먹 3 · O100 4 · 먹 3 = RAIN_FRAME) · 틀은 판과 양옆 판 사이 틈(RAIN_SIDE_GAP) 안에 그린다
     판은 틀 두께만큼 아래로(L.oy) · L.H = 판 높이(캔버스 높이 L.CH − 틀) · 아래 틀은 입력칸(화면 쪽 DOM)이 이어 받는다 · 양옆 판 상자는 내용만큼(rgLeftDraw · rgSideDraw) */
function rgLayout(W, H, big, side) {
  var L = { W: W, H: H, CH: H, big: big, CW: W, ox: 0, oy: 0, fr: 0, pan: null, lp: null };
  if (side && big && W >= RAIN_SIDE_MIN) {
    var gap = RAIN_SIDE_GAP, bw = Math.max(440, Math.min(760, Math.round(H * 0.8))), pw = Math.floor((W - bw - 4 * gap) / 2);
    if (pw < 200) { pw = 200; bw = W - 2 * pw - 4 * gap; }
    pw = Math.min(420, pw);
    var ox = Math.round((W - bw) / 2);
    L.W = W = bw; L.ox = ox; L.fr = L.oy = RAIN_FRAME; L.H = H = H - RAIN_FRAME;
    L.lp = { x: ox - gap - pw, y: 0, w: pw, h: L.CH };
    L.pan = { x: ox + bw + gap, y: 0, w: pw, h: L.CH };
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
function rgWordY(w) { var L = RG.L; if (w.y0 == null) return L.top + Math.min(1, w.p) * L.fallPx; return w.y0 + Math.min(1, w.p) * Math.max(10, L.floor - L.boxH - w.y0); }   /* v5.30 구름 단어 = 구름 아래 가장자리(y0)에서 출발 · 바닥선까지 걸리는 시간은 그대로 */
function rgRamp(sec) { return Math.max(RAIN_RAMP_MIN, 1 - Math.max(0, sec - RAIN_RAMP_FROM) / RAIN_RAMP_SPAN * (1 - RAIN_RAMP_MIN)); }
function rgElapsed(now) { return RG.t0 ? (now - RG.t0) / 1000 : 0; }

/* 캔버스 = 보이는 크기 × dpr(상한 2) · 배치 규칙을 다시 계산하고 바로 한 번 그린다 */
function rgFit(cv, w, h) {
  if (!w || !h) return;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  if (RG.L && RG.L.CW === w && RG.L.CH === h && cv.width === Math.round(w * dpr)) return;   /* visualViewport scroll 로 같은 크기가 또 오면 무시 */
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
  inp.addEventListener("keydown", function (e) { if (e.key === "Escape" && inp === rgEl("rgIn")) { e.preventDefault(); rgAutoClear(); return; } if (rgBlk(e, inp)) return; rgHgKey(e, inp); });   /* Esc = 즉시 비우기 · v5.24 비구름 전환 연타 막기(rgBlk) · 그 밖 = 로마자 → 한글 */
  inp.addEventListener("beforeinput", function (e) { rgHgBefore(e, inp); });
}
/* v5.24 비구름 · 막힌 동안 누른 글자 키를 기억하고 · 입력이 열린 뒤에도 그 연타가 0.25초 안에 이어지면 버린다(카운트다운 중 치던 손이 문장 앞에 반쪽 글자를 남기지 않게) · 손을 떼었다 다시 치면 그대로 */
function rgBlk(e, inp) {
  if (!RG.bonus) return false;
  var k = e.key || "", now = performance.now();
  if (k.length !== 1 && k !== "Process" && e.keyCode !== 229) return false;
  if (inp.readOnly || (RG.bonus.ph === "type" && now - (RG.blkT || 0) < 250)) { RG.blkT = now; e.preventDefault(); return true; }
  return false;
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
  if (lat && !RG.composing && !(e && e.isComposing)) { raw = rgHangulize(raw, RG.hk).slice(0, RG.inMax || 12); inp.value = raw; RG.hk = true; lat = false; }   /* 조합 없이 들어온 로마자는 그 자리에서 한글로 */
  if (!RGP.on || !RG.on || RG.cd > 0 || RG.ending || RG.paused) return;
  if (RG.bonus) { if (RG.bonus.ph === "type") RG.bonus.typed = lat ? rgHangulize(raw, RG.hk) : raw; else if (raw) rgClearInput(); return; }   /* v5.12 보너스 스테이지 · 단어 판정 · 자동 비우기 없이 친 글자만 · v5.24 전환 · 카운트다운 · 결과 동안 들어온 글자는 버린다 */
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
  if (e.isComposing || e.keyCode === 229 || RG.composing || e.ctrlKey || e.metaKey || e.altKey || inp.disabled || inp.readOnly) return;   /* v5.24 readOnly = 비구름 전환 중 */
  var k = e.key || "", m = /^Key([A-Z])$/.exec(e.code || "");
  if (k === "Backspace") { if (RG.hk && inp.value && inp.selectionStart === inp.value.length && inp.selectionEnd === inp.value.length) { e.preventDefault(); rgHgDel(inp); } return; }
  if (m && /^[A-Za-z]$/.test(k)) { e.preventDefault(); rgHgPut(inp, rgHgMap(m[1], e.shiftKey)); return; }
  if (k.length === 1 || /^(Enter|Tab|Delete|Home|End|Arrow)/.test(k)) RG.hk = false;   /* 다른 글자 · 이동 = 조합 끝 */
}
/* 휴대폰 · 조합 없이 한 글자씩 들어오는 로마자(쿼티 영문 · 예측 끔) · 조합으로 들어오면 rgLive 가 판정만 한글로 본다 */
function rgHgBefore(e, inp) {
  if (e.isComposing || RG.composing || inp.disabled || inp.readOnly) return;
  var d = e.data || "";
  if (e.inputType === "insertText" && /^[A-Za-z]$/.test(d)) { e.preventDefault(); rgHgPut(inp, rgHgMap(d, d !== d.toLowerCase())); }
  else if (e.inputType === "deleteContentBackward" && RG.hk && inp.value && inp.selectionStart === inp.value.length && inp.selectionEnd === inp.value.length) { e.preventDefault(); rgHgDel(inp); }
}
function rgHgPut(inp, j) {
  if (!j) return;
  var s = rgHgAdd(inp.value, j, RG.hk);
  if (s.length > (RG.inMax || 12)) return;   /* 입력창 maxlength 12(v5.12 보너스 스테이지 40) · 값을 코드로 넣으면 maxlength 가 걸리지 않는다 */
  inp.value = s; RG.hk = true;
  rgLive(null);
}
function rgHgDel(inp) { var b = rgHgBack(inp.value); inp.value = b.s; RG.hk = b.on; rgLive(null); }
function rgAutoClear() {
  var inp = rgEl("rgIn"); if (!inp || !inp.value) return;
  if (RG.bonus) { rgClearInput(); RG.bonus.typed = ""; rgSfx("tik"); return; }   /* v5.12 보너스 스테이지 · Esc = 문장 처음부터 */
  var v = rgInVal(), keep = "";
  for (var n = v.length - 1; n > 0; n--) { if (rgPrefixAlive(v.slice(0, n))) { keep = v.slice(0, n); break; } }
  if (keep && !RG.composing) { inp.value = keep; RG.typed = keep; if (document.activeElement !== inp) inp.focus(); }
  else { rgClearInput(); RG.typed = ""; }
  rgFlash("auto");
  rgSfx("tik");
}
function rgCheckInput(v) {
  if (!RG.on || RG.cd > 0 || RG.ending || RG.paused || RG.bonus) return;
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
  if (RG.cloud) return rgCloudPick();   /* v5.24 비구름 · 구름에 담긴 단어부터 */
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
  RG.bonusOn = !!opt.bonus && RG.mode === "site"; RG.bonus = null; RG.bns = 0; RG.bnsN = 0; RG.bnsBag = null; RG.capBns = 0; RG.inMax = 12;   /* v5.12 1F 타자왕 */
  RG.race = RG.bonusOn ? (opt.race || null) : null; RG.raceRank = 0; RG.racePops = []; RG.raceSlide = 0;
  RG.cloud = null; RG.cloudN = 0; RG.cloudAt = 0;   /* v5.24 비구름 */
  RG.big = RG.mode !== "app" || (!rgTouch() && window.innerWidth >= 700);
  RG.wait = opt.wait != null ? !!opt.wait : (RG.mode !== "race" && !rgTouch() && !RGP.go);
  RGP.go = false;
  RG.next = null; RG.top = null; RG.hk = false;
  if (RG.bonusOn) rgCloudStart();   /* v5.24 첫 구름은 카운트다운부터 판 위에 */
  if (!RG.seed) rgNextFill();   /* 대기 화면부터 옆판 NEXT 가 보인다 */
  try { if (typeof SFX !== "undefined") SFX.site = RG.mode !== "app"; } catch (e) {}
  if (typeof rgPlayOpen === "function") rgPlayOpen();
  var inp = rgEl("rgIn"); rgBindInput(inp); if (inp) { inp.maxLength = 12; inp.readOnly = false; inp.focus(); }
  rgFormBns(false);   /* v5.30 보너스에서 숨긴 입력칸을 되돌린다 */
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
  var ctx = cv.getContext("2d"), cl = !!RG.cloud, text = rgNextWord();   /* v5.24 cl = 비구름에서 내린 단어 */
  if (!text) return false;
  ctx.font = rtFont(L.tf);
  var bw = Math.ceil(ctx.measureText(text).width) + L.padX * 2;
  var maxX = Math.max(8, L.W - 8 - bw), lw = (L.W - 16) / L.lanes, upper = L.top + L.boxH * 3;
  var near = RG.seed ? RG.ghost : RG.words;
  if (cl) {   /* v5.30 구름 단어 · 구름 폭 안에서 생겨 구름 아래 가장자리에서 나온다 · 막 나온 단어와 겹치지 않는 자리를 여섯 번 찾는다 · 구름이 출렁인다 */
    var G = rgCloudGeo(L, performance.now()), lo = Math.max(8, G.left), hi = Math.min(L.W - 8 - bw, G.right - bw), y0 = Math.max(L.top, G.bottom - L.boxH), cx = 0;
    if (hi < lo) { lo = hi = Math.max(8, Math.min(L.W - 8 - bw, Math.round(G.x0 + G.w / 2 - bw / 2))); }
    for (var t = 0; t < 6; t++) {
      cx = Math.round(lo + rgRnd() * (hi - lo));
      if (!near.some(function (w) { return rgWordY(w) < y0 + L.boxH * 2.5 && cx < w.x + w.bw + 8 && cx + bw + 8 > w.x; })) break;
    }
    var wc = { text: text, bw: bw, x: cx, y0: y0, p: 0, fall: RAIN_FALL[RG.stage - 1] * rgRamp(sec) * (0.94 + rgRnd() * 0.12), cl: true };
    RG.words.push(wc); RG.seq++; RG.cloud.puff = RAIN_CLOUD_FX.puff;
    return true;
  }
  var lanes = []; for (var i = 0; i < L.lanes; i++) lanes.push(i);
  rgShuf(lanes);
  var jit = rgRnd(), fj = rgRnd();
  for (var k = 0; k < lanes.length; k++) {
    var x = Math.round(Math.min(maxX, Math.max(8, 8 + lanes[k] * lw + jit * Math.max(0, lw - bw))));
    var clash = near.some(function (w) { return rgWordY(w) < upper && x < w.x + w.bw + 8 && x + bw + 8 > w.x; });
    if (!clash || k === lanes.length - 1) {
      var wd = { text: text, bw: bw, x: x, p: 0, fall: RAIN_FALL[RG.stage - 1] * rgRamp(sec) * (0.94 + fj * 0.12) };
      if (cl) wd.cl = true;
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
  if (RG.bonus) {   /* v5.12 보너스 스테이지 · 소나기 멈춤 · 게임 시계는 끝날 때 민다 */
    rgBonusTick(dt, now); rgFx(dt); rgRaceTick(dt);
    if (RG.shake > 0) RG.shake -= dt;
    if (RG.mas.hop > 0) RG.mas.hop -= dt;
    return;
  }
  var sec = rgElapsed(now);
  RG.surv = sec;
  rgTipTick(now);
  if (sec >= RG.cap) { rgEnd("cap"); return; }   /* 안전 상한 · 현장에서 서버 값으로 조절한다 */
  if (RG.bonusOn && !RG.cloud && RG.cloudN < RAIN_CLOUD.max && sec >= RG.cloudAt) rgCloudStart();   /* v5.24 맑은 틈이 끝나면 다음 구름 */
  var st = Math.min(L.stages, 1 + Math.floor(sec / RAIN_STAGE_SEC));
  if (st > RG.stage) {
    RG.stage = st;
    RG.banner = { text: "LEVEL " + st, t: 1.3 }; rgSfx("level");
  }
  /* 유령 목록 · 아무도 안 친 셈 친 가상 위치 · 바닥을 지나면 버린다 */
  if (RG.seed) for (var gi = RG.ghost.length - 1; gi >= 0; gi--) { RG.ghost[gi].p += dt / RG.ghost[gi].fall; if (RG.ghost[gi].p >= 1) RG.ghost.splice(gi, 1); }
  RG.spawnT -= dt;
  var extra = Math.min(2, Math.floor(Math.max(0, sec - RAIN_RAMP_FROM) / RAIN_EXTRA_EVERY));
  /* 대전은 화면에 몇 개 남았는지로 등장을 막지 않는다(막으면 사람마다 단어 순서가 갈라진다) · 솔로는 원래대로 상한을 둔다 */
  var room = RG.seed ? RG.ghost.length <= L.maxWords + extra : RG.words.length < L.maxWords + extra;
  if (RG.cloud && !RG.cloud.seq.length) room = false;   /* v5.24 구름이 다 내렸다 · 남은 단어가 다 사라지면 걷힌다 */
  if (RG.spawnT <= 0 && room) RG.spawnT = rgSpawn(sec) ? RAIN_SPAWN[RG.stage - 1] * rgRamp(sec) : 0.25;
  if (RG.cloud && RG.cloud.puff > 0) RG.cloud.puff -= dt;   /* v5.30 출렁임 */
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
      if (wd.cl && rgCloudCheck(now)) return;   /* v5.24 놓친 단어도 구름을 비운다 */
    }
  }
  rgFx(dt); rgRaceTick(dt);
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
  if (RG.bonus) { if (RG.bonus.ph === "type") { RG.bonus.typed = rgInVal(); rgBonusEnd("enter"); } else rgClearInput(); return; }   /* v5.12 보너스 스테이지 · Enter = 채점 */
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
  if (wd.cl) rgCloudCheck(tnow);   /* v5.24 구름의 마지막 단어 */
}
function rgEnd(why) {
  if (!RG.on || RG.ending) return;
  if (why === "cap" && RG.bonusOn) { RG.capBns = Math.max(0, RG.lives) * RAIN_LIFE_BONUS; RG.score += RG.capBns; }   /* v5.12 목숨 보너스 · 안전 상한까지 버텼다 */
  RG.ending = { t: 1.2, why: why };
  RG.words = []; RG.banner = null;
  rgSfx(why === "cap" ? "fanfare" : "over");
  var inp = rgEl("rgIn"); if (inp) inp.disabled = true;
}
/* 지금 성적 · 결과 보고와 진행 보고가 같은 값을 쓴다 */
function rgStat() {
  return { score: RG.score, hits: RG.hits, combo: RG.maxCombo, acc: RG.tries ? Math.round(RG.hits / RG.tries * 100) : 0, lives: Math.max(0, RG.lives), el: Math.round((RG.surv || 0) * 1000),
    bns: RG.bns || 0, bnsN: RG.bnsN || 0, capBns: RG.capBns || 0 };   /* v5.12 보너스 스테이지 점수 · 횟수 · 목숨 보너스(점수에 이미 들어 있다) */
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
  if (L.pan) {   /* v4.29 옆판 배치 · 바깥은 어두운 판 · v4.51 게임판 틀(rgFrameDraw) */
    ctx.fillStyle = RT_PAL.night; ctx.fillRect(0, 0, L.CW, L.CH);
    rgFrameDraw(ctx, L);
  }
  ctx.save();
  if (L.pan) { ctx.translate(L.ox, L.oy); ctx.beginPath(); ctx.rect(0, 0, L.W, L.H); ctx.clip(); }
  if (RG.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 6));
  if (RG.bonus && rgBonusScene(RG.bonus.ph)) rgBonusBg(ctx, L, now);   /* v5.30 보너스 무대(평소 판과 다른 밤 무대) */
  else {
    rgWorldD(ctx, L);
    /* 위험선 (점선) */
    ctx.fillStyle = RAIN_PAL.deep;
    for (var lx = 0; lx < L.W; lx += 3 * L.D) ctx.fillRect(lx, L.floor, 2 * L.D, 2);
  }
  if (RG.bonusOn && !RG.bonus) rgRainTails(ctx, L, now);   /* v5.30 구름에서 막 나온 단어 위 빗줄기 */
  /* 단어 · v4.23 나무 이름표(rgWordDraw) · 글자 크기 고정 · 지금 치고 있는 글자와 맞는 단어를 짚어 준다 */
  var tIdx = rgTypedIdx(), tv = RG.typed || "";
  RG.words.forEach(function (w, wi) {
    rgWordDraw(ctx, L, w.x, rgWordY(w), w.bw, w.text, wi === tIdx, w.p > 0.78, tv);
  });
  if (RG.bonusOn && (!RG.bonus || RG.bonus.ph === "clear")) rgCloudDraw(ctx, L, now);   /* v5.24 비구름 · v5.30 단어 앞(단어가 구름 몸통 뒤에서 나온다) */
  if (RG.bonus) rgBonusDraw(ctx, L, now);   /* v5.12 보너스 스테이지 문장 판 */
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
  if (RG.ending) {   /* v4.23 공용 끝 화면(rtEnd) · 게임 고유 한 줄은 판 안에 그대로 · v5.12 1F 타자왕 안전 상한 = TIME UP · 목숨 보너스 */
    var capB = RG.ending.why === "cap" && RG.bonusOn;
    rtEnd(ctx, L.W, 0, L.floor, capB ? "TIME UP" : RG.ending.why === "cap" ? "여기까지" : "GAME OVER", capB ? "목숨 보너스 +" + RG.capBns.toLocaleString() : RG.ending.why === "cap" ? "최대 시간에 닿았어요" : "단어 " + RG.lives0 + "개를 놓쳤어요",
      { s: L.D, tp: L.big ? 48 : 32, sp: L.big ? 32 : 16, maxW: L.big ? 640 : 320 });
  }
  if (RG.wait) rgWaitDraw(ctx, L, now);
  else if (RG.cd > 0) rtCount(ctx, RG.cd, L.W, 0, L.floor, L.big ? 96 : 64);
  ctx.restore();
  if (L.pan) { rgLeftDraw(ctx, L); if (RG.race) rgRaceDraw(ctx, L, now); else rgSideDraw(ctx, L); }   /* v4.32 3단 · 흔들림 밖 · v5.12 1F 타자왕 = 오른쪽 판이 추월 레이스 */
  if (RG.bonus) rgTransDraw(ctx, L);   /* v5.30 보너스 들어갈 때 · 나올 때 전체 화면 전환 · 제목 카드 */
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
/* v4.32 3단 배치의 양옆 판 · 글자는 16 · 32(도트 글꼴이 또렷한 크기)만 쓴다 · 순위 줄은 높이 700 · 폭 400 이상에서만 32 · v4.51 왼쪽 = 나무 상자 두 개(위쪽만) · 오른쪽 = 순위표(머리띠 · 줄무늬) · 가운데 = 강한 틀 */
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
/* v4.51 게임판 틀 · 셋 중 유일한 전체 높이 · 양옆 판(나무 이중 테두리)보다 한 단계 강하게 · 바깥 먹 3 → O100 4 → 안 먹 3(= RAIN_FRAME)
   위 모서리는 계단(rtStep) · 아래는 캔버스 끝까지 열어 둔다(입력칸 틀이 같은 세 겹으로 이어 받는다 · 화면 쪽 CSS) */
function rgFrameDraw(ctx, L) {
  var f = L.fr, x = L.ox - f, w = L.W + 2 * f, h = L.CH + 8;
  rtStep(ctx, x, 0, w, h, 2, RAIN_PAL.ink);
  rtStep(ctx, x + 3, 3, w - 6, h, 2, RAIN_PAL.o100);
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x + 7, 7, w - 14, h);
}
/* 왼쪽 판 · v4.51(260925 사용자) 테트리스 HOLD · NEXT 칸 문법 · 위쪽에 작은 상자 두 개만 · 아래는 비운다(시선은 가운데 판)
   ① 도전자(현장 셀프 · RG.who · 「도전 중」) + 점수 · 목숨 · 단계  ② NEXT(첫 칸 크게 · 뒤 두 칸 작게 한 줄 · 넘치면 다음 줄) · 게임 전(대기) = 시작 안내
   상자 = 나무 이중 테두리(rtPanel) · 내용만큼의 높이 · 판 높이 720 미만(1366×768 등)은 줄 간격만 줄인다 · 글자는 16 · 32 */
function rgLeftDraw(ctx, L) {
  var P = L.lp; if (!P) return;
  var s = 2, cmp = P.h < 720, bp = 4 * s + (cmp ? 8 : 12), rh = cmp ? 34 : 44, hp = cmp ? 16 : 32, tp = cmp ? 16 : 32, gap = 12;
  var ix = P.x + bp, right = P.x + P.w - bp, iw = right - ix, y = P.y, cy;
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  /* ① 도전자 + 점수 · 목숨 · 단계 */
  var nh = cmp ? 24 : 36, ns = cmp ? 12 : 16, ah = 2 * bp + (RG.who ? nh + ns : 0) + (RG.bonusOn ? 4 : 3) * rh;   /* v5.12 1F 타자왕 = 보너스 줄 하나 더 */
  rtPanel(ctx, P.x, y, P.w, ah, s, RT_PAL.night);
  cy = y + bp;
  if (RG.who) {
    ctx.font = rtFont(16); var tw = Math.ceil(ctx.measureText("도전 중").width);
    ctx.font = rtFont(tp); var who = String(RG.who);
    while (who.length > 1 && ctx.measureText(who).width > iw - tw - 12) who = who.slice(0, -1);
    rtText(ctx, who, ix, cy + nh / 2, tp, RAIN_PAL.o100, RAIN_PAL.ink);
    ctx.textAlign = "right"; rtText(ctx, "도전 중", right, cy + nh / 2, 16, RT_PAL.tan, null); ctx.textAlign = "left";
    ctx.fillStyle = RT_PAL.wood; ctx.fillRect(ix, Math.round(cy + nh + ns / 2 - 1), iw, 2);
    cy += nh + ns;
  }
  [["점수", RG.score.toLocaleString()], ["목숨", null], ["단계", String(RG.stage)]].concat(RG.bonusOn ? [["보너스", "+" + (RG.bns || 0).toLocaleString()]] : []).forEach(function (r, k) {
    var yy = cy + k * rh + rh / 2;
    ctx.textAlign = "left"; rtText(ctx, r[0], ix, yy, hp, RT_PAL.tan, null);
    if (r[1] != null) { ctx.textAlign = "right"; rtText(ctx, r[1], right, yy, 32, RAIN_PAL.o100, RAIN_PAL.ink); }
    else rgSideHearts(ctx, right, yy, cmp ? 3 : 4);
  });
  y += ah + gap;
  /* ② NEXT · 게임 전(대기) = 시작 안내 */
  var th = hp + 4, tg = cmp ? 8 : 10;   /* 상자 머리 글자 줄 · 머리 아래 틈 */
  ctx.textAlign = "left";
  if (RG.wait) {
    var lh = cmp ? 22 : 26, lines = [];
    ctx.font = rtFont(16);
    ["SPACE를 누르면 시작", "떨어지는 단어를 치고 Enter", "단어가 바닥에 닿으면 목숨 하나", "목숨 " + (RG.lives0 || RAIN_LIVES) + "개를 다 잃으면 끝"].forEach(function (t, k) {
      rgWrap(ctx, t, iw).forEach(function (ln) { lines.push([ln, k]); });
    });
    rtPanel(ctx, P.x, y, P.w, 2 * bp + th + tg + lines.length * lh, s, RT_PAL.night);
    cy = y + bp;
    rtText(ctx, "시작 안내", ix, cy + th / 2, hp, RAIN_PAL.o100, RAIN_PAL.ink); cy += th + tg;
    lines.forEach(function (x) { rtText(ctx, x[0], ix, cy + lh / 2, 16, x[1] === 0 ? RAIN_PAL.o60 : RT_PAL.cream, null); cy += lh; });
  } else {
    var q = RG.next || [], t1 = cmp ? 40 : 48, t2 = cmp ? 28 : 32, px = 12, rows = [], nx = ix;
    ctx.font = rtFont(16);
    for (var i = 1; i < 3; i++) if (q[i]) {   /* 뒤 두 칸 · 한 줄에 안 들어가면 다음 줄 */
      var w2 = Math.min(iw, Math.ceil(ctx.measureText(q[i]).width) + 2 * px);
      if (rows.length && nx + w2 > right) { nx = ix; rows.push([]); }
      if (!rows.length) rows.push([]);
      rows[rows.length - 1].push([q[i], nx, w2]); nx += w2 + 8;
    }
    rtPanel(ctx, P.x, y, P.w, 2 * bp + th + tg + t1 + rows.length * (t2 + 8), s, RT_PAL.night);
    cy = y + bp;
    rtText(ctx, "NEXT", ix, cy + th / 2, hp, RAIN_PAL.o100, RAIN_PAL.ink); cy += th + tg;
    if (q[0]) {
      ctx.font = rtFont(32); var w1 = Math.min(iw, Math.ceil(ctx.measureText(q[0]).width) + 32);
      rtTag(ctx, ix, cy, w1, t1, RT_PAL.tan2, RT_PAL.cream, RT_PAL.tan);
      rtText(ctx, q[0], ix + 16, cy + t1 / 2, 32, RT_PAL.bark, null);
    }
    cy += t1 + 8;
    rows.forEach(function (row) {
      row.forEach(function (c) { rtTag(ctx, c[1], cy, c[2], t2, RT_PAL.bark, RT_PAL.wood, RAIN_PAL.ink); rtText(ctx, c[0], c[1] + px, cy + t2 / 2, 16, RT_PAL.cream, null); });
      cy += t2 + 8;
    });
  }
  ctx.restore();
}
/* 오른쪽 판 · 순위 TOP 10(RG.top · 화면 쪽이 서버 순위판을 읽어 넣는다) · 내 기록(me) = 진한 나무 띠 + 주황 글자 · 1~3위 번호 주황
   RG.top = null(불러오는 중) · [](기록 없음) · [{ no, name, val, me }] · 제목 = RG.topT(화면 쪽) 또는 「TOP 10」 · 넓은 판(폭 400 이상 · 높이 700 이상)은 32
   v4.51(260925 사용자) 왼쪽 상자와 다른 순위표 문법 · 먹 테두리(계단 모서리) + 오렌지 머리띠(제목) + 줄무늬 행(어두운 판 두 톤) · 판 높이보다 짧게(행 수만큼) */
function rgSideDraw(ctx, L) {
  var P = L.pan; if (!P) return;
  var cmp = P.h < 720, hp = cmp ? 16 : 32, rf = P.h >= 700 && P.w >= 400 ? 32 : 16, rh = rf === 32 ? 46 : cmp ? 30 : 36, bh = cmp ? 40 : 60, b = 3;
  var top = RG.top, n = top && top.length ? Math.min(10, top.length) : 1;
  while (n > 1 && 3 * b + bh + n * rh > P.h) n--;
  var H = 3 * b + bh + n * rh, ix = P.x + b + 14, right = P.x + P.w - b - 14, iw = right - ix, ry = P.y + 2 * b + bh;
  ctx.save();
  rtStep(ctx, P.x, P.y, P.w, H, 2, RAIN_PAL.ink);
  ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(P.x + b, P.y + b, P.w - 2 * b, bh);   /* 머리띠 · 위 밝은 한 줄 · 아래 어두운 한 줄 */
  ctx.fillStyle = RAIN_PAL.o60; ctx.fillRect(P.x + b, P.y + b, P.w - 2 * b, 2);
  ctx.fillStyle = RAIN_PAL.deep; ctx.fillRect(P.x + b, P.y + b + bh - 2, P.w - 2 * b, 2);
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  rtText(ctx, RG.topT || "TOP 10", ix, P.y + b + bh / 2, hp, RT_PAL.night, null);
  if (!top || !top.length) {
    ctx.fillStyle = RT_PAL.night; ctx.fillRect(P.x + b, ry, P.w - 2 * b, rh);
    rtText(ctx, top ? "아직 기록이 없어요" : "불러오는 중", ix, ry + rh / 2, 16, RT_PAL.tan, null);
  } else for (var j = 0; j < n; j++) {
    var x = top[j], yy = ry + j * rh + rh / 2, val = String(x.val || ""), nm = String(x.name || ""), no = String(x.no);
    ctx.fillStyle = x.me ? RT_PAL.wood : j % 2 ? RT_PAL.bark : RT_PAL.night; ctx.fillRect(P.x + b, ry + j * rh, P.w - 2 * b, rh);
    ctx.font = rtFont(rf);
    var nx = ix + ctx.measureText("10").width + 12;
    ctx.textAlign = "left"; rtText(ctx, no, ix, yy, rf, x.me || x.no <= 3 ? RAIN_PAL.o100 : RT_PAL.tan, null);
    ctx.textAlign = "right"; rtText(ctx, val, right, yy, rf, x.me ? RAIN_PAL.o100 : RT_PAL.cream, null);
    ctx.font = rtFont(rf);
    var mw = right - ctx.measureText(val).width - 12 - nx;
    while (nm.length > 1 && ctx.measureText(nm).width > mw) nm = nm.slice(0, -1);
    ctx.textAlign = "left"; rtText(ctx, nm, nx, yy, rf, x.me ? RAIN_PAL.o100 : RT_PAL.cream, null);
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

/* ═══ v5.12 (261003 사용자 결정) 1F 타자왕 아케이드 · 보너스 스테이지 · 추월 레이스 · 대기 데모 · 점 글자 ═══
   쓰는 곳 = 1F 현장 셀프 모드뿐(화면 쪽이 rgStart("site", { bonus: true }) 로 켠다) · 앱 솔로(app)와 대전(race · admin/typing.html)은 그대로다.
   점수(1F 순위 기준) = 단어 점수(글자 수 × 10 × 콤보 배수 · 옛 그대로) + 보너스 스테이지 점수 + 목숨 보너스(안전 상한까지 버텼을 때만).
   보너스 스테이지 = 단계가 바뀔 때마다(2 · 3 · 4 · 5단계에 들어갈 때 · 한 판 최대 4번) 소나기를 멈추고 행사 문장 하나를 친다 · 목숨은 줄지 않는다.
     제한 시간 = 글자 수(띄어쓰기 포함) × 0.8 + 6초(올림) · 먼저 2.2초 동안 문장을 보여 주고(READY) 그다음부터 친다 · Enter = 그 자리에서 채점 · 시간이 다 되면 친 데까지 채점.
     점수 = 맞은 글자 × 40 + 문장을 그대로 맞히면(PERFECT) 600 + 남은 초 × 50(v5.26 · 옛 20 · 300 · 30) · 맞은 글자는 편집 거리로 센다(한 글자 빠지거나 더 쳐도 뒤가 다 틀리지 않게 · 시간이 다 되면 친 길이만큼의 앞부분과 견준다).
     문장을 치는 동안 게임 시계는 멈춘다(단계 · 램프 · 안전 상한이 문장 시간만큼 밀린다 · 버틴 시간에 넣지 않는다) · 영문 자판 → 두벌식 · 한글 조합 보호는 단어와 같은 입력칸이라 그대로 돈다(길이 상한만 12 → 40).
   목숨 보너스 = 안전 상한(RAIN_CAP_SEC · 180초)에 닿으면 남은 목숨 × 500 · 상한에 닿은 사람끼리 버틴 시간이 같아도 점수로 갈린다.
   추월 레이스(오른쪽 판 · rgRaceDraw) = 화면 쪽이 RG.race = { list: [{ name, score }] }(현장 최고 기록 · 도전자 본인 줄은 뺀다 · 점수 내림차순)를 넣는다 ·
     지금 점수로 몇 위인지 = 나보다 같거나 높은 사람 수 + 1(같은 점수는 먼저 기록한 사람이 앞) · 한 명 넘을 때마다 「11위 → 10위」 튀어오름 + 효과음(rgpass) · 아래 등수부터 위로 한 줄씩 올라간다.
   대기 데모(rgAttractDraw) = 셀프 대기 화면 가운데 판에서 봇이 혼자 단어를 쳐서 터뜨린다(그림만 · 판정 · 기록과 무관) · 동전 넣기 문구 · TOP 3 는 화면 쪽이 위에 그린다.
   점 글자(rtDots) = 부스 사인 점 글자(index.html DotGlyph.layout)를 캔버스에 그린다 · 영문 대문자 · 숫자 · 기호만 · DotGlyph 가 없으면(선수 화면) 도트 글꼴 글자. */
/* v5.24(261003 사용자 피드백) 문장 은행 교체 · 숫자 0 · 영문 0(영문 자판 두벌식 변환과 겹치지 않게) · 행사에서 꼭 알아야 하는 말 · 12~20자 · 옛 「17층 대강당 …」 같은 안내문 폐기
   s = 구름이 걷히면 나오는 문장 · w = 그 문장의 핵심 단어 3~5개(2~6자 · 공백 없음 · 문장 안에 그대로 있다) · 이 단어들이 그 구름의 비로 내린다(단어로 한 번 · 문장으로 또 한 번)
   근거 = 슬로건 국문 · 3개년 로드맵(공감과 참여 → 확산과 체화 → 혁신과 연결) · 기획 철학(체감 → 상상 → 발굴 → 연결 · 내 업무에 적용할 마음) · 1층 판(DAP · 현장의 AX · 하이디큐 · 하이헬퍼 · AX Lounge · 1인 1 AI Agent) */
var RAIN_BONUS_LINES = [
  { s: "나의 경험을 우리의 가능성으로", w: ["경험", "우리", "가능성"] },
  { s: "공감과 참여에서 확산과 체화로", w: ["공감", "참여", "확산", "체화"] },
  { s: "확산과 체화를 지나 혁신과 연결로", w: ["확산", "체화", "혁신", "연결"] },
  { s: "체감 상상 발굴 그리고 연결", w: ["체감", "상상", "발굴", "연결"] },
  { s: "내 업무에 적용할 마음을 먹는 날", w: ["업무", "적용", "마음"] },
  { s: "사람을 중심에 두고 데이터로 판단", w: ["사람", "중심", "데이터", "판단"] },
  { s: "모두가 직접 만드는 에이전트", w: ["모두", "직접", "에이전트"] },
  { s: "코딩을 몰라도 누구나 데이터 분석", w: ["코딩", "누구나", "데이터", "분석"] },
  { s: "내 업무 고민이 우수과제가 된다", w: ["업무", "고민", "우수과제"] },
  { s: "현장의 동료가 직접 만든 해결책", w: ["현장", "동료", "해결책"] },
  { s: "문서를 올리고 하이디큐에 질문하기", w: ["문서", "하이디큐", "질문"] },
  { s: "하이헬퍼가 추천하는 종합보험 설계", w: ["하이헬퍼", "추천", "종합보험", "설계"] },
  { s: "혼자 하던 고민을 함께 푸는 자리", w: ["혼자", "고민", "함께"] },
  { s: "작은 시도가 모여 우리의 변화로", w: ["시도", "우리", "변화"] },
  { s: "아이디어 한 줄이 데이터 분석 과제로", w: ["아이디어", "데이터", "분석", "과제"] },
  { s: "라운지에서 함께 찾는 실행 방향", w: ["라운지", "함께", "실행", "방향"] }
];
var RAIN_BONUS = { ch: 40, perfect: 600, sec: 50, intro: 2.6, show: 2.4, inMax: 40 };   /* v5.26(사용자 261003 「권장대로」) 비구름으로 문장이 한 판 1~3번으로 줄어 20 · 300 · 30 → 40 · 600 · 50 · 문장 하나 최대 = 20자 × 40 + 600 + 21초 × 50 = 2,450 · 3번 7,350 + 목숨 보너스 2,500 = 9,850 ≤ 서버 TYPE_PTS_BONUS 15,000 */   /* v5.24 intro 2.2 → 2.6(문장 먼저 읽기) · 그 뒤 카운트다운 RAIN_CLOUD.count */
/* v5.24 비구름 · 리허설로 조절하는 손잡이 · n = 구름마다 내리는 단어 수(첫째 · 둘째 · 셋째) · key = 핵심 단어 하나가 몇 번 내리나 · gap = 구름이 걷힌 뒤 맑은 틈(게임 초) ·
   max = 한 판 최대 구름 수 · clear = 구름이 걷히는 연출 초 · count = 문장 입력 전 카운트다운 초 · 첫 구름 약 35~40초(1~3단계 · 간격 2.2~1.6초) · 보통 판 1~2번 */
var RAIN_CLOUD = { n: [14, 16, 16], key: 2, gap: 15, max: 3, clear: 1.4, count: 3, go: 0.3 };   /* go = 카운트다운 뒤 GO 를 보이며 입력을 더 막는 초 */
/* v5.30 구름 모양 손잡이 · w0 + w1 = 꽉 찬 구름 폭(판 대비) · w0 = 다 내린 구름 폭 · drift = 좌우 한 바퀴 초 · puff = 단어가 생길 때 출렁이는 초 */
var RAIN_CLOUD_FX = { w0: 0.40, w1: 0.22, drift: 28, amp: 0.6, puff: 0.32 };   /* amp = 좌우로 갈 수 있는 거리 중 쓰는 비율 */
/* v5.30 보너스 전환 · wipe = 전체 화면 도트 닫힘 · 열림 초 · title = BONUS STAGE 카드 초 · back = 나올 때 STAGE n 카드 초 */
var RAIN_TRANS = { wipe: 0.6, title: 1.6, back: 1.2 };
var RAIN_LIFE_BONUS = 500;
function rgBonusLim(n) { return Math.ceil(n * 0.8) + 6; }
/* 편집 거리(글자 단위) */
function rgLev(a, b) {
  a = String(a); b = String(b);
  var m = a.length, n = b.length, prev = [], cur, i, j;
  for (j = 0; j <= n; j++) prev.push(j);
  for (i = 1; i <= m; i++) {
    cur = [i];
    for (j = 1; j <= n; j++) cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)));
    prev = cur;
  }
  return prev[n];
}
/* 채점 · why = "enter"(문장 전체와) · "time"(친 길이만큼의 앞부분과) · left = 남은 초 */
function rgBonusScore(typed, text, why, left) {
  var t = String(typed || "").replace(/\s+/g, " ").trim(), ref = why === "enter" ? text : text.slice(0, t.length);
  var ok = t ? Math.max(0, ref.length - rgLev(t, ref)) : 0, perfect = t === text, sec = perfect ? Math.max(0, Math.floor(left || 0)) : 0;
  return { ok: ok, n: text.length, perfect: perfect, sec: sec, pts: ok * RAIN_BONUS.ch + (perfect ? RAIN_BONUS.perfect + sec * RAIN_BONUS.sec : 0) };
}
/* ═══ v5.24 비구름 ═══
   구름 하나 = 문장 하나 · 핵심 단어 × key + 단계에 맞는 단어로 n 개를 채워 섞는다(같은 단어가 붙어 나오지 않게) · 내린 단어는 cl 표시 · 남은 칸 = 아직 안 내린 단어 + 판 위 구름 단어.
   다 내리고 판 위 구름 단어가 다 사라지면(친 것 · 놓친 것 모두) 걷힌다 → 보너스 스테이지(clear → intro → count → type → res) · 끝나면 맑은 틈(gap) 뒤 다음 구름 · max 번이면 그 뒤로는 소나기만. */
function rgCloudStart() {
  if (!RG.bnsBag || !RG.bnsBag.length) RG.bnsBag = rgShuf(RAIN_BONUS_LINES.slice());
  var ln = RG.bnsBag.pop(), n = RAIN_CLOUD.n[Math.min(RG.cloudN, RAIN_CLOUD.n.length - 1)], seq = [];
  ln.w.forEach(function (w) { for (var k = 0; k < RAIN_CLOUD.key; k++) seq.push(w); });
  var fill = rgShuf(rgPool().filter(function (w) { return ln.w.indexOf(w) < 0; }));
  for (var i = 0; seq.length < n && i < fill.length; i++) seq.push(fill[i]);
  rgShuf(seq);
  for (var j = 1; j < seq.length; j++) if (seq[j] === seq[j - 1]) for (var m = j + 1; m < seq.length; m++) if (seq[m] !== seq[j]) { var x = seq[j]; seq[j] = seq[m]; seq[m] = x; break; }
  RG.cloudN++;
  RG.cloud = { no: RG.cloudN, text: ln.s, keys: ln.w.slice(), seq: seq, n: seq.length };
  RG.next = seq.slice(0, 3);
}
function rgCloudPick() {
  var c = RG.cloud, on = rgOnScreen(), i = 0;
  while (i < c.seq.length && on.indexOf(c.seq[i]) >= 0) i++;
  if (i >= c.seq.length) return "";   /* 남은 구름 단어가 다 판 위에 있다 · 같은 단어 둘이 동시에 떠 있지 않게 잠깐 기다린다(rgSpawn 이 0.25초 뒤 다시) */
  var w = c.seq.splice(i, 1)[0];
  RG.next = c.seq.slice(0, 3);
  return w;
}
function rgCloudRem() { var c = RG.cloud; if (!c) return 0; var k = c.seq.length; RG.words.forEach(function (w) { if (w.cl) k++; }); return k; }
function rgCloudCheck(now) {
  if (!RG.cloud || RG.bonus || RG.ending || rgCloudRem() > 0) return false;
  rgBonusStart(now);
  return true;
}
/* 입력칸 막기 · 조합을 먼저 끊고(rgClearInput) 읽기 전용 · 늦게 오는 조합 글자도 한 번 더 비운다 */
function rgLock(on) {
  var inp = rgEl("rgIn");
  rgClearInput(); RG.pendingEnter = false;
  if (!inp) return;
  inp.readOnly = !!on;
  if (on) setTimeout(function () { if (RG.bonus && RG.bonus.ph !== "type" && inp.value) inp.value = ""; }, 60);
}
/* v5.30 보너스 화면은 판 안 장면(wout ~ bin) · 그 밖(clear · 전환 · 제목 카드)은 판이 아니다 */
function rgBonusScene(ph) { return ph === "wout" || ph === "intro" || ph === "count" || ph === "type" || ph === "res" || ph === "bin"; }
/* v5.30 보너스 동안 아래 일반 입력칸을 보이지 않게 · 입력은 숨긴 칸이 계속 받는다(포커스 · 한글 조합 그대로) · 칸 자리(판 아래 틀)는 그대로 두어 판 크기가 흔들리지 않는다 */
function rgFormBns(on) {
  var f = rgEl("rgForm"), inp = rgEl("rgIn");
  if (f && f.children) Array.prototype.forEach.call(f.children, function (c) { c.style.opacity = on ? "0" : ""; c.style.pointerEvents = on ? "none" : ""; });
  if (inp && inp.style) inp.style.caretColor = on ? "transparent" : "";
}
function rgBonusStart(now) {
  var L = RG.L, c = RG.cloud; if (!c) return;
  var text = c.text, lim = rgBonusLim(text.length);
  RG.words.forEach(function (w) { rgBurst(w.x + w.bw / 2, rgWordY(w) + L.boxH / 2, 6, [RAIN_PAL.o50, RT_PAL.tan2]); });   /* 남은 단어(보통 없다)는 벌칙 없이 흩어진다 */
  RG.words = []; RG.banner = null; RG.next = [];
  RG.bonus = { text: text, keys: c.keys, lim: lim, left: lim, ph: "clear", t: RAIN_CLOUD.clear, at: now, typed: "", res: null, no: c.no };
  RG.inMax = RAIN_BONUS.inMax;
  var inp = rgEl("rgIn"); if (inp) { inp.maxLength = RAIN_BONUS.inMax; if (RG.bonusPh == null) RG.bonusPh = inp.placeholder; inp.placeholder = "구름이 걷히는 중"; }
  rgLock(true); rgTipShow(false); rgFormBns(true);
  rgSfx("rgbonus");
}
/* 단계 · clear(구름 걷힘) → win(전체 화면 닫힘) → title(BONUS STAGE 카드) → wout(열림 · 보너스 무대) → intro → count → type → res → bin(닫힘) → btitle(STAGE n 카드) → bout(열림 · 비 내리는 판) · type 말고는 입력칸이 막혀 있다 */
function rgBonusTick(dt, now) {
  var b = RG.bonus, inp = rgEl("rgIn"), was = b.t, T = RAIN_TRANS;
  b.t -= dt;
  if (b.ph === "clear") { if (b.t <= 0) { b.ph = "win"; b.t = T.wipe; } return; }
  if (b.ph === "win") { if (b.t <= 0) { b.ph = "title"; b.t = T.title; rgSfx("rgjoin"); } return; }
  if (b.ph === "title") { if (b.t <= 0) { b.ph = "wout"; b.t = T.wipe; } return; }
  if (b.ph === "wout") { if (b.t <= 0) { b.ph = "intro"; b.t = RAIN_BONUS.intro; if (inp) inp.placeholder = "문장을 읽어 두세요"; } return; }
  if (b.ph === "intro") { if (b.t <= 0) { b.ph = "count"; b.t = RAIN_CLOUD.count; rgSfx("tick"); } return; }
  if (b.ph === "count") {
    if (b.t <= 0) { b.ph = "type"; b.typed = ""; b.go = RAIN_CLOUD.go; rgLock(true); rgSfx("go"); }   /* GO 0.3초 동안도 막아 둔다 · 카운트다운 중 누르던 키가 문장 앞에 섞이지 않게 */
    else if (Math.ceil(b.t) !== Math.ceil(was)) rgSfx("tick");
    return;
  }
  if (b.ph === "type") {
    if (b.go > 0) { b.go -= dt; if (b.go <= 0) { b.typed = ""; rgLock(false); if (inp) inp.placeholder = "문장을 그대로 치고 Enter"; } return; }
    b.left = Math.max(0, b.left - dt); if (b.left <= 0) rgBonusEnd("time"); return;
  }
  if (b.ph === "res") { if (b.t <= 0) { b.ph = "bin"; b.t = T.wipe; } return; }
  if (b.ph === "bin") { if (b.t <= 0) { b.ph = "btitle"; b.t = T.back; RG.cloud = null; rgSfx("level"); } return; }
  if (b.ph === "btitle") { if (b.t <= 0) { b.ph = "bout"; b.t = T.wipe; } return; }
  if (b.ph === "bout" && b.t <= 0) {   /* 판으로 돌아간다 · 보너스에 쓴 시간(전환 포함)만큼 게임 시계를 민다 · 맑은 틈 뒤 다음 구름 */
    RG.t0 += now - b.at; RG.bonus = null; RG.cloud = null; RG.inMax = 12;
    RG.cloudAt = RG.cloudN >= RAIN_CLOUD.max ? Infinity : rgElapsed(now) + RAIN_CLOUD.gap;
    if (inp) { inp.maxLength = 12; if (RG.bonusPh != null) inp.placeholder = RG.bonusPh; }
    RG.bonusPh = null;
    rgLock(false); rgFormBns(false); RG.spawnT = 0.4; RG.next = null; if (!RG.seed) rgNextFill();
  }
}
function rgBonusEnd(why) {
  var b = RG.bonus; if (!b || b.ph !== "type") return;
  var r = rgBonusScore(b.typed, b.text, why, b.left);
  b.res = r; b.ph = "res"; b.t = RAIN_BONUS.show;
  RG.score += r.pts; RG.bns += r.pts; RG.bnsN++;
  rgLock(true);
  rgSfx(r.perfect ? "best" : r.ok ? "rgcombo" : "rgmiss", 2);
}
/* v5.30 구름 모양 · 40 × 14 칸 한 벌(판 크기와 무관) · 봉우리 다섯 + 아랫단 · 칸 크기(c)만 판 · 남은 단어에 맞춰 바뀐다(정수라 도트가 뭉개지지 않는다) */
var RG_CLS = null;
function rgCloudShape() {
  if (RG_CLS) return RG_CLS;
  var cols = 40, rows = 14, cells = [], on = {};
  var B = [[0.16, 8.6, 3.8], [0.36, 5.8, 5.2], [0.6, 4.6, 6.0], [0.83, 7.6, 4.4]], top = [];
  for (var x = 0; x < cols; x++) {   /* 칸마다 맨 위 칸을 찾고 아래는 아랫단까지 채운다(봉우리 사이 구멍 없음) */
    var fx = (x + 0.5) / cols, t = fx > 0.05 && fx < 0.95 ? 9 : rows;
    for (var y = 0; y < t; y++) for (var k = 0; k < B.length; k++) { var dx = (x + 0.5 - B[k][0] * cols) / (B[k][2] * 0.95), dy = (y + 0.5 - B[k][1]) / B[k][2]; if (dx * dx + dy * dy <= 1) { t = y; break; } }
    var bot = fx > 0.18 && fx < 0.82 ? 13 : fx > 0.09 && fx < 0.91 ? 12 : fx > 0.05 && fx < 0.95 ? 11 : -1;
    for (var yy = t; yy <= bot; yy++) { on[x + "," + yy] = 1; cells.push([x, yy]); }
  }
  cells.forEach(function (p) { p.push(!on[p[0] + "," + (p[1] - 1)] ? 1 : !on[p[0] + "," + (p[1] + 1)] ? 2 : 0); });
  RG_CLS = { cols: cols, rows: rows, cells: cells };
  return RG_CLS;
}
/* v5.30 구름 자리 · 폭 = 판 × (0.40 + 0.22 × 아직 안 내린 비율) · 최소 240(가장 긴 단어 + 여백) · 천천히 좌우로(RAIN_CLOUD_FX.drift 초 한 바퀴) · 단어가 생기면 한 칸 출렁(puff)
   단어는 이 폭 안에서 생기고 구름 아래 가장자리에서 나온다(rgSpawn) · 동작 줄이기 = 가운데 고정 · 출렁 없음 */
function rgCloudGeo(L, now) {
  var S = rgCloudShape(), cl = RG.cloud, X = RAIN_CLOUD_FX, f = cl ? cl.seq.length / Math.max(1, cl.n) : 1, rm = rgReduced();
  var cw = Math.min(L.W - 16, Math.max(240, L.W * (X.w0 + X.w1 * f))), c = Math.max(3, Math.floor(cw / S.cols)), w = c * S.cols, h = c * S.rows;
  var amp = Math.max(0, (L.W - w) / 2 - 10) * X.amp, mid = L.W / 2 + (rm ? 0 : amp * Math.sin((now || 0) / 1000 * Math.PI * 2 / X.drift));
  var pf = cl && cl.puff > 0 ? cl.puff / X.puff : 0, dy = rm || !pf ? 0 : Math.round(c * Math.sin(Math.PI * (1 - pf)));
  var x0 = Math.round(mid - w / 2), y0 = 4 + dy;
  return { c: c, w: w, h: h, x0: x0, y0: y0, cols: S.cols, rows: S.rows, cells: S.cells, left: x0 + c, right: x0 + w - c, bottom: y0 + h, f: f, pf: pf };
}
/* 판 위 비구름 · 단어 앞에 그린다(단어가 구름 몸통 뒤에서 생겨 아래로 빠져나온다) · 남은 단어가 줄수록 작고 옅어진다(세 톤) · 단어가 생기는 순간 한 톤 어둡게 + 출렁
   구름 몸통 안 「구름 n/3」 + 칸(■ 구름 안 · 주황 반 = 떨어지는 중 · 나무 = 끝남) · 맑은 틈 = 옅은 구름이 다시 모이며 「다음 구름 n초」 · 걷힘(clear) = 좌우로 갈라지며 위로 */
var RG_CL_TONE = [["gray", "dim", "wood"], ["cream", "gray", "dim"], ["w", "cream", "gray"]];
function rgClTone(i, k) { var n = RG_CL_TONE[i][k]; return RAIN_PAL[n] || RT_PAL[n]; }
function rgCloudDraw(ctx, L, now) {
  var b = RG.bonus, cl = RG.cloud, rm = rgReduced(), a = 1, k = 0, gapT = -1, t, tone = 2;
  var G = rgCloudGeo(L, now), c = G.c;
  if (b && b.ph === "clear") { k = 1 - Math.max(0, b.t) / RAIN_CLOUD.clear; a = 1 - k; t = "구름이 걷혀요"; }
  else if (cl) { tone = G.f > 0.6 ? 0 : G.f > 0.25 ? 1 : 2; if (G.pf > 0) tone = Math.max(0, tone - 1); t = "구름 " + cl.no + "/" + RAIN_CLOUD.max; }
  else if (RG.cloudN < RAIN_CLOUD.max && isFinite(RG.cloudAt)) { gapT = Math.max(0, RG.cloudAt - (RG.t0 ? rgElapsed(now) : 0)); a = 0.12 + 0.4 * (1 - Math.min(1, gapT / RAIN_CLOUD.gap)); t = "다음 구름 " + Math.ceil(gapT) + "초"; }
  else return;
  var mid = G.x0 + G.w / 2, lift = Math.round(k * G.h * 1.2), sp = rm ? 0 : k * L.W * 0.35;
  var X = function (p) { var x = G.x0 + p[0] * c; return Math.round(x + (x + c / 2 < mid ? -sp : sp)); };
  ctx.save();
  if (cl && !b && !rm) {   /* 빗줄기 · 구름 폭 안에서만 · 구름 아래로 짧게 */
    for (var i = 0; i < 10; i++) {
      var ph = (now / 650 + i * 0.37) % 1, sx = G.x0 + ((i * 7 + 3) % (G.cols - 4) + 2) * c + Math.round(c / 2), sy = G.bottom + Math.round(ph * L.D * 14);
      ctx.globalAlpha = (1 - ph) * 0.9; ctx.fillStyle = RAIN_PAL.dim; ctx.fillRect(sx, sy, 3, L.D * 2);
    }
  }
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  ctx.fillStyle = RAIN_PAL.ink;
  if (a >= 0.99) G.cells.forEach(function (p) { ctx.fillRect(X(p) - 2, G.y0 + p[1] * c - lift - 2, c + 4, c + 4); });   /* 먹 테두리는 꽉 찬 구름에만(반투명이면 칸마다 겹쳐 격자가 보인다) */
  G.cells.forEach(function (p) { ctx.fillStyle = rgClTone(tone, p[2] === 1 ? 0 : p[2] === 2 ? 2 : 1); ctx.fillRect(X(p), G.y0 + p[1] * c - lift, c, c); });
  ctx.textBaseline = "middle";
  if (cl && !b) {   /* 이름 · 칸 · 구름 몸통 안 */
    var n = cl.n, in0 = cl.seq.length, rem = rgCloudRem(), ps = 6, pg = 2, pw = n * (ps + pg) - pg, ly = Math.round(G.y0 + G.h * 0.44);
    ctx.textAlign = "center"; rtText(ctx, t, mid, ly, 16, RT_PAL.cream, RAIN_PAL.ink);
    var qx = Math.round(mid - pw / 2), qy = ly + 14;
    ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(qx - 2, qy - 2, pw + 4, ps + 4);
    for (var q = 0; q < n; q++) { ctx.fillStyle = q < in0 ? RAIN_PAL.o100 : q < rem ? RAIN_PAL.o30 : RT_PAL.wood; ctx.fillRect(qx + q * (ps + pg), qy, ps, ps); }
  } else {   /* 이름표 · 걷힘 · 맑은 틈 */
    var fp = L.big && L.W >= 560 ? 32 : 16;
    ctx.font = rtFont(fp);
    var w = Math.ceil(ctx.measureText(t).width) + 28, hh = fp + 16, tx = Math.round(mid - w / 2), ty = Math.round(G.y0 + G.h * 0.55 - hh / 2) - lift;
    tx = Math.max(4, Math.min(L.W - 4 - w, tx));
    ctx.globalAlpha = b ? Math.max(0, 1 - k) : 0.85;
    rtTag(ctx, tx, ty, w, hh, RT_PAL.night, RT_PAL.bark, RAIN_PAL.ink);
    ctx.textAlign = "left"; rtText(ctx, t, tx + 14, ty + hh / 2, fp, gapT >= 0 ? RT_PAL.tan2 : RT_PAL.cream, null);
  }
  ctx.restore();
}
/* v5.30 빗방울 꼬리 · 구름에서 막 나온 단어(p < 0.45) 위로 구름 아래 가장자리까지 끊긴 빗줄기 세 가닥 · 내려갈수록 옅어진다 */
function rgRainTails(ctx, L, now) {
  if (!RG.cloud || rgReduced()) return;
  var G = rgCloudGeo(L, now), D = L.D;
  ctx.save(); ctx.fillStyle = RAIN_PAL.dim;
  RG.words.forEach(function (w) {
    if (!w.cl || w.y0 == null || w.p >= 0.45) return;
    var wy = rgWordY(w), y1 = Math.max(G.bottom - 2, wy - 18 * D);
    ctx.globalAlpha = Math.min(1, (1 - w.p / 0.45) * 1.2);
    for (var j = 0; j < 3; j++) {
      var x = Math.round(w.x + w.bw * (0.25 + 0.25 * j)), off = (now / 40 + j * 5) % (4 * D);
      for (var y = y1 + off; y < wy - 3; y += 4 * D) ctx.fillRect(x, Math.round(y), 3, Math.min(2 * D, wy - 3 - y));
    }
  });
  ctx.restore();
}
/* v5.30 보너스 무대 · 평소 판(밝은 체크 · 나무 · 흙)과 확실히 다른 밤 무대 · 별 · 조명 두 줄기 · 주황 무대 바닥 */
function rgBonusBg(ctx, L, now) {
  var D = L.D, W = L.W, g = L.ground, rm = rgReduced();
  ctx.fillStyle = RT_PAL.night; ctx.fillRect(0, 0, W, L.H);
  for (var yy = 0; yy < g; yy += 2 * D) { ctx.fillStyle = (yy / (2 * D)) % 2 ? RT_PAL.night : RT_PAL.bark; ctx.fillRect(0, yy, W, D); }   /* 가는 줄무늬 · 화면 결 */
  [[0.08, 1], [0.92, -1]].forEach(function (s) {   /* 조명 · 위에서 무대로 넓어지는 계단 띠 */
    for (var y = 0; y < g; y += 2 * D) {
      var k = y / g, cx = W * (s[0] + s[1] * 0.3 * k), hw = 6 * D + k * W * 0.16;
      ctx.fillStyle = "rgba(255,126,49," + (0.05 + 0.07 * k).toFixed(3) + ")"; ctx.fillRect(Math.round(cx - hw), y, Math.round(2 * hw), 2 * D);
    }
  });
  for (var i = 0; i < 34; i++) {   /* 별 · 자리는 고정 · 반짝임만 */
    var sx = Math.round(((i * 61 + 17) % 97) / 97 * (W - 2 * D) + D), sy = Math.round(((i * 37 + 11) % 89) / 89 * g * 0.86);
    var tw = rm ? 1 : (Math.floor(now / 380) + i) % 6;
    if (!tw) continue;
    ctx.fillStyle = i % 5 === 0 ? RAIN_PAL.o100 : i % 2 ? RT_PAL.tan2 : RAIN_PAL.o60;
    if (i % 5 === 0 && tw > 2) { ctx.fillRect(sx - D, sy, 3 * D, D); ctx.fillRect(sx, sy - D, D, 3 * D); } else ctx.fillRect(sx, sy, D, D);
  }
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(0, g, W, 2);   /* 무대 바닥 */
  ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(0, g + 2, W, 2 * D);
  ctx.fillStyle = RAIN_PAL.o60; ctx.fillRect(0, g + 2, W, D / 2);
  for (var r = 0, y2 = g + 2 + 2 * D; y2 < L.H; r++, y2 += 3 * D) for (var x = (r % 2) * -4 * D; x < W; x += 8 * D) {
    ctx.fillStyle = RT_PAL.wood; ctx.fillRect(x, y2, 8 * D - 2, 3 * D - 2);
    ctx.fillStyle = RT_PAL.bark; ctx.fillRect(x, y2 + 3 * D - 2, 8 * D, 2);
  }
}
/* 문장 판 · 판 가운데 나무 판 · 머리 = 점 글자 BONUS STAGE · 문장 한 줄 + 바로 밑 내가 친 줄(같은 글자 크기 · 같은 칸 · 맞음 = 밝게 · 틀림 = 주황 바탕 · 조합 중 = 주황 글자 · 커서 깜빡임) · 시간 막대 · 결과
   v5.30 아래 일반 입력칸은 보이지 않는다(rgFormBns) · 친 글자는 여기 한 곳에만 보인다 */
function rgBonusDraw(ctx, L, now) {
  var b = RG.bonus; if (!b) return;
  var big = L.big, s = big ? 3 : 2, fp = big ? 32 : 16, pw = Math.min(L.W - 2 * s, big ? 720 : 340), px = Math.round(L.W / 2 - pw / 2);
  if (b.ph === "clear" || b.ph === "win") {   /* v5.24 구름이 걷히는 순간 · 점 글자 CLOUD CLEAR 가 켜진다 · 판은 아직 그리지 않는다 */
    var kc = b.ph === "win" ? 1 : 1 - Math.max(0, b.t) / RAIN_CLOUD.clear, n0 = rtDotsN("CLOUD CLEAR");
    ctx.save(); ctx.fillStyle = "rgba(27,23,18," + (0.62 * kc).toFixed(3) + ")"; ctx.fillRect(0, 0, L.W, L.H);
    rtDots(ctx, "CLOUD CLEAR", L.W / 2, Math.round(L.floor * 0.4), big ? 40 : 26, RAIN_PAL.o100, { align: "center", line: RAIN_PAL.ink, lit: rgReduced() ? null : Math.ceil(Math.min(1, kc * 1.6) * n0) });
    ctx.restore();
    return;
  }
  if (!rgBonusScene(b.ph)) return;
  var km = [];   /* v5.24 핵심 단어 자리 · 문장을 먼저 보여 줄 때 주황으로 짚는다(비로 내린 그 단어) */
  (b.keys || []).forEach(function (w) { var i = b.text.indexOf(w); if (i >= 0) for (var j = 0; j < w.length; j++) km[i + j] = 1; });
  ctx.save();
  ctx.font = rtFont(fp);
  var lines = rgWrap(ctx, b.text, pw - 16 * s - 8), lh = Math.round(fp * 1.5), rg = big ? 12 : 8, th = big ? 40 : 26;
  var lpH = big ? 56 : 34, ph = 8 * s + th + 14 + lines.length * (2 * lh + rg) + 6 + (big ? 18 : 12) + 12 + lpH + 8 * s, py = Math.max(8, Math.round(L.floor * 0.46 - ph / 2));
  rtPanel(ctx, px, py, pw, ph, s, RT_PAL.night);
  var cy = py + 5 * s + th / 2, on = rgReduced() || Math.floor(now / 260) % 2 === 0;
  rtDots(ctx, "BONUS STAGE", L.W / 2, cy, th * 0.62, on ? RAIN_PAL.o100 : RAIN_PAL.o60, { align: "center", line: RAIN_PAL.ink });
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  rtText(ctx, b.no + "/" + RAIN_CLOUD.max, px + pw - 6 * s, cy, 16, RT_PAL.tan, null);
  cy += th / 2 + 14;
  var pre = b.ph === "wout" || b.ph === "intro" || b.ph === "count", typed = pre ? "" : String(b.typed || ""), k = 0, cur = b.ph === "type" && !(b.go > 0), blink = rgReduced() || Math.floor(now / 400) % 2 === 0;
  var mark = function (x, y, w) { ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(Math.round(x), Math.round(y + fp * 0.56), Math.max(6, Math.ceil(w)), 4); };   /* 커서 */
  var bad = function (x, y, w, tc) { ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(Math.round(x), Math.round(y - fp * 0.62), Math.max(8, Math.ceil(w)), Math.round(fp * 1.24)); if (tc && tc !== " ") rtText(ctx, tc, x + Math.max(0, (w - ctx.measureText(tc).width) / 2), y, fp, RT_PAL.night, null); };
  var ex = 0, ey = 0;
  ctx.textAlign = "left";
  lines.forEach(function (ln, li) {
    ctx.font = rtFont(fp);
    var lw = ctx.measureText(ln).width, x = Math.round(L.W / 2 - lw / 2), y1 = cy + lh / 2, y2 = cy + lh + lh / 2;
    ctx.fillStyle = RT_PAL.bark; ctx.fillRect(x - 10, Math.round(cy + lh + 2), Math.round(lw + 20), lh - 4);   /* 따라 쓰는 줄 · 어두운 띠 + 나무 밑줄 */
    ctx.fillStyle = RT_PAL.wood; ctx.fillRect(x - 10, Math.round(cy + 2 * lh - 4), Math.round(lw + 20), 2);
    for (var i = 0; i < ln.length; i++, k++) {
      var ch = ln.charAt(i), w = ctx.measureText(ch).width, col = RT_PAL.cream;
      if (pre) col = km[k] ? RAIN_PAL.o60 : RT_PAL.cream;
      else if (k < typed.length) col = typed.charAt(k) === ch ? RT_PAL.tan : RT_PAL.cream;   /* 맞게 친 자리는 한 톤 내려 남은 곳이 보이게 */
      else if (cur && k === typed.length) col = RAIN_PAL.o100;
      if (ch !== " ") rtText(ctx, ch, x, y1, fp, col, null);
      if (k < typed.length) {
        var tc = typed.charAt(k), last = k === typed.length - 1;
        ctx.font = rtFont(fp);
        if (tc === ch) { if (tc !== " ") rtText(ctx, tc, x + (w - ctx.measureText(tc).width) / 2, y2, fp, RAIN_PAL.w, null); }
        else if (last && rgJm(ch).indexOf(rgJm(tc)) === 0) { rtText(ctx, tc, x + Math.max(0, (w - ctx.measureText(tc).width) / 2), y2, fp, RAIN_PAL.o60, null); ctx.fillStyle = RAIN_PAL.o60; ctx.fillRect(Math.round(x), Math.round(y2 + fp * 0.56), Math.ceil(w), 2); }   /* 한글 조합 중 */
        else bad(x, y2, w, tc);
      } else if (cur && k === typed.length && blink) mark(x, y2, w);
      x += w;
    }
    if (li < lines.length - 1) {   /* 줄을 나눈 자리의 띄어쓰기 한 칸 · 친 글자가 띄어쓰기가 아니면 줄 끝에 틀림으로 · 커서도 여기 */
      var sw = ctx.measureText(" ").width;
      if (k < typed.length) { if (typed.charAt(k) !== " ") bad(x + 4, y2, sw, typed.charAt(k)); }
      else if (cur && k === typed.length && blink) mark(x + 4, y2, sw);
      k++;
    }
    ex = x; ey = y2;
    cy += 2 * lh + rg;
  });
  if (typed.length > b.text.length) { ctx.font = rtFont(fp); var more = typed.slice(b.text.length, b.text.length + 3); for (var m = 0; m < more.length; m++) { var mw = Math.max(ctx.measureText(more.charAt(m)).width, fp / 2); bad(ex + 4, ey, mw, more.charAt(m)); ex += mw + 2; } }   /* 문장보다 더 친 글자 */
  /* 시간 막대 · 남은 시간 · 결과 */
  cy += 2;
  var bx = px + 6 * s, bw = pw - 12 * s, bh = big ? 18 : 12, fr = pre ? 1 : b.left / b.lim;
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(bx, cy, bw, bh);
  ctx.fillStyle = RT_PAL.bark; ctx.fillRect(bx + 2, cy + 2, bw - 4, bh - 4);
  ctx.fillStyle = fr < 0.25 ? RAIN_PAL.deep : RAIN_PAL.o100; ctx.fillRect(bx + 2, cy + 2, Math.max(0, Math.round((bw - 4) * fr)), bh - 4);
  cy += bh + 12;
  var lp = big ? 32 : 16;
  ctx.textAlign = "center";
  if (b.ph === "intro" || b.ph === "wout") rtText(ctx, "문장을 읽어 두세요", L.W / 2, cy + lp / 2, 16, RAIN_PAL.o60, null);
  else if (b.ph === "count") { rtText(ctx, String(Math.max(1, Math.ceil(b.t))), L.W / 2, cy + lpH / 2 - 4, big ? 48 : 32, RAIN_PAL.o100, RAIN_PAL.ink); }   /* v5.24 3 · 2 · 1 · 이 동안 입력칸은 막혀 있다 */
  else if (b.ph === "type" && b.go > 0) rtText(ctx, "GO", L.W / 2, cy + lpH / 2 - 4, big ? 48 : 32, RAIN_PAL.o100, RAIN_PAL.ink);
  else if (b.ph === "type") rtText(ctx, b.left.toFixed(1) + "초 · Enter 채점 · Esc 처음부터", L.W / 2, cy + lp / 2, 16, RT_PAL.cream, null);
  else if (b.res) {
    var r = b.res;
    rtText(ctx, (r.perfect ? "PERFECT  " : "") + "+" + r.pts.toLocaleString(), L.W / 2, cy + lp / 2 - (big ? 4 : 2), lp, RAIN_PAL.o100, RAIN_PAL.ink);
    rtText(ctx, "맞은 글자 " + r.ok + "/" + r.n + (r.perfect ? " · 남은 " + r.sec + "초" : ""), L.W / 2, cy + lp + (big ? 12 : 8), 16, RT_PAL.cream, null);
  }
  ctx.restore();
}
/* v5.30 전체 화면 전환 · 캔버스 전체(양옆 판 포함)를 큰 도트 칸이 왼쪽 위에서 오른쪽 아래로 덮고(win · bin) · 같은 순서로 걷힌다(wout · bout) · 막 바뀐 칸은 주황 · 동작 줄이기 = 어둡게 페이드 */
function rgTransDraw(ctx, L) {
  var b = RG.bonus; if (!b) return;
  var ph = b.ph, T = RAIN_TRANS, W = L.CW, H = L.CH, close = ph === "win" || ph === "bin", open = ph === "wout" || ph === "bout", card = ph === "title" || ph === "btitle";
  if (!close && !open && !card) return;
  var p = card ? 1 : 1 - Math.max(0, b.t) / T.wipe;
  ctx.save();
  if (card) { ctx.fillStyle = RT_PAL.night; ctx.fillRect(0, 0, W, H); }
  else if (rgReduced()) { ctx.globalAlpha = close ? p : 1 - p; ctx.fillStyle = RT_PAL.night; ctx.fillRect(0, 0, W, H); }
  else {
    var B = L.big ? 32 : 20, nx = Math.ceil(W / B), ny = Math.ceil(H / B);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var hs = (((i * 73856093) ^ (j * 19349663)) >>> 0) % 1000 / 1000, th = 0.8 * (i / nx * 0.55 + j / ny * 0.45) + 0.2 * hs;
      var cov = close ? th < p : th >= p, edge = close ? p - th < 0.06 : th - p < 0.06;
      if (!cov) continue;
      ctx.fillStyle = edge ? RAIN_PAL.o100 : RT_PAL.night; ctx.fillRect(i * B, j * B, B, B);
      if (edge) { ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(i * B, j * B + B - 3, B, 3); }
    }
  }
  if (card) rgCardDraw(ctx, L, ph === "title");
  ctx.restore();
}
/* v5.30 제목 카드 · 화면 가로 띠가 왼쪽에서 밀려 들어오고 점 글자가 켜진다 · 띠 위아래 전구가 번갈아 깜빡인다
   들어갈 때 = 주황 띠 「BONUS STAGE」 + 「구름 n/3 클리어」 · 나올 때 = 나무 띠 「STAGE n」(지금 단계) + 이번 보너스 점수 */
function rgCardDraw(ctx, L, bonus) {
  var b = RG.bonus, W = L.CW, H = L.CH, T = RAIN_TRANS, dur = bonus ? T.title : T.back, e = dur - Math.max(0, b.t), rm = rgReduced(), now = performance.now();
  var bh = Math.round(Math.min(H * 0.24, 200)), by = Math.round(H * 0.42 - bh / 2), q = rm ? 1 : Math.min(1, e / 0.32), sx = Math.round(-W * Math.pow(1 - q, 3));
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(sx, by - 6, W, bh + 12);
  ctx.fillStyle = bonus ? RAIN_PAL.o100 : RT_PAL.wood; ctx.fillRect(sx, by, W, bh);
  ctx.fillStyle = bonus ? RAIN_PAL.o60 : RT_PAL.tan; ctx.fillRect(sx, by, W, 3);
  ctx.fillStyle = bonus ? RAIN_PAL.deep : RT_PAL.bark; ctx.fillRect(sx, by + bh - 3, W, 3);
  var lt = rm ? 0 : Math.floor(now / 160) % 2;
  for (var x = 10, n = 0; x < W; x += 28, n++) {   /* 띠 위아래 전구 */
    ctx.fillStyle = (n + lt) % 2 ? RT_PAL.cream : RAIN_PAL.o100;
    ctx.fillRect(sx + x, by - 22, 8, 8); ctx.fillRect(sx + x, by + bh + 14, 8, 8);
  }
  var t = bonus ? "BONUS STAGE" : "STAGE " + RG.stage, dh = Math.round(Math.min(bh * 0.5, W * 0.07));
  if (typeof DotGlyph !== "undefined" && DotGlyph.width) while (dh > 20 && DotGlyph.width(t, dh) > W * 0.86) dh -= 4;
  var nd = rtDotsN(t), lit = rm || !nd ? null : Math.ceil(Math.min(1, Math.max(0, e - 0.2) / 0.5) * nd);
  rtDots(ctx, t, sx + W / 2, by + bh / 2, dh, bonus ? RT_PAL.night : RAIN_PAL.o100, { align: "center", line: bonus ? null : RAIN_PAL.ink, lit: lit });
  if (e < 0.5) return;
  ctx.globalAlpha = rm ? 1 : Math.min(1, (e - 0.5) / 0.25);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  var y = by + bh + 72, r = b.res;
  if (bonus) { rtText(ctx, "구름 " + b.no + "/" + RAIN_CLOUD.max + " 클리어", W / 2, y, 32, RT_PAL.cream, RAIN_PAL.ink); rtText(ctx, "문장을 따라 치세요", W / 2, y + 48, 16, RT_PAL.tan2, null); }
  else { rtText(ctx, "보너스 +" + (r ? r.pts : 0).toLocaleString(), W / 2, y, 32, RAIN_PAL.o100, RAIN_PAL.ink); rtText(ctx, "다시 비가 내려요", W / 2, y + 48, 16, RT_PAL.tan2, null); }
}
/* ── 추월 레이스 ── */
function rgRaceRank(sc) { var l = (RG.race && RG.race.list) || [], n = 0; for (var i = 0; i < l.length; i++) if (l[i].score >= sc) n++; return n + 1; }
function rgRaceTick(dt) {
  if (!RG.race) return;
  var r = rgRaceRank(RG.score), p = RG.raceRank || r;
  if (r < p) {
    RG.racePops.push({ from: p, to: r, t: 1.6 });
    if (RG.racePops.length > 2) RG.racePops.shift();
    RG.raceSlide = Math.min(3, (RG.raceSlide || 0) + (p - r));
    rgSfx("rgpass", Math.max(1, Math.min(8, p - r)));
  }
  RG.raceRank = r;
  RG.racePops = RG.racePops.filter(function (x) { x.t -= dt; return x.t > 0; });
  if (RG.raceSlide > 0) RG.raceSlide = Math.max(0, RG.raceSlide - dt * 5);
}
/* 오른쪽 판 · 머리띠 「추월 레이스」 · 지금 순위 크게 · 다음 목표까지 남은 점수 · 세로 줄(위 = 앞사람 · 가운데 = 나 · 아래 = 넘은 사람) + 왼쪽 길(미니맵) · 넘을 때 튀어오름 */
function rgRaceDraw(ctx, L, now) {
  var P = L.pan; if (!P) return;
  var list = (RG.race && RG.race.list) || [], cmp = P.h < 720, b = 3, bh = cmp ? 40 : 60, hp = cmp ? 16 : 32, rf = P.w >= 360 && !cmp ? 32 : 16, rh = rf === 32 ? 46 : 32;
  var rank = rgRaceRank(RG.score), ahead = rank - 1, total = list.length + 1;
  var ix = P.x + b + 14, right = P.x + P.w - b - 14;
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  /* 머리띠 + 지금 순위 */
  var headH = bh + (cmp ? 76 : 112);
  var K = Math.max(3, Math.min(9, Math.floor((P.h - headH - 3 * b - 8) / rh))), down = Math.min(2, list.length - ahead), up = Math.min(ahead, K - 1 - down), rows = up + 1 + down;
  var H = 3 * b + headH + rows * rh + 8;
  rtStep(ctx, P.x, P.y, P.w, H, 2, RAIN_PAL.ink);
  ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(P.x + b, P.y + b, P.w - 2 * b, bh);
  ctx.fillStyle = RAIN_PAL.o60; ctx.fillRect(P.x + b, P.y + b, P.w - 2 * b, 2);
  ctx.fillStyle = RAIN_PAL.deep; ctx.fillRect(P.x + b, P.y + b + bh - 2, P.w - 2 * b, 2);
  rtText(ctx, "추월 레이스", ix, P.y + b + bh / 2, hp, RT_PAL.night, null);
  ctx.fillStyle = RT_PAL.night; ctx.fillRect(P.x + b, P.y + b + bh, P.w - 2 * b, H - 2 * b - bh);
  var y = P.y + b + bh + (cmp ? 10 : 16), big = cmp ? 32 : 48;
  ctx.font = rtFont(big); var rw = ctx.measureText(rank + "위").width;
  rtText(ctx, rank + "위", ix, y + big / 2, big, RAIN_PAL.o100, RAIN_PAL.ink);
  rtText(ctx, "/ " + total + "명", ix + rw + 10, y + big / 2 + (cmp ? 2 : 6), 16, RT_PAL.tan, null);
  y += big + (cmp ? 8 : 14);
  var goal = ahead ? list[ahead - 1] : null;
  rtText(ctx, goal ? "다음 " + ahead + "위까지 " + Math.max(1, goal.score - RG.score + 1).toLocaleString() + "점" : list.length ? "1위 질주 중" : "첫 기록에 도전 중", ix, y + 8, 16, goal ? RT_PAL.cream : RAIN_PAL.o60, null);
  /* 줄 · 위(앞사람) → 나 → 아래(넘은 사람) */
  var ry = P.y + b + headH + 4, slide = (RG.raceSlide || 0) * rh, tx = ix + 6, nx = ix + 30;
  ctx.fillStyle = RT_PAL.wood; ctx.fillRect(tx - 1, ry + rh / 2, 3, Math.max(0, (rows - 1) * rh));   /* 세로 길 */
  ctx.beginPath(); ctx.rect(P.x + b, ry - 2, P.w - 2 * b, rows * rh + 4); ctx.clip();
  var drawRow = function (k, no, name, sc, me) {
    var yy = ry + k * rh + (me ? slide : 0), cy2 = yy + rh / 2;
    if (me) { ctx.fillStyle = RT_PAL.wood; ctx.fillRect(P.x + b, yy, P.w - 2 * b, rh); }
    ctx.fillStyle = me ? RAIN_PAL.o100 : k < up ? RT_PAL.tan : RT_PAL.dim;
    var dz = me ? 12 : 8; ctx.fillRect(Math.round(tx + 0.5 - dz / 2), Math.round(cy2 - dz / 2), dz, dz);
    ctx.font = rtFont(rf); var nw = ctx.measureText("100").width;
    ctx.textAlign = "left"; rtText(ctx, String(no), nx, cy2, rf, me ? RAIN_PAL.o100 : k < up ? RT_PAL.tan2 : RT_PAL.dim, null);
    var val = Number(sc || 0).toLocaleString();
    ctx.textAlign = "right"; rtText(ctx, val, right, cy2, rf, me ? RAIN_PAL.o100 : k < up ? RT_PAL.cream : RT_PAL.dim, null);
    ctx.font = rtFont(rf); var mw = right - ctx.measureText(val).width - 12 - (nx + nw + 10), nm = String(name || "");
    while (nm.length > 1 && ctx.measureText(nm).width > mw) nm = nm.slice(0, -1);
    ctx.textAlign = "left"; rtText(ctx, nm, nx + nw + 10, cy2, rf, me ? RAIN_PAL.o100 : k < up ? RT_PAL.cream : RT_PAL.dim, null);
  };
  for (var j = 0; j < up; j++) { var a = list[ahead - up + j]; drawRow(j, ahead - up + j + 1, a.name, a.score, false); }
  for (var d = 0; d < down; d++) { var c = list[ahead + d]; drawRow(up + 1 + d, ahead + d + 2, c.name, c.score, false); }
  drawRow(up, rank, RG.who || "나", RG.score, true);
  ctx.restore();
  /* 튀어오름 · 「11위 → 10위」 · 내 줄 위로 떠오르며 사라진다 */
  RG.racePops.forEach(function (x, i) {
    var k = 1 - x.t / 1.6, t = x.from + "위 → " + x.to + "위", fp = cmp ? 16 : 32, yy = ry + up * rh + rh / 2 + (fp + 16) / 2 - Math.round(k * (cmp ? 18 : 30)) - i * (cmp ? 30 : 44);   /* 내 줄 위에서 떠오른다 */
    ctx.save(); ctx.globalAlpha = x.t < 0.4 ? x.t / 0.4 : 1;
    ctx.font = rtFont(fp); var w = Math.ceil(ctx.measureText(t).width) + 24, h = fp + 16, xx = Math.round(P.x + P.w / 2 - w / 2);
    rtTag(ctx, xx, yy - h, w, h, RAIN_PAL.o100, RAIN_PAL.o60, RAIN_PAL.deep);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; rtText(ctx, t, xx + w / 2, yy - h / 2, fp, RT_PAL.night, null);
    ctx.restore();
  });
}
/* ── 점 글자 · 부스 사인체(DotGlyph.layout) 를 캔버스에 · 원 점 · 이웃 점 25% 겹침 · line = 바깥 테두리 색(점마다 조금 큰 점을 먼저) · lit = 켤 점 수(켜지는 움직임) ── */
function rtDots(ctx, text, x, cy, h, color, o) {
  o = o || {};
  if (typeof DotGlyph === "undefined" || !DotGlyph.layout) {   /* 선수 화면 등 · 도트 글꼴로 */
    var fp = h >= 40 ? 48 : h >= 24 ? 32 : 16;
    ctx.save(); ctx.textAlign = o.align || "left"; ctx.textBaseline = "middle"; rtText(ctx, text, x, cy, fp, color, o.line || null); ctx.restore();
    return 0;
  }
  var Lg = DotGlyph.layout(text), u = h / Lg.h, w = Lg.w * u, x0 = o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x, y0 = cy - h / 2, r = DotGlyph.D / 2 * u;
  var dots = Lg.dots, n = o.lit == null ? dots.length : Math.max(0, Math.min(dots.length, o.lit));
  ctx.save();
  if (o.line) {
    ctx.fillStyle = o.line; ctx.beginPath();
    for (var i = 0; i < n; i++) { var d = dots[i], cx = x0 + (d[0] + DotGlyph.D / 2) * u, yy = y0 + (d[1] + DotGlyph.D / 2) * u; ctx.moveTo(cx + r + 2, yy); ctx.arc(cx, yy, r + 2, 0, Math.PI * 2); }
    ctx.fill();
  }
  ctx.fillStyle = color; ctx.beginPath();
  for (var j = 0; j < n; j++) { var e = dots[j], ex = x0 + (e[0] + DotGlyph.D / 2) * u, ey = y0 + (e[1] + DotGlyph.D / 2) * u; ctx.moveTo(ex + r, ey); ctx.arc(ex, ey, r, 0, Math.PI * 2); }
  ctx.fill();
  ctx.restore();
  return w;
}
function rtDotsN(text) { return typeof DotGlyph !== "undefined" && DotGlyph.layout ? DotGlyph.layout(text).dots.length : 0; }
/* ── 대기 데모 · 봇이 혼자 친다 · 그림만(판정 · 기록 · 효과음 없음) · RGA 는 RG 와 따로다 ── */
var RGA = { w: [], parts: [], pops: [], spawn: 0.4, k: 0, kt: 0, gap: 0, mas: { x: 0, hop: 0, set: false }, last: 0 };
function rgAttractDraw(ctx, L, now) {
  var dt = Math.min(0.05, ((now - (RGA.last || now)) || 0) / 1000), rm = rgReduced();
  RGA.last = now;
  if (!RGA.mas.set) { RGA.mas.x = L.W / 2; RGA.mas.set = true; }
  ctx.font = rtFont(L.tf);
  /* 새 단어 · 화면에 없는 단어 · 레인 무작위 */
  RGA.spawn -= dt;
  if (RGA.spawn <= 0 && RGA.w.length < Math.min(4, L.maxWords)) {
    var tx = "", g = 0;
    while (g++ < 20) { tx = RAIN_WORDS[Math.floor(Math.random() * RAIN_WORDS.length)]; if (!RGA.w.some(function (q) { return q.text === tx; })) break; }
    var bw = Math.ceil(ctx.measureText(tx).width) + L.padX * 2;
    RGA.w.push({ text: tx, bw: bw, x: Math.round(8 + Math.random() * Math.max(0, L.W - 16 - bw)), p: 0, fall: 6 + Math.random() * 1.5 });
    RGA.spawn = 1.1 + Math.random() * 0.6;
  }
  RGA.w.forEach(function (q) { q.bw = Math.ceil(ctx.measureText(q.text).width) + L.padX * 2; q.p += dt / q.fall; });
  /* 봇 · 가장 아래 단어를 한 글자씩 · 다 치면 터진다 · 단어 사이 잠깐 쉰다 */
  var ti = -1;
  RGA.w.forEach(function (q, i) { if (q.p > 0.12 && (ti < 0 || q.p > RGA.w[ti].p)) ti = i; });
  if (RGA.gap > 0) RGA.gap -= dt;
  else if (ti >= 0) {
    var t = RGA.w[ti];
    if (RGA.tgt !== t) { RGA.tgt = t; RGA.k = 0; RGA.kt = 0.2; }
    RGA.kt -= dt;
    if (RGA.kt <= 0) {
      RGA.k++; RGA.kt = 0.14 + Math.random() * 0.1;
      if (RGA.k > t.text.length) {
        var cx = t.x + t.bw / 2, cy = L.top + Math.min(1, t.p) * L.fallPx + L.boxH / 2, n = rm ? 4 : 14;
        for (var pi = 0; pi < n; pi++) { var an = Math.PI * 2 * pi / n, sp = 90 + Math.random() * 100; RGA.parts.push({ x: cx, y: cy, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 60, t: 0.5, c: [RAIN_PAL.o100, RAIN_PAL.ink, RAIN_PAL.w][pi % 3], s: 6 }); }
        RGA.pops.push({ x: cx, y: cy, text: "+" + t.text.length * 10, t: 0.8 });
        RGA.w.splice(ti, 1); RGA.tgt = null; RGA.k = 0; RGA.gap = 0.25 + Math.random() * 0.3;
        if (!rm) { RGA.mas.x = Math.max(L.masW / 2, Math.min(L.W - L.masW / 2, cx)); RGA.mas.hop = 0.25; }
      }
    }
  }
  for (var wi = RGA.w.length - 1; wi >= 0; wi--) if (RGA.w[wi].p >= 1) { if (RGA.tgt === RGA.w[wi]) RGA.tgt = null; RGA.w.splice(wi, 1); }
  RGA.parts = RGA.parts.filter(function (p) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; return p.t > 0; });
  RGA.pops = RGA.pops.filter(function (p) { p.t -= dt; p.y -= 30 * dt; return p.t > 0; });
  if (RGA.mas.hop > 0) RGA.mas.hop -= dt;
  /* 그리기 · 게임과 같은 그림 */
  rgWorldD(ctx, L);
  ctx.fillStyle = RAIN_PAL.deep;
  for (var lx = 0; lx < L.W; lx += 3 * L.D) ctx.fillRect(lx, L.floor, 2 * L.D, 2);
  RGA.w.forEach(function (q) {
    var on = q === RGA.tgt;
    rgWordDraw(ctx, L, q.x, L.top + Math.min(1, q.p) * L.fallPx, q.bw, q.text, on, q.p > 0.78, on ? q.text.slice(0, RGA.k) : "");
  });
  var u = L.D / 2, bob = rm ? 0 : Math.floor(now / 300) % 2 * Math.round(L.D / 3), hop = rm || !(RGA.mas.hop > 0) ? 0 : Math.round(Math.sin(Math.PI * (1 - RGA.mas.hop / 0.25)) * 2 * L.D);
  rgBotDraw(ctx, RGA.mas.x, L.ground + bob - hop, RG_BOT.w, RG_BOT.h, u);
  RGA.parts.forEach(function (p) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); });
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  RGA.pops.forEach(function (p) { rtText(ctx, p.text, p.x, p.y, L.big ? 32 : 16, RAIN_PAL.w, RAIN_PAL.ink); });
}
/* Node 에서 규칙만 따로 돌려 보기 위한 통로(판 길이 시뮬레이션) · 브라우저에서는 쓰지 않는다 */
if (typeof module !== "undefined" && module.exports) module.exports = { RG: RG, RAIN_WORDS: RAIN_WORDS, rgSeed: rgSeed, rgRnd: rgRnd, rgShuf: rgShuf, rgPickWord: rgPickWord, rgLayout: rgLayout, rgUpdate: rgUpdate, rgSpawn: rgSpawn, rgStat: rgStat, rgRamp: rgRamp,
  rgNextFill: rgNextFill, rgNextWord: rgNextWord, rgWrap: rgWrap, rgHgMap: rgHgMap, rgHgAdd: rgHgAdd, rgHgBack: rgHgBack, rgHangulize: rgHangulize, RGP: RGP,
  RAIN_BONUS_LINES: RAIN_BONUS_LINES, RAIN_BONUS: RAIN_BONUS, RAIN_LIFE_BONUS: RAIN_LIFE_BONUS, rgBonusLim: rgBonusLim, rgLev: rgLev, rgBonusScore: rgBonusScore, rgRaceRank: rgRaceRank,
  rgRaceTick: rgRaceTick, rgSubmit: rgSubmit, rgEnd: rgEnd, rgBonusStart: rgBonusStart, RAIN_CLOUD: RAIN_CLOUD, rgCloudStart: rgCloudStart, rgCloudRem: rgCloudRem, rgLive: rgLive, rgHgKey: rgHgKey,
  rgCloudGeo: rgCloudGeo, RAIN_CLOUD_FX: RAIN_CLOUD_FX, RAIN_TRANS: RAIN_TRANS, rgWordY: rgWordY };
