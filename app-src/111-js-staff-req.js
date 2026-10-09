/* ════════ 261009 스태프 폰 「운영자에게 요청」 시트 (콘솔 재구성 설계안 W4 · 사용자 261009) ════════
 * 진입 = 스캔 화면 맨 아래 「운영자에게 요청」(연속 스캐너 sscHtml · 관리자 모드 스캔 admScanHtml 의 옛 「재고 · 박스 열기」 자리)
 *   이 폰에서 코드를 아직 안 넣었으면 처음 한 번만(sscCodeAsk · 이어서 이 시트) · 인증은 admA 그대로(스태프 토큰 · 사번)
 * 시트 = 종류 5(QR · 수동 지급 · 스탬프 확인 · 사이즈 교환 · 기타) + 사번(선택) + 메모(선택 40자 · 기타는 메모 필수) + 「요청 보내기」
 *   sreq_add { kind, emp, note, spot(지금 고른 자리), rid(같은 내용 다시 보내기 = 서버 10분 멱등) } → { ok, id, open } · dup = 이미 받음(성공)
 *   내용을 바꾸면 rid 를 새로 만든다(실패 뒤 고쳐 보낸 요청이 앞 요청으로 묻히지 않게) · 자동 재전송 없음
 * 룰렛 자리일 때만 아래에 「룰렛 경품 소진 알림」 켜기 · 끄기(roulette_out on 1|0) · 켤 때만 한 번 더 묻는다(모든 참가자 앱에 보인다) */
