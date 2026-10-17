/* ═══ v3.51 게임 효과음 (사용자 요청 260917 · 「효과음이 없다 · 게임답게 · 기본은 끔 · 시작 전에 고르게」) ═══
   설정 하나 game_sound(true·false · 아직 안 고르면 null) · 옛 rain_sound 가 켜져 있던 기기는 켜짐으로 옮긴다.
   첫 게임 START 때 아직 안 골랐으면 선택 카드 한 번 · 이후 시작 화면·게임 위 줄의 스피커 버튼으로 바꾼다.
   소리 잠금 해제: 「소리 켜고 시작」·켜기 버튼을 누른 그 탭 안에서 AudioContext 를 만들거나 resume 하고 무음 버퍼 1개를 재생한다.
   합성: 음원 파일 없음 · 오실레이터 + 노이즈 버퍼 + 엔벌로프 · 전부 마스터 게인 → 컴프레서(클리핑 방지) · 동시 발음 8개 상한.
   1F 현장 셀프 모드(노트북)는 site_sound 따로 · v4.32 기본 켬(스태프가 셀프 모드를 켤 때 고른다 · 사용자 확정 260924) · 휴대폰 앱은 그대로 기본 끔.
   (예전에 소리가 안 난 이유: ①기본값이 꺼짐 ②켜도 AudioContext 를 게임 루프 안에서 처음 만들어 iOS 는 잠긴 채였을 가능성 ③단일 사인·사각파 0.03~0.07 로 작았다) */
var SFX = { ctx: null, master: null, comp: null, noise: null, voices: 0, site: false };
(function () {   /* 옛 설정 옮기기 · 켜져 있던 기기만 켜짐으로 */
  try { if (S.get("game_sound", null) === null && S.get("rain_sound", false) === true) S.set("game_sound", true); } catch (e) {}
})();
function sndChosen() { return S.get("game_sound", null) !== null; }
function sndOn() { return SFX.site ? S.get("site_sound", true) === true : S.get("game_sound", null) === true; }
function sfxCtx() {
  if (SFX.ctx) return SFX.ctx;
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    SFX.ctx = new AC();
    sfxChain(SFX.ctx);
  } catch (e) { SFX.ctx = null; }
  return SFX.ctx;
}
function sfxChain(c) {
  var comp = c.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.15;
  var m = c.createGain(); m.gain.value = 0.85;
  m.connect(comp); comp.connect(c.destination);
  SFX.master = m; SFX.comp = comp; SFX.noise = null;
}
/* 탭 안에서 부른다 · 컨텍스트 생성·재개 + 무음 버퍼 1개 */
function sfxUnlock() {
  var c = sfxCtx(); if (!c) return;
  try { if (c.state !== "running") c.resume(); } catch (e) {}
  try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
}
function sfxWake() { if (SFX.ctx && SFX.ctx.state !== "running" && !document.hidden) { try { SFX.ctx.resume(); } catch (e) {} } }
document.addEventListener("visibilitychange", sfxWake);
window.addEventListener("pageshow", sfxWake);
function sfxNoiseBuf(c) {
  if (SFX.noise && SFX.noise.sampleRate === c.sampleRate) return SFX.noise;
  var n = Math.floor(c.sampleRate * 0.6), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return (SFX.noise = b);
}
/* 톤 · f0→f1 미끄러짐 · 짧은 어택 + 지수 감쇠 */
function sfxTone(f0, dur, o) {
  o = o || {};
  var c = SFX.ctx, t = c.currentTime + (o.delay || 0), osc = c.createOscillator(), g = c.createGain(), v = o.vol || 0.4, a = o.attack || 0.004;
  osc.type = o.type || "sine";
  osc.frequency.setValueAtTime(f0, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(SFX.master); osc.start(t); osc.stop(t + dur + 0.02);
}
/* 노이즈 · 필터 한 개 · 짧은 타격감 */
function sfxNoise(dur, o) {
  o = o || {};
  var c = SFX.ctx, t = c.currentTime + (o.delay || 0), src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), v = o.vol || 0.3;
  src.buffer = sfxNoiseBuf(c);
  f.type = o.filter || "bandpass"; f.frequency.setValueAtTime(o.freq || 2000, t); f.Q.value = o.q || 1;
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(SFX.master); src.start(t); src.stop(t + dur + 0.02);
}
var SFX_LEN = { tick: 0.06, go: 0.35, fanfare: 0.75, over: 0.5, best: 0.45, click: 0.04, tok: 0.06, shook: 0.14, ppok: 0.14, cascade: 0.2, kwang: 0.4, ttuk: 0.1,
  ppyong: 0.16, ppyong2: 0.16, ppyongS: 0.16, ting: 0.22, puck: 0.14, hit: 0.12, tik: 0.05, floor: 0.22, level: 0.3, rgtick: 0.04, tak: 0.05, dingdong: 0.65, kung: 0.34,
  oxok: 0.22, oxup: 0.32, oxcrk: 0.08, oxsplash: 0.45, rgmiss: 0.16, rgcombo: 0.3, rglast: 0.45, scan: 0.2, rgpass: 0.3, rgjoin: 0.5, rgbonus: 0.6, rgcd: 0.18, rgstart: 0.42 };
