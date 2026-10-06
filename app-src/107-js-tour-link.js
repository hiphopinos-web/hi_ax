/* ═══ v5.11 (261003 사용자 승인 · 「디자인 시안/가상 1층/계획.md」) 1층 둘러보기 · 본체(3D 모형 · 평면 지도 · 목록 · 판 보기)는 assets/tour/ 에 있고 처음 열 때만 받는다(안 여는 사람은 0바이트)
   여기 있는 것 = 불러오기(tourOpen) · 연결(TOUR_HOST · 구역 글은 FLOOR1 · 상태는 zoneLive · 혼잡은 crowdCell) · 입구 3곳(홈 나의 일정 아래 · 상시 운영 1F 맨 위 · 구역 상세) + 판 퀴즈 힌트 · 뒤로 가기 한 줄(popstate)
   위치(벽 · 방향 · 판 순서)는 둘러보기 화면 안에서만 보인다(261001 「앱은 동선 · 위치를 다루지 않는다」의 예외 · 사용자 261003 · design.md 5-21) · 이 파일의 다른 화면은 그대로 위치를 말하지 않는다 */
/* v5.37 (사용자 261003 「이것들이 수정되면 정식 앱에 올리자」) 둘러보기 v3 = 시험 페이지와 같은 공용 모듈(tour3.js · tour3.css · 캐릭터 걷기 · 40도 시점 · 왼손 패드 · 오른손 십자 · 작은 지도 · 스태프 챗봇 · 판 보기 · 돋보기 2개 · 움직임 줄이기 · 입장 암전)
   같은 약속 AXTour.open/close/back/isOpen · 옛 v2(tour.js · tour.css · 자동 둘러보기 · 평면 지도 · 구역 시트)로 되돌리려면 아래 목록의 tour3 두 개를 tour.css · tour.js 로 바꾸면 된다(파일은 그대로 둠) */
/* v5.38 (사용자 261003) 둘러보기 손질 · 캐릭터 겹침(스태프 원 충돌) · 늘 카메라 쪽을 봄 · 조그 패드 · 안내데스크 깜빡임(겹친 면) · 정문 회전문 또렷하게 · 로비 음악(Web Audio 합성 · 「음악 없이」 · 위쪽 스피커 버튼) · 파일 이름 그대로 · 캐시 깨기 ver v538 */
var TOUR = { ver: "v582", busy: false, files: ["tour3.css", "three.min.js", "GLTFLoader.js", "meshopt_decoder.js", "tour-data.js", "tour-scene.js", "tour3.js"] };   /* v5.19 GLB 모형(구운 빛) · 모형 lobby.glb(약 0.7MB)는 tour.js 가 3D 를 그릴 때 받는다 */
try { localStorage.removeItem('axfT3Diag'); } catch (e) {} window.AXT3_DIAG = /[?&]t3diag=1(?:&|$)/.test(location.search);   /* v5.47 진단은 주소에 ?t3diag=1 이 있는 그 페이지에서만 · 기억하지 않는다 · 옛 기기 기억은 지운다(사용자 261004) */   /* v5.44 둘러보기 실기기 진단(주소 ?t3diag=1 · 이 기기에 기억 · ?t3diag=0 이면 끔) · 화면 왼쪽 위에 GPU · 깊이 비트 · highp · DPR · fps */
/* 켜기 스위치 · v5.28 true = 전체 공개(사용자 261003 「1층 3D 전체 공개」) · false 로 두면 입구 3곳 · 판 퀴즈 힌트 링크 · 열기가 모두 숨는다 */
var TOUR_ON = true;
/* v5.19 (사용자 261003) 숨김 주소 · 앱 주소에 ?tour=1 이 붙어 들어오면 그 기기에서만 입구 3곳 · 판 퀴즈 힌트 링크가 보인다(기기에 기억 · ?tour=0 이면 끔 · 키는 axf_ 접두가 아니라 사람 바꾸기에도 남는다)
   v5.28 전체 공개 뒤에는 모두에게 보인다 · 숨김 장치는 남김 = 주소 뒤 ?tour=0 으로 들어오면 그 방문만 끈다(기기 기억 해제 포함) */
