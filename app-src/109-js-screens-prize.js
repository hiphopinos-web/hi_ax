/* ════════════════ 화면 (Lv1) ════════════════ */
/* ════════════════ AX-TDS v1 화면 조각 (260922 · 1단계) ════════════════
   승인 클래스(design-handoff/design-system/components.css) 조합 · 패키지에 없는 조각은 axs- (파일 끝 CSS 절) */
/* 목적지 행 (.ax-destination · 최소 80 · 반경 20) · act = 오른쪽 상태/보기 */
function axDest(title, desc, act, onclick, done) {
  return '<button type="button" class="ax-destination axs-dest" onclick="' + onclick + '">' +
    '<span class="axs-tx"><span class="ax-card-title">' + title + "</span>" + (desc ? '<span class="ax-meta">' + desc + "</span>" : "") + "</span>" +
    '<span class="ax-destination-action' + (done ? " axs-done" : "") + '">' + act + "</span></button>";
}
/* 챗봇 원본(BOT_SVG)과 도트 래스터(botDotLoad · botDotCv)는 assets/bot.js 한 곳에 있다(v4.22 · 선수 화면과 같이 쓴다) · <head> 에서 동기 script 로 먼저 읽는다 */
/* v4.18 대기 변형 · 안테나 전파 호 3개 (원본 벡터에 없는 새 요소만 더한다 · 반지름 17·23·29 는 viewBox 200 안에 들어간다)
   중심 = 머리 방울 (100, 31.31) · 위쪽 120도 호 · 동작 줄이기에서는 CSS 가 멈춘다 */
var BOT_WAVE = '<g class="ant">' +
  '<path d="M85.28 22.81 A17 17 0 0 1 114.72 22.81"/>' +
  '<path d="M80.08 19.81 A23 23 0 0 1 119.92 19.81"/>' +
  '<path d="M74.89 16.81 A29 29 0 0 1 125.11 16.81"/>' +
  "</g>";
/* o.wait = 대기 중(전파 켜기) · 화면이 통째로 비어서 기다리는 자리에만 쓴다.
   v4.36 (사용자 확정 260925 「서버 응답을 기다리는 동안 챗봇」) 로그인뿐 아니라 시트 확정(신청 · 취소 · 번호표 · 출석)과 설문 제출도 botWait 덮개를 쓴다 · QR 스캔 화면에는 쓰지 않는다. */
function botHtml(msg, o) {
  var w = o && o.wait;
  return '<div class="axs-bot" role="status"' + (w ? ' aria-busy="true"' : "") + ">" +
    BOT_SVG.replace("</svg>", (w ? BOT_WAVE : "") + "</svg>") +
    '<p class="ax-description">' + msg + "</p></div>";
}
/* 전체 화면 대기 덮개 · 로그인·입장 처리처럼 화면 전체가 멈춰 기다리는 순간에만 */
function botWait(on, msg) {
  var w = el("axsWait");
  if (!on) { if (w) w.remove(); return; }
  if (!w) { w = document.createElement("div"); w.id = "axsWait"; document.body.appendChild(w); }
  w.innerHTML = '<div class="ax-stack">' + botHtml(msg || "확인하는 중", { wait: 1 }) + "</div>";
}

/* ── 홈 (H01) · 공지 카드 한 장 → [포토부스 호출] → 인사 → 진행 중 카드(주 행동) → 전체 시간표 · 체험 찾기 → 광고판(사용자 결정 예외) ── */
function homeNoticeHtml() {
  var ns = S.get("notices", []), latest = null;
  for (var i = 0; i < ns.length; i++) { if (ns[i] && ns[i].ts > 0 && Date.now() - ns[i].ts < LED_TTL) { latest = ns[i]; break; } }
  if (!latest) return "";
  return '<button type="button" class="ax-destination axs-dest" onclick="App.go(\'notices\')">' +
    '<span class="axs-tx"><span class="axs-chiprow"><span class="axs-chip">공지</span></span>' +
    '<span class="ax-card-title">' + esc(latest.title) + "</span>" + (latest.body ? '<span class="ax-meta">' + esc(latest.body) + "</span>" : "") + "</span>" +
    '<span class="ax-destination-action">전체</span></button>';
}
/* v4.55 클로즈 베타 홈 배너 · 서버 설정 「베타_폼」 값이 있을 때만 홈 맨 위 흰 줄로 노출.
   서버가 행사 전날(10/25)부터는 값이 있어도 빈 문자열을 내려보내 자동으로 숨긴다(기기 시계가 아니라 서버 날짜 기준). */
function betaBannerHtml() {
  var url = S.get("beta_form", "");
  if (!url) return "";
  return axDest("클로즈 베타 중", "", lnkChev("의견 보내기"), "betaFormOpen()");
}
function betaFormOpen() {
  var url = S.get("beta_form", "");
  if (!url) return;
  window.open(url, "_blank", "noopener");
}
/* v4.13 홈 「전체 시간표」 = 프로그램 탭 시간표 보기(design.md A-5 5-10) · 분류는 전체로 · 진행 중이면 그 줄이 보이게 */
function homeSched() { PROG.mode = "time"; PROG.cat = "all"; PROG.tt = "all"; PROG.seg = "time"; PROG.open = false; PROG.scroll = 0; App.tab("guide"); }

