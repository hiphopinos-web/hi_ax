/* 1층 둘러보기 v3 시제품(261003) · 캐릭터로 걷기 · v3.1(실폰 피드백 261003): 왼쪽 아래 고정 패드 + 위에서 40도 고정 시점(회전 없음)
 * 사용자 피드백(261003): 「기둥 뒤로 가면 회색 화면이 당황스럽다 · 어떻게 앞으로 가는지 어렵다 · 자세히 보는 법을 모르겠다」
 *   + 「50대 수석님도 바로 이해할 만큼 쉬움이 최우선 · 조이스틱만으로는 부족」
 * 조작 세 가지(쉬운 순서)
 *   1. 아래 큰 버튼 「이전 구역 · 다음 구역」 → 캐릭터가 알아서 그 구역 앞까지 걸어가고 「판 크게 보기」가 떠오른다(이것만으로 끝까지 볼 수 있다)
 *   2. 화면을 끌면 그 자리에 조이스틱이 생겨 직접 걷는다(카메라 기준 전후좌우)
 *   3. 바닥을 톡 누르면 그 자리까지 걸어간다 · 판을 누르면 그 판부터 크게 본다
 * 가림: 카메라는 늘 천장(5m) 위에서 40도로 내려다본다(모형이 카메라 쪽 벽 · 천장을 숨김) · 기둥(과 기둥 포스터)은 시선을 가리면 점점이 비워진다(디더링).
 * 충돌: lobby.glb 를 받은 뒤 삼각형을 0.1m 칸에 찍어 만든 높이 지도(모형을 다시 굽지 않는다 · 모형이 바뀌면 저절로 따라온다).
 * 판 보기: 구역 시트 · 판을 좌우로 넘기는 카드 · 그림 = ../assets/tour/d/c/pNN.webp(위아래 여백을 자른 판 · tour-data CROP)
 * 3D 를 못 그리면 평면 지도 + 구역 목록(시트는 같다). */
