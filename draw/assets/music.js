/* AX Festival 2026 럭키드로우 · 부저 음악 (261009 · stage.html 전용)
 *   WebAudio 로 직접 합성한다 · 녹음 · 샘플 · 외부 음원 파일 없음 → 저작권 · 라이선스 문제 없음 · 오프라인에서도 그대로 난다
 *   sfx.js 의 Sfx 에 악기를 덧붙이고(실시간 · 녹화용 오프라인 굽기 양쪽에서 같은 함수), 박자는 MUSIC 이 16분음표 단위로 앞당겨 예약한다
 *   곡(모두 자작 · 코드 진행만 흔한 것)
 *     wait  = 부저 대기 루프 · 112bpm · A 단조 Am-F-C-G · 가볍게 기다리는 그루브
 *     spin  = 부저 뒤 회전 · 138bpm · A 페달 · 16분 베이스 + 킥 4박 + 스탭 · 쌓이는 느낌
 *     party = 당첨 공개 뒤 깔리는 루프 · 120bpm · C 장조 C-G-Am-F · 사회자 목소리 밑으로 작게
 *   한 번 치는 소리: buzzer(부저 · 충격 + 상승 잽 + 심벌) · mRoll(스네어 롤 · 번호 릴) · mDown(감속 시작 · 내려가는 소리) · mDrone(감속 중 낮은 울림) · fanfare(s · m · l)
 *   소리는 진행 조건이 아니다 · 소리가 안 나와도 화면은 똑같이 간다 */
