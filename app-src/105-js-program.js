/* ═══ 프로그램 신청 기록 · link(기존 시스템) · 옛 seat(17F 좌석 신청)은 v4.26 에서 걷어냈다 ═══ */
function sessById(id) { return SESSIONS.filter(function (s) { return s.id === id; })[0]; }
function sessMy() { return S.get("sess_my", {}); }
/* v4.26 · 자유 참석(open · 17F 네 프로그램)은 신청 기록이 없다 · 이 기기나 서버에 옛 17F 신청 기록이 남아 있어도 내 것으로 보지 않는다
   (서버 sync my.sess 도 17F 를 싣지 않는다) · 사전 신청(sess_pre · sync my.pre)은 걷어냈다 */
function sessMine(id) {
  var s0 = sessById(id);
  if (s0 && s0.kind === "open") return null;
  var tt0 = testTen(); if (tt0 !== null && s0 && s0.fl === 10) return tt0 === id ? { slot: null, pre: true, test: true } : null;   /* 261007 테스트 · 내 10F 세션(테스트 모드만 · 실제 명단 · 서버에 쓰지 않음) */
  var m = sessMy()[id] || null;
  if (m) return m;
  var t = testMine().filter(function (x) { return x.t === "sess" && x.id === id; })[0];   /* v3.40 테스트 오버레이 · 실제 키에 쓰지 않음 */
  if (!t || testMineHidden(id)) return null;   /* v3.43 · 실제 항목과 겹쳐 표시하지 않는 오버레이는 뱃지도 없음 */
  return { slot: null, pre: !!t.pre, test: true };
}
/* ═══ v3.40 개발 버전 내 일정 오버레이 (testMode 전용 · 데모 #demo · 테스트 사번 310555) ═══
   10F 는 앱 신청이 없어(17F 는 v4.26 부터 자유 참석) 테스트 때 내 일정이 비어 기능 확인이 안 된다.
   후보에서 3~5개를 무작위로 골라 S "test_mine" 에만 저장한다 · sess_my·resv·cchat·photoq 같은 실제 키나 서버 액션에는 쓰지 않는다.
   겹침 규칙: 시간 구간이 겹치는 조합 금지(10F 세션 13:30~ 과 커피챗 동시 배치 불가 등) · 포토부스 대기표는 시간 구간 없음.
   캡처 모드(#demo=...&cap)는 결정적 시드를 쓰므로 오버레이를 끈다. */
function testMine() {
  if (!testMode() || /cap/.test(location.hash) || TMG_BUSY) return [];   /* v3.43 생성 중 재귀 방지 */
  var m = S.get("test_mine", null);
  if (!m || !m.items) { m = testMineGen(); S.set("test_mine", m); }
  return testTen() !== null ? m.items.filter(function (x) { return x.t !== "sess"; }) : m.items;   /* 261007 10F 는 「테스트 · 내 10F 세션」이 정한다(무작위 10F 는 뺀다) */
}
/* ── 261007 (사용자 「310555 테스트 계정은 세션 A 참석자로」) 테스트 · 내 10F 세션 ──
   테스트 모드만 · S "test_ten" = 세션 id | "none" · 테스트 사번은 고르기 전 기본 A(fld) · 데모는 고르기 전 null(옛 무작위 오버레이 그대로)
   고르면 sessMine · tenMine 이 그 세션 사전 신청자로 본다(나의 일정 하루 흐름 · 홈 신청 카드 · 시간표 10F) · 실제 명단(sess_my) · 서버 판정은 그대로 */
var TEST_TENS = [["none", "없음"], ["fld", "A"], ["ta", "B"], ["tb", "C"], ["aws", "D"], ["ms1", "E1"], ["ms2", "E2"]];
function testTen() {
  if (!testMode()) return null;
  var v = S.get("test_ten", null);
  if (v === null) v = testEmp() ? "fld" : null;
  if (v === null) return null;
  return v !== "none" && TEST_TENS.some(function (x) { return x[0] === v; }) ? v : "";
}
function testTenLbl() { var v = testTen(); if (v === null) return "무작위"; var s = v && sessById(v); return s ? s.ttl : "없음"; }
function testTenSet(v) { if (!testMode()) return; S.set("test_ten", v); TMH.at = 0; if (typeof ttRepaint === "function") ttRepaint(); App.render(); }
var TMG_BUSY = false;
function testMineGen() {
  TMG_BUSY = true;
  try { return testMineGen0(); } finally { TMG_BUSY = false; }
}
function testMineGen0() {
  var R = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var real = myItems(false), occ = real.filter(function (x) { return x.iv; }).map(function (x) { return x.iv.slice(); }), items = [];
  var has = function (k) { return real.some(function (x) { return x.kind === k || (k === "ten" && x.ten); }); };
  var free = function (a, b) { return occ.every(function (x) { return b <= x[0] || a >= x[1]; }); };
  var rng = function (tm) { var p = tm.split("~"); return [t2m(p[0]), t2m(p[1])]; };
  var gens = [
    function () { if (has("ten")) return; var s = sessById(R(["fld", "ta", "tb", "aws", R(["ms1", "ms2"])])), r = rng(s.tm); if (!free(r[0], r[1])) return; occ.push(r); items.push({ t: "sess", id: s.id, pre: true }); },
    function () { if (has("resv")) return; for (var k = 0; k < 12; k++) { var a = t2m("09:30") + 30 * Math.floor(Math.random() * 14); if (a >= t2m(RESV_CONF.lunch) && a < t2m(RESV_CONF.lunchEnd)) continue; if (free(a, a + 30)) { occ.push([a, a + 30]); items.push({ t: "resv", slot: hm2(a), room: R([1, 2, 3]) }); return; } } },
    function () { if (has("cchat") || !ideaMineN()) return;   /* v4.45 테스트 일정에도 「아이디어가 있어야 커피챗」 규칙 */ for (var k = 0; k < 12; k++) { var a = t2m("13:00") + 30 * Math.floor(Math.random() * 7); if (free(a, a + 20)) { occ.push([a, a + 20]); items.push({ t: "cchat", round: hm2(a), table: R(["A", "B", "C"]) }); return; } } },
  ];
  var want = 3 + Math.floor(Math.random() * 3);
  gens.sort(function () { return Math.random() - 0.5; });
  for (var i = 0; i < gens.length && items.length < want; i++) gens[i]();
  return { items: items, at: Date.now() };
}
var TMH = { at: 0, ids: [] };
function testMineHidden(id) {
  if (Date.now() - TMH.at > 500) {
    TMH.at = Date.now();
    var shown = myItems(true).filter(function (x) { return x.test && x.kind.indexOf("sess:") === 0; }).map(function (x) { return x.kind.slice(5); });
    TMH.ids = testMine().filter(function (x) { return x.t === "sess" && shown.indexOf(x.id) < 0; }).map(function (x) { return x.id; });
  }
  return TMH.ids.indexOf(id) >= 0;
}
function testMineShuffle() { if (!testMode()) return; S.set("test_mine", testMineGen()); toast("테스트 · 나의 일정을 다시 섞었어요 · " + testMine().length + "개"); App.render(); }
/* ═══ v3.43 hotfix · 내 항목 병합 함수 하나 (홈 「나의 일정」 · 일정 탭 「내 일정」 공용) ═══
   종류별 1건 규칙: 커피챗·상담·포토부스는 사람당 1건 · 실제 상태에 같은 종류가 있으면 테스트 오버레이 항목은 표시하지 않는다.
   오버레이 세션은 같은 id 가 실제로 있거나 실제 항목과 시간이 겹치면 표시하지 않는다(저장된 test_mine 은 그대로 둔다).
   반환 항목: { min, go, badge, label, title, gTitle, sub, gSub, call, kind, iv:[시작분, 끝분] | null, test } */
function myItems(withTest) {
  var out = [], q = S.get("queue", {}), qk;
  for (qk in q) {
    var sp = scanSpot(qk), r = q[qk];
    if (!sp || !r || r.status === "done") continue;
    var qc = r.status === "call";
    out.push({ min: -1, go: "qrPanelOpen('mine')", badge: qc ? "호출" : r.no + "번", label: "지금", title: sp.nm, gTitle: sp.nm,
      sub: qc ? "지금 입장하세요" : "대기 중" + (r.ahead ? " (앞 " + r.ahead + "명)" : ""), gSub: qc ? "지금 입장하세요" : r.no + "번 대기 중" + (r.ahead ? " (앞 " + r.ahead + "명)" : ""),
      call: qc, kind: "queue:" + qk, iv: null });
  }
  var sl0 = stairState().leg;   /* v4.06 계단 진행 중 · 도착 층 QR 을 찍을 때까지 맨 위 */
  if (sl0) out.push({ min: -1, go: "stairOpen()", badge: "계단", label: "지금", title: "계단 이용", gTitle: "계단 이용", sub: sl0.fl + "F 시작 · 도착 층 QR", gSub: sl0.fl + "F " + (sl0.route || stairRoute(sl0.r)) + " 시작 · 도착 층 QR", kind: "stair", iv: null });
  var mr = myResv();
  if (mr && RESV_LIVE.indexOf(mr.status) >= 0)
    out.push({ place: "1F AX 라운지", min: sessStartMin(mr.slot), go: "App.go('dap')", badge: mr.slot, label: mr.slot, title: "AX 라운지", gTitle: "AX 라운지", sub: "1:1 · 30분", gSub: "1F AX 라운지 · 30분", kind: "resv", iv: [sessStartMin(mr.slot), sessStartMin(mr.slot) + 30] });
  var cc = S.get("cchat", null);
  if (cc && cc.status === "matched")
    out.push({ place: "18F", min: sessStartMin(cc.round), go: "App.go('ev_cchat')", badge: cc.round, label: cc.round, title: "AX 커피챗", gTitle: "AX 커피챗", sub: "TABLE " + cc.table, gSub: "TABLE " + cc.table, kind: "cchat", iv: [sessStartMin(cc.round), sessStartMin(cc.round) + 20] });
  else if (cc && cc.status === "pending" && !cchatOver())   /* v4.45 매칭 대기도 나의 참여 › 내 일정에 보인다 · 시각이 없어 맨 뒤 · v6.07 희망 접수 · 커피챗 하루가 끝나면(16:00) 조용히 걷는다 */
    out.push({ place: "18F", min: 9998, go: "App.go('ev_cchat')", badge: "희망", label: "희망 접수", title: "AX 커피챗", gTitle: "AX 커피챗", sub: "희망 접수", gSub: "희망 접수 · 선정되면 하이웍스로 안내", kind: "cchat", iv: null });
  /* v4.26 · 앱에서 받는 세션 신청(옛 17F 좌석 신청)이 없어져 세션 항목은 내 일정에 올리지 않는다 · 10F 는 테스트 오버레이에서만 */
  if (!withTest) return out;
  var kinds = out.map(function (x) { return x.kind; }), ivs = out.filter(function (x) { return x.iv; }).map(function (x) { return x.iv; });
  var hasTen = out.some(function (x) { return x.ten; });
  var clash = function (iv) { return ivs.some(function (b) { return iv[0] < b[1] && b[0] < iv[1]; }); };
  var now = hmNow();
  testMine().forEach(function (x) {
    var it = null;
    if (x.t === "resv") it = { place: "1F AX 라운지", min: t2m(x.slot), go: "App.go('dap')", badge: x.slot, label: x.slot, title: "AX 라운지", gTitle: "AX 라운지", sub: "테스트", gSub: "1F AX 라운지 · 승인 · 테스트", kind: "resv", iv: [t2m(x.slot), t2m(x.slot) + 30] };
    else if (x.t === "cchat") it = { place: "18F", min: t2m(x.round), go: "App.go('ev_cchat')", badge: x.round, label: x.round, title: "AX 커피챗", gTitle: "AX 커피챗", sub: "TABLE " + x.table + " · 테스트", gSub: "18F TABLE " + x.table + " · 테스트", kind: "cchat", iv: [t2m(x.round), t2m(x.round) + 20] };
    else if (x.t === "sess") {
      var s0 = sessById(x.id); if (!s0 || s0.fl !== 10) return;   /* v4.37 17F 는 v4.26 부터 자유 참석이라 내 일정에 오를 수 없다 · 그 전에 기기에 저장된 테스트 항목(l1 · l2 등)은 여기서 거른다 */
      var pp = s0.tm.split("~");
      if (s0.fl === 10 && hasTen) return;
      it = { place: sessPlace(s0), min: t2m(pp[0]), go: "sessOpen('" + x.id + "')", badge: pp[0], label: pp[0], title: s0.ttl, gTitle: s0.ttl, sub: s0.tm + " · 테스트", gSub: sessPlace(s0) + " · " + s0.tm + " · 테스트", kind: "sess:" + x.id, ten: s0.fl === 10, iv: [t2m(pp[0]), t2m(pp[1])] };
    }
    if (!it || kinds.indexOf(it.kind) >= 0 || (it.iv && clash(it.iv))) return;   /* 종류별 1건 · 실제 항목과 시간 겹침 금지 */
    it.test = true;
    out.push(it); kinds.push(it.kind); if (it.iv) ivs.push(it.iv); if (it.ten) hasTen = true;
  });
  return out;
}
function sessStartMin(tm) { var m = /(\d{1,2}):(\d{2})/.exec(tm || ""); return m ? (+m[1]) * 60 + (+m[2]) : 9999; }
/* v3.21 B 슬롯 신청 · v3.31b 17F 좌석 잔여(sessRemain · 정원 - 사전 - 앱) · v4.26 신청 목록(sessMineList)은 모두 걷어냈다 */
function hm2(min) { var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m; }
/* 시간대 슬롯 신청(sessSlots·slotRemain·슬롯 선택 UI)은 v3.21 B 폐지 · 유일한 슬롯형이던 포토부스가 원격 대기열로 바뀌었다 */
/* v3.31b · 10F 1인 1세션 교체 확인창(sessOverlap·sessSwap)은 10F 가 안내 전용이 되며 삭제 · 서버 규칙(reason ten)은 유지.
   17F 오후 두 강연은 시간이 겹치지 않아 둘 다 신청할 수 있다 */
function sessOpen(id) { PROG.sid = id; App.go("sess_d"); }
/* ═══ AX-TDS v1 2단계 (260922) · 프로그램 P01 · 상세 P02 · 확인 P03 · 결과 P04 · 내 일정 M02 · 관리 M03 · 취소 시트 M03-cancel ═══
   신청 규칙: 과제상담 = resv_book(시간 1칸 · 1인 1건) · 10F 실습형 세션 = 안내 전용(앱 신청 없음)
   · 커피챗 = 아이디어 제출 후 참석 의사를 물어 예일 때만 요청(v4.07) · 17F 네 프로그램 · 1F 전시 = 자유 입장(17F 는 입구 QR 출석 · v4.26).
   바뀐 것: 서버 응답을 기다린다. 성공 응답 전에는 결과 화면을 띄우지 않고, 실패하면 확인 화면에 사유와 다음 행동을 둔다.
   취소는 확인 시트 → 서버 성공일 때만 로컬에서 지운다(실패하면 신청 유지). 데모(서버 없음)는 같은 규칙을 로컬로 판정한다. */
var PROG_CAT = { key: "강연", road: "강연", l1: "강연", l2: "강연", fld: "실습", ta: "실습", tb: "실습", aws: "실습", ms1: "실습", ms2: "실습", dap: "상담", cchat: "상담", expo: "전시" };
/* 1F 전시·체험존 = 자유 입장 상세(P02-free) 하나로만 목록에 둔다 · 부스·퀴즈·포토부스 적립과 대기는 체험·나의 참여 몫 */
var EXPO = { id: "expo", fl: 1, zone: "expo", kind: "open", ttl: "1F 부스", sub: "AX VISION · AX LAB · AX in Action · AX PLAY · AX 라운지 · EVENT", who: "", tm: "", desc: "" };
/* 시간표 행 → 상세 (# = 프로그램 목록 분류) */
var TL_PROG = { "Intro · 개회": "intro", "마무리 연설": "outro", "기조연설": "key", "내부 강연 · AX 로드맵": "road", "점심 · 자유 관람": "#1F", "파트너사 강연 · AWS": "l1", "파트너사 강연 · MS": "l2", "10F 실습형 세션 A~E": "#실습" };
/* v4.99 (사용자 261002 「Outro 설명이 너무 많다 · 기조연설처럼 한 장으로」) 17F Intro · Outro = 상세 한 장(sess_d · kind stage) · 시간표 줄은 제목 · 시간 · 장소만
   출석 · 스탬프 대상이 아니다(Intro 출석은 기조연설 QR 에 포함 · ATT_17F key 09:30) · SESSIONS 목록 · PROG_CAT 에 넣지 않는다 */
