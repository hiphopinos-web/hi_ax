/* ═══ AX-TDS v1 3단계 (260922) · 현장 QR · 스캔 입구 하나 · Q02 스캔 · Q03 결과 · 계단 B안 ═══
   (QR 상호작용 기획.md · 260919 사용자 확정)
   · 입구: 폰 기본 카메라 링크(#s= · #q=)도 앱 안 스캐너도 qrRoute 하나로 간다.
     링크는 스크립트가 뜨자마자 주소에서 지우고(sessionStorage 에 보관) 로그인 뒤 이어서 처리한다 · 이미 열린 탭은 hashchange.
   · 부스: 서버 적립 확인 뒤에만 결과(Q03 적립됨)와 보상 수를 그린다 · 이미 받음 = 받은 시각 팝업 · 오프라인 = 저장됨 · 거부 = 실패 + 대안 하나.
     결과에서 「스탬프 확인하기」 = 나의 참여 › 스탬프, 그 카드 펼침 + 「방금 적립 · 시각」.
   · 계단: 방화문 앞 QR · 시작 → 다른 층 = 종료 · 같은 층 2분 안 = 중복 · 보정(지난번 종료 층 자기 신고) · 「종료가 아니라 새로 시작이에요」.
     판정은 서버(stair_scan · stair_fix · stair_reclass) · 앱은 결과만 그린다.
   · 테스트 계정 310555: 서버가 판정만 하고 쓰지 않는다(dry) · 부스 스탬프는 이 기기에만 기록. */
function scanLinkPeek() {
  var p = SCANLINK.mem;
  try { var raw = sessionStorage.getItem(SCANLINK_KEY); if (raw) p = JSON.parse(raw); } catch (e) {}
  return p && p.raw ? p : null;
}
function scanLinkClear() { SCANLINK.mem = null; try { sessionStorage.removeItem(SCANLINK_KEY); } catch (e) {} }
/* 로그인 뒤 · 30분 넘게 묵은 링크는 버린다(로그인 화면에 오래 머문 뒤 엉뚱한 판정 방지) */
function scanLinkRun() {
  var p = scanLinkPeek();
  if (!p) return;
  if (!((S.get("user", {}) || {}).empId)) return;
  scanLinkClear();
  TINV.skip = true;   /* v5.46 찍은 QR 목적지를 방해하지 않는다 · 둘러보기 초대는 다음 방문의 홈에서 */
  if (Date.now() - (p.t || 0) > 30 * 60000) return;
  qrRoute(p.raw, p.t);
}
/* 로그인 화면 한 줄 · 화면에 없는 정보(찍은 것이 로그인 뒤 이어진다)만 */
function scanLinkNote() {
  var p = scanLinkPeek();
  if (!p) return;
  var msg = /^#q=idea\b/i.test(p.raw) ? "로그인하면 아이디어 한 줄로 이어져요" : /^#q=type\b/i.test(p.raw) ? "로그인하면 노트북에 연결돼요" : /^#q=/i.test(p.raw) ? "로그인하면 퀴즈로 이어져요" : "로그인하면 이어서 적립";   /* v4.80 아이디어 한 줄 QR */
  ["entryForm", "quick"].forEach(function (id) {
    var box = el(id);
    if (!box || box.querySelector(".axs-pend")) return;
    var n = document.createElement("p"), w = document.createElement("div");
    n.className = "ax-meta axs-pend"; n.setAttribute("role", "status"); n.textContent = msg;
    w.className = "lf-clp"; w.setAttribute("data-r", "pill"); w.appendChild(n);   /* v5.02 유동 배치 줄 · 키보드에 먼저 접힌다 */
    var at = box.querySelector('[data-r="btn"]');   /* 두 화면 모두 주 버튼 바로 위 */
    if (at && at.parentNode) at.parentNode.insertBefore(w, at);
  });
  lfSoon();
}
window.addEventListener("hashchange", function () {
  if (!scanLinkTake()) return;
  if (!el("app").hidden) setTimeout(scanLinkRun, 60);
  else scanLinkNote();
});

