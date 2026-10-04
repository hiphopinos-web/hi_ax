/* ═══ AX 단어 소나기 · 참가자 앱 껍데기 (v4.20 · 260923) ═══
   규칙·그리기·판정·입력은 전부 assets/rain-engine.js 한 곳에 있다. 여기에는 이 앱에만 있는 것만 둔다:
   오버레이 골격(gsOverlay) · HUD·입력 HTML · 일시정지 UI · 끝난 뒤 기록 보내기 · 결과 카드.
   선수 화면(admin/typing.html)이 같은 엔진으로 대전을 돌린다. 단어 풀과 난이도는 두 곳에서 어긋날 수 없다.
   260923 사용자 확정: 단어 풀은 260917 원본 61개(뜻 없음) · 게임 중 뜻 표시와 되새김 화면은 만들지 않는다 ·
   시간 제한 없음(목숨이 떨어지면 끝) · 안전 상한은 엔진 RAIN_CAP_SEC.
   v4.29(260924 사용자 확정) 영어 단어 0개 · 영문 자판 로마자 → 한글 · 넓은 화면 솔로 옆판(NEXT · TOP 5 · 점수·목숨·단계) · 키보드 기기는 스페이스로 시작(엔진).
     정리 #4(261005) 앱(폰) 솔로(mode app · 시작 화면 · 결과 · 스페이스 · type_submit)는 지웠다 · 이 껍데기는 1F 셀프(site)만 쓴다.
   v4.32(260924 사용자 확정) 넓은 화면 3단(왼쪽 NEXT·점수 / 가운데 판 / 오른쪽 TOP 10) · 1F 현장은 셀프 모드(tsf*) · 현장 판 위 줄에는 소리·멈춤 단추가 없다(스태프가 켤 때 정한다 · 중간에 그만두기 없음). */
var RG_HEART = '<svg viewBox="0 0 7 6" width="17" height="15" shape-rendering="crispEdges" aria-hidden="true"><path d="M0 0h3v2H0zM4 0h3v2H4zM0 2h7v2H0zM1 4h5v1H1zM2 5h3v1H2z"/></svg>';
/* v4.52(260928 사용자 확정) 옆판(왼쪽 상자 rgLeftDraw)이 이미 점수·목숨을 보여주므로(v4.51) 위 줄은 중복 ·
   옆판이 있을 때(rgSideOn, 넓은 화면 솔로 · 1F 셀프)는 시간만 남긴다 · 좁은 화면(옆판 없음)과 대전은 그대로 셋 다 보인다 */
function rgTopHtml() {
  var side = typeof rgSideOn === "function" && rgSideOn();
  var hearts = "", n = RG.lives0 || RAIN_LIVES;
  for (var i = 0; i < n; i++) hearts += '<i class="on">' + RG_HEART + "</i>";
  return '<div class="rg-hud">' +
    (side ? "" : '<span class="rg-sc"><small>점수</small><b id="rgHudSc">0</b></span>') +
    '<span class="rg-tm" id="rgHudTm">0.0초</span>' +
    (side ? "" : '<span class="rg-ht" id="rgHudHt">' + hearts + "</span>") +
    (RG.mode === "site" ? "" : sndBtnHtml(false) +
    '<button class="rg-ib rgp-x" type="button" data-on="계속" data-off="멈춤" aria-label="일시정지" onpointerdown="event.preventDefault()" onclick="gsPauseToggle()">멈춤</button>') + "</div>";
}
function rgPlayOpen() {
  RGP.on = true; RGP.touch = rgTouch();   /* 입력창 안내 문구가 기기에 맞게 나오게 먼저 켠다 */
  gsOverlayOpen({ key: "type", title: "AX 단어 소나기", top: rgTopHtml(), fill: true, cls: "rain" + (RG.big ? " big" : ""), cw: 180, ch: 300, canvasId: "rgCv", bottom: rgFormHtml(),
    down: function (e) { e.preventDefault(); if (RG.wait) rgBegin(); rgFocus(); },   /* v4.29 대기 화면은 판을 눌러도 시작 */
    resized: function (cv, w, h) { rgFit(cv, w, h); rgFormFit(); },
    running: function () { return RG.on && !RG.paused && !RG.ending; }, isPaused: function () { return !!RG.paused; },
    pause: rgPause, resume: rgResume, quit: rgQuit });
  rgSideTopPull();
}
/* v4.29 넓은 화면 옆판 · 서버 순위판(type_rank) 읽기만 · v5.29 (사용자 261003) 앱 솔로도 1F 현장 순위 · 앱(폰) 순위(mode app)는 받지도 보이지도 않는다
   v4.32 오른쪽 판 TOP 10(제목 RG.topT) · 내 기록(me)은 서버가 짚는다 · 1F 현장은 셀프 모드가 받아 둔 순위(TSF.top)를 먼저 보이고 도전자 사번으로 다시 받는다 · 왼쪽 판 도전자 닉네임(RG.who)
   판 도중에 App.render 가 불리면 게임이 멈추므로 S.set(axf-store) 을 쓰지 않고 엔진 값(RG.top)만 바꾼다 · 서버가 없으면(데모) 빈 목록 */
function rgSideTopPull() {
  if (!rgSideOn()) return;
  var c = TSF.top;   /* 정리 #4 앱(폰) 솔로 없음 · 1F 셀프만 */
  var conv = function (r) { return ((r && r.top) || []).slice(0, 10).map(function (x) { return { no: x.rank, name: x.name, val: typePts(x.score), me: !!x.me }; }); };   /* v5.12 1F 현장 = 점수 */
  RG.topT = "현장 TOP 10"; RG.who = TSF.nick;   /* v5.12 1F 현장은 오른쪽 판이 추월 레이스(RG.race) · 이 TOP 10 은 레이스 목록을 못 받았을 때만 보인다 */
  if (c) RG.top = conv(c);   /* 받아 둔 목록을 먼저 보인다 · 도전자 줄 표시(me)는 새로 받은 목록부터 */
  if (!BE.on) { if (!c) RG.top = []; return; }
  beCall({ action: "type_rank", mode: "site", emp: TSF.emp, n: 10 }, function (r) { if (r && r.ok && RG.on) RG.top = conv(r); }, function () { if (RG.on && !RG.top) RG.top = []; });
}
function rgPlayClose() { RGP.on = false; gsOverlayClose("type"); }
/* v4.51(260925 사용자) 넓은 화면 3단 · 입력칸 = 가운데 판 폭(틀 포함) · 판 바로 아래 · 엔진 배치(RG.L)를 따른다(판 틀 L.fr 과 같은 세 겹) · 옆판이 없으면(휴대폰 · 좁은 창) 옛 모양 그대로 */
function rgFormFit() {
  var d = el("rgPlay"), L = RG.L, on = !!(L && L.pan); if (!d) return;
  d.classList.toggle("side", on);
  ["rgForm", "rgTip"].forEach(function (id) {
    var n = el(id); if (!n) return;
    n.style.marginLeft = on ? L.ox - L.fr + "px" : ""; n.style.width = on ? L.W + 2 * L.fr + "px" : "";
  });
}
function rgFormHtml() {
  return '<p class="rg-tip" id="rgTip" hidden>한글 자판으로 바꿔 주세요</p>' +
    '<form class="rg-form" id="rgForm" onsubmit="event.preventDefault(); rgEnter()">' + rgInputHtml() +
    '<button class="btn mint" type="submit" onpointerdown="event.preventDefault()" onmousedown="event.preventDefault()" ontouchstart="event.preventDefault(); rgEnter()">쏘기</button></form>';
}
function rgInputHtml() {
  return '<input id="rgIn" class="input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" inputmode="text" maxlength="12" placeholder="' + (rgAutoOn() ? "단어를 치면 바로 터져요" : "떨어지는 단어를 치고 Enter") + '" ' +
    'onpaste="event.preventDefault()" ondrop="event.preventDefault()" oninput="rgLive(event)">';
}
function rgPause() {
  if (!RG.on || RG.paused) return;
  RG.paused = true; RG.pauseAt = performance.now();
  if (RG.raf) cancelAnimationFrame(RG.raf); RG.raf = 0;
  gsPauseUi(true);
}
function rgResume() {
  if (!RG.on || !RG.paused) return;
  var gap = performance.now() - (RG.pauseAt || performance.now());
  if (RG.t0) RG.t0 += gap;
  RG.paused = false; RG.last = performance.now();
  gsPauseUi(false);
  rgFocus();
  RG.raf = requestAnimationFrame(rgFrame);
}
function rgQuit() {
  rgStop();
  tsfQuit();   /* v4.32 현장 셀프 · 중간에 그만두면 기록 없이 처음 화면(시작한 순간 1회는 이미 썼다) */
}
/* 엔진이 1.2초 마무리 화면을 보여 준 뒤 부른다 · 기록 = 버틴 시간(1/100초) · 점수는 보조 지표 */
function rgEndFinal(why) {
  if (!RG.on) return;
  rgStop();
  var s = rgStat(), surv = Math.round((RG.surv || 0) * 100), site = RG.mode === "site";
  RG.resAt = performance.now();   /* v4.29 결과 직후 1초는 스페이스 「다시 하기」를 받지 않는다(치던 손이 눌러 버린다) */
  RG.res = { why: why, score: site ? s.score : surv, pts: s.score, surv: surv, bns: s.bns, bnsN: s.bnsN, capBns: s.capBns, hits: s.hits, combo: s.combo, acc: s.acc, me: null, send: "", prev: 0 };   /* v4.28 prev = 이번 판 전 내 최고(결과 「신기록!」) · v5.12 1F 현장(site) 기록 = 점수 · 앱은 버틴 시간 */
  if (typeof tsfDone === "function") tsfDone(RG.res);   /* v4.32 1F 현장 셀프 모드 · 정리 #4(261005) 앱(폰) 솔로 갈래는 지웠다 */
}
/* ── 닉네임 · 순위판 ── */
function typeNick() { return S.get("type_nick", ""); }
function typeNickValid(v) {
  if (!v) return "2~8자로 정해 주세요";
  if (!/^[0-9A-Za-z가-힣]{2,8}$/.test(v)) return "한글·영문·숫자 2~8자만 쓸 수 있어요 (공백·기호 불가)";
  return "";
}
function typeNickInput(v, e) {
  if (e && e.isComposing && /[\u3131-\u318e]$/.test(v)) return;   /* v4.25 「ㅌ」처럼 아직 만들어지는 낱자에서는 형식 오류 문구를 띄우지 않는다 · 조합이 끝나면 다시 본다 */
  var m = el("tnMsg"); if (m) m.textContent = typeNickValid(v.trim()) || "사용할 수 있는 형식이에요";
}
var TYPE_NICK_WHY = { format: "한글·영문·숫자 2~8자만 쓸 수 있어요", dup: "이미 쓰는 닉네임이에요", ban: "쓸 수 없는 단어가 들어 있어요", realname: "임직원 실명과 같은 닉네임은 쓸 수 없어요", param: "사번으로 입장한 뒤 정할 수 있어요" };
function typeNickSave() {
  var v = ((el("tnIn") || {}).value || "").trim(), bad = typeNickValid(v);
  if (bad) { toast(bad); return; }
  if (testMode() || !BE.on) { S.set("type_nick", v); S.set("type_nick_edit", false); App.render(); return; }
  var u = S.get("user", {}) || {};
  beCall({ action: "type_nick_set", emp: u.empId || "", nick: v }, function (r) {
    if (r && r.ok) { S.set("type_nick", r.nick); S.set("type_nick_edit", false); App.render(); }
    else toast(TYPE_NICK_WHY[r && r.reason] || "저장하지 못했어요. 다시 눌러 주세요.");
  }, function () { toast("서버에 연결할 수 없어요"); });
}
/* v4.16 (사용자 확정 260922) 관리자·테스트 계정이어도 순위판은 항상 실서버 값 · 가짜 닉네임 목업(typeTestTop·typeTestRank·TYPE_TEST_NICKS)은 삭제 */
function typeRankPull(mode, cb) {
  var u = S.get("user", {}) || {};
  if (mode === "site") TYB.at = Date.now();
  beCall({ action: "type_rank", mode: mode, emp: u.empId || "", n: 10 }, function (r) { if (r && r.ok) { S.put("type_rank_" + mode, r); cb(r); } }, function () {});   /* v5.15 현장도 TOP 10 · 조용한 저장(S.put) · S.set 은 화면 전체를 다시 그려 그 그리기가 또 받기를 불러 끝없이 돌았다(261003 실측 초당 약 2회) */
}
/* v3.80 기록 = 버틴 시간(1/100초) · 화면에는 「n초」 로 보여 준다 */
function typeSec(v) { return (Number(v || 0) / 100).toFixed(1) + "초"; }
/* ── v5.31 1F 타자왕 홍보 영상 칸(사용자 261003 「순위판 좋다 · 앱에서도 보여 주면 좋은 후킹 요소」 · 「권장대로」) ──
   내용 = TV 순위판 루프의 홍보 장면(tv/typing/?promo=1 · 후킹 · 게임 · 하는 법 · 상품 · 마감 · 순위 장면 없음 · 서버 호출 0 · 칸이 화면 밖이면 스스로 멈춤 · 무음)
   자리 = 순위 화면(type_rank) 맨 위 · 1층 EVENT 구역 상세(zone_d event) 카드 아래 · 폭 72% 가운데 · 높이 상한 52vh · 9:16 · 칸 위 제목 없음
   받기 = src 를 data-src 에 두었다가 칸이 화면에 들어오면(IntersectionObserver) 넣는다(loading=lazy 보다 엄격 · 안 본 사람은 0 요청) · 점 글자는 design.md 「타자왕 홍보 영상 칸」 예외 안
   누름 = 칸이 부모에 postMessage({ axfTy: "tap" }) → 순위 화면 = 아래 1F 현장 TOP 10 판으로 부드럽게 · EVENT 구역 = 타자왕 순위 화면으로 */
var TYP_SRC = "tv/typing/?promo=1", TYP_IO = null;
/* v5.45 타자 순위 화면 = TV 순위판 루프 그대로(tv/typing/ · 주소 값 없음 · 후킹 → 게임 → 하는 법 → 상품 → 순위 → 마감 · 17:00 뒤 = 순위 → 상품 → 마감)
   순위 장면 = 1F 현장 TOP 10(공개 type_rank mode site · 30초마다 · 앱 순위판이 하던 20초 받기는 멈춤) · 칸 안 누름 없음(TV 의 「누르면 전체 화면」이 안 돌게) · 화면 꺼짐 방지 · 전체 화면 권한 끔 */
var TYP_SRC_RANK = "tv/typing/?promo=1&rank=1&t=23", TYB_SHOW = false;   /* v5.53 앱 칸 = 가벼운 판(promo · rank=1 · 33초 판 · TV 7c208cf) · t=23 = 순위 장면부터(사용자 261004 권장안 승인 · 1.7MB 자체 글꼴 · 30초 폴링 대신 앱 글꼴 · 60초) · TYB_SHOW = 옛 HIGH SCORE 순위판(tybHtml) · 코드는 그대로 두고 숨김 */
function typPromoHtml(go) {
  if (go === "rank" && !TYB_SHOW) return '<div class="typ-pv rt full"><iframe data-src="' + TYP_SRC_RANK + '" loading="lazy" title="1F 타자왕 순위판" tabindex="-1" allow="fullscreen \'none\'; screen-wake-lock \'none\'" data-go="rank"></iframe></div>';
  return '<div class="typ-pv rt"><iframe data-src="' + TYP_SRC + '" loading="lazy" title="1F 타자왕 홍보 영상" tabindex="-1" aria-hidden="true" data-go="' + go + '"></iframe></div>';
}
function typPromoSet(f) { var u = f.getAttribute("data-src"); if (u) { f.removeAttribute("data-src"); f.src = u; } }
function typPromoMount() {
  if (TYP_IO) TYP_IO.disconnect();
  var a = document.querySelectorAll(".typ-pv iframe[data-src]"); if (!a.length) return;
  if (!("IntersectionObserver" in window)) { [].forEach.call(a, typPromoSet); return; }
  if (!TYP_IO) TYP_IO = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { TYP_IO.unobserve(x.target); typPromoSet(x.target); } }); }, { rootMargin: "80px 0px" });
  [].forEach.call(a, function (f) { TYP_IO.observe(f); });
}
function typPromoTap(e) {
  if (e.origin !== location.origin || !e.data || e.data.axfTy !== "tap") return;
  var f = [].filter.call(document.querySelectorAll(".typ-pv iframe"), function (x) { return x.contentWindow === e.source; })[0];
  if (!f) return;
  if (f.getAttribute("data-go") !== "rank") { typeSiteRankGo(); return; }
  var b = document.querySelector(".tyb"); if (b) b.scrollIntoView({ behavior: rgReduced() ? "auto" : "smooth", block: "start" });
}
window.addEventListener("message", typPromoTap);
/* ── v5.15 1F 타자왕 순위판 · 앱 「타자 순위」 현장 탭(261003 · 시안 「디자인 시안/타자왕 순위판/타자왕_순위판_휴대폰.html」) ──
   HIGH SCORE TOP 10(1~3위 O100 · O60 · O30 면 · 내 줄 강조) · 아래 바 「내 순위 · 내 최고 점수 · 남은 기회」 · 1~3위 상품 썸네일(누르면 경품 포스터 1F 타자왕)
   20초마다 다시 받아(화면이 보일 때 · 이 탭일 때만) 바뀐 줄만 옮긴다: 새로 든 줄 = 아래에서 올라오며 NEW · 오른 줄 = 미끄러져 오르고 깜빡 · 점수는 세며 오른다 · 동작 줄이기 = 그 자리에 바로
   받기 = type_rank(site · n 10 · emp) · 새 서버 = unit pts · left(남은 기회 · v5.15 서버) · 옛 서버(unit 없음 = 버틴 시간 · left 없음) = 시간으로 쓰고 남은 기회 칸을 뺀다
   실명 없음(서버가 닉네임만 준다) · 부문 통계 없음 */