(function () {
  var P = window.Sfx.prototype;
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* 음악 버스 · 음악만 따로 줄이고 끈다(N) */
  P.mbus = function () {
    if (!this._mb) { var g = this.ctx.createGain(); g.gain.value = MUSIC.on ? MUSIC.vol : 0; g.connect(this.master); this._mb = g; }
    return this._mb;
  };
  P.mo = function (node, wet) { node.connect(this.mbus()); if (wet) { var g = this.ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(this.verbIn); } };

  P.mKick = function (when, v) {
    var t = this.t(when), c = this.ctx; v = v == null ? 0.8 : v;
    var o = this.osc("sine", 160, t, 0.42), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(44, t + 0.13);
    this.env(g, t, 0.002, v, 0.34); o.connect(g); this.mo(g, 0);
    var n = this.nz(t, 0.012), hp = c.createBiquadFilter(), g2 = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 1800; this.env(g2, t, 0.001, v * 0.12, 0.012); n.connect(hp); hp.connect(g2); this.mo(g2, 0);
  };
  P.mSnare = function (when, v) {
    var t = this.t(when), c = this.ctx; v = v == null ? 0.5 : v;
    var n = this.nz(t, 0.2), hp = c.createBiquadFilter(), g = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 1300; this.env(g, t, 0.001, v * 0.55, 0.15); n.connect(hp); hp.connect(g); this.mo(g, 0.25);
    var o = this.osc("triangle", 220, t, 0.12), g2 = c.createGain();
    o.frequency.exponentialRampToValueAtTime(150, t + 0.08); this.env(g2, t, 0.001, v * 0.45, 0.08); o.connect(g2); this.mo(g2, 0.1);
  };
  P.mClap = function (when, v) {
    var t = this.t(when), c = this.ctx; v = v == null ? 0.3 : v;
    for (var k = 0; k < 3; k++) {
      var tt = t + k * 0.011, n = this.nz(tt, k === 2 ? 0.14 : 0.02), bp = c.createBiquadFilter(), g = c.createGain();
      bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 1.4; this.env(g, tt, 0.001, v * (k === 2 ? 0.8 : 0.5), k === 2 ? 0.12 : 0.015);
      n.connect(bp); bp.connect(g); this.mo(g, 0.3);
    }
  };
  P.mHat = function (when, v, open) {
    var t = this.t(when), c = this.ctx, d = open ? 0.16 : 0.035; v = v == null ? 0.1 : v;
    var n = this.nz(t, d), hp = c.createBiquadFilter(), g = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 7600; this.env(g, t, 0.001, v, d); n.connect(hp); hp.connect(g); this.mo(g, 0.05);
  };
  P.mBass = function (when, m, dur, v, cut) {
    var t = this.t(when), c = this.ctx; v = v == null ? 0.3 : v;
    var o = this.osc("sawtooth", mtof(m), t, dur + 0.05), o2 = this.osc("square", mtof(m - 12), t, dur + 0.05), lp = c.createBiquadFilter(), g = c.createGain(), g2 = c.createGain();
    lp.type = "lowpass"; lp.Q.value = 4; lp.frequency.setValueAtTime(cut || 900, t); lp.frequency.exponentialRampToValueAtTime(160, t + dur);
    g2.gain.value = 0.5; o2.connect(g2); g2.connect(lp); o.connect(lp);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.setValueAtTime(v, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); this.mo(g, 0);
  };
  P.mPluck = function (when, m, dur, v) {
    var t = this.t(when), c = this.ctx; v = v == null ? 0.07 : v;
    var o = this.osc("triangle", mtof(m), t, dur), o2 = this.osc("sawtooth", mtof(m) * 1.003, t, dur), lp = c.createBiquadFilter(), g = c.createGain(), g2 = c.createGain();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
    g2.gain.value = 0.35; o2.connect(g2); g2.connect(lp); o.connect(lp);
    this.env(g, t, 0.003, v, dur); lp.connect(g); this.mo(g, 0.35);
  };
  P.mPad = function (when, ms, dur, v) {
    var t = this.t(when), c = this.ctx, self = this; v = v == null ? 0.035 : v;
    ms.forEach(function (m) {
      [-7, 7].forEach(function (ct) {
        var o = self.osc("sawtooth", mtof(m), t, dur + 0.4), lp = c.createBiquadFilter(), g = c.createGain();
        o.detune.value = ct; lp.type = "lowpass"; lp.frequency.value = 1100;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.35); g.gain.setValueAtTime(v, t + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
        o.connect(lp); lp.connect(g); self.mo(g, 0.45);
      });
    });
  };
  /* 금관 같은 신스 · 팡파르 · 스탭 */
  P.mBrass = function (when, m, dur, v) {
    var t = this.t(when), c = this.ctx, self = this; v = v == null ? 0.1 : v;
    var lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = "lowpass"; lp.Q.value = 2; lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(3600, t + 0.05); lp.frequency.exponentialRampToValueAtTime(1600, t + 0.05 + Math.min(dur, 0.6));
    [-9, 0, 9].forEach(function (ct) { var o = self.osc("sawtooth", mtof(m), t, dur + 0.2); o.detune.value = ct; o.connect(lp); });
    var o3 = this.osc("square", mtof(m - 12), t, dur + 0.2), g3 = c.createGain(); g3.gain.value = 0.3; o3.connect(g3); g3.connect(lp);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v * 0.85, t + Math.max(0.04, dur - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.16);
    lp.connect(g); this.mo(g, 0.4);
  };
  P.mCrash = function (when, v, dur) {
    var t = this.t(when), c = this.ctx; v = v == null ? 0.22 : v; dur = dur || 1.8;
    var n = this.nz(t, dur), hp = c.createBiquadFilter(), g = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 4200; this.env(g, t, 0.002, v, dur); n.connect(hp); hp.connect(g); this.mo(g, 0.6);
  };
  /* 스네어 롤 · r0 → r1 번/초 · v0 → v1 크기 */
  P.mRoll = function (when, dur, v0, v1, r0, r1) {
    var t = this.t(when), u = 0;
    while (u < dur) {
      var p = u / dur, v = v0 + (v1 - v0) * p * p, n = this.nz(t + u, 0.06), c = this.ctx, hp = c.createBiquadFilter(), g = c.createGain();
      hp.type = "highpass"; hp.frequency.value = 1500 + 1500 * p; this.env(g, t + u, 0.001, v * (0.8 + 0.4 * ((u * 97) % 1)), 0.05);
      n.connect(hp); hp.connect(g); this.mo(g, 0.25);
      u += 1 / (r0 + (r1 - r0) * p);
    }
  };
  /* 감속이 시작될 때 · 위에서 아래로 쓸려 내려가는 소리 */
  P.mDown = function (when, dur) {
    var t = this.t(when), c = this.ctx; dur = dur || 1.2;
    var n = this.nz(t, dur), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass"; bp.Q.value = 2; bp.frequency.setValueAtTime(5000, t); bp.frequency.exponentialRampToValueAtTime(220, t + dur);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(bp); bp.connect(g); this.mo(g, 0.4);
    var o = this.osc("sawtooth", 440, t, dur), lp = c.createBiquadFilter(), g2 = c.createGain();
    o.frequency.exponentialRampToValueAtTime(55, t + dur); lp.type = "lowpass"; lp.frequency.value = 900;
    g2.gain.setValueAtTime(0.06, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(lp); lp.connect(g2); this.mo(g2, 0.3);
  };
  /* 감속 중 낮은 울림 · 점점 부풀다 멈출 때 끊긴다 */
  P.mDrone = function (when, dur, m) {
    var t = this.t(when), c = this.ctx, self = this; m = m || 33;
    [0, 7, 12].forEach(function (s, i) {
      var o = self.osc(i ? "sawtooth" : "sine", mtof(m + s), t, dur), lp = c.createBiquadFilter(), g = c.createGain();
      lp.type = "lowpass"; lp.frequency.setValueAtTime(180, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(i ? 0.03 : 0.16, t + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.04);
      o.connect(lp); lp.connect(g); self.mo(g, 0.2);
    });
  };
  /* 부저 · 무대 위 사람이 누르는 순간 · 충격(저음) + 위로 튀는 잽 + 심벌 + 화음 한 방 */
  P.buzzer = function (when) {
    var t = this.t(when), c = this.ctx;
    var o = this.osc("sine", 140, t, 0.9), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(32, t + 0.5); this.env(g, t, 0.002, 1.0, 0.8); o.connect(g); g.connect(this.master);
    var z = this.osc("sawtooth", 180, t, 0.32), lp = c.createBiquadFilter(), g2 = c.createGain();
    z.frequency.exponentialRampToValueAtTime(2400, t + 0.26); lp.type = "lowpass"; lp.frequency.setValueAtTime(800, t); lp.frequency.exponentialRampToValueAtTime(6000, t + 0.26);
    this.env(g2, t, 0.004, 0.16, 0.3); z.connect(lp); lp.connect(g2); g2.connect(this.master);
    var n = this.nz(t, 0.5), bp = c.createBiquadFilter(), g3 = c.createGain();
    bp.type = "lowpass"; bp.frequency.setValueAtTime(8000, t); bp.frequency.exponentialRampToValueAtTime(500, t + 0.5); this.env(g3, t, 0.001, 0.4, 0.45);
    n.connect(bp); bp.connect(g3); g3.connect(this.master); var gw = c.createGain(); gw.gain.value = 0.5; g3.connect(gw); gw.connect(this.verbIn);
    this.mCrash(t + 0.01, 0.26, 2.2);
    var self = this; [57, 64, 69, 72].forEach(function (m) { self.mBrass(t + 0.02, m, 0.32, 0.07); });
  };
  /* 당첨 팡파르 · s = 6 ~ 4등(짧게) · m = 3 · 2등 · l = 1등(가장 길게) */
  P.fanfare = function (when, size) {
    var t = this.t(when), self = this;
    function N(d, m, dur, v) { self.mBrass(t + d, m, dur, v == null ? 0.09 : v); }
    function C(d, ms, dur, v) { ms.forEach(function (m) { self.mBrass(t + d, m, dur, v == null ? 0.05 : v); }); }
    if (size === "s") {
      N(0, 67, 0.1); N(0.12, 72, 0.1); C(0.24, [64, 67, 72, 76], 0.9, 0.055); self.mCrash(t + 0.24, 0.2, 1.6);
      self.mKick(t + 0.24, 0.7);
      return;
    }
    if (size === "m") {
      N(0, 72, 0.1); N(0.15, 72, 0.1); N(0.3, 72, 0.1); C(0.45, [64, 67, 72, 76], 0.5, 0.055);
      N(1.0, 74, 0.14); C(1.2, [65, 69, 72, 77], 0.28, 0.05); C(1.55, [67, 72, 76, 79], 1.4, 0.06);
      [0.45, 1.55].forEach(function (d) { self.mCrash(t + d, 0.22, 1.8); self.mKick(t + d, 0.8); });
      [0, 4, 7, 12, 16, 19].forEach(function (s, i) { self.bell(t + 1.6 + i * 0.07, 523.25 * Math.pow(2, s / 12), 0.07); });
      return;
    }
    /* l · 1등 · 올라가는 아르페지오 → 따따따 따~ → 한 번 더 높게 → 긴 화음 + 종소리 */
    [60, 64, 67, 72, 76, 79].forEach(function (m, i) { N(i * 0.07, m, 0.12, 0.06); });
    N(0.5, 72, 0.12); N(0.66, 72, 0.12); N(0.82, 72, 0.12); C(0.98, [64, 67, 72, 76], 0.55, 0.055);
    N(1.6, 74, 0.12); N(1.76, 74, 0.12); N(1.92, 74, 0.12); C(2.08, [65, 69, 74, 77], 0.55, 0.055);
    C(2.7, [67, 72, 76, 79, 84], 2.6, 0.06);
    [0.98, 2.08, 2.7].forEach(function (d) { self.mCrash(t + d, 0.24, 2.2); self.mKick(t + d, 0.85); });
    self.mRoll(t + 2.1, 0.6, 0.05, 0.22, 14, 30);
    [0, 4, 7, 12, 16, 19, 24, 28].forEach(function (s, i) { self.bell(t + 2.75 + i * 0.09, 523.25 * Math.pow(2, s / 12), 0.08); });
  };

  /* ─────────── 박자 예약 · 16분음표 단위 · 실시간은 오디오 시계, 녹화는 화면 시계 ─────────── */
  var MUSIC = window.MUSIC = { on: true, vol: 0.55, mode: "", next: 0, step: 0, bpm: 120, gain: 1 };
  var BPM = { wait: 112, spin: 138, party: 120 };
  function now() {
    if (window.SFX && SFX.log) return SFX.clock();
    if (window.SFX && SFX.rt) return SFX.rt.ctx.currentTime;
    return performance.now() / 1000;
  }
  MUSIC.set = function (mode) {
    if (MUSIC.mode === mode) return;
    MUSIC.mode = mode || ""; MUSIC.step = 0; MUSIC.next = now() + 0.02; MUSIC.bpm = BPM[mode] || 120;
  };
  MUSIC.tick = function () {
    var pat = PAT[MUSIC.mode]; if (!pat) return;
    var n = now(), sd = 60 / MUSIC.bpm / 4;
    if (MUSIC.next < n - 0.25) MUSIC.next = n + 0.02;     /* 시계가 바뀌었거나(첫 키 뒤 오디오 시작) 오래 멈췄다 · 박자를 다시 잡는다 */
    var guard = 0;
    while (MUSIC.next < n + 0.12 && guard++ < 16) { if (MUSIC.on) pat(MUSIC.step, MUSIC.next - n); MUSIC.next += sd; MUSIC.step++; }
  };
  MUSIC.toggle = function () {
    MUSIC.on = !MUSIC.on;
    if (window.SFX && SFX.rt && SFX.rt._mb) SFX.rt._mb.gain.setTargetAtTime(MUSIC.on ? MUSIC.vol : 0, SFX.rt.ctx.currentTime, 0.08);
    return MUSIC.on;
  };
  /* 한 번 치는 음악 소리도 음악 끄기(N)를 따른다 */
  MUSIC.hit = function (d, name) { if (!MUSIC.on) return; SFX.at.apply(SFX, arguments); };

  var A = function (d, name) { SFX.at.apply(SFX, arguments); };
  var PAT = {
    wait: function (s, d) {
      var bar = Math.floor(s / 16) % 4, i = s % 16, root = [45, 41, 48, 43][bar], ch = [[57, 60, 64], [57, 60, 65], [55, 60, 64], [55, 59, 62]][bar];
      if (i === 0 || i === 8 || (bar === 3 && i === 14)) A(d, "mKick", i === 14 ? 0.32 : 0.5);
      if (i === 4 || i === 12) A(d, "mClap", 0.22);
      if (i % 2 === 0) A(d, "mHat", i % 4 === 2 ? 0.09 : 0.045, false);
      if ([0, 3, 6, 8, 11, 14].indexOf(i) >= 0) A(d, "mBass", root + (i === 6 || i === 14 ? 12 : 0), 0.17, 0.26, 700);
      if ([0, 2, 4, 7, 10, 12].indexOf(i) >= 0) A(d, "mPluck", ch[(i / 2 | 0) % 3] + 12, 0.22, 0.05);
      if (i === 0) A(d, "mPad", ch, 2.1, 0.026);
    },
    spin: function (s, d) {
      var bar = Math.floor(s / 16), i = s % 16, b2 = bar % 2, lift = Math.min(1, bar / 4);
      if (i % 4 === 0) A(d, "mKick", 0.78);
      A(d, "mHat", i % 2 ? 0.05 + 0.04 * lift : 0.09, i % 4 === 2);
      if (i === 4 || i === 12) A(d, "mSnare", 0.32 + 0.15 * lift);
      if (bar >= 1 && i % 2 === 1) A(d, "mSnare", 0.06 + 0.1 * lift);
      A(d, "mBass", 33 + (i % 2 ? 12 : 0) + (b2 && i >= 12 ? 3 : 0), 0.1, 0.24, 500 + 1300 * lift);
      if (i === 0) [57, 64, 69].forEach(function (m) { A(d, "mBrass", m, 0.16, 0.06); });
      if (b2 && i === 14) [53, 60, 65].forEach(function (m) { A(d, "mBrass", m, 0.12, 0.05); });
      if (i === 0 && bar % 4 === 0) A(d, "mCrash", 0.12, 1.4);
    },
    party: function (s, d) {
      var bar = Math.floor(s / 16) % 4, i = s % 16, root = [48, 43, 45, 41][bar], ch = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]][bar];
      if (i === 0 || i === 8) A(d, "mKick", 0.4);
      if (i === 4 || i === 12) A(d, "mClap", 0.2);
      if (i % 2 === 1) A(d, "mHat", 0.05, i % 4 === 3);
      if (i % 2 === 0) A(d, "mBass", root + (i % 4 === 2 ? 12 : 0), 0.16, 0.2, 900);
      if ([0, 3, 6, 8, 10, 13].indexOf(i) >= 0) A(d, "mPluck", ch[[0, 1, 2, 1, 2, 0][[0, 3, 6, 8, 10, 13].indexOf(i)]] + 12, 0.2, 0.045);
    }
  };
})();