/* ── 나의 참여 (M01) · 내 일정 / 스탬프 / 내 보상 / 포토부스 대기 + 내 QR 보여주기(보조 버튼 · 유일한 내 QR 입구) ── */
function mySched() { SCHED.tab = "mine"; App.go("guide_time"); }
/* v5.65 나의 참여 갈래 · 처음(MY.seg 빈 값) = 일정이 있으면 나의 일정 · 없으면 나의 보상 · 누르면 이 방문 동안 기억 */
function myTabSeg() { return MY.seg === "sched" || MY.seg === "rw" ? MY.seg : myAgendaItems().length ? "sched" : "rw"; }
function mySeg(g) { MY.seg = g === "rw" ? "rw" : "sched"; App.render(); window.scrollTo(0, 0); }
/* v5.65 (사용자 261005 「내 보상은 경품과 스탬프 내보상 이거 세개는 유사」) 나의 보상 = 한 흐름 · 같은 숫자 · 같은 설명을 두 번 쓰지 않는다
   ① 스탬프 보상 레일(홈 · 스탬프 탭과 같은 railHtml · n / 6 · 3 룰렛 · 4 · 5 · 6 행운권 · 내 행운권 번호 · 경품 보기 입구 하나)
   ② 다음 보상까지 한 줄(스탬프 탭으로 · 6개를 다 모으면 없음 · 레일 「6개 모두 모았어요」와 겹치지 않게)
   ③ 받은 보상 카드(룰렛 1회권 · 행운권 · 참여상 · data-rw = 알림이 튕기는 자리 · 사용한 것은 아래 회색) · 행운권 장수 · 번호는 레일에 있어 카드에 다시 쓰지 않는다
   옛 경품 줄(axDest 「경품」) · 옛 내 보상 줄 · 옛 내 보상 화면 칩(사용 가능 · 사용 완료) · 경품 안내 입구(prizeGuideHtml)는 레일의 경품 보기 하나로 */
function myRewardHtml() {
  var n = stampCount(), items = rewItems(), list = items.filter(function (x) { return !x.used; }).concat(items.filter(function (x) { return x.used; }));
  var goal = n < STAMP_DENOM ? '<div class="axs-list">' + axDest(esc(stampGoalText(n)), "", lnkChev("스탬프 보기"), "App.tab('exp')") + "</div>" : "";
  var cards = list.map(function (x) {
    var big = x.k === "raffle" ? "" : x.big, why = x.k === "raffle" ? "17:00 Outro 현장 추첨 · 17F 입구 QR 체크인" : x.why;
    var tt = '<div class="ax-stack-tight"><h2 class="ax-section-title">' + x.nm + "</h2>" + (big ? '<p class="axs-big">' + big + "</p>" : "") + "</div>";
    return '<section class="ax-card" data-rw="' + x.k + '"><span class="axs-chip axs-self' + (x.off ? " off" : x.cc != null ? x.cc : " ok") + '">' + x.chip + "</span>" +
      (x.pic ? '<div class="axs-rwhd">' + prizePhHtml(x.pic) + tt + "</div>" : tt) +   /* v5.04 참여상 당첨 = 상품 사진 */
      '<div class="axs-hr"></div><p class="ax-description">' + why + "</p>" +
      (x.go ? '<button type="button" class="ax-button ax-button-weak" onclick="' + x.go + '">' + (x.btn || "사용 방법 보기") + "</button>" : "") + "</section>";
  }).join("");
  return '<section class="axs-sec axs-myrw">' + railHtml(n, false, null, false) + "</section>" + goal +
    (cards ? '<section class="ax-stack-tight axs-gap12"><h2 class="ax-section-title">받은 보상</h2>' + cards + "</section>" : "");
}
/* 받은 보상 · 룰렛 1회권(3개) · 행운권(4개부터 자동) · 참여상 · 계산은 기존 상수·함수 그대로(REWARD_CAP · raffleTickets) */
function rewItems() {
  var n = stampCount(), used = !!S.get("roulette_used", false), out0 = !!S.get("roulette_out", false), t = raffleTickets(n), items = [];
  if (n >= 3) items.push({ k: "roulette", used: used, chip: used ? "사용 완료" : out0 ? "룰렛 소진" : "사용 가능", off: used || out0, nm: "룰렛 1회권", big: "1회",
    why: "1F EVENT 룰렛 · 내 QR 제시", go: "ppRouletteOpen()" });
  if (t) items.push({ k: "raffle", used: false, chip: "자동 발급", off: false, nm: "행운권", big: t + "장", why: "스탬프 " + Math.min(n, REWARD_CAP) + "개 · 17:00 Outro 현장 추첨", go: "ppDrawOpen()" });   /* v4.79 현장 추첨 안내는 추첨 안내 모달에 · v5.04 옛 「결과는 행사 후 개별 안내」 폐기 */
  var fs = finState(), f = S.get("fin", null) || {};   /* v5.04 참여상 · 서버 my.fin 이 있을 때만(없으면 카드 없음 · 아래 경품 카드의 「6개 모으면 참여상 추첨 대상」 한 줄뿐) */
  if (fs === "in") items.push({ k: "fin", used: false, chip: "추첨 대상", nm: "참여상 추첨", big: "1회", why: "스탬프 6개", go: "finInfoOpen()", btn: "안내 보기" });
  if (fs === "wait") items.push({ k: "fin", used: false, chip: "추첨 대기", cc: "", nm: "참여상 추첨", big: "1회", why: "스탬프 6개", go: "finInfoOpen()", btn: "안내 보기" });
  if (fs === "win") items.push({ k: "fin", used: false, chip: "참여상 당첨", nm: esc(f.pz || "참여상"), big: "1개", pic: prizeByName(f.pz), why: "추첨 행사 이후 소속 부서로 배송", go: "finInfoOpen()", btn: "안내 보기" });
  if (fs === "lose") items.push({ k: "fin", used: true, chip: "미당첨", off: true, nm: "참여상 추첨", big: "1회", why: finCountTxt(f) });
  if (fs === "out") items.push({ k: "fin", used: true, chip: "집계 종료", off: true, nm: "참여상 추첨", big: "", why: "17:00 기준 스탬프 6개" });
  return items;
}

