/* 1층 둘러보기 · 장면 v2 = 구운 빛 GLB 모형(v5.19 · 261003 · 시안 「디자인 시안/가상 1층/v2」를 앱 약속에 맞춰 옮김)
 * 모형: lobby.glb(Blender + Cycles 라이트맵 · meshopt · webp 텍스처 · 약 0.7MB) · 둘러보기를 열 때만 받는다(앱 첫 화면 0바이트).
 *   화면은 빛을 계산하지 않고 구운 빛을 그린다(MeshBasic + lightMap). 판 그림은 GLB 안 썸네일(panel_<쪽>).
 * 배치: 아래 LAY = 시안 v2 layout.js(build/layout.py 결과 · 10/02 부스 발주 설명 PDF 2쪽 + 「1층 구조 이해.md」) · GLB 와 같은 숫자. 직접 고치지 말 것.
 *   좌표는 tour-data 와 같다(도면 미터 x · z → three X = x - 16, Z = 6 - z).
 * tour.js(조작 · 시트 · 판 보기 · 지도 · 목록 · 뒤로 · 자동 둘러보기)는 아래 약속만 쓴다.
 *
 * 약속: window.TourScene.build(ctx) → S
 *   ctx = { T: THREE, D: TOUR_DATA, P(x, z, y) → Vector3, N3([nx, nz]) → Vector3, renderer, scene, labelFont }
 *   S.load(url, onProg(0~1), onDone, onFail)   GLB 받기 · 받기 전에도 구역 시점 · 핀 자리 · 18F 장면은 쓸 수 있다 · S.loaded
 *   S.lobby · S.cafe        THREE.Group 두 개(cafe 는 처음에 숨김 · 1층과 다른 x 자리)
 *   S.picks                 누를 수 있는 메시 · userData { zone?, pg?, face? } · 판 앞면 = face true + c(가운데) · n(앞 방향) · size([폭, 높이] m)
 *   S.faces[pg]             판 앞면 메시(구역 판 우선) · 판 보기 비행과 「판 자리에서 넓어지기」에 쓴다
 *   S.anchors[id]           구역 간판 칩 · 길잡이(lm_*) 이름표를 붙일 3D 점 · S.landmarks = [{ id, label }](누르지 않는 이름표)
 *   S.zoneView(zid, fitR)   구역 시점 { t, r, th, ph } · 기둥(높이 5m)에 가리지 않는 쪽을 고른다 · fitR(폭, 높이) = 화면에 들어오는 거리
 *   S.mark(zid | null)      고른 구역 바닥 강조
 *   S.setAtlas(i, tex)      쓰지 않는다(판 그림은 GLB 안) · 옛 약속 자리만
 *   S.DEF · S.CAFE_DEF      기본 시점 { t, r, th, ph } · S.cafeX · S.bubbleAt(말풍선 3D 점)
 *   S.limits(scn)           카메라 목표점 범위 { x: [a, b], z: [a, b] }
 *   S.frame(camera, scn)    그리기 바로 전 · 카메라 쪽 벽 · 천장 숨김(모형 단면) + 바닥 대리석 반사
 *   S.resize() · S.lowPower()(반사 끔) · S.dispose()
 *   S.refl(on) · S.reflOn() · S.cut()   v5.50 진단 모드(?t3diag=1) · 바닥 반사 켜고 끄기 · 지금 숨긴 벽 { side_s, side_e, side_w, side_n }
 *   S.TOUR                  자동 둘러보기 · establish = 첫 장면(남동쪽 높은 전경) · route = 동쪽 문(D)부터 반시계 동선 · pos · look = [x, z, 높이] · t = 도착 초 */