var STAGE = {
  intro: { id: "intro", fl: 17, zone: "hall", kind: "stage", ttl: "Intro", sub: "AX 선포 및 Festival 개최 안내", who: "CEO", tm: "09:30~09:40", desc: "" },
  outro: { id: "outro", fl: 17, zone: "hall", kind: "stage", ttl: "Outro", sub: "마무리 연설", who: "CSO", tm: "17:00~17:30", desc: "" }
};
function progById(id) { return id === "expo" ? EXPO : id === "intro" || id === "outro" ? STAGE[id] : sessById(id); }
function progTm(tm) { return String(tm || "").replace("~", "–"); }
/* v4.13 프로그램 탭 두 층(사용자 결정 260922 · design.md A-5 5-10) · 1층 = 보기 [목록 | 시간표] · 2층 = 분류 칩(두 보기 공통) */
/* ═══ v4.15 시간표 보기 재설계 (사용자 결정 260922 · design.md A-5 5-10) ═══
   목록과 모양이 달라야 한다: 어제(v4.03 이전 · v3.5 일정 탭 계열) 구조를 되살리고 AX-TDS 토큰만 맞춘다.
   위 [목록 | 시간표] 아래 = [전체 | 나의 일정] 세그먼트(분류 칩 · 「신청 가능」 칩은 목록에만).
   행 = 공용 행 카드(rcHtml) · 왼쪽 시간 칸(시작 + ~끝) · 제목 한 줄만 닫힌 행 · 누르면 설명 · 시간 · 장소 · 참여 방식 · 상세 버튼 펼침.
   내 항목 = 연주황(brandSoft) 틴트 · 진행 중 = 주황 테두리 + 「진행 중」 · 지난 행 = inset 면 · 커피챗은 맨 아래 「시간 미정」. */
/* 상담 두 가지는 시각이 아니라 운영 시간 안에 신청하는 것 · 시간표에는 운영 시간 한 줄로 · 포토부스(대기 번호)는 목록 「신청 가능」 몫 */
/* v4.93 (261001 사용자 확정 · IA 검토 A1) 탭 맨 위 = [시간표 | 상시 운영] · 옛 [전체 | 나의 일정](progTT)은 걷었다(나의 일정 = 나의 참여 맨 위 한 곳) */
/* v5.85 (사용자 261006) 세 칸 [시간표 | 상시 운영 | 신청하기] · PROG.seg = time · always · apply · 처음은 시간표 */
function progSegOf(g) { return g === "always" || g === "apply" ? g : "time"; }
function progSeg(g) { PROG.seg = progSegOf(g); PROG.scroll = 0; App.render(); window.scrollTo(0, 0); if (PROG.seg === "time") progFlowScroll(); }
/* 프로그램 › 신청하기 칸으로(홈 나의 일정 커피챗 줄 · 신청한 프로그램 없음 줄) */
function progApplyGo() { PROG.seg = "apply"; PROG.scroll = 0; PROG.anchor = ""; App.tab("guide"); window.scrollTo(0, 0); }
/* v5.73 (사용자 261005 「점심 자유 관람을 눌렀을 때 갑자기 상시 운영 탭으로 날아가는데 좀 더 부드럽게 · 상단의 시간표와 상시운영이 보이는 곳까지 · 지금은 한 칸 밑 위치」)
   시간표에서 누르면 = 세그먼트 손잡이가 「상시 운영」으로 미끄러지고(0.25초) 아래 내용이 흐려졌다 바뀌어 다시 나타남 · 스크롤 = 맨 위(세그먼트가 보이고 바로 아래 1F 로비 머리) 부드럽게
   다른 화면(나의 일정 빈 상태 · 상시 운영 보기 버튼)에서 = 프로그램 탭 맨 위(세그먼트) · 움직임 줄이기 = 바로 · 옛 v4.93 = 1F 로비 머리로(세그먼트가 화면 밖) */
var PROG_SW = 0;
function progAlwaysGo() {
  var sg = App.current === "guide" && PROG.seg === "time" && !detShown() ? document.querySelector("#view .axs-seg") : null, bd = sg && sg.nextElementSibling;   /* v5.85 미끄러짐은 시간표 → 상시 운영(첫 칸 → 둘째 칸)만 */
  if (!sg || !bd || rgReduced()) { PROG.seg = "always"; PROG.scroll = 0; PROG.anchor = ""; App.tab("guide"); window.scrollTo(0, 0); return; }
  clearTimeout(PROG_SW); sg.classList.add("sw-r"); bd.classList.add("sw-out");   /* v5.85 시간표 맨 위 신청 줄(v5.82)은 신청하기 칸으로 옮겼다 */
  window.scrollTo({ top: 0, behavior: "smooth" });
  PROG_SW = setTimeout(function () {
    PROG_SW = 0; if (App.current !== "guide") return;
    PROG.seg = "always"; PROG.scroll = 0; PROG.anchor = ""; App.from = {}; App.render();
    var b2 = document.querySelector("#view .axs-seg + *"); if (b2) { b2.classList.add("sw-in"); setTimeout(function () { b2.classList.remove("sw-in"); }, 320); }
    if (window.scrollY > 0 && window.scrollY < 4) window.scrollTo(0, 0);
  }, 250);
}   /* 점심 줄 · 나의 일정 빈 상태 · 옛 「신청할 수 있는 프로그램 보기」 */
/* v4.91 (사용자 261001 「아코디언을 펼치고 가는 것보다 자세히 보기로 한 번에」) 줄을 누르면 바로 그 상세로 · 이동 표시 = 오른쪽 셰브론(CHEV_SVG)
   갈 곳이 없는 줄은 누를 수 없고, 펼침에만 있던 한 줄(누가 · 무엇)을 제목 아래에 둔다 · v4.99 Intro · Outro 도 상세 한 장으로 간다(TL_PROG intro · outro) */
function progTTRow(k, o) {
  return rcHtml({ cls: o.cls + (o.go ? "" : " na"), onclick: o.go || "", link: !!o.go, chev: o.go ? undefined : false, left: tokBadge(o.t0, o.tok, o.t1 ? "~" + o.t1 : null),
    title: esc(o.title) + (o.mine ? '<span class="ax-sr-only"> · 나의 일정</span>' : ""), badges: o.badge || "", sub: o.sub ? esc(o.sub) : "" });
}
/* v5.85 세 칸 · 「신청<wbr>하기」 = 좁은 폭(240 · 큰 글씨)에서 「신청 / 하기」로 나뉜다 · 「신청하기」 옆 작은 주황 점 = 둘 중 지금 신청할 수 있는 것이 하나라도 남음(applyOpenN) · 둘 다 신청했거나 마감이면 점 없음 */
function progSegHtml() {
  var g = progSegOf(PROG.seg), dot = applyOpenN() > 0;
  return '<div class="axs-seg axs-seg3" role="tablist" aria-label="프로그램 보기">' +
    '<button type="button" role="tab" aria-selected="' + (g === "time") + '" onclick="progSeg(\'time\')">시간표</button>' +
    '<button type="button" role="tab" aria-selected="' + (g === "always") + '" onclick="progSeg(\'always\')">상시 운영</button>' +
    '<button type="button" role="tab" aria-selected="' + (g === "apply") + '" onclick="progSeg(\'apply\')" data-seg="apply">신청<wbr>하기' +
    (dot ? '<i class="axs-sdot" aria-hidden="true"></i><span class="ax-sr-only"> · 신청 가능</span>' : "") + "</button></div>";
}
/* ═══ v5.21 시간표 = 점 노드 흐름 한 줄(사용자 261003 · 정본 「디자인 시안/프로그램 탭 개편/시간표 흐름/설계.md」 안 A · design.md A-5 5-10) ═══
   보이는 것 = 자유 참석으로 갈 수 있는 것만(17F Intro · 기조연설 · 내부 강연 · 점심 · 파트너사 강연 2회 · Outro) · 1F 상시 · 18F 커피챗 운영 · 10F A~E 는 시간표에 없다(상시 운영 탭 · 세션 상세 몫)
   개인 일정: 10F 사전 신청 세션(tenMine)만 그 시간과 조금이라도 겹치는 자유 참석 줄을 빼고 그 자리에 둔다(v5.22 사용자 261003) · 승인된 AX LOUNGE 상담(myResv approved 이후) · 매칭된 커피챗(cchat matched)은 강연을 지우지 않고 시작 시각 순서대로 노드 · 카드를 끼운다
   구획 제목(오전 · 점심 · 오후) · 「자유 참석」 딱지 · 「진행 중」 칩 · 맨 위 지금 시각 줄은 없다(사용자 261003) · 내 것 = 칩 하나(틴트 없음) · 강조 = 진행 중 카드 하나에 주황 테두리
   왼쪽 시각 · 가운데 점 노드(지남 O50 작은 점 · 지금 O100 큰 점 하나 · 앞 = 속 빈 점) · 노드와 노드 사이는 끊김 없는 점선 레일(지난 구간 O50 · 지금 구간은 흐른 만큼 O100 · 남은 구간 회색) · 오른쪽 카드(층 점 글자 + 장소 + ~끝) */
var FL_SUB = { intro: "CEO · AX 선포 · 개최 안내", key: "CTO · AI 환경 · 전략", road: "디지털전략본부장 · 현대해상 AX 로드맵", l1: "Agentic AI 시대의 일하는 방식 변화", l2: "AI와 친해지기", outro: "CSO · DAP 시상 · 현장 추첨" };
var FL_DAP_OK = ["approved", "checked", "done"];   /* 상담은 승인된 예약부터 시간표에 들어간다(승인 대기는 나의 일정에만) */
function progTimeHtml() { return '<div class="axs-fl" id="progFlow">' + progFlowHtml() + "</div>"; }
/* 층 표시 = 점 글자(design.md A-5 5-20 · 12px · 읽는 이름 「17층」) */
function flFloor(n) { return DotGlyph.svg(n + "F", { h: 12, label: n + "층" }); }
function progFlowItems(onlyFl) {
  var pub = [], mine = [];
  TIMELINE.forEach(function (t) {
    if (t.always || t.off || !t.time) return;
    var pid = TL_PROG[t.title] || "", pm = /^(\d+)F\s*(.*)$/.exec(t.place || "") || ["", "", t.place || ""];
    if (t.brk) { var bm = /^(\d+)F/.exec(t.place || ""); pub.push({ k: "brk", brk: 1, pid: "", a: t2m(t.time), b: t2m(t.end), t0: t.time, t1: t.end, ttl: t.title, sub: "", fl: bm ? +bm[1] : 0, pl: "" }); return; }   /* 261007 휴식 줄(progFlowBrk) */
    pub.push({ k: pid || t.title, pid: pid, a: t2m(t.time), b: t2m(t.end), t0: t.time, t1: t.end, ttl: t.title, sub: FL_SUB[pid] || "", fl: +pm[1] || 0, pl: pm[2],
      go: pid === "#1F" ? "progAlwaysGo()" : pid && pid.charAt(0) !== "#" ? "progOpen('" + pid + "')" : "", chip: attUi(pid) && attMineAt(pid) ? "출석" : "", lec: !!attUi(pid) });
  });
  if (onlyFl) return pub.filter(function (p) { return p.fl === onlyFl; });   /* v5.65 층 안내(floor_d · 둘러보기 엘리베이터 17F) = 그 층 공용 일정만(개인 일정 · 대신하기 없음) */
  var tm = tenMine();
  if (tm) { var tp = tm.tm.split("~"); mine.push({ k: "ten", pid: tm.id, a: t2m(tp[0]), b: t2m(tp[1]), t0: tp[0], t1: tp[1], ttl: tm.ttl, sub: tm.sub, fl: 10, pl: sessPlace(tm).replace(/^\d+F\s*·?\s*/, ""), go: "progOpen('" + tm.id + "')", chip: "내 세션", mine: true }); if (ATT10_UI && attMineK(tm.id, "out")) mine[mine.length - 1].chip = "출석"; }   /* v5.71 끝 QR 출석 = 17F 와 같은 칩 「출석」 */
  var r = myResv();
  if (r && r.slot && FL_DAP_OK.indexOf(r.status) >= 0) { var ra = t2m(r.slot); mine.push({ k: "dap", pid: "dap", a: ra, b: ra + (RESV_CONF.step || 30), t0: r.slot, t1: hm2(ra + (RESV_CONF.step || 30)), ttl: "AX 라운지", sub: "", fl: 1, pl: "AX 라운지", go: "progOpen('dap')", chip: RESV_ST[r.status] || "승인 완료", mine: true }); }
  var c = S.get("cchat", null);
  if (c && c.status === "matched" && c.round) { var ca = t2m(c.round); mine.push({ k: "cchat", pid: "cchat", a: ca, b: ca + 20, t0: c.round, t1: hm2(ca + 20), ttl: "AX 커피챗", sub: "", fl: 18, pl: c.table ? "TABLE " + c.table : "", go: "progOpen('cchat')", chip: "선정", mine: true }); }   /* v6.07 매칭됨 → 선정 */
  /* v5.74 (사용자 261006 「13:30부터 여기에는 17층 강의가 있어야 사람들이 보고 참여할 수 있을 듯」) 개인 일정은 공용 일정 줄을 빼지 않는다(옛 v5.22 rep = 10F 세션이 겹치는 17F 오후 강연 줄을 지웠다 · 10F 명단에 든 사람 화면에서 17F 가 사라진 원인)
     같은 시각 순서 = 17F 등 공용 줄 먼저 · 내 10F 세션은 그 아래(k ten) · 상담 · 커피챗(30분 · 20분)은 지금처럼 끼워 넣기(같은 시각이면 먼저) */
  return pub.concat(mine).sort(function (x, y) { return x.a - y.a || (x.k === "ten" ? 1 : 0) - (y.k === "ten" ? 1 : 0) || (y.mine ? 1 : 0) - (x.mine ? 1 : 0); });
}
/* v6.04 myIts = 나의 일정 하루 흐름(10F 명단 · myFlowItems) · 같은 노드 · 레일 · 카드 틀에 카드만 myFlowCard(신청 = 주황 테두리 + 칩 · 자유 참석 = 흰 카드 + 회색 칩) · 10F 입구 줄 · 분 갱신 키 없음 */
function progFlowHtml(onlyFl, myIts) {
  var ph = evPhase(), hmN = ph === "before" ? -1 : ph === "after" ? 99999 : hmNow(), its = myIts || progFlowItems(onlyFl), g = [], by = {};
  its.forEach(function (o) { if (!by[o.t0]) { by[o.t0] = { t0: o.t0, a: o.a, its: [] }; g.push(by[o.t0]); } by[o.t0].its.push(o); });
  var act = its.filter(function (o) { return hmN >= o.a && hmN < o.b; });
  act.sort(function (x, y) { return (y.mine ? 1 : 0) - (x.mine ? 1 : 0) || x.a - y.a; });
  var focus = act[0] || null;
  if (!onlyFl && !myIts) PROG.flKey = ph + hmN;
  return g.map(function (r, i) {
    var nx = g[i + 1], b = Math.max.apply(null, r.its.map(function (o) { return o.b; }));
    var st = focus && r.its.indexOf(focus) >= 0 ? "now" : r.its.some(function (o) { return hmN >= o.a && hmN < o.b; }) ? "on" : hmN >= b ? "past" : "next";
    var span = nx ? nx.a - r.a : 0, p = nx ? Math.max(0, Math.min(1, (hmN - r.a) / span)) : 0, ex = nx ? Math.min(52, Math.round(span * 0.35)) : 0;
    var rl = nx ? '<i class="rl' + (p >= 1 ? " done" : p > 0 ? " cur" : "") + '" style="--p:' + p.toFixed(3) + '"></i>' : "";
    var mn = myIts && r.its.some(function (o) { return o.mine; }) ? " mine" : "";   /* 나의 일정 · 내 일정이 든 줄 = 노드도 주황 채운 점 */
    return '<div class="fr ' + st + mn + '" style="--ex:' + ex + 'px"><span class="tm">' + r.t0 + '</span><span class="ln" aria-hidden="true"><i class="nd"></i>' + rl + '</span><div class="cs">' +
      r.its.map(function (o) { return (myIts ? myFlowCard : progFlowCard)(o, hmN, focus === o); }).join("") + (!onlyFl && !myIts && r.t0 === TEN_ROW_AT && applyTenShow() ? progTenRowHtml() : "") + "</div></div>";
  }).join("");
}
/* v5.74 (사용자 261006 「사전 신청자 대상 강의에 대한 입구가 없는 것 같은데 · 적절한 위치」) 10F 실습형 세션 입구 = 13:30 칸 맨 아래 작은 한 줄(카드보다 낮은 위계 · 시간표 노드 · 진행 중 판정에 들지 않는다)
   누르면 10F 실습형 세션 목록(floor_d · 엘리베이터 10F 안내와 같은 2단계) → 세션 줄 → 시트 · 배제 말투 없이 「사전 신청자 참여」(design.md §7)
   v5.86 (사용자 261006) 보이는 사람 = [신청하기] 칸 10F 줄과 같은 규칙(applyTenShow · 10F 명단 tenMine · 테스트 사번 testMode) · 일반 직원에게는 없다 · 옛 v5.74 「사전 신청자에게는 숨김」은 뒤집음 */