/* ════════════════ v5.04 경품 안내 · 참여상 (261002 사용자 확정 · CLAUDE.md 「보상」 · 「경품 앱 공개」) ════════════════
   룰렛 · 행운권 · 참여상 경품의 이름 · 사진 · 수량만 보여 준다 · 가격 · 사전등록자 키트 · 실습 세션 기념품은 넣지 않는다.
   사진 = assets/prize/<img>.webp(정사각 240 · 커피 · 간식 360) · 실물 사진이 오면 같은 이름으로 파일만 바꾸고 PRIZE_SAMPLE 을 false 로(항목 하나만이면 그 항목에 s: 0).
   수량은 이 표 한 곳이다(룰렛 2등 100 = 커피 + 키캡 키링 · 남는 커피 40은 예비라 보이지 않는다 · 사용자 확정 261002). */
var PRIZE_DIR = "assets/prize/", PRIZE_SAMPLE = true;
var PRIZES = {
  roulette: { unit: "개", list: [
    { rk: "1등", nm: "텀블러", q: 60, img: "rl1_tumbler" },
    { rk: "2등", nm: "커피 + 키캡 키링", q: 100, img: "rl2_coffee", img2: "rl2_keyring" },   /* v5.18 합성 사진 대신 두 장 나란히(사용자 261003) */
    { rk: "3등", nm: "컵받침", q: 150, img: "rl3_coaster" },
    { rk: "4등", nm: "판스티커", q: 250, img: "rl4_sticker" },
    { rk: "5등", nm: "볼펜", q: 400, img: "rl5_pen", tall: 1 }] },   /* v5.33 tall = 넓은 칸에서도 자르지 않는다(사선 볼펜 사진) */
  draw: { unit: "명", list: [
    { rk: "1등", nm: "아이패드", q: 1, img: "ld1_ipad" },
    { rk: "2등", nm: "신라호텔 파크뷰 뷔페 식사권 2매", q: 1, img: "ld2_shilla" },
    { rk: "3등", nm: "미닉스 음식물 처리기", q: 1, img: "ld3_minix" },
    { rk: "4등", nm: "에어팟 4", q: 2, img: "ld4_airpods" },
    { rk: "5등", nm: "풀리오 종아리 마사지기", q: 2, img: "ld5_pulio" },
    { rk: "6등", nm: "현대백화점 상품권 10만원", q: 3, img: "ld6_hyundai" }] },
  fin: { unit: "개", list: [
    { rk: "", nm: "무선 무드등 가습기", q: 210, img: "fin_humidifier" }] },
  /* v5.05 1F 타자왕 1~3위(17:00 Outro 시상) · v5.09 (261003 사용자 확정) 새 상품 · 사진 = 제조사 공식 컷 */
  type: { unit: "명", list: [
    { rk: "1등", nm: "기계식 키보드", sub: "체리 G80-3872", q: 1, img: "ty1_cherry", flat: 1 },   /* v5.18 flat = 사진 2:1(위아래 여백 자르기) */
    { rk: "2등", nm: "마우스", sub: "로지텍 MX Master 4", q: 1, img: "ty2_mxmaster4" },
    { rk: "3등", nm: "기계식 키보드", sub: "AULA F108 Pro", q: 1, img: "ty3_aula" }] }
};
/* 커피 · 간식(18F 커피챗 · 1F DAP 과제상담) · 커피 = 페트병(우리 스티커 목업) · 간식 = 달곰 베이크샵 휘낭시에 · 스콘(블로그 사진 합성 · 임시) · 바꿀 때는 파일만 */
var TREATS = [
  { nm: "커피", sub: "콜드브루 · 헤이즐넛", img: "cc_coffee" },
  { nm: "간식", sub: "휘낭시에 · 스콘", img: "cc_snack" }
];
function prizePhHtml(p, w) {
  if (!p || !p.img) return '<span class="axs-ph" aria-hidden="true"></span>';
  var im = function (n) { return '<img src="' + PRIZE_DIR + n + '.webp" alt="" width="' + (w || 240) + '" height="' + (w || 240) + '" loading="lazy" decoding="async" onerror="this.remove()">'; };
  return '<span class="axs-ph' + (p.img2 ? " two" : "") + '" aria-hidden="true">' + im(p.img) + (p.img2 ? im(p.img2) : "") +   /* v5.18 img2 = 사진 두 장 나란히 */
    (PRIZE_SAMPLE && p.s !== 0 ? '<span class="smp">샘플</span>' : "") + "</span>";
}
/* 모달 아래 경품 한 줄(룰렛 1회권 · 행운권 · 참여상 안내) · v5.08 옛 목록 대신 대표 사진 + 요약 + 「경품 보기」(포스터 그 구역으로) */
function prizeModalHtml(kind) {
  var g = PRIZES[kind]; if (!g) return "";
  var p = g.list[0], sum = (p.rk ? p.rk + " " : "") + p.nm + (g.list.length > 1 ? " 외 " + (g.list.length - 1) + "종" : " " + p.q.toLocaleString() + g.unit);
  return '<div class="axs-mprz"><button type="button" class="axs-pzm" onclick="prizeGo(\'' + kind + '\')">' + prizePhHtml(p) +
    '<span class="tx"><b>' + esc(sum) + "</b><span>경품 보기</span></span>" + CHEV_SVG + "</button></div>";
}
function prizeByName(nm) {
  var hit = null; nm = String(nm || "");
  Object.keys(PRIZES).forEach(function (k) { PRIZES[k].list.forEach(function (p) { if (!hit && nm && (p.nm === nm || nm.indexOf(p.nm) >= 0 || p.nm.indexOf(nm) >= 0)) hit = p; }); });
  return hit;
}
/* 내 보상 아래 · v5.08 경품 카드 3장을 걷고 입구 한 줄(경품은 포스터 한 곳에서 본다 · 중복 줄이기) */
function prizeGuideHtml() {
  return '<h2 class="ax-section-title">경품</h2>' + prizeGoHtml();
}
/* ════════════════ v5.08 경품 포스터 (261003 사용자 요청 · 「경품 사진이 작다 · 포스터처럼 · 싼티 없이 · 스탬프 누적표에서 바로」 · 「제품 사진을 크게」) ════════════════
   화면 id = prizes · 들어오는 곳 = 스탬프 보상 레일(홈 · 스탬프 탭) · 나의 참여 · 내 보상 · 룰렛 1회권 · 행운권 · 참여상 모달(그 구역으로 바로)
   데이터는 위 PRIZES 한 곳 · 대표(PZ_HERO 개수만큼 앞에서부터) = 폭 가득 사진 · 나머지 2열 · 홀수로 남는 마지막 칸은 넓은 카드
   참여상 설명은 두 줄만(FIN_NOTE · 사용자 261003 「이 두 가지 정보만 남겨 두고 나머지는 없애 줘」) */
