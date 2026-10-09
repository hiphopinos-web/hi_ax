/* ════════ v4.15 폰 관리자 모드 3화면 (사용자 확정 260922) ════════
 * 현장 담당자가 서서 폰으로 하는 것만 남긴다: ① 스캔 ② 존 혼잡도 ③ 내 담당 명단.
 * v35 의 13탭 2단 메뉴(스태프 9 + 통제센터 4)와 옛 로컬 목업(상담 · 커피챗 · 아이디어 · 퀴즈 문항 · 대시보드 숫자)은 지웠다.
 * 등급코드(role grade)로 들어오면 혼잡도만 보인다(서버도 다른 액션을 auth 로 막는다). */
/* v4.71 (260930 사용자 결정) 폰 관리자 모드 = 「QR 스캔」 · 「혼잡 제보」 두 개만 · 크고 쉽게.
 * 옛 「혼잡도」(층 · 존 3단 · admZoneHtml)와 「담당 명단」(admListHtml)은 코드를 두고 진입만 뺐다(명단 · 노쇼 표시는 콘솔 신청 › 담당 명단).
 * 등급코드(role grade)로 들어오면 혼잡 제보만 보인다(서버도 다른 액션을 auth 로 막는다). */
/* 261009 스태프 관리 요청 = POST 폼 본문(API 계약 확정 10절 · 사용자 261009 「스태프 폰도 POST로」) · tok · key · sp 가 주소(Worker 로그 · 기록 · 프록시)에 남지 않게
 *   주소 = GAS_URL 그대로(쿼리 없음 · callback 없음) · 본문 = URLSearchParams(단순 요청 · 사전 요청 없음) · 응답 = r.json() · 응답 뒤 처리는 beCall 과 같다(서버 시계 · 종료 · 오픈 단계 · moved 한 번 다시)
 *   15초 = 실패(fail "timeout") · 네트워크 = "network" · JSON 아님 = "bad" · 참가자 일반 요청(beCall · JSONP)은 그대로 */
function admCall(params, done, fail, again) {
  if (!GAS_URL || typeof fetch !== "function" || typeof URLSearchParams !== "function") { if (fail) fail("offline"); return; }
  var body = new URLSearchParams(), settled = false, ctl = typeof AbortController === "function" ? new AbortController() : null;
  for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k) && params[k] != null) body.append(k, String(params[k]));
  var end = function (why) { if (settled) return; settled = true; clearTimeout(timer); if (fail) fail(why); };
  var timer = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) {} end("timeout"); }, 15000);
  fetch(GAS_URL, { method: "POST", body: body, cache: "no-store", signal: ctl ? ctl.signal : undefined }).then(function (r) {
    return r.json().then(function (res) {
      if (settled) return; settled = true; clearTimeout(timer);
      if (res && typeof sesSeen === "function") sesSeen(res, params);
      if (res && typeof endSeen === "function") endSeen(res, params);
      if (res && res.reason === "notopen" && typeof ogShow === "function") ogShow(res.open, params);
      if (res && res.moved && beMoved(res) && res.reason === "moved" && !again) { admCall(params, done, fail, 1); return; }
      if (done) done(res);
    }, function () { end("bad"); });
  }, function () { end("network"); });
}
var ADM_TABS = [["scan", "QR 스캔"]];   /* 261008 「혼잡 제보」 탭 진입 뺌(admCrowdHtml 코드는 남김) · 지금 현장 제보 = 홈 칸 · 스캔 화면 「줄」(cnSheet) */
function admTab(t) { scanStop(); S.set("adm_tab", t); App.render(); window.scrollTo(0, 0); }
function admHtml() {
  var grade = admRole() === "grade";
  var tab = grade ? "crowd" : S.get("adm_tab", "scan");
  var fn = { scan: admScanHtml, crowd: cnAdmNote };   /* 261008 등급 담당 = 홈 칸 안내 */
  if (!fn[tab]) tab = "scan";
  var seg = grade ? '<p class="ax-meta">등급 담당 · 지금 현장 제보만 할 수 있어요</p>' : ADM_TABS.length < 2 ? "" :
    '<div class="axs-seg axs-admseg" role="tablist" aria-label="관리자 기능">' + ADM_TABS.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (tab === t[0]) + '" onclick="admTab(\'' + t[0] + '\')">' + t[1] + "</button>";
    }).join("") + "</div>";
  var warn = BE.on ? "" : '<div class="axs-err" role="alert"><b>서버에 연결되지 않았어요</b><span>이 상태로 처리하면 기록이 남지 않아요</span></div>';
  return '<div class="ax-stack">' + seg + warn + fn[tab]() +
    '<button type="button" class="ax-button ax-button-weak" onclick="scanStop(); admLock()">관리자 모드 끝내기</button></div>';
}

/* ── ① QR 스캔 · v4.71 (260930 사용자 결정) 드롭다운 「담당 위치」 → 큰 타일로 목적 고르기 ──
 * 고르면 카메라 위에 「지금 찍으면 → 결과」를 크게 · 「목적 바꾸기」는 늘 보이게 · 고른 목적은 이 기기에 기억(scan_spot).
 * 찍은 결과는 크게(이름 · 결과 · 한 줄) · 성공 · 실패를 색과 짧은 진동으로 · 최근 스캔은 아래에 작게.
 * 찍는 순간의 처리(액션 · 서명 QR · 스태프 토큰 · 잠금 문구 · 룰렛 소진 out · who 이름)는 v4.65~v4.67 그대로(scanHit · scanDone). */
