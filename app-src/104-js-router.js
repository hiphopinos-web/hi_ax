/* ════════════════ 카운터 ════════════════ */
var tick = 0;
setInterval(function () { tick++; if (App.current === "home") App.render(); }, 4000);
/* 백엔드 연결 · GAS_URL 이 채워져 있으면 서버 모드로 전환하고 월 집계를 주기적으로 받는다 */
BE.on = !!GAS_URL;
if (BE.on) pollNext(beJit());   /* v4.57 첫 sync 0~5초 뒤 · 이후 pollNext 가 30초씩(실패 시 늘림) · stats 60초 폴링은 없앴다(앱은 stats 에서 월 숫자만 쓰고 sync 가 같은 값을 준다 · 요청 3분의 1 절감) */
/* 서비스워커 · 안드로이드 홈 화면 설치창의 전제조건. 캐시는 전혀 하지 않는 무해 버전(sw.js) */
if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(127\.0\.0\.1|localhost)$/.test(location.hostname))) {   /* v4.76 웹 푸시 · 로컬 QA 서버도 */
  try { navigator.serviceWorker.register("sw.js"); } catch (e) {}
}
function counters() {
  return {
    online: FESTIVAL.mockOnline + ((tick * 7) % 41) - 20,
    ideas: FESTIVAL.mockIdeas + S.get("ideas", []).length + Math.floor(tick / 3),
    games: FESTIVAL.mockGamePlayers + ((tick * 3) % 13)   /* v3.50 미니게임 참여 */
  };
}

/* ════════════════ 라우터 (Lv1 탭 → Lv2 상세) ════════════════ */
var SIGNAGE = ["wall_type", "type_award"];   /* 정리 #6(261005) 앱 안 옛 송출 화면 7개(screen · screen_survey · screen_words · wall_wave · wall_live · wall_metowe · wall_tv)는 지웠다 · 현행 사이니지 = wall/ · tv/typing/ */
/* 설정 톱니 · 홈 화면 바로가기 · 관리자 모드 · 로그아웃(v4.71 글자 크기는 헤더 토글) */
var GEAR_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="12" cy="12" r="3.1"/>' +
  '<path d="M19.1 14.4a1.6 1.6 0 0 0 .32 1.77l.06.06a1.9 1.9 0 1 1-2.69 2.69l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47v.17a1.9 1.9 0 1 1-3.8 0v-.09a1.6 1.6 0 0 0-1.05-1.47 1.6 1.6 0 0 0-1.77.32l-.06.06a1.9 1.9 0 1 1-2.69-2.69l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3.9a1.9 1.9 0 1 1 0-3.8h.09a1.6 1.6 0 0 0 1.47-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.9 1.9 0 1 1 2.69-2.69l.06.06a1.6 1.6 0 0 0 1.77.32h.08a1.6 1.6 0 0 0 .97-1.47V3.9a1.9 1.9 0 1 1 3.8 0v.09a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.9 1.9 0 1 1 2.69 2.69l-.06.06a1.6 1.6 0 0 0-.32 1.77v.08a1.6 1.6 0 0 0 1.47.97h.17a1.9 1.9 0 1 1 0 3.8h-.09a1.6 1.6 0 0 0-1.47.97z"/></svg>';
