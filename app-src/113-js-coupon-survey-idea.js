/* ════════════════ 쿠폰 HTML ════════════════ */
function qrHtml() {
  var seed = 0, emp = (S.get("user", {}).empId || "0000");
  for (var i = 0; i < emp.length; i++) seed += emp.charCodeAt(i) * (i + 7);
  var n = 17, cells = "";
  var finder = function (r, c) { return (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7); };
  var finderBlack = function (r, c) {
    var rr = r >= n - 7 ? r - (n - 7) : r, cc = c >= n - 7 ? c - (n - 7) : c;
    return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
  };
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
    var black = finder(r, c) ? finderBlack(r, c) : ((r * 31 + c * 17 + seed) % 5) < 2;
    cells += '<span class="' + (black ? "b" : "") + '"></span>';
  }
  return '<div class="qrbox">' + cells + "</div>";
}
/* 보상 표시는 v3.1부터 railHtml(보상 레일) + ppRouletteOpen·ppDrawOpen(모달)이 맡는다.
   구 ladderHtml(사다리 카드)·rouletteHtml(룰렛 쿠폰 카드)은 폐지. */

/* 스탬프 적립 · 판정은 서버가 한다 (260830).
   구판은 앱이 코드→스탬프 매핑을 들고 있어서, 소스를 읽으면 부스에 가지 않고
   현장 스탬프를 전부 자가 적립할 수 있었다(그게 대형경품 응모로 이어졌다).
   이제 앱은 **스캔한 값을 그대로 서버에 넘기기만** 하고 어느 스탬프인지도 모른다.
   정규화(대소문자·공백·하이픈)도 서버가 한다. 여기서 손대면 서버 판정과 어긋난다. */
/* v4.06 stampByCode · 대기열(scanQ*)은 「AX-TDS v1 3단계」 절로 옮겼다 (부스·계단 공용 · 찍은 순서대로) */
/* ═══ v3.35 오늘 한 판 설문 ═══
   5단계 · 60초 · 뒤로가기 · 중간 이탈 시 이어 하기(초안은 이 기기에만) · 1인 1회 · 14:30 부터.
   서버는 답을 사번 없이 저장하고 제출 사실만 사번과 남긴다. */