function scanWhat(sp) {
  if (sp.kind === "roulette" && S.get("roulette_out", false)) return "룰렛 소진 · 찍어도 차감하지 않아요";   /* v4.65 */
  return sp.cond || "";
}
function scanTileHtml(sp) {
  return '<button type="button" class="axs-stile" onclick="scanChoose(\'' + sp.id + '\')"><b>' + esc(sp.lb || sp.nm) + "</b>" + (sp.tsub ? "<span>" + esc(sp.tsub) + "</span>" : "") + "</button>";
}
function scanChoose(id) {
  if (id === "sess") { SCAN.sub = "sess"; App.render(); window.scrollTo(0, 0); return; }
  scanPick(id); SCAN.pick = false; SCAN.sub = ""; SCAN.res = null;
  window.scrollTo(0, 0);
  if (qrScanSupported() && BE.on) scanStart();   /* 고르면 곧바로 찍는다(목적을 고른 손짓 = 카메라 허용 손짓) */
}
function scanRepick() { scanStop(); SCAN.pick = true; SCAN.sub = ""; App.render(); window.scrollTo(0, 0); }
var INV_LNK = "";   /* v5.34 스캔 화면 맨 아래 「재고 · 박스 열기」 작은 링크 → 261009 숨김(콘솔 재구성 설계안 4절 · invBoxOpen 코드는 남김) · 그 자리 = 「운영자에게 요청」(sreqLnk · 111-js-staff-req.js) */
function admScanHtml() {
  var sp = scanSpot(SCAN.spot), log = '<section class="ax-stack-tight axs-gap12"><h2 class="ax-meta">최근 스캔</h2><div class="ax-card axs-slog" id="scanLog">' + scanLogHtml() + "</div></section>";
  if (!sp || SCAN.pick) {
    if (SCAN.sub === "sess") {
      return '<div class="axs-srow"><h2 class="ax-section-title">10F 세션 입장</h2><button type="button" class="ax-link axs-plain" onclick="SCAN.sub = \'\'; App.render()">목적 목록으로</button></div>' +
        '<div class="axs-stiles">' + SCAN_SPOTS.filter(function (x) { return x.kind === "sess"; }).map(scanTileHtml).join("") + "</div>";
    }
    return '<h2 class="ax-section-title">무엇을 찍나요?</h2><div class="axs-stiles">' +
      scanTileIds().map(function (id) {   /* v5.05 포토부스 대기 폐지 · 정리 #7 타일 목록에서 뺐다 · v6.00 10F 세션 타일은 SCAN_10F_UI 일 때만 */ return id === "sess" ? (!SCAN_10F_UI ? "" : '<button type="button" class="axs-stile" onclick="scanChoose(\'sess\')"><b>10F 세션 입장</b><span>A~E 고르기</span></button>') : scanTileHtml(scanSpot(id)); }).join("") + "</div>" +
      (sp ? '<button type="button" class="ax-button ax-button-weak" onclick="SCAN.pick = false; App.render()">' + esc(sp.lb || sp.nm) + " 그대로 찍기</button>" : "") + log + INV_LNK + sreqLnk();
  }
  var w = scanWhat(sp), out = sp.kind === "roulette" && S.get("roulette_out", false);
  var will = '<section class="axs-will' + (out ? " bad" : "") + '"><div class="axs-srow"><p class="axs-will-k">지금 찍으면</p>' +
    '<button type="button" class="axs-will-chg" onclick="scanRepick()">목적 바꾸기</button></div>' +
    '<p class="axs-will-v">' + esc(sp.will || sp.nm) + "</p>" + (w ? '<p class="axs-will-c">' + esc(w) + "</p>" : "") + "</section>";
  var cam = SCAN.on
    ? '<div class="axs-scam"><video id="qrVideo" playsinline muted></video></div><button type="button" class="ax-button ax-button-weak" onclick="scanStop(); App.render()">스캔 멈추기</button>'
    : '<button type="button" class="ax-button axs-camgo" onclick="scanStart()">카메라 켜고 찍기</button>';
  return will + cam + '<div id="scanRes">' + scanBigHtml() + "</div>" + log + INV_LNK + sreqLnk();
}
/* 찍은 결과 한 장 · tone = ok(성공) | dup(이미 · 할 일 없음) | bad(실패) | wait(확인하는 중 · 붐빔) */
function scanBigHtml() {
  var r = SCAN.res;
  if (!r) return "";
  return '<section class="axs-sres ' + r.tone + '" role="status" aria-live="polite">' +
    '<p class="axs-sres-who">' + esc(r.who || "") + '<span class="n">' + esc(hhmmss(r.t)) + "</span></p>" +
    '<p class="axs-sres-h">' + esc(r.head) + "</p>" + (r.sub ? '<p class="axs-sres-s">' + esc(r.sub) + "</p>" : "") + (r.go ? '<p class="axs-sres-s"><b>' + esc(r.go) + "</b></p>" : "") + (r.inv ? invResHtml(r) : "") + "</section>";   /* v5.94 go = 스태프가 할 말 한 줄(체크인 → 룰렛 부스) */
}
function hhmmss(t) { var d = new Date(t || Date.now()), p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()); }
function scanShow(tone, who, head, sub, go) {
  SCAN.res = { tone: tone, who: who, head: head, sub: sub || "", go: go || "", t: Date.now() };
  var box = el("scanRes");
  if (box) box.innerHTML = scanBigHtml();
  if (tone === "ok") stampBuzz(60);
  else if (tone === "bad") stampBuzz([120, 80, 120]);
  var bd = SCAN.bd; SCAN.bd = null;   /* v5.98 결과 띠 문구(scanDone 이 넣는다 · 없으면 제목 · 한 줄 그대로) */
  sscShow(tone, who, head, sub, bd);
}