/* v4.09 이동 표시 셰브론(글자 「›」 대신) · 위치 아이콘(장소 줄) */
var CHEV_SVG = '<svg class="axs-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>';
var PIN_SVG = '<svg class="axs-pin" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 14.2s4.6-4.1 4.6-7.8a4.6 4.6 0 0 0-9.2 0c0 3.7 4.6 7.8 4.6 7.8z"/><circle cx="8" cy="6.4" r="1.6"/></svg>';
/* 글자 링크 뒤 셰브론 · 「스탬프 ›」처럼 글자에 이어 붙이지 않는다 */
function lnkChev(t) { return '<span class="axs-lk">' + t + CHEV_SVG + '</span>'; }
var BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>';
var BELL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10a6 6 0 0 0-12 0c0 4.4-1.7 5.9-2.4 6.6h16.8c-.7-.7-2.4-2.2-2.4-6.6z"/><path d="M10.2 20a2 2 0 0 0 3.6 0"/></svg>';
var App = {
  current: "home",
  /* ═══ AX-TDS v1 (260922 · design.md §A) · 하단 = 홈 / 프로그램 / [QR 스캔] / 체험 / 나의 참여 ═══
     가운데 QR 스캔은 사용자 결정(260922)으로 남긴 예외다(가이드는 QR 을 탭으로 두지 않는다). 헤더 QR 아이콘은 두지 않는다(입구가 둘이면 헷갈린다).
     라우트 id 는 유지한다: passport(스탬프)·guide_time(시간표·내 일정)은 이제 나의 참여 아래 Lv2 다. 옛 해시·딥링크·App.go 호출이 그대로 산다. */
  TABS: [["home", "홈"], ["guide", "프로그램"], ["exp", "스탬프"], ["my", "나의 참여"]],
  ROOTS: ["home", "guide", "exp", "my"],
  /* 제공 스프라이트 id · 패키지 원본 파일명이 화면과 뒤바뀌어 있다(nav-experience = 격자, nav-program = 화살표).
     기준 화면 H01·E01 의 모양을 따른다: 프로그램 = 격자, 체험 = 화살표 */
  NAV_ICO: { home: "nav-home", guide: "nav-experience", exp: "nav-program", my: "nav-my" },
  /* 옛 행 카드 아이콘 (rcIcon 이 쓴다) */
  ICONS: {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M6 9.8V20h12V9.8"/><path d="M10 20v-5.4h4V20"/></svg>',
    passport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="17" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16.5h6"/></svg>',
    ideas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 1 6 6c0 2.3-1.3 3.6-2.3 4.7-.6.7-.9 1.3-1 2.3h-5.4c-.1-1-.4-1.6-1-2.3C7.3 12.6 6 11.3 6 9a6 6 0 0 1 6-6z"/><path d="M9.8 19.5h4.4"/><path d="M10.6 22h2.8"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M4.5 9.2h15"/><path d="M4.5 14.9h15"/><path d="M9.5 20v-5.1"/></svg>',
    guide_time: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.3V12l3.2 2.1"/></svg>'
  },
  /* Lv2 → 기본 소속(뒤로가기 목적지). 다른 곳에서 들어오면 from 이 우선한다(App.go 참조) */
  PARENT: {
    notices: "home",
    /* 나의 참여 · 내 일정 / 스탬프 / 내 보상 / 포토부스 대기 (M01) */
    passport: "my", guide_time: "my", rewards: "my", prizes: "my",   /* v5.08 경품 포스터 · 뒤로 = 들어온 곳(홈 · 스탬프 탭 · 내 보상 · 모달) */
    /* 체험 · 현장(부스·QR 퀴즈) / 앱(미니게임·아이디어·설문) (E01) */
    booth: "exp",
    /* v4.06 3단계 · 현장 안내 E02 · 스캔 Q02 · 결과 Q03 · 계단 화면 */
    exp_g: "exp", scan_q: "exp", scan_res: "exp", stair: "exp",
    games: "exp", quiz: "exp", ideas: "exp", survey: "exp", ideas_mine: "ideas",
    game_tetris: "games", game_pang: "games", game_jump: "games", quiz_play: "quiz", oly_rank: "games", type_rank: "guide", floor1: "guide",   /* v4.83 퀴즈 두 종목의 뒤로가기 = AX 퀴즈 */
    /* 프로그램 · 신청 (2단계에서 재디자인) */
    dap: "guide", ev_cchat: "guide", sess_d: "guide", sess_cf: "sess_d", sess_ok: "guide", zone_d: "guide", floor_d: "guide",   /* v4.93 구역 상세 · 뒤로 = 프로그램(상시 운영) */
    admin: "my", type_site: "admin", wall_type: "admin", type_award: "admin"
  },
  TITLES: {
    home: "AX Festival", guide: "프로그램", exp: "스탬프", my: "나의 참여",
    passport: "스탬프", rewards: "나의 보상", prizes: "경품", games: "미니 게임", quiz: "AX 퀴즈",
    notices: "공지", dap: "AX LOUNGE 상담 신청",
    booth: "AX PLAY",
    ideas: "아이디어 한 줄", ideas_mine: "내가 낸 아이디어", survey: "오늘 한 판 설문",
    sess_d: "프로그램", sess_cf: "신청 확인", sess_ok: "신청 완료",
    ev_cchat: "내 커피챗",
    floor1: "1F 부스", zone_d: "1F 구역",
    admin: "관리자 모드", game_tetris: "테트리스", type_site: "1F 현장 셀프 모드", wall_type: "", type_award: "", type_rank: "1F 타자왕 순위",
    game_pang: "AX 팡", game_jump: "ME to WE 점프", quiz_play: "퀴즈 풀기", oly_rank: "미니 게임 순위"
  },
  /* 들어온 곳 기억 · 같은 화면을 여러 곳에서 연다(시간표 = 홈 · 나의 참여, 미니게임 = 체험 · 스탬프 카드) → 뒤로가기는 들어온 곳으로 */
  from: {},
  parentOf: function (v) { return this.from[v] || this.PARENT[v] || null; },
  tabOf: function (v) {
    var cur = v, hop = 0;
    while (this.parentOf(cur) && hop < 8) { cur = this.parentOf(cur); hop++; }
    return cur;
  },
  isAnc: function (a, b) {   /* a 가 b 의 윗단인가 (위로 가는 이동이면 기록하지 않는다 · 순환 방지) */
    var cur = b, hop = 0;
    while (cur && hop < 8) { cur = this.parentOf(cur); if (cur === a) return true; hop++; }
    return false;
  },
  title: function (v) {
    if (v === "guide_time") return "나의 일정";   /* v4.13 전체 시간표는 프로그램 탭 시간표 보기 */
    if (v === "sess_d") return progMine(PROG.sid) ? "신청 관리" : "프로그램";
    if (v === "exp_g") return stampTitle(EXPG.id);
    if (v === "scan_q") return SCQ.ctx ? stampTitle(SCQ.ctx) + " 안내" : "QR";   /* v5.23 [내 QR | QR 스캔] 두 탭 · 문맥 스캔(출석 · 계단 등)은 탭 없이 그 안내 */
    if (v === "scan_res") return SR.st === "link" ? "1F 타자왕" : SR.st === "ok" ? "적립 완료" : SR.st === "saved" ? "스캔 저장됨" : SR.st === "draw" || SR.draw ? "추첨 체크인" : "적립 결과";   /* v4.79 추첨 체크인 */
    if (v === "stair") return "계단 이용";
    if (v === "zone_d") { var zn = zoneById(PROG.zone); return zn ? zn.hdr || zn.sign : this.TITLES[v]; }   /* v4.93 헤더 = 현장 간판 글자 그대로 · v5.65 커피챗 = 「AX 커피챗」(간판은 AX COFFEE CHAT) */
    if (v === "floor_d") return FLOOR_GD[PROG.floor] ? FLOOR_GD[PROG.floor].hdr : "층별 안내";   /* v5.65 둘러보기 엘리베이터 층 안내 */
    return this.TITLES[v] || "";
  },
  tab: function (t) { this.from = {}; this.go(t); },   /* v5.73 (사용자 261005 「전체 시간표 보기를 해서 이동되고 나면 길을 잃어버려 1층으로 못 돌아간다」) 아래 탭으로 가도 둘러보기 출처(TOUR_RET)는 남는다 · 옛 v5.53 · v5.67 「탭 = 지움」 바뀜 */
  /* v4.09 경로 줄 · 실제로 들어온 길 = 뒤로 버튼과 같은 사슬(parentOf · from) · [탭 첫 화면(또는 홈), …, 지금] */
  crumbs: function (v) {
    var out = [v], cur = v, hop = 0;
    while (this.parentOf(cur) && hop < 8) { cur = this.parentOf(cur); out.unshift(cur); hop++; }
    return out;
  },
  crumbLabel: function (v) {
    if (v === "home") return "홈";
    if (v === "sess_d") {
      var s = progById(PROG.sid); if (!s) return "프로그램";
      if (s.id === "dap") return "AX LOUNGE 상담";
      if (s.id === "cchat") return "AX 커피챗";
      var d = progDetail(s); return d.cat + (d.org && d.cat.indexOf(d.org) < 0 ? " · " + d.org : "");
    }
    return this.title(v);
  },
  /* 경로 줄 링크 · 그 단계까지 거슬러 올라간다(뒤로를 여러 번 누른 것과 같다 · 프로그램 필터·스크롤 보존) */
  up: function (to) {
    var cur = this.current, hop = 0;
    while (cur && cur !== to && hop < 8) { var p = this.parentOf(cur); delete this.from[cur]; cur = p; hop++; }
    this.go(to, true);
  },
  crumbHtml: function (v) {
    var cr = this.crumbs(v);
    if (cr.length < 2 || SIGNAGE.indexOf(v) >= 0 || v === "admin" || this.isAnc("admin", v)) return "";
    return '<nav class="axs-crumb" id="axsCrumb" aria-label="현재 위치"><ol>' + cr.map(function (c, i) {
      var last = i === cr.length - 1, lb = esc(App.crumbLabel(c));
      return "<li" + (last ? ' aria-current="page"' : "") + ">" + (i ? '<span class="sep" aria-hidden="true">›</span>' : "") +
        (last ? "<b>" + lb + "</b>" : '<button type="button" onclick="App.up(\'' + c + '\')">' + lb + "</button>") + "</li>";
    }).join("") + "</ol></nav>";
  },
  back: function () {
    if (TOUR_RET && !TOUR_RET.away && this.current === TOUR_RET.v && tourRetBack()) return;   /* v5.53 둘러보기 바로 가기로 온 화면 = 뒤로 가면 둘러보기 */
    if (TOUR_RET && !TOUR_RET.away && TOUR_RET.done && this.isAnc(TOUR_RET.v, this.current) && tourRetBack()) return;   /* v5.57 둘러보기에서 출발한 활동을 마쳤으면 그 활동의 어느 화면(결과 · 게임 · 완료)에서 뒤로 가도 둘러보기 */
    if (QRS.hold) { QRS.gate = 0; QRS.gateQ = []; }   /* v4.13 인식 중 뒤로 = 미뤄 둔 전환을 버리고 바로 나간다 */
    var v = this.current, p = this.parentOf(v) || "home";
    delete this.from[v];
    this.go(p, true);
  },
  go: function (v, isBack) {
    if (typeof qrGated === "function" && qrGated()) { var ga = [v, isBack]; qrGateDefer(function () { App.go(ga[0], ga[1]); }); return; }   /* v4.13 QR 인식 0.8초 동안 화면 전환을 미룬다 */
    if (v !== "type_site" && typeof tsfOn === "function" && tsfOn() && !(v === "wall_type" && /^#tv=type/i.test(location.hash))) v = "type_site";   /* v4.32 셀프 모드 노트북은 참가자 화면 밖으로 나가지 않는다(끄기 = 관리코드) · v4.65 주소가 #tv=type 인 창(같은 노트북의 TV 창)만 순위판 */
    /* v4.05 옛 과제상담 · 커피챗 화면 = 프로그램 상세(P02 · M03) 하나로 (알림 · 딥링크 · 옛 onclick 호환) */
    if (v === "dap" || v === "ev_cchat") { PROG.sid = v === "dap" ? "dap" : "cchat"; v = "sess_d"; }
    /* v5.65 커피챗 신청 전 = 구역 상세(zone_d cchat · AX LOUNGE 와 같은 틀) · 신청 · 참석이 있으면 프로그램 상세(매칭 · 취소) */
    if (v === "sess_d" && PROG.sid === "cchat" && !S.get("cchat", null) && !S.get("cchat_att", false)) { if (this.current !== "zone_d" || PROG.zone !== "cchat") PROG.zchk = false; PROG.zone = "cchat"; v = "zone_d"; }
    if (v === "rewards") { MY.seg = "rw"; v = "my"; }   /* v5.65 옛 내 보상 화면 = 나의 참여 › 나의 보상 갈래(알림 · 옛 링크 · 튕길 자리 그대로) */
    /* v4.84 (261001 앱 개편 2묶음) 옛 스탬프 화면 = 스탬프 탭 · 전시 QR 퀴즈(DAP Wall)는 새 8종에서 숨김(옛 서버 stv 없음일 때만 연다) */
    if (v === "passport") { v = "exp"; this.from = {}; }
    if (v === "photoq") { PROG.zone = "event"; v = "zone_d"; }   /* v5.05 포토부스 대기 폐지 · 옛 알림 · 해시 · onclick · 서버 푸시 목적지는 EVENT 구역 상세로 · 정리 #7(261005) 대기 코드는 지웠다 */
    /* v4.93 (261001 사용자 확정 · IA 검토 8장 A6) 옛 진입 별칭 · 라우트 id 는 그대로 받는다(해시 · 푸시 목적지 · 옛 onclick)
       floor1 = 프로그램 › 상시 운영 1F · my_sched · 내 일정(guide_time + SCHED.tab mine · mySched()) = 나의 참여 › 나의 일정 · 그 밖의 guide_time = 프로그램 › 시간표 */
    if (v === "my_sched") { SCHED.tab = "mine"; v = "guide_time"; }
    if (v === "game_ox") v = "quiz";   /* v4.96 유리다리 휴면 → 정리 #10(261005) 지움 · 옛 링크 · 타일 · 다음 스탬프는 판 퀴즈 목록으로 */
    if (v === "quiz_play" && !qzLive()) v = "quiz";   /* 옛 서버(판 퀴즈를 모름)면 유리다리 목록 */
    if (v === "game_word") v = "quiz";   /* 정리 #1(261005) 기억력 퀴즈를 지웠다 · 옛 링크는 AX 퀴즈로 */
    if (v === "game_type") v = "games";   /* 정리 #4(261005) 앱(폰) 단어 소나기를 지웠다 · 옛 링크는 미니 게임으로 */
    if (v === "wq_list" || v === "wq_play") v = "exp";   /* 정리 #5(261005) 전시 QR 퀴즈를 지웠다 · 옛 링크는 스탬프 탭으로 */
    if (v === "floor1") { PROG.seg = "always"; PROG.scroll = 0; PROG.anchor = "zone1f"; v = "guide"; }
    if (v === "guide_time") { if (SCHED.tab === "mine") { SCHED.tab = "all"; MY.seg = "sched"; PROG.anchor = "mysched"; v = "my"; } else { PROG.mode = "time"; PROG.tt = "all"; PROG.seg = "time"; v = "guide"; } }
    if (!Views[v]) v = "home";   /* 정리(261005) 지운 화면 키 · 모르는 키는 홈으로(예외 대신) */
    if (typeof sheetClose === "function" && el("axsSheet")) sheetClose(true);
    if (v === "ideas" && this.current !== "ideas") IDEA.step = null;   /* v4.07 다시 들어오면 입력 폼부터 */
    if (this.current === "guide" && v !== "guide") PROG.scroll = window.scrollY;   /* 목록 스크롤 보존 (뒤로 오면 되돌린다) */   /* v4.01 AI 사생대회 폐기 · 배너·해시(#demo=art 등)·뒤로가기를 포함한 모든 진입을 홈으로 돌린다 */
    if (this.current === "scan_q" && v !== "scan_q") { qrCamStop(); qrMineOff(); qrWakeOff(true); SCQ.paused = false; }   /* v4.06 Q02 를 떠나면 카메라를 끈다 · v5.23 내 QR 동기화도 */
      if (this.current === "game_tetris" && v !== "game_tetris") ttStop();
    if (this.current === "game_pang" && v !== "game_pang") pgStop();
    if (this.current === "type_site" && v !== "type_site") { tsfStop(); if (RG.on && RG.mode === "site") rgStop(); }
    if (this.current === "game_jump" && v !== "game_jump") jpStop();
    if (/^game_/.test(this.current || "") && v !== this.current && S.get("type_nick_edit", false)) S.set("type_nick_edit", false);   /* v4.09 닉네임을 바꾸다 헤더 뒤로 = 바꾸지 않음 */
    modalClose();
    var prev = this.booted ? this.current : null;   /* 첫 진입(딥링크·새로 고침 복귀)은 들어온 곳이 없다 */
    this.booted = true;
    /* v5.69 상세 시트 · 알림 · 딥링크 · 3D 출발(DET.canon) · 첫 진입 = 들어온 곳 대신 그 항목이 있는 목록(PARENT)을 깔고 그 위에 시트 */
    var dPrev = DET.shown.dv, dBase0 = DET.shown.base, canon = ((DET.canon && Date.now() - DET.canon < 1500) || !prev) && !isBack && detIs(v);   /* 표시는 1.5초만 유효(그 사이 App.go 가 없으면 버린다) */
    DET.canon = 0;
    if (this.ROOTS.indexOf(v) >= 0) this.from = {};
    else if (canon) { delete this.from[v]; detCanonList(v); }
    else if (!isBack && this.PARENT[v] && prev && prev !== v && SIGNAGE.indexOf(prev) < 0 && !this.isAnc(v, prev)) {
      if (this.PARENT[v] === prev) delete this.from[v]; else this.from[v] = prev;
    }
    this.current = v;
    detHist(v, isBack, dPrev);   /* v5.69 시트에서 시트로 = 앞 내용을 기억(뒤로 = 앞 내용) */
    if (TOUR_RET && v !== TOUR_RET.v && !this.isAnc(TOUR_RET.v, v)) TOUR_RET.away = true;   /* v5.73 도착한 화면 밖으로 가도 둘러보기 출처는 남는다(「3D로 돌아가기」가 앱 어디서나 · 지움 = 3D로 돌아감 · 둘러보기를 새로 엶 · 새로고침) · away = 뒤로 · 활동 마침은 더 이상 3D로 잇지 않음 · 옛 v5.53 = 밖으로 가면 지움 */
    if (typeof trdHide === "function") trdHide();   /* v5.57 화면을 옮기면 자동 복귀 띠 · 기다림을 접는다(한 판 더 · 다시 하기 · 다른 화면) */
    if (typeof wsRoleCheck === "function") wsRoleCheck();   /* v4.76 관리자 모드 = ops 방 */
    /* v3.15 새로 고침 복귀 · 현재 화면의 소속 탭을 sessionStorage 에 기억(같은 브라우저 탭에서만, 다음 방문은 홈).
       관리자·사이니지·게임 전체화면은 저장하지 않는다 · Lv2 는 소속 탭으로 저장된다 */
    try {
      if (SIGNAGE.indexOf(v) < 0 && ["admin", "game_tetris", "game_pang", "game_jump", "type_site"].indexOf(v) < 0) {
        var lt = this.tabOf(v);
        if (this.ROOTS.indexOf(lt) >= 0) {
          sessionStorage.setItem("axf_last_tab", lt);
          if (lt === "guide") sessionStorage.setItem("axf_last_fl", String(PROG.fl));
        }
      }
    } catch (e) {}
    el("frame").classList.toggle("screen-mode", SIGNAGE.indexOf(v) >= 0);
    el("frame").classList.toggle("tv-mode", v === "wall_type");   /* TV 전체화면 = 앱 폭 프레임 해제 · 260924 1F TV 현황판(스탠바이미)도 로그인 없이 늘 풀블리드(admin 전체화면 버튼을 기다리지 않는다) */
    if (v === "type_site" && tsfOn()) el("frame").classList.add("tv-mode");   /* v4.32 셀프 모드 노트북 = 앱 폭 프레임 해제 · 3단 */
    if (TVF.on && SIGNAGE.indexOf(v) < 0) { TVF.on = false; TVF.orient = null; applyTvFull(); }
    this.render();
    el("view").scrollTop = 0;
    /* v5.69 시트 = 뒤 목록 스크롤 그대로 · 목록에서 열 때 · 시트에서 시트로 · 시트를 닫을 때 · 시트에서 연 흐름에서 돌아올 때 모두 같은 자리 */
    var dNow = DET.shown.dv, nb = DET.shown.base;
    if (dNow && (dPrev ? dBase0 === nb : prev === nb)) { if (!dPrev) { DET.y = window.scrollY; DET.yb = nb; } }
    else if (dNow) { var dy0 = isBack && DET.yb === nb ? DET.y : 0; window.scrollTo(0, dy0); DET.y = dy0; DET.yb = nb; }
    else if (dPrev && v === dBase0) window.scrollTo(0, DET.yb === v ? DET.y : 0);
    else window.scrollTo(0, v === "guide" && isBack ? PROG.scroll || 0 : 0);
    if (dNow) PROG.anchor = "";
    else if (PROG.anchor) { var an = el(PROG.anchor); PROG.anchor = ""; if (an) an.scrollIntoView({ block: "start" }); }   /* v4.93 별칭 진입 · 그 자리로(scroll-margin-top = 헤더 높이) */
    else if (v === "guide" && !isBack && PROG.seg !== "always") progFlowScroll();   /* v5.21 시간표에 들어오면 진행 중 카드가 보이게 */
    if (typeof checkMyState === "function") setTimeout(checkMyState, 80);
  },
  render: function () {
    if (typeof qrGated === "function" && qrGated()) { qrGateDefer("render"); return; }   /* v4.13 인식 화면(정지 프레임)을 지운 채 다시 그리지 않는다 */
    RENDER_HELD = false;   /* v4.25 보류해 둔 그리기는 이번 그리기로 끝 */
    if (typeof LGX !== "undefined" && LGX.cur) { RENDER_HELD = true; return; }   /* v4.90 최초 로그인 장면 중에는 뒤 화면을 그리지 않는다(저장 · 동기화마다 그리던 무게가 장면을 끊었다) · 장면이 닫힐 때 그린다 */
    if (typeof wsRoleCheck === "function") wsRoleCheck();   /* v4.76 관리자 코드 확인 · 잠금 뒤 방 다시 고르기(같으면 아무 일도 안 한다) */
    var v = this.current, dv = detIs(v) ? v : null;
    if (dv) v = detBase(dv);   /* v5.69 읽기용 상세 = 뒤에 목록(헤더 · 하단 메뉴 · 본문)을 그대로 그리고 그 위에 시트(detPaint) */
    var tb = el("topbar"), par = this.parentOf(v);
    /* v4.04 헤더 = v4.02 구성 복원 (사용자 결정 260922 「헤더가 있는 게 더 갖춰진 느낌」)
       탭 루트 = 유틸 행(워드마크 · 일반/큰글씨 · 알림 종 · 설정) + 홈 인사 / 화면 이름 · 상세 = 뒤로 + 화면 이름 + 설정 */
    var gear = '<button type="button" class="axs-ib" onclick="fsSheet(true)" aria-label="설정">' + GEAR_SVG + "</button>";
    if (!par) {
      var hu = S.get("user", {}) || {}, liveN = S.get("notices", []).length, big = fsGet() > 1;
      tb.innerHTML = '<div class="axs-hrow">' +
        '<button type="button" class="axs-wm" onclick="App.tab(\'home\')" aria-label="' + APP_NAME + ' 홈">' + DotGlyph.svg(APP_NAME, { h: 12, hidden: true, accent: { n: 2, color: "var(--ax-color-brand)" } }) + '<b class="axs-wm-t"><i>AX</i> Passport</b></button>' +   /* v5.10 점 이름(AX 주황 + PASSPORT 먹색) · 345 폭 이하는 글자 */
        '<span class="axs-sp"></span>' +
        '<span class="axs-fs" role="group" aria-label="글자 크기"><button type="button" aria-pressed="' + !big + '" onclick="fsPick(1)">일반</button>' +
        '<button type="button" aria-pressed="' + big + '" onclick="fsPick(1.25)">큰글씨</button></span>' +
        '<button type="button" class="axs-ib" onclick="App.go(\'notices\')" aria-label="공지' + (liveN ? " " + liveN + "건" : "") + '">' + BELL_SVG + (liveN ? '<span class="bdg" aria-hidden="true">' + liveN + "</span>" : "") + "</button>" +
        gear + "</div>" +
        (v === "home"
          ? '<div class="axs-hgr"><span class="ax-meta">' + FESTIVAL.name + " · " + FESTIVAL.date.replace(/^2026\.\s*/, "") + " · " + FESTIVAL.place + "</span>" +   /* v5.10 헤더가 앱 이름이 되어 행사명은 홈 첫 줄에(시간은 프로그램 탭) */
            '<p class="axs-hbig">' + (hu.name ? esc(hu.name) + "님, " : "") + "오늘 <b>하루의 코스</b></p></div>"
          : '<p class="axs-hroot">' + esc(this.title(v)) + "</p>");
    } else {
      tb.innerHTML = '<div class="axs-hrow"><button type="button" class="axs-back" onclick="App.back()" aria-label="뒤로">' + BACK_SVG + "</button>" +
        '<span class="axs-htitle">' + esc(this.title(v)) + "</span>" +
        gear + "</div>" +   /* v4.15 관리자 잠금은 관리자 화면 맨 아래 「관리자 모드 끝내기」 */
        this.crumbHtml(v);   /* v4.09 경로 줄 · 헤더 구분선 바로 아래 */
    }
    tb.style.display = SIGNAGE.indexOf(v) >= 0 ? "none" : "";
    if (v === "type_site" && tsfOn()) tb.style.display = "none";   /* v4.32 셀프 모드 참가자 화면 · 헤더 없음 */
    crumbFit();
    /* 헤더 높이를 실측해 sticky 기준선으로 넘긴다 */
    el("frame").style.setProperty("--stick", tb.offsetHeight + "px");
    var nav = el("tabbar");
    document.body.dataset.pg = v === "scan_q" && SCQ.tab === "scan" ? "d" : "";   /* v5.23 내 QR 탭은 밝은 면 */   /* v4.06 · 프로그램 탭 흰 페이지(v4.05) 폐지 · 다른 탭과 같은 canvas + 흰 카드 · Q02 스캔만 카메라 화면(짙은 면) */
    nav.style.display = (SIGNAGE.indexOf(v) >= 0 || v === "sess_d" || v === "sess_cf" || v === "sess_ok" || (v === "ideas" && IDEA.step) || ["exp_g", "scan_q", "scan_res", "stair"].indexOf(v) >= 0 || v === "game_tetris" || v === "game_pang" || v === "game_jump" || v === "game_ox" || v === "type_site") ? "none" : "";
    var activeTab = this.tabOf(v), ico = this.NAV_ICO;
    var btn = function (t) {
      return '<button class="ax-nav-link"' + (activeTab === t[0] ? ' aria-current="page"' : "") + ' onclick="App.tab(\'' + t[0] + '\')">' +
        '<svg class="ax-icon" aria-hidden="true"><use href="#' + ico[t[0]] + '"/></svg><span>' + t[1] + "</span></button>";
    };
    var T = this.TABS;
    /* 가운데 = QR 화면(v5.23 사용자 261003 · 기본 내 QR · 스캔은 탭) · 주황 원 + 짙은 글리프 · 가이드 헤더 QR 과 같은 둥근 모서리 그림(qr-corners) + QR 글자 */
    nav.innerHTML = btn(T[0]) + btn(T[1]) +
      '<button class="axs-scan" onclick="qrOpen()" aria-label="내 QR · QR 스캔"><span class="axs-scan-c" aria-hidden="true">' +
      '<svg><use href="#qr-corners"/></svg><b>QR</b></span><span aria-hidden="true">내 QR</span></button>' +
      btn(T[2]) + btn(T[3]);
    el("view").dataset.v = v;
    if (v === "scan_q") el("view").dataset.qt = SCQ.tab; else delete el("view").dataset.qt;
    el("view").classList.toggle("rt", rtView(v));   /* v4.23 레트로 경계 · 게임 화면에만(design.md A-5 5-16) */
    if (rtView(v)) rtFontWarm();   /* v5.10 구역 간판은 점 글자 그림(DotGlyph)이라 도트 글꼴을 미리 읽지 않는다 */
    if (v === "ideas" && IDEA.step) el("view").dataset.st = IDEA.step; else delete el("view").dataset.st;   /* v4.07 질문·완료는 하단 고정 버튼 자리를 비운다 */
    if (v === "scan_q" && QRS.stream) qrCamStop();   /* v4.06 video 요소를 다시 그리므로 카메라를 새로 붙인다 */
    var ae = document.activeElement, aeId = ae && ae.id && el("view").contains(ae) && /^(INPUT|TEXTAREA)$/.test(ae.tagName) ? ae.id : "", aeSel = aeId ? [ae.selectionStart, ae.selectionEnd] : null;
    el("view").innerHTML = Views[v]();
    /* v4.08 아래 고정 버튼(axs-fix)이 있는 화면 = 결정·제출 화면 · 하단 메뉴를 숨기고 버튼 높이만큼 비운다 */
    var fixB = !!el("view").querySelector(".axs-fix.ax-bottom");
    if (fixB) { el("view").dataset.fix = "1"; nav.style.display = "none"; } else delete el("view").dataset.fix;
    if (aeId) { var aeN = el(aeId); if (aeN) { try { aeN.focus({ preventScroll: true }); if (aeSel) aeN.setSelectionRange(aeSel[0], aeSel[1]); } catch (e) {} } }   /* 다시 그려도 입력 중인 칸과 커서를 되돌린다 */
    if (v === "scan_q") { if (SCQ.tab === "scan") setTimeout(scanQStart, 80); else if (!QRM.timer) qrMineOn(); }   /* v5.23 카메라는 스캔 탭에서만 · 내 QR 탭은 6초 동기화 */
    if (v === "stair" && STR.mode === "start") stairTickOn();
    detPaint(dv, v);
    if (typeof SPOP !== "undefined" && SPOP.cur && !SPOP.cur.done) { var spT = spTgt(SPOP.cur); if (spT.el) spT.el.classList.add("sp-wait"); }   /* v3.49 재렌더돼도 안착 전 자리는 비어 보이게 */
    kvMountAll();
    typPromoMount();   /* v5.31 타자왕 홍보 칸 · 화면에 보일 때 src */
    updateLed();
    if (v === "home") tourInvMaybe();   /* v5.46 1층 둘러보기 초대(한 번) */
    if (typeof trfSync === "function") trfSync();   /* v5.67 둘러보기 복귀 떠 있는 단추 */
  }
};
/* v4.09 경로 줄 한 줄 맞춤 · 넘치면 가운데 단계를 앞에서부터 「…」 하나로 접는다 · 첫 단계와 지금 위치는 늘 보인다(지금 위치가 길면 말줄임) · 가로 스크롤 없음 */
function crumbFit() {
  var n = el("axsCrumb"); if (!n) return;
  var ol = n.querySelector("ol"), li = [].slice.call(ol.children);
  /* 내용 폭 합(마지막 칸은 말줄임으로 줄어들어 ol.scrollWidth 로는 넘침을 못 잡는다) */
  var need = function () {
    var w = 0;
    [].forEach.call(ol.children, function (x) {
      if (x.classList.contains("gone")) return;
      var bb = x.querySelector("b"), sp = x.querySelector(".sep");
      w += bb ? bb.scrollWidth + (sp ? sp.offsetWidth : 0) : x.scrollWidth;
    });
    return w > ol.clientWidth + 1;
  };
  if (li.length < 3 || !need()) return;
  var dot = document.createElement("li");
  dot.className = "dot"; dot.innerHTML = '<span class="sep" aria-hidden="true">›</span><span aria-label="중간 단계 생략">…</span>';
  ol.insertBefore(dot, li[1]);
  for (var i = 1; i < li.length - 1 && need(); i++) li[i].classList.add("gone");
}
/* 게임 판 중에는 경로 줄을 숨긴다(시작·결과 화면에는 보인다) */
/* LED 공지 띠는 AX-TDS 1단계(260922)에서 폐기 · 공지는 홈 맨 위 카드 한 장(homeNoticeHtml) · 30분 창(LED_TTL)은 그 카드가 이어 쓴다 */
var LED_TTL = 30 * 60000;
function updateLed() {}
setInterval(updateLed, 30000);
/* 맨 위로 · 700px 넘게 내려간 일반 화면에서만 (사이니지·게임 제외) */
window.addEventListener("scroll", function () {
  var tb = el("topbar");
  if (tb) tb.classList.toggle("scrolled", window.scrollY > 0);   /* v4.10 스크롤하면 헤더에 옅은 그림자(사용자 확정 260922) */
  var b = el("topbtn");
  if (!b) return;
  var ok = window.scrollY > 400 && !el("app").hidden &&
    SIGNAGE.indexOf(App.current) < 0 && App.current !== "game_tetris" && App.current !== "game_pang" && App.current !== "game_jump" && App.current !== "type_site";
  b.classList.toggle("on", ok);
}, { passive: true });
window.addEventListener("axf-store", function () {
  checkMyState();
  updateLed();
  if (["game_tetris", "game_pang", "game_jump", "type_site", "scan_q"].indexOf(App.current) >= 0) return;   /* v4.06 Q02 는 저장소가 바뀔 때마다 카메라를 다시 붙이지 않는다 */
  if (typingNow()) { RENDER_HELD = true; return; }   /* v4.25 글을 치는 중에는 화면을 새로 그리지 않는다(폴링·공지 도착 포함) · 칸을 벗어날 때 한 번 */
  App.render();
});
/* v4.25 입력 중 다시 그리기 보류 · #view 안 글 입력칸(체크·라디오·범위 막대 제외)에 포커스가 있으면 true */
var RENDER_HELD = false, PTR_DOWN = false;
function typingNow() {
  var a = document.activeElement;
  return !!(a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && !/^(checkbox|radio|range|button|submit)$/i.test(a.type || "") && el("view") && el("view").contains(a));
}
/* 칸을 벗어나면 보류한 그리기를 한 번 · 누르고 있는 동안은 기다린다(버튼을 누르는 중에 그 버튼이 새로 그려져 클릭이 사라지지 않게) */
function renderHeldFlush() {
  if (!RENDER_HELD || typingNow()) return;
  if (PTR_DOWN) { setTimeout(renderHeldFlush, 300); return; }
  RENDER_HELD = false;
  if (!el("app").hidden) App.render();
}
document.addEventListener("focusout", function () { if (RENDER_HELD) setTimeout(renderHeldFlush, 350); }, true);
document.addEventListener("pointerdown", function () { PTR_DOWN = true; }, true);
["pointerup", "pointercancel"].forEach(function (t) { document.addEventListener(t, function () { PTR_DOWN = false; }, true); });

/* v4.06 스캔 링크(#s= · #q=) · 히스토리 트랩(replaceState)보다 먼저 꺼내 주소에서 지운다 · 처리는 로그인 뒤 scanLinkRun (3단계 절) */
var SCANLINK_KEY = "axf_pending_scan", SCANLINK = { mem: null };
/* 주소의 #s= · #q= 를 꺼내 보관하고 주소에서 지운다 · 새로 고침·뒤로 가기로 같은 판정이 반복되지 않게 */
function scanLinkTake() {
  var h = String(location.hash || "");
  if (!/^#(s|q)=/i.test(h)) return false;
  var p = { raw: h, t: Date.now() };
  SCANLINK.mem = p;
  try { sessionStorage.setItem(SCANLINK_KEY, JSON.stringify(p)); } catch (e) {}
  try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) {}
  return true;
}
scanLinkTake();
/* v4.76 알림을 눌러 연 주소(#go=화면&n=사건키) · 주소에서 지우고 로그인 뒤 그 화면으로(pushGoRun) */
var PUSHGO = null;
function pushGoTake() {
  var m = /^#go=([a-z_]{2,20})(?:&n=([^&]*))?/.exec(String(location.hash || ""));
  if (!m) return false;
  var tag = "";
  try { tag = decodeURIComponent(m[2] || ""); } catch (e) {}
  PUSHGO = { go: m[1], tag: tag };
  try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) {}
  return true;
}
pushGoTake();

/* ── 뒤로가기 = 앱 안에서 위로 (v19) · 실수로 앱을 이탈하지 않게 히스토리 트랩 ── */
var NAV = { lastBack: 0 };
try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}   /* v5.69 뒤로(트랩 popstate)마다 브라우저가 스크롤을 맨 위로 되돌리던 것 · 스크롤은 App.go 가 정한다(시트를 닫으면 목록 자리 그대로) */
function navRepush() { try { history.pushState({ axf: 1 }, ""); } catch (e) {} }
try { history.replaceState({ axf: 0 }, ""); navRepush(); } catch (e) {}
window.addEventListener("popstate", function () {
  var app = el("app");
  if (!app || app.hidden) { navRepush(); return; }                       /* 입장 전 화면은 그대로 유지 */
  if (window.AXTour && AXTour.isOpen()) { AXTour.back(); navRepush(); return; }   /* v5.11 1층 둘러보기 · 뒤로 = 한 층씩(판 보기 → 시트 → 둘러보기) */
  /* v4.18 바텀 시트가 열려 있으면 뒤로 = 시트 닫기 (통신 중에는 닫지 않고 그대로 둔다) */
  if (el("axsSheet")) { if (!SHEET.busy) sheetClose(); navRepush(); return; }
  if (el("modal")) { if (typeof qrScanClose === "function" && el("qrVideo")) qrScanClose(); else modalClose(); navRepush(); return; }
  var fss = el("fsSheet"); if (fss && !fss.hidden) { fsSheet(false); navRepush(); return; }
  if (TVF.on) { tvFullExit(); navRepush(); return; }
  if (detShown()) { detBack(); navRepush(); return; }   /* v5.69 상세 시트 · 뒤로 = 앞 시트 내용(시트에서 시트로 왔으면) · 없으면 시트를 닫고 목록(3D 출발이어도 · 3D 는 떠 있는 「3D로 돌아가기」) · 헤더 뒤로는 시트 뒷배경 아래라 누를 수 없다 */
  var p = App.parentOf(App.current);
  if (!p && App.current !== "home") p = "home";
  if (p) { App.back(); navRepush(); return; }
  var now = Date.now();
  if (now - NAV.lastBack < 2000) { try { history.back(); } catch (e) {} return; }   /* 2초 안에 한 번 더 = 실제 종료 */
  NAV.lastBack = now;
  toast("한 번 더 뒤로 가면 앱을 나갑니다");
  navRepush();
});

