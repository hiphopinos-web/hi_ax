/* ════════════════ 글자 크기 · 30~50대까지 각자 편한 크기로 ════════════════
   CSS의 모든 본문 폰트가 calc(Npx * var(--fs)) 라서 --fs 하나로 앱 전체가 함께 커진다.
   (20px 이상 큰 수치·로고는 배율 제외 · 레이아웃이 깨지지 않도록) */
var LS_FS = "axf_fs";
/* v4.71 설정 시트의 세 선택지는 뺐다(헤더 「일반 · 큰글씨」 = 1 · 1.25) · 목록은 저장값 확인용으로 둔다 · 예전에 「크게」(1.12)를 고른 기기도 그대로 1.12 */
var FS_OPTS = [
  { v: 1, nm: "보통", sz: 16, d: "기본 크기" },
  { v: 1.12, nm: "크게", sz: 21, d: "글씨가 작게 느껴질 때" },
  { v: 1.25, nm: "아주 크게", sz: 26, d: "돋보기 없이 편하게" }
];
function fsGet() {
  try {
    var v = parseFloat(localStorage.getItem(LS_FS));
    for (var i = 0; i < FS_OPTS.length; i++) if (FS_OPTS[i].v === v) return v;
  } catch (e) {}
  return 1;
}
function fsApply(v, save) {
  document.documentElement.style.setProperty("--fs", v);
  document.documentElement.classList.toggle("fs-big", v > 1);   /* v4.64 헤더 워드마크 「2026」 숨김 기준(CSS .fs-big) */
  /* 저장은 사용자가 직접 고른 순간에만 · "아직 안 골랐음"을 알아야 안내를 1회 띄울 수 있다 */
  if (save) { try { localStorage.setItem(LS_FS, v); } catch (e) {} }
}
function fsPick(v) {
  fsApply(v, true);
  fsPaint();
  if (typeof App !== "undefined" && App.render && !el("app").hidden) App.render();
}
function fsPaint() {
  var box = el("fsOpts");
  if (!box) return;
  var cur = fsGet();
  box.innerHTML = FS_OPTS.map(function (o) {
    return '<button class="fs-opt' + (o.v === cur ? " on" : "") + '" onclick="fsPick(' + o.v + ')">' +
      '<span class="sz" style="font-size:' + o.sz + 'px">가</span>' +
      '<span class="nm">' + o.nm + '<span style="display:block;margin-top:3px;font-size:calc(12.5px * var(--fs));font-weight:700;color:var(--muted)">' + o.d + "</span></span>" +
      '<span class="ck">✓</span></button>';
  }).join("");
}
function fsSheet(on) {
  var box = el("fsSheet");
  if (!box) return;
  if (on) fsPaint();
  if (on && el("fsPush")) el("fsPush").hidden = !(typeof pushReady === "function" && (pushReady() || pushRelogin()));   /* v4.76 알림 · 새 서버(공개키)일 때만 · v5.34 토큰 없는 옛 로그인도 줄을 보인다(다시 로그인 안내) */
  if (on) a2hsRow();   /* v4.88 앱 설치 · 홈 화면에 추가 한 단어 · 홈 화면 앱이면 숨김 · 줄이 다 숨으면 「앱」 제목도 */
  if (on) fsRowState();
  if (on && typeof kitFsRow === "function") kitFsRow();   /* 261006 키트 사이즈 줄 · 명단 사번만 */
  if (on && el("fsTt")) { var tto = ttGet(), tm0 = testMode(); el("fsTt").hidden = !tm0; el("fsTen").hidden = !tm0; el("fsLbTest").hidden = !tm0; if (el("fsTtSt")) el("fsTtSt").textContent = tto ? ttLbl(tto) : "꺼짐"; if (el("fsTenSt")) el("fsTenSt").textContent = testTenLbl(); }   /* 261007 테스트 도구 · 테스트 모드만 */
  box.hidden = !on;
}
/* v5.83 (최초 진입 가볍게 · 개편안 2-4) 설정 「앱」 줄 오른쪽 = 지금 상태 한 단어(설명 문장 없음) · 알림 켜짐 · 꺼짐 · 효과음 켜짐 · 꺼짐 · 바로가기 설치는 설치되면 줄이 숨는다(a2hsHide) */
function fsRowState() {
  var ps = el("fsPushSt"), ss = el("fsSnd"), st = el("fsSndSt");
  if (ps) ps.textContent = typeof pushState === "function" && pushState().on ? "켜짐" : "꺼짐";
  var on = S.get("game_sound", null) === true;
  if (st) st.textContent = on ? "켜짐" : "꺼짐";
  if (ss) { ss.setAttribute("aria-checked", String(on)); ss.classList.toggle("on", on); }
}
function fsSndToggle() { if (typeof sndToggle === "function") sndToggle(false); fsRowState(); }   /* 게임 안 스피커와 같은 값(game_sound) */
/* ── 261007 시각 바꿔 보기(사용자 「테스트 계정에서는 시간의 흐름을 볼 수 있게 시간을 조정해서 각 시간마다 홈이 어떻게 보이는지」) ──
   테스트 모드(testMode = 테스트 사번 · 데모)에서만 · 설정 「앱」 줄(fsTt) · 스탬프 탭 테스트 줄에서 연다 · 일반 직원 · 운영 계정은 줄도 띠도 없고 ttGet 이 늘 null
   날짜(10/25 전날 · 10/26 당일) + 시각(07:30 ~ 18:00 · 10분) · 켜면 앱 「지금」(appNow · hmNow · evPhase)이 그 시각 · 헤더 맨 위 띠 「시험 시각 10/26 13:40 · 끄기」
   앱 화면만 바뀐다 · 서버 판정(스탬프 시간 창 · 마감)은 실제 서버 시각 그대로 */
var TTD = { d: "day", m: 600 };
var TT_PICKS = ["07:50", "09:35", "10:40", "12:00", "13:40", "15:20", "16:50", "17:10", "17:40"];
function ttvFit(m) { m = Math.round(m / TT_STEP) * TT_STEP; return m < TT_MIN ? TT_MIN : m > TT_MAX ? TT_MAX : m; }
function ttLbl(o) { return (o.d === "pre" ? "10/25" : "10/26") + " " + hm2(o.m); }
function ttPick(v) { if (!testMode()) return; S.set("tt", /^\d{1,2}:\d{2}$/.test(v || "") ? { d: (ttGet() || {}).d || "day", m: t2m(v) } : null); }   /* 출석 시트의 테스트 시각 칸 · 같은 시험 시각 */
function ttOpen() {
  if (!testMode()) return;
  var o = ttGet(), d = new Date();
  TTD = o ? { d: o.d, m: o.m } : { d: "day", m: ttvFit(d.getHours() * 60 + d.getMinutes()) };
  sheetOpen(ttSpec());
}
function ttSpec() {
  var on = !!ttGet();
  return { id: "tt", title: "테스트 도구", body: ttBody(), go: "ttApply()", goLbl: "이 시각으로 보기",
    keep: on ? "끄기" : "닫기", keepAct: on ? "sheetClose(true); ttOff()" : "sheetClose()", keepWeak: true, keepLast: true };
}
function ttBody() {
  var dBtn = function (k, t) { return '<button type="button" role="tab" aria-selected="' + (TTD.d === k) + '" onclick="ttDay(\'' + k + '\')">' + t + "</button>"; };
  var stp = function (dm) { return '<button type="button" class="ax-button ax-button-weak" onclick="ttStep(' + dm + ')">' + (dm > 0 ? "+" : "−") + Math.abs(dm) + "분</button>"; };
  var tv = testTen();
  return '<div class="axs-ttv">' +
    '<p class="axs-ttv-h">내 10F 세션</p><div class="axs-ttv-p">' + TEST_TENS.map(function (x) { var on = tv === null ? false : (tv || "none") === x[0]; return '<button type="button" class="axs-chip' + (on ? " on" : "") + '" aria-pressed="' + on + '" onclick="testTenSet(\'' + x[0] + '\')">' + x[1] + "</button>"; }).join("") + "</div>" +
    '<p class="axs-ttv-h">시각 바꿔 보기</p>' +
    '<div class="axs-seg" role="tablist" aria-label="날짜">' + dBtn("pre", "10/25 전날") + dBtn("day", "10/26 당일") + "</div>" +
    '<p class="axs-ttv-t" id="ttT" aria-live="polite">' + ttLbl(TTD) + "</p>" +
    '<input class="axs-ttv-r" type="range" min="' + TT_MIN + '" max="' + TT_MAX + '" step="' + TT_STEP + '" value="' + TTD.m + '" aria-label="시각" oninput="ttDrag(this.value)">' +
    '<div class="axs-ttv-s">' + stp(-30) + stp(-10) + stp(10) + stp(30) + "</div>" +
    '<div class="axs-ttv-p">' + TT_PICKS.map(function (h) { return '<button type="button" class="axs-chip' + (t2m(h) === TTD.m ? " on" : "") + '" aria-pressed="' + (t2m(h) === TTD.m) + '" onclick="ttDrag(\'' + t2m(h) + '\', 1)">' + h + "</button>"; }).join("") + "</div>" +
    '<p class="ax-meta">앱 화면만 바뀌어요 · 서버 판정(스탬프 시간 창 · 마감 · 10F 명단)은 실제 서버 시각 · 실제 명단 그대로예요</p></div>';
}
function ttRepaint() { if (SHEET.id === "tt" && el("axsSheet")) { SHEET.spec = ttSpec(); sheetPaint(); } }
function ttDay(d) { TTD.d = d === "pre" ? "pre" : "day"; ttRepaint(); }
function ttStep(dm) { TTD.m = ttvFit(TTD.m + dm); ttRepaint(); }
function ttDrag(v, paint) { TTD.m = ttvFit(+v); if (paint) { ttRepaint(); return; } var t = el("ttT"); if (t) t.textContent = ttLbl(TTD); }   /* 끄는 중에는 글자만(다시 그리면 손잡이를 놓친다) */
function ttApply() { if (!testMode()) return; S.set("tt", { d: TTD.d, m: ttvFit(TTD.m) }); sheetClose(true); App.render(); }
function ttOff() { S.set("tt", null); App.render(); toast("시험 시각을 껐어요"); }
function ttBarHtml() { var o = ttGet(); return o ? '<div class="axs-ttbar" role="status"><button type="button" class="t" onclick="ttOpen()">시험 시각 <b>' + ttLbl(o) + '</b></button><button type="button" class="x" onclick="ttOff()">끄기</button></div>' : ""; }
fsApply(fsGet());   /* 스플래시·로그인 화면부터 바로 적용 */