var FIN_NOTE = "Outro에서 추첨 · 상품은 무작위<br>추첨 행사 이후 소속 부서로 배송";   /* v5.60 W10 (사용자 「빼」 · 261003 「두 줄만」 번복) 「남은 룰렛 경품도 함께」 삭제 */
var PZ_HERO = { draw: 3, fin: 1, roulette: 1, type: 1 };   /* v5.09 타자왕도 사진 카드(1등 대표 · 2 · 3등 2열) */
var PZ_SEC = [
  { k: "draw", en: "LUCKY DRAW", t: "행운권 추첨", m: [4, 6], cd: "스탬프 4 · 5 · 6개 = 행운권 1 · 2 · 3장<br>17:00 Outro 현장 추첨<br>17F 입구 QR 체크인" },
  { k: "fin", en: "PARTICIPATION", t: "참여상", m: [6, 6], cd: "스탬프 6개", note: FIN_NOTE },
  { k: "roulette", en: "ROULETTE", t: "룰렛", m: [3, 3], cd: "스탬프 3개 · 1F EVENT 룰렛 · 1인 1회" },
  { k: "type", en: "TYPING KING", t: "1F 타자왕 1~3위", sp: "스탬프와 별개", cd: "1F 현장 최고 기록 · 17:00 마감<br>Outro 시상", go: ["실시간 순위 보기", "typeSiteRankGo()"] }   /* v5.18 맨 아래 · 스탬프와 별개(선으로 나눔) · 순위판 입구(사용자 261003) */
];
var PZ = { t: 0 };
var PZ_THUMB = ["ld1_ipad", "fin_humidifier", "rl1_tumbler"];   /* 입구 사진 3장 = assets/prize/t_<img>.webp(96px) */
function prizeGo(k) { PROG.anchor = k ? "pz-" + k : ""; PZ.t = Date.now(); App.go("prizes"); }
function prizeJump(k) {
  var a = el("pz-" + k); if (!a) return;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  a.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" });
}
function prizeGoHtml(k) {
  var th = PZ_THUMB.map(function (n) { return '<img src="' + PRIZE_DIR + "t_" + n + '.webp" alt="" width="96" height="96" loading="lazy" decoding="async" onerror="this.remove()">'; }).join("");
  return '<button type="button" class="axs-pzgo" onclick="event.stopPropagation(); prizeGo(' + (k ? "'" + k + "'" : "") + ')"><span class="th" aria-hidden="true">' + th + "</span>" +
    '<span class="tx"><b>경품 보기</b><span>아이패드 · 가습기 · 텀블러</span></span>' + CHEV_SVG + "</button>";
}
function pzMeter(a, b) {
  var o = ""; for (var i = 0; i < STAMP_DENOM; i++) o += "<i" + (i < a ? ' class="on"' : i < b ? ' class="pt"' : "") + "></i>";
  return '<span class="axs-pz-mt" aria-hidden="true">' + o + "</span>";
}
function pzCard(p, unit, cls) {
  var im = function (n) { return '<img src="' + PRIZE_DIR + n + '.webp" alt="" width="600" height="600" loading="lazy" decoding="async" onerror="this.remove()">'; };
  var ph = '<span class="axs-pz-ph' + (p.img2 ? " two" : "") + '">' + (p.img ? im(p.img) + (p.img2 ? im(p.img2) : "") +
    (PRIZE_SAMPLE && p.s !== 0 ? '<span class="smp">샘플</span>' : "") : "") + "</span>";
  return '<article class="axs-pz-c' + cls + (p.flat ? " flat" : "") + (p.tall ? " tall" : "") + '"><div class="tx">' + (p.rk ? '<span class="rk">' + p.rk + "</span>" : "") +
    "<b>" + esc(p.nm) + (p.sub ? "<small>" + esc(p.sub) + "</small>" : "") + '</b><span class="q">' + p.q.toLocaleString() + unit + "</span></div>" + ph + "</article>";   /* v5.33 글 줄 먼저 · 사진 아래 */
}
function prizeSecHtml(s) {
  var g = PRIZES[s.k]; if (!g) return "";
  var head = '<header class="axs-pz-sh" id="pz-' + s.k + '"><p class="en">' + s.en + "</p><h2>" + s.t + '</h2><p class="cd">' + (s.m ? pzMeter(s.m[0], s.m[1]) : "") + (s.sp ? '<span class="sp">' + s.sp + "</span>" : "") + "<span>" + s.cd + "</span></p></header>" +
    (s.go ? '<button type="button" class="ax-button ax-button-weak" onclick="' + s.go[1] + '">' + s.go[0] + "</button>" : "");   /* v5.18 sp = 스탬프와 별개 알약 · go = 구역 버튼(타자왕 순위판) */
  var hn = PZ_HERO[s.k] || 0, rest = g.list.slice(hn), solo = rest.filter(function (p) { return !p.img2; }).length, k = 0;
  var body = g.list.slice(0, hn).map(function (p) { return pzCard(p, g.unit, " hero"); }).join("") +
    (rest.length ? '<div class="axs-pz-gr">' + rest.map(function (p) {   /* v5.18 사진 두 장 카드(img2) = 늘 넓은 카드 · 나머지에서 홀수로 남는 마지막 칸 = 넓은 카드 */
      if (p.img2) return pzCard(p, g.unit, " gr wide");
      k++; return pzCard(p, g.unit, " gr" + (solo % 2 && k === solo ? " wide" : ""));
    }).join("") + "</div>" : "");
  return '<section class="axs-pz-sec' + (s.sp ? " sep" : "") + '">' + head + body + (s.note ? '<p class="axs-pz-nt">' + s.note + "</p>" : "") + "</section>";
}
/* v5.16 (사용자 시안 261003) 표지 = 작은 「AX Festival 2026」 · 큰 제목 「스탬프 개수별 경품」(옛 PRIZES 점 글자 · 조건 3줄은 걷었다)
   「지금 내 스탬프」 카드 = 다음 목표(주황 숫자) + 오른쪽 큰 주황 N개 · 6개면 「모두 모았어요」
   1~6 점 선 = 받은 칸 주황 채움 · 다음 칸 주황 테두리 · 나머지 회색 테두리 · v5.33 6칸 균등 격자(점 · 카드 같은 칸)
   v5.33 1 · 2 아래 = 「보상은 3개부터」 두 칸 · 3 ~ 6 아래 = 세로 카드(룰렛 1회 · 행운권 1 · 2 · 3장 + 참여상 · 다음 · 달성 알약 · 아래 셰브론)
   카드를 누르면 아래 그 구역(옛 조건 줄과 같은 prizeJump · 6개 카드 = 참여상 구역) */