var TYB = { iv: 0, keys: null, subT: 0, at: 0 };
var TYB_REST = { on: false, nm: "" };   /* 4~10위 상품 줄 · 사용자 미정 · 기본 꺼짐 · on 이고 nm 이 있을 때만 줄마다 선물 표시 + 이름 한 줄 */
var TYB_PZ_SHORT = ["기계식 키보드", "마우스", "기계식 키보드"];   /* v5.35 경품명만(제품명은 좁은 칸 3열에 안 들어가 경품 화면 카드에만) */
function tybVal(r, v) { return r && r.unit === "pts" ? Math.round(Number(v || 0)).toLocaleString() : typeSec(v); }
function tybKeys(top) { var c = {}; return top.map(function (x) { var n = String(x.name || ""); c[n] = (c[n] || 0) + 1; return n + "#" + c[n]; }); }
function tybCls(x, i) { return "tyb-r" + (i < 3 ? " r" + (i + 1) : "") + (i % 2 ? " e" : "") + (x && x.me ? " me" : "") + (x ? "" : " x"); }
function tybTop(i) { return "calc(var(--tyb-h) * " + i + ")"; }
function tybSubDef(r) { return !r ? "순위를 불러오는 중이에요" : (r.top || []).length ? "1F 타자왕 · 현장 TOP 10" : "아직 기록이 없어요"; }
function tybRowInner(r, x, i) {
  return '<span class="no">' + (i + 1) + '</span><span class="tag">NEW</span><span class="nm">' + (x ? esc(x.name) : "---") + "</span>" +
    (TYB_REST.on && TYB_REST.nm && i >= 3 ? '<span class="gf" aria-hidden="true"></span>' : "") + '<span class="sc">' + (x ? tybVal(r, x.score) : "-") + "</span>";
}
function tybMeHtml(r) {
  var u = S.get("user", {}) || {};
  if (!r || !u.empId) return "";
  var m = r.me;
  return '<div class="tyb-me"><span><span class="k">내 순위</span><span class="v">' + (m ? m.rank + "위" : "-") + "</span></span>" +
    '<span><span class="k">내 최고 ' + (r.unit === "pts" ? "점수" : "기록") + '</span><span class="v">' + (m ? tybVal(r, m.score) : "-") + "</span></span>" +
    (typeof r.left === "number" ? '<span class="lf"><span class="k">남은 기회</span><span class="v">' + r.left + "회</span></span>" : "") + "</div>";
}
function tybHtml(r) {
  var top = ((r && r.top) || []).slice(0, 10), keys = tybKeys(top), rows = "";
  for (var i = 0; i < 10; i++) rows += '<div class="' + tybCls(top[i], i) + '" data-k="' + (top[i] ? esc(keys[i]) : "_" + i) + '" style="top:' + tybTop(i) + '">' + tybRowInner(r, top[i], i) + "</div>";
  TYB.keys = r ? keys : null;
  return '<section class="tyb" aria-label="1F 타자왕 현장 TOP 10"><h2 class="tyb-h">HIGH SCORE</h2>' +
    '<p class="tyb-sub" id="tybSub" aria-live="polite">' + tybSubDef(r) + "</p>" +
    '<div class="tyb-list"><div class="tyb-in" id="tybIn">' + rows + "</div></div>" +
    '<div id="tybMe">' + tybMeHtml(r) + "</div>" +
    '<button type="button" class="tyb-pz" onclick="prizeGo(\'type\')" aria-label="1F 타자왕 경품 보기">' + PRIZES.type.list.map(function (p) {
      return '<span class="c"><b>' + p.rk + '</b><img src="' + PRIZE_DIR + p.img + '.webp" alt="" width="104" height="104" loading="lazy" decoding="async" onerror="this.remove()">' + (PRIZE_SAMPLE && p.s !== 0 ? "<i>샘플</i>" : "") + "</span>";
    }).join("") + "</button>" +
    '<p class="tyb-pzn tyb-pzr">' + TYB_PZ_SHORT.map(function (n) { return "<span>" + n + "</span>"; }).join("") + "</p>" +
    (TYB_REST.on && TYB_REST.nm ? '<p class="tyb-pzn">4~10위 · ' + esc(TYB_REST.nm) + "</p>" : "") +
    '<p class="tyb-ft" id="tybFt">' + tybFtHtml(r) + "</p></section>";
}
function tybFtHtml(r) { return "1인 " + ((r && r.tries) || 3) + "회 · 최고 " + (r && r.unit !== "pts" ? "기록" : "점수") + " · 동점은 정확도<br>17:00 마감 · 1~3위 Outro 시상"; }
/* 받은 순위를 판에 · 줄은 data-k(닉네임 + 같은 이름 몇 번째)로 이어 붙여 옮긴다 · 처음 그린 판(TYB.keys 없음)은 표시만 */
function tybApply(r) {
  var host = el("tybIn"); if (!host || !r) return;
  var top = (r.top || []).slice(0, 10), keys = tybKeys(top), prev = TYB.keys, map = {}, rm = rgReduced(), ev = "";
  [].slice.call(host.children).forEach(function (e) { map[e.getAttribute("data-k")] = e; });
  keys.forEach(function (k, i) {
    var x = top[i], e = map[k], was = prev ? prev.indexOf(k) : -1, fresh = !!prev && was < 0 && i < prev.length, up = !!prev && was > i;
    if (e) delete map[k];
    else { e = document.createElement("div"); e.setAttribute("data-k", k); e.className = "tyb-r"; e.style.top = tybTop(10); e.style.opacity = "0"; host.appendChild(e); void e.offsetWidth; }
    var oldV = e._v;
    e.className = tybCls(x, i) + (fresh ? " nw hot" : up && !rm ? " hot" : "");
    e.innerHTML = tybRowInner(r, x, i); e._v = Number(x.score) || 0;
    e.style.top = tybTop(i); e.style.opacity = "1";
    if (fresh || up) setTimeout(function () { e.classList.remove("nw"); e.classList.remove("hot"); }, 6000);
    if (!ev && fresh) ev = "NEW RECORD · " + x.name + " " + (i + 1) + "위";
    else if (!ev && up) ev = "RANK UP · " + x.name + " " + (i + 1) + "위";
    if (!rm && typeof oldV === "number" && oldV !== e._v) tybCount(e.querySelector(".sc"), oldV, e._v, r);
  });
  for (var i = keys.length; i < 10; i++) {
    var k = "_" + i, e = map[k];
    if (e) delete map[k]; else { e = document.createElement("div"); e.setAttribute("data-k", k); host.appendChild(e); }
    e.className = tybCls(null, i); e.innerHTML = tybRowInner(r, null, i); e.style.top = tybTop(i); e.style.opacity = "1";
  }
  Object.keys(map).forEach(function (k) { var e = map[k]; e.style.opacity = "0"; e.style.top = tybTop(10); setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 900); });
  TYB.keys = keys;
  var me = el("tybMe"); if (me) me.innerHTML = tybMeHtml(r);
  var ft = el("tybFt"); if (ft) ft.innerHTML = tybFtHtml(r);
  var sub = el("tybSub"); if (!sub) return;
  if (ev) {
    sub.textContent = ev; sub.className = "tyb-sub nr"; clearTimeout(TYB.subT);
    TYB.subT = setTimeout(function () { var s2 = el("tybSub"); if (s2) { s2.textContent = tybSubDef(S.get("type_rank_site", null)); s2.className = "tyb-sub"; } }, 6000);
  } else if (sub.className === "tyb-sub") sub.textContent = tybSubDef(r);
}
function tybCount(node, a, b, r) {
  if (!node) return;
  var t0 = Date.now(), d = 1200;
  (function step() { var k = Math.min(1, (Date.now() - t0) / d); if (!node.isConnected) return; node.textContent = tybVal(r, a + (b - a) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })();
}
function tybOn() { return App.current === "type_rank"; }   /* v5.29 탭 없음 */
function tybGot(r) { if (tybOn()) tybApply(r); }
function tybStart() {
  if (Date.now() - (TYB.at || 0) > 8000) typeRankPull("site", tybGot);   /* 다른 저장으로 화면이 다시 그려질 때마다 받지 않는다 */
  if (!TYB.iv) TYB.iv = setInterval(function () {
    if (!tybOn()) { clearInterval(TYB.iv); TYB.iv = 0; return; }
    if (!document.hidden) typeRankPull("site", tybGot);
  }, 20000);
}
function gameClear(flagKey) {
  if (!S.get(flagKey, false)) {
    S.set(flagKey, true);
    bePush("game:" + flagKey, "", true);
  }
  /* 260909: 미니게임 별도 칸 폐지 · 04 미니게임으로 통합
     v4.63 (사용자 확정 260929) 판이 끝났다고 04 를 주지 않는다 · 서로 다른 3종목을 한 판씩 끝내야 한다(올림픽 제출 olySubmit → mgStampCheck · 서버 game_submit 이 판정) */
}
/* v4.63 미니게임 스탬프(p4) = 서로 다른 미니게임 3종목 · 종목 = AX 올림픽 다섯 종목(팡 · 점프 · 테트리스 · 기억력 · O/X)
   한 종목 = 기록을 제출한 판(olySubmit · 팡은 완주 · O/X 는 한 줄 이상) · 같은 종목 여러 판 = 1종목 · 라이브 퀴즈 폐기 · 타자(1F)는 종목이 아니다
   서버 계정 = 서버가 game_submit 응답(p4)으로 알려 줄 때만 적립 · 테스트 계정 · 서버 없음 = 이 기기 종목 수로 */
var MG_NEED = 3;
/* v4.83 새 체계 = 팡 · 점프 · 테트리스 세 종목 모두 · 옛 서버(stv 없음)는 옛 규칙(다섯 종목 중 서로 다른 3종목) 그대로 */
function mgDone() { var me = olyMe(), keys = stampV2() ? OLY_MINI_KEYS : olyAllKeys(); return keys.filter(function (k) { return !!me.ev[k]; }).length; }
function mgStampCheck(srv) {
  if (srv) { if (srv.got) awardStamp("p4"); return; }
  if (mgDone() >= MG_NEED) awardStamp("p4");
}
/* v4.83 AX 퀴즈 스탬프(qz) = O/X · 기억력 두 종목 모두 한 판 · 서버 game_submit 응답 qz 로 적립(없으면 이 기기 종목 수) · 옛 서버에는 qz 가 없다 */
var QZ_NEED = 1;   /* v4.92 (261001 저녁 사용자 확정) AX 퀴즈 = O/X 한 판 완주 · 옛 2종(O/X · 기억력) 폐지 */
function qzDone() { var me = olyMe(); return OLY_QUIZ_KEYS.filter(function (k) { return !!me.ev[k]; }).length; }
function qzStampCheck(srv) {
  if (!stampV2()) return;
  if (srv) { if (srv.got) awardStamp("qz"); return; }
  if (qzDone() >= QZ_NEED) awardStamp("qz");
}

/* ════════════════ v4.32 1F 현장 셀프 모드 · 단어 소나기 셀프 아케이드 (260924 사용자 확정) ════════════════
   참가자가 노트북에 와서 스스로 한다 · 스태프는 아침에 관리코드로 이 화면의 「셀프 모드」를 한 번 켠다(관리코드는 이 기기에만 · 화면에 안 보인다 · 끄기도 관리코드).
   v5.12(261003 사용자 결정) 오락실 아케이드로 바꿨다 · 마우스 없이 키보드와 노트북 내장 카메라만으로 돈다.
     로그인 = 참가자 앱의 내 QR 만(사번 입력 백업 없음 · 사용자 결정) · 앱 부품을 그대로 쓴다(qrParseUser 로 모양 · 체크섬 · jsQR 로 읽기) · 서버 type_self_check(qr)가 서명 · 시각 · 명부 · 남은 도전 · 닉네임을 본다.
     → 확인됐어요(PLAYER JOIN) → 게임 닉네임이 있으면 READY(SPACE 시작 · Tab 닉네임 바꾸기 · Esc 취소) · 없으면 닉네임부터(Enter 저장)
     → SPACE = type_self_start(이 순간 1회 · 서버가 센다) · 카운트다운 · 판(보너스 스테이지 · 오른쪽 판 추월 레이스) → type_self_submit(순위 = 사람마다 최고 점수 하나) → 결과.
   점수 = 단어 점수(글자 × 10 × 콤보) + 보너스 스테이지 + 목숨 보너스(엔진 v5.12 절) · 동점은 정확도 → 먼저 기록(서버 typeBest_).
   도전 횟수 = 서버 설정 타자셀프_횟수(기본 3 · 콘솔에서 바꾼다) · 화면은 서버가 준 남은 횟수만 보여 준다(앱이 세지 않는다).
   토너먼트(대전 · admin/typing.html · 콘솔 「타자왕전」 판 · 「타자대전」 시트)와 코드 · 저장 키 · 서버 액션을 나눈다 · 같이 쓰는 것은 판 엔진(assets/rain-engine.js)뿐.
   이 기기 저장 = self_on · self_key(관리코드) · self_tok · self_dev(노트북 이름 · 방법 2 토큰을 묶는다) · site_sound(효과음 · 기본 켬). 스태프 「관리」 = 왼쪽 아래 단추 또는 F2(관리코드).
   v5.61(261004 사용자 결정 · 기획 「디자인 시안/타자왕 부스/무인 진입/기획안.md」) 무인 진입 · 스태프 없이 화면만 보고 시작까지:
     ① 카메라 영상은 평소 한 점도 보이지 않는다(v5.24 그대로) · 폰 QR 의 세 모서리 무늬(파인더)를 찾으면 그 둘레만 잘라 가운데 창에 크게 · 거리 막대(멀어요 · 좋아요 · 가까워요) · 3초 못 읽으면 힌트
     ② 읽기 = 1080p 요청 · 가운데 70% × 80% 원본 해상도에서 파인더 → 그 자리만 한 칸 4.5px 로 늘려 jsQR · 못 찾으면 1.5초마다 가운데를 줄여 한 번(옛 = 전체를 800px 로 줄여 40cm 밖에서 못 읽었다)
     ③ 방법 2 = 노트북 화면 왼쪽 접속 QR(앱 주소 #q=type&lt=일회용 토큰) 을 폰 기본 카메라로 · 로그인하면 이 노트북에 붙는다(서버 type_link_* · 판정은 방법 1 과 같은 typeSelfCheck_)
     ④ 대기 화면 = ▲ 카메라 · 「방법 1 · 앱의 내 QR을 위 카메라에」 · 왼쪽 「방법 2」 · 아래 세 단계 · 15초마다 덮던 TOP 3 없앰 · 봇 데모는 배경으로 약하게
     ⑤ 확인 → 0.8초 → READY(큰 SPACE 키 · 20초 · 마지막 5초 카운트) · 닉네임 45초 · 결과 10초(8초 뒤 다음 사람 QR) · READY · 닉네임에서 10초 넘게 손을 안 대면 다른 사람 QR 로 바뀐다
     ⑥ 서버 응답이 없으면 1.2초 뒤 세 번까지 다시 · 문의처 = 「1층 안내 데스크」 · 도전 시간 밖이면 스캔을 끄고 안내만 · 한/영은 엔진이 로마자를 두벌식으로 바꿔 넣어 안내하지 않는다 */
var TSF = { ph: "attract", msg: "", emp: "", nick: "", info: null, busy: false, ticket: "", res: null, sub: null, send: "", why: "", top: null, topT: 0, resAt: 0, phAt: 0, idle: 0, t: null, raf: 0, unl: false, snd: true, cfg: null, cfgT: 0,
  cam: { stream: null, timer: null, err: "", last: "", lastT: 0, busy: false, cv: null, g: null, res: "" }, race: null, err: null, nm: "", nmBad: false, retry: 0, via: "", closedK: "",
  sc: { on: false, hits: [], last: 0, box: null, tgt: null, rect: null, di: 2, n3: false, since: 0, okAt: 0, lum: 128, tick: 0, cands: 0, ms: 0, msg: "", hint: "", staff: 0 },
  lk: { tok: "", at: 0, busy: false, pollAt: 0, retryAt: 0, fail: 0, url: "" }, dbg: /[?&]tsfdbg=1\b/.test(location.search) };
var TSF_READY_MS = 20000, TSF_NICK_MS = 45000, TSF_RES_MS = 10000, TSF_RES_SCAN_MS = 8000, TSF_SWAP_MS = 10000, TSF_JOIN_S = 0.8, TSF_LINK_ROT = 40000, TSF_LINK_POLL = 1500;
var TSF_DESK = "1층 안내 데스크로 알려 주세요";
var TSF_WHY = { param: "QR을 읽지 못했어요 · 다시 비춰 주세요", unknown: "명부에서 찾을 수 없어요 · " + TSF_DESK, window: "지금은 도전 시간이 아니에요", auth: "관리코드가 바뀌었어요 · " + TSF_DESK, range: "기록이 범위를 넘어 저장하지 않았어요", net: "연결이 불안정해요 · 잠시 뒤 다시 해 주세요",
  locked: "관리 연결이 잠시 막혔어요 · " + TSF_DESK,   /* v4.65 서버 잠금(같은 와이파이에서 코드를 30번 틀림) */
  dup: "다른 노트북에서 도전 중이에요 · 그 판이 끝나면 다시",   /* v5.61 같은 사번이 다른 노트북에서 4분 안에 시작(서버 type_self_start dup) */
  qr: "다시 한 번 비춰 주세요 · 폰 화면을 켜 둔 채로", qrexp: "다시 한 번 비춰 주세요 · 폰 화면을 켜 둔 채로", qrold: "앱에서 다시 로그인해 주세요 · 비밀번호로 로그인한 뒤 내 QR" };   /* v5.12 서버 QR 확인(selfQr_) · v5.61 문구 = 행동 한 줄 */
function tsfTok() { return S.get("self_tok", ""); }   /* v4.65 스태프 토큰(type_self_cfg tok) · 잠금에 막히지 않는다 */
function tsfOn() { return S.get("self_on", false) === true && !!S.get("self_key", ""); }
function tsfKey() { return S.get("self_key", ""); }
/* v5.61 노트북 이름 · 이 기기에서 한 번 만든다(조용한 저장 · 화면을 다시 그리지 않는다) · 방법 2 토큰과 같은 사번 두 노트북 동시 진행(dup)을 가른다 */
function tsfDev() {
  var d = S.get("self_dev", "");
  if (!/^[a-z0-9]{6,16}$/.test(d)) { d = ""; for (var i = 0; i < 10; i++) d += "abcdefghijkmnpqrstuvwxyz23456789".charAt(Math.floor(Math.random() * 32)); S.put("self_dev", d); }
  return d;
}
function tsfLimit() { return (TSF.info && TSF.info.limit) || (TSF.cfg && TSF.cfg.tries) || (TSF.top && TSF.top.tries) || 3; }
function tsfLimitMsg(r) { return "오늘 도전 " + ((r && r.limit) || tsfLimit()) + "회를 모두 쓰셨어요"; }
function typePts(v) { return Number(v || 0).toLocaleString() + "점"; }   /* v5.12 1F 타자왕(site) 기록 = 점수 · 앱(app)은 그대로 typeSec */
function tsfDbg(k, v) {   /* v5.61 시험 훅 · 주소에 ?tsfdbg=1 일 때만 window.__tsf 에 쌓는다(운영 화면에는 영향 없음) */
  if (!TSF.dbg) return;
  var w = window.__tsf || (window.__tsf = { ev: [], st: {} });
  w.ev.push({ t: Math.round(performance.now()), k: k, v: v === undefined ? "" : v }); if (w.ev.length > 3000) w.ev.shift();
}
/* 다음 사람 · 대기 화면으로(순위 · 카메라 · 설정은 그대로) */
function tsfReset() {
  TSF.ph = "attract"; TSF.emp = ""; TSF.nick = ""; TSF.info = null; TSF.busy = false; TSF.ticket = ""; TSF.res = null; TSF.sub = null; TSF.send = ""; TSF.why = ""; TSF.race = null; TSF.err = null; TSF.nm = ""; TSF.nmBad = false; TSF.retry = 0; TSF.via = "";
  TSF.phAt = performance.now(); TSF.idle = Date.now(); TSF.cam.last = ""; TSF.snd = true; tsfDbg("ph", "attract");
  if (App.current === "type_site") { if (document.querySelector(".tsf")) tsfPaint(); else App.render(); tsfRankPull(true); }
}
function tsfPh(p) { TSF.ph = p; TSF.phAt = performance.now(); TSF.idle = Date.now(); tsfDbg("ph", p); tsfPaint(); if (p === "nick") tsfNickFocus(); }
/* 안내 화면 · t1 큰 줄 · t2 작은 줄 · sec 초 뒤 대기(기본 4 · 횟수 소진 6) · TSF_WHY 한 줄(「큰 줄 · 작은 줄」)은 둘로 나눠 쓴다 */
function tsfErr(t1, t2, sec) {
  if (t2 == null && String(t1).indexOf(" · ") > 0) { var i = t1.indexOf(" · "); t2 = t1.slice(i + 3); t1 = t1.slice(0, i); }
  TSF.err = { t1: t1, t2: t2 || "", dur: sec || 4 }; tsfPh("err");
}
function tsfPoke() { TSF.idle = Date.now(); }
/* 가운데 판 폭 · 엔진 3단(rgLayout)과 같은 규칙 · 높이 × 0.8(440~760) · 양옆 판 200 을 먼저 지킨다 */
function tsfBw() {
  var W = window.innerWidth, H = window.innerHeight - 40, bw = Math.max(440, Math.min(760, Math.round(H * 0.8)));
  if (Math.floor((W - 32 - bw - 32) / 2) < 200) bw = Math.max(320, W - 32 - 400 - 32);
  return bw;
}
/* ── 스태프 · 켜기 화면(셀프 모드가 꺼져 있을 때) ── */
function tsfSetupHtml() {
  var on = TSF.snd !== false;
  return '<div class="ax-stack">' +
    '<section class="ax-card ax-stack-tight axs-gap12"><h2 class="ax-section-title">1F 현장 셀프 모드</h2>' +
    '<p class="ax-description">이 노트북을 참가자 전용 화면으로 바꿔요. 참가자가 앱의 내 QR을 노트북 카메라에 비추거나, 화면의 QR을 폰 카메라로 찍고 SPACE로 시작해요.</p>' +
    '<p class="ax-meta">켜면 카메라 권한을 한 번 물어요 · 끄기 = 화면 왼쪽 아래 「관리」 또는 F2 → 관리코드</p>' +
    '<label class="ax-sr-only" for="tsfCode">관리코드</label>' +
    '<input id="tsfCode" class="ax-field" type="password" inputmode="numeric" pattern="[0-9]*" enterkeyhint="go" autocomplete="off" placeholder="관리코드" onkeydown="onEnter(event, tsfEnable)">' +
    '<div class="qseg" role="group" aria-label="효과음"><button type="button" class="' + (on ? "on" : "") + '" onclick="TSF.snd = true; App.render()">효과음 켜기</button>' +
    '<button type="button" class="' + (on ? "" : "on") + '" onclick="TSF.snd = false; App.render()">효과음 끄기</button></div>' +
    '<p class="ax-meta" id="tsfSetMsg">' + esc(TSF.msg) + "</p></section>" +
    '<button type="button" class="ax-button" onclick="tsfEnable()">셀프 모드 켜기</button>' +
    '<button type="button" class="ax-button ax-button-weak" onclick="App.go(\'wall_type\')">1F TV 순위판 열기</button>' +
    (S.get("admin_authed", false) ? '<button type="button" class="ax-button ax-button-weak" onclick="App.go(\'type_award\')">Outro 시상 화면</button>' : "") + "</div>";
}
/* 관리코드를 서버에 물어 맞으면 이 기기에 둔다(화면에는 다시 나오지 않는다) · 효과음 선택은 이 누름 안에서 소리 길을 연다 · 카메라 권한도 이 누름에서 묻는다 */
function tsfEnable() {
  var k = ((el("tsfCode") || {}).value || "").trim(), snd = TSF.snd !== false, m = el("tsfSetMsg");
  var say = function (t) { TSF.msg = t; if (m) m.textContent = t; };
  if (!/^\d{3,12}$/.test(k)) { say("관리코드를 입력해 주세요"); return; }
  if (!BE.on) { say("서버에 연결할 수 없어요"); return; }
  if (snd) sfxUnlock();
  say("확인 중");
  beCall({ action: "type_self_cfg", key: k }, function (r) {
    if (!r || !r.ok) { say(r && r.reason === "auth" ? "관리코드가 맞지 않아요" : r && r.reason === "locked" ? admLockedMsg(r) : "확인하지 못했어요 · 다시 눌러 주세요"); return; }
    TSF.cfg = r; TSF.cfgT = Date.now();
    S.set("site_sound", snd); S.set("self_key", k); S.set("self_tok", r.tok || ""); S.set("self_on", true);
    tsfReset(); App.go("type_site");
  }, function () { say("서버에 연결할 수 없어요"); });
}
/* v5.61 도전 시간 · 횟수를 10분마다 다시 받는다(관리코드 · 응답 tok 은 쓰지 않는다) · 시간 밖이면 스캔 · 접속 QR 을 끄고 안내만 */
function tsfCfgPull() {
  if (!BE.on || Date.now() - TSF.cfgT < 600000) return;
  TSF.cfgT = Date.now();
  beCall({ action: "type_self_cfg", key: tsfKey(), tok: tsfTok() }, function (r) { if (r && r.ok) { TSF.cfg = r; tsfPaint(); } }, function () { TSF.cfgT = Date.now() - 540000; });
}
function tsfKstMin() { var d = new Date(Date.now() + (typeof sesOff === "function" ? sesOff() : 0) + 9 * 3600000); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
/* 시간 밖이면 { next: "HH:MM"(다음 시작 · 없으면 빈 글) · first(오늘 아직 한 번도 안 열렸다) } · 안이거나 모르면 null(서버가 다시 본다) */
function tsfClosed() {
  var c = TSF.cfg; if (!c || !c.winOn || !(c.win || []).length) return null;
  var m = tsfKstMin(), hm = function (s) { var a = String(s).split(":"); return Number(a[0]) * 60 + Number(a[1]); }, next = "", first = true;
  for (var i = 0; i < c.win.length; i++) {
    var w = String(c.win[i]).split("~"); if (w.length < 2) continue;
    var a = hm(w[0]), b = hm(w[1]);
    if (m >= a && m < b) return null;
    if (a > m && (!next || a < hm(next))) next = w[0];
    if (a <= m) first = false;
  }
  return { next: next, first: first };
}
/* ── 스태프 · 끄기 · 효과음(관리코드 · 이 기기에 둔 값과 대조) · v5.61 카메라 해상도 · 찾기 시간 · 방법 2 상태 · 카메라 전체 화면(스태프만 · 20초) ── */
function tsfAdmin() {
  var on = S.get("site_sound", true) === true, C = TSF.cam;
  modalOpen('<div class="ax-stack-tight axs-gap12"><label class="ax-sr-only" for="tsfOffCode">관리코드</label>' +
    '<input id="tsfOffCode" class="ax-field" type="password" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="관리코드" onkeydown="onEnter(event, tsfOffGo)">' +
    '<p class="ax-meta" id="tsfOffMsg">효과음 ' + (on ? "켜짐" : "꺼짐") + " · 카메라 " + (C.stream ? "켜짐 " + esc(C.res) : "꺼짐") + " · 한 번 읽기 " + Math.round(TSF.sc.ms) + "ms · 방법 2 " + (TSF.lk.tok ? "켜짐" : "꺼짐") + "</p>" +
    '<button type="button" class="ax-button" onclick="tsfOffGo()">셀프 모드 끄기</button>' +
    '<button type="button" class="ax-button ax-button-weak" onclick="tsfSndGo()">효과음 ' + (on ? "끄기" : "켜기") + "</button>" +
    '<button type="button" class="ax-button ax-button-weak" onclick="tsfStaffView()">카메라 전체 보기(20초)</button>' +
    '<button type="button" class="ax-button ax-button-weak" onclick="modalClose()">닫기</button></div>', "스태프 전용");
  setTimeout(function () { var n = el("tsfOffCode"); if (n) n.focus(); }, 60);
}
function tsfCodeOk() {
  var v = ((el("tsfOffCode") || {}).value || "").trim();
  if (v && v === tsfKey()) return true;
  var m = el("tsfOffMsg"); if (m) m.textContent = "관리코드가 맞지 않아요";
  return false;
}
function tsfOffGo() {
  if (!tsfCodeOk()) return;
  if (RG.on && RG.mode === "site") rgStop();
  tsfLinkDrop();
  S.set("self_on", false); S.set("self_key", ""); S.set("self_tok", "");
  modalClose(); tsfStop(); tsfReset(); App.go("type_site");
}
function tsfSndGo() {
  if (!tsfCodeOk()) return;
  var on = !(S.get("site_sound", true) === true);
  S.set("site_sound", on);
  if (on) { sfxUnlock(); SFX.site = true; sfx("click"); }
  modalClose();
}
function tsfStaffView() { if (!tsfCodeOk()) return; modalClose(); TSF.sc.staff = performance.now(); tsfScanShow(true); }
/* ── 카메라 · 노트북 내장 카메라를 늘 켜 두고 읽는다 · v5.61 1080p 요청(없으면 카메라가 고른 값) · 초점 · 노출 연속(되는 카메라만) · 영상은 화면에 내지 않는다 ── */
function tsfCamStart() {
  var C = TSF.cam;
  if (C.stream) { tsfCamAttach(); return; }
  if (C.busy) return;
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { C.err = "nocam"; tsfPaint(); return; }
  C.busy = true;
  navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }, audio: false }).then(function (s) {
    C.busy = false;
    if (App.current !== "type_site" || !tsfOn()) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
    C.stream = s; C.err = "";
    s.getVideoTracks().forEach(function (t) {
      t.onended = function () { C.stream = null; C.err = "lost"; tsfPaint(); setTimeout(tsfCamStart, 3000); };
      try { var st = t.getSettings ? t.getSettings() : {}; C.res = (st.width || "?") + "×" + (st.height || "?"); } catch (e) {}
      try {
        var cp = t.getCapabilities ? t.getCapabilities() : {}, adv = {};
        if (cp.focusMode && cp.focusMode.indexOf("continuous") >= 0) adv.focusMode = "continuous";
        if (cp.exposureMode && cp.exposureMode.indexOf("continuous") >= 0) adv.exposureMode = "continuous";
        if (Object.keys(adv).length) t.applyConstraints({ advanced: [adv] }).catch(function () {});
      } catch (e) {}
    });
    tsfDbg("cam", C.res);
    tsfCamAttach(); tsfPaint();
  }, function (e) {
    C.busy = false; C.err = e && e.name === "NotAllowedError" ? "deny" : "nocam"; tsfPaint();
    setTimeout(function () { if (App.current === "type_site" && tsfOn() && !TSF.cam.stream) tsfCamStart(); }, 5000);
  });
}
function tsfCamAttach() {
  var v = el("tsfVid"), C = TSF.cam;
  if (v && C.stream && v.srcObject !== C.stream) { v.srcObject = C.stream; var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); }
  if (C.stream && !C.timer) C.timer = setInterval(tsfScanTick, 150);
}
function tsfCamStop() {
  var C = TSF.cam;
  if (C.timer) { clearInterval(C.timer); C.timer = null; }
  if (C.stream) { try { C.stream.getTracks().forEach(function (t) { t.onended = null; t.stop(); }); } catch (e) {} C.stream = null; }
  tsfScanShow(false);
}
/* TSF_DETECT_BEGIN · v5.61 폰 QR 찾기 · 순수 함수(앱 · 검사 · 벤치가 같은 글자를 쓴다) */
function tsfGray(d, w, h) {
  var n = w * h, g = new Uint8Array(n);
  for (var i = 0, j = 0; i < n; i++, j += 4) g[i] = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
  return g;
}
/* 칸(B px)마다 문턱 = 둘레 3 × 3 칸 평균 · 밝기 차가 작은 둘레(24 미만)는 어두운 점이 없는 것으로(-1) */
function tsfThr(g, w, h, B) {
  var bw = Math.ceil(w / B), bh = Math.ceil(h / B), nb = bw * bh, sum = new Float64Array(nb), cnt = new Uint32Array(nb), mn = new Uint8Array(nb), mx = new Uint8Array(nb), T = new Int16Array(nb), bx, by, x, y;
  mn.fill(255);
  for (y = 0; y < h; y++) {
    var row = y * w, rb = ((y / B) | 0) * bw;
    for (bx = 0; bx < bw; bx++) {
      var k = rb + bx, x0 = bx * B, x1 = Math.min(w, x0 + B), s = 0, lo = mn[k], hi = mx[k];
      for (x = x0; x < x1; x++) { var v = g[row + x]; s += v; if (v < lo) lo = v; if (v > hi) hi = v; }
      sum[k] += s; cnt[k] += x1 - x0; mn[k] = lo; mx[k] = hi;
    }
  }
  for (by = 0; by < bh; by++) for (bx = 0; bx < bw; bx++) {
    var s2 = 0, c2 = 0, lo2 = 255, hi2 = 0;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var yy = by + dy, xx = bx + dx; if (yy < 0 || yy >= bh || xx < 0 || xx >= bw) continue;
      var kk = yy * bw + xx; s2 += sum[kk]; c2 += cnt[kk]; if (mn[kk] < lo2) lo2 = mn[kk]; if (mx[kk] > hi2) hi2 = mx[kk];
    }
    T[by * bw + bx] = hi2 - lo2 < 24 ? -1 : Math.round(Math.min(s2 / c2, (lo2 + hi2) / 2 + 12));
  }
  return { T: T, bw: bw, B: B };
}
/* 검정:흰:검정:흰:검정 = 1:1:3:1:1 (ZXing 과 같은 허용 폭 · 한 칸 = 합 / 7 · 1칸 ± 칸/2 · 가운데 3칸 ± 3칸/2) */
function tsfRatio(c) {
  var t = c[0] + c[1] + c[2] + c[3] + c[4]; if (t < 9) return 0;
  var m = t / 7, v = m / 2;
  return Math.abs(m - c[0]) < v && Math.abs(m - c[1]) < v && Math.abs(3 * m - c[2]) < 3 * v && Math.abs(m - c[3]) < v && Math.abs(m - c[4]) < v ? t : 0;
}
/* 한 줄(가로 · 세로 · 대각) 가운데에서 바깥으로 다섯 덩어리를 센다 · dk(i) = i 번째 점이 어두운가 · 덩어리가 max 를 넘으면 실패 */
function tsfCross(dk, n0, len, max) {
  var c = [0, 0, 0, 0, 0], i = n0;
  if (!dk(i)) return null;
  while (i >= 0 && dk(i)) { c[2]++; i--; } if (i < 0) return null;
  while (i >= 0 && !dk(i) && c[1] <= max) { c[1]++; i--; } if (i < 0 || c[1] > max) return null;
  while (i >= 0 && dk(i) && c[0] <= max) { c[0]++; i--; } if (c[0] > max) return null;
  i = n0 + 1;
  while (i < len && dk(i)) { c[2]++; i++; } if (i >= len) return null;
  while (i < len && !dk(i) && c[3] < max) { c[3]++; i++; } if (i >= len || c[3] >= max) return null;
  while (i < len && dk(i) && c[4] < max) { c[4]++; i++; } if (c[4] >= max) return null;
  return tsfRatio(c) ? { c: c, end: i } : null;
}
/* 파인더 무늬 후보 · [{ x, y, m(한 칸 px), n(겹친 줄 수) }] · step = 몇 줄마다 볼지 */
function tsfFinders(g, w, h, step) {
  var th = tsfThr(g, w, h, 16), T = th.T, bw = th.bw, B = th.B, out = [];
  var dkAt = function (x, y) { var t = T[((y / B) | 0) * bw + ((x / B) | 0)]; return t >= 0 && g[y * w + x] < t; };
  for (var y = 0; y < h; y += step) {
    var c = [0, 0, 0, 0, 0], s = 0, rb = ((y / B) | 0) * bw, row = y * w;
    for (var x = 0; x < w; x++) {
      var t = T[rb + ((x / B) | 0)], d = t >= 0 && g[row + x] < t;
      if (d) { if (s & 1) s++; c[s]++; continue; }
      if (s & 1) { c[s]++; continue; }
      if (s === 0 && c[0] === 0) continue;
      if (s === 4) {
        var tot = tsfRatio(c);
        if (tot) {
          var cx = Math.round(x - c[4] - c[3] - c[2] / 2), yy = y, xx = cx;
          var v = tsfCross(function (i) { return dkAt(xx, i); }, yy, h, c[2]);
          if (v) {
            var vt = v.c[0] + v.c[1] + v.c[2] + v.c[3] + v.c[4];
            if (5 * Math.abs(vt - tot) < 2 * tot) {
              var cy = Math.round(v.end - v.c[4] - v.c[3] - v.c[2] / 2);
              var dg = tsfCross(function (i) { var px = cx - cy + i; return px >= 0 && px < w && dkAt(px, i); }, cy, h, c[2] * 2);
              if (dg) tsfAdd(out, cx, cy, (tot + vt) / 14);
            }
          }
        }
        c[0] = c[2]; c[1] = c[3]; c[2] = c[4]; c[3] = 1; c[4] = 0; s = 3;
      } else { s++; c[s] = 1; }
    }
  }
  return out;
}
function tsfAdd(out, x, y, m) {
  for (var i = 0; i < out.length; i++) {
    var o = out[i];
    if (Math.abs(o.x - x) <= o.m * 2.5 && Math.abs(o.y - y) <= o.m * 2.5 && m < o.m * 1.6 && o.m < m * 1.6) {
      var k = o.n; o.x = (o.x * k + x) / (k + 1); o.y = (o.y * k + y) / (k + 1); o.m = (o.m * k + m) / (k + 1); o.n = k + 1; return;
    }
  }
  out.push({ x: x, y: y, m: m, n: 1 });
}
/* 후보 → QR 한 장 · 세 모서리(직각삼각형)면 n 3 · 둘이면 n 2 · { x, y(가운데) · q(QR 한 변 px 추정) · m · n · s(자를 정사각 한 변) } · 없으면 null */
function tsfQrBox(cs) {
  var a = cs.filter(function (c) { return c.n >= 2; }).sort(function (p, q) { return q.n - p.n; }).slice(0, 8), best = null, i, j, k;
  var dist = function (p, q) { return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)); };
  var mok = function (p, q) { return p.m < q.m * 1.5 && q.m < p.m * 1.5; };
  for (i = 0; i < a.length; i++) for (j = i + 1; j < a.length; j++) for (k = j + 1; k < a.length; k++) {
    var P = [a[i], a[j], a[k]]; if (!mok(P[0], P[1]) || !mok(P[0], P[2]) || !mok(P[1], P[2])) continue;
    var ds = [[dist(P[1], P[2]), 0], [dist(P[0], P[2]), 1], [dist(P[0], P[1]), 2]].sort(function (p, q) { return q[0] - p[0]; });
    var hyp = ds[0][0], l1 = ds[1][0], l2 = ds[2][0], m = (P[0].m + P[1].m + P[2].m) / 3, leg = (l1 + l2) / 2;
    if (l2 < l1 * 0.7 || Math.abs(hyp / leg - 1.414) > 0.25 || leg / m < 10 || leg / m > 56) continue;
    var sc = Math.abs(l1 - l2) / leg + Math.abs(hyp / leg - 1.414);
    if (!best || best.n < 3 || sc < best.sc) {
      var o = P[ds[0][1]], e1 = P[(ds[0][1] + 1) % 3], e2 = P[(ds[0][1] + 2) % 3];
      best = { n: 3, sc: sc, x: (e1.x + e2.x) / 2, y: (e1.y + e2.y) / 2, m: m, q: leg + 7 * m, o: o };
    }
  }
  if (best) { best.s = best.q * 1.5; return best; }
  for (i = 0; i < a.length; i++) for (j = i + 1; j < a.length; j++) {
    if (!mok(a[i], a[j])) continue;
    var d = dist(a[i], a[j]), mm = (a[i].m + a[j].m) / 2, r = d / mm;
    if (r < 10 || r > 78) continue;
    var cand = { n: 2, x: (a[i].x + a[j].x) / 2, y: (a[i].y + a[j].y) / 2, m: mm, q: (r > 56 ? d / 1.414 : d) + 7 * mm, sc: a[i].n + a[j].n };
    if (!best || cand.sc > best.sc) best = cand;
  }
  if (best) best.s = best.q * 2.2;
  return best;
}
/* 정사각 한 칸(sx, sy, S) 을 k 배로 늘려(쌍선형) 새 RGBA · 밖은 흰색 */
function tsfUp(d, w, h, sx, sy, S, k) {
  var o = Math.round(S * k), out = new Uint8ClampedArray(o * o * 4), inv = 1 / k;
  for (var y = 0; y < o; y++) {
    var fy = sy + (y + 0.5) * inv - 0.5, y0 = Math.floor(fy), ty = fy - y0;
    for (var x = 0; x < o; x++) {
      var fx = sx + (x + 0.5) * inv - 0.5, x0 = Math.floor(fx), tx = fx - x0, p = (y * o + x) * 4;
      if (x0 < 0 || y0 < 0 || x0 + 1 >= w || y0 + 1 >= h) { out[p] = out[p + 1] = out[p + 2] = 255; out[p + 3] = 255; continue; }
      var a = (y0 * w + x0) * 4, b = a + 4, c2 = a + w * 4, e = c2 + 4;
      for (var ch = 0; ch < 3; ch++) out[p + ch] = (d[a + ch] * (1 - tx) + d[b + ch] * tx) * (1 - ty) + (d[c2 + ch] * (1 - tx) + d[e + ch] * tx) * ty;
      out[p + 3] = 255;
    }
  }
  return { d: out, w: o, h: o };
}
/* 거리 다섯 칸(0 멀어요 ~ 4 가까워요) · 한 칸 px(m) · 화면 폭에서 QR 이 차지하는 몫(f) */
function tsfDist(m, f) { return m < 2.2 ? 0 : m < 2.9 ? 1 : f <= 0.24 ? 2 : f <= 0.36 ? 3 : 4; }
/* 읽을 칸 · 상자(가운데 크롭 좌표 + 크롭 시작 ox · oy) → 원본 프레임의 정사각(sx · sy · S) · 늘릴 배수 k(한 칸 약 4.5px 이 되게 · 0.6~3) */
function tsfPlan(b, W, H, ox, oy) {
  var S = Math.max(24, Math.min(Math.round(b.s), W, H)), sx = Math.max(0, Math.min(W - S, Math.round(ox + b.x - S / 2))), sy = Math.max(0, Math.min(H - S, Math.round(oy + b.y - S / 2)));
  return { sx: sx, sy: sy, S: S, k: Math.max(0.6, Math.min(3, 4.5 / b.m)) };
}
/* TSF_DETECT_END */
function tsfJs(d, w, h) { var r = jsQR(d, w, h, { inversionAttempts: "dontInvert" }); return r && r.data ? r.data : null; }
/* 읽기가 열린 단계 · 대기 · 안내 · 결과(8초 뒤 · 저장 끝난 뒤) · READY · 닉네임(10초 넘게 손을 안 댔을 때만 · 다른 사람 QR 로 바꾼다) · 판 도중 · 확인 중 · 시간 밖에는 읽지 않는다 */
function tsfScanOpen() {
  if (RG.on || TSF.busy || el("modal") || tsfClosed()) return false;
  var ph = TSF.ph;
  return ph === "attract" || ph === "err" || (ph === "result" && TSF.send !== "sending" && performance.now() - TSF.resAt > TSF_RES_SCAN_MS) || ((ph === "ready" || ph === "nick") && Date.now() - TSF.idle > TSF_SWAP_MS);
}
/* 0.15초마다 · 프레임 한 장 · 가운데 크롭 원본 → 파인더 → 그 자리만 늘려 jsQR · 못 찾으면 10번에 한 번 가운데를 800px 로 줄여 jsQR(먼 · 흐린 QR 구제) */
function tsfScanTick() {
  if (App.current !== "type_site" || !tsfOn()) { tsfCamStop(); return; }
  var C = TSF.cam, sc = TSF.sc, v = el("tsfVid"), now = performance.now();
  if (sc.staff && now - sc.staff > 20000) { sc.staff = 0; tsfScanShow(false); }
  if (!tsfScanOpen() || !v || v.readyState < 2 || !v.videoWidth || typeof jsQR !== "function") { sc.hits = []; if (sc.on && !sc.staff && !(sc.okAt && now - sc.okAt < 800)) tsfScanShow(false); return; }
  var W = v.videoWidth, H = v.videoHeight, raw = null;
  if (!C.cv) { C.cv = document.createElement("canvas"); C.g = C.cv.getContext("2d", { willReadFrequently: true }); }
  if (C.cv.width !== W || C.cv.height !== H) { C.cv.width = W; C.cv.height = H; }
  C.g.drawImage(v, 0, 0, W, H);
  var ox = Math.round(W * 0.15), oy = Math.round(H * 0.1), cw = Math.round(W * 0.7), ch = Math.round(H * 0.8);
  var fs = tsfFinders(tsfGray(C.g.getImageData(ox, oy, cw, ch).data, cw, ch), cw, ch, 2), b = tsfQrBox(fs);
  if (b && b.q / W < 0.035) b = null;   /* 뒤에 선 사람 폰(약 1m 밖) · 옆 노트북은 가운데 70% 밖이라 처음부터 보지 않는다 */
  sc.cands = fs.length; sc.hits.push(!!b); if (sc.hits.length > 3) sc.hits.shift();
  if (b) {
    var side = Math.min(W * 0.45, b.q * (b.n === 3 ? 1.35 : 1.7));   /* 폰 둘레만 · 얼굴 · 배경은 잘린다(세 모서리 = 1.35배 · 두 모서리 = 가운데가 덜 확실해 1.7배) */
    sc.box = b; sc.last = now; sc.di = tsfDist(b.m, b.q / W); sc.n3 = b.n === 3;
    sc.tgt = { x: ox + b.x - side / 2, y: oy + b.y - side / 2, s: side };
    var P = tsfPlan(b, W, H, ox, oy), id = C.g.getImageData(P.sx, P.sy, P.S, P.S), lum = 0, k;
    for (k = 0; k < id.data.length; k += 64) lum += id.data[k] * 0.3 + id.data[k + 1] * 0.59 + id.data[k + 2] * 0.11;
    sc.lum = lum / Math.max(1, id.data.length / 64);
    var u = Math.abs(P.k - 1) < 0.05 ? { d: id.data, w: P.S, h: P.S } : tsfUp(id.data, P.S, P.S, 0, 0, P.S, P.k);
    raw = tsfJs(u.d, u.w, u.h);
  } else if (++sc.tick % 10 === 0) {
    var dw = Math.min(800, cw), dh = Math.round(ch * dw / cw);
    if (!C.cv2) { C.cv2 = document.createElement("canvas"); C.g2 = C.cv2.getContext("2d", { willReadFrequently: true }); }
    if (C.cv2.width !== dw || C.cv2.height !== dh) { C.cv2.width = dw; C.cv2.height = dh; }
    C.g2.drawImage(C.cv, ox, oy, cw, ch, 0, 0, dw, dh);
    raw = tsfJs(C.g2.getImageData(0, 0, dw, dh).data, dw, dh);
  }
  sc.ms = performance.now() - now;
  var show = TSF.ph === "attract" || TSF.ph === "err" || TSF.ph === "result";   /* READY · 닉네임 화면은 덮지 않는다(바꾸기는 다른 사람 QR 을 읽었을 때만) */
  if (show && !sc.on && sc.hits.filter(Boolean).length >= 2) tsfScanShow(true);
  if (sc.on && !sc.staff && now - sc.last > 1000 && !(sc.okAt && now - sc.okAt < 800)) tsfScanShow(false);
  if (TSF.dbg) { var w2 = window.__tsf || (window.__tsf = { ev: [], st: {} }); w2.st = { ms: Math.round(sc.ms), cands: sc.cands, n: b ? b.n : 0, di: b ? sc.di : -1, m: b ? +b.m.toFixed(2) : 0, f: b ? +(b.q / W).toFixed(3) : 0, res: W + "x" + H, on: sc.on }; }
  if (!raw) return;
  raw = String(raw).trim();
  if (raw === C.last && Date.now() - C.lastT < 4000) return;   /* 같은 QR 을 들고 있으면 4초에 한 번만 */
  var emp = qrParseUser(raw);
  if ((TSF.ph === "ready" || TSF.ph === "nick") && (!emp || emp === TSF.emp)) return;   /* 바꾸기는 다른 사람의 내 QR 만 · 같은 사람 QR 은 그대로 */
  C.last = raw; C.lastT = Date.now(); sc.okAt = now; tsfDbg("dec", raw.slice(0, 12));
  tsfQr(raw);
}
/* 가운데 창 열기 · 닫기 · 영상은 이 창(폰 둘레만) 말고는 어디에도 그리지 않는다 */
function tsfScanShow(on) {
  var sc = TSF.sc, root = document.querySelector(".tsf");
  if (sc.on === !!on) return;
  sc.on = !!on;
  if (on) { sc.since = performance.now(); sc.rect = sc.staff ? null : sc.tgt ? { x: sc.tgt.x, y: sc.tgt.y, s: sc.tgt.s } : null; sc.msg = sc.hint = ""; }
  else { sc.okAt = 0; var cv = el("tsfScanCv"); if (cv) { var g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height); } }
  if (root) root.classList.toggle("scan-on", sc.on);
  tsfDbg("scan", sc.on ? 1 : 0);
}
/* 창 그림 · 매 프레임(rAF) · 폰 둘레(1.35배 · 화면 폭 45% 이하)를 부드럽게 따라간다 · 읽은 직후 0.8초는 멈춘 그림 + 「확인됐어요」 · 거리 다섯 칸 · 3초 못 읽으면 힌트 */
function tsfScanDraw() {
  var sc = TSF.sc, v = el("tsfVid"), cv = el("tsfScanCv"); if (!sc.on || !v || !cv || !v.videoWidth) return;
  var now = performance.now(), W = v.videoWidth, H = v.videoHeight, frz = sc.okAt && now - sc.okAt < 800;
  var px = Math.round(Math.min(560, cv.clientWidth || 360) * Math.min(2, window.devicePixelRatio || 1));
  if (cv.width !== px || cv.height !== px) { cv.width = cv.height = px; }
  var g = cv.getContext("2d");
  if (!frz) {
    if (sc.staff) { g.fillStyle = "#1B1712"; g.fillRect(0, 0, px, px); var hh = px * H / W; g.drawImage(v, 0, (px - hh) / 2, px, hh); }
    else if (sc.tgt) {
      var r = sc.rect || (sc.rect = { x: sc.tgt.x, y: sc.tgt.y, s: sc.tgt.s }), a = rgReduced() ? 1 : 0.35;
      r.x += (sc.tgt.x - r.x) * a; r.y += (sc.tgt.y - r.y) * a; r.s += (sc.tgt.s - r.s) * a;
      g.imageSmoothingEnabled = true; g.fillStyle = "#1B1712"; g.fillRect(0, 0, px, px);
      try { g.drawImage(v, r.x, r.y, r.s, r.s, 0, 0, px, px); } catch (e) {}
    }
  }
  var msg = sc.staff ? "스태프 확인 화면" : frz || TSF.ph === "check" ? "확인됐어요" : sc.di <= 1 ? "조금 더 가까이" : sc.di === 4 ? "조금 멀리" : sc.n3 ? "그대로 잠깐만요" : "폰을 카메라 쪽으로";
  var t = now - sc.since, hint = sc.staff || frz ? "" : t > 3000 && sc.lum < 95 ? "폰 화면 밝기를 올려 주세요" : t > 6000 ? "폰을 똑바로 세워 주세요" : "";
  if (msg !== sc.msg) { sc.msg = msg; var m = el("tsfScanMsg"); if (m) { m.textContent = msg; m.className = "tsf-sm" + (msg === "그대로 잠깐만요" || msg === "확인됐어요" ? " o" : ""); } }
  if (hint !== sc.hint) { sc.hint = hint; var hn = el("tsfScanHint"); if (hn) hn.textContent = hint; }
  var bar = el("tsfBar"), di = sc.staff ? -1 : sc.di;
  if (bar && bar._di !== di) { bar._di = di; [].forEach.call(bar.children, function (c, i) { c.className = i === di ? "on" : ""; }); bar.className = "tsf-bar d" + di; }
}
/* QR 한 장 · 모양 · 체크섬은 앱 qrParseUser 로 먼저 · 서명 · 시각 · 명부 · 남은 도전은 서버(type_self_check qr) · 응답이 없으면 1.2초 뒤 세 번까지 다시 */
function tsfQr(raw) {
  if (!qrParseUser(raw)) { tsfErr("내 QR이 아니에요", "앱 가운데 QR 버튼 → 내 QR"); sfx("rgmiss"); return; }
  if (!BE.on) { tsfErr("연결이 불안정해요", TSF_DESK); return; }
  if (!TSF.unl && S.get("site_sound", true) === true) { TSF.unl = true; sfxUnlock(); }
  TSF.busy = true; TSF.retry = 0; tsfPh("check"); sfx("scan");
  tsfCheckQr(raw);
}
function tsfCheckQr(raw) {
  beCall({ action: "type_self_check", key: tsfKey(), tok: tsfTok(), qr: raw }, function (r) {
    if (TSF.ph !== "check") { TSF.busy = false; return; }
    if (r && r.reason === "busy" && TSF.retry < 3) { TSF.retry++; setTimeout(function () { if (TSF.ph === "check") tsfCheckQr(raw); }, 1200); return; }
    tsfCheckRes(r, "cam");
  }, function () {
    if (TSF.ph !== "check") { TSF.busy = false; return; }
    if (TSF.retry < 3) { TSF.retry++; setTimeout(function () { if (TSF.ph === "check") tsfCheckQr(raw); }, 1200); return; }
    TSF.busy = false; tsfErr("연결이 불안정해요", "계속되면 " + TSF_DESK);
  });
}
/* 확인 결과 한 곳 · 방법 1(카메라 · type_self_check) · 방법 2(폰 접속 · type_link_poll got) 가 같은 판정을 같은 화면으로 */
function tsfCheckRes(r, via) {
  TSF.busy = false; TSF.retry = 0;
  if (!r || !r.ok) { tsfErr(TSF_WHY[r && r.reason] || "확인하지 못했어요 · 다시 비춰 주세요"); sfx("rgmiss"); return; }
  if (!r.inWin) { tsfErr(TSF_WHY.window, (r.win || []).join(" · ")); sfx("rgmiss"); return; }
  if (r.left <= 0) { tsfErr(tsfLimitMsg(r), "순위는 오른쪽 화면에서", 6); sfx("rgmiss"); return; }
  TSF.emp = r.emp; TSF.info = r; TSF.nick = r.nick || ""; TSF.via = via || "";
  tsfRacePull();
  tsfPh("join"); sfx("rgjoin");
}
/* ── v5.61 방법 2 · 노트북 화면 접속 QR(앱 주소#q=type&lt=토큰) · 대기 · 안내 · 결과(8초 뒤)에서만 띄운다 · 40초마다 새 토큰 · 1.5초마다 서버에 묻는다 ──
   서버가 폰의 접속을 받으면(type_link_join) 다음 물음(type_link_poll)에 그 사람의 확인 결과(got)가 온다 → tsfCheckRes(방법 1 과 같은 화면)
   QR 을 내릴 때(READY · 판 · 닉네임 · 시간 밖)는 토큰을 버린다(off) · 서버가 없거나 옛 서버면 칸에 「잠시만요」만(방법 1 은 그대로) */
