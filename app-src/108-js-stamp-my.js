/* ════════════════ 일정 탭 행 (v3.5) · 좌측 시간 레일 + 우측 제목 · 부가 설명은 공용 아코디언 접힘 ════════════════ */
/* v3.21 일정 탭 = 세 탭: all 전체 일정(시간표만) / always 상시 프로그램 / mine 내 일정 */
var SCHED = { open: {}, tab: "all" };
/* 시간·층 라벨 뱃지 (v3.9 공용) · state: "" 기본(옅은 주황+짙은 주황) / dim 지나감 / act 진행 중(검정) / mine 틴트 행 대비용 O25.
   v3.17: sub 를 주면 두 줄 변형(시작 크게 + 종료 작게, 같은 뱃지 배경·상태 색 안) · 한 줄 사용처는 그대로 */
function tokBadge(text, state, sub) {
  return '<span class="tok' + (state ? " " + state : "") + (sub ? " two" : "") + '"><b>' + text + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</span>";
}
/* ══ 화면당 검정 강조 1곳 (v3.25 사용자 확정) · 긴급도 1순위 하나만 act(검정)를 받는다 ══
   순위: call 호출(포토부스·대기열 · 안 가면 건너뛰어짐) (v3.50)
         > roulette 룰렛 사용 가능(스탬프 3개·미사용) > now 진행 중 일정.
   후보는 그 화면(일정 탭은 하위 탭까지)에 실제로 보이는 것만 모은다. 오버레이·모달은 대상 아님. */
function blackPick(view) {
  view = view || App.current;
  var c = [], st = SCHED.tab;
  var qq = S.get("queue", {}), call = false, k;   /* 정리 #7 포토부스 번호 호출 없음 */
  for (k in qq) if (qq[k] && qq[k].status === "call") call = true;
  if (call && (view === "home" || view === "guide" || view === "sess_d" || view === "my")) c.push("call");   /* v4.93 나의 일정 = 나의 참여 */
  if ((view === "home" || view === "exp") && stampCount() >= 3 && !S.get("roulette_used", false)) c.push("roulette");
  if (evPhase() === "live" && (view === "home" || view === "guide")) c.push("now");   /* v4.84 프로그램 탭 = 시간표 하나 */   /* v4.13 진행 중 줄은 프로그램 › 시간표 */
  return c[0] || null;
}
function isBlack(kind) { return blackPick(App.current) === kind; }

/* ══ 공용 행 카드 (v3.22) · 스탬프 카드·일정 행·홈 나의 일정·프로그램 행이 전부 이 함수 하나로 그린다 ══
   o = { cls, onclick, left(좌측 슬롯: 아이콘 또는 시간 뱃지), title, badges(v3.44b 제목 옆 뱃지 · 말줄임 대상 아님), sub, right(우측 슬롯),
         open, body(펼침), link(true = 펼침 대신 이동 · 화살표 ›), chev(false = 화살표 없음) }
   컴포넌트를 바꾸면 이 함수를 쓰는 모든 화면이 함께 바뀐다 (design.md 컴포넌트 일관성) */
/* v3.44 장소 칩 폭 추정 · 제목 줄 오른쪽 여백으로 쓴다(칩이 제목을 덮지 않게) */
function rcHtml(o) {
  var chev = o.chev === false ? "" : o.chev === "svg" ? '<span class="chev axs-ttc' + (o.open ? " up" : "") + '" aria-hidden="true">' + CHEV_SVG + "</span>" :   /* v4.15 시간표 펼침 = 아래 셰브론(펼치면 위) */
    o.link ? '<span class="chev arw">' + CHEV_SVG + "</span>" : '<span class="chev">' + (o.open ? "▲" : "▼") + "</span>";
  /* v4.09 (사용자 피드백 260922 「장소와 › 가 붙어 보기 불편」) · 장소 = 제목 아래 한 줄(위치 아이콘 + T7 muted) ·
     이동 표시 = 행 오른쪽 끝 셰브론(24 영역 · 세로 가운데) · 누르는 곳은 행 전체(.rh) · 옛 오른쪽 위 장소 칩(v3.44)은 폐지 */
  return '<div class="rc' + (o.place ? " hp" : "") + (o.cls || "") + '">' +
    '<div class="rh"' + (o.onclick ? ' onclick="' + o.onclick + '"' : "") + ">" +
    '<span class="ls">' + (o.left || "") + "</span>" +
    '<span class="bd">' + rcTitle(o) + (o.sub ? '<span class="sb">' + o.sub + "</span>" : "") + (o.place ? '<span class="pl">' + PIN_SVG + "<span>" + esc(o.place) + "</span></span>" : "") + "</span>" +
    (o.right ? '<span class="rt">' + o.right + "</span>" : "") + chev + "</div>" +
    (o.open && o.body ? '<div class="rb">' + o.body + "</div>" : "") + "</div>";
}
function rcTitle(o) {
  return '<span class="tr"><span class="tt">' + o.title + "</span>" + (o.badges ? '<span class="bgs">' + o.badges + "</span>" : "") + "</span>";
}
function rcIcon(svg) { return '<span class="ico">' + svg + "</span>"; }
/* 일정 행 = 공용 행 카드 + 좌측 두 줄 시간 뱃지 · cls: "" 기본 / " now" / " past" / " my" */
/* ══ v3.62 오후 동시 진행 블록 (사용자 확정 260918) ══
   일정 탭은 시간순이 기본이고, 이 카드 하나만 예외로 「같은 시간대 묶음」이다 (design.md).
   왼쪽 = 17F 오후 파트너사 강연(자유 참석 · QR 출석 · v4.26) · 오른쪽 = 10F 실습형 세션(사전 신청자) · 커피챗·상담·포토부스는 상시 탭 몫이라 넣지 않는다.
   큰글씨 모드에서는 두 칸이 깨지므로 위아래로 쌓고 「동시 진행」 묶음 표시를 유지한다. */

/* ════════════════ 스탬프 카드 아코디언 (v3.2 · 경로 메타포 폐기) · 전폭 카드 · 각자 독립 개폐 ════════════════ */
var PP = { open: {}, animOn: false, just: {} };   /* v4.06 just = 방금 적립한 시각(이 화면 세션) */
/* ── 테스트 모드 (v3.19) · 노출 = 데모(#demo, BE off) 또는 테스트 사번 로그인.
   관리자 인증만으로는 노출하지 않는다: 실서버 stamp_grant 완료 버튼은 사후 추첨 원장 오염 위험이 있어 제외(310555 로 충족).
   310555 = 하이브리드 테스트 계정: 서버 로그인·공지·신청은 실제로 동작하되 스탬프·보상만 이 기기 로컬. */
var TEST_EMP = ["310555"];
function testEmp() { return TEST_EMP.indexOf(String((S.get("user", {}) || {}).empId || "")) >= 0; }
function testMode() { return !BE.on || testEmp(); }
function testStamp(id) {
  if (!testMode()) return;
  awardStamp(id);
  App.render();
}
/* v3.28 테스트 · 완료 취소 (한 장씩 되돌리기) · 로컬 전용, 서버 호출 없음.
   문턱 연출(3개 룰렛 열림 · 4개부터 응모권)을 반복 확인할 수 있게 보상 로컬 상태를 현재 개수에 맞춘다. */