/* 261017 1F 타자왕(셀프 · SFX.site) 효과음 = 낮고 묵직하게(「타자왕 개편 제안」 6절) · 계열마다 한 옥타브쯤 내리고 사각파는 600Hz 아래만 · 맨 위는 삼각 · 사인 · 같은 이름을 쓰는 앱 게임(점프 · 테트리스 · 팡)은 그대로 */
function sfxSite(name, p) {
  var T = sfxTone, N = sfxNoise;
  switch (name) {
    case "hit": var fm = Math.pow(1.03, Math.min(6, p || 1)); T(196 * fm, 0.09, { to: 147 * fm, type: "triangle", vol: 0.38 }); T(98, 0.12, { to: 70, vol: 0.45 }); N(0.035, { filter: "lowpass", freq: 900, vol: 0.2 }); return true;
    case "rgmiss": T(147, 0.08, { to: 123, vol: 0.3 }); N(0.05, { filter: "lowpass", freq: 600, vol: 0.25 }); return true;
    case "floor": T(110, 0.22, { to: 55, vol: 0.6 }); N(0.18, { filter: "lowpass", freq: 500, to: 150, vol: 0.45 }); N(0.04, { freq: 1800, q: 3, vol: 0.25 }); bgmDuck(); return true;
    case "rgcombo": [330, 392, 494].forEach(function (f, i) { T(f, 0.08, { type: "triangle", vol: 0.22, delay: i * 0.06 }); }); return true;
    case "rglast": [247, 185, 247, 185].forEach(function (f, i) { T(f, 0.14, { type: "triangle", vol: 0.3, delay: i * 0.15 }); }); return true;
    case "level": [392, 494, 659].forEach(function (f, i) { T(f, 0.09, { type: "triangle", vol: 0.22, delay: i * 0.07 }); }); return true;
    case "rgbonus": [262, 330, 392, 523].forEach(function (f, i) { T(f, 0.09, { type: "triangle", vol: 0.22, delay: i * 0.08 }); }); T(65, 0.3, { vol: 0.4 }); return true;
    case "rgcd": var fd = 262 * Math.pow(1.122, 3 - Math.max(1, Math.min(3, p || 3))); T(150, 0.16, { to: 70, vol: 0.7 }); T(fd, 0.16, { type: "triangle", vol: 0.3 }); return true;
    case "rgstart": T(110, 0.22, { to: 55, vol: 0.75 }); T(392, 0.1, { type: "triangle", vol: 0.26 }); T(523, 0.32, { type: "triangle", vol: 0.26, delay: 0.08 }); T(784, 0.3, { type: "triangle", vol: 0.18, delay: 0.08 }); return true;
    case "best": [523, 659, 784, 1047].forEach(function (f, i) { T(f, 0.1, { type: "triangle", vol: 0.26, delay: i * 0.06 }); }); return true;
    case "rgtick": T(p ? 247 : 220, 0.03, { vol: 0.12 }); return true;   /* 줄어드는 숫자 · 25% 아래(p = 1) 한 음 높게 */
  }
  return false;
}
/* 이름 → 소리 · p = 연쇄 단계·콤보 등 */
function sfxPlay(name, p) {
  var T = sfxTone, N = sfxNoise;
  if (SFX.site && sfxSite(name, p)) return;
  switch (name) {
    case "tick": T(1250, 0.06, { vol: 0.35 }); N(0.025, { freq: 4000, filter: "highpass", vol: 0.12 }); break;
    case "go": T(988, 0.14, { type: "triangle", vol: 0.5 }); T(1319, 0.28, { type: "triangle", vol: 0.45, delay: 0.08 }); break;
    case "fanfare": [523, 659, 784, 1047].forEach(function (f, i) { T(f, i === 3 ? 0.45 : 0.18, { type: "triangle", vol: 0.42, delay: i * 0.09 }); T(f * 2, 0.08, { vol: 0.12, delay: i * 0.09 }); }); break;
    case "over": T(392, 0.18, { type: "triangle", vol: 0.45 }); T(311, 0.32, { type: "triangle", vol: 0.45, delay: 0.16 }); break;
    case "best": [1568, 2093, 2637, 3136].forEach(function (f, i) { T(f, 0.1, { vol: 0.28, delay: i * 0.06 }); }); N(0.18, { freq: 6000, filter: "highpass", vol: 0.08, delay: 0.12 }); break;
    case "click": T(1600, 0.035, { type: "square", vol: 0.28 }); break;
    case "tok": T(760, 0.05, { vol: 0.45 }); N(0.025, { freq: 2200, vol: 0.2 }); break;
    case "shook": N(0.13, { freq: 700, to: 3200, q: 0.8, vol: 1.4 }); T(500, 0.1, { to: 900, vol: 0.12 }); break;
    case "ppok": T(900, 0.13, { to: 280, vol: 0.62 }); N(0.06, { freq: 1600, vol: 0.32 }); break;
    case "cascade": var f0 = 620 * Math.pow(1.122, Math.min(8, (p || 2) - 1));
      T(f0, 0.13, { to: f0 * 0.55, type: "square", vol: 0.3 }); T(f0 * 2, 0.08, { vol: 0.22 }); N(0.05, { freq: 2500, vol: 0.25 }); break;
    case "kwang": T(120, 0.38, { to: 48, vol: 0.85 }); N(0.3, { filter: "lowpass", freq: 900, to: 200, vol: 0.6 }); T(240, 0.12, { type: "square", to: 90, vol: 0.18 }); break;
    case "ttuk": T(300, 0.08, { to: 170, type: "triangle", vol: 0.5 }); break;
    case "ppyong": T(380, 0.15, { to: 920, vol: 0.5 }); T(380, 0.1, { to: 900, type: "square", vol: 0.08 }); break;
    case "ppyong2": T(560, 0.15, { to: 1350, vol: 0.5 }); T(560, 0.1, { to: 1300, type: "square", vol: 0.08 }); break;
    case "ppyongS": T(380, 0.15, { to: 920, vol: 0.16 }); T(380, 0.1, { to: 900, type: "square", vol: 0.03 }); break;   /* 261011 계단 동행 · 점프 「띠용」과 같은 합성 · 작은 볼륨 */
    case "ting": T(1976, 0.12, { vol: 0.42 }); T(2637, 0.18, { vol: 0.34, delay: 0.05 }); break;
    case "puck": T(190, 0.13, { to: 60, vol: 0.75 }); N(0.08, { filter: "lowpass", freq: 1300, vol: 0.5 }); break;
    case "hit": var fh = 700 * Math.pow(1.06, Math.min(12, p || 1));
      T(fh, 0.1, { to: fh * 0.6, type: "square", vol: 0.3 }); T(fh * 2, 0.06, { vol: 0.2 }); N(0.05, { freq: 2600, vol: 0.25 }); break;
    case "tik": T(260, 0.05, { type: "triangle", vol: 0.6 }); break;
    case "floor": T(220, 0.1, { to: 110, type: "triangle", vol: 0.55 }); N(0.05, { filter: "lowpass", freq: 900, vol: 0.3 }); break;
    case "level": [784, 988, 1319].forEach(function (f, i) { T(f, 0.09, { type: "square", vol: 0.24, delay: i * 0.07 }); }); break;
    case "tak": N(0.04, { freq: 2600, q: 0.9, vol: 1.1 }); T(1250, 0.035, { vol: 0.35 }); break;
    case "dingdong": T(1319, 0.3, { type: "triangle", vol: 0.5 }); T(988, 0.4, { type: "triangle", vol: 0.5, delay: 0.24 }); break;
    case "kung": T(95, 0.32, { to: 42, vol: 0.95 }); N(0.12, { filter: "lowpass", freq: 650, vol: 0.6 }); break;
    /* v4.12 유리다리 · 정답(연속일수록 한 음씩 높게) · 황금·피버 올림 · 금 가는 소리(단계) · 풍덩 */
    case "oxok": var fo = 784 * Math.pow(1.06, Math.min(10, p || 0)); T(fo, 0.09, { type: "triangle", vol: 0.42 }); T(fo * 1.5, 0.14, { vol: 0.3, delay: 0.055 }); N(0.06, { freq: 6500, filter: "highpass", vol: 0.1, delay: 0.03 }); break;
    case "oxup": [1047, 1319, 1568].forEach(function (f, i) { T(f, 0.09, { type: "triangle", vol: 0.3, delay: 0.1 + i * 0.06 }); }); break;
    case "oxcrk": N(0.07, { freq: 2600 + 500 * (p || 1), q: 3, vol: 0.5 + 0.15 * (p || 1) }); T(1500, 0.04, { type: "square", to: 800, vol: 0.12 }); break;
    case "oxsplash": N(0.42, { filter: "lowpass", freq: 1400, to: 180, vol: 0.9 }); T(190, 0.28, { to: 70, vol: 0.45 }); break;
    /* v4.13 QR 인식 · 짧은 두 음 「삐빅」 */
    case "scan": T(1568, 0.07, { type: "triangle", vol: 0.4 }); T(2093, 0.11, { type: "triangle", vol: 0.36, delay: 0.075 }); break;
    /* v4.32 단어 소나기 · 16비트 칩튠 결(사각파) · 오타 = 낮은 두 음 「뿌붑」 · 콤보 5 · 10 · 15 … = 오르는 네 음(단계마다 높게) · 마지막 목숨 = 경고 두 음 두 번 */
    case "rgmiss": T(233, 0.06, { type: "square", vol: 0.26 }); T(175, 0.09, { type: "square", vol: 0.26, delay: 0.06 }); break;
    case "rgcombo": var fc = 659 * Math.pow(1.122, Math.min(6, (p || 1) - 1)); [1, 1.26, 1.5, 2].forEach(function (k, i) { T(fc * k, 0.07, { type: "square", vol: 0.2, delay: i * 0.055 }); }); break;
    case "rglast": [988, 740, 988, 740].forEach(function (f, i) { T(f, 0.09, { type: "square", vol: 0.22, delay: i * 0.11 }); }); break;
    /* v5.12 1F 타자왕 아케이드 · 추월 = 짧게 오르는 세 음(많이 넘을수록 높게) · PLAYER JOIN = 동전 넣는 두 음 · 보너스 스테이지 = 오르는 다섯 음 */
    case "rgpass": var fp = 784 * Math.pow(1.06, Math.min(8, (p || 1) - 1)); [1, 1.26, 1.5].forEach(function (k, i) { T(fp * k, 0.07, { type: "square", vol: 0.22, delay: i * 0.05 }); }); break;
    case "rgjoin": T(988, 0.08, { type: "square", vol: 0.24 }); T(1319, 0.32, { type: "square", vol: 0.22, delay: 0.08 }); break;
    case "rgbonus": [523, 659, 784, 1047, 1319].forEach(function (f, i) { T(f, 0.09, { type: "square", vol: 0.2, delay: i * 0.08 }); }); break;
    /* 261012 타자왕 문장 카운트다운 박자 · 3 · 2 · 1 = 낮은 「둥」 + 사각파 한 음(숫자가 줄수록 높게) · 시작! = 오르는 두 음 + 높은 화음 + 짧은 쉬익 */
    case "rgcd": var fd = 523 * Math.pow(1.122, 3 - Math.max(1, Math.min(3, p || 3))); T(150, 0.16, { to: 70, vol: 0.7 }); T(fd, 0.16, { type: "square", vol: 0.26 }); T(fd * 2, 0.06, { vol: 0.12 }); break;
    case "rgstart": T(110, 0.22, { to: 55, vol: 0.75 }); T(784, 0.1, { type: "square", vol: 0.24 }); T(1047, 0.32, { type: "square", vol: 0.24, delay: 0.08 }); T(1568, 0.3, { type: "triangle", vol: 0.2, delay: 0.08 }); N(0.2, { freq: 5000, filter: "highpass", vol: 0.1, delay: 0.06 }); break;
  }
}
/* 게임이 부르는 입구 · 꺼져 있으면 아무것도 안 한다 · 동시 8개 상한 */
function sfx(name, p) {
  if (!sndOn()) return;
  var c = sfxCtx(); if (!c) return;
  if (c.state !== "running") { try { c.resume(); } catch (e) {} }
  if (SFX.master) SFX.master.gain.value = SFX.site ? 0.7 : 0.85;   /* 261017 셀프 효과음 0.7(배경 음악 자리) */
  if (SFX.voices >= 8) return;
  SFX.voices++;
  setTimeout(function () { SFX.voices = Math.max(0, SFX.voices - 1); }, ((SFX_LEN[name] || 0.2) + 0.05) * 1000);
  try { sfxPlay(name, p); } catch (e) {}
}
/* 스피커 선 아이콘 · 켬(음파) · 끔(X) */
function sndIcon(on) {
  return SICO + '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/>' + (on ? '<path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/>' : '<path d="M16 9.5l5 5M21 9.5l-5 5"/>') + "</svg>";
}
function sndBtnHtml(site) {
  var on = site ? S.get("site_sound", true) === true : S.get("game_sound", null) === true;
  return '<button class="snd-btn' + (on ? " on" : "") + '" type="button" aria-label="효과음 ' + (on ? "끄기" : "켜기") + '" data-site="' + (site ? 1 : 0) + '" onpointerdown="event.preventDefault()" onclick="sndToggle(' + (site ? "true" : "false") + ')">' + sndIcon(on) + "</button>";
}
function sndToggle(site) {
  var key = site ? "site_sound" : "game_sound", on = !(S.get(key, site ? true : null) === true);
  S.set(key, on);
  if (on) { sfxUnlock(); SFX.site = !!site; sfx("click"); }
  Array.prototype.forEach.call(document.querySelectorAll('.snd-btn[data-site="' + (site ? 1 : 0) + '"]'), function (b) {
    b.classList.toggle("on", on); b.setAttribute("aria-label", "효과음 " + (on ? "끄기" : "켜기")); b.innerHTML = sndIcon(on);
  });
  if (typeof rgFocus === "function" && el("rgIn")) rgFocus();
}
/* START · 아직 안 골랐으면 선택 카드 한 번 */
var SND_START = { pang: "pgStart()", jump: "jpStart()", tetris: "ttStart()" };
function gsBegin(key) {
  SFX.site = false;
  if (GS_HOW[key]) { GS.first = !gsHowSeen(key) || GS.first === key ? key : ""; gsHowMark(key); gshStop(); }   /* v5.41 이 사람의 이 게임 첫 판 · 소리 선택 카드를 닫고 다시 눌러도 첫 판 */
  if (sndChosen()) { gspStop(); if (sndOn()) sfxUnlock(); new Function(SND_START[key])(); return; }   /* v4.11 시작하면 미리보기를 멈춘다 */
  modalOpen('<div class="ax-stack-tight axs-gap12">' +
    '<p class="ax-description">주변에 소리가 날 수 있어요. 아이폰은 무음 모드에서 소리가 나지 않을 수 있어요.</p>' +
    '<button type="button" class="ax-button" onclick="sndChoose(true, \'' + key + '\')">소리 켜고 시작할게요</button>' +
    '<button type="button" class="ax-button ax-button-weak" onclick="sndChoose(false, \'' + key + '\')">소리 없이 시작할게요</button></div>', "효과음을 켤까요?");
}
function sndChoose(on, key) {
  S.set("game_sound", !!on);
  if (on) sfxUnlock();   /* 이 탭 안에서 잠금 해제 */
  modalClose();
  gspStop();
  new Function(SND_START[key])();
}