function tsfLinkWant() {
  if (!BE.on || RG.on || TSF.busy || tsfClosed()) return false;
  var ph = TSF.ph;
  return ph === "attract" || ph === "err" || (ph === "result" && TSF.send !== "sending" && performance.now() - TSF.resAt > TSF_RES_SCAN_MS);
}
function tsfLinkUrl(tok) { return location.origin + location.pathname + "#q=type&lt=" + tok; }
function tsfLinkTick() {
  var L = TSF.lk, now = Date.now();
  if (!tsfLinkWant()) { if (L.tok) tsfLinkDrop(); return; }
  if (L.busy || document.hidden) return;
  if (!L.tok || now - L.at > TSF_LINK_ROT) { if (now >= L.retryAt) tsfLinkNew(); return; }
  if (now - L.pollAt >= TSF_LINK_POLL) tsfLinkPoll();
}
function tsfLinkNew() {
  var L = TSF.lk; L.busy = true;
  beCall({ action: "type_link_new", key: tsfKey(), tok: tsfTok(), dev: tsfDev() }, function (r) {
    L.busy = false;
    if (!r || !r.ok || !r.tok) { L.fail++; L.retryAt = Date.now() + 15000; if (!L.tok) tsfLinkPaint(); return; }
    L.tok = r.tok; L.at = L.pollAt = Date.now(); L.fail = 0; L.url = tsfLinkUrl(r.tok); tsfDbg("link", r.tok);
    tsfLinkPaint();
  }, function () { L.busy = false; L.fail++; L.retryAt = Date.now() + 8000; });
}
function tsfLinkPoll() {
  var L = TSF.lk, tk = L.tok; L.busy = true; L.pollAt = Date.now();
  beCall({ action: "type_link_poll", key: tsfKey(), tok: tsfTok(), dev: tsfDev() }, function (r) {
    L.busy = false;
    if (!r || !r.ok) return;
    if (r.got) { L.tok = L.url = ""; tsfDbg("got", r.got.ok ? 1 : 0); if (tsfLinkWant()) { if (!TSF.unl && S.get("site_sound", true) === true) { TSF.unl = true; sfxUnlock(); } sfx("scan"); tsfCheckRes(r.got, "link"); } return; }
    if (r.none && L.tok === tk) { L.tok = L.url = ""; }   /* 서버가 토큰을 잊었다(다시 띄움 · 만료) · 다음 시계에 새로 받는다 */
  }, function () { L.busy = false; });
}
function tsfLinkDrop() {
  var L = TSF.lk; if (!L.tok) return;
  L.tok = ""; L.url = ""; tsfDbg("link", "");
  if (BE.on) beCall({ action: "type_link_new", key: tsfKey(), tok: tsfTok(), dev: tsfDev(), off: 1 }, function () {}, function () {});
}
/* 접속 QR 칸만 다시 그린다 · 일반 QR(검정 정사각 · 흰 바탕 · ECC Q · 장식 없음 · 261001 규칙) · 폭은 왼쪽 판에 맞춘다 */
function tsfLinkPaint() {
  var box = el("tsfLqr"); if (!box) return;
  var L = TSF.lk, px = Math.max(160, Math.min(300, (box.clientWidth || 300)));
  if (L.tok && L.url) box.innerHTML = qrTextSvg(L.url, px, 4, "Q").replace("border-radius:8px", "border-radius:0");
  else box.innerHTML = '<p class="tsf-lw">' + (L.fail >= 2 ? "잠시 뒤에 나와요" : "QR을 준비하는 중") + "</p>";
}
/* 추월 레이스 · 현장 순위 100명(도전자 본인 줄 뺌 · 점수 내림차순) · 판이 이미 시작했으면 바로 넣는다 */
function tsfRacePull() {
  var emp = TSF.emp; TSF.race = null;
  if (!BE.on || !emp) return;
  beCall({ action: "type_rank", mode: "site", emp: emp, n: 100 }, function (r) {
    if (!r || !r.ok || TSF.emp !== emp) return;
    var list = (r.top || []).filter(function (x) { return !x.me; }).map(function (x) { return { name: x.name, score: Number(x.score) || 0 }; });
    TSF.race = { list: list, extra: Math.max(0, (Number(r.total) || 0) - (r.me ? 1 : 0) - list.length) };
    if (RG.on && RG.mode === "site") RG.race = TSF.race;
  }, function () {});
}
/* ── 참가자 화면 · 처음 한 번 그리고 그 뒤는 칸만 고친다(카메라 · 닉네임 칸이 끊기지 않게) ──
   v5.61 3단 = 왼쪽(방법 2 접속 QR · 도전자 · 다음 도전자) / 가운데 판(▲ 카메라 · 방법 1 안내 · 폰 창) / 오른쪽 HIGH SCORE · 영상(tsfVid)은 보이지 않는 원본(읽기 전용) */
