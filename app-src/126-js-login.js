/* ════════════════ v4.87 최초 로그인 장면 「ME to WE」 · 거울 → 로고의 탄생 (LGX) · v5.02 앞부분 다시 짬 ════════════════
   1막 = 로그인 화면(v5.02 전체 오렌지 · 정지 화면 · 아래 lfLayout): 흰 행사명 「AX Festival / 2026」.
   2막 = 입장 순간(lgxPlay): 행사명 글자가 점 약 190개로 풀려 소용돌이로 화면 가운데 한 점으로 빨려 든다(앞 구간 pre 0.55초 · 투명 캔버스)
         → 그 점(나)에서 흰 하늘이 열린다(0.65초 · 아래 반은 주황 수면 그대로) → 점이 솟았다가 같은 소용돌이 방향으로 흩어지며 곧바로 반듯한 「Me」(홍보부 원본 심볼의 M · e 점 그대로)로 모인다
         (v5.02 · 사용자 261002 「뜬금없는 동그란 원이 나왔다가 ME 가 된다 · 점이 새롭게 ME 로 바뀌는 게 좋겠다」 · 동료 점이 날아와 원을 이루던 02 Circle 단계 삭제)
         → 수평선에 내려앉는 순간 수면에 「We」가 비친다 → 반듯한 거울 장면이 머문다 → 그 사이로 원본 「to」가 끼어들고, 두 줄이 밀리며 원본 심볼의 삐딱한 배치에 그대로 안착한다
         (마지막 정지 프레임 = 원본 심볼의 점 좌표 · 합성만 · 다시 그리지 않는다) → 수면이 빠지고 부제 「ME to WE : 나의 경험을 우리의 가능성으로」가 처음이자 한 번 나온다.
   3막 = 도장과 다음 행동: 「최초 로그인」 도장 → 「시작하기」 하나 → 홈(v4.95 · 다음 스탬프 카드 없음) · 찍은 QR 이 있으면 그 카드 한 장.
         v5.83 (사용자 261006 「최초 진입 가볍게」 · 디자인 시안/최초 진입 가볍게/개편안.md) 접속 방법 질문(옛 v4.89 「앞으로 어떻게 들어올까요?」 · 홈 하루 1회 카드 · 질문 뒤 토스트) 삭제 · 아무것도 먼저 묻지 않는다
         오프닝 압축 = 실제 시간 → 장면 시각(lgxMap) · 앞 구간 0.55 → 0.3초 · 0 ~ land 를 ×1.9 · land ~ end(슬로건 1.15초)는 그대로 · 합 약 4.2초(옛 6.85초)
         건너뛰기 = 어두운 알약 · 누른 순간(0초)부터 · 장면 아무 데나 탭해도 건너뜀 · 설정 「오프닝 다시 보기」 = 시연 재생(lgxReplay · 스탬프 · 서버 없음)
         v5.07 (사용자 261003 「최초 로그인 스탬프가 전체 화면에 찍히는 다른 애니메이션과 같은 형태여야 · 두 번째부터는 없어도」) 도장 = 다른 스탬프와 같은 전체 화면 팝(stampOverlay · SPOP)
         → 시트의 도장 칸으로 안착. 나의 점이 도장 칸으로 날아가던 분신 · 시트 안 작은 도장은 걷었다. 두 번째 로그인부터는 장면도 팝도 없다(lgxEnter · 이미 받음 = 보통 입장).
   거울: M 을 위아래로 뒤집으면 W 다. 소문자 e 는 뒤집으면 e 가 아니므로 수면에는 원본 「We」 줄이 바로 선 채 비친다(마법 거울 · A안).
   B안(대문자 ME/WE 덩어리 → to 가 들어오며 원본 글자꼴로 변형)은 시안 비교용으로 남긴다(LGX.mode · 앱 기본 A).
   글자(부제)는 들어올 때 움직이지 않는다(투명도만) · v5.05 장면이 다 선 뒤 물결 한 번(lgxWave · 사용자 261002). 행사명은 글자가 아니라 점으로 바뀐 뒤 그 점이 움직인다(design.md §4 · v5.02 명시). 점 3층 크기 비(38:18:8) · 보라 핵 물결은 원본 엔진과 같다. */