var SV = { card: 0, busy: false, aggAt: 0 };
/* v3.52 설문 잠금 · "time" = 14:30 전 · "nostamp" = 다른 스탬프 0개 · "" = 열림 (서버 survey_submit 와 같은 조건) */
function surveyLock() {
  if (!surveyOpen()) return "time";
  var other = S.get("stamps", []).filter(function (id) { return id !== "sv" && stampKnown(id); });   /* v5.68 p3h(17F 한쪽 1개)도 다른 스탬프 */
  return other.length ? "" : "nostamp";
}
function surveyOpen() {
  if (testMode() && S.get("survey_force", false)) return true;
  var ph = evPhase();
  if (ph === "after") return true;
  if (ph !== "live") return false;
  return hmNow() >= t2m(SURVEY.open);
}
function surveyDone() { return S.get("survey_done", false) || S.get("stamps", []).indexOf("sv") >= 0; }
function surveyPlaces() {
  var st = S.get("stamps", []), mr = myResv(), cc = S.get("cchat", null);
  return SURVEY_PLACES.filter(function (p) {
    if (p[0] === "dap") return !!(mr && mr.status === "checked");
    if (p[0] === "cchat") return !!(cc && cc.status === "matched");
    return st.indexOf(p[0]) >= 0;
  });
}
function svDraft() { var d = S.get("survey_draft", null); return d && d.a ? d : { step: 1, a: {} }; }
function svSave(d) { S.set("survey_draft", d); }
function svGo(step) { var d = svDraft(); d.step = step; svSave(d); SV.card = 0; App.render(); window.scrollTo(0, 0); }
function svSet(id, v, redraw) { var d = svDraft(); d.a[id] = v; if (redraw) { svSave(d); App.render(); } else S.put("survey_draft", d); }   /* v4.25 글자·막대 입력(redraw false)은 조용한 저장 · 다시 그리면 조합과 막대 끌기가 끊긴다 */
function svEmpty(q, v) { return v == null || v === "" || (q.type === "chips" && v === q.other + ":") || (q.type === "places" && !Object.keys(v || {}).length); }
function svNext() {
  var d = svDraft(), step = Math.max(1, d.step || 1), q = SURVEY_Q[step - 1];
  if (q && !q.optional && svEmpty(q, d.a[q.id])) { toast("답을 골라 주세요"); return; }
  svGo(step + 1);
}
/* 형식별 입력 · 값은 draft.a[문항id] */
function svInputHtml(q, v) {
  var id = q.id;
  if (q.type === "single") return '<div class="ax-stack-tight">' + q.opts.map(function (o) {
    return '<button type="button" class="axs-opt" aria-pressed="' + (v === o) + '" onclick="svSet(\'' + id + '\', \'' + esc(o) + '\', true)">' + esc(o) + "</button>";
  }).join("") + "</div>";
  if (q.type === "chips") {
    var isOther = typeof v === "string" && v.indexOf(q.other + ":") === 0;
    return '<div class="axs-chiprow">' + q.opts.map(function (o) {
      return '<button type="button" class="axs-chip" aria-pressed="' + (v === o) + '" onclick="svSet(\'' + id + '\', \'' + esc(o) + '\', true)">' + esc(o) + "</button>";
    }).join("") + (q.other ? '<button type="button" class="axs-chip" aria-pressed="' + isOther + '" onclick="svSet(\'' + id + '\', \'' + esc(q.other) + ':\', true)">' + esc(q.other) + "</button>" : "") + "</div>" +
      (isOther ? '<input id="svOther_' + id + '" class="ax-field" maxlength="40" placeholder="직접 입력" value="' + esc(v.slice(q.other.length + 1)) + '" onfocus="kbFocus(this)" oninput="svSet(\'' + id + '\', \'' + esc(q.other) + ':\' + this.value, false)">' : "");
  }
  if (q.type === "scale") {
    var mid = Math.round((q.min + q.max) / 2), nv = v == null ? mid : v;
    if (v == null) setTimeout(function () { svSet(id, mid, false); }, 0);
    return '<p class="disp" style="margin-top:12px;text-align:center;font-size:34px;color:var(--acc2)"><span id="svScale_' + id + '">' + nv + '</span><small style="font-size:15px;color:var(--faint)"> / ' + q.max + "</small></p>" +
      '<input type="range" min="' + q.min + '" max="' + q.max + '" step="1" value="' + nv + '" style="width:100%;accent-color:#FF7E31" oninput="svSet(\'' + id + '\', +this.value, false); var o=el(\'svScale_' + id + '\'); if (o) o.textContent=this.value">' +
      '<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:calc(12px * var(--fs))">' + q.min + " · " + esc(q.left || "") + '</span><span class="muted" style="font-size:calc(12px * var(--fs))">' + q.max + " · " + esc(q.right || "") + "</span></div>";
  }
  if (q.type === "text") return '<textarea id="svText_' + id + '" class="ax-field axs-ta" rows="3" maxlength="' + (q.max || 200) + '" placeholder="' + esc(q.ph || "") + '" onfocus="kbFocus(this)" oninput="svSet(\'' + id + '\', this.value, false)">' + esc(v || "") + "</textarea>";
  if (q.type === "places") {
    var pl = surveyPlaces(), cur = v || {};
    if (!pl.length) return '<p class="muted" style="margin-top:6px">스탬프로 확인된 다녀간 곳이 아직 없어요. 다음으로 넘어가 주세요.</p>';
    return pl.map(function (p) {
      return '<div style="margin-top:10px"><p style="font-weight:800">' + esc(p[1]) + '</p><div class="row" style="gap:6px;margin-top:6px">' + [["meh", "아쉬웠어요"], ["good", "좋았어요"], ["best", "최고"]].map(function (b) {
        return '<button type="button" class="axs-opt" aria-pressed="' + (cur[p[0]] === b[0]) + '" style="flex:1" onclick="svPlace(\'' + id + '\', \'' + p[0] + '\', \'' + b[0] + '\')">' + b[1] + "</button>";
      }).join("") + "</div></div>";
    }).join("");
  }
  return "";
}
function svPlace(id, place, val) { var d = svDraft(), o = d.a[id] || {}; o[place] = val; d.a[id] = o; svSave(d); App.render(); }
function svSubmit() {
  var d = svDraft();
  if (SV.busy) return;
  for (var qi = 0; qi < SURVEY_Q.length; qi++) {
    var qq = SURVEY_Q[qi];
    if (!qq.optional && svEmpty(qq, d.a[qq.id])) { toast("답을 골라 주세요"); svGo(qi + 1); return; }
  }
  var a = {};
  SURVEY_Q.forEach(function (qq) { var v = d.a[qq.id]; if (!svEmpty(qq, v)) a[qq.id] = { t: qq.type, q: qq.q, v: v }; });
  var ans = { a: a };
  var done = function () {
    S.set("survey_mine", d.a);
    S.set("survey_done", true); S.set("survey_draft", null);
    App.render(); window.scrollTo(0, 0);
  };
  if (testMode()) { done(null); awardStamp("sv"); return; }
  if (!BE.on) { toast("서버에 연결되지 않아 제출할 수 없어요."); return; }
  var u = S.get("user", {}) || {};
  SV.busy = true; App.render(); botWait(true, "제출하는 중");   /* v4.36 서버 기다리는 동안 챗봇 덮개 */
  beCall({ action: "survey_submit", emp: u.empId || "", ans: JSON.stringify(ans) }, function (res) {
    SV.busy = false; botWait(false);
    if (!res || !res.ok) {
      if (res && res.reason === "dup") { S.set("survey_done", true); S.set("survey_draft", null); App.render(); toast("이미 제출하셨어요"); return; }
      toast(res && res.reason === "closed" ? "설문은 " + SURVEY.open + "부터 열려요" : "제출하지 못했어요. 다시 눌러 주세요.");
      App.render(); return;
    }
    done(res.agg);
    stampSync(res.stamps);
    if (res.stamp && !res.stamp.dup && !stampOverlay("sv")) toast("스탬프 적립 · 오늘 한 판 설문");
    checkRewards();
  }, function () { SV.busy = false; botWait(false); App.render(); toast("서버에 연결할 수 없어요. 다시 눌러 주세요."); });
}
/* 서버가 준 목록으로 로컬을 맞춘다 (sync 응답에서도 같은 함수를 쓴다).
   정의 밖 id(구 p6·p8, 계단 p9 등)는 버린다 · 표시·보상 계산과 어긋나지 않게 (260909) */