function tsfHtml() {
  return '<div class="tsf ph-' + TSF.ph + '"><video id="tsfVid" class="tsf-vsrc" muted playsinline autoplay aria-hidden="true"></video><div class="tsf-grid" style="--tsf-bw:' + tsfBw() + 'px">' +
    '<div class="tsf-l" id="tsfLx">' + tsfLeftHtml() + "</div>" +
    '<section class="tsf-c"><canvas id="tsfCv" aria-hidden="true"></canvas><div class="tsf-ov" id="tsfOv">' + tsfOvHtml() + "</div>" +
    '<div class="tsf-camtag" aria-hidden="true"><i></i><b>카메라</b></div>' +
    '<div class="tsf-scan" id="tsfScan" aria-live="polite"><div class="tsf-sw"><canvas id="tsfScanCv" aria-hidden="true"></canvas><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i></div>' +
    '<p class="tsf-sm" id="tsfScanMsg"></p><p class="tsf-sh" id="tsfScanHint"></p><div class="tsf-bar" id="tsfBar"><i></i><i></i><i></i><i></i><i></i></div><p class="tsf-bl"><span>멀어요</span><span>좋아요</span><span>가까워요</span></p></div></section>' +
    '<section class="tsf-r" id="tsfR">' + tsfRightHtml() + "</section>" +
    '</div><button type="button" class="tsf-adm" tabindex="-1" onclick="tsfAdmin()">관리</button></div>';
}
/* 왼쪽 · 대기 · 안내 · 결과(접속 QR 이 떠 있을 때) = 방법 2 · 도전자 = 닉네임 · 남은 도전 · 내 최고 · 키 · 결과 = 다음 도전자 · 시간 밖 = 규칙 */
function tsfLeftHtml() {
  var ph = TSF.ph, i = TSF.info;
  if ((ph === "join" || ph === "ready" || ph === "nick") && i) {
    return '<section class="tsf-p tsf-who"><p class="tsf-k">PLAYER</p><p class="tsf-big o">' + esc(TSF.nick || "닉네임 정하는 중") + "</p>" +
      "<p>남은 도전 " + i.left + "회 / " + i.limit + "회</p>" + (i.best ? "<p>내 최고 " + typePts(i.best) + "</p>" : "<p>첫 도전</p>") + "</section>" +
      '<section class="tsf-p tsf-rule">' + (ph === "nick" ? "<p>Enter 저장</p><p>Esc 처음으로</p>" : '<p class="tsf-hint go">SPACE 시작</p><p>Tab 닉네임 바꾸기</p><p>Esc 처음으로</p>') + "</section>";
  }
  var rule = '<section class="tsf-p tsf-rule"><p>1인 ' + tsfLimit() + "회 · 최고 점수로 순위</p><p>목숨 " + RAIN_LIVES + "개를 다 잃으면 끝</p><p>17:00 마감 · 1~3위 Outro 시상</p></section>";
  if (tsfClosed()) return rule;
  if (ph === "result" && !tsfLinkWant()) return '<section class="tsf-p"><p class="tsf-k">다음 도전자</p><p class="tsf-go">앱의 내 QR을 비추세요</p><p class="tsf-hint" id="tsfCount">' + Math.round(TSF_RES_MS / 1000) + "초 뒤 처음 화면 · SPACE 바로</p></section>";
  return '<section class="tsf-p tsf-m2"><p class="tsf-chip">방법 2</p><p class="tsf-m2t">폰 카메라로<br>이 QR 찍기</p>' +
    '<div class="tsf-lqr" id="tsfLqr"></div><p class="tsf-m2s">앱이 없어도 돼요</p><p class="tsf-m2s s">로그인하면 이 노트북에 연결돼요</p></section>';
}
/* 오른쪽 · HIGH SCORE TOP 5(결과 화면에서만 방금 도전한 사람 줄 · 다음 사람에게 남의 줄을 짚어 보이지 않게) + 점수 규칙 */
function tsfRightHtml() {
  var r = TSF.top, top = (r && r.top) || [], hl = TSF.ph === "result", h = '<p class="tsf-band">HIGH SCORE</p><div id="tsfRank">';
  if (!r) h += '<p class="tsf-hint">불러오는 중</p>';
  else for (var i = 0; i < 5; i++) {
    var x = top[i];
    h += '<div class="tsf-row' + (i < 3 && x ? " top" : "") + (hl && x && x.me ? " me" : "") + '"><span class="no">' + (i + 1) + '</span><span class="nm">' + (x ? esc(x.name) : "<i>도전을 기다려요</i>") + '</span><span class="sc">' + (x ? typePts(x.score) : "") + "</span></div>";
  }
  if (r && hl && r.me && r.me.rank > 5) h += '<p class="tsf-hint">내 순위 ' + r.me.rank + "위 · " + typePts(r.me.score) + "</p>";
  return h + '</div><div class="tsf-pts"><p class="tsf-k">점수</p><p>단어 = 글자 × 10 × 콤보(최대 3배)</p><p>구름이 다 비면 보너스 스테이지 · 문장 따라 치기</p><p>빠르고 정확할수록 보너스</p><p>180초까지 버티면 목숨 × ' + RAIN_LIFE_BONUS + "</p></div>";
}
/* v5.61 가운데 판 안내(대기) · 방법 1 = 앱의 내 QR 을 위 카메라에 · 폰 그림이 위로 · 앱 가운데 QR 버튼 그림 · 세 단계(SPACE 키 그림) · 카메라가 없으면 방법 2 로 · 시간 밖이면 그 안내만 */
var TSF_PHONE = '<svg class="tsf-phs" viewBox="0 0 22 36" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="0" width="22" height="36" fill="#000"/><rect x="1" y="1" width="20" height="34" fill="#2A2118"/><rect x="2" y="3" width="18" height="29" fill="#F3E7D8"/><rect x="2" y="3" width="18" height="3" fill="#FF7E31"/>' +
  '<rect x="4" y="9" width="14" height="14" fill="#FFFFFF"/><path fill="#000" d="M5 10h4v4H5zM13 10h4v4h-4zM5 18h4v4H5zM10 10h2v1h-2zM10 12h1v2h-1zM11 15h2v1h-2zM14 16h1v2h-1zM15 15h2v1h-2zM10 17h1v1h-1zM11 19h1v3h-1zM13 19h2v1h-2zM16 19h1v3h-1zM13 21h2v1h-2z"/><path fill="#FFFFFF" d="M6 11h2v2H6zM14 11h2v2h-2zM6 19h2v2H6z"/><path fill="#000" d="M7 12h0zM6.5 11.5h1v1h-1zM14.5 11.5h1v1h-1zM6.5 19.5h1v1h-1z"/>' +
  '<rect x="5" y="25" width="12" height="2" fill="#B8AEA6"/><rect x="8" y="33" width="6" height="1" fill="#F3E7D8"/></svg>';