var TEN_ROW_AT = "13:30";
function progTenGo() { PROG.floor = 10; App.go("floor_d"); }
function progTenRowHtml() {
  return '<button type="button" class="fx10" onclick="progTenGo()" data-fl="ten10"><span class="dg-w">' + flFloor(10) + '</span><span class="x"><b>실습형 세션</b><span>사전 신청자 참여 · 5개 세션</span></span><span class="chv">' + CHEV_SVG + "</span></button>";
}
/* 261007 (사용자 확정 「AWS 13:30~14:50 · 휴식 14:50~15:10 · MS 15:10~16:40」) 17F 휴식 줄 = 카드보다 낮은 위계(면 없음 · 작은 글 · 누름 없음) · 「휴식」 한 단어 + 끝 시각 · 스탬프 · 출석 없음 */
function progFlowBrk(o, hmN) { return '<div class="fbk' + (hmN >= o.b ? " past" : "") + '" data-fl="brk"><b>' + esc(o.ttl) + '</b><span class="e">~' + o.t1 + "</span></div>"; }
function progFlowCard(o, hmN, isF) {
  if (o.brk) return progFlowBrk(o, hmN);
  var past = hmN >= o.b, ac = isF && o.lec && !o.chip ? '<span class="ac">입장 · 끝 QR로 출석</span>' : "";   /* v5.68 */
  return '<button type="button" class="fc' + (past ? " past" : "") + (isF ? " focus" : "") + '"' + (o.go ? ' onclick="' + o.go + '"' : " disabled") + ' data-fl="' + esc(o.k) + '">' +
    '<span class="mt">' + (o.fl ? flFloor(o.fl) : "") + '<span class="pl">' + esc(o.pl) + '</span><span class="e">~' + o.t1 + "</span></span>" +
    '<span class="t">' + (isF ? '<span class="ax-sr-only">진행 중 </span>' : "") + '<span class="tt">' + esc(o.ttl) + "</span>" + (o.chip ? '<span class="axs-chip">' + esc(o.chip) + "</span>" : "") + "</span>" +
    (o.sub ? '<span class="s">' + esc(o.sub) + "</span>" : "") + ac + (past || !o.go ? "" : '<span class="chv">' + CHEV_SVG + "</span>") + "</button>";
}
/* 분 단위 갱신 · 시간표가 보이는 동안만 흐름 칸만 다시 그린다(스크롤 · 탭 상태 그대로) · 탭에 들어올 때 진행 중 카드가 화면 밖이면 가운데로 */
setInterval(function () {
  if (App.current !== "guide" || PROG.seg === "always" || document.hidden) return;
  var f = el("progFlow"); if (!f) return;
  var ph = evPhase(), k = ph + (ph === "before" ? -1 : ph === "after" ? 99999 : hmNow());
  if (k !== PROG.flKey) f.innerHTML = progFlowHtml();
}, 20000);
function progFlowScroll() {
  var c = document.querySelector("#progFlow .fc.focus"); if (!c) return;
  var q = c.getBoundingClientRect(), tb = el("tabbar"), lim = window.innerHeight - (tb ? tb.offsetHeight : 0);
  if (q.top < 120 || q.bottom > lim) c.scrollIntoView({ block: "center" });
}
/* ═══ v4.84 (261001 앱 개편 2묶음 · 기획안 5-3) 프로그램 탭 아래 메뉴 · 10F 행 펼침 · 1F 부스 6구역 ═══ */
/* ═══ v4.93 (261001 사용자 확정 · 「디자인 시안/프로그램 탭 개편/IA 검토.md」 7-1~7-3 · 8장 A2 · A3) 프로그램 › 상시 운영 · 구역 상세(zone_d) ═══
   1F 6구역 = 표 하나(FLOOR1)를 상시 운영 줄과 구역 상세가 같이 쓴다 · 옛 「상시 운영」 메뉴(progMenuHtml) · 1F 부스 화면(floor1Html)을 흡수했다
   sign = 현장 부스 사인 글자 그대로(영문 제목 · EVENT 는 AX 접두 없음) · kor = 한국어 한 줄 · fact = 보조 한 줄 · st = 걸린 스탬프 id(v4.99 줄 · 상세 모두 오른쪽 도장 · 옛 한 단어 stw 없앰)
   grp = 둘러보기(see) / 참여하기(do) · 순서는 하는 일 기준이고 걷는 순서가 아니다(동선 · 위치 · 번호 원은 다루지 않는다 · 사용자 261001)
   stm · todo = 구역 상세 막대 문장 · 하는 일 · btn = 구역 상세 행동(없으면 안내형) · 판 문구를 옮기지 않는다(「1층 부스 최종 정리」 1-1 한 줄 정의에서 줄임)
   18F 는 AX 커피챗 하나(커피바 없음 · 「라운지」 표기 없음 · AX LOUNGE 상담은 1F) · 경품 이름은 쓰지 않는다 */
/* TBD (사용자 261002) 동선 1 Welcome · 사전등록자 체크인존(건물 밖 동쪽 텐트 · 엑스배너 QR) · 이름 확인 + 사전 기념품 전달
   보류한 설계 쟁점: 체크인 = QR 을 찍는 행위(로그인과 별개 · 미리 로그인한 사람도 잡히게) · 사원증 대조 · 체크인과 수령을 따로 기록(중복 수령) · 스태프 사번 조회 대체 경로
   필요한 것: 사번 → 물품 명단(서버에만 · 앱 코드에 넣지 않는다) · 서버 액션(체크인 · 물품 조회 · 수령) · 결정 전까지 Welcome 은 구역 목록에 넣지 않는다 */
var FLOOR1 = [
  { id: "vision", grp: "see", sign: "AX VISION", kor: "회사가 가는 방향을 보는 곳", fact: "AX 로드맵 · 영상", st: "",
    stm: "회사가 어디로 가는지 보는 곳", todo: ["AX 로드맵 2026~2028을 봐요", "키비주얼 영상을 봐요"] },
  { id: "lab", grp: "see", sign: "AX LAB", kor: "DAP 과제를 보는 곳", fact: "우수 과제 · 아이디어 한 줄 QR", st: "p5",
    stm: "DAP 과제 보고 아이디어 남기는 곳", todo: ["우수 과제와 2026 프로젝트를 봐요", "끝 판 QR로 아이디어 한 줄을 써요"], btn: ["아이디어 쓰기", "App.go('ideas')"], btnOff: function () { return ideaGateOff(); } },   /* v5.90 사전 오픈 OFF · 행사 전 = 버튼 숨김 */
  { id: "action", grp: "see", sign: "AX in Action", kor: "AI 업무 사례를 보는 곳", fact: "동료가 만든 앱 3개", st: "",
    stm: "동료가 AI로 만든 현장 앱을 보는 곳", todo: ["현장 인터뷰 영상을 봐요"],
    cases: [["강북이 - 개인 맞춤형 시상 어플리케이션", "영업 사례 · 강북조직파트 김동건 전임"], ["AI컨설팅 도우미 - 판매 화법 어플리케이션", "영업 사례 · 안양AM지점 이은정 지점장"], ["하이핑거 - 보상 업무 지원 어플리케이션", "보상 사례 · 울산대인보상센터 이승철 대리"]] },   /* v5.60 판 16 ~ 18 한 컷(말풍선 · 인용 · 기능 칩) 대신 앱 이름 + 만든 사람(소속 · 이름 · 직급은 판 글자 그대로 · 사용자 「실명 남긴다」) */
  { id: "lounge", grp: "do", sign: "AX LOUNGE", hdr: "AX 라운지", kor: "내년 DAP 과제를 1:1로 상담하는 곳", fact: "", st: "",   /* v5.94 (사용자 결정 261006) 라운지 상담은 스탬프 없음 */
    stm: "내년 DAP(데이터 분석 프로젝트) 과제로 해 볼 업무가 있다면 1:1로 상담해요",
    lead: "내년 DAP(데이터 분석 프로젝트) 과제로 해 볼 업무가 있다면 1:1로 상담해요",   /* v5.70 시트 「하는 일」 첫 줄 = DAP 풀이(v5.69 시트화로 부제 stm 이 빠지며 함께 사라졌다 · v5.65 사용자 확정 문구) */
    todo: ["데이터사이언스파트와 업무 고민을 나누고 방향을 함께 찾아요", "앱에서 30분 상담을 신청해요"],
    gd: ["아직 구체적이지 않다면 18F AX 커피챗에서 비슷한 고민을 가진 사람들과 가볍게 이야기할 수 있어요", "18F AX 커피챗 보기", "cchat"],
    chk: [["진행", "업무 설명 → 병목 → 개선방안 · 30분"], ["신청", "신청 후 승인되면 앱에서 알려 드려요"], ["기록", "상담 내용은 기록되어 행사 후 정리해 공유돼요"], ["사은품", "상담을 마치면 커피 · 쿠키 · 노트 · 볼펜"]] },   /* v5.65 (사용자 261005 「커피챗과 라운지는 권장대로」 · 정본 디자인 시안/라운지 커피챗 통일/설계안.md) 커피챗과 같은 틀 · 서로 안내(gd) · 참여 전 확인(chk) 패널 · 커피 · 간식 사진은 패널 안에만 */
  { id: "play", grp: "do", sign: "AX PLAY", kor: "AI를 직접 써 보는 곳", fact: "HiDI-Q · Hi-Helper", st: "p2",
    stm: "HiDI-Q와 Hi-Helper를 직접 써 보는 곳", todo: ["노트북에서 HiDI-Q, Hi-Helper를 써 봐요", "스태프에게 내 QR을 보여 주면 적립"], btn: ["체험 안내", "App.go('booth')"] },   /* v5.60 기능 목록 판 한 컷 2장 삭제(판 · 모형에 있다) */
  { id: "event", grp: "do", sign: "EVENT", kor: "사진 · 룰렛 · 타자왕이 있는 곳", fact: "", st: "",
    stm: "사진 · 룰렛 · 타자 겨루기", todo: ["AI 포토부스에서 ME to WE 프레임 사진을 찍어요", "스탬프 3개를 모으면 룰렛 1회예요", "1F 타자왕 순위를 봐요"] }   /* v5.05 옛 「AI 포토부스에서 번호표를 받아요」(대기 폐지 · PHOTO_Q) */
];
/* v5.20 (사용자 261003 후킹 권장 1) 구역 상세 「판 한 컷」 · 사진 = assets/zone/<img>.webp(1층 판 p16 ~ 18 · p24 · p28 ~ 29 에서 잘라 폭 860 · 장당 60KB 이하)
   pic = [파일, 이름, 쓰임, 높이] · 지연 로딩 · 못 읽으면 칸째 지운다 · AX in Action 컷에는 판에 인쇄된 직함 · 이름이 그대로 있다(사용자 261003 「실명 넣자」)
   ex = 한 줄 + 예시 칩(누르지 않는 칩) · treat = 커피 · 간식 사진 2장(treatHtml)
   v5.60 (사용자 261004 「상시 운영 부스 소개를 간명하게 · 모형이 있으니 투머치인포메이션은 덜어내자」 · design.md §7 참여자 중심) 판 · 모형 복제를 뺐다
   지금 쓰는 곳 없음(pic · ex · treat 를 다시 적으면 그대로 그린다) · cases = [앱 이름, 사례 · 소속 이름 직급] 글 목록(AX in Action) · 지운 데이터 = 루트 「정리 기록.md」 v5.60 절 */
var ZONE_DIR = "assets/zone/";
function zonePicHtml(z) {
  var o = z.pic ? '<div class="axs-zpic">' + z.pic.map(function (p) {
    return "<figure><figcaption><b>" + esc(p[1]) + "</b>" + (p[2] ? "<span>" + esc(p[2]) + "</span>" : "") + "</figcaption>" +
      '<img src="' + ZONE_DIR + p[0] + '.webp" alt="' + esc(p[1] + (p[2] ? " · " + p[2] : "") + " · 1층 판") + '" width="860" height="' + p[3] + '" loading="lazy" decoding="async" onerror="this.parentNode.remove()"></figure>';
  }).join("") + "</div>" : "";
  if (z.treat) o += treatHtml();
  return o;
}
function zoneCaseHtml(z) {
  return z.cases ? '<hr class="axs-rule"><div class="axs-zcase"><h3>사례 ' + z.cases.length + "개</h3>" + z.cases.map(function (c) { return "<p><b>" + esc(c[0]) + "</b><span>" + esc(c[1]) + "</span></p>"; }).join("") + "</div>" : "";
}
function zoneExHtml(z) {
  return z.ex ? '<hr class="axs-rule"><div class="axs-zex"><h3>' + esc(z.ex.h) + '</h3><div class="axs-chiprow">' + z.ex.c.map(function (c) { return '<span class="axs-chip">' + esc(c) + "</span>"; }).join("") + "</div></div>" : "";
}
/* v5.65 18F = AX 커피챗 하나(「라운지」 표기 없음) · 1F AX LOUNGE 와 같은 구역 상세(zone_d) 틀 · 한 줄 = 질문 3줄(q) · 시간은 매칭 후 앱에서 안내(운영 시간 확정 문서 없음)
   상태 · 주 버튼 = zoneLive cchat(옛 프로그램 탭 18F 줄 ccSub · 옛 상세 progDetail 신청 전 분기를 옮겼다) · 신청한 뒤 「내 신청」 = 프로그램 상세(sess_d · 매칭 · 취소) */
var FLOOR18 = [
  { id: "cchat", grp: "", sign: "AX COFFEE CHAT", hdr: "AX 커피챗", kor: "비슷한 고민을 가진 사람들과 이야기하는 곳", fact: "", st: "",   /* v5.94 (사용자 결정 261006) 커피챗은 스탬프 없음 */
    q: ["내 업무에 AI를 쓸 수 있을까?", "나와 비슷한 고민을 하는 사람이 있을까?", "어떻게 시작하지?"],
    todo: ["비슷한 고민을 가진 사람들과 멘토가 한 테이블에서 다음 한 걸음을 찾아요", "아이디어 한 줄을 내고 커피챗 희망을 남겨요"],
    gd: ["과제로 키우고 싶은 업무가 있다면 1F AX 라운지에서 1:1로 상담할 수 있어요", "1F AX 라운지 보기", "lounge"],
    chk: [["진행", "주제 소개 → 고민 나누기 → 다음 한 걸음"], ["시간", CCHAT_HOURS + " · 고른 시간대에 맞춰 정해요"], ["선정", "희망한 분 중 선정해요"], ["알림", "선정되면 하이웍스 · 앱 알림으로 알려 드려요"]]   /* v6.07 (사용자 261007) 옛 정원 30명 → 희망자 중 선정 · 운영 13:00~16:00 */   /* v5.97 (사용자 261006 밤) 두 문장 = 두 줄(마침표 없이 · 표 값의 \n = 줄바꿈) */ }
];
function zoneById(id) { return FLOOR1.concat(FLOOR18).filter(function (z) { return z.id === id; })[0] || null; }
function zoneOpen(id) { PROG.zone = id; PROG.zchk = false; App.go("zone_d"); }
/* v5.65 커피챗 입구 하나 · 신청(또는 참석)이 있으면 프로그램 상세 · 없으면 구역 상세 · v5.82 이름 cchatGo(새 입구 세 곳이 부른다) · cchatOpen 은 별칭(둘러보기 · 옛 호출) */
function cchatGo() { if (S.get("cchat", null) || S.get("cchat_att", false)) progOpen("cchat"); else zoneOpen("cchat"); }
function cchatOpen() { cchatGo(); }
/* ═══ v5.82 (사용자 261006 「커피챗 앞으로」 결정 2) 커피챗 신청 입구 · v5.85 (사용자 261006 「프로그램 세 칸」) 프로그램 탭 입구는 [신청하기] 칸 카드로 옮겼다(시간표 맨 위 두 줄 삭제)
   홈 나의 일정 한 줄(신청 전만) = 공용 행 카드(rcHtml) + 왼쪽 연주황 뱃지 「신청」 · 누르면 프로그램 › 신청하기 칸(progApplyGo)
   cchatState = null(숨김: 참석 완료 · 마감 · 행사 끝난 뒤 신청 전) · { t: 보조 글, mine: 신청함 } */
function cchatState() {
  var c = S.get("cchat", null);
  if (S.get("cchat_att", false)) return null;
  if (c && c.status === "matched") return { t: "선정" + (c.round ? " · " + c.round : "") + (c.table ? " TABLE " + c.table : ""), mine: true, chip: "선정" };
  if (cchatOver()) return null;   /* v6.07 커피챗 하루가 끝나면(16:00) 선정 전 희망 · 희망 전 줄을 조용히 걷는다 */
  if (c) return { t: "희망 접수 · 선정되면 알려 드려요", mine: true, chip: "희망함" };
  if (cchatClosed()) return null;
  return { t: ideaMineN() ? "희망할 수 있어요" : "아이디어 한 줄 쓰고 희망", mine: false };   /* v6.07 신청 → 희망 · 매칭 → 선정(사용자 261007) */
}
/* 홈 나의 일정 · 신청 전에만(신청한 뒤에는 나의 일정 커피챗 줄이 맡는다) · 장소는 아래 줄 */
function cchatRowHtml() {
  var s = cchatState(); if (!s || s.mine) return "";
  return rcHtml({ cls: "", onclick: "progApplyGo()", link: true, left: tokBadge("희망", ""), title: "AX 커피챗", sub: esc(s.t), place: "18F" }).replace('<div class="rc', '<div data-apply="cchat" class="rc');
}
/* AX 라운지 · 상태 = zoneLive lounge(남은 시간 · 내 신청) · null = 숨김(마감 · 상담 완료 · v5.82 줄과 같은 규칙) · { t: 지금, mine: 신청함 } */
function loungeState() {
  var L = zoneLive(zoneById("lounge")), r = myResv(), mine = !!(r && RESV_LIVE.indexOf(r.status) >= 0);
  if (L.chip && (L.chip[0] === "마감" || L.chip[0] === "완료")) return null;
  return { t: mine ? (RESV_ST[r.status] || "신청 완료") + " · " + r.slot : "남은 시간 " + resvRemain() + "개", mine: mine };
}
/* 신청 전이고 지금 신청할 수 있는 곳 수(세그먼트 주황 점) · 둘 다 신청했거나 마감이면 0 */
function applyOpenN() {
  var c = cchatState(), l = loungeState();
  return (c && !c.mine ? 1 : 0) + (l && !l.mine ? 1 : 0);
}
/* ═══ v5.85 프로그램 › [신청하기] 칸 = 앱에서 신청받는 두 곳 카드(AX 커피챗 · AX 라운지) + 맨 아래 10F 줄(사전 신청자 · 테스트 사번만) ═══
   카드 = 층 점 글자 + 이름 + (신청함 칩) → 한 줄 → 사실 표(지금 · 시간 · 라운지 사은품 · 커피챗 아이디어 조건은 「지금」 한 줄이 말한다) → (커피챗만 커피 · 간식 사진) → 주 버튼 + 약한 「자세히 보기」(구역 상세 시트)
   주 버튼 = 구역 상세 시트 주 버튼과 같은 동작(zoneLive btn) · 커피챗 = 아이디어 쓰고 신청하기 · 커피챗 신청하기(시간대 시트) · 내 신청 / 라운지 = 시간 고르기 · 내 신청
   숨김 = 커피챗 cchatState null · 라운지 마감 · 상담 완료(v5.82 줄과 같은 규칙) · 둘 다 숨으면 빈 상태 한 줄 */