var TOUR_PEEK = (function () {
  var m = /[?&]tour=([01])(?:&|$)/.exec(location.search);
  try { if (m) localStorage.setItem("axfTourPeek", m[1]); return localStorage.getItem("axfTourPeek") === "1"; } catch (e) { return !!m && m[1] === "1"; }
})();
var TOUR_OFF = /[?&]tour=0(?:&|$)/.test(location.search);   /* v5.28 ?tour=0 = 이번 방문만 끔(저장 안 함) */
function tourOn() { return (TOUR_ON && !TOUR_OFF) || TOUR_PEEK; }
function tourOpen(o) {
  if (!tourOn()) return;
  o = o || {};
  var keep = o.hint && tourRetLive() ? TOUR_RET : null;   /* v5.57 둘러보기에서 출발한 AX 퀴즈의 힌트 「모형에서 보기」는 출처를 지우지 않는다(퀴즈를 마치면 그대로 1층으로) */
  if (!o.restore) TOUR_RET = null;   /* v5.53 그냥 열면 돌아가기 기억 지움 */
  if (keep) TOUR_RET = keep;
  if (window.AXTour) { AXTour.open(o); return; }
  if (TOUR.busy) return;
  TOUR.busy = true;
  var left = TOUR.files.length, bad = false, q = "?v=" + TOUR.ver;
  /* v5.64 (사용자 261005 「가운데랑 하단에 두 개 떠」) 앱 하단 「여는 중」 알림 삭제 · 안내는 둘러보기 자체 불러오기 화면 하나 */
  TOUR.files.forEach(function (f) {
    var n = /\.css$/.test(f) ? document.createElement("link") : document.createElement("script");
    if (n.tagName === "LINK") { n.rel = "stylesheet"; n.href = "assets/tour/" + f + q; } else { n.src = "assets/tour/" + f + q; n.async = false; }   /* 스크립트는 붙인 순서대로 실행 */
    n.onload = function () { if (--left === 0 && !bad) { TOUR.busy = false; if (window.AXTour) AXTour.open(o); } };
    n.onerror = function () { if (bad) return; bad = true; TOUR.busy = false; toast("둘러보기를 열지 못했어요 · 연결을 확인해 주세요"); };
    document.head.appendChild(n);
  });
}
/* 입구 · 상시 운영 1F 맨 위 카드 · 홈 나의 일정 아래 한 줄(tourHomeHtml) · 최초 로그인 초대장 · 이름은 세 곳 모두 「행사장 둘러보기」(사용자 261004)
   v5.60 (사용자 261004 안2 「연주황 카드로 크게」 · 시안 디자인 시안/시간표 층 색/시안.html ?b=2 · design.md A-4 승인된 예외) 상시 운영 입구 = 홈 줄과 같은 행(rcHtml) + 연주황 면 · O25 테두리 · 캐릭터 52 · 제목 17 · 설명 한 줄
   옛 흰 줄(axs-zfl 「1층 둘러보기」 · 구역 카드와 높이가 같아 입구로 안 보였다)과 구역 상세 「모형에서 보기」는 지웠다 */
var TOUR_ST_DESC = "엘리베이터가 혼잡하면 오늘 하루는 계단을 이용해 보세요";   /* v5.64 둘러보기 계단 블록 카드 */
var TOUR_SUB = "1층 3D · 층별 안내까지";   /* v5.65 (사용자 261005 · 엘리베이터 층 단추가 17F · 10F · 18F 안내로 이어짐) 옛 v5.64 「1층 부스 3D로 미리 보기」 · 그 전 「1층 부스와 판을 3D로 미리 보기」 */
/* v5.64 (사용자 261005 「홈화면도 이것과 통일해줘」) 입구 카드 하나(tourCardHtml) = 상시 운영 1F 맨 위 · 홈(나의 일정 아래 · 행사 전 = 광고판 아래) 두 곳이 같이 쓴다 */
function tourCardHtml() {
  return rcHtml({ cls: " axs-tourgo axs-tourbig", onclick: "tourOpen()", link: true, left: tourBotHtml(), title: "행사 둘러보기", sub: TOUR_SUB });   /* v5.79 (사용자 261006) 이름 = 「행사 둘러보기」 하나(옛 「행사장 둘러보기」 · 띠 「1층 둘러보기로 돌아가기」) */
}
function tourRowHtml() {
  if (!tourOn()) return "";
  return tourCardHtml();
}
/* v5.53 (사용자 261004 「홈 화면에 1층 미리보기가 지금은 요소가 너무 과한 것 같아 · 행사장 둘러보기 한 문장 정도면 충분할 것 같아」) 홈 입구 = 한 줄 「행사장 둘러보기」
   왼쪽 원 = 행사 캐릭터 챗봇(v5.56 · tourBotHtml · 옛 3D 로비 사진 thumb 은 지움) · 오른쪽 이동 표시 · 부제 · 3D 칩 · 버튼 · 사진 4장 순환 · 진행 막대 없음(옛 v5.46 큰 카드 · 시기별 부제 걷음)
   자리는 시기별 그대로 · 행사 전 = 광고판 바로 아래(아직 일정 · 스탬프가 비어 있어 위에 둔다) · 당일 · 종료 뒤 = 나의 일정 아래(당일은 지금 · 다음 일정과 스탬프가 먼저 · design.md A-5) */