function tsfGuideHtml() {
  var cl = tsfClosed(), ce = TSF.cam.err;
  if (cl) return '<div class="tsf-gd"><p class="tsf-chip">' + (cl.next ? "준비 중" : "오늘 마감") + '</p><p class="tsf-h">' + (cl.next ? "<span><em>" + esc(cl.next) + "</em>에</span><span>" + (cl.first ? "시작해요" : "다시 열려요") + "</span>" : "<span>오늘 도전은</span><span>끝났어요</span>") + "</p>" +
    '<p class="tsf-gs">' + (cl.next ? "1인 " + tsfLimit() + "회 · 최고 점수로 순위" : "1~3위는 17:00 Outro에서 시상") + "</p></div>";
  if (ce === "deny" || ce === "nocam") return '<div class="tsf-gd"><p class="tsf-chip">방법 1 쉬는 중</p><p class="tsf-h"><span>카메라가</span><span>켜지지 않았어요</span></p>' +
    '<p class="tsf-gs">왼쪽 <em>방법 2</em> QR을 폰 카메라로 찍어 주세요</p><p class="tsf-gs s">' + TSF_DESK + "</p>" + tsfStepsHtml() + "</div>";
  return '<div class="tsf-gd"><p class="tsf-chip">방법 1</p><p class="tsf-h"><span>앱의 <em>내 QR</em>을</span><span>위 <em>카메라</em>에 비추세요</span></p>' +
    '<div class="tsf-ill"><p class="tsf-arm">팔을 쭉 펴고<br>폰 화면이<br>카메라를 보게</p><div class="tsf-ph"><i class="tsf-up"></i>' + TSF_PHONE + "</div>" +
    '<div class="tsf-qrb"><span class="tsf-nav"><b>QR</b></span><p>앱 가운데<br><em>QR 버튼</em> → 내 QR</p></div></div>' + tsfStepsHtml() + "</div>";
}
function tsfStepsHtml() {
  return '<div class="tsf-steps"><p><b>1</b><span>QR을 노트북에</span></p><p><b>2</b><span><kbd class="tsf-key">SPACE</kbd>로 시작</span></p><p><b>3</b><span>떨어지는 단어 입력</span></p></div>' +
    '<p class="tsf-foot">1인 ' + tsfLimit() + "회 · 최고 점수로 순위 · 17:00 마감 · 1~3위 Outro 시상</p>";
}
/* 가운데 판 위 DOM · 대기 안내(attract) · 닉네임 칸(nick) · 결과(result) · 나머지는 캔버스(tsfPrevDraw) */
function tsfOvHtml() {
  if (TSF.ph === "attract") return tsfGuideHtml();
  if (TSF.ph === "nick") {
    var cur = (TSF.info && TSF.info.nick) || "";
    return '<div class="tsf-nk"><p class="tsf-t">닉네임을 정해 주세요</p><p class="tsf-s">순위판 · TV에 나오는 이름 · 실명은 나오지 않아요</p>' +
      '<label class="ax-sr-only" for="tsfNick">닉네임</label><input id="tsfNick" class="tsf-in" maxlength="8" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="' + esc(cur) + '"' +
      ' oninput="tsfNickIn(this, event)" data-imeend="tsfnick" aria-describedby="tsfNickLn">' +
      '<p class="tsf-ln' + (TSF.nmBad ? " bad" : "") + '" id="tsfNickLn" role="status">' + esc(TSF.nm || "2~8자 · 한글·영문·숫자") + '</p><p class="tsf-hint">Enter 저장 · Esc 처음으로</p></div>';
  }
  if (TSF.ph === "result") return '<div class="tsf-res">' + tsfResHtml() + "</div>";
  return "";
}
/* 칸만 고치기 · 왼쪽 · 오른쪽 · 가운데 DOM(단계 · 시간 밖 · 카메라 오류가 바뀔 때만 · 닉네임 칸이 끊기지 않게) · 접속 QR */
function tsfPaint() {
  if (App.current !== "type_site") return;
  var root = document.querySelector(".tsf"); if (!root) return;
  var cl = tsfClosed();
  root.className = "tsf ph-" + TSF.ph + (TSF.sc.on ? " scan-on" : "") + (cl ? " closed" : "");
  TSF.closedK = cl ? "c" + cl.next : "";
  var lx = el("tsfLx"), lk = TSF.ph + "|" + TSF.closedK + "|" + (TSF.ph === "result" ? (tsfLinkWant() ? 1 : 0) : "") + "|" + (TSF.info ? TSF.nick + TSF.info.left : "");
  if (lx && lx._k !== lk) { lx._k = lk; lx.innerHTML = tsfLeftHtml(); tsfLinkPaint(); }
  var rr = el("tsfR"); if (rr) rr.innerHTML = tsfRightHtml();
  var ov = el("tsfOv"), key = TSF.ph + "|" + (TSF.ph === "result" ? TSF.send : "") + "|" + TSF.closedK + "|" + (TSF.ph === "attract" ? TSF.cam.err : "");
  if (ov && ov._k !== key) { ov._k = key; ov.innerHTML = tsfOvHtml(); }
}
function tsfNickFocus() { setTimeout(function () { var n = el("tsfNick"); if (n && TSF.ph === "nick" && !el("modal")) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} } }, 30); }
function tsfNm(m, bad) { TSF.nm = m || ""; TSF.nmBad = !!bad; var b = el("tsfNickLn"); if (b) { b.textContent = TSF.nm || "2~8자 · 한글·영문·숫자"; b.className = "tsf-ln" + (TSF.nmBad ? " bad" : ""); } }
function tsfRankPull(force) {
  if (!BE.on || (!force && Date.now() - TSF.topT < 20000)) return;
  TSF.topT = Date.now();
  beCall({ action: "type_rank", mode: "site", emp: TSF.ph === "result" ? TSF.emp : "", n: 10 }, function (r) {
    if (!r || !r.ok) return;
    TSF.top = r;
    var b = el("tsfR"); if (b && App.current === "type_site") b.innerHTML = tsfRightHtml();
  }, function () {});
}
/* 가운데 판 · 판이 돌지 않을 때 · 바탕 = 대기 데모(봇이 혼자 친다 · v5.61 대기에서는 약하게 · 안내는 DOM) · 위에 단계별 글자(점 글자 + 도트 글꼴) */
function tsfPrevDraw() {
  var cv = el("tsfCv"); if (!cv || RG.on) return;
  if (typeof rgAttractDraw !== "function" || typeof rtDots !== "function") return;   /* 옛 엔진이 캐시에 남은 몇 분(배포 직후) · 그림만 쉬고 화면은 그대로 */
  var box = cv.parentNode, w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  var ctx = cv.getContext("2d"), L = rgLayout(w, h, true, false), now = performance.now(), ph = TSF.ph, el2 = (now - TSF.phAt) / 1000, rm = rgReduced(), blink = rm || Math.floor(now / 530) % 2 === 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  rgAttractDraw(ctx, L, now);
  var dh = Math.max(28, Math.min(64, Math.round(w * 0.085))), cx = w / 2, y = Math.round(Math.max(L.floor * 0.3, 150));
  var veil = function (a) { ctx.fillStyle = "rgba(24,22,20," + a + ")"; ctx.fillRect(0, 0, w, h); };
  var line = function (t, yy, px, col) { ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = rtFont(px); if (ctx.measureText(t).width > w - 32 && px > 16) px = px === 48 ? 32 : 16; rtText(ctx, t, cx, yy, px, col, RAIN_PAL.ink); };
  ctx.save();
  if (ph === "attract") veil(TSF.sc.on ? 0.94 : 0.86);   /* v5.61 결정 ⑧ B · 봇 데모는 배경으로 약하게 · 안내는 tsfGuideHtml */
  else if (ph === "check") {
    veil(0.6);
    rtDots(ctx, "QR OK", cx, y, dh, RAIN_PAL.o100, { align: "center", line: RAIN_PAL.ink });
    line(TSF.retry ? "연결이 불안정해요 · 다시 시도하는 중" : "확인 중" + ".".repeat(1 + Math.floor(now / 300) % 3), y + dh + 40, 32, RT_PAL.cream);
  } else if (ph === "err") {
    veil(0.7);
    rtDots(ctx, "TRY AGAIN", cx, y, dh * 0.9, RAIN_PAL.o60, { align: "center", line: RAIN_PAL.ink });
    if (TSF.err) { line(TSF.err.t1, y + dh + 44, 32, RT_PAL.cream); if (TSF.err.t2) line(TSF.err.t2, y + dh + 92, 16, RT_PAL.tan2); }
  } else if (ph === "join") {   /* v5.61 확인됐어요 · 0.8초 · 점이 0.5초 동안 켜진다 */
    veil(0.66);
    var n = rtDotsN("PLAYER JOIN"), lit = !rm ? Math.floor(Math.min(1, el2 / 0.5) * n) : n;
    rtDots(ctx, "PLAYER JOIN", cx, y, dh, RAIN_PAL.o100, { align: "center", line: RAIN_PAL.ink, lit: lit });
    line("확인됐어요 · " + (TSF.nick ? TSF.nick + "님" : "새 도전자"), y + dh + 56, 32, RT_PAL.cream);
    line("남은 도전 " + TSF.info.left + "회 · " + (TSF.info.best ? "내 최고 " + typePts(TSF.info.best) : "첫 도전"), y + dh + 104, 16, RT_PAL.tan2);
  } else if (ph === "ready") {   /* 준비 화면 · QR 만으로는 시작하지 않는다(261003) · v5.30 규칙 세 줄 · v5.61 큰 SPACE 키 */
    veil(0.96);
    tsfReadyDraw(ctx, w, h, blink);
  } else if (ph === "nick" || ph === "result") veil(0.7);
  ctx.restore();
}
/* v5.30(261003 사용자 피드백) 준비 화면 · 도전자 · 규칙 세 줄(그림 + 제목 + 조건) · v5.61 큰 SPACE 키 그림 + 「누르면 시작」 · 20초 방치면 처음으로(마지막 5초 숫자)
   ① 구름에서 내리는 단어를 쳐서 없앤다 · 바닥에 닿으면 목숨 -1 ② 구름이 다 비면 보너스 스테이지 · 문장을 따라 친다 ③ 점수 = 단어 + 콤보 + 보너스 · 1인 n회 · 최고 점수로 순위
   그림 = 16 × 14 칸 도트(구름과 비 · 문장 판과 커서 · 별) · 글자는 16 · 32 만 · 판 높이가 낮으면(720 미만) 간격만 줄인다 */
