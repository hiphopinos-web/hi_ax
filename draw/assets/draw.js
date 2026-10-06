/* ═══════════════════════════════════════════════════════════════════════════
 * AX Festival 2026 · Outro 럭키드로우 송출 화면 v3 (17F 대강당 · 16:9)
 *   v2(261001) = 공만 입체(assets/balls3d.js · WebGL2 · 정면 직교)
 *   v3(261001) = 물리적 개연성 · 통 = 유리 구(사용자 확정) · 공 하나 겨우 빠질 틈 하나가 통과 함께 돈다
 *                섞기 = 시계 방향으로 계속 돌고 공이 벽에 딸려 올라갔다 굴러 떨어진다(텀블링 · 도는 동안은 틈으로 빠지지 않는다)
 *                체크인 = 통이 천천히 돌다가 틈이 12시에 올 때 서서 그 틈으로 공을 묶어 넣는다
 *                추첨 = 감속해 틈을 6시에 세운다 → 중력으로 공 하나가 떨어진다(물리 결정) → 점 하나가 틈을 막고 다시 돈다
 *                떨어진 공을 카메라가 따라가 화면 가운데에서 바로 터진다 · 공을 옮겨 다니는 하이라이트 없음
 *                화면 = 균형 그리드(통 중심 600, 590 · 오른쪽 정보 단 1104~1800) · 대기 · 체크인 장면에 체크인 QR(인쇄하지 않는다)
 *   v3.1(261001) = 틈에 미닫이 문 · 섞는 동안 문이 닫혀 있어 틈은 벽이다(보이지 않는 처리 없음) · 통이 6시에 선 뒤 잠깐 쉬고 「철컥」 문이 옆으로 열린다
 *                → 처음 빠진 공이 당첨 → 문이 바로 닫힌다 · 체크인 · 되돌림 때도 12시에서 같은 문이 열리고 닫힌다
 *                글자 맞춤(fitText) · 이름 · 부서 · 경품 = 한 줄 맞춤 축소 → 최소 크기 아래면 두 줄 → 그래도 넘치면 말줄임 · 부서는 이름 아래 따로 줄
 *   v3.2(261002) = 공정성 · 섞기는 약 1.5초마다 방향을 바꿔 세게 돌린다(늦게 넣은 공이 머무는 바깥 고리를 깬다) · 공 면적 56 → 42%(굳은 가운데 없앰)
 *                누른 순간 거꾸로 돌고 있어도 속도를 이어받아 감속 · 최소 섞기 시간은 실제로 섞는 동안만 · 넣은 공의 주황 고리 없앰(사용자 요청)
 *   캔버스 3겹: #cv 스테이지 · 통 · 심볼 → #gl 공(구형 음영 · 구르면 번호가 표면을 따라 돈다 · 접지 그림자) → #fx 고리 · 입자 · 도트 레터링
 *   WebGL 이 안 되는 기계는 v1 의 2D 공 그림으로 자동 대체한다(행사가 멈추지 않게)
 *   디자인 정본 = AX페스티벌/design.md v29 (블랙·오렌지 스테이지 · 도트 격자 · KV 오브젝트 · 글자 정지 · 점으로 모이고 흩어진다)
 *   홍보부 원본 = assets/axf_engine.js (01 Me to WE · 02 Circle 좌표·계산식) · assets/wordmark.js (09 워드마크 아웃라인)
 *   공 1개 = 응모권 1장(4·5·6개 스탬프 = 1·2·3장, 번호 0001~9999 · 서버 raffle 원장과 같은 형식)
 *   당첨 = 6시 틈을 처음 통과한 공(연출이 곧 결과) · 버튼 순간 crypto.getRandomValues 로 물리 난수를 다시 심고 감속 시간과 모든 공을 흔든다
 *   당첨 · 부재로 빠진 분의 공은 감속 전에 통에서 이미 빠져 있다(1인 1회) · 마감 뒤 첫 추첨은 10초 이상 섞은 다음 · 안 떨어지면 통을 살짝 흔든다
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var Q = new URLSearchParams(location.search);
  var REC = Q.has("rec"), BENCH = +Q.get("bench") || 0, CLIP = Q.has("clip"), NOGL = Q.has("nogl");
  var FORCEQ = Q.has("q") ? +Q.get("q") : -1, QSTART = Q.has("qs") ? +Q.get("qs") : -1, QPAL = Q.has("pal") ? +Q.get("pal") : 0;
  var CONTROL = location.hash === "#control";
  if (CONTROL) { window.addEventListener("DOMContentLoaded", function () { window.AXDRAW_CONTROL && window.AXDRAW_CONTROL(); }); return; }

  /* ─────────────── 상수 · 무대 좌표(1920×1080 논리 좌표) ─────────────── */
  var W0 = 1920, H0 = 1080, PITCH = 30;               /* 도트 격자 = 폭/64 */
  var DX = 600, DY = 590, DR = 392;                     /* 추첨 통(원) 중심·안쪽 반지름 · v3 균형 그리드(왼쪽 단 가운데 · 세로 가운데 = 오른쪽 정보 블록 가운데) */
  /* v3 · 통에 공 하나 겨우 빠질 틈 하나(통과 함께 돈다)
   *   체크인 = 틈을 12시에 세우고 위에서 공을 넣는다 · 섞기 = 시계 방향으로 계속 돈다(틈이 움직여 공이 빠지지 못한다)
   *   추첨 = 감속해 틈을 6시에 세운다 → 중력으로 공 하나가 떨어진다 → 그 순간 점 하나가 틈을 막고 통이 다시 돈다 */
  var TOP = -Math.PI / 2, SIX = Math.PI / 2, GAPW = 1.12;   /* 틈 폭 = 공 지름 × 1.12 */
  var C = { o: "#FF7E31", o7: "#FF7F32", hi: "#FF963E", pu: "#E6CCFF", o50: "#FFB284", o25: "#FFD8C1", w: "#FFFFFF", k: "#000000", g: "#6B6B6B" };
  var FONT = '"AXP", "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
  var LS_CFG = "axfDraw.cfg.v1", LS_ST = "axfDraw.state.v1";

  /* ─────────────── 설정 (조작 창에서 바꾼다 · 기본값은 결정 대기 항목) ─────────────── */
  var DEF = {
    mode: "demo",            /* demo | server */
    demoN: 170,              /* 데모 참가자 수 */
    demoRate: 9,             /* 데모 체크인 속도(명/초 최대) */
    rounds: [                /* 경품 단계 · v5.03 행운권 1~6등 10명(261002 · 경품/[26-10] AX Festival 상품.pdf 4쪽) · 이름 = 앱 PRIZES · 6등부터 1등 순 · 조작 창에서 바꾼다(이미 저장한 기기는 그 값) */
      { name: "6등", prize: "현대백화점 상품권 10만원", count: 3 },
      { name: "5등", prize: "풀리오 종아리 마사지기", count: 2 },
      { name: "4등", prize: "에어팟 4", count: 2 },
      { name: "3등", prize: "미닉스 음식물 처리기", count: 1 },
      { name: "2등", prize: "신라호텔 파크뷰 뷔페 식사권 2매", count: 1 },
      { name: "1등", prize: "아이패드", count: 1 }
    ],
    minMix: [[0, 30], [5, 20], [10, 10]],   /* 마감 뒤 첫 추첨 최소 섞기 · [체크인 분 이상, 초] · 실제 행사(약 20분) = 10초 · 짧은 체크인(리허설)은 더 길게(공정성 시험 simck · 261001 확정) */
    onePerPerson: true,      /* 1인 1회 당첨 · 당첨 즉시 그 사람의 나머지 공을 뺀다 */
    absentRemove: true,      /* 재추첨(부재) 때 그 사람의 공을 뺀다 */
    checkinOnly: true,       /* 체크인한 사람만 대상 · 끄면 응모권 보유자 전원 */
    nameMode: "mask",        /* mask(홍*동) | none(번호만) */
    showDept: false,
    tickerNames: true,       /* 체크인 티커에 가린 이름 */
    beat: true,
    intro: true,             /* 첫 Space 에 실사 인트로 1회(261001 확정) · 건너뛰기 = Space */
    pal: 1,                  /* 색 대비 · 1 = 통 무채색 + 오렌지 공(261001 사용자 확정) · 2 = 통 오렌지 + 크림 공(비교안 보관 · ?pal=2) */
    server: "",
    ckUI: false,             /* 261006 사용자 결정 「럭키드로우에서 체크인 요소는 일단 없앤다 · 행운권 중에서 추첨」 · false = 체크인 QR · 체크인 인원 · 티커를 숨기고 「행운권 번호 전체에서 추첨」(서버 설정 행운권_참석조건과 무관) · true = 옛 체크인 화면(코드 보존 · 조작 창 또는 ?ck=1) */
    ballMax: 1000,           /* 261006 통에 보이는 공 상한(ckUI false 일 때) · 행운권이 더 많으면 무작위 대표 공만 넣고 당첨은 행운권 전체에서 암호 난수로 정한다(위험 R6 · 공 5,000개는 통이 굳어 섞이지 않는다) */
    roundsV: "261002"        /* 경품 단계 판 · 저장값의 판이 이와 다르면(옛 ROUND 01 표 등) 버리고 위 표를 쓴다(261004) · 조작 창에서 고치면 이 판으로 저장된다 */
  };
  var CFG = load(LS_CFG, null);
  if (CFG && CFG.rounds && CFG.roundsV !== DEF.roundsV) { delete CFG.rounds; delete CFG.roundsV; }
  CFG = Object.assign(JSON.parse(JSON.stringify(DEF)), CFG || {});
  if (REC || BENCH) CFG = JSON.parse(JSON.stringify(DEF));
  if (REC) { CFG.rounds = [{ name: "ROUND 01", prize: "경품 A", count: 2 }, { name: "FINAL", prize: "경품 C", count: 1 }]; CFG.demoRate = 20; CFG.ckUI = true; }   /* 쇼릴 대본 전용(옛 체크인 대본 그대로) */
  if (QPAL) CFG.pal = QPAL;
  if (Q.has("ck")) CFG.ckUI = Q.get("ck") === "1";                   /* 시험용 · ?ck=1 옛 체크인 화면 · ?ck=0 행운권 전체 */
  if (+Q.get("demo") > 0) CFG.demoT = Math.min(9000, +Q.get("demo"));   /* 시험용 · ?demo=5000 = 데모 행운권 5,000장(사람 수는 1~3장씩 맞춘다) */
  if (+Q.get("bmax") > 0) CFG.ballMax = +Q.get("bmax");
  function NOCK() { return !CFG.ckUI; }                                 /* 체크인 요소 없음(기본) */
  function ballCap() { return clamp(+CFG.ballMax || 1000, 100, 4000); }
  if (Q.get("remote") === "1" && !REC && !BENCH) CFG.mode = Q.get("mode") === "demo" ? "demo" : "server";   /* 콘솔이 여는 원격 화면(../draw/?remote=1) = 서버 모드 · 모의 시험은 &mode=demo */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ─────────────── 난수 ─────────────── */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rng = mulberry(REC ? 20261026 : (Date.now() & 0xffffff));
  /* v3 · 추첨 버튼 순간 · 암호 난수 n 개(0..1) · 물리 난수 씨앗도 여기서 다시 심는다(녹화 모드만 고정 씨앗) */
  function cryptoUnits(n) {
    var out = new Float64Array(n), k = 0;
    if (REC) { for (; k < n; k++) out[k] = rng(); return out; }
    while (k < n) { var m = Math.min(16384, n - k), a = new Uint32Array(m); crypto.getRandomValues(a); for (var j = 0; j < m; j++) out[k++] = a[j] / 4294967296; }
    return out;
  }
  function hash(i) { var v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function EO(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function EIO(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function EOB(x) { x = clamp(x, 0, 1); var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function pad4(n) { return ("000" + n).slice(-4); }
  function mask(n) {                                   /* 서버 maskName_ 과 같은 규칙 · 김하나 → 김*나 · 남궁하나 → 남**나 */
    n = String(n || ""); if (!n) return "";
    if (n.length <= 1) return n; if (n.length === 2) return n.charAt(0) + "*";
    return n.charAt(0) + new Array(n.length - 1).join("*") + n.charAt(n.length - 1);
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ─────────────── 추첨 상태 (새로고침·브라우저 재시작에도 이어진다) ───────────────
   * pool.people[pk] = { nm, dp, nos:[번호…] } · arrived = 체크인 순서 · results = 당첨 기록(결정 즉시 저장 · 새로고침으로 다시 뽑을 수 없다) */
  var ST = (REC || BENCH) ? null : load(LS_ST, null);
  if (!ST || ST.v !== 1) ST = { v: 1, seed: REC ? 20261026 : Math.floor(Math.random() * 1e9), scene: "idle", pool: null, arrived: [], closed: false, round: 0, results: [], out: {}, src: CFG.mode };
  function persist() { if (!REC && !BENCH) save(LS_ST, ST); pushCtl(); }

  /* ─────────────── 데이터 어댑터 ─────────────── */
  var SUR = "김이박최정강조윤장임한오서신권황안송류홍전고문양손배백허유남심노하곽성차주우구민진나지엄원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용".split("");
  var GIV = "민서준우지현수아은도윤하예진서연주원시영태경가채유호재성다온나혜인소희동건규빈승환정미선지훈석".split("");
  var DEPT = ["경영지원", "디지털전략", "장기보험", "자동차보험", "일반보험", "리스크관리", "재무", "인사총무", "영업기획", "보상서비스"];
  function demoPool(n, seed, maxT) {
    var r = mulberry(seed), people = {}, order = [], used = {}, tot = 0;
    if (maxT) n = maxT;                                /* 261006 · 행운권 장수로 만든다(?demo=5000) */
    for (var i = 0; i < n && !(maxT && tot >= maxT); i++) {
      var k = r() < 0.5 ? 1 : r() < 0.6 ? 2 : 3;      /* 응모권 1장 50% · 2장 30% · 3장 20% (가정) */
      var nm = SUR[Math.floor(r() * SUR.length)] + GIV[Math.floor(r() * GIV.length)] + GIV[Math.floor(r() * GIV.length)];
      var nos = [];
      if (maxT) k = Math.min(k, maxT - tot); tot += k;
      while (nos.length < k) { var no = 1 + Math.floor(r() * 9999); if (used[no]) continue; used[no] = 1; nos.push(pad4(no)); }
      var pk = "d" + i;
      people[pk] = { nm: nm, dp: DEPT[Math.floor(r() * DEPT.length)], nos: nos };
      order.push(pk);
    }
    return { people: people, order: order, kind: "demo" };
  }

  /* 서버 · JSONP(콘솔과 같은 방식) · 주소는 ../assets/server.js 의 AXF_SERVER */
  var SRV = { status: "", polling: null, since: "", queue: load("axfDraw.q", []) };
  function jsonp(action, params, done) {
    var url = CFG.server || window.AXF_SERVER || "";
    if (!url) { done({ ok: false, reason: "noserver" }); return; }
    var name = "__axd" + Math.floor(Math.random() * 1e9), sc = document.createElement("script"), q = [];
    params = Object.assign({}, params, { action: action, callback: name, _: Date.now() });
    var code = sessionKey(); if (code) params.key = code;
    for (var k in params) if (params[k] != null) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    var timer = setTimeout(function () { clean(); window[name] = function () {}; done({ ok: false, reason: "timeout" }); }, 15000);   /* 늦게 온 응답이 오류를 내지 않게 빈 함수를 남긴다 */
    function clean() { clearTimeout(timer); try { delete window[name]; } catch (e) { window[name] = undefined; } if (sc.parentNode) sc.parentNode.removeChild(sc); }
    window[name] = function (res) { clean(); done(res || { ok: false }); };
    sc.onerror = function () { clean(); done({ ok: false, reason: "network" }); };
    sc.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + q.join("&");
    document.head.appendChild(sc);
  }
  function pollMs() { return NOCK() ? 30000 : 3000; }   /* 261006 · 체크인 없음 = 대기 화면 숫자만 바뀐다 · 30초(행운권 전체 읽기는 서버에서 수 초 걸린다 · 서버 부하를 늘리지 않는다) */
  function sessionKey() { try { return sessionStorage.getItem("axfDraw.key") || ""; } catch (e) { return ""; } }
  /* 서버 풀 읽기 · 새 액션 draw_pool(체크인 명단 + 가린 이름) 이 있으면 그것, 없으면 기존 raffle_list(응모권 전원 · 이름 없음) */
  function serverLoad(done) {
    if (SRV.loading) { done(false); return; }          /* 261006 · 참석 조건 OFF 면 한 번에 수 초(행운권 전체) · 앞 요청이 끝나기 전에 또 보내지 않는다 */
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
          if (NOCK()) return;                          /* 261006 · 체크인 없음 · 공은 「추첨 준비」 때 nockQueue 가 한꺼번에 넣는다 */
          if (r.in && CFG.checkinOnly && !ST.closed) queueArrival(r.pk);
          else if (r.in && CFG.checkinOnly && ST.closed) lateIn(r.pk);
        });
        SRV.since = res.cursor || SRV.since; SRV.balls = res.balls; SRV.all = !!res.all;
        if (NOCK()) { if (SC === "checkin" && !ST.closed) nockQueue(); }
        else if (!CFG.checkinOnly) ST.pool.order.forEach(queueArrival);
        uiPool();
        if (!SRV.stateChecked) { SRV.stateChecked = true; serverState(); }
        done(true); return;
      }
      if (res && res.err === "unknown action") {
        jsonp("raffle_list", {}, function (r2) {
          if (!r2 || !r2.ok) { SRV.status = "실패 · " + (r2 && (r2.reason || r2.err) || "응답 없음"); done(false); return; }
          SRV.status = "raffle_list(체크인 없음 · 응모권 전원 · 이름 없음)"; SRV.hasPool = false;
          var people = {}, order = [], first = {};
          r2.rows.forEach(function (x) {
            var pk = "e" + x.emp;                    /* 사번은 화면에 쓰지 않는다 · 한 사람의 공을 묶는 열쇠로만 */
            if (!people[pk]) { people[pk] = { nm: "", dp: "", nos: [] }; order.push(pk); first[pk] = x.ts; }
            people[pk].nos.push(String(x.no));
          });
          order.sort(function (a, b) { return String(first[a]).localeCompare(String(first[b])); });
          ST.pool = { people: people, order: order, kind: "server" };
          if (NOCK()) { if (SC === "checkin" && !ST.closed) nockQueue(); } else order.forEach(queueArrival);
          uiPool();
          done(true);
        });
        return;
      }
      SRV.status = "실패 · " + (res && (res.reason || res.err) || "응답 없음"); done(false);
    });
  }
  /* 마감 뒤 체크인 · 화면에는 넣지 않고 개수만 센다(마감은 마감) */
  function lateIn(pk) { if (ST.arrived.indexOf(pk) < 0) { SRV.lateSeen = SRV.lateSeen || {}; if (!SRV.lateSeen[pk]) { SRV.lateSeen[pk] = 1; SRV.late = (SRV.late || 0) + 1; } } }
  /* 예비 노트북 복원 · 이 브라우저에 기록이 없는데 서버 추첨기록이 있으면 그대로 가져온다(같은 당첨을 다시 뽑지 않게) */
  function serverState() {
    jsonp("draw_state", {}, function (res) {
      if (!res || !res.ok) { SRV.stateStatus = "draw_state 실패 · " + (res && (res.reason || res.err) || "응답 없음"); return; }
      SRV.stateStatus = "draw_state " + (res.n || 0) + "줄";
      if (ST.results.length || !res.rows || !res.rows.length) return;
      var byId = {}, list = [];
      res.rows.forEach(function (r) {
        if (r.st === "undo") { if (byId[r.id]) byId[r.id].st = "undone"; return; }
        var x = byId[r.id];
        if (!x) { x = { id: r.id, round: +r.round || 0, slot: +r.slot || 1, no: String(r.no), pk: r.pk, nm: "", dp: "", prize: r.prize, rname: "", at: r.at, st: r.st, pool: 0, srv: 1 }; byId[r.id] = x; list.push(x); }
        else x.st = r.st;
        var pp = ST.pool && ST.pool.people[r.pk]; if (pp) x.nm = pp.nm;
      });
      ST.results = list;
      list.forEach(function (x) { if (x.st === "win" && CFG.onePerPerson) ST.out[x.pk] = "win"; if (x.st === "absent" && CFG.absentRemove) ST.out[x.pk] = "absent"; });
      var rs = rounds(); ST.round = 0;
      while (ST.round < rs.length - 1 && roundWins(ST.round).length >= rs[ST.round].count) ST.round++;
      persist(); toast("서버 추첨기록 " + list.length + "건을 이어받았습니다", true);
    });
  }
  /* 당첨 기록 전송 · 새 액션 draw_log · 없거나 끊기면 로컬 큐에 두고 다시 보낸다(화면 진행은 막지 않는다) */
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

  /* ─────────────── 캔버스 · 뷰 변환 ─────────────── */
  var cv, cx, glEl, fxEl, fx, GL = null, vw = 0, vh = 0, dpr = 1, vs = 1, vox = 0, voy = 0, frameEl;
  var gridBlack = null, gridOrange = null, BASEVS = 0, FRS = { s: 1, ox: 0, oy: 0 };
  function resize() {
    var w = REC ? 1920 : window.innerWidth, h = REC ? 1080 : window.innerHeight;
    dpr = REC ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    var px = w * h * dpr * dpr, cap = 2560 * 1440;       /* 4K 노트북에서도 내장 그래픽이 버티게 픽셀 수 상한 */
    if (px > cap) dpr *= Math.sqrt(cap / px);
    vw = Math.round(w * dpr); vh = Math.round(h * dpr);
    cv.width = vw; cv.height = vh; fxEl.width = vw; fxEl.height = vh;
    [cv, fxEl, glEl].forEach(function (c) { c.style.width = w + "px"; c.style.height = h + "px"; });
    var s = Math.min(w / W0, h / H0);
    vs = s * dpr; vox = (w - W0 * s) / 2 * dpr; voy = (h - H0 * s) / 2 * dpr; BASEVS = vs;
    frameEl.style.transform = "translate(" + (w - W0 * s) / 2 + "px," + (h - H0 * s) / 2 + "px) scale(" + s + ")";
    FRS.s = s; FRS.ox = (w - W0 * s) / 2; FRS.oy = (h - H0 * s) / 2;
    ["vIntro", "vBurst"].forEach(function (id) { var v = document.getElementById(id); if (v) v.style.transform = frameEl.style.transform; });
    gridBlack = makeGrid("black"); gridOrange = makeGrid("orange");
    atlas.key = "";
    if (GL) GL.resize(vw, vh, vs, vox, voy);
  }
  /* 도트 격자 · 움직이지 않는다 · 1.5% 점등(design.md §2) · 레터박스 바깥까지 같은 격자로 채운다 */
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

  /* ─────────────── 스테이지 · 하프톤 전환(격자 점이 자라서 면이 된다 · 컷·와이프 대신) ─────────────── */
  var STG = { base: "black", to: null, t0: 0, dur: 0.6, ox: 0, oy: 0 };
  function stageTo(to, ox, oy, dur) {
    if (STG.base === to && !STG.to) return;
    STG.to = to; STG.t0 = T; STG.dur = dur || 0.6; STG.ox = ox == null ? 960 : ox; STG.oy = oy == null ? 540 : oy;
    STG.flipAt = T + STG.dur * 0.45;
  }
  function drawStage() {
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.drawImage(STG.base === "black" ? gridBlack : gridOrange, 0, 0);
    if (!STG.to) return;
    var p = (T - STG.t0) / STG.dur;
    if (STG.flipAt && T >= STG.flipAt) { document.body.classList.toggle("st-orange", STG.to === "orange"); STG.flipAt = 0; }
    if (p >= 1) { STG.base = STG.to; STG.to = null; cx.drawImage(STG.base === "black" ? gridBlack : gridOrange, 0, 0); return; }
    /* 원점에서 퍼지는 파면 · 파면 뒤의 점이 격자 칸을 덮을 만큼 자란다 */
    var pp = PITCH, band = 520, maxD = 2300, front = EIO(p) * (maxD + band);
    var colr = STG.to === "orange" ? C.o : C.k;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.fillStyle = colr; cx.beginPath();
    var xs = -vox / vs, ys = -voy / vs, xe = (vw - vox) / vs, ye = (vh - voy) / vs;
    var sx0 = Math.floor(xs / pp) * pp + pp / 2, sy0 = Math.floor(ys / pp) * pp + pp / 2;
    for (var y = sy0; y < ye + pp; y += pp) for (var x = sx0; x < xe + pp; x += pp) {
      var d = Math.hypot(x - STG.ox, y - STG.oy), u = clamp((front - d) / band, 0, 1);
      if (u <= 0) continue;
      var r = u * pp * 0.74;
      cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
    }
    cx.fill();
  }

  /* ─────────────── 물리 · Verlet + 공간 격자 (공 수천 개 60fps) ───────────────
   * 상태 bs: 0 없음 · 1 떨어지는 중(통 밖) · 2 통 안 · 3 당첨 공(키네마틱) */
  var MAXB = 8192;
  var bx = new Float32Array(MAXB), by = new Float32Array(MAXB), bpx = new Float32Array(MAXB), bpy = new Float32Array(MAXB);
  var ba = new Float32Array(MAXB), bph = new Float32Array(MAXB), bborn = new Float32Array(MAXB), bland = new Float32Array(MAXB);
  var bs = new Uint8Array(MAXB), bno = new Array(MAXB), bpk = new Array(MAXB), bnoI = new Int32Array(MAXB);
  var bq = new Float32Array(MAXB * 4), bflag = new Uint8Array(MAXB), bcont = new Uint8Array(MAXB), bao = new Float32Array(MAXB), bnum = new Float32Array(MAXB);
  var NB = 0, R = 22, RT = 22, nAlive = 0, nInside = 0;
  var MIX = { e: 0, target: 0, w: 0.2, rot: 0 };       /* e = 섞기 세기(통 회전 목표) · w = 통 각속도(rad/s · + = 시계 방향) · rot = 통 회전각(벽 속도와 같다) */
  var GAP = { a0: TOP, live: false, pull: 0 };          /* 틈 각도 = a0 + rot · live = 이번 추첨에서 통과를 받는 중 */
  /* v3.1 · 틈의 미닫이 문(통과 함께 돈다) · v = 열린 정도 0..1 · 닫혀 있으면 틈 자리는 그냥 벽이다
   *   문은 넣을 때(12시)와 뽑을 때(6시 · 정지 뒤 DOORWAIT 초)만 열린다 · 처음 빠진 공이 지나가면 바로 닫힌다(물리는 그 스텝에 닫힘 · 그림은 0.12초) */
  var DOOR = { v: 0, tgt: 0, openT: -1 }, DOORWAIT = 0.55, DOOROPEN = 0.26, DOORSHUT = 0.12;
  function doorOpen() { return DOOR.tgt === 1 && DOOR.v >= 0.9; }   /* 문이 공 지름 이상 열린 다음부터 통과 */
  function doorSet(open, vol) {
    var t = open ? 1 : 0; if (DOOR.tgt === t) return;
    DOOR.tgt = t; DOOR.openT = -1;
    if (!MC.on && vol !== 0) SFX.play("hatch", open ? 1 : 0, vol == null ? 1 : vol);
  }
  function stepDoor(h) {
    if (DOOR.tgt) { DOOR.v = Math.min(1, DOOR.v + h / DOOROPEN); if (DOOR.v >= 0.9 && DOOR.openT < 0) DOOR.openT = T; }
    else DOOR.v = Math.max(0, DOOR.v - h / DOORSHUT);
  }
  var DRM = { mode: "spin", at: 0, rock: 0, hold: 0 };   /* 통 움직임 · spin 돈다 · park 감속해 세운다 · hold 서 있다(at = 세운 방향) */
  var PARK = { th0: 0, D: 0, Td: 1, k: 1, t0: 0, at: 0 };
  var TUNE = { fill: 0.42, wmix: 1.4, fins: 0, finL: 2.6, surge: 0, surgeW: 4, surgeA: 3, rest: 0, restV: 0.08 };   /* fins = 통 안쪽 날개 수(통돌이 세탁조처럼 공을 들어 올려 뿌린다 · 섞임) · finL = 날개 길이(공 반지름 배수) */
  function finLen() { return Math.max(TUNE.finL * R, 34); }
  /* 날개 · 틈에서 360/(n+1) 간격 · 벽에서 안쪽으로 짧게 · 통과 함께 돈다 */
  function finAng(k) { return gapAng() + (k + 1) * 6.2832 / (TUNE.fins + 1); }
  function finPush(i, rr) {
    var L = finLen(), ft = 3, any = false;
    for (var k = 0; k < TUNE.fins; k++) {
      var a = finAng(k), c = Math.cos(a), sn = Math.sin(a), x1 = DX + c * DR, y1 = DY + sn * DR, x0 = DX + c * (DR - L), y0 = DY + sn * (DR - L);
      var ux = x1 - x0, uy = y1 - y0, wx = bx[i] - x0, wy = by[i] - y0, tt = clamp((wx * ux + wy * uy) / (L * L), 0, 1);
      var px = x0 + ux * tt, py = y0 + uy * tt, dx = bx[i] - px, dy = by[i] - py, d = Math.hypot(dx, dy), m = rr + ft;
      if (d < m && d > 1e-6) { var q = (m - d) / d; bx[i] += dx * q; by[i] += dy * q; any = true; }
    }
    return any;
  }                 /* 통 안 공 면적 비율 · 섞기 각속도(0.2 + wmix) */
  var KICK = { p: 0.004, v: 0.3 };                      /* 도는 동안 공이 가끔 튄다(스텝당 확률 · 반지름 배수 속도) · 섞임을 돕는다(공정성 시험으로 값을 정했다) */
  var FRIC = 0.08, WALLK = 0.12;                        /* 공끼리 · 벽과 공의 마찰(통이 돌면 공이 딸려 올라간다) */
  function gapAng() { return GAP.a0 + MIX.rot; }
  function gapHalfW() { return R * GAPW; }              /* 틈 반폭(px) */
  function gapEdgeA() { return Math.asin(Math.min(0.99, gapHalfW() / DR)); }   /* 틈 끝점의 각도 반폭 */
  function angDiff(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
  /* 감속해 틈을 at 방향에 세운다 · 3차 에르밋 곡선 · 시작 속도는 지금 속도 · 끝 속도 0 · stretch = 감속 시간 배율(추첨 때 암호 난수)
   * v3.2 · 섞기가 앞뒤로 도니 누른 순간 통이 거꾸로 돌고 있을 수 있다 · 시작 속도를 부호 그대로 이어받는다(k < 0 이면 잠깐 거꾸로 가다가 돌아서 선다 · 순간 반전 없음) */
  function startPark(at, minD, stretch, tmin, tmax) {
    var w0 = Math.max(Math.abs(MIX.w), 0.25), ws = MIX.w < 0 ? -w0 : w0, D = ((at - gapAng()) % 6.2832 + 6.2832) % 6.2832;
    while (D < minD) D += 6.2832;
    PARK.th0 = MIX.rot; PARK.D = D; PARK.at = at; PARK.t0 = T;
    PARK.Td = clamp(D / w0 * (stretch || 1), tmin || 0.8, tmax || 2.0); PARK.k = clamp(ws * PARK.Td / D, -3, 3);   /* k < 1 이면 한 번 빨라졌다가 선다 */
    DRM.mode = "park"; DRM.at = at;
  }
  /* 통 움직임 · spin = 각속도가 목표로(체크인 0.8 · 대기 0.2 · 섞기 1.6 rad/s) · park = 감속해 틈을 세운다 · hold = 서 있다
   * 체크인 중에도 통은 천천히 돈다 · 넣을 공이 있으면 틈이 12시로 다가올 때 자연스럽게 감속해 세우고, 그 틈으로 묶어서 넣은 뒤 다시 돈다(최대 2.6초)
   * 체크인 밖(재추첨 · 취소로 돌아오는 공)은 바로 틈을 12시에 세운다 · 추첨 배출 뒤에는 0.35초 뒤 다시 돈다 */
  var NOCKMIX = 10, LOADW = 0.8, MIXT = 0, MIXSKIP = false, MIXSKIPAT = 0, MINMIX = 10, CHKSIM = false, DROPT = 0;
  function minMixFor(m) { if (REC) return 10; var r = CFG.minMix && CFG.minMix.length ? CFG.minMix : DEF.minMix, v = 10;   /* 쇼릴(녹화)은 10초 고정 */ r.forEach(function (x) { if (m >= x[0]) v = x[1]; }); return v; }
  function dropsDue() { for (var k = 0; k < DROPS.length; k++) if (DROPS[k].at <= T) return true; return false; }
  /* v3.2 · 섞기 = 통을 앞뒤로 번갈아 세게 돌린다(세탁조처럼 · 한쪽 약 1.5초 · 2.2 rad/s · 빠르게 방향을 바꾼다)
   *   원인(공정성 조사 261002): 한 방향으로만 돌면 위 표면 → 벽 → 다시 위 표면으로 도는 바깥 고리가 생기고, 나중에 넣은 공은 위에 얹혀 이 고리에 머문다
   *   6시 틈은 이 고리(벽에 붙은 공)에서 공을 받으므로 늦게 체크인한 공이 유리했다(공 1,000개 · 5분 체크인 · 마지막 10% 약 1.5배)
   *   방향을 바꿀 때마다 표면층이 반대편에서 무너져 내린 공 밑에 묻히고 새 표면이 생긴다 → 표면 · 벽 고리가 몇 초 만에 통 전체와 섞인다
   *   방향 전환 간격은 매번 조금씩 흔든다(0.85~1.15배)
   *   체크인 중에는 예전처럼 천천히 한 방향으로 돈다(QR 을 찍는 동안 화면이 차분하게)
   *   AG.ckb = 공을 넣고 문을 닫은 직후 흔드는 초(넣고 흔든다) · 시험해 보니 3초로 두면 마지막에 넣은 공이 묻혀 오히려 불리해져(공 300개 · 5분 · 10초 섞기 카이제곱 20) 0(끔)으로 둔다 */
  var AG = { on: 1, w: 2.2, half: 1.5, k: 10, ph: 0, dir: 1, len: 1.5, ckb: 0, bu: 0 };
  function agitating(chk) { return AG.on && (chk ? T < AG.bu : MIX.e >= 0.6); }
  function spinStep(dt, chk) {
    var wt, kk = 1.5;
    if (!agitating(chk)) { wt = chk ? LOADW : 0.2 + TUNE.wmix * MIX.e; AG.ph = 0; AG.dir = 1; AG.len = AG.half; }
    else {
      AG.ph += dt; if (AG.ph >= AG.len) { AG.ph -= AG.len; AG.dir = -AG.dir; AG.len = AG.half * (0.85 + 0.3 * rng()); }
      wt = AG.dir * AG.w; kk = AG.k;
    }
    MIX.w += (wt - MIX.w) * Math.min(1, dt * kk); MIX.rot += MIX.w * dt;
  }
  function drumStep(dt, chk) {
    var due = dropsDue();
    if (DRM.mode === "spin") {
      spinStep(dt, chk);
      if (due && SC !== "tension" && SC !== "exit") {
        var D = ((TOP - gapAng()) % 6.2832 + 6.2832) % 6.2832;
        if (!chk || NOCK()) startPark(TOP, 0.4, 0.9, 0.9, 1.8);   /* 261006 · 한꺼번에 넣을 때는 바로 12시로 */
        else if (D > 0.3 && D < 0.75 && T >= AG.bu) startPark(TOP, 0.2, 1, 0.4, 1.6);   /* 틈이 12시로 다가올 때만 · 남은 각도만큼 자연스럽게 선다 · 흔드는 중이면 끝난 뒤 */
      }
    } else if (DRM.mode === "park") { if (SC !== "tension" || CHKSIM) stepPark(); }
    else if (DRM.mode === "hold") {
      MIX.w = 0;
      if (DRM.at === TOP) {
        var held = T - DRM.t0, more = due && !(chk && !NOCK() && held > 2.6);
        if (more || nFalling) doorSet(1, chk || CHKSIM ? 0.35 : 0.7);   /* 12시 · 문을 열고 넣는다(체크인 중에는 작게) */
        else if (held > 0.35) { doorSet(0, chk || CHKSIM ? 0.35 : 0.7); if (DOOR.v <= 0.02) { DRM.mode = "spin"; if (chk) AG.bu = T + AG.ckb; } }   /* 다 넣으면 닫고 다시 돈다 · 체크인 중이면 먼저 흔든다 */
      }
      if (DRM.at === SIX && DRW.resume && T >= DRW.resume) { DRW.resume = 0; DRM.mode = "spin"; }
    }
  }
  function stepPark() {
    var u = clamp((T - PARK.t0) / PARK.Td, 0, 1), k = PARK.k;
    var f = k * u + (3 - 2 * k) * u * u + (k - 2) * u * u * u, fp = (1 - u) * (k + (6 - 3 * k) * u);
    MIX.rot = PARK.th0 + PARK.D * f; MIX.w = PARK.D / PARK.Td * fp;
    if (u >= 1) { DRM.mode = "hold"; DRM.hold = MIX.rot; DRM.t0 = T; MIX.w = 0; return true; }
    return false;
  }
  var PH = { acc: 0, h: 1 / 120, impacts: 0, impactV: 0, ms: 0 };
  var ORD = new Int32Array(MAXB), ORDN = -1;
  var grid = { cs: 0, gw: 0, gh: 0, x0: 0, y0: 0, cnt: null, idx: null, cell: new Int32Array(MAXB) };
  var ballOfNo = {};
  function addBall(no, pk, x, y, vx, vy, st) {
    var i = NB++;
    if (i >= MAXB) { NB--; return -1; }
    bx[i] = x; by[i] = y; bpx[i] = x - (vx || 0) * PH.h; bpy[i] = y - (vy || 0) * PH.h;
    ba[i] = rng() * 6.28; bph[i] = hash(i + 1); bborn[i] = T; bland[i] = -9; bs[i] = st || 1; bno[i] = no; bpk[i] = pk; bnoI[i] = +no;
    bnum[i] = numOf(no); bflag[i] = 0; bao[i] = 1; bcont[i] = 0; randQuat(i);
    ballOfNo[no] = i;
    return i;
  }
  function killBall(i) { if (bs[i]) { bs[i] = 0; bflag[i] = 0; delete ballOfNo[bno[i]]; } }
  function numOf(no) { var d = String(no || "").replace(/\D/g, ""); return d ? +d.slice(-4) : 0; }
  function randQuat(i) {                               /* 균등 무작위 회전 · 번호 면이 처음부터 제각각 */
    var u1 = rng(), u2 = rng() * 6.2832, u3 = rng() * 6.2832, a = Math.sqrt(1 - u1), b = Math.sqrt(u1), o = i * 4;
    bq[o] = a * Math.sin(u2); bq[o + 1] = a * Math.cos(u2); bq[o + 2] = b * Math.sin(u3); bq[o + 3] = b * Math.cos(u3);
  }
  function integQuat(o, wx, wy, wz, dt) {
    var qx = bq[o], qy = bq[o + 1], qz = bq[o + 2], qw = bq[o + 3], hd = 0.5 * dt;
    var nx = qx + hd * (wx * qw + wy * qz - wz * qy), ny = qy + hd * (wy * qw + wz * qx - wx * qz), nz = qz + hd * (wz * qw + wx * qy - wy * qx), nw = qw - hd * (wx * qx + wy * qy + wz * qz);
    var l = Math.sqrt(nx * nx + ny * ny + nz * nz + nw * nw);
    if (!(l > 1e-6)) { bq[o] = 0; bq[o + 1] = 0; bq[o + 2] = 0; bq[o + 3] = 1; return; }
    bq[o] = nx / l; bq[o + 1] = ny / l; bq[o + 2] = nz / l; bq[o + 3] = nw / l;
  }
  function slerpTo(o, q, s) {                          /* nlerp · 짧은 쪽으로 */
    var d = bq[o] * q[0] + bq[o + 1] * q[1] + bq[o + 2] * q[2] + bq[o + 3] * q[3], sg = d < 0 ? -1 : 1, k;
    for (k = 0; k < 4; k++) bq[o + k] += (q[k] * sg - bq[o + k]) * s;
    var l = Math.hypot(bq[o], bq[o + 1], bq[o + 2], bq[o + 3]) || 1;
    for (k = 0; k < 4; k++) bq[o + k] /= l;
  }
  /* 굴림 · 공은 통 뒷면(화면) 위를 구르듯 돈다 · ω = (뒷면 법선 +z) × v / r → 번호가 공 표면을 따라 지나간다 */
  function spinBalls(dt) {
    var inv = 1 / (PH.h * R);
    for (var i = 0; i < NB; i++) {
      if (bs[i] !== 2 && bs[i] !== 1) continue;
      var vx = (bx[i] - bpx[i]) * inv, vy = -(by[i] - bpy[i]) * inv;   /* 월드 y 위 */
      integQuat(i * 4, -vy * 0.9, vx * 0.9, 0, dt);
      var ao = 1 - 0.38 * clamp((bcont[i] - 2) / 5, 0, 1);
      bao[i] += (ao - bao[i]) * 0.15;
    }
  }
  var nFalling = 0;
  function countAlive() {
    var a = 0, n = 0, f = 0;
    for (var i = 0; i < NB; i++) if (bs[i]) { a++; if (bs[i] === 2) n++; else if (bs[i] === 1) f++; }
    nAlive = a; nInside = n; nFalling = f;
  }
  /* v3.2(261002) · 공 면적 56% → 42%(공 반지름 약 0.87배 · 공 300개 17.0 → 14.7px) · 통이 절반쯤만 찬다
   *   56%는 쌓인 공이 통 가운데보다 높아, 가운데 공들이 어느 방향으로 돌려도 흘러내리지 않고 통과 함께 돌기만 했다(굳은 가운데)
   *   흔들어 섞어도 그 안에 묻힌 공은 빠져나오지 못해 체크인 순서에 따라 유리 · 불리가 생겼다(공 300개 · 2분 체크인 · 10초 섞기 카이제곱 23) */
  function targetRadius() { return clamp(Math.sqrt(TUNE.fill * DR * DR / Math.max(nAlive, 150)), 5.2, 24); }
  function physStep(h) {
    var g = 2600, i, j, rr = R, lim = DR - rr;
    stepDoor(h);
    /* 1. 적분 · 중력뿐(분사 없음) · 통이 돌며 벽 마찰로 끌어올린 공이 굴러 떨어진다(텀블링) */
    var damp = 0.9982, vmax = rr * 0.9, pull = GAP.pull, ga0 = gapAng(), kickP = KICK.p * clamp((Math.abs(MIX.w) - 0.4) / 1.2, 0, 1);
    var gpx = DX + Math.cos(ga0) * DR, gpy = DY + Math.sin(ga0) * DR;
    for (i = 0; i < NB; i++) {
      var s = bs[i]; if (!s || s === 3) continue;
      var vx = (bx[i] - bpx[i]) * damp, vy = (by[i] - bpy[i]) * damp;
      var sp = Math.hypot(vx, vy); if (sp > vmax) { vx *= vmax / sp; vy *= vmax / sp; }
      var ax = 0, ay = g;
      if (s === 2 && kickP > 0 && rng() < kickP) { var ka = rng() * 6.2832, kv = rr * KICK.v * (0.5 + rng() * 0.5); vx += Math.cos(ka) * kv; vy += Math.sin(ka) * kv - rr * 0.1; }   /* 통 안쪽 요철에 튀는 공(섞임) */
      if (pull > 0 && s === 2) { var sgx = gpx - bx[i], sgy = gpy - by[i], sgd = Math.hypot(sgx, sgy) + 1; if (sgd < DR * 0.5) { ax += pull * 2400 * sgx / sgd; ay += pull * 2400 * sgy / sgd; } }   /* 마지막 안전장치(9초) */
      bpx[i] = bx[i]; bpy[i] = by[i];
      bx[i] += vx + ax * h * h; by[i] += vy + ay * h * h;
      if (bx[i] !== bx[i] || by[i] !== by[i]) { bx[i] = DX; by[i] = DY; bpx[i] = DX; bpy[i] = DY; NANFIX++; }   /* NaN 방어 */
    }
    /* 2. 충돌 · 격자에 담고 이웃 칸만 본다
     *    처리 순서를 매 스텝 섞는다 · 순서대로 풀면 번호가 낮은 공이 바닥으로 가라앉는 편향이 생긴다(v3 실측 · 공정성) */
    if (ORDN !== NB) { for (i = 0; i < NB; i++) ORD[i] = i; ORDN = NB; }
    for (i = NB - 1; i > 0; i--) { j = Math.floor(rng() * (i + 1)); var tmp = ORD[i]; ORD[i] = ORD[j]; ORD[j] = tmp; }
    var cs = rr * 2, x0 = DX - DR - cs, y0 = DY - DR - cs * 3, gw = Math.ceil((DR * 2 + cs * 2) / cs) + 1, gh = Math.ceil((DR * 2 + cs * 4) / cs) + 1, nc = gw * gh;
    if (!grid.cnt || grid.cnt.length < nc + 1) { grid.cnt = new Int32Array(nc + 1); grid.idx = new Int32Array(MAXB); }
    var cnt = grid.cnt, idx = grid.idx, cell = grid.cell;
    for (i = 0; i < NB; i++) bcont[i] = 0;
    for (var it = 0; it < 2; it++) {
      cnt.fill(0, 0, nc + 1);
      for (i = 0; i < NB; i++) {
        if (!bs[i]) { cell[i] = -1; continue; }
        var gx = Math.floor((bx[i] - x0) / cs), gy = Math.floor((by[i] - y0) / cs);
        if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) { cell[i] = -1; continue; }
        var c = gy * gw + gx; cell[i] = c; cnt[c + 1]++;
      }
      for (c = 0; c < nc; c++) cnt[c + 1] += cnt[c];
      var fillp = grid.fillp || (grid.fillp = new Int32Array(MAXB));
      if (fillp.length < nc) fillp = grid.fillp = new Int32Array(nc + 64);
      for (c = 0; c < nc; c++) fillp[c] = cnt[c];
      for (var oi = 0; oi < NB; oi++) { i = ORD[oi]; if (cell[i] >= 0) idx[fillp[cell[i]]++] = i; }   /* 칸 안 순서 = 무작위(아래 참고) */
      var dd = cs * cs, imp = 0, impV = 0;
      for (var gyy = 0; gyy < gh; gyy++) for (var gxx = 0; gxx < gw; gxx++) {
        var c0 = gyy * gw + gxx, a0 = cnt[c0], a1 = cnt[c0 + 1];
        if (a0 === a1) continue;
        for (var nb = 0; nb < 5; nb++) {                /* 자기 칸 + 오른쪽 · 아래 세 칸(쌍을 한 번만) */
          var ox = nb === 0 ? 0 : nb === 1 ? 1 : nb - 3, oy = nb <= 1 ? 0 : 1;
          var nx2 = gxx + ox, ny2 = gyy + oy;
          if (nx2 < 0 || nx2 >= gw || ny2 >= gh) continue;
          var c1 = ny2 * gw + nx2, b0 = cnt[c1], b1 = cnt[c1 + 1];
          for (var pa = a0; pa < a1; pa++) {
            i = idx[pa];
            for (var pb = (nb === 0 ? pa + 1 : b0); pb < b1; pb++) {
              j = idx[pb];
              var ddx = bx[j] - bx[i], ddy = by[j] - by[i], d2 = ddx * ddx + ddy * ddy;
              if (d2 >= dd || d2 < 1e-6 || (bs[i] === 1 && bs[j] === 1)) continue;
              var dist = Math.sqrt(d2), ov = (cs - dist), nxx = ddx / dist, nyy = ddy / dist;
              var wi = bs[i] === 3 ? 0 : 1, wj = bs[j] === 3 ? 0 : 1, ws = wi + wj; if (!ws) continue;
              var mi = ov * wi / ws, mj = ov * wj / ws;
              bx[i] -= nxx * mi; by[i] -= nyy * mi; bx[j] += nxx * mj; by[j] += nyy * mj;
              if (it === 0) {
                if (bcont[i] < 255) bcont[i]++; if (bcont[j] < 255) bcont[j]++;
                var rvx = (bx[j] - bpx[j]) - (bx[i] - bpx[i]), rvy = (by[j] - bpy[j]) - (by[i] - bpy[i]), rv = rvx * nxx + rvy * nyy;
                if (rv < -1.6) { imp++; if (-rv > impV) impV = -rv; }
                if (TUNE.rest && rv < -rr * TUNE.restV && wi && wj) {   /* 튕김(반발) · 빠르게 부딪힌 공끼리만 · 섞임을 돕는다 */
                  var jr = -rv * TUNE.rest * 0.5; bpx[i] += nxx * jr; bpy[i] += nyy * jr; bpx[j] -= nxx * jr; bpy[j] -= nyy * jr;
                }
                if (wi && wj) {                         /* 접선 마찰 · 공 더미가 덩어리로 딸려 올라갔다가 무너진다 */
                  var fr = (rvy * nxx - rvx * nyy) * FRIC * 0.5;
                  bpx[i] += nyy * fr; bpy[i] -= nxx * fr; bpx[j] -= nyy * fr; bpy[j] += nxx * fr;
                }
              }
            }
          }
        }
      }
      if (it === 0) { PH.impacts += imp; if (impV > PH.impactV) PH.impactV = impV; }
      /* 3. 벽 · 통 안의 공은 원 안으로 · 벽이 돌면 마찰로 끌려 올라간다
       *    v3.1 · 문이 닫혀 있으면 틈 자리도 벽이다(섞는 동안 · 보이는 그대로)
       *    문이 열리면 벽 대신 틈 양 끝점과 부딪힌다 · 틈 폭이 공 지름보다 조금 넓어 정면에 온 공만 빠진다
       *    문이 열려 있어도 통과를 받지 않는 때(12시에서 넣는 중)는 공이 틈에 반쯤 걸쳐도 되돌린다 */
      var wall = MIX.w * DR * h, eRest = 0.22, ga = gapAng(), ea = gapEdgeA(), gcx = Math.cos(ga), gsy = Math.sin(ga);
      var e1x = DX + Math.cos(ga - ea) * DR, e1y = DY + Math.sin(ga - ea) * DR, e2x = DX + Math.cos(ga + ea) * DR, e2y = DY + Math.sin(ga + ea) * DR;
      var open = doorOpen(), live = GAP.live && open, candI = -1, candD = 0, inner = DR - rr * 0.3, half = Math.max(0, gapHalfW() - rr);
      for (i = 0; i < NB; i++) {
        var st = bs[i]; if (!st || st === 3) continue;
        var wx = bx[i] - DX, wy = by[i] - DY, wd = Math.hypot(wx, wy);
        if (st === 1) {                                 /* 넣는 공 · 12시 틈 바로 위에서 틈 폭 안으로만 떨어진다 */
          if (by[i] < DY - DR + rr * 2) { var cxg = DX + gcx * DR; if (bx[i] < cxg - half) bx[i] = cxg - half; if (bx[i] > cxg + half) bx[i] = cxg + half; bpx[i] = bx[i] - (bx[i] - bpx[i]) * 0.3; }
          if (wd < lim - 1 && by[i] > DY - DR + rr) { bs[i] = 2; bland[i] = T; landSound(); }
          continue;
        }
        if (TUNE.fins && wd > DR - finLen() - rr * 1.2 && finPush(i, rr)) { wx = bx[i] - DX; wy = by[i] - DY; wd = Math.hypot(wx, wy); }
        if (wd <= lim) continue;
        if (wd > DR + rr * 6) { bx[i] = DX + (rng() - 0.5) * 40; by[i] = DY; bpx[i] = bx[i]; bpy[i] = by[i]; ESCFIX++; continue; }   /* 빠져나간 공 복구 */
        var nx = wx / wd, ny = wy / wd, da = Math.atan2(ny * gcx - nx * gsy, nx * gcx + ny * gsy);
        if (open && Math.abs(da) < ea) {
          edgePush(i, e1x, e1y, rr); edgePush(i, e2x, e2y, rr);
          wx = bx[i] - DX; wy = by[i] - DY; wd = Math.hypot(wx, wy);
          var ok = live && !ST.out[bpk[i]];
          if (!ok && wd > inner) { bx[i] = DX + wx / wd * inner; by[i] = DY + wy / wd * inner; var vo = (bx[i] - bpx[i]) * wx / wd + (by[i] - bpy[i]) * wy / wd; if (vo > 0) { bpx[i] += wx / wd * vo; bpy[i] += wy / wd * vo; } }
          else if (ok && wd > DR + rr * 0.5 && wd - DR > candD) { candI = i; candD = wd - DR; }
          continue;
        }
        bx[i] = DX + nx * lim; by[i] = DY + ny * lim;
        var vx2 = bx[i] - bpx[i], vy2 = by[i] - bpy[i], vn = vx2 * nx + vy2 * ny;
        if (vn > 0) { vx2 -= (1 + eRest) * vn * nx; vy2 -= (1 + eRest) * vn * ny; }
        var tx = -ny, ty = nx, vt = vx2 * tx + vy2 * ty;
        vx2 += tx * (wall - vt) * WALLK; vy2 += ty * (wall - vt) * WALLK;
        bpx[i] = bx[i] - vx2; bpy[i] = by[i] - vy2;
      }
      /* 처음 통과한 공 = 당첨 · 한 스텝(1/120초)에 여럿이면 번호 순서가 아니라 더 빠져나간 공 · 그 순간 문이 닫힌다(capture) */
      if (candI >= 0) capture(candI);
    }
    /* 4. 굴림 · 접선 속도로 회전(숫자가 돌아간다) */
    for (i = 0; i < NB; i++) if (bs[i] === 2) ba[i] += (bx[i] - bpx[i]) / rr * 0.9;
  }
  function edgePush(i, ex, ey, rr) {                    /* 틈 끝점(통 테두리 끝)과 공 · 끝점은 통과 함께 움직인다 */
    var dx = bx[i] - ex, dy = by[i] - ey, d = Math.hypot(dx, dy);
    if (d < rr && d > 1e-6) { var p = (rr - d) / d; bx[i] += dx * p; by[i] += dy * p; }
  }
  var lastDrop = 0, NANFIX = 0, ESCFIX = 0;
  function landSound() { if (T - lastDrop > 0.045) { lastDrop = T; SFX.play("drop", rng()); } }

  /* ─────────────── 공 스프라이트 아틀라스 · 번호가 적힌 오렌지 공(평면 · 그림자 없음) ─────────────── */
  var atlas = { c: null, key: "", cell: 0, cols: 0, map: {} };
  function VS0() { return BASEVS || vs; }
  function buildAtlas() {
    var ps = R * VS0(), key = Math.round(ps * 2) / 2 + "|" + NB;
    if (atlas.key === key) return;
    if (ps < 6.5) { atlas.key = key; atlas.small = true; return; }
    atlas.small = false;
    var cell = Math.ceil(ps * 2 + 2), n = NB, cols = Math.max(1, Math.floor(4096 / cell)), rows = Math.ceil(n / cols);
    if (!atlas.c) atlas.c = document.createElement("canvas");
    atlas.c.width = cols * cell; atlas.c.height = Math.max(1, rows * cell);
    var c = atlas.c.getContext("2d");
    c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "700 " + (ps * 0.74).toFixed(1) + "px " + FONT;
    for (var i = 0; i < n; i++) {
      var col = i % cols, row = Math.floor(i / cols), x = col * cell + cell / 2, y = row * cell + cell / 2;
      c.fillStyle = CFG.pal === 2 ? "#FFF4EC" : C.o; c.beginPath(); c.arc(x, y, ps, 0, 6.2832); c.fill();
      if (ps >= 10) { c.fillStyle = CFG.pal === 2 ? "#D64524" : "#1A0B02"; c.fillText(bno[i] || "", x, y + ps * 0.05); }
      else { c.fillStyle = "#FFEBE0"; c.beginPath(); c.arc(x, y, ps * 0.22, 0, 6.2832); c.fill(); }   /* 번호가 안 읽히는 크기에서는 KV 01 링 점(핵 O10 · 261001 파랑 계열 금지) */
    }
    atlas.cell = cell; atlas.cols = cols; atlas.key = key;
  }

  /* ─────────────── 입자 (흩어짐 · 파문 · 축하 점) ─────────────── */
  var PMAX = 9000, pn = 0;
  var px_ = new Float32Array(PMAX), py_ = new Float32Array(PMAX), pvx = new Float32Array(PMAX), pvy = new Float32Array(PMAX);
  var plife = new Float32Array(PMAX), pmax = new Float32Array(PMAX), psz = new Float32Array(PMAX), pgr = new Float32Array(PMAX), pdr = new Float32Array(PMAX), pcol = new Uint8Array(PMAX);
  var PCOL = [C.o, C.hi, C.pu, C.w, C.o25];
  function spark(x, y, vx, vy, life, size, col, grav, drag) {
    if (pn >= PMAX) return;
    var i = pn++;
    px_[i] = x; py_[i] = y; pvx[i] = vx; pvy[i] = vy; plife[i] = 0; pmax[i] = life; psz[i] = size; pcol[i] = col; pgr[i] = grav || 0; pdr[i] = drag == null ? 1.6 : drag;
  }
  function stepParticles(dt) {
    for (var i = 0; i < pn; i++) {
      plife[i] += dt;
      if (plife[i] >= pmax[i]) { pn--; if (i < pn) { px_[i] = px_[pn]; py_[i] = py_[pn]; pvx[i] = pvx[pn]; pvy[i] = pvy[pn]; plife[i] = plife[pn]; pmax[i] = pmax[pn]; psz[i] = psz[pn]; pcol[i] = pcol[pn]; pgr[i] = pgr[pn]; pdr[i] = pdr[pn]; } i--; continue; }
      var k = Math.exp(-pdr[i] * dt);
      pvx[i] *= k; pvy[i] = pvy[i] * k + pgr[i] * dt;
      px_[i] += pvx[i] * dt; py_[i] += pvy[i] * dt;
    }
  }
  function drawParticles() {
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    for (var c = 0; c < PCOL.length; c++) {
      cx.fillStyle = PCOL[c]; cx.beginPath();
      for (var i = 0; i < pn; i++) {
        if (pcol[i] !== c) continue;
        var u = plife[i] / pmax[i], r = psz[i] * (u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3);
        if (r < 0.3) continue;
        cx.moveTo(px_[i] + r, py_[i]); cx.arc(px_[i], py_[i], r, 0, 6.2832);
      }
      cx.fill();
    }
  }
  function popBall(i) {                                /* 같은 분의 다른 공 · 점 8개로 흩어진다 */
    var x = bx[i], y = by[i];
    for (var k = 0; k < 8; k++) { var a = k / 8 * 6.2832 + rng(), s = 160 + rng() * 220; spark(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.7 + rng() * 0.4, R * 0.28, k % 3 === 0 ? 1 : 0, 300, 2.2); }
    killBall(i); SFX.play("pop");
  }
  function ringWave(x, y, n, speed, size, col, life) {
    for (var k = 0; k < n; k++) { var a = k / n * 6.2832; spark(x + Math.cos(a) * 20, y + Math.sin(a) * 20, Math.cos(a) * speed, Math.sin(a) * speed, life || 1.1, size, col, 0, 0.9); }
  }

  /* ─────────────── 추첨 통 · 점 고리(KV 02 Connection) ─────────────── */
  var DRUM = { pulse: 0, alpha: 1 };
  /* 통 = 유리 구(사용자 확정 261001 · 3안) · 옅은 웜 그레이 유리 · 프레넬 테두리 · 하이라이트(굴절 없음)
   *   틈은 뚫린 구멍(가장자리 하이라이트) · 미세 점 무늬와 반짝임이 통과 함께 돈다 · 받침 · 관 없음 */
  function drawDrum() {
    var ga = gapAng(), ea = gapEdgeA();
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.globalAlpha = DRUM.alpha;
    drawGlassBack(ga, ea);
    cx.globalAlpha = 1;
  }
  /* 유리 · 뒷면(공 뒤) = 아주 옅은 웜 그레이 몸통 + 미세 점 무늬(돈다) */
  var GLD = null;
  function drawGlassBack(ga, ea) {
    var g = cx.createRadialGradient(DX - DR * 0.25, DY - DR * 0.3, 0, DX, DY, DR + 14);
    g.addColorStop(0, "rgba(255,244,236,0.13)"); g.addColorStop(0.6, "rgba(255,236,224,0.085)"); g.addColorStop(0.93, "rgba(255,222,204,0.16)"); g.addColorStop(1, "rgba(255,222,204,0)");   /* 밝고 옅은 웜 그레이(검게 번들거리지 않게) */
    cx.fillStyle = g; cx.beginPath(); cx.arc(DX, DY, DR + 14, 0, 6.2832); cx.fill();
    if (!GLD) { GLD = []; for (var k = 0; k < 160; k++) { var rr = Math.sqrt(hash(k * 3 + 1)) * 0.97, aa = hash(k * 7 + 2) * 6.2832; GLD.push([rr, aa, 0.8 + hash(k * 11 + 5) * 1.0]); } }
    cx.fillStyle = "rgba(255,236,224,0.16)"; cx.beginPath();
    for (var j = 0; j < GLD.length; j++) { var d = GLD[j], a2 = d[1] + MIX.rot, x = DX + Math.cos(a2) * d[0] * DR, y = DY + Math.sin(a2) * d[0] * DR; cx.moveTo(x + d[2], y); cx.arc(x, y, d[2], 0, 6.2832); }
    cx.fill();
  }
  /* 유리 · 앞면(공 앞 · #fx) = 프레넬 테두리 + 고정 하이라이트(조명) + 통과 함께 도는 반짝임 + 구멍 가장자리 하이라이트 */
  function drawGlassFront() {
    var ga = gapAng(), ea = gapEdgeA(), ro = DR + 14, ri = DR - 4;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.globalAlpha = DRUM.alpha;
    var g = cx.createRadialGradient(DX, DY, ri - 6, DX, DY, ro);
    g.addColorStop(0, "rgba(255,238,226,0)"); g.addColorStop(0.5, "rgba(255,238,226,0.22)"); g.addColorStop(0.82, "rgba(255,240,230,0.42)"); g.addColorStop(1, "rgba(255,238,226,0)");
    cx.fillStyle = g; cx.beginPath();
    cx.arc(DX, DY, ro, ga + ea, ga - ea + 6.2832); cx.arc(DX, DY, ri - 6, ga - ea + 6.2832, ga + ea, true); cx.closePath(); cx.fill();
    var hb = cx.createRadialGradient(DX - DR * 0.42, DY - DR * 0.5, 0, DX - DR * 0.42, DY - DR * 0.5, DR * 0.45);
    hb.addColorStop(0, "rgba(255,251,247,0.2)"); hb.addColorStop(1, "rgba(255,251,247,0)");
    cx.fillStyle = hb; cx.beginPath(); cx.arc(DX - DR * 0.42, DY - DR * 0.5, DR * 0.45, 0, 6.2832); cx.fill();
    cx.lineCap = "round";
    cx.strokeStyle = "rgba(255,252,248,0.46)"; cx.lineWidth = 7; cx.beginPath(); cx.arc(DX, DY, DR * 0.87, -2.56, -1.96); cx.stroke();
    cx.strokeStyle = "rgba(255,252,248,0.3)"; cx.lineWidth = 4.5; cx.beginPath(); cx.arc(DX, DY, DR * 0.87, -2.78, -2.66); cx.stroke();
    cx.strokeStyle = "rgba(255,236,224,0.13)"; cx.lineWidth = 3; cx.beginPath(); cx.arc(DX, DY, DR * 0.94, 0.75, 1.25); cx.stroke();
    cx.strokeStyle = "rgba(255,246,238,0.16)"; cx.lineWidth = 3; cx.beginPath();   /* 통과 함께 도는 반짝임 셋 */
    [0.6, 2.5, 4.4].forEach(function (a0) { var a = a0 + MIX.rot; if (Math.abs(angDiff(a, ga)) < 0.4) return; cx.moveTo(DX + Math.cos(a) * DR * 0.95, DY + Math.sin(a) * DR * 0.95); cx.arc(DX, DY, DR * 0.95, a, a + 0.2); });
    cx.stroke();
    cx.strokeStyle = "rgba(255,252,248,0.75)"; cx.lineWidth = 3; cx.beginPath();   /* 구멍 가장자리 */
    for (var s = -1; s <= 1; s += 2) { var aa = ga + s * ea, c = Math.cos(aa), sn = Math.sin(aa); cx.moveTo(DX + c * (DR - 1), DY + sn * (DR - 1)); cx.lineTo(DX + c * (DR + 12), DY + sn * (DR + 12)); }
    cx.stroke();
    cx.lineCap = "butt";
    drawDoor(ga, ea);
    cx.globalAlpha = 1;
  }
  /* v3.1 · 미닫이 문 · 통 테두리에 붙은 짧은 호 모양 판(무채색) · 테두리 레일을 따라 시계 방향으로 밀려 열린다(감방 문 감시창처럼)
   *   닫힘 = 틈을 덮는다 · 열림 = 옆 테두리 위로 겹쳐 간다 · 레일(가는 선 두 줄)이 늘 보여 「여닫는 문」으로 읽힌다 */
  function drawDoor(ga, ea) {
    var pad = 7 / DR, dh = ea + pad, run = 2 * dh + 4 / DR, v = DOOR.v, e = DOOR.tgt ? EIO(v) : v, sl = e * run;
    var r0 = DR - 3, r1 = DR + 15, a0 = ga - dh + sl, a1 = ga + dh + sl;
    cx.globalAlpha = DRUM.alpha;
    cx.strokeStyle = "rgba(255,248,242,0.34)"; cx.lineWidth = 2; cx.beginPath();   /* 레일 · 닫힌 자리 ~ 열린 자리 */
    cx.arc(DX, DY, r1 + 3, ga - dh - 1 / DR, ga + dh + run + 1 / DR);
    cx.moveTo(DX + Math.cos(ga + dh + run + 1 / DR) * (r0 - 3), DY + Math.sin(ga + dh + run + 1 / DR) * (r0 - 3));
    cx.arc(DX, DY, r0 - 3, ga + dh + run + 1 / DR, ga - dh - 1 / DR, true);
    cx.stroke();
    cx.fillStyle = "rgba(250,246,242,0.95)"; cx.beginPath();                     /* 문짝 */
    cx.arc(DX, DY, r1, a0, a1); cx.arc(DX, DY, r0, a1, a0, true); cx.closePath(); cx.fill();
    cx.fillStyle = "rgba(0,0,0,0.42)"; cx.beginPath();                            /* 손잡이 점 셋 */
    var gr = clamp(dh * DR * 0.12, 1.4, 2.6), rm = (r0 + r1) / 2;
    for (var k = -1; k <= 1; k++) { var aa = (a0 + a1) / 2 + k * gr * 2.6 / rm, x = DX + Math.cos(aa) * rm, y = DY + Math.sin(aa) * rm; cx.moveTo(x + gr, y); cx.arc(x, y, gr, 0, 6.2832); }
    cx.fill();
  }

  /* 공은 #gl 에 입체로 · 방금 들어온 공의 고리만 #fx 에(공을 고르는 하이라이트는 없다 · v3) */
  var S3 = { NB: 0, x: bx, y: by, q: bq, r: 0, bs: bs, num: bnum, flag: bflag, ao: bao, heroI: -1, hx: 0, hy: 0, hr: 0, hq: [0, 0, 0, 1], hnum: 0, t: 0, dim: 1, hflag: 0 };
  function drawBallsGL(alphaAll, dim) {
    var ex = SC === "exit" && WIN.i >= 0, cs = CAM.s, ox = CAM.ox + CAM.jx, oy = CAM.oy + CAM.jy;
    /* 사라질 때는 투명도로(오렌지 스테이지 위에서 검게 보이지 않게) · 배출 중에는 통 쪽 공만 어둡게(당첨 공은 그대로) */
    glEl.style.opacity = SC === "exit" ? "1" : alphaAll.toFixed(3);
    S3.NB = NB; S3.r = R * cs; S3.t = T; S3.dim = SC === "exit" ? dim : 1; S3.heroI = ex ? WIN.i : -1; S3.hflag = 0;
    if (ex) { var p = winPos(), o = WIN.i * 4; S3.hx = p.x; S3.hy = p.y; S3.hr = winRad(); S3.hq[0] = bq[o]; S3.hq[1] = bq[o + 1]; S3.hq[2] = bq[o + 2]; S3.hq[3] = bq[o + 3]; S3.hnum = bnum[WIN.i]; }
    else S3.hr = 0;
    if (cs !== 1 || ox !== 0 || oy !== 0) {            /* 카메라(다가가기 · 흔들림 · 따라가기) · 공 좌표에도 같은 변환 */
      if (!S3.cx) { S3.cx = new Float32Array(MAXB); S3.cy = new Float32Array(MAXB); }
      for (var i2 = 0; i2 < NB; i2++) { S3.cx[i2] = bx[i2] * cs + ox; S3.cy[i2] = by[i2] * cs + oy; }
      S3.x = S3.cx; S3.y = S3.cy;
    } else { S3.x = bx; S3.y = by; }
    GL.frame(S3);
    /* v3.2(261002 사용자) · 방금 들어온 공에 퍼지던 주황 고리를 없앴다 · 넣기는 12시 문이 열리고 공이 떨어지는 움직임으로만 보인다 */
  }
  function drawBalls(alphaAll) {
    buildAtlas();
    var i, ps = R * vs;
    cx.globalAlpha = alphaAll == null ? 1 : alphaAll;
    if (atlas.small) {
      cx.setTransform(vs, 0, 0, vs, vox, voy);
      cx.fillStyle = C.o; cx.beginPath();
      for (i = 0; i < NB; i++) { if (!bs[i] || bs[i] === 3) continue; cx.moveTo(bx[i] + R, by[i]); cx.arc(bx[i], by[i], R, 0, 6.2832); }
      cx.fill();
    } else {
      var cell = atlas.cell, cols = atlas.cols, sc = ps / ((cell - 2) / 2), half = cell / 2;   /* 아틀라스는 기본 배율로 한 번 · 카메라 배율은 여기서 곱한다 */
      for (i = 0; i < NB; i++) {
        if (!bs[i] || bs[i] === 3) continue;
        var co = Math.cos(ba[i]) * sc, si = Math.sin(ba[i]) * sc;
        cx.setTransform(co, si, -si, co, vox + bx[i] * vs, voy + by[i] * vs);
        cx.drawImage(atlas.c, (i % cols) * cell, Math.floor(i / cols) * cell, cell, cell, -half, -half, cell, cell);
      }
    }
    cx.globalAlpha = 1;   /* v3.2 · 넣은 공의 주황 고리 없음(위와 같음) */
  }

  /* ─────────────── 힉스필드 영상 · 장면 시계로 재생(녹화 모드에서는 프레임마다 위치를 맞춘다) ─────────────── */
  var VID = {};
  function vid(name) {
    if (!VID[name]) { var el = document.getElementById(name === "intro" ? "vIntro" : "vBurst"); VID[name] = { el: el, on: false, t0: 0, ok: true }; if (el) el.addEventListener("error", function () { VID[name].ok = false; }); }
    return VID[name];
  }
  function vidStart(name) {
    var v = vid(name); if (!v.el || !v.ok) return false;
    v.on = true; v.t0 = T; v.cut = 0;
    if (!REC) { try { v.el.currentTime = 0; var pr = v.el.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
    return true;
  }
  function vidCut(name) { var v = vid(name); if (v.on && !v.cut) v.cut = T; }
  function vidStop(name) { var v = vid(name); v.on = false; if (v.el) { v.el.style.opacity = 0; if (!REC) try { v.el.pause(); } catch (e) {} } }
  function stepVideos() {
    for (var k in VID) {
      var v = VID[k]; if (!v.on) continue;
      var t = T - v.t0, dur = (v.el.duration && isFinite(v.el.duration)) ? v.el.duration : 5, op;
      if (k === "intro") op = clamp(t / 0.3, 0, 1) * clamp((dur - 0.1 - t) / 0.6, 0, 1);
      else op = 0.95 * clamp(t / 0.15, 0, 1) * clamp((4.2 - t) / 1.2, 0, 1);
      if (v.cut) op *= clamp(1 - (T - v.cut) / 0.3, 0, 1);
      v.el.style.opacity = op.toFixed(3);
      if (t >= (k === "intro" ? dur - 0.1 : 4.2) || (v.cut && T - v.cut >= 0.3)) { vidStop(k); if (k === "intro" && SC === "intro") introDone(); }
    }
  }
  function vidSeeks() {                                  /* 녹화용 · [요소, 초] */
    var out = [];
    for (var k in VID) { var v = VID[k]; if (v.on) out.push([v.el.id, Math.max(0, Math.min((v.el.duration || 5) - 0.05, T - v.t0))]); }
    return out;
  }

  /* ─────────────── 장면 ─────────────── */
  var T = 0, sceneT0 = 0, SC = ST.scene === "idle" ? "idle" : "restore";
  var DRAW = { t0: 0, boosted: false, hearts: 0 };
  var WIN = { i: -1, r: null, x: 0, y: 0, rad: 0, z: 0 };
  var DIG = { n: 0, sx: null, sy: null, tx: null, ty: null, dl: null, t0: 0, out: 0, ox: 0, oy: 0 };
  var ARR = { q: [], acc: 0, t: 0, lastPk: [] };
  var ME = { pts: null, t0: 0, from: null };
  var busyUntil = 0, confirmKey = null, confirmT = 0;
  function scene(s) { SC = s; sceneT0 = T; ST.scene = s === "restore" ? ST.scene : s; document.body.dataset.scene = s; persist(); uiScene(); if (CMD) scrPush(true); }
  function sT() { return T - sceneT0; }
  function rounds() { return CFG.rounds && CFG.rounds.length ? CFG.rounds : DEF.rounds; }
  function curRound() { return rounds()[Math.min(ST.round, rounds().length - 1)]; }
  function roundWins(ri, shown) { return ST.results.filter(function (r) { return r.round === ri && r.st === "win" && !(shown && r.id === ST.pending); }); }
  function eligible() {
    var out = [];
    for (var i = 0; i < NB; i++) if (bs[i] === 2 && !ST.out[bpk[i]]) out.push(i);
    return out;
  }

  /* 체크인 · 한 사람의 공 1~3개가 줄을 서서 틈이 12시에 올 때 들어간다 */
  function queueArrival(pk) {
    if (ST.arrived.indexOf(pk) >= 0 || ARR.q.indexOf(pk) >= 0) return;
    ARR.q.push(pk);
  }
  function arrive(pk) {
    var p = ST.pool.people[pk]; if (!p || ST.arrived.indexOf(pk) >= 0) return;
    ST.arrived.push(pk);
    p.nos.forEach(function (no, k) {
      DROPS.push({ at: T + k * 0.13, no: no, pk: pk });
    });
    ARR.lastPk.unshift(pk); if (ARR.lastPk.length > 4) ARR.lastPk.length = 4;
    ARR.dirty = true;
  }
  /* 261006 · 체크인 없음(NOCK) · 「추첨 준비」를 누르면 그때까지의 행운권을 한꺼번에 통에 넣는다
   *   넣는 순서 = 암호 난수로 섞은 행운권 순서(먼저 들어간 공 · 나중 공이 사람과 상관없다)
   *   행운권이 ballCap() 보다 많으면 ST.big · 그 수만큼 무작위 대표 공만 넣는다 · 당첨은 capture 에서 행운권 전체 중 암호 난수(bigPick)
   *   공이 없는 사람도 ST.arrived 에 넣는다(= 추첨 대상) · 다시 불러도 이미 넣은 사람은 건너뛴다 */
  function cryptoShuffle(a) { var u = cryptoUnits(a.length); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(u[i] * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nockQueue() {
    if (!ST.pool) return;
    var seen = {}; ST.arrived.forEach(function (pk) { seen[pk] = 1; });
    var fresh = ST.pool.order.filter(function (pk) { return !seen[pk] && !ST.out[pk]; });
    if (!fresh.length) { if (ST.big == null) { ST.big = false; ST.repN = 0; persist(); } return; }
    var tk = [];
    fresh.forEach(function (pk) { (ST.pool.people[pk].nos || []).forEach(function (no) { tk.push([pk, no]); }); });
    if (ST.big == null) { ST.big = tk.length > ballCap(); ST.repN = 0; }
    cryptoShuffle(tk);
    var take = ST.big ? tk.slice(0, Math.max(0, ballCap() - ST.repN)) : tk;
    ST.rep = ST.rep || {};
    take.forEach(function (x) { (ST.rep[x[0]] || (ST.rep[x[0]] = [])).push(x[1]); DROPS.push({ at: T, no: x[1], pk: x[0] }); });
    ST.repN += take.length;
    fresh.forEach(function (pk) { ST.arrived.push(pk); });
    ARR.dirty = true; persist(); uiPool();
  }
  /* 대표 공 모드 · 지금 추첨 대상 행운권 전체(통에 넣은 사람 · 당첨 · 부재로 빠진 사람 제외 · 이미 당첨된 번호 제외) */
  function bigTickets() {
    var won = {}, out = [];
    ST.results.forEach(function (r) { if (r.st === "win") won[r.no] = 1; });
    ST.arrived.forEach(function (pk) { if (ST.out[pk]) return; var p = ST.pool && ST.pool.people[pk]; if (p) p.nos.forEach(function (no) { if (!won[no]) out.push([pk, no]); }); });
    return out;
  }
  function bigPick() { var a = bigTickets(); if (!a.length) return null; var x = a[Math.floor(cryptoUnits(1)[0] * a.length)]; return { pk: x[0], no: x[1], n: a.length }; }
  function nockLoading() { return NOCK() && SC === "checkin" && (ST.big == null || DROPS.length > 0 || nFalling > 0); }
  var DROPS = [];
  function stepDrops() {
    if (!(DRM.mode === "hold" && DRM.at === TOP) || !doorOpen()) return;   /* 틈이 12시에 서 있고 문이 열렸을 때만 넣는다 */
    var bulk = NOCK() && SC === "checkin";             /* 261006 · 한꺼번에 넣기 · 문을 열어 둔 채 다 넣을 때까지(약 초당 100개) */
    if ((SC === "checkin" || CHKSIM) && !bulk && T - DRM.t0 > 2.6) return;
    if (T < DROPT) return;
    for (var k = 0, got = 0; k < DROPS.length; k++) {
      var d = DROPS[k]; if (T < d.at) continue;
      DROPS.splice(k--, 1);
      if (ballOfNo[d.no] != null) continue;
      DROPT = T + (bulk ? 0.01 : 0.02);               /* 초당 50개까지 · 틈으로 쏟아붓는다 */
      var gx = DX + Math.cos(gapAng()) * DR, jx = (rng() - 0.5) * Math.max(0, gapHalfW() - R) * 1.6;   /* 12시 틈 바로 위에서 떨어진다 */
      addBall(d.no, d.pk, gx + jx, -30 - rng() * 30 - got * R * 2.2, 0, 420 + rng() * 200, 1);
      if (++got >= (bulk ? 2 : 1)) break;
    }
  }
  function stepArrivals(dt) {
    if (SC !== "checkin") return;
    if (NOCK()) {                                      /* 261006 · 다 넣으면 저절로 준비 끝 · 행운권을 아직 못 받았으면 5초마다 다시 읽는다 */
      if (CFG.mode === "server" && !ST.pool && !SRV.loading && T > (SRV.retryT || 0)) { SRV.retryT = T + 5; serverLoad(function () {}); }
      if (!ST.closed && ST.big != null && !DROPS.length && !nFalling && DRM.mode === "spin" && sT() > 2) closeCheckin();
      return;
    }
    if (ST.pool && ST.pool.kind === "demo" && ARR.auto) {
      /* 데모 · 처음엔 드문드문, 점점 몰린다(실제 입장 곡선 가정) */
      var rate = CFG.demoRate * (0.25 + 0.75 * EIO(sT() / 12));
      ARR.acc += rate * dt;
      while (ARR.acc >= 1) { ARR.acc -= 1; var nxt = ST.pool.order.filter(function (pk) { return ST.arrived.indexOf(pk) < 0 && ARR.q.indexOf(pk) < 0; })[0]; if (nxt) ARR.q.push(nxt); else break; }
    }
    ARR.t -= dt;
    if (ARR.q.length && ARR.t <= 0) {
      arrive(ARR.q.shift());
      ARR.t = ARR.q.length > 30 ? 0.03 : ARR.q.length > 8 ? 0.07 : 0.11;
      if (!(ST.arrived.length % 8)) persist();
    }
  }

  /* 공개용 · 체크인 없이 복원(새로고침) · 공을 통 안에 바로 앉힌다 */
  function rebuildBalls() {
    NB = 0; ballOfNo = {};
    if (!ST.pool) return;
    var list = [], won = {};
    ST.results.forEach(function (r) { if (r.st === "win") won[r.no] = 1; });
    ST.arrived.forEach(function (pk) { if (ST.out[pk]) return; var p = ST.pool.people[pk], nos = ST.rep ? ST.rep[pk] || [] : p && p.nos; if (p && nos) nos.forEach(function (no) { if (!won[no]) list.push([no, pk]); }); });   /* 261006 · 대표 공 모드면 넣었던 대표 공만 */
    nAlive = list.length; R = RT = targetRadius();
    list.forEach(function (x, k) {
      var a = rng() * 6.2832, d = Math.sqrt(rng()) * (DR - R * 1.5);
      addBall(x[0], x[1], DX + Math.cos(a) * d, DY + Math.abs(Math.sin(a)) * d * 0.6 + DR * 0.25, 0, 0, 2);
    });
    for (var k = 0; k < 360; k++) physStep(PH.h);
    countAlive();
  }

  /* ── 행동 ── */
  var wake = null;
  function keepAwake() {                               /* 발표 중 화면 꺼짐 방지(지원 브라우저) */
    try { if (!wake && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; w.addEventListener("release", function () { wake = null; }); }).catch(function () {}); } catch (e) {}
  }
  /* 키보드 · 조작 창 · 원격 콘솔이 같은 명령(runCmd)을 쓴다(261004 · 원격 화면에서도 키보드가 주 조작)
   *   예전(261001~)에는 원격(?remote=1 · 서버 모드 기본)이면 F · M 말고 모든 키를 막아, 무대에서 Space · P 가 안 됐다.
   *   지금은 키도 같은 runCmd 를 부른다 · 콘솔 명령과 겹치면 늦게 온 쪽은 장면 검사(cmdWhy)에서 거절된다(두 번 확정 · 두 번 뽑기 없음) */
  var KEYSRC = false;
  function act(cmd, arg) {
    keepAwake();
    switch (cmd) {   /* 무해한 키 · 언제나 */
      case "mute": SFX.mute(SFX.on); toast(SFX.on ? "소리 켬" : "소리 끔"); pushCtl(); return;
      case "fs": if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen && document.exitFullscreen(); return;
      case "help": document.body.classList.toggle("help-on"); uiHelp(); return;
      case "hud": document.body.classList.toggle("hud-on"); return;
      case "ctl": openControl(); return;
    }
    SFX.ensure();
    KEYSRC = true;
    try { actRun(cmd, arg); } finally { KEYSRC = false; }
    uiHelp(); scrPush(true);
  }
  function actRun(cmd, arg) {
    switch (cmd) {
      case "next": return runNext();
      case "skipmix": if (canSkipMix() && !(T < busyUntil)) skipMix(); return;   /* 스페이스바 · 첫 추첨 최소 섞기 건너뛰기(추첨은 시작하지 않는다) */
      case "close": return twice("close", "한 번 더 누르면 체크인을 마감합니다", function () { keyRun("close"); });
      case "redraw": return twice("redraw", "한 번 더 누르면 부재 처리 후 다시 뽑습니다", function () { keyRun("absent", WIN.r && WIN.r.id); });
      case "undo": return twice("undo", "한 번 더 누르면 마지막 당첨을 취소합니다", function () { keyRun("undo"); });
      case "end": return twice("end", "한 번 더 누르면 끝 화면으로 갑니다", function () { keyRun("end"); });
      case "idle": return twice("idle", "한 번 더 누르면 대기 화면으로 갑니다", function () { keyRun("idle"); });
    }
    if (remote()) return;   /* 아래는 로컬 · 데모 시험용(라운드 바로 가기 · 데모 체크인 · 인트로 다시 보기 · 초기화) */
    if (T < busyUntil && cmd !== "reset" && cmd !== "reload") return;
    switch (cmd) {
      case "round": if (SC === "mix" || SC === "card") { var ri = +arg; if (ri >= 0 && ri < rounds().length) { ST.round = ri; goCard(); } } return;
      case "add": if (SC === "checkin" && ST.pool) { var c = 0; ST.pool.order.forEach(function (pk) { if (c < (arg || 10) && ST.arrived.indexOf(pk) < 0 && ARR.q.indexOf(pk) < 0) { ARR.q.push(pk); c++; } }); } return;
      case "auto": ARR.auto = !ARR.auto; toast(ARR.auto ? "자동 체크인 켬(데모)" : "자동 체크인 끔(데모)"); return;
      case "intro":
        if (SC !== "idle") return;
        if (ST.introDone) return twice("intro", "인트로는 이미 재생했습니다 · 한 번 더 누르면 다시 재생합니다", function () { playIntro(false); });
        return playIntro(false);
      case "reset": resetAll(); return;
      case "reload": if (CFG.mode === "server") serverLoad(function () { pushCtl(); }); return;
    }
  }
  /* 다음 동작 하나 · Space(→ · PageDown · Enter)와 콘솔 「추첨 › 진행」 큰 버튼이 같은 순서다(콘솔 dcNext 와 같은 표)
   *   대기 → 체크인 시작 → 체크인 마감(두 번) → N등 추첨 시작(카드) → 섞기 시작 → 뽑기 → 확정 → (같은 등수 남으면 뽑기 · 다 차면 다음 등수 카드)
   *   … 1등 확정 → 결과판 → 완주 경품 추첨 발표(서버 숫자) → 끝 화면 · 행운권 순서 = CFG.rounds(6등부터 1등 · 261002 사용자 결정) */
  function nextCmd() {
    if (SC === "end") return { c: "", n: "끝 · 모든 순서를 마쳤습니다" };
    if (T < busyUntil || NEXTCARD) return { c: "", n: "잠시만" };
    switch (SC) {
      case "intro": return { c: "skip", n: "인트로 건너뛰기" };
      case "idle": return { c: cmdWhy("intro", "") ? "checkin" : "intro", n: NOCK() ? "추첨 준비 · 공 넣기" : "체크인 시작" };
      case "checkin": return NOCK() ? { c: "", n: "공을 넣는 중 · 다 넣으면 준비 끝" } : { c: "close", n: "체크인 마감", two: 1 };
      case "closed": return { c: "round", n: curRound().name + " 추첨 시작" };
      case "card": return { c: "mix", n: "섞기 시작" };
      case "mix":
        if (canSkipMix()) return { c: "skip", n: "섞기 건너뛰기 · " + Math.ceil(MINMIX - MIXT) + "초 남음" };
        return { c: "draw", n: curRound().name + " 뽑기" };
      case "tension": case "exit": return { c: "", n: "뽑는 중" };
      case "reveal": return { c: "confirm", n: "확정", arg: WIN.r && WIN.r.id };
      case "board": return CFG.mode === "server" && SRV.finOn ? { c: "fin", n: "완주 경품 추첨 발표" } : { c: "end", n: "끝 화면" };   /* 261006 · 설정 완주추첨_사용 OFF(기본)면 건너뛴다 */
      case "fin": return { c: "end", n: "끝 화면" };
    }
    return { c: "", n: "끝" };
  }
  function runNext() {
    var nx = nextCmd();
    if (!nx.c) { if (nx.n !== "잠시만") toast(nx.n, true); return; }
    if (nx.c === "skip") { if (SC === "intro") { vidCut("intro"); lock(0.5); } else if (canSkipMix()) skipMix(); return; }
    if (nx.c === "close") return twice("close", "한 번 더 누르면 체크인을 마감합니다", function () { keyRun("close"); });
    if (nx.c === "fin") return finFromServer();
    keyRun(nx.c, nx.arg);
  }
  var WHY_TXT = { busy: "", scene: "지금 장면에서는 할 수 없습니다", drawing: "뽑는 중입니다", same: "", done: "", notclosed: "체크인을 먼저 마감합니다", round: "없는 등수입니다",
    loading: "공을 넣는 중입니다", full: "", empty: "", none: "", id: "다른 당첨입니다", arg: "완주 경품 추첨 숫자가 없습니다", unknown: "모르는 명령입니다", error: "오류" };
  function keyRun(c, arg) {
    var why = runCmd(c, arg == null ? "" : String(arg));
    if (!why) return;
    var w = String(why).split(":"), t = w[0] === "mixing" ? "섞는 중 · " + w[1] + "초 뒤 뽑기" : WHY_TXT[w[0]];
    if (t) toast(t, true);
  }
  /* 완주 경품 추첨 발표 · 숫자는 서버만 안다 · 화면이 관리코드로 draw_cmd fin 을 보내고(콘솔 버튼과 같은 명령 · seq) 응답의 명령을 바로 실행한다(소켓으로 같은 seq 가 와도 한 번만) */
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
  /* 스페이스바 = 최소 섞기 시간 건너뛰기(261002) · 추첨을 시작하지는 않는다 · 로컬에서는 건너뛴 뒤 한 번 더 누르면 추첨 */
  function canSkipMix() { return SC === "mix" && !!ST.closed && !ST.results.length && MIXT < MINMIX && sT() > 1.2; }
  function skipMix() {
    MIXSKIPAT = +MIXT.toFixed(1); MIXT = MINMIX; MIXSKIP = true;
    var el = $("mixSkip"); if (el) { el.textContent = "섞기 건너뜀 · " + MIXSKIPAT + "초"; fade(el, 1, 0.2); mixSkipUntil = T + 1.8; }
    if (remote()) { CMD.msg = "섞기 건너뜀"; pushCtl("섞기 건너뜀"); }
    scrPush(true);
  }
  var mixSkipUntil = 0;
  var INTRO_NEXT = false;
  function playIntro(thenCheckin) {
    if (!vidStart("intro")) { if (thenCheckin) startCheckin(); return; }
    ST.introDone = true; INTRO_NEXT = !!thenCheckin; persist();
    scene("intro"); lock(1); SFX.play("riser", 3.6); setTimeoutSim(function () { SFX.play("hit"); }, 3.9);
  }
  function introDone() {
    if (INTRO_NEXT) { INTRO_NEXT = false; scene("idle"); startCheckin(); }
    else { scene("idle"); lock(0.4); }
  }
  function twice(k, msg, fn) {
    if (confirmKey === k && T - confirmT < 2.5) { confirmKey = null; toast(""); fn(); return; }
    confirmKey = k; confirmT = T; toast(msg);
  }
  function lock(sec) { busyUntil = T + sec; }
  function startCheckin() {
    if (CFG.mode === "demo" && (!ST.pool || ST.pool.kind !== "demo")) ST.pool = demoPool(CFG.demoN, ST.seed, CFG.demoT);
    if (CFG.mode === "server" && !ST.pool) serverLoad(function () { pushCtl(); });
    if (!QRS.mat && !NOCK()) qrCode();
    ARR.auto = CFG.mode === "demo" && !NOCK();
    /* ME to WE 심볼 점이 흩어져 떨어진다 → 빈 통 */
    scatterSymbol();
    if (!ST.ckAt) { ST.ckAt = REC ? T * 1000 : Date.now(); persist(); }   /* 체크인 길이(분) → 첫 추첨 최소 섞기 */
    DRM.mode = "spin"; MIX.target = 0; scene("checkin"); lock(0.6);   /* 체크인 중에도 통은 천천히 돈다 · 틈이 12시에 올 때 묶어서 넣는다 */
    SFX.play("whoosh", 0.9);
    if (NOCK()) {                                      /* 261006 · 지금까지 받은 행운권을 넣고, 마지막으로 한 번 더 읽어 그사이 생긴 번호까지 넣는다(그 뒤로는 읽지 않는다) */
      if (SRV.polling) { clearInterval(SRV.polling); SRV.polling = null; }
      nockQueue();
      if (CFG.mode === "server" && SRV.hasPool) serverLoad(function () {});
      return;
    }
    if (CFG.mode === "server") { if (SRV.polling) clearInterval(SRV.polling); SRV.polling = setInterval(function () { if ((SC === "idle" || SC === "checkin") && SRV.hasPool) serverLoad(function () {}); }, 3000); }
  }
  function closeCheckin() {
    if (SC !== "checkin") return;
    ARR.q.length = 0; ARR.auto = false; DROPS.length = DROPS.filter(function (d) { return d.at <= T + 0.5; }).length ? DROPS.length : 0;
    qrBurst(); MIXT = 0; MIXSKIP = false; MIXSKIPAT = 0; MIX.target = (LOADW - 0.2) / TUNE.wmix;
    ST.ckMin = ST.ckAt ? ((REC ? T * 1000 : Date.now()) - ST.ckAt) / 60000 : 0; MINMIX = NOCK() ? NOCKMIX : minMixFor(ST.ckMin);   /* 261006 · 섞은 순서로 넣었으니 체크인 길이 규칙 대신 10초 */
    ST.closed = true; if (SRV.polling) { clearInterval(SRV.polling); SRV.polling = null; }
    /* 서버 체크인도 닫는다 · draw_cfg 에 closed 가 생기면 쓰인다 · 지금 서버는 모르는 값을 무시하고 설정을 그대로 돌려준다(쓰기 없음) */
    if (CFG.mode === "server") jsonp("draw_cfg", { closed: 1 }, function (res) { SRV.closeStatus = res && res.ok ? (res.closed ? "서버 체크인 닫힘" : "서버가 닫기를 아직 모름 · 화면만 마감") : "서버 닫기 실패 · 화면만 마감"; pushCtl(); });
    scene("closed"); lock(0.8); SFX.play("stamp");
  }
  function goCard() {
    stageTo("orange", DX, DY, 0.7); scene("card"); lock(0.8); SFX.play("whoosh", 0.8); setTimeoutSim(function () { SFX.play("bell", 784, 0.12); SFX.play("bell", 1175, 0.08); }, 0.35);
  }
  function goMix() {
    stageTo("black", 960, 540, 0.6); scene("mix"); lock(0.6); MIX.target = 1;
  }
  function draw() {
    if (DRM.mode !== "spin" || DROPS.length || nFalling) { toast("공을 넣는 중입니다 · 잠시 뒤 다시", true); return "loading"; }
    /* 이미 당첨 · 부재로 빠질 분의 공은 먼저 모두 뺀다(남은 팝 예약도 지금 처리) · 통에 남은 공은 전부 당첨 자격이 있다 */
    OUTPOP = null; POPS.length = 0;
    var i, gone = 0;
    for (i = 0; i < NB; i++) if ((bs[i] === 2 || bs[i] === 1) && ST.out[bpk[i]]) { popBall(i); gone++; }
    if (gone) toast("빠질 공 " + gone + "개를 먼저 뺐습니다", true);
    var el = eligible();
    if (!el.length) { toast("통에 공이 없습니다"); return "empty"; }
    var r = curRound(), wins = roundWins(ST.round).length;
    if (wins >= r.count) { toast("이 라운드 인원이 다 찼습니다"); return "full"; }
    /* (가) 물리 결정 · 버튼 순간 암호 난수로 물리 난수 씨앗을 다시 심고, 감속 시간과 통 안 모든 공의 속도를 흔든다
     *     통은 감속해 틈을 6시에 세운다 · 틈을 처음 통과한 공이 당첨 */
    var u = cryptoUnits(2 + NB * 2);
    rng = mulberry(Math.floor(u[0] * 4294967296));
    for (i = 0; i < NB; i++) if (bs[i] === 2) { var ka = u[2 + i * 2] * 6.2832, kv = R * 0.12 * u[3 + i * 2]; bpx[i] -= Math.cos(ka) * kv; bpy[i] -= Math.sin(ka) * kv; }
    startPark(SIX, Math.PI * 0.6, 1 + 0.35 * u[1], 2.2, PARKMAX);
    DRAW.t0 = T; DRAW.stopT = -1; DRAW.opened = false; DRAW.heart = T + 0.5; DRAW.tick = Math.floor(MIX.rot / (6.2832 / 24)); DRAW.n0 = el.length; DRAW.resume = 0;
    GAP.live = false; GAP.pull = 0; doorSet(0, 0);
    ST.drawing = 1;
    scene("tension"); lock(99);
    SFX.play("riser", PARK.Td + 0.4);
  }
  /* 감속 → 6시 멈춤(쿵) → DOORWAIT 초 정적 → 「철컥」 문이 옆으로 열린다 → 떨어지기를 기다린다
   *   v3.1 · 문이 열린 뒤 1.2초 안에 안 떨어지면 통을 살짝 흔들고(6시 근처 ±) · 4초부터 틈이 가까운 공을 끌고 · 6초에 가장 가까운 공을 통과시킨다(마지막 안전장치)
   *   한 공이 지나가면 그 스텝에 문이 닫혀 둘째 공은 나오지 못한다
   * 실제 화면과 공정성 시험(simDraw · monteCarlo)이 같은 함수를 쓴다 */
  var ROCK0 = 0.7, PULL0 = 4, FORCE0 = 6, PARKMAX = 4.0;   /* v3.2 · 흔들기 시작 1.2 → 0.7초 · 감속 최대 4.6 → 4.0초(공 300개에서 누른 뒤 7초를 넘는 일이 있었다 · 4.6초 때 2,700번 중 2번 · 4.2초 때 6,600번 중 1번) */
  function drawTick(sfx) {
    if (DRM.mode === "park") {
      if (stepPark()) { DRAW.stopT = T; if (sfx) { SFX.play("stamp"); CAM.amp = 2.6; } }
      return;
    }
    if (DRM.mode !== "hold" || DRAW.stopT < 0) return;
    if (!DRAW.opened) { if (T - DRAW.stopT >= DOORWAIT) { DRAW.opened = true; doorSet(1, sfx ? 1 : 0); } return; }
    if (DOOR.openT < 0) return;                          /* 문이 공 지름만큼 열릴 때까지 */
    GAP.live = true;
    var w = T - DOOR.openT, rock = w > ROCK0 ? Math.min(0.06, 0.02 + (w - ROCK0) * 0.012) : 0;
    var nr = DRM.hold + rock * Math.sin((w - ROCK0) * 6.2832 * 2.6);
    MIX.w = (nr - MIX.rot) / Math.max(1e-3, EXDT); MIX.rot = nr;
    GAP.pull = w > PULL0 ? clamp((w - PULL0) / 2, 0, 1) : 0;
    if (w > FORCE0) {
      var best = -1, bd = 1e9, ga = gapAng(), gx = DX + Math.cos(ga) * DR, gy = DY + Math.sin(ga) * DR;
      for (var i = 0; i < NB; i++) if (bs[i] === 2 && !ST.out[bpk[i]]) { var d = Math.hypot(bx[i] - gx, by[i] - gy); if (d < bd) { bd = d; best = i; } }
      if (best >= 0) { if (!MC.on) MC.forced = (MC.forced || 0) + 1; else MC.forcedSim = (MC.forcedSim || 0) + 1; capture(best); }
    }
  }
  function stepTension() {
    drawTick(true);
    var tk = Math.floor(MIX.rot / (6.2832 / 24));      /* 통 톱니 소리 · 감속하며 간격이 벌어진다 */
    if (tk !== DRAW.tick) { DRAW.tick = tk; SFX.play("clack", 0.35); }
    if (T >= DRAW.heart) { SFX.play("heart"); DRAW.heart = T + Math.max(0.55, 0.95 - sT() * 0.08); }
  }
  /* 처음 통과한 공 · 이 순간 당첨이 정해지고 바로 저장된다(새로고침해도 같은 결과) · 점 하나가 틈을 막고 통이 다시 돈다 */
  function capture(i) {
    GAP.live = false; GAP.pull = 0; doorSet(0, MC.on ? 0 : 0.5);   /* 지나간 그 스텝에 문이 닫힌다 */
    if (MC.on) { MC.hit = i; return; }
    var bp = ST.big ? bigPick() : null;
    if (bp) {                                         /* 261006 대표 공 모드 · 떨어진 공에 행운권 전체에서 암호 난수로 뽑은 번호를 붙인다(공은 연출 · 결과는 전체 추첨) */
      if (ballOfNo[bno[i]] === i) delete ballOfNo[bno[i]];
      bno[i] = bp.no; bpk[i] = bp.pk; bnoI[i] = +bp.no; bnum[i] = numOf(bp.no); if (ballOfNo[bp.no] == null) ballOfNo[bp.no] = i;
    }
    var el = bp ? bp.n : eligible().length, r = curRound(), wins = roundWins(ST.round).length, pp = ST.pool.people[bpk[i]] || {};
    var res = { id: "r" + Date.now().toString(36) + Math.floor(rng() * 1e4), round: ST.round, slot: wins + 1, no: bno[i], pk: bpk[i],
      nm: pp.nm || "", dp: pp.dp || "", prize: r.prize, rname: r.name, at: new Date().toISOString(), st: "win", pool: el, sec: +(T - DRAW.t0).toFixed(2) };
    if (MIXSKIP && !ST.results.length) { res.mskip = 1; res.mixed = MIXSKIPAT; }
    if (bp) res.big = 1;                              /* 대표 공 모드로 뽑힘(로컬 기록) */   /* 첫 추첨 · 최소 섞기를 건너뛰었다(로컬 기록) */
    ST.results.push(res); ST.pending = res.id; ST.drawing = 0; if (CFG.onePerPerson) ST.out[res.pk] = "win"; persist(); serverLog(res);
    WIN.i = i; WIN.r = res; WIN.z = 0; WIN.w = 0;
    /* 떨어지는 공의 월드 위치 · 속도(카메라가 따라간다) */
    WIN.xw = bx[i]; WIN.yw = by[i]; WIN.vxw = (bx[i] - bpx[i]) / PH.h * 0.5 + 40; WIN.vyw = Math.max(150, (by[i] - bpy[i]) / PH.h);
    WIN.cs0 = CAM.s; WIN.ox0 = CAM.ox; WIN.oy0 = CAM.oy;
    bs[i] = 3; bx[i] = -9999; by[i] = -9999; bpx[i] = bx[i]; bpy[i] = by[i];   /* 통 물리에서 뺀다(그림은 화면 좌표로) */
    DRW.resume = T + 0.35;
    scene("exit"); lock(99);
    SFX.play("drop", 0.2); SFX.play("lock");
  }
  /* 배출 → 공개 · 틈으로 떨어진 공을 카메라가 따라 내려간다(통은 위로 밀려나며 어두워진다) · 공은 화면 가운데로 오며 다가와 커지고 닿는 순간 터진다(멈춤 없음) */
  var EX = { T: 0.86, HR: 130, G: 1700, SF: 1.2 }, EXDT = 1 / 60, DRW = { resume: 0 };
  function stepExit() {
    var t = sT(), i = WIN.i, dur = EX.T;
    var xw = WIN.xw + WIN.vxw * t, yw = WIN.yw + WIN.vyw * t + 0.5 * EX.G * t * t;   /* 월드에서 떨어진다 */
    var w = EIO(t / dur), sc = WIN.cs0 + (EX.SF - WIN.cs0) * w;
    var osx = WIN.ox0 + WIN.xw * (WIN.cs0 - sc), osy = WIN.oy0 + WIN.yw * (WIN.cs0 - sc);   /* 시작 카메라(틈 자리를 고정한 채 배율만) */
    CAM.s = sc; CAM.ox = osx + (960 - xw * sc - osx) * w; CAM.oy = osy + (470 - yw * sc - osy) * w;
    var dtx = Math.max(EXDT, 1e-3), zf = clamp(t / dur, 0, 1);
    CAM.amp *= Math.exp(-dtx * 6);
    var vy = WIN.vyw + EX.G * t;
    if (zf < 0.55) integQuat(i * 4, -vy / R * 0.45, WIN.vxw / R * 0.45, 0, dtx);   /* 떨어지며 구른다 */
    else slerpTo(i * 4, [0, 0, 0, 1], 0.08 + 0.5 * EIO((zf - 0.55) / 0.45));    /* 다가오며 번호가 정면으로 */
    ba[i] += vy * dtx / R;
    WIN.w = w; WIN.sx = xw * sc + CAM.ox + CAM.jx; WIN.sy = yw * sc + CAM.oy + CAM.jy; WIN.a = ba[i];
    WIN.z = Math.pow(EIO(clamp((t - 0.12) / (dur - 0.12), 0, 1)), 1.6);
    if (!WIN.flew) { WIN.flew = true; WIN.aZ = Math.atan2(Math.sin(ba[i]), Math.cos(ba[i])); SFX.play("whoosh", 0.7); fade($("pMix"), 0, 0.3); }
    if (t >= dur) startReveal();
  }
  function winRad() { var rs = R * CAM.s; return rs + (EX.HR - rs) * (WIN.z || 0); }
  function winPos() { return { x: WIN.sx, y: WIN.sy }; }
  /* 공정성 점검용(시험 도구만 부른다) · 같은 물리로 추첨을 n 번 돌린다 · 기록은 남기지 않는다
   * 돌려주는 값: [당첨 공, 누른 뒤 초, 누른 순간 높이 순위, 통 안 공 수] · MC.spinEsc = 도는 동안 빠진 공 · MC.second = 첫 공 뒤 0.8초 동안 빠진 공 */
  var MC = { on: false, hit: -1, spinEsc: 0, second: 0 };
  function mcEscapes() { var n = 0; for (var i = 0; i < NB; i++) if (bs[i] === 2 && Math.hypot(bx[i] - DX, by[i] - DY) > DR + R * 0.5) n++; return n; }
  /* 체크인부터 다시 · n 개 공이 L 초 동안 고르게 도착(도착 순서 = 체크인 순서) → 통이 돌며 묶어서 받는다 → 마감 → 카드 2초 → mixSec 섞기 → 추첨 1회
   * 돌려주는 값: [당첨 공의 체크인 순서(0 = 처음), 누른 뒤 초, 통 안 공 수, 도는 동안 빠진 공, 둘째 공, 마지막 안전장치, 섞은 초] · 실제 화면과 같은 drumStep · stepDrops · drawTick · physStep 을 쓴다
   * v3.2 · mixSec 에 배열([10,20,30])을 주면 체크인 한 번에서 섞기 길이마다 추첨한다(그 순간 통 상태를 저장 → 추첨 → 되돌려 계속 섞는다 · 결과 배열)
   *        섞은 시간은 화면의 MIXT 와 같이 통이 자유롭게 돌고 넣을 공이 없을 때만 센다 · 체크인 뒤에도 남은 공은 다 넣는다(상한 L + 600초) */
  function simSave() { return { x: bx.slice(0, NB), y: by.slice(0, NB), px: bpx.slice(0, NB), py: bpy.slice(0, NB), s: bs.slice(0, NB), NB: NB, mix: Object.assign({}, MIX), drm: Object.assign({}, DRM), park: Object.assign({}, PARK), door: Object.assign({}, DOOR), gap: Object.assign({}, GAP), R: R, resume: DRW.resume }; }
  function simRestore(v) { bx.set(v.x); by.set(v.y); bpx.set(v.px); bpy.set(v.py); bs.set(v.s); NB = v.NB; Object.assign(MIX, v.mix); Object.assign(DRM, v.drm); Object.assign(PARK, v.park); Object.assign(DOOR, v.door); Object.assign(GAP, v.gap); R = v.R; DRW.resume = v.resume; ORDN = -1; }
  function simOne(mixed, esc) {
    var h = PH.h, i, t = 0, sec2 = 0, st = 0, el = eligible().length, u = cryptoUnits(2 + NB * 2);
    rng = mulberry(Math.floor(u[0] * 4294967296));
    for (i = 0; i < NB; i++) if (bs[i] === 2) { var ka = u[2 + i * 2] * 6.2832, kv = R * 0.12 * u[3 + i * 2]; bpx[i] -= Math.cos(ka) * kv; bpy[i] -= Math.sin(ka) * kv; }
    startPark(SIX, Math.PI * 0.6, 1 + 0.35 * u[1], 2.2, PARKMAX); DRAW.stopT = -1; DRAW.opened = false; doorSet(0, 0);
    MC.hit = -1; MC.forcedSim = 0;
    while (MC.hit < 0 && t < 20) { t += h; T += h; drawTick(false); physStep(h); }
    var w = MC.hit;
    if (w >= 0) { bs[w] = 0; DRW.resume = T + 0.35; }        /* 첫 공은 통 밖으로 · 점이 틈을 막고 0.35초 뒤 다시 돈다 · 둘째 공을 센다 */
    for (var t2 = 0; t2 < 1.2; t2 += h) { T += h; drumStep(h, false); physStep(h); if (++st % 6 === 0) sec2 += mcEscapes(); }
    return [w >= 0 ? +String(bno[w]).slice(1) : -1, +t.toFixed(2), el, esc, sec2, MC.forcedSim || 0, +mixed.toFixed(2)];
  }
  function simDraw(n, L, mixSec) {
    var h = PH.h, i, k = 0, t = 0, times = [], esc = 0, st = 0, many = Array.isArray(mixSec);
    var mixes = (many ? mixSec : [mixSec]).map(Number).sort(function (a, b) { return a - b; }), out = [];
    MC.on = true; CHKSIM = true; EXDT = h;
    for (i = 0; i < NB; i++) bs[i] = 0; NB = 0; ballOfNo = {}; DROPS.length = 0; POPS.length = 0; OUTPOP = null; ORDN = -1;
    for (i = 0; i < n; i++) times.push(rng() * L); times.sort(function (a, b) { return a - b; });
    DRM.mode = "spin"; MIX.e = 0; MIX.target = 0; GAP.live = false; GAP.pull = 0; DROPT = 0; DOOR.tgt = 0; DOOR.v = 0; DOOR.openT = -1; MC.forcedSim = 0;
    while (t < L + 600) {
      t += h; T += h;
      while (k < n && times[k] <= t) { DROPS.push({ at: T, no: "s" + k, pk: "s" + k }); k++; }
      if (k >= n && !DROPS.length && !nFalling && DRM.mode === "spin") break;
      countAlive(); RT = targetRadius(); R += (RT - R) * Math.min(1, h * 1.2);
      drumStep(h, true); stepDrops(); physStep(h);
      if (++st % 12 === 0) esc += mcEscapes();
    }
    CHKSIM = false;
    var mixed = 0, mi = 0;
    for (t = 0; mi < mixes.length && t < 2 + mixes[mixes.length - 1] + 600; ) {   /* 마감 · 카드(약 2초 · 체크인 속도) → 섞기 */
      if (t >= 2 && mixed >= mixes[mi] - 1e-9) { var sv = simSave(); out.push(simOne(mixed, esc)); esc = 0; simRestore(sv); mi++; continue; }
      t += h; T += h; MIX.e += ((t < 2 ? (LOADW - 0.2) / TUNE.wmix : 1) - MIX.e) * Math.min(1, h * 2.2);
      countAlive(); R += (targetRadius() - R) * Math.min(1, h * 1.2); drumStep(h, false); stepDrops(); physStep(h);
      if (t >= 2 && DRM.mode === "spin" && !DROPS.length && !nFalling) mixed += h;
      if (++st % 12 === 0) esc += mcEscapes();
    }
    MC.on = false;
    return many ? out : out[0];
  }
  function monteCarlo(n, mixSec, fresh) {
    var out = [], h = PH.h, k, i, saveT = T, saveDT = EXDT;
    MC.on = true; EXDT = h;
    for (var tr = 0; tr < n; tr++) {
      DRM.mode = "spin"; MIX.e = 1; GAP.live = false; GAP.pull = 0; DOOR.tgt = 0; DOOR.v = 0; DOOR.openT = -1; DRAW.opened = false;
      if (fresh) {                                    /* 체크인 직후처럼 · 넣은 순서대로 아래부터 쌓인 더미 · 통은 천천히 돌던 상태에서 섞기 시작 */
        var ids = [], ps = [];
        for (i = 0; i < NB; i++) if (bs[i] === 2) { ids.push(i); ps.push([bx[i], by[i]]); }
        ps.sort(function (a, b) { return b[1] - a[1]; });
        ids.forEach(function (id, q) { bx[id] = ps[q][0]; by[id] = ps[q][1]; bpx[id] = bx[id]; bpy[id] = by[id]; });
        MIX.w = 0.2; MIX.e = 0;
        for (k = 0; k < 1.0 / h; k++) { T += h; MIX.e += (1 - MIX.e) * Math.min(1, h * 2.2); spinStep(h, false); physStep(h); }
        if (TUNE.surge) for (k = 0; k < TUNE.surge / h; k++) { T += h; var wt2 = k * h < TUNE.surge * 0.6 ? TUNE.surgeW : 0.2 + TUNE.wmix; MIX.w += (wt2 - MIX.w) * Math.min(1, h * TUNE.surgeA); MIX.rot += MIX.w * h; physStep(h); }   /* 크게 한 번 돌린다(시험) */   /* 라운드 카드(약 1초) */
      }
      var ms = mixSec + rng() * 1.0;
      for (k = 0; k < ms / h; k++) { T += h; MIX.e += (1 - MIX.e) * Math.min(1, h * 2.2); spinStep(h, false); physStep(h); if (k % 12 === 0) MC.spinEsc += mcEscapes(); }
      var el = eligible(), ys = el.map(function (j) { return by[j]; }).sort(function (a, b) { return a - b; });
      var u = cryptoUnits(2 + NB * 2);
      rng = mulberry(Math.floor(u[0] * 4294967296));
      for (i = 0; i < NB; i++) if (bs[i] === 2) { var ka = u[2 + i * 2] * 6.2832, kv = R * 0.12 * u[3 + i * 2]; bpx[i] -= Math.cos(ka) * kv; bpy[i] -= Math.sin(ka) * kv; }
      var y0 = new Float32Array(NB); for (i = 0; i < NB; i++) y0[i] = by[i];
      startPark(SIX, Math.PI * 0.6, 1 + 0.35 * u[1], 2.2, PARKMAX); DRAW.stopT = -1; DRAW.t0 = T;
      MC.hit = -1; var t = 0;
      while (MC.hit < 0 && t < 20) { t += h; T += h; drawTick(false); physStep(h); }
      var w = MC.hit, rank = -1;
      if (w >= 0) { rank = 0; for (k = 0; k < ys.length; k++) if (ys[k] < y0[w]) rank++; rank /= ys.length; }
      if (w >= 0) { bs[w] = 3; bx[w] = -9999; by[w] = -9999; }
      /* 첫 공 뒤 · 점이 틈을 막고 통이 다시 돈다 · 0.8초 동안 빠지는 공을 센다 */
      DRM.mode = "spin";
      for (k = 0; k < 0.8 / h; k++) { T += h; if (k * h > 0.35) { MIX.w += (0.2 + TUNE.wmix * 0.7 - MIX.w) * Math.min(1, h * 1.5); } MIX.rot += MIX.w * h; physStep(h); if (k % 6 === 0) MC.second += mcEscapes(); }
      out.push([w, +t.toFixed(2), +rank.toFixed(3), el.length]);
      if (w >= 0) { bs[w] = 2; bx[w] = DX + (rng() - 0.5) * 100; by[w] = DY; bpx[w] = bx[w]; bpy[w] = by[w]; }   /* 공을 통에 되돌린다(점검이라 기록 없음) */
      GAP.live = false; GAP.pull = 0; DOOR.tgt = 0; DOOR.openT = -1;
    }
    MC.on = false; T = saveT; EXDT = saveDT;
    return out;
  }

  /* 공개 · 공이 터져 점이 되고, 점이 모여 번호가 된다(도트 레터링) */
  var digCanvas = null;
  function buildDigits(text) {
    if (!digCanvas) digCanvas = document.createElement("canvas");
    var w = 1600, h = 520; digCanvas.width = w; digCanvas.height = h;
    var c = digCanvas.getContext("2d", { willReadFrequently: true });
    c.clearRect(0, 0, w, h); c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "800 440px " + FONT; c.fillText(text, w / 2, h / 2 + 20);
    var d = c.getImageData(0, 0, w, h).data, pts = [], step = 15;
    for (var y = step / 2; y < h; y += step) for (var x = step / 2; x < w; x += step) {
      var a = d[(Math.floor(y) * w + Math.floor(x)) * 4 + 3];
      if (a > 110) pts.push([x - w / 2 + 960, y - h / 2 + 430]);
    }
    return pts;
  }
  function startReveal() {
    var p = winPos(), rad = winRad();
    var pts = buildDigits(WIN.r.no), n = pts.length;
    DIG.n = n; DIG.tx = new Float32Array(n); DIG.ty = new Float32Array(n); DIG.sx = new Float32Array(n); DIG.sy = new Float32Array(n); DIG.dl = new Float32Array(n);
    for (var k = 0; k < n; k++) {
      DIG.tx[k] = pts[k][0]; DIG.ty[k] = pts[k][1];
      var a = rng() * 6.2832, d = Math.sqrt(rng()) * rad;
      DIG.sx[k] = p.x + Math.cos(a) * d; DIG.sy[k] = p.y + Math.sin(a) * d;
      DIG.dl[k] = 0.05 + (pts[k][0] - 460) / 1000 * 0.35 + rng() * 0.12;
    }
    DIG.t0 = T; DIG.out = 0;
    stageTo("orange", p.x, p.y, 0.5);
    /* 파문 3겹 + 축하 점 */
    ringWave(p.x, p.y, 72, 1500, 7, 3, 1.0); ringWave(p.x, p.y, 48, 1050, 9, 1, 1.2); ringWave(p.x, p.y, 36, 700, 12, 2, 1.4);
    for (var k2 = 0; k2 < 420; k2++) { var a2 = rng() * 6.2832, s2 = 300 + rng() * 1500; spark(p.x, p.y, Math.cos(a2) * s2, Math.sin(a2) * s2 - 400, 1.6 + rng() * 1.6, 3 + rng() * 9, [3, 3, 4, 2, 1][k2 % 5], 900, 1.4); }
    SFX.play("hit");
    vidStart("burst");
    bs[WIN.i] = 0; bflag[WIN.i] = 0; delete ballOfNo[bno[WIN.i]];
    WIN.flew = false; GAP.live = false; GAP.pull = 0;
    scene("reveal"); lock(1.2);
    uiReveal(WIN.r);
  }
  function drawDigits() {
    if (!DIG.n) return;
    var t = T - DIG.t0, o = DIG.out, n = DIG.n;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    cx.fillStyle = o > 0 ? C.o : C.w;
    cx.beginPath();
    for (var k = 0; k < n; k++) {
      var u = EOB((t - DIG.dl[k]) / 0.75), x = DIG.sx[k] + (DIG.tx[k] - DIG.sx[k]) * u, y = DIG.sy[k] + (DIG.ty[k] - DIG.sy[k]) * u;
      var r = 6.2 * (0.35 + 0.65 * clamp(u, 0, 1));
      /* 정지 뒤에는 01 Me to WE 처럼 점 크기가 파도처럼 숨 쉰다 */
      if (t > 1.2) r *= 1 + 0.2 * Math.max(0, Math.sin((DIG.tx[k] - 400) * 0.006 - (t - 1.2) * 3.2));
      if (o > 0) { var v = EIO(o); x += (DIG.ox - x) * v; y += (DIG.oy - y) * v; r *= 1 - v * 0.8; }
      cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832);
    }
    cx.fill();
  }
  function confirmWin() {
    var r = WIN.r, ri = ST.round, need = curRound().count;
    ST.pending = null;
    DIG.out = 0.001; DIG.ox = 1010; DIG.oy = 520; vidCut("burst");
    stageTo("black", 960, 540, 0.6);
    SFX.play("whoosh", 0.6);
    lock(0.9);
    OUTPOP = { t: T + 0.7, pk: r.pk };
    var done = roundWins(ri).length >= need;
    if (!done) { scene("mix"); MIX.target = 1; }
    else if (ri + 1 < rounds().length) { scene("mix"); ST.round = ri + 1; persist(); MIX.target = 0.4; NEXTCARD = T + 1.6; }
    else { scene("board"); MIX.target = 0.15; }
  }
  var OUTPOP = null, NEXTCARD = 0, CARDC = null;
  function popPerson(pk) {                            /* 1인 1회 · 같은 분의 나머지 공을 뺀다 */
    var n = 0;
    for (var i = 0; i < NB; i++) if (bs[i] === 2 && bpk[i] === pk) { (function (ii, d) { POPS.push([T + d, ii]); })(i, n * 0.16); n++; }
    if (n) toast("같은 분의 공 " + n + "개 제외", true);
    return n;
  }
  var POPS = [];
  function redraw() {
    if (SC !== "reveal") return;
    var r = WIN.r; r.st = "absent"; ST.pending = null; ST.out[r.pk] = CFG.absentRemove ? "absent" : undefined; if (!CFG.absentRemove) delete ST.out[r.pk];
    serverLog(Object.assign({}, r, { st: "absent" }));
    persist();
    uiAbsent();
    DIG.out = 0.001; DIG.ox = 960; DIG.oy = 1300; vidCut("burst");
    stageTo("black", 960, 540, 0.6); SFX.play("stamp");
    if (CFG.absentRemove) OUTPOP = { t: T + 0.7, pk: r.pk };
    else { var p = ST.pool.people[r.pk]; if (p) DROPS.push({ at: T + 0.8, no: r.no, pk: r.pk }); }   /* 공을 되돌린다 */
    scene("mix"); MIX.target = 1; lock(1.2);
  }
  function undoLast() {
    for (var k = ST.results.length - 1; k >= 0; k--) {
      var r = ST.results[k]; if (r.st !== "win") continue;
      r.st = "undone"; delete ST.out[r.pk]; serverLog(Object.assign({}, r, { st: "undo" }));
      var p = ST.pool && ST.pool.people[r.pk];
      if (p) p.nos.forEach(function (no, j) { if (ballOfNo[no] == null) DROPS.push({ at: T + 0.3 + j * 0.15, no: no, pk: r.pk }); });
      if (r.round < ST.round && roundWins(r.round).length < rounds()[r.round].count) ST.round = r.round;
      if (SC === "reveal" || SC === "board") { DIG.out = 0.001; DIG.ox = 960; DIG.oy = 1300; stageTo("black"); scene("mix"); MIX.target = 1; }
      persist(); toast("마지막 당첨을 취소했습니다 · " + r.no, true); uiMix(); return;
    }
    toast("취소할 당첨이 없습니다"); return "none";
  }
  function goIdle() {
    stageTo("black"); DIG.n = 0; MIX.target = 0; scene(ST.arrived.length ? "closed" : "idle");
    if (!ST.arrived.length) ME.t0 = T;
  }
  function goEnd() {
    DIG.n = 0; stageTo("black"); MIX.target = 0;
    /* 통 안의 공이 모두 날아가 ME to WE 심볼(홍보부 원본 좌표 1,037점)이 된다 */
    var K = AXF_DATA.me, A = K.A, D = K.D, n = A.count, s = 0.84, ox = DX - 540 * s, oy = DY - 540 * s - 10;
    var from = [], alive = [];
    for (var i = 0; i < NB; i++) if (bs[i] === 2) alive.push(i);
    for (var k = 0; k < n; k++) {
      var p = axfSample(A, D, k, 0, 0), tx = ox + p[0] * s, ty = oy + p[1] * s;
      var b = alive[k];
      if (b != null) from.push([bx[b], by[b], R, tx, ty]);
      else { var a = rng() * 6.2832, rr = 1300 + rng() * 500; from.push([960 + Math.cos(a) * rr, 540 + Math.sin(a) * rr, 3, tx, ty]); }
    }
    ME.from = from; ME.t0 = T; ME.box = { x: ox, y: oy, s: s };
    for (var j = n; j < alive.length; j++) popBallQuiet(alive[j]);
    for (k = 0; k < alive.length && k < n; k++) bs[alive[k]] = 0;
    ballOfNo = {};
    scene("end"); lock(1.5); SFX.play("whoosh", 1.2); SFX.play("riser", 2.2);
    setTimeoutSim(function () { SFX.play("finale"); }, 2.3);
  }
  function popBallQuiet(i) { var x = bx[i], y = by[i]; for (var k = 0; k < 4; k++) { var a = rng() * 6.28; spark(x, y, Math.cos(a) * 200, Math.sin(a) * 200, 0.8, R * 0.3, 0, 200, 2); } bs[i] = 0; }
  function scatterSymbol() {
    var K = AXF_DATA.me, A = K.A, D = K.D, n = A.count, b = meBox();
    for (var k = 0; k < n; k += 1) {
      var p = axfSample(A, D, k, axfF(), 0), x = b.x + p[0] * b.s, y = b.y + p[1] * b.s;
      spark(x, y, (rng() - 0.5) * 240, -rng() * 260, 1.0 + rng() * 0.8, p[2] * b.s / 2, k % 9 === 0 ? 2 : 0, 1500, 0.6);
    }
  }
  function meBox() { var s = 0.62; return { x: DX - 540 * s, y: DY - 540 * s - 8, s: s }; }
  function axfF() { return T * 30; }
  function drawSymbolIdle(alpha) {
    var b = meBox(), f = axfF();
    var breathe = 1 + 0.02 * Math.sin(T * 1.25);
    var bb = { x: DX - (DX - b.x) * breathe, y: DY - 8 - (DY - 8 - b.y) * breathe, s: b.s * breathe };
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    axfDraw(cx, "me", f, bb, null, alpha);
  }
  function drawEnd() {
    var t = sT(), from = ME.from; if (!from) return;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    var u0 = 2.4, K = AXF_DATA.me, b = ME.box;
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
    if (t > u0) axfDraw(cx, "me", axfF(), b, null, clamp((t - u0) / 0.6, 0, 1));
  }

  /* ─────────────── 품질 · 공 수와 실제 fps 로 자동으로 낮춘다 ───────────────
   * 0 최고 · 1(구 분할 20×14) · 2(14×10 · 접지 그림자 끔 · 글리프 64px · 해상도 0.85) · 3(10×8 · 가림 그림자 끔 · 해상도 0.7) */
  var QA = { tier: -1, low: 0, changedT: -9, log: [] };
  function tierForCount(n) { return n <= 900 ? 0 : n <= 1700 ? 1 : n <= 2600 ? 2 : 3; }
  function applyTier(t, why) {
    t = clamp(t, 0, 3); if (FORCEQ >= 0) t = FORCEQ;
    if (t === QA.tier) return;
    QA.tier = t; QA.changedT = T; QA.log.push([Math.round(T), t, why]); if (QA.log.length > 20) QA.log.shift();
    if (GL) GL.setQuality(t);
  }
  function stepQuality(dt) {
    var want = tierForCount(nAlive);
    if (want > QA.tier && QSTART < 0) applyTier(want, "공 " + nAlive);
    if (REC || FORCEQ >= 0 || !GL) return;
    if (FPS.v < 54 && T - QA.changedT > 2.5 && QA.tier < 3 && FPS.frames > 90) { QA.low += dt; if (QA.low > 1.5) { QA.low = 0; applyTier(QA.tier + 1, Math.round(FPS.v) + "fps"); } }
    else QA.low = 0;
  }

  /* ─────────────── 매 프레임 ─────────────── */
  var beatT = 0, beatN = 0, clackT = 0, lastAir = -1, TIMERS = [];
  function setTimeoutSim(fn, sec) { TIMERS.push([T + sec, fn]); }
  function update(dt) {
    T += dt;
    /* 믹싱 에너지 · 목표로 부드럽게 */
    MIX.e += (MIX.target - MIX.e) * Math.min(1, dt * (MIX.target > MIX.e ? 2.2 : 1.6));
    drumStep(dt, SC === "checkin");
    if (SC === "mix" && ST.closed && DRM.mode === "spin" && !DROPS.length && !nFalling) MIXT += dt;   /* 마감 뒤 섞은 시간(첫 추첨 최소 섞기) · v3.2 · 남은 공을 넣으려 12시에 서 있는 동안은 세지 않는다 */
    DRUM.pulse *= Math.exp(-dt * 5);
    stepCam(dt);
    /* 박자 · 섞는 동안 120bpm · 고리 점이 박자에 맞춰 부푼다 */
    if (MIX.e > 0.3 && (SC === "mix" || SC === "tension")) {
      beatT -= dt;
      if (beatT <= 0) { beatT += SC === "tension" ? 0.25 : 0.5; beatN++; DRUM.pulse = 1; if (CFG.beat && SC === "mix") SFX.play("beat", beatN % 4 === 1); }
    } else beatT = 0;
    /* 바람 소리 · 통이 빠를수록 크다(감속하면 잦아든다) */
    var airL = Math.round(clamp(Math.abs(MIX.w) / 2.2, 0, 1) * 0.8 * 20) / 20;
    if (airL < 0.05) airL = 0;
    if (airL !== lastAir) { lastAir = airL; SFX.play("air", airL); }
    stepDrops();
    stepArrivals(dt);
    if (OUTPOP && T >= OUTPOP.t) { if (CFG.onePerPerson || ST.out[OUTPOP.pk] === "absent") popPerson(OUTPOP.pk); OUTPOP = null; }
    for (var pp = 0; pp < POPS.length; pp++) if (T >= POPS[pp][0]) { if (bs[POPS[pp][1]] === 2) popBall(POPS[pp][1]); POPS.splice(pp--, 1); }
    if (NEXTCARD && T >= NEXTCARD) { NEXTCARD = 0; goCard(); }
    if (DIG.out > 0) { DIG.out += dt / 0.7; if (DIG.out >= 1) { DIG.n = 0; DIG.out = 0; } }
    if (SC === "tension") stepTension();
    EXDT = dt;
    if (SC === "exit") stepExit();
    /* 반지름 · 공이 늘면 작아진다 */
    countAlive(); RT = targetRadius(); R += (RT - R) * Math.min(1, dt * 1.2);
    stepQuality(dt);
    /* 물리 · 고정 스텝 */
    var t0 = performance.now();
    PH.acc += dt; var steps = 0;
    while (PH.acc >= PH.h && steps < 6) { physStep(PH.h); PH.acc -= PH.h; steps++; }
    if (steps >= 6) PH.acc = 0;
    spinBalls(dt);
    PH.ms = PH.ms * 0.9 + (performance.now() - t0) * 0.1;
    if (MIX.e > 0.25 && PH.impacts) {
      clackT -= dt;
      if (clackT <= 0) { SFX.play("clack", Math.min(1, PH.impactV / 8)); if (PH.impacts > 30) SFX.play("clack", 0.4); clackT = 0.035 + rng() * 0.03; }
    }
    PH.impacts = 0; PH.impactV = 0;
    stepParticles(dt);
    if (ARR.dirty) { ARR.dirty = false; uiCheck(); }
    if (toastUntil && T > toastUntil) { toastUntil = 0; fade($("toast"), 0, 0.3); }
    if (mixSkipUntil && T > mixSkipUntil) { mixSkipUntil = 0; fade($("mixSkip"), 0, 0.4); }
    stepFades();
    stepVideos();
    for (var ti = 0; ti < TIMERS.length; ti++) if (T >= TIMERS[ti][0]) { var fn = TIMERS[ti][1]; TIMERS.splice(ti--, 1); fn(); }
    uiTick();
    scrPush(false);
  }
  function render() {
    var t0 = performance.now();
    var mainCx = cx;
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, vw, vh);
    drawStage();
    var worldA = 1;
    if (SC === "reveal" || SC === "card") worldA = STG.to ? 0.3 * (1 - clamp((T - STG.t0) / STG.dur, 0, 1)) : 0;
    if (SC === "end" || SC === "fin") worldA = 0;   /* v5.03 완주 경품 추첨 숫자 장면 · 통을 그리지 않는다(물리 연출 없음) */
    if (SC === "board") worldA = 0.55;
    if (worldA > 0.01) {
      /* 카메라 · 감속하는 동안 6시 틈 쪽으로 조금 다가가고(멈출 때 한 번 흔들림), 공이 떨어지면 따라간다 */
      var vs0 = vs, vox0 = vox, voy0 = voy, cs = CAM.s;
      vs = vs0 * cs; vox = vox0 + (CAM.ox + CAM.jx) * vs0; voy = voy0 + (CAM.oy + CAM.jy) * vs0;
      DRUM.alpha = worldA;
      drawDrum();
      if (SC === "idle") drawSymbolIdle(clamp(sT() / 0.8, 0, 1));
      if (!GL) drawBalls(worldA);
      vs = vs0; vox = vox0; voy = voy0;
    }
    var ew = SC === "exit" ? (WIN.w || 0) : 0;
    if (ew > 0) {                                      /* 따라가는 동안 통 쪽을 어둡게 · 공은 그대로 */
      cx.setTransform(vs, 0, 0, vs, vox, voy);
      cx.fillStyle = "rgba(0,0,0," + (0.62 * ew).toFixed(3) + ")"; cx.fillRect(-vox / vs, -voy / vs, vw / vs, vh / vs);
    }
    if (GL) { if (worldA > 0.01 || SC === "exit") drawBallsGL(worldA, 1 - 0.62 * ew); else GL.clear(); }
    cx = fx;
    if (worldA > 0.01) {           /* 유리 앞면은 공 위에(#fx) · 카메라 그대로 */
      var vs1 = vs, vox1 = vox, voy1 = voy; vs = vs1 * CAM.s; vox = vox1 + (CAM.ox + CAM.jx) * vs1; voy = voy1 + (CAM.oy + CAM.jy) * vs1;
      DRUM.alpha = worldA * (1 - 0.62 * ew); drawGlassFront(); vs = vs1; vox = vox1; voy = voy1;
    }
    if (!GL && SC === "exit") drawWinner();
    if (SC === "card") drawCardObject();
    drawDigits();
    if (SC === "end") drawEnd();
    drawParticles();
    cx = mainCx;
    RD.ms = RD.ms * 0.9 + (performance.now() - t0) * 0.1;
  }
  var RD = { ms: 0 };
  /* 카메라 · 화면 = 월드 × s + (ox, oy) + 흔들림(jx, jy) · 기본은 그대로(1, 0, 0) */
  var CAM = { s: 1, ox: 0, oy: 0, jx: 0, jy: 0, amp: 0 };
  function stepCam(dt) {
    if (SC !== "exit") {
      if (SC === "reveal" && STG.to) return;             /* 오렌지 스테이지가 덮는 동안은 그대로 · 덮인 뒤 원래대로 */
      var ts = 1, amp = 0, k = Math.min(1, dt * 3);
      if (SC === "tension") {                           /* 틈(6시) 쪽으로 천천히 다가간다 · 선 뒤에는 문 쪽으로 조금 더(정적 · 문이 열리는 한 박자) */
        ts = 1 + 0.07 * EIO(sT() / 3) + (DRAW.stopT >= 0 ? 0.09 * EIO((T - DRAW.stopT) / 0.7) : 0);
        amp = 0.3 + 0.9 * clamp(Math.abs(MIX.w) / 1.6, 0, 1);
      }
      if (SC === "reveal") { CAM.s = 1; CAM.ox = 0; CAM.oy = 0; CAM.amp = 0; }
      CAM.s += (ts - CAM.s) * k;
      CAM.ox += (DX * (1 - ts) - CAM.ox) * k; CAM.oy += ((DY + DR * 0.55) * (1 - ts) - CAM.oy) * k;
      CAM.amp += (amp - CAM.amp) * Math.min(1, dt * (CAM.amp > amp ? 2.5 : 4));
    }
    var a = CAM.amp, ph = T;
    CAM.jx = a * (0.6 * Math.sin(ph * 37.1) + 0.4 * Math.sin(ph * 23.3 + 1.7));
    CAM.jy = a * (0.6 * Math.sin(ph * 31.7 + 0.6) + 0.4 * Math.sin(ph * 19.9 + 2.9));
  }
  function drawWinner() {
    var p = winPos(), r = winRad(), z = WIN.z || 0;
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    if (z > 0) { cx.fillStyle = "rgba(0,0,0," + (0.55 * z).toFixed(3) + ")"; cx.fillRect(-vox / vs, -voy / vs, vw / vs, vh / vs); }
    cx.fillStyle = C.o; cx.beginPath(); cx.arc(p.x, p.y, r, 0, 6.2832); cx.fill();
    cx.save(); cx.translate(p.x, p.y); cx.rotate(z > 0 ? WIN.aZ * (1 - z) : WIN.a);
    cx.fillStyle = "#1A0B02"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.font = "800 " + (r * 0.62).toFixed(1) + "px " + FONT;
    cx.fillText(WIN.r.no, 0, r * 0.05); cx.restore();
  }
  /* 라운드 카드 · 오렌지 스테이지 + 흰 점 고리(홍보부 02 Circle 원본) 왼쪽에 잘려 걸린다 */
  function drawCardObject() {
    var a = clamp(sT() / 0.5, 0, 1);
    cx.setTransform(vs, 0, 0, vs, vox, voy);
    if (!CARDC) {                                      /* 원본 고리의 중심·반지름을 원본 좌표에서 잰다 */
      var K = AXF_DATA.circle, sx = 0, sy = 0, n = K.A.count, pts = [];
      for (var i = 0; i < n; i++) { var q = axfSample(K.A, K.D, i, 0, 0); pts.push(q); sx += q[0]; sy += q[1]; }
      sx /= n; sy /= n; CARDC = { x: sx, y: sy, r: Math.hypot(pts[0][0] - sx, pts[0][1] - sy) };
    }
    var s = 470 / CARDC.r;                               /* 고리 반지름 470 · 중심은 왼쪽 끝 가까이 → 화면 밖으로 잘린다(design.md §4 원칙 5) */
    axfDraw(cx, "circle", axfF() * 0.6, { x: 420 - CARDC.x * s, y: 590 - CARDC.y * s, s: s }, [C.w, "#FFE3D2", C.pu], a);
  }

  /* ─────────────── DOM · 글자는 움직이지 않는다(투명도만) ─────────────── */
  var E = {};
  function $(id) { return E[id] || (E[id] = document.getElementById(id)); }
  function set(id, html) { var el = $(id); if (el && el._h !== html) { el._h = html; el.innerHTML = html; } }
  /* 글자 페이드 · 장면 시계(T)로 돈다 · 녹화 모드에서도 프레임과 맞는다 */
  var FADES = [];
  function fade(el, to, dur, delay) {
    if (!el) return;
    var cur = el._op == null ? 0 : el._op;
    FADES = FADES.filter(function (f) { return f.el !== el; });
    if (!dur) { el._op = to; el.style.opacity = to; return; }
    FADES.push({ el: el, a0: cur, a1: to, t0: T + (delay || 0), dur: dur });
  }
  function stepFades() {
    for (var i = 0; i < FADES.length; i++) {
      var f = FADES[i], u = clamp((T - f.t0) / f.dur, 0, 1), v = f.a0 + (f.a1 - f.a0) * u;
      f.el._op = v; f.el.style.opacity = v.toFixed(3);
      if (u >= 1) FADES.splice(i--, 1);
    }
  }
  var PANELS = { intro: "", idle: "pIdle", checkin: "pCheck", closed: "pCheck", mix: "pMix", tension: "pMix", exit: "pMix", reveal: "pReveal", card: "pCard", board: "pBoard", end: "pEnd", fin: "pFin" };
  function uiScene() {
    var s = SC, on = PANELS[s];
    if (NOCK() && (s === "idle" || s === "checkin" || s === "closed")) on = "pPool";   /* 261006 체크인 요소 없음 */
    document.body.classList.toggle("nock", NOCK());
    ["pIdle", "pCheck", "pPool", "pMix", "pReveal", "pCard", "pBoard", "pEnd", "pFin"].forEach(function (id) {
      if (id === on) { if (s !== "exit") fade($(id), 1, 0.35, 0.22); }
      else fade($(id), 0, 0.2);
    });
    if (s === "idle") uiIdleCount();
    if ((s === "checkin" || s === "closed") && !NOCK()) uiCheck();
    if (on === "pPool") uiPool();
    if (s === "mix" || s === "tension" || s === "exit") uiMix();
    if (s === "card") uiCard();
    if (s === "board") uiBoard();
    if (s === "fin") uiFin();
    pushCtl();
  }
  /* ─── 체크인 QR · 앱 주소 #s=<추첨 코드>(앱 qrRoute 의 AXD 경로 · draw_in) · 코드는 하드코딩하지 않는다
   *     서버 모드 = 관리코드로 draw_stats 의 code · 데모 = 가짜 코드(찍어도 체크인되지 않는다) · 마감되면 점으로 흩어진다 ─── */
  var QRS = { code: "", url: "", mat: null, st: "", gone: false };
  function appBase() {
    if (CFG.appBase) return CFG.appBase;
    if (/^https?:$/.test(location.protocol)) return location.origin + location.pathname.replace(/draw\/[^\/]*$/, "").replace(/[^\/]*$/, "");
    return "https://hiphopinos-web.github.io/hi_ax/";   /* 오프라인(file://)으로 연 경우 · 배포 주소 */
  }
  function qrCode(done) {
    if (CFG.mode !== "server") { qrSet("AXDDEMO00", "데모 코드 · 찍어도 체크인되지 않습니다"); if (done) done(); return; }
    QRS.st = "불러오는 중";
    jsonp("draw_stats", {}, function (res) {
      if (res && res.ok && res.code) qrSet(String(res.code), "");
      else { QRS.mat = null; QRS.code = ""; QRS.st = res && res.ok ? "서버 업데이트 뒤 표시" : "QR 코드를 불러오지 못했습니다<br>조작 창의 관리코드를 확인하세요"; qrShow(); }
      if (res && res.ok && res.closed != null) SRV.srvClosed = +res.closed;   /* 서버 체크인 마감 여부(추첨_마감) · 없으면 옛 서버 */
      if (res && res.ok && res.pool) { SRV.stat = res.pool; SRV.att = res.att; uiPool(); }   /* 261006 · 응모 인원 · 행운권 장수(draw_pool 이 오기 전 대기 화면 숫자) */
      pushCtl(); if (done) done();
    });
  }
  function qrSet(code, note) {
    QRS.code = code; QRS.url = appBase() + "#s=" + code; QRS.st = ""; QRS.note = note || "";
    try { QRS.mat = window.AXQR ? window.AXQR.make(QRS.url) : null; } catch (e) { QRS.mat = null; QRS.st = "QR 을 만들지 못했습니다"; }
    ["qrI", "qrC"].forEach(function (id) {
      var c = $(id); if (!c) return;
      var q = QRS.mat; if (!q) { c.width = 1; c.height = 1; return; }
      var n = q.size + 8, sc = 4; c.width = n * sc; c.height = n * sc;   /* 모듈 4px 로 그리고 CSS 가 420px 로 늘린다(가장자리 선명 · pixelated) */
      var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#000";
      for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.get(x, y)) g.fillRect((x + 4) * sc, (y + 4) * sc, sc, sc);
    });
    qrShow();
  }
  function qrShow() {
    var closed = !!ST.closed, ok = !!QRS.mat && !closed;
    [["qrI", "qrIm", "qrId"], ["qrC", "qrCm", "qrCd"]].forEach(function (k) {
      var c = $(k[0]), m = $(k[1]); if (!c || !m) return;
      if (!QRS.gone || !closed) c.style.opacity = ok ? "1" : "0";
      m.innerHTML = closed ? '<span class="qclosed">마감</span>' : QRS.st || "";
      m.style.opacity = closed || (!QRS.mat && QRS.st) ? "1" : "0";
      set(k[2], ok ? esc(QRS.note || "") : "");
    });
  }
  /* 마감 · QR 모듈이 점으로 흩어져 떨어진다(design.md · 점으로 모이고 흩어진다) */
  function qrBurst() {
    var c = $("qrC"), q = QRS.mat; if (!c || !q || SC !== "checkin") return;
    var r = c.getBoundingClientRect(); if (!r.width) return;
    var x0 = (r.left - FRS.ox) / FRS.s, y0 = (r.top - FRS.oy) / FRS.s, cell = r.width / FRS.s / (q.size + 8), cxq = x0 + r.width / FRS.s / 2, cyq = y0 + r.height / FRS.s / 2;
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) {
      if (!q.get(x, y)) continue;
      var px = x0 + (x + 4.5) * cell, py = y0 + (y + 4.5) * cell, a = Math.atan2(py - cyq, px - cxq), sp = 120 + rng() * 380;
      spark(px, py, Math.cos(a) * sp + (rng() - 0.5) * 80, Math.sin(a) * sp - 160 * rng(), 0.8 + rng() * 0.7, cell * 0.46, (x + y) % 5 === 0 ? 0 : 3, 1100, 1.2);
    }
    QRS.gone = true; c.style.opacity = "0";
  }
  function uiIdleCount() { set("iCnt", (ST.arrived.length + ARR.q.length).toLocaleString("en-US")); uiPool(); }
  /* 261006 · 체크인 없음 · 응모 인원 · 행운권 장수 · 처음 받는 데 수 초(행운권 전체) 걸리면 「불러오는 중」 · 서버 집계(draw_stats pool)가 먼저 오면 그 숫자 */
  function nf(v) { return Number(v || 0).toLocaleString("en-US"); }
  function poolCount() {
    var ppl = 0, tks = 0;
    if (ST.pool) ST.pool.order.forEach(function (pk) { var p = ST.pool.people[pk]; if (p && p.nos.length && !ST.out[pk]) { ppl++; tks += p.nos.length; } });
    else if (SRV.stat) { ppl = +SRV.stat.n || 0; tks = +SRV.stat.balls || 0; }
    return { ppl: ppl, tks: tks, known: !!ST.pool || !!SRV.stat };
  }
  function uiPool() {
    if (!NOCK()) return;
    var el = $("pPool"); if (!el) return;
    var c = poolCount(), loadPool = CFG.mode === "server" && !ST.pool, s = SC;
    set("oPeo", c.known ? nf(c.ppl) : "-"); set("oTk", c.known ? nf(c.tks) : "-");
    set("oTitle", s === "checkin" ? "추첨 준비" : s === "closed" ? "추첨 준비 끝" : "경품 추첨");
    var note = loadPool ? "행운권 불러오는 중" : s === "idle" ? "" : ST.big ? "통에는 무작위 " + nf(ST.repN) + "장 · 당첨은 행운권 전체에서" : "공 1개 = 행운권 1장";
    var on = $("oNote"); on.textContent = note; on.classList.toggle("load", loadPool);
    $("oLk7").style.display = s === "idle" ? "" : "none";
  }
  /* 7등 랜덤 굿즈 한 줄(대기 · 끝 화면) · 무대에서 뽑지 않는다 · 세트 구성 사진(앱 룰렛 경품 _v2) 겹쳐 보이기 */
  var LK7 = { n: 60, pics: ["rl1_tumbler_v2", "rl4_sticker_v2", "rl2_keyring_v2", "rl5_pen_v2"] };
  function lk7Html() {
    return '<span class="pics">' + LK7.pics.map(function (f) { var k = (PIC_K[f] || 0.59) * 100 + "%"; return '<span><img src="' + PIC_DIR + f + '.webp" alt="" decoding="async" style="width:' + k + ";height:" + k + '"></span>'; }).join("") + "</span>" +
      "<span><b>7등 랜덤 굿즈 " + LK7.n + "명</b><em>행사 뒤 추첨 · 사내 우편 발송</em></span>";
  }
  function uiCheck() {
    var balls = 0; ST.arrived.forEach(function (pk) { var p = ST.pool && ST.pool.people[pk]; if (p) balls += p.nos.length; });
    set("cEye", ST.closed ? "Check-in closed." : "Check-in");
    set("cBig", balls.toLocaleString("en-US"));
    set("cMeta", ST.arrived.length.toLocaleString("en-US"));
    set("cCap", ST.closed ? "체크인을 마감했습니다" + (SRV.late && !remote() ? "<br>마감 뒤 " + SRV.late + "명(통에 넣지 않음)" : "") : "QR을 찍어 추첨에 체크인하세요<br>시작하면 마감");
    qrShow();
    var rows = ST.closed ? "" : ARR.lastPk.slice(0, 2).map(function (pk) {
      var p = ST.pool.people[pk]; if (!p) return "";
      var nm = CFG.tickerNames && CFG.nameMode === "mask" && p.nm ? '<b>' + esc(mask(p.nm)) + "</b>" : "";
      return '<div class="trow">' + nm + p.nos.map(function (n) { return '<span class="chip">' + n + "</span>"; }).join("") + "</div>";
    }).join("");
    set("ticker", rows);
    document.body.classList.toggle("closed", !!ST.closed);
  }
  /* v3.1 글자 맞춤 · 한 줄로 mx px 에서 시작해 칸에 맞게 줄인다 → mn 아래로 내려가야 하면 mn 에서 두 줄(lines 2) → 그래도 넘치면 말줄임
   *   1920×1080 논리 무대 안에서 재므로(화면 배율은 #frame 변환) 1280×720 · 4K 에서도 같은 결과 · 글꼴이 늦게 오면 refitAll 로 다시 */
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
  function refitAll() {
    var a = document.querySelectorAll(".fit"); for (var k = 0; k < a.length; k++) if (a[k]._fit) fitText(a[k], a[k]._fit[0], a[k]._fit[1], a[k]._fit[2]);
    fitMList();
  }
  /* 당첨자 한 줄 · 이름(가림)과 부서를 따로 둔다(부서는 이름 아래 · 결과판 7명 이상이면 이름 옆) */
  function whoHtml(w) {
    var named = CFG.nameMode === "mask" && w.nm, dp = named && CFG.showDept && w.dp ? String(w.dp).trim() : "";
    return '<span class="who"><span class="nm fit">' + esc(named ? mask(w.nm) : "응모 번호 " + w.no) + "</span>" + (dp ? '<span class="dp fit">' + esc(dp) + "</span>" : "") + "</span>";
  }
  function uiMix() {
    var r = curRound(), wins = roundWins(ST.round, true), n = wins.length;
    set("mEye", esc(r.name)); fitText($("mEye"), 42, 30, 1);
    set("mTitle", esc(r.prize)); fitText($("mTitle"), 92, 60, 2);
    picInto($("mPic"), $("mImg"), r);
    set("mMeta", SC === "mix" && n >= r.count ? "추첨 완료" : r.count + "명 중 " + Math.min(r.count, n + 1) + "번째 추첨");
    var L = $("mList"), h = wins.map(function (w) { return '<div class="wrow"><span class="no">' + w.no + "</span>" + whoHtml(w) + "</div>"; }).join("");
    if (L && L._h !== h) { L._h = h; L.innerHTML = h; fitMList(); }
  }
  /* 섞기 화면 「이번 라운드 당첨」 · 줄마다 맞춘 다음, 칸을 넘치면 오래된 줄부터 접고 맨 위에 「앞의 n명」 */
  function fitMList() {
    var L = $("mList"); if (!L) return;
    var a = L.querySelectorAll(".wrow"), k, hasDp = !!L.querySelector(".dp");   /* 부서가 있으면 줄을 조금 낮게(한 라운드 3명이 접히지 않게) */
    for (k = 0; k < a.length; k++) { a[k].style.display = ""; var nm = a[k].querySelector(".nm"), dp = a[k].querySelector(".dp"); fitText(nm, hasDp ? 38 : 42, 28, 1); if (dp) fitText(dp, 24, 20, 2); }
    var more = L.querySelector(".wmore"); if (more) more.remove();
    if (L.scrollHeight <= L.clientHeight + 1 || a.length < 2) return;
    more = document.createElement("div"); more.className = "wmore"; L.insertBefore(more, L.firstChild);
    for (k = 0; k < a.length - 1 && L.scrollHeight > L.clientHeight + 1; k++) { a[k].style.display = "none"; more.textContent = "앞의 " + (k + 1) + "명 · 결과판에서"; }
  }
  function uiReveal(r) {
    var ri = r.round, rr = rounds()[ri], named = CFG.nameMode === "mask" && r.nm;
    set("rEye", esc(rr.name) + " · " + r.slot + " / " + rr.count); fitText($("rEye"), 44, 30, 1);
    set("rName", named ? esc(mask(r.nm)) : "앱의 응모 번호를 확인해 주세요"); fitText($("rName"), named ? 118 : 72, named ? 76 : 48, 2);
    set("rDept", named && CFG.showDept && r.dp ? esc(String(r.dp).trim()) : ""); fitText($("rDept"), 44, 34, 2);
    set("rPz", esc(rr.prize)); picInto($("rPic"), $("rImg"), rr); fitText($("rPz"), 54, 38, 2);
    fade($("rWho"), 0, 0); fade($("rPrize"), 0, 0); fade($("rAbs"), 0, 0);
    fade($("rWho"), 1, 0.35, 0.95); fade($("rPrize"), 1, 0.35, 1.05);
  }
  function uiAbsent() { fade($("rWho"), 0, 0.2); fade($("rPrize"), 0, 0.2); fade($("rAbs"), 1, 0.2); }
  /* v5.03 완주 경품 추첨 숫자 발표 · 명령 arg = 당첨 W . 대상 N . 마감 HHMM [. 배송 MMDD] · 숫자는 서버 값 그대로 · 이름 · 부문 · 상품별 수량 없음 · 「서버 추첨」을 숨기지 않는다 */
  function finArg(a) {
    var m = /^(\d{1,6})\.(\d{1,6})\.(\d{3,4})(?:\.(\d{3,4}))?$/.exec(String(a == null ? "" : a)); if (!m) return null;
    var hm = ("0" + m[3]).slice(-4), md = m[4] ? ("0" + m[4]).slice(-4) : "";
    return { w: +m[1], n: +m[2], cut: hm.slice(0, 2) + ":" + hm.slice(2), ship: md ? +md.slice(0, 2) + "/" + +md.slice(2) : "" };
  }
  function goFin() { DIG.n = 0; stageTo("black"); MIX.target = 0; scene("fin"); lock(0.8); SFX.play("whoosh", 0.8); }
  function uiFin() {
    var f = ST.fin || { w: 0, n: 0, cut: "17:00", ship: "" }, all = f.n > 0 && f.w >= f.n, nf = function (v) { return Number(v || 0).toLocaleString("en-US"); };
    set("fBig", (all ? "대상 전원 " : "") + '<span class="tab">' + nf(all ? f.n : f.w) + "</span><em>명</em>"); $("fBig").classList.toggle("all", all);
    set("fMeta", (all ? "" : "대상 " + nf(f.n) + "명 · ") + esc(f.cut) + " 기준 스탬프 6개");
    set("fNote", "결과는 앱 내 보상에서 확인" + (f.ship ? " · " + esc(f.ship) + " 배송" : ""));
  }
  /* 261004 등수 카드 사진 · 등수 이름(6등 … 1등)으로 앱 경품 사진 파일을 참조 · 처음에 미리 불러온다 · 못 불러오면 빈 원(사진 칸 숨김) */
  var PIC_DIR = "../assets/prize/", PIC = { "1등": "ld1_ipad", "2등": "ld2_shilla", "3등": "ld3_minix", "4등": "ld4_airpods", "5등": "ld5_pulio", "6등": "ld6_hyundai" }, PIC_OK = {};
  /* 261006 · 원 안 사진 크기(원 지름 대비) · 규칙 하나 = 사진의 흰 바탕 밖(상품) 가장 먼 점이 원 반지름의 84% 안(여백 16%) · k = 0.42 / 상품 최대 반지름(사진 폭 대비 · 파일에서 잰 값)
   *   파일이 바뀌면 다시 잰다(디자인 시안/사이니지 운영 안내 · 럭키드로우) · 표에 없는 파일 = 0.59(정사각 사진 전체가 원 안) */
  var PIC_K = { ld1_ipad: 0.79, ld2_shilla: 0.59, ld3_minix: 0.90, ld4_airpods: 0.92, ld5_pulio: 0.84, ld6_hyundai: 0.90, rl1_tumbler_v2: 0.87, rl4_sticker_v2: 0.75, rl2_keyring_v2: 0.83, rl5_pen_v2: 0.79 };
  function picK(img, f) { var k = (PIC_K[f] || 0.59) * 100 + "%"; img.style.width = k; img.style.height = k; }
  (function () { Object.keys(PIC).forEach(function (k) { var im = new Image(); im.onload = function () { PIC_OK[k] = 1; }; im.onerror = function () { PIC_OK[k] = 0; }; im.src = PIC_DIR + PIC[k] + ".webp"; }); })();
  /* 261006 · 섞기 · 당첨 공개에도 같은 사진(작은 원) · 없으면 칸을 숨긴다 */
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
    var all = ST.results.filter(function (r) { return r.st === "win" && r.id !== ST.pending; }), n = all.length, L = $("bList");
    set("bList", all.map(function (w) { return '<div class="brow"><span class="no">' + w.no + "</span>" + whoHtml(w) + '<span class="pz fit">' + esc(w.prize) + "</span></div>"; }).join(""));
    L.style.setProperty("--rows", Math.max(5, n)); L.classList.toggle("compact", n > 6);
    var fs = Math.min(44, 508 / Math.max(5, n) * 0.46), two = n <= 5 ? 2 : 1;   /* 5명 이하 = 줄 높이에 두 줄 여유 */
    L.querySelectorAll(".nm").forEach(function (e) { fitText(e, fs, fs * 0.72, 1); });
    L.querySelectorAll(".dp").forEach(function (e) { fitText(e, n > 6 ? Math.max(15, fs * 0.72) : fs * 0.6, n > 6 ? 14 : fs * 0.46, n > 6 ? 1 : two); });   /* 7명 이상은 이름 옆 한 줄(14px 아래로 줄이지 않고 말줄임) */
    L.querySelectorAll(".pz").forEach(function (e) { fitText(e, fs * 0.78, fs * 0.5, two); });
  }
  var tickN = 0;
  function uiTick() {
    if ((tickN++ % 6) !== 0) return;
    if (SC === "idle") uiIdleCount();
    else if (SC === "checkin" || SC === "closed") uiPool();
    uiHelp();
    if (NOCK() && ST.pool) { var bt = bigTickets().length; set("mCount", '<span class="lab">행운권</span><b>' + nf(bt) + '</b><em>장</em><span class="snote">' + (ST.big ? "통에는 무작위 " + nf(nInside) + "장 · 당첨은 행운권 전체에서" : "공 1개 = 행운권 1장") + "</span>"); }   /* 261006 */
    else set("mCount", '<span class="lab">통 안의 공</span><b>' + nInside.toLocaleString("en-US") + "</b><em>개</em>");
    if (document.body.classList.contains("hud-on")) set("hud", Math.round(FPS.v) + " fps · 공 " + nAlive + " · r " + R.toFixed(1) + " · 품질 " + QA.tier + (GL ? " · 입체" : " · 2D 대체") + " · 물리 " + PH.ms.toFixed(1) + "ms · 그리기 " + RD.ms.toFixed(1) + "ms");
    if (SC === "mix") { var r = curRound(), n = roundWins(ST.round, true).length; set("mMeta", n >= r.count ? "추첨 완료" : r.count + "명 중 " + Math.min(r.count, n + 1) + "번째 추첨"); }
  }
  var toastUntil = 0, kTipT = null;
  /* 원격 화면 · 키를 누른 순간의 안내(두 번 누르기 · 거절 사유)만 오른쪽 아래 작은 글자로 2.6초 · 객석에서는 거의 안 보인다 */
  function keyTip(msg) {
    var el = $("kTip"); if (!el) return;
    el.textContent = msg || ""; el.style.opacity = msg ? "1" : "0";
    clearTimeout(kTipT); if (msg) kTipT = setTimeout(function () { el.style.opacity = "0"; }, 2600);
  }
  /* 진행자 키 안내(H) · 지금 Space 가 하는 일 한 줄 */
  function uiHelp() {
    if (!document.body.classList.contains("help-on")) return;
    var nx = nextCmd(), r = curRound(), done = ST.results.filter(function (x) { return x.st === "win"; }).length;
    set("hNext", esc(nx.n) + (nx.two ? " · 두 번" : ""));
    set("hNow", esc((SCN_KO[(NOCK() ? "nock_" : "") + SC] || SCN_KO[SC] || SC) + " · " + r.name + " " + roundWins(ST.round, true).length + "/" + r.count + " · 당첨 " + done + "명"));
  }
  var SCN_KO = { idle: "대기", intro: "인트로", checkin: "체크인 중", closed: "체크인 마감", nock_checkin: "공 넣는 중", nock_closed: "추첨 준비 끝", card: "등수 카드", mix: "섞는 중", tension: "뽑는 중", exit: "뽑는 중", reveal: "당첨 공개", board: "결과판", fin: "완주 경품 추첨 발표", end: "끝 화면" };
  function toast(msg, soft) {
    if (REC && !soft) return;
    if (remote()) { CMD.msg = msg || ""; pushCtl(msg); if (KEYSRC) keyTip(msg); return; }   /* 원격 · 대형 화면에 운영 안내를 띄우지 않는다(상태 보고로) · 키를 누른 진행자에게만 구석 작은 글자(261004) */
    var el = $("toast"); el.textContent = msg; el.classList.toggle("soft", !!soft);
    fade(el, msg ? 1 : 0, 0.2); toastUntil = msg ? T + 2.6 : 0;
    pushCtl(msg);
  }

  /* ─────────────── 조작 창 연결 (노트북 화면에 조작 창, LED 에 이 화면) ─────────────── */
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
      if (m.cfg.mode || m.cfg.key != null || m.cfg.server != null || m.cfg.appBase != null) { qrCode(); remoteBoot(); }   /* 체크인 QR 코드를 다시 받는다 · 원격 연결 */
      document.body.classList.toggle("demo", CFG.mode === "demo");
      if (GL && m.cfg.pal) GL.setPalette(CFG.pal);
      uiScene();
    }
    if (m.type === "hello") pushCtl();
  }
  function snapshot(msg) {
    return { axd: 1, type: "state", scene: SC, cfg: CFG, round: ST.round, results: ST.results, arrived: ST.arrived.length, balls: nAlive, inside: nInside,
      closed: ST.closed, muted: !SFX.on, qr: { code: QRS.code, url: QRS.url, st: String(QRS.st || "").replace(/<br>/g, " ") }, srv: { close: SRV.closeStatus || "", status: SRV.status, log: SRV.logStatus || "", queue: SRV.queue.length, hasPool: !!SRV.hasPool, att: SRV.att || "", url: CFG.server || window.AXF_SERVER || "" },
      pool: ST.pool ? ST.pool.order.length : 0, toast: msg || "", fps: Math.round(FPS.v), demo: CFG.mode === "demo", q: QA.tier, gl: !!GL, late: SRV.late || 0, state: SRV.stateStatus || "" };
  }
  var lastPush = 0;
  function pushCtl(msg) {
    if (REC) return;
    var s = snapshot(msg);
    try { if (ctlWin && !ctlWin.closed) ctlWin.postMessage(s, "*"); } catch (e) {}
    try { bc && bc.postMessage(s); } catch (e) {}
  }
  function resetAll() {
    var keepSeq = ST.cmdSeq || {};
    ST = { cmdSeq: keepSeq, v: 1, seed: Math.floor(Math.random() * 1e9), scene: "idle", pool: null, arrived: [], closed: false, round: 0, results: [], out: {}, src: CFG.mode };
    NB = 0; ballOfNo = {}; pn = 0; DIG.n = 0; DROPS.length = 0; ARR.q.length = 0; ARR.lastPk.length = 0; POPS.length = 0;
    SRV.queue = []; save("axfDraw.q", []); SRV.since = ""; SRV.hasPool = false; SRV.stateChecked = true; SRV.late = 0; SRV.lateSeen = {}; if (SRV.polling) { clearInterval(SRV.polling); SRV.polling = null; }
    for (var qi = 0; qi < MAXB; qi++) bflag[qi] = 0;
    GAP.live = false; GAP.pull = 0; DOOR.tgt = 0; DOOR.openT = -1; DRM.mode = "spin"; ST.drawing = 0;
    QA.tier = -1; applyTier(0, "처음부터");
    stageTo("black"); MIX.target = 0; ME.t0 = T; save(LS_ST, ST);
    document.body.classList.remove("closed"); QRS.gone = false; qrShow();
    scene("idle"); toast("처음 상태로 되돌렸습니다", true);
  }

  /* ─────────────── 원격 조종 (관리 콘솔 → 서버 → 이 화면 · 사용자 확정 261001) ───────────────
   * 대형 화면에는 운영 흔적(조작 창 · 조작표 · 안내 토스트 · fps)을 띄우지 않는다 · 키는 F(전체 화면) · M(소리)만
   * 원격 = 주소 ?remote=1 · 서버 모드면 기본 원격(?remote=0 이면 로컬 키 조작 · 테스트 병행)
   * 규약(서버 정본 d932d21942fb · 261001)
   *   받기: ① 웹 소켓 wss …/ws?r=draw · hello { t:'hello', key } · 명령 { t:'draw', cmd, arg, seq, at, id } (같은 방의 drawscr 는 무시)
   *         ② 소켓이 없으면 2초마다 보내는 draw_scr 의 응답 cmd { seq, cmd, arg, at } 로 받는다(30초보다 오래된 명령은 실행하지 않고 기준만 옮긴다)
   *         ③ 모의 명령기(같은 브라우저 BroadcastChannel axf-draw-remote · 로컬 시험용)
   *   seq 는 서버가 매기는 단조 증가 · 출처(srv · mock)마다 처리한 seq 를 기억해 다시 하지 않는다(멱등) · 화면을 켤 때 서버의 마지막 명령은 기준점으로만
   *   absent · undo 의 arg = 대상 draw_log id · 화면의 대상과 다르면 거절한다
   *   보내기: 2초마다 draw_scr s = JSON { scene, pool, checked, round, slot, mixing_s, need_s, ready:[지금 받을 수 있는 명령], closed, last:{id,no,nm,round,slot,prize,st}, rej:{seq,cmd,why}, ver }
   * 공정성: 당첨은 이 화면 물리가 정하고 draw_log 로 기록한다 · 콘솔은 보기만 한다(부재 · 취소는 명령) */
  function remote() { return Q.has("remote") ? Q.get("remote") !== "0" : CFG.mode === "server"; }
  var CMD = { based: false, rej: null, last: null, msg: "", scrT: 0, scrEvery: 2, pollT: null, scrBusy: false, scrNo: 0 };
  var RBC = null;
  try { RBC = new BroadcastChannel("axf-draw-remote"); RBC.onmessage = function (e) { var m = e.data; if (m && m.axr && m.t === "draw") remoteCmd(m.cmd, m.arg, m.seq, "mock"); }; } catch (e) {}
  function cmdSeqOf(src) { ST.cmdSeq = ST.cmdSeq || {}; return +ST.cmdSeq[src] || 0; }
  function remoteCmd(c, arg, seq, src) {
    seq = +seq || 0; src = src || "srv";
    if (!c || (seq && seq <= cmdSeqOf(src))) return;     /* 이미 처리한 명령 */
    if (seq) { ST.cmdSeq[src] = seq; persist(); }
    var why = "";
    try { why = runCmd(String(c), arg); } catch (e) { why = "error"; }
    CMD.last = { seq: seq, src: src, cmd: c, ok: !why, why: why || "" };
    CMD.rej = why ? { seq: seq, cmd: c, why: why } : null;
    scrPush(true);
  }
  /* 명령이 지금 가능한지 · "" = 가능 · 아니면 사유(콘솔에 rej 로 보고) */
  function cmdWhy(c, arg) {
    if (c === "reset_screen") return "";
    if (T < busyUntil || NEXTCARD) return "busy";   /* 261004 · 다음 등수 카드가 곧 뜰 때(1.6초) 콘솔 뽑기가 카드를 건너뛰지 않게 */
    switch (c) {
      case "idle": return SC === "tension" || SC === "exit" ? "drawing" : SC === "idle" ? "same" : "";
      case "intro": return SC !== "idle" ? "scene" : !CFG.intro || ST.introDone ? "done" : "";   /* 261004 · 인트로는 한 번(체크인 시작 = 첫 번에만 인트로 → 체크인) */
      case "checkin": return SC !== "idle" ? "scene" : "";
      case "close": return SC !== "checkin" ? "scene" : nockLoading() ? "loading" : "";   /* 261006 · 체크인 없음 · 공을 다 넣으면 저절로 마감(그 전에는 받지 않는다) */
      case "round":
        if (!ST.closed) return "notclosed";
        if (["closed", "mix", "card"].indexOf(SC) < 0) return "scene";
        if (arg != null && arg !== "" && !(+arg >= 0 && +arg < rounds().length)) return "round";
        return "";
      case "mix": return SC !== "card" && SC !== "closed" ? "scene" : SC === "card" && sT() <= 0.8 ? "busy" : "";
      case "draw":
        if (SC !== "mix") return "scene";
        if (sT() <= 1.2) return "busy";
        if (!ST.results.length && MIXT < MINMIX) return "mixing:" + Math.ceil(MINMIX - MIXT);
        if (DRM.mode !== "spin" || DROPS.length || nFalling) return "loading";
        if (roundWins(ST.round).length >= curRound().count) return "full";
        return eligible().length ? "" : "empty";
      case "confirm": return SC !== "reveal" ? "scene" : sT() <= 1.4 ? "busy" : arg && WIN.r && String(arg) !== String(WIN.r.id) ? "id" : "";   /* 261004 · 콘솔은 방금 당첨 id 를 붙여 보낸다(다른 당첨을 확정하지 않게) */
      case "absent": return SC !== "reveal" ? "scene" : arg && WIN.r && String(arg) !== String(WIN.r.id) ? "id" : "";
      case "undo":
        var lw = null; for (var k = ST.results.length - 1; k >= 0 && !lw; k--) if (ST.results[k].st === "win") lw = ST.results[k];
        if (!lw) return "none";
        if (SC === "tension" || SC === "exit") return "drawing";
        return arg && String(arg) !== String(lw.id) ? "id" : "";
      case "board": return SC !== "mix" && SC !== "closed" ? "scene" : "";
      case "end": return SC === "tension" || SC === "exit" ? "drawing" : SC === "end" ? "same" : "";
      case "fin": return SC === "tension" || SC === "exit" ? "drawing" : arg != null && arg !== "" && !finArg(arg) ? "arg" : "";   /* v5.03 완주 경품 추첨 발표 · 추첨 중만 아니면 */
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
      case "absent": redraw(); return "";
      case "undo": return undoLast() || "";
      case "board": scene("board"); MIX.target = 0.15; finCheck(); return "";
      case "end": goEnd(); return "";
      case "fin": var fa = finArg(arg); if (!fa) return "arg"; ST.fin = fa; persist(); goFin(); return "";
    }
    return "unknown";
  }
  function scrState() {
    var last = null;
    var rn = function (i) { var x = rounds()[i]; return x ? x.name : String(i); }, cr = curRound();
    for (var k = ST.results.length - 1; k >= 0 && !last; k--) { var r = ST.results[k], rr = rounds()[r.round]; last = { id: r.id, no: r.no, nm: r.nm ? mask(r.nm) : "", st: r.st, round: rn(r.round), slot: r.slot + (rr ? "/" + rr.count : ""), prize: r.prize, at: r.at }; }
    /* 261004 · round = 등수 이름(6등) · slot = 이번 칸/인원(2/3) · 콘솔 진행판이 그대로 쓴다(예전에는 숫자 색인이라 「0」이 보였다) */
    return { scene: SC, pool: nInside, checked: ST.arrived.length + ARR.q.length, round: cr.name, slot: Math.min(cr.count, roundWins(ST.round, true).length + 1) + "/" + cr.count, mixing_s: +MIXT.toFixed(1), need_s: !ST.results.length && ST.closed ? Math.max(0, Math.ceil(MINMIX - MIXT)) : 0, mix_skip: !!MIXSKIP, mix_skip_at: MIXSKIP ? MIXSKIPAT : 0,
      ready: CMDS.filter(function (c) { return c !== "reset_screen" && !cmdWhy(c, ""); }), closed: !!ST.closed, last: last, rej: CMD.rej, seq: cmdSeqOf("srv"), msg: CMD.msg, ver: "v3", remote: remote() };
  }
  /* 상태 보고 · 2초마다(서버가 draw_scr 를 모르면 15초마다 다시 시도) · 명령을 받으면 바로 */
  function scrPush(now) {
    if (REC || BENCH) return;
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
      if (!CMD.based) { if (c && c.seq) { ST.cmdSeq = ST.cmdSeq || {}; ST.cmdSeq.srv = Math.max(cmdSeqOf("srv"), +c.seq || 0); persist(); } CMD.based = true; return; }   /* 켤 때는 기준점만 */
      if (!c || !c.cmd || !(+c.seq > cmdSeqOf("srv")) || WSD.st === "ok") return;
      var at = typeof c.at === "number" ? c.at : Date.parse(c.at || ""), now = res.t ? (typeof res.t === "number" ? res.t : Date.parse(res.t)) : Date.now();
      if (at && now && now - at > 30000) { ST.cmdSeq.srv = +c.seq; persist(); CMD.rej = { seq: +c.seq, cmd: c.cmd, why: "stale" }; return; }   /* 30초보다 오래된 명령은 실행하지 않는다 */
      remoteCmd(c.cmd, c.arg, c.seq, "srv");
    });
  }
  /* 261006 · 옛 「완주 경품 추첨」 발표 장면은 설정 완주추첨_사용 ON 일 때만 · 결과판에 처음 갈 때 한 번 묻는다(OFF = { ok:false, reason:'off' } · 옛 서버 { ok:true, off:true }) */
  function finCheck() {
    if (CFG.mode !== "server" || !sessionKey() || SRV.finAsked) return;
    SRV.finAsked = true;
    jsonp("fin_state", {}, function (res) { SRV.finOn = !!(res && res.ok && !res.off); uiHelp(); scrPush(true); });
  }
  /* 30초마다 draw_stats(관리코드) · 추첨 코드 · 서버 마감 여부(명령은 draw_scr 응답과 소켓으로 받는다) */
  function cmdPoll() {
    if (CFG.mode !== "server" || !sessionKey()) return;
    jsonp("draw_stats", {}, function (res) {
      if (!res || !res.ok) return;
      if (res.code && res.code !== QRS.code) qrSet(String(res.code), "");
      if (res.closed != null) SRV.srvClosed = +res.closed;
      if (res.pool) { SRV.stat = res.pool; SRV.att = res.att; uiPool(); }   /* 261006 · 응모 인원 · 행운권 장수(서버 집계) */
    });
  }
  function remoteBoot() {
    document.body.classList.toggle("remote", remote());
    keyAsk();
    if (CMD.pollT) clearInterval(CMD.pollT);
    CMD.pollT = setInterval(function () { if (remote()) cmdPoll(); }, 30000);
    if (remote()) { wsdOpen(); scrPush(true); }
  }
  /* 원격 · 관리코드가 없으면 처음 한 번 묻는다(대형 화면을 띄우기 전 노트북에서) · 이 창의 세션에만 둔다 */
  function keyAsk() {
    var need = remote() && CFG.mode === "server" && !sessionKey();
    document.body.classList.toggle("needkey", need);
    var f = document.getElementById("keyBox"); if (!f || f._on) return; f._on = true;
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var v = (document.getElementById("keyIn").value || "").trim(); if (!v) return;
      try { sessionStorage.setItem("axfDraw.key", v); } catch (x) {}
      document.getElementById("keyIn").value = ""; document.getElementById("keyErr").textContent = "확인 중";
      jsonp("draw_stats", {}, function (res) {
        if (res && res.ok) { document.body.classList.remove("needkey"); document.getElementById("keyErr").textContent = ""; WSD.give = false; WSD.fails = 0; qrCode(); remoteBoot(); if (!ST.pool) serverLoad(function () { pushCtl(); }); if (!SRV.polling && !ST.closed) SRV.polling = setInterval(function () { if ((SC === "idle" || SC === "checkin") && SRV.hasPool) serverLoad(function () { uiIdleCount(); }); }, pollMs()); }
        else { try { sessionStorage.removeItem("axfDraw.key"); } catch (x) {} document.getElementById("keyErr").textContent = "연결되지 않았습니다 · " + (res && (res.reason || res.err) || "응답 없음"); }
      });
    });
    f.addEventListener("keydown", function (e) { e.stopPropagation(); });
  }
  /* 웹 소켓 · wss …/ws?r=draw · hello = 관리코드 · 서버에 방이 없거나 막히면 세 번 시도 뒤 폴링만 쓴다 */
  var WSD = { ws: null, st: "off", fails: 0, give: false, t: null, ping: null, dev: "drw" + Math.floor(Math.random() * 1e9).toString(36) };
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
      if (m.t === "draw" && CMD.based) remoteCmd(m.cmd, m.arg, m.seq, "srv");   /* drawscr 등 다른 종류는 무시 */
    };
    ws.onclose = function () { if (WSD.ws !== ws) return; var was = WSD.st === "ok"; WSD.ws = null; WSD.st = "off"; clearInterval(WSD.ping); if (WSD.give) return; if (was) { WSD.t = setTimeout(function () { WSD.t = null; wsdOpen(); }, 1500); return; } wsdFail(); };
  }
  function wsdFail() { WSD.ws = null; WSD.st = "off"; if (++WSD.fails >= 3) { WSD.give = true; return; } WSD.t = setTimeout(function () { WSD.t = null; wsdOpen(); }, 1000 * Math.pow(2, WSD.fails)); }

  /* ─────────────── 키보드 (프레젠터 리모컨의 PageDown · → 도 「다음」) ─────────────── */
  function onKey(e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key;
    if (e.repeat) return;                             /* 길게 눌러도 한 번 */

    var map = { " ": "next", Enter: "next", PageDown: "next", ArrowRight: "next", c: "close", C: "close", r: "redraw", R: "redraw", u: "undo", U: "undo",
      e: "end", E: "end", i: "idle", I: "idle", m: "mute", M: "mute", f: "fs", F: "fs", h: "help", H: "help", "?": "help", g: "hud", G: "hud", p: "ctl", P: "ctl",
      d: "add", D: "add", a: "auto", A: "auto", v: "intro", V: "intro" };
    if (map[k]) { e.preventDefault(); act(map[k]); return; }
    if (/^[1-9]$/.test(k)) act("round", +k - 1);
  }

  /* ─────────────── FPS ─────────────── */
  var FPS = { v: 60, n: 0, t: 0, frames: 0 };
  var lastNow = 0;
  function loop(now) {
    var dt = lastNow ? (now - lastNow) / 1000 : 1 / 60; lastNow = now;
    FPS.n++; FPS.frames++; FPS.t += dt; if (FPS.t >= 0.5) { FPS.v = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
    update(Math.min(dt, 1 / 30));
    render();
    requestAnimationFrame(loop);
  }

  /* ─────────────── 시작 ─────────────── */
  function boot() {
    cv = document.getElementById("cv"); cx = cv.getContext("2d", { alpha: false }); frameEl = document.getElementById("frame");
    glEl = document.getElementById("gl"); fxEl = document.getElementById("fx"); fx = fxEl.getContext("2d");
    GL = (!NOGL && window.AXB && window.AXB.init(glEl, { rec: REC })) ? window.AXB : null;
    if (GL) GL.setPalette(CFG.pal);
    if (!GL) glEl.style.display = "none";
    applyTier(0, "시작");
    MINMIX = NOCK() ? NOCKMIX : minMixFor(ST.ckMin || 0);
    set("wm", AXF_WORDMARK);
    set("oLk7", lk7Html()); set("eLk7", lk7Html());   /* 261006 · 7등 한 줄 */
    document.body.classList.toggle("nock", NOCK());
    if (NOCK()) set("hOrder", "순서: 추첨 준비(행운권 전체를 통에 넣고 다 넣으면 저절로 준비 끝) → 6등 추첨 시작 → 섞기 시작 → 뽑기 → 확정 → … → 1등 → 결과판 → 끝 화면. 콘솔 「추첨 › 진행」의 큰 버튼과 같은 순서라 어느 쪽으로 눌러도 됩니다.");
    resize(); window.addEventListener("resize", function () { resize(); });
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", function () { setTimeout(resize, 50); });
    document.body.classList.toggle("demo", CFG.mode === "demo");
    if (document.fonts && document.fonts.load) document.fonts.load("800 40px AXP").then(function () { atlas.key = ""; if (GL) GL.refreshGlyphs(); refitAll(); }).catch(function () {});
    if (BENCH) {
      ST.pool = demoPool(BENCH, 99); ST.arrived = []; var c = 0;
      ST.pool.order.forEach(function (pk) { var p = ST.pool.people[pk]; if (c < BENCH) { if (c + p.nos.length > BENCH) p.nos.length = BENCH - c; ST.arrived.push(pk); c += p.nos.length; } });
      rebuildBalls(); ST.closed = true; applyTier(QSTART >= 0 ? QSTART : tierForCount(nAlive), "bench"); scene("mix"); MIX.target = 1; if (!REC) document.body.classList.add("hud-on");
    } else if (SC === "restore") {
      rebuildBalls();
      var s = ST.scene, last = ST.results[ST.results.length - 1];
      document.body.classList.toggle("closed", !!ST.closed);
      if ((s === "exit" || s === "reveal") && last && last.st === "win" && ST.pending === last.id) {
        /* 결정된 당첨을 그대로 다시 보여 준다 */
        WIN.r = last; WIN.x = 960; WIN.y = 470; WIN.z = 1; WIN.i = -1;
        var bi = ballOfNo[last.no]; if (bi != null) killBall(bi);
        SC = "exit"; startRevealRestore();
      } else if (s === "checkin") { SC = "checkin"; DRM.mode = "spin"; scene("checkin"); ARR.auto = false; if (CFG.mode === "server") SRV.polling = setInterval(function () { if (SC === "checkin" && SRV.hasPool) serverLoad(function () {}); }, pollMs()); }
      else if (s === "card") { SC = "mix"; goCard(); }
      else if (s === "board") scene("board");
      else if (s === "end") { scene("mix"); goEnd(); }
      else if (s === "fin" && ST.fin) { MIX.target = 0; scene("fin"); }   /* v5.03 완주 경품 추첨 숫자 장면 그대로 */
      else if (s === "closed") scene("closed");
      else if (s === "intro") scene("idle");
      else { scene("mix"); MIX.target = 1; }
      var wasDrawing = s === "tension" || ST.drawing; ST.drawing = 0;   /* 공이 틈을 지나기 전이면 결정이 없다 · 다시 누르면 된다 */
      toast("이어서 진행합니다 · 당첨 " + ST.results.filter(function (r) { return r.st === "win"; }).length + "건" + (wasDrawing && SC === "mix" ? " · 감속 중이던 추첨은 결과 없이 다시 뽑습니다" : ""), true);
    } else scene("idle");
    if (!BENCH && !REC && CFG.mode === "demo" && NOCK() && (!ST.pool || ST.pool.kind !== "demo")) { ST.pool = demoPool(CFG.demoN, ST.seed, CFG.demoT); uiPool(); }   /* 261006 · 데모 대기 화면 숫자 */
    if (CFG.mode === "server" && ST.pool == null) serverLoad(function () { pushCtl(); });
    if (SRV.queue.length) flushQueue();
    qrCode();
    remoteBoot();
    /* 서버 모드 · 대기 화면부터 체크인 명단을 읽는다(공은 체크인 장면이 시작되면 들어간다 · 그 전에는 숫자만) */
    if (CFG.mode === "server" && !SRV.polling && !ST.closed) SRV.polling = setInterval(function () { if ((SC === "idle" || SC === "checkin") && SRV.hasPool) serverLoad(function () { uiIdleCount(); }); }, pollMs());
    if (!REC) requestAnimationFrame(loop);
    window.__axd = { act: act, state: function () { return ST; }, cfg: function () { return CFG; }, boost: function (e) { MIX.target = e; }, kick: KICK, tune: TUNE, sim: function (n, L, m, reps) { var out = []; for (var r = 0; r < (reps || 1); r++) out.push(simDraw(n, L, m)); return out; }, minmix: function (v) { if (v != null) MINMIX = v; return MINMIX; }, mixskip: function () { return { skip: MIXSKIP, at: MIXSKIPAT, t: +MIXT.toFixed(1), can: canSkipMix() }; }, mc: function (n, m, f) { var r = monteCarlo(n, m, f); return { res: r, spinEsc: MC.spinEsc, second: MC.second }; }, pos: function () { return { x: Array.prototype.slice.call(bx, 0, NB), y: Array.prototype.slice.call(by, 0, NB), s: Array.prototype.slice.call(bs, 0, NB) }; }, 
      /* 시험용 · (가) 회전을 빠르게 하면 틈 앞을 지나는 공이 얼마나 느는가 · wmix 로 sec 초 섞으며 1초에 틈 앞(벽에 닿은 채 틈 폭 안)에 새로 들어오는 공 수 */
      gapProbe: function (sec, wmix) {
        var keep = TUNE.wmix, h = PH.h, inWin = new Uint8Array(MAXB), enters = 0, steps = 0, occ = 0; TUNE.wmix = wmix; MC.on = true; MIX.e = 1; MIX.target = 1; DRM.mode = "spin"; doorSet(0, 0);
        for (var t = 0; t < sec + 2; t += h) {
          T += h; MIX.w += (0.2 + TUNE.wmix - MIX.w) * Math.min(1, h * 1.5); MIX.rot += MIX.w * h; physStep(h);
          if (t < 2) continue;
          var ga = gapAng(), ea = gapEdgeA(), lim = DR - R, n = 0; steps++;
          for (var i = 0; i < NB; i++) { if (bs[i] !== 2) { inWin[i] = 0; continue; } var wx = bx[i] - DX, wy = by[i] - DY, wd = Math.hypot(wx, wy), da = Math.abs(angDiff(Math.atan2(wy, wx), ga)), w = wd > lim - R * 0.3 && da < ea ? 1 : 0; if (w && !inWin[i]) enters++; inWin[i] = w; n += w; }
          occ += n;
        }
        TUNE.wmix = keep; MC.on = false;
        return { wmix: wmix, w: +(0.2 + wmix).toFixed(2), entersPerSec: +(enters / sec).toFixed(1), meanInGap: +(occ / steps).toFixed(2), wallSpeedPx: Math.round((0.2 + wmix) * DR) };
      },
      /* 시험용 · 긴 이름 · 부서 배치 · kind = reveal | mix | board · rows = [{nm, dp, no, prize}] · 결과를 바꾸지 않도록 화면 글자만 그린다 */
      textTest: function (kind, rows, opt) {
        if (!BENCH) return "bench only";                  /* ?bench= 화면에서만(기록을 저장하지 않는다) */
        opt = opt || {}; CFG.showDept = opt.dept !== false; CFG.nameMode = opt.nameMode || "mask";
        var rs = rows.map(function (x, k) { return { id: "t" + k, round: 0, slot: k + 1, no: x.no || pad4(1000 + k * 37), pk: "t" + k, nm: x.nm, dp: x.dp, prize: x.prize || curRound().prize, st: "win" }; });
        if (kind === "reveal") { ST.results = rs.slice(0, 1); ST.pending = "t0"; WIN.r = rs[0]; startRevealRestore(); fade($("rWho"), 1, 0); fade($("rPrize"), 1, 0); }
        if (kind === "mix") { ST.results = rs; ST.pending = null; ST.round = 0; DIG.n = 0; if (opt.count) CFG.rounds = [{ name: opt.rname || "ROUND 01", prize: opt.prize || "경품 A", count: opt.count }]; STG.base = "black"; document.body.classList.remove("st-orange"); scene("mix"); }
        if (kind === "board") { ST.results = rs; ST.pending = null; DIG.n = 0; STG.base = "black"; document.body.classList.remove("st-orange"); scene("board"); }
        var out = []; document.querySelectorAll(".fit").forEach(function (e) { if (!e.offsetParent && getComputedStyle(e).display === "none") return; if (!e.textContent) return; var r = e.getBoundingClientRect(); out.push({ id: e.id || e.className, t: e.textContent.slice(0, 40), fs: e.style.fontSize, cls: e.className, over: e.scrollWidth > e.clientWidth + 1 && !e.classList.contains("ell") && !e.classList.contains("cl2") }); });
        return out;
      },
      scene: function () { return SC; }, gate: function () { return { mode: DRM.mode, live: GAP.live, door: +DOOR.v.toFixed(2), doorOpen: doorOpen(), w: +MIX.w.toFixed(2), gap: +(((gapAng() % 6.2832) + 6.2832) % 6.2832).toFixed(3) }; },
      wsKill: function () { WSD.give = true; clearTimeout(WSD.t); if (WSD.ws) try { WSD.ws.close(); } catch (e) {} },   /* 시험용 · 소켓을 끊고 다시 붙지 않는다(폴링 폴백 확인) */
      srv: function () { return { ws: WSD.st, wsGive: WSD.give, based: CMD.based, seq: cmdSeqOf("srv"), qr: QRS.code, qrUrl: QRS.url, close: SRV.closeStatus || "", status: SRV.status, log: SRV.logStatus || "", queue: SRV.queue.length, since: SRV.since, state: SRV.stateStatus || "", late: SRV.late || 0, balls: SRV.balls }; },
      debug: function () { var out = 0, nan = 0, maxd = 0; for (var i = 0; i < NB; i++) { if (bs[i] !== 2) continue; var d = Math.hypot(bx[i] - DX, by[i] - DY); if (d !== d || bq[i * 4] !== bq[i * 4]) nan++; if (d > DR + 2) out++; if (d > maxd) maxd = d; }
        return { n: nInside, out: out, nan: nan, maxd: Math.round(maxd), lim: Math.round(DR - R), R: +R.toFixed(1), fps: Math.round(FPS.v), q: QA.tier, qlog: QA.log.slice(-4), gl: !!GL, nanfix: NANFIX, escfix: ESCFIX, phys: +PH.ms.toFixed(2), draw: +RD.ms.toFixed(2) }; } };
  }
  function startRevealRestore() {
    var bi = WIN.i; WIN.i = 0; bs[0] = bs[0];
    var r = WIN.r, pts = buildDigits(r.no), n = pts.length;
    DIG.n = n; DIG.tx = new Float32Array(n); DIG.ty = new Float32Array(n); DIG.sx = new Float32Array(n); DIG.sy = new Float32Array(n); DIG.dl = new Float32Array(n);
    for (var k = 0; k < n; k++) { DIG.tx[k] = DIG.sx[k] = pts[k][0]; DIG.ty[k] = DIG.sy[k] = pts[k][1]; DIG.dl[k] = 0; }
    DIG.t0 = T - 2; DIG.out = 0;
    STG.base = "orange"; document.body.classList.add("st-orange");
    scene("reveal"); uiReveal(r);
  }

  /* ─────────────── 쇼릴 녹화 모드 (?rec=1) · 고정 시계 · 대본대로 조작 ─────────────── */
  if (REC) {
    SFX.log = []; SFX.clock = function () { return T; };
    /* 대본 · [기다릴 장면 | null, 그 뒤 초, 명령] · 추첨 시간은 물리가 정하므로 장면을 기다려 다음 명령을 낸다 */
    var SCRIPT = CLIP ? [[null, +(Q.get("clip") || 2.5) || 2.5, "next"]] : [
      [null, 0.0, "intro"],          /* 힉스필드 인트로 스팅 */
      [null, 7.3, "next"],           /* 체크인 시작 */
      [null, 14.0, "close"], [null, 0.25, "close"],
      [null, 1.3, "next"],           /* ROUND 01 카드 */
      ["card", 2.6, "next"],         /* 섞기 · 통이 돈다 */
      ["mix", 10.4, "next"],         /* 추첨 1 · 마감 뒤 첫 추첨은 10초 이상 섞은 다음 */
      ["reveal", 3.5, "next"],       /* 확정 */
      ["mix", 3.0, "next"],          /* 추첨 2 */
      ["reveal", 2.5, "redraw"], [null, 0.25, "redraw"],   /* 부재 · 다시 추첨 */
      ["mix", 3.0, "next"],          /* 추첨 3 */
      ["reveal", 3.5, "next"],       /* 확정 → FINAL 카드(자동) */
      ["card", 2.8, "next"],         /* 섞기 */
      ["mix", 4.0, "next"],          /* FINAL 추첨 */
      ["reveal", 4.0, "next"],       /* 확정 → 결과판 */
      ["board", 4.5, "next"]         /* 끝 화면 */
    ];
    var si = 0, stepBase = 0, waitSeen = -1;
    window.__rec = {
      boot: function () { boot(); },
      frame: function (dt) {
        dt = dt || 1 / 30;
        while (si < SCRIPT.length) {
          var e = SCRIPT[si];
          if (e[0] && SC !== e[0]) { waitSeen = -1; break; }
          if (e[0] && waitSeen < 0) waitSeen = T;
          if (T < (e[0] ? waitSeen : stepBase) + e[1]) break;
          busyUntil = 0; act(e[2]);
          if (e[2] === "next" && e[0] === "mix" && SC === "mix") break;   /* 아직 못 뽑으면(섞기 · 넣는 중) 다음 프레임에 다시 */
          stepBase = T; waitSeen = -1; si++;
        }
        update(dt); render();
        return T;
      },
      frameAsync: async function (dt) {
        this.frame(dt);
        var sk = vidSeeks();
        for (var q = 0; q < sk.length; q++) {
          var el = document.getElementById(sk[q][0]);
          if (Math.abs(el.currentTime - sk[q][1]) < 0.002) continue;
          await new Promise(function (res) { var done = false; var f = function () { if (!done) { done = true; res(); } }; el.addEventListener("seeked", f, { once: true }); setTimeout(f, 800); el.currentTime = sk[q][1]; });
        }
        return T;
      },
      done: function () { return si >= SCRIPT.length; },
      sfx: function () { return SFX.log; },
      t: function () { return T; }
    };
  }
  if (!REC) window.addEventListener("DOMContentLoaded", boot);
})();