var MEM = {};
/* v19: 영속 저장 · 새로고침·재접속해도 로그인·스탬프가 유지된다 (프라이빗 모드 등은 메모리 폴백) */
var LS_OK = (function () { try { localStorage.setItem("axf_t", "1"); localStorage.removeItem("axf_t"); return true; } catch (e) { return false; } })();
var S = {
  get: function (k, fb) {
    var raw = MEM[k];
    if (raw === undefined && LS_OK) { try { var lv = localStorage.getItem("axf_" + k); if (lv != null) raw = lv; } catch (e) {} }
    if (raw !== undefined) { try { return JSON.parse(raw); } catch (e) {} }
    return fb === undefined ? fb : JSON.parse(JSON.stringify(fb));
  },
  set: function (k, v) {
    S.put(k, v);
    window.dispatchEvent(new CustomEvent("axf-store", { detail: k }));
  },
  /* v4.25 조용한 저장 · 입력칸에서 글자마다 부르는 초안 저장 전용(idea_draft · survey_draft) · axf-store 를 내지 않는다.
     set 을 쓰면 axf-store → App.render 로 입력칸 노드가 글자마다 새로 그려져 한글 조합이 깨진다(260924 갤럭시 신고 · 「보봇보사상상」) */
  put: function (k, v) {
    var j = JSON.stringify(v);
    MEM[k] = j;
    if (LS_OK) { try { localStorage.setItem("axf_" + k, j); } catch (e) {} }
  },
  /* v3.70 키를 아예 지운다 (null 을 넣으면 기본값이 안 나온다) */
  del: function (k) {
    delete MEM[k];
    if (LS_OK) { try { localStorage.removeItem("axf_" + k); } catch (e) {} }
    window.dispatchEvent(new CustomEvent("axf-store", { detail: k }));
  }
};
/* 다른 탭의 변경(관리자 승인 등)을 실시간 수신 */
if (LS_OK) window.addEventListener("storage", function (e) {
  if (e.key && e.key.indexOf("axf_") === 0) {
    var k = e.key.slice(4);
    if (e.newValue == null) delete MEM[k]; else MEM[k] = e.newValue;
    window.dispatchEvent(new CustomEvent("axf-store", { detail: k }));
  }
});
/* v5.10b (사용자 261003 「공지사항에 쌓여 있는 쓸데 없는 공지문들을 없애 달라」) 개발 중 콘솔 시험 공지가 기기마다 쌓였다(beNoticeIn · 이 기기 저장)
   한 번만 비운다(notices_wipe1 · 기기 키) · 첫 그리기 전이라 헤더 공지 수 · 홈 공지 카드가 곧바로 0 · 그 뒤 새 공지는 그대로 쌓인다 · 환영 공지(DEFAULT_NOTICES) · 공지 버튼 · 목록 화면은 그대로 */
if (!S.get("notices_wipe1", false)) { S.put("notices", []); S.put("notices_wipe1", true); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }); }
function el(id) { return document.getElementById(id); }
function toast(msg) {
  var t = el("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._h); toast._h = setTimeout(function () { t.classList.remove("show"); }, 2400);
}
/* v5.77 밤샘 QA(261006) · 두 번 누름이 바뀐 화면의 다른 단추를 누르던 것 막기
   실측(0.15~0.25초 간격 두 번 누름) · 설문 「다음」 → 같은 자리 「이전」(1단계로 되돌아가 앞으로 못 감) · AX 퀴즈 시작 → 첫 문제 답이 저절로 눌림 · 상세 시트 「닫기」 → 뒤 목록의 다른 항목이 열림
   규칙 = 사람 손 누름(isTrusted · 키보드 누름 detail 0 은 제외)이 0.4초 안에 같은 자리(30px)에 또 오고, 첫 누름이 누른 것이 사라졌거나(다시 그림) 그 자리 맨 위가 아니면(시트 · 팝업이 덮음) 둘째를 버린다
   같은 단추가 그대로 있으면(게임 · 연타 단추) 그대로 통과 · 입력칸은 막지 않는다 */
var GHOST = { t: 0, x: 0, y: 0, el: null };
window.addEventListener("click", function (e) {
  if (!e.isTrusted || e.detail === 0) return;
  var tg = e.target, now = Date.now(), g = GHOST;
  if (g.el && now - g.t < 400 && Math.abs(e.clientX - g.x) < 30 && Math.abs(e.clientY - g.y) < 30 && tg !== g.el && !(g.el.contains && g.el.contains(tg)) && !/^(INPUT|TEXTAREA|SELECT|OPTION)$/.test(tg && tg.tagName || "")) {
    var gone = !document.documentElement.contains(g.el) || !g.el.getClientRects().length, top = gone ? null : document.elementFromPoint(g.x, g.y);
    if (gone || (top && top !== g.el && !g.el.contains(top))) { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); return; }
  }
  GHOST = { t: now, x: e.clientX, y: e.clientY, el: tg };
}, true);
/* ── v3.53 확인 팝업 대기열 ──
   중요한 알림(보상 열림 · 포토부스 호출 · 신청/취소 완료 · 적립 실패 · 해야 할 일)은 토스트 대신 「확인」 팝업.
   가벼운 피드백(입력 검증 · 재시도 · 운영자 화면 · 테스트)은 토스트 그대로.
   순서: 스탬프 팝(SPOP) 끝 → 팝업 · 다른 모달이 열려 있거나 게임 플레이 중이면 닫힐 때까지 대기 · 한 번에 하나씩.
   중복: 같은 key 가 대기 중이거나 떠 있거나 3초 안에 떴으면 버린다. o = { key, title, body, go, urgent } */