var LGX = { cur: null, mode: "A", PRE: { suck: 0.55, iris: 0.2 }, PRER: { suck: 0.3, iris: 0.2 }, RATE: 1.9, IRIS: 0.65, T: {   /* v5.83 PRE = 장면 시각(그림 박자 그대로) · PRER = 실제로 걸리는 앞 구간 · RATE = 0 ~ land 를 몇 배 빠르게(lgxMap) */   /* v5.02 박자 · t = 0 은 점(나)이 생기는 순간 · 앞 구간(PRE · 행사명 → 점)은 음수 시각 · v5.07 도장 팝 6.48(찍힘 약 6.9) + 앞 구간 0.55 = 약 7.5초 · 시트 칸 안착 약 8.5초 */
  rise: 0.05,        /* 점(나)이 솟아 Me 가운데 높이로(0.6초 스프링) · 그동안 하늘이 열린다(IRIS 0.65) */
  burst: 0.6,        /* 점이 흩어지며 반듯한 Me 로(가까운 점부터 0.36초에 걸쳐 · 점마다 0.7초 스프링 · 나는 맨 나중) */
  drop: 1.75,        /* 떨어지기 시작 */
  hit: 2.05,         /* 수평선에 닿음 · 반사 시작 */
  to: 3.65,          /* 반듯한 거울 장면(약 0.9초 머묾) 뒤 · to 가 끼어든다 */
  land: 5.15,        /* 원본 심볼에 안착 · 두세 번 작게 출렁임 · 부제(핵심 메시지)가 나타난다 */
  end: 6.3,          /* 로고와 메시지가 머문 뒤(1.15초) 시트 */
  pop: 6.48          /* v5.07 도장 = 다른 스탬프와 같은 전체 화면 팝(stampOverlay · 딤 · 화면 폭 60% 도장 · 0.42초에 찍힘 · 1.5초 뒤 시트의 도장 칸으로 0.5초 비행 · v5.83 장면 도장은 0.9초 뒤 0.4초 비행 = 약 1.4초) */
} };
var LGX_C = { o: ["#FF7F32", "#FF963E", "#E6CCFF"], w: ["#FFFFFF", "#FFD2B6", "#FFFFFF"], bgW: "#FFFFFF", bgO: "#FF7F32" };
var LGX_LD = [0.5, 0.58, 0.44, 0.52, 0.56, 0.64];   /* 글자별 안착 시작(to 기준 초) · M e t o W e · 먼저 두 줄이 벌어지고 to 가 수평선을 따라 들어온 뒤 다 함께 원본 자리로 */
function lgxCl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function lgxEO(x) { x = lgxCl(x); return 1 - Math.pow(1 - x, 3); }
function lgxEI(x) { x = lgxCl(x); return x * x * x; }
function lgxEIO(x) { x = lgxCl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
/* v4.90 스프링(감쇠 진동) · u = 0~1(정해진 시간 안) · z = 감쇠(작을수록 더 출렁) · f = 그 시간 동안 진동 수 · 1을 넘었다 돌아온다(오버슈트) · u ≥ 1 이면 정확히 1 */
function lgxSpring(u, z, f) {
  if (u <= 0) return 0; if (u >= 1) return 1;
  var w = 6.2832 * f, wd = w * Math.sqrt(1 - z * z), e = Math.exp(-z * w * u);
  return 1 - e * (Math.cos(wd * u) + (z * w / wd) * Math.sin(wd * u));
}
function lgxH(i) { var v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
/* 원본 심볼(AXF_DATA.me · 1,037점 · 격자 24)을 글자 6개로 나눈다 · 붙어 있는 점끼리 한 글자 · 윗선 순서 = M · e · t · o · W · e */
function lgxSym() {
  if (LGX.sym) return LGX.sym;
  var P = AXF_DATA.me.D.points, n = P.length, par = [], i, j;
  for (i = 0; i < n; i++) par.push(i);
  function f(a) { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }
  for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (Math.abs(P[i][0] - P[j][0]) <= 26 && Math.abs(P[i][1] - P[j][1]) <= 26) par[f(i)] = f(j);
  var G = {}, ks = [];
  for (i = 0; i < n; i++) { var r = f(i); if (!G[r]) { G[r] = []; ks.push(r); } G[r].push(i); }
  var top = function (a) { var m = 1e9; a.forEach(function (q) { m = Math.min(m, P[q][1]); }); return m; };
  var gs = ks.map(function (k) { return G[k]; }).sort(function (a, b) { return top(a) - top(b); });
  /* 반듯하게 펴기 · 원본 M 과 W 는 오른쪽 위로 기운 획(이탤릭)이다 · 거울 장면에서는 글자마다 기울기를 0으로 편다(X = 편 x) · to 가 들어오면 원래 기울기로 돌아간다
     K = 글자별 기울기(행이 한 칸 내려갈 때 x 가 움직이는 칸 · 줄기 바깥선 실측: M 왼쪽 줄기 -0.17 · 오른쪽 -0.05 → -0.11, W 오른쪽 줄기 -0.10) · e · t · o 는 곧게 서 있다 */
  var K = [-0.11, 0, 0, 0, -0.1, 0], g = new Array(n), yc = [], X = new Array(n), box = [];
  gs.forEach(function (arr, k) { var a = 1e9, b = -1e9; arr.forEach(function (q) { g[q] = k; a = Math.min(a, P[q][1]); b = Math.max(b, P[q][1]); }); yc[k] = (a + b) / 2; });
  for (i = 0; i < n; i++) X[i] = P[i][0] - K[g[i]] * (P[i][1] - yc[g[i]]);
  gs.forEach(function (arr) {
    var bx = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
    arr.forEach(function (q) { bx.x0 = Math.min(bx.x0, X[q]); bx.x1 = Math.max(bx.x1, X[q]); bx.y0 = Math.min(bx.y0, P[q][1]); bx.y1 = Math.max(bx.y1, P[q][1]); });
    box.push(bx);
  });
  /* 반듯한 거울 자리(수평선 y = 0 · 원본 단위) · 윗줄 M · e = 바닥이 수평선 위 25 · 아랫줄 W · e = 윗선이 수평선 아래 25 · 아랫줄 왼쪽 끝을 윗줄 글자에 맞춘다 */
  var off = [[0, -25 - box[0].y1], [0, -25 - box[1].y1], null, null, [box[0].x0 - box[4].x0, 25 - box[4].y0], [box[1].x0 - box[5].x0, 25 - box[5].y0]];
  var mine = -1, best = 1e9, rank = [];
  for (i = 0; i < n; i++) if (g[i] === 0 && P[i][0] + P[i][1] < best) { best = P[i][0] + P[i][1]; mine = i; }   /* 나의 점 = M 왼쪽 위 */
  for (i = 0; i < n; i++) rank.push(((i * 37) % n) / n);   /* 보라 핵 물결 순서 · 원본 엔진과 같은 식 */
  LGX.sym = { P: P, X: X, g: g, box: box, off: off, mine: mine, rank: rank };
  return LGX.sym;
}
/* B안 · 대문자 덩어리 「ME」(원본과 같은 격자 24 · 굵은 획) · E 가로획 0-4 · 7-11 · 14-18 줄 = 위아래 대칭 */
function lgxBlob() {
  if (LGX.blob) return LGX.blob;
  var pts = [], c, r;
  for (r = 0; r < 19; r++) for (c = 0; c < 20; c++) {
    if (c <= 4 || c >= 15 || (r <= 13 && (Math.abs(c - (2.6 + r * 6.9 / 13)) <= 2.2 || Math.abs(c - (16.4 - r * 6.9 / 13)) <= 2.2))) pts.push([c * 24, r * 24]);
  }
  for (r = 0; r < 19; r++) for (c = 0; c < 13; c++) {
    if (c <= 4 || ((r <= 4 || r >= 14) && c <= 12) || (r >= 7 && r <= 11 && c <= 10)) pts.push([(c + 22) * 24, r * 24]);
  }
  LGX.blob = { pts: pts, w: 34 * 24, h: 18 * 24 };
  return LGX.blob;
}
/* 격자 · 화면 좌표에 고정(격자는 움직이지 않는다) · 흰 면 / 주황 면 두 장을 미리 그려 둔다 */
function lgxGrid(W, H, dpr, orange) {
  var c = document.createElement("canvas"); c.width = Math.ceil(W * dpr); c.height = Math.ceil(H * dpr);
  var x = c.getContext("2d"), GS = 28, ox = (W / 2) % GS;
  x.scale(dpr, dpr);
  for (var gy = GS / 2; gy < H; gy += GS) for (var gx = ox; gx < W; gx += GS) {
    var on = ((Math.round(gx / GS) * 7919 + Math.round(gy / GS) * 104729) >>> 0) % 1000 < 15;
    x.fillStyle = orange ? (on ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.24)") : (on ? "rgba(255,126,49,0.55)" : "#E3E3E3");
    x.fillRect(gx - 0.9, gy - 0.9, 1.8, 1.8);
  }
  return c;
}
function lgxRM() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
/* 점 하나(3층) */
function lgxDot(cx, x, y, d, cols, a) {
  if (d <= 0.3 || a <= 0) return;
  cx.globalAlpha = a;
  cx.fillStyle = cols[0]; cx.beginPath(); cx.arc(x, y, d / 2, 0, 6.2832); cx.fill();
  cx.fillStyle = cols[1]; cx.beginPath(); cx.arc(x, y, d * 9 / 38, 0, 6.2832); cx.fill();
  cx.fillStyle = cols[2]; cx.beginPath(); cx.arc(x, y, d * 4 / 38, 0, 6.2832); cx.fill();
  cx.globalAlpha = 1;
}
/* 점 무리 · 층마다 한 경로로 모아 그린다(프레임당 fill 6번) · P = [x, y, 지름, 면(0 = 주황 점 · 1 = 흰 점), 핵 끔] */
/* v4.90 점 그림(스프라이트) · 바깥 원 · 안쪽(가운데 + 핵) · 안쪽(핵 꺼짐)을 면별로 한 번 그려 두고 drawImage 로 찍는다(호 3,000개를 매 프레임 그리던 것보다 가볍다)
   바깥을 모두 먼저 찍고 안쪽을 그 위에 찍는다(겹친 바깥 원이 이웃의 안쪽 점을 가리지 않게 · 원본 3층 구조와 같다) · 로그인 화면에서 미리 만든다 */
function lgxSprites() {
  if (LGX.spr) return LGX.spr;
  var Z = 96, mk = function (fn) { var c = document.createElement("canvas"); c.width = c.height = Z; var x = c.getContext("2d"); fn(x); return c; };
  var circ = function (x, col, r) { x.fillStyle = col; x.beginPath(); x.arc(Z / 2, Z / 2, r, 0, 6.2832); x.fill(); };
  var o = {};
  [["o", LGX_C.o], ["w", LGX_C.w]].forEach(function (k) {
    o[k[0] + "0"] = mk(function (x) { circ(x, k[1][0], Z / 2); });
    o[k[0] + "1"] = mk(function (x) { circ(x, k[1][1], Z * 9 / 38); circ(x, k[1][2], Z * 4 / 38); });
    o[k[0] + "2"] = mk(function (x) { circ(x, k[1][1], Z * 9 / 38); });
  });
  LGX.spr = o;
  return o;
}
function lgxDots(cx, P, a, lq) {
  var sp = lgxSprites(), i, q, r, nm = ["o", "w"];
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

/* ════════════════ v5.02 로그인 화면 v2 「전체 오렌지」 (261002 사용자 확정 · 정본 「디자인 시안/로그인 화면/v2 계획.md」 1-6 · design.md A-5 3-1) ════════════════
   로그인 첫 화면(#splash)과 재방문(#quick)은 화면 전체가 주황 + 주황 격자다(캔버스 lf-bg · 장면의 수면과 같은 그림 lgxGrid · 같은 화면 좌표) · v5.27 그 위에 점등 층(lf-fx · lfFx).
   옛 1막(점 · 수평선 · 숨쉬기 · 파문 · 상수 LF · lfFit · lgxIdleMount)은 v5.02 에 걷었다. 행사명이 장면의 첫 재료다(빨려 듦).
   유동 배치 lfLayout: 모든 줄의 자리를 화면 높이 H 하나로 계산한다(같은 H = 같은 배치 · 키보드 열림 클래스에 기대지 않는다).
     균형 = 행사명(2줄 40/42) + 입력 묶음을 뺀 남는 공간 x 를 위 : 사이 : 아래 = 0.5 : 0.3 : 0.2 로 나눈다(위 최소 28 + 안전영역 · 사이 16 · 아래 24 + 안전영역).
     압축 P 0~1 = 안내 · QR 한 줄 · 링크 · 홈 화면 앱 카드가 먼저 높이와 투명도로 접히고, 행사명 40 → 24, 간격 12 → 8.
     압축 P 1~2 = 행사명이 24 → 16 으로 작아지며 사라지고, 칸 56 → 52(터치 48 이상), 간격 8 → 6.
   모자란 만큼만 연속으로 줄어든다(P = 0~2) · 키보드가 내려가면 같은 함수가 균형 배치로 되돌린다 · 움직임 0.26초(lf-sm · 동작 줄이기는 바로) */
var LFBG = {};   /* 화면 크기 격자 두 장(주황 · 흰) · 로그인 화면이 미리 만들고 장면이 그대로 쓴다(입장 순간 끊김 방지) */
function lfLerp(a, b, t) { return a + (b - a) * t; }
function lfSafe() { var s = el("lfSafe"); if (!s) return [0, 0]; var cs = getComputedStyle(s); return [parseFloat(cs.paddingTop) || 0, parseFloat(cs.paddingBottom) || 0]; }
function lfLayout(host) {
  var H = host.clientHeight, hd = host.querySelector(".lf-head"), fm = host.querySelector(".lf-form"), tt = host.querySelector(".lf-title"), nm = host.querySelector(".lf-name");
  if (!H || !hd || !fm || !tt) return null;
  var nmH = nm ? nm.offsetHeight : 0;   /* v5.10 점 이름(14px) · 행사명 위 · 간격 12 → 8 · 행사명과 같이 접힌다 */
  var sa = lfSafe(), sat = sa[0], sab = sa[1], rows = [], ch = fm.children, i;
  for (i = 0; i < ch.length; i++) {
    var e = ch[i], ty = e.getAttribute("data-r");
    if (!ty || e.hidden || getComputedStyle(e).display === "none") continue;
    var col = ty === "note" || ty === "pill" || ty === "links" || ty === "card";   /* 키보드에 먼저 접히는 줄 */
    rows.push({ el: e, t: ty, col: col, nat: ty === "field" ? 56 : col ? (e.firstElementChild ? e.firstElementChild.offsetHeight : 0) : e.offsetHeight });
  }
  function dims(P) {
    var pA = Math.min(P, 1), pB = Math.max(0, P - 1), fs = lfLerp(lfLerp(40, 24, pA), 16, pB), lh = Math.round(fs * 1.05), gap = lfLerp(lfLerp(12, 8, pA), 6, pB), fh = 56 - 4 * pB, hf = 0, rr = [], ng = nmH ? lfLerp(12, 8, pA) : 0;
    rows.forEach(function (r, k) {
      var kk = r.col ? Math.max(0, 1 - pA * 1.15) : 1, h = r.t === "field" ? fh : r.nat * kk, mt = k === 0 ? 0 : (r.t === "links" ? 4 : gap) * (r.col ? kk : 1);
      rr.push({ r: r, h: h, mt: mt, k: kk }); hf += h + mt;
    });
    return { fs: fs, lh: lh, ht: (nmH + ng + 2 * lh) * (1 - pB), ng: ng, hf: hf, rr: rr, pB: pB, pA: pA,
      amin: sat + (16 + 12 * (1 - pA)) * (1 - pB) + 8 * pB, bmin: 4 + (12 - 8 * pA) * (1 - pB), cmin: lfLerp(24 + sab, 12, pA) };   /* 사이는 4 아래로 줄지 않는다(행사명과 첫 칸이 닿지 않게) */
  }
  var P = 0, d = dims(0);
  while (P < 2 && H - d.ht - d.hf - d.amin - d.bmin - d.cmin < 0) { P = Math.round((P + 0.01) * 100) / 100; d = dims(P); }
  var x = Math.max(0, H - d.ht - d.hf - d.amin - d.bmin - d.cmin), a = d.amin + x * 0.5 * (1 - d.pB), c = d.cmin + x * (d.pB ? 1 : 0.2), y = H - c - d.hf;
  if (H - d.ht - d.hf - d.amin - d.bmin - d.cmin < 0) { c = Math.max(4, c + (H - d.ht - d.hf - d.amin - d.bmin - d.cmin)); y = Math.max(sat, H - c - d.hf); }   /* 다 줄여도 모자라면(낮은 화면 + 큰글씨 + 두 줄 오류) 아래 여백을 먼저 내주고 첫 칸은 화면 안에 */
  var s = host._lf || (host._lf = {}), base = 1 - d.pB;
  hd.style.transform = "translateY(" + a.toFixed(1) + "px)"; hd.style.height = d.ht.toFixed(1) + "px";
  if (!LGX.cur) hd.style.opacity = base.toFixed(3);   /* 장면 도중에는 장면 시계(lfFade)가 투명도를 맡는다 */
  tt.style.fontSize = d.fs.toFixed(1) + "px"; tt.style.lineHeight = d.lh + "px";
  if (nm) nm.style.marginBottom = d.ng.toFixed(1) + "px";
  fm.style.transform = "translateY(" + y.toFixed(1) + "px)";
  d.rr.forEach(function (o) {
    var e2 = o.r.el; e2.style.marginTop = o.mt.toFixed(1) + "px";
    if (o.r.t === "field") e2.style.height = o.h.toFixed(1) + "px";
    else if (o.r.col) { e2.style.height = o.h.toFixed(1) + "px"; e2.style.opacity = lgxCl(1 - (1 - o.k) * 2.5).toFixed(3); e2.style.visibility = o.k < 0.02 ? "hidden" : ""; }   /* 높이보다 먼저 옅어져 잘린 글자가 보이지 않는다 · 다 접히면 초점도 받지 않는다 */
  });
  var key = [P, Math.round(a), Math.round(y), Math.round(d.hf), H].join();
  if (key !== s.key) { s.key = key; s.at = performance.now(); }   /* 마지막으로 자리가 바뀐 시각 · 입장 순간 행사명이 균형 자리에 섰는지(lfStill) */
  s.H = H; s.P = P; s.a = Math.round(a); s.b = Math.round(y - a - d.ht); s.c = Math.round(c); s.fs = d.fs; s.baseOp = base; s.ht = Math.round(d.ht); s.hf = Math.round(d.hf);
  return s;
}
function lfGrids(dpr) {
  if (!LFBG.go || LFBG.vw !== innerWidth || LFBG.vh !== innerHeight || LFBG.dpr !== dpr) LFBG = { go: lgxGrid(innerWidth, innerHeight, dpr, true), gw: lgxGrid(innerWidth, innerHeight, dpr, false), vw: innerWidth, vh: innerHeight, dpr: dpr };
  return LFBG;
}
/* 배경 · 전체 주황 + 주황 격자 · 화면 좌표로 그린다(장면 lgxStage 가 t = 0 에 같은 그림을 이어 그린다) · 크기가 바뀔 때만 */
function lfBg(host) {
  var cv = host.querySelector("canvas.lf-bg"); if (!cv) return;
  var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  var dpr = Math.min(2, window.devicePixelRatio || 1), br = cv.getBoundingClientRect(), g = lfGrids(dpr), W = Math.floor(w * dpr), Hh = Math.floor(h * dpr);
  var k = [W, Hh, Math.round(br.left), Math.round(br.top), g.vw, g.vh].join();
  if (cv._k === k) return;
  cv._k = k; cv.width = W; cv.height = Hh;
  var cx = cv.getContext("2d");
  cx.setTransform(dpr, 0, 0, dpr, -br.left * dpr, -br.top * dpr);
  cx.fillStyle = LGX_C.bgO; cx.fillRect(br.left, br.top, w, h);
  cx.drawImage(g.go, 0, 0, innerWidth, innerHeight);
}
/* ════ v5.27 로그인 배경 점등(사용자 261003 · 시안 B 「점등만」 · 정본 「디자인 시안/로그인 배경/설계.md」 · design.md A-5 3-1 · 2절)
   보이지 않는 빛 커튼 2장이 천천히 흐르고, 커튼이 지나는 자리의 격자 점이 켜진다(점마다 문턱과 일렁임이 달라 한꺼번에 켜지지 않는다).
   점 자리는 lgxGrid 와 같다(화면 좌표 · 간격 28 · 가로 가운데 맞춤) · 위치는 고정, 밝기와 크기만 변한다 · 빛띠(그라데이션 면) 없음 · 바닥 격자는 lf-bg 그대로.
   글자 자리(점 이름 · 행사명 · 안내 · 이름 사번 줄 · 오류 · QR 한 줄 · 링크)와 둘레 44px 는 점등 0 · 키보드로 압축되면(P > 0) 세기 절반.
   30프레임 고정 · 점등 캔버스는 DPR 1.5 까지 · 멈춤 = 보인 시간 90초(켜진 정지 화면) · 동작 줄이기(켜진 한 장면) · 탭 가려짐 · 화면이 숨거나 걷힘(rAF 해제)
   입장 = lgxPlay 시작에서 0.55초 동안 0 으로 가라앉고 멈춘다(lfFxSettle · 장면 앞 구간과 같은 길이)
   v5.32 글자 반향 ③ 혼합(사용자 261003 · 정본 「디자인 시안/로그인 배경/글자 반향/설계.md」 8절 · 데모 안 ③)
   커튼은 60% 세기(echo.CUR) · 그 위에 낱말 반향: 낱말 자리 점이 0.2초에 켜져 0.6초 머물고 0.8초에 걸쳐 꺼진다(켜질 때 낱말 상자 둘레 점은 최대 50% 낮춤)
   · 0.3초 뒤 낱말 윤곽에서 같은 거리의 점이 차례로 켜지는 파문 3겹(0.5초 간격 · 초당 4.2칸 · 멀수록 옅어짐) · 낱말 = AX → FESTIVAL → 2026 · 주기 4.2초(한 바퀴 12.6초)
   낱말은 위 섬(맨 위부터 글자 둘레 밖인 줄)에 둔다 · 위 섬이 3줄 미만(360x640 · 375x667 · 키보드)이면 자동 「제목에서」(실제 행사명 글자 윤곽에서 파문만 · 낱말 점등 없음)
   마스크 = 글꼴로 한 번 그려 점 칸 단위로 표본(배경 질감 · 행사명 자체는 Pretendard 그대로 · 점 글자 아님 · design.md 5-20 항목 10) · 배치 · 크기 · 글꼴이 바뀔 때만 다시 만든다(프레임 비용 0)
   정지 한 장(동작 줄이기) = 첫 낱말 AX 가 옅어지며 파문이 한 겹 나간 순간(STILL) · 90초 정지 = 90초 직전 주기의 같은 순간(HOLD)
   v5.32 켜진 점 최대 크기 1.36배(반지름 0.9 + 2.9e · 번짐 7 + 16e · 사용자 261003 「블링크 조금 더 크게」)
   v5.32 커튼(오로라) 흐름 속도 3배(사용자 261003 「지금의 세 배 정도」) · 커튼 시각 = t × SPD · 30프레임 · 90초 정지 그대로 */
var LFFX = { MAX: 90, STEP: 30, CALM: 44, STILL: 1.75, HOLD: 89.95, SPD: 3, halo: null, bound: false, fontV: 0,
  echo: { WORDS: ["AX", "FESTIVAL", "2026"], T0: 0.5, PER: 4.2, GAIN: 0.4, SHARP: 0.6, LIT: 0.6, DIM: 0.5, SPEED: 4.2, RINGS: 3, AMP: 0.8, CUR: 0.6, SIZE: 5, MIN: 3, MS: 8 },   /* STILL = T0 + 1.25 · HOLD = T0 + floor((MAX - T0) / PER) × PER + 1.25 */
  cur: [
  { a: 0.46, rx: 0.56, ry: 0.62, rot: -18, px: 17, py: 23, ph: 0.2 },
  { a: 0.55, rx: 0.46, ry: 0.55, rot: 14, px: 21, py: 29, ph: 1.9 }
] };
function lfFxH(i) { var v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
function lfFxSs(a, b, x) { x = lgxCl((x - a) / (b - a)); return x * x * (3 - 2 * x); }
function lfFxHalo() {
  if (LFFX.halo) return LFFX.halo;
  var c = document.createElement("canvas"); c.width = c.height = 64;
  var x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,235,224,1)"); g.addColorStop(0.35, "rgba(255,235,224,0.45)"); g.addColorStop(1, "rgba(255,235,224,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  LFFX.halo = c; return c;
}
function lfFxMount(host) {
  if (host._fx) return;
  var cv = host.querySelector("canvas.lf-fx"); if (!cv || !cv.getContext) return;
  host._fx = { cv: cv, x: cv.getContext("2d"), dots: [], N: 0, R: 0, wd: null, wk: "", src: "", rows: 0, W: 0, H: 0, dpr: 1, k: "", calmK: "", calmAt: 0, acc: 0, t0: 0, last: 0, run: false, raf: 0, settle: -1, settleMs: 550, done: false, rm: lgxRM(), lit: 0 };
  if (LFFX.bound) return;
  LFFX.bound = true;
  var all = function (fn) { ["splash", "quick"].forEach(function (id) { var h = el(id); if (h && h._fx) fn(h); }); };
  document.addEventListener("visibilitychange", function () { all(function (h) { if (document.hidden) lfFxStop(h); else lfFxKick(h); }); });
  try {
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)"), onRm = function () { all(function (h) { lfFxStop(h); h._fx.rm = lgxRM(); lfFxKick(h); }); };
    if (mq.addEventListener) mq.addEventListener("change", onRm); else if (mq.addListener) mq.addListener(onRm);
  } catch (e) {}
  try { if (document.fonts && document.fonts.load) document.fonts.load('700 100px "Pretendard Variable"', "AXFESTIVAL2026").then(function () { LFFX.fontV++; all(lfFxKick); }, function () {}); } catch (e) {}   /* v5.32 낱말 마스크는 글꼴이 온 뒤 한 번 더 만든다 */
}
/* 크기 · 점 목록(lgxGrid 와 같은 화면 좌표 → 화면 안 좌표) · 크기가 바뀔 때만 · v5.32 점마다 격자 칸 번호(j 열 · r 줄 · 화면 안 왼쪽 위가 0) */
function lfFxBuild(host) {
  var f = host._fx, cv = f.cv, w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return false;
  var br = cv.getBoundingClientRect(), dpr = Math.min(1.5, window.devicePixelRatio || 1), k = [w, h, Math.round(br.left), Math.round(br.top), innerWidth, innerHeight, dpr].join();
  if (f.k === k) return true;
  f.k = k; f.W = w; f.H = h; f.dpr = dpr; cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr); f.dots = []; f.calmK = ""; f.wk = ""; f.wd = null;
  var GS = 28, ox = (innerWidth / 2) % GS, gx, gy, i = 0;
  for (gy = GS / 2; gy < innerHeight; gy += GS) for (gx = ox; gx < innerWidth; gx += GS) {
    var x = gx - br.left, y = gy - br.top;
    if (x > -2 && y > -2 && x < w + 2 && y < h + 2) f.dots.push({ x: x, y: y, calm: 1, th: 0.05 + 0.25 * lfFxH(i + 5), ph: lfFxH(i + 9) * 6.2832, da: 0.82 + 0.18 * lfFxH(i + 21), j: Math.round((gx - ox) / GS), r: Math.round((gy - GS / 2) / GS) });
    i++;
  }
  var n = f.dots.length, a0 = n ? f.dots[0] : null, a1 = n ? f.dots[n - 1] : null;
  f.N = n ? a1.j - a0.j + 1 : 0; f.R = n ? a1.r - a0.r + 1 : 0;
  f.dots.forEach(function (d) { d.j -= a0.j; d.r -= a0.r; });
  return true;
}
/* 글자 자리 · 글자 상자(행사명 · 안내 · 링크는 글자 폭만 · 알약 · 카드 · 점 이름은 상자째) 안 = 0 · 둘레 44px 에서 서서히 1 */
function lfFxCalm(host) {
  var f = host._fx, br = f.cv.getBoundingClientRect(), rs = [], i, b;
  var q = host.querySelectorAll(".lf-name svg, .lf-title span, .lf-note, .lf-who, .lf-links .ax-link, #err, #qErr, .axs-pend, .axs-sacard");
  for (i = 0; i < q.length; i++) {
    var e = q[i]; b = null;
    if (/^(SPAN|P|BUTTON)$/.test(e.tagName) && e.id !== "err" && e.id !== "qErr") { try { var rg = document.createRange(); rg.selectNodeContents(e); b = rg.getBoundingClientRect(); } catch (er) { b = null; } }
    if (!b || !b.width) b = e.getBoundingClientRect();
    if (b.width > 0 && b.height > 0) rs.push([b.left - br.left - 4, b.top - br.top - 4, b.right - br.left + 4, b.bottom - br.top + 4]);
  }
  f.dots.forEach(function (d) {
    var m = 1;
    for (var j = 0; j < rs.length; j++) { var r = rs[j], dx = Math.max(r[0] - d.x, 0, d.x - r[2]), dy = Math.max(r[1] - d.y, 0, d.y - r[3]); m = Math.min(m, lfFxSs(0, LFFX.CALM, Math.sqrt(dx * dx + dy * dy))); }
    d.calm = m;
  });
  lfFxWords(host);   /* v5.32 글자 반향 마스크(바뀐 것이 있을 때만) */
}
/* ── v5.32 글자 반향 마스크 ── 낱말을 글꼴로 한 번 그려 점 칸(8px 표본) 단위 덮임 정도로 · 칸 번호 = 점 j · r */
function lfFxCover(word, N, R, r0, gh) {
  var MS = LFFX.echo.MS, cw = N * MS, ch = gh * MS, c = document.createElement("canvas"); c.width = cw; c.height = ch;
  var x = c.getContext("2d", { willReadFrequently: true }), FN = '700 100px "Pretendard Variable", Pretendard, sans-serif';
  x.fillStyle = "#000"; x.strokeStyle = "#000"; x.font = FN;
  var m = x.measureText(word), asc = m.actualBoundingBoxAscent || 72, wd = m.width, lw = MS * 0.45, k = (ch - lw) / asc, sx = 1;
  if (wd * k > cw * 0.94) { lw = MS * 0.1; k = (ch - lw) / asc; sx = (cw * 0.94) / (wd * k); }   /* 넓은 낱말(FESTIVAL)은 가로만 줄인다 */
  x.setTransform(k * sx, 0, 0, k, cw / 2, (ch + asc * k) / 2); x.textAlign = "center"; x.textBaseline = "alphabetic"; x.font = FN;
  x.fillText(word, 0, 0); x.lineJoin = "round"; x.lineWidth = lw / (k * sx); x.strokeText(word, 0, 0);
  var d = x.getImageData(0, 0, cw, ch).data, cov = new Float32Array(N * R), i, j, a, b;
  for (i = 0; i < gh; i++) for (j = 0; j < N; j++) {
    var s = 0; for (a = 0; a < MS; a++) for (b = 0; b < MS; b++) s += d[((i * MS + a) * cw + j * MS + b) * 4 + 3];
    cov[(i + r0) * N + j] = s / (255 * MS * MS);
  }
  return cov;
}
/* 「제목에서」 · 지금 보이는 행사명 두 줄을 같은 글꼴 · 크기로 1/4 축소 캔버스에 그려 점마다 둘레 28px 칸의 덮임 정도 */
function lfFxTitleCover(f, tr) {
  var k = 0.25, c = document.createElement("canvas"); c.width = Math.ceil(f.W * k); c.height = Math.ceil(f.H * k);
  var x = c.getContext("2d", { willReadFrequently: true }), cov = new Float32Array(f.N * f.R), hw = 14;
  x.fillStyle = "#000"; x.textBaseline = "alphabetic";
  tr.forEach(function (t) { x.font = t.fw + " " + (t.fz * k).toFixed(2) + "px " + t.ff; x.fillText(t.s, t.l * k, t.base * k); });
  var dd = x.getImageData(0, 0, c.width, c.height).data;
  f.dots.forEach(function (d) {
    var s = 0, cnt = 0, px, py;
    for (py = Math.floor((d.y - hw) * k); py < Math.ceil((d.y + hw) * k); py++) for (px = Math.floor((d.x - hw) * k); px < Math.ceil((d.x + hw) * k); px++) { if (px < 0 || py < 0 || px >= c.width || py >= c.height) continue; s += dd[(py * c.width + px) * 4 + 3]; cnt++; }
    cov[d.r * f.N + d.j] = cnt ? s / (255 * cnt) : 0;
  });
  return cov;
}
/* 한 낱말의 자료 · M = 글자 밝기 0..1(흐림 + 문턱 · 또렷함 SHARP) · B = 낱말 상자 안쪽 0..1(둘레 낮춤) · D = 윤곽(덮임 > thr 칸)까지 칸 거리(파문) */
function lfFxWord(cov, N, R, thr) {
  var E = LFFX.echo, sh = E.SHARP, sg = 1.5 - 1.15 * sh, n = N * R, bl = cov, i, j, q, mx = 0;
  if (sg >= 0.05) {
    var rad = Math.ceil(sg * 2.5), w = [], sum = 0, t = new Float32Array(n);
    for (q = -rad; q <= rad; q++) { var v = Math.exp(-q * q / (2 * sg * sg)); w.push(v); sum += v; }
    bl = new Float32Array(n);
    for (i = 0; i < R; i++) for (j = 0; j < N; j++) { var s = 0; for (q = -rad; q <= rad; q++) { var jj = j + q; if (jj >= 0 && jj < N) s += cov[i * N + jj] * w[q + rad]; } t[i * N + j] = s / sum; }
    for (i = 0; i < R; i++) for (j = 0; j < N; j++) { var s2 = 0; for (q = -rad; q <= rad; q++) { var ii = i + q; if (ii >= 0 && ii < R) s2 += t[ii * N + j] * w[q + rad]; } bl[i * N + j] = s2 / sum; }
  }
  for (i = 0; i < n; i++) if (bl[i] > mx) mx = bl[i];
  var lo = 0.12 + 0.25 * (1 - sh), M = new Float32Array(n), B = new Float32Array(n), D = new Float32Array(n), src = [], jmin = 1e9, jmax = -1, imin = 1e9, imax = -1;
  for (i = 0; i < n; i++) M[i] = mx > 0 ? lfFxSs(lo, 0.62, bl[i] / mx) : 0;
  for (i = 0; i < R; i++) for (j = 0; j < N; j++) if (cov[i * N + j] > thr) { src.push(j, i); if (j < jmin) jmin = j; if (j > jmax) jmax = j; if (i < imin) imin = i; if (i > imax) imax = i; }
  for (i = 0; i < R; i++) for (j = 0; j < N; j++) {
    var dx = Math.max(jmin - j, 0, j - jmax), dy = Math.max(imin - i, 0, i - imax), best = 1e9;
    B[i * N + j] = src.length ? lgxCl(1 - Math.sqrt(dx * dx + dy * dy) / 1.3) : 0;
    for (q = 0; q < src.length; q += 2) { var ex = j - src[q], ey = i - src[q + 1], dd = ex * ex + ey * ey; if (dd < best) best = dd; }
    D[i * N + j] = Math.sqrt(best);
  }
  return { M: M, B: B, D: D, n: src.length / 2 };
}
/* 위 섬 줄 수 → 낱말 3개(위 섬 가운데 · 높이 SIZE 줄까지) 또는 「제목에서」 · 열쇠(칸 수 · 섬 · 행사명 자리 · 글꼴)가 같으면 그대로 */
function lfFxWords(host) {
  var f = host._fx, E = LFFX.echo, N = f.N, R = f.R, ds = f.dots, rows = 0, i, j, tr = [];
  if (!N || ds.length !== N * R) { f.wd = null; f.wk = ""; return; }
  for (i = 0; i < R; i++) { for (j = 0; j < N; j++) if (ds[i * N + j].calm < 0.98) break; if (j < N) break; rows++; }
  var gh = Math.min(rows, E.SIZE), r0 = Math.floor((rows - gh) / 2), src = gh < E.MIN ? "title" : "top";
  if (src === "title") {   /* 행사명이 접혀 사라졌으면(압축 끝) 원점이 없다 · 커튼만 */
    var hd = host.querySelector(".lf-head"), sp = host.querySelectorAll(".lf-title span"), br = f.cv.getBoundingClientRect();
    if (hd && (hd.style.opacity === "" || parseFloat(hd.style.opacity) >= 0.5)) for (i = 0; i < sp.length; i++) {
      var cs = getComputedStyle(sp[i]), fz = parseFloat(cs.fontSize) || 40, rg = document.createRange(); rg.selectNodeContents(sp[i]); var b = rg.getBoundingClientRect();
      if (b.width > 0) tr.push({ s: sp[i].textContent, l: b.left - br.left, base: b.bottom - br.top - fz * 0.23, fz: fz, fw: cs.fontWeight, ff: cs.fontFamily });
    }
  }
  var key = [N, R, rows, src, LFFX.fontV].concat(tr.map(function (t) { return Math.round(t.l) + "," + Math.round(t.base) + "," + t.fz.toFixed(1); })).join("|");
  if (key === f.wk) return;
  f.wk = key; f.src = src; f.rows = rows;
  try {
    if (src === "top") f.wd = E.WORDS.map(function (s) { return lfFxWord(lfFxCover(s, N, R, r0, gh), N, R, 0.4); });
    else if (tr.length) { var w = lfFxWord(lfFxTitleCover(f, tr), N, R, 0.12); w.M.fill(0); w.B.fill(0); f.wd = [w, w, w]; }   /* 낱말 점등 없음 · 파문만 */
    else f.wd = null;
  } catch (e) { f.wd = null; }
}
/* 한 장면 · t(초) → 그림(같은 t = 같은 그림) · k = 0..1 전체 세기 · 켜진 점 수를 돌려준다 */
function lfFxDraw(f, t, k) {
  var x = f.x, W = f.W, H = f.H, n = f.dots.length, cs = [], i, j, a = 6.2832 * t * LFFX.SPD, E = LFFX.echo, N = f.N;   /* v5.32 커튼 흐름 3배(SPD · 사용자 261003) · 점 일렁임 sin(t × 1.7)은 제 속도 */
  x.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); x.clearRect(0, 0, W, H);
  f.lit = 0;
  if (k <= 0.004) return 0;
  for (j = 0; j < LFFX.cur.length; j++) {
    var cu = LFFX.cur[j], ra = (cu.rot + 9 * Math.sin(a / (cu.px * 0.7) + cu.ph)) * 0.017453;
    cs.push({ cx: W * (0.5 + 0.38 * Math.sin(a / cu.px + cu.ph)), cy: H * (0.38 + 0.22 * Math.sin(a / cu.py + cu.ph * 1.7)), co: Math.cos(ra), si: Math.sin(ra), rx: cu.rx * W * (1 + 0.14 * Math.sin(a / (cu.py * 0.6) + cu.ph)), ry: cu.ry * H, a: cu.a });
  }
  /* v5.32 글자 반향 · 앞 낱말과 지금 낱말(파문이 다음 주기까지 이어진다) · 낱말 점등 세기(env)와 파문 고리(반지름 rr · 두께 sg · 세기 am)는 점과 무관해 한 번만 */
  var ev = [], tt = t - E.T0, q, q0 = Math.floor(tt / E.PER);
  if (f.wd) for (q = q0 - 1; q <= q0; q++) {
    if (q < 0) continue;
    var u = tt - q * E.PER; if (u <= 0) continue;
    var rg = [];
    for (j = 0; j < E.RINGS; j++) { var uj = u - 0.3 - j * 0.5; if (uj <= 0) continue; var rr = 1.2 + E.SPEED * uj; rg.push({ rr: rr, sg: 0.8 + 0.04 * rr, am: E.AMP * Math.pow(0.62, j) * Math.exp(-rr / 24) * lfFxSs(0, 0.25, uj) }); }
    ev.push({ w: f.wd[q % 3], env: lfFxSs(0, 0.2, u) * (1 - lfFxSs(E.LIT, E.LIT + 0.8, u)), rg: rg });
  }
  var halo = lfFxHalo(), lit = 0;
  x.fillStyle = "#FFFFFF";
  for (i = 0; i < n; i++) {
    var d = f.dots[i]; if (d.calm <= 0) continue;
    var fv = 0;
    for (j = 0; j < cs.length; j++) {
      var s = cs[j], dx = d.x - s.cx, dy = d.y - s.cy, uu = (dx * s.co + dy * s.si) / s.rx, v = (-dx * s.si + dy * s.co) / s.ry, dd = Math.sqrt(uu * uu + v * v);
      if (dd < 1) { var pp = 1 - dd; fv += s.a * pp * Math.sqrt(pp) * (0.55 + 0.45 * pp); }   /* 커튼 가장자리 (1 - d)^1.6 의 가벼운 근사 */
    }
    var e = lfFxSs(d.th * 0.6, d.th * 0.6 + 0.62, Math.min(1, fv * 1.7 * E.CUR)) * (0.78 + 0.22 * Math.sin(t * 1.7 + d.x * 0.045 + d.ph));   /* 커튼 60% */
    if (ev.length) {
      var idx = d.r * N + d.j, eg = 0, er = 0, dimF = 1;
      for (q = 0; q < ev.length; q++) {
        var w = ev[q].w, env = ev[q].env, dist = w.D[idx], rgs = ev[q].rg;
        if (env > 0) { var gg = w.M[idx] * env * (0.2 + 1.4 * E.GAIN) * d.da; if (gg > eg) eg = gg; var dm = E.DIM * w.B[idx] * (1 - w.M[idx]) * env; if (dm > 1 - dimF) dimF = 1 - dm; }   /* 낱말 자리 켜짐 · 둘레 낮춤 */
        for (j = 0; j < rgs.length; j++) {
          var o = rgs[j], xx = (dist - o.rr) / o.sg, val = xx * xx < 9 ? o.am * Math.exp(-xx * xx) : 0;
          if (dist < o.rr) val += o.am * 0.1 * Math.exp(-(o.rr - dist) / 1.8);   /* 지나간 자리의 옅은 울림 */
          val *= d.da; if (val > er) er = val;
        }
      }
      e = Math.max(e * dimF, eg, er);
    }
    e *= d.calm * k; if (e > 1) e = 1;
    if (e < 0.05) continue;
    lit++;
    if (e > 0.3) { var hs = 7 + 16 * e; x.globalAlpha = Math.min(1, 0.42 * e); x.drawImage(halo, d.x - hs, d.y - hs, hs * 2, hs * 2); }   /* v5.32 블링크 조금 크게(사용자 261003) · 번짐 반지름 최대 18 → 23 */
    x.globalAlpha = Math.min(1, 0.3 + 0.9 * e); x.beginPath(); x.arc(d.x, d.y, 0.9 + 2.9 * e, 0, 6.2832); x.fill();   /* 점 반지름 최대 2.8 → 3.8(1.36배 · 지름 7.6 < 간격 28) */
  }
  x.globalAlpha = 1; f.lit = lit;
  return lit;
}
function lfFxClear(f) { f.x.setTransform(1, 0, 0, 1, 0, 0); f.x.clearRect(0, 0, f.cv.width, f.cv.height); f.lit = 0; }
function lfFxShow(host) { return !document.hidden && !host.hidden && !host.classList.contains("gone") && host.offsetWidth > 0; }
function lfFxNow(f) { return f.done ? LFFX.HOLD : f.acc + (f.run ? (performance.now() - f.t0) / 1000 : 0); }
function lfFxK(host, f) {
  var k = host._lf && host._lf.P > 0 ? 0.5 : 1;
  if (f.settle >= 0) { var p = (performance.now() - f.settle) / f.settleMs; k *= p >= 1 ? 0 : 1 - p * p * (3 - 2 * p); }
  return k;
}
function lfFxCalmTick(host, f, now) {   /* 배치가 바뀌면 곧바로 한 번 · 움직임(0.26초)이 끝난 뒤 한 번 더 */
  var ck = f.k + "|" + (host._lf ? host._lf.key : "");
  if (ck !== f.calmK) { f.calmK = ck; f.calmAt = now + 320; lfFxCalm(host); }
  else if (f.calmAt && now >= f.calmAt) { f.calmAt = 0; lfFxCalm(host); }
}
function lfFxFrame(host) {
  var f = host._fx; f.raf = 0;
  if (!f.run) return;
  if (!lfFxShow(host)) { lfFxStop(host); return; }
  f.raf = requestAnimationFrame(function () { lfFxFrame(host); });
  var now = performance.now();
  if (now - f.last < LFFX.STEP - 3) return;   /* 30프레임 고정 · 천천히 흐르는 빛이라 60과 차이가 없다 */
  f.last = now;
  if (!lfFxBuild(host)) return;
  lfFxCalmTick(host, f, now);
  var k = lfFxK(host, f), t = lfFxNow(f);
  if (f.settle >= 0 && k <= 0) { lfFxClear(f); lfFxStop(host); return; }   /* 입장 · 다 가라앉으면 멈춤 */
  if (f.settle < 0 && t >= LFFX.MAX) { lfFxStop(host); f.done = true; lfFxDraw(f, LFFX.HOLD, k); return; }   /* 90초 · 켜진 정지 화면(v5.32 90초 직전 주기의 「AX 가 옅어지며 파문이 나간」 순간) */
  lfFxDraw(f, t, k);
}
function lfFxStop(host) {
  var f = host && host._fx; if (!f) return;
  if (f.raf) cancelAnimationFrame(f.raf);
  f.raf = 0;
  if (f.run) { f.acc += (performance.now() - f.t0) / 1000; f.run = false; }
}
function lfFxLoop(host) { var f = host._fx; f.run = true; f.t0 = performance.now(); f.last = 0; f.raf = requestAnimationFrame(function () { lfFxFrame(host); }); }
/* 정지 한 장(동작 줄이기 · 90초 뒤) · 배치 움직임이 끝난 뒤 한 번 더 */
function lfFxStill(host) {
  var f = host._fx; if (f.run || f.settle >= 0 || !lfFxShow(host) || !lfFxBuild(host)) return;
  lfFxCalm(host); lfFxDraw(f, f.rm ? LFFX.STILL : LFFX.HOLD, lfFxK(host, f));
  clearTimeout(f.stillTo); f.stillTo = setTimeout(function () { if (!f.run && f.settle < 0 && lfFxShow(host) && lfFxBuild(host)) { lfFxCalm(host); lfFxDraw(f, f.rm ? LFFX.STILL : LFFX.HOLD, lfFxK(host, f)); } }, 320);
}
/* 시작 · 다시 보임 · 배치 바뀜(lfMount · soon) · 장면이 닫힘(lfFadeReset) */
function lfFxKick(host) {
  var f = host && host._fx; if (!f) return;
  if (!LGX.cur && f.settle >= 0) { f.settle = -1; lfFxClear(f); }   /* 장면이 닫히고 로그인 화면이 남으면 되살린다 */
  if (f.settle >= 0) return;
  f.calmK = "";
  if (f.run) return;
  if (!lfFxShow(host)) return;
  if (f.rm || f.done) { lfFxStill(host); return; }
  if (!lfFxBuild(host)) return;
  lfFxLoop(host);
}
/* 입장 · sec 동안 0 으로 가라앉힌 뒤 멈춘다 · 동작 줄이기 · 안 보이면 바로 지운다 */
function lfFxSettle(host, sec) {
  var f = host && host._fx; if (!f || f.settle >= 0) return;
  f.settle = performance.now(); f.settleMs = (sec || 0.55) * 1000;
  clearTimeout(f.stillTo);
  if (f.rm || !lfFxShow(host)) { lfFxStop(host); lfFxClear(f); return; }
  if (!f.run) lfFxLoop(host);
}
/* 붙이기 · 크기가 바뀌면(키보드 · 회전 · 글꼴) 한 프레임에 한 번 배경과 배치를 다시 · 여러 번 불러도 된다(kvMountAll) */
/* v5.10 점 이름 AX PASSPORT(흰 점 14px · 읽는 이름 「AX Passport」) · 로그인 두 화면의 행사명 위 · 움직이지 않는다 */
function lfName(host) {
  var p = host.querySelector(".lf-name");
  if (p && !p.firstChild) p.innerHTML = DotGlyph.svg(APP_NAME, { h: 14, label: APP_NAME });
}
function lfMount(host) {
  if (!host || host.hidden || host.classList.contains("gone")) return;
  lfName(host);
  lfFxMount(host);   /* v5.27 점등 층 */
  var s = host._lf;
  if (s && s.soon) { s.soon(); return; }
  s = host._lf = host._lf || {};
  s.soon = function () {
    if (s.raf) return;
    s.raf = requestAnimationFrame(function () { s.raf = 0; if (host.hidden || host.classList.contains("gone") || !host.offsetWidth) return; lfBg(host); lfLayout(host); lfFxKick(host); });
  };
  if (window.ResizeObserver) { try { new ResizeObserver(s.soon).observe(host); } catch (e) {} }
  window.addEventListener("resize", s.soon);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", s.soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(s.soon);
  lfBg(host); lfLayout(host); lfFxKick(host);
  requestAnimationFrame(function () { requestAnimationFrame(function () { host.classList.add("lf-sm"); }); });   /* 첫 배치는 움직이지 않는다 · 그다음부터 0.26초 */
  setTimeout(function () { try { lgxSym(); lgxSprites(); } catch (e) {} }, 400);   /* 원본 심볼 글자 나누기(점 1,037개 비교) · 점 그림을 로그인 화면에서 미리 · 입장 순간 끊김 방지 */
}
function lfMountAll() { lfMount(el("splash")); lfMount(el("quick")); }
function lfSoon() { ["splash", "quick"].forEach(function (id) { var h = el(id); if (h && h._lf && h._lf.soon) h._lf.soon(); }); }
/* 지금 보이는 로그인 화면(첫 화면 · 재방문) · 없으면 null */
function lfHost() {
  var ids = ["quick", "splash"];
  for (var i = 0; i < ids.length; i++) { var h = el(ids[i]); if (h && !h.hidden && !h.classList.contains("gone") && h.offsetWidth) return h; }
  return null;
}
/* 행사명이 균형 자리에 섰는가(키보드 내려감 · 압축 0 · 자리 바뀐 지 0.3초) · 입장 순간 이 자리의 글자를 점으로 */
function lfStill(host) { var s = host._lf; return !!s && !document.documentElement.classList.contains("kb-on") && s.P === 0 && performance.now() - (s.at || 0) > 300; }
/* 행사명 글자 → 점 · 같은 글꼴로 오프스크린에 그려 4px 간격으로 찍는다(화면 좌표 · 약 190개) · 행사명이 접혀 있으면 빈 목록(장면은 점 하나가 하늘을 여는 대체로) */
function lfTitleDots(host) {
  var pts = [], hd = host.querySelector(".lf-head"), ti = host.querySelector(".lf-title"), sp = host.querySelectorAll(".lf-title span"), G = 4, k;
  if (!hd || !ti || !sp.length || (parseFloat(hd.style.opacity) || 0) < 0.5) return pts;
  var b = ti.getBoundingClientRect(); if (b.width < 4 || b.height < 4) return pts;
  var x0 = Math.floor(b.left) - 4, y0 = Math.floor(b.top) - 4, c = document.createElement("canvas");
  c.width = Math.ceil(b.width) + 8; c.height = Math.ceil(b.height) + 8;
  var x = c.getContext("2d", { willReadFrequently: true });
  for (k = 0; k < sp.length; k++) {
    var r = sp[k].getBoundingClientRect(), cs = getComputedStyle(sp[k]), fz = parseFloat(cs.fontSize), tx = sp[k].textContent;
    x.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily; x.textBaseline = "alphabetic"; x.fillStyle = "#000";
    if ("letterSpacing" in x) x.letterSpacing = cs.letterSpacing;
    var m = x.measureText(tx), lh = parseFloat(cs.lineHeight) || r.height, asc = m.fontBoundingBoxAscent || fz * 0.9, des = m.fontBoundingBoxDescent || fz * 0.25;
    x.fillText(tx, r.left - x0, r.top - y0 + (lh - (asc + des)) / 2 + asc);
  }
  var d = x.getImageData(0, 0, c.width, c.height).data;
  for (var yy = 0; yy < c.height; yy += G) for (var xx = 0; xx < c.width; xx += G) if (d[(yy * c.width + xx) * 4 + 3] > 120) pts.push([x0 + xx + 0.5, y0 + yy + 0.5]);
  var ng = host.querySelector(".lf-name svg"), nb = ng && ng.getBoundingClientRect();   /* v5.10 점 이름은 이미 점이다 · 점 중심을 그대로 더한다(122개) */
  if (nb && nb.height > 4) { var L = DotGlyph.layout(APP_NAME), u = nb.height / L.h; L.dots.forEach(function (q) { pts.push([nb.left + (q[0] + DotGlyph.D / 2) * u, nb.top + (q[1] + DotGlyph.D / 2) * u]); }); }
  return pts;
}
/* 장면 시계로 로그인 글자 · 입력이 투명도만 사라진다(행사명 0.1초 · 점이 같은 자리에 겹쳐 있다 · 입력 0.2초) · 다 사라진 뒤에는 쓰지 않는다 */
function lfFade(host, t, cur) {
  var s = host._lf || {}, a = lgxCl((t + cur.pre) / 0.2), b = cur.intro === "suck" ? lgxCl((t + cur.pre) / 0.1) : a;
  var hide = t > 0.05 ? "hidden" : "";   /* 장면 무대가 화면을 다 덮은 뒤에는 로그인 화면을 그리지 않는다(뒤에서 겹쳐 그리던 무게 · 4배 감속 실측) */
  if (s.fa === a && s.fb === b && s.vis === hide) return;
  s.fa = a; s.fb = b; s.vis = hide; host.style.visibility = hide;
  var hd = host.querySelector(".lf-head"), fm = host.querySelector(".lf-form");
  if (hd) hd.style.opacity = ((1 - b) * (s.baseOp == null ? 1 : s.baseOp)).toFixed(3);
  if (fm) { fm.style.opacity = (1 - a).toFixed(3); fm.style.pointerEvents = "none"; }
}
function lfFadeReset(host) {
  var s = host._lf || {}, hd = host.querySelector(".lf-head"), fm = host.querySelector(".lf-form");
  s.fa = s.fb = s.vis = null; host.style.visibility = "";
  if (hd) hd.style.opacity = s.baseOp == null ? "" : s.baseOp.toFixed(3);
  if (fm) { fm.style.opacity = ""; fm.style.pointerEvents = ""; }
  lfFxKick(host);   /* v5.27 */
}
/* 오류 = 안내 한 줄 자리에 흰 알약 + 문제 칸 2px error 테두리 · 입력을 고치면 안내가 돌아온다(lfErrClear) */
function lfErr(box, errEl, msg, inputId) {
  if (!box || !errEl) return;
  errEl.textContent = msg; errEl.style.display = "block";
  box.classList.add("lf-errs");
  var bad = box.querySelectorAll(".lf-f.bad"), i, inp = inputId ? el(inputId) : null;
  for (i = 0; i < bad.length; i++) bad[i].classList.remove("bad");
  if (inp && inp.parentNode && inp.parentNode.classList) inp.parentNode.classList.add("bad");
  lfSoon();
}
function lfErrClear(box, errEl) {
  if (!box || !errEl || (!box.classList.contains("lf-errs") && errEl.style.display !== "block")) return;
  errEl.style.display = "none"; box.classList.remove("lf-errs");
  var bad = box.querySelectorAll(".lf-f.bad"); for (var i = 0; i < bad.length; i++) bad[i].classList.remove("bad");
  lfSoon();
}

/* ── 2막 · 3막 ──
   o = { host: 보이는 로그인 화면(#splash | #quick) · intro: "suck"(행사명이 점이 되어 빨려 듦) | "iris"(점 하나가 하늘을 연다 · 대체) · sheet: 시트 HTML · start · srv: "wait" | "ok" | "none" · mode: "A" | "B"
         ready(): 행사명이 균형 자리에 섰는가 · sample(): 행사명 글자 → 점 · onTick(t, cur) · onCover(): 장면이 닫힐 때 한 번(그 뒤에서 앱 화면으로 바꾼다) · onSettle() · onClose(how) · fixedT: 시안 캡처용 고정 시각 } */
function lgxPlay(o) {
  if (LGX.cur) return LGX.cur;
  o = o || {};
  var rm = lgxRM(), d = document.createElement("div");
  d.id = "lgx"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "최초 로그인");
  d.innerHTML = '<canvas aria-hidden="true"></canvas>' +
    '<button type="button" class="lgx-skip">건너뛰기</button>' +
    '<div class="lgx-lock" aria-hidden="true"><b>ME to WE :</b><span>나의 경험을 우리의 가능성으로</span></div>' +
    '<div class="lgx-sheet">' +
      '<div class="lgx-row"><span class="lgx-seal" aria-hidden="true"></span><div class="lgx-rt"><b>최초 로그인</b><span class="lgx-st">적립 확인 중</span></div></div>' +
      '<div class="lgx-next">' + (o.sheet || "") + "</div>" +
      (o.start ? '<button type="button" class="ax-button lgx-home lgx-go">' + (o.startLbl || "시작하기") + "</button>" : '<button type="button" class="ax-link lgx-home">홈으로</button>') +   /* v4.95 찍은 QR 이 없으면 주 버튼 「시작하기」 하나(= 홈) */
    "</div>" +
    '<p class="ax-sr-only lgx-live" aria-live="polite"></p>';
  document.body.appendChild(d);
  var intro = o.intro === "suck" && o.sample && !rm ? "suck" : "iris";   /* 동작 줄이기 = 앞 구간 없이 마지막 장면으로 */
  if (o.host) lfFxSettle(o.host, LGX.PRER.suck);   /* v5.27 로그인 배경 점등이 앞 구간(v5.83 실제 0.3초) 동안 가라앉아 장면 첫 면(정지 격자)과 이어진다 */
  var cv = d.querySelector("canvas"), cur = LGX.cur = { intro: intro, pre: LGX.PRE[intro], preR: LGX.PRER[intro], wait: intro === "suck", w0: performance.now(), suck: null, o: o, d: d, cv: cv, rm: rm, mode: o.mode || LGX.mode, srv: o.srv || "wait", t0: performance.now(), raf: 0, skip: 0, stamped: false, lq: false, dts: [], covered: false, sparks: null, closed: false };
  d.querySelector(".lgx-skip").addEventListener("click", function (e) { e.stopPropagation(); lgxSkip(); });
  /* v5.83 장면 아무 데나 탭 = 건너뛰기(시트 · 버튼 위 탭은 제외 · 이미 끝난 장면이면 아무 일 없음) */
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".lgx-sheet, button")) return; lgxSkip(); });
  d.querySelector(".lgx-home").addEventListener("click", function () { lgxClose("home"); });
  /* 다음 행동 카드의 버튼 · 장면을 먼저 닫고 그 버튼이 원래 하던 일(화면 이동)을 그대로 한다 */
  d.querySelector(".lgx-next").addEventListener("click", function (e) { if (e.target.closest && e.target.closest("button")) lgxClose("go"); }, true);
  lgxLayout(cur);
  if (rm) cur.skip = lgxReal(cur, LGX.T.end);
  cur.raf = requestAnimationFrame(function f(now) { if (cur.closed) return; lgxFrame(cur, now); cur.raf = requestAnimationFrame(f); });
  return cur;
}
function lgxLayout(cur) {
  var W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1), sy = lgxSym(), i;
  cur.cv.width = Math.floor(W * dpr); cur.cv.height = Math.floor(H * dpr);
  var fw = Math.min(W, 480), x0 = (W - fw) / 2, cxm = x0 + fw / 2;
  /* 거울 장면 배율 · 윗줄(M 왼쪽 ~ e 오른쪽 + 점 지름) 폭을 화면 폭에 · 키가 낮은 화면이면 두 줄 높이로 */
  var b0 = sy.box[0], b1 = sy.box[1], b4 = sy.box[4];
  var rowW = (b1.x1 - b0.x0) + 40, rowH = (b0.y1 - b0.y0) + (b4.y1 - b4.y0) + 110;
  var sm = Math.min((fw - 32) / rowW, H * 0.78 / rowH), yh = Math.round(H * 0.5), rowCx = (b0.x0 + b1.x1) / 2;
  /* 원본 심볼(점 반지름 포함 x 33~1033 · y 158~1372) 자리 두 벌 · 로고 머묾 = 화면 가운데 크게(H) · 시트가 올라오면 시트 위 칸으로 줄어든다(S)
     시트 위 칸이 너무 좁으면(큰글씨 + 낮은 폰) 시트가 올라올 때 부제를 감춘다(lockOff · 부제는 로고 머묾 동안 이미 보였다) */
  var sh = cur.d.querySelector(".lgx-sheet"), shH = sh ? sh.offsetHeight : 0, lk = cur.d.querySelector(".lgx-lock"), lkH = lk ? lk.offsetHeight : 60, top = 56;
  var sfH = Math.max(0.1, Math.min((fw - 72) / 1000, (H - top - 48 - lkH - 20) / 1214)), gTopH = top + Math.max(0, (H - 48 - top - (1214 * sfH + 20 + lkH)) / 2);
  var bot = H - shH - 12, avail = bot - top - lkH - 20, lockOff = avail / 1214 < 0.085;
  if (lockOff) avail = bot - top - 8;
  var sf = Math.max(0.08, Math.min((fw - 96) / 1000, avail / 1214)), grpH = 1214 * sf + (lockOff ? 0 : 20 + lkH), gTop = top + Math.max(0, (bot - top - grpH) / 2);
  sfH = sf; gTopH = gTop;   /* v6.85 (사용자 261009 「로고가 크게 그려졌다가 한 번 줄어드는 게 뚝딱 거리는 느낌」) 로고는 처음 안착부터 마지막 크기 · 자리(S) · 옛 머묾 H(화면 가운데 크게) → 시트가 올라올 때 0.45초 줄어듦은 없앴다(kS = 1 · 건너뛰기 · 동작 줄이기도 같은 크기) */
  var L = cur.L = { W: W, H: H, dpr: dpr, cx: cxm, x0: x0, fw: fw, sm: sm, yh: yh, air: H * 0.09, sf: sfH, dM: 38 * sm, dF: 38 * sfH,
    gTopH: gTopH, gTopS: gTop, kS: sf / sfH, lockTopH: gTopH + 1214 * sfH + 20, lockTopS: gTop + 1214 * sf + 20, lockOff: lockOff };
  sf = sfH; gTop = gTopH;
  /* to 가 끼어드는 틈 · 두 줄이 벌어지는 폭과 to 가 수평선 위에 머무는 자리(원본 to 가운데를 화면 가운데 · 수평선에) */
  var bt = sy.box[2], bo = sy.box[3];
  L.gap = (Math.max(bt.y1, bo.y1) - Math.min(bt.y0, bo.y0)) * sm * 0.72 / 2 + 6;
  L.toCx = (bt.x0 + bo.x1) / 2; L.toCy = (Math.min(bt.y0, bo.y0) + Math.max(bt.y1, bo.y1)) / 2; L.toS = sm * 0.72;
  L.toX0 = cxm + (bt.x0 - L.toCx) * L.toS - 20;   /* to 왼쪽 끝 · 오른쪽 밖에서 이만큼 미끄러져 들어온다 */
  L.meCy = yh - L.air - (b0.y1 - b0.y0 + 25) * sm / 2;   /* 공중에 모인 Me 의 가운데 높이 · 점(나)이 여기까지 솟아 흩어진다 */
  var gg = lfGrids(dpr); cur.g = { gw: gg.gw, go: gg.go };   /* 로그인 화면이 이미 그려 둔 화면 크기 격자를 그대로 쓴다(입장 순간 끊김 방지) */
  /* 점 하나(나)가 태어나는 자리 = 화면 가운데 수평선 바로 위 · 행사명이 여기로 빨려 들고 하늘이 여기서 열린다 */
  var D0 = Math.round(Math.max(28, Math.min(40, W * 0.09))); cur.D0 = D0; cur.idle = { line: yh, x: cxm, y: yh - D0 / 2 - 6, d: D0 };
  /* 원본 점마다: 원본 심볼 자리(f) · 반듯한 거울 자리(m) */
  var P = sy.P, n = P.length, pt = [];
  for (i = 0; i < n; i++) {
    var g = sy.g[i], o = sy.off[g], q = { g: g, f: [cxm + (P[i][0] - 533) * sf, gTop + (P[i][1] - 158) * sf], f0: [cxm + (sy.X[i] - 533) * sf, gTop + (P[i][1] - 158) * sf] };   /* f0 = 원본 자리이되 아직 편 기울기 */
    if (o) q.m = [cxm + (sy.X[i] + o[0] - rowCx) * sm, yh + (P[i][1] + o[1]) * sm];
    else q.gp = [cxm + (P[i][0] - L.toCx) * L.toS, yh + (P[i][1] - L.toCy) * L.toS];   /* to · 틈 안 자리(수평선 가운데) */
    pt.push(q);
  }
  /* 거울 장면의 두 줄 · A안 = 원본 M · e(위)와 원본 W · e(수면) · B안 = 대문자 덩어리 ME(위)와 위아래로 뒤집은 WE(수면) */
  var up = [], dn = [];
  if (cur.mode === "B") {
    var bl = lgxBlob(), bs = (b1.x1 - b0.x0) / bl.w;
    bl.pts.forEach(function (q2, k) {
      var mx = cxm + (b0.x0 + q2[0] * bs - rowCx) * sm, my = yh + (-25 - (bl.h - q2[1]) * bs) * sm;
      up.push({ m: [mx, my], mine: k === 0 });
      dn.push({ m: [mx, 2 * yh - my] });
    });
    /* 원본 점은 to 가 들어올 때 가장 가까운 덩어리 점에서 나온다 */
    for (i = 0; i < n; i++) { var q3 = pt[i]; if (!q3.m) continue; var tgt = q3.g < 2 ? up : dn, bi = 0, bd = 1e12;
      for (var k2 = 0; k2 < tgt.length; k2++) { var dx = tgt[k2].m[0] - q3.m[0], dy = tgt[k2].m[1] - q3.m[1], dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; bi = k2; } }
      q3.s = tgt[bi].m; }
  } else {
    for (i = 0; i < n; i++) { var q4 = pt[i]; if (!q4.m) continue; q4.s = q4.m;
      if (q4.g < 2) up.push({ m: q4.m, mine: i === sy.mine }); else dn.push({ m: q4.m }); }
  }
  /* 흩어지는 순서 · Me 가운데에서 가까운 점이 먼저(r = 0 ~ 1) */
  var mx0 = 0, my0 = 0, rM = 1;
  up.forEach(function (u) { mx0 += u.m[0]; my0 += u.m[1]; }); mx0 /= up.length || 1; my0 /= up.length || 1;
  up.forEach(function (u) { u.r = Math.hypot(u.m[0] - mx0, u.m[1] - my0); rM = Math.max(rM, u.r); });
  up.forEach(function (u) { u.r /= rM; });
  cur.pt = pt; cur.up = up; cur.dn = dn;
}
/* 점(나) · 태어난 자리에서 스프링으로 솟아 Me 가운데 높이로 · 흩어지기 전까지 조금 커진다 · [x, y, 지름, 면] */
function lgxSeed(cur, t) {
  var L = cur.L, id = cur.idle, u = (t - LGX.T.rise) / 0.6, e = lgxSpring(u, 0.55, 1.2);
  return [L.cx, id.y + (L.meCy - id.y) * e - Math.sin(lgxCl(u) * 3.1416) * 10, id.d * (1 + 0.12 * lgxCl(e)), 0];
}
function lgxSkip() { var cur = LGX.cur; if (!cur || cur.closed) return; var t = lgxNow(cur); if (t < LGX.T.end) cur.skip += lgxReal(cur, LGX.T.end) - lgxReal(cur, t); }
/* v5.83 실제 경과(r · 앞 구간 포함 · 초) → 장면 시각(t · 앞 구간은 음수) · 구간별 기울기 · 앞 구간 = pre / preR 배 · 0 ~ land = RATE 배 · land 뒤(슬로건 · 시트 · 도장) = 1배
   skip 은 실제 초로 더한다(건너뛴 뒤에도 슬로건 · 도장 박자는 1배 그대로) */
