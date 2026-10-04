/* ════════════════ 게임 공통 ════════════════ */
/* ═══ v4.23 게임 화면 16비트 레트로 · 경계와 글꼴 (260923 사용자 확정 · design.md A-5 5-16) ═══
   .rt 가 붙는 곳 = 아래 화면(#view) + 게임 오버레이(#rgPlay) 뿐이다. 홈 · 프로그램 · 신청 · 나의 참여에는 붙지 않는다.
   글꼴(Neo둥근모 44KB)은 부팅 3초 뒤 한 번, 그리고 게임 화면에 들어설 때 미리 읽는다 · 읽기 전에는 Pretendard 로 그린다(swap) · 실패해도 게임은 그대로 돈다. */
function rtView(v) { return ["game_tetris", "game_pang", "game_jump", "type_site", "type_rank", "oly_rank", "wall_type"].indexOf(v) >= 0; }
var RT_FONT_WARM = 0, RT_BOT_URL = "";
function rtFontWarm() {
  if (RT_FONT_WARM || !document.fonts || !document.fonts.load) return;
  RT_FONT_WARM = 1;
  document.fonts.load('16px "NeoDunggeunmo"', "가A0").then(function () { RT_FONT_WARM = 2; }, function () { RT_FONT_WARM = 0; });
}
setTimeout(rtFontWarm, 3000);
/* 말풍선 초상 · 챗봇 원본(assets/bot.js)의 도트 래스터(22×26 칸)를 그림 한 장으로 · 새로 그리지 않는다(design.md A-4) · 아직 안 읽혔으면 원본 SVG */
function rtBotImg() {
  if (RT_BOT_URL) return RT_BOT_URL;
  var c = typeof botDotCv === "function" ? botDotCv(22, 26) : null;
  if (!c) { if (typeof botDotLoad === "function") botDotLoad(); return ""; }
  try { RT_BOT_URL = c.toDataURL("image/png"); } catch (e) { RT_BOT_URL = ""; }
  return RT_BOT_URL;
}
