// 혼잡도 계수기 · 계수 화면 (정적 호스팅본 웹배포용/crowd/ · 261004)
// 영상은 이 탭 메모리 안에서만 쓰고 버린다. 밖으로 나가는 것은 숫자(구역별 인원)뿐이다.
// 인식 · 카메라 · 주기 · 전송 · 공용 설정은 AX magic 공용 엔진(../../engine/)을 쓴다. 게임 AX magic(magic/)과 같은 엔진이다.
import { PersonDetector, MODELS } from "../../engine/detector.js";
import { createTransport } from "../../engine/transport.js";
import { cameraError, hasCamera, listCameras, openStream, trackDevice } from "../../engine/camera.js";
import { FrameScheduler } from "../../engine/scheduler.js";
import { inPoly, zoneState, splitExcluded } from "../../engine/tracking.js";
import { getLoc, setLoc, cleanLoc, camName, loadZones, saveZones as saveZonesShared, loadExcl, saveExcl, onShared, LOC_MAX } from "../../engine/settings.js";
import { JUDGE, JUDGE_WORD, scaleOpt, judgeZones, judgeView } from "../../engine/judge.js";   // 261005 혼잡 판단(1분 중앙값 · 2분 유지 · 80% 해제)
import { initExhibit } from "./exhibit.js";   // 261003 전시 모드(점만 그린다)

const $ = (id) => document.getElementById(id);
const view = $("view");
const ctx = view.getContext("2d");
const video = $("video");
const still = $("still");
const mosaic = document.createElement("canvas");
const mctx = mosaic.getContext("2d");

const COLORS = { ok: "#1FA45B", mid: "#8A94A0", bad: "#E5484D", none: "#98A2AC" };
const WORD = { ok: "여유", mid: "보통", bad: "혼잡", none: "대기" };
const MAX_LOG = 200000;

// ---------- 저장소 (실패해도 동작) ----------
function load(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch (e) {
    return def;
  }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 저장 불가 환경 */ }
}

const settings = Object.assign(
  { res: "1080", view: "mosaic", showBox: true, anchor: "foot", model: "lite2", interval: 1000, tiles: 1, score: 0.35, pauseHidden: false, deviceId: "", gpu: true },
  load("axf-crowd-settings-v2", {})
);
const saveSettings = () => save("axf-crowd-settings-v2", settings);
// 위치 이름(공용 · engine/settings.js) · 보내는 카메라 이름 = 「위치 이름 · 계수기」
// 이 탭에서 위치 이름을 바꾸면 그 탭은 그 이름을 계속 쓴다(탭 여러 개 = 카메라 여러 대가 서로 덮지 않게). 안 바꾼 탭은 공용 위치 이름을 따라간다.
const PROG = "crowd";
let tabLoc = null;
try { tabLoc = sessionStorage.getItem("axf-crowd-loc"); } catch (e) { /* 저장 불가 환경 */ }
let loc = tabLoc !== null ? cleanLoc(tabLoc) : getLoc();
const fullName = () => camName(loc, PROG);
function saveTabLoc() {
  tabLoc = loc;
  try { sessionStorage.setItem("axf-crowd-loc", loc); } catch (e) { /* 저장 불가 환경 */ }
}

// ---------- 상태 ----------
// 탭 id · 새로고침해도 같은 탭이면 같은 id(서버가 같은 카메라로 본다 · 60초 이름 거절에 걸리지 않게)
const camId = (() => {
  try { const v = sessionStorage.getItem("axf-crowd-cid"); if (v && /^[A-Za-z0-9-]{4,40}$/.test(v)) return v; } catch (e) { /* 저장 불가 환경 */ }
  const v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)).replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
  try { sessionStorage.setItem("axf-crowd-cid", v); } catch (e) { /* 저장 불가 환경 */ }
  return v;
})();
const transport = createTransport({ server: true });   // 261003 서버 전송(10초마다 숫자만) · BroadcastChannel 은 그대로
const detector = new PersonDetector();
let src = null; // { kind, el, w, h }
let stream = null;
let zones = loadZones(loc);
let excl = loadExcl(loc);   // 261005 제외 구역(흉상 등) · 공용 키 axf-cc-excl:<위치>
let rawDets = [];           // 인식기가 낸 그대로
let dets = [];              // 제외 구역을 뺀 사람(세는 것)
let exDets = [];            // 제외 구역에 걸려 뺀 것(화면에 점선으로만)
// 혼잡 판단 · 구역 id 마다 · 시험 모드 ?jfast=10 이면 시간 길이만 1/10(1분 → 6초 · 2분 → 12초)
const JOPT = (() => { try { const f = Number(new URLSearchParams(location.search).get("jfast")); return f > 1 ? scaleOpt(f) : JUDGE; } catch (e) { return JUDGE; } })();
let judges = new Map();
let counts = { total: 0, zones: {} };
let lastMs = 0;
let lastAt = 0;
let modelReady = false;
let busy = false;
let drawing = null; // { pts:[[x,y]], hover:[x,y] }
let log = [];