function lgxMap(cur, r) {
  var ps = cur.pre, pr = cur.preR || ps, a = LGX.T.land / LGX.RATE;
  if (r < pr) return -ps + r * ps / pr;
  r -= pr;
  return r < a ? r * LGX.RATE : LGX.T.land + (r - a);
}
function lgxReal(cur, t) {   /* lgxMap 의 거꾸로 */
  var ps = cur.pre, pr = cur.preR || ps;
  if (t < 0) return (t + ps) * pr / ps;
  return t < LGX.T.land ? pr + t / LGX.RATE : pr + LGX.T.land / LGX.RATE + (t - LGX.T.land);
}
function lgxNow(cur) { return cur.o.fixedT != null ? cur.o.fixedT : lgxMap(cur, (performance.now() - cur.t0) / 1000 + cur.skip); }   /* 앞 구간(pre)은 음수 시각 */
/* 서버 결과 · ok = 적립 확인 · fail = 못 보냄(다음 동기화에서 조용히) · none = 이 서버에는 최초 로그인 도장이 없다(줄을 감춘다) */
function lgxSrv(state) { var cur = LGX.cur; if (!cur || cur.srv === "ok") return; cur.srv = state; }
function lgxFadeOut(d) { try { d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }); } catch (e) {} setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 240); }
/* v5.05 (사용자 261002 「시작하기를 누르면 밋밋하게 넘어간다 · 기존 로그인한 사람 접속 때처럼 전환 장면」) 착지 전환
   장면의 마지막 그림(원본 심볼 · 점 위치 그대로)이 0.55초에 홈 광고판의 심볼 자리로 날아가며 흰 무대가 걷힌다 · 주황 광고판이면 도착 직전 흰 점으로(xitionRun 과 같다)
   광고판이 화면에 없으면 false(호출 쪽이 옛 페이드) · 홈은 onClose(lgxAfter)가 이미 그렸다 */
