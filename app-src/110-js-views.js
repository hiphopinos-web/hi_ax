var Views = {
  /* ═══ 홈 = 「내 것」만 (260830 사용자 지시: 첫 화면이 복잡하면 안 된다)
     지금 어디에 있어야 하는가 · 내가 신청한 것 · 내가 받을 것. 이 셋 외에는 두지 않는다.
     행사 전체에 관한 것(프로그램 목록·혼잡도·월·게임·아이디어)은 각 탭이 맡는다. ═══ */
  /* v3.13 홈 위계 재배치 (사용자 확정): 스탬프 → 나의 일정(지금·다음 흡수) → 광고판 (v3.50 예외 자리는 포토부스 알림만).
     v3.31c (260917 사용자 확정) 층별 혼잡도 참여자 화면 삭제 · 홈 = [포토부스 알림] → 광고판 → 스탬프 → 나의 일정.
     v4.62 (260929 사용자 결정) 층별 혼잡도를 홈 맨 아래(나의 일정 다음)에 되살린다 · 260917 삭제 결정을 뒤집음.
     운영 쪽 존 등급 입력(ZONE_GRADE)·백엔드 grade·입장 스캔 동선 집계는 유지.
     히어로(지금 진행 중)는 나의 일정 첫 줄로 흡수 · 스탬프는 행사 전·당일·후 항상 맨 위 */
  /* ═══ 홈 (H01 · AX-TDS v1 260922) = 지금 할 일 ═══
     공지 카드 한 장(있을 때만) → 포토부스 호출(급한 내 것) → 인사 → 진행 중 카드(화면의 주 행동) → 전체 시간표 · 체험 찾기 → 광고판.
     광고판은 사용자 결정(260922)으로 남긴 예외 · v4.17(260923)부터 다시 주황 스테이지 · 그림자 없음.
     옛 홈의 스탬프 레일 · 나의 일정은 나의 참여(M01)로 옮겼다. */
  /* v4.04 (사용자 결정 260922 「메인 화면은 기존 버전이 더 좋아 보인다」) 홈 = v4.02 구성과 순서로 복원 ·
     인사는 헤더 · 공지 카드 한 장(흐르는 띠 대신, 1단계 것 유지) → 포토부스 호출 → 광고판 → 스탬프 레일 → 나의 일정(지금·다음 + 내 항목).
     1단계 H01(진행 중 카드 · 시간표 · 체험 찾기)의 homeNowHtml 은 남겨 둔다(다른 곳에서 부르지 않는다). */
  home: function () {
    return '<div class="ax-stack">' +
      betaBannerHtml() +   /* v4.55 클로즈 베타 배너 · 맨 위 흰 줄 · 값 없으면 빈 문자열 */
      homeNoticeHtml() +
      drawCardHtml() + entryAskHtml() +   /* v4.84 Outro 추첨 체크인(16:40~17:25 · 체크인 전만) · 광고판 위 조건부 자리 · v4.89 접속 방법 질문(하루 한 번) */
      billboardHtml() +
      tourHeroHtml() +   /* v5.46 행사 전 1층 둘러보기 큰 카드 · 광고판 바로 아래 · 스탬프 위(광고판 자리는 그대로 · design.md A-5) */
      '<section class="axs-sec axs-railgo" onclick="if (!event.target.closest(\'.mk, .sect span\')) App.tab(\'exp\')">' + myCouponHtml() + "</section>" +   /* v4.84 레일 면을 누르면 스탬프 탭 · 마커는 v4.02 대로 룰렛·응모 안내 */
      '<section class="axs-sec">' + myScheduleHtml() + "</section>" +
      tourHomeHtml() +   /* v5.11 1층 둘러보기 입구 · 나의 일정 아래 · 혼잡 위(광고판보다 위로 올리지 않는다 · design.md A-5) */
      '<section class="axs-sec">' + crowdStripHtml() + "</section>" +   /* v4.62 층별 혼잡도 복원(260929) · v4.71 혼잡 제보 2칸 · v4.73 엘리베이터 혼잡은 홈 맨 위 카드 없이 이 2칸에서만 */
      "</div>";
  },

  /* ═══ 나의 참여 (M01) · 개인 기록의 목적지 ═══ */
  /* v4.13 재구성(사용자 확정 260922) · 맨 위 스탬프 현황 카드(홈과 같은 railHtml + 다음 보상까지 + 주 버튼 「스탬프 보기」 · 카드 전체 탭)
     → 목적지 행 내 일정 → 내 보상 → 신청·대기 현황(17F 강연 · DAP 상담 · 커피챗 신청 + 포토부스 대기 번호) · 「내 QR 보여주기」 삭제 */
  my: function () {
    /* v5.65 (사용자 261005 「프로그램 탭처럼 나의 시간표 나의 보상 이렇게 두 탭을 나누고」 · 이름은 「나의 일정」) 맨 위 = 프로그램 탭과 같은 세그먼트 [나의 일정 | 나의 보상]
       나의 일정 = 옛 나의 일정 줄 그대로(myAgendaHtml) · 나의 보상 = 옛 스탬프 한 줄 · 경품 한 줄 · 내 보상 화면(rewards)을 한 흐름으로(myRewardHtml)
       처음 = 일정이 있으면 나의 일정 · 없으면 나의 보상(MY.seg 가 비었을 때) · 알림 · 딥링크 = 라우터가 갈래를 정한다(my_sched · guide_time mine = 일정 · rewards = 보상) */
    var g = myTabSeg();
    return '<div class="ax-stack">' +   /* v4.06 탭 첫 화면 큰 제목 삭제(사용자 결정 260922 · 화면 이름은 헤더) */
      '<div class="axs-seg" role="tablist" aria-label="나의 참여 보기">' +
      '<button type="button" role="tab" aria-selected="' + (g === "sched") + '" onclick="mySeg(\'sched\')">나의 일정</button>' +
      '<button type="button" role="tab" aria-selected="' + (g === "rw") + '" onclick="mySeg(\'rw\')">나의 보상</button></div>' +
      (g === "sched" ? myAgendaHtml() : myRewardHtml()) + "</div>";
  },

  /* ═══ 체험 (E01) · 현장에서 / 앱에서 ═══
     현장 = 기존 스탬프 카드·부스·QR 퀴즈·포토부스 화면으로 연결 + 같은 스캔 기능(v5.23 가운데 QR 버튼 = QR 화면 [내 QR | QR 스캔]).
     앱 = 미니게임(AX 올림픽 순위·포디움 입구 포함) · 아이디어 · 설문. 작품 갤러리는 넣지 않는다(AI 사생대회 폐기 260919). */
  /* ═══ v4.84 (261001 앱 개편 2묶음 · 기획안 5-4 안 1 · 레드팀 채택) 스탬프 탭 = 하단 메뉴 「스탬프」(라우트 id 는 exp 유지 · 옛 passport 는 이 화면 별칭)
     레일 → 「스탬프 8종 · 6개까지 인정」 → 번호 순서 고정 한 목록(완료는 자리 그대로 체크만) · 행마다 수단 칩(폰으로 · 현장 · 스태프 인증)
     AX 퀴즈 · 미니 게임 행은 종목 타일(누르면 그 종목 시작 화면 · 탭에서 두 번) · 아래 「구경하고 겨루기 · 1F 타자왕」(스탬프 없음)
     옛 「현장에서 / 앱에서」 두 칸 · 「신청이 필요한 프로그램」은 걷어냈다(상담 · 커피챗 · 포토부스 행은 프로그램 탭 아래 메뉴로) ═══ */
  exp: function () {
    var st = S.get("stamps", []), n = stampCount(), seen = S.get("pp_seen", []);
    var newly = st.filter(function (id) { return seen.indexOf(id) < 0 && stampKnown(id); });
    var glow = n >= 3 && !S.get("roulette_used", false) && !S.get("pp_glow3", false);
    /* v3.49 서버 동기화 등으로 들어온 새 스탬프 1개는 같은 팝 · 여러 개면 조용히 본 것으로(옛 passport 규칙 그대로) */
    if (newly.length === 1) setTimeout(function () { var id1 = newly[0]; if (S.get("stamps", []).indexOf(id1) >= 0 && S.get("pp_seen", []).indexOf(id1) < 0) stampOverlay(id1); }, 0);
    else if (newly.length > 1) setTimeout(function () { S.set("pp_seen", seen.concat(newly)); }, 0);
    if (glow) ppAfterRender(n, n, glow);
    var testBar = !testMode() ? "" :
      '<p class="scap" style="margin:0 2px 8px">테스트 ' + (BE.on ? "계정" : "모드") + ' · 스탬프는 이 기기에만 기록됩니다 · <span style="cursor:pointer;text-decoration:underline" onclick="testStampReset()">스탬프 초기화</span> · <span style="cursor:pointer;text-decoration:underline" onclick="testMineShuffle()">테스트 · 나의 일정 다시 섞기</span></p>';
    var full = n >= STAMP_DENOM;
    return '<div class="ax-stack axs-stpv">' + testBar +
      '<section class="axs-sec">' + railHtml(n, glow, null, false) + "</section>" +
      '<section class="axs-sec"><div class="sect"><b>스탬프 ' + STAMPS.length + "종</b><span>" + (full ? STAMP_DENOM + "개 모두 모았어요" : STAMP_DENOM + "개까지 인정") + "</span></div>" +
      '<div class="axs-stps">' + STAMPS.map(function (s, i) { return stpRowHtml(s, i, st, full); }).join("") + "</div>" +
      scanQNote() + '<p class="lnk sub" onclick="staffStampOpen()">' + lnkChev("담당자 적립") + "</p></section></div>";   /* v4.91 1F 타자왕(스탬프 아님)은 프로그램 탭 「상시 운영」로 옮겼다 */
  },
  /* v4.84 옛 「현장에서 / 앱에서」 체험 화면은 지웠다 · 아래 exp_g(체험 안내) · 스캔 · 결과 · 계단은 그대로 */

  /* ═══ v4.06 3단계 · E02 체험 안내 · Q02 스캔 · Q03 결과 · 계단 (주 행동은 하단 고정) ═══ */
  exp_g: function () { return expGuideHtml(); },
  scan_q: function () { return scanQHtml(); },
  scan_res: function () { var r = scanResHtml(); return '<div class="ax-stack axs-res">' + r.body + "</div>" + r.btn; },
  stair: function () { var r = stairHtml(); return '<div class="ax-stack axs-stairv' + (STR.mode === "start" ? " axs-sthost" : "") + '">' + r.body + "</div>" + r.btn; },   /* v4.70 진행 중만 오른쪽 위 도장 */

  /* ═══ 미니게임 · 체험 › 앱에서 · 기존 AX 올림픽 허브(종목 4 + 순위판·포디움 입구) 그대로 (게임 화면 재디자인은 4단계) ═══ */
  games: function () {
    return '<div class="oly-hub">' + olyHubHtml() + "</div>";
  },
  /* v4.83 (261001 사용자 수정) AX 퀴즈 · 게임 허브와 따로 · O/X · 기억력 */
  quiz: function () {
    return '<div class="oly-hub">' + (qzLive() ? qzHubHtml() : quizHubHtml()) + "</div>";   /* v4.96 판 퀴즈 목록(한 행) */
  },
  quiz_play: function () { return quizPlayHtml(); },   /* v4.96 판 퀴즈 · 문항 · 해설 · 결과(헤더 · 하단 메뉴 그대로) */

  /* ═══ 내 보상 (M05 모양 · 1단계) · 사용 가능 / 사용 완료 · 사용 방법은 기존 모달(룰렛 QR · 응모 번호) ═══ */
  /* v5.65 옛 내 보상 화면(사용 가능 · 사용 완료 칩 + 카드 + 경품 입구)은 나의 참여 › 나의 보상 갈래로 합쳤다 · 라우터가 rewards 를 my 로 돌린다 · 여기는 닿지 않는 안전망 */
  rewards: function () { MY.seg = "rw"; return Views.my(); },

  /* ═══ v5.08 경품 포스터 · 화면 조각은 prizePosterHtml(경품 안내 절) ═══ */
  prizes: function () { return prizePosterHtml(); },


  notices: function () {
    var notices = S.get("notices", []).slice().sort(function (a, b) { return b.ts - a.ts; }).concat(DEFAULT_NOTICES);
    return notices.map(function (n) {
      return '<div class="card soft mb8 axs-ntc">' + (n.pinned ? '<span class="axs-ntc-pin">고정</span>' : "") +   /* v5.66 (디자인 감사 261005 D4) 옛 v28 크기 · 굵기 → AX-TDS 타입 토큰(CSS axs-ntc) */
        '<b class="axs-ntc-t">' + esc(n.title) + '</b><p class="axs-ntc-b">' + esc(n.body) + "</p>" +
        (n.ts > 0 ? '<p class="axs-ntc-d">' + fmtTime(n.ts) + "</p>" : "") + "</div>";
    }).join("");
  },

  /* ME to WE 월 참여자 화면(wallv)은 v3.1 폐지 · 월은 1F 사이니지 전용 (wall_metowe·wall_tv 등 SIGNAGE 유지) */

  /* TV 전체화면 · 가로 대형 화면 송출용 (좌: 월 풀블리드 / 우: 카운터·언락) */
  /* ═══ v3.37 현장 타자왕전 · 진행(스태프 노트북) · TV 순위판(로그인 없음) · Outro 시상 ═══ */
  /* v4.32 1F 현장 셀프 모드 · 꺼져 있으면 스태프 켜기 화면(관리코드) · 켜져 있으면 참가자 전용 3단 화면(tsfHtml) */
  type_site: function () {
    if (!tsfOn()) { tsfStop(); return tsfSetupHtml(); }
    SFX.site = true;
    setTimeout(tsfMount, 0);
    return tsfHtml();
  },
  wall_type: function () {
    if (TYTV.fix === "site") return hsHtml();   /* v4.59 1F 타자왕 부스 TV(#tv=type&fix=site) · 현장 TOP 10 고정 · 아래 12초 순환·올림픽 받기 없음 */
    tyTvPull();
    if (!TYTV.flip) TYTV.flip = setInterval(tyTvTick, 12000);
    olyPull();
    var oly = TYTV.show === "oly", oly2 = TYTV.show === "oly2", site = !oly && !oly2, r = TYTV.site;
    var winTxt = TYTV.site && TYTV.site.win ? TYTV.site.win.join(" · ") : "";
    return '<div class="screen-wrap tytv"><div class="row" style="justify-content:space-between;flex-wrap:wrap;padding-top:8px">' +
      '<b class="tytv-brand">AX Festival <span>2026</span></b>' +
      '<div class="row" style="gap:6px">' + tvBtns() + (S.get("admin_authed", false) ? '<button class="chip" style="background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.3);white-space:nowrap" onclick="App.go(\'admin\')">← 콘솔</button>' : "") + "</div></div>" +
      /* v4.83 (261001) 종합 = 미니 게임 세 종목(옛 서버면 다섯 종목 · 순위판 oev 로 고른다) · AX 퀴즈는 TV 순위에 없다 */
      '<p class="tytv-k">' + (oly ? olyOvName() + " · 종합 순위" : oly2 ? olyOvName() + " · 종목별 1~3위" : "AX 단어 소나기 · 1F 현장 타자왕전") + "</p>" +
      '<p class="tytv-t">' + (oly ? olyOvSum() + " 최고 점수 합계 · " + olyFmt(olyMax()) + "점 만점" : oly2 ? olyOvEvents().map(function (e) { return e.short; }).join(" · ") : "현장 타자왕전 상위 5") + "</p>" +
      '<div class="tytv-seg"><span class="' + (site ? "on" : "") + '">현장 타자 5</span><span class="' + (oly ? "on" : "") + '">' + (olyOvName() === "미니 게임" ? "미니 게임" : "올림픽") + ' 종합</span><span class="' + (oly2 ? "on" : "") + '">' + (olyOvName() === "미니 게임" ? "미니 게임" : "올림픽") + " 종목별</span></div>" +
      (oly ? olyTvPodium() : oly2 ? olyTvEvents() : '<div class="tytv-list five">' + tyTvRows(r, 5) + "</div>") +
      '<p class="tytv-foot">' + (oly || oly2 ? "종목마다 최고 한 판 · 종목 최대 " + olyFmt(olyCap()) + "점 · 명예 순위" : "운영 " + esc(winTxt) + " · 1인 " + ((TYTV.site && TYTV.site.tries) || 3) + "회 · 최고 기록 · 17:00 마감 · 1~3위 Outro 시상") + "</p></div>";   /* v4.16 가짜 닉네임 표기 삭제 · TV 는 항상 실서버 값 */
  },
  type_award: function () {
    if (S.get("tyaw_tab", "type") === "oly" && S.get("admin_authed", false)) return olyAwardHtml();
    if (!S.get("admin_authed", false)) return '<div class="screen-wrap"><p style="padding:40px 8px">관리자 콘솔에 로그인한 뒤 열어 주세요</p><button class="btn mint" onclick="App.go(\'admin\')">관리자 콘솔</button></div>';
    tyAwardPull();
    var d = TYAW.data, hide = S.get("tyaw_hide", false), top = (d && d.top) || [];
    return '<div class="screen-wrap tytv"><div class="row" style="justify-content:space-between;padding-top:8px;flex-wrap:wrap;gap:6px">' +
      '<b class="disp" style="font-size:24px;letter-spacing:0.03em">AX Festival <span style="color:var(--mint-deep)">2026</span></b>' +
      '<div class="row" style="gap:6px;flex-wrap:wrap">' + tvBtns() +
      '<button class="chip" style="background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.3);white-space:nowrap" onclick="tyAwardPull(true)">새로고침</button>' +
      '<button class="chip" style="background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.3);white-space:nowrap" onclick="S.set(\'tyaw_hide\', ' + (hide ? "false" : "true") + ')">실명 ' + (hide ? "보이기" : "가리기") + "</button>" +
      '<button class="chip" style="background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.3);white-space:nowrap" onclick="App.go(\'type_site\')">← 진행 화면</button></div></div>' +
      olyAwardTabs("type") +
      '<p class="tytv-k">17:00 OUTRO · 시상</p><p class="tytv-t">1F 현장 타자왕전 결과</p>' +
      '<div class="tytv-list five">' + (top.length ? top.map(function (x) {
        return '<div class="tytv-row' + (x.rank <= 3 ? " top" : "") + '"><span class="no">' + x.rank + '</span><span class="nm">' + esc(x.nick || "익명 참가자") +
          (hide ? "" : '<small>' + esc(x.name || "") + (x.dept ? " · " + esc(x.dept) : "") + "</small>") + '</span><span class="sc">' + typePts(x.score) + "<small>정확도 " + x.acc + "%</small></span></div>";   /* v5.12 1F 타자왕 = 점수 */
      }).join("") : '<p style="padding:24px 4px;opacity:0.7">' + (d ? "아직 현장 기록이 없습니다" : "불러오는 중") + "</p>") + "</div>" +
      '<p class="tytv-foot">동점은 정확도, 그다음 먼저 기록한 쪽 · 1~3위 시상 · 운영 ' + esc(((d && d.win) || []).join(" · ")) + "</p></div>";
  },

  /* v4.84 옛 스탬프 화면(passport · 아코디언 카드) = 스탬프 탭(exp) 별칭 · App.go 가 exp 로 돌린다(옛 해시 · 알림 · onclick 호환) · 직접 렌더 대비 */
  passport: function () { return Views.exp(); },

  ideas: function () {
    var mine = S.get("ideas", []).filter(function (i) { return i.empId === (S.get("user", {}).empId); });
    var cchat = S.get("cchat", null);
    /* v4.07 제출 뒤 두 장 · 질문(예 = 주 버튼 · 아니요 = 약한 버튼) → 완료 */
    if (IDEA.step === "ask" && cchatClosed()) IDEA.step = "done";   /* v4.47 마감이면 묻지 않는다 */
    if (IDEA.step === "ask") {
      return '<div class="ax-stack axs-okwrap">' +
        '<div class="ax-stack-tight axs-gap12 axs-center-tx"><p class="ax-meta">아이디어 제출 완료</p><h1 class="ax-type-t2">커피챗에 참석하시겠어요?</h1>' +
        '<p class="ax-body">' + CCHAT_TXT.replace(" · ", "<br>") + "</p></div>" +
        '<div class="ax-card ax-stack-tight axs-gap12"><p class="ax-card-title">AX 커피챗 · 18F</p><p class="ax-description">선착순 ' + CCHAT_CAP + "명<br>고른 시간대에 맞춰 매칭해요<br>" + CCHAT_NOTE.replace(" · ", "<br>") + "</p></div>" + cchatPrefHtml("ask") + "</div>" +
        '<div class="ax-bottom axs-fix">' + progBtn(cchatPref().length ? "참석할게요" : "시간대를 골라 주세요", "ideaCchat(1)", "", "ideaYes", !cchatPref().length) + progBtn("참석하지 않을게요", "ideaCchat(0)", "ax-button-weak", "ideaNo") + "</div>";   /* v4.45 선호 시간대를 골라야 참석 */
    }
    if (IDEA.step === "done") {
      var cl = !cchat ? (cchatClosed() ? "커피챗은 선착순 " + CCHAT_CAP + "명이 모두 찼어요" : "커피챗은 프로그램 › 상담에서 언제든 신청할 수 있어요") : cchat.status === "matched" ? "커피챗 매칭 완료 · " + esc(cchat.round) + " TABLE " + esc(cchat.table) : "커피챗 신청 완료 · " + CCHAT_NOTE;
      return '<div class="ax-stack axs-okwrap">' +
        '<span class="axs-okmark">완료</span>' +
        '<div class="ax-stack-tight axs-gap12 axs-center-tx"><h1 class="ax-type-t2">아이디어를 제출했어요</h1>' +
        '<p class="ax-body">' + IDEA_AWARD_TXT + "</p></div>" +
        '<div class="ax-card ax-stack-tight axs-gap12"><p class="ax-card-title">AX 커피챗</p><p class="ax-description" id="ideaCcLine">' + cl + "</p></div></div>" +
        '<div class="ax-bottom axs-fix">' + progBtn("내가 낸 아이디어 보기", "App.go(\'ideas_mine\')")   /* v5.67 둘러보기 복귀 = 떠 있는 「3D로 돌아가기」(trf) 하나 */ + progBtn("한 줄 더 남기기", "IDEA.step=null;App.render()", "ax-button-weak") + "</div>";
    }
    /* v4.08 입력·제출 화면 = 전체 화면 · 하단 메뉴 숨김 · 아래 고정 주 버튼(5글자 이상이면 켜짐) + 약한 버튼
       쓴 내용은 어떤 경우에도 지우지 않는다(IDEA.draft · 기기 저장 idea_draft · 다시 그려도 그대로) · 공백은 글자 수에서 뺀다 */
    /* v5.39 (사용자 261003 「2,000자 이상 · 아래 예시 및 분류는 없애자」) 최대 IDEA_MAX(3,000)자 · 칸은 쓰면 늘고 최대 높이 안에서 스크롤 · 예시 칩 · 분야 칩은 그리지 않는다(코드 IDEA_EX · ideaEx · pickTag 는 보존) · 분야는 빈 값으로 보낸다 */
    var dr = ideaDraft(), n = ideaLen(dr);
    setTimeout(ideaFit, 0);
    return '<div class="ax-stack axs-form">' +
      '<div class="ax-stack-tight axs-gap12 axs-sthost">' + stampTagHtml("p5") + '<h1 class="ax-type-t2">문득 떠오른<br>&ldquo;이거 AI로 되겠는데?&rdquo;</h1>' +
      '<p class="ax-body" id="ideaAward">' + IDEA_AWARD_TXT + "</p></div>" +
      '<div class="ax-stack-tight"><label class="ax-sr-only" for="ideaText">아이디어 한 줄</label>' +
      '<textarea id="ideaText" class="ax-field axs-ta axs-grow" rows="4" maxlength="' + IDEA_MAX + '" placeholder="떠오른 생각을 자유롭게 적어 주세요" oninput="ideaInput(this.value)" onfocus="kbFocus(this)" aria-describedby="ideaLeft">' + esc(dr) + "</textarea>" +
      '<div class="axs-cnt"><p class="ax-meta" id="ideaLeft" aria-live="polite">' + ideaLeftTxt(n, dr) + '</p><p class="ax-meta"><span id="ideaCnt">' + dr.length.toLocaleString() + "</span>/" + IDEA_MAX.toLocaleString() + "</p></div></div>" +
      '<label class="axs-check"><input type="checkbox" id="ideaAnon"' + (IDEA.anon ? " checked" : "") + ' onchange="IDEA.anon=this.checked">익명으로 표시 (시상 시에만 본인 확인)</label>' +
      (IDEA.err ? '<div class="axs-err" role="alert"><b>' + esc(IDEA.err) + "</b><span>쓴 내용은 그대로 있어요</span></div>" : "") +
      (mine.length ? '<button type="button" class="ax-link axs-plain axs-self" onclick="App.go(\'ideas_mine\')">내가 낸 아이디어 ' + mine.length + "건</button>" : "") +
      "</div>" +
      '<div class="ax-bottom axs-fix"><button type="button" class="ax-button" id="ideaGo" onclick="submitIdea()"' + (ideaOk(dr) ? "" : " disabled") + ">제출하기</button></div>";   /* v4.09 버튼 하나 · 나가기는 헤더 뒤로 */
  },

  /* ═══ v3.35 오늘 한 판 설문 · v3.52b SURVEY_Q 한 곳으로 그리는 범용 단계 ═══ */
  survey: function () {
    var d = svDraft(), Q = SURVEY_Q, n = Q.length, priv = '<p class="scap" style="margin:0 2px 8px">답은 이름 없이 저장됩니다 · 제출하면 스탬프 1개</p>';
    if (surveyDone()) {
      return '<div class="card mb12">' + stampLineHtml("sv", '<b style="font-size:calc(17px * var(--fs));color:var(--hi)">제출 완료</b>') + "</div>";   /* 정리 #8(261005) 휴면 밸런스 막대 지움 */
    }
    if (!surveyOpen()) return '<div class="ax-stack">' + stampLineHtml("sv") + botHtml(SURVEY.open + "에 열려요") + "</div>";
    if (surveyLock() === "nostamp") return '<div class="ax-stack">' + stampLineHtml("sv") + botHtml("스탬프를 하나 모으면 열려요") + '<button type="button" class="ax-button ax-button-weak" onclick="App.go(\'passport\')">스탬프 보기</button></div>';
    /* v4.08 입력·제출 화면 형식 · 전체 화면 · 하단 메뉴 숨김 · 아래 고정(다음/제출하기 + 2번째 문항부터 이전) · 답은 그대로 저장(survey_draft)
       v4.09 첫 문항의 약한 나가기 버튼 삭제(나가기는 헤더 뒤로) · 「이전」은 남긴다(헤더 뒤로는 설문 자체를 나가서 문항 이동을 대신하지 못한다) */
    var step = Math.max(1, Math.min(d.step || 1, n)), q = Q[step - 1], last = step === n;
    return '<div class="ax-stack axs-form">' +
      '<div class="ax-stack-tight axs-gap12 axs-sthost">' + stampTagHtml("sv") + '<p class="ax-meta">' + step + " / " + n + " · 답은 이름 없이 저장돼요</p>" +
      '<div class="axs-gauge" role="img" aria-label="' + step + " / " + n + '"><i style="width:' + Math.round(step / n * 100) + '%"></i></div>' +
      '<h1 class="ax-type-t3">' + esc(q.q) + (q.optional ? ' <span class="axs-chip off">선택</span>' : "") + "</h1></div>" +
      '<div class="axs-svin">' + svInputHtml(q, d.a[q.id]) + "</div></div>" +
      '<div class="ax-bottom axs-fix">' +
      (last ? '<button type="button" class="ax-button" ' + (SV.busy ? 'disabled aria-busy="true"' : "") + ' onclick="svSubmit()">' + (SV.busy ? "제출하는 중" : "제출하기") + "</button>"
        : '<button type="button" class="ax-button" onclick="svNext()">다음</button>') +
      (step > 1 ? '<button type="button" class="ax-button ax-button-weak" onclick="svGo(' + (step - 1) + ')"' + (SV.busy ? " disabled" : "") + ">이전</button>" : "") + "</div>";
  },

  ideas_mine: function () {
    var mine = S.get("ideas", []).filter(function (i) { return i.empId === (S.get("user", {}).empId); });
    if (!mine.length) return botHtml("아직 제출한 아이디어가 없어요");
    return mine.slice().reverse().map(function (i) {
      return '<div class="card soft mb8"><p class="axs-imtx" style="font-size:calc(15.5px * var(--fs));line-height:1.55">' + ideaMineTxt(i) + '</p><p style="margin-top:6px;font-size:calc(12.5px * var(--fs));color:var(--faint)">' + (i.tag ? "#" + esc(i.tag) + " · " : "") + (i.anon ? "익명" : esc(i.name)) + " · " + fmtTime(i.ts) + "</p></div>";
    }).join("");
  },

  /* ═══ 프로그램 = 신청 전용 (v47 층별 안내 폐기) · 내 신청 → 시간순 신청 카드 리스트.
     동선 안내는 타임라인(guide_time)과 현장 사이니지가 맡는다 · 혼잡도는 홈 스트립. ═══ */
  /* ═══ 프로그램 탭 (v3.7) · 상단 층 칩 4개(기본 1F, sticky) + 하단 = 선택 층의 프로그램 아코디언.
     층 아코디언 레이어 제거로 프로그램까지 한 번 탭 · 리스트 안 신청형/상시형 무게 구분은 v3.4 유지. ═══ */
  /* ═══ 프로그램 P01 (AX-TDS v1 2단계 · 260922) · 필터 전체 / 강연 / 실습 / 상담 · 층은 48 배지로만 ═══
     행 = 제목 → 설명 → 일시·장소 → 상태 · 행을 누르면 상세(P02) · 돌아오면 필터와 스크롤을 그대로(PROG.cat · PROG.scroll).
     혼잡도는 이 탭에 넣지 않는다 · 층별 혼잡도는 홈 맨 아래 스트립(v4.62 · 260929 복원). 포토부스·부스·퀴즈는 체험 탭 몫. */
  /* v4.13 두 층(사용자 결정 260922 · design.md A-5 5-10) · 1층 세그먼트 [목록 | 시간표](체험 탭과 같은 axs-seg) · 2층 분류 칩(두 보기 공통) · 시간표 = 옛 P05(guide_time 전체) */
  /* v4.84 (261001 사용자 지시 · 앱 개편 2묶음 · 기획안 5-3) 목록 보기 · 분류 칩 · 「신청 가능」 칩 삭제 · 탭 = 시간표 [전체 | 나의 일정] 하나 + 그 아래 「상시 운영」 메뉴
     (1F 부스 6구역 · AX LOUNGE 상담 · AX 커피챗 · AI 포토부스) · 260922 v4.13 두 층(목록 | 시간표)을 뒤집었다 */
  /* v4.93 (261001 사용자 확정 · IA 검토 8장 A1) 탭 맨 위 [시간표 | 상시 운영] · 상시 운영 = 1F 로비 6구역(현장 간판) + 18F AX 커피챗 · 판 문법 경계 axs-pan(design.md A-5 5-19) */
  guide: function () {
    var al = PROG.seg === "always";
    return '<div class="ax-stack' + (al ? " axs-pan" : "") + '">' + progSegHtml() + (al ? progAlwaysHtml() : progTimeHtml()) + "</div>";
  },

  /* ═══ 전체 시간표 P05 / 내 일정 M02 · 라우트 guide_time 하나(SCHED.tab) · 옛 해시·딥링크·noticeGo(my_sched) 그대로 ═══
     P05 = 오전 / 오후 · 시간 열 + 제목 + 장소·길이 · 진행 중 = brandSoft 면 · 행을 누르면 그 프로그램 상세(있을 때만).
     「상시 프로그램」 칸은 뺐다: 과제상담·커피챗은 프로그램 › 상담, 포토부스는 나의 참여 › 포토부스 대기. */
  /* v4.13 guide_time = 나의 참여 › 내 일정(M02) 하나 · 전체 시간표(P05)는 프로그램 탭 시간표 보기로 옮겼다(App.go 가 옛 진입을 돌린다) */
  guide_time: function () { return Views.my(); },   /* v4.93 App.go 가 나의 참여로 돌린다 · 여기는 닿지 않는 안전망 */

  /* ═══ 프로그램 상세 · P02-apply(17F 오후 강연 · 과제상담) / P02-free(17F 오전 · 1F 전시) / 10F 안내 전용 / 커피챗 안내형
     / M03 신청 관리(내가 신청한 것) · 주 행동은 하단 고정 바 하나 ═══ */
  sess_d: function () {
    var s = progById(PROG.sid);
    if (!s) return '<div class="ax-stack">' + botHtml("프로그램을 찾을 수 없어요") + '<button type="button" class="ax-button ax-button-weak" onclick="App.tab(\'guide\')">프로그램 보기</button></div>';
    var d = progDetail(s), stp = progStampId(s);
    return '<div class="ax-stack">' +
      '<section class="ax-card axs-pd' + (stp ? " axs-sthost" : "") + '">' + (stp ? stampTagHtml(stp) : "") +   /* v4.70 p3 에 들어가는 프로그램만 오른쪽 위 도장 */   /* v4.06 색 통일 · 흰 페이지 → canvas 위 흰 카드 */
      '<div class="axs-chiprow"><span class="axs-chip cat">' + esc(d.cat) + "</span>" + (d.st ? '<span class="axs-chip ' + d.stc + '">' + esc(d.st) + "</span>" : "") + "</div>" +
      '<h1 class="ax-title">' + esc(d.title) + "</h1>" +
      (d.who ? '<div class="axs-who">' + spkAvHtml(s.id, d.av) + '<span class="axs-tx"><span class="ax-card-title">' + esc(d.who) + '</span>' + (d.whoSub ? '<span class="ax-description">' + esc(d.whoSub) + "</span>" : "") + "</span></div>" : "") +
      '<dl class="ax-inset axs-kv">' + d.kv.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl></section>" +
      (d.extra || "") + (d.after || "") +
      ('sg' in d ? d.sg : '<section class="ax-stack-tight axs-gap12"><h2 class="ax-section-title">' + esc(d.secT) + '</h2><p class="ax-body">' + d.secB + "</p>" + (d.pics || "") + (d.link || "") + "</section>") +   /* v5.60 10F 세션은 sessGuideHtml */
      "</div>" +
      '<div class="ax-bottom axs-fix">' + (d.help ? '<p class="ax-meta">' + esc(d.help) + "</p>" : "") + d.btn + "</div>";
  },

  /* ═══ 신청 확인 P03 · 확정 API 1회 · 성공 응답 전에는 결과(P04)를 띄우지 않는다 · 실패는 이 화면에 사유와 다음 행동 ═══ */
  sess_cf: function () {
    var c = PROG.cf, s = c && progById(c.id);
    if (!s) return '<div class="ax-stack">' + botHtml("신청할 프로그램을 다시 골라 주세요") + '<button type="button" class="ax-button" onclick="App.tab(\'guide\')">프로그램 보기</button></div>';
    var d = progDetail(s), kv = d.cfKv;
    var e = c.err;
    return '<div class="ax-stack">' +
      '<div class="axs-chiprow"><span class="axs-chip">신청 확인</span></div>' +
      '<div class="ax-stack-tight"><h1 class="ax-title">이 프로그램에<br>참여할까요?</h1><p class="ax-description">시간과 장소를 한 번 더 확인해 주세요</p></div>' +
      '<section class="ax-card"><div class="ax-stack-tight"><p class="axs-cat">' + esc(d.cat + (d.org ? " · " + d.org : "")) + '</p><h2 class="ax-section-title">' + esc(d.title) + "</h2></div>" +
      '<div class="axs-hr"></div><dl class="axs-kv">' + kv.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl></section>" +
      (e ? '<div class="axs-err" role="alert"><b>' + esc(e.t) + "</b>" + (e.b ? "<span>" + esc(e.b) + "</span>" : "") + "</div>" :
        '<p class="ax-description">신청 후에는 나의 일정에서 확인할 수 있어요.</p>') +
      "</div>" +
      '<div class="ax-bottom axs-fix">' +
      (e && e.act
        ? '<button type="button" class="ax-button" onclick="' + e.act + '">' + esc(e.lbl) + "</button>"
        : '<button type="button" class="ax-button" id="cfGo" onclick="progConfirm()"' + (c.busy ? ' disabled aria-busy="true"' : "") + ">" + (c.busy ? "신청하는 중" : e ? "다시 시도하기" : "신청하기") + "</button>") + "</div>";   /* v4.09 버튼 하나 · 다시 보기는 헤더 뒤로 */
  },

  /* ═══ 신청 결과 P04 · 서버 성공(데모는 로컬 판정)일 때만 여기로 온다 ═══ */
  sess_ok: function () {
    var o = PROG.ok, s = o && progById(o.id);
    if (!s) return '<div class="ax-stack">' + botHtml("신청 내역은 나의 일정에서 확인해 주세요") + '<button type="button" class="ax-button" onclick="mySched()">나의 일정 확인하기</button></div>';
    var dap = s.id === "dap", pl = dap ? "1F AX LOUNGE" : sessPlace(s);
    return '<div class="ax-stack axs-okwrap">' +
      '<span class="axs-okmark">완료</span>' +
      '<div class="ax-stack-tight axs-gap12 axs-center-tx"><h1 class="ax-type-t2">' + (dap ? "상담 신청이 접수됐어요" : "참여 신청이 완료됐어요") + "</h1>" +
      '<p class="ax-body">' + (dap ? "승인되면 앱에서 알려 드려요." : "새로운 발견의 순간,<br>" + esc(pl) + "에서 만나요.") + "</p></div>" +
      '<div class="ax-card ax-stack-tight axs-gap12"><p class="ax-card-title">' + esc(s.ttl) + '</p><p class="ax-description">10월 26일 · ' + esc(dap ? o.slot + " · 30분" : progTm(s.tm)) + '</p><p class="ax-description">' + esc(pl) + "</p></div></div>" +
      '<div class="ax-bottom axs-fix"><button type="button" class="ax-button" onclick="mySched()">나의 일정 확인하기</button>' +
      '<button type="button" class="ax-button ax-button-weak" onclick="App.tab(\'guide\')">다른 프로그램 둘러보기</button></div>';   /* v5.67 둘러보기 복귀 = 떠 있는 「3D로 돌아가기」(trf) 하나 · 옛 v5.57 아래 버튼 없앰 */
  },

  /* 옛 라우트 dap · ev_cchat 은 App.go 가 프로그램 상세(sess_d)로 돌린다 (알림·딥링크 호환) · 여기 두 개는 직접 렌더 대비 */
  ev_cchat: function () { PROG.sid = "cchat"; return Views.sess_d(); },
  dap: function () { PROG.sid = "dap"; return Views.sess_d(); },

  /* ── v10 【신규 C】 AX Now! 부스 연동 · v5 p28·31~41 ── */
  /* v3.64 · 부스 소개와 위치 안내만 남긴다 (피드백·질문·시연 신청 블록은 사용자 확정으로 삭제) */
  booth: function () {
    /* v4.64 (QA 1단계 260930) 옛 검정 카드 · 파랑 뱃지 · 「완료 QR 스캔 (시연)」 버튼을 걷어냈다.
       실계정도 그 버튼으로 p2 가 서버에 적립됐다(QR · 적립 시간 우회 · QA 실측). 시연 버튼은 테스트 모드(데모 · 310555)에만 · 실계정은 체험 QR 스캔으로만.
       모양은 체험 안내(E02)와 같은 AX-TDS 카드 · 단계 목록 · 하단 고정 버튼 하나 */
    var got2 = S.get("stamps", []).indexOf("p2") >= 0;
    /* v4.86 (261001 사용자 확정) 오픈 날짜 칩은 날짜가 확인될 때까지 비운다 · 확인되면 여기에만 적는다(예 "11.1 OPEN") · 빈 값 = 칩 없음 */
    var OPEN = BOOTH_OPEN;   /* v5.69 시트(boothSheet)와 같은 값 한 곳 */
    var booth = function (nm, open, sub, steps, note) {
      return '<section class="ax-card ax-stack-tight axs-gap12"><div class="ax-row"><h2 class="ax-section-title">' + nm + "</h2>" + (open ? '<span class="axs-chip">' + open + "</span>" : "") + "</div>" +
        '<p class="ax-description">' + sub + "</p>" +
        '<ol class="axs-steps">' + steps.map(function (x, k) { return '<li><span class="axs-no">0' + (k + 1) + '</span><span class="axs-tx"><b class="ax-type-t5-strong">' + x + "</b></span></li>"; }).join("") + "</ol>" +
        (note ? '<p class="ax-meta">' + note + "</p>" : "") + "</section>";
    };
    /* v4.84 (261001 앱 개편 2묶음 · 1층 부스 정리 결정 1 A) 구역 이름 AX PLAY · 판 철자 HiDI-Q · Hi-Helper(하이헬퍼) · 체험 뒤 스태프가 내 QR 을 찍는다(v4.83 p2 스태프 인증) */
    return '<div class="ax-stack">' +
      '<div class="axs-chiprow"><span class="axs-chip">1F AX PLAY · 2종</span>' + (got2 ? '<span class="axs-chip ok">적립 완료</span>' : "") + "</div>" +
      '<div class="ax-stack-tight"><h1 class="ax-title">HiDI-Q · Hi-Helper<br>직접 써 보기</h1><p class="ax-description">1곳 체험 = 스탬프 1개 · 체험 후 스태프가 내 QR 스캔</p></div>' +
      BOOTH_INFO.map(function (x) { return booth(x.nm, OPEN[x.k], x.sub, x.steps, x.note); }).join("") +
      (testMode() && !got2 ? '<button type="button" class="ax-button ax-button-weak" onclick="boothStamp()">완료 처리 (시연 · 테스트 모드)</button>' : "") +
      "</div>" + ax2Btn(got2 ? "스탬프 확인하기" : "내 QR 보여주기", got2 ? "expStamp('p2')" : "qrPanelOpen('mine')");
  },
  /* v4.93 구역 상세(6구역 한 템플릿) · 옛 1F 부스 화면(floor1)은 App.go 별칭으로 상시 운영 */
  zone_d: function () { return zoneDetailHtml(); },
  floor_d: function () { return floorGuideHtml(); },   /* v5.65 둘러보기 엘리베이터 층 안내(17F · 10F) */




  /* v3.86 테트리스 · 휴대폰 종목 (단어 소나기 자리) · 조작은 화면 아래 버튼이 기본 */
  game_tetris: function () {
    ttStop();
    if (gsNeedNick()) return gsNickHtml("tetris");
    return gsStartHtml("tetris", { rootId: "ttRoot" });   /* v4.11 조작은 GS_GAMES.line 한 줄 · 버튼 설명은 첫 안내 말풍선과 게임 화면 */   /* v4.02 점수 = 블록 + 줄 · 시간은 점수 아님 */
  },
  /* ═══ v3.45 휴대폰 미니게임 · AX 팡 · ME to WE 점프 (v3.50 전원 공개) ═══ */
  game_pang: function () {
    pgStop();
    if (gsNeedNick()) return gsNickHtml("pang");
    return gsStartHtml("pang", { rootId: "pgRoot" });   /* v4.02 점수 = 완주 시간 환산 · v4.28 공식은 결과 접힘 안 */
  },
  game_jump: function () {
    jpStop();
    if (gsNeedNick()) return gsNickHtml("jump");
    return gsStartHtml("jump", { rootId: "jpRoot" });   /* v4.11 세 동작은 조작 한 줄(GS_GAMES.jump.line · 항상 보임) */   /* v4.02 버틴 시간은 점수가 아니다 */
  },
  /* ═══ v3.50 AX 올림픽 순위판 · 종합(전 종목 완주자) · 종목별(금은동) ═══
     v3.50d 부문 정보 전면 삭제 (사용자 확정 260917·260918 · 부문 메달표·부문 라벨·부문 평균 금지) */
  oly_rank: function () { return olyRankHtml(); },   /* v4.02 점수 체계 v2 · 포디움 2-1-3 · 월계수 · 내 위치 줄 (olyRankHtml) */
  type_rank: function () {   /* v5.29 (사용자 261003 「1층 점수만」) 앱(폰) 순위 탭 · 내 앱 순위 삭제 · 1F 타자왕 순위판(v5.15 tybHtml · 현장)만 · 탭 없음 */
    if (!TYB_SHOW) return typPromoHtml("rank");   /* v5.45 광고 칸(TV 순위판 루프 · 마지막에 순위)만 · 옛 순위판 · 20초 받기 숨김 */
    tybStart();
    return typPromoHtml("rank") + '<div id="tyRankBody">' + tybHtml(S.get("type_rank_site", null)) + "</div>";   /* v5.31 맨 위 홍보 칸 · 아래 순서(TOP 10 · 내 순위 바 · 경품) 그대로 */
  },

  /* ═══ v4.15 폰 관리자 모드 (사용자 확정 260922 · `앱 관리자 모드 축소 기획.md`) ═══
     인증 뒤 3개만: 스캔(스탬프 · 입장 · 포토부스 체크 한 화면) · 존 혼잡도 · 내 담당 명단(보기 · 입장 처리 · 노쇼 표시).
     포토부스 호출 · 예약 · 커피챗 매칭 · 신청 현황 · 긴급 공지 · 대시보드 · 타자왕전 · 부스 QR 인쇄 · Wall QR 퀴즈 편집 · 아이디어 열람은 AXF CONTROL(콘솔) 몫. */
  admin: function () {
    if (!S.get("admin_authed", false)) {
      return '<div class="ax-stack">' +
        '<section class="ax-card ax-stack-tight axs-gap12"><h2 class="ax-section-title">운영 담당자 코드</h2>' +
        '<label class="ax-sr-only" for="adminCode">운영 담당자 코드</label>' +
        '<input id="adminCode" class="ax-field" inputmode="numeric" pattern="[0-9]*" enterkeyhint="go" autocomplete="off" placeholder="코드를 입력해 주세요" onkeydown="onEnter(event, tryAdmin)" onfocus="kbFocus(this)">' +
        '<p class="ax-meta">운영 담당자만 들어올 수 있어요</p></section>' +
        '<button type="button" class="ax-button" onclick="tryAdmin()">확인하기</button></div>';
    }
    return admHtml();
  },



};