var TSF_ICON = {
  rain: ["....kkkk........", "...kcccckkkk....", ".kkcggggcccck...", "kccggggggggggk..", "kgggggggggggggk.", ".kkkkkkkkkkkkk..", "..d...d...d.....", "...d...d...d....", "..d...d...d.....", "................", ".kkkkkkkkkkkk...", ".kttttttttttk...", ".ktbbtbbtbbtk...", ".kkkkkkkkkkkk..."],
  line: ["kkkkkkkkkkkkkkkk", "kwwwwwwwwwwwwwwk", "kwnnnnnnnnnnnnwk", "kwnccnccncccnnwk", "kwnnnnnnnnnnnnwk", "kwnccnccnnnnnnwk", "kwnnnnnoonnnnnwk", "kwnnnnnnnnnnnnwk", "kwwwwwwwwwwwwwwk", "kkkkkkkkkkkkkkkk"],
  star: [".......kk.......", "......keok......", "......kook......", "kkkkkkoooookkkkk", ".keooooooooooook", "..kooooooooook..", "...koooooooook..", "...kooookoook...", "..koook..kooook.", "..kook....kook..", ".kkk........kkk."]
};
function tsfIconDraw(ctx, rows, x, y, u) {
  var pal = { k: RAIN_PAL.ink, c: RT_PAL.cream, g: RAIN_PAL.gray, d: RAIN_PAL.dim, t: RT_PAL.tan2, b: RT_PAL.bark, o: RAIN_PAL.o100, e: RAIN_PAL.o30, w: RT_PAL.wood, n: RT_PAL.night };
  for (var r = 0; r < rows.length; r++) for (var c = 0; c < rows[r].length; c++) { var k = rows[r].charAt(c); if (k === ".") continue; ctx.fillStyle = pal[k]; ctx.fillRect(Math.round(x + c * u), Math.round(y + r * u), u, u); }
}
/* 키 그림 · 크림 윗면 + 황갈 아랫단(눌리는 키) · 검정 계단 테두리 · 글자는 점 글자 */
function tsfKeyDraw(ctx, x, y, w, h, label, dh) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  var b = Math.max(6, Math.round(h * 0.12));
  ctx.fillStyle = RAIN_PAL.ink; ctx.fillRect(x + 4, y, w - 8, h); ctx.fillRect(x, y + 4, w, h - 8);
  ctx.fillStyle = RT_PAL.tan; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = RT_PAL.cream; ctx.fillRect(x + 4, y + 4, w - 8, h - 8 - b);
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x + 8, y + 6, w - 16, 3);
  rtDots(ctx, label, x + w / 2, y + 4 + (h - 8 - b) / 2, dh, RT_PAL.night, { align: "center" });
}
function tsfReadyDraw(ctx, w, h, blink) {
  var cx = w / 2, cmp = h < 720, y, i = TSF.info || {};
  var line = function (t, yy, px, col) { ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = rtFont(px); if (ctx.measureText(t).width > w - 32 && px > 16) px = 16; rtText(ctx, t, cx, yy, px, col, RAIN_PAL.ink); };
  var rows = [
    ["rain", "단어 치기", ["구름에서 내리는 단어를 쳐서 없애요", "바닥에 닿으면 목숨 -1 · 목숨 " + (RAIN_LIVES || 5) + "개"]],
    ["line", "보너스 스테이지", ["구름이 다 비면 문장을 따라 쳐요", "빠르고 정확할수록 보너스"]],
    ["star", "점수 · 순위", ["단어 + 콤보 + 보너스 스테이지", "1인 " + tsfLimit() + "회 · 최고 점수로 순위"]]
  ];
  var u = cmp ? 3 : 4, iw = 16 * u, px = 14, pw = w - 2 * px, pad = cmp ? 12 : 16, tx = px + pad + iw + 18, tw = px + pw - pad - tx, hl = cmp ? 34 : 40, dl = cmp ? 20 : 24, gap = cmp ? 8 : 14;
  ctx.font = rtFont(16);
  rows.forEach(function (r) { var ls = []; r[2].forEach(function (t) { rgWrap(ctx, t, tw).forEach(function (x) { ls.push(x); }); }); r.ls = ls; r.h = Math.max(14 * u, hl + ls.length * dl); });
  var ph = 2 * pad + 8 + rows.reduce(function (a, r) { return a + r.h; }, 0) + gap * (rows.length - 1);
  var kh = cmp ? 84 : 112, kw = Math.min(w - 64, cmp ? 380 : 460), kd = cmp ? 34 : 44;
  var tot = 32 + 30 + (cmp ? 18 : 28) + kh + (cmp ? 14 : 20) + 32 + (cmp ? 16 : 26) + ph + (cmp ? 16 : 24) + 16 + 30;
  y = Math.max(cmp ? 70 : 96, Math.round((h - tot) / 2) + 16);
  line(TSF.nick || "새 도전자", y, 32, RT_PAL.cream);
  line("남은 도전 " + (i.left != null ? i.left : tsfLimit()) + "회 · " + (i.best ? "내 최고 " + typePts(i.best) : "첫 도전"), y + 30, 16, RT_PAL.tan2);
  y += 30 + (cmp ? 18 : 28);
  tsfKeyDraw(ctx, cx - kw / 2, y, kw, kh, "SPACE", kd);
  y += kh + (cmp ? 14 : 20);
  line("누르면 시작", y + 16, 32, blink ? RAIN_PAL.o100 : RAIN_PAL.deep);
  y += 32 + (cmp ? 16 : 26);
  rtPanel(ctx, px, y, pw, ph, 2, RT_PAL.night);
  var ry = y + pad + 4;
  rows.forEach(function (r, k) {
    tsfIconDraw(ctx, TSF_ICON[r[0]], px + pad, ry + Math.max(0, (r.h - TSF_ICON[r[0]].length * u) / 2), u);
    ctx.fillStyle = RAIN_PAL.o100; ctx.fillRect(tx, ry + 4, 26, 26);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; rtText(ctx, String(k + 1), tx + 13, ry + 17, 16, RT_PAL.night, null);
    ctx.textAlign = "left"; rtText(ctx, r[1], tx + 36, ry + 17, 32, RAIN_PAL.o100, RAIN_PAL.ink);
    r.ls.forEach(function (t, j) { rtText(ctx, t, tx, ry + hl + j * dl + dl / 2, 16, j ? RT_PAL.tan2 : RT_PAL.cream, null); });
    ry += r.h;
    if (k < rows.length - 1) { ctx.fillStyle = RT_PAL.wood; ctx.fillRect(px + pad, Math.round(ry + gap / 2 - 1), pw - 2 * pad, 2); ry += gap; }
  });
  y += ph + (cmp ? 16 : 24);
  var left = Math.ceil((TSF_READY_MS - (Date.now() - TSF.idle)) / 1000);
  line("Tab 닉네임 바꾸기 · Esc 처음으로", y + 8, 16, RT_PAL.tan2);
  if (left <= 5 && left > 0) line(left + "초 뒤 처음 화면 · 아무 키나 누르면 그대로", y + 38, 16, RAIN_PAL.o60);
}
/* 화면에 붙은 뒤 · 0.265초 시계(단계 시간 · 가만히 있으면 처음으로 · 결과 10초 · 방법 2) · 그림은 매 프레임(rAF) · 카메라 · 순위 20초마다 */
function tsfMount() {
  if (App.current !== "type_site" || !tsfOn()) return;
  if (!TSF.t) TSF.t = setInterval(tsfTick, 265);
  if (!TSF.idle) TSF.idle = Date.now();
  if (!TSF.phAt) TSF.phAt = performance.now();
  if (!TSF.raf) TSF.raf = requestAnimationFrame(tsfFrame);
  TSF.sc.on = false;
  tsfCamStart(); tsfRankPull(); tsfCfgPull(); tsfLinkPaint();
  if (TSF.ph === "nick") tsfNickFocus();
  if (typeof BOT_DOT !== "undefined" && !BOT_DOT.ok && typeof botDotLoad === "function") botDotLoad(tsfPrevDraw);
}
function tsfFrame() {
  TSF.raf = 0;
  if (App.current !== "type_site" || !tsfOn()) return;
  if (!RG.on) { tsfPrevDraw(); tsfScanDraw(); }
  TSF.raf = requestAnimationFrame(tsfFrame);
}
function tsfStop() { if (TSF.t) { clearInterval(TSF.t); TSF.t = null; } if (TSF.raf) { cancelAnimationFrame(TSF.raf); TSF.raf = 0; } tsfCamStop(); }
function tsfTick() {
  if (App.current !== "type_site" || !tsfOn()) { tsfStop(); return; }
  tsfLinkTick();
  if (RG.on) return;
  var now = Date.now(), el2 = (performance.now() - TSF.phAt) / 1000, ph = TSF.ph, cl = tsfClosed();
  if ((cl ? "c" + cl.next : "") !== TSF.closedK) tsfPaint();
  if (ph === "join" && el2 > TSF_JOIN_S) tsfPh(TSF.nick ? "ready" : "nick");
  else if (ph === "err" && el2 > ((TSF.err && TSF.err.dur) || 4)) tsfReset();
  else if ((ph === "ready" && now - TSF.idle > TSF_READY_MS) || (ph === "nick" && now - TSF.idle > TSF_NICK_MS)) tsfReset();   /* 자리를 뜬 사람이 다음 사람에게 남지 않게 */
  else if (ph === "result") {
    var left = Math.max(0, Math.ceil((TSF_RES_MS - (performance.now() - TSF.resAt)) / 1000)), c = el("tsfCount");
    if (c) c.textContent = left + "초 뒤 처음 화면 · SPACE 바로";
    if (left <= 0 && TSF.send !== "sending") tsfReset();
    else { var lw = tsfLinkWant() ? 1 : 0; if (lw !== TSF.lw) { TSF.lw = lw; tsfPaint(); } }   /* 8초 뒤 왼쪽 = 방법 2 접속 QR */
  }
  if (TSF.cam.stream && !TSF.cam.timer) tsfCamAttach();
  if (TSF.ph === "attract") { tsfRankPull(); tsfCfgPull(); }
}
/* 닉네임 칸 · 공백은 받지 않는다(규칙 = 타자 닉네임 · 한글·영문·숫자 2~8자) · 조합 중에는 값을 고치지 않는다 · 형식에 없는 글자만 바로 알린다 */
function tsfNickIn(n, e) {
  tsfPoke();
  if (!(e && e.isComposing) && !IME.on && /\s/.test(n.value)) n.value = n.value.replace(/\s/g, "");
  var v = n.value.replace(/\s/g, "");
  tsfNm(v && /[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]/.test(v) ? "한글·영문·숫자만 쓸 수 있어요" : "", !!(v && /[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]/.test(v)));
}
/* 닉네임 저장(Enter) · 규칙과 거절 사유는 타자 닉네임과 같다(type_nick_set) · 서버에 있는 것 그대로거나 테스트 사번이면 저장하지 않는다 · 저장되면 READY */
function tsfNickSave() {
  var i = TSF.info, n = el("tsfNick"), v = n ? n.value.replace(/\s/g, "") : "", bad = typeNickValid(v), emp = TSF.emp;
  if (!i || TSF.busy || TSF.ph !== "nick") return;
  if (bad) { tsfNm(v ? "한글·영문·숫자 2~8자만 쓸 수 있어요" : "닉네임을 입력해 주세요", true); sfx("rgmiss"); tsfNickFocus(); return; }   /* 규칙은 typeNickValid 그대로 · 문구만 한 줄로 */
  if (v === i.nick || i.test) { TSF.nick = v; tsfPh("ready"); sfx("click"); return; }
  TSF.busy = true; tsfNm("저장 중", false);
  beCall({ action: "type_nick_set", emp: emp, nick: v, key: tsfKey(), tok: tsfTok() }, function (r) {   /* v4.67 셀프 노트북은 참가자 토큰이 없다 · 관리코드 · 스태프 토큰으로 서버 세션필수를 통과 */
    TSF.busy = false;
    if (TSF.ph !== "nick" || TSF.emp !== emp) return;
    if (r && r.ok) { TSF.nick = r.nick; i.nick = r.nick; tsfPh("ready"); sfx("click"); return; }
    tsfNm(TYPE_NICK_WHY[r && r.reason] || "저장하지 못했어요 · 다시 Enter", true); sfx("rgmiss"); tsfNickFocus();
  }, function () { TSF.busy = false; if (TSF.ph === "nick") { tsfNm(TSF_WHY.net, true); tsfNickFocus(); } });
}
/* SPACE(READY) · 서버에 시작을 알리고(이때 1회를 쓴다) 바로 카운트다운 · 서버가 거절하면 판을 접는다 · v5.61 노트북 이름(dev) = 같은 사번 두 노트북 동시 진행 막기 */
function tsfGo() {
  if (TSF.ph !== "ready" || !TSF.info || TSF.busy) return;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  TSF.ph = "play"; TSF.res = null; TSF.sub = null; TSF.send = ""; TSF.ticket = ""; tsfDbg("ph", "play"); tsfLinkDrop(); tsfScanShow(false);
  beCall({ action: "type_self_start", key: tsfKey(), tok: tsfTok(), emp: TSF.emp, dev: tsfDev() }, function (r) {
    if (r && r.ok) { TSF.ticket = r.ticket || ""; return; }
    if (r && ["limit", "unknown", "window", "auth", "param", "locked", "dup"].indexOf(r.reason) >= 0) {
      if (RG.on && RG.mode === "site") rgStop();
      tsfErr(r.reason === "limit" ? tsfLimitMsg(r) : TSF_WHY[r.reason] || "시작하지 못했어요");
      App.render();
    }
  }, function () {});   /* 응답이 없으면 그대로 한다 · 제출 때 서버가 남은 횟수로 다시 본다 */
  rgStart("site", { wait: false, bonus: true, race: TSF.race });
}
/* rgEndFinal(site) 이 부른다 */
function tsfDone(res) {
  res.prev = (TSF.info && TSF.info.best) || 0;
  TSF.res = res; TSF.ph = "result"; TSF.resAt = performance.now(); TSF.phAt = TSF.resAt; tsfPoke(); tsfDbg("ph", "result");
  App.render(); tsfSend();
}
function tsfQuit() { tsfErr("도전을 멈췄어요", "1회를 썼어요"); App.render(); }
function tsfSend() {
  var r = TSF.res; if (!r) return;
  TSF.send = "sending"; TSF.why = "";
  var paint = function () { if (App.current === "type_site" && TSF.ph === "result") tsfPaint(); };
  beCall({ action: "type_self_submit", key: tsfKey(), tok: tsfTok(), emp: TSF.emp, ticket: TSF.ticket, score: r.score, hits: r.hits, combo: r.combo, acc: r.acc }, function (x) {
    if (x && x.ok) { TSF.send = "ok"; TSF.sub = x; if (x.top) { TSF.top = { ok: true, top: x.top, me: x.me, tries: x.limit }; TSF.topT = Date.now(); } if (x.pb) setTimeout(function () { sfx("best"); }, 250); }   /* v4.50(260925) 테스트 사번도 실제로 저장되어 dry 가 없다 */
    else { TSF.send = "fail"; TSF.why = (x && x.reason) || ""; }
    TSF.resAt = performance.now(); paint();
  }, function () { TSF.send = "fail"; TSF.why = "net"; TSF.resAt = performance.now(); paint(); });
}
function tsfResHtml() {
  var r = TSF.res || {}, x = TSF.sub || {}, lim = x.limit || tsfLimit();
  /* v4.50(260925) 테스트 사번도 실제로 저장되어 dry 가 없다 · TSF.emp 가 테스트 사번이면 줄 끝에만 표시 */
  var rank = TSF.send === "sending" ? "기록 저장 중" : TSF.send === "ok" ? (x.pb ? "신기록!" : "내 최고 " + typePts(x.best || 0)) + (x.me ? " · 현장 " + x.me.rank + "위" : "") + (TEST_EMP.indexOf(TSF.emp) >= 0 ? " · 테스트 사번" : "") :
    "저장하지 못했어요 · " + (TSF.why === "net" ? "서버 응답 없음" : TSF.why === "limit" ? "도전 횟수를 넘었어요" : TSF_WHY[TSF.why] || TSF.why);
  var left = TSF.send === "ok" ? (x.left > 0 ? "남은 도전 " + x.left + "회 · 다시 하려면 내 QR" : "도전 " + lim + "회를 모두 쓰셨어요 · 고마워요") : "";
  var cap = r.why === "cap";
  return rtGoHtml({ title: cap ? "TIME UP" : "GAME OVER", sub: "AX 단어 소나기 · " + (TSF.nick || "익명 참가자"),
    line: cap ? "180초를 버텼어요 · 목숨 보너스" : "단어 " + (RG.lives0 || RAIN_LIVES) + "개를 놓쳤어요",
    body: '<p class="gs-sc">' + typePts(r.score || 0) + "</p>" + '<p class="rt-go-rank">' + esc(rank) + "</p>" + (left ? '<p class="rt-go-rank">' + esc(left) + "</p>" : "") +
      (TSF.send === "fail" && TSF.why !== "limit" && TSF.why !== "range" ? '<button type="button" class="ax-button rt-btn" onclick="tsfSend()">다시 보내기</button>' : "") +
      rtFoldHtml("기록 자세히 보기", rtFoldSec("점수 구성", rtRefTable([["단어 점수", typePts((r.score || 0) - (r.bns || 0) - (r.capBns || 0))], ["보너스 스테이지", typePts(r.bns || 0) + " · " + (r.bnsN || 0) + "번"], ["목숨 보너스", typePts(r.capBns || 0)]])) +
        rtFoldSec("참고 기록", rtRefTable([["터뜨린 단어", (r.hits || 0) + "개"], ["최고 콤보", r.combo || 0], ["정확도", (r.acc || 0) + "%"], ["버틴 시간", typeSec(r.surv || 0)]]))) });
}
/* 키보드 · 판 밖은 전부 여기서 받는다(마우스 없이) · 대기 = 키로 할 일이 없다(QR 만) · READY = SPACE 시작 · Tab 닉네임 · Esc 처음으로 · 닉네임 = Enter 저장 · Esc
   결과 = SPACE 처음으로(1.5초 뒤부터 · 치던 손이 눌러 버린다) · F2 = 스태프 「관리」 · 첫 키에서 소리 길을 연다 · 한글 조합 중 Enter 는 조합이 끝난 값으로 저장 */
