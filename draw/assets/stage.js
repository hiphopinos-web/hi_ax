/* ═══════════════════════════════════════════════════════════════════════════
 * 261009 부저 연출(사용자 결정 · 디자인 시안/럭키드로우 고도화 261009/기획.md · 바뀐 곳 = 그 폴더 tools/patch_js.py --public)
 *   부저 화면(장면 mix · 오른쪽 아래 버튼 · 순수 연출) → Space(무대 노트북 · 콘솔 「다음」과 같은 표) = 부저 → 빠른 회전(새 장면 spin · 7.2 rad/s) → 감속(tension) → 번호 릴 끝자리 등수별(RKP)
 *   첫 추첨 최소 섞기 없음(당첨은 행운권 전체에서 암호 난수라 섞은 시간과 무관) · 카드 3.2초 뒤 저절로 부저 화면
 *   3차(사용자 261009 피드백): 음악 · 멜로디 전부 뺌 · 소리 = 부저 쿵 · 스네어 드럼롤 · 진짜 멈출 때 쾅(roll.js) · 공 소리 없음 · 기다리는 동안 무음
 *     부저 = 오른쪽 아래 구석 작게(통을 가리지 않는다) · 진행자 키 안내는 오른쪽 아래 아주 작게 4초 · N 키 없앰(M = 소리 전체)
 *   당첨을 정하는 곳(startExit · pickBatch) · 서버 계약 · 원격 명령 이름은 그대로
 * AX Festival 2026 · 17F 럭키드로우 무대 화면 · 드럼 판 (stage.html 전용 · 261008)
 *   사용자 결정 261008: ① 드럼 데모(drum.html · drum.js) 연출을 운영 무대에 그대로 ② 무대 표기 = 행운권 번호 + 실명 + 부서 크게(같은 날 「이름 가림」 대체 · 사번 없음)
 *     ③ 통 안의 공 = 대표 120개 · 당첨은 행운권 전체에서 · 화면 숫자는 「행운권 N장」 ④ 한 번 뽑으면 그 등수 남은 인원 K 명을 한꺼번에 · 3명까지 한 줄 · 4명부터 두 줄
 *   흐름 · 서버 계약은 옛 화면(assets/draw.js · index.html?classic=1)과 같다(이 파일은 그 코드를 옮겨 오고 연출만 바꿨다)
 *     서버 = draw_pool(가린 이름 · pk) · draw_log(당첨 · 부재 · 취소) · draw_state(예비 노트북 복원 · ack) · draw_cfg · draw_stats · fin_state · draw_scr(상태 보고) · draw_acks(확인 · 소켓이 끊겼을 때)
 *       · draw_who(261008 · 이번에 뽑힌 사람만 실명 · 부서 · 문이 열릴 때 부르고 공개 순간 그린다 · 실패하면 가린 이름 · 행운권 전체 실명 목록은 받지 않는다)
 *     원격 = 소켓 wss …/ws?r=draw(명령 draw · 확인 drawack) · 콘솔 「추첨 › 진행」 큰 버튼 = 이 화면 Space(nextCmd 와 같은 표)
 *     장면 이름(idle · intro · checkin · closed · card · mix · tension · exit · reveal · board · end · fin)과 명령 이름은 옛 화면 그대로(콘솔이 그 이름으로 버튼을 켠다)
 *   당첨 결정 = 공이 출구로 나오기 시작하는 순간(exit) 행운권 전체(draw_pool · 이미 당첨 · 부재로 빠진 분 제외 · 1인 1회)에서 암호 난수로 K 장 · 바로 이 기기에 저장
 *     서버 기록(draw_log)은 번호 릴이 다 선 순간(reveal) 보낸다 · 당첨자 폰 알림이 무대 공개보다 먼저 울리지 않게 · 새로고침해도 같은 당첨이 이어진다
 *   당첨자 확인 = 소켓 drawack(또는 draw_acks) · 오면 그 칸에 「확인 완료」만 덧붙인다 · 기다리지 않는다 · 확인이 없다는 이유로 부재 처리하지 않는다(당첨 확인 계약.md 0절)
 *   그림 = 2D 캔버스 하나에 3D 투영(drum.js 그대로) · 성능 단계 0 · 1 · 2(fps 가 낮으면 자동으로 내린다 · ?q=2 고정 · ?hud=1 프레임 수)
 *   같은 브라우저 저장(axfDraw.state.v1 · axfDraw.cfg.v1)을 옛 화면과 함께 쓴다 · K 두 번 = 옛 화면으로(기록 그대로)
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var Q = new URLSearchParams(location.search);
  var CONTROL = location.hash === "#control";
  if (CONTROL) { window.addEventListener("DOMContentLoaded", function () { window.AXDRAW_CONTROL && window.AXDRAW_CONTROL(); }); return; }
  var FORCEQ = Q.has("q") ? Math.max(0, Math.min(2, +Q.get("q") || 0)) : -1;

  /* ─────────────── 상수 · 무대 좌표(1920×1080 논리 좌표) ─────────────── */
  var W0 = 1920, H0 = 1080, PITCH = 30;
  var C = { o: "#FF7E31", hi: "#FF963E", pu: "#E6CCFF", o50: "#FFB284", o25: "#FFD8C1", w: "#FFFFFF", k: "#000000" };
  var FONT = '"AXP", "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
  var LS_CFG = "axfDraw.cfg.v1", LS_ST = "axfDraw.state.v1";
  /* 통 · drum.js 와 같은 값 */
  var DX = 600, DY = 560, RW = 352, PIT = 0.24, FOC = 2100;
  var NBL = 3, BT = 7, HUBR = 30, WMIX = 3.6, WSLOW = 1.4, G = 3000, JET = 10500, BLL = 0.62, NPEG = 48, GATE0 = 0;
  var BALLN = clamp(+Q.get("balls") || 120, 20, 360);   /* 대표 공 수(사용자 결정 261008 · 120) · 시험용 ?balls= */
  /* ─────────────── 부저 데모 261009 · 등수별 길이(초) ───────────────
   *   hold = 최고 속도 유지 · dec = 감속 길이 창(출구가 6시에 서도록 이 안에서 고른다) · rock = 선 뒤 정적
   *   fin = 마지막 칸 끝자리: dd 감속 · st [이동, 쉼] 한 칸씩 · pause 한 칸 앞 멈칫(0 = 없음) · M 0 보통 / 1 멈칫 / 2 멈칫 + 넘칠 듯 되돌아옴
   *   5차(사용자 261009 「넘어갈 듯 말 듯 되돌아오는 동작은 이상하다」): 멈칫 · 넘칠 듯 없앰
   *   6차(사용자 261009 「일의 자리 한 칸씩 넘어가는 연출이 작위적」): fin = { fs } 하나 · 일의 자리도 다른 자리처럼 계속 돌다가 마찰처럼 부드럽게 감속해 선다(fs 초 · 다른 자리 0.45초의 2 ~ 4배) · 튐 · 되돌아옴 없음 · 1등이 가장 길다
   *   fan = 팡파르 s · m · l · fanL = 팡파르 길이(그 뒤 공개 루프) */
  var WFAST = clamp(+Q.get("wfast") || 7.2, 3, 9), OXC = 360, CARD_AUTO = 3.2, SPINUP = 1.0;
  var BIGK = 1.14, BIGY = 105;   /* 4차 · 부저 화면 · 회전 · 감속에서 통을 1.14배(지름 약 760 → 870px · 화면 높이 70 → 81%) */
  var RKP = {
    6: { hold: 1.0, dec: [2.6, 3.4], rock: 0.7, fin: { fs: 0.9 }, fan: "s", fanL: 1.3 },
    5: { hold: 1.3, dec: [2.8, 3.6], rock: 0.75, fin: { fs: 0.95 }, fan: "s", fanL: 1.3 },
    4: { hold: 1.6, dec: [3.0, 3.9], rock: 0.8, fin: { fs: 1.0 }, fan: "s", fanL: 1.3 },
    3: { hold: 2.2, dec: [3.4, 4.4], rock: 0.9, fin: { fs: 1.25 }, fan: "m", fanL: 3.0 },
    2: { hold: 2.8, dec: [3.6, 4.8], rock: 1.0, fin: { fs: 1.5 }, fan: "m", fanL: 3.0 },
    1: { hold: 4.0, dec: [4.4, 5.8], rock: 1.3, fin: { fs: 1.8 }, fan: "l", fanL: 5.4 }
  };
  function RK() { var r = curRound(), n = parseInt(r && r.name, 10); if (!(n >= 1 && n <= 6)) n = clamp(rounds().length - ST.round, 1, 6); return RKP[n]; }

  /* ─────────────── 설정 · 옛 화면과 같은 저장 키 · 같은 기본값 ─────────────── */
  var DEF = {
    mode: "demo", demoN: 170, demoRate: 9,
    rounds: [
      { name: "6등", prize: "현대백화점 상품권 10만원", count: 3 },
      { name: "5등", prize: "풀리오 종아리 마사지기", count: 2 },
      { name: "4등", prize: "에어팟 4", count: 2 },
      { name: "3등", prize: "미닉스 음식물 처리기", count: 1 },
      { name: "2등", prize: "신라호텔 파크뷰 뷔페 식사권 2매", count: 1 },
      { name: "1등", prize: "아이패드", count: 1 }
    ],
    minMix: [[0, 30], [5, 20], [10, 10]], onePerPerson: true, absentRemove: true, checkinOnly: true,
    nameMode: "real",        /* real(실명 · draw_who) | mask(홍*동) | none(번호만) · 무대 표기 = 행운권 번호 + 실명 + 부서(사용자 261008 「실명으로 가자」) */
    showDept: true,          /* 부서 = 명부부서 부서 · 없으면 부문(사용자 261008 「부서명 사람 이름 둘 다」) */
    nameV: "261008r",        /* 이 값이 다르면(옛 저장 「가림」) 이름 · 부서 설정을 위 기본으로 한 번 되돌린다 */
    tickerNames: true, beat: true, intro: true, pal: 1, server: "",
    ckUI: false,             /* 이 화면은 체크인 없음만 · 체크인 화면이 필요하면 옛 화면(?classic=1&ck=1) */
    ballMax: 1000, roundsV: "261002"
  };
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var CFG = load(LS_CFG, null);
  if (CFG && CFG.rounds && CFG.roundsV !== DEF.roundsV) { delete CFG.rounds; delete CFG.roundsV; }
  CFG = Object.assign(JSON.parse(JSON.stringify(DEF)), CFG || {});
  if (CFG.nameV !== DEF.nameV) { CFG.nameMode = DEF.nameMode; CFG.showDept = DEF.showDept; CFG.nameV = DEF.nameV; save(LS_CFG, CFG); }   /* 261008 가림 → 실명 */
  if (+Q.get("demo") > 0) CFG.demoT = Math.min(9000, +Q.get("demo"));   /* 시험용 · ?demo=5000 = 데모 행운권 5,000장 */
  if (Q.get("remote") === "1") CFG.mode = Q.get("mode") === "demo" ? "demo" : "server";   /* 콘솔이 여는 원격 화면(../draw/?remote=1) = 서버 모드 · 모의 시험은 &mode=demo */
  function NOCK() { return true; }

  /* ─────────────── 난수 · 수학 ─────────────── */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rng = mulberry(Date.now() & 0xffffff);
  function cryptoUnits(n) {
    var out = new Float64Array(n), k = 0;
    while (k < n) { var m = Math.min(16384, n - k), a = new Uint32Array(m); crypto.getRandomValues(a); for (var j = 0; j < m; j++) out[k++] = a[j] / 4294967296; }
    return out;
  }
  function hash(i) { var v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function EO(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function EIO(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function EOB(x) { x = clamp(x, 0, 1); var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function angN(a) { a %= 6.2832; return a < 0 ? a + 6.2832 : a; }
  function pad4(n) { return ("000" + n).slice(-4); }
  function mask(n) {                                   /* 서버 maskName_ 과 같은 규칙 · 김하나 → 김*나 · 서버가 이미 가린 값이면 그대로 */
    n = String(n || ""); if (!n) return "";
    if (n.length <= 1) return n; if (n.length === 2) return n.charAt(0) + "*";
    return n.charAt(0) + new Array(n.length - 1).join("*") + n.charAt(n.length - 1);
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nf(v) { return Number(v || 0).toLocaleString("en-US"); }
  function cryptoShuffle(a) { var u = cryptoUnits(a.length); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(u[i] * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ─────────────── 추첨 상태 · 옛 화면과 같은 모양(+ batch · ack) ───────────────
   * results[] = { id, round, slot, no, pk, nm(가린 이름), dp(draw_pool 부문), fn · fd(draw_who 실명 · 부서 · 당첨자만), prize, rname, at, st, pool, big, q(서버에 아직 안 보냄) }
   * batch = 지금 공개 중인 한 번의 뽑기(기록 id 목록) · pending = 그 마지막 id(옛 화면 · 콘솔 호환) · ack[id] = 확인 시각 HH:MM */
  var ST = load(LS_ST, null);
  if (!ST || ST.v !== 1) ST = { v: 1, seed: Math.floor(Math.random() * 1e9), scene: "idle", pool: null, arrived: [], closed: false, round: 0, results: [], out: {}, src: CFG.mode };
  ST.ack = ST.ack || {}; ST.batch = ST.batch || [];
  function persist() { save(LS_ST, ST); pushCtl(); }

  /* ─────────────── 데모 행운권 ─────────────── */
  var SUR = "김이박최정강조윤장임한오서신권황안송류홍전고문양손배백허유남심노하곽성차주우구민진나지엄원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용".split("");
  var GIV = "민서준우지현수아은도윤하예진서연주원시영태경가채유호재성다온나혜인소희동건규빈승환정미선지훈석".split("");
  var DEPT = ["경영지원", "디지털전략", "장기보험", "자동차보험", "일반보험", "리스크관리", "재무", "인사총무", "영업기획", "보상서비스"];
  var DEPT2 = ["노사문화파트", "신성장파트", "데이터사이언스파트", "자동차보험 보상기획파트", "기업보험 해외영업 지원파트", "광화문지점", "디지털고객경험혁신파트", "장기보험상품개발파트"];   /* 데모 부서(긴 이름 포함 · 가짜) */
  function demoPool(n, seed, maxT) {
    var r = mulberry(seed), people = {}, order = [], used = {}, tot = 0;
    if (maxT) n = maxT;
    for (var i = 0; i < n && !(maxT && tot >= maxT); i++) {
      var k = r() < 0.5 ? 1 : r() < 0.6 ? 2 : 3;
      var nm = SUR[Math.floor(r() * SUR.length)] + GIV[Math.floor(r() * GIV.length)] + GIV[Math.floor(r() * GIV.length)];
      var nos = [];
      if (maxT) k = Math.min(k, maxT - tot); tot += k;
      while (nos.length < k) { var no = 1 + Math.floor(r() * 9999); if (used[no]) continue; used[no] = 1; nos.push(pad4(no)); }
      var pk = "d" + i;
      people[pk] = { nm: mask(nm), dp: DEPT[Math.floor(r() * DEPT.length)], nos: nos, fn: nm, fd: DEPT2[Math.floor(r() * DEPT2.length)] };   /* 데모도 서버처럼 명단은 가린 이름 · 실명 · 부서(fn · fd)는 draw_who 대신 당첨 뒤 꺼낸다 */
      order.push(pk);
    }
    return { people: people, order: order, kind: "demo" };
  }

  /* ─────────────── 서버 · JSONP(옛 화면과 같은 방식) · 주소는 ../assets/server.js 의 AXF_SERVER ─────────────── */
  var SRV = { status: "", polling: null, since: "", queue: load("axfDraw.q", []) };
  function jsonp(action, params, done) {
    var url = CFG.server || window.AXF_SERVER || "";
    if (!url) { done({ ok: false, reason: "noserver" }); return; }
    var name = "__axs" + Math.floor(Math.random() * 1e9), sc = document.createElement("script"), q = [];
    params = Object.assign({}, params, { action: action, callback: name, _: Date.now() });
    var code = sessionKey(); if (code) params.key = code;
    for (var k in params) if (params[k] != null) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    var timer = setTimeout(function () { clean(); window[name] = function () {}; done({ ok: false, reason: "timeout" }); }, 15000);
    function clean() { clearTimeout(timer); try { delete window[name]; } catch (e) { window[name] = undefined; } if (sc.parentNode) sc.parentNode.removeChild(sc); }
    window[name] = function (res) { clean(); done(res || { ok: false }); };
    sc.onerror = function () { clean(); done({ ok: false, reason: "network" }); };
    sc.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + q.join("&");
    document.head.appendChild(sc);
  }
  function pollMs() { return 30000; }   /* 대기 화면 숫자만 바뀐다 · 30초(행운권 전체 읽기는 서버에서 수 초 · 옛 화면과 같다) */
  function sessionKey() { try { return sessionStorage.getItem("axfDraw.key") || ""; } catch (e) { return ""; } }
  /* 행운권 읽기 · draw_pool(가린 이름 · pk · 번호) · 참석 조건 OFF = 행운권 전체 */
  function serverLoad(done) {
    if (SRV.loading) { done(false); return; }
    SRV.status = "불러오는 중"; SRV.loading = true;
    jsonp("draw_pool", { since: SRV.since || "" }, function (res) {
      SRV.loading = false;
      if (res && res.ok) {
        SRV.status = "draw_pool 연결"; SRV.hasPool = true;
        if (!ST.pool || ST.pool.kind !== "server") ST.pool = { people: {}, order: [], kind: "server" };
        (res.rows || []).forEach(function (r) {
          if (!ST.pool.people[r.pk]) { ST.pool.people[r.pk] = { nm: r.nm || "", dp: r.dp || "", nos: (r.no || []).map(String) }; ST.pool.order.push(r.pk); }
          else ST.pool.people[r.pk].nos = (r.no || []).map(String);
          if (r.x && !ST.out[r.pk] && (r.x === "win" ? CFG.onePerPerson : CFG.absentRemove)) ST.out[r.pk] = r.x;   /* 서버 기록에 이미 당첨 · 부재 */
        });
        SRV.since = res.cursor || SRV.since; SRV.balls = res.balls; SRV.all = !!res.all;
        if (SC === "checkin" && !ST.closed) nockQueue();
        uiPool();
        if (!SRV.stateChecked) { SRV.stateChecked = true; serverState(); }
        done(true); return;
      }
      SRV.status = "실패 · " + (res && (res.reason || res.err) || "응답 없음"); done(false);
    });
  }
  /* 예비 노트북 복원 · 이 브라우저에 기록이 없는데 서버 추첨기록이 있으면 그대로 가져온다 · 확인(ack)도 함께 */
  function serverState() {
    jsonp("draw_state", {}, function (res) {
      if (!res || !res.ok) { SRV.stateStatus = "draw_state 실패 · " + (res && (res.reason || res.err) || "응답 없음"); return; }
      SRV.stateStatus = "draw_state " + (res.n || 0) + "줄";
      (res.rows || []).forEach(function (r) { if (r.ack && !ST.ack[r.id]) ST.ack[r.id] = r.ack; });
      if (ST.results.length || !res.rows || !res.rows.length) { persist(); return; }
      var byId = {}, list = [];
      res.rows.forEach(function (r) {
        if (r.st === "undo") { if (byId[r.id]) byId[r.id].st = "undone"; return; }
        var x = byId[r.id];
        if (!x) { x = { id: r.id, round: +r.round || 0, slot: +r.slot || 1, no: String(r.no), pk: r.pk, nm: r.nm || "", dp: "", prize: r.prize, rname: "", at: r.at, st: r.st, pool: 0, srv: 1 }; byId[r.id] = x; list.push(x); }
        else x.st = r.st;
        var pp = ST.pool && ST.pool.people[r.pk]; if (pp && !x.nm) x.nm = pp.nm;
      });
      ST.results = list;
      list.forEach(function (x) { if (x.st === "win" && CFG.onePerPerson) ST.out[x.pk] = "win"; if (x.st === "absent" && CFG.absentRemove) ST.out[x.pk] = "absent"; });
      var rs = rounds(); ST.round = 0;
      while (ST.round < rs.length - 1 && roundWins(ST.round).length >= rs[ST.round].count) ST.round++;
      persist(); toast("서버 추첨기록 " + list.length + "건을 이어받았습니다", true);
      whoFetch();
    });
  }
  /* 실명 · 부서(사용자 261008 「실명으로 가자」) · draw_who = 이번에 뽑힌 사람만(pk 12개까지 · 관리코드) · 받으면 그 당첨 기록에 fn · fd 를 붙이고 칸을 다시 그린다
   *   행운권 전체 명단(draw_pool)은 그대로 가린 이름 · 실명은 당첨자만 이 기기에 남는다(상태 보고 draw_scr 는 계속 가린 이름)
   *   실패 · 끊김 = 가린 이름 + draw_pool 부서로 그리고 1.5 · 3 · 4.5초 … 뒤 다시(10초 상한) · 옛 서버(draw_who 없음) · 권한 없음 = 다시 묻지 않는다 */
  var WHO = { busy: false, next: 0, fail: 0, off: false, miss: {} };
  function whoWant() { return ST.results.filter(function (r) { return r.st === "win" && r.pk && !r.fn && !WHO.miss[r.pk]; }); }
  function whoFetch() {
    if (CFG.nameMode !== "real") return;
    var want = whoWant(); if (!want.length) return;
    if (CFG.mode !== "server") {
      var ch = false;
      want.forEach(function (r) { var pp = ST.pool && ST.pool.people[r.pk]; if (pp && pp.fn) { r.fn = pp.fn; r.fd = pp.fd || pp.dp || ""; ch = true; } else WHO.miss[r.pk] = 1; });
      if (ch) { persist(); whoPaint(); }
      return;
    }
    if (WHO.busy || WHO.off || Date.now() < WHO.next) return;
    var pks = []; want.forEach(function (r) { if (pks.length < 12 && pks.indexOf(r.pk) < 0) pks.push(r.pk); });
    WHO.busy = true;
    jsonp("draw_who", { pk: pks.join(",") }, function (res) {
      WHO.busy = false;
      if (res && res.ok) {
        var m = {}, ch = false;
        (res.rows || []).forEach(function (x) { if (x && x.pk && x.nm) m[x.pk] = x; });
        pks.forEach(function (pk) { if (!m[pk]) WHO.miss[pk] = 1; });
        ST.results.forEach(function (r) { var x = m[r.pk]; if (x && !r.fn) { r.fn = String(x.nm).slice(0, 30); r.fd = String(x.dp || "").slice(0, 60); ch = true; } });
        WHO.fail = 0; WHO.next = 0;
        if (ch) { persist(); whoPaint(); }
        if (whoWant().length) whoFetch();
        return;
      }
      if (res && (res.err === "unknown action" || res.reason === "auth")) { WHO.off = true; return; }
      WHO.fail++; WHO.next = Date.now() + Math.min(10000, 1500 * WHO.fail);
    });
  }
  /* 실명이 늦게 오면 · 보고 있는 화면만 다시 그린다(공개 칸 · 결과판) */
  function whoPaint() {
    if ((SC === "reveal" || SC === "exit") && WB.length) for (var j = 0; j < WB.length; j++) fillCell(j);   /* exit = 번호 릴이 도는 중(칸은 이미 있다) */
    else if (SC === "board") uiBoard();
  }
  /* 당첨 기록 전송 · draw_log · 끊기면 로컬 큐에 두고 다시 보낸다(화면 진행은 막지 않는다) */
  function serverLog(r) {
    if (CFG.mode !== "server") return;
    SRV.queue.push({ id: r.id, round: r.round, slot: r.slot, no: r.no, pk: r.pk, st: r.st, prize: r.prize, at: r.at });
    save("axfDraw.q", SRV.queue); flushQueue();
  }
  function flushQueue() {
    if (!SRV.queue.length || SRV.flushing) return;
    SRV.flushing = true;
    var e = SRV.queue[0];
    jsonp("draw_log", e, function (res) {
      SRV.flushing = false;
      if (res && (res.ok || res.reason === "dup")) { SRV.logStatus = res.reason === "dup" ? "서버에 같은 분의 다른 당첨이 있습니다 · " + (res.id || "") : "기록됨" + (res.again ? "(이미 있음)" : "") + (res.warn ? " · 명단 밖 pk" : ""); SRV.queue.shift(); save("axfDraw.q", SRV.queue); flushQueue(); }
      else { SRV.logStatus = res && res.err === "unknown action" ? "draw_log 없음 · 로컬 기록만" : "전송 대기 " + SRV.queue.length; if (!(res && res.err === "unknown action")) setTimeout(flushQueue, 5000); }
    });
  }

  /* ─────────────── 캔버스 · 배율 · 성능 단계 ───────────────
   * 단계 0 = 픽셀 상한 2560×1440 · 물리 4번 나눔 · 입자 그대로
   * 단계 1 = 1920×1080 · 물리 3번 · 입자 60%
   * 단계 2 = 1440×810(늘려 보인다) · 물리 2번 · 입자 40% · 뒤쪽 살 · 번호 잔상 끔
   * 1초 평균이 50fps 아래로 1.5초 이어지면 한 단계 내린다(다시 올리지 않는다 · 무대에서 흔들리지 않게) */
  var cv, cx, frameEl, vw = 0, vh = 0, dpr = 1, vs = 1, vox = 0, voy = 0, FRS = { s: 1, ox: 0, oy: 0 }, gridBlack = null, gridOrange = null;
  var TIER = [{ cap: 2560 * 1440, phs: 4, pm: 1, ribs: 1, st: 1 }, { cap: 1920 * 1080, phs: 3, pm: 0.6, ribs: 1, st: 1 }, { cap: 1440 * 810, phs: 2, pm: 0.4, ribs: 0, st: 0 }];
  var QL = { tier: FORCEQ >= 0 ? FORCEQ : 0, low: 0, changedT: 0, log: [] };
  function TQ() { return TIER[QL.tier]; }
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var px = w * h * dpr * dpr, cap = TQ().cap;
    if (px > cap) dpr *= Math.sqrt(cap / px);
    vw = Math.round(w * dpr); vh = Math.round(h * dpr);
    cv.width = vw; cv.height = vh; cv.style.width = w + "px"; cv.style.height = h + "px";
    var s = Math.min(w / W0, h / H0);
    vs = s * dpr; vox = (w - W0 * s) / 2 * dpr; voy = (h - H0 * s) / 2 * dpr;
    frameEl.style.transform = "translate(" + (w - W0 * s) / 2 + "px," + (h - H0 * s) / 2 + "px) scale(" + s + ")";
    FRS.s = s; FRS.ox = (w - W0 * s) / 2; FRS.oy = (h - H0 * s) / 2;
    var v = document.getElementById("vIntro"); if (v) v.style.transform = frameEl.style.transform;
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
  function applyTier(t, why) {
    t = clamp(t, 0, 2); if (FORCEQ >= 0) t = FORCEQ;
    if (t === QL.tier) return;
    QL.tier = t; QL.changedT = T; QL.log.push([Math.round(T), t, why]); if (QL.log.length > 20) QL.log.shift();
    resize();
  }
  function stepQuality(dt) {
    if (FORCEQ >= 0 || document.hidden) { QL.low = 0; return; }
    if (FPS.v < 50 && FPS.frames > 120 && T - QL.changedT > 3 && QL.tier < 2) { QL.low += dt; if (QL.low > 1.5) { QL.low = 0; applyTier(QL.tier + 1, Math.round(FPS.v) + "fps"); } }
    else QL.low = 0;
  }

  /* ─────────────── 스테이지 · 하프톤 전환(격자 점이 자라서 면이 된다) ─────────────── */
  var STG = { base: "black", to: null, t0: 0, dur: 0.6, ox: 960, oy: 540, flipAt: 0 };
  function stageTo(to, ox, oy, dur) {
    if (STG.base === to && !STG.to) return;
    STG.to = to; STG.t0 = T; STG.dur = dur || 0.6; STG.ox = ox == null ? 960 : ox; STG.oy = oy == null ? 540 : oy; STG.flipAt = T + STG.dur * 0.45;
  }
  function stageSet(to) { STG.base = to; STG.to = null; STG.flipAt = 0; document.body.classList.toggle("st-orange", to === "orange"); }
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

  /* ─────────────── 공 스프라이트 · 캡슐(위 색 · 아래 흰색) · 이음선 각 32단 ─────────────── */
  var TONES = [C.o, C.hi, C.o50], NROT = 32, SPR = { key: "", c: null, sz: 0 };
  function buildSprites() {
    var sz = Math.ceil(clamp(RB * vs * 1.25, 24, 96)) * 2;
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

  /* ─────────────── 물리 · 3D 공 · 회전하는 날개 · 공간 격자(drum.js 그대로) ───────────────
   *   좌표 = 통 중심 원점 · x 오른쪽 · y 아래 · z 관객 쪽 · 통은 z 축으로 돈다 · live_ 1 = 통 안 */
  var NB = 0, RB = 30, NIN = 0;
  var px_, py_, pz_, vx_, vy_, vz_, ba_, tone_, live_, born_;
  var DRM = { th: 0, w: 0, mode: "spin", tgt: 0 };
  var GRID = { n: 0, cs: 1, head: null, next: null };
  function allocBalls(n) {
    NB = n; NIN = 0;
    RB = clamp(RW * Math.cbrt(0.16 / n), 20, 32);
    px_ = new Float32Array(NB); py_ = new Float32Array(NB); pz_ = new Float32Array(NB);
    vx_ = new Float32Array(NB); vy_ = new Float32Array(NB); vz_ = new Float32Array(NB);
    ba_ = new Float32Array(NB); tone_ = new Uint8Array(NB); live_ = new Uint8Array(NB); born_ = new Float32Array(NB);
    for (var i = 0; i < NB; i++) { ba_[i] = rng() * 6.2832; tone_[i] = rng() < 0.62 ? 0 : rng() < 0.5 ? 1 : 2; }
    var gd = Math.ceil(2 * RW / (2 * RB)) + 2; GRID.n = gd; GRID.cs = 2 * RB; GRID.head = new Int32Array(gd * gd * gd); GRID.next = new Int32Array(NB);
  }
  function liveCount() { var n = 0; for (var i = 0; i < NB; i++) if (live_[i]) n++; return n; }
  function settleBall(i) {                             /* 복원 · 통 아래쪽에 바로 앉힌다 */
    var a = rng() * 6.2832, b = Math.acos(2 * rng() - 1), rr = (RW - RB) * Math.cbrt(rng());
    px_[i] = Math.sin(b) * Math.cos(a) * rr; py_[i] = Math.abs(Math.sin(b) * Math.sin(a)) * rr * 0.9; pz_[i] = Math.cos(b) * rr;
    vx_[i] = vy_[i] = vz_[i] = 0; live_[i] = 1; born_[i] = -9;
  }
  function spawnBall(i) {                              /* 추첨 준비 · 통 위쪽 안에서 생겨 떨어진다 */
    px_[i] = (rng() - 0.5) * RW * 0.5; pz_[i] = (rng() - 0.5) * RW * 0.5; py_[i] = -(RW - RB) * 0.72;
    vx_[i] = (rng() - 0.5) * 300; vy_[i] = 300 + rng() * 300; vz_[i] = (rng() - 0.5) * 300; live_[i] = 1; born_[i] = T;
  }
  function bladeAng(k) { return DRM.th + GATE0 + Math.PI / 3 + k * 6.2832 / NBL; }
  function gateAng() { return DRM.th + GATE0 + Math.PI / 2; }
  var HITS = 0, lastHitT = 0;
  function cellOf(x, y, z, off, cs, gn) { var a = clamp(Math.floor((x + off) / cs), 0, gn - 1), b = clamp(Math.floor((y + off) / cs), 0, gn - 1), c = clamp(Math.floor((z + off) / cs), 0, gn - 1); return (c * gn + b) * gn + a; }
  function physStep(h) {
    var i, j, k, w = DRM.w, mixAmt = clamp(Math.abs(w) / WMIX, 0, 1), R = RB, R2 = 4 * R * R, lim = RW - R;
    var bl = [];
    for (k = 0; k < NBL; k++) { var a = bladeAng(k); bl.push([Math.cos(a), Math.sin(a)]); }
    for (i = 0; i < NB; i++) {
      if (!live_[i]) continue;
      vy_[i] += G * h;
      if (mixAmt > 0.02) {                             /* 회오리 · 통 안 공기가 날개를 따라 돈다 · 앞뒤로도 흔든다 */
        var rho = Math.hypot(px_[i], py_[i]) + 1e-3, tx = -py_[i] / rho, ty = px_[i] / rho, vt = vx_[i] * tx + vy_[i] * ty, tg = w * rho * 0.45;
        var ks = 0.9 * mixAmt * h; vx_[i] += (tg - vt) * tx * ks; vy_[i] += (tg - vt) * ty * ks;
        vz_[i] += (rng() - 0.5) * 2600 * mixAmt * h;
        var jw = RW * 0.42, ax = Math.abs(px_[i] + Math.sin(T * 1.7) * RW * 0.12);   /* 바닥 가운데에서 솟는 바람 */
        if (ax < jw && py_[i] > -RW * 0.15) vy_[i] -= JET * mixAmt * (1 - ax / jw) * h;
        vx_[i] += (rng() - 0.5) * 900 * mixAmt * h; vy_[i] += (rng() - 0.5) * 900 * mixAmt * h;
      }
      var dmp = 1 - 0.35 * h; vx_[i] *= dmp; vy_[i] *= dmp; vz_[i] *= dmp;
      px_[i] += vx_[i] * h; py_[i] += vy_[i] * h; pz_[i] += vz_[i] * h;
    }
    for (var it = 0; it < 2; it++) {
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
      for (i = 0; i < NB; i++) {
        if (!live_[i]) continue;
        var x = px_[i], y = py_[i], z = pz_[i], dd = Math.sqrt(x * x + y * y + z * z);
        if (dd > lim) {
          var nX = x / dd, nY = y / dd, nZ = z / dd; px_[i] = nX * lim; py_[i] = nY * lim; pz_[i] = nZ * lim;
          var vnn = vx_[i] * nX + vy_[i] * nY + vz_[i] * nZ;
          if (vnn > 0) { vx_[i] -= 1.45 * vnn * nX; vy_[i] -= 1.45 * vnn * nY; vz_[i] -= 1.45 * vnn * nZ; }
          var wx = -w * py_[i], wy = w * px_[i], mu = 0.06;
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
          var vbx = -uy * w * along, vby = ux * w * along;
          var vr = (vx_[i] - vbx) * nX2 + (vy_[i] - vby) * nY2;
          if (vr < 0) { vx_[i] -= 1.5 * vr * nX2; vy_[i] -= 1.5 * vr * nY2; vz_[i] += (rng() - 0.5) * Math.abs(vr) * 0.6; }
        }
      }
    }
    for (i = 0; i < NB; i++) if (live_[i]) { ba_[i] += (vx_[i] * 0.8 - vy_[i] * 0.25 + DRM.w * 6) / R * h; if (ba_[i] !== ba_[i] || px_[i] !== px_[i]) { settleBall(i); NANFIX++; } }
  }
  var NANFIX = 0;

  /* 투영 · 아래로 내려다보는 원근 */
  var PRJ = { x: 0, y: 0, s: 1, z: 0 }, cP = Math.cos(PIT), sP = Math.sin(PIT);
  function prj(x, y, z) { var y2 = y * cP + z * sP, z2 = z * cP - y * sP, s = FOC / (FOC - z2); PRJ.x = DX + x * s; PRJ.y = DY + y2 * s; PRJ.s = s; PRJ.z = z2; return PRJ; }

  /* ─────────────── 통 그림(drum.js 그대로) ─────────────── */
  var CAMD = { k: 1, ox: 0, oy: 0, a: 0 };
  var ORD = null, ZS = null;
  function drumXf() { var k = CAMD.k, sh = shakeXY(); cx.setTransform(vs * k, 0, 0, vs * k, vox + vs * (CAMD.ox + sh[0] + DX * (1 - k)), voy + vs * (CAMD.oy + sh[1] + (DY + RW) * (1 - k))); }
  function drawDrum() {
    if (CAMD.a <= 0.01) return;
    drumXf(); cx.globalAlpha = CAMD.a;
    var g = cx.createRadialGradient(DX - RW * 0.3, DY - RW * 0.35, 0, DX, DY, RW + 16);
    g.addColorStop(0, "rgba(255,244,236,0.12)"); g.addColorStop(0.65, "rgba(255,236,224,0.06)"); g.addColorStop(0.94, "rgba(255,222,204,0.15)"); g.addColorStop(1, "rgba(255,222,204,0)");
    cx.fillStyle = g; cx.beginPath(); cx.arc(DX, DY, RW + 16, 0, 6.2832); cx.fill();
    if (TQ().ribs) drawRibs(false);
    drawBalls();
    drawBlades();
    drawRibs(true);
    drawRim();
    drawLip();
    drawSpeed();
    for (var k = 0; k < WB.length; k++) if (WB[k].ph === "drop") drawOneBall(WB[k].i);
    cx.globalAlpha = 1;
  }
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
    for (i = 0; i < NB; i++) if (live_[i]) { prj(px_[i], py_[i], pz_[i]); ZS[i] = PRJ.z; ORD[n++] = i; }
    var o = Array.prototype.slice.call(ORD, 0, n); o.sort(function (a, b) { return ZS[a] - ZS[b]; });
    var sz = SPR.sz, img = SPR.c;
    for (var q = 0; q < o.length; q++) {
      i = o[q]; prj(px_[i], py_[i], pz_[i]);
      var grow = born_[i] > 0 ? EOB((T - born_[i]) / 0.3) : 1;   /* 추첨 준비 · 생겨날 때 톡 커진다 */
      if (grow <= 0.02) continue;
      var r = RB * PRJ.s * grow, kk = Math.floor(angN(ba_[i]) / 6.2832 * NROT) % NROT;
      var fog = clamp(0.55 + (PRJ.z + RW) / (2 * RW) * 0.5, 0.55, 1);
      cx.globalAlpha = CAMD.a * fog;
      cx.drawImage(img, kk * sz, tone_[i] * sz, sz, sz, PRJ.x - r, PRJ.y - r, 2 * r, 2 * r);
    }
    cx.globalAlpha = CAMD.a;
    for (var k = 0; k < WB.length; k++) if (WB[k].ph === "inside") drawOneBall(WB[k].i);
  }
  function drawOneBall(i) {
    if (i < 0) return;
    prj(px_[i], py_[i], pz_[i]); var r = RB * PRJ.s, kk = Math.floor(angN(ba_[i]) / 6.2832 * NROT) % NROT;
    cx.drawImage(SPR.c, kk * SPR.sz, tone_[i] * SPR.sz, SPR.sz, SPR.sz, PRJ.x - r, PRJ.y - r, 2 * r, 2 * r);
  }
  function drawBlades() {
    var s, al, zz;
    for (var k = 0; k < NBL; k++) {
      var a = bladeAng(k), ux = Math.cos(a), uy = Math.sin(a), L = RW * BLL;
      cx.beginPath();
      for (s = 0; s <= 12; s++) { al = HUBR + (L - HUBR) * s / 12; zz = Math.sqrt(Math.max(0, RW * RW - al * al)) * 0.92; prj(ux * al, uy * al, zz); if (s) cx.lineTo(PRJ.x, PRJ.y); else cx.moveTo(PRJ.x, PRJ.y); }
      for (s = 12; s >= 0; s--) { al = HUBR + (L - HUBR) * s / 12; zz = Math.sqrt(Math.max(0, RW * RW - al * al)) * 0.92; prj(ux * al, uy * al, -zz); cx.lineTo(PRJ.x, PRJ.y); }
      cx.closePath(); cx.fillStyle = "rgba(255,240,230,0.07)"; cx.fill();
      cx.lineWidth = 3; cx.strokeStyle = "rgba(255,246,238,0.42)"; cx.beginPath();
      for (s = 0; s <= 12; s++) { al = HUBR + (L - HUBR) * s / 12; zz = Math.sqrt(Math.max(0, RW * RW - al * al)) * 0.92; prj(ux * al, uy * al, zz); if (s) cx.lineTo(PRJ.x, PRJ.y); else cx.moveTo(PRJ.x, PRJ.y); }
      cx.stroke();
    }
    prj(0, 0, RW * 0.98); var hx = PRJ.x, hy = PRJ.y, hr = 34 * PRJ.s;
    cx.fillStyle = "rgba(255,255,255,0.92)"; cx.beginPath(); cx.arc(hx, hy, hr, 0, 6.2832); cx.fill();
    cx.fillStyle = C.o; cx.beginPath();
    for (var d = 0; d < 3; d++) { var aa = DRM.th + d * 2.0944, x = hx + Math.cos(aa) * hr * 0.55, y = hy + Math.sin(aa) * hr * 0.55 * cP; cx.moveTo(x + 6, y); cx.arc(x, y, 6, 0, 6.2832); }
    cx.fill();
  }
  function drawRim() {
    var ga = gateAng(), i, a;
    cx.lineWidth = 4; cx.strokeStyle = "rgba(255,240,230,0.30)"; cx.beginPath();
    for (i = 0; i <= 96; i++) { a = i / 96 * 6.2832; prj(Math.cos(a) * (RW + 10), Math.sin(a) * (RW + 10), 0); if (i) cx.lineTo(PRJ.x, PRJ.y); else cx.moveTo(PRJ.x, PRJ.y); }
    cx.stroke();
    var spd = Math.abs(DRM.w);
    if (spd < 2.4) {
      cx.fillStyle = C.o; cx.beginPath();
      for (i = 0; i < NPEG; i++) {
        a = DRM.th + i / NPEG * 6.2832;
        var dg = Math.abs(Math.atan2(Math.sin(a - ga), Math.cos(a - ga))); if (dg < 0.1) continue;
        prj(Math.cos(a) * (RW + 26), Math.sin(a) * (RW + 26), 0); var r = 6.5 * PRJ.s;
        cx.moveTo(PRJ.x + r, PRJ.y); cx.arc(PRJ.x, PRJ.y, r, 0, 6.2832);
      }
      cx.fill();
    } else {                                           /* 빠를 때 · 톱니가 거꾸로 도는 착시(스트로브) 대신 꼬리 달린 줄로 */
      var tail = (DRM.w > 0 ? 1 : -1) * Math.min(0.13, spd * 0.018);
      cx.strokeStyle = C.o; cx.lineWidth = 12; cx.lineCap = "round"; cx.beginPath();
      for (i = 0; i < NPEG; i++) {
        a = DRM.th + i / NPEG * 6.2832;
        prj(Math.cos(a) * (RW + 26), Math.sin(a) * (RW + 26), 0); cx.moveTo(PRJ.x, PRJ.y);
        prj(Math.cos(a - tail) * (RW + 26), Math.sin(a - tail) * (RW + 26), 0); cx.lineTo(PRJ.x, PRJ.y);
      }
      cx.stroke(); cx.lineCap = "butt";
    }
    prj(0, -(RW + 26), 0); var tx = PRJ.x, ty = PRJ.y, kick = PAWL.k;
    cx.save(); cx.translate(tx, ty - 44); cx.rotate(-0.28 * kick);
    cx.fillStyle = "#fff"; cx.beginPath(); cx.moveTo(-13, 0); cx.lineTo(13, 0); cx.lineTo(0, 40); cx.closePath(); cx.fill();
    cx.restore();
    var open = EIO(GATE.v), dh = 0.11, sl = open * 0.24, r0 = RW - 4, r1 = RW + 18;
    cx.fillStyle = "rgba(250,246,242,0.96)"; cx.beginPath();
    for (i = 0; i <= 8; i++) { a = ga - dh + sl + i / 8 * 2 * dh; prj(Math.cos(a) * r1, Math.sin(a) * r1, 0); if (i) cx.lineTo(PRJ.x, PRJ.y); else cx.moveTo(PRJ.x, PRJ.y); }
    for (i = 8; i >= 0; i--) { a = ga - dh + sl + i / 8 * 2 * dh; prj(Math.cos(a) * r0, Math.sin(a) * r0, 0); cx.lineTo(PRJ.x, PRJ.y); }
    cx.closePath(); cx.fill();
  }
  function drawLip() {
    prj(0, RW + 30, 0); var x = PRJ.x, y = PRJ.y;
    cx.strokeStyle = "rgba(255,246,238,0.55)"; cx.lineWidth = 4; cx.lineCap = "round";
    cx.beginPath(); cx.moveTo(x - 62, y + 6); cx.quadraticCurveTo(x, y + 58, x + 62, y + 6); cx.stroke();
    cx.lineCap = "butt";
  }

  /* ─────────────── 부저 데모 · 가운데 큰 버튼(순수 연출 · 실제 클릭 없음) · 속도 줄 · 흔들림 ───────────────
   *   부저 = 오른쪽 아래 구석(1650, 832 · 반지름 96 · 3차) · 오렌지 돔 + 검은 받침 + 도는 점 고리 · 돔 위 글자 = 등수(「1등」) + PUSH
   *   누르면(4차): 돔이 0.06초에 내려가고 · 그 자리에서 빛이 번지며 부풀어 흩어진다(작은 고리 · 점) · 0.4초 안에 사라진다 · 통 쪽으로 가지 않는다 · 통이 빨라진다 */
  var BZ = { t0: -9, press: -1, x: 1650, y: 832, R: 96 }, SHK = { t0: -9, amp: 0 }, SPIN = { t0: 0, hold: 1 }, CONF = { until: 0 };
  function uiRk() { var r = curRound(); set("rkN", esc(r.name)); set("rkP", esc(r.prize)); fitText($("rkP"), 46, 30, 1); set("rkC", r.count + "명"); }
  function shakeXY() { var u = T - SHK.t0; if (u > 0.6 || u < 0) return [0, 0]; var a = SHK.amp * Math.exp(-u * 7); return [Math.sin(u * 91) * a, Math.cos(u * 73) * a * 0.7]; }
  function burstBuzzer() {
    var n = Math.round(90 * TQ().pm);                 /* 4차 · 부저 자리에서만 작게 흩어진다 */
    for (var k = 0; k < n; k++) { var a = rng() * 6.2832, sp = 260 + rng() * 520; spark(BZ.x + Math.cos(a) * BZ.R * 1.1, BZ.y + Math.sin(a) * BZ.R * 1.1, Math.cos(a) * sp, Math.sin(a) * sp, 0.3 + rng() * 0.35, 2 + rng() * 4, rng() < 0.55 ? 0 : 3, 0, 3.2); }
  }
  function stepBuzzer(dt) {                            /* 1등 공개 · 양옆에서만 흰 점이 내린다(가운데 이름 · 부서는 가리지 않는다) */
    if (CONF.until > T && SC === "reveal" && rng() < 0.7) { var L = rng() < 0.5, x = L ? 40 + rng() * 380 : 1500 + rng() * 380; spark(x, -20, (rng() - 0.5) * 80, 150 + rng() * 200, 6, 3 + rng() * 4, 3, 40, 0.3); }
  }
  function drawBuzzer() {
    var vis = SC === "mix" && !NEXTCARD, pr = BZ.press >= 0 ? T - BZ.press : -1;
    if (!vis && !(pr >= 0 && pr < 0.5)) return;
    if (vis && pr >= 0.5) pr = -1;
    var sh = shakeXY(), x = BZ.x + sh[0], y = BZ.y + sh[1];
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    var ap = vis && pr < 0 ? EOB(clamp((T - BZ.t0) / 0.45, 0, 1)) : 1, al = vis && pr < 0 ? clamp((T - BZ.t0) / 0.2, 0, 1) : 1;
    /* 4차 · 눌림 0.06초 → 그 자리에서 부풀며 흩어져 0.4초 안에 사라진다(통 쪽으로 가지 않는다) */
    var gone = pr >= 0 ? EO(clamp((pr - 0.07) / 0.33, 0, 1)) : 0, sc = Math.max(0.02, ap * (1 + gone * 0.3));
    al *= 1 - gone;
    if (pr >= 0 && pr < 0.3) { var gl = cx.createRadialGradient(BZ.x, BZ.y, 0, BZ.x, BZ.y, BZ.R * 2.6); gl.addColorStop(0, "rgba(255,255,255,0.55)"); gl.addColorStop(0.45, "rgba(255,178,132,0.28)"); gl.addColorStop(1, "rgba(255,126,49,0)"); cx.globalAlpha = 1 - pr / 0.3; cx.fillStyle = gl; cx.beginPath(); cx.arc(BZ.x, BZ.y, BZ.R * 2.6, 0, 6.2832); cx.fill(); }
    if (pr >= 0) for (var q = 0; q < 3; q++) {         /* 충격 고리 세 겹 */
      var u = (pr - q * 0.04) / 0.34; if (u <= 0 || u >= 1) continue;
      cx.globalAlpha = (1 - u) * 0.8; cx.strokeStyle = q === 1 ? C.o : "#fff"; cx.lineWidth = 8 * (1 - u) + 1;
      cx.beginPath(); cx.arc(BZ.x, BZ.y, BZ.R * 1.24 + EO(u) * BZ.R * 1.6, 0, 6.2832); cx.stroke();
    }
    if (al <= 0.01) { cx.globalAlpha = 1; return; }
    cx.globalAlpha = al;
    var R = BZ.R * sc, H = R * 1.24;
    if (pr < 0) for (var h = 0; h < 2; h++) {           /* 기다림 · 숨 쉬는 고리 */
      var w = ((T - BZ.t0) / 1.7 + h * 0.5) % 1;
      cx.strokeStyle = "rgba(255,126,49," + (0.55 * (1 - w)).toFixed(3) + ")"; cx.lineWidth = 7 * (1 - w) + 1;
      cx.beginPath(); cx.arc(x, y, H + 10 + w * 70 * sc, 0, 6.2832); cx.stroke();
    }
    cx.fillStyle = "#0b0b0b"; cx.beginPath(); cx.arc(x, y, H, 0, 6.2832); cx.fill();
    cx.lineWidth = 4 * sc; cx.strokeStyle = "rgba(255,255,255,0.85)"; cx.stroke();
    cx.fillStyle = C.o; cx.beginPath();
    for (var d = 0; d < 60; d++) { var a = d / 60 * 6.2832 + T * (pr >= 0 ? 2.4 : 0.35), rx = x + Math.cos(a) * H * 0.905, ry = y + Math.sin(a) * H * 0.905, dr = 3.4 * sc; cx.moveTo(rx + dr, ry); cx.arc(rx, ry, dr, 0, 6.2832); }
    cx.fill();
    var dep = 22;                                      /* 돔 높이 · 누르면 0.06초에 4 로 · 다시 16 까지 튀어 오른다 */
    if (pr >= 0) dep = pr < 0.06 ? 22 - 18 * (pr / 0.06) : 4 + 12 * EOB(clamp((pr - 0.14) / 0.3, 0, 1));
    dep *= sc;
    var by = y + 12 * sc, ty = by - dep;
    cx.fillStyle = C.o; cx.beginPath(); cx.arc(x, by, R, 0, 6.2832); cx.fill();
    cx.fillStyle = "rgba(0,0,0,0.42)"; cx.fill();
    var g = cx.createRadialGradient(x - R * 0.35, ty - R * 0.42, R * 0.04, x, ty, R);
    g.addColorStop(0, C.o25); g.addColorStop(0.32, C.o50); g.addColorStop(0.72, C.o); g.addColorStop(1, C.o);
    cx.fillStyle = g; cx.beginPath(); cx.arc(x, ty, R, 0, 6.2832); cx.fill();
    cx.save(); cx.translate(x - R * 0.28, ty - R * 0.5); cx.rotate(-0.45); cx.fillStyle = "rgba(255,255,255,0.3)"; cx.beginPath(); cx.ellipse(0, 0, R * 0.36, R * 0.13, 0, 0, 6.2832); cx.fill(); cx.restore();
    if (pr >= 0 && pr < 0.3) { cx.fillStyle = "rgba(255,255,255," + (0.75 * (1 - pr / 0.3)).toFixed(3) + ")"; cx.beginPath(); cx.arc(x, ty, R, 0, 6.2832); cx.fill(); }
    var nm = String(curRound().name || "");
    cx.fillStyle = "#fff"; cx.textAlign = "center"; cx.textBaseline = "middle";
    cx.font = "800 " + Math.round(R * 0.6) + "px " + FONT; cx.fillText(nm, x, ty - R * 0.08);
    cx.font = "700 " + Math.max(16, Math.round(R * 0.17)) + "px " + FONT; cx.globalAlpha = al * 0.88;
    if ("letterSpacing" in cx) { cx.letterSpacing = Math.round(R * 0.05) + "px"; cx.fillText("PUSH", x + R * 0.025, ty + R * 0.42); cx.letterSpacing = "0px"; } else cx.fillText("P U S H", x, ty + R * 0.42);
    cx.globalAlpha = 1;
  }
  function drawSpeed() {                               /* 빠를 때 · 통 둘레를 따라 도는 오렌지 꼬리 줄 여섯 */
    var sp = clamp((Math.abs(DRM.w) - 2.4) / (WFAST - 2.4), 0, 1); if (sp <= 0.02) return;
    cx.lineCap = "round"; cx.lineWidth = 6;
    for (var q = 0; q < 6; q++) {
      var a0 = DRM.th * 1.08 + q * 1.0472, len = 0.3 + 0.55 * sp, r = RW + 54 + (q % 2) * 18;
      for (var s2 = 0; s2 < 10; s2++) {
        var a1 = a0 - len * s2 / 10, a2 = a0 - len * (s2 + 1) / 10;
        cx.strokeStyle = "rgba(255,126,49," + (0.7 * sp * (1 - s2 / 10)).toFixed(3) + ")"; cx.beginPath();
        prj(Math.cos(a1) * r, Math.sin(a1) * r, 0); cx.moveTo(PRJ.x, PRJ.y); prj(Math.cos(a2) * r, Math.sin(a2) * r, 0); cx.lineTo(PRJ.x, PRJ.y); cx.stroke();
      }
    }
    cx.lineCap = "butt";
  }
  /* 데모 모드에서만 · 자동 진행(A 또는 ?auto=1 · 서버 · 원격 모드에서는 꺼져 있다) · ?seq=0,5 = 그 등수(0 = 첫 등수)만 차례로 · ?ready= 부저 기다림 초 · ?rev= 공개 머묾 초 */
  var AUTO = { on: Q.has("auto") && CFG.mode === "demo", si: 0, seq: (Q.get("seq") || "").split(",").filter(function (x) { return x !== ""; }).map(Number), ready: +Q.get("ready") || 2.6, rev: +Q.get("rev") || 5 };
  function autoStep() {
    if (!AUTO.on) return;
    var t = sT();
    if (SC === "idle" && t > 0.8) act("next");
    else if (SC === "closed" && t > 1.0) { if (AUTO.seq.length) { ST.round = AUTO.seq[0]; AUTO.si = 1; persist(); } act("next"); }
    else if (SC === "mix" && !NEXTCARD && t > AUTO.ready) act("next");
    else if (SC === "reveal" && t > AUTO.rev + (RK().fan === "l" ? 2.5 : 0)) {
      act("next");
      if (AUTO.seq.length) { if (AUTO.si < AUTO.seq.length) { ST.round = AUTO.seq[AUTO.si++]; persist(); } else AUTO.on = false; }
    }
    else if (SC === "board" && t > 3) act("next");
  }
  var REC = Q.has("rec");

  /* ─────────────── 홍보부 심볼 · 대기(통 자리) · 끝 화면(공이 심볼이 된다) ─────────────── */
  function meBox(s) { s = s || 0.62; return { x: DX - 540 * s, y: DY - 540 * s - 8, s: s }; }
  function axfF() { return T * 30; }
  var ME = { from: null, box: null, idleA: 0 };
  function drawSymbolIdle(alpha) {
    if (alpha <= 0.01 || !window.axfDraw) return;
    var b = meBox(), breathe = 1 + 0.02 * Math.sin(T * 1.25);
    var bb = { x: DX - (DX - b.x) * breathe, y: DY - 8 - (DY - 8 - b.y) * breathe, s: b.s * breathe };
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    window.axfDraw(cx, "me", axfF(), bb, null, alpha);
  }
  function scatterSymbol() {
    if (!window.AXF_DATA) return;
    var K = AXF_DATA.me, A = K.A, D = K.D, n = A.count, b = meBox();
    for (var k = 0; k < n; k += 1) {
      var p = axfSample(A, D, k, axfF(), 0), x = b.x + p[0] * b.s, y = b.y + p[1] * b.s;
      spark(x, y, (rng() - 0.5) * 240, -rng() * 260, 1.0 + rng() * 0.8, p[2] * b.s / 2, k % 9 === 0 ? 1 : 0, 1500, 0.6);
    }
  }
  function drawEnd() {
    var t = sT(), from = ME.from; if (!from || !window.AXF_DATA) return;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    var u0 = 2.4, b = ME.box;
    if (t < u0 + 0.6) {
      cx.fillStyle = C.o; cx.beginPath();
      for (var k = 0; k < from.length; k++) {
        var f = from[k], d = 0.25 * hash(k * 7 + 3) + 0.35 * (f[4] - 100) / 900, u = EIO((t - d) / 1.4);
        var x = f[0] + (f[3] - f[0]) * u, y = f[1] + (f[4] - f[1]) * u, r = f[2] + (38 * b.s / 2 - f[2]) * u;
        x += Math.sin(u * 3.14159) * (hash(k) - 0.5) * 160; y += Math.sin(u * 3.14159) * (hash(k + 9) - 0.5) * 160;
        cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
      }
      cx.globalAlpha = t < u0 ? 1 : 1 - (t - u0) / 0.6; cx.fill(); cx.globalAlpha = 1;
    }
    if (t > u0) window.axfDraw(cx, "me", axfF(), b, null, clamp((t - u0) / 0.6, 0, 1));
  }
  /* 등수 카드 · 오렌지 스테이지 + 흰 점 고리(홍보부 02 Circle 원본) 왼쪽에 잘려 걸린다 */
  var CARDC = null;
  var CARD_CX = 600, CARD_CY = 560, CARD_RR = 410;
  function drawCardObject() {
    if (!window.AXF_DATA) return;
    var a = clamp(sT() / 0.5, 0, 1);
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    if (!CARDC) {
      var K = AXF_DATA.circle, sx = 0, sy = 0, n = K.A.count, pts = [];
      for (var i = 0; i < n; i++) { var q = axfSample(K.A, K.D, i, 0, 0); pts.push(q); sx += q[0]; sy += q[1]; }
      sx /= n; sy /= n; CARDC = { x: sx, y: sy, r: Math.hypot(pts[0][0] - sx, pts[0][1] - sy) };
    }
    var s = CARD_RR / CARDC.r;                         /* 4차 · 사진 원(#kPic 중심 600, 560 · 반지름 300)과 같은 중심 · 점 원 반지름 410 */
    window.axfDraw(cx, "circle", axfF() * 0.6, { x: CARD_CX - CARDC.x * s, y: CARD_CY - CARDC.y * s, s: s }, [C.w, "#FFE3D2", C.o25], a);
  }

  /* ─────────────── 점 입자 · 팡 · 고리 ─────────────── */
  var PMAX = 6000, pn = 0;
  var qx = new Float32Array(PMAX), qy = new Float32Array(PMAX), qvx = new Float32Array(PMAX), qvy = new Float32Array(PMAX);
  var qlife = new Float32Array(PMAX), qmax = new Float32Array(PMAX), qsz = new Float32Array(PMAX), qgr = new Float32Array(PMAX), qdr = new Float32Array(PMAX), qcol = new Uint8Array(PMAX);
  var PCOL = [C.o, C.hi, C.o25, C.w];
  function spark(x, y, vx, vy, life, size, col, grav, drag) {
    if (pn >= PMAX) return;
    var i = pn++;
    qx[i] = x; qy[i] = y; qvx[i] = vx; qvy[i] = vy; qlife[i] = 0; qmax[i] = life; qsz[i] = size; qcol[i] = col; qgr[i] = grav || 0; qdr[i] = drag == null ? 1.6 : drag;
  }
  function stepParticles(dt) {
    for (var i = 0; i < pn; i++) {
      qlife[i] += dt;
      if (qlife[i] >= qmax[i]) { pn--; if (i < pn) { qx[i] = qx[pn]; qy[i] = qy[pn]; qvx[i] = qvx[pn]; qvy[i] = qvy[pn]; qlife[i] = qlife[pn]; qmax[i] = qmax[pn]; qsz[i] = qsz[pn]; qcol[i] = qcol[pn]; qgr[i] = qgr[pn]; qdr[i] = qdr[pn]; } i--; continue; }
      var k = Math.exp(-qdr[i] * dt);
      qvx[i] *= k; qvy[i] = qvy[i] * k + qgr[i] * dt;
      qx[i] += qvx[i] * dt; qy[i] += qvy[i] * dt;
    }
  }
  /* 5차 · 숫자 칸은 비운다(색종이 · 점 팡 · 고리가 번호 위를 지나가지 않는다 · 모든 등수) */
  var DZ = [];
  function digitZones() {
    DZ.length = 0;
    if (!REEL.on || !REEL.cells || !LAY.cells || (SC !== "exit" && SC !== "reveal")) return;
    var s = LAY.s, hw = (PANW / 2 + 24) * s, ht = (CELLH / 2 + 50) * s;
    for (var j = 0; j < REEL.cells.length && j < LAY.cells.length; j++) { var L = LAY.cells[j]; DZ.push(L.x - hw, L.y - ht, L.x + hw, L.y + ht); }
  }
  function inDZ(x, y, r) { for (var z = 0; z < DZ.length; z += 4) if (x + r > DZ[z] && x - r < DZ[z + 2] && y + r > DZ[z + 1] && y - r < DZ[z + 3]) return true; return false; }
  function drawParticles() {
    if (!pn) return;
    digitZones();
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    for (var c = 0; c < PCOL.length; c++) {
      cx.fillStyle = PCOL[c]; cx.beginPath();
      for (var i = 0; i < pn; i++) {
        if (qcol[i] !== c) continue;
        var u = qlife[i] / qmax[i], r = qsz[i] * (u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3);
        if (r < 0.3) continue;
        if (DZ.length && inDZ(qx[i], qy[i], r)) continue;
        cx.moveTo(qx[i] + r, qy[i]); cx.arc(qx[i], qy[i], r, 0, 6.2832);
      }
      cx.fill();
    }
  }
  function burst(x, y) {                               /* 당첨 공개 · 점 팡(drum.js 와 같은 양 · 성능 단계에서 줄인다) */
    var n = Math.round(380 * TQ().pm);
    for (var k = 0; k < n; k++) { var a = rng() * 6.2832, s = 300 + rng() * 1500; spark(x, y, Math.cos(a) * s, Math.sin(a) * s - 300, 1.4 + rng() * 1.4, 3 + rng() * 8, 3, 800, 1.5); }
    ring(x, y, Math.round(72 * Math.max(0.5, TQ().pm)), 1500, 7, 1.0);
  }
  function ring(x, y, n, sp, r, life, r0) { r0 = r0 == null ? 200 : r0; for (var k = 0; k < n; k++) { var a = k / n * 6.2832; spark(x + Math.cos(a) * r0, y + Math.sin(a) * r0, Math.cos(a) * sp, Math.sin(a) * sp, life, r, 3, 0, 2.2); } }

  /* ─────────────── 인트로 영상(힉스필드 · 처음 한 번) ─────────────── */
  var VID = {};
  function vid(name) {
    if (!VID[name]) { var el = document.getElementById("vIntro"); VID[name] = { el: el, on: false, t0: 0, ok: !!el }; if (el) el.addEventListener("error", function () { VID[name].ok = false; }); }
    return VID[name];
  }
  function vidStart(name) {
    var v = vid(name); if (!v.el || !v.ok) return false;
    v.on = true; v.t0 = T; v.cut = 0;
    try { v.el.currentTime = 0; var pr = v.el.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
    return true;
  }
  function vidCut(name) { var v = vid(name); if (v.on && !v.cut) v.cut = T; }
  function vidStop(name) { var v = vid(name); v.on = false; if (v.el) { v.el.style.opacity = 0; try { v.el.pause(); } catch (e) {} } }
  function stepVideos() {
    for (var k in VID) {
      var v = VID[k]; if (!v.on) continue;
      var t = T - v.t0, dur = (v.el.duration && isFinite(v.el.duration)) ? v.el.duration : 5;
      var op = clamp(t / 0.3, 0, 1) * clamp((dur - 0.1 - t) / 0.6, 0, 1);
      if (v.cut) op *= clamp(1 - (T - v.cut) / 0.3, 0, 1);
      v.el.style.opacity = op.toFixed(3);
      if (t >= dur - 0.1 || (v.cut && T - v.cut >= 0.3)) { vidStop(k); if (SC === "intro") introDone(); }
    }
  }

  /* ─────────────── 진행 ─────────────── */
  var T = 0, sceneT0 = 0, SC = ST.scene === "idle" ? "idle" : "restore";
  var busyUntil = 0, confirmKey = null, confirmT = 0, NEXTCARD = 0;
  var NOCKMIX = 10, MIXT = 0, MIXSKIP = false, MIXSKIPAT = 0, MINMIX = 10;
  var LOAD = { q: 0, t: 0, lastT: -9 };
  var PAWL = { k: 0, last: 0, snd: 0, air: -1 }, GATE = { v: 0, tgt: 0, t0: 0 };
  var SLOW = { t0: 0, D: 4, th0: 0, w0: 0, trav: 0, kp: 1.8, heart: 0 };
  var DRAW = { k: 1, stopT: -1, t0: 0 };
  var WB = [], EXP = { ph: "" };
  var LAY = { K: 1, cols: 1, rows: 1, s: 1, cells: [], br: 250, ph: 382 };
  var REEL = { on: false, t0: 0, cells: [] };
  var EXGAP = 0.5;
  function scene(s) { if (s !== "spin" && s !== "tension" && s !== "exit") ROLL.stop(); if (s !== "reveal") ROLL.hush(); SC = s; sceneT0 = T; ST.scene = s === "restore" ? ST.scene : s; document.body.dataset.scene = s; persist(); uiScene(); scrPush(true); }
  function sT() { return T - sceneT0; }
  function rounds() { return CFG.rounds && CFG.rounds.length ? CFG.rounds : DEF.rounds; }
  function curRound() { return rounds()[Math.min(ST.round, rounds().length - 1)]; }
  function inBatch(id) { return !!(ST.batch && ST.batch.length && ST.batch.indexOf(String(id)) >= 0); }
  function resById(id) { for (var k = ST.results.length - 1; k >= 0; k--) if (ST.results[k].id === id) return ST.results[k]; return null; }
  function roundWins(ri, shown) { return ST.results.filter(function (r) { return r.round === ri && r.st === "win" && !(shown && inBatch(r.id)); }); }
  function lock(sec) { busyUntil = T + sec; }

  /* 추첨 준비 · 그 순간까지의 행운권이 추첨 대상(ST.arrived) · 공은 섞은 행운권 중 대표 BALLN 장만(ST.rep · 옛 화면도 이 목록으로 통을 다시 채운다) */
  function nockQueue() {
    if (!ST.pool) return;
    var seen = {}; ST.arrived.forEach(function (pk) { seen[pk] = 1; });
    var fresh = ST.pool.order.filter(function (pk) { return !seen[pk] && !ST.out[pk]; });
    if (!fresh.length) { if (ST.big == null) { ST.big = false; ST.repN = 0; persist(); } return; }
    var tk = [];
    fresh.forEach(function (pk) { (ST.pool.people[pk].nos || []).forEach(function (no) { tk.push([pk, no]); }); });
    if (ST.big == null) { ST.big = tk.length > BALLN; ST.repN = 0; }
    cryptoShuffle(tk);
    var take = tk.slice(0, Math.max(0, Math.min(NB, BALLN) - (ST.repN || 0)));
    ST.rep = ST.rep || {};
    take.forEach(function (x) { (ST.rep[x[0]] || (ST.rep[x[0]] = [])).push(x[1]); });
    ST.repN = (ST.repN || 0) + take.length;
    if (ST.big !== true && ST.repN >= BALLN) ST.big = true;
    LOAD.q += take.length;
    fresh.forEach(function (pk) { ST.arrived.push(pk); });
    persist(); uiPool();
  }
  function stepLoad() {
    if (LOAD.q <= 0 || T < LOAD.t) return;
    if (NIN >= NB) { LOAD.q = 0; return; }
    spawnBall(NIN++); LOAD.q--; LOAD.t = T + 0.022; LOAD.lastT = T;
  }
  /* 추첨 대상 행운권 전체(넣은 사람 · 당첨 · 부재로 빠진 분 제외 · 이미 당첨된 번호 제외) */
  function bigTickets() {
    var won = {}, out = [];
    ST.results.forEach(function (r) { if (r.st === "win") won[r.no] = 1; });
    ST.arrived.forEach(function (pk) { if (ST.out[pk]) return; var p = ST.pool && ST.pool.people[pk]; if (p) p.nos.forEach(function (no) { if (!won[no]) out.push([pk, no]); }); });
    return out;
  }
  /* 한 번의 뽑기 · k 장 · 1인 1회(한 장을 뽑으면 그분의 나머지 번호는 이번 뽑기에서도 뺀다) · 암호 난수 */
  function pickBatch(k) {
    var tk = bigTickets(), n0 = tk.length, out = [];
    while (out.length < k && tk.length) {
      var x = tk[Math.floor(cryptoUnits(1)[0] * tk.length)];
      out.push({ pk: x[0], no: x[1] });
      tk = tk.filter(function (t) { return t[0] !== x[0]; });
    }
    return { list: out, n: n0 };
  }
  function nockLoading() { return SC === "checkin" && (ST.big == null || LOAD.q > 0); }
  function stepArrivals() {
    if (SC !== "checkin") return;
    if (CFG.mode === "server" && !ST.pool && !SRV.loading && T > (SRV.retryT || 0)) { SRV.retryT = T + 5; serverLoad(function () {}); }
    if (!ST.closed && ST.big != null && LOAD.q <= 0 && T - LOAD.lastT > 1.2 && sT() > 2.5) closeCheckin();
  }
  /* 복원 · 통 안에 넣었던 대표 공 수 − 지금까지 나온 공(당첨 수) */
  function rebuildBalls() {
    for (var i = 0; i < NB; i++) live_[i] = 0;
    var wins = ST.results.filter(function (r) { return r.st === "win"; }).length;
    var n = clamp(Math.min(ST.repN || 0, NB) - wins, 0, NB);
    if (!ST.arrived.length) n = 0;
    for (i = 0; i < n; i++) settleBall(i);
    NIN = Math.min(NB, ST.repN || 0);
    for (var k = 0; k < 120; k++) physStep(1 / 240);
  }

  /* ── 행동 · 키보드 · 조작 창 · 원격 콘솔이 같은 명령(runCmd)을 쓴다 ── */
  var wake = null;
  function keepAwake() { try { if (!wake && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; w.addEventListener("release", function () { wake = null; }); }).catch(function () {}); } catch (e) {} }
  var KEYSRC = false;
  function act(cmd, arg) {
    keepAwake();
    SFX.ensure();   /* 소리 준비(처음 한 번 0.2초 안팎) · F(전체 화면) 같은 첫 키에서 미리 끝내 첫 「다음」이 멈칫하지 않게 */
    switch (cmd) {
      case "mute": SFX.ensure(); SFX.mute(SFX.on); toast(SFX.on ? "소리 켬" : "소리 끔"); pushCtl(); return;
      case "fs": if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen && document.exitFullscreen(); return;
      case "help": document.body.classList.toggle("help-on"); uiHelp(); return;
      case "hud": document.body.classList.toggle("hud-on"); return;
      case "ctl": openControl(); return;
      case "auto": if (CFG.mode !== "demo") return; AUTO.on = !AUTO.on; toast(AUTO.on ? "자동 진행 켬" : "자동 진행 끔", true); return;
    }
    SFX.ensure();
    KEYSRC = true;
    try { actRun(cmd, arg); } finally { KEYSRC = false; }
    uiHelp(); scrPush(true);
  }
  function actRun(cmd, arg) {
    switch (cmd) {
      case "next": return runNext();
      case "skipmix": if (canSkipMix() && !(T < busyUntil)) skipMix(); return;
      case "redraw": return twice("redraw", "한 번 더 누르면 부재 처리 후 다시 뽑습니다", function () { keyRun("absent", ST.pending || ""); });
      case "undo": return twice("undo", "한 번 더 누르면 마지막 당첨을 취소합니다", function () { keyRun("undo"); });
      case "end": return twice("end", "한 번 더 누르면 끝 화면으로 갑니다", function () { keyRun("end"); });
      case "idle": return twice("idle", "한 번 더 누르면 대기 화면으로 갑니다", function () { keyRun("idle"); });
      case "classic": return twice("classic", "한 번 더 누르면 옛 화면(유리 통)으로 바꿉니다 · 기록은 이어집니다", goClassic);
    }
    if (remote()) return;   /* 아래는 로컬 · 데모 시험용 */
    if (T < busyUntil && cmd !== "reset" && cmd !== "reload") return;
    switch (cmd) {
      case "round": if (SC === "mix" || SC === "card") { var ri = +arg; if (ri >= 0 && ri < rounds().length) { ST.round = ri; goCard(); } } return;
      case "intro":
        if (SC !== "idle") return;
        if (ST.introDone) return twice("intro", "인트로는 이미 재생했습니다 · 한 번 더 누르면 다시 재생합니다", function () { playIntro(false); });
        return playIntro(false);
      case "reset": resetAll(); return;
      case "reload": if (CFG.mode === "server") serverLoad(function () { pushCtl(); }); return;
    }
  }
  function goClassic() { var q = new URLSearchParams(location.search); q.set("classic", "1"); location.href = "index.html?" + q.toString(); }
  /* 다음 동작 하나 · Space 와 콘솔 「추첨 › 진행」 큰 버튼이 같은 순서(콘솔 dcNext 와 같은 표) */
  function nextCmd() {
    if (SC === "end") return { c: "", n: "끝 · 모든 순서를 마쳤습니다" };
    if (T < busyUntil || NEXTCARD) return { c: "", n: "잠시만" };
    switch (SC) {
      case "intro": return { c: "skip", n: "인트로 건너뛰기" };
      case "idle": return { c: cmdWhy("intro", "") ? "checkin" : "intro", n: "추첨 준비 · 공 넣기" };
      case "checkin": return { c: "", n: "공을 넣는 중 · 다 넣으면 준비 끝" };
      case "closed": return { c: "round", n: curRound().name + " 추첨 시작" };
      case "card": return { c: "mix", n: "부저 화면(3초 뒤 저절로)" };
      case "mix": return { c: "draw", n: "부저 · " + curRound().name + " 뽑기" };
      case "spin": case "tension": case "exit": return { c: "", n: "뽑는 중" };
      case "reveal": return { c: "confirm", n: "확정", arg: ST.pending || "" };
      case "board": return CFG.mode === "server" && SRV.finOn ? { c: "fin", n: "완주 경품 추첨 발표" } : { c: "end", n: "끝 화면" };
      case "fin": return { c: "end", n: "끝 화면" };
    }
    return { c: "", n: "끝" };
  }
  function runNext() {
    var nx = nextCmd();
    if (!nx.c) { if (nx.n !== "잠시만") toast(nx.n, true); return; }
    if (nx.c === "skip") { if (SC === "intro") { vidCut("intro"); lock(0.5); } else if (canSkipMix()) skipMix(); return; }
    if (nx.c === "fin") return finFromServer();
    keyRun(nx.c, nx.arg);
  }
  var WHY_TXT = { busy: "", scene: "지금 장면에서는 할 수 없습니다", drawing: "뽑는 중입니다", same: "", done: "", notclosed: "추첨 준비가 먼저입니다", round: "없는 등수입니다",
    loading: "공을 넣는 중입니다", full: "", empty: "남은 행운권이 없습니다", none: "", id: "다른 당첨입니다", arg: "완주 경품 추첨 숫자가 없습니다", unknown: "모르는 명령입니다", error: "오류" };
  function keyRun(c, arg) {
    var why = runCmd(c, arg == null ? "" : String(arg));
    if (!why) return;
    var w = String(why).split(":"), t = w[0] === "mixing" ? "섞는 중 · " + w[1] + "초 뒤 뽑기" : WHY_TXT[w[0]];
    if (t) toast(t, true);
  }
  var FINREQ = false;
  function finFromServer() {
    if (CFG.mode !== "server" || !sessionKey()) { toast("완주 경품 추첨 발표는 서버에 연결된 화면에서만", true); return; }
    if (FINREQ) return;
    FINREQ = true; toast("완주 경품 추첨 결과를 받는 중", true);
    jsonp("draw_cmd", { cmd: "fin", arg: "", rid: "k" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36) }, function (res) {
      FINREQ = false;
      KEYSRC = true;
      try {
        if (res && res.ok && res.cmd === "fin") remoteCmd(res.cmd, res.arg, res.seq, "srv");
        else toast(res && res.reason === "fin" ? "완주 경품 추첨 전입니다 · 콘솔 「완주 경품 추첨」에서 먼저 추첨" : "보내지 못했습니다 · " + (res && (res.reason || res.err) || "응답 없음"), true);
      } finally { KEYSRC = false; }
      uiHelp();
    });
  }
  /* 첫 추첨 최소 섞기(10초) · Space = 건너뛰기(추첨은 시작하지 않는다) */
  function canSkipMix() { return false; }   /* 부저 데모 · 최소 섞기 없음(당첨은 행운권 전체에서 암호 난수라 섞은 시간과 무관 · Space 는 언제나 부저) */
  function drawingNow() { return SC === "spin" || SC === "tension" || SC === "exit"; }
  var mixSkipUntil = 0;
  function skipMix() {
    MIXSKIPAT = +MIXT.toFixed(1); MIXT = MINMIX; MIXSKIP = true;
    var el = $("mixSkip"); if (el) { el.textContent = "섞기 건너뜀 · " + MIXSKIPAT + "초"; fade(el, 1, 0.2); mixSkipUntil = T + 1.8; }
    if (remote()) { CMD.msg = "섞기 건너뜀"; pushCtl("섞기 건너뜀"); }
    scrPush(true);
  }
  var INTRO_NEXT = false;
  function playIntro(thenCheckin) {
    if (!vidStart("intro")) { if (thenCheckin) startCheckin(); return; }
    ST.introDone = true; INTRO_NEXT = !!thenCheckin; persist();
    scene("intro"); lock(1);                         /* 4차 · 인트로는 소리 없음 */
  }
  function introDone() {
    if (INTRO_NEXT) { INTRO_NEXT = false; scene("idle"); startCheckin(); }
    else { scene("idle"); lock(0.4); }
  }
  function twice(k, msg, fn) {
    if (confirmKey === k && T - confirmT < 2.5) { confirmKey = null; toast(""); fn(); return; }
    confirmKey = k; confirmT = T; toast(msg);
  }
  function startCheckin() {
    if (CFG.mode === "demo" && (!ST.pool || ST.pool.kind !== "demo")) ST.pool = demoPool(CFG.demoN, ST.seed, CFG.demoT);
    if (CFG.mode === "server" && !ST.pool) serverLoad(function () { pushCtl(); });
    scatterSymbol();
    if (!ST.ckAt) { ST.ckAt = Date.now(); persist(); }
    DRM.mode = "spin"; DRM.tgt = WSLOW; scene("checkin"); lock(0.6);
    if (SRV.polling) { clearInterval(SRV.polling); SRV.polling = null; }
    nockQueue();
    if (CFG.mode === "server" && SRV.hasPool) serverLoad(function () {});   /* 그사이 생긴 번호까지 한 번 더 · 그 뒤로는 읽지 않는다 */
  }
  function closeCheckin() {
    if (SC !== "checkin") return;
    MIXT = 0; MIXSKIP = false; MIXSKIPAT = 0; MINMIX = NOCKMIX;
    ST.ckMin = ST.ckAt ? (Date.now() - ST.ckAt) / 60000 : 0;
    ST.closed = true; if (SRV.polling) { clearInterval(SRV.polling); SRV.polling = null; }
    if (CFG.mode === "server") jsonp("draw_cfg", { closed: 1 }, function (res) { SRV.closeStatus = res && res.ok ? (res.closed ? "서버 체크인 닫힘" : "서버가 닫기를 아직 모름 · 화면만 마감") : "서버 닫기 실패 · 화면만 마감"; pushCtl(); });
    scene("closed"); lock(0.8);
  }
  function goCard() {
    stageTo("orange", DX, DY, 0.7); scene("card"); lock(0.8);
  }
  function goMix() {   /* 부저 화면 · 통이 가운데에서 천천히 돌고 그 앞에 부저 */
    stageTo("black", 960, 540, 0.6); DRM.mode = "spin"; if (CAMD.a < 0.1) CAMD.ox = OXC; scene("mix"); lock(0.45);
  }
  /* 부저 = 뽑기 · Space(또는 콘솔 「추첨」) 한 번 · 누르는 즉시(지연 0) 부저가 눌리고 통이 빨라진다
   *   당첨은 여기서 정하지 않는다 · 지금처럼 문이 열리는 순간(startExit) 행운권 전체에서 암호 난수 · 여러 번 눌러도 lock(99) 로 한 번만 */
  function draw() {
    if (LOAD.q > 0) return "loading";
    var r = curRound(), left = r.count - roundWins(ST.round).length;
    if (left <= 0) return "full";
    if (!bigTickets().length) return "empty";
    var P = RK();
    BZ.press = T; SHK.t0 = T; SHK.amp = 8;
    ROLL.press(); ROLL.start(0.16, P.fan === "l" ? 1.19 : 1); ROLL.to(0.32, SPINUP + P.hold);   /* 6차 · 1등만 롤 +1.5dB */   /* 4차 · 짧은 쿵 → 낮은 롤이 작게 시작 */
    clearTimeout(bzTipT); fade($("mixSkip"), 0, 0.2);
    burstBuzzer();
    DRM.mode = "spin"; DRAW.k = left; DRAW.stopT = -1; DRAW.t0 = T; SPIN.t0 = T; SPIN.hold = P.hold;
    ST.drawing = 1; persist();
    scene("spin"); lock(99);
    return "";
  }
  /* 최고 속도 유지가 끝나면 감속 · 출구가 6시에 서도록 등수별 창(dec) 안에서 감속 길이를 고른다(통의 각도만 맞춘다 · 당첨과 무관) */
  function beginDecel() {
    var P = RK(), w0 = Math.max(DRM.w, 1), need = angN(-(DRM.th + GATE0)), D = 0, kp = 1.6, m = 0, ok = false, KPS = [1.6, 1.3, 2.0, 1.0, 2.5], lo = P.dec[0], hi = P.dec[1];
    for (var a = 0; a < KPS.length && !ok; a++) for (m = 0; m < 8; m++) { kp = KPS[a]; D = (need + m * 6.2832) * (kp + 1) / w0; if (D >= lo && D <= hi) { ok = true; break; } if (D > hi) break; }
    if (!ok) { kp = 1.6; m = 0; while ((need + m * 6.2832) * (kp + 1) / w0 < lo) m++; D = (need + m * 6.2832) * (kp + 1) / w0; }
    SLOW.kp = kp; SLOW.t0 = T; SLOW.D = D; SLOW.th0 = DRM.th; SLOW.w0 = w0; SLOW.trav = need + m * 6.2832; SLOW.heart = T + D * 0.55;
    DRM.mode = "slow";
    ROLL.to(0.55, D);                                 /* 감속을 따라 롤이 부푼다 */
    scene("tension"); lock(99);
  }
  function stepDrum(dt) {
    if (DRM.mode === "spin") {
      DRM.w += (DRM.tgt - DRM.w) * (1 - Math.exp(-dt * (SC === "spin" ? 2.8 : 1.6)));   /* 부저 뒤 1초 안에 최고 속도 가까이 */
      DRM.th += DRM.w * dt;
    } else if (DRM.mode === "slow") {
      var u = clamp((T - SLOW.t0) / SLOW.D, 0, 1), kp = SLOW.kp;
      DRM.th = SLOW.th0 + SLOW.trav * (1 - Math.pow(1 - u, kp + 1));
      DRM.w = SLOW.w0 * Math.pow(1 - u, kp);
      if (u >= 1) { DRM.mode = "rock"; DRM.r0 = T; DRM.base = DRM.th; DRM.w = 0; DRAW.stopT = T; }
    } else if (DRM.mode === "rock") {
      var t = T - DRM.r0, nth = DRM.base + 0.045 * Math.exp(-t * 4.5) * Math.sin(t * 13);
      DRM.w = (nth - DRM.th) / Math.max(dt, 1e-3); DRM.th = nth;
      if (t > 1.2) { DRM.mode = "hold"; DRM.w = 0; DRM.th = DRM.base; }
    }
    var tk = Math.floor(DRM.th / (6.2832 / NPEG));
    if (tk !== PAWL.last) {
      PAWL.last = tk; PAWL.k = 1;
    }
    PAWL.k = Math.max(0, PAWL.k - dt * 9);
  }
  /* 문이 열리는 순간 · 이번 등수 남은 인원 K 명을 행운권 전체에서 한꺼번에 정하고 이 기기에 저장(서버 기록은 공개 순간) */
  function startExit() {
    var pb = pickBatch(DRAW.k);
    if (!pb.list.length) { ST.drawing = 0; DRM.mode = "spin"; DRM.w = 0.5; DRM.tgt = WMIX; scene("mix"); lock(0.6); toast("남은 행운권이 없습니다", true); return; }
    var r = curRound(), base = roundWins(ST.round).length, now = new Date().toISOString(), ids = [], stamp = Date.now().toString(36);
    pb.list.forEach(function (x, j) {
      var pp = ST.pool && ST.pool.people[x.pk] || {};
      var res = { id: "r" + stamp + j + Math.floor(rng() * 1e4), round: ST.round, slot: base + j + 1, no: x.no, pk: x.pk, nm: pp.nm || "", dp: pp.dp || "", prize: r.prize, rname: r.name,
        at: now, st: "win", pool: pb.n, big: 1, q: 1, sec: +(T - DRAW.t0).toFixed(2) };
      if (MIXSKIP && !ST.results.length) { res.mskip = 1; res.mixed = MIXSKIPAT; }
      ST.results.push(res); ids.push(res.id);
      if (CFG.onePerPerson) ST.out[res.pk] = "win";
    });
    ST.batch = ids; ST.pending = ids[ids.length - 1]; ST.drawing = 0; persist();
    whoFetch();                                       /* 261008 실명 · 부서 · 번호 릴이 도는 동안 받아 둔다 */
    layout(ids.length);
    WB = ids.map(function (id, j) { return { id: id, no: resById(id).no, i: -1, ph: "wait", t0: 0, cell: j }; });
    EXOX = CAMD.ox; EXK = CAMD.k; EXOY = CAMD.oy; GATE.tgt = 1; GATE.t0 = T; ROLL.to(0.68, 2.2);
    EXP.ph = "out"; scene("exit"); lock(99);
  }
  /* 칸 배치 · 3명까지 한 줄 · 4명부터 두 줄 · s = 1명 기준 대비 배율(drum.js 그대로) */
  var CELLW = 232, CELLH = 330, DSTEP = 15, DOTR = 7.0, GAPX = 28, PANW = 4 * 232 + 3 * 28, PANH = 330 + 52;
  function layout(K) {
    var cols = K <= 3 ? K : Math.ceil(K / 2), rows = K <= 3 ? 1 : 2;
    var pw = K > 1 ? PANW + 28 : PANW, ph = K > 1 ? PANH + 28 : PANH;
    var s = Math.min(1, (1800 / cols - (K > 1 ? 70 : 50)) / pw, rows === 1 ? 1 : 230 / ph);
    var ys = rows === 1 ? [K === 1 ? 540 : 560] : [415, 788], cells = [];   /* 261008 이름 + 부서 두 줄 자리 · 두 줄 배치 = 위 415 · 아래 788 · 가운데 가로 선 660 */
    for (var j = 0; j < K; j++) {
      var row = rows === 1 ? 0 : (j < cols ? 0 : 1), inRow = rows === 1 ? K : (row ? K - cols : cols), col = row ? j - cols : j;
      cells.push({ x: 960 + (col - (inRow - 1) / 2) * (1800 / cols), y: ys[row] });
    }
    LAY = { K: K, cols: cols, rows: rows, s: s, cells: cells, br: clamp(260 * s, 110, 250), ph: ph, ym: 660, cw: Math.round(Math.min(1440, 1800 / cols - 48)) };
  }
  function grpY() { return LAY.rows === 1 ? 560 : 608; }
  var YB = 0;
  function stepExit(dt) {
    GATE.v += (GATE.tgt - GATE.v) * (1 - Math.exp(-dt * 10));
    if (EXP.ph !== "out" && EXP.ph !== "fly") return;
    YB = RW + 30 - RB * 0.2;
    var last = WB.length - 1;
    for (var k = 0; k < WB.length; k++) {
      var b = WB[k];
      if (b.ph === "wait" && T >= GATE.t0 + 0.32 + k * EXGAP) {
        var best = -1, bd = 1e9, i;
        for (i = 0; i < NB; i++) if (live_[i]) { var d = Math.hypot(px_[i], py_[i] - RW, pz_[i] * 1.4); if (d < bd) { bd = d; best = i; } }
        if (best < 0) {                               /* 통이 비었으면(작은 시험 풀) 빈 칸 하나를 출구 앞에 둔다 */
          for (i = 0; i < NB && best < 0; i++) { var used = false; for (var q = 0; q < WB.length; q++) if (WB[q].i === i) used = true; if (!used) best = i; }
          px_[best] = 0; py_[best] = RW - RB - 4; pz_[best] = 0;
        }
        b.i = best; b.ph = "inside"; b.t0 = T; b.sx = px_[best]; b.sy = py_[best]; b.sz = pz_[best]; live_[best] = 0;
      }
      var j = b.i;
      if (b.ph === "inside") {
        var e = EIO((T - b.t0) / 0.42);
        px_[j] = b.sx * (1 - e); py_[j] = b.sy + (RW + 6 - b.sy) * e; pz_[j] = b.sz * (1 - e); ba_[j] += dt * 9;
        if (T - b.t0 >= 0.42) { b.ph = "drop"; b.t0 = T; }
      } else if (b.ph === "drop") {
        var t2 = T - b.t0, hb = Math.abs(Math.sin(Math.min(t2, 0.5) / 0.5 * Math.PI)) * 26 * Math.max(0, 1 - t2 / 0.5);
        py_[j] = Math.min(YB, RW + 6 + 0.5 * G * t2 * t2); if (py_[j] >= YB) py_[j] = YB - hb; ba_[j] += dt * 6;
        if (t2 > 0.5 || (k < last && WB[k + 1].ph === "drop")) {
          b.ph = "fly"; b.t0 = T;
          prj(0, py_[j], 0); b.fx0 = DX + CAMD.k * (PRJ.x - DX) + CAMD.ox; b.fy0 = DY + RW + CAMD.k * (PRJ.y - DY - RW) + CAMD.oy; b.fr0 = RB * PRJ.s * CAMD.k; b.a0 = ba_[j]; b.X = b.fx0; b.Y = b.fy0; b.Rr = b.fr0; b.ang = b.a0;
          if (k === 0) fade($("side"), 0, 0.3);
          if (k === last) { GATE.tgt = 0; EXP.ph = "fly"; }
        }
      } else if (b.ph === "fly") {
        var u = clamp((T - b.t0) / 1.15, 0, 1), e2 = EIO(u), c = LAY.cells[b.cell];
        b.X = b.fx0 + (c.x - b.fx0) * e2; b.Y = b.fy0 + (c.y - b.fy0) * e2 - Math.sin(u * Math.PI) * 60;
        b.Rr = b.fr0 + (LAY.br - b.fr0) * Math.pow(e2, 1.4); b.ang = b.a0 + (1 - Math.pow(1 - u, 3)) * 14;
        if (u >= 1) { b.ph = "set"; b.ang = 0; b.ts = T; }
      } else if (b.ph === "set") {
        var c2 = LAY.cells[b.cell]; b.X = c2.x; b.Y = c2.y + Math.sin((T - b.ts) * 3.2) * 6 * (1 - Math.exp(-(T - b.ts) * 3));
      }
    }
    if (EXP.ph === "fly") {
      var lb = WB[last], uu = clamp((T - lb.t0) / 1.15, 0, 1), ee = EIO(uu);
      CAMD.k = EXK + (1.5 - EXK) * ee; CAMD.oy = EXOY + (-560 - EXOY) * ee; CAMD.ox = EXOX > 100 ? EXOX : -120 * ee; CAMD.a = 1 - EO(uu * 2.2);
      if (lb.ph === "set") { EXP.ph = "open"; REEL.on = true; REEL.t0 = T + 0.25; planReels(); uiRevealPrep(); ROLL.to(1, 0.25 + REEL.cells[REEL.cells.length - 1].stops[3]); }   /* 진짜 멈출 때 가장 크다 · 멈칫 동안에도 롤은 이어진다 */
    }
  }
  /* 번호 릴(부저 데모) · 칸 j 는 0.4j 초씩 늦게(4명부터 0.3j) · 앞 세 자리는 빠르게 차례로 · 끝자리는 마지막 칸만 등수별로 더 길게 감속(RKP fin.fs · 6차)
   *   감속은 연속 회전에서 부드럽게(튐 · 멈칫 · 되돌아옴 없음) · 확정 소리 · 오렌지 · 이름은 진짜 멈춘 뒤에만 */
  var EXOX = 0, EXK = 1, EXOY = 0;
  function planReels() {
    var K = WB.length, F = RK().fin, gap = K > 3 ? 0.3 : 0.4;
    REEL.cells = WB.map(function (b, j) {
      var d = String(b.no).replace(/\D/g, "").slice(-4); d = ("0000" + d).slice(-4).split("").map(Number);
      var o = j * gap, fin = j === K - 1;
      var c = { digits: d, stops: [0.8 + o, 1.15 + o, 1.5 + o, 2.0 + o], slow: [0.45, 0.45, 0.45, 0.5], ep: [3, 3, 3, 3], spd: [13, 14, 15, 16], pos: [0, 0, 0, 0], done: [0, 0, 0, 0], last: [-1, -1, -1, -1], fin: fin, fake: -1 };
      if (fin) { c.slow[3] = F.fs; c.stops[3] = 1.6 + o + F.fs; c.ep[3] = 2; }   /* 6차 · 마지막 칸 일의 자리 = 같은 속도로 돌다 fs 초 동안 마찰 감속(2차 곡선)으로 선다 */
      for (var k = 0; k < 4; k++) { var ts = c.stops[k] - c.slow[k]; c.pos[k] = d[k] - c.spd[k] * ts - c.spd[k] * c.slow[k] / c.ep[k]; }
      return c;
    });
  }
  /* 자리 위치 · 같은 속도로 돌다가 감속 창(slow) 동안 ease-out(ep 3 = 3차 · 2 = 마찰 같은 2차)으로 속도가 0 이 되며 정확히 그 숫자에 선다 · 6차 · 선 뒤 흔들림 없음 */
  function reelPos(c, k, t) {
    var stop = c.stops[k], spd = c.spd[k], slowL = c.slow[k], ts = stop - slowL, ep = c.ep ? c.ep[k] : 3;
    if (t < ts) return c.pos[k] + spd * t;
    var pS = c.pos[k] + spd * ts, A = spd * slowL / ep, u = clamp((t - ts) / slowL, 0, 1);
    return pS + A * (1 - Math.pow(1 - u, ep));
  }
  function stepReels() {
    if (!REEL.on || SC !== "exit") return;
    var t = T - REEL.t0;
    REEL.cells.forEach(function (c, j) {
      for (var k = 0; k < 4; k++) {
        var cell = Math.floor(reelPos(c, k, Math.max(0, t)) + 0.5);
        if (t > 0 && cell !== c.last[k]) { c.last[k] = cell; }
        if (!c.done[k] && t >= c.stops[k]) {
          c.done[k] = 1;
          if (c.fin && k === 3) reveal();               /* 3차 · 칸 · 자리마다 멈추는 소리 없음 · 롤이 이어지다 마지막 칸에서 쾅 */
        }
      }
    });
    if (EXP.ph === "open" && t > 0.2) EXP.ph = "reels";
  }
  /* 공개 · 오렌지 스테이지 · 점 팡 · 서버 기록(draw_log) · 이름 · 확인 표시 */
  function reveal() {
    EXP.ph = "done";
    stageTo("orange", 960, grpY(), 0.6);
    burst(960, grpY());
    sendBatch();
    var P = RK(); ROLL.end(P.fan);                    /* 롤이 끊기고 쾅 한 번 · 뒤는 조용히(크래시 울림만) */
    if (P.fan !== "s") later(0.35, function () { ring(960, grpY(), 56, 1000, 7, 1.3, 140); });
    if (P.fan === "l") { CONF.until = T + 6; later(0.9, function () { ring(960, grpY(), 64, 1300, 8, 1.4, 160); }); }
    scene("reveal"); lock(1.2);
    uiNames(0.5);
  }
  function sendBatch() {
    var any = false;
    (ST.batch || []).forEach(function (id) { var r = resById(id); if (r && r.q) { delete r.q; any = true; if (r.st === "win") serverLog(r); } });
    if (any) persist();
  }
  function endReveal() {
    REEL.on = false; EXP.ph = "";
    fade($("rv"), 0, 0.35); fade($("vPrize"), 0, 0.3);
    stageTo("black", 960, grpY(), 0.6);
    WB = []; GATE.tgt = 0;
    CAMD.k = 1; CAMD.ox = 0; CAMD.oy = 0; CAMD.a = 0;
    DRM.mode = "spin"; DRM.w = 0.5; DRM.tgt = WMIX;
  }
  function confirmWin() {
    CONF.until = 0;
    var ri = ST.round, need = curRound().count;
    sendBatch();
    endReveal();
    ST.batch = []; ST.pending = null;
    lock(0.9);
    var done = roundWins(ri).length >= need;
    if (!done) scene("mix");
    else if (ri + 1 < rounds().length) { ST.round = ri + 1; persist(); NEXTCARD = T + 1.6; scene("mix"); }
    else scene("board");
  }
  /* 부재 · 다시 추첨(사회자가 현장에서 따로 판단할 때만 · 확인이 없다는 이유로 쓰지 않는다) · arg = 대상 기록 id(없으면 이번 뽑기의 마지막 칸) */
  function redraw(arg) {
    if (SC !== "reveal") return;
    var id = arg && inBatch(arg) ? String(arg) : ST.pending, r = resById(id); if (!r) return;
    sendBatch();
    r.st = "absent"; if (CFG.absentRemove) ST.out[r.pk] = "absent"; else delete ST.out[r.pk];
    serverLog(Object.assign({}, r, { st: "absent" }));
    endReveal(); ST.batch = []; ST.pending = null; persist();
    toast("부재 · " + r.no + " · 다시 뽑습니다", true);
    scene("mix"); lock(1.2);
  }
  function undoLast() {
    for (var k = ST.results.length - 1; k >= 0; k--) {
      var r = ST.results[k]; if (r.st !== "win") continue;
      if (r.q) { delete r.q; r.st = "undone"; }      /* 서버에 아직 안 보낸 당첨 · 기록 없이 지운다 */
      else { r.st = "undone"; serverLog(Object.assign({}, r, { st: "undo" })); }
      delete ST.out[r.pk];
      if (r.round < ST.round && roundWins(r.round).length < rounds()[r.round].count) ST.round = r.round;
      if (SC === "reveal" || SC === "board") { sendBatch(); endReveal(); ST.batch = []; ST.pending = null; scene("mix"); }
      persist(); toast("마지막 당첨을 취소했습니다 · " + r.no, true); uiSide(); return "";
    }
    toast("취소할 당첨이 없습니다"); return "none";
  }
  function goIdle() {
    if (SC === "reveal") { sendBatch(); endReveal(); ST.batch = []; ST.pending = null; }
    stageTo("black"); MEsetIdle(); scene(ST.arrived.length ? "closed" : "idle");
  }
  function MEsetIdle() { ME.from = null; }
  function goEnd() {
    if (SC === "reveal") { sendBatch(); endReveal(); ST.batch = []; ST.pending = null; }
    stageTo("black");
    var from = [], K = window.AXF_DATA ? AXF_DATA.me : null;
    if (K) {
      var A = K.A, D = K.D, n = A.count, b = meBox(0.84), alive = [];
      for (var i = 0; i < NB; i++) if (live_[i]) alive.push(i);
      for (var k = 0; k < n; k++) {
        var p = axfSample(A, D, k, 0, 0), tx = b.x + p[0] * b.s, ty = b.y + p[1] * b.s, bi = alive[k];
        if (bi != null && CAMD.a > 0.2) { prj(px_[bi], py_[bi], pz_[bi]); from.push([PRJ.x, PRJ.y, RB * PRJ.s * 0.5, tx, ty]); }
        else { var a = rng() * 6.2832, rr = 1300 + rng() * 500; from.push([960 + Math.cos(a) * rr, 540 + Math.sin(a) * rr, 3, tx, ty]); }
      }
      ME.from = from; ME.box = b;
    }
    for (var j = 0; j < NB; j++) live_[j] = 0;
    CAMD.a = 0;
    scene("end"); lock(1.5);                         /* 4차 · 끝 화면은 소리 없음 */
  }

  /* ─────────────── 공개 그림 · 캡슐 · 릴 · 등분 선(drum.js 그대로) ─────────────── */
  var DIG = null, DIGH = 0;
  function buildDigits() {
    var c = document.createElement("canvas"), w = CELLW, h = CELLH + 40; c.width = w; c.height = h;
    var g = c.getContext("2d", { willReadFrequently: true });
    DIG = []; var y0 = 1e9, y1 = -1e9;
    for (var d = 0; d < 10; d++) {
      g.clearRect(0, 0, w, h); g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 400px " + FONT;   /* 5차 · 굵기 800 → 900(획마다 점이 한 줄 더) */ g.fillText(String(d), w / 2, h / 2 + 16);
      var px = g.getImageData(0, 0, w, h).data, pts = [];
      for (var y = DSTEP / 2; y < h; y += DSTEP) for (var x = DSTEP / 2; x < w; x += DSTEP) if (px[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 110) { pts.push(x - w / 2, y - h / 2); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      DIG.push(pts);
    }
    DIGH = y1 - y0 + 2 * DOTR;
  }
  function reelCellX(k) { return (k - 1.5) * (CELLW + GAPX); }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function drawReels() {
    if (!REEL.on || !DIG) return;
    var t = Math.max(0, T - REEL.t0), appear = clamp((T - REEL.t0 + 0.25) / 0.45, 0, 1), s = LAY.s, k;
    var top = -CELLH / 2 - 26, bot = CELLH / 2 + 26, stOK = TQ().st;
    cx.globalAlpha = appear;
    REEL.cells.forEach(function (c, j) {
      var L = LAY.cells[j];
      cx.setTransform(vs * s, 0, 0, vs * s, vox + vs * L.x, voy + vs * L.y);
      /* 5차 · 칸 배경 · 밑 막대 없음(사용자 「숫자 밑 하얀 선이 이상하다」) */
      for (k = 0; k < 4; k++) {
        var p = reelPos(c, k, t), base = Math.floor(p), fr = p - base, sp = c.done[k] || t > c.stops[k] + 0.4 ? 0 : Math.abs(reelPos(c, k, t + 0.016) - p) / 0.016;
        var cxk = reelCellX(k);
        cx.save(); cx.beginPath(); cx.rect(cxk - CELLW / 2, top, CELLW, bot - top); cx.clip();
        var stretch = stOK ? clamp(sp * 0.45, 0, 6) : 0;   /* 돌 때만 점이 위아래로 늘어난다(잔상) · 멈추면 둥근 점 그대로 */
        if (sp === 0 && fr < 0.001) drawDigitDots(DIG[((base % 10) + 10) % 10], cxk, 0, 0, top, bot);   /* 선 칸 · 한 숫자만 */
        else for (var jj = -1; jj <= 1; jj++) drawDigitDots(DIG[((base + jj) % 10 + 10) % 10], cxk, -(jj - fr) * (CELLH + 30), stretch, top, bot);
        cx.restore();
      }
    });
    cx.globalAlpha = 1;
  }
  function drawDividers() {
    if (!REEL.on || LAY.K < 2) return;
    var al = clamp((T - REEL.t0 + 0.25) / 0.45, 0, 1) * 0.42, segs = [], y0 = 320, y1 = LAY.rows === 1 ? 980 : 1020;
    if (LAY.rows === 1) for (var j = 1; j < LAY.K; j++) { var x = (LAY.cells[j - 1].x + LAY.cells[j].x) / 2; segs.push([x, y0, x, y1]); }
    else {                                             /* 두 줄 · 줄마다 그 줄의 칸 사이에만 세로 선(5 · 6명은 위 셋 · 아래 둘이나 셋) · 가운데 가로 선 하나 */
      var ym = LAY.ym;                                 /* 위 줄 이름 · 부서 아래와 아래 줄 번호 칸 위 사이 */
      for (var j2 = 1; j2 < LAY.K; j2++) { var a = LAY.cells[j2 - 1], b = LAY.cells[j2]; if (a.y !== b.y) continue; var xm = (a.x + b.x) / 2; segs.push(a.y < ym ? [xm, y0, xm, ym - 26] : [xm, ym + 26, xm, y1]); }
      segs.push([180, ym, 1740, ym]);
    }
    cx.setTransform(vs, 0, 0, vs, vox, voy); cx.globalAlpha = al; cx.fillStyle = "#fff"; cx.beginPath();
    segs.forEach(function (sg) { var L = Math.hypot(sg[2] - sg[0], sg[3] - sg[1]), n = Math.floor(L / 18); for (var q = 0; q <= n; q++) { var x2 = sg[0] + (sg[2] - sg[0]) * q / n, y2 = sg[1] + (sg[3] - sg[1]) * q / n; cx.moveTo(x2 + 3, y2); cx.arc(x2, y2, 3, 0, 6.2832); } });
    cx.fill(); cx.globalAlpha = 1;
  }
  function drawDigitDots(pts, ox, oy, st, top, bot) {
    cx.fillStyle = "#FFFFFF"; cx.beginPath();
    var r = DOTR;
    for (var q = 0; q < pts.length; q += 2) {
      var x = ox + pts[q], y = oy + pts[q + 1];
      if (y < top - 20 || y > bot + 20) continue;
      if (st > 1) { cx.moveTo(x + r, y - st / 2); cx.arc(x, y - st / 2, r, 0, Math.PI, true); cx.arc(x, y + st / 2, r, Math.PI, 0, true); cx.closePath(); }
      else { cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832); }
    }
    cx.fill();
  }
  function drawFlyBall() {
    if (SC !== "exit") return;
    var split = EXP.ph === "open" || EXP.ph === "reels" || EXP.ph === "done", u = split ? clamp((T - REEL.t0 + 0.25) / 0.55, 0, 1) : 0;
    for (var k = 0; k < WB.length; k++) {
      var b = WB[k];
      if (b.ph !== "fly" && b.ph !== "set") continue;
      var tone = TONES[tone_[b.i]], X = b.X, Y = b.Y, R = b.Rr, sep = split ? EIO(u) * R * 2.6 : 0, al = split ? 1 - EIO(clamp(u * 1.4 - 0.3, 0, 1)) : 1;
      if (al <= 0.01) continue;
      cx.setTransform(vs, 0, 0, vs, vox, voy); cx.globalAlpha = al;
      for (var half = 0; half < 2; half++) {
        cx.save();
        var oy = half ? sep : -sep;
        cx.translate(X, Y + oy); cx.rotate(b.ang);
        cx.beginPath(); cx.arc(0, 0, R, half ? 0 : Math.PI, half ? Math.PI : 6.2832); cx.closePath(); cx.clip();
        cx.rotate(-b.ang);
        cx.fillStyle = half ? "#F4F1EE" : tone; cx.fillRect(-R, -R, 2 * R, 2 * R);
        var sh = cx.createRadialGradient(-R * 0.38, -R * 0.42, R * 0.05, 0, 0, R * 1.05);
        sh.addColorStop(0, "rgba(255,255,255,0.55)"); sh.addColorStop(0.3, "rgba(255,255,255,0.05)"); sh.addColorStop(0.78, "rgba(0,0,0,0.12)"); sh.addColorStop(1, "rgba(0,0,0,0.5)");
        cx.fillStyle = sh; cx.fillRect(-R, -R, 2 * R, 2 * R);
        cx.restore();
      }
      if (split && sep > 0 && sep < R * 0.8) { cx.globalAlpha = al * (1 - sep / (R * 0.8)); cx.fillStyle = "#fff"; cx.fillRect(X - R * 1.4, Y - 3 - sep * 0.1, R * 2.8, 6 + sep * 0.2); }
      if (!split) {
        cx.globalAlpha = 1; cx.strokeStyle = "rgba(0,0,0,0.28)"; cx.lineWidth = Math.max(1.5, R * 0.05);
        cx.beginPath(); cx.moveTo(X - Math.cos(b.ang) * R, Y - Math.sin(b.ang) * R); cx.lineTo(X + Math.cos(b.ang) * R, Y + Math.sin(b.ang) * R); cx.stroke();
      }
    }
    cx.globalAlpha = 1;
  }
  /* 복원 · 정해진 당첨(배치)을 공개 화면 그대로 다시 보여 준다(릴은 선 상태) */
  function restoreReveal() {
    var ids = ST.batch.slice();
    layout(ids.length);
    WB = ids.map(function (id, j) { return { id: id, no: resById(id).no, i: -1, ph: "set", t0: 0, cell: j }; });
    planReels(); REEL.on = true; REEL.t0 = T - 30; REEL.cells.forEach(function (c) { c.done = [1, 1, 1, 1]; });
    EXP.ph = "done"; CAMD.a = 0; stageSet("orange");
    uiRevealPrep(); fade($("rv"), 1, 0); fade($("vPrize"), 1, 0);
    sendBatch();
    scene("reveal"); uiNames(0);
  }

  /* ─────────────── 당첨자 확인(앱 「확인」 → 서버 draw_ack → 소켓 drawack · 또는 draw_acks 읽기) ───────────────
   *   무대는 기다리지 않는다 · 오면 그 칸에 「확인 완료」만 덧붙인다 · 누가인지 새로 보이는 것은 없다 */
  var ACKP = { t: 0, busy: false, again: false };
  function setAck(id, at) {
    id = String(id || ""); if (!id || ST.ack[id]) return;
    var r = resById(id); if (!r || r.st !== "win") return;
    ST.ack[id] = at || "확인"; persist();
    if (SC === "reveal" && inBatch(id)) {
      var j = ST.batch.indexOf(id), el = document.getElementById("wc" + j);
      if (el) { var ok = el.querySelector(".ok"); fade(ok, 1, 0.35); }
      var c = LAY.cells[j], sc = LAY.s;
      if (c) { ring(c.x, c.y, Math.round(48 * Math.max(0.5, TQ().pm)), 700 * sc + 200, 8, 1.0, 140 * sc + 40); }
    }
  }
  function ackPoll() {
    if (CFG.mode !== "server" || !sessionKey() || T < ACKP.t) return;
    if (ACKP.busy) { ACKP.again = true; return; }
    if (SC !== "reveal" && SC !== "board") return;
    if (!ST.results.some(function (r) { return r.st === "win" && !r.q && !ST.ack[r.id]; })) return;
    ACKP.t = T + (WSD.st === "ok" ? 15 : 3); ACKP.busy = true;   /* 소켓이 살아 있으면 15초마다 한 번(놓친 사건 맞추기) · 끊기면 3초 */
    jsonp("draw_acks", {}, function (res) {
      ACKP.busy = false;
      if (res && res.ok) (res.rows || []).forEach(function (r) { if (r.st === "ok") setAck(r.id, r.at); });
      if (ACKP.again) { ACKP.again = false; ACKP.t = Math.min(ACKP.t, T + 1); }   /* 응답을 기다리는 동안 사건이 또 왔으면 1초 뒤 한 번 더 */
    });
  }

  /* ─────────────── DOM · 글자는 움직이지 않는다(투명도만) ─────────────── */
  var E = {};
  function $(id) { return E[id] || (E[id] = document.getElementById(id)); }
  function set(id, html) { var el = $(id); if (el && el._h !== html) { el._h = html; el.innerHTML = html; } }
  var TM = [];
  function later(sec, fn) { TM.push([T + sec, fn]); }
  var FADES = [];
  function fade(el, to, dur, delay) {
    if (!el) return;
    var cur = el._op == null ? +(el.style.opacity || 0) : el._op;
    FADES = FADES.filter(function (f) { return f.el !== el; });
    if (!dur && !delay) { el._op = to; el.style.opacity = to; return; }
    FADES.push({ el: el, a0: cur, a1: to, t0: T + (delay || 0), dur: dur || 0.001 });
  }
  function stepFades() {
    for (var i = 0; i < FADES.length; i++) {
      var f = FADES[i]; if (T < f.t0) continue;
      var u = clamp((T - f.t0) / f.dur, 0, 1), v = f.a0 + (f.a1 - f.a0) * u;
      f.el._op = v; f.el.style.opacity = v.toFixed(3);
      if (u >= 1) FADES.splice(i--, 1);
    }
  }
  var PANELS = { intro: "", idle: "pPool", checkin: "pPool", closed: "pPool", mix: "", spin: "", tension: "", exit: "", reveal: "rv", card: "pCard", board: "pBoard", end: "pEnd", fin: "pFin" };
  function uiScene() {
    var s = SC, on = PANELS[s];
    ["pPool", "side", "rv", "pCard", "pBoard", "pEnd", "pFin"].forEach(function (id) {
      if (s === "exit" && (id === "side" || id === "rv")) return;   /* 배출 · 오른쪽 단은 첫 공이 날 때 · 공개 글자는 공이 칸에 설 때 */
      if (s === "reveal" && id === "rv") { fade($(id), 1, 0.2); return; }
      if (id === on) fade($(id), 1, 0.35, 0.22);
      else fade($(id), 0, 0.2);
    });
    if (on === "pPool") uiPool();
    if (s === "mix" || s === "spin" || s === "tension") uiSide();
    if (s === "mix") { BZ.t0 = T; BZ.press = -1; uiRk(); if (!NEXTCARD) bzTip(); }
    fade($("rk"), (s === "mix" && !NEXTCARD) || s === "spin" || s === "tension" ? 1 : 0, 0.3);
    if (s === "card") uiCard();
    if (s === "board") uiBoard();
    if (s === "fin") uiFin();
    pushCtl();
  }
  function poolCount() {
    var ppl = 0, tks = 0;
    if (ST.pool) ST.pool.order.forEach(function (pk) { var p = ST.pool.people[pk]; if (p && p.nos.length && !ST.out[pk]) { ppl++; tks += p.nos.length; } });
    else if (SRV.stat) { ppl = +SRV.stat.n || 0; tks = +SRV.stat.balls || 0; }
    return { ppl: ppl, tks: tks, known: !!ST.pool || !!SRV.stat };
  }
  function uiPool() {
    var el = $("pPool"); if (!el) return;
    var c = poolCount(), loadPool = CFG.mode === "server" && !ST.pool, s = SC;
    set("oPeo", c.known ? nf(c.ppl) : "-"); set("oTk", c.known ? nf(c.tks) : "-");
    set("oTitle", s === "checkin" ? "추첨 준비" : s === "closed" ? "추첨 준비 끝" : "경품 추첨");
    var note = loadPool ? "행운권 불러오는 중" : s === "idle" ? "" : ST.big ? "통 안의 공 " + nf(ST.repN || 0) + "개 = 대표 공 · 당첨은 행운권 전체에서" : "당첨은 행운권 전체에서";
    var on = $("oNote"); on.textContent = note; on.classList.toggle("load", loadPool);
    $("oLk7").style.display = s === "idle" ? "" : "none";
  }
  var LK7 = { pics: ["rl1_tumbler_v2", "rl4_sticker_v2", "rl2_keyring_v2", "rl5_pen_v2"] };
  function lk7Html() {
    return '<span class="pics">' + LK7.pics.map(function (f) { var k = (PIC_K[f] || 0.59) * 100 + "%"; return '<span><img src="' + PIC_DIR + f + '.webp" alt="" decoding="async" style="width:' + k + ";height:" + k + '"></span>'; }).join("") + "</span>" +
      "<span><b>7등 랜덤 굿즈 · 수량 추후 공개</b><em>행사 뒤 추첨 · 행랑 발송</em></span>";
  }
  function fitText(el, mx, mn, lines) {
    if (!el) return;
    el._fit = [mx, mn, lines];
    var s = el.style; el.classList.remove("ell"); el.classList.remove("cl2");
    s.fontSize = mx + "px"; s.whiteSpace = "nowrap";
    var W = el.clientWidth; if (!W || !el.textContent) return;
    var sw = el.scrollWidth; if (sw <= W + 0.5) return;
    for (var f = Math.min(mx - 0.5, Math.floor(mx * W / sw * 2) / 2); f >= mn; f -= 0.5) { s.fontSize = f + "px"; if (el.scrollWidth <= W + 0.5) return; }
    s.fontSize = mn + "px";
    if (lines >= 2) {
      s.whiteSpace = "normal";
      var lh = parseFloat(getComputedStyle(el).lineHeight) || mn * 1.3;
      if (el.scrollHeight > lh * 2 + 2 || el.scrollWidth > W + 0.5) el.classList.add("cl2");
    } else el.classList.add("ell");
  }
  function refitAll() { var a = document.querySelectorAll(".fit"); for (var k = 0; k < a.length; k++) if (a[k]._fit) fitText(a[k], a[k]._fit[0], a[k]._fit[1], a[k]._fit[2]); }
  /* 이름 · 부서 · real = draw_who 실명(없으면 가린 이름) · mask = 가린 이름 · none = 비움 · 부서 = draw_who 부서(없으면 draw_pool 부문) */
  function nmOf(w) {
    if (!w || CFG.nameMode === "none") return "";
    if (CFG.nameMode === "real" && w.fn) return String(w.fn);
    return w.nm ? mask(w.nm) : "";
  }
  function dpOf(w) {
    if (!w || CFG.nameMode === "none" || !CFG.showDept) return "";
    return String((CFG.nameMode === "real" && w.fn ? w.fd : w.dp) || "").replace(/\s+/g, " ").trim();
  }
  function whoHtml(w) {
    var dp = dpOf(w);
    return '<span class="who"><span class="nm fit">' + esc(nmOf(w)) + "</span>" + (dp ? '<span class="dp">' + esc(dp) + "</span>" : "") + "</span>";
  }
  /* 섞기 · 오른쪽 단 · 등수 · 경품 · 이번 등수 당첨 번호 · 「행운권 N장 전체에서 추첨」 · 대표 공 · 내 번호 자리 */
  function uiSide() {
    var r = curRound(), ws = roundWins(ST.round, true), h = "";
    set("sEye", esc(r.name)); set("sCnt", r.count + "명 추첨");
    set("sTitle", esc(r.prize)); fitText($("sTitle"), 76, 52, 2);
    picInto($("sPic"), $("sImg"), r);
    h = ws.map(function (w) { return "<span>" + esc(w.no) + "</span>"; }).join("");
    for (var k = ws.length; k < r.count; k++) h += '<span class="dim">····</span>';
    set("sNos", h);
    set("sRule", "행운권 <b>" + nf(bigTickets().length) + "</b>장 전체에서 추첨<br>" + (ST.big ? "통 안의 공 " + nf(ST.repN || 0) + "개 = 대표 공<br>" : "") + "내 번호 = 앱 「나의 보상」");
  }
  /* 공개 준비 · 경품 줄 · 칸마다 이름 자리(이름은 릴이 다 선 뒤 나타난다) */
  function uiRevealPrep() {
    var r = curRound(), K = WB.length;
    set("vTxt", esc(r.name + " · " + r.prize + (K > 1 ? " · " + K + "명" : ""))); fitText($("vTxt"), 52, 36, 1);
    picInto($("vPic"), $("vImg"), r);
    $("vLab").style.top = (LAY.rows === 1 ? 262 : 250) + "px";
    var cls = LAY.rows > 1 ? " row" : K === 1 ? "" : K === 2 ? " m" : " s", h = "";
    var ok = '<span class="ok"><span class="ck"></span><b>확인 완료</b></span>';
    for (var j = 0; j < K; j++) {
      var c = LAY.cells[j], top = c.y + LAY.ph * LAY.s / 2 + (LAY.rows > 1 ? 8 : 26);
      h += '<div class="wc' + cls + '" id="wc' + j + '" style="left:' + c.x + "px;top:" + top + "px;width:" + LAY.cw + 'px">' +
        (LAY.rows > 1 ? '<span class="l1"><span class="nmw"><span class="nm fit"></span>' + ok + '</span></span><span class="dp fit"></span>' : '<span class="nm fit"></span><span class="dp fit"></span>' + ok) + "</div>";
    }
    $("vCells").innerHTML = h;
    for (var q = 0; q < K; q++) fillCell(q);
    fade($("vPrize"), 0, 0); fade($("rv"), 1, 0.4); fade($("vPrize"), 1, 0.5);
  }
  /* 칸 하나 · 이름 · 부서 글자 맞춤(1920×1080 논리 크기 · 객석 뒤에서 읽히게)
   *   1명 = 이름 120 · 부서 56 / 2명 = 104 · 50 / 3명 = 100 · 44 / 두 줄 배치(4명부터) = 58 · 36
   *   긴 이름 = 줄여 맞춤(최소 70%) · 긴 부서 = 줄여 맞춤(최소 70%) → 한 줄 배치는 두 줄까지 · 두 줄 배치는 한 줄 말줄임 */
  var WCF = { "": [120, 56], m: [104, 50], s: [100, 44], row: [58, 36] };
  function fillCell(j) {
    var el = document.getElementById("wc" + j); if (!el || !WB[j]) return;
    var x = resById(WB[j].id), k = LAY.rows > 1 ? "row" : LAY.K === 1 ? "" : LAY.K === 2 ? "m" : "s", f = WCF[k];
    var nm = el.querySelector(".nm"), dp = el.querySelector(".dp"), a = nmOf(x), b = dpOf(x);
    if (nm.textContent !== a) nm.textContent = a;
    if (dp.textContent !== b) dp.textContent = b;
    dp.style.display = b ? "" : "none";
    fitText(nm, f[0], Math.round(f[0] * 0.7), 1);
    if (b) fitText(dp, f[1], Math.round(f[1] * 0.7), k === "row" ? 1 : 2);
  }
  function uiNames(delay) {
    for (var j = 0; j < WB.length; j++) {
      var el = document.getElementById("wc" + j); if (!el) continue;
      fade(el, 1, 0.4, delay);
      var ok = el.querySelector(".ok"); fade(ok, ST.ack[WB[j].id] ? 1 : 0, delay ? 0.4 : 0, delay);
    }
  }
  /* 결과 · v5.03 완주 경품 추첨 숫자 발표(옛 화면 그대로) */
  function finArg(a) {
    var m = /^(\d{1,6})\.(\d{1,6})\.(\d{3,4})(?:\.(\d{3,4}))?$/.exec(String(a == null ? "" : a)); if (!m) return null;
    var hm = ("0" + m[3]).slice(-4), md = m[4] ? ("0" + m[4]).slice(-4) : "";
    return { w: +m[1], n: +m[2], cut: hm.slice(0, 2) + ":" + hm.slice(2), ship: md ? +md.slice(0, 2) + "/" + +md.slice(2) : "" };
  }
  function goFin() { if (SC === "reveal") { sendBatch(); endReveal(); ST.batch = []; ST.pending = null; } stageTo("black"); scene("fin"); lock(0.8); }
  function uiFin() {
    var f = ST.fin || { w: 0, n: 0, cut: "17:00", ship: "" }, all = f.n > 0 && f.w >= f.n;
    set("fBig", (all ? "대상 전원 " : "") + '<span class="tab">' + nf(all ? f.n : f.w) + "</span><em>명</em>"); $("fBig").classList.toggle("all", all);
    set("fMeta", (all ? "" : "대상 " + nf(f.n) + "명 · ") + esc(f.cut) + " 기준 스탬프 6개");
    set("fNote", "결과는 앱 내 보상에서 확인" + (f.ship ? " · " + esc(f.ship) + " 배송" : ""));
  }
  /* 등수 사진 = 앱 경품 사진(../assets/prize/ · 옛 화면과 같은 파일 · 같은 크기 표) */
  var PIC_DIR = "../assets/prize/", PIC = { "1등": "ld1_ipad", "2등": "ld2_shilla", "3등": "ld3_minix", "4등": "ld4_airpods", "5등": "ld5_pulio", "6등": "ld6_hyundai" }, PIC_OK = {};
  var PIC_K = { ld1_ipad: 0.79, ld2_shilla: 0.59, ld3_minix: 0.90, ld4_airpods: 0.92, ld5_pulio: 0.84, ld6_hyundai: 0.90, rl1_tumbler_v2: 0.87, rl4_sticker_v2: 0.75, rl2_keyring_v2: 0.83, rl5_pen_v2: 0.79 };
  function picK(img, f) { var k = (PIC_K[f] || 0.59) * 100 + "%"; img.style.width = k; img.style.height = k; }
  (function () { Object.keys(PIC).forEach(function (k) { var im = new Image(); im.onload = function () { PIC_OK[k] = 1; }; im.onerror = function () { PIC_OK[k] = 0; }; im.src = PIC_DIR + PIC[k] + ".webp"; }); })();
  function picInto(box, img, r) {
    if (!box || !img) return;
    var k = String(r && r.name || "").replace(/\s/g, ""), f = PIC[k];
    if (!f || PIC_OK[k] === 0) { box.classList.remove("on"); img.removeAttribute("src"); return; }
    var src = PIC_DIR + f + ".webp";
    if (img.getAttribute("src") !== src) { img.onerror = function () { box.classList.remove("on"); }; img.setAttribute("src", src); picK(img, f); }
    box.classList.add("on");
  }
  function uiCardPic(r) {
    var box = $("kPic"), img = $("kImg"), f = PIC[String(r.name).replace(/\s/g, "")];
    box.classList.remove("in"); box.style.opacity = 0;
    if (!f || PIC_OK[String(r.name).replace(/\s/g, "")] === 0) { img.removeAttribute("src"); return; }
    img.onerror = function () { box.classList.remove("in"); box.style.opacity = 0; };
    img.src = PIC_DIR + f + ".webp"; picK(img, f);
    void box.offsetWidth; box.classList.add("in");
  }
  function uiCard() { var r = curRound(); uiCardPic(r); set("kEye", esc(r.name)); fitText($("kEye"), 42, 30, 1); set("kTitle", esc(r.prize)); fitText($("kTitle"), 150, 96, 2); set("kMeta", r.count + "명 추첨"); }
  function uiBoard() {
    var all = ST.results.filter(function (r) { return r.st === "win" && !inBatch(r.id); }), n = all.length, L = $("bList");
    set("bList", all.map(function (w) { return '<div class="brow"><span class="no">' + esc(w.no) + "</span>" + whoHtml(w) + '<span class="pz fit">' + esc(w.prize) + "</span></div>"; }).join(""));
    L.style.setProperty("--rows", Math.max(5, n));
    var fs = Math.min(44, 508 / Math.max(5, n) * 0.46), two = n <= 5 ? 2 : 1;
    L.querySelectorAll(".nm").forEach(function (e) { fitText(e, fs, fs * 0.72, 1); });
    L.querySelectorAll(".dp").forEach(function (e) { e.style.fontSize = Math.round(fs * 0.68) + "px"; });   /* 부서 = 이름 옆 한 줄 · 넘치면 말줄임(CSS) */
    L.querySelectorAll(".pz").forEach(function (e) { fitText(e, fs * 0.78, fs * 0.5, two); });
  }
  var tickN = 0;
  function uiTick() {
    if ((tickN++ % 6) !== 0) return;
    if (SC === "idle" || SC === "checkin" || SC === "closed") uiPool();
    if (WHO.fail && !WHO.busy) whoFetch();            /* 261008 실명 받기 실패 뒤 다시 */
    uiHelp();
    if (document.body.classList.contains("hud-on")) set("hud", Math.round(FPS.v) + " fps · 단계 " + QL.tier + " · 공 " + liveCount() + "/" + NB + " · " + vw + "×" + vh + " · 물리 " + PH.ms.toFixed(1) + "ms · 그리기 " + RD.ms.toFixed(1) + "ms");
  }
  var toastUntil = 0, kTipT = null;
  function keyTip(msg) {
    var el = $("kTip"); if (!el) return;
    el.textContent = msg || ""; el.style.opacity = msg ? "1" : "0";
    clearTimeout(kTipT); if (msg) kTipT = setTimeout(function () { el.style.opacity = "0"; }, 2600);
  }
  /* 3차 · 진행자 키 안내 · 부저 화면에서 오른쪽 아래 아주 작게 4초만 · 화면 가운데에는 글자를 띄우지 않는다 */
  var bzTipT = null;
  function bzTip() {
    var el = $("mixSkip"); if (!el) return;
    el.textContent = "Space · 부저"; fade(el, 1, 0.3);
    clearTimeout(bzTipT); bzTipT = setTimeout(function () { fade(el, 0, 0.6); }, 4000);
  }
  function uiHelp() {
    if (!document.body.classList.contains("help-on")) return;
    var nx = nextCmd(), r = curRound(), done = ST.results.filter(function (x) { return x.st === "win"; }).length;
    set("hNext", esc(nx.n));
    set("hNow", esc((SCN_KO[SC] || SC) + " · " + r.name + " " + roundWins(ST.round, true).length + "/" + r.count + " · 당첨 " + done + "명"));
  }
  var SCN_KO = { idle: "대기", intro: "인트로", checkin: "공 넣는 중", closed: "추첨 준비 끝", card: "등수 카드", mix: "부저 대기", spin: "부저 · 회전", tension: "뽑는 중", exit: "뽑는 중", reveal: "당첨 공개", board: "결과판", fin: "완주 경품 추첨 발표", end: "끝 화면" };
  function toast(msg, soft) {
    if (remote()) { CMD.msg = msg || ""; pushCtl(msg); if (KEYSRC) keyTip(msg); return; }   /* 원격 · 대형 화면에 운영 안내를 띄우지 않는다 · 키를 누른 진행자에게만 구석 작은 글자 */
    var el = $("toast"); el.textContent = msg; el.classList.toggle("soft", !!soft);
    fade(el, msg ? 1 : 0, 0.2); toastUntil = msg ? T + 2.6 : 0;
    pushCtl(msg);
  }

  /* ─────────────── 조작 창 연결(P · 옛 화면과 같은 control.js) ─────────────── */
  var ctlWin = null, bc = null;
  try { bc = new BroadcastChannel("axf-draw"); bc.onmessage = function (e) { onMsg(e.data); }; } catch (e) {}
  window.addEventListener("message", function (e) { if (e.data && e.data.axd) onMsg(e.data); });
  function openControl() { ctlWin = window.open(location.pathname + location.search + "#control", "axfDrawControl", "width=520,height=900"); }
  function onMsg(m) {
    if (!m || !m.axd) return;
    if (m.type === "cmd") act(m.cmd, m.arg);
    if (m.type === "cfg") {
      CFG = Object.assign(CFG, m.cfg); if (m.cfg.rounds) CFG.roundsV = DEF.roundsV; save(LS_CFG, CFG);
      if (m.cfg.mode && m.cfg.mode !== ST.src && SC === "idle") { ST.pool = null; ST.src = m.cfg.mode; }
      if (m.cfg.key != null) { try { sessionStorage.setItem("axfDraw.key", m.cfg.key); } catch (e) {} delete CFG.key; }
      if (m.cfg.mode || m.cfg.key != null || m.cfg.server != null) remoteBoot();
      document.body.classList.toggle("demo", CFG.mode === "demo");
      if (m.cfg.nameMode != null || m.cfg.showDept != null) { whoFetch(); whoPaint(); }
      uiScene();
    }
    if (m.type === "hello") pushCtl();
  }
  function snapshot(msg) {
    return { axd: 1, type: "state", scene: SC, cfg: CFG, round: ST.round, results: ST.results, arrived: ST.arrived.length, balls: liveCount(), inside: liveCount(),
      closed: ST.closed, muted: !SFX.on, qr: { code: "", url: "", st: "" }, srv: { close: SRV.closeStatus || "", status: SRV.status, log: SRV.logStatus || "", queue: SRV.queue.length, hasPool: !!SRV.hasPool, att: SRV.att || "", url: CFG.server || window.AXF_SERVER || "" },
      pool: ST.pool ? ST.pool.order.length : 0, toast: msg || "", fps: Math.round(FPS.v), demo: CFG.mode === "demo", q: QL.tier, gl: false, late: 0, state: SRV.stateStatus || "" };
  }
  function pushCtl(msg) {
    var s = snapshot(msg);
    try { if (ctlWin && !ctlWin.closed) ctlWin.postMessage(s, "*"); } catch (e) {}
    try { bc && bc.postMessage(s); } catch (e) {}
  }
  function resetAll() {
    var keepSeq = ST.cmdSeq || {};
    ST = { cmdSeq: keepSeq, v: 1, seed: Math.floor(Math.random() * 1e9), scene: "idle", pool: null, arrived: [], closed: false, round: 0, results: [], out: {}, src: CFG.mode, ack: {}, batch: [] };
    for (var i = 0; i < NB; i++) live_[i] = 0;
    NIN = 0; LOAD.q = 0; pn = 0; WB = []; REEL.on = false; EXP.ph = ""; GATE.v = GATE.tgt = 0; NEXTCARD = 0;
    SRV.queue = []; save("axfDraw.q", []); SRV.since = ""; SRV.hasPool = false; SRV.stateChecked = true; if (SRV.polling) { clearInterval(SRV.polling); SRV.polling = null; }
    DRM.mode = "spin"; DRM.tgt = 0; MIXT = 0; MIXSKIP = false;
    fade($("rv"), 0, 0); stageTo("black"); ME.from = null; save(LS_ST, ST);
    scene("idle"); toast("처음 상태로 되돌렸습니다", true);
  }

  /* ─────────────── 원격 조종(관리 콘솔 → 서버 → 이 화면) · 옛 화면 규약 그대로 ───────────────
   *   받기: 소켓 { t:'draw', cmd, arg, seq } · 소켓이 없으면 draw_scr 응답 cmd · 모의 명령기(BroadcastChannel axf-draw-remote)
   *   보내기: 2초마다 draw_scr { scene, pool, checked, round, slot, mixing_s, need_s, ready, closed, last, rej, seq, msg, ver, remote }
   *   확인: 소켓 { t:'drawack', id, st, at } · 이 화면은 그 칸에 「확인 완료」만 덧붙인다 */
  function remote() { return Q.has("remote") ? Q.get("remote") !== "0" : CFG.mode === "server"; }
  var CMD = { based: false, rej: null, last: null, msg: "", scrT: 0, scrEvery: 2, pollT: null, scrBusy: false, scrNo: 0 };
  var RBC = null;
  try { RBC = new BroadcastChannel("axf-draw-remote"); RBC.onmessage = function (e) { var m = e.data; if (m && m.axr && m.t === "draw") remoteCmd(m.cmd, m.arg, m.seq, "mock"); if (m && m.axr && m.t === "drawack") setAck(m.id, m.at); }; } catch (e) {}
  function cmdSeqOf(src) { ST.cmdSeq = ST.cmdSeq || {}; return +ST.cmdSeq[src] || 0; }
  function remoteCmd(c, arg, seq, src) {
    seq = +seq || 0; src = src || "srv";
    if (!c || (seq && seq <= cmdSeqOf(src))) return;
    if (seq) { ST.cmdSeq[src] = seq; persist(); }
    var why = "";
    try { why = runCmd(String(c), arg); } catch (e) { why = "error"; }
    CMD.last = { seq: seq, src: src, cmd: c, ok: !why, why: why || "" };
    CMD.rej = why ? { seq: seq, cmd: c, why: why } : null;
    scrPush(true);
  }
  function cmdWhy(c, arg) {
    if (c === "reset_screen") return "";
    if (T < busyUntil || NEXTCARD) return "busy";
    switch (c) {
      case "idle": return drawingNow() ? "drawing" : SC === "idle" ? "same" : "";
      case "intro": return SC !== "idle" ? "scene" : !CFG.intro || ST.introDone ? "done" : "";
      case "checkin": return SC !== "idle" ? "scene" : "";
      case "close": return SC !== "checkin" ? "scene" : nockLoading() ? "loading" : "";
      case "round":
        if (!ST.closed) return "notclosed";
        if (["closed", "mix", "card"].indexOf(SC) < 0) return "scene";
        if (arg != null && arg !== "" && !(+arg >= 0 && +arg < rounds().length)) return "round";
        return "";
      case "mix": return SC !== "card" && SC !== "closed" ? "scene" : SC === "card" && sT() <= 0.8 ? "busy" : "";
      case "draw":
        if (SC !== "mix") return "scene";
        if (sT() <= 0.45) return "busy";   /* 부저가 나타나는 0.45초 */
        if (LOAD.q > 0) return "loading";
        if (roundWins(ST.round).length >= curRound().count) return "full";
        return bigTickets().length ? "" : "empty";
      case "confirm": return SC !== "reveal" ? "scene" : sT() <= 1.4 ? "busy" : arg && !inBatch(arg) ? "id" : "";   /* 콘솔은 방금 당첨 id(이번 뽑기의 마지막 칸)를 붙여 보낸다 */
      case "absent": return SC !== "reveal" ? "scene" : arg && !inBatch(arg) ? "id" : "";
      case "undo":
        var lw = null; for (var k = ST.results.length - 1; k >= 0 && !lw; k--) if (ST.results[k].st === "win") lw = ST.results[k];
        if (!lw) return "none";
        if (drawingNow()) return "drawing";
        return arg && String(arg) !== String(lw.id) ? "id" : "";
      case "board": return SC !== "mix" && SC !== "closed" ? "scene" : "";
      case "end": return drawingNow() ? "drawing" : SC === "end" ? "same" : "";
      case "fin": return drawingNow() ? "drawing" : arg != null && arg !== "" && !finArg(arg) ? "arg" : "";
    }
    return "unknown";
  }
  var CMDS = ["idle", "intro", "checkin", "close", "round", "mix", "draw", "confirm", "absent", "undo", "board", "end", "reset_screen", "fin"];
  function runCmd(c, arg) {
    var why = cmdWhy(c, arg); if (why) return why;
    SFX.ensure();
    switch (c) {
      case "reset_screen": resetAll(); return "";
      case "idle": goIdle(); return "";
      case "intro": if (!vid("intro").ok) { startCheckin(); return ""; } playIntro(true); return "";
      case "checkin": startCheckin(); return "";
      case "close": closeCheckin(); return "";
      case "round": if (arg != null && arg !== "") { ST.round = +arg; persist(); } goCard(); return "";
      case "mix": goMix(); return "";
      case "draw": return draw() || "";
      case "confirm": confirmWin(); return "";
      case "absent": redraw(arg); return "";
      case "undo": return undoLast() || "";
      case "board": scene("board"); finCheck(); return "";
      case "end": goEnd(); return "";
      case "fin": var fa = finArg(arg); if (!fa) return "arg"; ST.fin = fa; persist(); goFin(); return "";
    }
    return "unknown";
  }
  function scrState() {
    var last = null, rn = function (i) { var x = rounds()[i]; return x ? x.name : String(i); }, cr = curRound();
    for (var k = ST.results.length - 1; k >= 0 && !last; k--) { var r = ST.results[k], rr2 = rounds()[r.round]; last = { id: r.id, no: r.no, nm: r.nm ? mask(r.nm) : "", st: r.st, round: rn(r.round), slot: r.slot + (rr2 ? "/" + rr2.count : ""), prize: r.prize, at: r.at }; }
    var bw = (SC === "exit" || SC === "reveal") && ST.batch && ST.batch.length ? ST.batch.map(resById).filter(Boolean) : null;
    var slot = bw && bw.length ? bw[0].slot + (bw.length > 1 ? "~" + bw[bw.length - 1].slot : "") + "/" + cr.count : Math.min(cr.count, roundWins(ST.round, true).length + 1) + "/" + cr.count;
    return { scene: SC, pool: liveCount(), checked: ST.arrived.length, round: cr.name, slot: slot, mixing_s: +MIXT.toFixed(1), need_s: 0, mix_skip: !!MIXSKIP, mix_skip_at: MIXSKIP ? MIXSKIPAT : 0,
      ready: CMDS.filter(function (c) { return c !== "reset_screen" && !cmdWhy(c, ""); }), closed: !!ST.closed, last: last, rej: CMD.rej, seq: cmdSeqOf("srv"), msg: CMD.msg, ver: "drum1", remote: remote() };
  }
  function scrPush(now) {
    if (!now && T < CMD.scrT) return;
    CMD.scrT = T + (CMD.scrNo ? 15 : CMD.scrEvery);
    var s = scrState();
    try { RBC && RBC.postMessage({ axr: 1, t: "scr", s: s }); } catch (e) {}
    if (CFG.mode !== "server" || !sessionKey() || CMD.scrBusy) return;
    CMD.scrBusy = true;
    var js = JSON.stringify(s); if (js.length > 3000) { s.last = s.last ? { id: s.last.id, no: s.last.no, st: s.last.st } : null; s.msg = ""; js = JSON.stringify(s); }
    jsonp("draw_scr", { s: js, sid: "main" }, function (res) {
      CMD.scrBusy = false; CMD.scrNo = res && res.err === "unknown action" ? 1 : 0;
      if (!res || !res.ok) return;
      var c = res.cmd;
      if (!CMD.based) { if (c && c.seq) { ST.cmdSeq = ST.cmdSeq || {}; ST.cmdSeq.srv = Math.max(cmdSeqOf("srv"), +c.seq || 0); persist(); } CMD.based = true; return; }
      if (!c || !c.cmd || !(+c.seq > cmdSeqOf("srv")) || WSD.st === "ok") return;
      var at = typeof c.at === "number" ? c.at : Date.parse(c.at || ""), now2 = res.t ? (typeof res.t === "number" ? res.t : Date.parse(res.t)) : Date.now();
      if (at && now2 && now2 - at > 30000) { ST.cmdSeq.srv = +c.seq; persist(); CMD.rej = { seq: +c.seq, cmd: c.cmd, why: "stale" }; return; }
      remoteCmd(c.cmd, c.arg, c.seq, "srv");
    });
  }
  function finCheck() {
    if (CFG.mode !== "server" || !sessionKey() || SRV.finAsked) return;
    SRV.finAsked = true;
    jsonp("fin_state", {}, function (res) { SRV.finOn = !!(res && res.ok && !res.off); uiHelp(); scrPush(true); });
  }
  function cmdPoll() {
    if (CFG.mode !== "server" || !sessionKey()) return;
    jsonp("draw_stats", {}, function (res) {
      if (!res || !res.ok) return;
      if (res.closed != null) SRV.srvClosed = +res.closed;
      if (res.pool) { SRV.stat = res.pool; SRV.att = res.att; uiPool(); }
    });
  }
  function remoteBoot() {
    document.body.classList.toggle("remote", remote());
    keyAsk();
    if (CMD.pollT) clearInterval(CMD.pollT);
    CMD.pollT = setInterval(function () { if (remote()) cmdPoll(); }, 30000);
    if (remote()) { wsdOpen(); scrPush(true); }
  }
  function keyAsk() {
    var need = remote() && CFG.mode === "server" && !sessionKey();
    document.body.classList.toggle("needkey", need);
    var f = document.getElementById("keyBox"); if (!f || f._on) return; f._on = true;
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var v = (document.getElementById("keyIn").value || "").trim(); if (!v) return;
      try { SFX.ensure(); } catch (x) {}   /* 「연결」 누름 = 사용자 동작 · 소리를 여기서 미리 준비 */
      try { sessionStorage.setItem("axfDraw.key", v); } catch (x) {}
      document.getElementById("keyIn").value = ""; document.getElementById("keyErr").textContent = "확인 중";
      jsonp("draw_stats", {}, function (res) {
        if (res && res.ok) {
          document.body.classList.remove("needkey"); document.getElementById("keyErr").textContent = ""; WSD.give = false; WSD.fails = 0;
          if (res.pool) { SRV.stat = res.pool; SRV.att = res.att; uiPool(); }
          remoteBoot(); if (!ST.pool) serverLoad(function () { pushCtl(); });
          if (!SRV.polling && !ST.closed) SRV.polling = setInterval(function () { if ((SC === "idle" || SC === "checkin") && SRV.hasPool) serverLoad(function () { uiPool(); }); }, pollMs());
        }
        else { try { sessionStorage.removeItem("axfDraw.key"); } catch (x) {} document.getElementById("keyErr").textContent = "연결되지 않았습니다 · " + (res && (res.reason || res.err) || "응답 없음"); }
      });
    });
    f.addEventListener("keydown", function (e) { e.stopPropagation(); });
  }
  var WSD = { ws: null, st: "off", fails: 0, give: false, t: null, ping: null, dev: "drm" + Math.floor(Math.random() * 1e9).toString(36) };
  function wsdUrl() { var u = CFG.server || window.AXF_SERVER || ""; return /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/exec$/.test(u) ? u.replace(/^https:/, "wss:").replace(/\/exec$/, "/ws?r=draw") : ""; }
  function wsdOpen() {
    if (!remote() || CFG.mode !== "server" || !sessionKey() || WSD.ws || WSD.t || WSD.give || !wsdUrl() || typeof WebSocket === "undefined") return;
    var ws; try { ws = new WebSocket(wsdUrl()); } catch (e) { wsdFail(); return; }
    WSD.ws = ws; WSD.st = "open";
    ws.onopen = function () { if (WSD.ws === ws) try { ws.send(JSON.stringify({ t: "hello", key: sessionKey(), d: WSD.dev })); } catch (e) {} };
    ws.onmessage = function (e) {
      if (WSD.ws !== ws || e.data === "o") return;
      var m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.t === "ok") { WSD.st = "ok"; WSD.fails = 0; clearInterval(WSD.ping); WSD.ping = setInterval(function () { try { ws.send("p"); } catch (x) {} }, 25000); return; }
      if (m.t === "no") { WSD.give = true; return; }
      if (m.t === "draw" && CMD.based) remoteCmd(m.cmd, m.arg, m.seq, "srv");
      if (m.t === "drawack") {   /* 261008 당첨자 폰 확인 · 소켓 봉투가 id 를 사건 번호로 덮어써(hub.js) 기록 id 가 오지 않는다 → 사건이 오면 바로 draw_acks 한 번(rid 가 오면 그대로) */
        if (m.rid) setAck(m.rid, m.at); else if (m.id && resById(String(m.id))) setAck(m.id, m.at);
        ACKP.t = 0; ackPoll();
      }
    };
    ws.onclose = function () { if (WSD.ws !== ws) return; var was = WSD.st === "ok"; WSD.ws = null; WSD.st = "off"; clearInterval(WSD.ping); if (WSD.give) return; if (was) { WSD.t = setTimeout(function () { WSD.t = null; wsdOpen(); }, 1500); return; } wsdFail(); };
  }
  function wsdFail() { WSD.ws = null; WSD.st = "off"; if (++WSD.fails >= 3) { WSD.give = true; return; } WSD.t = setTimeout(function () { WSD.t = null; wsdOpen(); }, 1000 * Math.pow(2, WSD.fails)); }

  /* ─────────────── 키보드 (프레젠터 리모컨의 PageDown · → 도 「다음」) ─────────────── */
  function onKey(e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key;
    if (e.repeat) return;
    var map = { " ": "next", Enter: "next", PageDown: "next", ArrowRight: "next", r: "redraw", R: "redraw", u: "undo", U: "undo",
      e: "end", E: "end", i: "idle", I: "idle", m: "mute", M: "mute", f: "fs", F: "fs", h: "help", H: "help", "?": "help", g: "hud", G: "hud", p: "ctl", P: "ctl",
      v: "intro", V: "intro", k: "classic", K: "classic", a: "auto", A: "auto" };
    if (map[k]) { e.preventDefault(); act(map[k]); return; }
    if (/^[1-9]$/.test(k)) act("round", +k - 1);
  }

  /* ─────────────── 매 프레임 ─────────────── */
  var PH = { ms: 0 }, RD = { ms: 0 };
  function camTarget() { return { idle: 0, intro: 0, checkin: 1, closed: 1, card: 0, mix: NEXTCARD ? 0 : 0.4, spin: 1, tension: 1, reveal: 0, board: 1, end: 0, fin: 0 }[SC]; }   /* 결과판 · 통은 선 채로(움직일 이유 없음) */
  function spinTarget() { return { idle: 0, intro: 0, checkin: WSLOW, closed: WSLOW, card: WSLOW, mix: WSLOW * 1.2, spin: WFAST, board: 0, end: 0, fin: 0, reveal: WMIX }[SC]; }
  function update(dt) {
    T += dt;
    for (var k = TM.length - 1; k >= 0; k--) if (TM[k][0] <= T) { var f = TM[k][1]; TM.splice(k, 1); f(); }
    stepLoad(); stepArrivals();
    var st = spinTarget(); if (st != null) DRM.tgt = st;
    stepDrum(dt);
    var t0 = performance.now(), phs = TQ().phs, h = dt / phs;
    for (var s = 0; s < phs; s++) physStep(h);
    PH.ms = PH.ms * 0.9 + (performance.now() - t0) * 0.1;
    HITS = 0;
    if (SC === "tension" && DRAW.stopT >= 0 && T - DRAW.stopT > RK().rock) startExit();
    if (SC === "spin" && T - SPIN.t0 >= SPINUP + SPIN.hold) beginDecel();
    if (SC === "card" && sT() >= CARD_AUTO && !NEXTCARD && T >= busyUntil) goMix();
    ROLL.tick(); stepBuzzer(dt); autoStep();
    if (SC === "exit") { stepExit(dt); stepReels(); }
    if (SC === "mix" && ST.closed && DRM.mode === "spin" && LOAD.q <= 0 && !NEXTCARD) MIXT += dt;
    var ct = camTarget(), big = (SC === "mix" && !NEXTCARD) || SC === "spin" || SC === "tension", oxT = big ? OXC : 0, kT = big ? BIGK : 1, oyT = big ? BIGY : 0;
    if (ct != null && SC !== "exit") { var kk = Math.min(1, dt * (SC === "spin" ? 6 : 3)), km = Math.min(1, dt * 2.4); CAMD.a += (ct - CAMD.a) * kk; CAMD.k += (kT - CAMD.k) * km; CAMD.ox += (oxT - CAMD.ox) * km; CAMD.oy += (oyT - CAMD.oy) * km; }
    ME.idleA += ((SC === "idle" || SC === "intro" ? 1 : 0) - ME.idleA) * Math.min(1, dt * 3);
    if (NEXTCARD && T >= NEXTCARD) { NEXTCARD = 0; goCard(); }
    stepParticles(dt);
    if (toastUntil && T > toastUntil) { toastUntil = 0; fade($("toast"), 0, 0.3); }
    if (mixSkipUntil && T > mixSkipUntil) { mixSkipUntil = 0; fade($("mixSkip"), 0, 0.4); }
    stepFades();
    stepVideos();
    uiTick();
    scrPush(false);
    ackPoll();
    stepQuality(dt);
  }
  function render() {
    var t0 = performance.now();
    drawStage();
    if (ME.idleA > 0.01) drawSymbolIdle(ME.idleA);
    if (SC === "card") drawCardObject();
    drawDrum();
    drawBuzzer();
    drawFlyBall();
    if (SC === "end") drawEnd();
    drawParticles();
    drawDividers();
    drawReels();
    RD.ms = RD.ms * 0.9 + (performance.now() - t0) * 0.1;
  }

  /* ─────────────── 프레임 수 · 장면별 기록(시험 · 실측용) ─────────────── */
  var FPS = { v: 60, n: 0, t: 0, frames: 0 };
  var PERF = { sc: {}, long: 0, worst: 0 };
  function perfNote(dt) {
    var p = PERF.sc[SC] || (PERF.sc[SC] = { n: 0, t: 0, min1: 999, worst: 0, w: [] });
    p.n++; p.t += dt; if (dt > p.worst) p.worst = dt;
    p.w.push(dt); if (p.w.length > 240) p.w.splice(0, p.w.length - 240);
    var acc2 = 0, n2 = 0; for (var j = p.w.length - 1; j >= 0 && acc2 < 1; j--) { acc2 += p.w[j]; n2++; }
    if (acc2 >= 1) p.min1 = Math.min(p.min1, n2 / acc2);
    if (dt > 1 / 30) PERF.long++; if (dt > PERF.worst) PERF.worst = dt;
  }
  var lastNow = 0;
  function loop(now) {
    var raw = lastNow ? (now - lastNow) / 1000 : 1 / 60; lastNow = now;
    FPS.n++; FPS.frames++; FPS.t += raw; if (FPS.t >= 0.5) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
    if (raw < 1) perfNote(raw);
    update(Math.min(raw, 1 / 30));
    render();
    requestAnimationFrame(loop);
  }

  /* ─────────────── 시작 ─────────────── */
  function boot() {
    if (REC) { SFX.log = []; SFX.clock = function () { return T; }; }   /* 녹화 · 소리는 기록만 하고 나중에 같은 엔진으로 굽는다 */
    cv = document.getElementById("cv"); cx = cv.getContext("2d", { alpha: false }); frameEl = document.getElementById("frame");
    allocBalls(BALLN);
    MINMIX = NOCKMIX;
    set("wm", window.AXF_WORDMARK || "AX Festival 2026");
    set("oLk7", lk7Html()); set("eLk7", lk7Html());
    resize(); window.addEventListener("resize", function () { resize(); });
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", function () { setTimeout(resize, 50); });
    document.body.classList.toggle("demo", CFG.mode === "demo");
    if (Q.has("hud")) document.body.classList.add("hud-on");
    if (document.fonts && document.fonts.load) document.fonts.load('800 400px "AXP"').then(function () { buildDigits(); refitAll(); }, function () { buildDigits(); }); else buildDigits();
    if (!DIG) buildDigits();
    if (SC === "restore") {
      rebuildBalls();
      var s = ST.scene, okBatch = ST.batch && ST.batch.length && ST.batch.every(function (id) { var r = resById(id); return r && r.st === "win"; });
      if ((s === "exit" || s === "reveal") && okBatch) { SC = "exit"; CAMD.a = 0; restoreReveal(); }
      else {
        if (ST.batch && ST.batch.length) { ST.batch = []; ST.pending = null; }
        if (s === "checkin") { DRM.mode = "spin"; scene("checkin"); if (ST.big != null) { LOAD.q = 0; } if (CFG.mode === "server") SRV.polling = setInterval(function () { if (SC === "checkin" && SRV.hasPool) serverLoad(function () {}); }, pollMs()); }
        else if (s === "card") { SC = "mix"; goCard(); }
        else if (s === "board") scene("board");
        else if (s === "end") { scene("mix"); goEnd(); }
        else if (s === "fin" && ST.fin) scene("fin");
        else if (s === "closed") scene("closed");
        else if (s === "intro") scene("idle");
        else { DRM.mode = "spin"; DRM.w = WMIX * 0.7; scene("mix"); }
        CAMD.a = camTarget() || 0;
      }
      var wasDrawing = s === "tension" || s === "spin" || ST.drawing; ST.drawing = 0;
      toast("이어서 진행합니다 · 당첨 " + ST.results.filter(function (r) { return r.st === "win"; }).length + "건" + (wasDrawing && SC === "mix" ? " · 감속 중이던 추첨은 결과 없이 다시 뽑습니다" : ""), true);
    } else { scene("idle"); ME.idleA = 1; }
    if (CFG.mode === "demo" && (!ST.pool || ST.pool.kind !== "demo")) { ST.pool = demoPool(CFG.demoN, ST.seed, CFG.demoT); uiPool(); }
    if (CFG.mode === "server" && ST.pool == null) serverLoad(function () { pushCtl(); });
    if (CFG.mode === "server" && ST.pool && !SRV.stateChecked) { SRV.stateChecked = true; serverState(); }
    if (SRV.queue.length) flushQueue();
    remoteBoot();
    if (CFG.mode === "server" && !SRV.polling && !ST.closed) SRV.polling = setInterval(function () { if ((SC === "idle" || SC === "checkin") && SRV.hasPool) serverLoad(function () { uiPool(); }); }, pollMs());
    if (REC) window.__rec = { frame: function (dt) { FPS.frames++; update(dt); render(); return T; }, t: function () { return T; }, sc: function () { return SC; }, sfx: function () { return SFX.log; }, act: act,
      info: function () { var c = REEL.cells[REEL.cells.length - 1]; return { sc: SC, sT: +sT().toFixed(2), round: ST.round, w: +DRM.w.toFixed(2), fake: c ? c.fake : -1, stop: c ? c.stops[3] : -1, reelT: REEL.on ? +(T - REEL.t0).toFixed(2) : -1 }; } };
    else requestAnimationFrame(loop);
    /* 시험 · 실측 도구(화면에 보이지 않는다 · 결과를 바꾸지 않는 읽기 위주) */
    window.__axs = {
      act: act, scene: function () { return SC; }, state: function () { return ST; }, cfg: function () { return CFG; },
      perf: function (reset) { var o = { tier: QL.tier, qlog: QL.log.slice(), fps: Math.round(FPS.v), long: PERF.long, worstMs: Math.round(PERF.worst * 1000), px: vw + "x" + vh, sc: {} };
        for (var k in PERF.sc) { var p = PERF.sc[k]; o.sc[k] = { avg: +(p.n / Math.max(1e-6, p.t)).toFixed(1), min1s: p.min1 === 999 ? null : +p.min1.toFixed(1), worstMs: Math.round(p.worst * 1000), sec: +p.t.toFixed(1) }; }
        if (reset) { PERF.sc = {}; PERF.long = 0; PERF.worst = 0; } return o; },
      info: function () { return { K: LAY.K, rows: LAY.rows, s: +LAY.s.toFixed(3), digitPx: Math.round(DIGH * LAY.s), balls: liveCount(), nb: NB, ph: EXP.ph, tickets: bigTickets().length, batch: (ST.batch || []).slice(), ack: Object.assign({}, ST.ack), ws: WSD.st, queue: SRV.queue.length, log: SRV.logStatus || "", status: SRV.status, tier: QL.tier, who: { busy: WHO.busy, fail: WHO.fail, off: WHO.off, got: ST.results.filter(function (r) { return !!r.fn; }).length } }; },
      ackTest: function (id, at) { setAck(id, at || "17:05"); return !!ST.ack[id]; },   /* 시험용 · 소켓 drawack 한 건을 흉내 */
      tier: function (t) { FORCEQ = -1; applyTier(t, "시험"); return QL.tier; },
      srv: function () { return { ws: WSD.st, wsGive: WSD.give, based: CMD.based, seq: cmdSeqOf("srv"), close: SRV.closeStatus || "", status: SRV.status, log: SRV.logStatus || "", queue: SRV.queue.length, state: SRV.stateStatus || "" }; },
      wsKill: function () { WSD.give = true; clearTimeout(WSD.t); if (WSD.ws) try { WSD.ws.close(); } catch (e) {} }
    };
  }
  window.addEventListener("DOMContentLoaded", boot);
})();
