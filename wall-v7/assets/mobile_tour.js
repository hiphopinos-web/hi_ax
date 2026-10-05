/* v7 데모 · 휴대폰용 자동 투어 + 터치 단추 (261005 · 디자인 시안 · 공개 화면 아님 · 서버를 부르지 않는다)
 * 키보드가 없는 휴대폰에서 데모를 저절로 보여 준다. 켜지는 곳 = 공개 주소 .../wall-v7/ 또는 작업 폴더에서 ?tour=1 (index.html 이 window.AXW_TOUR 를 정한다)
 * 투어 = 0 → 37 → 250(1차 완성) → 300 → 500 → 600 → 1,000 → 1,200 → 2,026(목표 달성) → 2,500 → 처음부터 반복 · 각 단계에서 루프가 한 바퀴 돌고 혜성이 몇 개 박힌다
 * 화면 로직은 wall_v7.js 가 밖으로 낸 window.__wall (set · moment · burst · st · lp · key · cfg) 만 부른다 · wall_v7.js 는 고치지 않는다
 * 단추 = 이전 단계 · 다음 단계 · 혜성 +10 · 일시정지(투어만 멈춘다) · 키보드 키는 그대로(누르면 투어가 멈춘다 · P 로 다시) */
(function () {
  "use strict";
  if (!window.AXW_TOUR || !window.__wall) return;
  var W = window.__wall, body = document.body, $ = function (id) { return document.getElementById(id); };
  body.classList.add("tour");

  /* 휴대폰 · 내부 해상도 상한(장변 약 2,000px) · 로고 점이 작아도 또렷하고 가볍게 */
  try { W.cfg.pxCap = 2000 * 1125; window.dispatchEvent(new Event("resize")); } catch (e) {}

  /* 단계 목록 · set = 그 수 바로 앞에서 시작 · moment = 경계(250 · 500 · 1,000 · 2,026)를 혜성으로 넘는 순간부터 · bursts = [시작 뒤 초, 개수, 퍼지는 초]
     min = 이만큼은 보여 준다(초) · 그다음 루프가 한 바퀴 돌아 로고로 돌아오면 넘어간다 · max = 못 돌아와도 넘어가는 한도 */
  var STEPS = [
    { label: "0", go: function () { W.set(0); }, bursts: [[1.2, 3, 3]], min: 12, max: 30 },
    { label: "37", go: function () { W.set(34); }, bursts: [[1, 3, 3], [9, 3, 3]], min: 12, max: 30 },
    { label: "250", go: function () { W.moment(250); }, bursts: [[20, 3, 3]], min: 24, max: 60 },
    { label: "300", go: function () { W.set(297); }, bursts: [[1, 3, 3], [9, 3, 3]], min: 18, max: 45 },
    { label: "500", go: function () { W.moment(500); }, bursts: [[22, 3, 3]], min: 26, max: 70 },
    { label: "600", go: function () { W.set(597); }, bursts: [[1, 3, 3], [12, 3, 3]], min: 24, max: 60 },
    { label: "1000", go: function () { W.moment(1000); }, bursts: [[26, 3, 3]], min: 30, max: 80 },
    { label: "1200", go: function () { W.set(1197); }, bursts: [[1, 3, 3], [14, 3, 3]], min: 30, max: 70 },
    { label: "2026", go: function () { W.moment(2026); }, bursts: [[16, 3, 3]], min: 18, max: 60 },
    { label: "2500", go: function () { W.set(2497); }, bursts: [[1, 3, 3], [14, 3, 3]], min: 30, max: 70 }
  ];
  var TR = { i: -1, t: 0, cyc0: 0, paused: false, fired: 0, busy: false };
  var fade = $("tbF"), bar = $("tb"), line = $("tbS"), bT = $("tbT");

  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function show(i) {
    TR.i = (i + STEPS.length) % STEPS.length; TR.t = 0; TR.fired = 0; TR.busy = true;
    fade.style.opacity = "1";   /* 단계가 바뀔 때만 0.3초 어두워졌다 돌아온다 · 숫자가 한 번에 뛰는 것을 덮는다 */
    setTimeout(function () {
      STEPS[TR.i].go(); TR.cyc0 = W.lp().cyc; TR.t = 0; TR.fired = 0; TR.busy = false;
      fade.style.opacity = "0";
    }, 320);
  }
  function ready(S) {
    if (TR.t >= S.max) return true;
    if (TR.t < S.min) return false;
    var st = W.st(), lp = W.lp();
    if (st.show || st.fly || st.queued) return false;
    return lp.cyc > TR.cyc0 && lp.k === "logo" && lp.t >= 2;   /* 루프가 한 바퀴 돌고 점등 뒤 로고에서 넘긴다 */
  }
  function tick(dt) {
    if (TR.i < 0 || TR.busy || TR.paused) return;
    TR.t += dt;
    var S = STEPS[TR.i];
    while (TR.fired < S.bursts.length && TR.t >= S.bursts[TR.fired][0]) { var b = S.bursts[TR.fired++]; W.burst(b[1], b[2]); }
    if (ready(S)) show(TR.i + 1);
  }

  /* 투어 시계 · 화면과 같은 방식(프레임 간격 0.1초 상한 · 탭이 숨으면 멈춘다) */
  var last = 0;
  (function loop(now) { requestAnimationFrame(loop); var dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now; if (!document.hidden) tick(dt); })(0);

  /* 상태 줄 */
  setInterval(function () {
    var st = W.st(), lv = Math.min(4, st.lvl), names = W.cfg.names;
    line.innerHTML = "단계 " + lv + " " + names[lv] + " · <b>" + comma(st.n) + "개</b> · 투어 " + (TR.i + 1) + "/" + STEPS.length + (TR.paused ? " · 멈춤" : "");
  }, 250);

  /* 단추 */
  var idle = null;
  function wake() { bar.classList.add("on"); clearTimeout(idle); idle = setTimeout(function () { bar.classList.remove("on"); }, 4000); }
  function setPaused(p) { TR.paused = p; bT.textContent = p ? "재생" : "일시정지"; }
  $("tbP").addEventListener("click", function () { show(TR.i - 1); });
  $("tbN").addEventListener("click", function () { show(TR.i + 1); });
  $("tbC").addEventListener("click", function () { W.key("ArrowUp"); });
  bT.addEventListener("click", function () { setPaused(!TR.paused); });
  ["pointerdown", "touchstart", "mousemove"].forEach(function (ev) { window.addEventListener(ev, wake, { passive: true }); });

  /* 화면 가장자리를 눌러도 −10 · +10 이 되던 데모 동작은 휴대폰에서 오작동이라 막는다(단추는 그대로) */
  window.addEventListener("click", function (e) { if (!(e.target && e.target.closest && e.target.closest("#tb"))) e.stopPropagation(); }, true);

  /* 키보드 · 데모 키를 누르면 투어가 멈춘다(내가 고른 수가 바로 바뀌지 않게) · P = 투어 재생 · 멈춤 */
  var HOLD = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, PageUp: 1, PageDown: 1, "[": 1, "]": 1, Enter: 1, a: 1, t: 1 };
  window.addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "p") { setPaused(!TR.paused); return; }
    if (HOLD[k] || /^[0-9]$/.test(k)) setPaused(true);
  }, true);

  show(0);
  wake();
})();