function tsfKeyDoc(e) {
  if (App.current !== "type_site" || !tsfOn() || RG.on || GS.cur || el("modal")) return;
  tsfPoke();
  if (!TSF.unl && S.get("site_sound", true) === true) { TSF.unl = true; sfxUnlock(); }
  if (e.key === "F2") { e.preventDefault(); tsfAdmin(); return; }
  var sp = e.code === "Space" || e.key === " ", ph = TSF.ph;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (ph === "result") {
    if (sp) { e.preventDefault(); if (!e.repeat && performance.now() - TSF.resAt > 1500) tsfReset(); }
    return;
  }
  if (ph === "ready") {
    if (sp) { e.preventDefault(); if (!e.repeat) tsfGo(); return; }
    if (e.key === "Tab") { e.preventDefault(); tsfPh("nick"); return; }
    if (e.key === "Escape") { e.preventDefault(); tsfReset(); return; }
    return;
  }
  if (ph === "nick") {
    var t = e.target || {}, comp = e.isComposing || e.keyCode === 229 || IME.on;
    if (e.key === "Escape") { e.preventDefault(); tsfReset(); return; }
    if (e.key === "Tab") { e.preventDefault(); tsfNickFocus(); return; }
    if (sp && !comp) { e.preventDefault(); return; }   /* 닉네임에는 공백이 없다 */
    if (t.id !== "tsfNick") { if (onEnter(e, tsfNickSave)) return; if (e.key && e.key.length === 1) tsfNickFocus(); return; }
    onEnter(e, tsfNickSave);
    return;
  }
  if (sp || e.key === "Tab") e.preventDefault();   /* 대기 · 확인 중 · 안내 = 키로 할 일 없음 · 공백 · Tab 이 단추로 새지 않게 */
}
document.addEventListener("keydown", tsfKeyDoc);
window.addEventListener("resize", function () { if (App.current === "type_site" && tsfOn() && !RG.on) { var g = document.querySelector(".tsf-grid"); if (g) g.style.setProperty("--tsf-bw", tsfBw() + "px"); tsfPrevDraw(); tsfLinkPaint(); } });