/* ═══ v5.98 스태프 폰 연속 스캔 (사용자 261006 밤 「스태프가 바쁜데 핸드폰을 켜고 QR을 찍고 그러면 정신이 없을 수 있을 것 같아」 · 「스태프들 관리자 모드로 핸드폰을 들고」
 *     · 「스태프 사번으로 로그인하면 QR 코드 부분에 관리자용 QR 코드 스캐너를 심으면 · 어디 스캐너인지 알아야 하니 설정 버튼은 필요」) ═══
 * 스태프 폰(관리자 모드를 연 기기 · staffOn) = 아래 가운데 큰 원 단추가 「스캔」 → 이 화면(sscan). 일반 직원은 그대로 「내 QR」.
 * 맨 위 = 닫기 · 자리 칩 · 오늘 이 폰 처리 수 · 톱니(자리 고르기 시트 · 스캔 소리 · 내 QR · 관리자 모드 화면). 자리는 이 기기에 기억(scan_spot · AX PLAY 부스 = scan_sub).
 * 처음(자리 없음) = 시트부터. 자리가 있으면 카메라가 곧바로 켜지고 계속 켜진 채 다음 사람을 기다린다(scanHit · scanDone 그대로 · 찍을 때마다 메뉴를 다시 고르지 않는다).
 * 찍으면 = 진동 + 짧은 소리(이 화면 설정 · 기본 켬) + 카메라 위 큰 결과 띠 1.5초(초록 성공 · 회색 이미 · 주황 룰렛 · 빨강 실패 · 이름 가운데 가림) → 저절로 다음 대기.
 * 같은 사람 QR 이 계속 비쳐도 3초 안 재스캔은 무시(scanSeen · 계속 비치면 다시 잰다). 화면 꺼짐 막기(Wake Lock · 지원 기기). 등급 · 키트 · 되돌리기 단추는 아래(엄지 자리) 결과 판 그대로(invResHtml).
 * 오프라인 저장은 하지 않는다(스태프 스캔은 원래 저장 방식이 없다 · 룰렛 이중 사용을 막으려면 그 자리에서 서버 판정) · 서버 미연결 = 띠 「기록되지 않았어요」. 기존 관리자 모드 › QR 스캔 경로는 그대로 둔다. */
var SSC = { band: null, bandT: null, camErr: false, starting: false, wl: null, wlReq: false };
var SSC_BAND_MS = 1500;
Views.sscan = function () { return sscHtml(); };
var SSC_SUB = { p2: [["hdq", "하이디큐"], ["hhp", "하이헬퍼"]] };   /* 같은 동작(stamp_grant p2) · 칩에 어느 부스인지만 */
function staffOn() { return !!S.get("admin_authed", false) && admRole() !== "grade" && !!(admTok() || admKey()); }   /* 새 판정 없음 · 관리자 모드(사번 + 코드 · admin_check)를 이 폰에서 연 스태프 */
/* v6.00 (사용자 261006 밤 「로그인만으로 바뀜」) 앱 스태프 명단(서버 설정 관리명단_앱 · 콘솔에서 넣음)에 있는 사번 = 로그인 · sync 응답 staff 1 → 처음부터 가운데 단추 「스캔」.
 *   처음 누를 때만 코드를 한 번(sscCodeAsk → admVerify 그대로 · 코드 · 토큰 저장 방식 그대로) · 그 뒤로는 바로 연속 스캐너(staffOn).
 *   staff_me = true | false(서버가 말함 · 다른 사람 명단 · 코드는 오지 않는다) · 없음(옛 서버 · 로그인 직후 응답 전) = 예전대로 관리자 모드를 연 폰만(staffOn).
 *   명단에서 빠지면 다음 sync 에 false → 「내 QR」(스캔 화면에 있었으면 홈으로) · 서버도 그 사번의 사람 토큰을 곧바로 막는다(admIn_). */
