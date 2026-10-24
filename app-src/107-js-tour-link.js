/* ═══ v5.11 (261003 사용자 승인 · 「디자인 시안/가상 1층/계획.md」) 1층 둘러보기 · 본체(3D 모형 · 평면 지도 · 목록 · 판 보기)는 assets/tour/ 에 있고 처음 열 때만 받는다(안 여는 사람은 0바이트)
   여기 있는 것 = 불러오기(tourOpen) · 연결(TOUR_HOST · 구역 글은 FLOOR1 · 상태는 zoneLive · 혼잡은 crowdCell) · 입구 3곳(홈 나의 일정 아래 · 상시 운영 1F 맨 위 · 구역 상세) + 판 퀴즈 힌트 · 뒤로 가기 한 줄(popstate)
   위치(벽 · 방향 · 판 순서)는 둘러보기 화면 안에서만 보인다(261001 「앱은 동선 · 위치를 다루지 않는다」의 예외 · 사용자 261003 · design.md 5-21) · 이 파일의 다른 화면은 그대로 위치를 말하지 않는다 */
/* v5.37 (사용자 261003 「이것들이 수정되면 정식 앱에 올리자」) 둘러보기 v3 = 시험 페이지와 같은 공용 모듈(tour3.js · tour3.css · 캐릭터 걷기 · 40도 시점 · 왼손 패드 · 오른손 십자 · 작은 지도 · 스태프 챗봇 · 판 보기 · 돋보기 2개 · 움직임 줄이기 · 입장 암전)
   같은 약속 AXTour.open/close/back/isOpen · 옛 v2(tour.js · tour.css · 자동 둘러보기 · 평면 지도 · 구역 시트)로 되돌리려면 아래 목록의 tour3 두 개를 tour.css · tour.js 로 바꾸면 된다(파일은 그대로 둠) */
/* v5.38 (사용자 261003) 둘러보기 손질 · 캐릭터 겹침(스태프 원 충돌) · 늘 카메라 쪽을 봄 · 조그 패드 · 안내데스크 깜빡임(겹친 면) · 정문 회전문 또렷하게 · 로비 음악(Web Audio 합성 · 「음악 없이」 · 위쪽 스피커 버튼) · 파일 이름 그대로 · 캐시 깨기 ver v538 */
var TOUR = { ver: "v782", busy: false, files: ["tour3.css", "three.min.js", "GLTFLoader.js", "meshopt_decoder.js", "tour-data.js", "tour-scene.js", "tour3.js"] };   /* v5.19 GLB 모형(구운 빛) · 모형 lobby.glb(약 0.7MB)는 tour.js 가 3D 를 그릴 때 받는다 */   /* 261021 v782 = 라운지 데스크 치움(tour3.js refit1F) 캐시 깨기 */   /* 261018 v781 = 미팅룸 탁자 흰색(라이트맵 자리) · 엘리베이터 권유 말풍선 대신 「다른 층 이동하기」 강조 */   /* 261016 v742 = 라운지 스태프 자리(흰 탁자 오른쪽 · 내 캐릭터 앞) · 다른 층 이동하기 자동 걷기 = 뒤에서 따라가기 · 쓰지 않는 STAIR 상수 걷음 캐시 깨기 */   /* 261016 v738 = 부스 최종 시안 반영(룰렛 판 둘째 줄 · 바닥 매트 · 판 틀 색 · TV 받침) 캐시 깨기 */   /* 261016 v737 = 룰렛 순서(행운을 빌어요 › 사라짐 › 당첨! › 카드) 캐시 깨기 */   /* 261016 v735 = 받침대 TV 5대 아랫단 0.62m → 1.07m(AX PLAY 책상 윗면 1.02m 보다 5cm 위 · 5대 같은 높이 · 사용자 결정) 캐시 깨기 */   /* 261015 v727 = 받침대 TV 5대 55인치 · 아랫단 0.62m 로 낮춤(뒤 판 글씨 가림 해소) · AX VISION TV 잘린 왼쪽 되살림 · 층별 안내 엑스배너(판 42) 흉상 서쪽으로(lowerTvs · REFIT.XB) 캐시 깨기 */   /* 261015 v726 = 로비 화분 실물 영상처럼(buildPlant · 흰 접시 · 시멘트 화분 · 호접란 · 팜파스) 캐시 깨기 */   /* 261012 v699 = 기둥 포스터 부착안(시안 A ~ E · tour-data colFaces · d/p46s.webp) 캐시 깨기 */
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
  if (!S.get("tour_seen", false)) S.put("tour_seen", true);   /* v5.83 처음 열면 홈 카드가 원래 자리로(tourHeroOn) · 기기 기준 */
  var keep = o.hint && tourRetLive() ? TOUR_RET : null;   /* v5.57 둘러보기에서 출발한 AX 퀴즈의 힌트 「모형에서 보기」는 출처를 지우지 않는다(퀴즈를 마치면 그대로 1층으로) */
  if (!o.restore) TOUR_RET = null;   /* v5.53 그냥 열면 돌아가기 기억 지움 */
  if (keep) TOUR_RET = keep;
  if (window.AXTour) { tpcKeys(); AXTour.open(o); tpcShell(); return; }
  if (TOUR.busy) return;
  TOUR.busy = true; tpcShell();
  var fl = TOUR.files.filter(function (f) { return !(f === "three.min.js" && window.THREE); }), left = fl.length, bad = false, q = "?v=" + TOUR.ver;   /* v6.83 계단 동행이 three.js 를 먼저 받았으면 다시 실행하지 않는다(같은 파일 · 두 번 실행 경고) */
  /* v5.64 (사용자 261005 「가운데랑 하단에 두 개 떠」) 앱 하단 「여는 중」 알림 삭제 · 안내는 둘러보기 자체 불러오기 화면 하나 */
  fl.forEach(function (f) {
    var n = /\.css$/.test(f) ? document.createElement("link") : document.createElement("script");
    if (n.tagName === "LINK") { n.rel = "stylesheet"; n.href = "assets/tour/" + f + q; } else { n.src = "assets/tour/" + f + q; n.async = false; }   /* 스크립트는 붙인 순서대로 실행 */
    n.onload = function () { if (--left === 0 && !bad) { TOUR.busy = false; if (window.AXTour) { tpcKeys(); AXTour.open(o); } tpcShell(); } };
    n.onerror = function () { if (bad) return; bad = true; TOUR.busy = false; toast("둘러보기를 열지 못했어요 · 연결을 확인해 주세요"); };
    document.head.appendChild(n);
  });
}
/* 261007 (사용자 「노트북에서 둘러보기 = 창 전체로」) PC 휴대폰 틀(000-head) 안이면 둘러보기를 여는 순간 틀에 알려 창 전체로(틀도 0.25초마다 살펴 닫히면 휴대폰 틀로) · 틀 밖 = 할 일 없음 */
function tpcShell() { try { if (window.parent !== window && window.parent.__axfFit) window.parent.__axfFit(); } catch (e) {} }
/* 마우스 기기(PC)에서 둘러보기를 넓게(t3-wide) · 둘러보기 본체(tour3.css)는 폭 520 가운데 기둥이라 PC 넓은 창에서만 그 상한을 걷는다(아래 「이전 · 다음 구역」 단추 줄 · 판 보기 · 설정 시트는 520 그대로 · 3D 그림판은 무대 크기를 따라간다) · 휴대폰 · 터치 태블릿 = 그대로
   PC 키 안내 = 무대 왼쪽 위 작은 한 줄(tour3.js 키 맵 그대로 · W A S D 걷기 · ← → 돌기 · 화면 누르기 = 그곳으로) · 6초 뒤 옅게 · 누름 통과 · 둘러보기가 닫히면 숨김 · 261016 v7.41 「다른 층 이동하기」(.flr) = 키 안내 띠 아래(top 52px) */