/* ═══ 261017 1F 타자왕 배경 음악(「타자왕 개편 제안」 7절 · 사용자 확정 D6 · D8) ═══
   WebAudio 직접 합성 · 음원 파일 없음 · 곡 두 개 모두 직접 지음(기존 곡 멜로디 · 진행 차용 없음 · 흔한 화음 진행만) ·
   네 성부 = 펄스 A(멜로디 · 듀티 25%) · 펄스 B(아르페지오 · 12.5%) · 삼각(베이스) · 잡음(킥 = 사인 120→45Hz · 스네어 = 대역 1.8k · 하이햇 = 고역 7k 0.02초) · 펄스 = PeriodicWave ·
   판 곡 = 가단조 16마디 반복(1단계 112BPM · 단계마다 +4 · 100초 뒤 10초마다 +1 · 최대 140) · 보너스 스테이지 곡 = 다장조 4마디 반복 150BPM ·
   흐름 = 대기 · 카운트다운 무음 → 「시작!」부터 판 곡 → 보너스 스테이지 전환(title) ~ 결과(res) 다장조 곡 → 판 복귀에 판 곡 이어서 → 게임 오버 0.4초 줄임 → 결과 화면 무음 ·
   음량 = 음악 버스 0.2(효과음과 같은 압축기) · 목숨 잃을 때 0.15초 0.6배 · 켜고 끄기 = 화면 오른쪽 위 단추 · F4 · 기기 저장 site_bgm(기본 켬) · 효과음 끔(site_sound)이면 음악도 안 난다 ·
   스케줄러 25ms · 0.12초 앞서 예약 · 송출 TV 는 이 파일을 읽지 않는다(무음 그대로) */
