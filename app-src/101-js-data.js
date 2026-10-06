/* ════════════════ 데이터 (정본 260710 + 260803 + v16 + 18F) ════════════════ */
var FESTIVAL = {
  name: "AX Festival 2026",
  date: "2026. 10. 26 (월)", timeRange: "09:30 – 17:30", place: "광화문 본사",
  floors: "1F · 10F · 17F · 18F",
  mockOnline: 1842, mockIdeas: 214, mockGamePlayers: 1260,
  mockStamp3: 61, mockWave: 1128, mockWe: 0
};
/* v5.10 앱 이름(사용자 261003) · 화면에만 쓴다(헤더 · 로그인 점 이름 · 읽는 이름) · 설치 이름(manifest · apple 제목) · <title> · 알림 문구는 「AX Festival」 그대로 */
var APP_NAME = "AX Passport";
/* ════════════════ v5.10 점 글자 DotGlyph (부스 사인체 · 261003 사용자 결정 · design.md A-5 5-20 · 정본 「디자인 시안/도트 글자/계획.md」 · 글자표 = 같은 폴더 글자표.json) ════════════════
   1층 부스 발주 .ai 의 구역 사인 글자(5 x 5 점 · 이웃 점 25% 겹침 · 효과 없음)를 SVG 도형으로 그린다. 폰트 · 그림 파일이 아니라 오프라인에서도 그대로다.
   그리는 곳은 DotGlyph.svg 한 곳 · 부르는 곳은 허용 목록(검사 157절): 헤더 이름 · 로그인 이름 · 구역 간판 칩 · 경품 표지 PRIZES · 스탬프 팝 n / 6 · 행운권 번호.
   영문 대문자 · 숫자 · 기호 / - . : + ! · ? 만(소문자는 대문자로 그린다 · 없는 글자는 건너뛴다 · 한글 없음). 읽는 이름(aria-label)을 늘 준다(hidden 이면 바깥 요소가 준다).
   o = { h: 글자 높이 px · color: 점 색(기본 currentColor) · label: 읽는 이름(기본 text) · hidden: 읽지 않음 · accent: { n: 앞 글자 수, color } · cls
         anim: 점이 차례로 켜짐(스탬프 팝 숫자 · 행운권 번호에만) · only: 켜지는 글자 번호(나머지는 켜진 채) · step: 점 간격 ms · delay: 시작 ms } */