(function () {
  'use strict';
  var LAY = {"LOBBY": {"w": 32.57, "d": 11.46, "ceil": 5.0}, "WING": [[0.0, 11.46], [6.83, 11.46], [6.83, 27.0], [0.0, 23.8]], "PASSAGE": {"x0": 17.0, "x1": 19.8, "z0": 11.46, "z1": 19.7}, "CORE_Z1": 20.2, "PILLARS": [[1.0, 5.1], [7.45, 5.1], [13.9, 5.1], [20.4, 5.1], [26.9, 5.1]], "POSTER_PILLARS": [1, 2, 3, 4], "PILLAR_SIZE": 1.1, "EAST_COLS": [[32.6, 4.9]], "EXT_COLS": [1.3, 7.6, 14.0, 20.4, 26.9, 33.3], "DOORS": {"A": {"x": 17.3, "z": 1.5, "r": 1.85}, "B": [10.9, 12.8], "C": [22.3, 24.2], "D": {"x": 32.6, "z": 8.4, "r": 1.25}, "E": [9.7, 10.6]}, "BUST": [15.25, 9.9], "BUST_PED": {"plinth": [0.98, 0.7, 0.06], "col": [0.64, 0.48, 0.56], "cap": [0.94, 0.64, 0.46], "pot_dx": 0.86}, "ARTWORK": {"x": 24.85, "w": 5.5, "y0": 2.1, "y1": 4.3}, "RECEPTION": {"x0": 22.4, "x1": 26.7, "z0": 9.9, "z1": 10.75}, "ZONES": [{"id": "play", "part": "hidiq", "sign": 22, "rows": [{"a": [14.74, 0.55], "r": [-1, 0], "n": [0, 1], "pages": [23, 24, 25, 26, 27], "tv": [0], "desks": 4}]}, {"id": "play", "part": "hihelper", "sign": 0, "rows": [{"a": [7.51, 0.55], "r": [-1, 0], "n": [0, 1], "pages": [28, 29, 30, 31, 32], "tv": [0], "desks": 4}]}, {"id": "action", "part": "action", "sign": 0, "rows": [{"a": [24.77, 0.55], "r": [-1, 0], "n": [0, 1], "pages": [14, 15, 16, 17, 18], "tv": [1], "desks": 0}]}, {"id": "lab", "part": "lab", "sign": 8, "rows": [{"a": [30.4, 0.55], "r": [-1, 0], "n": [0, 1], "pages": [9, 10, 11, 12, 13], "tv": [], "desks": 0}]}, {"id": "vision", "part": "vision", "sign": 1, "rows": [{"a": [31.95, 6.6], "r": [0, -1], "n": [-1, 0], "pages": [2, 3, 4, 5, 6, 7], "tv": [0], "desks": 0}]}, {"id": "event", "part": "event", "sign": 33, "rows": [{"a": [0.55, 5.85], "r": [0, 1], "n": [1, 0], "pages": [34, 35, 36], "tv": [], "desks": 0, "kiosk": [2]}, {"a": [0.55, 9.15], "r": [0, 1], "n": [1, 0], "pages": [37, 38], "tv": [], "desks": 0, "wheel": [1]}]}, {"id": "event", "part": "typing", "sign": 0, "rows": [{"a": [0.55, 1.97], "r": [0, 1], "n": [1, 0], "pages": [39], "tv": [], "desks": 0}], "banners": [{"pg": 48, "at": [0.75, 3.55], "n": [1, 0]}]}, {"id": "lounge", "part": "lounge", "sign": 19, "rows": [{"a": [7.67, 10.95], "r": [1, 0], "n": [0, -1], "pages": [20, 21], "tv": [], "desks": 1}]}], "POSTER_PG": 46, "LOOSE": [{"pg": 41, "at": [40.4, 9.6], "n": [0, -1]}, {"pg": 42, "at": [16.4, 10.6], "n": [0, -1]}, {"pg": 43, "at": [21.0, 9.6], "n": [0, -1]}, {"pg": 44, "at": [21.8, 9.6], "n": [0, -1]}, {"pg": 45, "at": [20.4, 10.6], "n": [0, -1]}], "CHECKIN": {"tent": [42.6, 11.5], "size": 3.0, "front": [0, -1], "banner": 40, "xbanner": 47}};
  window.TourScene = {
    build: function (ctx) {
      var T = ctx.T, P = ctx.P, N3 = ctx.N3, renderer = ctx.renderer, scene = ctx.scene;
      var picks = [], faces = {}, anchors = {}, pads = {}, padLines = {}, zones = {}, matCache = {}, lightMaps = [];
      var CEIL = LAY.LOBBY.ceil, LW = LAY.LOBBY.w, LD = LAY.LOBBY.d;
      var lobby = new T.Group(); lobby.name = 'lobby';
      var sideGroups = {}, ceilingG = null, coreStub = null, floorMesh = null, hideInRefl = [], loaded = false;
      var REFL = { on: true, rt: null, cam: null, k: 0.5 };

      function lam(c) { return matCache[c] || (matCache[c] = new T.MeshLambertMaterial({ color: c })); }
      function box(g, w, h, d, c, x, y, z, ry) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), typeof c === 'string' || typeof c === 'number' ? lam(c) : c); m.position.set(x, y, z); if (ry) m.rotation.y = ry; g.add(m); return m; }
      function canvasTex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
      function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
      function textTex(text, opt) {
        opt = opt || {}; var fs = opt.fs || 64, font = (opt.w || 600) + ' ' + fs + 'px ' + (opt.font || ctx.labelFont);
        var m = document.createElement('canvas').getContext('2d'); m.font = font; var tw = Math.ceil(m.measureText(text).width) + fs * 0.6;
        var t = canvasTex(tw, Math.ceil(fs * 1.5), function (g, w, h) { if (opt.bg) { g.fillStyle = opt.bg; roundRect(g, 0, 0, w, h, opt.rad || 8); g.fill(); } g.font = font; g.fillStyle = opt.color || '#6B7684'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, w / 2, h / 2 + fs * 0.04); });
        t.userData = { aspect: tw / Math.ceil(fs * 1.5) }; return t;
      }
      /* 바닥 도트 격자 · 0.5m 간격 · 1.5%는 주황(design.md §2 「켜질 수 있는 자리」) · 18F 장면 */
      function dotFloorTex(wm, dm, ppm, seed) {
        return canvasTex(Math.round(wm * ppm), Math.round(dm * ppm), function (g, w, h) {
          g.fillStyle = '#EFEFEF'; g.fillRect(0, 0, w, h);
          var s = seed || 7; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
          var st = 0.5 * ppm, d = Math.max(2, Math.round(ppm * 0.06));
          for (var y = st / 2; y < h; y += st) for (var x = st / 2; x < w; x += st) { g.fillStyle = rnd() < 0.015 ? '#FF7F32' : '#D9D9D9'; g.fillRect(Math.round(x - d / 2), Math.round(y - d / 2), d, d); }
        });
      }

      /* ═══ 구역 · 판 줄 기하(GLB 없이도 쓴다) ═══ */
      function rowGeom(row) {
        var a = P(row.a[0], row.a[1]), rv = N3(row.r), nv = N3(row.n), n = row.pages.length;
        return { a: a, rv: rv, nv: nv, n: n, mid: a.clone().addScaledVector(rv, n / 2) };
      }
      function buildPad(zid, cx, cz, w, d, ry) {
        var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ color: 0xFF7E31, transparent: true, opacity: 0, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.rotation.z = ry; m.position.set(cx, 0.03, cz); m.renderOrder = 2; lobby.add(m);
        m.userData = { zone: zid, pad: true }; m.visible = false; (pads[zid] = pads[zid] || []).push(m);
        var hw = w / 2, hd = d / 2, pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(function (q) { return new T.Vector3(q[0], q[1], 0); });
        var ln = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xFF7E31, transparent: true, opacity: 0 }));
        ln.rotation.copy(m.rotation); ln.position.copy(m.position); ln.position.y = 0.035; ln.visible = false; lobby.add(ln); (padLines[zid] = padLines[zid] || []).push(ln);
        hideInRefl.push(m, ln);
      }
      LAY.ZONES.forEach(function (p) { zones[p.id] = (zones[p.id] || []).concat(p.rows.map(rowGeom)); });
      Object.keys(zones).forEach(function (id) {
        var rs = zones[id], bb = new T.Box3();
        rs.forEach(function (r) { bb.expandByPoint(r.a); bb.expandByPoint(r.a.clone().addScaledVector(r.rv, r.n)); bb.expandByPoint(r.mid.clone().addScaledVector(r.nv, 2.0)); });
        rs.bb = bb;
        var m = id === 'play' && rs[1] ? rs[0].mid.clone().lerp(rs[1].mid, 0.5) : rs[0].mid;
        anchors[id] = new T.Vector3(m.x, 3.45, m.z);
        rs.forEach(function (r) { var pc = r.mid.clone().addScaledVector(r.nv, 1.1); buildPad(id, pc.x, pc.z, r.n + 1.8, 2.0, Math.atan2(r.nv.x, r.nv.z)); });
      });
      /* 길잡이 이름표(누르지 않음 · 위치 표시는 둘러보기 안에서만 · design.md 5-21) */
      var LANDMARKS = [
        { id: 'lm_a', label: '정문', at: [LAY.DOORS.A.x, LAY.DOORS.A.z - 0.6, 2.9] },
        { id: 'lm_gate', label: '게이트 · 엘리베이터', at: [(LAY.PASSAGE.x0 + LAY.PASSAGE.x1) / 2, LAY.PASSAGE.z0 + 0.6, 2.2] },
        { id: 'lm_desk', label: '안내데스크', at: [(LAY.RECEPTION.x0 + LAY.RECEPTION.x1) / 2, LAY.RECEPTION.z0, 1.8] },
        { id: 'lm_check', label: '체크인(문 밖)', at: [LAY.CHECKIN.tent[0], LAY.CHECKIN.tent[1], 4.4] }
      ];
      LANDMARKS.forEach(function (l) { anchors[l.id] = P(l.at[0], l.at[1], l.at[2]); });

      /* ═══ GLB 재질 ═══
       * 약속(build/assemble.mjs): 굽기 재질 = map(UV0) × occlusionTexture(UV1, sRGB 라이트맵, 값 × extras.lmScale) → MeshBasic + lightMap
       * glass = 반투명 · led = 발광 · 그 밖 단색 */
      function convMat(m) {
        var u = m.userData || {}, nm = m.name || '';
        if (u.baked) {
          var lm = m.aoMap; if (lm) { lm.colorSpace = T.SRGBColorSpace; lm.minFilter = T.LinearFilter; lm.generateMipmaps = false; lm.needsUpdate = true; lightMaps.push(lm); }
          var b = new T.MeshBasicMaterial({ map: m.map || null, vertexColors: !!m.vertexColors, lightMap: lm || null, lightMapIntensity: (u.lmScale || 1) * Math.PI });
          b.name = nm; b.userData = u;
          if (m.map) m.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          if (m.map && /^(panel_\d+|artwork|plaque)$/.test(nm)) { m.map.wrapS = m.map.wrapT = T.ClampToEdgeWrapping; m.map.needsUpdate = true; }   /* v5.44 판 그림 = 가장자리 고정(되풀이면 판 아래 끝에 판 위쪽 줄이 섞여 번졌다) */
          return b;
        }
        if (u.glass) { var g = new T.MeshBasicMaterial({ color: 0xDCE6EA, transparent: true, opacity: 0.13, depthWrite: false, side: T.DoubleSide, forceSinglePass: true }); g.name = nm; return g; }
        if (u.led) { var c = m.emissive ? m.emissive.clone().multiplyScalar(nm === 'led_cool' ? 2.2 : 3.0) : new T.Color(3, 2.4, 1.6); var l = new T.MeshBasicMaterial({ color: c }); l.name = nm; return l; }
        var col = m.color ? m.color.clone() : new T.Color(0x888888);
        if (nm === 'mullion') col.setRGB(0.42, 0.44, 0.47);
        var f = new T.MeshBasicMaterial({ color: col, side: nm === 'base_side' ? T.DoubleSide : T.FrontSide }); f.name = nm; return f;
      }
      /* 바닥 = 구운 빛 + 평면 반사(물광 대리석) · 반사는 반 해상도 렌더 타깃 한 장 · 느린 기기는 끈다(lowPower) */
      function floorMaterial(base) {
        base.onBeforeCompile = function (sh) {
          sh.uniforms.tRefl = { value: REFL.rt ? REFL.rt.texture : null };
          sh.uniforms.reflMatrix = { value: new T.Matrix4() };
          sh.uniforms.reflOn = { value: 0 };
          base.userData.sh = sh;
          sh.vertexShader = 'uniform mat4 reflMatrix;\nvarying vec4 vReflUv;\nvarying vec3 vWp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vec4 wp_ = modelMatrix * vec4(transformed, 1.0);\n  vWp = wp_.xyz;\n  vReflUv = reflMatrix * wp_;');
          sh.fragmentShader = 'uniform sampler2D tRefl;\nuniform float reflOn;\nvarying vec4 vReflUv;\nvarying vec3 vWp;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\n  if (reflOn > 0.5) {\n    vec3 vd = normalize(cameraPosition - vWp);\n    float fr = 0.20 + 0.50 * pow(1.0 - clamp(vd.y, 0.0, 1.0), 3.0);\n    vec3 rc = texture2DProj(tRefl, vReflUv).rgb;\n    gl_FragColor.rgb = gl_FragColor.rgb * (1.0 - fr * 0.6) + rc * fr;\n  }');
        };
        base.customProgramCacheKey = function () { return 'floorRefl'; };
        return base;
      }
      var _sz = new T.Vector2();
      function setupRefl() {
        if (REFL.rt) REFL.rt.dispose();
        renderer.getDrawingBufferSize(_sz);
        REFL.rt = new T.WebGLRenderTarget(Math.max(2, Math.round(_sz.x * REFL.k)), Math.max(2, Math.round(_sz.y * REFL.k)), { colorSpace: T.SRGBColorSpace });
        REFL.cam = REFL.cam || new T.PerspectiveCamera();
        if (floorMesh && floorMesh.material.userData.sh) floorMesh.material.userData.sh.uniforms.tRefl.value = REFL.rt.texture;
      }
      var _rv = new T.Vector3(), _rt = new T.Vector3(), _rm = new T.Matrix4(), _ru = new T.Vector3(), RBIAS = new T.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      function renderRefl(camera, scn) {
        var sh = floorMesh && floorMesh.material.userData.sh; if (!sh) return;
        var on = REFL.on && scn === 'lobby' && camera.position.y > 0.05 && floorMesh.visible;
        sh.uniforms.reflOn.value = on ? 1 : 0; if (!on) return;
        if (!REFL.rt) setupRefl();
        /* 바닥(y = 0)에 대해 카메라를 뒤집는다(three.js Reflector 와 같은 계산) */
        var rc = REFL.cam; camera.updateMatrixWorld();
        _rv.copy(camera.position); _rv.y = -_rv.y;
        _rm.extractRotation(camera.matrixWorld); _rt.set(0, 0, -1).applyMatrix4(_rm).add(camera.position); _rt.y = -_rt.y;
        _ru.set(0, 1, 0).applyMatrix4(_rm); _ru.y = -_ru.y;
        rc.position.copy(_rv); rc.up.copy(_ru); rc.lookAt(_rt); rc.updateMatrixWorld();
        rc.projectionMatrix.copy(camera.projectionMatrix); rc.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
        sh.uniforms.reflMatrix.value.copy(RBIAS).multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);
        hideInRefl.forEach(function (o) { o.userData._v = o.visible; o.visible = false; });
        var cv = cafe.visible; cafe.visible = false;
        renderer.setRenderTarget(REFL.rt); renderer.clear(); renderer.render(scene, rc); renderer.setRenderTarget(null);
        hideInRefl.forEach(function (o) { o.visible = o.userData._v; });
        cafe.visible = cv;
      }
      /* 카메라 쪽 벽 · 천장을 숨겨 모형 안이 보이게(분양 모형의 단면) */
      var lastVis = null;
      function cutaway(camera) {
        var x = camera.position.x + 16, z = 6 - camera.position.z, y = camera.position.y;
        var vis = { side_s: z > -0.3, side_e: x < LW + 0.3, side_w: !(x < -0.3 && z < LD + 1), side_n: !(z > LD + 0.2) };
        for (var k in sideGroups) sideGroups[k].visible = vis[k] !== false;
        lastVis = vis;   /* v5.50 진단 표시(숨긴 벽) */
        if (coreStub) coreStub.visible = !vis.side_n;
        if (ceilingG) ceilingG.visible = y < CEIL - 0.05;
      }
      function nameUp(o, re) { while (o) { if (o.name && re.test(o.name)) return o.name; o = o.parent; } return null; }

      function load(url, onProg, onDone, onFail) {
        if (!T.GLTFLoader) { if (onFail) onFail(new Error('GLTFLoader 없음')); return; }
        var ld = new T.GLTFLoader(); if (window.MeshoptDecoder) ld.setMeshoptDecoder(window.MeshoptDecoder);
        ld.load(url, function (gl) {
          var root = gl.scene, colsNode = null; lobby.add(root); root.updateMatrixWorld(true);
          var cache = new Map();
          root.traverse(function (o) {
            if (/^(side_[nswe]|ceiling)$/.test(o.name)) { if (o.name === 'ceiling') ceilingG = o; else sideGroups[o.name] = o; }
            if (o.name === 'side_s_cols') colsNode = o;   /* 바깥 열주는 숨기지 않는다(바닥에 구운 발자국이 드러나므로) */
            if (!o.isMesh) return;
            var old = o.material, k = old.uuid + (old.vertexColors ? 'v' : '');
            if (!cache.has(k)) cache.set(k, old.name === 'floor' ? floorMaterial(convMat(old)) : convMat(old));
            o.material = cache.get(k); if (old.dispose) old.dispose();
            o.matrixAutoUpdate = false; o.updateMatrix();
            var pn = nameUp(o, /^panel_\d+$/), zn = nameUp(o, /^zone_[a-z]+$/);
            var pg = pn ? +pn.slice(6) : 0, zid = zn ? zn.slice(5) : (pg === 48 ? 'event' : null);
            if (o.material.name === 'floor') floorMesh = o;
            if (/^(floor|paving|base)$/.test(o.name)) hideInRefl.push(o);
            if (pg || zid) {
              o.userData = { pg: pg || 0, zone: zid };
              picks.push(o);
              if (pg && o.material.name === 'panel_' + pg) {
                /* 판 면의 가운데 · 앞 방향 · 크기(정점에서 · 양자화로 노드에 변환이 붙으므로 월드로 옮긴다) */
                var geo = o.geometry; geo.computeBoundingBox(); var c = new T.Vector3(); geo.boundingBox.getCenter(c);
                var nrm = geo.attributes.normal ? new T.Vector3().fromBufferAttribute(geo.attributes.normal, 0) : new T.Vector3(0, 0, 1);
                c.applyMatrix4(o.matrixWorld); nrm.transformDirection(o.matrixWorld);
                o.userData.c = c; o.userData.n = nrm; o.userData.size = ctx.D.pgSize(pg); o.userData.face = true;
                if (!faces[pg] || (zid && !faces[pg].userData.zone)) faces[pg] = o;
              }
            }
          });
          if (colsNode) root.attach(colsNode);
          /* 코어(엘리베이터 · 계단)를 숨겼을 때 남기는 낮은 단면 덩어리 · 모형 받침처럼 어둡게 */
          coreStub = new T.Group(); coreStub.name = 'coreStub'; var pa = LAY.PASSAGE, cz = LAY.CORE_Z1, cm = new T.MeshBasicMaterial({ color: 0x3A3E44 }), ct = new T.MeshBasicMaterial({ color: 0x2A2D31 });
          [[6.83, pa.x0], [pa.x1, LW]].forEach(function (xx) {
            var w = xx[1] - xx[0], d = cz - LD, c = P((xx[0] + xx[1]) / 2, (LD + cz) / 2, 0.45);
            var m = new T.Mesh(new T.BoxGeometry(w, 0.9, d), [cm, cm, ct, cm, cm, cm]); m.position.copy(c); coreStub.add(m);
          });
          coreStub.visible = false; lobby.add(coreStub); hideInRefl.push(coreStub);
          loaded = true; S.loaded = true;
          if (onDone) onDone();
        }, function (ev) { if (onProg && ev) onProg(ev.total && ev.lengthComputable !== false ? ev.loaded / ev.total : -1); }, function (e) { if (onFail) onFail(e); });   /* v5.51 전체 크기를 모르면 -1(숫자 없이) · 압축 전송이면 1 을 넘을 수 있어 받는 쪽(tour3 loadProg)이 0~1 · 줄지 않게 거른다 */
      }

      /* 18F 커피챗 장면 · 탁자 1컷 + 멘토 캐릭터(챗봇 원본 path 합성 · design.md A-4 「합성만」) */
      var BOT_PATHS = [
        ['M104.68 56.4898V43.0698C103.23 43.6498 101.66 43.9698 100 43.9698C98.3401 43.9698 96.7601 43.6398 95.3101 43.0598V56.4798C64.7401 58.8698 40.6701 84.4198 40.6701 115.6H40.6201V128.09H159.32V115.6C159.32 84.4098 135.25 58.8698 104.68 56.4798V56.4898Z', '#FFC56E'],
        ['M149.96 156.2H50.0399C44.8699 156.2 40.6699 152 40.6699 146.83V131.22H159.32V146.83C159.32 152 155.12 156.2 149.95 156.2', '#FF7F32'],
        ['M112.67 31.3099C112.67 38.2999 107 43.9699 100.01 43.9699C93.0203 43.9699 87.3403 38.2999 87.3403 31.3099C87.3403 24.3199 93.0103 18.6499 100.01 18.6499C107.01 18.6499 112.67 24.3199 112.67 31.3099Z', '#FF7F32'],
        ['M86.5902 99.9999C86.5902 102.94 84.2002 105.33 81.2602 105.33C78.3202 105.33 75.9302 102.94 75.9302 99.9999C75.9302 97.0599 78.3202 94.6699 81.2602 94.6699C84.2002 94.6699 86.5902 97.0599 86.5902 99.9999Z', '#282320'],
        ['M124.06 99.9999C124.06 102.94 121.67 105.33 118.73 105.33C115.79 105.33 113.4 102.94 113.4 99.9999C113.4 97.0599 115.79 94.6699 118.73 94.6699C121.67 94.6699 124.06 97.0599 124.06 99.9999Z', '#282320']
      ];
      var CAFE_X = 70;
      function buildCafe() {
        var g = new T.Group(); g.position.x = CAFE_X;
        var ft = dotFloorTex(10, 7, 64, 5);
        var base = new T.Mesh(new T.BoxGeometry(10, 0.45, 7), [lam('#D3D7DC'), lam('#D3D7DC'), new T.MeshBasicMaterial({ map: ft }), lam('#D3D7DC'), lam('#D3D7DC'), lam('#D3D7DC')]);
        base.position.y = -0.225; g.add(base);
        var gl = new T.MeshLambertMaterial({ color: 0xF4F6F8, transparent: true, opacity: 0.3, depthWrite: false });
        var w1 = new T.Mesh(new T.PlaneGeometry(10, 3.0), gl); w1.position.set(0, 1.5, -3.5); g.add(w1);
        for (var x = -5; x <= 5; x += 1.25) box(g, 0.05, 3.0, 0.08, '#C3C9D0', x, 1.5, -3.5);
        box(g, 0.2, 0.9, 7, '#D9DDE2', -5, 0.45, 0);
        function table(x, z, r) {
          var t = new T.Mesh(new T.CylinderGeometry(r, r, 0.05, 40), lam('#E9DCC8')); t.position.set(x, 0.74, z); g.add(t);
          var l = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.72, 12), lam('#C3C9D0')); l.position.set(x, 0.36, z); g.add(l);
          for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2 + Math.PI / 4, cx = x + Math.sin(a) * (r + 0.42), cz = z + Math.cos(a) * (r + 0.42); box(g, 0.46, 0.46, 0.46, '#FFFFFF', cx, 0.23, cz, a); box(g, 0.46, 0.5, 0.06, '#FFFFFF', cx + Math.sin(a) * 0.2, 0.7, cz + Math.cos(a) * 0.2, a); }
        }
        table(0, 0.3, 0.62); table(-3.2, -1.6, 0.45); table(3.2, -1.6, 0.45);
        [[-0.18, 0.15], [0.2, 0.42]].forEach(function (q) { var b = new T.Mesh(new T.CylinderGeometry(0.04, 0.045, 0.22, 16), lam('#8A5A3C')); b.position.set(q[0], 0.88, q[1]); g.add(b); var c = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.04, 12), lam('#FF7F32')); c.position.set(q[0], 1.01, q[1]); g.add(c); });
        var tt = textTex('AX 커피챗', { fs: 64, w: 700, color: '#FFFFFF', bg: '#FF7F32' });
        var tent = new T.Mesh(new T.PlaneGeometry(0.42, 0.42 / tt.userData.aspect), new T.MeshBasicMaterial({ map: tt })); tent.position.set(0.25, 0.83, -0.05); tent.rotation.y = 0.5; g.add(tent);
        var bt = canvasTex(512, 512, function (c) { c.scale(512 / 200, 512 / 200); BOT_PATHS.forEach(function (p) { c.fillStyle = p[1]; c.fill(new Path2D(p[0])); }); });
        var sp = new T.Sprite(new T.SpriteMaterial({ map: bt })); sp.scale.set(1.15, 1.15, 1); sp.position.set(-0.55, 1.15, -0.5); g.add(sp);
        var fl = textTex('18F', { fs: 120, w: 800, color: '#C9CED4' }); var fm = new T.Mesh(new T.PlaneGeometry(1.6, 1.6 / fl.userData.aspect), new T.MeshBasicMaterial({ map: fl, transparent: true, depthWrite: false })); fm.rotation.x = -Math.PI / 2; fm.position.set(3.4, 0.012, 2.4); g.add(fm);
        g.traverse(function (o) { if (o.isMesh || o.isSprite) { o.userData = o.userData || {}; o.userData.zone = 'cafe'; picks.push(o); } });
        g.visible = false; return g;
      }
      var cafe = buildCafe();
      anchors.cafe = new T.Vector3(CAFE_X - 0.55, 1.9, -0.5);

      /* 기본 시점 = 북서쪽 위에서 로비를 대각선으로 · 유리벽 판(PLAY · LAB · in Action) 앞면이 보인다 */
      var DEF = { t: P(16.3, 4.6, 1.4), r: 60, th: -2.2, ph: 0.7 };
      var S = {
        lobby: lobby, cafe: cafe, picks: picks, faces: faces, anchors: anchors, loaded: false,
        landmarks: LANDMARKS.map(function (l) { return { id: l.id, label: l.label }; }),
        DEF: DEF, CAFE_DEF: { t: new T.Vector3(CAFE_X - 0.3, 1.0, -0.2), r: 11.5, th: 0.55, ph: 1.12 }, cafeX: CAFE_X,
        bubbleAt: new T.Vector3(CAFE_X - 0.55, 1.85, -0.5),
        load: load,
        limits: function (scn) { return scn === 'cafe' ? { x: [CAFE_X - 5, CAFE_X + 5], z: [-3.5, 3.5] } : { x: [-17, 21], z: [-17, 9] }; },
        zoneView: function (zid, fitR) {
          var rs = zones[zid]; if (!rs) return null;
          var c = new T.Vector3(); rs.bb.getCenter(c); c.y = 1.3;
          var nv = new T.Vector3(); rs.forEach(function (r) { nv.addScaledVector(r.nv, r.n); }); nv.normalize();
          var sz = new T.Vector3(); rs.bb.getSize(sz); var w = Math.max(sz.x, sz.z);
          /* 기둥(높이 5m)이 판 줄 앞을 가리지 않게 위에서 비스듬히(ph 0.8) 보고, 좌우 치우침은 기둥에서 먼 쪽을 고른다 */
          var r = fitR(w + 1.4, 4.8), ph = 0.8, base = Math.atan2(nv.x, nv.z), best = null;
          [0.35, -0.35, 0.18, -0.18, 0].forEach(function (off) {
            var th = base + off, cx = c.x + r * Math.sin(ph) * Math.sin(th), cz = c.z + r * Math.sin(ph) * Math.cos(th), md = 1e9;
            LAY.PILLARS.forEach(function (q) {
              var px = q[0] - 16, pz = 6 - q[1], dx = c.x - cx, dz = c.z - cz, L2 = dx * dx + dz * dz, k = Math.max(0, Math.min(1, ((px - cx) * dx + (pz - cz) * dz) / L2));
              md = Math.min(md, Math.hypot(cx + dx * k - px, cz + dz * k - pz));
            });
            if (!best || md > best.md + 0.05) best = { md: md, th: th };
          });
          return { t: c, r: r, th: best.th, ph: ph };
        },
        mark: function (zid) {
          for (var id in pads) {
            var on = id === zid;
            pads[id].forEach(function (m) { m.material.opacity = on ? 0.16 : 0; m.visible = on; });   /* 안 보일 때는 그리지 않는다(그리기 호출 절약) */
            (padLines[id] || []).forEach(function (l) { l.material.opacity = on ? 1 : 0; l.visible = on; });
          }
        },
        setAtlas: function () {},
        frame: function (camera, scn) { if (!loaded) return; cutaway(camera); renderRefl(camera, scn); },
        resize: function () { if (REFL.rt) setupRefl(); },
        lowPower: function () { REFL.on = false; if (REFL.rt) { REFL.rt.dispose(); REFL.rt = null; } },
        /* v5.50 진단 모드 A/B · 바닥 반사 켜고 끄기(실기기에서 깜빡임 원인 가르기) */
        refl: function (on) { if (on) REFL.on = true; else { REFL.on = false; if (REFL.rt) { REFL.rt.dispose(); REFL.rt = null; } } },
        reflOn: function () { return REFL.on; },
        cut: function () { return lastVis; },
        dispose: function () { if (REFL.rt) REFL.rt.dispose(); lightMaps.forEach(function (t) { t.dispose(); }); },
        /* 자동 둘러보기 · 남동쪽 위에서 시작해(정문 · 동쪽 문이 함께 보임) 동쪽 문 밖 체크인 → 동쪽 문 → 행사 동선(반시계)대로 돈 뒤 기본 시점으로 올라가 자유 조작으로 넘긴다
         * 기둥 줄(z 5.1)과 유리벽 판 사이(z 3.6)를 따라 동쪽에서 서쪽으로 미끄러지며 판 줄을 비스듬히 본다(세로 화면에서 줄 전체가 보이게) */
        TOUR: {
          fov: 50,
          establish: { pos: [44, -14, 24], look: [17, 5.5, 0] },
          route: [
            { t: 0, pos: [44, -14, 24], look: [17, 5.5, 0], cap: '1층 로비 · 정문과 옆 출입문' },
            { t: 3.6, pos: [45.0, 4.8, 4.3], look: [42.6, 10.8, 1.4], cap: '출입문 밖 · 사전등록 체크인' },   /* v5.32: 천막이 문에서 약 10m 앞 오른쪽(북쪽)으로 옮김 · 남쪽 통로에서 천막 앞면을 7m 떨어져 비스듬히 위에서(천막 · 현수막 · 엑스배너 47 · 41 이 한 화면) */
            { t: 6.4, pos: [34.4, 8.4, 2.0], look: [28.0, 8.0, 1.5], cap: '옆 출입문' }   /* v5.35 화면에 방위(동 · 서 · 남 · 북) 말 없음(사용자 261003 · 모형 방위는 실제와 다름) */,
            { t: 9.0, pos: [28.8, 7.4, 2.0], look: [31.9, 2.6, 1.4], zone: 'vision' },
            { t: 11.6, pos: [31.2, 3.7, 2.0], look: [26.4, 0.9, 1.3], zone: 'lab' },
            { t: 13.8, pos: [25.4, 3.7, 2.0], look: [20.8, 0.9, 1.3], zone: 'action' },
            { t: 15.8, pos: [20.4, 3.75, 2.0], look: [17.3, 1.6, 1.5], cap: '정문 · 회전문' },
            { t: 17.8, pos: [15.0, 3.7, 2.0], look: [10.6, 0.9, 1.3], zone: 'play' },
            { t: 19.8, pos: [8.6, 3.7, 2.0], look: [3.8, 0.9, 1.3], zone: 'play' },
            { t: 22.0, pos: [3.4, 3.9, 2.0], look: [0.7, 8.4, 1.4], zone: 'event' },
            { t: 24.2, pos: [4.2, 7.6, 2.0], look: [8.6, 10.9, 1.4], zone: 'lounge' },
            { t: 26.4, pos: [11.6, 7.0, 2.3], look: [17.6, 11.2, 1.5], cap: '게이트 · 엘리베이터' },   /* v5.34 「흉상」 표시 없앰(사용자 261003) */
            { t: 29.0, def: true }
          ]
        }
      };
      return S;
    }
  };
})();