var NOTICE = { q: [], cur: null, last: {}, t: 0 };
function notice(o) {
  var k = o.key || (o.title + "|" + (o.body || ""));
  if ((NOTICE.cur && NOTICE.cur.k === k) || NOTICE.q.some(function (x) { return x.k === k; }) || Date.now() - (NOTICE.last[k] || 0) < 3000) return;
  o.k = k;
  if (o.urgent || o.first) NOTICE.q.unshift(o); else NOTICE.q.push(o);   /* v5.94 first = 쌓인 안내보다 먼저(체크인 안내 시트 → 그다음 행운권 상자 · 게임 중 토스트 없음) */   /* v4.64 (QA 260930) 급한 것(포토부스 입장 등)은 쌓인 안내보다 먼저 */
  if (o.urgent && el("rgPlay")) toast(o.title);   /* 게임 중에도 급한 것은 제목만 먼저 · 팝업은 게임을 나온 뒤 */
  clearTimeout(NOTICE.t); NOTICE.t = setTimeout(noticePump, 60);
}
function noticeBusy() {
  return !!((typeof qrGated === "function" && qrGated()) || SPOP.cur || SPOP.q.length || el("spop") || el("lgx") || el("modal") || el("axsSheet") || el("rgPlay") || el("app").hidden ||
    App.current === "admin" || App.current === "sscan" || App.current === "scan_res" || App.current === "stair" || SIGNAGE.indexOf(App.current) >= 0);   /* v4.06 결과·계단 화면이 연출이다 · 보상 안내는 나온 뒤 */
}
/* 261007 (사용자 「로그인 직후 자동 안내는 처음 10초에 1개만」 · 기획 `디자인 시안/재로그인 · 다음 할 일/분석.md` P3) 로그인 · 앱 열기 직후 10초 창(NB)
   창 안에서 저절로 뜨는 안내(NB_AUTO = 사전등록 체크인 시트 · 공지 시트 · 선착순 시트 · 행운권 상자 · 룰렛 열림 · 상태 알림 nu:)는 1개만
   첫 동기화를 최대 3초 기다려 가장 급한 것 하나(NB_RANK 순서)를 고른다 · 하나가 뜬 뒤 = 홈 줄 · 레일 · 종 목록이 같은 것을 말하는 안내(NB_DROP)는 버림 · 상태 알림(라운지 승인 · 커피챗 선정)은 창이 끝난 뒤
   호출(urgent) · 사람이 누른 결과(스캔 · 신청 등 그 밖의 key) · 스탬프 팝(SPOP · lgfx 포함)은 이 규칙 밖 · 시작 = 앱을 연 순간(이 파일을 읽은 때) · 로그인 성공(lgxEnter) · 오프닝이 닫힌 뒤(lgxAfter) */
var NB = { t: Date.now(), n: 0, sync: 0, base: 0 }, NB_MS = 10000, NB_WAIT = 3000;
var NB_AUTO = /^(ck:guide|ntc:|fcfs:got|rw:raffle|rw:roulette|nu:)/, NB_DROP = /^(ck:guide|ntc:|fcfs:got|rw:raffle|rw:roulette)/, NB_RANK = ["ck:guide", "ntc:", "fcfs:got", "rw:raffle", "rw:roulette", "nu:"];
function nbStart() { NB.t = Date.now(); NB.n = 0; NB.sync = 0; }
function nbOn() { return Date.now() - NB.t < NB_MS; }
function nbAuto(o) { return !o.urgent && NB_AUTO.test(o.k || ""); }
function nbRank(o) { if (o.urgent) return -1; for (var i = 0; i < NB_RANK.length; i++) if ((o.k || "").indexOf(NB_RANK[i]) === 0) return i; return 99; }
/* 창 안 줄 세우기 · true = 이번 차례는 쉬고 다시(예약은 여기서) */
function nbGate() {
  if (!nbOn() || !NOTICE.q.some(nbAuto)) return false;
  if (!NB.n) {
    if (!NB.sync && BE.on && Date.now() - NB.t < NB_WAIT) { NOTICE.t = setTimeout(noticePump, 300); return true; }
    NOTICE.q.sort(function (a, b) { return nbRank(a) - nbRank(b); });
    return false;
  }
  NOTICE.q = NOTICE.q.filter(function (x) { return !(nbAuto(x) && NB_DROP.test(x.k)); });
  if (!NOTICE.q.length) return true;
  if (!NOTICE.q.some(function (x) { return !nbAuto(x); })) { NOTICE.t = setTimeout(noticePump, NB_MS - (Date.now() - NB.t) + 60); return true; }
  NOTICE.q.sort(function (a, b) { return (nbAuto(a) ? 1 : 0) - (nbAuto(b) ? 1 : 0); });
  return false;
}
function noticePump() {
  clearTimeout(NOTICE.t);
  if (NOTICE.cur || !NOTICE.q.length) return;
  if (noticeBusy()) { NOTICE.t = setTimeout(noticePump, 400); return; }
  if (nbGate()) return;
  var qi = 0; while (qi < NOTICE.q.length && NOTICE.q[qi].hold && NOTICE.q[qi].hold()) qi++;   /* 261007 hold = 지금은 미룰 안내(공지 시트 · ntcHold) · 다른 안내는 먼저 */
  if (qi >= NOTICE.q.length) { NOTICE.t = setTimeout(noticePump, 600); return; }
  var o = NOTICE.q.splice(qi, 1)[0];
  NOTICE.last[o.k] = Date.now();
  if (nbOn() && nbAuto(o)) NB.n++;   /* 261007 10초 창 안 자동 안내 하나 */
  if (o.run) { try { o.run(); } catch (e) {} NOTICE.t = setTimeout(noticePump, 400); return; }   /* v5.94 팝업 대신 시트(사전등록 체크인 안내) · 다음 안내는 시트가 닫힌 뒤(noticeBusy 가 axsSheet 를 본다) */
  if (o.raffle) modalOpen(rfxHtml(o), esc(o.title));   /* v4.42 응모권 = 보물상자 · v4.49 모든 응모권을 직접 연다(v4.44 의 두 번째부터 자동 열기 폐지) */
  else modalOpen('<div class="ntc">' + (o.body ? '<p class="ntc-b">' + esc(o.body) + "</p>" : "") +
    (o.go ? '<button class="btn mint" style="margin-top:14px" onclick="noticeGo(\'' + o.go + "','" + (o.focus || "") + '\')">' + (o.goLbl || "바로 가기") + '</button><button class="btn line" style="margin-top:8px" onclick="modalClose()">확인</button>'
      : '<button class="btn" style="margin-top:14px" onclick="modalClose()">확인</button>') + "</div>", esc(o.title));
  NOTICE.cur = o;   /* modalOpen 안의 modalClose 가 cur 를 지우므로 연 다음에 잡는다 */
  el("modal").setAttribute("data-notice", o.k);
}
/* v3.93 f = 이동한 화면에서 한 번 튕길 자리 · 스탬프 팝 안착 튕김(sp-bounce)을 그대로 쓴다 · 이미 홈이어도 같은 동작(다시 그린 뒤 튕김) */
/* v4.03 AX-TDS · 옛 홈의 레일·나의 일정이 나의 참여로 옮겨 가서 목적지도 옮겼다: 보상 = 내 보상 카드 · 신청 = 내 일정 · 포토부스 = 포토부스 대기 */
function noticeGo(v, f) {
  modalClose();
  if (v.indexOf("card:") === 0) { expStamp(v.slice(5)); return; }   /* v4.06 이미 받음 · 저장한 스캔 적립 → 그 스탬프 카드 펼침 */
  if (v === "my_sched") { SCHED.tab = "mine"; v = "guide_time"; } if (typeof DET !== "undefined") DET.canon = Date.now();   /* v5.69 알림 「바로 가기」 = 그 항목이 있는 목록 위에 상세 시트 */
  App.go(v);
  if (f) setTimeout(function () { focusPulse(f); }, 120);
}
/* roulette = 레일의 룰렛 마커 · raffle = 가장 최근 응모 번호 칩(없으면 지금 개수의 마커)
   my:조각 = 홈 「나의 일정」에서 onclick 에 그 조각이 든 카드 (photo = 포토부스 대기 · sess:id = 신청한 강연) */
function focusTarget(f) {
  if (f.indexOf("my:") === 0) {
    var key = f.slice(3), cs = document.querySelectorAll("#view [data-my]");   /* v4.05 내 일정(M02) 카드 */
    for (var i = 0; i < cs.length; i++) if (cs[i].getAttribute("data-my") === key) return cs[i];
    return null;
  }
  var rwc = document.querySelector('#view [data-rw="' + f + '"]');   /* v4.03 내 보상 카드 */
  if (rwc) return rwc;
  var rail = document.querySelector("#view .rail");
  if (!rail) return null;
  var mks = rail.querySelectorAll(".mk");
  if (f === "roulette") return mks[0] || null;
  if (f === "raffle") {
    var tk = rail.querySelectorAll(".rnum .tkt");
    if (tk.length) return tk[tk.length - 1];
    var n = Math.min(REWARD_CAP, stampCount());
    return n >= 3 ? mks[n - 3] || null : null;
  }
  return null;
}
function focusPulse(f) {
  var t = focusTarget(f);
  if (!t) return;
  var r = t.getBoundingClientRect();
  if (r.top < 60 || r.bottom > innerHeight - 90) t.scrollIntoView({ block: "center" });
  var cls = t.classList.contains("rc") ? "sp-settle" : "sp-bounce";
  setTimeout(function () {
    t.classList.remove(cls); void t.offsetWidth; t.classList.add(cls);
    setTimeout(function () { t.classList.remove(cls); }, 600);
  }, 180);
}

