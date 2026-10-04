// 혼잡도 계수기 · 전시 모드 (261003)
// 카메라를 숨기지 않고 세워 두고, 옆 화면에는 사람을 점으로만 보인다. "얼굴이 아니라 사람 수만 센다"를 화면이 스스로 말하게 한다.
// - 원본 영상 · 모자이크를 그리지 않는다. 이 파일은 영상 요소에 손대지 않고, 엔진이 낸 상자(숫자)만 읽는다.
// - 계수 · 구역 · 서버 전송은 계수 화면 엔진(app.js)이 그대로 돌린다. 여기서는 그리기만 한다.
// - 점 = 사람의 발 위치(상자 아래 가운데). 인식이 바뀔 때만 움직인다: 최근접 매칭 + 보간, 사라질 때 서서히.
// - 가까운 점끼리는 옅은 선으로 잇는다(나의 점이 모여 우리). 측정 화면임이 먼저 보이도록 선은 약하게.
// 진입: index.html?mode=exhibit 또는 머리 줄 「전시 모드 열기」. 나가기: Esc 또는 왼쪽 위 모서리 1.5초 누르기.

import { greedyMatch } from "../../engine/tracking.js";   // AX magic 공용 엔진 · 거리순 짝짓기

const O100 = "#FF7E31", O50 = "255,178,132", GRID = "#262A2E", FRAME = "#5A6168", ZONE = "rgba(217,217,217,.28)";
const MATCH = 0.14;     // 같은 사람으로 이을 최대 거리(화면 긴 변 대비)
const LINK = 0.2;       // 점을 선으로 잇는 최대 거리
const MOVE_S = 0.35, FADE_S = 0.6, EXIT_MS = 1500, IDLE_MS = 3000;