var PZ_GIFT = SICO + '<path d="M4.5 11h15v9h-15z"/><path d="M3.5 7.5h17V11h-17zM12 7.5V20"/><path d="M12 7.5C11 5 8.4 3.9 7.4 5.2c-1 1.4.8 2.3 4.6 2.3zM12 7.5c1-2.5 3.6-3.6 4.6-2.3 1 1.4-.8 2.3-4.6 2.3z"/></svg>';
var PZ_STEP = [
  { m: 3, k: "roulette", ico: "wheel", t: "룰렛", a: "1회" },
  { m: 4, k: "draw", ico: "ticket", t: "행운권", a: "1장" },
  { m: 5, k: "draw", ico: "ticket", t: "행운권", a: "2장" },
  { m: 6, k: "fin", ico: "ticket", t: "행운권", a: "3장", fin: 1 }
];
function pzNextTxt(n) {
  var s = PZ_STEP.filter(function (x) { return x.m > n; })[0];
  return s ? "<b>" + (s.m - n) + "개</b> 더 모으면 " + s.t + " " + s.a + (s.fin ? " · 참여상" : "") : "모두 모았어요";
}
var PZ_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 9.5 12 15l5.5-5.5"/></svg>';   /* v5.33 표지 카드 아래 셰브론 = 아래 구역으로 */
function prizeCoverHtml(noHead) {
  var n = Math.min(STAMP_DENOM, stampCount()), nx = PZ_STEP.filter(function (x) { return x.m > n; })[0], nm = nx ? nx.m : 0, dots = "";
  for (var i = 1; i <= STAMP_DENOM; i++) dots += '<span class="c"><i class="' + (i <= n ? "on" : i === n + 1 ? "nx" : "") + '">' + i + "</i></span>";   /* v5.33 6칸마다 점 하나 · 같은 크기 */
  var fill = n >= 2 ? "calc(" + (n - 1) + " * ((100% - 20px) / 6 + 4px))" : "0px";   /* 1번 칸 가운데부터 받은 마지막 칸 가운데까지(칸 폭 + 칸 사이 4px) */
  var cards = '<p class="pre' + (n >= 3 ? " done" : "") + '"><span class="t">보상은</span><b>3개부터</b></p>' + PZ_STEP.map(function (s) {
    var st = s.m <= n ? "on" : s.m === nm ? "nx" : "", lbl = "스탬프 " + s.m + "개 · " + s.t + " " + s.a + (s.fin ? " · 참여상" : "") + (st === "on" ? " · 달성" : st === "nx" ? " · 다음" : "");
    return '<button type="button" class="' + st + '" onclick="prizeJump(\'' + s.k + '\')" aria-label="' + lbl + '"><span class="i" aria-hidden="true">' + RAIL_ICO[s.ico] + "</span>" +
      '<span class="t" aria-hidden="true">' + s.t + '</span><b aria-hidden="true">' + s.a + "</b>" +
      (s.fin ? '<span class="fn" aria-hidden="true">+<span class="g">' + PZ_GIFT + "</span>참여상</span>" : "") +
      '<span class="bt" aria-hidden="true">' + (st === "nx" ? '<span class="tag">다음</span>' : st === "on" ? '<span class="tag on">' + CHECK_SVG + "달성</span>" : "") + '<span class="dn">' + PZ_DOWN + "</span></span></button>";
  }).join("");
  return '<section class="axs-pz-cv">' + (noHead ? "" : '<p class="ey">AX Festival 2026</p><h1 class="ttl">스탬프 개수별 경품</h1>') +   /* v5.69 시트 = 제목은 시트 머리 */
    '<div class="now"><div class="tx"><p class="k">지금 내 스탬프</p><p class="nx">' + pzNextTxt(n) + '</p></div><p class="n"><b>' + n + "</b>개</p></div>" +
    '<div class="stp" role="img" aria-label="스탬프 ' + n + " / " + STAMP_DENOM + '"><span class="ln" aria-hidden="true"></span><span class="fl" aria-hidden="true" style="width:' + fill + '"></span>' + dots + "</div>" +
    '<div class="cds">' + cards + "</div></section>";
}
/* v5.69 경품 시트(detPaint · 라우트 prizes) · 제목 = 시트 머리 · 본문 = 표지(지금 내 스탬프 · 1~6 · 단계 카드) + 구역 · 버튼 없음(읽기) · 구역 바로 가기(prizeGo k)는 시트 본문 스크롤 */
function prizeSheet() {
  return { title: "스탬프 개수별 경품", body: '<div class="axs-pz' + (Date.now() - PZ.t < 900 ? " in" : "") + '">' + prizeCoverHtml(true) + PZ_SEC.map(prizeSecHtml).join("") + "</div>" };
}
function prizePosterHtml() {
  return '<div class="axs-pz' + (Date.now() - PZ.t < 900 ? " in" : "") + '">' + prizeCoverHtml() + PZ_SEC.map(prizeSecHtml).join("") + "</div>";
}
/* 참여상 상태 · 서버 sync my.fin 이 정본(없으면 null = 그리지 않는다 · 서버 배포 전에도 안전)
   my.fin 모양(설계안 6장 · 7장 · 서버 담당과 맞출 것) = { ph: "open" | "lock" | "done", cut: "17:00", in: 대상 여부, w: 당첨 여부(done 뒤), pz: 상품명, n: 대상 수, wn: 당첨 수 }
   open 동안 6개인데 in 이 아직 false 면(방금 6개째 · 다음 sync 전) 17:00 전에는 대상으로 본다 · 17:00 뒤면 대상 아님 */