function lgxLand(cur) {
  var d = cur.d, L = cur.L, hb = document.querySelector("#view .bill canvas"), r = hb ? hb.getBoundingClientRect() : null;
  if (!r || !r.width || r.top >= innerHeight || r.bottom <= 0) return false;
  var P = cur.last.slice(); if (cur.lastMine) P.push(cur.lastMine);
  var sx0 = 1e9, sx1 = -1e9, sy0 = 1e9, sy1 = -1e9, tx0 = 1e9, tx1 = -1e9, ty0 = 1e9, ty1 = -1e9, i, q;
  for (i = 0; i < P.length; i++) { q = P[i]; sx0 = Math.min(sx0, q[0]); sx1 = Math.max(sx1, q[0]); sy0 = Math.min(sy0, q[1]); sy1 = Math.max(sy1, q[1]); }
  var K = AXF_DATA.me, bx = axfBox(r.width, r.height, 0.95);
  for (i = 0; i < K.A.count; i++) { q = axfSample(K.A, K.D, i, 0, 0); if (q[2] <= 0.02) continue; tx0 = Math.min(tx0, q[0]); tx1 = Math.max(tx1, q[0]); ty0 = Math.min(ty0, q[1]); ty1 = Math.max(ty1, q[1]); }
  if (!(sx1 > sx0) || !(tx1 > tx0)) return false;
  var k = (tx1 - tx0) * bx.s / (sx1 - sx0), scx = (sx0 + sx1) / 2, scy = (sy0 + sy1) / 2;
  var tcx = r.left + bx.x + (tx0 + tx1) / 2 * bx.s, tcy = r.top + bx.y + (ty0 + ty1) / 2 * bx.s;
  var cx = cur.cv.getContext("2d"), t0 = performance.now(), Po = [], Pw = [];
  d.classList.add("land");
  function ease(x) { x = lgxCl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function step(now) {
    var t = (now - t0) / 1000, v = ease((t - 0.12) / 0.55), ink = BILL_ORANGE ? lgxCl((v - 0.5) / 0.35) : 0, kk = 1 + (k - 1) * v, j, p, x, y, dd;
    var hbNow = document.querySelector("#view .bill canvas"); if (hbNow) hbNow.style.opacity = v < 0.9 ? "0" : "";
    cx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0); cx.clearRect(0, 0, L.W, L.H);
    cx.fillStyle = "rgba(255,255,255," + (1 - v).toFixed(3) + ")"; cx.fillRect(0, 0, L.W, L.H);
    Po.length = 0; Pw.length = 0;
    for (j = 0; j < P.length; j++) {
      p = P[j]; x = scx + (tcx - scx) * v + (p[0] - scx) * kk; y = scy + (tcy - scy) * v + (p[1] - scy) * kk; dd = p[2] * kk;
      Po.push([x, y, dd, 0, p[4]]); Pw.push([x, y, dd, 1, p[4]]);
    }
    if (ink < 1) lgxDots(cx, Po, 1 - ink, cur.lq);
    if (ink > 0) lgxDots(cx, Pw, ink, cur.lq);
    if (t < 0.12 + 0.55) requestAnimationFrame(step);
    else { if (hbNow) hbNow.style.opacity = ""; if (d.parentNode) d.parentNode.removeChild(d); }
  }
  requestAnimationFrame(step);
  return true;
}
function lgxClose(how) {
  var cur = LGX.cur; if (!cur || cur.closed) return;
  cur.closed = true; cancelAnimationFrame(cur.raf); LGX.cur = null;
  var d = cur.d;
  if (!cur.covered && cur.o.onCover) { cur.covered = true; cur.o.onCover(); }
  d.style.pointerEvents = "none";
  if (how === "home" && !cur.rm && cur.last && cur.last.length) {   /* v5.05 「시작하기」 · 심볼이 홈 광고판 자리로 내려앉는다(재방문 입장 전환 xitionRun 의 뒷부분과 같은 문법) */
    if (cur.o.onClose) cur.o.onClose(how, cur.stamped);
    requestAnimationFrame(function () { if (!lgxLand(cur)) lgxFadeOut(d); });
    return;
  }
  /* 홈을 그린 다음 프레임에 걷는다(같은 프레임에 겹치면 걷힘이 끊긴다) */
  requestAnimationFrame(function () { try { d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }); } catch (e) {} setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 240); });
  if (cur.o.onClose) cur.o.onClose(how, cur.stamped);
}
/* ── v5.02 · 전체 주황 → 점(나)에서 흰 하늘이 열린다(IRIS 0.65초 · 아래 반은 주황 수면 그대로라 색이 한 번에 바뀌지 않는다) ── */
function lgxSkyClip(cx, cur, t, W, line) {   /* 지금 열린 하늘 모양으로 클립(호출 쪽에서 save · restore) */
  var id = cur.idle, k = lgxCl(t / LGX.IRIS);
  cx.beginPath(); cx.rect(0, 0, W, Math.max(0, line)); cx.clip();
  if (k < 1) { var rM = Math.hypot(Math.max(id.x, W - id.x), id.y) + 40, r0 = cur.D0 / 2; cx.beginPath(); cx.arc(id.x, id.y, r0 + (rM - r0) * (1 - Math.pow(1 - k, 2.6)), 0, 6.2832); cx.clip(); }
}
function lgxStage(cx, cur, t, W, H, line) {
  var go = cur.g.go, gw = cur.g.gw, ky = go.height / H, ln = Math.max(0, Math.min(H, line));
  if (t >= LGX.IRIS) {   /* 하늘이 다 열린 뒤 · 흰 면(위)과 주황 면(아래)을 한 번씩만 칠한다(격자는 원본 캔버스에서 그 띠만 잘라 찍는다 · 겹쳐 칠하던 무게를 던다) */
    if (ln > 0) { cx.fillStyle = LGX_C.bgW; cx.fillRect(0, 0, W, ln); cx.drawImage(gw, 0, 0, gw.width, ln * ky, 0, 0, W, ln); }
    if (ln < H) { cx.fillStyle = LGX_C.bgO; cx.fillRect(0, ln, W, H - ln); cx.drawImage(go, 0, ln * ky, go.width, (H - ln) * ky, 0, ln, W, H - ln); }
    return;
  }
  cx.fillStyle = LGX_C.bgO; cx.fillRect(0, 0, W, H); cx.drawImage(go, 0, 0, W, H);   /* 전체 주황 + 주황 격자 = 로그인 화면과 같은 그림 */
  cx.save(); lgxSkyClip(cx, cur, t, W, line);
  cx.fillStyle = LGX_C.bgW; cx.fillRect(0, 0, W, ln); cx.drawImage(gw, 0, 0, W, H);
  cx.restore();
}
/* 앞 구간(t = -pre ~ 0) · 투명 캔버스에 점만(아래 로그인 화면이 그대로 비친다)
   suck = 행사명 점이 가속하며 안으로 돌아 들어가(약 100도 · 0.3초씩 · 점마다 0.2초 안에서 늦게) 가운데 한 점이 커진다 · iris = 점 하나가 톡 생긴다 */