function testOverlayDrop(id) {
  SPOP.q = id ? SPOP.q.filter(function (s) { return s.id !== id; }) : [];
  SPOP.ids = {}; SPOP.q.forEach(function (s) { SPOP.ids[s.id] = 1; });
  if (SPOP.cur && (!id || SPOP.cur.sd.id === id)) { var q = SPOP.q; SPOP.q = []; spFinish(SPOP.cur); SPOP.q = q; }
  if (PP.seenT) { clearTimeout(PP.seenT); PP.seenT = null; }   /* 대기 중인 「본 스탬프·글로우 기록」 타이머 */
  PP.animOn = false;
}
function testStampUndo(id) {
  if (!testMode()) return;
  var st = S.get("stamps", []);
  if (st.indexOf(id) < 0) return;
  testOverlayDrop(id);
  S.set("pp_seen", S.get("pp_seen", []).filter(function (x) { return x !== id; }));   /* 다시 완료하면 도장 연출이 또 나오게 */
  S.set("stamps", st.filter(function (x) { return x !== id; }));
  var n = stampCount();
  S.set("raffle_seen", raffleTickets(n)); if (S.get("raffle_opened", 0) > raffleTickets(n)) S.set("raffle_opened", raffleTickets(n));   /* 4개째를 다시 채우면 응모권 안내가 다시 뜨게 · 목업 번호는 개수에서 계산되므로 자동으로 줄어든다 */
  if (n < 3) {                              /* 룰렛 문턱 아래 · 열림·사용·글로우를 되돌려 3개째 연출이 다시 나오게 */
    S.set("roulette_open", false); S.set("roulette_used", false); S.set("pp_glow3", false);
  }
  var sd = STAMPS.filter(function (x) { return x.id === id; })[0];
  toast("테스트 · 완료 취소 · " + (sd ? sd.title : id) + " · 스탬프 " + n + "개");
  App.render();
}
function testStampReset() {
  if (!testMode()) return;
  modalOpen('<p class="muted">이 기기의 테스트 스탬프 · 룰렛 · 행운권 상태와 내 아이디어 기록을 0으로 되돌립니다. 서버에는 아무것도 보내지 않습니다.</p>' +
    '<button class="btn mint" style="margin-top:14px" onclick="modalClose(); testStampResetGo()">초기화</button>' +
    '<button class="btn line" style="margin-top:8px" onclick="modalClose()">취소</button>', "스탬프를 전부 초기화할까요?");
}
/* v3.70 (사용자 확정 260918) 테스트 사번·데모에서 미니게임을 한 번도 안 한 상태로 되돌린다.
   이 기기 기록만 지운다 · 순위판에 올라간 서버 기록은 관리 콘솔에서 지운다(참여자 앱에 삭제 기능을 두지 않는다). */
var GAME_KEYS = ["pang_best", "jump_best", "gw_best", "gw_time_best", "tt_best", "type_best", "pang_cleared", "jump_cleared", "gw_cleared", "type_cleared",
  "oly2_best_pang", "oly2_best_jump", "oly2_best_tetris", "oly2_best_word", "oly2_best_ox", "oly2_done_pang", "oly2_done_jump", "oly2_done_tetris", "oly2_done_word", "oly2_done_ox", "ox_cleared", "ox_seen",
  "oly_tab", "oly_ev", "mem_seen", "qz_run", "qz_last", "qz_best", "qz_kseen", "qz_pend", "type_rank_app", "type_rank_site", "game_sound", "type_nick_edit", "art_demo_n", "gs_how"];
function testGameReset(withNick) {
  if (!testMode()) return;
  modalOpen('<p class="muted">이 기기의 미니게임 최고 기록·올림픽 점수·미니게임 스탬프를 지웁니다' + (withNick ? " (닉네임도 지웁니다)" : "") +
    '. 순위판에 올라간 서버 기록은 관리 콘솔에서 지웁니다.</p>' +
    '<button class="btn mint" style="margin-top:14px" onclick="modalClose(); testGameResetGo(' + (withNick ? "true" : "false") + ')">초기화</button>' +
    '<button class="btn line" style="margin-top:8px" onclick="modalClose()">취소</button>', withNick ? "게임 기록과 닉네임을 초기화할까요?" : "게임 기록을 초기화할까요?");
}
function testGameResetGo(withNick) {
  if (!testMode()) return;
  testOverlayDrop(null);
  GAME_KEYS.forEach(function (k) { S.del(k); });
  if (withNick) S.del("type_nick");
  /* 미니게임 스탬프(p4)와 그 도장 기록만 뺀다 · 다른 스탬프는 그대로 · v4.83 AX 퀴즈(qz)도 게임 기록에서 나오므로 같이 뺀다 */
  S.set("stamps", S.get("stamps", []).filter(function (id) { return id !== "p4" && id !== "qz"; }));
  S.set("pp_seen", S.get("pp_seen", []).filter(function (id) { return id !== "p4" && id !== "qz"; }));
  if (stampCount() < 3) S.set("roulette_open", false);   /* v4.43 문턱 아래로 내려가면 룰렛 안내도 다시 뜨게(testStampUndo 와 같은 규칙) */
  checkRewards();   /* v4.43 응모권 안내 기준을 줄어든 개수에 맞춘다 */
  OLY.board = null; OLY.t = 0;
  TYAW.data = null; TYTV.app = null; TYTV.site = null;
  PG.on = false; JP.on = false; RG.on = false;
  gsOverlayClose();
  toast(withNick ? "테스트 · 게임 기록과 닉네임을 초기화했어요" : "테스트 · 게임 기록을 초기화했어요");
  App.render();
}
function testStampResetGo() {
  if (!testMode()) return;
  testOverlayDrop(null);                                                   /* 오버레이 큐·연출 잠금 */
  S.set("stamps", []); S.set("pp_seen", []);                               /* 스탬프 · 레일 카운트 롤업 기준값 */
  S.set("pp_glow3", false); S.set("roulette_used", false); S.set("roulette_open", false);
  S.set("raffle_seen", 0); S.set("raffle_nums", []); S.set("raffle_opened", 0);
  var me0 = (S.get("user", {}) || {}).empId; S.set("ideas", S.get("ideas", []).filter(function (i) { return i.empId !== me0; })); S.set("cchat_pref", []);   /* v4.45 아이디어(p5)를 지우면 이 기기의 내 아이디어도 · 남아 있으면 스탬프 없이 커피챗이 열렸다 */                       /* 응모권 안내 기준 · 서버 번호 캐시 */
  toast("테스트 · 스탬프 상태를 초기화했어요");
  App.render();
}
/* 완료 도장 (v3.20 사용자 확정 A안) · 카드 56px·오버레이 148px 같은 SVG 함수.
   textPath 의 path id 는 인스턴스마다 유일하게(한 화면 도장 여러 개 = id 충돌 시 글자 소실) · href+xlink:href 병기(iOS 구버전) */
var SEAL_N = 0;
function stampSealSvg(size, color, mid, midSz) {   /* v4.70 mid = 가운데 글자(기본 「완료」) · 활동 화면 받기 전 도장이 쓴다 */
  var u = "seal" + (++SEAL_N);
  var C = color || "#D64524";
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true">' +
    '<g transform="rotate(-12 50 50)">' +
    '<defs><path id="' + u + 't" d="M17,50 A33,33 0 0 1 83,50"/><path id="' + u + 'b" d="M9,50 A41,41 0 0 0 91,50"/></defs>' +
    '<circle cx="50" cy="50" r="47.5" fill="none" stroke="' + C + '" stroke-width="3"/>' +
    '<circle cx="50" cy="50" r="43.5" fill="none" stroke="' + C + '" stroke-width="1.2"/>' +
    '<circle cx="50" cy="50" r="29" fill="none" stroke="' + C + '" stroke-width="1.2"/>' +
    '<text fill="' + C + '" font-family="Pretendard, Arial, sans-serif" font-size="10" font-weight="800" letter-spacing="1"><textPath href="#' + u + 't" xlink:href="#' + u + 't" startOffset="50%" text-anchor="middle">AX FESTIVAL</textPath></text>' +
    '<text fill="' + C + '" font-family="Pretendard, Arial, sans-serif" font-size="10" font-weight="800" letter-spacing="1.5"><textPath href="#' + u + 'b" xlink:href="#' + u + 'b" startOffset="50%" text-anchor="middle">2026</textPath></text>' +
    '<text x="12.5" y="53.5" fill="' + C + '" font-size="9" text-anchor="middle">★</text>' +
    '<text x="87.5" y="53.5" fill="' + C + '" font-size="9" text-anchor="middle">★</text>' +
    '<text x="50" y="57" fill="' + C + '" font-family="\'Pretendard Variable\', Pretendard, sans-serif" font-size="' + (midSz || 19) + '" font-weight="900" letter-spacing="-0.5" text-anchor="middle">' + (mid == null ? "완료" : mid) + '</text>' +
    "</g></svg>";
}
function stampMarkHtml(withRing, size) {
  size = size || 56;
  /* v3.47 · 새로 찍히는 도장 = 잉크 링 2겹 + 잔광(같은 도장을 밝은 오렌지로 겹쳐 잠깐 올렸다 내린다) */
  return '<span class="stampmk" style="width:' + size + 'px;height:' + size + 'px">' + stampSealSvg(size) +
    (withRing ? '<span class="sglow">' + stampSealSvg(size, "#FF7E31") + '</span><span class="ring"></span><span class="ring r2"></span>' : "") + "</span>";
}
/* v4.70 (사용자 요청 260930) 활동 화면 오른쪽 위 스탬프 표시 · 패스포트 완료 도장(stampSealSvg)을 그대로 쓴다(새 모티프 없음).
   받기 전 = 회색 도장 · 가운데 「스탬프」(미니게임은 종목 진행 n/3) · 받은 뒤 = 패스포트 완료 카드와 같은 도장 「완료」.
   판정은 스탬프 카드와 같은 원천(S stamps = 서버 sync + 이 기기 적립) · 6개 한도 뒤 7·8번째로 받은 것도 기록이 있으니 「완료」.
   도장 연출은 붙이지 않는다(완료 팝이 따로 있다) · 화면을 다시 그릴 때 색만 바뀐다. */