function stampSync(list) {
  if (testEmp()) return;   /* v3.19 테스트 사번: 서버 stamps 가 로컬 테스트 적립을 덮지 않는다 */
  /* v3.97 (버그 260919) 빈 목록도 정본이다 · 관리자가 취소해 0개가 되면 기기에서도 0개 · 목록 자체가 없는 응답만 건너뛴다 */
  if (!Array.isArray(list)) return;
  list = list.filter(function (id) { return id === "p3h" || id === "ck" || STAMPS.some(function (s) { return s.id === id; }); });   /* v5.90 ck(사전등록 체크인 3개)도 지우지 않는다 */   /* v5.68 p3h(STAMP_HALF · 17F 입장이나 끝 한쪽만 · 1개)는 지우지 않는다 */
  var pend = stampPend(), now = Date.now(), pchg = false;
  Object.keys(pend).forEach(function (id) {
    var p = pend[id] || {};
    if (list.indexOf(id) >= 0 || now - (p.t || 0) > STAMP_PEND_MAX || (p.ok && now - p.ok > STAMP_PEND_OK)) { delete pend[id]; pchg = true; }
    else list.push(id);   /* 아직 서버에 닿지 않은 내 적립 · 지우지 않는다 */
  });
  if (pchg) S.set("stamp_pend", pend);
  /* v4.63 (사용자 신고 260929 「아이디어 한 줄을 낸 뒤 스탬프 화면에 들어가면 이미 본 도장 연출이 또 뜬다」)
     로그인 · 로그아웃(personWipe)으로 본 기록(pp_seen)이 비면 첫 동기화가 돌려준 스탬프는 이미 받은 것인데 「안 본 것」으로 남았다.
     그 뒤 아이디어 도장(p5)만 본 기록에 들어가면, 스탬프 탭의 「새 스탬프 1개면 팝」 규칙이 예전 스탬프(예: 1F 전시)의 연출을 다시 틀었다.
     본 기록이 아예 없을 때(키 없음)의 첫 목록 = 기준선 · 본 것으로 조용히 적는다 · 그 뒤로 새로 생긴 스탬프만 한 번 팝 */
  if (S.get("pp_seen", null) === null) S.put("pp_seen", list.slice());
  else if (S.get("pp_base", 0)) { var sb = S.get("pp_seen", []); list.forEach(function (id) { if (sb.indexOf(id) < 0) sb.push(id); }); S.put("pp_seen", sb); }   /* v5.07 기준선 대기(ppSeenGet) */
  if (S.get("pp_base", 0)) S.put("pp_base", 0);
  var cur = S.get("stamps", []), chg = list.length !== cur.length;
  if (!chg) for (var i = 0; i < list.length; i++) if (cur.indexOf(list[i]) < 0) { chg = true; break; }
  if (chg) {
    var added = list.filter(function (id) { return cur.indexOf(id) < 0; });
    /* v3.99 서버가 설문 스탬프를 뺐다(관리자 취소) → 로컬 「제출 완료」 표시도 내려 평소 흐름대로 다시 제출하게 */
    if (cur.indexOf("sv") >= 0 && list.indexOf("sv") < 0) S.set("survey_done", false);
    var ckNew = added.indexOf("ck") >= 0 && !S.get("ck_guide", 0) && !S.get("roulette_used", false);   /* v5.94 사전등록 체크인 안내 시트가 「룰렛 1회권」을 말한다 · 「룰렛 1회 열림」 알림은 겹쳐 띄우지 않는다 */
    if (ckNew) S.set("roulette_open", true);
    S.set("stamps", list.slice()); checkRewards();
    if (ckNew) notice({ key: "ck:guide", first: true, run: function () { ckGuideOpen(); } });   /* 스탬프 연출(SPOP)이 끝난 뒤 noticePump 가 연다 · 같은 sync 의 행운권 상자보다 먼저(first) */
    /* v3.52 · 운영자가 찍은 입장 스캔·상담 체크인·커피챗 완료로 서버에서 새로 생긴 스탬프 · 앱이 켜진 채 받으면 팝 */
    if (STAMP_SYNC.warm && added.length && added.length <= 2) added.forEach(function (id) { if (S.get("pp_seen", []).indexOf(id) < 0) stampOverlay(id); });
    if (STAMP_SYNC.warm && typeof tourRetStamp === "function") added.forEach(function (id) { tourRetStamp(id); });   /* v5.57 AX PLAY = 스태프 인증 스탬프가 내 QR 화면에 들어온 순간이 마침 */
  }
  STAMP_SYNC.warm = true;
}
var STAMP_SYNC = { warm: false };

