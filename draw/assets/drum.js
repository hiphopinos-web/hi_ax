/* ═══════════════════════════════════════════════════════════════════════════
 * AX Festival 2026 · 럭키드로우 추첨기 재설계 기획 데모(261008 · drum.html 전용 · 운영 draw.js 와 따로)
 *   통 = 투명 구 · 앞에서 본 회전축(관객 쪽) · 안쪽 날개 3장이 믹서처럼 공을 쳐 올린다(회오리 · 부딪힘 · 튐)
 *   테두리 = 점 48개 고리(돈다) · 12시 멈춤쇠가 점을 칠 때마다 「딱」 · 감속하면 박자가 벌어진다
 *   Space → 통이 3.6~6.5초에 걸쳐 감속 → 출구(테두리 문)가 6시에 선다 → 문이 열리고 공 하나가 빠진다
 *     → 공이 앞으로 굴러와 화면 가운데에서 캡슐처럼 열린다 → 번호 릴 4칸이 왼쪽부터 멈춘다(맨 끝 칸이 가장 느리다)
 *     → 오렌지 스테이지로 바뀌며 점이 팡 → 경품 줄 → 「당첨자 확인 중」(당첨자가 앱에서 확인하면 「확인 완료」 · 데모는 흉내)
 *   당첨 번호는 Space 를 누른 순간 암호 난수로 먼저 정한다 · 통 · 공 · 릴은 그 결과를 보여 주는 연출일 뿐(결과를 바꾸지 않는다)
 *   공은 대표 공(행운권이 많으면 최대 BALLMAX 개) · 운영에서는 서버 · 기존 bigPick 이 정한 번호를 받는다
 *   그림 = 2D 캔버스 하나에 3D 투영(원근 · 아래로 내려다보는 각) · 공 그림은 미리 구운 스프라이트(회전 32단 × 색 3)
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var Q = new URLSearchParams(location.search);
  var REC = Q.has("rec"), HUD = Q.has("hud"), NT = clamp(+Q.get("n") || 300, 10, 9000), AUTOOK = Q.get("confirm") !== "0";
  var W0 = 1920, H0 = 1080, PITCH = 30;
  var C = { o: "#FF7E31", hi: "#FF963E", o50: "#FFB284", o25: "#FFD8C1", w: "#FFFFFF", k: "#000000" };
  var FONT = '"AXP", "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';

  /* 통 · 무대 좌표(1920×1080) */
  var DX = 600, DY = 560, RW = 352;                    /* 통 중심 · 반지름(월드 = 논리 px) */
  var PIT = 0.24, FOC = 2100;                          /* 내려다보는 각(rad) · 초점 거리 */
  var BALLMAX = 360, NBL = 3, BT = 7, HUBR = 30;       /* 대표 공 상한 · 날개 수 · 날개 반두께 · 축 반지름 */
  var WMIX = 3.6, G = 3000, JET = 10500, BLL = 0.62;   /* 섞기 각속도(rad/s ≈ 초당 0.6바퀴) · 중력 · 바닥 바람(가운데로 솟구친다) · 날개 길이(통 반지름 대비) */                            /* 섞기 각속도(rad/s ≈ 초당 1바퀴) · 중력 */
  var NPEG = 48;                                       /* 테두리 점 수 */
  var GATE0 = 0;                                       /* 통 각도 0 일 때 출구 각(통 좌표) */

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function EO(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function EIO(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function EOB(x) { x = clamp(x, 0, 1); var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function angN(a) { a %= 6.2832; return a < 0 ? a + 6.2832 : a; }
  function pad4(n) { return ("000" + n).slice(-4); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cryptoUnit() { try { var u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] / 4294967296; } catch (e) { return Math.random(); } }
  var rng = mulberry(REC ? 20261026 : (Math.random() * 1e9) | 0);

  /* ─────────────── 가짜 행운권 · 등수 ─────────────── */
  var ROUNDS = [
    { name: "6등", prize: "현대백화점 상품권 10만원", count: 3, pic: "ld6_hyundai", k: 0.90 },
    { name: "5등", prize: "풀리오 종아리 마사지기", count: 2, pic: "ld5_pulio", k: 0.84 },
    { name: "4등", prize: "에어팟 4", count: 2, pic: "ld4_airpods", k: 0.92 },
    { name: "3등", prize: "미닉스 음식물 처리기", count: 1, pic: "ld3_minix", k: 0.90 },
    { name: "2등", prize: "신라호텔 파크뷰 뷔페 식사권 2매", count: 1, pic: "ld2_shilla", k: 0.59 },
    { name: "1등", prize: "아이패드", count: 1, pic: "ld1_ipad", k: 0.79 }
  ];
  var TICKETS = [];
  (function () { var r = mulberry(7 + NT), used = {}; while (TICKETS.length < NT) { var n = 1 + Math.floor(r() * 9999); if (used[n]) continue; used[n] = 1; TICKETS.push(pad4(n)); } })();
  var ST = { round: 0, wins: [], won: {} };            /* wins = [{round, no, ok}] */
  function roundWins(ri) { return ST.wins.filter(function (w) { return w.round === ri; }); }
  function pickWinner() {                              /* 버튼 순간 · 행운권 전체에서 암호 난수 하나(1인 1회 규칙은 운영 서버 몫) */
    var left = TICKETS.filter(function (t) { return !ST.won[t]; });
    if (!left.length) return null;
    return left[Math.floor((REC ? rng() : cryptoUnit()) * left.length)];
  }

  /* ─────────────── 캔버스 · 배율 ─────────────── */
  var cv = document.getElementById("cv"), cx = cv.getContext("2d"), frameEl = document.getElementById("frame");
  var vw = 0, vh = 0, vs = 1, vox = 0, voy = 0, dpr = 1, gridBlack = null, gridOrange = null;
  function resize() {
    var w = REC ? 1920 : window.innerWidth, h = REC ? 1080 : window.innerHeight;
    dpr = REC ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    var px = w * h * dpr * dpr, cap = 2560 * 1440;     /* 운영 화면과 같은 픽셀 상한(4K 노트북 내장 그래픽) */
    if (px > cap) dpr *= Math.sqrt(cap / px);
    vw = Math.round(w * dpr); vh = Math.round(h * dpr);
    cv.width = vw; cv.height = vh; cv.style.width = w + "px"; cv.style.height = h + "px";
    var s = Math.min(w / W0, h / H0);
    vs = s * dpr; vox = (w - W0 * s) / 2 * dpr; voy = (h - H0 * s) / 2 * dpr;
    var tf = "translate(" + (w - W0 * s) / 2 + "px," + (h - H0 * s) / 2 + "px) scale(" + s + ")";
    frameEl.style.transform = tf;
    gridBlack = makeGrid("black"); gridOrange = makeGrid("orange");
    SPR.key = "";
  }
  /* 도트 격자 · 움직이지 않는다 · 1.5% 점등(design.md §2) */
  function makeGrid(kind) {
    var g = document.createElement("canvas"); g.width = vw; g.height = vh;
    var c = g.getContext("2d"), p = PITCH * vs, sz = Math.max(1, 3 * vs);
    var x0 = vox % p, y0 = voy % p, i0 = Math.floor(vox / p), j0 = Math.floor(voy / p);
    c.fillStyle = kind === "black" ? C.k : C.o; c.fillRect(0, 0, vw, vh);
    for (var y = y0 + p / 2, j = 0; y < vh; y += p, j++) for (var x = x0 + p / 2, i = 0; x < vw; x += p, i++) {
      var id = (i - i0) * 7919 + (j - j0) * 104729, on = ((id * 2654435761) >>> 0) % 1000 < 15;
      c.fillStyle = kind === "black" ? (on ? "rgba(255,126,49,0.55)" : "#1f1f1f") : (on ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.16)");
      c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
    return g;
  }
  /* 스테이지 전환 · 격자 점이 자라 면이 된다(하프톤 파면) */
  var STG = { base: "black", to: null, t0: 0, dur: 0.6, ox: 960, oy: 540, flipAt: 0 };
  function stageTo(to, ox, oy, dur) { if (STG.base === to && !STG.to) return; STG.to = to; STG.t0 = T; STG.dur = dur || 0.6; STG.ox = ox; STG.oy = oy; STG.flipAt = T + STG.dur * 0.45; }
  function drawStage() {
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.drawImage(STG.base === "black" ? gridBlack : gridOrange, 0, 0);
    if (!STG.to) return;
    var p = (T - STG.t0) / STG.dur;
    if (STG.flipAt && T >= STG.flipAt) { document.body.classList.toggle("st-orange", STG.to === "orange"); STG.flipAt = 0; }
    if (p >= 1) { STG.base = STG.to; STG.to = null; cx.drawImage(STG.base === "black" ? gridBlack : gridOrange, 0, 0); return; }
    var band = 520, front = EIO(p) * (2300 + band);
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.fillStyle = STG.to === "orange" ? C.o : C.k; cx.beginPath();
    var xs = -vox / vs, ys = -voy / vs, xe = (vw - vox) / vs, ye = (vh - voy) / vs;
    for (var y = Math.floor(ys / PITCH) * PITCH + PITCH / 2; y < ye + PITCH; y += PITCH) for (var x = Math.floor(xs / PITCH) * PITCH + PITCH / 2; x < xe + PITCH; x += PITCH) {
      var u = clamp((front - Math.hypot(x - STG.ox, y - STG.oy)) / band, 0, 1);
      if (u <= 0) continue;
      var r = u * PITCH * 0.74; cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
    }
    cx.fill();
  }

  /* ─────────────── 공 스프라이트 · 캡슐(위 색 · 아래 흰색) · 이음선 각 32단 · 빛은 고정(좌상단) ─────────────── */
  var TONES = [C.o, C.hi, C.o50], NROT = 32, SPR = { key: "", c: null, sz: 0 };
  function buildSprites() {
    var sz = Math.ceil(clamp(RB * vs * 1.25, 24, 96)) * 2;   /* 가장 가까운 공의 화면 지름 정도 */
    if (SPR.key === sz + "") return;
    var c = document.createElement("canvas"); c.width = sz * NROT; c.height = sz * TONES.length;
    var g = c.getContext("2d"), r = sz / 2 - 1;
    for (var t = 0; t < TONES.length; t++) for (var k = 0; k < NROT; k++) {
      var ox = k * sz + sz / 2, oy = t * sz + sz / 2, a = k / NROT * 6.2832;
      g.save(); g.beginPath(); g.arc(ox, oy, r, 0, 6.2832); g.clip();
      g.fillStyle = "#F4F1EE"; g.fillRect(ox - r, oy - r, 2 * r, 2 * r);
      g.translate(ox, oy); g.rotate(a);
      g.fillStyle = TONES[t]; g.beginPath(); g.ellipse(0, 0, r + 1, r + 1, 0, Math.PI, 0); g.lineTo(r + 1, 0); g.closePath(); g.fill();
      g.strokeStyle = "rgba(0,0,0,0.28)"; g.lineWidth = Math.max(1, r * 0.07); g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.stroke();
      g.setTransform(1, 0, 0, 1, 0, 0);
      var sh = g.createRadialGradient(ox - r * 0.38, oy - r * 0.42, r * 0.05, ox, oy, r * 1.05);
      sh.addColorStop(0, "rgba(255,255,255,0.55)"); sh.addColorStop(0.28, "rgba(255,255,255,0.05)"); sh.addColorStop(0.75, "rgba(0,0,0,0.12)"); sh.addColorStop(1, "rgba(0,0,0,0.5)");
      g.fillStyle = sh; g.fillRect(ox - r, oy - r, 2 * r, 2 * r);
      g.restore();
    }
    SPR.c = c; SPR.sz = sz; SPR.key = sz + "";
  }

  /* ─────────────── 물리 · 3D 공 · 회전하는 날개 · 공간 격자 ───────────────
   *   좌표 = 통 중심 원점 · x 오른쪽 · y 아래 · z 관객 쪽 · 통은 z 축으로 돈다(앞에서 보면 바퀴처럼) */
  var NB = 0, RB = 30;
  var px_, py_, pz_, vx_, vy_, vz_, ba_, tone_, live_;
  var DRM = { th: 0, w: 0, mode: "spin", tgt: WMIX };   /* th = 통 회전각 · w = 각속도 */
  function initBalls(n) {
    NB = Math.min(n, BALLMAX);
    RB = clamp(RW * Math.cbrt(0.16 / NB), 20, 32);
    px_ = new Float32Array(NB); py_ = new Float32Array(NB); pz_ = new Float32Array(NB);
    vx_ = new Float32Array(NB); vy_ = new Float32Array(NB); vz_ = new Float32Array(NB);
    ba_ = new Float32Array(NB); tone_ = new Uint8Array(NB); live_ = new Uint8Array(NB);
    for (var i = 0; i < NB; i++) {
      var a = rng() * 6.2832, b = Math.acos(2 * rng() - 1), rr = (RW - RB) * Math.cbrt(rng());
      px_[i] = Math.sin(b) * Math.cos(a) * rr; py_[i] = Math.abs(Math.sin(b) * Math.sin(a)) * rr * 0.9; pz_[i] = Math.cos(b) * rr;
      ba_[i] = rng() * 6.2832; tone_[i] = rng() < 0.62 ? 0 : rng() < 0.5 ? 1 : 2; live_[i] = 1;
    }
    var gd = Math.ceil(2 * RW / (2 * RB)) + 2; GRID.n = gd; GRID.cs = 2 * RB; GRID.head = new Int32Array(gd * gd * gd); GRID.next = new Int32Array(NB);
  }
  var GRID = { n: 0, cs: 1, head: null, next: null };
  function bladeAng(k) { return DRM.th + GATE0 + Math.PI / 3 + k * 6.2832 / NBL; }   /* 출구가 6시에 서면 날개는 2 · 6 · 10시 쪽(출구 앞을 막지 않는다) */
  function gateAng() { return DRM.th + GATE0 + Math.PI / 2; }                           /* th = 0 이면 6시 */
  function physStep(h) {
    var i, j, w = DRM.w, mixAmt = clamp(Math.abs(w) / WMIX, 0, 1), R = RB, R2 = 4 * R * R, lim = RW - R;
    var bl = [];
    for (var k = 0; k < NBL; k++) { var a = bladeAng(k); bl.push([Math.cos(a), Math.sin(a)]); }
    for (i = 0; i < NB; i++) {
      if (!live_[i]) continue;
      vy_[i] += G * h;
      if (mixAmt > 0.02) {                             /* 회오리 · 통 안 공기가 날개를 따라 돈다 · 앞뒤로도 흔든다 */
        var rho = Math.hypot(px_[i], py_[i]) + 1e-3, tx = -py_[i] / rho, ty = px_[i] / rho, vt = vx_[i] * tx + vy_[i] * ty, tg = w * rho * 0.45;
        var ks = 0.9 * mixAmt * h; vx_[i] += (tg - vt) * tx * ks; vy_[i] += (tg - vt) * ty * ks;
        vz_[i] += (rng() - 0.5) * 2600 * mixAmt * h;
        var jw = RW * 0.42, ax = Math.abs(px_[i] + Math.sin(T * 1.7) * RW * 0.12);   /* 바닥 가운데에서 솟는 바람 · 기둥이 천천히 좌우로 흔들린다 */
        if (ax < jw && py_[i] > -RW * 0.15) vy_[i] -= JET * mixAmt * (1 - ax / jw) * h; vx_[i] += (rng() - 0.5) * 900 * mixAmt * h; vy_[i] += (rng() - 0.5) * 900 * mixAmt * h;
      }
      var dmp = 1 - 0.35 * h; vx_[i] *= dmp; vy_[i] *= dmp; vz_[i] *= dmp;
      px_[i] += vx_[i] * h; py_[i] += vy_[i] * h; pz_[i] += vz_[i] * h;
    }
    for (var it = 0; it < 2; it++) {
      /* 공끼리 · 공간 격자 */
      var gn = GRID.n, cs = GRID.cs, head = GRID.head, nx = GRID.next, off = RW + R;
      head.fill(-1);
      for (i = 0; i < NB; i++) { if (!live_[i]) continue; var c = cellOf(px_[i], py_[i], pz_[i], off, cs, gn); nx[i] = head[c]; head[c] = i; }
      for (i = 0; i < NB; i++) {
        if (!live_[i]) continue;
        var cx0 = clamp(Math.floor((px_[i] + off) / cs), 0, gn - 1), cy0 = clamp(Math.floor((py_[i] + off) / cs), 0, gn - 1), cz0 = clamp(Math.floor((pz_[i] + off) / cs), 0, gn - 1);
        for (var dz = -1; dz <= 1; dz++) { var zz = cz0 + dz; if (zz < 0 || zz >= gn) continue;
          for (var dy = -1; dy <= 1; dy++) { var yy = cy0 + dy; if (yy < 0 || yy >= gn) continue;
            for (var dx = -1; dx <= 1; dx++) { var xx = cx0 + dx; if (xx < 0 || xx >= gn) continue;
              for (j = head[(zz * gn + yy) * gn + xx]; j >= 0; j = nx[j]) {
                if (j <= i) continue;
                var ex = px_[j] - px_[i], ey = py_[j] - py_[i], ez = pz_[j] - pz_[i], d2 = ex * ex + ey * ey + ez * ez;
                if (d2 >= R2 || d2 < 1e-6) continue;
                var d = Math.sqrt(d2), nxv = ex / d, nyv = ey / d, nzv = ez / d, pen = (2 * R - d) * 0.5;
                px_[i] -= nxv * pen; py_[i] -= nyv * pen; pz_[i] -= nzv * pen; px_[j] += nxv * pen; py_[j] += nyv * pen; pz_[j] += nzv * pen;
                var vn = (vx_[j] - vx_[i]) * nxv + (vy_[j] - vy_[i]) * nyv + (vz_[j] - vz_[i]) * nzv;
                if (vn < 0) { var im = -0.78 * vn; vx_[i] -= nxv * im; vy_[i] -= nyv * im; vz_[i] -= nzv * im; vx_[j] += nxv * im; vy_[j] += nyv * im; vz_[j] += nzv * im; if (vn < -900 && it === 0) HITS++; }
              }
            }
          }
        }
      }
      /* 통 벽 · 날개 · 축 */
      for (i = 0; i < NB; i++) {
        if (!live_[i]) continue;
        var x = px_[i], y = py_[i], z = pz_[i], dd = Math.sqrt(x * x + y * y + z * z);
        if (dd > lim) {
          var nX = x / dd, nY = y / dd, nZ = z / dd; px_[i] = nX * lim; py_[i] = nY * lim; pz_[i] = nZ * lim;
          var vnn = vx_[i] * nX + vy_[i] * nY + vz_[i] * nZ;
          if (vnn > 0) { vx_[i] -= 1.45 * vnn * nX; vy_[i] -= 1.45 * vnn * nY; vz_[i] -= 1.45 * vnn * nZ; }
          var wx = -w * py_[i], wy = w * px_[i], mu = 0.06;   /* 벽 마찰 · 벽이 공을 끌고 돈다 */
          vx_[i] += (wx - vx_[i]) * mu; vy_[i] += (wy - vy_[i]) * mu;
        }
        x = px_[i]; y = py_[i];
        var rh = Math.hypot(x, y);
        if (rh < HUBR + R && rh > 1e-3) { var f = (HUBR + R) / rh; px_[i] = x * f; py_[i] = y * f; x = px_[i]; y = py_[i]; }
        for (k = 0; k < NBL; k++) {
          var ux = bl[k][0], uy = bl[k][1], along = x * ux + y * uy, perp = x * -uy + y * ux;
          if (along <= 0 || along > RW * BLL) continue;
          var ap = Math.abs(perp); if (ap >= R + BT) continue;
          var sg = perp >= 0 ? 1 : -1, nX2 = -uy * sg, nY2 = ux * sg, pen2 = R + BT - ap;
          px_[i] += nX2 * pen2; py_[i] += nY2 * pen2; x = px_[i]; y = py_[i];
          var vbx = -uy * w * along, vby = ux * w * along;   /* 날개 면 속도 */
          var vr = (vx_[i] - vbx) * nX2 + (vy_[i] - vby) * nY2;
          if (vr < 0) { vx_[i] -= 1.5 * vr * nX2; vy_[i] -= 1.5 * vr * nY2; vz_[i] += (rng() - 0.5) * Math.abs(vr) * 0.6; }
        }
      }
    }
    for (i = 0; i < NB; i++) if (live_[i]) ba_[i] += (vx_[i] * 0.8 - vy_[i] * 0.25 + DRM.w * 6) / R * h;
  }
  function cellOf(x, y, z, off, cs, gn) { var a = clamp(Math.floor((x + off) / cs), 0, gn - 1), b = clamp(Math.floor((y + off) / cs), 0, gn - 1), c = clamp(Math.floor((z + off) / cs), 0, gn - 1); return (c * gn + b) * gn + a; }

  /* 투영 · 아래로 내려다보는 원근 · 화면 무대 좌표 + 깊이 · 드럼 카메라(CAMD)는 그림 단계에서 */
  var PRJ = { x: 0, y: 0, s: 1, z: 0 }, cP = Math.cos(PIT), sP = Math.sin(PIT);
  function prj(x, y, z) { var y2 = y * cP + z * sP, z2 = z * cP - y * sP, s = FOC / (FOC - z2); PRJ.x = DX + x * s; PRJ.y = DY + y2 * s; PRJ.s = s; PRJ.z = z2; return PRJ; }

  /* ─────────────── 통 그림 ─────────────── */
  var CAMD = { k: 1, ox: 0, oy: 0, a: 1 };            /* 드럼 층 카메라 · 배율 · 이동 · 투명도 */
  var ORD = null, ZS = null;
  function drumXf() { var k = CAMD.k; cx.setTransform(vs * k, 0, 0, vs * k, vox + vs * (CAMD.ox + DX * (1 - k)), voy + vs * (CAMD.oy + (DY + RW) * (1 - k))); }
  function drawDrum() {
    if (CAMD.a <= 0.01) return;
    drumXf(); cx.globalAlpha = CAMD.a;
    /* 몸통 · 아주 옅은 유리 */
    var g = cx.createRadialGradient(DX - RW * 0.3, DY - RW * 0.35, 0, DX, DY, RW + 16);
    g.addColorStop(0, "rgba(255,244,236,0.12)"); g.addColorStop(0.65, "rgba(255,236,224,0.06)"); g.addColorStop(0.94, "rgba(255,222,204,0.15)"); g.addColorStop(1, "rgba(255,222,204,0)");
    cx.fillStyle = g; cx.beginPath(); cx.arc(DX, DY, RW + 16, 0, 6.2832); cx.fill();
    drawRibs(false);
    drawBalls();
    drawBlades();
    drawRibs(true);
    drawRim();
    drawLip();
    if (WIN.i >= 0 && WIN.ph === "drop") drawOneBall(WIN.i);
    cx.globalAlpha = 1;
  }
  /* 살(경선) 8줄 · 앞 극(축 끝)에서 퍼진다 · 앞쪽 반만 진하게 */
  function drawRibs(front) {
    cx.lineWidth = front ? 2 : 1.5; cx.strokeStyle = front ? "rgba(255,246,238,0.22)" : "rgba(255,236,224,0.08)";
    cx.beginPath();
    for (var k = 0; k < 8; k++) {
      var a = DRM.th + k * Math.PI / 8, ux = Math.cos(a), uy = Math.sin(a), first = true;
      for (var s = 0; s <= 40; s++) {
        var ph = -Math.PI + s / 40 * 6.2832, x = ux * Math.sin(ph) * RW, y = uy * Math.sin(ph) * RW, z = Math.cos(ph) * RW;
        prj(x, y, z); var fr = PRJ.z > -40;
        if (fr !== front) { first = true; continue; }
        if (first) { cx.moveTo(PRJ.x, PRJ.y); first = false; } else cx.lineTo(PRJ.x, PRJ.y);
      }
    }
    cx.stroke();
  }
  function drawBalls() {
    buildSprites();
    if (!ORD || ORD.length !== NB) { ORD = new Int32Array(NB); ZS = new Float32Array(NB); }
    var n = 0, i;
    for (i = 0; i < NB; i++) if (live_[i] && i !== WIN.i) { prj(px_[i], py_[i], pz_[i]); ZS[i] = PRJ.z; ORD[n++] = i; }
    var o = Array.prototype.slice.call(ORD, 0, n); o.sort(function (a, b) { return ZS[a] - ZS[b]; });
    var sz = SPR.sz, img = SPR.c;
    for (var q = 0; q < o.length; q++) {
      i = o[q]; prj(px_[i], py_[i], pz_[i]);
      var r = RB * PRJ.s, kk = Math.floor(angN(ba_[i]) / 6.2832 * NROT) % NROT;
      var fog = clamp(0.55 + (PRJ.z + RW) / (2 * RW) * 0.5, 0.55, 1);   /* 뒤쪽 공은 살짝 어둡게(깊이) */
      cx.globalAlpha = CAMD.a * fog;
      cx.drawImage(img, kk * sz, tone_[i] * sz, sz, sz, PRJ.x - r, PRJ.y - r, 2 * r, 2 * r);
    }
    cx.globalAlpha = CAMD.a;
    if (WIN.i >= 0 && WIN.ph === "inside") drawOneBall(WIN.i);
  }
  function drawOneBall(i) {
    prj(px_[i], py_[i], pz_[i]); var r = RB * PRJ.s, kk = Math.floor(angN(ba_[i]) / 6.2832 * NROT) % NROT;
    cx.drawImage(SPR.c, kk * SPR.sz, tone_[i] * SPR.sz, SPR.sz, SPR.sz, PRJ.x - r, PRJ.y - r, 2 * r, 2 * r);
  }
  /* 날개 3장 · 투명 판(축을 품은 면) · 앞에서 보면 바퀴살처럼 돈다 · 가운데 축 뚜껑 */
  function drawBlades() {
    for (var k = 0; k < NBL; k++) {
      var a = bladeAng(k), ux = Math.cos(a), uy = Math.sin(a), L = RW * BLL;
      cx.beginPath();
      for (var s = 0; s <= 12; s++) { var al = HUBR + (L - HUBR) * s / 12, zz = Math.sqrt(Math.max(0, RW * RW - al * al)) * 0.92; prj(ux * al, uy * al, zz); s ? cx.lineTo(PRJ.x, PRJ.y) : cx.moveTo(PRJ.x, PRJ.y); }
      for (s = 12; s >= 0; s--) { al = HUBR + (L - HUBR) * s / 12; zz = Math.sqrt(Math.max(0, RW * RW - al * al)) * 0.92; prj(ux * al, uy * al, -zz); cx.lineTo(PRJ.x, PRJ.y); }
      cx.closePath(); cx.fillStyle = "rgba(255,240,230,0.07)"; cx.fill();
      cx.lineWidth = 3; cx.strokeStyle = "rgba(255,246,238,0.42)"; cx.beginPath();
      for (s = 0; s <= 12; s++) { al = HUBR + (L - HUBR) * s / 12; zz = Math.sqrt(Math.max(0, RW * RW - al * al)) * 0.92; prj(ux * al, uy * al, zz); s ? cx.lineTo(PRJ.x, PRJ.y) : cx.moveTo(PRJ.x, PRJ.y); }
      cx.stroke();
    }
    /* 축 뚜껑(앞 극) · 점 셋이 함께 돈다 */
    prj(0, 0, RW * 0.98); var hx = PRJ.x, hy = PRJ.y, hr = 34 * PRJ.s;
    cx.fillStyle = "rgba(255,255,255,0.92)"; cx.beginPath(); cx.arc(hx, hy, hr, 0, 6.2832); cx.fill();
    cx.fillStyle = C.o; cx.beginPath();
    for (var d = 0; d < 3; d++) { var aa = DRM.th + d * 2.0944, x = hx + Math.cos(aa) * hr * 0.55, y = hy + Math.sin(aa) * hr * 0.55 * cP; cx.moveTo(x + 6, y); cx.arc(x, y, 6, 0, 6.2832); }
    cx.fill();
  }
  /* 테두리 = 점 고리(48점 · 돈다) + 12시 멈춤쇠 + 출구 문 */
  function drawRim() {
    var ga = gateAng(), i, a;
    cx.lineWidth = 4; cx.strokeStyle = "rgba(255,240,230,0.30)"; cx.beginPath();
    for (i = 0; i <= 96; i++) { a = i / 96 * 6.2832; prj(Math.cos(a) * (RW + 10), Math.sin(a) * (RW + 10), 0); i ? cx.lineTo(PRJ.x, PRJ.y) : cx.moveTo(PRJ.x, PRJ.y); }
    cx.stroke();
    cx.fillStyle = C.o; cx.beginPath();
    for (i = 0; i < NPEG; i++) {
      a = DRM.th + i / NPEG * 6.2832;
      var dg = Math.abs(Math.atan2(Math.sin(a - ga), Math.cos(a - ga))); if (dg < 0.1) continue;   /* 문 자리는 비운다 */
      prj(Math.cos(a) * (RW + 26), Math.sin(a) * (RW + 26), 0); var r = 6.5 * PRJ.s;
      cx.moveTo(PRJ.x + r, PRJ.y); cx.arc(PRJ.x, PRJ.y, r, 0, 6.2832);
    }
    cx.fill();
    /* 멈춤쇠 · 12시 · 점이 지나갈 때 살짝 튄다 */
    prj(0, -(RW + 26), 0); var tx = PRJ.x, ty = PRJ.y, kick = PAWL.k;
    cx.save(); cx.translate(tx, ty - 44); cx.rotate(-0.28 * kick);
    cx.fillStyle = "#fff"; cx.beginPath(); cx.moveTo(-13, 0); cx.lineTo(13, 0); cx.lineTo(0, 40); cx.closePath(); cx.fill();
    cx.restore();
    /* 출구 문 · 테두리에 붙은 흰 판 · 열리면 옆으로 미끄러진다 */
    var open = EIO(GATE.v), dh = 0.11, sl = open * 0.24, r0 = RW - 4, r1 = RW + 18;
    cx.fillStyle = "rgba(250,246,242,0.96)"; cx.beginPath();
    for (i = 0; i <= 8; i++) { a = ga - dh + sl + i / 8 * 2 * dh; prj(Math.cos(a) * r1, Math.sin(a) * r1, 0); i ? cx.lineTo(PRJ.x, PRJ.y) : cx.moveTo(PRJ.x, PRJ.y); }
    for (i = 8; i >= 0; i--) { a = ga - dh + sl + i / 8 * 2 * dh; prj(Math.cos(a) * r0, Math.sin(a) * r0, 0); cx.lineTo(PRJ.x, PRJ.y); }
    cx.closePath(); cx.fill();
  }
  /* 출구 받침 · 6시 아래 고정(통과 함께 돌지 않는다) */
  function drawLip() {
    prj(0, RW + 30, 0); var x = PRJ.x, y = PRJ.y;
    cx.strokeStyle = "rgba(255,246,238,0.55)"; cx.lineWidth = 4; cx.lineCap = "round";
    cx.beginPath(); cx.moveTo(x - 62, y + 6); cx.quadraticCurveTo(x, y + 58, x + 62, y + 6); cx.stroke();
    cx.lineCap = "butt";
  }

  /* ─────────────── 진행 ─────────────── */
  var T = 0, SC = "spin", sc0 = 0, HITS = 0, lastHitT = 0;
  var PAWL = { k: 0, last: 0, snd: 0 }, GATE = { v: 0, tgt: 0 };
  var SLOW = { t0: 0, D: 4, th0: 0, w0: 0, trav: 0, kp: 1.8, tick: 0, heart: 0 };
  var WIN = { i: -1, no: "", ph: "", t0: 0 };
  var REEL = { on: false, t0: 0, stops: [], digits: [0, 0, 0, 0], pos: [0, 0, 0, 0], done: [0, 0, 0, 0], last: [0, 0, 0, 0] };
  var OK = { st: 0, at: 0 };                          /* 0 없음 · 1 확인 중 · 2 확인 완료 */
  function scene(s) { SC = s; sc0 = T; document.body.dataset.scene = s; uiHelp(); }
  function sT() { return T - sc0; }

  function press() {
    SFX.ensure && SFX.ensure();
    if (SC === "spin") return startDraw();
    if (SC === "done") return backToSpin();
  }
  function startDraw() {
    var r = ROUNDS[ST.round];
    if (roundWins(ST.round).length >= r.count) { nextRound(); return; }
    if (DRM.w < WMIX * 0.6) return;                  /* 아직 덜 돌았다 */
    var no = pickWinner(); if (!no) return;
    WIN.no = no; WIN.i = -1; WIN.ph = "";
    /* 감속 계획 · ω(t) = ω0 (1 - t/D)^k · 이동각 = ω0 D/(k+1) · 출구가 6시(gateAng = π/2 + 2πn)에 서도록 D 를 3.6~6.5초 안에서 고른다 */
    var w0 = DRM.w, need = angN(-(DRM.th + GATE0)), D = 0, kp = 1.6, m = 0, ok = false, KPS = [1.6, 1.3, 2.0, 1.0, 2.5];
    for (var a = 0; a < KPS.length && !ok; a++) for (m = 0; m < 6; m++) { kp = KPS[a]; D = (need + m * 6.2832) * (kp + 1) / w0; if (D >= 3.6 && D <= 6.0) { ok = true; break; } if (D > 6) break; }
    SLOW.kp = kp; SLOW.t0 = T; SLOW.D = D; SLOW.th0 = DRM.th; SLOW.w0 = w0; SLOW.trav = need + m * 6.2832; SLOW.tick = Math.floor(DRM.th / (6.2832 / NPEG)); SLOW.heart = T + D * 0.55;
    DRM.mode = "slow";
    scene("slow");
    SFX.play("riser", D + 0.3);
  }
  function stepDrum(dt) {
    if (DRM.mode === "spin") {
      DRM.w += (DRM.tgt - DRM.w) * (1 - Math.exp(-dt * 1.6));
      DRM.th += DRM.w * dt;
    } else if (DRM.mode === "slow") {
      var u = clamp((T - SLOW.t0) / SLOW.D, 0, 1), kp = SLOW.kp;
      DRM.th = SLOW.th0 + SLOW.trav * (1 - Math.pow(1 - u, kp + 1));
      DRM.w = SLOW.w0 * Math.pow(1 - u, kp);
      if (u >= 1) { DRM.mode = "rock"; DRM.r0 = T; DRM.base = DRM.th; DRM.w = 0; SFX.play("stamp"); scene("settle"); }
    } else if (DRM.mode === "rock") {             /* 멈춘 뒤 공 무게로 살짝 되돌아왔다 서는 흔들림 */
      var t = T - DRM.r0; var nth = DRM.base + 0.045 * Math.exp(-t * 4.5) * Math.sin(t * 13);
      DRM.w = (nth - DRM.th) / Math.max(dt, 1e-3); DRM.th = nth;
      if (t > 1.2) { DRM.mode = "hold"; DRM.w = 0; DRM.th = DRM.base; }
    }
    /* 멈춤쇠 박자 · 점 하나 지날 때마다 */
    var tk = Math.floor(DRM.th / (6.2832 / NPEG));
    if (tk !== PAWL.last) {
      PAWL.last = tk; PAWL.k = 1;
      if (DRM.mode === "slow") SFX.play("clack", 0.75);
      else if (DRM.mode === "spin" && T - PAWL.snd > 0.09) { PAWL.snd = T; SFX.play("clack", 0.18); }
    }
    PAWL.k = Math.max(0, PAWL.k - dt * 9);
    var lv = Math.round(clamp(Math.abs(DRM.w) / WMIX, 0, 1) * (CAMD.a > 0.5 ? 1 : 0.3) * 20) / 20;
    if (lv !== PAWL.air) { PAWL.air = lv; SFX.play("air", lv); }
    if (DRM.mode === "slow" && T >= SLOW.heart) { SFX.play("heart"); SLOW.heart = T + Math.max(0.5, 0.9 - (T - SLOW.t0) * 0.05); }
  }
  /* 정지 → 0.6초 정적 → 문이 열린다 → 출구 가장 가까운 공 하나가 빠진다(번호는 이미 정해진 당첨 번호) */
  function stepWin(dt) {
    GATE.v += (GATE.tgt - GATE.v) * (1 - Math.exp(-dt * 10));
    if (SC === "settle" && sT() > 1.0) { GATE.tgt = 1; SFX.play("hatch", true, 1); scene("gate"); }
    if (SC === "gate" && sT() > 0.32 && WIN.i < 0) {
      var gx = 0, gy = RW, best = -1, bd = 1e9;
      for (var i = 0; i < NB; i++) if (live_[i]) { var d = Math.hypot(px_[i] - gx, py_[i] - gy, pz_[i] * 1.4); if (d < bd) { bd = d; best = i; } }
      WIN.i = best; WIN.ph = "inside"; WIN.t0 = T; WIN.sx = px_[best]; WIN.sy = py_[best]; WIN.sz = pz_[best]; live_[best] = 0;
    }
    if (WIN.ph === "inside") {                    /* 출구로 미끄러져 빠진다 */
      var t = (T - WIN.t0) / 0.42, e = EIO(t), i2 = WIN.i;
      px_[i2] = WIN.sx * (1 - e); py_[i2] = WIN.sy + (RW + 6 - WIN.sy) * e; pz_[i2] = WIN.sz * (1 - e); ba_[i2] += dt * 9;
      if (t >= 1) { WIN.ph = "drop"; WIN.t0 = T; SFX.play("drop", 0.3); }
    } else if (WIN.ph === "drop") {               /* 받침에 톡 떨어져 한 번 튄다 */
      var t2 = T - WIN.t0, i3 = WIN.i, yb = RW + 30 - RB * 0.2, hb = Math.abs(Math.sin(Math.min(t2, 0.5) / 0.5 * Math.PI)) * 26 * Math.max(0, 1 - t2 / 0.5);
      py_[i3] = Math.min(yb, RW + 6 + 0.5 * G * t2 * t2); if (py_[i3] >= yb) py_[i3] = yb - hb; ba_[i3] += dt * 6;
      if (t2 > 0.5) { WIN.ph = "fly"; WIN.t0 = T; GATE.tgt = 0; SFX.play("hatch", false, 0.6); SFX.play("roll", 0.9); SFX.play("whoosh", 1.0); scene("fly"); fadeEl("side", 0, 0.3); prj(0, yb, 0); WIN.fx0 = PRJ.x; WIN.fy0 = PRJ.y; WIN.fr0 = RB * PRJ.s; WIN.a0 = ba_[i3]; }
    }
    if (SC === "fly") {                           /* 앞으로 굴러와 화면 가운데 · 통은 위로 밀려나며 사라진다(카메라가 공을 따라 내려간다) */
      var u = clamp(sT() / 1.25, 0, 1), e2 = EIO(u);
      CAMD.k = 1 + 0.5 * e2; CAMD.oy = -560 * e2; CAMD.ox = -120 * e2; CAMD.a = 1 - EO(u * 2.2);
      var fx = WIN.fx0 + (960 - WIN.fx0) * e2, fy = WIN.fy0 + (500 - WIN.fy0) * e2 - Math.sin(u * Math.PI) * 60;
      WIN.X = fx; WIN.Y = fy; WIN.Rr = WIN.fr0 + (250 - WIN.fr0) * Math.pow(e2, 1.4);
      WIN.ang = WIN.a0 + (1 - Math.pow(1 - u, 3)) * 14;   /* 구르다가 이음선이 수평으로 선다 */
      if (u >= 1) { WIN.ang = 0; scene("open"); REEL.on = true; REEL.t0 = T + 0.25; planReels(); uiReveal(); SFX.play("hatch", true, 0.9); SFX.play("whoosh", 0.5); }
    }
  }
  /* 번호 릴 · 왼쪽 세 칸은 차례로 멈추고 · 맨 끝 칸은 박자가 벌어지며 가장 늦게 */
  function planReels() {
    var d = WIN.no.split("").map(Number);
    REEL.digits = d; REEL.done = [0, 0, 0, 0];
    REEL.stops = [0.9, 1.45, 2.0, 3.9];
    REEL.spd = [13, 14, 15, 16];
    REEL.last = [-1, -1, -1, -1];
    /* 시작 위치를 거꾸로 맞춘다 · 등속 → 3차 감속(처음 속도 = 등속)으로 끝이 정확히 목표 숫자(속도 끊김 없음) */
    for (var k = 0; k < 4; k++) { var sl = slowLen(k), ts = REEL.stops[k] - sl; REEL.pos[k] = d[k] - REEL.spd[k] * ts - REEL.spd[k] * sl / 3; }
  }
  function slowLen(k) { return k === 3 ? 1.9 : 0.5; }
  function reelPos(k, t) {                         /* t = 릴 시작 뒤 초 · 반환 = 숫자 위치(정수 = 그 숫자가 가운데) */
    var stop = REEL.stops[k], spd = REEL.spd[k], tgt = REEL.digits[k];
    var slowL = slowLen(k), ts = stop - slowL;       /* 감속 시작 */
    if (t < ts) return REEL.pos[k] + spd * t;
    var pS = REEL.pos[k] + spd * ts, A = spd * slowL / 3, want = pS + A, u = clamp((t - ts) / slowL, 0, 1);   /* 3차 감속 · 처음 속도 = spd · 끝 속도 0 */
    var p = pS + A * (1 - Math.pow(1 - u, 3));
    if (u >= 1) { var ov = t - stop; p = want + (ov < 0.35 ? Math.sin(ov / 0.35 * Math.PI) * 0.06 * Math.exp(-ov * 6) : 0); }
    return p;
  }
  function stepReels() {
    if (!REEL.on) return;
    var t = T - REEL.t0;
    for (var k = 0; k < 4; k++) {
      var p = reelPos(k, Math.max(0, t)), cell = Math.floor(p + 0.5);
      if (t > 0 && cell !== REEL.last[k]) { if (REEL.last[k] >= 0 && t > REEL.stops[k] - slowLen(k)) SFX.play("tick", k === 3 ? clamp((t - 2.0) / 1.9, 0, 1) : 0.3 + k * 0.15); REEL.last[k] = cell; }
      if (!REEL.done[k] && t >= REEL.stops[k]) {
        REEL.done[k] = 1;
        if (k < 3) { SFX.play("bell", [523.25, 659.25, 783.99][k], 0.16); SFX.play("stamp"); }
        else reveal();
      }
    }
    if (SC === "open" && t > 0.2) scene("reels");
  }
  function reveal() {
    var r = ROUNDS[ST.round];
    ST.wins.push({ round: ST.round, no: WIN.no, ok: 0 }); ST.won[WIN.no] = 1;
    scene("done");
    stageTo("orange", 960, 500, 0.6);
    SFX.play("hit");
    burst(960, 500);
    setTxt("pTxt", r.prize);
    picInto("pPic", "pImg", r);
    later(0.5, function () { fadeEl("rPrize", 1, 0.5); });
    OK.st = 1; OK.at = T;
    later(1.6, function () { var el = document.getElementById("rOk"); el.classList.remove("done"); setTxt("rOkT", "당첨자 확인 중"); fadeEl("rOk", 1, 0.4); });
    if (AUTOOK) { var w = REC ? (ST.wins.length % 3 === 2 ? 99 : 2.2) : 3 + rng() * 4; later(1.6 + w, function () { if (SC === "done" && OK.st === 1) confirmOk(); }); }
  }
  /* 당첨자가 앱에서 「확인」을 눌렀다(서버 → 화면) · 누가인지는 보이지 않는다 · 점 고리 하나가 번호를 감싸고 퍼진다 */
  function confirmOk() {
    if (SC !== "done" || OK.st !== 1) return;
    OK.st = 2; ST.wins[ST.wins.length - 1].ok = 1;
    var el = document.getElementById("rOk"); el.classList.add("done"); setTxt("rOkT", "당첨자 확인 완료"); el.style.opacity = 1;
    ring(960, 500, 64, 900, 9, 1.1); ring(960, 500, 40, 600, 12, 1.3);
    SFX.play("bell", 1046.5, 0.14); SFX.play("bell", 1318.5, 0.1);
  }
  function backToSpin() {
    REEL.on = false; OK.st = 0;
    fadeEl("rv", 0, 0.35); fadeEl("rPrize", 0, 0.3); fadeEl("rOk", 0, 0.3);
    stageTo("black", 960, 500, 0.6);
    if (WIN.i >= 0) { live_[WIN.i] = 0; }
    WIN.i = -1; WIN.ph = "";
    CAMD.k = 1; CAMD.ox = 0; CAMD.oy = 0; CAMD.a = 0; CAMD.fin = T;
    DRM.mode = "spin"; DRM.w = 0.5; DRM.tgt = WMIX;
    var r = ROUNDS[ST.round]; if (roundWins(ST.round).length >= r.count && ST.round < ROUNDS.length - 1) ST.round++;
    uiSide(); fadeEl("side", 1, 0.6);
    SFX.play("whoosh", 0.7);
    scene("spin");
  }
  function nextRound() { ST.round = (ST.round + 1) % ROUNDS.length; if (!ST.round) ST.wins = []; fadeEl("side", 0, 0.2); later(0.25, function () { uiSide(); fadeEl("side", 1, 0.4); }); SFX.play("whoosh", 0.5); }

  /* ─────────────── 공개 그림 · 캡슐 · 릴 · 점 ─────────────── */
  var DIG = null;                                     /* 숫자 0~9 점 좌표(칸 가운데 기준) */
  var CELLW = 232, CELLH = 330, DSTEP = 15, DOTR = 6.3, REELX = 960, REELY = 500, GAPX = 28;
  function buildDigits() {
    var c = document.createElement("canvas"), w = CELLW, h = CELLH + 40; c.width = w; c.height = h;
    var g = c.getContext("2d", { willReadFrequently: true });
    DIG = [];
    for (var d = 0; d < 10; d++) {
      g.clearRect(0, 0, w, h); g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 400px " + FONT; g.fillText(String(d), w / 2, h / 2 + 16);
      var px = g.getImageData(0, 0, w, h).data, pts = [];
      for (var y = DSTEP / 2; y < h; y += DSTEP) for (var x = DSTEP / 2; x < w; x += DSTEP) if (px[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 110) pts.push(x - w / 2, y - h / 2);
      DIG.push(pts);
    }
  }
  function reelCellX(k) { return REELX + (k - 1.5) * (CELLW + GAPX); }
  function drawReels() {
    if (!REEL.on || !DIG) return;
    var t = Math.max(0, T - REEL.t0), appear = clamp((T - REEL.t0 + 0.25) / 0.45, 0, 1);
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    var top = REELY - CELLH / 2 - 26, bot = REELY + CELLH / 2 + 26;
    /* 릴 창 · 칸마다 아주 옅은 판 */
    cx.globalAlpha = appear;
    cx.fillStyle = STG.base === "orange" && !STG.to ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)";
    for (var k = 0; k < 4; k++) { var x0 = reelCellX(k) - CELLW / 2; rr(x0, top, CELLW, bot - top, 22); cx.fill(); }
    for (k = 0; k < 4; k++) {
      var p = reelPos(k, t), base = Math.floor(p), fr = p - base, sp = REEL.done[k] ? 0 : Math.abs(reelPos(k, t + 0.016) - p) / 0.016;
      var cxk = reelCellX(k);
      cx.save(); cx.beginPath(); cx.rect(cxk - CELLW / 2, top, CELLW, bot - top); cx.clip();
      var stretch = clamp(sp * 0.45, 0, 6);       /* 빨리 돌면 점이 세로로 늘어난다(잔상) */
      for (var j = -1; j <= 1; j++) {
        var dgt = ((base + j) % 10 + 10) % 10, oy = REELY - (j - fr) * (CELLH + 30);
        drawDigitDots(DIG[dgt], cxk, oy, stretch, top, bot);
      }
      cx.restore();
    }
    cx.globalAlpha = 1;
  }
  function drawDigitDots(pts, ox, oy, st, top, bot) {
    cx.fillStyle = "#fff"; cx.beginPath();
    var r = DOTR;
    for (var q = 0; q < pts.length; q += 2) {
      var x = ox + pts[q], y = oy + pts[q + 1];
      if (y < top - 20 || y > bot + 20) continue;
      if (st > 1) { cx.moveTo(x + r, y - st / 2); cx.arc(x, y - st / 2, r, 0, Math.PI, true); cx.arc(x, y + st / 2, r, Math.PI, 0, true); cx.closePath(); }
      else { cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832); }
    }
    cx.fill();
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  /* 날아오는 공 · 캡슐(위 색 · 아래 흰색) · 가운데에 서면 위아래로 갈라진다 */
  function drawFlyBall() {
    if (!(SC === "fly" || SC === "open" || SC === "reels")) return;
    var tone = WIN.i >= 0 ? TONES[tone_[WIN.i]] : C.o, X = WIN.X, Y = WIN.Y, R = WIN.Rr, sep = 0, al = 1;
    if (SC !== "fly") { var u = clamp((T - REEL.t0 + 0.25) / 0.55, 0, 1); sep = EIO(u) * 640; al = 1 - EIO(clamp(u * 1.4 - 0.3, 0, 1)); }
    if (al <= 0.01) return;
    cx.setTransform(vs, 0, 0, vs, vox, voy); cx.globalAlpha = al;
    for (var half = 0; half < 2; half++) {
      cx.save();
      var oy = half ? sep : -sep;
      cx.translate(X, Y + oy); cx.rotate(WIN.ang);
      cx.beginPath(); cx.arc(0, 0, R, half ? 0 : Math.PI, half ? Math.PI : 6.2832); cx.closePath(); cx.clip();
      cx.rotate(-WIN.ang);
      cx.fillStyle = half ? "#F4F1EE" : tone; cx.fillRect(-R, -R, 2 * R, 2 * R);
      var sh = cx.createRadialGradient(-R * 0.38, -R * 0.42 - oy * 0, R * 0.05, 0, 0, R * 1.05);
      sh.addColorStop(0, "rgba(255,255,255,0.55)"); sh.addColorStop(0.3, "rgba(255,255,255,0.05)"); sh.addColorStop(0.78, "rgba(0,0,0,0.12)"); sh.addColorStop(1, "rgba(0,0,0,0.5)");
      cx.fillStyle = sh; cx.fillRect(-R, -R, 2 * R, 2 * R);
      cx.restore();
    }
    if (SC !== "fly" && sep > 0 && sep < 200) {     /* 갈라지는 순간 · 이음선에서 빛 한 줄 */
      cx.globalAlpha = al * (1 - sep / 200); cx.fillStyle = "#fff"; cx.fillRect(X - R * 1.4, Y - 3 - sep * 0.1, R * 2.8, 6 + sep * 0.2);
    }
    if (SC === "fly") {                             /* 이음선 */
      cx.globalAlpha = 1; cx.strokeStyle = "rgba(0,0,0,0.28)"; cx.lineWidth = Math.max(1.5, R * 0.05);
      cx.beginPath(); cx.moveTo(X - Math.cos(WIN.ang) * R, Y - Math.sin(WIN.ang) * R); cx.lineTo(X + Math.cos(WIN.ang) * R, Y + Math.sin(WIN.ang) * R); cx.stroke();
    }
    cx.globalAlpha = 1;
  }
  /* 점 입자 · 팡 · 고리 */
  var PT = [];
  function burst(x, y) {
    for (var k = 0; k < 380; k++) { var a = rng() * 6.2832, s = 300 + rng() * 1500; PT.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 300, life: 1.4 + rng() * 1.4, t: 0, r: 3 + rng() * 8, g: 800, d: 1.5 }); }
    ring(x, y, 72, 1500, 7, 1.0);
  }
  function ring(x, y, n, sp, r, life) { for (var k = 0; k < n; k++) { var a = k / n * 6.2832; PT.push({ x: x + Math.cos(a) * 200, y: y + Math.sin(a) * 200, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: life, t: 0, r: r, g: 0, d: 2.2 }); } }
  function stepParticles(dt) {
    for (var k = PT.length - 1; k >= 0; k--) { var p = PT[k]; p.t += dt; if (p.t >= p.life) { PT.splice(k, 1); continue; } var dm = Math.exp(-p.d * dt); p.vx *= dm; p.vy = p.vy * dm + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  }
  function drawParticles() {
    if (!PT.length) return;
    cx.setTransform(vs, 0, 0, vs, vox, voy); cx.fillStyle = "#fff";
    for (var k = 0; k < PT.length; k++) { var p = PT[k], f = 1 - p.t / p.life; cx.globalAlpha = Math.min(1, f * 1.6); cx.beginPath(); cx.arc(p.x, p.y, p.r * (0.4 + 0.6 * f), 0, 6.2832); cx.fill(); }
    cx.globalAlpha = 1;
  }

  /* ─────────────── 글자(DOM) · 제자리 · 투명도로만 ─────────────── */
  var TM = [];
  function later(sec, fn) { TM.push([T + sec, fn]); }
  function setTxt(id, s) { var el = document.getElementById(id); if (el && el.textContent !== s) el.textContent = s; }
  var FD = {};
  function fadeEl(id, to, dur) { var el = document.getElementById(id); if (!el) return; FD[id] = { el: el, from: +(el.style.opacity || (getComputedStyle(el).opacity)), to: to, t0: T, d: dur || 0.4 }; }
  function stepFades() { for (var id in FD) { var f = FD[id], u = clamp((T - f.t0) / f.d, 0, 1); f.el.style.opacity = f.from + (f.to - f.from) * u; if (u >= 1) delete FD[id]; } }
  function picInto(boxId, imgId, r) { var img = document.getElementById(imgId); img.src = "../assets/prize/" + r.pic + ".webp"; img.style.width = img.style.height = (r.k * 100) + "%"; }
  function uiSide() {
    var r = ROUNDS[ST.round], ws = roundWins(ST.round);
    setTxt("sEye", r.name); setTxt("sCnt", r.count + "명 추첨");
    setTxt("sTitle", r.prize);
    picInto("sPic", "sImg", r);
    var h = ws.map(function (w) { return "<span>" + w.no + "</span>"; }).join("");
    for (var k = ws.length; k < r.count; k++) h += '<span class="dim">····</span>';
    document.getElementById("sNos").innerHTML = h;
  }
  function uiReveal() {
    var r = ROUNDS[ST.round], n = roundWins(ST.round).length + 1;
    setTxt("rEye", r.name + (r.count > 1 ? " · " + n + "번째" : ""));
    document.getElementById("rPrize").style.opacity = 0; document.getElementById("rOk").style.opacity = 0;
    fadeEl("rv", 1, 0.4);
  }
  function uiHelp() {
    var m = { spin: "Space · 뽑기", slow: "감속 중", settle: "정지", gate: "출구 열림", fly: "공 나옴", open: "번호", reels: "번호", done: "Space · 확정 → 다시 섞기  ·  C 확인 흉내" };
    setTxt("hNow", m[SC] || "");
  }

  /* ─────────────── 루프 ─────────────── */
  var lastNow = 0, FPS = { n: 0, t: 0, v: 0 }, PHS = 4;
  function update(dt) {
    T += dt;
    for (var k = TM.length - 1; k >= 0; k--) if (TM[k][0] <= T) { var f = TM[k][1]; TM.splice(k, 1); f(); }
    stepDrum(dt);
    var h = dt / PHS; for (var s = 0; s < PHS; s++) physStep(h);
    if (HITS > 0 && T - lastHitT > 0.05 && CAMD.a > 0.5) { lastHitT = T; SFX.play("clack", clamp(HITS / 40, 0.15, 0.6)); }
    HITS = 0;
    stepWin(dt);
    stepReels();
    stepParticles(dt);
    if (CAMD.fin && SC === "spin") { var u = clamp((T - CAMD.fin) / 0.7, 0, 1); CAMD.a = EO(u); if (u >= 1) CAMD.fin = 0; }
    stepFades();
  }
  function render() {
    drawStage();
    drawDrum();
    drawFlyBall();
    drawParticles();
    drawReels();   /* 번호가 늘 맨 위(점 팡이 번호를 가리지 않는다) */
  }
  function loop(now) {
    var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 1 / 60; lastNow = now;
    update(dt); render();
    FPS.n++; FPS.t += dt; if (FPS.t >= 1) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; if (HUD) setTxt("hud", FPS.v.toFixed(1) + " fps · " + vw + "×" + vh + " · 공 " + NB + " · 행운권 " + NT); }
    requestAnimationFrame(loop);
  }
  function onKey(e) {
    var k = e.key;
    if (k === " " || k === "Spacebar" || k === "ArrowRight" || k === "PageDown") { e.preventDefault(); press(); }
    else if (k === "c" || k === "C") confirmOk();
    else if (k === "n" || k === "N") { if (SC === "spin") nextRound(); }
    else if (k === "m" || k === "M") { SFX.ensure(); SFX.mute(SFX.on); }
    else if (k === "f" || k === "F") { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); else document.exitFullscreen(); }
    else if (k === "h" || k === "H") document.body.classList.toggle("help-on");
  }

  /* 녹화 · 프레임 단위 · 소리는 기록했다가 오프라인으로 굽는다 */
  window.DRUM = {
    step: function (n, dt) { for (var i = 0; i < n; i++) update(dt || 1 / 30); render(); return -1; },
    key: function (k) { onKey({ key: k, preventDefault: function () {} }); },
    scene: function () { return SC; },
    t: function () { return T; },
    audio: function (dur) {
      return SFX.render(SFX.log, dur).then(function (buf) {
        var n = buf.length, L = buf.getChannelData(0), Rr = buf.getChannelData(1), out = new DataView(new ArrayBuffer(44 + n * 4));
        function ws(o, s) { for (var i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); }
        ws(0, "RIFF"); out.setUint32(4, 36 + n * 4, true); ws(8, "WAVEfmt "); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
        out.setUint32(24, 48000, true); out.setUint32(28, 48000 * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); ws(36, "data"); out.setUint32(40, n * 4, true);
        for (var i = 0; i < n; i++) { out.setInt16(44 + i * 4, clamp(L[i], -1, 1) * 32767, true); out.setInt16(46 + i * 4, clamp(Rr[i], -1, 1) * 32767, true); }
        var b = new Uint8Array(out.buffer), s = ""; for (var j = 0; j < b.length; j += 0x8000) s += String.fromCharCode.apply(null, b.subarray(j, j + 0x8000));
        return btoa(s);
      });
    }
  };

  function boot() {
    document.getElementById("wm").innerHTML = window.AXF_WORDMARK || "AX Festival 2026";
    if (HUD) document.body.classList.add("hud-on");
    if (REC) { SFX.log = []; SFX.clock = function () { return T; }; }
    initBalls(NT);
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKey);
    uiSide(); uiHelp();
    DRM.w = WMIX; DRM.mode = "spin";
    for (var k = 0; k < 120; k++) { update(1 / 60); }   /* 처음부터 섞이는 중인 통 */
    T = 0; sc0 = 0; PAWL.snd = 0;
    var go = function () { buildDigits(); if (!REC) requestAnimationFrame(loop); else render(); window.DRUM.ready = true; };
    if (document.fonts && document.fonts.load) document.fonts.load('800 400px "AXP"').then(go, go); else go();
  }
  boot();
})();