// ---------- 화면 초기값 ----------
$("camName").value = loc;
$("camName").maxLength = LOC_MAX;
$("camSfx").textContent = "· " + "계수기";
$("resSel").value = settings.res;
$("anchorSel").value = settings.anchor;
$("intSel").value = String(settings.interval);
$("tileSel").value = String(settings.tiles);
$("scoreIn").value = String(settings.score);
$("scoreVal").textContent = Number(settings.score).toFixed(2);
$("showBox").checked = settings.showBox;
$("pauseHidden").checked = settings.pauseHidden;
for (const [k, m] of Object.entries(MODELS)) {
  const o = document.createElement("option");
  o.value = k;
  o.textContent = m.label;
  $("modelSel").appendChild(o);
}
$("modelSel").value = settings.model;
$("gpuSel").value = settings.gpu ? "gpu" : "cpu";
setView(settings.view);

// ---------- 모델 ----------
async function loadModel() {
  modelReady = false;
  $("meta").textContent = "모델 불러오는 중";
  try {
    await detector.load(settings.model, settings.score, settings.gpu);
    modelReady = true;
    updateMeta();
    schedule(0);
  } catch (e) {
    console.error(e);
    $("meta").textContent = "모델을 불러오지 못했습니다 · 인터넷 연결 확인(jsDelivr · Google 모델 저장소)";
    setTimeout(() => { if (!modelReady) loadModel(); }, 15000);   // 정적 호스팅본: 인터넷이 잠깐 끊겼으면 15초 뒤 다시 받는다
  }
}

function updateMeta() {
  const m = settings.model === "lite0" ? "Lite0" : "Lite2";
  const parts = [m + " · " + (detector.delegate || "")];
  if (src) parts.push(src.w + "×" + src.h);
  if (lastMs) parts.push("인식 " + Math.round(lastMs) + "ms");
  parts.push((settings.interval / 1000) + "초마다");
  if (settings.tiles > 1) parts.push("타일 " + settings.tiles + "×" + settings.tiles);
  if (paused()) parts.push("정지 · 창이 가려져 인식을 멈춤");
  $("meta").textContent = parts.join(" · ");
}

// ---------- 입력: 카메라 ----------
async function listCams() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  const devs = await listCameras();
  const sel = $("camSel");
  sel.innerHTML = "";
  if (!devs.length) {
    sel.innerHTML = '<option value="">카메라 없음</option>';
    return;
  }
  devs.forEach((d, i) => {
    const o = document.createElement("option");
    o.value = d.deviceId;
    o.textContent = d.label || "카메라 " + (i + 1) + " (권한 허용 후 이름 표시)";
    sel.appendChild(o);
  });
  if (settings.deviceId && devs.some((d) => d.deviceId === settings.deviceId)) sel.value = settings.deviceId;
}

function stopSource() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.pause();
  if (video.src) {
    URL.revokeObjectURL(video.src);
    video.removeAttribute("src");
  }
  video.srcObject = null;
  if (still.src) {
    URL.revokeObjectURL(still.src);
    still.removeAttribute("src");
  }
  src = null;
  rawDets = [];
  dets = [];
  exDets = [];
}

async function startCamera() {
  if (!hasCamera()) {
    const ce = cameraError("nomedia");
    msg(ce.title + " · " + ce.msg);
    return;
  }
  stopSource();
  msg("카메라 여는 중");
  const h = Number(settings.res);
  const w = Math.round((h * 16) / 9);
  const id = $("camSel").value;
  try {
    stream = await openStream({ deviceId: id, width: w, height: h, frameRate: 30, facingMode: "", fallback: false });
  } catch (e) {
    console.warn(e);
    const ce = cameraError(e);
    msg(ce.title + " · " + ce.msg);
    return;
  }
  settings.deviceId = trackDevice(stream) || id || "";
  saveSettings();
  await listCams();
  video.srcObject = stream;
  await video.play().catch(() => {});
  await waitVideo();
  src = { kind: "camera", el: video, w: video.videoWidth, h: video.videoHeight };
  onSourceReady();
}

