/* 1층 둘러보기 v3 시제품(261003) · 캐릭터로 걷기
 * 사용자 피드백(261003): 「기둥 뒤로 가면 회색 화면이 당황스럽다 · 어떻게 앞으로 가는지 어렵다 · 자세히 보는 법을 모르겠다」
 *   + 「50대 수석님도 바로 이해할 만큼 쉬움이 최우선 · 조이스틱만으로는 부족」
 * 조작 세 가지(쉬운 순서)
 *   1. 아래 큰 버튼 「이전 구역 · 다음 구역」 → 캐릭터가 알아서 그 구역 앞까지 걸어가고 「판 크게 보기」가 떠오른다(이것만으로 끝까지 볼 수 있다)
 *   2. 화면을 끌면 그 자리에 조이스틱이 생겨 직접 걷는다(카메라 기준 전후좌우)
 *   3. 바닥을 톡 누르면 그 자리까지 걸어간다 · 판을 누르면 그 판부터 크게 본다
 * 가림: 카메라는 벽 · 유리 · 판을 넘지 않게 당겨지고(높이 지도 따라 행진), 기둥(과 기둥 포스터)은 시선을 가리면 점점이 비워진다(디더링).
 *   카메라가 너무 가까워지면 머리 위 시점으로 바뀐다 · 회색 화면 · 벽 속 시점이 나오지 않는다.
 * 충돌: lobby.glb 를 받은 뒤 삼각형을 0.1m 칸에 찍어 만든 높이 지도(모형을 다시 굽지 않는다 · 모형이 바뀌면 저절로 따라온다).
 * 판 보기: 구역 시트 · 판을 좌우로 넘기는 카드 · 그림 = ../assets/tour/d/c/pNN.webp(위아래 여백을 자른 판 · tour-data CROP)
 * 3D 를 못 그리면 평면 지도 + 구역 목록(시트는 같다). */