/* v5.64 옛 흰 한 줄 → 상시 운영 입구와 같은 연주황 카드(tourCardHtml) · 자리 그대로 */
function tourLineHtml() {
  return '<section class="axs-sec">' + tourCardHtml() + "</section>";
}
/* v5.56 줄 왼쪽 챗봇 · 원본 BOT_SVG(path 그대로 · viewBox 200 그대로) + 안테나 전파 호(BOT_WAVE) + 반달 눈웃음 호 2개(새 요소 · 눈 자리 위 · 평소 숨김)
   --td = 9초 주기 안에서 지금의 위치(홈이 4초마다 다시 그려져도 움직임이 이어진다) · 사진 파일 없음(첫 로딩 바이트 0) */
var TOUR_BOT_SM = '<g class="sm"><path d="M75.4 102.6 A6.2 6.2 0 0 1 87.1 102.6"/><path d="M112.9 102.6 A6.2 6.2 0 0 1 124.6 102.6"/></g>';
function tourBotHtml() {
  return '<span class="ico tbot" style="--td:-' + (Date.now() % 9000) + 'ms">' + BOT_SVG.replace("</svg>", BOT_WAVE + TOUR_BOT_SM + "</svg>") + "</span>";
}
function tourHomeHtml() {   /* 당일 · 종료 뒤 · 나의 일정 아래 */
  return tourOn() && evPhase() !== "before" ? tourLineHtml() : "";
}
function tourHeroHtml() {   /* 행사 전 · 광고판 바로 아래 */
  return tourOn() && evPhase() === "before" ? tourLineHtml() : "";
}
/* v5.46 (사용자 261004 「시작하기 로그인을 하고 나서 > 푸쉬창 처럼 팝업창이 초대장이 뜨는 게 낫지 않겠어?」 · 「대놓고 대상자를 특정하거나 그 사람들을 위한 문구로 가져가지는 말자」) 1층 둘러보기 초대
   홈에 들어간 뒤 바텀 시트(M03) 한 장 · 봉투가 열리며 3D 로비 사진 · 주 버튼 「1층 둘러보기」 · 약한 버튼 「나중에 하기」 · 스탬프 말 없음
   한 번 닫으면(두 버튼 · 뒷배경 · Esc · 뒤로) 이 기기에서 다시 뜨지 않는다(tour_inv · 기기 키) · TOUR_ON 이 꺼져 있으면 없음
   순서: 최초 로그인 장면 · 다른 시트 · 팝업 · 스탬프 연출 · 설치 안내 · 설정 · 둘러보기가 모두 닫힌 홈에서 · 알림 첫 질문은 이 초대와 둘러보기가 닫힌 뒤(pushSheetWait · tourInvHold)
   찍은 QR 을 이어 가는 방문(scanLinkRun · 장면의 scan 닫힘)은 건너뛰고 다음 방문의 홈에서 · 기존 가입자도 다음 홈에서 한 번 · 시연(#demo)은 &inv 일 때만 */