function waitVideo() {
  return new Promise((res) => {
    if (video.readyState >= 2 && video.videoWidth) return res();
    video.addEventListener("loadeddata", () => res(), { once: true });
  });
}

// ---------- 입력: 시험 파일 ----------
async function openFile(file) {
  stopSource();
  const url = URL.createObjectURL(file);
  if (file.type.startsWith("image/")) {
    await new Promise((res) => {
      still.onload = res;
      still.onerror = res;
      still.src = url;
    });
    src = { kind: "image", el: still, w: still.naturalWidth, h: still.naturalHeight };
  } else {
    video.src = url;
    video.loop = true;
    await video.play().catch(() => {});
    await waitVideo();
    src = { kind: "video", el: video, w: video.videoWidth, h: video.videoHeight };
  }
  onSourceReady();
}

function onSourceReady() {
  msg("");
  // 화면용 캔버스는 최대 가로 1920(4K 원본도 인식은 원본 해상도로 한다)
  const scale = Math.min(1, 1920 / src.w);
  view.width = Math.round(src.w * scale);
  view.height = Math.round(src.h * scale);
  const mw = 48;
  mosaic.width = mw;
  mosaic.height = Math.max(1, Math.round((mw * src.h) / src.w));
  updateMeta();
  schedule(0);
}

function msg(t) {
  $("stageMsg").textContent = t;
  $("stageMsg").style.display = t ? "flex" : "none";
}

// ---------- 인식 주기 ----------
function paused() {
  return settings.pauseHidden && document.visibilityState === "hidden";
}

// 사람 감지 = 공용 스케줄러의 시간 구독(워커 타이머 · 창이 가려져도 주기가 늘어지지 않는다)
const sched = new FrameScheduler(() => null).interval("person", () => tick(), -1);
function schedule(delay) {
  sched.kick(delay);
}

async function tick() {
  if (!modelReady || !src || busy || paused()) {
    if (src && modelReady && !paused()) schedule(200);
    updateMeta();
    return;
  }
  busy = true;
  const t0 = performance.now();
  try {
    if (src.kind !== "image" || !rawDets.length || detector.dirty) {
      rawDets = detector.detect(src.el, src.w, src.h, settings.tiles);
      detector.dirty = false;
      lastMs = performance.now() - t0;
    }
    countZones();
    lastAt = Date.now();
    judges = judgeZones(judges, lastAt, zoneRows(), JOPT);   // 계수할 때만 판단을 한 걸음 옮긴다(구역 편집은 판단에 넣지 않는다)
    renderCounts();
    publish();
    record();
  } catch (e) {
    console.error(e);
  }
  busy = false;
  updateMeta();
  schedule(Math.max(50, settings.interval - (performance.now() - t0)));
}

function anchorOf(d) {
  const x = d.x + d.w / 2;
  const y = settings.anchor === "foot" ? d.y + d.h : d.y + d.h / 2;
  return [x / src.w, y / src.h];
}

const stateOf = zoneState;   // 공용(engine/tracking.js) · 보통 warn 명 이상 · 혼잡 crowd 명 이상

function countZones() {
  const sp = src ? splitExcluded(rawDets, src.w, src.h, excl) : { keep: [], drop: [] };
  dets = sp.keep;
  exDets = sp.drop;
  const zc = {};
  for (const z of zones) zc[z.id] = 0;
  for (const d of dets) {
    const a = anchorOf(d);
    d.zone = null;
    for (const z of zones) {
      if (inPoly(a, z.pts)) {
        zc[z.id]++;
        d.zone = z.id;
      }
    }
  }
  counts = { total: dets.length, zones: zc };
  renderCounts();
}

function zoneRows() {
  const now = Date.now();
  return zones.map((z) => {
    const n = counts.zones[z.id] || 0, j = judges.get(z.id), v = j ? judgeView(j, now, JOPT) : { k: "lost", med: null, left: -1 };
    return { id: z.id, name: z.name, count: n, state: stateOf(z, n), warn: z.warn, crowd: z.crowd, judge: v.k, med: v.med, left: v.left };
  });
}