(function () {
  'use strict';
  var T = window.THREE, D = window.TOUR_DATA, BASE = '../assets/tour/', LABVER = 'v532a';
  var Q = new URLSearchParams(location.search);
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function P(x, z, y) { return new T.Vector3(x - 16, y || 0, 6 - z); }
  function N3(n) { return new T.Vector3(n[0], 0, -n[1]).normalize(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function angLerp(a, b, k) { var d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * k; }
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var toastT = 0;
  function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2200); }

  /* ─────────── 멈춤 자리 · 동선 순서(부스 발주 설명 PDF 2쪽 동선 2 → 6 + 게이트) ───────────
   * x · z = 도면 미터(서쪽 벽 0 → 동쪽 · 남쪽 유리 0 → 북쪽) · 캐릭터가 서는 자리 = 판 줄 앞 2.5~3m(데스크 · 기둥 피함) */
  var STOPS = [
    { id: 'start', name: '동쪽 문', x: 28.3, z: 8.6, look: [20, 7.8], where: '동쪽 문 안' },
    { id: 'vision', zone: 'vision', x: 29.0, z: 3.6 },
    { id: 'lab', zone: 'lab', x: 27.9, z: 3.25 },
    { id: 'action', zone: 'action', x: 22.3, z: 3.25 },
    { id: 'play', zone: 'play', x: 9.6, z: 3.0, look: [8.6, 0.55] },
    { id: 'event', zone: 'event', x: 3.5, z: 6.6 },
    { id: 'lounge', zone: 'lounge', x: 8.7, z: 8.3 },
    { id: 'cafe', zone: 'cafe', x: 18.4, z: 9.5, look: [18.4, 13], where: '게이트 · 엘리베이터 앞' }
  ];
  function zoneCenter(z) {
    if (!z || !z.rows.length) return null;
    var sx = 0, sz = 0, n = 0;
    z.rows.forEach(function (r) { var k = r.pages.length; sx += (r.a[0] + r.r[0] * k / 2) * k; sz += (r.a[1] + r.r[1] * k / 2) * k; n += k; });
    return [sx / n, sz / n];
  }
  STOPS.forEach(function (s) {
    var z = s.zone ? D.Z(s.zone) : null; s.z0 = z;
    if (!s.look) s.look = zoneCenter(z);
    if (z) s.name = z.id === 'cafe' ? '18F 커피챗' : z.name;
  });

  /* ─────────── 상태 ─────────── */
  var G = {
    ok: false, loaded: false, scn: 'lobby', need: true, last: 0, frames: [], probe: [], probed: false,
    pos: new T.Vector3(), h: 0, yaw: 0, Lcur: 4.6, H: 2.7, look: new T.Vector3(), camPos: new T.Vector3(),
    mode: 'stop', stop: 0, path: null, pathI: 0, speed: 0, walkT: 0, moveV: 0,
    stick: null, near: null, ctaKey: '', fade: [1, 1, 1, 1, 1], fadeTo: [1, 1, 1, 1, 1],
    cafe: { th: 0.55, ph: 1.12, r: 11.5 }, sheetOpen: false
  };
  window.__lab = G;

  /* ═══════════ 3D 준비 ═══════════ */
  var renderer, scene, camera, S, bot, botParts = {}, shadow, pillarMats = [];
  function init3D() {
    var cv = $('cv');
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); }
    catch (e) { return false; }
    if (!renderer.getContext()) return false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.setClearColor(0xE9ECEF, 1);
    renderer.toneMapping = T.AgXToneMapping; renderer.toneMappingExposure = 1.0;
    scene = new T.Scene();
    var bc = document.createElement('canvas'); bc.width = 4; bc.height = 256; var bg = bc.getContext('2d'), gr = bg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#FAFBFC'); gr.addColorStop(0.55, '#EEF0F2'); gr.addColorStop(1, '#DADDE1'); bg.fillStyle = gr; bg.fillRect(0, 0, 4, 256);
    scene.background = new T.CanvasTexture(bc); scene.background.colorSpace = T.SRGBColorSpace;
    camera = new T.PerspectiveCamera(58, 1, 0.08, 300);
    scene.add(new T.HemisphereLight(0xFFFFFF, 0xC9CED4, 2.0));
    var dl = new T.DirectionalLight(0xFFFFFF, 1.3); dl.position.set(-8, 20, 12); scene.add(dl);
    S = window.TourScene.build({ T: T, D: D, P: P, N3: N3, renderer: renderer, scene: scene, labelFont: '"Pretendard Variable", Pretendard, sans-serif' });
    scene.add(S.lobby); scene.add(S.cafe);
    buildBot(); scene.add(bot);
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); toMap('3D 화면이 끊겨 평면 지도로 바꿨어요'); });
    G.ok = true;
    return true;
  }

  /* 캐릭터 · 행사 캐릭터 「챗봇」 모양(머리 돔 O 노랑 + 아래 띠 주황 + 안테나 공 + 까만 눈 · design.md A-4) · 걷는 모션은 통통 튐 + 좌우 기울임 + 발 번갈아 */
  function buildBot() {
    bot = new T.Group(); bot.name = 'labBot';
    var mOr = new T.MeshLambertMaterial({ color: 0xFF7F32 }), mYe = new T.MeshLambertMaterial({ color: 0xFFC56E, side: T.DoubleSide }), mInk = new T.MeshBasicMaterial({ color: 0x282320 }), mFoot = new T.MeshLambertMaterial({ color: 0xE5671E });
    var body = new T.Group(); bot.add(body); botParts.body = body;
    var pts = [new T.Vector2(0.335, 0.24)];
    for (var i = 0; i <= 14; i++) { var a = i / 14 * Math.PI / 2; pts.push(new T.Vector2(Math.max(0.0001, Math.cos(a) * 0.335), 0.43 + Math.sin(a) * 0.36)); }
    body.add(new T.Mesh(new T.LatheGeometry(pts, 32), mYe));
    var band = new T.Mesh(new T.CylinderGeometry(0.355, 0.33, 0.2, 32), mOr); band.position.y = 0.14; body.add(band);
    var bot0 = new T.Mesh(new T.SphereGeometry(0.33, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mOr); bot0.scale.y = 0.25; bot0.position.y = 0.04; body.add(bot0);
    var st = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.13, 8), mYe); st.position.y = 0.85; body.add(st);
    var ball = new T.Mesh(new T.SphereGeometry(0.075, 16, 12), mOr); ball.position.y = 0.94; body.add(ball);
    [-1, 1].forEach(function (s) { var e = new T.Mesh(new T.SphereGeometry(0.046, 12, 10), mInk); e.scale.set(1, 1.15, 0.45); e.position.set(s * 0.12, 0.55, 0.305); body.add(e); });
    botParts.feet = [-1, 1].map(function (s) { var f = new T.Mesh(new T.SphereGeometry(0.085, 12, 8), mFoot); f.scale.set(1, 0.6, 1.35); f.position.set(s * 0.15, 0.035, 0.04); bot.add(f); return f; });
    var sc = document.createElement('canvas'); sc.width = sc.height = 64; var g = sc.getContext('2d'), rg = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    rg.addColorStop(0, 'rgba(25,31,40,0.32)'); rg.addColorStop(1, 'rgba(25,31,40,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    var stx = new T.CanvasTexture(sc);
    shadow = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), new T.MeshBasicMaterial({ map: stx, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; shadow.renderOrder = 3; bot.add(shadow);
    bot.scale.setScalar(0.95);
  }

  /* ═══════════ 충돌 · 높이 지도 ═══════════
   * 칸 0.1m · 도면 x -4 ~ 50, z -6 ~ 30 · walk = 걸음을 막는 것(바닥 위 0.1~1.7m) · hw = 카메라를 막는 높이(기둥 제외 · 0.05m 단위) */
  var GS = 0.1, GX0 = -4, GZ0 = -6, GW = 540, GH = 360;
  var walk = new Uint8Array(GW * GH), hw = new Uint8Array(GW * GH), wd = null, reach = null;
  function gi(x, z) { var i = Math.floor((x - GX0) / GS), j = Math.floor((z - GZ0) / GS); return (i < 0 || j < 0 || i >= GW || j >= GH) ? -1 : j * GW + i; }
  function underName(o, re) { while (o) { if (o.name && re.test(o.name)) return true; o = o.parent; } return false; }
  function buildGrid(root) {
    var t0 = performance.now(), va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), STEP = 0.07, tris = 0, samples = 0;
    root.updateMatrixWorld(true);
    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      if (/^(floor|paving|base|leds)$/.test(o.name) || underName(o, /^ceiling$/)) return;
      var fadeable = underName(o, /^pillars$/);
      var pos = o.geometry.attributes.position, idx = o.geometry.index, m = o.matrixWorld, n = idx ? idx.count : pos.count;
      for (var t = 0; t < n; t += 3) {
        var ia = idx ? idx.getX(t) : t, ib = idx ? idx.getX(t + 1) : t + 1, ic = idx ? idx.getX(t + 2) : t + 2;
        va.fromBufferAttribute(pos, ia).applyMatrix4(m); vb.fromBufferAttribute(pos, ib).applyMatrix4(m); vc.fromBufferAttribute(pos, ic).applyMatrix4(m);
        var ymin = Math.min(va.y, vb.y, vc.y), ymax = Math.max(va.y, vb.y, vc.y);
        if (ymax < 0.05 || ymin > 4.95) continue;
        tris++;
        var ax = va.x + 16, az = 6 - va.z, bx = vb.x + 16 - ax, bz = 6 - vb.z - az, cx = vc.x + 16 - ax, cz = 6 - vc.z - az, by = vb.y - va.y, cy = vc.y - va.y;
        var L = Math.max(Math.hypot(bx, bz, by), Math.hypot(cx, cz, cy), Math.hypot(cx - bx, cz - bz, cy - by)), k = Math.max(1, Math.ceil(L / STEP));
        for (var i = 0; i <= k; i++) for (var j = 0; j <= k - i; j++) {
          var u = i / k, v = j / k, y = va.y + by * u + cy * v;
          if (y < 0.05 || y > 4.95) continue;
          var c = gi(ax + bx * u + cx * v, az + bz * u + cz * v); if (c < 0) continue;
          samples++;
          if (y > 0.1 && y < 1.7) walk[c] = 1;
          if (!fadeable) { var hq = Math.min(255, Math.ceil(y / 0.05)); if (hq > hw[c]) hw[c] = hq; }
        }
      }
    });
    /* 걷기 여유 · 캐릭터 반지름 0.32m 만큼 넓힌다 */
    wd = new Uint8Array(GW * GH); var R = 3, offs = [];
    for (var dj = -R; dj <= R; dj++) for (var di = -R; di <= R; di++) if (di * di + dj * dj <= R * R + 1) offs.push([di, dj]);
    for (var jj = 0; jj < GH; jj++) for (var ii = 0; ii < GW; ii++) {
      if (!walk[jj * GW + ii]) continue;
      for (var q = 0; q < offs.length; q++) { var a2 = ii + offs[q][0], b2 = jj + offs[q][1]; if (a2 >= 0 && b2 >= 0 && a2 < GW && b2 < GH) wd[b2 * GW + a2] = 1; }
    }
    G.gridMs = Math.round(performance.now() - t0); G.gridTris = tris; G.gridSamples = samples;
  }
  function free(x, z) { var c = gi(x, z); return c >= 0 && !wd[c] && (!reach || reach[c]); }
  function flood(x, z) {
    reach = null; var s = gi(x, z), r = new Uint8Array(GW * GH), qu = new Int32Array(GW * GH), h = 0, t = 0;
    if (s < 0 || wd[s]) return;
    r[s] = 1; qu[t++] = s;
    while (h < t) { var c = qu[h++], i = c % GW, j = (c / GW) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var a = i + d[0], b = j + d[1]; if (a < 0 || b < 0 || a >= GW || b >= GH) return; var n = b * GW + a; if (!r[n] && !wd[n]) { r[n] = 1; qu[t++] = n; } }); }
    reach = r;
  }
  function nearestFree(x, z) {
    if (free(x, z)) return [x, z];
    for (var rr = 1; rr < 40; rr++) {
      var best = null, bd = 1e9;
      for (var k = 0; k < rr * 8; k++) {
        var a = k / (rr * 8) * Math.PI * 2, px = x + Math.cos(a) * rr * GS, pz = z + Math.sin(a) * rr * GS;
        if (free(px, pz)) { var d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; best = [px, pz]; } }
      }
      if (best) return best;
    }
    return null;
  }
  function segFree(x0, z0, x1, z1) { var L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.05)); for (var i = 0; i <= n; i++) { var t = i / n; if (!free(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false; } return true; }
  /* A* (8방향) + 줄 당기기 */
  function findPath(x0, z0, x1, z1) {
    var s = gi(x0, z0), g = gi(x1, z1); if (s < 0 || g < 0) return null;
    if (segFree(x0, z0, x1, z1)) return [[x1, z1]];
    var gs = new Float32Array(GW * GH).fill(1e9), from = new Int32Array(GW * GH).fill(-1), closed = new Uint8Array(GW * GH);
    var heap = [], gx = g % GW, gz = (g / GW) | 0;
    function hh(c) { var dx = Math.abs(c % GW - gx), dz = Math.abs(((c / GW) | 0) - gz); return (dx + dz - 0.586 * Math.min(dx, dz)); }
    function push(c, f) { heap.push([f, c]); var i = heap.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; var t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; } }
    function pop() { var top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; var t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m; } } return top; }
    gs[s] = 0; push(s, hh(s)); var it = 0, D8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    while (heap.length && it++ < 120000) {
      var c = pop()[1]; if (closed[c]) continue; closed[c] = 1; if (c === g) break;
      var ci = c % GW, cj = (c / GW) | 0;
      for (var k = 0; k < 8; k++) {
        var a = ci + D8[k][0], b = cj + D8[k][1]; if (a < 0 || b < 0 || a >= GW || b >= GH) continue;
        var n = b * GW + a; if (closed[n] || wd[n] || (reach && !reach[n])) continue;
        if (k > 3 && (wd[cj * GW + a] || wd[b * GW + ci])) continue;
        var ng = gs[c] + D8[k][2]; if (ng < gs[n]) { gs[n] = ng; from[n] = c; push(n, ng + hh(n)); }
      }
    }
    if (from[g] < 0) return null;
    var cells = [], c2 = g; while (c2 >= 0 && c2 !== s) { cells.push(c2); c2 = from[c2]; } cells.reverse();
    var pts = cells.map(function (c) { return [GX0 + (c % GW + 0.5) * GS, GZ0 + (((c / GW) | 0) + 0.5) * GS]; }); pts[pts.length - 1] = [x1, z1];
    var out = [], cur = [x0, z0], i = 0;
    while (i < pts.length) { var j = pts.length - 1; while (j > i && !segFree(cur[0], cur[1], pts[j][0], pts[j][1])) j--; out.push(pts[j]); cur = pts[j]; i = j + 1; }
    return out;
  }

  /* ═══════════ 기둥 비우기(디더링) ═══════════ */
  var PIL = [D.BLD.pier[0]].concat(D.BLD.cols).map(function (x) { return [x, D.BLD.colZ]; });
  function patchPillars(root) {
    var fadeU = { value: G.fade }, pilU = { value: PIL.map(function (p) { return new T.Vector2(p[0] - 16, 6 - p[1]); }) };
    root.traverse(function (o) {
      if (!o.isMesh || !underName(o, /^pillars$/)) return;
      var m = o.material.clone();
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uFade = fadeU; sh.uniforms.uPil = pilU;
        sh.vertexShader = 'varying vec3 vLabWp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vLabWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = 'uniform float uFade[5];\nuniform vec2 uPil[5];\nvarying vec3 vLabWp;\n#define LB2(a) fract(dot(floor(a), vec2(.5, floor(a).y * .75)))\n#define LB4(a) (LB2(.5 * (a)) * .25 + LB2(a))\n' +
          sh.fragmentShader.replace('void main() {', 'void main() {\n  float labA = 1.0;\n  for (int i = 0; i < 5; i++) { vec2 d = abs(vLabWp.xz - uPil[i]); if (d.x < 0.8 && d.y < 0.8) labA = uFade[i]; }\n  if (labA < 0.995 && labA < LB4(gl_FragCoord.xy) + 0.001) discard;');
      };
      m.customProgramCacheKey = function () { return 'labPillarFade'; };
      o.material = m; pillarMats.push(m);
    });
  }

  /* ═══════════ 받기 ═══════════ */
  function load() {
    $('load').hidden = false;
    S.load(BASE + 'lobby.glb?v=' + LABVER, function (k) { $('load').textContent = '모형 불러오는 중 ' + Math.round(k * 100) + '%'; }, function () {
      buildGrid(S.lobby); patchPillars(S.lobby);
      var st = STOPS[0], f = nearestFree(st.x, st.z); flood(f[0], f[1]);
      STOPS.forEach(function (s) { var q = nearestFree(s.x, s.z); if (q) { s.x = q[0]; s.z = q[1]; } });
      G.loaded = true; $('load').hidden = true;
      placeAt(0, true);
      buildPins();
      try { renderer.compile(scene, camera); } catch (e) {}
      G.need = true; G.loadMs = Math.round(performance.now() - G.t0);
      maybeHelp();
    }, function () { toMap('모형을 받지 못해 평면 지도로 보여요'); });
  }

  /* ═══════════ 이동 ═══════════ */
  function toThree(x, z) { return new T.Vector3(x - 16, 0, 6 - z); }
  function planOf(v) { return [v.x + 16, 6 - v.z]; }
  function faceTo(look, x, z) { var a = toThree(look[0], look[1]), b = toThree(x, z); return Math.atan2(a.x - b.x, a.z - b.z); }
  function placeAt(k, snap) {
    var s = STOPS[k]; G.pos.copy(toThree(s.x, s.z)); G.h = s.look ? faceTo(s.look, s.x, s.z) : G.h; G.stop = k; G.mode = 'stop'; G.path = null;
    if (snap) { var c = camWant(0); G.yaw = c.yaw; G.camPos.copy(c.pos); G.look.copy(c.look); }
    G.need = true; updateUi(true);
  }
  function goStop(k) {
    if (!G.loaded) return;
    k = clamp(k, 0, STOPS.length - 1);
    if (G.scn === 'cafe') backTo1F();
    var s = STOPS[k], p = planOf(G.pos);
    var path = findPath(p[0], p[1], s.x, s.z);
    if (!path) { placeAt(k, false); return; }
    startWalk(path, k);
  }
  function startWalk(path, stopK) {
    var p = planOf(G.pos), L = 0, prev = p; path.forEach(function (q) { L += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; });
    G.path = path; G.pathI = 0; G.goal = stopK; G.mode = 'auto'; G.speed = clamp(L / 3.6, 2.6, 6.5); G.need = true; $('dest').hidden = stopK != null;
    G.walkTo = path[path.length - 1];
    updateUi(true);
  }
  function arrive() {
    G.path = null; $('dest').hidden = true;
    if (G.goal != null) { var s = STOPS[G.goal]; G.stop = G.goal; G.mode = 'stop'; G.hTo = s.look ? faceTo(s.look, s.x, s.z) : null; }
    else { G.mode = 'free'; nearestStop(); }
    G.goal = null; updateUi(true);
  }
  function nearestStop() { var p = planOf(G.pos), best = 0, bd = 1e9; STOPS.forEach(function (s, i) { var d = Math.hypot(s.x - p[0], s.z - p[1]); if (d < bd) { bd = d; best = i; } }); G.stop = best; }

  /* 매 프레임 · 캐릭터 */
  var _v = new T.Vector3();
  function stepBot(dt, now) {
    var moving = 0; G.camFollow = 0;
    if (G.mode === 'auto' && G.path) {
      var p = planOf(G.pos), q = G.path[G.pathI], dx = q[0] - p[0], dz = q[1] - p[1], d = Math.hypot(dx, dz), step = G.speed * dt;
      if (d <= step) { G.pos.copy(toThree(q[0], q[1])); G.pathI++; if (G.pathI >= G.path.length) arrive(); }
      else { var nx = p[0] + dx / d * step, nz = p[1] + dz / d * step; G.pos.copy(toThree(nx, nz)); }
      if (d > 0.01) { var hT = Math.atan2(dx, -dz); G.h = angLerp(G.h, hT, 1 - Math.exp(-dt * 12)); }
      moving = Math.min(1, G.speed / 3); G.camFollow = 2.6;
    } else if (G.stick && (Math.abs(G.stick.x) + Math.abs(G.stick.y)) > 0.05) {
      /* 조이스틱 · 카메라 기준 · 위 = 화면 안쪽으로 */
      /* 방향 기준은 끌기 시작할 때의 카메라로 고정한다(끄는 동안 카메라가 돌아도 같은 쪽으로 걷는다) */
      if (!G.stickBasis) { var f0 = _v.subVectors(G.look, G.camPos); f0.y = 0; if (f0.lengthSq() < 1e-6) f0.set(Math.sin(G.h), 0, Math.cos(G.h)); G.stickBasis = f0.normalize().clone(); }
      var fw = G.stickBasis;
      var rx = -fw.z, rz = fw.x, mx = rx * G.stick.x - fw.x * G.stick.y, mz = rz * G.stick.x - fw.z * G.stick.y, mag = Math.min(1, Math.hypot(mx, mz));
      if (mag > 0.01) {
        var sp = 3.2 * mag * dt, ux = mx / Math.hypot(mx, mz), uz = mz / Math.hypot(mx, mz), p0 = planOf(G.pos);
        var tx = p0[0] + ux * sp, tz = p0[1] - uz * sp;
        if (free(tx, tz)) G.pos.copy(toThree(tx, tz));
        else if (free(tx, p0[1])) G.pos.copy(toThree(tx, p0[1]));
        else if (free(p0[0], tz)) G.pos.copy(toThree(p0[0], tz));
        G.h = angLerp(G.h, Math.atan2(ux, uz), 1 - Math.exp(-dt * 10));
        /* 화면 쪽으로 걸을 때(뒤돌아 걷기)는 카메라를 돌리지 않는다 · 그래야 빙빙 돌지 않는다 */
        var ahead = (ux * fw.x + uz * fw.z) > 0.5; G.camFollow = ahead ? 1.2 * mag : 0;
        moving = mag; G.mode = 'free';
      }
    } else if (G.hTo != null) { G.h = angLerp(G.h, G.hTo, 1 - Math.exp(-dt * 8)); if (Math.abs(Math.atan2(Math.sin(G.hTo - G.h), Math.cos(G.hTo - G.h))) < 0.01) G.hTo = null; }
    /* 모션 · 통통 + 기울임 + 발 */
    G.moveV += ((moving ? 1 : 0) - G.moveV) * (1 - Math.exp(-dt * 10));
    if (moving) G.walkT += dt * (7 + 5 * moving);
    var w = G.moveV, s = Math.sin(G.walkT);
    bot.position.copy(G.pos); bot.rotation.y = G.h;
    botParts.body.position.y = Math.abs(s) * 0.045 * w; botParts.body.rotation.z = s * 0.07 * w; botParts.body.rotation.x = 0.06 * w;
    botParts.feet[0].position.z = 0.04 + s * 0.09 * w; botParts.feet[1].position.z = 0.04 - s * 0.09 * w;
    return moving > 0.01 || w > 0.01 || G.hTo != null;
  }

  /* ═══════════ 카메라 · 따라가기 + 가림 해결 ═══════════ */
  function stopCam(s) {
    var c = toThree(s.x, s.z), lk = s.look ? toThree(s.look[0], s.look[1]) : c.clone(), dx = c.x - lk.x, dz = c.z - lk.z, d = Math.hypot(dx, dz) || 1;
    return { yaw: Math.atan2(dx / d, dz / d), L: 4.2, H: 3.2, look: new T.Vector3(c.x + (lk.x - c.x) * 0.6, 1.2, c.z + (lk.z - c.z) * 0.6) };
  }
  /* 머리에서 카메라 쪽으로 0.08m 씩 나아가며 벽 · 유리 · 판 높이를 본다 · 막히면 그 앞에서 멈춘다 */
  function march(hx, hz, dirx, dirz, L, H) {
    for (var d = 0.25; d <= L; d += 0.08) {
      var y = 1.25 + (H - 1.25) * (d / L), x = hx + dirx * d, z = hz + dirz * d, c = gi(x + 16, 6 - z);
      if (c < 0) return d;
      if (hw[c] * 0.05 > y - 0.3) return d;
    }
    return 1e9;
  }
  function camWant(dt) {
    var c = G.pos, L = 4.2, H = 2.6, yaw = G.yaw, look;
    if (G.mode === 'stop') {
      var sc = stopCam(STOPS[G.stop]); L = sc.L; H = sc.H; yaw = dt ? angLerp(G.yaw, sc.yaw, 1 - Math.exp(-dt * 3)) : sc.yaw; look = sc.look;
    } else {
      if (G.camFollow) yaw = angLerp(G.yaw, G.h + Math.PI, 1 - Math.exp(-dt * G.camFollow));
      look = new T.Vector3(c.x + Math.sin(G.h) * 1.2, 1.05, c.z + Math.cos(G.h) * 1.2);
    }
    /* 뒤가 막혀 있으면 좌우로 조금씩 돌려 가장 트인 쪽을 찾는다(돌린 만큼 감점) · 머리 위 시점은 마지막 수단 */
    var clr = function (yw) { var h0 = march(c.x, c.z, Math.sin(yw), Math.cos(yw), L, H); return h0 < 1e8 ? h0 - 0.35 : L; };
    var bestOff = 0, bestLen = clr(yaw);
    if (bestLen < Math.min(L, 2.8)) {
      var bestSc = bestLen;
      [0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2, 1.6, -1.6, 2.0, -2.0, 2.5, -2.5, 3.1].forEach(function (off) { var ln = clr(yaw + off), sc = Math.min(ln, L) - 0.7 * Math.abs(off); if (sc > bestSc + 0.05) { bestSc = sc; bestOff = off; bestLen = ln; } });
    }
    G.yo = dt ? angLerp(G.yo || 0, bestOff, 1 - Math.exp(-dt * 3.5)) : bestOff;
    var yawF = yaw + G.yo;
    var dx = Math.sin(yawF), dz = Math.cos(yawF), hit = march(c.x, c.z, dx, dz, L, H), Lc = hit < 1e8 ? hit - 0.35 : L;
    var overhead = Lc < 1.15;
    if (!dt) G.Lcur = Lc; else if (Lc < G.Lcur) G.Lcur = Lc; else G.Lcur += (Lc - G.Lcur) * (1 - Math.exp(-dt * 2.2));
    var Lu = Math.max(0.25, Math.min(G.Lcur, L)), y = overhead ? 4.3 : H;
    if (overhead) Lu = 0.15;
    var pos = new T.Vector3(c.x + dx * Lu, y, c.z + dz * Lu);
    if (overhead) look = new T.Vector3(c.x - dx * 2.4, 0.4, c.z - dz * 2.4);
    return { yaw: yaw, pos: pos, look: look, overhead: overhead };
  }
  function stepCam(dt) {
    var w = camWant(dt); G.yaw = w.yaw; G.overhead = w.overhead;
    var k = 1 - Math.exp(-dt * 7);
    /* 위치는 가림 계산이 끝난 값을 바로 쓴다(늦게 따라가면 그 사이 벽을 뚫는다) · 바라보는 점만 부드럽게 */
    var moved = G.camPos.distanceToSquared(w.pos) > 1e-6 || G.look.distanceToSquared(w.look) > 1e-5;
    G.camPos.lerp(w.pos, G.overhead ? k : 1); G.look.lerp(w.look, k);
    camera.position.copy(G.camPos); camera.lookAt(G.look);
    /* 기둥 비우기 · 카메라 → 머리 선분에서 0.95m 안이면 */
    var hx = G.pos.x, hz = G.pos.z, cx = G.camPos.x, cz = G.camPos.z, sx = hx - cx, sz = hz - cz, L2 = sx * sx + sz * sz || 1, any = false;
    for (var i = 0; i < PIL.length; i++) {
      var px = PIL[i][0] - 16, pz = 6 - PIL[i][1], t = ((px - cx) * sx + (pz - cz) * sz) / L2, tt = clamp(t, 0, 1), d = Math.hypot(cx + sx * tt - px, cz + sz * tt - pz);
      var cd = Math.hypot(cx - px, cz - pz);
      G.fadeTo[i] = ((t > -0.05 && t < 1.02 && d < 0.95) || cd < 1.0) ? 0.16 : 1;
      var f0 = G.fade[i]; G.fade[i] += (G.fadeTo[i] - G.fade[i]) * (1 - Math.exp(-dt * 9)); if (Math.abs(G.fade[i] - G.fadeTo[i]) < 0.01) G.fade[i] = G.fadeTo[i];
      if (G.fade[i] !== f0) any = true;
    }
    return moved || any;
  }

  /* ═══════════ 핀(구역 간판 · 길잡이 이름표) ═══════════ */
  var pinEls = [];
  function buildPins() {
    var box = $('pins'); box.innerHTML = ''; pinEls = [];
    D.ZONES.forEach(function (z) {
      if (z.id === 'cafe' || !S.anchors[z.id]) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pin'; b.setAttribute('aria-label', z.name + '으로 걸어가기');
      b.innerHTML = '<span class="sg">' + esc(z.name) + '</span><span class="st"></span>';
      b.onclick = function () { var k = STOPS.findIndex(function (s) { return s.zone === z.id; }); hideDrag(); goStop(k); };
      box.appendChild(b); pinEls.push({ el: b, at: S.anchors[z.id], max: 26 });
    });
    (S.landmarks || []).forEach(function (l) {
      var d = document.createElement('div'); d.className = 'pin lm'; d.innerHTML = '<span class="s">' + esc(l.label) + '</span>';
      box.appendChild(d); pinEls.push({ el: d, at: S.anchors[l.id], max: 14, lm: true });
    });
  }
  var _p = new T.Vector3();
  function placePins() {
    var W = $('stage').clientWidth, H = $('stage').clientHeight, show = G.scn === 'lobby' && G.loaded;
    pinEls.forEach(function (p) {
      if (!show || !p.at) { p.el.style.display = 'none'; return; }
      var dist = p.at.distanceTo(camera.position);
      _p.copy(p.at).project(camera);
      if (_p.z > 1 || dist > p.max || Math.abs(_p.x) > 1.05 || _p.y > 1.05 || _p.y < -0.6) { p.el.style.display = 'none'; return; }
      p.el.style.display = ''; p.el.style.transform = 'translate(' + ((_p.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - _p.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
    });
  }

  /* ═══════════ 가까운 구역 · 떠오르는 버튼 · 아래 줄 ═══════════ */
  function nearZone() {
    var p = planOf(G.pos), best = null, bd = 1e9;
    D.ZONES.forEach(function (z) {
      if (z.id === 'cafe') { var dg = Math.hypot(p[0] - 18.4, p[1] - 10.4); if (dg < 2.6 && dg < bd) { bd = dg; best = z; } return; }
      z.rows.forEach(function (r) {
        var n = r.pages.length, ax = r.a[0], az = r.a[1], bx = ax + r.r[0] * n, bz = az + r.r[1] * n, vx = bx - ax, vz = bz - az, t = clamp(((p[0] - ax) * vx + (p[1] - az) * vz) / (vx * vx + vz * vz), 0, 1);
        var qx = ax + vx * t, qz = az + vz * t, d = Math.hypot(p[0] - qx, p[1] - qz), front = (p[0] - qx) * r.n[0] + (p[1] - qz) * r.n[1];
        if (front > 0 && d < 4.2 && d < bd) { bd = d; best = z; }
      });
    });
    return best;
  }
  function updateUi(force) {
    var z = G.mode === 'auto' ? null : nearZone(), key = (z ? z.id : '') + '|' + G.mode + '|' + G.stop + '|' + G.scn;
    if (!force && key === G.ctaKey) return; G.ctaKey = key; G.near = z;
    var cta = $('cta');
    if (z && G.scn === 'lobby') {
      var n = D.zonePages(z).length;
      cta.innerHTML = z.id === 'cafe' ? '18F 커피챗 보기' : esc(z.name) + ' 판 크게 보기 <span class="n">' + n + '장</span>';
      cta.hidden = false;
    } else cta.hidden = true;
    var s = STOPS[G.stop], w = $('where');
    if (G.scn === 'cafe') cta.hidden = true;
    if (G.scn === 'cafe') w.textContent = '18F AX 커피챗';
    else if (G.mode === 'auto' && G.goal != null) w.textContent = STOPS[G.goal].name + '(으)로 가는 중';
    else if (z) w.textContent = '지금: ' + (z.id === 'cafe' ? '게이트 · 엘리베이터 앞' : z.name + ' 앞') + ' · ' + (G.stop + 1) + ' / ' + STOPS.length;
    else w.textContent = '지금: ' + (G.mode === 'stop' && s.where ? s.where : '로비');
    $('bPrev').disabled = G.stop <= 0 && G.mode !== 'free';
    $('bNext').disabled = G.stop >= STOPS.length - 1 && G.mode === 'stop';
    var nx = Math.min(STOPS.length - 1, G.stop + (G.mode === 'stop' || G.mode === 'auto' ? 1 : 1));
    $('bNext').textContent = '다음 구역 ▶';
    $('bNext').setAttribute('aria-label', '다음 구역: ' + STOPS[nx].name);
    $('navRow').hidden = G.scn === 'cafe'; $('cafeRow').hidden = G.scn !== 'cafe';
    $('cap').hidden = true;
  }
  function onNext() { hideDrag(); var k = G.mode === 'auto' && G.goal != null ? G.goal + 1 : G.stop + 1; if (G.mode === 'free') { var z = nearZone(); var idx = z ? STOPS.findIndex(function (s) { return s.zone === z.id; }) : -1; k = idx >= 0 ? idx + 1 : G.stop + 1; } goStop(Math.min(STOPS.length - 1, k)); }
  function onPrev() { hideDrag(); var k = G.mode === 'auto' && G.goal != null ? G.goal - 1 : G.stop - 1; if (G.mode === 'free') { var z = nearZone(); var idx = z ? STOPS.findIndex(function (s) { return s.zone === z.id; }) : -1; k = idx >= 0 ? idx - 1 : G.stop; } goStop(Math.max(0, k)); }

  /* ═══════════ 18F 장면 ═══════════ */
  function toCafe() {
    G.scn = 'cafe'; S.lobby.visible = false; bot.visible = false; S.cafe.visible = true; $('bubble').hidden = false; $('drag').classList.add('off');
    G.cafe = { th: S.CAFE_DEF.th, ph: S.CAFE_DEF.ph, r: S.CAFE_DEF.r }; G.need = true; updateUi(true);
  }
  function backTo1F() {
    G.scn = 'lobby'; S.lobby.visible = true; bot.visible = true; S.cafe.visible = false; $('bubble').hidden = true; G.need = true; updateUi(true);
  }
  function cafeCam() {
    var c = G.cafe, t = S.CAFE_DEF.t, s = Math.sin(c.ph);
    camera.position.set(t.x + c.r * s * Math.sin(c.th), t.y + c.r * Math.cos(c.ph), t.z + c.r * s * Math.cos(c.th)); camera.lookAt(t);
  }

  /* ═══════════ 입력 · 끌기 = 조이스틱 · 톡 = 걷기 / 판 열기 ═══════════ */
  var ray = new T.Raycaster(), ptr = null;
  function hideDrag() { $('drag').classList.add('off'); }
  function wireStage() {
    var cv = $('cv');
    cv.addEventListener('pointerdown', function (e) {
      if (ptr) return;
      if (cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      var r = cv.getBoundingClientRect();
      ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX - r.left, ly: e.clientY - r.top, t0: performance.now(), kind: null, th0: G.cafe.th };
    });
    cv.addEventListener('pointermove', function (e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var dx = e.clientX - ptr.x0, dy = e.clientY - ptr.y0;
      if (!ptr.kind && Math.hypot(dx, dy) > 10) {
        ptr.kind = G.scn === 'cafe' ? 'orbit' : 'joy';
        if (ptr.kind === 'joy' && G.loaded) { var j = $('joy'); j.hidden = false; j.style.left = ptr.lx + 'px'; j.style.top = ptr.ly + 'px'; hideDrag(); G.path = null; $('dest').hidden = true; G.goal = null; }
      }
      if (ptr.kind === 'joy') {
        var R = 52, m = Math.hypot(dx, dy), k = m > R ? R / m : 1, kx = dx * k, ky = dy * k;
        $('knob').style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
        G.stick = { x: kx / R, y: ky / R }; G.need = true;
      } else if (ptr.kind === 'orbit') { G.cafe.th = ptr.th0 - dx * 0.006; G.need = true; }
    });
    function end(e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var p = ptr; ptr = null;
      if (p.kind === 'joy') { G.stick = null; G.stickBasis = null; $('joy').hidden = true; $('knob').style.transform = ''; nearestStop(); updateUi(true); return; }
      if (!p.kind && e.type === 'pointerup' && performance.now() - p.t0 < 500) tap(p.lx, p.ly);
    }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    /* 키보드(데스크톱 확인용) · 화살표 = 걷기 */
    var keys = {};
    window.addEventListener('keydown', function (e) {
      if (G.sheetOpen) return;
      if (/^Arrow/.test(e.key)) { keys[e.key] = 1; G.stick = { x: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), y: (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0) }; G.need = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', function (e) { if (/^Arrow/.test(e.key)) { delete keys[e.key]; G.stick = Object.keys(keys).length ? { x: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), y: (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0) } : null; if (!G.stick) { G.stickBasis = null; nearestStop(); updateUi(true); } } });
  }
  function isShown(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
  function tap(x, y) {
    if (!G.loaded) return;
    var cv = $('cv'), W = cv.clientWidth, H = cv.clientHeight;
    ray.setFromCamera(new T.Vector2(x / W * 2 - 1, -(y / H) * 2 + 1), camera);
    if (G.scn === 'cafe') return;
    var hits = ray.intersectObject(S.lobby, true);
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i], o = h.object; if (!isShown(o) || o === shadow) continue;
      var mat = o.material; if (mat && mat.transparent && mat.opacity < 0.3) continue;   /* 유리 · 바닥 강조 */
      var pn = planOf(h.point);
      /* 비워진 기둥은 지나친다 */
      var pi = PIL.findIndex(function (q) { return Math.abs(q[0] - pn[0]) < 0.8 && Math.abs(q[1] - pn[1]) < 0.8; });
      if (pi >= 0 && G.fade[pi] < 0.5) continue;
      var u = o.userData || {};
      if (u.pg || u.zone) {
        var z = D.Z(u.zone) || D.zoneOfPg(u.pg);
        if (z && z.id !== 'cafe') { openSheet(z, u.pg ? D.zonePages(z).indexOf(u.pg) : null); return; }
      }
      if (h.point.y < 0.2) { walkTo(pn[0], pn[1], x, y); return; }
      return;
    }
  }
  function walkTo(x, z, sx, sy) {
    var q = nearestFree(x, z); if (!q) { toast('거기는 갈 수 없어요'); return; }
    var p = planOf(G.pos), path = findPath(p[0], p[1], q[0], q[1]);
    if (!path) { toast('거기는 갈 수 없어요'); return; }
    hideDrag(); G.goal = null; startWalk(path, null);
    var d = $('dest'); d.hidden = false; G.destAt = toThree(q[0], q[1]);
  }

  /* ═══════════ 그리기 ═══════════ */
  function resize() {
    var r = $('stage').getBoundingClientRect(), W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false); camera.aspect = W / H;
    camera.fov = W / H < 0.75 ? 62 : 52; camera.updateProjectionMatrix(); S.resize(); G.need = true;
  }
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, G.last ? (now - G.last) / 1000 : 0.016); G.last = now;
    if (!G.ok || G.sheetOpen || G.mapMode) return;
    var busy = false, w0 = performance.now();
    if (G.loaded && G.scn === 'lobby') { busy = stepBot(dt, now) || G.mode === 'auto' || !!G.stick; busy = stepCam(dt) || busy; if (busy) updateUi(false); }
    else if (G.scn === 'cafe') cafeCam();
    else if (!G.loaded) { camera.position.set(28 - 16, 22, 6 - (-14)); camera.lookAt(0, 0, 0.5); }
    if (G.bench) { G.yaw += dt * 0.6; busy = true; }
    if (!busy && !G.need && !G.showFps) return;
    G.need = false;
    S.frame(camera, G.scn); renderer.render(scene, camera); placePins();
    var wm = performance.now() - w0; G.workMs = G.workMs == null ? wm : G.workMs * 0.95 + wm * 0.05; G.workMax = Math.max(G.workMax || 0, wm);
    if (!$('dest').hidden && G.destAt) { _p.copy(G.destAt).project(camera); $('dest').style.left = ((_p.x + 1) / 2 * $('stage').clientWidth).toFixed(1) + 'px'; $('dest').style.top = ((1 - _p.y) / 2 * $('stage').clientHeight).toFixed(1) + 'px'; }
    G.frames.push(now); while (G.frames.length && now - G.frames[0] > 1000) G.frames.shift();
    if (G.showFps) { $('fps').hidden = false; $('fps').textContent = 'fps ' + G.frames.length + ' · ' + renderer.info.render.calls + ' draw · dpr ' + renderer.getPixelRatio(); }
    if (G.bench) { G.bench.ts.push(now); if (now - G.bench.t0 > G.bench.ms) { var b = G.bench; G.bench = null; b.done(summ(b.ts)); } }
    if (G.loaded && !G.probed) { G.probe.push(now); if (G.probe.length >= 50) { G.probed = true; var s = summ(G.probe); G.probeResult = s; if (s.p50 > 34) { renderer.setPixelRatio(1); S.lowPower(); resize(); } } }
  }
  function summ(ts) { var d = []; for (var i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]); d.sort(function (a, b) { return a - b; }); var sum = d.reduce(function (a, b) { return a + b; }, 0); return { frames: d.length, fps: +(1000 * d.length / Math.max(1, sum)).toFixed(1), p50: +(d[Math.floor(d.length * 0.5)] || 0).toFixed(1), p95: +(d[Math.floor(d.length * 0.95)] || 0).toFixed(1), dpr: renderer.getPixelRatio() }; }
  G.benchRun = function (ms) { return new Promise(function (res) { G.bench = { t0: performance.now(), ms: ms || 4000, ts: [], done: res }; }); };

  /* ═══════════ 구역 판 보기 시트 · 좌우로 넘기기 ═══════════ */
  var SH = null;
  function cropSrc(p) { return BASE + 'd/c/p' + (p < 10 ? '0' : '') + p + '.webp'; }
  function cropBgPx(p, w) {
    var a = D.ATLAS.at[p]; if (!a) return '';
    var Sz = D.ATLAS.size[a[0]], c = D.cropOf(p), cw = a[3] - 4, ch = a[4] - 4, k = w / (cw * (c[2] - c[0]));
    return 'background-image:url(' + BASE + D.ATLAS.files[a[0]] + ');background-size:' + (Sz * k).toFixed(1) + 'px ' + (Sz * k).toFixed(1) + 'px;background-position:' + (-(a[1] + 2 + c[0] * cw) * k).toFixed(1) + 'px ' + (-(a[2] + 2 + c[1] * ch) * k).toFixed(1) + 'px;background-repeat:no-repeat';
  }
  function openSheet(z, i) {
    var ps = D.zonePages(z); if (!ps.length) return;
    if (i == null) i = ps.length > 1 && D.SIGNS.indexOf(ps[0]) >= 0 ? 1 : 0;   /* 큰 버튼으로 열면 간판 다음 판부터(간판은 왼쪽으로 넘기면 있다) */
    SH = { z: z, ps: ps, i: clamp(i, 0, ps.length - 1), zoom: false };
    $('shSign').textContent = z.name; $('shSign').className = 'sg';
    $('shTitle').textContent = '';
    var sheet = $('sheet'); sheet.hidden = false; G.sheetOpen = true;
    var W = $('trackWrap').clientWidth || window.innerWidth, iw = W - 24;
    $('track').innerHTML = ps.map(function (p, k) {
      var s = D.cropSize(p), h = iw * s[1] / s[0];
      return '<article class="card" data-i="' + k + '" aria-label="' + esc(D.PG[p]) + '"><h2>' + esc(D.PG[p]) + '</h2>' +
        '<div class="pic" style="height:' + h.toFixed(1) + 'px;' + cropBgPx(p, iw) + '"><img alt="' + esc(D.PG[p]) + '" data-src="' + cropSrc(p) + '"></div></article>';
    }).join('');
    Array.prototype.forEach.call($('track').querySelectorAll('.card'), wireCard);
    setPage(SH.i, true);
  }
  function loadImg(k) {
    var c = $('track').children[k]; if (!c) return; var im = c.querySelector('img'); if (!im || im.src) return;
    im.onload = function () { im.classList.add('on'); }; im.src = im.getAttribute('data-src');
  }
  function setPage(k, inst) {
    if (!SH) return;
    if (SH.zoom) setZoom(false);
    SH.i = clamp(k, 0, SH.ps.length - 1);
    var tr = $('track'); tr.style.transition = inst || RM ? 'none' : 'transform .3s cubic-bezier(.2,.8,.2,1)'; tr.style.transform = 'translateX(' + (-SH.i * 100) + '%)';
    $('shCount').textContent = (SH.i + 1) + ' / ' + SH.ps.length;
    $('pPrev').disabled = SH.i <= 0; $('pNext').disabled = SH.i >= SH.ps.length - 1;
    [SH.i, SH.i + 1, SH.i - 1].forEach(loadImg);
  }
  function closeSheet() { $('sheet').hidden = true; G.sheetOpen = false; SH = null; G.need = true; G.last = 0; }
  function setZoom(on) {
    if (!SH) return; var c = $('track').children[SH.i]; if (!c) return;
    var pic = c.querySelector('.pic'), W = c.clientWidth - 24, s = D.cropSize(SH.ps[SH.i]);
    SH.zoom = on; c.classList.toggle('zoom', on); $('pZoom').textContent = on ? '원래대로' : '크게';
    var w = on ? W * 2.2 : W; pic.style.height = (w * s[1] / s[0]).toFixed(1) + 'px';
    pic.style.cssText = pic.style.cssText.replace(/background-[a-z-]+:[^;]*;?/g, '') ; pic.setAttribute('style', 'height:' + (w * s[1] / s[0]).toFixed(1) + 'px;' + cropBgPx(SH.ps[SH.i], w));
    if (on) { c.scrollLeft = (w - W) / 2; }
  }
  function wireCard(c) {
    /* 두 손가락 확대(있으면 좋음 · 필수 아님) · 그림 폭을 바꾼다 */
    var pin = null, lastTap = 0;
    c.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { e.preventDefault(); var a = e.touches[0], b = e.touches[1]; pin = { d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, w0: c.querySelector('.pic').clientWidth }; }
    }, { passive: false });
    c.addEventListener('touchmove', function (e) {
      if (!pin || e.touches.length !== 2) return; e.preventDefault();
      var a = e.touches[0], b = e.touches[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), W = c.clientWidth - 24, w = clamp(pin.w0 * d / pin.d0, W, W * 4), p = SH.ps[SH.i], s = D.cropSize(p);
      c.classList.toggle('zoom', w > W + 4); SH.zoom = w > W + 4; $('pZoom').textContent = SH.zoom ? '원래대로' : '크게';
      var pic = c.querySelector('.pic'); pic.style.width = w + 'px'; pic.setAttribute('style', 'width:' + w.toFixed(1) + 'px;height:' + (w * s[1] / s[0]).toFixed(1) + 'px;' + cropBgPx(p, w));
    }, { passive: false });
    c.addEventListener('touchend', function (e) { if (e.touches.length < 2) pin = null; });
    c.addEventListener('dblclick', function () { setZoom(!SH.zoom); });
  }
  function wireSheet() {
    $('shClose').onclick = closeSheet;
    $('pPrev').onclick = function () { setPage(SH.i - 1); };
    $('pNext').onclick = function () { setPage(SH.i + 1); };
    $('pZoom').onclick = function () { setZoom(!SH.zoom); };
    var wrap = $('trackWrap'), sw = null;
    wrap.addEventListener('pointerdown', function (e) { if (!SH || SH.zoom || (e.pointerType === 'mouse' && e.button)) return; sw = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), on: false }; });
    wrap.addEventListener('pointermove', function (e) {
      if (!sw || e.pointerId !== sw.id) return;
      var dx = e.clientX - sw.x0, dy = e.clientY - sw.y0;
      if (!sw.on) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { sw.on = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) {} } else if (Math.abs(dy) > 12) { sw = null; return; } else return; }
      var W = wrap.clientWidth, edge = (SH.i === 0 && dx > 0) || (SH.i === SH.ps.length - 1 && dx < 0) ? 0.3 : 1;
      var tr = $('track'); tr.style.transition = 'none'; tr.style.transform = 'translateX(' + (-SH.i * W + dx * edge) + 'px)';
    });
    function swEnd(e) {
      if (!sw || e.pointerId !== sw.id) return; var s = sw; sw = null; if (!s.on) return;
      var dx = e.clientX - s.x0, W = wrap.clientWidth, v = Math.abs(dx) / Math.max(1, performance.now() - s.t0);
      if (e.type === 'pointerup' && (Math.abs(dx) > W * 0.2 || v > 0.5)) setPage(SH.i + (dx < 0 ? 1 : -1)); else setPage(SH.i);
    }
    wrap.addEventListener('pointerup', swEnd); wrap.addEventListener('pointercancel', swEnd);
    window.addEventListener('keydown', function (e) {
      if (!G.sheetOpen) { if (e.key === 'Escape') { if (!$('list').hidden) $('list').hidden = true; } return; }
      if (e.key === 'ArrowRight') setPage(SH.i + 1); else if (e.key === 'ArrowLeft') setPage(SH.i - 1); else if (e.key === 'Escape') closeSheet();
    });
  }

  /* ═══════════ 구역 목록 · 평면 지도 ═══════════ */
  function zoneRect(z) {
    var xs = [], zs = [];
    z.rows.forEach(function (r) { var n = r.pages.length; [0, n].forEach(function (k) { var x = r.a[0] + r.r[0] * k, zz = r.a[1] + r.r[1] * k; xs.push(x, x + r.n[0] * 1.8); zs.push(zz, zz + r.n[1] * 1.8); }); });
    return [Math.min.apply(0, xs), Math.max.apply(0, xs), Math.min.apply(0, zs), Math.max.apply(0, zs)];
  }
  function mapSvg(me) {
    var B = D.BLD, s = 10, O = B.outside, xMax = Math.max(B.outline[1][0], O.x1) + 1.5, top = Math.max(B.top, O.z1 + 1), Y = function (z) { return (top - z) * s; }, X = function (x) { return x * s; }, LW = B.outline[1][0], CN = B.coreN, LN = B.lobbyN;
    var o = '<svg class="plan" viewBox="-8 -8 ' + Math.round(xMax * s + 16) + ' ' + Math.round((top + 2.3) * s) + '" role="group" aria-label="1층 평면 지도. 위가 북쪽, 아래가 정문">';
    o += '<polygon points="' + B.outline.map(function (q) { return X(q[0]) + ',' + Y(q[1]); }).join(' ') + '" fill="#FFFFFF" stroke="#CBD0D6" stroke-width="1.5"/>';
    o += '<rect x="' + X(O.x0) + '" y="' + Y(O.z1) + '" width="' + (O.x1 - O.x0) * s + '" height="' + (O.z1 - O.z0) * s + '" rx="3" fill="#EEF0F2"/><text class="lab" x="' + X((O.x0 + O.x1) / 2) + '" y="' + (Y(O.z1) - 3) + '" text-anchor="middle">건물 밖</text>';
    B.cores.forEach(function (c) { o += '<rect x="' + X(c[0]) + '" y="' + Y(CN) + '" width="' + (c[1] - c[0]) * s + '" height="' + (CN - LN) * s + '" fill="#E5E8EB"/>'; });
    B.cols.forEach(function (x) { o += '<rect x="' + (X(x) - 4.5) + '" y="' + (Y(B.colZ) - 4.5) + '" width="9" height="9" fill="#C9CED4"/>'; });
    o += '<text class="lab" x="' + X(B.revolve) + '" y="' + (Y(0) + 11) + '" text-anchor="middle" style="font-weight:700;fill:#4E5968">정문</text>';
    o += '<text class="lab" x="' + (X(LW) + 2) + '" y="' + (Y((B.doorE[0] + B.doorE[1]) / 2) + 2) + '">동쪽 문</text>';
    var ci = D.PROPS.checkin.at; o += '<rect x="' + (X(ci[0]) - 15) + '" y="' + (Y(ci[1]) - 15) + '" width="30" height="30" rx="3" fill="#FFFFFF" stroke="#CBD0D6"/><text class="lab" x="' + X(ci[0]) + '" y="' + (Y(ci[1]) + 2.5) + '" text-anchor="middle">체크인</text>';
    D.ZONES.forEach(function (z) {
      if (!z.rows.length) return;
      var b = zoneRect(z), lw = z.name.length * 6.2 + 10, tx = X((b[0] + b[1]) / 2), ty = Y((b[2] + b[3]) / 2), vert = (b[3] - b[2]) > (b[1] - b[0]) * 1.6;
      var lx = vert ? (b[0] > 16 ? X(b[0]) - lw / 2 - 3 : X(b[1]) + lw / 2 + 2) : tx;
      o += '<g class="zone" data-z="' + z.id + '" role="button" tabindex="0" aria-label="' + esc(z.name) + '">';
      o += '<rect class="f" x="' + X(b[0]) + '" y="' + Y(b[3]) + '" width="' + (b[1] - b[0]) * s + '" height="' + (b[3] - b[2]) * s + '" rx="3"/>';
      z.rows.forEach(function (r) { var n = r.pages.length; o += '<line x1="' + X(r.a[0]) + '" y1="' + Y(r.a[1]) + '" x2="' + X(r.a[0] + r.r[0] * n) + '" y2="' + Y(r.a[1] + r.r[1] * n) + '" stroke="#FF7F32" stroke-width="3"/>'; });
      o += '<rect x="' + (lx - lw / 2) + '" y="' + (ty - 7) + '" width="' + lw + '" height="14" rx="2" fill="#FF7F32"/><text x="' + lx + '" y="' + (ty + 3) + '" text-anchor="middle">' + esc(z.name) + '</text></g>';
    });
    if (me) o += '<circle class="me" cx="' + X(me[0]) + '" cy="' + Y(me[1]) + '" r="6"/><circle cx="' + X(me[0]) + '" cy="' + Y(me[1]) + '" r="3" fill="#FF7F32"/>';
    return o + '</svg>';
  }
  function listHtml(withMap) {
    var me = G.loaded ? planOf(G.pos) : null;
    return (withMap ? '<div class="mapcard">' + mapSvg(me) + '<p>' + (me ? '까만 점이 지금 캐릭터 자리예요' : '구역을 누르면 판을 볼 수 있어요') + '</p></div>' : '') +
      STOPS.filter(function (s) { return s.zone; }).map(function (s) {
        var z = s.z0, n = z ? D.zonePages(z).length : 0;
        return '<button type="button" class="zi" data-s="' + s.id + '"><span class="sg' + (z && z.ghost ? ' ghost' : '') + '">' + esc(z.id === 'cafe' ? '18F' : z.name) + '</span><span class="t"><b>' + esc(s.name) + '</b><span>' + esc(z.id === 'cafe' ? '게이트 · 엘리베이터로 올라가요' : (z.where || '') ) + '</span></span><span class="go">' + (G.ok && !G.mapMode ? '가기' : (n ? '판 ' + n + '장' : '보기')) + '</span></button>';
      }).join('');
  }
  function openList() {
    var b = $('lbody'); b.innerHTML = listHtml(true); $('list').hidden = false;
    Array.prototype.forEach.call(b.querySelectorAll('.zi'), function (el) { el.onclick = function () { $('list').hidden = true; pickStop(el.getAttribute('data-s')); }; });
    Array.prototype.forEach.call(b.querySelectorAll('[data-z]'), function (el) { el.onclick = function () { $('list').hidden = true; pickStop(el.getAttribute('data-z')); }; });
  }
  function pickStop(id) {
    var k = STOPS.findIndex(function (s) { return s.id === id || s.zone === id; }); if (k < 0) return;
    var s = STOPS[k];
    if (G.mapMode || !G.ok) { if (s.zone === 'cafe') { toast('18F 커피챗은 아이디어 한 줄을 낸 뒤 신청해요'); return; } openSheet(s.z0); return; }
    goStop(k);
  }
  function toMap(msg) {
    G.mapMode = true; var m = $('map'); m.hidden = false; $('cv').style.visibility = 'hidden'; $('load').hidden = true; $('bar').hidden = true; $('drag').hidden = true; $('cta').hidden = true; $('pins').innerHTML = '';
    m.innerHTML = listHtml(true);
    Array.prototype.forEach.call(m.querySelectorAll('.zi, [data-z]'), function (el) { el.onclick = function () { pickStop(el.getAttribute('data-s') || el.getAttribute('data-z')); }; });
    if (msg) toast(msg);
  }

  /* ═══════════ 처음 안내(한 문장 · 한 번) ═══════════ */
  function maybeHelp() { if (Q.get('nohelp') === '1') return; if (!store.get('axTourLabHelp1')) showHelp(); }
  function showHelp() { $('help').hidden = false; }
  function hideHelp() { $('help').hidden = true; store.set('axTourLabHelp1', '1'); }

  /* ═══════════ 시작 ═══════════ */
  function start() {
    $('bNext').onclick = onNext; $('bPrev').onclick = onPrev; $('bBack1F').onclick = function () { backTo1F(); placeAt(STOPS.length - 1, false); };
    $('cta').onclick = function () { var z = G.near; if (!z) return; if (z.id === 'cafe') { toCafe(); return; } openSheet(z); };
    $('bList').onclick = openList; $('lClose').onclick = function () { $('list').hidden = true; };
    $('bHelp').onclick = showHelp; $('hOk').onclick = hideHelp; $('help').addEventListener('click', function (e) { if (e.target === $('help')) hideHelp(); });
    wireSheet();
    G.showFps = Q.get('fps') === '1';
    G.t0 = performance.now();
    var noGL = Q.get('map') === '1' || !window.TourScene || !T;
    if (noGL || !init3D()) { toMap(noGL ? '' : '이 기기는 3D를 그릴 수 없어 평면 지도로 보여요'); maybeHelpMap(); return; }
    wireStage(); resize(); window.addEventListener('resize', resize);
    updateUi(true);
    load();
    requestAnimationFrame(loop);
  }
  function maybeHelpMap() {}
  /* 시험 · 녹화용 손잡이(앱에는 없음) */
  G.api = { pose: function (x, z, yaw, h) { G.pos.copy(toThree(x, z)); G.mode = 'free'; G.path = null; G.yaw = yaw; G.h = h == null ? yaw + Math.PI : h; G.yo = 0; G.need = true; }, goStop: goStop, openSheet: function (zid, i) { openSheet(D.Z(zid), i || 0); }, closeSheet: closeSheet, setPage: function (k) { setPage(k); }, tap: tap, walkTo: walkTo, plan: function () { return planOf(G.pos); }, cam: function () { return planOf(camera.position).concat([camera.position.y]); }, toCafe: toCafe, back: backTo1F, free: free, hw: function (x, z) { var c = gi(x, z); return c < 0 ? -1 : hw[c] * 0.05; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