/* ═══ v5.69 읽기용 상세 = 바텀 시트 (사용자 261005 「밑에서 팝업으로 튀어오르게 · 메뉴 레벨 2에서 체류」 · 기준 사용자 = 초등학생 · 50대 수석님) ═══
   탭(1단계) → 목록(2단계)에 머물고 읽고 버튼 하나 누르는 상세(3단계)는 목록 위로 올라오는 시트 하나(#axsDet).
   라우트 id(sess_d · zone_d · booth · exp_g · prizes)는 그대로다 · 알림 · 딥링크 · 옛 onclick · 3D 바로 가기 · 검사가 같은 App.go 를 쓴다.
   App.render = 뒤 목록(detBase · 그 라우트의 들어온 길에서 시트가 아닌 첫 화면)을 평소대로 그리고 시트를 그 위에 그린다(detPaint).
   시트 사양 = 아래에서 0.28초(움직임 줄이기 = 즉시) · 높이 = 내용만큼, 최대 화면 90% · 머리(손잡이 · 칩 · 제목 · 도장 · 닫기) · 본문만 스크롤 · 주 버튼은 아래 고정
   닫기 = 아래로 끌기 · 뒷배경 탭 · Esc · 닫기 단추 = 목록(스크롤 자리 그대로) · 하드웨어 뒤로 · 헤더 뒤로(App.back) = 앞 시트 내용이 있으면 그것 · 없으면 닫기
   시트에서 다른 상세로 = 내용 교체(시트 위 시트 없음 · 앞 내용은 DET.hist) · 시트에서 조작 · 흐름 화면(상담 시간 고르기 · QR 스캔 · 아이디어 등)으로 = 시트를 닫고 전체 화면 · 거기서 뒤로 = 다시 목록 위 시트
   짧은 확인 시트(#axsSheet · M03) · 팝업(#modal)은 이 시트 위에 뜬다(z 70 · 96 > 60) · 셋 모두 같은 끌어 닫기(sheetDrag) */
