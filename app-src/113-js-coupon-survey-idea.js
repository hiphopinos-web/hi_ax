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
  var d = new Date();
  return d.getHours() * 60 + d.getMinutes() >= t2m(SURVEY.open);
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