var STAG_SZ = 52;
/* v5.96 (사용자 261006 밤 「스탬프 모양이 두 개이거나 곱하기 2 표시」) x = 2 이상이면 도장 오른쪽 아래 O100 알약 「×2」(곱셈 기호 U+00D7) · 17F 오후 강연(p3 · 입장 1 + 끝 1) */
function stampTagHtml(id, x) {
  var xb = x > 1 ? '<b class="axs-stx" aria-hidden="true">\u00D7' + x + "</b>" : "", xl = x > 1 ? " · " + x + "개" : "", w0 = xb ? '<span class="axs-stxw">' : "", w1 = xb ? xb + "</span>" : "";
  if (S.get("stamps", []).indexOf(id) >= 0) return '<span class="axs-stag on" role="img" aria-label="스탬프 받음' + xl + '">' + w0 + stampSealSvg(STAG_SZ) + w1 + "</span>";
  var mg = id === "p4" ? Math.min(MG_NEED, mgDone()) + "/" + MG_NEED : "";
  return '<span class="axs-stag" role="img" aria-label="' + (mg ? "스탬프 · 종목 " + mg : "스탬프 받기 전") + xl + '">' + w0 + stampSealSvg(STAG_SZ, "currentColor", mg || "스탬프", mg ? 22 : 17) + w1 + "</span>";
}
/* 줄 모양 · 왼쪽 글(없으면 빈칸) + 오른쪽 도장 · 제목·칩 줄이 없는 화면(미니게임 · QR 퀴즈 목록 · 설문 결과)이 쓴다 */
function stampLineHtml(id, left) { return '<div class="axs-stline">' + (left || "<span></span>") + stampTagHtml(id) + "</div>"; }
/* 프로그램 상세 · p3 에 들어가는 것 · v5.94 (사용자 결정 261006) 17F 오후 파트너 강연(AWS l1 · MS l2)만 · 오전 강연 · DAP 상담 · 커피챗 · 10F 는 도장 없음(옛 규칙 = hi_ax git v5.93) */
var P3_PM = ["l1", "l2"];
function progStampId(s) {
  return s && P3_PM.indexOf(s.id) >= 0 ? "p3" : "";
}
/* ═══ v5.94 (사용자 결정 261006 「사전프로그램 신청자의 경우에는 체크인 시에 3 스탬프를 부여하니, 그걸로 룰렛권을 받고 그대로 룰렛장으로 이동해서 룰렛 한 바퀴 돌리고 바로 강의장으로 가도록 유도하자」) ═══
   사전등록 체크인 3개(ck) → 1F EVENT 룰렛 → 10F 강의장(내 세션 시각 · 장소) | 라운지 사전등록자(서버 my.ckg = dap) = 1F AX 라운지 상담 시각
   안내 시트 = 스탬프 연출이 끝난 뒤 한 번(사건 뒤 안내 · 「먼저 묻지 않는다」 안 · 막지 않는다 = 뒷배경 · 끌어 닫기 · 「닫기」) · 본 기록 ck_guide(사람별)
   보내는 곳 = stampSync 가 ck 를 새로 받은 순간 notice 줄(run) · 「룰렛 1회 열림」 알림은 이 시트가 대신한다(겹쳐 띄우지 않는다)
   홈 한 줄(나의 일정 맨 위) = 같은 순서 · 대상 = ck 가 있고 룰렛을 아직 안 쓴 사람(소진 · 마감이면 없음) · 룰렛을 쓰면 사라진다 */
function ckGuideOn() { return S.get("stamps", []).indexOf(STAMP_CK) >= 0 && !S.get("roulette_used", false) && !S.get("roulette_out", false); }
/* 마지막 줄 · 10F = 내 세션(tenMine · 시각 · 장소) · 라운지 = 상담 시각(내 상담 신청이 있으면) · 갈래를 모르면(옛 서버) 10F 세션이 있으면 10F */
function ckGuideDest() {
  var g = S.get("ck_grp", ""), t = g === "dap" ? null : tenMine();
  if (t) return { k: "10F", nm: "10F " + t.ttl, at: String(t.tm || "").split("~")[0], pl: sessPlace(t) };
  if (g === "10F") return { k: "10F", nm: "10F 실습형 세션", at: "13:30", pl: "세션별 장소는 프로그램 탭" };
  var r = myResv(), sl = r && RESV_HOLD.indexOf(r.status) >= 0 && r.slot ? hhmm(r.slot) : "";
  return { k: "1F", nm: "1F AX 라운지", at: sl, pl: sl ? "내 상담 시간" : "상담 시간에 맞춰" };
}
function ckGuideSteps(d) {
  return '<ol class="axs-ckg"><li><span class="tx"><b>1F EVENT 룰렛에서 한 바퀴</b><span>룰렛 부스에서 내 QR 보여 주기</span></span></li>' +
    '<li><span class="tx"><b>' + esc(d.nm) + "</b><span>" + esc((d.at ? d.at + " · " : "") + d.pl) + "</span></span></li></ol>";
}
function ckGuideOpen(again) {
  if (!again) { if (S.get("ck_guide", 0) || !ckGuideOn()) return; S.set("ck_guide", 1); }
  sheetOpen({ id: "ckgo", title: "스탬프 3개 · 룰렛 1회권이 생겼어요", body: ckGuideSteps(ckGuideDest()),
    go: "sheetClose(true); qrPanelOpen('mine')", goLbl: "내 QR 보여주기", keep: "닫기", keepWeak: true, keepLast: true });
}
/* 홈 나의 일정 맨 위 한 줄 · [정렬 분, onclick, 뱃지, 제목, 보조 줄, 뱃지 상태] (myScheduleHtml 의 rows 와 같은 모양) */
function ckGuideRow() {
  if (!ckGuideOn()) return null;
  var d = ckGuideDest();
  return [-2, "ckGuideOpen(true)", "룰렛", "1F 룰렛 → " + d.nm, (d.at ? d.at + " · " : "") + d.pl, "act"];   /* 375px 한 줄(제목 · 보조 줄 말줄임 없이) · 누르면 같은 시트 */
}
/* 잉크 튐 · 도장 가장자리에서 바깥으로 · O100~O30 사다리 · 보일 때만 만들고 0.9초 뒤 지운다 · scale 0.5 = 카드 인라인(절반 크기) */
var INK_COLS = ["#FF7E31", "#FF7E31", "#FFA46E", "#FFB284", "#FFCFB0"];
function inkSplash(mk, count, scale) {
  if (!mk) return;
  var r = mk.offsetWidth / 2, made = [];
  for (var i = 0; i < count; i++) {
    var a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    var d0 = r * 0.86, d1 = r + (24 + Math.random() * 22) * scale, sz = Math.round((6 + Math.random() * 5) * scale * 10) / 10;
    var p = document.createElement("span");
    p.className = "spl";
    p.style.cssText = "--sz:" + Math.max(2, sz) + "px;--c:" + INK_COLS[i % INK_COLS.length] + ";--sx:" + (Math.cos(a) * d0).toFixed(1) + "px;--sy:" + (Math.sin(a) * d0).toFixed(1) + "px;--ex:" + (Math.cos(a) * d1).toFixed(1) + "px;--ey:" + (Math.sin(a) * d1).toFixed(1) + "px";
    mk.appendChild(p); made.push(p);
  }
  setTimeout(function () { made.forEach(function (p) { if (p.parentNode) p.parentNode.removeChild(p); }); }, 1400);
}
/* 진동 · 지원 기기만 (iOS 는 미지원) · 상호작용 전에는 브라우저가 막으므로 가드 유지 */
function stampBuzz(pattern) {
  if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) { try { navigator.vibrate(pattern); } catch (e) {} }
}
/* ── v3.49 완료 연출 = 화면 가운데 풀스크린 팝 → 제자리로 안착 (사용자 피드백 260917) ──
   팝 약 0.7초(딤 · 화면 폭 60% 도장 A · 낙하·잉크 링 2겹·튐·진동 · 화면 흔들림) → 0.35초 멈춤 → 약 0.5초 위로 살짝 휜 곡선으로 작아지며 제자리 → 한 번 튕김.
   제자리: 스탬프 탭 = 그 카드 도장 칸(화면 밖이면 먼저 스크롤) · 홈 = 레일 자리 · 그 외 = 하단 탭바 스탬프 아이콘(점 배지) · 탭바가 없으면 오른쪽 위.
   어느 순간에 탭해도 바로 안착 · 연속 적립은 순차 재생 · 연출한 스탬프는 pp_seen 에 즉시 기록 · 모션 줄이기 = 가운데 정지 0.8초 후 사라짐, 흔들림·비행 없음. */