export function initExhibit(eng) {
  const root = document.createElement("div");
  root.className = "ex";
  root.setAttribute("aria-label", "전시 화면");
  root.innerHTML = `
    <canvas class="ex-cv" aria-hidden="true"></canvas>
    <div class="ex-exit" aria-hidden="true"></div>
    <div class="ex-head"><span class="ex-brand">ME to WE</span><span class="ex-event">AX Festival 2026</span></div>
    <div class="ex-field"><div class="ex-wait" hidden></div></div>
    <div class="ex-foot">
      <div class="ex-lbl">지금 이 앞</div>
      <div class="ex-now"><span class="ex-num">0</span><span class="ex-unit">명</span></div>
      <div class="ex-rule"><i></i>점 하나 = 한 사람</div>
      <div class="ex-priv">점만 셉니다 · 영상 저장 없음</div>
    </div>`;
  document.body.appendChild(root);
  const cv = root.querySelector(".ex-cv"), c = cv.getContext("2d");
  const field = root.querySelector(".ex-field"), numEl = root.querySelector(".ex-num"), waitEl = root.querySelector(".ex-wait");

  let on = false, raf = 0, lastT = 0, lastDets = null, shownN = -1, nextId = 1;
  let tracks = [];   // { id, x, y, tx, ty, a, dying } · x,y 는 원본 기준 0~1

  // ---------- 점 따라가기 ----------
  function feet(src, dets) {
    return dets.map((d) => [(d.x + d.w / 2) / src.w, Math.min(1, (d.y + d.h) / src.h)]);
  }
  function retarget(src, dets) {
    const pts = feet(src, dets);
    const k = Math.max(src.w, src.h);
    const sx = src.w / k, sy = src.h / k;   // 가로 · 세로 비율을 살린 거리
    const live = tracks.filter((t) => !t.dying);
    const m = greedyMatch(live, pts, (t, p) => { const d = Math.hypot((t.tx - p[0]) * sx, (t.ty - p[1]) * sy); return d < MATCH ? d : Infinity; });
    for (const [i, j] of m.pairs) { live[i].tx = pts[j][0]; live[i].ty = pts[j][1]; }
    for (const i of m.freeT) live[i].dying = true;
    for (const j of m.freeP) { const p = pts[j]; tracks.push({ id: nextId++, x: p[0], y: p[1], tx: p[0], ty: p[1], a: 0, dying: false }); }
  }
  function step(dt) {
    const km = 1 - Math.exp(-dt / MOVE_S), kf = dt / FADE_S;
    for (const t of tracks) {
      t.x += (t.tx - t.x) * km;
      t.y += (t.ty - t.y) * km;
      t.a = t.dying ? Math.max(0, t.a - kf) : Math.min(1, t.a + kf);
    }
    tracks = tracks.filter((t) => !(t.dying && t.a <= 0));
  }

  // ---------- 그리기 ----------
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(root.clientWidth * dpr), H = Math.round(root.clientHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const rb = root.getBoundingClientRect(), fb = field.getBoundingClientRect();
    return { dpr, x: (fb.left - rb.left) * dpr, y: (fb.top - rb.top) * dpr, w: fb.width * dpr, h: fb.height * dpr };
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, lastT ? (now - lastT) / 1000 : 0);
    lastT = now;
    const src = eng.src(), dets = eng.dets();
    if (src && dets !== lastDets) { lastDets = dets; retarget(src, dets); }
    if (!src && tracks.length) tracks.forEach((t) => (t.dying = true));
    step(dt);

    const n = src ? eng.counts().total : 0;
    if (n !== shownN) { shownN = n; numEl.textContent = String(n); }
    const wait = !eng.ready() ? "인식 준비 중" : !src ? "카메라 대기" : "";
    if (waitEl.textContent !== wait) waitEl.textContent = wait;
    waitEl.hidden = !wait;

    const f = fit(), dpr = f.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#000";
    c.fillRect(0, 0, cv.width, cv.height);
    // 카메라 화각을 점 화면 안에 비율 그대로 담는다(잘라 내지 않는다 · 화각 밖 사람이 없어지지 않게)
    const ar = src ? src.w / src.h : 16 / 9;
    let w = f.w, h = w / ar;
    if (h > f.h) { h = f.h; w = h * ar; }
    const ox = f.x + (f.w - w) / 2, oy = f.y + (f.h - h) / 2;
    drawGrid(ox, oy, w, h, dpr);
    drawZones(ox, oy, w, h, dpr);
    drawLinks(ox, oy, w, h, dpr);
    drawDots(ox, oy, w, h, dpr);
  }
  function drawGrid(ox, oy, w, h, dpr) {
    const g = w / 28, r = Math.max(1.2, dpr * 1.3);
    c.fillStyle = GRID;
    for (let y = g / 2; y < h; y += g) for (let x = g / 2; x < w; x += g) { c.beginPath(); c.arc(ox + x, oy + y, r, 0, 6.2832); c.fill(); }
    // 화각 모서리 표시 · 측정 화면임을 보이는 최소한의 틀
    const L = Math.min(w, h) * 0.06;
    c.strokeStyle = FRAME; c.lineWidth = 2 * dpr; c.lineCap = "square";
    c.beginPath();
    c.moveTo(ox, oy + L); c.lineTo(ox, oy); c.lineTo(ox + L, oy);
    c.moveTo(ox + w - L, oy); c.lineTo(ox + w, oy); c.lineTo(ox + w, oy + L);
    c.moveTo(ox + w, oy + h - L); c.lineTo(ox + w, oy + h); c.lineTo(ox + w - L, oy + h);
    c.moveTo(ox + L, oy + h); c.lineTo(ox, oy + h); c.lineTo(ox, oy + h - L);
    c.stroke();
  }
  function drawZones(ox, oy, w, h, dpr) {
    const zs = eng.zones() || [];
    if (!zs.length) return;
    c.save();
    c.strokeStyle = ZONE; c.lineWidth = 1.5 * dpr; c.setLineDash([6 * dpr, 6 * dpr]);
    for (const z of zs) {
      c.beginPath();
      z.pts.forEach((p, k) => (k ? c.lineTo(ox + p[0] * w, oy + p[1] * h) : c.moveTo(ox + p[0] * w, oy + p[1] * h)));
      c.closePath(); c.stroke();
    }
    c.restore();
  }
  function drawLinks(ox, oy, w, h, dpr) {
    const k = Math.max(w, h);
    c.lineWidth = 1.5 * dpr;
    for (let i = 0; i < tracks.length; i++) for (let j = i + 1; j < tracks.length; j++) {
      const p = tracks[i], q = tracks[j];
      const d = Math.hypot((p.x - q.x) * w, (p.y - q.y) * h) / k;
      if (d >= LINK) continue;
      const a = (1 - d / LINK) * 0.45 * Math.min(p.a, q.a);
      if (a < 0.02) continue;
      c.strokeStyle = `rgba(${O50},${a.toFixed(3)})`;
      c.beginPath(); c.moveTo(ox + p.x * w, oy + p.y * h); c.lineTo(ox + q.x * w, oy + q.y * h); c.stroke();
    }
  }
  function drawDots(ox, oy, w, h, dpr) {
    const r = Math.max(7 * dpr, Math.min(w, h) * 0.022);
    for (const t of tracks) {
      const x = ox + t.x * w, y = oy + t.y * h, s = 0.6 + 0.4 * t.a;
      c.globalAlpha = t.a;
      c.fillStyle = `rgba(${O50},.22)`;
      c.beginPath(); c.arc(x, y, r * 2 * s, 0, 6.2832); c.fill();
      c.fillStyle = O100;
      c.beginPath(); c.arc(x, y, r * s, 0, 6.2832); c.fill();
    }
    c.globalAlpha = 1;
  }

  // ---------- 열고 닫기 ----------
  function open(fromClick) {
    if (on) return;
    on = true;
    document.body.classList.add("exhibit-on");
    lastDets = null; tracks = []; shownN = -1; lastT = 0;
    raf = requestAnimationFrame(frame);
    if (fromClick && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!eng.src() && eng.start) eng.start();
    poke();
  }
  function close() {
    if (!on) return;
    on = false;
    cancelAnimationFrame(raf);
    document.body.classList.remove("exhibit-on");
    root.classList.remove("idle");
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    try {
      const u = new URL(location.href);
      if (u.searchParams.get("mode") === "exhibit") { u.searchParams.delete("mode"); history.replaceState(null, "", u.pathname + u.search + u.hash); }
    } catch (e) { /* 주소 정리 실패는 무시 */ }
  }

  // 마우스가 3초 멈추면 숨긴다(TV 앞에 커서가 남지 않게)
  let idleT = 0;
  function poke() { root.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => on && root.classList.add("idle"), IDLE_MS); }
  root.addEventListener("pointermove", poke);

  // 나가기 · Esc, 또는 왼쪽 위 모서리 길게 누르기
  document.addEventListener("keydown", (e) => { if (on && e.key === "Escape") close(); });
  const ex = root.querySelector(".ex-exit");
  let hold = 0;
  ex.addEventListener("pointerdown", (e) => { e.preventDefault(); clearTimeout(hold); hold = setTimeout(close, EXIT_MS); });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) ex.addEventListener(ev, () => clearTimeout(hold));
  root.addEventListener("contextmenu", (e) => e.preventDefault());
  // 주소로 들어왔을 때 첫 누름에 전체 화면을 청한다(브라우저는 누름 없이 전체 화면을 허락하지 않는다)
  root.addEventListener("pointerdown", () => {
    if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  });

  try { if (new URLSearchParams(location.search).get("mode") === "exhibit") open(false); } catch (e) { /* 무시 */ }
  return { open: () => open(true), close, get on() { return on; } };
}