/* ── 보상·커피챗 ── (커피 나눔 바·잔량 표시는 260917 폐기) */
/* 스탬프 개수로 열리는 보상 안내 (260909 · v4.58) · 3개=룰렛 1회, 4·5·6개=사후 추첨 응모 1·2·3장 */
function checkRewards() {
  var n = stampCount();
  if (n >= 3 && !S.get("roulette_open", false)) {
    S.set("roulette_open", true);
    if (!S.get("roulette_used", false))   /* 261007 (분석 P1) 룰렛을 이미 쓴 사람에게는 어느 경우에도 「열림」을 띄우지 않는다 */
    notice({ key: "rw:roulette", title: "룰렛 1회 열림", body: "1F EVENT 룰렛 부스에서 내 QR 제시", go: "rewards", focus: "roulette", goLbl: "나의 보상에서 보기" });
  }
  var t = raffleTickets(n);
  if (t < S.get("raffle_seen", 0)) S.set("raffle_seen", t);
  if (S.get("raffle_opened", 0) > t) S.set("raffle_opened", t);   /* v4.44 상자를 연 응모권 수 · 줄면 같이 내린다 */   /* v4.43 스탬프가 줄면(관리자 취소 · 테스트 게임 기록 초기화) 안내 기준도 내린다 · 다시 채우면 상자가 다시 뜬다(버그 260925 · 테스트 사번에서 안 뜸) */
  if (t > S.get("raffle_seen", 0)) {
    if (S.get("raffle_opened", null) === null) S.set("raffle_opened", S.get("raffle_seen", 0));   /* v4.44 이 버전 전에 이미 안내한 응모권은 연 것으로 친다 */
    S.set("raffle_seen", t);
    if (BE.on && !testEmp() && raffleNums().length < t) beSync();   /* v4.43 새 번호를 미리 받아 둔다 · 스탬프 연출이 도는 동안 도착해 상자를 열면 바로 보인다 */
    notice({ key: "rw:raffle", raffle: t, title: rfxTitle(t), body: "행운권 발급 · 17:00 Outro 추첨", go: "rewards", focus: "raffle", goLbl: "나의 보상에서 보기" });   /* v4.42 raffle = 보물상자 팝업(rfxHtml) */
  }
}
/* 261007 (사용자 결정 「재로그인 반복 팝업 고침」 · 분석 P1 · P4) 첫 동기화 기준선 · 이 기기에서 처음 받은 서버 목록 = 이미 알린 것
   새 기기 · 다른 브라우저 · 로그아웃 뒤 다시 들어온 첫 동기화(본 기록 pp_seen 이 없거나 기준선 대기 pp_base)에서 stampSync 가 부른다
   룰렛 열림(roulette_open) · 행운권 상자(raffle_seen · raffle_opened) · 사전등록 체크인 안내(ck_guide)를 조용히 채운다 · 팝업 · 상자 · 시트를 다시 띄우지 않는다
   fresh = 이번 세션에 새로 생긴 스탬프(스캔 결과가 본 기록에 먼저 적은 것 · 이 기기 목록에 아직 없는 것) · 이것만 빼고 센다 → 그 스탬프로 넘은 문턱은 지금처럼 알린다
   홈 레일 · 나의 보상 · 사전등록 홈 줄(ckGuideRow)은 그대로 보인다 · 최초 로그인 도장 팝(lgfx_261007)은 이 규칙 밖 */
function rwBaseline(list, fresh) {
  var old = list.filter(function (id) { return fresh.indexOf(id) < 0; });
  var n0 = Math.min(STAMP_DENOM, stampUnitsOf(old)), t0 = raffleTickets(n0);
  if (n0 >= 3 && !S.get("roulette_open", false)) S.put("roulette_open", true);
  if (t0 > S.get("raffle_seen", 0)) S.put("raffle_seen", t0);
  if (S.get("raffle_opened", null) === null || S.get("raffle_opened", 0) < t0) S.put("raffle_opened", t0);
  if (old.indexOf("ck") >= 0 && !S.get("ck_guide", 0)) S.put("ck_guide", 1);
}
/* 앱 안 행동으로 붙는 3종(미니게임·아이디어·전시 QR 퀴즈) 전용.
   현장 QR 은 stampByCode 가 서버로 보내므로 여기를 타지 않는다. */
function awardStamp(id) {
  var st = S.get("stamps", []);
  if (st.indexOf(id) >= 0) return;
  st.push(id); S.set("stamps", st);
  var sd = STAMPS.find(function (s) { return s.id === id; });
  /* v3.49 적립 확정 순간 풀스크린 팝 → 제자리로 비행 (어느 화면에서든) */
  if (!stampOverlay(id)) toast("스탬프 적립 · " + (sd ? sd.title : id) + " · 스탬프 " + stampCount() + "개");
  if (!testEmp() && BE.on) { stampPendAdd(id); stampPendSend(id); }   /* v3.19 테스트 사번은 서버에 적립하지 않는다 · v3.97 서버 확인 전까지 대기 목록 */
  checkRewards();
  if (typeof tourRetStamp === "function") tourRetStamp(id);   /* v5.57 둘러보기에서 출발한 활동의 스탬프 · 연출 · 안내가 끝나면 1층으로 */
}
/* v4.83 (261001) 스탬프 1 「최초 로그인」 · 새 체계(stv 2) 서버와 동기화한 뒤 서버 목록에 lg 가 없으면 한 번 보낸다(로그인 직후 · 이미 로그인된 기기 모두)
   서버가 계정을 확인해 적립한다(push stamp:lg · 앱이 보냈다고 쓰지 않는다) · 같은 사번은 30분에 한 번만 시도(서버가 거절해도 도장이 반복해서 뜨지 않게) · 테스트 사번은 이 기기에만 */
function lgCheck(list) {
  var emp = String((S.get("user", {}) || {}).empId || "");
  if (!stampV2() || !emp || LGX.cur) return;   /* v4.87 장면이 도는 중이면 장면이 보낸다 */
  if ((list || []).indexOf("lg") >= 0) lgfxRun(emp);   /* v6.07 9월 시험 때 이미 받은 사람도 이 기기 · 이 사번으로 한 번 도장 팝 */
  if ((list || []).indexOf("lg") >= 0 || S.get("stamps", []).indexOf("lg") >= 0 || stampPend().lg) return;
  var tr = S.get("lg_try", null);
  if (tr && tr.emp === emp && Date.now() - (tr.t || 0) < 1800000) return;
  S.set("lg_try", { emp: emp, t: Date.now() });
  awardStamp("lg");
}
/* v6.07 (사용자 261007 「9월 시험 때 이미 로그인한 사람도 최초 스탬프 효과가 나도록」) 서버에 lg 가 이미 있어도 이 기기에서 이 사번이 아직 안 봤으면 「최초 로그인」 도장 팝을 한 번만
   연출만 한다(다시 적립하지 않는다 · 개수 · 서버 기록 그대로) · 본 기록 = 기기 키 lgfx_261007(사번 목록 · 로그아웃해도 남는다) · lg 팝이 뜨면 어디서든 기록(stampOverlay · 장면 도장 포함)
   로그인 직후 · 이미 로그인된 앱을 연 경우 모두 첫 동기화(lgCheck)에서 · 입장 전환이 끝난 뒤(0.9초) · 장면이 떠 있으면 하지 않는다 · 다른 팝 · 안내와는 SPOP 줄 세우기 그대로 */