var DET = { shown: { dv: null, base: null }, cur: null, hist: [], y: 0, yb: null, canon: 0, ry: 0, last: {} };
var DET_V = ["sess_d", "zone_d", "booth", "exp_g", "prizes"];
/* 시트로 그리는가 · 상담 시간 고르기(신청 전 AX LOUNGE 상담)는 조작 화면이라 전체 화면 그대로 */
function detIs(v) {
  if (DET_V.indexOf(v) < 0) return false;
  if (v === "sess_d") { var s = progById(PROG.sid); if (!s) return false; if (s.id === "dap") { var r = myResv(); return !!(r && RESV_HOLD.indexOf(r.status) >= 0); } }
  return true;
}
function detShown() { return !!(DET.shown.dv && DET.shown.dv === App.current && el("axsDet")); }
/* 뒤에 깔 목록 = 들어온 길(parentOf)에서 시트가 아닌 첫 화면 */
function detBase(v) { var cur = v, hop = 0; while (cur && detIs(cur) && hop < 8) { cur = App.parentOf(cur); hop++; } return cur || "home"; }
/* 알림 · 딥링크 · 3D 출발 = 그 항목이 있는 목록 · 프로그램 탭은 그 줄이 있는 갈래(1F 구역 · 상담 · 커피챗 · 전시 = 상시 운영 · 강연 · 세션 = 시간표) · 경품 = 나의 보상 */
function detCanonList(v) {
  if (App.PARENT[v] === "guide") { var al = v === "zone_d" || (v === "sess_d" && (PROG.sid === "dap" || PROG.sid === "cchat" || PROG.sid === "expo")); PROG.seg = al ? "always" : "time"; PROG.scroll = 0; }
  if (App.PARENT[v] === "my") MY.seg = "rw";
}
function detSnap(v) { return { v: v, sid: PROG.sid, zone: PROG.zone, zchk: !!PROG.zchk, eg: EXPG.id, y: 0 }; }
function detKey(o) { return o ? o.v + "|" + (o.v === "sess_d" ? o.sid : o.v === "zone_d" ? o.zone : o.v === "exp_g" ? o.eg : "") : ""; }
function detBodyY() { var b = document.querySelector("#axsDet .axs-dbody"); return b ? b.scrollTop : 0; }
function detHist(v, isBack, dPrev) {
  if (detIs(v)) {
    if (isBack) return;
    if (dPrev && DET.cur && detKey(DET.cur) !== detKey(detSnap(v))) { DET.cur.y = detBodyY(); DET.hist.push(DET.cur); if (DET.hist.length > 12) DET.hist.shift(); }
    else if (!dPrev) DET.hist = [];
    return;
  }
  var cur = App.parentOf(v), hop = 0;   /* 시트에서 연 흐름(전체 화면)이면 기억을 둔다(뒤로 오면 그 시트 · 그 앞 내용) */
  while (cur && hop < 8) { if (detIs(cur)) return; cur = App.parentOf(cur); hop++; }
  DET.hist = [];
}
/* 뒤로 · 앞 시트 내용 → 없으면 닫기 */
function detBack() {
  var h = DET.hist.pop();
  if (!h) { detClose(); return; }
  if (App.current !== h.v) delete App.from[App.current];
  PROG.sid = h.sid; PROG.zone = h.zone; PROG.zchk = h.zchk; EXPG.id = h.eg; DET.ry = h.y || 0;
  App.go(h.v, true);
}
/* 닫기 · 끌기 · 뒷배경 · Esc · 닫기 단추 = 목록 · 3D 에서 왔으면 「3D로 돌아가기」를 목록에 남긴다(목록에서 뒤로 = 3D) */
function detClose() {
  var v = App.current; if (!detIs(v)) return;
  var base = detBase(v), cur = v, hop = 0;
  DET.hist = [];
  while (cur && cur !== base && hop < 8) { var p = App.parentOf(cur); delete App.from[cur]; cur = p; hop++; }
  if (TOUR_RET && (TOUR_RET.v === v || App.isAnc(TOUR_RET.v, v))) TOUR_RET.v = base;
  App.go(base, true);
}
var DET_SPEC = { sess_d: function () { return sessSheet(); }, zone_d: function () { return zoneSheet(); }, booth: function () { return boothSheet(); }, exp_g: function () { return expgSheet(); }, prizes: function () { return prizeSheet(); } };
/* 그리기 · 같은 내용이면 칸마다 글이 바뀐 곳만 바꾼다(동기화마다 다시 그려도 시트 안 스크롤 · 영상 · 펼침이 그대로) */
function detPaint(dv, base) {
  var w = el("axsDet"), was = DET.shown;
  DET.shown = { dv: dv, base: base };
  if (!dv) { if (w) detGone(w, was.dv && was.base === base); document.documentElement.classList.remove("det-lock"); return; }
  var sp = DET_SPEC[dv]() || {}, snap = detSnap(dv), first = !w, same = !first && DET.cur && detKey(DET.cur) === detKey(snap);
  if (first) w = detMake();
  var pan = w.firstChild, bd = pan.querySelector(".axs-dbody"), ft = pan.querySelector(".axs-dft"), y = same ? bd.scrollTop : DET.ry || 0;
  DET.ry = 0;
  pan.className = "ax-sheet axs-dsh" + (sp.cls ? " " + sp.cls : "");   /* 1F 구역 = 판 문법 경계(zoneSheet cls · 간판 칩 · 하는 일 · ink 줄) */
  /* 머리 = [칩 줄 | 닫기] → [제목 | 도장](칩이 없으면 [제목 | 닫기] 한 줄) */
  var xb = '<button type="button" class="axs-x" onclick="detClose()" aria-label="닫기">' + X_SVG + "</button>", h2 = '<h2 class="ax-type-t2" id="axsDetT">' + sp.title + "</h2>";
  var hd = sp.chips ? '<div class="axs-dtop"><div class="axs-chiprow axs-dchips">' + sp.chips + "</div>" + xb + '</div><div class="axs-dtt">' + h2 + (sp.seal || "") + "</div>"
    : '<div class="axs-dtop axs-dtt">' + h2 + (sp.seal || "") + xb + "</div>";
  var fo = (sp.help ? '<p class="ax-meta">' + esc(sp.help) + "</p>" : "") + (sp.foot || "");
  var put = function (n, k, h) { if (!same || DET.last[k] !== h) { n.innerHTML = h; DET.last[k] = h; } };
  put(pan.querySelector(".axs-dhx"), "hd", hd);
  put(bd, "bd", sp.body || "");
  put(ft, "ft", fo);
  ft.hidden = !fo;
  bd.scrollTop = y;
  if (!same && !first && !lgxRM()) { bd.classList.remove("sw"); void bd.offsetWidth; bd.classList.add("sw"); }   /* 시트에서 시트로 = 본문만 살짝 바뀜 */
  if (PROG.anchor) { var an = el(PROG.anchor); if (an && bd.contains(an)) bd.scrollTop = Math.max(0, an.getBoundingClientRect().top - bd.getBoundingClientRect().top + bd.scrollTop - 8); }
  DET.cur = snap;
  document.documentElement.classList.add("det-lock");
  detOv();
  if (first) { try { pan.focus({ preventScroll: true }); } catch (e) {} }
}
function detMake() {
  var w = document.createElement("div"); w.id = "axsDet";
  w.innerHTML = '<div class="ax-sheet axs-dsh" role="dialog" aria-modal="true" aria-labelledby="axsDetT" tabindex="-1">' +
    '<div class="axs-dhd"><span class="axs-grab" aria-hidden="true"></span><div class="axs-dhx"></div></div>' +
    '<div class="axs-dbody"></div><div class="axs-dft"></div></div>';
  DET.last = {};
  w.addEventListener("click", function (e) { if (e.target === w) detClose(); });
  w.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); detClose(); return; }
    if (e.key !== "Tab") return;
    var b = [].slice.call(w.querySelectorAll("button:not([disabled]), a[href]")).filter(function (x) { return x.offsetParent; });
    if (!b.length) { e.preventDefault(); return; }
    var i = b.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); b[b.length - 1].focus(); }
    else if (!e.shiftKey && i === b.length - 1) { e.preventDefault(); b[0].focus(); }
  });
  var bd = w.querySelector(".axs-dbody");
  bd.addEventListener("scroll", detOv, { passive: true });
  el("frame").appendChild(w);
  sheetDrag(w, function () { return w.firstChild; }, { scroller: function () { return bd; }, close: detClose });
  if (!lgxRM()) w.classList.add("in");
  return w;
}
/* 아래 고정 칸 위 구분선 = 본문이 그 아래로 더 있을 때만 */
function detOv() {
  var bd = document.querySelector("#axsDet .axs-dbody"), ft = document.querySelector("#axsDet .axs-dft");
  if (bd && ft) ft.classList.toggle("ov", bd.scrollHeight - bd.clientHeight - bd.scrollTop > 2);
}
/* 사라지기 · 같은 목록으로 닫히면 아래로 0.22초 · 다른 화면으로 가면 바로(새 화면이 그 자리에 그려진다) · 끌어서 닫았으면 이미 내려가 있다 */
function detGone(w, toBase) {
  w.removeAttribute("id");
  var pan = w.firstChild;
  if (!toBase || lgxRM() || w.dataset.drop) { w.remove(); return; }
  w.classList.remove("in"); w.classList.add("out");
  if (pan) { pan.style.transition = "transform 0.22s cubic-bezier(0.4, 0, 1, 1)"; pan.style.transform = "translateY(105%)"; }
  setTimeout(function () { w.remove(); }, 230);
}
/* 끌어 닫기 · 시트 셋(#axsDet · #axsSheet · #modal) 공통 · 머리(손잡이 · 제목 줄)는 어디서나 · 본문은 맨 위에서 아래로 끌 때만(그 밖에는 본문 스크롤)
   멀리(높이 30% 또는 160px) 또는 빠르게 끌면 닫힘 · 아니면 제자리 · 손을 따라 뒷배경이 옅어진다 · 움직임 줄이기 = 끌기는 그대로 · 되돌아가는 움직임 없음 */
