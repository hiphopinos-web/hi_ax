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
  /* v5.90 (261006 경품 기획 변경 · 계약.md 5.1) 선착순 참여상 · 서버 my.fcfs 가 있을 때만(없으면 카드 없음) · 상태 got · done · full · void · closed */
  var f = fcfsMy(), fx = fxGet(), cap = fx ? fx.cap : 210;
  if (f && f.st === "got") items.push({ k: "fin", used: false, chip: "수령 자격", nm: "선착순 참여상", big: "1개", why: "1F 체크인존에서 수령" + (f.at ? " · " + esc(f.at) + " 달성" : ""), go: "fcfsInfoOpen()", btn: "안내 보기" });
  if (f && f.st === "done") items.push({ k: "fin", used: true, chip: "수령 완료", off: true, nm: "선착순 참여상", big: "", why: "무선 무드등 가습기" });
  if (f && f.st === "full") items.push({ k: "fin", used: true, chip: "마감", off: true, nm: "선착순 참여상", big: "", why: cap + "명 마감 · 6개 달성은 행운권 3장" });
  if (f && f.st === "void") items.push({ k: "fin", used: true, chip: "취소", off: true, nm: "선착순 참여상", big: "", why: "자격이 취소됐어요 · 운영진 문의" });
  if (f && f.st === "closed") items.push({ k: "fin", used: true, chip: "마감", off: true, nm: "선착순 참여상", big: "", why: "17:00 이후 달성" });
  /* v5.90 행운권 7등 랜덤 굿즈 · 서버 my.lk7 이 있고 행운권 보유(in)일 때 · 추첨 뒤 당첨이면 당첨 칩 */
  var l7 = S.get("lk7", null);
  if (l7 && l7.in && l7.ph !== "done") items.push({ k: "lk7", used: false, chip: "추첨 대기", cc: "", nm: "랜덤 굿즈", big: "", why: "행사 뒤 추첨 · 사내 우편 발송" });
  if (l7 && l7.ph === "done" && l7.w) items.push({ k: "lk7", used: false, chip: "당첨", nm: "랜덤 굿즈", big: "1세트", why: "사내 우편으로 발송" });
  return items;
}

/* ════════════════ v5.04 경품 안내 · 참여상 (261002 사용자 확정 · CLAUDE.md 「보상」 · 「경품 앱 공개」) ════════════════
   룰렛 · 행운권 · 참여상 경품의 이름 · 사진 · 수량만 보여 준다 · 가격 · 사전등록자 키트 · 실습 세션 기념품은 넣지 않는다.
   사진 = assets/prize/<img>.webp(정사각 240 · 커피 · 간식 360) · 실물 사진이 오면 같은 이름으로 파일만 바꾸고 PRIZE_SAMPLE 을 false 로(항목 하나만이면 그 항목에 s: 0).
   v5.88 (사용자 261006 상품 시안 「디자인 시안/00.상품들」) 룰렛 5등급 · 완주 경품 · 커피 = <이름>_v2(흰 바탕 정사각 600 · 커피 400) · 시안 렌더라 샘플 딱지 유지 · 옛 이름 rl1~rl5 · rl2_coffee · rl2_keyring 파일은 1층 둘러보기(tour3.js ROUL)가 아직 써서 남김
   수량은 이 표 한 곳이다(룰렛 2등 100 = 커피 + 키캡 키링 · 남는 커피 40은 예비라 보이지 않는다 · 사용자 확정 261002). */
