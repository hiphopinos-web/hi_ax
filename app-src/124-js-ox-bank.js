/* ════════════════ O/X 은행 공용 · 판 퀴즈 출제(OXS · oxOffList · oxPrefetch · ox_start 토큰) ════════════════
   정리 #10(261005) 유리다리 O/X 게임(game_ox · ox* · oxb* · oxp*)은 지웠다 · 판 퀴즈가 쓰는 O/X 자원만 남긴다 */
var OX_SEEN_MAX = 60;   /* 최근 본 문항 */
var OXS = { tk: "", at: 0, ratio: {}, min: 20, off: [], busy: false };
function oxOffList() { var r = OLY.board && OLY.board.rule && OLY.board.rule.ox; return ((r && r.off) || []).concat(OXS.off || [], oxNewOk() ? [] : QZ_NEW); }   /* v4.98 새 문항은 새 서버(bank 2)에서만 */
/* 판 토큰 · 모두의 선택 비율 · 끈 문항 · 시작 화면에서 미리 · 판을 시작하면 쓰고 다음 판 것을 곧바로 받는다 */
function oxPrefetch(force) {
  if (testMode()) {
    if (force || !OXS.tk) { var R = olyRule().ox; OXS.tk = Date.now().toString(36) + "." + (R.per[0] + Math.floor(Math.random() * R.per[1])) + "." + (R.per[0] + R.per[1] + Math.floor(Math.random() * R.per[2])) + ".local"; OXS.at = Date.now(); OXS.ratio = oxFakeRatio(); OXS.card = { per: QZ_CARD.per, key: QZ_CARD.key, bank: QZ_BANK, sizes: [5, 10] }; }
    return;
  }
  if (!BE.on || OXS.busy || (!force && OXS.tk && Date.now() - OXS.at < 3600000)) return;
  OXS.busy = true;
  beCall({ action: "ox_start" }, function (r) {
    OXS.busy = false;
    if (r && r.ok) { var cw = OXS.card; OXS.tk = r.tk || ""; OXS.at = Date.now(); OXS.ratio = r.ratio || {}; OXS.min = r.min || 20; OXS.off = r.off || []; OXS.card = r.card || false; if (cw !== OXS.card && (App.current === "quiz" || App.current === "quiz_play")) App.render(); }   /* v4.96 card = 판 퀴즈를 아는 서버 */
  }, function () { OXS.busy = false; });
}
/* 테스트 화면 · 가짜 비율(모든 문항 20명 이상) */
function oxFakeRatio() { var o = {}; OX_BANK.forEach(function (x, i) { var n = 24 + (i * 37) % 70, pc = x.a === "O" ? 45 + (i * 13) % 50 : 8 + (i * 17) % 50, k = Math.round(n * pc / 100); o[x.id] = [k, n - k]; }); return o; }
/* 「직원 62%가 O를 골랐어요」 · 고른 사람이 OXS.min(20) 미만이면 빈 문자열 */
function oxRatioText(id) {
  var c = OXS.ratio && OXS.ratio[id]; if (!c || c[0] + c[1] < OXS.min) return "";
  var n = c[0] + c[1], o = Math.round(c[0] * 100 / n);
  return o >= 50 ? "직원 " + o + "%가 O를 골랐어요" : "직원 " + (100 - o) + "%가 X를 골랐어요";
}



