/* ════════════════ 스토어 (메모리 · 비영속 테스트) ════════════════ */
/* ════════════════ 백엔드 (Google Apps Script + Google Sheets) ════════════════
 * GAS_URL 이 비어 있으면 전 기능이 오프라인(각 기기 단독)으로 동작한다 · 기존 동작 그대로.
 * URL을 넣는 순간 로그인·참여기록·월 집계가 서버로 연결된다.
 * 정적 호스팅(GitHub Pages)에서 CORS 제약 없이 통신하기 위해 JSONP(script 태그) 방식 사용.
 * v4.61 (260929 서버 이전) 주소는 assets/server.js 의 AXF_SERVER 한 곳에서 읽는다(콘솔 두 화면도 같은 파일). 그 파일을 못 읽었거나 값이 주소 형식이 아니면 아래 기본값(옛 GAS).
 *   옛 서버가 읽기 전용으로 잠기면 응답의 moved 로 새 주소를 알려 준다 → beMoved 가 주소를 바꾸고 쓰기는 한 번 다시 보낸다 · 다음에 화면으로 돌아올 때 새로 고친다. */
var GAS_URL_DEFAULT = "https://script.google.com/macros/s/AKfycbwjCaSSUnQ7W1lrM8T426Cn_LgKs_UhI0Qi5XRVk-_eF-oD55-Wwjsot0DkPJCX9JqMBA/exec";
var GAS_URL = beUrlOk(typeof AXF_SERVER === "string" ? AXF_SERVER : "") ? AXF_SERVER : GAS_URL_DEFAULT;
var BE_POLL_MS = 30000;        /* sync 폴링 주기 · 월 집계 + 내 상태(승인·매칭) · 공지 · v4.57 10초 → 30초(260928 스트레스 테스트 · 사용자 지시) */
/* v4.57 폴링 규칙 · 화면이 가려지면 멈추고 다시 보이면 곧바로 한 번 · 실패하면 30 → 60 → 120초로 늘리고 성공하면 30초로
 * 첫 폴링 · 재전송(저장된 스캔 · 못 보낸 스탬프 · 아이디어)에는 0~5초 무작위 지연(09:30 처럼 한꺼번에 열 때 파도를 편다)
 * 예외(그대로): 내 QR 패널 6초 동기화(최대 90초 · v4.71 3초 → 6초 · 한 번에 한 요청) · 응모 연출·룰렛 직후 1회 · 타자 대전 선수 화면 */
var BE_POLL_MAX = 120000, BE_JIT_MS = 5000;
var POLL = { t: null, ms: BE_POLL_MS, fails: 0, base: BE_POLL_MS };   /* base = 성공 때 간격 · 서버 설정 「폴링초」(30~120)가 오면 그 값 */
function beJit() { return Math.floor(Math.random() * BE_JIT_MS); }
var BE = { on: false, stats: null, seq: 0 };

/* ── v4.61 서버 이전 (260929) · 옛 서버 읽기 전용 신호 ──────────────
   옛 서버가 잠기면 읽기 응답에 moved(새 주소 또는 1)가 붙고, 쓰기는 { ok:false, reason:"moved", moved } 로 아무것도 쓰지 않고 돌아온다.
   · 새 주소가 오면 GAS_URL 을 바꾸고(이 화면이 떠 있는 동안만 · 저장하지 않는다) 쓰기는 새 주소로 한 번 다시 보낸다.
     저장된 스캔 · 못 보낸 스탬프는 다음 재전송 때 새 주소로 간다(beBusy 가 moved 를 붐빔처럼 받아 대기열에 둔다).
   · 주소를 바꾼 뒤 다음에 화면으로 돌아올 때(가렸다 다시 보일 때) 앱을 새로 고친다(assets/server.js · index.html 을 캐시 없이 받고) · 10분에 한 번만.
   · 새 주소 없이 잠겼으면(moved 1 · 전환 중 몇 분) 아무것도 바꾸지 않는다 · 쓰기는 붐빔처럼 저장 후 다시 보낸다. 주소 형식은 workers.dev · script.google.com 웹앱만. */
var BE_MOVE = { reload: false };
function beUrlOk(u) { return typeof u === "string" && /^https:\/\/([a-z0-9-]+\.[a-z0-9-]+\.workers\.dev|script\.google\.com\/macros\/s\/[\w-]{20,})\/exec$/.test(u); }
function beMoved(res) {
  if (beUrlOk(res.moved) && res.moved !== GAS_URL) { GAS_URL = res.moved; BE_MOVE.reload = true; return true; }
  return false;
}
function beReload() {
  var last = 0;
  try { last = Number(sessionStorage.getItem("axf_mv") || 0); } catch (e) {}
  if (Date.now() - last < 600000) return;
  try { sessionStorage.setItem("axf_mv", String(Date.now())); } catch (e) {}
  BE_MOVE.reload = false;
  var go = function () { location.reload(); };
  try { Promise.all([fetch("assets/server.js", { cache: "reload" }), fetch(location.pathname, { cache: "reload" })]).then(go, go); } catch (e) { go(); }
}
document.addEventListener("visibilitychange", function () { if (!document.hidden && BE_MOVE.reload) beReload(); });

function beCall(params, done, fail, again) {
  if (!GAS_URL) { if (fail) fail("offline"); return; }
  var cb = "__be" + (++BE.seq) + "_" + (Date.now() % 100000);
  var q = [];
  for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) {
    q.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
  }
  var sesP = typeof sesParam === "function" ? sesParam(params) : "";   /* v4.67 참가자 세션 토큰 · 내 사번 쓰기에만 · 호출한 쪽의 params 는 고치지 않는다(저장된 대기열에 옛 토큰이 남지 않게) */
  if (sesP) q.push("ses=" + encodeURIComponent(sesP));
  q.push("callback=" + cb);
  var sc = document.createElement("script"), settled = false;
  var cleanup = function () {
    window[cb] = function () {};        /* 타임아웃 뒤 늦게 도착한 JSONP 응답이 에러 내지 않게 no-op으로 */
    if (sc.parentNode) sc.parentNode.removeChild(sc);
  };
  var timer = setTimeout(function () {
    if (settled) return; settled = true; cleanup(); if (fail) fail("timeout");
  }, 15000);
  window[cb] = function (res) {
    if (settled) return; settled = true; clearTimeout(timer); cleanup();
    if (res && typeof sesSeen === "function") sesSeen(res, params);   /* v4.67 서버 시계(now) · 토큰 거절(ses) */
    if (res && res.moved && beMoved(res) && res.reason === "moved" && !again) { beCall(params, done, fail, 1); return; }   /* v4.61 옛 서버 잠김 · 새 주소로 한 번 다시 */
    if (done) done(res);
  };
  sc.onerror = function () {
    if (settled) return; settled = true; clearTimeout(timer); cleanup(); if (fail) fail("network");
  };
  /* v4.57 스크립트는 받았는데 콜백이 불리지 않았다 = 서버가 JSON 대신 오류 페이지를 줬다(「너무 많은 스크립트가 동시에 실행」 등 · 260928 실측)
     예전에는 15초 타임아웃까지 「확인하는 중」이었다 · 이제 곧바로 실패로 넘겨 저장·재시도로 간다 */
  sc.onload = function () {
    setTimeout(function () { if (settled) return; settled = true; clearTimeout(timer); cleanup(); if (fail) fail("bad"); }, 0);
  };
  sc.src = GAS_URL + (GAS_URL.indexOf("?") >= 0 ? "&" : "?") + q.join("&");
  document.head.appendChild(sc);
}
/* 비밀번호는 원문을 보내지 않는다 · 기기에서 해시한 값만 전송·저장 */
function beHash(emp, pin) {
  var msg = "AXF26:" + emp + ":" + pin;
  if (window.crypto && crypto.subtle && crypto.subtle.digest && window.TextEncoder) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg)).then(function (buf) {
      var b = new Uint8Array(buf), out = "";
      for (var i = 0; i < b.length; i++) out += ("0" + b[i].toString(16)).slice(-2);
      return out;
    });
  }
  /* 폴백 · https가 아닌 환경(로컬 파일 등)에서만 사용 */
  var h = 0x811c9dc5, g = 0x1000193;
  for (var i = 0; i < msg.length; i++) {
    h = ((h ^ msg.charCodeAt(i)) * 0x01000193) >>> 0;
    g = ((g ^ (msg.charCodeAt(i) * 31)) * 0x85ebca6b) >>> 0;
  }
  return Promise.resolve(("00000000" + h.toString(16)).slice(-8) + ("00000000" + g.toString(16)).slice(-8));
}