function lgxPre(cur, cx, t) {
  var D0 = cur.D0, sx = cur.idle.x, sy = cur.idle.y, tt = t + cur.pre, S = cur.suck, i, seedD;
  if (cur.intro === "suck" && S && S.length) {
    var done = 0, dd = 2.8;
    cx.fillStyle = "#FFFFFF"; cx.beginPath();
    for (i = 0; i < S.length; i++) {
      var u = (tt - 0.03 - lgxH(i + 3) * 0.2) / 0.3, p = S[i];
      if (u >= 1) { done++; continue; }
      var x = p[0], y = p[1], r = dd;
      if (u > 0) {
        var e = Math.pow(u, 2.1), r0 = Math.hypot(p[0] - sx, p[1] - sy), a = Math.atan2(p[1] - sy, p[0] - sx) + 1.7 * e, rr = r0 * (1 - e);
        x = sx + Math.cos(a) * rr; y = sy + Math.sin(a) * rr; r = dd * (1 - 0.45 * e);
      }
      cx.moveTo(x + r / 2, y); cx.arc(x, y, r / 2, 0, 6.2832);
    }
    cx.fill();
    seedD = D0 * (t < -0.22 ? 0.3 * done / S.length : 0.3 + 0.7 * lgxSpring((t + 0.22) / 0.22, 0.55, 1.3));
  } else seedD = D0 * lgxSpring((t + cur.pre) / cur.pre, 0.55, 1.25);
  lgxDot(cx, sx, sy, seedD, LGX_C.w, 1);
}
/* 한 프레임 · 시간(t)만으로 모든 점의 자리가 정해진다(같은 t = 같은 그림 · 캡처 · 건너뛰기) */
function lgxFrame(cur, now) {
  var T = LGX.T, L = cur.L, sy = lgxSym(), cx = cur.cv.getContext("2d"), i, q, pn = performance.now();
  if (cur.wait) {   /* v5.02 행사명이 균형 자리(키보드 내려감 · 배치 움직임 끝)에 설 때까지 앞 구간 시계를 세운다(최대 0.45초) · 그 자리의 글자를 점으로 */
    if (pn - cur.w0 < 450 && !(cur.o.ready && cur.o.ready())) cur.t0 = pn;
    else {
      cur.wait = false; cur.t0 = pn;
      try { cur.suck = cur.o.sample(); } catch (e) { cur.suck = null; }
      if (!cur.suck || !cur.suck.length) { cur.intro = "iris"; cur.pre = LGX.PRE.iris; cur.preR = LGX.PRER.iris; }   /* 행사명이 접혀 있거나 못 읽으면 점 하나가 하늘을 연다 */
    }
  }
  var t = lgxNow(cur);
  if (cur.o.onTick) cur.o.onTick(t, cur);
  if (innerWidth !== L.W || innerHeight !== L.H) { lgxLayout(cur); L = cur.L; }
  var W = L.W, H = L.H;
  /* 프레임이 떨어지면(평균 26ms 넘음) 가운데 · 핵 층을 빼고 그린다 */
  /* 첫 0.6초(시작 한 번 무거운 프레임)는 빼고 · 12프레임 가운데값이 22ms 를 넘으면(45fps 아래가 이어지면) 줄인다 · 한 번 튄 프레임으로는 줄이지 않는다 */
  if (cur.lastNow && t > 0.6) { cur.dts.push(now - cur.lastNow); if (cur.dts.length > 12) cur.dts.shift(); if (cur.dts.length === 12 && !cur.lq) { var md = cur.dts.slice().sort(function (x, y) { return x - y; })[6]; if (md > 22) cur.lq = true; } }
  cur.lastNow = now;
  cx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0); cx.clearRect(0, 0, W, H);
  if (t < 0) { if (!cur.wait) lgxPre(cur, cx, t); return; }   /* v5.83 건너뛰기는 앞 구간에도 보인다(누른 순간부터) */
  /* 무대 · 전체 주황 위에 점(나)에서 흰 하늘이 열린다 · 수평선 = 화면 가운데 · to 가 들어오면 수면이 빠져 흰 무대만 남는다
     v4.90 뒤에서 앱 화면으로 바꾸는 일(홈 그리기)은 장면이 닫힐 때 한 번(lgxClose) · 장면 도중에는 무거운 일을 하지 않는다 */
  var line = L.yh;
  if (t >= T.to + 0.55) line = L.yh + (H + 8 - L.yh) * lgxEIO((t - T.to - 0.55) / 0.75);   /* to 가 틈에 들어선 뒤 수면이 천천히 빠진다 */
  cx.save();
  lgxStage(cx, cur, t, W, H, line);
  var Pd = [], Pb = [], mineP = t < T.burst ? lgxSeed(cur, t) : null;   /* 점 하나(나) · 흩어지기 전까지 */
  /* ── 거울 장면의 두 줄 · 윗줄 = 점(나)이 흩어져 공중에서 반듯한 Me 로 모임 → 낙하 → 수평선 · 수면 = 닿는 순간 한 줄씩 피어남 ── */
  var gyOff = -L.air, sq = 1, sxq = 1, amp = 0, isA = cur.mode !== "B";
  if (t >= T.drop) {   /* 살짝 움츠렸다(예비 동작) 떨어지며 세로로 늘어난다(스트레치) */
    var an = lgxCl((t - T.drop) / 0.14), fall = lgxEI((t - T.drop - 0.1) / (T.hit - T.drop - 0.1));
    gyOff = -L.air - Math.sin(an * 3.1416) * 10 * (fall > 0 ? 0 : 1) + L.air * fall; sq = 1 + 0.07 * fall; sxq = 1 - 0.035 * fall;
  }
  if (t >= T.hit) {   /* 착지 · 납작해졌다(스쿼시) 감쇠 진동으로 돌아온다 · 부피는 지킨다(가로로 퍼짐) */
    gyOff = 0; var hk = t - T.hit;
    sq = hk < 1.2 ? 1 - 0.17 * Math.exp(-4.5 * hk) * Math.cos(11 * hk) : 1; sxq = 1 + (1 - sq) * 0.55;
    amp = 5 * Math.max(0, 1 - hk / 1.6);
  }
  var layerOn = t >= T.burst && (isA ? t < T.to : t < T.to + 0.25), layerA = isA ? 1 : 1 - lgxCl((t - T.to) / 0.25);
  if (layerOn) {
    var out = isA ? Pd : Pb;
    for (i = 0; i < cur.up.length; i++) {
      q = cur.up[i];
      var x = L.cx + (q.m[0] - L.cx) * sxq, y = L.yh - (L.yh - q.m[1]) * sq + gyOff, dd = L.dM, dep = T.burst + (q.mine ? 0.34 : 0.3 * q.r + 0.06 * lgxH(i)), k2 = (t - dep) / 0.7;   /* Me 가운데에서 가까운 점부터(나는 맨 나중) · 점마다 조금씩 늦게(오버랩) */
      if (k2 < 1) {
        if (k2 <= 0) { if (q.mine) mineP = lgxSeed(cur, t); continue; }   /* 아직 점(나) 안에 있다 */
        var s0 = lgxSeed(cur, dep), ek2 = lgxSpring(k2, 0.55, 1.35), ec = Math.min(1, ek2), iu = 1 - ec, tx0 = x, ty0 = y, ddx = tx0 - s0[0], ddy = ty0 - s0[1];
        var c1x = s0[0] + (ddx * 0.62 + ddy * 0.78) * 0.55, c1y = s0[1] + (ddy * 0.62 - ddx * 0.78) * 0.55;   /* 빨려 든 소용돌이와 같은 방향으로 돌며 나간다(곡선 조절점 = 방향을 0.9 라디안 돌린 자리) */
        x = iu * iu * s0[0] + 2 * iu * ec * c1x + ec * ec * tx0; y = iu * iu * s0[1] + 2 * iu * ec * c1y + ec * ec * ty0;
        if (ek2 > 1) { x += (tx0 - c1x) * (ek2 - 1) * 0.5; y += (ty0 - c1y) * (ek2 - 1) * 0.5; }   /* 넘쳤다 돌아오기 · 곡선 끝 방향으로만 */
        dd = (q.mine ? s0[2] : L.dM * 0.35) * (1 - ec) + dd * ec;
      }
      var qq = [x, y, dd, y > line ? 1 : 0];
      if (q.mine && isA) mineP = qq; else out.push(qq);
    }
    if (t >= T.hit) for (i = 0; i < cur.dn.length; i++) {
      q = cur.dn[i];
      var kr = (t - T.hit - ((q.m[1] - L.yh) / (24 * L.sm)) * 0.04) / 0.45;   /* 수면 쪽으로 한 줄씩 · 톡 튀어나와 출렁 */
      if (kr <= 0) continue;
      out.push([L.cx + (q.m[0] - L.cx) * (2 - sxq) + amp * Math.sin(q.m[1] * 0.06 + t * 9), q.m[1], L.dM * lgxSpring(kr, 0.38, 1.6), q.m[1] > line ? 1 : 0]);
    }
  }
  /* ── to 가 끼어든다 · 두 줄이 밀리며 원본 심볼 자리로(크기도 원본 배율로) · 수면이 빠지면 흰 점이 주황으로 ── */
  if (t >= T.to) {
    var wave = t >= T.land ? ((t - T.land) * 0.5) % 1 : -1, eS = lgxEIO((t - T.end) / 0.45), kS = 1 + (L.kS - 1) * eS, tyS = L.gTopH + (L.gTopS - L.gTopH) * eS;
    /* 안착 뒤 두세 번 작게 출렁이고 멈춘다(로고 전체 배율 · 가운데 기준) */
    var wb = t >= T.land - 0.15 ? 1 + 0.03 * Math.exp(-4 * (t - T.land + 0.15)) * Math.sin(14 * (t - T.land + 0.15)) : 1, wcy = L.gTopH + 607 * L.sf;
    for (i = 0; i < cur.pt.length; i++) {
      q = cur.pt[i];
      var x2, y2, d2;
      var ek = lgxSpring((t - T.to - LGX_LD[q.g] - 0.05 * lgxH(i + 7)) / 0.95, 0.62, 1.3), sp = lgxSpring((t - T.to) / 0.5, 0.5, 1.3) * (1 - lgxCl(ek));   /* 점마다 조금씩 늦게 · 스프링 */
      if (q.s) {   /* 벌어짐(윗줄은 위로 · 수면 줄은 아래로) → 원본 자리 */
        if (!isA && t < T.to + 0.04) continue;
        var bx2 = q.s[0], by2 = q.s[1] + (q.g < 2 ? -1 : 1) * L.gap * sp, es = lgxSpring((t - T.to - LGX_LD[q.g] - 0.16) / 0.8, 0.5, 1.3);   /* 기울기는 자리보다 살짝 늦게 따라온다 */
        x2 = bx2 + (q.f0[0] - q.s[0]) * ek + (q.f[0] - q.f0[0]) * es; y2 = by2 + (q.f[1] - q.s[1]) * ek; d2 = L.dM + (L.dF - L.dM) * Math.min(1, lgxCl(ek));
      } else {   /* to · 벌어진 틈으로 오른쪽 밖에서 수평선을 따라 들어온다 → 원본 자리 */
        var ke = lgxSpring((t - T.to - 0.12 - 0.06 * (q.g - 2)) / 0.6, 0.6, 1.2);
        if (ke <= 0) continue;
        var gx2 = q.gp[0], gy2 = q.gp[1], slide = (W + 60 - L.toX0) * (1 - ke);
        x2 = gx2 + slide + (q.f[0] - gx2) * ek; y2 = gy2 + (q.f[1] - gy2) * ek; d2 = L.dM * 0.72 + (L.dF - L.dM * 0.72) * lgxCl(ek);
      }
      if (wb !== 1) { x2 = L.cx + (x2 - L.cx) * wb; y2 = wcy + (y2 - wcy) * wb; d2 *= wb; }
      if (eS > 0) { x2 = L.cx + (x2 - L.cx) * kS; y2 = tyS + (y2 - L.gTopH) * kS; d2 *= kS; }   /* 시트가 올라오면 시트 위 칸으로 */
      var off5 = wave >= 0 && !cur.lq && (((sy.rank[i] - wave) % 1 + 1) % 1) < 0.06;   /* 원본처럼 보라 핵이 물결로 꺼졌다 켜진다 */
      var q5 = [x2, y2, d2, y2 > line ? 1 : 0, off5];
      if (i === sy.mine) mineP = q5; else Pd.push(q5);
    }
  }
  /* ── 반사 · 점(나)과 흩어져 나오는 점은 수면에 옅게 비친다(Me 가 모이기 전에 사라진다) ── */
  if (t < T.burst + 0.5) {
    var ra = 0.5 * (1 - lgxCl((t - T.burst - 0.2) / 0.3)) * lgxCl(t / 0.25), RR = [];
    for (i = 0; i < Pd.length; i++) if (Pd[i][1] < line) RR.push([Pd[i][0], 2 * line - Pd[i][1], Pd[i][2], 1]);
    if (mineP) RR.push([mineP[0], 2 * line - mineP[1], mineP[2], 1]);
    cx.save(); cx.beginPath(); cx.rect(0, line, W, H); cx.clip(); lgxDots(cx, RR, ra, true); cx.restore();
  }
  /* ── 닿는 순간 · 물결 · 섬광 · 튀는 점 ── */
  if (t >= T.hit && t < T.hit + 2.2) {
    var hu = t - T.hit, gwid = (sy.box[1].x1 - sy.box[0].x0) * L.sm;
    cx.save(); cx.beginPath(); cx.rect(0, line, W, H); cx.clip();
    for (var r3 = 0; r3 < 4; r3++) {   /* 물결 4겹 · 1.6초에 걸쳐 화면 폭 너머까지 */
      var ru = lgxCl((hu - r3 * 0.22) / 1.6); if (ru <= 0 || ru >= 1) continue;
      var rx2 = gwid * 0.45 + lgxEO(ru) * L.fw * 0.75;
      cx.globalAlpha = 0.6 * (1 - ru); cx.strokeStyle = "#FFFFFF"; cx.lineWidth = 2;
      cx.beginPath(); cx.ellipse(L.cx, line, rx2, rx2 * 0.12, 0, 0, 3.1416); cx.stroke();
    }
    cx.globalAlpha = Math.max(0, 1 - hu / 0.28); cx.fillStyle = "#FFFFFF"; cx.fillRect(L.x0, line, L.fw, 4);
    cx.restore(); cx.globalAlpha = 1;
    if (!cur.sparks) { cur.sparks = []; for (var z0 = 0; z0 < (cur.lq ? 14 : 34); z0++) { var hx = lgxH(z0 * 3.7); cur.sparks.push([L.cx - gwid / 2 + hx * gwid, (lgxH(z0) - 0.5) * 260 + (hx - 0.5) * 120, -(140 + lgxH(z0 + 9) * 320) * (z0 % 3 === 0 ? -0.6 : 1), 2 + lgxH(z0 + 4) * 4]); } }
    if (hu < 1.0) {
      var Sp = [];
      for (var z = 0; z < cur.sparks.length; z++) { var s1 = cur.sparks[z], yy = line + s1[2] * hu * 0.85 + 520 * hu * hu; Sp.push([s1[0] + s1[1] * hu * 0.85, yy, s1[3] * (1 - hu) * 2.2, yy > line ? 1 : 0]); }
      lgxDots(cx, Sp, 1, true);
    }
  }
  if (Pb.length) lgxDots(cx, Pb, layerA, cur.lq);   /* B안 덩어리 글자 · to 가 들어오면 옅어지며 원본 점에 자리를 내준다 */
  lgxDots(cx, Pd, 1, cur.lq);
  cur.last = Pd; cur.lastMine = mineP;   /* v5.05 착지 전환(lgxLand)의 출발 그림 */
  cx.restore();
  /* ── 3막 · 부제 · 시트 · 나의 점이 도장 칸으로 ── */
  var d = cur.d, lock = d.querySelector(".lgx-lock");
  var eL = lgxEIO((t - T.end) / 0.45);
  lock.style.top = Math.round(L.lockTopH + (L.lockTopS - L.lockTopH) * eL) + "px";
  lock.style.opacity = (lgxCl((t - (T.land - 0.1)) / 0.45) * (L.lockOff ? 1 - eL : 1)).toFixed(3);
  if (t >= T.end && !cur.shown) { cur.shown = true; d.classList.add("on"); }
  d.querySelector(".lgx-skip").style.display = t >= T.end ? "none" : "";
  var seal = d.querySelector(".lgx-seal");
  if (cur.srv === "none" && !cur.rowHid) { cur.rowHid = true; d.querySelector(".lgx-row").style.display = "none"; }
  if (cur.srv === "none" && t >= T.end) lgxSettle(cur);
  if (mineP) {   /* v5.07 나의 점은 심볼 자리에 그대로(도장 칸으로 날아가던 분신은 걷었다 · 도장은 전체 화면 팝) */
    if (t < LGX.IRIS + 0.05) {   /* v5.02 점(나)은 하늘이 열린 자리에서는 주황, 아직 주황 바탕인 자리에서는 흰색(같은 점을 두 번 그리고 하늘 모양으로 가른다) */
      lgxDot(cx, mineP[0], mineP[1], mineP[2], LGX_C.w, 1);
      cx.save(); lgxSkyClip(cx, cur, t, W, L.yh); lgxDot(cx, mineP[0], mineP[1], mineP[2], LGX_C.o, 1); cx.restore();
    } else lgxDot(cx, mineP[0], mineP[1], mineP[2], mineP[3] ? LGX_C.w : LGX_C.o, 1);
  }
  /* v5.07 도장 = 다른 스탬프와 같은 전체 화면 팝(lgxPop) · 동작 줄이기도 같은 팝의 정지판(가운데 0.8초) · 서버를 기다리면 시트에 「적립 확인 중」 그대로 4초 · 실패면 「연결되면 자동 적립」 */
  if (t >= T.pop && cur.srv !== "none" && !cur.popped && !cur.gaveUp) {
    if (cur.srv === "ok") lgxPop(cur, t);
    else {
      if (!cur.waitAt) cur.waitAt = t;
      if (cur.srv === "fail" || t - cur.waitAt > 4) lgxGiveUp(cur);
    }
  }
  if (cur.popped && !cur.stamped && t - cur.popAt > 6) lgxStamp(cur);   /* 팝이 안착을 알리지 못했으면(만일) 칸에 찍고 다음 단계로 */
}
/* v5.07 전체 화면 도장 팝 · 제자리 = 시트의 도장 칸 · 흔들림 = 장면 · 안착하면 칸에 도장(lgxStamp) */
function lgxPop(cur, t) {
  if (cur.popped) return;
  cur.popped = true; cur.popAt = t;
  var seal = cur.d.querySelector(".lgx-seal");
  if (!stampOverlay("lg", { to: function () { return { el: seal, kind: "lgx" }; }, shake: cur.d, done: function (sp) { lgxStamp(cur, sp); } })) lgxStamp(cur);
}
function lgxStamp(cur, sp) {   /* sp = 안착한 팝(다음 보상 한 줄을 그대로 받는다) · 잉크 · 진동은 팝이 이미 냈다 */
  if (cur.stamped) return;
  cur.stamped = true;
  var d = cur.d, seal = d.querySelector(".lgx-seal"), n = Math.min(STAMP_DENOM, stampCount());
  if (typeof stampMarkHtml === "function") seal.innerHTML = stampMarkHtml(false, seal.offsetWidth || 56);
  seal.classList.add("on");
  d.querySelector(".lgx-st").textContent = "스탬프 " + n + " / " + STAMP_DENOM + (sp && sp.hint ? " · " + sp.hint : "");
  d.querySelector(".lgx-live").textContent = "최초 로그인 스탬프 적립 · 스탬프 " + n + "개";
  lgxSettle(cur);
}
function lgxGiveUp(cur) {
  if (cur.gaveUp || cur.stamped) return;
  cur.gaveUp = true;
  cur.d.querySelector(".lgx-st").textContent = "연결되면 자동 적립";
  lgxSettle(cur);
}
/* 도장이 찍혔거나 · 내려놓았거나 · 도장이 없는 서버 → 다음 행동 차례(찍은 QR 이 있으면 저절로 이어 간다) */
function lgxSettle(cur) { if (cur.settled) return; cur.settled = true; setTimeout(function () { lgxWave(cur); }, 350); if (cur.o.onSettle) cur.o.onSettle(); }
/* v5.05 부제 물결 한 번 · 장면이 다 선 뒤(도장 · 내려놓음) · 부제가 감춰진 낮은 화면(lockOff) · 동작 줄이기 · 닫힌 장면은 건너뛴다 */
function lgxWave(cur) {
  if (cur.closed || cur.rm || (cur.L && cur.L.lockOff)) return;
  var lock = cur.d.querySelector(".lgx-lock"), sp = lock && lock.querySelector("span"); if (!sp) return;
  if (!sp.querySelector("i")) { var n = 0; sp.innerHTML = sp.textContent.split(" ").map(function (w) { return '<span class="lw">' + w.split("").map(function (c) { return '<i style="--i:' + (n++) + '">' + esc(c) + "</i>"; }).join("") + "</span>"; }).join(" "); }
  lock.classList.remove("wave"); void lock.offsetWidth; lock.classList.add("wave");
}
/* ── v4.87 앱 연결 · 장면을 틀지 정하고, 서버에 최초 로그인 적립을 보내고, 시트 내용과 닫힌 뒤를 맡는다 ──
   틀 조건(계정당 1회): 새 체계(stv 2) · 이 기기 기록(lgx_seen)에 그 사번이 없다 · 이 기기 스탬프에 lg 가 없다
     새 계정(로그인 응답 isNew 이고 pwset 아님) = 바로 튼다(그 사이 stamp:lg 를 보낸다)
     있던 계정 = stamp:lg 를 먼저 보내고 1.2초 기다린다 · added true = 튼다 · 이미 받음 = 보통 입장 · 늦으면 보통 입장(나중에 붙으면 예전 도장 팝)
     테스트 사번 = 서버에 보내지 않고 이 기기에만(지금 규칙 그대로)
   서버는 고치지 않는다(v4.83 lgPush_ · 응답 { ok, added }). 옛 서버(added 없음 · ok 아님) = 도장 줄을 감춘다. 보내지 못하면 stamp_pend 에 남아 다음 동기화 때 다시 간다. */