var DotGlyph = (function () {
  var T = {"A":[".XXX.","X...X","XXXXX","X...X","X...X"],"B":["XXXX.","X...X","XXXXX","X...X","XXXX."],"C":[".XXXX","X....","X....","X....",".XXXX"],"D":["XXXX.","X...X","X...X","X...X","XXXX."],"E":["XXXXX","X....","XXXXX","X....","XXXXX"],"F":["XXXXX","X....","XXXX.","X....","X...."],"G":[".XXXX","X....","X.XXX","X...X",".XXXX"],"H":["X...X","X...X","XXXXX","X...X","X...X"],"I":["X","X","X","X","X"],"J":["....X","....X","....X","X...X",".XXX."],"K":["X...X","X..X.","XXX..","X..X.","X...X"],"L":["X....","X....","X....","X....","XXXXX"],"M":["X...X","XX.XX","X.X.X","X...X","X...X"],"N":["X...X","XX..X","X.X.X","X..XX","X...X"],"O":[".XXX.","X...X","X...X","X...X",".XXX."],"P":["XXXX.","X...X","XXXX.","X....","X...."],"Q":[".XXX.","X...X","X...X","X..XX",".XXXX"],"R":["XXXX.","X...X","XXXX.","X..X.","X...X"],"S":[".XXXX","X....",".XXX.","....X","XXXX."],"T":["XXXXX","..X..","..X..","..X..","..X.."],"U":["X...X","X...X","X...X","X...X",".XXX."],"V":["X...X","X...X","X...X",".X.X.","..X.."],"W":["X...X","X...X","X.X.X","XX.XX","X...X"],"X":["X...X",".X.X.","..X..",".X.X.","X...X"],"Y":["X...X",".X.X.","..X..","..X..","..X.."],"Z":["XXXXX","...X.","..X..",".X...","XXXXX"],"0":[".XXX.","X..XX","X.X.X","XX..X",".XXX."],"1":["..X..",".XX..","..X..","..X..",".XXX."],"2":[".XXX.","X...X","...X.","..X..","XXXXX"],"3":["XXXX.","....X",".XXX.","....X","XXXX."],"4":["X...X","X...X","XXXXX","....X","....X"],"5":["XXXXX","X....","XXXX.","....X","XXXX."],"6":[".XXX.","X....","XXXX.","X...X",".XXX."],"7":["XXXXX","....X","...X.","..X..","..X.."],"8":[".XXX.","X...X",".XXX.","X...X",".XXX."],"9":[".XXX.","X...X",".XXXX","....X",".XXX."],"/":["....X","...X.","..X..",".X...","X...."],"-":["...","...","XXX","...","..."],".":[".",".",".",".","X"],":":[".","X",".","X","."],"+":["...",".X.","XXX",".X.","..."],"!":["X","X","X",".","X"],"·":[".",".","X",".","."],"?":[".XXX.","X...X","...X.",".....","..X.."]};
  var PX = 1, PY = 0.9715, D = 1.3081, LG = 0.571, WG = 2.8563, ORIG = "ABEGILNOPSTUVXY";
  function layout(text) {
    var s = String(text).toUpperCase(), x = 0, gap = 0, dots = [], first = true, w = 0, i, c, rows, cols, r, k;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (c === " ") { gap = WG; continue; }
      rows = T[c]; if (!rows) continue;
      if (!first) x += gap; first = false;
      cols = rows[0].length;
      for (k = 0; k < cols; k++) for (r = 0; r < 5; r++) if (rows[r].charAt(k) === "X") dots.push([x + k * PX, r * PY, i]);
      w = x + (cols - 1) * PX + D; x = w; gap = LG;
    }
    return { dots: dots, w: w, h: 4 * PY + D };
  }
  function f(n) { return Math.round(n * 1000) / 1000; }
  function attr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function pathOf(ds, color) {
    if (!ds.length) return "";
    var r = f(D / 2);
    return "<path" + (color ? ' style="fill:' + color + '"' : "") + ' d="' + ds.map(function (d) { return "M" + f(d[0]) + " " + f(d[1] + D / 2) + "a" + r + " " + r + " 0 1 0 " + f(D) + " 0a" + r + " " + r + " 0 1 0 -" + f(D) + " 0z"; }).join("") + '"/>';
  }
  function svg(text, o) {
    o = o || {};
    var L = layout(text), h = o.h || 16, ac = o.accent || null, step = o.step || 26, at = o.delay || 0;
    var tint = function (d) { return ac && d[2] < ac.n ? ac.color : ""; };
    var lit = L.dots.filter(function (d) { return o.anim && (!o.only || o.only.indexOf(d[2]) >= 0); });
    var still = L.dots.filter(function (d) { return lit.indexOf(d) < 0; });
    var body = pathOf(still.filter(tint), ac && ac.color) + pathOf(still.filter(function (d) { return !tint(d); }), "") +
      lit.map(function (d, j) { return '<circle class="dgd" cx="' + f(d[0] + D / 2) + '" cy="' + f(d[1] + D / 2) + '" r="' + f(D / 2) + '" style="' + (tint(d) ? "fill:" + tint(d) + ";" : "") + "animation-delay:" + Math.round(at + j * step) + 'ms"/>'; }).join("");
    return '<svg class="dg' + (o.cls ? " " + o.cls : "") + '" viewBox="0 0 ' + f(L.w) + " " + f(L.h) + '" width="' + f(L.w * h / L.h) + '" height="' + h + '"' +
      (o.color ? ' style="fill:' + o.color + '"' : ' fill="currentColor"') +
      (o.hidden ? ' aria-hidden="true" focusable="false"' : ' role="img" aria-label="' + attr(o.label == null ? text : o.label) + '"') + ">" + body + "</svg>";
  }
  function width(text, h) { var L = layout(text); return L.w * (h || 16) / L.h; }
  return { svg: svg, width: width, layout: layout, table: T, orig: ORIG, D: D };
})();
/* 적립 경로 6종 (260909 확정) · 완주 개념 폐기, 모은 개수가 그대로 보상 기준.
   short = 좁은 자리용 짧은 이름 · where = 층·소요시간 · inapp = 앱에서 바로 되는 칸(구분 뱃지)
   구 p6(포토부스)·p8(미니게임 별도 칸)은 폐지 · 미니게임은 04 미니게임에 통합.
   v47: tap = 스탬프 카드의 바로가기 · cta = 버튼 문구 · note = 카드 안 행동 안내.
   층별 안내(progOpenFl) 폐기로 p1은 QR 스캔, p3은 17F 강연 목록이 목적지다(v4.26 17F 전부 자유 참석 · 대강당 입구 QR 출석).
   v3.1: p4는 카드 안에서 게임 입구를 직접 그린다(stampInnerHtml 특례) · v3.50 「미니게임」 = 게임 중 아무거나 한 판(전원 공개 · v4.09 AI O/X 포함 5종). */
