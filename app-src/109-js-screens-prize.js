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
/* ── 261007 공지 = 아래에서 올라오는 시트(사용자 「공지사항은 홈 화면을 재조합하는 형태? 밑에서 올라오는 팝업 형태? 후자가 맞을 것 같아」) ──
   옛 홈 맨 위 공지 카드(homeNoticeHtml · 30분 창)는 걷었다 · 공지가 와도 홈이 다시 짜이지 않는다 · 헤더 종 목록 · 개수 점은 그대로
   새 공지가 도착하면(소켓 · sync = beNoticeIn) · 앱을 열 때(enterNow) 안 읽은 최근(6시간) 공지가 있으면 시트 한 번 · 공지마다 이 기기에 한 번(ntc_rd · 공지 목록을 열어도 읽음)
   여러 개면 가장 새것 한 장 + 「공지 n개 더 보기」(공지 목록) · 본문에 링크(https)가 있으면 주 버튼 「링크 열기」 + 「확인」
   다른 안내(스탬프 팝 · 사전등록 안내 · 선착순 안내 · 확인 팝업 · 다른 시트)와는 같은 대기열(notice · run)로 하나씩
   글을 쓰는 중 · 게임 화면 · 둘러보기 3D 안 · 스캔 중 · 상세 시트가 열려 있으면 미뤘다가(ntcHold) 나온 뒤 · 커피챗 마감 신호(CCHAT_CLOSE_T)는 공지로 쌓지 않아 뜨지 않는다 */