function applyCardHtml(o) {
  return '<section class="ax-card axs-apc' + (o.mine ? " my" : "") + '" data-apply="' + o.k + '" aria-label="' + esc(o.nm) + '">' +
    '<div class="hd"><span class="fl">' + flFloor(o.fl) + '</span><h3 class="ax-card-title">' + esc(o.nm) + "</h3>" + (o.mine ? '<span class="axs-chip">' + esc(o.chip || "신청함") + "</span>" : "") + "</div>" +
    '<p class="k">' + esc(o.kor) + "</p>" +
    '<dl class="axs-kv">' + o.kv.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" + (o.extra || "") +
    '<div class="bt">' + progBtn(esc(o.btn[0]), o.btn[1], "", "", !!o.btn[3]) +
    '<button type="button" class="ax-link axs-plain" onclick="' + o.more + '">자세히 보기</button></div></section>';
}
function applyCchatHtml() {
  var s = cchatState(); if (!s) return "";
  var z = zoneById("cchat"), L = zoneLive(z), c = S.get("cchat", null), mt = !!(c && c.status === "matched");
  var kv = [["지금", s.mine ? s.t : ideaMineN() ? "아이디어 제출 완료 · 희망할 수 있어요" : "아이디어 한 줄 쓰면 희망할 수 있어요"], ["시간", mt && c.round ? "10월 26일 " + c.round : CCHAT_HOURS + " · 선정되면 안내"], ["사은품", "커피 · 쿠키 · 노트 · 볼펜"]];   /* v5.90 · v6.07 희망 → 선정 · 13:00~16:00 */
  return applyCardHtml({ k: "cchat", nm: "AX 커피챗", fl: 18, mine: s.mine, chip: s.chip, kor: z.kor, kv: kv, extra: treatHtml(), btn: L.btn, more: "cchatGo()" });
}
function applyLoungeHtml() {
  var s = loungeState(); if (!s) return "";
  var z = zoneById("lounge"), L = zoneLive(z);
  var btn = s.mine ? ["내 신청", "progOpen('dap')"] : ["시간 고르기", "progOpen('dap')"];
  return applyCardHtml({ k: "lounge", nm: "AX 라운지", fl: 1, mine: s.mine, kor: z.kor, kv: [["지금", s.t], ["시간", L.tm + " · 1:1 30분"], ["사은품", "커피 · 쿠키 · 노트 · 볼펜"]], btn: btn, more: "zoneOpen('lounge')" });
}
/* 10F 실습형 세션 줄 = 사전 신청자(10F 명단 · tenMine)와 테스트 사번(testMode · 310555 · 데모)에게만 · 일반 직원에게는 없다(사용자 261006) */
function applyTenShow() { return !!tenMine() || testMode(); }
function applyTenHtml() {
  if (!applyTenShow()) return "";
  return '<div class="axs-rows">' + rcHtml({ cls: "", onclick: "progTenGo()", link: true, left: rcIcon(App.ICONS.guide), title: "10F 실습형 세션", sub: "사전 신청자 참여" }).replace('<div class="rc', '<div data-apply="ten" class="rc') + "</div>";
}
function progApplyTabHtml() {
  var h = applyCchatHtml() + applyLoungeHtml();
  return '<div class="axs-apply" aria-label="신청하기">' + (h || '<p class="ax-description axs-apnone">지금 신청할 수 있는 프로그램이 없어요</p>') + applyTenHtml() + "</div>";
}
/* v5.65 「참여 전 확인」 펼침 = 같은 화면 패널(시트 아님 · 설계안 결정 1) · 다시 그리지 않고 패널만 연다 · 닫는다 */
function zoneChkToggle(b) {
  var p = el("zChk"); if (!p) return;
  var on = p.hidden; p.hidden = !on; PROG.zchk = on; b.setAttribute("aria-expanded", String(on));
  if (DET.cur) DET.cur.zchk = on;
  if (on && p.closest("#axsDet")) { p.scrollIntoView({ block: "nearest", behavior: lgxRM() ? "auto" : "smooth" }); detOv(); return; }   /* v5.69 시트 = 시트 본문 안에서 펼친 표가 보이게 */
  if (on) { var r = p.getBoundingClientRect(), tb = el("tabbar"), lim = window.innerHeight - (tb && tb.style.display !== "none" ? tb.offsetHeight : 0); if (r.top > lim - 120) p.scrollIntoView({ block: "nearest" }); }
}
/* ── 구역 간판 칩 · v5.10 부스 원본 사인 글자(점 글자 DotGlyph · design.md A-5 5-20) · 줄 24 · 점 12px · 상세(lg) 26 · 점 14px
   옛 Neo둥근모 근사와 그림 교체 지점 ZONE_SIGN_IMG 는 폐기(이 .ai 가 그 원본이다) · 읽는 이름은 칩(role img)이 준다 · 「AX in Action」은 대문자로 그린다 ── */
function zoneSign(nm, cls) {
  var c = "axs-sign" + (cls ? " " + cls : ""), big = /(^| )lg( |$)/.test(cls || "");
  return '<span class="' + c + '" role="img" aria-label="' + esc(nm) + '">' + DotGlyph.svg(nm, { h: big ? 14 : 12, hidden: true }) + "</span>";
}
/* v4.95 (사용자 261002 「프로그램에도 회색 스탬프가 있다가 활동을 하면 색이 바뀌는 식」) 공통 부품 K6 · 작은 도장 + 한 단어 · 번호 없음
   받은 판정 = S stamps(스탬프 탭 줄 stpRowHtml · 활동 화면 도장 stampTagHtml 과 같은 원천) · 판 퀴즈 등 다른 판 화면도 이 함수 하나를 쓴다 */
function stampMkHtml(id, word) {
  var got = S.get("stamps", []).indexOf(id) >= 0;
  return '<span class="axs-smk' + (got ? " on" : "") + '" role="img" aria-label="' + (got ? "스탬프 받음" : "스탬프 받기 전") + (word ? " · " + esc(word) : "") + '">' + stampSealSvg(24, "currentColor", "") + "</span>" +
    (word ? '<span class="axs-pt' + (got ? " on" : "") + '" aria-hidden="true">' + esc(word) + "</span>" : "");
}
/* 구역 줄 · 상세의 스탬프 표시 · 걸린 스탬프(지금 체계에 있는 것)만 도장 · EVENT 룰렛은 스탬프가 아니라 도장 없이 회색 한 줄 · 쓸 수 있으면 주황 강조(홈 다음 스탬프 카드와 같은 판정)
   v4.99 (사용자 261002 「> 화살표를 고려해 오른쪽에 · 기조연설 상세처럼」) 도장 = 활동 화면 도장 stampTagHtml(받기 전 회색 「스탬프」 · 받은 뒤 「완료」) · 줄은 셰브론 바로 왼쪽 · 상세는 오른쪽 위 */
function zoneStampHtml(z) {
  if (z.id === "event") {
    var can = stampCount() >= 3 && !S.get("roulette_used", false) && !S.get("roulette_out", false);
    return can ? '<span class="axs-pt on">룰렛 1회 사용 가능</span>' : '<span class="axs-pt">스탬프 3개면 룰렛 1회</span>';
  }
  if (!z.st || !STAMPS.some(function (x) { return x.id === z.st; })) return "";
  return stampTagHtml(z.st);
}
/* 지금 상태 · 원천은 옛 메뉴와 같다(myResv · RESV_ST · resvRemain) · fact = 줄 보조 한 줄 · chip = 간판 오른쪽 상태 칩 · kv = 상세 사실 표 · btn = 상세 행동 */
function zoneLive(z) {
  var o = { fact: z.fact, chip: null, kv: null, btn: z.btn && !(z.btnOff && z.btnOff()) ? z.btn : null };   /* v5.90 btnOff = 입구 숨김(아이디어 사전 오픈 OFF · 행사 전) */
  if (z.id === "lounge") {
    var r = myResv(), rl = r && RESV_LIVE.indexOf(r.status) >= 0, dn = r && r.status === "done", n = resvRemain();
    var now = rl ? (RESV_ST[r.status] || "신청 완료") + " " + r.slot : dn ? "상담 완료" : n > 0 ? "남은 시간 " + n + "개" : resvSlots().every(resvPast) ? "오늘 상담 접수 마감" : "오늘 상담 시간이 모두 찼어요";   /* 261005 지난 시간뿐이면 「모두 찼어요」가 아니라 마감 */
    o.tm = RESV_CONF.start + "~" + RESV_CONF.end;
    o.fact = o.tm + " · " + now;
    o.chip = rl ? ["내 신청", ""] : dn ? ["완료", "ok"] : n > 0 ? null : ["마감", "off"];
    o.kv = [["지금", now], ["장소", "1F AX 라운지"]];
    o.btn = [rl || dn ? "내 신청" : n > 0 ? "상담 신청" : "상담 안내", "progOpen('dap')"];
  } else if (z.id === "cchat") {
    /* v5.65 옛 프로그램 탭 18F 줄 상태(ccSub) · 옛 상세 신청 전 주 버튼(아이디어 쓰기 · 커피챗 신청하기 · 신청 마감)을 여기 한 곳으로 */
    var c = S.get("cchat", null), att = S.get("cchat_att", false), mt = !!(c && c.status === "matched"), cl = !c && !att && cchatClosed();
    var ino = !att && !c && !cl && !ideaMineN();   /* v5.82 아이디어 0건 · 신청 전 = 한 흐름 「아이디어 쓰고 신청하기」(제출하면 시간대 고르는 화면이 이어진다) */
    /* v6.07 (사용자 261007) 희망 → 선정 · 하루가 끝나면(16:00) 선정 전 = 「오늘 커피챗은 끝났어요」 · 선정 안 됨은 따로 알리지 않는다 */
    var ov = !att && !mt && cchatOver(), cl = !c && !att && !ov && cchatClosed();
    var ino = !att && !c && !cl && !ov && !ideaMineN();   /* v5.82 아이디어 0건 · 희망 전 = 한 흐름 「아이디어 쓰고 희망하기」(제출하면 희망 묶음이 이어진다) */
    var cnow = att ? "참석 완료" : mt ? "선정" + (c.table ? " · TABLE " + c.table : "") : ov ? "오늘 커피챗은 끝났어요" : c ? "희망 접수" : cl ? "희망 접수 마감" : ino ? "아이디어 한 줄 쓰면 희망할 수 있어요" : "아이디어 제출 완료 · 희망할 수 있어요";
    o.tm = mt && c.round ? "10월 26일 " + c.round : CCHAT_HOURS + " · 선정되면 안내";
    o.fact = mt && c.round ? cnow.replace("선정", "선정 · " + c.round) : ino ? "아이디어 한 줄 쓰고 희망" : cnow;
    o.chip = att ? ["완료", "ok"] : mt ? ["선정", ""] : ov ? ["끝", "off"] : c ? ["희망함", ""] : cl ? ["마감", "off"] : null;
    o.kv = [["지금", cnow], ["장소", "18F"]];
    o.btn = att || mt || (c && !ov) ? ["내 커피챗", "progOpen('cchat')"] : ov ? ["오늘 커피챗은 끝났어요", "", "", true] : cl ? ["희망 접수 마감", "", "", true] : ideaMineN() ? ["커피챗 희망하기", "cchatApplyOpen()", "cchatApplyBtn"] : ["아이디어 쓰고 희망하기", "ideaCcGo()"];   /* v5.83 커피챗 흐름의 아이디어 쓰기(화면 위 한 줄 · 제출하면 희망 묶음) */
  } else if (z.id === "event") {
    o.kv = [["포토부스", "10:00~17:00"], ["장소", "1F EVENT"]];   /* v5.05 포토부스 대기 없음 · 운영 시간만 */
  }
  return o;
}
function zoneChip(c) { return c ? '<span class="axs-chip' + (c[1] ? " " + c[1] : "") + '">' + esc(c[0]) + "</span>" : ""; }
/* 구역 줄 하나 · 왼쪽 = 간판 + (상태 칩) → 한국어 한 줄 → 보조 한 줄 → (EVENT 룰렛 한 줄) · 오른쪽 = 스탬프 도장(걸린 곳만) + 셰브론 · 줄 전체 = 구역 상세
   v4.99 도장을 줄 아래에서 셰브론 바로 왼쪽으로(줄 높이는 왼쪽 글이 정한다 · 도장 44px) · 상태 칩은 간판 옆 */
function zoneRowHtml(z) {
  var L = zoneLive(z), pill = zoneStampHtml(z), ev = z.id === "event";
  var head = '<span class="zl"><span class="hd">' + zoneSign(z.sign) + zoneChip(L.chip) + "</span>" +
    '<span class="tx"><span class="k">' + esc(z.kor) + "</span>" + (L.fact ? '<span class="f">' + esc(L.fact) + "</span>" : "") + "</span>" +
    (ev && pill ? '<span class="cr">' + pill + "</span>" : "") + "</span>" +
    '<span class="zrt">' + (ev ? "" : pill) + CHEV_SVG + "</span>";
  var btn = '<button type="button" class="axs-zr" data-zone="' + z.id + '" onclick="zoneOpen(\'' + z.id + '\')">' + head + "</button>";
  if (z.id !== "event") return btn;
  /* EVENT = 같은 머리 + 얇은 ink 줄로 나뉜 안쪽 두 줄(포토부스 · 타자왕)은 그 화면으로 바로 */
  return '<div class="axs-zc">' + btn +
    '<button type="button" class="axs-zin" onclick="typeSiteRankGo()"><span class="tx"><b>1F 타자왕 순위</b><span>17:00 마감</span></span><span class="act">보기</span></button></div>';   /* v4.91 스탬프 탭에서 옮긴 1F 타자왕 · EVENT 구역 */
}
function progAlwaysHtml() {
  var grp = function (g, nm) { return '<p class="axs-dot">' + nm + "</p>" + FLOOR1.filter(function (z) { return z.grp === g; }).map(zoneRowHtml).join(""); };
  var cz = FLOOR18[0], cL = zoneLive(cz);   /* v5.65 18F 줄 = 구역 표(FLOOR18) · 상태 = zoneLive · 누르면 구역 상세(zone_d · 1F AX LOUNGE 와 같은 틀) */
  return '<section class="axs-zsec" id="zone1f"><div class="axs-bar"><b>1F 로비</b><span>행사 시간 중 자유 관람</span></div>' + tourRowHtml() + grp("see", "둘러보기") + grp("do", "참여하기") + "</section>" +
    '<section class="axs-zsec" id="zone18f"><div class="axs-bar"><b>18F</b><span>소규모 아이디어 논의</span></div>' +
    '<button type="button" class="axs-zfl" data-zone="cchat" onclick="zoneOpen(\'cchat\')"><span class="tx"><span class="nm">' + zoneSign(cz.sign) + zoneChip(cL.chip) + '</span><span class="k">' + esc(cz.kor) + '</span><span class="f">' + esc(cL.fact) + "</span></span>" +
    '<span class="zrt">' + zoneStampHtml(cz) + CHEV_SVG + "</span></button></section>";
}
/* 구역 상세 · 간판 칩(v4.94 포인트 크기) → 부제 한 줄 → 보조 줄(운영 시간 · 룰렛 · 스탬프 없음) → 얇은 ink 줄 → 하는 일(주황 점) → (사실 표) → 행동 버튼 하나(있을 때만) · 뒤로 = 프로그램
   v4.99 스탬프 도장 = 카드 오른쪽 위(강연 상세 sess_d 와 같은 axs-sthost · stampTagHtml) */
/* v5.65 AX LOUNGE · AX 커피챗 = 같은 부품(설계안 2절) · 간판 → 한 줄(커피챗 = 질문 3줄) → 시간 → 하는 일 → 지금 · 장소 → 서로 안내(카드 맨 아래 · 약한 링크) → 주 버튼 → 「참여 전 확인」 약한 버튼 → (펼침) 확인 표 + 커피 · 간식 사진 2장
   펼침 상태 PROG.zchk(구역에 새로 들어오면 접힘) · 사은품 줄은 LOUNGE 에만(260918 예외) · 둘러보기 엘리베이터에서 왔으면 떠 있는 「3D로 돌아가기」(v5.67 · 옛 v5.65 맨 아래 버튼 없앰) */
