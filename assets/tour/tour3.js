/* 1층 둘러보기 v3 · 공용 모듈(앱 · 시험판 tour-lab 이 함께 쓴다 · v5.37 정식 앱 이식 261003) · 원본은 tour-lab/lab.js 를 옮겨 만들었다(scratchpad gen_tour3.py) · 이 파일이 정본
 * 캐릭터로 걷기 · v3.1(실폰 피드백 261003): 왼쪽 아래 고정 패드 + 위에서 40도 고정 시점(회전 없음)
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
  var T = window.THREE, D = window.TOUR_DATA, BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^\/]*$/, '') : 'assets/tour/'; })(), LABVER = 'v535a', ROOT = BASE.replace(/assets\/tour\/$/, '');
  var Q = new URLSearchParams(window.AXT3_Q || '');   /* 시험판(tour-lab)만 주소 값을 넘긴다 · 앱은 비어 있음 */
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);   /* 기본 = 기기 설정 · 처음 안내 · 도움말의 「움직임 줄이기」로 바꾸면 이 기기에 기억(아래 start) */
  function $(id) { return document.getElementById('t3-' + id); }   /* 모든 id 는 t3- 접두(앱 id 와 겹치지 않게) */
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
    { id: 'start', name: '로비', x: 27.3, z: 8.9, look: [20, 7.8], where: '로비' },   /* 어느 구역 판 줄에서도 4.2m 밖(입장하자마자 판 보기가 뜨던 버그 · 사용자 261003) */
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
    stick: null, near: null, ctaKey: '', fade: [1, 1, 1, 1, 1], fadeTo: [1, 1, 1, 1, 1], fwdT: 0, run: 0, realV: 0, lean: 0, fov0: 58, fovK: 0,
    cafe: { th: 0.55, ph: 1.12, r: 11.5 }, sheetOpen: false
  };
  window.__lab = window.__tour3 = G;
  G.r3 = function () { return { renderer: renderer, scene: scene, camera: camera, S: S }; };   /* 시험용(깊이 16비트 흉내 · 깜빡임 세기) */

  /* ═══════════ 3D 준비 ═══════════ */
  var renderer, scene, camera, S, bot, botParts = {}, shadow, pillarMats = [];
  /* v5.44 실기기 진단(v5.47 주소 ?t3diag=1 인 그 페이지에서만 · 기기에 기억하지 않는다) · 개인정보 없음(GPU 이름 · 깊이 비트 · highp · MSAA · DPR · fps · 모형 손질 수) */
  function gpuInfo(gl) {
    var ex = null, hp = null; try { ex = gl.getExtension('WEBGL_debug_renderer_info'); hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); } catch (e) {}
    return { ren: String((ex && gl.getParameter(ex.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '?'), gl2: !!renderer.capabilities.isWebGL2, highp: !!(hp && hp.precision > 0), hpBits: hp ? hp.precision : 0, msaa: gl.getParameter(gl.SAMPLES), dpr: +(window.devicePixelRatio || 1).toFixed(2) };
  }
  /* v5.45 진단 한 줄 · 캐릭터 자리(도면 x · z 미터 · 서쪽 벽 0 · 남쪽 유리 0)와 바라보는 각도(동 0 · 북 90 · 서 180 · 남 270) · 사용자가 자리를 짚을 때 이 값을 받는다 */
  function posText() {
    var p = planOf(G.pos), deg = (Math.atan2(-Math.cos(G.h), Math.sin(G.h)) * 180 / Math.PI + 360) % 360, az = (Math.atan2(-Math.cos(G.az), Math.sin(G.az)) * 180 / Math.PI + 360) % 360;
    return '위치 x ' + p[0].toFixed(1) + ' · z ' + p[1].toFixed(1) + ' · 보는 쪽 ' + Math.round(deg) + '° · 화면 위 ' + Math.round(az) + '°';
  }
  function diagText() {
    var g = G.gpu || {}, z = G.zfix || {}, l = G.lmfix || {}, pr = G.probeResult;
    return '둘러보기 진단 ' + (window.AXTour ? AXTour.ver : '') + '\n' + g.ren + '\n' +
      'WebGL' + (g.gl2 ? '2' : '1') + ' · 깊이 ' + G.depthBits + '비트 · highp ' + (g.highp ? '예 ' + g.hpBits : '아니오') + ' · MSAA ' + g.msaa + '\n' +
      'DPR ' + g.dpr + ' → ' + renderer.getPixelRatio() + ' · fps ' + G.frames.length + (pr ? ' · 처음 ' + pr.p50 + 'ms' + (pr.p50 > 34 ? ' 절전' : '') : '') + '\n' +
      '겹침 ' + (z.pairs || 0) + ' · 자름 ' + (z.cut || 0) + ' · 지움 ' + (z.gone || 0) + ' · 빛 옮김 ' + (z.relit || 0) + ' · 라이트맵 ' + (l.tex || 0) + '장 ' + (l.ms || 0) + 'ms' + (G.lmErr ? ' 오류' : '') + '\n' + posText();
  }
  function init3D() {
    var cv = $('cv');
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); }
    catch (e) { return false; }
    if (!renderer.getContext()) return false;
    try { var gl0 = renderer.getContext(); G.depthBits = gl0.getParameter(gl0.DEPTH_BITS); if (G.diag) G.gpu = gpuInfo(gl0); } catch (e) {}   /* v5.40 진단 · 깊이 비트(fps 표시에 함께) · v5.44 진단 모드(?t3diag=1)면 GPU 이름 · highp · MSAA */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.setClearColor(0xE9ECEF, 1);
    renderer.toneMapping = T.AgXToneMapping; renderer.toneMappingExposure = 1.0;
    scene = new T.Scene();
    var bc = document.createElement('canvas'); bc.width = 4; bc.height = 256; var bg = bc.getContext('2d'), gr = bg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#FAFBFC'); gr.addColorStop(0.55, '#EEF0F2'); gr.addColorStop(1, '#DADDE1'); bg.fillStyle = gr; bg.fillRect(0, 0, 4, 256);
    scene.background = new T.CanvasTexture(bc); scene.background.colorSpace = T.SRGBColorSpace;
    camera = new T.PerspectiveCamera(58, 1, 0.5, 140);   /* v5.40 near 0.2 → 0.5(실기기 깊이 정밀도 2.5배 · 카메라는 늘 캐릭터 3.8m 뒤 위 · 판 크게 보기도 1.6m 밖) · v5.38 깊이 정밀도(사용자 261003 갤럭시 「안내데스크 자리에서 까만 색이 깜빡」) · near 0.08 → 0.2 · far 300 → 140(스카이뷰 46m 안) */
    scene.add(new T.HemisphereLight(0xFFFFFF, 0xC9CED4, 2.0));
    var dl = new T.DirectionalLight(0xFFFFFF, 1.3); dl.position.set(-8, 20, 12); scene.add(dl);
    S = window.TourScene.build({ T: T, D: D, P: P, N3: N3, renderer: renderer, scene: scene, labelFont: '"Pretendard Variable", Pretendard, sans-serif' });
    scene.add(S.lobby); scene.add(S.cafe);
    buildBot(); scene.add(bot); buildDust();
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
  /* v5.38 스태프 챗봇 = 원기둥 충돌(캐릭터 몸 반지름 0.34 + 챗봇 0.34 + 여유 0.04) · 칸 지도(wd)에도 같은 원을 칸 번호로 꽉 채워 찍고, 걸음마다 거리로도 한 번 더 본다 */
  var GUIDE_R = 0.72;
  function blockDisc(x, z, r) {
    var i0 = Math.floor((x - GX0) / GS), j0 = Math.floor((z - GZ0) / GS), n = Math.ceil(r / GS) + 1;
    for (var dj = -n; dj <= n; dj++) for (var di = -n; di <= n; di++) {
      var i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
      if (Math.hypot(GX0 + (i + 0.5) * GS - x, GZ0 + (j + 0.5) * GS - z) <= r) wd[j * GW + i] = 1;
    }
  }
  function nearGuide(x, z) { for (var k = 0; k < guides.length; k++) { var a = guides[k].at; if ((x - a[0]) * (x - a[0]) + (z - a[1]) * (z - a[1]) < GUIDE_R * GUIDE_R) return true; } return false; }
  function free(x, z) { var c = gi(x, z); return c >= 0 && !wd[c] && (!reach || reach[c]) && !nearGuide(x, z); }
  /* v5.40 좁은 틈 메우기(끼임 봇 · 회전문 원과 HiDI-Q · AX in Action 부스 끝 사이처럼 몸 하나 겨우 들어가 막다른 틈에 끼였다)
   * 걸을 수 있는 칸을 반지름 0.3m 원으로 깎았다가 다시 불린다(열기 · opening) · 폭 0.6m(몸 둘레 포함 실제 약 1.2m)보다 좁은 막다른 틈만 막히고 넓은 길은 그대로 · 모서리가 조금 둥글어진다 */
  function openFree(k) {
    var N = GW * GH, er = new Uint8Array(N), keep = new Uint8Array(N), offs = [], filled = 0;
    for (var dj = -k; dj <= k; dj++) for (var di = -k; di <= k; di++) if (di * di + dj * dj <= k * k + 1) offs.push([di, dj]);
    for (var j = k; j < GH - k; j++) for (var i = k; i < GW - k; i++) { var c = j * GW + i; if (wd[c]) continue; var ok = true; for (var q = 0; q < offs.length; q++) if (wd[c + offs[q][1] * GW + offs[q][0]]) { ok = false; break; } if (ok) er[c] = 1; }
    for (var j2 = k; j2 < GH - k; j2++) for (var i2 = k; i2 < GW - k; i2++) { var c2 = j2 * GW + i2; if (!er[c2]) continue; for (var q2 = 0; q2 < offs.length; q2++) keep[c2 + offs[q2][1] * GW + offs[q2][0]] = 1; }
    for (var c3 = 0; c3 < N; c3++) if (!wd[c3] && !keep[c3]) { wd[c3] = 1; filled++; }
    G.slotFill = filled;
  }
  function flood(x, z) {
    if (G.slotFill == null) openFree(3);
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
  /* v5.40 걷기 = 벽을 따라 미끄러짐(사용자 261003 「이상하게 중간에 끼이는 것 같아」 · 끼임 봇: 옛 방식은 부스 모서리 · 기둥 · 스태프 · 회전문처럼 둥근 둘레에서 멈췄다)
   * 한 걸음을 0.05m 로 쪼개 본다(달리기 2배에도 벽 · 스태프를 뚫지 않는다) · 막히면 그 자리 벽의 바깥 방향(둘레 16점 중 막힌 점의 반대 쪽 합)을 구해 벽과 나란한 몫만큼 미끄러진다
   * 둥근 것(회전문 2 · 스태프 · 타자왕 TV)을 정면으로 밀면 가까운 쪽으로 비켜 돈다(정면 몫이 작아도 절반 속도) · 그래도 막히면 옛 방식(한 축만) · 끝까지 막히면 그 자리 */
  var RING16 = [], ROUND = [];
  for (var rk = 0; rk < 16; rk++) RING16.push([Math.cos(rk * Math.PI / 8), Math.sin(rk * Math.PI / 8)]);
  function wallN(x, z) {
    var nx = 0, nz = 0, hit = 0;
    for (var k = 0; k < 16; k++) { var c = RING16[k]; if (!free(x + c[0] * 0.14, z + c[1] * 0.14)) { nx -= c[0]; nz -= c[1]; hit++; } }
    var L = Math.hypot(nx, nz); return hit && L > 1e-6 ? [nx / L, nz / L] : null;
  }
  function roundAt(x, z) {
    for (var k = 0; k < ROUND.length; k++) { var r = ROUND[k]; if (Math.hypot(x - r.x, z - r.z) < r.r + 0.25) return r; }
    for (var g = 0; g < guides.length; g++) { var a = guides[g].at; if (Math.hypot(x - a[0], z - a[1]) < GUIDE_R + 0.25) return guides[g].rd || (guides[g].rd = { x: a[0], z: a[1], r: GUIDE_R }); }
    return null;
  }
  function slideStep(px, pz, ux, uz, s) {
    var rd = roundAt(px, pz), w;
    if (rd) { var dx = px - rd.x, dz = pz - rd.z, dl = Math.hypot(dx, dz) || 1; w = [dx / dl, dz / dl]; } else w = wallN(px, pz);
    if (w) {
      var dot = ux * w[0] + uz * w[1];
      if (dot < 0) {
        var sx = ux - dot * w[0], sz = uz - dot * w[1], sl = Math.hypot(sx, sz);
        if (rd && sl < 0.5) {   /* 둥근 것 정면 · 접선 쪽(조금이라도 기운 쪽 · 없으면 지난번 쪽)으로 절반 속도 */
          var tx0 = -w[1], tz0 = w[0], sg = sl > 0.03 ? (sx * tx0 + sz * tz0 >= 0 ? 1 : -1) : (rd.side || 1);
          rd.side = sg; sx = tx0 * sg * 0.5; sz = tz0 * sg * 0.5; sl = 0.5;
        }
        if (sl > 0.02) {
          var cand = [[px + sx * s, pz + sz * s], [px + sx * s + w[0] * s * 0.6, pz + sz * s + w[1] * s * 0.6], [px + sx * s * 0.5, pz + sz * s * 0.5]];
          if (rd) {   /* 둥근 것 = 막힌 칸 바깥(반지름 + 칸 반 대각 0.075) 원 위로 옮겨 계단에 걸리지 않게 */
            var qx = px + sx * s - rd.x, qz = pz + sz * s - rd.z, ql = Math.hypot(qx, qz) || 1, rr = Math.max(ql, rd.r + 0.075);
            cand.unshift([rd.x + qx / ql * rr, rd.z + qz / ql * rr]);
          }
          for (var i = 0; i < cand.length; i++) if (free(cand[i][0], cand[i][1])) return cand[i];
        }
      }
    }
    var tx = px + ux * s, tz = pz + uz * s;
    if (free(tx, pz)) return [tx, pz];
    if (free(px, tz)) return [px, tz];
    return null;
  }
  function moveStep(x, z, ux, uz, d) {
    var n = Math.max(1, Math.ceil(d / 0.05)), s = d / n, px = x, pz = z, moved = 0;
    for (var i = 0; i < n; i++) {
      var tx = px + ux * s, tz = pz + uz * s;
      if (!free(tx, tz)) { var q = slideStep(px, pz, ux, uz, s); if (!q) break; tx = q[0]; tz = q[1]; }
      moved += Math.hypot(tx - px, tz - pz); px = tx; pz = tz;
    }
    return [px, pz, moved];
  }
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

  /* ═══════════ 겹친 면 깜빡임 막기(v5.38 · 사용자 261003 갤럭시 「안내데스크 자리에서 까만 색이 팔랄라락 깜빡」) ═══════════
   * 원인: 모형(lobby.glb) 안에 같은 평면에 겹쳐 붙은 면이 있다(안내데스크 윗면 · 끝면 · 부스 앞면과 그 위 판 등 · 0~2mm 차이)
   *   깊이 값이 같아 어느 쪽이 그려질지 기기 · 시점마다 바뀐다(z-fighting) · 데스크톱 GPU 는 우연히 한쪽만 이기고, 휴대폰 GPU 는 프레임마다 뒤집힌다
   * 고침: 받은 뒤 축에 나란한 삼각형을 평면(4mm 안)별로 모아 실제로 겹치는 쌍을 찾고, 작은 쪽(판 · 띠 같은 덧붙임)을 따로 떼어 polygonOffset 으로 늘 앞에 그린다
   *   모형을 다시 굽지 않는다 · 모형이 바뀌어도 저절로 따라온다 · 투명(유리) · 바닥 · 기둥은 건드리지 않는다 · 결과 = G.zfix */
  function polyArea(P) { var s2 = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; s2 += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s2) / 2; }
  function clipTri(P, Q) {
    for (var e = 0; e < 3 && P.length; e++) {
      var a = Q[e], b = Q[(e + 1) % 3], out = [];
      for (var i = 0; i < P.length; i++) {
        var c = P[i], n = P[(i + 1) % P.length], sc = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), sn = (b[0] - a[0]) * (n[1] - a[1]) - (b[1] - a[1]) * (n[0] - a[0]);
        if (sc >= 0) out.push(c);
        if ((sc >= 0) !== (sn >= 0)) { var t = sc / (sc - sn); out.push([c[0] + (n[0] - c[0]) * t, c[1] + (n[1] - c[1]) * t]); }
      }
      P = out;
    }
    return P.length > 2 ? P : [];
  }
  function isCw(p) { return ((p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0])) < 0; }
  function nameOf(o, re) { while (o) { if (o.name && re.test(o.name)) return o.name; o = o.parent; } return null; }
  /* v5.44 겹친 면 = 가려지는 부분을 잘라 낸다(사용자 261003 갤럭시 v5.43 「깜빡이는 여전해 · 하단에 까만 줄이 있어」)
   *   원인(실측 · 깊이 정밀도가 아니었다): 판 · 덧붙인 면 뒤에 겹쳐 남은 면은 굽는 동안 덮여 라이트맵이 까맣다(0)
   *     v5.40 이 앞 층을 5mm(기둥 포스터 8mm) 띄우자 위에서 내려다보는 시점마다 판 아래 · 판 사이로 그 까만 띠가 드러났다(판 아래 검은 줄)
   *     + 라이트맵 아틀라스 섬 둘레의 검은 여백이 쌍선형 보간으로 판 가장자리에 1~3px 검은 줄로 번졌다 · 가는 줄이라 걸을 때마다 화소가 켜졌다 꺼졌다(깜빡임)
   *   고침: 1) 띄우지 않는다 · 진 면에서 이긴 면이 덮는 부분을 잘라 낸다(다 덮이면 면을 지운다) · 이긴 면 둘레 0.3mm 만 겹쳐 두고 이긴 면은 polygonOffset 으로 앞
   *         순환(A > B > C > A)도 「이긴 면의 지금 남은 조각」만 빼므로 어느 자리도 비지 않는다 · 기둥 포스터도 같은 방식(기둥 화강암을 잘라 냄)
   *      2) 둘 다 까만 겹침(안내데스크 끝 윗면처럼 서로 덮여 둘 다 까맣게 구워진 면)은 이긴 면의 라이트맵 자리를 진 면의 밝은 자리로 옮긴다
   *      3) fixLightmaps · 그려지는 삼각형이 덮는 화소만 「쓸 수 있음」 · 섬 밖 검은 여백 · 잘려 나간 자리 · 2px 보다 가는 잘린 조각은 가까운 쓸 수 있는 화소 색으로 24px 까지 채움 · 밉맵 켬 */
  var ZTOL = 0.01, ZLIFT = 0.015, CUT_EPS = 0.0003, LM_PATCH = [];
  /* v5.42 정점 위치를 고치기 전에 소수(Float32) 사본으로 · 모형은 압축(양자화 Int16 · normalized)이라 범위 끝 정점을 바깥으로 밀면 값이 넘쳐 반대쪽 끝으로 뒤집혔다 */
  function f32Pos(a) {
    if (a.array instanceof Float32Array && !a.isInterleavedBufferAttribute && !a.normalized) return a.clone();
    var n = a.count, arr = new Float32Array(n * 3); for (var i = 0; i < n; i++) { arr[i * 3] = a.getX(i); arr[i * 3 + 1] = a.getY(i); arr[i * 3 + 2] = a.getZ(i); }
    G.f32n = (G.f32n || 0) + 1; return new T.BufferAttribute(arr, 3);
  }
  function f32Arr(a) { var n = a.count, k = a.itemSize, arr = new Array(n * k); for (var i = 0; i < n; i++) { arr[i * k] = a.getX(i); if (k > 1) arr[i * k + 1] = a.getY(i); if (k > 2) arr[i * k + 2] = a.getZ(i); if (k > 3) arr[i * k + 3] = a.getW(i); } return arr; }
  function sArea(P) { var s2 = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; s2 += a[0] * b[1] - b[0] * a[1]; } return s2 / 2; }
  function halfClip(P, a, b, inside) {   /* 볼록 다각형 P 를 a → b 직선의 왼쪽(inside) 또는 오른쪽만 남긴다 */
    var out = [];
    for (var i = 0; i < P.length; i++) {
      var c = P[i], n = P[(i + 1) % P.length], sc = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), sn = (b[0] - a[0]) * (n[1] - a[1]) - (b[1] - a[1]) * (n[0] - a[0]);
      if (!inside) { sc = -sc; sn = -sn; }
      if (sc >= 0) out.push(c);
      if ((sc >= 0) !== (sn >= 0)) { var t = sc / (sc - sn); out.push([c[0] + (n[0] - c[0]) * t, c[1] + (n[1] - c[1]) * t]); }
    }
    return out.length > 2 ? out : [];
  }
  /* 볼록 P 빼기 볼록 Q(둘 다 반시계) = Q 의 변마다 바깥쪽 조각 · 안쪽은 다음 변으로 넘긴다 · 끝까지 남은 안쪽 = Q 안 = 버림 */
  function polyDiff(P, Q) { var out = [], rest = P; for (var e = 0; e < Q.length && rest.length; e++) { var a = Q[e], b = Q[(e + 1) % Q.length], o = halfClip(rest, a, b, false); if (o.length && polyArea(o) > 1e-10) out.push(o); rest = halfClip(rest, a, b, true); } return out; }
  /* 반시계 볼록 다각형을 안쪽으로 d 만큼 줄인다(진 면이 이긴 면 밑으로 d 만큼 남아 틈이 생기지 않게) · 뒤집히면 null */
  function shrinkPoly(Q, d) {
    var n = Q.length, L = [], out = [];
    for (var i = 0; i < n; i++) { var a = Q[i], b = Q[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); if (l < 1e-7) return null; L.push([a[0] - dy / l * d, a[1] + dx / l * d, dx, dy]); }
    for (var j = 0; j < n; j++) { var p = L[(j + n - 1) % n], q = L[j], den = p[2] * q[3] - p[3] * q[2]; if (Math.abs(den) < 1e-14) return null; var s = ((q[0] - p[0]) * q[3] - (q[1] - p[1]) * q[2]) / den; out.push([p[0] + p[2] * s, p[1] + p[3] * s]); }
    return sArea(out) > 1e-9 ? out : null;
  }
  function fixCoplanar(root) {
    var t0 = performance.now(), meshes = [], buckets = new Map(), recs = [], geoUse = new Map(), va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3(), nn = new T.Vector3(), nTri = 0, bu = new T.Vector3(), bv = new T.Vector3();
    root.updateMatrixWorld(true);
    var lifted = liftFloorPlates(root);
    root.updateMatrixWorld(true);
    root.traverse(function (o) { if (o.isMesh && o.geometry) geoUse.set(o.geometry, (geoUse.get(o.geometry) || 0) + 1); });
    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || !o.material || Array.isArray(o.material) || o.material.transparent) return;
      if (/^(floor|paving)$/.test(o.name) || geoUse.get(o.geometry) > 1) return;   /* 바닥 = 큰 판 하나(위에 깔린 판은 liftFloorPlates) · 같은 모양을 여럿이 쓰는 메시는 자르지 않는다 · v5.44 기둥 · 기둥 포스터도 넣는다 */
      var geo = o.geometry, pos = geo.attributes.position, idx = geo.index, n = idx ? idx.count : pos.count, m = o.matrixWorld, mi = meshes.length; meshes.push(o);
      for (var t = 0; t < n; t += 3) {
        va.fromBufferAttribute(pos, idx ? idx.getX(t) : t).applyMatrix4(m); vb.fromBufferAttribute(pos, idx ? idx.getX(t + 1) : t + 1).applyMatrix4(m); vc.fromBufferAttribute(pos, idx ? idx.getX(t + 2) : t + 2).applyMatrix4(m);
        e1.subVectors(vb, va); e2.subVectors(vc, va); nn.crossVectors(e1, e2); var ar = nn.length() / 2; if (ar < 1e-6) continue; nn.multiplyScalar(0.5 / ar);
        var ax = Math.abs(nn.x) > 0.999 ? 0 : Math.abs(nn.y) > 0.999 ? 1 : Math.abs(nn.z) > 0.999 ? 2 : -1, P, off, key, sg, nw;
        if (ax >= 0) {
          var u = (ax + 1) % 3, v = (ax + 2) % 3; sg = nn.getComponent(ax) > 0 ? 1 : -1;
          P = [[va.getComponent(u), va.getComponent(v)], [vb.getComponent(u), vb.getComponent(v)], [vc.getComponent(u), vc.getComponent(v)]];
          off = (va.getComponent(ax) + vb.getComponent(ax) + vc.getComponent(ax)) / 3 * sg; key = ax + ',' + sg; nw = [ax === 0 ? sg : 0, ax === 1 ? sg : 0, ax === 2 ? sg : 0];
        } else {   /* 비스듬한 면 · 법선을 2도 단위로 묶고 그 평면 위 두 축으로 편다 */
          var qx = Math.round(nn.x * 30), qy = Math.round(nn.y * 30), qz = Math.round(nn.z * 30), ql = Math.hypot(qx, qy, qz) || 1;
          nw = [qx / ql, qy / ql, qz / ql]; bu.set(nw[0], nw[1], nw[2]); bv.set(Math.abs(nw[1]) < 0.9 ? 0 : 1, Math.abs(nw[1]) < 0.9 ? 1 : 0, 0).cross(bu).normalize(); var bw = new T.Vector3().crossVectors(bu, bv);
          P = [[va.dot(bv), va.dot(bw)], [vb.dot(bv), vb.dot(bw)], [vc.dot(bv), vc.dot(bw)]];
          off = (va.dot(bu) + vb.dot(bu) + vc.dot(bu)) / 3; key = 'g' + qx + ',' + qy + ',' + qz; sg = 1;
        }
        var flip = isCw(P); if (flip) P = [P[0], P[2], P[1]];
        var r = { mi: mi, t: t, off: off, ar: ar, P: P, flip: flip, lv: 0, nw: nw, pieces: null, cut: false, relm: null,
          u0: Math.min(P[0][0], P[1][0], P[2][0]), u1: Math.max(P[0][0], P[1][0], P[2][0]), v0: Math.min(P[0][1], P[1][1], P[2][1]), v1: Math.max(P[0][1], P[1][1], P[2][1]) };
        key += ',' + Math.round(off / ZTOL);
        if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(r); recs.push(r); nTri++;
      }
    });
    /* 이기는 쪽 = 구운 빛(라이트맵)이 밝은 면 · 굽는 동안 다른 면에 덮여 있던 면은 라이트맵이 까맣다 · 밝기가 비슷하면 작은 면(덧붙인 판) */
    var cvs = document.createElement('canvas'), cx2 = cvs.getContext('2d', { willReadFrequently: true }), imgs = new Map();
    function lmPt(r, q) {   /* 평면 좌표 q 자리의 라이트맵 [밝기, u, v] · 삼각형 무게중심 좌표로 UV1 을 보간 · 없으면 null */
      var o = meshes[r.mi], tex = o.material.lightMap, uv = o.geometry.attributes.uv1, idx = o.geometry.index;
      if (!tex || !tex.image || !uv || !tex.image.width) return null;
      try {
        var im = tex.image, d = imgs.get(im);
        if (!d) { cvs.width = im.width; cvs.height = im.height; cx2.drawImage(im, 0, 0); d = cx2.getImageData(0, 0, im.width, im.height); imgs.set(im, d); }
        var vi = [idx ? idx.getX(r.t) : r.t, idx ? idx.getX(r.t + 1) : r.t + 1, idx ? idx.getX(r.t + 2) : r.t + 2];
        if (r.flip) vi = [vi[0], vi[2], vi[1]];   /* 위(isCw)에서 뒤집은 순서와 맞춘다 */
        var A = r.P[0], B = r.P[1], C = r.P[2], den = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
        var w0 = ((B[1] - C[1]) * (q[0] - C[0]) + (C[0] - B[0]) * (q[1] - C[1])) / den, w1 = ((C[1] - A[1]) * (q[0] - C[0]) + (A[0] - C[0]) * (q[1] - C[1])) / den, w2 = 1 - w0 - w1;
        var u = w0 * uv.getX(vi[0]) + w1 * uv.getX(vi[1]) + w2 * uv.getX(vi[2]), v = w0 * uv.getY(vi[0]) + w1 * uv.getY(vi[1]) + w2 * uv.getY(vi[2]), vv = tex.flipY ? 1 - v : v;
        var x = clamp(Math.floor(u * d.width), 0, d.width - 1), y = clamp(Math.floor(vv * d.height), 0, d.height - 1), i = (y * d.width + x) * 4;
        return [(d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3, u, v];
      } catch (e) { return null; }
    }
    function lmAt(r, pts) { var s = 0; for (var k = 0; k < pts.length; k++) { var q = lmPt(r, pts[k]); if (!q) return -1; s += q[0]; } return s / pts.length; }
    function inner(P) { var cu = 0, cv = 0; P.forEach(function (q) { cu += q[0] / P.length; cv += q[1] / P.length; }); return [[cu, cv]].concat(P.map(function (q) { return [(q[0] + cu) / 2, (q[1] + cv) / 2]; })); }
    var pairs = 0, plist = [];   /* plist = [이긴 면, 진 면, 이긴 쪽 밝기, 진 쪽 밝기] */
    function test(a, b) {
      if (Math.abs(a.off - b.off) > ZTOL || Math.min(a.u1, b.u1) - Math.max(a.u0, b.u0) <= 0.001 || Math.min(a.v1, b.v1) - Math.max(a.v0, b.v0) <= 0.001) return;
      var O = clipTri(a.P, b.P); if (O.length < 3 || polyArea(O) <= 2e-6) return;
      pairs++;
      var pts = inner(O), la = lmAt(a, pts), lb = lmAt(b, pts), w = null;
      var pa = !!nameOf(meshes[a.mi], /^panel_\d+$/), pb = !!nameOf(meshes[b.mi], /^panel_\d+$/);
      if (la >= 0 && lb >= 0 && Math.abs(la - lb) > 16) w = la > lb ? a : b;
      else if (pa !== pb) w = pa ? a : b;   /* v5.44 둘 다 비슷하게 까마면 판 그림이 앞(옛 순서는 작은 면이 먼저라 판 가장자리에 까만 몸체 띠가 섰다) */
      else if (Math.abs(a.ar - b.ar) > 1e-6) w = a.ar < b.ar ? a : b;
      else w = a.off >= b.off ? a : b;   /* 같은 메시 · 같은 넓이 = 이미 앞에 있는 쪽 */
      if (w) plist.push([w, w === a ? b : a, w === a ? la : lb, w === a ? lb : la, O]);
      if (window.__zdbg) window.__zdbg.push([meshes[a.mi].name, meshes[b.mi].name, +a.off.toFixed(3), Math.round(la), Math.round(lb), +a.ar.toFixed(3), +b.ar.toFixed(3), w === a ? 'a' : w === b ? 'b' : '-', O[0].map(function (v) { return +v.toFixed(2); })]);   /* 시험용 · window.__zdbg 가 있을 때만 */
    }
    buckets.forEach(function (L, key) {
      var k = key.split(','), last = +k.pop(), up = buckets.get(k.join(',') + ',' + (last + 1)) || [];
      for (var i = 0; i < L.length; i++) { for (var j = i + 1; j < L.length; j++) test(L[i], L[j]); for (var q = 0; q < up.length; q++) test(L[i], up[q]); }
    });
    /* 자르기 · 쌍마다 진 면의 지금 조각들에서 이긴 면의 지금 조각(둘레를 0.3mm 줄인 것)을 뺀다 · 이긴 면의 「지금」 조각만 빼므로 겹친 자리는 늘 누군가 덮는다 */
    var gone = 0, cut = 0;
    plist.forEach(function (q) {
      var w = q[0], l = q[1], wp = w.pieces || [w.P], lp = l.pieces || [l.P], ch = false;
      wp.forEach(function (Q) {
        var Qs = shrinkPoly(Q, CUT_EPS); if (!Qs || !lp.length) return;
        var nx = [];
        lp.forEach(function (p) { var d = polyDiff(p, Qs), a1 = 0; d.forEach(function (x) { a1 += polyArea(x); }); if (a1 < polyArea(p) - 1e-9) { ch = true; nx.push.apply(nx, d); } else nx.push(p); });
        lp = nx;
      });
      if (ch) { l.pieces = lp; l.cut = true; }
    });
    recs.forEach(function (r) { if (r.cut) { cut++; if (!r.pieces.length) gone++; } });
    /* 둘 다 까만 겹침(< 24) · 이긴 면 일부만 까마면 그 겹친 자리를 라이트맵 「다시 칠할 곳」으로 적어 둔다(fixLightmaps 가 둘레 밝은 화소로 채움)
     * 이긴 면 삼각형 전체가 까말 때(< 20)는 진 면의 남은 조각 중 밝은(> 60) 자리 가운데 이긴 면에 가장 가까운 자리로 라이트맵 UV 를 옮긴다(한 색) */
    var relit = 0, patched = 0;
    plist.forEach(function (q) {
      var w = q[0], l = q[1]; if (w.relm || q[2] < 0 || q[3] < 0 || Math.max(q[2], q[3]) >= 24) return;
      var lw = meshes[w.mi].material.lightMap, ll = meshes[l.mi].material.lightMap; if (!lw) return;
      if (lmAt(w, inner(w.P)) >= 20) {
        var tri = q[4].map(function (s) { var x = lmPt(w, s); return x ? [x[1] * lw.image.width, (lw.flipY ? 1 - x[2] : x[2]) * lw.image.height] : null; });
        if (tri.every(Boolean)) { LM_PATCH.push({ im: lw.image, poly: tri }); patched++; }
        return;
      }
      if (!ll || lw.image !== ll.image) return;
      var c = inner(w.P)[0], best = null, bd = 1e9;
      (l.pieces || [l.P]).forEach(function (p) { inner(p).forEach(function (s) { var x = lmPt(l, s); if (!x || x[0] <= 60) return; var dd = Math.hypot(s[0] - c[0], s[1] - c[1]); if (dd < bd) { bd = dd; best = x; } }); });
      if (best) { w.relm = [best[1], best[2]]; relit++; }
    });
    /* 층 매기기 · 이긴 면은 진 면보다 한 층 위(사슬도 · 최대 3층) · 앞 층 = polygonOffset(남은 0.3mm 겹침만 가린다 · 정점은 옮기지 않는다) */
    for (var it = 0; it < 4; it++) plist.forEach(function (q) { var lw = q[0].lv || 0, ll = q[1].lv || 0; if (lw <= ll && ll < 3) q[0].lv = ll + 1; });
    var tie = plist.filter(function (q) { return (q[0].lv || 0) <= (q[1].lv || 0); }).length;
    var byMesh = new Map(); recs.forEach(function (r) { if (!byMesh.has(r.mi)) byMesh.set(r.mi, new Map()); byMesh.get(r.mi).set(r.t, r); });
    var moved = 0, added = 0, matC = new Map(), names = [], picks = S.picks;
    byMesh.forEach(function (rm, mi) {
      var o = meshes[mi], geo = o.geometry, idx = geo.index, n = idx ? idx.count : geo.attributes.position.count, re = false, lvs = false;
      rm.forEach(function (r) { if (r.cut || r.relm) re = true; if (r.lv) lvs = true; });
      if (!re && !lvs) return;
      var lists = {}, flags = {}, A = null, cnt = geo.attributes.position.count, keys = Object.keys(geo.attributes);
      if (re) { A = {}; keys.forEach(function (nm) { A[nm] = f32Arr(geo.attributes[nm]); }); }
      for (var t = 0; t < n; t += 3) {
        var r = rm.get(t), lv = r && r.lv ? r.lv : 0, L = lists[lv] || (lists[lv] = []), F = flags[lv] || (flags[lv] = []), vi = [idx ? idx.getX(t) : t, idx ? idx.getX(t + 1) : t + 1, idx ? idx.getX(t + 2) : t + 2];
        if (!re || !r || (!r.cut && !r.relm)) { L.push(vi[0], vi[1], vi[2]); F.push(0); continue; }
        var vo = r.flip ? [vi[0], vi[2], vi[1]] : vi, Pa = r.P[0], Pb = r.P[1], Pc = r.P[2], den = (Pb[1] - Pc[1]) * (Pa[0] - Pc[0]) + (Pc[0] - Pb[0]) * (Pa[1] - Pc[1]);
        (r.cut ? r.pieces : [r.P]).forEach(function (pc) {
          var ids = pc.map(function (q) {
            var w0 = ((Pb[1] - Pc[1]) * (q[0] - Pc[0]) + (Pc[0] - Pb[0]) * (q[1] - Pc[1])) / den, w1 = ((Pc[1] - Pa[1]) * (q[0] - Pc[0]) + (Pa[0] - Pc[0]) * (q[1] - Pc[1])) / den, w2 = 1 - w0 - w1;
            keys.forEach(function (nm) {
              var k = geo.attributes[nm].itemSize, ar = A[nm];
              for (var j = 0; j < k; j++) ar.push(nm === 'uv1' && r.relm ? r.relm[j] : w0 * ar[vo[0] * k + j] + w1 * ar[vo[1] * k + j] + w2 * ar[vo[2] * k + j]);
            });
            added++; return cnt++;
          });
          for (var k = 1; k + 1 < ids.length; k++) { if (r.flip) L.push(ids[0], ids[k + 1], ids[k]); else L.push(ids[0], ids[k], ids[k + 1]); F.push(r.cut ? 1 : 0); }
        });
      }
      var g2 = geo;
      if (re) {
        g2 = new T.BufferGeometry(); keys.forEach(function (nm) { g2.setAttribute(nm, new T.BufferAttribute(new Float32Array(A[nm]), geo.attributes[nm].itemSize)); });
        g2.setIndex(lists[0] || []); g2.userData.cutF = flags[0] || []; g2.computeBoundingSphere(); g2.computeBoundingBox(); o.geometry = g2; geo.dispose();
      } else { geo.setIndex(lists[0] || []); }
      Object.keys(lists).forEach(function (k) {
        var lv = +k; if (!lv) return;
        var g3 = new T.BufferGeometry(); keys.forEach(function (nm) { g3.setAttribute(nm, g2.attributes[nm]); }); g3.setIndex(lists[k]); g3.userData.cutF = flags[k]; g3.computeBoundingSphere(); g3.computeBoundingBox();
        var m0 = o.material, mk = m0.uuid + ':' + lv, m2 = matC.get(mk);
        if (!m2) { m2 = m0.clone(); m2.polygonOffset = true; m2.polygonOffsetFactor = -1; m2.polygonOffsetUnits = -1; matC.set(mk, m2); }   /* 앞뒤는 잘라 낸 모양이 정한다 · polygonOffset 은 둘레 0.3mm 겹침만 */
        var f = new T.Mesh(g3, m2); f.name = o.name + '_front' + lv; f.userData = o.userData; f.matrixAutoUpdate = false; f.matrix.copy(o.matrix); o.parent.add(f); f.updateMatrixWorld(true);
        if (picks && picks.indexOf(o) >= 0) picks.push(f);   /* 판을 누르면 앞 층도 판 */
        moved += lists[k].length / 3;
      });
      if (names.indexOf(o.name) < 0) names.push(o.name);
    });
    G.zfix = { tris: nTri, pairs: pairs, same: pairs - plist.length, tie: tie, cut: cut, gone: gone, relit: relit, patched: patched, added: added, moved: moved, lifted: lifted, meshes: names, ms: Math.round(performance.now() - t0) };
  }
  /* v5.44 라이트맵 고치기 · 아틀라스마다 그려지는 삼각형이 덮는 화소(가운데 점 기준)만 「쓸 수 있음」 · 나머지는 가까운 쓸 수 있는 화소 색으로 24px 까지 채운다(8방향 너비 우선)
   *   섬 밖 검은 여백(판 가장자리 검은 줄) · 잘려 나간 자리(가려졌던 까만 면) · 2px 보다 가는 잘린 조각(판 사이 틈)이 모두 둘레 색이 된다 · 그다음 밉맵(멀리서 가는 줄이 깜빡이지 않게) */
  function fixLightmaps(root) {
    var t0 = performance.now(), groups = new Map(), filled = 0, nTex = 0, eroded = 0;
    root.traverse(function (o) {
      if (!o.isMesh || !o.material || Array.isArray(o.material) || !o.material.lightMap || !o.geometry || !o.geometry.attributes.uv1) return;
      var tx = o.material.lightMap, im = tx.image; if (!im || !im.width) return;
      if (!groups.has(im)) groups.set(im, { tex: [], ms: [] }); var g = groups.get(im); if (g.tex.indexOf(tx) < 0) g.tex.push(tx); g.ms.push(o);
    });
    groups.forEach(function (g, im) {
      try {
        var W = im.width, H = im.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        var cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0);
        var d = cx.getImageData(0, 0, W, H), px = d.data, ok = new Uint8Array(W * H), fy = g.tex[0].flipY, pan = g.ms.every(function (o) { return /^panel_\d+/.test(o.name); }), lab = pan ? new Uint16Array(W * H) : null;
        g.ms.forEach(function (o) {
          var LB = pan ? +o.name.match(/^panel_(\d+)/)[1] + 1 : 0;
          var geo = o.geometry, uv = geo.attributes.uv1, idx = geo.index, n = idx ? idx.count : uv.count, cf = geo.userData.cutF;
          for (var t = 0, k = 0; t < n; t += 3, k++) {
            var ia = idx ? idx.getX(t) : t, ib = idx ? idx.getX(t + 1) : t + 1, ic = idx ? idx.getX(t + 2) : t + 2;
            var ax = uv.getX(ia) * W, ay = (fy ? 1 - uv.getY(ia) : uv.getY(ia)) * H, bx = uv.getX(ib) * W, by = (fy ? 1 - uv.getY(ib) : uv.getY(ib)) * H, cx_ = uv.getX(ic) * W, cy = (fy ? 1 - uv.getY(ic) : uv.getY(ic)) * H;
            var ar2 = (bx - ax) * (cy - ay) - (by - ay) * (cx_ - ax); if (Math.abs(ar2) < 1e-9) continue;
            if (cf && cf[k] && Math.abs(ar2) / Math.max(Math.hypot(bx - ax, by - ay), Math.hypot(cx_ - bx, cy - by), Math.hypot(ax - cx_, ay - cy)) < 2) { var mi = (clamp(Math.floor((ay + by + cy) / 3), 0, H - 1) * W + clamp(Math.floor((ax + bx + cx_) / 3), 0, W - 1)) * 4; if (px[mi] + px[mi + 1] + px[mi + 2] < 120) continue; }   /* 2px 보다 가늘고 까만 잘린 조각(판 사이 틈 등)은 둘레 색으로 · 밝은 조각(가는 기둥 앞면)은 그대로 */
            var s = ar2 > 0 ? 1 : -1, x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx_))), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx_))), y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy)));
            for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
              var qx = x + 0.5, qy = y + 0.5;
              if (s * ((bx - ax) * (qy - ay) - (by - ay) * (qx - ax)) >= 0 && s * ((cx_ - bx) * (qy - by) - (cy - by) * (qx - bx)) >= 0 && s * ((ax - cx_) * (qy - cy) - (ay - cy) * (qx - cx_)) >= 0) { ok[y * W + x] = 1; if (lab) lab[y * W + x] = LB; }
            }
          }
        });
        LM_PATCH.forEach(function (pt) {   /* 둘 다 까맣게 구워진 겹침 자리 = 다시 칠할 곳 */
          if (pt.im !== im) return; var P2 = pt.poly, x0 = Math.max(0, Math.floor(Math.min.apply(null, P2.map(function (q) { return q[0]; })))), x1 = Math.min(W - 1, Math.ceil(Math.max.apply(null, P2.map(function (q) { return q[0]; })))), y0 = Math.max(0, Math.floor(Math.min.apply(null, P2.map(function (q) { return q[1]; })))), y1 = Math.min(H - 1, Math.ceil(Math.max.apply(null, P2.map(function (q) { return q[1]; })))), sg = sArea(P2) > 0 ? 1 : -1;
          for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) { var inside = true; for (var e = 0; e < P2.length && inside; e++) { var a = P2[e], b = P2[(e + 1) % P2.length]; if (sg * ((b[0] - a[0]) * (y + 0.5 - a[1]) - (b[1] - a[1]) * (x + 0.5 - a[0])) < 0) inside = false; } if (inside && ok[y * W + x] === 1) ok[y * W + x] = 0; }
        });
        /* v5.44 판 아틀라스만(모든 사용자가 panel_*) · 판 섬 가장자리 한 줄이 굽기에서 까맣게 남았다(판 위 · 아래 끝 검은 줄) · 같은 판의 2칸 안 안쪽 화소 색으로 바꾼다 */
        if (lab) {
          var edge = new Uint8Array(W * H);
          for (var y3 = 0; y3 < H; y3++) for (var x3 = 0; x3 < W; x3++) { var c3 = y3 * W + x3; if (ok[c3] !== 1) continue; for (var dy3 = -1; dy3 <= 1 && !edge[c3]; dy3++) for (var dx3 = -1; dx3 <= 1; dx3++) { var xx3 = x3 + dx3, yy3 = y3 + dy3; if (xx3 < 0 || yy3 < 0 || xx3 >= W || yy3 >= H || ok[yy3 * W + xx3] !== 1 || lab[yy3 * W + xx3] !== lab[c3]) { edge[c3] = 1; break; } } }
          for (var y4 = 0; y4 < H; y4++) for (var x4 = 0; x4 < W; x4++) {
            var c4 = y4 * W + x4; if (!edge[c4]) continue;
            for (var rr = 1, fd = -1; rr <= 2 && fd < 0; rr++) for (var dy4 = -rr; dy4 <= rr && fd < 0; dy4++) for (var dx4 = -rr; dx4 <= rr; dx4++) { var xx4 = x4 + dx4, yy4 = y4 + dy4, n4 = yy4 * W + xx4; if (xx4 >= 0 && yy4 >= 0 && xx4 < W && yy4 < H && ok[n4] === 1 && !edge[n4] && lab[n4] === lab[c4]) { fd = n4; break; } }
            if (fd >= 0) { px[c4 * 4] = px[fd * 4]; px[c4 * 4 + 1] = px[fd * 4 + 1]; px[c4 * 4 + 2] = px[fd * 4 + 2]; eroded++; }
          }
        }
        var qu = new Int32Array(W * H), dist = new Uint8Array(W * H), h = 0, tl = 0;
        for (var i = 0; i < W * H; i++) if (ok[i]) qu[tl++] = i;
        if (!tl) return;
        while (h < tl) {
          var c = qu[h++], dc = dist[c]; if (dc >= 24) continue;
          var x2 = c % W, y2 = (c / W) | 0;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            var xx = x2 + dx, yy = y2 + dy; if ((!dx && !dy) || xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
            var nb = yy * W + xx; if (ok[nb]) continue;
            ok[nb] = 2; dist[nb] = dc + 1; px[nb * 4] = px[c * 4]; px[nb * 4 + 1] = px[c * 4 + 1]; px[nb * 4 + 2] = px[c * 4 + 2]; px[nb * 4 + 3] = 255; qu[tl++] = nb; filled++;
          }
        }
        cx.putImageData(d, 0, 0);
        g.tex.forEach(function (tx) { tx.image = cv; tx.minFilter = T.LinearMipmapLinearFilter; tx.generateMipmaps = true; tx.needsUpdate = true; });
        nTex++;
      } catch (e) { G.lmErr = String(e && e.message || e); }
    });
    G.lmfix = { tex: nTex, filled: filled, eroded: eroded, patch: LM_PATCH.length, ms: Math.round(performance.now() - t0) };
  }
  /* 바닥에 깔린 얇은 판 띄우기 · 바닥(floor · paving · base)이 아닌 메시에서 위를 보는 면 중 세 꼭짓점이 바닥 위 -0.5~3cm 인 것 + 같은 자리의 옆면 꼭짓점 → ZLIFT 만큼 위로 */
  function liftFloorPlates(root) {
    var va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3(), nn = new T.Vector3(), cnt = 0, done = new Set();
    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || /^(floor|paving|base)$/.test(o.name) || underName(o, /^ceiling$/) || done.has(o.geometry)) return;
      done.add(o.geometry);
      var geo = o.geometry, pos = geo.attributes.position, idx = geo.index, n = idx ? idx.count : pos.count, m = o.matrixWorld, hit = new Set(), keys = new Set();
      for (var t = 0; t < n; t += 3) {
        var ia = idx ? idx.getX(t) : t, ib = idx ? idx.getX(t + 1) : t + 1, ic = idx ? idx.getX(t + 2) : t + 2;
        va.fromBufferAttribute(pos, ia).applyMatrix4(m); vb.fromBufferAttribute(pos, ib).applyMatrix4(m); vc.fromBufferAttribute(pos, ic).applyMatrix4(m);
        if (Math.max(va.y, vb.y, vc.y) > 0.03 || Math.min(va.y, vb.y, vc.y) < -0.005) continue;
        e1.subVectors(vb, va); e2.subVectors(vc, va); nn.crossVectors(e1, e2).normalize(); if (nn.y < 0.99) continue;
        [ia, ib, ic].forEach(function (vi, k) { hit.add(vi); var w = k === 0 ? va : k === 1 ? vb : vc; keys.add(Math.round(w.x * 500) + ',' + Math.round(w.z * 500)); });
      }
      if (!hit.size) return;
      geo.setAttribute('position', f32Pos(pos)); pos = geo.attributes.position;
      var inv = new T.Matrix3().setFromMatrix4(m).invert(), dv = new T.Vector3(0, ZLIFT, 0).applyMatrix3(inv), vw = new T.Vector3();
      for (var i = 0; i < pos.count; i++) {
        if (!hit.has(i)) { vw.fromBufferAttribute(pos, i).applyMatrix4(m); if (vw.y > 0.03 || vw.y < -0.005 || !keys.has(Math.round(vw.x * 500) + ',' + Math.round(vw.z * 500))) continue; }
        pos.setXYZ(i, pos.getX(i) + dv.x, pos.getY(i) + dv.y, pos.getZ(i) + dv.z); cnt++;
      }
      pos.needsUpdate = true; geo.computeBoundingSphere(); geo.computeBoundingBox();
    });
    return cnt;
  }

  /* ═══════════ 정문(회전문) 또렷하게(v5.38 · 사용자 261003 「정문 유리문을 조금 더 표시 나게」) ═══════════
   * 모형의 회전문(도면 x 17.3 · z 1.5 · 반지름 1.85 · 유리 높이 2.45)은 거의 투명해 문인지 잘 안 보였다 · 모형 위에 덧붙인다(모형 그대로)
   * 먹색 금속 테(위 띠 · 바닥 문턱 원 · 세로 기둥 4) + 날개 4장(X 자 · 먹색 바깥 틀 · 손잡이 막대) + 아주 옅은 하늘빛 유리 + 은은한 세로 반사 + 1.05m 높이 점선 충돌 방지 띠 + 안쪽 바닥 매트
   * 남쪽 벽(side_s) 묶음에 넣어 카메라가 문 밖으로 나가면 벽과 함께 숨는다 · 걷기 지도(buildGrid) 뒤에 붙여 걸음은 그대로 · 투명은 깊이를 쓰지 않는다(깜빡임 없음) */
  function buildDoor() {
    var host = S.lobby.getObjectByName('side_s') || S.lobby, c = toThree(17.3, 1.5), R = 1.85, H = 2.45;
    var g = new T.Group(); g.name = 'doorA'; g.position.set(c.x, 0, c.z);
    var ink = new T.MeshBasicMaterial({ color: 0x2B3036 }), ink2 = new T.MeshBasicMaterial({ color: 0x2B3036, side: T.DoubleSide }), mat = new T.MeshBasicMaterial({ color: 0x3A3F45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 });
    var rc = document.createElement('canvas'); rc.width = 256; rc.height = 8; var rg = rc.getContext('2d'), gr = rg.createLinearGradient(0, 0, 256, 0);
    [[0, 0], [0.14, 0.55], [0.2, 0], [0.47, 0], [0.55, 0.35], [0.6, 0], [0.8, 0], [0.86, 0.45], [0.9, 0], [1, 0]].forEach(function (q) { gr.addColorStop(q[0], 'rgba(255,255,255,' + q[1] + ')'); });
    rg.fillStyle = gr; rg.fillRect(0, 0, 256, 8);
    var rt = new T.CanvasTexture(rc); rt.colorSpace = T.SRGBColorSpace; rt.wrapS = T.RepeatWrapping; rt.repeat.set(2, 1);
    var tint = new T.MeshBasicMaterial({ color: 0xDCEBF3, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide });
    var shine = new T.MeshBasicMaterial({ map: rt, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide });
    var drum = new T.Mesh(new T.CylinderGeometry(R + 0.012, R + 0.012, H - 0.06, 48, 1, true), tint); drum.position.y = (H - 0.06) / 2 + 0.03; g.add(drum);
    var gl2 = new T.Mesh(new T.CylinderGeometry(R + 0.016, R + 0.016, H - 0.06, 48, 1, true), shine); gl2.position.y = drum.position.y; g.add(gl2);
    /* 충돌 방지 띠 · 1.05m 높이 점선(먹색 짧은 막대 줄) */
    var dc = document.createElement('canvas'); dc.width = 64; dc.height = 8; var dg = dc.getContext('2d'); dg.fillStyle = 'rgba(43,48,54,.9)'; dg.fillRect(4, 1, 40, 6);
    var dtx = new T.CanvasTexture(dc); dtx.colorSpace = T.SRGBColorSpace; dtx.wrapS = T.RepeatWrapping; dtx.repeat.set(56, 1);
    var band = new T.Mesh(new T.CylinderGeometry(R + 0.02, R + 0.02, 0.06, 64, 1, true), new T.MeshBasicMaterial({ map: dtx, transparent: true, depthWrite: false, side: T.DoubleSide })); band.position.y = 1.05; g.add(band);
    /* 먹색 테 · 위 띠 · 바닥 문턱 원 · 세로 기둥 4(45도마다) */
    var top = new T.Mesh(new T.CylinderGeometry(R + 0.03, R + 0.03, 0.1, 48, 1, true), ink2); top.position.y = H - 0.05; g.add(top);
    var sill = new T.Mesh(new T.RingGeometry(R - 0.06, R + 0.07, 64), mat); sill.rotation.x = -Math.PI / 2; sill.position.y = 0.024; g.add(sill);
    [1, 3, 5, 7].forEach(function (k) { var a = k * Math.PI / 4, st = new T.Mesh(new T.BoxGeometry(0.07, H, 0.07), ink); st.position.set(Math.sin(a) * (R + 0.01), H / 2, Math.cos(a) * (R + 0.01)); g.add(st); });
    /* 날개 4장 · X 자 · 유리 + 먹색 바깥 틀 + 아래 틀 + 손잡이 막대(1.0m) */
    var post = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, H, 16), ink); post.position.y = H / 2; g.add(post);
    for (var k = 0; k < 4; k++) {
      var w = new T.Group(); w.rotation.y = Math.PI / 4 + k * Math.PI / 2; g.add(w);
      var L = R - 0.1, pane = new T.Mesh(new T.PlaneGeometry(L, H - 0.2), tint); pane.rotation.y = Math.PI / 2; pane.position.set(0, H / 2, L / 2 + 0.05); w.add(pane);
      var stile = new T.Mesh(new T.BoxGeometry(0.05, H - 0.1, 0.05), ink); stile.position.set(0, H / 2, L + 0.03); w.add(stile);
      var rail = new T.Mesh(new T.BoxGeometry(0.04, 0.05, L), ink); rail.position.set(0, 0.06, L / 2 + 0.05); w.add(rail);
      var bar = new T.Mesh(new T.BoxGeometry(0.1, 0.035, L * 0.55), ink); bar.position.set(0, 1.0, L * 0.6); w.add(bar);
    }
    /* 안쪽 바닥 매트(로비 쪽 · 문턱 바로 안) */
    var mt = new T.Mesh(new T.PlaneGeometry(2.4, 0.9), mat), mp = toThree(17.3, 1.5 + R + 0.55); mt.rotation.x = -Math.PI / 2; mt.position.set(mp.x - c.x, 0.02, mp.z - c.z);   /* v5.40 바닥에서 2cm(16비트 깊이) */ g.add(mt);
    g.traverse(function (o) { o.userData = { door: true }; });
    S.lobby.add(g); if (host !== S.lobby) { S.lobby.updateMatrixWorld(true); host.attach(g); }
    G.door = 0; g.traverse(function (o) { if (o.isMesh) G.door++; });
    /* v5.40 회전문 = 통째로 막힌 원(사용자 261003 「유리 회전문에는 물리 엔진이 적용 안 된 것 같아 · 중간에 끼인다」)
     * 모형 칸 지도는 유리 원통 · 날개 사이 네 칸이 열려 있어 캐릭터가 문 안으로 들어가 날개 사이에 갇혔다 · 원 + 몸 반지름(0.32)을 꽉 막고 둥근 것 목록에 넣어 정면으로 밀면 비켜 돈다
     * 동쪽 문 D(도면 32.6, 8.4 · 반지름 1.25)는 모형이 이미 막혀 있어 둥근 것 목록에만 넣는다 */
    blockDisc(17.3, 1.5, R + 0.42); blockDisc(32.6, 8.4, 1.25 + 0.4); ROUND.push({ x: 17.3, z: 1.5, r: R + 0.42 }, { x: 32.6, z: 8.4, r: 1.25 + 0.4 });   /* 원 = 유리 + 몸 0.32 + 칸 0.1(모형 유리 칸이 0.1m 계단으로 삐져나와 둘레를 돌 때 걸리던 것을 매끈한 원으로 덮음) */
    /* 동쪽 문 D 는 유리 원통이 거의 투명해 막힌 자리가 안 보였다(끼임 봇 · 보이지 않는 막힘) · 바닥 문턱 원 + 위 띠만 먹색으로 덧붙인다 */
    var hd = S.lobby.getObjectByName('side_e') || S.lobby, cd = toThree(32.6, 8.4), gd = new T.Group(); gd.name = 'doorD'; gd.position.set(cd.x, 0, cd.z);
    var sd = new T.Mesh(new T.RingGeometry(1.19, 1.32, 48), mat); sd.rotation.x = -Math.PI / 2; sd.position.y = 0.024; gd.add(sd);
    var td = new T.Mesh(new T.CylinderGeometry(1.29, 1.29, 0.1, 48, 1, true), ink2); td.position.y = 2.4; gd.add(td);
    gd.traverse(function (o) { o.userData = { door: true }; }); S.lobby.add(gd); if (hd !== S.lobby) { S.lobby.updateMatrixWorld(true); hd.attach(gd); }
  }

  /* ═══════════ v5.45 1층 공간 손질(사용자 261004) ═══════════
   * ① 동쪽 코어 옆 빈 공간(EH) · 사용자 「동문 쪽 오른쪽은 뚫려 있고 계단실과 엘리베이터실이 있다 · 엘리베이터와 나란히 앞으로 이어진다」
   *   도면 1/200(2024.12) 「4244 × 8075」 칸 = 동쪽 코어(계단 · 엘리베이터) 동쪽 벽 x 28.2 ~ 동쪽 유리벽 x 32.57 · z 11.46 ~ 19.4 · 북쪽 끝 = 고객 대기석 쪽 양개문
   *   모형(lobby.glb)은 이 칸을 코어 덩어리로 막아 두었다 · 받은 뒤 그 칸의 코어 면(side_n)을 잘라 내고 벽 · 문 · 유리를 덧붙인다(모형 그대로 · 겹친 면 없음)
   *   걸어 들어가지는 않는다(입구 차단봉 · 들어가면 카메라가 코어 덩어리 속으로 들어간다) · 바닥은 구운 빛이 까만 코어 밑이라 로비 바닥 밝기 한 점으로 다시 칠한다
   * ② 가벽 + 전체 화면(사용자 「도면에는 없는데 가벽이 있고 전체로 화면이 나오는 영상 화면」) · 날개(AX LOUNGE) 들어가는 곳 · 코어 서쪽 면에 붙어 서쪽으로
   *   화면 = 로비 쪽(남쪽) 면 전체 · TV 와 같은 픽셀 광고 루프 · 시선을 가리면 기둥처럼 점점이 비운다
   * ③ 미팅룸 1 · 2 = 유리벽(사용자 「키 높이까지 반투명 · 위는 투명」) · 미팅룸 3 자리 = 같은 유리벽의 「고객센터」(유리문 · 탁자 대신 안내 카운터)
   * 모두 걷기 지도(buildGrid) 앞에 붙여 막힘이 저절로 따라온다 · 면은 서로 겹치지 않게(문은 벽 구멍 안으로 들이고 · 띠 · 표지는 상자) */
  var EH = { x0: 28.2, x1: 32.57, z0: 11.46, z1: 19.4, top: 4.6, H: 5.0 };
  var WW = { x1: 6.825, w: 1.8, z: 12.5, t: 0.12, h: 2.4 };   /* 가벽 · 폭 = 사용자 표시(약 2.4m)보다 좁힘 · 2.4m 면 미팅룸 앞 복도(폭 3.2m)가 막혀 날개로 못 들어간다 */
  var GL = { cut: 1.75, h: 2.7 };   /* 유리벽 · 1.75m 까지 반투명 · 위 2.7m(미팅룸 벽 높이)까지 투명 */
  function attrRec(geo, keys, A, i, m, v) {
    var a = []; keys.forEach(function (k) { var s = geo.attributes[k].itemSize; for (var j = 0; j < s; j++) a.push(A[k][i * s + j]); });
    v.set(A.position[i * 3], A.position[i * 3 + 1], A.position[i * 3 + 2]).applyMatrix4(m);
    return { p: [v.x + 16, 6 - v.z, v.y], a: a };
  }
  function lerpRec(P, Q, t) { return { p: [P.p[0] + (Q.p[0] - P.p[0]) * t, P.p[1] + (Q.p[1] - P.p[1]) * t, P.p[2] + (Q.p[2] - P.p[2]) * t], a: P.a.map(function (x, i) { return x + (Q.a[i] - x) * t; }) }; }
  function clipRec(poly, f) {
    var out = [];
    for (var i = 0; i < poly.length; i++) { var c = poly[i], n = poly[(i + 1) % poly.length], sc = f(c), sn = f(n); if (sc >= 0) out.push(c); if ((sc >= 0) !== (sn >= 0)) out.push(lerpRec(c, n, sc / (sc - sn))); }
    return out.length > 2 ? out : [];
  }
  /* 메시를 평면 상자 R(도면 x0~x1 · z0~z1 · 높이 무관) 안팎으로 나눈다 · 안 = 지움(drop) 또는 라이트맵 한 점으로 다시 칠함(uv1 = relight) · keep(tri) 가 참인 삼각형은 통째로 지움 */
  function regionCut(o, R, relight, dropTri) {
    var geo = o.geometry, keys = Object.keys(geo.attributes), A = {}, idx = geo.index, n = idx ? idx.count : geo.attributes.position.count, m = o.matrixWorld, v = new T.Vector3();
    keys.forEach(function (k) { A[k] = f32Arr(geo.attributes[k]); });
    var out = {}, ind = [], cnt = 0, hit = 0, u1 = keys.indexOf('uv1') >= 0 ? (function () { var off = 0; for (var q = 0; q < keys.indexOf('uv1'); q++) off += geo.attributes[keys[q]].itemSize; return off; })() : -1;
    keys.forEach(function (k) { out[k] = []; });
    function emit(poly, inside) {
      var base = cnt;
      poly.forEach(function (V) { var off = 0; keys.forEach(function (k) { var s = geo.attributes[k].itemSize; for (var j = 0; j < s; j++) out[k].push(inside && relight && off + j >= u1 && off + j < u1 + 2 ? relight[off + j - u1] : V.a[off + j]); off += s; }); cnt++; });
      for (var k = 1; k + 1 < poly.length; k++) ind.push(base, base + k, base + k + 1);
    }
    var G4 = R ? [function (V) { return V.p[0] - R.x0; }, function (V) { return R.x1 - V.p[0]; }, function (V) { return V.p[1] - R.z0; }, function (V) { return R.z1 - V.p[1]; }] : [];
    for (var t = 0; t < n; t += 3) {
      var tri = [0, 1, 2].map(function (q) { return attrRec(geo, keys, A, idx ? idx.getX(t + q) : t + q, m, v); });
      if (dropTri && dropTri(tri)) { hit++; continue; }
      if (!R) { emit(tri, false); continue; }
      var rest = tri, inside = true;
      for (var g = 0; g < 4 && rest.length; g++) {
        var f = G4[g], outer = clipRec(rest, function (V) { return -f(V); });
        if (outer.length && outer.some(function (V) { return f(V) < -1e-6; })) emit(outer, false);
        rest = clipRec(rest, f); if (rest.length && !rest.some(function (V) { return f(V) > 1e-6; })) rest = [];
      }
      if (rest.length) { hit++; if (relight) emit(rest, true); }
    }
    if (!hit) return 0;   /* 손댈 것 없음 = 원래 모양 그대로 */
    var g2 = new T.BufferGeometry(); keys.forEach(function (k) { g2.setAttribute(k, new T.BufferAttribute(new Float32Array(out[k]), geo.attributes[k].itemSize)); });
    g2.setIndex(ind); g2.computeBoundingSphere(); g2.computeBoundingBox(); o.geometry = g2;
    var shared = false; S.lobby.traverse(function (x) { if (x.isMesh && x.geometry === geo) shared = true; }); if (!shared) geo.dispose();
    return hit;
  }
  /* 메시 면 위 한 점(도면 x · z · 높이 y)의 속성값(uv · uv1) · 삼각형 무게중심 보간 · 없으면 null */
  function attrAt(o, key, x, z, y) {
    var geo = o.geometry, pos = geo.attributes.position, at = geo.attributes[key], idx = geo.index, n = idx ? idx.count : pos.count, m = o.matrixWorld;
    if (!at) return null;
    var a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), p = new T.Vector3(x - 16, y, 6 - z), nn = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3(), w = new T.Vector3();
    for (var t = 0; t < n; t += 3) {
      var ia = idx ? idx.getX(t) : t, ib = idx ? idx.getX(t + 1) : t + 1, ic = idx ? idx.getX(t + 2) : t + 2;
      a.fromBufferAttribute(pos, ia).applyMatrix4(m); b.fromBufferAttribute(pos, ib).applyMatrix4(m); c.fromBufferAttribute(pos, ic).applyMatrix4(m);
      e1.subVectors(b, a); e2.subVectors(c, a); nn.crossVectors(e1, e2); var L = nn.length(); if (L < 1e-9) continue; nn.divideScalar(L);
      if (Math.abs(w.subVectors(p, a).dot(nn)) > 0.01) continue;
      T.Triangle.getBarycoord(p, a, b, c, w); if (w.x < -1e-4 || w.y < -1e-4 || w.z < -1e-4) continue;
      var r = []; for (var j = 0; j < at.itemSize; j++) { var g = j === 0 ? 'getX' : j === 1 ? 'getY' : 'getZ'; r.push(at[g](ia) * w.x + at[g](ib) * w.y + at[g](ic) * w.z); }
      return r;
    }
    return null;
  }
  /* 사각형 면 하나(세 점 a · b · d 로 정한 평행사변형 · 바깥 법선 nrm 쪽으로 감김) → 배열에 넣기 */
  function quadInto(Q, a, b, d, nrm, uv) {
    var c = [b[0] + d[0] - a[0], b[1] + d[1] - a[1], b[2] + d[2] - a[2]], P = [a, b, c, d], base = Q.pos.length / 3;
    P.forEach(function (p, i) { Q.pos.push(p[0] - 16, p[2], 6 - p[1]); if (Q.uv) Q.uv.push(uv ? uv(p)[0] : 0, uv ? uv(p)[1] : 0); });
    var e1 = new T.Vector3(b[0] - a[0], b[2] - a[2], -(b[1] - a[1])), e2 = new T.Vector3(d[0] - a[0], d[2] - a[2], -(d[1] - a[1])), cr = new T.Vector3().crossVectors(e1, e2);
    var flip = cr.dot(new T.Vector3(nrm[0], nrm[2], -nrm[1])) < 0;
    if (flip) Q.idx.push(base, base + 3, base + 2, base, base + 2, base + 1); else Q.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  function quadMesh(Q, mat, uv1c) {
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(Q.pos, 3));
    if (Q.uv) g.setAttribute('uv', new T.Float32BufferAttribute(Q.uv, 2));
    if (uv1c) { var u1 = []; for (var i = 0; i < Q.pos.length / 3; i++) u1.push(uv1c[0], uv1c[1]); g.setAttribute('uv1', new T.Float32BufferAttribute(u1, 2)); }
    if (mat.vertexColors) { var cc = []; for (var j = 0; j < Q.pos.length / 3; j++) cc.push(1, 1, 1); g.setAttribute('color', new T.Float32BufferAttribute(cc, 3)); }
    g.setIndex(Q.idx); g.computeVertexNormals(); g.computeBoundingSphere(); return new T.Mesh(g, mat);
  }
  /* 세로 벽(구멍 있음) · ax = 'x'(x = c 인 벽 · s = z) 또는 'z'(z = c 인 벽 · s = x) · nrm = 바깥 법선(도면 [nx, nz, ny]) · holes = [{ s0, s1, h }] · 구멍은 안쪽으로 dep 들어간 문틀(옆 · 위)과 함께 */
  function wallQuads(Q, J, ax, c, s0, s1, y0, y1, nrm, holes, dep) {
    function pt(s, y, o) { var cc = c + (o || 0) * (ax === 'x' ? -nrm[0] : -nrm[1]); return ax === 'x' ? [cc, s, y] : [s, cc, y]; }
    var hs = (holes || []).slice().sort(function (a, b) { return a.s0 - b.s0; }), s = s0;
    hs.forEach(function (h) {
      if (h.s0 > s + 1e-6) quadInto(Q, pt(s, y0), pt(h.s0, y0), pt(s, y1), nrm);
      quadInto(Q, pt(h.s0, h.h), pt(h.s1, h.h), pt(h.s0, y1), nrm);
      if (J) {   /* 문틀 · 옆 두 면(구멍 안쪽을 봄) + 위 한 면(아래를 봄) */
        var ns = ax === 'x' ? [0, 1, 0] : [1, 0, 0];
        quadInto(J, pt(h.s0, y0, 0), pt(h.s0, y0, dep), pt(h.s0, h.h, 0), ns);
        quadInto(J, pt(h.s1, y0, 0), pt(h.s1, y0, dep), pt(h.s1, h.h, 0), [-ns[0], -ns[1], 0]);
        quadInto(J, pt(h.s0, h.h, 0), pt(h.s1, h.h, 0), pt(h.s0, h.h, dep), [0, 0, -1]);
      }
      s = h.s1;
    });
    if (s1 > s + 1e-6) quadInto(Q, pt(s, y0), pt(s1, y0), pt(s, y1), nrm);
  }
  var LAMC = {};
  function lam(c) { return LAMC[c] || (LAMC[c] = new T.MeshLambertMaterial({ color: c })); }   /* 같은 색 = 같은 재질(아래 mergeStatic 이 한 번에 그린다) · 점점이 비우는 유리방 · 가벽은 따로 만든 재질 */
  /* 덧붙인 작은 상자 · 판을 재질마다 한 메시로 합친다(그리기 호출 절약 · 유리방 · 빈 공간에 상자가 80개 남짓) · 재질이 배열인 것(글자 표지 · 카운터)은 그대로 */
  function mergeStatic(g) {
    var buckets = new Map(), n0 = g.children.length;
    g.children.slice().forEach(function (o) {
      if (!o.isMesh || Array.isArray(o.material) || o.children.length) return;
      var k = o.material.uuid + '|' + Object.keys(o.geometry.attributes).sort().join(',') + '|' + o.renderOrder;
      if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(o);
    });
    buckets.forEach(function (L) {
      if (L.length < 2) return;
      var keys = Object.keys(L[0].geometry.attributes), A = {}, ind = [], base = 0;
      keys.forEach(function (k) { A[k] = []; });
      L.forEach(function (o) {
        o.updateMatrix(); var geo = o.geometry.clone(); geo.applyMatrix4(o.matrix);
        keys.forEach(function (k) { var a = geo.attributes[k]; for (var i = 0; i < a.count; i++) for (var j = 0; j < a.itemSize; j++) A[k].push(j === 0 ? a.getX(i) : j === 1 ? a.getY(i) : j === 2 ? a.getZ(i) : a.getW(i)); });
        var nv = geo.attributes.position.count;
        if (geo.index) for (var q = 0; q < geo.index.count; q++) ind.push(geo.index.getX(q) + base); else for (var r = 0; r < nv; r++) ind.push(r + base);
        base += nv; g.remove(o); o.geometry.dispose(); geo.dispose();
      });
      var mg = new T.BufferGeometry(); keys.forEach(function (k) { mg.setAttribute(k, new T.Float32BufferAttribute(A[k], L[0].geometry.attributes[k].itemSize)); });
      mg.setIndex(ind); mg.computeBoundingSphere(); mg.computeBoundingBox();
      var mm = new T.Mesh(mg, L[0].material); mm.name = (L[0].name || 'merged') + '_m'; mm.renderOrder = L[0].renderOrder; g.add(mm);
    });
    return n0 - g.children.length;
  }
  function signTex(txt, w, h, opt) {
    opt = opt || {}; var cv = document.createElement('canvas'), k = 256 / h; cv.width = Math.round(w * k); cv.height = 256; var g = cv.getContext('2d');
    g.fillStyle = opt.bg || '#FFFFFF'; g.fillRect(0, 0, cv.width, cv.height);
    if (opt.bar) { g.fillStyle = opt.bar; g.fillRect(0, 0, Math.round(cv.width * 0.035), cv.height); }
    g.fillStyle = opt.ink || '#191F28'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 ' + Math.round(cv.height * 0.5) + 'px "Pretendard Variable", Pretendard, sans-serif';
    var mw = cv.width * 0.86, fs = Math.round(cv.height * 0.5); while (g.measureText(txt).width > mw && fs > 20) { fs -= 4; g.font = '700 ' + fs + 'px "Pretendard Variable", Pretendard, sans-serif'; }
    g.fillText(txt, cv.width / 2 + (opt.bar ? cv.width * 0.018 : 0), cv.height * 0.54);
    var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function boxAt(w, h, d, mat, x, z, y) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x - 16, y, 6 - z); return m; }
  /* 표지(돌출 · 두 면에 글자) · 벽에서 x 쪽으로 튀어나온 판 · 남 · 북에서 읽힌다 */
  function bladeSign(txt, x0, z, y, len) {
    var tx = signTex(txt, len, 0.22, { bar: '#FF7E31' }), side = lam(0xD9DDE2), face = new T.MeshBasicMaterial({ map: tx });
    return boxAt(len, 0.22, 0.035, [side, side, side, side, face, face], x0 + len / 2, z, y);
  }

  function remodel() {
    var t0 = performance.now(), R = { eh: 0, floor: 0, wing: 0 }, sideN = S.lobby.getObjectByName('side_n'), sideE = S.lobby.getObjectByName('side_e') || S.lobby;
    S.lobby.updateMatrixWorld(true);
    /* ── ① 동쪽 빈 공간 ── 자르기 전에 대리석 결 · 빛을 옆 벽에서 읽어 둔다 */
    var marble = S.lobby.getObjectByName('side_n_wall_1'), floor = S.lobby.getObjectByName('floor'), led = S.lobby.getObjectByName('side_n_led');
    if (sideN && marble && floor) {
      var uA = attrAt(marble, 'uv', 20.5, EH.z0, 1.0), uB = attrAt(marble, 'uv', 21.5, EH.z0, 1.0), uC = attrAt(marble, 'uv', 20.5, EH.z0, 2.0), l1 = attrAt(marble, 'uv1', 30.4, EH.z0, 2.2), f1 = attrAt(floor, 'uv1', 30.4, 9.9, 0);
      var dux = uA && uB ? [uB[0] - uA[0], uB[1] - uA[1]] : [0.38, 0], duy = uA && uC ? [uC[0] - uA[0], uC[1] - uA[1]] : [0, 0.77];
      sideN.traverse(function (o) { if (o.isMesh) R.eh += regionCut(o, { x0: EH.x0, x1: EH.x1 + 0.2, z0: EH.z0 - 0.08, z1: EH.z1 }, null); });
      R.uv1 = [f1, l1];
      var eh = new T.Group(); eh.name = 'eastHall'; eh.userData = { eastHall: true };
      /* 바닥 · 모형 바닥은 코어 밑에 없다(바깥 포장만) · 로비 바닥과 같은 재질 · 결(uv)은 로비 바닥에서 이어 · 빛은 로비 바닥 한 점(문 E 앞) */
      var fA = attrAt(floor, 'uv', 30.4, 9.9, 0), fB = attrAt(floor, 'uv', 31.4, 9.9, 0), fC = attrAt(floor, 'uv', 30.4, 10.9, 0);
      if (fA && fB && fC) {
        var FQ = { pos: [], uv: [], idx: [] };
        quadInto(FQ, [EH.x0, EH.z0, 0], [EH.x1, EH.z0, 0], [EH.x0, EH.z1, 0], [0, 0, 1], function (p) { var dx = p[0] - 30.4, dz = p[1] - 9.9; return [fA[0] + (fB[0] - fA[0]) * dx + (fC[0] - fA[0]) * dz, fA[1] + (fB[1] - fA[1]) * dx + (fC[1] - fA[1]) * dz]; });
        var fm = quadMesh(FQ, floor.material, f1 || [0, 0]); fm.name = 'eh_floor'; S.lobby.add(fm); R.floor = 1;
      }
      /* 서쪽 벽(대리석 · 동쪽을 봄) · 계단 문 · 엘리베이터 문 구멍 */
      var Wm = { pos: [], uv: [], idx: [] }, Jm = { pos: [], idx: [] }, dep = 0.1, DOOR = { st: { s0: 14.5, s1: 15.5, h: 2.1 }, ev: { s0: 16.9, s1: 18.1, h: 2.3 } };
      wallQuads(Wm, Jm, 'x', EH.x0, EH.z0, EH.z1, 0, EH.top, [1, 0, 0], [DOOR.st, DOOR.ev], dep);
      var Wuv = function (p) { var s = p[1] - EH.z0, y = p[2] - 1.0; return [(uA ? uA[0] : 0) + dux[0] * s + duy[0] * y, (uA ? uA[1] : 0) + dux[1] * s + duy[1] * y]; };
      Wm.uv = []; for (var q = 0; q < Wm.pos.length / 3; q++) { var px = Wm.pos[q * 3] + 16, pz = 6 - Wm.pos[q * 3 + 2], py = Wm.pos[q * 3 + 1]; Wm.uv.push.apply(Wm.uv, Wuv([px, pz, py])); }
      var wm = quadMesh(Wm, marble.material, l1 || [0, 0]); wm.name = 'eh_wall'; eh.add(wm);
      var band = { pos: [], idx: [] }; quadInto(band, [EH.x0, EH.z0, EH.top], [EH.x0, EH.z1, EH.top], [EH.x0, EH.z0, EH.H], [1, 0, 0]);
      var bandM = quadMesh(band, lam(0xE7E4DF)); bandM.name = 'eh_band'; eh.add(bandM);
      var jm = quadMesh(Jm, lam(0x8B9096)); jm.name = 'eh_jamb'; eh.add(jm);
      /* 벽 밑 · 위 간접등 띠(코어 앞면과 같은 재질 · 벽에서 3cm 튀어나온 상자) */
      if (led) { eh.add(boxAt(0.03, 0.02, EH.z1 - EH.z0, led.material, EH.x0 + 0.015, (EH.z0 + EH.z1) / 2, 0.02)); eh.add(boxAt(0.03, 0.02, EH.z1 - EH.z0, led.material, EH.x0 + 0.015, (EH.z0 + EH.z1) / 2, 4.58)); }
      /* 계단 문(짙은 회색 방화문 · 손잡이 막대) · 엘리베이터 문(은색 두 짝 · 가운데 줄 · 호출 버튼) · 구멍 안쪽 dep 에 선다 */
      var dx = EH.x0 - dep, sd = DOOR.st, ev = DOOR.ev;
      var stD = new T.Mesh(new T.PlaneGeometry(sd.s1 - sd.s0, sd.h), lam(0x5B6168)); stD.rotation.y = Math.PI / 2; stD.position.set(dx - 16, sd.h / 2, 6 - (sd.s0 + sd.s1) / 2); eh.add(stD);
      eh.add(boxAt(0.04, 0.04, 0.55, lam(0xC9CED4), dx + 0.03, (sd.s0 + sd.s1) / 2, 1.0));
      var evD = new T.Mesh(new T.PlaneGeometry(ev.s1 - ev.s0, ev.h), lam(0xC4C9CF)); evD.rotation.y = Math.PI / 2; evD.position.set(dx - 16, ev.h / 2, 6 - (ev.s0 + ev.s1) / 2); eh.add(evD);
      eh.add(boxAt(0.012, ev.h, 0.012, lam(0x6B7077), dx + 0.006, (ev.s0 + ev.s1) / 2, ev.h / 2));
      eh.add(boxAt(0.03, 0.26, 0.1, lam(0x3A3F45), EH.x0 + 0.015, ev.s0 - 0.3, 1.15));
      eh.add(bladeSign('계단', EH.x0 + 0.01, (sd.s0 + sd.s1) / 2, 2.55, 0.62));
      eh.add(bladeSign('엘리베이터', EH.x0 + 0.01, (ev.s0 + ev.s1) / 2, 2.62, 0.9));
      /* 북쪽 벽(밝은 벽 · 남쪽을 봄) · 고객 대기석 쪽 양개 유리문(불투명 서리 유리 · 틀 · 손잡이) */
      var Nm = { pos: [], idx: [] }, Nj = { pos: [], idx: [] }, nd = { s0: 29.6, s1: 31.0, h: 2.4 };
      wallQuads(Nm, Nj, 'z', EH.z1, EH.x0, EH.x1, 0, EH.H, [0, -1, 0], [nd], dep);
      var nm = quadMesh(Nm, lam(0xE7E4DF)); nm.name = 'eh_north'; eh.add(nm);
      var nj = quadMesh(Nj, lam(0x8B9096)); eh.add(nj);
      var nz = EH.z1 + dep, ndw = nd.s1 - nd.s0, frost = lam(0xDCE5E8), frame = lam(0x3A3F45);
      var nD = new T.Mesh(new T.PlaneGeometry(ndw, nd.h), frost); nD.position.set((nd.s0 + nd.s1) / 2 - 16, nd.h / 2, 6 - nz); eh.add(nD);
      eh.add(boxAt(0.03, nd.h, 0.03, frame, (nd.s0 + nd.s1) / 2, nz - 0.015, nd.h / 2));
      [-1, 1].forEach(function (sg) { eh.add(boxAt(0.03, 0.42, 0.04, frame, (nd.s0 + nd.s1) / 2 + sg * 0.12, nz - 0.03, 1.05)); });
      eh.add(boxAt(ndw, 0.05, 0.03, frame, (nd.s0 + nd.s1) / 2, nz - 0.015, nd.h - 0.025));
      /* 동쪽 유리벽(로비 유리벽이 이어짐) · 유리 + 세로 멀리언 */
      var ge = S.lobby.getObjectByName('side_e_glass'), mu = S.lobby.getObjectByName('side_e_mull');
      if (ge) {
        var gq = { pos: [], idx: [] }; quadInto(gq, [EH.x1, EH.z0, 0], [EH.x1, EH.z1, 0], [EH.x1, EH.z0, EH.H], [-1, 0, 0]);
        var ge2 = new T.Group(); ge2.name = 'eastHallGlass';
        var gm = quadMesh(gq, ge.material); gm.name = 'eh_glass'; ge2.add(gm);
        [13.45, 15.43, 17.42, 19.32].forEach(function (z) { ge2.add(boxAt(0.08, EH.H, 0.08, mu ? mu.material : frame, EH.x1, z, EH.H / 2)); });
        mergeStatic(ge2); sideE.add(ge2);
      }
      R.merged = mergeStatic(eh); sideN.add(eh);
      /* 입구 차단봉(로비에서 들어가지 않게 · 늘 보임) */
      var bar = new T.Group(); bar.name = 'ehBarrier'; var pm = lam(0x3A3F45), bm = lam(0x2B3036), PX = [28.55, 29.5, 30.45, 31.4, 32.25], BZ = 11.8;
      PX.forEach(function (x, i) {
        var p = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.9, 10), pm); p.position.set(x - 16, 0.47, 6 - BZ); bar.add(p);
        var b0 = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.025, 20), pm); b0.position.set(x - 16, 0.0125, 6 - BZ); bar.add(b0);
        var tp = new T.Mesh(new T.SphereGeometry(0.045, 12, 8), pm); tp.position.set(x - 16, 0.94, 6 - BZ); bar.add(tp);
        if (i) bar.add(boxAt(x - PX[i - 1] - 0.06, 0.05, 0.008, bm, (x + PX[i - 1]) / 2, BZ, 0.86));
      });
      mergeStatic(bar); S.lobby.add(bar);
      /* 코어를 숨겼을 때 남는 낮은 덩어리(tour-scene coreStub)도 빈 공간을 비운다 */
      var cs = S.lobby.getObjectByName('coreStub');
      if (cs && cs.children[1]) {
        var old = cs.children[1], cz = (D.LAYOUT && D.LAYOUT.CORE_Z1) || 20.2, mats = old.material, x0 = 19.8;
        cs.remove(old); old.geometry.dispose();
        cs.add(boxAt(EH.x0 - x0, 0.9, cz - EH.z0, mats, (x0 + EH.x0) / 2, (EH.z0 + cz) / 2, 0.45));
        cs.add(boxAt(EH.x1 - EH.x0, 0.9, cz - EH.z1, mats, (EH.x0 + EH.x1) / 2, (EH.z1 + cz) / 2, 0.45));
      }
    }
    /* ── ③ 미팅룸 유리벽 · 고객센터 ── 미팅룸 2 남쪽 막힌 벽 · 미팅룸 3 탁자 · 의자를 지운다 */
    var wb = S.lobby.getObjectByName('wing_body');
    if (wb) R.wing = regionCut(wb, null, null, function (tri) {
      var all = function (f) { return tri.every(function (V) { return f(V.p); }); };
      return all(function (p) { return p[1] > 12.14 && p[1] < 12.26 && p[0] < 3.62; }) || all(function (p) { return p[1] > 23.3; });
    });
    var frostM = new T.MeshBasicMaterial({ color: 0xF2F4F5, transparent: true, opacity: 0.8, depthWrite: false, side: T.DoubleSide, forceSinglePass: true });
    var clearM = new T.MeshBasicMaterial({ color: 0xDCE6EA, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide, forceSinglePass: true });
    var LG = {}, lg = function (c) { return LG[c] || (LG[c] = new T.MeshLambertMaterial({ color: c })); }, fr = lg(0x9AA0A6), gw = new T.Group(); gw.name = 'glassRooms';
    function glassWall(ax, c, s0, s1, doors, noEnd) {   /* noEnd = [앞 끝 · 뒤 끝] 세로 틀 빼기(벽 끝 · 다른 유리벽 모서리와 겹치지 않게) */
      function P3(s, y) { return ax === 'x' ? [c, s, y] : [s, c, y]; }
      [[0, GL.cut, frostM], [GL.cut, GL.h, clearM]].forEach(function (b) {
        var Q = { pos: [], idx: [] }; quadInto(Q, P3(s0, b[0]), P3(s1, b[0]), P3(s0, b[1]), ax === 'x' ? [1, 0, 0] : [0, -1, 0]);
        var m = quadMesh(Q, b[2]); m.renderOrder = 2; m.name = 'glass_room'; gw.add(m);
      });
      function bar(sa, sb, y, hh) { var L = Math.abs(sb - sa), mid = (sa + sb) / 2; gw.add(ax === 'x' ? boxAt(0.04, hh, L, fr, c, mid, y) : boxAt(L, hh, 0.04, fr, mid, c, y)); }
      var ne = noEnd || [false, false], b0 = ne[0] ? s0 + 0.002 : s0 + 0.0225, b1 = ne[1] ? s1 - 0.002 : s1 - 0.0225;   /* 가로 띠 끝 = 세로 틀 속(틀이 있으면) */
      bar(b0, b1, GL.cut, 0.035); bar(b0, b1, GL.h - 0.02, 0.04); bar(b0, b1, 0.03, 0.06);
      var cuts = []; if (!ne[0]) cuts.push(s0); if (!ne[1]) cuts.push(s1); (doors || []).forEach(function (d) { cuts.push(d[0], d[1]); });
      for (var s = s0 + 1.4; s < s1 - 0.5; s += 1.4) if (!(doors || []).some(function (d) { return s > d[0] - 0.3 && s < d[1] + 0.3; })) cuts.push(s);
      cuts.forEach(function (s) { gw.add(ax === 'x' ? boxAt(0.045, GL.h, 0.045, fr, c, s, GL.h / 2) : boxAt(0.045, GL.h, 0.045, fr, s, c, GL.h / 2)); });
      (doors || []).forEach(function (d) {
        bar(d[0] + 0.0225, d[1] - 0.0225, 2.2, 0.045);
        var hs = d[2] ? [(d[0] + d[1]) / 2 - 0.1, (d[0] + d[1]) / 2 + 0.1] : [d[1] - 0.12];
        if (d[2]) { gw.add(ax === 'x' ? boxAt(0.03, 2.2, 0.03, fr, c, (d[0] + d[1]) / 2, 1.1) : boxAt(0.03, 2.2, 0.03, fr, (d[0] + d[1]) / 2, c, 1.1)); }
        hs.forEach(function (s) { gw.add(ax === 'x' ? boxAt(0.09, 0.5, 0.025, lg(0x4E5359), c, s, 1.05) : boxAt(0.025, 0.5, 0.09, lg(0x4E5359), s, c, 1.05)); });
      });
    }
    glassWall('z', 12.2, 0.08, 3.6, [], [true, false]);                    /* 미팅룸 2 남쪽(로비 쪽) · 서쪽 끝 = 바깥 유리벽 틀 */
    glassWall('x', 3.6, 12.2, 17.76, [[12.55, 13.45]], [true, true]);       /* 미팅룸 2 동쪽(복도) · 문 · 앞 끝 = 위 모서리 틀 · 뒤 끝 = 칸막이 벽 */
    glassWall('x', 3.6, 17.84, 23.16, [[18.2, 19.1]], [true, true]);        /* 미팅룸 1 동쪽 · 문 */
    glassWall('z', 23.2, 3.6, 6.82, [[4.65, 5.85, 2]], [true, true]);       /* 고객센터(미팅룸 3 자리) 앞 · 양개 유리문 */
    /* 고객센터 표지(유리 위 투명 칸 · 복도 쪽) · 안내 카운터 */
    gw.add(boxAt(1.1, 0.28, 0.02, [lg(0xD9DDE2), lg(0xD9DDE2), lg(0xD9DDE2), lg(0xD9DDE2), new T.MeshBasicMaterial({ map: signTex('고객센터', 1.1, 0.28, { bar: '#FF7E31' }) }), lg(0xD9DDE2)], 5.25, 23.2 - 0.04, 2.42));
    gw.add(boxAt(1.6, 0.95, 0.55, [lg(0xD0D4D9), lg(0xD0D4D9), lg(0xFAFAFA), lg(0xD0D4D9), lg(0xE5E8EB), lg(0xD0D4D9)], 5.55, 25.15, 0.475));
    R.merged = mergeStatic(gw); S.lobby.add(gw);
    /* ── ② 가벽 + 전체 화면 ── */
    var wx0 = WW.x1 - WW.w, side = new T.MeshLambertMaterial({ color: 0x2B3036 }), back = new T.MeshLambertMaterial({ color: 0xEDEBE7 }), hide = new T.MeshBasicMaterial({ visible: false });
    var wb2 = new T.Mesh(new T.BoxGeometry(WW.w, WW.h, WW.t), [side, side, side, side, hide, back]); wb2.position.set((wx0 + WW.x1) / 2 - 16, WW.h / 2, 6 - WW.z); wb2.name = 'partition';
    var scr = new T.Mesh(new T.PlaneGeometry(WW.w, WW.h), new T.MeshBasicMaterial({ color: 0x14171C, toneMapped: false })); scr.position.set((wx0 + WW.x1) / 2 - 16, WW.h / 2, 6 - (WW.z - WW.t / 2)); scr.name = 'partitionScreen';
    S.lobby.add(wb2); S.lobby.add(scr);
    G.wallScr = scr;
    patchFade([side, back, scr.material], WFADE, 'w');
    var gm2 = []; gw.traverse(function (o) { if (o.isMesh) [].concat(o.material).forEach(function (m) { if (gm2.indexOf(m) < 0) gm2.push(m); }); });
    patchFade(gm2, GFADE, 'g');
    G.remodel = { eh: R.eh, floor: R.floor, wing: R.wing, uv1: R.uv1, ms: Math.round(performance.now() - t0) };
  }
  /* 가벽 · 유리벽이 시선을 가리면 점점이 비운다(기둥과 같은 디더링) · 카메라 → 머리 선분이 벽 선분을 지나고 그 자리 높이가 벽보다 낮을 때 · 카메라가 미팅룸 안이면 유리벽 전부 */
  var WFADE = { value: 1 }, GFADE = { value: 1 };
  var GSEG = [[0.08, 12.2, 3.6, 12.2], [3.6, 12.2, 3.6, 23.16], [3.6, 23.2, 6.83, 23.2]];
  function patchFade(mats, U, key) {
    mats.forEach(function (m) {
      if (!m || m.visible === false) return;
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uLabA = U;
        sh.fragmentShader = 'uniform float uLabA;\n#define LB2(a) fract(dot(floor(a), vec2(.5, floor(a).y * .75)))\n#define LB4(a) (LB2(.5 * (a)) * .25 + LB2(a))\n' +
          sh.fragmentShader.replace('void main() {', 'void main() {\n  if (uLabA < 0.995 && uLabA < LB4(gl_FragCoord.xy) + 0.001) discard;');
      };
      m.customProgramCacheKey = function () { return 'labFade' + key + (m.map ? 'm' : '') + (m.transparent ? 't' : ''); };
    });
  }
  function segHit(ax, az, bx, bz, cx, cz, dx, dz) {   /* 선분 a→b 와 c→d 가 만나는 a→b 위 비율 · 없으면 -1 */
    var rx = bx - ax, rz = bz - az, sx = dx - cx, sz = dz - cz, den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) return -1;
    var t = ((cx - ax) * sz - (cz - az) * sx) / den, u = ((cx - ax) * rz - (cz - az) * rx) / den;
    return t > 0 && t < 1.05 && u > -0.06 && u < 1.06 ? t : -1;
  }
  function fadeTo(U, to, dt) { var f0 = U.value; U.value += (to - U.value) * (dt ? 1 - Math.exp(-dt * 9) : 1); if (Math.abs(U.value - to) < 0.01) U.value = to; return U.value !== f0; }
  function stepWallFade(dt) {
    var cx = G.camPos.x + 16, cz = 6 - G.camPos.z, cy = G.camPos.y, hx = G.pos.x + 16, hz = 6 - G.pos.z;
    function under(t, h) { return t >= 0 && cy + (1.25 - cy) * Math.min(1, t) < h + 0.4; }
    var tw = segHit(cx, cz, hx, hz, WW.x1 - WW.w - 0.3, WW.z, WW.x1 + 0.3, WW.z), gHit = cx < 3.6 && cx > -0.5 && cz > 12.2 && cz < 23.2;
    GSEG.forEach(function (g) { if (under(segHit(cx, cz, hx, hz, g[0], g[1], g[2], g[3]), GL.h)) gHit = true; });
    var a = fadeTo(WFADE, under(tw, WW.h) ? 0.16 : 1, dt), b = fadeTo(GFADE, gHit ? 0.16 : 1, dt);
    return a || b;
  }

  /* ═══════════ 받기 ═══════════ */
  function load() {
    $('load').hidden = false;
    S.load(BASE + 'lobby.glb?v=' + LABVER, function (k) { $('load').textContent = '모형 불러오는 중 ' + Math.round(k * 100) + '%'; var bt = $('blackT'); if (!bt.classList.contains('on')) bt.textContent = '불러오는 중 ' + Math.round(k * 100) + '%'; }, function () {
      fixCoplanar(S.lobby); fixLightmaps(S.lobby); remodel(); buildGrid(S.lobby); patchPillars(S.lobby); buildDoor();
      var st = STOPS[0], f = nearestFree(st.x, st.z); flood(f[0], f[1]);
      STOPS.forEach(function (s) { var q = nearestFree(s.x, s.z); if (q) { s.x = q[0]; s.z = q[1]; } });
      buildGuides(); hideCheckin(); buildTypingTv(); buildTvs();
      if (G.wallScr) { var wv = tvAdd(G.wallScr, 64, Math.round(64 * WW.h / WW.w), 'wall'); wv.sphere.radius = Math.hypot(WW.w, WW.h) / 2 + 0.1; G.tvN = TVS.length; }   /* v5.45 가벽 전체 화면 · 같은 픽셀 광고 루프(행사명 → ME to WE → 물결) · 화면 비율대로 64 × 96 */
      STOPS.forEach(function (s) { if (!free(s.x, s.z)) { var q = nearestFree(s.x, s.z); if (q) { s.x = q[0]; s.z = q[1]; } } });   /* v5.38 멈춤 자리가 스태프 · TV 원 안이면 밖으로 */
      G.ceil = S.lobby.getObjectByName('ceiling');
      G.loaded = true; $('load').hidden = true;
      placeAt(0, true); applyTarget();
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
    if (G.goal != null) { var s = STOPS[G.goal]; G.stop = G.goal; G.mode = 'stop'; if (s.look) { var za = faceAz(s); G.azTo = G.az + Math.atan2(Math.sin(za - G.az), Math.cos(za - G.az)); } }   /* 구역 앞에 닿으면 그 판 줄이 정면이 되는 방위로 돌아선다(90도 단위) */
    else { G.mode = 'free'; nearestStop(); }
    G.goal = null; updateUi(true);
  }
  function nearestStop() { var p = planOf(G.pos), best = 0, bd = 1e9; STOPS.forEach(function (s, i) { var d = Math.hypot(s.x - p[0], s.z - p[1]); if (d < bd) { bd = d; best = i; } }); G.stop = best; }

  /* 매 프레임 · 캐릭터 */
  var _v = new T.Vector3();
  /* v5.38 스태프 챗봇과 겹치면 바깥으로 밀어낸다(어떤 이동이든 마지막에 한 번 · 막힌 칸이면 그대로) */
  function pushOut() {
    var p = planOf(G.pos);
    for (var k = 0; k < guides.length; k++) {
      var a = guides[k].at, dx = p[0] - a[0], dz = p[1] - a[1], d = Math.hypot(dx, dz);
      if (d >= GUIDE_R) continue;
      if (d < 1e-4) { dx = 1; dz = 0; d = 1; }
      var nx = a[0] + dx / d * (GUIDE_R + 0.005), nz = a[1] + dz / d * (GUIDE_R + 0.005);
      if (free(nx, nz)) { G.pos.copy(toThree(nx, nz)); p = [nx, nz]; }
    }
  }
  function stepBot(dt, now) {
    var moving = 0;
    if (G.mode === 'auto' && G.path) {
      var p = planOf(G.pos), q = G.path[G.pathI], dx = q[0] - p[0], dz = q[1] - p[1], d = Math.hypot(dx, dz), step = G.speed * dt;
      if (d <= step) { G.pos.copy(toThree(q[0], q[1])); G.pathI++; if (G.pathI >= G.path.length) arrive(); }
      else { var nx = p[0] + dx / d * step, nz = p[1] + dz / d * step; G.pos.copy(toThree(nx, nz)); }
      moving = Math.min(1, G.speed / 3); G.fwdT = 0; G.run = 0; G.realV = 0;
    } else if (G.stick && (Math.abs(G.stick.x) + Math.abs(G.stick.y)) > 0.05) {
      /* 고정 패드 · 화면 기준 · 위 = 화면 위쪽으로 */
      /* 방향 기준은 끌기 시작할 때의 카메라로 고정한다(끄는 동안 카메라가 돌아도 같은 쪽으로 걷는다) */
      var fw = _v.set(Math.sin(G.az), 0, Math.cos(G.az));   /* 패드 위 = 화면 위쪽(시점을 돌려도 늘 화면 기준) */
      var rx = -fw.z, rz = fw.x, mx = rx * G.stick.x - fw.x * G.stick.y, mz = rz * G.stick.x - fw.z * G.stick.y, mag = Math.min(1, Math.hypot(mx, mz));
      stepRun(dt);
      if (mag > 0.01) {
        var sp = WALK_V * mag * (1 + G.run) * dt, ux = mx / Math.hypot(mx, mz), uz = mz / Math.hypot(mx, mz), p0 = planOf(G.pos);
        var q = moveStep(p0[0], p0[1], ux, -uz, sp); G.pos.copy(toThree(q[0], q[1])); G.realV = dt > 0 ? q[2] / dt : 0;
        moving = mag; G.mode = 'free';
      }
    } else { G.fwdT = 0; G.run = 0; G.realV = 0; }
    pushOut();
    /* v5.38 몸 방향 = 늘 카메라 방위 G.az(사용자 261003 「항상 정면을 바라봤으면 · 방향키를 누르다 보면 삐딱하게 선다」)
     * 옛 코드: 걷는 쪽으로 몸을 지수 보간(대각 · 짧게 누름 = 중간 각도에서 멈춤) + 구역 도착 = 판 쪽 정확한 각도 · 카메라 = 90도 반올림(서로 어긋남) + 판 보기 = 판 쪽으로 돈 채 남음
     * 지금: 이동은 옆걸음 · 뒷걸음(몸은 그대로) · 몸이 도는 것은 좌로 · 우로 돌기(카메라)뿐 · 판 보기 들어가는 0.85초만 판 쪽으로 돌았다가 나오면서 카메라 방위로 돌아와 끝에서 정확히 같아진다 */
    var A = G.anim, hb = G.az;
    if (A && A.ph != null && (A.kind === 'in' || A.kind === 'out')) { var kk = clamp((now - A.t0) / A.dur, 0, 1); hb = A.kind === 'in' ? angLerp(G.az, A.ph, easeIO(clamp(kk / 0.5, 0, 1))) : angLerp(A.ph, G.az, easeIO(clamp(kk / 0.8, 0, 1))); }
    G.h = hb;
    /* 모션 · 통통 + 기울임 + 발 */
    G.moveV += ((moving ? 1 : 0) - G.moveV) * (1 - Math.exp(-dt * 10));
    if (moving) G.walkT += dt * (7 + 5 * moving) * (1 + 0.6 * (G.run || 0));
    var w = RM ? 0 : G.moveV, s = Math.sin(G.walkT);
    G.lean += ((RM ? 0 : 0.22 * (G.run || 0)) - G.lean) * (1 - Math.exp(-dt * 12));   /* 달리기 = 몸이 앞으로 살짝 기운다 */
    bot.position.copy(G.pos); bot.rotation.y = G.h;
    botParts.body.position.y = Math.abs(s) * 0.045 * w; botParts.body.rotation.z = s * 0.07 * w; botParts.body.rotation.x = 0.06 * w + G.lean;
    botParts.feet[0].position.z = 0.04 + s * 0.09 * w; botParts.feet[1].position.z = 0.04 - s * 0.09 * w;
    var dusty = stepDust(dt);
    return moving > 0.01 || w > 0.01 || dusty || G.lean > 0.002;
  }
  /* ═══════════ 달리기(v5.40 · 사용자 261003 「앞 방향키를 계속 앞으로 하면 3초 정도 후에 달려 나가면 · 먼지 일으키는 느낌」) ═══════════
   * 조그를 위로 끝까지(앞 몫 0.85 이상 · 대각 32도 안) 또는 키보드 위 화살표를 3초 이어 가면 달리기 · 속도 2배까지 0.3초에 걸쳐 오른다
   * 앞 몫이 0.7 아래로 꺾이거나 손을 떼면 바로 걷기 속도 · 좌로 · 우로 돌기만으로는 풀리지 않는다 · 자동 걷기(구역 버튼 · 바닥 톡)는 달리지 않는다
   * 달리는 동안: 발밑 먼지(점 입자 18개 · 뒤로 퍼짐) · 몸 앞으로 기울임 · 시야각 +7도 · 움직임 줄이기 = 먼지 · 시야각 · 기울임 없이 속도만 */
  var WALK_V = 3.2, RUN_AFTER = 3.0, RUN_RAMP = 0.3, RUN_IN = 0.85, RUN_KEEP = 0.7;
  var RUN_ON = false;   /* v5.47 (사용자 261004 「앞을 계속 누르면 캐릭터가 빨리 달리는 거 없애자 이상하자」) 달리기 끔 · 걷기 3.2m/s 만 · G.run 이 늘 0 이라 먼지 · 시야각 · 기울임도 없다 · 코드는 보존 */
  function stepRun(dt) {
    if (!RUN_ON) { G.fwdT = 0; G.run = 0; return; }
    var st = G.stick, mg = Math.hypot(st.x, st.y), fwd = -st.y;   /* 패드 위 = y 음수 */
    if (fwd >= (G.run > 0 ? RUN_KEEP : RUN_IN) && mg >= (G.run > 0 ? 0.75 : 0.9)) G.fwdT += dt; else { G.fwdT = 0; G.run = 0; return; }
    if (G.fwdT >= RUN_AFTER) { if (!G.run) G.runAt = performance.now(); G.run = Math.min(1, G.run + dt / RUN_RAMP); }
  }
  /* 먼지 · 가벼운 스프라이트 18개를 돌려 쓴다(새로 만들지 않음) · 발 뒤에서 생겨 뒤로 · 옆으로 퍼지며 커지고 옅어진다(0.5~0.7초) */
  var dust = [], dustAcc = 0, DUST_N = 18;
  function buildDust() {
    var c = document.createElement('canvas'); c.width = c.height = 32; var g = c.getContext('2d'), rg = g.createRadialGradient(16, 16, 1, 16, 16, 16);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.55, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 32, 32);
    var tx = new T.CanvasTexture(c);
    for (var i = 0; i < DUST_N; i++) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, color: 0x9C9389, transparent: true, depthWrite: false, opacity: 0 }));
      sp.visible = false; sp.renderOrder = 4; scene.add(sp); dust.push({ s: sp, life: 0, t: 0, vx: 0, vy: 0, vz: 0, s0: 0.1, s1: 0.4 });
    }
  }
  function stepDust(dt) {
    var alive = false, on = !RM && G.run > 0.5 && (G.realV || 0) > 2.2 && G.scn === 'lobby';
    if (on) {
      dustAcc += dt * 30;
      var bx = -Math.sin(G.h), bz = -Math.cos(G.h);   /* 몸 뒤쪽(three) */
      while (dustAcc >= 1) {
        dustAcc -= 1;
        var d = null; for (var i = 0; i < dust.length; i++) if (dust[i].t >= dust[i].life) { d = dust[i]; break; }
        if (!d) break;
        var side = Math.random() < 0.5 ? -1 : 1, lx = -bz * side * 0.14, lz = bx * side * 0.14;
        d.s.position.set(G.pos.x + bx * 0.22 + lx, 0.06, G.pos.z + bz * 0.22 + lz);
        var spd = 0.7 + Math.random() * 0.6, lat = (Math.random() - 0.5) * 1.1;
        d.vx = bx * spd - bz * lat; d.vz = bz * spd + bx * lat; d.vy = 0.25 + Math.random() * 0.35;
        d.t = 0; d.life = 0.5 + Math.random() * 0.2; d.s0 = 0.12 + Math.random() * 0.06; d.s1 = 0.42 + Math.random() * 0.2; d.s.visible = true;
      }
    } else dustAcc = 0;
    for (var k = 0; k < dust.length; k++) {
      var q = dust[k]; if (q.t >= q.life) { if (q.s.visible) q.s.visible = false; continue; }
      q.t += dt; var f = Math.min(1, q.t / q.life), e = 1 - Math.pow(1 - f, 2);
      q.s.position.x += q.vx * dt * (1 - f * 0.7); q.s.position.z += q.vz * dt * (1 - f * 0.7); q.s.position.y += q.vy * dt * (1 - f);
      var sc = q.s0 + (q.s1 - q.s0) * e; q.s.scale.set(sc, sc * 0.8, 1); q.s.material.opacity = 0.62 * Math.pow(1 - f, 1.2);
      if (q.t >= q.life) q.s.visible = false; else alive = true;
    }
    return alive;
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
    var w = camWant(), k = dt && !RM ? (G.az !== a0 ? 1 : 1 - Math.exp(-dt * (5 + 3 * (G.run || 0)))) : 1;
    var moved = G.camPos.distanceToSquared(w.pos) > 1e-6 || G.look.distanceToSquared(w.look) > 1e-6;
    G.camPos.lerp(w.pos, k); G.look.lerp(w.look, k);
    camera.position.copy(G.camPos); camera.lookAt(G.look);
    /* v5.40 달리기 = 시야각이 조금 넓어진다(+7도 · 움직임 줄이기 = 그대로) */
    var fk = RM ? 0 : (G.run || 0), f0 = G.fovK; G.fovK += (fk - G.fovK) * (dt ? 1 - Math.exp(-dt * (fk > G.fovK ? 6 : 9)) : 1); if (Math.abs(G.fovK - fk) < 0.002) G.fovK = fk;
    if (G.fovK !== f0) { camera.fov = G.fov0 + 7 * G.fovK; camera.updateProjectionMatrix(); moved = true; }
    /* 기둥 비우기 · 카메라 → 머리 선분이 기둥(높이 5m) 안을 지나면 */
    var hx = G.pos.x, hz = G.pos.z, cx = G.camPos.x, cz = G.camPos.z, cy = G.camPos.y, sx = hx - cx, sz = hz - cz, L2 = sx * sx + sz * sz || 1, any = false;
    for (var i = 0; i < PIL.length; i++) {
      var px = PIL[i][0] - 16, pz = 6 - PIL[i][1], t = ((px - cx) * sx + (pz - cz) * sz) / L2, tt = clamp(t, 0, 1), d = Math.hypot(cx + sx * tt - px, cz + sz * tt - pz), ly = cy + (1.25 - cy) * tt;
      var cdp = Math.hypot(cx - px, cz - pz);
      G.fadeTo[i] = ((t > -0.05 && t < 1.02 && d < 0.95 && ly < 5.2) || cdp < 1.1) ? 0.16 : 1;
      var f0 = G.fade[i]; G.fade[i] += (G.fadeTo[i] - G.fade[i]) * (1 - Math.exp(-dt * 9)); if (Math.abs(G.fade[i] - G.fadeTo[i]) < 0.01) G.fade[i] = G.fadeTo[i];
      if (G.fade[i] !== f0) any = true;
    }
    var wf = stepWallFade(dt);   /* v5.45 가벽도 시선을 가리면 점점이 비운다 */
    return moved || any || wf;
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
    [{ label: '고객센터', at: P(5.25, 23.2, 3.0) }].forEach(function (l) {   /* v5.45 미팅룸 3 자리 = 고객센터(사용자 261004) */
      var d = document.createElement('div'); d.className = 'pin lm'; d.innerHTML = '<span class="s">' + esc(l.label) + '</span>';
      box.appendChild(d); pinEls.push({ el: d, at: l.at, max: 20, lm: true });
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
      /* 걸음 막기 · v5.38 칸 번호로 꽉 찬 원(옛 코드는 소수 좌표를 0.1m 씩 더해 칸을 구해 반올림 오차로 원 안에 빈칸이 줄줄이 생겼고, 캐릭터가 그 틈으로 스태프를 뚫고 지나갔다 · 사용자 261003 「캐릭터가 겹치는 버그」) */
      blockDisc(q[0], q[1], GUIDE_R);
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
  /* 말풍선 「판 보기」로 열면 늘 그 지점 첫 판부터(사용자 261003) · 간판은 건너뛴 첫 내용 판 · 두 줄 구역(PLAY)은 지금 서 있는 줄의 첫 판 · 판을 직접 누르면 그 판부터 */
  function firstPg(z) {
    var p = G.pos, best = null, bd = 1e9;
    z.rows.forEach(function (r) {
      var n = r.pages.length, mx = r.a[0] + r.r[0] * n / 2, mz = r.a[1] + r.r[1] * n / 2, q = toThree(mx, mz), d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d < bd) { bd = d; best = r.pages[0]; }
    });
    return best;
  }
  function enterPanel(z, pg) {
    if (!pg) pg = firstPg(z);
    var ps = D.zonePages(z), pk = pickFace(z, pg);
    var idx = pg ? ps.indexOf(pg) : (pk ? ps.indexOf(pk.pg) : null);
    if (RM || !pk || G.anim || !G.loaded) { if (RM) flash(); openSheet(z, idx); return; }
    var c = pk.f.userData.c, ph = Math.atan2(c.x - G.pos.x, c.z - G.pos.z); G.mode = G.mode === 'auto' ? 'free' : G.mode; G.path = null; G.stick = null;
    var sh = shotsFor(pk.f);
    G.anim = { kind: 'in', t0: performance.now(), dur: 850, P0: G.camPos.clone(), L0: G.look.clone(), sh: sh, z: z, idx: idx, ph: ph };
    G.lastFace = pk.f; G.lastPh = ph; $('gbub').hidden = true;
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
    G.anim = { kind: 'out', t0: performance.now(), dur: 750, sh: sh, ph: G.lastPh };
  }


  /* ═══════════ 체크인 존 숨김 · 타자왕 TV · 돋보기 표식(사용자 261003) ═══════════ */
  var HIDE_PG = [40, 41, 47];   /* 체크인 천막 현수막 40 · 엑스배너 47 · 출입구 안내 41(천막 묶음과 같이 문 밖 · 체크인이 없으면 홀로 남아 뺌) */
  function hideCheckin() {
    S.lobby.traverse(function (o) { if (o.name === 'checkin' || o.name === 'panel_41') o.visible = false; });
  }
  function buildTypingTv() {
    var tvMat = new T.MeshBasicMaterial({ color: 0x14171C, toneMapped: false });   /* v5.40 화면 그림은 tvAdd 가 픽셀 루프로 채운다(옛 한글 글자 그림 · 밝기 깜빡임은 걷음) */
    var gp = new T.Group(), dark = new T.MeshLambertMaterial({ color: 0x1D2127 });
    var frame = new T.Mesh(new T.BoxGeometry(0.06, 1.18, 0.68), dark); frame.position.set(0, 1.3, 0); gp.add(frame);
    var scr = new T.Mesh(new T.PlaneGeometry(0.6, 1.08), tvMat); scr.rotation.y = Math.PI / 2; scr.position.set(0.04, 1.3, 0); gp.add(scr);
    var pole = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.72, 8), dark); pole.position.set(-0.05, 0.36, 0); gp.add(pole);
    var base = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.02, 20), dark); base.position.set(-0.05, 0.01, 0); gp.add(base);
    var at = [0.95, 1.25]; gp.position.copy(toThree(at[0], at[1])); S.lobby.add(gp);   /* 타자왕 판(39) 왼쪽(남쪽) · 동쪽(통로)을 봄 */
    gp.userData = { promo: true }; gp.traverse(function (o) { o.userData = { promo: true }; });
    blockDisc(at[0], at[1], 0.51); ROUND.push({ x: at[0], z: at[1], r: 0.51 });
    tvAdd(scr, 72, 128, 'typing');   /* v5.40 화면 = 타자왕 홍보 픽셀 루프(옛 글자 그림 「재생 중」 대신) */
  }
  /* ═══════════ TV 화면 재생(v5.40 · 사용자 261003 「tv 화면들이 까맣다 · 영상이 재생되면 좋겠어(16비트 영상이어도 좋아)」) ═══════════
   * 영상 파일 없음 · 화면마다 작은 캔버스(가로 128x72 · 세로 64x80 · 타자왕 72x128)에 픽셀 그림을 초당 10장(느린 기기 6장) 그려 CanvasTexture 로 올린다(받는 용량 0)
   * 화면 찾기 = 모형의 화면 면 색(정점 색 0.012 · 테두리 0.02 · 바닥 0.1)으로 찾는다 · 비전 · AX in Action · HiDI-Q · Hi-Helper TV 4대 + 포토부스 키오스크 1대 + 덧붙인 타자왕 TV 1대 = 6
   * 장면(화면마다 순서 · 시작 시각을 달리함): 행사명 「AX Festival」 + 「2026」 · 「ME to WE」(ME 에서 WE 로 번지는 물결) · 오렌지 사다리 픽셀 물결 · 타자왕 TV 는 「TYPING KING」 타자 루프
   * 글자 = 이 화면 전용 5x7 픽셀 글자(영문 · 숫자만 · 한글 없음 · 점 글자 DotGlyph 아님) · 표기 그대로(AX Festival 2026 · ME to WE)
   * 아끼기: 화면 밖 · 등진 쪽 · 16m 밖 TV 는 그리지 않는다(마지막 장면 그대로) · 움직임 줄이기 = 정지 한 장 */
  var TVS = [], TV_FPS = 10, tvLast = 0, TV_INK = 0.016, _fr = new T.Frustum(), _pm = new T.Matrix4(), _tv = new T.Vector3();
  function px32(hex) { return (255 << 24 | (hex & 255) << 16 | (hex >> 8 & 255) << 8 | hex >> 16) >>> 0; }
  function pxMix(a, b, k) { var r = ((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k, g = ((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k, bl = (a & 255) * (1 - k) + (b & 255) * k; return px32((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl)); }
  var TVC = { bg: 0x14171C, dot: 0x2A2F37, o100: 0xFF7E31, o50: 0xFFB284, o25: 0xFFD8C1, o10: 0xFFEBE0, grey: 0xD9D9D9, white: 0xFFFFFF };
  var TVP = {}; Object.keys(TVC).forEach(function (k) { TVP[k] = px32(TVC[k]); });
  var LADDER = [TVP.o100, TVP.o50, TVP.o25, TVP.o10];
  /* 5x7 픽셀 글자 · 줄마다 5비트(왼쪽이 큰 자리) */
  var FONT = {
    A: [14, 17, 17, 31, 17, 17, 17], E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], I: [14, 4, 4, 4, 4, 4, 14],
    K: [17, 18, 20, 24, 20, 18, 17], M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
    T: [31, 4, 4, 4, 4, 4, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17], Y: [17, 17, 10, 4, 4, 4, 4],
    a: [0, 0, 14, 1, 15, 17, 15], e: [0, 0, 14, 17, 31, 16, 14], i: [4, 0, 12, 4, 4, 4, 14], l: [12, 4, 4, 4, 4, 4, 14], o: [0, 0, 14, 17, 17, 17, 14],
    s: [0, 0, 15, 16, 14, 1, 30], t: [8, 8, 28, 8, 8, 9, 6], v: [0, 0, 17, 17, 17, 10, 4],
    0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], ':': [0, 12, 12, 0, 12, 12, 0]
  };
  function txtW(s, k) { var w = 0; for (var i = 0; i < s.length; i++) w += (s[i] === ' ' ? 3 : 6) * k; return w - k; }
  function txt(v, s, x, y, k, col, n) {   /* n = 앞에서 몇 글자까지(타자 효과) · col = 색 하나 또는 글자마다 색 함수 */
    for (var i = 0; i < s.length && (n == null || i < n); i++) {
      var ch = s[i]; if (ch === ' ') { x += 3 * k; continue; }
      var gl = FONT[ch], c = typeof col === 'function' ? col(i, x) : col;
      if (gl) for (var r = 0; r < 7; r++) for (var b = 0; b < 5; b++) if (gl[r] >> (4 - b) & 1) rect(v, x + b * k, y + r * k, k, k, c);
      x += 6 * k;
    }
    return x;
  }
  function rect(v, x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); var x1 = Math.min(v.cw, x + w), y1 = Math.min(v.ch, y + h);
    for (var yy = Math.max(0, y); yy < y1; yy++) { var o = yy * v.cw; for (var xx = Math.max(0, x); xx < x1; xx++) v.buf[o + xx] = c; }
  }
  function grid(v, lit) {   /* 4칸 간격 점 격자 · lit(x, y) 가 0~1 을 주면 그만큼 주황 사다리로 켜진다 */
    for (var y = 2; y < v.ch; y += 4) for (var x = 2; x < v.cw; x += 4) { var k = lit ? lit(x, y) : 0; v.buf[y * v.cw + x] = k > 0.02 ? (k > 0.75 ? TVP.o100 : k > 0.5 ? TVP.o50 : k > 0.25 ? pxMix(TVC.dot, TVC.o100, 0.55) : pxMix(TVC.dot, TVC.o100, 0.25)) : TVP.dot; }
  }
  var SCN = {
    fest: function (v, t) {   /* 행사명 · 글자가 하나씩 켜지고 대각선 빛띠가 점 격자를 지나간다 */
      var band = (t * 46) % (v.cw + v.ch + 60) - 30;
      grid(v, function (x, y) { var d = Math.abs(x + y * 0.6 - band); return d < 10 ? 1 - d / 10 : 0; });
      var land = v.cw > v.ch, n = Math.floor(t * 9);
      if (land) {
        var s1 = 'AX Festival', w1 = txtW(s1, 1), x1 = (v.cw - w1) / 2;
        txt(v, s1, x1, 18, 1, function (i) { return i < 2 ? TVP.o100 : TVP.white; }, n);
        if (n > 11) { var w2 = txtW('2026', 2); txt(v, '2026', (v.cw - w2) / 2, 32, 2, TVP.o50, Math.floor((t - 11 / 9) * 7)); }
        if (n <= 11 && Math.floor(t * 3) % 2 === 0) rect(v, x1 + txtW(s1.slice(0, Math.min(n, 11)), 1) + 2, 18, 4, 7, TVP.o100);
      } else {
        var ls = ['AX', 'Festival', '2026'], cs = [TVP.o100, TVP.white, TVP.o50], y0 = Math.round((v.ch - 3 * 7 - 2 * 6) / 2), used = 0;
        ls.forEach(function (s, li) { txt(v, s, (v.cw - txtW(s, 1)) / 2, y0 + li * 13, 1, cs[li], Math.max(0, n - used)); used += s.length; });
      }
    },
    metowe: function (v, t) {   /* ME to WE · ME 에서 둥근 물결이 번져 WE 까지 닿으면 WE 가 주황으로 켜진다 */
      var land = v.cw > v.ch, k = land ? 2 : 1, s = 'ME to WE';
      var cx = land ? (v.cw - txtW(s, k)) / 2 + 5 * k : v.cw / 2, cy = land ? v.ch / 2 : v.ch / 2 - 13, R = (t * 34) % (v.cw * 1.3), R2 = (t * 34 + v.cw * 0.65) % (v.cw * 1.3);
      grid(v, function (x, y) { var d = Math.hypot(x - cx, y - cy), a = Math.abs(d - R), b = Math.abs(d - R2); var m = Math.min(a, b); return m < 5 ? (1 - m / 5) * (1 - Math.min(1, d / (v.cw * 1.2))) : 0; });
      var hitWE = (R > v.cw * 0.55 && R < v.cw * 0.9) || (R2 > v.cw * 0.55 && R2 < v.cw * 0.9);
      if (land) {
        var x0 = (v.cw - txtW(s, k)) / 2, y0 = (v.ch - 7 * k) / 2;
        txt(v, s, x0, y0, k, function (i) { return i < 2 ? TVP.o100 : i < 5 ? TVP.grey : (hitWE ? TVP.o100 : TVP.white); });
      } else {
        var y1 = Math.round((v.ch - 3 * 7 - 2 * 6) / 2);
        txt(v, 'ME', (v.cw - txtW('ME', 1)) / 2, y1, 1, TVP.o100); txt(v, 'to', (v.cw - txtW('to', 1)) / 2, y1 + 13, 1, TVP.grey); txt(v, 'WE', (v.cw - txtW('WE', 1)) / 2, y1 + 26, 1, hitWE ? TVP.o100 : TVP.white);
      }
    },
    wave: function (v, t) {   /* 오렌지 사다리 물결 · 세 겹이 서로 다른 빠르기로 흐른다(막대 2칸 폭) */
      rect(v, 0, 0, v.cw, v.ch, TVP.bg);
      for (var x = 0; x < v.cw; x += 2) {
        for (var L = 3; L >= 0; L--) {
          var h = v.ch * (0.2 + 0.11 * L) + Math.sin(x * 0.07 + t * (1.6 - L * 0.3) + L * 1.7) * v.ch * 0.09 + Math.sin(x * 0.023 - t * 0.7 + L) * v.ch * 0.06;
          var top = Math.round(v.ch - h); rect(v, x, top, 2, v.ch - top, LADDER[3 - L]);
        }
      }
      for (var y = 1; y < v.ch; y += 4) for (var xx = 1; xx < v.cw; xx += 4) if (v.buf[y * v.cw + xx] === TVP.bg) v.buf[y * v.cw + xx] = TVP.dot;
    },
    typing: function (v, t) {   /* 타자왕 TV · TYPING KING 을 한 글자씩 치고 · TOP 3 · 17:00 · 아래 건반이 눌린다 · 7초 반복 */
      var tt = t % 7, n = Math.floor(tt * 5);
      grid(v, null);
      var y0 = 14, k = 2, w1 = txtW('TYPING', k), w2 = txtW('KING', k);
      var e1 = txt(v, 'TYPING', (v.cw - w1) / 2, y0, k, TVP.white, n);
      var e2 = n > 6 ? txt(v, 'KING', (v.cw - w2) / 2, y0 + 20, k, TVP.o100, n - 6) : 0;
      if (n <= 10 || Math.floor(t * 3) % 2 === 0) { var cx = n <= 6 ? e1 : e2, cy = n <= 6 ? y0 : y0 + 20; if (n < 10) rect(v, cx, cy, 4, 14, TVP.o100); }
      if (n >= 11) { txt(v, 'TOP 3', (v.cw - txtW('TOP 3', 1)) / 2, 58, 1, TVP.o50); txt(v, '17:00', (v.cw - txtW('17:00', 1)) / 2, 70, 1, TVP.grey); }
      /* 건반 3줄 · 치는 동안 무작위 칸이 주황으로 */
      var seed = Math.floor(t * 6);
      for (var r = 0; r < 3; r++) for (var c = 0; c < 8; c++) {
        var kx = 4 + c * 8 + (r === 1 ? 2 : r === 2 ? 4 : 0), ky = 92 + r * 9; if (kx + 6 > v.cw) continue;
        var on = n < 11 && ((seed * 7 + r * 13 + c * 5) % 17 === 0 || (seed * 3 + c + r * 5) % 23 === 0);
        rect(v, kx, ky, 6, 7, on ? TVP.o100 : pxMix(TVC.dot, TVC.grey, 0.25)); rect(v, kx, ky + 6, 6, 1, pxMix(TVC.bg, TVC.dot, 0.5));
      }
      rect(v, 12, 119, v.cw - 24, 6, pxMix(TVC.dot, TVC.grey, 0.25));
    }
  };
  var TV_SEQ = ['fest', 'metowe', 'wave'], TV_DUR = { fest: 7, metowe: 7, wave: 6 };
  function tvAdd(mesh, cw, ch, kind) {
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    var ctx = cv.getContext('2d'), img = ctx.createImageData(cw, ch), tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace; tex.magFilter = T.NearestFilter; tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
    mesh.material.map = tex; mesh.material.color.set(0xFFFFFF); mesh.material.polygonOffset = true; mesh.material.polygonOffsetFactor = -2; mesh.material.polygonOffsetUnits = -4; mesh.material.needsUpdate = true;   /* 아래 모형 화면(앞 층 · polygonOffset -1)보다 늘 앞 */
    mesh.updateWorldMatrix(true, false);
    var c = new T.Vector3().setFromMatrixPosition(mesh.matrixWorld), n = new T.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld);
    var v = { mesh: mesh, cv: cv, ctx: ctx, img: img, buf: new Uint32Array(img.data.buffer), tex: tex, cw: cw, ch: ch, kind: kind, c: c, n: n, sphere: new T.Sphere(c, 0.9),
      i: TVS.length, ph: TVS.length * 2.3, on: false, drawn: 0, w: +(mesh.geometry.parameters.width || 0).toFixed(2), h: +(mesh.geometry.parameters.height || 0).toFixed(2) };
    TVS.push(v); tvDraw(v, RM ? 30 : 0); return v;
  }
  function tvDraw(v, t) {
    rect(v, 0, 0, v.cw, v.ch, TVP.bg);
    var name;
    if (v.kind === 'typing') { name = 'typing'; if (RM) t = 3.2; }
    else if (RM) { name = 'fest'; t = 30; }
    else {
      var tot = 0; TV_SEQ.forEach(function (s) { tot += TV_DUR[s]; });
      var tl = (t + v.ph) % tot, k = v.i % TV_SEQ.length;
      for (var j = 0; j < TV_SEQ.length; j++) { name = TV_SEQ[(k + j) % TV_SEQ.length]; if (tl < TV_DUR[name]) break; tl -= TV_DUR[name]; }
      t = tl;
    }
    SCN[name](v, t); v.scene = name;
    v.ctx.putImageData(v.img, 0, 0); v.tex.needsUpdate = true; v.drawn++;
  }
  /* 모형의 화면 면 찾기 · 정점 색이 TV_INK 아래인 세로 면을 메시마다 1.2m 안에서 묶는다 · 화면 앞 1cm 에 그림 판을 덧붙인다(누르면 아래 모형과 같은 일 · userData 복사) */
  function buildTvs() {
    var va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), vn = new T.Vector3(), cl = [];
    S.lobby.updateMatrixWorld(true);
    S.lobby.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.color || !o.geometry.attributes.normal) return;
      var g = o.geometry, pos = g.attributes.position, col = g.attributes.color, nrm = g.attributes.normal, idx = g.index, n = idx ? idx.count : pos.count;
      for (var t = 0; t < n; t += 3) {
        var ia = idx ? idx.getX(t) : t, ib = idx ? idx.getX(t + 1) : t + 1, ic = idx ? idx.getX(t + 2) : t + 2;
        if (col.getX(ia) > TV_INK || col.getX(ib) > TV_INK || col.getX(ic) > TV_INK) continue;
        vn.fromBufferAttribute(nrm, ia).transformDirection(o.matrixWorld); if (Math.abs(vn.y) > 0.3) continue;
        va.fromBufferAttribute(pos, ia).applyMatrix4(o.matrixWorld); vb.fromBufferAttribute(pos, ib).applyMatrix4(o.matrixWorld); vc.fromBufferAttribute(pos, ic).applyMatrix4(o.matrixWorld);
        var cx = (va.x + vb.x + vc.x) / 3, cy = (va.y + vb.y + vc.y) / 3, cz = (va.z + vb.z + vc.z) / 3, hit = null;
        for (var k = 0; k < cl.length; k++) if (cl[k].o === o && Math.hypot(cl[k].cx - cx, cl[k].cz - cz) < 1.2) { hit = cl[k]; break; }
        if (!hit) { hit = { o: o, cx: cx, cz: cz, b: new T.Box3(), n: new T.Vector3() }; cl.push(hit); }
        hit.b.expandByPoint(va); hit.b.expandByPoint(vb); hit.b.expandByPoint(vc); hit.n.add(vn);
      }
    });
    cl.forEach(function (q) {
      var n = q.n.normalize(), sz = q.b.getSize(new T.Vector3()), w = Math.abs(n.x) > Math.abs(n.z) ? sz.z : sz.x, h = sz.y;
      if (w < 0.3 || h < 0.3) return;
      var land = w / h > 1.2, cw = land ? 128 : 64, ch = land ? 72 : Math.round(64 * h / w);
      var m = new T.Mesh(new T.PlaneGeometry(w * 0.985, h * 0.985), new T.MeshBasicMaterial({ color: 0x14171C, toneMapped: false }));
      var c = q.b.getCenter(new T.Vector3()); m.position.copy(c).addScaledVector(n, 0.01); m.rotation.y = Math.atan2(n.x, n.z);
      m.name = 'tvScreen'; m.userData = Object.assign({}, q.o.userData, { tv: true }); S.lobby.add(m);
      tvAdd(m, cw, ch, land ? 'tv' : 'kiosk');
    });
    G.tvN = TVS.length;
  }
  function tvStep(now) {
    if (!TVS.length || G.tvOff) return false;   /* tvOff = 시험용(성능 비교) */
    if (RM) { if (!G.tvRM) { G.tvRM = true; TVS.forEach(function (v) { tvDraw(v, 30); }); return true; } return false; }
    if (G.tvRM) { G.tvRM = false; }
    if (now - tvLast < 1000 / TV_FPS) return false;
    tvLast = now; var tw = performance.now();
    camera.updateMatrixWorld(); _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    var any = false, t = now / 1000;
    TVS.forEach(function (v) {
      _tv.copy(camera.position).sub(v.c);
      v.on = _tv.length() < 16 && _tv.dot(v.n) > 0 && _fr.intersectsSphere(v.sphere) && isShown(v.mesh);
      if (v.on) { tvDraw(v, t); any = true; }
    });
    G.tvOn = TVS.filter(function (v) { return v.on; }).length; var tm = performance.now() - tw; G.tvMs = G.tvMs == null ? tm : G.tvMs * 0.9 + tm * 0.1; G.tvMax = Math.max(G.tvMax || 0, tm);   /* 진단 · 한 번 그리는 데 든 시간 */
    return any;
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
        '<div class="pic"><div class="pz' + (p.img.length > 1 ? ' two' : '') + '">' + p.img.map(function (im) { return '<span class="ph"><img alt="' + esc(p.nm) + '" data-src="' + ROOT + 'assets/prize/' + im + '.webp"><i>샘플</i></span>'; }).join('') + '</div></div></article>';
    });
    openSheet({ name: '룰렛 경품' }, 0, null, cards);
  }
  /* 타자왕 순위판 · 1층 TV 와 같은 전체 루프(../tv/typing/ · 후킹 · 게임 · 하는 법 · 상품 · 순위 TOP 10 · 마감 · 순위 30초 폴링 · 사용자 261003 「1층 랭킹 보드 화면 그대로 · 등수도」) · 시트 안 9:16 · 닫으면 iframe 을 비워 폴링 멈춤 */
  function openPromo() {
    var v = $('vid'), b = $('vbody'); v.hidden = false; G.sheetOpen = true;
    var W = b.clientWidth - 24, H = b.clientHeight - 24, w = Math.min(W, H * 9 / 16), h = w * 16 / 9;
    b.innerHTML = '<iframe title="1F 타자왕 순위판" src="' + ROOT + 'tv/typing/?open=1" style="width:' + w.toFixed(0) + 'px;height:' + h.toFixed(0) + 'px" allow="autoplay" loading="eager"></iframe>';
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
    var B = D.BLD, S2 = MM.S, o = '<svg viewBox="0 0 ' + S2.toFixed(1) + ' ' + S2.toFixed(1) + '" aria-hidden="true"><g id="t3-mmRot">';
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
    o += '<rect x="' + mmX(WW.x1 - WW.w) + '" y="' + mmY(WW.z + 0.15) + '" width="' + (WW.w * MM.k).toFixed(1) + '" height="2" fill="#191F28"/>';   /* v5.45 가벽 */
    o += '<g id="t3-mmMe"><path d="M0,-8 L5,3 L0,1 L-5,3 Z" fill="#191F28"/><circle r="4.2" fill="#FF7F32" stroke="#FFFFFF" stroke-width="1.5"/></g></g></svg>';
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
    /* v5.38 조그(엄지 스틱 · 사용자 261003 「안의 버튼이 내가 조작하는 방향으로 움직이는 느낌」) · 링은 고정 · 손잡이는 손가락을 따라 밀리되 링 안(35px)에 머문다
     * 손잡이 자리 = 입력 그대로(손잡이가 가리키는 쪽 = 걷는 쪽) · 누르는 동안 살짝 작아지고 그림자가 줄며 밀린 쪽 링 가장자리가 은은하게 밝아진다 · 떼면 0.18초 탄성으로 가운데 · 움직임 줄이기 = 바로 */
    function setKnob(sx, sy, on) {
      pad.classList.toggle('on', !!on); pad.classList.toggle('back', !on);
      knob.style.transform = on ? 'translate(' + (sx * 35).toFixed(1) + 'px,' + (sy * 35).toFixed(1) + 'px) scale(.92)' : '';   /* 손잡이(지름 58 · 눌림 .92)가 링(반지름 64) 안에 머물게 35px 까지 · 손가락은 48px 에서 최고 속도 */
      var m = Math.hypot(sx, sy);
      pad.style.setProperty('--ka', on && m > 0.12 ? Math.min(1, m).toFixed(2) : '0');
      if (m > 0.01) { pad.style.setProperty('--kx', (50 + sx / m * 50).toFixed(1) + '%'); pad.style.setProperty('--ky', (50 + sy / m * 50).toFixed(1) + '%'); }
    }
    G.knob = function () { return { on: pad.classList.contains('on'), tf: knob.style.transform, ka: pad.style.getPropertyValue('--ka') }; };
    function padMove(e) {
      var r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, R = 48, m = Math.hypot(dx, dy), k = m > R ? R / m : 1;
      var sx = dx * k / R, sy = dy * k / R; setKnob(sx, sy, true);
      G.stick = Math.hypot(sx, sy) < 0.12 ? { x: 0, y: 0 } : { x: sx, y: sy }; G.need = true;
    }
    pad.addEventListener('pointerdown', function (e) {
      if (pp != null || !G.loaded || G.scn !== 'lobby') return; e.preventDefault();
      pp = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (x) {}
      G.moved = true; G.path = null; G.goal = null; $('dest').hidden = true; padMove(e);
    });
    pad.addEventListener('pointermove', function (e) { if (e.pointerId === pp) padMove(e); });
    function padEnd(e) { if (e.pointerId !== pp) return; pp = null; setKnob(0, 0, false); G.stick = null; nearestStop(); updateUi(true); }
    pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
    pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    /* 키보드(데스크톱 확인용) · 화살표 = 걷기 */
    var keys = {};
    window.addEventListener('keydown', function (e) {
      if (!G.open) return;
      if (G.sheetOpen) return;
      if (/^Arrow/.test(e.key)) { keys[e.key] = 1; G.stick = keyStick(); setKnob(G.stick.x, G.stick.y, true); G.need = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', function (e) { if (!G.open) return; if (/^Arrow/.test(e.key)) { delete keys[e.key]; G.stick = Object.keys(keys).length ? keyStick() : null; if (G.stick) setKnob(G.stick.x, G.stick.y, true); else { setKnob(0, 0, false); nearestStop(); updateUi(true); } } });
    function keyStick() { var x = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), y = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0), m = Math.hypot(x, y) || 1; return { x: x / m, y: y / m }; }   /* 대각 = 손잡이도 링 안 대각(길이 1) */
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
      if (o.userData && o.userData.door && h.point.y > 0.2) continue;   /* v5.38 정문 덧붙임(유리 반사 · 띠 · 틀)은 누름을 막지 않는다 */
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
    G.fov0 = W / H < 0.75 ? 62 : 52; camera.fov = G.fov0 + 7 * G.fovK; camera.updateProjectionMatrix(); S.resize(); G.need = true;
  }
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, G.last ? (now - G.last) / 1000 : 0.016); G.last = now;
    if (!G.ok || !G.open || G.sheetOpen || G.mapMode || G.hold) return;
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
    if (G.loaded && G.scn === 'lobby' && tvStep(now)) busy = true;   /* v5.40 TV 화면 · 초당 10장 · 보이는 것만 */
    if (!busy && !G.need && !G.showFps) return;
    G.need = false;
    S.frame(camera, G.scn); if (G.ceil) G.ceil.visible = false; renderer.render(scene, camera); placePins(); mini(); placeBubble(); placeMags();
    var wm = performance.now() - w0; G.workMs = G.workMs == null ? wm : G.workMs * 0.95 + wm * 0.05; G.workMax = Math.max(G.workMax || 0, wm);
    if (!$('dest').hidden && G.destAt) { _p.copy(G.destAt).project(camera); $('dest').style.left = ((_p.x + 1) / 2 * $('stage').clientWidth).toFixed(1) + 'px'; $('dest').style.top = ((1 - _p.y) / 2 * $('stage').clientHeight).toFixed(1) + 'px'; }
    G.frames.push(now); while (G.frames.length && now - G.frames[0] > 1000) G.frames.shift();
    if (G.showFps) { $('fps').hidden = false; $('fps').textContent = G.diag ? diagText() : 'fps ' + G.frames.length + ' · ' + renderer.info.render.calls + ' draw · dpr ' + renderer.getPixelRatio() + ' · z' + G.depthBits; }
    if (G.bench) { G.bench.ts.push(now); if (now - G.bench.t0 > G.bench.ms) { var b = G.bench; G.bench = null; b.done(summ(b.ts)); } }
    if (G.loaded && !G.probed) { G.probe.push(now); if (G.probe.length >= 50) { G.probed = true; var s = summ(G.probe); G.probeResult = s; if (s.p50 > 34) { renderer.setPixelRatio(1); S.lowPower(); resize(); TV_FPS = 6; MUS.lite = true; } } }
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
      if (!G.open) return;
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
  function maybeHelp() { if (Q.get('nohelp') !== '1' && !store.get('axfTour3Help')) showHelp(); }
  /* 입장 연출 · 던전 이동처럼 암전(처음부터 검은 화면 · 받는 동안 「불러오는 중」) → 가운데 「1F · AX Festival 2026」 0.8초 → 밝아지며 높은 스카이뷰 → 캐릭터로 줌인(1.3초) → 처음 안내 · 합 2.5초 안 · 움직임 줄이기 = 짧은 페이드만 */
  function entrance() {
    var bk = $('black'), t = $('blackT');
    t.textContent = '1F · AX Festival 2026'; t.classList.add('on');
    if (RM) { setTimeout(function () { t.classList.remove('on'); bk.style.opacity = 0; intro(afterIntro); }, 250); return; }
    setTimeout(function () {
      t.classList.remove('on');
      intro(afterIntro);   /* 스카이뷰에서 시작 */
      bk.style.transition = 'opacity .35s'; bk.style.opacity = 0;
    }, 800);
  }
  function showHelp() { $('help').hidden = false; }
  function hideHelp() { $('help').hidden = true; store.set('axfTour3Help', '1'); G.guardT = performance.now(); if (MUS.deferred) { MUS.deferred = false; musStart(2); } }   /* v5.38 첫 입장 음악 = 「시작하기」 누름에서 */   /* 닫는 탭이 아래 버튼까지 가지 않게 0.5초 막음 */

  /* ═══════════ 로비 음악(v5.38 · 사용자 261003 「1층 로비에서 잔잔한 음악이 나오면 좋겠어」 · v5.40 카페 음악으로 바꿈) ═══════════
   * v5.40 사용자 261003 「카페에 와 있는 것 같은 상큼한 기분 · 영감을 얻을 수 있을 것 같은 느낌」 · 소리 크기는 그대로(사용자 결정 · 마스터 0.42)
   * 파일 없음 · Web Audio 로 그 자리에서 합성(저작권 걱정 없음 · 받는 용량 0) · 로파이 카페(84bpm · D 장조 · 스윙) · v5.40 보사노바(A)와 미리 듣기 비교 뒤 사용자가 B 로 결정(261003)
   *   일렉트릭 피아노(FM 두 오실레이터 · 로즈 계열 · 트레몰로 · 천천히 좌우)로 메이저 7 · 9 화음을 엇박 리듬으로 친다 · 성부는 가까운 자리로 이어 간다
   *   화음 진행 8가지(I vi ii V · IV iii ii V · ii V I I 등)에서 무작위 · 가끔 대리 화음 · 마디 끝 ii V 쪼개기 · 같은 진행이 이어지지 않음
   *   둥근 베이스(사인 + 삼각 · 낮은 거름) · 아주 작은 하이햇(잡음 한 장을 돌려 씀) · 브러시 스네어 · 부드러운 킥
   *   가끔 짧은 멜로디(2 · 4마디째에 주로 · 3~5음 · 앞 소절 리듬을 반쯤 다시 써서 이어지는 느낌) · 잔향 2.2초
   * 아끼기: 피아노 · 멜로디 동시 발음 최대 16(느린 기기 9) · 느린 기기 = 쉐이커 반 · 멜로디 덜
   * 켜고 끄기: 들어갈 때 2초 동안 커짐 · 나갈 때(검은 전환과 함께) 0.6초 동안 줄고 AudioContext 닫음(배터리) · 화면이 숨으면 멈춤(suspend) · 돌아오면 다시
   *   첫 입장 = 처음 안내의 「시작하기」(누름)에서 시작 · 「음악 없이」를 고르면 AudioContext 를 만들지 않는다 · 위쪽 스피커 버튼과 같은 설정(axfTour3Music · 기본 켬)
   *   모바일 자동 재생 제한 = 여는 누름 안에서 만들고 · 그래도 멈춰 있으면 화면 첫 누름에서 다시 깨운다 · navigator.audioSession = ambient(듣던 음악을 끊지 않고 무음 모드를 따른다 · 닫으면 되돌림)
   * 끄려면 AXTour.open({ music: false }) · 버튼도 숨는다 */
  var MUS = { want: true, ctx: null, out: null, st: null, timer: 0, gen: 0, made: 0, deferred: false, oldType: null, lite: false };
  var MUS_VOL = 0.42, TRIM_B = 0.42, SNV_B = 0.035;   /* 미리 듣기 렌더 기준 최고 약 -15 dBFS · 평균(RMS) 약 -27 dBFS(배경 음악 크기 · v5.38 과 같게 맞춤) */
  /* 스타일 · b = 로파이(앱 · 사용자 261003 결정) · a = 보사노바(v5.40 · 되돌림 · 미리 듣기 비교용 · musOffline 에서만) · trim = 악기 합 크기(스타일마다 v5.38 크기에 맞춤) */
  var MUS_STY = 'b', MSTY = {
    a: { bpm: 94, key: 53, swing: 0.03, comp: [[[0, 1.4], [1.5, 0.45], [2.5, 1.3]], [[0.5, 0.9], [2, 0.45], [3, 0.9]], [[0, 2.3], [2.5, 0.45], [3.5, 0.45]], [[1, 0.45], [1.5, 1.2], [3, 0.9]]],
      bass: [[0, 0, 1.3], [1.5, 0, 0.45], [2, 7, 1.3], [3.5, 9, 0.45]], kick: [0, 2], rim: [[0, 1.5, 3], [1, 2.5]], hat: 0.5, mel: 0.55, trim: 0.36, snv: 0.07 },
    b: { bpm: 84, key: 50, swing: 0.16, comp: [[[0, 3.4]], [[0, 1.8], [2.5, 1.4]], [[0.5, 3]]],
      bass: [[0, 0, 1.4], [2.5, 0, 0.4], [3, 7, 0.9]], kick: [0, 2.5], snare: [1, 3], hat: 0.5, mel: 0.45, trim: TRIM_B, snv: SNV_B, kv: 0.16 }
  };
  var MCH = { I: [4, 7, 11, 14], ii: [5, 9, 12, 16], iii: [7, 11, 14, 16], IV: [9, 12, 16, 19], V: [12, 14, 17, 21], vi: [12, 16, 19, 23], bVII: [14, 17, 21, 22] };
  var MROOT = { I: 0, ii: 2, iii: 4, IV: 5, V: 7, vi: 9, bVII: 10 };
  var MPROG = [['I', 'vi', 'ii', 'V'], ['IV', 'iii', 'ii', 'V'], ['I', 'IV', 'iii', 'vi'], ['ii', 'V', 'I', 'I'], ['IV', 'V', 'iii', 'vi'], ['I', 'bVII', 'IV', 'I'], ['vi', 'ii', 'V', 'I'], ['IV', 'IV', 'I', 'I']];
  var MSUB = { I: 'iii', iii: 'I', IV: 'ii', ii: 'IV', vi: 'I' }, MSCALE = [0, 2, 4, 7, 9, 11, 14];
  function musOn() { return OPTS.music !== false; }
  function mhz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function mrand(a) { return a[Math.floor(Math.random() * a.length)]; }
  function musImpulse(c, sec) {
    var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    return b;
  }
  function musGraph(c, dest, sty) {
    var master = c.createGain(); master.gain.value = 0;
    var comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.35;
    var tone = c.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 6200; tone.Q.value = 0.3;
    var trim = c.createGain(); trim.gain.value = (MSTY[sty] || MSTY[MUS_STY]).trim;   /* 악기 합을 v5.38 크기에 맞춤(마스터 0.42 는 그대로) */
    var bus = c.createGain(), dry = c.createGain(), send = c.createGain(), wet = c.createGain(), rev = c.createConvolver();
    dry.gain.value = 0.9; send.gain.value = 0.32; wet.gain.value = 0.5; rev.buffer = musImpulse(c, 2.2);
    bus.connect(dry); bus.connect(send); send.connect(rev); rev.connect(wet); dry.connect(tone); wet.connect(tone); tone.connect(trim); trim.connect(comp); comp.connect(master); master.connect(dest);
    /* 피아노 · 트레몰로(4.8Hz) + 천천히 좌우(0.13Hz) */
    var ep = c.createGain(), trem = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    trem.gain.value = 0.9; lfo.frequency.value = 4.8; lg.gain.value = 0.1; lfo.connect(lg); lg.connect(trem.gain); lfo.start();
    ep.connect(trem);
    if (c.createStereoPanner) { var pan = c.createStereoPanner(), pl = c.createOscillator(), pg = c.createGain(); pl.frequency.value = 0.13; pg.gain.value = 0.3; pl.connect(pg); pg.connect(pan.pan); pl.start(); trem.connect(pan); pan.connect(bus); }
    else trem.connect(bus);
    var bass = c.createGain(), bf = c.createBiquadFilter(); bf.type = 'lowpass'; bf.frequency.value = 820; bf.Q.value = 0.6; bass.connect(bf); bf.connect(dry);   /* 베이스는 잔향 없이 */
    var perc = c.createGain(); perc.connect(bus);
    var rim = c.createBiquadFilter(); rim.type = 'bandpass'; rim.frequency.value = 1700; rim.Q.value = 3; rim.connect(perc);
    var snr = c.createBiquadFilter(); snr.type = 'bandpass'; snr.frequency.value = 2400; snr.Q.value = 0.7; snr.connect(perc);
    var hat = c.createBiquadFilter(); hat.type = 'highpass'; hat.frequency.value = 6500; hat.connect(perc);
    var mel = c.createGain(), ms = c.createGain(); ms.gain.value = 0.35; mel.connect(trem); mel.connect(ms); ms.connect(rev);   /* 멜로디는 잔향을 조금 더 */
    var nz = c.createBuffer(1, Math.floor(c.sampleRate * 0.6), c.sampleRate), nd = nz.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return { master: master, ep: ep, bass: bass, perc: perc, hat: hat, rim: rim, snr: snr, mel: mel, noise: nz };
  }
  function musState(t, sty) { return { t: t, sty: MSTY[sty] || MSTY[MUS_STY], prog: null, pi: 4, prev: null, pm: 77, motif: null, bar: 0, vc: [] }; }
  /* 동시 발음 · 겹치는 소리 수가 넘으면 그 음은 건너뛴다(베이스 · 타악기는 세지 않음) */
  function vOk(st, t, end) {
    var lim = MUS.lite ? 9 : 16, n = 0; st.vc = st.vc.filter(function (q) { return q[1] > t - 0.05; });
    for (var i = 0; i < st.vc.length; i++) if (st.vc[i][0] <= t + 0.01 && st.vc[i][1] > t) n++;
    if (n >= lim) return false; st.vc.push([t, end]); return true;
  }
  /* 로즈 계열 한 음 · 사인 반송파 + 사인 변조(비율 1 · 지수 감쇠) · 4노드 */
  function epNote(c, dst, t, m, vel, dur, bright) {
    var f = mhz(m), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain(), end = t + dur + 0.6;
    car.frequency.value = f; mod.frequency.value = f * (bright ? 2 : 1); car.detune.value = (Math.random() - 0.5) * 6;
    var ix = f * (bright ? 1.1 : 1.6) * (0.5 + vel * 0.6);
    mg.gain.setValueAtTime(ix, t); mg.gain.exponentialRampToValueAtTime(ix * 0.12 + 1, t + 0.35); mg.gain.exponentialRampToValueAtTime(f * 0.05 + 1, end);
    var a = 0.16 * vel; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.006); g.gain.setTargetAtTime(a * 0.3, t + 0.006, 0.4); g.gain.setTargetAtTime(0, t + dur, 0.11);   /* 잇따른 목표값 · 짧은 음도 튀지 않음 */
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(dst);
    car.start(t); mod.start(t); car.stop(end + 0.05); mod.stop(end + 0.05);
  }
  function musBass(c, o, t, m, dur) {
    var a = c.createOscillator(), b = c.createOscillator(), g = c.createGain(), end = t + dur;
    a.type = 'sine'; b.type = 'triangle'; a.frequency.value = b.frequency.value = mhz(m); b.detune.value = 4;
    var bg = c.createGain(); bg.gain.value = 0.35; b.connect(bg); bg.connect(g); a.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.012); g.gain.setTargetAtTime(0.15, t + 0.012, 0.18); g.gain.setTargetAtTime(0, end, 0.04);
    g.connect(o.bass); a.start(t); b.start(t); a.stop(end + 0.15); b.stop(end + 0.15);
  }
  function musNoise(c, o, t, dst, vel, dec, filt) {
    var s = c.createBufferSource(), g = c.createGain(); s.buffer = o.noise;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    if (filt) { s.connect(filt); filt.connect(g); } else s.connect(g);
    g.connect(dst); s.start(t, Math.random() * 0.4); s.stop(t + dec + 0.02);
  }
  function musKick(c, o, t, vel) {
    var s = c.createOscillator(), g = c.createGain(); s.frequency.setValueAtTime(105, t); s.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    s.connect(g); g.connect(o.perc); s.start(t); s.stop(t + 0.32);
  }
  /* 가까운 자리로 · 자리 바꿈(전위) 4가지 × 옥타브 중 앞 화음과 움직임이 가장 작은 것 · 52~79 안 */
  function musVoice(prev, ch, key) {
    var v = MCH[ch], best = null, bd = 1e9;
    for (var r = 0; r < v.length; r++) for (var o = -24; o <= 24; o += 12) {
      var ns = v.map(function (x, i) { return key + x + o + (i < r ? 12 : 0); }).sort(function (a, b) { return a - b; });
      if (ns[0] < 52 || ns[ns.length - 1] > 79) continue;
      var d = prev ? ns.reduce(function (s, m, i) { return s + Math.abs(m - prev[i]); }, 0) : Math.abs(ns[1] - 64) * 4;
      d += Math.random() * 1.5; if (d < bd) { bd = d; best = ns; }
    }
    return best || v.map(function (x) { return key + x; });
  }
  function musMelody(c, o, st, t0, beat, ch, nxt) {
    var key = st.sty.key, pcs = MCH[ch].concat([MROOT[ch]]).map(function (x) { return (key + x) % 12; });
    var scale = []; for (var m = 70; m <= 88; m++) if (MSCALE.some(function (x) { return (key + x) % 12 === m % 12; })) scale.push(m);
    var RH = [[1, 1.5, 2.5], [0, 0.5, 1, 2], [2, 2.5, 3, 3.5], [0.5, 1, 2.5, 3], [1.5, 2, 2.5, 3.5], [0, 1.5, 3]], rh, steps;
    if (st.motif && Math.random() < 0.5) { rh = st.motif.rh; steps = st.motif.steps.map(function (s) { return Math.random() < 0.3 ? -s : s; }); }
    else { rh = mrand(RH); steps = rh.map(function () { return mrand([-2, -1, -1, 1, 1, 2, 0, 3]); }); }
    st.motif = { rh: rh, steps: steps };
    var idx = scale.indexOf(st.pm); if (idx < 0) { idx = 0; var bd = 99; scale.forEach(function (m, i) { if (Math.abs(m - st.pm) < bd) { bd = Math.abs(m - st.pm); idx = i; } }); }
    rh.forEach(function (b, i) {
      idx = clamp(idx + steps[i], 0, scale.length - 1);
      var m = scale[idx];
      if (i === rh.length - 1 || b === 0 || b === 2) { var bestM = m, bd2 = 99; scale.forEach(function (q) { if (pcs.indexOf(q % 12) >= 0 && Math.abs(q - m) < bd2) { bd2 = Math.abs(q - m); bestM = q; } }); m = bestM; idx = scale.indexOf(m); }
      var t = t0 + b * beat + (b % 1 ? st.sty.swing * beat : 0), dur = (i === rh.length - 1 ? 1.2 : 0.42) * beat;
      if (vOk(st, t, t + dur + 0.4)) epNote(c, o.mel, t, m, 0.5 + Math.random() * 0.25, dur, true);
      st.pm = m;
    });
  }
  function musBar(c, o, st) {
    var y = st.sty, beat = 60 / y.bpm, t0 = st.t, key = y.key, lite = MUS.lite;
    if (!st.prog || st.pi >= 4) { var np; do { np = mrand(MPROG); } while (np === st.base && MPROG.length > 1); st.base = np; st.prog = np.slice(); if (Math.random() < 0.3) { var k = Math.floor(Math.random() * 4); if (MSUB[st.prog[k]]) st.prog[k] = MSUB[st.prog[k]]; } st.pi = 0; }
    var ch = st.prog[st.pi], nxt = st.pi < 3 ? st.prog[st.pi + 1] : 'I', split = ch === 'V' && st.pi === 3 && Math.random() < 0.35;
    function sw(b) { return t0 + b * beat + (b % 1 ? y.swing * beat : 0); }
    /* 피아노 */
    var pat = mrand(y.comp), chords = split ? [['ii', 0, 2], ['V', 2, 4]] : [[ch, 0, 4]];
    chords.forEach(function (cc) {
      var vs = musVoice(st.prev, cc[0], key); st.prev = vs;
      pat.forEach(function (h, hi) {
        if (h[0] < cc[1] || h[0] >= cc[2]) return;
        var t = sw(h[0]), dur = h[1] * beat, vel = (h[0] === 0 ? 0.78 : 0.62) + Math.random() * 0.12;
        vs.forEach(function (m, i) { if (lite && i === 0 && hi > 0) return; var tn = t + i * (0.006 + Math.random() * 0.01); if (vOk(st, tn, tn + dur + 0.45)) epNote(c, o.ep, tn, m, vel * (i === vs.length - 1 ? 1 : 0.85), dur, false); });
      });
    });
    /* 베이스 · 근음 · 5도 · 마지막은 다음 화음으로 다가가기(반음 아래 · 위 또는 6도) */
    var root = MROOT[split ? 'ii' : ch], nroot = MROOT[nxt];
    y.bass.forEach(function (b, i) {
      var r = split && b[0] >= 2 ? MROOT.V : root, m = key - 12 + r + b[1];
      if (i === y.bass.length - 1 && Math.random() < 0.5) m = key - 12 + nroot + (Math.random() < 0.5 ? -1 : 1);
      while (m > 50) m -= 12; while (m < 36) m += 12;
      musBass(c, o, sw(b[0]), m, b[2] * beat);
    });
    /* 타악기 · 아주 작게 */
    y.kick.forEach(function (b) { musKick(c, o, sw(b), (y.kv || 0.22) + Math.random() * 0.05); });
    for (var e = 0; e < 8; e++) { if (lite && e % 2) continue; var acc = e % 2 ? 0.05 : 0.028; musNoise(c, o, sw(e * y.hat), o.hat, acc * (0.8 + Math.random() * 0.4), e % 2 ? 0.07 : 0.045, null); }
    if (y.rim) y.rim[st.bar % 2].forEach(function (b) { musNoise(c, o, sw(b), o.rim, 0.11, 0.05, null); });
    if (y.snare) y.snare.forEach(function (b) { musNoise(c, o, sw(b), o.snr, y.snv, 0.22, null); });
    /* 멜로디 · 2 · 4마디째에 주로(첫 마디는 쉼) */
    var pm = (st.pi % 2 === 1 ? y.mel : y.mel * 0.35) * (lite ? 0.6 : 1);
    if (st.bar > 0 && Math.random() < pm) musMelody(c, o, st, t0, beat, split ? 'V' : ch, nxt);
    st.pi++; st.bar++;
    return 4 * beat;
  }
  function musSchedule(c, o, st, until) {
    while (st.t < until) st.t += musBar(c, o, st);
  }
  function musTick() { if (MUS.ctx && MUS.out && MUS.ctx.state !== 'closed') musSchedule(MUS.ctx, MUS.out, MUS.st, MUS.ctx.currentTime + 1.5); }
  function musStart(fade) {
    if (!musOn() || !MUS.want || !G.open || document.hidden) return;
    MUS.gen++;
    if (!MUS.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { if (navigator.audioSession) { if (MUS.oldType == null) MUS.oldType = navigator.audioSession.type; navigator.audioSession.type = 'ambient'; } } catch (e) {}
      try { MUS.ctx = new AC({ latencyHint: 'playback' }); } catch (e) { try { MUS.ctx = new AC(); } catch (e2) { MUS.ctx = null; return; } }
      MUS.made++; MUS.out = musGraph(MUS.ctx, MUS.ctx.destination); MUS.st = musState(MUS.ctx.currentTime + 0.1);
    }
    var c = MUS.ctx; if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    var g = MUS.out.master.gain, now = c.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(MUS_VOL, now + (fade == null ? 2 : fade));
    if (MUS.st.t < now) MUS.st.t = now + 0.05;
    if (!MUS.timer) MUS.timer = setInterval(musTick, 300);
    musTick(); musUi();
  }
  function musStop(close, fade) {
    clearInterval(MUS.timer); MUS.timer = 0;
    var c = MUS.ctx; if (!c) { musUi(); return; }
    var my = ++MUS.gen, f = fade == null ? 0.6 : fade;
    try { var g = MUS.out.master.gain, now = c.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + f); } catch (e) {}
    setTimeout(function () {
      if (my !== MUS.gen || MUS.ctx !== c) return;
      if (close) { try { c.close(); } catch (e) {} MUS.ctx = null; MUS.out = null; MUS.st = null; try { if (navigator.audioSession && MUS.oldType != null) { navigator.audioSession.type = MUS.oldType; MUS.oldType = null; } } catch (e) {} }
      else { try { c.suspend(); } catch (e) {} }
      musUi();
    }, f * 1000 + 80);
    musUi();
  }
  function musSet(on) {   /* 위쪽 스피커 버튼 · 처음 안내의 「음악 없이」 둘 다 이것 하나 */
    MUS.want = !!on; store.set('axfTour3Music', on ? '1' : '0');
    if (on) { if (!MUS.deferred || $('help').hidden) { MUS.deferred = false; musStart(1.2); } }
    else musStop(true, 0.5);
    musUi();
  }
  function musUi() {
    var b = $('bSnd'), k = $('muChk'); if (!b) return;
    b.hidden = !musOn(); b.classList.toggle('off', !MUS.want); b.setAttribute('aria-pressed', MUS.want ? 'true' : 'false'); b.setAttribute('aria-label', MUS.want ? '음악 끄기' : '음악 켜기');
    if (k) k.checked = !MUS.want; var row = $('muRow'); if (row) row.hidden = !musOn();
  }
  function musOpen() {   /* 둘러보기를 여는 누름 안 · 처음 안내가 뜰 차례면 「시작하기」까지 기다린다 */
    MUS.deferred = Q.get('nohelp') !== '1' && !store.get('axfTour3Help');
    musUi(); if (!MUS.deferred) musStart(2);
  }
  function musWire() {
    var v = store.get('axfTour3Music'); MUS.want = v !== '0';
    $('bSnd').onclick = function () { musSet(!MUS.want); };
    $('muChk').onchange = function () { musSet(!$('muChk').checked); };
    /* 자동 재생이 막혀 멈춰 있으면 화면 첫 누름에서 깨운다(처음 안내가 떠 있는 동안 · 아직 고르기 전에는 시작하지 않음) */
    ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) {
      ROOTEL.addEventListener(ev, function () {
        if (!G.open || !musOn() || !MUS.want || MUS.deferred || !$('help').hidden || document.hidden) return;
        if (!MUS.ctx || MUS.ctx.state === 'suspended') musStart(MUS.ctx ? 1 : 2);
      }, true);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (MUS.ctx) musStop(false, 0.15); }
      else if (G.open && MUS.ctx && MUS.want) musStart(1.5);
    });
    musUi();
  }
  /* 미리 듣기 · 같은 합성을 OfflineAudioContext 로(시험 · 미리 듣기 파일용 · 앱 화면에는 쓰지 않음) · o = { rate, ch, style('a' 앱 · 'b' 로파이 비교) } */
  G.musOffline = function (sec, o) {
    o = o || {}; var R = o.rate || 44100, OC = window.OfflineAudioContext || window.webkitOfflineAudioContext, c = new OC(o.ch || 2, Math.round(R * sec), R), g = musGraph(c, c.destination, o.style), st = musState(0.1, o.style);
    g.master.gain.setValueAtTime(0, 0); g.master.gain.linearRampToValueAtTime(MUS_VOL, 2); g.master.gain.setValueAtTime(MUS_VOL, sec - 2.5); g.master.gain.linearRampToValueAtTime(0, sec - 0.1);
    musSchedule(c, g, st, sec);
    return c.startRendering();
  };
  G.mus = function () { return { style: MUS_STY, want: MUS.want, deferred: MUS.deferred, made: MUS.made, state: MUS.ctx ? MUS.ctx.state : 'none', timer: !!MUS.timer, gain: MUS.out ? +MUS.out.master.gain.value.toFixed(3) : null, session: navigator.audioSession ? navigator.audioSession.type : 'n/a' }; };

  /* ═══════════ 시작 ═══════════ */
  function boot() {
    $('bNext').onclick = onNext; $('bPrev').onclick = onPrev; $('bBack1F').onclick = function () { backTo1F(); placeAt(STOPS.length - 1, false); };
    $('cta').hidden = true;   /* 칸 자체를 쓰지 않는다(lab.css .slot) */
    if (Q.get('lbl') === 'a') $('ctl').classList.add('la');
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
    var rs = store.get('axfTour3RM'); if (rs === '1' || rs === '0') RM = rs === '1';
    ROOTEL.classList.toggle('rm', RM); $('rmChk').checked = RM;
    $('rmChk').onchange = function () { RM = $('rmChk').checked; store.set('axfTour3RM', RM ? '1' : '0'); ROOTEL.classList.toggle('rm', RM); G.need = true; };
    musWire();
    $('bHelp').onclick = showHelp; $('hOk').onclick = hideHelp; $('help').addEventListener('click', function (e) { if (e.target === $('help')) hideHelp(); });
    wireSheet();
    var dq = Q.get('t3diag');   /* 시험판 주소 값 · 앱은 index.html 이 주소에 ?t3diag=1 이 있을 때만 window.AXT3_DIAG = true */
    try { localStorage.removeItem('axfT3Diag'); } catch (e) {}   /* v5.47 (사용자 261004 「배포 버전에서도 좌상단에 좌표나 테스트 내용이 뜨는데 없애줘」) 옛 기기 기억(v5.44)은 무시하고 지운다 */
    G.diag = dq === '1' || window.AXT3_DIAG === true; $('fps').classList.toggle('diag', G.diag);
    G.showFps = Q.get('fps') === '1' || G.diag;
    G.t0 = performance.now();
    if (!window.TourScene || !T || !init3D()) { noGl(); return; }
    wireStage(); resize(); window.addEventListener('resize', resize);
    updateUi(true);
    load();
    requestAnimationFrame(loop);
  }
  /* 시험 · 녹화용 손잡이(앱에는 없음) */
  G.api = { scene: function () { return S; }, shotCamKeep: function (x, y, z, lx, ly, lz, face) { camera.position.set(x - 16, y, 6 - z); camera.lookAt(lx - 16, ly, 6 - lz); if (face) { guides.forEach(function (g) { g.m.rotation.y = Math.atan2(camera.position.x - g.m.position.x, camera.position.z - g.m.position.z); }); bot.rotation.y = Math.atan2(camera.position.x - bot.position.x, camera.position.z - bot.position.z); } S.frame(camera, 'lobby'); if (G.ceil) G.ceil.visible = false; renderer.render(scene, camera); G.hold = true; }, shotCam: function (x, y, z, lx, ly, lz) { camera.position.set(x - 16, y, 6 - z); camera.lookAt(lx - 16, ly, 6 - lz); var bv = bot.visible; bot.visible = false; S.frame(camera, 'lobby'); renderer.render(scene, camera); bot.visible = bv; G.hold = true; }, guides: function () { return guides.map(function (g) { return [g.zone, g.at, +g.h.toFixed(2)]; }); }, enter: function (zid, pg) { enterPanel(D.Z(zid), pg || null); }, pose: function (x, z, yaw, h) { G.pos.copy(toThree(x, z)); G.mode = 'free'; G.path = null; G.yaw = yaw; G.h = h == null ? yaw + Math.PI : h; G.yo = 0; G.need = true; }, goStop: goStop, openSheet: function (zid, i) { openSheet(D.Z(zid), i || 0); }, closeSheet: closeSheet, setPage: function (k) { setPage(k); }, tap: tap, walkTo: walkTo, plan: function () { return planOf(G.pos); }, cam: function () { return planOf(camera.position).concat([camera.position.y]); }, toCafe: toCafe, back: backTo1F, free: free, hw: function (x, z) { var c = gi(x, z); return c < 0 ? -1 : hw[c] * 0.05; }, move: moveStep, attrAt: attrAt, round: function () { return ROUND.slice(); }, tvs: function () { return TVS.map(function (v) { return { kind: v.kind, w: v.w, h: v.h, at: planOf(v.c).map(function (q) { return +q.toFixed(2); }), on: v.on, n: v.n }; }); } };

  /* ═══════════ 앱 안 열기 · 닫기 · 뒤로(v5.37 정식 앱 이식 · 사용자 261003 「이것들이 수정되면 정식 앱에 올리자」) ═══════════
   * window.AXTour = { open(o), close(), back(), isOpen() } · 옛 tour.js 와 같은 약속(앱 tourOpen · 뒤로 가기 popstate 가 그대로 부른다)
   * o.zone = 그 구역 앞에서 시작(입장 연출 뒤) · o.hint = 판 퀴즈 힌트 코드(tour-data HINT_PG) → 그 판이 있는 지점 앞 + 그 판 판 보기 · o.standalone = 시험판(닫기 없음)
   * 처음 열 때만 화면을 만들고 모형을 받는다 · 닫아도 WebGL 은 들고 있다(다시 열면 바로) · 닫으면 그리기를 멈춘다 */
  var ROOTEL = null, OPTS = {}, PEND = null;
  var TEMPLATE = '<div class="t3app">\n' +
    '  <header class="hd">\n' +
    '    <button type="button" class="hb back" id="t3-bClose" aria-label="둘러보기 닫기"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>\n' +
    '    <h1>1층 둘러보기 <span class="tag" id="t3-tag" hidden>시험판</span></h1>\n' +
    '    <button type="button" class="hb snd" id="t3-bSnd" aria-pressed="true" aria-label="음악 끄기" hidden><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path class="w" d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path class="w" d="M18.3 6.5a8 8 0 0 1 0 11"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg></button>\n' +
    '    <button type="button" class="hb" id="t3-bHelp">도움말</button>\n' +
    '  </header>\n' +
    '  <main class="stage" id="t3-stage">\n' +
    '    <canvas id="t3-cv" aria-label="1층 로비 3D 모형"></canvas>\n' +
    '    <div class="pins" id="t3-pins"></div>\n' +
    '    <div class="mags" id="t3-mags"></div>\n' +
    '    <button type="button" class="mini" id="t3-mini" aria-label="작은 지도 · 누르면 구역 목록과 큰 지도"></button>\n' +
    '    <div class="cap" id="t3-cap" hidden></div>\n' +
    '    <div class="load" id="t3-load">모형 불러오는 중</div>\n' +
    '    <div class="pad" id="t3-pad" role="application" aria-label="움직이기 패드 · 밀면 그쪽으로 걸어요"><span class="knob" id="t3-knob"></span></div>\n' +
    '    <div class="dest" id="t3-dest" hidden></div>\n' +
    '    <div class="ctl" id="t3-ctl" aria-label="시점 버튼">\n' +
    '      <button class="n" type="button" id="t3-zIn" aria-label="가까이 보기"><span class="c"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span><span class="l">확대</span></button>\n' +
    '      <button class="w" type="button" id="t3-rotL" aria-label="시점 왼쪽으로 90도 돌리기"><span class="c"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 3v4h4"/></svg></span><span class="l">좌로 돌기</span></button>\n' +
    '      <span class="dot" aria-hidden="true"></span>\n' +
    '      <button class="e" type="button" id="t3-rotR" aria-label="시점 오른쪽으로 90도 돌리기"><span class="c"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 3v4h-4"/></svg></span><span class="l">우로 돌기</span></button>\n' +
    '      <button class="s" type="button" id="t3-zOut" aria-label="멀리 보기"><span class="c"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span><span class="l">축소</span></button>\n' +
    '    </div>\n' +
    '    <button type="button" class="gbub" id="t3-gbub" hidden><span id="t3-gbubT"></span><span class="go">판 보기 ▶</span></button>\n' +
    '    <div class="bubble" id="t3-bubble" hidden>아이디어 한 줄을 내면 커피챗을 신청할 수 있어요</div>\n' +
    '    <div class="fps" id="t3-fps" hidden></div>\n' +
    '    <p class="nogl" id="t3-nogl" hidden></p>\n' +
    '  </main>\n' +
    '  <nav class="bar" id="t3-bar">\n' +
    '    <div class="slot"><button type="button" class="cta" id="t3-cta" hidden></button><p class="where" id="t3-where">&nbsp;</p></div>\n' +
    '    <div class="row" id="t3-navRow">\n' +
    '      <button type="button" class="nb" id="t3-bPrev">◀ 이전 구역</button>\n' +
    '      <button type="button" class="nb pri" id="t3-bNext">다음 구역 ▶</button>\n' +
    '    </div>\n' +
    '    <div class="row" id="t3-cafeRow" hidden>\n' +
    '      <button type="button" class="nb pri wide" id="t3-bBack1F">1층으로 돌아가기</button>\n' +
    '    </div>\n' +
    '  </nav>\n' +
    '</div>\n' +
    '<section class="sheet" id="t3-sheet" role="dialog" aria-modal="true" aria-label="구역 판 보기" hidden>\n' +
    '  <header class="sh">\n' +
    '    <span class="sg" id="t3-shSign"></span>\n' +
    '    <b id="t3-shTitle"></b>\n' +
    '    <span class="cnt" id="t3-shCount"></span>\n' +
    '    <button type="button" class="close" id="t3-shClose">닫기</button>\n' +
    '  </header>\n' +
    '  <div class="track-wrap" id="t3-trackWrap"><div class="track" id="t3-track"></div></div>\n' +
    '  <footer class="sf">\n' +
    '    <button type="button" class="nb" id="t3-pPrev">◀ 이전 판</button>\n' +
    '    <button type="button" class="nb" id="t3-pZoom">크게</button>\n' +
    '    <button type="button" class="nb" id="t3-pNext">다음 판 ▶</button>\n' +
    '  </footer>\n' +
    '</section>\n' +
    '<section class="help" id="t3-help" role="dialog" aria-modal="true" aria-label="처음 안내" hidden>\n' +
    '  <div class="hcard">\n' +
    '    <p class="h1t">왼쪽 동그라미로 걷고 오른쪽 버튼으로 돌리기 · 확대를 하며, 「다음 구역」을 누르면 알아서 걸어가요.</p>\n' +
    '    <div class="hdemo" aria-hidden="true"><span class="hbtn">다음 구역 ▶</span><span class="finger"></span></div>\n' +
    '    <label class="rmrow"><span class="t"><b>움직임 줄이기</b><span>어지러우면 켜세요</span></span><input type="checkbox" id="t3-rmChk" role="switch"><span class="sw" aria-hidden="true"></span></label>\n' +
    '    <label class="rmrow" id="t3-muRow"><span class="t"><b>음악 없이</b><span>조용히 보려면 켜세요</span></span><input type="checkbox" id="t3-muChk" role="switch"><span class="sw" aria-hidden="true"></span></label>\n' +
    '    <button type="button" class="nb pri wide" id="t3-hOk">시작하기</button>\n' +
    '  </div>\n' +
    '</section>\n' +
    '<section class="vid" id="t3-vid" role="dialog" aria-modal="true" aria-label="1F 타자왕 순위판" hidden>\n' +
    '  <header class="sh"><span class="sg">EVENT</span><b>1F 타자왕 순위판</b><button type="button" class="close" id="t3-vClose">닫기</button></header>\n' +
    '  <div class="vbody" id="t3-vbody"></div>\n' +
    '</section>\n' +
    '<div class="black" id="t3-black" aria-hidden="true"><p class="bt" id="t3-blackT">불러오는 중</p></div>\n' +
    '<div class="fade" id="t3-fade" aria-hidden="true"></div>\n' +
    '<div class="toast" id="t3-toast" role="status" aria-live="polite"></div>';
  function buildDom() {
    ROOTEL = document.createElement('div'); ROOTEL.id = 'axTour3'; ROOTEL.setAttribute('role', 'dialog'); ROOTEL.setAttribute('aria-modal', 'true'); ROOTEL.setAttribute('aria-label', '1층 둘러보기');
    ROOTEL.innerHTML = TEMPLATE; document.body.appendChild(ROOTEL);
    if (OPTS.standalone) { ROOTEL.classList.add('standalone'); $('tag').hidden = false; $('bClose').hidden = true; }
    $('bClose').onclick = function () { close(); };
  }
  function stopOf(zid, pg) {
    var best = -1, bd = 1e9, f = pg && S && S.faces[pg];
    STOPS.forEach(function (s, k) {
      if (s.zone !== zid) return;
      var d = 0; if (f) { var q = toThree(s.x, s.z); d = Math.hypot(q.x - f.userData.c.x, q.z - f.userData.c.z); }
      if (best < 0 || d < bd) { bd = d; best = k; }
    });
    return best;
  }
  function applyTarget() {
    PEND = null; var o = OPTS || {};
    var pg = o.hint && D.HINT_PG ? D.HINT_PG[o.hint] || 0 : (o.pg || 0), z = o.zone ? D.Z(o.zone) : (pg ? D.zoneOfPg(pg) : null);
    if (!z || z.id === 'cafe') return;
    var k = stopOf(z.id, pg); if (k < 0) return;
    placeAt(k, true); G.moved = true; updateUi(true);
    if (pg && z.id !== 'event') PEND = { z: z, pg: pg };   /* EVENT 는 판 보기가 없다 */
    if (PEND && MUS.deferred) { MUS.deferred = false; musStart(2); }   /* 판 보기로 바로 가면 처음 안내가 뜨지 않는다 · 음악은 지금(막히면 첫 누름에서) */
  }
  function afterIntro() { if (PEND) { var p = PEND; PEND = null; enterPanel(p.z, p.pg); return; } maybeHelp(); }
  function show() {
    ROOTEL.hidden = false; G.open = true; G.last = 0; G.need = true;
    if (!OPTS.standalone) { document.documentElement.classList.add('t3-lock'); var app = document.getElementById('app'); if (app) app.setAttribute('aria-hidden', 'true'); }
    if (renderer) resize();
  }
  function open(o) {
    OPTS = o || {};
    if (!ROOTEL) { buildDom(); show(); boot(); musOpen(); return; }
    if (G.open) { if (G.loaded) applyTarget(); return; }
    var bk = $('black'); bk.style.transition = 'none'; bk.style.opacity = 1; $('blackT').textContent = '';
    show(); musOpen();
    if (!G.loaded) return;   /* 아직 받는 중 · 받으면 load 가 자리를 잡는다 */
    G.moved = false; HOLD = null; G.stick = null; G.path = null; G.anim = null;
    placeAt(0, true); applyTarget(); updateUi(true);
    bk.getBoundingClientRect(); entrance();
  }
  function close() {
    if (!ROOTEL || !G.open) return;
    if (!$('vid').hidden) closePromo();
    if (SH) { $('sheet').hidden = true; G.sheetOpen = false; SH = null; G.lastFace = null; }
    $('help').hidden = true; G.anim = null; HOLD = null; G.stick = null; musStop(true, 0.6);   /* v5.38 음악 = 암전과 함께 줄고 닫힘 */
    var bk = $('black'); $('blackT').textContent = ''; $('blackT').classList.remove('on');
    bk.style.transition = RM ? 'none' : 'opacity .22s'; bk.style.opacity = 1;   /* 나갈 때 짧은 암전 */
    setTimeout(function () {
      ROOTEL.hidden = true; G.open = false;
      document.documentElement.classList.remove('t3-lock'); var app = document.getElementById('app'); if (app) app.removeAttribute('aria-hidden');
    }, RM ? 0 : 240);
  }
  function back() {
    if (!ROOTEL || !G.open) return;
    if (!$('vid').hidden) { closePromo(); return; }
    if (SH) { closeSheet(); return; }
    if (!$('help').hidden) { hideHelp(); return; }
    close();
  }
  window.AXTour = { open: open, close: close, back: back, isOpen: function () { return !!(ROOTEL && G.open); }, ver: 'v5.47', v3: true };
})();
