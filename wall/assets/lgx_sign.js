/* AX Festival 2026 · 스탬프 월 막간 「최초 로그인 장면」 사이니지판 (261002 · v5.02 박자)
 * 참가자 앱 웹배포용/index.html v5.02 의 LGX(lgxSym · lgxLayout · lgxSeed · lgxFrame)를 옮겼다. 박자표 · 스프링 · 원본 좌표는 그대로다.
 * 바뀐 것: 흰 면 + 주황 수면 → 검정 스테이지 + 어두운 수면(사이니지 블랙 스테이지 · design.md §1) · 수면에 비친 점은 흰 점 대신 어둡게 누른 원본 3색
 *          로그인 입력이 없으므로 앞 구간(LGS.PRE) = 행사명 대신 수평선 위에 점 하나가 톡 생긴다(앱이 행사명을 못 읽을 때 쓰는 iris 와 같은 스프링)
 *          3막(도장 · 시트)은 없다 · 마지막 안착 자리 = 스탬프 월의 심볼 자리(그대로 월로 넘어간다)
 * 점(나) → 솟음 → 점이 곧바로 흩어져 반듯한 Me(v5.02 · 원 02 Circle 단계 없음) → 수평선에 닿으면 수면에 We → to 가 끼어들며 원본 심볼에 안착
 * t = 0 은 점(나)이 다 생긴 순간 · 앞 구간은 음수 시각(-PRE ~ 0) · 월은 막간 시작 0.6초에 걸쳐 빠지고 그동안 점이 생긴다 */
