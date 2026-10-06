/* ════════ v4.15 폰 관리자 모드 3화면 (사용자 확정 260922) ════════
 * 현장 담당자가 서서 폰으로 하는 것만 남긴다: ① 스캔 ② 존 혼잡도 ③ 내 담당 명단.
 * v35 의 13탭 2단 메뉴(스태프 9 + 통제센터 4)와 옛 로컬 목업(상담 · 커피챗 · 아이디어 · 퀴즈 문항 · 대시보드 숫자)은 지웠다.
 * 등급코드(role grade)로 들어오면 혼잡도만 보인다(서버도 다른 액션을 auth 로 막는다). */
/* v4.71 (260930 사용자 결정) 폰 관리자 모드 = 「QR 스캔」 · 「혼잡 제보」 두 개만 · 크고 쉽게.
 * 옛 「혼잡도」(층 · 존 3단 · admZoneHtml)와 「담당 명단」(admListHtml)은 코드를 두고 진입만 뺐다(명단 · 노쇼 표시는 콘솔 신청 › 담당 명단).
 * 등급코드(role grade)로 들어오면 혼잡 제보만 보인다(서버도 다른 액션을 auth 로 막는다). */
var ADM_TABS = [["scan", "QR 스캔"], ["crowd", "혼잡 제보"]];
function admTab(t) { scanStop(); S.set("adm_tab", t); App.render(); window.scrollTo(0, 0); }
function admHtml() {
  var grade = admRole() === "grade";
  var tab = grade ? "crowd" : S.get("adm_tab", "scan");
  var fn = { scan: admScanHtml, crowd: admCrowdHtml };
  if (!fn[tab]) tab = "scan";
  var seg = grade ? '<p class="ax-meta">등급 담당 · 혼잡 제보만 할 수 있어요</p>' :
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
var INV_LNK = '<button type="button" class="ax-link axs-plain axs-invlk" onclick="invBoxOpen()">재고 · 박스 열기</button>';   /* v5.34 스캔 화면 맨 아래 작은 링크(타일 · 탭 아님) */
function admScanHtml() {
  var sp = scanSpot(SCAN.spot), log = '<section class="ax-stack-tight axs-gap12"><h2 class="ax-meta">최근 스캔</h2><div class="ax-card axs-slog" id="scanLog">' + scanLogHtml() + "</div></section>";
  if (!sp || SCAN.pick) {
    if (SCAN.sub === "sess") {
      return '<div class="axs-srow"><h2 class="ax-section-title">10F 세션 입장</h2><button type="button" class="ax-link axs-plain" onclick="SCAN.sub = \'\'; App.render()">목적 목록으로</button></div>' +
        '<div class="axs-stiles">' + SCAN_SPOTS.filter(function (x) { return x.kind === "sess"; }).map(scanTileHtml).join("") + "</div>";
    }
    return '<h2 class="ax-section-title">무엇을 찍나요?</h2><div class="axs-stiles">' +
      SCAN_TILES.map(function (id) {   /* v5.05 포토부스 대기 폐지 · 정리 #7 타일 목록에서 뺐다 */ return id === "sess" ? '<button type="button" class="axs-stile" onclick="scanChoose(\'sess\')"><b>10F 세션 입장</b><span>A~E 고르기</span></button>' : scanTileHtml(scanSpot(id)); }).join("") + "</div>" +
      (sp ? '<button type="button" class="ax-button ax-button-weak" onclick="SCAN.pick = false; App.render()">' + esc(sp.lb || sp.nm) + " 그대로 찍기</button>" : "") + log + INV_LNK;
  }
  var w = scanWhat(sp), out = sp.kind === "roulette" && S.get("roulette_out", false);
  var will = '<section class="axs-will' + (out ? " bad" : "") + '"><div class="axs-srow"><p class="axs-will-k">지금 찍으면</p>' +
    '<button type="button" class="axs-will-chg" onclick="scanRepick()">목적 바꾸기</button></div>' +
    '<p class="axs-will-v">' + esc(sp.will || sp.nm) + "</p>" + (w ? '<p class="axs-will-c">' + esc(w) + "</p>" : "") + "</section>";
  var cam = SCAN.on
    ? '<div class="axs-scam"><video id="qrVideo" playsinline muted></video></div><button type="button" class="ax-button ax-button-weak" onclick="scanStop(); App.render()">스캔 멈추기</button>'
    : '<button type="button" class="ax-button axs-camgo" onclick="scanStart()">카메라 켜고 찍기</button>';
  return will + cam + '<div id="scanRes">' + scanBigHtml() + "</div>" + log + INV_LNK;
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
}

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
  var v = { l: c.l || 0, e: c.e || 0, p: String(c.p || ""), w: String(c.w || ""), st: c.st ? 1 : 0, h: h };
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
  beCall(admA({ action: "crowd_set", tgt: t, act: a }), function (res) {
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