var SPOP = { q: [], cur: null, ids: {}, opt: {} };
/* v5.07 op = { to(): 제자리 { el, kind }, shake: 흔들 화면, done(spCur): 안착 직후 } · 최초 로그인 장면(lgxPop)이 쓴다 · 장면이 떠 있어도 이 팝은 장면 위에서 바로 돈다 */
/* v5.68 프로그램 참여 = 2개 · 팝 제목 p3 = 「프로그램 참여 ×2」 · p3h(17F 한쪽 1개) = 「프로그램 참여 1 / 2」 · 제자리는 같은 p3 줄 */
function stampPopDef(id) {
  if (id === STAMP_HALF) return { id: STAMP_HALF, title: "프로그램 참여 1 / 2" };
  if (id === "ck") return { id: "ck", title: "사전등록 체크인 ×3" };   /* v5.90 STAMP_CK(이 함수만 떼어 검사하므로 글자 그대로) */
  var sd = STAMPS.filter(function (s) { return s.id === id; })[0];
  return sd && sd.x2 ? { id: sd.id, title: sd.title + " ×2" } : sd;
}
function stampOverlay(id, op) {
  var sd = stampPopDef(id);
  if (!sd) return false;
  if (id === "lg" && typeof lgfxMark === "function") lgfxMark();   /* v6.07 이 기기 · 이 사번은 최초 로그인 도장을 봤다 */
  var seen = ppSeenGet();
  if (seen.indexOf(id) < 0) { seen.push(id); S.set("pp_seen", seen); }   /* 재생 중복 방지 · 스탬프 탭이 다시 그려져도 또 안 튄다 */
  if (id === STAMP_HALF && S.get("stamps", []).indexOf("p3") >= 0) return true;   /* v5.68 같은 동기화에 2개가 함께 왔으면 「×2」 팝 하나만 */
  if (op) { if (!SPOP.opt) SPOP.opt = {}; SPOP.opt[id] = op; }
  if (SPOP.ids[id] || (SPOP.cur && SPOP.cur.sd.id === id)) return true;
  SPOP.ids[id] = 1; SPOP.q.push(sd);
  if (!SPOP.cur) setTimeout(spNext, 0);   /* 적립으로 생긴 재렌더가 끝난 뒤 목표 좌표를 잡는다 */
  return true;
}
/* 목표 · 스탬프 탭 = 그 카드의 도장 칸 · 홈 = 방금 채워진 레일 자리(1·2 틱, 3~6 마커 · 6개를 넘긴 적립은 개수 칸) · 그 외 = 하단 탭바 「스탬프」 아이콘 · 탭바가 없으면 오른쪽 위 */
function spTarget(id) {
  var v = App.current, t = null, kind = "";
  if (v === "exp") {   /* v4.84 스탬프 탭 = 그 행의 번호 칸 */
    t = document.querySelector('#view [data-stp="' + (id === STAMP_HALF ? "p3" : id) + '"] .axs-stpn'); if (t) kind = "card";   /* v5.68 p3h = 프로그램 참여 줄 */
  } else if (v === "home") {
    var rail = document.querySelector("#view .rail"), n = stampGot();
    if (rail) {
      if (n >= 1 && n <= 2) t = rail.querySelectorAll(".tick")[n - 1];
      else if (n >= 3 && n <= REWARD_CAP) t = rail.querySelectorAll(".mk")[n - 3];
      else t = el("ppCnt");
      if (t) kind = "rail";
    }
  }
  if (!t) {
    var tb = el("tabbar"), b = tb && tb.querySelector('button[onclick*="\'exp\'"]'), br = b && b.getBoundingClientRect();
    if (b && tb.style.display !== "none" && br.width > 0) { t = b.querySelector(".ax-icon"); kind = "tab"; } else kind = "corner";
  }
  return { el: t, kind: kind };
}
/* v5.07 팝이 받은 제자리(최초 로그인 장면 = 시트의 도장 칸)가 있으면 그것 · 없으면 화면별 제자리 */
function spTgt(cur) { return cur && cur.op && cur.op.to ? cur.op.to() : spTarget(cur.sd.id); }
/* v5.10 팝의 개수 「n / 6」 = 점 글자 28px(흰 점 · design.md A-5 5-20) · 바뀐 숫자(앞 글자)만 글자가 뜬 뒤(0.55초) 점이 차례로 켜진다 · 6개를 넘긴 적립은 숫자가 그대로라 켜지지 않는다 · 동작 줄이기 = 켜진 모양 */
function spNum(n, fresh) {
  var t = n + " / " + STAMP_DENOM;
  return '<i class="sp-n">' + DotGlyph.svg(t, { h: 28, label: t, anim: fresh, only: [0], delay: 550, step: 30 }) + "</i>";
}
function spNext() {
  if (SPOP.cur && !SPOP.cur.done) return;   /* 이미 재생 중 · 끝나면 spFinish 가 다음을 부른다 */
  var qi = 0, opt = SPOP.opt || {};
  if (el("lgx")) {   /* v4.87 최초 로그인 장면이 끝난 뒤에 · v5.07 장면이 부른 도장(op)만 장면 위에서 바로 */
    while (qi < SPOP.q.length && !opt[SPOP.q[qi].id]) qi++;
    if (qi >= SPOP.q.length) { if (SPOP.q.length) setTimeout(spNext, 400); return; }
  }
  var sd = SPOP.q.splice(qi, 1)[0];
  if (!sd) { SPOP.cur = null; return; }
  delete SPOP.ids[sd.id];
  var op = opt[sd.id] || null; delete opt[sd.id];
  var rm = rgReduced(), n = stampCount();
  /* v4.44 (사용자 260925 · 레드팀 토론) 모든 개수에 다음 보상 한 줄 · 1 · 2개째 = 룰렛까지 남은 수(새 팝업 없음) · 4개째부터 = 무엇을 받는지 그대로
     v4.58 6개를 넘긴 적립(7·8번째)은 개수 · 보상이 그대로라 「6개 모두 모았어요」 */
  var hint = stampGot() > STAMP_DENOM ? STAMP_DENOM + "개 모두 모았어요" : n === 1 || n === 2 ? "룰렛까지 " + (3 - n) + "개" : n === 3 ? "룰렛 1회 열림" :
    n >= 4 ? "행운권 " + raffleTickets(n) + "장 · 번호 발급" : "";
  var fr = el("frame").getBoundingClientRect(), fw = Math.min(fr.width || innerWidth, innerWidth);
  var S0 = Math.round(Math.min(320, fw * 0.6)), cx = Math.round(fr.width ? fr.left + fr.width / 2 : innerWidth / 2), cy = Math.round(innerHeight * 0.4);
  var d = document.createElement("div");
  d.id = "spop"; if (rm) d.className = "rm";
  d.innerHTML = '<div class="sp-dim"></div>' +
    '<div class="sp-stage" style="left:' + (cx - S0 / 2) + "px;top:" + (cy - S0 / 2) + "px;width:" + S0 + "px;height:" + S0 + 'px">' + stampMarkHtml(!rm, S0) + "</div>" +
    '<div class="sp-text" style="left:' + Math.round(cx - fw / 2) + "px;width:" + Math.round(fw) + "px;top:" + (cy + S0 / 2 + 16) + 'px"><b>' + esc(sd.title) + " · 스탬프" + spNum(Math.min(STAMP_DENOM, n), !rm && stampGot() <= STAMP_DENOM) + "</b>" +
    (hint ? "<span>" + hint + "</span>" : "") + "</div>";
  document.body.appendChild(d);
  var cur = SPOP.cur = { sd: sd, d: d, timers: [], anims: [], done: false, rm: rm, op: op, hint: hint };
  var at = function (fn, ms) { cur.timers.push(setTimeout(fn, ms)); };
  var t0 = spTgt(cur); if (t0.el) t0.el.classList.add("sp-wait");
  d.addEventListener("click", function () { spFinish(cur); });
  if (rm) {   /* 모션 줄이기 · 흔들림·비행 없음 · 가운데 정지 0.8초 → 사라짐 · 제자리 색만 바뀐다 */
    stampBuzz(25);
    at(function () { cur.anims.push(d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })); }, 800);
    at(function () { spFinish(cur); }, 1000);
    return;
  }
  inkSplash(d.querySelector(".stampmk"), 10, 2);
  at(function () {
    stampBuzz([25, 40, 70]);
    SFX.site = false; if (S.get("game_sound", null) === true) sfx("kung");   /* v3.51 고른 적 없는 사람은 무음 */
    var v = (op && op.shake) || el("view"); if (v) { v.classList.remove("sp-shake"); void v.offsetWidth; v.classList.add("sp-shake"); }
  }, 420);
  at(function () { spScroll(cur); }, 700);
  at(function () { spFly(cur); }, op ? 900 : hint ? 1500 : 1050);   /* v4.44 한 줄이 있으면 0.45초 더 머문다(0.4초만 보여 읽지 못했다) · v5.83 최초 로그인 장면이 부른 도장(op) = 0.9초(사용자 261006 「약 1.4초로」 · 모양 그대로 · 한 줄 유지) */
}
/* 목표가 화면 밖이면 먼저 부드럽게 스크롤 */
function spScroll(cur) {
  if (cur.done) return;
  var t = spTgt(cur);
  if (!t.el || t.kind === "tab" || t.kind === "lgx") return;
  t.el.classList.add("sp-wait");
  var r = t.el.getBoundingClientRect();
  if (r.top < 70 || r.bottom > innerHeight - 100) t.el.scrollIntoView({ block: "center", behavior: "smooth" });
}
/* 비행 · 비행 직전에 한 번만 좌표를 잡는다(스크롤이 아직 움직이면 멈출 때까지 최대 0.4초 기다림) · transform 만 */
function spFly(cur, tries) {
  if (cur.done) return;
  var t = spTgt(cur);
  if (t.el) {
    t.el.classList.add("sp-wait");
    var r0 = t.el.getBoundingClientRect();
    if ((tries || 0) < 8) {
      requestAnimationFrame(function () {
        if (cur.done) return;
        var r1 = t.el.getBoundingClientRect();
        if (Math.abs(r1.top - r0.top) > 0.5) { cur.timers.push(setTimeout(function () { spFly(cur, (tries || 0) + 1); }, 50)); return; }
        spFlyGo(cur, t);
      });
      return;
    }
  }
  spFlyGo(cur, t);
}
function spFlyGo(cur, t) {
  if (cur.done || cur.flying) return;
  cur.flying = true;
  var stage = cur.d.querySelector(".sp-stage"), sr = stage.getBoundingClientRect(), tx, ty, ts;
  if (t.el) { var r = t.el.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2; ts = Math.max(r.width, r.height, 10); }
  else { var fr = el("frame").getBoundingClientRect(); tx = (fr.width ? fr.right : innerWidth) - 30; ty = 30; ts = 24; }
  var dx = tx - (sr.left + sr.width / 2), dy = ty - (sr.top + sr.height / 2), s1 = ts / sr.width, lift = 50 + Math.abs(dy) * 0.15, frames = [];
  for (var i = 0; i <= 20; i++) {
    var p = i / 20, e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2, u = 1 - e;
    var x = 3 * u * u * e * (dx * 0.2) + 3 * u * e * e * (dx * 0.8) + e * e * e * dx;
    var y = 3 * u * u * e * (dy * 0.2 - lift) + 3 * u * e * e * (dy * 0.8 - lift * 0.5) + e * e * e * dy;
    frames.push({ transform: "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + (1 + (s1 - 1) * e).toFixed(4) + ")" });
  }
  cur.path = { dx: dx, dy: dy, s1: s1, kind: t.kind };
  var fd = cur.op ? 400 : 500;   /* v5.83 장면 도장 비행 0.4초(옛 0.5) */
  cur.anims.push(stage.animate(frames, { duration: fd, fill: "forwards" }));
  cur.anims.push(cur.d.querySelector(".sp-dim").animate([{ opacity: 1 }, { opacity: 0 }], { duration: fd - 50, fill: "forwards" }));
  cur.anims.push(cur.d.querySelector(".sp-text").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" }));
  cur.timers.push(setTimeout(function () { spFinish(cur); }, fd));
}
/* 안착 · 어느 순간에 탭해도 여기로 바로 온다 */
function spFinish(cur) {
  if (!cur || cur.done) return;
  cur.done = true;
  cur.timers.forEach(clearTimeout);
  cur.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
  if (cur.d.parentNode) cur.d.parentNode.removeChild(cur.d);
  if (cur.op && cur.op.done) { try { cur.op.done(cur); } catch (e) {} }   /* v5.07 최초 로그인 장면 · 도장 칸에 도장을 그린 뒤 튕긴다 */
  var t = spTgt(cur);
  Array.prototype.forEach.call(document.querySelectorAll(".sp-wait"), function (x) { x.classList.remove("sp-wait"); });
  if (t.el && !cur.rm) {
    var cls = t.kind === "rail" && t.el.id !== "ppCnt" ? "sp-bounce" : "sp-bounce";
    t.el.classList.remove(cls); void t.el.offsetWidth; t.el.classList.add(cls);
    setTimeout(function () { t.el.classList.remove(cls); }, 400);
    if (t.kind === "card") { var rc = t.el.closest(".rc"); if (rc) { rc.classList.remove("sp-settle"); void rc.offsetWidth; rc.classList.add("sp-settle"); setTimeout(function () { rc.classList.remove("sp-settle"); }, 600); } }
  }
  if (t.kind === "tab" || t.kind === "corner") {
    var tb = el("tabbar"), b = tb && tb.querySelector('button[onclick*="\'exp\'"]');
    if (b) { b.classList.remove("sp-dot"); void b.offsetWidth; b.classList.add("sp-dot"); setTimeout(function () { b.classList.remove("sp-dot"); }, 1000); }
  }
  if (SPOP.cur === cur) SPOP.cur = null;
  if (SPOP.q.length && !SPOP.cur) setTimeout(spNext, 150);
  else if (NOTICE.q.length) { clearTimeout(NOTICE.t); NOTICE.t = setTimeout(noticePump, 250); }   /* v3.53 팝 → 팝업 */
}
/* v3.49 · 인라인 펀치는 폐지(풀스크린 팝이 맡는다) · 여기는 룰렛 글로우 기록과 본 스탬프 기록만 */
function ppAfterRender(n, oldN, glow) {
  if (PP.animOn) return;
  PP.animOn = true;
  /* 핸들을 남긴다 · 테스트 되돌리기·초기화가 이 2초 사이에 일어나면 취소해야 pp_glow3·pp_seen 이 되살아나지 않는다 (v3.28) */
  PP.seenT = setTimeout(function () {
    PP.animOn = false; PP.seenT = null;
    var st = S.get("stamps", []).filter(stampKnown);   /* v5.68 p3h 포함 */
    S.set("pp_seen", st);
    if (glow && stampCount() >= 3) S.set("pp_glow3", true);
  }, 2000);
}
/* 기본 순서 = 장소 그룹순: 1F 3건(01 전시·02 부스·06 QR퀴즈) → 17F(03) → 앱(04·05).
   완료 카드는 위로 올라온다(완료 그룹 상단, 그 안에서 기본 순서 유지) · 그룹 캡션은 미완료 구간에만 얇게. */
var PP_ORDER_V1 = [["p1", "1F"], ["p2", "1F"], ["p7", "1F"], ["p3", "17F · 1F · 18F"], ["st", "계단"], ["p4", "앱"], ["p5", "앱"], ["sv", "앱"]];
/* v4.83 새 8종 · 번호 순서 그대로 · 묶음 제목 없음(수단 칩은 2묶음) */
var PP_ORDER_V2 = [["lg", ""], ["qz", ""], ["p4", ""], ["p2", ""], ["p5", ""], ["p3", ""], ["st", ""], ["sv", ""]];
var PP_ORDER = PP_ORDER_V2;
/* v4.06 방금 적립한 현장 스탬프 · 같은 층에서 아직 안 한 현장 스탬프 하나 (QR 상호작용 기획 2-3) · 코칭 문장 없이 버튼 라벨만 */
var PP_NEXT_V1 = { p1: ["p7", "p2"], p2: ["p7", "p1"], p7: ["p1", "p2"], p3: ["sv", "p5"] };
var PP_NEXT_V2 = { p2: ["p5", "sv"], p3: ["sv", "p5"] };
var PP_NEXT = PP_NEXT_V2;
/* v4.83 스탬프 체계 판 바꾸기 · 2 = 새 8종(새 서버 sync stv 2) · 1 = 옛 8종(stv 없는 옛 서버) · 바뀌었으면 true(부른 쪽이 다시 그린다) */
function stampVerSet(v) {
  v = v === 2 ? 2 : 1;
  var chg = v !== STAMP_V;
  STAMP_V = v;
  STAMPS = v === 2 ? STAMPS_V2 : STAMPS_V1;
  PP_ORDER = v === 2 ? PP_ORDER_V2 : PP_ORDER_V1;
  PP_NEXT = v === 2 ? PP_NEXT_V2 : PP_NEXT_V1;
  if (S.get("stv", 0) !== v) S.put("stv", v);   /* v4.84 조용히 저장 · 첫 실행(스크립트 중간)에 다시 그리기 이벤트를 내지 않는다(QRS 정의 전 qrGated 오류) · 바뀌면 부른 쪽이 그린다 */
  return chg;
}
stampVerSet(S.get("stv", 2) === 1 ? 1 : 2);
/* 보상 레일 (v3.1) · 사다리 카드+룰렛 쿠폰 카드를 한 줄로. 마커 3=룰렛(탭=쿠폰 모달) · 4~6=응모(탭=추첨 안내 모달).
   v3.2: 레일은 6단이다(v4.58 다시 6단 · 6개가 한도 · 칸 끝 = 6). 1·2 지점에도 보상 없는 회색 틱을 둬서 1~2개인 사용자도 진행이 레일 위에 찍혀 보이게 한다.
   홈·스탬프 탭 공용 컴포넌트 (design.md 컴포넌트 일관성) · home=true 는 컴팩트 변형(캡션 축약 + 하단 CTA)일 뿐 시각 문법은 동일. */
/* v3.44c 레일 아이콘 · SICO 선 아이콘 문법 · 룰렛 판(바늘 + 살 3개) · 응모권(양옆 홈 + 절취선) */
var RAIL_ICO = {
  wheel: SICO + '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V6M12 13.5l6.5 3.75M12 13.5l-6.5 3.75"/><path d="M10 2.5h4L12 5z" fill="currentColor" stroke-width="1.2"/></svg>',
  ticket: SICO + '<path d="M3.5 7h17v3.2a1.8 1.8 0 0 0 0 3.6V17h-17v-3.2a1.8 1.8 0 0 0 0-3.6z"/><path d="M14.5 7.5v1.6M14.5 11.2v1.6M14.5 14.9v1.6"/></svg>'
};
/* v3.44c (사용자 요청 260917 · 규칙 문장이 많다) · 설명 줄 삭제 · 라벨은 짧게(룰렛 · 1장~3장) · 규칙 설명은 마커를 누르면 뜨는 모달에만 */
function railHtml(n, glow, dispN, home) {
  if (dispN == null) dispN = n;
  var shown = Math.min(STAMP_DENOM, dispN);
  n = Math.min(REWARD_CAP, n); dispN = Math.min(REWARD_CAP, dispN);
  var out0 = S.get("roulette_out", false);
  var used = S.get("roulette_used", false);
  /* v4.58 · 1~6 한 줄 · 6 이 레일 끝(7번째 칸 폐지 · 사용자 확정 260929) */
  var marks = [[3, "룰렛", "ppRouletteOpen()", "wheel", used ? "룰렛 사용 완료" : "룰렛 1회"], [4, "1장", "ppDrawOpen()", "ticket", "행운권 1장"], [5, "2장", "ppDrawOpen()", "ticket", "행운권 2장"], [6, "3장", "ppDrawOpen()", "ticket", "행운권 3장"]];   /* v4.83 사용자 표시 용어 「행운권」 */
  var railPos = function (k) { return k / STAMP_DENOM * 100; };
  var nextAt = n < STAMP_DENOM ? Math.max(3, n + 1) : 0;   /* 다음 목표 마커 하나만 강조 */
  var mk = "", lb = "";
  [1, 2].forEach(function (k) {
    mk += '<span class="tick' + (n >= k ? " on" : "") + '" style="left:' + railPos(k).toFixed(1) + '%"></span>';
  });
  marks.forEach(function (m) {
    var pos = railPos(m[0]).toFixed(1) + "%";
    /* 사용 가능해진 룰렛(3 도달·미사용)은 검정 = 지금 행동할 것 (v3.6 상태 위계) · 검정을 못 받으면 오렌지 채움 + 틴트 링(avail) */
    var st = m[0] === 3 && n >= 3 && !used ? (isBlack("roulette") ? " act" : " on avail") : n >= m[0] ? " on" : m[0] === nextAt ? " next" : "";
    mk += '<button class="mk' + st + (m[0] === 3 && glow ? " glow" : "") + '" style="left:' + pos + '" onclick="' + m[2] + '" aria-label="스탬프 ' + m[0] + "개 · " + m[4] + '">' +
      RAIL_ICO[m[3]] + '<span class="no">' + m[0] + "</span></button>";
    lb += '<span class="' + (n >= m[0] ? "on" : m[0] === nextAt ? "next" : "") + '" style="left:' + pos + '">' + m[1] + "</span>";
  });
  var fx6 = home ? "" : fcfsRailHtml();   /* v5.96 (사용자 261006 밤) 스탬프 탭 · 나의 보상 = 선착순 두 줄을 6번 칸(3장) 아래로 · 홈은 옛 한 줄 그대로 */
  return '<div class="rail">' +
    '<div class="hd"><span class="nm">스탬프 보상</span><span class="cnt"><span id="ppCnt">' + shown + "</span><small> / " + STAMP_DENOM + "</small></span></div>" +
    '<div class="rb"><i style="width:' + railPos(n).toFixed(1) + '%"></i>' + mk + "</div>" +
    '<div class="lbls' + (fx6 ? " fx6" : "") + '">' + lb + fx6 + "</div>" +
    (out0 ? '<p class="cap">' + (roulCut() ? "룰렛 " + roulCutHm() + " 마감" : "룰렛 소진") + "</p>" : dispN >= STAMP_DENOM ? '<p class="cap">' + STAMP_DENOM + "개 모두 모았어요" + (home ? fcfsCapTxt() : fcfsCapWhere()) + "</p>" : "") +
    (home ? fcfsLeftHtml(dispN) : "") +   /* v5.90 선착순 참여상 남은 수량 한 줄(홈 · 스탬프 탭 같은 레일) */
    raffleNumsHtml(n) + prizeGoHtml() +   /* v5.08 경품 보기 입구(홈 · 스탬프 탭 같은 레일) */
    "</div>";
}
/* v3.31c 내 응모 번호 · 응모권 1장 이상일 때만 · 서버 번호가 아직 없으면 「발급 중」 회색 (v3.12 모달과 같은 규칙) */
function raffleNums() { return testMode() ? ["1026", "2026", "3026"] : S.get("raffle_nums", []); }
function raffleNumsHtml(n) {
  var t = raffleTickets(Math.min(REWARD_CAP, n));
  if (!t) return "";
  var nums = raffleNums(), chips = "", op = rfxOpened(t);
  for (var i = 0; i < RAFFLE_MAX; i++) chips += i >= t ? '<span class="gap"></span>' : i >= op ? tktHtml("new", "새 번호<br>확인", "event.stopPropagation(); rfxReopen()") :   /* v4.44 상자를 열기 전에는 번호를 먼저 보여 주지 않는다 */
    i < nums.length ? tktHtml("no", nums[i]) : tktHtml("wait", "발급 중");
  return '<div class="rnum"><p class="lb">내 행운권 번호</p><div class="tkts">' + chips + "</div></div>";
}
/* 261009 (사용자 「행운권 모양 테두리에 번호도 점 문자로 · 은색 비슷한 회색톤」 · 시안 ④ 메인 선택) 행운권 번호 칩 = 티켓 한 모양(레일 · 나의 보상 · 추첨 안내 팝업 같은 칩)
   모양 = 양옆 반원 홈 + 왼쪽 절취선 · 번호 = 은회색 무광 면(canvas) · 회색 테두리(divider-strong) · 어두운 회색 절취선(muted) · 먹색 점 글자(DotGlyph 12px · 읽는 이름 = 번호) · 추첨 체크인 결과 화면 번호 줄도 같은 칩
   열기 전 「새 번호 확인」 = 같은 티켓의 주황 면(누를 것) · 「발급 중」 = 같은 티켓의 회색 면 · 색은 토큰만(CSS .tkt.tk) · 상자 연출(rfx) 끝 화면은 그대로(흰 상자 위 brandText 점) */
function tktHtml(k, v, tap) {
  if (k === "new") return '<button type="button" class="tkt tk new" onclick="' + tap + '"><span class="tk-t">' + v + "</span></button>";
  if (k === "wait") return '<span class="tkt tk wait"><span class="tk-t">' + v + "</span></span>";
  return '<span class="tkt tk">' + DotGlyph.svg(String(v), { h: 12, label: String(v) }) + "</span>";
}
/* 룰렛 쿠폰 모달 · 내 QR + 사용 여부 (사용 여부는 서버 my.roulette 가 정본, sync 가 roulette_used 로 받아쓴다) */
function ppRouletteOpen() {
  var n = stampCount();
  var used = S.get("roulette_used", false);
  /* v4.13 상태 칩은 제목 줄이 아니라 본문 첫 줄(닫기 X 자리와 겹치지 않게) */
  var head = '<div class="axs-chiprow">' + (used ? '<span class="axs-chip off">사용 완료</span>' : n >= 3 ? '<span class="axs-chip">사용 가능 · 1인 1회</span>' : '<span class="axs-chip off">스탬프 ' + n + " / 3</span>") + "</div>";
  var body;
  /* v3.33 룰렛 소진 안내 · 관리 콘솔 스탬프 탭(roulette_out)에서 켠다 */
  if (S.get("roulette_out", false) && !used) {
    body = '<p style="margin-top:8px;font-size:calc(14.5px * var(--fs));font-weight:800;color:var(--hi)">' + (roulCut() ? "룰렛 " + roulCutHm() + " 마감" : "룰렛 소진") + "</p>";   /* v5.90 시각 마감 = 소진과 같은 처리 */
  } else if (used) {
    body = "";
  } else if (n < 3) {
    body = needBoxHtml("받으려면", "룰렛 받으려면", pzNeedRows("roulette"));   /* 261008 받으려면 상자(경품 시트 룰렛 구역과 같은 줄) · 옛 회색 한 줄 「스탬프 3개 · 1F EVENT · 1인 1회」 */
  } else {
    body = needBoxHtml("받으려면", "룰렛 받으려면", pzNeedRows("roulette")) +   /* 261008 받으려면 상자 · 옛 회색 줄 「1F EVENT 룰렛 부스에서 QR 제시 / 룰렛 HH:MM 마감」(마감 시각은 상자 둘째 줄 보조 글) */
      '<button type="button" class="ax-button" style="margin-top:10px" onclick="qrPanelOpen(\'mine\')">내 QR 보여주기</button>';   /* v5.23 내 QR 은 QR 화면 한 곳(룰렛 1회권 상태 줄 포함) */
  }
  modalOpen(head + body + prizeModalHtml("roulette") + '<button class="btn line" style="margin-top:12px" onclick="modalClose()">닫기</button>', "룰렛 1회권");   /* v5.04 경품표(사진 · 이름 · 수량) */
}
/* v4.42 응모권 보물상자 팝업 · 새 응모권이 생긴 순간 한 번(checkRewards → notice raffle) · 다시 보는 곳은 기존 추첨 안내 모달(ppDrawOpen) · 내 보상
   닫힌 상자(살짝 들썩) + 챗봇 한 줄 → 상자 또는 「상자 열기」 → 뚜껑이 열리며 새 번호 칩이 떠오른다 → 챗봇 「행운을 빌어요」
   번호는 서버가 발급한다(sync my.tickets) · 아직 없으면 챗봇 「꺼내는 중」 + 곧바로 beSync · 8초 안에 안 오면 「발급 중 · 곧 내 보상에」로 닫는다 */
/* 상자 = 뒤 층(빛살 · 그림자 · 속 · 뚜껑) + 번호 칩 + 앞 층(몸통 앞면 · 자물쇠) · 번호가 몸통 안에서 튀어 올라 앞면 위로 나온다 */
var RFX_BACK = '<svg class="rfx-chest" viewBox="0 0 140 110" aria-hidden="true">' +
  '<g class="rfx-rays">' + [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(function (a) { return '<rect x="68" y="-18" width="4" height="30" rx="2" fill="#FFC56E" transform="rotate(' + a + ' 70 50)"/>'; }).join("") + "</g>" +
  '<ellipse cx="70" cy="104" rx="52" ry="5" fill="rgba(0,0,0,.12)"/><rect x="22" y="50" width="96" height="14" rx="3" fill="#5E3218"/>' +
  '<g class="rfx-lid"><path d="M20 56 V40 Q20 22 38 22 H102 Q120 22 120 40 V56 Z" fill="#FF7F32"/><rect x="20" y="48" width="100" height="8" fill="#FFC56E"/>' +
  '<rect x="34" y="24" width="9" height="32" fill="#A63D00"/><rect x="97" y="24" width="9" height="32" fill="#A63D00"/><path d="M30 30 Q34 26 44 26" stroke="#FFF1E8" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
  "</svg>";
var RFX_FRONT = '<svg class="rfx-chest rfx-front" viewBox="0 0 140 110" aria-hidden="true">' +
  '<rect x="20" y="56" width="100" height="44" rx="6" fill="#E0661C"/><rect x="20" y="64" width="100" height="6" fill="#FFC56E"/>' +
  '<rect x="34" y="56" width="9" height="44" fill="#A63D00"/><rect x="97" y="56" width="9" height="44" fill="#A63D00"/>' +
  '<rect x="61" y="52" width="18" height="20" rx="3" fill="#FFC56E" stroke="#A63D00" stroke-width="2"/><circle cx="70" cy="60" r="2.6" fill="#A63D00"/><rect x="69" y="61" width="2" height="6" fill="#A63D00"/>' +
  "</svg>";
/* v4.44 (사용자 260925 · 레드팀 토론) 제목 = 「응모 완료 · 번호 확인」(도장 연출 한 줄 「응모권 N장 · 번호 발급」과 겹치지 않게) · 닫힌 상자 첫 줄에 「응모는 이미 됐어요」(닫아도 손해 없음을 먼저)
   v4.49 모든 응모권을 직접 연다(5개째부터 저절로 열던 것 폐지 · 사용자 260925) · 열 때 아직 안 연 번호를 모두 꺼낸다(4개째를 「나중에 보기」로 닫았어도 빠지는 번호가 없다)
   자동으로 닫지 않는다(천천히 읽는 사람이 번호를 놓친다) · 주 버튼 = [확인] 하나 */
function rfxTitle(t) { return "행운권 발급 · 번호 확인"; }   /* v4.83 「응모 완료」 → 「행운권 발급」 */
function rfxOpened(t) { var o = S.get("raffle_opened", null); return o === null ? t : Math.min(o, t); }   /* 상자를 연 응모권 수 · 기록이 없으면(이 버전 전) 다 연 것으로 */
function rfxHtml(o) {
  var t = o.raffle || 1, first = true;   /* v4.49 (사용자 260925 「두 번째 · 세 번째도 내가 열어야 · 처음 응모번호와 같게」) 모든 응모권을 직접 연다 · 버튼 · 문구 모양이 같다 */
  var say = (t === 1 ? "스탬프 " + stampCount() + "개!" : "행운권 " + t + "장째!") + " 행운권은 이미 발급됐어요<br>상자를 열어 번호를 확인하세요";
  return '<div class="rfx" id="rfx" data-t="' + t + '">' +
    '<div class="rfx-say"><span class="rfx-bot">' + BOT_SVG.replace("</svg>", BOT_WAVE + "</svg>") + '</span><p class="rfx-b" id="rfxSay">' + say + "</p></div>" +
    '<button type="button" class="rfx-stage" onclick="rfxOpen()" aria-label="보물상자 열기">' + RFX_BACK + '<span class="rfx-num" id="rfxNum" aria-live="polite"></span>' + RFX_FRONT + "</button>" +
    '<p class="rfx-cap" id="rfxCap">' + esc(o.body || "행운권 발급 · 17:00 Closing Speech 추첨") + "</p>" +
    '<div id="rfxBtns">' + (first ? '<button class="btn mint" style="margin-top:14px" onclick="rfxOpen()">상자 열기</button><button class="btn line" style="margin-top:8px" onclick="modalClose()">나중에 보기</button>' : "") + "</div></div>";
}
/* 레일 · 추첨 안내의 「새 번호 확인」 · 아직 안 연 응모권 상자를 다시 연다(열면 바로 꺼낸다) */
function rfxReopen() {
  var t = raffleTickets(Math.min(REWARD_CAP, stampCount())); if (!t) return;
  modalOpen(rfxHtml({ raffle: t }), esc(rfxTitle(t)));   /* v4.49 여기서도 직접 연다 */
}
/* 누르는 즉시 연다(서버를 기다리지 않는다) · 안 연 번호(op+1 ~ t)를 모두 꺼낸다 · 아직 없으면 숫자가 굴러가다 도착하는 순간 멈춘다 · 8초 넘으면 「발급 중」 */
function rfxOpen() {
  var w = el("rfx"); if (!w || w.classList.contains("open")) return;
  var t = +w.getAttribute("data-t") || 1, from = Math.min(rfxOpened(t), t - 1), t0 = Date.now(), nm = el("rfxNum");
  var pick = function () { var a = raffleNums().slice(from, t); return a.length === t - from && a.every(Boolean) ? a.map(String) : null; };
  S.set("raffle_opened", t);
  nm.classList.toggle("multi", t - from > 1);
  w.classList.add("open");
  var got = pick();
  if (got) { rfxLand(got, false); return; }   /* 이미 있으면 상자에서 튀어 오르는 연출(rfxPop) 그대로 */
  nm.classList.add("roll"); el("rfxSay").textContent = "행운권 번호를 꺼내고 있어요…";   /* v5.97 감사 하1 */
  el("rfxBtns").innerHTML = '<button class="btn line" style="margin-top:14px" onclick="modalClose()">나중에 보기</button>';   /* 굴러가는 동안 「상자 열기」는 할 일이 없다 */
  if (BE.on && !testEmp()) beSync();
  var roll = function () { var s = []; for (var k = from; k < t; k++) s.push(String(1000 + Math.floor(Math.random() * 9000))); nm.innerHTML = s.map(function (x) { return "<b>" + rfxDot(x, t - from > 1, false) + "</b>"; }).join(""); };   /* v5.10 굴러가는 숫자는 읽지 않는다(aria-live 가 70ms 마다 읽던 것) */
  var iv = setInterval(function () {
    if (!el("rfx")) { clearInterval(iv); return; }
    var g = pick();
    if (g) { clearInterval(iv); rfxLand(g, true); return; }
    if (Date.now() - t0 > 8000) { clearInterval(iv); rfxLand(null, true); return; }
    roll();
  }, 70);
  roll();
}
/* v5.10 행운권 번호 = 점 글자(design.md A-5 5-20) · 하나 30px · 여러 개 24px · 멈출 때만 점이 차례로 켜지고 읽는 이름 = 번호(aria-live) · 굴러가는 동안은 읽지 않음 · 동작 줄이기 = 켜진 모양
   번호 칩(레일 · 나의 보상 · 추첨 안내)도 261009부터 점 글자 티켓(tktHtml · 12px · 움직임 없음 · 읽는 이름 = 번호) · 이 상자 연출은 그대로 */
function rfxDot(x, multi, land) {
  return DotGlyph.svg(String(x), land ? { h: multi ? 24 : 30, label: String(x), anim: !rgReduced(), step: 22 } : { h: multi ? 24 : 30, hidden: true });
}
function rfxLand(nums, late) {   /* nums = 번호 배열(없으면 null) · late = 굴러가던 숫자가 멈추는 순간 · 한 번 통 튄다 */
  var w = el("rfx"); if (!w) return;
  var nm = el("rfxNum"); nm.classList.remove("roll"); nm.innerHTML = nums ? nums.map(function (x) { return "<b>" + rfxDot(x, nums.length > 1, true) + "</b>"; }).join("") : "발급 중"; nm.classList.toggle("wait", !nums);
  if (late) { nm.classList.remove("land"); void nm.offsetWidth; nm.classList.add("land"); }
  el("rfxSay").innerHTML = nums ? (nums.length > 1 ? "번호 " + nums.length + "개가 나왔어요! 행운을 빌어요" : "행운을 빌어요!") + "<br>" + drawWhenTxt() + fcfsPopLine() : "번호가 아직 발급 중이에요<br>곧 나의 보상에 나타나요";   /* v4.79 무대 추첨 = 추첨 QR 체크인한 사람만 · v5.04 6개째는 참여상 한 줄(별도 팝업 없음) */
  el("rfxCap").textContent = nums ? "내 행운권 번호 · 17:00 Closing Speech 추첨" : "행운권은 이미 발급됐어요 · 17:00 Closing Speech 추첨";   /* v5.04 옛 「결과는 행사 후 개별 안내」(260909 사후 추첨 안) 폐기 */
  el("rfxBtns").innerHTML = '<button class="btn mint" style="margin-top:14px" onclick="modalClose()">확인</button><button class="btn line" style="margin-top:8px" onclick="noticeGo(\'rewards\',\'raffle\')">나의 보상에서 보기</button>';
  if (nums && typeof stampBuzz === "function") stampBuzz(30);
  App.render();   /* 레일의 「새 번호 확인」 칩을 번호로 바꾼다 */
}
/* 추첨 안내 모달 · 구 ev_draw 화면 흡수 (v3.1) · v3.12 내 응모권 번호 표시 (서버 발급 · 데모는 결정적 목업) */
function ppDrawOpen() {
  var n = Math.min(REWARD_CAP, stampCount()), t = raffleTickets(n);
  var tickets = "";
  if (t) {
    var nums = raffleNums().slice(0, t), op = rfxOpened(t);
    var chips = "";
    for (var i = 0; i < t; i++) {
      chips += i >= op ? tktHtml("new", "새 번호 확인", "modalClose(); rfxReopen()") : i < nums.length ? tktHtml("no", nums[i]) : tktHtml("wait", "발급 중");   /* 261009 레일과 같은 티켓 칩(tktHtml) */
    }
    tickets = '<div class="tkts">' + chips + "</div>";
  }
  modalOpen('<div class="axs-chiprow"><span class="axs-chip' + (t ? "" : " off") + '">지금 ' + t + "장</span></div>" + tickets +   /* 261008 상태 = 룰렛 1회권 팝업과 같은 칩 한 줄 */
    needBoxHtml("받으려면", "행운권 받으려면", [["stamp", "스탬프 4개 1장 · 5개 2장 · 6개 3장", "자동 발급"]].concat(pzNeedRows("draw").slice(1))) +   /* 261008 받으려면 상자 · 둘째 줄 = 경품 시트 행운권 추첨 구역 둘째 줄(참석 조건 lkcond 따라) · 옛 회색 줄 「스탬프 4개 1장 · 5개 2장 · 6개 3장 · 자동 발급」 · 「17:00 Closing Speech 현장 추첨 · 경품은 따로 전달」(lc 「· 16:40부터 17F 입구 QR 체크인」) */   /* v5.90 행운권_참석조건(sync lkcond) */   /* v4.79 무대 추첨 · v4.83 사용자 표시 용어 「행운권」 · v5.04 옛 「행운권 추첨 결과는 행사 후 개별 안내」 줄 삭제(사후 추첨 없음) */
    prizeModalHtml("draw") +   /* v5.04 1~6등 10명 · 사진 · 이름 · 인원 */
    '<button class="btn line" style="margin-top:12px" onclick="modalClose()">닫기</button>', "행운권");
}