/* v3.52 · 10F 실습형 세션 입장도 p3 로 셀지 · 서버 P3_INCLUDE_10F 와 함께 바꾼다 (기본 끔) */
var P3_INCLUDE_10F = false;
/* v4.83 (261001 사용자 확정 · 앱 개편 1묶음) p2 = AX PLAY · 체험 뒤 스태프가 내 QR 을 찍는다(부스 QR 은 보관 · 스태프 모드 목적 타일 「AX PLAY」) · 옛 · 새 체계 둘 다 이 정의를 쓴다 */
var STAMP_P2 = { id: "p2", title: "AX PLAY", short: "AX PLAY", desc: "1F AX PLAY에서 HiDI-Q 또는 Hi-Helper 체험", where: "1F · 스태프 인증", site: 1, staff: 1, tap: "qrPanelOpen('mine')", cta: "내 QR 보여주기", note: "체험 후 스태프가 내 QR을 스캔" };
/* v4.83 옛 8종(서버 sync 에 stv 가 없는 옛 서버와 붙었을 때만 쓴다 · 운영 서버 배포 전 호환) */
var STAMPS_V1 = [
  { id: "p1", title: "1F 전시", short: "1F 전시", desc: "전시존 끝 QR 입간판 스캔", where: "약 5분", site: 1, tap: "qrScanOpen()", cta: "QR 스캔" },
  STAMP_P2,
  /* v3.52 (사용자 확정 260917) p3 = 프로그램 참여 · DAP 과제상담 · AX 커피챗 중 1회 · 적립은 서버가 확인(상담 체크인/완료·커피챗 접수/완료)
     v4.26 (260924 A안) 17F 는 대강당 입구 QR 첫 출석(att_claim)으로 적립 · 옛 좌석 QR · 입장 스캔 · 신청 기록 경로는 걷어냈다 */
  /* v5.68 (사용자 확정 261005) 프로그램 참여 = 스탬프 2개(x2) · 17F 강의 = 입장 QR 1개 + 끝 QR 1개 · 10F · 커피챗 · 라운지 상담 = 마칠 때 2개 · 여러 개 참여해도 2개까지 */
  /* v5.94 (사용자 결정 261006 「프로그램 참여에 대한 보상은 17층 오후 세션에 대한 부분 외에는 모두 없애줘」 · 「AWS와 MS 강연만」) = 17F 오후 파트너 강연 입장 QR 1개 + 끝 QR 1개 · 두 강연을 다 들어도 2개
     오전 강연 · 유튜브 송출 · 10F · 18F 커피챗 · AX 라운지는 스탬프 없음(출석 기록은 남는다) · 서버 설정 「프로그램스탬프_범위」 = 오후강연(기본) | 전체(옛 규칙) */
  { id: "p3", title: "프로그램 참여", short: "프로그램", desc: "17F 오후 파트너 강연(AWS · MS) 입장 1 + 끝 1", where: "", site: 1, x2: 1, tap: "progGoFl(17)", cta: "17F 강연 보기" },
  { id: "p4", title: "미니게임", short: "미니게임", desc: "서로 다른 미니게임 3종목 · 종목마다 한 판", where: "3종목", inapp: 1 },   /* v4.63 (사용자 확정 260929) 1종 → 서로 다른 3종목 · 판정은 서버(game_submit) */
  { id: "p5", title: "아이디어 한 줄", short: "아이디어", desc: "아이디어 1건 제출", where: "1분", inapp: 1, tap: "App.go('ideas')", cta: "아이디어 쓰기" },
  { id: "p7", title: "전시 QR 퀴즈", short: "QR 퀴즈", desc: "벽 QR 스캔 · 한 세트 완료", where: "약 10분", tap: "App.go('exp')", cta: "QR 퀴즈 풀기" },   /* 정리 #5 퀴즈 화면 없음 · 옛 서버 표 항목만 남김 */
  /* v4.06 (260919 사용자 확정) 계단 B안 · 방화문 앞 QR 로 시작과 끝을 찍는다 · 당일 누적이 계단_층수(v4.92 1개 층)에 닿는 종료 스캔에서 적립 · 판정·적립은 서버(stair_scan)
     site: 담당자 적립 가능 (서버 stamp_grant 가 st 를 받는다) */
  { id: "st", title: "계단 이용", short: "계단", desc: "방화문 앞 QR · 시작과 끝에 찍기 · 한 개 층 이상", where: "", site: 1, tap: "stairOpen()", cta: "계단 안내" },
  /* v3.35 오늘 한 판 설문 · 14:30 부터 · 제출만 하면 적립(답 내용 무관) · 판정·적립은 서버(survey_submit) */
  { id: "sv", title: "오늘 한 판 설문", short: "설문", desc: "설문 제출", where: "60초", inapp: 1, tap: "App.go('survey')", cta: "설문 시작" }
];
function stampDefV1(id) { return STAMPS_V1.filter(function (s) { return s.id === id; })[0]; }
/* v4.83 (261001 사용자 확정) 새 8종 · 번호 순서 = 1 최초 로그인 · 2 AX 퀴즈 · 3 미니 게임 · 4 AX PLAY · 5 아이디어 한 줄 · 6 프로그램 참여 · 7 계단 · 8 설문
   AX 퀴즈(O/X · 기억력)는 게임이 아니라 따로 둔다(사용자 수정 261001 · 이름 · 아이콘 · 진입 화면이 미니 게임과 다르다 · 순위 없음)
   옛 p1(1F 전시) · p7(전시 QR 퀴즈)은 뺐다 · 서버 기록은 남고 이 목록에 없어서 세지 않는다(stampGot) */