var TPC_KEYS = "W A S D 걷기 · ← → 돌기 · Space 점프 · 마우스로 눌러서 가기";   /* 261007 둘러보기 조작 A = 화면 단추가 점프 하나 · 점프 키(Space) 더함 */
function tpcFine() { try { return window.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e) { return false; } }
function tpcWideNow(open) { return !!open && tpcFine() && (window.innerWidth >= 700 || !!(window.parent !== window && window.parent.__axfFit)); }
function tpcKeys() {
  if (!tpcFine()) return;
  var k = el("tpcKeys"), H = document.documentElement;
  if (!k) {
    var cs = document.createElement("style"); cs.id = "tpcCss";
    cs.textContent = "html.t3-wide #axTour3 .t3app{max-width:none;box-shadow:none}html.t3-wide #axTour3 .bar>*{max-width:520px;margin-left:auto;margin-right:auto}" +
      "html.t3-wide #axTour3 .flr{top:52px}#tpcKeys{position:fixed;left:12px;top:calc(68px + env(safe-area-inset-top, 0px));z-index:9001;pointer-events:none;padding:5px 12px;border-radius:999px;background:rgba(25,31,40,.72);color:#FFFFFF;font-size:13px;line-height:18px;font-weight:600;white-space:nowrap;transition:opacity .6s}";
    document.head.appendChild(cs);
    k = document.createElement("div"); k.id = "tpcKeys"; k.setAttribute("aria-hidden", "true"); k.textContent = TPC_KEYS; k.hidden = true;
    document.body.appendChild(k);
    setInterval(function () {
      var o = !!(window.AXTour && AXTour.isOpen()), w = tpcWideNow(o) && window.innerWidth >= 700;
      if (k.hidden === w) k.hidden = !w;
      if (o && H.classList.contains("t3-wide") !== tpcWideNow(o)) { H.classList.toggle("t3-wide", tpcWideNow(o)); try { window.dispatchEvent(new Event("resize")); } catch (e) {} }
    }, 300);
  }
  H.classList.toggle("t3-wide", tpcWideNow(true));
  k.style.opacity = "1"; clearTimeout(k._t); k._t = setTimeout(function () { k.style.opacity = ".45"; }, 6000);
}
/* 입구 · 상시 운영 1F 맨 위 카드 · 홈 나의 일정 아래 한 줄(tourHomeHtml) · (v5.83 최초 로그인 초대장 삭제) · 이름은 세 곳 모두 「행사장 둘러보기」(사용자 261004)
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
function tourHeroHtml() {   /* 261015 (사용자 확정) 홈 맨 위 고정 순서 = 옷 사이즈 카드 > 광고판 > 행사 둘러보기 · 시기 · 계정 · tour_seen 과 무관하게 광고판 바로 아래 · 옛 tourHomeHtml(나의 일정 아래) · tourHeroOn 은 없앴다 */
  return tourOn() ? tourLineHtml() : "";
}
/* v5.83 (사용자 261006 「최초 진입 가볍게」 결정 3 · 옛 v5.46 사용자 261004 요청 번복) 둘러보기 초대 시트(tourinv · 봉투 · 「나중에 하기」) 삭제
   입구 = 홈 「행사 둘러보기」 카드 · 둘러보기를 처음 열기 전(기기 키 tour_seen 없음)에는 당일에도 광고판 바로 아래(tourHeroHtml) · 처음 열면 원래 자리(당일 = 나의 일정 아래)
   그림 assets/tour/inv/invite.jpg · CSS .axs-inv(봉투) 파일은 남긴다(참조만 끊음) · 옛 기기 키 tour_inv 는 쓰지 않는다 · 되살리기 = hi_ax git v5.82 */
