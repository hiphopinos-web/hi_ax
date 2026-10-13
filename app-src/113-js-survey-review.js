/* ═══ 261014 (사용자 확정) 참가자 설문 검토용 미리보기 · survey-review/ 가 index.html?svreview=1 을 연다 ═══
   설문 고도화 작업자가 로그인 없이 끝까지 반복해 보고 화면마다 의견을 남긴다 · 의견은 서버 「설문검토」 시트(sv_review_add) · 콘솔 기록 › 숫자 · 설문 › 설문 맨 아래 「검토 의견」
   화면 · 전환 · 자동 넘김 · 문항 필터 = 앱 설문 코드 그대로(Views.survey · svFlow · svChoose · svSubmit 의 시험 모드 길) · 앱 설문을 고치면 여기에도 그대로 보인다
   이 기기 저장소를 쓰지 않는다(#demo 와 같은 LS_OK false · 메모리) · 서버 주소는 의견 저장에만 쓰고 앱 쪽은 끊는다(GAS_URL 빈 값 · BE.on false = 제출 · 스탬프 · 동기화 · 접속 기록 호출 0)
   열림 = survey_force(시험 모드) · 스탬프 lg 하나(잠금 풀림) · 완료 화면 = 전체 의견 칸 + 「처음부터 다시」 · Q2-0 미리 체크 = 기본 끔 · 첫 화면 · Q2-0 화면의 전환으로 예시를 켠다
   위 띠(고정) 「검토용 미리보기 · 답은 저장되지 않습니다」 + 「이 화면 의견」(바텀 시트 · 화면 id · 문항 글 자동) · 이름은 선택 · 이 기기에 기억(axsvr_name · 앱 저장소 axf_ 와 따로)
   참가자 앱은 주소에 svreview 가 없으면 이 코드가 아무것도 하지 않는다 */
