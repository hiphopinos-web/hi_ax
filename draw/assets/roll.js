/* AX Festival 2026 럭키드로우 · 무대 소리 (261009 4차 · stage.html 전용 · 옛 화면 index.html 은 쓰지 않는다)
 *   원음(snd.js · Mixkit 무료 효과음을 자르고 섞은 것) 이 먼저 · 못 풀면 아래 합성음으로 대신한다
 *   부저 = 짧은 쿵 · 회전 → 감속 → 공 → 번호 = 스네어 롤(몸통 있는 중저음 · 5차) + 밑에 낮은 울림이 작게 시작해 점점 커진다(크레센도)
 *   진짜 멈춘 순간 롤이 끊기고 묵직한 쾅(트레일러 드럼 히트 + 크래시 심벌) → 0.3초 뒤 당첨 소리(반짝이는 차임 + 박수 · 환호)
 *   크기: s = 6 ~ 4등 · m = 3 · 2등(환호 섞인 박수) · l = 1등(낮은 울림 한 겹 더 · 강당 박수 + 환호 10초)
 *   인트로 · 끝 화면 · 기다리는 동안은 소리 없음 · 공 소리 없음 · 멜로디 없음
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
    hp.type = "highpass"; hp.frequency.value = 800 + 150 * h;
    pk.type = "peaking"; pk.frequency.value = 2400 + 800 * br; pk.Q.value = 0.9; pk.gain.value = 2 + 5 * br;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.15 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
    n.connect(hp); hp.connect(pk); pk.connect(g); this.out(g, 0.1);
    var o = this.osc("sine", 150 - 6 * h, t, 0.09), g2 = c.createGain();
    o.frequency.exponentialRampToValueAtTime(122, t + 0.06);
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

  /* ─────────── 원음(snd.js) · 페이지를 열 때 한 번 푼다 · AudioBuffer 는 실시간 · 녹화 굽기 양쪽에서 같이 쓴다 ─────────── */
  var SND = window.SND = { buf: {}, ok: false };
  (function () {
    var src = window.AXF_SND, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!src || !OAC) return;
    var ac; try { ac = new OAC(2, 1, 44100); } catch (e) { return; }
    var keys = Object.keys(src), left = keys.length;
    function fin() { if (--left <= 0) SND.ok = !!(SND.buf.roll && SND.buf.boom); }
    keys.forEach(function (k) {
      try {
        var bin = atob(src[k]), u = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        var pr = ac.decodeAudioData(u.buffer, function (b) { SND.buf[k] = b; fin(); }, function () { fin(); });
        if (pr && pr.catch) pr.catch(function () {});
      } catch (e) { fin(); }
    });
  })();
  function hold(prm, t) { if (prm.cancelAndHoldAtTime) prm.cancelAndHoldAtTime(t); else prm.cancelScheduledValues(t); }
  /* 원음 한 번 · 돌려준 {s, g} 로 나중에 줄일 수 있다 */
  P.smp = function (when, name, v, off, dur) {
    var b = SND.buf[name]; if (!b) return null;
    var t = this.t(when), c = this.ctx, s = c.createBufferSource(), g = c.createGain();
    s.buffer = b; g.gain.value = v == null ? 1 : v; s.connect(g); g.connect(this.master);
    if (dur) s.start(t, off || 0, dur); else s.start(t, off || 0);
    return { s: s, g: g };
  };
  /* 롤 · 5차 = 스네어 롤 루프(「따르르」 타격이 분명 · 음을 낮춰 몸통 있게) + 밑에 낮은 울림 루프(팀파니 결 · 0.45) · 크기와 밝기를 함께 올린다 */
  var RV = 0.55, LO = 0.45;
  /* 6차 · 사용자 「롤이 70% 쯤 왔을 때 볼륨이 적당」 → 끝(v 1)을 5차의 70% 지점 크기(약 -5.4dB)로 · 시작은 그대로 작게 */
  function gOf(v) { return RV * (0.07 + 0.47 * Math.pow(v, 1.5)); }
  var SG = 0.56;   /* 쾅 · 차임 · 박수도 같은 만큼(-5dB) 줄여 롤과의 상대 크기는 5차 그대로 */
  function fOf(v) { return 1800 + 9000 * v * v; }   /* 작을 때도 스네어 타격은 들리게(1.8kHz 위부터) */
  function lvAt(r, t) { if (t >= r.t1) return r.b; if (t <= r.t0) return r.a; return r.a + (r.b - r.a) * (t - r.t0) / (r.t1 - r.t0); }
  P.rollOn = function (when, v, top) {
    this.rollOff(when, 0.05);
    var b = SND.buf.roll; if (!b) return;
    var t = this.t(when), c = this.ctx, s = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; s.loop = true; lp.type = "lowpass"; lp.Q.value = 0.4;
    lp.frequency.setValueAtTime(fOf(v), t);
    top = top || 1; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gOf(v) * top, t + 0.12);
    s.connect(lp); lp.connect(g); g.connect(this.master); s.start(t, Math.random() * (b.duration - 0.1));
    var lo = null, bl = SND.buf.rollLo;
    if (bl) { lo = c.createBufferSource(); var gl = c.createGain(); lo.buffer = bl; lo.loop = true; gl.gain.value = LO; lo.connect(gl); gl.connect(lp); lo.start(t, Math.random() * (bl.duration - 0.1)); }
    this._roll = { s: s, lo: lo, g: g, lp: lp, a: v, b: v, t0: t, t1: t + 0.12, top: top };
  };
  P.rollLv = function (when, v, dur) {
    var r = this._roll; if (!r) return;
    var t = this.t(when), cur = lvAt(r, t), t1 = t + Math.max(0.05, dur || 0.05);
    hold(r.g.gain, t); r.g.gain.setValueAtTime(gOf(cur) * r.top, t); r.g.gain.exponentialRampToValueAtTime(gOf(v) * r.top, t1);
    hold(r.lp.frequency, t); r.lp.frequency.setValueAtTime(fOf(cur), t); r.lp.frequency.exponentialRampToValueAtTime(fOf(v), t1);
    r.a = cur; r.b = v; r.t0 = t; r.t1 = t1;
  };
  P.rollOff = function (when, fo) {
    var r = this._roll; if (!r) return; this._roll = null;
    var t = this.t(when); fo = fo || 0.03;
    hold(r.g.gain, t); r.g.gain.setTargetAtTime(0, t, fo / 3);
    try { r.s.stop(t + fo + 0.05); if (r.lo) r.lo.stop(t + fo + 0.05); } catch (e) {}
  };
  /* 쾅 · 원음 · 트레일러 드럼 히트 + 크래시 · 1등은 낮은 울림 한 겹 더 */
  P.boomS = function (when, size) {
    var t = this.t(when), L = size === "l", M = size === "m";
    this.smp(t, "boom", SG * (L ? 1.19 : M ? 0.88 : 0.75));
    this.smp(t + 0.004, "crash", SG * (L ? 0.83 : M ? 0.58 : 0.48));
    if (L) this.smp(t, "deep", SG * 1.0);
  };
  /* 당첨 소리 · 반짝이는 차임 꼬리 + 박수(등수가 높을수록 크고 길게 · 환호) */
  P.cheer = function (when, size) {
    var t = this.t(when), L = size === "l", M = size === "m";
    this.smp(t, "chime", SG * (L ? 0.71 : M ? 0.5 : 0.38));
    this._cheer = this.smp(t + 0.12, L ? "clapL" : M ? "clapM" : "clapS", SG * (L ? 0.86 : M ? 0.58 : 0.42));
  };
  /* 다음 등수로 넘어갈 때 박수가 남아 있으면 부드럽게 줄인다 */
  P.hush = function (when, tc) {
    var h = this._cheer; if (!h) return; this._cheer = null;
    var t = this.t(when); hold(h.g.gain, t); h.g.gain.setTargetAtTime(0, t, tc || 0.35);
  };
  P.bzHitS = function (when) { if (!this.smp(when, "hit", 0.8)) this.bzHit(when); };

  /* ─────────── 롤 진행 · 원음이면 이벤트(rollOn · rollLv · rollOff · 쾅) · 아니면 합성 롤 예약(0.05초 앞까지만) ─────────── */
  var ROLL = window.ROLL = { on: false, s: false, next: 0, h: 0, a: 0, b: 0, t0: 0, t1: 0 };
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
  /* 롤 제어는 소리 끔(M)이어도 보낸다(켜진 채 남지 않게) · 소리 크기는 M 이 마스터에서 막는다 */
  function ctl(name, args) {
    if (!window.SFX) return;
    if (SFX.log) { SFX.log.push([SFX.clock(), name, args]); return; }
    if (!SFX.rt) return;
    try { SFX.rt[name].apply(SFX.rt, [SFX.rt.ctx.currentTime].concat(args)); } catch (e) {}
  }
  ROLL.start = function (v, top) {
    var n = now(); ROLL.on = true; ROLL.top = top || 1; ROLL.s = SND.ok; ROLL.next = n + 0.06; ROLL.h = 0; ROLL.a = ROLL.b = v; ROLL.t0 = ROLL.t1 = n;
    if (ROLL.s) ctl("rollOn", [v, ROLL.top]);
  };
  ROLL.to = function (v, dur) {
    if (!ROLL.on) return;
    var n = now(); ROLL.a = lv(n); ROLL.b = v; ROLL.t0 = n; ROLL.t1 = n + Math.max(0.05, dur);
    if (ROLL.s) ctl("rollLv", [v, dur]);
  };
  ROLL.stop = function () { if (!ROLL.on) return; ROLL.on = false; if (ROLL.s) ctl("rollOff", [0.3]); };
  /* 끊고 쾅 → 당첨 소리 */
  ROLL.end = function (size) {
    var was = ROLL.on; ROLL.on = false; size = size || "s";
    if (ROLL.s && was) ctl("rollOff", [0.02]);
    if (!window.SFX) return;
    if (SND.ok) { SFX.at(0, "boomS", size); SFX.at(0.3, "cheer", size); } else SFX.at(0, "boom", size);
  };
  ROLL.hush = function () { ctl("hush", [0.35]); };
  ROLL.press = function () { if (window.SFX) SFX.play(SND.ok ? "bzHitS" : "bzHit"); };
  ROLL.tick = function () {
    if (!ROLL.on || ROLL.s || !window.SFX) return;
    var n = now(), guard = 0;
    if (ROLL.next < n - 0.25 || ROLL.next > n + 1) ROLL.next = n + 0.02;   /* 시계가 바뀌었거나(첫 키 뒤 오디오 시작) 화면이 오래 멈췄다 */
    while (ROLL.next < n + 0.05 && guard++ < 8) {
      var l = lv(ROLL.next), v = (0.07 + 0.24 * Math.pow(l, 1.5)) * (ROLL.top || 1) * (ROLL.h ? 0.86 : 1) * (0.92 + 0.16 * Math.random());   /* 6차 · 합성도 끝 크기를 70% 지점으로 */
      SFX.at(ROLL.next - n, "snr", Math.round(v * 1000) / 1000, ROLL.h);
      ROLL.h = 1 - ROLL.h;
      ROLL.next += (0.94 + 0.12 * Math.random()) / (10 + 6 * l);           /* 합성 대체 · 초당 10 타 → 16 타(덜 촘촘하게) */
    }
  };
})();