var NTC_RECENT = 6 * 3600000, NTC = { url: "" };
function ntcRead() { return S.get("ntc_rd", []) || []; }
function ntcMark(ids) { var rd = ntcRead(), ch = false; ids.forEach(function (i) { if (i && rd.indexOf(i) < 0) { rd.push(i); ch = true; } }); if (ch) S.put("ntc_rd", rd.slice(-80)); }
/* 기준선(ntc_base · 기기) = 이 기기에서 처음 공지를 확인한 순간 · 그 전에 나간 공지는 읽은 것으로(새 기기 · 앱 업데이트 직후 첫 로그인에 지난 공지가 몰려 뜨지 않게) */
function ntcBase() { var b = S.get("ntc_base", null); if (b === null) { b = Date.now() + (typeof sesOff === "function" ? sesOff() : 0); S.put("ntc_base", b); } return b; }
function ntcUnread() {
  var rd = ntcRead(), now = Date.now(), base = ntcBase();
  return (S.get("notices", []) || []).filter(function (n) { return n && n.id && n.ts > 0 && n.ts > base && now - n.ts < NTC_RECENT && rd.indexOf(n.id) < 0 && n.title !== CCHAT_CLOSE_T; })
    .sort(function (a, b) { return b.ts - a.ts; });
}
function ntcHold() {
  var a = document.activeElement, tg = a && a.tagName;
  if (tg === "TEXTAREA" || (tg === "INPUT" && !/^(button|range|checkbox|radio)$/i.test(a.type || ""))) return true;   /* 글을 쓰는 중 */
  if (/^(game_|quiz_play$|ideas$|survey$|type_site$)/.test(App.current || "")) return true;   /* 게임 · 퀴즈 풀기 · 아이디어 · 설문 화면 */
  if (App.current === "scan_q" && typeof SCQ !== "undefined" && SCQ.tab === "scan") return true;   /* 스캔 중 */
  if (el("qrVideo") || el("axsDet") || (window.AXTour && AXTour.isOpen && AXTour.isOpen())) return true;   /* 카메라 · 상세 시트 · 둘러보기 3D */
  return false;
}
function ntcCheck() {
  if (!S.get("user", null) || /^#(tv=|self)/i.test(location.hash)) return;
  var u = ntcUnread(); if (!u.length) return;
  notice({ key: "ntc:" + u[0].id, run: ntcOpen, hold: ntcHold });
}
function ntcOpen() {
  var u = ntcUnread(); if (!u.length) return;
  var n = u[0], more = u.length - 1, m = /https?:\/\/[^\s<>"']+/.exec(String(n.body || ""));
  NTC.url = m ? m[0] : "";
  ntcMark(u.map(function (x) { return x.id; }));   /* 한 번 띄우면 읽음(닫는 방법과 상관없이) · 나머지는 「더 보기」 목록에서 */
  sheetOpen({ id: "ntc", title: n.title || "공지",
    body: '<div class="axs-ntcs"><p class="axs-ntcs-c"><span class="axs-chip">공지</span><span class="ax-meta">' + esc(fmtTime(n.ts)) + "</span></p>" +
      (n.body ? '<p class="axs-ntcs-b">' + esc(n.body) + "</p>" : "") +
      (more ? '<button type="button" class="axs-ntcs-more" onclick="sheetClose(true); App.go(\'notices\')">공지 ' + more + "개 더 보기</button>" : "") + "</div>",
    go: NTC.url ? "ntcLink()" : "sheetClose()", goLbl: NTC.url ? "링크 열기" : "확인",
    keep: NTC.url ? "확인" : "", keepWeak: true, keepLast: true });
}
function ntcLink() { var u = NTC.url; sheetClose(true); if (/^https?:\/\//.test(u)) window.open(u, "_blank", "noopener"); }
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
function mySeg(g, b) { var go = function () { MY.seg = g === "rw" ? "rw" : "sched"; App.render(); }; if (b) { AXM.seg(b, go, { top: true, ok: function () { return App.current === "my"; } }); return; } go(); window.scrollTo(0, 0); }   /* 261009 b = 누른 칸 · 기준 모션(동작 모션 통일) */
/* v5.65 (사용자 261005 「내 보상은 경품과 스탬프 내보상 이거 세개는 유사」) 나의 보상 = 한 흐름 · 같은 숫자 · 같은 설명을 두 번 쓰지 않는다
   ① 스탬프 보상 레일(홈 · 스탬프 탭과 같은 railHtml · n / 6 · 3 룰렛 · 4 · 5 · 6 행운권 · 내 행운권 번호 · 경품 보기 입구 하나)
   ② 다음 보상까지 한 줄(스탬프 탭으로 · 6개를 다 모으면 없음 · 레일 「6개 모두 모았어요」와 겹치지 않게)
   ③ 받은 보상 카드(룰렛 1회권 · 행운권 · 참여상 · data-rw = 알림이 튕기는 자리 · 사용한 것은 아래 회색) · 행운권 장수 · 번호는 레일에 있어 카드에 다시 쓰지 않는다
   옛 경품 줄(axDest 「경품」) · 옛 내 보상 줄 · 옛 내 보상 화면 칩(사용 가능 · 사용 완료) · 경품 안내 입구(prizeGuideHtml)는 레일의 경품 보기 하나로 */
function myRewardHtml() {
  var n = stampCount(), items = rewItems(), list = items.filter(function (x) { return !x.used; }).concat(items.filter(function (x) { return x.used; }));
  var goal = n < STAMP_DENOM ? '<div class="axs-list">' + axDest(esc(stampGoalText(n)), "", lnkChev("스탬프 보기"), "App.tab('exp')") + "</div>" : "";
  var cards = list.map(function (x) {
    var big = x.k === "raffle" ? "" : x.big, why = x.k === "raffle" ? (lkCond() ? "17:00 Closing Speech 현장 추첨 · 17F 입구 QR 체크인" : "17:00 Closing Speech 현장 추첨 · 경품은 따로 전달") : x.why;   /* v5.92 (사용자 261006 「럭키드로우에서 체크인 요소는 일단은 없애 놓자」) 참석 조건 OFF = 체크인 문구 없음 */
    var tt = '<div class="ax-stack-tight"><h2 class="ax-section-title">' + x.nm + "</h2>" + (big ? '<p class="axs-big">' + big + "</p>" : "") + "</div>";
    return '<section class="ax-card" data-rw="' + x.k + '"><span class="axs-chip axs-self' + (x.off ? " off" : x.cc != null ? x.cc : " ok") + '">' + x.chip + "</span>" +
      (x.pic ? '<div class="axs-rwhd">' + prizePhHtml(x.pic) + tt + "</div>" : tt) +   /* v5.04 참여상 당첨 = 상품 사진 */
      '<div class="axs-hr"></div><p class="ax-description">' + segHtml(why) + "</p>" +
      (x.go ? '<button type="button" class="ax-button ax-button-weak" onclick="' + x.go + '">' + (x.btn || "사용 방법 보기") + "</button>" : "") + "</section>";
  }).join("");
  return '<section class="axs-sec axs-myrw">' + railHtml(n, false, null, false) + "</section>" + goal + kitMyRowHtml() +   /* 261006 키트 사이즈 · 명단 사번만 */
    (cards ? '<section class="ax-stack-tight axs-gap12"><h2 class="ax-section-title">받은 보상</h2>' + cards + "</section>" : "");
}
/* 받은 보상 · 룰렛 1회권(3개) · 행운권(4개부터 자동) · 참여상 · 계산은 기존 상수·함수 그대로(REWARD_CAP · raffleTickets) */
function rewItems() {
  var n = stampCount(), used = !!S.get("roulette_used", false), out0 = !!S.get("roulette_out", false), t = raffleTickets(n), items = [];
  if (n >= 3) items.push({ k: "roulette", used: used, chip: used ? "사용 완료" : out0 ? "룰렛 소진" : "사용 가능", off: used || out0, nm: "룰렛 1회권", big: "1회",
    why: "1F EVENT 룰렛 · 내 QR 제시", go: "ppRouletteOpen()" });
  if (t) items.push({ k: "raffle", used: false, chip: "자동 발급", off: false, nm: "행운권", big: t + "장", why: "스탬프 " + Math.min(n, REWARD_CAP) + "개 · 17:00 Closing Speech 현장 추첨", go: "ppDrawOpen()" });   /* v4.79 현장 추첨 안내는 추첨 안내 모달에 · v5.04 옛 「결과는 행사 후 개별 안내」 폐기 */
  /* v5.90 (261006 경품 기획 변경 · 계약.md 5.1) 선착순 참여상 · 서버 my.fcfs 가 있을 때만(없으면 카드 없음) · 상태 got · done · full · void · closed */
  var f = fcfsMy(), fx = fxGet(), cap = fx ? fx.cap : 200;
  if (fcfsReady(f)) items.push({ k: "fin", used: false, chip: f.st === "got" && f.rk > 0 ? f.rk + "번" : fcfsLeftN() ? "남은 " + fcfsLeftN() : "선착순", nm: "선착순 참여상", big: "1개", why: fcfsAt("1F 주차장 체크인존"), go: "fcfsGotOpen(true)", btn: "받는 곳 보기" });   /* 261016 (사용자) 달성순 · chip = 선착순 번호(서버 my.fcfs.rk) · 옛 수령순 문구 삭제 */   /* v5.98 (사용자 261006 밤 「받기 선착순」) 예약 없음 · 「자격」 말 없음 */   /* v5.97 (사용자 261006 밤) 장소 「1F 주차장 체크인존」 · 버튼 = 수령 안내 시트 */
  if (f && f.st === "done") items.push({ k: "fin", used: true, chip: "수령 완료", off: true, nm: "선착순 참여상", big: "", why: "무선 무드등 가습기" });
  if (f && (f.st === "full" || f.st === "out")) items.push({ k: "fin", used: true, chip: "마감", off: true, nm: "선착순 참여상", big: "", why: cap + "개 모두 나갔어요 · 6개 달성은 행운권 3장" });
  if (f && f.st === "void") items.push({ k: "fin", used: true, chip: "취소", off: true, nm: "선착순 참여상", big: "", why: "받을 수 없어요 · 운영진 문의" });
  if (f && f.st === "closed") items.push({ k: "fin", used: true, chip: "마감", off: true, nm: "선착순 참여상", big: "", why: ((fxGet() || {}).cut || "17:00") + " 지급 마감" });
  /* v5.90 행운권 7등 랜덤 굿즈 · 서버 my.lk7 이 있고 행운권 보유(in)일 때 · 추첨 전 「추첨 대기」
     v5.92 (사용자 261006 「7등 랜덤 굿즈의 경우에는 정말 랜덤으로」) 고정 세트 없음 · 룰렛 남은 경품에서 무작위 · 수는 PRIZES.lk7 한 곳 */
  var l7 = S.get("lk7", null);   /* v6.25 7등 수량 = 「수량 추후 공개」(사용자 261007 · 남은 경품으로 꾸려서 수가 정해지지 않았다) · 수는 어디에도 쓰지 않는다 */
  if (l7 && l7.in && l7.ph !== "done") items.push({ k: "lk7", used: false, chip: "추첨 대기", cc: "", nm: "랜덤 굿즈", big: "", why: "행사 종료 후 행운권 중 랜덤 선정 후 행랑 발송" });   /* v7.61 (사용자 261017) 7등 문장 = 경품 시트 카드와 같은 한 줄 */
  /* 261017 (사용자 확정) 추첨 뒤 「당첨」 칩 걷음 · 서버도 w 를 보내지 않는다 */
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
    { rk: "1등", nm: "텀블러", q: 50, img: "rl1_tumbler_v2" },
    { rk: "2등", nm: "커피 + 키캡 키링", q: 140, img: "rl2_coffee_v2", img2: "rl2_keyring_v2" },   /* v5.90 새 인쇄본 140 · 210 · 210 · 340 */   /* v5.18 합성 사진 대신 두 장 나란히(사용자 261003) */
    { rk: "3등", nm: "컵받침", q: 210, img: "rl3_coaster_v2" },
    { rk: "4등", nm: "판스티커", q: 210, img: "rl4_sticker_v2" },
    { rk: "5등", nm: "볼펜", q: 340, img: "rl5_pen_v2", tall: 1 }] },   /* v5.33 tall = 넓은 칸에서도 자르지 않는다(사선 볼펜 사진) */
  draw: { unit: "명", list: [
    { rk: "1등", nm: "아이패드", q: 1, img: "ld1_ipad" },
    { rk: "2등", nm: "신라호텔 파크뷰 뷔페 식사권 2매", q: 1, img: "ld2_shilla" },
    { rk: "3등", nm: "미닉스 음식물 처리기", q: 1, img: "ld3_minix" },
    { rk: "4등", nm: "에어팟 5", q: 2, img: "ld4_airpods5" },   /* v7.61 (사용자 261017) 이름 4 → 5 · v7.62 사진 = 에어팟 5 사진(ld4_airpods5.webp 800 정사각 · 옛 ld4_airpods.webp 는 무대 draw/ 가 써서 남김) */
    { rk: "5등", nm: "풀리오 종아리 마사지기", q: 2, img: "ld5_pulio" },
    { rk: "6등", nm: "현대백화점 상품권 10만원", q: 3, img: "ld6_hyundai" }] },
  /* v5.90 fin 칸 = 선착순 참여상(키는 그대로 · 구역 id pz-fin) · 7등 랜덤 굿즈(lk7 · v5.92 대표 그림 한 장 lk7_random_v2 = 룰렛 _v2 사진 여섯 장을 묶은 것 · 고정 세트 없음) · 아이디어왕(idea · AI 구독권 카드 그림 idea1 ~ 3 · 사용자 261006 「가」 · 바꿀 때는 파일만) */
  fin: { unit: "개", list: [
    { rk: "", nm: "무선 무드등 가습기", q: 200, img: "fin_humidifier_v2" }] },
  lk7: { unit: "명", list: [
    { rk: "7등", nm: "랜덤 굿즈", sub: "행사 종료 후 행운권 중 랜덤 선정 후 행랑 발송", qt: "무작위 경품", img: "lk7_random_v2" }] },   /* v7.61 (사용자 261017) 수량 자리 = 「무작위 경품」 · 부제 = 받는 방법 한 문장 */
  idea: { unit: "명", list: [
    { rk: "1등", nm: "AI 구독권 6개월", q: 1, img: "idea1" },
    { rk: "2등", nm: "AI 구독권 3개월", q: 2, img: "idea2" },
    { rk: "3등", nm: "AI 구독권 1개월", q: 3, img: "idea3" }] },
  /* v5.05 1F 타자왕 1~3위(17:00 Outro 시상) · v5.09 (261003 사용자 확정) 새 상품 · 사진 = 제조사 공식 컷 */
  type: { unit: "명", list: [
    { rk: "1등", nm: "기계식 키보드", sub: "체리 MX Board 10.0 Low Profile", q: 1, img: "ty1_cherry_lp10", flat: 1 },   /* v5.18 flat = 사진 2:1(위아래 여백 자르기) */
    { rk: "2등", nm: "마우스", sub: "로지텍 MX Master 4", q: 1, img: "ty2_mxmaster4" },
    { rk: "3등", nm: "기계식 키보드", sub: "AULA F108 Pro", q: 1, img: "ty3_aula" },
    { rk: "4~10등", nm: "데스크 매트", sub: "엑셀 단축키 · 그레이 · 80 x 40cm", q: 7, img: "ty4_deskmat", img2: "ty4_deskmat_zoom" }] }   /* 261016 (사용자 확정) 4~10등 7명 = 엑셀 단축키 데스크 매트 그레이 800 x 400 x 5mm · 사진 두 장 나란히 = 사용 모습(img) + 단축키 글씨 확대(img2) · 출처 오늘의집 디지털벤투스 엑셀 단축키 장패드 그레이 상세 사진 */
};
/* 커피 · 간식(18F 커피챗 · 1F DAP 과제상담) · 커피 = 페트병(우리 스티커 목업) · 간식 = 달곰 베이크샵 휘낭시에 · 스콘(블로그 사진 합성 · 임시) · 바꿀 때는 파일만 */
/* v5.90 (261006) 상담 · 커피챗 지급 = 커피 · 쿠키 · 노트 · 볼펜 · 커피 = 룰렛 2등과 같은 페트병 두 병(콜드브루 · 디카페인) · 쿠키 · 노트 · 볼펜 사진은 아직 없어 아이콘 칸(ico · 사진이 오면 img 만 채운다) */
var TREATS = [
  { nm: "커피", sub: "콜드브루 · 디카페인", img: "cc_coffee_v2", img2: "cc_decaf_v2" },
  { nm: "쿠키", sub: "휘낭시에 · 쿠키", img: "cc_cookie" },   /* 261008 사용자 사진(달곰 휘낭시에 · 사용자 「자르지 말고 그대로」 · 원본 전체) · 부제 「광화문 달곰 베이크샵」 → 「휘낭시에 · 쿠키」 */
  { nm: "노트", sub: "", img: "cc_note" },   /* 261008 사용자 사진(ME to WE 도트 · AX Festival 2026 블랙 노트) · 옛 아이콘 칸(ico note) 대체 */
  { nm: "볼펜", sub: "", img: "rl5_pen_v2", fit: 1 }   /* v6.07 (사용자 261007 「볼펜은 룰렛의 볼펜과 같은 거야」) 룰렛 5등 사진 · fit = 자르지 않는다(사선 볼펜) */
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
  return '<span class="axs-ph' + (p.img2 ? " two" : "") + (p.fit ? " fit" : "") + '" aria-hidden="true">' + im(p.img) + (p.img2 ? im(p.img2) : "") +   /* v5.18 img2 = 사진 두 장 나란히 */
    (PRIZE_SAMPLE && p.s !== 0 ? '<span class="smp">샘플</span>' : "") + "</span>";
}
/* v6.95 룰렛 아래 안내 줄 · 한 곳(둘러보기 경품 카드 · TOUR_HOST.roulette) · 상태별 문구는 사용자 결정 대기(261011) · 지금은 네 상태 모두 같은 한 줄
 *   상태 = rouletteState(): lt3(스탬프 3개 미만) · ready(3개 이상 · 아직 안 씀) · used(사용 완료) · out(룰렛 소진) · 문구를 바꿀 때는 ROUL_NEXT 만 고친다 */
var ROUL_NEXT = { lt3: "1층에서 룰렛을 체험하세요.", ready: "1층에서 룰렛을 체험하세요.", used: "1층에서 룰렛을 체험하세요.", out: "1층에서 룰렛을 체험하세요." };
function rouletteState() { return S.get("roulette_used", false) ? "used" : S.get("roulette_out", false) ? "out" : stampCount() >= 3 ? "ready" : "lt3"; }
function rouletteNextLine() { return ROUL_NEXT[rouletteState()] || ROUL_NEXT.lt3; }
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
  cup: SICO + '<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20h7M9.5 17h5"/></svg>',
  cam: SICO + '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.5"/></svg>',   /* v7.54 EVENT 선착순 상자 · 포토부스(같은 선 굵기 SICO) */
  coffee: SICO + '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5V6M12 3.5V6"/></svg>',   /* v7.54 EVENT 선착순 상자 · 오전 커피 */
  idea: STAMP_ICONS.p5, talk: STAMP_ICONS.qz, doc: STAMP_ICONS.sv, time: App.ICONS.guide_time   /* v6.83 (묶음 16) 구역 상세 「참여 전 확인」 상자 · 이미 있는 그림(아이디어 전구 · 말풍선 · 문서 · 시계) 그대로 */
};
/* v5.90 (261006 경품 기획 변경 · 계약.md 5절) 행운권 받으려면 줄2 = 참석 조건(sync lkcond) 따라 · 7등 · 선착순 참여상 · 아이디어왕 구역 · 서버 필드가 없으면(on) 구역을 그리지 않는다 */
var PZ_SEC = [
  { k: "draw", en: "LUCKY DRAW", t: "행운권 추첨", need: function () { return [["stamp", "스탬프 4개부터 행운권", "6개면 3장"], lkCond() ? ["qr", "Closing Speech 참석 · 17F 입구 QR 체크인", "16:40부터 · 17:00 현장 추첨"] : ["cup", "17F Closing Speech 현장 추첨", "17:00 · 경품은 따로 전달"]]; } },
  { k: "lk7", en: "7TH PRIZE", t: "행운권 7등 · 랜덤 굿즈", on: function () { return !!S.get("lk7", null); }, need: function () { return [["stamp", "스탬프 4개 이상(행운권 보유)", "1~6등 당첨자는 제외"], ["box", "행사 뒤 추첨", "행사 종료 후 행운권 중 랜덤 선정 후 행랑 발송"]]; } },   /* v5.92 정말 랜덤(사용자 261006) */
  { k: "fin", en: "FIRST COME", t: "선착순 참여상", on: function () { return !!fxGet(); }, need: function () { var x = fxGet() || {}; var st = fcfsStartHm(); return [["stamp", "스탬프 6개를 모은 순서 " + (x.cap || 200) + "명", ""], ["box", "1F 주차장 체크인존 · 내 QR 제시", (st ? st + "~" : "") + (x.cut || "17:00") + " · 못 받으면 행사 뒤 발송"]]; }   /* 261016 (사용자) 달성순 1~200 · 교환 = 당일 체크인존(17:00 지급 마감) · 못 받은 사람 발송 */   /* v6.83 「E 창구」 뺌(사용자 261009) */   /* v5.98 받기 선착순 */, qt: function () { return fcfsQtyTxt(); } },   /* v5.97 (사용자 261006 밤) 남은 수량은 상품 제목 오른쪽 한 곳(fcfsQtyTxt) · 상자 줄 삭제 · 「당일 못 받으면 발송」 줄 삭제(「선착순인데 당일 못 받는 건 말이 안 되잖아」) */
  { k: "roulette", en: "ROULETTE", t: "룰렛", need: function () { return [["stamp", "스탬프 3개면 룰렛 1회", "1인 1회"], ["qr", "1F EVENT 룰렛 부스에서 내 QR 제시", S.get("rcut", "") ? "룰렛 " + S.get("rcut", "") + " 마감" : ""]]; } },
  { k: "idea", en: "IDEA KING", t: "아이디어왕", r3: 1, on: function () { return !!S.get("idea_pub", null); }, need: function () { var ip = S.get("idea_pub", null) || {}; return [["stamp", (ip.cut || "16:00") + "까지 아이디어 한 줄", "AX 라운지 · 커피챗 · 앱 어느 경로든"], ["cup", "Closing Speech에서 시상", ideaKingN() + "명 · AI 구독권"]]; } },
  { k: "type", en: "TYPING KING", t: "1F 타자왕 1~10위", sep: 1, need: [["key", "1F 타자왕 노트북에서 도전", ""], ["cup", "1F 현장 기록 1~10위", "17:00 마감 · Closing Speech에서 순위 발표"]], go: ["실시간 순위 보기", "typeSiteRankGo()"] }   /* v5.18 맨 아래 · 선으로 나눔 · 순위판 입구 = 블록 맨 아래(v5.73) · v5.97 Outro 시상 보조 줄 삭제(사용자 261006 밤 「투머치」) */   /* v7.61 (사용자 261017) 1~10위 · 덧붙임 = 순위 발표 · 옛 둘째 줄(시상 자리)과 별개 표시 걷음 */
];
/* 「받으려면」 박스 · 연주황 면(brandSoft) · 아이콘 주황 · 굵은 글 ink · 옅은 글 body · 읽어 주기 = 「받으려면」 + 줄마다 */
/* 261008 상자 공용(사용자 「참여 전 확인 아래 부분을 행운권 추첨의 받으려면 부분처럼 정비 · 정돈되지 않은 부분들도」) · 조건 · 방법 · 받는 법 안내 = 이 상자 하나 · 같은 CSS(.axs-pz-need)
   쓰는 곳 = 경품 시트 구역 · AWS · MS 강연 상세 · Closing Speech 현장 추첨 · AX PLAY 체험 · 룰렛 1회권 · 행운권 · 선착순 참여상 팝업 · (기념품 옷 받는 방법은 검사 샌드박스 때문에 같은 틀을 그 함수 안에 적는다)
   k = 위 작은 라벨(주황) · aria = 읽어 주기 이름 · rows = [아이콘(PZ_ICO), 굵은 한 줄(할 일), 옅은 한 줄(덧붙임 · 없으면 빈 값)] */
function needBoxHtml(k, aria, rows) {
  return '<div class="axs-pz-need" role="group" aria-label="' + esc(aria) + '"><p class="k" aria-hidden="true">' + esc(k) + "</p><ul>" + rows.map(function (r) {
    return '<li><span class="i" aria-hidden="true">' + (PZ_ICO[r[0]] || "") + '</span><span class="x"><b>' + (r[3] || segHtml(esc(r[1]))) + "</b>" + (r[2] ? "<span>" + segHtml(esc(r[2])) + "</span>" : "") + "</span></li>";
  }).join("") + "</ul></div>";
}
/* 경품 시트 구역의 받으려면 줄 그대로(강연 상세 · 팝업이 같은 줄을 쓴다 · 문구가 한 곳) */
function pzNeedRows(k) { var s = PZ_SEC.filter(function (x) { return x.k === k; })[0]; return !s ? [] : typeof s.need === "function" ? s.need() : s.need; }
function pzNeedHtml(s) {
  var need = typeof s.need === "function" ? s.need() : s.need;   /* v5.90 서버 값(참석 조건 · 남은 수량 · 마감 시각)을 그릴 때 읽는다 */
  return needBoxHtml("받으려면", s.t + " 받으려면", need);
}
var PZ = { t: 0 };
var PZ_THUMB = ["ld1_ipad", "fin_humidifier_v2", "rl1_tumbler_v2"];   /* 입구 사진 3장 = assets/prize/t_<img>.webp(96px) */
function prizeGo(k) { PROG.anchor = k ? "pz-" + k : ""; PZ.t = Date.now(); App.go("prizes"); }
function prizeJump(k) {
  var a = el("pz-" + k); if (!a) return;
  AXM.scrollTo(a, { block: "start" });   /* 261009 부드럽게 + 도착 떠오름(동작 모션 통일 · 움직임 줄이기 = 바로) */
}
function prizeGoHtml(k) {
  var th = PZ_THUMB.map(function (n) { return '<img src="' + PRIZE_DIR + "t_" + n + '.webp" alt="" width="96" height="96" loading="lazy" decoding="async" onerror="this.remove()">'; }).join("");
  return '<button type="button" class="axs-pzgo" onclick="event.stopPropagation(); prizeGo(' + (k ? "'" + k + "'" : "") + ')"><span class="th" aria-hidden="true">' + th + "</span>" +
    '<span class="tx"><b>경품 보기</b><span>' + segHtml("아이패드 · 가습기 · 텀블러") + "</span></span>" + CHEV_SVG + "</button>";
}
function pzCard(p, unit, cls, qt) {
  var im = function (n) { return '<img src="' + PRIZE_DIR + n + '.webp" alt="" width="600" height="600" loading="lazy" decoding="async" onerror="this.remove()">'; };
  var ph = '<span class="axs-pz-ph' + (p.img2 ? " two" : "") + '">' + (p.img ? im(p.img) + (p.img2 ? im(p.img2) : "") +
    (PRIZE_SAMPLE && p.s !== 0 ? '<span class="smp">샘플</span>' : "") : "") + "</span>";
  return '<article class="axs-pz-c' + cls + (p.flat ? " flat" : "") + (p.tall ? " tall" : "") + '"><div class="tx">' + (p.rk ? '<span class="rk">' + p.rk + "</span>" : "") +
    "<b>" + esc(p.nm) + (p.sub ? "<small>" + esc(p.sub) + "</small>" : "") + '</b><span class="q">' + esc(qt || p.qt || p.q.toLocaleString() + unit) + "</span></div>" + ph + "</article>";   /* v5.97 qt = 구역이 준 수량 글(선착순 남은 수량) */   /* v5.33 글 줄 먼저 · 사진 아래 */
}
/* v5.97 (사용자 261006 밤 「3등 이상하게 편집 · 한 줄에」) 같은 그림 카드 3장 = 한 줄 3칸 · 같은 크기 · 그림 아래 「1등 · 1명」 한 줄(개월은 카드 그림 알약)
   v6.07 함수로 뺐다 · 경품 시트 아이디어왕 구역과 아이디어 입력 화면(ideaPrizeHtml · 작게)이 같은 그림 · 같은 모양을 쓴다 */
function pzR3Html(k) {
  var g = PRIZES[k]; if (!g) return "";
  return '<div class="axs-pz-r3">' + g.list.map(function (p) {
    return '<article class="axs-pz-c r3" aria-label="' + esc(p.rk + " " + p.nm + " " + p.q + g.unit) + '">' + '<span class="axs-pz-ph">' + (p.img ? '<img src="' + PRIZE_DIR + p.img + '.webp" alt="" width="600" height="600" loading="lazy" decoding="async" onerror="this.remove()">' : "") + "</span>" +
      '<p class="cp" aria-hidden="true"><b>' + p.rk + "</b> · " + p.q + g.unit + "</p></article>";
  }).join("") + "</div>";
}
/* 261014 (사용자 확정 「룰렛 · 행운권 아이콘을 누르면 경품 시트 그 칸으로 · 옛 요약 시트의 내 진행 칩을 여기로」) 구역 머리 칩 = 내 진행 한 줄(룰렛 · 행운권 · 선착순 참여상만 · 그 밖의 구역은 칩 없음)
   룰렛 = 스탬프 n / 3 · 사용 가능 · 1인 1회 · 사용 완료 · 룰렛 소진(마감 시각) / 행운권 = 지금 N장 / 선착순 참여상 = 스탬프 n / 6 · 받을 수 있어요(그날 시작 전 = 10:30부터 받을 수 있어요) · 수령 완료 · 마감 · 취소
   칩 모양 = 옛 요약 시트와 같은 .axs-chip(brandSoft 면 · 못 받은 상태 .off 회색) */
function pzChipHtml(k) {
  var n = Math.min(REWARD_CAP, stampCount()), c = null;
  if (k === "roulette") {
    c = S.get("roulette_used", false) ? ["사용 완료", 1] : S.get("roulette_out", false) ? [roulCut() ? "룰렛 " + roulCutHm() + " 마감" : "룰렛 소진", 1] : n >= 3 ? ["사용 가능 · 1인 1회", 0] : ["스탬프 " + n + " / 3", 1];
  } else if (k === "draw") {
    var t = raffleTickets(n); c = ["지금 " + t + "장", t ? 0 : 1];
  } else if (k === "fin") {
    var f = fcfsMy();
    c = fcfsReady(f) ? [fcfsPre() ? fcfsStartHm() + "부터 받을 수 있어요" : "받을 수 있어요", 0] : f && f.st === "done" ? ["수령 완료", 1] : f && f.st === "void" ? ["취소", 1] : fcfsGone(f) ? ["마감", 1] : n < STAMP_DENOM ? ["스탬프 " + n + " / " + STAMP_DENOM, 1] : null;
  }
  return c ? '<div class="axs-chiprow axs-pz-chip"><span class="axs-chip' + (c[1] ? " off" : "") + '">' + esc(c[0]) + "</span></div>" : "";
}
/* 261014 (사용자 「권장대로」) 룰렛 칸 = 쓸 수 있을 때만(스탬프 3개 이상 · 아직 안 씀 · 소진 · 마감 전) 받으려면 상자 아래 「내 QR 보여주기」 · 내 QR 화면(qrPanelOpen mine) · 옛 룰렛 1회권 요약 시트에 있던 단추 */
function pzQrBtnHtml(k) {
  if (k !== "roulette" || stampCount() < 3 || S.get("roulette_used", false) || S.get("roulette_out", false) || roulCut()) return "";
  return '<button type="button" class="ax-button axs-pz-qr" onclick="qrPanelOpen(\'mine\')">내 QR 보여주기</button>';
}
function prizeSecHtml(s) {
  var g = PRIZES[s.k]; if (!g || (s.on && !s.on())) return "";
  var head = '<header class="axs-pz-sh" id="pz-' + s.k + '"><p class="en" aria-hidden="true">' + s.en + "</p><h2>" + s.t + "</h2>" + pzChipHtml(s.k) + "</header>" + pzNeedHtml(s) + pzQrBtnHtml(s.k);   /* 261014 구역 머리 = 제목 아래 내 진행 칩 */   /* v5.74 머리 = 영문 장식 · 제목 · 「받으려면」 박스 */
  var go = s.go ? '<button type="button" class="ax-button ax-button-weak" onclick="' + s.go[1] + '">' + s.go[0] + "</button>" : "";   /* v5.73 (사용자 261005 「실시간 순위는 가장 아래 위치에 있어야 할 것 같아」) 구역 버튼(타자왕 순위판) = 블록 맨 아래(경품 사진 · 이름 · 안내 다음) · 옛 v5.18 = 머리 바로 아래 */
  var hn = PZ_HERO[s.k] || 0, rest = g.list.slice(hn), solo = rest.filter(function (p) { return !p.img2; }).length, k = 0;
  if (s.r3) return '<section class="axs-pz-sec' + (s.sep ? " sep" : "") + '">' + head + pzR3Html(s.k) + go + "</section>";   /* v6.07 카드 3장 = pzR3Html 한 곳(아이디어 입력 화면 시상 묶음이 같은 함수를 부른다) */
  var body = g.list.slice(0, hn).map(function (p) { return pzCard(p, g.unit, " hero", s.qt && s.qt()); }).join("") +
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
  return '<section class="axs-pz-cv">' + (noHead ? "" : '<p class="ey">AX Festival 2026</p><h1 class="ttl">경품 보기</h1>') +   /* v5.69 시트 = 제목은 시트 머리 */
    '<div class="now"><div class="tx"><p class="k">지금 내 스탬프</p><p class="nx">' + pzNextTxt(n) + '</p></div><p class="n"><b>' + n + "</b>개</p></div>" +
    '<div class="stp" role="img" aria-label="스탬프 ' + n + " / " + STAMP_DENOM + '"><span class="ln" aria-hidden="true"></span><span class="fl" aria-hidden="true" style="width:' + fill + '"></span>' + dots + "</div>" +
    '<div class="cds">' + cards + "</div></section>";
}
/* v5.69 경품 시트(detPaint · 라우트 prizes) · 제목 = 시트 머리(v5.79 짧은 이름 = 이 제목 그대로 · 본문 첫 줄 제목 없음) · 본문 = 표지(지금 내 스탬프 · 1~6 · 단계 카드) + 구역 · 버튼 없음(읽기) · 구역 바로 가기(prizeGo k)는 시트 본문 스크롤 */
function prizeSheet() {
  return { name: "경품 보기", body: '<div class="axs-pz' + (Date.now() - PZ.t < 900 ? " in" : "") + '">' + prizeCoverHtml(true) + PZ_SEC.map(prizeSecHtml).join("") + "</div>" };
}
function prizePosterHtml() {
  return '<div class="axs-pz' + (Date.now() - PZ.t < 900 ? " in" : "") + '">' + prizeCoverHtml() + PZ_SEC.map(prizeSecHtml).join("") + "</div>";
}
/* v5.90 (261006 경품 기획 변경) 옛 완주 경품 추첨 앱 함수(finLate · finState · finCountTxt · rfxFinLine · finInfoOpen)는 지웠다 · 서버가 완주추첨_사용 OFF 면 my.fin 을 보내지 않는다 · 되살리기 = 루트 「정리 기록.md」 v5.90 절
   선착순 참여상 = 서버 sync my.fcfs { st, cnt, need, at, ship, ck } · pub.fx { on, cap, left(-1 = 숨김), cut, show } · 없으면(옛 서버) 아무것도 그리지 않는다
   261016 (사용자 「6개 스탬프 완주가 더 우선」) 달성순 = 6개째 순간 순번 1~200(서버 my.fcfs.rk · got · done 일 때만) · 201번째부터 full = 「선착순 마감」만(번호 없음) · 옛 수령순 문구 삭제 */
function fcfsMy() { var f = S.get("fcfs", null); return f && typeof f === "object" && f.st && f.st !== "off" ? f : null; }
/* v5.98 (사용자 261006 밤 「참여상 선착순은 받기 선착순이어야지」) 서버 수령순 = ready(6개 · 아직 · 남음) · out(소진) · 옛 달성순 = got · full 도 같은 뜻으로 읽는다 */
function fcfsReady(f) { return !!f && (f.st === "ready" || f.st === "got"); }
/* 261016 달성순 번호 = 서버 my.fcfs.rk(got 일 때 1 ~ 수량) · 옛 서버 · 수령순 = 없음(지금 문구) · 함수마다 「f.st === "got" && f.rk > 0」로 읽는다(검사가 함수를 떼어 실행) */
function fcfsGone(f) { return !!f && (f.st === "out" || f.st === "full" || f.st === "closed"); }
function fcfsLeftN() { var x = fxGet(); return x && x.left > 0 ? x.left : 0; }
function fxGet() { var x = S.get("fx", null); return x && typeof x === "object" && x.on ? x : null; }
function fcfsOpen() { var x = fxGet(); return !!x && x.left !== 0 && !fcfsLate(); }   /* 남아 있고 마감 전 */
function fcfsLate() {
  if (typeof betaFree === "function" && betaFree()) return false;   /* 261014 클로즈 베타 = 마감 시각 없음 */
  var x = fxGet(), cut = String((x && x.cut) || "").split(":");
  if (cut.length < 2) return false;
  var d = appNow(true);
  var ymd = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();   /* v7.47 10/26 마감 시각 뒤 + 그 다음 날부터(옛: 26일 당일만 → 10/27 에 다시 「10:30부터 1F」) */
  return ymd > 20261026 || (ymd === 20261026 && d.getHours() * 60 + d.getMinutes() >= (+cut[0]) * 60 + (+cut[1]));
}
/* v5.97 (사용자 261006 밤) 경품 시트 선착순 상품 제목 오른쪽 = 남은 수량 · 숫자공개 규칙(ALL · LOW · OFF → left -1 = 숨김)을 따른다 · 0 · 마감 시각 뒤 = 「마감」 · 숨김 = 총수량 */
function fcfsQtyTxt() { var x = fxGet(); if (!x) return ""; if (x.left === 0 || fcfsLate()) return "마감"; return x.left > 0 ? "남은 " + x.left + " / " + x.cap : ""; }
/* 6개 레일 캡션 뒤 · 수령 자격 · 수령 완료 · 마감 · 짧은 칸 캡션이라 「참여상」(v5.97 D3 · 그 밖은 「선착순 참여상」) */
function fcfsCapTxt() { var f = fcfsMy(); return !f ? "" : fcfsReady(f) ? (f.st === "got" && f.rk > 0 ? " · 선착순 " + f.rk + "번" : " · 참여상 받을 수 있어요") : f.st === "done" ? " · 참여상 수령 완료" : fcfsGone(f) ? " · 선착순 마감" : ""; }   /* 261016 달성순 번호 · 201번째부터 「선착순 마감」 */
/* 남은 수량 한 줄 · 6개 전 · 서버가 숫자를 숨기면(-1) 안 그린다 · 0 = 마감 */
function fcfsLeftHtml(n) {
  var x = fxGet(); if (!x || n >= STAMP_DENOM || x.left < 0) return "";
  return '<p class="cap fx">' + (x.left === 0 ? "선착순 참여상 · 마감" : "선착순 참여상 · 남은 " + x.left + " / " + x.cap) + "</p>";
}
/* v5.96 (사용자 261006 밤 「디자인이 이상하다」 · 메인 결정) 스탬프 탭 · 나의 보상 레일 = 6번 칸(3장) 라벨 아래 작은 두 줄 「선착순」 / 상태 · 옛 왼쪽 한 줄(fcfsLeftHtml)은 홈 레일에만
   상태 = 수령 자격(got) · 수령 완료(done) · 마감(full · closed · 남은 0 · 마감 시각 뒤) · 남은 n / cap · 숫자를 숨기면(left -1 · 숫자공개 LOW 임박 전 · OFF) 「선착순」만 · 취소(void)는 지금 줄처럼 그리지 않는다 · 꺼짐(fx 없음) 없음 */
function fcfsRailTxt() {
  var x = fxGet(); if (!x) return null;
  if (typeof evPreDay === "function" && evPreDay()) return null;   /* v7.47 (261016 레드팀 B2) 행사 전 = 선착순 줄 없음(서버 fx.on 은 설정 ON/OFF 라 행사 전에도 온다) */
  var f = fcfsMy(), st = f ? f.st : "";
  if (st === "void") return null;
  if (st === "done") return "받음";
  if (f && f.st === "got" && f.rk > 0) return f.rk + "번";   /* v7.57 (사용자 261017 S4) 17:00 지급 마감 뒤 미수령 = 칩 「N번」 + 다음 보상 한 줄 「행사 뒤 발송 · 17:00 지급 마감」(옛 v7.47 「N번 · 발송」) */   /* 261016 (사용자) 달성순 · 행운권 자리 옆 「선착순 N번」 · 남은 수 · 마감 시각보다 먼저(번호가 있으면 받을 사람) */
  if (st === "full" || st === "out" || st === "closed" || x.left === 0 || fcfsLate()) return "마감";   /* 261016 201번째부터(full) = 「선착순 마감」만 */   /* v5.98 ready = 「남은 N」 주황(fcfsRailHtml) · 「수령 자격」 없음 */
  return x.left > 0 ? "남은 " + x.left : "";   /* v5.97 (사용자 261006 밤 「210 / 210 헷갈림」) 남은 수만 */
}
/* v5.97 (사용자 261006 밤 「선착순과 3장이 색도 비슷해 구분이 안 되고 줄 정렬도 안 맞는다」) 6번 칸 「3장」 아래 6px · 작은 알약 한 줄 · 무채색(「선착순」 회색 · 상태 굵은 검정) · got 만 주황 · 가운데 = 6번 노드 축(넘치면 오른쪽 끝 = 노드 오른쪽 끝) */
function fcfsRailHtml() { var t = fcfsRailTxt(), f = fcfsMy(); return t == null ? "" : '<span class="fx6' + (f && (f.st === "ready" || f.st === "got") && t !== "마감" ? " got" : "") + '"><span class="k">선착순</span>' + (t ? "<b>" + t + "</b>" : "") + "</span>"; }
/* 6개 다 모은 캡션 뒤 · 스탬프 탭(두 줄이 상태를 말한다) = 받을 곳만 */
/* 261007 (사용자 「가습기 선착순 교환은 체크인이 마무리되는 10시 30분부터 열자 · 혼선 없도록」) 지급 시작 시각(서버 my.fcfs start · fx start · 옛 서버 = 없음 · 문구 그대로) · pre = 그날 시작 전
   fcfsAt = 받는 곳 글 「1F 주차장 체크인존」 → 「10:30부터 1F 주차장 체크인존」(첫 한 곳 · v6.83 사용자 261009 「(E 창구) 이 부분 삭제」 · 창구 이름은 스태프 화면에만) */
function fcfsStartHm() { var f = fcfsMy(), x = fxGet(); return String((f && f.start) || (x && x.start) || ""); }
function fcfsPre() { var f = fcfsMy(); return !!(f && f.pre); }
function fcfsAt(t) { var st = fcfsStartHm(); return st ? String(t).replace("1F 주차장 체크인존", st + "부터 1F 주차장 체크인존") : t; }
function fcfsAtL(L) { return L.map(function (r) { return [r[0], fcfsAt(r[1]), r[2]]; }); }
function fcfsCapWhere() { var f = fcfsMy(); return !fcfsReady(f) ? "" : f.st === "got" && f.rk > 0 ? " · 선착순 " + f.rk + "번" + (fcfsLate() ? " · 행사 뒤 발송" : fcfsAt(" · 1F 주차장 체크인존")) : fcfsAt(" · 1F 주차장 체크인존에서 수령"); }   /* 261016 「6개 모두 모았어요 · 선착순 N번」 + 줄 바꿈 「· 10:30부터 1F 주차장 체크인존」(segHtml) */
/* 6번째 스탬프 상자 팝업 한 줄 */
function fcfsPopLine() {
  if (raffleTickets(Math.min(REWARD_CAP, stampCount())) < RAFFLE_MAX) return "";
  var f = fcfsMy(); return !f ? "" : fcfsReady(f) ? "<br>선착순 참여상 " + (f.st === "got" && f.rk > 0 ? f.rk + "번" : "· 1F 주차장 체크인존") : fcfsGone(f) ? "<br>선착순 참여상은 마감됐어요" : "";   /* 261016 달성순 「선착순 참여상 N번」 */   /* v5.98 받기 선착순 */   /* v5.97 마감(full · 17:00 뒤 closed) = 담담한 한 줄 · got 은 수령 안내 시트(fcfsGotOpen)가 따로 뜬다 */
}
/* v5.97 (사용자 261006 밤 「6개째 스탬프가 열리면 1층 주차장 체크인존에서 선착순 참여상 수령하라고 안내가 떠야」) 수령 안내 시트 · 자격(got)이 된 순간 1회(checkMyState → notice first · 스탬프 연출 뒤 · 행운권 상자보다 먼저) · 홈 한 줄 · 내 보상 카드에서 다시 연다 · 스태프가 내 QR 을 찍어 지급(fcfs_give) */
function fcfsGotOpen(again) {
  var f = fcfsMy(); if (!fcfsReady(f)) { if (again) fcfsInfoOpen(); return; }
  var p = PRIZES.fin.list[0], rk = f.st === "got" && f.rk > 0 ? f.rk : 0, ln = rk ? 0 : fcfsLeftN(), cut = (fxGet() || {}).cut || "17:00";
  sheetOpen({ id: "fcfsgo", title: rk ? "선착순 참여상 · " + rk + "번" : "선착순 참여상 · 받을 수 있어요".replace("받을", fcfsPre() ? fcfsStartHm() + "부터 받을" : "받을"), body: '<div class="axs-fcg"><img src="' + PRIZE_DIR + p.img + '.webp" alt="" width="600" height="600" decoding="async" onerror="this.remove()">' +
    '<p class="t">' + segHtml(esc(fcfsAt("1F 주차장 체크인존 · 내 QR 제시"))) + '</p><p class="s">' + esc(p.nm) + (ln ? " · 지금 남은 " + ln + "개" : "") + "</p>" +
    '<p class="s">' + segHtml(esc(cut + " 지급 마감 · 못 받으면 행사 뒤 발송")) + "</p></div>",   /* 261016 (사용자) 달성순 번호 · 교환 = 당일 체크인존 · 17:00 지급 마감 · 못 받은 사람 발송 */
    go: "sheetClose(true); qrPanelOpen('mine')", goLbl: "내 QR 보여주기", keep: "닫기", keepWeak: true, keepLast: true });   /* 261007 그날 시작 전 6개 = 「선착순 참여상 · 10:30부터 받을 수 있어요」 */
}
/* 홈 나의 일정 맨 위 한 줄 · 수령 전(got)만 · 받음 · 취소 · 마감이면 없음 · [정렬 분, onclick, 뱃지, 제목, 보조 줄, 뱃지 상태] */
function fcfsGotRow() { var f = fcfsMy(), rk = f && f.st === "got" && f.rk > 0 ? f.rk : 0, ln = fcfsLeftN(); return fcfsReady(f) ? [-3, "fcfsGotOpen(true)", "참여상", "선착순 참여상", rk ? rk + "번 · " + (fcfsLate() ? "행사 뒤 발송" : fcfsAt("1F 주차장 체크인존")) : fcfsAt("1F 주차장 체크인존") + (ln ? " · 남은 " + ln : ""), "act"] : null; }   /* v7.57 17:00 지급 마감 뒤 = 「N번 · 행사 뒤 발송」(홈 할 일 카드) */   /* 261016 「선착순 참여상 · N번 · 1F 주차장 체크인존」 */   /* v5.98 ready 만 · 소진(out)이면 사라진다 */
/* 261017 (사용자 확정 「럭키드로우에 대한 푸시 · 당첨자 안내 모두 걷어 내」) 럭키드로우 당첨 시트 · 본인 확인(draw_ack) · 홈 당첨 줄 · 현장 부재로 다시 추첨 표시 · 7등 당첨 안내 걷음 · 되살리기 = 루트 「정리 기록.md」 */
/* 261014 선착순 참여상 요약 팝업도 경품 시트의 선착순 구역으로 바로(옛 받으려면 상자 + 경품 한 줄 + 닫기 · 자격이 없어졌을 때 수령 안내 시트(fcfsGotOpen)의 되돌림 길) */
function fcfsInfoOpen() { prizeGo("fin"); }
/* 행운권 참석 조건(sync lkcond · 옛 서버 = 조건 있음) · 룰렛 마감 시각(sync rcut) · 아이디어왕 인원 */
function lkCond() { var v = S.get("lkcond", null); return v === null ? false : !!v; }   /* v8.55 (261022) sync 전 기본 = 조건 없음(운영 lkcond 0 · 첫 화면에 옛 시간 문구 안 비침) */
function drawWhenTxt() { return lkCond() ? "Closing Speech 현장 추첨은 17F 입구 QR 체크인" : "17:00 Closing Speech 현장 추첨 · 당첨자 발표"; }
function roulCutHm() { return String(S.get("rcut", "") || ""); }
function roulCut() {
  if (typeof betaFree === "function" && betaFree()) return false;   /* 261014 클로즈 베타 = 룰렛 마감 시각 없음 */
  var c = roulCutHm().split(":"); if (c.length < 2) return false;
  var d = appNow(true);
  return d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 26 && d.getHours() * 60 + d.getMinutes() >= (+c[0]) * 60 + (+c[1]);
}
function ideaKingN() { var ip = S.get("idea_pub", null), n = 0; ((ip && ip.prz) || []).forEach(function (x) { n += +x.n || 0; }); return n || 6; }
/* 커피 · 간식 사진 2장 · 18F 커피챗 상세 · DAP 과제상담 상세 */
function treatHtml(sm) {   /* v6.07 sm = 한 줄 4칸(커피챗 희망 묶음) · v6.83 (사용자 261009 묶음 10) 큰 사진 칸 = 사실 표 아래 옅은 구분선(axs-hr) 다음에 */
  return (sm ? "" : '<div class="axs-hr"></div>') + '<div class="axs-treat' + (sm ? " sm" : "") + '">' + TREATS.map(function (t) {
    return "<figure>" + prizePhHtml(t, 360) + "<figcaption><b>" + esc(t.nm) + "</b><span>" + esc(t.sub) + "</span></figcaption></figure>";
  }).join("") + "</div>";
}

/* ── 스탬프 · 숫자는 현행 운영: 카드 8종 · 개수 상한 6 · 응모권 최대 3장 · 현황 모양은 홈과 같은 railHtml(v4.10) ── */
function stampGoalText(n) {
  if (n < 3) return (3 - n) + "개 더 모으면 룰렛 1회";
  if (n < STAMP_DENOM) return "1개 더 모으면 행운권 " + raffleTickets(n + 1) + "장" + (n === STAMP_DENOM - 1 && fcfsOpen() ? " · 선착순 참여상" : "");   /* v5.90 6번째 = 선착순 참여상 · 남아 있고 마감 전일 때만 */
  var f = fcfsMy();   /* v5.90 계약 5.1 */
  if (f && (f.st === "ready" || f.st === "got")) return STAMP_DENOM + "개 모두 모았어요 · " + (f.st === "got" && f.rk > 0 ? "선착순 " + f.rk + "번" : "선착순 참여상 받을 수 있어요");   /* 261016 달성순 번호 */   /* v5.97 감사 하2 · D3 = 짧은 칸 캡션만 「참여상」 · v5.98 받기 선착순 · 「자격」 말 없음 */
  if (f && f.st === "done") return STAMP_DENOM + "개 모두 모았어요 · 선착순 참여상 수령 완료";
  if (f && (f.st === "out" || f.st === "full" || f.st === "closed")) return STAMP_DENOM + "개 모두 모았어요 · 선착순 참여상은 마감";
  return STAMP_DENOM + "개 모두 모았어요 · 행운권 " + RAFFLE_MAX + "장";
}
/* ═══ v7.57 (사용자 261017 S1 · S3 · S4 · R1 · H5 · 시안 `디자인 시안/스탬프탭_다음보상_261016/A.html`) 「다음 보상 한 줄」 = 레일 라벨 바로 아래 · 그림(다음 칸과 같은 그림 · 무채색) + 굵은 줄(숫자만 주황) + 옅은 줄
   스탬프 탭 = 굵은 줄 + 옅은 줄 · 홈 = 굵은 줄만(같은 문장 · 선착순 번호는 홈 할 일 카드 한 곳) · 6개 캡션(「6개 모두 모았어요」 · fcfsCapWhere)을 대신한다
   행운권 발급 마감(서버 sync my.rafclosed · 17:00 · 클로즈 베타 없음) 뒤 6개 전 = 「행운권 17:00 발급 마감」 */
function rafClosed() { return S.get("rafc", 0) === 1 && !(typeof betaFree === "function" && betaFree()); }
function stampNextInfo(n) {
  n = Math.min(STAMP_DENOM, Math.max(0, n || 0));
  var pre = typeof evPreDay === "function" && evPreDay();
  if (pre && n < PRE_MAX) return n < 3 ? { ico: "wheel", num: (3 - n) + "개", main: " 더 모으면 룰렛 1회", sub: "행사 전 " + PRE_MAX + "개까지" }
    : { ico: "ticket", num: "1개", main: " 더 모으면 행운권 " + raffleTickets(n + 1) + "장", sub: "행사 전 " + PRE_MAX + "개까지" };
  if (pre && n === PRE_MAX) return { ico: "time", num: "", main: "행사 전 " + PRE_MAX + "개 완료", sub: "나머지는 10/26 현장에서" };
  if (n < STAMP_DENOM) {
    if (rafClosed()) return { ico: "ticket", num: "", main: "행운권 17:00 발급 마감", sub: "" };
    if (n < 3 && !S.get("roulette_out", false)) return { ico: "wheel", num: (3 - n) + "개", main: " 더 모으면 룰렛 1회", sub: "" };
    return { ico: "ticket", num: (n < 3 ? 4 - n : 1) + "개", main: " 더 모으면 행운권 " + raffleTickets(Math.max(4, n + 1)) + "장", sub: n === STAMP_DENOM - 1 && fcfsOpen() ? "선착순 참여상도 함께" : "" };   /* 룰렛 소진 · 마감이면 다음 = 행운권 1장 */
  }
  var f = fcfsMy(), x = fxGet(), cut = String((x && x.cut) || "17:00");
  if (f && (f.st === "got" || f.st === "ready")) {
    if (fcfsLate()) return { ico: "box", num: "", main: "행사 뒤 발송", sub: cut + " 지급 마감" };
    var st = fcfsStartHm();
    return { ico: "qr", num: "", main: "1F 주차장 체크인존", sub: (st ? st + "~" + cut : cut + "까지") + " · 내 QR 제시" };
  }
  return { ico: "ticket", num: "", main: "17F Closing Speech 때|행운권 추첨", sub: lkCond() ? "16:40부터 17F 입구 QR 체크인" : "" };
}
function stampNextHtml(n, home) {   /* 굵은 줄 「|」 = 줄을 넘길 때 나누는 구 경계(한 줄에 들어가면 한 줄) */
  var g = stampNextInfo(n);
  if (home && (g.ico === "qr" || g.ico === "box")) return "";   /* v7.57 (사용자 확정 261017 H5 「나」) 6개 · 선착순 받기 전 = 홈 한 줄 없음 · 번호와 장소는 홈 맨 위 할 일 카드 한 곳 */
  var ic = g.ico === "wheel" || g.ico === "ticket" ? RAIL_ICO[g.ico] : g.ico === "time" ? App.ICONS.guide_time : PZ_ICO[g.ico];
  return '<div class="axs-rnx' + (home ? " home" : "") + '"><span class="ic" aria-hidden="true">' + ic + '</span><div class="tx"><p class="l1">' +
    (g.num ? '<b class="num">' + g.num + "</b>" : "") + g.main.split("|").map(function (t) { return '<span class="axs-nwr">' + esc(t) + "</span>"; }).join(" ") + "</p>" + (!home && g.sub ? '<p class="l2">' + segHtml(esc(g.sub)) + "</p>" : "") + "</div></div>";
}

/* ── v4.84 스탬프 탭(exp) 행 · 번호 · 이름 · 수단 칩 + 한 줄 · 오른쪽 행동 하나 · AX 퀴즈 · 미니 게임은 종목 타일 ── */
function expStamp(id) {
  STGET.open = true; S.put("stget_open", true);   /* v7.92 (사용자 확정 261018) 특정 스탬프로 들어오면 ③ 스탬프 획득하기 자동 펼침 */
  App.tab("exp");
  setTimeout(function () {
    var r = document.querySelector('#view [data-stp="' + id + '"]');
    if (r) AXM.scrollTo(r, { block: "center" });   /* 261009 부드럽게 + 도착 떠오름 */
  }, 60);
}
/* ── v7.92 (사용자 확정 261018) 스탬프 탭 ① 광고 영상 · ③ 스탬프 획득하기 접기 ──
   영상 = assets/reel/stamp_reel_v16.mp4(261022 행운권 장면 칩 「4개 1장 · 5개 2장 · 6개 3장」 판 · v15 = v8.38 룰렛 장면 경품 줄 아래 칩 「룰렛은 1층 EVENT ZONE에서」 판 · 포스터는 v14 그대로(3.9초 장면 같음 · 바이트 동일) · v8.01 도장 쾅 = 행운권 얹힘 같은 순간 판 · v7.97 v13 「지금 바로」 · 「체험 하고」 판 · v7.94 v11 「가습기 무드등」 판 이어 · 캐시 때문에 새 이름 · 1080 정사각 · 60초 · H.264 + AAC) · 포스터 = 342판 webp(칸 배경 + video poster) · 큰글씨도 같은 영상
   무음 자동 반복 · 오른쪽 위 스피커 단추(누른 그 탭 안에서 muted 해제라 아이폰도 · 저장하지 않음 · 스탬프 탭을 떠나면 다시 무음 · 앱을 열 때마다 무음)
   받기 = 칸이 화면에 들어올 때 src(그 전엔 포스터만) · 화면 밖 · 탭 숨김 · 다른 탭 = 멈춤 · 돌아오면 이어 재생
   play() 거부(아이폰 저전력 등 NotAllowedError) = 포스터 그대로 · 다시 조르지 않는다(스피커를 누르면 다시) · 동작 줄이기 = 자동 재생 없음(스피커를 누르면 그때 소리와 함께)
   video 노드는 하나(REEL.v) · 다시 그릴 때마다 App.render 같은 작업 안에서 새 칸(reelSlot)으로 옮긴다(떼었다 같은 작업 안에 붙이면 멈추지 않는다 · 4초 다시 그리기에 처음부터 받지 않게)
   영상(스피커 밖)을 누르면 ③ 펼침 + 그 머리로 부드럽게 · 서비스 워커는 페이지 이동만 가로챈다(sw.js · mp4 Range 요청 = 네트워크 그대로 · 미리 캐시 없음) */
var REEL = { src: "assets/reel/stamp_reel_v16.mp4", poster: "assets/reel/stamp_reel_v14_poster_342.webp", v: null, io: null, vis: false, snd: false, deny: false, pop: false,
  alt: "스탬프 보상 안내 영상. 스탬프 6개 모으기. 3개 룰렛, 4개부터 행운권, 6개 가습기 무드등. 스탬프 3개 모으면 룰렛 1번. 룰렛 경품은 텀블러, 커피와 키캡 키링, 컵받침, 판스티커, 볼펜. 룰렛은 1층 EVENT ZONE에서. 스탬프 4개는 행운권 1장, 경품 추첨 번호. 스탬프 4개부터 행운권 최대 3장, 4개 1장, 5개 2장, 6개 3장. 행운권 추첨 경품은 아이패드, 신라호텔 뷔페 식사권, 음식물 처리기, 에어팟, 종아리 마사지기, 백화점 상품권. 선착순 참여상, 6개면 가습기 무드등, 먼저 6개 모은 200명. 스탬프 획득하기, 지금 바로, 최초 로그인, AX 퀴즈, 미니 게임, 아이디어 한 줄. 체험 하고, 1층 체험하기, 계단 오르기, 강연 듣기, 설문 응답. 아래에서 바로 시작." };
var STGET = { open: S.get("stget_open", true) !== false };   /* v7.94 기본 = 펼침 · 사용자가 접으면 그 상태 기억 */
function reelHtml() {
  return '<div class="axs-reel" id="reelSlot" role="group" aria-label="스탬프 보상 안내 영상">' +
    '<p class="axs-reel-sr" id="reelAlt">' + esc(REEL.alt) + "</p>" +
    '<button type="button" class="axs-reel-go" onclick="reelGo()" aria-label="스탬프 획득하기 펼치기" aria-describedby="reelAlt"></button>' +
    '<button type="button" class="axs-reel-snd' + (REEL.snd ? " on" : "") + '" onclick="reelSnd()" aria-label="영상 소리" aria-pressed="' + REEL.snd + '">' + sndIcon(REEL.snd) + "</button></div>";
}
function reelEl() {
  if (REEL.v) return REEL.v;
  var v = document.createElement("video");
  v.className = "axs-reel-v";
  v.muted = true; v.defaultMuted = true; v.setAttribute("muted", "");
  v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
  v.loop = true; v.preload = "none"; v.poster = REEL.poster;
  v.setAttribute("aria-hidden", "true"); v.setAttribute("tabindex", "-1");
  v.setAttribute("disablepictureinpicture", ""); v.setAttribute("disableremoteplayback", "");
  REEL.v = v;
  return v;
}
function reelSrc() { var v = reelEl(); if (!v.getAttribute("src")) { v.preload = "auto"; v.src = REEL.src; } }
/* ── v7.94 (사용자 261018 「스탬프탭 누르면 광고창 팝업이 뜨고, 오늘 하루 보지 않기를 누르면 더 보지 않는 형태로 하자」) 광고 영상 = 팝업(#modal 바텀 시트 · mobile-popup-motion 규격 = AXM.open · close) ──
   뜨는 때 = 하단 탭 「스탬프」를 누를 때(navTap) · 「오늘 하루 보지 않기」 = 이 기기에서 그날(서울 날짜 reel_skip) 안 뜸 · X · 뒷배경 · 끌어 닫기 = 다음에 탭을 누르면 다시
   안 뜨는 때 = 특정 스탬프로 들어옴(expStamp · App.tab · navTap 아님) · 다른 팝업 · 시트 · 도장 팝 · 영상 · 선착순 알림(pbfNoteBusy · PBN) · 최초 로그인 장면 · 게임 판
   영상 = 팝업이 열리면 보일 때 src · 닫으면 멈춤 + src 정리 · 열린 동안 뒤 화면 스크롤 잠금(html.reel-lock) · 영상(스피커 밖) 누름 = 닫고 ③ 펼침 + 이동 */
function reelDay() { var d = new Date(appNow().getTime() + 9 * 3600000); return d.getUTCFullYear() + "-" + (d.getUTCMonth() + 1) + "-" + d.getUTCDate(); }
function reelPopMaybe(pbn) {
  if (App.current !== "exp" || pbn || REEL.pop) return false;
  if (S.get("reel_skip", "") === reelDay()) return false;
  if (pbfNoteBusy() || el("lgx") || el("rgPlay") || document.documentElement.classList.contains("ivp-lock")) return false;
  reelPopOpen();
  return true;
}
function reelPopOpen() {
  modalOpen('<div class="axs-reelp">' + reelHtml() + '<button type="button" class="axs-reel-skip" onclick="reelPopSkip()">오늘 하루 보지 않기</button></div>', '<span class="axs-reel-tag">' + zoneSign("STAMP TOUR", "tev lg") + "</span>");   /* v7.97 (사용자 261018 「갑자기 광고판이 뜨니 뭔지 이해가 잘 안 된다」) 머리 줄 = 「STAMP TOUR」 표지(261020 사용자 · 옛 STAMP MISSION)(1F 칸 TIME EVENT 와 같은 zoneSign · 점 글자 14 · 주황 알약 · 판 밖이라 모양은 axs-reel-tag 가 같은 값으로) · X 와 한 줄 · 대화 상자 이름 */
  var m = el("modal"); if (!m) return;
  m.classList.add("axs-reelm");
  var c = m.querySelector(".mcard"); c.classList.remove("axs-tall");
  REEL.pop = true; document.documentElement.classList.add("reel-lock");
  reelMount();
}
function reelPopSkip() { S.put("reel_skip", reelDay()); modalClose(); }   /* 조용한 저장 · 기기 설정(STORE_DEVICE) */
function reelPopGone() {   /* modalClose 가 부른다(X · 뒷배경 · 끌어 닫기 · 다른 팝업으로 바뀜) */
  REEL.pop = false; document.documentElement.classList.remove("reel-lock");
  if (REEL.io) REEL.io.disconnect();
  REEL.vis = false; REEL.snd = false;
  var v = REEL.v; if (!v) return;
  v.pause(); v.muted = true;
  if (v.getAttribute("src")) { v.removeAttribute("src"); v.preload = "none"; try { v.load(); } catch (e) {} }   /* 받은 영상 정리(메모리) · 다음에 열면 다시 붙인다 */
}
function reelMount(ae) {
  var slot = el("reelSlot");
  if (slot && !REEL.pop) slot = null;   /* v7.94 닫히는 중인 팝업의 칸 = 없는 것으로(다시 재생하지 않게) */
  if (ae && ae.id === "stGetBtn" && el("stGetBtn") && document.activeElement !== el("stGetBtn")) { try { el("stGetBtn").focus({ preventScroll: true }); } catch (e) {} }   /* 다시 그려도 「스탬프 획득하기」 단추 초점 유지 */
  if (!slot) {   /* 스탬프 탭이 아님 = 멈춤 · 다음에 오면 무음부터 */
    if (REEL.io) REEL.io.disconnect();
    REEL.vis = false;
    if (REEL.v) { REEL.v.pause(); REEL.snd = false; REEL.v.muted = true; }
    return;
  }
  var v = reelEl();
  if (v.parentNode !== slot) slot.insertBefore(v, slot.firstChild);
  if (!("IntersectionObserver" in window)) { REEL.vis = true; reelSync(); return; }
  if (!REEL.io) REEL.io = new IntersectionObserver(function (es) { var e = es[es.length - 1]; REEL.vis = e.isIntersecting && e.intersectionRatio >= 0.25; reelSync(); }, { threshold: [0, 0.25, 0.5] });
  REEL.io.disconnect(); REEL.io.observe(slot);
  reelSync();
}
function reelSync() {
  var v = REEL.v; if (!v || !el("reelSlot")) return;
  var want = REEL.vis && !document.hidden && App.current === "exp" && (REEL.snd || (!AXM.rm() && !REEL.deny));
  if (!want) { if (!v.paused) v.pause(); return; }
  reelSrc();
  if (!v.paused) return;
  var p = v.play();
  if (p && p.catch) p.catch(function (e) { if (e && e.name === "NotAllowedError") { REEL.deny = true; if (REEL.snd) { REEL.snd = false; v.muted = true; reelSndPaint(); } } });   /* 거부 = 포스터 그대로 · AbortError(바로 멈춤)는 다음에 다시 */
}
function reelSnd() {
  var v = reelEl();
  REEL.snd = !REEL.snd; v.muted = !REEL.snd;
  reelSndPaint();
  if (!REEL.snd) { reelSync(); return; }
  REEL.deny = false; reelSrc();   /* 누른 그 탭 안에서 play() · 아이폰도 소리 */
  var p = v.play();
  if (p && p.catch) p.catch(function () { REEL.snd = false; v.muted = true; reelSndPaint(); });
}
function reelSndPaint() {
  var b = document.querySelector("#reelSlot .axs-reel-snd"); if (!b) return;
  b.classList.toggle("on", REEL.snd); b.setAttribute("aria-pressed", String(REEL.snd)); b.innerHTML = sndIcon(REEL.snd);
}
document.addEventListener("visibilitychange", function () { reelSync(); });
function stGetSet(o) {
  STGET.open = o; S.put("stget_open", o);   /* 조용한 저장(다시 그리지 않음) */
  var b = el("stGetBtn"), w = b && b.closest(".axs-sfd");
  if (w) w.classList.toggle("open", o);
  if (b) b.setAttribute("aria-expanded", String(o));
}
function stGetTog() { stGetSet(!STGET.open); }
function reelGo() {   /* 영상을 누르면 (v7.94 팝업 닫고) ③ 펼침 + 그 머리로 부드럽게(동작 줄이기 = 바로) · 접혀 있었으면 펼침(0.3초)이 끝난 뒤 이동(접힌 높이로는 아래 끝에 막혀 머리까지 못 간다) */
  var was = STGET.open, rm = AXM.rm();
  if (REEL.pop) modalClose();
  stGetSet(true);
  var go = function () { var s = el("stpGet"); if (s && App.current === "exp") AXM.scrollTo(s, { block: "start", rise: false }); };
  if (was || rm) go(); else setTimeout(go, AXM.IN + 20);
}
var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2 8.8-9.4"/></svg>';
/* 종목 타일 · 완료 = 연주황 「O/X 완료」 · 남음 = 흰 면 · 누르면 그 종목 시작 화면 */
function stpTilesHtml(keys) {
  var me = olyMe(), q = keys === OLY_QUIZ_KEYS;   /* AX 퀴즈 타일은 이름 그대로(v4.92 AX 퀴즈 한 판) */
  return '<div class="axs-tiles">' + olyKeysEvents(keys).map(function (e) {
    var d = !!me.ev[e.key];
    return '<button type="button" class="axs-tile' + (d ? " done" : "") + '" onclick="App.go(\'' + e.view + '\')">' + esc(q ? e.name : e.short) + (d ? " 완료" : "") + "</button>";
  }).join("") + "</div>";
}
/* v4.95 보조 줄 하나 · 스탬프 탭 줄과 홈 「다음 스탬프」 카드가 같이 쓴다 · 수단 칩(폰으로 · 현장 · 스태프 인증) = 줄 맨 앞 · 그 옆이 조건 · 시간 글
   칩은 줄지 않고(flex none) 글만 칩 옆 칸에서 줄바꿈한다(칩 혼자 한 줄에 남지 않게 · 제목 줄은 건드리지 않는다) · 375px 일반에서 한 줄이 되게 글을 줄였다 */
function stpLineHtml(mode, meta) {
  if (!mode && !meta) return "";
  return '<p class="axs-stpm">' + (mode ? '<span class="axs-stpc' + (mode === "스태프 인증" ? " staff" : "") + '">' + esc(mode) + "</span>" : "") + (meta ? "<span>" + segHtml(meta) + "</span>" : "") + "</p>";
}
/* 행 한 줄 설명 · 화면에 없는 장소 · 시간 · 조건만(문구 다이어트) · v4.95 375px 한 줄(종목 이름은 아래 타일 · 장소는 행동 화면에) */
function stpMeta(s, got) {
  if (s.id === "lg") return "";
  if (got && (s.id === "qz" || s.id === "p4" || s.id === "p3")) return "스탬프 받음";   /* v5.16 받은 뒤 = 상태 한 마디 + 오른쪽 「다시 하기」 · 261013 오후 프로그램 참여(묶음 2개)도 */
  if (s.id === "qz") return QZ_NEED <= 1 ? "한 판 · 약 2분" : QZ_NEED + "종 완주 · " + Math.min(QZ_NEED, qzDone()) + " / " + QZ_NEED;
  if (s.id === "p4") return stampV2() ? "세 게임 한 판씩" : "서로 다른 3종목 · " + Math.min(MG_NEED, mgDone()) + " / " + MG_NEED;   /* v7.57 (사용자 261017 S6) 진행은 아래 타일(완료)이 보여 준다 */
  if (s.id === "p2") return "1F · 둘 중 하나 체험";   /* v7.57 S6 · 조건 = HiDI-Q 또는 Hi-Helper 하나(STAMP_P2.desc) */   /* 이름(HiDI-Q · Hi-Helper)은 구역 줄 · 체험 안내 화면에 */
  if (s.id === "p5") return got ? (ideaP5cc() ? "커피챗 신청으로 받음" : "1분 · AX LAB QR로도") : "한 줄 쓰기 또는 커피챗 신청";   /* v7.57 S6 제목 반복 덜기 */   /* v7.39 (사용자 261016 계획서 0-2-3) 출처를 판에서 · 앱 · 부스로 받았으면 지금 그대로 */
  if (s.id === "p3") return progUnits() === 1 ? "2개 중 1개 · 하나 더" : "합쳐 2개까지";   /* v7.57 S6 목록 끝 줄을 위로 */   /* v7.39 「최대 2개」 = 아래 목록 끝 줄 「합쳐 2개까지」 */   /* v5.68 17F 입장이나 끝 한쪽만 받은 상태 · 261013 오후 묶음(아래 세 줄 목록 stpProgListHtml) · 261013 밤 (사용자 확정) 활동마다 개수는 목록에 · 묶음 최대 2 한 줄 */
  if (s.id === "st") { var sst = stairState(), sl = stairLine(sst); return sst.leg ? "진행 중 · " + sst.leg.fl + "F 시작" : /한 개 층 이상$/.test(sl) ? "방화문 QR · 출발층과 도착층" : sl; }   /* v7.57 S6 할 일(두 번 찍기)이 보이게 · 누적 · 이동 문구는 그대로 */
  if (s.id === "sv") return stampV2() ? "약 2분" : SURVEY.open + "부터 · 약 2분";   /* v7.57 S6 퀴즈와 같은 형식 */   /* 261013 오후 14:30 은 4단계 제목에 */
  return s.where || "";
}
/* 오른쪽 행동 [글, onclick] · onclick 이 없으면 글만(완료 · 열리는 시각) */
function stpAct(s, got) {
  if (s.id === "p5" && ideaGateOff()) return [got ? "완료" : "10/26부터", ""];   /* v5.90 아이디어 사전 오픈 OFF · 행사 전 = 입구 숨김 */
  if (got) return s.id === "p5" ? ["더 쓰기", "App.go('ideas')"] : s.id === "sv" ? ["결과", "App.go('survey')"] :
    s.id === "qz" ? ["다시 하기", "App.go('quiz')"] : s.id === "p4" ? ["다시 하기", "App.go('games')"] : ["완료", ""];   /* v5.16 (사용자 261003 「스탬프가 완료되면 더 안 된다」) 스탬프는 한 번 · 게임은 몇 번이든 · 받은 줄도 목록으로 */
  if (s.id === "lg") return ["자동", ""];
  if ((s.id === "p2" || s.id === "st" || s.id === "p3") && typeof evPreDay === "function" && evPreDay() && !(typeof testEmp === "function" && testEmp())) return ["10/26부터", ""];   /* v7.47 (261016 레드팀 B1) 행사 전 가드 = 현장 줄(AX PLAY · 계단 · 프로그램 참여)은 눌러도 서버가 거절 · 아이디어 한 줄(p5)과 같은 「10/26부터」 · 테스트 사번은 서버도 예외 */
  if (s.id === "qz" && QZ_NEED <= 1) return ["시작", "App.go('quiz')"];   /* v4.95 (사용자 261002 「AX 퀴즈 박스 표시는 이제 없어도 된다」) 한 판뿐 · 타일 없이 줄을 누르면 시작 화면 */
  if (s.id === "qz" || s.id === "p4") return ["", ""];   /* 종목 타일이 행동이다 */
  if (s.id === "p2") return ["내 QR", "qrPanelOpen('mine')"];
  if (s.id === "p5") return ["쓰기", "App.go('ideas')"];
  if (s.id === "p3") return ["보기", "progApplyGo()"];   /* 261013 오후 프로그램 › 참여하기 칸(묶음 세 활동과 1:1) */
  if (s.id === "st") return [stairState().leg ? "이어 하기" : "안내", "stairOpen()"];   /* v6.83 (디자인 D-5) 오른쪽 = 행동 말(진행 중은 보조 줄이 말한다) */
  if (s.id === "sv") return surveyLock() === "time" ? [SURVEY.open, ""] : ["시작", "App.go('survey')"];
  return [s.cta ? "보기" : "", s.tap || ""];
}
/* 261013 오후 (사용자 확정) 프로그램 참여 줄 아래 세 활동 · 「· 」 목록(무채색 점 · 둘째 줄 내어쓰기) · 선정 · 승인된 내 시각이 있으면 괄호로(통째로 넘김) */
function stpProgListHtml() {
  /* v7.39 (사용자 261016 계획서 0-2-3) 목록으로 나누고 끝 줄 「합쳐 2개까지」(합계 오해 방지) · 라운지 줄 = 사전 신청자에게만(D7 · 내 상담 줄 · 받은 ln) · 선정 · 내 시각이 있으면 괄호로(통째로 넘김) */
  var c = S.get("cchat", null), r = typeof loungeMine === "function" ? loungeMine() : null, tm = function (t) { return ' <span class="axs-nwr">(' + esc(t) + ")</span>"; };
  var st0 = S.get("stamps", []), ten = (typeof tenMine === "function" && tenMine()) || st0.indexOf("p10") >= 0 || st0.indexOf("p10h") >= 0;   /* 261016 (사용자) 10F 실습 = 사전 신청자(10F 명단 · tenMine)에게만 · 받은 p10 · p10h */
  var rows = ["17F 오후 강연 시작 · 종료 출석체크 시 각 1개"].concat(ten ? ["10F 실습 시작 · 종료 출석체크 시 각 1개"] : [])
    .concat(r || st0.indexOf("ln") >= 0 ? ["1F AX 라운지 참석" + (r && r.status === "approved" && r.slot ? tm(resvRng(r)) : "")] : [])
    .concat(["18F 커피챗 참석" + (c && c.status === "matched" && c.round && !S.get("cchat_att", false) ? tm(c.round + " 선정") : (S.get("cc_walk", null) || {}).st === "done" ? tm("현장 상담 완료 " + S.get("cc_walk", null).at) : "")]);   /* v7.57 (사용자 261017 S6) 개수 지움(라운지 = 「AX 라운지」 이름 규칙 261007 「상담 뺌」 그대로) · 「합쳐 2개까지」는 줄 설명(stpMeta p3)으로 올림 · 17F · 10F 줄은 S2 그대로 */
  return '<ul class="axs-stpl">' + rows.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
}
function stpRowHtml(s, i, st, full) {
  var got = stampHas(s.id, st), a = stpAct(s, got), meta = stpMeta(s, got);   /* 261013 오후 (사용자 확정) 받는 방식 칩(자동 · 폰으로 · 현장 · 스태프 인증) 없음 · 단계 제목이 대신 · 프로그램 참여 = 묶음 2개면 받음(stampHas) */
  var tiles = got ? "" : s.id === "qz" && QZ_NEED > 1 ? stpTilesHtml(OLY_QUIZ_KEYS) : s.id === "p4" ? stpTilesHtml(stampV2() ? OLY_MINI_KEYS : olyAllKeys()) : "";   /* v4.95 AX 퀴즈 타일 없음(한 판) · 받은 줄은 타일 없이(오른쪽 「완료」와 겹쳐 두 줄이 되던 자리) */
  var test = !testMode() ? "" : got ? '<button type="button" class="axs-stpx" onclick="testStampUndo(\'' + s.id + '\')">테스트 · 완료 취소</button>' : '<button type="button" class="axs-stpx" onclick="testStamp(\'' + s.id + '\')">테스트 · 완료 처리</button>';
  /* v4.95 행동이 있는 줄은 줄 전체를 눌러도 같은 행동(안의 버튼 · 타일은 그 버튼만) · 키보드는 오른쪽 버튼 */
  var tap = a[1] ? ' onclick="if (!event.target.closest(\'button\')) { ' + a[1].replace(/"/g, "&quot;") + '; }"' : "";
  /* v5.68 프로그램 참여 = 2개 · 17F 한쪽만(p3h) = 번호 칸 반 채움 · 261013 오후 라운지 참석은 한 번에 2개(묶음) · 261013 밤 커피챗 참석만(cc 1개)도 반 칸(progUnitsOf 1) */
  var half = s.id === "p3" && !got && progUnitsOf(st) === 1;
  /* v6.83 (디자인 D-5) 오른쪽 = 누르는 행동 말만 · 행동이 아닌 글은 오른쪽에 두지 않는다 · 열리는 시각(10/26부터) = 둘째 줄 칩(보조 줄에 이미 있으면 생략) · 261013 오후 설문 14:30 은 단계 제목에 */
  var stat = s.id !== "sv" && a[0] && !a[1] && a[0] !== "완료" && a[0] !== "자동" && String(meta).indexOf(a[0]) < 0 ? a[0] : "";
  return '<div class="axs-stp' + (got ? " done" : full && !half && s.id !== "sv" ? " off" : "") + (tap ? " tap" : "") + '" data-stp="' + s.id + '"' + tap + ">" +
    stpCellHtml(s, i, got, half) +   /* v6.88 (사용자 261009 「권장대로」 시안 A1) 번호 칸 = 도장(받기 전 번호가 든 옅은 자리 · 받으면 찍힌 씰 · 체크 원 대체) */
    '<div class="axs-stpb"><p class="ax-card-title">' + esc(s.title) + "</p>" +
    stpLineHtml("", esc(meta)) + (stat ? '<p class="axs-stpm"><span class="axs-stpc">' + esc(stat) + "</span></p>" : "") + (s.id === "p3" && !got ? stpProgListHtml() : "") +
    tiles + test + "</div>" +
    (a[0] && a[1] ? '<button type="button" class="axs-stpa" onclick="' + a[1] + '">' + esc(a[0]) + "</button>" : "") +
    "</div>";
}
/* 261016 (사용자) 사전등록 체크인(ck 3개) 줄 걷음(STAMP_CK_ROW · stampCkRowOn · ×3 칸) */
/* v6.88 (사용자 261009 「권장대로」 · 시안 A1) 스탬프 줄 왼쪽 번호 칸 = 도장 · 오른쪽 폭 · 줄 높이 · 줄바꿈 그대로(40px 칸 그대로)
   받기 전 = 같은 씰(stampSealSvg)에 가운데 번호 · 브랜드 옅은 톤 · 받으면 = 찍힌 씰(「완료」 · 기울임 그대로) · 2개짜리(프로그램 참여) = 작은 씰 두 개 겹침(받은 만큼 찍힘) · 읽는 글 「n번 스탬프, 받음 / 아직」
   클래스 axs-stpn 은 남긴다(도장 팝이 날아와 앉는 자리 · spTarget)
   v6.89 (사용자 261009 「우측 스탬프 두 개 지우자」) 2개짜리 줄 오른쪽 46px 도장 두 개(v6.86 · 시안 A2 방향)를 걷었다 · 왼쪽 칸 작은 씰 두 개가 「도장 2개」 · 오른쪽 = 다른 줄과 같은 행동 글 · 읽는 글 「스탬프 2개 받는 활동, 2개 중 n개 받음」은 왼쪽 칸
   */
function stpCellHtml(s, i, got, half) {
  var k = function (on, mid, ms) { return on ? stampSealSvg(40) : stampSealSvg(40, "currentColor", mid, ms); };
  var ov = function (ons) { return '<span class="axs-stpk2">' + ons.map(function (on) { return "<span" + (on ? ' class="on"' : "") + ">" + k(on, "") + "</span>"; }).join("") + "</span>"; };   /* 261013 오후 N개 겹침 하나로(2개 · 3개 같은 크기 · 같은 세로 중심) */
  var lb = s.x2 ? "스탬프 2개 받는 활동, 2개 중 " + (got ? 2 : half ? 1 : 0) + "개 받음" : s.title + " 스탬프, " + (got ? "받음" : "아직");   /* 261013 오후 (사용자) 받기 전 도장 번호 뺌 · 읽는 글 = 이름 */
  var inner = !s.x2 ? '<span class="axs-stpk1' + (got ? " on" : "") + '">' + k(got, "스탬프", 17) + "</span>" :
    ov([got || half, got]);
  return '<span class="axs-stpn axs-stpk" role="img" aria-label="' + lb + '">' + inner + "</span>";
}
/* 261013 오후 (사용자 확정) 스탬프 탭 판 = 참여자의 하루 흐름 4단계(STAMP_STAGES) · 단계 제목 「n단계 · 이름」 + 옆 짧은 말 · 줄 번호 = STAMPS 순서 1~8 · 옛 서버(stv 1)는 한 목록 그대로 */
/* 261014 클로즈 베타(betaFree) = 마무리(설문) 단계 옆 말 「14:30부터」 → 「언제든」 */
function stpBoardMine() { return stpBoardHtml(S.get("stamps", []), stampCount() >= STAMP_DENOM); }   /* v7.65 스탬프 탭 · 홈 접기 단추가 같이 쓴다(내 스탬프 · 6개면 남은 줄 흐리게) */
function stpBoardHtml(st, full) {
  if (!stampV2()) return '<div class="axs-stps">' + STAMPS.map(function (s, i) { return stpRowHtml(s, i, st, full); }).join("") + "</div>";
  return STAMP_STAGES.map(function (g, n) {
    var rows = g.ids.map(function (id) { var s = stampDef(id), i = STAMPS.indexOf(s); return s && i >= 0 ? stpRowHtml(s, i, st, full) : ""; }).join("");
    return '<div class="axs-stg"><p class="axs-stgh"><b class="axs-stgp">' + esc(g.t) + "</b><span>" + esc(g.ids.indexOf("sv") >= 0 ? ((typeof betaFree === "function" && betaFree()) ? "언제든" : (typeof surveyOpen === "function" && surveyOpen()) ? "10/27까지" : g.s) : g.s) + "</span></p>" +
      '<div class="axs-stps">' + rows + "</div></div>";
  }).join("");
}
/* 구경하고 겨루기 · 1F 타자왕 현장 순위(type_rank · v5.29 현장 순위판 하나) · 실시간 화면은 4묶음(type_live) */
function typeSiteRankGo() { App.go("type_rank"); }   /* v5.29 탭 없음(현장 순위판 하나) */