var SRQ_K = [["qr", "QR이 안 돼요"], ["pay", "수동 지급 부탁"], ["stamp", "스탬프 확인 부탁"], ["swap", "사이즈 교환"], ["other", "기타"]];
var SRQ = { k: "", emp: "", note: "", rid: "", busy: false, err: "", outAsk: false, outBusy: false, outErr: "" };
function sreqLnk() { return '<button type="button" class="ax-button ax-button-weak" onclick="sreqOpen()">운영자에게 요청</button>'; }
function sreqSp() { return scanSpot(SCAN.spot) || null; }
function sreqRl() { var sp = sreqSp(); return !!sp && sp.kind === "roulette"; }
function sreqKl(k) { var x = SRQ_K.filter(function (r) { return r[0] === k; })[0]; return x ? x[1] : ""; }
function sreqReady() { return !!sreqKl(SRQ.k) && (SRQ.k !== "other" || !!String(SRQ.note || "").trim()); }
function sreqOpen() {
  if (!BE.on) { toast("서버에 연결되지 않아 보낼 수 없어요"); return; }
  if (!cnAuthed()) { SSC_CK.then = function () { sreqOpen(); }; sscCodeAsk(); return; }
  SRQ.err = ""; SRQ.outAsk = false; SRQ.outErr = "";
  sheetOpen({ id: "sreq", title: "운영자에게 요청", body: sreqBody(), noGo: true });
}
function sreqRepaint() { if (SHEET.id === "sreq" && SHEET.spec && el("axsSheet")) { SHEET.spec.body = sreqBody(); sheetPaint(); } }
function sreqBody() {
  var dis = SRQ.busy ? " disabled" : "";
  var kinds = '<div class="axs-stiles ssc-picks" role="group" aria-label="요청 종류">' + SRQ_K.map(function (r) {
    var on = SRQ.k === r[0];
    return '<button type="button" class="axs-stile ssc-pick' + (on ? " on" : "") + '" aria-pressed="' + on + '"' + dis + ' onclick="sreqKind(\'' + r[0] + '\')"><b>' + esc(r[1]) + "</b></button>";
  }).join("") + "</div>";
  var f = '<div class="ax-stack-tight axs-gap12">' +
    '<label class="ax-meta" for="sreqEmp">사번 · 선택</label>' +
    '<input id="sreqEmp" class="ax-field" inputmode="numeric" pattern="[0-9]*" maxlength="12" enterkeyhint="next" autocomplete="off" placeholder="참가자 사번" value="' + esc(SRQ.emp) + '"' + dis +
      ' onfocus="kbFocus(this)" oninput="numOnly(this, event); sreqIn(\'emp\', this.value)" data-imeend="num">' +
    '<label class="ax-meta" for="sreqNote">메모 · ' + (SRQ.k === "other" ? "필수" : "선택") + ' · 40자</label>' +
    '<input id="sreqNote" class="ax-field" maxlength="40" enterkeyhint="send" autocomplete="off" placeholder="예: 3번 창구 · 카메라가 안 켜져요" value="' + esc(SRQ.note) + '"' + dis +
      ' onfocus="kbFocus(this)" oninput="sreqIn(\'note\', this.value)" onkeydown="onEnter(event, sreqGo)"></div>';
  var err = SRQ.err ? '<div class="axs-err" role="alert"><b>' + esc(SRQ.err) + "</b></div>" : "";
  var go = '<button type="button" class="ax-button" id="sreqGo" onclick="sreqGo()"' + (SRQ.busy ? ' disabled aria-busy="true"' : sreqReady() ? "" : " disabled") + ">" + (SRQ.busy ? "보내는 중" : "요청 보내기") + "</button>";
  return '<div class="ax-stack">' + kinds + f + err + go + "</div>" + (sreqRl() ? sreqOutHtml() : "");
}
/* 룰렛 자리 · 소진 알림 · 상태는 sync(rouletteOut)와 같은 roulette_out */
function sreqOutHtml() {
  var out = !!S.get("roulette_out", false), dis = SRQ.outBusy ? " disabled" : "";
  var err = SRQ.outErr ? '<div class="axs-err" role="alert"><b>' + esc(SRQ.outErr) + "</b></div>" : "";
  if (SRQ.outAsk) {
    return '<div class="ssc-opts ax-stack-tight axs-gap12" id="sreqOut"><p class="ax-body">모든 참가자 앱에 룰렛 소진이 보여요 · 찍어도 차감하지 않아요</p>' + err +
      '<button type="button" class="ax-button axs-btn-danger"' + dis + ' onclick="sreqOut(1)">' + (SRQ.outBusy ? "켜는 중" : "소진 알림 켜기") + "</button>" +
      '<button type="button" class="ax-button ax-button-weak"' + dis + ' onclick="SRQ.outAsk = false; SRQ.outErr = \'\'; sreqRepaint()">그만두기</button></div>';
  }
  return '<div class="ssc-opts" id="sreqOut">' + err + '<button type="button" class="ssc-opt" aria-pressed="' + out + '"' + dis + ' onclick="sreqOutTap()"><span>' +
    (out ? "룰렛 경품 소진 알림 끄기" : "룰렛 경품 소진 알림 켜기") + "</span><b>" + (SRQ.outBusy ? "보내는 중" : out ? "켜짐" : "꺼짐") + "</b></button></div>";
}
function sreqKind(k) {
  if (SRQ.busy || !sreqKl(k)) return;
  if (SRQ.k !== k) SRQ.rid = "";
  SRQ.k = k; SRQ.err = "";
  sreqRepaint();
}
/* 입력은 다시 그리지 않는다(한글 조합 · 커서 유지) · 단추 잠금만 바꾼다 */
function sreqIn(f, v) {
  v = String(v || "");
  if (SRQ[f] !== v) SRQ.rid = "";
  SRQ[f] = v;
  var b = el("sreqGo"); if (b && !SRQ.busy) b.disabled = !sreqReady();
}
function sreqWhy(res) {
  var r = res && res.reason, e = String(res && res.err || "");
  if (r === "locked") return admLockedMsg(res);
  if (r === "param") return "입력을 확인해 주세요 · 사번은 3~12자";
  if (r === "full") return "열린 요청이 많아 더 받지 못해요 · 운영 본부에 직접 알려 주세요";
  if (r === "console" || /unknown action/.test(e)) return "이 서버는 아직 요청을 받지 않아요 · 운영 본부에 직접 알려 주세요";
  return "전송 실패 · 다시 눌러주세요";
}
function sreqGo() {
  if (SRQ.busy || !sreqReady()) return;
  var emp = String(SRQ.emp || "").replace(/\s/g, ""), note = String(SRQ.note || "").trim().slice(0, 40), sp = sreqSp();
  if (emp && (emp.length < 3 || emp.length > 12)) { SRQ.err = "사번은 3~12자로 적어 주세요"; sreqRepaint(); return; }
  if (!BE.on) { SRQ.err = "서버에 연결되지 않아 보낼 수 없어요"; sreqRepaint(); return; }
  if (!SRQ.rid) SRQ.rid = "sq" + Date.now().toString(36) + uid();
  var kl = sreqKl(SRQ.k), q = { action: "sreq_add", kind: SRQ.k, emp: emp, note: note, spot: sp ? sscSpotLb(sp).slice(0, 30) : "", rid: SRQ.rid };
  SRQ.busy = true; SRQ.err = ""; sreqRepaint();
  beCall(admA(q), function (res) {
    SRQ.busy = false;
    if (res && res.reason === "auth") { sheetClose(true); admAuthLost(); return; }
    if (res && res.reason === "ended") { sheetClose(true); return; }   /* 행사 종료 · beCall 이 종료 화면 */
    if (!res || (!res.ok && res.reason !== "dup")) { SRQ.err = sreqWhy(res); sreqRepaint(); return; }
    SRQ.k = ""; SRQ.emp = ""; SRQ.note = ""; SRQ.rid = "";
    sheetClose(true);
    toast(res.ok ? "운영자에게 보냈어요 · " + kl + (Number(res.open) > 0 ? " · 대기 " + Number(res.open) + "건" : "") : "이미 보낸 요청이에요 · " + kl);
  }, function () { SRQ.busy = false; SRQ.err = "전송 실패 · 다시 눌러주세요"; sreqRepaint(); });
}
function sreqOutTap() {
  if (SRQ.outBusy) return;
  SRQ.outErr = "";
  if (S.get("roulette_out", false)) { sreqOut(0); return; }
  SRQ.outAsk = true; sreqRepaint();
}
function sreqOut(on) {
  if (SRQ.outBusy) return;
  if (!BE.on) { SRQ.outErr = "서버에 연결되지 않아 바꿀 수 없어요"; sreqRepaint(); return; }
  SRQ.outBusy = true; SRQ.outErr = ""; sreqRepaint();
  beCall(admA({ action: "roulette_out", on: on ? 1 : 0 }), function (res) {
    SRQ.outBusy = false;
    if (res && res.reason === "auth") { sheetClose(true); admAuthLost(); return; }
    if (res && res.reason === "ended") { sheetClose(true); return; }
    if (!res || !res.ok) {
      var r = res && res.reason;
      SRQ.outErr = r === "locked" ? admLockedMsg(res) : r === "console" || /unknown action/.test(String(res && res.err || "")) ? "이 서버는 아직 폰에서 바꿀 수 없어요 · 운영 본부에 직접 알려 주세요" : "전송 실패 · 다시 눌러주세요";
      sreqRepaint(); return;
    }
    var v = "out" in res ? !!res.out : !!on;
    SRQ.outAsk = false;
    S.set("roulette_out", v);
    toast(v ? "룰렛 소진 알림을 켰어요" : "룰렛 소진 알림을 껐어요");
    App.render(); sreqRepaint();
  }, function () { SRQ.outBusy = false; SRQ.outErr = "전송 실패 · 다시 눌러주세요"; sreqRepaint(); });
}