function zonePairHtml(z, L) {
  var head = z.q ? '<p class="axs-xq">' + z.q.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</p>" : '<p class="axs-bar stm">' + esc(z.stm) + "</p>";
  var b = L.btn || ["", ""], open = !!PROG.zchk;
  var chk = '<section class="axs-zdt axs-xchk" id="zChk" aria-label="참여 전 확인"' + (open ? "" : " hidden") + '><dl class="axs-kv">' + z.chk.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]).replace(/\n/g, "<br>") + "</dd>"; }).join("") + "</dl>" + treatHtml() + "</section>";
  return '<div class="ax-stack axs-pan"><div class="axs-zdt axs-sthost">' + zoneStampHtml(z) + zoneSign(z.sign, "lg") + head +
    '<div class="cr"><span class="axs-pt">' + esc(L.tm || "") + "</span></div>" +
    '<hr class="axs-rule"><div class="axs-todo"><h3>하는 일</h3>' + z.todo.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>" +
    '<hr class="axs-rule"><dl class="axs-kv">' + L.kv.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
    '<hr class="axs-rule"><div class="axs-xgd"><p class="axs-bar stm">' + esc(z.gd[0]) + '</p><button type="button" class="ax-link axs-plain axs-self" onclick="zoneOpen(\'' + z.gd[2] + '\')">' + esc(z.gd[1]) + "</button></div></div>" +
    '<div class="axs-xbtns">' + progBtn(esc(b[0]), b[1], "", b[2] || "", !!b[3]) +
    '<button type="button" class="ax-button ax-button-weak axs-xtog" aria-expanded="' + open + '" aria-controls="zChk" onclick="zoneChkToggle(this)">참여 전 확인' + CHEV_SVG + "</button>" +
    "</div>" + chk + tourFloorBackHtml() + "</div>";
}
function zoneDetailHtml() {
  var z = zoneById(PROG.zone) || FLOOR1[0], L = zoneLive(z), pill = zoneStampHtml(z), ev = z.id === "event", seal = pill && !ev;
  if (z.gd) return zonePairHtml(z, L);
  var cr = ev ? pill : seal ? (L.tm ? '<span class="axs-pt">' + esc(L.tm) + "</span>" : "") : '<span class="axs-pt">자유 관람 · 스탬프 없음</span>';
  return '<div class="ax-stack axs-pan"><div class="axs-zdt' + (seal ? " axs-sthost" : "") + '">' + (seal ? pill : "") + zoneSign(z.sign, "lg") +
    '<p class="axs-bar stm">' + esc(z.stm) + "</p>" + (cr ? '<div class="cr">' + cr + "</div>" : "") +
    '<hr class="axs-rule"><div class="axs-todo"><h3>하는 일</h3>' + z.todo.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>" + zoneCaseHtml(z) + zoneExHtml(z) +
    (L.kv ? '<hr class="axs-rule"><dl class="axs-kv">' + L.kv.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" : "") +
    "</div>" + (ev && EV_TYP_PROMO ? typPromoHtml("go") : "") + zonePicHtml(z) + (L.btn ? '<button type="button" class="ax-button" onclick="' + L.btn[1] + '">' + esc(L.btn[0]) + "</button>" : "") + "</div>";   /* v5.60 E (사용자 261004 「모형에서 보기 굳이 없어도 될 버튼 · 여기서 길 잃는 수석님 많을 듯」) 구역 상세의 「모형에서 보기」 삭제 · 둘러보기 입구 = 상시 운영 맨 위 카드 · 홈 줄 */
}
/* ═══ v5.69 구역 상세 시트(detPaint · 라우트 zone_d) · 1F 6구역 + 18F AX 커피챗 · v5.65 통일 구역 상세(zonePairHtml)의 순서 그대로 · 판 문법 경계 = 시트(pan)
   머리 = 간판 칩 + 상태 칩 → 한국어 한 줄(제목) · 오른쪽 위 도장(v5.79 머리 = 간판만 · 상태 칩 · 한국어 한 줄 · 도장은 본문 첫 줄) · 본문 = (커피챗 질문 3줄) · 시간 · 룰렛 한 줄 → 하는 일 → (사례) → 지금 · 장소 → 서로 안내 → 참여 전 확인 펼침 → (EVENT 타자왕 홍보 · 판 한 컷)
   주 버튼(상담 신청 · 커피챗 신청 · 아이디어 쓰기 · 체험 안내)은 아래 고정 · 버튼이 없는 구역(VISION · in Action · EVENT)은 아래 칸 없음
   옛 부제(stm)는 쓰지 않는다 · 제목(kor)과 같은 말을 두 번 하던 자리(문구 다이어트) */
function zoneSheet() {
  var z = zoneById(PROG.zone) || FLOOR1[0], L = zoneLive(z), pill = zoneStampHtml(z), ev = z.id === "event", seal = pill && !ev;
  var meta = ev ? pill : L.tm ? '<span class="axs-pt">' + esc(L.tm) + "</span>" : seal ? "" : '<span class="axs-pt">자유 관람 · 스탬프 없음</span>';
  var kv = L.kv ? '<dl class="axs-kv">' + L.kv.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" : "";
  var open = !!PROG.zchk, b = L.btn;
  var body = (z.q ? '<p class="axs-xq">' + z.q.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</p>" : "") +
    (meta ? '<div class="cr">' + meta + "</div>" : "") +
    '<hr class="axs-rule"><div class="axs-todo"><h3>하는 일</h3>' + (z.lead ? [z.lead] : []).concat(z.todo).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>" + zoneCaseHtml(z) + zoneExHtml(z) +
    (kv ? '<hr class="axs-rule">' + kv : "") +
    (z.gd ? '<hr class="axs-rule"><div class="axs-xgd"><p class="axs-bar stm">' + esc(z.gd[0]) + '</p><button type="button" class="ax-link axs-plain axs-self" onclick="zoneOpen(\'' + z.gd[2] + '\')">' + esc(z.gd[1]) + "</button></div>" : "") +
    (z.chk ? '<button type="button" class="ax-button ax-button-weak axs-xtog" aria-expanded="' + open + '" aria-controls="zChk" onclick="zoneChkToggle(this)">참여 전 확인' + CHEV_SVG + "</button>" +
      '<section class="axs-xchk" id="zChk" aria-label="참여 전 확인"' + (open ? "" : " hidden") + '><dl class="axs-kv">' + z.chk.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]).replace(/\n/g, "<br>") + "</dd>"; }).join("") + "</dl>" + treatHtml() + "</section>" : "") +
    (ev && EV_TYP_PROMO ? typPromoHtml("go") : "") + zonePicHtml(z);   /* v5.96 (사용자 261006 밤 「여기에 타자왕 광고는 없애줘」) EVENT 구역 상세 = 홍보 칸 없음 · 스위치 EV_TYP_PROMO */
  return { cls: "axs-pan", name: zoneSign(z.sign, "lg"), chips: zoneChip(L.chip), title: esc(z.kor), seal: seal ? pill : "", body: body,   /* v5.79 머리 이름 = 구역 간판 하나(현장 부스 사인과 같은 글자 · 한국어 이름을 따로 두지 않는다) · 상태 칩 · 한국어 한 줄 · 도장 = 본문 첫 줄 */
    foot: b ? progBtn(esc(b[0]), b[1], "", b[2] || "", !!b[3]) : "" };
}
function progOpen(id) { PROG.sid = id; App.go("sess_d"); }
var RESV_ST = { requested: "승인 대기", booked: "승인 대기", approved: "승인 완료", checked: "상담 중", done: "상담 완료" };
/* 내 것인가 (헤더 제목 「신청 관리」 · M03) */
function progMine(id) {
  if (id === "dap") { var r = myResv(); return !!(r && RESV_HOLD.indexOf(r.status) >= 0); }
  if (id === "cchat") return !!S.get("cchat", null);
  return false;   /* v5.60 T10 10F 세션(info)은 신청을 앱에서 관리하지 않는다 · 헤더 = 「프로그램」 */
}
/* 목록 상태 한 줄 [글, 색] · ok = success · off = muted · "" = brandText */
function progState(s) {
  if (s.kind === "open") return attUi(s.id) && attStLbl(s.id) ? [attStLbl(s.id), "ok"] : [s.id === "expo" ? "자유 입장" : "자유 참석", ""];   /* v5.68 입장 · 끝 둘 다 = 출석 완료 · 하나만 = 입장 출석 | 끝 출석 */   /* v4.26 17F 는 출석하면 「출석 완료」 · v4.38 강연 = 「자유 참석」(시간표 딱지와 같은 말) · 전시 = 「자유 입장」 */
  if (s.kind === "info") return ATT10_UI && sessMine(s.id) && attMineK(s.id, "out") ? ["출석 완료", "ok"] : sessMine(s.id) ? ["사전 신청 완료", "ok"] : ["사전 신청자 참여", ""];   /* v5.60 T3 · v5.71 끝 QR 출석 = 출석 완료 */
  if (s.id === "dap") {
    var r = myResv();
    if (r && RESV_HOLD.indexOf(r.status) >= 0) return [RESV_ST[r.status] || "신청 완료", "ok"];
    var n = resvRemain();
    return n <= 0 ? ["마감", "off"] : ["신청 가능 · 남은 시간 " + n + "개", ""];
  }
  if (s.id === "cchat") {
    var c = S.get("cchat", null);
    return !c ? (ideaMineN() ? ["희망할 수 있어요", ""] : ["아이디어 한 줄 쓰고 희망", ""]) : c.status === "matched" ? ["선정", "ok"] : ["희망 접수", "ok"];   /* v6.07 */
  }
  return ["", ""];
}
function progBtn(lbl, on, cls, id, dis) {
  return '<button type="button" class="ax-button' + (cls ? " " + cls : "") + '"' + (id ? ' id="' + id + '"' : "") + (dis ? " disabled" : ' onclick="' + on + '"') + ">" + lbl + "</button>";
}
/* v5.20 (사용자 261003 후킹 권장 4) 17F 연사 사진 · assets/speaker/<세션 id>.webp(정사각 · 240px 이상) 파일만 넣으면 이니셜 자리에 사진이 덮인다
   id = intro(CEO) · key(CTO) · road(디지털전략본부장) · l1(AWS) · l2(MS) · outro(CSO) · 파일이 없으면 img 를 지우고 이니셜 그대로(이 세션 동안 다시 묻지 않는다) */
var SPK_DIR = "assets/speaker/", SPK_IDS = ["intro", "key", "road", "l1", "l2", "outro"], SPK_NA = {};
function spkAvHtml(id, av) {
  var sp = SPK_IDS.indexOf(id) >= 0, on = sp && !SPK_NA[id];
  return '<span class="axs-av' + (sp ? " spk" : "") + '" aria-hidden="true">' + esc(av) +
    (on ? '<img src="' + SPK_DIR + id + '.webp" alt="" width="240" height="240" loading="lazy" decoding="async" onerror="SPK_NA[\'' + id + '\']=1;this.remove()">' : "") + "</span>";
}
/* v5.60 10F 세션 안내 · 소제목 「하는 일」(1F 구역 상세와 같은 ink 굵게 + 얇은 구분선) · 주황 점 글머리 · 이름이 있으면 굵게 + 설명 아래 줄
   「준비할 것」은 사전 신청자(sessMine)에게만 · 한 줄 소개는 SESS_INTRO_ON 일 때만 · 다 비면 "" (블록 자체를 그리지 않는다) */
function sessGuideHtml(s, mine) {
  var li = function (it) { return '<li><span class="tx">' + (it.name ? "<b>" + esc(it.name) + "</b>" : "") + "<span>" + esc(it.desc) + "</span>" + (it.sub || []).map(function (x) { return '<span class="sb">' + esc(x) + "</span>"; }).join("") + "</span></li>"; };
  var intro = SESS_INTRO_ON && s.intro ? '<p class="intro">' + esc(s.intro) + "</p>" : "";
  var todo = (s.todo || []).length ? '<div class="sgg"><h3>하는 일</h3><ul>' + s.todo.map(li).join("") + "</ul></div>" : "";
  var pl = (s.prep || []).length, q10 = "";   /* v5.94 (사용자 결정 261006) 10F 끝 QR 스탬프 없음 · 옛 줄 「끝날 때 화면의 QR을 찍으면 스탬프 2개」(v5.71) 삭제 · 끝 QR 출석 자체는 그대로 된다 */
  var prep = mine && (pl || q10) ? '<div class="sgg sgp">' + (pl ? "<h3>준비할 것</h3><ul>" + s.prep.map(li).join("") + "</ul>" : "") + q10 + "</div>" : "";
  return intro || todo || prep ? '<section class="axs-sg"><h2 class="ax-section-title">세션 안내</h2>' + intro + todo + prep + "</section>" : "";
}
/* v5.68 (사용자 확정 261005) 17F 강의 출석 = 입장 QR 1개 + 끝 QR 1개 = 스탬프 2개 · 상세 표 두 줄(입장 QR · 끝 QR) + 지금 입장 수(서버 sync crowd.h · 그 강의일 때만)
   상태 칩 = 둘 다 「출석 완료」 · 하나만 「입장 출석」 | 「끝 출석」 · 창이 모두 끝나면 버튼 대신 시간표 */