var LGFX_WAIT = 0;
function lgfxSeen(emp) { return (S.get("lgfx_261007", []) || []).indexOf(String(emp)) >= 0; }
function lgfxMark() { var emp = String((S.get("user", {}) || {}).empId || ""), a = S.get("lgfx_261007", []) || []; if (emp && a.indexOf(emp) < 0) { a.push(emp); S.put("lgfx_261007", a); } }
function lgfxRun(emp) {
  if (lgfxSeen(emp) || LGFX_WAIT) return;
  LGFX_WAIT = 1;
  setTimeout(function () {
    LGFX_WAIT = 0;
    var me = String((S.get("user", {}) || {}).empId || "");
    if (me !== String(emp) || lgfxSeen(emp) || LGX.cur || el("lgx") || S.get("stamps", []).indexOf("lg") < 0) return;
    stampOverlay("lg");
  }, 900);
}
/* ── v3.97 보내기 전 적립(대기 목록) · 서버 스탬프 목록이 정본이되, 아직 서버에 닿지 않은 내 적립은 지우지 않는다 ──
   stamp_pend = { id: { t: 적립 시각, ok: 서버가 push 를 받은 시각(0 = 아직) } }
   · sync 목록에 그 id 가 들어오면 확인 완료 → 대기에서 뺀다
   · push 가 성공했는데 목록에 안 들어오면(서버가 적립하지 않음) 30초 뒤 대기에서 빠져 서버 목록을 따른다
   · push 가 실패했으면 sync 때마다 다시 보낸다 · 10분이 지나면 포기하고 서버 목록을 따른다 */
var STAMP_PEND_MAX = 600000, STAMP_PEND_OK = 30000, STAMP_PEND_RETRY = 20000;
/* v4.54 지금 사번의 항목만 · 다른 사번 · 사번 없는 옛 항목은 빼고 돌려준다(다음 저장 때 사라진다 · 다시 보내지 않는다) */
function stampPend() { var p = S.get("stamp_pend", {}), o = {}; if (p && typeof p === "object") Object.keys(p).forEach(function (id) { if (ownIs(p[id])) o[id] = p[id]; }); return o; }
function stampPendAdd(id) { var p = stampPend(); p[id] = { t: Date.now(), ok: 0, try: Date.now(), emp: ownEmp() }; S.set("stamp_pend", p); }
function stampPendSend(id) {
  var sd = STAMPS.find(function (x) { return x.id === id; });
  bePush("stamp:" + id, sd ? sd.title : id, true, function () {
    var p = stampPend(); if (p[id]) { p[id].ok = Date.now(); S.set("stamp_pend", p); }
  });
}
/* sync 성공 때 · 서버가 아직 못 받은 적립을 다시 보낸다 */
function stampPendRetry() {
  var p = stampPend(), now = Date.now(), chg = false;
  Object.keys(p).forEach(function (id) {
    if (!p[id].ok && now - (p[id].try || 0) > STAMP_PEND_RETRY) { p[id].try = now; chg = true; stampPendSend(id); }   /* v4.57 sync 성공 순간에 붙어 간다(폰마다 폴링 시각이 이미 흩어져 있다) · 따로 늦추지 않는다 */
  });
  if (chg) S.set("stamp_pend", p);
}
/* v4.07 (사용자 요청 260922) 아이디어 제출 = 커피챗 자동 요청 폐기 · 제출 뒤 「참석하시겠어요?」에서 예를 고른 사람만,
   또는 커피챗 상세의 「커피챗 신청하기」로 나중에 신청한다. 아이디어·스탬프(p5)는 답과 무관하게 유지.
   서버에 닿지 않으면 로컬 신청을 되돌리고 알린다(조용히 대기로 남겨 두면 매칭 담당자 목록에 없다). */
function scheduleCoffeechat() {
  if (S.get("cchat", null) || !ideaMineN() || cchatClosed()) return;   /* v4.47 마감 · v4.45 아이디어 한 줄이 사전 조건 · 가장 아래에서 한 번 더 막는다 · v6.07 시간대는 선택(안 고르면 「언제든 좋아요」) */
  S.set("cchat", { status: "pending", pref: cchatPrefTxt(), ts: Date.now() });
  var u = S.get("user", {});
  if (BE.on && u.empId) {
    var ideas = S.get("ideas", []);
    var last = ideas.length ? ideas[ideas.length - 1] : {};
    var fail = function () { S.set("cchat", null); notice({ key: "cchatR:fail", title: "커피챗 희망이 전달되지 않았어요", body: "잠시 뒤 AX 커피챗 안내에서 다시 남겨 주세요" }); App.render(); };
    var req = { action: "cchat_req", emp: u.empId, name: u.name || "", dept: S.get("dept", null) || "", tag: (last.tag || "") + CCHAT_TAG_SEP + cchatPrefTxt(), pref: cchatPrefTxt() };   /* v4.45 pref = 선호 시간대(서버 GAS 가 「희망시간」 칸에 저장해야 콘솔에 보인다) */
    /* v5.82 (사용자 261006 「커피챗 앞으로」 결정 1) 서버도 아이디어 행이 없으면 noidea 로 거절한다 · 방금 낸 아이디어가 아직 서버에 닿지 않았을 수 있어
       아이디어를 한 번 다시 보내고(ideaFlush) 2초 뒤 한 번만 다시 신청한다(retried · 그 사이 S cchat 이 pending 이라 다른 입구는 이 함수 첫 줄에서 막힌다) · 그래도 noidea 면 지금의 실패 안내 */
    var retried = false;
    var send = function () {
      beCall(req, function (res) {
        if (res && res.ok) { pushAsk("cchat", {}); return; }   /* v4.76 가치 순간 ② 「매칭되면 알려 드려요」 */
        if (res && res.reason === "noidea" && !retried) { retried = true; ideaFlush(); setTimeout(send, CCHAT_RETRY_MS); return; }
        if (res && res.reason === "noidea") { S.set("cchat", null); NOTICE.q = NOTICE.q.filter(function (x) { return x.k !== "cchat:ok"; }); if (NOTICE.cur && NOTICE.cur.k === "cchat:ok") modalClose(); ideaCcGo(); return; }   /* v5.83 (사용자 261006 「권장대로」) 다시 보내도 서버에 아이디어가 없다(콘솔로 받은 p5 등) = 실패 안내 대신 아이디어 쓰기(커피챗 흐름 · 제출하면 신청 질문으로) */
        fail();
      }, fail);
    };
    send();
    return;   /* 매칭은 운영자가 콘솔에서 · 완료되면 sync 폴링이 팝업을 띄운다 */
  }
  setTimeout(function () {
    var c = S.get("cchat", null);
    if (c && c.status === "pending") matchCoffeechat();
  }, 8000);
}
function matchCoffeechat() {
  var rounds = ["13:30", "14:00", "14:30", "15:00", "15:30"];
  S.set("cchat", { status: "matched", round: rounds[Math.floor(Math.random() * rounds.length)], table: Math.random() < 0.5 ? "A" : "B", ts: Date.now() });
  checkMyState();   /* v3.53 매칭 팝업은 checkMyState 한 곳 */
}

/* ── v10: 공용 모달 ──
   v4.13 머리 한 줄(사용자 260922 · 닫기 X 가 룰렛 1회권 칩 · 내 QR 제목과 겹쳤다) · [제목 | X(48 터치)] 를 한 줄로 나누고 본문은 그 아래에서 시작한다.
   title = 이미 이스케이프한 제목 · 없으면 X 만 있는 머리 줄 · 본문 첫 줄에 제목을 다시 쓰지 않는다 */