function finLate() {
  var d = new Date(Date.now() + sesOff()), f = S.get("fin", null) || {}, cut = String(f.cut || "17:00").split(":");
  return d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 26 && d.getHours() * 60 + d.getMinutes() >= (+cut[0] || 17) * 60 + (+cut[1] || 0);
}
function finState() {
  var f = S.get("fin", null);
  if (!f || typeof f !== "object") return null;
  var ph = String(f.ph || "open"), six = stampCount() >= STAMP_DENOM;
  if (ph === "done") return f.in ? (f.w ? "win" : "lose") : six ? "out" : null;
  if (ph === "lock" || ph === "wait") return f.in ? "wait" : six ? "out" : null;
  if (f.in || (six && !finLate())) return "in";
  return six ? "out" : null;
}
function finCountTxt(f) {
  var n = +f.n || 0, w = +f.wn || 0;
  return n && w ? "대상 " + n.toLocaleString() + "명 중 " + w.toLocaleString() + "명 당첨" : n ? "대상 " + n.toLocaleString() + "명" : "스탬프 6개";
}
/* 6번째 스탬프 상자 팝업에 붙는 한 줄(별도 팝업 없음 · 설계안 5.7) */
function rfxFinLine() {
  if (raffleTickets(Math.min(REWARD_CAP, stampCount())) < RAFFLE_MAX) return "";
  return finLate() ? "<br>참여상 추첨은 17:00 기준 6개까지 집계했어요" : "<br>참여상 추첨 대상 · 17:00 기준";
}
/* 참여상 안내 모달(설계안 6장 문구) */
function finInfoOpen() {
  var f = S.get("fin", null) || {}, st = finState(), p = st === "win" ? prizeByName(f.pz) : null;
  var head = st === "win" ? '<div class="axs-rwhd">' + prizePhHtml(p) + '<div class="ax-stack-tight"><p class="ax-meta">참여상 당첨</p><p class="ax-card-title">' + esc(f.pz || "") + "</p></div></div>" : "";
  modalOpen(head + '<p class="muted" style="' + (head ? "margin-top:12px;" : "") + 'font-size:calc(14.5px * var(--fs));line-height:1.7">스탬프 6개<br>' + FIN_NOTE + "</p>" +   /* v5.08 설명 두 줄만(사용자 261003) */
    prizeModalHtml("fin") +
    '<button class="btn line" style="margin-top:12px" onclick="modalClose()">닫기</button>', "참여상");
}
/* 커피 · 간식 사진 2장 · 18F 커피챗 상세 · DAP 과제상담 상세 */
function treatHtml() {
  return '<div class="axs-treat">' + TREATS.map(function (t) {
    return "<figure>" + prizePhHtml(t, 360) + "<figcaption><b>" + esc(t.nm) + "</b><span>" + esc(t.sub) + "</span></figcaption></figure>";
  }).join("") + "</div>";
}