function attStLbl(id) { var ai = attMineK(id, "in"), ao = attMineK(id, "out"); return ai && ao ? "출석 완료" : ai ? "입장 출석" : ao ? "끝 출석" : ""; }
function hallLine(id) { var c = crowdGet(), h = c && c.h; if (!h || h.id !== id) return ""; var lv = HALL_LV[h.lv] || HALL_LV.ok; return (h.n ? "입장 약 " + h.n + "명" : "입장 0명") + " · 좌석 " + lv[0]; }
function attDetailFill(D, ap, timeBtn) {
  var ai = attMineK(ap.id, "in"), ao = attMineK(ap.id, "out"), shut = attShut(ap), hl = hallLine(ap.id);
  D.st = attStLbl(ap.id) || "자유 참석"; D.stc = "ok";
  D.kv.push(["입장 QR", ai ? ai + " 출석" : attWinLbl(ap, "in")]);
  D.kv.push(["끝 QR", ao ? ao + " 출석" : attWinLbl(ap, "out")]);
  if (hl) D.kv.push(["지금", hl]);
  D.help = ai && ao ? "" : shut ? "출석 시간이 지났어요" : "";
  D.btn = (ai && ao) || shut ? timeBtn : progBtn("출석 QR 스캔", "scanOpen(\'a17\')");
}
/* 상세 한 장의 내용 · 화면(sess_d)과 확인(sess_cf)이 같은 값을 쓴다 */
function progDetail(s) {
  var D = { cat: "", org: "", title: s.ttl, who: "", whoSub: "", av: "", st: "", stc: "", kv: [], cfKv: [], extra: "", after: "", secT: "참여 전 확인해 주세요", secB: "", link: "", help: "", btn: "" };   /* v5.69 after = 확인 블록 아래(상담 완료 사은품 코드 · 「아래 코드를」 문장 바로 아래) */
  var day = "10월 26일 · ", pl = s.id === "expo" ? "1F 로비" : s.id === "dap" ? "1F AX 라운지" : sessPlace(s);
  var timeBtn = progBtn("전체 시간표 보기", "homeSched()");
  var cxBtn = progBtn("신청 취소하기", "progCancelOpen(\'" + s.id + "\')", "axs-btn-danger", "cxBtn");
  var st = progState(s); D.st = st[0]; D.stc = st[1];
  if (s.kind === "stage") {
    /* v4.99 Intro · Outro 상세 · 카드(분류 칩 · 제목 · 사람 · 사실 표) + 안내 한 묶음 · 사은품 · 경품 이름은 쓰지 않는다 */
    D.cat = s.ttl; D.title = s.sub;
    D.kv = [["일시", day + progTm(s.tm)], ["장소", pl], ["참여 방법", "신청 없이 자유 참석"]];
    if (s.id === "intro") {
      var ko = attProg("key");
      D.who = s.who; D.av = s.who; D.whoSub = "개회 인사";
      if (attUi("key")) { attDetailFill(D, ko, timeBtn); D.secB = "Intro는 기조연설과 한 묶음이에요.<br>입장할 때 QR을 한 번, 기조연설이 끝날 때 화면의 QR을 한 번 찍어요."; }   /* v5.68 Intro 는 기조연설 출석과 한 묶음(입장 · 끝 QR 이 같다) */
      else { D.st = "자유 참석"; D.stc = "ok"; D.btn = timeBtn; }   /* v5.96 (사용자 결정 261006 밤) 오전 출석 표시 끔(ATT_UI_PROGS) · 입장 · 끝 QR 줄 · 참여 전 확인 칸 · 출석 QR 스캔 단추 없음 */
      return D;
    }
    var din = !!S.get("draw_in", false), hmD = hmNow(), dwin = evPhase() === "live" && hmD >= t2m("16:40") && hmD < t2m("17:25");   /* 창 = drawCardHtml 과 같은 서버 기본 창 */
    var lc = lkCond();   /* v5.92 (사용자 261006 「럭키드로우에서 체크인 요소는 일단은 없애 놓자 · 행운권 중에서 추첨」) 참석 조건 OFF(서버 lkcond) = 체크인 줄 · 추첨 QR 단추 · 체크인 안내 없음 */
    D.who = s.who; D.av = s.who; D.whoSub = "일하는 방식";
    D.st = lc && din ? "추첨 체크인 완료" : "자유 참석"; D.stc = "ok";
    if (lc) D.kv.push(["체크인", din ? "추첨 체크인 완료" : "16:40–17:25 · 입구 QR"]);   /* 375px 한 줄 · 추첨 QR 은 아래 「현장 추첨」 */
    D.extra = '<section class="axs-dsec"><h3>진행</h3><ul class="axs-ddot"><li>CSO 마무리 연설 · 일하는 방식</li><li>DAP 우수 성과자 시상</li><li>현장 추첨</li></ul></section>';   /* v5.69 시트 = 「하는 일」과 같은 점 목록 */
    D.secT = "현장 추첨";
    D.secB = lc ? "16:40부터 대강당 입구 추첨 QR로 체크인해요.<br>체크인한 사람의 행운권 번호 중에서 뽑아요.<br>행운권은 스탬프 4개부터 생겨요." : "행운권 번호 전체에서 뽑아요.<br>당첨되면 경품은 따로 전달해요.<br>행운권은 스탬프 4개부터 생겨요.";
    D.help = din || !lc ? "" : dwin ? "현장에서만 체크인할 수 있어요" : evPhase() === "after" || (evPhase() === "live" && hmD >= t2m("17:25")) ? "추첨 체크인 마감" : "16:40부터 체크인할 수 있어요";   /* 261005 최종 QA · 행사가 끝난 뒤에도 「16:40부터」가 남던 것 */
    D.btn = lc && !din && dwin ? progBtn("추첨 QR 스캔", "qrScanOpen()") : timeBtn;
    D.pics = prizeGoHtml("draw");   /* v5.20 (사용자 261003 후킹 권장 2) 경품 입구 한 줄 · 행운권 구역으로 */
    return D;
  }
  if (s.kind === "open") {
    /* v4.26 (사용자 확정 260924) 17F 네 프로그램 = 자유 입장 + 대강당 입구 QR 출석 · 파트너사 강연(l1 · l2)도 키노트와 같은 모양 */
    var ap = attUi(s.id), par = s.id === "l1" || s.id === "l2",   /* v5.96 출석 표시 = ATT_UI_PROGS(오후 AWS · MS)만 */ org = par ? s.ttl.split(" · ")[1] || "" : "", at = ap ? attMineAt(s.id) : "";
    D.cat = s.id === "expo" ? "전시·체험" : s.id === "key" ? "기조연설" : par ? "파트너사 강연" : "내부 강연";
    D.title = s.id === "road" || par ? s.sub : s.ttl;
    if (par) { D.org = org; D.who = s.who; D.av = org || "AX"; D.whoSub = org + " · 파트너사 강연"; }
    else if (s.who) { D.who = s.who; D.av = s.who.length <= 4 ? s.who : "AX"; D.whoSub = s.id === "road" ? "내부 강연" : s.sub; }
    D.st = at ? "출석 완료" : s.id === "expo" ? "자유 입장" : "자유 참석"; D.stc = "ok";
    D.kv = [["일시", s.id === "expo" ? "10월 26일 · 행사 시간 중" : day + progTm(s.tm)], ["장소", pl], ["참여 방법", s.id === "expo" ? "신청 없이 자유 관람" : "신청 없이 자유 참석"]];
    D.secB = s.id === "expo" ? "1F 로비 6구역 · AX VISION · AX LAB · AX in Action · AX PLAY · AX 라운지 · EVENT" :
      ap ? "입장할 때 QR 한 번, 끝날 때 화면의 QR 한 번 찍어요." + (par ? "<br>입장 1개 + 끝 1개 = 스탬프 2개<br>AWS · MS 합쳐 2개까지" : "") + (s.desc ? "<br>" + esc(s.desc) : "") :   /* v5.96 (사용자 261006 밤 도장 ×2) 강연 하나로 2개를 다 채운다는 뜻 */   /* v5.68 입장 1 + 끝 1 · v5.94 (사용자 결정 261006) 스탬프 줄은 오후 파트너 강연만 · 오전 강연은 출석만 */
      s.desc ? esc(s.desc) : "";   /* v5.96 오전 강연 = 참여 전 확인 칸 없음(일시 · 장소 · 참여 방법 표와 같은 말을 되풀이하지 않는다) */
    if (s.id === "expo") D.link = '<button type="button" class="ax-link axs-plain axs-self" onclick="App.go(\'floor1\')">1F 부스 6구역 보기</button>';
    if (ap) attDetailFill(D, ap, timeBtn);   /* v5.68 입장 QR · 끝 QR 두 줄 · 지금 입장 수 · 창이 끝나면 시간표(261005 최종 QA 규칙 그대로) */
    else { D.help = ""; D.btn = timeBtn; }
    if (par) D.pics = prizeGoHtml();   /* v5.20 오후 파트너 강연 · 경품 입구 한 줄 */
    return D;
  }
  if (s.kind === "info") {
    var mi = sessMine(s.id), ax = att10X(s), ao = mi ? attMineK(s.id, "out") : "", tn = attNow(), kw = attKWin(ax, "out"), wo = mi && !ao && (evPhase() === "live" || !!attTm()) && tn >= kw.a && tn <= kw.b;
    D.cat = "실습형 세션 · " + s.ttl; D.title = s.sub;
    D.kv = [["일시", day + progTm(s.tm)], ["장소", pl]].concat(s.who ? [["강사", s.who.split(" · ").map(function (n) { return n.replace(/ /g, "\u00a0"); }).join(" · ")]] : [], [["정원", s.capNote || ""], ["참여 방법", "사전 신청자 참여"]]);   /* v5.60 T1 (design.md §7 배제로 읽히는 말) · v6.22 줄 이름 「강사」 · 이름 단위로만 줄이 꺾임(이름 안 공백 = 붙임 공백) · v6.21 진행 = 강사 · 발표자 실명 · 소속(261007 운영진 메신저 · 실명은 남기는 원칙 261004) */
    if (mi && ATT10_UI) D.kv.push(["끝 QR", ao ? ao + " 출석" : attWinLbl(ax, "out")]);   /* v5.71 10F 끝 QR(신청자만) · 출석하면 시각 */
    if (ao && ATT10_UI) { D.st = "출석 완료"; D.stc = "ok"; }   /* v5.96 10F 끝 QR 표시 끔 */
    D.sg = sessGuideHtml(s, !!mi);   /* v5.60 세션 안내 = (한 줄 소개) → 하는 일 → 준비할 것(신청자만) · 셋 다 없으면 블록 없음 */
    D.help = mi ? "사전 신청 내역은 나의 일정에서 확인할 수 있어요" : "17F 강연 · 1F 전시 · 18F 커피챗은 누구나 참여해요";   /* v5.60 T2 */
    D.btn = wo && ATT10_UI ? progBtn("끝 QR 스캔", "qrScanOpen()") : mi ? progBtn("나의 일정 보기", "mySched()", "ax-button-weak") : progBtn("전체 시간표 보기", "homeSched()", "ax-button-weak");   /* v5.60 시안 = 약한 버튼 · v5.71 끝 창이 열렸고 아직이면 스캔 */
    return D;
  }
  if (s.id === "dap") {
    var r = myResv(), live = r && RESV_HOLD.indexOf(r.status) >= 0;
    /* v5.65 커피 · 간식 사진 · 「참여 전 확인」 글은 구역 상세(zone_d lounge) 펼침 패널로 옮겼다(설계안 결정 6 · 7) · 제목 = 「내년 DAP 과제 상담」(옛 「내 업무에 AI를 어떻게 적용할지, 1:1 상담」은 커피챗 질문과 겹쳤다) · 원 안 글자 DS = 데이터사이언스파트 */
    D.cat = "AX 라운지"; D.title = "내년 DAP 과제 상담"; D.who = "데이터사이언스파트"; D.av = "DS"; D.whoSub = "1:1 · 30분";
    /* v5.60 G (사용자 261004 「진행 방식 보기 정보와 줄글이 중복」) 「진행 방식 보기」 모달(dapModal) 삭제 · 모달에만 있던 기록 · 공유 문장을 본문으로 */
    D.cfKv = [["일시", "10월 26일 " + (PROG.cf && PROG.cf.slot || DAPSEL || "") + " (30분)"], ["장소", pl], ["상담", "데이터사이언스파트 1:1"]];
    if (live) {
      D.st = RESV_ST[r.status] || "신청 완료"; D.stc = "ok";
      D.kv = [["일시", day + r.slot + " · 30분"], ["장소", pl], ["진행", r.status === "requested" || r.status === "booked" ? "승인 후 확정" : r.status === "approved" ? "시작 5분 전 AX 라운지 체크인" : r.status === "checked" ? "상담 진행 중" : "상담 완료"]];
      D.secT = "신청한 상담이에요";
      D.secB = r.status === "requested" || r.status === "booked" ? "승인되면 앱에서 알려 드려요." :
        r.status === "approved" ? "시작 5분 전까지 1F AX 라운지에서 체크인해 주세요. 시작 10분이 지나면 참석하지 않은 것으로 처리돼요." :
        r.status === "checked" ? "업무 설명 → 병목 → 개선방안 순서로 진행돼요." : "상담을 마쳤어요. 아래 코드를 AX 라운지 데스크에 보여 주고 사은품을 받으세요.";
      if (r.status === "done") D.after = '<div class="ax-inset ax-stack-tight axs-gift"><p class="ax-card-title">사은품 교환권 · 1회</p>' + qrHtml() + '<p class="ax-type-t5-strong axs-center-tx">GIFT-' + esc((S.get("user", {}) || {}).empId || "") + '</p></div>';   /* v5.60 W4 「중복 수령 방지 코드예요」 줄 삭제 */
      if (RESV_LIVE.indexOf(r.status) >= 0 && r.status !== "checked") { D.help = "참여가 어려우면 신청을 취소할 수 있어요"; D.btn = cxBtn; }
      else { D.help = ""; D.btn = progBtn("나의 일정 보기", "mySched()", "ax-button-weak"); }
      return D;
    }
    var conf = resvConf(), slots = resvSlots(), lunchM = t2m(conf.lunch);
    var cell = function (t) { var off = resvTaken(t); return '<button type="button" class="axs-slot" aria-pressed="' + (DAPSEL === t) + '"' + (off ? ' disabled aria-label="' + t + ' 마감"' : ' onclick="dapPick(\'' + t + '\')"') + ">" + t + "</button>"; };
    D.st = resvRemain() > 0 ? "신청 가능" : "마감"; D.stc = resvRemain() > 0 ? "ok" : "off";
    D.kv = [["일시", conf.start + "–" + conf.end + " 중 30분"], ["장소", pl], ["참여 방법", "신청 후 승인"]];   /* v4.95 375px 한 줄(행사일은 하루뿐 · 시간 고르기는 아래 칸이 보여 준다) */
    D.extra = (r && r.status === "noshow" ? '<div class="axs-err" role="status"><b>이전 신청은 참석 처리되지 않았어요</b><span>아래에서 다시 신청할 수 있어요.</span></div>' :
        r && r.status === "canceled" ? '<div class="axs-err" role="status"><b>이전 신청이 취소됐어요</b><span>아래에서 다시 신청할 수 있어요.</span></div>' : "") +
      '<section class="ax-stack-tight axs-gap12"><div class="ax-row"><h2 class="ax-section-title">상담 시간 선택</h2><span class="ax-meta">남은 시간 ' + resvRemain() + "개</span></div>" +
      '<div class="axs-slots" role="group" aria-label="상담 시간">' + slots.filter(function (t) { return t2m(t) < lunchM; }).map(cell).join("") +
      '<p class="ax-meta axs-lunch">점심시간 ' + conf.lunch + "–" + conf.lunchEnd + "</p>" + slots.filter(function (t) { return t2m(t) >= lunchM; }).map(cell).join("") + "</div></section>";
    D.sg = "";   /* v5.65 신청 화면 확인 블록 · 사진 삭제(같은 글이 구역 상세 「참여 전 확인」에 있다 · 설계안 결정 6) */
    D.help = DAPSEL ? "선택한 시간 " + DAPSEL + " · 1F AX 라운지" : "상담 시간을 먼저 골라 주세요";
    D.btn = DAPSEL ? progBtn("이 시간으로 신청하기", "progApply(\'dap\')") : progBtn("이 시간으로 신청하기", "", "", "", true);
    return D;
  }
  if (s.id === "cchat") {
    var c = S.get("cchat", null), mt = c && c.status === "matched";
    /* v5.65 신청 전 안내는 구역 상세(zone_d cchat)로 옮겼다 · 여기는 신청 후 · 참석 화면(설계안 결정 7 · 사진만 제거) · 옛 「멘토와 가벼운 시간」 · 「AX 멘토와 함께」 삭제(정리 기록) */
    D.cat = "AX 커피챗"; D.title = "비슷한 고민을 나누고 다음 한 걸음 찾기";   /* v4.13 인원 · 부서 · 소요 시간 표기 삭제(사용자 260922) · 매칭 뒤 실제 자리 · 시각은 그대로 */
    D.kv = [["일시", mt ? day + c.round : "10월 26일 · " + CCHAT_HOURS + " · 선정되면 안내"], ["장소", mt ? "18F · TABLE " + c.table : "18F"], ["참여 방법", "아이디어 제출 후 희망 · 희망한 분 중 선정"]];   /* v6.07 */
    /* v5.60 G 같은 패턴 · 「진행 방식 보기」 모달(cchatModal) 삭제 · 세 단계는 본문 한 줄로 · 커피 · 간식은 사진 카드가 보여 준다 */
    if (S.get("cchat_att", false)) {
      /* v4.47 참석이 서버에 찍힘 · 취소 버튼 대신 참석 완료 */
      D.st = "참석 완료"; D.stc = "ok"; D.secT = "참석한 커피챗이에요";
      D.secB = "함께해 주셔서 고마워요.";
      D.help = ""; D.btn = progBtn("나의 일정 보기", "mySched()", "ax-button-weak");
      return D;
    }
    if (!c) {
      /* v5.65 신청 전은 구역 상세(App.go 가 zone_d cchat 으로 돌린다) · 여기 닿으면(신청이 막 지워진 화면을 다시 그릴 때) 안내로 */
      D.sg = ""; D.st = ""; D.help = ""; D.btn = progBtn("AX 커피챗 안내 보기", "zoneOpen('cchat')");
    } else {
      D.secT = mt ? "선정된 커피챗이에요" : "희망한 커피챗이에요";   /* v6.07 희망 → 선정 */
      if (!mt && c.pref) D.kv.push(["가능한 시간", c.pref]);
      var cxC = progBtn("희망 취소하기", "progCancelOpen(\'cchat\')", "axs-btn-danger", "cxBtn");
      if (!mt && cchatOver()) { D.secT = "오늘 커피챗은 모두 끝났어요"; D.secB = "희망해 주셔서 고마워요."; D.help = ""; D.btn = progBtn("나의 일정 보기", "mySched()", "ax-button-weak"); }   /* v6.07 선정 안 됨은 따로 알리지 않는다(담담하게) */
      else {
        D.secB = mt ? "시작 5분 전까지 18F 해당 테이블에 앉아 주세요. 커피는 준비돼 있어요." : "희망한 분 중 선정해요.<br>" + CCHAT_NOTE;
        D.help = mt ? "참여가 어려우면 취소할 수 있어요" : "참여가 어려우면 희망을 취소할 수 있어요"; D.btn = mt ? cxBtn : cxC;
      }
    }
    return D;
  }
  return D;
}

/* ═══ v5.69 상세 시트(detPaint · 라우트 sess_d) · 17F Intro · 강연 · Outro · 10F 세션 · 1F 전시 · AX LOUNGE 상담 신청 관리 · AX 커피챗 신청 관리 ═══
   1F 구역 상세(zoneSheet)와 같은 리듬 = 머리(분류 칩 · 상태 칩 → 제목 · 오른쪽 도장) → 사람 한 줄 → 하는 일(진행 · 세션 안내) → 정보 표 → 참여 전 확인 → (사은품 코드 · 경품 · 링크) · 주 버튼 = 아래 고정
   상담 시간 고르기(신청 전 상담)는 detIs 가 전체 화면(Views.sess_d)으로 둔다 · 경로 줄 없음(시트는 새 단계가 아니다 · design.md 5-8) */
/* v5.79 (사용자 261006 「제목 표시줄 다이어트」) 시트 머리 = 짧은 이름 한 줄 · 10F 세션은 ttl(세션 A · 세션 E · 1회차) · 긴 정식 제목 = 본문 첫 줄 큰 제목
   분류 칩은 이름과 겹치는 말을 뺀다(「실습형 세션 · 세션 A」 → 「실습형 세션」 · 「기조연설」 = 이름이면 칩 없음) · 제목이 이름과 같으면 부제(sub)를 제목으로 · 사람 줄 보조가 이름 · 제목과 같으면 뺀다 */