var SVR = { on: false, url: "", pre: false, busy: false, txt: "", all: "", scr: null };
var SVR_PRE = ["q2_5", "q2_6", "q2_8"];   /* 미리 체크 예시 = 참석 기록이 남는 프로그램 셋(AX 라운지 · 17F AWS · AX 커피챗) */
var SVR_MAX = 500, SVR_NAME = 20;
function svrMode() { return /[?&]svreview(=|&|$)/.test(location.search); }
function svrLs(k, v) {
  try { if (v === undefined) return localStorage.getItem(k) || ""; localStorage.setItem(k, v); } catch (e) {}
  return "";
}
function svrName() { return SVR.name != null ? SVR.name : (SVR.name = svrLs("axsvr_name").slice(0, SVR_NAME)); }
function svrDid() {
  var d = svrLs("axsvr_did");
  if (!/^[a-z0-9]{8,32}$/.test(d)) { d = ""; for (var i = 0; i < 16; i++) d += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 36)); svrLs("axsvr_did", d); }
  return d;
}
function svrDev() {
  var u = navigator.userAgent || "";
  var os = /iPhone|iPad|iPod/.test(u) ? "iOS" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows" : /Mac OS X/.test(u) ? "Mac" : "기타";
  var br = /KAKAOTALK/i.test(u) ? "카카오톡" : /NAVER\(/.test(u) ? "네이버" : /SamsungBrowser/.test(u) ? "삼성 인터넷" : /Whale/.test(u) ? "웨일" : /Edg\//.test(u) ? "Edge" : /CriOS|Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "기타";
  var fr = false; try { fr = window.top !== window; } catch (e) { fr = true; }
  return os + " · " + br + " · " + window.innerWidth + "px" + (fr ? " · PC 틀" : "");
}
/* 지금 화면 · id 와 글(첫 화면 · 안내 = 제목 · 문항 = 질문 · 완료 = 감사 제목) */
function svrScreen() {
  if (surveyDone()) return { id: "done", q: SURVEY_DONE.t };
  var d = svDraft(), fl = svFlow(d), q = fl[svCur(d, fl)] || SURVEY_Q[0];
  return { id: q.id, q: q.type === "intro" || q.type === "info" ? q.t : q.q };
}
function svrLbl(id) { return /^q\d/.test(id) ? id.toUpperCase().replace("_", "-") : ({ intro: "첫 화면", i_prog: "안내", i_und: "안내", done: "완료 화면", all: "전체 의견" })[id] || id; }
function svrCall(p, done, fail) {
  if (!SVR.url) { if (fail) fail("offline"); return; }
  var g = GAS_URL; GAS_URL = SVR.url;
  try { beCall(p, done, fail); } finally { GAS_URL = g; }
}
function svrNameHtml(id) {
  return '<input type="text" id="' + id + '" class="ax-field svr-nm" maxlength="' + SVR_NAME + '" autocomplete="off" placeholder="이름(선택)" aria-label="이름(선택)" value="' + esc(svrName()) + '" oninput="SVR.name=this.value">';
}
function svrCnt(id, n) { return '<p class="ax-meta axs-svcnt"><span id="' + id + '">' + n + "</span> / " + SVR_MAX + "</p>"; }
function svrSheetBody() {
  var sc = SVR.scr || svrScreen();
  return '<div class="ax-stack-tight axs-gap12">' +
    '<p class="ax-meta svr-where">' + esc(svrLbl(sc.id)) + " · " + esc(sc.q) + "</p>" +
    '<textarea id="svrTx" class="ax-field axs-ta" rows="4" maxlength="' + SVR_MAX + '" placeholder="이 화면에서 고칠 점" aria-label="이 화면 의견" oninput="SVR.txt=this.value; var c=el(\'svrCn\'); if (c) c.textContent=this.value.length">' + esc(SVR.txt) + "</textarea>" +
    svrCnt("svrCn", SVR.txt.length) + svrNameHtml("svrNm") + "</div>";
}
function svrOpen() {
  if (!SVR.on || SVR.busy) return;
  var sc = svrScreen();
  if (!SVR.scr || SVR.scr.id !== sc.id) SVR.txt = "";   /* 다른 화면으로 옮겼으면 쓰던 글을 비운다 · 같은 화면에서 닫았다 열면 그대로 */
  SVR.scr = sc;
  sheetOpen({ id: "svr", title: "이 화면 의견", body: svrSheetBody(), go: "svrSend('scr')", goLbl: "보내기", goBusy: "보내는 중", back: "svrFb" });
  setTimeout(function () { var t = el("svrTx"); if (t) try { t.focus(); } catch (e) {} }, 320);
}
var SVR_WHY = { rate: "10분에 30건까지 보낼 수 있어요. 잠시 뒤 다시 보내 주세요.", dup: "같은 의견이 이미 저장돼 있어요", long: "500자까지 쓸 수 있어요", empty: "의견을 써 주세요", full: "의견 칸이 가득 찼어요. 운영자에게 알려 주세요." };
function svrSend(kind) {
  var all = kind === "all", t = String(all ? SVR.all : SVR.txt).trim();
  if (SVR.busy) return;
  if (!t) { toast("의견을 써 주세요"); return; }
  var sc = all ? { id: "all", q: "전체 의견" } : (SVR.scr || svrScreen()), nm = String(svrName() || "").trim().slice(0, SVR_NAME);
  svrLs("axsvr_name", nm); SVR.name = nm;
  SVR.busy = true;
  if (all) App.render(); else { SHEET.spec.body = svrSheetBody(); sheetBusy(true); }
  var end = function (msg) {
    SVR.busy = false;
    if (!msg) {
      if (all) { SVR.all = ""; App.render(); } else { SVR.txt = ""; sheetClose(true); }
      toast("저장됨"); return;
    }
    if (all) { App.render(); toast(msg); } else { SHEET.spec.body = svrSheetBody(); sheetFail(msg); }
  };
  svrCall({ action: "sv_review_add", nm: nm, sid: sc.id, q: String(sc.q || "").slice(0, 80), txt: t, ver: APP_VER, dev: svrDev(), did: svrDid() }, function (res) {
    end(res && res.ok ? "" : (res && SVR_WHY[res.reason]) || "보내지 못했어요. 다시 눌러 주세요.");
  }, function () { end("서버에 연결할 수 없어요. 다시 눌러 주세요."); });
}
/* Q2-0 미리 체크 예시 · 켜고 끄면 아직 손대지 않은 Q2-0 답(지금 예시 그대로)만 바꾼다 */
function svrPreHtml() {
  return '<div class="svr-pre"><span>Q2-0 미리 체크 예시<small>참석 기록이 있는 사람 화면</small><small>AX 라운지 · Agentic AI · AX 커피챗</small></span>' +
    '<button type="button" class="svr-sw" role="switch" aria-checked="' + SVR.pre + '" onclick="svrPreToggle()">' + (SVR.pre ? "켬" : "끔") + "</button></div>";
}
function svrPreToggle() {
  var old = SVR.pre ? SVR_PRE.slice() : [];
  SVR.pre = !SVR.pre;
  var d = svDraft(), cur = d.a.q2_0;
  if (Array.isArray(cur) && JSON.stringify(cur) === JSON.stringify(old)) {
    d.a.q2_0 = SVR.pre ? SVR_PRE.slice() : [];
    SV_PROGS.forEach(function (p) { if (d.a.q2_0.indexOf(p.id) < 0) delete d.a[p.id]; });
    svSave(d);
  }
  App.render();
}
function svrDoneHtml() {
  return '<section class="ax-card svr-done" aria-labelledby="svrAllT"><div class="ax-stack-tight axs-gap12">' +
    '<h2 class="ax-section-title" id="svrAllT">전체 의견</h2>' +
    '<textarea id="svrAll" class="ax-field axs-ta" rows="5" maxlength="' + SVR_MAX + '" placeholder="설문 전체에 대한 의견" aria-label="전체 의견" oninput="SVR.all=this.value; var c=el(\'svrAllCn\'); if (c) c.textContent=this.value.length"' + (SVR.busy ? " disabled" : "") + ">" + esc(SVR.all) + "</textarea>" +
    svrCnt("svrAllCn", SVR.all.length) + svrNameHtml("svrNmAll") +
    '<button type="button" class="ax-button" onclick="svrSend(\'all\')"' + (SVR.busy ? ' disabled aria-busy="true"' : "") + ">" + (SVR.busy ? "보내는 중" : "의견 보내기") + "</button></div></section>" +
    '<div class="ax-bottom axs-fix"><button type="button" class="ax-button ax-button-weak" onclick="svrRestart()">처음부터 다시</button></div>';
}
function svrSeed() {
  S.set("stamps", ["lg"]); S.set("pp_seen", ["lg"]);
  S.set("survey_done", false); S.set("survey_draft", null); S.del("survey_mine");
}
function svrRestart() {
  if (SVR.busy) return;
  clearTimeout(SV.adv); SV.pend = 0; SV.busy = false;
  if (typeof testOverlayDrop === "function") testOverlayDrop(null);
  svrSeed(); SVR.all = ""; SVR.txt = ""; SVR.scr = null;
  App.render(); window.scrollTo(0, 0); AXM.rise(el("svQ"));
}
function svrCss() {
  var st = document.createElement("style"); st.id = "svrCss";
  st.textContent =
    "html.axsvr { scrollbar-width: none; } html.axsvr::-webkit-scrollbar { display: none; }" +   /* PC 390 틀 안에서 스크롤 막대가 폭을 먹지 않게(폰은 원래 겹치는 막대) */
    ".axsvr #app { padding-top: 36px; }" +
    ".axsvr #topbar.ax-header { top: 36px; }" +
    ".svr-band { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: var(--ax-app-max); height: 36px; z-index: 45; box-sizing: border-box; display: flex; align-items: center; gap: 8px; padding: 0 10px 0 16px; background: var(--ax-color-ink); color: #fff; font: 600 12px/1.2 var(--disp); }" +
    ".svr-band .t { flex: 1; min-width: 0; white-space: nowrap; }" +
    ".svr-fb { flex: none; height: 28px; padding: 0 12px; border: 1px solid rgba(255,255,255,0.6); border-radius: 14px; background: transparent; color: #fff; font: 700 12px/1 var(--disp); cursor: pointer; }" +
    ".svr-fb:active { background: rgba(255,255,255,0.16); }" +
    ".svr-pre { display: flex; align-items: center; gap: 12px; margin: 0 0 16px; padding: 10px 12px; border: 1px dashed var(--axs-divider-strong); border-radius: 12px; color: var(--ax-color-ink); font: 600 13px/1.4 var(--disp); }" +
    ".svr-pre span { flex: 1; min-width: 0; }" +
    ".svr-pre small { display: block; margin-top: 1px; color: var(--ax-color-muted); font: 500 12px/1.4 var(--disp); word-break: keep-all; }" +
    ".svr-sw { flex: none; min-width: 52px; height: 32px; border-radius: 16px; border: 1px solid var(--axs-divider-strong); background: var(--ax-color-surface); color: var(--ax-color-ink); font: 700 13px/1 var(--disp); cursor: pointer; }" +
    ".svr-sw[aria-checked=\"true\"] { background: var(--ax-color-ink); border-color: var(--ax-color-ink); color: #fff; }" +
    ".svr-done { margin-top: 24px; }" +
    ".svr-nm { width: 100%; box-sizing: border-box; }" +
    ".svr-where { word-break: keep-all; }";
  document.head.appendChild(st);
}
/* 부팅 · 127 의 스플래시 분기에서 부른다(#demo 와 같은 자리 · 같은 방식) */
function svrBoot(splash) {
  SVR.on = true; SVR.url = GAS_URL;
  LS_OK = false; GAS_URL = ""; BE.on = false;   /* 앱 저장소 · 앱 서버 호출 끊기 · 의견만 svrCall 이 SVR.url 로 */
  document.documentElement.classList.add("axsvr");
  svrCss();
  stampVerSet(2);
  svrSeed();
  S.set("survey_force", true);   /* 시험 모드 열림(시각 · 클로즈베타 무관) */
  var pre0 = svPreIds;
  svPreIds = function () { return SVR.on ? (SVR.pre ? SVR_PRE.slice() : []) : pre0(); };
  var v0 = Views.survey;
  Views.survey = function () {
    var h = v0.apply(this, arguments);
    if (surveyDone()) return h + svrDoneHtml();
    var d = svDraft(), fl = svFlow(d), q = fl[svCur(d, fl)];
    return (q && (q.type === "intro" || q.id === "q2_0") ? svrPreHtml() : "") + h;
  };
  var go0 = App.go;
  App.go = function (v, isBack) {
    if (v !== "survey") { toast("검토용 미리보기는 설문 화면만 열려요"); return; }
    return go0.call(App, v, isBack);
  };
  var bd = document.createElement("div");
  bd.className = "svr-band"; bd.setAttribute("role", "note");
  bd.innerHTML = '<span class="t">검토용 미리보기 · 답은 저장되지 않습니다</span><button type="button" class="svr-fb" id="svrFb" onclick="svrOpen()">이 화면 의견</button>';
  el("frame").appendChild(bd);
  splash.classList.add("gone");
  el("frame").classList.remove("splash-mode");
  el("app").hidden = false;
  App.go("survey");
}