/* ── v4.67 (QA 5a 260930) 참가자 세션 토큰 · 참가자 QR 서명 ──────────────
   로그인 응답의 ses(서버가 서명한 토큰 · 저장하지 않는 방식)를 로그인 정보(user.ses)에 둔다 · 참가자 쓰기에 붙인다(beCall 한 곳 · sesParam)
     붙이는 조건 = 보내는 사번이 로그인한 사번 · 관리 요청(key · tok)이 아님 · 옛 서버는 ses 를 주지 않아 아무것도 붙지 않는다(예전과 같다)
   서버 설정 「세션필수」가 켜졌는데 토큰이 없거나(옛 앱에서 로그인한 사람) 쓰기가 ses 로 거절되면 비밀번호를 한 번 다시 받는다(sesAsk)
     열린 창(바텀 시트 · 모달)이 있으면 닫힐 때까지 기다린다 · 닫으면 20초 동안 다시 띄우지 않는다
   내 QR = AXU:사번:체크섬:발급 시각:QR 시각:서명 12 · 서명 = SHA-256(AXQ | ses | 사번 | QR 시각) 앞 12글자 · 폰이 스스로 만든다(끊겨도 나온다 · 서버에 묻지 않는다)
     QR 시각 = 서버 시계에 맞춘 초(login · sync 응답 now · 이 기기 설정 toff) · 20초 단위 · 열린 내 QR 은 4초마다 보고 바뀌면 다시 그린다(qrLiveTick)
     서버는 120초 지난 QR(캡처)을 세션필수 ON 에서 거절한다 · 토큰이 없으면 예전 QR(AXU:사번:체크섬) */