function staffMe() { var v = S.get("staff_me", null); return v === true || v === false ? v : null; }
function staffBtn() { var m = staffMe(); return m === null ? staffOn() : m; }
function staffMeIn(v) {
  if (v !== 0 && v !== 1 && v !== true && v !== false) return;   /* 옛 서버 · 필드 없음 = 그대로 */
  var on = !!v;
  if (staffMe() === on) return;
  S.set("staff_me", on);
  if (!on && App.current === "sscan") App.go("home");
}
var SSC_CK = { busy: false };
function sscCodeAsk() {
  modalOpen('<p class="ax-body">처음 한 번만 입력해요</p>' +
    '<label class="ax-sr-only" for="sscCode">스태프 코드</label>' +
    '<input id="sscCode" class="ax-field ssc-code" inputmode="numeric" pattern="[0-9]*" enterkeyhint="go" autocomplete="off" placeholder="코드를 입력해 주세요" onkeydown="onEnter(event, sscCodeGo)">' +
    '<button type="button" class="ax-button ssc-codego" id="sscCodeGo" onclick="sscCodeGo()">확인하기</button>', "스태프 코드");
  setTimeout(function () { try { el("sscCode").focus(); } catch (e) {} }, 150);
}
function sscCodeGo() {
  var v = String((el("sscCode") || {}).value || "").trim(), b = el("sscCodeGo");
  if (SSC_CK.busy) return;
  if (!v) { toast("코드를 입력해 주세요"); return; }
  if (!BE.on) { toast("서버에 연결되지 않아 열 수 없어요"); return; }
  if (sscSndOn()) sfxUnlock();   /* 누른 손짓에서 소리를 연다(응답 뒤에는 손짓이 아니다) */
  SSC_CK.busy = true; if (b) { b.disabled = true; b.textContent = "확인하는 중"; }
  var undo = function () { SSC_CK.busy = false; var b2 = el("sscCodeGo"); if (b2) { b2.disabled = false; b2.textContent = "확인하기"; } };
  admVerify(v, function (role) {
    undo(); modalClose();
    S.set("admin_authed", true);
    var then = SSC_CK.then; SSC_CK.then = null;
    if (then) { then(); return; }   /* 261008 지금 현장 칸에서 연 코드 창 · 넣은 뒤 그 입력 시트로 */
    if (role === "grade") { toast("이 코드로는 지금 현장 제보만 할 수 있어요"); App.go("home"); return; }
    App.go("sscan");
  }, undefined, undefined, undo);
}
/* 같은 사람(사번) 3초 · 계속 비치면 시계를 다시 잰다 */
function scanSeen(emp) { if (emp && emp === SCAN.lastE && Date.now() - SCAN.seenE < 3000) { SCAN.seenE = Date.now(); return true; } return false; }
function sscSub(id) { var L = SSC_SUB[id || SCAN.spot], v = S.get("scan_sub", ""); return L ? (L.filter(function (x) { return x[0] === v; })[0] || L[0]) : null; }
function sscSpotLb(sp) { var u = sscSub(sp.id); return u ? sp.nm + " · " + u[1] : sp.kind === "sess" ? sp.nm : sp.lb || sp.nm; }
function sscDay() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
function sscCnt() { var c = S.get("ssc_cnt", null); return c && c.d === sscDay() ? Number(c.n) || 0 : 0; }
function sscCntUp() { S.put("ssc_cnt", { d: sscDay(), n: sscCnt() + 1 }); var b = el("sscN"); if (b) b.textContent = sscCnt(); }
function sscSndOn() { return S.get("ssc_snd", true) === true; }
function sscSfx(name) { if (!sscSndOn()) return; var c = sfxCtx(); if (!c) return; try { if (c.state !== "running") c.resume(); } catch (e) {} try { sfxPlay(name); } catch (e) {} }
/* 이름 가운데 가림(홍길동 → 홍*동) · 사번만 있으면 가운데 두 자리 */
function sscMask(s) {
  s = String(s || ""); var a = Array.from(s);
  if (/^\d{5,}$/.test(s)) return s.slice(0, 2) + "**" + s.slice(-2);
  return a.length <= 1 ? s : a.length === 2 ? a[0] + "*" : a[0] + new Array(a.length - 1).join("*") + a[a.length - 1];
}
function sscShow(tone, who, head, sub, bd) {
  if (tone === "ok") sscCntUp();
  var c = bd && bd.c || tone;
  SSC.band = { c: c, big: bd && bd.big || "", t: tone === "wait" ? head : bd && bd.full ? bd.t : (who ? sscMask(who) + " · " : "") + (bd && bd.t || head), s: bd && bd.s != null ? bd.s : sub || "" };   /* 261007 big = 사이즈 · 창구 글자 아주 크게 · full = 문구 그대로(접수 「B-007 · 홍*동 → B 창구」) */
  sscBandPaint();
  if (SSC.bandT) clearTimeout(SSC.bandT);
  SSC.bandT = setTimeout(function () { SSC.bandT = null; SSC.band = null; sscBandPaint(); }, tone === "wait" ? 16000 : SSC_BAND_MS * (bd && bd.x || 1));   /* 261007 창구 띠는 다음 사람까지 더 오래(x 배) */
  if (App.current === "sscan" && tone !== "wait") sscSfx(tone === "bad" ? "rgmiss" : tone === "dup" ? "tik" : "ting");
}
function sscBandHtml() {
  var b = SSC.band;
  if (b && b.big) return '<div class="ssc-band big c-' + b.c + (String(b.big).length >= 3 ? " l3" : "") + '" id="sscBand" role="status" aria-live="assertive"><i class="bg">' + esc(b.big) + '</i><div class="tx"><b>' + esc(b.t) + "</b>" + (b.s ? "<span>" + esc(b.s) + "</span>" : "") + "</div></div>";   /* 261007 */
  return '<div class="ssc-band' + (b ? " c-" + b.c : "") + '" id="sscBand" role="status" aria-live="assertive"' + (b ? "" : " hidden") + ">" + (b ? "<b>" + esc(b.t) + "</b>" + (b.s ? "<span>" + esc(b.s) + "</span>" : "") : "") + "</div>";
}
function sscBandPaint() { var n = el("sscBand"); if (n) n.outerHTML = sscBandHtml(); }
function sscOpen() { SSC_CK.then = null; if (!staffOn()) { sscCodeAsk(); return; } if (sscSndOn()) sfxUnlock(); App.go("sscan"); }   /* v6.00 명단 사번 · 이 폰에서 아직 코드를 안 넣었으면 한 번 */
function sscClose() { App.back(); }
function sscMine() { qrPanelOpen("mine"); }
function sscHtml() {
  var sp = scanSpot(SCAN.spot), w = sp ? scanWhat(sp) : "";
  var top = '<div class="ssc-top"><button type="button" class="ssc-ib" onclick="sscClose()" aria-label="닫기">' + X_SVG + "</button>" +
    '<button type="button" class="ssc-spot" onclick="sscSheet()"><span>자리</span><b>' + esc(sp ? sscSpotLb(sp) : "자리를 골라 주세요") + "</b></button>" +
    sscCnBtn(sp) +   /* 261008 룰렛 · AX PLAY 자리 = 「줄」(지금 현장 입력 시트) */
    '<p class="ssc-n"><span>오늘</span><b id="sscN">' + sscCnt() + "</b></p>" +
    '<button type="button" class="ssc-ib" onclick="sscSheet()" aria-label="자리 · 설정">' + GEAR_SVG + "</button></div>";
  var warn = BE.on ? "" : '<div class="axs-err" role="alert"><b>서버에 연결되지 않았어요</b><span>이 상태로 찍으면 기록되지 않아요</span></div>';
  var will = sp ? '<p class="ssc-will' + (sp.kind === "roulette" && S.get("roulette_out", false) ? " bad" : "") + '">찍으면 <b>' + esc(sp.will || sp.nm) + "</b>" + (w ? "<span>" + esc(w) + "</span>" : "") + "</p>" : "";
  var cam = !sp ? '<div class="ssc-cam off"><p>먼저 자리를 골라 주세요</p><button type="button" class="ax-button" onclick="sscSheet()">자리 고르기</button></div>'
    : !qrScanSupported() ? '<div class="ssc-cam off"><p>이 기기에서는 카메라를 열 수 없어요</p></div>'
    : '<div class="ssc-cam"><video id="qrVideo" playsinline muted></video><span class="ssc-fr" aria-hidden="true"></span>' + sscBandHtml() +
      (SSC.camErr ? '<button type="button" class="ax-button ssc-camgo" onclick="sscCamGo()">카메라 켜기</button>' : "") + "</div>";
  var log = '<details class="ssc-log"><summary>최근 스캔</summary><div id="scanLog">' + scanLogHtml() + "</div></details>";
  return '<div class="ssc">' + top + warn + will + cam + '<div class="ssc-bot"><div id="scanRes">' + scanBigHtml() + "</div>" +
    '<div class="ssc-acts"><button type="button" class="ax-button ax-button-weak" onclick="sscMine()">내 QR</button>' + sreqLnk() + "</div>" + log + "</div></div>";
}
/* 그린 뒤 · 카메라를 새 video 에 다시 붙이거나 켠다(App.render 가 video 를 새로 만든다) */
function sscMount() {
  if (App.current !== "sscan") return;
  sscWake(true);
  var sp = scanSpot(SCAN.spot), v = el("qrVideo");
  if (!sp || !v || !qrScanSupported() || SSC.camErr) return;
  var st = QRS.stream, dead = st && st.getVideoTracks && st.getVideoTracks().some(function (t) { return t.readyState === "ended"; });
  if (dead) { qrCamStop(); st = null; }
  if (st) {
    if (v.srcObject !== st) { v.srcObject = st; var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); }
    if (!QRS.timer && !QRS.hold) QRS.timer = setInterval(qrScanTick, 120);
    return;
  }
  if (SSC.starting) return;
  SCAN.on = true; SSC.starting = true;
  setTimeout(function () { SSC.starting = false; if (App.current === "sscan" && SCAN.on && !QRS.stream && el("qrVideo")) qrCamStart(); }, 40);
}
function sscCamGo() { SSC.camErr = false; if (sscSndOn()) sfxUnlock(); App.render(); }
function sscLeave() { scanStop(); SSC.starting = false; sscWake(false); }
function sscWake(on) {
  if (!on) { var l = SSC.wl; SSC.wl = null; if (l) { try { var p = l.release(); if (p && p.catch) p.catch(function () {}); } catch (e) {} } return; }
  if (SSC.wl || SSC.wlReq || document.hidden || App.current !== "sscan") return;
  try {
    if (!navigator.wakeLock || typeof navigator.wakeLock.request !== "function") return;
    SSC.wlReq = true;
    navigator.wakeLock.request("screen").then(function (l) {
      SSC.wlReq = false;
      if (App.current !== "sscan") { try { var p = l.release(); if (p && p.catch) p.catch(function () {}); } catch (e) {} return; }
      SSC.wl = l;
      try { l.addEventListener("release", function () { if (SSC.wl === l) SSC.wl = null; }); } catch (e) {}
    }, function () { SSC.wlReq = false; });
  } catch (e) { SSC.wlReq = false; }
}
document.addEventListener("visibilitychange", function () { if (!document.hidden && App.current === "sscan") sscMount(); });
/* 톱니 · 자리 칩 = 자리 고르기 시트 · 1F 자리 → 10F 세션(v6.00 SCAN_10F_UI 일 때만 · 사용자 261006 밤 「10층은 출석 확인 없다」) · 아래에 소리 · 내 QR · 관리자 모드 화면 */
function sscSheetBody() {
  var cur = SCAN.spot, cs = sscSub(), tile = function (sp, sub, lb) {
    var on = sp.id === cur && (!sub || (cs && cs[0] === sub));
    return '<button type="button" class="axs-stile ssc-pick' + (on ? " on" : "") + '" aria-pressed="' + on + '" onclick="sscPick(\'' + sp.id + "', '" + sub + '\')"><b>' + esc(lb) + "</b><span>" + esc(sp.will || sp.nm) + "</span></button>";
  };
  var one = [], ten = [];
  scanTileIds().forEach(function (id) {
    if (id === "sess") { if (SCAN_10F_UI) SCAN_SPOTS.filter(function (x) { return x.kind === "sess"; }).forEach(function (sp) { ten.push(tile(sp, "", sp.lb || sp.nm)); }); return; }   /* v6.00 10층은 출석 확인 없음(SCAN_10F_UI) */
    var sp = scanSpot(id); if (!sp) return;
    if (SSC_SUB[id]) SSC_SUB[id].forEach(function (u) { one.push(tile(sp, u[0], sp.nm + " · " + u[1])); });
    else one.push(tile(sp, "", sp.lb || sp.nm));
  });
  var snd = sscSndOn();
  return '<div class="axs-stiles ssc-picks">' + one.join("") + "</div>" + (ten.length ? '<h3 class="ax-meta ssc-h">10F 세션 입장</h3><div class="axs-stiles ssc-picks">' + ten.join("") + "</div>" : "") +
    '<div class="ssc-opts"><button type="button" class="ssc-opt" aria-pressed="' + snd + '" onclick="sscSnd()"><span>스캔 소리</span><b>' + (snd ? "켬" : "끔") + "</b></button>" +
    '<button type="button" class="ssc-opt" onclick="sheetClose(true); sscMine()"><span>내 QR 보여주기</span>' + CHEV_SVG + "</button>" +
    '<button type="button" class="ssc-opt" onclick="sheetClose(true); App.go(\'admin\')"><span>관리자 모드</span>' + CHEV_SVG + "</button></div>";
}
function sscSheet() { sheetOpen({ id: "sscspot", title: "어디서 찍나요?", lead: "고른 자리는 이 폰에 기억해요", body: sscSheetBody(), go: "sheetClose()", goLbl: "닫기" }); }
function sscPick(id, sub) {
  if (!scanSpot(id)) return;
  S.set("scan_sub", sub || "");
  sheetClose(true);
  SSC.camErr = false; SCAN.res = null; SSC.band = null;
  scanPick(id);   /* 기억 · 중복 가드 해제 · 다시 그림 → sscMount 가 카메라를 켠다 */
}
function sscSnd() { var on = !sscSndOn(); S.set("ssc_snd", on); if (on) { sfxUnlock(); sscSfx("ting"); } if (SHEET.id === "sscspot" && el("axsSheet")) { SHEET.spec.body = sscSheetBody(); sheetPaint(); } }