var LGX_ON = true;
function lgxSeen(emp) { return (S.get("lgx_seen", []) || []).indexOf(String(emp)) >= 0; }
function lgxMark(emp) { var a = S.get("lgx_seen", []) || []; if (a.indexOf(String(emp)) < 0) { a.push(String(emp)); S.put("lgx_seen", a); } }
function lgxHasLg() { return S.get("stamps", []).indexOf("lg") >= 0 || !!stampPend().lg; }
/* 이 기기에 lg 를 조용히 넣는다(도장 팝 없이 · 본 것으로) */
function lgxLocal() {
  var st = S.get("stamps", []);
  var seen = S.get("pp_seen", null);
  if (seen === null) { seen = st.slice(); S.put("pp_base", 1); }   /* v5.07 첫 동기화가 서버 목록을 본 것으로 합친다(ppSeenGet) */
  if (seen.indexOf("lg") < 0) seen.push("lg");
  S.put("pp_seen", seen);
  if (st.indexOf("lg") < 0) { st.push("lg"); S.set("stamps", st); }
  checkRewards();
}
/* stamp:lg 보내기 · cb("added" | "dup" | "none" | "fail") */
function lgxPush(cb) {
  var emp = String((S.get("user", {}) || {}).empId || "");
  var p = stampPend(); p.lg = { t: Date.now(), ok: 0, try: Date.now(), emp: emp }; S.set("stamp_pend", p);
  beCall({ action: "push", emp: emp, kind: "stamp:lg", val: "최초 로그인", once: 1 }, function (res) {
    var p2 = stampPend();
    if (res && res.ok && typeof res.added === "boolean") { if (p2.lg) { p2.lg.ok = Date.now(); S.set("stamp_pend", p2); } cb(res.added ? "added" : "dup"); return; }
    delete p2.lg; S.set("stamp_pend", p2);   /* 옛 서버 · 계정 없음 · 거절 = 다시 보내지 않는다 */
    cb("none");
  }, function () { cb("fail"); });   /* 대기 목록에 남는다 · sync 때 stampPendRetry 가 다시 보낸다 */
}
/* 찍은 QR(로그인 전에 들어온 #s= · #q=)이 있으면 그것을 이어 간다
   v4.95 (사용자 261002 「최초 로그인 아래 다음 스탬프가 AX 퀴즈일 필요는 없다 · 도장 뒤 메인으로」) 찍은 QR 이 없으면 카드 없음 · 홈의 「다음 스탬프」 카드에서 이어진다 */
