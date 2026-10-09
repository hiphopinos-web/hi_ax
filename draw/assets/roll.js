/* AX Festival 2026 럭키드로우 · 드럼롤 (261009 3차 · stage.html 전용 · 옛 화면 index.html 은 쓰지 않는다)
 *   소리는 셋뿐: 부저 「쿵」 · 스네어 드럼롤 「두구두구」 · 진짜 멈출 때 「쾅」(베이스 드럼 + 크래시 심벌)
 *   멜로디 · 화음 · 음높이가 바뀌는 소리 없음 · 기다리는 동안은 소리 없음 · 공 소리 없음
 *   WebAudio 로 직접 합성한다 · 녹음 · 샘플 · 외부 음원 파일 없음(라이선스 문제 없음 · 인터넷 없이 그대로 난다)
 *   롤 셈여림: 부저 뒤 작게 시작 → 감속 · 배출 · 번호 릴을 따라 부풀고 → 끝자리 멈칫 동안에도 이어지다 → 진짜 멈추는 순간 끊기고 쾅
 *   쾅 크기: s = 6 ~ 4등 · m = 3 · 2등 · l = 1등(크래시 두 겹 · 긴 울림 · 큰북 한 겹 더)
 *   소리는 진행 조건이 아니다 · M(소리 끄기)이거나 소리가 안 나와도 화면은 똑같이 간다 */