(function () {
  'use strict';
  var T = window.THREE, D = window.TOUR_DATA, BASE = '../assets/tour/', LABVER = 'v535a';
  var Q = new URLSearchParams(location.search);
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);   /* 기본 = 기기 설정 · 처음 안내 · 도움말의 「움직임 줄이기」로 바꾸면 이 기기에 기억(아래 start) */
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
    { id: 'start', name: '동쪽 문', x: 27.3, z: 8.9, look: [20, 7.8], where: '동쪽 문 안' },   /* 어느 구역 판 줄에서도 4.2m 밖(입장하자마자 판 보기가 뜨던 버그 · 사용자 261003) */
    { id: 'vision', zone: 'vision', x: 29.0, z: 3.6 },
    { id: 'lab', zone: 'lab', x: 27.9, z: 3.25 },
    { id: 'action', zone: 'action', x: 22.3, z: 3.25 },
    { id: 'play', zone: 'play', x: 9.6, z: 3.0, look: [8.6, 0.55] },
    /* EVENT = 세 자리(사용자 261003) · 타자왕(홍보 영상) · 포토부스(판 보기 · 챗봇 없음) · 룰렛(호객만 · 판 보기 없음) */
    { id: 'typing', zone: 'event', spot: 'typing', name: 'AX 타자왕', x: 3.3, z: 2.5, look: [0.55, 2.47], say: '타자왕 1~3위 경품 · 17:00 마감', go: '' },
    { id: 'event', zone: 'event', name: '포토부스', x: 3.5, z: 6.9, look: [0.55, 7.35], noGuide: true },
    { id: 'roulette', zone: 'event', spot: 'roulette', name: '룰렛 이벤트', x: 3.4, z: 10.1, look: [0.55, 10.15], say: '스탬프 3개면 룰렛을 돌려요', go: '', hand: true },
    { id: 'lounge', zone: 'lounge', x: 8.7, z: 8.3 }
  ];
  /* 18F 커피챗 · 체크인 존은 시험판에서 뺀다(사용자 261003) · 코드는 SHOW_CAFE 로 보존 */
  var SHOW_CAFE = false;
  if (SHOW_CAFE) STOPS.push({ id: 'cafe', zone: 'cafe', x: 18.4, z: 9.5, look: [18.4, 13], where: '게이트 · 엘리베이터 앞' });
  function zoneCenter(z) {
    if (!z || !z.rows.length) return null;
    var sx = 0, sz = 0, n = 0;
    z.rows.forEach(function (r) { var k = r.pages.length; sx += (r.a[0] + r.r[0] * k / 2) * k; sz += (r.a[1] + r.r[1] * k / 2) * k; n += k; });
    return [sx / n, sz / n];
  }
  STOPS.forEach(function (s) {
    var z = s.zone ? D.Z(s.zone) : null; s.z0 = z;
    if (!s.look) s.look = zoneCenter(z);
    if (z && !s.name) s.name = z.id === 'cafe' ? '18F 커피챗' : z.name;
  });

  /* ─────────── 상태 ─────────── */
  var G = {
    ok: false, loaded: false, scn: 'lobby', need: true, last: 0, frames: [], probe: [], probed: false,
    pos: new T.Vector3(), h: 0, yaw: 0, Lcur: 4.6, H: 2.7, look: new T.Vector3(), camPos: new T.Vector3(),
    mode: 'stop', stop: 0, dist: 4.8, az: 0, azTo: 0, clock: 0, path: null, pathI: 0, speed: 0, walkT: 0, moveV: 0,
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
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); noGl('3D 화면이 끊겼어요 · 새로 고침해 주세요'); });
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
    botParts.waves = [0, 1, 2].map(function () { var sp = new T.Sprite(new T.SpriteMaterial({ map: arcTex(), transparent: true, depthWrite: false, opacity: 0 })); sp.position.y = 1.0; sp.scale.set(0.3, 0.3, 1); body.add(sp); return sp; });
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
    S.load(BASE + 'lobby.glb?v=' + LABVER, function (k) { $('load').textContent = '모형 불러오는 중 ' + Math.round(k * 100) + '%'; var bt = $('blackT'); if (!bt.classList.contains('on')) bt.textContent = '불러오는 중 ' + Math.round(k * 100) + '%'; }, function () {
      buildGrid(S.lobby); patchPillars(S.lobby);
      var st = STOPS[0], f = nearestFree(st.x, st.z); flood(f[0], f[1]);
      STOPS.forEach(function (s) { var q = nearestFree(s.x, s.z); if (q) { s.x = q[0]; s.z = q[1]; } });
      buildGuides(); hideCheckin(); buildTypingTv(); G.ceil = S.lobby.getObjectByName('ceiling');
      G.loaded = true; $('load').hidden = true;
      placeAt(0, true);
      buildPins(); buildMini(); buildMags();
      try { renderer.compile(scene, camera); } catch (e) {}
      G.need = true; G.loadMs = Math.round(performance.now() - G.t0);
      entrance();
    }, function () { noGl('모형을 받지 못했어요 · 새로 고침해 주세요'); });
  }

  /* ═══════════ 이동 ═══════════ */
  function toThree(x, z) { return new T.Vector3(x - 16, 0, 6 - z); }
  function planOf(v) { return [v.x + 16, 6 - v.z]; }
  function faceTo(look, x, z) { var a = toThree(look[0], look[1]), b = toThree(x, z); return Math.atan2(a.x - b.x, a.z - b.z); }
  function faceAz(s) { var fx = s.look[0] - s.x, fz = s.look[1] - s.z, a = Math.atan2(fx, -fz); return Math.round(a / (Math.PI / 2)) * (Math.PI / 2); }
  /* 시점 버튼 = 누르는 동안 연속(사용자 261003 「이동 버튼처럼 양을 정하게」) · 회전 초당 60도(처음 0.2초 가속 · 떼면 부드럽게 멈춤) · 톡 = 15도
   * 확대 · 축소도 같은 방식(초당 2.4m · 톡 = 0.5m · 3.8~8m) · 움직임 줄이기 = 회전 초당 35도 · 가속 없음 */
  var DMIN = 3.8, DMAX = 8.0, HOLD = null;
  function setDist(d) { G.dist = clamp(d, DMIN, DMAX); G.need = true; $('zIn').disabled = G.dist <= DMIN + 0.01; $('zOut').disabled = G.dist >= DMAX - 0.01; }
  function holdStart(kind, dir) { if (G.anim || !G.loaded) return; HOLD = { kind: kind, dir: dir, t0: performance.now(), amt: 0 }; G.need = true; }
  function holdEnd() {
    if (!HOLD) return; var h = HOLD; HOLD = null;
    if (h.kind === 'rot') { var min = 15 * Math.PI / 180; if (h.amt < min) G.azTo += h.dir * (min - h.amt); }
    else if (h.amt < 0.5) setDist(G.dist + h.dir * (0.5 - h.amt));
    G.need = true;
  }
  function stepHold(dt) {
    if (!HOLD) return false;
    var t = (performance.now() - HOLD.t0) / 1000, ramp = RM ? 1 : clamp(t / 0.2, 0.25, 1);
    if (HOLD.kind === 'rot') { var da = (RM ? 35 : 60) * Math.PI / 180 * ramp * dt; G.azTo += HOLD.dir * da; HOLD.amt += da; }
    else { var dd = 2.4 * ramp * dt, before = G.dist; setDist(G.dist + HOLD.dir * dd); HOLD.amt += Math.abs(G.dist - before); }
    return true;
  }
  function placeAt(k, snap) {
    var s = STOPS[k]; G.pos.copy(toThree(s.x, s.z)); G.h = s.look ? faceTo(s.look, s.x, s.z) : G.h; G.stop = k; G.mode = 'stop'; G.path = null;
    if (snap) { if (s.look) G.az = G.azTo = faceAz(s); var c = camWant(); G.camPos.copy(c.pos); G.look.copy(c.look); }
    G.need = true; updateUi(true);
  }
  function goStop(k) {
    if (!G.loaded) return; G.moved = true;
    k = clamp(k, 0, STOPS.length - 1);
    if (G.scn === 'cafe') backTo1F();
    var s = STOPS[k], p = planOf(G.pos);
    var path = findPath(p[0], p[1], s.x, s.z);
    if (!path) { placeAt(k, false); return; }
    startWalk(path, k);
  }
  function startWalk(path, stopK) {
    G.moved = true;
    var p = planOf(G.pos), L = 0, prev = p; path.forEach(function (q) { L += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; });
    G.path = path; G.pathI = 0; G.goal = stopK; G.mode = 'auto'; G.speed = clamp(L / 3.6, 2.6, 6.5); G.need = true; $('dest').hidden = stopK != null;
    G.walkTo = path[path.length - 1];
    if (RM) { var q = path[path.length - 1]; G.pos.copy(toThree(q[0], q[1])); flash(); arrive(); return; }   /* 움직임 줄이기 = 걸어가지 않고 그 자리로(짧은 흰 화면) */
    updateUi(true);
  }
  function flash() { var f = $('fade'); f.style.transition = 'none'; f.style.opacity = 0.85; f.getBoundingClientRect(); f.style.transition = 'opacity .25s'; f.style.opacity = 0; setTimeout(function () { f.style.transition = ''; }, 300); }
  function arrive() {
    G.path = null; $('dest').hidden = true;
    if (G.goal != null) { var s = STOPS[G.goal]; G.stop = G.goal; G.mode = 'stop'; G.hTo = s.look ? faceTo(s.look, s.x, s.z) : null; if (s.look) { var za = faceAz(s); G.azTo = G.az + Math.atan2(Math.sin(za - G.az), Math.cos(za - G.az)); } }   /* 구역 앞에 닿으면 그 판 줄이 정면이 되는 방위로 돌아선다(90도 단위) */
    else { G.mode = 'free'; nearestStop(); }
    G.goal = null; updateUi(true);
  }
  function nearestStop() { var p = planOf(G.pos), best = 0, bd = 1e9; STOPS.forEach(function (s, i) { var d = Math.hypot(s.x - p[0], s.z - p[1]); if (d < bd) { bd = d; best = i; } }); G.stop = best; }

  /* 매 프레임 · 캐릭터 */
  var _v = new T.Vector3();
  function stepBot(dt, now) {
    var moving = 0;
    if (G.mode === 'auto' && G.path) {
      var p = planOf(G.pos), q = G.path[G.pathI], dx = q[0] - p[0], dz = q[1] - p[1], d = Math.hypot(dx, dz), step = G.speed * dt;
      if (d <= step) { G.pos.copy(toThree(q[0], q[1])); G.pathI++; if (G.pathI >= G.path.length) arrive(); }
      else { var nx = p[0] + dx / d * step, nz = p[1] + dz / d * step; G.pos.copy(toThree(nx, nz)); }
      if (d > 0.01) { var hT = Math.atan2(dx, -dz); G.h = angLerp(G.h, hT, 1 - Math.exp(-dt * 12)); }
      moving = Math.min(1, G.speed / 3);
    } else if (G.stick && (Math.abs(G.stick.x) + Math.abs(G.stick.y)) > 0.05) {
      /* 고정 패드 · 화면 기준 · 위 = 화면 위쪽으로 */
      /* 방향 기준은 끌기 시작할 때의 카메라로 고정한다(끄는 동안 카메라가 돌아도 같은 쪽으로 걷는다) */
      var fw = _v.set(Math.sin(G.az), 0, Math.cos(G.az));   /* 패드 위 = 화면 위쪽(시점을 돌려도 늘 화면 기준) */
      var rx = -fw.z, rz = fw.x, mx = rx * G.stick.x - fw.x * G.stick.y, mz = rz * G.stick.x - fw.z * G.stick.y, mag = Math.min(1, Math.hypot(mx, mz));
      if (mag > 0.01) {
        var sp = 3.2 * mag * dt, ux = mx / Math.hypot(mx, mz), uz = mz / Math.hypot(mx, mz), p0 = planOf(G.pos);
        var tx = p0[0] + ux * sp, tz = p0[1] - uz * sp;
        if (free(tx, tz)) G.pos.copy(toThree(tx, tz));
        else if (free(tx, p0[1])) G.pos.copy(toThree(tx, p0[1]));
        else if (free(p0[0], tz)) G.pos.copy(toThree(p0[0], tz));
        G.h = angLerp(G.h, Math.atan2(ux, uz), 1 - Math.exp(-dt * 10));
        moving = mag; G.mode = 'free';
      }
    } else if (G.hTo != null) { G.h = angLerp(G.h, G.hTo, 1 - Math.exp(-dt * 8)); if (Math.abs(Math.atan2(Math.sin(G.hTo - G.h), Math.cos(G.hTo - G.h))) < 0.01) G.hTo = null; }
    /* 모션 · 통통 + 기울임 + 발 */
    G.moveV += ((moving ? 1 : 0) - G.moveV) * (1 - Math.exp(-dt * 10));
    if (moving) G.walkT += dt * (7 + 5 * moving);
    var w = RM ? 0 : G.moveV, s = Math.sin(G.walkT);
    bot.position.copy(G.pos); bot.rotation.y = G.h;
    botParts.body.position.y = Math.abs(s) * 0.045 * w; botParts.body.rotation.z = s * 0.07 * w; botParts.body.rotation.x = 0.06 * w;
    botParts.feet[0].position.z = 0.04 + s * 0.09 * w; botParts.feet[1].position.z = 0.04 - s * 0.09 * w;
    return moving > 0.01 || w > 0.01 || G.hTo != null;
  }

  /* ═══════════ 카메라 · 위에서 40도 내려다보는 고정 시점(사용자 261003 실폰 「시선이 계속 바뀌는 것보다 스카이뷰 40도가 편하다」) ═══════════
   * 방위 고정 = 북쪽(코어 쪽) 위에서 남쪽(정문 · 유리벽 판 앞면)을 본다 · 회전 없음 · 캐릭터를 부드럽게 따라 옮겨 갈 뿐이다
   * 거리 2단계(멀리 11.5m · 가까이 8m · 두 손가락 벌리기 / 오므리기) · 카메라 높이는 늘 천장(5m) 위라 벽 속 · 회색 화면이 생기지 않는다
   *   (모형은 카메라 쪽 벽 · 천장을 스스로 숨긴다 · tour-scene cutaway) · 시선을 가리는 기둥(5m)만 점점이 비운다 */
  /* 거리 2단계 · 0 = 기본 6.5m(사용자 261003 「너무 멀다 · 확대한 것보다 조금 더」 · 카메라 높이 = 6.5 x sin40 + 0.9 = 5.08m 로 천장 5m 위) · 1 = 조금 멀리 9m */
  /* v3.4(사용자 261003 「두 단계 더 줌인」): 가장 가까이 3.8m · 기본 4.8m · 멀리 8m · 카메라가 천장(5m) 아래로 내려오므로 천장은 늘 숨긴다(아래 render 앞) · 기둥 속 시점은 기둥 비움으로 */
  var PITCH = 40 * Math.PI / 180;   /* 거리 G.dist = 3.8~8m(기본 4.8) · 확대 · 축소 버튼(누르는 동안) · 두 손가락이 연속으로 바꾼다 */
  function camWant() {
    /* 바라보는 점 = 캐릭터보다 남쪽(화면 위쪽)으로 조금 · 캐릭터는 화면 가운데 아래에 서고 앞의 판 줄이 더 넓게 보인다 */
    /* 방위 G.az · 0 = 북쪽 위에서 남쪽(정문)을 봄 · 「시점 돌리기」로 90도씩 · 화면 위 = (sin az, cos az) */
    var c = G.pos, d = G.dist, hd = d * Math.cos(PITCH), y = d * Math.sin(PITCH), ahead = 0.8 + (d - DMIN) / (DMAX - DMIN) * 0.7, fx = Math.sin(G.az), fz = Math.cos(G.az);
    return { pos: new T.Vector3(c.x + fx * (ahead - hd), y + 0.9, c.z + fz * (ahead - hd)), look: new T.Vector3(c.x + fx * ahead, 0.9, c.z + fz * ahead) };
  }
  function stepCam(dt) {
    var a0 = G.az; G.az = angLerp(G.az, G.azTo, dt && !RM ? 1 - Math.exp(-dt * (HOLD && HOLD.kind === 'rot' ? 14 : 7)) : 1); if (Math.abs(Math.atan2(Math.sin(G.azTo - G.az), Math.cos(G.azTo - G.az))) < 0.002) G.az = G.azTo;
    var w = camWant(), k = dt && !RM ? (G.az !== a0 ? 1 : 1 - Math.exp(-dt * 5)) : 1;
    var moved = G.camPos.distanceToSquared(w.pos) > 1e-6 || G.look.distanceToSquared(w.look) > 1e-6;
    G.camPos.lerp(w.pos, k); G.look.lerp(w.look, k);
    camera.position.copy(G.camPos); camera.lookAt(G.look);
    /* 기둥 비우기 · 카메라 → 머리 선분이 기둥(높이 5m) 안을 지나면 */
    var hx = G.pos.x, hz = G.pos.z, cx = G.camPos.x, cz = G.camPos.z, cy = G.camPos.y, sx = hx - cx, sz = hz - cz, L2 = sx * sx + sz * sz || 1, any = false;
    for (var i = 0; i < PIL.length; i++) {
      var px = PIL[i][0] - 16, pz = 6 - PIL[i][1], t = ((px - cx) * sx + (pz - cz) * sz) / L2, tt = clamp(t, 0, 1), d = Math.hypot(cx + sx * tt - px, cz + sz * tt - pz), ly = cy + (1.25 - cy) * tt;
      var cdp = Math.hypot(cx - px, cz - pz);
      G.fadeTo[i] = ((t > -0.05 && t < 1.02 && d < 0.95 && ly < 5.2) || cdp < 1.1) ? 0.16 : 1;
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
      box.appendChild(b); pinEls.push({ el: b, at: S.anchors[z.id], max: 40 });
    });
    (S.landmarks || []).forEach(function (l) {
      if (l.id === 'lm_check') return;   /* 체크인 존은 시험판에서 뺌 */
      var d = document.createElement('div'); d.className = 'pin lm'; d.innerHTML = '<span class="s">' + esc(l.label) + '</span>';
      box.appendChild(d); pinEls.push({ el: d, at: S.anchors[l.id], max: 20, lm: true });
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

  /* ═══════════ 안내 챗봇(구역마다 1명 · 사용자 261003) ═══════════
   * 몸 = 파랑(현대해상 공식 HI Navy #001F5B · 사용자 261003 「안내 챗봇 몸은 파란색」 · design.md 예외는 메인이 기록) · 띠 · 안테나 공 · 눈 = 흰색 · 왼쪽 가슴 작은 가로 명찰(주황 바탕 흰 「STAFF」 · 흔들림 없음) · 전파는 주황(파랑 몸 위 대비 · 내 캐릭터와 같은 행사 색)
   * 서는 자리 = 그 구역 멈춤 자리에서 판 쪽으로 0.7m · 오른쪽으로 1.1m(통로를 막지 않게) · 내가 가까이 오면 나를 향해 돌아서고 말풍선 한 줄(앱 1F 구역 한 줄 소개 + 「이에요」) */
  var guides = [];
  function staffTex() {   /* 가로 명찰 · 주황 바탕 + 흰 「STAFF」 */
    var c = document.createElement('canvas'); c.width = 192; c.height = 72; var g = c.getContext('2d');
    g.fillStyle = '#FF7F32'; g.fillRect(0, 0, 192, 72);
    g.fillStyle = '#FFFFFF'; g.font = '800 44px "Pretendard Variable", Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STAFF', 96, 38);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  var ARC = null;
  function arcTex() {
    if (ARC) return ARC;
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    g.strokeStyle = '#FF7F32'; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); g.arc(64, 84, 48, Math.PI * 1.22, Math.PI * 1.78); g.stroke();
    ARC = new T.CanvasTexture(c); ARC.colorSpace = T.SRGBColorSpace; return ARC;
  }
  var GUIDE_MAT = null;
  /* 스태프 챗봇 = 내 캐릭터와 같은 모양 · 같은 배색 규칙을 파랑 사다리로(사용자 261003 「바지는 짙은 파랑 · 몸통은 25% 파랑 · 내 캐릭터 색상 활용법과 같게」)
   * 내 캐릭터: 몸통 #FFC56E(옅은 단계) · 바지(아래 띠 · 바닥) · 안테나 공 #FF7F32(짙은 단계) · 발 #E5671E · 눈 #282320
   * 스태프: 몸통 GUIDE_BODY(아래) · 바지 · 안테나 공 = HI Navy #001F5B · 발 #00184A · 눈 #191F28(또렷하게) · 명찰은 SHOW_BADGE(기본 꺼짐 · 사용자 「이상하면 떼자」) */
  var GUIDE_BODY = (Q.get('gb') === 'tint') ? 0xBFC7D6 : 0x8DBBEB;   /* 기본 = 현대해상 공식 Blue 틴트 #8DBBEB(3D 에서 파랑으로 읽힘) · 비교용 ?gb=tint = HI Navy 25% 틴트 #BFC7D6 */
  var SHOW_BADGE = Q.get('badge') === '1';
  function makeGuide(hand) {
    if (!GUIDE_MAT) GUIDE_MAT = { head: new T.MeshLambertMaterial({ color: GUIDE_BODY, side: T.DoubleSide }), band: new T.MeshLambertMaterial({ color: 0x001F5B }), foot: new T.MeshLambertMaterial({ color: 0x00184A }), ink: new T.MeshBasicMaterial({ color: 0x191F28 }), card: new T.MeshBasicMaterial({ map: staffTex(), toneMapped: false }), edge: new T.MeshBasicMaterial({ color: 0xE5671E, toneMapped: false }) };
    var M = GUIDE_MAT, g = new T.Group(), body = new T.Group(); g.add(body);
    var pts = [new T.Vector2(0.335, 0.24)];
    for (var i = 0; i <= 14; i++) { var a = i / 14 * Math.PI / 2; pts.push(new T.Vector2(Math.max(0.0001, Math.cos(a) * 0.335), 0.43 + Math.sin(a) * 0.36)); }
    body.add(new T.Mesh(new T.LatheGeometry(pts, 32), M.head));
    var band = new T.Mesh(new T.CylinderGeometry(0.355, 0.33, 0.2, 32), M.band); band.position.y = 0.14; body.add(band);
    var b0 = new T.Mesh(new T.SphereGeometry(0.33, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.band); b0.scale.y = 0.25; b0.position.y = 0.04; body.add(b0);
    var st = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.13, 8), M.head); st.position.y = 0.85; body.add(st);
    var ball = new T.Mesh(new T.SphereGeometry(0.075, 16, 12), M.band); ball.position.y = 0.94; body.add(ball);
    [-1, 1].forEach(function (s) { var e = new T.Mesh(new T.SphereGeometry(0.046, 12, 10), M.ink); e.scale.set(1, 1.15, 0.45); e.position.set(s * 0.12, 0.55, 0.305); body.add(e); });
    [-1, 1].forEach(function (s) { var f = new T.Mesh(new T.SphereGeometry(0.085, 12, 8), M.foot); f.scale.set(1, 0.6, 1.35); f.position.set(s * 0.15, 0.035, 0.04); g.add(f); });
    if (SHOW_BADGE) { var badge = new T.Mesh(new T.BoxGeometry(0.15, 0.055, 0.012), [M.edge, M.edge, M.edge, M.edge, M.card, M.edge]); badge.position.set(0.14, 0.4, 0.315); badge.rotation.y = Math.atan2(0.14, 0.31); body.add(badge); }
    /* 머리 위 전파 · 「띠로 띠로」 · 위로 열린 원호 3겹이 차례로 퍼졌다 사라진다(스프라이트 · 늘 카메라를 봄) */
    var waves = [0, 1, 2].map(function () { var sp = new T.Sprite(new T.SpriteMaterial({ map: arcTex(), transparent: true, depthWrite: false, opacity: 0 })); sp.position.y = 1.1; sp.scale.set(0.3, 0.3, 1); body.add(sp); return sp; });
    /* 룰렛 자리 챗봇만 · 손(작은 공)을 들어 흔든다(호객) */
    var arm = null;
    if (hand) { arm = new T.Group(); arm.position.set(-0.3, 0.42, 0.05); var hd = new T.Mesh(new T.SphereGeometry(0.075, 12, 10), M.band); hd.position.set(-0.12, 0.2, 0); var lim = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.22, 8), M.head); lim.position.set(-0.06, 0.1, 0); lim.rotation.z = 0.5; arm.add(lim); arm.add(hd); body.add(arm); }
    g.userData = { body: body, waves: waves, ph: Math.random(), arm: arm };
    g.scale.setScalar(0.95);
    return g;
  }
  function buildGuides() {
    STOPS.forEach(function (s, k) {
      if (!s.zone || s.zone === 'cafe' || !s.look || s.noGuide) return;
      var fx = s.look[0] - s.x, fz = s.look[1] - s.z, fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      var rx = fz, rz = -fx;   /* 판을 보는 사람의 오른쪽(도면 좌표 · z 북쪽) */
      var gx = s.x + rx * 1.1 + fx * 0.7, gz = s.z + rz * 1.1 + fz * 0.7, q = nearestFree(gx, gz) || [gx, gz];
      var m = makeGuide(!!s.hand); m.position.copy(toThree(q[0], q[1]));
      var h0 = Math.atan2(-fx, fz);   /* 평소 = 통로(판 반대쪽)를 본다 · three 방향 = (sin h, cos h), 도면 z 북쪽 = three -z */
      m.rotation.y = h0; S.lobby.add(m);
      /* 걸음 막기 · 반지름 0.62m(캐릭터 여유 포함) */
      for (var dz = -7; dz <= 7; dz++) for (var dx = -7; dx <= 7; dx++) if (dx * dx + dz * dz <= 40) { var c = gi(q[0] + dx * GS, q[1] + dz * GS); if (c >= 0) wd[c] = 1; }
      guides.push({ m: m, stop: k, id: s.id, zone: s.zone, spot: s.spot || '', at: [q[0], q[1]], h: h0, h0: h0, text: s.say || ZT[s.zone] || '', go: s.go == null ? '판 보기 ▶' : s.go });
    });
  }
  var ZT = { vision: '회사가 가는 방향을 보는 곳이에요', lab: 'DAP 과제를 보는 곳이에요', action: 'AI 업무 사례를 보는 곳이에요', play: 'AI를 직접 써 보는 곳이에요', event: '사진 · 룰렛 · 타자왕이 있는 곳이에요', lounge: '업무 고민을 상담하는 곳이에요' };   /* 말풍선은 한 줄(360px 에서도) · 16자 안팎 */   /* 앱 FLOOR1 kor 한 줄 + 「이에요」 */
  function stepGuides(dt) {
    var p = planOf(G.pos), busy = false, talk = null, bestD = 1e9, nearestG = guides.reduce(function (m, g) { return Math.min(m, Math.hypot(p[0] - g.at[0], p[1] - g.at[1])); }, 1e9);
    guides.forEach(function (gd) {
      var d = Math.hypot(p[0] - gd.at[0], p[1] - gd.at[1]), near = G.moved && G.mode !== 'auto' && d < 3.0 && d <= nearestG + 0.01;   /* 가장 가까운 챗봇 하나만 · 3m 안 */
      var f = clamp((6 - d) / 3.0, 0, 1);   /* 신호 세기 · 6m 밖 0 → 말풍선 거리(3m) 안 1 · 내 캐릭터 전파와 같은 곡선 */
      if (d < bestD) bestD = d;
      var hT = near ? Math.atan2(p[0] - gd.at[0], -(p[1] - gd.at[1])) : gd.h0;
      var dh = Math.atan2(Math.sin(hT - gd.h), Math.cos(hT - gd.h));
      if (Math.abs(dh) > 0.003) { gd.h += dh * (1 - Math.exp(-dt * 6)); busy = true; }
      gd.m.rotation.y = gd.h;
      var u = gd.m.userData;
      gd.m.visible = d < 22;
      if (gd.m.visible) {   /* 전파 · 평소 1.7초에 한 번 「띠로 띠로」(세 겹) · 가까이 오면 1.0초 · 더 진하게 · 동작 줄이기 = 가운데 한 겹 정지 */
        waveStep(u.waves, f, 0.35, u.ph, 1.08);
        if (u.arm) { var wv = near && !RM ? Math.sin((G.clock || 0) * 9) * 0.6 : 0; u.arm.rotation.z = -0.4 + wv - (near ? 0.6 : 0); }
        busy = true;
      }
      if (near) talk = gd;
    });
    G.talk = talk;
    /* 내 캐릭터 전파 · 평소 거의 안 보임 → 가장 가까운 챗봇에 다가갈수록 진하고 빠르게(서로 신호가 통하는 느낌) */
    G.sig = clamp((6 - bestD) / 3.0, 0, 1);
    if (botParts.waves) { waveStep(botParts.waves, G.sig, 0.0, 0.37, 1.0); if (G.sig > 0) busy = true; }
    return busy;
  }
  /* 전파 한 묶음 · f = 신호 세기 0~1 · base = 평소 진하기 · 주기 1.7초 → 1.0초 · 움직임 줄이기 = 가운데 한 겹 정지(진하기만 바뀜) */
  function waveStep(waves, f, base, ph, y0) {
    var a = base + (1 - base) * f, per = 1.7 - 0.7 * f, tt = ((G.clock || 0) / per + ph) % 1;
    waves.forEach(function (sp, i) {
      if (RM) { sp.material.opacity = i === 1 ? a * 0.9 : 0; sp.scale.set(0.5, 0.5, 1); sp.position.y = y0 + 0.06; return; }
      var t = (tt * per - i * 0.16) / 0.62, on = t >= 0 && t <= 1;
      sp.material.opacity = on ? (1 - t) * a : 0; var sc = 0.24 + (on ? t : 0) * 0.6; sp.scale.set(sc, sc, 1); sp.position.y = y0 + (on ? t : 0) * 0.12;
    });
  }
  function placeBubble() {
    var b = $('gbub');
    if (!G.talk || G.anim || G.scn !== 'lobby') { if (!b.hidden) b.hidden = true; return; }
    var gd = G.talk; _p.copy(gd.m.position); _p.y = 1.72; _p.project(camera);   /* 전파(머리 위 1.0~1.5m)가 보이게 그 위에 */
    if (_p.z > 1) { b.hidden = true; return; }
    if (b.getAttribute('data-z') !== gd.id) { b.setAttribute('data-z', gd.id); $('gbubT').textContent = gd.text; var go = b.querySelector('.go'); go.textContent = gd.go; go.hidden = !gd.go; }
    b.hidden = false;
    var W = $('stage').clientWidth, H = $('stage').clientHeight, bw = b.offsetWidth || 220, x = clamp((_p.x + 1) / 2 * W, bw / 2 + 8, W - bw / 2 - 8), y = Math.max((1 - _p.y) / 2 * H, b.offsetHeight + 8);
    b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
  }

  /* ═══════════ 판 보기 들어가기 · 나오기 연출(약 0.85초 · 사용자 261003) ═══════════
   * 들어가기: 40도 시점 → 캐릭터 뒤 어깨 너머(뒤통수가 화면 아래) → 판 앞까지 다가가 판이 화면 가득 → 흰 화면으로 넘어가며 판 보기 시트
   * 나오기: 시트를 닫으면 판 앞에서 빠져나와 어깨 너머를 지나 40도 시점으로 · 동작 줄이기 설정이면 연출 없이 바로 */
  function easeIO(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function pickFace(z, pg) {
    if (pg && S.faces[pg]) return { pg: pg, f: S.faces[pg] };
    var p = G.pos, best = null, bd = 1e9;
    D.zonePages(z).forEach(function (q) {
      var f = S.faces[q]; if (!f || D.SIGNS.indexOf(q) >= 0 || q >= 40) return;
      var u = f.userData, dx = p.x - u.c.x, dz = p.z - u.c.z, d = Math.hypot(dx, dz), front = dx * u.n.x + dz * u.n.z;
      if (front > 0 && d < bd) { bd = d; best = { pg: q, f: f }; }
    });
    return best;
  }
  function shotsFor(f) {
    var u = f.userData, c = u.c, n = new T.Vector3(u.n.x, 0, u.n.z).normalize(), p = G.pos;
    var away = new T.Vector3(p.x - c.x, 0, p.z - c.z), dist = away.length(); away.normalize();
    var P1 = new T.Vector3(p.x + away.x * 1.15, 1.55, p.z + away.z * 1.15), L1 = new T.Vector3(c.x, 1.35, c.z);
    var fit = (u.size[1] / 2) / Math.tan(camera.fov * Math.PI / 360) * 1.02, fitW = (u.size[0] / 2) / Math.tan(camera.fov * Math.PI / 360) / camera.aspect * 1.02;
    var P2 = new T.Vector3(c.x + n.x * Math.max(fit, fitW), c.y, c.z + n.z * Math.max(fit, fitW)), L2 = c.clone();
    return { P1: P1, L1: L1, P2: P2, L2: L2 };
  }
  function enterPanel(z, pg) {
    var ps = D.zonePages(z), pk = pickFace(z, pg);
    var idx = pg ? ps.indexOf(pg) : (pk ? ps.indexOf(pk.pg) : null);
    if (RM || !pk || G.anim || !G.loaded) { if (RM) flash(); openSheet(z, idx); return; }
    var c = pk.f.userData.c; G.hTo = Math.atan2(c.x - G.pos.x, c.z - G.pos.z); G.mode = G.mode === 'auto' ? 'free' : G.mode; G.path = null; G.stick = null;
    var sh = shotsFor(pk.f);
    G.anim = { kind: 'in', t0: performance.now(), dur: 850, P0: G.camPos.clone(), L0: G.look.clone(), sh: sh, z: z, idx: idx };
    G.lastFace = pk.f; $('gbub').hidden = true;
  }
  function stepAnim(now) {
    var A = G.anim, k = clamp((now - A.t0) / A.dur, 0, 1), sh = A.sh, pos = new T.Vector3(), look = new T.Vector3();
    if (A.kind === 'intro') {
      var wi = camWant(), ei = easeIO(k), eL = 1 - Math.pow(1 - k, 3);
      pos.lerpVectors(A.P0, wi.pos, ei); look.lerpVectors(A.L0, wi.look, eL);
    } else if (A.kind === 'in') {
      if (k < 0.5) { var e = easeIO(k / 0.5); pos.lerpVectors(A.P0, sh.P1, e); look.lerpVectors(A.L0, sh.L1, e); }
      else { var e2 = easeIO((k - 0.5) / 0.5); pos.lerpVectors(sh.P1, sh.P2, e2); look.lerpVectors(sh.L1, sh.L2, e2); }
      $('fade').style.opacity = k > 0.72 ? ((k - 0.72) / 0.28).toFixed(3) : 0;
    } else {
      var w = camWant();
      if (k < 0.45) { var e3 = easeIO(k / 0.45); pos.lerpVectors(sh.P2, sh.P1, e3); look.lerpVectors(sh.L2, sh.L1, e3); }
      else { var e4 = easeIO((k - 0.45) / 0.55); pos.lerpVectors(sh.P1, w.pos, e4); look.lerpVectors(sh.L1, w.look, e4); }
      $('fade').style.opacity = k < 0.3 ? (1 - k / 0.3).toFixed(3) : 0;
    }
    camera.position.copy(pos); camera.lookAt(look);
    if (k >= 1) {
      G.anim = null;
      if (A.kind === 'intro') { G.camPos.copy(camera.position); G.look.copy(look); if (A.done) setTimeout(A.done, 0); }
      else if (A.kind === 'in') { openSheet(A.z, A.idx); setTimeout(function () { $('fade').style.opacity = 0; }, 260); }
      else { G.camPos.copy(camera.position); G.look.copy(look); $('fade').style.opacity = 0; }
    }
  }
  /* 시작 연출 · 1층 전체가 보이는 높은 스카이뷰에서 캐릭터 쪽으로 1.4초 줌인 → 기본 거리(처음 안내를 닫은 뒤 · 18F 에서 돌아올 때) · 움직임 줄이기 = 짧은 흰 화면 뒤 바로 */
  function intro(done) {
    if (!G.loaded || G.scn !== 'lobby') { if (done) done(); return; }
    var w = camWant();
    if (RM) { G.camPos.copy(w.pos); G.look.copy(w.look); G.need = true; if (done) done(); return; }
    var fx = Math.sin(G.az), fz = Math.cos(G.az), L0 = new T.Vector3(0, 0, -2.5), P0 = new T.Vector3(-fx * 16, 46, -2.5 - fz * 16);   /* 로비 가운데(도면 16, 8.5) 위 46m · 지금 방위 그대로 */
    G.anim = { kind: 'intro', t0: performance.now(), dur: 1300, P0: P0, L0: L0, done: done };
    camera.position.copy(P0); camera.lookAt(L0); G.need = true;
  }
  function exitPanel() {
    if (RM || !G.lastFace || !G.loaded || G.scn !== 'lobby') { G.lastFace = null; return; }
    var sh = shotsFor(G.lastFace); G.lastFace = null;
    camera.position.copy(sh.P2); camera.lookAt(sh.L2); $('fade').style.opacity = 1;
    G.anim = { kind: 'out', t0: performance.now(), dur: 750, sh: sh };
  }


  /* ═══════════ 체크인 존 숨김 · 타자왕 TV · 돋보기 표식(사용자 261003) ═══════════ */
  var HIDE_PG = [40, 41, 47];   /* 체크인 천막 현수막 40 · 엑스배너 47 · 출입구 안내 41(천막 묶음과 같이 문 밖 · 체크인이 없으면 홀로 남아 뺌) */
  function hideCheckin() {
    S.lobby.traverse(function (o) { if (o.name === 'checkin' || o.name === 'panel_41') o.visible = false; });
  }
  var tvMat = null;
  function buildTypingTv() {
    var c = document.createElement('canvas'); c.width = 180; c.height = 320; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#2A1A10'); gr.addColorStop(1, '#191F28'); g.fillStyle = gr; g.fillRect(0, 0, 180, 320);
    g.fillStyle = 'rgba(255,127,50,.35)'; for (var y = 8; y < 320; y += 12) for (var x = 8; x < 180; x += 12) if ((x * 7 + y * 3) % 5 === 0) g.fillRect(x, y, 3, 3);
    g.fillStyle = '#FF7F32'; g.font = '800 30px "Pretendard Variable", Pretendard, sans-serif'; g.textAlign = 'center'; g.fillText('AX 타자왕', 90, 120);
    g.fillStyle = '#FFFFFF'; g.font = '700 18px "Pretendard Variable", Pretendard, sans-serif'; g.fillText('1~3위 경품', 90, 156);
    g.beginPath(); g.moveTo(76, 196); g.lineTo(76, 240); g.lineTo(112, 218); g.closePath(); g.fillStyle = '#FF7F32'; g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '600 15px "Pretendard Variable", Pretendard, sans-serif'; g.fillText('재생 중', 90, 272);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    tvMat = new T.MeshBasicMaterial({ map: t, toneMapped: false });
    var gp = new T.Group(), dark = new T.MeshLambertMaterial({ color: 0x1D2127 });
    var frame = new T.Mesh(new T.BoxGeometry(0.06, 1.18, 0.68), dark); frame.position.set(0, 1.3, 0); gp.add(frame);
    var scr = new T.Mesh(new T.PlaneGeometry(0.6, 1.08), tvMat); scr.rotation.y = Math.PI / 2; scr.position.set(0.032, 1.3, 0); gp.add(scr);
    var pole = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.72, 8), dark); pole.position.set(-0.05, 0.36, 0); gp.add(pole);
    var base = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.02, 20), dark); base.position.set(-0.05, 0.01, 0); gp.add(base);
    var at = [0.95, 1.25]; gp.position.copy(toThree(at[0], at[1])); S.lobby.add(gp);   /* 타자왕 판(39) 왼쪽(남쪽) · 동쪽(통로)을 봄 */
    gp.userData = { promo: true }; gp.traverse(function (o) { o.userData = { promo: true }; });
    for (var dz = -5; dz <= 5; dz++) for (var dx = -5; dx <= 5; dx++) if (dx * dx + dz * dz <= 26) { var ci = gi(at[0] + dx * GS, at[1] + dz * GS); if (ci >= 0) wd[ci] = 1; }
  }
  /* 돋보기 · 딱 두 곳(사용자 261003 「이벤트 판은 크게 보기를 없애고 경품 보기 · 타자왕 광고 보기만」)
   * ① 룰렛 「경품 보기」(앱 경품 사진 · 가격 없음 · 샘플 딱지) ② 타자왕 「타자왕 광고 보기」(../tv/typing/?promo=1) · 다른 구역은 챗봇 말풍선 → 판 보기 */
  var mags = [];
  function buildMags() {
    var box = $('mags'); box.innerHTML = ''; mags = [];
    var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>';
    function add(label, run, at, n, extra) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mag'; b.innerHTML = ICON + '<span>' + esc(label) + '</span>'; b.setAttribute('aria-label', label);
      b.onclick = run; box.appendChild(b); mags.push(Object.assign({ el: b, at: at, n: n }, extra || {}));
    }
    add('타자왕 광고 보기', openPromo, toThree(1.75, 1.25).setY(1.0), null);   /* 「재생 중」 TV 앞 */
    var w = D.PROPS.wheel; add('경품 보기', openPrize, toThree(w[0] + 0.9, w[1]).setY(1.0), null);
  }
  var _m = new T.Vector3(), _c = new T.Vector3();
  function placeMags() {
    var W = $('stage').clientWidth, H = $('stage').clientHeight, on = G.loaded && G.scn === 'lobby' && !G.anim;
    mags.forEach(function (m) {
      if (!on) { m.el.style.display = 'none'; return; }
      if (m.pillar) {
        _c.set(camera.position.x - m.pillar.x, 0, camera.position.z - m.pillar.z).normalize();
        m.at = _m.set(m.pillar.x + _c.x * 0.72, 0.5, m.pillar.z + _c.z * 0.72).clone();
      } else if (m.n && m.n.x * (camera.position.x - m.at.x) + m.n.z * (camera.position.z - m.at.z) < 0) { m.el.style.display = 'none'; return; }
      var d = Math.hypot(m.at.x - G.pos.x, m.at.z - G.pos.z);
      if (d > 4.5) { m.el.style.display = 'none'; return; }
      _m.copy(m.at).project(camera);
      if (_m.z > 1 || Math.abs(_m.x) > 0.98 || Math.abs(_m.y) > 0.98) { m.el.style.display = 'none'; return; }
      m.el.style.display = ''; m.el.style.transform = 'translate(' + ((_m.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - _m.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-50%)';
    });
  }
  /* 룰렛 상품 · 앱 경품 표(index.html PRIZES.roulette)와 같은 이름 · 수량 · 사진 · 가격 없음 · 실물 사진 전까지 「샘플」 딱지 */
  var ROUL = [{ rk: '1등', nm: '텀블러', q: 60, img: ['rl1_tumbler'] }, { rk: '2등', nm: '커피 + 키캡 키링', q: 100, img: ['rl2_coffee', 'rl2_keyring'] }, { rk: '3등', nm: '컵받침', q: 150, img: ['rl3_coaster'] }, { rk: '4등', nm: '판스티커', q: 250, img: ['rl4_sticker'] }, { rk: '5등', nm: '볼펜', q: 400, img: ['rl5_pen'] }];
  function openPrize() {
    var cards = ROUL.map(function (p) {
      return '<article class="card prize" aria-label="' + esc(p.rk + ' ' + p.nm) + '"><h2><span class="k">' + p.rk + '</span>' + esc(p.nm) + '<span class="q">' + p.q + '개</span></h2>' +
        '<div class="pic"><div class="pz' + (p.img.length > 1 ? ' two' : '') + '">' + p.img.map(function (im) { return '<span class="ph"><img alt="' + esc(p.nm) + '" data-src="../assets/prize/' + im + '.webp"><i>샘플</i></span>'; }).join('') + '</div></div></article>';
    });
    openSheet({ name: '룰렛 경품' }, 0, null, cards);
  }
  /* 타자왕 순위판 · 1층 TV 와 같은 전체 루프(../tv/typing/ · 후킹 · 게임 · 하는 법 · 상품 · 순위 TOP 10 · 마감 · 순위 30초 폴링 · 사용자 261003 「1층 랭킹 보드 화면 그대로 · 등수도」) · 시트 안 9:16 · 닫으면 iframe 을 비워 폴링 멈춤 */
  function openPromo() {
    var v = $('vid'), b = $('vbody'); v.hidden = false; G.sheetOpen = true;
    var W = b.clientWidth - 24, H = b.clientHeight - 24, w = Math.min(W, H * 9 / 16), h = w * 16 / 9;
    b.innerHTML = '<iframe title="1F 타자왕 순위판" src="../tv/typing/" style="width:' + w.toFixed(0) + 'px;height:' + h.toFixed(0) + 'px" allow="autoplay" loading="eager"></iframe>';
  }
  function closePromo() { $('vid').hidden = true; $('vbody').innerHTML = ''; G.sheetOpen = false; G.need = true; G.last = 0; }

  /* ═══════════ 작은 지도(오른쪽 위 · 사용자 261003 「지금 어디쯤 있는지」) ═══════════
   * 방위 = 3D 시점과 같다(지도 위 = 화면 위 = 남쪽 정문 · 오른쪽 = 서쪽) · 구역 칸 · 출입문 · 체크인 · 내 자리(주황 점 + 바라보는 쪽) · 다음 구역 강조 · 누르면 「구역 목록」 큰 지도 */
  var MM = { x0: -1, x1: 34, z0: -1.5, z1: 27.5, k: 3.4 };   /* 체크인 존을 뺀 뒤 = 건물만 */
  MM.W = (MM.x1 - MM.x0) * MM.k; MM.H = (MM.z1 - MM.z0) * MM.k; MM.S = Math.max(MM.W, MM.H);
  /* 지도 좌표 = 북쪽 위(평면 지도와 같음) · 통째로 돌려 「지도 위 = 화면 위」를 맞춘다 · N 표시가 북쪽을 알려 준다 */
  function mmX(x) { return ((x - MM.x0) * MM.k).toFixed(1); }
  function mmY(z) { return ((MM.z1 - z) * MM.k + (MM.S - MM.H) / 2).toFixed(1); }
  function buildMini() {
    var B = D.BLD, S2 = MM.S, o = '<svg viewBox="0 0 ' + S2.toFixed(1) + ' ' + S2.toFixed(1) + '" aria-hidden="true"><g id="mmRot">';
    o += '<polygon points="' + B.outline.map(function (q) { return mmX(q[0]) + ',' + mmY(q[1]); }).join(' ') + '" fill="#FFFFFF" stroke="#B0B8C1" stroke-width="1"/>';
    B.cores.forEach(function (c) { o += '<rect x="' + mmX(c[0]) + '" y="' + mmY(B.coreN) + '" width="' + ((c[1] - c[0]) * MM.k).toFixed(1) + '" height="' + ((B.coreN - B.lobbyN) * MM.k).toFixed(1) + '" fill="#E5E8EB"/>'; });
    if (B.room3) o += '<polygon points="' + B.room3.pts.map(function (q) { return mmX(q[0]) + ',' + mmY(q[1]); }).join(' ') + '" fill="#F2F4F6" stroke="#B0B8C1" stroke-width="0.8"/>';
    D.ZONES.forEach(function (z) {
      if (!z.rows.length) return;
      var b = zoneRect(z);
      o += '<rect class="mz" data-z="' + z.id + '" x="' + mmX(b[0]) + '" y="' + mmY(b[3]) + '" width="' + ((b[1] - b[0]) * MM.k).toFixed(1) + '" height="' + ((b[3] - b[2]) * MM.k).toFixed(1) + '" rx="1.5"/>';
      z.rows.forEach(function (r) { var n = r.pages.length; o += '<line x1="' + mmX(r.a[0]) + '" y1="' + mmY(r.a[1]) + '" x2="' + mmX(r.a[0] + r.r[0] * n) + '" y2="' + mmY(r.a[1] + r.r[1] * n) + '" stroke="#FF7F32" stroke-width="2"/>'; });
    });
    o += '<circle cx="' + mmX(B.revolve) + '" cy="' + mmY(0) + '" r="3" fill="#4E5968"/><circle cx="' + mmX(32.57) + '" cy="' + mmY(8.4) + '" r="3" fill="#4E5968"/><rect x="' + mmX(17.0) + '" y="' + mmY(11.7) + '" width="' + (2.8 * MM.k).toFixed(1) + '" height="3" fill="#4E5968"/>';
    o += '<g id="mmMe"><path d="M0,-8 L5,3 L0,1 L-5,3 Z" fill="#191F28"/><circle r="4.2" fill="#FF7F32" stroke="#FFFFFF" stroke-width="1.5"/></g></g></svg>';
    $('mini').innerHTML = o; G.mmAz = null;
  }
  function mini() {
    if (!G.loaded || G.scn !== 'lobby' || G.mapMode) return;
    var me = $('mmMe'); if (!me) return;
    var c = MM.S / 2, azd = G.az * 180 / Math.PI, rot = 180 + azd;   /* 방위 0 = 남쪽이 화면 위 → 북쪽 위 지도를 180도 */
    if (G.mmAz !== G.az) {
      G.mmAz = G.az; $('mmRot').setAttribute('transform', 'rotate(' + rot.toFixed(2) + ' ' + c.toFixed(1) + ' ' + c.toFixed(1) + ')');
    }
    var p = planOf(G.pos), deg = 180 - G.h * 180 / Math.PI;   /* 화살표 = 바라보는 쪽(북쪽 위 지도 기준) */
    me.setAttribute('transform', 'translate(' + mmX(p[0]) + ',' + mmY(p[1]) + ') rotate(' + deg.toFixed(1) + ')');
    var nx = G.mode === 'auto' && G.goal != null ? G.goal : Math.min(STOPS.length - 1, G.stop + (G.mode === 'stop' ? 1 : 0)), nz = STOPS[nx].zone, near = G.near && G.near.id;
    if (G.miniKey !== nz + '|' + near) {
      G.miniKey = nz + '|' + near;
      Array.prototype.forEach.call($('mini').querySelectorAll('.mz'), function (r) { var id = r.getAttribute('data-z'); r.setAttribute('class', 'mz' + (id === near ? ' here' : id === nz ? ' next' : '')); });
    }
  }

  /* ═══════════ 가까운 구역 · 떠오르는 버튼 · 아래 줄 ═══════════ */
  function nearSpot() { var p = planOf(G.pos), best = null, bd = 3.0; STOPS.forEach(function (s) { if (!s.spot) return; var d = Math.hypot(s.x - p[0], s.z - p[1]); if (d < bd) { bd = d; best = s; } }); return best; }
  function nearZone() {
    var p = planOf(G.pos), best = null, bd = 1e9;
    D.ZONES.forEach(function (z) {
      if (z.id === 'cafe') { if (!SHOW_CAFE) return; var dg = Math.hypot(p[0] - 18.4, p[1] - 10.4); if (dg < 2.6 && dg < bd) { bd = dg; best = z; } return; }
      z.rows.forEach(function (r) {
        var n = r.pages.length, ax = r.a[0], az = r.a[1], bx = ax + r.r[0] * n, bz = az + r.r[1] * n, vx = bx - ax, vz = bz - az, t = clamp(((p[0] - ax) * vx + (p[1] - az) * vz) / (vx * vx + vz * vz), 0, 1);
        var qx = ax + vx * t, qz = az + vz * t, d = Math.hypot(p[0] - qx, p[1] - qz), front = (p[0] - qx) * r.n[0] + (p[1] - qz) * r.n[1];
        if (front > 0 && d < 4.2 && d < bd) { bd = d; best = z; }
      });
    });
    return best;
  }
  function updateUi(force) {
    /* 입장 → 처음 안내 → 대기까지는 판 보기 · 말풍선을 띄우지 않는다(G.moved) · 움직이거나 「다음 구역」 뒤부터(사용자 261003 버그 「입장하자마자 판 보기」) */
    var z = G.mode === 'auto' || !G.moved ? null : nearZone(), sp = z ? nearSpot() : null; if (sp) z = D.Z(sp.zone); var key = (G.moved ? 1 : 0) + '|' + (z ? z.id : '') + '|' + (sp ? sp.id : '') + '|' + G.mode + '|' + G.stop + '|' + G.scn;
    if (!force && key === G.ctaKey) return; G.ctaKey = key; G.near = z; G.spot = sp;
    var cta = $('cta');
    if (z && z.id === 'event') cta.hidden = true;   /* EVENT 는 크게 보기 없음(사용자 261003) · 돋보기 「경품 보기」 · 「타자왕 광고 보기」만 */
    else if (z && G.scn === 'lobby') {
      var n = D.zonePages(z).length;
      cta.innerHTML = z.id === 'cafe' ? '18F 커피챗 보기' : esc(z.name) + ' 판 크게 보기 <span class="n">' + n + '장</span>';
      cta.hidden = false;
    } else cta.hidden = true;
    var s = STOPS[G.stop], w = $('where');
    if (G.scn === 'cafe') cta.hidden = true;
    if (G.scn === 'cafe') w.textContent = '18F AX 커피챗';
    else if (G.mode === 'auto' && G.goal != null) w.textContent = STOPS[G.goal].name + '(으)로 가는 중';
    else if (z) w.textContent = '지금: ' + (sp ? sp.name : z.id === 'cafe' ? '게이트 · 엘리베이터' : z.name) + ' 앞 · ' + (G.stop + 1) + ' / ' + STOPS.length;
    else w.textContent = '지금: ' + (G.mode === 'stop' && s.where ? s.where : '로비');
    $('bPrev').disabled = G.stop <= 0 && G.mode !== 'free';
    $('bNext').disabled = G.stop >= STOPS.length - 1 && G.mode === 'stop';
    var nx = Math.min(STOPS.length - 1, G.stop + (G.mode === 'stop' || G.mode === 'auto' ? 1 : 1));
    $('bNext').textContent = '다음 구역 ▶';
    $('bNext').setAttribute('aria-label', '다음 구역: ' + STOPS[nx].name);
    $('navRow').hidden = G.scn === 'cafe'; $('cafeRow').hidden = G.scn !== 'cafe';
    $('cap').hidden = true;
  }
  function onNext() { hideDrag(); if (G.mode === 'free') nearestStop(); var k = G.mode === 'auto' && G.goal != null ? G.goal + 1 : G.stop + 1; goStop(Math.min(STOPS.length - 1, k)); }
  function onPrev() { hideDrag(); if (G.mode === 'free') nearestStop(); var k = G.mode === 'auto' && G.goal != null ? G.goal - 1 : G.stop - 1; goStop(Math.max(0, k)); }

  /* ═══════════ 18F 장면 ═══════════ */
  function toCafe() {
    G.scn = 'cafe'; S.lobby.visible = false; bot.visible = false; S.cafe.visible = true; $('bubble').hidden = false; $('pad').hidden = true; $('mini').hidden = true; $('ctl').hidden = true;
    G.cafe = { th: S.CAFE_DEF.th, ph: S.CAFE_DEF.ph, r: S.CAFE_DEF.r }; G.need = true; updateUi(true);
  }
  function backTo1F() {
    G.scn = 'lobby'; S.lobby.visible = true; bot.visible = true; S.cafe.visible = false; $('bubble').hidden = true; $('pad').hidden = false; $('mini').hidden = false; $('ctl').hidden = false; G.need = true; updateUi(true); setTimeout(intro, 0);
  }
  function cafeCam() {
    var c = G.cafe, t = S.CAFE_DEF.t, s = Math.sin(c.ph);
    camera.position.set(t.x + c.r * s * Math.sin(c.th), t.y + c.r * Math.cos(c.ph), t.z + c.r * s * Math.cos(c.th)); camera.lookAt(t);
  }

  /* ═══════════ 입력 · 왼쪽 아래 고정 패드 = 걷기(위 = 화면 위쪽) · 화면 톡 = 걷기 / 판 열기 · 두 손가락 = 거리 2단계 · 그 밖의 끌기는 아무 일 없음 ═══════════ */
  var ray = new T.Raycaster(), ptr = null, pinch = null, pads = new Map();
  function hideDrag() {}
  function wireStage() {
    var cv = $('cv');
    cv.addEventListener('pointerdown', function (e) {
      pads.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pads.size === 2) { var a = Array.from(pads.values()); pinch = { d0: Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1, dist0: G.dist }; ptr = null; return; }
      if (ptr) return;
      var r = cv.getBoundingClientRect();
      ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX - r.left, ly: e.clientY - r.top, t0: performance.now(), moved: false };
    });
    cv.addEventListener('pointermove', function (e) {
      var q = pads.get(e.pointerId); if (q) { q.x = e.clientX; q.y = e.clientY; }
      if (pinch && pads.size >= 2 && !pinch.done) {
        var a = Array.from(pads.values()), d = Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y), k = d / pinch.d0;
        setDist(pinch.dist0 / k);   /* 벌리기 = 가까이 · 오므리기 = 멀리(연속) */
      }
      if (ptr && e.pointerId === ptr.id && Math.hypot(e.clientX - ptr.x0, e.clientY - ptr.y0) > 12) ptr.moved = true;
    });
    function end(e) {
      pads.delete(e.pointerId); if (pads.size < 2) pinch = pads.size ? pinch : null;
      if (!ptr || e.pointerId !== ptr.id) return;
      var p = ptr; ptr = null;
      if (!p.moved && e.type === 'pointerup' && performance.now() - p.t0 < 500) tap(p.lx, p.ly);
    }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); setDist(G.dist * Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    /* 고정 패드 · 바깥 원 안에서 손잡이를 민다 · 반지름 48px 이 최고 속도 */
    var pad = $('pad'), knob = $('knob'), pp = null;
    function padMove(e) {
      var r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, R = 48, m = Math.hypot(dx, dy), k = m > R ? R / m : 1;
      knob.style.transform = 'translate(' + (dx * k).toFixed(1) + 'px,' + (dy * k).toFixed(1) + 'px)';
      var sx = dx * k / R, sy = dy * k / R; G.stick = Math.hypot(sx, sy) < 0.12 ? { x: 0, y: 0 } : { x: sx, y: sy }; G.need = true;
    }
    pad.addEventListener('pointerdown', function (e) {
      if (pp != null || !G.loaded || G.scn !== 'lobby') return; e.preventDefault();
      pp = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (x) {}
      pad.classList.add('on'); G.moved = true; G.path = null; G.goal = null; $('dest').hidden = true; padMove(e);
    });
    pad.addEventListener('pointermove', function (e) { if (e.pointerId === pp) padMove(e); });
    function padEnd(e) { if (e.pointerId !== pp) return; pp = null; pad.classList.remove('on'); knob.style.transform = ''; G.stick = null; nearestStop(); updateUi(true); }
    pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
    pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    /* 키보드(데스크톱 확인용) · 화살표 = 걷기 */
    var keys = {};
    window.addEventListener('keydown', function (e) {
      if (G.sheetOpen) return;
      if (/^Arrow/.test(e.key)) { keys[e.key] = 1; G.stick = { x: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), y: (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0) }; G.need = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', function (e) { if (/^Arrow/.test(e.key)) { delete keys[e.key]; G.stick = Object.keys(keys).length ? { x: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), y: (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0) } : null; if (!G.stick) { nearestStop(); updateUi(true); } } });
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
      if (u.promo) { openPromo(); return; }
      if (u.pg || u.zone) {
        var z = D.Z(u.zone) || D.zoneOfPg(u.pg);
        if (z && z.id !== 'cafe' && z.id !== 'event') { enterPanel(z, u.pg || null); return; }
        if (z && z.id === 'event') return;
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
    if (!G.ok || G.sheetOpen || G.mapMode || G.hold) return;
    var busy = false, w0 = performance.now();
    G.clock += dt;
    var held = stepHold(dt);
    if (G.loaded && G.scn === 'lobby') {
      busy = stepBot(dt, now) || G.mode === 'auto' || !!G.stick;
      if (G.anim) { stepAnim(now); busy = true; } else busy = stepCam(dt) || busy || held;
      if (busy) updateUi(false);
      busy = stepGuides(dt) || busy;
    }
    else if (G.scn === 'cafe') cafeCam();
    else if (!G.loaded) { camera.position.set(28 - 16, 22, 6 - (-14)); camera.lookAt(0, 0, 0.5); }
    if (G.bench) { G.pos.x += Math.sin(now * 0.001) * dt * 1.5; busy = true; }
    if (!busy && !G.need && !G.showFps) return;
    G.need = false;
    if (tvMat) tvMat.color.setScalar(RM ? 1 : 0.86 + 0.14 * Math.sin((G.clock || 0) * 3));
    S.frame(camera, G.scn); if (G.ceil) G.ceil.visible = false; renderer.render(scene, camera); placePins(); mini(); placeBubble(); placeMags();
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
  function openSheet(z, i, list, cards) {
    var ps = cards || list || D.zonePages(z); if (!ps.length) return;
    if (i == null) i = !cards && ps.length > 1 && D.SIGNS.indexOf(ps[0]) >= 0 ? 1 : 0;   /* 큰 버튼으로 열면 간판 다음 판부터(간판은 왼쪽으로 넘기면 있다) */
    SH = { z: z, ps: ps, i: clamp(i, 0, ps.length - 1), zoom: false, cards: !!cards }; $('pZoom').hidden = !!cards;
    $('shSign').textContent = z ? z.name : '자세히 보기'; $('shSign').className = z ? 'sg' : 'sg ghost';
    $('shTitle').textContent = '';
    var sheet = $('sheet'); sheet.hidden = false; G.sheetOpen = true;
    var W = $('trackWrap').clientWidth || window.innerWidth, iw = W - 24;
    $('track').innerHTML = cards ? cards.join('') : ps.map(function (p, k) {
      var s = D.cropSize(p), h = iw * s[1] / s[0];
      return '<article class="card" data-i="' + k + '" aria-label="' + esc(D.PG[p]) + '"><h2>' + esc(D.PG[p]) + '</h2>' +
        '<div class="pic' + (D.pgSize(p)[0] > D.pgSize(p)[1] ? ' wide' : '') + '"><div class="im" style="height:' + h.toFixed(1) + 'px;' + cropBgPx(p, iw) + '"><img alt="' + esc(D.PG[p]) + '" data-src="' + cropSrc(p) + '"></div></div></article>';   /* 흰 카드 = 늘 같은 크기(남은 높이를 채움) · 그림은 위부터 · 가로 간판은 가운데 */
    }).join('');
    if (!cards) Array.prototype.forEach.call($('track').querySelectorAll('.card'), wireCard);
    setPage(SH.i, true);
  }
  function loadImg(k) {
    var c = $('track').children[k]; if (!c) return; var im = c.querySelector('img'); if (!im || im.src) return;
    c.querySelectorAll('img[data-src]').forEach(function (m) { if (m.src) return; m.onload = function () { m.classList.add('on'); }; m.src = m.getAttribute('data-src'); });
  }
  function setPage(k, inst) {
    if (!SH) return;
    if (SH.zoom && !SH.cards) setZoom(false);
    SH.i = clamp(k, 0, SH.ps.length - 1);
    var tr = $('track'); tr.style.transition = inst || RM ? 'none' : 'transform .3s cubic-bezier(.2,.8,.2,1)'; tr.style.transform = 'translateX(' + (-SH.i * 100) + '%)';
    $('shCount').textContent = (SH.i + 1) + ' / ' + SH.ps.length;
    $('pPrev').disabled = SH.i <= 0; $('pNext').disabled = SH.i >= SH.ps.length - 1;
    [SH.i, SH.i + 1, SH.i - 1].forEach(loadImg);
  }
  function closeSheet() { $('sheet').hidden = true; G.sheetOpen = false; SH = null; G.need = true; G.last = 0; exitPanel(); }
  function setZoom(on) {
    if (!SH) return; var c = $('track').children[SH.i]; if (!c) return;
    var pic = c.querySelector('.pic'), W = c.clientWidth - 24, s = D.cropSize(SH.ps[SH.i]);
    SH.zoom = on; c.classList.toggle('zoom', on); $('pZoom').textContent = on ? '원래대로' : '크게';
    var w = on ? W * 2.2 : W; pic.removeAttribute('style');
    pic.querySelector('.im').setAttribute('style', 'height:' + (w * s[1] / s[0]).toFixed(1) + 'px;' + cropBgPx(SH.ps[SH.i], w));
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
      var pic = c.querySelector('.pic'); pic.setAttribute('style', 'width:' + w.toFixed(1) + 'px'); pic.querySelector('.im').setAttribute('style', 'height:' + (w * s[1] / s[0]).toFixed(1) + 'px;' + cropBgPx(p, w));
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
      if (!$('vid').hidden) { if (e.key === 'Escape') closePromo(); return; }
      if (!G.sheetOpen) return;
      if (e.key === 'ArrowRight') setPage(SH.i + 1); else if (e.key === 'ArrowLeft') setPage(SH.i - 1); else if (e.key === 'Escape') closeSheet();
    });
  }

  /* ═══════════ 구역 칸(작은 지도) ═══════════ */
  function zoneRect(z) {
    var xs = [], zs = [];
    z.rows.forEach(function (r) { var n = r.pages.length; [0, n].forEach(function (k) { var x = r.a[0] + r.r[0] * k, zz = r.a[1] + r.r[1] * k; xs.push(x, x + r.n[0] * 1.8); zs.push(zz, zz + r.n[1] * 1.8); }); });
    return [Math.min.apply(0, xs), Math.max.apply(0, xs), Math.min.apply(0, zs), Math.max.apply(0, zs)];
  }
  /* 3D 를 못 그리는 기기 · 평면 지도 · 목록 대신 짧은 안내 한 줄(사용자 261003 「평면 지도 · 목록은 없애고 3D 만」) */
  function noGl(msg) {
    G.mapMode = true; $('cv').style.visibility = 'hidden'; $('load').hidden = true; $('bar').hidden = true; $('pad').hidden = true; $('mini').hidden = true; $('ctl').hidden = true; $('pins').innerHTML = ''; $('mags').innerHTML = '';
    var m = $('nogl'); m.hidden = false; m.textContent = msg || '이 기기에서는 3D 둘러보기를 볼 수 없어요'; $('black').style.opacity = 0;
  }

  /* ═══════════ 처음 안내(한 문장 · 한 번) ═══════════ */
  function maybeHelp() { if (Q.get('nohelp') !== '1' && !store.get('axTourLabHelp1')) showHelp(); }
  /* 입장 연출 · 던전 이동처럼 암전(처음부터 검은 화면 · 받는 동안 「불러오는 중」) → 가운데 「1F · AX Festival 2026」 0.8초 → 밝아지며 높은 스카이뷰 → 캐릭터로 줌인(1.3초) → 처음 안내 · 합 2.5초 안 · 움직임 줄이기 = 짧은 페이드만 */
  function entrance() {
    var bk = $('black'), t = $('blackT');
    t.textContent = '1F · AX Festival 2026'; t.classList.add('on');
    if (RM) { setTimeout(function () { t.classList.remove('on'); bk.style.opacity = 0; intro(maybeHelp); }, 250); return; }
    setTimeout(function () {
      t.classList.remove('on');
      intro(maybeHelp);   /* 스카이뷰에서 시작 */
      bk.style.transition = 'opacity .35s'; bk.style.opacity = 0;
    }, 800);
  }
  function showHelp() { $('help').hidden = false; }
  function hideHelp() { $('help').hidden = true; store.set('axTourLabHelp1', '1'); G.guardT = performance.now(); }   /* 닫는 탭이 아래 버튼까지 가지 않게 0.5초 막음 */

  /* ═══════════ 시작 ═══════════ */
  function start() {
    $('bNext').onclick = onNext; $('bPrev').onclick = onPrev; $('bBack1F').onclick = function () { backTo1F(); placeAt(STOPS.length - 1, false); };
    $('cta').onclick = function () { if (performance.now() - (G.guardT || 0) < 500) return; if (G.spot && G.spot.spot === 'typing') { openPromo(); return; } var z = G.near; if (!z) return; if (z.id === 'cafe') { toCafe(); return; } enterPanel(z); };
    $('vClose').onclick = closePromo;
    [['rotL', 'rot', 1], ['rotR', 'rot', -1], ['zIn', 'zoom', -1], ['zOut', 'zoom', 1]].forEach(function (q) {
      var el = $(q[0]);
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {} holdStart(q[1], q[2]); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { el.addEventListener(ev, holdEnd); });
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); holdStart(q[1], q[2]); setTimeout(holdEnd, 0); } });
    });
    setDist(G.dist);
    $('gbub').onclick = function () { if (performance.now() - (G.guardT || 0) < 500) return; var gd = G.talk; if (!gd || !gd.go) return; if (gd.spot === 'typing') { openPromo(); return; } var z = D.Z(gd.zone); if (z) enterPanel(z); };
    var rs = store.get('axTourLabRM'); if (rs === '1' || rs === '0') RM = rs === '1';
    document.documentElement.classList.toggle('rm', RM); $('rmChk').checked = RM;
    $('rmChk').onchange = function () { RM = $('rmChk').checked; store.set('axTourLabRM', RM ? '1' : '0'); document.documentElement.classList.toggle('rm', RM); G.need = true; };
    $('bHelp').onclick = showHelp; $('hOk').onclick = hideHelp; $('help').addEventListener('click', function (e) { if (e.target === $('help')) hideHelp(); });
    wireSheet();
    G.showFps = Q.get('fps') === '1';
    G.t0 = performance.now();
    if (!window.TourScene || !T || !init3D()) { noGl(); return; }
    wireStage(); resize(); window.addEventListener('resize', resize);
    updateUi(true);
    load();
    requestAnimationFrame(loop);
  }
  /* 시험 · 녹화용 손잡이(앱에는 없음) */
  G.api = { shotCamKeep: function (x, y, z, lx, ly, lz, face) { camera.position.set(x - 16, y, 6 - z); camera.lookAt(lx - 16, ly, 6 - lz); if (face) { guides.forEach(function (g) { g.m.rotation.y = Math.atan2(camera.position.x - g.m.position.x, camera.position.z - g.m.position.z); }); bot.rotation.y = Math.atan2(camera.position.x - bot.position.x, camera.position.z - bot.position.z); } S.frame(camera, 'lobby'); if (G.ceil) G.ceil.visible = false; renderer.render(scene, camera); G.hold = true; }, shotCam: function (x, y, z, lx, ly, lz) { camera.position.set(x - 16, y, 6 - z); camera.lookAt(lx - 16, ly, 6 - lz); var bv = bot.visible; bot.visible = false; S.frame(camera, 'lobby'); renderer.render(scene, camera); bot.visible = bv; G.hold = true; }, guides: function () { return guides.map(function (g) { return [g.zone, g.at, +g.h.toFixed(2)]; }); }, enter: function (zid, pg) { enterPanel(D.Z(zid), pg || null); }, pose: function (x, z, yaw, h) { G.pos.copy(toThree(x, z)); G.mode = 'free'; G.path = null; G.yaw = yaw; G.h = h == null ? yaw + Math.PI : h; G.yo = 0; G.need = true; }, goStop: goStop, openSheet: function (zid, i) { openSheet(D.Z(zid), i || 0); }, closeSheet: closeSheet, setPage: function (k) { setPage(k); }, tap: tap, walkTo: walkTo, plan: function () { return planOf(G.pos); }, cam: function () { return planOf(camera.position).concat([camera.position.y]); }, toCafe: toCafe, back: backTo1F, free: free, hw: function (x, z) { var c = gi(x, z); return c < 0 ? -1 : hw[c] * 0.05; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