var SESS_NM = { intro: "Intro", outro: "Outro", key: "기조연설", road: "내부 강연", l1: "AWS 강연", l2: "MS 강연", expo: "1F 부스", dap: "AX 라운지", cchat: "AX 커피챗" };
function sessSheet() {
  var s = progById(PROG.sid);
  if (!s) return { name: "프로그램", title: "프로그램을 찾을 수 없어요", fit: 1, body: botHtml("목록에서 다시 골라 주세요"), foot: progBtn("프로그램 보기", "App.tab('guide')", "ax-button-weak") };   /* v5.79 짧은 안내 = 내용만큼(fit) */
  var d = progDetail(s), stp = progStampId(s);
  var nm = SESS_NM[s.id] || s.ttl, cat = d.cat.replace(" · " + nm, ""), tt = d.title === nm ? (s.id === "expo" ? "" : s.sub) : d.title, ws = d.whoSub === nm || d.whoSub === tt ? "" : d.whoSub;
  if (cat === nm) cat = "";
  var who = d.who ? '<div class="axs-who">' + spkAvHtml(s.id, d.av) + '<span class="axs-tx"><span class="ax-card-title">' + esc(d.who) + "</span>" + (ws ? '<span class="ax-description">' + esc(ws) + "</span>" : "") + "</span></div>" : "";
  var kv = d.kv.length ? '<dl class="ax-inset axs-kv">' + d.kv.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" : "";
  var sg = "sg" in d ? d.sg : "";
  var chk = !("sg" in d) && d.secB ? '<section class="axs-dsec"><h3>' + esc(d.secT === "참여 전 확인해 주세요" ? "참여 전 확인" : d.secT) + '</h3><p class="axs-dp">' + d.secB + "</p></section>" : "";
  return {
    name: esc(nm), chips: (cat ? '<span class="axs-chip cat">' + esc(cat) + "</span>" : "") + (d.st ? '<span class="axs-chip ' + d.stc + '">' + esc(d.st) + "</span>" : ""),
    title: esc(tt), seal: stp ? stampTagHtml(stp, stp === "p3" ? 2 : 0) : "",   /* v5.96 오후 강연 도장 ×2(입장 1 + 끝 1) */
    body: who + (d.extra || "") + sg + kv + chk + (d.after || "") + (d.pics || "") + (d.link || ""),
    help: d.help, foot: d.btn
  };
}

/* ── 신청 · 상세 → 확인(P03) → 확정 API 1회 → 결과(P04) ── */
function progApply(id) {
  var s = progById(id);
  if (!s) return;
  if (id !== "dap") return;   /* v4.26 앱 신청 확인은 DAP 과제상담만(17F 좌석 신청 폐지 · 커피챗은 cchatApplyOpen) */
  if (!DAPSEL || resvTaken(DAPSEL)) { DAPSEL = null; App.render(); return; }
  PROG.cf = { id: "dap", slot: DAPSEL, busy: false, err: null };
  sheetApplyOpen();   /* v4.18 전체 화면 P03 → 바텀 시트 (Views.sess_cf 는 넘침 대비 예비 화면으로 남겨 둔다) */
}
var PROG_ERR = {
  net: { t: "연결이 불안정해 신청하지 못했어요", b: "신청은 아직 되지 않았어요. 잠시 뒤 다시 시도해 주세요." },
  taken: { t: "방금 다른 분이 신청한 시간이에요", b: "다른 시간을 골라 주세요.", act: "dapRepick()", lbl: "시간 다시 고르기" },   /* v4.64 App.back() 은 상담 화면을 떠났다 */
  dupR: { t: "이미 진행 중인 상담 신청이 있어요", b: "나의 일정에서 확인해 주세요.", act: "mySched()", lbl: "나의 일정 보기" },
  past: { t: "이미 시작한 상담 시간이에요", b: "다른 시간을 골라 주세요.", act: "dapRepick()", lbl: "시간 다시 고르기" },   /* v5.64 서버 resv_book 이 지난 시간을 past 로 거절(행사일 서버 시각) */
  etc: { t: "신청하지 못했어요", b: "잠시 뒤 다시 시도해 주세요." }
};
function progDapSave(slot, beId) {
  var u = S.get("user", {}) || {}, all = resvAll();
  all.push({ id: uid(), beId: beId || undefined, room: 2, slot: slot, name: u.name || "", dept: S.get("dept", null) || "미지정", status: "requested", mine: true, ts: Date.now() });
  DAPSEL = null;
  S.set("resv", all);
  waveBump();
}
function progConfirm() {
  var c = PROG.cf;
  if (!c || c.busy) return;   /* 중복 클릭 · 응답 전 두 번째 요청을 보내지 않는다 */
  var s = progById(c.id), u = S.get("user", {}) || {};
  if (!s) return;
  c.busy = true; c.err = null;
  sheetBusy(true);
  var fin = function (err) {
    c.busy = false;
    /* 실패는 시트 안에 사유와 다음 행동 · 성공해야만 결과(P04)로 넘어간다 */
    if (err) { c.err = err; sheetFail({ t: err.t, b: err.b, act: err.act, lbl: err.lbl }); return; }
    PROG.ok = { id: c.id, slot: c.slot || "" }; PROG.cf = null;
    var tr = c.id === "dap" && tourRetLive() && TOUR_RET.id === "p3" ? TOUR_RET : null;   /* v5.57 둘러보기 LOUNGE 블록에서 출발 · 마침 = 상담 신청 완료(261006 라운지 상담은 스탬프 없음) */
    App.go("sess_ok");   /* App.go 가 시트를 닫는다 */
    delete App.from.sess_ok;   /* 결과에서 뒤로 = 프로그램 목록 (확인 화면으로 돌아가지 않는다) */
    if (tr) { TOUR_RET = tr; tr.v = "sess_ok"; tr.away = false; tourRetDone(true); App.render(); }   /* 완료 화면에 머문다 · 띠 챗봇 인사 한 번(v5.80 · 옛 3초 자동 복귀 없앰) · 띠 · 뒤로 = 둘러보기 */
    if (c.id === "dap") pushAsk("dap", {});   /* v5.83 가치 순간 ④ 「승인되면 알려 드려요」 · 하루 3회 · 아이폰 탭 하루 1회 규칙은 pushAsk 그대로 · 완료 화면이 그려진 뒤(pushSheetWait) */
  };
  var live = BE.on && u.empId;
  if (c.id === "dap") {
    if (!live) {   /* 데모 · 같은 규칙을 로컬로 */
      var mr = myResv();
      if (mr && RESV_LIVE.indexOf(mr.status) >= 0) return fin(PROG_ERR.dupR);
      if (resvTaken(c.slot)) return fin(PROG_ERR.taken);
      progDapSave(c.slot, null); return fin(null);
    }
    beCall({ action: "resv_book", emp: u.empId, name: u.name || "", dept: S.get("dept", null) || "", slot: c.slot }, function (res) {
      if (res && res.ok) { progDapSave(c.slot, res.id); fin(null); }
      else if (res && res.reason === "taken") { RESV_SRV.miss[c.slot] = 1; fin(PROG_ERR.taken); }   /* v4.64 그 칸을 바로 마감으로 */
      else if (res && res.reason === "past") { RESV_SRV.miss[c.slot] = 1; fin(PROG_ERR.past); }   /* v5.64 이 기기 시계가 늦어 칸이 열려 보였다 · 그 칸을 바로 마감으로 */
      else fin(res && res.reason === "taken" ? PROG_ERR.taken : res && res.reason === "dup" ? PROG_ERR.dupR : PROG_ERR.etc);
    }, function () { fin(PROG_ERR.net); });
  }
  /* v4.26 옛 17F 좌석 신청(sess_book)은 걷어냈다 · 서버도 17F 를 open 으로 거절한다 */
}

/* ── 바텀 시트 (M03) · 짧은 확인 하나를 아래에서 올린다 ──
   뒷배경 탭 · Esc · 안드로이드 하드웨어 뒤로로 닫힌다 · 포커스 고정 · 닫으면 누른 버튼으로 복귀 · 통신 중에는 닫히지 않는다.
   v4.18 (사용자 결정 260923) 취소 확인에만 쓰던 것을 신청 확인·번호표 받기까지 넓혔다.
   자유 입력이 있거나 긴 화면(아이디어 제출 · 설문 · 게임)은 전체 화면 그대로 둔다. 뒷배경 탭으로 쓰던 글이 사라지지 않게(design.md A 5-7).
   spec = { id, title, lead(이미 이스케이프한 html), body(이미 이스케이프한 html 블록 · v4.26 출석 선택), kv[[이름, 값]], keep(있으면 유지 버튼), go, goLbl, goBusy, goOff(고른 것이 없어 확정 잠금), danger, arg, back }
   err  = { t, b, act, lbl } · act 가 있으면 확정 버튼이 그 행동으로 바뀐다(시트를 닫고 이동). */
var SHEET = { id: null, busy: false, err: null, back: null, spec: null };
function sheetOpen(spec) {
  SHEET.id = spec.id || "x"; SHEET.busy = false; SHEET.err = null; SHEET.spec = spec;
  SHEET.back = (document.activeElement && document.activeElement.id) || spec.back || "";
  sheetPaint(true);
}
function sheetBusy(on) { SHEET.busy = !!on; if (on) SHEET.err = null; if (el("axsSheet")) sheetPaint(); botWait(!!on, SHEET.spec && SHEET.spec.goBusy); }   /* v4.36 서버 기다리는 동안 챗봇 덮개 · 문구 = 버튼의 「…하는 중」 */
function sheetFail(err) { botWait(false); SHEET.busy = false; SHEET.err = typeof err === "string" ? { t: err } : err; if (el("axsSheet")) sheetPaint(); }
function sheetPaint(first) {
  var sp = SHEET.spec;
  if (!sp) return;
  var w = el("axsSheet");
  if (!w) {
    w = document.createElement("div"); w.id = "axsSheet";
    w.addEventListener("click", function (e) { if (e.target === w && !SHEET.busy) sheetClose(); });
    w.addEventListener("keydown", sheetKey);
    el("frame").appendChild(w);
    sheetDrag(w, function () { return w.querySelector(".ax-sheet"); }, { can: function () { return !SHEET.busy; }, close: function () { if (el("axsSheet") === w) sheetClose(); } });   /* v5.69 끌어 닫기 = 상세 시트와 같은 손(통신 중에는 닫히지 않는다) */
  }
  var e = SHEET.err, dis = SHEET.busy;
  var go = e && e.act
    ? '<button type="button" class="ax-button" onclick="sheetClose(true); ' + e.act + '">' + esc(e.lbl || "이동") + "</button>"
    : '<button type="button" class="ax-button' + (sp.danger ? " axs-btn-danger" : "") + '" id="axsSheetGo" onclick="' + sp.go + '"' +
      (dis ? ' disabled aria-busy="true"' : sp.goOff ? " disabled" : "") + ">" + esc(dis ? sp.goBusy : e ? "다시 시도하기" : sp.goLbl) + "</button>";
  var keep = sp.keep ? '<button type="button" class="ax-button' + (sp.keepWeak ? " ax-button-weak" : "") + '" onclick="' + (sp.keepAct || "sheetClose()") + '"' + (dis ? " disabled" : "") + ">" + esc(sp.keep) + "</button>" : "";
  /* 유지 버튼이 없는 시트(신청 확인 등)는 닫기 X 를 머리 줄에 둔다 · 뒷배경 탭·뒤로도 같은 일을 한다 */
  w.innerHTML = '<div class="ax-sheet" role="dialog" aria-modal="true" aria-labelledby="axsSheetT">' +
    '<span class="axs-grab" aria-hidden="true"></span>' + (sp.top || "") +   /* v5.46 제목 위 그림(둘러보기 초대 봉투) */
    (sp.keep ? '<h2 class="ax-type-t2" id="axsSheetT">' + esc(sp.title) + "</h2>"
      : '<div class="axs-mhead"><h2 class="ax-type-t2" id="axsSheetT">' + esc(sp.title) +
        '</h2><button type="button" class="axs-x" onclick="sheetClose()"' + (dis ? " disabled" : "") + ' aria-label="닫기">' + X_SVG + "</button></div>") +
    (sp.lead ? '<p class="ax-body">' + sp.lead + "</p>" : "") +
    (sp.body || "") +
    (sp.kv && sp.kv.length && !e ? '<dl class="ax-inset axs-kv">' + sp.kv.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" : "") +
    (e ? '<div class="axs-err" role="alert"><b>' + esc(e.t) + "</b>" + (e.b ? "<span>" + esc(e.b) + "</span>" : "") + "</div>" : "") +
    '<div class="ax-stack-tight axs-gap12">' + (sp.keepLast ? go + keep : keep + go) + "</div></div>";   /* v5.46 keepLast = 주 버튼 위 · 약한 버튼 아래(둘러보기 초대) */
  /* 위험한 확정은 유지 버튼에, 그 밖에는 주 버튼에 포커스를 둔다(닫기 X 에 먼저 걸리지 않게) */
  var f = w.querySelector(sp.keep ? "button:not([disabled])" : "#axsSheetGo:not([disabled])") || w.querySelector("button:not([disabled])");
  if (f && (first || !w.contains(document.activeElement))) f.focus();
}
function sheetKey(e) {
  var w = el("axsSheet"); if (!w) return;
  if (e.key === "Escape") { e.preventDefault(); if (!SHEET.busy) sheetClose(); return; }
  if (e.key !== "Tab") return;
  var b = [].slice.call(w.querySelectorAll("button:not([disabled])"));
  if (!b.length) { e.preventDefault(); return; }
  var i = b.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); b[b.length - 1].focus(); }
  else if (!e.shiftKey && i === b.length - 1) { e.preventDefault(); b[0].focus(); }
}
function sheetClose(silent) {
  var w = el("axsSheet"); if (w) w.remove();
  if (SHEET.busy) botWait(false);   /* v4.36 확정 응답으로 닫힐 때 덮개도 걷는다 */
  var oc = SHEET.spec && SHEET.spec.onClose;   /* v5.46 어떻게 닫든(버튼 · 뒷배경 · Esc · 뒤로) 한 번 */
  SHEET.busy = false; SHEET.err = null; SHEET.spec = null;
  if (oc) { try { oc(); } catch (e) {} }
  if (!silent && SHEET.back) { var t = el(SHEET.back); if (t) t.focus(); }
}
/* 신청 취소 확인 (M03-cancel) · 실패하면 신청을 그대로 유지한다 */
function progCancelOpen(id) {
  var s = progById(id);
  if (!s) return;
  if (id !== "dap" && id !== "cchat") { var m = sessMine(id); if (m && m.test) toast("테스트 항목이에요 · 서버에 쓰지 않습니다"); return; }   /* v4.26 세션 신청 취소(sess_cancel)는 없다 */
  var d = progDetail(s);
  var when = id === "dap" ? (myResv() || {}).slot || "" : id === "cchat" ? (S.get("cchat", {}) || {}).round || "" : progTm(s.tm);
  var ccw = id === "cchat" && !(S.get("cchat", {}) || {}).round;   /* v6.07 선정 전 커피챗 = 희망 취소 */
  sheetOpen({ id: "cancel", arg: id, danger: true, back: "cxBtn", title: ccw ? "커피챗 희망을 취소할까요?" : "신청을 취소할까요?",
    lead: esc(d.cat + (d.org && d.cat.indexOf(d.org) < 0 ? " · " + d.org : "")) + (when ? "<br>10월 26일 " + esc(when) : ""),
    keep: ccw ? "그대로 두기" : "신청 유지하기", go: "progCancelGo()", goLbl: ccw ? "희망 취소하기" : "신청 취소하기", goBusy: "취소하는 중" });
}
/* 신청 확인 (P03) · v4.18 전체 화면 대신 시트 · 큰글씨에서도 짧게 유지되는 내용만 담는다 */
function sheetApplyOpen() {
  var c = PROG.cf, s = c && progById(c.id);
  if (!s) return;
  var d = progDetail(s);
  sheetOpen({ id: "apply", back: "cfGo", title: "신청할까요?",
    lead: '<b>' + esc(d.title) + "</b><br>" + esc(d.cat + (d.org && d.cat.indexOf(d.org) < 0 ? " · " + d.org : "")),
    kv: d.cfKv, go: "progConfirm()", goLbl: "신청하기", goBusy: "신청하는 중" });
}
/* 커피챗 희망 확인 · 자리와 시간은 선정 뒤에 정해진다(v6.07) */
function cchatApplyOpen() {
  if (S.get("cchat", null) || !ideaMineN()) return;
  sheetOpen(cchatSheetSpec());
}
/* v4.45 신청 시트 · 선호 시간대 칩(고르기 전에는 신청 버튼 잠금) · 안내 = 하이웍스 + 앱 나의 참여 */
function cchatSheetSpec() {
  /* v6.07 (사용자 261007) 희망 시트 · 시간대는 선택(안 고르면 언제든) · 선착순 30명 → 희망한 분 중 선정 · 지급품 사진 한 줄 */
  return { id: "cchat", back: "cchatApplyBtn", title: "AX 커피챗에 참여하고 싶으세요?", lead: "18F · " + CCHAT_HOURS + "<br>희망한 분 중 선정해요",
    body: treatHtml(1) + cchatPrefHtml("sheet"), kv: [["내 아이디어", ideaMineN() + "건 제출"], ["선정 안내", "하이웍스 · 앱 알림"]],
    go: "cchatApply()", goLbl: "희망해요", goBusy: "보내는 중" };
}
function progCancelGo() {
  if (SHEET.busy || !SHEET.spec) return;
  var id = SHEET.spec.arg, u = S.get("user", {}) || {};
  sheetBusy(true);
  var ok = function () {
    if (id === "dap") S.set("resv", resvAll().filter(function (r) { return !(r.mine && RESV_LIVE.indexOf(r.status) >= 0); }));
    var ccw = id === "cchat" && !(S.get("cchat", {}) || {}).round;   /* v6.07 */
    if (id === "cchat") { S.set("cchat", null); CCHAT_CX_TS = Date.now(); }
    sheetClose(true);
    toast(ccw ? "커피챗 희망을 취소했어요" : "신청을 취소했어요");
    mySched();
    delete App.from.guide_time;   /* 내 일정에서 뒤로 = 나의 참여 (취소한 상세로 돌아가지 않는다) */
  };
  var bad = function (m) { sheetFail({ t: m, b: "신청은 그대로 유지돼요." }); };
  if (!BE.on || !u.empId) return ok();
  if (id !== "dap" && id !== "cchat") return;
  beCall({ action: id === "dap" ? "resv_cancel" : "cchat_cancel", emp: u.empId }, function (res) {
    /* v4.68 (QA 5 교차) notfound + cur = 운영자가 같은 순간 노쇼 · 입장(체크인 · 참석) · 완료로 처리해 서버에는 취소할 신청이 없다(새 서버만 cur)
     *   예전에는 「신청을 취소했어요」가 떠서 참가자는 취소된 줄 알고 운영 기록은 노쇼였다 · 시트에 그대로 알리고 곧바로 동기화(지금 상태) */
    if (res && res.reason === "notfound" && res.cur) { sheetFail({ t: "취소되지 않았어요", b: "이미 " + ({ "노쇼": "노쇼", "체크인": "입장", "참석": "입장", "완료": "완료" }[res.cur] || res.cur) + " 처리된 신청이에요" }); beSync(); return; }
    /* notfound = 서버에 살아 있는 신청이 없다 · 이 기기 기록만 남은 것이라 지운다 */
    if (res && (res.ok || res.reason === "notfound")) ok();
    else bad("취소하지 못했어요");
  }, function () { bad("연결이 불안정해 취소하지 못했어요"); });
}