/* ── 분기 하나 · 스캐너와 링크가 같은 결과 ── */
function qrRoute(raw, t) {
  raw = String(raw || "").trim();
  if (qrParseUser(raw)) { notice({ key: "claim:user", title: "참가자 QR이에요", body: "아이디어 · 계단 · 출석 QR 스캔", go: "scan_q", goLbl: "다시 스캔" }); return; }
  if (/#q=type\b/i.test(raw)) { typeLinkGo(raw); return; }   /* v5.61 1F 타자왕 노트북 접속 QR(방법 2) · 로그인 뒤 그 노트북에 붙는다 */
  if (/#q=idea\b/i.test(raw)) { App.go("ideas"); return; }   /* v4.80 (사용자 승인 261001) 1층 부서 출력용 아이디어 한 줄 QR · 서버 판정 없음 · 적립은 제출 때(p5) · #go= 는 알림 진입 집계라 쓰지 않는다 */
  var mq = raw.match(/#q=(wall[0-9]+)/i);
  if (mq) {
    var wid = mq[1].toLowerCase();
    if (!/^wall[1-3]$/.test(wid)) { srShow({ st: "fail", why: "nocode" }); return; }
    srShow({ st: "fail", why: "retired" }); return;   /* v4.83 (261001) 전시 QR 퀴즈는 스탬프 8종에서 빠졌다 · 보관 QR 을 찍으면 안내만 · 정리 #5(261005) 퀴즈 화면을 지워 옛 서버에서도 안내만 */
  }
  var m = raw.match(/#s=([A-Za-z0-9]+)/i), code = m ? m[1] : (/^[A-Za-z0-9]{3,12}$/.test(raw) ? raw : "");
  if (!code) { srShow({ st: "fail", why: "nocode" }); return; }
  var fl = (raw.match(/[#&?]fl=(\d{1,2})\b/i) || [])[1] || "", r = (raw.match(/[#&?]r=([12])\b/i) || [])[1] || "";
  if (/^AXA/i.test(code) && !fl) { attByCode(code, (raw.match(/[#&?]p=([a-z0-9]{1,8})(?![a-z0-9])/i) || [])[1] || ""); return; }   /* v4.26 17F 출석 QR · 코드 판정은 서버(att_claim) · v4.81 &p=강연 id = 강연별 출석 QR(PPT) · 바로 출석 */
  if (/^AXD/i.test(code) && !fl) { drawByCode(code); return; }   /* v4.79 Outro 럭키드로우 추첨 체크인 QR · 코드 · 창 · 1인 1회는 서버(draw_in) */
  if (/^AXW/i.test(code) || fl) stairByCode(code, fl, r, t); else stampByCode(code, t);
}
function qrHandle(raw) { qrRoute(raw, Date.now()); }
/* ═══ v5.61 (261004 사용자 결정) 1F 타자왕 노트북 접속 QR · 방법 2 ═══
   노트북 화면 왼쪽 QR = 앱 주소#q=type&lt=일회용 토큰(노트북마다 · 40초 교체 · 60초 만료 · 한 번 쓰면 끝)
   폰 기본 카메라로 찍으면 앱이 열리고(로그인 전이면 로그인 뒤 · scanLinkRun) · 앱 안 스캐너로 찍어도 같다 → type_link_join(본인 세션) → 「노트북 화면을 보세요 · SPACE로 시작」
   판정(명부 · 남은 도전 · 시간 창 · 테스트 사번)은 노트북 카메라로 내 QR 을 읽은 것(방법 1)과 같은 서버 판정(typeSelfCheck_) · 토큰이 없으면(#q=type 만) 내 QR 화면을 연다 */
var TLK_WHY = {
  link: ["노트북 화면의 QR을<br>다시 찍어 주세요", "QR은 1분마다 바뀌어요", "scan"],
  used: ["노트북 화면의 QR을<br>다시 찍어 주세요", "이미 연결에 쓴 QR이에요", "scan"],
  limit: ["오늘 도전을<br>모두 쓰셨어요", "순위는 1층 타자왕 TV에서", "home"],
  window: ["지금은 도전<br>시간이 아니에요", "", "home"],
  unknown: ["명부에서<br>찾을 수 없어요", "1층 안내 데스크로 알려 주세요", "home"],
  ses: ["비밀번호를 입력한 뒤<br>QR을 다시 찍어 주세요", "보안을 위해 한 번 더 확인해요", "scan"],
  net: ["연결이<br>불안정해요", "잠시 뒤 다시 시도해 주세요", "retry"],
  param: ["사번으로 입장한 뒤<br>QR을 찍어 주세요", "", "home"],
  other: ["노트북 화면의 QR을<br>다시 찍어 주세요", "", "scan"]
};
function typeLinkGo(raw) {
  var m = String(raw || "").match(/[#&]lt=([A-Za-z0-9]{8,16})/), u = S.get("user", {}) || {};
  if (!m) { qrPanelOpen("mine"); toast("노트북 위 카메라에 내 QR을 비추세요"); return; }
  var lt = m[1].toLowerCase(), base = { st: "link", lt: lt, raw: String(raw) };
  if (!u.empId) { srShow(Object.assign(base, { lk: "param" })); return; }
  if (!BE.on) { srShow(Object.assign(base, { lk: "net" })); return; }
  srShow(Object.assign({}, base, { lk: "wait" }));
  beCall({ action: "type_link_join", emp: u.empId, lt: lt }, function (r) {
    if (!(SR.st === "link" && SR.lt === lt)) return;
    if (r && r.ok && r.inWin && r.left > 0) { srShow(Object.assign({}, base, { lk: "ok", nick: r.nick || "", left: r.left, limit: r.limit, test: !!r.test })); return; }
    var why = !r ? "other" : r.ok ? (!r.inWin ? "window" : "limit") : r.reason === "busy" ? "net" : TLK_WHY[r.reason] ? r.reason : "other";
    srShow(Object.assign({}, base, { lk: why, win: (r && r.win) || [], limit: r && r.limit }));
  }, function () { if (SR.st === "link" && SR.lt === lt) srShow(Object.assign({}, base, { lk: "net" })); });
}
function typeLinkHtml(o) {
  var bot = '<div class="axs-res-bot">' + BOT_SVG + "</div>", h;
  if (o.lk === "wait") {
    h = bot + '<span class="axs-chip off axs-self">1F 타자왕</span><h1 class="ax-title">노트북에<br>연결하는 중</h1>';
    return { body: h, btn: ax2Btn("홈으로", "App.tab('home')") };
  }
  if (o.lk === "ok") {
    h = bot + '<span class="axs-chip ok axs-self">1F 타자왕 · 노트북 연결됨</span><h1 class="ax-title">노트북 화면을<br>보세요</h1>' +
      '<section class="axs-res-card"><p class="ax-type-t7 axs-bt">SPACE로 시작</p><p class="axs-res-n">' + (o.nick ? esc(o.nick) : "새 도전자") + "</p>" +
      '<p class="ax-description">' + (o.nick ? "" : "닉네임은 노트북에서 정해요 · ") + "남은 도전 " + o.left + "회 / " + o.limit + "회</p></section>" +
      (o.test ? '<p class="ax-meta">테스트 사번 · 순위 외</p>' : "");
    return { body: h, btn: ax2Btn("확인", "App.tab('home')") };
  }
  var w = TLK_WHY[o.lk] || TLK_WHY.other, sub = o.lk === "window" ? (o.win || []).join(" · ") : o.lk === "limit" && o.limit ? "1인 " + o.limit + "회 · " + w[1] : w[1];
  h = '<span class="axs-chip err axs-self">1F 타자왕 · 연결되지 않음</span><h1 class="ax-title">' + w[0] + "</h1>" + (sub ? '<p class="ax-description">' + esc(sub) + "</p>" : "");
  var btn = w[2] === "scan" ? ax2Btn("QR 다시 찍기", "scanOpen('')", "내 QR 열기", "qrPanelOpen('mine')") : w[2] === "retry" ? ax2Btn("다시 시도", "typeLinkGo(SR.raw)", "홈으로", "App.tab('home')") : ax2Btn("확인", "App.tab('home')");
  return { body: h, btn: btn };
}

/* ═══ Q03 · 서버 적립 결과 (네 상태: 적립됨 · 이미 받음 · 오프라인 저장 · 실패) ═══
   이미 받음은 팝업(받은 시각) · 나머지는 결과 화면 scan_res. 적립됨만 보상 수를 그린다(서버 응답 뒤). */
var SR = { st: "", id: "", name: "", why: "", open: "", test: false, stair: false, n: 0, at: "" };
var SR_WHY = {
  nocode: ["행사용 QR이 아니에요", "scan", "다시 스캔"],
  window: ["적립 시간이 아니에요", "exp", "확인"],
  off: ["지금 운영하지 않는 지점이에요", "staff", "담당자에게 적립 요청"],
  param: ["사번으로 입장한 뒤 스캔해 주세요", "exp", "확인"],
  server: ["서버에 연결되지 않았어요", "scan", "다시 스캔"],
  stair: ["계단 QR은 계단 화면에서 처리돼요", "scan", "다시 스캔"],
  att: ["17F 강연은 대강당 입구 출석 QR로 적립돼요", "scan", "다시 스캔"],   /* v4.26 옛 17F 좌석 QR(p3 코드) */
  dwin: ["추첨 체크인 시간이 아니에요", "exp", "확인"],   /* v4.79 창 · 날짜 밖(서버 window · day) */
  dclosed: ["체크인이 마감됐어요", "exp", "확인"],   /* v4.81 사회자 마감 뒤(서버 closed · 사용자 결정 261001) */
  retired: ["지금은 쓰지 않는 QR이에요", "scan", "다시 스캔"],   /* v4.83 전시 QR 퀴즈 벽 QR */
  other: ["다시 스캔해 주세요", "scan", "다시 스캔"]
};
function srShow(o) {
  SR = Object.assign({ st: "", id: "", name: "", why: "", open: "", test: false, stair: false, n: 0, at: "" }, o);
  if (App.current === "scan_res") App.render(); else App.go("scan_res");
}
function stampTitle(id) { var s = STAMPS.filter(function (x) { return x.id === id; })[0]; return s ? s.title : id; }
function srDupPopup(id, name, at, test) {
  notice({ key: "claim:dup:" + id, title: "이미 받음", body: (name || stampTitle(id)) + (at ? " · " + at + " 받음" : "") + (test ? " · 테스트 계정" : ""),
    go: "card:" + id, goLbl: "스탬프 보기" });
}
function srAct(k) {
  if (k === "scan") { scanOpen(SCQ.ctx); return; }
  if (k === "staff") { staffStampOpen(); return; }
  if (k === "card") { expStamp(SR.id); return; }
  App.tab("exp");
}
function scanResHtml() {
  var o = SR, h = "", bot = BOT_SVG;
  if (o.st === "link") return typeLinkHtml(o);   /* v5.61 1F 타자왕 노트북 접속 */
  if (o.st === "ok") {
    var n = Math.min(STAMP_DENOM, stampCount());
    h = '<div class="axs-res-bot">' + bot + "</div>" +
      '<span class="axs-chip ok axs-self">' + esc(o.name) + " · 적립 완료</span>" +
      '<h1 class="ax-title">스탬프 1개를<br>모았어요</h1>' +
      '<section class="axs-res-card"><p class="ax-type-t7 axs-bt">현재 스탬프</p><p class="axs-res-n">' + n + " / " + STAMP_DENOM + "개</p>" +
      '<p class="ax-description">' + esc(srGoalLine(stampCount())) + "</p></section>" +
      (o.test ? '<p class="ax-meta">테스트 계정 · 서버 적립 없음 · 이 기기에만 기록</p>' : "");
    return { body: h, btn: ax2Btn("스탬프 확인하기", "srAct('card')", "체험으로 돌아가기", "srAct('exp')") };
  }
  if (o.st === "saved") {
    h = '<div class="axs-res-bot">' + bot + "</div>" +
      '<span class="axs-chip off axs-self">스캔 저장됨</span>' +
      '<h1 class="ax-title">스캔을<br>저장했어요</h1>' +
      '<p class="ax-description">' + (o.stair ? "연결되면 찍은 순서대로 처리돼요" : "연결되면 자동으로 적립돼요") + "</p>" +
      '<p class="ax-meta">저장된 스캔 ' + scanQList().length + "건</p>";
    return { body: h, btn: ax2Btn("확인", "srAct('exp')") };
  }
  if (o.st === "draw") {   /* v4.79 추첨 체크인 완료 · 응모 번호(공) 수 · 0장이면 한 줄 */
    var dn = (o.nos || []).slice(0, 3);
    h = '<div class="axs-res-bot">' + bot + "</div>" +
      '<span class="axs-chip ok axs-self">' + (o.dup ? "이미 체크인 · " + esc(o.at) : "17F 대강당 · Outro") + "</span>" +
      '<h1 class="ax-title">추첨 체크인<br>완료</h1>' +
      '<section class="axs-res-card"><p class="ax-type-t7 axs-bt">응모 번호</p><p class="axs-res-n">' + (o.n ? o.n + "개" : "없음") + "</p>" +
      '<p class="ax-description">' + (dn.length ? dn.map(esc).join(" · ") : "행운권이 없어요 · 스탬프 4개부터") + "</p></section>" +
      (o.test ? '<p class="ax-meta">테스트 계정</p>' : "");
    return { body: h, btn: ax2Btn("확인", "srAct('exp')") };
  }
  var w = SR_WHY[o.why] || SR_WHY.other, dw = !!o.draw;
  h = '<span class="axs-chip err axs-self">' + (dw ? "체크인되지 않음" : "적립되지 않음") + "</span>" +
    '<h1 class="ax-title">' + (dw ? "체크인되지<br>않았어요" : "적립되지<br>않았어요") + "</h1>" +
    '<p class="ax-description">' + esc(w[0]) + (o.why === "window" && o.open ? " · " + esc(o.open) + " 적립" : o.why === "dwin" && o.open ? " · " + esc(o.open) : "") + "</p>" +
    (o.name ? '<p class="ax-meta">' + esc(o.name) + "</p>" : "");
  return { body: h, btn: ax2Btn(w[2], "srAct('" + w[1] + "')", w[1] === "exp" ? "" : "체험으로 돌아가기", "srAct('exp')") };
}
/* 적립 결과 한 줄 · 서버가 확인한 개수로만 */
function srGoalLine(n) {
  if (stampGot() > STAMP_DENOM) return STAMP_DENOM + "개 모두 모았어요";   /* v4.58 7·8번째 적립 · 개수 · 보상 그대로 */
  if (n === 3) return "룰렛 1회가 열렸어요 · 1F EVENT";
  if (n >= 4 && n <= REWARD_CAP) return "행운권 " + raffleTickets(n) + "장 · 자동 발급";
  return stampGoalText(n);
}
/* 하단 고정 버튼 1~2개 (주 행동 + 보조) */
function ax2Btn(a, ga, b, gb) {
  return '<div class="axs-fix ax-bottom"><button type="button" class="ax-button" onclick="' + ga + '">' + a + "</button>" +
    (b ? '<button type="button" class="ax-button ax-button-weak" onclick="' + gb + '">' + b + "</button>" : "") + "</div>";
}

/* ═══ 부스 QR (p1 · p2 · p3) · 판정은 서버 ═══ */
var STAMPQ = { busy: false };
function stampByCode(v, t) {
  v = String(v || "").trim();
  if (!v) return false;
  var u = S.get("user", {}) || {};
  if (!u.empId) { srShow({ st: "fail", why: "param" }); return false; }
  if (!BE.on) { srShow({ st: "fail", why: "server" }); return false; }
  /* 통신이 끊긴 게 확실하면 기다리지 않고 저장 · 앞선 전송이 진행 중이어도 순서를 지키려고 저장 */
  if (navigator.onLine === false || STAMPQ.busy || SCANQ.busy) { scanQAdd({ k: "stamp", code: v, ts: t || Date.now() }); return true; }
  STAMPQ.busy = true;
  beCall({ action: "stamp_claim", emp: u.empId, code: v },
    function (res) {
      STAMPQ.busy = false;
      if (beBusy(res)) { scanQAdd({ k: "stamp", code: v, ts: t || Date.now() }); return; }   /* v4.57 서버가 붐벼 처리하지 못함 · 저장했다가 다시 보낸다 */
      boothDone(res, false, v); scanQFlush();
    },
    function () { STAMPQ.busy = false; scanQAdd({ k: "stamp", code: v, ts: t || Date.now() }); });
  return true;
}
/* v4.57 서버 예외 응답(ok:false · err 만 있고 reason 없음) = 잠금 대기 초과 · 시트 붐빔 · 판정이 아니라 「지금 처리 못 함」 */
function beBusy(res) { return !!(res && !res.ok && ((res.err && !res.reason) || (res.reason === "busy" && res.retry) || (res.reason === "moved" && res.moved) || res.reason === "ses")); }   /* v4.61 새 서버 과부하(busy + retry) · 옛 서버 잠김(moved)도 저장 후 다시 보내기 */
/* 서버 응답 하나로 로컬을 맞춘다 · stamps 배열이 정본 */
function boothDone(res, late, code) {
  if (!res || !res.ok) {
    var why = res && res.reason;
    if (why === "stair") { stairByCode(code, "", "", Date.now()); return; }   /* 계단 코드가 부스 경로로 들어온 경우(옛 인쇄물) */
    if (late) { notice({ key: "claim:late:" + why, title: "저장한 스캔이 적립되지 않았어요", body: (SR_WHY[why] || SR_WHY.other)[0] }); return; }
    srShow({ st: "fail", why: SR_WHY[why] ? why : "other", open: res && res.open || "" });
    return;
  }
  if (!STAMPS.some(function (s) { return s.id === res.id; })) {   /* 스탬프 8종 밖 지점(구 p6 등) */
    if (late) return;
    srShow({ st: "fail", why: "other", name: res.name || res.id });
    return;
  }
  var id = res.id, name = res.name || stampTitle(id), test = !!res.dry;
  if (test) {
    var st0 = S.get("stamps", []);
    if (st0.indexOf(id) >= 0) { if (!late) srDupPopup(id, name, "", true); return; }
    ppSeenAdd(id); st0.push(id); S.set("stamps", st0);
  } else {
    if (res.dup) { stampSync(res.stamps); if (!late) srDupPopup(id, name, res.at || "", false); return; }
    ppSeenAdd(id);   /* 결과 화면이 연출이다 · 도장 팝을 겹치지 않는다 */
    stampSync(res.stamps);
  }
  PP.just[id] = hm2(new Date().getHours() * 60 + new Date().getMinutes());
  PP.open[id] = true;
  checkRewards();
  stampBuzz(25);
  if (late) { notice({ key: "claim:lateok:" + id, title: "저장한 스캔 적립", body: name + " · 스탬프 " + Math.min(STAMP_DENOM, stampCount()) + " / " + STAMP_DENOM, go: "card:" + id, goLbl: "스탬프 보기" }); return; }
  srShow({ st: "ok", id: id, name: name, test: test });
}
function ppSeenAdd(id) { var seen = ppSeenGet(); if (seen.indexOf(id) < 0) { seen.push(id); S.set("pp_seen", seen); } }
/* v5.07 본 기록(pp_seen) 키가 없을 때(로그인 · 로그아웃 직후 · 첫 동기화 전) 도장 하나를 본 것으로 적으면 키가 생겨, 첫 동기화의 기준선(stampSync)이 건너뛰어졌다.
   그러면 예전 스탬프가 「안 본 것」으로 남아 스탬프 탭에서 그 도장 연출이 다시 떴다(재로그인 때 최초 로그인 「이미 받음」 lgxLocal 이 동기화보다 먼저 오면).
   그때는 기준선 대기 표시(pp_base)를 남겨 첫 동기화가 서버 목록을 본 것으로 합친다. */
function ppSeenGet() { var s = S.get("pp_seen", null); if (s === null) { S.put("pp_base", 1); s = []; } return s; }
/* ═══ v4.79 Outro 럭키드로우 · 추첨 체크인 (사용자 결정 261001) ═══
   17F 대강당 입구 추첨 QR(AXD…)을 찍으면 draw_in · 코드 · 창(기본 16:40~17:25) · 날짜 · 1인 1회는 서버가 판정한다 · 앱에 코드가 없다.
   무대 추첨은 체크인한 사람의 응모 번호(공)만 쓴다 · 250개 사후 추첨은 따로다 · 스탬프 · 17F 출석과 무관하다.
   결과 = scan_res 「추첨 체크인 완료 · 응모 번호 N개」 · 0장이어도 체크인은 된다(한 줄) · 오프라인 저장은 하지 않는다(서버 시계로 판정 · 다시 스캔). */
var DRAWQ = { busy: false };
function drawByCode(code) {
  var u = S.get("user", {}) || {};
  if (!u.empId) { srShow({ st: "fail", why: "param", draw: true }); return; }
  if (!BE.on) { var dt = raffleTickets(Math.min(REWARD_CAP, stampCount())); srShow({ st: "draw", n: dt, nos: raffleNums().slice(0, dt), test: true }); return; }   /* 데모 · 서버 없음 */
  if (DRAWQ.busy) return;
  DRAWQ.busy = true;
  beCall({ action: "draw_in", emp: u.empId, code: String(code || "").trim() }, function (res) {
    DRAWQ.busy = false;
    if (res && res.ok) { S.set("draw_in", true); srShow({ st: "draw", n: Number(res.n) || 0, nos: Array.isArray(res.no) ? res.no : [], dup: !!res.dup, at: res.at || "", test: !!res.test }); return; }
    var why = res && res.reason;
    srShow({ st: "fail", draw: true, why: beBusy(res) ? "server" : why === "window" || why === "day" ? "dwin" : why === "closed" ? "dclosed" : why === "nocode" || why === "param" ? why : "other", open: res && res.open ? String(res.open).replace("~", "–") : "" });
  }, function () { DRAWQ.busy = false; srShow({ st: "fail", draw: true, why: "server" }); });
}
/* ═══ v4.26 17F QR 출석 (사용자 확정 260924) ═══
   17F 강연은 전부 자유 참석이다. 대강당 입구 QR 하나를 찍으면 프로그램 선택 시트(v4.18 바텀 시트)가 뜬다.
   지금 진행 중인 프로그램이 미리 골라져 있고, 참여자가 확인하거나 바꾼다.
   고를 수 있는 것 = 시작 ATT_17F.lead(15)분 전 ~ 종료인 프로그램만(미리 다 찍기 방지) · 없으면 다음에 열리는 시각을 알린다.
   코드는 앱에 없다 · 접두(AXA)로 출석 QR 임을 알아보고 코드 전체를 서버(att_claim)에 보낸다 · 코드 · 시간 창 · 중복은 서버가 다시 판정한다.
   한 사람이 여러 프로그램에 출석할 수 있다(같은 프로그램은 1회) · 첫 출석에서 스탬프 「프로그램 참여」 1회(서버 · A안).
   프로그램 표는 여기 한 곳 · 서버 ATT_PROGS 와 같아야 한다(검사 85절) · Outro 는 넣지 않는다 · 파트너 강연 시간은 잠정(이 표만 고친다).
   시각 모의: 테스트 모드(310555 · 데모)만 시트 안 「테스트 시각」 · 서버도 테스트 사번만 tm 을 받는다.
   v4.81 (사용자 결정 261001) 강연별 출석 QR = 같은 출석 코드 + &p=<강연 id>(key · road · l1 · l2) · 강의장 PPT 에 띄운다.
     찍으면 고르기 없이 그 강연으로 바로 att_claim · 시트는 결과(출석 · 이미 출석 · 시간 밖)만 · 서버는 바뀌지 않았다(옛 서버에서도 그대로 된다).
     모르는 p 는 무시하고 고르기 시트(a17 그대로) · p 를 모르는 옛 앱(열린 탭)도 고르기 시트로 간다.
   오프라인 저장은 하지 않는다(출석은 서버 시계로 판정 · 연결이 안 되면 다시 시도). */
var ATT_17F = { lead: 15, progs: [
  { id: "key", nm: "기조연설", sub: "Intro 포함", s: "09:30", e: "10:20" },
  { id: "road", nm: "내부 강연", sub: "현대해상 AX 로드맵", s: "10:30", e: "11:00" },
  { id: "l1", nm: "파트너사 강연 · AWS", sub: "Agentic AI 시대의 일하는 방식 변화", s: "13:30", e: "15:00" },
  { id: "l2", nm: "파트너사 강연 · MS", sub: "AI와 친해지기", s: "15:10", e: "16:40" }
] };
var ATT = { code: "", sel: "", res: null, fix: "" };
function attProg(id) { for (var i = 0; i < ATT_17F.progs.length; i++) if (ATT_17F.progs[i].id === id) return ATT_17F.progs[i]; return null; }
function attMine() { return S.get("att_mine", {}) || {}; }
function attMineAt(id) { return attMine()[id] || ""; }
function attFrom(x) { return t2m(x.s) - ATT_17F.lead; }
function attWinLbl(x) { return hm2(attFrom(x)) + "–" + x.e; }
/* 261005 최종 QA · 그 강연의 출석 창이 끝났는가(행사 뒤 = 늘 끝) · 상세 화면이 끝난 뒤에도 「출석 QR 스캔」을 내밀던 것 */
function attShut(x) { var ph = evPhase(); return !!x && (ph === "after" || (ph === "live" && attNow() >= t2m(x.e))); }
function attTm() { var v = testMode() ? String(S.get("att_tm", "") || "") : ""; return /^\d{1,2}:\d{2}$/.test(v) ? v : ""; }
function attNow() { var tm = attTm(); if (tm) return t2m(tm); var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
/* 지금 창 · open = 고를 수 있는 id · sel = 미리 고를 것(아직 출석 안 한 것 중 진행 중 우선, 없으면 곧 시작할 것) · next = 다음에 열리는 것 */
function attWin(t) {
  var open = [], sel = "", selK = 99999, next = null, mine = attMine();
  ATT_17F.progs.forEach(function (x) {
    var a = attFrom(x), s0 = t2m(x.s), b = t2m(x.e);
    if (t >= a && t <= b) {
      open.push(x.id);
      var k = (t >= s0 ? 0 : 10000) + s0;
      if (!mine[x.id] && k < selK) { sel = x.id; selK = k; }
    } else if (t < a && (!next || a < attFrom(next))) next = x;
  });
  return { open: open, sel: sel, next: next };
}
function attByCode(code, fixId) {
  var u = S.get("user", {}) || {};
  if (!u.empId) { srShow({ st: "fail", why: "param" }); return; }
  var w = attWin(attNow()), fx = attProg(String(fixId || "").toLowerCase());
  ATT.code = String(code || "").trim(); ATT.res = null; ATT.sel = fx ? fx.id : w.sel; ATT.fix = fx ? fx.id : "";
  var pid = fx ? fx.id : w.sel || (w.open[0]) || (w.next && w.next.id) || "l2";
  var go = function () { PROG.sid = pid; App.go("sess_d"); sheetOpen(attSpec()); if (fx) attGo(); };   /* 뒤에는 그 강연 상세 · 시트를 닫으면 출석 상태가 보인다 · v4.81 강연별 QR 은 바로 출석 */
  if (typeof qrGated === "function" && qrGated()) qrGateDefer(go); else go();
}
function attRowHtml(x, t, mine) {
  var a = attFrom(x), s0 = t2m(x.s), b = t2m(x.e), at = mine[x.id], can = !at && t >= a && t <= b, on = can && ATT.sel === x.id;
  var st = at ? "출석 " + at : t > b ? "종료" : t < a ? hm2(a) + "부터" : t >= s0 ? "진행 중" : x.s + " 시작";
  return '<button type="button" class="axs-att" role="radio" aria-checked="' + on + '"' + (can ? ' onclick="attPick(\'' + x.id + '\')"' : " disabled") + ">" +
    '<span class="rd" aria-hidden="true"></span><span class="nm">' + esc(x.nm) + "</span>" +   /* 한 줄 · 큰글씨 360×640 에서도 시트 안 스크롤 없게(design.md A 5-7) · 시각은 상태 칸과 강연 상세 */
    '<span class="st">' + esc(st) + "</span></button>";
}
/* 시트 내용 · 고르기 · 시간 밖 · 결과 세 모양 (M03 바텀 시트 · 자유 입력 없음) */
function attSpec() {
  var r = ATT.res, tmRow = testMode() ? '<label class="axs-attt">테스트 · 시각<input type="time" value="' + esc(attTm()) + '" onchange="attTmSet(this.value)"></label>' : "";
  if (r) {
    var x = attProg(r.id) || { nm: r.id };
    return { id: "att", title: r.dup ? "이미 출석했어요" : "출석했어요", lead: "<b>" + esc(x.nm) + "</b><br>10월 26일 " + esc(r.at) + " 출석",
      body: (r.stamp ? '<div class="ax-inset axs-attok"><p class="ax-card-title">스탬프 「프로그램 참여」 적립</p><p class="ax-description">현재 스탬프 ' + r.stamp + " / " + STAMP_DENOM + "개</p></div>" : "") +
        (r.test ? '<p class="ax-meta">테스트 계정 · 출석은 테스트 기록 · 스탬프는 이 기기에만</p>' : ""),
      go: "sheetClose()", goLbl: "확인" };
  }
  if (ATT.fix) { var fx = attProg(ATT.fix);   /* v4.81 강연별 QR · 고르기 없음 · 실패하면 「다시 시도하기」 */
    return { id: "att", title: "17F 강연 출석", lead: "<b>" + esc(fx.nm) + "</b>", body: tmRow, go: "attGo()", goLbl: "출석하기", goBusy: "출석하는 중" }; }
  var t = attNow(), w = attWin(t), mine = attMine();
  var list = '<div class="axs-attl" role="radiogroup" aria-label="출석할 강연">' + ATT_17F.progs.map(function (x) { return attRowHtml(x, t, mine); }).join("") + "</div>";
  if (w.sel) return { id: "att", title: "17F 강연 출석", lead: "시작 " + ATT_17F.lead + "분 전부터 출석할 수 있어요", body: list + tmRow,
    go: "attGo()", goLbl: "출석하기", goBusy: "출석하는 중", goOff: !ATT.sel };
  var lead = w.open.length ? "지금 출석할 수 있는 강연은<br>모두 출석했어요" :
    w.next ? "다음 출석 · <b>" + esc(w.next.nm) + "</b><br>" + hm2(attFrom(w.next)) + "부터 (" + w.next.s + " 시작)" : "오늘 17F 강연 출석이 끝났어요";
  return { id: "att", title: w.open.length ? "17F 강연 출석" : "지금은 출석 시간이 아니에요", lead: lead, body: list + tmRow, go: "sheetClose()", goLbl: "확인" };
}
function attRepaint() { if (SHEET.busy) botWait(false); SHEET.busy = false; SHEET.spec = attSpec(); if (el("axsSheet")) sheetPaint(); }
function attPick(id) { if (SHEET.busy || ATT.res) return; ATT.sel = id; SHEET.err = null; attRepaint(); }
function attTmSet(v) { S.set("att_tm", /^\d{1,2}:\d{2}$/.test(v || "") ? v : ""); ATT.res = null; ATT.sel = attWin(attNow()).sel; SHEET.err = null; attRepaint(); }
function attGo() {
  if (SHEET.busy || ATT.res) return;
  var x = attProg(ATT.sel), u = S.get("user", {}) || {};
  if (!x) return;
  if (!BE.on) { attLocal(x); return; }   /* 데모(서버 없음) · 같은 규칙을 이 기기에서 */
  sheetBusy(true);
  var p = { action: "att_claim", emp: u.empId, code: ATT.code, prog: x.id }, tm = attTm();
  if (tm && testEmp()) p.tm = tm;
  beCall(p, attDone, function () { sheetFail({ t: "연결이 불안정해 출석하지 못했어요", b: "출석은 아직 되지 않았어요. 다시 시도해 주세요." }); });
}
function attLocal(x) {
  var t = attNow(), at = attMineAt(x.id);
  if (!at && (t < attFrom(x) || t > t2m(x.e))) return attDone({ ok: false, reason: "window", open: attWinLbl(x) });
  var first = !Object.keys(attMine()).length;
  attDone({ ok: true, prog: x.id, at: at || hm2(t), dup: !!at, mine: [], stamp: !at && first ? { id: "p3", dry: true } : null, test: true });
}
function attDone(res) {
  if (!res || !res.ok) {
    var why = res && res.reason, x = attProg(ATT.sel);
    if (why === "nocode") { sheetClose(true); srShow({ st: "fail", why: "nocode" }); return; }
    if (why === "window") { sheetFail({ t: "출석 시간이 아니에요", b: (x ? x.nm + " · " : "") + String(res.open || "").replace("~", "–") + " 출석" }); return; }
    sheetFail({ t: "출석하지 못했어요", b: "다시 시도해 주세요." });
    return;
  }
  var m = attMine();
  (res.mine || []).forEach(function (y) { if (y && y.id) m[y.id] = y.at; });
  if (!m[res.prog]) m[res.prog] = res.at;
  S.set("att_mine", m);
  ATT.res = { id: res.prog, at: m[res.prog], dup: !!res.dup, stamp: attStamp(res), test: !!res.test };
  attRepaint();
  App.render();   /* 뒤의 강연 상세 · 시간표 행이 「출석 완료」로 바뀐다 */
}
/* 첫 출석 스탬프 p3 · 서버 목록이 정본(boothDone 과 같은 순서) · 테스트(dry)는 이 기기에만 · 새로 받았으면 현재 개수 */
function attStamp(res) {
  var st = res.stamp;
  if (!st) return 0;
  if (st.dry) {
    var s0 = S.get("stamps", []);
    if (s0.indexOf("p3") >= 0) return 0;
    ppSeenAdd("p3"); s0.push("p3"); S.set("stamps", s0);
  } else {
    if (st.dup) { if (st.stamps) stampSync(st.stamps); return 0; }
    ppSeenAdd("p3");
    if (st.stamps) stampSync(st.stamps);
  }
  PP.just.p3 = hm2(new Date().getHours() * 60 + new Date().getMinutes());
  checkRewards();
  stampBuzz(25);
  return Math.min(STAMP_DENOM, stampCount());
}

/* ═══ 스캔 대기열 · 통신이 약한 곳(계단 복도 등) · 찍은 순서대로 보낸다 ═══
   항목 = { k: "stamp" | "stair", code, fl, r, ts(기기 시각), emp(찍은 사번 · v4.54) } · 옛 항목({code, ts})은 코드 접두로 가른다.
   v4.54 scanQList 는 지금 로그인 사번의 항목만 돌려준다 · 다른 사번 · 사번 없는 옛 항목은 보내지 않고 다음 저장 때 버린다.
   부스는 같은 코드를 한 번만 담는다(서버가 1인 1회) · 계단은 시작·종료가 따로라 모두 담는다. */
var SCANQ = { busy: false };
function scanQList() { var q = S.get("scan_q", []); return Array.isArray(q) ? q.filter(ownIs) : []; }
function scanQKind(x) { return x.k || (/^AXW/i.test(String(x.code || "")) ? "stair" : "stamp"); }
function scanQAdd(it) {
  it.emp = ownEmp();
  var q = scanQList(), up = String(it.code).toUpperCase(), stair = scanQKind(it) === "stair";
  if (stair || !q.some(function (x) { return scanQKind(x) === "stamp" && String(x.code).toUpperCase() === up; })) q.push(it);
  S.set("scan_q", q.slice(-30));
  srShow({ st: "saved", stair: stair });
}
function scanQNote() {
  var n = scanQList().length;
  return n ? '<p class="nt">저장된 스캔 ' + n + "건 · 연결되면 처리됩니다</p>" : "";
}
function scanQFlush() {
  if (!BE.on || SCANQ.busy || STAMPQ.busy || STR.busy) return;
  var q = scanQList(), u = S.get("user", {}) || {};
  if (!q.length || !u.empId) return;
  if (navigator.onLine === false) return;
  var it = q[0], stair = scanQKind(it) === "stair";
  if (String(it.emp) !== String(u.empId)) return;   /* v4.54 scanQList 가 이미 거르지만 한 번 더 · 다른 사번 항목은 절대 보내지 않는다 */
  SCANQ.busy = true;
  var drop = function () { var qq = scanQList(); if (qq.length && qq[0].code === it.code && qq[0].ts === it.ts) qq.shift(); S.set("scan_q", qq); };
  var p = stair ? { action: "stair_scan", emp: u.empId, code: it.code, fl: it.fl || "", r: it.r || "", t: it.ts || "" } : { action: "stamp_claim", emp: u.empId, code: it.code };
  beCall(p, function (res) {
    SCANQ.busy = false;
    if (beBusy(res)) return;   /* v4.57 서버가 붐벼 처리하지 못함 · 대기열에 그대로 두고 다음 sync 성공 때 다시 */
    drop();   /* 응답이 왔으면(성공·거부 모두) 대기열에서 뺀다 */
    if (stair) stairDone(res, { code: it.code, fl: it.fl, r: it.r, t: it.ts }, true); else boothDone(res, true, it.code);
    if (["passport", "home", "exp", "exp_g"].indexOf(App.current) >= 0) App.render();
    setTimeout(scanQFlush, 400);
  }, function () { SCANQ.busy = false; });
}
window.addEventListener("online", function () { setTimeout(scanQFlush, 800 + beJit()); });   /* v4.57 0~5초 무작위 지연 */
document.addEventListener("visibilitychange", function () { if (!document.hidden) setTimeout(scanQFlush, 800 + beJit()); });

/* ═══ 계단 B안 · 화면 stair (시작 · 종료 · 보정 · 새로 시작 묻기 · 재분류) ═══
   로컬 상태 S "stair" = { leg: { fl, r, route, at, since } | null, total, goal } · 서버 sync my.stair 가 정본 */
var STR = { mode: "idle", res: null, sc: null, busy: false, err: "", pick: null, tick: null };
var STAIR_SAFE = "뛰지 마세요 · 방화문은 닫아 주세요";
/* v4.54 다른 사번 · 사번 없는 옛 상태는 없는 것으로 본다(진행 중 표시 · 도착 층 안내가 다음 사람에게 뜨지 않게) · 서버 sync 가 곧 내 것을 채운다 */
function stairState() { var s = S.get("stair", null); return ownIs(s) ? s : { leg: null, total: 0, goal: 1 }; }
function stairPut(s) { S.set("stair", Object.assign({}, s, { emp: ownEmp() })); }
function stairRoute(r) { return r == 2 ? "비상계단 2" : r == 1 ? "비상계단 1" : ""; }
function stairByCode(code, fl, r, t) {
  var u = S.get("user", {}) || {};
  if (!u.empId) { srShow({ st: "fail", why: "param" }); return; }
  if (!BE.on) { srShow({ st: "fail", why: "server" }); return; }
  var sc = { code: code, fl: fl || "", r: r || "", t: t || Date.now() };
  if (navigator.onLine === false || STR.busy || SCANQ.busy) { scanQAdd({ k: "stair", code: code, fl: sc.fl, r: sc.r, ts: sc.t }); return; }
  stairCall({ action: "stair_scan", emp: u.empId, code: code, fl: sc.fl, r: sc.r, t: sc.t }, sc, true);
}
/* queue = 네트워크 실패 시 저장(스캔만 · 보정·재분류는 화면에서 다시 시도) */
function stairCall(p, sc, queue) {
  STR.busy = true; STR.err = ""; STR.sc = sc;
  if (App.current !== "stair") { STR.mode = "load"; App.go("stair"); } else App.render();
  beCall(p, function (res) {
      STR.busy = false;
      if (queue && beBusy(res)) { STR.mode = "idle"; scanQAdd({ k: "stair", code: sc.code, fl: sc.fl, r: sc.r, ts: sc.t }); return; }   /* v4.57 서버가 붐빔 · 저장 */
      stairDone(res, sc, false, p.action); scanQFlush();
    },
    function () {
      STR.busy = false;
      if (queue) { STR.mode = "idle"; scanQAdd({ k: "stair", code: sc.code, fl: sc.fl, r: sc.r, ts: sc.t }); return; }
      STR.err = "연결이 불안정해 처리하지 못했어요"; App.render();
    });
}
function stairDone(res, sc, late, act) {
  if (!res || !res.ok) {
    var why = res && res.reason;
    if (why === "booth") { stampByCode(sc.code, sc.t); return; }
    if (late) { notice({ key: "stair:late:" + why, title: "저장한 계단 스캔이 처리되지 않았어요", body: (SR_WHY[why] || SR_WHY.other)[0] }); return; }
    if (act === "stair_fix" || act === "stair_reclass") { STR.err = why === "noleg" || why === "noend" || why === "open" ? "이미 처리된 기록이에요 · 다시 스캔해 주세요" : "다시 시도해 주세요"; App.render(); return; }
    STR.mode = "idle"; srShow({ st: "fail", why: SR_WHY[why] ? why : "other", stair: true });
    return;
  }
  var s = stairState();
  s.total = res.total != null ? res.total : s.total; s.goal = res.goal || s.goal || 1;
  if (res.leg === "start") s.leg = { fl: res.fl, r: res.r, route: res.route, at: res.at, since: res.since || sc.t || Date.now() };
  else if (res.leg === "dup" || res.leg === "fix") s.leg = res.from ? { fl: res.from.fl, r: res.from.r, route: res.from.route, at: res.from.at, since: res.from.since || 0 } : s.leg;
  else s.leg = null;
  stairPut(s);
  var st = res.stamp;
  if (st && !st.dup && !st.revoked && !st.kept && st.id === "st") {
    ppSeenAdd("st");
    if (st.dry) { var l = S.get("stamps", []); if (l.indexOf("st") < 0) { l.push("st"); S.set("stamps", l); } }
    else if (res.stamps) stampSync(res.stamps);
    PP.just.st = hm2(new Date().getHours() * 60 + new Date().getMinutes());
    checkRewards(); stampBuzz(25);
  } else if (st && st.revoked) {
    if (st.dry || testEmp()) S.set("stamps", S.get("stamps", []).filter(function (x) { return x !== "st"; }));
    else if (res.stamps) stampSync(res.stamps);
  }
  if (res.leg === "start" && !res.reclass) stampBuzz(25);
  if (late) {
    var body = res.leg === "end" ? res.from.fl + "F → " + res.to.fl + "F · " + res.floors + "개 층" + (s.goal > 1 ? " · 누적 " + res.total + " / " + s.goal : "")
      : res.leg === "start" ? res.fl + "F 시작 · " + stairRoute(res.r) : res.leg === "fix" ? "지난번 종료를 찍지 않았어요" : res.fl + "F";
    STR.res = res; STR.sc = sc; STR.mode = res.leg === "dup" ? "start" : res.leg;
    notice({ key: "stair:late:" + res.leg + ":" + (sc.t || ""), title: "저장한 계단 스캔 처리", body: body, go: "stair", goLbl: "계단 화면" });
    return;
  }
  STR.res = res; STR.pick = null;
  STR.mode = act === "stair_fix" ? "ask" : res.leg === "dup" ? "start" : res.leg;
  if (App.current === "stair") App.render(); else App.go("stair");
}
/* 체험 › 계단 이용 · 진행 중이면 진행 화면, 아니면 안내(E02) */
function stairOpen() {
  var s = stairState();
  if (s.leg) { STR.res = { leg: "start", fl: s.leg.fl, r: s.leg.r, route: s.leg.route, at: s.leg.at, since: s.leg.since, total: s.total, goal: s.goal }; STR.mode = "start"; STR.err = ""; App.go("stair"); return; }
  expGuide("st");
}
function stairPick(fl) {
  if (STR.busy) return;
  STR.pick = fl; STR.err = "";
  App.render();   /* v4.08 고르기만 한다 · 확정은 아래 고정 주 버튼(stairPickGo) */
}
function stairPickGo() {
  if (STR.busy || STR.pick == null) return;
  var u = S.get("user", {}) || {}, sc = STR.sc || {}, fl = STR.pick;
  if (STR.mode === "reclass") stairCall({ action: "stair_reclass", emp: u.empId, code: sc.code, fl: sc.fl || "", r: sc.r || "", t: Date.now(), endFl: fl }, sc, false);
  else stairCall({ action: "stair_fix", emp: u.empId, endFl: fl, t: Date.now() }, sc, false);
}
/* 보정 뒤 「여기서 새로 시작할까요?」 · 시작 = 방금 찍은 코드로 다시 스캔 */
function stairRestart() {
  var sc = STR.sc || {}, u = S.get("user", {}) || {};
  if (!sc.code || STR.busy) { App.tab("exp"); return; }
  stairCall({ action: "stair_scan", emp: u.empId, code: sc.code, fl: sc.fl || "", r: sc.r || "", t: Date.now() }, { code: sc.code, fl: sc.fl, r: sc.r, t: Date.now() }, true);
}
function stairReclassOpen() { STR.mode = "reclass"; STR.err = ""; STR.pick = null; App.render(); }
function stairElapsed(since) {
  var s = Math.max(0, Math.round((Date.now() - (since || Date.now())) / 1000));
  var m = Math.floor(s / 60), h = Math.floor(m / 60);
  return h ? h + "시간 " + (m % 60) + "분" : m ? m + "분 " + (s % 60) + "초" : s + "초";
}
function stairSec(sec) { sec = Math.max(0, sec || 0); var m = Math.floor(sec / 60); return m ? m + "분 " + (sec % 60) + "초" : sec + "초"; }
/* 도트 계단 · 10초에 한 칸 · 12칸이면 비우고 반복 · 시작 시각 기준이라 화면을 껐다 켜도 이어진다 · 챗봇이 맨 위 칸에 선다 */
function stairDotsHtml(since) {
  var k = Math.floor(Math.max(0, Date.now() - (since || Date.now())) / 10000) % 12 + 1, d = "", x, y, SZ = 10;
  for (x = 0; x < 12; x++) for (y = 0; y <= x; y++)
    d += '<circle cx="' + (x * SZ + 5) + '" cy="' + (115 - y * SZ) + '" r="3.4" class="' + (x < k ? "on" : "") + '"/>';
  /* 상자 120 × 160 · 도트는 아래 120 · 챗봇(폭 32%)이 그 칸 맨 위 도트에 선다 */
  var bx = (k - 1) * SZ - 14, by = 114 - (k - 1) * SZ;
  STR.k = k;
  return '<div class="axs-stairs" aria-hidden="true"><svg viewBox="0 0 120 120">' + d + "</svg>" +
    '<span class="axs-stbot" style="left:' + (bx / 120 * 100).toFixed(1) + "%;top:" + (by / 160 * 100).toFixed(1) + '%">' + BOT_SVG + "</span></div>";
}
/* v4.92 (261001 사용자 확정) 목표 = 서버 goal(기본 1 · 한 개 층만 오르내려도 적립) · 1이면 막대 없이 한 줄 · 옛 서버(10)면 누적 막대 */
function stairLine(s) { var g = s.goal || 1, t = s.total || 0; return g > 1 ? "방화문 QR · 누적 " + t + " / " + g + "개 층" : t >= g ? "방화문 QR · " + t + "개 층 이동" : "방화문 QR · 한 개 층 이상"; }
function stairGauge(total, goal) {
  if ((goal || 1) <= 1) return '<p class="ax-type-t6-strong">' + ((total || 0) >= 1 ? "오늘 " + total + "개 층 이동" : "한 개 층만 이동해도 적립") + "</p>";
  var pct = Math.min(100, Math.round((total || 0) / goal * 100));
  return '<div class="axs-gauge" role="img" aria-label="누적 ' + total + " / " + goal + '개 층"><i style="width:' + pct + '%"></i></div>' +
    '<p class="ax-type-t6-strong">누적 ' + total + (total >= goal ? "개 층" : " / " + goal + "개 층") + "</p>";
}
function stairFloorPick(label) {
  var b = "";
  for (var f = 1; f <= 18; f++) b += '<button type="button" class="axs-slot" aria-pressed="' + (STR.pick === f) + '"' + (STR.busy ? " disabled" : "") + ' onclick="stairPick(' + f + ')">' + f + "F</button>";
  return '<p class="ax-type-t6-strong">' + label + "</p>" +
    '<div class="axs-slots axs-fl6">' + b + '<button type="button" class="axs-slot axs-none" aria-pressed="' + (STR.pick === 0) + '"' + (STR.busy ? " disabled" : "") + ' onclick="stairPick(0)">계단을 쓰지 않았어요</button></div>' +
    (STR.busy ? botHtml("확인하는 중", { wait: 1 }) : "") +
    (STR.err ? '<div class="axs-err" role="alert"><b>처리하지 못했어요</b>' + esc(STR.err) + "</div>" : "");
}
/* v4.08 보정 화면 아래 고정 · v4.09 버튼 하나 = 고른 층으로 보정하기(고르기 전엔 꺼짐) · 나가기는 헤더 뒤로 */
function stairPickBtn() {
  var p = STR.pick, lbl = p == null ? "층을 골라 주세요" : p === 0 ? "계단 안 씀으로 보정하기" : p + "F로 보정하기";
  return '<div class="axs-fix ax-bottom"><button type="button" class="ax-button" id="stGo" onclick="stairPickGo()"' + (p == null || STR.busy ? " disabled" : "") + ">" + (STR.busy ? "보정하는 중" : lbl) + "</button></div>";
}
function stairHtml() {
  var o = STR.res || {}, s = stairState(), goal = s.goal || 1, m = STR.mode;
  if (m === "load" || (STR.busy && m !== "fix" && m !== "reclass")) return { body: botHtml("확인하는 중", { wait: 1 }), btn: "" };
  if (m === "start") {
    var since = o.since || (s.leg && s.leg.since) || Date.now();
    return { body:
      stampTagHtml("st") + '<div class="axs-chiprow"><span class="axs-chip">진행 중</span>' + (o.leg === "dup" ? '<span class="axs-chip off">이미 시작함</span>' : "") + (o.reclass ? '<span class="axs-chip off">새로 시작으로 바꿈</span>' : "") + "</div>" +
      (o.reclass && o.stamp && o.stamp.revoked ? '<p class="ax-meta">' + (goal > 1 ? "누적이 " + goal + "개 층 아래라" : "이동한 층이 없어") + " 계단 스탬프가 취소됐어요</p>" : "") +
      '<div class="axs-strow"><div class="ax-stack-tight"><h1 class="ax-title">계단 이용 시작</h1>' +
      '<p class="axs-st-big">' + o.fl + "F · " + esc(o.route || stairRoute(o.r)) + "</p></div>" + stairDotsHtml(since) + "</div>" +
      '<p class="axs-safe">' + STAIR_SAFE + "</p>" +
      '<section class="ax-card axs-gap12"><p class="ax-type-t5-strong">도착 층 방화문 앞 QR 스캔</p>' + stairGauge(s.total || o.total || 0, goal) + "</section>" +
      '<p class="ax-meta" id="stElapsed">시작 ' + esc(o.at || (s.leg && s.leg.at) || "") + " · " + stairElapsed(since) + "</p>",
      btn: ax2Btn("도착 층 QR 스캔", "scanOpen('st')", "확인", "App.tab('exp')") };
  }
  if (m === "end") {
    var got = o.stamp && !o.stamp.dup && o.stamp.id === "st";
    return { body:
      (got ? '<div class="axs-res-bot">' + BOT_SVG + "</div>" : "") +
      '<div class="axs-chiprow"><span class="axs-chip ok">종료</span>' + (got ? '<span class="axs-chip ok">계단 스탬프 적립</span>' : "") + "</div>" +
      '<h1 class="ax-title">' + o.from.fl + "F → " + o.to.fl + "F</h1>" +
      '<p class="axs-st-big">' + o.floors + "개 층</p>" +
      '<p class="ax-meta">' + stairSec(o.sec) + "</p>" +
      '<section class="ax-card axs-gap12">' + stairGauge(o.total, goal) +
      (got ? '<p class="ax-description">스탬프 ' + Math.min(STAMP_DENOM, stampCount()) + " / " + STAMP_DENOM + " · " + esc(srGoalLine(stampCount())) + "</p>" : "") +
      (got && o.stamp.dry ? '<p class="ax-meta">테스트 계정 · 서버 적립 없음</p>' : "") + "</section>" +
      '<button type="button" class="ax-link axs-plain axs-self" onclick="stairReclassOpen()">종료가 아니라 새로 시작이에요</button>',
      btn: ax2Btn(got ? "스탬프 확인하기" : "확인", got ? "expStamp('st')" : "App.tab('exp')") };
  }
  if (m === "fix") {
    return { body:
      '<span class="axs-chip axs-self">보정</span>' +
      '<h1 class="ax-title">지난번 종료를<br>찍지 않았어요</h1>' +
      '<p class="ax-description">' + o.from.fl + "F 시작 · " + esc(o.from.at || "") + "</p>" +
      '<section class="ax-card axs-gap12">' + stairFloorPick("지난번 종료 층을 눌러 주세요") + "</section>" +
      '<p class="ax-meta">고른 층수대로 적립돼요</p>', btn: stairPickBtn() };
  }
  if (m === "reclass") {
    var vf = o.from ? o.from.fl : "";
    return { body:
      '<span class="axs-chip axs-self">새로 시작</span>' +
      '<h1 class="ax-title">지난번 종료 층을<br>눌러 주세요</h1>' +
      '<p class="ax-description">' + vf + "F 시작 · 방금 스캔은 " + (o.to ? o.to.fl : "") + "F 새 시작으로 바꿔요</p>" +
      '<section class="ax-card axs-gap12">' + stairFloorPick("지난번 종료 층") + "</section>" +
      '<p class="ax-meta">고른 층수대로 적립돼요</p>', btn: stairPickBtn() };
  }
  if (m === "ask") {
    var st2 = o.stamp && !o.stamp.dup && o.stamp.id === "st", sc = STR.sc || {};
    return { body:
      '<div class="axs-chiprow"><span class="axs-chip ok">보정 완료</span><span class="axs-chip off">자기 신고</span>' + (st2 ? '<span class="axs-chip ok">계단 스탬프 적립</span>' : "") + "</div>" +
      '<p class="ax-description">' + (o.endFl ? o.from.fl + "F → " + o.endFl + "F · " + o.floors + "개 층" : "계단을 쓰지 않음") + "</p>" +
      '<h1 class="ax-title">여기서 새로<br>시작할까요?</h1>' +
      (sc.fl ? '<p class="axs-st-big">' + esc(sc.fl) + "F" + (sc.r ? " · " + stairRoute(sc.r) : "") + "</p>" : "") +
      '<section class="ax-card axs-gap12">' + stairGauge(o.total, goal) + "</section>",
      btn: ax2Btn("여기서 시작할게요", "stairRestart()", "시작하지 않을게요", "App.tab('exp')") };
  }
  return { body: botHtml("진행 중인 계단 이용이 없어요"), btn: ax2Btn("계단 안내", "expGuide('st')") };
}
/* 진행 화면이 떠 있는 동안 1초마다 경과·도트만 갈아 끼운다(재렌더 없음) */
function stairTickOn() {
  if (STR.tick) return;
  STR.tick = setInterval(function () {
    if (App.current !== "stair" || STR.mode !== "start") { clearInterval(STR.tick); STR.tick = null; return; }
    var o = STR.res || {}, s = stairState(), since = o.since || (s.leg && s.leg.since) || Date.now();
    var e = el("stElapsed"); if (e) e.textContent = "시작 " + (o.at || (s.leg && s.leg.at) || "") + " · " + stairElapsed(since);
    var d = document.querySelector("#view .axs-stairs"), k = Math.floor(Math.max(0, Date.now() - since) / 10000) % 12 + 1;
    if (d && k !== STR.k && !matchMedia("(prefers-reduced-motion: reduce)").matches) d.outerHTML = stairDotsHtml(since);   /* 칸이 바뀔 때만 · 떠 있기 모션이 끊기지 않게 */
  }, 1000);
}

/* ═══ E02 · 체험 방법과 적립 조건 (현장 활동 하나) ═══ */
var EXPG = { id: "st" };
var EXP_GUIDE = {
  /* v5.64 옛 p1(전시 QR) · p7(벽 QR 퀴즈) 안내 삭제 · 지금 스탬프 8종에 없고 들어가는 길도 없다(정리 기록.md) */
  /* v4.83 (261001) AX PLAY · 스태프 인증 · 참가자가 찍는 부스 QR 은 보관 · 체험 뒤 스태프가 내 QR 을 찍는다(스태프 모드 목적 타일 「AX PLAY」) */
  p2: { chip: "1F · AX PLAY", h: "AX PLAY에서<br>체험해 보세요", d: "HiDI-Q 또는 Hi-Helper를 체험한 뒤 스태프에게 내 QR을 보여 주세요.",
    steps: [["부스 체험", "HiDI-Q · Hi-Helper 중 1곳"], ["내 QR 보여주기", "스태프가 내 QR을 스캔"], ["적립 확인", "스탬프 탭에서 확인"]],
    meta: "09:30~16:30 · 1인 1회", cta: "내 QR 보여주기", act: "qrPanelOpen('mine')" },
  st: { chip: "1F~18F · 비상계단 1·2", h: "계단으로<br>이동해 보세요", d: "한 개 층만 이동해도 스탬프를 받아요.",   /* 261005 최종 QA · 「출발 층과 도착 층 방화문 앞 QR을 찍어요」 = 아래 단계 01 · 03 과 같은 말 */
    steps: [["출발 층 QR 스캔", "방화문 앞 QR"], ["계단으로 이동", STAIR_SAFE], ["도착 층 QR 스캔", "오르기·내려가기 모두 인정"]],
    meta: "", cta: "계단 QR 스캔하기" }
};
function expGuide(id) { EXPG.id = EXP_GUIDE[id] ? id : "st"; App.go("exp_g"); }
function expGuideHtml() {
  var id = EXPG.id, g = EXP_GUIDE[id], s = stairState();
  var steps = g.steps.map(function (x, i) {
    return '<li><span class="axs-no">0' + (i + 1) + '</span><span class="axs-tx"><b class="ax-type-t5-strong">' + x[0] + '</b><span class="ax-meta">' + esc(x[1]) + "</span></span></li>";
  }).join("");
  var prog = "";
  if (id === "st" && ((s.goal || 1) > 1 || (s.total || 0) >= 1 || s.leg)) {   /* 261005 최종 QA · 아직 안 한 사람(목표 1 · 0개 층)에게는 「한 개 층만 이동해도 적립」만 든 카드가 설명 줄을 한 번 더 말했다 · 이동 기록이 있을 때만 */
    prog = '<section class="ax-card axs-gap12">' + stairGauge(s.total || 0, s.goal || 1) +
      (s.leg ? '<p class="ax-description">진행 중 · ' + s.leg.fl + "F " + esc(s.leg.route || stairRoute(s.leg.r)) + " 시작 · " + esc(s.leg.at || "") + "</p>" +
        '<button type="button" class="ax-button ax-button-weak" onclick="stairOpen()">진행 화면 보기</button>' : "") + "</section>";
  }
  return '<div class="ax-stack axs-sthost">' + stampTagHtml(id) +   /* v4.70 오른쪽 위 도장 · 옛 「적립 완료」 칩은 도장이 대신한다 */
    '<div class="axs-chiprow"><span class="axs-chip">' + esc(g.chip) + "</span></div>" +
    '<div class="ax-stack-tight"><h1 class="ax-title">' + g.h + '</h1><p class="ax-description">' + esc(id === "st" && (s.goal || 1) > 1 ? "출발 층과 도착 층 방화문 앞 QR을 찍어요. 누적 " + s.goal + "개 층이면 스탬프를 받아요." : g.d) + "</p></div>" +
    prog +
    '<ol class="axs-steps">' + steps + "</ol>" +
    (g.meta ? '<p class="ax-meta">' + esc(g.meta) + "</p>" : "") +
    scanQNote() +
    (g.link ? '<button type="button" class="ax-link axs-plain axs-self" onclick="' + g.link[1] + '">' + g.link[0] + "</button>" : "") +
    "</div>" + ax2Btn(g.cta, g.act || "scanOpen('" + id + "')");   /* v4.83 act = 스캔 대신 할 일(AX PLAY = 내 QR) */
}

/* ═══ Q02 · 활동 QR 인식 · 카메라 권한 → 검증 요청 → 결과 ═══ */
var SCQ = { ctx: "", err: "", paused: false, tab: "mine" };   /* v5.23 tab = mine(기본) | scan */
var SCQ_TT = { p1: "전시 QR을", p2: "체험 QR을", p7: "벽 QR을", st: "계단 QR을", p3: "출석 QR을", a17: "출석 QR을" };
function scanOpen(ctx) { if (sndOn()) sfxUnlock();   /* v4.13 인식음은 누른 순간에 소리 길을 연다(소리 설정을 따른다) */
  SCQ.ctx = SCQ_TT[ctx] ? ctx : ""; SCQ.tab = "scan"; SCQ.err = ""; SCQ.paused = false; qrMineOff(); qrWakeOff(); if (App.current === "scan_q") App.render(); else App.go("scan_q"); }
/* v5.23 (사용자 261003) 가운데 QR 버튼 · 모든 「내 QR」 입구 = 같은 QR 화면의 [내 QR] 탭 · 카메라는 켜지 않는다 */
function qrOpen() {
  SCQ.ctx = ""; SCQ.tab = "mine"; SCQ.err = ""; SCQ.paused = false; QRM.msg = ""; qrCamStop();
  if (App.current === "scan_q") App.render(); else App.go("scan_q");
  qrWakeArm();   /* v5.25 누른 순간(사용자 동작) 화면 꺼짐 막기 */
}
function qrTab(t) {
  if (t !== "scan") t = "mine";
  if (t === SCQ.tab) return;
  if (t === "scan" && sndOn()) sfxUnlock();
  SCQ.tab = t; SCQ.ctx = ""; SCQ.err = ""; SCQ.paused = false; QRM.msg = "";
  qrCamStop(); qrMineOff(); qrWakeOff();
  App.render();
  if (t === "mine") qrWakeArm();   /* v5.25 내 QR 탭을 다시 누르면 다시 건다(5분 새로) */
}
function qrSegHtml() {
  if (SCQ.ctx) return "";
  return '<div class="axs-seg axs-qrseg" role="tablist" aria-label="QR">' +
    '<button type="button" role="tab" aria-selected="' + (SCQ.tab === "mine") + '" onclick="qrTab(\'mine\')">내 QR</button>' +
    '<button type="button" role="tab" aria-selected="' + (SCQ.tab === "scan") + '" onclick="qrTab(\'scan\')">QR 스캔</button></div>';
}
function qrScanOpen() { scanOpen(""); }
function scanQHtml() {
  if (SCQ.tab !== "scan") return '<div class="ax-stack axs-qrv">' + qrSegHtml() + '<section class="ax-card axs-qrcard">' + qrPanelHtml() + "</section></div>";
  var t = SCQ_TT[SCQ.ctx] || "QR을", can = qrScanSupported();
  var box = SCQ.paused
    ? '<div class="axs-cam axs-cam-off"><p class="ax-type-t5-strong">스캔을 멈췄어요</p><button type="button" class="ax-button ax-button-weak" onclick="scanOpen(SCQ.ctx)">다시 스캔</button></div>'
    : SCQ.err || !can
    ? '<div class="axs-cam axs-cam-off" role="alert"><p class="ax-type-t5-strong">카메라를 열 수 없어요</p>' +
      '<p class="ax-description">' + (can ? "브라우저 설정에서 카메라 권한을 허용해 주세요" : "이 브라우저는 카메라 스캔을 지원하지 않아요") + "</p>" +
      (can ? '<button type="button" class="ax-button ax-button-weak" onclick="scanOpen(SCQ.ctx)">다시 시도</button>' : "") + "</div>"
    : '<div class="axs-cam"><video id="qrVideo" playsinline muted></video><span class="axs-cam-fr" aria-hidden="true"></span></div>';
  return '<div class="ax-stack axs-scanwrap">' + qrSegHtml() +
    '<h1 class="ax-title">' + t + "<br>화면 안에 맞춰주세요</h1>" + box +
    '<p class="ax-description axs-inv">촬영 버튼 없이 자동으로 인식해요</p>' +
    '<p class="ax-meta axs-inv" id="qrHint" hidden>QR에서 20~30cm 떨어뜨리고, 화면 밝기를 올려 보세요</p></div>' +
    '<div class="axs-fix ax-sheet axs-scansheet"><button type="button" class="ax-button ax-button-weak" onclick="qrCamStop(); staffStampOpen()">담당자에게 적립 요청</button>' +
    '<p class="ax-meta">카메라 권한이 없으면 기본 카메라로 스캔할 수 있어요</p></div>';
}
function scanQStart() {
  if (App.current !== "scan_q" || SCQ.tab !== "scan" || SCQ.err || SCQ.paused || !qrScanSupported() || QRS.stream) return;
  qrCamStart();
}

/* ═══ 내 QR · 운영자가 찍는 쪽 · 화면을 열어 둔 동안 동기화 → 「확인됨」 ═══
 * v4.71 (260930 극한 부하 시험) 3초 → 6초(QRM_SYNC_MS) · 앞 요청이 아직이면 그 차례는 건너뛴다(한 번에 한 요청) · 화면이 가려진 동안은 보내지 않는다.
 *   3초일 때 앞 요청을 기다리지 않아 폰 한 대가 동시에 최대 5개를 보냈다 · 1,500명이 90초 열어 두면 오류 4.7%(6초 = 0) · 실시간 연결로 바꿀 때 이 상수 하나만 */
var QRM_SYNC_MS = 6000;
var QRM = { timer: null, until: 0, snap: null, msg: "", busy: false };
function qrMineSnap() {
  return { ck: JSON.stringify(S.get("checkin", {})), q: S.get("queue", {}), ru: !!S.get("roulette_used", false) };
}
function qrMineOn() {
  qrMineOff();
  QRM.snap = qrMineSnap(); QRM.msg = ""; QRM.until = Date.now() + 90000;
  QRM.timer = setInterval(qrMineTick, QRM_SYNC_MS);
}
function qrMineTick() {
  if (!el("qrPanel") || Date.now() > QRM.until) { qrMineOff(); return; }
  if (document.hidden || QRM.busy || !BE.on) return;   /* 가려진 동안 · 앞 요청이 아직이면 이번 차례는 건너뛴다(beCall 15초 제한 뒤에는 반드시 풀린다) */
  QRM.busy = true;
  beSync(function () { QRM.busy = false; });
}
function qrMineOff() { if (QRM.timer) { clearInterval(QRM.timer); QRM.timer = null; } }
/* v5.25 (사용자 261003) 내 QR 이 보이는 동안 화면이 어두워지거나 꺼지지 않게(Screen Wake Lock)
 * 처음 = QR 버튼을 누른 순간(qrOpen) · 내 QR 탭을 다시 누를 때(qrTab) · 그때부터 5분(QRWL_MAX_MS) 넘으면 풀고 다시 누를 때까지 걸지 않는다(배터리)
 * 풀기 = 스캔 탭 · 문맥 스캔 · 화면 떠남(App.go) · 5분 · 가려지면 브라우저가 스스로 푼다 → 다시 보이면 5분 안 · 내 QR 탭일 때만 다시 요청
 * 미지원(옛 iOS · 인앱 브라우저) · 거절 = 조용히 넘어간다(문구 없음) */
var QRWL_MAX_MS = 300000;
var QRWL = { lock: null, until: 0, t: null, req: false };
function qrWakeArm() { QRWL.until = Date.now() + QRWL_MAX_MS; qrWakeOn(); }
function qrWakeWant() { return App.current === "scan_q" && SCQ.tab === "mine" && !SCQ.ctx && !document.hidden && Date.now() < QRWL.until; }
function qrWakeOn() {
  if (!qrWakeWant()) return;
  if (QRWL.t) clearTimeout(QRWL.t);
  QRWL.t = setTimeout(function () { QRWL.t = null; qrWakeOff(); }, QRWL.until - Date.now());
  if (QRWL.lock || QRWL.req) return;
  try {
    if (!navigator.wakeLock || typeof navigator.wakeLock.request !== "function") return;
    QRWL.req = true;
    navigator.wakeLock.request("screen").then(function (l) {
      QRWL.req = false;
      if (!qrWakeWant()) { try { var p = l.release(); if (p && p.catch) p.catch(function () {}); } catch (e) {} return; }
      QRWL.lock = l;
      try { l.addEventListener("release", function () { if (QRWL.lock === l) QRWL.lock = null; }); } catch (e) {}
    }, function () { QRWL.req = false; });
  } catch (e) { QRWL.req = false; }
}
function qrWakeOff(leave) {
  if (QRWL.t) { clearTimeout(QRWL.t); QRWL.t = null; }
  if (leave) QRWL.until = 0;
  var l = QRWL.lock; QRWL.lock = null;
  if (l) { try { var p = l.release(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
}
document.addEventListener("visibilitychange", function () { if (!document.hidden) qrWakeOn(); });
/* sync 뒤 · 열려 있는 내 QR 과 비교해 방금 바뀐 것 한 줄 */
function qrMineCheck() {
  if (!QRM.timer || !QRM.snap || !el("qrPanel")) return;
  var a = QRM.snap, b = qrMineSnap(), msg = "";
  var ck0 = JSON.parse(a.ck || "{}"), ck1 = S.get("checkin", {}) || {}, k;
  for (k in ck1) if (ck1[k] !== ck0[k]) { var sp = scanSpot(k); msg = (ck1[k] === "done" ? "퇴장 확인 · " : "입장 확인 · ") + (sp ? sp.nm : k); }
  var q0 = a.q || {}, q1 = b.q || {};
  for (k in q1) {
    var s1 = q1[k] || {}, s0 = q0[k] || {}, sp2 = scanSpot(k), nm = sp2 ? sp2.nm : k;
    if (s1.status !== s0.status || s1.no !== s0.no) msg = s1.status === "call" ? "지금 입장하세요 · " + nm : s1.status === "done" ? "완료 · " + nm : nm + " · " + s1.no + "번" + (s1.ahead ? " · 앞 " + s1.ahead + "명" : "");
  }
  if (!a.ru && b.ru) msg = "룰렛 1회 사용 · 지금 돌리세요";
  if (!msg) return;
  QRM.snap = b; QRM.msg = msg; QRM.until = Date.now() + 90000;
  stampBuzz(25);
  var box = el("qrPanel"); if (box) box.innerHTML = qrPanelHtml(true);
}

/* ═══════════════ 양방향 QR (260830) ═══════════════
 * 지금까지 QR은 「읽는 쪽」만 있었다. 체크인·대기·쿠폰 수령은 참가자가 자기 QR을
 * 내밀고 운영자가 찍는 흐름이라, 「보여주는 쪽」이 없으면 성립하지 않는다.
 *   참가자 : FAB → [스캔하기 | 내 QR]
 *   운영자 : 관리자 › 현장 스캔 → 스팟 고르고 계속 찍기
 * 개인 QR 페이로드 = AXU:<사번>:<체크섬 2자리>. 이름은 넣지 않는다(운영자 화면의
 * 이름은 서버가 돌려준다). 체크섬은 보안이 아니라 오인식·장난 방지용이다. */
function qrSum(t) {
  var h = 0, i;
  for (i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 1296;
  return ("0" + h.toString(36)).toUpperCase().slice(-2);
}
function myQrText() {
  var u = S.get("user", {}) || {}, e = String(u.empId || "").trim();
  if (!e) return "";
  var base = "AXU:" + e + ":" + qrSum(e), m = /^([0-9a-z]{1,9})\.[0-9a-f]{32}$/.exec(String(u.ses || ""));
  if (!m || !/^\d{3,10}$/.test(e)) return base;   /* v4.67 토큰이 없으면(옛 서버 · 옛 로그인) 예전 QR */
  var qt = (Math.floor(sesNowSec() / QR_STEP) * QR_STEP).toString(36);
  return base + ":" + m[1] + ":" + qt + ":" + sha256hex("AXQ|" + u.ses + "|" + e + "|" + qt).slice(0, 12);
}
/* 참가자 QR이면 사번을, 아니면 null · v4.67 서명 붙은 QR(뒤 세 칸)도 · 서명 확인은 서버(qr 로 보낸다) */
function qrParseUser(raw) {
  var m = /^AXU:(\d{3,10}):([0-9A-Z]{2})(?::[0-9a-z]{1,9}:[0-9a-z]{1,9}:[0-9a-f]{12})?$/.exec(String(raw || "").trim());
  return m && qrSum(m[1]) === m[2] ? m[1] : null;
}
/* v4.67 내 QR 그림 · 서명 QR 은 20초마다 글자가 바뀐다 · 열려 있는 동안 4초마다 보고 바뀌면 그 그림만 바꾼다 */
var QRLIVE = { t: null, txt: "" };
function myQrSvg(px) {
  var t = myQrText(); QRLIVE.txt = t;
  if (!QRLIVE.t) QRLIVE.t = setInterval(qrLiveTick, 4000);
  return myQrPaint(t, px);
}
/* v5.25 내 QR 한 그림 · 조용한 칸 4칸(SVG 안) · data-myqr = 다시 그릴 때 같은 크기 · 크기는 CSS(.axs-qrcard .myqr svg) */
function myQrPaint(t, px) { return qrTextSvg(t, px, 4).replace("<svg ", '<svg data-myqr="' + px + '" '); }
function qrLiveTick() {
  var n = document.querySelectorAll("svg[data-myqr]");
  if (!n.length) { clearInterval(QRLIVE.t); QRLIVE.t = null; return; }
  var t = myQrText();
  if (t === QRLIVE.txt) return;
  QRLIVE.txt = t;
  Array.prototype.forEach.call(n, function (sv) {
    var px = sv.getAttribute("data-myqr"), box = document.createElement("div");
    box.innerHTML = myQrPaint(t, Number(px));
    if (box.firstChild && sv.parentNode) sv.parentNode.replaceChild(box.firstChild, sv);
  });
}
/* 모듈 매트릭스 → 인쇄·화면 공용 SVG. 행 단위 런렝스로 묶어 도형 수를 줄인다 */
function qrPaint(isDark, n, px, qz) {
  var d = "", r, c, run; qz = qz || 2;   /* v5.25 qz = 조용한 칸(모듈 수) · 기본 2 · 내 QR 은 4(myQrPaint) */
  for (r = 0; r < n; r++) {
    c = 0;
    while (c < n) {
      if (isDark(r, c)) {
        run = 0;
        while (c + run < n && isDark(r, c + run)) run++;
        d += "M" + c + " " + r + "h" + run + "v1h-" + run + "z";
        c += run;
      } else c++;
    }
  }
  /* xmlns를 넣어야 이미지로 저장·인쇄했을 때도 열린다(인라인만 쓰면 없어도 그려지지만, QR은 캡처해 쓰는 일이 잦다) */
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-' + qz + " -" + qz + " " + (n + qz * 2) + " " + (n + qz * 2) + '" width="' + px + '" height="' + px +
    '" shape-rendering="crispEdges" style="display:block;background:#fff;border-radius:8px">' +
    '<path d="' + d + '" fill="#1E2124"/></svg>';
}
/* 런타임 인코딩 · 개인 QR은 사번마다 달라 미리 만들어 둘 수 없다 */
function qrTextSvg(text, px, qz, ecc) {   /* v5.61 ecc = 오류 정정(기본 M · 노트북 접속 QR = Q · 행사 QR 규칙 261001) */
  if (typeof qrcode !== "function" || !text) return "";
  var q = qrcode(0, ecc || "M");
  q.addData(text); q.make();
  var n = q.getModuleCount();
  return qrPaint(function (r, c) { return q.isDark(r, c); }, n, px, qz);
}

/* ── 참가자 패널 · 스캔과 내 QR을 한 자리에 (QR을 주고받는 순간은 하나다) ── */
function qrPanelOpen(tab) {
  /* v5.23 (사용자 261003) 모달을 걷고 QR 화면 하나로 · 「내 QR 보여주기」 입구(스탬프 AX PLAY 줄 · 체험 안내 · 부스 · 룰렛 1회권 · 일정 「지금」 줄)는 모두 [내 QR] 탭 */
  if (tab === "scan") { scanOpen(""); return; }
  QRS.tab = "mine";
  qrOpen();
}
var OK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function qrPanelHtml(inner) {
  var u = S.get("user", {}) || {}, txt = myQrText();
  var body = !txt ?
    '<p class="muted" style="margin-top:12px;font-size:calc(14.5px * var(--fs))">사번으로 입장하면 내 QR이 발급됩니다.</p>' :
    '<div class="myqr' + (QRM.msg ? " axs-qrok" : "") + '">' + myQrSvg(216) + (QRM.msg ? '<span class="axs-okbadge">' + OK_SVG + "</span>" : "") + "</div>" +
    '<p class="myqr-nm">' + esc(u.name || "") + "<span>" + esc(u.empId || "") + "</span></p>" +
    (QRM.msg ? '<p class="axs-okline" role="status"><b>확인됨</b> · ' + esc(QRM.msg) + "</p>" : "") +
    '<p class="muted" style="margin-top:8px;text-align:center;font-size:calc(13.5px * var(--fs));line-height:1.65">' +
    '이 QR을 <b style="color:var(--hi)">스태프</b>에게 보여 주세요<br>화면 밝기를 올리면 더 빨리 읽혀요</p>' + qrMineStateHtml();   /* 261005 최종 QA · 「운영 데스크 스캐너」 → 「스태프」(AX PLAY · 스탬프 탭 · 부스 안내가 모두 「스태프에게 내 QR」이다 · 내 QR 을 찍는 곳은 데스크만이 아니다) */
  var h = body;   /* v5.23 화면 안 카드 · 닫기는 헤더 뒤로 */
  return inner ? h : '<div id="qrPanel">' + h + "</div>";
}
/* 내 QR 아래에 지금 걸려 있는 대기·체크인을 같이 보여준다(QR을 꺼낸 이유가 대개 이것이다) */
function qrMineStateHtml() {
  var q = S.get("queue", {}), ck = S.get("checkin", {}), out = [];
  Object.keys(q).forEach(function (k) {
    var sp = scanSpot(k), r = q[k];
    if (!sp || !r || r.status === "done") return;
    out.push('<div class="qst"><span class="l">' + esc(sp.nm) + '</span><b>' +
      (r.status === "call" ? "지금 입장하세요" : r.no + "번 · 대기 중") + "</b></div>");
  });
  Object.keys(ck).forEach(function (k) {
    var sp = scanSpot(k);
    if (sp) out.push('<div class="qst"><span class="l">' + esc(sp.nm) + '</span><b>' +
      (ck[k] === "done" ? "참여 완료" : "입장 확인") + "</b></div>");
  });
  /* 룰렛 1회권 · QR을 내미는 가장 흔한 순간이라 여기서도 상태를 같이 보여준다 (260909) */
  if (stampCount() >= 3) out.push('<div class="qst"><span class="l">1F 룰렛 1회권</span><b>' +
    (S.get("roulette_used", false) ? "사용 완료" : "스캔하면 차감") + "</b></div>");
  return out.length ? '<div class="qstate">' + out.join("") + "</div>" : "";
}

/* ── 카메라 (참가자 모달 · 운영자 화면 공용) ── */
function qrCamStart() {
  try { QRS.det = "BarcodeDetector" in window ? new BarcodeDetector({ formats: ["qr_code"] }) : null; } catch (e) { QRS.det = null; }
  QRS.busy = false; QRS.next = 0; QRS.hold = false; QRS.gate = 0; QRS.gateQ = [];
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
    QRS.stream = stream;
    var v = el("qrVideo");
    if (!v) { qrCamStop(); return; }
    v.srcObject = stream;
    var pp = v.play(); if (pp && pp.catch) pp.catch(function () {});
    /* 촬영 버튼 없이 프레임을 계속 훑는다. 300ms(초당 3회)는 대보다가 놓치는 구간이 생겨 120ms로 (260830 실측 검증) */
    QRS.timer = setInterval(qrScanTick, 120);
    QRS.hint = setTimeout(function () { var h = el("qrHint"); if (h) { h.hidden = false; h.style.display = "block"; } }, 8000);
  }).catch(function () {
    qrCamStop();
    if (App.current === "scan_q" && !SCAN.on) { SCQ.err = "deny"; App.render(); return; }   /* v4.06 Q02 · 화면 안에서 거부 상태 */
    if (el("qrVideo")) modalClose();
    notice({ key: "cam", title: "카메라를 열 수 없어요", body: "브라우저 설정에서 카메라 권한 허용" });
  });
}
function qrCamStop() {
  if (QRS.timer) { clearInterval(QRS.timer); QRS.timer = null; }
  if (QRS.hint) { clearTimeout(QRS.hint); QRS.hint = null; }
  QRS.busy = false;
  if (QRS.stream) { try { QRS.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} QRS.stream = null; }
}



/* ═══ 운영자 · 현장 스캔 ═══
 * v4.15 (사용자 확정 260922) 스탬프 · 입장 · 포토부스 체크를 한 화면에서 · 담당 위치를 고르면 찍는 순간 그 위치의 처리를 한다(동작 고르기 폐지).
 *   sess     = 10F 세션 입장(sess_in) · 세션 id 는 백엔드 SESS_META 와 같아야 한다(창 검증이 그 표를 본다 · 검사 17절)
 *              v4.26 17F 는 운영자 입장 스캔에서 뺐다 · 참가자가 대강당 입구 QR 로 출석한다(ATT_17F · att_claim)
 *   roster   = DAP 과제상담 · AX 커피챗 신청 명단에서 입장 처리(staff_mark in)
 *   photo    = 포토부스 입장 + 다음 대기 번호 호출(photo_enter) · 건너뛰기(노쇼)는 콘솔
 *   stamp    = 현장 스탬프 적립(stamp_grant · 부스 QR 이 안 될 때)
 *   roulette = 1F 이벤트존 룰렛 차감(roulette_redeem · 스탬프 3개 · 1인 1회)
 * 옛 퇴장 체크아웃(쿠폰 폐기) · 상담 · 커피챗 현장 대기열(q_take · q_call · q_done)은 폰에서 뺐다. 서버 액션은 그대로 둔다. */
/* v4.71 lb = 타일 이름 · tsub = 타일 아래 한 줄 · will = 「지금 찍으면」 뒤 결과 · cond = 조건 한 줄 · 드롭다운 묶음(입장 · 포토부스 · 스탬프)은 타일(SCAN_TILES)로 바뀌었다 */
var SCAN_SPOTS = [
  { id: "fld", nm: "10F 세션 A", kind: "sess", lb: "세션 A", will: "10F 세션 A 입장 처리" },
  { id: "ta", nm: "10F 세션 B", kind: "sess", lb: "세션 B", will: "10F 세션 B 입장 처리" },
  { id: "tb", nm: "10F 세션 C", kind: "sess", lb: "세션 C", will: "10F 세션 C 입장 처리" },
  { id: "aws", nm: "10F 세션 D", kind: "sess", lb: "세션 D", will: "10F 세션 D 입장 처리" },
  { id: "ms1", nm: "10F 세션 E 1회차", kind: "sess", lb: "세션 E 1회차", will: "10F 세션 E 1회차 입장 처리" },
  { id: "ms2", nm: "10F 세션 E 2회차", kind: "sess", lb: "세션 E 2회차", will: "10F 세션 E 2회차 입장 처리" },
  { id: "dap", nm: "1F AX LOUNGE 상담", kind: "roster", lb: "AX LOUNGE 상담 입장", tsub: "신청 명단", will: "AX LOUNGE 상담 입장 처리", cond: "신청 명단에 있는 사람만" },
  { id: "cchat", nm: "18F AX 커피챗", kind: "roster", lb: "커피챗 입장", tsub: "신청 명단", will: "커피챗 입장 처리", cond: "신청 명단에 있는 사람만" },
  { id: "q_photo", nm: "1F AI 포토부스", kind: "photo", lb: "포토부스 입장", tsub: "다음 번호 호출", will: "포토부스 입장 · 다음 번호 호출", cond: "앱에서 받은 대기 번호" },   /* 번호는 참가자가 앱에서 받는다 · 찍으면 입장 + 다음 호출 */
  /* v4.83 (261001) 1F 전시(p1) 스탬프 폐지 · AX PLAY(p2) = 체험 뒤 스태프가 참가자 내 QR 을 찍어 적립(스탬프 4) */
  { id: "p2", nm: "AX PLAY", kind: "stamp", lb: "AX PLAY 스탬프", tsub: "체험 확인 · 적립", will: "AX PLAY 스탬프 적립", cond: "HiDI-Q 또는 Hi-Helper 체험을 마친 사람" },
  { id: "roulette", nm: "1F EVENT 룰렛", kind: "roulette", lb: "룰렛 체크인", tsub: "1회 사용", will: "룰렛 1회 사용", cond: "스탬프 3개 이상 · 1인 1회" },   /* 260909 · 스탬프 3개=1회, 판정은 서버 */
  /* v5.34 (설계안 §10 결정 2) 사옥 밖 체크인 존(몽골텐트) · 찍으면 체크인 + 키트 지급 기록(inv_kit) · 10F 입장(sess_in)과 따로 */
  { id: "kit", nm: "체크인 존 · 키트", kind: "kit", lb: "체크인 존 · 키트", tsub: "체크인 + 지급", will: "체크인 + 키트 지급", cond: "사전 신청 명단이면 바로 지급" }
];
var SCAN_TILES = ["roulette", "kit", "p2", "dap", "cchat", "sess"];   /* 자주 쓰는 룰렛 · 포토 · 스탬프(AX PLAY)가 위 · 10F 세션은 한 타일에서 A~E · v4.83 1F 전시 타일 삭제 */
function scanSpot(id) { return SCAN_SPOTS.filter(function (s) { return s.id === id; })[0] || null; }
var SCAN = { spot: S.get("scan_spot", "") !== "q_photo" ? S.get("scan_spot", "") : "", log: [], last: "", lastT: 0, on: false, pick: false, sub: "", res: null };

function scanPick(id) { scanStop(); SCAN.spot = scanSpot(id) ? id : ""; SCAN.last = ""; S.set("scan_spot", SCAN.spot); App.render(); }   /* v4.65 위치를 바꾸면 3초 중복 가드도 푼다(같은 사람을 다른 위치에서 곧바로) */
function scanStart() {
  if (!SCAN.spot) { toast("찍을 목적을 먼저 골라 주세요"); return; }
  if (!qrScanSupported()) { toast("이 기기에서는 카메라를 열 수 없어요"); return; }
  SCAN.on = true; App.render();
  if (sndOn()) sfxUnlock();
  setTimeout(qrCamStart, 40);
}
function scanStop() { SCAN.on = false; qrCamStop(); }
/* 연속 스캔이라 같은 QR이 몇 프레임 연속으로 잡힌다. 3초 안의 같은 코드는 무시한다 */
function scanHit(raw) {
  var emp = qrParseUser(raw);
  if (raw === SCAN.last && Date.now() - SCAN.lastT < 3000) return;   /* v4.65 참가자 QR 이 아닌 것도 3초에 한 번 · 전에는 카메라가 보는 동안 0.12초마다 한 줄씩 기록을 밀어냈다 */
  SCAN.last = raw; SCAN.lastT = Date.now();
  if (!emp) { scanLog("", "참가자 QR이 아니에요", false); scanShow("bad", "", "참가자 QR이 아니에요", "참가자 앱의 내 QR을 찍어 주세요"); return; }
  var sp = scanSpot(SCAN.spot);
  if (!sp) return;
  if (!BE.on) { scanLog(emp, "서버 미연결 · 기록되지 않음", false); scanShow("bad", emp, "기록되지 않았어요", "서버에 연결되지 않았어요"); return; }
  if (sp.kind === "roulette" && S.get("roulette_out", false)) { scanLog(emp, "룰렛 소진 · 차감하지 않았어요", false); scanShow("bad", emp, "룰렛 소진", "차감하지 않았어요"); beSync(); return; }   /* v4.65 옛 서버는 소진이어도 차감한다 · 운영자가 방금 풀었을 수 있으니 곧바로 한 번 새로 받는다(다음 스캔부터 반영) */
  var params = admA({ emp: emp, qr: String(raw).trim() });   /* v4.67 찍은 글자 그대로 · 서버가 서명 · 시간을 본다(콘솔 · 담당자 적립은 qr 없음) */
  if (sp.kind === "sess") { params.action = "sess_in"; params.sess = sp.id; }
  else if (sp.kind === "roster") { params.action = "staff_mark"; params.prog = sp.id; params.mark = "in"; }
  else if (sp.kind === "photo") params.action = "photo_enter";
  else if (sp.kind === "stamp") { params.action = "stamp_grant"; params.id = sp.id; }
  else if (sp.kind === "kit") params.action = "inv_kit";   /* v5.34 */
  else params.action = "roulette_redeem";
  scanLog(emp, "처리 중", null);
  scanShow("wait", emp, "확인하는 중", sp.will || sp.nm);
  beCall(params, function (res) { scanDone(emp, sp, res); },
    function () { scanLog(emp, "서버 응답 없음 · 다시 찍어 주세요", false, true); scanShow("bad", emp, "서버 응답 없음", "다시 찍어 주세요"); SCAN.last = ""; });
}
function scanDone(emp, sp, res) {
  if (!res || !res.ok) {
    var why = res && res.reason;
    /* 시트 잠금 충돌은 실패가 아니라 「지금 붐빔」이다(실측). 담당자가 다시 찍으면 되므로 「처리 실패」로 말하지 않는다 */
    var err = res && res.err ? String(res.err) : "";
    if (/잠금|Lock|timeout|시간초과/i.test(err)) {
      scanLog(emp, "서버가 잠시 붐벼요 · 다시 찍어 주세요", null, true);
      scanShow("wait", emp, "서버가 잠시 붐벼요", "다시 찍어 주세요");
      SCAN.last = "";                       /* 같은 QR을 곧바로 다시 찍을 수 있게 중복 가드 해제 */
      return;
    }
    if (why === "auth") { var lm = admLostMsg(); scanLog(emp, lm + " · 다시 입력해 주세요", false, true); scanShow("bad", emp, lm, "다시 입력해 주세요"); admAuthLost(); return; }   /* v4.65 */
    var nm = res && res.name && (sp.kind !== "stamp" || /^qr/.test(why || "")) ? res.name + " · " : "";   /* stamp_grant 의 name 은 스탬프 이름 · QR 거절의 name 은 참가자 이름 */
    var msg = why === "locked" ? admLockedMsg(res) :
      why === "qrexp" ? "지난 QR이에요 · 참가자 폰에서 내 QR을 다시 열어 주세요" :   /* v4.67 캡처 · 시계가 크게 틀린 폰 */
      why === "qr" ? "확인할 수 없는 QR이에요 · 참가자 폰에서 내 QR을 다시 열어 주세요" :
      why === "qrold" ? "옛 QR이에요 · 참가자 앱을 새로 고친 뒤 다시 찍어 주세요" :
      why === "out" ? "룰렛 소진 · 차감하지 않았어요" :
      why === "window" ? "지금은 입장 시간이 아니에요 (" + (res.open || "") + ")" :
      why === "notfound" ? (sp.kind === "photo" ? "대기 번호가 없어요 · 앱에서 번호 받기 안내" : "신청 명단에 없어요") :
        why === "skipped" ? res.no + "번은 건너뛴 번호예요 · 새 번호 받기 안내" :
          why === "already" ? res.no + "번은 이미 입장 처리됐어요" :
            why === "need" ? "스탬프 3개 미만 · 차감 불가 (현재 " + (res.n || 0) + "개)" :
              why === "used" ? "이미 룰렛을 돌린 참가자예요" :
                why === "spare0" ? "여유 키트 없음 · 룰렛 굿즈로 대체" :
                /unknown action/i.test(err) ? "서버 갱신 전 · 기록되지 않음" :
                why === "auth" ? "관리코드가 맞지 않아요 · 관리자 모드를 다시 열어 주세요" :
                  "처리하지 못했어요" + (why || err ? " (" + (why || err.slice(0, 40)) + ")" : "");
    scanLog(emp, nm + msg, false, true);
    var big = scanBig(why, sp, res, err);
    scanShow(big[0], nm ? nm.slice(0, -3) : emp, big[1], big[2]);
    return;
  }
  if (sp.kind === "kit") { kitDone(emp, res); return; }   /* v5.34 */
  var ok = sp.kind === "sess" || sp.kind === "roster" ? (res.dup ? "이미 입장 처리됨" : "입장 확인") :
    sp.kind === "photo" ? res.no + "번 입장" + (res.early ? "(순서보다 먼저)" : "") + " · " + (res.next ? res.next.no + "번 호출" : "대기 번호 없음") :
      sp.kind === "stamp" ? (res.dup ? "이미 받은 스탬프" : "스탬프 적립 · " + sp.nm) :
        "룰렛 1회 차감 · 바로 돌리세요 (스탬프 " + (res.n || "") + "개)";
  var who = sp.kind === "stamp" ? res.who || "" : res.name || "";   /* v4.65 stamp_grant name = 스탬프 이름 · 참가자 이름은 who(새 서버) */
  scanLog(emp, (who ? who + " · " : "") + ok, true, true);
  var dup = !!res.dup;
  scanShow(dup ? "dup" : "ok", who || emp,
    sp.kind === "sess" || sp.kind === "roster" ? (dup ? "이미 입장 처리됨" : "입장 완료") :
      sp.kind === "photo" ? res.no + "번 입장 완료" :
        sp.kind === "stamp" ? (dup ? "이미 받은 스탬프" : "스탬프 적립 완료") : "룰렛 체크인 완료",
    sp.kind === "photo" ? (res.next ? "다음 " + res.next.no + "번 호출" : "대기 번호 없음") + (res.early ? " · 순서보다 먼저" : "") :
      sp.kind === "roulette" ? "스탬프 " + (res.n || "") + "개 · 바로 돌리세요" : sp.nm);
  if (sp.kind === "roulette" && !dup) invRoulStart(emp);   /* v5.34 결과 화면에 5등급 버튼 */
}
/* ═══ v5.34 경품 · 재고 · 스태프 폰 (설계 「디자인 시안/경품 재고/앱_명세.md」 · 설계안 §10 · 사용자 261003) ═══
 * 새 탭 · 새 메뉴 없음(260930 「스캔 · 혼잡 제보만 크게」) · 참가자 화면에는 아무것도 없다 · 품목은 「키트」로만 · 가격 없음.
 * ① 룰렛 결과 화면 5등급 버튼(inv_roulette · qr 없이) · 안 눌러도 다음 스캔으로 넘어간다(콘솔 「등급 미입력」) · 누르면 5초 「취소」(undo=1 · 서버 2분)
 * ② 체크인 존 · 키트 타일(inv_kit) · 명단 = 지급 · 이미 = 시각 · 명단 밖 = 「키트 지급」 · 「지급 안 함」 · 여유 0 = spare0
 * ③ 「재고 · 박스 열기」 작은 링크 → 시트(inv_left box · inv_box · inv_undo) · 박스당 수량이 없으면 흐리게
 * 옛 서버(unknown action)면 버튼을 숨기고 한 줄 · 실패해도 룰렛 차감 · 체크인은 이미 끝난 일이다 */
var INV_RG_LB = ["1등 텀블러", "2등 커피 + 키링", "3등 컵받침", "4등 판스티커", "5등 볼펜"];
var INVS = { id: 0, emp: "", left: null, g: "", gt: 0, busy: false, off: false, msg: "", rid: "", rt: 0, box: null, bmsg: "", blast: null, bbusy: false };
function invOld(r) { return !!(r && !r.ok && /unknown action/i.test(String(r.err || ""))); }
function invPaint() { var b = el("scanRes"); if (b) b.innerHTML = scanBigHtml(); }
function invMine() { return SCAN.res && SCAN.res.inv && SCAN.res.t === INVS.id; }
function invAuth(r) { if (r && r.reason === "auth") { admAuthLost(); return true; } return false; }
function invRoulStart(emp) {
  if (!SCAN.res) return;
  SCAN.res.inv = "roul";
  INVS.id = SCAN.res.t; INVS.emp = emp; INVS.left = null; INVS.g = ""; INVS.gt = 0; INVS.busy = false; INVS.off = false; INVS.msg = "";
  invPaint();
  var id = INVS.id;
  beCall(admA({ action: "inv_left" }), function (r) {
    if (INVS.id !== id) return;
    if (invOld(r)) INVS.off = true; else if (r && r.ok && r.r) INVS.left = r.r;
    if (invMine()) invPaint();
  }, function () {});
}
function invRoulPick(g) {
  if (INVS.busy || !INVS.emp || !invMine()) return;
  INVS.busy = true; INVS.msg = ""; invPaint();
  var id = INVS.id;
  beCall(admA({ action: "inv_roulette", emp: INVS.emp, g: String(g) }), function (r) {
    if (INVS.id !== id) return;
    INVS.busy = false;
    if (invAuth(r)) return;
    if (r && r.left) INVS.left = r.left;
    if (invOld(r)) INVS.off = true;
    else if (r && r.ok) { INVS.g = String(r.g || "r" + g).replace(/^r/, ""); INVS.gt = Date.now(); stampBuzz(40); setTimeout(function () { if (INVS.id === id && invMine()) invPaint(); }, 5100); }
    else INVS.msg = r && r.reason === "dup" ? "이미 " + String(r.g || "").replace(/^r/, "") + "등으로 기록됨" :
      r && r.reason === "noroul" ? "룰렛을 쓰지 않은 사번이에요" : r && r.reason === "locked" ? admLockedMsg(r) : "기록하지 못했어요 · 다시 눌러 주세요";
    if (invMine()) invPaint();
  }, function () { if (INVS.id !== id) return; INVS.busy = false; INVS.msg = "서버 응답 없음 · 다시 눌러 주세요"; if (invMine()) invPaint(); });
}
function invRoulUndo() {
  if (INVS.busy || !INVS.g || !invMine()) return;
  INVS.busy = true; invPaint();
  var id = INVS.id;
  beCall(admA({ action: "inv_roulette", emp: INVS.emp, undo: "1" }), function (r) {
    if (INVS.id !== id) return;
    INVS.busy = false;
    if (invAuth(r)) return;
    if (r && r.left) INVS.left = r.left;
    if (r && (r.ok || r.reason === "none")) { INVS.g = ""; INVS.msg = "취소했어요 · 다시 고르세요"; }
    else INVS.msg = r && r.reason === "late" ? "콘솔에서 되돌려 주세요" : "취소하지 못했어요 · 콘솔에서 되돌려 주세요";
    if (invMine()) invPaint();
  }, function () { if (INVS.id !== id) return; INVS.busy = false; INVS.msg = "서버 응답 없음 · 콘솔에서 확인해 주세요"; if (invMine()) invPaint(); });
}
function invLeftHtml(x) {
  if (!x || x.left == null) return "";
  var low = x.q ? x.left <= x.q * 0.1 : x.left <= 0;
  return '<small' + (low ? ' class="low"' : "") + ">남은 " + Number(x.left) + "</small>";
}
function invKitGive() {
  if (INVS.busy || !invMine()) return;
  INVS.busy = true; INVS.msg = ""; invPaint();
  var id = INVS.id, emp = INVS.emp;
  beCall(admA({ action: "inv_kit", emp: emp, give: "1" }), function (r) {
    if (INVS.id !== id) return;
    INVS.busy = false;
    if (invAuth(r)) return;
    var R = SCAN.res;
    if (r && r.ok && r.kit === "give") {
      R.tone = "ok"; R.head = "키트 지급"; R.sub = "여유 키트에서" + (r.spare != null ? " · 남은 " + r.spare : ""); R.inv = "kitdone";
      INVS.rid = String(r.rid || ""); INVS.rt = Date.now(); stampBuzz(60);
      scanLog(emp, (r.name ? r.name + " · " : "") + "키트 지급(명단 밖)", true);
      setTimeout(function () { if (INVS.id === id && invMine()) invPaint(); }, 5100);
    } else if (r && r.reason === "spare0") { R.tone = "bad"; R.head = "여유 키트 없음"; R.sub = "룰렛 굿즈로 대체해 주세요"; R.inv = ""; stampBuzz([120, 80, 120]); }
    else if (r && r.ok && r.kit === "dup") { R.tone = "dup"; R.head = "이미 지급됨"; R.sub = (r.at || "") + "에 받았어요"; R.inv = ""; }
    else INVS.msg = r && r.reason === "locked" ? admLockedMsg(r) : "기록하지 못했어요 · 다시 눌러 주세요";
    if (invMine() || SCAN.res === R) invPaint();
  }, function () { if (INVS.id !== id) return; INVS.busy = false; INVS.msg = "서버 응답 없음 · 다시 눌러 주세요"; if (invMine()) invPaint(); });
}
function invKitSkip() { if (!invMine()) return; SCAN.res.inv = ""; SCAN.res.sub = "체크인만 기록했어요"; invPaint(); }
function invKitUndo() {
  if (INVS.busy || !INVS.rid || !invMine()) return;
  INVS.busy = true; invPaint();
  var id = INVS.id;
  beCall(admA({ action: "inv_undo", rid: INVS.rid }), function (r) {
    if (INVS.id !== id) return;
    INVS.busy = false;
    if (invAuth(r)) return;
    var R = SCAN.res;
    if (r && r.ok) { INVS.rid = ""; R.tone = "dup"; R.head = "지급 취소"; R.sub = "체크인만 남았어요"; R.inv = ""; scanLog(INVS.emp, "키트 지급 취소", null); }
    else INVS.msg = "취소하지 못했어요 · 콘솔에서 되돌려 주세요";
    invPaint();
  }, function () { if (INVS.id !== id) return; INVS.busy = false; INVS.msg = "서버 응답 없음 · 콘솔에서 확인해 주세요"; if (invMine()) invPaint(); });
}
/* 체크인 존 스캔 결과 */
function kitDone(emp, res) {
  var who = res.name || emp, sp = res.spare == null ? "수량 미정" : String(res.spare);
  if (res.kit === "give") { scanLog(emp, (res.name ? res.name + " · " : "") + "키트 지급", true, true); scanShow("ok", who, "키트 지급", res.pre ? "세션 " + res.pre + " · 사전 신청자" : "체크인 + 지급"); return; }
  if (res.kit === "dup") { scanLog(emp, (res.name ? res.name + " · " : "") + "이미 지급됨", true, true); scanShow("dup", who, "이미 지급됨", (res.at || "") + "에 받았어요"); return; }
  scanLog(emp, (res.name ? res.name + " · " : "") + "체크인 · 명단 밖", null, true);
  scanShow("dup", who, "사전 신청 명단에 없어요", "여유 키트 " + sp + (res.list ? "" : " · 명단 대기 중"));
  SCAN.res.inv = "kit";
  INVS.id = SCAN.res.t; INVS.emp = emp; INVS.busy = false; INVS.msg = ""; INVS.rid = ""; INVS.rt = 0;
  invPaint();
}
function invResHtml(r) {
  if (r.t !== INVS.id) return "";
  var msg = INVS.msg ? '<p class="axs-inv-m">' + esc(INVS.msg) + "</p>" : "", dis = INVS.busy ? " disabled" : "";
  if (r.inv === "kit") return '<div class="axs-inv">' + msg + '<div class="axs-crbtn"><button type="button" class="ax-button" onclick="invKitGive()"' + dis + ">키트 지급</button>" +
    '<button type="button" class="ax-button ax-button-weak" onclick="invKitSkip()"' + dis + ">지급 안 함</button></div></div>";
  if (r.inv === "kitdone") return INVS.rid && Date.now() - INVS.rt < 5000 ? '<div class="axs-inv">' + msg + '<p class="axs-inv-q">5초 안에 취소할 수 있어요</p><button type="button" class="ax-button ax-button-weak" onclick="invKitUndo()"' + dis + ">취소</button></div>" : msg;
  if (r.inv !== "roul") return "";
  if (INVS.off) return '<p class="axs-inv-m">등급 기록은 서버 갱신 뒤</p>';
  if (INVS.g) {
    var can = Date.now() - INVS.gt < 5000;
    return '<div class="axs-inv"><p class="axs-inv-d">기록했어요 · ' + esc(INVS.g) + "등</p>" + msg +
      (can ? '<p class="axs-inv-q">5초 안에 취소할 수 있어요</p><button type="button" class="ax-button ax-button-weak" onclick="invRoulUndo()"' + dis + ">취소</button>" : "") + "</div>";
  }
  var L = INVS.left || {};
  return '<div class="axs-inv"><p class="axs-inv-q">돌린 뒤 나온 등급을 눌러 주세요</p>' + msg + '<div class="axs-inv-g">' +
    INV_RG_LB.map(function (lb, i) {
      var x = L["r" + (i + 1)], zero = x && x.left != null && x.left <= 0;
      return '<button type="button" class="axs-inv-b" onclick="invRoulPick(' + (i + 1) + ')"' + dis + "><b>" + esc(lb) + "</b>" + (zero ? '<small class="low">재고 없음 · 그래도 눌러 기록</small>' : invLeftHtml(x)) + "</button>";
    }).join("") + "</div></div>";
}
/* ③ 재고 · 박스 열기 시트 */
function invBoxBody() {
  if (INVS.box === "old") return '<p class="axs-pnote">서버 갱신 뒤 쓸 수 있어요</p>';
  if (!INVS.box) return '<p class="axs-pnote">불러오는 중</p>';
  var dis = INVS.bbusy ? " disabled" : "";
  var top = INVS.blast ? '<div class="axs-ibx-last"><b>기록했어요 · ' + esc(INVS.blast.n) + " " + INVS.blast.q + "개</b>" +
    '<button type="button" class="ax-button ax-button-weak" onclick="invBoxUndo()"' + dis + ">방금 것 취소</button></div>" : "";
  return top + (INVS.bmsg ? '<p class="axs-inv-m">' + esc(INVS.bmsg) + "</p>" : "") + '<div class="axs-ibx">' + INVS.box.map(function (b) {
    var left = b.left == null ? "" : "남은 " + b.left;
    if (!b.box) return '<div class="axs-ibx-r off"><div><b>' + esc(b.n) + "</b><span>박스당 수량 미정 · 콘솔에서 정함</span></div></div>";
    return '<div class="axs-ibx-r"><div><b>' + esc(b.n) + "</b><span>" + esc(left + (left ? " · " : "") + "박스당 " + b.box) + '</span></div><button type="button" class="ax-button" onclick="invBoxGo(\'' + esc(b.id) + '\')"' + dis + ">박스 1개 열었음</button></div>";
  }).join("") + "</div>";
}
function invBoxPaint() { if (SHEET.id === "invbox" && el("axsSheet")) { SHEET.spec.body = invBoxBody(); sheetPaint(); } }
function invBoxOpen() {
  INVS.box = null; INVS.bmsg = ""; INVS.blast = null; INVS.bbusy = false;
  sheetOpen({ id: "invbox", title: "재고 · 박스 열기", lead: "박스를 열 때마다 눌러 주세요", body: invBoxBody(), go: "sheetClose()", goLbl: "닫기" });
  if (!BE.on) { INVS.box = []; INVS.bmsg = "서버에 연결되지 않았어요"; invBoxPaint(); return; }
  beCall(admA({ action: "inv_left" }), function (r) {
    if (invAuth(r)) { sheetClose(true); return; }
    INVS.box = invOld(r) ? "old" : r && r.ok && r.box ? r.box : [];
    if (r && !r.ok && !invOld(r)) INVS.bmsg = "불러오지 못했어요 · 닫고 다시 열어 주세요";
    invBoxPaint();
  }, function () { INVS.box = []; INVS.bmsg = "서버 응답 없음 · 닫고 다시 열어 주세요"; invBoxPaint(); });
}
function invBoxGo(id) {
  if (INVS.bbusy) return;
  INVS.bbusy = true; INVS.bmsg = ""; invBoxPaint();
  beCall(admA({ action: "inv_box", id: id }), function (r) {
    INVS.bbusy = false;
    if (invAuth(r)) { sheetClose(true); return; }
    if (r && r.ok) {
      INVS.blast = { rid: String(r.rid || ""), n: r.n || id, q: r.q };
      (INVS.box || []).forEach(function (b) { if (b.id === id && r.left != null) b.left = r.left; });
    } else INVS.bmsg = r && r.reason === "nobox" ? "박스당 수량 미정 · 콘솔에서 정함" : r && r.reason === "locked" ? admLockedMsg(r) : "기록하지 못했어요 · 다시 눌러 주세요";
    invBoxPaint();
  }, function () { INVS.bbusy = false; INVS.bmsg = "서버 응답 없음 · 다시 눌러 주세요"; invBoxPaint(); });
}
function invBoxUndo() {
  if (INVS.bbusy || !INVS.blast) return;
  INVS.bbusy = true; invBoxPaint();
  var last = INVS.blast;
  beCall(admA({ action: "inv_undo", rid: last.rid }), function (r) {
    INVS.bbusy = false;
    if (invAuth(r)) { sheetClose(true); return; }
    if (r && r.ok) { INVS.blast = null; INVS.bmsg = "취소했어요"; (INVS.box || []).forEach(function (b) { if (b.id === r.id && r.left != null) b.left = r.left; }); }
    else INVS.bmsg = "취소하지 못했어요 · 콘솔에서 되돌려 주세요";
    invBoxPaint();
  }, function () { INVS.bbusy = false; INVS.bmsg = "서버 응답 없음 · 콘솔에서 확인해 주세요"; invBoxPaint(); });
}
/* v4.71 실패 결과 크게 · [색, 제목, 한 줄] · dup = 이미 처리된 것(참가자에게 문제없음) */
function scanBig(why, sp, res, err) {
  var q = "참가자 폰에서 내 QR을 다시 열어 주세요";
  return why === "qrexp" ? ["bad", "지난 QR", q] : why === "qr" ? ["bad", "확인할 수 없는 QR", q] :
    why === "qrold" ? ["bad", "옛 QR", "참가자 앱을 새로 고친 뒤 다시 찍어 주세요"] :
    why === "out" ? ["bad", "룰렛 소진", "차감하지 않았어요"] :
    why === "need" ? ["bad", "스탬프 3개 미만", "현재 " + (res.n || 0) + "개 · 차감하지 않았어요"] :
    why === "used" ? ["bad", "이미 사용함", "룰렛을 이미 돌린 참가자예요"] :
    why === "spare0" ? ["bad", "여유 키트 없음", "룰렛 굿즈로 대체해 주세요"] :
    /unknown action/i.test(String(err || "")) ? ["bad", "아직 쓸 수 없어요", "서버 갱신 뒤 다시 찍어 주세요"] :
    why === "window" ? ["bad", "입장 시간이 아니에요", res.open || ""] :
    why === "notfound" ? (sp.kind === "photo" ? ["bad", "대기 번호 없음", "앱에서 번호 받기 안내"] : ["bad", "신청 명단에 없음", sp.nm]) :
    why === "skipped" ? ["bad", res.no + "번 건너뛴 번호", "새 번호 받기 안내"] :
    why === "already" ? ["dup", res.no + "번 이미 입장", ""] :
    why === "locked" ? ["bad", "관리 연결이 잠겼어요", admLockedMsg(res)] :
    ["bad", "처리하지 못했어요", why || String(err || "").slice(0, 40)];
}
function scanLog(emp, msg, ok, redraw) {
  var i = emp ? SCAN.log.findIndex(function (r) { return r.pend && r.emp === emp; }) : -1;   /* v4.15 결과가 오면 그 사람의 「처리 중」 줄을 바꾼다(두 줄로 남기지 않는다) */
  if (i >= 0) SCAN.log.splice(i, 1);
  SCAN.log.unshift({ emp: emp, msg: msg, ok: ok, t: Date.now(), pend: ok === null && msg === "처리 중" });
  if (SCAN.log.length > 12) SCAN.log.length = 12;
  var box = el("scanLog");
  if (box) box.innerHTML = scanLogHtml();
  if (redraw && !box) App.render();
}
function scanLogHtml() {
  if (!SCAN.log.length) return '<p class="ax-description">아직 찍은 참가자가 없어요</p>';
  return SCAN.log.map(function (r) {
    return '<div class="axs-lg' + (r.ok === true ? " ok" : r.ok === false ? " bad" : "") + '"><b>' + esc(r.emp || "-") + "</b><span>" + esc(r.msg) + "</span></div>";
  }).join("");
}

/* 담당자 적립 · QR이 안 될 때 운영 담당자가 참가자 폰에서 직접 처리한다 (참가자용 코드 입력은 폐기) */
function staffStampOpen() {
  var got = S.get("stamps", []);
  var rows = STAMPS.filter(function (s) { return s.site; }).map(function (s) {
    var done = got.indexOf(s.id) >= 0;
    /* .btn line = 전역 클래스. 설정 시트 전용 스코프 클래스(.fs-admin)는 여기서 스타일이 빠진다 */
    return '<button class="btn line" style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:10px' +
      (done ? ";opacity:0.45" : "") + '"' + (done ? " disabled" : ' onclick="staffStampGive(\'' + s.id + '\')"') + ">" +
      "<span>" + s.title + "</span>" +
      '<span style="font-weight:800;color:' + (done ? "var(--faint)" : "var(--acc2)") + '">' + (done ? "적립 완료" : lnkChev("적립")) + "</span></button>";
  }).join("");
  modalOpen('<p class="muted" style="font-size:calc(13.5px * var(--fs))"><b style="color:var(--hi)">담당자가 확인 후 적립해요.</b> 사번과 코드는 이 기기에 저장되지 않아요.</p>' +
    '<div id="staffBox" style="margin-top:12px">' +
    '<input id="staffEmp" class="input" inputmode="numeric" pattern="[0-9]*" enterkeyhint="next" autocomplete="off" placeholder="담당자 사번" style="text-align:center" oninput="numOnly(this, event)" data-imeend="num">' +
    '<input id="staffCode" class="input" inputmode="numeric" pattern="[0-9]*" enterkeyhint="go" autocomplete="off" placeholder="담당자 코드" style="margin-top:8px;text-align:center" onkeydown="onEnter(event, staffStampAuth)">' +
    '<button class="btn mint" style="margin-top:9px" onclick="staffStampAuth()">확인</button></div>' +
    '<div id="staffList" hidden>' + rows + "</div>", "담당자 적립");
}
/* v4.25 담당자 코드 확인 · e31eb79(260830)에서 주석 교체와 함께 지워져 「확인」이 ReferenceError 로 멈춰 있었다.
   keep=false = 코드를 이 참가자 폰에 저장하지 않는다(admVerify 주석) · 코드는 STAFFK 메모리에만
   v4.86 스태프 사번 칸 · 새 서버는 사번 명단(앱)으로 확인하고 사람 토큰을 준다(STAFFT · 메모리에만) · 적립은 그 토큰 + 사번(aemp) · 옛 서버는 코드 그대로 */
var STAFFE = "", STAFFT = "";
function staffStampAuth() {
  var se = String((el("staffEmp") || {}).value || "").trim().toUpperCase();
  if (!se) { toast("담당자 사번을 입력해 주세요"); return; }
  admVerify(el("staffCode").value, function (role, key, res) {
    STAFFK = key;
    STAFFE = res && res.emp && res.tok ? String(res.emp) : ""; STAFFT = STAFFE ? String(res.tok) : "";
    if (el("staffBox")) el("staffBox").hidden = true;
    if (el("staffList")) el("staffList").hidden = false;
  }, false, se);
}
/* 담당자 적립 · 코드를 거치지 않고 담당자 권한으로 부여한다.
   코드를 참가자 폰에 내려보내면 그 참가자가 부스 코드를 다 갖게 되므로 stamp_grant 를 쓴다.
   STAFFK 는 이 모달이 열려 있는 동안만 메모리에 있는 값이다(저장하지 않는다). */
function staffStampGive(id) {
  if (!BE.on) { toast("서버에 연결되지 않아 적립할 수 없습니다."); return; }
  if (!STAFFK) { toast("담당자 코드를 다시 입력해주세요."); return; }
  var u = S.get("user", {}) || {};
  var key = STAFFK, se = STAFFE, st = STAFFT;
  modalClose();                       /* STAFFK 는 여기서 비워지므로 위에서 미리 복사해 둔다 */
  var q = { action: "stamp_grant", emp: u.empId || "", id: id };
  if (se && st) { q.tok = st; q.aemp = se; } else q.key = key;   /* v4.86 사람 토큰이 있으면 코드는 보내지 않는다 */
  beCall(q,
    function (res) {
      if (!res || !res.ok) {
        toast(res && res.reason === "auth" ? (se ? "명단에 없는 사번이거나 코드가 맞지 않아요" : "담당자 코드가 올바르지 않습니다.") :
          res && res.reason === "noid" ? "담당자가 부여할 수 없는 스탬프입니다." : "적립하지 못했습니다.");
        return;
      }
      stampSync(res.stamps);
      if (res.dup) toast("이미 적립돼 있어요 · " + (res.name || id));
      else if (!stampOverlay(id)) toast("담당자 적립 완료 · " + (res.name || id));
      checkRewards();
      App.render();
    },
    function () { toast("서버에 연결할 수 없습니다. 다시 시도해주세요."); });
}
/* ── 인앱 QR 스캔 · BarcodeDetector(안드로이드 크롬). 미지원 기기는 기본 카메라로 QR을 찍는 기존 경로 ── */
var QRS = { stream: null, timer: null, det: null, busy: false, hint: null, next: 0, cv: null, g: null, tab: "scan" };
/* jsQR 경로 · 카메라 프레임을 480px로 줄여 디코딩한다(원본 해상도로 돌리면 폰에서 프레임당 수백 ms) */
function qrDecodeFrame(v) {
  var vw = v.videoWidth, vh = v.videoHeight;
  if (!vw || !vh) return null;
  var sc = Math.min(1, 480 / Math.max(vw, vh));
  var w = Math.round(vw * sc), h = Math.round(vh * sc);
  if (!QRS.cv) { QRS.cv = document.createElement("canvas"); QRS.g = QRS.cv.getContext("2d", { willReadFrequently: true }); }
  if (QRS.cv.width !== w || QRS.cv.height !== h) { QRS.cv.width = w; QRS.cv.height = h; }
  QRS.g.drawImage(v, 0, 0, w, h);
  var r = jsQR(QRS.g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
  /* v4.13 코드 자리(영상 원래 크기 좌표) · 인식 순간 테두리를 그 자리에 그린다 */
  QRS.pts = r && r.location ? ["topLeftCorner", "topRightCorner", "bottomRightCorner", "bottomLeftCorner"].map(function (k) { return { x: r.location[k].x / sc, y: r.location[k].y / sc }; }) : null;
  return r && r.data ? r.data : null;
}
/* 카메라만 열리면 된다. 디코더는 BarcodeDetector(안드로이드 크롬) 또는 내장 jsQR(그 외 · 아이폰 포함) */
function qrScanSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
    ("BarcodeDetector" in window || typeof jsQR === "function");
}
/* v4.06 qrScanOpen → Q02 스캔 화면 (3단계 절 scanOpen) */
function qrScanTick() {
  var v = el("qrVideo");
  if (!v) { qrScanClose(); return; }          /* 모달이 다른 경로로 닫힌 경우 카메라 정리 */
  if (QRS.busy || v.readyState < 2) return;
  if (QRS.det) {                              /* 안드로이드 크롬 · 네이티브 디코더(비동기) */
    QRS.busy = true;                          /* detect가 느린 기기에서 호출이 겹쳐 쌓이지 않게 */
    QRS.det.detect(v).then(function (codes) {
      QRS.busy = false;
      if (codes && codes.length) qrScanHit(String(codes[0].rawValue || ""), codes[0].cornerPoints || null);
    }).catch(function () { QRS.busy = false; });
    return;
  }
  if (typeof jsQR !== "function") return;     /* 아이폰 등 · 내장 jsQR(동기) */
  if (Date.now() < QRS.next) return;
  var t0 = Date.now();
  var raw = qrDecodeFrame(v);
  QRS.next = Date.now() + (Date.now() - t0);  /* 디코딩에 쓴 만큼 쉰다(듀티 50%) · 저사양 폰에서 화면이 굳지 않게 */
  if (raw) qrScanHit(raw, QRS.pts);
}
/* ═══ v4.13 인식 순간 0.8초(사용자 확정 260922 · 스캔 직후 곧바로 넘어가 인식 여부를 느낄 틈이 없었다) ═══
   모든 스캐너 공통(참가자 Q02 · 계단 · 부스 · Wall 퀴즈 · 참가자 QR · 운영자 현장 스캔 · 현장 타자왕전):
   ① 카메라 화면 정지(그 순간 프레임을 캔버스로 덮는다) ② 코드 자리 주황 테두리 + 체크 ③ 짧은 진동 · 효과음(소리 설정을 따른다) ④ 「인식했어요」
   서버 요청은 인식 즉시 보내고, 그 사이 화면 전환(App.go · App.render · 알림 팝업)만 0.8초가 끝날 때까지 미룬다 → 전체 대기 = max(0.8초, 서버 응답).
   머무는 동안 들어온 인식은 버린다(같은 코드 연속 인식 중복 처리 금지 · 운영자 스캐너의 3초 중복 가드는 그대로). */
var QR_HOLD = 800;
function qrGated() { return !!(QRS.gate && Date.now() < QRS.gate); }
function qrGateDefer(fn) { QRS.gateQ = QRS.gateQ || []; QRS.gateQ.push(fn); }
function qrHoldShow(pts) {
  var v = el("qrVideo"); if (!v) return;
  var vw = v.videoWidth, vh = v.videoHeight, par = v.parentNode;
  qrHoldHide();
  if (getComputedStyle(par).position === "static") par.style.position = "relative";
  var ov = document.createElement("div"); ov.id = "qrHold"; ov.className = "axs-qrhold";
  ov.style.left = v.offsetLeft + "px"; ov.style.top = v.offsetTop + "px"; ov.style.width = v.offsetWidth + "px"; ov.style.height = v.offsetHeight + "px";
  var fit = getComputedStyle(v).objectFit, par2 = fit === "cover" ? "xMidYMid slice" : fit === "fill" ? "none" : "xMidYMid meet";
  if (vw && vh) {
    var cv = document.createElement("canvas"); cv.width = vw; cv.height = vh; cv.style.objectFit = fit || "contain";
    try { cv.getContext("2d").drawImage(v, 0, 0, vw, vh); } catch (e) {}
    ov.appendChild(cv);
    var P = pts && pts.length >= 4 ? pts : null;
    if (!P) { var s = Math.min(vw, vh) * 0.5; P = [{ x: (vw - s) / 2, y: (vh - s) / 2 }, { x: (vw + s) / 2, y: (vh - s) / 2 }, { x: (vw + s) / 2, y: (vh + s) / 2 }, { x: (vw - s) / 2, y: (vh + s) / 2 }]; }
    var cx = 0, cy = 0; P.forEach(function (p) { cx += p.x / P.length; cy += p.y / P.length; });
    var side = Math.max(Math.hypot(P[1].x - P[0].x, P[1].y - P[0].y), Math.hypot(P[3].x - P[0].x, P[3].y - P[0].y));
    var pad = side * 0.08, poly = P.map(function (p) { var dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1; return (p.x + dx / d * pad).toFixed(1) + "," + (p.y + dy / d * pad).toFixed(1); }).join(" ");
    var r = Math.max(side * 0.16, Math.min(vw, vh) * 0.05);
    ov.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 ' + vw + " " + vh + '" preserveAspectRatio="' + par2 + '" aria-hidden="true">' +
      '<path class="dim" fill-rule="evenodd" d="M0 0H' + vw + "V" + vh + "H0Z M" + poly.split(" ").join(" L") + 'Z"/>' +
      '<polygon class="edge" points="' + poly + '"/>' +
      '<circle class="ok" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '"/>' +
      '<path class="ck" d="M' + (cx - r * 0.45).toFixed(1) + " " + (cy + r * 0.02).toFixed(1) + "L" + (cx - r * 0.12).toFixed(1) + " " + (cy + r * 0.34).toFixed(1) + "L" + (cx + r * 0.48).toFixed(1) + " " + (cy - r * 0.3).toFixed(1) + '" stroke-width="' + (r * 0.2).toFixed(1) + '"/></svg>');
  }
  ov.insertAdjacentHTML("beforeend", '<p class="axs-qrhold-lb" role="status" id="qrHoldLb">인식했어요</p>');
  par.appendChild(ov);
  try { v.pause(); } catch (e) {}
}
function qrHoldHide() { var o = el("qrHold"); if (o) o.remove(); }
/* 머무는 시간이 끝나면 미뤄 둔 화면 전환을 순서대로 · 계속 찍는 스캐너(운영자)는 다시 연다 */
function qrHoldEnd(done) {
  QRS.gate = 0;
  var q = QRS.gateQ || []; QRS.gateQ = [];
  var rendered = false;
  q.forEach(function (fn) { if (fn === "render") { if (!rendered) { rendered = true; App.render(); } } else fn(); });
  if (done) done();
  if (typeof noticePump === "function" && NOTICE.q.length) noticePump();
}
function qrScanHit(raw, pts) {
  if (QRS.hold) return;                       /* 머무는 동안 들어온 인식은 버린다 */
  /* 운영자 스캐너는 참가자 QR 이 아니거나 3초 안 같은 코드면 멈추지 않는다(기존 로그 · 중복 가드 그대로) · v4.32 옛 타자왕전 스태프 QR 확인은 셀프 모드로 대체돼 없다 */
  if (SCAN.on) {
    var emp = qrParseUser(raw), lst = SCAN;
    if (!emp || (raw === lst.last && Date.now() - lst.lastT < 3000)) { scanHit(raw); return; }
  }
  QRS.hold = true; QRS.gate = Date.now() + QR_HOLD; QRS.gateQ = [];
  if (QRS.timer) { clearInterval(QRS.timer); QRS.timer = null; }   /* 머무는 동안 프레임을 훑지 않는다 */
  if (QRS.hint) { clearTimeout(QRS.hint); QRS.hint = null; }
  qrHoldShow(pts);
  stampBuzz(30);
  var s0 = SFX.site; SFX.site = false; sfx("scan"); SFX.site = s0;
  var cont = SCAN.on;
  if (SCAN.on) scanHit(raw);                  /* 운영자 스캐너 · 연속 스캔이라 닫지 않는다 */
  else qrHandle(raw);                         /* 요청은 지금 · 화면 전환만 0.8초 뒤 */
  var onQ = App.current === "scan_q";
  setTimeout(function () {
    qrHoldEnd(function () {
      if (cont) {                             /* 계속 찍기 · 정지를 풀고 다시 훑는다 */
        QRS.hold = false; qrHoldHide();
        var v = el("qrVideo");
        if (SCAN.on && v && QRS.stream) { var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); if (!QRS.timer) QRS.timer = setInterval(qrScanTick, 120); }
        return;
      }
      if (!onQ || App.current !== "scan_q") { QRS.hold = false; qrCamStop(); return; }   /* 결과 · 계단 · 퀴즈 화면으로 넘어갔다 */
      /* 아직 Q02 · 서버 응답을 기다리면 정지 화면을 그대로 두고 「확인하는 중」 · 응답이 오면 결과로 넘어간다 */
      var t0 = Date.now(), lb = el("qrHoldLb");
      (function wait() {
        if (App.current !== "scan_q") { QRS.hold = false; qrCamStop(); return; }
        if ((STAMPQ.busy || STR.busy) && Date.now() - t0 < 20000) { if (lb) lb.textContent = "확인하는 중"; setTimeout(wait, 100); return; }
        QRS.hold = false; qrCamStop();
        SCQ.paused = true; App.render();     /* v4.06 화면을 떠나지 않는 결과(참가자 QR 등) · 같은 QR 을 곧바로 다시 읽지 않게 멈춤 */
      })();
    });
  }, QR_HOLD);
}
function qrScanClose() {
  qrCamStop();
  if (el("qrVideo")) modalClose();
}
/* v4.06 qrHandle → qrRoute (3단계 절 · 링크와 스캐너가 같은 분기) */
/* v4.08 글자 수 = 공백을 뺀 글자 · 5글자 이상이면 제출 버튼이 켜진다 · 입력은 지우지 않는다 */
var IDEA_MIN = 5;
/* v5.39 (사용자 261003 「2,000자 이상」) 최대 3,000자 · 서버 IDEA_MAX 와 같다(서버는 넘으면 long 으로 거절) · 칸 maxlength 가 먼저 막는다 */
var IDEA_MAX = 3000;
/* 칸 높이 = 쓴 만큼(최대 높이는 CSS .axs-grow · 넘으면 칸 안에서 스크롤) · 키 입력마다 · 그린 직후 한 번 */
function ideaFit() { var t = el("ideaText"); if (!t) return; t.style.height = "auto"; t.style.height = (t.scrollHeight + 2) + "px"; }
function ideaOk(v) { return ideaLen(v) >= IDEA_MIN && String(v || "").length <= IDEA_MAX; }   /* v5.39 예시 칩을 그리지 않으므로 예시 판정(ideaIsEx)은 뺀다 */
/* v5.39 내가 낸 아이디어 · 긴 글(160자 넘음 또는 4줄 넘음)은 앞부분 + 「펼치기 · n자」 · 누르면 전문 · 「접기」 */
var IDEA_CLIP = 160, IDEA_OPEN = {};
function ideaMineTxt(i) {
  var t = String(i.text || ""), a = Array.from(t), ls = t.split("\n");
  if (a.length <= IDEA_CLIP && ls.length <= 4) return esc(t);
  var op = !!IDEA_OPEN[i.id], cut = ls.slice(0, 4).join("\n"), ca = Array.from(cut);
  cut = (ca.length > IDEA_CLIP ? ca.slice(0, IDEA_CLIP).join("") : cut).replace(/\s+$/, "") + "…";
  return esc(op ? t : cut) + ' <button type="button" class="ax-link axs-plain" aria-expanded="' + op + '" onclick="ideaMineOpen(\'' + esc(i.id) + '\')">' + (op ? "접기" : "펼치기 · " + a.length.toLocaleString() + "자") + "</button>";
}
function ideaMineOpen(id) { IDEA_OPEN[id] = !IDEA_OPEN[id]; App.render(); }
function ideaLen(v) { return String(v || "").replace(/\s/g, "").length; }
function ideaDraft() { if (IDEA.draft == null) IDEA.draft = String(S.get("idea_draft", "") || ""); return IDEA.draft; }
function ideaLeftTxt(n, v) { return n >= IDEA_MIN ? "제출할 수 있어요" : n === 0 ? IDEA_MIN + "글자 이상 쓰면 제출할 수 있어요" : (IDEA_MIN - n) + "글자 더 쓰면 제출할 수 있어요"; }
function ideaInput(v) {
  IDEA.draft = v; S.put("idea_draft", v);   /* v4.25 조용한 저장 · 다시 그리지 않는다(한글 조합 보호) */
  var n = ideaLen(v), c = el("ideaCnt"), l = el("ideaLeft"), b = el("ideaGo");
  if (c) c.textContent = v.length.toLocaleString();
  ideaFit();
  if (l) l.textContent = ideaLeftTxt(n, v);
  if (b) b.disabled = !ideaOk(v);
}
function submitIdea() {
  var text = ideaDraft().trim();
  if (!ideaOk(text)) { ideaInput(ideaDraft()); return; }   /* 버튼이 꺼져 있어 보통 오지 않는다 · 입력은 그대로 */
  var nth = counters().ideas;
  try { ideaPush(text, "", !!IDEA.anon, "app"); }   /* v5.39 분야 칩 없음 · 빈 값(콘솔 「분야 없음」) */
  catch (e) { IDEA.err = "제출하지 못했어요. 다시 눌러 주세요."; App.render(); return; }   /* 실패해도 쓴 내용은 남는다 */
  IDEA.draft = ""; S.set("idea_draft", ""); IDEA.err = "";
  App.render(); window.scrollTo(0, 0);   /* v4.07 커피챗 참석 질문(또는 제출 완료)으로 */
  if (WALL_ON) setTimeout(function () { toast("오늘 " + (nth + 1).toLocaleString() + "번째 아이디어! ME to WE 월에 점 하나가 켜졌어요."); }, 100);   /* v5.00 월 문구는 WALL_ON 일 때만 · 제출 완료는 다음 화면이 알린다 */
}
function tryAdmin() {
  admVerify(el("adminCode").value, function () { S.set("admin_authed", true); App.render(); });
}