function sheetDrag(box, getPan, o) {
  var D = null, T = null, M = null;
  var head = function (t, y, pan) { return !!t.closest(".axs-dhd, .axs-mhead, .axs-grab") || y - pan.getBoundingClientRect().top < 28; };
  var start = function (y) {
    var pan = getPan(); if (!pan || (o.can && !o.can())) return false;
    D = { pan: pan, y0: y, y: y, t: Date.now(), v: 0, h: pan.offsetHeight || 1 };
    pan.style.transition = "none"; box.classList.add("drag");
    return true;
  };
  var move = function (y) {
    if (!D) return;
    var dy = Math.max(0, y - D.y0), now = Date.now();
    D.v = (y - D.y) / Math.max(1, now - D.t); D.y = y; D.t = now;
    D.pan.style.transform = dy ? "translateY(" + dy + "px)" : "";
    box.style.setProperty("--dd", String(Math.max(0, 1 - dy / D.h).toFixed(3)));
  };
  var end = function () {
    if (!D) return;
    var d = D, dy = Math.max(0, d.y - d.y0); D = null; box.classList.remove("drag");
    if (dy > Math.min(160, d.h * 0.3) || (d.v > 0.5 && dy > 24)) {
      d.pan.style.transition = lgxRM() ? "none" : "transform 0.18s cubic-bezier(0.4, 0, 1, 1)"; d.pan.style.transform = "translateY(105%)"; box.style.setProperty("--dd", "0");
      box.dataset.drop = "1";
      setTimeout(function () { o.close(); }, lgxRM() ? 0 : 170);
      return;
    }
    d.pan.style.transition = lgxRM() ? "none" : "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"; d.pan.style.transform = ""; box.style.removeProperty("--dd");
  };
  box.addEventListener("touchstart", function (e) {
    T = null; if (D || e.touches.length !== 1) return;
    var t = e.target, pan = getPan(); if (!pan || !pan.contains(t) || t.closest("input, textarea, select, iframe")) return;
    var sc = o.scroller ? o.scroller() : pan, y = e.touches[0].clientY;
    T = { y0: y, hd: head(t, y, pan), sc: sc, top: !sc || sc.scrollTop <= 0, live: false };
  }, { passive: true });
  box.addEventListener("touchmove", function (e) {
    if (!T) return;
    var y = e.touches[0].clientY, dy = y - T.y0;
    if (!T.live) {
      if (Math.abs(dy) < 6) return;
      if (dy > 0 && (T.hd || (T.top && (!T.sc || T.sc.scrollTop <= 0))) && start(T.y0)) T.live = true;
      else { T = null; return; }
    }
    if (e.cancelable) e.preventDefault();
    move(y);
  }, { passive: false });
  var tEnd = function () { if (T && T.live) end(); T = null; };
  box.addEventListener("touchend", tEnd); box.addEventListener("touchcancel", tEnd);
  /* 마우스 · 펜 = 머리만 */
  box.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch" || e.button > 0 || D) return;
    var t = e.target, pan = getPan(); if (!pan || !pan.contains(t) || t.closest("button, a, input, textarea, select") || !head(t, e.clientY, pan)) return;
    if (!start(e.clientY)) return;
    M = function (ev) { move(ev.clientY); };
    var up = function () { window.removeEventListener("pointermove", M); window.removeEventListener("pointerup", up); M = null; end(); };
    window.addEventListener("pointermove", M); window.addEventListener("pointerup", up);
  });
}