/* ── ② 혼잡 제보 · v4.71 (260930 사용자 확정 · 「혼잡도 제보 기획.md」 권장안) ──
 * 대상 두 곳(엘리베이터 = 1F 승강기 홀 상행 대기 · 1F 로비) · 붐빌 때만 [혼잡 제보] → [재확인](15분 다시) · [해소](바로 끝) · 15분 뒤 저절로 꺼진다(서버 시각).
 * 예상 창 시간대(시작 5분 전 ~ 끝)에는 엘리베이터 카드에 「확인 시간」 칩 · 다른 스태프가 누른 상태도 sync(crowd)로 보인다.
 * 전송 실패는 자동으로 다시 보내지 않는다(늦게 닿은 제보가 해소 뒤에 되살아나지 않게) · 옛 서버(crowd_set 없음)는 한 줄 안내. */
var CROWD_T = [
  { id: "elev", k: "e", nm: "엘리베이터", std: "1F 승강기 홀 · 5대 이상 보내야 탈 수 있음" },
  { id: "lobby", k: "l", nm: "1F 로비", std: "통로에서 걸음이 멈춤" }
];
var CRW = { busy: "", t: null };
function crowdName(id) { var x = CROWD_T.filter(function (c) { return c.id === id; })[0]; return x ? x.nm : id; }
function crowdNow() { return Date.now() + (typeof sesOff === "function" ? sesOff() : 0); }   /* 서버 시계 기준(v4.67 toff) */
function crowdGet() { var c = S.get("crowd", null); return c && typeof c === "object" ? c : null; }
/* 지금 혼잡 제보 중이면 { at, x } · 끝 시각(x)이 지났으면 없음(앱이 서버를 기다리지 않고 끈다) */
function crowdJam(k) { var c = crowdGet(), x = c && c[k]; return x && x.at > 0 && x.x > crowdNow() ? x : null; }
function crowdStore(c) {
  if (!c || typeof c !== "object") return;
  var h = c.h && typeof c.h === "object" && c.h.id ? { id: String(c.h.id), n: Number(c.h.n) || 0, lv: String(c.h.lv || ""), seats: Number(c.h.seats) || 0 } : 0;   /* v5.68 17F 대강당 = 현장 입장 수 ÷ 좌석(서버 hallNow_ · 강의 시간 창 안에서만 · 옛 서버는 없음) */
  var v = { l: c.l || 0, e: c.e || 0, p: String(c.p || ""), w: String(c.w || ""), st: c.st ? 1 : 0, h: h, n: c.n && typeof c.n === "object" ? c.n : 0 };   /* 261008 지금 현장(n) */
  if (JSON.stringify(v) !== JSON.stringify(crowdGet())) S.set("crowd", v);
}
function crowdWin(s) { return String(s || "").replace("-", "~"); }
function crowdHm(t) { var d = new Date(t), p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getHours()) + ":" + p(d.getMinutes()); }
function admCrowdHtml() {
  var c = crowdGet() || {};
  if (CRW.t) clearTimeout(CRW.t);
  CRW.t = setTimeout(function () { CRW.t = null; if (App.current === "admin" && el("admCrowd")) App.render(); }, 30000);   /* 「N분 남음」 · 끝나면 저절로 「제보 없음」 */
  return '<div id="admCrowd" class="ax-stack">' + CROWD_T.map(function (t) {
    var j = crowdJam(t.k), busy = CRW.busy === t.id ? " disabled" : "";
    var left = j ? Math.max(1, Math.ceil((j.x - crowdNow()) / 60000)) : 0;
    var chip = t.id === "elev" && c.w ? '<span class="axs-chip">확인 시간 ' + esc(crowdWin(c.w)) + "</span>" : "";
    var btn = j
      ? '<div class="axs-crbtn"><button type="button" class="ax-button ax-button-weak"' + busy + " onclick=\"crowdSend('" + t.id + "', 're')\">재확인</button>" +
        '<button type="button" class="ax-button ax-button-weak"' + busy + " onclick=\"crowdSend('" + t.id + "', 'clear')\">해소</button></div>"
      : '<button type="button" class="ax-button axs-crgo"' + busy + " onclick=\"crowdSend('" + t.id + "', 'jam')\">혼잡 제보</button>";
    return '<section class="ax-card ax-stack-tight axs-gap12 axs-crowd' + (j ? " on" : "") + '">' +
      '<div class="ax-row"><h2 class="ax-card-title">' + t.nm + '</h2><span class="axs-crst' + (j ? " bad" : "") + '">' + (j ? "혼잡 · " + left + "분 남음" : "제보 없음") + "</span></div>" +
      '<p class="ax-meta">' + t.std + "</p>" + (chip ? '<div class="axs-chiprow">' + chip + "</div>" : "") + btn + "</section>";
  }).join("") + "</div>";
}
function crowdSend(t, a) {
  if (!BE.on) { toast("서버에 연결되지 않아 기록되지 않아요"); return; }
  if (CRW.busy) return;
  CRW.busy = t; App.render();
  admCall(admA({ action: "crowd_set", tgt: t, act: a }), function (res) {
    CRW.busy = "";
    if (res && res.reason === "auth") { admAuthLost(); return; }
    if (!res || !res.ok) {
      toast(res && res.reason === "locked" ? admLockedMsg(res) : res && /unknown action/.test(String(res.err || "")) ? "이 서버는 아직 혼잡 제보를 받지 않아요" : "전송 실패 · 다시 눌러주세요");
      App.render();
      return;
    }
    if (res.crowd) crowdStore(res.crowd);
    toast(crowdName(t) + " · " + ({ jam: "혼잡", re: "재확인", clear: "해소" })[a]);
    App.render();
  }, function () { CRW.busy = ""; toast("전송 실패 · 다시 눌러주세요"); App.render(); });
}
/* ════════ 261008 「지금 현장」 스태프 제보 (사용자 결정 261008 · 기획 `디자인 시안/혼잡도 재설계 261008/기획안.md` 6장) ════════
 * 진입 = 홈 2×2 칸(앱 스태프 명단 사번 · staffBtn) · 스캔 화면 자리 칩 옆 「줄」(룰렛 · AX PLAY 자리) · 관리자 모드로 또 들어가지 않는다
 *   이 폰에서 코드를 아직 안 넣었으면 처음 한 번만(sscCodeAsk · 이어서 이 시트) · 등급코드 · 관리코드 · 사람 토큰 모두 된다(서버 gradeAuth_)
 * 시트 = 숫자 5단추(룰렛 · 포토부스 0 · 5 · 10 · 15 · 20+ / AX PLAY 0 · 2 · 4 · 6 · 8+) · 17F = 5단계 세로 한 줄(엄지 · 단계마다 보고 누르는 기준 작은 글씨)
 *   누르는 순간 저장(확인 단추 없음 · crowd_rep set) · 시트가 닫히고 5초 「저장됨 · 되돌리기」 · 시트 안 「되돌리기」(2분 안) | 「자동으로」(제보 지움)
 *   전송 실패 = 「전송 실패 · 다시 눌러주세요」 · 자동 재전송 없음(늦게 닿은 값이 되살아나지 않게)
 * 처리 시간 재기(룰렛 · 포토부스 · AX PLAY) = 「시작」 → 시트가 닫혀도 아래 칩 「재는 중 · 12초 · 끝」 → 「끝」 = crowd_cal 한 건(5초 미만 · 300초 넘음은 버린다) */