var STAMPS_V2 = [
  { id: "lg", title: "최초 로그인", short: "로그인", desc: "로그인하면 자동 적립", where: "자동", inapp: 1, auto: 1 },
  { id: "qz", title: "AX 퀴즈", short: "AX 퀴즈", desc: "5문제 · 모두 답하면 완주", where: "AX 퀴즈", inapp: 1, tap: "App.go('quiz')", cta: "AX 퀴즈 풀기" },
  { id: "p4", title: "미니 게임", short: "미니 게임", desc: "AX 팡 · 점프 · 테트리스 3종 · 종목마다 한 판", where: "팡 · 점프 · 테트리스", inapp: 1, tap: "App.go('games')", cta: "미니 게임 하기" },
  STAMP_P2,
  stampDefV1("p5"), stampDefV1("p3"), stampDefV1("st"), stampDefV1("sv")
];
/* 지금 쓰는 체계 · 기본 = 새 8종(이 기기가 마지막으로 본 서버 판 · 없으면 2) · beSync 가 서버 stv 로 바꾼다(stampVerSet · PP_ORDER 정의 뒤에서 처음 부른다) */
var STAMP_V = 2, STAMPS = STAMPS_V2;
function stampV2() { return STAMP_V === 2; }
/* 스탬프 픽토그램 · 탭 아이콘과 같은 기하 라인(stroke=currentColor) · 이모지 금지 원칙 유지 */
var SICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">';
var STAMP_ICONS = {
  /* v4.83 lg = 문으로 들어가는 화살표 · qz = 말풍선 물음표(퀴즈) · p4 = 게임 패드(미니 게임 · 퀴즈와 다른 모양) */
  lg: SICO + '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M3.5 12h11"/><path d="M10.5 8l4 4-4 4"/></svg>',
  qz: SICO + '<path d="M4 5h16v10.5h-7.2L8.6 19.6V15.5H4z"/><path d="M9.9 8.6a2.2 2.2 0 0 1 4.3.7c0 1.5-2.1 1.6-2.1 2.9"/><path d="M12.1 13.4h.01"/></svg>',
  p1: SICO + '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15.6l4.6-4.2 3.4 3 4-4.6L21 15"/><circle cx="8.6" cy="9.2" r="1.3"/></svg>',
  p2: SICO + '<path d="M7.5 4.5l11 6.4-4.8 1.3-1.3 4.8z"/><path d="M4 4l1.6 1.6M4 9.5h2.2M9.5 4v2.2"/></svg>',
  p3: SICO + '<rect x="3" y="4" width="18" height="11.5" rx="2"/><path d="M12 15.5v4"/><path d="M8 19.5h8"/><path d="M7.5 11.8l3.2-3.3 2.6 2.6 3.2-3.8"/></svg>',
  p4: SICO + '<path d="M7.5 8h9a4.5 4.5 0 0 1 4.3 5.8l-.9 3.1a2.2 2.2 0 0 1-3.8.8L14.4 16H9.6l-1.7 1.7a2.2 2.2 0 0 1-3.8-.8l-.9-3.1A4.5 4.5 0 0 1 7.5 8z"/><path d="M8 10.8v3M6.5 12.3h3"/><path d="M15.6 11.4h.01M17.4 13.2h.01"/></svg>',
  p5: SICO + '<path d="M12 3a6 6 0 0 1 6 6c0 2.3-1.3 3.6-2.3 4.7-.6.7-.9 1.3-1 2.3h-5.4c-.1-1-.4-1.6-1-2.3C7.3 12.6 6 11.3 6 9a6 6 0 0 1 6-6z"/><path d="M9.8 19.5h4.4"/><path d="M10.6 22h2.8"/></svg>',
  st: SICO + '<path d="M3 20h5v-4h4v-4h4V8h5"/><path d="M3 20h18"/></svg>',
  sv: SICO + '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8.5h8M8 12.5h8M8 16.5h5"/></svg>',
  p7: SICO + '<rect x="3.2" y="3.2" width="7" height="7" rx="1.4"/><rect x="13.8" y="3.2" width="7" height="7" rx="1.4"/><rect x="3.2" y="13.8" width="7" height="7" rx="1.4"/><path d="M13.8 13.8h3.1v3.1h-3.1z"/><path d="M20.8 13.8v1.8M17.9 20.8h2.9M13.8 20.8h1.4"/></svg>'
};
/* 보상 (260909 확정) · 확정지급 사다리·즉석경품 응모권 폐지, 스탬프 개수 하나로만 계산한다.
   3개 = 1F 이벤트존 실물 룰렛 1회 (1인 1회 · 내 QR 제시 → 운영자 스캔 차감)
   4·5·6개 = 행운권 1·2·3장 (260929 사용자 확정 · 최대 3장 · 자동 계산 · 별도 행동 불필요 · 17:00 Outro 현장 추첨)
   6개 = 선착순 참여상 자격(261006 경품 기획 변경 · 서버 my.fcfs · 옛 v5.04 완주 경품 추첨 my.fin 은 폐기) */
/* v3.33 · 칸은 8개 · v4.58 (사용자 확정 260929) 스탬프는 8종 중 아무거나 6개가 한도 · 6개를 모으면 끝.
   7·8번째를 받아도 기록(stamps)은 남기되 개수·보상은 6에서 멈춘다 · 3개 = 룰렛 1회 · 4·5·6개 = 행운권 1·2·3장(최대 3장).
   화면 분모·보상 계산·서버 발급이 전부 이 상수들에서 나온다 (앱 STAMP_DENOM = 서버 STAMP_DENOM). */
var STAMP_DENOM = 6;            /* 개수 상한 · 화면 분모 · 레일 헤더 · 완료 팝 */
var RAFFLE_MAX = 3;             /* 응모권 최대 */
var REWARD_CAP = STAMP_DENOM;   /* 보상 계산 상한 = 개수 상한 */
/* 서버가 준 stamps 배열에는 정의 밖 id(구 p6·p8, 계단 p9 등)가 남아 있을 수 있다.
   stampGot = 받은 종류 수(기록 그대로 · 최대 8) · stampCount = 화면·보상의 개수(최대 6) · 표시·보상 계산은 전부 stampCount 로 센다. */
/* v5.68 (사용자 확정 261005) 프로그램 참여 = 2개 · 서버 stampCnt_ 와 같은 셈 · p3 = 2개 · p3h(17F 입장이나 끝 한쪽만) = 1개 · 둘 다면 2개
   stampGot = 상한 전 개수(6을 넘긴 적립 판정용) · stampCount = 화면 · 보상 개수(최대 6) · 서버 sync stamps 에 p3h 가 실려 온다(stampSync 가 지우지 않는다) */