/* ════════════════ 261006 키트 사이즈 사전 선택(사용자 261006 밤 · 기획 `디자인 시안/체크인존 운영/기획안.md` 6 · 7.1절 · 서버 ks* · 검사 §250) ════════════════
   서버 my.kit 이 있을 때만 보인다(키트명단 사번 · 그 밖의 사람에게는 홈 카드 · 화면 · 설정 줄 · 나의 참여 줄 어디에도 없다 · 사은품 비표시 원칙 260917 의 예외는 명단 사번에게만)
   st pick = 사이즈 5칸(남은 수 · 0 = 마감 회색) · 정하기를 누르면 서버가 잠금 안에서 판정(먼저 온 쪽) · 진 쪽 = 「L이 방금 마감됐어요」 · 마감 전까지 몇 번이든 바꾼다
   st hum = 라운지 사전 신청 등록 순이 수량(29)을 넘은 사람 · 사이즈 없이 가습기 안내(담담하게)
   문구 = 「키트」 · 「사이즈」만(「사은품」 · 「선물」 · 가격 없음) · 알림 허용은 정한 직후 한 번(가치 순간 · pushAsk kit) */
var KIT = { sel: "", edit: false, busy: false, msg: "" };
var KIT_SIZES = ["S", "M", "L", "XL", "2XL"], KIT_ITEM = "플리스 재킷", KIT_GET = "10/26(월) 08:00부터 · 1F 주차장 체크인존", KIT_LOW = 5;
function kitMy() { var k = S.get("kit", null); return k && typeof k === "object" && (k.st === "pick" || k.st === "hum") ? k : null; }
/* 「2026-10-21 18:00」 → 「10/21(수) 18:00」 */
function kitWhen(c) {
  var m = /^(\d{4})-(\d\d)-(\d\d) (\d\d:\d\d)/.exec(String(c || ""));
  if (!m) return "";
  return Number(m[2]) + "/" + Number(m[3]) + "(" + "일월화수목금토".charAt(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay()) + ") " + m[4];
}
function kitRo(z) { return z + (z === "M" ? "으로" : "로"); }   /* 엠으로 · 에스로 · 엘로 · 엑스엘로 */
function kitGa(z) { return z + (z === "S" ? "가" : "이"); }      /* 에스가 · 엠이 · 엘이 */
function kitCanSet(k) { return !!k && k.st === "pick" && (k.ph === "open" || k.ph === "chg"); }
function kitSeenKey(k) { return k ? k.st + ":" + k.ph + ":" + (k.sz || "") : ""; }
/* 홈 카드 · 고르는 기간에 아직 안 고름 · 자동 배정 뒤 변경 기간(한 번 열어 보면 사라짐) · 라운지 초과 안내(한 번 열어 보면 사라짐) */
/* ═══ 261007 체크인 번호표 · 홈 맨 위 내 번호 카드(시안 「체크인존 운영/캡처/02_폰_대기_번호.png」 4상태) ═══
   서버 my.ckq(sync) · 소켓 개인 사건 ckq 가 정본 · 접수 스태프가 내 QR 을 찍는 순간 생긴다 · 번호가 없으면 아무것도 없다.
   대기 = 「B 창구 · 앞에 n명 · 약 n분」 + 「차례가 되면 진동으로 알려요 · 근처에서 기다려도 돼요」(사용자 261007 줄 서지 않게)
   곧 차례(앞에 0 ~ 1명) = 「B 창구로 오세요」 · 호출 = 주황 카드 + 진동 + 알림 한 줄 + 「내 QR 열기」 · 놓친 번호(뒤 번호를 이미 부름) = 「아무 때나 B 창구에서」
   수령 뒤 = 「수령 완료」 + 사전등록 체크인 점 3개 + 다음 룰렛 · 닫으면(ckq_seen) 사라진다 · 서버도 30분 뒤 보내지 않는다 */