var CN_NM = { r: "1F 룰렛", p: "1F 포토부스", a: "1F AX PLAY", h: "17F 대강당" };
var CN_VS = { r: [0, 5, 10, 15, 20], p: [0, 5, 10, 15, 20], a: [0, 2, 4, 6, 8] };
var CN_HSTD = ["", "30% 이하", "절반쯤", "70%쯤", "90%쯤 · 띄엄띄엄 빈자리", "빈자리 없음 · 서서 듣는 사람"];
var CNS = { k: "", busy: false, ut: {}, last: {}, sw: null, swT: null, undoT: null };
function cnNow() { return Date.now() + (typeof sesOff === "function" ? sesOff() : 0); }
function cnAuthed() { return !!(admTok() || admKey()); }
function cnSheet(k) {
  if (!CN_NM[k]) return;
  if (!BE.on) { toast("서버에 연결되지 않아 기록되지 않아요"); return; }
  if (!cnAuthed()) { SSC_CK.then = function () { cnSheet(k); }; sscCodeAsk(); return; }
  CNS.k = k;
  sheetOpen(cnSpec(k));
}
function cnSpec(k) { return { id: "cn", title: k === "h" ? "17F 대강당 · 자리" : k === "a" ? "1F AX PLAY · 기다리는 사람" : CN_NM[k] + " · 줄 몇 명?", body: cnBody(k), noGo: true }; }
function cnRepaint() { if (SHEET.id === "cn" && SHEET.spec && el("axsSheet")) { SHEET.spec.body = cnBody(CNS.k); sheetPaint(); } }
function cnBody(k) {
  var x = cnCell(k), n = cnGet() || {}, now = cnNow(), ut = CNS.ut[k] > now, dis = CNS.busy ? " disabled" : "";
  var cur = x.cls === " none" ? "정보 없음" : x.st + (x.sub ? " · " + x.sub : "");
  var head = '<p class="cn-now">지금 <b>' + esc(cur) + "</b></p>";
  var pad;
  if (k === "h") {
    pad = '<div class="cn-lv" role="group" aria-label="17F 대강당 자리">' + [1, 2, 3, 4, 5].map(function (v) {
      return '<button type="button" class="cn-lv' + v + '"' + dis + ' onclick="cnSend(\'h\', ' + v + ')"><b>' + CN_HLV[v] + "</b><span>" + CN_HSTD[v] + "</span></button>";
    }).join("") + "</div>";
  } else {
    pad = '<div class="cn-num" role="group" aria-label="' + CN_NM[k] + (k === "a" ? " 기다리는 사람" : " 줄 인원") + '">' + CN_VS[k].map(function (v, i) {
      return '<button type="button"' + dis + ' onclick="cnSend(\'' + k + '\', ' + v + ')">' + v + (i === 4 ? "+" : "") + "</button>";
    }).join("") + "</div>";
  }
  var lr = CNS.last[k], sx = n[k] && typeof n[k] === "object" ? n[k] : null;
  var who = lr && lr.at > now - 900000 ? "제보 " + crowdHm(lr.at) + " · " + lr.txt : !sx ? "제보 없음" : sx.s === "q" ? "입장 QR 하한 · 제보 없음" : sx.s === "a" ? "룰렛 스캔 기록 · 자동" : "제보 " + crowdHm(sx.at);
  var foot = '<div class="cn-row"><span>' + esc(who) + "</span>" +
    (ut ? '<button type="button"' + dis + ' onclick="cnUndo(\'' + k + '\')">되돌리기</button>' : '<button type="button"' + dis + ' onclick="cnAuto(\'' + k + '\')">자동으로</button>') + "</div>";
  var sw = "";
  if (k !== "h") {
    var c = n.cal && n.cal[k], run = CNS.sw && CNS.sw.k === k;
    sw = '<div class="cn-row"><span>처리 시간 ' + (c ? c[0] + "초 · 오늘 재기 " + c[1] : "사전값") + "</span></div>" +
      '<button type="button" class="cn-swgo' + (run ? " rec" : "") + '" onclick="' + (run ? "cnSwEnd()" : "cnSwStart('" + k + "')") + '">' + (run ? "끝 · " + cnSwSec() + "초" : "시간 재기 시작") + "</button>";
  }
  return head + pad + foot + sw;
}
function cnValTxt(k, v) { return k === "h" ? CN_HLV[v] : (k === "a" ? "기다림 " : "줄 ") + v + (v === CN_VS[k][4] ? "+" : "") + "명"; }
function cnCall(q, ok) {
  if (CNS.busy) return;
  CNS.busy = true; cnRepaint();
  admCall(admA(q), function (res) {
    CNS.busy = false;
    if (res && res.reason === "auth") { sheetClose(true); admAuthLost(); return; }
    if (!res || !res.ok) {
      toast(res && res.reason === "locked" ? admLockedMsg(res) : res && res.reason === "late" ? "되돌릴 수 있는 시간이 지났어요" : res && /unknown action/.test(String(res.err || "")) ? "이 서버는 아직 지금 현장 제보를 받지 않아요" : "전송 실패 · 다시 눌러주세요");
      if (res && res.crowd) crowdStore(res.crowd);
      cnRepaint(); return;
    }
    if (res.crowd) crowdStore(res.crowd);
    ok(res);
  }, function () { CNS.busy = false; toast("전송 실패 · 다시 눌러주세요"); cnRepaint(); });
}
function cnSend(k, v) {
  cnCall({ action: "crowd_rep", tgt: k, v: v, op: "set" }, function (res) {
    var now = cnNow();
    CNS.ut[k] = res.ut || now + 120000; CNS.last[k] = { at: now, txt: cnValTxt(k, v) };
    sheetClose(true);
    cnUndoBar(k, CN_NM[k] + " · " + cnValTxt(k, v) + " · 저장됨");
  });
}
function cnUndo(k) {
  cnCall({ action: "crowd_rep", tgt: k, op: "undo" }, function () { CNS.ut[k] = 0; CNS.last[k] = null; cnUndoBarOff(); toast(CN_NM[k] + " · 되돌렸어요"); cnRepaint(); });
}
function cnAuto(k) {
  cnCall({ action: "crowd_rep", tgt: k, op: "auto" }, function (res) { CNS.ut[k] = res.ut || cnNow() + 120000; CNS.last[k] = null; toast(CN_NM[k] + " · 자동으로"); cnRepaint(); });
}
/* 저장 직후 5초 · 화면 아래 한 줄 + 「되돌리기」 */
function cnUndoBar(k, msg) {
  cnUndoBarOff();
  var b = document.createElement("div");
  b.id = "cnUndo"; b.className = "cn-undo"; b.setAttribute("role", "status");
  b.innerHTML = "<span>" + esc(msg) + '</span><button type="button" onclick="cnUndo(\'' + k + '\')">되돌리기</button>';
  el("frame").appendChild(b);
  CNS.undoT = setTimeout(cnUndoBarOff, 5000);
}
function cnUndoBarOff() { if (CNS.undoT) { clearTimeout(CNS.undoT); CNS.undoT = null; } var b = el("cnUndo"); if (b && b.parentNode) b.parentNode.removeChild(b); }
/* 처리 시간 재기 · 시작 → 떠 있는 칩 → 끝 */
function cnSwSec() { return CNS.sw ? Math.max(0, Math.round((Date.now() - CNS.sw.t0) / 1000)) : 0; }
function cnSwStart(k) {
  CNS.sw = { k: k, t0: Date.now() };
  sheetClose(true);
  cnSwPaint();
  if (CNS.swT) clearInterval(CNS.swT);
  CNS.swT = setInterval(cnSwPaint, 1000);
}
function cnSwPaint() {
  var c = el("cnSw");
  if (!CNS.sw) { if (c && c.parentNode) c.parentNode.removeChild(c); return; }
  if (!c) { c = document.createElement("div"); c.id = "cnSw"; c.className = "cn-sw"; c.setAttribute("role", "status"); el("frame").appendChild(c); }
  c.innerHTML = "<span>" + esc(CN_NM[CNS.sw.k]) + " · 재는 중 <b>" + cnSwSec() + '초</b></span><button type="button" class="x" onclick="cnSwStop()" aria-label="재기 취소">' + X_SVG + '</button><button type="button" class="go" onclick="cnSwEnd()">끝</button>';
  if (SHEET.id === "cn") cnRepaint();
}
function cnSwStop() { if (CNS.swT) clearInterval(CNS.swT); CNS.swT = null; CNS.sw = null; cnSwPaint(); cnRepaint(); }
function cnSwEnd() {
  if (!CNS.sw) return;
  var k = CNS.sw.k, sec = cnSwSec();
  cnSwStop();
  if (sec < 5 || sec > 300) { toast("5초 ~ 300초만 기록해요 · 다시 재 주세요"); return; }
  cnCall({ action: "crowd_cal", tgt: k, sec: sec }, function (res) { toast(CN_NM[k] + " · " + sec + "초 기록 · 오늘 " + ((res.cal && res.cal.k) || 1) + "건"); cnRepaint(); });
}
function cnAdmNote() { return '<section class="ax-card ax-stack-tight axs-gap12"><h2 class="ax-card-title">지금 현장 제보</h2><p class="ax-meta">홈 「지금 현장」 칸을 눌러 제보해요</p><button type="button" class="ax-button" onclick="App.go(\'home\')">홈으로</button></section>'; }
function sscCnBtn(sp) {
  var k = sp && sp.id === "roulette" ? "r" : sp && sp.id === "p2" ? "a" : "";
  if (!k) return "";
  var n = cnGet() || {}, dot = String(n.dot || "").indexOf(k) >= 0;
  return '<button type="button" class="ssc-q" onclick="cnSheet(\'' + k + '\')" aria-label="' + CN_NM[k] + ' 줄 제보">줄' + (dot ? '<i class="cn-dot" aria-hidden="true"></i>' : "") + "</button>";
}