/* ── v4.93 (261001 사용자 확정 · IA 검토 7-4 · 8장 A5) 나의 일정 = 나의 참여 맨 위 한 곳 ──
   옛 세 곳(홈 요약 · 프로그램 [나의 일정] · 나의 참여 › 내 일정 화면 myPlanHtml)이 같은 원천을 다른 모양으로 그리던 것을 여기로 모았다(홈 요약은 같은 원천 myItems 그대로)
   행 = 시간표와 같은 행(progTTRow) · 전부 내 것이라 틴트 · 칩 대신 보조 줄에 상태 · 지금 할 것(대기 · 계단)은 「지금」 + 주황 테두리 · 지난 일정 inset
   사전신청자 = 맨 위 내 세션 카드(tenMineCard) · 빈 상태 = 한 줄 + 약한 버튼 「상시 운영 보기」 */
function myAgendaSub(x) {
  var k = x.kind;
  if (k === "photo") return x.call ? "입장 차례 · " + String(x.gSub || "").split(" · ")[0] : "대기 " + String(x.gSub || "").replace(" · 예상 입장 ", " · 예상 ");
  if (k === "resv") { var r = myResv(); return (x.test ? "승인 완료" : (r && RESV_ST[r.status]) || "신청 완료") + " · 1F AX 라운지"; }
  if (k === "resv_done") return "상담 완료 · 1F AX 라운지";
  if (k === "cchat") return x.iv ? "선정 · 18F " + x.sub : "희망 접수 · 선정되면 알려 드려요";   /* v6.07 */
  return x.gSub || x.sub || "";
}
function myAgendaNow(x) { return x.min < 0 || !!x.photo || x.kind === "stair" || x.kind.indexOf("queue:") === 0; }
function myAgendaRow(x, j) {
  var ph = evPhase(), hmN = hmNow(), now = myAgendaNow(x);
  var past = !now && (x.done || ph === "after" || (ph === "live" && x.iv && hmN >= x.iv[1]));
  return progTTRow("m" + j, {
    t0: now ? "지금" : x.iv ? hm2(x.iv[0]) : "미정", t1: !now && x.iv ? hm2(x.iv[1]) : "", title: x.gTitle, go: x.go || "", sub: myAgendaSub(x),
    cls: past ? " past" : " my" + (now ? " now" : ""), tok: past ? "dim" : x.call && isBlack("call") ? "act" : "mine"
  }).replace('<div class="rc', '<div data-my="' + esc(x.kind) + '" class="rc');   /* 알림 · 신청 결과 「내 일정 확인하기」가 그 줄을 튕긴다(focusTarget my:조각) */
}
function myAgendaItems() {
  var items = myItems(true).filter(function (x) { return !x.ten; }), ts = tenMine();
  /* v5.64 (사용자 261005 「세션A가 펼쳐져 있는 게 이상 · 프로그램 탭 시간표처럼 · 상세는 눌러서」) 내 10F 세션 = 다른 일정과 같은 시간표 줄 · 시간 순서 · 누르면 세션 상세 · 옛 펼친 카드(tenMineCard · 「세션 상세」 단추) 삭제 */
  if (ts) { var tsp = ts.tm.split("~"), tsm = sessMine(ts.id) || {}; items.push({ kind: "sess:" + ts.id, min: t2m(tsp[0]), go: "sessOpen('" + ts.id + "')", gTitle: ts.ttl, gSub: "내 세션 · " + sessPlace(ts) + (tsm.test ? " · 테스트" : ""), iv: [t2m(tsp[0]), t2m(tsp[1])] }); if (ATT10_UI && attMineK(ts.id, "out")) items[items.length - 1].gSub = "출석 완료 · " + sessPlace(ts); }   /* v5.71 끝 QR 출석 */
  var r = myResv();
  if (r && r.status === "done" && r.slot) items.push({ kind: "resv_done", done: true, min: sessStartMin(r.slot), go: "App.go('dap')", gTitle: "AX 라운지", sub: "1F AX 라운지", iv: [sessStartMin(r.slot), sessStartMin(r.slot) + (RESV_CONF.step || 30)] });   /* 끝난 상담도 지난 줄로 남긴다 */
  items.sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || (myAgendaNow(a) ? -1 : a.min) - (myAgendaNow(b) ? -1 : b.min); });
  return items;
}
/* ═══ v6.04 (사용자 261007 「사전신청자 191명의 나의 일정 탭에는 오전 키노트 · 로드맵 · 오후 아웃트로까지 다 박아 줘 · 형태도 이걸 차용 · 내가 신청한 일정과 자율 참석 일정이 구분」)
   10F 명단(tenMine · 서버 sync my.sess · 테스트 사번 오버레이)의 나의 일정 = 프로그램 › 시간표와 같은 하루 흐름(progFlowHtml 틀 · 노드 · 레일 · 카드)
   줄 = 자유 참석(Intro · 기조연설 · 내부 강연 · 점심 · Outro) + 신청(내 10F 세션 · AX 라운지 상담 · 매칭된 커피챗 · 시작 시각 순서 · 겹치면 둘 다)
   오후 파트너사 강연(AWS · MS) = v6.06 (사용자 261007) 내 10F 세션과 시간이 겹치지 않으면 자유 참석 카드로 넣고 겹치면 뺀다(MYFL_LEC · 세션 E 1회차 15:00 끝(261007) → 15:10 MS · 2회차 15:00 시작 → 13:30 AWS(~14:50) · 휴식 줄(14:50~15:10)은 두 회차 다 겹쳐 빠진다 · 시간표 탭에는 그대로)
   구분 = 신청: 주황 2px 테두리 + 오른쪽 위 칩 「신청」 + 노드 주황 채운 점 · 자유 참석: 흰 카드 그대로 + 회색 칩 「자유 참석」 · 누르면 시간표와 같은 상세(progOpen)
   시각이 없는 것(대기 · 계단 · 커피챗 매칭 대기)은 흐름 위 행 카드 그대로(myAgendaRow) · 일반 직원은 옛 나의 일정 그대로 */
var MYFL_LEC = ["l1", "l2"];
function myFlowOn() { return !!tenMine(); }
function myFlowItems() {
  var tm = tenMine(), tp = tm ? tm.tm.split("~").map(function (t) { return t2m(t); }) : null;
  var pub = progFlowItems().filter(function (o) { return !o.mine && ((MYFL_LEC.indexOf(o.k) < 0 && !o.brk) || (!!tp && (o.b <= tp[0] || o.a >= tp[1]))); }), mine = [];   /* 261007 휴식 줄도 강연과 같이 내 10F 세션과 겹치면 뺀다 */
  myAgendaItems().forEach(function (x) {
    if (!x.iv || myAgendaNow(x)) return;
    var k = x.kind, o = { k: k, my: k, a: x.iv[0], b: x.iv[1], t0: hm2(x.iv[0]), t1: hm2(x.iv[1]), mine: true };
    if (k.indexOf("sess:") === 0) {
      var s = sessById(k.slice(5)); if (!s) return;
      o.ttl = s.ttl; o.sub = (ATT10_UI && attMineK(s.id, "out") ? "출석 완료 · " : "") + s.sub + ((sessMine(s.id) || {}).test ? " · 테스트" : ""); o.fl = 10; o.pl = sessPlace(s).replace(/^\d+F\s*·?\s*/, ""); o.go = "progOpen('" + s.id + "')";
    } else if (k === "resv" || k === "resv_done") { o.ttl = "AX 라운지"; o.sub = myAgendaSub(x).split(" · ")[0] + (x.test ? " · 테스트" : ""); o.fl = 1; o.pl = "AX 라운지"; o.go = "progOpen('dap')"; }
    else if (k === "cchat") { o.ttl = "AX 커피챗"; o.sub = "선정" + (x.test ? " · 테스트" : ""); o.fl = 18; o.pl = String(x.sub || "").split(" · ")[0]; o.go = "progOpen('cchat')"; }
    else return;
    mine.push(o);
  });
  return pub.concat(mine).sort(function (x, y) { return x.a - y.a || (y.mine ? 1 : 0) - (x.mine ? 1 : 0); });
}
/* 카드 = progFlowCard 와 같은 틀(층 점 글자 · 장소 · ~끝 · 제목 · 보조 한 줄 · 셰브론) + 머리 줄 오른쪽 끝 칩 · data-my = 알림 「내 일정 확인하기」가 튕기는 자리(focusTarget my:조각) */
/* v6.06 진행 중인 신청 카드 = 칩 「진행 중」(나의 참여 · 홈 같은 말) */
/* v6.11 h = 홈 카드(시각 칸 없음 · 머리 줄 「13:30 ~ 16:40」) · 나의 참여 하루 흐름은 그대로 「~16:40」 */
function myFlowCard(o, hmN, isF, h) {
  if (o.brk) return progFlowBrk(o, hmN);
  var past = hmN >= o.b, chip = o.mine ? '<span class="axs-chip mc">' + (isF ? "진행 중" : "신청") + "</span>" : '<span class="axs-chip off mc">자유 참석</span>';
  return '<button type="button" class="fc' + (o.mine ? " mine" : "") + (past ? " past" : "") + (isF ? " focus" : "") + '"' + (o.go ? ' onclick="' + o.go + '"' : " disabled") + ' data-fl="' + esc(o.k) + '"' + (o.my ? ' data-my="' + esc(o.my) + '"' : "") + ">" +
    '<span class="mt">' + (o.fl ? flFloor(o.fl) : "") + '<span class="pl">' + esc(o.pl) + '</span><span class="e">' + (h ? o.t0 + " ~ " : "~") + o.t1 + "</span>" + chip + "</span>" +
    '<span class="t">' + (isF ? '<span class="ax-sr-only">진행 중 </span>' : "") + '<span class="tt">' + esc(o.ttl) + "</span></span>" +
    (o.sub ? '<span class="s">' + esc(o.sub) + "</span>" : "") + (past || !o.go ? "" : '<span class="chv">' + CHEV_SVG + "</span>") + "</button>";
}
function myFlowHtml(its) { return '<div class="axs-fl axs-myfl">' + progFlowHtml(0, its) + "</div>"; }
/* v6.11 (사용자 261007 「홈 탭의 시간 표기 때문에 크기가 다른 것들이랑 너비가 다른데 · 통일감을 해친다」) 홈 나의 일정(10F 명단) = 왼쪽 시각 칸 없이 카드만(axs-myfl-h)
   시각은 카드 머리 줄 「13:30 ~ 16:40」 · 홈 다른 카드(rcHtml)와 같은 너비 · 둥글기 20 · 그림자 없음 · 간격 8 · 신청 = 주황 테두리 · 칩 그대로 · 진행 중 = 칩 「진행 중」 + 둘레 고리(O25) */
function myFlowHomeHtml(its) {
  var ph = evPhase(), hmN = ph === "before" ? -1 : ph === "after" ? 99999 : hmNow();
  var act = its.filter(function (o) { return hmN >= o.a && hmN < o.b; }).sort(function (x, y) { return (y.mine ? 1 : 0) - (x.mine ? 1 : 0) || x.a - y.a; });
  return '<div class="axs-fl axs-myfl axs-myfl-h">' + its.map(function (o) { return myFlowCard(o, hmN, act[0] === o, 1); }).join("") + "</div>";
}
/* v6.11 (사용자 261007 「Outro는 설명해 주는 거 좋을 것 같아」) 홈 나의 일정 · 신청 일정이 다 끝났고 Outro 가 남았으면 Outro 안내 카드(자유 참석 · 누르면 Outro 상세) */
function myOutroItem() {
  var o = progFlowItems().filter(function (x) { return x.k === "outro"; })[0], c = {};
  if (!o) return null;
  for (var k in o) c[k] = o[k];
  c.sub = "DAP 시상 · 행운권 추첨";
  return c;
}
/* 나의 참여 쪽 분 단위 갱신(시간표 탭 setInterval 과 같은 규칙 · 보일 때만 · 분이 바뀌면 흐름만) */
var MYFL_KEY = "";
setInterval(function () {
  if (App.current !== "my" || document.hidden) return;
  var f = el("myFlow"); if (!f) return;
  var ph = evPhase(), k = ph + (ph === "before" ? -1 : ph === "after" ? 99999 : hmNow());
  if (k !== MYFL_KEY) { MYFL_KEY = k; f.innerHTML = progFlowHtml(0, myFlowItems()); }
}, 20000);
/* v5.65 나의 참여 › 나의 일정 갈래 · 이름은 위 세그먼트가 말한다(옛 제목 줄 「나의 일정」 삭제 · 날짜 · 개수 한 줄만) */
function myAgendaHtml() {
  var items = myAgendaItems(), n = items.length;
  if (myFlowOn()) {   /* v6.04 10F 명단 = 하루 흐름 */
    var fl = myFlowItems(), nm = fl.filter(function (o) { return o.mine; }).length, rws = items.filter(function (x) { return !x.iv || myAgendaNow(x); });
    var cx1 = items.some(function (x) { return x.kind === "resv" || x.kind === "cchat"; });
    return '<section class="axs-msec" id="mysched"><p class="ax-meta">10월 26일 · 신청 ' + nm + "개 · 자유 참석 " + (fl.length - nm) + "개</p>" +
      (rws.length ? '<div class="axs-tt axs-mtt">' + rws.map(myAgendaRow).join("") + "</div>" : "") +
      '<div class="axs-fl axs-myfl" id="myFlow">' + progFlowHtml(0, fl) + "</div>" +
      (cx1 ? '<p class="ax-meta">신청 취소는 신청 상세에서 할 수 있어요</p>' : "") + "</section>";
  }
  var head = n ? '<p class="ax-meta">10월 26일 · ' + n + "개</p>" : "";
  if (!n) return '<section class="axs-msec" id="mysched">' + head + '<p class="ax-description">신청한 프로그램이 아직 없어요 · 17F 강연과 1F 전시는 신청 없이 갈 수 있어요</p>' +
    '<button type="button" class="ax-button ax-button-weak" onclick="progAlwaysGo()">상시 운영 보기</button></section>';
  var cx = items.some(function (x) { return x.kind === "resv" || x.kind === "cchat"; });
  return '<section class="axs-msec" id="mysched">' + head +
    (items.length ? '<div class="axs-tt axs-mtt">' + items.map(myAgendaRow).join("") + "</div>" : "") +
    (cx ? '<p class="ax-meta">신청 취소는 신청 상세에서 할 수 있어요</p>' : "") + "</section>";
}

/* ═══ 다른 화면에서 특정 층으로 들어오는 통로 (스탬프 03 · 홈 배너 등) ═══
   v3.4 아코디언 · v3.7 층 칩 구조(progPickFl · progSessToggle · flListHtml · sessRowHtml · sessInlineHtml · ppGoCard · seatRowHtml)는
   v4.15 시간표 재설계로 progRowHtml · progTimeHtml 이 대신하게 되면서 호출부가 사라졌다. 260923 삭제.
   층별 상시 활동 표(FL_OPEN · FLTAG) · 아코디언 펼침 상태(PROG.openSess) · 신청 래퍼(sessBook · sessCancel)도 같이 나갔다.
   층별 안내(progOpenFl · 존 스크롤)는 그 전 v47에서 이미 폐기됐다. */
function progGoFl(n) { PROG.fl = n; PROG.cat = "all"; PROG.tt = "all"; PROG.seg = "time"; App.go("guide"); }   /* v4.84 목록 보기 폐지 · 층 진입도 시간표(전체) */   /* v4.05 층 → P01 필터 */   /* 다른 화면에서 특정 층으로 진입 (스탬프 03 등) */