function publish() {
  transport.send({
    type: "count",
    camId,
    camName: fullName(),
    ts: Date.now(),
    intervalMs: settings.interval,
    model: settings.model,
    res: src ? src.w + "×" + src.h : "",
    total: counts.total,
    zones: zoneRows(),
  });
}

function stamp(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

function record() {
  const t = stamp(new Date());
  const cn = fullName();
  log.push([t, cn, "화면 전체", counts.total, "", ""]);
  for (const r of zoneRows()) log.push([t, cn, r.name, r.count, WORD[r.state], JUDGE_WORD[r.judge] || ""]);
  if (log.length > MAX_LOG) log = log.slice(log.length - MAX_LOG);
  $("logCount").textContent = log.length.toLocaleString() + "줄";
}

// ---------- 오른쪽 숫자 ----------
function renderCounts() {
  $("total").innerHTML = counts.total + "<small>명</small>";
  const box = $("zones");
  const rows = zoneRows();
  renderJudgeSum(rows);
  if (!zones.length) {
    box.innerHTML = '<div class="empty">구역이 없습니다 · 「구역 그리기」로 화면 위에 다각형을 그리세요</div>';
    return;
  }
  box.innerHTML = rows
    .map(
      (r) => `<div class="zone ${r.state === "bad" ? "bad" : ""} ${r.judge === "check" ? "check" : ""}">
        <span class="zn">${esc(r.name)}</span>
        <span class="zc num">${r.count}<small>명</small></span>
        <span class="state s-${r.state}">${WORD[r.state]}</span>
        <div class="judge j-${r.judge} num">${judgeLine(r)}</div>
      </div>`
    )
    .join("");
}

// 판단 한 줄 · 상태 · 1분 중앙값 / 기준 · 바뀌기까지 남은 시간(리허설 때 기준을 맞추기 쉽게)
function mmss(ms) {
  const s = Math.ceil(ms / 1000);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function judgeLine(r) {
  const head = `<b>${JUDGE_WORD[r.judge]}</b>`;
  if (r.judge === "lost" || r.judge === "na") return head;
  const med = r.med === null ? "-" : Math.round(r.med * 10) / 10;
  let tail = "";
  if (r.left >= 0) tail = r.judge === "calm" ? ` · ${mmss(r.left)} 더 이어지면 확인 요청` : ` · ${mmss(r.left)} 더 낮으면 평소`;
  return `${head} · 1분 중앙값 ${med}명 / 기준 ${r.crowd}명${tail}`;
}
function renderJudgeSum(rows) {
  const el = $("jsum");
  if (!el) return;
  const n = rows.filter((r) => r.judge === "check").length;
  el.className = "jsum" + (n ? " on" : "");
  el.textContent = !zones.length ? "혼잡 판단 · 구역을 그리면 시작" : n ? "현장 확인 요청 · " + n + "곳" : "혼잡 판단 · 평소";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// ---------- 구역 편집 ----------
function saveZones() {
  saveZonesShared(loc, zones);   // 공용 키(위치 이름별) · AX magic과 같은 구역
}

function renderZoneEdit() {
  const box = $("zoneEdit");
  box.innerHTML = zones
    .map(
      (z) => `<div class="zedit" data-id="${z.id}">
      <div class="row"><label>이름</label><input type="text" data-f="name" value="${esc(z.name)}"></div>
      <div class="row"><label>보통</label><input type="number" min="1" data-f="warn" value="${z.warn}"><label style="min-width:0">명 이상 · 혼잡</label><input type="number" min="1" data-f="crowd" value="${z.crowd}"><label style="min-width:0">명 이상</label></div>
      <p class="note">혼잡 값이 이 구역의 확인 요청 기준입니다.</p>
      <div class="row"><button class="btn sm" data-del="1">구역 지우기</button></div>
    </div>`
    )
    .join("");
  renderExclEdit();
}

function renderExclEdit() {
  $("exEdit").innerHTML = excl.length
    ? excl.map((x, i) => `<div class="row exrow" data-id="${esc(x.id)}"><span class="exname">${esc(x.name || "제외 " + (i + 1))}</span><button class="btn sm" data-exdel="1">지우기</button></div>`).join("")
    : '<p class="note">제외 구역 없음</p>';
}
$("exEdit").addEventListener("click", (e) => {
  if (!e.target.dataset.exdel) return;
  const id = e.target.closest(".exrow").dataset.id;
  excl = excl.filter((x) => x.id !== id);
  saveExcl(loc, excl);
  renderExclEdit();
  if (src) { countZones(); publish(); }
});

$("zoneEdit").addEventListener("input", (e) => {
  const card = e.target.closest(".zedit");
  if (!card) return;
  const z = zones.find((q) => q.id === card.dataset.id);
  const f = e.target.dataset.f;
  if (!z || !f) return;
  if (f === "name") z.name = e.target.value.slice(0, 20) || "구역";
  else {
    const n = Math.max(1, Math.round(Number(e.target.value) || 1));
    z[f] = n;
    if (z.crowd <= z.warn) z.crowd = z.warn + 1;
  }
  saveZones();
  countZones();
});
$("zoneEdit").addEventListener("change", () => renderZoneEdit());
$("zoneEdit").addEventListener("click", (e) => {
  if (!e.target.dataset.del) return;
  const id = e.target.closest(".zedit").dataset.id;
  zones = zones.filter((z) => z.id !== id);
  saveZones();
  renderZoneEdit();
  countZones();
  publish();
});

function startDraw(kind) {
  if (!src) {
    msg("먼저 카메라를 켜거나 시험 영상을 고르세요");
    setTimeout(() => !src && msg("카메라 또는 시험 영상을 고르세요"), 1800);
    return;
  }
  drawing = { pts: [], hover: null, lastT: 0, kind: kind === "ex" ? "ex" : "zone" };
  view.classList.add("drawing");
  $("drawHint").classList.add("on");
  $("zoneAdd").hidden = true;
  $("exAdd").hidden = true;
  $("zoneClose").hidden = false;
  $("zoneCancel").hidden = false;
}

function endDraw(commit) {
  if (commit && drawing && drawing.pts.length >= 3 && drawing.kind === "ex") {
    excl.push({ id: "x" + Date.now().toString(36), name: "제외 " + (excl.length + 1), pts: drawing.pts });
    saveExcl(loc, excl);
    renderExclEdit();
  } else if (commit && drawing && drawing.pts.length >= 3) {
    const n = zones.length + 1;
    zones.push({ id: "z" + Date.now().toString(36), name: "구역 " + n, pts: drawing.pts, warn: 3, crowd: 6 });
    saveZones();
    renderZoneEdit();
  }
  drawing = null;
  view.classList.remove("drawing");
  $("drawHint").classList.remove("on");
  $("zoneAdd").hidden = false;
  $("exAdd").hidden = false;
  $("zoneClose").hidden = true;
  $("zoneCancel").hidden = true;
  if (src) {
    countZones();
    publish();
  }
}

// 캔버스는 object-fit: contain 이라 요소 상자와 실제 그림 영역이 다르다. 그림 영역을 계산한다.
function contentRect() {
  const b = view.getBoundingClientRect();
  const s = Math.min(b.width / view.width, b.height / view.height);
  const w = view.width * s, h = view.height * s;
  return { left: b.left + (b.width - w) / 2, top: b.top + (b.height - h) / 2, width: w, height: h };
}
function normPt(e) {
  const r = contentRect();
  return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
}
function pxDist(a, b) {
  const r = contentRect();
  return Math.hypot((a[0] - b[0]) * r.width, (a[1] - b[1]) * r.height);
}

view.addEventListener("pointerdown", (e) => {
  if (!drawing) return;
  e.preventDefault();
  const p = normPt(e);
  const pts = drawing.pts;
  const now = performance.now();
  // 첫 점 근처를 다시 누르거나, 마지막 점을 빠르게 두 번 누르면 닫는다(마우스·터치 공통)
  if (pts.length >= 3 && pxDist(p, pts[0]) < 18) return endDraw(true);
  if (pts.length >= 3 && now - drawing.lastT < 350 && pxDist(p, pts[pts.length - 1]) < 14) return endDraw(true);
  pts.push(p);
  drawing.lastT = now;
});
view.addEventListener("pointermove", (e) => {
  if (drawing) drawing.hover = normPt(e);
});
document.addEventListener("keydown", (e) => {
  if (!drawing) return;
  if (e.key === "Escape") endDraw(false);
  if (e.key === "Enter") endDraw(true);
  if (e.key === "Backspace") {
    drawing.pts.pop();
    e.preventDefault();
  }
});

// ---------- 그리기 ----------
function setView(v) {
  settings.view = v;
  saveSettings();
  for (const b of $("viewSeg").querySelectorAll("button")) b.classList.toggle("on", b.dataset.v === v);
  $("modeBadge").textContent = { mosaic: "모자이크", dots: "점·윤곽만", raw: "원본" }[v];
}

function frame() {
  requestAnimationFrame(frame);
  if (exhibit.on) return;   // 전시 모드 동안은 이 캔버스(영상 · 모자이크)를 그리지 않는다
  const W = view.width, H = view.height;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (src) {
    if (settings.view === "raw") {
      ctx.drawImage(src.el, 0, 0, W, H);
    } else if (settings.view === "mosaic") {
      mctx.drawImage(src.el, 0, 0, mosaic.width, mosaic.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mosaic, 0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(0, 0, W, H);
    } else {
      drawGrid(W, H);
    }
    drawExcl(W, H);
    drawZones(W, H);
    drawDets(W, H);
  }
  drawDrawing(W, H);
  ctx.restore();
}

function drawGrid(W, H) {
  ctx.fillStyle = "#2a2a2a";
  const g = Math.round(W / 48);
  for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g) ctx.fillRect(x - 1, y - 1, 2, 2);
}

function lw(W) {
  return Math.max(2, W / 640);
}

function drawDets(W, H) {
  const sx = W / src.w, sy = H / src.h;
  const dotsOnly = settings.view === "dots";
  for (const d of dets) {
    const x = d.x * sx, y = d.y * sy, w = d.w * sx, h = d.h * sy;
    if (settings.showBox) {
      ctx.lineWidth = lw(W);
      ctx.strokeStyle = d.zone ? "#FF7E31" : "rgba(255,255,255,.75)";
      ctx.strokeRect(x, y, w, h);
    }
    if (dotsOnly || !settings.showBox) {
      const a = anchorOf(d);
      ctx.beginPath();
      ctx.arc(a[0] * W, a[1] * H, Math.max(6, W / 160), 0, Math.PI * 2);
      ctx.fillStyle = d.zone ? "#FF7E31" : "#FFFFFF";
      ctx.fill();
    }
  }
}

// 제외 구역 · 회색 점선 + 「제외」 · 거기서 뺀 상자도 회색 점선(세지 않았다는 표시)
function drawExcl(W, H) {
  if (!excl.length && !exDets.length) return;
  const fs = Math.max(16, Math.round(W / 56));
  ctx.save();
  ctx.setLineDash([lw(W) * 3, lw(W) * 3]);
  ctx.lineWidth = lw(W) * 1.2;
  for (const x of excl) {
    ctx.beginPath();
    x.pts.forEach((p, k) => (k ? ctx.lineTo(p[0] * W, p[1] * H) : ctx.moveTo(p[0] * W, p[1] * H)));
    ctx.closePath();
    ctx.fillStyle = "rgba(152,162,172,.18)";
    ctx.fill();
    ctx.strokeStyle = "rgba(217,217,217,.9)";
    ctx.stroke();
    const top = x.pts.reduce((a, b) => (b[1] < a[1] ? b : a));
    ctx.font = `700 ${fs}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.fillText(x.name || "제외", top[0] * W + 6, Math.max(fs, top[1] * H - 6));
  }
  const sx = W / src.w, sy = H / src.h;
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  for (const d of exDets) ctx.strokeRect(d.x * sx, d.y * sy, d.w * sx, d.h * sy);
  ctx.restore();
}

function drawZones(W, H) {
  const rows = zoneRows();
  zones.forEach((z, i) => {
    const r = rows[i];
    const col = COLORS[r.state];
    ctx.beginPath();
    z.pts.forEach((p, k) => (k ? ctx.lineTo(p[0] * W, p[1] * H) : ctx.moveTo(p[0] * W, p[1] * H)));
    ctx.closePath();
    ctx.fillStyle = hexA(col, r.state === "bad" ? 0.22 : 0.12);
    ctx.fill();
    ctx.lineWidth = lw(W) * 1.5;
    ctx.strokeStyle = col;
    ctx.stroke();
    // 라벨: 가장 위 꼭짓점 근처
    const top = z.pts.reduce((a, b) => (b[1] < a[1] ? b : a));
    const fs = Math.max(18, Math.round(W / 42));
    const text = `${z.name}  ${r.count}명 · ${WORD[r.state]}` + (r.judge === "check" ? " · 확인 요청" : "");
    ctx.font = `700 ${fs}px ${getComputedStyle(document.body).fontFamily}`;
    const tw = ctx.measureText(text).width;
    let lx = Math.min(W - tw - fs, Math.max(4, top[0] * W - tw / 2));
    let ly = Math.max(fs * 1.6, top[1] * H - fs * 0.4);
    ctx.fillStyle = col;
    roundRect(lx - fs * 0.4, ly - fs * 1.15, tw + fs * 0.8, fs * 1.5, fs * 0.3);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(text, lx, ly);
  });
}

function drawDrawing(W, H) {
  if (!drawing) return;
  const pts = drawing.pts.slice();
  if (drawing.hover) pts.push(drawing.hover);
  const dcol = drawing.kind === "ex" ? "#D9D9D9" : "#FF7E31";
  ctx.lineWidth = lw(W) * 1.5;
  ctx.strokeStyle = dcol;
  ctx.setLineDash([lw(W) * 4, lw(W) * 3]);
  ctx.beginPath();
  pts.forEach((p, k) => (k ? ctx.lineTo(p[0] * W, p[1] * H) : ctx.moveTo(p[0] * W, p[1] * H)));
  ctx.stroke();
  ctx.setLineDash([]);
  drawing.pts.forEach((p, k) => {
    ctx.beginPath();
    ctx.arc(p[0] * W, p[1] * H, k === 0 ? lw(W) * 5 : lw(W) * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = k === 0 ? "#FFFFFF" : dcol;
    ctx.fill();
    ctx.strokeStyle = dcol;
    ctx.stroke();
  });
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// ---------- CSV ----------
function downloadCsv() {
  const q = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = ["시각,카메라,구역,인원,상태,판단"].concat(log.map((r) => r.map(q).join(",")));
  const blob = new Blob(["﻿" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  a.href = URL.createObjectURL(blob);
  a.download = `혼잡도_${fullName().replace(/[\\/:*?"<>|]/g, "")}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

// ---------- 이벤트 ----------
$("camStart").addEventListener("click", startCamera);
$("camSel").addEventListener("change", () => {
  settings.deviceId = $("camSel").value;
  saveSettings();
  if (src && src.kind === "camera") startCamera();
});
$("resSel").addEventListener("change", () => {
  settings.res = $("resSel").value;
  saveSettings();
  if (src && src.kind === "camera") startCamera();
});
$("fileIn").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) openFile(f);
  e.target.value = "";
});
$("viewSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) setView(b.dataset.v);
});
$("showBox").addEventListener("change", (e) => {
  settings.showBox = e.target.checked;
  saveSettings();
});
$("anchorSel").addEventListener("change", (e) => {
  settings.anchor = e.target.value;
  saveSettings();
  if (src) countZones();
});
$("modelSel").addEventListener("change", (e) => {
  settings.model = e.target.value;
  saveSettings();
  detector.dirty = true;
  loadModel();
});
$("gpuSel").addEventListener("change", (e) => {
  settings.gpu = e.target.value === "gpu";
  saveSettings();
  detector.dirty = true;
  loadModel();
});
$("intSel").addEventListener("change", (e) => {
  settings.interval = Number(e.target.value);
  saveSettings();
  schedule(0);
});
$("tileSel").addEventListener("change", (e) => {
  settings.tiles = Number(e.target.value);
  saveSettings();
  detector.dirty = true;
  schedule(0);
});
$("scoreIn").addEventListener("input", (e) => {
  $("scoreVal").textContent = Number(e.target.value).toFixed(2);
});
$("scoreIn").addEventListener("change", async (e) => {
  settings.score = Number(e.target.value);
  saveSettings();
  await detector.setScore(settings.score);
  detector.dirty = true;
  schedule(0);
});
$("pauseHidden").addEventListener("change", (e) => {
  settings.pauseHidden = e.target.checked;
  saveSettings();
  schedule(0);
});
function useLoc(l) {
  transport.send({ type: "bye", camId, ts: Date.now() });
  loc = l;
  $("camName").value = loc;
  zones = loadZones(loc);
  excl = loadExcl(loc);
  judges = new Map();   // 위치가 바뀌면 판단도 처음부터
  renderZoneEdit();
  renderName();
  if (src) {
    countZones();
    publish();
  } else renderCounts();
}
function renderName() {
  $("camFull").textContent = fullName();
}
$("camName").addEventListener("change", (e) => {
  loc = setLoc(e.target.value);   // 공용 위치 이름도 바꾼다(AX magic이 같은 위치 이름을 쓴다)
  saveTabLoc();
  useLoc(loc);
});
// 다른 탭(다른 계수기 탭 · AX magic)에서 바꾼 공용 설정
onShared((c) => {
  if (c.what === "loc" && tabLoc === null && c.loc !== loc) useLoc(c.loc);
  else if (c.what === "zones" && c.loc === loc && !drawing) {
    zones = loadZones(loc);
    renderZoneEdit();
    if (src) countZones(); else renderCounts();
  } else if (c.what === "excl" && c.loc === loc && !drawing) {
    excl = loadExcl(loc);
    renderExclEdit();
    if (src) countZones();
  }
});
// ---------- 서버 전송 (261003) · 등급코드는 이 브라우저 localStorage 에만 · 화면에 값을 다시 보이지 않는다 ----------
const srv = transport.server;
function renderSrv(s) {
  s = s || srv.status();
  $("srvSel").value = srv.target;
  const on = srv.target !== "off", has = srv.hasCode();
  $("srvCodeRow").hidden = !on || has;
  $("srvSavedRow").hidden = !on || !has;
  const st = $("srvStat");
  st.textContent = s.text;
  st.className = "srv-stat num k-" + s.k;
  // 머리 줄 칩 · 켜져 있을 때만 · 짧게(성공 = 마지막 시각 · 실패 · 멈춤 = 그 말만)
  const chip = $("srvChip");
  chip.hidden = !on;
  chip.className = "srv-chip num k-" + s.k;
  chip.textContent = s.k === "ok" ? s.text : s.k === "fail" ? "전송 실패" : s.k === "stop" ? "전송 멈춤" : "서버 전송 대기";
}
srv.onStatus(renderSrv);
$("srvSel").addEventListener("change", (e) => { srv.setTarget(e.target.value); renderSrv(); });
function saveSrvCode() {
  const i = $("srvCode"), v = i.value.trim();
  i.value = "";
  if (!v) return;
  srv.setCode(v);
  renderSrv();
}
$("srvSave").addEventListener("click", saveSrvCode);
$("srvCode").addEventListener("keydown", (e) => { if (e.key === "Enter") saveSrvCode(); });
$("srvForget").addEventListener("click", () => { srv.setCode(""); renderSrv(); });

$("zoneAdd").addEventListener("click", () => startDraw("zone"));
$("exAdd").addEventListener("click", () => startDraw("ex"));
$("zoneClose").addEventListener("click", () => endDraw(true));
$("zoneCancel").addEventListener("click", () => endDraw(false));
$("csvBtn").addEventListener("click", downloadCsv);
$("logClear").addEventListener("click", () => {
  log = [];
  $("logCount").textContent = "0줄";
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") schedule(0);
  updateMeta();
});
window.addEventListener("pagehide", () => transport.send({ type: "bye", camId, ts: Date.now() }));
if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener("devicechange", listCams);

// 시험·점검용(콘솔에서 상태 확인)
window.__crowd = { get dets() { return dets; }, get rawDets() { return rawDets; }, get exDets() { return exDets; }, get counts() { return counts; }, get zones() { return zones; }, get excl() { return excl; }, rows: () => zoneRows(), jopt: JOPT, detector, openFile, srvStatus: () => srv.status(), lastSent: () => srv.latest };   // 등급코드는 내보내지 않는다

// ---------- 전시 모드 (261003) · 그리기만 따로 · 계수 · 구역 · 서버 전송은 이 엔진 그대로 ----------
const exhibit = initExhibit({ src: () => src, dets: () => dets, counts: () => counts, zones: () => zones, ready: () => modelReady, start: () => listCams().then(startCamera) });
$("exOpen").addEventListener("click", () => exhibit.open());

renderZoneEdit();
renderCounts();
renderName();
setInterval(renderCounts, 1000);   // 판단 남은 시간 · 신호 없음을 계수 없이도 갱신
listCams();
loadModel();
requestAnimationFrame(frame);
