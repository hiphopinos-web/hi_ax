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
  var base0 = S.get("pp_seen", null) === null || !!S.get("pp_base", 0);   /* 261007 같은 기준선으로 보상 알림도(rwBaseline · 분석 P1) */
  if (base0 && typeof rwBaseline === "function") { var cur0 = S.get("stamps", []), ps0 = S.get("pp_seen", []) || []; rwBaseline(list, ps0.filter(function (id) { return cur0.indexOf(id) < 0; })); }   /* fresh = 스캔이 본 기록에 먼저 적은 새 스탬프 */
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

/* ════════════════ 261006 키트 사이즈 사전 선택 → 261008 기념품 옷 사이즈 선택(사용자 261008 「일반적인 쇼핑몰 디자인 문법 · 재고 · 고유번호 · 스태프 포함」 · 서버 ks* · 검사 §250 · §288) ════════════════
   서버 my.kit 이 있을 때만 보인다(키트명단 사번 + 스태프 의류 명단 사번 · 그 밖의 사람에게는 홈 카드 · 시트 · 설정 줄 · 나의 참여 줄 어디에도 없다 · 사은품 비표시 원칙 260917 의 예외는 대상자에게만)
   k.pool = kit(사전 신청 · 플리스 + 에코백 · 1F 체크인존) | staff(스태프 · 플리스만 · 수령은 따로 안내) · k.no = 신청번호(K-001 · S-001 · 처음 정할 때 서버가 준다 · 바꿔도 같은 번호 · 사번 노출 없음)
   상품 시트 = 읽기용 상세 시트와 같은 바텀 시트(라우트 kit · detPaint · v6.26 공통 높이) · 상품 이미지 자리(사진 없음 = 회색 예시 칸) · 상품명 · 한 줄 설명 · 사이즈 칩(남은 수 · 5개 이하 품절 임박 · 0 품절)
     · 추천 사이즈표(예시 · 접힘) · 아래 고정 주 버튼 「이 사이즈로 신청」 | 「사이즈 변경」 · 신청 뒤 = 완료(신청번호 · 사이즈 · 변경 기한 · 수령)
   신청을 누르면 서버가 잠금 안에서 판정(먼저 온 쪽) · 진 쪽 = 「L이 방금 품절됐어요」 · 마감 전까지 몇 번이든 바꾼다
   st hum = 라운지 사전 신청 등록 순이 수량(29)을 넘은 사람 · 사이즈 없이 가습기 안내(담담하게)
   문구 = 「기념품」 · 「사이즈」만(「사은품」 · 「선물」 · 가격 없음) · 알림 허용은 정한 직후 한 번(가치 순간 · pushAsk kit) */
var KIT = { sel: "", edit: false, busy: false, msg: "", tbl: false, fo: {} };
var KIT_SIZES = ["SS", "L", "2XL", "3XL"], KIT_ITEM = "플리스 재킷", KIT_NAME = "AX Festival 2026 플리스 재킷", KIT_GET = "10/26(월) 08:00부터 · 1F 주차장 체크인존", KIT_GET_ST = "따로 안내해 드려요", KIT_LOW = 5;
/* 261008 실측 사이즈표(사용자 261008 「이 제품 · 글리머 리플렉트 플리스 자켓」 · 제조사 상세 이미지의 표 · 단위 cm · 옛 추천 사이즈표(가슴둘레 · 키 · 몸무게 예시) 폐기) · [사이즈, 총장, 가슴너비, 어깨너비, 소매기장]
   제조사 표 = SS · S · M · L · LL(XL) · 3L(2XL) · 4L · 5L · 우리 사이즈 넷만 · 대응(사용자 261008 ① 「제조사 표기대로」 · 사용자가 보낸 전체 사이즈표) = SS = SS · L = L · 2XL = 제조사 3L · 3XL = 제조사 4L · 값 없는 줄 = 「확인 중」(지금은 없음) */