var TINV = { skip: false, t: 0, t0: 0, ok: false };
var TINV_IMG = "assets/tour/inv/";
function tourInvOk() {
  if (!TOUR_ON || TOUR_OFF || TINV.skip || S.get("tour_inv", false)) return false;
  if (!(S.get("user", {}) || {}).empId || /^#(self|tv=)/i.test(VISIT.hash0) || (/^#demo/i.test(VISIT.hash0) && !/[&#]inv\b/.test(VISIT.hash0))) return false;
  return !(typeof tsfOn === "function" && tsfOn());
}
function tourInvBusy() {
  return !!(LGX.cur || el("lgx") || el("modal") || el("axsSheet") || el("spop") || SPOP.cur || SPOP.q.length || NOTICE.cur || NOTICE.q.length || el("rgPlay") || el("app").hidden ||
    (typeof qrGated === "function" && qrGated()) || a2hsShown() || (el("fsSheet") && !el("fsSheet").hidden) || TOUR.busy || (window.AXTour && AXTour.isOpen()));
}
/* 홈을 그릴 때마다(App.render) · 홈에 1.2초 머문 뒤 · 바쁘면 0.4초마다 다시 본다 · 홈을 떠나면 멈추고 다음 홈에서 다시 */
function tourInvMaybe() {
  if (TINV.t || !tourInvOk()) return;
  TINV.t = setTimeout(tourInvTry, 1200);
}
function tourInvTry() {
  TINV.t = 0;
  if (!tourInvOk() || App.current !== "home") return;
  if (tourInvBusy()) { TINV.t = setTimeout(tourInvTry, 400); return; }
  sheetOpen({ id: "tourinv", title: "AX Festival 2026에 오신 것을 환영합니다", lead: "지금 1층 로비를 3D로 둘러볼 수 있습니다.",
    top: '<div class="axs-inv ' + (lgxRM() ? "st-open" : "run") + '" aria-hidden="true"><div class="ph"><img src="' + TINV_IMG + 'invite.jpg" alt=""></div>' +
      '<i class="pc l"></i><i class="pc r"></i><i class="pc b"></i><i class="pc t"></i><span class="seal">AX</span></div>',
    go: "tourInvGo()", goLbl: "행사 둘러보기", keep: "나중에 하기", keepWeak: true, keepLast: true, onClose: tourInvDone });
}
function tourInvDone() { S.put("tour_inv", true); }
function tourInvGo() { tourInvDone(); sheetClose(true); tourOpen(); }
/* 다른 질문(알림 첫 질문 등)은 초대를 기다리는 홈 · 둘러보기를 여는 중 · 열려 있는 동안 미룬다 */
function tourInvHold() { return (tourInvOk() && App.current === "home") || TOUR.busy || !!(window.AXTour && AXTour.isOpen()); }
var TOUR_HOST = {
  sign: function (nm, big) { return zoneSign(nm, big ? "lg" : ""); },
  zone: function (id) {
    if (id === "cafe") { var cz = FLOOR18[0]; return { kor: cz.kor, fact: "18F · " + zoneLive(cz).fact, todo: ["아이디어 한 줄을 내면 신청할 수 있어요"] }; }   /* v5.65 18F 구역 표(FLOOR18) 한 줄 · 상태 */
    var z = zoneById(id); if (!z) return null;
    return { kor: z.kor, fact: zoneLive(z).fact, todo: z.todo };
  },
  acts: function (id) {
    var go = function (v) { return function () { App.go(v); }; };
    if (id === "vision" || id === "action") return [{ lbl: "AX 퀴즈 풀기", run: go("quiz") }];
    if (id === "lab") return [{ lbl: "아이디어 한 줄 쓰기", run: go("ideas") }];
    if (id === "play") return [{ lbl: "체험 안내 보기", run: go("booth") }];
    if (id === "lounge") { var L = zoneLive(zoneById("lounge")); return [{ lbl: L.btn ? L.btn[0] : "상담 신청", run: function () { progOpen("dap"); } }]; }
    if (id === "event") return [{ lbl: "룰렛 경품 보기", run: function () { prizeGo("roulette"); } }, { lbl: "1F 타자왕 순위", run: typeSiteRankGo }];
    if (id === "cafe") return [{ lbl: S.get("cchat", null) ? "내 커피챗 보기" : ideaMineN() ? "커피챗 신청" : "아이디어 쓰고 신청", run: cchatOpen }, { lbl: "아이디어 한 줄 쓰기", run: go("ideas") }];   /* v5.65 신청 전 = 구역 상세(zone_d cchat) */
    return [];
  },
  crowd: function (id) { var k = id === "cafe" ? "e" : "l", x = crowdCell(k); return { nm: k === "e" ? "엘리베이터" : "1F 로비", st: x.st, sub: x.sub, cls: x.cls }; },
  crowdGo: function () { App.tab("home"); setTimeout(function () { var c = document.querySelector(".cstrip2"); if (c) c.scrollIntoView({ block: "center" }); }, 120); },
  /* v5.49 (사용자 261004) 1층 둘러보기 스탬프 블록 · 이름 · 받는 법 · 버튼 문구 = 스탬프 표(STAMPS) 그대로 · got = 이미 받음 · stampGo = 둘러보기를 닫고 그 활동 화면으로 */
  /* v5.64 (사용자 261005 「계단이용 스탬프를 점프하면 · 권장 문구」) 계단 블록 카드 설명 줄 = 사용자 문구 그대로(스탬프 탭 설명은 그대로) */
  stamp: function (id) {
    var s = STAMPS.filter(function (x) { return x.id === id; })[0] || (id === "qz" || id === "p4" ? STAMPS_V2.filter(function (x) { return x.id === id; })[0] : null);
    if (!s) return null;
    return { title: s.title, desc: id === "st" ? TOUR_ST_DESC : s.desc, cta: id === "p3" ? "AX LOUNGE 상담 신청" : s.cta || "바로 가기", got: S.get("stamps", []).indexOf(id) >= 0 };   /* v5.57 (사용자 261004 「이 스탬프에서 연결은 dap 과제 상담 신청 하기로 가야지」) LOUNGE 블록 = 상담 신청 · 설명 줄은 그대로 */
  },
  /* v5.65 (사용자 261005 「각 엘리베이터 이동시에도 각 안내장표로 갈 수 있을 것 같아 · 연결을 시켜보자」) 엘리베이터 층 단추 → 아이리스로 닫힌 뒤 그 층 앱 안내
   17 = 층 안내(floor_d · 17F 대강당 강연 흐름) · 10 = 층 안내(floor_d · 실습형 세션 A~E) · 18 = AX 커피챗 구역 상세(zone_d cchat)
   돌아오기 = 뒤로(헤더 · 휴대폰) · 떠 있는 「3D로 돌아가기」(v5.67 trf) = 엘리베이터 안(pose = { elev }) · 안내 화면이라 마침 · 자동 복귀 띠 없음(TOUR_RET.id 없음) */
  floorGo: function (fl) {
    var pose = window.AXTour && AXTour.pose ? AXTour.pose() : null, under = App.current;
    if (window.AXTour) AXTour.close();
    setTimeout(function () { if (typeof DET !== "undefined") DET.canon = Date.now(); TOUR_RET = { v: fl === 18 ? "zone_d" : "floor_d", under: under, pose: pose, fl: fl }; if (fl === 18) zoneOpen("cchat"); else { PROG.floor = fl; App.go("floor_d"); } trfSync(); }, 280);   /* 그리기 전에 기억(「둘러보기로 돌아가기」 단추가 첫 그림에 나온다) */
  },
  stampGo: function (id) {
    var GO = { qz: function () { App.go("quiz"); }, p4: function () { App.go("games"); }, p2: function () { qrPanelOpen("mine"); }, p5: function () { App.go("ideas"); }, p3: function () { progOpen("dap"); }, st: function () { stairOpen(); } };
    if (!GO[id]) return;
    var pose = window.AXTour && AXTour.pose ? AXTour.pose() : null, under = App.current;   /* v5.53 뒤로 오면 이 자리로(tourRetBack) */
    if (window.AXTour) AXTour.close();
    setTimeout(function () { if (typeof DET !== "undefined") DET.canon = Date.now(); GO[id](); TOUR_RET = { v: App.current, under: under, pose: pose }; TOUR_RET.id = id; trfSync(); }, 280);   /* 둘러보기 암전(0.24초)이 끝난 뒤 · 도착한 화면을 기억 · v5.57 어느 스탬프 블록에서 왔는지(id · 마침 판정) */
  }
};
/* v5.65 층 안내(floor_d) · 엘리베이터 층 단추에서 온다(App.go 로도 열림 · 뒤로 = 프로그램) · 17F = 시간표 흐름 카드 중 17F 것만 · 10F = 세션 A~E 줄(누르면 세션 상세) */
var FLOOR_GD = {
  17: { hdr: "17F 대강당", sub: "신청 없이 자유 참석 · 입장 · 끝 QR 출석" },
  10: { hdr: "10F 실습형 세션", sub: "사전 신청자 참여 · 5개 세션" }
};
function floorGuideHtml() {
  var f = PROG.floor, g = FLOOR_GD[f];
  if (!g) return '<div class="ax-stack">' + botHtml("층 안내를 찾을 수 없어요") + '<button type="button" class="ax-button ax-button-weak" onclick="App.tab(\'guide\')">프로그램 보기</button></div>';
  var body;
  if (f === 17) body = '<div class="axs-fl">' + progFlowHtml(17) + "</div>";
  else body = '<div class="axs-tt">' + SESSIONS.filter(function (s) { return s.fl === 10; }).map(function (s, i) {
    var tp = s.tm.split("~"), mi = !!sessMine(s.id);
    return progTTRow("f" + i, { t0: tp[0], t1: tp[1], tok: mi ? "mine" : "", cls: mi ? " my" : "", title: s.ttl + " · " + sessPlace(s).replace(/^10F\s*·?\s*/, ""), badge: mi ? '<span class="axs-chip ok">내 세션</span>' : "", sub: s.sub, go: "sessOpen('" + s.id + "')" });
  }).join("") + "</div>";
  return '<div class="ax-stack axs-flg"><p class="ax-description">' + esc(g.sub) + "</p>" + body + tourFloorBackHtml() + "</div>";   /* 층 이름은 헤더(FLOOR_GD hdr) · 판 문법(axs-bar)은 쓰지 않는다 */
}
/* 둘러보기 엘리베이터에서 온 층 안내 · 커피챗 상세 맨 아래 약한 버튼 · v5.67 없앰(사용자 261005 「둘러보기 복귀 버튼을 없애고 작은 플로팅 버튼(뒤로가기 아이콘) 밑에 3d로 돌아가기」) · 복귀 = 떠 있는 trf 하나 */
function tourFloorBackHtml() { return ""; }
/* v5.53 (사용자 261004 「3d에서 앱으로 갔다가 뒤로가기를 하면 3d로 돌아와야 하는데, 앱 메인 화면으로 돌아가」) 둘러보기 → 앱 화면 → 뒤로 = 둘러보기
   TOUR_RET = 바로 가기로 도착한 화면(v) · 그 밑에 있던 앱 화면(under) · 나가기 전 자리(pose)
   뒤로(헤더 ‹ · 휴대폰 뒤로 = 둘 다 App.back) 가 도착한 화면에서 나갈 때만 = 밑 화면으로 돌리고 둘러보기를 그 자리로 다시 연다 · 더 깊이 들어갔다면 원래 뒤로 단계를 다 거친 뒤 마지막에
   지움 = 아래 탭(App.tab) · 도착한 화면과 그 아래가 아닌 곳으로 이동 · 둘러보기를 그냥 열 때 · 둘러보기를 정상으로 닫고 홈에 온 경우에는 생기지 않는다 */
var TOUR_RET = null;
function tourRetBack() {
  trdHide();   /* v5.57 자동 복귀 띠 */
  var r = TOUR_RET; TOUR_RET = null;
  if (!r || !tourOn()) return false;
  delete App.from[App.current];
  if (r.under && r.under !== App.current) App.go(r.under, true);
  tourOpen({ restore: r.pose });
  return true;
}
/* v5.57 (사용자 261004 「1층 > 스탬프 > 1층 이런식으로 와야 될 것 같아 · 다른 활동들도 그렇게 설정해줘」) 둘러보기에서 출발한 활동은 마치면 둘러보기로 · 앱에서 시작한 활동은 지금처럼 앱에 머문다(출처 = TOUR_RET)
   마침(tourRetDone) = AX 퀴즈 판 완주(qzFinish) · 미니 게임 한 판 결과 화면(gsResultHtml) · 아이디어 한 줄 제출 뒤 커피챗 질문에 답함(ideaCchat · 묻지 않는 경우는 제출 순간 ideaPush)
     · AX PLAY = 내 QR 화면에 스태프 인증 스탬프가 들어온 순간(stampSync · awardStamp → tourRetStamp) · 17F 강연 · 계단 안내 = 안내 화면이라 마침 없음(뒤로 = 둘러보기 · v5.53 그대로)
   마친 뒤(done) = 그 활동의 어느 화면에서 뒤로 가도 둘러보기(App.back) · (옛 결과 화면 아래 복귀 버튼은 v5.67 에서 없앰 · 떠 있는 「3D로 돌아가기」 #trf 하나)
   그 활동의 스탬프를 이번에 새로 받았으면(got) = 스탬프 연출 · 보상 안내 팝업이 모두 닫힌 뒤 띠 챗봇이 한 번 더 인사(v5.80 · 옛 3초 자동 복귀 없앰 · 아래 v5.80 주석)
   이미 받은 스탬프(다시 푼 퀴즈 · 3종을 다 채우지 않은 게임 · 두 번째 아이디어) = 인사 없음 · 띠 · 뒤로 */
/* v5.80 (사용자 261006 「가만히 있으면 3초 있다가 그냥 돌아가버린다는거야? 이건 좀 너무 행동 강제 아닌가?」 → 「자동 복귀 없애기」)
   저절로 둘러보기로 돌아가는 일 없음(옛 v5.57 아래 띠 · v5.67 단추 둘레 원 · v5.74 띠 안 3초 차오름 · 신청 완료 화면 3초 모두 없앰) · 돌아가기 = 띠를 누르거나 뒤로(App.back)
   대신 시선 = 스탬프를 새로 받으면(got) 연출 · 팝업 · 시트가 모두 닫힌 뒤(trdBusy · 0.35초마다 살핌) 띠 챗봇이 처음 나타날 때와 같은 인사(hi · 약 1.8초 · 통통 3번 · 전파 펄스 · 눈웃음)를 한 번 더 · 띠 글 그대로
   화면을 옮기면 기다림을 접는다(trdHide · 라우터) · 움직임 줄이기 = 정지 그림(인사 없음) */
var TRD = { t: 0 };
function tourRetLive() { var r = TOUR_RET; return !!(r && !r.away && tourOn() && (App.current === r.v || App.isAnc(r.v, App.current))); }   /* 출발한 활동 안(마침 · 인사 판단) */
function tourRetAny() { return !!(TOUR_RET && tourOn()); }   /* v5.73 둘러보기에서 나온 뒤 앱 어디서나(「3D로 돌아가기」 단추) */
function tourRetDone(got) {
  if (!tourRetLive()) return;
  TOUR_RET.done = true;
  if (got) { TOUR_RET.got = true; trdWait(); }
}
function tourRetStamp(id) { if (TOUR_RET && TOUR_RET.id === id && id !== "p5") tourRetDone(true); }   /* 아이디어는 커피챗 질문에 답한 뒤(ideaCchat) */
function tourRetGo() { trdHide(); if (!tourRetBack()) App.render(); }   /* 띠 누름 */
function trdBusy() {
  return !!(SPOP.cur || SPOP.q.length || el("spop") || el("lgx") || el("modal") || el("axsSheet") || NOTICE.cur || NOTICE.q.length || el("app").hidden || TOUR.busy || (window.AXTour && AXTour.isOpen()) || document.hidden);
}
function trdWait() {
  clearTimeout(TRD.t);
  TRD.t = setTimeout(function () {
    TRD.t = 0;
    if (!tourRetLive() || !TOUR_RET.got) return;
    if (trdBusy()) { trdWait(); return; }
    trfSync();
    var f = el("trf"); if (!f) { trdWait(); return; }   /* 띠가 숨은 때(게임 판 · 상세 시트) = 보일 때까지 */
    TOUR_RET.got = false; trfHi(f);
  }, 350);
}
/* v5.67 (사용자 261005 「3d로 돌아가기가 어떻게 해야 되는지 순간 프리징이 되는데」 · 「모든 메뉴가 위와 같은 버튼이 제일 하단에 있어서 대충 보는 사람은 이해 못할 것 같아 작은 플로팅 메뉴가 더 명확」 · 「둘러보기 복귀 버튼을 없애고 작은 플로팅 버튼(뒤로가기 아이콘) 밑에 3d로 돌아가기」)
   둘러보기에서 출발한 앱 화면(tourRetLive = 도착한 화면 · 그 아래 단계) = 오른쪽 아래 떠 있는 단추 하나(#trf · 주황 원 + 짙은 뒤로 화살표 · 밑에 작은 「3D로 돌아가기」) · 누르면 tourRetGo(들어가기 전 자리)
   자리 = 맨 위로(TOP · 아래 80px · 46px) 위 · 아래 고정 버튼(axs-fix) · 하단 메뉴가 더 높으면 그 위 · 앱 폭 오른쪽 끝(TOP 과 같은 세로줄)
   안 보임 = 출처가 둘러보기가 아닐 때(v5.73 = 3D로 돌아가거나 둘러보기를 새로 열 때 · 새로고침에만 지워진다 · 아래 탭 · 다른 화면으로 가도 남음 · 옛 v5.67 = 지움) · 둘러보기가 열려 있을 때 · 게임 판이 도는 동안(rtView · 결과 화면이 뜨면 보임)
   처음 나타날 때 한 번 톡 튀어 오름(움직임 줄이기 = 없음) */
/* v5.74 (사용자 261006 「저 위치 저 모양이 적절하고 일반적인 어플리케이션에서 활용하는 문법인지」 → 「하단 탭 위 얇은 띠(권장)」 · 캡처에서 오른쪽 아래 둥근 단추가 목록 셰브론을 가렸다)
   통화 앱 「통화로 돌아가기」 · 음악 앱 「지금 재생 중」 · 지도 「길안내로 돌아가기」와 같은 문법 = 하단 탭 바로 위 화면 폭 얇은 띠 하나(#trf.trf-band) · 띠 전체가 누름 영역 · 누르면 tourRetGo(들어가기 전 자리)
   띠 = 좌우 여백 page-inset · 높이 48 · 연주황 면(brandSoft) + 진한 주황 글(brandText · 화면 주 버튼 주황 면과 겨루지 않게) · 왼쪽 챗봇(A-4 원본 BOT_SVG 작게) · 「1층 둘러보기로 돌아가기」 · 오른쪽 셰브론
   자리 = 하단 메뉴(또는 아래 고정 버튼 axs-fix)가 더 높으면 그 위 8px · 본문 끝 = 띠 높이만큼 여백(body.trf-on #view::after · 내용 가림 0 · 옛 비키기 trfAvoid 없앰) · 맨 위로(TOP) 단추는 띠 위로(--trfb)
   안 보임 = 출처가 둘러보기가 아닐 때(v5.73 유지 범위 = 3D로 돌아가거나 둘러보기를 새로 열 때 · 새로고침에만 지워진다) · 둘러보기가 열려 있을 때 · 게임 판 · 퀴즈 푸는 중 · v5.74 읽기용 상세 시트(5-7b)가 열려 있는 동안(시트 닫기 = 목록 · 목록에서 띠로)
   처음 나타날 때 아래에서 한 번 올라옴(움직임 줄이기 = 없음) · (v5.80 3초 차오름 자동 복귀 없앰) */
var TRF_LBL = "행사 둘러보기로 돌아가기";   /* v5.79 (사용자 261006) 이름 통일 · 옛 「1층 둘러보기로 돌아가기」 */
/* v5.79 (사용자 261006 「복귀 띠 눈에 띄게」) 띠 왼쪽 챗봇 = 홈 둘러보기 카드 아이콘과 같은 부품(tourBotHtml 합성 · BOT_WAVE 전파 · TOUR_BOT_SM 눈웃음 · design.md A-4 승인 예외)
   둘러보기에서 나올 때마다 띠가 처음 나타나면 한 번(hi · 약 1.8초) = 통통 3번 · 전파 펄스 · 눈웃음 → 그 뒤 = 홈 카드와 같은 은은한 반복(3초 통통 3px · 9초에 깜빡임 2번 + 눈웃음 1번 · 전파 최대 0.7)
   다시 그려져도(시트 · 게임 동안 숨었다가) 같은 출발이면 인사는 다시 하지 않는다(TRF_HI) · 움직임 줄이기 = 정지 그림 + 전파 0.35
   v5.80 스탬프를 새로 받은 뒤 한 번 더 = trfHi(같은 hi 클래스를 떼었다 다시 붙여 처음부터) */
var TRF_HI = null;
function trfWant() {
  if (!tourRetAny() || el("app").hidden || TOUR.busy || (window.AXTour && AXTour.isOpen())) return false;   /* v5.73 tourRetLive(출발 화면 아래만) → tourRetAny(앱 어디서나) */
  if (rtView(App.current) && !document.querySelector("#view .gs-res-go")) return false;   /* 게임 판 중 = 조작 단추를 가리지 않게 · 결과 화면에서 보임 */
  if (App.current === "quiz_play" && typeof qzRun === "function" && qzRun()) return false;   /* 판 퀴즈 푸는 중 = 답 · 「다음 문제」 · 힌트 단추를 가리지 않게 · 결과 화면에서 보임 */
  if (typeof detShown === "function" && detShown()) return false;   /* v5.74 상세 시트 동안 숨김(시트 아래 고정 주 버튼과 겹치지 않게) */
  return true;
}
function trfSync() {
  var f = el("trf");
  if (!trfWant()) { if (f) f.parentNode.removeChild(f); document.body.classList.remove("trf-on"); return; }
  if (!f) {
    f = document.createElement("button"); f.type = "button"; f.id = "trf"; f.className = "trf-band " + (rgReduced() ? "rm" : "pop" + (TRF_HI !== TOUR_RET ? " hi" : ""));
    TRF_HI = TOUR_RET;
    f.setAttribute("aria-label", TRF_LBL + " · 있던 자리로");
    f.onclick = tourRetGo;
    f.innerHTML = '<span class="trf-i" aria-hidden="true">' + (typeof BOT_SVG === "string" ? BOT_SVG.replace("</svg>", BOT_WAVE + TOUR_BOT_SM + "</svg>") : "") + '</span><span class="trf-l" aria-hidden="true">' + TRF_LBL + '</span><span class="trf-v" aria-hidden="true">' + CHEV_SVG + '</span>';
    document.body.appendChild(f);
  }
  var nav = el("tabbar"), fx = document.querySelector("#view .axs-fix.ax-bottom"), base = 0;
  if (nav && nav.style.display !== "none" && nav.offsetHeight) { var nt = nav.getBoundingClientRect().top; [].forEach.call(nav.querySelectorAll("*"), function (x) { var r = x.getBoundingClientRect(); if (r.height && r.top < nt) nt = r.top; }); base = Math.max(base, Math.round(window.innerHeight - nt)); }   /* 하단 메뉴 가운데 QR 단추가 메뉴 위로 솟은 만큼까지 */
  if (fx && fx.offsetHeight) base = Math.max(base, fx.offsetHeight);
  var bt = base ? base + 8 : 8;
  if (f.style.bottom !== bt + "px") { f.style.bottom = bt + "px"; document.body.style.setProperty("--trfb", bt + "px"); }
  document.body.classList.add("trf-on");   /* 본문 끝 여백 · 맨 위로 단추를 띠 위로(CSS) */
}
setInterval(function () { if (typeof App !== "undefined" && App.current) trfSync(); }, 600);   /* 게임 결과 · 둘러보기 닫힘처럼 다시 그리기 없이 바뀌는 때 */
function trfHi(f) {   /* v5.80 띠 챗봇 인사 한 번 더 · 움직임 줄이기 = 정지 그림 */
  if (rgReduced() || f.classList.contains("rm")) return;
  f.classList.remove("hi"); void f.offsetWidth; f.classList.add("hi");
}
function trdHide() {   /* 인사 기다림 접기(화면을 옮길 때 · 띠 누름 · 둘러보기로 돌아갈 때) */
  if (!TRD) return;   /* 불러오는 중(App.go 가 먼저 불릴 때) */
  clearTimeout(TRD.t); TRD.t = 0;
}