function lgxSheetHtml() {
  var p = scanLinkPeek();
  if (!p) return { html: "", scan: false };
  var raw = String(p.raw || ""), code = (raw.match(/#s=([A-Za-z0-9]+)/i) || [])[1] || "", t, lbl = "이어서 적립";
  if (/#q=idea\b/i.test(raw)) { t = "아이디어 한 줄"; lbl = "아이디어 쓰기"; }
  else if (/#q=type\b/i.test(raw)) { t = "1F 타자왕"; lbl = "노트북에 연결"; }   /* v5.61 노트북 접속 QR */
  else if (/#q=/i.test(raw)) { t = "퀴즈"; lbl = "이어서 하기"; }
  else if (/^AXW/i.test(code) || /[#&?]fl=\d/i.test(raw)) t = "계단 이용";
  else if (/^AXA/i.test(code)) t = "강연 출석";
  else if (/^AXD/i.test(code)) { t = "추첨 체크인"; lbl = "이어서 체크인"; }
  else t = "현장 스탬프";
  return { scan: true, html: '<section class="ax-card axs-nx"><p class="axs-nx-c"><span class="axs-chip">찍은 QR</span></p>' +
    '<div class="axs-nx-t"><div class="ax-stack-tight"><h2 class="ax-section-title">' + t + "</h2></div></div>" +
    '<button type="button" class="ax-button lgx-auto">' + lbl + "</button></section>" };
}
/* v5.83 (사용자 261006 「최초 진입 가볍게」 「나」 · 옛 v4.89 사용자 261001 결정 번복) 접속 방법 질문 삭제 = 오프닝 시트 단계 · 홈 하루 1회 카드 · 질문 뒤 토스트 · 기기 키 entry_pref · entry_ask_day 를 더는 쓰지 않는다(남은 값은 무해)
   바로가기 설치는 설정 › 바로가기 설치 · 알림은 그 순간(커피챗 · 혼잡 · DAP 신청 · 홈 화면 앱 첫 열림)에만 묻는다 · 되살리기 = hi_ax git v5.82 */
/* 찍은 QR 카드 · 1.6초 뒤 저절로 이어 간다(버튼에 진행 막대) */
function lgxScanGo(cur) {
  var b = cur.d.querySelector(".lgx-auto"); if (b) b.classList.add("run");
  setTimeout(function () { if (LGX.cur === cur) lgxClose("scan"); }, 1600);
}
/* 장면 시작 · cover() = 화면을 다 덮은 순간 그 뒤에서 앱으로 바꾼다 · mode = send | ok | test */
function lgxStart(emp, mode, cover, demo) {
  lgxMark(emp);
  var sh = lgxSheetHtml(), host = lfHost();   /* v5.02 보이는 로그인 화면(첫 화면 #splash | 재방문 #quick) · 그 행사명이 점이 되어 빨려 든다 */
  var cur = lgxPlay({ host: host, intro: host ? "suck" : "iris", sheet: sh.html, start: !sh.scan,
    ready: host ? function () { return lfStill(host); } : null,
    sample: host ? function () { return lfTitleDots(host); } : null,
    onTick: host ? function (t, c) { lfFade(host, t, c); } : null,
    onCover: cover,
    onSettle: function () { if (sh.scan) lgxScanGo(cur); },   /* v5.83 질문 없음 · 찍은 QR 이 있으면 그 카드로 이어 간다 · 없으면 「시작하기」 하나(자동 홈 이동 없음) */
    onClose: function (how) { if (host) lfFadeReset(host); lgxAfter(how); } });
  if (demo) return cur;
  if (mode === "test" || mode === "ok") { lgxLocal(); lgxSrv("ok"); }
  else lgxPush(function (r) { if (r === "added" || r === "dup") { lgxLocal(); lgxSrv("ok"); } else lgxSrv(r === "none" ? "none" : "fail"); });
  return cur;
}
/* v5.83 설정 › 오프닝 다시 보기 · 같은 장면을 시연으로 한 번(로그인 화면 없음 = 점 하나가 하늘을 연다 · 도장 줄 없음 · 서버 · 스탬프 · 기록 변경 없음) · 닫기 = 장면만 걷는다 */
function lgxReplay() {
  if (LGX.cur || el("lgx")) return;
  lgxPlay({ host: null, intro: "iris", sheet: "", start: true, startLbl: "닫기", srv: "none", onClose: function () { BILL.t0 = performance.now(); } });
}
/* 장면이 닫힌 뒤 · 광고판 위상 기준 · 미뤄 둔 찍은 QR · 알림 이동 · 홈 화면 추가 안내 · 기다리던 팝 */
function lgxAfter(how) {
  BILL.t0 = performance.now();   /* 광고판은 장면의 마지막 그림(원본 심볼 · me 구간)에서 이어 시작 */
  if (how === "home" && App.current !== "home") App.go("home"); else if (App.current === "home" && how !== "go") App.render();
  setTimeout(scanLinkRun, 120);
  setTimeout(pushGoRun, 200);
  a2hsAuto();
  setTimeout(function () { if (SPOP.q.length && !SPOP.cur) spNext(); noticePump(); }, 300);
  if (typeof nbStart === "function") nbStart();   /* 261007 오프닝이 닫힌 순간부터 10초 창(자동 안내 1개 · 분석 P3) */
}
/* 로그인 성공 뒤 하나의 입구 · normal() = 예전 입장(1초 전환 + 뒤처리) · cover() = 장면용 입장(뒤처리는 장면이 닫힌 뒤) */
function lgxEnter(res, normal, cover) {
  if (typeof nbStart === "function") nbStart();   /* 261007 로그인 성공 = 10초 창 시작(자동 안내 1개 · 분석 P3) */
  var emp = String((S.get("user", {}) || {}).empId || "");
  if (!LGX_ON || !emp || !BE.on || !stampV2() || lgxSeen(emp) || lgxHasLg()) { normal(); return; }
  /* 261007 (사용자 「로그인 기록이 있는 사람이 재차 로그인하면 건너뛰기가 보이는 게 아니라 바로 메인으로」) 서버가 아는 기존 계정(로그인 응답 isNew false · 초기화 뒤 새 PIN pwset)
     = 전에 로그인한 사번 · 다른 기기 · 다른 브라우저 · 로그아웃 뒤 · 앱 업데이트 뒤 모두 오프닝 · 도장 팝 없이 바로 홈 · 첫 로그인 스탬프(lg)는 조용히 맞춘다(서버에 없으면 보내고 이 기기에 팝 없이)
     오프닝은 그 사번의 진짜 첫 로그인(새 계정 isNew · pwset 아님)에서만 · 테스트 사번도 같다(계정이 있으니 바로 홈 · 다시 보려면 설정 「오프닝 다시 보기」) */
  if (res && (res.isNew === false || res.pwset)) {
    lgxMark(emp);
    if (testEmp()) lgxLocal(); else lgxPush(function (r) { if (r === "added" || r === "dup") lgxLocal(); });
    normal(); return;
  }
  if (testEmp()) { lgxStart(emp, "test", cover); return; }
  if (res && res.isNew && !res.pwset) { lgxStart(emp, "send", cover); return; }
  var done = false;   /* v4.95 로그인 두 화면 예외 · 덮개 없이 기다린다(누른 버튼이 「확인 중」을 그대로 들고 있다) */
  var to = setTimeout(function () { if (done) return; done = true; normal(); }, 1200);
  lgxPush(function (r) {
    if (done) { if (r === "added" && !lgxHasLgShown()) { lgxLocal(); stampOverlay("lg"); } else if (r === "dup") lgxLocal(); return; }
    done = true; clearTimeout(to);
    if (r === "added") { lgxStart(emp, "ok", cover); return; }
    if (r === "dup") { lgxMark(emp); lgxLocal(); }
    normal();
  });
}
function lgxHasLgShown() { return S.get("stamps", []).indexOf("lg") >= 0; }
/* v4.95 (사용자 261002 「권장대로」) 로그인 두 화면(첫 화면 · 재방문 #quick)의 입장 처리 = 버튼 안 대기만 · 회색 대기 덮개(botWait) 없음
   점(1막 캔버스)이 계속 숨쉬어 첫 화면 → 최초 로그인 장면의 이음새가 끊기지 않는다 · 다른 화면의 botWait 는 그대로(design.md A-5 5번 「로그인 두 화면 예외」) */
function lfBusy(btn, on, label) {
  if (!btn) return;
  btn.disabled = !!on;
  if (on) { btn.setAttribute("aria-busy", "true"); btn.textContent = "확인 중"; }
  else { btn.removeAttribute("aria-busy"); btn.textContent = label; }
}

