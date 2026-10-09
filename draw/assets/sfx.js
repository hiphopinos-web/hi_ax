/* AX Festival 2026 럭키드로우 · 합성음 엔진 (WebAudio 만 사용 · 녹음·샘플 파일 없음 · 라이선스 문제 없음)
 * 모든 소리는 when(초, ctx 시계) 을 받는다. 같은 함수를 실시간 AudioContext 와 OfflineAudioContext(쇼릴 음원 굽기) 양쪽에서 쓴다.
 * 녹화 모드에서는 SFX.log 에 [시각, 이름, 인자] 를 쌓고, 굽기 단계에서 같은 순서로 다시 부른다. */
(function () {
  function Sfx(ctx) {
    this.ctx = ctx;
    var c = ctx;
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.knee.value = 12; this.comp.ratio.value = 4;
    this.comp.attack.value = 0.004; this.comp.release.value = 0.18;
    this.master = c.createGain(); this.master.gain.value = 0.9;
    this.master.connect(this.comp); this.comp.connect(c.destination);
    /* 잔향 · 합성 임펄스(지수 감쇠 노이즈) · 강당 느낌만 살짝 */
    this.verb = c.createConvolver();
    var len = Math.floor(c.sampleRate * 2.2), ir = c.createBuffer(2, len, c.sampleRate), seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.verb.buffer = ir;
    this.verbIn = c.createGain(); this.verbIn.gain.value = 0.22;
    this.verbIn.connect(this.verb); this.verb.connect(this.master);
    /* 노이즈 버퍼 하나를 여러 소리가 나눠 쓴다 */
    var nlen = c.sampleRate * 2; this.noise = c.createBuffer(1, nlen, c.sampleRate);
    var nd = this.noise.getChannelData(0); seed = 11; for (var j = 0; j < nlen; j++) nd[j] = rnd() * 2 - 1;
    /* 바람(에어 믹서) · 계속 도는 노이즈 · 레벨만 바꾼다 */
    this.airSrc = c.createBufferSource(); this.airSrc.buffer = this.noise; this.airSrc.loop = true;
    this.airBp = c.createBiquadFilter(); this.airBp.type = "bandpass"; this.airBp.frequency.value = 700; this.airBp.Q.value = 0.7;
    this.airG = c.createGain(); this.airG.gain.value = 0;
    this.airSrc.connect(this.airBp); this.airBp.connect(this.airG); this.airG.connect(this.master);
    this.airSrc.start(0);
  }
  var P = Sfx.prototype;
  P.t = function (when) { return when == null ? this.ctx.currentTime : when; };
  P.out = function (node, wet) { node.connect(this.master); if (wet) { var g = this.ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(this.verbIn); } };
  P.env = function (g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); };
  P.osc = function (type, f, t, dur) { var o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.05); return o; };
  P.nz = function (t, dur) { var s = this.ctx.createBufferSource(); s.buffer = this.noise; s.start(t, Math.random() * 1.5, dur + 0.05); return s; };

  /* 공이 통에 떨어지는 소리 · 짧은 톡 (음높이 변주) */
  P.drop = function (when, k) {
    var t = this.t(when), c = this.ctx; k = k == null ? 0.5 : k;
    var o = this.osc("sine", 900 + 500 * k, t, 0.12), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(260 + 120 * k, t + 0.09);
    this.env(g, t, 0.002, 0.22, 0.11); o.connect(g); this.out(g, 0.35);
    var n = this.nz(t, 0.03), hp = c.createBiquadFilter(), g2 = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 3000; this.env(g2, t, 0.001, 0.08, 0.03);
    n.connect(hp); hp.connect(g2); this.out(g2, 0);
  };
  /* 공끼리 부딪는 딸각 · 플라스틱 볼 */
  P.clack = function (when, v) {
    var t = this.t(when), c = this.ctx; v = Math.min(1, v || 0.5);
    var n = this.nz(t, 0.025), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass"; bp.frequency.value = 2400 + Math.random() * 2600; bp.Q.value = 6;
    this.env(g, t, 0.001, 0.05 + 0.25 * v, 0.03); n.connect(bp); bp.connect(g); this.out(g, 0.15);
  };
  P.air = function (when, level) {
    var t = this.t(when);
    this.airG.gain.setTargetAtTime(0.0001 + 0.16 * level, t, 0.35);
    this.airBp.frequency.setTargetAtTime(500 + 900 * level, t, 0.5);
  };
  /* 믹싱 박자 · 낮은 킥 + 하이햇 (120bpm 에 맞춰 호출) */
  P.beat = function (when, strong) {
    var t = this.t(when), c = this.ctx;
    var o = this.osc("sine", 120, t, 0.3), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    this.env(g, t, 0.003, strong ? 0.55 : 0.32, 0.26); o.connect(g); this.out(g, 0);
    var n = this.nz(t + 0.25, 0.04), hp = c.createBiquadFilter(), g2 = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 7000; this.env(g2, t + 0.25, 0.001, 0.05, 0.04);
    n.connect(hp); hp.connect(g2); this.out(g2, 0.1);
  };
  /* 룰렛처럼 공을 옮겨 다니는 틱 · p = 0..1 로 음이 올라간다 */
  P.tick = function (when, p) {
    var t = this.t(when), c = this.ctx;
    var o = this.osc("triangle", 700 + 900 * p, t, 0.06), g = c.createGain();
    this.env(g, t, 0.001, 0.2, 0.05); o.connect(g); this.out(g, 0.25);
  };
  P.heart = function (when) {
    var t = this.t(when), c = this.ctx;
    [0, 0.17].forEach(function (d, i) {
      var o = this.osc("sine", 70, t + d, 0.25), g = c.createGain();
      o.frequency.exponentialRampToValueAtTime(38, t + d + 0.2);
      this.env(g, t + d, 0.004, i ? 0.35 : 0.55, 0.22); o.connect(g); this.out(g, 0);
    }, this);
  };
  /* 긴장 상승음 · 노이즈 스윕 + 사인 글리산도 */
  P.riser = function (when, dur) {
    var t = this.t(when), c = this.ctx;
    var n = this.nz(t, dur), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass"; bp.Q.value = 3; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(5200, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + dur * 0.95); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    n.connect(bp); bp.connect(g); this.out(g, 0.3);
    var o = this.osc("sawtooth", 110, t, dur), lp = c.createBiquadFilter(), g2 = c.createGain();
    o.frequency.exponentialRampToValueAtTime(440, t + dur);
    lp.type = "lowpass"; lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(2400, t + dur);
    g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.07, t + dur * 0.9); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(lp); lp.connect(g2); this.out(g2, 0.2);
  };
  /* 당첨 공이 정해지는 순간 · 금속성 락 */
  P.lock = function (when) {
    var t = this.t(when), c = this.ctx;
    [1, 2.76, 5.4].forEach(function (m) {
      var o = this.osc("sine", 520 * m, t, 0.5), g = c.createGain();
      this.env(g, t, 0.001, 0.18 / m, 0.45); o.connect(g); this.out(g, 0.4);
    }, this);
    this.clack(t, 1);
  };
  /* v3.1 · 틈의 미닫이 문 · 열림 = 짧게 미끄러지는 소리 + 끝에서 「철컥」 · 닫힘 = 짧은 「탁」 · v = 크기(체크인 중 넣을 때는 작게) */
  P.hatch = function (when, open, v) {
    var t = this.t(when), c = this.ctx; v = v == null ? 1 : v;
    var sd = open ? 0.2 : 0.09;
    var n = this.nz(t, sd), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass"; bp.Q.value = 2.2; bp.frequency.setValueAtTime(open ? 900 : 1400, t); bp.frequency.exponentialRampToValueAtTime(open ? 2600 : 2000, t + sd);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + sd * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + sd);
    n.connect(bp); bp.connect(g); this.out(g, 0.2);
    var tc = t + sd, o = this.osc("square", open ? 82 : 110, tc, 0.14), lp = c.createBiquadFilter(), g2 = c.createGain();
    lp.type = "lowpass"; lp.frequency.value = 700; this.env(g2, tc, 0.002, 0.3 * v, 0.12); o.connect(lp); lp.connect(g2); this.out(g2, 0.25);
    this.clack(tc, 0.9 * v); if (open) this.clack(tc + 0.035, 0.6 * v);
  };
  /* 배출구 · 굴러 나가는 소리 */
  P.roll = function (when, dur) {
    var t = this.t(when), c = this.ctx;
    for (var i = 0; i < 9; i++) this.clack(t + i * dur / 9 * (1 - i * 0.04), 0.5 - i * 0.04);
    var o = this.osc("sine", 180, t + dur, 0.2), g = c.createGain();
    this.env(g, t + dur, 0.002, 0.4, 0.18); o.connect(g); this.out(g, 0.2);
  };
  P.whoosh = function (when, dur) {
    var t = this.t(when), c = this.ctx; dur = dur || 0.7;
    var n = this.nz(t, dur), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass"; bp.Q.value = 1.2; bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(3000, t + dur * 0.6); bp.frequency.exponentialRampToValueAtTime(800, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(g); this.out(g, 0.4);
  };
  /* 공개 순간 · 킥 + 노이즈 폭발 + 장조 화음 반짝임 */
  P.hit = function (when) {
    var t = this.t(when), c = this.ctx;
    var o = this.osc("sine", 150, t, 0.6), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(40, t + 0.4); this.env(g, t, 0.002, 0.9, 0.55); o.connect(g); this.out(g, 0.2);
    var n = this.nz(t, 0.8), lp = c.createBiquadFilter(), g2 = c.createGain();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(9000, t); lp.frequency.exponentialRampToValueAtTime(600, t + 0.8);
    this.env(g2, t, 0.002, 0.35, 0.75); n.connect(lp); lp.connect(g2); this.out(g2, 0.5);
    this.chord(t + 0.02, 2.6, [0, 4, 7, 11, 14], 261.63);
    var self = this;
    [0, 4, 7, 12, 16, 19, 24].forEach(function (s, i) { self.bell(t + 0.12 + i * 0.07, 523.25 * Math.pow(2, s / 12), 0.1); });
  };
  P.bell = function (when, f, v) {
    var t = this.t(when), c = this.ctx;
    var o = this.osc("sine", f, t, 1.2), o2 = this.osc("sine", f * 2.01, t, 0.6), g = c.createGain(), g2 = c.createGain();
    this.env(g, t, 0.002, v, 1.1); this.env(g2, t, 0.002, v * 0.3, 0.5);
    o.connect(g); o2.connect(g2); this.out(g, 0.6); this.out(g2, 0.6);
  };
  P.chord = function (when, dur, semis, root) {
    var t = this.t(when), c = this.ctx, self = this;
    semis.forEach(function (s) {
      var f = root * Math.pow(2, s / 12);
      [-6, 6].forEach(function (cents) {
        var o = self.osc("sawtooth", f, t, dur), lp = c.createBiquadFilter(), g = c.createGain();
        o.detune.value = cents; lp.type = "lowpass"; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g); self.out(g, 0.5);
      });
    });
  };
  /* 끝 화면 · ME to WE 심볼이 완성되는 순간 · 크게 한 번 + 긴 화음 */
  P.finale = function (when) {
    var t = this.t(when), self = this;
    this.hit(t);
    this.chord(t + 0.05, 7, [0, 7, 12, 16, 19, 24], 130.81);
    [0, 4, 7, 12, 16, 19, 24, 28].forEach(function (s, i) { self.bell(t + 0.6 + i * 0.11, 523.25 * Math.pow(2, s / 12), 0.09); });
  };
  P.pad = function (when, dur) { this.chord(when, dur || 5, [0, 7, 12, 16, 19], 130.81); };
  /* 같은 분의 다른 공이 빠질 때 · 작은 팝 */
  P.pop = function (when) {
    var t = this.t(when), c = this.ctx;
    var o = this.osc("sine", 1400, t, 0.08), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(500, t + 0.07); this.env(g, t, 0.001, 0.15, 0.07); o.connect(g); this.out(g, 0.3);
  };
  P.stamp = function (when) {
    var t = this.t(when), c = this.ctx;
    var o = this.osc("square", 90, t, 0.18), lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = "lowpass"; lp.frequency.value = 600; this.env(g, t, 0.002, 0.35, 0.16); o.connect(lp); lp.connect(g); this.out(g, 0.3);
    this.clack(t, 0.8);
  };

  /* ── 실시간 래퍼 · 음소거 · 첫 키 입력 전에는 소리가 나지 않는다(브라우저 자동재생 규칙) ── */
  var SFX = { on: true, rt: null, log: null, clock: null };
  SFX.ensure = function () {
    if (SFX.log) return null;
    if (!SFX.rt) { try { var AC = window.AudioContext || window.webkitAudioContext; SFX.rt = new Sfx(new AC()); } catch (e) { SFX.rt = null; } }
    if (SFX.rt && SFX.rt.ctx.state === "suspended") SFX.rt.ctx.resume();
    return SFX.rt;
  };
  SFX.play = function (name) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (SFX.log) { SFX.log.push([SFX.clock(), name, args]); return; }
    if (!SFX.on || !SFX.rt || SFX.rt.ctx.state !== "running") return;
    try { SFX.rt[name].apply(SFX.rt, [null].concat(args)); } catch (e) {}
  };
  /* 261009 부저 음악 · d 초 뒤에 친다(음악 박자 · 화면 시계 기준 앞당겨 예약) · 녹화 모드에서는 시계 + d 로 기록 */
  SFX.at = function (d, name) {
    var args = Array.prototype.slice.call(arguments, 2);
    if (SFX.log) { SFX.log.push([SFX.clock() + Math.max(0, d), name, args]); return; }
    if (!SFX.on || !SFX.rt || SFX.rt.ctx.state !== "running") return;
    try { SFX.rt[name].apply(SFX.rt, [SFX.rt.ctx.currentTime + Math.max(0, d)].concat(args)); } catch (e) {}
  };
  SFX.mute = function (m) { SFX.on = !m; if (SFX.rt) SFX.rt.master.gain.setTargetAtTime(m ? 0 : 0.9, SFX.rt.ctx.currentTime, 0.05); };
  /* 쇼릴 음원 굽기 · log 를 오프라인 컨텍스트에 다시 친다 → Float32 스테레오 */
  SFX.render = function (log, dur) {
    var sr = 48000, oc = new OfflineAudioContext(2, Math.ceil(sr * dur), sr), s = new Sfx(oc);
    log.forEach(function (e) { try { s[e[1]].apply(s, [Math.max(0, e[0])].concat(e[2])); } catch (x) {} });
    return oc.startRendering();
  };
  window.Sfx = Sfx; window.SFX = SFX;
})();
