/* 1층 둘러보기 · 화면 한 벌(v5.11 · 261003 · 계획 = 「디자인 시안/가상 1층/계획.md」 · 배치 = tour-data.js)
 * 앱(index.html)은 입구 3곳 + 불러오기(tourOpen) + 뒤로 가기 한 줄 + 연결(TOUR_HOST)만 가진다. 이 파일 · 장면 · three.js · 그림은 처음 열 때만 받는다.
 * 쓰는 법: AXTour.open({ zone: 'play' } | { pg: 24 } | { hint: 'play.hq.intro' } | {}) · AXTour.back() → 맨 위 한 층 닫기(판 보기 → 시트 → 둘러보기) · AXTour.isOpen()
 * 뒤로 가기: 이 화면은 history 를 쌓지 않는다. 앱의 popstate(뒤로 트랩)가 열려 있으면 AXTour.back() 을 부른다(안드로이드 뒤로 = 한 층씩).
 * 보기: 3D 모형 / 평면 지도 / 목록. 저사양(WebGL 없음 · 동작 줄이기 · 메모리 2GB 이하 · 입장 비행 느림 · 컨텍스트 끊김)은 평면 지도로.
 * 렌더러 교체 지점 = tour-scene.js(TourScene.build 약속). 여기는 카메라 · 조작 · 핀 · 시트 · 판 보기 · 지도 · 목록 · 뒤로만.
 * v5.19(261003): 장면 = 구운 빛 GLB 모형(lobby.glb · 열 때만 받음 · 받는 동안 「모형 불러오는 중 n%」) · 첫 장면 = 남동쪽 높은 전경 → 기본 시점 · 「둘러보기 시작」 = 동쪽 문(D)부터 반시계 동선(시안 v2 와 같음 · 화면을 누르면 멈춤) · 길잡이 이름표(정문 · 동쪽 문 · 흉상 · 게이트 · 안내데스크 · 체크인).
 * 위치 예외: 앱은 동선 · 위치를 다루지 않는다(261001)의 예외는 이 화면 안에서만(사용자 261003 · design.md 5-21). */