function ckqMy() { var q = S.get("ckq", null); return q && typeof q === "object" && q.no ? q : null; }
function ckqIn(q) {
  q = q && typeof q === "object" && q.no ? q : null;
  var was = ckqMy();
  if (JSON.stringify(q) === JSON.stringify(was)) return;
  S.set("ckq", q);
  if (q && q.st === "call" && !q.miss && (!was || was.no !== q.no || was.st !== "call")) { stampBuzz([220, 120, 220, 120, 320]); toast(q.no + " · " + q.w + " 창구로 오세요"); }
  if (App.current === "home") App.render();
}
function ckqHide() { var q = ckqMy(); if (q) S.set("ckq_seen", q.no); if (App.current === "home") App.render(); }
function ckqCardHtml() {
  var q = ckqMy();
  if (!q) return "";
  if (q.st === "done") {
    if (S.get("ckq_seen", "") === q.no) return "";
    var k = S.get("kit", null), sz = k && k.sz ? " " + k.sz : "", ck = S.get("stamps", []).indexOf(STAMP_CK) >= 0, ru = typeof ckGuideOn === "function" && ckGuideOn();
    return '<section class="axs-ckq done" aria-live="polite"><button type="button" class="axs-ckq-x" onclick="ckqHide()" aria-label="닫기">' + X_SVG + "</button>" +
      '<span class="ok" aria-hidden="true">' + CHECK_SVG + '</span><p class="h">수령 완료</p><p class="s">' + esc(KIT_ITEM + sz + " + 에코백") + "</p>" +
      (ck ? '<div class="rw"><span>사전등록 체크인</span><i class="dots" aria-label="스탬프 3개"><b></b><b></b><b></b></i></div>' : "") +
      (ru ? '<div class="rw"><span>다음</span><b>1F EVENT 룰렛 1회</b></div><button type="button" class="ax-button" onclick="ckqHide(); ckGuideOpen(true)">룰렛 보기</button>' : "") + "</section>";
  }
  var call = q.st === "call", ah = Number(q.ah) || 0, soon = !call && ah <= 1, nm = (S.get("user", {}) || {}).name || "";
  var chip = call ? (q.miss ? "놓친 번호" : "호출") : soon ? "곧 차례" : "대기 중";
  var ln = call ? (q.miss ? "아무 때나 " + q.w + " 창구에서 QR을 보여 주세요" : q.w + " 창구로 오세요") : soon ? q.w + " 창구로 오세요 · 앞에 " + ah + "명" : q.w + " 창구 · 앞에 " + ah + "명" + (q.eta ? " · 약 " + q.eta + "분" : "");
  var sb = call ? "내 QR을 보여 주시면 바로 드려요" : soon ? "창구 앞에서 기다려 주세요" : "차례가 되면 진동으로 알려요 · 근처에서 기다려도 돼요";
  return '<section class="axs-ckq' + (call ? " call" : soon ? " soon" : "") + '" aria-live="polite"><p class="tp"><span>내 번호</span><span class="ch">' + chip + "</span></p>" +
    '<p class="no">' + esc(q.no) + "</p>" + (nm ? '<p class="nm">' + esc(nm) + "</p>" : "") + '<p class="ln">' + esc(ln) + '</p><p class="sb">' + esc(sb) + "</p>" +
    (call ? '<button type="button" class="ax-button axs-ckq-qr" onclick="qrPanelOpen(\'mine\')">내 QR 열기</button>' : "") + "</section>";
}
function kitCardHtml() {
  var k = kitMy();
  if (!k) return "";
  var seen = S.get("kit_seen", "") === kitSeenKey(k), t = "", m = "", a = "보기";
  if (k.st === "pick" && k.ph === "open" && !k.sz) { t = "플리스 사이즈 고르기"; m = "마감 " + kitWhen(k.close); a = "고르기"; }
  else if (k.st === "pick" && k.ph === "chg" && k.how === "auto" && !seen) { t = kitRo(k.sz) + " 배정됐어요"; m = "바꾸기 " + kitWhen(k.chg) + "까지 · 남은 사이즈만"; }
  else if (k.st === "hum" && (k.ph === "open" || k.ph === "chg") && !seen) { t = "AX 라운지 사전 신청 키트 안내"; m = "1F 주차장 체크인존에서 가습기로 드려요"; }
  if (!t) return "";
  return '<button type="button" class="ax-destination axs-dest" onclick="kitOpen()">' +
    '<span class="axs-tx"><span class="axs-chiprow"><span class="axs-chip">사전 신청 키트</span></span>' +
    '<span class="ax-card-title">' + esc(t) + '</span><span class="ax-meta">' + esc(m) + "</span></span>" +
    '<span class="ax-destination-action">' + a + "</span></button>";
}
/* 나의 참여 › 나의 보상 한 줄 · 설정 줄 */
function kitMyRowHtml() {
  var k = kitMy();
  if (!k) return "";
  var t = k.st === "hum" ? "사전 신청 키트 · 가습기" : k.sz ? "플리스 사이즈 " + k.sz : "플리스 사이즈 고르기", d = k.st === "hum" ? "1F 주차장 체크인존" : k.sz ? KIT_GET : "마감 " + kitWhen(k.close);
  return '<div class="axs-list">' + axDest(esc(t), esc(d), lnkChev(k.st === "pick" && !k.sz && kitCanSet(k) ? "고르기" : "보기"), "kitOpen()") + "</div>";
}
function kitFsRow() {
  var b = el("fsKit"), k = kitMy(), st = el("fsKitSt");
  if (!b) return;
  b.hidden = !k;
  if (st) st.textContent = !k ? "" : k.st === "hum" ? "가습기" : k.sz || "고르기 전";
}
function kitOpen() {
  var k = kitMy();
  if (!k) return;
  KIT.sel = ""; KIT.edit = false; KIT.msg = "";
  S.put("kit_seen", kitSeenKey(k));
  App.go("kit");
}
function kitPick(z) { if (KIT.busy) return; KIT.sel = z; KIT.msg = ""; App.render(); }
function kitEdit(on) { KIT.edit = !!on; KIT.sel = ""; KIT.msg = ""; App.render(); }
function kitSend() {
  var k = kitMy(), u = S.get("user", {}) || {}, z = KIT.sel;
  if (!k || !z || KIT.busy || !BE.on || !u.empId) return;
  KIT.busy = true; App.render();
  beCall({ action: "kit_size_set", emp: u.empId, size: z }, function (res) {
    KIT.busy = false;
    if (res && res.kit && typeof res.kit === "object") S.put("kit", res.kit);
    if (res && res.ok) {
      KIT.sel = ""; KIT.edit = false; KIT.msg = "";
      S.put("kit_seen", kitSeenKey(res.kit));
      App.render(); window.scrollTo(0, 0);
      if (!res.same) pushAsk("kit", {});   /* 가치 순간 · 정한 직후 한 번(pushAsk 가 하루 횟수 · 같은 자리 한 번을 지킨다) */
      return;
    }
    var why = res && res.reason;
    if (why === "nokit") { S.set("kit", null); App.go("home"); return; }
    KIT.sel = "";
    KIT.msg = why === "sold" ? kitGa(res.size || z) + " 방금 마감됐어요. 다른 사이즈를 골라 주세요" : why === "closed" ? "사이즈 변경 기간이 끝났어요" : why === "notopen" ? "아직 고르는 기간이 아니에요" : why === "hum" ? "" : "전달되지 않았어요. 다시 눌러 주세요";
    App.render();
  }, function () { KIT.busy = false; KIT.msg = "연결이 불안정해요. 다시 눌러 주세요"; App.render(); });
}
function kitRowHtml(z, k) {
  var n = k.left && k.left[z] != null ? Number(k.left[z]) : 0, mine = k.sz === z, can = !KIT.busy && (n > 0 || mine), on = KIT.sel === z;
  var st = mine ? "지금 사이즈" : n > 0 ? "남은 " + n : "마감";
  return '<button type="button" class="axs-att axs-kitz" role="radio" aria-checked="' + on + '"' + (can ? ' onclick="kitPick(\'' + z + '\')"' : " disabled") + ">" +
    '<span class="rd" aria-hidden="true"></span><span class="nm">' + z + "</span>" +
    '<span class="st' + (!mine && n > 0 && n <= KIT_LOW ? " low" : "") + '">' + st + "</span></button>";
}
function kitKvHtml(rows) {
  return '<dl class="axs-kitkv">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>";
}
function kitHtml() {
  var k = kitMy();
  if (!k) return '<div class="ax-stack">' + botHtml("사전 신청 키트 안내가 없어요") + "</div>";
  var msg = KIT.msg ? '<p class="axs-kitmsg" role="alert">' + esc(KIT.msg) + "</p>" : "";
  if (k.st === "hum") {
    return '<div class="ax-stack">' +
      '<section class="ax-card axs-kithd"><h2 class="ax-section-title">AX 라운지 사전 신청 키트는 ' + (Number(k.q) || 29) + "명까지예요</h2>" +
      '<p class="ax-description">1F 주차장 체크인존에서 가습기로 드려요</p></section>' +
      '<section class="ax-card">' + kitKvHtml([["수령", esc(KIT_GET)]]) + "</section></div>";
  }
  var head = '<section class="ax-card axs-kithd"><h2 class="ax-section-title">' + KIT_ITEM + " + 에코백</h2>" +
    '<p class="ax-description">' + esc(KIT_GET) + "에서 받아요</p></section>";
  if (k.sz && !KIT.edit) {
    var chg = k.ph === "open" ? kitWhen(k.close) + "까지" : k.ph === "chg" ? kitWhen(k.chg) + "까지 · 남은 사이즈만" : "마감";
    return '<div class="ax-stack">' + msg +
      '<section class="ax-card axs-kitok"><span class="ok" aria-hidden="true">' + CHECK_SVG + "</span>" +
      '<h2 class="ax-type-t3">' + kitRo(k.sz) + (k.how === "auto" ? " 배정됐어요" : " 정했어요") + "</h2>" +
      '<p class="ax-description">' + KIT_ITEM + " " + k.sz + " + 에코백</p></section>" +
      '<section class="ax-card">' + kitKvHtml([["바꾸기", esc(chg)], ["수령", esc(KIT_GET)]]) + "</section>" +
      (kitCanSet(k) ? '<button type="button" class="ax-button ax-button-weak" onclick="kitEdit(1)">사이즈 바꾸기</button>' : "") + "</div>";
  }
  if (k.ph === "before") return '<div class="ax-stack">' + head + '<p class="ax-meta axs-kitnote">' + esc(kitWhen(k.open)) + "부터 고를 수 있어요</p></div>";
  if (k.ph === "end") return '<div class="ax-stack">' + head + '<p class="ax-meta axs-kitnote">고르는 기간이 끝났어요 · 사이즈는 체크인존에서 남은 것으로 드려요</p></div>';
  var note = k.ph === "open" ? esc(kitWhen(k.close)) + "까지 정해 주세요<br>먼저 정한 순서대로 마감돼요 · 안 정하면 남은 사이즈로 배정돼요" : esc(kitWhen(k.chg)) + "까지 남은 사이즈로만 바꿀 수 있어요";
  var z = KIT.sel, go = z && z !== k.sz;
  return '<div class="ax-stack">' + msg + head +
    '<section class="ax-card"><div class="axs-attl" role="radiogroup" aria-label="사이즈">' + KIT_SIZES.map(function (x) { return kitRowHtml(x, k); }).join("") + "</div></section>" +
    '<p class="ax-meta axs-kitnote">' + note + "</p>" +
    '<button type="button" class="ax-button" ' + (KIT.busy ? 'disabled aria-busy="true"' : go ? 'onclick="kitSend()"' : "disabled") + ">" + (KIT.busy ? "정하는 중" : go ? kitRo(z) + (k.sz ? " 바꾸기" : " 정하기") : "사이즈를 골라 주세요") + "</button>" +
    (KIT.edit ? '<button type="button" class="ax-button ax-button-weak" onclick="kitEdit(0)"' + (KIT.busy ? " disabled" : "") + ">그대로 두기</button>" : "") + "</div>";
}
Views.kit = function () { return kitHtml(); };
App.PARENT.kit = "my";
App.TITLES.kit = "사전 신청 키트";
PUSH_T.kit = "받을 때 알려 드려요";   /* 가치 순간 · 정한 직후(10/26 체크인존 안내) */