var STAMP_HALF = "p3h";
/* v5.90 (261006 경품 기획 변경) ck = 사전등록 체크인 3개 · 8장 카드(STAMPS) 밖 · 서버 STAMP_UNITS.ck = 3 · stampUnits_ 와 같은 셈(검사 237) */
var STAMP_CK = "ck", STAMP_CK_N = 3;
function stampUnitsOf(list) {
  var n = 0, seen = {}, half = false;
  (list || []).forEach(function (id) {
    if (seen[id]) return;
    seen[id] = 1;
    if (id === STAMP_HALF) { half = true; return; }
    if (id === "ck") { n += 3; return; }   /* = STAMP_CK · STAMP_CK_N(이 함수만 떼어 검사하므로 글자 그대로) */
    var sd = STAMPS.filter(function (s) { return s.id === id; })[0];
    if (sd) n += sd.x2 ? 2 : 1;
  });
  return n + (half && !seen.p3 ? 1 : 0);
}
function stampGot() { return stampUnitsOf(S.get("stamps", [])); }
/* 프로그램 참여 칸 0 · 1 · 2 */
function progUnits() { var st = S.get("stamps", []); return st.indexOf("p3") >= 0 ? 2 : st.indexOf(STAMP_HALF) >= 0 ? 1 : 0; }
/* 정의 8종 + p3h(서버가 아는 스탬프 id) */
function stampKnown(id) { return id === STAMP_HALF || id === STAMP_CK || STAMPS.some(function (s) { return s.id === id; }); }
function stampCount() { return Math.min(STAMP_DENOM, stampGot()); }
/* 3개 = 룰렛(응모권 0) · 4·5·6 = 1·2·3장 · 6개 넘게 받아도 3장 */
function raffleTickets(n) { return Math.max(0, Math.min(RAFFLE_MAX, Math.min(REWARD_CAP, n) - 3)); }
var TIMELINE = [
  /* v3.29 공식 공지 붙임1·2(260917) 기준 · 순서 = 시작 시각순 · NOW_INDEX(데모 1 = 기조연설) 가 이 순서를 가리킨다 */
  { time: "09:30", end: "09:40", title: "Intro · 개회", short: "CEO · AX 선포 및 Festival 개최 안내", place: "17F 대강당", desc: "CEO · AX 선포 및 Festival 개최 안내", tag: "자유 참석" },
  { time: "09:40", end: "10:20", title: "기조연설", short: "CTO · AI 환경 · 전략", place: "17F 대강당", desc: "CTO · AI 환경 · 전략", tag: "자유 참석" },
  { time: "10:30", end: "11:00", title: "내부 강연 · AX 로드맵", short: "디지털전략본부장 · 현대해상 AX 로드맵", place: "17F 대강당", desc: "디지털전략본부장 · 현대해상 AX 로드맵", tag: "자유 참석" },
  { time: "11:00", end: "13:30", title: "점심 · 자유 관람", short: "1F 부스 6구역 관람", place: "1F 로비", desc: "1F 부스 6구역 관람", tag: "휴식" },
  /* always=1 (v3.18): 기간이 길어서가 아니라 「그 시간 안에 아무 때나 들르는」 참여 방식이라 상시 묶음.
     10F 오후 세션(내내 참석)·점심(시간대 구분 역할)은 시간표 유지 */
  { time: "", end: "", title: "AX 커피챗", short: "시간은 매칭 후 앱에서 안내", place: "18F", desc: "시간은 매칭 후 앱에서 안내", tag: "매칭 후 안내", always: 1 },
  { time: "13:30", end: "15:00", title: "파트너사 강연 · AWS", short: "Agentic AI 시대의 일하는 방식 변화 · 구태훈 박사(AWS)", place: "17F 대강당", desc: "입장 · 끝 QR로 출석", tag: "자유 참석", par: 1 },
  { off: 1, time: "13:30", end: "16:30", title: "10F 실습형 세션 A~E", short: "사전 신청자 참여 · 5개 세션 중 1개", place: "10F", desc: "사전 신청자 참여 · 세션별 장소는 프로그램 탭", tag: "사전 신청자 참여", par: 1 },
  { time: "15:10", end: "16:40", title: "파트너사 강연 · MS", short: "AI와 친해지기 · MS", place: "17F 대강당", desc: "입장 · 끝 QR로 출석", tag: "자유 참석", par: 1 },
  /* v3.50 사회자 순서 (사용자 확정 260917) · Outro 문항 기능 폐지 · 설문 참여 안내 → 17:00 Outro */
  /* v3.63 (사용자 확정 260918) 「일단 빼자」 · 항목은 남기고 off 로 일정 탭에서만 감춘다 (설문 기능·송출 화면·홈/스탬프 입구는 그대로) */
  { off: 1, time: "16:45", end: "17:00", title: "설문 참여 안내", short: "오늘 한 판 설문 안내", place: "17F 대강당", desc: "60초 설문 · 스탬프 1개", tag: "자유 참석" },
  { time: "17:00", end: "17:30", title: "마무리 연설", short: "CSO · 일하는 방식 마무리 연설 · DAP 시상 · 현장 추첨", place: "17F 대강당", desc: "CSO · 일하는 방식 마무리 연설 · DAP 시상 · 현장 추첨", tag: "" }   /* v4.79 무대 추첨 = 추첨 QR 체크인한 사람 · v4.99 줄은 제목 · 시간 · 장소만 · 체크인 안내는 Outro 상세(STAGE.outro) */
];
/* v4.91 (사용자 261001 「A~E 사전 신청 세션이 여기에 있을 이유가 있을까」 · main 결정) 10F 실습형 세션 A~E 줄은 「전체」 시간표 · 홈 「진행 중」 · 다음 일정에서 숨긴다
   현장참여자는 신청도 입장도 못 해 「나도 갈 수 있나」 혼동만 준다 · 사전신청자에게 필요한 것은 내 세션 하나(3묶음: 명단 업로드 → 나의 일정에 내 세션 카드 · tenMineCard)
   정리 #9(261005) 숨김 스위치와 10F 펼침 목록 함수는 지우고 그 줄에 off: 1 을 바로 적었다(동작 같음 · 되살리려면 off 를 뺀다) · 세션 상세는 그대로 */