var PRIZE_DIR = "assets/prize/", PRIZE_SAMPLE = false;   /* v5.90 (사용자 261006) 「샘플」 딱지 모두 뗌 · CSS .smp 는 남김 */
var PRIZES = {
  roulette: { unit: "개", list: [
    { rk: "1등", nm: "텀블러", q: 60, img: "rl1_tumbler_v2" },
    { rk: "2등", nm: "커피 + 키캡 키링", q: 140, img: "rl2_coffee_v2", img2: "rl2_keyring_v2" },   /* v5.90 새 인쇄본 140 · 210 · 210 · 340 */   /* v5.18 합성 사진 대신 두 장 나란히(사용자 261003) */
    { rk: "3등", nm: "컵받침", q: 210, img: "rl3_coaster_v2" },
    { rk: "4등", nm: "판스티커", q: 210, img: "rl4_sticker_v2" },
    { rk: "5등", nm: "볼펜", q: 340, img: "rl5_pen_v2", tall: 1 }] },   /* v5.33 tall = 넓은 칸에서도 자르지 않는다(사선 볼펜 사진) */
  draw: { unit: "명", list: [
    { rk: "1등", nm: "아이패드", q: 1, img: "ld1_ipad" },
    { rk: "2등", nm: "신라호텔 파크뷰 뷔페 식사권 2매", q: 1, img: "ld2_shilla" },
    { rk: "3등", nm: "미닉스 음식물 처리기", q: 1, img: "ld3_minix" },
    { rk: "4등", nm: "에어팟 4", q: 2, img: "ld4_airpods" },
    { rk: "5등", nm: "풀리오 종아리 마사지기", q: 2, img: "ld5_pulio" },
    { rk: "6등", nm: "현대백화점 상품권 10만원", q: 3, img: "ld6_hyundai" }] },
  /* v5.90 fin 칸 = 선착순 참여상(키는 그대로 · 구역 id pz-fin) · 7등 랜덤 굿즈(lk7 · 사진 = 세트 구성 두 장) · 아이디어왕(idea · AI 구독권 카드 그림 idea1 ~ 3 · 사용자 261006 「가」 · 바꿀 때는 파일만) */
  fin: { unit: "개", list: [
    { rk: "", nm: "무선 무드등 가습기", q: 210, img: "fin_humidifier_v2" }] },
  lk7: { unit: "세트", list: [
    { rk: "7등", nm: "랜덤 굿즈", sub: "텀블러 · 판스티커 · 키캡 키링 · 볼펜", q: 60, img: "rl1_tumbler_v2", img2: "rl4_sticker_v2" }] },
  idea: { unit: "명", list: [
    { rk: "1등", nm: "AI 구독권 6개월", q: 1, img: "idea1" },
    { rk: "2등", nm: "AI 구독권 3개월", q: 1, img: "idea2" },
    { rk: "3등", nm: "AI 구독권 1개월", q: 3, img: "idea3" }] },
  /* v5.05 1F 타자왕 1~3위(17:00 Outro 시상) · v5.09 (261003 사용자 확정) 새 상품 · 사진 = 제조사 공식 컷 */
  type: { unit: "명", list: [
    { rk: "1등", nm: "기계식 키보드", sub: "체리 G80-3872", q: 1, img: "ty1_cherry", flat: 1 },   /* v5.18 flat = 사진 2:1(위아래 여백 자르기) */
    { rk: "2등", nm: "마우스", sub: "로지텍 MX Master 4", q: 1, img: "ty2_mxmaster4" },
    { rk: "3등", nm: "기계식 키보드", sub: "AULA F108 Pro", q: 1, img: "ty3_aula" }] }
};
/* 커피 · 간식(18F 커피챗 · 1F DAP 과제상담) · 커피 = 페트병(우리 스티커 목업) · 간식 = 달곰 베이크샵 휘낭시에 · 스콘(블로그 사진 합성 · 임시) · 바꿀 때는 파일만 */
/* v5.90 (261006) 상담 · 커피챗 지급 = 커피 · 쿠키 · 노트 · 볼펜 · 커피 = 룰렛 2등과 같은 페트병 두 병(콜드브루 · 디카페인) · 쿠키 · 노트 · 볼펜 사진은 아직 없어 아이콘 칸(ico · 사진이 오면 img 만 채운다) */
var TREATS = [
  { nm: "커피", sub: "콜드브루 · 디카페인", img: "cc_coffee_v2", img2: "cc_decaf_v2" },
  { nm: "쿠키", sub: "광화문 달곰 베이크샵", ico: "cookie" },
  { nm: "노트", sub: "", ico: "note" },
  { nm: "볼펜", sub: "", ico: "pen" }
];
var TREAT_ICO = {
  cookie: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="16"/><circle cx="18" cy="19" r="1.6" fill="currentColor"/><circle cx="28" cy="17" r="1.6" fill="currentColor"/><circle cx="30" cy="28" r="1.6" fill="currentColor"/><circle cx="19" cy="30" r="1.6" fill="currentColor"/><circle cx="24" cy="24" r="1.4" fill="currentColor"/></svg>',
  note: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="8" width="26" height="32" rx="3"/><path d="M12 14h-3M12 22h-3M12 30h-3M18 16h14M18 22h14M18 28h9"/></svg>',
  pen: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M33 9l6 6-21 21-8 2 2-8z"/><path d="M29 13l6 6"/></svg>'
};
function prizePhHtml(p, w) {
  if (p && !p.img && p.ico && TREAT_ICO[p.ico]) return '<span class="axs-ph ico" aria-hidden="true">' + TREAT_ICO[p.ico] + "</span>";   /* v5.90 사진 없는 지급품 = 아이콘 칸 */
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
/* v5.90 옛 FIN_NOTE(완주 경품 추첨 두 줄)는 선착순 안내(fcfsInfoOpen)로 바뀌었다 */
var PZ_HERO = { draw: 3, lk7: 1, fin: 1, roulette: 1, idea: 0, type: 1 };   /* v5.09 타자왕도 사진 카드(1등 대표 · 2 · 3등 2열) */
/* v5.74 (사용자 261006 「텍스트 위주 · 불필요한 정보 · 아웃트로 참석해야 추첨 대상이 된다는 게 중요한데 별도 박스로 확 눈에 들어와야」) 블록마다 「받으려면」 조건 박스 하나
   need = [아이콘, 굵은 한 줄(할 일), 옅은 한 줄(때 · 곳 · 덧붙임)] 두 줄 · 옛 조건 줄(cd) · 점 6개(pzMeter) · 「스탬프와 별개」 알약(sp) · 참여상 아래 설명(note)은 걷었다(4 · 5 · 6개 = 1 · 2 · 3장은 위 단계 카드가 말한다)
   사실 근거 = CLAUDE.md 보상 · 경품 · 타자왕 줄 · 「디자인 시안/완주 경품 추첨/설계안.md」(17:00 기준 · 체크인 조건 없음 · 다음 날 소속 부서로 배송) · Outro 상세(16:40부터 입구 추첨 QR) · 타자왕 1~3위 시상 참석 · 못 오면 대리 수상(사용자 261006) */
var PZ_ICO = {
  stamp: SICO + '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.2l2.6 2.6 4.9-5.2"/></svg>',
  qr: SICO + '<path d="M4 8.5V5.5A1.5 1.5 0 0 1 5.5 4h3M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3"/><path d="M8.5 8.5h2.5v2.5H8.5zM13 8.5h2.5v2.5H13zM8.5 13h2.5v2.5H8.5zM13.5 13.5h2v2h-2z"/></svg>',
  box: SICO + '<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/></svg>',
  key: SICO + '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7.5 14h9"/></svg>',
  cup: SICO + '<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20h7M9.5 17h5"/></svg>'
};
/* v5.90 (261006 경품 기획 변경 · 계약.md 5절) 행운권 받으려면 줄2 = 참석 조건(sync lkcond) 따라 · 7등 · 선착순 참여상 · 아이디어왕 구역 · 서버 필드가 없으면(on) 구역을 그리지 않는다 */
var PZ_SEC = [
  { k: "draw", en: "LUCKY DRAW", t: "행운권 추첨", need: function () { return [["stamp", "스탬프 4개부터 행운권", "6개면 3장"], lkCond() ? ["qr", "Outro 참석 · 17F 입구 QR 체크인", "16:40부터 · 17:00 현장 추첨"] : ["cup", "17F Outro 현장 추첨", "17:00 · 당첨자 발표만, 경품은 나중에 전달"]]; } },
  { k: "lk7", en: "7TH PRIZE", t: "행운권 7등 · 랜덤 굿즈 60세트", on: function () { return !!S.get("lk7", null); }, need: [["stamp", "스탬프 4개 이상(행운권 보유)", "1~6등 당첨자는 제외"], ["box", "행사 뒤 추첨", "사내 우편으로 발송"]] },
  { k: "fin", en: "FIRST COME", t: "선착순 참여상", on: function () { return !!fxGet(); }, need: function () { var x = fxGet() || {}; return [["stamp", "스탬프 6개를 먼저 채운 " + (x.cap || 210) + "명", x.left === 0 ? "선착순 마감" : x.left > 0 ? "남은 수량 " + x.left + "개" : ""], ["box", "1F 체크인존에서 수령", "당일 못 받으면 10/27 소속 부서로 발송"]]; } },
  { k: "roulette", en: "ROULETTE", t: "룰렛", need: function () { return [["stamp", "스탬프 3개면 룰렛 1회", "1인 1회"], ["qr", "1F EVENT 룰렛 부스에서 내 QR 제시", S.get("rcut", "") ? "룰렛 " + S.get("rcut", "") + " 마감" : ""]]; } },
  { k: "idea", en: "IDEA KING", t: "아이디어왕", on: function () { return !!S.get("idea_pub", null); }, need: function () { var ip = S.get("idea_pub", null) || {}; return [["stamp", (ip.cut || "16:00") + "까지 아이디어 한 줄", "AX 라운지 · 커피챗 · 앱 어느 경로든"], ["cup", "Outro에서 시상", ideaKingN() + "명 · AI 구독권"]]; } },
  { k: "type", en: "TYPING KING", t: "1F 타자왕 1~3위", sep: 1, need: [["key", "1F 현장 기록 1~3위", "17:00 마감 · 스탬프와 별개"], ["cup", "Outro 시상 참석", "못 오면 대리 수상"]], go: ["실시간 순위 보기", "typeSiteRankGo()"] }   /* v5.18 맨 아래 · 선으로 나눔 · 순위판 입구 = 블록 맨 아래(v5.73) */
];
/* 「받으려면」 박스 · 연주황 면(brandSoft) · 아이콘 주황 · 굵은 글 ink · 옅은 글 body · 읽어 주기 = 「받으려면」 + 줄마다 */
function pzNeedHtml(s) {
  var need = typeof s.need === "function" ? s.need() : s.need;   /* v5.90 서버 값(참석 조건 · 남은 수량 · 마감 시각)을 그릴 때 읽는다 */
  return '<div class="axs-pz-need" role="group" aria-label="' + esc(s.t) + ' 받으려면"><p class="k" aria-hidden="true">받으려면</p><ul>' + need.map(function (r) {
    return '<li><span class="i" aria-hidden="true">' + PZ_ICO[r[0]] + '</span><span class="x"><b>' + esc(r[1]) + "</b>" + (r[2] ? "<span>" + esc(r[2]) + "</span>" : "") + "</span></li>";
  }).join("") + "</ul></div>";
}
var PZ = { t: 0 };
var PZ_THUMB = ["ld1_ipad", "fin_humidifier_v2", "rl1_tumbler_v2"];   /* 입구 사진 3장 = assets/prize/t_<img>.webp(96px) */
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
function pzCard(p, unit, cls) {
  var im = function (n) { return '<img src="' + PRIZE_DIR + n + '.webp" alt="" width="600" height="600" loading="lazy" decoding="async" onerror="this.remove()">'; };
  var ph = '<span class="axs-pz-ph' + (p.img2 ? " two" : "") + '">' + (p.img ? im(p.img) + (p.img2 ? im(p.img2) : "") +
    (PRIZE_SAMPLE && p.s !== 0 ? '<span class="smp">샘플</span>' : "") : "") + "</span>";
  return '<article class="axs-pz-c' + cls + (p.flat ? " flat" : "") + (p.tall ? " tall" : "") + '"><div class="tx">' + (p.rk ? '<span class="rk">' + p.rk + "</span>" : "") +
    "<b>" + esc(p.nm) + (p.sub ? "<small>" + esc(p.sub) + "</small>" : "") + '</b><span class="q">' + p.q.toLocaleString() + unit + "</span></div>" + ph + "</article>";   /* v5.33 글 줄 먼저 · 사진 아래 */
}
function prizeSecHtml(s) {
  var g = PRIZES[s.k]; if (!g || (s.on && !s.on())) return "";
  var head = '<header class="axs-pz-sh" id="pz-' + s.k + '"><p class="en" aria-hidden="true">' + s.en + "</p><h2>" + s.t + "</h2></header>" + pzNeedHtml(s);   /* v5.74 머리 = 영문 장식 · 제목 · 「받으려면」 박스 */
  var go = s.go ? '<button type="button" class="ax-button ax-button-weak" onclick="' + s.go[1] + '">' + s.go[0] + "</button>" : "";   /* v5.73 (사용자 261005 「실시간 순위는 가장 아래 위치에 있어야 할 것 같아」) 구역 버튼(타자왕 순위판) = 블록 맨 아래(경품 사진 · 이름 · 안내 다음) · 옛 v5.18 = 머리 바로 아래 */
  var hn = PZ_HERO[s.k] || 0, rest = g.list.slice(hn), solo = rest.filter(function (p) { return !p.img2; }).length, k = 0;
  var body = g.list.slice(0, hn).map(function (p) { return pzCard(p, g.unit, " hero"); }).join("") +
    (rest.length ? '<div class="axs-pz-gr">' + rest.map(function (p) {   /* v5.18 사진 두 장 카드(img2) = 늘 넓은 카드 · 나머지에서 홀수로 남는 마지막 칸 = 넓은 카드 */
      if (p.img2) return pzCard(p, g.unit, " gr wide");
      k++; return pzCard(p, g.unit, " gr" + (solo % 2 && k === solo ? " wide" : ""));
    }).join("") + "</div>" : "");
  return '<section class="axs-pz-sec' + (s.sep ? " sep" : "") + '">' + head + body + go + "</section>";
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
  return s ? "<b>" + (s.m - n) + "개</b> 더 모으면 " + s.t + " " + s.a + (s.fin && fcfsOpen() ? " · 선착순 참여상" : "") : "모두 모았어요";   /* v5.90 */
}
var PZ_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 9.5 12 15l5.5-5.5"/></svg>';   /* v5.33 표지 카드 아래 셰브론 = 아래 구역으로 */
function prizeCoverHtml(noHead) {
  var n = Math.min(STAMP_DENOM, stampCount()), nx = PZ_STEP.filter(function (x) { return x.m > n; })[0], nm = nx ? nx.m : 0, dots = "";
  for (var i = 1; i <= STAMP_DENOM; i++) dots += '<span class="c"><i class="' + (i <= n ? "on" : i === n + 1 ? "nx" : "") + '">' + i + "</i></span>";   /* v5.33 6칸마다 점 하나 · 같은 크기 */
  var fill = n >= 2 ? "calc(" + (n - 1) + " * ((100% - 20px) / 6 + 4px))" : "0px";   /* 1번 칸 가운데부터 받은 마지막 칸 가운데까지(칸 폭 + 칸 사이 4px) */
  var cards = '<p class="pre' + (n >= 3 ? " done" : "") + '"><span class="t">보상은</span><b>3개부터</b></p>' + PZ_STEP.map(function (s) {
    var st = s.m <= n ? "on" : s.m === nm ? "nx" : "", lbl = "스탬프 " + s.m + "개 · " + s.t + " " + s.a + (s.fin && fxGet() ? " · 선착순 참여상" : "") + (st === "on" ? " · 달성" : st === "nx" ? " · 다음" : "");
    return '<button type="button" class="' + st + '" onclick="prizeJump(\'' + s.k + '\')" aria-label="' + lbl + '"><span class="i" aria-hidden="true">' + RAIL_ICO[s.ico] + "</span>" +
      '<span class="t" aria-hidden="true">' + s.t + '</span><b aria-hidden="true">' + s.a + "</b>" +
      (s.fin && fxGet() ? '<span class="fn" aria-hidden="true">+<span class="g">' + PZ_GIFT + "</span>선착순</span>" : "") +
      '<span class="bt" aria-hidden="true">' + (st === "nx" ? '<span class="tag">다음</span>' : st === "on" ? '<span class="tag on">' + CHECK_SVG + "달성</span>" : "") + '<span class="dn">' + PZ_DOWN + "</span></span></button>";
  }).join("");
  return '<section class="axs-pz-cv">' + (noHead ? "" : '<p class="ey">AX Festival 2026</p><h1 class="ttl">스탬프 개수별 경품</h1>') +   /* v5.69 시트 = 제목은 시트 머리 */
    '<div class="now"><div class="tx"><p class="k">지금 내 스탬프</p><p class="nx">' + pzNextTxt(n) + '</p></div><p class="n"><b>' + n + "</b>개</p></div>" +
    '<div class="stp" role="img" aria-label="스탬프 ' + n + " / " + STAMP_DENOM + '"><span class="ln" aria-hidden="true"></span><span class="fl" aria-hidden="true" style="width:' + fill + '"></span>' + dots + "</div>" +
    '<div class="cds">' + cards + "</div></section>";
}
/* v5.69 경품 시트(detPaint · 라우트 prizes) · 제목 = 시트 머리(v5.79 짧은 이름 = 이 제목 그대로 · 본문 첫 줄 제목 없음) · 본문 = 표지(지금 내 스탬프 · 1~6 · 단계 카드) + 구역 · 버튼 없음(읽기) · 구역 바로 가기(prizeGo k)는 시트 본문 스크롤 */
function prizeSheet() {
  return { name: "스탬프 개수별 경품", body: '<div class="axs-pz' + (Date.now() - PZ.t < 900 ? " in" : "") + '">' + prizeCoverHtml(true) + PZ_SEC.map(prizeSecHtml).join("") + "</div>" };
}
function prizePosterHtml() {
  return '<div class="axs-pz' + (Date.now() - PZ.t < 900 ? " in" : "") + '">' + prizeCoverHtml() + PZ_SEC.map(prizeSecHtml).join("") + "</div>";
}
/* v5.90 (261006 경품 기획 변경) 옛 완주 경품 추첨 앱 함수(finLate · finState · finCountTxt · rfxFinLine · finInfoOpen)는 지웠다 · 서버가 완주추첨_사용 OFF 면 my.fin 을 보내지 않는다 · 되살리기 = 루트 「정리 기록.md」 v5.90 절
   선착순 참여상 = 서버 sync my.fcfs { st, cnt, need, at, ship, ck } · pub.fx { on, cap, left(-1 = 숨김), cut, show } · 없으면(옛 서버) 아무것도 그리지 않는다 · 순번은 앱에 오지 않는다 */
function fcfsMy() { var f = S.get("fcfs", null); return f && typeof f === "object" && f.st && f.st !== "off" ? f : null; }
function fxGet() { var x = S.get("fx", null); return x && typeof x === "object" && x.on ? x : null; }
function fcfsOpen() { var x = fxGet(); return !!x && x.left !== 0 && !fcfsLate(); }   /* 남아 있고 마감 전 */
function fcfsLate() {
  var x = fxGet(), cut = String((x && x.cut) || "").split(":");
  if (cut.length < 2) return false;
  var d = new Date(Date.now() + sesOff());
  return d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 26 && d.getHours() * 60 + d.getMinutes() >= (+cut[0]) * 60 + (+cut[1]);
}
/* 6개 레일 캡션 뒤 · 수령 자격 · 수령 완료 · 마감 */
function fcfsCapTxt() { var f = fcfsMy(); return !f ? "" : f.st === "got" ? " · 참여상 수령 자격 · 1F 체크인존" : f.st === "done" ? " · 참여상 수령 완료" : f.st === "full" ? " · 참여상 마감" : ""; }
/* 남은 수량 한 줄 · 6개 전 · 서버가 숫자를 숨기면(-1) 안 그린다 · 0 = 마감 */
function fcfsLeftHtml(n) {
  var x = fxGet(); if (!x || n >= STAMP_DENOM || x.left < 0) return "";
  return '<p class="cap fx">' + (x.left === 0 ? "선착순 참여상 · 마감" : "선착순 참여상 · 남은 " + x.left + " / " + x.cap) + "</p>";
}
/* 6번째 스탬프 상자 팝업 한 줄 */
function fcfsPopLine() {
  if (raffleTickets(Math.min(REWARD_CAP, stampCount())) < RAFFLE_MAX) return "";
  var f = fcfsMy(); return !f ? "" : f.st === "got" ? "<br>선착순 참여상 수령 자격이 생겼어요" : f.st === "full" ? "<br>선착순 참여상은 마감됐어요" : "";
}
function fcfsInfoOpen() {
  var x = fxGet() || {};
  modalOpen('<p class="muted" style="font-size:calc(14.5px * var(--fs));line-height:1.7">스탬프 6개를 먼저 채운 ' + (x.cap || 210) + "명<br>수령 자격은 6개째에 바로 생겨요<br>1F 체크인존에서 수령 · 당일 못 받으면 10/27 소속 부서로 발송</p>" +
    prizeModalHtml("fin") + '<button class="btn line" style="margin-top:12px" onclick="modalClose()">닫기</button>', "선착순 참여상");
}
/* 행운권 참석 조건(sync lkcond · 옛 서버 = 조건 있음) · 룰렛 마감 시각(sync rcut) · 아이디어왕 인원 */
function lkCond() { var v = S.get("lkcond", null); return v === null ? true : !!v; }
function drawWhenTxt() { return lkCond() ? "Outro 현장 추첨은 17F 입구 QR 체크인" : "17:00 Outro 현장 추첨 · 당첨자 발표"; }
function roulCutHm() { return String(S.get("rcut", "") || ""); }
function roulCut() {
  var c = roulCutHm().split(":"); if (c.length < 2) return false;
  var d = new Date(Date.now() + sesOff());
  return d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 26 && d.getHours() * 60 + d.getMinutes() >= (+c[0]) * 60 + (+c[1]);
}
function ideaKingN() { var ip = S.get("idea_pub", null), n = 0; ((ip && ip.prz) || []).forEach(function (x) { n += +x.n || 0; }); return n || 5; }
/* 커피 · 간식 사진 2장 · 18F 커피챗 상세 · DAP 과제상담 상세 */
function treatHtml() {
  return '<div class="axs-treat">' + TREATS.map(function (t) {
    return "<figure>" + prizePhHtml(t, 360) + "<figcaption><b>" + esc(t.nm) + "</b><span>" + esc(t.sub) + "</span></figcaption></figure>";
  }).join("") + "</div>";
}

/* ── 스탬프 · 숫자는 현행 운영: 카드 8종 · 개수 상한 6 · 응모권 최대 3장 · 현황 모양은 홈과 같은 railHtml(v4.10) ── */
function stampGoalText(n) {
  if (n < 3) return (3 - n) + "개 더 모으면 룰렛 1회";
  if (n < STAMP_DENOM) return "1개 더 모으면 행운권 " + raffleTickets(n + 1) + "장" + (n === STAMP_DENOM - 1 && fcfsOpen() ? " · 선착순 참여상" : "");   /* v5.90 6번째 = 선착순 참여상 · 남아 있고 마감 전일 때만 */
  var f = fcfsMy();   /* v5.90 계약 5.1 */
  if (f && f.st === "got") return STAMP_DENOM + "개 모두 모았어요 · 참여상 수령 자격";
  if (f && f.st === "done") return STAMP_DENOM + "개 모두 모았어요 · 참여상 수령 완료";
  if (f && f.st === "full") return STAMP_DENOM + "개 모두 모았어요 · 참여상은 마감";
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
  if (s.id === "p5" && ideaGateOff()) return [got ? "완료" : "10/26부터", ""];   /* v5.90 아이디어 사전 오픈 OFF · 행사 전 = 입구 숨김 */
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