(function () {
  var P = window.Sfx.prototype;

  /* 길게 쓰는 노이즈 · 공용 노이즈 버퍼(2초)를 돌려 쓴다 */
  P.nzL = function (t, dur) {
    var s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
    s.start(t, Math.random() * 1.9); s.stop(t + dur + 0.05); return s;
  };

  /* 스네어 한 타 · v = 크기(0 ~ 1) · h = 손(0 오른손 · 1 왼손 · 소리가 조금 다르다)
   *   스네어 줄(노이즈 · 짧게 치고 꼬리가 다음 타와 겹쳐 「드르르」로 이어진다) + 가죽 몸통(두) + 스틱 닿는 소리 */
  P.snr = function (when, v, h) {
    var t = this.t(when), c = this.ctx; v = v == null ? 0.5 : v; h = h ? 1 : 0;
    var br = Math.min(1, 0.45 + v);
    var n = this.nz(t, 0.2), hp = c.createBiquadFilter(), pk = c.createBiquadFilter(), g = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 1400 + 250 * h;
    pk.type = "peaking"; pk.frequency.value = 4000 + 1200 * br; pk.Q.value = 0.9; pk.gain.value = 2 + 5 * br;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.15 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
    n.connect(hp); hp.connect(pk); pk.connect(g); this.out(g, 0.1);
    var o = this.osc("sine", 192 - 7 * h, t, 0.09), g2 = c.createGain();
    o.frequency.exponentialRampToValueAtTime(160, t + 0.06);
    this.env(g2, t, 0.001, 0.34 * v, 0.07); o.connect(g2); this.out(g2, 0.04);
    var o2 = this.osc("sine", 330, t, 0.05), g3 = c.createGain();
    this.env(g3, t, 0.001, 0.1 * v, 0.035); o2.connect(g3); this.out(g3, 0);
    var n2 = this.nz(t, 0.012), bp = c.createBiquadFilter(), g4 = c.createGain();
    bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 1.2;
    this.env(g4, t, 0.0008, 0.3 * v, 0.01); n2.connect(bp); bp.connect(g4); this.out(g4, 0);
  };

  /* 베이스 드럼 · len = 울림 길이 · f = 시작 높이(큰북은 낮게) */
  P.kik = function (when, v, len, f) {
    var t = this.t(when), c = this.ctx; v = v == null ? 0.9 : v; len = len || 0.6; f = f || 112;
    var o = this.osc("sine", f, t, len + 0.1), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(f * 0.43, t + 0.16); o.frequency.exponentialRampToValueAtTime(f * 0.36, t + len);
    this.env(g, t, 0.003, v, len); o.connect(g); this.out(g, 0.08);
    var n = this.nz(t, 0.02), lp = c.createBiquadFilter(), g2 = c.createGain();
    lp.type = "lowpass"; lp.frequency.value = 2200; this.env(g2, t, 0.001, 0.25 * v, 0.018); n.connect(lp); lp.connect(g2); this.out(g2, 0);
    var n3 = this.nz(t, 0.3), lp3 = c.createBiquadFilter(), g3 = c.createGain();
    lp3.type = "lowpass"; lp3.frequency.value = 170; this.env(g3, t, 0.004, 0.55 * v, 0.26); n3.connect(lp3); lp3.connect(g3); this.out(g3, 0.1);
  };

  /* 크래시 심벌 · 금속 배음(어긋난 사각파 여섯) + 노이즈 · 높은 소리부터 먼저 사라진다 · k = 결 바꾸기(두 겹일 때) */
  P.crash = function (when, v, dur, k) {
    var t = this.t(when), c = this.ctx, self = this; v = v == null ? 0.3 : v; dur = dur || 2.6; k = k || 1;
    var bus = c.createGain(), lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(15000, t); lp.frequency.exponentialRampToValueAtTime(5200, t + dur * 0.8);
    var mh = c.createBiquadFilter(), mg = c.createGain(); mh.type = "highpass"; mh.frequency.value = 5000; mg.gain.value = 0.05;
    [205.3, 304.4, 369.6, 522.7, 540, 800].forEach(function (f) { var o = self.osc("square", f * 1.9 * k, t, dur); o.connect(mh); });
    mh.connect(mg); mg.connect(bus);
    var n = this.nzL(t, dur), nh = c.createBiquadFilter(), ng = c.createGain(); nh.type = "highpass"; nh.frequency.value = 2400; ng.gain.value = 1;
    n.connect(nh); nh.connect(ng); ng.connect(bus);
    bus.connect(lp); lp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.002);
    g.gain.exponentialRampToValueAtTime(v * 0.42, t + 0.14); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    this.out(g, 0.28);
  };

  /* 부저 · 쿵 + 스네어 한 타 · 바로 이어 롤이 작게 시작된다 */
  P.bzHit = function (when) {
    var t = this.t(when); this.kik(t, 0.8, 0.5); this.snr(t, 0.7, 0);
  };
  /* 쾅 · 롤의 마지막 한 타 + 베이스 드럼 + 크래시 */
  P.boom = function (when, size) {
    var t = this.t(when), L = size === "l", M = size === "m";
    this.snr(t, 1, 0);
    this.kik(t, 1, L ? 1.2 : M ? 0.85 : 0.65);
    this.crash(t + 0.003, L ? 0.4 : M ? 0.34 : 0.3, L ? 4.6 : M ? 3.2 : 2.4);
    if (L) { this.kik(t, 0.75, 1.9, 62); this.crash(t + 0.018, 0.2, 4.0, 1.13); }
  };

  /* ─────────── 롤 예약 · 실시간은 오디오 시계, 녹화는 화면 시계 · 0.05초 앞까지만 예약(멈출 때 바로 끊긴다) ─────────── */
  var ROLL = window.ROLL = { on: false, next: 0, h: 0, a: 0, b: 0, t0: 0, t1: 0 };
  function now() {
    if (window.SFX && SFX.log) return SFX.clock();
    if (window.SFX && SFX.rt) return SFX.rt.ctx.currentTime;
    return performance.now() / 1000;
  }
  function lv(t) {
    if (t >= ROLL.t1) return ROLL.b;
    if (t <= ROLL.t0) return ROLL.a;
    return ROLL.a + (ROLL.b - ROLL.a) * (t - ROLL.t0) / (ROLL.t1 - ROLL.t0);
  }
  /* 시작 · v = 셈여림(0 ~ 1) */
  ROLL.start = function (v) { var n = now(); ROLL.on = true; ROLL.next = n + 0.06; ROLL.h = 0; ROLL.a = ROLL.b = v; ROLL.t0 = ROLL.t1 = n; };
  /* 지금 셈여림에서 dur 초 동안 v 까지 */
  ROLL.to = function (v, dur) { var n = now(); ROLL.a = lv(n); ROLL.b = v; ROLL.t0 = n; ROLL.t1 = n + Math.max(0.05, dur); };
  ROLL.stop = function () { ROLL.on = false; };
  /* 끊고 쾅 */
  ROLL.end = function (size) { ROLL.on = false; if (window.SFX) SFX.at(0, "boom", size || "s"); };
  ROLL.tick = function () {
    if (!ROLL.on || !window.SFX) return;
    var n = now(), guard = 0;
    if (ROLL.next < n - 0.25 || ROLL.next > n + 1) ROLL.next = n + 0.02;   /* 시계가 바뀌었거나(첫 키 뒤 오디오 시작) 화면이 오래 멈췄다 */
    while (ROLL.next < n + 0.05 && guard++ < 8) {
      var l = lv(ROLL.next), v = (0.07 + 0.42 * Math.pow(l, 1.4)) * (ROLL.h ? 0.86 : 1) * (0.9 + 0.2 * Math.random());
      SFX.at(ROLL.next - n, "snr", Math.round(v * 1000) / 1000, ROLL.h);
      ROLL.h = 1 - ROLL.h;
      ROLL.next += (0.94 + 0.12 * Math.random()) / (15 + 9 * l);           /* 초당 15 타 → 크게 칠수록 24 타 */
    }
  };
})();