var X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
function modalHeadHtml(title, onx, tid) {
  return '<div class="axs-mhead">' + (title ? '<h2 class="axs-mtitle" id="' + (tid || "mTitle") + '">' + title + "</h2>" : '<span class="axs-mtitle"></span>') +
    '<button type="button" class="axs-x" onclick="' + (onx || "modalClose()") + '" aria-label="닫기">' + X_SVG + "</button></div>";
}
/* v6.25 내용형 시트 공통 높이(사용자 261007) · 내용이 화면 높이(위 끝 --ax-sheet-top 아래)의 60% 이상이면 같은 높이(.axs-tall)로 · 그보다 짧은 확인 · 안내는 내용 높이 그대로(빈 공간이 절반을 넘지 않게) · 룰렛 · 응모권 상자(.rfx)는 연출이라 제외 · was = 한 번 키가 커진 시트는 다시 그릴 때 줄이지 않는다(오류 줄 등으로 흔들리지 않게) */
function sheetTall(card, was) {
  if (!card || card.querySelector(".rfx")) return false;
  card.classList.remove("axs-tall");
  var nat = card.scrollHeight;
  card.classList.add("axs-tall");
  var cap = card.clientHeight;
  if (!(was || nat >= cap * 0.6)) card.classList.remove("axs-tall");
  return card.classList.contains("axs-tall");
}
function modalOpen(html, title) {
  modalClose();
  var d = document.createElement("div");
  d.id = "modal";
  d.innerHTML = '<div class="mcard" role="dialog" aria-modal="true"' + (title ? ' aria-labelledby="mTitle"' : "") + ">" + modalHeadHtml(title) + '<div class="axs-mbody">' + html + "</div></div>";
  d.addEventListener("click", function (e) { if (e.target === d) modalClose(); });
  el("frame").appendChild(d);
  sheetTall(d.querySelector(".mcard"));
  sheetDrag(d, function () { return d.querySelector(".mcard"); }, { close: function () { if (el("modal") === d) modalClose(); } });   /* v5.69 끌어 닫기 = 상세 시트와 같은 손(뒷배경 탭과 같은 닫기) */
}
function modalClose() {
  STAFFK = ""; STAFFE = ""; STAFFT = "";   /* 담당자 코드 · 사번 · 토큰을 화면과 함께 버린다 */ var m = el("modal"); if (m) m.remove();
  if (typeof QRM !== "undefined" && QRM.timer && !(App.current === "scan_q" && SCQ.tab === "mine")) { qrMineOff(); QRM.msg = ""; }   /* v4.06 내 QR 동기화(v4.71 6초)는 패널이 열려 있는 동안만 · v5.23 내 QR 탭 위에 뜬 다른 창이 닫혀도 계속 */
  if (NOTICE.cur) NOTICE.cur = null;   /* v3.53 팝업이든 다른 모달이든 닫히면 다음 팝업 */
  if (NOTICE.q.length) { clearTimeout(NOTICE.t); NOTICE.t = setTimeout(noticePump, 250); }
  if (typeof SES !== "undefined" && SES.need) setTimeout(sesAsk, 400);   /* v4.67 다른 창 때문에 미룬 비밀번호 창 */
}

/* ── v10: 과제상담 예약 (v5 p23~25) ── */
function t2m(t) { var p = t.split(":"); return (+p[0]) * 60 + (+p[1]); }
function m2t(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; }
function resvConf() { return S.get("resv_conf", RESV_CONF); }
function resvSlots() {
  var c = resvConf(), out = [];
  var le = /^\d\d:\d\d$/.test(String(S.get("lng_end", "") || "")) ? t2m(S.get("lng_end", "")) : 0;   /* v5.90 라운지_상담종료(sync lng.end) 이후 시작 슬롯은 빼낸다 */
  for (var m = t2m(c.start); m + c.step <= t2m(c.end); m += c.step) {
    if (m >= t2m(c.lunch) && m < t2m(c.lunchEnd)) continue;
    if (le && m >= le) continue;
    out.push(m2t(m));
  }
  return out;
}
function resvAll() { return S.get("resv", []); }
/* v17: 승인 플로우 · requested(신청) → approved(승인) → checked(체크인) → done. booked는 구버전 호환 */
var RESV_LIVE = ["requested", "booked", "approved", "checked"];
var RESV_HOLD = ["requested", "booked", "approved", "checked", "done"];
/* v4.64 (QA 1단계 260930) 남이 잡은 시간 · 예전에는 이 기기 기록만 봐서 서버에 잡힌 시간도 「신청 가능」 · 「남은 시간 12개」로 보였고 신청해야 알았다.
   taken = 서버 sync 의 resvTaken(시간 글자만 · 이름 없음 · 옛 서버는 보내지 않아 null = 예전과 같다) · miss = 방금 「다른 분이 신청」으로 돌아온 시간(다음 sync 까지) */
var RESV_SRV = { taken: null, miss: {} };
/* 261005 최종 QA · 행사 당일 이미 시작한 상담 시간 · 행사가 끝난 뒤 = 고를 수 없는 칸(마감) · 전에는 오후 3시에도 09:30 칸을 신청할 수 있었고 「남은 시간」이 지난 칸까지 셌다(v5.64 서버 resv_book 도 행사일 서버 시각으로 지난 시간을 past 로 거절) */
function resvPast(slot) { var ph = evPhase(); return ph === "after" || (ph === "live" && t2m(slot) <= hmNow()); }
function resvTaken(slot) {
  if (resvPast(slot)) return true;
  if (resvAll().some(function (r) { return r.room === 2 && r.slot === slot && RESV_HOLD.indexOf(r.status) >= 0; })) return true;
  return !!RESV_SRV.miss[slot] || (RESV_SRV.taken || []).indexOf(slot) >= 0;
}
function dapRepick() { DAPSEL = null; PROG.cf = null; App.render(); }   /* 시트는 sheetPaint 의 act 가 먼저 닫는다 · 상담 화면에 머물러 다시 고른다 */
function resvRemain() {
  var n = 0;
  resvSlots().forEach(function (s) { if (!resvTaken(s)) n++; });
  return n;
}
function myResv() {
  var mine = resvAll().filter(function (r) { return r.mine; });
  return mine.length ? mine[mine.length - 1] : null;
}
var DAPSEL = null;
function dapPick(t) { if (resvTaken(t)) return; DAPSEL = DAPSEL === t ? null : t; App.render(); }
/* v5.60 G 「진행 방식 보기」 모달 두 개(dapModal · cchatModal)를 지웠다 · 내용은 상세 본문 한 곳에(지운 문장 = 00–10분 업무 설명 · 10–20분 병목 · 20–30분 개선방안 · 사은품 띠 · 커피챗 주제 소개 → 각자 고민 → 멘토와 다음 한 걸음 · 테이블 카드 안내) */
/* 커피챗 취소 · 과제상담(resv_cancel)과 같은 흐름 (260830 사용자 지적: 취소할 수가 없다).
   서버에 `cchat_cancel` 이 아직 없으면 로컬만 정리하고 그 사실을 그대로 알린다.
   조용히 로컬만 지우면 매칭 담당자는 그 자리를 계속 비워 두게 된다. */
var CCHAT_CX_TS = 0;