var BGM = { t: 0, bus: null, wv: null, cur: "", pos: 0, next: 0, gpos: 0, vol: 0.2, n: 0 };
var BGM_SONG = {
  game: { bars: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59], [50, 53, 57], [57, 60, 64], [53, 57, 60], [55, 59, 62], [57, 60, 64], [53, 57, 60], [52, 56, 59], [57, 60, 64]],
    root: [45, 41, 48, 43, 45, 41, 43, 40, 38, 45, 41, 43, 45, 41, 40, 45],
    mel: [[64, 0, 69, 0, 67, 64, 62, 60], [57, 0, 60, 0, 65, 0, 64, 60], [64, 67, 72, 0, 71, 67, 64, 0], [62, 0, 59, 0, 62, 67, 65, 62],
      [64, 0, 69, 0, 72, 71, 69, 64], [65, 64, 60, 57, 60, 0, 65, 0], [67, 0, 62, 0, 59, 62, 67, 71], [68, 0, 64, 0, 59, 0, -1, -1],
      [62, 65, 69, 0, 65, 62, 57, 0], [60, 64, 69, 0, 64, 60, 57, 60], [65, 0, 69, 0, 72, 0, 69, 65], [67, 65, 62, 59, 62, 0, 67, 0],
      [69, 0, 64, 0, 60, 64, 69, 72], [72, 71, 69, 65, 69, 0, 72, 0], [71, 0, 68, 0, 64, 68, 71, 74], [72, 0, 71, 0, 69, 0, -1, -1]] },
  bns: { bars: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], root: [48, 45, 41, 43],
    mel: [[60, 64, 67, 72, 67, 64, 60, 64], [57, 60, 64, 69, 64, 60, 57, 60], [65, 69, 72, 69, 65, 60, 65, 69], [67, 0, 71, 0, 74, 0, 67, 0]] }
};
function bgmPref() { return S.get("site_bgm", true) === true; }
function bgmOk() { return !!SFX.site && S.get("site_sound", true) === true && bgmPref(); }
function bgmHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function bgmWave(c, d) {   /* 펄스 · 듀티 d · 배음 32 개 */
  var n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for (var k = 1; k < n; k++) { re[k] = Math.sin(2 * Math.PI * k * d) / (k * Math.PI); im[k] = (1 - Math.cos(2 * Math.PI * k * d)) / (k * Math.PI); }
  return c.createPeriodicWave(re, im);
}
function bgmBus() {
  var c = sfxCtx(); if (!c) return null;
  if (!SFX.master) sfxChain(c);
  if (!BGM.bus || BGM.bus.context !== c) {
    var g = c.createGain(); g.gain.value = 0.0001; g.connect(SFX.comp || c.destination); BGM.bus = g;
    if (!BGM.wv) BGM.wv = { a: bgmWave(c, 0.25), b: bgmWave(c, 0.125) };
  }
  return c;
}
function bgmNote(c, w, f, t, dur, v) {
  var o = c.createOscillator(), g = c.createGain();
  if (typeof w === "string") o.type = w; else o.setPeriodicWave(w);
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.setValueAtTime(v, t + Math.max(0.01, dur * 0.7)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(BGM.bus); o.start(t); o.stop(t + dur + 0.02); BGM.n++;
}
function bgmDrum(c, k, t) {
  if (k === "kick") { var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g); g.connect(BGM.bus); o.start(t); o.stop(t + 0.16); return; }
  var src = c.createBufferSource(), f = c.createBiquadFilter(), g2 = c.createGain(), d = k === "snare" ? 0.12 : 0.02;
  src.buffer = sfxNoiseBuf(c); f.type = k === "snare" ? "bandpass" : "highpass"; f.frequency.value = k === "snare" ? 1800 : 7000; f.Q.value = 1;
  g2.gain.setValueAtTime(k === "snare" ? 0.32 : 0.12, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(f); f.connect(g2); g2.connect(BGM.bus); src.start(t); src.stop(t + d + 0.02);
}
/* 한 박(16분음표) · pos = 곡 안 16분음표 번호 · 멜로디 · 베이스 = 8분음표 · 0 = 앞 음을 끈다 · -1 = 쉼 */
function bgmStep(c, song, pos, t, sp) {
  var S0 = BGM_SONG[song], bar = Math.floor(pos / 16) % S0.mel.length, st = pos % 16, ch = S0.bars[bar], r = S0.root[bar];
  if (st % 2 === 0) {
    var m = S0.mel[bar], i = st / 2, nt = m[i];
    if (nt > 0) { var len = 1; while (i + len < 8 && m[i + len] === 0) len++; bgmNote(c, BGM.wv.a, bgmHz(nt), t, len * 2 * sp * 0.92, 0.3); }
    bgmNote(c, "triangle", bgmHz(r + (i % 2 ? 12 : 0) + (i === 6 ? 7 : 0)), t, 2 * sp * 0.9, 0.42);
    bgmDrum(c, "hat", t);
  }
  bgmNote(c, BGM.wv.b, bgmHz(ch[[0, 1, 2, 1][st % 4]] + 12), t, sp * 0.8, 0.06);
  if (st === 0 || st === 8 || (song === "bns" && st === 10)) bgmDrum(c, "kick", t);
  if (st === 4 || st === 12) bgmDrum(c, "snare", t);
}
function bgmBpm(song) {
  if (song === "bns") return 150;
  return Math.min(140, 112 + 4 * Math.max(0, (RG.stage || 1) - 1) + Math.max(0, Math.floor(((RG.surv || 0) - 100) / 10)));
}
function bgmWant() {
  if (typeof RG === "undefined" || !RG.on || RG.mode !== "site" || RG.paused || RG.ending || !bgmOk()) return "";
  if (RG.bonus) { var ph = RG.bonus.ph; return ph === "title" || ph === "wout" || ph === "intro" || ph === "count" || ph === "type" || ph === "res" ? "bns" : ""; }
  return RG.wait || RG.cd > 0 || !RG.t0 ? "" : "game";
}
function bgmTick() {
  var want = bgmWant();
  if (!want && !BGM.cur) { if (!(typeof RG !== "undefined" && RG.on)) bgmStop(); return; }
  var c = bgmBus(); if (!c || c.state !== "running") return;
  var now = c.currentTime;
  if (want !== BGM.cur) {
    var fade = typeof RG !== "undefined" && RG.ending ? 0.4 : 0.08;   /* 게임 오버 = 0.4초 줄인다 */
    if (BGM.cur) {
      if (BGM.cur === "game") BGM.gpos = BGM.pos;
      var old = BGM.bus; BGM.bus = null;
      try { old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(Math.max(0.0001, old.gain.value), now); old.gain.exponentialRampToValueAtTime(0.0001, now + fade); } catch (e) {}
      setTimeout(function () { try { old.disconnect(); } catch (e) {} }, fade * 1000 + 400);   /* 예약해 둔 음은 옛 버스와 함께 끊긴다 */
      bgmBus(); BGM.next = now + fade;
    } else BGM.next = now + 0.05;
    BGM.cur = want; BGM.pos = want === "game" ? BGM.gpos : 0;
    if (!want) return;
    BGM.bus.gain.setValueAtTime(0.0001, BGM.next); BGM.bus.gain.exponentialRampToValueAtTime(BGM.vol, BGM.next + 0.05);
  }
  var sp = 60 / bgmBpm(BGM.cur) / 4, N = BGM_SONG[BGM.cur].mel.length * 16;
  if (BGM.next < now) BGM.next = now + 0.02;
  while (BGM.next < now + 0.12) { try { bgmStep(c, BGM.cur, BGM.pos, BGM.next, sp); } catch (e) {} BGM.next += sp; BGM.pos = (BGM.pos + 1) % N; }
}
function bgmArm() { BGM.gpos = 0; if (!BGM.t) BGM.t = setInterval(bgmTick, 25); }   /* 판이 열릴 때(rgPlayOpen · 셀프만) · 판 곡은 처음부터 */
function bgmStop() {
  if (BGM.t) { clearInterval(BGM.t); BGM.t = 0; }
  if (BGM.bus) { try { var c = BGM.bus.context, g = BGM.bus; g.gain.cancelScheduledValues(c.currentTime); g.gain.setValueAtTime(0.0001, c.currentTime); setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 300); } catch (e) {} BGM.bus = null; }
  BGM.cur = "";
}
/* 목숨을 잃을 때 0.15초 0.6배 */
function bgmDuck() {
  if (!BGM.bus || !BGM.cur) return;
  try { var t = BGM.bus.context.currentTime, g = BGM.bus.gain; g.cancelScheduledValues(t); g.setValueAtTime(BGM.vol * 0.6, t); g.setValueAtTime(BGM.vol * 0.6, t + 0.15); g.linearRampToValueAtTime(BGM.vol, t + 0.2); } catch (e) {}
}
/* 켜고 끄기 · 화면 오른쪽 위 단추 · F4 · 기기 저장(조용한 저장 S.put · 판 도중 다시 그리기 없음) */
function bgmToggle() {
  var on = !bgmPref();
  S.put("site_bgm", on);
  if (on && S.get("site_sound", true) === true) sfxUnlock();
  bgmBtnSync();
  return on;
}
function bgmIcon(on) {   /* 도트 음표 · 끔 = 사선 */
  return '<svg viewBox="0 0 16 16" width="24" height="24" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 2h8v2H8v7H6zM12 4h2v7h-2zM3 10h5v4H3zM9 9h5v4H9z"/>' + (on ? "" : '<path class="x" d="M1 1h2v2H1zM3 3h2v2H3zM5 5h2v2H5zM7 7h2v2H7zM9 9h2v2H9zM11 11h2v2h-2zM13 13h2v2h-2z"/>') + "</svg>";
}
function bgmBtnSync() {
  var b = document.getElementById("tsfBgm"); if (!b) return;
  var on = bgmPref() && S.get("site_sound", true) === true;
  if (b._on === on) return;
  b._on = on;
  b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", "배경 음악 " + (on ? "끄기" : "켜기") + " · F4"); b.title = "배경 음악 " + (on ? "켬" : "끔") + " · F4";
  b.innerHTML = bgmIcon(on) + "<span>" + (on ? "음악 켬" : "음악 끔") + "</span>";
}
/* 셀프 화면에 단추 하나(판 도중 · 대기 · 결과 모두) · 누르면 입력칸 초점을 빼앗지 않는다(mousedown · pointerdown 기본 동작 막음 · tabindex -1) */
function bgmBtn(show) {
  var b = document.getElementById("tsfBgm");
  if (!show) { if (b) b.remove(); return; }
  if (!b) {
    b = document.createElement("button"); b.type = "button"; b.id = "tsfBgm"; b.className = "rt tsf-bgm"; b.tabIndex = -1;
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); });
    b.addEventListener("mousedown", function (e) { e.preventDefault(); });
    b.addEventListener("click", function (e) { e.preventDefault(); bgmToggle(); if (typeof rgFocusWant === "function" && rgFocusWant()) rgFocus(); });
    document.body.appendChild(b);
  }
  bgmBtnSync();
}
document.addEventListener("keydown", function (e) {
  if (e.key !== "F4" || typeof App === "undefined" || App.current !== "type_site" || typeof tsfOn !== "function" || !tsfOn() || document.getElementById("modal")) return;
  e.preventDefault(); e.stopPropagation();
  if (!e.repeat) bgmToggle();
}, true);