/* 3묶음 훅 · 사전신청자로 확인된 사람의 「나의 일정」(나의 참여 맨 위) 맨 위 내 세션 카드 한 장(장소 · 시간)
   v4.93 채움 · 원천 = sessMine(서버 sync my.sess · 3묶음 명단이 들어오기 전에는 테스트 오버레이에서만) · 내 세션이 없으면 빈 값 */
function tenMine() { return SESSIONS.filter(function (s) { return s.fl === 10 && !!sessMine(s.id); })[0] || null; }
/* v5.64 tenMineCard(펼친 내 세션 카드) 삭제 · 나의 일정에서 시간표 줄 하나(myAgendaHtml) */
/* v4.84 지금 줄 = 기기 시각 · 옛 NOW_INDEX(데모 고정 1 = 기조연설)는 행사 당일에도 기조연설에 머물렀다(시안 2 와 달랐다)
   시간 칸 안이면 그 줄 · 사이 시간이면 다음 줄 · 마지막이 끝난 뒤면 마지막 줄 · 시간 미정(always) · 숨김(off) 줄은 건너뛴다 */
/* v5.21 시험 시각 훅 · 시험 모드(testMode · 데모 #demo · 테스트 사번)에서만 S "att_tm"(출석 시험 시각과 같은 값)을 지금 시각으로 쓴다 · 데모 주소 &now=14:20 · 운영 참가자는 늘 기기 시각 */
function hmNow() { var tm = ""; try { tm = attTm(); } catch (e) { tm = ""; } if (tm) return t2m(tm); var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function nowIdx() {
  var hm = hmNow(), nx = -1, last = -1;
  for (var i = 0; i < TIMELINE.length; i++) {
    var t = TIMELINE[i];
    if (t.always || t.off || !t.time) continue;
    last = i;
    if (hm >= t2m(t.time) && hm < t2m(t.end)) return i;
    if (nx < 0 && t2m(t.time) > hm) nx = i;
  }
  return nx >= 0 ? nx : last;
}
/* ═══ 프로그램 카탈로그 · v3.29 공식 공지 붙임1·2(260917) 정본 ═══
   kind: queue=원격 대기열 / link=기존 신청 시스템 연결 / open=자유 참석(신청 없음) / info=사전 신청자 참여 안내 전용
   17F 네 프로그램(key · road · l1 · l2)은 전부 open (v4.26 사용자 확정 260924 · 신청 · 잔여 좌석 · 대기 · 사전 신청 명단 없음).
   17F 는 대강당 입구 QR 로 출석한다(ATT_17F · att_claim) · 옛 seat(좌석 신청 · v3.31b)은 종류째 걷어냈다.
   10F 실습형 세션은 info (v3.31b 사용자 확정 · 현장 신청 없음 · 신청은 앱 밖 사전 공지로 끝남) · cap 은 되돌릴 때를 위해 남긴다.
   10F 실습형 세션은 5개 중 1개만(sessConflict · 백엔드 sessBook_ reason ten). id 는 기존 유지:
   fld=세션 A · ta=세션 B · tb=세션 C · aws=세션 D · ms1·ms2=세션 E 1·2회차(v3.31 회차 분리 · 80분 × 2회, 사이 10분).
   세션 E 는 회차마다 행 하나(공용 행 카드 · 인라인 신청 그대로). 회차 선택 UI 를 따로 두지 않는 이유:
   시간 뱃지·잔여석·신청 버튼이 회차마다 다르고, 두 회차 사이 교체는 10F 1인 1세션 교체 모달이 그대로 처리한다.
   capNote = 정원 보조 문구
   v5.60 (사용자 261004 「권장대로 진행」 · 내용 워싱 v2 · 정본 = 디자인 시안/세션 상세 정리/세션상세_구조화.json) 옛 desc · info 표 → 참여자 말 세 칸
   intro = 한 줄 소개(B · C 만 · SESS_INTRO_ON 이 0 이면 그리지 않는다 · 앱이 만든 문장이라 꺼 둔다) · todo = 하는 일 [{ name?, desc }] (전원)
   prep = 준비할 것 [{ desc }] (sessMine 사전 신청자만) · 교육환경 · 산출물 · 비고 · 대상 직군 · 진행 원문은 지웠다(되살릴 문장 = 위 JSON 의 removed) */
var TIME_TBD = "세부 시간은 바뀔 수 있어요";   /* v5.60 W9 말투 */
var SESS_INTRO_ON = 0;   /* v5.60 10F 세션 B · C 한 줄 소개(intro) 켜기 · 끄기 */
var SESSIONS = [
  { id: "key", fl: 17, zone: "hall", kind: "open", ttl: "기조연설", sub: "AI 환경 · 전략", who: "CTO", tm: "09:40~10:20", cap: 235, seed: 187,
    desc: "" },
  { id: "road", fl: 17, zone: "hall", kind: "open", ttl: "내부 강연", sub: "현대해상 AX 로드맵", who: "디지털전략본부장", tm: "10:30~11:00", cap: 235, seed: 120,
    desc: "" },
  { id: "l1", fl: 17, zone: "hall", kind: "open", ttl: "파트너사 강연 · AWS", sub: "Agentic AI 시대의 일하는 방식 변화", who: "구태훈 박사 (AWS)", tm: "13:30~15:00", cap: 235, seed: 141,
    desc: TIME_TBD },
  { id: "l2", fl: 17, zone: "hall", kind: "open", ttl: "파트너사 강연 · MS", sub: "AI와 친해지기", who: "MS", tm: "15:10~16:40", cap: 235, seed: 96,
    desc: TIME_TBD },
  { id: "fld", fl: 10, zone: "conf", kind: "info", ttl: "세션 A", sub: "영업 및 보상 현장 우수 사례 강연 및 실습", who: "", tm: "13:30~16:40", cap: 63, seed: 50,
    capNote: "63명",   /* v5.81 정원 62 → 63(사용자 261006) */
    todo: [{ desc: "동료 활용 사례 공유 및 AI활용 교안 제공" }, { desc: "원하는 주제 선택 및 개발 실습 진행" }],
    prep: [{ desc: "노트북은 1인 1대 배정돼요" }] },
  { id: "ta", fl: 10, zone: "heart18", kind: "info", ttl: "세션 B", sub: "“내 데이터”로 만드는 통계 현황 리포팅 실습", who: "", tm: "13:30~16:30", cap: 32, seed: 24,
    capNote: "최대 32명",
    intro: "실제 업무 정기 데이터로 분석, 리포트 자동화, 대시보드 개발까지 실습합니다.",
    todo: [{ name: "데이터 분석", desc: "실제 업무 정기 데이터의 AI 활용 분석(기초, 증감, 예측모델)" }, { name: "리포트 자동화", desc: "분석 결과 리포트 개발 반복 작업 자동화 코드 작성" }, { name: "대시보드 개발", desc: "데이터 삽입 → 실시간 결과 반영 HTML앱 개발" }],
    prep: [{ desc: "본인 업무 데이터를 사전에 제출해요" }, { desc: "노트북은 1인 1대 배정돼요" }] },
  { id: "tb", fl: 10, zone: "heart18", kind: "info", ttl: "세션 C", sub: "“내가 보는 자료”로 만드는 외부자료 리서치 자동화 실습", who: "", tm: "13:30~16:30", cap: 28, seed: 15,
    capNote: "28명",   /* v5.05 (261002 사용자 결정) 정원 20 → 28 */
    intro: "외부자료 리서치, 요약 및 정리, 자동 알림 시스템 개발까지 실습합니다.",
    todo: [{ name: "외부자료 리서치", desc: "최신 갱신 외부자료 검색 및 수집(법령, 뉴스, 공시 등)" }, { name: "요약 및 정리", desc: "수집된 자료 자동 정리(중복 또는 예전 자료 제외 등)" }, { name: "자동 알림 시스템 개발", desc: "주기적인 새정보 업데이트 알림 봇 개발" }],
    prep: [{ desc: "본인이 검색하고 활용하는 웹사이트를 사전에 조사해요" }, { desc: "노트북은 1인 1대 배정돼요" }] },
  { id: "aws", fl: 10, zone: "heart56", kind: "info", ttl: "세션 D", sub: "Claude Code를 활용한 바이브 코딩 실습 (AWS)", who: "", tm: "13:30~16:30", cap: 28, seed: 16,
    capNote: "28명",   /* v5.87 정원 20 → 28(사용자 261006 · 사전 신청 명단 28명) */
    todo: [], prep: [] },   /* v5.60 남는 내용이 제목뿐 · 세션 안내 블록을 그리지 않는다 */
  { id: "ms1", fl: 10, zone: "tbd", kind: "info", ttl: "세션 E · 1회차", sub: "MS Copilot을 활용한 문서 작성 실습 (MS)", who: "", tm: "13:30~14:50", cap: 20, seed: 12,
    capNote: "20명",
    todo: [], prep: [] },
  { id: "ms2", fl: 10, zone: "tbd", kind: "info", ttl: "세션 E · 2회차", sub: "MS Copilot을 활용한 문서 작성 실습 (MS)", who: "", tm: "15:00~16:20", cap: 20, seed: 9,
    capNote: "20명",
    todo: [], prep: [] },
  /* v5.64 AI 포토부스 프로그램 상세(photo · kind queue) 삭제 · v5.05 포토부스 대기 폐지 뒤 들어가는 길이 없는 빈 상세였다(정리 기록.md) */
  { id: "dap", fl: 1, zone: "dap", kind: "link", go: "dap", ttl: "AX 라운지", sub: "데이터사이언스파트 · 1:1 30분", who: "", tm: "09:30~16:30",
    /* v3.54 사은품 문구는 사용자 확정으로 유지 (CLAUDE.md 「참여자 앱에 사은품 안내 없음」의 예외 · 260918) */
    desc: "데이터사이언스파트 1:1 상담 30분 · 상담 완료 시 사은품" },
  { id: "cchat", fl: 18, zone: "lounge", kind: "link", go: "ev_cchat", ttl: "AX 커피챗", sub: "비슷한 고민을 나누고 다음 한 걸음 찾기", who: "", tm: "",   /* v4.13 ⓛ 시작 시각 미정(사용자 260922) · 시각을 앱에 두지 않는다 */
    desc: "아이디어 제출 후 참석 신청" }
];
/* v47: 층별 안내(PROG_FL 존 목록·동선 영상) 전면 삭제 · 안내는 타임라인과 현장 사이니지가 맡는다.
   프로그램 상세의 위치 표기용 존 이름만 남긴다. */
/* v3.40 10F 세션 장소 · 여기 한 곳 (기획 변경 시 이 값만)
   출처: 층별 기획안 260803 평면도의 10F 존 배정(컨퍼런스룸 · Heart 1·7~8 · Heart 5·6)을 v3.29 세션 id 승계
   (fld 현장 프로그램 → 세션 A · ta·tb Track A·B → 세션 B·C · aws 바이브코딩 → 세션 D)로 옮긴 값이며, 백엔드 SESS_META 존
   (f10_conf · f10_h18 · f10_h56)과 일치한다. 공식 공지 붙임2는 「10층」만 적고 호실은 적지 않아 충돌은 없다.
   세션 E(신설)는 배정 기록이 없어 「장소 추후 안내」. */
var TEN_ROOM = { fld: "10F 컨퍼런스룸", ta: "10F Heart 1 · 7~8", tb: "10F Heart 1 · 7~8", aws: "10F Heart 5 · 6", ms1: "10F · 장소 추후 안내", ms2: "10F · 장소 추후 안내" };
function sessPlace(s) { return TEN_ROOM[s.id] || (s.fl + "F " + (ZONE_NM[s.zone] || "")).trim(); }
var ZONE_NM = { hall: "대강당", heart18: "Heart 1 · 7~8", heart56: "Heart 5 · 6", conf: "컨퍼런스룸", tbd: "장소 추후 안내", promo: "EVENT", lounge: "", dap: "AX 라운지" };
/* 층별 상시 활동 표(FL_OPEN)와 층 머리 표기(FLTAG)는 260923 삭제 · 그것만 그리던 flListHtml 이 v4.15 시간표 재설계로 없어졌다.
   상시 활동은 스탬프 탭 카드가, 프로그램 목록은 progRowHtml 이 맡는다. */
/* v4.93 seg = 프로그램 탭 [시간표 | 상시 운영](같은 세션 안에서 마지막 본 쪽) · zone = 구역 상세(zone_d) 구역 · anchor = 옛 진입 별칭이 그린 뒤 스크롤할 자리 */
var PROG = { fl: 1, sid: null, cat: "all", mode: "list", tt: "all", seg: "time", zone: "", zchk: false, floor: 0, anchor: "", ttOpen: {}, scroll: 0, cf: null, ok: null };   /* v5.65 zchk = 구역 상세 「참여 전 확인」 펼침 · floor = 층 안내(floor_d) 층 */
var MY = { seg: "" };   /* v5.65 나의 참여 갈래 · "sched" 나의 일정 / "rw" 나의 보상 / "" = 처음(일정이 있으면 나의 일정 · 없으면 나의 보상) */   /* v4.15 tt = 시간표 [전체 | 나의 일정] · ttOpen = 펼친 행 */   /* v4.13 mode = 프로그램 탭 보기 [목록 | 시간표](design.md A-5 5-10) */   /* v4.05 cat = P01 필터 · scroll = 목록 스크롤 · cf = 신청 확인 · ok = 신청 결과 */   /* fl = 선택 층 (v3.7 · 기본 1F · 탭 왕복에도 유지) */

/* ═══ v3.52b 오늘 한 판 설문 = 틀만 (사용자 지시 260917 · 「문항이 아직 안 정해졌다 · 집만 지어 둬라」) ═══
   ※ 문항 미확정 · 아래 SURVEY_Q 는 기본 3문항일 뿐이다(참여자 화면에는 이 사실을 쓰지 않는다 · 콘솔 설문 탭에만 표시).
   화면은 SURVEY_Q 배열 하나로만 그린다 · 문항을 바꿀 때 이 배열만 고친다(서버는 문항 id 별로 그대로 저장·형식별 집계).
   형식: single(보기 하나) · chips(칩 하나 + 기타 직접 입력) · scale(점수 min~max) · text(한 줄 · optional 가능) · places(오늘 다녀간 곳 카드 · 서버 기록 연동 · 기본 목록에는 넣지 않음) */
var SURVEY = { open: "14:30" };
var SURVEY_Q = [
  { id: "sat", type: "scale", q: "오늘 행사, 얼마나 만족하셨나요?", min: 0, max: 10, left: "아쉬웠어요", right: "아주 좋았어요" },
  { id: "best", type: "chips", q: "오늘 가장 좋았던 것 하나를 골라 주세요", opts: ["1F 전시·부스", "17F 강연", "10F 실습", "18F 커피챗", "미니게임"], other: "기타" },
  { id: "line", type: "text", q: "한 줄 남겨 주세요", optional: true, max: 200, ph: "비워도 제출됩니다" }
];
/* 다녀간 곳 카드 · 이 사람의 스탬프·신청 기록에서 다녀간 곳만 (안 간 곳은 묻지 않는다) */
var SURVEY_PLACES = [
  ["p1", "1F 부스"], ["p2", "1F AX PLAY"], ["p7", "전시 QR 퀴즈"],
  ["p3", "17F 강연"], ["dap", "1F AX 라운지"], ["cchat", "18F AX 커피챗"]
];
var DEFAULT_NOTICES = [
  { id: "n1", title: "AX Festival 2026에 오신 것을 환영합니다", body: "행사 당일 운영 안내와 바뀐 내용이 이곳에 올라와요.", ts: 0, pinned: true }
];

/* ════════════════ v10 신규 데이터 · 기획서 v2(260822 1층 반영) ════════════════ */
/* A. 과제상담 예약 · 슬롯은 하드코딩 금지, 콘솔 설정값으로 생성 (v5 p23~25) */
var RESV_CONF = { start: "09:30", end: "16:30", step: 30, lunch: "12:00", lunchEnd: "13:00" };
/* v4.16 옛 상담 목업 8건(m1~m8) 삭제 · 기기에 저장된 상담 목록이 없으면 빈 배열이 기본값이다(서버 연결 시 resv 값으로 바뀐다) */