/* 공용 섞기(판 퀴즈 · O/X · 테트리스 가방) · 정리 #5(261005) 전시 QR 퀴즈(wq*)를 지우며 이 줄만 남겼다 */
function shuf(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ── v10: AX Now! 부스 연동 · 아이디어 채널 태그 · AX Wave ── */
function waveBump() { S.set("wave_extra", S.get("wave_extra", 0) + 1); }
function ideaPush(text, tag, anon, ch) {
  var u = S.get("user", {});
  var ideas = S.get("ideas", []);
  var it = { id: uid(), empId: u.empId, name: u.name, anon: anon, tag: tag, text: text, ch: ch || "app", ts: Date.now(), srv: 0 };
  ideas.push(it);
  S.set("ideas", ideas);
  var had = S.get("stamps", []).indexOf("p5") >= 0;   /* v5.57 이번 제출로 처음 받는가 */
  if (IDEA.cc) it.cc = 1;   /* v5.90 커피챗 신청 화면에서 온 아이디어(서버 early 예외) */
  ideaSend(it);   /* v4.15 서버 저장(idea_submit · 커피챗 매칭 재료 · 콘솔 열람) · 서버가 참여 로그 idea 한 줄도 쓴다(옛 bePush idea 대신) · 실패하면 sync 때 다시 */
  if (!ideaStampLater()) awardStamp("p5");   /* v5.90 행사 전 아이디어 스탬프는 10/26 첫 접속 때 서버가 준다(아이디어_사전스탬프 OFF) */
  IDEA.step = S.get("cchat", null) ? "done" : "ask";   /* v4.07 커피챗 요청은 참석 의사를 물은 뒤 (ideaCchat) */
  checkRewards();
  waveBump();
  if (TOUR_RET) TOUR_RET.p5 = !had;   /* v5.57 둘러보기에서 출발 · 마침 = 커피챗 질문에 답한 뒤(ideaCchat) · 묻지 않으면(이미 신청 · 마감) 지금 */
  if (IDEA.step === "done" || cchatClosed()) tourRetDone(!had);
}
/* v4.07 아이디어 제출 뒤 단계 · null = 입력 폼 · "ask" = 커피챗 참석 질문 · "done" = 제출 완료 (다른 화면에서 들어오면 폼으로) */
var IDEA = { step: null, yes: false, draft: null, tag: "", anon: false, err: "", cc: false };   /* v5.83 cc = 커피챗에서 왔다(ideaCcGo) */
var CCHAT_TXT = "커피와 간식을 드려요 · 멘토와 내 고민을 가볍게 나눠요";   /* v5.04 (261002 회의) 간식 = 휘낭시에 · 스콘(쿠키 아님) · 종류는 상세의 사진 줄(treatHtml)에 */
/* v4.45 (사용자 260925 「커피챗은 아이디어 한 줄이 필수 · 선호 시간대를 받아 그 시간에 매칭 · 매칭되면 하이웍스 안내 · 앱 나의 참여에서도 확인」)
   선호 시간대 = 여러 개 고를 수 있다 · 「언제든 좋아요」는 혼자 · 하나 이상 골라야 신청 · 서버에는 사람이 읽는 글(pref)로 보낸다(콘솔 커피챗 표 「희망 시간」) */
var CCHAT_PREF = [["13", "13~14시"], ["14", "14~15시"], ["15", "15~16시"], ["any", "언제든 좋아요"]];   /* v6.07 (사용자 261007 「커피챗은 오후 13시부터 16시까지」) 16~17시 칸 삭제 */
var CCHAT_HOURS = "13:00~16:00", CCHAT_END_M = 16 * 60;   /* v6.07 커피챗 운영 시간(사용자 261007) · 끝나면 아직 선정 전인 희망 줄을 조용히 걷는다(cchatOver) */
var CCHAT_NOTE = "선정되면 하이웍스 · 앱 알림으로 알려 드려요";   /* v6.07 (사용자 261007 「아이디어 한 줄 제출 > 커피챗 희망 여부 > 신청자 중 선정」) 옛 「매칭되면 하이웍스로 알려 드려요 · 앱 나의 참여에서도」 */
/* v6.07 커피챗 하루가 끝났다(행사일 16:00 뒤 · 서버 시각 · 또는 행사 뒤) · 선정 안 된 희망은 알리지 않고 줄만 걷는다(소외 없음 톤) */
function cchatOver() { if (evPhase() === "after") return true; var d = appNow(1); return d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 26 && d.getHours() * 60 + d.getMinutes() >= CCHAT_END_M; }   /* 261007 시험 시각(appNow · 1 = 서버 시계 보정) */
/* v4.46 서버(GAS)는 cchat_req 의 tag 를 이미 저장 · 콘솔에 돌려준다 · 선호 시간대를 tag 뒤에 붙여 보내 서버 수정 없이 콘솔 「희망 시간」에 보이게 한다(콘솔이 CCHAT_TAG_SEP 로 다시 나눈다) · pref 파라미터도 같이 보낸다(나중에 GAS 가 칸을 만들면 그쪽이 우선) */
var CCHAT_TAG_SEP = " / 희망 ";
/* v4.47 (사용자 260925 · 화요일 회의에서 숫자 확정 예정) 커피챗 선착순 · 멘토 2명 각자 테이블 · 회차당 최대 4명 · 20분
   정원은 서버가 세지 않는다 · 운영자가 콘솔 커피챗 표에서 「신청 마감」을 켠다(수동 스위치)
   마감 신호 = 서버 수정 없이 콘솔 공지(notice_set)를 빌린다 · 제목이 CCHAT_CLOSE_T 인 공지는 참가자 화면에 띄우지 않고 마감 표시로만 쓴다 · 공지 중지(notice_clear)가 다시 열기
   나중에 GAS 가 sync 에 cchatOut 을 주면 그쪽을 따른다(rouletteOut 과 같은 모양) */
var CCHAT_CAP = 30;
var CCHAT_RETRY_MS = 2000;   /* v5.82 서버 noidea 뒤 한 번 다시 신청하기까지 */
var CCHAT_CLOSE_T = "[운영] 커피챗 신청 마감";
function cchatClosed() { return !!S.get("cchat_out", false) || !!S.get("cchat_close_id", ""); }
function cchatPref() { var a = S.get("cchat_pref", []); return Array.isArray(a) ? a : []; }
function cchatPrefTxt(a) { a = a || cchatPref(); return CCHAT_PREF.filter(function (x) { return a.indexOf(x[0]) >= 0; }).map(function (x) { return x[1]; }).join(" · ") || "언제든 좋아요"; }   /* v6.07 시간대는 선택 · 안 고르면 언제든 */
function cchatPrefToggle(v, where) {
  var a = cchatPref().slice();
  if (v === "any") a = a.indexOf("any") >= 0 ? [] : ["any"];
  else { a = a.filter(function (x) { return x !== "any"; }); a = a.indexOf(v) >= 0 ? a.filter(function (x) { return x !== v; }) : a.concat([v]); }
  S.set("cchat_pref", a);
  if (where === "sheet") { if (el("axsSheet") && SHEET.spec && SHEET.spec.id === "cchat") { SHEET.spec = cchatSheetSpec(); sheetPaint(); } }
  else App.render();
}
function cchatPrefHtml(where) {
  var a = cchatPref();
  /* v4.88 (사용자 261001 「선호 시간대 버튼이 너무 작다」) AX LOUNGE 상담 시간 칸(axs-slots · axs-slot · 높이 48 · 반경 12 · 고르면 주황)을 그대로 쓴다 · 4칸 한 줄 + 「언제든 좋아요」 한 줄
     여러 개 고를 수 있으니 고른 칸 앞에 체크 표시(axs-multi) · 질문 화면(회색 바탕)에서는 칸을 흰 면으로(axs-cpref-pg) */
  return '<div class="ax-stack-tight"><p class="ax-type-t6-strong">가능한 시간대 <span class="ax-meta">선택 · 여러 개 고를 수 있어요</span></p><div class="axs-slots axs-multi axs-cpref' + (where === "sheet" ? "" : " axs-cpref-pg") + '" role="group" aria-label="가능한 시간대 · 선택 · 여러 개">' +
    CCHAT_PREF.map(function (x) { return '<button type="button" class="axs-slot' + (x[0] === "any" ? " axs-none" : "") + '" aria-pressed="' + (a.indexOf(x[0]) >= 0) + '" onclick="cchatPrefToggle(\'' + x[0] + "','" + where + "')\">" + x[1] + "</button>"; }).join("") + "</div></div>";
}
var IDEA_AWARD_TXT = "심사 결과는 Outro에서 발표해요";   /* v6.07 제출 완료 화면 한 줄 · 입력 화면은 시상 묶음(ideaPrizeHtml)이 말한다 */
var IDEA_HOOK_TXT = "우수 아이디어는 심사 후 Outro에서 시상해요";
/* v5.00 (사용자 261002 「아이디어 한 줄을 내면 '사이니지 점 하나가 켜졌다'는 메시지 · 이런 요소를 걷어 달라 · 넣을지 아직 고민」)
   참가자 화면에서 ME to WE 월 · 사이니지와 잇는 문구 · 연출을 끈다(지우지 않음 · true 한 줄로 되살린다)
   끄는 곳 = 아이디어 제출 직후 토스트 「오늘 n번째 아이디어! ME to WE 월에 점 하나가 켜졌어요.」(submitIdea) · 제출 완료 화면은 「아이디어를 제출했어요」 + 커피챗 + 다음 행동만
   그대로 = 서버 집계(stats.wall · 유효 참여 = 점) · 운영자 송출 화면(SIGNAGE: wall_metowe · wall_tv · wall_live · screen 등 · 관리자 진입) · 관리 콘솔 */
var WALL_ON = false;
function ideaCchat(yes) {
  IDEA.yes = !!yes;
  if (yes) scheduleCoffeechat();
  IDEA.step = "done";
  tourRetDone(!!(TOUR_RET && TOUR_RET.p5));   /* v5.57 아이디어 한 줄 마침(둘러보기에서 출발했으면) */
  if (TOUR_RET) TOUR_RET.p5 = false;   /* v5.82 완료 화면 「커피챗 신청하기」로 질문에 다시 답해도 인사는 한 번 */
  App.render();
}
/* 나중에 마음이 바뀐 사람 · 커피챗 상세(P02)의 주 버튼 · 아이디어가 1건 이상일 때만 */
function cchatApply() {
  if (S.get("cchat", null) || !ideaMineN()) return;   /* v6.07 시간대는 선택 */
  if (cchatClosed()) { sheetClose(true); toast("커피챗 희망 접수가 끝났어요"); App.render(); return; }   /* v4.47 시트를 여는 사이 마감 */
  sheetClose(true);   /* v4.18 확인 시트에서 온다 · 요청은 낙관 저장이라 기다릴 것이 없다 */
  scheduleCoffeechat();
  if (S.get("cchat", null)) notice({ key: "cchat:ok", title: "커피챗 희망 접수", body: "가능한 시간 " + cchatPrefTxt() + " · " + CCHAT_NOTE });   /* v5.83 key = noidea 로 되돌릴 때 이 안내를 거둔다 */
  App.render();
}
function ideaMineN() {   /* 커피챗 신청 가능 = 이 기기의 내 아이디어 1건 이상 */
  var e = (S.get("user", {}) || {}).empId;
  return S.get("ideas", []).filter(function (i) { return i.empId === e; }).length;   /* v5.83 (사용자 261006 「권장대로」) 옛 v4.64 「p5 스탬프 = 1건」 걷음 · 서버는 v5.82 부터 아이디어 행 없는 신청을 noidea 로 거절한다(콘솔로 받은 p5 · 다른 기기에서 낸 사람) · 0건 = 「아이디어 쓰고 신청하기」 · 서버 아이디어 수는 sync 에 없어 새 호출은 만들지 않는다 */
}
/* v5.83 커피챗에서 온 아이디어 쓰기 · 화면 위 한 줄 「커피챗은 아이디어 한 줄과 함께 신청해요」 · 제출하면 「이 아이디어로 커피챗을 신청할까요?」(IDEA.step ask) · 다른 화면을 그리면 표시를 접는다(라우터) */
function ideaCcGo() { IDEA.cc = true; IDEA.step = null; App.go("ideas"); }
/* v5.90 (261006) 아이디어 입구 · 서버 pub.idea { open, cut, late, prz, ps } · 행사 전 + 사전 오픈 OFF = 입구 숨김(테스트 사번 · 커피챗에서 온 경우 제외) · 옛 서버(없음) = 예전처럼 */
function evPreDay() { var o = ttGet() ? null : S.get("ev_phase", null); if (o) return o === "before"; return appNow(true) < new Date(2026, 9, 26); }
function ideaGateOff() { var ip = S.get("idea_pub", null); return !!ip && !ip.open && evPreDay() && !testEmp(); }
function ideaStampLater() { var ip = S.get("idea_pub", null); return !!ip && !ip.ps && evPreDay() && !testEmp(); }
/* v6.07 (사용자 261007 「아이디어 한 줄 입력하는 쪽에 시상 관련 후킹 메시지」) 입력 화면 시상 묶음 = 한 줄 + 경품 시트 아이디어왕 카드 3장(pzR3Html · 같은 그림 · 작게) + 마감 한 줄 */
function ideaPrizeHtml() {
  var ip = S.get("idea_pub", null) || {}, cut = ip.late ? "아이디어왕 접수 마감 · 제출은 받아요" : (ip.cut || "16:00") + " 마감";
  return '<section class="axs-ideaprz" aria-label="아이디어왕 시상"><p class="h" id="ideaAward">' + IDEA_HOOK_TXT + "</p>" + pzR3Html("idea") + '<p class="c">' + esc(cut) + "</p></section>";
}
/* v6.07 커피챗 한 줄 · 제출하면 희망을 물어본다(희망 전 · 접수 중 · 하루가 끝나기 전만) */
function ideaCcLineHtml() {
  if (S.get("cchat", null) || S.get("cchat_att", false) || cchatClosed() || cchatOver()) return "";
  return '<p class="ax-meta axs-ideacc">제출하면 18F AX 커피챗을 희망할 수 있어요<br>참여하면 커피 · 기념품을 드려요</p>';
}
/* 아이디어 입력 화면 머리 한 줄 · 마감 전 「아이디어왕 접수 16:00 마감」 · 뒤 「접수 마감 · 제출은 받아요」 */
function ideaCutHtml() {
  var ip = S.get("idea_pub", null); if (!ip || !ip.cut) return "";
  return '<p class="ax-type-t6-strong axs-ideacut">' + (ip.late ? "아이디어왕 접수 마감 · 제출은 받아요" : "아이디어왕 접수 " + esc(ip.cut) + " 마감") + "</p>";
}
/* v4.15 (사용자 확정 260922) 아이디어 서버 저장 · 커피챗 매칭에 필수 · 콘솔이 idea_list 로 본다.
   제출 ID(cid)를 같이 보내 재전송해도 한 번만 쓴다 · 서버에 닿으면 srv 에 시각 · 닿지 않은 내 것은 sync 때 다시 보낸다(옛 기기 로컬 아이디어도 이 길로 올라간다) */
var IDEA_SENDING = {};
function ideaSend(it) {
  var u = S.get("user", {}) || {};
  if (!BE.on || !u.empId || !it || it.srv || !it.text || IDEA_SENDING[it.id]) return;
  IDEA_SENDING[it.id] = 1;
  beCall({ action: "idea_submit", emp: u.empId, name: u.name || "", dept: S.get("dept", null) || "", cid: it.id, text: it.text, tag: it.tag || "", anon: it.anon ? 1 : 0, ch: it.ch || "app", cc: it.cc ? 1 : 0 },
    function (res) { delete IDEA_SENDING[it.id]; if (res && res.ok) S.set("ideas", S.get("ideas", []).map(function (x) { return x.id === it.id ? Object.assign({}, x, { srv: Date.now() }) : x; })); },
    function () { delete IDEA_SENDING[it.id]; });
}
function ideaFlush() {
  var e = (S.get("user", {}) || {}).empId;
  if (!BE.on || !e) return;
  S.get("ideas", []).forEach(function (x) { if (!x.srv && x.empId === e) ideaSend(x); });
}
function boothStamp() {
  if (!testMode()) { scanOpen("p2"); return; }   /* v4.64 (QA 260930) 실계정은 체험 QR 로만 · 시연 적립은 테스트 모드에만 */
  if (S.get("stamps", []).indexOf("p2") >= 0) { toast("AX PLAY 스탬프는 이미 적립했어요."); return; }
  awardStamp("p2");
  waveBump();
}
/* v3.64 (사용자 확정 260918) AX Now! 부스 화면의 30초 피드백 · 내 질문 · 시연 신청 블록 삭제 · 관련 함수(fbPick·boothFeedback·boothQuestion·demoRequest)와 로컬 저장(booth_fb·demo_reqs)도 함께 제거.
   서버 액션·시트는 그대로 둔다(운영 데이터 삭제 금지). */


/* 브라우저 전체화면만 해제된 경우(F11·Esc) 송출 전체 화면도 함께 끝낸다 · 정리 #6(261005) 옛 월 TV(wall_tv) 갈래는 지웠다 */
document.addEventListener("fullscreenchange", function () {
  if (!document.fullscreenElement && TVF.on) tvFullExit();
});
/* ── 범용 송출 전체 화면 (v19) · 모든 사이니지 뷰를 가로/세로로 확대 ── */
var TVF = { on: false, orient: null };
function applyTvFull() {
  var f = el("frame");
  f.classList.toggle("tv-full", TVF.on);
  f.classList.toggle("tv-h", TVF.on && TVF.orient === "h");
  f.classList.toggle("tv-v", TVF.on && TVF.orient === "v");
}
function tvFull(orient) {
  if (!S.get("admin_authed", false)) { toast("운영자 전용 화면입니다."); return; }
  TVF.on = true; TVF.orient = orient;
  var el0 = document.documentElement;
  var req = el0.requestFullscreen || el0.webkitRequestFullscreen || el0.msRequestFullscreen;
  if (req) { try { var fp = req.call(el0); if (fp && fp.catch) fp.catch(function () {}); } catch (e) {} }
  applyTvFull();
  App.render();
}
function tvFullExit() {
  TVF.on = false; TVF.orient = null;
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    var ex = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (ex) { try { ex.call(document); } catch (e) {} }
  }
  applyTvFull();
  App.render();
}
function tvBtns(only) {
  var st = "background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.3);white-space:nowrap";
  if (TVF.on) return '<button class="chip" style="background:var(--mint);color:#fff;border-color:var(--mint);white-space:nowrap" onclick="tvFullExit()">송출 종료 (Esc)</button>';
  var h = '<button class="chip" style="' + st + '" onclick="tvFull(\'h\')">전체화면 가로</button>';
  var v = '<button class="chip" style="' + st + '" onclick="tvFull(\'v\')">전체화면 세로</button>';
  return only === "v" ? v : only === "h" ? h : h + v;
}