/* ── 스탬프 · 숫자는 현행 운영: 카드 8종 · 개수 상한 6 · 응모권 최대 3장 · 현황 모양은 홈과 같은 railHtml(v4.10) ── */
function stampGoalText(n) {
  if (n < 3) return (3 - n) + "개 더 모으면 룰렛 1회";
  if (n < STAMP_DENOM) return "1개 더 모으면 행운권 " + raffleTickets(n + 1) + "장" + (n === STAMP_DENOM - 1 && !finLate() ? " · 참여상 추첨" : "");   /* v5.06 6번째 = 참여상 추첨 대상도 되는 칸 · 17:00 뒤(finLate)에는 대상이 아니라 붙이지 않는다 */
  return STAMP_DENOM + "개 모두 모았어요 · 행운권 " + RAFFLE_MAX + "장";
}

/* ── v4.84 스탬프 탭(exp) 행 · 번호 · 이름 · 수단 칩 + 한 줄 · 오른쪽 행동 하나 · AX 퀴즈 · 미니 게임은 종목 타일 ── */
function expStamp(id) {
  App.tab("exp");
  setTimeout(function () {
    var r = document.querySelector('#view [data-stp="' + id + '"]');
    if (r) r.scrollIntoView({ block: "center" });
  }, 60);
}
var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2 8.8-9.4"/></svg>';
/* 종목 타일 · 완료 = 연주황 「O/X 완료」 · 남음 = 흰 면 · 누르면 그 종목 시작 화면 */
function stpTilesHtml(keys) {
  var me = olyMe(), q = keys === OLY_QUIZ_KEYS;   /* AX 퀴즈 타일은 이름 그대로(v4.92 AX 퀴즈 한 판 · 옛 O/X 퀴즈 · 기억력 퀴즈 두 타일) */
  return '<div class="axs-tiles">' + olyKeysEvents(keys).map(function (e) {
    var d = !!me.ev[e.key];
    return '<button type="button" class="axs-tile' + (d ? " done" : "") + '" onclick="App.go(\'' + e.view + '\')">' + esc(q ? e.name : e.short) + (d ? " 완료" : "") + "</button>";
  }).join("") + "</div>";
}
/* v4.95 보조 줄 하나 · 스탬프 탭 줄과 홈 「다음 스탬프」 카드가 같이 쓴다 · 수단 칩(폰으로 · 현장 · 스태프 인증) = 줄 맨 앞 · 그 옆이 조건 · 시간 글
   칩은 줄지 않고(flex none) 글만 칩 옆 칸에서 줄바꿈한다(칩 혼자 한 줄에 남지 않게 · 제목 줄은 건드리지 않는다) · 375px 일반에서 한 줄이 되게 글을 줄였다 */