(function () {
  'use strict';
  var D = window.TOUR_DATA, BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^\/]*$/, '') : 'assets/tour/'; })();
  var HOST = function () { return window.TOUR_HOST || null; };
  var RM = function () { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var CHEV = '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  var XSVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var BACKSVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var PLAYSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var NEXTSVG ='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  var BOTSVG = '<svg class="bot" viewBox="0 0 200 200" aria-hidden="true"><path d="M104.68 56.49V43.07C103.23 43.65 101.66 43.97 100 43.97C98.34 43.97 96.76 43.64 95.31 43.06V56.48C64.74 58.87 40.67 84.42 40.67 115.6H40.62V128.09H159.32V115.6C159.32 84.41 135.25 58.87 104.68 56.48Z" fill="#FFC56E"/><path d="M149.96 156.2H50.04C44.87 156.2 40.67 152 40.67 146.83V131.22H159.32V146.83C159.32 152 155.12 156.2 149.95 156.2" fill="#FF7F32"/><circle cx="100" cy="31.31" r="12.66" fill="#FF7F32"/><circle cx="81.26" cy="100" r="5.33" fill="#282320"/><circle cx="118.73" cy="100" r="5.33" fill="#282320"/></svg>';
  /* 구역 글 · 앱 FLOOR1 이 원천(TOUR_HOST.zone) · 앱 밖(시험)에서만 이 짧은 글 */
  var ZTXT = { vision: '회사가 가는 방향을 보는 곳', lab: 'DAP 과제를 보는 곳', action: 'AI 업무 사례를 보는 곳', play: 'AI를 직접 써 보는 곳', event: '사진 · 룰렛 · 타자왕이 있는 곳', lounge: '업무 고민을 상담하는 곳', cafe: '아이디어를 놓고 이야기하는 곳' };

  var R = null;   /* 열려 있는 동안의 상태 한 묶음 · 닫으면 버린다 */
  var VER = 'v519b';   /* 모형 파일 캐시 깨기 · 모형을 바꾸면 올린다 */
  var ATLAS_IMG = {};   /* 아틀라스 그림은 닫아도 들고 있다(작다 · 약 180KB) */
  function $(k) { return R && R.el[k]; }

  /* ─────────── 썸네일 = 아틀라스 칸(CSS 배경) ─────────── */
  function thumbHtml(p, w, extraStyle) {
    var a = D.ATLAS.at[p]; if (!a) return '<span class="th" style="width:' + w + 'px;height:' + w + 'px"></span>';
    var S = D.ATLAS.size[a[0]], cw = a[3] - 4, ch = a[4] - 4, k = w / cw, h = Math.round(ch * k);
    return '<span class="th" aria-hidden="true" style="width:' + w + 'px;height:' + h + 'px;background-image:url(' + BASE + D.ATLAS.files[a[0]] + ');background-size:' + (S * k).toFixed(1) + 'px ' + (S * k).toFixed(1) + 'px;background-position:' + (-(a[1] + 2) * k).toFixed(1) + 'px ' + (-(a[2] + 2) * k).toFixed(1) + 'px' + (extraStyle || '') + '"></span>';
  }
  function thumbBg(p, w, h) {
    var a = D.ATLAS.at[p]; if (!a) return '';
    var S = D.ATLAS.size[a[0]], k = w / (a[3] - 4);
    return 'background-image:url(' + BASE + D.ATLAS.files[a[0]] + ');background-size:' + (S * k).toFixed(1) + 'px ' + (S * k).toFixed(1) + 'px;background-position:' + (-(a[1] + 2) * k).toFixed(1) + 'px ' + (-(a[2] + 2) * k).toFixed(1) + 'px;background-repeat:no-repeat';
  }
  function detailSrc(p) { return BASE + 'd/p' + (p < 10 ? '0' : '') + p + '.webp'; }
  function signHtml(z, lg) {
    var h = HOST();
    if (z.id !== 'cafe' && h && h.sign) return '<span class="axs-pan tr-sgw">' + h.sign(z.name, !!lg) + '</span>';   /* 앱 간판 칩(점 글자) · 칩 모양은 앱 판 문법 절(.axs-pan .axs-sign) */
    return '<span class="sg' + (z.ghost ? ' ghost' : '') + (lg ? ' lg' : '') + '">' + esc(z.id === 'cafe' ? '18F AX 커피챗' : z.name) + '</span>';
  }
  function ztext(z) {
    var h = HOST(), t = h && h.zone ? h.zone(z.id) : null;
    return t || { kor: ZTXT[z.id] || '', fact: '', todo: [] };
  }
  function acts(z) {
    var h = HOST(), a = h && h.acts ? h.acts(z.id) : null;
    return a && a.length ? a : [{ lbl: z.id === 'cafe' ? '커피챗 신청' : '1층에서 해 보기', run: function () { toast('앱에서 열어 주세요'); } }];
  }
  function toast(msg) { var t = $('toast'); if (!t) return; t.textContent = msg; t.classList.add('on'); clearTimeout(R.toastT); R.toastT = setTimeout(function () { if (R) t.classList.remove('on'); }, 2200); }
  function runAct(a) { var fn = a.run; close(); if (typeof fn === 'function') setTimeout(fn, 0); }

  /* ─────────── DOM ─────────── */
  function buildDom() {
    var root = document.createElement('div'); root.id = 'axTour'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', '1층 둘러보기');
    root.innerHTML =
      '<div class="tr-app">' +
      '<header class="tr-hd"><button class="back" type="button" aria-label="둘러보기 닫기" data-k="back">' + BACKSVG + '</button><h1>1층 둘러보기</h1></header>' +
      '<div class="tr-seg"><div class="in" role="tablist" aria-label="보기 방식">' +
      '<button type="button" role="tab" data-mode="3d" aria-selected="true">3D 모형</button><button type="button" role="tab" data-mode="map" aria-selected="false">평면 지도</button><button type="button" role="tab" data-mode="list" aria-selected="false">목록</button></div></div>' +
      '<main class="tr-stage" data-k="stage">' +
      '<canvas class="tr-cv" data-k="cv" role="img" aria-label="1층 로비 3D 모형. 구역은 아래 간판 버튼이나 목록 보기로도 고를 수 있어요."></canvas>' +
      '<div class="tr-pins" data-k="pins"></div><div class="tr-bubble" data-k="bubble"></div>' +
      '<div class="tr-hint" data-k="hint">한 손가락 돌리기 · 두 손가락 확대·이동 · 눌러서 보기</div><div class="tr-fps" data-k="fps"></div><div class="tr-fade" data-k="fade"></div><div class="tr-load" data-k="load"></div>' +
      '<div class="tr-cap" data-k="tcap" hidden></div><button type="button" class="tr-go" data-k="tgo" hidden>' + PLAYSVG + '둘러보기 시작</button>' +
      '<section class="tr-pane tr-map" data-k="map" hidden aria-label="1층 평면 지도"></section><section class="tr-pane tr-list" data-k="list" hidden aria-label="1층 구역과 판 목록"></section></main>' +
      '<nav class="tr-rail" data-k="rail" aria-label="구역 바로 가기"></nav>' +
      '<section class="tr-sheet" data-k="sheet" aria-hidden="true"><div class="grab"><i></i></div><div class="sc" data-k="sheetBody"></div></section>' +
      '<div class="tr-viewer" data-k="viewer" role="dialog" aria-modal="true" aria-label="판 보기" aria-hidden="true"><div class="bg"></div>' +
      '<div class="vh"><button class="x" type="button" data-k="vClose" aria-label="판 보기 닫기">' + XSVG + '</button><div class="t" data-k="vTitle"></div><span class="c" data-k="vCount"></span></div>' +
      '<div class="tr-vs" data-k="vs"><div class="tr-vimg" data-k="vimg" style="opacity:0"><img alt="" data-k="vpic" style="display:block;width:100%;height:100%;opacity:0;transition:opacity .2s"></div><span class="tr-vzoom" data-k="vzoom">두 손가락으로 확대</span></div>' +
      '<div class="vf"><button class="nav" type="button" data-k="vPrev" aria-label="이전 판">' + BACKSVG + '</button><button class="btn pri" type="button" data-k="vAct">1층에서 해 보기</button><button class="nav" type="button" data-k="vNext" aria-label="다음 판">' + NEXTSVG + '</button></div></div>' +
      '<div class="tr-toast" data-k="toast" role="status"></div></div>';
    var el = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-k]'), function (n) { el[n.getAttribute('data-k')] = n; });
    el.root = root; return el;
  }

  /* ─────────── 열기 · 닫기 · 뒤로 ─────────── */
  function isOpen() { return !!R; }
  function open(o) {
    o = o || {};
    if (R) { goTo(o); return; }
    R = { el: buildDom(), mode: '3d', glOK: false, why: '', sel: null, scn: 'lobby', layers: [], toastT: 0, opts: o, alive: true };
    document.body.appendChild(R.el.root);
    document.documentElement.classList.add('tour-lock');
    var app = document.getElementById('app'); if (app) app.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(function () { if (R) R.el.root.classList.add('on'); });
    wire();
    try { var c = document.createElement('canvas'); R.glOK = !!(window.THREE && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { R.glOK = false; }
    if (!R.glOK) { R.mode = 'map'; R.why = 'WebGL 없음'; }
    else if (RM()) { R.mode = 'map'; R.why = '동작 줄이기 설정'; }
    else if (navigator.deviceMemory && navigator.deviceMemory <= 2) { R.mode = 'map'; R.why = '메모리 2GB 이하'; }
    if (o.mode) R.mode = o.mode;
    renderRail();
    setMode(R.mode, true);
    R.hintT = setTimeout(hideHint, 6000);
    goTo(o);
    R.el.root.tabIndex = -1; R.el.root.style.outline = 'none';
    setTimeout(function () { if (R) try { R.el.root.focus({ preventScroll: true }); } catch (e) {} }, 60);   /* 대화 상자에 초점(버튼에 두면 링이 보인다) */
  }
  function goTo(o) {
    var pg = o.pg || (o.hint && D.HINT_PG[o.hint]) || 0, z = o.zone ? D.Z(o.zone) : pg ? D.zoneOfPg(pg) : null;
    if (!z && !pg) return;
    R.deep = { pg: pg };
    if (z) selectZone(z.id, true); else if (pg) openViewer([pg], 0, null, null);
  }
  function close() {
    if (!R) return;
    var r = R; R = null;
    r.alive = false;
    clearTimeout(r.hintT); clearTimeout(r.toastT);
    window.removeEventListener('resize', r.onResize); document.removeEventListener('keydown', r.onKey);
    if (r.g) disposeGL(r.g);
    document.documentElement.classList.remove('tour-lock');
    var app = document.getElementById('app'); if (app) app.removeAttribute('aria-hidden');
    r.el.root.classList.remove('on');
    setTimeout(function () { if (r.el.root.parentNode) r.el.root.parentNode.removeChild(r.el.root); }, RM() ? 0 : 200);
    var h = HOST(); if (h && h.onClose) h.onClose();
  }
  /* 맨 위 한 층 닫기 · 판 보기 → 시트 → 둘러보기 · true = 무엇이든 닫았다 */
  function back() {
    if (!R) return false;
    if ($('viewer').classList.contains('open')) { closeViewer(); return true; }
    if ($('sheet').classList.contains('open')) { closeSheet(); return true; }
    close(); return true;
  }

  function wire() {
    $('back').onclick = function () { close(); };
    Array.prototype.forEach.call(R.el.root.querySelectorAll('.tr-seg button'), function (b) { b.onclick = function () { setMode(b.getAttribute('data-mode')); }; });
    $('vPrev').onclick = function () { stepPanel(-1); }; $('vNext').onclick = function () { stepPanel(1); };
    $('vClose').onclick = function () { closeViewer(); };
    $('tgo').onclick = function () { startTour(); };
    /* 자동 둘러보기 중 화면을 누르면 그 자리에서 멈추고 손으로 넘긴다(그 누름은 고르기로 쓰지 않는다) */
    $('stage').addEventListener('pointerdown', function () { if (R && R.g && R.g.TR) { stopTour(false); R.g.tourStopAt = performance.now(); } }, true);
    $('vAct').onclick = function () { if (R.V && R.V.z) runAct(acts(R.V.z)[0]); };
    R.onResize = function () { resize(); if ($('viewer').classList.contains('open')) layoutViewer(); };
    window.addEventListener('resize', R.onResize);
    R.onKey = function (e) {
      if (!R) return;
      if (e.key === 'Escape') { e.preventDefault(); back(); }
      else if ($('viewer').classList.contains('open')) { if (e.key === 'ArrowRight') stepPanel(1); if (e.key === 'ArrowLeft') stepPanel(-1); }
    };
    document.addEventListener('keydown', R.onKey);
    wireViewer();
  }
  function hideHint() { if (!R || R.interacted) return; R.interacted = true; $('hint').classList.add('off'); }

  /* ═══════════ 3D ═══════════ */
  var F0 = 42;
  function P(x, z, y) { return new THREE.Vector3(x - 16, y || 0, 6 - z); }
  function N3(n) { return new THREE.Vector3(n[0], 0, -n[1]).normalize(); }
  function init3D() {
    if (R.g || !R.glOK) return;
    var T = window.THREE, G = R.g = { need: true, cam: { t: new T.Vector3(), r: 34, th: 2.2, ph: 0.92 }, sheetOff: 0, sheetOffTo: 0, anim: null, vel: { th: 0, ph: 0 }, ptrs: new Map(), gest: null, lastMove: 0, W: 1, H: 1, frames: [], probe: null, raf: 0, TR: null, tourStopAt: 0 };
    var cv = $('cv');
    try {
      G.renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { R.glOK = false; R.g = null; R.why = 'WebGL 없음'; setMode('map'); return; }
    G.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); G.renderer.setClearColor(0xE9ECEF, 1);
    G.renderer.toneMapping = T.AgXToneMapping; G.renderer.toneMappingExposure = 1.0;   /* 구운 라이트맵은 시안 v2 와 같은 톤(AgX)에서 맞춰졌다 */
    G.scene = new T.Scene();
    /* 배경 · 유리 너머가 회색 빈칸으로 보이지 않게 밝은 낮 하늘색(무채색) 그라데이션 */
    var bc = document.createElement('canvas'); bc.width = 4; bc.height = 256; var bg = bc.getContext('2d'), gr = bg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#FAFBFC'); gr.addColorStop(0.55, '#EEF0F2'); gr.addColorStop(1, '#DADDE1'); bg.fillStyle = gr; bg.fillRect(0, 0, 4, 256);
    G.scene.background = new T.CanvasTexture(bc); G.scene.background.colorSpace = T.SRGBColorSpace;
    G.camera = new T.PerspectiveCamera(F0, 1, 0.1, 400);
    /* 18F 장면(Lambert)용 빛 · 로비(MeshBasic + 구운 빛)에는 영향 없음 */
    G.scene.add(new T.HemisphereLight(0xFFFFFF, 0xC9CED4, 2.0));
    var dl = new T.DirectionalLight(0xFFFFFF, 1.3); dl.position.set(-8, 20, 12); G.scene.add(dl);
    G.S = window.TourScene.build({ T: T, D: D, P: P, N3: N3, renderer: G.renderer, scene: G.scene, labelFont: '"Pretendard Variable", Pretendard, sans-serif' });
    G.scene.add(G.S.lobby); G.scene.add(G.S.cafe);
    G.ray = new T.Raycaster(); G.gPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    /* 아틀라스 2장 · 받는 대로 붙인다 · 받은 그림은 이 탭이 열려 있는 동안 들고 있다(다시 열 때 연결이 끊겨도 그대로 · 서비스워커는 캐시하지 않는 원칙) */
    G.tex = [];
    D.ATLAS.files.forEach(function (f, i) {
      var put = function (im) { if (!R || R.g !== G) return; var t = new T.Texture(im); t.colorSpace = T.SRGBColorSpace; t.anisotropy = Math.min(8, G.renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true; G.tex.push(t); G.S.setAtlas(i, t); G.need = true; };
      var im = ATLAS_IMG[f];
      if (im && im.complete && im.naturalWidth) { put(im); return; }
      im = ATLAS_IMG[f] = new Image(); im.decoding = 'async';
      im.onload = function () { put(im); };
      im.onerror = function () { delete ATLAS_IMG[f]; };
      im.src = BASE + f;
    });
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (!R) return; R.why = 'WebGL 끊김'; setMode('map'); toast('3D를 그릴 수 없어 평면 지도로 바꿨어요'); });
    wireInput(G, cv);
    buildPins(G);
    resize();
    /* 첫 장면 = 남동쪽 높은 전경(정문과 동쪽 문이 함께 보이는 자리) · 모형을 받는 동안 이 자리에서 기다린다 */
    var DEF = G.S.DEF, c = G.cam, E = G.S.TOUR.establish;
    if (R.deep) { c.t.copy(DEF.t); c.r = DEF.r; c.th = DEF.th; c.ph = DEF.ph; }
    else { c.t.copy(P(E.look[0], E.look[1], E.look[2])); setCamFromPos(G, P(E.pos[0], E.pos[1], E.pos[2])); }
    var ld = $('load'); ld.textContent = '모형 불러오는 중'; ld.hidden = false;
    G.t0 = performance.now();
    G.S.load(BASE + 'lobby.glb?v=' + VER, function (k) { if (R && R.g === G) ld.textContent = '모형 불러오는 중 ' + Math.round(k * 100) + '%'; }, function () {
      if (!R || R.g !== G) return;
      G.loadMs = Math.round(performance.now() - G.t0);
      ld.hidden = true; ld.textContent = '';
      buildPins(G); resize();
      try { G.renderer.compile(G.scene, G.camera); } catch (e) {}
      /* 구역을 고르지 않았으면 전경에서 기본 시점으로 내려온다(시안 v2 입장과 같음) */
      if (!R.sel && !G.anim) flyTo(DEF, RM() ? 0 : 1800);
      G.probe = { ts: [] }; G.need = true; tourBtn();
    }, function (e) {
      if (!R || R.g !== G) return;
      ld.hidden = true; R.why = '모형 파일을 받지 못함'; setMode('map'); toast('모형을 불러오지 못해 평면 지도로 보여요');
    });
    G.raf = requestAnimationFrame(loop);
  }
  function setCamFromPos(G, p) {
    var c = G.cam, d = p.clone().sub(c.t); c.r = d.length(); c.ph = Math.acos(Math.max(-1, Math.min(1, d.y / c.r))); c.th = Math.atan2(d.x, d.z);
  }

  /* ═══ 자동 둘러보기 · 「둘러보기 시작」 · 동선은 장면(S.TOUR.route)이 가진다 ═══ */
  function tourBtn() {
    var G = R && R.g, b = $('tgo'); if (!b) return;
    b.hidden = !(G && G.S.loaded && R.mode === '3d' && R.scn === 'lobby' && !R.sel && !G.TR && !$('viewer').classList.contains('open'));
  }
  function defPos(G) { var D0 = G.S.DEF, s = Math.sin(D0.ph); return new THREE.Vector3(D0.t.x + D0.r * s * Math.sin(D0.th), D0.t.y + D0.r * Math.cos(D0.ph), D0.t.z + D0.r * s * Math.cos(D0.th)); }
  function startTour() {
    var G = R && R.g; if (!G || !G.S.loaded || R.mode !== '3d') return;
    if (R.sel) closeSheet();
    if (R.scn !== 'lobby') return;
    var T = window.THREE, keys = G.S.TOUR.route, ps = [], ls = [], ts = [];
    keys.forEach(function (k) {
      if (k.def) { ps.push(defPos(G)); ls.push(G.S.DEF.t.clone()); }
      else { ps.push(P(k.pos[0], k.pos[1], k.pos[2])); ls.push(P(k.look[0], k.look[1], k.look[2])); }
      ts.push(k.t);
    });
    G.TR = { keys: keys, pc: new T.CatmullRomCurve3(ps, false, 'centripetal', 0.5), lc: new T.CatmullRomCurve3(ls, false, 'centripetal', 0.5), ts: ts, t0: performance.now(), dur: ts[ts.length - 1] * 1000, cap: '' };
    G.anim = null; G.vel.th = G.vel.ph = 0; hideHint();
    $('tcap').hidden = false; $('rail').style.visibility = 'hidden'; tourBtn();
    G.camera.clearViewOffset(); G.camera.aspect = G.W / G.H; G.camera.fov = G.S.TOUR.fov; G.camera.updateProjectionMatrix();
    G.need = true;
  }
  function stopTour(atEnd) {
    var G = R && R.g; if (!G || !G.TR) return;
    var p = G.camera.position.clone(), l = G.TR.lastLook ? G.TR.lastLook.clone() : G.S.DEF.t.clone(), D0 = G.S.DEF, c = G.cam;
    G.TR = null;
    G.camera.fov = F0; G.camera.updateProjectionMatrix();
    if (atEnd) { c.t.copy(D0.t); c.r = D0.r; c.th = D0.th; c.ph = D0.ph; }
    else { c.t.copy(l); c.t.y = Math.max(0, Math.min(2.5, c.t.y)); setCamFromPos(G, p); clampCam(G); }
    $('tcap').hidden = true; if (!$('sheet').classList.contains('open')) $('rail').style.visibility = '';
    tourBtn(); G.need = true;
  }
  function stepTour(G, now) {
    var TR = G.TR; if (!TR) return false;
    var el = Math.min(TR.dur, now - TR.t0) / 1000, ts = TR.ts, i = 0;
    while (i < ts.length - 2 && el > ts[i + 1]) i++;
    var s = (el - ts[i]) / Math.max(0.001, ts[i + 1] - ts[i]);
    var e = s * 0.35 + (s * s * (3 - 2 * s)) * 0.65;   /* 구간마다 살짝 머무르며 지나간다 */
    var u = (i + e) / (ts.length - 1);
    G.camera.position.copy(TR.pc.getPoint(u)); var l = TR.lc.getPoint(u); G.camera.lookAt(l); TR.lastLook = l;
    var k = TR.keys[i + (s > 0.5 ? 1 : 0)] || {}, z = k.zone ? D.Z(k.zone) : null;
    var cap = z ? z.id : (k.cap || TR.cap);
    if (cap !== TR.cap) { TR.cap = cap; $('tcap').innerHTML = z ? signHtml(z) + '<span>' + esc(ztext(z).kor) + '</span>' : '<span>' + esc(cap) + '</span>'; }
    if (el >= TR.dur / 1000) stopTour(true);
    return true;
  }
  function disposeGL(G) {
    cancelAnimationFrame(G.raf);
    try {
      if (G.S && G.S.dispose) G.S.dispose();
      G.scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); });
      G.tex.forEach(function (t) { t.dispose(); });
      G.renderer.dispose(); G.renderer.forceContextLoss();
    } catch (e) {}
  }
  function applyCam(G) {
    var c = G.cam, s = Math.sin(c.ph), cam = G.camera;
    cam.position.set(c.t.x + c.r * s * Math.sin(c.th), c.t.y + c.r * Math.cos(c.ph), c.t.z + c.r * s * Math.cos(c.th));
    cam.lookAt(c.t);
    /* 시트가 덮은 만큼 화면 중심을 위로 올린다 */
    var off = Math.round(G.sheetOff);
    if (off > 1) { cam.aspect = G.W / (G.H + off); cam.fov = 2 * Math.atan(Math.tan(F0 * Math.PI / 360) * (G.H + off) / G.H) * 180 / Math.PI; cam.setViewOffset(G.W, G.H + off, 0, off, G.W, G.H); }
    else if (cam.view && cam.view.enabled) { cam.aspect = G.W / G.H; cam.fov = F0; cam.clearViewOffset(); }
  }
  var LIM = { rMin: 2.2, rMax: 70, phMin: 0.12, phMax: 1.38 };
  function clampCam(G) {
    var c = G.cam, L = G.S.limits(R.scn);
    c.r = Math.max(LIM.rMin, Math.min(LIM.rMax, c.r)); c.ph = Math.max(LIM.phMin, Math.min(LIM.phMax, c.ph));
    c.t.x = Math.max(L.x[0], Math.min(L.x[1], c.t.x)); c.t.z = Math.max(L.z[0], Math.min(L.z[1], c.t.z)); c.t.y = Math.max(0, Math.min(2.5, c.t.y));
  }
  function ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function flyTo(to, ms, done) {
    var G = R.g, c = G.cam, dth = to.th - c.th; while (dth > Math.PI) dth -= 2 * Math.PI; while (dth < -Math.PI) dth += 2 * Math.PI;
    var fr = { t: c.t.clone(), r: c.r, th: c.th, ph: c.ph };
    if (RM() || ms <= 0) { c.t.copy(to.t); c.r = to.r; c.th = fr.th + dth; c.ph = to.ph; G.anim = null; G.need = true; if (done) done(); return; }
    G.anim = { t0: performance.now(), ms: ms, fr: fr, to: { t: to.t.clone(), r: to.r, th: fr.th + dth, ph: to.ph }, lift: Math.min(10, fr.t.distanceTo(to.t) * 0.25), done: done };
    G.vel.th = G.vel.ph = 0; G.need = true;
  }
  function stepAnim(G, now) {
    var a = G.anim; if (!a) return false;
    var k = Math.min(1, (now - a.t0) / a.ms), e = ease(k), c = G.cam;
    c.t.lerpVectors(a.fr.t, a.to.t, e); c.r = a.fr.r + (a.to.r - a.fr.r) * e + Math.sin(Math.PI * e) * a.lift;
    c.th = a.fr.th + (a.to.th - a.fr.th) * e; c.ph = a.fr.ph + (a.to.ph - a.fr.ph) * e;
    if (k >= 1) { G.anim = null; if (a.done) a.done(); }
    return true;
  }
  function fitR(G, w, h) {
    var vf = F0 * Math.PI / 180, vh = G.H - G.sheetOffTo, asp = G.W / Math.max(1, G.H), hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    var rv = (h / 2) / Math.tan(vf / 2) * (G.H / Math.max(1, vh)), rh = (w / 2) / Math.tan(hf / 2);
    return Math.max(rv, rh) * 1.12;
  }
  function zoneView(G, z) {
    if (z.id === 'cafe') return G.S.CAFE_DEF;
    return G.S.zoneView(z.id, function (w, h) { return fitR(G, w, h); }) || G.S.DEF;
  }
  /* 판 앞면 · GLB 메시는 노드 변환이 판 자리가 아니라서 장면이 적어 둔 가운데(c) · 앞 방향(n) · 크기(size)를 쓴다 */
  function panelView(G, f) {
    var u = f.userData, nv = u.n, s = u.size, t = u.c.clone();
    var big = s[1] > 1.4; if (big) t.y += s[1] * 0.22;
    return { t: t, r: fitR(G, s[0] * 1.15, big ? s[1] * 0.62 : s[1] * 1.6), th: Math.atan2(nv.x, nv.z), ph: Math.PI / 2 - 0.05 };
  }
  function wireInput(G, cv) {
    function pinchBase() {
      var a = Array.from(G.ptrs.values()), m0 = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
      G.gest = { kind: 'pinch', d0: Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1, m0: m0, r0: G.cam.r, t0: G.cam.t.clone(), g: groundAt(G, m0.x, m0.y) };
    }
    cv.addEventListener('pointerdown', function (e) {
      if (!R || R.mode !== '3d') return;
      if (cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      G.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() });
      G.anim = null; G.vel.th = G.vel.ph = 0; hideHint();
      if (G.ptrs.size === 1) G.gest = { kind: 'rot', moved: 0 }; else if (G.ptrs.size === 2) pinchBase();
    });
    cv.addEventListener('pointermove', function (e) {
      var p = G.ptrs.get(e.pointerId); if (!p || !R || R.mode !== '3d') return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (G.gest && G.gest.kind === 'rot' && G.ptrs.size === 1) {
        G.gest.moved += Math.abs(dx) + Math.abs(dy);
        if (e.pointerType === 'mouse' && (e.buttons & 2 || e.shiftKey)) panBy(G, dx, dy);
        else { var dth = -dx * 0.0065, dph = -dy * 0.005; G.cam.th += dth; G.cam.ph += dph; var now = performance.now(), dt = Math.max(8, now - G.lastMove); G.vel.th = dth / dt * 16; G.vel.ph = dph / dt * 16; G.lastMove = now; }
        clampCam(G); G.need = true;
      } else if (G.gest && G.gest.kind === 'pinch' && G.ptrs.size >= 2) {
        var a = Array.from(G.ptrs.values()), d = Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1, m = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
        G.cam.r = G.gest.r0 * G.gest.d0 / d; G.cam.t.copy(G.gest.t0); clampCam(G);
        if (G.gest.g) { var f = 1 - G.cam.r / G.gest.r0; G.cam.t.x += (G.gest.g.x - G.gest.t0.x) * f; G.cam.t.z += (G.gest.g.z - G.gest.t0.z) * f; }
        panBy(G, m.x - G.gest.m0.x, m.y - G.gest.m0.y); G.need = true;
      }
    });
    function endPtr(e) {
      var p = G.ptrs.get(e.pointerId); if (!p) return;
      G.ptrs.delete(e.pointerId);
      var tap = G.gest && G.gest.kind === 'rot' && G.gest.moved < 10 && performance.now() - p.t0 < 400;
      if (G.ptrs.size === 1) { var q = Array.from(G.ptrs.values())[0]; q.x0 = q.x; q.y0 = q.y; G.gest = { kind: 'rot', moved: 99 }; }
      else if (G.ptrs.size === 0) { if (tap && performance.now() - G.tourStopAt > 700) pick(G, e.clientX, e.clientY); G.gest = null; if (performance.now() - G.lastMove > 60) G.vel.th = G.vel.ph = 0; G.need = true; }
    }
    cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('wheel', function (e) { if (!R || R.mode !== '3d') return; e.preventDefault(); hideHint(); G.anim = null; G.cam.r *= Math.exp(e.deltaY * 0.0012); clampCam(G); G.need = true; }, { passive: false });
  }
  function panBy(G, dx, dy) {
    var c = G.cam, vf = F0 * Math.PI / 180, s = 2 * c.r * Math.tan(vf / 2) / Math.max(1, G.H);
    var right = new THREE.Vector3(Math.cos(c.th), 0, -Math.sin(c.th)), fwd = new THREE.Vector3(-Math.sin(c.th), 0, -Math.cos(c.th));
    c.t.addScaledVector(right, -dx * s).addScaledVector(fwd, dy * s / Math.max(0.45, Math.cos(c.ph))); clampCam(G);
  }
  function ndc(x, y) { var rc = $('cv').getBoundingClientRect(); return new THREE.Vector2((x - rc.left) / rc.width * 2 - 1, -((y - rc.top) / rc.height) * 2 + 1); }
  function groundAt(G, x, y) { var o = new THREE.Vector3(); applyCam(G); G.camera.updateProjectionMatrix(); G.ray.setFromCamera(ndc(x, y), G.camera); return G.ray.ray.intersectPlane(G.gPlane, o) ? o : null; }
  function isShown(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
  function pick(G, x, y) {
    G.ray.setFromCamera(ndc(x, y), G.camera);
    var hit = G.ray.intersectObjects(G.S.picks.filter(isShown), false)[0];
    if (!hit) { if (R.sel && R.scn === 'lobby') closeSheet(); return; }
    var u = hit.object.userData;
    if (u.zone && u.pg && R.sel && R.sel.id === u.zone && u.face) { openPanelFrom3D(hit.object); return; }
    if (u.zone) selectZone(u.zone);
    else if (u.pg === 40 || u.pg === 47) openViewer([40, 47], u.pg === 40 ? 0 : 1, null, null);
    else if (u.pg) openViewer([u.pg], 0, null, null);
  }
  /* 구역 간판 칩(DOM 버튼) · 스크린리더가 읽고 손가락으로 누르기 쉽다 */
  function buildPins(G) {
    var box = $('pins'); box.innerHTML = ''; G.pinEls = {};
    D.ZONES.forEach(function (z) {
      if (!G.S.anchors[z.id]) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tr-pin'; b.setAttribute('aria-label', (z.id === 'cafe' ? '18F AX 커피챗' : z.name) + ' 구역 보기');
      b.innerHTML = signHtml(z) + '<span class="st"></span>';
      b.onclick = function () { hideHint(); selectZone(z.id); };
      box.appendChild(b); G.pinEls[z.id] = b;
    });
    /* 길잡이 이름표 · 누르지 않는다 · 구역을 고르지 않았을 때만 */
    (G.S.landmarks || []).forEach(function (l) {
      var d = document.createElement('div'); d.className = 'tr-pin lm'; d.setAttribute('aria-hidden', 'true');
      d.innerHTML = '<span class="s">' + esc(l.label) + '</span>'; box.appendChild(d); G.pinEls[l.id] = d;
    });
  }
  function placePins(G) {
    var v = new THREE.Vector3();
    for (var id in G.pinEls) {
      var el = G.pinEls[id], a = G.S.anchors[id];
      var show = a && R.mode === '3d' && !G.TR && ((R.scn === 'lobby' && id !== 'cafe') || (R.scn === 'cafe' && id === 'cafe'));
      if (show && /^lm_/.test(id)) show = !R.sel && G.cam.r < 60;
      if (show) { v.copy(a).project(G.camera); show = v.z < 1 && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.15; }
      if (!show) { el.style.display = 'none'; continue; }
      el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * G.W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * G.H).toFixed(1) + 'px) translate(-50%,-100%)';
      el.classList.toggle('on', !!R.sel && R.sel.id === id); el.classList.toggle('dim', !!R.sel && R.sel.id !== id);
    }
    var bub = $('bubble');
    if (R.scn === 'cafe' && R.mode === '3d') {
      v.copy(G.S.bubbleAt).project(G.camera);
      bub.style.display = 'block'; bub.textContent = '아이디어 한 줄을 내면 커피챗을 신청할 수 있어요';
      bub.style.transform = 'translate(' + ((v.x + 1) / 2 * G.W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * G.H - 8).toFixed(1) + 'px) translate(-50%,-100%)';
    } else bub.style.display = 'none';
  }
  /* 그리기 · 바뀔 때만(조작 · 비행 · 관성 · 시트 이동) */
  function loop(now) {
    if (!R || !R.g) return;
    var G = R.g; G.raf = requestAnimationFrame(loop);
    if (R.mode !== '3d') return;
    var busy = stepTour(G, now) || stepAnim(G, now), c = G.cam;
    if (!G.gest && !G.anim && (Math.abs(G.vel.th) > 1e-4 || Math.abs(G.vel.ph) > 1e-4)) { c.th += G.vel.th; c.ph += G.vel.ph; G.vel.th *= 0.92; G.vel.ph *= 0.92; clampCam(G); busy = true; }
    if (Math.abs(G.sheetOff - G.sheetOffTo) > 0.5) { G.sheetOff += (G.sheetOffTo - G.sheetOff) * (RM() ? 1 : 0.2); busy = true; } else G.sheetOff = G.sheetOffTo;
    if (G.bench) { c.th = G.bench.th0 + (now - G.bench.t0) * 0.0006; busy = true; }
    if (!busy && !G.need && !G.showFps) return;
    G.need = false; if (!G.TR) { applyCam(G); G.camera.updateProjectionMatrix(); } G.S.frame(G.camera, R.scn); G.renderer.render(G.scene, G.camera); placePins(G);
    G.frames.push(now); while (G.frames.length && now - G.frames[0] > 1000) G.frames.shift();
    if (G.showFps) $('fps').textContent = 'fps ' + G.frames.length + ' · ' + G.renderer.info.render.calls + ' draw';
    if (G.bench) { G.bench.ts.push(now); if (now - G.bench.t0 > G.bench.ms) { var b = G.bench; G.bench = null; b.done(summ(G, b.ts)); } }
    if (G.probe) { G.probe.ts.push(now); if (G.probe.ts.length >= 45 || (!G.anim && G.probe.ts.length >= 4)) { var s = summ(G, G.probe.ts); G.probe = null; perfVerdict(G, s); } }   /* 느린 기기는 비행이 45프레임 전에 끝나므로 비행 끝에서도 판정 */
  }
  function summ(G, ts) { var d = []; for (var i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]); d.sort(function (a, b) { return a - b; }); var sum = d.reduce(function (a, b) { return a + b; }, 0); return { frames: d.length, fps: +(1000 * d.length / Math.max(1, sum)).toFixed(1), p50: +(d[Math.floor(d.length * 0.5)] || 0).toFixed(1), p95: +(d[Math.floor(d.length * 0.95)] || 0).toFixed(1), dpr: G.renderer.getPixelRatio() }; }
  /* 저사양 판정 · 입장 비행 프레임 간격 중앙값 · 34ms 넘으면 해상도 낮춤 · 60ms 넘으면 평면 지도로 */
  function perfVerdict(G, s) {
    R.probeResult = s;
    if (R.opts.mode) return;
    if (s.p50 > 60) { R.why = '느린 화면'; setMode('map'); toast('이 기기에서는 평면 지도로 보여요 · 3D는 위 탭에서'); }
    else if (s.p50 > 34 && G.renderer.getPixelRatio() > 1) { G.renderer.setPixelRatio(1); resize(); }
    if (s.p50 > 34) G.S.lowPower();   /* 바닥 반사(그리기 두 번)도 끈다 */
  }
  function resize() {
    if (!R || !R.g) return;
    var G = R.g, r = $('stage').getBoundingClientRect(); G.W = Math.max(1, Math.round(r.width)); G.H = Math.max(1, Math.round(r.height));
    G.renderer.setSize(G.W, G.H, false); G.camera.aspect = G.W / G.H; G.camera.fov = F0; G.camera.clearViewOffset(); if (G.TR) G.camera.fov = G.S.TOUR.fov; G.camera.updateProjectionMatrix(); G.S.resize(); G.need = true;
  }
  function switchScene(to, then) {
    var G = R.g, f = $('fade'); f.classList.add('on');
    setTimeout(function () {
      if (!R || R.g !== G) return;
      R.scn = to; G.S.lobby.visible = to === 'lobby'; G.S.cafe.visible = to === 'cafe';
      var d = to === 'cafe' ? G.S.CAFE_DEF : G.S.DEF; G.anim = null; G.cam.t.copy(d.t); G.cam.r = d.r * 1.25; G.cam.th = d.th + 0.3; G.cam.ph = d.ph - 0.15; G.need = true;
      f.classList.remove('on'); tourBtn(); if (then) then();
    }, RM() ? 0 : 200);
  }

  /* ═══════════ 평면 지도 · 도면 좌표 그대로(위 = 북쪽, 아래 = 정문) ═══════════ */
  function zoneRect(z) {
    var xs = [], zs = [];
    z.rows.forEach(function (r) { var n = r.pages.length; [0, n].forEach(function (k) { var x = r.a[0] + r.r[0] * k, zz = r.a[1] + r.r[1] * k; xs.push(x, x + r.n[0] * 1.8); zs.push(zz, zz + r.n[1] * 1.8); }); });
    return [Math.min.apply(0, xs), Math.max.apply(0, xs), Math.min.apply(0, zs), Math.max.apply(0, zs)];
  }
  function mapSvg() {
    var B = D.BLD, s = 10, Y = function (z) { return (B.top - z) * s; }, X = function (x) { return x * s; }, LW = B.outline[1][0], CN = B.coreN, LN = B.lobbyN;   /* 숫자는 tour-data(= 3D 배치)에서만 */
    var o = '<svg class="plan" viewBox="-8 -8 404 ' + Math.round((B.top + 2.3) * s) + '" role="group" aria-label="1층 평면 지도. 위가 북쪽, 아래가 정문">';
    o += '<defs><pattern id="trHz" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#EEF0F2"/><line x1="0" y1="0" x2="0" y2="6" stroke="#D9DDE2" stroke-width="2"/></pattern></defs>';
    o += '<polygon points="' + B.outline.map(function (q) { return X(q[0]) + ',' + Y(q[1]); }).join(' ') + '" fill="#FFFFFF" stroke="#CBD0D6" stroke-width="1.5"/>';
    var O = B.outside; o += '<rect x="' + X(O.x0) + '" y="' + Y(O.z1) + '" width="' + (O.x1 - O.x0) * s + '" height="' + (O.z1 - O.z0) * s + '" rx="3" fill="#EEF0F2"/><text class="lab" x="' + X((O.x0 + O.x1) / 2) + '" y="' + (Y(O.z1) - 3) + '" text-anchor="middle">건물 밖</text>';
    var lz = (LN + CN) / 2 - 0.2;
    B.cores.forEach(function (c) { o += '<rect x="' + X(c[0]) + '" y="' + Y(CN) + '" width="' + (c[1] - c[0]) * s + '" height="' + (CN - LN) * s + '" fill="#E5E8EB"/><text class="lab" x="' + X((c[0] + c[1]) / 2) + '" y="' + Y(lz) + '" text-anchor="middle">엘리베이터 · 계단</text>'; });
    o += '<text class="lab" x="' + X(B.hall) + '" y="' + Y(lz) + '" text-anchor="middle">EV홀</text>';
    var hx = B.cores[1][1]; o += '<rect x="' + X(hx) + '" y="' + Y(CN) + '" width="' + (LW - hx) * s + '" height="' + (CN - LN) * s + '" fill="url(#trHz)"/><text class="lab" x="' + X((hx + LW) / 2) + '" y="' + Y(lz) + '" text-anchor="middle">행사 구역 아님</text>';
    B.rooms.forEach(function (r) { o += '<rect x="' + X(0) + '" y="' + Y(r[1]) + '" width="' + (3.6 * s) + '" height="' + ((r[1] - r[0]) * s) + '" fill="#F9FAFB" stroke="#D9DDE2"/><text class="lab" x="' + X(1.9) + '" y="' + (Y((r[0] + r[1]) / 2) + 2.5) + '" text-anchor="middle">' + r[2] + '</text>'; });
    B.cols.forEach(function (x) { o += '<rect x="' + (X(x) - 4.5) + '" y="' + (Y(B.colZ) - 4.5) + '" width="9" height="9" fill="#C9CED4"/>'; });
    o += '<line x1="0" y1="' + Y(0) + '" x2="' + X(LW) + '" y2="' + Y(0) + '" stroke="#B0B8C1" stroke-width="3"/>';
    o += '<path d="M' + (X(B.revolve) - 13) + ',' + Y(0) + ' A13,13 0 0 1 ' + (X(B.revolve) + 13) + ',' + Y(0) + '" fill="none" stroke="#8B95A1" stroke-width="1.5"/><text class="lab" x="' + X(B.revolve) + '" y="' + (Y(0) + 11) + '" text-anchor="middle" style="font-weight:700;fill:#4E5968">정문</text>';
    o += '<text class="lab" x="' + (X(LW) + 2) + '" y="' + (Y((B.doorE[0] + B.doorE[1]) / 2) + 2) + '">동쪽 출입문</text>';
    var ci = D.PROPS.checkin.at; o += '<rect x="' + (X(ci[0]) - 15) + '" y="' + (Y(ci[1]) - 15) + '" width="30" height="30" rx="3" fill="#FFFFFF" stroke="#CBD0D6"/><text class="lab" x="' + X(ci[0]) + '" y="' + (Y(ci[1]) + 2.5) + '" text-anchor="middle">체크인</text>';
    var sel = R.sel;
    D.ZONES.forEach(function (z) {
      if (!z.rows.length) return;
      var b = zoneRect(z), w = (b[1] - b[0]) * s, h = (b[3] - b[2]) * s, tx = X((b[0] + b[1]) / 2), ty = Y((b[2] + b[3]) / 2), on = sel && sel.id === z.id;
      var lw = z.name.length * 6.0 + 10;
      o += '<g class="zone' + (on ? ' on' : '') + '" data-z="' + z.id + '" role="button" tabindex="0" aria-label="' + esc(z.name + ' · ' + ztext(z).kor) + '">';
      if (z.area) o += '<rect class="f" x="' + X(z.area[0]) + '" y="' + Y(z.area[3]) + '" width="' + (z.area[1] - z.area[0]) * s + '" height="' + (z.area[3] - z.area[2]) * s + '" rx="3" style="opacity:.55"/>';
      o += '<rect class="f" x="' + X(b[0]) + '" y="' + Y(b[3]) + '" width="' + w + '" height="' + h + '" rx="3"/>';
      z.rows.forEach(function (r) { var n = r.pages.length; o += '<line x1="' + X(r.a[0]) + '" y1="' + Y(r.a[1]) + '" x2="' + X(r.a[0] + r.r[0] * n) + '" y2="' + Y(r.a[1] + r.r[1] * n) + '" stroke="#FF7F32" stroke-width="3"/>'; });
      var mp = z.map || [0, 0], vert = h > w * 1.6 && w < 30, lx = mp[0] < 0 ? X(b[0]) - lw / 2 - 3 : vert ? X(b[1]) + lw / 2 + 2 : tx; ty = mp[1] > 0 ? Y(b[3]) - 10 : ty;
      o += '<rect x="' + (lx - lw / 2) + '" y="' + (ty - 7) + '" width="' + lw + '" height="14" rx="2" fill="' + (z.signPg ? '#FF7F32' : '#FFFFFF') + '" stroke="#FF7F32" stroke-width="1.2"/>' +
        '<text x="' + lx + '" y="' + (ty + 3) + '" text-anchor="middle"' + (z.signPg ? '' : ' style="fill:#A63D00"') + '>' + esc(z.name) + '</text></g>';
    });
    return o + '</svg>';
  }
  function renderMap() {
    var m = $('map'), cafe = D.Z('cafe');
    m.innerHTML = '<div class="card">' + mapSvg() + '<p class="cap">위가 북쪽 · 아래가 정문 · 구역을 누르면 판을 볼 수 있어요</p></div>' +
      '<button type="button" class="card cafe" data-z="cafe">' + BOTSVG + '<span style="flex:1;min-width:0"><span style="display:block;font-size:15px;line-height:22px;font-weight:700">18F AX 커피챗</span><span style="display:block;font-size:13px;line-height:20px;color:var(--t-muted)">' + esc(ztext(cafe).kor) + '</span></span>' + CHEV + '</button>' +
      (R.why ? '<p class="cap">평면 지도로 보여 주는 이유: ' + esc(R.why) + '</p>' : '');
    Array.prototype.forEach.call(m.querySelectorAll('[data-z]'), function (el) {
      el.addEventListener('click', function () { selectZone(el.getAttribute('data-z')); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectZone(el.getAttribute('data-z')); } });
    });
  }
  /* 목록 · 스크린리더용 · 구역 → 판 제목(판마다 대체 글) */
  function renderList() {
    var l = $('list');
    l.innerHTML = D.ZONES.map(function (z) {
      var ps = D.zonePages(z), t = ztext(z);
      return '<section class="card" aria-label="' + esc(z.id === 'cafe' ? '18F AX 커피챗' : z.name) + '"><h2>' + signHtml(z) + '<span>' + esc(t.kor) + '</span></h2>' +
        (z.where ? '<p class="cap" style="margin-top:4px">' + esc(z.fl + ' · ' + z.where) + '</p>' : '<p class="cap" style="margin-top:4px">18F</p>') +
        (ps.length ? '<ol>' + ps.map(function (p, i) { return '<li><button type="button" data-z="' + z.id + '" data-i="' + i + '">' + thumbHtml(p, D.pgSize(p)[0] > D.pgSize(p)[1] ? 56 : 28) + '<span>' + esc(D.PG[p]) + '</span></button></li>'; }).join('') + '</ol>' : '') +
        '<button type="button" class="btn weak" style="margin-top:12px" data-act="' + z.id + '">' + esc(acts(z)[0].lbl) + '</button></section>';
    }).join('') +
      '<section class="card" aria-label="모형 밖 안내물"><h2>모형 밖 안내물</h2><ol>' +
      [40, 47].map(function (p) { return '<li><button type="button" data-p="' + p + '">' + thumbHtml(p, D.pgSize(p)[0] > D.pgSize(p)[1] ? 56 : 28) + '<span>' + esc(D.PG[p]) + ' · 동쪽 출입문 밖 체크인</span></button></li>'; }).join('') +
      '<li><button type="button" data-p="46">' + thumbHtml(46, 40) + '<span>' + esc(D.PG[46]) + ' · 기둥 4개 · 면마다</span></button></li>' +
      D.UNPLACED.map(function (p) { return '<li><button type="button" data-p="' + p + '">' + thumbHtml(p, 28) + '<span>' + esc(D.PG[p]) + '</span></button></li>'; }).join('') + '</ol></section>';
    Array.prototype.forEach.call(l.querySelectorAll('button[data-i]'), function (b) { b.onclick = function () { var z = D.Z(b.getAttribute('data-z')); openViewer(D.zonePages(z), +b.getAttribute('data-i'), null, z); }; });
    Array.prototype.forEach.call(l.querySelectorAll('button[data-p]'), function (b) { b.onclick = function () { var p = +b.getAttribute('data-p'); openViewer([p], 0, null, null); }; });
    Array.prototype.forEach.call(l.querySelectorAll('button[data-act]'), function (b) { b.onclick = function () { runAct(acts(D.Z(b.getAttribute('data-act')))[0]); }; });
  }

  /* ═══════════ 구역 줄 · 시트 ═══════════ */
  function renderRail() {
    $('rail').innerHTML = D.ZONES.map(function (z) { return '<button type="button" data-z="' + z.id + '" aria-pressed="' + (!!R.sel && R.sel.id === z.id) + '" aria-label="' + esc(z.id === 'cafe' ? '18F AX 커피챗' : z.name) + '">' + signHtml(z) + '</button>'; }).join('');
    Array.prototype.forEach.call($('rail').querySelectorAll('button'), function (b) { b.onclick = function () { hideHint(); selectZone(b.getAttribute('data-z')); }; });
  }
  function selectZone(id, deep) {
    var z = D.Z(id); if (!z) return;
    stopTour(false);
    var was = R.sel; R.sel = z;
    var toCafe = id === 'cafe';
    if (R.mode === '3d' && R.g) {
      if ((toCafe && R.scn !== 'cafe') || (!toCafe && R.scn !== 'lobby')) switchScene(toCafe ? 'cafe' : 'lobby', function () { openSheet(z, was, deep); });
      else openSheet(z, was, deep);
    } else openSheet(z, was, deep);
    if (R.g) { R.g.S.mark(id); R.g.need = true; }
    renderRail(); if (R.mode === 'map') renderMap(); tourBtn();
  }
  function openSheet(z, was, deep) {
    var b = $('sheetBody'), ps = D.zonePages(z), t = ztext(z), h = HOST(), A = acts(z), cr = h && h.crowd ? h.crowd(z.id) : null;
    b.innerHTML =
      '<div class="sh-top">' + signHtml(z, true) + '<span class="fl">' + z.fl + '</span><button class="x" type="button" aria-label="구역 닫기" data-x="1">' + XSVG + '</button></div>' +
      '<h2>' + esc(t.kor) + '</h2>' + (t.fact ? '<p class="facts">' + esc(t.fact) + '</p>' : '') +
      (z.where ? '<p class="where">' + esc(z.where) + '</p>' : '') +
      (t.todo && t.todo.length ? '<ul class="todo">' + t.todo.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      (ps.length ? '<div class="strip" role="list" aria-label="이 구역의 판">' + ps.map(function (p, i) { var s = D.pgSize(p); return '<button type="button" role="listitem" data-i="' + i + '" aria-label="' + esc(D.PG[p]) + ' 크게 보기">' + thumbHtml(p, s[0] > s[1] ? 130 : 52) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="sec">' + (z.id === 'cafe' ? '18층에서 해 보기' : '1층에서 해 보기') + '</div>' +
      A.map(function (a, i) { return '<button class="btn ' + (i ? 'weak' : 'pri') + '" type="button" data-a="' + i + '">' + esc(a.lbl) + '</button>'; }).join('') +
      (cr ? '<button class="crowd' + (cr.cls || '') + '" type="button" data-crowd="1"><span class="dot"></span><b>' + esc(cr.nm) + '</b><span>혼잡 제보</span><span class="v">' + esc(cr.st + (cr.sub ? ' · ' + cr.sub : '')) + '</span>' + CHEV + '</button>' : '') +
      '<p class="note">' + (z.id === 'cafe' ? '실시간 대화는 18층 현장에서 해요' : '스탬프 · 체험 · 룰렛은 1층 현장에서만 돼요') + '</p>';
    b.querySelector('[data-x]').onclick = function () { closeSheet(); };
    Array.prototype.forEach.call(b.querySelectorAll('[data-a]'), function (el) { el.onclick = function () { runAct(A[+el.getAttribute('data-a')]); }; });
    var cb = b.querySelector('[data-crowd]'); if (cb) cb.onclick = function () { var hh = HOST(); close(); if (hh && hh.crowdGo) setTimeout(hh.crowdGo, 0); };
    Array.prototype.forEach.call(b.querySelectorAll('.strip button'), function (el) {
      el.onclick = function () { var i = +el.getAttribute('data-i'), p = ps[i], f = R.g && R.g.S.faces[p]; if (R.mode === '3d' && R.g && f && R.scn === 'lobby') openPanelFrom3D(f); else openViewer(ps, i, null, z); };
    });
    var sh = $('sheet'); sh.classList.add('open'); sh.setAttribute('aria-hidden', 'false'); $('rail').style.visibility = 'hidden';
    b.scrollTop = 0;
    var dp = deep && R.deep && R.deep.pg ? R.deep.pg : 0; if (deep) R.deep = null;
    requestAnimationFrame(function () {
      if (!R) return;
      if (R.mode === '3d' && R.g) {
        R.g.sheetOffTo = Math.min(sh.offsetHeight, R.g.H * 0.62) - $('rail').offsetHeight;
        var after = dp ? function () { var f = R && R.g && R.g.S.faces[dp]; if (f && R.scn === 'lobby') openPanelFrom3D(f); else if (R) openViewer(ps, Math.max(0, ps.indexOf(dp)), null, z); } : null;
        flyTo(zoneView(R.g, z), deep ? 900 : was && was.id !== z.id ? 1100 : 1000, after);
      } else if (dp) openViewer(ps, Math.max(0, ps.indexOf(dp)), null, z);
    });
  }
  function closeSheet() {
    var sh = $('sheet'); if (!sh.classList.contains('open')) return;
    sh.classList.remove('open'); sh.setAttribute('aria-hidden', 'true'); $('rail').style.visibility = '';
    var wasCafe = R.sel && R.sel.id === 'cafe';
    R.sel = null; renderRail(); if (R.mode === 'map') renderMap(); tourBtn();
    if (R.g) { R.g.S.mark(null); R.g.sheetOffTo = 0; R.g.need = true; }
    if (R.mode === '3d' && R.g) { if (wasCafe) switchScene('lobby', function () { flyTo(R.g.S.DEF, 0); }); else flyTo(R.g.S.DEF, 900); }
  }

  /* ═══════════ 판 보기(2D 확대) ═══════════ */
  function openPanelFrom3D(f) {
    var G = R.g, p = f.userData.pg, z = D.Z(f.userData.zone) || D.zoneOfPg(p), list = z ? D.zonePages(z) : [p], i = Math.max(0, list.indexOf(p));
    flyTo(panelView(G, f), 750, function () {
      if (!R || R.g !== G) return;
      /* 판이 화면에 있던 자리에서 2D 로 넓어진다 */
      var u = f.userData, s = u.size, c = u.c, hx = s[0] / 2, hy = s[1] / 2;
      var rv = new THREE.Vector3(u.n.z, 0, -u.n.x).normalize();
      applyCam(G); G.camera.updateProjectionMatrix(); G.camera.updateMatrixWorld();
      var pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (q) { return c.clone().addScaledVector(rv, q[0] * hx).add(new THREE.Vector3(0, q[1] * hy, 0)).project(G.camera); });
      var rc = $('cv').getBoundingClientRect(), xs = pts.map(function (v) { return rc.left + (v.x + 1) / 2 * rc.width; }), ys = pts.map(function (v) { return rc.top + (1 - v.y) / 2 * rc.height; });
      openViewer(list, i, { x: Math.min.apply(0, xs), y: Math.min.apply(0, ys), w: Math.max.apply(0, xs) - Math.min.apply(0, xs), h: Math.max.apply(0, ys) - Math.min.apply(0, ys) }, z);
    });
  }
  function openViewer(list, i, from, z) {
    R.V = { list: list, i: i, z: z || D.zoneOfPg(list[i]), s: 1, tx: 0, ty: 0, bw: 1, bh: 1, iw: 1, ih: 1 };
    var v = $('viewer'); v.setAttribute('aria-hidden', 'false');
    loadPanel(from);
    requestAnimationFrame(function () { if (R) { v.classList.add('open'); tourBtn(); } });
    $('vzoom').style.opacity = 1; setTimeout(function () { if (R) $('vzoom').style.opacity = 0; }, 2400);
  }
  function closeViewer() {
    var v = $('viewer'); if (!v.classList.contains('open')) return;
    v.classList.remove('open'); v.setAttribute('aria-hidden', 'true');
    var vi = $('vimg'); vi.style.transition = 'opacity .2s'; vi.style.opacity = 0; tourBtn();
    if (R.sel && R.mode === '3d' && R.g) flyTo(zoneView(R.g, R.sel), 800);
  }
  function layoutViewer() {
    var V = R.V, p = V.list[V.i], s = D.pgSize(p), r = $('vs').getBoundingClientRect(), vi = $('vimg');
    V.bw = r.width; V.bh = r.height;
    V.iw = V.bw - 32; V.ih = V.iw * s[1] / s[0];
    if (V.ih < V.bh - 32 && s[1] > s[0]) { V.ih = V.bh - 32; V.iw = V.ih * s[0] / s[1]; }
    if (s[1] > s[0] && V.iw > V.bw - 32) { V.iw = V.bw - 32; V.ih = V.iw * s[1] / s[0]; }
    vi.style.width = V.iw + 'px'; vi.style.height = V.ih + 'px';
    V.s = 1; V.tx = (V.bw - V.iw) / 2; V.ty = V.ih < V.bh ? (V.bh - V.ih) / 2 : 16;
    return r;
  }
  function loadPanel(from) {
    var V = R.V, p = V.list[V.i], z = V.z, vi = $('vimg'), pic = $('vpic');
    $('vTitle').innerHTML = (z ? signHtml(z) : '') + '<b>' + esc(D.PG[p]) + '</b>';
    $('vCount').textContent = V.list.length > 1 ? (V.i + 1) + ' / ' + V.list.length : '';
    $('vPrev').disabled = V.i <= 0; $('vNext').disabled = V.i >= V.list.length - 1;
    $('vPrev').style.visibility = $('vNext').style.visibility = V.list.length > 1 ? '' : 'hidden';
    var a = z ? acts(z)[0] : null; $('vAct').textContent = a ? a.lbl : ''; $('vAct').style.visibility = a ? '' : 'hidden';
    pic.alt = D.PG[p];
    var r = layoutViewer();
    vi.setAttribute('style', 'width:' + V.iw + 'px;height:' + V.ih + 'px;' + thumbBg(p, V.iw, V.ih) + ';background-size:' + bgSize(p, V.iw) + ';opacity:0');
    pic.style.opacity = 0; pic.removeAttribute('src');
    var hi = new Image(); hi.onload = function () { if (R && R.V === V && V.list[V.i] === p) { pic.src = hi.src; pic.style.opacity = 1; } }; hi.src = detailSrc(p);
    [V.list[V.i - 1], V.list[V.i + 1]].forEach(function (q) { if (q) { var im = new Image(); im.src = detailSrc(q); } });
    if (from && !RM()) {
      vi.style.transition = 'none'; vi.style.opacity = 1;
      vi.style.transform = 'translate(' + (from.x - r.left) + 'px,' + (from.y - r.top) + 'px) scale(' + (from.w / V.iw) + ')';
      vi.getBoundingClientRect();
      vi.style.transition = 'transform .42s cubic-bezier(.2,.8,.2,1)';
      applyV();
      setTimeout(function () { if (R) vi.style.transition = ''; }, 450);
    } else { vi.style.transition = 'opacity .2s'; applyV(); requestAnimationFrame(function () { if (R) vi.style.opacity = 1; }); }
  }
  function bgSize(p, w) { var a = D.ATLAS.at[p]; if (!a) return 'cover'; var S = D.ATLAS.size[a[0]], k = w / (a[3] - 4); return (S * k).toFixed(1) + 'px ' + (S * k).toFixed(1) + 'px'; }
  function applyV() { var V = R.V; $('vimg').style.transform = 'translate(' + V.tx.toFixed(1) + 'px,' + V.ty.toFixed(1) + 'px) scale(' + V.s.toFixed(4) + ')'; }
  function clampV() {
    var V = R.V, w = V.iw * V.s, h = V.ih * V.s;
    V.tx = w <= V.bw ? (V.bw - w) / 2 : Math.min(0, Math.max(V.bw - w, V.tx));
    V.ty = h <= V.bh ? (V.bh - h) / 2 : Math.min(16, Math.max(V.bh - h - 16, V.ty));
  }
  function stepPanel(d) { var V = R.V, j = V.i + d; if (j < 0 || j >= V.list.length) return; V.i = j; $('vimg').style.transition = 'none'; loadPanel(null); }
  function wireViewer() {
    var vs = $('vs'), vp = new Map(), vg = null, lastTap = 0;
    vs.addEventListener('pointerdown', function (e) {
      if (!R || !R.V) return;
      if (vs.setPointerCapture) try { vs.setPointerCapture(e.pointerId); } catch (x) {}
      $('vimg').style.transition = '';
      vp.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() });
      var V = R.V;
      if (vp.size === 1) vg = { kind: 'pan', sx: V.tx, sy: V.ty, moved: 0 };
      else if (vp.size === 2) { var a = Array.from(vp.values()); vg = { kind: 'pinch', d0: Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1, m0: { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }, s0: V.s, tx0: V.tx, ty0: V.ty }; }
    });
    vs.addEventListener('pointermove', function (e) {
      var p = vp.get(e.pointerId); if (!p || !vg || !R) return; p.x = e.clientX; p.y = e.clientY;
      var V = R.V, r = vs.getBoundingClientRect();
      if (vg.kind === 'pan' && vp.size === 1) {
        var dx = p.x - p.x0, dy = p.y - p.y0; vg.moved = Math.max(vg.moved, Math.abs(dx) + Math.abs(dy));
        V.tx = vg.sx + dx; V.ty = vg.sy + dy;
        if (V.iw * V.s <= V.bw + 1) { V.ty = Math.min(16, Math.max(V.bh - V.ih * V.s - 16, V.ty)); if (V.ih * V.s <= V.bh) V.ty = (V.bh - V.ih * V.s) / 2; }   /* 확대 전: 가로로 끌면 넘기기 */
        else clampV();
        applyV();
      } else if (vg.kind === 'pinch' && vp.size >= 2) {
        var a = Array.from(vp.values()), d = Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1, m = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
        var s = Math.max(1, Math.min(6, vg.s0 * d / vg.d0)), k = s / vg.s0, mx0 = vg.m0.x - r.left, my0 = vg.m0.y - r.top;
        V.s = s; V.tx = (m.x - r.left) - (mx0 - vg.tx0) * k; V.ty = (m.y - r.top) - (my0 - vg.ty0) * k; clampV(); applyV();
      }
    });
    function vEnd(e) {
      var p = vp.get(e.pointerId); if (!p || !R) return; vp.delete(e.pointerId);
      var V = R.V, vi = $('vimg');
      if (vp.size === 1) { var q = Array.from(vp.values())[0]; q.x0 = q.x; q.y0 = q.y; vg = { kind: 'pan', sx: V.tx, sy: V.ty, moved: 99 }; return; }
      if (vp.size) return;
      var dx = p.x - p.x0;
      if (vg && vg.kind === 'pan' && V.iw * V.s <= V.bw + 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(p.y - p.y0)) { stepPanel(dx < 0 ? 1 : -1); vg = null; return; }
      if (vg && vg.kind === 'pan' && vg.moved < 8 && performance.now() - p.t0 < 300) {
        var now = performance.now(), r = vs.getBoundingClientRect();
        if (now - lastTap < 320) { var k = V.s > 1.2 ? 1 / V.s : 2.6 / V.s, mx = p.x - r.left, my = p.y - r.top; V.s *= k; V.tx = mx - (mx - V.tx) * k; V.ty = my - (my - V.ty) * k; clampV(); vi.style.transition = 'transform .25s ease'; applyV(); lastTap = 0; vg = null; return; }
        lastTap = now;
      }
      clampV(); vi.style.transition = 'transform .2s ease'; applyV(); vg = null;
    }
    vs.addEventListener('pointerup', vEnd); vs.addEventListener('pointercancel', vEnd);
    vs.addEventListener('wheel', function (e) { if (!R || !R.V) return; e.preventDefault(); var V = R.V, r = vs.getBoundingClientRect(), k = Math.exp(-e.deltaY * 0.0015), s = Math.max(1, Math.min(6, V.s * k)); k = s / V.s; var mx = e.clientX - r.left, my = e.clientY - r.top; V.s = s; V.tx = mx - (mx - V.tx) * k; V.ty = my - (my - V.ty) * k; clampV(); applyV(); }, { passive: false });
  }

  /* ═══════════ 보기 전환 ═══════════ */
  function setMode(m, first) {
    if (m !== '3d') stopTour(false);
    if (m === '3d' && !R.glOK) { if (!first) toast('이 기기는 3D를 지원하지 않아요'); m = 'map'; }
    R.mode = m;
    Array.prototype.forEach.call(R.el.root.querySelectorAll('.tr-seg button'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
    $('map').hidden = m !== 'map'; $('list').hidden = m !== 'list';
    var is3 = m === '3d';
    $('cv').style.visibility = is3 ? '' : 'hidden'; $('pins').style.display = is3 ? '' : 'none'; $('hint').style.display = is3 ? '' : 'none';
    if (!is3) $('bubble').style.display = 'none';
    if (m === 'map') renderMap(); if (m === 'list') renderList();
    if (is3) { init3D(); if (R.g) { resize(); if (!$('sheet').classList.contains('open')) R.g.sheetOffTo = 0; R.g.need = true; } }
    else if (R.g) R.g.sheetOffTo = 0;
    if (!is3) { $('tcap').hidden = true; $('load').hidden = true; } else if (R.g && !R.g.S.loaded) $('load').hidden = false;
    tourBtn();
  }

  /* 검사 · 녹화용(앱 밖에서는 쓰지 않는다) */
  var probe = {
    select: function (id) { if (R) selectZone(id); },
    panel: function (p) { var f = R && R.g && R.g.S.faces[p]; if (f) openPanelFrom3D(f); },
    mode: function (m) { if (R) setMode(m); },
    state: function () { return R ? { mode: R.mode, sel: R.sel && R.sel.id, scn: R.scn, sheet: $('sheet').classList.contains('open'), viewer: $('viewer').classList.contains('open'), pg: R.V && R.V.list[R.V.i], why: R.why, probe: R.probeResult || null } : null; },
    bench: function (ms) { return new Promise(function (res) { if (!R || !R.g) return res(null); R.g.bench = { t0: performance.now(), th0: R.g.cam.th, ms: ms || 5000, ts: [], done: res }; }); },
    fps: function (on) { if (R && R.g) { R.g.showFps = !!on; $('fps').style.display = on ? 'block' : 'none'; } },
    info: function () { var G = R && R.g; return G ? { calls: G.renderer.info.render.calls, tris: G.renderer.info.render.triangles, tex: G.renderer.info.memory.textures, geo: G.renderer.info.memory.geometries, dpr: G.renderer.getPixelRatio() } : null; },
    pinXY: function (id) { var G = R && R.g, el = G && G.pinEls[id]; if (!el || el.style.display === 'none') return null; var r = el.firstElementChild.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; },
    faceXY: function (p) { var G = R && R.g, f = G && G.S.faces[p]; if (!f) return null; var v = f.userData.c.clone(); v.y += f.userData.size[1] * 0.15; v.project(G.camera); var rc = $('cv').getBoundingClientRect(); return [rc.left + (v.x + 1) / 2 * rc.width, rc.top + (1 - v.y) / 2 * rc.height]; },
    busy: function () { var G = R && R.g; return !!(G && (G.anim || G.TR)); },
    loaded: function () { var G = R && R.g; return G && G.S.loaded ? { ms: G.loadMs } : null; },
    tour: function (on) { if (on === false) stopTour(false); else if (on) startTour(); var G = R && R.g; return !!(G && G.TR); },
    look: function (x, z, y, lx, lz, ly) { var G = R && R.g; if (!G) return null; stopTour(false); G.anim = null; G.cam.t.copy(P(lx, lz, ly)); setCamFromPos(G, P(x, z, y)); G.need = true; return 1; },
    cam: function () { var G = R && R.g; if (!G) return null; var p = G.camera.position; return { x: +(p.x + 16).toFixed(2), z: +(6 - p.z).toFixed(2), y: +p.y.toFixed(2), r: +G.cam.r.toFixed(2) }; }
  };
  window.AXTour = { open: open, close: close, back: back, isOpen: isOpen, probe: probe, ver: 'v5.19' };
})();