/* 261008 고르는 기준 한 줄(사용자 261008 「고르는 기준 한 줄 신청 화면에 넣어줘」) · 옷 가슴 둘레(몸통폭 × 2) − 겉옷 여유 15~20cm = 맞는 몸 가슴둘레 · 국내 남성 호수 · 사이즈 칩 아래 · 문구는 kitSheet 안에 바로(검사 샌드박스가 KIT_* 변수를 골라 싣기 때문) */
var KIT_TBL = [["SS", "63", "50", "44", "60"], ["L", "72", "59", "50", "63"], ["2XL", "78", "66", "54", "65"], ["3XL", "80", "70", "56", "66"]];
/* 261008 상품 정보 · 세탁 방법 · 주의사항(사용자 261008 「제조사 상세 페이지 내용을 그대로」 · 접힘 3칸) · 제조사 상세 이미지의 사실 정보만(홍보 문단 · 가격 · 판매처 · 상표 없음) · 세탁 · 주의 = 상세 문구 그대로(띄어쓰기만 앱 기준) */
var KIT_INFO = [["소재", "폴리에스터 100%"], ["원단", "265g/㎡ 플리스 · 부드럽고 따뜻해요"], ["계절", "가을부터 봄까지 데일리로 입어요"], ["색상", "블랙"], ["디테일", "앞 지퍼 · 왼가슴 수납 포켓 · 양옆 주머니 · 뒷목 반사 소재"], ["제조국", "미얀마, 중국"]];
var KIT_WASH = ["30도 이하 찬물 세탁", "이염 방지를 위한 단독 세탁", "중성세제 사용 (표백제 사용 금지)", "자연 건조 (건조기 사용 자제)"];
var KIT_NOTE = ["염색된 의류는 세탁 시 물 빠짐이 발생할 수 있습니다.", "세탁 방법에 따라 제품이 변형되거나 수축될 수 있습니다.", "마찰이 잦은 활동 시 보풀이 생길 수 있습니다.", "프린트 부위는 다림질을 피하거나, 반드시 천을 덧대어 다려 주시기 바랍니다.", "폴리에스터 혼방 소재는 열에 약하므로, 다림질 시 반드시 천을 덧대고 저온으로 다려 주시기 바랍니다."];
var KIT_IMG = "assets/kit/fleece.webp";   /* 261008 상품 사진(홍보부 원본 후리스자켓.png · 블랙 · 가슴 ME to WE · 4:3 · 800px · 옛 제조사 네이비 사진 대체) */
/* 261008 테스트 사번 미리 보기(사용자 261008) · 테스트 계정(testEmp)이 명단에 없으면 이 기기에서만 보이는 신청 화면 · 서버 재고 · 신청번호를 쓰지 않는다(dry) · 고른 사이즈 = 기기 키 kit_t · 「테스트」 표시
   기간 = 운영 설정과 같은 값(열림 10/08 09:00 · 마감 10/21 18:00 · 변경 마감 10/23 18:00) · 앱 「지금」(appNow · 「시각 바꿔 보기」)으로 판정 · 남은 수 = 기본 수량 · 명단에 있으면 서버 my.kit 그대로(일반 참가자 규칙) */
