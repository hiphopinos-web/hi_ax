/* ═══════════════════════════════════════════════════════════════════════════
 * AX Festival 2026 럭키드로우 · 공 입체 렌더러 (v2 · WebGL2 · three.js r169 로컬 번들)
 *   통(점 고리) · 투입구 · 배출구 · 연출은 v1 그대로(draw.js 의 2D 캔버스). 이 파일은 공만 그린다.
 *   카메라 = 정면 직교(1920×1080 논리 좌표 그대로) · v1 의 평면 구도와 물리를 바꾸지 않는다.
 *   공: 인스턴싱 1회 드로우 · 구형 음영 + 부드러운 하이라이트 + 테두리 빛 · 가벼운 접지 그림자(공마다 뒤에 깔리는 흐린 원)
 *       번호는 숫자 글리프 10자 아틀라스를 셰이더에서 조합(공 수와 무관한 작은 텍스처) · 공이 구르면 번호가 공 표면을 따라 돈다
 *       ±Z 면 = 응모 번호(앞뒤 두 곳) · 다른 무늬 없음(보라 · 흰 점이 반사광처럼 보여 뺐다 261001)
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var TH = window.THREE;
  var G = window.AXB = { ok: false, err: "" };
  if (!TH) { G.err = "three 없음"; return; }

  function v3(a) { return new TH.Vector3(a[0], a[1], a[2]); }
  var COL = { o: [1.0, 0.494, 0.192], hi: [1.0, 0.588, 0.243], o10: [1.0, 0.922, 0.878], ink: [0.102, 0.043, 0.008] };
  var renderer = null, scene, camera, balls, hero, shadows, glyphTex = null;
  var MAXI = 8192, iPos, iRot, iNum, sPos, hPos, hRot, hNum;
  var view = { vw: 1, vh: 1, vs: 1, vox: 0, voy: 0 };
  var QUAL = { tier: -1, seg: [28, 20], pr: 1, glyph: 128, shadow: 1 };
  var U = {};

  var BALL_VS = [
    "attribute vec4 iPos; attribute vec4 iRot; attribute vec4 iNum;",
    "varying vec3 vL; varying vec3 vN; varying vec4 vI;",
    "vec3 qrot(vec4 q, vec3 v){ return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }",
    "void main(){",
    "  vL = position;",
    "  vec3 n = qrot(iRot, position);",
    "  vN = n; vI = iNum;",
    "  gl_Position = projectionMatrix * viewMatrix * vec4(iPos.xyz + n * iPos.w, 1.0);",
    "}"].join("\n");
  var BALL_FS = [
    "uniform sampler2D uGlyph; uniform vec3 uBase; uniform vec3 uHi; uniform vec3 uCore; uniform vec3 uInk; uniform float uDim; uniform float uAO; uniform float uTime; uniform float uHero; uniform float uInkA; uniform vec3 uRim;",
    "varying vec3 vL; varying vec3 vN; varying vec4 vI;",
    "void main(){",
    "  vec3 L = normalize(vL);",
    "  float face = L.z >= 0.0 ? 1.0 : -1.0;",
    "  vec2 uv = vec2(L.x * face, L.y);",
    "  vec2 guv = uv * vec2(1.0 / 3.9, 1.0 / 0.72);",
    "  float ink = 0.0;",
    "  if (abs(uv.x) < 0.78 && abs(uv.y) < 0.36 && (uInkA > 0.0 || uHero > 0.5)) {",
    "    float cell = min(3.0, floor((uv.x + 0.78) / 0.39));",
    "    float lx = (uv.x + 0.78 - cell * 0.39) / 0.39;",
    "    float ly = (uv.y + 0.36) / 0.72;",
    "    float p = cell < 0.5 ? 1000.0 : cell < 1.5 ? 100.0 : cell < 2.5 ? 10.0 : 1.0;",
    "    float d = mod(floor(vI.x / p + 0.001), 10.0);",
    "    ink = textureGrad(uGlyph, vec2((d + lx) / 10.0, ly), dFdx(guv), dFdy(guv)).r * (uHero > 0.5 ? 1.0 : uInkA);",
    "  }",
                "  vec3 N = normalize(vN); vec3 V = vec3(0.0, 0.0, 1.0);",
    "  vec3 K = normalize(vec3(-0.42, 0.62, 0.66));",
    "  float dif = max(dot(N, K), 0.0);",
    "  float lit = 0.58 + 0.52 * dif;",
    "  vec3 col = mix(uBase, uInk, ink);",
    "  float ao = mix(1.0, 0.55 + 0.45 * vI.z, uAO);",
    "  vec3 H = normalize(K + V);",
    "  float nh = max(dot(N, H), 0.0);",
    "  float spec = pow(nh, 70.0) * 0.5 + pow(nh, 10.0) * 0.07;",
    "  float fres = pow(1.0 - max(N.z, 0.0), 3.0);",
    "  vec3 c = col * lit * ao + vec3(1.0, 0.97, 0.93) * spec + uRim * fres * 0.38;",
    "  float fl = vI.y;",
    "  if (fl > 0.5 && fl < 1.5) { c = mix(c, vec3(1.0, 0.92, 0.85), 0.35) + uHi * 0.3; }",
    "  if (fl > 1.5) { float pu = 0.5 + 0.5 * sin(uTime * 18.0); c = c * (1.08 + 0.12 * pu) + uHi * (0.2 + 0.2 * pu) * fres * 2.0; }",
    "  gl_FragColor = vec4(c * (uHero > 0.5 ? 1.0 : uDim), 1.0);",
    "}"].join("\n");
  /* 접지 그림자 · 공 뒤(아래 오른쪽으로 조금 비껴) 흐린 원 · 공이 있는 자리는 공이 가린다 */
  var SH_VS = [
    "attribute vec4 sPos; varying vec2 vQ;",
    "void main(){ vQ = position.xy * 2.0; vec3 p = vec3(sPos.x + sPos.w * 0.16, sPos.y - sPos.w * 0.3, sPos.z - sPos.w * 1.3) + vec3(position.xy * sPos.w * 2.5, 0.0);",
    "  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }"].join("\n");
  var SH_FS = [
    "uniform float uA; varying vec2 vQ;",
    "void main(){ float d = length(vQ); float a = (1.0 - smoothstep(0.35, 1.0, d)) * uA; if (a < 0.004) discard; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }"].join("\n");

  function makeGlyphs(size) {
    var cw = Math.round(size * 0.54), ch = size, cv = document.createElement("canvas");
    cv.width = cw * 10; cv.height = ch;
    var c = cv.getContext("2d");
    c.fillStyle = "#000"; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "900 " + Math.round(ch * 0.9) + 'px "AXP", "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
    c.strokeStyle = "#fff"; c.lineWidth = ch * 0.025; c.lineJoin = "round";   /* 더 굵게 · 멀리서도 읽히게 */
    for (var d = 0; d < 10; d++) { c.save(); c.translate(cw * d + cw / 2, ch / 2 + ch * 0.04); c.scale(0.86, 1); c.fillText(String(d), 0, 0); c.strokeText(String(d), 0, 0); c.restore(); }
    var t = new TH.CanvasTexture(cv);
    t.flipY = true; t.generateMipmaps = true; t.minFilter = TH.LinearMipmapLinearFilter; t.magFilter = TH.LinearFilter;
    t.colorSpace = TH.NoColorSpace; t.anisotropy = 4;
    return t;
  }
  G.refreshGlyphs = function () { if (!renderer) return; var old = glyphTex; glyphTex = makeGlyphs(QUAL.glyph); U.uGlyph.value = glyphTex; if (old) old.dispose(); };

  function ballGeometry(ws, hs, attr) {
    var sg = new TH.SphereGeometry(1, ws, hs), g = new TH.InstancedBufferGeometry();
    g.index = sg.index; g.setAttribute("position", sg.getAttribute("position"));
    g.setAttribute("iPos", attr.p); g.setAttribute("iRot", attr.r); g.setAttribute("iNum", attr.m);
    g.instanceCount = 0;
    return g;
  }
  function dyn(n, k) { var a = new TH.InstancedBufferAttribute(new Float32Array(n * k), k); a.setUsage(TH.DynamicDrawUsage); return a; }

  G.init = function (canvas, opts) {
    opts = opts || {};
    try { renderer = new TH.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.rec, powerPreference: "high-performance" }); }
    catch (e) { G.err = String(e && e.message || e); renderer = null; return false; }
    renderer.setClearColor(0x000000, 0);
    scene = new TH.Scene();
    camera = new TH.OrthographicCamera(0, 1920, 0, -1080, 1, 6000);
    camera.position.set(0, 0, 3000);
    U = { uGlyph: { value: null }, uBase: { value: v3(COL.o) }, uHi: { value: v3(COL.hi) }, uCore: { value: v3(COL.o10) }, uInk: { value: v3(COL.ink) },
      uDim: { value: 1 }, uAO: { value: 1 }, uTime: { value: 0 }, uShA: { value: 0.42 }, uInkA: { value: 1 }, uRim: { value: v3(COL.hi) } };
    glyphTex = makeGlyphs(QUAL.glyph); U.uGlyph.value = glyphTex;
    iPos = dyn(MAXI, 4); iRot = dyn(MAXI, 4); iNum = dyn(MAXI, 4); sPos = dyn(MAXI, 4);
    var mat = new TH.ShaderMaterial({ vertexShader: BALL_VS, fragmentShader: BALL_FS,
      uniforms: { uGlyph: U.uGlyph, uBase: U.uBase, uHi: U.uHi, uCore: U.uCore, uInk: U.uInk, uDim: U.uDim, uAO: U.uAO, uTime: U.uTime, uHero: { value: 0 }, uInkA: U.uInkA, uRim: U.uRim } });
    balls = new TH.Mesh(ballGeometry(QUAL.seg[0], QUAL.seg[1], { p: iPos, r: iRot, m: iNum }), mat);
    balls.frustumCulled = false; balls.renderOrder = 2;
    hPos = dyn(1, 4); hRot = dyn(1, 4); hNum = dyn(1, 4);
    var hmat = mat.clone(); hmat.uniforms.uGlyph = U.uGlyph; hmat.uniforms.uTime = U.uTime; hmat.uniforms.uDim = U.uDim; hmat.uniforms.uHero = { value: 1 }; hmat.uniforms.uAO = { value: 0 }; hmat.uniforms.uBase = U.uBase; hmat.uniforms.uInk = U.uInk; hmat.uniforms.uRim = U.uRim; hmat.uniforms.uInkA = U.uInkA;
    hero = new TH.Mesh(ballGeometry(72, 54, { p: hPos, r: hRot, m: hNum }), hmat);
    hero.frustumCulled = false; hero.renderOrder = 3; hero.visible = false;
    var pg = new TH.PlaneGeometry(1, 1), sg = new TH.InstancedBufferGeometry();
    sg.index = pg.index; sg.setAttribute("position", pg.getAttribute("position")); sg.setAttribute("sPos", sPos); sg.instanceCount = 0;
    shadows = new TH.Mesh(sg, new TH.ShaderMaterial({ vertexShader: SH_VS, fragmentShader: SH_FS, transparent: true, depthWrite: false, blending: TH.NormalBlending, uniforms: { uA: U.uShA } }));
    shadows.frustumCulled = false; shadows.renderOrder = 1;
    scene.add(shadows); scene.add(balls); scene.add(hero);
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); G.lost = true; }, false);
    canvas.addEventListener("webglcontextrestored", function () { G.lost = false; G.refreshGlyphs(); }, false);
    G.ok = true;
    G.setQuality(0);
    return true;
  };

  /* 품질 단계 · 0 최고 → 3 최저 (draw.js 가 공 수와 실제 fps 로 고른다) · 구 분할 · 글리프 해상도 · 그림자 · 해상도 배율 */
  var TIERS = [
    { seg: [28, 20], pr: 1.0, glyph: 128, shadow: 1, ao: 1 },
    { seg: [20, 14], pr: 1.0, glyph: 128, shadow: 1, ao: 1 },
    { seg: [14, 10], pr: 0.85, glyph: 64, shadow: 0, ao: 1 },
    { seg: [10, 8], pr: 0.7, glyph: 64, shadow: 0, ao: 0 }
  ];
  G.setQuality = function (t) {
    t = Math.max(0, Math.min(TIERS.length - 1, t | 0));
    if (t === QUAL.tier) return;
    var q = TIERS[t], prevGlyph = QUAL.glyph;
    QUAL.tier = t; QUAL.seg = q.seg; QUAL.pr = q.pr; QUAL.glyph = q.glyph; QUAL.shadow = q.shadow;
    if (!renderer) return;
    var old = balls.geometry;
    balls.geometry = ballGeometry(q.seg[0], q.seg[1], { p: iPos, r: iRot, m: iNum });
    old.dispose();
    U.uAO.value = q.ao;
    if (prevGlyph !== q.glyph) G.refreshGlyphs();
    applyView();
  };

  G.resize = function (vw, vh, vs, vox, voy) { view.vw = vw; view.vh = vh; view.vs = vs; view.vox = vox; view.voy = voy; applyView(); };
  function applyView() {
    if (!renderer) return;
    var pr = QUAL.pr || 1;
    renderer.setPixelRatio(1); renderer.setSize(Math.max(1, Math.round(view.vw * pr)), Math.max(1, Math.round(view.vh * pr)), false);
    /* 논리 좌표(x 오른쪽 · y 아래) → 월드(x, -y) · 레터박스 바깥까지 같은 배율 */
    camera.left = -view.vox / view.vs; camera.right = (view.vw - view.vox) / view.vs;
    camera.top = view.voy / view.vs; camera.bottom = -(view.vh - view.voy) / view.vs;
    camera.updateProjectionMatrix();
  }

  /* S = { NB, x, y (논리 px), q(사원수 ×4), r(반지름 px), bs, num, flag, ao, scale?, heroI, hx, hy, hr, hq, dim, t } */
  G.frame = function (S) {
    if (!renderer || G.lost) return;
    var n = 0, p = iPos.array, q = iRot.array, m = iNum.array, sp = sPos.array, NB = S.NB, i, k, sc;
    for (i = 0; i < NB; i++) {
      var st = S.bs[i]; if (!st || st === 3 || i === S.heroI) continue;
      k = n * 4; sc = S.flag[i] ? 1.18 : 1;
      p[k] = S.x[i]; p[k + 1] = -S.y[i]; p[k + 2] = S.flag[i] ? 40 : st === 1 ? S.r * (2.2 + 2.2 * (i % 9)) : 0; p[k + 3] = S.r * sc;   /* 떨어지는 공은 서로 겹치지 않게 앞뒤로 비껴 둔다 */
      q[k] = S.q[i * 4]; q[k + 1] = S.q[i * 4 + 1]; q[k + 2] = S.q[i * 4 + 2]; q[k + 3] = S.q[i * 4 + 3];
      m[k] = S.num[i]; m[k + 1] = S.flag[i]; m[k + 2] = S.ao[i]; m[k + 3] = 0;
      sp[k] = p[k]; sp[k + 1] = p[k + 1]; sp[k + 2] = p[k + 2]; sp[k + 3] = p[k + 3];
      n++;
    }
    balls.geometry.instanceCount = n; shadows.geometry.instanceCount = QUAL.shadow ? n : 0;
    [iPos, iRot, iNum, sPos].forEach(function (a) { a.needsUpdate = true; if (a.clearUpdateRanges) { a.clearUpdateRanges(); a.addUpdateRange(0, n * 4); } });
    balls.visible = n > 0; shadows.visible = n > 0 && QUAL.shadow;
    if (S.hr > 0) {
      hPos.array[0] = S.hx; hPos.array[1] = -S.hy; hPos.array[2] = 900; hPos.array[3] = S.hr;
      hRot.array[0] = S.hq[0]; hRot.array[1] = S.hq[1]; hRot.array[2] = S.hq[2]; hRot.array[3] = S.hq[3];
      hNum.array[0] = S.hnum; hNum.array[1] = S.hflag || 0; hNum.array[2] = 1; hNum.array[3] = 0;
      hPos.needsUpdate = hRot.needsUpdate = hNum.needsUpdate = true;
      hero.geometry.instanceCount = 1; hero.visible = true;
    } else hero.visible = false;
    U.uTime.value = S.t; U.uDim.value = S.dim == null ? 1 : S.dim;
    /* 번호 단계 · 공 반지름 9px 이상 = 번호 · 6~9px = 옅어짐 · 6px 미만 = 번호 생략(공만) · 당첨 공은 늘 번호 */
    var rr = S.r; U.uInkA.value = rr >= 9 ? 1 : rr <= 6 ? 0 : (rr - 6) / 3;
    renderer.render(scene, camera);
  };
  /* 색 대비 · 1 = 오렌지 공 · 진한 갈색 번호(통은 무채색) · 2 = 크림 공 · 진한 오렌지 번호(#D64524 · design.md 가독 농도) */
  G.setPalette = function (pal) {
    if (!renderer) return;
    if (pal === 2) { U.uBase.value.set(1.0, 0.957, 0.925); U.uInk.value.set(0.839, 0.271, 0.141); U.uRim.value.set(1.0, 0.847, 0.757); }
    else { U.uBase.value.set(COL.o[0], COL.o[1], COL.o[2]); U.uInk.value.set(COL.ink[0], COL.ink[1], COL.ink[2]); U.uRim.value.set(COL.hi[0], COL.hi[1], COL.hi[2]); }
  };
  G.clear = function () { if (renderer && !G.lost) renderer.clear(); };
  G.quality = function () { return QUAL.tier; };
})();