var LGS = { PRE: 0.6, T: { rise: 0.05, burst: 0.6, drop: 1.75, hit: 2.05, to: 3.65, land: 5.15 }, sym: null, spr: null };
var LGS_LD = [0.5, 0.58, 0.44, 0.52, 0.56, 0.64];   /* 글자별 안착 시작(to 기준 초) · M e t o W e */
var LGS_C = { o: ["#FF7F32", "#FF963E", "#E6CCFF"], w: ["#5C2C12", "#663816", "#4A4252"], d: ["#4A2410", "#57301A", "#3E3846"] };
function lgsCl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function lgsEO(x) { x = lgsCl(x); return 1 - Math.pow(1 - x, 3); }
function lgsEI(x) { x = lgsCl(x); return x * x * x; }
function lgsEIO(x) { x = lgsCl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function lgsSpring(u, z, f) {
  if (u <= 0) return 0; if (u >= 1) return 1;
  var w = 6.2832 * f, wd = w * Math.sqrt(1 - z * z), e = Math.exp(-z * w * u);
  return 1 - e * (Math.cos(wd * u) + (z * w / wd) * Math.sin(wd * u));
}
function lgsH(i) { var v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
/* 원본 심볼(AXF_DATA.me · 1,037점 · 격자 24)을 글자 6개로 나눈다 · 앱 lgxSym 과 같은 계산 */
function lgsSym() {
  if (LGS.sym) return LGS.sym;
  var P = AXF_DATA.me.D.points, n = P.length, par = [], i, j;
  for (i = 0; i < n; i++) par.push(i);
  function f(a) { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }
  for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (Math.abs(P[i][0] - P[j][0]) <= 26 && Math.abs(P[i][1] - P[j][1]) <= 26) par[f(i)] = f(j);
  var G = {}, ks = [];
  for (i = 0; i < n; i++) { var r = f(i); if (!G[r]) { G[r] = []; ks.push(r); } G[r].push(i); }
  var top = function (a) { var m = 1e9; a.forEach(function (q) { m = Math.min(m, P[q][1]); }); return m; };
  var gs = ks.map(function (k) { return G[k]; }).sort(function (a, b) { return top(a) - top(b); });
  var K = [-0.11, 0, 0, 0, -0.1, 0], g = new Array(n), yc = [], X = new Array(n), box = [];
  gs.forEach(function (arr, k) { var a = 1e9, b = -1e9; arr.forEach(function (q) { g[q] = k; a = Math.min(a, P[q][1]); b = Math.max(b, P[q][1]); }); yc[k] = (a + b) / 2; });
  for (i = 0; i < n; i++) X[i] = P[i][0] - K[g[i]] * (P[i][1] - yc[g[i]]);
  gs.forEach(function (arr) {
    var bx = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
    arr.forEach(function (q) { bx.x0 = Math.min(bx.x0, X[q]); bx.x1 = Math.max(bx.x1, X[q]); bx.y0 = Math.min(bx.y0, P[q][1]); bx.y1 = Math.max(bx.y1, P[q][1]); });
    box.push(bx);
  });
  var off = [[0, -25 - box[0].y1], [0, -25 - box[1].y1], null, null, [box[0].x0 - box[4].x0, 25 - box[4].y0], [box[1].x0 - box[5].x0, 25 - box[5].y0]];
  var mine = -1, best = 1e9, rank = [];
  for (i = 0; i < n; i++) if (g[i] === 0 && P[i][0] + P[i][1] < best) { best = P[i][0] + P[i][1]; mine = i; }
  for (i = 0; i < n; i++) rank.push(((i * 37) % n) / n);   /* 보라 핵 물결 순서 · 원본 엔진과 같은 식 */
  LGS.sym = { P: P, X: X, g: g, box: box, off: off, mine: mine, rank: rank };
  return LGS.sym;
}
/* 점 그림 · 면마다 바깥 · 안쪽(가운데 + 핵) · 안쪽(핵 꺼짐) 세 장 · o = 원본 3색 · w = 수면 · d = 지난 심볼(옅은 겹) */
function lgsSprites() {
  if (LGS.spr) return LGS.spr;
  var Z = 96, mk = function (fn) { var c = document.createElement("canvas"); c.width = c.height = Z; var x = c.getContext("2d"); fn(x); return c; };
  var circ = function (x, col, r) { x.fillStyle = col; x.beginPath(); x.arc(Z / 2, Z / 2, r, 0, 6.2832); x.fill(); };
  var o = {};
  ["o", "w", "d"].forEach(function (k) {
    var c = LGS_C[k];
    o[k + "0"] = mk(function (x) { circ(x, c[0], Z / 2); });
    o[k + "1"] = mk(function (x) { circ(x, c[1], Z * 9 / 38); circ(x, c[2], Z * 4 / 38); });
    o[k + "2"] = mk(function (x) { circ(x, c[1], Z * 9 / 38); });
  });
  LGS.spr = o;
  return o;
}
/* 점 무리 · P = [x, y, 지름, 면(0 = 원본 · 1 = 수면), 핵 끔] · 바깥을 모두 먼저 찍고 안쪽을 위에(원본 3층 구조) */
function lgsDots(cx, P, a, lq) {
  var sp = lgsSprites(), i, q, r, nm = ["o", "w"];
  cx.globalAlpha = a == null ? 1 : a;
  for (var pass = 0; pass < (lq ? 1 : 2); pass++) {
    for (i = 0; i < P.length; i++) {
      q = P[i]; if (q[2] <= 0.3) continue;
      r = q[2] / 2;
      cx.drawImage(sp[nm[q[3]] + (pass === 0 ? "0" : q[4] ? "2" : "1")], q[0] - r, q[1] - r, q[2], q[2]);
    }
  }
  cx.globalAlpha = 1;
}
/* 배치 · G = 월이 준 무대(논리 좌표) { cx, cy: 심볼 가운데 · S: 심볼 배율 · map(px, py) · fw: 거울 장면 폭 · hh: 높이 · xR · yB: 화면 오른쪽 · 아래 끝 } */
function lgsLayout(G) {
  var sy = lgsSym(), i, cur = { G: G };
  var b0 = sy.box[0], b1 = sy.box[1], b4 = sy.box[4];
  var rowW = (b1.x1 - b0.x0) + 40, rowH = (b0.y1 - b0.y0) + (b4.y1 - b4.y0) + 110;
  var fw = G.fw, cxm = G.cx, sm = Math.min((fw - 32) / rowW, G.hh * 0.78 / rowH), yh = G.cy, rowCx = (b0.x0 + b1.x1) / 2;
  var L = cur.L = { cx: cxm, x0: cxm - fw / 2, fw: fw, sm: sm, yh: yh, air: G.hh * 0.09, dM: 38 * sm, dF: 38 * G.S, xR: G.xR, yB: G.yB };
  var bt = sy.box[2], bo = sy.box[3];
  L.gap = (Math.max(bt.y1, bo.y1) - Math.min(bt.y0, bo.y0)) * sm * 0.72 / 2 + 6;
  L.toCx = (bt.x0 + bo.x1) / 2; L.toCy = (Math.min(bt.y0, bo.y0) + Math.max(bt.y1, bo.y1)) / 2; L.toS = sm * 0.72;
  L.toX0 = cxm + (bt.x0 - L.toCx) * L.toS - 20;
  L.meCy = yh - L.air - (b0.y1 - b0.y0 + 25) * sm / 2;   /* 공중에 모인 Me 의 가운데 높이 · 점(나)이 여기까지 솟아 흩어진다 */
  L.D0 = 30 * (L.dM / 22); L.y0 = yh - L.D0 / 2 - 6;     /* 점(나)이 생기는 자리 = 가운데 수평선 바로 위 */
  var P = sy.P, n = P.length, pt = [];
  for (i = 0; i < n; i++) {
    var g = sy.g[i], o = sy.off[g], q = { g: g, f: G.map(P[i][0], P[i][1]), f0: G.map(sy.X[i], P[i][1]) };
    if (o) q.m = [cxm + (sy.X[i] + o[0] - rowCx) * sm, yh + (P[i][1] + o[1]) * sm];
    else q.gp = [cxm + (P[i][0] - L.toCx) * L.toS, yh + (P[i][1] - L.toCy) * L.toS];
    pt.push(q);
  }
  var up = [], dn = [];
  for (i = 0; i < n; i++) { var q4 = pt[i]; if (!q4.m) continue; q4.s = q4.m;
    if (q4.g < 2) up.push({ m: q4.m, mine: i === sy.mine }); else dn.push({ m: q4.m }); }
  /* 흩어지는 순서 · Me 가운데에서 가까운 점이 먼저(r = 0 ~ 1) */
  var mx0 = 0, my0 = 0, rM = 1;
  up.forEach(function (u) { mx0 += u.m[0]; my0 += u.m[1]; }); mx0 /= up.length || 1; my0 /= up.length || 1;
  up.forEach(function (u) { u.r = Math.hypot(u.m[0] - mx0, u.m[1] - my0); rM = Math.max(rM, u.r); });
  up.forEach(function (u) { u.r /= rM; });
  cur.pt = pt; cur.up = up; cur.dn = dn; cur.sparks = null;
  return cur;
}
/* 점(나) · 생긴 자리에서 스프링으로 솟아 Me 가운데 높이로 · 흩어지기 전까지 조금 커진다 · [x, y, 지름, 면] · 앞 구간(t < 0)은 그 자리에서 톡 생긴다 */
function lgsSeed(cur, t) {
  var L = cur.L;
  if (t < 0) return [L.cx, L.y0, L.D0 * lgsSpring((t + LGS.PRE) / LGS.PRE, 0.55, 1.25), 0];
  var u = (t - LGS.T.rise) / 0.6, e = lgsSpring(u, 0.55, 1.2);
  return [L.cx, L.y0 + (L.meCy - L.y0) * e - Math.sin(lgsCl(u) * 3.1416) * 22, L.D0 * (1 + 0.12 * lgsCl(e)), 0];
}
/* 수평선 높이 · to 가 틈에 들어선 뒤 수면이 천천히 빠진다 */
function lgsLine(cur, t) { var L = cur.L, T = LGS.T; return t >= T.to + 0.55 ? L.yh + (L.yB + 8 - L.yh) * lgsEIO((t - T.to - 0.55) / 0.75) : L.yh; }
/* 한 프레임 · 시간(t)만으로 모든 점의 자리가 정해진다 · t 는 -PRE 부터 · cx 는 논리 좌표 변환이 걸린 상태 · env.water(line) = 수면 칠하기(월이 그린다) */
function lgsFrame(cur, cx, t, env) {
  var T = LGS.T, L = cur.L, sy = lgsSym(), i, q, lq = !!env.lq, a0 = lgsCl((t + LGS.PRE) / 0.5);
  var line = lgsLine(cur, t);
  if (line < L.yB) env.water(line, a0);
  var Pd = [], mineP = t < T.burst ? lgsSeed(cur, t) : null;   /* 점 하나(나) · 흩어지기 전까지 */
  /* 거울 장면의 두 줄 · 윗줄 = 점(나)이 흩어져 공중에서 반듯한 Me 로 모임 → 낙하 → 수평선 · 수면 = 닿는 순간 한 줄씩 피어남 */
  var gyOff = -L.air, sq = 1, sxq = 1, amp = 0;
  if (t >= T.drop) {
    var an = lgsCl((t - T.drop) / 0.14), fall = lgsEI((t - T.drop - 0.1) / (T.hit - T.drop - 0.1));
    gyOff = -L.air - Math.sin(an * 3.1416) * 10 * (fall > 0 ? 0 : 1) + L.air * fall; sq = 1 + 0.07 * fall; sxq = 1 - 0.035 * fall;
  }
  if (t >= T.hit) {
    gyOff = 0; var hk = t - T.hit;
    sq = hk < 1.2 ? 1 - 0.17 * Math.exp(-4.5 * hk) * Math.cos(11 * hk) : 1; sxq = 1 + (1 - sq) * 0.55;
    amp = 5 * Math.max(0, 1 - hk / 1.6);
  }
  if (t >= T.burst && t < T.to) {
    for (i = 0; i < cur.up.length; i++) {
      q = cur.up[i];
      var x = L.cx + (q.m[0] - L.cx) * sxq, y = L.yh - (L.yh - q.m[1]) * sq + gyOff, dd = L.dM, dep = T.burst + (q.mine ? 0.34 : 0.3 * q.r + 0.06 * lgsH(i)), k2 = (t - dep) / 0.7;   /* Me 가운데에서 가까운 점부터(나는 맨 나중) */
      if (k2 < 1) {
        if (k2 <= 0) { if (q.mine) mineP = lgsSeed(cur, t); continue; }   /* 아직 점(나) 안에 있다 */
        var s0 = lgsSeed(cur, dep), ek2 = lgsSpring(k2, 0.55, 1.35), ec = Math.min(1, ek2), iu = 1 - ec, tx0 = x, ty0 = y, ddx = tx0 - s0[0], ddy = ty0 - s0[1];
        var c1x = s0[0] + (ddx * 0.62 + ddy * 0.78) * 0.55, c1y = s0[1] + (ddy * 0.62 - ddx * 0.78) * 0.55;   /* 소용돌이 방향으로 돌며 나간다(곡선 조절점 = 방향을 0.9 라디안 돌린 자리) */
        x = iu * iu * s0[0] + 2 * iu * ec * c1x + ec * ec * tx0; y = iu * iu * s0[1] + 2 * iu * ec * c1y + ec * ec * ty0;
        if (ek2 > 1) { x += (tx0 - c1x) * (ek2 - 1) * 0.5; y += (ty0 - c1y) * (ek2 - 1) * 0.5; }
        dd = (q.mine ? s0[2] : L.dM * 0.35) * (1 - ec) + dd * ec;
      }
      var qq = [x, y, dd, y > line ? 1 : 0];
      if (q.mine) mineP = qq; else Pd.push(qq);
    }
    if (t >= T.hit) for (i = 0; i < cur.dn.length; i++) {
      q = cur.dn[i];
      var kr = (t - T.hit - ((q.m[1] - L.yh) / (24 * L.sm)) * 0.04) / 0.45;
      if (kr <= 0) continue;
      Pd.push([L.cx + (q.m[0] - L.cx) * (2 - sxq) + amp * Math.sin(q.m[1] * 0.06 + t * 9), q.m[1], L.dM * lgsSpring(kr, 0.38, 1.6), q.m[1] > line ? 1 : 0]);
    }
  }
  /* to 가 끼어든다 · 두 줄이 밀리며 원본 심볼 자리(= 월의 심볼 자리)로 · 수면이 빠지면 어두운 점이 원본 색으로 */
  if (t >= T.to) {
    var wave = t >= T.land ? ((t - T.land) * 0.5) % 1 : -1;
    var wb = t >= T.land - 0.15 ? 1 + 0.03 * Math.exp(-4 * (t - T.land + 0.15)) * Math.sin(14 * (t - T.land + 0.15)) : 1, wcy = cur.G.cy;
    for (i = 0; i < cur.pt.length; i++) {
      q = cur.pt[i];
      var x2, y2, d2;
      var ek = lgsSpring((t - T.to - LGS_LD[q.g] - 0.05 * lgsH(i + 7)) / 0.95, 0.62, 1.3), sp = lgsSpring((t - T.to) / 0.5, 0.5, 1.3) * (1 - lgsCl(ek));
      if (q.s) {
        var bx2 = q.s[0], by2 = q.s[1] + (q.g < 2 ? -1 : 1) * L.gap * sp, es = lgsSpring((t - T.to - LGS_LD[q.g] - 0.16) / 0.8, 0.5, 1.3);
        x2 = bx2 + (q.f0[0] - q.s[0]) * ek + (q.f[0] - q.f0[0]) * es; y2 = by2 + (q.f[1] - q.s[1]) * ek; d2 = L.dM + (L.dF - L.dM) * Math.min(1, lgsCl(ek));
      } else {
        var ke = lgsSpring((t - T.to - 0.12 - 0.06 * (q.g - 2)) / 0.6, 0.6, 1.2);
        if (ke <= 0) continue;
        var gx2 = q.gp[0], gy2 = q.gp[1], slide = (L.xR + 60 - L.toX0) * (1 - ke);
        x2 = gx2 + slide + (q.f[0] - gx2) * ek; y2 = gy2 + (q.f[1] - gy2) * ek; d2 = L.dM * 0.72 + (L.dF - L.dM * 0.72) * lgsCl(ek);
      }
      if (wb !== 1) { x2 = cur.G.cx + (x2 - cur.G.cx) * wb; y2 = wcy + (y2 - wcy) * wb; d2 *= wb; }
      var off5 = wave >= 0 && !lq && (((sy.rank[i] - wave) % 1 + 1) % 1) < 0.06;
      var q5 = [x2, y2, d2, y2 > line ? 1 : 0, off5];
      if (i === sy.mine) mineP = q5; else Pd.push(q5);
    }
  }
  /* 반사 · 점(나)과 흩어져 나오는 점은 수면에 옅게 비친다(Me 가 모이기 전에 사라진다) */
  if (t < T.burst + 0.5) {
    var ra = 0.9 * (1 - lgsCl((t - T.burst - 0.2) / 0.3)) * lgsCl((t + LGS.PRE) / 0.25), RR = [];
    for (i = 0; i < Pd.length; i++) if (Pd[i][1] < line) RR.push([Pd[i][0], 2 * line - Pd[i][1], Pd[i][2], 1]);
    if (mineP) RR.push([mineP[0], 2 * line - mineP[1], mineP[2], 1]);
    cx.save(); cx.beginPath(); cx.rect(-1e4, line, 2e4, 2e4); cx.clip(); lgsDots(cx, RR, ra, true); cx.restore();
  }
  /* 닿는 순간 · 수면 물결 · 섬광 · 튀는 점 */
  if (t >= T.hit && t < T.hit + 2.2) {
    var hu = t - T.hit, gwid = (sy.box[1].x1 - sy.box[0].x0) * L.sm;
    cx.save(); cx.beginPath(); cx.rect(-1e4, line, 2e4, 2e4); cx.clip();
    for (var r3 = 0; r3 < 4; r3++) {
      var ru = lgsCl((hu - r3 * 0.22) / 1.6); if (ru <= 0 || ru >= 1) continue;
      var rx2 = gwid * 0.45 + lgsEO(ru) * L.fw * 0.75;
      cx.globalAlpha = 0.55 * (1 - ru); cx.strokeStyle = "#FF963E"; cx.lineWidth = 2;
      cx.beginPath(); cx.ellipse(L.cx, line, rx2, rx2 * 0.12, 0, 0, 3.1416); cx.stroke();
    }
    cx.globalAlpha = Math.max(0, 1 - hu / 0.28) * 0.8; cx.fillStyle = "#FF963E"; cx.fillRect(L.x0, line, L.fw, 3);
    cx.restore(); cx.globalAlpha = 1;
    if (!cur.sparks) { cur.sparks = []; for (var z0 = 0; z0 < (lq ? 14 : 34); z0++) { var hx = lgsH(z0 * 3.7); cur.sparks.push([L.cx - gwid / 2 + hx * gwid, (lgsH(z0) - 0.5) * 260 + (hx - 0.5) * 120, -(140 + lgsH(z0 + 9) * 320) * (z0 % 3 === 0 ? -0.6 : 1), 2 + lgsH(z0 + 4) * 4]); } }
    if (hu < 1.0) {
      var Sp = [];
      for (var z = 0; z < cur.sparks.length; z++) { var s1 = cur.sparks[z], yy = line + s1[2] * hu * 0.85 + 520 * hu * hu; Sp.push([s1[0] + s1[1] * hu * 0.85, yy, s1[3] * (1 - hu) * 2.2, yy > line ? 1 : 0]); }
      lgsDots(cx, Sp, 1, true);
    }
  }
  lgsDots(cx, Pd, 1, lq);
  if (mineP) lgsDots(cx, [mineP], 1, false);
  /* 수평선 · 수면이 빠지기 전까지 가는 오렌지 선 하나 */
  if (line < L.yB) { cx.globalAlpha = 0.5 * a0 * (1 - lgsCl((t - T.to - 0.55) / 0.6)); cx.fillStyle = "#FF7E31"; cx.fillRect(-1e4, line - 1, 2e4, 2); cx.globalAlpha = 1; }
}
