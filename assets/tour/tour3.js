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
  var T = window.THREE, D = window.TOUR_DATA, BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^\/]*$/, '') : 'assets/tour/'; })(), LABVER = 'v552a', ROOT = BASE.replace(/assets\/tour\/$/, '');
  var Q = new URLSearchParams(window.AXT3_Q || '');   /* 시험판(tour-lab)만 주소 값을 넘긴다 · 앱은 비어 있음 */
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);   /* 기본 = 기기 설정 · 처음 안내 · 도움말의 「움직임 줄이기」로 바꾸면 이 기기에 기억(아래 start) */
  function $(id) { return document.getElementById('t3-' + id); }   /* 모든 id 는 t3- 접두(앱 id 와 겹치지 않게) */
  /* v5.66 (디자인 감사 261005 D1 · design.md A-6) 이전 · 다음 단추의 ◀ ▶ 문자 → 앱 셰브론 모양(앱 CHEV_SVG · BACK_SVG 와 같은 꺾쇠 · 글자색을 따른다) */
  var CHV_R = '<svg class="chv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>';
  var CHV_L = '<svg class="chv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>';
  /* v5.66 (디자인 감사 261005 상4 · design.md A-6 · 5-20) 판 시트 · 경품 시트 · 타자왕 순위판 머리의 구역 칩 = 앱 구역 간판과 같은 점 글자(앱 DotGlyph · 흰 점 14px)
   * 18F 커피챗 = 앱 간판 이름 「AX COFFEE CHAT」 · 점 글자가 없는 곳(시험판) · 점 글자에 없는 글자(한글 「자세히 보기」)는 글자 그대로 */
  var SIGN_NM = { cafe: 'AX COFFEE CHAT' };
  function signPaint(el, nm, lbl) {
    var DG = window.DotGlyph;
    if (DG && DG.svg && !/[^A-Za-z0-9 \/\-.:+!·?]/.test(nm)) { el.innerHTML = DG.svg(nm, { h: 14, hidden: true }); el.setAttribute('role', 'img'); el.setAttribute('aria-label', lbl || nm); el.classList.add('dot'); }
    else { el.textContent = nm; el.removeAttribute('role'); el.removeAttribute('aria-label'); el.classList.remove('dot'); }
  }
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
    { id: 'vision', zone: 'vision', x: 29.0, z: 3.6, gAt: [29.75, 5.85], gFace: [27.3, 8.9] },   /* v5.79 (사용자 261006 「옆 두 번째 판 앞 NPC와 너무 붙어 있다」) 스태프 = 구역 입구 쪽(첫 판 · TV 앞 통로 옆 · 옛 자리 29.7, 2.5 는 AX LAB 스태프와 2.9m) · AX LAB 스태프와 4.3m · 이 멈춤 자리에서 2.3m(AX LAB 스태프 2.44m 보다 가까워 말풍선 3m 규칙 그대로 이 구역 말) · 로비 들어오는 쪽을 본다 */
    { id: 'lab', zone: 'lab', x: 27.9, z: 3.25 },
    { id: 'action', zone: 'action', x: 22.3, z: 3.25 },
    { id: 'play', zone: 'play', x: 9.6, z: 3.0, look: [8.6, 0.55] },
    /* EVENT = 세 자리(사용자 261003) · 타자왕(홍보 영상) · 포토부스(판 보기 · 챗봇 없음) · 룰렛(호객만 · 판 보기 없음) */
    { id: 'typing', zone: 'event', spot: 'typing', name: 'AX 타자왕', x: 3.3, z: 2.5, look: [0.55, 2.47], say: '당신의 프롬프팅 속도를 보여\u00A0주세요', go: '' },   /* v5.79 (사용자 261006) 프롬프트(입력한 글) → 프롬프팅(쓰는 행위 · 속도를 재는 대상) · 「보여 주세요」 띄어 씀(앱 「눌러 주세요」와 같게 · 말풍선 232px 두 줄이 「속도를 / 보여 주세요」로 끊기게 붙는 빈칸 u00A0) · v5.64 (사용자 261005 「프롬프트 실력보다는 속도」 · 원문 「보셔주세요」는 「보여주세요」로) 옛 「타자왕 1~3위 경품 · 17:00 마감」 */
    { id: 'event', zone: 'event', name: '포토부스', x: 5.3, z: 7.35, look: [0.55, 7.35], noGuide: true },   /* v5.58 촬영 기계(가운데 칸 앞 · 도면 3.6, 7.35) 뒤에서 벽 쪽 단체 사진을 봄 */
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
    stick: null, near: null, ctaKey: '', fade: [1, 1, 1, 1, 1], fadeTo: [1, 1, 1, 1, 1], fwdT: 0, run: 0, realV: 0, fov0: 58,
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
      '겹침 ' + (z.pairs || 0) + ' · 자름 ' + (z.cut || 0) + ' · 지움 ' + (z.gone || 0) + ' · 빛 옮김 ' + (z.relit || 0) + ' · 라이트맵 ' + (l.tex || 0) + '장 ' + (l.ms || 0) + 'ms' + (G.lmErr ? ' 오류' : '') + '\n' + posText() + diagWhere();
  }
  /* v5.50 진단 한 줄 더(e3ff835 에서 옮김 · 사용자 261003 갤럭시 Xclipse 940 「여기에서 움직이면 깜빡임」) · 거리 · 카메라 자리와 높이 · 카메라 벽 속 · 숨긴 벽 · 멈칫(이어 그리는 중 50ms 넘은 프레임 수) · 반사 · AA · 해상도 */
  function diagWhere() {
    if (!G.loaded || G.scn !== 'lobby') return '';
    var c = planOf(camera.position), cut = S.cut ? S.cut() : null, off = [];
    if (cut) [['side_s', '남'], ['side_e', '동'], ['side_w', '서'], ['side_n', '북']].forEach(function (q) { if (cut[q[0]] === false) off.push(q[1]); });
    var ci = gi(c[0], c[1]), wallH = ci < 0 ? 0 : hw[ci] * 0.05;
    return '\n거리 ' + G.dist.toFixed(1) + ' · 카메라 ' + c[0].toFixed(1) + ', ' + c[1].toFixed(1) + ', 높이 ' + camera.position.y.toFixed(1) + (wallH > camera.position.y - 0.5 ? ' · 카메라 벽 속' : '') +
      '\n숨긴 벽 ' + (off.length ? off.join('') : '없음') + ' · 멈칫 ' + (G.hitch || 0) + ' · 반사 ' + (S.reflOn && S.reflOn() ? '켬' : '끔') + ' · AA ' + (G.ab.aa ? '켬' : '끔') + ' · 해상도 ' + renderer.getPixelRatio();
  }
  /* v5.50 진단 모드 A/B 단추(진단 상자 아래 · e3ff835 에서 옮김) · 실기기에서 하나씩 끄고 같은 자리를 걸어 깜빡임이 사라지는 쪽을 찾는다
   *   반사 = 바닥 대리석 반사(그릴 때마다 렌더 타깃 한 번 더) · 바로 바뀜 · AA = 안티에일리어싱(MSAA) · 3D 화면을 새로 만들어야 해서 새로 고침 뒤 · 해상도 = 1.75 ↔ 1 · 바로 바뀜
   *   고른 값은 이 기기에 기억하지만 진단 주소(?t3diag=1)로 열었을 때만 쓴다(G.ab) · 일반 주소 = 단추도 없고 늘 기본값(v5.47 원칙) */
  function diagAB() {
    var box = $('fps'); if (!G.diag || $('fpsT')) return;
    box.innerHTML = '<span id="t3-fpsT"></span><span class="ab"><button type="button" data-k="refl"></button><button type="button" data-k="aa"></button><button type="button" data-k="dpr"></button></span>';
    function label() {
      box.querySelector('[data-k=refl]').textContent = '반사 ' + (S.reflOn() ? '끄기' : '켜기');
      box.querySelector('[data-k=aa]').textContent = 'AA ' + (store.get('axfT3AA') === '0' ? '켜기' : '끄기') + (G.ab.aa !== (store.get('axfT3AA') !== '0') ? '(새로 고침)' : '');
      box.querySelector('[data-k=dpr]').textContent = '해상도 ' + (G.ab.dpr1 ? '높이기' : '1로');
    }
    ['pointerdown', 'touchstart', 'mousedown'].forEach(function (ev) { box.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });   /* 단추를 눌러도 아래 3D 화면 톡(걷기)이 되지 않게 */
    box.addEventListener('click', function (e) {
      e.stopPropagation();
      var k = e.target && e.target.getAttribute && e.target.getAttribute('data-k'); if (!k) return;
      if (k === 'refl') { var on = !S.reflOn(); S.refl(on); store.set('axfT3Refl', on ? '1' : '0'); }
      else if (k === 'aa') { store.set('axfT3AA', store.get('axfT3AA') === '0' ? '1' : '0'); toast('새로 고침하면 바뀌어요'); }
      else if (k === 'dpr') { G.ab.dpr1 = !G.ab.dpr1; store.set('axfT3Dpr1', G.ab.dpr1 ? '1' : '0'); renderer.setPixelRatio(G.ab.dpr1 ? 1 : Math.min(window.devicePixelRatio || 1, 1.75)); resize(); }
      label(); G.hitch = 0; G.need = true;
    });
    label();
  }
  function init3D() {
    var cv = $('cv');
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: G.ab.aa, powerPreference: 'high-performance' }); }   /* v5.50 진단 모드에서만 끌 수 있다(G.ab) */
    catch (e) { return false; }
    if (!renderer.getContext()) return false;
    try { var gl0 = renderer.getContext(); G.depthBits = gl0.getParameter(gl0.DEPTH_BITS); if (G.diag) G.gpu = gpuInfo(gl0); } catch (e) {}   /* v5.40 진단 · 깊이 비트(fps 표시에 함께) · v5.44 진단 모드(?t3diag=1)면 GPU 이름 · highp · MSAA */
    renderer.setPixelRatio(G.ab.dpr1 ? 1 : Math.min(window.devicePixelRatio || 1, 1.75)); renderer.setClearColor(0xE9ECEF, 1);
    renderer.toneMapping = T.AgXToneMapping; renderer.toneMappingExposure = 1.0;
    scene = new T.Scene();
    var bc = document.createElement('canvas'); bc.width = 4; bc.height = 256; var bg = bc.getContext('2d'), gr = bg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#FAFBFC'); gr.addColorStop(0.55, '#EEF0F2'); gr.addColorStop(1, '#DADDE1'); bg.fillStyle = gr; bg.fillRect(0, 0, 4, 256);
    scene.background = new T.CanvasTexture(bc); scene.background.colorSpace = T.SRGBColorSpace;
    camera = new T.PerspectiveCamera(58, 1, 0.5, 140);   /* v5.40 near 0.2 → 0.5(실기기 깊이 정밀도 2.5배 · 카메라는 늘 캐릭터 3.8m 뒤 위 · 판 크게 보기도 1.6m 밖) · v5.38 깊이 정밀도(사용자 261003 갤럭시 「안내데스크 자리에서 까만 색이 깜빡」) · near 0.08 → 0.2 · far 300 → 140(스카이뷰 46m 안) */
    scene.add(new T.HemisphereLight(0xFFFFFF, 0xC9CED4, 2.0));
    var dl = new T.DirectionalLight(0xFFFFFF, 1.3); dl.position.set(-8, 20, 12); scene.add(dl);
    S = window.TourScene.build({ T: T, D: D, P: P, N3: N3, renderer: renderer, scene: scene, labelFont: '"Pretendard Variable", Pretendard, sans-serif' });
    if (!G.ab.refl) S.refl(false);   /* v5.50 진단 모드 A/B */
    scene.add(S.lobby); scene.add(S.cafe);
    buildBot(); scene.add(bot);
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); noGl('3D 화면이 끊겼어요 · 새로 고침해 주세요'); });
    G.ok = true;
    return true;
  }

  /* v5.51 웃는 눈 = 위로 볼록한 반달 고리(^ ^ · 도형 · 이모지 아님) · 내 캐릭터 · 스태프가 같은 모양을 쓴다 · 평소에는 숨김 */
  var SMILE_G = null;
  function smileEye(mat, s) { var m = new T.Mesh(SMILE_G || (SMILE_G = new T.TorusGeometry(0.038, 0.012, 6, 14, Math.PI)), mat); m.position.set(s * 0.12, 0.535, 0.31); m.rotation.x = -0.12; m.visible = false; return m; }
  function smileSet(eyes, smiles, on) { (eyes || []).forEach(function (o) { o.visible = !on; }); (smiles || []).forEach(function (o) { o.visible = !!on; }); }
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
    botParts.eyes = []; botParts.smiles = [];
    [-1, 1].forEach(function (s) { var e = new T.Mesh(new T.SphereGeometry(0.046, 12, 10), mInk); e.scale.set(1, 1.15, 0.45); e.position.set(s * 0.12, 0.55, 0.305); body.add(e); botParts.eyes.push(e); var sm = smileEye(mInk, s); body.add(sm); botParts.smiles.push(sm); });
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
  /* v5.73 (운영 261005 캡처 · 고객센터 칸에서 카메라가 벽 너머로 나가 단면 규칙이 벽을 숨김) 카메라 막힘 지도 · 칸(0.1m)마다 높이 0.15m 층 32개(0 ~ 4.8m) 비트 · 기둥 · 천장 · 바닥 제외
   *   걷기 지도와 같은 삼각형 표본에서 찍고 가로 2칸(약 0.2m) · 위 2층 · 아래 3층(0.3 · 0.45m) 넓힌다(카메라 근평면 0.5m 앞 · 반폭 0.14 · 반높이 0.28 이 벽을 자르지 않게) */
  var cocc = null, COCC_H = 0.15;
  function gi(x, z) { var i = Math.floor((x - GX0) / GS), j = Math.floor((z - GZ0) / GS); return (i < 0 || j < 0 || i >= GW || j >= GH) ? -1 : j * GW + i; }
  function underName(o, re) { while (o) { if (o.name && re.test(o.name)) return true; o = o.parent; } return false; }
  function buildGrid(root) {
    var t0 = performance.now(), va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), STEP = 0.07, tris = 0, samples = 0, co0 = new Int32Array(GW * GH);
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
          if (!fadeable) { var hq = Math.min(255, Math.ceil(y / 0.05)); if (hq > hw[c]) hw[c] = hq; var sl = Math.floor(y / COCC_H); if (sl < 32) co0[c] |= 1 << sl; }
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
    cocc = new Int32Array(GW * GH); var co = [];   /* v5.73 카메라 막힘 지도 넓히기 */
    for (var cj = -2; cj <= 2; cj++) for (var ci = -2; ci <= 2; ci++) if (ci * ci + cj * cj <= 5) co.push([ci, cj]);
    for (var j3 = 0; j3 < GH; j3++) for (var i3 = 0; i3 < GW; i3++) {
      var v3 = co0[j3 * GW + i3]; if (!v3) continue; v3 = v3 | (v3 << 1) | (v3 << 2) | (v3 >>> 1) | (v3 >>> 2) | (v3 >>> 3);   /* 위 0.3m · 아래 0.45m(위를 볼 때 근평면 윗귀가 천장 띠에 닿지 않게) */
      for (var q3 = 0; q3 < co.length; q3++) { var a3 = i3 + co[q3][0], b3 = j3 + co[q3][1]; if (a3 >= 0 && b3 >= 0 && a3 < GW && b3 < GH) cocc[b3 * GW + a3] |= v3; }
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
      var dp = doorPull(px, pz, ux, uz); if (dp) { tx = px + dp[0] * s; tz = pz + dp[1] * s; }   /* 261006 방화문 */
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
  /* v5.49 부스 책상 다시 칠하기(사용자 261004 실기기 「이 책상 재질 달라」) · 책상(Hi-Helper · HiDI-Q · LOUNGE 카운터)은 부스 몸체(flat_booth · 무늬 없음)라 색 = 구운 빛뿐인데
   * 굽기 얼룩으로 한 책상만 회색 대리석처럼 얼룩졌다 · 판 줄 앞 0.15~2.1m 안 책상 면 꼭짓점의 라이트맵 자리(uv1)를 한 점으로 모은다
   * 윗면 = 책상 윗면 삼각형 가운데 화소 밝기 상위 15% 자리 · 옆면 = 옆면 삼각형의 같은 자리 · 네 책상이 같은 흰색이 되고 윗면 · 옆면 밝기 차이(모서리)는 남는다 */
  function fixDesks(root) {
    var regs = [];
    D.ZONES.forEach(function (z) { if (z.id !== 'play' && z.id !== 'lounge') return; z.rows.forEach(function (r) { regs.push({ a: r.a, r: r.r, n: r.n, L: r.pages.length }); }); });   /* 책상이 있는 구역 = PLAY(HiDI-Q · Hi-Helper 4개씩) · LOUNGE(카운터 1) */
    function inDesk(x, z) {
      for (var i = 0; i < regs.length; i++) { var R = regs[i], dx = x - R.a[0], dz = z - R.a[1], al = dx * R.r[0] + dz * R.r[1], dp = dx * R.n[0] + dz * R.n[1]; if (al > -0.2 && al < R.L + 0.2 && dp > 0.15 && dp < 2.1) return true; }
      return false;
    }
    var v = new T.Vector3(), nm = new T.Vector3(), done = new Set(), fixed = 0;
    root.traverse(function (o) {
      if (!o.isMesh || Array.isArray(o.material) || !o.material.lightMap || !/^zone_/.test(o.name) || !o.geometry.attributes.uv1 || done.has(o.geometry.attributes.uv1)) return;
      var geo = o.geometry, pos = geo.attributes.position, nrm = geo.attributes.normal, uv = geo.attributes.uv1, idx = geo.index, tx = o.material.lightMap, im = tx.image; if (!nrm || !im || !im.width) return;
      done.add(uv);
      var kind = new Int8Array(pos.count);   /* 1 = 윗면 · 2 = 옆면 · 0 = 손대지 않음 */
      for (var i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); nm.fromBufferAttribute(nrm, i).transformDirection(o.matrixWorld);
        var x = v.x + 16, z = 6 - v.z; if (!inDesk(x, z)) continue;
        if (nm.y > 0.7 && v.y > 0.85 && v.y < 1.15) kind[i] = 1; else if (Math.abs(nm.y) < 0.3 && v.y > -0.01 && v.y < 1.12) kind[i] = 2;
      }
      var W = im.width, H = im.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var cx = cv.getContext('2d', { willReadFrequently: true });
      try { cx.drawImage(im, 0, 0); } catch (e) { return; }
      var px = cx.getImageData(0, 0, W, H).data, fy = tx.flipY, cand = { 1: [], 2: [] }, n = idx ? idx.count : pos.count;
      for (var t = 0; t < n; t += 3) {
        var a = idx ? idx.getX(t) : t, b = idx ? idx.getX(t + 1) : t + 1, c = idx ? idx.getX(t + 2) : t + 2, k = kind[a]; if (!k || kind[b] !== k || kind[c] !== k) continue;
        var u = (uv.getX(a) + uv.getX(b) + uv.getX(c)) / 3, w = (uv.getY(a) + uv.getY(b) + uv.getY(c)) / 3, X = clamp(Math.floor(u * W), 0, W - 1), Y = clamp(Math.floor((fy ? 1 - w : w) * H), 0, H - 1), q = (Y * W + X) * 4;
        cand[k].push({ u: u, w: w, l: px[q] * 0.3 + px[q + 1] * 0.59 + px[q + 2] * 0.11 });
      }
      var pick = {};
      [1, 2].forEach(function (k) { var L = cand[k]; if (!L.length) return; L.sort(function (p1, p2) { return p1.l - p2.l; }); pick[k] = L[Math.min(L.length - 1, Math.floor(L.length * 0.85))]; });
      if (!pick[1] && !pick[2]) return;
      if (!pick[2]) pick[2] = pick[1]; if (!pick[1]) pick[1] = pick[2];
      for (var j = 0; j < pos.count; j++) if (kind[j]) { var pk = pick[kind[j]]; uv.setXY(j, pk.u, pk.w); fixed++; }
      uv.needsUpdate = true;
    });
    G.deskFix = fixed;
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
    /* v5.58 (사용자 261004 「1층 동쪽 회전문도 정문 회전문처럼 · 여기는 구분이 안 된다 · 마치 밖으로 나갈 수 있을 것 같아」) 동쪽 문 D = 정문과 같은 모양 · 재질(유리 원통 · 반사 띠 · 충돌 방지 점선 · 먹색 테 · 기둥 4 · 날개 4 · 안쪽 매트)
     *   옛 v5.40 = 바닥 문턱 원 + 위 띠만 · 막힘(원 + 몸)은 그대로 · 매트 = 안쪽(서쪽) */
    var hd = S.lobby.getObjectByName('side_e') || S.lobby, cd = toThree(32.6, 8.4), gd = revolveDoor(1.25, H, tint, shine, ink, ink2, mat, dtx); gd.name = 'doorD'; gd.position.set(cd.x, 0, cd.z);
    var md = new T.Mesh(new T.PlaneGeometry(2.0, 0.8), mat); md.rotation.x = -Math.PI / 2; md.rotation.z = Math.PI / 2; md.position.set(-(1.25 + 0.5), 0.02, 0); gd.add(md);
    gd.traverse(function (o) { o.userData = { door: true }; }); S.lobby.add(gd); if (hd !== S.lobby) { S.lobby.updateMatrixWorld(true); hd.attach(gd); }
    hideGateGlass();
    buildFireDoor();   /* 261006 고객센터 쪽 엘리베이터 방화문 */
  }
  /* 261006 (사용자 고객센터 영상 · 「방화문을 한 번 열고 들어가야」) 엘리베이터 쪽 방화문 = 연회색 철문 한 짝(경첩 = 북쪽 · 작은 홀 안쪽으로 열림) · 캐릭터가 1.7m 안이면 열리고(0.5초) 멀어지면 닫힌다(0.7초)
   *   걷기 지도 뒤에 만든다(문짝은 막지 않음 · 열린 문짝 자리 = 작은 홀 북쪽 띠를 막음) · 문 구멍 폭 1.15 = 몸(0.32) 둘레를 넣으면 좁은 틈 메우기(openFree)가 막으므로 문 가운데 줄(± 0.1)과 바깥 깔때기를 다시 연다
   *   작은 홀 서쪽 = 엘리베이터 문 · 대고 0.7초 밀면 엘리베이터 안(게이트와 같은 칸 · 1층 단추 = 방화문 앞으로 돌아옴) */
  function buildFireDoor() {
    var host = S.lobby.getObjectByName('side_n') || S.lobby, L = FDW.z1 - FDW.z0 - 0.01, g = new T.Group(); g.name = 'fireDoor';
    g.position.copy(toThree(FDW.x - 0.05, FDW.z1 - 0.005));
    var dm = lam(0xD4D6D3), lv = lam(0xB9BDC1), leaf = new T.Mesh(new T.BoxGeometry(0.045, 2.08, L), dm); leaf.position.set(0, 1.04, L / 2); g.add(leaf);
    [-1, 1].forEach(function (sd) { var h = new T.Mesh(new T.BoxGeometry(0.05, 0.02, 0.13), lv); h.position.set(sd * 0.05, 1.0, L - 0.16); g.add(h); var r = new T.Mesh(new T.BoxGeometry(0.012, 0.06, 0.06), lv); r.position.set(sd * 0.028, 1.0, L - 0.1); g.add(r); });   /* 레버 손잡이(양쪽 · 카드 리더 쪽 끝) */
    g.traverse(function (o) { o.userData = { door: true }; });
    S.lobby.add(g); if (host !== S.lobby) { S.lobby.updateMatrixWorld(true); host.attach(g); }
    FD = { g: g, k: 0, base: g.rotation.y, open: Math.PI / 2 * 0.97 };
    if (G.slotFill == null) openFree(3);
    var zc = (FDW.z0 + FDW.z1) / 2;
    function setRect(x0, x1, z0, z1, v) { for (var x = x0; x <= x1 + 1e-6; x += GS / 2) for (var z = z0; z <= z1 + 1e-6; z += GS / 2) { var c = gi(x, z); if (c >= 0) wd[c] = v; } }
    setRect(VB.x0, EHR.x, 17.5, VB.z1, 1);   /* 열린 문짝 자리 */
    setRect(VB.x0 + 0.32, VB.x1 - 0.3, VB.z0 + 0.32, 17.45, 0);   /* 작은 홀 안 */
    setRect(VB.x1 - 0.35, EHR.x + 0.32, zc - 0.1, zc + 0.1, 0);   /* 문 가운데 줄 */
    for (var x = EHR.x; x <= EHR.x + 0.55; x += GS / 2) { var hw2 = 0.1 + (x - EHR.x) * 0.67; setRect(x, x, zc - hw2, zc + hw2, 0); }   /* 바깥 깔때기 */
  }
  function fireStep(dt) {
    if (!FD) return false;
    var p = planOf(G.pos), zc = (FDW.z0 + FDW.z1) / 2, want = G.scn === 'lobby' && Math.hypot(p[0] - FDW.x, p[1] - zc) < 1.7 ? 1 : 0;
    if (FD.k === want) return false;
    FD.k = want > FD.k ? Math.min(1, FD.k + dt / (RM ? 0.15 : 0.5)) : Math.max(0, FD.k - dt / (RM ? 0.15 : 0.7));
    FD.g.rotation.y = FD.base - FD.open * easeIO(FD.k); FD.g.updateMatrix(); FD.g.updateMatrixWorld(true);
    return true;
  }
  /* 문 가까이에서 동서로 걸으면 문 가운데 줄로 살짝 당긴다(좁은 문에 걸리지 않게) */
  function doorPull(px, pz, ux, uz) {
    var zc = (FDW.z0 + FDW.z1) / 2; if (!FD || px < VB.x1 - 0.6 || px > EHR.x + 1.2 || Math.abs(pz - zc) > 0.75 || Math.abs(ux) < 0.3) return null;
    var nz = uz + clamp((zc - pz) * 2.5, -0.8, 0.8) * Math.abs(ux), L = Math.hypot(ux, nz); return [ux / L, nz / L];
  }
  function stepPushCs(dt, p0, wx, blocked) {   /* 작은 홀 엘리베이터 문(서쪽)에 대고 0.7초 밀면 엘리베이터 안 */
    var on = !!p0 && !G.squeeze && G.scn === 'lobby' && !G.csGo && p0[0] < VB.x0 + 0.6 && p0[1] > VB.z0 && p0[1] < VB.z1 && wx < -0.55 && blocked;
    if (on) { G.cpush = (G.cpush || 0) + dt; if (G.cpush >= PUSH_T) { G.cpush = 0; G.csGo = true; EV.from = 'cs'; setRun(false); if (MOT.on) motGet(EV_ORD[0]).catch(function () {}); toElev(); setTimeout(function () { G.csGo = false; }, 800); } }
    else if (G.cpush) G.cpush = Math.max(0, G.cpush - dt * 2.5);
  }
  /* v5.58 회전문 한 벌(정문 A 와 같은 짜임 · 반지름 R) · 원통 유리 + 반사 + 충돌 방지 점선 + 먹색 위 띠 + 문턱 원 + 세로 기둥 4 + 가운데 기둥 + 날개 4(유리 · 틀 · 아래 틀 · 손잡이 막대) */
  function revolveDoor(R, H, tint, shine, ink, ink2, mat, dtx) {
    var g = new T.Group();
    var drum = new T.Mesh(new T.CylinderGeometry(R + 0.012, R + 0.012, H - 0.06, 48, 1, true), tint); drum.position.y = (H - 0.06) / 2 + 0.03; g.add(drum);
    var gl2 = new T.Mesh(new T.CylinderGeometry(R + 0.016, R + 0.016, H - 0.06, 48, 1, true), shine); gl2.position.y = drum.position.y; g.add(gl2);
    var bt = dtx.clone(); bt.needsUpdate = true; bt.repeat.set(Math.round(56 * R / 1.85), 1);
    var band = new T.Mesh(new T.CylinderGeometry(R + 0.02, R + 0.02, 0.06, 64, 1, true), new T.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false, side: T.DoubleSide })); band.position.y = 1.05; g.add(band);
    var top = new T.Mesh(new T.CylinderGeometry(R + 0.03, R + 0.03, 0.1, 48, 1, true), ink2); top.position.y = H - 0.05; g.add(top);
    var sill = new T.Mesh(new T.RingGeometry(R - 0.06, R + 0.07, 64), mat); sill.rotation.x = -Math.PI / 2; sill.position.y = 0.024; g.add(sill);
    [1, 3, 5, 7].forEach(function (k) { var a = k * Math.PI / 4, st = new T.Mesh(new T.BoxGeometry(0.07, H, 0.07), ink); st.position.set(Math.sin(a) * (R + 0.01), H / 2, Math.cos(a) * (R + 0.01)); g.add(st); });
    var post = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, H, 16), ink); post.position.y = H / 2; g.add(post);
    for (var k = 0; k < 4; k++) {
      var w = new T.Group(); w.rotation.y = Math.PI / 4 + k * Math.PI / 2; g.add(w);
      var L = R - 0.1, pane = new T.Mesh(new T.PlaneGeometry(L, H - 0.2), tint); pane.rotation.y = Math.PI / 2; pane.position.set(0, H / 2, L / 2 + 0.05); w.add(pane);
      var stile = new T.Mesh(new T.BoxGeometry(0.05, H - 0.1, 0.05), ink); stile.position.set(0, H / 2, L + 0.03); w.add(stile);
      var rail = new T.Mesh(new T.BoxGeometry(0.04, 0.05, L), ink); rail.position.set(0, 0.06, L / 2 + 0.05); w.add(rail);
      var bar = new T.Mesh(new T.BoxGeometry(0.1, 0.035, L * 0.55), ink); bar.position.set(0, 1.0, L * 0.6); w.add(bar);
    }
    return g;
  }
  /* v5.58 (사용자 261004 「게이트에 유리문 자체가 닫힌 이미지가 없도록 · 거기로 지나갈 수 있나? 라는 호기심」) 스피드 게이트 닫힌 유리 플랩(모형 props_glass · 로비 쪽 z 11.91 · 북쪽 z 19.25) = 숨김
   *   걷기 지도(buildGrid)가 플랩을 이미 막힘으로 찍은 뒤라 충돌 · 비집기 연출(v5.56)은 그대로 · 누름(tap)은 숨긴 것을 지나친다 */
  function hideGateGlass() { var o = S.lobby.getObjectByName('props_glass'); if (o) o.visible = false; G.gateGlass = o ? 'hidden' : 'none'; }


  /* ═══════════ v5.58 판 · 포스터 참 색(사용자 261004 「ME to WE 포스터의 색감이 찐 색감이 아닌 것 같아 · 찐 색감으로 해줘」) ═══════════
   * 원인(실측) = 판 재질(panel_N)이 구운 빛(라이트맵 x 3.0π)을 곱하고 화면 톤매핑(AgX)이 채도를 눌렀다 · 3D 포스터 주황 (190, 120, 79) · 원본 그림 (245, 123, 32)
   *   텍스처 색공간은 sRGB 로 맞음 · 원본 그림은 .ai 46쪽 전체(자른 캡처 아님) · 포스터 GLB 그림은 363 x 512 로 작다
   * 고침 = 판 재질 전부(판 39장 + 간판 · 배너 · 포스터)를 빛 · 톤매핑 없이 그림 색 그대로(MeshBasic · 라이트맵 없음 · toneMapped false) · 판 4~7 검정 패널도 원본 #010101 그대로
   *   포스터(46) = 홍보부 디지털 원본 색(design.md Vibrant Orange #FF7E31 · 블랙 스테이지 #000000)으로 채널 곡선을 맞춘 그림 d/p46t.webp(724 x 1024 · 판 보기 d/c/p46.webp 와 같은 곡선 · scratchpad gen_poster.py) */
  function trueColors(root) {
    var seen = {}, n = 0;
    root.traverse(function (o) {
      if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
      var m = o.material; if (!/^panel_\d+$/.test(m.name || '') || seen[m.uuid]) return; seen[m.uuid] = 1; n++;
      m.lightMap = null; m.toneMapped = false; if (m.map) m.map.colorSpace = T.SRGBColorSpace; m.needsUpdate = true;
      if (m.name === 'panel_46') posterTex(m);
    });
    G.trueN = n;
  }
  function posterTex(m) {
    new T.TextureLoader().load(BASE + 'd/p46t.webp?v=' + LABVER, function (t) {
      t.flipY = false; t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.ClampToEdgeWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      S.lobby.traverse(function (o) { if (o.isMesh && o.material && o.material.name === 'panel_46') { o.material.map = t; o.material.needsUpdate = true; } });   /* 기둥 비우기가 복제한 재질까지 */
      G.posterHi = t.image ? [t.image.width, t.image.height] : null; G.need = true;
    });
  }
  /* 옛 포토부스 기계(판 36 앞 · 모형 zone_event_body_2 안 · 도면 x 1.5~2.03 · z 8.0~8.75 · 높이 1.85) = 지운다 · 바닥 매트 · 판 · 판 틀은 그대로(세 점이 모두 상자 안인 삼각형만) */
  function cutKiosk() {
    var n = 0;
    S.lobby.updateMatrixWorld(true);
    S.lobby.traverse(function (o) {
      if (!o.isMesh || !/^zone_event_body/.test(o.name)) return;
      n += regionCut(o, null, null, function (tri) { return tri.every(function (V) { return V.p[0] > 1.3 && V.p[0] < 2.3 && V.p[1] > 7.8 && V.p[1] < 8.9; }); });
    });
    var mt = S.lobby.getObjectByName('zone_event_body_2'), u1 = mt && attrAt(mt, 'uv1', 1.9, 7.55, 0.027);   /* 기계 밑 바닥 매트 = 구운 빛이 까맣다(기계 그늘) · 옆 매트 한 점의 빛으로 다시 칠한다 */
    if (u1) G.kioskRelit = regionCut(mt, { x0: 1.3, x1: 2.3, z0: 7.8, z1: 8.9 }, u1);
    G.kioskCut = n;
  }

  /* ═══════════ v5.58 AX 포토부스(사용자 261004 「포토부스에는 ME to WE 광고가 아니라 같이 찍은 포토 사진 · 나랑 비슷하게 생긴 챗봇들이 단체 사진(웃으면서) · 사진은 벽체 쪽에서 찍는 거야」 · 「3칸의 가운데에 기계가 있어야」) ═══════════
   * 부스 = 판 3칸(34 · 35 「AX Festival 2026」 + 36 「AI 포토부스」 · 부스 발주 설명 PDF 10쪽 EVENT 02 · 서쪽 벽) · 판이 사진 배경
   * 기계 = 가운데 칸(판 35 · 도면 z 7.35) 앞 3.0m(도면 x 3.6) · 벽(배경)을 봄 · 렌즈 · 앞 화면 = 벽 쪽 · 뒤 화면(로비 쪽) = 방금 찍힌 사진(흰 인화지 + 「AX Festival 2026」)
   * 피사체 = 벽 앞 친구 4명(내 캐릭터와 같은 모양 · 주황 사다리 안에서 색만 조금씩 · 파랑 스태프 없음) · 가끔 다 같이 통통 + 눈웃음 → 찰칵(렌즈 위 흰 빛 · 화면 하얗게) → 새 사진
   * 사진 = 기계 렌즈 자리의 보조 카메라가 그 순간 한 장만 그린다(렌더 투 텍스처 320 x 240 · 층 5 = 친구 · 배경 판 · 부스 틀 · 바닥 매트만) · 기계가 보일 때만 · 5.5초에 한 번 · 움직임 줄이기 = 처음 한 장 그대로
   * 걷기 = 친구들 자리(판 앞 띠) · 기계는 막힘 · 기계 뒤(로비 쪽)에서 사진을 본다 */
  var PB = { g: null, bots: [], cam: null, rt: null, at: [3.6, 7.35], next: 0, t0: -9e9, shot: false, n: 0, flash: null, white: [], sphere: null, nrm: null };
  var PB_FR = [[1.4, 6.55, 0xFFC56E, 0xFF7F32, 0xE5671E], [1.05, 7.1, 0xFFE0B8, 0xF2935A, 0xD9622B], [1.05, 7.62, 0xFFB98A, 0xE5671E, 0xC45318], [1.4, 8.17, 0xFFD9A0, 0xFF9450, 0xE5671E]];
  var PB_MS = 5500;
  function pbCard() {   /* 인화지 = 흰 판 + 아래 「AX Festival 2026」(주황 · 행사명 표기 그대로) */
    var c = document.createElement('canvas'); c.width = 256; c.height = 236; var g = c.getContext('2d');
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 256, 236);
    g.fillStyle = '#FF7F32'; g.font = '800 22px "Pretendard Variable", Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AX Festival 2026', 128, 214);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function buildPhoto() {
    var K = PB.at, g = new T.Group(); g.name = 'photoKiosk'; g.position.copy(toThree(K[0], K[1])); g.rotation.y = -Math.PI / 2;   /* 앞(로컬 +z) = 서쪽(벽) */
    var shell = lam(0xF2F0EC), trim = lam(0xD9D5CF), dark = new T.MeshBasicMaterial({ color: 0x14171C, toneMapped: false });
    var col = new T.Mesh(new T.BoxGeometry(0.56, 1.0, 0.36), shell); col.position.y = 0.5; g.add(col);
    var head = new T.Mesh(new T.BoxGeometry(0.62, 0.86, 0.14), shell); head.position.y = 1.43; g.add(head);
    var foot = new T.Mesh(new T.BoxGeometry(0.66, 0.04, 0.46), trim); foot.position.y = 0.02; g.add(foot);
    /* 렌즈 · 플래시(앞) */
    var lens = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.03, 20), lam(0x2B3036)); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.78, 0.08); g.add(lens);
    var fl = new T.Mesh(new T.PlaneGeometry(0.2, 0.05), new T.MeshBasicMaterial({ color: 0xFFFFFF, toneMapped: false })); fl.position.set(0, 1.83 + 0.01, 0.071); g.add(fl);
    var fs = new T.Sprite(new T.SpriteMaterial({ map: blkMats().glow, color: 0xFFFFFF, transparent: true, depthWrite: false, opacity: 0, toneMapped: false })); fs.scale.set(0.9, 0.9, 1); fs.position.set(0, 1.8, 0.2); g.add(fs); PB.flash = fs;
    /* 사진 = 렌더 타깃 한 장(층 5) */
    PB.rt = new T.WebGLRenderTarget(320, 240, { depthBuffer: true }); PB.rt.texture.generateMipmaps = false; PB.rt.texture.minFilter = T.LinearFilter;
    var pm = new T.MeshBasicMaterial({ color: 0x14171C, toneMapped: false });
    function screen(z, ry) {   /* 화면(검정) · 인화지 · 사진 · 하얀 덮개(찰칵) */
      var s0 = new T.Mesh(new T.PlaneGeometry(0.52, 0.72), dark); s0.position.set(0, 1.43, z); s0.rotation.y = ry; g.add(s0);
      var dz = ry ? -1 : 1;
      var card = new T.Mesh(new T.PlaneGeometry(0.46, 0.424), new T.MeshBasicMaterial({ map: pbCard(), toneMapped: false })); card.position.set(0, 1.44, z + dz * 0.002); card.rotation.y = ry; g.add(card);
      var ph = new T.Mesh(new T.PlaneGeometry(0.42, 0.315), pm); ph.position.set(0, 1.49, z + dz * 0.004); ph.rotation.y = ry; g.add(ph);
      var wh = new T.Mesh(new T.PlaneGeometry(0.52, 0.72), new T.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); wh.position.set(0, 1.43, z + dz * 0.006); wh.rotation.y = ry; wh.visible = false; g.add(wh); PB.white.push(wh);
    }
    screen(0.072, 0); screen(-0.072, Math.PI);
    PB.photoMat = pm;
    g.traverse(function (o) { o.userData = { zone: 'event' }; });
    S.lobby.add(g); PB.g = g;
    blockRect(K[0] - 0.24, K[0] + 0.24, K[1] - 0.34, K[1] + 0.34);
    /* 친구들 · 벽을 등지고 기계를 봄 */
    PB_FR.forEach(function (f, i) {
      var m = makeCritter(f[2], f[3], f[4]); m.position.copy(toThree(f[0], f[1])); m.rotation.y = Math.PI / 2 + (f[1] - K[1]) * -0.12; m.name = 'photoFriend';
      S.lobby.add(m); PB.bots.push({ m: m, ph: i * 1.7, h0: m.rotation.y });
    });
    blockRect(0.6, 1.75, 6.15, 8.55);   /* 사진 자리(판 앞 띠) · 친구들과 겹치지 않게 */
    var rg = new T.Mesh(new T.RingGeometry(0.36, 0.5, 40), new T.MeshBasicMaterial({ color: 0xFF7F32, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false }));   /* v5.84 찍는 자리 바닥 원 */
    rg.rotation.x = -Math.PI / 2; var rp = toThree(PH_SLOT[0], PH_SLOT[1]); rg.position.set(rp.x, 0.012, rp.z); rg.renderOrder = 2; rg.raycast = function () {}; rg.name = 'photoSpot'; S.lobby.add(rg); PB.ring = rg;
    /* 보조 카메라 · 렌즈 자리에서 벽 쪽 */
    PB.cam = new T.PerspectiveCamera(40, 4 / 3, 0.2, 12);
    var lp = toThree(K[0] - 0.12, K[1]); PB.cam.position.set(lp.x, 1.62, lp.z); var lt = toThree(0.9, K[1]); PB.cam.lookAt(lt.x, 0.8, lt.z); PB.cam.layers.set(5);
    var L5 = function (o) { o.traverse(function (q) { q.layers.enable(5); }); };
    PB.bots.forEach(function (b) { L5(b.m); });
    S.lobby.traverse(function (o) { if (o.isMesh && (/^panel_(33|34|35|36)$/.test(o.material && o.material.name) || /^zone_event_body_2/.test(o.name))) o.layers.enable(5); });
    scene.children.forEach(function (o) { if (o.isLight) o.layers.enable(5); });
    var fm = new T.Mesh(new T.PlaneGeometry(3.2, 3.8), lam(0xB9B4AE)); fm.rotation.x = -Math.PI / 2; var fc = toThree(1.7, K[1]); fm.position.set(fc.x, 0.004, fc.z); fm.layers.set(5); S.lobby.add(fm);   /* 사진 속 바닥(층 5 만 · 로비 화면에는 없음) */
    g.updateMatrixWorld(true);
    PB.sphere = new T.Sphere(new T.Vector3().setFromMatrixPosition(g.matrixWorld).setY(1.2), 1.6); PB.nrm = new T.Vector3(1, 0, 0);
  }
  function pbShoot() {
    var prev = renderer.getRenderTarget();
    renderer.setRenderTarget(PB.rt); renderer.clear(); renderer.render(scene, PB.cam); renderer.setRenderTarget(prev);
    if (PB.photoMat.map !== PB.rt.texture) { PB.photoMat.map = PB.rt.texture; PB.photoMat.color.set(0xFFFFFF); PB.photoMat.needsUpdate = true; }
    PB.n++;
  }
  function pbStep(now) {
    if (!PB.g || G.scn !== 'lobby') return false;
    if (PH.on) { PB.on = true; return true; }   /* v5.67 사진 찍기 연출 동안 = 친구들은 phBot 이 움직인다 */
    camera.updateMatrixWorld(); _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    var on = camera.position.distanceTo(PB.sphere.center) < 18 && _fr.intersectsSphere(PB.sphere);
    PB.on = on;
    if (!on) return false;
    if (now < PH.keep) return false;   /* v5.67 방금 찍은 내 사진을 기계 화면에 잠시 둔다(그동안 저절로 찍기 쉼) */
    if (RM) { if (!PB.n) { PB.bots.forEach(function (b) { smileSet(b.m.userData.eyes, b.m.userData.smiles, true); }); pbShoot(); PB.bots.forEach(function (b) { smileSet(b.m.userData.eyes, b.m.userData.smiles, false); }); return true; } return false; }
    if (now >= PB.next) { PB.next = now + PB_MS; PB.t0 = now; PB.shot = false; }
    var t = now - PB.t0, pose = t >= 0 && t < 1500, hop = t >= 0 && t < 700;
    PB.bots.forEach(function (b, i) {
      var body = b.m.userData.body, hk = (t - i * 70) / 380;
      body.position.y = hop && hk > 0 && hk < 1 ? Math.sin(hk * Math.PI) * 0.12 : 0;
      body.rotation.z = Math.sin(G.clock * 1.3 + b.ph) * 0.04;
      smileSet(b.m.userData.eyes, b.m.userData.smiles, pose);
    });
    if (!PB.shot && t >= 560) { PB.shot = true; pbShoot(); }
    var fk = (t - 560) / 260, fo = fk > 0 && fk < 1 ? 1 - fk : 0;
    PB.flash.material.opacity = fo; PB.white.forEach(function (w) { w.visible = fo > 0; w.material.opacity = fo * 0.95; });
    return true;
  }

  /* ═══════════ v5.67 포토부스 「사진 찍기」(사용자 261005 갤럭시 캡처 · 「이 근처에 오면 사진 찍기 버튼이 활성화되고 캐릭터가 이 친구들 사이에 들어가서 사진을 찍고 그 사진이 잠시 팝업(폴라로이드 사진. 2026.10.26 AX festival 문구) 같이 뜨게 해줘 / 밑에 안내 메시지로 동료들과 추억을 남기세요 라는 문구가 남기자」) ═══════════
   * 단추 = 기계(도면 3.6, 7.35) 2.3m 안(한 번 뜨면 2.6m 까지 유지) · 「자세히 보기」와 같은 알약 문법(주황 동그라미 + 카메라 도형 + 「사진 찍기」) · 기계 위에 뜬다 · 이 근처에서는 자세히 보기보다 먼저(lookPick 이 비킨다)
   * 누르면 = 조작 잠금 → 친구들이 양옆으로 비켜 가운데 자리를 낸다 · 내 캐릭터가 기계를 돌아 그 자리로 걸어 들어가 기계(렌즈) 쪽을 본다 → 다 같이 통통 + 눈웃음 → 작은 3 · 2 · 1 → 찰칵(흰 빛 · 셔터 소리는 소리 켬일 때만)
   *   → 사진 한 장(보조 카메라 · 층 5 · 이번에는 내 캐릭터도 층 5 · 렌더 투 텍스처 한 번 · 960 x 720 을 반으로 줄여 480 x 360 · 저사양 640 x 480 → 320 x 240) → 폴라로이드 팝업(약 3.8초 · 톡 하면 바로 닫힘)
   *   팝업이 떠 있는 동안 뒤에서 친구들은 제자리로 · 내 캐릭터는 줄 앞(도면 2.35, 7.35)으로 한 걸음 나온다 → 닫히면 그 자리에서 바로 조작
   * 기계 앞 · 뒤 화면 = 방금 사진(45초 · 그동안 기계의 저절로 찍기는 쉰다) · 저장 · 공유 · 스탬프 없음
   * 움직임 줄이기 = 걷기 · 통통 · 3 · 2 · 1 없이 바로 그 자리에서 찰칵 → 팝업(떨어지는 움직임 없음) */
  var PH = { on: false, near: false, ph: '', t0: 0, pt: 0, path: null, pi: 0, keep: 0, rt: null, cam: null, tex: null, cv: null, n: 0, popT: 0, still: 0, popped: false, cnt: 0, log: [], snd: 0 };
  /* v5.84 (사용자 261006 「사진 찍기 버튼이 좀 더 명확하게 · 지금은 사람들이 눌러 볼 생각을 안 한다」 · 자동으로 데려가지 않음)
   *   단추 = 기계 3m 안(한 번 뜨면 3.3m 까지) · 포토부스가 가장 가까운 자리일 때만(룰렛 · 타자왕 자리에서는 없음) · 화면 아래 가운데 주 버튼(O100 면 · onBrand 글 · 카메라 · 높이 52)
   *   처음 뜰 때 통통 두 번 → 은은한 숨 쉬는 빛(::after · opacity · transform 만) · 움직임 줄이기 = 정지 · 찍는 자리(PH_SLOT) 바닥 = 주황 원(가까이 오면 은은하게 숨 쉼)
   *   말풍선 = 「여기서 같이 사진 찍어요」(이번 방문 1번 · 그 근처 스태프 말풍선 대신) · 누른 뒤 걸어 들어가 통통 · 찰칵 흐름은 그대로 */
  var PH_R = 3.0, PH_R2 = 3.3, PH_SAY = '여기서 같이 사진 찍어요';
  var PH_OLD_R = 2.3, PH_OLD_R2 = 2.6, PH_SLOT = [1.0, 7.35], PH_OUT = [2.7, 6.45], PH_V = 2.4, PH_POP = 3800, PH_CAM = [6.2, 6.3, 3.6];   /* 끝 자리 = 기계 옆(들어온 쪽 · 기계 뒤 카메라에서 가려지지 않게) */
  var PH_FR = [[1.6, 6.2], [1.13, 6.7], [1.13, 8.0], [1.6, 8.5]];   /* 사진 찍을 때 친구 자리 · 가운데(z 7.35)를 비운 활 모양 · 몸 지름 0.64 보다 넓게 */
  function phNear() {
    if (!PB.g || !G.loaded || G.scn !== 'lobby' || G.anim || G.sheetOpen || G.mapMode || G.bigMap || SH || G.squeeze || PH.on || EV.seq) return false;
    var p = planOf(G.pos), d = Math.hypot(p[0] - PB.at[0], p[1] - PB.at[1]);
    if (d >= (PH.near ? PH_R2 : PH_R)) return false;
    return !STOPS.some(function (s) { return s.spot && Math.hypot(s.x - p[0], s.z - p[1]) < d; });   /* 룰렛 · 타자왕 자리가 더 가까우면 그쪽 */
  }
  function placeShot(now) {
    var b = $('shot'); if (!b) return;
    var n = phNear(); PH.near = n;
    phRing(n, now);
    if (!n) { if (!b.hidden) b.hidden = true; PH.still = 0; PH.popped = false; return; }
    var c0 = toThree(PB.at[0], PB.at[1]); _ib.set(c0.x, 1.25, c0.z).project(camera);
    if (!(_ib.z < 1 && Math.abs(_ib.x) < 0.95 && Math.abs(_ib.y) < 0.95)) { if (!b.hidden) b.hidden = true; PH.near = false; PH.popped = false; return; }   /* 기계가 화면에 보일 때만(등지고 있으면 없음) */
    if (b.hidden) {
      b.hidden = false; b.classList.add('pri'); b.classList.remove('walk', 'on3d'); var st0 = b.style; st0.left = st0.top = st0.right = st0.bottom = st0.transform = '';
      var sr = $('stage').getBoundingClientRect(), jl = Math.min($('bJump').getBoundingClientRect().left, $('bRun').getBoundingClientRect().left) - sr.left;   /* 가운데 · 단 점프(위로 뜬 때) · 달리기 단추와 12px 띄움(빛 테 포함) */
      st0.left = Math.round(Math.max(b.offsetWidth / 2 + 12, Math.min(sr.width / 2, jl - 20 - b.offsetWidth / 2))) + 'px';
    }
    if (!PH.popped && !RM) { PH.popped = true; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }   /* v5.84 처음 뜰 때 통통 두 번 */
    return;
    var walk = G.moveV > 0.2 || G.mode === 'auto' || !!G.air;   /* 옛 v5.67 기계 위에 뜨는 알약(아래는 쓰지 않음 · 되돌리기용) */
    if (walk) PH.still = 0; else if (!PH.still) PH.still = now;
    var calm = !walk && now - PH.still > 250;
    var W = $('stage').clientWidth, H = $('stage').clientHeight, bw = b.offsetWidth || 150, bh = b.offsetHeight || 48, c = toThree(PB.at[0], PB.at[1]), st = b.style;
    var pt = _ia.set(c.x, 1.25, c.z).project(camera), hd = _ib.set(G.pos.x, 1.0, G.pos.z).project(camera);
    var x = (pt.x + 1) / 2 * W, y = (1 - pt.y) / 2 * H, hx = (hd.x + 1) / 2 * W, hy = (1 - hd.y) / 2 * H;
    if (Math.abs(x - hx) < bw / 2 + 40 && Math.abs(y - hy) < bh / 2 + 70) { pt = _ia.set(c.x, 2.05, c.z).project(camera); y = (1 - pt.y) / 2 * H; }   /* 캐릭터 머리와 겹치면 기계 위로 */
    var ctlT = H - (parseFloat(getComputedStyle($('stage')).getPropertyValue('--lookB')) || 214) + 4;
    _ib.set(c.x, 1.25, c.z).project(camera);
    if (!(_ib.z < 1 && Math.abs(_ib.x) < 0.95 && Math.abs(_ib.y) < 0.95)) { if (!b.hidden) b.hidden = true; PH.near = false; PH.popped = false; return; }   /* 기계가 화면에 보일 때만(등지고 있으면 없음 · 옆 타자왕 부스에서 뜨지 않게) */
    if (b.hidden) b.hidden = false;
    b.classList.toggle('walk', !calm);
    if (calm && !PH.popped && !RM) { PH.popped = true; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    x = clamp(x, bw / 2 + 12, W - bw / 2 - 12); y = clamp(y, 80 + bh / 2, ctlT - bh / 2);
    st.right = 'auto'; st.bottom = 'auto'; st.left = '0px'; st.top = '0px'; st.transform = 'translate(' + (x - bw / 2).toFixed(1) + 'px,' + (y - bh / 2).toFixed(1) + 'px)'; b.classList.add('on3d');
  }
  /* v5.84 찍는 자리 바닥 주황 원 · 늘 옅게 · 가까이 오면 숨 쉼(그때만 다시 그림) · 움직임 줄이기 = 정지 */
  function phRing(n, now) {
    var r = PB.ring; if (!r) return;
    var a = PH.on ? 0 : n ? (RM ? 0.55 : 0.42 + 0.2 * Math.sin(now / 420)) : 0.22;
    if (Math.abs(r.material.opacity - a) > 0.004) { r.material.opacity = a; G.need = true; }
    if (n && !RM && !PH.on) G.need = true;
  }
  function doShot() {
    if (performance.now() - (G.guardT || 0) < 500) return;
    if (PH.on || !phNear() || $('shot').hidden) return;
    phStart();
  }
  function phLog(ph) { if (PH.log.length < 40) PH.log.push({ ph: ph, t: Math.round(performance.now() - PH.t0), at: planOf(G.pos).map(function (q) { return +q.toFixed(2); }) }); }
  function phStart() {
    var now = performance.now();
    PH.on = true; PH.t0 = now; PH.pt = now; PH.near = false; PH.log = []; PH.smile = false; PH.h0 = G.h; ROOTEL.classList.add('ph'); $('shot').hidden = true; $('look').hidden = true; lookFrame(null);
    setRun(false); G.runKey = false; G.stick = null; G.path = null; G.goal = null; G.mode = 'free'; $('dest').hidden = true; G.air = false; G.jy = 0; G.landT = 0; G.push = 0; G.pushK = 0; tiltHome(true); HOLD = null;
    var p = planOf(G.pos), K = PB.at, sz = p[1] < K[1] ? 6.42 : 8.28, pts = [p]; PH.side = p[1] < K[1] ? -1 : 1;
    if (p[0] > 3.0) { if (Math.abs(p[1] - K[1]) < 0.95) pts.push([Math.max(p[0], 4.25), sz]); pts.push([K[0], sz]); }   /* 기계(도면 x 3.36 ~ 3.84 · z 7.01 ~ 7.69) 동쪽이면 옆으로 돌아서 */
    pts.push([2.25, K[1]]); pts.push(PH_SLOT);
    PH.path = pts; PH.pi = 1; phLog('start');
    if (RM) { G.pos.copy(toThree(PH_SLOT[0], PH_SLOT[1])); G.h = G.face = Math.PI / 2; phFriends(1); phSmile(true); phPose(0, 0, 0); phShoot(); phPop(now); return; }
    PH.ph = 'walk'; G.need = true;
  }
  function phFriends(k) {   /* 0 = 원래 자리 · 1 = 사진 자리 */
    PB.bots.forEach(function (b, i) { var a = PB_FR[i], q = PH_FR[i]; b.m.position.copy(toThree(a[0] + (q[0] - a[0]) * k, a[1] + (q[1] - a[1]) * k)); });
  }
  function phSmile(on) { smileSet(botParts.eyes, botParts.smiles, on); PB.bots.forEach(function (b) { smileSet(b.m.userData.eyes, b.m.userData.smiles, on); }); }
  function phPose(walkW, hop, dt) {   /* 내 캐릭터 몸(걷기 통통 · 기울임 · 발 · 다 같이 통통) */
    if (walkW) G.walkT += dt * 11;
    var s = Math.sin(G.walkT), w = RM ? 0 : walkW, BP = botParts.body;
    bot.position.copy(G.pos); bot.position.y = 0; bot.rotation.y = G.h; BP.scale.set(1, 1, 1);
    BP.position.y = Math.abs(s) * 0.045 * w + hop; BP.rotation.z = s * 0.07 * w; BP.rotation.x = 0.06 * w;
    botParts.feet[0].position.z = 0.04 + s * 0.09 * w; botParts.feet[1].position.z = 0.04 - s * 0.09 * w; botParts.feet[0].position.y = botParts.feet[1].position.y = 0.035;
    shadow.position.y = 0.02 / bot.scale.y; shadow.scale.set(1, 1, 1); G.moveV = w;
  }
  function phWalk(dt) {   /* PH.path 를 따라 걷는다(연출 길 · 막힘 판정 없음) · 끝에 닿으면 true */
    var p = planOf(G.pos), q = PH.path[PH.pi], dx = q[0] - p[0], dz = q[1] - p[1], d = Math.hypot(dx, dz), st = PH_V * dt;
    if (d > 1e-4) G.face = Math.atan2(dx, -dz);
    if (d <= st) { G.pos.copy(toThree(q[0], q[1])); PH.pi++; } else G.pos.copy(toThree(p[0] + dx / d * st, p[1] + dz / d * st));
    var dh = Math.atan2(Math.sin(G.face - G.h), Math.cos(G.face - G.h)); G.h = Math.abs(dh) < 0.012 ? G.face : G.h + dh * (1 - Math.exp(-dt * 20));
    return PH.pi >= PH.path.length;
  }
  function phEase(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }
  /* stepBot 대신(PH.on 동안) · 단계 = walk → turn → hop → (찰칵 · v5.79 3 · 2 · 1 없음) → wait → pop → back(팝업 뒤에서 제자리로) */
  function phBot(dt, now) {
    var e = now - PH.pt, hopY = 0, walkW = 0;
    if (PH.ph === 'walk') {
      phFriends(phEase((now - PH.t0) / 600));
      walkW = 1; if (phWalk(dt)) { PH.ph = 'turn'; PH.pt = now; G.face = Math.PI / 2; phLog('turn'); }
    } else if (PH.ph === 'turn') {
      phFriends(1); G.h = angLerp(G.h, Math.PI / 2, 1 - Math.exp(-dt * 14));
      if (e > 320) { G.h = G.face = Math.PI / 2; PH.ph = 'hop'; PH.pt = now; phLog('hop'); }   /* v5.73 (사용자 261005 「자리에 끼자마자 웃지말고 사진 찍을 때 쯤 웃는게」) 자리 잡을 때 = 평소 얼굴 · 통통 한 번 */
    } else if (PH.ph === 'hop') {
      var hk = e / 380; hopY = hk > 0 && hk < 1 ? Math.sin(hk * Math.PI) * 0.12 : 0;
      PB.bots.forEach(function (b, i) { var k = (e - (i + 1) * 70) / 380; b.m.userData.body.position.y = k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.12 : 0; });
      if (e > 660) { PB.bots.forEach(function (b) { b.m.userData.body.position.y = 0; }); PH.smile = true; phSmile(true); phLog('smile'); phShoot(); PH.ph = 'wait'; PH.pt = now; phLog('shot'); }   /* v5.79 (사용자 261006 「3 · 2 · 1 카운트 없이 바로 찍힌다」) 다 같이 통통 내려앉는 순간 = 눈웃음 + 찰칵(흰 빛) · 옛 3 · 2 · 1(0.56초씩) 없앰 */
    } else if (PH.ph === 'wait') {
      var fk = (now - (PH.flashT || 0)) / 260, fo = fk > 0 && fk < 1 ? 1 - fk : 0; PB.flash.material.opacity = fo; PB.white.forEach(function (w) { w.visible = fo > 0; w.material.opacity = fo * 0.95; });
      if (e > 380) phPop(now);
    } else if (PH.ph === 'pop' || PH.ph === 'back') {
      PB.flash.material.opacity = 0; PB.white.forEach(function (w) { w.visible = false; });
      var bk = phEase((now - PH.popT - 350) / 650);   /* 팝업 뒤에서 · 친구 제자리 · 내 캐릭터 한 걸음 앞으로 */
      if (!RM) phFriends(1 - bk);
      if (PH.ph === 'pop' && now - PH.popT > 350) { PH.ph = 'back'; phSmile(false); var o = phOut(); PH.path = [planOf(G.pos), [1.9, PB.at[1]], o]; PH.pi = 1; }
      if (PH.ph === 'back' && PH.pi < PH.path.length) { walkW = 1; phWalk(dt); }
      else if (PH.ph === 'back') { G.h = angLerp(G.h, Math.PI / 2, 1 - Math.exp(-dt * 14)); G.face = Math.PI / 2; }
      if (PH.ph === 'back' && PH.pi >= PH.path.length && (bk >= 1 || RM) && $('pola').hidden) phEnd();
    }
    if (PH.on) phPose(walkW, hopY, dt);
    return true;
  }
  function phShoot() {
    var lite = MUS.lite || (G.probeResult && G.probeResult.p50 > 34), RW = lite ? 640 : 960, RH = lite ? 480 : 720;
    if (!PH.rt || PH.rt.width !== RW) { if (PH.rt) PH.rt.dispose(); PH.rt = new T.WebGLRenderTarget(RW, RH, { depthBuffer: true }); PH.rt.texture.generateMipmaps = false; }
    if (!PH.cam) {   /* 사진 카메라 = 렌즈 뒤(도면 4.5 · 높이 1.45) · 층 5 에 기계는 없어 가리지 않는다 · 시야 48도(다섯이 다 들어옴) */
      PH.cam = new T.PerspectiveCamera(48, 4 / 3, 0.2, 14); var cp = toThree(4.5, PB.at[1]), lt = toThree(1.2, PB.at[1]);
      PH.cam.position.set(cp.x, 1.45, cp.z); PH.cam.lookAt(lt.x, 0.62, lt.z); PH.cam.layers.set(5);
      PH.lut = new Uint8Array(256); for (var i = 0; i < 256; i++) { var v = i / 255; PH.lut[i] = Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); }   /* 렌더 타깃 = 선형 · 화면 · 폴라로이드 = sRGB */
    }
    var t0 = performance.now();
    bot.traverse(function (o) { o.layers.enable(5); });
    var prev = renderer.getRenderTarget(); renderer.setRenderTarget(PH.rt); renderer.clear(); renderer.render(scene, PH.cam); renderer.setRenderTarget(prev);
    bot.traverse(function (o) { o.layers.disable(5); });
    var buf = new Uint8Array(RW * RH * 4); renderer.readRenderTargetPixels(PH.rt, 0, 0, RW, RH, buf);
    var L = PH.lut; for (var j = 0; j < buf.length; j += 4) { buf[j] = L[buf[j]]; buf[j + 1] = L[buf[j + 1]]; buf[j + 2] = L[buf[j + 2]]; buf[j + 3] = 255; }
    var big = document.createElement('canvas'); big.width = RW; big.height = RH; var bg = big.getContext('2d'), id = bg.createImageData(RW, RH), row = RW * 4;
    for (var y = 0; y < RH; y++) id.data.set(buf.subarray((RH - 1 - y) * row, (RH - y) * row), y * row);   /* 아래 → 위 뒤집기 */
    bg.putImageData(id, 0, 0);
    var cv = PH.cv || (PH.cv = document.createElement('canvas')); cv.width = RW / 2; cv.height = RH / 2; var cg = cv.getContext('2d'); cg.imageSmoothingQuality = 'high'; cg.drawImage(big, 0, 0, RW / 2, RH / 2);   /* 반으로 줄여 계단 무늬를 덜어낸다 */
    if (!PH.tex) { PH.tex = new T.CanvasTexture(cv); PH.tex.colorSpace = T.SRGBColorSpace; PH.tex.generateMipmaps = false; PH.tex.minFilter = T.LinearFilter; } else PH.tex.needsUpdate = true;
    PB.photoMat.map = PH.tex; PB.photoMat.color.set(0xFFFFFF); PB.photoMat.needsUpdate = true; PH.keep = performance.now() + 45000;   /* 기계 화면 = 방금 사진 */
    var pc = $('polaC'); if (pc) { pc.width = cv.width; pc.height = cv.height; pc.getContext('2d').drawImage(cv, 0, 0); }
    PH.n++; PH.ms = Math.round(performance.now() - t0); PH.size = [RW, RH];
    PH.snd = phShutter() ? 1 : 0;
    if (!RM) { PH.flashT = performance.now(); PB.flash.material.opacity = 1; PB.white.forEach(function (w) { w.visible = true; w.material.opacity = 0.95; }); var f = $('pflash'); if (f) { f.hidden = false; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); setTimeout(function () { f.hidden = true; }, 420); } }
    G.need = true;
  }
  function phShutter() {   /* 찰칵 · 걸러낸 잡음 두 번(0.075초 간격) · 소리 켬 + 오디오가 돌 때만 */
    var c = MUS.ctx; if (!(musOn() && MUS.want && c && c.state === 'running' && !document.hidden)) return false;
    try {
      var t = c.currentTime + 0.01, out = c.createGain(); out.gain.value = 0.32; out.connect(c.destination);
      if (PH.nbc !== c) { var n = Math.floor(c.sampleRate * 0.08), bf = c.createBuffer(1, n, c.sampleRate), d = bf.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; PH.nb = bf; PH.nbc = c; }
      [[0, 0.9, 3200], [0.075, 0.6, 2100]].forEach(function (q) {
        var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = PH.nb; f.type = 'bandpass'; f.frequency.value = q[2]; f.Q.value = 0.9;
        g.gain.setValueAtTime(0.0001, t + q[0]); g.gain.exponentialRampToValueAtTime(q[1], t + q[0] + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + q[0] + 0.06);
        s.connect(f); f.connect(g); g.connect(out); s.start(t + q[0]); s.stop(t + q[0] + 0.08);
      });
      return true;
    } catch (e) { return false; }
  }
  function phPop(now) {
    PH.ph = 'pop'; PH.popT = now; phLog('pop');
    var el = $('pola'); el.hidden = false; el.classList.remove('out'); clearTimeout(PH.popTm); PH.popTm = setTimeout(phClose, PH_POP);
    if (RM) { phFriends(0); phSmile(false); var o = phOut(); G.pos.copy(toThree(o[0], o[1])); G.h = G.face = Math.PI / 2; phPose(0, 0, 0); PH.ph = 'back'; PH.path = [o]; PH.pi = 1; }
    G.need = true;
  }
  function phClose() {
    clearTimeout(PH.popTm); var el = $('pola'); if (!el || el.hidden) return;
    if (RM) el.hidden = true; else { el.classList.add('out'); setTimeout(function () { el.hidden = true; el.classList.remove('out'); G.need = true; }, 200); }
    phLog('close'); G.need = true;
  }
  function phEnd() {
    ROOTEL.classList.remove('ph'); if (PH.h0 != null) { G.face = PH.h0; PH.h0 = null; }   /* 끝 = 처음 보던 쪽으로 돌아선다(조작이 이어지게) */
    PH.on = false; PH.ph = ''; G.mode = 'free'; G.path = null; G.moveV = 0; phLog('end'); nearestStop(); updateUi(true); G.need = true; G.last = 0;
  }
  function phAbort() {   /* 둘러보기를 닫을 때 · 연출 중이면 걷는 곳으로 */
    clearTimeout(PH.popTm); var el = $('pola'); if (el) { el.hidden = true; el.classList.remove('out'); }
    if (!PH.on) return;
    phFriends(0); phSmile(false); PB.bots.forEach(function (b) { b.m.userData.body.position.y = 0; }); PB.flash.material.opacity = 0; PB.white.forEach(function (w) { w.visible = false; });
    var o = phOut(); G.pos.copy(toThree(o[0], o[1])); G.h = G.face = Math.PI / 2; phPose(0, 0, 0); phEnd();
  }
  function phOut() { var z = PH.side > 0 ? 2 * PB.at[1] - PH_OUT[1] : PH_OUT[1]; return nearestFree(PH_OUT[0], z) || [PH_OUT[0], z]; }   /* 들어온 쪽(기계 북 · 남) */
  function phCamWant() {   /* 연출 동안 화면 카메라 = 기계 비스듬히 뒤 위(도면 6.2, 6.3 · 높이 3.6)에서 벽 쪽 단체 · 기계는 오른쪽 옆으로 비켜 가운데 자리를 가리지 않는다 · 세로 화면에서도 다섯이 다 들어온다 */
    var c = toThree(PH_CAM[0], PH_CAM[1]), l = toThree(1.15, PB.at[1]);
    return { pos: new T.Vector3(c.x, PH_CAM[2], c.z), look: new T.Vector3(l.x, 0.6, l.z) };
  }

  /* ═══════════ v5.58 AX in Action 인터뷰 화면(사용자 261004 「AX IN ACTION 모니터에서는 나 같은 애들의 인터뷰 영상이 · 인터뷰 같은 걸 하는 듯한 영상」) ═══════════
   * TV(판 15 앞 · 도면 x 22.7~23.9) = 홍보부 모션 대신 인터뷰 · 화면 가운데 나 닮은 챗봇 한 명(통통 · 몸 흔들림 · 말하는 박자로 눈 깜빡 · 머리 위 전파) · 아래 자막 띠(뜻 없는 회색 막대 · 실명 · 지어낸 사례 없음) · 왼쪽 위 「● INTERVIEW」
   * 말 한 마디 1.6~2.6초 + 쉼 0.5초 · 세 마디마다 다른 친구(주황 · 노랑 · 분홍 · 웜그레이 · 파랑 없음) · 자막 막대 길이가 마디마다 바뀐다
   * 그림 = 따로 세운 작은 무대(장면 하나 · 친구 1 · 배경 판 · 앞 글자 판)를 보조 카메라로 렌더 투 텍스처(320 x 180) · 화면이 보일 때만 초당 12장 · 움직임 줄이기 = 한 장 */
  var IV = { scn: null, cam: null, rt: null, bot: null, k: 0, ph: null, last: 0, sub: null, subTex: null, waves: [] };
  var IV_COL = [[0xFFC56E, 0xFF7F32, 0xE5671E], [0xFFE08A, 0xC98A00, 0xA06E00], [0xF6C1CF, 0xB4466A, 0x8E3653], [0xE9DFD3, 0x8C7B6B, 0x6B5E52]];
  function ivBack() {   /* 배경 = 따뜻한 짙은 회색 + 옅은 점 격자 + 뒤 주황 번짐 둘 */
    var c = document.createElement('canvas'); c.width = 320; c.height = 180; var g = c.getContext('2d');
    g.fillStyle = '#2A2623'; g.fillRect(0, 0, 320, 180);
    [[250, 50, 70, 'rgba(255,127,50,.35)'], [60, 140, 55, 'rgba(255,178,132,.18)']].forEach(function (q) { var r = g.createRadialGradient(q[0], q[1], 2, q[0], q[1], q[2]); r.addColorStop(0, q[3]); r.addColorStop(1, 'rgba(255,127,50,0)'); g.fillStyle = r; g.fillRect(0, 0, 320, 180); });
    g.fillStyle = 'rgba(255,255,255,.07)'; for (var y = 6; y < 180; y += 10) for (var x = 6; x < 320; x += 10) g.fillRect(x, y, 1.2, 1.2);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function ivSub(widths) {   /* 앞 글자 판 = 왼쪽 위 「● INTERVIEW」 + 아래 자막 띠(회색 막대) · 막대 길이만 마디마다 바뀐다 */
    var c = IV.sub || (IV.sub = document.createElement('canvas')); c.width = 320; c.height = 180; var g = c.getContext('2d'); g.clearRect(0, 0, 320, 180);
    g.fillStyle = 'rgba(20,23,28,.72)'; g.fillRect(10, 10, 92, 20); g.fillStyle = '#FF7F32'; g.beginPath(); g.arc(21, 20, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFFFFF'; g.font = '800 11px "Pretendard Variable", Pretendard, sans-serif'; g.textBaseline = 'middle'; g.fillText('INTERVIEW', 30, 20.5);
    g.fillStyle = 'rgba(20,23,28,.66)'; g.fillRect(0, 136, 320, 44);
    (widths || []).forEach(function (w, i) { g.fillStyle = i ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.85)'; var x0 = 160 - w / 2, y0 = 146 + i * 13; g.beginPath(); if (g.roundRect) g.roundRect(x0, y0, w, 7, 3.5); else g.rect(x0, y0, w, 7); g.fill(); });
    if (IV.subTex) IV.subTex.needsUpdate = true;
  }
  function ivWho(k) {   /* k 번째 친구로 바꿈(같은 모양 · 색만) */
    if (IV.bot) IV.scn.remove(IV.bot);
    var c = IV_COL[k % IV_COL.length], m = makeCritter(c[0], c[1], c[2]); m.position.set(0, 0, 0); IV.scn.add(m); IV.bot = m;
    IV.waves.forEach(function (w) { m.userData.body.add(w); });
  }
  function ivAdd(mesh) {
    IV.scn = new T.Scene();
    IV.scn.add(new T.HemisphereLight(0xFFFFFF, 0xC9CED4, 2.0)); var dl = new T.DirectionalLight(0xFFFFFF, 1.3); dl.position.set(-1.5, 3, 4); IV.scn.add(dl);
    var bk = new T.Mesh(new T.PlaneGeometry(4.8, 2.7), new T.MeshBasicMaterial({ map: ivBack(), toneMapped: false })); bk.position.set(0, 0.6, -1.4); IV.scn.add(bk);
    IV.cam = new T.PerspectiveCamera(30, 16 / 9, 0.1, 10); IV.cam.position.set(0, 0.62, 1.9); IV.cam.lookAt(0, 0.5, 0); IV.scn.add(IV.cam);
    ivSub([150, 96]); IV.subTex = new T.CanvasTexture(IV.sub); IV.subTex.colorSpace = T.SRGBColorSpace;
    var hh = 2 * Math.tan(15 * Math.PI / 180) * 0.3, hud = new T.Mesh(new T.PlaneGeometry(hh * 16 / 9, hh), new T.MeshBasicMaterial({ map: IV.subTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    hud.position.set(0, 0, -0.3); hud.renderOrder = 9; IV.cam.add(hud);
    IV.waves = [0, 1, 2].map(function () { var sp = new T.Sprite(new T.SpriteMaterial({ map: arcTex(), transparent: true, depthWrite: false, opacity: 0 })); sp.position.y = 1.0; sp.scale.set(0.3, 0.3, 1); return sp; });
    ivWho(0);
    IV.rt = new T.WebGLRenderTarget(320, 180, { depthBuffer: true }); IV.rt.texture.generateMipmaps = false; IV.rt.texture.minFilter = T.LinearFilter;
    mesh.material.map = IV.rt.texture; mesh.material.color.set(0xFFFFFF); mesh.material.polygonOffset = true; mesh.material.polygonOffsetFactor = -2; mesh.material.polygonOffsetUnits = -4; mesh.material.needsUpdate = true;
    mesh.updateWorldMatrix(true, false);
    var c = new T.Vector3().setFromMatrixPosition(mesh.matrixWorld), n = new T.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld);
    var v = { mesh: mesh, kind: 'iv', iv: true, c: c, n: n, sphere: new T.Sphere(c, 0.9), i: TVS.length, on: false, drawn: 0, w: +(mesh.geometry.parameters.width || 0).toFixed(2), h: +(mesh.geometry.parameters.height || 0).toFixed(2) };
    TVS.push(v); IV.ph = { t0: 0, dur: 0, n: 0 }; return v;
  }
  function ivStep(v, now, still) {
    if (!still && now - IV.last < 83) return false;   /* 초당 12장 */
    IV.last = now;
    var P = IV.ph, t = now - P.t0;
    if (still) { ivSub([150, 96]); }
    else if (t > P.dur + 500) {   /* 다음 마디 */
      P.n++; P.t0 = now; P.dur = 1600 + Math.random() * 1000; t = 0;
      if (P.n % 3 === 0) { IV.k++; ivWho(IV.k); }
      ivSub([110 + Math.random() * 120, Math.random() < 0.6 ? 60 + Math.random() * 110 : 0].filter(function (w) { return w > 0; }));
    }
    var talk = !still && t < P.dur, s = talk ? Math.abs(Math.sin(t / 1000 * Math.PI * 4.6)) : 0, u = IV.bot.userData, body = u.body;
    body.rotation.z = still ? 0 : Math.sin(now / 1000 * 1.6) * 0.05; body.rotation.y = still ? 0 : Math.sin(now / 1000 * 0.7) * 0.12; body.position.y = talk ? s * 0.018 : 0;
    u.eyes.forEach(function (e) { e.scale.y = 1.15 * (talk && s > 0.82 ? 0.35 : 1); });
    var wf = talk ? 1 : 0.15, tt = (now / 1000 / 0.9) % 1;
    IV.waves.forEach(function (sp, i) { var q = (tt * 0.9 - i * 0.16) / 0.62, o = q >= 0 && q <= 1; sp.material.opacity = still ? (i === 1 ? 0.7 : 0) : (o ? (1 - q) * wf : 0); var sc = 0.24 + (o ? q : 0) * 0.6; sp.scale.set(sc, sc, 1); sp.position.y = 1.0 + (o ? q : 0) * 0.12; });
    var prev = renderer.getRenderTarget(); renderer.setRenderTarget(IV.rt); renderer.clear(); renderer.render(IV.scn, IV.cam); renderer.setRenderTarget(prev);
    v.drawn++; return true;
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
  /* v5.64 (사용자 261005 「로비에서 보면 살짝 튀어나온 부분이 있고(2미터) 그 뒤에 1미터 정도 고객센터를 바라봤을 때 왼쪽(건물 바깥과 반대)으로 들어가 있어」 · 사용자 확인 필요)
   *   서쪽 벽(코어 동쪽 면) = 로비 쪽 2m(z 11.46 ~ 13.46)는 x 28.2 그대로 · 그 뒤(z 13.46 ~ 19.4 · 계단 · 엘리베이터 문)는 서쪽으로 1m 들어간 x 27.2 · 꺾이는 곳에 북쪽을 보는 짧은 벽 */
  var EHR = { z: 13.46, x: 27.2 };
  /* 261006 (사용자 고객센터 영상 · 1층 전경/20261006_082245.mp4 · 동쪽 여닫이문으로 들어와 고객센터 앞까지 갔다가 로비로) 들어간 벽 북쪽 끝 = 흰 칠 벽(바닥 ~ 2.9m) · 북서 모서리 대리석 기둥 덩어리(동쪽 면 x 27.95)
   *   흰 벽에 연회색 철문 두 짝 · 남 = 계단(z 15.6 ~ 16.5) · 북 = 엘리베이터 쪽 방화문(FDW · 폭 1.15 · 경첩 = 북쪽 · 다가가면 열림) · 그 안 = 엘리베이터 문 하나 있는 작은 홀(VB) */
  var WS = { z0: 15.55, z1: 18.3, h: 2.9, px: 27.95 }, FDW = { x: 27.2, z0: 16.75, z1: 17.9 }, VB = { x0: 25.5, x1: 27.1, z0: 16.55, z1: 18.3 }, FD = null;
  var WW = { x1: 6.825, w: 1.8, z: 12.5, t: 0.12, h: 2.7 };   /* v5.58 높이 2.4 → 2.7(현장 사진 · 벽감 천장 띠 아래 = 가벽 높이 · 위는 루버 띠) */   /* 가벽 · 폭 = 사용자 표시(약 2.4m)보다 좁힘 · 2.4m 면 미팅룸 앞 복도(폭 3.2m)가 막혀 날개로 못 들어간다 */
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
    var tx = signTex(txt, len, 0.22, { bar: '#FF7F32' }), side = lam(0xD9DDE2), face = new T.MeshBasicMaterial({ map: tx });
    return boxAt(len, 0.22, 0.035, [side, side, side, side, face, face], x0 + len / 2, z, y);
  }

  /* v5.73 모형 메시에서 도면 z0 ~ z1 띠 · x -0.02 ~ 3.62(미팅룸 칸) 안 꼭짓점만 도면 z 로 dz 만큼 옮긴다 · 옮긴 꼭짓점 수 */
  function movePart(o, z0, z1, dz) {
    if (!o || !o.geometry) return 0;
    o.updateMatrixWorld(true); var pa = o.geometry.attributes.position, m = o.matrixWorld, inv = m.clone().invert(), v = new T.Vector3(), n = 0;
    for (var i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m); var x = v.x + 16, z = 6 - v.z; if (z > z0 && z < z1 && x > -0.02 && x < 3.62) { v.z -= dz; v.applyMatrix4(inv); pa.setXYZ(i, v.x, v.y, v.z); n++; } }
    if (n) { pa.needsUpdate = true; o.geometry.computeBoundingSphere(); o.geometry.computeBoundingBox(); }
    return n;
  }
  function remodel() {
    trueColors(S.lobby); cutKiosk();   /* v5.58 판 · 포스터 참 색 · 포토부스 옛 기계(판 36 앞) 지움 */
    var t0 = performance.now(), R = { eh: 0, floor: 0, wing: 0 }, sideN = S.lobby.getObjectByName('side_n'), sideE = S.lobby.getObjectByName('side_e') || S.lobby;
    S.lobby.updateMatrixWorld(true);
    /* ── ① 동쪽 빈 공간 ── 자르기 전에 대리석 결 · 빛을 옆 벽에서 읽어 둔다 */
    var marble = S.lobby.getObjectByName('side_n_wall_1'), floor = S.lobby.getObjectByName('floor'), led = S.lobby.getObjectByName('side_n_led');
    if (sideN && marble && floor) {
      var uA = attrAt(marble, 'uv', 20.5, EH.z0, 1.0), uB = attrAt(marble, 'uv', 21.5, EH.z0, 1.0), uC = attrAt(marble, 'uv', 20.5, EH.z0, 2.0), l1 = attrAt(marble, 'uv1', 30.4, EH.z0, 2.2), f1 = attrAt(floor, 'uv1', 30.4, 9.9, 0);
      var dux = uA && uB ? [uB[0] - uA[0], uB[1] - uA[1]] : [0.38, 0], duy = uA && uC ? [uC[0] - uA[0], uC[1] - uA[1]] : [0, 0.77];
      sideN.traverse(function (o) { if (o.isMesh) R.eh += regionCut(o, { x0: EH.x0, x1: EH.x1 + 0.2, z0: EH.z0 - 0.08, z1: EH.z1 }, null); });
      sideN.traverse(function (o) { if (o.isMesh) R.eh += regionCut(o, { x0: EHR.x, x1: EH.x0 + 0.01, z0: EHR.z, z1: EH.z1 }, null); });   /* v5.64 들어간 칸 */
      R.uv1 = [f1, l1];
      var eh = new T.Group(); eh.name = 'eastHall'; eh.userData = { eastHall: true };
      /* 바닥 · 모형 바닥은 코어 밑에 없다(바깥 포장만) · 로비 바닥과 같은 재질 · 결(uv)은 로비 바닥에서 이어 · 빛은 로비 바닥 한 점(문 E 앞) */
      var fA = attrAt(floor, 'uv', 30.4, 9.9, 0), fB = attrAt(floor, 'uv', 31.4, 9.9, 0), fC = attrAt(floor, 'uv', 30.4, 10.9, 0);
      if (fA && fB && fC) {
        var FQ = { pos: [], uv: [], idx: [] };
        var fuv = function (p) { var dx = p[0] - 30.4, dz = p[1] - 9.9; return [fA[0] + (fB[0] - fA[0]) * dx + (fC[0] - fA[0]) * dz, fA[1] + (fB[1] - fA[1]) * dx + (fC[1] - fA[1]) * dz]; };
        quadInto(FQ, [EH.x0, EH.z0, 0], [EH.x1, EH.z0, 0], [EH.x0, EH.z1, 0], [0, 0, 1], fuv);
        quadInto(FQ, [EHR.x, EHR.z, 0], [EH.x0, EHR.z, 0], [EHR.x, EH.z1, 0], [0, 0, 1], fuv);   /* v5.64 들어간 칸 바닥 */
        var fm = quadMesh(FQ, floor.material, f1 || [0, 0]); fm.name = 'eh_floor'; S.lobby.add(fm); R.floor = 1; R.fq = { uv: fuv };   /* 261006 작은 홀 바닥도 같은 결 */
      }
      /* 서쪽 벽(대리석 · 동쪽을 봄) · v5.64 로비 쪽 2m 튀어나온 면 · 꺾인 벽 · 1m 들어간 벽
       * 261006 (사용자 고객센터 영상) 들어간 벽 = 대리석 + 북쪽 끝 가까이 흰 칠 벽(2.9m · 그 위 대리석) · 연회색 철문 두 짝(남 계단 · 북 엘리베이터 쪽 방화문) · 사이 카드 리더 둘 · 북서 기둥 덩어리 + 세움 안내 화면
       *   옛(v5.64) = 대리석 벽에 짙은 계단 문 + 은색 엘리베이터 문이 바로 붙음 · 사용자 261006 「엘리베이터 표지판은 맞지만 방화문을 한 번 열고 들어가야」 */
      var Wm = { pos: [], uv: [], idx: [] }, Jm = { pos: [], idx: [] }, Wh = { pos: [], idx: [] }, dep = 0.1, DOOR = { st: { s0: 15.6, s1: 16.5, h: 2.1 }, ev: { s0: FDW.z0, s1: FDW.z1, h: 2.1 } };
      wallQuads(Wm, Jm, 'x', EH.x0, EH.z0, EHR.z, 0, EH.top, [1, 0, 0], [], dep);                     /* v5.64 로비 쪽 2m(튀어나온 면) */
      quadInto(Wm, [EHR.x, EHR.z, 0], [EH.x0, EHR.z, 0], [EHR.x, EHR.z, EH.top], [0, 1, 0]);          /* v5.64 꺾인 벽(북쪽을 봄 · 고객센터 쪽) */
      wallQuads(Wm, null, 'x', EHR.x, EHR.z, WS.z0, 0, EH.top, [1, 0, 0], [], dep);                    /* 261006 들어간 벽 · 대리석 */
      wallQuads(Wm, null, 'x', EHR.x, WS.z0, WS.z1, WS.h, EH.top, [1, 0, 0], [], dep);                 /* 흰 칠 벽 위 대리석 */
      quadInto(Wm, [WS.px, WS.z1, 0], [WS.px, EH.z1, 0], [WS.px, WS.z1, EH.top], [1, 0, 0]);           /* 북서 기둥 덩어리 동쪽 면 */
      quadInto(Wm, [EHR.x, WS.z1, 0], [WS.px, WS.z1, 0], [EHR.x, WS.z1, EH.top], [0, -1, 0]);          /* 기둥 덩어리 남쪽 면 */
      wallQuads(Wh, Jm, 'x', EHR.x, WS.z0, WS.z1, 0, WS.h, [1, 0, 0], [DOOR.st, DOOR.ev], dep);       /* 흰 칠 벽 · 두 문 구멍 + 문틀 */
      var Wuv = function (p) { var s = Math.abs(p[0] - EH.x0) < 0.01 ? p[1] - EH.z0 : Math.abs(p[1] - EHR.z) < 0.01 && p[0] > EHR.x + 0.01 ? EHR.z - EH.z0 + (EH.x0 - p[0]) : Math.abs(p[1] - WS.z1) < 0.01 && p[0] > EHR.x + 0.01 ? WS.z1 - EH.z0 + (EH.x0 - EHR.x) + (p[0] - EHR.x) : p[1] - EH.z0 + (EH.x0 - EHR.x), y = p[2] - 1.0; return [(uA ? uA[0] : 0) + dux[0] * s + duy[0] * y, (uA ? uA[1] : 0) + dux[1] * s + duy[1] * y]; };   /* v5.64 결 = 벽을 따라 이어 붙임 · 261006 기둥 덩어리 남쪽 면도 */
      Wm.uv = []; for (var q = 0; q < Wm.pos.length / 3; q++) { var px = Wm.pos[q * 3] + 16, pz = 6 - Wm.pos[q * 3 + 2], py = Wm.pos[q * 3 + 1]; Wm.uv.push.apply(Wm.uv, Wuv([px, pz, py])); }
      var wm = quadMesh(Wm, marble.material, l1 || [0, 0]); wm.name = 'eh_wall'; eh.add(wm);
      /* 방화문 안 작은 홀 · 벽 = 대리석(안쪽을 봄) · 들어간 벽 뒷면 = 흰 칠(문 구멍) · 위는 열림(로비 모형과 같은 단면) */
      var Vm = { pos: [], uv: [], idx: [] };
      quadInto(Vm, [VB.x0, VB.z0, 0], [VB.x0, VB.z1, 0], [VB.x0, VB.z0, EH.top], [1, 0, 0]);    /* 서쪽 벽(엘리베이터 문) */
      quadInto(Vm, [VB.x0, VB.z0, 0], [VB.x1, VB.z0, 0], [VB.x0, VB.z0, EH.top], [0, 1, 0]);    /* 남쪽 벽(북쪽을 봄) */
      quadInto(Vm, [VB.x0, VB.z1, 0], [VB.x1, VB.z1, 0], [VB.x0, VB.z1, EH.top], [0, -1, 0]);   /* 북쪽 벽(남쪽을 봄) */
      wallQuads(Vm, null, 'x', VB.x1, VB.z0, VB.z1, WS.h, EH.top, [-1, 0, 0], [], 0);             /* 들어간 벽 뒷면 위(대리석) */
      wallQuads(Wh, null, 'x', VB.x1, VB.z0, VB.z1, 0, WS.h, [-1, 0, 0], [DOOR.ev], 0);            /* 들어간 벽 뒷면(흰 칠 · 서쪽을 봄 · 방화문 구멍) */
      Vm.uv = []; for (var q2 = 0; q2 < Vm.pos.length / 3; q2++) { var vx = Vm.pos[q2 * 3] + 16, vz = 6 - Vm.pos[q2 * 3 + 2], vy = Vm.pos[q2 * 3 + 1] - 1.0, vs = vx + vz; Vm.uv.push((uA ? uA[0] : 0) + dux[0] * vs + duy[0] * vy, (uA ? uA[1] : 0) + dux[1] * vs + duy[1] * vy); }
      var vm = quadMesh(Vm, marble.material, l1 || [0, 0]); vm.name = 'eh_vest'; eh.add(vm);
      var whm = quadMesh(Wh, lam(0xF2F0EB)); whm.name = 'eh_white'; eh.add(whm);
      var band = { pos: [], idx: [] }; quadInto(band, [EH.x0, EH.z0, EH.top], [EH.x0, EHR.z, EH.top], [EH.x0, EH.z0, EH.H], [1, 0, 0]);
      quadInto(band, [EHR.x, EHR.z, EH.top], [EH.x0, EHR.z, EH.top], [EHR.x, EHR.z, EH.H], [0, 1, 0]); quadInto(band, [EHR.x, EHR.z, EH.top], [EHR.x, WS.z1, EH.top], [EHR.x, EHR.z, EH.H], [1, 0, 0]);   /* v5.64 꺾인 벽 · 들어간 벽 위 띠 */
      quadInto(band, [WS.px, WS.z1, EH.top], [WS.px, EH.z1, EH.top], [WS.px, WS.z1, EH.H], [1, 0, 0]); quadInto(band, [EHR.x, WS.z1, EH.top], [WS.px, WS.z1, EH.top], [EHR.x, WS.z1, EH.H], [0, -1, 0]);   /* 261006 기둥 덩어리 위 띠 */
      var bandM = quadMesh(band, lam(0xE7E4DF)); bandM.name = 'eh_band'; eh.add(bandM);
      var jm = quadMesh(Jm, lam(0x8B9096)); jm.name = 'eh_jamb'; eh.add(jm);
      /* 벽 밑 · 위 간접등 띠(코어 앞면과 같은 재질 · 벽에서 3cm 튀어나온 상자) · 261006 밑 띠는 대리석 구간만(흰 칠 벽 앞 없음) */
      if (led) [0.02, 4.58].forEach(function (ly) {   /* v5.64 꺾인 벽을 따라 세 토막 */
        eh.add(boxAt(0.03, 0.02, EHR.z - EH.z0, led.material, EH.x0 + 0.015, (EH.z0 + EHR.z) / 2, ly));
        eh.add(boxAt(EH.x0 - EHR.x, 0.02, 0.03, led.material, (EHR.x + EH.x0) / 2, EHR.z + 0.015, ly));
        var z9 = ly < 1 ? WS.z0 : WS.z1; eh.add(boxAt(0.03, 0.02, z9 - EHR.z, led.material, EHR.x + 0.015, (EHR.z + z9) / 2, ly));
        eh.add(boxAt(0.03, 0.02, EH.z1 - WS.z1, led.material, WS.px + 0.015, (WS.z1 + EH.z1) / 2, ly));
      });
      /* 계단 문 = 연회색 철문(구멍 안쪽 · 문틀 사이) · 레버 손잡이(북쪽 끝 · 카드 리더 쪽) · 두 문 사이 카드 리더 둘 · 엘리베이터 쪽 방화문 짝은 걷기 지도 뒤에 따로(buildFireDoor · 열고 닫힘) */
      var dx = EHR.x - dep, sd = DOOR.st, ev = DOOR.ev, dm = lam(0xD4D6D3), lv = lam(0xB9BDC1);   /* v5.64 문 = 들어간 벽 */
      eh.add(boxAt(0.045, sd.h - 0.02, sd.s1 - sd.s0 - 0.01, dm, EHR.x - 0.05, (sd.s0 + sd.s1) / 2, (sd.h - 0.02) / 2));
      eh.add(boxAt(0.05, 0.02, 0.13, lv, EHR.x + 0.0, sd.s1 - 0.16, 1.0)); eh.add(boxAt(0.012, 0.06, 0.06, lv, EHR.x - 0.022, sd.s1 - 0.1, 1.0));
      [1.36, 1.17].forEach(function (y) { eh.add(boxAt(0.02, 0.11, 0.07, lam(0xE4E6E8), EHR.x + 0.01, (sd.s1 + ev.s0) / 2, y)); eh.add(boxAt(0.006, 0.03, 0.045, lam(0x2A2E33), EHR.x + 0.022, (sd.s1 + ev.s0) / 2, y + 0.02)); });
      eh.add(bladeSign('계단', EHR.x + 0.01, (sd.s0 + sd.s1) / 2, 2.55, 0.62));
      eh.add(bladeSign('엘리베이터', EHR.x + 0.01, (ev.s0 + ev.s1) / 2, 2.62, 0.9));
      /* 작은 홀 바닥(로비 바닥 재질 · 결 이어 · 방화문 문턱까지) · 서쪽 벽 엘리베이터 문(은색 두 짝 · 가운데 틈 · 문틀 · 호출 버튼) */
      if (R.fq) { var FV = { pos: [], uv: [], idx: [] }; quadInto(FV, [VB.x0, VB.z0, 0], [EHR.x, VB.z0, 0], [VB.x0, VB.z1, 0], [0, 0, 1], R.fq.uv); var fvm = quadMesh(FV, floor.material, f1 || [0, 0]); fvm.name = 'eh_vfloor'; S.lobby.add(fvm); }
      var vdz = (VB.z0 + VB.z1) / 2, vdw = 1.0, evm = lam(0xB4B8BC), evf = lam(0x8B9096);
      [-1, 1].forEach(function (sg) { eh.add(boxAt(0.03, 2.2, vdw / 2 - 0.004, evm, VB.x0 + 0.015, vdz + sg * (vdw / 4 + 0.002), 1.1)); eh.add(boxAt(0.05, 2.3, 0.06, evf, VB.x0 + 0.025, vdz + sg * (vdw / 2 + 0.03), 1.15)); });
      eh.add(boxAt(0.05, 0.06, vdw, evf, VB.x0 + 0.025, vdz, 2.23)); eh.add(boxAt(0.02, 0.2, 0.08, lam(0x3A3F45), VB.x0 + 0.01, vdz - vdw / 2 - 0.3, 1.15));
      /* 북서 기둥 덩어리 앞 세움 안내 화면(검은 몸 · 화면 = 짙은 바탕 + 주황 띠 · 상표 없음 · 로비 쪽을 비스듬히 봄) */
      var kc = document.createElement('canvas'); kc.width = 120; kc.height = 216; var kg = kc.getContext('2d'), kgr = kg.createLinearGradient(0, 0, 0, 216); kgr.addColorStop(0, '#3A3D42'); kgr.addColorStop(1, '#17191C'); kg.fillStyle = kgr; kg.fillRect(0, 0, 120, 216);
      kg.fillStyle = 'rgba(255,126,49,.85)'; kg.fillRect(18, 150, 84, 10); kg.fillStyle = 'rgba(255,255,255,.35)'; kg.fillRect(18, 170, 60, 5); kg.fillRect(18, 182, 44, 5);
      var ktx = new T.CanvasTexture(kc); ktx.colorSpace = T.SRGBColorSpace; var kio = new T.Group(); kio.name = 'eh_kiosk'; kio.position.copy(toThree(28.45, 18.85)); kio.rotation.y = 0.5;
      var kb = new T.Mesh(new T.BoxGeometry(0.56, 1.78, 0.1), lam(0x1E2125)); kb.position.y = 0.98; kio.add(kb); var kf = new T.Mesh(new T.BoxGeometry(0.62, 0.06, 0.42), lam(0x1E2125)); kf.position.y = 0.03; kio.add(kf);
      var ks = new T.Mesh(new T.PlaneGeometry(0.48, 0.86), new T.MeshBasicMaterial({ map: ktx })); ks.position.set(0, 1.28, 0.051); kio.add(ks); eh.add(kio);
      /* 북쪽 = 고객센터 앞 유리벽(영상 · 바닥 ~ 2.9m 유리 · 1.0 ~ 1.7m 반투명 띠 · 양개 유리문 · 세로 손잡이 · 은색 세로 틀) · 그 위 밝은 벽 · 유리 뒤 = 밝은 대기석(소파 둘) · 옛 = 밝은 벽에 양개 유리문 하나
       *   v5.64 (사용자 261005 「고객센터 재질은 유리문이야」) · 유리 판끼리 2cm 띄움(같은 면 겹침 없음) */
      var Nm = { pos: [], idx: [] }, Nj = { pos: [], idx: [] }, nd = { s0: 29.6, s1: 31.0, h: 2.4 };
      wallQuads(Nm, Nj, 'z', EH.z1, WS.px, EH.x1, WS.h, EH.H, [0, -1, 0], [], dep);   /* 유리 위 벽 */
      var nm = quadMesh(Nm, lam(0xE7E4DF)); nm.name = 'eh_north'; eh.add(nm);
      var nz = EH.z1 + 0.02, ndw = nd.s1 - nd.s0, gw = EH.x1 - WS.px, frost = new T.MeshBasicMaterial({ color: 0xDCE6EA, transparent: true, opacity: 0.32, depthWrite: false, side: T.DoubleSide }), frame = lam(0x3A3F45), alu = lam(0xB9BEC3);
      var clr = new T.MeshBasicMaterial({ color: 0xDCE6EA, transparent: true, opacity: 0.14, depthWrite: false, side: T.DoubleSide }), fb = new T.MeshBasicMaterial({ color: 0xF4F5F6, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide });
      var ccIn = new T.Mesh(new T.BoxGeometry(gw - 0.04, WS.h, 0.7), new T.MeshBasicMaterial({ color: 0xF4F2EE, side: T.BackSide, toneMapped: false })); ccIn.position.set(WS.px + gw / 2 - 16, WS.h / 2, 6 - (EH.z1 + 0.05 + 0.35)); ccIn.name = 'eh_ccIn'; eh.add(ccIn);   /* 유리 뒤 안쪽(고객 대기석 · 안쪽 면만 · 코어 북쪽 끝 z 20.2 앞까지) */
      [28.9, 31.7].forEach(function (x) { eh.add(boxAt(1.3, 0.42, 0.55, lam(0xCDBFA9), x, EH.z1 + 0.45, 0.21)); eh.add(boxAt(1.3, 0.42, 0.14, lam(0xCDBFA9), x, EH.z1 + 0.66, 0.62)); });   /* 대기석 소파 */
      var gp = new T.Mesh(new T.PlaneGeometry(gw, WS.h), clr); gp.position.set(WS.px + gw / 2 - 16, WS.h / 2, 6 - (nz + 0.02)); gp.renderOrder = 2; gp.name = 'eh_ccPane'; eh.add(gp);
      var gb = new T.Mesh(new T.PlaneGeometry(gw, 0.7), fb); gb.position.set(WS.px + gw / 2 - 16, 1.35, 6 - (nz + 0.01)); gb.renderOrder = 3; gb.name = 'eh_ccBand'; eh.add(gb);
      var nD = new T.Mesh(new T.PlaneGeometry(ndw, nd.h), frost); nD.position.set((nd.s0 + nd.s1) / 2 - 16, nd.h / 2, 6 - nz); nD.renderOrder = 4; nD.name = 'eh_ccGlass'; eh.add(nD);
      [28.8, nd.s0, nd.s1, 31.8].forEach(function (x) { eh.add(boxAt(0.04, WS.h, 0.06, alu, x, nz + 0.01, WS.h / 2)); });   /* 세로 틀 */
      eh.add(boxAt(gw, 0.06, 0.07, alu, WS.px + gw / 2, nz + 0.01, WS.h - 0.03)); eh.add(boxAt(ndw, 0.04, 0.05, alu, (nd.s0 + nd.s1) / 2, nz, nd.h + 0.02));   /* 위 틀 · 문 위 가로대 */
      eh.add(boxAt(0.01, nd.h, 0.012, frame, (nd.s0 + nd.s1) / 2, nz - 0.006, nd.h / 2));   /* 문 두 짝 사이 */
      [-1, 1].forEach(function (sg) { eh.add(boxAt(0.025, 1.2, 0.025, alu, (nd.s0 + nd.s1) / 2 + sg * 0.09, nz - 0.07, 1.1)); [0.62, 1.58].forEach(function (y) { eh.add(boxAt(0.012, 0.012, 0.06, alu, (nd.s0 + nd.s1) / 2 + sg * 0.09, nz - 0.035, y)); }); });   /* 세로 손잡이 + 받침 */
      /* v5.58 (사용자 261004 「지금 고객센터로 표시된 곳은 고객센터가 아니라 미팅룸3이야」) 고객센터 이름표 = 도면의 고객센터(광화문 고객지원팀 · 고객 대기석) 양개 유리문 위 · 남쪽(로비)을 봄 */
      eh.add(boxAt(1.1, 0.28, 0.02, [lam(0xD9DDE2), lam(0xD9DDE2), lam(0xD9DDE2), lam(0xD9DDE2), new T.MeshBasicMaterial({ map: signTex('고객센터', 1.1, 0.28, { bar: '#FF7F32' }) }), lam(0xD9DDE2)], (nd.s0 + nd.s1) / 2, EH.z1 - 0.02, nd.h + 0.3));
      /* 동쪽 유리벽(로비 유리벽이 이어짐) · 유리 + 세로 멀리언 */
      var ge = S.lobby.getObjectByName('side_e_glass'), mu = S.lobby.getObjectByName('side_e_mull');
      if (ge) {
        var gq = { pos: [], idx: [] }; quadInto(gq, [EH.x1, EH.z0, 0], [EH.x1, EH.z1, 0], [EH.x1, EH.z0, EH.H], [-1, 0, 0]);
        var ge2 = new T.Group(); ge2.name = 'eastHallGlass';
        var gm = quadMesh(gq, ge.material); gm.name = 'eh_glass'; ge2.add(gm);
        [13.45, 15.43, 17.42, 19.32].forEach(function (z) { ge2.add(boxAt(0.08, EH.H, 0.08, mu ? mu.material : frame, EH.x1, z, EH.H / 2)); });
        /* 261006 (사용자 고객센터 영상 시작 = 동쪽 여닫이문 E 로 들어옴) E = 은색 알루미늄 틀 양개 유리문(z 9.85 ~ 11.45 · 높이 2.4 · 가운데 맞닿는 틀 · 아래 틀 · 안쪽 가로 밀대 · 바깥 세로 손잡이) · 유리는 모형 유리벽 그대로 · 틀은 유리 면을 가로지르는 상자
         *   옛 = 유리벽에 가로 띠만 있어 문인지 몰랐다 · 열리지 않는다(건물 밖으로는 나가지 않음) */
        var EZ = { z0: 9.85, z1: 11.45, h: 2.4 }, ezc = (EZ.z0 + EZ.z1) / 2, alu2 = lam(0xB9BEC3), ex = EH.x1;
        [EZ.z0, ezc, EZ.z1].forEach(function (z, i) { ge2.add(boxAt(0.12, EZ.h, i === 1 ? 0.08 : 0.06, alu2, ex, z, EZ.h / 2)); });
        ge2.add(boxAt(0.12, 0.08, EZ.z1 - EZ.z0 + 0.06, alu2, ex, ezc, EZ.h + 0.04));
        [-1, 1].forEach(function (sg) { var lz = ezc + sg * (EZ.z1 - EZ.z0) / 4; ge2.add(boxAt(0.1, 0.12, (EZ.z1 - EZ.z0) / 2 - 0.08, alu2, ex, lz, 0.06));
          ge2.add(boxAt(0.03, 0.035, (EZ.z1 - EZ.z0) / 2 - 0.2, alu2, ex - 0.12, lz, 1.0)); [-1, 1].forEach(function (e) { ge2.add(boxAt(0.07, 0.02, 0.02, alu2, ex - 0.085, lz + e * ((EZ.z1 - EZ.z0) / 4 - 0.14), 1.0)); });   /* 안쪽 가로 밀대 */
          ge2.add(boxAt(0.025, 0.7, 0.025, alu2, ex + 0.12, ezc + sg * 0.09, 1.05)); });   /* 바깥 세로 손잡이 */
        mergeStatic(ge2); sideE.add(ge2);
      }
      R.merged = mergeStatic(eh); sideN.add(eh);
      /* v5.64 입구 차단봉 삭제(사용자 261005 「차단봉은 밤이라 있는 것」 · 낮 행사 모형에는 두지 않는다) · 걸어 들어가지 않는 막기는 그대로 */
      /* 코어를 숨겼을 때 남는 낮은 덩어리(tour-scene coreStub)도 빈 공간을 비운다 */
      var cs = S.lobby.getObjectByName('coreStub');
      if (cs && cs.children[1]) {
        var old = cs.children[1], cz = (D.LAYOUT && D.LAYOUT.CORE_Z1) || 20.2, mats = old.material, x0 = 19.8;
        cs.remove(old); old.geometry.dispose();
        cs.add(boxAt(EHR.x - x0, 0.9, cz - EH.z0, mats, (x0 + EHR.x) / 2, (EH.z0 + cz) / 2, 0.45));
        cs.add(boxAt(EH.x0 - EHR.x, 0.9, EHR.z - EH.z0, mats, (EHR.x + EH.x0) / 2, (EH.z0 + EHR.z) / 2, 0.45));   /* v5.64 튀어나온 2m */
        cs.add(boxAt(EH.x1 - EHR.x, 0.9, cz - EH.z1, mats, (EHR.x + EH.x1) / 2, (EH.z1 + cz) / 2, 0.45));
      }
    }
    /* ── ③ 미팅룸 유리벽 ── 미팅룸 2 남쪽 막힌 벽을 지운다 · v5.58 미팅룸 3 탁자 · 의자는 되살림(v5.45 고객센터 자리 되돌림) */
    var wb = S.lobby.getObjectByName('wing_body');
    if (wb) R.wing = regionCut(wb, null, null, function (tri) {
      var all = function (f) { return tri.every(function (V) { return f(V.p); }); };
      return all(function (p) { return p[1] > 12.14 && p[1] < 12.26 && p[0] < 3.62; });
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
    /* v5.73 (사용자 261005 캡처 「미팅룸1 문 위치 이 자리야」 · 복도 z 약 17.0 에서 서쪽을 보며 칸막이 벽 남쪽 유리 칸을 가리킴 · 사용자 확인 필요)
     *   미팅룸 1 문 = z 16.6 ~ 17.5(옛 18.2 ~ 19.1) · 그 자리가 미팅룸 1 이 되도록 미팅룸 1 · 2 칸막이 벽(모형 wing_body · 옛 z 17.76 ~ 17.84 · 옛 경계는 v5.35 「균등」 추정)을 1.46m 남쪽 z 16.30 ~ 16.38 로 옮긴다
     *   벽 꼭짓점만 옮겨 구운 빛 · 색은 그대로 · 미팅룸 2 탁자 · 의자(z 16.1 까지)와 겹치지 않음 · 걷기 지도 앞이라 막힘이 따라온다 */
    R.part = movePart(S.lobby.getObjectByName('wing_body'), 17.74, 17.86, -1.46);
    glassWall('x', 3.6, 12.2, 16.30, [[12.55, 13.45]], [true, true]);       /* 미팅룸 2 동쪽(복도) · 문 · 앞 끝 = 위 모서리 틀 · 뒤 끝 = 칸막이 벽(v5.73 17.76 → 16.30) */
    glassWall('x', 3.6, 16.38, 23.16, [[16.6, 17.5]], [true, true]);        /* 미팅룸 1 동쪽 · 문(v5.73 18.2 ~ 19.1 → 16.6 ~ 17.5) */
    glassWall('z', 23.2, 3.6, 6.82, [[4.65, 5.55]], [true, true]);         /* v5.58 미팅룸 3 앞 · 미팅룸 1 · 2 와 같은 유리벽 · 출입문(옛 v5.45 고객센터 양개문 · 표지 · 안내 카운터 없앰) */
    R.merged = mergeStatic(gw); S.lobby.add(gw);
    /* ── ② 가벽 + 전체 화면 ── */
    /* v5.58 (사용자 261004 현장 사진 「미팅룸 들어가는 가벽쪽」) 벽감 = 짙은 갈색 뒤판(가벽) · 오른쪽 옆벽(코어 서쪽 면) · 천장 띠(아래 면) + 그 위 검은 가로 루버 띠(로비 쪽 z 11.46 · 통로까지) · 뒤판 가운데 은회색 얇은 테 두른 화면
     *   화면 = 테 안쪽(폭 1.5 · 높이 1.92 · 바닥 위 0.16) · 왼쪽 = 열린 통로(차단봉 없음 · 사용자 「차단봉은 밤이라 있는 거야」) */
    var wx0 = WW.x1 - WW.w, side = new T.MeshLambertMaterial({ color: 0x3A302B }), back = new T.MeshLambertMaterial({ color: 0xEDEBE7 }), face = new T.MeshLambertMaterial({ color: 0x2F2724 }), silver = new T.MeshLambertMaterial({ color: 0xB4B8BC });
    var wb2 = new T.Mesh(new T.BoxGeometry(WW.w, WW.h, WW.t), [side, side, side, side, face, back]); wb2.position.set((wx0 + WW.x1) / 2 - 16, WW.h / 2, 6 - WW.z); wb2.name = 'partition';
    var PW = 1.5, PH = 1.92, PY = 0.16 + PH / 2, mx = (wx0 + WW.x1) / 2, fz = WW.z - WW.t / 2;
    var scr = new T.Mesh(new T.PlaneGeometry(PW, PH), new T.MeshBasicMaterial({ color: 0x14171C, toneMapped: false })); scr.position.set(mx - 16, PY, 6 - (fz - 0.004)); scr.name = 'partitionScreen';
    S.lobby.add(wb2); S.lobby.add(scr);
    var ng = new T.Group(); ng.name = 'niche';
    [[PW + 0.06, 0.03, mx, PY + PH / 2 + 0.015], [PW + 0.06, 0.03, mx, PY - PH / 2 - 0.015]].forEach(function (q) { ng.add(boxAt(q[0], q[1], 0.02, silver, q[2], fz - 0.01, q[3])); });   /* 테 위 · 아래 */
    [mx - PW / 2 - 0.015, mx + PW / 2 + 0.015].forEach(function (x) { ng.add(boxAt(0.03, PH, 0.02, silver, x, fz - 0.01, PY)); });   /* 테 옆 */
    var sd = new T.Mesh(new T.PlaneGeometry(WW.z - WW.t / 2 - 11.46, WW.h), side); sd.rotation.y = -Math.PI / 2; sd.position.set(WW.x1 - 0.004 - 16, WW.h / 2, 6 - (11.46 + WW.z - WW.t / 2) / 2); ng.add(sd);   /* 오른쪽 옆벽(짙은 갈색) */
    ng.add(boxAt(WW.x1 - 3.6, 0.05, WW.z - 11.46, side, (3.6 + WW.x1) / 2, (11.46 + WW.z) / 2, WW.h + 0.025));   /* 천장 띠(벽감 · 통로 위) */
    ng.add(boxAt(0.03, WW.h, 0.03, silver, WW.x1 - 0.015, 11.46 + 0.015, WW.h / 2)); ng.add(boxAt(WW.x1 - 3.6, 0.03, 0.03, silver, (3.6 + WW.x1) / 2, 11.46 + 0.015, WW.h + 0.015));   /* 은회색 모서리 띠 */
    var lv = lam(0x1B1B1D), lvb = new T.MeshLambertMaterial({ color: 0x0E0E0F });
    ng.add(boxAt(WW.x1 - 3.6, 4.6 - WW.h - 0.05, 0.02, lvb, (3.6 + WW.x1) / 2, 11.46 + 0.06, (WW.h + 0.05 + 4.6) / 2));   /* 루버 뒤판 */
    for (var ly = WW.h + 0.12; ly < 4.58; ly += 0.145) ng.add(boxAt(WW.x1 - 3.6, 0.08, 0.05, lv, (3.6 + WW.x1) / 2, 11.46 + 0.025, ly));   /* 가로 루버 */
    /* v5.64 (사용자 261005 「이곳도 상단은 옆에 가벽(스크린) 위와 마찬가지 재질로 막혀 있어」 · 「미팅룸 쪽은 다 같아 · 거기는 천장이 메인 홀보다 낮아」)
     *   날개(미팅룸 1 · 2 · 3 · 복도) 천장 = 유리벽 높이(WW.h 2.7) · 로비에서 보이는 날개 앞면(z 11.46) 위 = 벽감과 같은 검은 가로 루버를 서쪽 끝까지(x 0.08 ~ 3.6)
     *   그 아래 로비 쪽 띠(z 11.46 ~ 12.2 · 미팅룸 2 앞 유리벽까지) = 벽감 천장 띠와 같은 갈색 · 미팅룸 유리벽 위 = 날개 천장이 막는다(아래에서만 보이는 면 · 위에서 내려다보면 비친다) */
    ng.add(boxAt(3.6 - 0.08, 4.6 - WW.h - 0.05, 0.02, lvb, (0.08 + 3.6) / 2, 11.46 + 0.06, (WW.h + 0.05 + 4.6) / 2));   /* 루버 뒤판 · 서쪽 */
    for (var ly2 = WW.h + 0.12; ly2 < 4.58; ly2 += 0.145) ng.add(boxAt(3.6 - 0.08, 0.08, 0.05, lv, (0.08 + 3.6) / 2, 11.46 + 0.025, ly2));   /* 가로 루버 · 서쪽 */
    ng.add(boxAt(3.6 - 0.08, 0.05, 12.2 - 11.46, side, (0.08 + 3.6) / 2, (11.46 + 12.2) / 2, WW.h + 0.025));   /* 천장 띠 · 미팅룸 2 앞 */
    ng.add(boxAt(3.6 - 0.08, 0.03, 0.03, silver, (0.08 + 3.6) / 2, 11.46 + 0.015, WW.h + 0.015));   /* 은회색 모서리 띠 · 서쪽 */
    mergeStatic(ng); S.lobby.add(ng);
    var wc = new T.Shape(); [[0, 12.2], [6.83, 12.2], [6.83, 27.0], [0, 23.8]].forEach(function (q, i) { if (i) wc.lineTo(q[0] - 16, 6 - q[1]); else wc.moveTo(q[0] - 16, 6 - q[1]); });
    var wcm = new T.Mesh(new T.ShapeGeometry(wc), lam(0xEEEDEA)); wcm.rotation.x = Math.PI / 2; wcm.position.y = WW.h + 0.05; wcm.name = 'wingCeil';   /* 날개 천장 · 아래를 보는 면만(위에서는 비친다) */
    S.lobby.add(wcm);
    G.wallScr = scr;
    patchFade([side, back, face, scr.material], WFADE, 'w'); patchFade([silver], WFADE, 's'); patchFade([lv, lvb], LFADE, 'l');   /* v5.64 서쪽으로 늘린 루버 · 띠도 같은 재질이라 같이 비워진다 */
    var gm2 = []; gw.traverse(function (o) { if (o.isMesh) [].concat(o.material).forEach(function (m) { if (gm2.indexOf(m) < 0) gm2.push(m); }); });
    patchFade(gm2, GFADE, 'g');
    G.remodel = { eh: R.eh, floor: R.floor, wing: R.wing, uv1: R.uv1, ms: Math.round(performance.now() - t0) };
  }
  /* 가벽 · 유리벽이 시선을 가리면 점점이 비운다(기둥과 같은 디더링) · 카메라 → 머리 선분이 벽 선분을 지나고 그 자리 높이가 벽보다 낮을 때 · 카메라가 미팅룸 안이면 유리벽 전부 */
  var WFADE = { value: 1 }, GFADE = { value: 1 }, LFADE = { value: 1 };   /* v5.58 LFADE = 벽감 위 루버 띠(통로 · 날개 안을 볼 때) */
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
    var l = fadeTo(LFADE, under(segHit(cx, cz, hx, hz, 0.0, 11.46, WW.x1 + 0.3, 11.46), 4.6) ? 0.16 : 1, dt);   /* v5.58 루버 띠 */
    return a || b || l;
  }

  /* ═══════════ 받기 ═══════════ */
  /* v5.51 불러오기 진행률(사용자 261004 「불러오는 중 125는 왜 나오지」) · 원인 = 압축 전송(gzip)이면 받은 바이트(풀린 크기)가 Content-Length(압축 크기)보다 커서 100 을 넘었다
   * 이제 0~100 만 · 줄어들지 않음 · 한 번이라도 100 을 넘기면(전체 크기를 믿을 수 없음) 숫자 없이 점 물결만 · tour-scene 은 모를 때 -1 을 넘긴다 */
  /* ═══════════ v5.73 흉상 = 모형(lobby.glb 「bust」) 원래 몸체 + v5.70 · v5.72 받침 · 명판 (사용자 261005 「흉상은 원래 있던 걸로 돌아가자」 · 「받침, 명판 그림 살려줘」) ═══════════
   * 몸체 = 모형에 있던 흉상 그대로(받침 윗면 높이 y3 위 삼각형은 남김) · 사진 흉상(v5.72 bust-photo · bustPhoto · bustShell) · 청동 조각(v5.70) · 점프 반응(둘레 빛 · 미소)은 없앴다(되살리기 = 정리 기록.md)
   * 받침 · 벽 새김 무늬 = v5.70 그대로(노란 · 베이지 대리석 받침 = 위 넓은 판 + 아래 기둥 · 기둥 앞 금빛 나뭇잎 띠 · 벽 새김 글씨는 무늬만)
   * 명판 = 글꼴 조판 그림 bust-plaque.webp(이름 = Yuji Syuku 붓글씨 · 숫자 = Noto Serif KR · 둘 다 SIL OFL 1.1 · 투명 바탕 먹색 · mk_plaque.py)
   * 자리 · 크기 = 모형 그대로 · 받침 치수 = build/layout.py BUST_PED · 모형의 옛 받침 삼각형(y3 아래)과 옛 명판만 지우고(동쪽 화분 · 흉상 몸체는 남김) 같은 치수로 다시 세운다
   *   걷기 지도(buildGrid) 앞에 세워 막힘(받침 바닥 크기 같음 = 끼임 그대로) */
  var BUSTVER = 'v572';
  var BUST_PED = { plinth: [0.98, 0.70, 0.06], col: [0.64, 0.48, 0.56], cap: [0.94, 0.64, 0.46] };
  var BU = null;
  function bRnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function bCv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function bTex(c, rep) { var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t; }
  /* 노란 · 베이지 대리석(사진 91b1cc38 · fa895b66) · 얼룩 + 옅은 결 */
  function bustMarble() {
    var c = bCv(256, 256), g = c.getContext('2d'), R = bRnd(11);
    g.fillStyle = '#D4AE6A'; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 220; i++) { var x = R() * 256, y = R() * 256, r = 6 + R() * 34; g.fillStyle = R() < 0.5 ? 'rgba(255,241,206,' + (0.05 + R() * 0.09).toFixed(3) + ')' : 'rgba(186,146,78,' + (0.04 + R() * 0.07).toFixed(3) + ')'; g.beginPath(); g.ellipse(x, y, r, r * (0.4 + R() * 0.6), R() * 3, 0, 6.3); g.fill(); }
    for (var v = 0; v < 9; v++) {
      var vx = R() * 256, vy = R() * 256, an = -0.5 + R() * 0.6; g.beginPath(); g.moveTo(vx, vy);
      for (var s = 0; s < 36; s++) { an += (R() - 0.5) * 0.55; vx += Math.cos(an) * 8; vy += Math.sin(an) * 8; g.lineTo(vx, vy); }
      g.strokeStyle = v % 3 === 0 ? 'rgba(156,112,52,0.30)' : 'rgba(255,247,222,0.42)'; g.lineWidth = 0.6 + R() * 1.3; g.stroke();
    }
    return bTex(c, false);
  }
  /* 금빛 나뭇잎(월계) 띠 · 줄기 하나에 잎이 마주나고 끝으로 갈수록 작아진다 */
  function bustLaurel() {
    var c = bCv(512, 128), g = c.getContext('2d');
    var y = function (x) { return 66 - 10 * Math.sin((x - 40) / 430 * Math.PI); };
    g.strokeStyle = '#9C7A34'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(30, y(30)); for (var x = 30; x <= 486; x += 8) g.lineTo(x, y(x)); g.stroke();
    for (var i = 0; i < 13; i++) {
      var px = 52 + i * 33, k = 1 - i / 17, L = 34 * k + 10, W = 12 * k + 4, sl = Math.atan2(y(px + 2) - y(px - 2), 4);
      [-1, 1].forEach(function (sd) {
        g.save(); g.translate(px, y(px)); g.rotate(sl + sd * 0.62 + 0.25); g.translate(L * 0.55, 0);
        var gr = g.createLinearGradient(0, -W, 0, W); gr.addColorStop(0, '#F1DA97'); gr.addColorStop(0.5, '#D2AE5C'); gr.addColorStop(1, '#9E7832');
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, L * 0.55, W * 0.5, 0, 0, 6.3); g.fill();
        g.strokeStyle = 'rgba(118,86,30,0.75)'; g.lineWidth = 1.2; g.stroke();
        g.beginPath(); g.moveTo(-L * 0.5, 0); g.lineTo(L * 0.5, 0); g.strokeStyle = 'rgba(255,240,196,0.55)'; g.lineWidth = 1; g.stroke();
        g.restore();
      });
    }
    return bTex(c, false);
  }
  /* 벽 새김 글씨 무늬(내용은 옮기지 않음 · 글줄 모양만) · 밝은 새김 + 아래 그늘 한 줄 */
  function bustCarve(seed) {
    var c = bCv(256, 320), g = c.getContext('2d'), R = bRnd(seed);
    for (var r = 0; r < 15; r++) {
      var yy = 22 + r * 19.5, x = r === 0 ? 70 : 16, end = r === 0 ? 186 : 240 - (r === 14 ? 90 : R() * 18);
      while (x < end) { var w = r === 0 ? 10 : 5 + R() * 7; g.fillStyle = 'rgba(255,236,204,0.55)'; g.fillRect(x, yy, w, r === 0 ? 7 : 5); g.fillStyle = 'rgba(92,48,18,0.30)'; g.fillRect(x, yy + (r === 0 ? 7 : 5), w, 1.5); x += w + (r === 0 ? 7 : 2.5 + R() * 3.5); }
    }
    return bTex(c, false);
  }
  /* 사진 윤곽 → 두께 있는 판 두 장(앞 = 사진 · 뒤 = 어두운 청동) · 받침 윗면 가운데 아래가 원점 · +z = 정면(남쪽) · 96 x 96 칸
   *   칸마다 윤곽 바깥까지 거리(모따기 거리 두 번 훑기 · 위 · 좌우 밖 = 바깥 · 아래 밖 = 받침 속으로 이어짐) → 반두께 = 원의 단면 sqrt(d(2A - d)) · A 넘으면 A
   *   윤곽 위 꼭짓점 = 두께 0(앞뒤가 만나 닫힌다) · 윤곽 꼭짓점은 원본 해상도 알파 0.5 선 위로 옮긴다(알파 자르기를 쓰지 않아 옆에서 봐도 구멍 · 흰 점이 없다) · 그림을 읽을 수 없으면 null(얇은 판으로) */
  function buildBust() {
    var at = D.BLD.bust; if (!at) return;
    var BX = at[0], BZ = at[1], P_ = BUST_PED, R = { cut: 0, plaque: 0 };
    var YTOP = P_.plinth[2] + P_.col[2] + P_.cap[2];
    S.lobby.updateMatrixWorld(true);
    /* 모형의 옛 받침 · 옛 명판을 지운다 · 흉상 몸체 · 동쪽 화분(x BX + 0.86 · 검은 상자 폭 0.46)은 남긴다 */
    var old = S.lobby.getObjectByName('bust');
    if (old) {
      var kill = [];
      old.traverse(function (o) {
        if (!o.isMesh) return;
        if (o.material && o.material.name === 'plaque') { kill.push(o); return; }
        R.cut += regionCut(o, null, null, function (tri) { return (tri[0].p[0] + tri[1].p[0] + tri[2].p[0]) / 3 < BX + 0.62 && Math.max(tri[0].p[2], tri[1].p[2], tri[2].p[2]) < YTOP + 0.01; }) ? 1 : 0;   /* v5.73 옛 받침(윗면 아래)만 · 흉상 몸체는 남김 */
      });
      kill.forEach(function (o) { o.parent.remove(o); R.plaque++; });
    }
    var g = new T.Group(); g.name = 'bustNew'; g.position.set(BX - 16, 0, 6 - BZ); S.lobby.add(g);
    /* 받침 · 아래 띠 · 기둥 · 위 넓은 판(앞면 명판 글씨) · 노란 · 베이지 대리석 · 기둥 앞 금빛 나뭇잎 띠 */
    var mt = new T.MeshLambertMaterial({ map: bustMarble() }), mtD = new T.MeshLambertMaterial({ map: mt.map, color: 0xE6DCC8 });
    var y1 = P_.plinth[2], y2 = y1 + P_.col[2], y3 = y2 + P_.cap[2];
    var bx = function (s, y0, m) { var b = new T.Mesh(new T.BoxGeometry(s[0], s[2], s[1]), m); b.position.y = y0 + s[2] / 2; g.add(b); return b; };
    bx(P_.plinth, 0, mtD); bx(P_.col, y1, mt); bx(P_.cap, y2, mt);
    var plq = new T.Mesh(new T.PlaneGeometry(P_.cap[0] - 0.08, (P_.cap[0] - 0.08) / 2), new T.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.92, color: 0xffffff }));
    plq.position.set(0, y2 + P_.cap[2] * 0.52, P_.cap[1] / 2 + 0.003); plq.name = 'bustPlaque'; plq.visible = false; g.add(plq);   /* 그림을 받은 뒤에만 보인다(못 받으면 글씨 없는 받침) */
    new T.TextureLoader().load(BASE + 'bust-plaque.webp?v=' + BUSTVER, function (t) { t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; plq.material.map = t; plq.material.needsUpdate = true; plq.visible = true; G.need = true; });
    var lau = new T.Mesh(new T.PlaneGeometry(0.44, 0.11), new T.MeshLambertMaterial({ map: bustLaurel(), transparent: true, depthWrite: false }));
    lau.position.set(0, y1 + P_.col[2] * 0.40, P_.col[1] / 2 + 0.003); g.add(lau);
    /* 뒤 벽 새김 글씨 무늬 두 장(흉상 좌우 · 벽면 z 11.46 바로 앞 · 북쪽 벽 묶음에 넣어 단면 때 함께 숨는다) */
    var sideN = S.lobby.getObjectByName('side_n');
    [[BX - 1.2, 21], [BX + 1.2, 37]].forEach(function (w) {
      var m = new T.Mesh(new T.PlaneGeometry(0.86, 1.08), new T.MeshBasicMaterial({ map: bustCarve(w[1]), transparent: true, depthWrite: false, opacity: 0.45 }));
      m.position.set(w[0] - 16, 2.05, 6 - (D.BLD.lobbyN - 0.006)); m.name = 'bustCarve'; (sideN || S.lobby).add(m);
    });
    BU = { x: BX, z: BZ, g: g, cut: R.cut, plaque: R.plaque, top: YTOP };
    G.bust = BU;
  }
  function loadProg(k) {
    if (k == null || !(k >= 0) || k > 1.0001) G.loadUnk = true;
    var p = G.loadUnk ? -1 : Math.max(G.loadK || 0, Math.min(1, k)); if (!G.loadUnk) G.loadK = p;
    G.loadLog = G.loadLog || []; if (G.loadLog.length < 400) G.loadLog.push(G.loadUnk ? -1 : Math.round(p * 100));
    $('load').textContent = G.loadUnk ? '모형 불러오는 중' : '모형 불러오는 중 ' + Math.round(p * 100) + '%';
    veilProg(G.loadUnk ? -1 : p);
  }
  function load() {
    $('load').hidden = false; G.loadK = 0; G.loadUnk = false; veilProg(0);
    S.load(BASE + 'lobby.glb?v=' + LABVER, function (k) { loadProg(k); }, function () {
      fixCoplanar(S.lobby); fixLightmaps(S.lobby); fixDesks(S.lobby); remodel(); buildBust(); buildGrid(S.lobby); patchPillars(S.lobby); buildDoor();
      var st = STOPS[0], f = nearestFree(st.x, st.z); flood(f[0], f[1]);
      STOPS.forEach(function (s) { var q = nearestFree(s.x, s.z); if (q) { s.x = q[0]; s.z = q[1]; } });
      buildGuides(); buildRooms(); hideCheckin(); buildTypingTv(); buildLaptops(); buildTvs();   /* v5.51 오락기 3대 없앰(사용자 261004) */
      if (G.wallScr) { var wv = MOT.on ? motAdd(G.wallScr, 'wall') : tvAdd(G.wallScr, 64, Math.round(64 * WW.h / WW.w), 'wall'); wv.sphere.radius = Math.hypot(WW.w, WW.h) / 2 + 0.1; G.tvN = TVS.length; }   /* v5.45 가벽 전체 화면 · 같은 픽셀 광고 루프(행사명 → ME to WE → 물결) · 화면 비율대로 64 × 96 */
      STOPS.forEach(function (s) { if (!free(s.x, s.z)) { var q = nearestFree(s.x, s.z); if (q) { s.x = q[0]; s.z = q[1]; } } });   /* v5.38 멈춤 자리가 스태프 · TV 원 안이면 밖으로 */
      G.ceil = S.lobby.getObjectByName('ceiling');
      G.loaded = true; $('load').hidden = true;
      placeAt(0, true); applyTarget();
      buildPins(); buildMini(); buildMags(); buildBlocks(); occBuild(); lookFrameMesh();   /* v5.54 판 앞 물체 덩어리 · 자세히 보기 테두리 */
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
  var DDEF = 4.8;   /* v5.51 기본 거리(그대로) · 확대 · 축소 = 두 손가락 · 휠 · 빈 바닥 두 번 톡 = 이 값으로 · 범위 DMIN ~ DMAX = 옛 +/- 단추와 같다 */
  function setDist(d) { G.dist = clamp(d, DMIN, DMAX); G.need = true; }
  function holdStart(kind, dir) { if (G.anim || !G.loaded || PH.on) return; HOLD = { kind: kind, dir: dir, t0: performance.now(), amt: 0 }; G.need = true; }
  function holdEnd() {
    if (!HOLD) return; var h = HOLD; HOLD = null;
    if (h.kind === 'rot') { var min = 15 * Math.PI / 180; if (h.amt < min) rotBy(h.dir * (min - h.amt)); }
    else if (h.amt < 0.5) setDist(G.dist + h.dir * (0.5 - h.amt));
    G.need = true;
  }
  /* v5.81 (사용자 261006 iOS 제보 「우로 돌기를 눌러도 캐릭터가 돌지 않고 직진하는 것 같다」) 돌기 = 시점과 몸이 같이 돈다
   *   옛 v5.51 = 시점만 돌고 몸은 그대로 · 서서 누르면 카메라만 캐릭터 둘레를 돌아 캐릭터는 안 도는 것처럼 보였고 · 달리기 한 번 누름(runStick = 몸이 보는 쪽) 중에는 몸이 그대로라 화면만 돌고 캐릭터는 곧장 달렸다
   *   조이스틱을 미는 동안 = 몸은 미는 쪽(stepBot)이 정하므로 시점만 · 걸어가기(자동 길) · 비집기 · 연출 · 사진 찍기 = 시점만 · 화면 밀어 돌기(v5.58) = 둘러보기라 시점만(그대로) */
  function rotBy(d) {
    G.azTo += d;
    var stk = G.stick && (Math.abs(G.stick.x) + Math.abs(G.stick.y)) > 0.05;
    if (G.scn === 'lobby' && !stk && G.mode !== 'auto' && !G.squeeze && !G.anim && !PH.on) { if (G.face == null) G.face = G.h; G.face += d; }
    G.rotN = (G.rotN || 0) + 1;
  }
  /* v5.81 돌기 단추 누름 한 길(iOS · 안드로이드 · PC 같은 길) · 손가락 하나 = 누름 하나
   *   터치 기기는 포인터(pointerdown)와 터치(touchstart)가 둘 다 온다 · 먼저 온 쪽으로 시작하고 0.3초 안 같은 단추의 둘째 신호는 같은 누름에 붙인다
   *   끝 = 그 손가락을 뗄 때만 · 터치가 붙었으면 touchend · touchcancel(iOS 의 포인터 취소 · 캡처 잃음으로 일찍 끝나지 않게) · 터치가 없는 기기(마우스 · 펜)는 같은 pointerId 의 pointerup · pointercancel
   *   조이스틱 손가락을 떼도 돌기는 이어진다 · 옛 lostpointercapture 끝 · 터치 setPointerCapture 없앰(터치는 브라우저가 이미 붙잡는다)
   *   touchstart 를 막는다(passive false) = iOS 가 길게 누름 · 두 번 누름 · 가장자리 밀기 같은 제 동작으로 누름을 가로채지 않게 · 클릭은 쓰지 않는다
   *   안전망 = 창의 touchend(그 손가락이 화면에 없으면) · pointerup(같은 id) · 창 포커스 잃음 · 화면 숨김 */
  var RB = null;
  function rbHas(L, id) { if (!L) return false; for (var i = 0; i < L.length; i++) if (L[i].identifier === id) return true; return false; }
  function rbStart(el, dir, pid, tid) {
    var now = performance.now();
    if (RB && RB.el === el && now - RB.t0 < 300 && ((pid != null && RB.pid == null) || (tid != null && RB.tid == null))) { if (pid != null) RB.pid = pid; if (tid != null) RB.tid = tid; return; }   /* 같은 손가락의 둘째 신호 */
    if (RB) RB.el.classList.remove('kp');
    RB = { el: el, dir: dir, pid: pid, tid: tid, t0: now }; el.classList.add('kp');
    holdStart('rot', dir);
    if (G.rbLog && G.rbLog.length < 60) G.rbLog.push({ s: dir, p: pid, t: tid, ms: Math.round(now) });
  }
  function rbEnd() { if (!RB) return; var r = RB; RB = null; r.el.classList.remove('kp'); if (G.rbLog && G.rbLog.length < 60) G.rbLog.push({ e: r.dir, ms: Math.round(performance.now() - r.t0) }); holdEnd(); }
  function rotWire() {
    [['rotL', 1], ['rotR', -1]].forEach(function (q) {
      var el = $(q[0]), dir = q[1];
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); if (e.pointerType !== 'touch') { try { el.setPointerCapture(e.pointerId); } catch (x) {} } rbStart(el, dir, e.pointerId, null); });
      el.addEventListener('touchstart', function (e) { if (e.cancelable) e.preventDefault(); var t = e.changedTouches && e.changedTouches[0]; if (t) rbStart(el, dir, null, t.identifier); }, { passive: false });
      ['touchend', 'touchcancel'].forEach(function (ev) { el.addEventListener(ev, function (e) { if (RB && RB.el === el && RB.tid != null && rbHas(e.changedTouches, RB.tid)) rbEnd(); }); });
      ['pointerup', 'pointercancel'].forEach(function (ev) { el.addEventListener(ev, function (e) { if (RB && RB.el === el && RB.tid == null && e.pointerId === RB.pid) rbEnd(); }); });
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); holdStart('rot', dir); setTimeout(holdEnd, 0); } });
    });
    ['touchend', 'touchcancel'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (RB && RB.tid != null && !rbHas(e.touches, RB.tid)) rbEnd(); }, true); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (RB && RB.tid == null && e.pointerId === RB.pid) rbEnd(); }, true); });
    window.addEventListener('blur', rbEnd);
    document.addEventListener('visibilitychange', function () { if (document.hidden) rbEnd(); });
  }
  function stepHold(dt) {
    if (!HOLD) return false;
    var t = (performance.now() - HOLD.t0) / 1000, ramp = RM ? 1 : clamp(t / 0.2, 0.25, 1);
    if (HOLD.kind === 'rot') { var da = (RM ? 35 : 60) * Math.PI / 180 * ramp * dt; rotBy(HOLD.dir * da); HOLD.amt += da; }
    else { var dd = 2.4 * ramp * dt, before = G.dist; setDist(G.dist + HOLD.dir * dd); HOLD.amt += Math.abs(G.dist - before); }
    return true;
  }
  function placeAt(k, snap) {
    var s = STOPS[k]; G.pos.copy(toThree(s.x, s.z)); G.h = s.look ? faceTo(s.look, s.x, s.z) : G.h; G.face = G.h; G.stop = k; G.mode = 'stop'; G.path = null;
    if (snap) { if (s.look) G.az = G.azTo = faceAz(s); var c = camWant(); G.camPos.copy(c.pos); G.look.copy(c.look); }
    G.need = true; updateUi(true);
  }
  function goStop(k) {
    if (!G.loaded || PH.on) return; G.moved = true;
    k = clamp(k, 0, STOPS.length - 1);
    if (G.scn === 'cafe') backTo1FNow();
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
  function flash() { veilCover(200, null, function () { veilReveal(260, null); }); }   /* v5.51 바로 옮기기(움직임 줄이기) = 전환 막(움직임 줄이기면 짧은 페이드) */
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
    if (PH.on) return phBot(dt, now);   /* v5.67 사진 찍기 연출 = 조작 잠금 */
    var moving = 0, pushed = false;
    if (G.squeeze) { stepSqueeze(now); moving = 0.6; }
    else if (G.mode === 'auto' && G.path) {
      var p = planOf(G.pos), q = G.path[G.pathI], dx = q[0] - p[0], dz = q[1] - p[1], d = Math.hypot(dx, dz), step = G.speed * dt;
      if (d > 1e-4) G.face = Math.atan2(dx, -dz);   /* v5.51 걷는 쪽을 본다(도면 z 북쪽 = three -z) */
      if (d <= step) { G.pos.copy(toThree(q[0], q[1])); G.pathI++; if (G.pathI >= G.path.length) arrive(); }
      else { var nx = p[0] + dx / d * step, nz = p[1] + dz / d * step; G.pos.copy(toThree(nx, nz)); }
      moving = Math.min(1, G.speed / 3); G.fwdT = 0; G.run = 0; G.realV = 0; G.push = 0;
    } else if ((G.stick && (Math.abs(G.stick.x) + Math.abs(G.stick.y)) > 0.05) || runStick()) {
      var STK = G.stick && (Math.abs(G.stick.x) + Math.abs(G.stick.y)) > 0.05 ? G.stick : runStick();   /* v5.51 달리기 한 번 누름 = 조그 없이도 앞으로 */
      /* 고정 패드 · 화면 기준 · 위 = 화면 위쪽으로 */
      /* 방향 기준은 끌기 시작할 때의 카메라로 고정한다(끄는 동안 카메라가 돌아도 같은 쪽으로 걷는다) */
      var fw = _v.set(Math.sin(G.az), 0, Math.cos(G.az));   /* 패드 위 = 화면 위쪽(시점을 돌려도 늘 화면 기준) */
      var rx = -fw.z, rz = fw.x, mx = rx * STK.x - fw.x * STK.y, mz = rz * STK.x - fw.z * STK.y, mag = Math.min(1, Math.hypot(mx, mz));
      stepRun(dt);
      if (mag > 0.01) {
        var sp = WALK_V * mag * (1 + G.run) * dt, ux = mx / Math.hypot(mx, mz), uz = mz / Math.hypot(mx, mz), p0 = planOf(G.pos);
        G.face = Math.atan2(ux, uz);   /* v5.51 몸 = 움직이는 쪽(대각 = 대각) */
        var q = moveStep(p0[0], p0[1], ux, -uz, sp); G.pos.copy(toThree(q[0], q[1])); G.realV = dt > 0 ? q[2] / dt : 0;
        moving = mag; G.mode = 'free';
        stepPush(dt, p0, -uz, (q[1] - p0[1]) < sp * 0.3 * Math.max(0, -uz)); pushed = true;
        stepPushCs(dt, p0, ux, (p0[0] - q[0]) < sp * 0.3 * Math.max(0, -ux));   /* 261006 방화문 안 엘리베이터 문 */   /* 막힘 = 북쪽으로 거의 못 감(기둥을 따라 옆으로 미끄러져도 민 것으로 센다) */
      }
    } else { G.fwdT = 0; G.run = 0; G.realV = 0; }
    if (!pushed) stepPush(dt, null, 0, false);
    pushOut();
    /* v5.51 몸 방향 = 움직이는 쪽(사용자 261004 「정면을 무조건 바라보라는 옵션과 규칙을 없애야 · 게걸음」) · v5.38 「몸 = 늘 카메라 방위」 규칙은 없앴다
     *   조그 · WASD · 걸어가기 · 달리기가 G.face(목표)를 정하고 몸 G.h 가 빠르게(약 0.15초) 따라간다 · 남는 각도가 0.012 라디안 아래면 목표에 정확히 붙인다(옛 「살짝 삐딱하게 서기」 = 보간이 중간에 멈춘 것 · 다시 생기지 않게)
     *   멈추면 마지막으로 걷던 쪽을 그대로 본다 · 카메라는 돌기 단추 · 키로만 돈다(캐릭터 뒤로 저절로 따라 돌지 않음 · 조작이 예측되게)
     *   판 보기 = 들어갈 때 판 쪽으로 돌았다가 나오면서 원래 보던 쪽(G.face)으로 돌아와 끝에서 정확히 같다 */
    if (G.face == null) G.face = G.h != null ? G.h : G.az;
    var A = G.anim, hb;
    if (A && A.ph != null && (A.kind === 'in' || A.kind === 'out' || A.kind === 'hold')) { var kk = A.kind === 'hold' ? 1 : clamp((now - A.t0) / A.dur, 0, 1); hb = A.kind === 'out' ? angLerp(A.ph, G.face, easeIO(clamp(kk / 0.8, 0, 1))) : angLerp(G.face, A.ph, easeIO(clamp(kk / 0.5, 0, 1))); if (A.kind === 'out' && kk >= 1) hb = G.face; }
    else {
      var dh = Math.atan2(Math.sin(G.face - G.h), Math.cos(G.face - G.h));
      hb = Math.abs(dh) < 0.012 || RM ? G.face : G.h + dh * (1 - Math.exp(-dt * 20));
    }
    G.h = hb; var turning = G.h !== G.face;
    var jumping = stepJump(dt);
    /* 모션 · 통통 + 기울임 + 발 */
    G.moveV += ((moving ? 1 : 0) - G.moveV) * (1 - Math.exp(-dt * 10));
    if (moving) G.walkT += dt * (7 + 5 * moving) * (1 + 0.6 * (G.run || 0));
    var w = RM || G.air ? 0 : G.moveV, s = Math.sin(G.walkT);
    bot.position.copy(G.pos); bot.position.y = G.jy || 0; bot.rotation.y = G.h;
    var sq = bodyScale(now), BP = botParts.body;
    if (G.pushK > 0 && !G.squeeze) { bot.position.x += Math.sin(G.pushDir || 0) * 0.14 * G.pushK; bot.position.z += Math.cos(G.pushDir || 0) * 0.14 * G.pushK; }   /* 게이트에 몸이 눌려 들어간다 */
    BP.scale.set(sq[0], sq[1], sq[2]);
    BP.position.y = Math.abs(s) * 0.045 * w; BP.rotation.z = s * 0.07 * w + (G.pushK > 0 && !RM ? Math.sin(G.clock * 19) * 0.05 * G.pushK : 0); BP.rotation.x = 0.06 * w;   /* v5.50 달리기 기울임 없앰(사용자 261004 권장안) */
    botParts.feet[0].position.z = 0.04 + s * 0.09 * w; botParts.feet[1].position.z = 0.04 - s * 0.09 * w;
    var fy = G.air ? 0.06 : 0.035; botParts.feet[0].position.y = botParts.feet[1].position.y = fy;   /* 공중 = 발을 살짝 접는다 */
    shadow.position.y = (0.02 - (G.jy || 0)) / bot.scale.y; var ss = 1 - Math.min(0.5, (G.jy || 0) * 0.7); shadow.scale.set(ss, ss, 1);
    return moving > 0.01 || w > 0.01 || jumping || G.pushK > 0 || !!G.squeeze || turning;
  }
  /* ═══════════ 점프(v5.49 · 사용자 261004 「캐릭터가 통통 튀면 귀엽고 재미있을 것」) ═══════════
   * 오른쪽 아래 「점프」 · 키보드 Space · 높이 약 0.6m · 체공 0.45초 · 공중에서도 조그로 움직인다 · 카메라는 따라 뛰지 않는다(어지럽지 않게)
   * 오를 때 몸이 위로 늘고 · 땅에 닿으면 납작했다가 출렁 돌아온다 · 그림자는 바닥에 남아 작아진다 · 움직임 줄이기 = 늘고 줄기 없이 높이만
   * 오르다가 스탬프 블록(아래)에 머리가 닿으면 「콩」 하고 떨어진다 */
  var JUMP_V = 5.4, GRAV = 24, HEAD = 0.97;
  function jump() {
    if (!G.loaded || G.scn !== 'lobby' || G.anim || PH.on || G.air || G.squeeze || G.sheetOpen) return;
    G.air = true; G.jv = JUMP_V; G.jy = 0; G.landT = 0; G.moved = true; G.need = true; AIM.t = performance.now(); aimTip(false);   /* v5.67 점프하면 「점프!」 시간 처음부터 */
    joyNear();
  }
  /* v5.51 스태프 따라 뛰기(사용자 261004 「스태프도 살짝 웃는 표정으로 같이 통통」) · 내 캐릭터가 2m 안 스태프 앞에서 뛰면 0.15초 뒤 두 번 통통(0.3초씩) · 연달아 뛰면 이어서 맞춰 뛴다
   *   눈 = 반달(^ ^) 1.1초 · 그동안 머리 위 전파가 가장 진하게 · 룰렛 스태프의 혼자 통통(가까이 오면)은 이 동안 멈춘다(겹치지 않게) · 발동한 스태프만 계산 */
  function joyNear() {
    var p = planOf(G.pos), best = null, bd = 2.0;
    guides.forEach(function (g) { var d = Math.hypot(p[0] - g.at[0], p[1] - g.at[1]); if (d < bd && g.m.visible) { bd = d; best = g; } });
    if (!best) return;
    var u = best.m.userData, t = performance.now() + 150;
    if (!(u.joyT0 && t < u.joyEnd + 300)) u.joyT0 = t;
    u.joyEnd = Math.max(u.joyEnd || 0, t + 450); u.smileEnd = t + 1100; G.joyLog = G.joyLog || []; if (G.joyLog.length < 40) G.joyLog.push({ z: best.zone, t: Math.round(t) });
  }
  function stepJoy(u) {
    var now = performance.now(), e = now - u.joyT0, tot = Math.ceil((u.joyEnd - u.joyT0) / 300) * 300;
    if (e >= 0 && e < tot) { var fr = (e % 300) / 300; u.body.position.y = RM ? 0 : Math.sin(fr * Math.PI) * 0.12; }
    else if (e >= tot) u.body.position.y = 0;
    var sm = e >= 0 && now < u.smileEnd; if (u.smiling !== sm) { u.smiling = sm; smileSet(u.eyes, u.smiles, sm); }
    if (e >= tot && now >= u.smileEnd) { u.joyT0 = 0; u.body.position.y = 0; }
  }
  function stepJump(dt) {
    if (!G.air && !G.landT) return false;
    if (G.air) {
      var y0 = G.jy; G.jv -= GRAV * dt; G.jy += G.jv * dt;
      if (G.jv > 0) hitBlocks(y0, G.jy);
      if (G.jy <= 0) { G.jy = 0; G.air = false; G.landT = 1e-4; }
    } else { G.landT += dt; if (G.landT > 0.26) G.landT = 0; }
    return true;
  }
  /* 몸 늘고 줄기 · [x, y, z] · 부피를 지키게 y 가 늘면 x · z 가 준다 · 점프 · 착지 · 게이트 밀기 · 비집고 나가기를 한 곳에서 */
  function bodyScale(now) {
    if (RM && !G.squeeze) return [1, 1, 1];
    var y = 1;
    if (G.air) y = G.jv > 0 ? 1 + 0.13 * clamp(G.jv / JUMP_V, 0, 1) : 1 + 0.05 * clamp(-G.jv / JUMP_V, 0, 1);
    else if (G.landT) { var k = G.landT / 0.26; y = 1 - 0.24 * Math.exp(-k * 3) * Math.cos(k * Math.PI * 2.2); }
    var xz = 1 / Math.sqrt(y);
    if (G.squeeze) { var q3 = G.sqS || [1, 1, 1]; return [q3[0], q3[1], q3[2]]; }   /* v5.51 쭈압 · 푱 · 띠용(stepSqueeze 가 정한다) */
    if (G.pushK > 0) { var pk = G.pushK; return [xz * (1 + 0.16 * pk), y * (1 - 0.17 * pk), xz * (1 - 0.1 * pk)]; }
    return [xz, y, xz];
  }

  /* ═══════════ 달리기(v5.49 · 사용자 261004 「확대 축소 자리에 달리기와 점프 버튼」) ═══════════
   * 오른쪽 위 「달리기」 = 누르면 켜짐(주황) · 조그를 밀고 있는 동안 2배 속도까지 0.3초에 걸쳐 오른다 · 조그에서 손을 떼면 저절로 꺼진다(다음에 걷다가 갑자기 뛰지 않게)
   * 키보드 = Shift 를 누르는 동안 · 자동 걷기(구역 버튼 · 바닥 톡)는 달리지 않는다
   * v5.50 (사용자 261004 권장안 확정) 달리는 동안 효과 없음 · 빨라지는 것뿐(옛 v5.49 발밑 먼지 · 몸 앞으로 기울임 · 시야각 +7도는 뺐다)
   * 옛 v5.40 「앞으로 3초 밀면 저절로 달리기」는 v5.47 에서 끔(사용자 「이상하다」) · 그 코드는 이것으로 바꿨다 */
  var WALK_V = 3.2, RUN_RAMP = 0.3;
  /* v5.51 (사용자 261004 「달리기 버튼은 점프 버튼처럼 누르면 달려 나가는 버튼」) 한 번 누름 = DASH_S(0.8)초 동안 달리기 속도(걷기 x 2 = 6.4m/s)로 앞(조그가 있으면 그 방향 · 없으면 화면 위쪽 = 캐릭터가 보는 쪽)
   *   붙을 때 0.08초 · 끝 0.3초에 걸쳐 부드럽게 걷기로 · 한 번에 약 4.6m · 달리는 중 다시 누름 = 시간만 이어 붙인다(남은 시간 최대 DASH_MAX · 속도는 그대로) · 충돌은 걷기와 같은 판정(막히면 멈추거나 미끄러짐)
   *   켜 두는 상태 없음 · 판 보기 · 스탬프 카드 · 설정 · 엘리베이터 · 18F · 닫기 = 바로 그침 · 키보드 Shift(누르는 동안 · 조그와 함께)는 그대로 */
  var DASH_S = 0.8, DASH_MAX = 1.8;   /* 한 번 = 약 4.6m(60fps 실측 계산 · 191절) */
  function setRun(on) { if (on) { dash(); return; } G.dashEnd = 0; G.runOn = false; var b = $('bRun'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); } }
  function dash() {
    if (!G.loaded || G.scn !== 'lobby' || G.anim || PH.on || G.sheetOpen || G.squeeze || G.pinchOn) return;
    var now = performance.now() / 1000; G.dashEnd = Math.min(now + DASH_MAX, Math.max(now, G.dashEnd || 0) + DASH_S); G.mode = G.mode === 'auto' ? 'free' : G.mode; G.path = null; G.moved = true; G.need = true;
    G.dashLog = G.dashLog || []; if (G.dashLog.length < 50) G.dashLog.push({ t: +now.toFixed(3), x: +G.pos.x.toFixed(3), z: +G.pos.z.toFixed(3) });
    var b = $('bRun'); if (b) b.classList.add('on');
  }
  function runStick() {
    if (!(G.dashEnd > performance.now() / 1000) || G.mode === 'auto' || G.scn !== 'lobby' || G.sheetOpen || G.anim || G.squeeze) return null;
    var st = G.stick, f = G.face != null ? G.face : G.az; return st && Math.hypot(st.x, st.y) > 0.12 ? null : { x: Math.sin(G.az - f), y: -Math.cos(f - G.az) };   /* v5.51 지금 바라보는 쪽으로(화면 조그 좌표로 바꿈) */
  }
  function stepRun(dt) {
    var now = performance.now() / 1000, left = (G.dashEnd || 0) - now, st = G.stick;
    if (left > 0) { var tg = left > 0.3 ? 1 : left / 0.3; tg = tg * tg * (3 - 2 * tg); G.run = G.run < tg ? Math.min(tg, G.run + dt / 0.08) : tg; G.runOn = true; return; }
    if (G.runOn) { G.runOn = false; var b = $('bRun'); if (b) b.classList.remove('on'); }
    var want = G.runKey && st && Math.hypot(st.x, st.y) > 0.3;
    if (want) { if (!G.run) G.runAt = performance.now(); G.run = Math.min(1, G.run + dt / RUN_RAMP); }
    else G.run = Math.max(0, G.run - dt / 0.15);
  }

  /* ═══════════ 카메라 · 위에서 40도 내려다보는 고정 시점(사용자 261003 실폰 「시선이 계속 바뀌는 것보다 스카이뷰 40도가 편하다」) ═══════════
   * 방위 고정 = 북쪽(코어 쪽) 위에서 남쪽(정문 · 유리벽 판 앞면)을 본다 · 회전 없음 · 캐릭터를 부드럽게 따라 옮겨 갈 뿐이다
   * 거리 2단계(멀리 11.5m · 가까이 8m · 두 손가락 벌리기 / 오므리기) · 카메라 높이는 늘 천장(5m) 위라 벽 속 · 회색 화면이 생기지 않는다
   *   (모형은 카메라 쪽 벽 · 천장을 스스로 숨긴다 · tour-scene cutaway) · 시선을 가리는 기둥(5m)만 점점이 비운다 */
  /* 거리 2단계 · 0 = 기본 6.5m(사용자 261003 「너무 멀다 · 확대한 것보다 조금 더」 · 카메라 높이 = 6.5 x sin40 + 0.9 = 5.08m 로 천장 5m 위) · 1 = 조금 멀리 9m */
  /* v3.4(사용자 261003 「두 단계 더 줌인」): 가장 가까이 3.8m · 기본 4.8m · 멀리 8m · 카메라가 천장(5m) 아래로 내려오므로 천장은 늘 숨긴다(아래 render 앞) · 기둥 속 시점은 기둥 비움으로 */
  /* v5.51 시점 두 가지(사용자 261004) · top = 내려다보기(40도 · 지금까지) · eye = 눈높이(14도 · 정면보다 조금 내려다봄) · 기본값은 이 상수 하나 · 고른 값은 이 기기에 기억(axfTour3View) */
  var EYE_PITCH = 14 * Math.PI / 180;   /* 거리 G.dist = 3.8~8m(기본 4.8) · 확대 · 축소 버튼(누르는 동안) · 두 손가락이 연속으로 바꾼다 */
  /* v5.65 (사용자 261005 「설정의 내려다보기 시점은 없애고」) 시점 = 눈높이 하나 · 옛 내려다보기(PITCH 40도 · 바라보는 높이 0.9)는 쓰지 않는다 · 기기에 남은 axfTour3View 값은 읽지 않는다
   * v5.65 (사용자 261005 「권장대로」) 위아래 시선 · G.tilt = 정면 눈높이에서 위(+) · 아래(-)로 기운 각 · 위 TILT_UP · 아래 TILT_DN 까지 · 카메라 자리는 그대로 바라보는 점만 오르내린다 */
  var TILT_UP = 20 * Math.PI / 180, TILT_DN = 10 * Math.PI / 180;
  function camWant(dt) {
    /* 바라보는 점 = 캐릭터보다 남쪽(화면 위쪽)으로 조금 · 캐릭터는 화면 가운데 아래에 서고 앞의 판 줄이 더 넓게 보인다 */
    /* 방위 G.az · 0 = 북쪽 위에서 남쪽(정문)을 봄 · 「시점 돌리기」로 90도씩 · 화면 위 = (sin az, cos az) */
    if (PH.on && PH.ph !== 'back') return phCamWant();   /* v5.67 사진 찍기 연출 */
    var pt = EYE_PITCH, ly = 1.25;
    var c = G.pos, d = G.dist, hd = d * Math.cos(pt), y = d * Math.sin(pt), ahead = 1.4 + (d - DMIN) / (DMAX - DMIN) * 0.7, fx = Math.sin(G.az), fz = Math.cos(G.az);
    /* v5.73 (운영 261005 캡처 · 고객센터 칸 · 옛 v5.65 = 북쪽 벽선 z 11.46 하나만 막음) 카메라 받침대 = 머리(바닥 위 1.25m) → 원하는 카메라 자리 선분을 카메라 막힘 지도(cocc)로 훑어
     *   첫 벽 · 유리 · 문틀 · 가벽 · 천장 앞(0.2m 넓힘 + 0.05m)까지만 · 기둥 = 카메라 자리가 기둥 속(둘레 0.25m)이면 기둥 앞까지(가로질러 보이는 기둥은 그대로 점점이 비움)
     *   높이 · 바라보는 점도 같은 배율 k(내려다보는 각 그대로) · 당김 = 바로(벽 속 프레임 0) · 풀림 = 약 0.35초(camBoom) · 너무 가까우면 내 캐릭터 숨김(stepCam) */
    var k = G.boomOff ? 1 : camBoom(c.x + fx * (ahead - hd), y + ly, c.z + fz * (ahead - hd), dt);
    y *= k; var hk = hd * k, pe = Math.atan2(y, hk); ahead *= k;
    var lyT = ly + (G.tilt ? hk * (Math.tan(pe) - Math.tan(pe - G.tilt)) : 0);   /* 카메라 → 바라보는 점 수평 거리 = hk · 내려다보는 각 pe 를 tilt 만큼 줄인다(위로 보기) */
    return { pos: new T.Vector3(c.x + fx * (ahead - hk), y + ly, c.z + fz * (ahead - hk)), look: new T.Vector3(c.x + fx * ahead, lyT, c.z + fz * ahead) };
  }
  /* v5.73 카메라 선분 훑기 · 머리(도면 hx, hz · 높이 1.25) → (tx, ty, tz)(three 좌표) · 막히지 않고 갈 수 있는 비율 0 ~ 1 · 0.05m 걸음 · 머리 자리부터 막혔으면 0 */
  function camRay(tx, ty, tz) {
    if (!cocc) return 1;
    var sk = G.squeeze && G.scn === 'lobby' ? SQ_CAM : null;   /* v5.79 (사용자 261006 「예전엔 뒤에서 지켜봐 쭈압 하고 튕겨 나가는 모습이 보였는데 지금은 갑자기 줌인」) 게이트 비집기 동안 = 게이트 칸 안의 낮은 층(1.65m 아래 · 함 · 유리 날개)은 막힘으로 안 본다 · 높은 벽은 그대로 막는다 */
    var ox = G.pos.x + 16, oz = 6 - G.pos.z, oy = 1.25, ex = tx + 16, ez = 6 - tz, dx = ex - ox, dy = ty - oy, dz = ez - oz, L = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (L < 1e-4) return 1;
    var n = Math.ceil(L / 0.05), last = 0, f = 1;
    for (var i = 0; i <= n; i++) {
      var t = i / n, y = oy + dy * t, qx = ox + dx * t, qz = oz + dz * t, c = gi(qx, qz), sl = Math.floor(y / COCC_H), cb = c < 0 ? 0 : cocc[c];
      if (sk && qx > sk.x0 && qx < sk.x1 && qz > sk.z0 && qz < sk.z1) cb &= sk.hi;
      if (c < 0 || y >= 4.8 || (sl >= 0 && ((cb >>> sl) & 1))) { f = i ? Math.max(0, last - 0.05 / L) : 0; break; }
      last = t;
    }
    /* 기둥 · 카메라 자리가 기둥(반폭 0.55) + 0.25m 안이면 그 상자에 들어가기 전까지 */
    var px = ox + dx * f, pz = oz + dz * f, R = 0.8;
    for (var k = 0; k < PIL.length; k++) {
      var qx = PIL[k][0], qz = PIL[k][1];
      if (Math.abs(px - qx) >= R || Math.abs(pz - qz) >= R || (Math.abs(ox - qx) < R && Math.abs(oz - qz) < R)) continue;
      var t0 = 0, t1 = f, ax = [[ox, dx, qx], [oz, dz, qz]];
      for (var a = 0; a < 2; a++) { var o = ax[a][0], d = ax[a][1], q = ax[a][2]; if (Math.abs(d) < 1e-9) continue; var u = (q - R - o) / d, w = (q + R - o) / d; if (u > w) { var sw = u; u = w; w = sw; } t0 = Math.max(t0, u); t1 = Math.min(t1, w); }
      if (t0 <= t1) f = Math.max(0, Math.min(f, t0 - 0.05 / L));
      px = ox + dx * f; pz = oz + dz * f;
    }
    return f;
  }
  /* 원하는 받침대 배율 · 당김 = 바로 · 풀림 = 부드럽게(dt 없으면 바로) · G.boomK = 확인용 */
  function camBoom(tx, ty, tz, dt) {
    var f = camRay(tx, ty, tz), k0 = G.boomS == null ? f : G.boomS;
    G.boomS = f <= k0 || !dt || RM ? f : k0 + (f - k0) * (1 - Math.exp(-dt * 6));
    if (G.boomS < 0.04) G.boomS = 0.04;
    G.boomK = G.boomS; return G.boomS;
  }
  /* 손을 떼고 1초 뒤 · 걷기 시작 · 판 보기 · 장면 바꿈 = 정면(0)으로 약 0.4초 · 움직임 줄이기 = 바로 */
  function tiltHome(now) { G.tiltTo = 0; if (now || RM) G.tilt = 0; G.need = true; }
  function stepCam(dt) {
    var a0 = G.az; G.az = angLerp(G.az, G.azTo, dt && !RM ? 1 - Math.exp(-dt * (HOLD && HOLD.kind === 'rot' ? 14 : 7)) : 1); if (Math.abs(Math.atan2(Math.sin(G.azTo - G.az), Math.cos(G.azTo - G.az))) < 0.002) G.az = G.azTo;
    if (G.tiltTo && !G.tiltDrag && ((G.stick && (G.stick.x || G.stick.y)) || G.path)) G.tiltTo = 0;   /* v5.65 걷기 시작 = 정면으로 */
    var t0 = G.tilt || 0; G.tilt = t0 + ((G.tiltTo || 0) - t0) * (dt && !RM && !G.tiltDrag ? 1 - Math.exp(-dt * 8) : 1); if (Math.abs(G.tilt - (G.tiltTo || 0)) < 0.0015) G.tilt = G.tiltTo || 0;
    var w = camWant(dt), k = dt && !RM ? (G.az !== a0 || G.tilt !== t0 ? 1 : 1 - Math.exp(-dt * (5 + 3 * (G.run || 0)))) : 1;
    var moved = G.camPos.distanceToSquared(w.pos) > 1e-6 || G.look.distanceToSquared(w.look) > 1e-6;
    G.camPos.lerp(w.pos, k); G.look.lerp(w.look, k);
    if (!G.boomOff && cocc) { var gf = camRay(G.camPos.x, G.camPos.y, G.camPos.z); if (gf < 0.999) { G.camPos.x = G.pos.x + (G.camPos.x - G.pos.x) * gf; G.camPos.z = G.pos.z + (G.camPos.z - G.pos.z) * gf; G.camPos.y = 1.25 + (G.camPos.y - 1.25) * gf; G.camGuard = (G.camGuard || 0) + 1; } }   /* v5.73 따라오는 중(보간)에도 벽 속 0 · 막히면 그 자리로 바로 */
    G.camIn = !G.boomOff && !!cocc;   /* v5.73 카메라가 걸을 수 있는 공간 안 = 모형 단면(벽 숨김 · 받침) 끔(S.frame) */
    camera.position.copy(G.camPos); camera.lookAt(G.look);
    if (G.scn === 'lobby') { var hd3 = Math.hypot(G.camPos.x - G.pos.x, G.camPos.y - 1.25, G.camPos.z - G.pos.z); G.fp = G.fp ? hd3 < 1.15 : hd3 < 0.95; bot.visible = !G.fp; }   /* v5.73 머리에서 카메라까지 0.95m 안 = 1인칭(내 캐릭터 숨김 · 1.15m 넘으면 다시 · 깜빡임 없게) · 옛 v5.64.1 배율 0.3 */
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
    /* v5.58 (사용자 261004 「각 부스별로 부스 위에 또 주황색의 설명은 없어도 될 것 같아 중복된다」 · 「이런 위치 정보가 너무 정신 없다」) 부스 위 주황 구역 이름표(AX VISION · AX LAB · AX in Action · AX PLAY · EVENT · AX LOUNGE) 없앰
     *   구역 이름 = 작은 지도 · 큰 지도 · 스태프 말풍선 · 아래 「지금: …」 줄이 맡는다 · 회색 길잡이 이름표(정문 · 안내데스크)는 캐릭터가 3m 안일 때만 · 「게이트 · 엘리베이터」는 없앰(「엘리베이터 타기」 표지와 겹침) */
    (S.landmarks || []).forEach(function (l) {
      if (l.id === 'lm_check' || l.id === 'lm_gate') return;   /* 체크인 존은 시험판에서 뺌 */
      var d = document.createElement('div'); d.className = 'pin lm'; d.innerHTML = '<span class="s">' + esc(l.label) + '</span>';
      box.appendChild(d); pinEls.push({ el: d, at: S.anchors[l.id], max: 20, lm: true, near: 3.0 });
    });
  }
  var _p = new T.Vector3();
  function placePins() {
    var W = $('stage').clientWidth, H = $('stage').clientHeight, show = G.scn === 'lobby' && G.loaded;
    pinEls.forEach(function (p) {
      if (!show || !p.at || (p.near && Math.hypot(p.at.x - G.pos.x, p.at.z - G.pos.z) > p.near) || (p.near && !$('gbub').hidden)) { p.el.style.display = 'none'; return; }   /* v5.58 가까이 · 말풍선이 없을 때만 */
      var dist = p.at.distanceTo(camera.position);
      _p.copy(p.at).project(camera);
      if (_p.z > 1 || dist > p.max || Math.abs(_p.x) > 1.05 || _p.y > 1.05 || _p.y < -0.6) { p.el.style.display = 'none'; return; }
      p.el.style.display = ''; p.el.style.transform = 'translate(' + ((_p.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - _p.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
    });
  }

  /* ═══════════ 안내 챗봇(구역마다 1명 · 사용자 261003) ═══════════
   * 몸 = 파랑(현대해상 공식 HI Navy #001F5B · 사용자 261003 「안내 챗봇 몸은 파란색」 · design.md 예외는 메인이 기록) · 띠 · 안테나 공 · 눈 = 흰색 · 왼쪽 가슴 작은 가로 명찰(주황 바탕 흰 「STAFF」 · 흔들림 없음) · 전파 = 공식 Blue #418FDE(v5.75 · 사용자 261006 · 파랑 몸과 한 식구 · 옛 주황)
   * 서는 자리 = 그 구역 멈춤 자리에서 판 쪽으로 0.7m · 오른쪽으로 1.1m(통로를 막지 않게) · 내가 가까이 오면 나를 향해 돌아서고 말풍선 한 줄(앱 1F 구역 한 줄 소개 + 「이에요」) */
  var guides = [];
  function staffTex() {   /* 가로 명찰 · 주황 바탕 + 흰 「STAFF」 */
    var c = document.createElement('canvas'); c.width = 192; c.height = 72; var g = c.getContext('2d');
    g.fillStyle = '#FF7F32'; g.fillRect(0, 0, 192, 72);
    g.fillStyle = '#FFFFFF'; g.font = '800 44px "Pretendard Variable", Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STAFF', 96, 38);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  /* 머리 위 전파 원호 · 주황(기본) = 내 캐릭터 · 인터뷰 TV 챗봇 · 파랑 = 스태프 챗봇(v5.75 사용자 261006 · 현대해상 공식 Blue #418FDE · 파랑 몸과 한 식구) · 색마다 텍스처 하나를 같이 쓴다 */
  var ARC = {}, ARC_STAFF = '#418FDE';
  function arcTex(col) {
    col = col || '#FF7F32';
    if (ARC[col]) return ARC[col];
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    if (col === ARC_STAFF) { g.strokeStyle = '#FFFFFF'; g.lineWidth = 21; g.lineCap = 'round'; g.beginPath(); g.arc(64, 84, 48, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }   /* v5.79 (사용자 261006 「룰렛 주황 면 앞에서 회갈색으로 탁해짐」) 스태프 전파 밑에 조금 더 굵은 흰 테 · 사라지며 옅어져도 바탕과 섞이지 않는다 · 내 캐릭터 · 인터뷰 TV 주황 전파는 그대로 */
    g.strokeStyle = col; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); g.arc(64, 84, 48, Math.PI * 1.22, Math.PI * 1.78); g.stroke();
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; ARC[col] = t; return t;
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
    var eyes = [], smiles = [];
    [-1, 1].forEach(function (s) { var e = new T.Mesh(new T.SphereGeometry(0.046, 12, 10), M.ink); e.scale.set(1, 1.15, 0.45); e.position.set(s * 0.12, 0.55, 0.305); body.add(e); eyes.push(e); var sm = smileEye(M.ink, s); body.add(sm); smiles.push(sm); });
    [-1, 1].forEach(function (s) { var f = new T.Mesh(new T.SphereGeometry(0.085, 12, 8), M.foot); f.scale.set(1, 0.6, 1.35); f.position.set(s * 0.15, 0.035, 0.04); g.add(f); });
    if (SHOW_BADGE) { var badge = new T.Mesh(new T.BoxGeometry(0.15, 0.055, 0.012), [M.edge, M.edge, M.edge, M.edge, M.card, M.edge]); badge.position.set(0.14, 0.4, 0.315); badge.rotation.y = Math.atan2(0.14, 0.31); body.add(badge); }
    /* 머리 위 전파 · 「띠로 띠로」 · 위로 열린 원호 3겹이 차례로 퍼졌다 사라진다(스프라이트 · 늘 카메라를 봄) */
    var waves = [0, 1, 2].map(function () { var sp = new T.Sprite(new T.SpriteMaterial({ map: arcTex(ARC_STAFF), transparent: true, depthWrite: false, opacity: 0 })); sp.position.y = 1.1; sp.scale.set(0.3, 0.3, 1); body.add(sp); return sp; });
    /* 룰렛 자리 챗봇만 · 호객 · v5.49 옛 「손 흔들기」(가는 팔 + 남색 공)는 몸 뒤에서 꼬리 · 두 번째 안테나처럼 보여 뺐다(사용자 261004 「얘 왜 파란 꼬리 있냐」) · 대신 가까이 오면 제자리에서 통통 뛴다 */
    var arm = null;
    g.userData = { body: body, waves: waves, ph: Math.random(), arm: arm, hop: !!hand, eyes: eyes, smiles: smiles, joyT0: 0, joyEnd: 0, smileEnd: 0 };
    g.scale.setScalar(0.95);
    return g;
  }
  function buildGuides() {
    STOPS.forEach(function (s, k) {
      if (!s.zone || s.zone === 'cafe' || !s.look || s.noGuide) return;
      var fx = s.look[0] - s.x, fz = s.look[1] - s.z, fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      var rx = fz, rz = -fx;   /* 판을 보는 사람의 오른쪽(도면 좌표 · z 북쪽) */
      var gx = s.gAt ? s.gAt[0] : s.x + rx * 1.1 + fx * 0.7, gz = s.gAt ? s.gAt[1] : s.z + rz * 1.1 + fz * 0.7, q = nearestFree(gx, gz) || [gx, gz];   /* v5.79 gAt = 자리 직접(VISION) */
      var m = makeGuide(!!s.hand); m.position.copy(toThree(q[0], q[1]));
      var h0 = s.gFace ? Math.atan2(s.gFace[0] - q[0], -(s.gFace[1] - q[1])) : Math.atan2(-fx, fz);   /* v5.79 gFace = 그 점을 본다 · 평소 = 통로(판 반대쪽)를 본다 · three 방향 = (sin h, cos h), 도면 z 북쪽 = three -z */
      m.rotation.y = h0; S.lobby.add(m);
      /* 걸음 막기 · v5.38 칸 번호로 꽉 찬 원(옛 코드는 소수 좌표를 0.1m 씩 더해 칸을 구해 반올림 오차로 원 안에 빈칸이 줄줄이 생겼고, 캐릭터가 그 틈으로 스태프를 뚫고 지나갔다 · 사용자 261003 「캐릭터가 겹치는 버그」) */
      blockDisc(q[0], q[1], GUIDE_R);
      guides.push({ m: m, stop: k, id: s.id, zone: s.zone, spot: s.spot || '', at: [q[0], q[1]], h: h0, h0: h0, text: s.say || ZT[s.zone] || '', go: s.go == null ? '자세히 보기' : s.go });
    });
  }
  /* ═══════════ v5.79 미팅룸 1 · 2 · 3 안 대화(사용자 261006) ═══════════
   * 방마다 스태프 챗봇 1명(파랑 · makeGuide) + 직원 1명(같은 모양 · 무채색 회색 · makeCritter)이 탁자를 사이에 두고 마주 앉아 대화 · 글자 · 이름 없음 · 누를 수 없음 · 말풍선 없음
   * 자리 = 모형 탁자 옆 의자(wing_body 실측 261006 · 앉은 높이 0.45) · 대각선으로 마주 봐 유리 밖에서 둘 다 보인다 · 방 안은 걷는 곳이 아니라 통로를 막지 않는다
   * 말하는 쪽 = 2.4초씩 번갈아 · 작게 통통 + 머리 위 말줄임 점 3개(흰 알약 · 점이 차례로 짙어짐 · 머리 바로 위 1.62m · 유리 뒤에 그려 반투명 유리에 흐려지지 않음 renderOrder 3) · 움직임 줄이기 = 통통 없이 가운데 점만
   * 내 캐릭터가 방에서 10m 안일 때만 보이고 움직인다 */
  var ROOMS = [
    { s: [1.15, 14.9], n: [2.65, 14.1] },   /* 미팅룸 2 · 탁자 x 1.45 ~ 2.35 · z 13.7 ~ 16.1 · 의자 서쪽 x 1.15 · 동쪽 x 2.65 · z 14.1 · 14.9 · 15.7 */
    { s: [1.15, 20.5], n: [2.65, 19.7] },   /* 미팅룸 1 · 탁자 z 19.3 ~ 21.7 · 의자 z 19.7 · 20.5 · 21.3 */
    { s: [5.05, 25.6], n: [6.15, 24.1] }    /* 미팅룸 3 · 탁자 x 4.8 ~ 6.4 · z 24.4 ~ 25.3 · 의자 x 5.05 · 5.6 · 6.15 · 남쪽 z 24.1 · 북쪽 z 25.6 */
  ], ROOM_SEAT = 0.45, ROOM_PER = 2.4, ROOM_DOT_Y = 1.62, ROOM_NEAR = 10, roomTalk = [], DOTS_TEX = null;
  function dotsTex(k) {   /* 흰 알약 + 점 3개 · k = 짙은 점(0 ~ 2) */
    var c = document.createElement('canvas'); c.width = 128; c.height = 64; var g = c.getContext('2d');
    g.fillStyle = '#FFFFFF'; g.strokeStyle = '#C4C9CF'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 8); g.lineTo(96, 8); g.arc(96, 32, 24, -Math.PI / 2, Math.PI / 2); g.lineTo(32, 56); g.arc(32, 32, 24, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke();
    [40, 64, 88].forEach(function (x, i) { g.fillStyle = i === k ? '#4E5359' : '#B4B8BC'; g.beginPath(); g.arc(x, 32, 7.5, 0, Math.PI * 2); g.fill(); });
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function roomFace(m, a, b) { m.rotation.y = Math.atan2(b[0] - a[0], -(b[1] - a[1])); }
  function buildRooms() {
    DOTS_TEX = [0, 1, 2].map(dotsTex);
    ROOMS.forEach(function (r, i) {
      var g = new T.Group(); g.name = 'roomTalk';
      var st = makeGuide(false); st.userData.waves.forEach(function (w) { w.visible = false; });
      var nb = makeCritter(0xD5D8DC, 0x6B7077, 0x4E5359);   /* 직원 = 무채색(주황 · 파랑 아님) */
      [[st, r.s, r.n], [nb, r.n, r.s]].forEach(function (q) { q[0].position.copy(toThree(q[1][0], q[1][1])); q[0].position.y = ROOM_SEAT; roomFace(q[0], q[1], q[2]); g.add(q[0]); });
      var dots = new T.Sprite(new T.SpriteMaterial({ map: DOTS_TEX[1], transparent: true, depthWrite: false })); dots.scale.set(0.34, 0.17, 1); dots.renderOrder = 3; g.add(dots);   /* 유리(renderOrder 2 · 깊이 안 씀) 다음에 그린다 */
      S.lobby.add(g);
      roomTalk.push({ g: g, s: st, n: nb, dots: dots, c: [(r.s[0] + r.n[0]) / 2, (r.s[1] + r.n[1]) / 2], ph: i * 0.37 });
    });
  }
  function stepRooms() {
    if (!roomTalk.length) return false;
    var p = planOf(G.pos), any = false, ck = G.clock || 0;
    roomTalk.forEach(function (r) {
      var on = Math.hypot(p[0] - r.c[0], p[1] - r.c[1]) < ROOM_NEAR; if (r.g.visible !== on) r.g.visible = on; if (!on) return; any = true;
      var u = ck / ROOM_PER + r.ph, who = Math.floor(u) % 2, f = u - Math.floor(u), sp = who ? r.n : r.s, ls = who ? r.s : r.n;
      ls.userData.body.position.y = 0;
      sp.userData.body.position.y = RM || f > 0.8 ? 0 : Math.abs(Math.sin(f * Math.PI * 4)) * 0.035;
      r.dots.position.set(sp.position.x, ROOM_DOT_Y, sp.position.z);
      r.dots.visible = f < 0.88;
      r.dots.material.map = DOTS_TEX[RM ? 1 : Math.floor(ck * 3.3) % 3];
    });
    return any;
  }
  /* v5.49 (사용자 261004 「회사의 방향이에요(자세히 보기) 이런 식」) 말풍선 = 무엇이 있는지 한마디 + 오른쪽 「자세히 보기」 한 줄 · 옛 「~을 보는 곳이에요」보다 짧게 */
  var STAIR = { id: 'stairs', at: [13.4, 10.3], r: 3.0, m: { position: new T.Vector3(13.4 - 16, 0.6, 6 - 11.2) }, text: '오늘은 계단 어떠세요?', go: '스탬프 받기', stamp: 'st', zone: null, spot: '' };
  var ZT = { vision: '회사의 방향이에요', lab: 'DAP 과제들이에요', action: 'AI 업무 사례예요', play: 'AI 직접 써 보기예요', event: '사진 · 룰렛 · 타자왕이에요', lounge: '업무 고민 상담이에요' };
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
      gd.m.visible = d < 22 && !gd.m.userData.occ;   /* v5.54 판 보기 줌 화면 안이면 잠깐 숨김(occDyn) */
      if (gd.m.visible) {   /* 전파 · 평소 1.7초에 한 번 「띠로 띠로」(세 겹) · 가까이 오면 1.0초 · 더 진하게 · 동작 줄이기 = 가운데 한 겹 정지 */
        waveStep(u.waves, u.joyT0 ? 1 : f, 0.35, u.ph, 1.08);
        if (u.hop && !u.joyT0) { var hp = near && !RM ? Math.abs(Math.sin((G.clock || 0) * 6.5)) : 0; u.body.position.y = hp * 0.09; u.body.scale.set(1 + (hp < 0.15 && near && !RM ? 0.05 : 0), 1, 1); }   /* 룰렛 스태프 = 통통(호객) */
        if (u.joyT0) stepJoy(u);
        busy = true;
      }
      if (near) talk = gd;
    });
    /* v5.49 계단실(서쪽 코어 대리석 벽 · 사용자 261004 「여기 계단실이거든 · 이 앞에 가면 계단 오르기 하면 스탬프 주니까 오늘은 계단 어떠시냐는 긍정의 제안」)
     * 벽 앞 3m 안 · 스태프 말풍선이 없을 때 · 벽 위에 같은 말풍선 「오늘은 계단 어떠세요? · 스탬프 받기」 · 누르면 계단 스탬프 카드(받는 법 · 계단 안내) */
    /* v5.58 (사용자 261004 「계단이용 점프로 톡 오늘은 계단 어떠세요? 스탬프 받기 이렇게 같이 나오는 위치가 어지럽게 정보가 많아」) 계단실 말풍선 없앰 · 계단 블록만 떠 있다 */
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
  /* v5.58 (사용자 261004 「내 시선에 NPC가 안 보이면 부스 소개 말풍선이 안 보이거나 다른 방식이면 · 내 눈에 없을 때 헷갈리는 것 같아」)
   *   스태프 머리가 화면 안이고 벽 · 부스에 가리지 않을 때만 말풍선 · 아니면 화면 가장자리에 작은 주황 점 화살(글자 없음 · 스태프 쪽) · 가림 = 카메라 → 머리 광선(0.25초마다 · 유리 · 비워진 기둥 · 캐릭터 제외)
   *   깜빡임 막기 = 0.2초 넘게 같은 상태일 때만 바꿈 · 나타날 때 0.18초 페이드 */
  var GV = { t: 0, vis: false, want: false, since: 0, gd: null }, _gr = new T.Raycaster();
  function guideSeen(gd, now) {
    if (GV.gd !== gd) { GV.gd = gd; GV.t = 0; GV.vis = false; GV.want = false; GV.since = now; }
    if (now - GV.t > 250) {
      GV.t = now; var head = _ia.copy(gd.m.position); head.y = 0.95; var pr = _ib.copy(head).project(camera), ok = pr.z < 1 && Math.abs(pr.x) < 0.94 && pr.y < 0.94 && pr.y > -0.6;
      if (ok) {
        var dir = _ic.copy(head).sub(camera.position), L = dir.length(); dir.normalize(); _gr.set(camera.position, dir); _gr.far = L - 0.35; _gr.camera = camera;   /* 스프라이트(전파 · 빛)는 카메라가 있어야 잰다 */
        var hits = _gr.intersectObject(S.lobby, true);
        for (var i = 0; i < hits.length; i++) { var o = hits[i].object, mt = o.material; if (!isShown(o) || o === shadow || (mt && mt.transparent && mt.opacity < 0.5) || (o.userData && o.userData.door) || /^(stampBlock|lookFrame|occGhost|tvScreen|motScreen)$/.test(o.name)) continue; var pn = planOf(hits[i].point), pi = PIL.findIndex(function (q) { return Math.abs(q[0] - pn[0]) < 0.8 && Math.abs(q[1] - pn[1]) < 0.8; }); if (pi >= 0 && G.fade[pi] < 0.5) continue; if (hits[i].point.y < 0.05) continue; ok = false; break; }
      }
      if (ok !== GV.want) { GV.want = ok; GV.since = now; }
    }
    if (GV.want !== GV.vis && now - GV.since > 200) GV.vis = GV.want;
    return GV.vis;
  }
  /* v5.84 (최초 진입 가볍게 · 개편안 2-8) 첫 5분 안내를 덜 · 말풍선 = 구역(스태프)당 이번 방문 1번 · 3.5초 뒤 흐려짐 · 「자세히 보기」 단추는 그대로
   *   방향점 = 둘러보기를 연 뒤 90초 숨김 · 그 뒤 한 번 나타나면 최대 5초 · 「더 힘내세요!」 = 이번 방문 3번까지
   *   방문 = 둘러보기를 새로 열 때(앱 화면에서 뒤로 돌아온 restore 는 같은 방문) */
  var VIS = { t0: 0, bub: {}, dirGd: null, dirAt: 0, cheerN: 0 }, BUB_MS = 3500, BUB_FADE = 400, DIR_WAIT = 90000, DIR_MS = 5000, CHEER_MAX = 3;
  function visitReset() { VIS.t0 = performance.now(); VIS.bub = {}; VIS.dirGd = null; VIS.dirAt = 0; VIS.cheerN = 0; VIS.seen = {}; }
  /* v5.84 (사용자 261006 「1층을 다 둘러보셨으면 엘리베이터를 타고 다른 층으로 이동해 보세요라는 권고」 · 메인 권장안) 엘리베이터 권유 한 번 · 막지 않음
   *   조건 = 이번 방문에 1층 구역 멈춤 자리 70% 이상(3m 안) 들르고 3분 지남 · 또는 5분 지남 · 이 기기에서 처음(axfTour3ElevTip) · 엘리베이터를 탄 적 없음(axfTour3Elev)
   *   로비에서만 · 포토부스 근처 · 연출 · 시트 · 카드 · 도움말 · 한 줄 힌트 · 큰 지도 동안은 기다림 · 8초 뒤 저절로 사라짐 · 그동안 작은 지도 엘리베이터 자리 강조
   *   「엘리베이터로 가기」 = 가장 가까운 엘리베이터(게이트 앞 · 방화문 앞)까지 자동 걷기(walkTo) · 닫기 × · 움직임 줄이기 = 움직임 없이 나타남 */
  var ETIP = { iv: 0, t: 0 }, ETIP_MIN = 180000, ETIP_MAX = 300000, ETIP_RATE = 0.7, ETIP_MS = 8000, ETIP_R = 3.0, ETIP_TO = [[18.4, 9.7], [28.7, 17.3]];
  function etipTick() {
    if (!G.open || !G.loaded || G.scn !== 'lobby') return;
    var p = planOf(G.pos), zs = STOPS.filter(function (s) { return s.zone; });
    zs.forEach(function (s) { if (Math.hypot(s.x - p[0], s.z - p[1]) < ETIP_R) VIS.seen[s.id] = 1; });
    if (store.get('axfTour3ElevTip') === '1' || store.get('axfTour3Elev') === '1' || !$('etip').hidden) return;
    var el = performance.now() - VIS.t0, rate = Object.keys(VIS.seen).length / (zs.length || 1);
    if (!((el >= ETIP_MIN && rate >= ETIP_RATE) || el >= ETIP_MAX)) return;
    if (PH.on || PH.near || SH || SCARD || G.anim || G.squeeze || G.bigMap || EV.seq || !$('help').hidden || !$('hint').hidden || !$('pola').hidden) return;   /* 다음 틱에 다시 */
    etipShow();
  }
  function etipShow() {
    store.set('axfTour3ElevTip', '1'); G.etipN = (G.etipN || 0) + 1;
    var e = $('etip'); e.hidden = false; e.classList.toggle('in', !RM); ROOTEL.classList.add('etip-on');
    clearTimeout(ETIP.t); ETIP.t = setTimeout(etipHide, ETIP_MS);
  }
  function etipHide() { clearTimeout(ETIP.t); var e = $('etip'); if (e) { e.hidden = true; e.classList.remove('in'); } if (ROOTEL) ROOTEL.classList.remove('etip-on'); }
  function etipGo() {
    etipHide(); if (!G.loaded || G.scn !== 'lobby' || PH.on) return;
    var p = planOf(G.pos), q = ETIP_TO.reduce(function (a, b) { return Math.hypot(b[0] - p[0], b[1] - p[1]) < Math.hypot(a[0] - p[0], a[1] - p[1]) ? b : a; });
    walkTo(q[0], q[1]); G.etipGo = q;
  }
  function placeDir(gd) {   /* 가장자리 방향 점 · 스태프 쪽 */
    var d = $('gdir'); if (!d) return;
    var now = performance.now();
    if (gd && gd !== VIS.dirGd) { VIS.dirGd = gd; VIS.dirAt = now; }
    if (!gd || now - VIS.t0 < DIR_WAIT || now - VIS.dirAt > DIR_MS) { if (!gd) VIS.dirGd = null; if (!d.hidden) d.hidden = true; return; }
    var W = $('stage').clientWidth, H = $('stage').clientHeight; _p.copy(gd.m.position); _p.y = 0.9; _p.project(camera);
    var x = _p.x, y = _p.y; if (_p.z > 1) { x = -x; y = -y; }
    var m = Math.max(Math.abs(x) / 0.86, Math.abs(y) / 0.86, 1e-3); if (m < 1 && _p.z <= 1) m = 1; x /= m; y /= m;
    var sx = (x + 1) / 2 * W, sy = (1 - y) / 2 * H; sy = clamp(sy, 70, H - 240);
    d.hidden = false; d.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + (Math.atan2(-y, x) * 180 / Math.PI).toFixed(1) + 'deg)';
  }
  function placeBubble() {
    var b = $('gbub');
    if (PH.near && !PH.on && !G.anim && G.scn === 'lobby') { phBubble(b); return; }   /* v5.84 포토부스 근처 = 「여기서 같이 사진 찍어요」(이번 방문 1번) */
    if (!G.talk || G.anim || G.scn !== 'lobby') { if (!b.hidden) b.hidden = true; placeDir(null); return; }
    var gd = G.talk, now = performance.now(), b0 = VIS.bub[gd.id];
    if (!gd.stamp && b0 && now - b0 > BUB_MS) { if (!b.hidden) { b.hidden = true; b.classList.remove('out'); } placeDir(null); return; }   /* v5.84 이번 방문에 이미 한 번 말했다 */
    var seen = gd.stamp || guideSeen(gd, now);
    if (!seen) { if (!b.hidden) b.hidden = true; placeDir(gd); return; }
    placeDir(null);
    if (!gd.stamp) { if (!b0) VIS.bub[gd.id] = b0 = now; b.classList.toggle('out', now - b0 > BUB_MS - BUB_FADE); }
    _p.copy(gd.m.position); _p.y = 1.72; _p.project(camera);   /* 전파(머리 위 1.0~1.5m)가 보이게 그 위에 */
    if (_p.z > 1) { b.hidden = true; return; }
    if (b.getAttribute('data-z') !== gd.id) { b.setAttribute('data-z', gd.id); $('gbubT').textContent = gd.text; var go = b.querySelector('.go'); go.textContent = gd.go; go.hidden = !gd.go || !gd.stamp; }   /* v5.54 구역 스태프 = 한마디만(「자세히 보기」는 아래 단추 하나) · 계단 「스탬프 받기」만 알약 */
    b.hidden = false;
    var W = $('stage').clientWidth, H = $('stage').clientHeight, bw = b.offsetWidth || 220, x = clamp((_p.x + 1) / 2 * W, bw / 2 + 8, W - bw / 2 - 8), y = Math.max((1 - _p.y) / 2 * H, b.offsetHeight + 8);
    var lk = $('look'); if (lk && !lk.hidden) { var lt = lk.offsetTop, ll = lk.offsetLeft, lw = lk.offsetWidth; if (y + 7 > lt - 6 && y - b.offsetHeight < lt + lk.offsetHeight && x + bw / 2 > ll - 4 && x - bw / 2 < ll + lw + 4) y = Math.max(b.offsetHeight + 8, lt - 13); }   /* v5.54 자세히 보기 단추와 겹치면 단추 위로 · v5.58 단추가 어디든 */
    b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
  }

  function phBubble(b) {
    var now = performance.now(), b0 = VIS.bub.photo; placeDir(null);
    if (b0 && now - b0 > BUB_MS) { if (!b.hidden) { b.hidden = true; b.classList.remove('out'); } return; }
    _p.copy(toThree(1.3, PB.at[1])); _p.y = 1.35; _p.project(camera);
    if (_p.z > 1) { b.hidden = true; return; }
    if (!b0) VIS.bub.photo = b0 = now;
    if (b.getAttribute('data-z') !== 'photo') { b.setAttribute('data-z', 'photo'); $('gbubT').textContent = PH_SAY; b.querySelector('.go').hidden = true; }
    b.hidden = false; b.classList.toggle('out', now - b0 > BUB_MS - BUB_FADE);
    var W = $('stage').clientWidth, H = $('stage').clientHeight, bw = b.offsetWidth || 200, x = clamp((_p.x + 1) / 2 * W, bw / 2 + 8, W - bw / 2 - 8), y = Math.max((1 - _p.y) / 2 * H, b.offsetHeight + 8);
    b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
  }

  /* ═══════════ 전환 막(v5.51 · 사용자 261004 「앱에서 사용된 다른 요소를 활용해서 넘어가고 있다는 것을」) ═══════════
   * 앱 로그인 화면과 같은 주황 면 + 점 격자(design.md §2 「도트 격자」 · A-5 3-1 점등) · 격자 자리는 움직이지 않고 점의 크기 · 밝기만 바뀐다
   *   덮기 = 시작점에서 물결처럼 점이 커져 서로 붙으며 화면을 덮는다 · 걷기 = 거꾸로 점이 작아지며 장면이 드러난다
   *   덮인 동안 = 바탕보다 한 단계 밝은 주황 격자 점 · 불러오기 = 가운데부터 흰 점이 켜지는 비율이 진행률(숫자는 작게 · 전체 크기를 모르면 숫자 없이 흰 점 물결만)
   *   판 보기 다이브 = 바탕 없이 주황 점 물결만(들어갈 때 판에서 퍼지고 · 나올 때 판으로 모인다)
   * 쓰는 곳 = 둘러보기 들어가기(불러오기) · 나가기 · 18F 오가기 · 바로 옮기기 · 엘리베이터 타기 · 내리기 · 판 보기 · 움직임 줄이기 = 0.15초 페이드
   * 캔버스 2D 하나 · 움직이는 동안만 그린다 · 3D 불러오기를 막지 않는다(점 약 1,300개 · 사각형 채우기뿐) */
  var VL = { k: 1, from: 1, to: 1, t0: 0, dur: 0, ox: 0.5, oy: 0.5, prog: null, rip: null, raf: 0, cbs: [], grid: null, big: false, fadeT: 0 };
  var VC = { orange: '#FF7F32', dot: '#FF9450', lit: '#FFFFFF' };
  function vlEase(x) { return 1 - Math.pow(1 - x, 3); }
  function vlGrid() {
    var cv = $('veilCv'); if (!cv) return null;
    var W = window.innerWidth || 390, H = window.innerHeight || 800, r = Math.min(2, window.devicePixelRatio || 1);
    if (VL.grid && VL.grid.W === W && VL.grid.H === H) return VL.grid;
    cv.width = Math.round(W * r); cv.height = Math.round(H * r);
    var p = clamp(W / 24, 14, 22), cols = Math.ceil(W / p) + 1, rows = Math.ceil(H / p) + 1, cells = [], cx = W / 2, cy = H / 2;
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) { var px = (x + 0.5) * p, py = (y + 0.5) * p; cells.push({ x: px, y: py, j: Math.random(), dc: Math.hypot(px - cx, py - cy) }); }
    var ord = cells.slice().sort(function (a, b) { return a.dc + a.j * p * 2 - (b.dc + b.j * p * 2); }); ord.forEach(function (c, i) { c.rk = i / ord.length; });
    VL.grid = { W: W, H: H, r: r, p: p, cells: cells, cv: cv };
    return VL.grid;
  }
  function vlDraw(now) {
    var g = vlGrid(); if (!g) return; var c = g.cv.getContext('2d'), p = g.p, W = g.W, H = g.H;
    c.setTransform(g.r, 0, 0, g.r, 0, 0); c.clearRect(0, 0, W, H);
    var el = $('black'), on = VL.k > 0.001 || !!VL.rip;
    el.classList.toggle('off', !on); if (!on) return;
    var ox = VL.ox * W, oy = VL.oy * H, md = Math.max(Math.hypot(ox, oy), Math.hypot(W - ox, oy), Math.hypot(ox, H - oy), Math.hypot(W - ox, H - oy)) || 1, B = 0.32;
    if (VL.k >= 0.999) {
      c.fillStyle = VC.orange; c.fillRect(0, 0, W, H);
      var pr = VL.prog, ring = (now / 1700) % 1, d0 = p * 0.16;
      g.cells.forEach(function (q) {
        var lit = pr == null ? 0 : pr < 0 ? Math.max(0, 1 - Math.abs(q.rk - ring) / 0.07) : (q.rk < pr ? 1 : 0);
        if (lit > 0.02) { var s2 = p * (0.18 + 0.14 * lit); c.globalAlpha = 0.35 + 0.6 * lit; c.fillStyle = VC.lit; c.fillRect(q.x - s2 / 2, q.y - s2 / 2, s2, s2); c.globalAlpha = 1; }
        else { c.fillStyle = VC.dot; c.fillRect(q.x - d0 / 2, q.y - d0 / 2, d0, d0); }
      });
    } else if (VL.k > 0.001) {
      c.fillStyle = VC.orange;
      g.cells.forEach(function (q) {
        var d = Math.hypot(q.x - ox, q.y - oy) / md + q.j * 0.05, a = clamp((VL.k * (1 + B) - d) / B, 0, 1); if (a <= 0) return;
        var s2 = p * (0.16 + 0.9 * vlEase(a)); c.fillRect(q.x - s2 / 2, q.y - s2 / 2, s2, s2);
      });
    }
    if (VL.rip) {   /* 판 보기 다이브 · 바탕 없이 주황 점 물결 */
      var R = VL.rip, t = clamp((now - R.t0) / R.dur, 0, 1), w = R.dir === 'in' ? vlEase(t) : 1 - vlEase(t), rx = R.x, ry = R.y, rm = Math.max(Math.hypot(rx, ry), Math.hypot(W - rx, ry), Math.hypot(rx, H - ry), Math.hypot(W - rx, H - ry)) || 1;
      c.fillStyle = VC.orange;
      g.cells.forEach(function (q) {
        var d = Math.hypot(q.x - rx, q.y - ry) / rm, b = 1 - Math.abs(d - w) / 0.11; if (b <= 0) return;
        var s2 = p * 0.34 * b; c.globalAlpha = Math.min(1, b * (1 - t * 0.6) + 0.15); c.fillRect(q.x - s2 / 2, q.y - s2 / 2, s2, s2);
      });
      c.globalAlpha = 1;
    }
  }
  function vlTick() {
    if (VL.raf) return;
    var f = function (now) {
      VL.raf = 0; var busy = false;
      if (VL.dur) { var t = clamp((now - VL.t0) / VL.dur, 0, 1); VL.k = VL.from + (VL.to - VL.from) * t; if (t >= 1) { VL.dur = 0; VL.k = VL.to; var cb = VL.cbs; VL.cbs = []; cb.forEach(function (fn) { setTimeout(fn, 0); }); } else busy = true; }
      if (VL.rip) { if (now - VL.rip.t0 < VL.rip.dur) busy = true; else VL.rip = null; }
      if (VL.k >= 0.999 && VL.prog != null && G.open) busy = true;   /* 불러오는 동안 · 흰 점 물결 */
      vlDraw(now);
      if (busy) VL.raf = requestAnimationFrame(f);
    };
    VL.raf = requestAnimationFrame(f);
  }
  function veilSet(k) { VL.dur = 0; VL.k = VL.from = VL.to = k; var cb = VL.cbs; VL.cbs = []; var el = $('black'); if (el) { el.style.transition = 'none'; el.style.opacity = ''; } vlDraw(performance.now()); cb.forEach(function (fn) { setTimeout(fn, 0); }); if (k > 0 && VL.prog != null) vlTick(); }
  function veilGo(to, ms, o, cb) {
    var el = $('black'); if (!el) { if (cb) setTimeout(cb, 0); return; }
    if (o) { VL.ox = clamp(o.x / (window.innerWidth || 1), 0, 1); VL.oy = clamp(o.y / (window.innerHeight || 1), 0, 1); } else { VL.ox = 0.5; VL.oy = 0.5; }
    if (RM) {   /* 움직임 줄이기 = 짧은 페이드 */
      VL.dur = 0; VL.cbs.forEach(function (fn) { setTimeout(fn, 0); }); VL.cbs = [];
      if (to > 0) { VL.k = VL.to = 1; vlDraw(performance.now()); el.style.transition = 'none'; el.style.opacity = '0'; el.getBoundingClientRect(); el.style.transition = 'opacity .15s'; el.style.opacity = '1'; setTimeout(function () { el.style.transition = ''; if (cb) cb(); }, 160); }
      else { el.style.transition = 'opacity .15s'; el.style.opacity = '0'; setTimeout(function () { VL.k = VL.to = 0; el.style.transition = 'none'; el.style.opacity = ''; vlDraw(performance.now()); if (cb) cb(); }, 160); }
      return;
    }
    el.style.transition = 'none'; el.style.opacity = '';
    VL.from = VL.k; VL.to = to; VL.t0 = performance.now(); VL.dur = Math.max(1, ms * Math.abs(to - VL.k)); if (cb) VL.cbs.push(cb);
    vlTick();
  }
  function veilCover(ms, o, cb) { veilGo(1, ms, o, cb); }
  function veilReveal(ms, o, cb) { veilGo(0, ms, o, cb); }
  function veilText(t, big) { var e = $('blackT'); if (!e) return; e.textContent = t || ''; e.classList.toggle('on', !!big && !!t); }
  function veilProg(p) {   /* null = 표시 없음 · -1 = 전체 크기 모름(숫자 없이 흰 점 물결) · 0~1 = 진행률(흰 점 비율 + 작은 숫자) */
    VL.prog = p; var n = $('veilN'); if (n) n.textContent = p == null ? '' : p < 0 ? '불러오는 중' : '불러오는 중 ' + Math.round(p * 100) + '%';
    if (p != null && VL.k >= 0.999) vlTick();
  }
  function veilRipple(r, dir) {
    if (RM || !r) return; VL.rip = { x: r.left + r.width / 2, y: r.top + r.height / 2, dir: dir, t0: performance.now(), dur: dir === 'in' ? 420 : 360 }; vlTick();
  }

  /* ═══════════ 판 앞을 가리는 물체 잠깐 비키기(v5.54 · v5.53 결정 1 「VISION TV 스탠드가 첫 판 앞을 가린다 · 줌 동안 그 TV 만 숨기고 나올 때 다시」 · 권장안 승인) ═══════════
   * 불러올 때 한 번 · 모형 구역 몸체(zone_*)에서 판 줄 앞 0.2m 밖 · 바닥 위(8cm 넘음) 삼각형 = 앞 물체(TV 스탠드 · 안내 데스크) · 이어진 덩어리로 묶는다
   *   전수 확인(261004 · 줌 끝 카메라에서 판 쪽 81줄 광선): 판 2(VISION TV) · 15(in Action TV) · 23 · 28(PLAY TV) · 24~27 · 29~32(PLAY 안내 데스크) · 20 · 21(LOUNGE 데스크) · LAB 은 없음
   * 들어갈 판 정면 상자(판 폭 + 양옆 0.45m · 판에서 줌 끝 카메라 + 0.1m)에 걸친 덩어리 + 그 안 TV 화면만 뺀다 · 다른 판 앞 물체 · 바닥 표시는 그대로
   *   들어가기 = 줌 0.1~0.5 동안 흐려지며 사라짐(TV 화면은 먼저 꺼짐) · 나오기 = 0.5~0.9 동안 다시 나타남 · 끝나면 삼각형 순서 원래대로
   *   캐릭터 · 스태프 · 스탬프 블록 = 줌 끝 화면 안(판과 줌 끝 카메라 사이)이면 줌 가운데부터 숨김 · 카메라가 가까이 지나가도 숨김(캐릭터 0.8m · 블록 · 스태프 1.6m)
   *   그리기 호출 수 그대로(같은 메시의 그리는 범위만 바꿈 · 흐려지는 동안만 덧그림 · 덧그림 재질은 불러올 때 미리 셰이더를 만든다) */
  var OCC = null, OCCA = null;
  function occBuild() {
    if (OCC) return OCC; OCC = [];
    var a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
    S.lobby.updateMatrixWorld(true);
    S.lobby.traverse(function (m) {
      if (!m.isMesh || !/^zone_/.test(m.name) || !m.geometry.index || Array.isArray(m.material)) return;
      var z = D.Z(m.userData && m.userData.zone); if (!z || z.id === 'event' || z.id === 'cafe' || !z.rows.length) return;
      var g = m.geometry, ix = g.index.array, P = g.attributes.position, nt = ix.length / 3, par = {}, tris = [], bx = {};
      function root(q) { while (par[q] !== q) { par[q] = par[par[q]]; q = par[q]; } return q; }
      for (var t = 0; t < nt; t++) {
        a.fromBufferAttribute(P, ix[3 * t]).applyMatrix4(m.matrixWorld); b.fromBufferAttribute(P, ix[3 * t + 1]).applyMatrix4(m.matrixWorld); c.fromBufferAttribute(P, ix[3 * t + 2]).applyMatrix4(m.matrixWorld);
        if (Math.max(a.y, b.y, c.y) < 0.08) continue;   /* 바닥 표시 · 받침판은 그대로 */
        var x = (a.x + b.x + c.x) / 3 + 16, zz = 6 - (a.z + b.z + c.z) / 3, fr = 0, sc = 1e9;
        z.rows.forEach(function (r) { var f = (x - r.a[0]) * r.n[0] + (zz - r.a[1]) * r.n[1], L = (x - r.a[0]) * r.r[0] + (zz - r.a[1]) * r.r[1], s = Math.abs(f) + Math.max(0, -L, L - r.pages.length); if (s < sc) { sc = s; fr = f; } });
        if (fr < 0.2) continue;   /* 판 · 판 틀 · 간판 = 판 줄 위 */
        tris.push(t);
        for (var k = 0; k < 3; k++) { var v = ix[3 * t + k]; if (par[v] == null) par[v] = v; }
        var r0 = root(ix[3 * t]); par[root(ix[3 * t + 1])] = r0; par[root(ix[3 * t + 2])] = r0;
        bx[t] = [Math.min(a.x, b.x, c.x), Math.max(a.x, b.x, c.x), Math.min(a.z, b.z, c.z), Math.max(a.z, b.z, c.z)];
      }
      if (!tris.length) return;
      var by = {}, comps = [];
      tris.forEach(function (t) { var r = root(ix[3 * t]), q = by[r]; if (!q) { q = by[r] = { tris: [], b: [1e9, -1e9, 1e9, -1e9] }; comps.push(q); } q.tris.push(t); var e = bx[t]; q.b[0] = Math.min(q.b[0], e[0]); q.b[1] = Math.max(q.b[1], e[1]); q.b[2] = Math.min(q.b[2], e[2]); q.b[3] = Math.max(q.b[3], e[3]); });
      for (var mg = true; mg;) {   /* 맞닿은 덩어리(데스크 상판 · 다리 등)는 하나로 */
        mg = false;
        for (var i = 0; i < comps.length && !mg; i++) for (var j = i + 1; j < comps.length && !mg; j++) {
          var p = comps[i].b, q = comps[j].b;
          if (p[0] <= q[1] + 0.03 && q[0] <= p[1] + 0.03 && p[2] <= q[3] + 0.03 && q[2] <= p[3] + 0.03) { comps[i].tris = comps[i].tris.concat(comps[j].tris); p[0] = Math.min(p[0], q[0]); p[1] = Math.max(p[1], q[1]); p[2] = Math.min(p[2], q[2]); p[3] = Math.max(p[3], q[3]); comps.splice(j, 1); mg = true; }
        }
      }
      var gg = new T.BufferGeometry(); Object.keys(g.attributes).forEach(function (k) { gg.setAttribute(k, g.attributes[k]); });   /* 덧그림 = 같은 정점 · 빼 둔 삼각형만 */
      gg.setIndex(new T.BufferAttribute(new ix.constructor(ix.length), 1)); gg.setDrawRange(0, 0); gg.boundingSphere = g.boundingSphere || (g.computeBoundingSphere(), g.boundingSphere);
      var gm = m.material.clone(); gm.transparent = true; gm.depthWrite = false; gm.opacity = 1;
      var gh = new T.Mesh(gg, gm); gh.name = 'occGhost'; gh.raycast = function () {}; gh.renderOrder = 1; m.add(gh);
      OCC.push({ m: m, g: g, orig: ix.slice(), comps: comps, gh: gh, on: false });
    });
    return OCC;
  }
  function occFrame(f) { var u = f.userData, nl = Math.hypot(u.n.x, u.n.z) || 1; return { c: u.c, nx: u.n.x / nl, nz: u.n.z / nl, w: u.size[0] }; }
  function occIn(F, x, z) { var dx = x - F.c.x, dz = z - F.c.z; return [dx * F.nx + dz * F.nz, dx * F.nz - dz * F.nx]; }   /* [판 앞 거리, 옆 거리] */
  function occApply(face) {
    if (OCCA && OCCA.face === face) return;
    occClear(); if (!face || !G.loaded) return; occBuild();
    var F = occFrame(face), u = face.userData, th = Math.tan(camera.fov * Math.PI / 360), dEnd = Math.max((u.size[1] / 2) / th, (u.size[0] / 2) / th / camera.aspect) * 1.02;
    var L = F.w / 2 + 0.45, A = { face: face, F: F, dEnd: dEnd, ent: [], tvs: [], dyn: [], alpha: 1 };
    function hit(b) { var f0 = 1e9, f1 = -1e9, l0 = 1e9, l1 = -1e9; [[b[0], b[2]], [b[1], b[2]], [b[0], b[3]], [b[1], b[3]]].forEach(function (q) { var r = occIn(F, q[0], q[1]); f0 = Math.min(f0, r[0]); f1 = Math.max(f1, r[0]); l0 = Math.min(l0, r[1]); l1 = Math.max(l1, r[1]); }); return f1 > 0.15 && f0 < dEnd + 0.1 && l1 > -L && l0 < L; }
    OCC.forEach(function (e) {
      var H = {}, n = 0; e.comps.forEach(function (q) { if (hit(q.b)) q.tris.forEach(function (t) { H[t] = 1; n++; }); });
      if (!n) return;
      var ix = e.g.index.array, o = e.orig, nt = o.length / 3, w = 0, gi = e.gh.geometry.index.array, h = 0;
      for (var t = 0; t < nt; t++) { if (H[t]) { gi[h++] = o[3 * t]; gi[h++] = o[3 * t + 1]; gi[h++] = o[3 * t + 2]; } else { ix[w++] = o[3 * t]; ix[w++] = o[3 * t + 1]; ix[w++] = o[3 * t + 2]; } }
      for (var k = 0; k < h; k++) ix[w + k] = gi[k];
      e.g.index.needsUpdate = true; e.g.setDrawRange(0, w); e.gh.geometry.index.needsUpdate = true; e.gh.geometry.setDrawRange(0, h); e.gh.material.opacity = 1; e.on = true; A.ent.push(e);
    });
    S.lobby.children.forEach(function (m) { if (m.name !== 'tvScreen') return; var r = occIn(F, m.position.x, m.position.z); if (r[0] > 0.15 && r[0] < dEnd + 0.1 && Math.abs(r[1]) < L) A.tvs.push(m); });
    A.dyn = [bot].concat(guides.map(function (q) { return q.m; }), BLOCKS.map(function (q) { return q.m; }));
    OCCA = A;
  }
  function occAlpha(al) {   /* 1 = 다 보임 · 0 = 다 비킴 */
    var A = OCCA; if (!A || A.alpha === al) return; A.alpha = al;
    A.ent.forEach(function (e) { e.gh.material.opacity = al; e.gh.visible = al > 0.01; });
    A.tvs.forEach(function (m) { m.visible = al > 0.999; });   /* TV 화면 = 먼저 꺼지고 나중에 켜진다 */
  }
  function occDyn(A, k) {   /* 캐릭터 · 스태프 · 블록 */
    var O = OCCA; if (!O) return;
    var cam = camera.position, late = A.kind === 'in' ? k > 0.5 : A.kind === 'out' ? k < 0.5 : true;
    O.dyn.forEach(function (o) {
      var r = occIn(O.F, o.position.x, o.position.z), inView = r[0] > -0.2 && r[0] < O.dEnd + 0.15 && Math.abs(r[1]) < O.F.w / 2 + 0.55;
      var near = Math.hypot(o.position.x - cam.x, o.position.y + 0.5 - cam.y, o.position.z - cam.z) < (o === bot ? 0.8 : 1.6);   /* 블록 · 스태프 = 카메라 1.6m 안이면 비킴(줌 길목에서 화면 반을 가리던 동전) */
      o.userData.occ = (inView && late) || near;
      if (o !== bot && !o.userData.body) o.visible = !o.userData.occ;   /* 블록(스태프는 stepGuides 가 · 캐릭터는 아래) */
    });
    bot.visible = !bot.userData.occ;
  }
  function occClear() {
    var A = OCCA; if (!A) return; OCCA = null;
    A.ent.forEach(function (e) { e.g.index.array.set(e.orig); e.g.index.needsUpdate = true; e.g.setDrawRange(0, Infinity); e.gh.geometry.setDrawRange(0, 0); e.gh.visible = true; e.on = false; });
    A.tvs.forEach(function (m) { m.visible = true; });
    A.dyn.forEach(function (o) { o.userData.occ = false; if (o !== bot) o.visible = true; });
    bot.visible = G.scn !== 'cafe'; G.need = true;
  }

  /* ═══════════ 자세히 보기 단추 하나(v5.54 · 사용자 261004 「판 앞에 무조건 가까이 다가가는 사람들도 있을텐데, 가까이 가면 투명한 돋보기 버튼 · 기존의 자세히 보기와는 싸우지 않도록 · 돌아다니는 행위 자체에는 방해되지 않도록」) ═══════════
   * 화면에 「자세히 보기」는 늘 하나 · 조작부(달리기 · 돌기 · 점프) 바로 위 오른쪽 고정 자리 · 반투명 흰 알약 + 주황 돋보기
   *   판 2m 안 + 그 판을 향해 섬 = 그 판으로(그 판에 주황 테두리) · 아니면 스태프 3m 안(말풍선이 뜬 구역) = 그 구역 1페이지(첫 판에 테두리)
   *   스태프 말풍선 = 한마디만(옛 주황 「자세히 보기」 알약 없음 · 말풍선을 눌러도 이 단추와 같다) · 계단 「스탬프 받기」는 그대로
   *   걷는 동안 = 돋보기 동그라미만 작고 흐리게 · 멈추고 0.25초 = 글자까지 또렷하게(처음 한 번 살짝 부풂) · 연출 · 판 보기 · 카드 · 지도 = 숨김
   *   들어가기 = enterPanel(v5.53 한 번의 줌 · 판 앞 물체 비키기) · PC = Enter */
  var LOOK = { t: null, key: '', still: 0, pop: '', fr: null }, LOOK_R = 2.0, LOOK_R2 = 2.35;
  function lookPick() {
    if (PH.near || PH.on) return null;   /* v5.67 포토부스 근처 = 「사진 찍기」가 먼저 */
    if (!G.loaded || G.scn !== 'lobby' || G.anim || G.sheetOpen || G.sheetFx || G.mapMode || G.bigMap || SH || G.squeeze) return null;
    var p = G.pos, hx = Math.sin(G.h), hz = Math.cos(G.h), best = null, bs = 1e9;
    Object.keys(S.faces).forEach(function (k) {
      var pg = +k, f = S.faces[k];
      if (D.SIGNS.indexOf(pg) >= 0 || HIDE_PG.indexOf(pg) >= 0 || D.NOVIEW.indexOf(pg) >= 0 || pg >= 40 || !isShown(f)) return;
      var z = D.zoneOfPg(pg); if (!z || z.id === 'event' || z.id === 'cafe') return;   /* 판을 눌러 들어가는 판과 같은 범위(tap) */
      var F = occFrame(f), r = occIn(F, p.x, p.z), R = LOOK.key === 'p' + pg ? LOOK_R2 : LOOK_R;   /* 한 번 뜨면 2.35m 까지 유지(경계에서 깜빡임 없음) */
      if (r[0] < 0.15 || r[0] > R || Math.abs(r[1]) > F.w / 2 + 0.3) return;
      if (-(hx * F.nx + hz * F.nz) < 0.34) return;   /* 판 쪽을 향함(약 70도 안) */
      var s = r[0] + Math.abs(r[1]) * 1.6; if (s < bs) { bs = s; best = { kind: 'pg', z: z, pg: pg, f: f }; }
    });
    if (best) return best;
    var gd = G.talk;
    if (gd && gd.go && !gd.stamp && gd.spot !== 'typing' && !$('gbub').hidden) {   /* 말풍선이 화면에 떠 있을 때만(스태프가 카메라 뒤면 없음) */ var z = D.Z(gd.zone); if (z && z.rows.length) { var pg = firstPg(z); return { kind: 'zone', z: z, pg: pg, f: S.faces[pg] || null }; } }
    return null;
  }
  function lookFrameMesh() {
    if (LOOK.fr) return LOOK.fr;
    var c = document.createElement('canvas'); c.width = 220; c.height = 520; var g = c.getContext('2d');
    g.strokeStyle = '#FF7F32'; g.lineWidth = 10; g.beginPath(); if (g.roundRect) g.roundRect(7, 7, 206, 506, 16); else g.rect(7, 7, 206, 506); g.stroke();
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    var m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    m.name = 'lookFrame'; m.raycast = function () {}; m.renderOrder = 3; S.lobby.add(m); LOOK.fr = m; return m;
  }
  function lookFrame(f, calm) {
    var m = LOOK.fr; if (!m) return;
    if (!f) { m.visible = false; return; }
    var u = f.userData, F = occFrame(f);
    m.position.set(u.c.x + F.nx * 0.03, u.c.y, u.c.z + F.nz * 0.03); m.rotation.set(0, Math.atan2(F.nx, F.nz), 0); m.scale.set(u.size[0] + 0.1, u.size[1] + 0.1, 1);
    m.material.opacity = calm ? (RM ? 0.85 : 0.6 + 0.3 * (0.5 + 0.5 * Math.sin(G.clock * 3.2))) : 0.35; m.visible = true;
  }
  function lookName(t) { var nm = window.TOUR_BOARDS && TOUR_BOARDS.names && TOUR_BOARDS.names[t.pg]; return t.kind === 'pg' && nm ? nm : t.z.name; }
  function placeLook(now) {
    var b = $('look'); if (!b) return;
    var t = lookPick(), key = t ? (t.kind === 'pg' ? 'p' : 'z') + t.pg : '';
    LOOK.t = t;
    if (!t) { if (!b.hidden) b.hidden = true; LOOK.key = ''; LOOK.still = 0; lookFrame(null); return; }
    var walk = G.moveV > 0.2 || G.mode === 'auto' || !!G.air;
    if (walk) LOOK.still = 0; else if (!LOOK.still) LOOK.still = now;
    var calm = !walk && now - LOOK.still > 250;
    if (key !== LOOK.key) { LOOK.key = key; b.setAttribute('aria-label', '자세히 보기 · ' + lookName(t)); }
    if (b.hidden) b.hidden = false;
    b.classList.toggle('walk', !calm);
    if (calm && LOOK.pop !== key && !RM) { LOOK.pop = key; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    lookFrame(t.f, calm);
    lookPlace(b, t);
  }
  /* v5.58 (사용자 261004 「자세히 보기(돋보기)가 뜨는 위치가 지금 좀 애매한 것 같아 적절한 위치를 다시 찾아줘」) 후보 a · b · c 캡처 비교 뒤 a
   *   a = 대상 판 위(판 아래쪽 25% 높이 · 판 가운데 · 화면 안쪽 12px 으로 고정 · 캐릭터 머리와 겹치면 판 위쪽 75% 높이) = 무엇을 열지 바로 보임 · 판이 화면 밖이면 옛 자리(조작부 위 오른쪽)
   *   시험판 비교용 ?look=b(아래 가운데 · 조작부 위) · ?look=c(옛 자리) */
  var LOOK_POS = Q.get('look') || 'a';
  function lookPlace(b, t) {
    var st = b.style, mode = LOOK_POS;
    if (mode === 'a' && t.f) {
      var u = t.f.userData, W = $('stage').clientWidth, H = $('stage').clientHeight, bw = b.offsetWidth || 150, bh = b.offsetHeight || 48;
      var y0 = u.c.y - u.size[1] * 0.25, pt = _ia.set(u.c.x, y0, u.c.z).project(camera), hd = _ib.set(G.pos.x, 1.0, G.pos.z).project(camera);
      var x = (pt.x + 1) / 2 * W, y = (1 - pt.y) / 2 * H, hx = (hd.x + 1) / 2 * W, hy = (1 - hd.y) / 2 * H;
      if (Math.abs(x - hx) < bw / 2 + 40 && Math.abs(y - hy) < bh / 2 + 70) { pt = _ia.set(u.c.x, u.c.y + u.size[1] * 0.25, u.c.z).project(camera); y = (1 - pt.y) / 2 * H; }
      var ctlT = H - (parseFloat(getComputedStyle($('stage')).getPropertyValue('--lookB')) || 214) + 4;
      if (pt.z < 1 && x > -bw / 2 && x < W + bw / 2 && y > 0 && y < H) {
        x = clamp(x, bw / 2 + 12, W - bw / 2 - 12); y = clamp(y, 80 + bh / 2, ctlT - bh / 2);
        st.right = 'auto'; st.bottom = 'auto'; st.left = '0px'; st.top = '0px'; st.transform = 'translate(' + (x - bw / 2).toFixed(1) + 'px,' + (y - bh / 2).toFixed(1) + 'px)'; b.classList.add('on3d'); b.classList.remove('lb'); return;
      }
    }
    st.left = st.top = st.right = st.bottom = st.transform = ''; b.classList.remove('on3d'); b.classList.toggle('lb', mode === 'b');
  }
  function doLook() {
    if (performance.now() - (G.guardT || 0) < 500 || PH.on) return;
    var t = lookPick(); if (!t) return;
    $('look').hidden = true; lookFrame(null);
    enterPanel(t.z, t.pg);
  }

  /* ═══════════ 판 보기 다이브(v5.51 · 사용자 261004 「그 장면으로 빨려 들어가는 · 빠져나올 때도 1층 로비로」) ═══════════
   * 들어가기 = 카메라가 판 정면으로 다가가 판이 화면을 거의 채울 때(0.56초) → 판 보기가 3D 판의 화면 자리와 크기에서 시작해 화면 가득 커진다(FLIP 0.3초 · 합 약 0.86초) · 주황 점 물결이 판에서 퍼진다
   * 나오기 = 판 보기가 판 자리로 줄어들고(0.26초) 카메라가 판 앞에서 빠져 기본 시점으로(0.65초) · 점 물결은 판으로 모인다 */
  var DIVE_CAM = 720, DIVE_OUT = 720, DIVE_FX = 1;
  /* v5.53 (사용자 261004 「화면으로 들어갈 때 1단 2단 3단 이런식으로 들어가서 이상해 · 쭈욱 줌인해서 들어가는 한번 · 무조건 1페이지쪽으로」) 한 번의 이어진 줌
   *   옛 v5.51 = 어깨 너머까지(멈춤) → 판 앞까지(멈춤) → 카드 커지기 · 세 번 끊겼다 · 점 물결(veilRipple)도 겹쳤다
   *   들어가기 = 카메라 0.72초(위치 = 지금 → 어깨 너머(조절점) → 판 정면 한 곡선 · 빠르기 = 천천히 출발해 끝까지 다가가는 easeInSine · 방향은 같은 시간 안 앞 85%에 판 가운데로)
   *     → 판이 화면을 거의 채운 그 순간 판 보기 카드가 판의 화면 자리에서 같은 빠르기를 이어받아 커지며 멈춘다(easeOutSine · 0.2~0.52초) · 합 약 1.0~1.2초 · 처음 줄인 가속 · 끝 감속 = 전체가 하나의 ease-in-out
   *   나오기 = 그 반대 · 카드가 마지막 판 자리로 줄어들며 빨라지고(easeInSine) · 카메라가 그 빠르기로 판 앞에서 출발해 기본 시점으로 감속(easeOutSine)
   *   시야각은 그대로(바뀌지 않음) · 점 격자 전환 막 · 물결은 이 연출에서 쓰지 않는다 · 움직임 줄이기 = 짧은 페이드(flash) · DIVE_FX = 확인용 느리게(G.api.slow) */
  function bez(a, c, b, t, o) { var u = 1 - t; return o.set(u * u * a.x + 2 * u * t * c.x + t * t * b.x, u * u * a.y + 2 * u * t * c.y + t * t * b.y, u * u * a.z + 2 * u * t * c.z + t * t * b.z); }
  function sinIn(u) { return 1 - Math.cos(u * Math.PI / 2); }
  function sinOut(u) { return Math.sin(u * Math.PI / 2); }
  function faceDist(f, p) { var u = f.userData, n = new T.Vector3(u.n.x, 0, u.n.z).normalize(); return Math.max(0.05, (p.x - u.c.x) * n.x + (p.z - u.c.z) * n.z); }
  function faceRect(f) {
    var u = f.userData, c = u.c, n = new T.Vector3(u.n.x, 0, u.n.z).normalize(), rx = n.z, rz = -n.x, w = u.size[0] / 2, h = u.size[1] / 2, st = $('stage').getBoundingClientRect(), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (q) {
      _p.set(c.x + rx * w * q[0], c.y + h * q[1], c.z + rz * w * q[0]).project(camera);
      var sx = st.left + (_p.x + 1) / 2 * st.width, sy = st.top + (1 - _p.y) / 2 * st.height; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    });
    x0 = Math.max(x0, st.left); y0 = Math.max(y0, st.top); x1 = Math.min(x1, st.right); y1 = Math.min(y1, st.bottom);
    if (!(x1 - x0 > 20 && y1 - y0 > 20)) return null;
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  }
  /* v5.56 (사용자 261004 「자세히 보기에서 판이 나오는 부분이 아직도 매끄럽지가 않아 · 줌인을 했다가 한번 또 새로운 장면이 나오면서 툭툭 튀게 되는데, 더 자연스럽게 교차」)
   *   원인(60fps 프레임 실측 · 261004) = 줌이 끝난 프레임에 판 보기 시트 전체(머리 줄 · 카드 제목 · 넘김 단추 · 바탕)가 불투명도 0.55 로 한꺼번에 나타났다 ·
   *     시트 맨 위(머리 줄)를 판 위끝에 맞춰 판 내용(.bd)이 3D 판 글자보다 약 100px 아래에 겹쳤다(같은 제목이 두 겹) · 처음 열 때 시트를 만드느라 멈칫
   *   교차(XF) = 줌을 시작할 때 시트를 미리 만들어 둔다(보이지 않게 · 3D 는 계속 그린다) · 줌의 마지막 45%(약 0.32초) 동안 판 내용 상자(.bd · 그림 판은 .pic)만
   *     매 프레임 3D 판의 화면 네 모서리에 원근 그대로(matrix3d 사영 변환) 겹쳐 두고 불투명도 0 → 1 · 상자 밖은 잘라 둔다(clip-path)
   *   → 줌이 끝나면 같은 빠르기(판 크기 로그 변화율)를 이어받아 최종 자리로 정착(easeOutSine) · 잘림이 풀리며 바탕이 차오르고 머리 줄 · 카드 제목 · 넘김 단추는 뒤 65% 동안 페이드인 · 끝나야 3D 를 멈춘다
   *   나오기 = 거꾸로 · 정착 자리에서 판 자리로 줄어들고(easeInSine · 머리 줄 · 바탕 먼저 사라짐) · 카메라가 그 빠르기로 빠지는 앞 40% 동안 판 위에서 원근대로 따라가며 사라진다
   *   움직임 줄이기 = 옛 짧은 페이드 그대로 */
  var XF = null, XF_K0 = 0.55, XF_KO = 0.4, _xfv = new T.Vector3();
  function xfSm(t) { return t * t * (3 - 2 * t); }
  function xfQuad(f) {   /* 3D 판 네 모서리의 화면 좌표(창 기준) · 왼위 · 오른위 · 오른아래 · 왼아래 · 카메라 뒤면 null */
    camera.updateMatrixWorld();
    var u = f.userData, c = u.c, n = new T.Vector3(u.n.x, 0, u.n.z).normalize(), rx = n.z, rz = -n.x, w = u.size[0] / 2, h = u.size[1] / 2, st = $('stage').getBoundingClientRect(), P = [], bad = false;
    [[-1, 1], [1, 1], [1, -1], [-1, -1]].forEach(function (q) {
      _p.set(c.x + rx * w * q[0], c.y + h * q[1], c.z + rz * w * q[0]).project(camera); if (!(_p.z > -1 && _p.z < 1)) bad = true;
      P.push([st.left + (_p.x + 1) / 2 * st.width, st.top + (1 - _p.y) / 2 * st.height]);
    });
    if (bad) return null;
    if (P[0][0] > P[1][0]) P = [P[1], P[0], P[3], P[2]];
    return P;
  }
  function xfHomo(Q, b) {   /* 시트 안 상자 b(x · y · 폭 · 높이) → 시트 기준 네 점 Q 로 보내는 사영 변환 [A B C · D E F · G H] (x' = (Ax + By + C) / (Gx + Hy + 1)) */
    var x0 = Q[0][0], y0 = Q[0][1], x1 = Q[1][0], y1 = Q[1][1], x2 = Q[2][0], y2 = Q[2][1], x3 = Q[3][0], y3 = Q[3][1];
    var dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3, g = 0, h = 0;
    if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) { var den = dx1 * dy2 - dx2 * dy1; g = (dx3 * dy2 - dx2 * dy3) / den; h = (dx1 * dy3 - dx3 * dy1) / den; }
    var a = (x1 - x0 + g * x1) / b[2], bb = (x3 - x0 + h * x3) / b[3], d = (y1 - y0 + g * y1) / b[2], e = (y3 - y0 + h * y3) / b[3], G = g / b[2], H = h / b[3];
    var I = 1 - G * b[0] - H * b[1];
    return [a / I, bb / I, (x0 - a * b[0] - bb * b[1]) / I, d / I, e / I, (y0 - d * b[0] - e * b[1]) / I, G / I, H / I];
  }
  function xfBegin(face) {   /* 시트를 그 자리 그대로(변환 없음) 재고 교차 모드로 · SH 가 있어야 한다 */
    var el = $('sheet'); el.classList.add('xf', 'na'); el.style.transform = 'none'; el.style.clipPath = ''; el.style.opacity = '0'; el.style.pointerEvents = 'none';
    var fr = el.getBoundingClientRect(), card = $('track').children[SH.i], t = card ? (card.querySelector('.bd') || card.querySelector('.pic') || card) : el, br = t.getBoundingClientRect(), u = face.userData;
    XF = { face: face, fr: [fr.left, fr.top, fr.width, fr.height], b: [br.left - fr.left, br.top - fr.top, Math.max(20, br.width), Math.max(20, br.width) * u.size[1] / u.size[0]], M: null };
    return XF;
  }
  function xfLocal(Q) { return Q.map(function (q) { return [q[0] - XF.fr[0], q[1] - XF.fr[1]]; }); }
  function xfSet(M, op, bg, ui, w) {   /* w = 잘림 풀림(0 = 판 상자만 · 1 = 시트 전체) */
    var el = $('sheet'), b = XF.b, W = XF.fr[2], Hh = XF.fr[3], k = 1 - w;
    el.style.transform = 'matrix3d(' + [M[0], M[3], 0, M[6], M[1], M[4], 0, M[7], 0, 0, 1, 0, M[2], M[5], 0, 1].map(function (v) { return +v.toFixed(7); }).join(',') + ')';
    el.style.clipPath = 'inset(' + [b[1] * k, (W - b[0] - b[2]) * k, Math.max(0, Hh - b[1] - b[3]) * k, b[0] * k].map(function (v) { return Math.max(0, v).toFixed(1) + 'px'; }).join(' ') + ')';
    el.style.opacity = op.toFixed(3); el.style.setProperty('--xfb', bg.toFixed(3)); el.style.setProperty('--xfu', ui.toFixed(3));
  }
  function xfTrack(o) {   /* 줌 · 빠지기 동안 = 3D 판 위에 원근대로 */
    var Q = XF && xfQuad(XF.face); if (!Q) { if (XF) $('sheet').style.opacity = '0'; return; }
    XF.M = xfHomo(xfLocal(Q), XF.b); xfSet(XF.M, o, 0, 0, 0);
    if (G.camLog) G.camLog.push([Math.round(performance.now()), 'xf', +o.toFixed(3), Q]);
  }
  function xfClear() {
    var el = $('sheet'); XF = null; el.classList.remove('xf'); el.style.transform = ''; el.style.clipPath = ''; el.style.opacity = ''; el.style.pointerEvents = ''; el.style.removeProperty('--xfb'); el.style.removeProperty('--xfu');
  }
  function xfHold(A, now) {   /* 정착(set · 판 → 최종) · 거꾸로(unset · 최종 → 판) · 카메라는 판 앞에 서 있다 */
    var x = clamp((now - A.t0) / A.dur, 0, 1), hh = A.xf === 'set' ? sinOut(x) : 1 - sinIn(x), s0 = A.s0;
    var s = Math.exp(Math.log(s0) * (1 - hh)), w = Math.abs(s0 - 1) > 1e-3 ? (s0 - s) / (s0 - 1) : hh, I = [1, 0, 0, 0, 1, 0, 0, 0];
    var M = A.M0.map(function (v, j) { return v * (1 - w) + I[j] * w; });
    camera.position.copy(A.sh.L2).addScaledVector(_xfv.subVectors(A.sh.P2, A.sh.L2), s / s0 > 0 ? s0 / s : 1); camera.lookAt(A.sh.L2);   /* 카메라도 같은 빠르기로 판에 계속 다가가며 멈춘다(뒤 3D 가 얼지 않게 · 판 크기 = 카드 크기 비율) */
    xfSet(M, 1, xfSm(clamp(hh / 0.6, 0, 1)), xfSm(clamp((hh - 0.35) / 0.65, 0, 1)), w);
    if (G.camLog) G.camLog.push([Math.round(now), A.xf, +x.toFixed(4), +hh.toFixed(4), +w.toFixed(4)]);
    if (x < 1) return;
    if (A.xf === 'set') {
      var fx = G.sheetFx; xfClear(); G.sheetFx = null; G.anim = null; G.cover = !!SH; G.need = true;
      if (fx && fx.closeAfter) closeSheet();
    } else {
      G.lastFace = null; G.anim = { kind: 'out', t0: A.t0 + A.dur, dur: DIVE_OUT * DIVE_FX, sh: A.sh, ph: A.ph };   /* 카메라가 빠지며 카드는 판 위에서 사라진다(stepAnim · XF) */
    }
  }
  function xfDur(s0, rate) { return rate > 0 ? clamp(Math.abs(Math.log(1 / s0)) * (Math.PI / 2) / rate, 200 * DIVE_FX, 520 * DIVE_FX) : 300 * DIVE_FX; }
  function exitFace() {
    var lf = G.lastFace; if (!lf || !SH || SH.cards) return lf;
    var pg = SH.ps[SH.i], f = S.faces[pg];
    if (!f || D.SIGNS.indexOf(pg) >= 0 || HIDE_PG.indexOf(pg) >= 0 || pg >= 40 || !isShown(f)) return lf;
    var a = f.userData.c, b = lf.userData.c; return Math.hypot(a.x - b.x, a.z - b.z) < 6 ? f : lf;
  }
  /* 판 보기 데이터(새 조판 · tour-boards.js · .css) · 둘러보기를 처음 열 때 한 번 받는다(약 42KB) · 받기 전에 열면 옛 판 그림 */
  var BDVER = 'v560';   /* v5.60 tour-boards.css 뿌리 규칙 범위 */
  function loadBoards() {
    if (window.TOUR_BOARDS || G.bdLoading) return; G.bdLoading = true;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = BASE + 'tour-boards.css?v=' + BDVER; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = BASE + 'tour-boards.js?v=' + BDVER; sc.async = true; sc.onerror = function () { G.bdLoading = false; }; document.head.appendChild(sc);
  }

  /* ═══════════ 설정 창(v5.51 · 사용자 261004 · 옛 +/- 자리의 톱니) · 앱 바텀 시트 문법 · 시점 · 음악 · 움직임 줄이기 · 처음 안내의 같은 선택과 서로 맞춘다 · 떠 있는 동안 3D 는 계속 그린다 ═══════════
   * 위쪽 줄 소리 단추는 그대로 둔다(빨리 끄는 용도 · 설정 창의 음악과 같은 값) */
  /* v5.65 (사용자 261005 「설정의 내려다보기 시점은 없애고 시점을 바꾸지 않는 설정을 넣자」) 옛 시점 줄(내려다보기 · 눈높이 · setView) 삭제 · 「화면 밀어 시점 바꾸기」 켬(기본) · 끔 · 기기에 기억(axfTour3Swipe)
   *   끄면 화면 밀기로 좌우 돌기 · 위아래 시선이 모두 꺼진다 · 돌기 단추 · 조그 · PC 키는 그대로 · 처음 안내 한 줄도 이 값에 맞춘다 */
  function setSwipe(on, keep) {
    G.swipeOn = !!on; if (!keep) store.set('axfTour3Swipe', on ? '1' : '0');
    var c = $('cfSw'); if (c) c.checked = G.swipeOn;
    var h = $('hSw'); if (h) h.textContent = G.swipeOn ? '떠 있는 동전을 점프로 치면 그 활동으로 가요. 화면을 밀면 둘러봐요.' : '떠 있는 동전을 점프로 치면 그 활동으로 가요. 돌기 단추로 둘러봐요.';
    if (!G.swipeOn) tiltHome(true);
  }
  function cfgSync() { var m = $('cfMu'), r = $('cfRm'); if (m) m.checked = MUS.want; if (r) r.checked = RM; var row = $('cfMuRow'); if (row) row.hidden = !musOn(); setSwipe(G.swipeOn !== false, true); }
  function openCfg() { if (G.sheetOpen || G.anim) return; cfgSync(); $('cfg').hidden = false; G.sheetOpen = true; G.stick = null; G.path = null; setRun(false); try { $('cfg').focus(); } catch (e) {} }
  function closeCfg() { var c = $('cfg'); if (!c || c.hidden) return; c.hidden = true; G.sheetOpen = false; G.need = true; G.last = 0; }
  function wireCfg() {
    setSwipe(store.get('axfTour3Swipe') !== '0', true);
    $('bCfg').onclick = openCfg; $('cfX').onclick = closeCfg; $('cfg').addEventListener('click', function (e) { if (e.target === $('cfg')) closeCfg(); });
    $('cfSw').onchange = function () { setSwipe($('cfSw').checked); };
    $('cfMu').onchange = function () { musSet($('cfMu').checked); };
    $('cfRm').onchange = function () { RM = $('cfRm').checked; store.set('axfTour3RM', RM ? '1' : '0'); ROOTEL.classList.toggle('rm', RM); $('rmChk').checked = RM; G.need = true; };
    $('rmChk').addEventListener('change', cfgSync); $('muChk').addEventListener('change', cfgSync); $('bSnd').addEventListener('click', cfgSync);
    $('mini').onclick = openBigMap;
    $('bigmap').addEventListener('click', function (e) { if (!$('bmc').contains(e.target) || e.target === $('bmc')) closeBigMap(); });
  }

  /* ═══════════ 크게 보기 지도(v5.51 · 사용자 261004) · 작은 지도를 누르면 가운데에 반투명한 큰 지도 · 내 자리 · 바라보는 쪽 · 구역 이름 · 「대충 어디 있는지」만(사용자 261003)
   * 구역을 눌러 옮기는 기능은 없다 · 지도 밖 · 뒤로 가기 = 닫힘 · 떠 있는 동안 3D 는 계속 그린다 */
  function openBigMap() {
    if (!G.loaded || G.scn !== 'lobby' || G.sheetOpen || G.anim) return;
    var src = $('mini').querySelector('svg'); if (!src) return;
    var o = src.outerHTML.replace(/t3-mm(Rot|Me)/g, 't3-bm$1').replace('aria-hidden="true"', 'aria-hidden="true" class="bms"');   /* 작은 지도 그림을 그대로 복제 · 이름만 bm */
    var lab = '';
    D.ZONES.forEach(function (z) { if (!z.rows.length) return; var b = zoneRect(z); lab += '<text class="bml" data-x="' + mmX((b[0] + b[1]) / 2) + '" data-y="' + mmY((b[2] + b[3]) / 2) + '" x="' + mmX((b[0] + b[1]) / 2) + '" y="' + mmY((b[2] + b[3]) / 2) + '">' + esc(z.name) + '</text>'; });
    var BL = D.BLD; (BL.rooms || []).map(function (r) { return { label: r[2], at: [1.8, (r[0] + r[1]) / 2] }; }).concat([BL.room3, BL.desk3]).forEach(function (r) { if (!r || !r.at) return; lab += '<text class="bml rm" data-x="' + mmX(r.at[0]) + '" data-y="' + mmY(r.at[1]) + '" x="' + mmX(r.at[0]) + '" y="' + mmY(r.at[1]) + '">' + esc(r.label) + '</text>'; });   /* v5.58 미팅룸 1 · 2 · 3 · 고객센터(작은 회색) */
    $('bmc').innerHTML = o.replace('</g></svg>', '</g>' + lab + '</svg>');
    $('bigmap').hidden = false; G.bigMap = true; G.sheetOpen = true; G.stick = null; G.path = null; G.bmAz = null; setRun(false); bigMini(); G.need = true;
  }
  function closeBigMap() { if (!G.bigMap) return; $('bigmap').hidden = true; $('bmc').innerHTML = ''; G.bigMap = false; G.sheetOpen = false; G.need = true; G.last = 0; }
  function bigMini() {
    var me = $('bmMe'), mm = $('mmMe'); if (!me || !mm) return;
    me.setAttribute('transform', mm.getAttribute('transform') || '');
    if (G.bmAz !== G.az) {
      G.bmAz = G.az; var c = MM.S / 2, rot = 180 + G.az * 180 / Math.PI;
      $('bmRot').setAttribute('transform', 'rotate(' + rot.toFixed(2) + ' ' + c.toFixed(1) + ' ' + c.toFixed(1) + ')');
      var q = rot * Math.PI / 180, cs = Math.cos(q), sn = Math.sin(q);
      Array.prototype.forEach.call($('bmc').querySelectorAll('.bml'), function (t) { var x = +t.getAttribute('data-x') - c, y = +t.getAttribute('data-y') - c; t.setAttribute('x', (c + x * cs - y * sn).toFixed(1)); t.setAttribute('y', (c + x * sn + y * cs).toFixed(1)); });   /* 이름은 돌리지 않고 자리만 따라간다(늘 바로 읽힌다) */
    }
  }

  /* ═══════════ 판 보기 들어가기 · 나오기 연출(v5.51 다이브 · 위 VL · FLIP 과 하나) ═══════════
   * 들어가기: 40도 시점 → 캐릭터 뒤 어깨 너머(뒤통수가 화면 아래) → 판 앞까지 다가가 판이 화면 가득 → 흰 화면으로 넘어가며 판 보기 시트
   * 나오기: 시트를 닫으면 판 앞에서 빠져나와 어깨 너머를 지나 40도 시점으로 · 동작 줄이기 설정이면 연출 없이 바로 */
  function easeIO(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function pickFace(z, pg) {
    if (pg && S.faces[pg]) return { pg: pg, f: S.faces[pg] };
    var p = G.pos, best = null, bd = 1e9;
    D.viewPages(z).forEach(function (q) {   /* v5.58 판 보기에 없는 판(D.NOVIEW) 빼고 */
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
    if (G.tilt || G.tiltTo) { tiltHome(true); var cw = camWant(); G.camPos.copy(cw.pos); G.look.copy(cw.look); camera.position.copy(G.camPos); camera.lookAt(G.look); }   /* v5.65 판 보기 진입 = 정면 눈높이에서 */
    if (pg && D.NOVIEW.indexOf(pg) >= 0) pg = null;   /* v5.58 판 보기에 없는 판(15 등)을 누르면 그 구역 첫 판 */
    if (!pg) pg = firstPg(z);
    var ps = D.viewPages(z), pk = pickFace(z, pg);
    var idx = pg ? ps.indexOf(pg) : (pk ? ps.indexOf(pk.pg) : null);
    if (G.anim || G.sheetOpen || G.sheetFx) return;   /* v5.51 연출 중 연타 · 열린 채 다시 누름 */
    if (RM || !pk || !G.loaded) { if (RM) flash(); openSheet(z, idx); G.lastFace = pk ? pk.f : null; G.lastPh = pk ? Math.atan2(pk.f.userData.c.x - G.pos.x, pk.f.userData.c.z - G.pos.z) : 0; return; }
    var c = pk.f.userData.c, ph = Math.atan2(c.x - G.pos.x, c.z - G.pos.z); G.mode = G.mode === 'auto' ? 'free' : G.mode; G.path = null; G.stick = null;
    var sh = shotsFor(pk.f), dur = DIVE_CAM * DIVE_FX, P0 = G.camPos.clone();
    var rate = Math.log(faceDist(pk.f, bez(P0, sh.P1, sh.P2, sinIn(0.99), new T.Vector3())) / faceDist(pk.f, sh.P2)) / (0.01 * dur);   /* 끝 빠르기(판 크기 로그 변화율 · ms 당) → 카드가 이어받는다 */
    G.anim = { kind: 'in', t0: performance.now(), dur: dur, P0: P0, L0: G.look.clone(), sh: sh, z: z, idx: idx, ph: ph, face: pk.f, rate: rate };
    G.lastFace = pk.f; G.lastPh = ph; $('gbub').hidden = true; $('look').hidden = true; lookFrame(null); occApply(pk.f);   /* v5.54 판 앞 물체 비키기 */
    openSheet(z, idx); G.cover = false; G.sheetFx = { dir: 'in' }; xfBegin(pk.f);   /* v5.56 판 보기를 줌 시작에 미리 만들어 둔다(보이지 않게 · 끝에서 멈칫 없음) */
  }
  function stepAnim(now) {
    var A = G.anim;
    if (A.kind === 'hold') { occAlpha(0); occDyn(A, 1); camera.position.copy(A.sh.P2); camera.lookAt(A.sh.L2); if (A.xf && XF) xfHold(A, now); return; }   /* xfHold 가 카메라를 판 쪽으로 더 옮긴다 */   /* v5.56 정착 · 거꾸로(xfHold) */   /* v5.51 판 보기가 커지거나 줄어드는 동안 카메라는 판 앞 */
    var k = clamp((now - A.t0) / A.dur, 0, 1), sh = A.sh, pos = new T.Vector3(), look = new T.Vector3();
    if (A.kind === 'intro') {
      var wi = camWant(), ei = easeIO(k), eL = 1 - Math.pow(1 - k, 3);
      pos.lerpVectors(A.P0, wi.pos, ei); look.lerpVectors(A.L0, wi.look, eL);
    } else if (A.kind === 'in') {   /* v5.53 한 곡선 · 멈춤 없음(어깨 너머 = 조절점일 뿐 지나가며 서지 않는다) */
      bez(A.P0, sh.P1, sh.P2, sinIn(k), pos); look.lerpVectors(A.L0, sh.L2, easeIO(Math.min(1, k / 0.85)));
    } else {
      var w = A.W || (A.W = camWant());
      bez(sh.P2, sh.P1, w.pos, sinOut(k), pos); look.lerpVectors(sh.L2, w.look, easeIO(clamp((k - 0.1) / 0.9, 0, 1)));
    }
    camera.position.copy(pos); camera.lookAt(look);
    if (XF && A.kind === 'in') xfTrack(xfSm(clamp((k - XF_K0) / (1 - XF_K0), 0, 1)));   /* v5.56 줌 마지막 45% = 판 위에서 카드가 서서히 */
    else if (XF && A.kind === 'out') { if (k < XF_KO) xfTrack(1 - xfSm(k / XF_KO)); else if (SH) hideSheet(); }   /* 빠지는 앞 40% = 판 위에서 서서히 사라짐 */
    if (OCCA && A.kind !== 'intro') { occAlpha(A.kind === 'in' ? 1 - clamp((k - 0.1) / 0.4, 0, 1) : clamp((k - 0.5) / 0.4, 0, 1)); occDyn(A, k); }   /* v5.54 판 앞 물체 */
    if (G.camLog) G.camLog.push([Math.round(now), A.kind, +k.toFixed(4), +pos.x.toFixed(4), +pos.y.toFixed(4), +pos.z.toFixed(4), +look.x.toFixed(4), +look.y.toFixed(4), +look.z.toFixed(4)]);   /* 확인용(G.api.camLog) */
    if (k >= 1) {
      G.anim = null;
      if (A.kind === 'intro') { G.camPos.copy(camera.position); G.look.copy(look); if (A.done) setTimeout(A.done, 0); }
      else if (A.kind === 'in') {   /* v5.56 같은 빠르기를 이어받아 정착 */
        if (!SH || !XF) { G.anim = null; G.sheetFx = null; if (SH) { xfClear(); G.cover = true; } }
        else { var Q = xfQuad(A.face), M0 = Q ? xfHomo(xfLocal(Q), XF.b) : (XF.M || [1, 0, 0, 0, 1, 0, 0, 0]), s0 = clamp(M0[0], 0.2, 3); G.anim = { kind: 'hold', xf: 'set', t0: A.t0 + A.dur, dur: xfDur(s0, A.rate), M0: M0, s0: s0, sh: sh, ph: A.ph }; xfHold(G.anim, now); }
      }
      else { if (SH && XF) hideSheet(); G.camPos.copy(camera.position); G.look.copy(look); occClear(); }
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
  function exitPanel(sh, ph) {   /* v5.51 판 보기가 판 자리로 줄어든 뒤 · 판 앞에서 빠져나와 어깨 너머를 지나 기본 시점으로 */
    G.lastFace = null;
    if (!sh || RM || !G.loaded || G.scn !== 'lobby') { G.anim = null; G.need = true; occClear(); return; }
    G.anim = { kind: 'out', t0: performance.now(), dur: DIVE_OUT * DIVE_FX, sh: sh, ph: ph };
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
  /* 네모 막힘(걷기 지도) · 도면 x0~x1 · z0~z1 을 몸 반지름(0.32)만큼 넓혀 막는다 */
  function blockRect(x0, x1, z0, z1) {
    var r = 0.32, i0 = Math.floor((x0 - r - GX0) / GS), i1 = Math.ceil((x1 + r - GX0) / GS), j0 = Math.floor((z0 - r - GZ0) / GS), j1 = Math.ceil((z1 + r - GZ0) / GS);
    for (var j = Math.max(0, j0); j <= Math.min(GH - 1, j1); j++) for (var i = Math.max(0, i0); i <= Math.min(GW - 1, i1); i++) wd[j * GW + i] = 1;
  }
  /* ═══════════ 타자왕 노트북 2대(v5.49 · 사용자 261004) ═══════════
   * v5.51 오락기 3대(AX 팡 · 점프 · 테트리스)와 「미니 게임 하기」 · 오락기 충돌 칸은 없앴다(사용자 261004 「1층에 미니게임기가 서 있는 게 이상하다」 · 가상 1층에만 있던 것) · 미니 게임 스탬프 블록만 타자왕 부스 앞에 남는다
   * 노트북: 타자왕 판(39 · 서쪽 벽) 앞 탁자 하나(도면 x 1.2~1.8 · z 1.85~3.15) · 두 대 · 동쪽(통로)을 보고 화면에 타자 연습 루프(SCN.lap) */
  function buildLaptops() {
    var top = lam(0xF4F2EE), leg = lam(0x3A3F45), shell = lam(0xC9CDD2), keys = lam(0x2B3036);
    var T0 = { x: 1.5, z: 2.5, w: 0.6, l: 1.3, h: 0.74 };
    var g = new T.Group(); g.position.copy(toThree(T0.x, T0.z)); g.name = 'typingDesk';
    var tp = new T.Mesh(new T.BoxGeometry(T0.w, 0.03, T0.l), top); tp.position.y = T0.h - 0.015; g.add(tp);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (q) { var l = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, T0.h - 0.03, 8), leg); l.position.set(q[0] * (T0.w / 2 - 0.05), (T0.h - 0.03) / 2, q[1] * (T0.l / 2 - 0.06)); g.add(l); });
    S.lobby.add(g);
    [-0.33, 0.33].forEach(function (dz) {
      var lp = new T.Group(); lp.position.set(0.04, T0.h, dz); g.add(lp);
      var bs = new T.Mesh(new T.BoxGeometry(0.24, 0.016, 0.34), shell); bs.position.y = 0.008; lp.add(bs);
      var kb = new T.Mesh(new T.PlaneGeometry(0.13, 0.28), keys); kb.rotation.x = -Math.PI / 2; kb.position.set(0.01, 0.0165, 0); lp.add(kb);
      var th = 0.26, lid = new T.Group(); lid.position.set(-0.12, 0.016, 0); lid.rotation.z = th; lp.add(lid);   /* 뒤(서쪽) 모서리를 축으로 15도 젖힌 뚜껑 */
      var lb = new T.Mesh(new T.BoxGeometry(0.012, 0.23, 0.34), shell); lb.position.set(-0.006, 0.115, 0); lid.add(lb);
      var sc = new T.Mesh(new T.PlaneGeometry(0.3, 0.19), new T.MeshBasicMaterial({ color: 0x1B2029, toneMapped: false })); sc.rotation.y = Math.PI / 2; sc.position.set(0.001, 0.118, 0); lid.add(sc);
      tvAdd(sc, 64, 40, 'lap');
    });
    blockRect(T0.x - T0.w / 2, T0.x + T0.w / 2, T0.z - T0.l / 2, T0.z + T0.l / 2);
    buildPhoto();   /* v5.58 EVENT 포토부스(가운데 칸 기계 · 벽 앞 단체 사진) */
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
    0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], ':': [0, 12, 12, 0, 12, 12, 0],
    /* v5.49 오락기 · 노트북 화면용 */
    B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30], H: [17, 17, 17, 31, 17, 17, 17], J: [7, 2, 2, 2, 2, 18, 12], L: [16, 16, 16, 16, 16, 16, 31],
    R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], U: [17, 17, 17, 17, 17, 17, 14], 4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14], 8: [14, 17, 17, 14, 17, 17, 14], 9: [14, 17, 17, 15, 1, 2, 12]
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
  /* v5.49 오락기 3대(사용자 261004 「미니게임은 타자왕 쪽에 배치해서 아케이드 이벤트존 느낌」) · 노트북 2대(사용자 「타자왕 부스 앞에도 노트북 두 대」) · 화면 그림 · 64 × 56(오락기) · 64 × 40(노트북) */
  var ARC_COL = [TVP.o100, TVP.o50, TVP.white, px32(0x4FA3E0), px32(0x7ED39B)];
  function hsh(a, b, c) { var h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0); }
  SCN.pang = function (v, t) {   /* AX 팡 · 보석 칸 · 1.4초마다 가로 셋이 맞춰져 반짝이고 터진다 */
    grid(v, null); txt(v, 'PANG', (v.cw - txtW('PANG', 1)) / 2, 2, 1, TVP.o100);
    var e = Math.floor(t / 1.4), f = (t % 1.4) / 1.4, mr = e % 5, mc = (e * 3) % 5, mcol = ARC_COL[hsh(e, 7, 1) % 5];
    for (var j = 0; j < 5; j++) for (var i = 0; i < 7; i++) {
      var inM = j === mr && i >= mc && i < mc + 3, c = inM ? mcol : ARC_COL[hsh(i, j, e) % 5];
      if (inM && f > 0.55) { if (f > 0.82) continue; if (Math.floor(f * 20) % 2) c = TVP.white; }
      rect(v, 4 + i * 8, 12 + j * 8, 7, 7, c); rect(v, 4 + i * 8, 12 + j * 8, 7, 1, pxMix(TVC.white, TVC.bg, 0.2));
    }
  };
  SCN.jumpg = function (v, t) {   /* 점프 · 주황 캐릭터가 다가오는 장애물을 뛰어넘는다 · 점수가 오른다 */
    grid(v, null); txt(v, 'JUMP', 3, 2, 1, TVP.o100);
    var sc = String(Math.floor(t * 7) % 1000); txt(v, sc, v.cw - txtW(sc, 1) - 3, 2, 1, TVP.white);
    var gy = v.ch - 8; rect(v, 0, gy, v.cw, 1, TVP.grey);
    for (var x = 0; x < v.cw; x += 6) rect(v, (x - (t * 30) % 6 + 6) % v.cw, gy + 3, 2, 1, pxMix(TVC.grey, TVC.bg, 0.5));
    var jy = 0;
    for (var k = 0; k < 2; k++) {
      var ox = v.cw - ((t * 30 + k * 55) % 110); if (ox < -8 || ox > v.cw) continue;
      rect(v, ox, gy - 8, 6, 8, TVP.o50); rect(v, ox + 1, gy - 10, 4, 2, TVP.o50);
      var dx = ox - 12; if (dx > -8 && dx < 22) jy = Math.max(jy, Math.sin(clamp((22 - dx) / 30, 0, 1) * Math.PI) * 17);
    }
    var cy = Math.round(gy - 8 - jy); rect(v, 12, cy, 7, 7, TVP.o100); rect(v, 13, cy - 1, 5, 1, TVP.o100); rect(v, 16, cy + 2, 1, 2, TVP.bg); rect(v, 13, cy + 7, 2, 1, TVP.o50); rect(v, 16, cy + 7, 2, 1, TVP.o50);
  };
  var TET_STACK = ['1111011111', '1101111011', '0111110110'];
  SCN.tetris = function (v, t) {   /* 테트리스 · 블록이 내려와 쌓인다(3초 반복) */
    grid(v, null); txt(v, 'TETRIS', (v.cw - txtW('TETRIS', 1)) / 2, 2, 1, TVP.o100);
    var X0 = 12, Y0 = 11, C = 4, R = 11;
    rect(v, X0 - 1, Y0, 1, R * C, TVP.grey); rect(v, X0 + 10 * C, Y0, 1, R * C, TVP.grey); rect(v, X0 - 1, Y0 + R * C, 10 * C + 2, 1, TVP.grey);
    for (var r = 0; r < 3; r++) for (var c = 0; c < 10; c++) if (TET_STACK[r][c] === '1') rect(v, X0 + c * C, Y0 + (R - 3 + r) * C, C - 1, C - 1, LADDER[(r + c) % 3]);
    var e = Math.floor(t / 3), f = (t % 3) / 3, PCS = [[[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [3, 0]]];
    var pc = PCS[e % 4], px = 2 + (e * 3) % 5, py = Math.min(R - 6, Math.floor(f * 1.25 * (R - 5)));
    pc.forEach(function (q) { rect(v, X0 + (px + q[0]) * C, Y0 + (py + q[1]) * C, C - 1, C - 1, TVP.white); });
  };
  SCN.lap = function (v, t) {   /* 노트북 · 타자왕 연습 · 「ME to WE」를 한 글자씩 치고 타수가 오른다(5초 반복) */
    rect(v, 0, 0, v.cw, v.ch, px32(0x1B2029)); rect(v, 0, 0, v.cw, 8, TVP.o100); txt(v, 'TYPING', 3, 1, 1, TVP.white);
    var tt = t % 5, n = Math.floor(tt * 3.2), w = 'ME to WE', tw = txtW(w, 1), x0 = (v.cw - tw) / 2;
    txt(v, w, x0, 14, 1, pxMix(TVC.grey, TVC.bg, 0.55));
    var e = txt(v, w, x0, 14, 1, TVP.white, n); if (n < w.length && Math.floor(t * 4) % 2 === 0) rect(v, e, 14, 1, 7, TVP.o100);
    var wpm = String(Math.min(999, Math.floor(tt * 60))); txt(v, wpm, 3, 28, 1, TVP.o50); rect(v, 3 + txtW(wpm, 1) + 3, 31, Math.min(v.cw - 30, tt * 9), 2, TVP.o100);
  };
  var TV_SEQ = ['fest', 'metowe', 'wave'], TV_DUR = { fest: 7, metowe: 7, wave: 6 };
  var OWN_SCN = { pang: 1, jumpg: 1, tetris: 1, lap: 1 };   /* 자기 그림만 도는 화면(행사 광고 루프를 돌지 않음) */
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
    if (v.kind === 'typing' || OWN_SCN[v.kind]) { name = v.kind; if (RM) t = v.kind === 'typing' ? 3.2 : 2.6; }
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
      var pc = planOf(c); if (land && pc[0] > 19.6 && pc[0] < 24.9 && pc[1] < 3) { ivAdd(m); return; }   /* v5.58 AX in Action TV = 인터뷰 화면(나 닮은 챗봇) */
      if (MOT.on) motAdd(m, land ? 'tv' : 'kiosk'); else tvAdd(m, cw, ch, land ? 'tv' : 'kiosk');   /* v5.53 홍보부 모션 · 끄면 옛 픽셀 루프 */
    });
    G.tvN = TVS.length;
  }
  function tvStep(now) {
    if (!TVS.length || G.tvOff) return false;   /* tvOff = 시험용(성능 비교) */
    if (RM) { if (!G.tvRM) { G.tvRM = true; TVS.forEach(function (v) { if (v.mot) motStill(v); else if (v.iv) ivStep(v, performance.now(), true); else tvDraw(v, 30); }); return true; } return false; }
    if (G.tvRM) { G.tvRM = false; }
    if (now - tvLast < 1000 / (MOT.n ? MOT_FPS : TV_FPS)) return false;   /* v5.53 모션 화면이 있으면 초당 15번(픽셀 화면은 아래에서 그대로 TV_FPS) */
    tvLast = now; var tw = performance.now();
    camera.updateMatrixWorld(); _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    var any = false, t = now / 1000;
    TVS.forEach(function (v) {
      _tv.copy(camera.position).sub(v.c);
      v.on = _tv.length() < 16 && _tv.dot(v.n) > 0 && _fr.intersectsSphere(v.sphere) && isShown(v.mesh);
      if (v.mot) { if (motStep(v, v.on, now)) any = true; return; }
      if (v.iv) { if (v.on && ivStep(v, now)) any = true; return; }   /* v5.58 인터뷰 화면 */
      if (v.on && now - (v.pxT || 0) >= 1000 / TV_FPS - 2) { v.pxT = now; tvDraw(v, t); any = true; }
    });
    G.tvOn = TVS.filter(function (v) { return v.on; }).length; var tm = performance.now() - tw; G.tvMs = G.tvMs == null ? tm : G.tvMs * 0.9 + tm * 0.1; G.tvMax = Math.max(G.tvMax || 0, tm);   /* 진단 · 한 번 그리는 데 든 시간 */
    return any;
  }
  /* ═══════════ v5.53 TV · 가벽 화면 = 홍보부 모션(사용자 261004 「가상화면에 나오는 광고들을 홍보부에서 만들어준 영상으로 대체해줘 · 점에서 사람으로 바뀌고 꽃으로 바뀌고 하는 동영상」) ═══════════
   * 원본 = AXF Design Data/03. app/01. motion 8종(1080 · 30fps · 흰 바탕 · 260916 홍보부 앱용 수령) → m/이름.mp4(H.264 Main · 소리 없음 · 바탕 검정 · 점 = O100 #FF7E31 한 색)
   *   320 x 320 · 15fps(달리기 · AX 획은 30fps) · 구 · 알파 원은 256 x 256(원본 22MB · 26MB → 약 0.28MB · 0.16MB) · 8종 합 약 1.0MB(원본 56MB) · 정지 한 장 = m/이름.webp(미리보기 그림)
   * 대상 = 비전 · AX in Action · HiDI-Q · Hi-Helper TV 4대 + 포토부스 키오스크 + 가벽 전체 화면 = 6 · 타자왕 TV · 노트북은 그대로(픽셀 루프 · 타자왕 홍보)
   * 받기 = 둘러보기 안에서 그 화면이 처음 보일 때 그 차례 영상 하나(fetch → blob · 같은 영상은 한 번만 받아 화면들이 나눠 씀) + 다음 차례 하나 미리 · 둘러보기를 열지 않으면 0바이트
   * 재생 = 화면마다 <video>(muted · playsinline · loop) 하나 → VideoTexture · 화면 밖 · 등진 쪽 · 16m 밖 · 판 보기 · 닫힘 = 멈춤 · 화면마다 다른 순서 · 짧은 영상은 몇 번 돌고 다음
   * 움직임 줄이기 = 그 화면 지금 차례의 정지 한 장 · 재생이 막히면(저전력 모드 등) 정지 한 장 → 다음 누름에 다시 시도 · ?t3tv=px(시험판) = 옛 픽셀 루프(비교용) */
  var MOT = { dir: BASE + 'm/', v: 'v553', on: Q.get('t3tv') !== 'px' && !!T.VideoTexture && !!window.fetch && !!(window.URL && URL.createObjectURL),
    rep: { run: 4, flower: 2, ax: 3 },   /* 짧은 영상 = 2초 x 4 · 6초 x 2 · 3초 x 3 · 나머지(16~17초)는 한 번 */
    ord: [['metowe', 'circle', 'run', 'flower', 'ax', 'wetome', 'sphere', 'alpha'], ['circle', 'run', 'flower', 'wetome', 'alpha', 'metowe', 'ax', 'sphere'],
      ['run', 'flower', 'ax', 'alpha', 'metowe', 'sphere', 'circle', 'wetome'], ['wetome', 'sphere', 'circle', 'run', 'flower', 'metowe', 'alpha', 'ax'],
      ['flower', 'ax', 'metowe', 'circle', 'run', 'alpha', 'wetome', 'sphere'], ['ax', 'metowe', 'circle', 'run', 'flower', 'sphere', 'wetome', 'alpha']],
    blob: {}, still: {}, box: null, n: 0, armed: false, got: 0 };
  var MOT_FPS = 15;   /* 모션 화면이 보일 때 다시 그리는 빠르기(영상 15fps) · 느린 기기 8 · 픽셀 화면은 그대로 TV_FPS */
  function motUrl(n, ext) { return MOT.dir + n + '.' + ext + '?v=' + MOT.v; }
  function motGet(n) {
    if (!MOT.blob[n]) {
      MOT.blob[n] = fetch(motUrl(n, 'mp4')).then(function (r) { if (!r.ok) throw new Error('m ' + r.status); return r.blob(); }).then(function (b) { MOT.got += b.size; return URL.createObjectURL(b); });
      MOT.blob[n].catch(function () { delete MOT.blob[n]; });   /* 실패하면 다음에 다시 받는다 */
    }
    return MOT.blob[n];
  }
  function motBox() {   /* 영상 요소 자리 · 화면 안 2px(투명도 0.01) · display:none 이면 아이폰이 「안 보이는 영상」으로 보고 멈춘다 */
    if (!MOT.box) { MOT.box = document.createElement('div'); MOT.box.className = 'mbox'; MOT.box.setAttribute('aria-hidden', 'true'); ROOTEL.appendChild(MOT.box); }
    return MOT.box;
  }
  function motInset(g) {   /* 영상 가장자리 1.5px 안쪽만(가장자리 줄을 늘려 쓰는 방식은 일부 기기 · 소프트웨어 그리기에서 아래 줄이 초록으로 번졌다) */
    var uv = g.attributes.uv, e = 0.005;
    for (var j = 0; j < uv.count; j++) uv.setXY(j, e + uv.getX(j) * (1 - 2 * e), e + uv.getY(j) * (1 - 2 * e));
    uv.needsUpdate = true;
  }
  function motAdd(mesh, kind) {
    var el = document.createElement('video'), k = MOT.n++;
    el.muted = true; el.defaultMuted = true; el.loop = true; el.playsInline = true; el.preload = 'auto'; el.defaultPlaybackRate = 1; el.playbackRate = 1;   /* v5.58 재생 빠르기 1배 고정 */
    el.setAttribute('muted', ''); el.setAttribute('playsinline', ''); el.setAttribute('webkit-playsinline', ''); el.disablePictureInPicture = true;
    motBox().appendChild(el);
    var tex = new T.VideoTexture(el); tex.colorSpace = T.SRGBColorSpace; tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = false;
    var w = +(mesh.geometry.parameters.width || 1), h = +(mesh.geometry.parameters.height || 1), sq = Math.min(w, h) * 0.92;
    mesh.material.color.set(0x010100); mesh.material.polygonOffset = true; mesh.material.polygonOffsetFactor = -2; mesh.material.polygonOffsetUnits = -4; mesh.material.needsUpdate = true;   /* 화면 = 영상 바탕과 같은 검정 */
    var pg = new T.PlaneGeometry(sq, sq); motInset(pg);
    var pm = new T.Mesh(pg, new T.MeshBasicMaterial({ map: tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));   /* 정사각 영상 판 = 화면 가운데 · 짧은 변의 92% · 3mm 앞 */
    pm.position.z = 0.003; pm.name = 'motScreen'; pm.raycast = function () {}; mesh.add(pm);   /* 누름은 아래 화면(모형과 같은 일)이 받는다 */
    if (kind === 'wall') patchFade([pm.material], WFADE, 'w');   /* 가벽이 시선을 가리면 같이 점점이 비운다 */
    mesh.updateWorldMatrix(true, false);
    var c = new T.Vector3().setFromMatrixPosition(mesh.matrixWorld), n = new T.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld);
    var v = { mesh: mesh, kind: kind, c: c, n: n, sphere: new T.Sphere(c, 0.9), i: TVS.length, on: false, drawn: 0, w: +w.toFixed(2), h: +h.toFixed(2),
      mot: { ord: MOT.ord[k % MOT.ord.length], k: 0, rep: 0, el: el, tex: tex, mat: pm.material, cur: '', want: '', lastT: 0, show: 'v', blocked: false, playP: false, retry: 0, loops: 0 } };
    el.addEventListener('playing', function () { if (!RM && v.mot.show !== 'v') motMap(v, tex, 'v'); });
    TVS.push(v); if (RM) motStill(v); return v;
  }
  function motMap(v, tex, show) { var m = v.mot.mat; v.mot.show = show; if (m.map !== tex) { m.map = tex; m.needsUpdate = true; } G.need = true; }   /* 영상 ↔ 정지 그림 = 셰이더가 다르다(영상은 sRGB 를 셰이더에서 푼다) */
  function motStill(v) {
    var m = v.mot, n = m.cur || m.ord[m.k % m.ord.length];
    if (!m.el.paused) m.el.pause();
    if (!MOT.still[n]) { MOT.still[n] = new T.TextureLoader().load(motUrl(n, 'webp'), function () { G.need = true; }); MOT.still[n].colorSpace = T.SRGBColorSpace; }
    motMap(v, MOT.still[n], 's');
  }
  function motPlay(v) {
    var m = v.mot; if (m.playP || m.blocked) return;
    var p = null; try { p = m.el.play(); } catch (e) { p = null; }
    if (p && p.then) { m.playP = true; p.then(function () { m.playP = false; }, function (e) { m.playP = false; if (e && e.name === 'NotAllowedError') { m.blocked = true; motStill(v); motArm(); } }); }
  }
  function motArm() {   /* 재생이 막혔다(아이폰 저전력 모드 등) · 다음 누름 안에서 다시 시도 */
    if (MOT.armed || !ROOTEL) return; MOT.armed = true;
    ROOTEL.addEventListener('pointerdown', function f() {
      ROOTEL.removeEventListener('pointerdown', f, true); MOT.armed = false;
      TVS.forEach(function (v) { if (v.mot && v.mot.blocked) { v.mot.blocked = false; if (v.on && !RM && v.mot.cur) motPlay(v); } });
    }, true);
  }
  function motIdle() { if (!MOT.n) return; TVS.forEach(function (v) { if (v.mot && !v.mot.el.paused) v.mot.el.pause(); }); }   /* 닫힘 · 판 보기 · 큰 지도 · 탭 가림 */
  function motStep(v, on, now) {
    var m = v.mot, el = m.el, n = m.ord[m.k % m.ord.length];
    if (!on) { if (!el.paused) el.pause(); return false; }
    if (m.cur !== n && m.want !== n && now >= m.retry) {
      m.want = n;
      motGet(n).then(function (u) {
        if (m.want !== n) return;
        m.cur = n; m.rep = 0; m.lastT = 0; el.src = u;
        motGet(m.ord[(m.k + 1) % m.ord.length]).catch(function () {});   /* 다음 차례 미리 */
        if (v.on && !RM) motPlay(v); else if (RM) motStill(v);
      }, function () { if (m.want === n) { m.want = ''; m.retry = performance.now() + 5000; } });
    }
    if (!m.cur || m.blocked) return false;
    if (el.paused) { motPlay(v); return false; }
    var ct = el.currentTime;
    if (m.cur === n && ct + 0.3 < m.lastT) { m.loops++; if (++m.rep >= (MOT.rep[n] || 1)) m.k++; }   /* 한 바퀴 돌았다 */
    m.lastT = ct;
    return el.readyState >= 2;
  }
  /* v5.53 판 6 · 7 = 판 보기에서만 움직임(사용자 261004 「6페이지와 7 페이지에는 각각 원과 달리기가 있는데 · 온라인 버전에서는 실제로 사람이 달리면 어떨까?」 · 권장안 승인)
   *   판 6 점 원(구) = sphere · 판 7 점 사람 = run(같은 m/ 영상 · 3D 벽의 판은 인쇄본 그대로 멈춤) · 그 판이 지금 장일 때만 재생 · 넘기거나 닫으면 멈추고 지운다
   *   그림 자리 = 새 조판(tour-boards.js)의 그림(img.art) 바로 뒤에 같은 클래스의 <video> · 재생이 시작되면 그림을 숨긴다(받는 중 · 실패 = 그림 그대로) · 글자는 그대로
   *   바탕 = 영상 검정 + mix-blend-mode screen(판의 검정 패널 · 회색 점 격자가 비친다) · 움직임 줄이기 = 지금 정지 그림 */
  var BD_MOT = { 5: 'circle', 6: 'sphere', 7: 'run' };   /* v5.58 (사용자 261004 「AX VISION 판의 5페이지에도 동그라미가 6 7 처럼 홍보부 영상으로」) 판 5 점 원(12점 고리) = 02_Circle(점 고리가 커졌다 작아지며 도는 모션 · 원본 그림과 가장 닮음) */
  function bdMot() {
    var tr = $('track'); if (!tr) return;
    Array.prototype.forEach.call(tr.querySelectorAll('video.bd-mv'), function (el) {
      var cd = el.closest('.card'); if (SH && !RM && cd && +cd.getAttribute('data-i') === SH.i) return;
      el.pause(); el.removeAttribute('src'); var im = el.previousElementSibling; if (im) im.style.display = ''; el.parentNode.removeChild(el);
    });
    if (!SH || RM || !MOT.on) return;
    var k = SH.i, sh = SH, c = tr.children[k]; if (!c || c.querySelector('video.bd-mv')) return;
    var b = c.querySelector('.bd[data-pg]'), n = b && BD_MOT[+b.getAttribute('data-pg')], im = n && c.querySelector('img.art'); if (!im) return;
    motGet(n).then(function (u) {
      if (SH !== sh || SH.i !== k || RM || !im.isConnected || c.querySelector('video.bd-mv')) return;
      var el = document.createElement('video'); el.className = im.className + ' bd-mv'; el.muted = true; el.defaultMuted = true; el.loop = true; el.playsInline = true;
      el.setAttribute('muted', ''); el.setAttribute('playsinline', ''); el.setAttribute('aria-hidden', 'true'); el.disablePictureInPicture = true;
      el.addEventListener('playing', function () { im.style.display = 'none'; el.classList.add('on'); }, { once: true });
      el.src = u; im.parentNode.insertBefore(el, im.nextSibling);
      var p = null; try { p = el.play(); } catch (e) { p = null; } if (p && p.catch) p.catch(function () {});
    }, function () {});
  }
  /* 돋보기 · 딱 두 곳(사용자 261003 「이벤트 판은 크게 보기를 없애고 경품 보기 · 타자왕 광고 보기만」)
   * ① 룰렛 「경품 보기」(앱 경품 사진 · 가격 없음 · 샘플 딱지) ② 타자왕 「타자왕 광고 보기」(../tv/typing/?promo=1) · 다른 구역은 챗봇 말풍선 → 판 보기 */
  var mags = [];
  function buildMags() {
    var box = $('mags'); box.innerHTML = ''; mags = [];
    var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>';
    var UPI = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V6"/><path d="M6.5 11.5L12 6l5.5 5.5"/></svg>';
    var PADI = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 8h9a4.5 4.5 0 0 1 4.3 5.8l-.9 3.1a2.2 2.2 0 0 1-3.8.8L14.4 16H9.6l-1.7 1.7a2.2 2.2 0 0 1-3.8-.8l-.9-3.1A4.5 4.5 0 0 1 7.5 8z"/><path d="M8 10.8v3M6.5 12.3h3"/></svg>';
    function add(label, run, at, n, extra) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mag' + (extra && extra.cls ? ' ' + extra.cls : ''); b.innerHTML = ((extra && extra.icon) || ICON) + '<span>' + esc(label) + '</span>'; b.setAttribute('aria-label', label);
      b.onclick = run; box.appendChild(b); mags.push(Object.assign({ el: b, at: at, n: n }, extra || {}));
    }
    add('타자왕 광고 보기', openPromo, toThree(1.75, 1.25).setY(1.0), null);   /* 「재생 중」 TV 앞 */
    var w = D.PROPS.wheel; add('경품 보기', openPrize, toThree(w[0] + 0.9, w[1]).setY(1.0), null);
    add('엘리베이터 타기', goGate, toThree(GATE.at[0], 11.05).setY(1.25), null, { r: 6.5, icon: UPI, cls: 'up' });   /* v5.49 게이트 앞 · 누르면 그 앞까지 */
  }
  var _m = new T.Vector3(), _c = new T.Vector3();
  /* v5.58 (사용자 261004 「이런 위치 정보가 너무 정신 없다」) 한 화면에 떠 있는 글자 = 말풍선 하나 + 자세히 보기 단추 · 겹치면 우선순위 낮은 것을 숨김(자세히 보기 > 말풍선 > 표지 단추 · 길잡이 이름표) */
  function declutter() {
    var keep = [], hid = 0;
    function rc(el) { var r = el.getBoundingClientRect(); return r.width ? r : null; }
    function hit(a, b) { return a.left < b.right + 4 && b.left < a.right + 4 && a.top < b.bottom + 4 && b.top < a.bottom + 4; }
    var lk = $('look'), gb = $('gbub'), sb = $('shot'), et = $('etip');
    if (et && !et.hidden) { var re = rc(et); if (re) keep.push(re); }   /* v5.84 엘리베이터 권유 = 말풍선보다 앞 */
    if (sb && !sb.hidden) { var r0 = rc(sb); if (r0) keep.push(r0); }   /* v5.67 사진 찍기 = 맨 앞 */
    if (lk && !lk.hidden) { var r1 = rc(lk); if (r1) keep.push(r1); }
    if (gb && !gb.hidden) { var r2 = rc(gb); if (r2 && keep.some(function (k) { return hit(k, r2); })) { gb.style.visibility = 'hidden'; hid++; } else { gb.style.visibility = ''; if (r2) keep.push(r2); } } else if (gb) gb.style.visibility = '';
    mags.concat(pinEls).forEach(function (m) { var el = m.el; if (el.style.display === 'none') { el.style.visibility = ''; return; } var r = rc(el); if (r && keep.some(function (k) { return hit(k, r); })) { el.style.visibility = 'hidden'; hid++; } else { el.style.visibility = ''; if (r) keep.push(r); } });
    G.declutter = hid;
  }
  function placeMags() {
    var W = $('stage').clientWidth, H = $('stage').clientHeight, on = G.loaded && G.scn === 'lobby' && !G.anim;
    mags.forEach(function (m) {
      if (!on) { m.el.style.display = 'none'; return; }
      if (m.pillar) {
        _c.set(camera.position.x - m.pillar.x, 0, camera.position.z - m.pillar.z).normalize();
        m.at = _m.set(m.pillar.x + _c.x * 0.72, 0.5, m.pillar.z + _c.z * 0.72).clone();
      } else if (m.n && m.n.x * (camera.position.x - m.at.x) + m.n.z * (camera.position.z - m.at.z) < 0) { m.el.style.display = 'none'; return; }
      var d = Math.hypot(m.at.x - G.pos.x, m.at.z - G.pos.z);
      if (d > (m.r || 4.5)) { m.el.style.display = 'none'; return; }
      if (m.cls === 'up' && ((G.push || 0) > 0.1 || G.squeeze)) { m.el.style.display = 'none'; return; }   /* 미는 동안 = 「더 힘내세요!」만 */
      _m.copy(m.at).project(camera);
      if (_m.z > 1 || Math.abs(_m.x) > 0.98 || Math.abs(_m.y) > 0.98) { m.el.style.display = 'none'; return; }
      m.el.style.display = ''; m.el.style.transform = 'translate(' + ((_m.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - _m.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-50%)';
    });
  }
  /* ═══════════ 스탬프 블록(v5.49 · 사용자 261004 「스탬프가 가능한 활동들을 각 부스에 넣고 점프로 머리로 치면 그 활동으로 이동」) ═══════════
   * 부스마다 머리 위(바닥에서 1.42m)에 주황 블록 하나 · 블록 아래에서 점프하면 머리가 「콩」 닿고 도장이 튀어 오른 뒤 활동 카드가 뜬다 · 블록을 톡 눌러도 같다(점프가 어려운 사람)
   * 카드 = 스탬프 이름 · 받는 법 한 줄 · 「바로 가기」(앱의 그 활동 화면 · 둘러보기를 닫고 간다) · 「계속 둘러보기」 · 바로 옮기지 않고 카드를 한 번 거친다(점프하다 잘못 쳐서 3D 를 나가 버리지 않게)
   * 내용 원천 = 앱 스탬프 표(index.html STAMPS · TOUR_HOST.stamp) · 이미 받은 스탬프 = 회색 블록 + 「받은 스탬프예요」 · 시험판(앱 밖)은 아래 STAMP_DEF 와 안내 한 줄
   * 모양은 우리 도장(손잡이 · 받침 · 찍힌 줄) · 남의 게임 블록(물음표)을 닮지 않게 */
  function HOST() { return window.TOUR_HOST || null; }
  var STAMP_DEF = {
    qz: { title: 'AX 퀴즈', desc: '5문제 · 모두 답하면 완주', cta: 'AX 퀴즈 풀기' },
    p5: { title: '아이디어 한 줄', desc: '아이디어 1건 제출', cta: '아이디어 쓰기' },
    p2: { title: 'AX PLAY', desc: '1F AX PLAY에서 HiDI-Q 또는 Hi-Helper 체험', cta: '내 QR 보여주기' },
    p3: { title: '프로그램 참여', desc: '17F 강연 QR 출석 · AX LOUNGE 상담 · AX 커피챗 중 1회', cta: 'AX LOUNGE 상담 신청' },   /* v5.58 앱(v5.57)과 같게 */
    p4: { title: '미니 게임', desc: 'AX 팡 · 점프 · 테트리스 3종 · 종목마다 한 판', cta: '미니 게임 하기' },
    st: { title: '계단 이용', desc: '엘리베이터가 혼잡하면 오늘 하루는 계단을 이용해 보세요', cta: '계단 안내' }
  };
  /* 자리 · stop = 그 구역 멈춤 자리에서 판을 보는 사람의 왼쪽 1.2m(스태프는 오른쪽) · at = 도면 자리(p4 = v5.51 타자왕 부스 앞 통로 쪽 · 노트북 탁자 동쪽 1.5m · 판 39 · 배너 48 을 가리지 않음 · st = 서쪽 코어 계단실 대리석 벽 앞)
   * v5.54 p5 = AX LAB 「아이디어 QR」 판(13 · 도면 25.9, 0.55) 바로 앞 1.4m(사용자 261004 「아이디어 한줄 QR 제출하기 판쪽 앞쪽에」) */
  var BLK_AT = [{ id: 'qz', stop: 'vision' }, { id: 'p5', at: [25.9, 1.95] }, { id: 'p2', stop: 'play' }, { id: 'p3', stop: 'lounge' }, { id: 'p4', at: [3.3, 2.5] }, { id: 'st', at: [12.4, 10.5] }, { id: 'st', at: [27.8, 16.05] }];   /* 261006 영상 = 계단 문이 북쪽 끝 흰 칠 벽(z 15.6 ~ 16.5) · 그 앞 0.6m */   /* v5.65 (사용자 261005 「이 근처 계단 스탬프는 계단실 입구로 이동해줘」) 동쪽 블록 = 로비 빈 칸(29.6, 10.4) → 1m 들어간 벽(x 27.2)의 계단 문(z 14.5 ~ 15.5) 바로 앞 0.6m */   /* v5.64 (사용자 261005 「이쪽 계단실 앞에도 스탬프 띄워줘」) 고객센터 쪽 계단 앞(로비 쪽 · 동쪽 빈 공간 입구) 하나 더 · 같은 스탬프(둘 중 하나만 받아도 둘 다 완료) */
  var BLOCKS = [], BLK_Y = 1.42, BLK_S = 0.46, BLK_M = null;
  function stampInfo(id) {
    var h = HOST(), o = null; try { o = h && h.stamp ? h.stamp(id) : null; } catch (e) { o = null; }
    var d = STAMP_DEF[id] || {};
    return { id: id, title: (o && o.title) || d.title || '', desc: (o && o.desc) || d.desc || '', cta: (o && o.cta) || d.cta || '바로 가기', got: !!(o && o.got), app: !!(h && h.stampGo) };
  }
  function stampGlyph(g, x, y, k, col) {   /* 도장 · 손잡이 공 + 목 + 받침 + 도장면 + 찍힌 줄 · (x, y) = 왼쪽 위 · k = 배율(128 칸 기준 1) */
    g.fillStyle = col; g.beginPath(); g.arc(x + 34 * k, y + 14 * k, 12 * k, 0, Math.PI * 2); g.fill();
    g.fillRect(x + 28 * k, y + 22 * k, 12 * k, 20 * k);
    g.beginPath(); if (g.roundRect) g.roundRect(x + 6 * k, y + 40 * k, 56 * k, 16 * k, 4 * k); else g.rect(x + 6 * k, y + 40 * k, 56 * k, 16 * k); g.fill();
    g.fillRect(x + 2 * k, y + 58 * k, 64 * k, 7 * k);
    g.fillRect(x + 8 * k, y + 72 * k, 52 * k, 5 * k);
  }
  /* v5.55 앱 스탬프 도장(index.html stampSealSvg · 패스포트 완료 도장 · 활동 화면 오른쪽 위 도장)과 같은 그림 · 100 칸 기준(-12도 · 테 두 겹 + 안쪽 원 · 위 호 「AX FESTIVAL」 · 아래 호 「2026」 · 양옆 별 · 가운데 글자)
   * 사용자 261004 「스탬프 아이콘 모양이 지금은 두개가 맞대어 있어서 이게 무지? · 스탬프가 하나만 보이는 게 좋을 것 같아」 · 옛 손잡이 도장(stampGlyph)은 동전에서 뺀다 */
  function sealDraw(g, cx, cy, R, col, mid, midSz) {
    var k = R / 50, F = '"Pretendard Variable", Pretendard, system-ui, sans-serif';
    g.save(); g.translate(cx, cy); g.rotate(-12 * Math.PI / 180); g.scale(k, k); g.strokeStyle = col; g.fillStyle = col;
    [[47.5, 3], [43.5, 1.2], [29, 1.2]].forEach(function (q) { g.lineWidth = q[1]; g.beginPath(); g.arc(0, 0, q[0], 0, Math.PI * 2); g.stroke(); });
    function arcText(s, r, top, ls) {   /* 위 = 글자 밑줄이 반지름 r(바깥으로 섬) · 아래 = 글자 밑줄이 반지름 r(안쪽으로 섬) · 왼쪽에서 오른쪽으로 읽힘 */
      g.font = '800 10px ' + F; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      var ch = s.split(''), ws = ch.map(function (c) { return g.measureText(c).width; }), tot = ws.reduce(function (a, b) { return a + b; }, 0) + ls * (ch.length - 1), a = -tot / 2;
      ch.forEach(function (c, i) { var th = (a + ws[i] / 2) / r; a += ws[i] + ls; g.save(); if (top) { g.rotate(th); g.translate(0, -r); } else { g.rotate(-th); g.translate(0, r); } g.fillText(c, 0, 0); g.restore(); });
    }
    arcText('AX FESTIVAL', 33, true, 1); arcText('2026', 41, false, 1.5);
    [-37.5, 37.5].forEach(function (sx) { g.beginPath(); for (var i = 0; i < 10; i++) { var an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 1.5 : 3.6; g.lineTo(sx + Math.cos(an) * rr, 0.4 + Math.sin(an) * rr); } g.closePath(); g.fill(); });
    g.font = '900 ' + (midSz || 19) + 'px ' + F; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(mid == null ? '완료' : mid, 0, 7);
    g.restore();
  }
  function blkTex(used) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    g.fillStyle = used ? '#BDB5AE' : '#FF7F32'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = used ? '#D6D0CA' : '#FFB284'; g.fillRect(0, 0, 128, 9); g.fillRect(0, 0, 9, 128);   /* 빛 받는 모서리 */
    g.fillStyle = used ? '#8F8780' : '#C85A1C'; g.fillRect(0, 119, 128, 9); g.fillRect(119, 0, 9, 128);   /* 그늘 모서리 */
    [[17, 17], [103, 17], [17, 103], [103, 103]].forEach(function (q) { g.fillRect(q[0] - 4, q[1] - 4, 8, 8); });
    if (used) { g.strokeStyle = '#FFFFFF'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(36, 66); g.lineTo(56, 86); g.lineTo(94, 44); g.stroke(); }
    else stampGlyph(g, 30, 22, 1, '#FFFFFF');
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function blkMats() {
    if (BLK_M) return BLK_M;
    function set(used) { var side = new T.MeshLambertMaterial({ map: blkTex(used), emissive: used ? 0x1A1816 : 0x3A1A08 }), cap = new T.MeshLambertMaterial({ color: used ? 0xA9A099 : 0xE5671E, emissive: used ? 0x141210 : 0x2A1206 }); return [side, side, cap, cap, side, side]; }
    var pc = document.createElement('canvas'); pc.width = pc.height = 128; var g = pc.getContext('2d');
    pc.width = pc.height = 256; g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
    sealDraw(g, 128, 128, 108, '#FF7F32', '스탬프', 17);   /* v5.55 튀어 오르는 도장도 앱 도장 하나 */
    var pt = new T.CanvasTexture(pc); pt.colorSpace = T.SRGBColorSpace;
    /* v5.51 (사용자 261004 「쨍한 주황 상자가 시선을 너무 빼앗는다 · 가상 요소로 보이게」) 상자 대신 떠 있는 반투명 도장 원판 · 받은 것 = 회색으로 더 흐리게
     * v5.54 (사용자 261004 「아까 네모는 너무 과했고, 지금은 너무 소심해」) 그 중간 · 지름 0.54m 동전(옛 상자 0.46 · 원판 0.40) · 주황 면을 진하게(.30 → .86) · 흰 도장 + 아래 작은 「스탬프」(가까이 오면 읽힘)
     *   늘 보는 쪽을 향하고 좌우로 살짝 흔들린다(옛 「계속 돌기」 = 옆면이 보일 때 사라져 멀리서 안 읽혔다) · 뒤에 은은한 주황 빛 맥박(1.8초) · 위아래 6cm 뜨기 · 받은 것 = 회색 · 빛 없음
     * 바닥 = 블록 바로 아래 둥근 표시(어두운 번짐 + 주황 테 · 바닥에서 12mm 띄움 · 깊이 쓰기 끔) · 「여기서 점프」 */
    /* v5.55 앞면 = 앱 스탬프 도장 하나(가운데 「스탬프」 · 받은 것 = 회색 면 + 「완료」 도장 · 앱 패스포트 완료 도장과 같은 글자) · 512 칸(가까이에서 글자가 또렷)
     *   옛 동전 = 앞뒷면 같은 반투명 그림 + 양면(DoubleSide) + 깊이 쓰기 끔 → 뒷면 뚜껑이 앞면 위에 한 번 더 그려졌다 · 이제 앞면만 그리고(FrontSide) 뒷면 뚜껑 = 그림 없는 면(앞에서는 가려 안 보임) */
    function face(used) {
      var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d'); g.translate(512, 0); g.scale(-2, 2);   /* 앞 뚜껑(FrontSide)에서 바로 읽히게 좌우를 미리 뒤집어 그린다(옛 그림은 뒷면 뚜껑이 겹쳐 그려져서 바로 보였다) */
      g.fillStyle = used ? 'rgba(255,127,50,.94)' : 'rgba(250,251,252,.95)'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();   /* v5.64 (사용자 261005 「완료가 주황」) 받은 것 = 주황 · 아직 = 흰 · 은회색 */
      sealDraw(g, 128, 128, 104, used ? '#FFFFFF' : '#6B7684', used ? '완료' : '스탬프', used ? 19 : 17);   /* v5.65 (v5.64 보고 후속 · 흰 판 앞에서 멀리 안 보임) 아직 = 도장 글자 · 테 한 단계 진하게(8B95A1 → 6B7684) */
      var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; t.center.set(0.5, 0.5); t.rotation = -Math.PI / 2; t.repeat.set(1, -1); return t;   /* 원판 뚜껑 UV 가 90도 돌고 뒤집혀 있다 · 바로 서게 */
    }
    function disc(used) {
      var f = new T.MeshBasicMaterial({ map: face(used), transparent: true, opacity: 1, depthWrite: false, side: T.FrontSide, toneMapped: false });
      var back = new T.MeshBasicMaterial({ color: used ? 0xE5671E : 0x7D8794, transparent: true, opacity: used ? 0.9 : 0.85, depthWrite: false, side: T.FrontSide, toneMapped: false });
      var rim = new T.MeshBasicMaterial({ color: used ? 0xFF7F32 : 0x6B7684, transparent: true, opacity: used ? 0.9 : 0.95, depthWrite: false, toneMapped: false });   /* v5.64 색 뒤집기 · 받은 것 = 주황 테 · 아직 = 은회색 테 */
      return [rim, f, back];
    }
    var gc = document.createElement('canvas'); gc.width = gc.height = 128; var gx = gc.getContext('2d'), gr0 = gx.createRadialGradient(64, 64, 18, 64, 64, 64);
    gr0.addColorStop(0, 'rgba(255,255,255,.95)'); gr0.addColorStop(0.45, 'rgba(176,184,193,.42)'); gr0.addColorStop(1, 'rgba(176,184,193,0)'); gx.fillStyle = gr0; gx.fillRect(0, 0, 128, 128);   /* v5.64 아직 받지 않은 동전 뒤 빛 = 흰 · 은회색(맥박 그대로) · 받은 것 = 빛 없음 */
    var glt = new T.CanvasTexture(gc); glt.colorSpace = T.SRGBColorSpace;
    /* v5.65 받침 그림자 · 동전 아래쪽으로 살짝 내린 어두운 번짐(보는 쪽을 향한 판 · 동전보다 먼저 그림) · 흰 판 앞에서도 동전 테두리가 떠 보이게 · 받은 것 · 아직 모두 */
    var shc = document.createElement('canvas'); shc.width = shc.height = 128; var shx = shc.getContext('2d'), shg = shx.createRadialGradient(64, 64, 30, 64, 64, 64);
    shg.addColorStop(0, 'rgba(25,31,40,.42)'); shg.addColorStop(0.62, 'rgba(25,31,40,.26)'); shg.addColorStop(1, 'rgba(25,31,40,0)'); shx.fillStyle = shg; shx.fillRect(0, 0, 128, 128);
    var sht = new T.CanvasTexture(shc); sht.colorSpace = T.SRGBColorSpace;
    /* v5.67 (사용자 261005 초등학생 시험 「스탬프에 점프해야 된다는 행동 유발이 잘 되지 않는다 · 자연스럽게 점프해 볼 수 있도록 유인 장치」) 바닥 표적 = 동전 바로 아래 · 점선 링 = 머리가 동전에 닿는 거리(0.5m · hitBlocks) 그대로 · 링 안 = 「여기 서서 점프」
     *   옛 v5.54 링(반지름 0.25m · 캐릭터 몸에 가려 안 보였다)을 몸 밖으로 넓혔다 · 안에 작은 발자국 둘(도형) · 원 안에 들어오면 밝은 주황 링(fl2)이 겹쳐 켜진다 */
    var sc = document.createElement('canvas'); sc.width = sc.height = 256; var sg = sc.getContext('2d'), gr = sg.createRadialGradient(128, 128, 8, 128, 128, 124);
    gr.addColorStop(0, 'rgba(53,26,12,.20)'); gr.addColorStop(0.75, 'rgba(53,26,12,.08)'); gr.addColorStop(1, 'rgba(53,26,12,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, 256, 256);
    sg.strokeStyle = 'rgba(255,127,50,.75)'; sg.lineWidth = 5; sg.setLineDash([13, 10]); sg.beginPath(); sg.arc(128, 128, 103, 0, Math.PI * 2); sg.stroke(); sg.setLineDash([]);
    sg.fillStyle = 'rgba(255,127,50,.45)'; [-1, 1].forEach(function (s) { sg.beginPath(); sg.ellipse(128 + s * 17, 128 + s * 6, 10, 17, 0, 0, Math.PI * 2); sg.fill(); });   /* 발자국 둘 */
    var st = new T.CanvasTexture(sc); st.colorSpace = T.SRGBColorSpace;
    var rc = document.createElement('canvas'); rc.width = rc.height = 256; var rg = rc.getContext('2d'), rg0 = rg.createRadialGradient(128, 128, 80, 128, 128, 124);
    rg0.addColorStop(0, 'rgba(255,127,50,0)'); rg0.addColorStop(0.55, 'rgba(255,164,99,.55)'); rg0.addColorStop(0.75, 'rgba(255,127,50,.9)'); rg0.addColorStop(0.86, 'rgba(255,164,99,.35)'); rg0.addColorStop(1, 'rgba(255,127,50,0)'); rg.fillStyle = rg0; rg.fillRect(0, 0, 256, 256);
    var rt2 = new T.CanvasTexture(rc); rt2.colorSpace = T.SRGBColorSpace;
    BLK_M = { on: set(false), used: set(true), pop: pt, dOn: disc(false), dUsed: disc(true), floor: st, ring: rt2, glow: glt, shade: sht };
    return BLK_M;
  }
  var HITM = null, DISC = null;
  function buildBlocks() {
    var M = blkMats(), geo = new T.BoxGeometry(BLK_S, BLK_S, BLK_S), box = $('mags');
    HITM = new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); DISC = new T.CylinderGeometry(0.27, 0.27, 0.045, 48);   /* v5.54 지름 0.54 */
    BLK_AT.forEach(function (d) {
      var x, z;
      if (d.stop) {
        var s = STOPS.filter(function (q) { return q.zone === d.stop; })[0]; if (!s || !s.look) return;
        var fx = s.look[0] - s.x, fz = s.look[1] - s.z, fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
        x = s.x - fz * 1.2; z = s.z + fx * 1.2;   /* 판을 보는 사람의 왼쪽(오른쪽 = (fz, -fx)) */
      } else { x = d.at[0]; z = d.at[1]; }
      var q = nearestFree(x, z) || [x, z];
      var m = new T.Mesh(geo, HITM); m.position.copy(toThree(q[0], q[1])); m.position.y = BLK_Y + BLK_S / 2;   /* v5.51 판정 상자(보이지 않음 · 크기 그대로 · 머리 · 톡 판정이 너그럽게 남는다) */
      m.userData = { stamp: d.id }; m.name = 'stampBlock';
      var dk = new T.Mesh(DISC, M.dOn); dk.rotation.x = Math.PI / 2; dk.renderOrder = 4; dk.userData = { stamp: d.id }; m.add(dk); m.userData.disc = dk;   /* 원판(세워서 보는 쪽을 향함 · v5.54 상자보다 넓어 원판을 톡 해도 블록) */
      var gl = new T.Sprite(new T.SpriteMaterial({ map: M.glow, transparent: true, depthWrite: false, opacity: 0.5, toneMapped: false })); gl.scale.set(0.95, 0.95, 1); gl.renderOrder = 3; gl.raycast = function () {}; m.add(gl); m.userData.glow = gl;   /* v5.54 뒤 빛 */
      var sh = new T.Sprite(new T.SpriteMaterial({ map: M.shade, transparent: true, depthWrite: false, opacity: 1, toneMapped: false })); sh.scale.set(0.66, 0.66, 1); sh.position.y = -0.035; sh.renderOrder = 3.5; sh.raycast = function () {}; m.add(sh); m.userData.shade = sh;   /* v5.65 받침 그림자(빛 다음 · 동전 앞) */
      var fl = new T.Mesh(new T.CircleGeometry(0.62, 40), new T.MeshBasicMaterial({ map: M.floor, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
      fl.rotation.x = -Math.PI / 2; fl.position.copy(toThree(q[0], q[1])); fl.position.y = 0.012; fl.renderOrder = 2; fl.name = 'stampFloor'; fl.raycast = function () {}; S.lobby.add(fl);
      var fl2 = new T.Mesh(fl.geometry, new T.MeshBasicMaterial({ map: M.ring, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -5 }));   /* v5.67 원 안 = 밝은 링 */
      fl2.rotation.x = -Math.PI / 2; fl2.position.copy(fl.position); fl2.position.y = 0.014; fl2.renderOrder = 2.5; fl2.visible = false; fl2.raycast = function () {}; S.lobby.add(fl2);
      var pop = new T.Sprite(new T.SpriteMaterial({ map: M.pop, transparent: true, depthWrite: false, opacity: 0 })); pop.visible = false; pop.scale.set(0.42, 0.42, 1); pop.renderOrder = 5;
      S.lobby.add(m); S.lobby.add(pop);
      BLOCKS.push({ id: d.id, m: m, pop: pop, lb: null, at: q, x: m.position.x, z: m.position.z, ph: Math.random() * 6, bumpT: -9, cool: 0, got: false, fl: fl, fl2: fl2, prox: 99, sw: 0, gp: 0, dip: 0, lit: 0, demoT: -9, t1: 0 });
    });
    refreshBlocks();
  }
  function refreshBlocks() {
    var M = blkMats();
    BLOCKS.forEach(function (b) {
      var i = stampInfo(b.id); b.got = i.got; b.title = i.title; b.m.userData.disc.material = i.got ? M.dUsed : M.dOn; b.m.userData.glow.visible = !i.got;
      /* v5.58 (사용자 261004 「스탬프는 별도의 설명 없이 그냥 그 위치에 떠 있으면서 뭐지? 하면서 흥미 요소로」) 블록 이름표 · 「점프로 톡」 없음 · 동전 그림(「스탬프」 · 받은 것 「완료」)만 */
    });
    G.need = true;
  }
  /* 오르는 중 머리(발 높이 + HEAD)가 블록 밑면을 지나면 「콩」 · 가로 거리 0.5m 안(블록 반 폭 0.23 + 몸 반지름 · 넉넉하게) */
  function hitBlocks(y0, y1) {
    var now = performance.now();
    for (var i = 0; i < BLOCKS.length; i++) {
      var b = BLOCKS[i]; if (now < b.cool) continue;
      if (Math.hypot(G.pos.x - b.x, G.pos.z - b.z) > 0.5) continue;
      if (y0 + HEAD <= BLK_Y + 0.02 && y1 + HEAD >= BLK_Y) { G.jy = BLK_Y - HEAD; G.jv = -1.2; hitBlock(b); return; }
    }
  }
  function hitBlock(b) {
    var now = performance.now(); b.bumpT = now; b.cool = now + 1400; G.moved = true; G.need = true; store.set('axfTour3Bump', '1'); G.jumpHint = null;   /* v5.58 처음 친 뒤 = 점프 강조 약하게 */
    b.pop.visible = true; b.pop.userData.t0 = now;
    setTimeout(function () { if (G.open && G.scn === 'lobby') openStampCard(b.id); }, RM ? 120 : 420);
  }
  function stepBlocks(now) {
    if (!BLOCKS.length) return false;
    var busy = false;
    BLOCKS.forEach(function (b) {
      var dtb = b.t1 ? Math.min(0.05, (now - b.t1) / 1000) : 0.016; b.t1 = now;
      /* v5.67 거리 피드백 · 받지 않은 동전 2.5m 안 = 가까울수록 빨리 흔들리고 빛 맥박이 빨라진다 · 원 안 = 동전이 8cm 내려와 크게 흔들림(「쳐 볼래?」) · 바닥 링이 밝아진다 */
      var k = !b.got && b.prox < JUMP_R ? 1 - b.prox / JUMP_R : 0, inR = AIM.b === b;
      b.sw += dtb * (1.3 + 3.2 * k + (inR ? 2.2 : 0)); b.gp += dtb * (Math.PI * 2 / 1.8) * (1 + 1.3 * k);
      b.dip += ((inR && !RM ? -0.08 : 0) - b.dip) * (1 - Math.exp(-dtb * 9)); b.lit += ((inR ? 1 : 0) - b.lit) * (RM ? 1 : 1 - Math.exp(-dtb * 10));
      var bob = RM ? 0 : Math.sin(G.clock * 2.0 + b.ph) * 0.06, bk = (now - b.bumpT) / 220, up = bk >= 0 && bk < 1 && !RM ? Math.sin(bk * Math.PI) * 0.15 : 0;
      var dk2 = (now - b.demoT) / 220; if (dk2 >= 0 && dk2 < 1 && !RM) up += Math.sin(dk2 * Math.PI) * 0.1;   /* 따라 하기 그림자가 친 동전 */
      b.m.position.y = BLK_Y + BLK_S / 2 + bob + up + b.dip;
      b.m.rotation.y = Math.atan2(camera.position.x - b.m.position.x, camera.position.z - b.m.position.z) + (RM ? 0 : Math.sin(b.sw + b.ph) * (0.35 + 0.15 * k + (inR ? 0.1 : 0)));   /* v5.54 보는 쪽을 향하고 좌우로 살짝(옛 계속 돌기 없앰) */
      var gl = b.m.userData.glow, pu = RM ? 0.5 : 0.5 + 0.5 * Math.sin(b.gp + b.ph);   /* v5.54 빛 맥박 */
      var nf = blkNear(b);   /* v5.73 카메라 바로 앞 동전 = 흐리게 */
      if (gl.visible) { gl.material.opacity = Math.min(0.95, 0.3 + 0.38 * pu + 0.22 * k) * nf; var gs = 0.86 + 0.16 * pu + 0.12 * k; gl.scale.set(gs, gs, 1); }
      b.m.userData.shade.material.opacity = nf;
      if (b.fl2) { b.fl2.visible = b.lit > 0.01; b.fl2.material.opacity = 0.95 * b.lit; var fs = 1 + (RM ? 0 : 0.05 * Math.sin(G.clock * 6)) * b.lit; b.fl2.scale.set(fs, fs, 1); b.fl.material.opacity = 0.8 + 0.2 * b.lit; if (b.lit > 0.01 && b.lit < 0.99) busy = true; }
      if (!RM) busy = true;
      if (b.pop.visible) {
        var pk = (now - b.pop.userData.t0) / 650;
        if (pk >= 1) { b.pop.visible = false; b.pop.material.opacity = 0; }
        else { b.pop.position.set(b.x, BLK_Y + BLK_S + 0.12 + (1 - Math.pow(1 - pk, 2)) * 0.75, b.z); b.pop.material.opacity = pk < 0.7 ? 1 : (1 - pk) / 0.3; var sw = Math.abs(Math.cos(pk * Math.PI * 3)); b.pop.scale.set(0.42 * (RM ? 1 : Math.max(0.15, sw)), 0.42, 1); busy = true; }
      }
    });
    if (aimDemoStep(now)) busy = true;
    if (AIM.b) busy = true;   /* 원 안 = 「점프!」 시간을 재려고 계속 그린다 */
    return busy;
  }
  /* v5.73 동전과 카메라 사이 1.6m 안 = 점점 흐리게(0.8m 안 = 숨김) · 원판 재질은 동전마다 따로 복사해 흐림(받음 · 아직 재질은 그대로 함께 씀) · 판정 상자 · 점프 치기는 그대로 */
  function blkNear(b) {
    var dk = b.m.userData.disc, M = blkMats(), base = b.got ? M.dUsed : M.dOn, d = camera.position.distanceTo(b.m.position), f = G.scn === 'lobby' && !G.anim ? clamp((d - 0.8) / 0.8, 0, 1) : 1;
    if (f >= 1) { if (dk.material !== base) dk.material = base; dk.visible = true; b.nf = 1; return 1; }
    if (!b.fm || b.fmGot !== b.got) { b.fm = base.map(function (m) { var c = m.clone(); c.transparent = true; c.depthWrite = false; return c; }); b.fmGot = b.got; }
    b.fm.forEach(function (m) { m.opacity = f; }); dk.material = b.fm; dk.visible = f > 0.02; b.nf = f; return f;
  }
  /* v5.58 (사용자 261004 「근처에 오면 점프 버튼을 강조해 주던가 해서 거기서 점프를 해야 되는구나」) 블록 2.5m 안(받지 않은 블록) = 점프 단추 맥박(주황 테 퍼짐 1.4초) · 처음 블록을 친 뒤(이 기기 기억)에는 약하게(테 색만) · 움직임 줄이기 = 테 색만 */
  var JUMP_R = 2.5;
  function placeBlocks() {
    var on = G.loaded && G.scn === 'lobby' && !G.anim && !G.sheetOpen && !PH.on, near = false, aim = null;
    BLOCKS.forEach(function (b) { b.prox = on && !b.got ? Math.hypot(b.x - G.pos.x, b.z - G.pos.z) : 99; if (b.prox < JUMP_R) near = true; if (b.prox < RING_R && (!aim || b.prox < aim.prox)) aim = b; });
    if (near !== G.jumpHint) { G.jumpHint = near; var jb = $('bJump'); if (jb) { jb.classList.toggle('hint', near); jb.classList.toggle('soft', near && store.get('axfTour3Bump') === '1'); } }
    aimSet(aim, performance.now());
  }
  /* ═══════════ v5.67 점프 유인(사용자 261005 초등학생 시험 · 「스탬프 근처에서 스탬프에 점프해야 된다는 행동 유발이 잘 되지 않는 것 같아 사람들이 자연스럽게 점프해 볼 수 있도록 유인 장치를 만들어줘」) ═══════════
   * 동전 둘레에 글자를 늘리지 않는다(사용자 v5.58 「별도의 설명 없이 떠 있으면서 뭐지?」) · 그림과 움직임으로만
   * ① 바닥 표적 = 동전 아래 점선 링 + 발자국(blkMats) · 링 = 머리가 닿는 거리(0.5m) · 안에 서면 링이 밝아지고 동전이 살짝 내려와 크게 흔들림(stepBlocks)
   * ② 점프 단추 = 원 안에 있는 동안 통통 튀고 단추 오른쪽 위에 작은 동전 모양(색 테가 아니라 모양 · CSS .jump.aim)
   * ③ 따라 하기 그림자 = 원 안에 처음 0.22초 서 있으면 내 캐릭터 자리에서 반투명 잔상이 뛰어 동전을 「콩」 치고 사라진다(0.8초 · 이번에 둘러보기를 연 동안 1번 · 이 기기에서 동전을 한 번이라도 쳤으면 없음 · 움직임 줄이기 = 없음)
   * ④ 거리 피드백 = 2.5m 안에서 가까울수록 동전이 빨리 흔들리고 빛 맥박이 빨라진다(stepBlocks)
   * ⑤ 「점프!」 = 원 안에서 5초 넘게 점프하지 않으면 점프 단추 왼쪽에 한 번(2.4초 보임) · 이 기기 처음 1번만 · 동전을 쳐 본 기기는 없음 · 글자는 이것 하나(단추 옆 · 동전 둘레가 아님)
   * 탭으로 동전을 눌러 여는 길은 그대로 */
  var RING_R = 0.5, AIM = { b: null, t: 0, sess: false, demo: null, ghost: null, tip: false, tipT: 0 };
  function aimSet(b, now) {
    var jb = $('bJump');
    if (b !== AIM.b) { AIM.b = b; AIM.t = now; if (jb) jb.classList.toggle('aim', !!b); if (!b) aimTip(false); }
    if (!b) return;
    var learned = store.get('axfTour3Bump') === '1';
    if (!AIM.sess && !AIM.demo && !learned && !RM && !G.air && now - AIM.t > 220) { AIM.sess = true; aimDemo(b, now); }
    if (!AIM.tip && !learned && !G.air && now - AIM.t > 5000 && store.get('axfTour3JumpTip') !== '1') { store.set('axfTour3JumpTip', '1'); aimTip(true); }
  }
  function aimTip(on) {
    var t = $('jtip'); if (!t) return; clearTimeout(AIM.tipT);
    if (on) { AIM.tip = true; t.hidden = false; t.classList.remove('go'); void t.offsetWidth; t.classList.add('go'); AIM.tipT = setTimeout(function () { t.hidden = true; }, 2400); G.aimTipN = (G.aimTipN || 0) + 1; }
    else t.hidden = true;
  }
  function aimGhost() {
    if (AIM.ghost) return AIM.ghost;
    var g = makeCritter(0xFFC56E, 0xFF7F32, 0xE5671E); g.name = 'jumpGhost';
    g.traverse(function (o) { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; o.material.depthWrite = false; o.renderOrder = 6; o.raycast = function () {}; } });
    g.visible = false; S.lobby.add(g); AIM.ghost = g; return g;
  }
  function aimDemo(b, now) { var g = aimGhost(); AIM.demo = { b: b, t0: now, x: G.pos.x, z: G.pos.z, h: G.h, hit: false }; g.userData.body.position.y = 0; G.aimDemoN = (G.aimDemoN || 0) + 1; G.need = true; }
  function aimDemoStep(now) {
    var D = AIM.demo; if (!D) return false;
    var g = AIM.ghost, t = (now - D.t0) / 1000;
    if (t >= 0.8 || !G.open || G.scn !== 'lobby' || G.sheetOpen || PH.on) { g.visible = false; AIM.demo = null; return true; }
    var y = t < 0.64 ? 0.46 * Math.sin(Math.PI * t / 0.64) : 0, op = t < 0.08 ? t / 0.08 : t > 0.6 ? Math.max(0, (0.8 - t) / 0.2) : 1;
    g.position.set(D.x, y, D.z); g.rotation.y = D.h; g.visible = true;
    var sy = t < 0.32 ? 1 + 0.12 * Math.sin(Math.PI * t / 0.32) : 1; g.userData.body.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    g.traverse(function (o) { if (o.isMesh) o.material.opacity = 0.42 * op; });
    if (!D.hit && t >= 0.32) { D.hit = true; D.b.demoT = now; }
    return true;
  }
  var SCARD = null;
  function openStampCard(id) {
    var i = stampInfo(id); SCARD = i; setRun(false);
    $('scT').textContent = i.title; $('scD').textContent = i.desc; $('scGot').hidden = !i.got;
    $('scGo').textContent = i.cta; $('scard').hidden = false; G.sheetOpen = true; G.stick = null; G.path = null;
    setTimeout(function () { try { $('scard').focus({ preventScroll: true }); } catch (e) {} }, 30);   /* 화면 읽기 프로그램이 카드로 오게 · 버튼에 포커스 테두리는 남기지 않는다 */
  }
  function closeStampCard() { if (!SCARD) return; SCARD = null; $('scard').hidden = true; G.sheetOpen = false; G.need = true; G.last = 0; }
  function goStamp() {
    var i = SCARD; if (!i) return; closeStampCard();
    var h = HOST();
    if (h && h.stampGo) { try { h.stampGo(i.id); return; } catch (e) {} }
    toast('앱에서는 「' + i.cta + '」 화면으로 가요');
  }

  /* 룰렛 상품 · 앱 경품 표(index.html PRIZES.roulette)와 같은 이름 · 수량 · 사진 · 가격 없음 · 실물 사진 전까지 「샘플」 딱지 */
  var ROUL = [{ rk: '1등', nm: '텀블러', q: 60, img: ['rl1_tumbler'] }, { rk: '2등', nm: '커피 + 키캡 키링', q: 100, img: ['rl2_coffee', 'rl2_keyring'] }, { rk: '3등', nm: '컵받침', q: 150, img: ['rl3_coaster'] }, { rk: '4등', nm: '판스티커', q: 250, img: ['rl4_sticker'] }, { rk: '5등', nm: '볼펜', q: 400, img: ['rl5_pen'] }];
  function openPrize() {
    var cards = ROUL.map(function (p) {
      return '<article class="card prize" aria-label="' + esc(p.rk + ' ' + p.nm) + '"><h2><span class="k">' + p.rk + '</span>' + esc(p.nm) + '<span class="q">' + p.q + '개</span></h2>' +
        '<div class="pic"><div class="pz' + (p.img.length > 1 ? ' two' : '') + '">' + p.img.map(function (im) { return '<span class="ph"><img alt="' + esc(p.nm) + '" data-src="' + ROOT + 'assets/prize/' + im + '.webp"><i>샘플</i></span>'; }).join('') + '</div></div></article>';
    });
    openSheet({ name: 'EVENT', title: '룰렛 경품' }, 0, null, cards);   /* v5.66 칩 = EVENT 점 글자 · 「룰렛 경품」은 제목 줄(타자왕 순위판 머리와 같은 짜임) */
  }
  /* 타자왕 순위판 · 1층 TV 와 같은 전체 루프(../tv/typing/ · 후킹 · 게임 · 하는 법 · 상품 · 순위 TOP 10 · 마감 · 순위 30초 폴링 · 사용자 261003 「1층 랭킹 보드 화면 그대로 · 등수도」) · 시트 안 9:16 · 닫으면 iframe 을 비워 폴링 멈춤 */
  function openPromo() {
    var v = $('vid'), b = $('vbody'); v.hidden = false; G.sheetOpen = true; signPaint($('vSign'), 'EVENT');   /* v5.66 점 글자 칩 */
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
    o += '<rect x="' + mmX(EHR.x) + '" y="' + mmY(EH.z1) + '" width="' + ((EH.x0 - EHR.x) * MM.k).toFixed(1) + '" height="' + ((EH.z1 - EHR.z) * MM.k).toFixed(1) + '" fill="#FFFFFF"/>';   /* v5.64 코어 동쪽 1m 들어간 칸 */
    o += '<rect x="' + mmX(VB.x0) + '" y="' + mmY(VB.z1) + '" width="' + ((EHR.x - VB.x0) * MM.k).toFixed(1) + '" height="' + ((VB.z1 - VB.z0) * MM.k).toFixed(1) + '" fill="#FFFFFF"/>';   /* 261006 방화문 안 작은 홀 */
    if (B.room3) o += '<polygon points="' + B.room3.pts.map(function (q) { return mmX(q[0]) + ',' + mmY(q[1]); }).join(' ') + '" fill="#F2F4F6" stroke="#B0B8C1" stroke-width="0.8"/>';
    D.ZONES.forEach(function (z) {
      if (!z.rows.length) return;
      var b = zoneRect(z);
      o += '<rect class="mz" data-z="' + z.id + '" x="' + mmX(b[0]) + '" y="' + mmY(b[3]) + '" width="' + ((b[1] - b[0]) * MM.k).toFixed(1) + '" height="' + ((b[3] - b[2]) * MM.k).toFixed(1) + '" rx="1.5"/>';
      z.rows.forEach(function (r) { var n = r.pages.length; o += '<line x1="' + mmX(r.a[0]) + '" y1="' + mmY(r.a[1]) + '" x2="' + mmX(r.a[0] + r.r[0] * n) + '" y2="' + mmY(r.a[1] + r.r[1] * n) + '" stroke="#FF7F32" stroke-width="2"/>'; });
    });
    o += '<circle cx="' + mmX(B.revolve) + '" cy="' + mmY(0) + '" r="3" fill="#4E5968"/><circle cx="' + mmX(32.57) + '" cy="' + mmY(8.4) + '" r="3" fill="#4E5968"/><rect x="' + mmX(17.0) + '" y="' + mmY(11.7) + '" width="' + (2.8 * MM.k).toFixed(1) + '" height="3" fill="#4E5968"/>';
    o += '<rect x="' + mmX(WW.x1 - WW.w) + '" y="' + mmY(WW.z + 0.15) + '" width="' + (WW.w * MM.k).toFixed(1) + '" height="2" fill="#191F28"/>';   /* v5.45 가벽 */
    o += '<circle class="mmev" cx="' + mmX(18.4) + '" cy="' + mmY(10.45) + '" r="9"/><circle class="mmev" cx="' + mmX(27.6) + '" cy="' + mmY(17.3) + '" r="9"/>';   /* v5.84 엘리베이터 권유 동안만 보이는 강조 */
    o += '<g id="t3-mmMe"><path d="M0,-8 L5,3 L0,1 L-5,3 Z" fill="#191F28"/><circle r="4.2" fill="#FF7F32" stroke="#FFFFFF" stroke-width="1.5"/></g></g></svg>';
    $('mini').innerHTML = o; G.mmAz = null;
  }
  function mini() {
    if (!G.loaded || G.scn !== 'lobby' || G.mapMode) return;
    var me = $('mmMe'); if (!me) return;
    if (G.bigMap) bigMini();
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
      var n = D.viewPages(z).length;   /* v5.58 판 보기 장 수(NOVIEW 빼고) */
      cta.innerHTML = z.id === 'cafe' ? '18F 커피챗 보기' : esc(z.name) + ' 판 크게 보기 <span class="n">' + n + '장</span>';
      cta.hidden = false;
    } else cta.hidden = true;
    var s = STOPS[G.stop], w = $('where');
    if (G.scn === 'cafe' || G.scn === 'elev') cta.hidden = true;
    if (G.scn === 'cafe') w.textContent = '18F AX 커피챗';
    else if (G.scn === 'elev') w.textContent = '엘리베이터 안 · 몇 층으로 갈까요?';   /* v5.50 엘리베이터 안에서 다시 그려도 로비 글이 돌아오지 않게 */
    else if (G.mode === 'auto' && G.goal != null) w.textContent = STOPS[G.goal].name + '(으)로 가는 중';
    else if (z) w.textContent = '지금: ' + (sp ? sp.name : z.id === 'cafe' ? '게이트 · 엘리베이터' : z.name) + ' 앞 · ' + (G.stop + 1) + ' / ' + STOPS.length;
    else w.textContent = '지금: ' + (G.mode === 'stop' && s.where ? s.where : '로비');
    $('bPrev').disabled = G.stop <= 0 && G.mode !== 'free';
    $('bNext').disabled = G.stop >= STOPS.length - 1 && G.mode === 'stop';
    var nx = Math.min(STOPS.length - 1, G.stop + (G.mode === 'stop' || G.mode === 'auto' ? 1 : 1));
    $('bNext').innerHTML = '다음 구역' + CHV_R;
    $('bNext').setAttribute('aria-label', '다음 구역: ' + STOPS[nx].name);
    $('navRow').hidden = G.scn === 'cafe' || G.scn === 'elev'; $('cafeRow').hidden = G.scn !== 'cafe';   /* v5.50 엘리베이터 안 = 이전 · 다음 구역 숨김(「1층에서 내리기」만 · v5.49 는 다시 그릴 때 되살아났다) */
    $('cap').hidden = true;
  }
  function onNext() { hideDrag(); if (G.mode === 'free') nearestStop(); var k = G.mode === 'auto' && G.goal != null ? G.goal + 1 : G.stop + 1; goStop(Math.min(STOPS.length - 1, k)); }
  function onPrev() { hideDrag(); if (G.mode === 'free') nearestStop(); var k = G.mode === 'auto' && G.goal != null ? G.goal - 1 : G.stop - 1; goStop(Math.max(0, k)); }

  /* ═══════════ 엘리베이터(v5.49 · 사용자 261004) ═══════════
   * 「엘리베이터 타기」 표지(게이트 앞 · 누르면 그 앞까지 걸어가 게이트 쪽으로 돌아선다) → 게이트(도면 x 17.15~19.65 · z 11 부터 막힘)에 대고 북쪽으로 계속 밀면
   *   0.12초 뒤 머리 위 「더 힘내세요!」 · 몸이 게이트에 눌려 납작해지며 떨린다 · 1.3초를 채우면 찹쌀떡처럼 가늘게 늘어나 게이트 사이를 비집고 나가고(0.75초) 화면이 까매지며 엘리베이터 안
   * 엘리베이터 안 = 현대엘리베이터 느낌의 은색 헤어라인 스테인리스 · 문 두 짝 · 문 위 층 표시(▲ 1) · 오른쪽 버튼판 · 짙은 돌 바닥 · 뒤 벽 · 천장은 단면으로 숨김(로비 모형과 같은 문법) · 상표 · 로고는 넣지 않는다
   *   나와 같은 모양 캐릭터 9명이 계란판처럼 3 × 3 으로 문을 보고 서 있다(뒤통수가 보임 · 나는 맨 뒤 가운데 · 발밑 주황 고리) · 가끔 한 명이 두리번
   *   오른쪽 층 버튼 18 · 17 · 10 = 누르면 불이 들어오고 다 같이 살짝 뛴 뒤 「데모 버전입니다」(사용자 결정) · 아래 「1층에서 내리기」 = 게이트 앞으로 돌아온다 · 뒤로 가기도 같다 */
  var GATE = { x0: 17.15, x1: 19.65, z: 10.45, at: [18.4, 10.6] }, PUSH_T = 0.7;   /* v5.51 밀기 1.3 → 0.7초(그 뒤 쭈압 0.9초가 「더 힘내세요!」를 이어 받는다) */
  /* v5.56 (사용자 261004 「좁은 벽을 끝까지 빠져 나가서 반대편으로 퉁 하고 튕겨 나가야 되는데, 지금은 그 사이에 퉁 낑겨」) 옛 v5.51 = 쭈압 0.45m + 푱 0.8m · 몸이 함 안(z 약 12.2)에서 띠용 · 끼어 보였다
   * 게이트 실측(모형 props_body · 261004) = 함 4개 x 17.03~17.21 · 17.88~18.07 · 18.74~18.92 · 19.59~19.78 · 길이 = 도면 z 11.26(앞면) ~ 12.56(반대편 면) · 틈 3개 폭 0.67(가운데 17.545 · 18.405 · 19.255)
   *   북쪽 통로(x 17.0~19.8)는 반대편 면부터 z 15.5 까지 물체 없음(충돌 칸은 걷는 곳 밖이라 막힘 · 연출 동안은 충돌을 보지 않고 자리를 직접 정한다)
   * 몸 반지름 BR = 아래 띠 0.355 x 0.95 = 0.337 · 몸 뒤끝 = 중심 - BR x 앞뒤 늘림(sqS z) · 옆 = BR x 옆 늘림(sqS x)
   * 쭈압 1.0초 = 가장 가까운 틈 가운데로 줄 맞춤(0.3) · 옆이 홀쭉 0.58(0.3 · 함과 옆으로 안 겹침) · 앞뒤 1.6배(0.1~0.55) · 중심이 틈 속을 지나(천천히 → 빨라짐) 몸 뒤끝이 반대편 면에 닿는 자리(중심 12.56 + 0.539)까지
   * 푱 0.2초 = 그 순간(뒤끝 - 반대편 면 = 0)부터 0.6m 더 · 낮게 날듯(최고 0.16m) · 둥글게 돌아옴 · 띠용 0.9초 = 착지 자리(뒤끝이 반대편 면에서 0.8m · 출렁여도 0.74m 밖 · 게이트와 겹침 0) */
  var SQ = { a: 1000, b: 200, c: 900, pop: 0.6, hop: 0.16 }, GZ = { ze: 11.26, zx: 12.56, lanes: [17.545, 18.405, 19.255] }, BR = 0.337;
  var SQ_CAM = { x0: GATE.x0 - 0.25, x1: GATE.x1 + 0.25, z0: GZ.ze - 0.35, z1: GZ.zx + 0.35, hi: ~((1 << Math.ceil(1.65 / COCC_H)) - 1) };   /* v5.79 비집기 동안 카메라 막힘에서 뺄 칸(게이트 함 · 유리 날개 둘레 · 0.15m 층 11개 = 1.65m 아래) */
  function stepPush(dt, p0, nz, blocked) {
    var on = !!p0 && !G.squeeze && G.scn === 'lobby' && p0[0] > GATE.x0 && p0[0] < GATE.x1 && p0[1] > GATE.z && nz > 0.55 && blocked;
    if (on) { G.push = (G.push || 0) + dt; G.pushDir = Math.PI; if (G.push >= PUSH_T) startSqueeze(); }
    else if (G.push) G.push = Math.max(0, G.push - dt * 2.5);
    G.pushK = (G.push || 0) > 0.05 ? clamp(G.push / PUSH_T, 0, 1) : 0;
    var ch = $('cheer'), show = ((G.push || 0) > 0.12 && !G.squeeze) || (!!G.squeeze && performance.now() - G.squeeze.t0 < (RM ? 150 : SQ.a));   /* v5.51 쭈압 동안도 「더 힘내세요!」 */
    if (show && ch.hidden && VIS.cheerN >= CHEER_MAX) show = false;   /* v5.84 이번 방문 3번까지(밀기 · 비집기는 그대로) */
    if (ch.hidden === show) { ch.hidden = !show; if (show) { VIS.cheerN++; ch.classList.remove('pop'); ch.getBoundingClientRect(); ch.classList.add('pop'); } }
  }
  function placeCheer() {
    var ch = $('cheer'); if (ch.hidden) return;
    _p.copy(G.pos); _p.y = 1.35 + (G.jy || 0); _p.project(camera);
    ch.style.transform = 'translate(' + ((_p.x + 1) / 2 * $('stage').clientWidth).toFixed(1) + 'px,' + ((1 - _p.y) / 2 * $('stage').clientHeight).toFixed(1) + 'px) translate(-50%,-100%)';
  }
  function startSqueeze() {
    var p0 = planOf(G.pos), lx = GZ.lanes.reduce(function (a, b) { return Math.abs(b - p0[0]) < Math.abs(a - p0[0]) ? b : a; });   /* v5.56 가장 가까운 틈 */
    G.squeeze = { t0: performance.now(), x0: p0[0], z0: p0[1], lx: lx, done: false }; G.push = 0; G.pushK = 0; G.path = null; G.air = false; G.jy = 0; G.landT = 0; G.face = Math.PI;   /* 북쪽을 본다(몸 앞뒤 = 틈 방향) */
    $('gbub').hidden = true; $('look').hidden = true; setRun(false);
    if (MOT.on) { motGet(EV_ORD[0]).catch(function () {}); motGet(EV_ORD[1]).catch(function () {}); }   /* v5.58 엘리베이터 광고 첫 영상 미리(들어서자마자 재생 · 옛 = 들어간 뒤 받기 시작해 늦게 돌았다) */
  }
  function stepSqueeze(now) {
    var q = G.squeeze, A = RM ? 150 : SQ.a, B = RM ? 60 : SQ.b, C = RM ? 150 : SQ.c, t = now - q.t0, x = 1, y = 1, z = 1, c, hop = 0, ph, j = RM ? 0 : Math.sin(now * 0.075) * 0.035;
    var SQ_FIT = 0.97;   /* v5.64 옆 홀쭉 0.58 → 0.97 · 몸 옆 반폭 0.337 x 0.97 = 0.327 · 틈 반폭 0.335 · 남는 틈 약 8mm(겹침 0) */
    var cA = GZ.zx + BR * 1.6, cB = cA + SQ.pop, px = q.lx;   /* 쭈압 끝 = 늘어난 몸 뒤끝이 반대편 면 · 푱 끝 = 0.6m 더 */
    if (t < A) {   /* 쭈압 · 틈 가운데로 줄 맞추며 옆은 홀쭉 · 앞뒤로 늘어 틈 속을 지난다 · 버티는 잔떨림 */
      /* v5.64 (사용자 261005 「진짜 딱 맞게 비집고 들어가는 식」) 옆 = 틈 폭에 딱(SQ_FIT · 몸 옆 끝이 함 면에서 약 8mm · 겹침 0 · 잔떨림은 안쪽으로만) · 위로 살짝 눌려 솟음
       *   나아감 = 들어가며 멈칫(0.32 ~ 0.56 동안 4cm) → 쭉 빠짐 · 앞뒤 늘림 1.6 그대로(쭈압 끝 = 늘어난 뒤끝이 반대편 면) */
      var u = t / A, ex = easeIO(clamp(u / 0.3, 0, 1)), ez = easeIO(clamp((u - 0.1) / 0.45, 0, 1));
      var pr = u < 0.32 ? 0.3 * easeIO(u / 0.32) : u < 0.56 ? 0.3 + 0.04 * ((u - 0.32) / 0.24) : 0.34 + 0.66 * (1 - Math.pow(1 - (u - 0.56) / 0.44, 2.2));
      x = 1 - (1 - SQ_FIT) * ex - Math.abs(j) * 0.5 * (1 - ex); z = 1 + 0.6 * ez; y = 1 + 0.07 * ez + (u > 0.32 && u < 0.56 ? j * 0.5 : 0); px = q.x0 + (q.lx - q.x0) * ex; c = q.z0 + (cA - q.z0) * pr; ph = 'a';
    } else if (t < A + B) {   /* 푱 · 뒤끝이 반대편 면을 빠져나간 순간부터 튕겨 나가며 한 번 부풀었다 */
      var k = (t - A) / B, o = Math.sin(k * Math.PI); x = SQ_FIT + (1 - SQ_FIT) * k + 0.24 * o; y = 1.07 - 0.07 * k + 0.24 * o; z = 1.6 - 0.6 * k + 0.12 * o; c = cA + SQ.pop * (1 - Math.pow(1 - k, 3)); hop = RM ? 0 : SQ.hop * o; ph = 'b';
    } else {   /* 띠용용용 · 떨어진 자리에서 세로 · 가로가 번갈아 · 감쇠 스프링 */
      var s2 = (t - A - B) / 1000, d = Math.exp(-4.2 * s2) * (RM ? 0.3 : 1), w = Math.cos(2 * Math.PI * 3.6 * s2); y = 1 + 0.24 * d * w; x = z = 1 - 0.17 * d * w; c = cB; ph = 'c';
    }
    G.sqS = [x, y, z]; G.sqK = clamp(t / (A + B + C), 0, 1);
    G.pos.copy(toThree(px, c)); G.jy = hop;   /* 북쪽으로 게이트를 지나 · 충돌 칸은 보지 않는다 */
    if (G.sqLog) G.sqLog.push([Math.round(t), ph, +px.toFixed(4), +c.toFixed(4), +x.toFixed(4), +z.toFixed(4), +hop.toFixed(4)]);   /* 확인용(api.sqLog) */
    if (t >= A + B + C && !q.done) { q.done = true; G.sqS = [1, 1, 1]; G.jy = 0; toElev(); }
  }
  /* ── 엘리베이터 장면 · 로비에서 멀리(three x +300) 따로 세운다 · 처음 탈 때 만든다 ── */
  var EV = { g: null, O: new T.Vector3(300, 0, 0), W: 2.3, D: 2.0, H: 2.45, bots: [], hopT: -9, lookT: 0, look: null };   /* v5.65 (사용자 261005 「엘리베이터가 비좁아서 엉덩이가 튀어 나오니 거기까지 확장」) 폭 2.1 → 2.3 · 깊이 1.6 → 2.0 · 몸 반지름 0.337 + 발밑 고리 0.42 가 벽 · 바닥 끝 안 */
  function steelTex(w, h, seed) {   /* 261006 (사용자 엘리베이터 영상) 벽 = 결이 거의 안 보이는 새틴 스테인리스(조명 받은 따뜻한 은색 · 위쪽 넓은 반사 · 세로 반사 띠 · 고운 점 결) · 옛 = 가로 헤어라인이 또렷한 은색 */
    var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#E0DEDB'); gr.addColorStop(0.35, '#D0CECB'); gr.addColorStop(0.75, '#C5C3C0'); gr.addColorStop(1, '#CCCAC7'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    var r = seed || 7; function rnd() { r = (r * 16807) % 2147483647; return r / 2147483647; }
    for (var b = 0; b < 3; b++) { var bx = rnd() * w, bw = w * (0.12 + rnd() * 0.18), lg = g.createLinearGradient(bx - bw, 0, bx + bw, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,' + (0.1 + rnd() * 0.08).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(bx - bw, 0, bw * 2, h); }   /* 세로 넓은 반사 띠 */
    for (var i = 0; i < w * h / 8; i++) { var a = 0.025 + rnd() * 0.035; g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(70,72,74,' + a + ')'; g.fillRect(rnd() * w, rnd() * h, 1, 1); }   /* 고운 점 결 */
    for (var j = 0; j < w * h / 500; j++) { g.fillStyle = 'rgba(255,255,255,' + (0.02 + rnd() * 0.03) + ')'; g.fillRect(rnd() * w - 10, rnd() * h, 10 + rnd() * 40, 1); }   /* 아주 옅은 짧은 결 */
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function evText(txt, w, h, col, bg, font) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = col; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  var CRIT_GEO = null;
  function makeCritter(cHead, cBand, cFoot) {   /* 내 캐릭터와 같은 모양(머리 돔 · 아래 띠 · 안테나 공 · 눈 · 발) · 색만 다르다 */
    if (!CRIT_GEO) {
      var pts = [new T.Vector2(0.335, 0.24)]; for (var i = 0; i <= 14; i++) { var a = i / 14 * Math.PI / 2; pts.push(new T.Vector2(Math.max(0.0001, Math.cos(a) * 0.335), 0.43 + Math.sin(a) * 0.36)); }
      CRIT_GEO = { head: new T.LatheGeometry(pts, 24), band: new T.CylinderGeometry(0.355, 0.33, 0.2, 24), bot: new T.SphereGeometry(0.33, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), st: new T.CylinderGeometry(0.02, 0.02, 0.13, 6), ball: new T.SphereGeometry(0.075, 12, 10), eye: new T.SphereGeometry(0.046, 10, 8), foot: new T.SphereGeometry(0.085, 10, 8) };
    }
    var C = CRIT_GEO, mH = lam(cHead), mB = lam(cBand), mF = lam(cFoot), ink = new T.MeshBasicMaterial({ color: 0x282320 });
    var g = new T.Group(), body = new T.Group(); g.add(body);
    body.add(new T.Mesh(C.head, mH)); var b = new T.Mesh(C.band, mB); b.position.y = 0.14; body.add(b);
    var b0 = new T.Mesh(C.bot, mB); b0.scale.y = 0.25; b0.position.y = 0.04; body.add(b0);
    var st = new T.Mesh(C.st, mH); st.position.y = 0.85; body.add(st); var bl = new T.Mesh(C.ball, mB); bl.position.y = 0.94; body.add(bl);
    var eyes = [], smiles = [];   /* v5.58 포토부스 · 인터뷰 친구들 = 웃는 눈(반달 · 도형) */
    [-1, 1].forEach(function (sd) { var e = new T.Mesh(C.eye, ink); e.scale.set(1, 1.15, 0.45); e.position.set(sd * 0.12, 0.55, 0.305); body.add(e); eyes.push(e); var sm = smileEye(ink, sd); body.add(sm); smiles.push(sm); var f = new T.Mesh(C.foot, mF); f.scale.set(1, 0.6, 1.35); f.position.set(sd * 0.15, 0.035, 0.04); g.add(f); });
    g.scale.setScalar(0.95); g.userData.body = body; g.userData.eyes = eyes; g.userData.smiles = smiles; return g;
  }
  function buildElev() {
    var g = new T.Group(); g.name = 'elevator'; g.position.copy(EV.O); g.visible = false; scene.add(g); EV.g = g;
    var W = EV.W, D = EV.D, H = EV.H, fz = -D / 2;
    var rose = new T.MeshPhongMaterial({ color: 0xC0866A, specular: 0x8A5A44, shininess: 60 });
    var steel = new T.MeshPhongMaterial({ map: steelTex(256, 512, 11), specular: 0x5A5F64, shininess: 38 }), steelD = new T.MeshPhongMaterial({ map: steelTex(256, 512, 29), color: 0xC9CDD1, specular: 0x4A4F54, shininess: 30 }), seam = lam(0x6E747A), dark = lam(0x2B2F34);
    function box(w, h, d, m, x, y, z) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; }
    /* 바닥 · 261006 (사용자 엘리베이터 영상) 밝은 크림 대리석(옅은 구름 · 가는 결 · 은은한 광택) + 둘레 스테인리스 띠 · 옛 = 짙은 화강석 점 무늬 */
    var fc = document.createElement('canvas'); fc.width = fc.height = 512; var fg = fc.getContext('2d'), fr = 31; function frn() { fr = (fr * 16807) % 2147483647; return fr / 2147483647; }
    fg.fillStyle = '#E3DDD1'; fg.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 26; i++) { var cx = frn() * 512, cy = frn() * 512, cr = 40 + frn() * 120, rg0 = fg.createRadialGradient(cx, cy, 0, cx, cy, cr); rg0.addColorStop(0, frn() < 0.5 ? 'rgba(244,240,232,.5)' : 'rgba(208,199,184,.35)'); rg0.addColorStop(1, 'rgba(227,221,209,0)'); fg.fillStyle = rg0; fg.fillRect(cx - cr, cy - cr, cr * 2, cr * 2); }   /* 옅은 구름 */
    fg.lineCap = 'round'; for (var vn = 0; vn < 9; vn++) { var vx = frn() * 512, vy = frn() * 512; fg.strokeStyle = 'rgba(150,138,120,' + (0.1 + frn() * 0.12).toFixed(3) + ')'; fg.lineWidth = 0.8 + frn() * 1.6; fg.beginPath(); fg.moveTo(vx, vy); fg.bezierCurveTo(vx + 80 + frn() * 120, vy + (frn() - 0.5) * 160, vx + 160 + frn() * 140, vy + (frn() - 0.5) * 220, vx + 260 + frn() * 200, vy + (frn() - 0.5) * 260); fg.stroke(); }   /* 가는 결 */
    for (var sp = 0; sp < 2400; sp++) { var sv = 190 + Math.floor(frn() * 50); fg.fillStyle = 'rgba(' + sv + ',' + (sv - 6) + ',' + (sv - 16) + ',.35)'; fg.fillRect(frn() * 512, frn() * 512, 1, 1); }
    var ft = new T.CanvasTexture(fc); ft.colorSpace = T.SRGBColorSpace; ft.anisotropy = 4;
    var floor = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshPhongMaterial({ map: ft, specular: 0x24221F, shininess: 60 })); floor.rotation.x = -Math.PI / 2; g.add(floor);
    box(W, 0.012, 0.06, steel, 0, 0.006, fz + 0.03); box(W, 0.012, 0.06, steel, 0, 0.006, -fz - 0.03);
    /* 옆 벽(세 장 · 이음줄) · 손잡이 */
    [-1, 1].forEach(function (sd) {
      box(0.04, H, D, steel, sd * (W / 2 + 0.02), H / 2, 0);
      [-D / 6, D / 6].forEach(function (z) { box(0.006, H, 0.012, seam, sd * (W / 2 - 0.002), H / 2, z); });
      var rail = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, D - 0.34, 12), rose);   /* v5.58 사진 = 로즈골드(구리빛) 둥근 봉 */ rail.rotation.x = Math.PI / 2; rail.position.set(sd * (W / 2 - 0.07), 0.92, 0.02); g.add(rail);
      [-(D - 0.34) / 2 + 0.02, (D - 0.34) / 2 + 0.02].forEach(function (z) { var pst = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.07, 8), steelD); pst.rotation.z = Math.PI / 2; pst.position.set(sd * (W / 2 - 0.035), 0.92, z); g.add(pst); });
      box(0.05, 0.03, D, dark, sd * (W / 2 - 0.005), H + 0.015, 0);   /* 천장 테 */
    });
    /* 뒤 벽은 두지 않는다(카메라 쪽 · 로비 모형처럼 단면) · 바닥 끝 띠만 */
    /* 앞 벽 · 문 두 짝 · 가운데 줄 · 문틀 · 문 위 층 표시 · 오른쪽 버튼판 */
    var DW = 1.1, DH = 2.15, sw = (W - DW) / 2;
    [-1, 1].forEach(function (sd) { box(sw, H, 0.05, steel, sd * (DW / 2 + sw / 2), H / 2, fz - 0.025); box(0.04, DH, 0.07, steelD, sd * (DW / 2 + 0.02), DH / 2, fz - 0.005); box(DW / 2, DH, 0.03, steelD, sd * DW / 4, DH / 2, fz - 0.03); });
    box(DW + 0.08, H - DH, 0.05, steel, 0, (DH + H) / 2, fz - 0.025);
    box(0.006, DH, 0.034, seam, 0, DH / 2, fz - 0.012);
    /* v5.58 (사용자 261004 엘리베이터 내부 사진) 문 오른쪽 세로 조작반 기둥(헤어라인 스테인리스 · 바닥 ~ 천장) · 맨 위 모니터(위 = 광고 · 아래 띠 = ▲ + 층 숫자) · 버튼 두 줄(왼 1~9 · 오른 10~18 · 위에서 아래로 큰 수부터) · 열림 · 닫힘 · 비상 · 정원 표시판
     *   모니터 아래 띠 = 사진은 파란 띠 · 앱 디자인 규칙(파랑 금지)대로 먹색 띠 + 주황 ▲ + 흰 숫자 · 날짜 · 날씨 · 상표 로고는 넣지 않는다 · 누를 수 있는 것은 화면 오른쪽 층 단추(18 · 17 · 10) · 누르면 같은 층 버튼에 주황 불 */
    var CX = DW / 2 + 0.2, CW = 0.3;   /* 261006 영상 = 기둥이 문틀에 붙고 더 넓다(옛 0.17 · 0.24) */
    box(CW, H - 0.02, 0.016, steelD, CX, H / 2, fz + 0.008);
    var MW = 0.27, MH = 0.22, MY = 1.98;   /* 261006 영상 = 모니터가 기둥 폭에 가깝게 크고 천장 쪽(옛 0.22 · 0.2 · 1.86) */
    box(MW + 0.012, MH + 0.012, 0.006, dark, CX, MY, fz + 0.019);
    var scr = new T.Mesh(new T.PlaneGeometry(MW, MH * 0.74), new T.MeshBasicMaterial({ color: 0x14171C, toneMapped: false })); scr.position.set(CX, MY + MH * 0.13, fz + 0.023); scr.name = 'tvScreen'; scr.userData = { tv: true, elev: true }; g.add(scr);
    EV.indCv = document.createElement('canvas'); EV.indCv.width = 220; EV.indCv.height = 52; EV.indTex = new T.CanvasTexture(EV.indCv); EV.indTex.colorSpace = T.SRGBColorSpace; evInd(1, false);
    var ind = new T.Mesh(new T.PlaneGeometry(MW, MH * 0.26), new T.MeshBasicMaterial({ map: EV.indTex, toneMapped: false })); ind.position.set(CX, MY - MH * 0.37, fz + 0.023); g.add(ind);
    var SPY = MY - MH / 2 - 0.2; box(0.05, 0.008, 0.004, dark, CX, SPY, fz + 0.018);   /* 261006 영상 · 모니터 아래 작은 스피커 틈(상표 글자는 넣지 않는다) */
    EV.btn = {}; var ringOff = new T.MeshBasicMaterial({ color: 0xA9AEB3, toneMapped: false }), ringOn = new T.MeshBasicMaterial({ color: 0xFF7F32, toneMapped: false }), RG = new T.RingGeometry(0.0155, 0.0195, 24), CG = new T.CircleGeometry(0.0158, 24);
    EV.ringOff = ringOff; EV.ringOn = ringOn; var FM = {};
    for (var f2 = 1; f2 <= 18; f2++) {
      var col2 = f2 <= 9 ? 0 : 1, row = f2 <= 9 ? 9 - f2 : 18 - f2, bx = CX + (col2 ? 0.026 : -0.026), by = 1.47 - row * 0.05;
      var fm2 = new T.MeshBasicMaterial({ map: evBtnTex(String(f2)), toneMapped: false }); FM[f2] = fm2; var face = new T.Mesh(CG, fm2); face.position.set(bx, by, fz + 0.019); g.add(face);
      var rg = new T.Mesh(RG, ringOff); rg.position.set(bx, by, fz + 0.0195); g.add(rg); EV.btn[f2] = rg;
    }
    ['◁▷', '▷◁'].forEach(function (t, i) { var b2 = new T.Mesh(CG, new T.MeshBasicMaterial({ map: evBtnTex(t, 20), toneMapped: false })); b2.position.set(CX + (i ? 0.026 : -0.026), 0.98, fz + 0.019); g.add(b2); var r3 = new T.Mesh(RG, ringOff); r3.position.set(b2.position.x, 0.98, fz + 0.0195); g.add(r3); });   /* 열림 · 닫힘(도형 문자) */
    var em = new T.Mesh(CG, new T.MeshBasicMaterial({ color: 0xC9A227, toneMapped: false })); em.position.set(CX, 0.92, fz + 0.019); em.scale.setScalar(0.8); g.add(em);   /* 비상(노란 단추 · 그림 없음) */
    box(0.07, 0.15, 0.004, lam(0xD5D8DB), CX, 0.7, fz + 0.018);   /* 정원 표시판(글자 없음) */
    [0.75, 0.72, 0.69, 0.66].forEach(function (y) { box(0.045, 0.006, 0.002, lam(0x8E949A), CX, y, fz + 0.021); });
    box(W - 0.3, 0.02, 0.05, new T.MeshBasicMaterial({ color: 0xFFFFFF, toneMapped: false }), 0, H - 0.01, fz + 0.12);   /* 천장 등 띠(앞) */
    /* v5.55 왼쪽 위 광고 화면(사용자 261004 「엘리베이터 좌측 상단에도 광고 영상이 나오게」) · 문 왼쪽 벽판 위쪽(9명 머리 · 오른쪽 층 버튼과 겹치지 않음)
     *   은색 테(벽에서 5mm 띄움) + 짙은 베젤(테에서 1mm) + 화면(베젤에서 4mm) · 같은 면에 겹치는 판 없음 · 1층 TV 와 같은 홍보부 모션(m/ · VideoTexture · 보일 때만 · 움직임 줄이기 = 정지 그림) */
    EV.tv = MOT.on ? motAdd(scr, 'elev') : tvAdd(scr, 64, 64, 'elev');   /* v5.58 광고 = 조작반 모니터 위쪽(옛 v5.55 왼쪽 위 0.34m 화면은 없앰) */
    if (EV.tv.mot) EV.tv.mot.ord = EV_ORD;   /* 짧은 영상부터(달리기 2초 · AX 3초 · 꽃 6초) · 들어서자마자 움직임 */
    /* 261006 (사용자 엘리베이터 영상 · 문 양쪽에 같은 조작반) 문 왼쪽 기둥 = 오른쪽과 같은 짜임(맨 위 모니터 · 같은 광고 · 같은 층 띠 · 스피커 틈 · 버튼 18개 두 줄 · 열림 · 닫힘)
     *   광고 판 · 층 띠 · 버튼 그림은 오른쪽 것을 같이 쓴다(영상 하나 · 캔버스 하나 · 새 그리기 없음) · 왼쪽 버튼 테 = EV.btnL(누르면 양쪽 다 주황) */
    var LX = -CX;
    box(CW, H - 0.02, 0.016, steelD, LX, H / 2, fz + 0.008);
    box(MW + 0.012, MH + 0.012, 0.006, dark, LX, MY, fz + 0.019);
    var scrL = new T.Mesh(scr.geometry, scr.material); scrL.position.set(LX, scr.position.y, scr.position.z); scrL.name = 'evScreenL'; scr.children.forEach(function (c) { var k = new T.Mesh(c.geometry, c.material); k.position.copy(c.position); k.raycast = function () {}; scrL.add(k); }); g.add(scrL);
    var indL = new T.Mesh(ind.geometry, ind.material); indL.position.set(LX, ind.position.y, ind.position.z); g.add(indL);
    box(0.05, 0.008, 0.004, dark, LX, SPY, fz + 0.018);
    EV.btnL = {};
    for (var f3 = 1; f3 <= 18; f3++) {
      var c3 = f3 <= 9 ? 0 : 1, r3w = f3 <= 9 ? 9 - f3 : 18 - f3, x3 = LX + (c3 ? 0.026 : -0.026), y3 = 1.47 - r3w * 0.05;
      var fc3 = new T.Mesh(CG, FM[f3]); fc3.position.set(x3, y3, fz + 0.019); g.add(fc3);
      var rg3 = new T.Mesh(RG, ringOff); rg3.position.set(x3, y3, fz + 0.0195); g.add(rg3); EV.btnL[f3] = rg3;
    }
    ['◁▷', '▷◁'].forEach(function (t, i) { var b4 = new T.Mesh(CG, new T.MeshBasicMaterial({ map: evBtnTex(t, 20), toneMapped: false })); b4.position.set(LX + (i ? 0.026 : -0.026), 0.98, fz + 0.019); g.add(b4); var r4 = new T.Mesh(RG, ringOff); r4.position.set(b4.position.x, 0.98, fz + 0.0195); g.add(r4); });
    /* 261006 영상 · 왼쪽 옆 벽 앞쪽 = 가로 조작반(손잡이 바로 위 · 스테인리스 판 · 단추 3줄 x 6 + 왼쪽 단추 3 · 문 쪽 끝 검은 안내판) · 그림 한 장(누르지 않음 · 글자 없음)
     *   벽 안쪽 면에서 4mm 띄운 판(벽과 같은 면 겹침 없음) · 손잡이(높이 0.92) 위 1.02 ~ 1.18 */
    var hc = document.createElement('canvas'); hc.width = 512; hc.height = 140; var hg = hc.getContext('2d'), hgr = hg.createLinearGradient(0, 0, 0, 140);
    hgr.addColorStop(0, '#D6D7D8'); hgr.addColorStop(1, '#BDBFC1'); hg.fillStyle = hgr; hg.fillRect(0, 0, 512, 140); hg.strokeStyle = 'rgba(90,94,98,.55)'; hg.lineWidth = 3; hg.strokeRect(1.5, 1.5, 509, 137);
    hg.fillStyle = '#1E2125'; hg.fillRect(418, 14, 80, 112); hg.fillStyle = 'rgba(200,204,208,.55)'; [30, 44, 58, 72, 86, 100].forEach(function (y) { hg.fillRect(428, y, 60, 3); });   /* 검은 안내판(글자 대신 줄) */
    function hbtn(x, y, r) { var bg = hg.createRadialGradient(x - 3, y - 4, 1, x, y, r); bg.addColorStop(0, '#F2F3F4'); bg.addColorStop(1, '#A9AEB3'); hg.fillStyle = bg; hg.beginPath(); hg.arc(x, y, r, 0, Math.PI * 2); hg.fill(); hg.strokeStyle = '#80868C'; hg.lineWidth = 2; hg.stroke(); }
    [36, 70, 104].forEach(function (y) { hbtn(34, y, 11); for (var k = 0; k < 6; k++) hbtn(110 + k * 50, y, 14); });
    var ht = new T.CanvasTexture(hc); ht.colorSpace = T.SRGBColorSpace; ht.anisotropy = 4;
    var hp = new T.Mesh(new T.PlaneGeometry(0.62, 0.17), new T.MeshLambertMaterial({ map: ht })); hp.rotation.y = Math.PI / 2; hp.position.set(-W / 2 + 0.004, 1.1, fz + 0.62); hp.name = 'evSidePanel'; g.add(hp);   /* 판 오른쪽(그림) = 문 쪽 */
    /* 계란판 · 3 × 3 · 나는 맨 뒤 가운데 */
    var COLS = [[0x8DBBEB, 0x001F5B, 0x00184A], [0xB8E0C8, 0x2E7D5B, 0x245F46], [0xF6C1CF, 0xB4466A, 0x8E3653], [0xD7C8F2, 0x5B3FA0, 0x47317D], [0xFFE08A, 0xC98A00, 0xA06E00], [0xC9D2DC, 0x4E5968, 0x3C4552], [0xA8DDE0, 0x1F7A80, 0x175F63], [0xFFD0B0, 0xD9622B, 0xB24E20]], ci = 0;
    [-0.58, -0.06, 0.46].forEach(function (z, ri) {   /* v5.65 앞줄 = 문에서 0.42m(옛 0.4) · 뒷줄 몸 뒤끝 0.80 · 고리 0.88 < 바닥 끝 1.0 */
      [-0.66, 0, 0.66].forEach(function (x, cj) {   /* 옆 몸 끝 0.66 + 0.337 + 흔들림 0.03 = 1.03 < 손잡이 1.08 */
        if (ri === 2 && cj === 1) { EV.me = [x, z]; return; }
        var c = COLS[ci++ % COLS.length], m = makeCritter(c[0], c[1], c[2]); m.position.set(x + (Math.random() - 0.5) * 0.06, 0, z + (Math.random() - 0.5) * 0.05); m.rotation.y = Math.PI; g.add(m);
        EV.bots.push({ m: m, ph: Math.random() * 6, h0: Math.PI, h: Math.PI, i: EV.bots.length });
      });
    });
    var ring = new T.Mesh(new T.RingGeometry(0.36, 0.42, 32), new T.MeshBasicMaterial({ color: 0xFF7F32, toneMapped: false, transparent: true, opacity: 0.9 })); ring.rotation.x = -Math.PI / 2; ring.position.set(EV.me[0], 0.01, EV.me[1]); g.add(ring);
  }
  var EV_ORD = ['run', 'ax', 'flower', 'circle', 'metowe', 'alpha', 'wetome', 'sphere'];
  function evInd(n, up) {   /* 모니터 아래 띠 · 먹색 + 주황 ▲(올라갈 때만 · 서 있으면 흐린 ▲) + 흰 층 숫자 */
    var c = EV.indCv; if (!c) return; var g = c.getContext('2d'); g.fillStyle = '#14171C'; g.fillRect(0, 0, 220, 52);
    g.fillStyle = up ? '#FF7F32' : 'rgba(255,127,50,.45)'; g.beginPath(); g.moveTo(18, 38); g.lineTo(32, 14); g.lineTo(46, 38); g.closePath(); g.fill();
    g.fillStyle = '#FFFFFF'; g.font = '800 34px "Pretendard Variable", Pretendard, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(String(n), 58, 28);
    EV.indN = n; EV.indTex.needsUpdate = true; G.need = true;
  }
  function evBtnTex(t, fs) { var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'); var gr = g.createRadialGradient(26, 22, 4, 32, 32, 32); gr.addColorStop(0, '#F4F5F6'); gr.addColorStop(1, '#B9BEC3'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = '#2B3036'; g.font = '700 ' + (fs || 30) + 'px "Pretendard Variable", Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 32, 34); var x = new T.CanvasTexture(c); x.colorSpace = T.SRGBColorSpace; return x; }
  function elevCam() {
    var dy = 0, dx = 0, r = EV.rise;
    if (r && !RM) { var k = clamp((performance.now() - r.t0) / r.d, 0, 1); dy = -0.035 * Math.sin(Math.PI * k) * (k < 0.5 ? 1 : 0.6); dx = 0.004 * Math.sin(performance.now() * 0.06) * Math.sin(Math.PI * k); }   /* v5.58 출발 · 살짝 눌렸다가 떠오름 + 잔떨림 */
    camera.position.set(EV.O.x + dx, 3.3 + dy, EV.O.z + 3.15); camera.lookAt(EV.O.x + dx, 0.7 + dy, EV.O.z - 0.42);   /* v5.65 칸이 넓어진 만큼 뒤 · 위로(옛 3.15 · 2.9 · -0.3) */
  }
  function stepElev(dt, now) {
    var t = G.clock;
    if (now > EV.lookT) { EV.lookT = now + 2200 + Math.random() * 1800; var pick = EV.bots[Math.floor(Math.random() * EV.bots.length)]; EV.look = { b: pick, t0: now, sd: Math.random() < 0.5 ? -1 : 1 }; }
    EV.bots.forEach(function (b, i) {
      var body = b.m.userData.body, hk = (now - EV.hopT - i * 45) / 300, hop = hk > 0 && hk < 1 && !RM ? Math.sin(hk * Math.PI) * 0.14 : 0;
      b.m.position.y = hop; body.rotation.z = RM ? 0 : Math.sin(t * 1.4 + b.ph) * 0.035;
      var want = b.h0; if (EV.look && EV.look.b === b && now - EV.look.t0 < 1300) want = b.h0 + EV.look.sd * 0.7;
      b.h += (want - b.h) * (1 - Math.exp(-dt * 6)); b.m.rotation.y = b.h;
    });
    var mk = (now - EV.hopT - 4 * 45) / 300; bot.position.y = mk > 0 && mk < 1 && !RM ? Math.sin(mk * Math.PI) * 0.14 : 0;
    if (EV.turn) {   /* v5.51 나만 돌아보기 · 0.4초 돌고(움직임 줄이기 0.12초) · 눈웃음으로 머물다 · 다시 앞으로 · 끝 = 정확히 Math.PI(문 쪽 · 카메라와 같은 방향) */
      var tt = now - EV.turn.t0, td = RM ? 120 : 400, a;
      if (now >= EV.turn.end) { a = 0; EV.turn = null; } else if (tt < td) a = easeIO(tt / td); else if (now > EV.turn.end - td) a = easeIO((EV.turn.end - now) / td); else a = 1;
      bot.rotation.y = a > 0 ? Math.PI * (1 - a) : Math.PI; smileSet(botParts.eyes, botParts.smiles, a > 0.8);
    }
    botParts.body.rotation.z = RM ? 0 : Math.sin(t * 1.4 + 1.3) * 0.035;
    return true;
  }
  function elevUi(on) {
    $('pad').hidden = on; $('ctl').hidden = on; $('mini').hidden = on; $('evp').hidden = !on; $('navRow').hidden = on;   /* v5.65 「1층에서 내리기」 줄 없앰 = 층 단추 1(뒤로 가기도 1층) */
    $('gbub').hidden = true; $('look').hidden = true; lookFrame(null); $('cheer').hidden = true; $('cta').hidden = true;
    $('where').textContent = on ? '엘리베이터 안 · 몇 층으로 갈까요?' : $('where').textContent;
  }
  function toElev() {
    store.set('axfTour3Elev', '1'); etipHide();   /* v5.84 엘리베이터를 탄 사람에게는 권유 없음 */
    veilText(''); veilCover(360, null, function () {   /* v5.51 전환 막 */
      if (!EV.g) buildElev();
      G.squeeze = null; G.sqK = 0; G.stick = null; G.scn = 'elev'; S.lobby.visible = false; S.cafe.visible = false; EV.g.visible = true;
      bot.position.set(EV.O.x + EV.me[0], 0, EV.O.z + EV.me[1]); bot.rotation.y = Math.PI; botParts.body.scale.set(1, 1, 1); botParts.body.position.y = 0; botParts.body.rotation.set(0, 0, 0);
      shadow.position.y = 0.02 / bot.scale.y; shadow.scale.set(1, 1, 1); (botParts.waves || []).forEach(function (w) { w.material.opacity = 0; });
      elevUi(true); elevCam(); G.need = true; setRun(false);
      setTimeout(function () { veilReveal(420, null); }, 60);
    });
  }
  function elevSwap() {   /* 1층 게이트 앞(들어간 자리) · 들어간 쪽(북쪽)의 반대 = 남쪽을 보고 선다 · 시점은 게이트가 화면 위(v5.55 · 얼굴이 카메라 쪽) */
    G.scn = 'lobby'; if (EV.g) EV.g.visible = false; S.lobby.visible = true; G.stick = null; EV.turn = null;
    G.pos.copy(toThree(GATE.at[0], GATE.at[1] - 0.3)); G.az = G.azTo = Math.PI; G.face = G.h = 0; G.mode = 'free'; G.path = null; G.jy = 0; G.air = false; G.landT = 0; G.push = 0; G.pushK = 0;
    bot.position.copy(G.pos); bot.rotation.y = 0;
    if (EV.from === 'cs') { G.pos.copy(toThree(28.7, (FDW.z0 + FDW.z1) / 2)); G.az = G.azTo = -Math.PI / 2; G.face = G.h = Math.PI / 2; bot.position.copy(G.pos); bot.rotation.y = G.h; }   /* 261006 방화문 쪽에서 탔으면 방화문 앞(동쪽을 보고 · 문이 화면 위) */
    EV.from = null;
    var c = camWant(); G.camPos.copy(c.pos); G.look.copy(c.look); camera.position.copy(c.pos); camera.lookAt(c.look); nearestStop();
    elevUi(false); G.need = true; G.ctaKey = ''; updateUi(true);
  }
  function leaveElev(now) {   /* now = 연출 없이(둘러보기를 닫을 때 · v5.65 층 안내에서 돌아오지 않고 새로 열 때) · 아니면 v5.55 아이리스(문구 없이) */
    if (now) { irAbort(); irEnd(); elevSwap(); smileSet(botParts.eyes, botParts.smiles, false); return; }
    elevGo(false);
  }
  /* v5.65 (사용자 261005 「각 엘리베이터 이동시에도 각 안내장표로 갈 수 있을 것 같아 · 연결」 · 「1층도 층에 넣자」)
   *   18 · 17 · 10 = 올라가는 표시(▲ + 숫자) → 돌아보기 → 아이리스로 닫힘 → 띵 → 앱이 그 층 안내를 연다(TOUR_HOST.floorGo · 둘러보기는 엘리베이터 안 그대로 닫힘 · 뒤로 = 엘리베이터 안)
   *   1 = 「1층에서 내리기」와 같다(올라가는 표시 없이 돌아보기 → 아이리스 → 1층 게이트 앞) · 앱 밖(시험판 · 연결 없음)에서는 옛 「데모 버전입니다」 문구 */
  function pressFloor(btn) {
    if (EV.seq) return;
    btn.classList.add('lit'); G.need = true;
    var fl = +btn.getAttribute('data-f'); EV.goF = fl; if (EV.btn && EV.btn[fl]) EV.btn[fl].material = EV.ringOn;   /* v5.58 조작반 그 층 버튼 주황 테 */ if (EV.btnL && EV.btnL[fl]) EV.btnL[fl].material = EV.ringOn;   /* 261006 왼쪽 조작반도 */
    if (fl === 1) elevGo('exit');
    else { EV.hopT = performance.now(); var h = HOST(); elevGo(h && h.floorGo ? 'floor' : 'demo'); }
    setTimeout(function () { btn.classList.remove('lit'); }, 1400);
  }
  function irFloorDone() {   /* 검은 화면 그대로 · 엘리베이터 장면 그대로 · 앱으로 */
    EV.seq = null; IR.cur = null; G.keepElev = true;
    var h = HOST(); try { h.floorGo(EV.goF); } catch (e) { G.keepElev = false; irEnd(); }
  }
  function elevBack() {   /* 층 안내에서 뒤로 · 엘리베이터 안(문 쪽을 보고 · 모니터 1 · 단추 불 끔) */
    irEnd(); EV.turn = null; EV.rise = null; bot.rotation.y = Math.PI; elevUi(true); elevCam(); G.need = true;
  }
  /* ═══════════ v5.55 엘리베이터 아이리스(사용자 261004 「동물의 숲에서 다음 장면으로 넘어가는 것처럼 · 나를 중심으로 까만 화면이 동그랗게 작아지고 내 얼굴이 마지막으로 까맣게 덮이게」) ═══════════
   * 층 단추 = 돌아보기 · 눈웃음 1.2초 → 아이리스 아웃 1.35초(0.8초 동안 천천히 줄어 얼굴 크기 · 0.35초 멈칫 · 0.2초 톡 닫힘) → 검은 화면 두 줄 「데모 버전입니다.」 「1층으로 이동합니다.」 1.8초
   *   → 1층 게이트 앞(남쪽을 봄 · 얼굴이 카메라 쪽) → 아이리스 인 1.1초(0.12초 검정 · 0.22초 얼굴 크기로 톡 열림 · 0.14초 멈칫 · 0.62초 화면 끝까지)
   * 「1층에서 내리기」 · 뒤로 가기 = 돌아보기 0.5초 → 아이리스 아웃 → 0.3초 검정(문구 없음) → 아이리스 인
   * 동그라미 중심 = 매 프레임 내 캐릭터 얼굴의 화면 좌표 · 얼굴 크기 = 머리 반지름(0.36m)의 화면 크기 x 1.25 · 캔버스 2D(검정 채움 + destination-out 원 · 가장자리 안티에일리어스)
   * 흐름 동안 입력 막음(덮개가 누름을 받음 · 뒤로 가기 · 키 무시) · 움직임 줄이기 = 0.2초 페이드 · 문구 그대로 · 엘리베이터 밖 전환(열기 · 닫기 · 구역 이동)은 주황 점 격자 그대로
   * 띵(v5.55 · 사용자 261004 「전환되면서 띵~ 하는 소리」) = 문구가 뜰 때 · 1층에서 열릴 때 · 로비 음악과 같은 AudioContext(음악을 켠 때만 · ambient · 효과음은 이것 하나) */
  var IR = { raf: 0, log: [], dings: [], cur: null };
  /* v5.58 (사용자 261004 「층을 누르면 엘리베이터가 위로 올라가는 표시가 나면서 화면 전환」) 맨 앞 rise 1.3초 = 모니터 띠 ▲ + 숫자 1 → 누른 층(천천히 출발해 빨라졌다 멈춤) · 카메라 살짝 눌렸다 떠오름 · 그 뒤 돌아보기 0.8초(옛 1.2) · 문구 1.5초(옛 1.8) · 합 6.05초(옛 5.45)
   *   움직임 줄이기 = 숫자만(0.9초 · 카메라 그대로) */
  var IR_PH = { demo: [['rise', 1300], ['turn', 800], ['out', 1350], ['text', 1500], ['in', 1100]], demoRm: [['rise', 900], ['turn', 400], ['fo', 200], ['text', 1700], ['fi', 300]],
    floor: [['rise', 1300], ['turn', 800], ['out', 1350], ['hold', 250]], floorRm: [['rise', 900], ['turn', 400], ['fo', 200], ['hold', 150]],   /* v5.65 층 안내 · 닫힌 뒤 검정 0.25초(띵) → 앱 */
    exit: [['turn', 500], ['out', 1350], ['gap', 300], ['in', 1100]], exitRm: [['turn', 300], ['fo', 200], ['gap', 150], ['fi', 300]] };
  var _ia = new T.Vector3(), _ib = new T.Vector3(), _ic = new T.Vector3();
  function irFace() {   /* 내 캐릭터 얼굴(머리 가운데 · 바닥에서 0.52 x 크기)의 화면 좌표(창 기준) · 반지름 = 머리 반지름의 화면 크기 */
    var st = $('stage').getBoundingClientRect(), s = bot.scale.y;
    camera.updateMatrixWorld();
    _ia.set(bot.position.x, bot.position.y + 0.52 * s, bot.position.z); _ib.copy(_ia); _ic.setFromMatrixColumn(camera.matrixWorld, 0);
    _ia.project(camera); _ib.addScaledVector(_ic, 0.36 * s).project(camera);
    var x = st.left + (_ia.x + 1) / 2 * st.width, y = st.top + (1 - _ia.y) / 2 * st.height, x1 = st.left + (_ib.x + 1) / 2 * st.width, y1 = st.top + (1 - _ib.y) / 2 * st.height;
    return { x: x, y: y, r: Math.max(16, Math.hypot(x1 - x, y1 - y)) };
  }
  function irDraw(r, x, y, a) {
    var cv = $('irisCv'); if (!cv) return;
    var W = window.innerWidth || 390, H = window.innerHeight || 800, dp = Math.min(2, window.devicePixelRatio || 1), cw = Math.round(W * dp), ch = Math.round(H * dp);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    var c = cv.getContext('2d'); c.setTransform(dp, 0, 0, dp, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, W, H);
    if (a <= 0) return;
    c.globalAlpha = Math.min(1, a); c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    if (r > 0.5) { c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over'; }
  }
  function irText(on) {
    var e = $('irisT'); if (!e) return;
    if (on) { e.innerHTML = '<span>데모 버전입니다.</span><span>1층으로 이동합니다.</span>'; e.getBoundingClientRect(); e.classList.add('on'); }
    else e.classList.remove('on');
  }
  function elevGo(kind) {   /* kind = 'floor' | 'demo' | 'exit' (옛 true = demo · false = exit) */
    if (EV.seq || G.scn !== 'elev') return;
    var k = kind === true ? 'demo' : kind === false ? 'exit' : kind, now = performance.now(), ph = IR_PH[k + (RM ? 'Rm' : '')];
    EV.seq = { demo: k === 'demo', kind: k, ph: ph, i: 0, t0: now, s0: now, f: null };
    if (ph[0][0] === 'rise') { EV.rise = { t0: now, d: ph[0][1], to: EV.goF || 18 }; EV.turn = null; } else EV.turn = { t0: now, end: Infinity };   /* 돌아본 채로 머문다(얼굴이 마지막에 덮이게) · v5.58 올라가는 표시 뒤에 돌아본다 */
    IR.log = []; IR.dings = []; IR.cur = null;
    var el = $('iris'); el.hidden = false; irText(false); $('irisT').textContent = ''; irDraw(0, 0, 0, 0);
    G.need = true; irTick();
  }
  function irEnter(q, k) {
    if (k === 'turn' && !EV.turn) { EV.rise = null; EV.turn = { t0: performance.now(), end: Infinity }; }   /* v5.58 */
    if (k === 'text') { if (q.demo) irText(true); ding(0); }
    else if (k === 'hold') ding(0);   /* v5.65 층에 닿음 */
    else if (k === 'in' || k === 'fi') { irText(false); elevSwap(); smileSet(botParts.eyes, botParts.smiles, true); ding(k === 'in' ? 0.12 : 0); }
  }
  function irTick() {
    if (IR.raf) return;
    IR.raf = requestAnimationFrame(function (now) {
      IR.raf = 0; var q = EV.seq; if (!q) return;
      var p = q.ph[q.i], t = now - q.s0;
      while (t >= p[1]) { q.s0 += p[1]; q.i++; p = q.ph[q.i]; if (!p) { if (q.kind === 'floor') irFloorDone(); else irEnd(); return; } irEnter(q, p[0]); t = now - q.s0; }
      var k = p[0], d = p[1], r = 0, a = 1, f = null, R0 = 0, Rf = 0;
      if (k === 'out' || k === 'in') {
        f = irFace(); var W = window.innerWidth || 390, H = window.innerHeight || 800;
        R0 = Math.max(Math.hypot(f.x, f.y), Math.hypot(W - f.x, f.y), Math.hypot(f.x, H - f.y), Math.hypot(W - f.x, H - f.y)) + 2; Rf = f.r * 1.25;
        if (k === 'out') r = t < 800 ? Rf + (R0 - Rf) * (1 - easeIO(t / 800)) : t < 1150 ? Rf : Rf * (1 - Math.pow(clamp((t - 1150) / (d - 1150), 0, 1), 2));
        else r = t < 120 ? 0 : t < 340 ? Rf * (1 - Math.pow(1 - (t - 120) / 220, 3)) : t < 480 ? Rf : Rf + (R0 - Rf) * easeIO(clamp((t - 480) / (d - 480), 0, 1));
      }
      else if (k === 'turn') a = 0;
      else if (k === 'rise') { a = 0; var rr = EV.rise, kk = easeIO(clamp(t / (d * 0.92), 0, 1)), nf = rr ? Math.max(1, Math.min(rr.to, 1 + Math.floor(kk * (rr.to - 1) + 0.0001))) : 1; if (nf !== EV.indN || !EV.indUp) { EV.indUp = true; evInd(nf, true); var eh = $('evp').querySelector('.evh'); if (eh) { eh.textContent = '▲ ' + nf; eh.classList.add('up'); } } }   /* 화면 층 단추 머리도 같은 숫자(3D 모니터는 작다) */
      else if (k === 'fo') a = clamp(t / d, 0, 1);
      else if (k === 'fi') a = t < 100 ? 1 : 1 - clamp((t - 100) / (d - 100), 0, 1);
      if (k === 'text' && q.demo && t > d - 250) irText(false);
      irDraw(r, f ? f.x : 0, f ? f.y : 0, a);
      IR.cur = { ph: k, t: Math.round(t), r: +r.toFixed(1), x: f ? +f.x.toFixed(1) : null, y: f ? +f.y.toFixed(1) : null, a: +a.toFixed(2) };
      if (IR.log.length < 600) IR.log.push([Math.round(now - q.t0), k, IR.cur.r, IR.cur.x, IR.cur.y, IR.cur.a, f ? +f.r.toFixed(1) : null]);
      G.need = true; irTick();
    });
  }
  function irEnd() {
    EV.rise = null; EV.indUp = false; evInd(1, false); var eh0 = $('evp') && $('evp').querySelector('.evh'); if (eh0) { eh0.textContent = '층 선택'; eh0.classList.remove('up'); } if (EV.btn) Object.keys(EV.btn).forEach(function (k) { EV.btn[k].material = EV.ringOff; }); if (EV.btnL) Object.keys(EV.btnL).forEach(function (k) { EV.btnL[k].material = EV.ringOff; });   /* v5.58 */
    EV.seq = null; IR.cur = null; irText(false); irDraw(0, 0, 0, 0); var el = $('iris'); if (el) el.hidden = true;
    smileSet(botParts.eyes, botParts.smiles, false); G.need = true;
  }
  function irAbort() { if (IR.raf) { cancelAnimationFrame(IR.raf); IR.raf = 0; } if (EV.seq) irEnd(); }
  /* 띵 · 맑은 종 두 음(높은음 B5 → 낮은음 G5 · 0.28초 간격) · 사인 기음 + 배음 2 · 3 · 4.2배(높을수록 빨리 사라짐) · 어택 5ms · 기음 약 1.2초 감쇠 · 작은 잔향
   * 크기 = 최고 약 -13 dBFS(미리 듣기 렌더 · 로비 음악 최고 약 -15 dBFS 보다 살짝 또렷) · 음악을 켠 상태에서만(「음악 없이」 · 끔 · 멈춘 오디오 = 내지 않음) */
  var DING = { notes: [[987.77, 0], [783.99, 0.28]], parts: [[1, 1, 1.25], [2, 0.28, 0.6], [3.01, 0.1, 0.4], [4.2, 0.05, 0.25]], vol: 0.19, rev: null, rc: null };
  function dingAt(c, dest, t, vol) {
    var out = c.createGain(); out.gain.value = vol == null ? DING.vol : vol; out.connect(dest);
    if (DING.rc !== c) { DING.rc = c; DING.rev = c.createConvolver(); DING.rev.buffer = musImpulse(c, 1.4); DING.rev.connect(dest); }
    var wet = c.createGain(); wet.gain.value = 0.22; out.connect(wet); wet.connect(DING.rev);
    DING.notes.forEach(function (n) {
      DING.parts.forEach(function (p) {
        var o = c.createOscillator(), g = c.createGain(), t0 = t + n[1]; o.type = 'sine'; o.frequency.value = n[0] * p[0];
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(p[1], t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + p[2]);
        o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + p[2] + 0.05);
      });
    });
    return t + 0.28 + 1.3;
  }
  function ding(delay) {
    var c = MUS.ctx, ok = musOn() && MUS.want && !!c && c.state === 'running' && !document.hidden;
    IR.dings.push({ at: EV.seq ? Math.round(performance.now() - EV.seq.t0) : null, ph: EV.seq && EV.seq.ph[EV.seq.i] ? EV.seq.ph[EV.seq.i][0] : '', ok: ok, ct: c ? +(c.currentTime + (delay || 0)).toFixed(3) : null, why: ok ? '' : !musOn() ? 'music:false' : !MUS.want ? 'off' : !c ? 'no ctx' : c.state });
    if (!ok) return;
    try { dingAt(c, c.destination, c.currentTime + (delay || 0) + 0.01); } catch (e) {}
  }
  function goGate() {   /* 「엘리베이터 타기」 표지 · 게이트 앞까지 걸어가 게이트가 화면 위로 오게 돈다(이 누름에서만 시점이 돈다) */
    var p = planOf(G.pos), path = findPath(p[0], p[1], GATE.at[0], GATE.at[1]);
    G.azTo = G.az + Math.atan2(Math.sin(Math.PI - G.az), Math.cos(Math.PI - G.az));
    if (path) { G.goal = null; startWalk(path, null); }
    toast('게이트 쪽(위)으로 계속 밀어 보세요');
  }

  /* ═══════════ 18F 장면 ═══════════ */
  function toCafe() { setRun(false); veilText(''); veilCover(320, null, function () { toCafeNow(); setTimeout(function () { veilReveal(420, null); }, 60); }); }   /* v5.51 전환 막 */
  function toCafeNow() {
    G.scn = 'cafe'; S.lobby.visible = false; bot.visible = false; S.cafe.visible = true; $('bubble').hidden = false; $('pad').hidden = true; $('mini').hidden = true; $('ctl').hidden = true;
    G.cafe = { th: S.CAFE_DEF.th, ph: S.CAFE_DEF.ph, r: S.CAFE_DEF.r }; G.need = true; updateUi(true);
  }
  function backTo1F() { veilText(''); veilCover(320, null, function () { backTo1FNow(); setTimeout(function () { veilReveal(420, null); }, 60); }); }   /* v5.51 전환 막 */
  function backTo1FNow() {
    G.scn = 'lobby'; S.lobby.visible = true; bot.visible = true; S.cafe.visible = false; $('bubble').hidden = true; $('pad').hidden = false; $('mini').hidden = false; $('ctl').hidden = false; G.need = true; updateUi(true); setTimeout(intro, 0);
  }
  function cafeCam() {
    var c = G.cafe, t = S.CAFE_DEF.t, s = Math.sin(c.ph);
    camera.position.set(t.x + c.r * s * Math.sin(c.th), t.y + c.r * Math.cos(c.ph), t.z + c.r * s * Math.cos(c.th)); camera.lookAt(t);
  }

  /* ═══════════ 입력 · 왼쪽 아래 고정 패드 = 걷기(위 = 화면 위쪽) · 화면 톡 = 걷기 / 판 열기 · 두 손가락 = 거리 2단계 · 그 밖의 끌기는 아무 일 없음 ═══════════ */
  var ray = new T.Raycaster(), ptr = null, pinch = null, pads = new Map();
  var SWIPE_DEG = 180, SWIPE_MIN = 8, TILT_DEG = 60;   /* v5.65 위아래 = 화면 높이 한 번 60도(범위는 TILT_UP · TILT_DN 이 막는다) */   /* v5.58 화면 밀어 돌기 · 화면 폭 한 번 = 180도(실기기 감으로 이 값 하나만 바꾼다) · 8px 아래 = 톡 · 손 떼면 바로 멈춤(관성 없음 · 캡처 비교 · 멈추는 자리가 예측됨) */
  function hideDrag() {}
  function wireStage() {
    var cv = $('cv');
    cv.addEventListener('pointerdown', function (e) {
      pads.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pads.size === 2) { var a = Array.from(pads.values()); pinch = { d0: Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1, dist0: G.dist }; ptr = null; G.pinchOn = true; G.stick = null; HOLD = null; G.distLog = []; return; }   /* v5.51 핀치 중 = 조그 · 돌기 입력을 섞지 않는다 */
      if (ptr) return;
      var r = cv.getBoundingClientRect();
      ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX - r.left, ly: e.clientY - r.top, t0: performance.now(), moved: false, px: e.clientX, rot: false };
    });
    cv.addEventListener('pointermove', function (e) {
      var q = pads.get(e.pointerId); if (q) { q.x = e.clientX; q.y = e.clientY; }
      if (pinch && pads.size >= 2 && !pinch.done) {
        var a = Array.from(pads.values()), d = Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y), k = d / pinch.d0;
        setDist(pinch.dist0 / k); if (G.distLog && G.distLog.length < 300) G.distLog.push(+G.dist.toFixed(3));   /* 벌리기 = 가까이 · 오므리기 = 멀리(연속) */
      }
      if (ptr && e.pointerId === ptr.id && Math.hypot(e.clientX - ptr.x0, e.clientY - ptr.y0) > 12) ptr.moved = true;
      /* v5.58 (사용자 261004 「화면을 미는 행위로도 화면을 왼쪽 오른쪽 회전」) 가로로 8px 넘게 밀면 돌기(오른쪽으로 밀기 = 우로 돌기 · 화면 폭 한 번 = SWIPE_DEG) · 그 뒤로는 톡이 아님 · 위아래는 무시 */
      /* v5.65 (사용자 261005 「권장대로」) 거의 수직(세로가 가로의 2배 이상 · 8px 넘게)으로 밀면 위아래 시선(위로 밀기 = 위를 봄 · 위 20도 · 아래 10도) · 대각선 · 가로 = 좌우 돌기만 · 한 번 정해지면 그 손가락이 뗄 때까지 그 한 가지
       *   「화면 밀어 시점 바꾸기」를 끄면(G.swipeOn false) 둘 다 없음(돌기 단추 · 조그 · PC 키는 그대로) */
      if (ptr && e.pointerId === ptr.id && !pinch && G.loaded && G.scn === 'lobby' && !G.anim && !G.sheetOpen && !EV.seq && G.swipeOn !== false) {
        var dx0 = e.clientX - ptr.x0, dy0 = e.clientY - ptr.y0;
        if (!ptr.rot && !ptr.tilt && Math.abs(dy0) > SWIPE_MIN && Math.abs(dy0) >= Math.abs(dx0) * 2) { ptr.tilt = true; ptr.moved = true; ptr.py = ptr.y0 + (dy0 > 0 ? SWIPE_MIN : -SWIPE_MIN); G.tiltDrag = true; clearTimeout(G.tiltT); }
        else if (!ptr.rot && !ptr.tilt && Math.abs(dx0) > SWIPE_MIN) { ptr.rot = true; ptr.moved = true; ptr.px = ptr.x0 + (dx0 > 0 ? SWIPE_MIN : -SWIPE_MIN); }
        if (ptr.rot) { var da = (e.clientX - ptr.px) / (cv.clientWidth || 390) * SWIPE_DEG * Math.PI / 180; ptr.px = e.clientX; G.az -= da; G.azTo = G.az; G.need = true; G.swipeN = (G.swipeN || 0) + 1; }
        if (ptr.tilt) { var dtl = (ptr.py - e.clientY) / (cv.clientHeight || 700) * TILT_DEG * Math.PI / 180; ptr.py = e.clientY; G.tiltTo = G.tilt = clamp((G.tiltTo || 0) + dtl, -TILT_DN, TILT_UP); G.need = true; G.tiltN = (G.tiltN || 0) + 1; }
      }
    });
    function end(e) {
      pads.delete(e.pointerId); if (pads.size < 2) pinch = pads.size ? pinch : null; if (!pads.size) G.pinchOn = false;
      if (!ptr || e.pointerId !== ptr.id) return;
      var p = ptr; ptr = null;
      if (p.tilt) { G.tiltDrag = false; clearTimeout(G.tiltT); G.tiltT = setTimeout(function () { if (!G.tiltDrag) tiltHome(false); }, 1000); }   /* v5.65 손을 떼고 1초 뒤 정면으로 */
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
      if (pp != null || !G.loaded || G.scn !== 'lobby' || G.pinchOn) return; e.preventDefault();
      pp = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (x) {}
      G.moved = true; G.path = null; G.goal = null; $('dest').hidden = true; padMove(e);
    });
    pad.addEventListener('pointermove', function (e) { if (e.pointerId === pp) padMove(e); });
    function padEnd(e) { if (e.pointerId !== pp) return; pp = null; setKnob(0, 0, false); G.stick = null; nearestStop(); updateUi(true); }   /* v5.51 달리기는 한 번 누름(켜 두는 상태 없음) · 손을 떼도 남은 달리기는 끝까지 */
    pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
    pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    /* v5.51 PC 두 손 조작(사용자 261004) · 왼손 WASD = 걷기(W 앞 · S 뒤 · A · D 옆걸음 · 몸은 카메라 방향 그대로 · 대각 = 조그와 같은 정규화)
     *   오른손 = 오른쪽 십자 단추 배치 그대로 · ↑ / I 달리기 · ↓ / K 점프 · ← / J 좌로 돌기 · → / L 우로 돌기 · Space 점프 · Shift(누르는 동안) 달리기
     *   돌기 = 단추와 같다(누르는 동안 holdStart · 떼면 holdEnd → 짧게 = 정해진 양 · 길게 = 계속) · 입력칸에 쓰는 중 · 판 보기 · 설정 · 큰 지도 · 스탬프 카드 = 무시(Esc = 닫기)
     *   옛 방향키 = 걷기는 WASD 로 옮겼다 */
    var keys = {}, KMOVE = { KeyW: 'u', KeyS: 'd', KeyA: 'l', KeyD: 'r' }, KRH = { ArrowUp: 'run', KeyI: 'run', ArrowDown: 'jump', KeyK: 'jump', ArrowLeft: 'rotL', KeyJ: 'rotL', ArrowRight: 'rotR', KeyL: 'rotR' }, KBTN = { run: 'bRun', jump: 'bJump', rotL: 'rotL', rotR: 'rotR' }, kRot = null;
    G.keyLog = [];
    function typing(e) { var t = e.target; return !!t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName || '') || t.isContentEditable); }
    window.addEventListener('keydown', function (e) {
      if (!G.open || typing(e)) return;
      if (e.key === 'Escape' && (G.bigMap || !$('cfg').hidden)) { if (G.bigMap) closeBigMap(); else closeCfg(); e.preventDefault(); return; }
      if (G.sheetOpen || G.scn !== 'lobby' || EV.seq) return;   /* v5.55 아이리스 흐름 동안 = 막음 */
      var code = e.code;
      if (PH.on) { if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && !$('pola').hidden) { e.preventDefault(); phClose(); } return; }   /* v5.67 사진 찍기 연출 = 키 막음 · 팝업 = Enter · Space · Esc 로 닫기 */
      if (e.key === 'Enter' && !e.repeat && !$('shot').hidden && !/BUTTON|A|INPUT/.test((e.target && e.target.tagName) || '')) { e.preventDefault(); doShot(); return; }   /* v5.67 사진 찍기 */
      if (e.key === 'Enter' && !e.repeat && !$('look').hidden && !/BUTTON|A|INPUT/.test((e.target && e.target.tagName) || '')) { e.preventDefault(); doLook(); return; }   /* v5.54 자세히 보기 */
      if (KMOVE[code]) { keys[KMOVE[code]] = 1; G.stick = keyStick(); setKnob(G.stick.x, G.stick.y, true); G.moved = true; G.path = null; G.need = true; e.preventDefault(); return; }
      var act = KRH[code] || (e.key === ' ' && !/BUTTON/.test((e.target && e.target.tagName) || '') ? 'jump' : null);
      if (act) {
        e.preventDefault(); if (e.repeat) return;
        var bt = $(KBTN[act]); if (bt) bt.classList.add('kp');
        if (G.keyLog.length < 200) G.keyLog.push({ k: code, act: act, t: Math.round(performance.now()), x: +G.pos.x.toFixed(3), z: +G.pos.z.toFixed(3), az: +G.az.toFixed(4) });
        if (act === 'run') dash(); else if (act === 'jump') jump(); else { kRot = code; holdStart('rot', act === 'rotL' ? 1 : -1); }
        return;
      }
      if (e.key === 'Shift') G.runKey = true;
    });
    window.addEventListener('keyup', function (e) {
      if (!G.open) return; var code = e.code;
      if (e.key === 'Shift') G.runKey = false;
      var act = KRH[code] || (e.key === ' ' ? 'jump' : null); if (act) { var bt = $(KBTN[act]); if (bt) bt.classList.remove('kp'); if (code === kRot) { kRot = null; holdEnd(); } }
      if (KMOVE[code]) { delete keys[KMOVE[code]]; G.stick = Object.keys(keys).length ? keyStick() : null; if (G.stick) setKnob(G.stick.x, G.stick.y, true); else { setKnob(0, 0, false); nearestStop(); updateUi(true); } }
    });
    window.addEventListener('blur', function () { keys = {}; G.runKey = false; if (kRot) { kRot = null; holdEnd(); } if (G.open && G.stick) { G.stick = null; setKnob(0, 0, false); } });
    function keyStick() { var x = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), y = (keys.d ? 1 : 0) - (keys.u ? 1 : 0), m = Math.hypot(x, y) || 1; return { x: x / m, y: y / m }; }   /* 대각 = 손잡이도 링 안 대각(길이 1) */
  }
  function isShown(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
  function tap(x, y) {
    if (!G.loaded || PH.on) return;
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
      if (u.stamp) { var bb = BLOCKS.filter(function (q) { return q.id === u.stamp; })[0]; if (bb) hitBlock(bb); return; }   /* v5.49 블록을 톡 = 점프한 것과 같다 */
      if (u.pg || u.zone) {
        var z = D.Z(u.zone) || D.zoneOfPg(u.pg);
        if (z && z.id !== 'cafe' && z.id !== 'event') { enterPanel(z, u.pg || null); return; }
        if (z && z.id === 'event') return;
      }
      if (h.point.y < 0.2) {
        var tn = performance.now(), lt = G.lastTap;   /* v5.51 빈 바닥 두 번 톡(0.35초 · 40px 안) = 기본 거리로 · 첫 톡에 시작한 걸음은 멈춘다 */
        G.lastTap = { t: tn, x: x, y: y };
        if (lt && tn - lt.t < 350 && Math.hypot(x - lt.x, y - lt.y) < 40) { G.lastTap = null; G.path = null; G.mode = 'free'; $('dest').hidden = true; setDist(DDEF); toast('기본 크기로 봐요'); return; }
        walkTo(pn[0], pn[1], x, y); return;
      }
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
    G.fov0 = W / H < 0.75 ? 62 : 52; camera.fov = G.fov0; camera.updateProjectionMatrix(); S.resize();   /* v5.50 달리기 시야각 넓힘 없앰 */ G.need = true;
    var cr = $('ctl').getBoundingClientRect(); if (cr.height) $('stage').style.setProperty('--lookB', Math.round(r.bottom - cr.top + 10) + 'px');   /* v5.54 자세히 보기 = 조작부 위 10px */
  }
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, G.last ? (now - G.last) / 1000 : 0.016); G.last = now;
    if (!G.ok || !G.open || G.cover || G.mapMode || G.hold) { motIdle(); return; }   /* v5.53 모션 화면 멈춤 · v5.51 판 보기(화면 전체)만 멈춘다 · 스탬프 카드 · 설정 · 큰 지도는 뒤에서 계속 그린다 */
    var busy = false, w0 = performance.now();
    G.clock += dt;
    var held = stepHold(dt);
    if (G.loaded && G.scn === 'lobby') {
      busy = stepBot(dt, now) || G.mode === 'auto' || !!G.stick;
      if (G.anim) { stepAnim(now); busy = true; } else busy = stepCam(dt) || busy || held;
      if (busy) updateUi(false);
      busy = stepGuides(dt) || busy;
      busy = stepRooms() || busy;   /* v5.79 미팅룸 안 대화 */
      busy = stepBlocks(now) || busy;   /* v5.49 스탬프 블록 */
      busy = pbStep(now) || busy;   /* v5.58 포토부스 단체 사진 */
      if (OCCA && !G.anim && !SH && !G.sheetFx) occClear();   /* v5.54 연출 밖에서 남은 비키기는 늘 원래대로 */
    }
    else if (G.scn === 'elev') { busy = stepElev(dt, now); elevCam(); }   /* v5.49 엘리베이터 안 */
    else if (G.scn === 'cafe') cafeCam();
    else if (!G.loaded) { camera.position.set(28 - 16, 22, 6 - (-14)); camera.lookAt(0, 0, 0.5); }
    if (G.bench) { G.pos.x += Math.sin(now * 0.001) * dt * 1.5; busy = true; }
    if (G.loaded && G.scn === 'lobby' && fireStep(dt)) busy = true;   /* 261006 방화문 열고 닫힘 */
    if (G.loaded && (G.scn === 'lobby' || G.scn === 'elev') && tvStep(now)) busy = true;   /* v5.55 엘리베이터 광고 화면도(로비 화면은 로비가 숨어 멈춤) */   /* v5.40 TV 화면 · 초당 10장 · 보이는 것만 */
    if (!busy && !G.need && !G.showFps) return;
    G.need = false;
    S.frame(camera, G.scn, G.scn === 'lobby' && !G.anim && !!G.camIn); if (G.ceil) G.ceil.visible = false; renderer.render(scene, camera); placePins(); mini(); placeBubble(); placeShot(now); placeLook(now); placeMags(); placeBlocks(); placeCheer(); declutter();
    var wm = performance.now() - w0; G.workMs = G.workMs == null ? wm : G.workMs * 0.95 + wm * 0.05; G.workMax = Math.max(G.workMax || 0, wm);
    if (!$('dest').hidden && G.destAt) { _p.copy(G.destAt).project(camera); $('dest').style.left = ((_p.x + 1) / 2 * $('stage').clientWidth).toFixed(1) + 'px'; $('dest').style.top = ((1 - _p.y) / 2 * $('stage').clientHeight).toFixed(1) + 'px'; }
    if (G.diag) { if (G.lastDraw && now - G.lastDraw > 50 && now - G.lastDraw < 400 && G.drewLast) G.hitch = (G.hitch || 0) + 1; G.drewLast = now - (G.lastDraw || 0) < 400; G.lastDraw = now; }   /* v5.50 진단 · 이어 그리는 중 멈칫(쉬던 틈은 빼려고 바로 전 프레임도 그렸을 때만) */
    G.frames.push(now); while (G.frames.length && now - G.frames[0] > 1000) G.frames.shift();
    if (G.showFps) { $('fps').hidden = false; ($('fpsT') || $('fps')).textContent = G.diag ? diagText() : 'fps ' + G.frames.length + ' · ' + renderer.info.render.calls + ' draw · dpr ' + renderer.getPixelRatio() + ' · z' + G.depthBits; }
    if (G.bench) { G.bench.ts.push(now); if (now - G.bench.t0 > G.bench.ms) { var b = G.bench; G.bench = null; b.done(summ(b.ts)); } }
    if (G.loaded && !G.probed) { G.probe.push(now); if (G.probe.length >= 50) { G.probed = true; var s = summ(G.probe); G.probeResult = s; if (s.p50 > 34) { renderer.setPixelRatio(1); S.lowPower(); resize(); TV_FPS = 6; MOT_FPS = 8; MUS.lite = true; } } }
  }
  function summ(ts) { var d = []; for (var i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]); d.sort(function (a, b) { return a - b; }); var sum = d.reduce(function (a, b) { return a + b; }, 0); return { frames: d.length, fps: +(1000 * d.length / Math.max(1, sum)).toFixed(1), p50: +(d[Math.floor(d.length * 0.5)] || 0).toFixed(1), p95: +(d[Math.floor(d.length * 0.95)] || 0).toFixed(1), dpr: renderer.getPixelRatio() }; }
  G.benchRun = function (ms) { return new Promise(function (res) { G.bench = { t0: performance.now(), ms: ms || 4000, ts: [], done: res }; }); };

  /* ═══════════ 구역 판 보기 시트 · 좌우로 넘기기 · v5.64 (사용자 261005 「다음 판 말고 그냥 다음으로」) 넘김 단추 「◀ 이전」 · 「다음 ▶」(판 보기 · 경품 보기 같은 시트) ═══════════ */
  var SH = null;
  function cropSrc(p) { return BASE + 'd/c/p' + (p < 10 ? '0' : '') + p + '.webp'; }
  function cropBgPx(p, w) {
    var a = D.ATLAS.at[p]; if (!a) return '';
    var Sz = D.ATLAS.size[a[0]], c = D.cropOf(p), cw = a[3] - 4, ch = a[4] - 4, k = w / (cw * (c[2] - c[0]));
    return 'background-image:url(' + BASE + D.ATLAS.files[a[0]] + ');background-size:' + (Sz * k).toFixed(1) + 'px ' + (Sz * k).toFixed(1) + 'px;background-position:' + (-(a[1] + 2 + c[0] * cw) * k).toFixed(1) + 'px ' + (-(a[2] + 2 + c[1] * ch) * k).toFixed(1) + 'px;background-repeat:no-repeat';
  }
  /* 판 보기 = 새 조판(261004 · tour-boards.js) · 원천 = 디자인 시안/1층 판 재조판/판 원문.json + 수정 목록.json · 같은 원천으로 3D 벽 텍스처도 굽는다
   * 데이터가 없는 판(간판 5 · 그림 전용 15 · 38 · 포스터 46)은 지금처럼 d/c 그림 · 「크게」 = 글자 배율 --k */
  function boardCard(p, k) {
    var B = window.TOUR_BOARDS; if (!B || !B.pages || !B.pages[p]) return '';
    var nm = (B.names && B.names[p]) || D.PG[p];
    return '<article class="card bdc" data-i="' + k + '" aria-label="' + esc(nm) + '"><h2>' + esc(nm) + '</h2><div class="bdw">' + B.pages[p].split('{B}').join(BASE + 'b/') + '</div></article>';
  }
  function bdZoom(c, k) {
    var b = c.querySelector('.bd'); if (!b) return;
    k = clamp(k, 1, 1.8); b.style.setProperty('--k', k.toFixed(2)); SH.zoom = k > 1.02; c.classList.toggle('zoom', SH.zoom); $('pZoom').textContent = SH.zoom ? '원래대로' : '크게';
  }
  function wireBoardCard(c) {
    var pin = null;
    c.addEventListener('touchstart', function (e) { if (e.touches.length === 2) { e.preventDefault(); var a = e.touches[0], b = e.touches[1], bd = c.querySelector('.bd'); pin = { d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, k0: parseFloat(bd && bd.style.getPropertyValue('--k')) || 1 }; } }, { passive: false });
    c.addEventListener('touchmove', function (e) { if (!pin || e.touches.length !== 2) return; e.preventDefault(); var a = e.touches[0], b = e.touches[1]; bdZoom(c, pin.k0 * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pin.d0); }, { passive: false });
    c.addEventListener('touchend', function (e) { if (e.touches.length < 2) pin = null; });
    c.addEventListener('dblclick', function () { setZoom(!SH.zoom); });
  }
  function openSheet(z, i, list, cards) {
    var ps = cards || list || D.viewPages(z); if (!ps.length) return;   /* v5.58 판 보기 = 콘텐츠 판만(D.NOVIEW 빼고) */
    if (i == null) i = !cards && ps.length > 1 && D.SIGNS.indexOf(ps[0]) >= 0 ? 1 : 0;   /* 큰 버튼으로 열면 간판 다음 판부터(간판은 왼쪽으로 넘기면 있다) */
    SH = { z: z, ps: ps, i: clamp(i, 0, ps.length - 1), zoom: false, cards: !!cards }; $('pZoom').hidden = !!cards;
    $('shSign').className = z ? 'sg' : 'sg ghost';
    if (z) signPaint($('shSign'), z.sign || SIGN_NM[z.id] || z.name, z.name); else signPaint($('shSign'), '자세히 보기');   /* v5.66 점 글자 칩 · 읽는 이름 = 구역 이름 */
    $('shTitle').textContent = z && z.title ? z.title : '';
    var sheet = $('sheet'); sheet.hidden = false; G.sheetOpen = true; G.cover = true; setRun(false); loadBoards();
    var W = $('trackWrap').clientWidth || window.innerWidth, iw = W - 24;
    $('track').innerHTML = cards ? cards.join('') : ps.map(function (p, k) {
      var bc = boardCard(p, k); if (bc) return bc;
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
    bdMot();   /* v5.53 판 6 · 7 움직임 */
  }
  function hideSheet() {
    var el = $('sheet'); if (G.sheetFx && G.sheetFx.a) { try { G.sheetFx.a.cancel(); } catch (e) {} } G.sheetFx = null; if (XF) xfClear();   /* v5.56 */
    el.hidden = true; el.classList.remove('flip', 'na'); el.style.opacity = ''; el.style.transition = ''; el.style.pointerEvents = ''; G.sheetOpen = false; G.cover = false; SH = null; G.need = true; G.last = 0; bdMot();
  }
  /* v5.51 닫기(헤더 닫기 · 뒤로 가기 · Esc · 모두 여기) = 지금 보고 있는 판(같은 줄 6m 안 · 아니면 들어온 판) 앞으로 카메라를 옮겨 두고 · 판 보기가 그 판 자리로 줄어든 뒤 · 로비로 빠진다
   *   들어올 때 판 보기가 판에서 나왔듯 나갈 때도 판으로 돌아간다 · 넘겨 본 마지막 판으로 나오는 쪽이 「지금 보던 판이 어디 있나」를 보여 줘 자연스럽다 · 멀면 들어온 판
   *   연출 중 다시 누름 = 무시(커지는 중이면 끝까지 커진 뒤 바로 줄어든다) · 움직임 줄이기 = 0.15초 페이드 */
  function closeSheet(now) {
    if (!SH) return;
    if (G.sheetFx) { if (G.sheetFx.dir === 'out') return; G.sheetFx.closeAfter = true; return; }
    var face = exitFace(), el = $('sheet');
    if (now === true || !face || !G.loaded || G.scn !== 'lobby') { G.lastFace = null; hideSheet(); if (G.anim && G.anim.kind === 'hold') G.anim = null; occClear(); return; }
    if (RM) { el.style.transition = 'opacity .15s'; el.style.opacity = '0'; G.sheetFx = { dir: 'out' }; setTimeout(function () { hideSheet(); G.anim = null; G.lastFace = null; G.need = true; }, 160); return; }
    var c = face.userData.c, ph = Math.atan2(c.x - G.pos.x, c.z - G.pos.z), sh = shotsFor(face);
    occApply(face); occAlpha(0);   /* v5.54 판을 넘겨 다른 판에서 나와도 그 판 앞 물체를 비킨 채 시작 */
    camera.position.copy(sh.P2); camera.lookAt(sh.L2); G.cover = false; G.need = true; G.sheetFx = { dir: 'out' };
    /* v5.56 거꾸로 교차 · 판 자리로 줄어들며 빨라지고(카드 몫) → 카메라가 그 빠르기로 빠지며 카드는 판 위에서 사라진다 · 줄어드는 끝 빠르기 = 카메라가 빠지기 시작하는 빠르기 */
    var du = DIVE_OUT * DIVE_FX, wo = camWant(), ro = Math.log(faceDist(face, bez(sh.P2, sh.P1, wo.pos, sinOut(0.01), new T.Vector3())) / faceDist(face, sh.P2)) / (0.01 * du);
    xfBegin(face); el.style.opacity = '1'; var Q = xfQuad(face);
    if (!Q) { hideSheet(); exitPanel(sh, ph); return; }
    var M0 = xfHomo(xfLocal(Q), XF.b), s0 = clamp(M0[0], 0.2, 3), t0 = performance.now();
    G.anim = { kind: 'hold', xf: 'unset', t0: t0, dur: xfDur(s0, ro), M0: M0, s0: s0, sh: sh, ph: ph }; xfHold(G.anim, t0);
  }
  function setZoom(on) {
    if (!SH) return; var c = $('track').children[SH.i]; if (!c) return;
    if (c.classList.contains('bdc')) { bdZoom(c, on ? 1.3 : 1); return; }
    var pic = c.querySelector('.pic'), W = c.clientWidth - 24, s = D.cropSize(SH.ps[SH.i]);
    SH.zoom = on; c.classList.toggle('zoom', on); $('pZoom').textContent = on ? '원래대로' : '크게';
    var w = on ? W * 2.2 : W; pic.removeAttribute('style');
    pic.querySelector('.im').setAttribute('style', 'height:' + (w * s[1] / s[0]).toFixed(1) + 'px;' + cropBgPx(SH.ps[SH.i], w));
    if (on) { c.scrollLeft = (w - W) / 2; }
  }
  function wireCard(c) {
    if (c.classList.contains('bdc')) { wireBoardCard(c); return; }
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
    var m = $('nogl'); m.hidden = false; m.textContent = msg || '이 기기에서는 3D 행사 둘러보기를 볼 수 없어요'; veilSet(0);
  }

  /* ═══════════ 처음 안내(한 문장 · 한 번) ═══════════ */
  /* v5.84 (앱 v5.83 「최초 진입 가볍게」 · 사용자 261006 「나」) 첫 입장 = 막는 처음 안내 카드 대신 한 줄 힌트(#t3-hint · 막지 않음) · 처음 움직이거나 8초에 사라짐 · 기기당 1회(axfTour3Help 그대로)
   *   나머지 문장(확대 · 동전 점프 · 화면 밀기) · 움직임 줄이기 · 음악 없이 스위치는 헤더 「도움말」 카드에 그대로 · 옛 「시작하기」에서 음악 시작(MUS.deferred) 없앰 = 여는 누름에서 시작(음악 기본 켬 그대로 · 사용자 결정 1) */
  var HINT_MS = 8000;
  function maybeHelp() { if (Q.get('nohelp') !== '1' && !store.get('axfTour3Help')) showHint(); }
  function showHint() {
    var h = $('hint'); if (!h) return;
    store.set('axfTour3Help', '1');
    var t0 = performance.now(), mv0 = !!G.moved; G.moved = false;
    h.hidden = false; h.classList.remove('out');
    clearInterval(G.hintT);
    G.hintT = setInterval(function () {
      if (!G.open || G.moved || performance.now() - t0 > HINT_MS) { clearInterval(G.hintT); G.hintT = 0; hideHint(); if (mv0) G.moved = true; }
    }, 200);
  }
  function hideHint() {
    var h = $('hint'); if (!h || h.hidden) return;
    if (RM) { h.hidden = true; return; }
    h.classList.add('out'); setTimeout(function () { h.hidden = true; h.classList.remove('out'); }, 300);
  }
  /* 입장 연출 · 던전 이동처럼 암전(처음부터 검은 화면 · 받는 동안 「불러오는 중」) → 가운데 「1F · AX Festival 2026」 0.8초 → 밝아지며 높은 스카이뷰 → 캐릭터로 줌인(1.3초) → 처음 안내 · 합 2.5초 안 · 움직임 줄이기 = 짧은 페이드만 */
  function entrance() {   /* v5.51 암전 대신 전환 막(주황 점 격자) · 다 받으면 흰 점이 가득 → 「1F · AX Festival 2026」 → 가운데부터 점이 걷히며 스카이뷰 */
    var t = $('blackT'); veilProg(1); veilText('1F · AX Festival 2026', true);
    if (RM) { setTimeout(function () { veilText(''); veilProg(null); veilReveal(150, null); intro(afterIntro); }, 250); return; }
    setTimeout(function () {
      veilText(''); veilProg(null);
      intro(afterIntro);   /* 스카이뷰에서 시작 */
      veilReveal(620, null);
    }, 400);   /* v5.84 전환 글 0.8 → 0.4초(최초 진입 가볍게) */
  }
  function showHelp() { hideHint(); $('help').hidden = false; }   /* v5.84 헤더 「도움말」 카드 */
  function hideHelp() { $('help').hidden = true; store.set('axfTour3Help', '1'); G.guardT = performance.now(); }   /* v5.38 첫 입장 음악 = 「시작하기」 누름에서 */   /* 닫는 탭이 아래 버튼까지 가지 않게 0.5초 막음 */

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
  var MUS = { want: true, ctx: null, out: null, st: null, timer: 0, gen: 0, made: 0, oldType: null, lite: false };
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
    if (on) musStart(1.2);
    else musStop(true, 0.5);
    musUi();
  }
  function musUi() {
    var b = $('bSnd'), k = $('muChk'); if (!b) return;
    b.hidden = !musOn(); b.classList.toggle('off', !MUS.want); b.setAttribute('aria-pressed', MUS.want ? 'true' : 'false'); b.setAttribute('aria-label', MUS.want ? '음악 끄기' : '음악 켜기');
    if (k) k.checked = !MUS.want; var row = $('muRow'); if (row) row.hidden = !musOn();
  }
  function musOpen() {   /* 둘러보기를 여는 누름 안에서 시작(v5.84 처음 안내 카드가 없어 「시작하기」를 기다리지 않는다 · 기본 켬 · 스피커로 끔) */
    musUi(); musStart(2);
  }
  function musWire() {
    var v = store.get('axfTour3Music'); MUS.want = v !== '0';
    $('bSnd').onclick = function () { musSet(!MUS.want); };
    $('muChk').onchange = function () { musSet(!$('muChk').checked); };
    /* 자동 재생이 막혀 멈춰 있으면 화면 첫 누름에서 깨운다(처음 안내가 떠 있는 동안 · 아직 고르기 전에는 시작하지 않음) */
    ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) {
      ROOTEL.addEventListener(ev, function () {
        if (!G.open || !musOn() || !MUS.want || document.hidden) return;
        if (!MUS.ctx || MUS.ctx.state === 'suspended') musStart(MUS.ctx ? 1 : 2);
      }, true);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (MUS.ctx) musStop(false, 0.15); motIdle(); }
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
  G.mus = function () { return { style: MUS_STY, want: MUS.want, made: MUS.made, state: MUS.ctx ? MUS.ctx.state : 'none', timer: !!MUS.timer, gain: MUS.out ? +MUS.out.master.gain.value.toFixed(3) : null, session: navigator.audioSession ? navigator.audioSession.type : 'n/a' }; };

  /* ═══════════ 시작 ═══════════ */
  function boot() {
    $('bNext').onclick = onNext; $('bPrev').onclick = onPrev; $('bBack1F').onclick = function () { veilText(''); veilCover(320, null, function () { backTo1FNow(); placeAt(STOPS.length - 1, false); setTimeout(function () { veilReveal(420, null); }, 60); }); };
    $('cta').hidden = true;   /* 칸 자체를 쓰지 않는다(lab.css .slot) */
    if (Q.get('lbl') === 'a') $('ctl').classList.add('la');
    $('cta').onclick = function () { if (performance.now() - (G.guardT || 0) < 500) return; if (G.spot && G.spot.spot === 'typing') { openPromo(); return; } var z = G.near; if (!z) return; if (z.id === 'cafe') { toCafe(); return; } enterPanel(z); };
    $('vClose').onclick = closePromo;
    rotWire();   /* v5.81 돌기 단추 = 손가락 하나 한 길(위 rotWire) */
    setDist(G.dist);
    /* v5.49 달리기(누르면 켜고 끔) · 점프(누르는 순간 · 손가락이 화면에 닿자마자 뛰어야 경쾌하다 · 키보드 Enter/Space 는 click 으로) */
    var rb = $('bRun'), rpd = 0;   /* v5.51 점프처럼 누르는 순간 달려 나간다 */
    rb.addEventListener('pointerdown', function (e) { e.preventDefault(); rpd = performance.now(); dash(); });
    rb.addEventListener('click', function () { if (performance.now() - rpd > 600) dash(); });
    rb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    var jb = $('bJump'), jpd = 0;
    jb.addEventListener('pointerdown', function (e) { e.preventDefault(); jpd = performance.now(); jump(); });
    jb.addEventListener('click', function () { if (performance.now() - jpd > 600) jump(); });
    jb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    /* v5.49 스탬프 카드 · 엘리베이터 버튼 */
    $('scGo').onclick = goStamp; $('scX').onclick = closeStampCard; $('scard').addEventListener('click', function (e) { if (e.target === $('scard')) closeStampCard(); });
    Array.prototype.forEach.call($('evp').querySelectorAll('.evb'), function (b) { b.onclick = function () { pressFloor(b); }; });
    $('gbub').onclick = function () { if (performance.now() - (G.guardT || 0) < 500) return; var gd = G.talk; if (!gd) return; if (gd.stamp) { openStampCard(gd.stamp); return; } if (gd.spot === 'typing') { openPromo(); return; } if (!gd.go) return; doLook(); };   /* v5.54 말풍선 = 자세히 보기 단추와 같은 일 */
    $('look').onclick = doLook;
    $('etGo').onclick = etipGo; $('etX').onclick = etipHide;   /* v5.84 */
    $('shot').onclick = doShot; $('pola').addEventListener('click', phClose);   /* v5.67 사진 찍기 · 팝업 톡 = 닫기 */
    var rs = store.get('axfTour3RM'); if (rs === '1' || rs === '0') RM = rs === '1';
    ROOTEL.classList.toggle('rm', RM); $('rmChk').checked = RM;
    $('rmChk').onchange = function () { RM = $('rmChk').checked; store.set('axfTour3RM', RM ? '1' : '0'); ROOTEL.classList.toggle('rm', RM); G.need = true; };
    musWire();
    $('bHelp').onclick = showHelp; $('hOk').onclick = hideHelp; $('help').addEventListener('click', function (e) { if (e.target === $('help')) hideHelp(); });
    wireSheet(); wireCfg(); loadBoards();
    var dq = Q.get('t3diag');   /* 시험판 주소 값 · 앱은 index.html 이 주소에 ?t3diag=1 이 있을 때만 window.AXT3_DIAG = true */
    try { localStorage.removeItem('axfT3Diag'); } catch (e) {}   /* v5.47 (사용자 261004 「배포 버전에서도 좌상단에 좌표나 테스트 내용이 뜨는데 없애줘」) 옛 기기 기억(v5.44)은 무시하고 지운다 */
    G.diag = dq === '1' || window.AXT3_DIAG === true; $('fps').classList.toggle('diag', G.diag);
    G.showFps = Q.get('fps') === '1' || G.diag;
    G.ab = { aa: !(G.diag && store.get('axfT3AA') === '0'), dpr1: G.diag && store.get('axfT3Dpr1') === '1', refl: !(G.diag && store.get('axfT3Refl') === '0') };   /* v5.50 진단 모드 A/B · 이 기기 기억은 진단 주소일 때만 읽는다 · 일반 주소 = 늘 기본값(AA 켬 · 해상도 1.75 · 반사 켬) */
    G.t0 = performance.now();
    if (!window.TourScene || !T || !init3D()) { noGl(); return; }
    diagAB();
    wireStage(); resize(); window.addEventListener('resize', resize);
    updateUi(true);
    load();
    requestAnimationFrame(loop);
  }
  /* 시험 · 녹화용 손잡이(앱에는 없음) */
  G.api = { scene: function () { return S; }, proj: function (x, y, z) { _p.set(x, y, z).project(camera); var r = $('stage').getBoundingClientRect(); return [r.left + (_p.x + 1) / 2 * r.width, r.top + (1 - _p.y) / 2 * r.height, _p.z]; },   /* v5.51 확인용 · 3D 점 → 화면 좌표(실제 톡 확인) */ shotCamKeep: function (x, y, z, lx, ly, lz, face) { camera.position.set(x - 16, y, 6 - z); camera.lookAt(lx - 16, ly, 6 - lz); if (face) { guides.forEach(function (g) { g.m.rotation.y = Math.atan2(camera.position.x - g.m.position.x, camera.position.z - g.m.position.z); }); bot.rotation.y = Math.atan2(camera.position.x - bot.position.x, camera.position.z - bot.position.z); } S.frame(camera, 'lobby'); if (G.ceil) G.ceil.visible = false; renderer.render(scene, camera); G.hold = true; }, shotCam: function (x, y, z, lx, ly, lz, inside) { camera.position.set(x - 16, y, 6 - z); camera.lookAt(lx - 16, ly, 6 - lz); var bv = bot.visible; bot.visible = false; S.frame(camera, 'lobby', !!inside); renderer.render(scene, camera); bot.visible = bv; G.hold = true; }, guides: function () { return guides.map(function (g) { return [g.zone, g.at, +g.h.toFixed(2)]; }); }, enter: function (zid, pg) { enterPanel(D.Z(zid), pg || null); }, pose: function (x, z, yaw, h) { G.pos.copy(toThree(x, z)); G.mode = 'free'; G.path = null; G.yaw = yaw; G.h = h == null ? yaw + Math.PI : h; G.yo = 0; G.need = true; }, goStop: goStop, openSheet: function (zid, i) { openSheet(D.Z(zid), i || 0); }, closeSheet: closeSheet, setPage: function (k) { setPage(k); }, tap: tap, walkTo: walkTo, plan: function () { return planOf(G.pos); }, cam: function () { return planOf(camera.position).concat([camera.position.y]); }, toCafe: toCafe, back: backTo1F, free: free, hw: function (x, z) { var c = gi(x, z); return c < 0 ? -1 : hw[c] * 0.05; }, move: moveStep, attrAt: attrAt, round: function () { return ROUND.slice(); }, slow: function (f) { DIVE_FX = f || 1; }, occ: function () { var A = OCCA; return A ? { pg: A.face.userData.pg, ent: A.ent.length, tris: A.ent.reduce(function (n, e) { return n + e.gh.geometry.drawRange.count / 3; }, 0), tvs: A.tvs.length, alpha: A.alpha, hid: A.dyn.filter(function (o) { return o.userData.occ; }).length } : null; }, look: function () { return LOOK.key; },   /* v5.54 확인용 */ sqLog: function (on) { if (on) G.sqLog = []; return G.sqLog; }, wd: function (x, z) { var c = gi(x, z); return c < 0 ? -1 : wd[c]; }, gate: function () { return { GZ: GZ, BR: BR, SQ: SQ }; },   xf: function () { return XF ? { b: XF.b, fr: XF.fr, M: XF.M } : null; }, faceQuad: function () { var f = G.lastFace || (XF && XF.face); return f ? xfQuad(f) : null; },   /* v5.56 확인용 */ camLog: function (on) { G.camLog = on ? [] : null; }, camStep: function (dt) { stepCam(dt || 0); S.frame(camera, 'lobby', G.scn === 'lobby' && !G.anim && !!G.camIn); return { cam: planOf(camera.position).concat([camera.position.y]), k: G.boomK, fp: !!G.fp, inside: !!G.camIn, cut: S.cut(), stub: !!(S.lobby.getObjectByName('coreStub') || {}).visible, ray: camRay(camera.position.x, camera.position.y, camera.position.z) }; }, cocc: function (x, z, y) { var c = gi(x, z); return !cocc || c < 0 ? -1 : (cocc[c] >>> Math.floor(y / COCC_H)) & 1; },   /* v5.73 확인용 */ tvs: function () { return TVS.map(function (v) { var m = v.mot; return { kind: v.kind, w: v.w, h: v.h, at: planOf(v.c).map(function (q) { return +q.toFixed(2); }), on: v.on, n: v.n, mot: m ? { ord: m.ord.join(' '), k: m.k, cur: m.cur, loops: m.loops, show: m.show, paused: m.el.paused, t: +m.el.currentTime.toFixed(2), rs: m.el.readyState, blocked: m.blocked } : null }; }); }, mot: function () { return { on: MOT.on, n: MOT.n, got: MOT.got, fps: MOT_FPS, files: Object.keys(MOT.blob) }; }, elev: function () { toElev(); }, pb: function () { return { n: PB.n, on: PB.on, cut: G.kioskCut, relit: G.kioskRelit, trueN: G.trueN, posterHi: G.posterHi, gate: G.gateGlass }; },   /* v5.58 확인용 */ ph: function () { var p = planOf(G.pos); return { on: PH.on, ph: PH.ph, n: PH.n, ms: PH.ms, size: PH.size, snd: PH.snd, near: PH.near, keep: PH.keep > performance.now(), pola: !$('pola').hidden, pos: [+p[0].toFixed(2), +p[1].toFixed(2)], h: +G.h.toFixed(3), free: free(p[0], p[1]), log: PH.log }; }, phStart: function () { if (phNear()) phStart(); return PH.on; }, aim: function () { return { aim: AIM.b ? AIM.b.id : null, demo: !!AIM.demo, demoN: G.aimDemoN || 0, tipN: G.aimTipN || 0, tip: !$('jtip').hidden, cls: $('bJump').className, blk: BLOCKS.map(function (b) { return { id: b.id, at: b.at.map(function (q) { return +q.toFixed(2); }), got: b.got, prox: +b.prox.toFixed(2), lit: +b.lit.toFixed(2) }; }) }; },   /* v5.67 확인용 */ iris: function () { return { seq: EV.seq ? EV.seq.ph[EV.seq.i][0] : null, cur: IR.cur, log: IR.log, dings: IR.dings }; }, face: function () { return irFace(); }, dingAt: dingAt, mus: function () { return { want: MUS.want, on: musOn(), ctx: MUS.ctx ? MUS.ctx.state : null }; }, visit: function (ago) { if (ago) VIS.t0 -= ago; return { age: Math.round(performance.now() - VIS.t0), seen: Object.keys(VIS.seen || {}), bub: Object.keys(VIS.bub), cheerN: VIS.cheerN, etipN: G.etipN || 0, etip: !$('etip').hidden, go: G.etipGo || null, ring: PB.ring ? +PB.ring.material.opacity.toFixed(2) : null, shot: !$('shot').hidden, shotCls: $('shot').className }; } };   /* v5.84 확인용 */   /* v5.55 확인용 */

  /* ═══════════ 앱 안 열기 · 닫기 · 뒤로(v5.37 정식 앱 이식 · 사용자 261003 「이것들이 수정되면 정식 앱에 올리자」) ═══════════
   * window.AXTour = { open(o), close(), back(), isOpen() } · 옛 tour.js 와 같은 약속(앱 tourOpen · 뒤로 가기 popstate 가 그대로 부른다)
   * o.zone = 그 구역 앞에서 시작(입장 연출 뒤) · o.hint = 판 퀴즈 힌트 코드(tour-data HINT_PG) → 그 판이 있는 지점 앞 + 그 판 판 보기 · o.standalone = 시험판(닫기 없음)
   * 처음 열 때만 화면을 만들고 모형을 받는다 · 닫아도 WebGL 은 들고 있다(다시 열면 바로) · 닫으면 그리기를 멈춘다 */
  var ROOTEL = null, OPTS = {}, PEND = null;
  var TEMPLATE = '<div class="t3app">\n' +
    '  <header class="hd">\n' +
    '    <button type="button" class="hb back" id="t3-bClose" aria-label="행사 둘러보기 닫기"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>\n' +
    '    <h1>행사 둘러보기 <span class="tag" id="t3-tag" hidden>시험판</span></h1>\n' +
    '    <button type="button" class="hb snd" id="t3-bSnd" aria-pressed="true" aria-label="음악 끄기" hidden><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path class="w" d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path class="w" d="M18.3 6.5a8 8 0 0 1 0 11"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg></button>\n' +
    '    <button type="button" class="hb cfgh" id="t3-bCfg" aria-label="설정 · 시점 · 음악 · 움직임 줄이기">설정</button>\n' +   /* v5.53 글자 단추 「설정」(사용자 261004 「설정 버튼 위치도 이상하고 · 밝기 조절하는 애처럼 보여」 · 옛 작은 지도 아래 둥근 톱니 자리는 비움) */
    '    <button type="button" class="hb" id="t3-bHelp">도움말</button>\n' +
    '  </header>\n' +
    '  <main class="stage" id="t3-stage">\n' +
    '    <canvas id="t3-cv" aria-label="1층 로비 3D 모형"></canvas>\n' +
    '    <div class="pins" id="t3-pins"></div>\n' +
    '    <div class="mags" id="t3-mags"></div>\n' +
    '    <button type="button" class="mini" id="t3-mini" aria-label="작은 지도 · 누르면 크게 보기"></button>\n' +
    '    <div class="cap" id="t3-cap" hidden></div>\n' +
    '    <div class="load" id="t3-load">모형 불러오는 중</div>\n' +
    '    <div class="pad" id="t3-pad" role="application" aria-label="움직이기 패드 · 밀면 그쪽으로 걸어요"><span class="knob" id="t3-knob"></span><kbd class="kh kw" aria-hidden="true">WASD</kbd></div>\n' +
    '    <div class="dest" id="t3-dest" hidden></div>\n' +
    '    <div class="ctl" id="t3-ctl" aria-label="움직임 버튼">\n' +
    '      <button class="n run" type="button" id="t3-bRun" aria-label="달리기 · 누르면 앞으로 달려 나가요"><span class="c"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12l6-6 6 6"/><path d="M6 18l6-6 6 6"/></svg></span><span class="l">달리기</span><kbd class="kh" aria-hidden="true">↑</kbd></button>\n' +   /* v5.58 (사용자 261004 「달리기는 ^ 하나인데 겹치거나 달리는 느낌 · 점프 버튼도 점프인지 애매」) 후보 비교(shots/v558/icons_candidates.png) 뒤 = 달리기 R3(겹친 위 꺾쇠 + 왼쪽 속도 선 3) · 점프 J4(바닥 선 위로 떠오른 공 + 아래 튐 선 3) · v5.64 (사용자 261005 「3줄은 없어도 될 것 같아 · 이거 하나면 충분해」) 달리기 = 겹친 위 꺾쇠 둘만 · 단추 가운데 */
    '      <button class="w" type="button" id="t3-rotL" aria-label="좌로 돌기 · 누르고 있으면 계속 돌아요"><span class="c"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 3v4h4"/></svg></span><span class="l">좌로 돌기</span><kbd class="kh" aria-hidden="true">←</kbd></button>\n' +
    '      <span class="dot" aria-hidden="true"></span>\n' +
    '      <button class="e" type="button" id="t3-rotR" aria-label="우로 돌기 · 누르고 있으면 계속 돌아요"><span class="c"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 3v4h-4"/></svg></span><span class="l">우로 돌기</span><kbd class="kh" aria-hidden="true">→</kbd></button>\n' +
    '      <button class="s jump" type="button" id="t3-bJump" aria-label="점프"><span class="c"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><circle cx="12" cy="6.2" r="3.6" fill="currentColor" stroke="none"/><path d="M8.6 12.3v3.4M12 12.3v4.6M15.4 12.3v3.4" stroke-width="2"/></svg><span class="cn" aria-hidden="true"></span></span><span class="l">점프</span><kbd class="kh" aria-hidden="true">↓</kbd><span class="jt" id="t3-jtip" aria-hidden="true" hidden>점프!</span></button>\n' +
    '    </div>\n' +
    '    <span class="gdir" id="t3-gdir" hidden aria-hidden="true"></span>\n' +   /* v5.58 스태프가 안 보일 때 가장자리 방향 점 */
    '    <button type="button" class="gbub" id="t3-gbub" hidden><span id="t3-gbubT"></span><span class="go">스탬프 받기</span></button>\n' +
    '    <button type="button" class="look" id="t3-look" hidden aria-label="자세히 보기"><span class="lk" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2l5 5"/></svg></span><span class="lt">자세히 보기</span><kbd class="kh" aria-hidden="true">Enter</kbd></button>\n' +   /* v5.54 자세히 보기 하나 */
    '    <button type="button" class="look shot" id="t3-shot" hidden aria-label="사진 찍기 · 포토부스 친구들과 단체 사진"><span class="lk" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M3.5 8h3.4l1.7-2.5h6.8L17.1 8h3.4v11.5h-17z"/><circle cx="12" cy="13.5" r="3.4"/></svg></span><span class="lt">사진 찍기</span><kbd class="kh" aria-hidden="true">Enter</kbd></button>\n' +   /* v5.67 포토부스 사진 찍기(자세히 보기와 같은 알약) */
    '    <div class="pflash" id="t3-pflash" hidden aria-hidden="true"></div>\n' +   /* v5.67 찰칵 흰 빛 */
    '    <div class="pola" id="t3-pola" role="dialog" aria-label="방금 찍은 사진 · 누르면 닫혀요" hidden><figure class="pc"><canvas id="t3-polaC" width="480" height="360"></canvas><figcaption>2026.10.26 AX Festival</figcaption></figure><p class="pm">동료들과 추억을 남기세요</p></div>\n' +   /* v5.67 폴라로이드(사용자 문구 그대로) */
    '    <div class="cheer" id="t3-cheer" role="status" aria-live="polite" hidden>더 힘내세요!</div>\n' +
    '    <p class="hint" id="t3-hint" role="status" hidden>왼쪽 원으로 걷고, 오른쪽 버튼으로 점프 · 달리기</p>\n' +
    '    <div class="etip" id="t3-etip" role="status" hidden><p class="et">1층을 다 둘러보셨나요?<br>엘리베이터로 다른 층도 둘러보세요</p><div class="eb"><button type="button" class="nb pri" id="t3-etGo">엘리베이터로 가기</button><button type="button" class="ex" id="t3-etX" aria-label="닫기"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div></div>\n' +   /* v5.84 엘리베이터 권유 */   /* v5.84 첫 입장 한 줄 힌트(막지 않음) */
    '    <div class="evp" id="t3-evp" role="group" aria-label="엘리베이터 층 버튼" hidden><span class="evh">층 선택</span><button type="button" class="evb" data-f="18" aria-label="18층"><b>18</b></button><button type="button" class="evb" data-f="17" aria-label="17층"><b>17</b></button><button type="button" class="evb" data-f="10" aria-label="10층"><b>10</b></button><button type="button" class="evb" data-f="1" aria-label="1층 · 내리기"><b>1</b></button></div>\n' +
    '    <div class="bubble" id="t3-bubble" hidden>아이디어 한 줄을 내면 커피챗을 신청할 수 있어요</div>\n' +
    '    <div class="fps" id="t3-fps" hidden></div>\n' +
    '    <p class="nogl" id="t3-nogl" hidden></p>\n' +
    '  </main>\n' +
    '  <nav class="bar" id="t3-bar">\n' +
    '    <div class="slot"><button type="button" class="cta" id="t3-cta" hidden></button><p class="where" id="t3-where">&nbsp;</p></div>\n' +
    '    <div class="row" id="t3-navRow">\n' +
    '      <button type="button" class="nb" id="t3-bPrev">' + CHV_L + '이전 구역</button>\n' +
    '      <button type="button" class="nb pri" id="t3-bNext">다음 구역' + CHV_R + '</button>\n' +
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
    '    <button type="button" class="nb" id="t3-pPrev">' + CHV_L + '이전</button>\n' +
    '    <button type="button" class="nb" id="t3-pZoom">크게</button>\n' +
    '    <button type="button" class="nb" id="t3-pNext">다음' + CHV_R + '</button>\n' +
    '  </footer>\n' +
    '</section>\n' +
    '<section class="help" id="t3-help" role="dialog" aria-modal="true" aria-label="도움말" hidden>\n' +   /* v5.84 헤더 「도움말」에서만 연다(첫 입장 = 한 줄 힌트) */
    '  <div class="hcard">\n' +
    '    <p class="h1t">왼쪽 동그라미로 걷고, 오른쪽 버튼으로 점프 · 달리기 · 돌기를 해요. 「다음 구역」을 누르면 알아서 걸어가요.</p>\n' +
    '    <p class="h2t">두 손가락으로 벌리면 크게, 오므리면 작게 봐요. 빈 바닥을 두 번 누르면 원래 크기예요.</p>\n' +
    '    <p class="h2t" id="t3-hSw">떠 있는 동전을 점프로 치면 그 활동으로 가요. 화면을 밀면 둘러봐요.</p>\n' +   /* v5.58 · v5.65 설정 「화면 밀어 시점 바꾸기」에 맞춰 setSwipe 가 바꾼다 */
    '    <p class="h2t pconly">PC에서는 W A S D로 걷고, ↑ 달리기 · ↓ 점프 · ← → 돌기예요.</p>\n' +
    '    <div class="hdemo" aria-hidden="true"><span class="hbtn">다음 구역' + CHV_R + '</span><span class="finger"></span></div>\n' +
    '    <label class="rmrow"><span class="t"><b>움직임 줄이기</b><span>어지러우면 켜세요</span></span><input type="checkbox" id="t3-rmChk" role="switch"><span class="sw" aria-hidden="true"></span></label>\n' +
    '    <label class="rmrow" id="t3-muRow"><span class="t"><b>음악 없이</b><span>조용히 보려면 켜세요</span></span><input type="checkbox" id="t3-muChk" role="switch"><span class="sw" aria-hidden="true"></span></label>\n' +
    '    <button type="button" class="nb pri wide" id="t3-hOk">닫기</button>\n' +
    '  </div>\n' +
    '</section>\n' +
'<section class="scard" id="t3-scard" role="dialog" aria-modal="true" aria-labelledby="t3-scT" tabindex="-1" hidden>\n' +
    '  <div class="sccard">\n' +
    '    <div class="scic" aria-hidden="true"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5.5" r="2.6"/><path d="M10.6 8v3.6M13.4 8v3.6"/><rect x="5" y="11.6" width="14" height="3.6" rx="1"/><path d="M4.5 17.6h15M7 20.5h10"/></svg></div>\n' +
    '    <p class="sck">스탬프 활동</p>\n' +
    '    <h2 class="sct" id="t3-scT"></h2>\n' +
    '    <p class="scd" id="t3-scD"></p>\n' +
    '    <p class="scg" id="t3-scGot" hidden>이미 받은 스탬프예요</p>\n' +
    '    <button type="button" class="nb pri wide" id="t3-scGo"></button>\n' +
    '    <button type="button" class="nb wide" id="t3-scX">계속 둘러보기</button>\n' +
    '  </div>\n' +
    '</section>\n' +
    '<section class="vid" id="t3-vid" role="dialog" aria-modal="true" aria-label="1F 타자왕 순위판" hidden>\n' +
    '  <header class="sh"><span class="sg" id="t3-vSign">EVENT</span><b>1F 타자왕 순위판</b><button type="button" class="close" id="t3-vClose">닫기</button></header>\n' +
    '  <div class="vbody" id="t3-vbody"></div>\n' +
    '</section>\n' +
    '<div class="black" id="t3-black" aria-hidden="true"><canvas class="vcv" id="t3-veilCv"></canvas><p class="bt" id="t3-blackT">불러오는 중</p><p class="bn" id="t3-veilN"></p></div>\n' +
    '<div class="iris" id="t3-iris" hidden><canvas class="icv" id="t3-irisCv" aria-hidden="true"></canvas><p class="it" id="t3-irisT" role="status" aria-live="polite"></p></div>\n' +
    '<section class="cfg" id="t3-cfg" role="dialog" aria-modal="true" aria-labelledby="t3-cfgT" tabindex="-1" hidden>\n' +
    '  <div class="cfcard">\n' +
    '    <h2 class="cft" id="t3-cfgT">설정</h2>\n' +
    '    <label class="rmrow"><span class="t"><b>화면 밀어 시점 바꾸기</b><span>끄면 돌기 단추로만 돌아요</span></span><input type="checkbox" id="t3-cfSw" role="switch"><span class="sw" aria-hidden="true"></span></label>\n' +
    '    <label class="rmrow" id="t3-cfMuRow"><span class="t"><b>음악</b><span>잔잔한 로비 음악</span></span><input type="checkbox" id="t3-cfMu" role="switch"><span class="sw" aria-hidden="true"></span></label>\n' +
    '    <label class="rmrow"><span class="t"><b>움직임 줄이기</b><span>어지러우면 켜세요</span></span><input type="checkbox" id="t3-cfRm" role="switch"><span class="sw" aria-hidden="true"></span></label>\n' +
    '    <button type="button" class="nb wide" id="t3-cfX">닫기</button>\n' +
    '  </div>\n' +
    '</section>\n' +
    '<section class="bigmap" id="t3-bigmap" role="dialog" aria-modal="true" aria-label="1층 지도 · 지금 내 위치" hidden><div class="bmc" id="t3-bmc"></div><p class="bmh">지도 밖을 누르면 닫혀요</p></section>\n' +
    '<div class="fade" id="t3-fade" aria-hidden="true"></div>\n' +
    '<div class="toast" id="t3-toast" role="status" aria-live="polite"></div>';
  function buildDom() {
    ROOTEL = document.createElement('div'); ROOTEL.id = 'axTour3'; ROOTEL.setAttribute('role', 'dialog'); ROOTEL.setAttribute('aria-modal', 'true'); ROOTEL.setAttribute('aria-label', '행사 둘러보기');
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
  }
  function afterIntro() { if (PEND) { var p = PEND; PEND = null; enterPanel(p.z, p.pg); return; } maybeHelp(); }
  function show() {
    ROOTEL.hidden = false; G.open = true; G.last = 0; G.need = true;
    if (!OPTS.standalone) { document.documentElement.classList.add('t3-lock'); var app = document.getElementById('app'); if (app) app.setAttribute('aria-hidden', 'true'); }
    if (renderer) resize();
  }
  function open(o) {
    OPTS = o || {};
    if (!OPTS.restore) visitReset();   /* v5.84 새 방문 · 말풍선 · 방향점 · 「더 힘내세요!」 횟수 · 들른 구역 */
    clearInterval(ETIP.iv); ETIP.iv = setInterval(etipTick, 1000);   /* v5.84 엘리베이터 권유 살핌(열려 있는 동안 1초마다 · 가벼움) */
    if (!ROOTEL) { buildDom(); veilSet(1); veilProg(0); show(); boot(); musOpen(); return; }
    if (G.open) { if (G.loaded) applyTarget(); return; }
    veilSet(1); veilText(''); veilProg(null);
    show(); musOpen();
    if (!G.loaded) return;   /* 아직 받는 중 · 받으면 load 가 자리를 잡는다 */
    G.moved = false; HOLD = null; G.stick = null; G.path = null; G.anim = null; G.air = false; G.jy = 0; G.landT = 0; refreshBlocks();   /* v5.49 앱에서 받은 스탬프가 바뀌었을 수 있다 */
    var evR = !!(OPTS.restore && OPTS.restore.elev);
    if (G.scn === 'elev' && !evR) leaveElev(true);   /* v5.65 층 안내에서 돌아오지 않고(탭 이동 등) 새로 열면 로비에서 */
    G.keepElev = false;
    if (evR && G.scn === 'elev') { elevBack(); entranceBack(); return; }   /* v5.65 층 안내에서 뒤로 = 엘리베이터 안 */
    if (OPTS.restore && G.scn === 'lobby' && !evR) { poseSet(OPTS.restore); updateUi(true); entranceBack(); return; }   /* v5.53 앱 화면에서 뒤로 = 나가기 전 자리 */
    placeAt(0, true); applyTarget(); updateUi(true);
    entrance();
  }
  /* v5.53 (사용자 261004 「3d에서 앱으로 갔다가 뒤로가기를 하면 3d로 돌아와야 하는데, 앱 메인 화면으로 돌아가」) 자리 기억 · 되돌리기
   *   앱(TOUR_HOST.stampGo)이 닫기 전에 AXTour.pose() 로 캐릭터 자리 · 몸 방향 · 시점 방위 · 시점(내려다보기 · 눈높이) · 확대 거리를 받아 두고
   *   그 화면에서 뒤로 오면 AXTour.open({ restore }) · 모형 · 화면은 닫을 때 그대로 남아 있어 다시 받지 않는다 · 들어올 때 점 격자 전환(스카이뷰 비행 없이 그 자리) */
  function poseGet() { return { x: +G.pos.x.toFixed(3), z: +G.pos.z.toFixed(3), h: +G.h.toFixed(4), az: +G.azTo.toFixed(4), dist: +(G.dist || DDEF).toFixed(3) }; }   /* v5.65 시점은 눈높이 하나라 기억하지 않는다 */
  function poseSet(p) {
    G.pos.set(p.x, 0, p.z); G.h = G.face = p.h; G.az = G.azTo = p.az; G.mode = 'free'; G.path = null; G.yo = 0;
    tiltHome(true); if (p.dist) setDist(p.dist);
    var c = camWant(); G.camPos.copy(c.pos); G.look.copy(c.look); G.need = true;
  }
  function entranceBack() {
    veilText(''); veilProg(null);
    if (RM) { setTimeout(function () { veilReveal(150, null); }, 120); return; }
    setTimeout(function () { veilReveal(620, null); }, 260);
  }
  function close() {
    if (!ROOTEL || !G.open) return;
    if (!$('vid').hidden) closePromo();
    if (SCARD) closeStampCard();
    phAbort();   /* v5.67 */
    irAbort();   /* v5.55 아이리스 흐름 중이면 멈추고 */
    if (G.scn === 'elev' && !G.keepElev) leaveElev(true);   /* v5.49 다음에 열 때 로비에서 · v5.65 층 안내로 갈 때는 엘리베이터 안 그대로(돌아오면 그 자리) */
    if (G.squeeze) { G.pos.copy(toThree(GATE.at[0], GATE.at[1] - 0.3)); G.sqS = [1, 1, 1]; G.jy = 0; }   /* v5.56 연출 중 닫으면 게이트 앞으로(걷는 곳 밖에 남지 않게) */
    G.squeeze = null; G.push = 0; G.pushK = 0; $('cheer').hidden = true; setRun(false); G.runKey = false; G.cover = false;
    if (SH) { closeSheet(true); G.lastFace = null; }
    occClear(); $('look').hidden = true;
    closeCfg(); closeBigMap();
    $('help').hidden = true; $('hint').hidden = true; clearInterval(G.hintT); clearInterval(ETIP.iv); etipHide(); G.anim = null; HOLD = null; G.stick = null; musStop(true, 0.6);   /* v5.38 음악 = 암전과 함께 줄고 닫힘 */
    veilText(''); veilProg(null); veilCover(RM ? 150 : 240, null);   /* v5.51 나갈 때 전환 막(점이 덮는다) */
    setTimeout(function () {
      ROOTEL.hidden = true; G.open = false;
      document.documentElement.classList.remove('t3-lock'); var app = document.getElementById('app'); if (app) app.removeAttribute('aria-hidden');
    }, RM ? 160 : 260);
  }
  function back() {
    if (!ROOTEL || !G.open) return;
    if (!$('vid').hidden) { closePromo(); return; }
    if (SCARD) { closeStampCard(); return; }   /* v5.49 */
    if (!$('pola').hidden) { phClose(); return; }   /* v5.67 폴라로이드 */
    if (PH.on) return;   /* v5.67 사진 찍기 연출 동안 = 막음 */
    if (EV.seq) return;   /* v5.55 아이리스 흐름 동안 = 막음 */
    if (G.scn === 'elev') { leaveElev(false); return; }   /* v5.49 엘리베이터 = 1층으로 내리기 · v5.55 아이리스 */
    if (G.bigMap) { closeBigMap(); return; }   /* v5.51 */
    if (!$('cfg').hidden) { closeCfg(); return; }   /* v5.51 */
    if (SH) { closeSheet(); return; }
    if (!$('help').hidden) { hideHelp(); return; }
    close();
  }
  window.AXTour = { open: open, close: close, back: back, isOpen: function () { return !!(ROOTEL && G.open); }, pose: function () { return G.loaded && G.scn === 'lobby' ? poseGet() : G.loaded && G.scn === 'elev' ? { elev: 1 } : null; }, ver: 'v5.84', v3: true };   /* v5.65 엘리베이터 안 = { elev } */
})();