function stpLineHtml(mode, meta) {
  if (!mode && !meta) return "";
  return '<p class="axs-stpm">' + (mode ? '<span class="axs-stpc' + (mode === "스태프 인증" ? " staff" : "") + '">' + esc(mode) + "</span>" : "") + (meta ? "<span>" + meta + "</span>" : "") + "</p>";
}
/* 행 한 줄 설명 · 화면에 없는 장소 · 시간 · 조건만(문구 다이어트) · v4.95 375px 한 줄(종목 이름은 아래 타일 · 장소는 행동 화면에) */
function stpMeta(s, got) {
  if (s.id === "lg") return "";
  if (got && (s.id === "qz" || s.id === "p4")) return "스탬프 받음";   /* v5.16 받은 뒤 = 상태 한 마디 + 오른쪽 「다시 하기」 */
  if (s.id === "qz") return QZ_NEED <= 1 ? qzLenTxt() : QZ_NEED + "종 완주 · " + Math.min(QZ_NEED, qzDone()) + " / " + QZ_NEED;
  if (s.id === "p4") return (stampV2() ? "3종 완주 · " : "서로 다른 3종목 · ") + Math.min(MG_NEED, mgDone()) + " / " + MG_NEED;
  if (s.id === "p2") return "1F · 체험 2종";   /* 「스태프 인증」 칩 옆 104px · 이름(HiDI-Q · Hi-Helper)은 구역 줄 · 체험 안내 화면에 */
  if (s.id === "p5") return "1분 · AX LAB QR로도";
  if (s.id === "p3") return progUnits() === 1 ? "2개 중 1개 · 하나 더" : "강연 · 상담 · 커피챗";   /* v5.68 17F 입장이나 끝 한쪽만 받은 상태 */
  if (s.id === "st") { var sst = stairState(); return sst.leg ? "진행 중 · " + sst.leg.fl + "F 시작" : stairLine(sst); }
  if (s.id === "sv") return SURVEY.open + "부터 · 60초";
  return s.where || "";
}
/* 오른쪽 행동 [글, onclick] · onclick 이 없으면 글만(완료 · 열리는 시각) */
function stpAct(s, got) {
  if (got) return s.id === "p5" ? ["더 쓰기", "App.go('ideas')"] : s.id === "sv" ? ["결과", "App.go('survey')"] :
    s.id === "qz" ? ["다시 하기", "App.go('quiz')"] : s.id === "p4" ? ["다시 하기", "App.go('games')"] : ["완료", ""];   /* v5.16 (사용자 261003 「스탬프가 완료되면 더 안 된다」) 스탬프는 한 번 · 게임은 몇 번이든 · 받은 줄도 목록으로 */
  if (s.id === "lg") return ["자동", ""];
  if (s.id === "qz" && QZ_NEED <= 1) return ["시작", "App.go('quiz')"];   /* v4.95 (사용자 261002 「AX 퀴즈 박스 표시는 이제 없어도 된다」) 한 판뿐 · 타일 없이 줄을 누르면 시작 화면 */
  if (s.id === "qz" || s.id === "p4") return ["", ""];   /* 종목 타일이 행동이다 */
  if (s.id === "p2") return ["내 QR", "qrPanelOpen('mine')"];
  if (s.id === "p5") return ["쓰기", "App.go('ideas')"];
  if (s.id === "p3") return ["보기", "homeSched()"];
  if (s.id === "st") return [stairState().leg ? "진행 중" : "안내", "stairOpen()"];
  if (s.id === "sv") return surveyLock() === "time" ? [SURVEY.open, ""] : ["시작", "App.go('survey')"];
  return [s.cta ? "보기" : "", s.tap || ""];
}
function stpRowHtml(s, i, st, full) {
  var got = st.indexOf(s.id) >= 0, a = stpAct(s, got), mode = got ? "" : STAMP_MODE[s.id] || "", meta = stpMeta(s, got);   /* v4.99 받은 줄은 수단 칩(자동 · 폰으로 · 스태프 인증) 없음 · 받는 법은 받기 전에만 뜻이 있다 */
  var tiles = got ? "" : s.id === "qz" && QZ_NEED > 1 ? stpTilesHtml(OLY_QUIZ_KEYS) : s.id === "p4" ? stpTilesHtml(stampV2() ? OLY_MINI_KEYS : olyAllKeys()) : "";   /* v4.95 AX 퀴즈 타일 없음(한 판) · 받은 줄은 타일 없이(오른쪽 「완료」와 겹쳐 두 줄이 되던 자리) */
  var test = !testMode() ? "" : got ? '<button type="button" class="axs-stpx" onclick="testStampUndo(\'' + s.id + '\')">테스트 · 완료 취소</button>' : '<button type="button" class="axs-stpx" onclick="testStamp(\'' + s.id + '\')">테스트 · 완료 처리</button>';
  /* v4.95 행동이 있는 줄은 줄 전체를 눌러도 같은 행동(안의 버튼 · 타일은 그 버튼만) · 키보드는 오른쪽 버튼 */
  var tap = a[1] ? ' onclick="if (!event.target.closest(\'button\')) { ' + a[1].replace(/"/g, "&quot;") + '; }"' : "";
  /* v5.68 프로그램 참여 = 2개 · 제목 옆 「×2」 · 17F 한쪽만(p3h) = 번호 칸 반 채움 「1/2」 */
  var half = !!s.x2 && !got && st.indexOf(STAMP_HALF) >= 0;
  return '<div class="axs-stp' + (got ? " done" : half ? " half" : full ? " off" : "") + (tap ? " tap" : "") + '" data-stp="' + s.id + '"' + tap + ">" +
    '<span class="axs-stpn" aria-hidden="true">' + (got ? CHECK_SVG : half ? "1/2" : i + 1) + "</span>" +
    '<div class="axs-stpb"><p class="ax-card-title">' + esc(s.title) + (s.x2 ? '<span class="axs-x2" aria-label="스탬프 2개">×2</span>' : "") + (got ? '<span class="ax-sr-only"> · 완료</span>' : half ? '<span class="ax-sr-only"> · 2개 중 1개</span>' : "") + "</p>" +
    stpLineHtml(mode, esc(meta)) +
    tiles + test + "</div>" +
    (a[0] ? (a[1] ? '<button type="button" class="axs-stpa" onclick="' + a[1] + '">' + esc(a[0]) + "</button>" : '<span class="axs-stpa ' + (got ? "ok" : "off") + '">' + esc(a[0]) + "</span>") : "") +
    "</div>";
}
/* 구경하고 겨루기 · 1F 타자왕 현장 순위(type_rank · v5.29 현장 순위판 하나) · 실시간 화면은 4묶음(type_live) */
function typeSiteRankGo() { App.go("type_rank"); }   /* v5.29 탭 없음(현장 순위판 하나) */