/* 다른 질문(알림 첫 질문 등)은 둘러보기를 여는 중 · 열려 있는 동안 미룬다 */
function tourInvHold() { return TOUR.busy || !!(window.AXTour && AXTour.isOpen()); }
var TOUR_HOST = {
  sign: function (nm, big) { return zoneSign(nm, big ? "lg" : ""); },
  zone: function (id) {
    if (id === "cafe") { var cz = FLOOR18[0]; return { kor: cz.kor, fact: "18F · " + zoneLive(cz).fact, todo: ["아이디어 한 줄을 내면 신청할 수 있어요"] }; }   /* v5.65 18F 구역 표(FLOOR18) 한 줄 · 상태 */
    var z = zoneById(id); if (!z) return null;
    return { kor: z.kor, fact: zoneLive(z).fact, todo: z.todo };
  },
  acts: function (id) {
    var go = function (v) { return function () { App.go(v); }; };
    if (id === "vision") return [{ lbl: "AX 퀴즈 풀기", run: go("quiz") }];   /* v7.64 퀴즈에서 AX in Action 문항을 걷음 */
    if (id === "lab") return ideaGateOff() ? [] : [{ lbl: "아이디어 한 줄 쓰기", run: go("ideas") }];   /* v5.90 사전 오픈 OFF · 행사 전 = 숨김 */
    if (id === "play") return [{ lbl: "체험 안내 보기", run: go("booth") }];
    if (id === "lounge") { var L = zoneLive(zoneById("lounge")); return [{ lbl: L.btn ? L.btn[0] : "AX 라운지 안내", run: function () { if (L.btn) progOpen("dap"); else zoneOpen("lounge"); } }]; }   /* v7.39 (사용자 261016 계획서 3-3) 사전 신청자 = 「내 상담」 · 그 밖 = 「AX 라운지 안내」 */
    if (id === "event") return [{ lbl: "1F 타자왕 순위", run: typeSiteRankGo }];   /* v7.04 (사용자 261012 「경품 보기가 아직 살아 있어 헷갈린다」) 룰렛 = 둘러보기 「룰렛 돌리기」 하나 · 옛 「룰렛 경품 보기」 삭제 */
    if (id === "cafe") return [{ lbl: S.get("cchat", null) || S.get("cchat_att", false) ? "내 커피챗 보기" : "AX 커피챗 안내", run: cchatOpen }].concat(ideaGateOff() ? [] : [{ lbl: "아이디어 한 줄 쓰기", run: go("ideas") }]);   /* v5.65 신청 전 = 구역 상세(zone_d cchat) */
    return [];
  },
  crowd: function () { return null; },   /* 261008 로비 · 엘리베이터 칸 삭제 · 둘러보기 구역 시트에 혼잡 줄 없음(crowdCell 은 남김) */
  crowdGo: function () { App.tab("home"); setTimeout(function () { var c = document.querySelector(".cstrip2"); if (c) AXM.scrollTo(c, { block: "center" }); }, 120); },   /* 261009 부드럽게 + 도착 떠오름(동작 모션 통일) */
  /* v5.49 (사용자 261004) 1층 둘러보기 스탬프 블록 · 이름 · 받는 법 · 버튼 문구 = 스탬프 표(STAMPS) 그대로 · got = 이미 받음 · stampGo = 둘러보기를 닫고 그 활동 화면으로 */
  /* v5.64 (사용자 261005 「계단이용 스탬프를 점프하면 · 권장 문구」) 계단 블록 카드 설명 줄 = 사용자 문구 그대로(스탬프 탭 설명은 그대로) */
  stamp: function (id) {
    var s = STAMPS.filter(function (x) { return x.id === id; })[0] || (id === "qz" || id === "p4" ? STAMPS_V2.filter(function (x) { return x.id === id; })[0] : null);
    if (!s) return null;
    return { title: s.title, desc: id === "st" ? TOUR_ST_DESC : s.desc, cta: s.cta || "바로 가기", got: S.get("stamps", []).indexOf(id) >= 0 };   /* v5.96 (사용자 261006 「프로그램 참여 = 17F 오후 AWS · MS 강연 입장 1 + 끝 1」) 프로그램 참여 블록 = 스탬프 표 그대로 「17F 강연 보기」 · 옛 v5.57 「AX 라운지 신청」(상담 신청으로 연결)은 폐기 */
  },
  /* 261008 (사용자 「1층을 재구성해줘」 · 1층 부스 기획안 수정본) AX 라운지 = 판 · 간판 없이 데스크만 · 둘러보기 「AX 라운지 자세히 보기」 · 데스크 · 스태프 = 그 구역 상세(zone_d) · 돌아오기 = floorGo 와 같다(뒤로 · 떠 있는 「3D로 돌아가기」) */
  zoneGo: function (id) {
    if (!zoneById(id)) return;
    var pose = window.AXTour && AXTour.pose ? AXTour.pose() : null, under = App.current;
    if (window.AXTour) AXTour.close();
    setTimeout(function () { if (typeof DET !== "undefined") DET.canon = Date.now(); TOUR_RET = { v: "zone_d", under: under, pose: pose }; zoneOpen(id); trfSync(); }, 280);
  },
  /* v5.65 (사용자 261005 「각 엘리베이터 이동시에도 각 안내장표로 갈 수 있을 것 같아 · 연결을 시켜보자」) 엘리베이터 층 단추 → 아이리스로 닫힌 뒤 그 층 앱 안내
   17 = 층 안내(floor_d · 17F 대강당 강연 흐름) · 10 = 층 안내(floor_d · 실습형 세션 A~E) · 18 = AX 커피챗 구역 상세(zone_d cchat)
   돌아오기 = 뒤로(헤더 · 휴대폰) · 떠 있는 「3D로 돌아가기」(v5.67 trf) = 엘리베이터 안(pose = { elev }) · 안내 화면이라 마침 · 자동 복귀 띠 없음(TOUR_RET.id 없음) */
  floorGo: function (fl) {
    var pose = window.AXTour && AXTour.pose ? AXTour.pose() : null, under = App.current;
    if (window.AXTour) AXTour.close();
    setTimeout(function () { if (typeof DET !== "undefined") DET.canon = Date.now(); TOUR_RET = { v: fl === 18 ? "zone_d" : "floor_d", under: under, pose: pose, fl: fl }; if (fl === 18) zoneOpen("cchat"); else { PROG.floor = fl; App.go("floor_d"); } trfSync(); }, 280);   /* 그리기 전에 기억(「둘러보기로 돌아가기」 단추가 첫 그림에 나온다) */
  },
  /* v6.91 (사용자 261011 「경품 보기를 누르면 이미 만들어 둔 상품 탭의 경품 보기로 날아가서 보여 주자」) 둘러보기 「경품 보기」(룰렛 돋보기 · 룰렛 돌리기 아래 알약 · 룰렛 판) = 둘러보기를 닫고 상품 탭 그 구역(prizeGo)
   돌아오기 = stampGo 와 같다(뒤로 · 떠 있는 「3D로 돌아가기」 = 나가기 전 자리) */
  /* v6.95 (사용자 261011 「권장대로」) 둘러보기 룰렛 경품 카드 자료 = PRIZES.roulette 한 곳(사본 없음) · 수량 글 = 상품 탭과 같은 형식(qt 또는 「60개」) · 아래 안내 줄 = rouletteNextLine() 한 곳 */
  roulette: function () {
    var g = PRIZES.roulette;
    return { list: g.list.map(function (p) { return { rk: p.rk, nm: p.nm, img: [p.img, p.img2].filter(Boolean).map(function (n) { return PRIZE_DIR + n + ".webp"; }) }; }), next: rouletteNextLine() };
  },
  prizeGo: function (k) {
    var pose = window.AXTour && AXTour.pose ? AXTour.pose() : null, under = App.current;
    if (window.AXTour) AXTour.close();
    setTimeout(function () { if (typeof DET !== "undefined") DET.canon = Date.now(); prizeGo(k || "roulette"); TOUR_RET = { v: App.current, under: under, pose: pose }; trfSync(); }, 280);
  },
  stampGo: function (id) {
    var GO = { qz: function () { App.go("quiz"); }, p4: function () { App.go("games"); }, p2: function () { qrPanelOpen("mine"); }, p5: function () { App.go("ideas"); }, p3: function () { progGoFl(17); }, st: function () { stairOpen(); } };
    if (!GO[id]) return;
    var pose = window.AXTour && AXTour.pose ? AXTour.pose() : null, under = App.current;   /* v5.53 뒤로 오면 이 자리로(tourRetBack) */
    if (window.AXTour) AXTour.close();
    setTimeout(function () { if (typeof DET !== "undefined") DET.canon = Date.now(); GO[id](); TOUR_RET = { v: App.current, under: under, pose: pose }; TOUR_RET.id = id; trfSync(); }, 280);   /* 둘러보기 암전(0.24초)이 끝난 뒤 · 도착한 화면을 기억 · v5.57 어느 스탬프 블록에서 왔는지(id · 마침 판정) */
  }
};
/* v5.65 층 안내(floor_d) · 엘리베이터 층 단추에서 온다(App.go 로도 열림 · 뒤로 = 프로그램) · 17F = 시간표 흐름 카드 중 17F 것만 · 10F = 세션 A~E 줄(누르면 세션 상세) */
var FLOOR_GD = {
  17: { hdr: "17F 대강당", sub: "신청 없이 자유 참석" },   /* v5.96 출석 QR 은 오후 AWS · MS 상세에서만 */
  10: { hdr: "10F 실습형 세션", sub: "사전 신청자 참여 · 5개 세션" }
};
/* v7.82 (사용자 261018) 10F 목록 카드 제목 = 「A 세션」 알약(옅은 회색 면 · 제목보다 작은 글자) + 장소 · 장소는 「 · 」 덩어리 단위로만 꺾임(첫 덩어리 그대로 · 다음부터 「· 」로 시작) · 옛 v7.78 「A · 컨퍼런스룸」 한 글자 묶음은 알약으로 대체 */
function floorSessTtl(s) {
  var p = (s.ttl.replace(/^세션\s*/, "") + " · " + sessPlace(s).replace(/^10F\s*·?\s*/, "")).split(" · "), out = ['<span class="axs-sesspill">' + esc(p[0]) + " 세션</span>"], i = 1;
  for (; i < p.length; i++) out.push('<span class="axs-nwr">' + esc((i > 1 ? "· " : "") + p[i]) + "</span>");
  return out.join(" ");
}
function floorGuideHtml() {
  var f = PROG.floor, g = FLOOR_GD[f];
  if (!g) return '<div class="ax-stack">' + botHtml("층 안내를 찾을 수 없어요") + '<button type="button" class="ax-button ax-button-weak" onclick="App.tab(\'guide\')">프로그램 보기</button></div>';
  var body;
  if (f === 17) body = '<div class="axs-fl">' + progFlowHtml(17) + "</div>";
  else body = '<div class="axs-tt">' + SESSIONS.filter(function (s) { return s.fl === 10; }).map(function (s, i) {
    var tp = s.tm.split("~"), mi = !!sessMine(s.id);
    return progTTRow("f" + i, { t0: tp[0], t1: tp[1], tok: mi ? "mine" : "", cls: mi ? " my" : "", titleHtml: floorSessTtl(s), badge: mi ? '<span class="axs-chip ok">내 세션</span>' : "", sub: s.sub, go: "sessOpen('" + s.id + "')" });
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
function tourRetStamp(id) { if (TOUR_RET && TOUR_RET.id === id && id !== "p5") tourRetDone(true); }   /* 아이디어는 제출 때(ideaPush · v7.39 커피챗 질문 없음) */
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
/* v5.96 (사용자 261006 밤 「글자가 웨이브 물결 치는(왼 → 우) 효과 · 폰트 사이즈를 조금 더」) 글자마다 span(--i = 순서) · 왼쪽부터 60ms 씩 늦게 3px 떠올랐다 내려옴 · 3초 한 바퀴(물결 약 1.2초 + 쉼 약 1.8초) · 읽기 = 버튼 aria-label 한 덩어리(글 칸은 aria-hidden) · 움직임 줄이기 = 정지 */
function trfWaveHtml(t) { return String(t).split("").map(function (c, i) { return '<span class="w" style="--i:' + i + '">' + (c === " " ? "&nbsp;" : esc(c)) + "</span>"; }).join(""); }
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
    /* v5.84 (사용자 261006 「챗봇이 거기서 왔다 갔다 하면 눈이 갈 것 같아」) 글 = 띠 가운데(trf-m · 띠와 같은 면) · 챗봇 = 띠 안을 좌우로 걷는다(trf-trk · trf-run · 글 뒤로 지나감 · 글은 늘 위) */
    f.innerHTML = '<span class="trf-trk" aria-hidden="true"><span class="trf-run"><span class="trf-i"><span class="trf-hop">' + (typeof BOT_SVG === "string" ? BOT_SVG.replace("</svg>", BOT_WAVE + TOUR_BOT_SM + "</svg>") : "") + '</span></span></span></span>' +
      '<span class="trf-m" aria-hidden="true"><span class="trf-l">' + trfWaveHtml(TRF_LBL) + '</span><span class="trf-v" style="--i:' + TRF_LBL.length + '">' + CHEV_SVG + '</span></span>';   /* v5.96 글자 물결(셰브론 = 마지막 글자) */
    document.body.appendChild(f);
    if (f.classList.contains("hi")) trfHold(f);
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
  f.classList.remove("hi"); void f.offsetWidth; f.classList.add("hi"); trfHold(f);
}
/* v5.84 인사(약 1.8초) 동안 걷기를 멈추고 그 자리에서 · 끝나면 이어 걷는다 */
function trfHold(f) {
  f.classList.add("halt"); clearTimeout(f._hold); f._hold = setTimeout(function () { f.classList.remove("halt"); }, 1900);
}
/* v5.84 화면이 숨으면(다른 앱 · 탭) 띠 챗봇 걷기를 멈춘다 */
document.addEventListener("visibilitychange", function () { document.body.classList.toggle("trf-sleep", document.hidden); });
function trdHide() {   /* 인사 기다림 접기(화면을 옮길 때 · 띠 누름 · 둘러보기로 돌아갈 때) */
  if (!TRD) return;   /* 불러오는 중(App.go 가 먼저 불릴 때) */
  clearTimeout(TRD.t); TRD.t = 0;
}
/* 261007 (사용자 「Admin 페이지에 모형 둘러보기 로그를 남겨 줘 · 사람마다 최종 로그인 옆에」) 행사 둘러보기 접속 기록 · 서버 tour_log(열 때 1번 · 닫을 때 1번 · 콘솔 계정 목록 · 한 사람 관리)
   3D · 2D 대체 모두 AXTour.isOpen() 하나로 본다(1초마다 · 가려진 동안은 보지 않음 · tour3.js 는 고치지 않음) · 닫을 때 머문 초 · 들른 구역 수(__tour3.api.visit · 없으면 0)
   같은 방문 = 닫고 TLOG.GAP(10분) 안에 다시 열면 보내지 않는다(서버도 같은 규칙 · 층 안내 · 스탬프로 갔다 돌아오기 포함) · 로그인 전 · 데모 · 오프라인 = 버림(다시 보내지 않음)
   열기를 못 보낸 방문은 닫기도 보내지 않는다(지난 방문 칸을 덮지 않게) · 화면이 가려지면(앱 전환 · 탭 닫기) 닫기를 sendBeacon 으로 · 실패해도 둘러보기는 모른다 */
var TLOG = { on: 0, ok: 0, t0: 0, end: 0, z: 0, GAP: 600000 };
function tlogEmp() { var u = S.get("user", {}) || {}; return u.empId ? String(u.empId) : ""; }
function tlogCan() { return !!(GAS_URL && BE.on && tlogEmp() && navigator.onLine !== false && !visitSkip()); }
function tlogZ() { try { var g = window.__tour3, v = g && g.api && g.api.visit ? g.api.visit() : null; return v && v.seen ? v.seen.length : 0; } catch (e) { return 0; } }
function tlogSend(ev, beacon) {
  try {
    var p = { action: "tour_log", emp: tlogEmp(), ev: ev };
    if (ev === "close") { p.sec = Math.max(0, Math.round((Date.now() - TLOG.t0) / 1000)); p.z = TLOG.z; }
    if (beacon && navigator.sendBeacon) {
      var ses = sesParam(p), b = new URLSearchParams();
      if (ses) p.ses = ses;
      for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) b.append(k, p[k]);
      if (typeof APP_VER === "string") b.append("av", APP_VER);   /* v7.22 서버 tail 한 줄(AXREQ)에 앱 버전 */
      if (navigator.sendBeacon(GAS_URL, b)) return;
      delete p.ses;
    }
    beCall(p, function () {}, function () {});
  } catch (e) {}
}
function tlogOpen() {
  TLOG.on = 1;
  if (TLOG.end && Date.now() - TLOG.end < TLOG.GAP) return;   /* 같은 방문 · 보내지 않음 */
  TLOG.t0 = Date.now(); TLOG.z = 0; TLOG.ok = tlogCan() ? 1 : 0;
  if (TLOG.ok) tlogSend("open");
}
function tlogClose(beacon) {
  if (!TLOG.on) return;
  TLOG.on = 0; TLOG.end = Date.now(); TLOG.z = Math.max(TLOG.z, tlogZ());
  if (TLOG.ok && tlogCan()) tlogSend("close", beacon);
}
function tlogTick() {
  if (document.hidden) return;
  var o = !!(window.AXTour && AXTour.isOpen());
  if (o) TLOG.z = Math.max(TLOG.z, tlogZ());
  if (o && !TLOG.on) tlogOpen(); else if (!o && TLOG.on) tlogClose(false);
}
setInterval(tlogTick, 1000);
document.addEventListener("visibilitychange", function () { if (document.hidden) tlogClose(true); });
window.addEventListener("pagehide", function () { tlogClose(true); });

/* ═══ v7.05 AI 활용 현장 인터뷰(사용자 261013) · 프로그램 탭 맨 아래 카드(시간표 · 상시 운영 · 신청하기 세 칸 모두 · 모든 직원) ═══
   카드 = 신청하기 카드(axs-apc)와 같은 모양 · 제목 → 한 줄 → 포스터 썸네일 → 주 버튼 [영상 보기]
   [영상 보기] → 소리 확인 창(#modal · 기준 모션 · 게임 「효과음을 켤까요?」와 같은 부품) → 큰 화면 가로 재생(#ivPlayer)
   가로 방식 · 안드로이드 · 크롬 = 전체 화면(#ivPlayer) + screen.orientation.lock("landscape")
              · 아이폰 사파리 = 요소 전체 화면이 없다 · video 에 playsinline 을 달지 않아 재생과 함께 기본 전체 화면(webkitEnterFullscreen · 기기를 돌리면 가로)
              · 대체(전체 화면 · 가로 고정 실패 · PC 창) = 화면 전체 검정 판 · 세로 화면이면 무대를 90도 돌려 꽉 차게(CSS orientation: portrait) · 가로가 되면 돌리지 않는다
   닫기 = 오른쪽 위 큰 닫기 단추 · 기기 뒤로(라우터 popstate) · Esc · 전체 화면에서 나옴 · 아이폰 기본 플레이어 닫음 → 세로 원래 화면 · 스크롤 자리 그대로
   소리 끄고 보기 = muted 재생 + 왼쪽 위 「소리 켜기」 단추 하나(누르면 소리 켜고 사라짐) · 효과음 설정(game_sound · site_sound)과는 별개 */
/* 영상 주소 한 곳
   · 실제 인터뷰 영상 파일 = assets/interview/ 에 넣고 src · poster 를 바꾼다(6~8분이면 loop: false)
   · 유튜브 등 외부 주소 = 아래 page 한 줄을 page: "https://hiphopinos-web.github.io/hi_ax/interview/" 로 바꾼다
     → [영상 보기]가 확인 창 없이 그 고정 주소를 새 창으로 연다(외부 영상 주소는 웹배포용/interview/index.html 의 VIDEO_URL 한 줄 · 여기서는 poster 만 썸네일로 쓴다) */
var IV_VIDEO = { src: "assets/interview/sample.mp4", poster: "assets/interview/sample.webp", loop: true, page: "" };
var IV_PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4l-8.3-5.2A.8.8 0 0 0 9 6.8z" fill="currentColor"/></svg>';
/* v8.67 (사용자 결정 261024) 영상 칸 = 홈 「지금 현장」 바로 아래(vidHomeHtml · 홈 섹션 제목 .sect 왼쪽 막대 · 접기 없이 줄이 바로 보임) · 프로그램 탭 1F 칸 「영상 보기」 접기(v7.67 progIvHtml)는 걷었다
   날짜 고정 폐기(v8.20 vidPre 10/26 전 칸 숨김 · v8.63 IV_AT 13:30 자동 공개) · 영상마다 콘솔 스위치(서버 설정 영상_공개 · sync my.vid { iv, hq, hh } = 1 | 0 → S "vid_sw")
   열린 영상 = 누르면 재생(ivAsk · 인터뷰는 유튜브 새 창) · 닫힌 영상 = 회색 「준비 중」 줄(누를 수 없음) · 셋 다 닫힘 = 칸째 없음 · 옛 서버(필드 없음) · 첫 열기 = 셋 다 닫힘
   영상 표 VIDS 한 곳(id = 서버 스위치 이름 · 제목 · 한 줄 · 길이 · 영상 v = IV_VIDEO 와 같은 모양 src · poster · loop · page) · 재생은 그대로(ivAsk 소리 확인 창 → ivPlay 전체 화면 · page 면 새 창) */
/* v8.70 (사용자 261024 「영상이 미리 노출되면 안 된다」) 현장 인터뷰 유튜브 주소는 앱에 두지 않는다 · 서버가 열린 영상만 sync my.vidu { iv: 주소 } → S "vid_u"(사람 키)
   주소가 없으면(닫힘 · 옛 서버 · 로그아웃) 줄은 「준비 중」 · 테스트 사번 미리 보기도 서버가 맞는 세션 토큰에만 주소를 줄 때만 열린다 */
var VIDS = [
  { id: "iv", t: "AI 활용 현장 인터뷰", s: "현장 인터뷰", len: "", v: { src: "", poster: "", loop: false, page: "" } },   /* 유튜브 새 창(주소 = 서버 vidUrl) · 인쇄 QR 페이지 interview/ 도 같은 스위치(vid_pub) */
  { id: "hq", t: "HiDI Q", s: "AX PLAY", len: "1:35", v: { src: "assets/vid/hidiq_v1.mp4", poster: "assets/vid/hidiq_v1.webp", loop: false, page: "" } },   /* v8.66 (사용자 261024) 원본 그대로(1080p · faststart) github.io 정적 파일 · 앱 안 플레이어(ivPlay · 누른 뒤에만 받음) · 바꿀 때는 _v2 새 이름 */
  { id: "hh", t: "Hi-Helper", s: "AX PLAY", len: "1:54", v: { src: "assets/vid/hihelper_v1.mp4", poster: "assets/vid/hihelper_v1.webp", loop: false, page: "" } }
];
var VFOLD = { open: false };   /* v8.69 (사용자 261024) 홈 영상 칸 접기 기억 · 접힌 채 시작 · 다른 화면에서 홈으로 오면 다시 접힘(프로그램 탭 PFOLD 와 같은 방식 · 앱 메모리만) */
function vidSw() { var o = S.get("vid_sw", null); return o && typeof o === "object" ? o : {}; }
function vidTry() { return typeof testEmp === "function" && testEmp() && !ttGet(); }   /* 시험 장치(사용자 확인 뒤 이 줄만 지운다) · 테스트 사번 = 시험 시각을 고르지 않았으면 닫힌 영상도 미리 열림 · 일반 참가자는 해당 없음 */
function vidUrl(x) { var o = S.get("vid_u", null), u = o && typeof o === "object" && x ? o[x.id] : ""; return typeof u === "string" && /^https:\/\/[^\s"<>]+$/.test(u) ? u : ""; }   /* v8.70 서버가 준 주소(열린 영상만) */
function vidOk(x) { return !!(x && x.v && (x.v.src || x.v.page || vidUrl(x)) && (vidSw()[x.id] === 1 || vidTry())); }
function vidRowHtml(x, i) {
  var ok = vidOk(x), th = '<span class="tb">' + (ok && x.v.poster ? '<img src="' + esc(x.v.poster) + '" alt="" width="1280" height="720" loading="lazy" decoding="async">' : "") + '<span class="pl">' + IV_PLAY_SVG + "</span>" + (x.len ? "<em>" + esc(x.len) + "</em>" : "") + "</span>";
  return '<button type="button" class="vr" data-vi="' + i + '"' + (ok ? ' onclick="ivAsk(this, ' + i + ')" aria-label="' + esc(x.t) + ' 영상 보기"' : " disabled") + ">" + th +
    '<span class="x"><b>' + hdqHtml(esc(x.t)) + "</b><span>" + (ok ? esc(x.s) : segHtml(esc(x.s + " · 준비 중"))) + "</span></span>" + (ok ? '<span class="cv">' + CHEV_SVG + "</span>" : "") + "</button>";
}
function vidHomeHtml() {   /* 줄 모양 = 판 문법 절(.axs-pan .axs-vids) 그대로 · 칸 그릇에 판 경계(axs-pan · 참여하기 칸과 같은 방식) */
  if (!VIDS.some(vidOk)) return "";   /* 셋 다 닫힘 = 칸째 없음 */
  return '<section class="axs-sec axs-pan axs-vsec" id="zoneVid"><div class="axs-sfd axs-vfd' + (VFOLD.open ? " open" : "") + '">' +   /* v8.69 접기 부품 axs-sfd · 머리 줄 = 홈 섹션 제목 모양 + 「자세히 보기」 셰브론(프로그램 탭 「선착순 이벤트」 axs-pfb 와 같은 부품 · 문구) */
    '<button type="button" class="axs-sfdb axs-pfb" id="vFoldBtn" aria-expanded="' + VFOLD.open + '" aria-controls="vFoldBody" onclick="vFoldTog(this)"><b>영상 보기</b>' + lnkChev("자세히 보기") + "</button>" +
    '<div class="axs-sfdp" id="vFoldBody"><div class="axs-sfdi"><div class="axs-sfdc"><section class="ax-card axs-vids" aria-label="영상 보기">' + VIDS.map(vidRowHtml).join("") + "</section></div></div></div></div></section>";
}
function vFoldTog(b) {
  VFOLD.open = !VFOLD.open;
  var w = b.closest(".axs-sfd"); if (w) w.classList.toggle("open", VFOLD.open);
  b.setAttribute("aria-expanded", String(VFOLD.open));
}
var IVP = { on: false, el: null, v: null, f: null, y: 0, from: null, fs: false, t: 0, vd: null, vt: "", yt: "" };
function ivAsk(b, i) {   /* v7.67 i = 영상 표(VIDS) 줄 · 없으면 첫 줄(IV_VIDEO) */
  var x = VIDS[i || 0] || VIDS[0], V = x.v || IV_VIDEO;
  if (!vidOk(x)) { if (App.current === "home") App.render(); return; }   /* v8.67 닫힌 뒤 그려진 줄 = 홈을 다시 그린다 */
  var pg = V.page || "", yt = V.src || pg ? "" : ivYtId(vidUrl(x));   /* v8.71 현장 인터뷰 = 서버 주소(유튜브) · 앱 안 재생(ivPlay · 유튜브 임베드) */
  if (!pg && !V.src && !yt) pg = vidUrl(x);   /* 유튜브가 아닌 서버 주소 = 새 창 */
  if (pg) { try { window.open(pg, "_blank", "noopener"); } catch (e) { location.href = pg; } return; }
  IVP.vd = V; IVP.vt = x.t; IVP.yt = yt;
  IVP.from = b || null;
  modalOpen('<div class="ax-stack-tight axs-gap12">' +
    '<button type="button" class="ax-button" onclick="ivPlay(true)">소리 켜고 보기</button>' +
    '<button type="button" class="ax-button ax-button-weak" onclick="ivPlay(false)">소리 끄고 보기</button></div>', "소리를 켤까요?");
}
/* v8.71 (사용자 261024) 현장 인터뷰 = 앱 안 유튜브 임베드 · 영상 id 는 서버가 준 주소(vidUrl)에서만 뽑는다(앱에 id 없음)
   youtube-nocookie · playsinline · 고른 소리(mute 0 | 1) · 소리 켜기 단추 = 플레이어에 unMute 명령(enablejsapi) · 전체 화면 단추 없음(fs=0 · 무대가 화면 전체) */
function ivYtId(u) { var m = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/)([\w-]{6,20})(?:[&#?]|$)/.exec(String(u || "")); return m ? m[1] : ""; }
function ivYtSrc(id, snd) {
  var o = /^https?:/.test(location.protocol) ? "&origin=" + encodeURIComponent(location.origin) : "";
  return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&playsinline=1&rel=0&fs=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&mute=" + (snd ? 0 : 1) + o;
}
function ivYtCmd(f, fn) { try { if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: "command", func: fn, args: [] }), "https://www.youtube-nocookie.com"); } catch (e) {} }
/* 아이폰 = 요소 전체 화면 없음 + video 기본 전체 화면 있음 */
function ivIOS() {
  var d = document.documentElement;
  return !(d.requestFullscreen || d.webkitRequestFullscreen) && typeof document.createElement("video").webkitEnterFullscreen === "function";
}
function ivFsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
function ivSndHtml() { return '<button type="button" class="ivp-snd">' + sndIcon(true) + "<span>소리 켜기</span></button>"; }
/* 확인 창 단추에서 부른다 · 누른 그 순간(사용자 동작) 안에 재생 · 전체 화면 · 가로 고정을 모두 요청한다 */
function ivPlay(snd) {
  if (IVP.on) return;
  modalClose(true);
  var yt = IVP.yt || "", ios = !yt && ivIOS(), w = document.createElement("div");   /* v8.71 유튜브 = 아이폰도 기본 플레이어 대신 무대(세로면 90도 돌림) */
  IVP.on = true; IVP.fs = false; IVP.y = window.scrollY || 0; IVP.t = Date.now(); IVP.f = null;
  w.id = "ivPlayer"; w.className = AXM.rm() ? "rm" : "";
  w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true"); w.setAttribute("aria-label", (IVP.vt || "AI 활용 현장 인터뷰") + " 영상"); w.tabIndex = -1;
  w.innerHTML = '<div class="ivp-st">' + (yt ? '<iframe class="ivp-v ivp-yt" src="' + esc(ivYtSrc(yt, snd)) + '" title="' + esc(IVP.vt || "AI 활용 현장 인터뷰") + '" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>' :
    '<video class="ivp-v" preload="auto" controls controlslist="nodownload nofullscreen noremoteplayback" disablepictureinpicture' + (ios ? "" : " playsinline") + "></video>") +
    '<button type="button" class="ivp-x" aria-label="닫기">' + X_SVG + "</button>" + (snd ? "" : ivSndHtml()) + "</div>";
  var v = w.querySelector("video");
  var V = IVP.vd || IV_VIDEO; if (v) { v.poster = V.poster || ""; v.loop = !!V.loop; v.muted = !snd; v.defaultMuted = !snd; v.src = V.src; }
  IVP.el = w; IVP.v = v; IVP.f = w.querySelector("iframe");
  document.body.appendChild(w);
  document.documentElement.classList.add("ivp-lock");
  w.querySelector(".ivp-x").addEventListener("click", function () { ivClose(); });
  ivSndWire(w);
  if (v) v.addEventListener("webkitendfullscreen", function () { if (IVP.v === v) ivClose(); });   /* 아이폰 기본 플레이어를 닫으면 세로 원래 화면으로 */
  var p = null;
  if (v) { try { p = v.play(); } catch (e) {} }
  if (p && p.catch) p.catch(function () {   /* 소리 켠 재생을 브라우저가 막으면 소리 끄고 재생 + 소리 켜기 단추 */
    if (IVP.v !== v || v.muted) return;
    v.muted = true; try { var p2 = v.play(); if (p2 && p2.catch) p2.catch(function () {}); } catch (e) {}
    if (!w.querySelector(".ivp-snd")) { w.querySelector(".ivp-st").insertAdjacentHTML("beforeend", ivSndHtml()); ivSndWire(w); }
  });
  if (ios) { try { v.webkitEnterFullscreen(); } catch (e) {} }   /* 메타데이터 전이면 실패할 수 있다 · 그때는 play() 가 기본 전체 화면으로 들어간다 */
  else {
    var req = w.requestFullscreen || w.webkitRequestFullscreen, lock = function () {
      IVP.fs = !!ivFsEl();
      try { var o = screen.orientation; if (o && o.lock) { var lp = o.lock("landscape"); if (lp && lp.catch) lp.catch(function () {}); } } catch (e) {}   /* 실패 = 세로 그대로 · CSS 가 무대를 돌린다 */
    };
    if (req) { try { var fp = req.call(w, { navigationUI: "hide" }); if (fp && fp.then) fp.then(lock, function () {}); else setTimeout(lock, 60); } catch (e) {} }
  }
  requestAnimationFrame(function () { if (IVP.el === w) { w.classList.add("in"); try { w.querySelector(".ivp-x").focus({ preventScroll: true }); } catch (e) {} } });
}
function ivSndWire(w) {
  var b = w.querySelector(".ivp-snd"); if (!b || b._w) return; b._w = 1;
  b.addEventListener("click", function () {
    if (IVP.f) { ivYtCmd(IVP.f, "unMute"); ivYtCmd(IVP.f, "playVideo"); if (b.parentNode) b.parentNode.removeChild(b); try { w.querySelector(".ivp-x").focus({ preventScroll: true }); } catch (e) {} return; }   /* v8.71 유튜브 */
    var v = IVP.v; if (!v) return;
    v.muted = false; v.volume = 1; if (v.paused) { try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    if (b.parentNode) b.parentNode.removeChild(b);
    try { w.querySelector(".ivp-x").focus({ preventScroll: true }); } catch (e) {}
  });
}
function ivClose() {
  if (!IVP.on) return;
  var w = IVP.el, v = IVP.v, y = IVP.y, fr = IVP.f;
  IVP.on = false; IVP.el = null; IVP.v = null; IVP.f = null; IVP.fs = false;
  if (fr && fr.parentNode) fr.parentNode.removeChild(fr);   /* v8.71 유튜브 = 바로 소리 끊기 · src 를 바꾸지 않고 떼어 낸다(바꾸면 방문 기록이 하나 늘어 뒤로 단추가 먹힌다) */
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
  if (ivFsEl()) { var ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) { try { var xp = ex.call(document); if (xp && xp.catch) xp.catch(function () {}); } catch (e) {} } }
  if (v) { try { v.pause(); v.removeAttribute("src"); v.load(); } catch (e) {} }
  document.documentElement.classList.remove("ivp-lock");
  var back = function () { window.scrollTo(0, y); };
  back(); setTimeout(back, 120); setTimeout(back, 420);   /* 가로 → 세로로 돌아오며 창 크기가 바뀌어도 원래 스크롤 자리 */
  if (w) {
    var fin = function () { if (w.parentNode) w.parentNode.removeChild(w); };
    if (w.classList.contains("rm")) fin(); else { w.classList.remove("in"); w.classList.add("out"); setTimeout(fin, AXM.OUT + 40); }
  }
  try { var f = IVP.from; if (f && f.isConnected && f.focus) f.focus({ preventScroll: true }); } catch (e) {}
}
/* 전체 화면에서 나오면(안드로이드 뒤로 · Esc · 시스템 제스처) 영상도 닫는다 · 들어가는 중(0.6초)의 흔들림은 무시 */
["fullscreenchange", "webkitfullscreenchange"].forEach(function (t) {
  document.addEventListener(t, function () { if (IVP.on && IVP.fs && !ivFsEl()) ivClose(); else if (IVP.on && ivFsEl()) IVP.fs = true; });
});
document.addEventListener("keydown", function (e) { if (IVP.on && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); ivClose(); } }, true);
document.addEventListener("visibilitychange", function () { if (document.hidden && IVP.on && IVP.v) { try { IVP.v.pause(); } catch (e) {} } if (document.hidden && IVP.on && IVP.f) ivYtCmd(IVP.f, "pauseVideo"); });