var KIT_T = { open: "2026-10-08 09:00", close: "2026-10-21 18:00", chg: "2026-10-23 18:00", qty: { SS: 50, L: 105, "2XL": 45, "3XL": 20 } };
function kitTestOn() { return typeof testEmp === "function" && testEmp(); }
function kitTestAt(c) { var m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/.exec(c); return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]); }
function kitTest() {
  var t = S.get("kit_t", null) || {}, sz = KIT_SIZES.indexOf(t.sz) >= 0 ? t.sz : "", d = appNow(true), left = {};
  var ph = d < kitTestAt(KIT_T.open) ? "before" : d < kitTestAt(KIT_T.close) ? "open" : d < kitTestAt(KIT_T.chg) ? "chg" : "end";
  KIT_SIZES.forEach(function (z) { left[z] = KIT_T.qty[z] - (z === sz ? 1 : 0); });
  return { st: "pick", ph: ph, open: KIT_T.open, close: KIT_T.close, chg: KIT_T.chg, sz: sz, how: sz ? "pick" : "", left: left, pool: "kit", no: sz ? "테스트" : "", test: 1 };
}
function kitMy() { var k = S.get("kit", null); return k && typeof k === "object" && (k.st === "pick" || k.st === "hum") ? k : typeof kitTestOn === "function" && kitTestOn() ? kitTest() : null; }   /* 261008 명단에 없는 테스트 사번 = 미리 보기(kitTest) */
function kitStaff(k) { return !!k && k.pool === "staff"; }
/* 「2026-10-21 18:00」 → 「10/21(수) 18:00」 */
function kitWhen(c) {
  var m = /^(\d{4})-(\d\d)-(\d\d) (\d\d:\d\d)/.exec(String(c || ""));
  if (!m) return "";
  return Number(m[2]) + "/" + Number(m[3]) + "(" + "일월화수목금토".charAt(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay()) + ") " + m[4];
}
function kitRo(z) { return z + (z === "M" ? "으로" : "로"); }   /* 에스에스로 · 엘로 · 투엑스엘로 · 쓰리엑스엘로(옛 M = 엠으로) */
function kitGa(z) { return z + (/S$/.test(z) ? "가" : "이"); }   /* 에스에스가 · 엘이 · 투엑스엘이 · 쓰리엑스엘이 */
function kitCanSet(k) { return !!k && k.st === "pick" && (k.ph === "open" || k.ph === "chg"); }
function kitSeenKey(k) { return k ? k.st + ":" + k.ph + ":" + (k.sz || "") : ""; }
/* 받는 곳 한 줄 · 사전 신청 = 체크인존(에코백과 함께) · 스태프 = 따로 안내 */
function kitGetTxt(k) { return kitStaff(k) ? KIT_GET_ST : KIT_GET; }
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
  var seen = S.get("kit_seen", "") === kitSeenKey(k), t = "", m = "", a = "보기", no = k.no ? "신청번호 " + k.no + " · " : "";
  if (k.st === "pick" && k.ph === "open" && !k.sz) { t = "기념품 옷 사이즈 선택하기"; m = "마감 " + kitWhen(k.close); a = "선택"; }
  else if (k.st === "pick" && k.ph === "open" && k.sz) { t = kitRo(k.sz) + " 신청 완료"; m = no + "마감 전 변경 가능"; }   /* 261008 고른 뒤 = 결과 한 장(신청번호) · 마감 뒤에는 자동 배정 안내만 */
  else if (k.st === "pick" && k.ph === "chg" && k.how === "auto" && !seen) { t = kitRo(k.sz) + " 배정됐어요"; m = no + "변경 " + kitWhen(k.chg) + "까지 · 남은 사이즈만"; }
  else if (k.st === "hum" && (k.ph === "open" || k.ph === "chg") && !seen) { t = "AX 라운지 사전 신청 키트 안내"; m = "1F 주차장 체크인존에서 가습기로 드려요"; }
  if (!t) return "";
  return '<button type="button" class="ax-destination axs-dest axs-kitcard" onclick="kitOpen()">' +
    '<span class="axs-tx"><span class="axs-chiprow"><span class="axs-chip">' + (k.test ? "테스트" : "기념품") + "</span></span>" +
    '<span class="ax-card-title">' + esc(t) + '</span><span class="ax-meta">' + esc(m) + "</span></span>" +
    '<span class="ax-destination-action">' + a + "</span></button>";
}
/* 나의 참여 › 나의 보상 한 줄 · 설정 줄 */
function kitMyRowHtml() {
  var k = kitMy();
  if (!k) return "";
  var t = k.st === "hum" ? "사전 신청 키트 · 가습기" : k.sz ? "기념품 옷 " + k.sz + (k.no ? " · " + k.no : "") : "기념품 옷 사이즈 선택하기", d = k.st === "hum" ? "1F 주차장 체크인존" : k.sz ? kitGetTxt(k) : "마감 " + kitWhen(k.close);
  return '<div class="axs-list">' + axDest(esc(t), esc(d), lnkChev(k.st === "pick" && !k.sz && kitCanSet(k) ? "선택" : "보기"), "kitOpen()") + "</div>";
}
function kitFsRow() {
  var b = el("fsKit"), k = kitMy(), st = el("fsKitSt");
  if (!b) return;
  b.hidden = !k;
  if (st) st.textContent = !k ? "" : k.st === "hum" ? "가습기" : k.sz || "선택 전";
}
function kitOpen() {
  var k = kitMy();
  if (!k) return;
  KIT.sel = ""; KIT.edit = false; KIT.msg = ""; KIT.tbl = false; KIT.fo = {};
  S.put("kit_seen", kitSeenKey(k));
  KIT_SIZES.forEach(function (z) { try { new Image().src = "assets/kit/fit_" + z + ".webp"; } catch (e) {} });   /* 261008 착용 사진 4장(65KB)을 미리 받아 칩을 누르면 바로 바뀐다 */
  App.go("kit");
}
function kitPick(z) {
  if (KIT.busy) return;
  KIT.sel = z; KIT.msg = ""; App.render();
  /* 261008 사이즈 칩은 사진보다 아래라 사진이 화면 밖이면 바뀐 걸 못 본다 · 사진이 절반 넘게 위로 지나갔을 때만 사진 쪽으로 올려 보여 준다(칩 · 신청 단추는 그대로 아래 있다) */
  try {
    var bd = document.querySelector("#axsDet .axs-dbody"), fg = bd && bd.querySelector(".axs-kitfig");
    var ft = fg ? bd.scrollTop + fg.getBoundingClientRect().top - bd.getBoundingClientRect().top : 0;
    if (fg && bd.scrollTop > ft + fg.offsetHeight * 0.5) bd.scrollTo({ top: Math.max(0, ft - 12), behavior: window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  } catch (e) {}
}
function kitEdit(on) { KIT.edit = !!on; KIT.sel = ""; KIT.msg = ""; App.render(); kitTop(); }
function kitTbl() { KIT.tbl = !KIT.tbl; App.render(); }
function kitFold(k) { KIT.fo = KIT.fo || {}; KIT.fo[k] = !KIT.fo[k]; App.render(); }   /* 261008 상품 정보 · 세탁 방법 · 주의사항 접힘 */
function kitTop() { var bd = document.querySelector("#axsDet .axs-dbody"); if (bd) bd.scrollTop = 0; }
function kitSend() {
  var k = kitMy(), u = S.get("user", {}) || {}, z = KIT.sel;
  if (k && k.test && z && !KIT.busy && kitCanSet(k)) {   /* 261008 테스트 사번 미리 보기 · 서버에 보내지 않는다(이 기기만) */
    S.put("kit_t", { sz: z, at: Date.now() }); KIT.sel = ""; KIT.edit = false; KIT.msg = "";
    S.put("kit_seen", kitSeenKey(kitMy())); App.render(); kitTop(); toast("테스트 · 이 기기에만 저장했어요"); return;
  }
  if (!k || !z || KIT.busy || !BE.on || !u.empId) return;
  KIT.busy = true; App.render();
  beCall({ action: "kit_size_set", emp: u.empId, size: z }, function (res) {
    KIT.busy = false;
    if (res && res.kit && typeof res.kit === "object") S.put("kit", res.kit);
    if (res && res.ok) {
      KIT.sel = ""; KIT.edit = false; KIT.msg = "";
      S.put("kit_seen", kitSeenKey(res.kit));
      App.render(); kitTop();
      if (!res.same) pushAsk("kit", {});   /* 가치 순간 · 정한 직후 한 번(pushAsk 가 하루 횟수 · 같은 자리 한 번을 지킨다) */
      return;
    }
    var why = res && res.reason;
    if (why === "nokit") { S.set("kit", null); detClose(); return; }
    KIT.sel = "";
    KIT.msg = why === "sold" ? kitGa(res.size || z) + " 방금 품절됐어요. 다른 사이즈를 골라 주세요" : why === "closed" ? "사이즈 변경 기간이 끝났어요" : why === "notopen" ? "아직 신청 기간이 아니에요" : why === "hum" ? "" : "전달되지 않았어요. 다시 눌러 주세요";
    App.render(); kitTop();
  }, function () { KIT.busy = false; KIT.msg = "연결이 불안정해요. 다시 눌러 주세요"; App.render(); });
}
/* 사이즈 칩 한 칸 · 남은 수 · 5개 이하 = 품절 임박(error 글자) · 0 = 품절(회색 · 눌리지 않음) · 지금 내 사이즈 = 「지금」 표 */
function kitChipHtml(z, k) {
  var n = k.left && k.left[z] != null ? Number(k.left[z]) : 0, mine = k.sz === z, out = n <= 0 && !mine, low = !out && !mine && n <= KIT_LOW;
  var can = !KIT.busy && !out && kitCanSet(k), on = KIT.sel === z;
  var st = out ? "품절" : n + "개 남음", lb = z + " · " + (out ? "품절" : (low ? "품절 임박 · " : "") + n + "개 남음") + (mine ? " · 지금 사이즈" : "");
  return '<button type="button" class="axs-kitc' + (on ? " on" : "") + (out ? " out" : "") + (low ? " low" : "") + (mine ? " me" : "") + '" role="radio" aria-checked="' + on + '" aria-label="' + lb + '"' + (can ? ' onclick="kitPick(\'' + z + '\')"' : " disabled") + ">" +
    '<span class="z" aria-hidden="true">' + z + "</span>" + (low ? '<span class="lw" aria-hidden="true">품절 임박</span>' : "") + '<span class="n" aria-hidden="true">' + st + "</span>" +
    (mine ? '<span class="me" aria-hidden="true">지금</span>' : "") + "</button>";
}
function kitKvHtml(rows) {
  return '<dl class="axs-kitkv">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>";
}
/* 상품 사진 · 261008 제조사 대표 사진(앞모습 · 「샘플」 딱지 없음 · 옛 회색 「상품 이미지」 예시 칸 대체) · 큰 칸(상품 화면) · 작은 칸(완료 요약)
   261008 사이즈별 착용 사진(사용자 「얼굴 넣은 것으로 앱에 반영해줘」) · 큰 칸 = z(고른 사이즈 · 없으면 신청한 사이즈)가 있으면 그 착용 사진 + 아래 캡션 「모델 175cm · 70kg · L 착용」 · 없으면 상품 사진 · 칸은 늘 정사각(높이 고정 · 사진 비율이 달라도 레이아웃이 안 움직임) · hint = 사이즈 칩이 있는 화면의 고르기 전 한 줄(캡션 자리를 비워 두지 않음) · 데이터는 지역 값(검사 샌드박스가 KIT_* 변수를 골라 싣기 때문) */
function kitImgHtml(sm, z, hint) {
  var FIT = { SS: "158cm · 50kg", L: "175cm · 70kg", "2XL": "180cm · 85kg", "3XL": "183cm · 100kg" }, fit = !sm && z && FIT[z] ? FIT[z] : "";
  var cap = fit ? "모델 " + fit + " · " + z + " 착용" : "";
  var img = fit ? '<img src="assets/kit/fit_' + z + '.webp" alt="' + cap + '" width="680" height="1024" decoding="sync">' : '<img src="' + KIT_IMG + '" alt="' + (sm ? "" : KIT_ITEM + " 앞모습") + '" width="800" height="600" decoding="async">';
  var box = '<div class="axs-kitimg has' + (sm ? " sm" : "") + (fit ? " fit" : "") + '">' + img + "</div>";
  if (sm) return box;
  return '<div class="axs-kitfig">' + box + (cap || hint ? '<p class="ax-meta axs-kitcap">' + (cap || "사이즈를 누르면 착용 사진이 보여요") + "</p>" : "") + "</div>";
}
/* 접힘 한 칸(사이즈표와 같은 문법) · 제목 줄 = 버튼(aria-expanded) · 펼치면 아래에 내용 */
function kitFoldHtml(id, title, open, onclick, inner) {
  return '<section class="axs-kittbl"><button type="button" class="axs-kittog" aria-expanded="' + open + '"' + (open ? ' aria-controls="' + id + '"' : "") + ' onclick="' + onclick + '"><span>' + title + "</span>" + CHEV_SVG + "</button>" +
    (open ? '<div class="axs-kittb" id="' + id + '">' + inner + "</div>" : "") + "</section>";
}
/* 실측 사이즈표 · 접힘(KIT.tbl) · 표 위 「단위 cm · 재는 위치에 따라 오차」 · 값이 없는 줄 = 네 칸을 합친 「확인 중」 */
function kitTblHtml() {
  var tb = '<p class="ax-meta">단위 cm · 재는 위치에 따라 오차가 있을 수 있어요</p><table><thead><tr><th scope="col">사이즈</th><th scope="col">총장</th><th scope="col">가슴너비</th><th scope="col">어깨너비</th><th scope="col">소매기장</th></tr></thead><tbody>' +
    KIT_TBL.map(function (r) { return '<tr><th scope="row">' + r[0] + "</th>" + (r.length > 1 ? "<td>" + r.slice(1).join("</td><td>") + "</td>" : '<td colspan="4" class="tbd">확인 중</td>') + "</tr>"; }).join("") + "</tbody></table>";
  return kitFoldHtml("kitTb", "실측 사이즈표", !!KIT.tbl, "kitTbl()", tb);
}
/* 상품 정보(소재 · 원단 · 색상 · 디테일 · 제조국 · 값 줄) · 세탁 방법 · 주의사항(점 목록) · 순서 = 상품 정보 → 실측 사이즈표 → 세탁 방법 → 주의사항 */
function kitFoldsHtml() {
  var fo = KIT.fo || {};
  var ul = function (a) { return '<ul class="axs-kitul">' + a.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>"; };
  return kitFoldHtml("kitFoInfo", "상품 정보", !!fo.info, "kitFold('info')", kitKvHtml(KIT_INFO) + '<p class="ax-meta">g/㎡는 1제곱미터당 몇 그램인지 나타내는 단위예요. 숫자가 클수록 더 두껍고 무거워요</p>') +
    kitTblHtml() +
    kitFoldHtml("kitFoWash", "세탁 방법", !!fo.wash, "kitFold('wash')", ul(KIT_WASH)) +
    kitFoldHtml("kitFoNote", "주의사항", !!fo.note, "kitFold('note')", ul(KIT_NOTE));
}
/* 상품 머리(이미지 · 상품명 · 한 줄 설명) */
function kitProdHtml(k) {
  return kitImgHtml(0, KIT.sel || k.sz || "", k.ph === "open" || k.ph === "chg") + '<section class="axs-kitprod"><p class="axs-kitbr">AX Festival 2026</p><h3 class="ax-type-t3">' + KIT_ITEM + "</h3>" +
    '<p class="ax-description">' + (kitStaff(k) ? "스태프용 행사 기념 플리스예요 · 부드럽고 따뜻한 폴리에스터" : "행사 기념 플리스 · 에코백과 함께 받아요") + "</p></section>";
}
/* 신청 완료 · 신청번호 · 사이즈 · 변경 기한 · 수령 */
function kitDoneHtml(k) {
  var chg = k.ph === "open" ? kitWhen(k.close) + "까지 변경 가능" : k.ph === "chg" ? kitWhen(k.chg) + "까지 · 남은 사이즈만" : "마감";
  return kitImgHtml(0, k.sz) + '<section class="axs-kitok"><span class="ok" aria-hidden="true">' + CHECK_SVG + "</span>" +
    '<h3 class="ax-type-t3">' + kitRo(k.sz) + (k.how === "auto" ? " 배정됐어요" : " 신청 완료") + "</h3>" +
    (k.no ? '<p class="axs-kitno">신청번호 <b>' + esc(k.no) + "</b></p>" : "") + "</section>" +
    '<section class="axs-kitsum">' + kitImgHtml(1) + '<div class="tx"><b>' + KIT_NAME + '</b><span>사이즈 ' + esc(k.sz) + (kitStaff(k) ? "" : " · 에코백 포함") + "</span></div></section>" +
    kitKvHtml([["신청번호", k.no ? "<b>" + esc(k.no) + "</b>" : "확인 중"], ["사이즈", esc(k.sz)], ["변경", esc(chg)], ["수령", esc(kitGetTxt(k))]]) +
    '<p class="ax-meta axs-kitnote">교환할 때 신청번호를 알려 주세요</p>';
}
/* 상품 시트(detPaint · 라우트 kit) */
function kitSheet() {
  var k = kitMy(), nm = "기념품 옷 사이즈";
  if (!k) return { name: nm, body: botHtml("기념품 옷 신청 안내가 없어요"), fit: 1 };
  if (k.st === "hum") {
    return { name: "사전 신청 키트", fit: 1, body: '<section class="axs-kithd"><h3 class="ax-type-t3">AX 라운지 사전 신청 키트는 ' + (Number(k.q) || 29) + "명까지예요</h3>" +
      '<p class="ax-description">1F 주차장 체크인존에서 가습기로 드려요</p></section>' + kitKvHtml([["수령", esc(KIT_GET)]]) };
  }
  var msg = (k.test ? '<p class="ax-meta axs-kitnote axs-kittest">테스트 계정 미리 보기 · 서버에 저장하지 않아요</p>' : "") + (KIT.msg ? '<p class="axs-kitmsg" role="alert">' + esc(KIT.msg) + "</p>" : "");   /* 261008 테스트 사번 미리 보기 표시 */
  if (k.sz && !KIT.edit) return { name: nm, body: msg + kitDoneHtml(k), foot: kitCanSet(k) ? progBtn("사이즈 변경", "kitEdit(1)", "ax-button-weak") : "" };
  var ph = k.ph, note = ph === "before" ? esc(kitWhen(k.open)) + "부터 신청할 수 있어요" : ph === "end" ? "신청 기간이 끝났어요" + (kitStaff(k) ? "" : " · 사이즈는 체크인존에서 남은 것으로 드려요") :
    ph === "open" ? "먼저 신청한 순서대로 품절돼요 · 신청하지 않으면 남은 사이즈로 배정돼요" : esc(kitWhen(k.chg)) + "까지 남은 사이즈로만 바꿀 수 있어요";
  var chips = '<section class="axs-kitsz"><div class="axs-kitszh"><h3 class="ax-type-t5-strong">사이즈</h3>' + (ph === "open" ? '<span class="ax-meta">마감 ' + esc(kitWhen(k.close)) + "</span>" : "") + "</div>" +
    '<div class="axs-kitcs" role="radiogroup" aria-label="사이즈">' + KIT_SIZES.map(function (x) { return kitChipHtml(x, k); }).join("") + "</div>" +
    '<p class="ax-meta axs-kitnote axs-kitgd">평소 90 이하 SS · 95~100 L · 105 L(딱 맞게) 또는 2XL(넉넉하게) · 110~115 2XL · 120 3XL</p>' +   /* 261008 고르는 기준 */
    '<p class="ax-meta axs-kitnote">' + note + "</p></section>";
  var body = msg + kitProdHtml(k) + (ph === "end" ? '<p class="ax-meta axs-kitnote">' + note + "</p>" : chips) + kitFoldsHtml() + kitKvHtml([["수령", esc(kitGetTxt(k))]]);
  var foot = "";
  if (kitCanSet(k)) {
    var z = KIT.sel, go = !!z && z !== k.sz, lb = KIT.busy ? "신청하는 중" : k.sz ? "사이즈 변경" : "이 사이즈로 신청";
    foot = '<button type="button" class="ax-button" ' + (KIT.busy ? 'disabled aria-busy="true"' : go ? 'onclick="kitSend()"' : "disabled") + ">" + lb + "</button>" +
      (KIT.edit ? progBtn("그대로 두기", "kitEdit(0)", "ax-button-weak", "", KIT.busy) : "");
  }
  return { name: nm, body: body, foot: foot };
}
Views.kit = function () { var sp = kitSheet(); return '<div class="ax-stack">' + sp.body + (sp.foot || "") + "</div>"; };   /* 라우터가 Views 키로 화면을 확인한다 · 그리기는 시트(detPaint · DET_SPEC.kit) · 이 몸통은 시트를 못 그릴 때의 대체 */
App.PARENT.kit = "my";
App.TITLES.kit = "기념품 옷 사이즈";
PUSH_T.kit = "받을 때 알려 드려요";   /* 가치 순간 · 정한 직후(10/26 체크인존 안내) */