/* ── 1F TV 순위판 · 로그인 없음 · 앱 상위 10 ↔ 현장 상위 5 번갈아(12초) · 닉네임만 · 30초마다 새로 받음 ── */
var TYTV = { app: null, site: null, show: "site", pullT: 0, flip: null, fix: "" };   /* v4.59 fix = "site" 이면 부스 판(hsHtml) · 주소 #tv=type&fix=site 에서만 */
function tyTvPull() {   /* v4.16 관리자·테스트 계정이어도 실서버 값 · 서버 없으면 빈 상태("도전을 기다려요") */
  if (Date.now() - TYTV.pullT < (wsLive() ? 115000 : 25000)) return;   /* v4.75 소켓이 붙어 있으면 힌트(tv)로 받고 폴링은 안전망만 */
  TYTV.pullT = Date.now();
  ["site"].forEach(function (m) {   /* v3.86 TV 는 현장 기록만 받는다 */
    beCall({ action: "type_rank", mode: m, n: 5 }, function (r) { if (r && r.ok) { TYTV[m] = r; if (App.current === "wall_type") App.render(); } }, function () {});
  });
}
function tyTvTick() {
  if (App.current !== "wall_type") { clearInterval(TYTV.flip); TYTV.flip = null; return; }
  TYTV.show = TYTV.show === "site" ? "oly" : TYTV.show === "oly" ? "oly2" : "site";   /* v4.02 현장 타자 → 올림픽 종합 포디움 → 올림픽 종목별 1~3위 (12초씩) */
  tyTvPull(); if (!wsLive() || Date.now() - OLY.t > 115000) olyPull();
  App.render();
}
function tyTvRows(r, n) {
  var top = (r && r.top) || [], h = "";
  for (var i = 0; i < n; i++) {
    var x = top[i];
    h += '<div class="tytv-row' + (i < 3 && x ? " top" : "") + '"><span class="no">' + (i + 1) + '</span><span class="nm">' + (x ? esc(x.name) : '<span style="opacity:0.35">도전을 기다려요</span>') + '</span><span class="sc">' + (x ? typePts(x.score) : "") + "</span></div>";   /* v5.12 현장 = 점수 */
  }
  return h;
}

/* ── v4.59 1F 타자왕 부스 세로 TV(260929 사용자 지시 · 기획안 ② 세로 55" 「HIGH SCORE 현장 TOP 10」) · #tv=type&fix=site ──
   현장 셀프 기록(site) TOP 10 고정 · 번갈아 보이기 없음. 주소 #tv=type(그대로)은 현장 5 ↔ 올림픽 종합 ↔ 종목별 12초 순환을 유지한다.
   부스 판은 wall_type 안의 한 갈래(TYTV.fix)라 풀블리드(tv-mode) · 레트로(.rt) · 무로그인 · 접속 기록 제외(#tv=)가 같다.
   판은 1080×1920 px 로 짜고 hsK() 배율로 줄인다(가로 TV = 가운데 세로 판 + 양옆 도트 여백).
   받기 = 기존 공개 액션 type_rank(mode site · n 10) · 서버 수정 없음 · 테스트 사번 표시 규칙(10/25까지 보이고 10/26부터 뺌)은 서버가 한다.
   폴링 = 30초 · 화면이 가려지면 멈추고 보이면 곧바로 · 실패 30 → 60 → 120초 + 지터(v4.57 앱 폴링과 같은 규칙).
   새 기록(이전 응답에 없던 닉네임·기록 줄)은 4초 동안 살짝 강조 · 첫 응답은 강조하지 않는다 · 동작 줄이기면 깜빡임 없이 테두리만.
   경품은 바닥 한 줄만(v5.06 사용자 확정 · 가격 없음 · v5.09 1등 체리 키보드 · 2등 MX Master 4 · 3등 AULA 키보드) · 도전 시간은 결정 대기라 적지 않는다. */
var TYHS = { data: null, t: null, ms: BE_POLL_MS, busy: false, keys: null, hot: {}, hotT: 0 };
function tyTvFix(h) { var m = String(h || "").match(/[&?]fix=([a-z]+)/i); return m && m[1].toLowerCase() === "site" ? "site" : ""; }
function hsOn() { return App.current === "wall_type" && TYTV.fix === "site"; }
function hsK() { return Math.min(window.innerWidth / 1080, window.innerHeight / 1920) || 1; }
function hsKey(x) { return String(x.name) + "|" + x.score; }
function hsLong(s) { var u = 0; s = String(s || ""); for (var i = 0; i < s.length; i++) u += s.charCodeAt(i) < 0x1100 ? 0.5 : 1; return u > 9; }   /* 한글 1 · 영문·숫자 0.5 · 9칸 넘으면 한 단계 작게, 그래도 넘치면 말줄임 */
function hsNext(ms) {
  if (TYHS.t) { clearTimeout(TYHS.t); TYHS.t = null; }
  if (!hsOn() || document.hidden) return;
  TYHS.t = setTimeout(hsPull, ms);
}
function hsFail() { TYHS.ms = Math.min(BE_POLL_MAX, TYHS.ms * 2); hsNext(TYHS.ms + beJit()); }
function hsPull() {
  if (!hsOn() || document.hidden || TYHS.busy) return;
  if (TYHS.t) { clearTimeout(TYHS.t); TYHS.t = null; }
  TYHS.busy = true;
  beCall({ action: "type_rank", mode: "site", n: 10 }, function (r) {
    TYHS.busy = false;
    if (!(r && r.ok)) { hsFail(); return; }
    var top = r.top || [], keys = top.map(hsKey), hot = {}, n = 0;
    if (TYHS.keys) keys.forEach(function (k) { if (TYHS.keys.indexOf(k) < 0) { hot[k] = 1; n++; } });
    var same = !!TYHS.data && TYHS.keys.join("\n") === keys.join("\n") && TYHS.data.tries === r.tries;
    TYHS.data = r; TYHS.keys = keys; TYHS.ms = wsLive() ? Math.max(BE_POLL_MS, WS.cfg.p * 1000) : BE_POLL_MS;   /* v4.75 소켓 연결 중 = 힌트로 곧바로 · 폴링은 안전망 */
    hsNext(TYHS.ms);
    if (n) { TYHS.hot = hot; TYHS.hotT = Date.now() + 4000; setTimeout(function () { TYHS.hot = {}; if (hsOn()) App.render(); }, 4200); }
    if (!same && hsOn()) App.render();
  }, function () { TYHS.busy = false; hsFail(); });
}
document.addEventListener("visibilitychange", function () {
  if (document.hidden) { if (TYHS.t) { clearTimeout(TYHS.t); TYHS.t = null; } return; }
  if (hsOn()) hsPull();   /* 다시 보이면 곧바로 한 번 */
});
window.addEventListener("resize", function () { var b = el("hsBd"); if (b && hsOn()) b.style.transform = "scale(" + hsK() + ")"; });
function hsHtml() {
  if (!TYHS.t && !TYHS.busy) setTimeout(hsPull, 0);
  var r = TYHS.data, top = (r && r.top) || [], hotOn = Date.now() < TYHS.hotT, rows = "";
  for (var i = 0; i < 10; i++) {
    var x = top[i];
    rows += '<div class="hs-row' + (x ? (i < 3 ? " r" + (i + 1) : "") + (hotOn && TYHS.hot[hsKey(x)] ? " new" : "") : " nil") + '"><span class="no">' + (i + 1) + "</span>" +
      '<span class="nm' + (x && hsLong(x.name) ? " long" : "") + '">' + (x ? esc(x.name) : "") + '</span><span class="sc">' + (x ? typePts(x.score) : "") + "</span></div>";   /* v5.12 점수 기준(표시 단위만 · 판 디자인은 그대로) */
  }
  var u = rtBotImg(), tries = (r && r.tries) || 3;
  return '<div class="hs"><div class="hs-bd" id="hsBd" style="transform:scale(' + hsK() + ')">' +
    '<b class="tytv-brand hs-brand">AX Festival <span>2026</span></b>' +
    '<p class="hs-h">HIGH SCORE</p><p class="hs-sub">1F 타자왕 · 현장 TOP 10</p>' +
    (r && !top.length ? '<p class="hs-empty">첫 기록을 기다리고 있어요</p>' : "") +
    '<div class="hs-list">' + rows + "</div>" +
    '<div class="hs-foot">' + (u ? '<img class="hs-bot" src="' + u + '" alt="">' : '<span class="hs-bot">' + BOT_SVG + "</span>") +
    "<p>1인 " + tries + "회 · 최고 점수 1개로 순위<br>17:00 마감 · 1~3위 Outro 시상</p></div>" +
    '<p class="hs-prz">1등 기계식 키보드 · 2등 마우스 · 3등 기계식 키보드</p></div></div>';   /* v5.09 (261003 사용자 확정) 새 경품 짧은 이름 · v5.06 바닥 경품 한 줄 · 가격 없음 · v5.05 결선 없음 · 1~3위 */
}

/* v3.50 시상 · AX 올림픽 탭 · 종합 1~3위 호명(닉네임 + 실명) · 관리코드 oly_result */
var OLYAW = { data: null, t: 0 };
function olyAwardTabs(cur) {
  var st = "background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.3);white-space:nowrap";
  return '<div class="row" style="gap:6px;margin-top:12px">' + [["type", "타자왕전"], ["oly", "AX 올림픽"]].map(function (t) {
    return '<button class="chip" style="' + (cur === t[0] ? "background:var(--mint);color:#fff;border-color:var(--mint);white-space:nowrap" : st) + '" onclick="S.set(\'tyaw_tab\', \'' + t[0] + '\')">' + (t[0] === "oly" ? olyOvName(OLYAW.data) : t[1]) + "</button>";   /* v4.83 「미니 게임」(옛 서버 「AX 올림픽」) */
  }).join("") + "</div>";
}
function olyAwardPull(force) {
  if (!BE.on) return;   /* v4.16 서버 없는 로컬 미리보기 · 가짜 예시 이름 대신 빈 상태("불러오는 중") */
  if (!force && Date.now() - OLYAW.t < 20000) return;
  OLYAW.t = Date.now();
  beCall(admA({ action: "oly_result" }), function (r) {
    if (r && r.ok) { OLYAW.data = r; if (App.current === "type_award") App.render(); }
    else toast(r && r.reason === "auth" ? "관리자 모드에서 코드를 먼저 입력해 주세요" : r && r.reason === "locked" ? admLockedMsg(r) : "결과를 불러오지 못했습니다");   /* v4.65 이 화면은 앱 관리자 모드 코드를 쓴다(콘솔 아님) · 토큰 · 잠금 문구 */
  }, function () { toast("서버 응답 없음"); });
}
function olyAwardHtml() {
  olyAwardPull();
  var d = OLYAW.data, hide = S.get("tyaw_hide", false), top = ((d && d.overall) || []).slice(0, 3), st = "background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.3);white-space:nowrap";
  var pg = S.get("tyaw_oly_pg", "all") === "event" ? "event" : "all";
  return '<div class="screen-wrap tytv"><div class="row" style="justify-content:space-between;padding-top:8px;flex-wrap:wrap;gap:6px">' +
    '<b class="disp" style="font-size:24px;letter-spacing:0.03em">AX Festival <span style="color:var(--mint-deep)">2026</span></b>' +
    '<div class="row" style="gap:6px;flex-wrap:wrap">' + tvBtns() +
    '<button class="chip" style="' + st + '" onclick="olyAwardPull(true)">새로고침</button>' +
    '<button class="chip" style="' + st + '" onclick="S.set(\'tyaw_hide\', ' + (hide ? "false" : "true") + ')">실명 ' + (hide ? "보이기" : "가리기") + "</button>" +
    '<button class="chip" style="' + st + '" onclick="App.go(\'type_site\')">← 진행 화면</button></div></div>' +
    olyAwardTabs("oly") +
    '<div class="row" style="gap:6px;margin-top:8px">' + [["all", "종합 1~3위"], ["event", "종목별 1~3위"]].map(function (t) {
      return '<button class="chip" style="' + (pg === t[0] ? "background:var(--mint);color:#fff;border-color:var(--mint);white-space:nowrap" : st) + '" onclick="S.set(\'tyaw_oly_pg\', \'' + t[0] + '\')">' + t[1] + "</button>";
    }).join("") + "</div>" +
    '<p class="tytv-k">17:00 OUTRO · 명예 시상</p><p class="tytv-t">' + olyOvName(d) + (pg === "event" ? " 종목별 1~3위" : " 종합 1~3위") + "</p>" +   /* v4.83 시상 = 미니 게임 세 종목(oly_result oev) */
    (pg === "event" ? '<div class="tve-grid aw' + (olyOvEvents(d).length === 3 ? " n3" : "") + '">' + olyOvEvents(d).map(function (e) {
      var l = ((d && d.perEvent) || {})[e.key] || [];
      return '<div class="tve"><p class="tve-h">' + esc(e.name) + "</p>" + [0, 1, 2].map(function (i) {
        var x = l[i];
        return '<div class="tve-row">' + (x ? olyLw(i + 1, 96) : '<span class="tve-no">' + (i + 1) + "</span>") + '<span class="nm">' + (x ? esc(x.nick || "익명 참가자") + "<small>" + (hide ? "" : esc(x.name || "") + " · ") + esc(x.key || "") + "</small>" : '<span style="opacity:0.35">기록 없음</span>') + '</span><span class="sc">' + (x ? olyFmt(x.score) : "") + "</span></div>";
      }).join("") + "</div>";
    }).join("") + "</div>"
      : top.length ? '<div class="awp-stage">' + [top[1], top[0], top[2]].map(function (x, k) {
        var r = [2, 1, 3][k];
        return '<div class="awp r' + r + '">' + (x ? olyLw(r, r === 1 ? 240 : 180) + "<b>" + esc(x.nick || "익명 참가자") + "</b>" + (hide ? "" : "<small>" + esc(x.name || "") + (x.dept ? " · " + esc(x.dept) : "") + "</small>") + "<span>" + olyFmt(x.total) + "<em> / " + olyFmt(olyMax(d)) + "</em></span>" : "") + "<i>" + r + "</i></div>";
      }).join("") + "</div>" : '<p style="padding:24px 4px;opacity:0.7">' + (d ? "아직 전 종목 완주자가 없습니다" : "불러오는 중") + "</p>") +
    '<p class="tytv-foot">명예 시상 · 경품 없음 · 전 종목 완주자만 · 동점은 전 종목 완료가 이른 쪽</p></div>';
}
/* 시상 화면 데이터 · 관리코드 type_result */
var TYAW = { data: null, t: 0 };
function tyAwardPull(force) {
  if (!BE.on) return;   /* v4.16 서버 없는 로컬 미리보기 · 가짜 예시 이름 대신 빈 상태("불러오는 중") */
  if (!force && Date.now() - TYAW.t < 20000) return;
  TYAW.t = Date.now();
  beCall(admA({ action: "type_result" }), function (r) {
    if (r && r.ok) { TYAW.data = r; if (App.current === "type_award") App.render(); }
    else toast(r && r.reason === "auth" ? "관리자 모드에서 코드를 먼저 입력해 주세요" : r && r.reason === "locked" ? admLockedMsg(r) : "결과를 불러오지 못했습니다");   /* v4.65 */
  }, function () { toast("서버 응답 없음"); });
}

