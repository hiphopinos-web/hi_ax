/* ══════════════════════════════════════════════════════════════════════════
   행사 캐릭터 「챗봇」 · 원본 한 곳 (v4.22 · 260923)
   원본 = 참고자료/AX-Festival-Vibe-Handoff/챗봇.svg (200×200) · design.md A-4 · 원본 벡터를 합성만 한다(다시 그리거나 형태를 바꾸지 않는다).
   두 화면이 이 파일 하나를 같이 쓴다. 원본을 두 곳에 복제해 어긋날 수 없게 여기 한 곳에만 둔다.
     · 참가자 앱  웹배포용/index.html            (말풍선 · 빈 화면 · 적립 결과 · 계단 · 점프 러너 · AI O/X · 단어 소나기)
     · 선수 화면  웹배포용/admin/typing.html     (단어 소나기 대전 · rain-engine.js 가 이 파일의 botDotCv 를 쓴다)
   담는 것 = 원본 SVG 문자열(BOT_SVG) · 도트 게임판용 래스터(botDotLoad · botDotCv).
   ※ 옛 마스코트(오렌지 도트 몸통 · 세로로 벌어지는 입 · 콤보 친구)는 260923 사용자 지시로 전부 걷어냈다(design.md A-5 5-15).
     도트 배열로 캐릭터를 새로 그리지 않는다. 캐릭터가 필요하면 이 원본을 줄여 쓴다.
   ══════════════════════════════════════════════════════════════════════════ */
/* 눈 두 개만 깜빡임 대상(.eye) */
var BOT_SVG = '<svg viewBox="0 0 200 200" fill="none" aria-hidden="true">' +
  '<path d="M104.68 56.4898V43.0698C103.23 43.6498 101.66 43.9698 100 43.9698C98.3401 43.9698 96.7601 43.6398 95.3101 43.0598V56.4798C64.7401 58.8698 40.6701 84.4198 40.6701 115.6H40.6201V128.09H159.32V115.6C159.32 84.4098 135.25 58.8698 104.68 56.4798V56.4898Z" fill="#FFC56E"/>' +
  '<path d="M149.96 156.2H50.0399C44.8699 156.2 40.6699 152 40.6699 146.83V131.22H159.32V146.83C159.32 152 155.12 156.2 149.95 156.2" fill="#FF7F32"/>' +
  '<path d="M112.67 31.3099C112.67 38.2999 107 43.9699 100.01 43.9699C93.0203 43.9699 87.3403 38.2999 87.3403 31.3099C87.3403 24.3199 93.0103 18.6499 100.01 18.6499C107.01 18.6499 112.67 24.3199 112.67 31.3099Z" fill="#FF7F32"/>' +
  '<path class="eye" d="M86.5902 99.9999C86.5902 102.94 84.2002 105.33 81.2602 105.33C78.3202 105.33 75.9302 102.94 75.9302 99.9999C75.9302 97.0599 78.3202 94.6699 81.2602 94.6699C84.2002 94.6699 86.5902 97.0599 86.5902 99.9999Z" fill="#282320"/>' +
  '<path class="eye" d="M124.06 99.9999C124.06 102.94 121.67 105.33 118.73 105.33C115.79 105.33 113.4 102.94 113.4 99.9999C113.4 97.0599 115.79 94.6699 118.73 94.6699C121.67 94.6699 124.06 97.0599 124.06 99.9999Z" fill="#282320"/>' +
  "</svg>";
/* 챗봇 도트 · 원본을 한 번 이미지로 읽어 두고(그림이 있는 곳 40~160 × 18~156.2 만 잘라서) 크기별로 도트 캔버스를 만든다.
   쓰는 곳 = AI O/X 유리다리(oxbBot) · 단어 소나기(rgBotDraw). 점프 러너는 제 래스터(JP_BOT)를 쓰지만 원본은 같은 BOT_SVG 다.
   cb = 읽기가 끝나면 한 번 부를 함수(미리보기 다시 그리기 등) · 이미 읽혔으면 부르지 않는다(부른 쪽이 바로 그린다). */
var BOT_DOT = { img: null, ok: false, px: {}, wait: [] };
function botDotLoad(cb) {
  if (cb && !BOT_DOT.ok && BOT_DOT.wait.indexOf(cb) < 0) BOT_DOT.wait.push(cb);
  if (BOT_DOT.img || typeof Image === "undefined") return;
  var svg = BOT_SVG.replace('<svg viewBox="0 0 200 200"', '<svg xmlns="http://www.w3.org/2000/svg" width="264" height="304" preserveAspectRatio="none" viewBox="40 18 120 138.2"').replace(/ class="eye"/g, "");
  var im = new Image();
  im.onload = function () { BOT_DOT.px = {}; BOT_DOT.ok = true; var w = BOT_DOT.wait; BOT_DOT.wait = []; w.forEach(function (f) { try { f(); } catch (e) {} }); };
  im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  BOT_DOT.img = im;
}
/* 챗봇 도트 캔버스 · 원본을 그 크기(도트 칸) 그대로 작은 캔버스에 그리고 가장자리 반투명만 정리한다(윤곽 = 알파 반 이상 · 색 = 원본 세 색 중 가까운 것) · 크기별 한 번
   아직 읽히지 않았으면 null (부른 쪽은 그 프레임을 건너뛴다) */
function botDotCv(w, h) {
  if (!BOT_DOT.ok) return null;
  w = Math.max(4, Math.round(w)); h = Math.max(4, Math.round(h));
  var C = BOT_DOT.px || (BOT_DOT.px = {}), key = w + "x" + h;
  if (C[key]) return C[key];
  var c = document.createElement("canvas"); c.width = w; c.height = h;
  var x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(BOT_DOT.img, 0, 0, w, h);
  var im = x.getImageData(0, 0, w, h), d = im.data, P = [[255, 197, 110], [255, 127, 50], [40, 35, 32]];
  for (var i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) { d[i + 3] = 0; continue; }
    /* 눈 가장자리(몸 색과 눈 색 사이)가 주황으로 잘못 가지 않게 · 붉은 기가 강하면 몸(노랑)·띠(주황) 중 파랑 값으로(주황만 80 미만 · 몸과 눈이 섞인 가장자리는 90 이상), 아니면 밝기로 몸·눈 */
    var lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, bk = d[i] > 200 ? (d[i + 2] < 80 ? 1 : 0) : lum < 120 ? 2 : 0;
    d[i] = P[bk][0]; d[i + 1] = P[bk][1]; d[i + 2] = P[bk][2]; d[i + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  if (Object.keys(C).length > 48) C = BOT_DOT.px = {};
  return (C[key] = c);
}
botDotLoad();