var SES = { off: null, need: false, askedAt: 0, busy: false };   /* off = 서버 시계 - 이 기기 시계(ms) · 처음 쓸 때 저장값을 읽는다(S 는 이 줄보다 아래에서 만들어진다) */
function sesOff() { if (SES.off === null) { try { SES.off = Number(S.get("toff", 0)) || 0; } catch (e) { SES.off = 0; } } return SES.off; }
var QR_STEP = 20;
function sesParam(params) {
  if (!params || params.key || params.tok || params.action === "login" || params.emp == null) return "";
  var u = S.get("user", {}) || {};
  return u.ses && u.empId && String(params.emp).trim() === String(u.empId).trim() ? String(u.ses) : "";
}
function sesSeen(res, params) {
  if (typeof res.now === "number" && res.now > 1.6e12) {
    var off = Math.round(res.now - Date.now());
    if (Math.abs(off - sesOff()) > 1500) { SES.off = off; S.put("toff", off); }
  }
  if (res.ok === false && res.reason === "ses" && params && !params.key && !/^push_/.test(String(params.action || ""))) { SES.need = true; setTimeout(sesAsk, 300); }   /* v4.76 알림 요청이 토큰으로 거절되면 조용히 넘어간다(비밀번호를 다시 묻지 않는다) */
}
function sesNowSec() { return Math.floor((Date.now() + sesOff()) / 1000); }
/* 동기 SHA-256(글자 → 16진) · QR 을 그리는 순간 바로 써야 해서 crypto.subtle(비동기 · https 전용) 대신 · 검사 108절이 node crypto 와 대조 */
var SHA_KH = null;
function sha256hex(str) {
  if (!SHA_KH) {
    var k = [], h = [], comp = {}, n = 0, c, i;
    for (c = 2; n < 64; c++) {
      if (comp[c]) continue;
      for (i = c * c; i < 400; i += c) comp[i] = 1;
      if (n < 8) h[n] = (Math.pow(c, 0.5) * 4294967296) | 0;
      k[n++] = (Math.pow(c, 1 / 3) * 4294967296) | 0;
    }
    SHA_KH = { k: k, h: h };
  }
  var K = SHA_KH.k, H = SHA_KH.h.slice(), b = unescape(encodeURIComponent(String(str))), L = b.length, w = [], j, t;
  for (j = 0; j < L; j++) w[j >> 2] |= b.charCodeAt(j) << (24 - (j % 4) * 8);
  w[L >> 2] |= 0x80 << (24 - (L % 4) * 8);
  var nw = (((L + 8) >> 6) + 1) * 16;
  for (j = 0; j < nw; j++) w[j] = w[j] | 0;
  w[nw - 1] = L * 8; w[nw - 2] = Math.floor(L / 536870912);
  var ro = function (x, r) { return (x >>> r) | (x << (32 - r)); };
  for (var o = 0; o < nw; o += 16) {
    var W = w.slice(o, o + 16), a = H[0], bb = H[1], cc = H[2], d = H[3], e = H[4], f = H[5], g = H[6], hh = H[7];
    for (t = 0; t < 64; t++) {
      if (t >= 16) {
        var x15 = W[t - 15], x2 = W[t - 2];
        W[t] = (W[t - 16] + (ro(x15, 7) ^ ro(x15, 18) ^ (x15 >>> 3)) + W[t - 7] + (ro(x2, 17) ^ ro(x2, 19) ^ (x2 >>> 10))) | 0;
      }
      var t1 = (hh + (ro(e, 6) ^ ro(e, 11) ^ ro(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) | 0;
      var t2 = ((ro(a, 2) ^ ro(a, 13) ^ ro(a, 22)) + ((a & bb) ^ (a & cc) ^ (bb & cc))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = cc; cc = bb; bb = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + cc) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + hh) | 0;
  }
  var out = "";
  for (j = 0; j < 8; j++) out += ("0000000" + (H[j] >>> 0).toString(16)).slice(-8);
  return out;
}
/* 비밀번호 한 번 더 · 로그인과 같은 해시 · 같은 서버 액션(login) · 성공하면 토큰만 바꾼다(기록은 그대로) */
function sesAsk() {
  var u = S.get("user", {}) || {};
  if (!BE.on || !u.empId || SES.busy || el("sesPin")) return;
  if (!SES.need && u.ses) return;
  if (el("modal") || Date.now() - SES.askedAt < 20000) return;   /* 다른 창이 열려 있으면 닫힌 뒤(modalClose) · 방금 닫았으면 20초 뒤 */
  SES.askedAt = Date.now();
  modalOpen('<p class="myqr-nm" style="margin-top:4px">' + esc(u.name || "") + "<span>" + esc(u.empId || "") + "</span></p>" +
    '<input id="sesPin" class="input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" enterkeyhint="go" autocomplete="off" placeholder="비밀번호 4자리" style="margin-top:12px;text-align:center" oninput="numOnly(this, event)" onkeydown="onEnter(event, sesPinGo)">' +
    '<p id="sesErr" role="alert" style="display:none;margin-top:8px;font-size:calc(14px * var(--fs));font-weight:700;color:var(--ax-color-error)"></p>' +
    '<button id="sesGo" class="btn mint" style="margin-top:10px" onclick="sesPinGo()">확인</button>', "비밀번호 다시 입력");
  setTimeout(function () { try { el("sesPin").focus(); } catch (e) {} }, 150);
}
function sesPinGo() {
  var u = S.get("user", {}) || {}, pin = el("sesPin") ? el("sesPin").value.trim() : "", er = el("sesErr"), btn = el("sesGo");
  var show = function (m) { if (er) { er.textContent = m; er.style.display = "block"; } };
  if (SES.busy) return;
  if (!/^\d{4}$/.test(pin)) { show("비밀번호 4자리를 입력해 주세요."); return; }
  SES.busy = true; if (btn) { btn.disabled = true; btn.textContent = "확인 중…"; }
  var reset = function () { SES.busy = false; if (btn) { btn.disabled = false; btn.textContent = "확인"; } };
  beHash(u.empId, pin).then(function (h) {
    beCall({ action: "login", emp: u.empId, name: u.name || "", h: h }, function (res) {
      reset();
      if (!res || !res.ok) {
        show(res && res.reason === "lock" ? "비밀번호를 여러 번 틀렸어요. 10분 뒤 다시 시도하거나 운영 데스크에 문의해 주세요." :
          res && res.reason === "pw" ? "비밀번호가 맞지 않습니다." : "연결에 실패했어요. 잠시 후 다시 시도해주세요.");
        if (el("sesPin")) el("sesPin").value = "";
        return;
      }
      var cur = S.get("user", {}) || {};
      if (String(cur.empId || "") !== String(u.empId || "")) return;   /* 그 사이 로그아웃 · 다른 사번 */
      cur.ses = res.ses || ""; S.put("user", cur);
      SES.need = false;
      modalClose();
      toast("확인됐어요");
      beSync();   /* 저장해 둔 스캔 · 스탬프 · 기록을 새 토큰으로 곧바로 다시 보낸다 */
    }, function () { reset(); show("서버에 연결할 수 없어요. 네트워크를 확인해주세요."); });
  });
}
/* 유효 참여 1건 = 별 1개. once=true 면 같은 종류는 1회만 인정 */
function bePush(kind, val, once, onOk) {
  if (!BE.on) return;
  var u = S.get("user", {});
  if (!u.empId) return;
  beCall({ action: "push", emp: u.empId, kind: kind, val: val || "", once: once ? 1 : 0 },
    function (res) {
      if (res && res.ok && onOk) onOk(res);
      if (res && res.ok && res.wall != null) {
        if (!BE.stats) BE.stats = {};
        BE.stats.wall = res.wall;
      }
    });
}
/* ── v4.27 접속 기록 (260924 사용자 질문 「바탕화면 바로가기로 접속하면 로그에 안 잡히나」) ──────────────
   앱을 열 때 1회(open) · 30분 넘게 가렸다가 돌아올 때 1회(back) · 로그인 직후 사번을 붙여 1회(login).
   서버 「접속」 시트에만 쓴다(운영 참여 로그와 분리) · 결과를 기다리지 않고 실패도 무시한다(부팅 속도와 무관).
   기기ID = 이 기기 저장소에 만든 무작위 값(사번·이름과 무관) · 아이폰 홈 화면 앱은 사파리와 저장소가 따로라 기기ID 도 따로 생긴다.
   데모(#demo) · TV(#tv=) 는 기록하지 않는다 · 테스트 계정(기억된 계정 포함)은 test=1 로 보내 서버가 집계에서 뺀다.
   주소의 #s= · #q= 는 scanLinkTake 가 곧 지우므로 여기서 먼저 읽어 둔다(QR 링크 진입 표시). */
var VISIT = { hash0: String(location.hash || ""), hidAt: 0, first: false, did: "", BACK_MS: 30 * 60 * 1000 };
/* 경로 판별 · 홈 화면 앱(standalone 계열)이 먼저 · 그다음 인앱 브라우저 UA · 나머지는 브라우저 */
function visitRoute(ua, sa) {
  ua = String(ua || "");
  if (sa) return "app";
  if (/KAKAOTALK/i.test(ua)) return "kakao";
  if (/NAVER\(inapp|NAVER\//.test(ua)) return "naver";
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps|Teams\/|Slack\/|; wv\)/i.test(ua)) return "inapp";
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari\//.test(ua)) return "inapp";   /* 아이폰 앱 속 웹뷰는 Safari 표기가 없다(홈 화면 앱은 위에서 이미 걸렀다) */
  return "browser";
}
function visitDev(ua, touch) {
  ua = String(ua || "");
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch > 1)) return "ios";   /* 아이패드는 맥 UA + 터치 */
  if (/Windows|Macintosh|CrOS|X11|Linux/.test(ua)) return "pc";
  return "etc";
}
function visitStandalone() {
  try {
    if (window.navigator.standalone === true) return true;
    return ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"].some(function (m) { return window.matchMedia("(display-mode: " + m + ")").matches; });
  } catch (e) { return false; }
}
function visitSkip() { return /^#(demo|tv=)/i.test(VISIT.hash0) || /cap/.test(VISIT.hash0); }
/* 기기ID · 처음 만든 순간이 이 기기의 첫 방문 · 저장소를 못 쓰면 이번 방문만의 값(첫 방문 표시 없음) */
function visitDid() {
  if (VISIT.did) return VISIT.did;
  var id = "";
  try { id = localStorage.getItem("axf_vid") || ""; } catch (e) {}
  if (!/^[a-z0-9]{8,32}$/.test(id)) {
    var b = new Uint8Array(9);
    try { crypto.getRandomValues(b); } catch (e) { for (var i = 0; i < 9; i++) b[i] = Math.floor(Math.random() * 256); }
    id = "";
    for (var j = 0; j < 9; j++) id += ("0" + b[j].toString(36)).slice(-2);
    var kept = false;
    try { localStorage.setItem("axf_vid", id); kept = localStorage.getItem("axf_vid") === id; } catch (e) {}
    VISIT.first = kept;
  }
  VISIT.did = id;
  return id;
}
function visitSend(why) {
  try {
    if (!GAS_URL || !BE.on || visitSkip()) return;
    var u = S.get("user", {}) || {}, kn = knownGet() || {};
    var ua = navigator.userAgent;
    var p = { action: "visit", did: visitDid(), route: visitRoute(ua, visitStandalone()), dev: visitDev(ua, navigator.maxTouchPoints || 0), why: why };
    if (why !== "back" && /^#(s|q)=/i.test(VISIT.hash0)) p.entry = "qr";
    else if (why !== "back" && /^#go=/i.test(VISIT.hash0)) p.entry = "push";   /* v4.78 A16 알림을 눌러 연 앱(서버 접속 기록 진입 「알림」 · 콘솔 「알림 눌림」) */
    if (VISIT.first) { p.first = 1; VISIT.first = false; }
    if (u.empId) p.emp = u.empId;
    if (TEST_EMP.indexOf(String(u.empId || kn.empId || "")) >= 0) p.test = 1;
    beCall(p, function () {}, function () {});
  } catch (e) {}
}
document.addEventListener("visibilitychange", function () {
  if (document.hidden) { VISIT.hidAt = Date.now(); return; }
  if (VISIT.hidAt && Date.now() - VISIT.hidAt >= VISIT.BACK_MS) visitSend("back");
  VISIT.hidAt = 0;
});
/* ── v3.88 비밀번호 분실 요청 (사용자 요청 260918) ──────────────────────────────
   앱은 사번·이름만 보낸다 · 비밀번호 값은 만들지도 보여 주지도 않는다.
   서버는 명부와 짝이 맞을 때만 「비번요청」 시트에 한 줄을 남기고, 맞지 않아도 응답은 똑같다(누가 있는지 떠보지 못하게).
   그래서 앱도 결과를 가리지 않고 언제나 같은 문구를 보여 준다 · 메일·문자 발송은 없다(데스크에서 사람이 처리). */
var PWLOST = { from: "" };
function pwLostOpen() {
  var q = el("quick"), sp = el("splash");
  PWLOST.from = q && !q.hidden ? "quick" : "splash";
  if (q) q.hidden = true;
  if (sp) sp.hidden = true;
  var known = (typeof knownGet === "function" ? knownGet() : null) || {};
  el("pwEmp").value = known.empId || (el("empId") ? el("empId").value : "") || "";
  el("pwName").value = known.name || (el("userName") ? el("userName").value : "") || "";
  el("pwErr").textContent = "";
  el("pwForm").hidden = false; el("pwDone").hidden = true; el("pwSend").hidden = false;
  if (el("pwBack") && !el("pwBack").firstChild) el("pwBack").innerHTML = BACK_SVG;   /* v4.09 헤더 뒤로와 같은 모양 */
  el("pwlost").hidden = false;
  if (!PWLOST.bound) {   /* 엔터로도 보낼 수 있게 (버튼은 인라인 onclick) */
    PWLOST.bound = 1;
    ["pwEmp", "pwName"].forEach(function (k) {
      var i = el(k); if (i) i.addEventListener("keydown", function (e) { onEnter(e, pwLostSend); });   /* v4.25 조합 중 Enter 무시 · 두 번 보내기 방지 */
    });
  }
}
function pwLostBack() {
  el("pwlost").hidden = true;
  if (PWLOST.from === "quick") { if (el("quick")) el("quick").hidden = false; }
  else if (el("splash")) el("splash").hidden = false;
}
function pwLostSend() {
  var emp = (el("pwEmp").value || "").trim(), name = (el("pwName").value || "").trim();
  var err = el("pwErr"), btn = el("pwSend");
  if (btn.disabled) return;   /* v4.25 보내는 중에 Enter · 버튼이 겹쳐도 한 번만 */
  if (!emp || !name) { err.textContent = "사번과 이름을 모두 넣어 주세요."; return; }
  err.textContent = "";
  btn.disabled = true; btn.textContent = "보내는 중";
  var done = function () {   /* 성공·명부 불일치 모두 같은 화면 (떠보기 차단) */
    btn.disabled = false; btn.textContent = "요청 보내기";
    el("pwForm").hidden = true; el("pwDone").hidden = false; btn.hidden = true;
  };
  beCall({ action: "pw_reset_req", emp: emp, name: name }, function () { done(); }, function () {
    btn.disabled = false; btn.textContent = "요청 보내기";
    err.textContent = "연결에 실패했어요. 잠시 후 다시 시도해 주세요.";
  });
}

/* 이 기기를 기억 · 두 번째 접속부터는 사번·이름을 다시 묻지 않고 비밀번호만 받는다.
 * (참여 기록은 서버에 있으므로 여기 남기는 건 "누구인지"뿐) */
/* ── 홈 화면에 추가 · 적극 유도 3단 구성 ──────────────────────
 * ① 안드로이드 크롬: beforeinstallprompt 를 붙잡아 두었다가 버튼 한 번에 네이티브 설치창
 * ② iOS / 그 외: 입장 직후 하단 시트로 단계 안내 (공유 → 홈 화면에 추가)
 * ③ 카카오톡 등 인앱 브라우저: 홈 추가가 불가능하므로 기본 브라우저로 탈출 유도 */
var APP_VER = "v6.35";   /* 설정 시트 맨 아래 작은 글씨 · 앱을 고칠 때 같이 올린다 · v6.35 = 261008 홈 「다음 할 일」 카드 삭제(사용자 「둘러보기 고정 · 다음 할 일 삭제」 · 홈 = v6.13 이전 순서) · 「지금 현장」 날짜 조건 해제 · 플리스 상품 사진 · 실측 사이즈표(SS · 3XL 확인 중) · 테스트 사번 미리 보기 · v6.34 = 261008 17F AWS · MS 출석 QR 행사일(10/26) 전에는 시간 창 없이 늘 출석(사용자 「지금도 되도록 · 이상한 데이터는 행사 전 초기화」 · attPre · 고르기 시트 · 데모 · 시험 시각 10/25 = tm 안 보냄 · 서버 attPreDay_) · 출석으로 새로 받은 스탬프 = 가운데 도장 팝(사용자 「파트너사 강의에 출석체크를 하면 스탬프 박히는 효과가 없어」 · p3h 1 / 2 · p3 ×2 · 이미 받음 · 기록만 = 팝 없음 · attStamp stampOverlay) · v6.33 = 261008 럭키드로우 당첨자 폰 알림(사용자 261008 「당첨자 폰 알림도 넣자」 · 서버 draw_log win → 소켓 lucky · 푸시 「럭키드로우 당첨 · 지금 17F 무대 화면을 봐 주세요」 · sync my.lucky) · 당첨 시트(공통 바텀 시트 · 등수 큰 주황 글자 · 경품 사진 · 이름 · 행운권 번호 · 주 버튼 「확인」 → draw_ack 본인 세션 → 「확인 완료 · 무대 화면에 표시됐어요」 + 「경품은 나중에 따로 전달해요」) · 홈 나의 일정 맨 위 「럭키드로우 N등 당첨」 한 줄(확인 전 주황 점) · 7등 랜덤 굿즈 = 확인 단추 없는 안내 시트 한 번 · 콘솔 추첨 기록 「폰 확인」 칸 · 검사 §293 · v6.32 = 261008 홈 「지금 현장」 2×2(1F 룰렛 · 1F 포토부스 · 1F AX PLAY · 17F 대강당 5단계 · 스탬프 블록 바로 아래 · 행사 당일만 · 스탬프 블록 여백 줄임) · 스태프 입력 시트(누르면 저장 · 5초 되돌리기 · 자동으로 · 시간 재기) · 스캔 화면 「줄」 · 옛 로비 · 엘리베이터 · 17F 입장 수 칸 · 풀리면 알림 · 혼잡 제보 탭 진입 뺌 · v6.31 = 261008 기념품 옷 사이즈 선택(사용자 261008 「쇼핑몰 문법 · 재고 · 고유번호 · 스태프 포함」 · 홈 카드 「기념품 옷 사이즈 선택하기」 → 「L로 신청 완료 · 신청번호 K-012 · 마감 전 변경 가능」 · 상품 시트 = 공통 바텀 시트(라우트 kit · 상품 이미지 예시 칸 · 사이즈 칩 n개 남음 · 품절 임박 · 품절 · 추천 사이즈표 예시 접힘 · 아래 고정 「이 사이즈로 신청」 | 「사이즈 변경」 · 완료 = 신청번호) · 스태프 의류 명단 사번(pool staff · 수령 따로 안내) · 창구 결과 띠에 신청번호 · 서버 ks* §288) · v6.30 = 261008 17F AWS · MS 출석 QR 시간 안내 걷기(사용자 「우리 쪽에서 통제하지 말자」 · 상세 입장 · 끝 QR 줄 · 고르기 시트 · 시간 밖 안내에서 QR 창 시각 삭제 · 앱 기본 창 넓게 · 홈 카드는 강연 시각 기준) · v6.29 = 261008 경품 시트 등수 묶음(글 + 사진) 사이 옅은 회색 헤어라인 1px(사용자 「상품마다 옅고 얇은 회색선 · 균형을 보고 판단」 · 카드 테두리 · 블록 선 안은 채택 안 함) · v6.28 = 261008 7등 발송 표기 「사내 우편 발송」 → 「행랑 발송」(앱 · 추첨 무대 · 콘솔) · v6.27 = 261008 AX 올림픽 순위 바닥 문구(명예 순위 · 경품 없음 · 종합 호명) 삭제 · v6.26 = 261007 행운권 7등 랜덤 굿즈 수량 「수량 추후 공개」(60 고정 삭제) + 긴 상세 시트(경품 · 세션 · 구역 · 부스 · 전시) 높이 = 화면의 약 92%(위 끝 8%) + 경품 시트 등수 묶음 사이 간격 · v6.25 = 261007 행사 둘러보기 조작 A(사용자 「권장대로 진행해 줘」) · 달리기 · 좌로 · 우로 돌기 단추 삭제 · 점프 원 72px 오른쪽 아래 엄지 자리 · 첫 구역 도착 뒤 끌기 안내 1회 「화면을 좌우로 밀면 돌아봐요」 · 밀기 문턱 8 → 12px · PC 키 ↑ ↓ 걷기 · Space 점프 · ← → 돌기 · 둘러보기 v6.25 · v6.24 = 261007 10F 세션 상세 줄 이름 「진행」 → 「강사」(사용자 「강사가 맞을 것 같고」) · 세션 B · C 값 「임경덕」 · 「권혜영」(줄 이름과 겹치지 않게) · 값은 이름 단위로만 줄이 꺾임 · v6.23 = 261007 타자왕 보너스 스테이지(친 글자 뭉개짐 고침 · 짝짓기 rgBnsAlign · 「문장을 먼저 읽어 두세요」 32 · 3 · 2 · 1 · GO 팡 rgBnsPop) · 엔터 없이 안내(입력칸 · READY · 대기 왼쪽 · 보너스) · 노트북 대기 오른쪽 순위 TOP 10 · 점수 설명 왼쪽으로 · v6.22 = 261007 PC 휴대폰 틀에서 행사 둘러보기 = 틀을 걷고 창 전체(000-head tourNow · opsSet · 닫으면 틀로 · 스크롤 그대로 · 포커스를 틀 안으로 넘겨 클릭 없이 W A S D) · PC 아래 가운데 키 안내 한 줄(tpcKeys · 6초 뒤 옅게) · v6.21 = 261007 10F 실습 장소 · 진행 · 세션 E 회차 시간(운영진 메신저 · A 컨퍼런스룸 · B 01 HEART · C 06 HEART · D 08 HEART · E 07 HEART · E 13:30~15:00 / 15:00~16:30 · 상세 사실 표 「진행」 줄) · v6.20 = 261007 10F 세션 상세 보강(세션 A 실습 주제 예시 3개 · 세션 D 「AI를 활용한 업무 적용 실습」 · 세션 E 두 회차 「초급 과정 · Chat, Word, PPT, Agent Builder, Copilot Studio」 · 붙임2) · v6.19 = 261007 타자왕 노트북 대기 = 광고 순환(후킹 · 1~3위 경품 · 지금 1위 · 참여 방법 7초씩 · 맨 아래 「키보드를 눌러 시작」 · QR · 토큰 없음) · 아무 키 · 누름 = 새 QR(깨운 키 삼킴 · 남은 시간 막대) · 떠 있는 동안 토큰 그대로(서버 물음 연장 · 3분 상한) · 60초 아무도 안 붙으면 광고 + 서버 토큰 지움 · 폰 「노트북 키보드를 누르면 새 QR이 나와요」 · v6.18 = 261007 타자왕 노트북 접속 QR 나이 상한(30초 교체 · 화면 QR 45초까지만 · 못 받으면 「QR을 새로 받는 중」 · 물음 6초 버림 · 창이 다시 보이면 곧바로 · 바꾸기 전 한 번 더 묻기 · 폰은 로그인해 있어도 앱이 뜨자마자 토큰 붙잡기 5분) · v6.17 = 261007 둘러보기 v6.17 눌러서 가기 오작동 고침(누른 그 동전 · 계단 동전 둘 · 동전 언저리 누름 · 스태프 말풍선이 동전을 덮지 않음 · 연타 카드 한 번 · 조그 = 자동 걷기 끝 · 연출 중 화면 누름 무시 · TOUR.ver v617) · v6.16 = 261007 플리스 사이즈 4종(SS · L · 2XL · 3XL · 옛 S · M · XL 폐기 · 사이즈 고르기 4칸 · 조사 SS가) · 창구 띠 세 글자 사이즈 한 줄(l3 56px) · v6.15 = 261007 17F 오후 파트너 강연 시각 확정(AWS 13:30~14:50 · 휴식 14:50~15:10 시간표 줄 · MS 15:10~16:40) · v6.14 = 261007 PC 넓은 창 = 휴대폰 틀(000-head 틀 스크립트 · 앱은 틀 안 iframe 에서 휴대폰 폭 그대로 · 휴대폰 · 좁은 창 · TV · #self · cap 은 그대로 · ?frame=0 끔) · v6.13 = 261007 홈 「다음 할 일」 카드(광고판 아래 · 둘러보기 카드와 한 자리 교대 · 행사 당일만 · × 그날 끔 · 설정 줄 · nxPick) · 재로그인 반복 팝업 고침(첫 동기화 기준선 rwBaseline · checkMyState base) · 로그인 직후 10초 자동 안내 1개(NB · nbGate) · 커피챗 하루 끝도 appNow · v6.12 = 261007 체크인존 번호표(접수 · 창구 A~E 자리 · 사이즈 아주 크게 · 「B-023 · 홍*동 → B 창구」 · 다른 창구 · 명단 밖 = E 창구 안내) · 홈 맨 위 내 번호 카드(대기 · 곧 차례 · 호출 진동 · 놓친 번호 · 수령 완료) · 체크인 TV 대기판 · 창구 화면(태블릿) · 선착순 10:30부터 문구 · v6.11 = 261007 점프 시간 제한 없앰 · 30초부터 더 어렵게 · AX 상식 30문장 다시 씀 · 홈 나의 일정 카드 너비 · Outro 안내 · v6.10 = 261007 테스트 도구(시각 바꿔 보기 tt · appNow · 헤더 띠 · 내 10F 세션 test_ten · 310555 기본 A) · 공지 = 아래에서 올라오는 시트(ntcOpen · 홈 공지 카드 폐기 · 기기당 1번 · 기준선 ntc_base) · 내 QR = QR + 이름 · 사번만 · 재로그인 = 오프닝 없이 바로 홈 · 저장된 로그인 = 로그인 화면 비침 · 전환 없이 홈 · v6.09 = 261007 행사 둘러보기 접속 기록(서버 tour_log · 열 때 1번 · 닫을 때 1번 · 10분 안 다시 열기 = 같은 방문 · 3D · 2D 대체 모두 AXTour.isOpen · 가려지면 sendBeacon · tlog*) · v6.08 = 261007 아이디어 한 줄 보강(시상 묶음 · 50자 ~ 3,000자 · 자동 저장 · 커피챗 희망 → 선정 13:00~16:00 · 볼펜 사진) · v6.07 = 261007 9월 시험 때 이미 최초 로그인 스탬프를 받은 사람도 이 기기 · 이 사번으로 한 번 「최초 로그인」 도장 팝(연출만 · 기기 키 lgfx_261007 · lgfxRun) · v6.06 = 261007 나의 일정 후속(10F 명단 · 내 세션과 겹치지 않는 오후 강연 = 자유 참석 카드 · MYFL_LEC · 홈 = 신청 카드만 axs-myfl-h · 진행 중 칩 「진행 중」 + 고리) · v6.05 = 261007 테트리스 시간 제한 없앰(5분 끝내기 · 「5분 완주」 · surv 300초 멈춤 삭제 · 게임 오버까지 · 결과 「버틴 시간」 = 실제 시간 · 시작 화면 「시간 제한 없음」 · 서버 OLY_TT_SURV_MAX) · v6.04 = 261007 10F 명단 나의 일정 = 시간표와 같은 하루 흐름(myFlowItems · 신청 주황 테두리 + 칩) · v6.03 = 261007 테트리스 5분 완주 판 surv 30000 상한(서버 range 거절 버그) · v6.02 = 261007 점프 게임 바닥 = 붉은 벽돌(jpBrickCv · 무늬 한 장 반복) · v6.01 = 261007 둘러보기 v5.99(손가락 안내 = 들어올 때마다 + 6초 서 있으면 다시 · 방문당 3번 · 직접 눌러 걸어가 본 기기는 끝 · 첫 안내 둘째 줄 「다음 구역」 저절로 걷기 · 흉상 얼굴 주름 부드럽게) · v6.00 = 261006 밤 스태프 판정 = 로그인만으로(앱 스태프 명단 사번 = 가운데 단추 「스캔」 · 처음 누를 때만 코드 한 번 · 명단에서 빠지면 「내 QR」 · 서버 staff) · 스캔 자리에서 10F 세션 입장 숨김(SCAN_10F_UI) · v5.99 = 261006 키트 사이즈 사전 선택(키트명단 사번만 · 홈 카드 · 사전 신청 키트 화면 · 설정 · 나의 보상 줄 · 라운지 등록 순 초과 = 가습기 안내 · 서버 ks* · §250) · v5.98 = 261006 스태프 폰 연속 스캔(관리자 모드 폰 = 가운데 단추 「스캔」 · 자리 칩 · 톱니 · 결과 띠 1.5초 · 화면 꺼짐 막기) · 스캔 순간 참가자 알림(소켓 · 푸시) · 선착순 참여상 = 받기 선착순(남은 N · 「자격」 말 없음) · v5.97 = 261006 스탬프 감사 후속(AX PLAY 부스 코드 = 「스태프에게 내 QR을 보여 주세요」 · 「응모」 → 「행운권」 · 「선착순 참여상」 표기) · v5.95 = 261006 프로그램 참여 스탬프 = 17F 오후 AWS · MS 강연만(오전 강연 · 송출 · 10F · 커피챗 · 라운지 스탬프 문구 삭제) · 사전등록 체크인 3개 → 룰렛 → 강의장 안내 시트 · 홈 한 줄 · 스태프 키트 결과 「룰렛 부스로 안내해 주세요」 · v5.94 = 261006 타자왕 노트북 진입 = 화면 QR 하나(카메라 끔 · 큰 접속 QR · 후킹 「당신의 프롬프팅 속도를 보여 주세요」 · 로그인 전 토큰 붙잡기 5분 · 폰 「노트북 화면의 QR을 찍어 주세요」) · v5.93 = 261006 둘러보기 눌러서 가기(바닥 · 판 · 동전 · 포토부스 · 룰렛 · 엘리베이터 · 스태프 = 걸어가서 바로 · 첫 손가락 안내 · 숨 쉬는 테두리) · 설치 안내(「설치 중」 시트 · 설정 줄 = 바로 설치 창) · v5.92 = 7등 랜덤 굿즈 · 체크인 없는 추첨 */
var A2HS = { deferred: null, open: false, pending: false };   /* v5.91 pending = 이 탭에서 크롬 설치 창 「설치」를 눌렀다(설치 중 · 다시 설치 막기) */
/* v5.36 키보드로 조작 중일 때만 html[data-kbd] (포커스 고리 규칙 · 위 CSS) */
(function () { var h = document.documentElement; function off() { h.removeAttribute("data-kbd"); }
  document.addEventListener("keydown", function (e) { if (e.key !== "Shift" && e.key !== "Control" && e.key !== "Alt" && e.key !== "Meta") h.setAttribute("data-kbd", "1"); }, true);
  ["pointerdown", "touchstart", "mousedown"].forEach(function (t) { document.addEventListener(t, off, true); }); })();
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();                 // 크롬 기본 미니바 대신 우리가 원할 때 띄운다
  A2HS.deferred = e;
  /* 이 이벤트는 페이지 로드보다 늦게 오는 일이 잦다. 그 사이 안내 시트를 이미 열었다면
     단계 안내 대신 한 번에 되는 버튼으로 바꿔 준다. */
  if (A2HS.open) a2hsSheet(true);
});
function isStandalone() { return visitStandalone(); }   /* v5.34 standalone · fullscreen · minimal-ui 까지(visitRoute 와 같은 기준) */
function isIOS() { return visitDev(navigator.userAgent, navigator.maxTouchPoints || 0) === "ios" && !window.MSStream; }   /* v5.01 아이패드 데스크톱 UA(맥 + 터치)도 · visitDev 와 같은 기준 */
function isInApp() { var r = visitRoute(navigator.userAgent, visitStandalone()); return r === "kakao" || r === "naver" || r === "inapp"; }   /* v4.76 판별 한 곳(visitRoute · 안드로이드 웹뷰 · 아이폰 웹뷰 포함) */
function a2hsMarkDismissed() {
  try { window.localStorage.setItem("axf_a2hs", "1"); } catch (e) {}
}
/* 안드로이드 네이티브 설치창 · 성공하면 그대로 앱 아이콘 생성 */
/* v5.91 (조사 「디자인 시안/설치 속도/조사.md」 권장 A) 「설치」를 누른 순간은 설치가 시작될 뿐이다(크롬 · 구글 서버가 앱을 만들고 플레이가 깐다 · 길게는 1분 · appinstalled 도 시작할 때 온다)
   옛 「앱 설치 완료」 알림을 없애고 같은 시트를 「설치 중」 안내로 다시 연다 · 이 탭에서는 다시 설치 창을 띄우지 않는다(A2HS.pending) · 거절 = 시트를 닫고 아무 말 없음 */
function a2hsInstall() {
  if (A2HS.pending) { a2hsSheet(true); return; }
  if (!A2HS.deferred) { a2hsSheet(true); return; }
  var ev = A2HS.deferred;
  A2HS.deferred = null;
  ev.prompt();
  ev.userChoice.then(function (r) {
    if (r && r.outcome === "accepted") {
      A2HS.pending = true;
      a2hsMarkDismissed();
      a2hsSheet(true);
      App.render();
    } else a2hsSheet(false);
  });
}

/* 브라우저별 안내 · 「오른쪽 위 ⋮」는 크롬 기준이라 삼성 인터넷에서는 틀린 말이었다.
   삼성 인터넷은 메뉴가 화면 아래쪽이고 항목 이름도 「현재 페이지 추가 → 홈 화면」이다.
   (260830 사용자 제보: 안내대로 눌렀는데 그런 메뉴가 없어 추가를 못 했다) */
function browserKind() {
  var u = navigator.userAgent;
  if (/SamsungBrowser/i.test(u)) return "samsung";
  if (/FxiOS|Firefox/i.test(u)) return "firefox";
  if (/EdgiOS/i.test(u)) return "edgios";   /* v5.01 아이폰 엣지 · 크롬은 안드로이드와 메뉴 위치가 달라 따로 */
  if (/CriOS/i.test(u)) return "crios";
  if (/EdgA|Edg\//i.test(u)) return "edge";
  if (/Whale/i.test(u)) return "whale";
  if (/Chrome|CriOS/i.test(u)) return "chrome";
  return "etc";
}
function a2hsSteps() {
  var k = browserKind();
  if (k === "samsung") return [
    ["화면 <b>아래쪽</b>의 <span class=\"g\">☰</span> 메뉴를 누르세요", ""],
    ["<b>&ldquo;현재 페이지 추가&rdquo;</b> 선택", ""],
    ["<b>&ldquo;홈 화면&rdquo;</b> 선택 · 끝!", ""]
  ];
  if (k === "whale") return [
    ["아래쪽 <span class=\"g\">≡</span> 메뉴를 누르세요", ""],
    ["<b>&ldquo;홈 화면에 추가&rdquo;</b> 선택", ""],
    ["<b>&ldquo;추가&rdquo;</b> · 끝!", ""]
  ];
  if (k === "firefox") return [
    ["오른쪽 <span class=\"g\">⋮</span> 메뉴를 누르세요", ""],
    ["<b>&ldquo;홈 화면에 추가&rdquo;</b> 선택", ""],
    ["<b>&ldquo;추가&rdquo;</b> · 끝!", ""]
  ];
  if (k === "chrome" && a2hsAndChrome()) return [   /* v5.34 크롬 메뉴 = 「앱 설치」 · 없으면 「홈 화면에 추가」 › 「설치」(「바로가기 만들기」는 브라우저 탭으로 열린다) */
    ["오른쪽 위 <span class=\"g\">⋮</span> 메뉴를 누르세요", ""],
    ["<span><b>&ldquo;앱 설치&rdquo;</b> 선택<br>없으면 <b>&ldquo;홈 화면에 추가&rdquo;</b> 선택</span>", ""],   /* 한 덩어리(.a-step 은 flex · 줄바꿈이 칸으로 갈라지지 않게) */
    ["<b>&ldquo;설치&rdquo;</b> · 끝!", ""]
  ];
  return [
    ["오른쪽 위 <span class=\"g\">⋮</span> 메뉴를 누르세요", ""],
    ["<b>&ldquo;홈 화면에 추가&rdquo;</b> 선택", ""],
    ["<b>&ldquo;추가&rdquo;</b> · 끝!", ""]
  ];
}

/* v5.01 (사용자 261002 「아이폰은 설치하기가 안 된다 · 모든 상황에서 되게」 · 조사 QA/아이폰 바로가기 설치 조사.md 7절 권장안)
   아이폰 · 아이패드 안내는 이 함수 하나에서 만든다(바로가기 설치 안내 · 알림 안내 pushIosSheet 가 같이 쓴다 · 예전에는 두 곳 문구가 따로 놀았다)
   사파리 26 이상 = 기본 배치에 공유 버튼이 안 보인다 · 주소창 오른쪽 「···」 › 공유 › 홈 화면에 추가 › 「웹 앱으로 열기」 켠 채 추가
     (사파리 26 은 OS 표기를 18_6 으로 고정해 Version/N 으로 가른다)
   사파리 17 · 18 = 아래 공유 버튼 › 목록을 올려 홈 화면에 추가 › 추가
   크롬 · 엣지 = 주소창 오른쪽 공유 › 홈 화면에 추가 › 추가 · 실기기 확인 전이라 「안 되면 Safari에서」와 주소 복사
   그 밖(파이어폭스 등) = Safari 에서 열기 + 주소 복사 · 아이패드 = 공유 버튼이 화면 위
   ua · touch 를 받아서만 판별한다(검사가 이 함수만 떼어 돌린다) · 아이콘 = 인라인 SVG(aria-label 이 그 버튼 이름) */
function a2hsIosSteps(ua, touch) {
  ua = String(ua || "");
  var ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && touch > 1);
  var sv = Number((ua.match(/Version\/(\d+)/) || [])[1]) || 0;
  var share = '<svg class="a-ic" role="img" aria-label="공유" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11"/><path d="M8.2 7.3 12 3.5l3.8 3.8"/><path d="M8.5 10.5H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5"/></svg>';
  var more = '<svg class="a-ic a-ic-more" role="img" aria-label="···" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="18.5" cy="12" r="1.9"/></svg>';
  var q = function (t) { return "<b>&ldquo;" + t + "&rdquo;</b>"; };
  var lead = (ipad ? "아이패드는" : "아이폰은") + " 아래 순서로 직접 추가해요";
  var again = "홈 화면의 AX Festival 아이콘으로 열면 사번 · 이름 · 비밀번호 4자리로 다시 입장해요";
  if (/CriOS|EdgiOS/.test(ua)) return { kind: "chrome", lead: lead, copy: true,
    steps: ["주소창 오른쪽 " + share + " 공유 버튼을 누르세요", q("홈 화면에 추가") + "를 누르세요", q("추가") + "를 누르세요"],
    notes: [again, "안 되면 Safari에서 열어 주세요"] };
  if (!/Version\/\d+/.test(ua) || !/Safari\//.test(ua) || /FxiOS|OPiOS|OPT\/|Whale|DuckDuckGo|GSA\//.test(ua)) return { kind: "other", lead: "", copy: true, steps: [],
    notes: ["<b>Safari</b>에서 열어 주세요"] };
  var add = sv >= 26 ? q("웹 앱으로 열기") + "를 켜 둔 채 " + q("추가") + "를 누르세요" : q("추가") + "를 누르세요";
  if (ipad) return { kind: "ipad", lead: lead, copy: false,
    steps: ["화면 위 주소창 오른쪽 " + share + " 공유 버튼을 누르세요", q("홈 화면에 추가") + "를 누르세요", add],
    notes: (sv >= 26 ? ["공유 버튼이 안 보이면 주소창의 " + more + " 버튼 › " + q("공유") + "를 누르세요"] : []).concat([again]) };
  if (sv >= 26) return { kind: "s26", lead: lead, copy: false,
    steps: ["주소창 오른쪽 " + more + " 버튼을 누르세요", share + " " + q("공유") + "를 누르세요", q("홈 화면에 추가") + "를 누르세요", add],
    notes: ["공유 버튼 " + share + "이 바로 보이면 그것을 누르세요", again] };
  return { kind: "s18", lead: lead, copy: false,
    steps: ["아래 " + share + " 공유 버튼을 누르세요", "목록을 올려 " + q("홈 화면에 추가") + "를 누르세요", add],
    notes: [again] };
}
/* 안내가 실제로 떴는가 · 안 떴으면 조용히 실패하지 않고 토스트(v5.01) */
function a2hsShown() { var b = el("a2hs"); return !!(b && !b.hidden && A2HS.open); }
function a2hsOpen() {   /* 설정 › 바로가기 설치 줄 · v5.91 (조사 권장 B) 크롬 설치 창이 준비돼 있으면 시트 없이 바로(누름 2 → 1) · 없으면 지금처럼 안내 시트 */
  if (A2HS.deferred && !A2HS.pending && !isStandalone() && !A2HS.inst && !isInApp()) { try { a2hsInstall(); return; } catch (e) {} }
  try { a2hsSheet(true); } catch (e) {}
  if (!a2hsShown()) toast("설치 방법을 열지 못했어요. 화면을 새로 고친 뒤 다시 눌러 주세요");
}
/* v4.88 (사용자 261001 「홈 화면에 추가와 설치가 섞여 있다」) → v4.89 (사용자 표현 「바로가기 설치」로 통일)
   우리 앱의 버튼 · 메뉴 이름 = 「바로가기 설치」 하나(설정 줄 · 안내 제목 · 버튼 · 완료 알림 · 최초 로그인 질문)
   단계 안내 안에서 기기 메뉴 이름을 인용할 때만 그 기기 표기(「홈 화면에 추가」 · 「현재 페이지 추가」 · 「설치」)를 따옴표로 쓴다
   이미 홈 화면 앱으로 열려 있으면 설정 줄을 감춘다 */
/* v5.34 (사용자 261003 · 조사 「디자인 시안/알림 출처 표시/조사.md」 6 · 8절 결정 2) 안드로이드 크롬에서만 「앱 설치」(크롬 설치창 · 메뉴 이름과 같다) · 아이폰 · 삼성 인터넷 · 그 밖은 「바로가기 설치」 그대로 */
function a2hsAndChrome() { var u = navigator.userAgent || ""; return /Android/i.test(u) && browserKind() === "chrome" && !/OPR\/|YaBrowser/.test(u) && !isInApp(); }
function a2hsWord() { return a2hsAndChrome() ? "앱 설치" : "바로가기 설치"; }
/* v5.34 이미 설치된 앱(getInstalledRelatedApps) · manifest 에 related_applications(webapp)가 있어야 값이 온다 · 지금 manifest 는 그대로라(WebAPK 재생성 방지) 보통 빈 목록 · 있으면 설치 권유를 숨긴다 */
function a2hsInstalledCheck() {
  try {
    if (!navigator.getInstalledRelatedApps || isStandalone()) return;
    navigator.getInstalledRelatedApps().then(function (l) { if (l && l.length) { A2HS.inst = true; if (typeof App !== "undefined" && App.render) App.render(); } }, function () {});
  } catch (e) {}
}
a2hsInstalledCheck();
function a2hsHide() { return isStandalone() || !!A2HS.inst; }
function a2hsRow() {
  var b = el("fsA2hs"), t = el("fsA2hsT");
  if (!b) return;
  b.hidden = a2hsHide();
  if (t) t.textContent = A2HS.pending ? a2hsWord() + " 중" : a2hsWord();   /* v5.91 설치 중이면 「앱 설치 중」(누르면 같은 안내) */
  var vv = el("fsVer"); if (vv) vv.textContent = "앱 " + APP_VER;   /* v5.01 열어 둔 옛 탭인지 가려내기 */
  var lb = el("fsLbApp"), pu = el("fsPush");
  if (lb) lb.hidden = b.hidden && (!pu || pu.hidden) && !el("fsSnd");   /* v5.83 효과음 · 오프닝 다시 보기 줄은 늘 있다 */
}
/* 하단 시트 · 입장 직후 1회 자동 + 설정에서 수동 호출 */
function a2hsSheet(on) {   /* v5.83 옛 top(최초 로그인 장면 위) · A2HS.after(장면 시트 다음 카드)는 접속 질문과 함께 삭제 */
  var box = el("a2hs");
  if (!box) return;
  if (!on) { box.hidden = true; A2HS.open = false; return; }
  A2HS.open = true;
  if (el("a2hsT")) el("a2hsT").textContent = a2hsWord();
  a2hsPendUi(box, false);
  var body = el("a2hsBody"), h = "";
  var url = location.origin + location.pathname;
  var copyRow = '<div class="a-url" onclick="a2hsCopy()">' + url +
    ' <b style="color:var(--hi)">· 눌러서 주소 복사</b></div>';
  if (isStandalone()) {
    h = '<div class="a-note" style="text-align:center">이미 홈 화면 아이콘으로 열고 계세요. 추가로 하실 일이 없습니다.</div>';
  } else if (A2HS.inst) {   /* v5.34 설치돼 있는데 브라우저 탭으로 열었다 */
    h = '<div class="a-note" style="text-align:center">이미 설치돼 있어요. 홈 화면의 AX Festival 아이콘으로 열어 주세요.</div>';
  } else if (isInApp()) {
    h = '<div class="a-note">지금은 <b>메신저 안 브라우저</b>라 바로가기를 설치할 수 없어요.<br>' +
      (isIOS() ? '메뉴에서 <b>&ldquo;Safari로 열기&rdquo;</b>를 누른 뒤 다시 시도해 주세요.</div>' : '오른쪽 위 메뉴에서 <b>&ldquo;다른 브라우저로 열기&rdquo;</b>를 누른 뒤 다시 시도해 주세요.</div>') + copyRow;
  } else if (A2HS.pending) {   /* v5.91 「설치」를 누른 뒤 · 끝난 시점은 알 수 없어 기다리는 법과 찾을 곳만 */
    a2hsPendUi(box, true);
    h = '<div class="a-note" style="text-align:center">홈 화면에 아이콘이 생기기까지 길게는 1분쯤 걸려요</div>' +
      '<div class="a-note" style="text-align:center">알림창의 설치 알림이 사라지면 끝난 거예요</div>' +
      '<div class="a-note" style="text-align:center">홈 화면에 없으면 전체 앱 목록에서 <b>AX Festival</b>을 찾아 주세요</div>' +
      '<button class="a-go" onclick="a2hsSheet(false)">확인</button>';
  } else if (A2HS.deferred) {
    h = '<button class="a-go" onclick="a2hsInstall()">' + a2hsWord() + '</button>' +
      '<div class="a-note" style="text-align:center">' + (a2hsAndChrome() ? "설치창에서 &ldquo;설치&rdquo;를 누르세요" : "설치창에서 &ldquo;설치&rdquo;를 누르면 끝") + "</div>";
  } else if (isIOS()) {
    var io = a2hsIosSteps(navigator.userAgent, navigator.maxTouchPoints || 0);   /* v5.01 사파리 26 · 사파리 17 · 18 · 크롬 · 엣지 · 그 밖 · 아이패드 */
    h = (io.lead ? '<div class="a-lead">' + io.lead + "</div>" : "") +
      io.steps.map(function (t, i) { return '<div class="a-step"><span class="n">' + (i + 1) + "</span><span>" + t + "</span></div>"; }).join("") +
      io.notes.map(function (t) { return '<div class="a-note" style="text-align:center">' + t + "</div>"; }).join("") + (io.copy ? copyRow : "");   /* v4.76 레드팀 채택 2 문구 · 아이폰 홈 화면 앱은 저장소가 따로라 다시 입장한다 */
  } else {
    h = a2hsSteps().map(function (s, i) {
      return '<div class="a-step"><span class="n">' + (i + 1) + '</span>' + s[0] + "</div>";
    }).join("") +
      (a2hsAndChrome() ? '<div class="a-note"><b>&ldquo;바로가기 만들기&rdquo;</b>는 고르지 마세요.</div>' +
        '<div class="a-note" style="margin-top:8px">메뉴에 <b>&ldquo;앱에서 열기&rdquo;</b>가 보이면 이미 설치된 거예요. 그것을 누르세요.</div>' : "") +
      /* 메뉴가 안 보인다는 제보가 실제로 있었다. 화면을 스크롤하면 툴바가 숨는 브라우저가 많다. */
      '<div class="a-note">메뉴가 안 보이면 화면을 <b>살짝 아래로</b> 내려 주소창을 꺼낸 뒤 다시 찾아보세요.</div>' +
      '<div class="a-note" style="margin-top:8px">그래도 안 되면 아래 주소를 복사해 브라우저 즐겨찾기에 넣어 두세요.</div>' + copyRow;
  }
  body.innerHTML = h;
  box.hidden = false;
  box.scrollTop = 0;
}
function a2hsPendUi(box, on) {   /* v5.91 설치 중 안내 = 제목 「앱 설치 중이에요」 · 부제 · 아래 닫기 줄은 감춘다(확인 단추 하나) */
  var tt = el("a2hsT"), sub = box.querySelector(".a-s"), later = box.querySelector(".a-later");
  if (on && tt) tt.textContent = a2hsWord() + " 중이에요";
  if (sub) sub.style.display = on ? "none" : "";
  if (later) later.style.display = on ? "none" : "";
}
function a2hsCopy() {
  var u = location.origin + location.pathname;
  var done = function () { toast("주소를 복사했어요. 브라우저에 붙여넣어 주세요"); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, function () {});
  else done();
}
/* 260829 사용자 지시 · 입장 직후 자동 노출과 홈 카드는 폐기, 설정 시트에서만 진입한다
   v4.76 로그인 직후 한 번 · 설치 안내가 아니라 알림(허용된 기기는 이 사번으로 다시 등록 · 홈 화면 앱으로 처음 들어온 사람에게만 「알림을 켤까요?」)
   v5.83 (최초 진입 가볍게) 이 함수는 pushFirst 만 부른다 · 바로가기 설치 안내는 설정 › 바로가기 설치와 알림이 필요한 순간의 아이폰 단계 시트에서만 */
function a2hsAuto() { setTimeout(pushFirst, 1800); }


var LS_KNOWN = "axf_known";
function knownGet() {
  try { return JSON.parse(window.localStorage.getItem(LS_KNOWN) || "null"); } catch (e) { return null; }
}
function knownSet(o) {
  try { window.localStorage.setItem(LS_KNOWN, JSON.stringify(o)); } catch (e) {}
}
function knownClear() {
  try { window.localStorage.removeItem(LS_KNOWN); } catch (e) {}
}
/* v4.54 (260928 스트레스 테스트 계획 조사) 기기에 남는 대기열 · 진행 상태는 찍은 사번에 묶는다.
   폰을 다른 사람이 이어 쓰면 앞 사람의 미전송 스캔이 다음 로그인 사번으로 전송될 수 있었다.
   scan_q 항목.emp · stamp_pend 항목.emp · stair.emp · 지금 로그인 사번과 다르거나 없으면(v4.53 이전 저장분) 읽을 때 빼고 보내지 않는다.
   아이디어(ideas)는 이미 empId 로 묶여 있다(ideaFlush) · 로그아웃은 셋을 아예 지운다(확인 창 없음) */
var OWN_KEYS = ["scan_q", "stamp_pend", "stair"];
function ownEmp() { return String((S.get("user", {}) || {}).empId || ""); }
function ownIs(x) { var e = ownEmp(); return !!e && !!x && typeof x === "object" && String(x.emp || "") === e; }
/* v4.56 (260928 사용자 확정) 로그아웃 = 사람별 기록을 모두 지운다 · 기기 설정만 남긴다.
   v4.54 는 대기열 셋만 지워 스탬프 · 예약 · 커피챗 · 포토부스 번호 · 설문 · 아이디어 초안이 남았고, 다음 사람이 로그인하면 동기화(최대 10초) 전까지 앞 사람 것이 보였다(310555 는 스탬프를 서버로 덮지 않아 계속 남았다).
   이 기기에 두는 키(axf_ 접두)는 반드시 아래 두 목록 중 하나에 적는다 · 검사 96절이 앱에서 쓰는 키를 모두 뽑아 대조한다(분류가 빠지면 실패).
   STORE_DEVICE = 남긴다(사람과 무관 · 소리 · 글자 크기 · 안내 본 횟수 · 스태프 거치 설정 · 서버 공용 값 캐시)
   STORE_PERSON = 지운다(사람별 기록) · 로그아웃은 STORE_DEVICE 가 아닌 axf_ 키를 모두 지우므로 목록에 없는 새 키도 지워진다(남기려면 STORE_DEVICE 에 적는다).
   끝이 * 인 항목 = 앞부분이 같은 키 전부(type_rank_app · oly2_done_pang 처럼 뒤가 바뀌는 키).
   같은 사람이 로그아웃 뒤 다시 들어와도 쓰던 설문 · 아이디어 초안은 지워진다(사용자 감수). */
var STORE_DEVICE = ["vid", "a2hs", "fs", "t",
  "site_sound", "game_sound", "rain_sound", "jp_tut",
  "self_on", "self_key", "self_tok", "scan_spot", "scan_sub", "ssc_cnt", "ssc_snd", "adm_tab", "tyaw_tab", "tyaw_hide", "tyaw_oly_pg", "self_dev",
  "type_rank_*", "oly_tab", "oly_ev",
  "notices", "notices_wipe1", "cchat_close_id", "roulette_out", "cchat_out", "beta_form", "resv_conf", "crowd", "stv", "att_w",
  "art_demo_n", "ev_phase", "toff", "tour_seen", "lgfx_261007", "ntc_rd", "ntc_base",
  "fx", "rcut", "lkcond", "idea_pub", "lng_end",
  "push_ask", "push_first", "push_ask_ios"];   /* v5.90 fx · rcut · lkcond · idea_pub · lng_end = 서버 공용 값(선착순 남은 수 · 룰렛 마감 · 행운권 참석 조건 · 아이디어왕 · 라운지 종료) */   /* v5.83 tour_seen = 둘러보기를 한 번 열었다(홈 카드 자리 · 기기 기준 · 옛 v5.46 tour_inv · v4.89 entry_pref · entry_ask_day 는 쓰지 않는다) · v4.76 알림 안내 시트 횟수 · 홈 화면 앱 첫 안내(기기 기준) · v4.78 아이폰 탭 · 앱 속 브라우저 안내는 하루 한 번 */
var STORE_PERSON = ["user", "known", "owner", "admin_authed", "adm_key", "adm_role", "adm_tok", "adm_emp", "dept",
  "stamps", "pp_seen", "pp_base", "pp_glow3", "stamp_pend", "lg_try", "lgx_seen", "scan_q", "stair", "checkin", "queue", "resv", "sess_my", "att_mine", "tt", "test_ten",
  "cchat", "cchat_pref", "cchat_att", "ideas", "idea_draft", "idea_draft_t", "survey_draft", "survey_done", "survey_mine", "survey_force", "noti_seen",
  "raffle_seen", "raffle_opened", "raffle_nums", "roulette_used", "roulette_open", "fcfs", "lk7", "ck_guide", "ck_grp", "kit", "kit_seen", "kit_t", "ckq", "ckq_seen",
  "wave_extra", "test_mine", "type_nick", "type_nick_edit", "type_best", "mem_seen", "ox_seen",
  "pang_best", "jump_best", "gw_best", "gw_time_best", "tt_best", "pang_cleared", "jump_cleared", "gw_cleared", "type_cleared", "tetris_cleared", "ox_cleared",
  "oly2_best_*", "oly2_done_*", "oly_pend", "draw_in", "lucky", "qz_run", "qz_last", "qz_best", "qz_kseen", "qz_pend", "gs_how",
  "push_me", "push_ep", "crowd_watch", "staff_me"];   /* v4.76 내 알림 설정 · 보낸 구독 주소 · 혼잡 풀리면 알림 */
function storeIsDevice(k) {
  k = String(k || "");
  return STORE_DEVICE.some(function (d) { return d.slice(-1) === "*" ? k.indexOf(d.slice(0, -1)) === 0 : k === d; });
}
/* 사람별 기록을 지운다 · 이 기기 저장(axf_ 접두 중 STORE_DEVICE 아닌 것 전부)과 메모리 거울(MEM)을 함께 · 새로 고침 없이도 S.get 이 앞 사람 값을 돌려주지 않는다.
   all = 로그아웃 · 이 탭의 sessionStorage(보관 중인 스캔 링크 · 마지막 탭)까지 · 로그인 때(personClaim)는 로그인 전에 연 스캔 링크를 이어 처리해야 하므로 남긴다 */
function personWipe(all) {
  try {
    var ks = [];
    for (var i = 0; i < localStorage.length; i++) { var n = localStorage.key(i); if (n && n.indexOf("axf_") === 0 && !storeIsDevice(n.slice(4))) ks.push(n); }
    ks.forEach(function (n) { localStorage.removeItem(n); });
  } catch (e) {}
  Object.keys(MEM).forEach(function (k) { if (!storeIsDevice(k)) delete MEM[k]; });
  if (typeof IDEA !== "undefined") IDEA.draft = null;
  if (!all) return;
  try {
    var ss = [];
    for (var j = 0; j < sessionStorage.length; j++) { var m = sessionStorage.key(j); if (m && m.indexOf("axf_") === 0) ss.push(m); }
    ss.forEach(function (m) { sessionStorage.removeItem(m); });
  } catch (e) {}
  if (typeof SCANLINK !== "undefined") SCANLINK.mem = null;
}
/* 로그인 때 · 이 기기의 사람별 기록 주인(owner)이 다른 사번이면 먼저 지운다 · v4.55 이전 로그아웃이 남긴 기록(owner 없음)도 여기서 걸러진다 */
function personClaim(emp) {
  emp = String(emp || "");
  if (String(S.get("owner", "") || "") !== emp) personWipe(false);
  S.put("owner", emp);
}
function axfLogout() {
  var fin = function () {
    personWipe(true);
    knownClear();
    LS_OK = false;   /* 다시 불러오기 전에 도착한 동기화 응답(beSync 의 checkin · stamps 등)이 지운 기록을 기기에 다시 쓰지 않게 · 메모리에만 남고 새로 불러오면 사라진다 */
    location.href = location.pathname;   /* 새로 불러오므로 화면 상태(전역 변수)도 처음부터 */
  };
  if (typeof pushLogout === "function") pushLogout(fin); else fin();   /* v4.76 이 기기 알림 구독을 먼저 지운다(공용 폰 · 다음 사람에게 앞 사람 알림이 가지 않게 · 1.5초 안) */
}


