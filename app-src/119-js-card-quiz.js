/* ═══ v4.96 AX 퀴즈 「판 퀴즈」 (261001 사용자 확정 · 「디자인 시안/AX 퀴즈/디자인 방향 검토.md」 권장안 · CLAUDE.md 스탬프 2번 하이브리드) ═══
   1층 판 문법(공통 부품 K · 컨테이너 .axs-pan) · 시계 · 목숨 · 점수 화면 없음 · 답할 때마다 해설
   힌트 = 1F 구역 › 줄 › 판 제목(번호 없음 · 감점 · 잠금 · 횟수 제한 없음 · 서버로 보내지 않는다)
   한 판 = 10문항(쉬움 5 · 보통 4 · 어려움 1 · QZ_CARD = 서버 OX_CARD) · 그중 1문항 = 꼭 기억할 핵심 순서 맞추기(QZ_KEYQ = 서버 OX_KEYQ · 판마다 셋 중 하나 · 돌려 가며) · 나머지 O/X(OX_BANK)
   이어 풀기 = 이 기기에 저장(qz_run · 사번에 묶음 · 다른 화면 · 앱을 닫아도 그대로) · 10문항을 모두 답하면 서버에 한 번 보낸다
     ql = 「F06.O」 · 순서형 「K01.D123」(누른 조각 차례 · 1~9 바른 자리 · D 미끼) · 서버가 다시 채점 · 받은 판 = AX 퀴즈 완주(스탬프 2)
   옛 서버(판 퀴즈를 모름 · range)면 이 기기에 두었다가 다음 동기화 때 다시 보낸다(qz_pend · 24시간)
   유리다리 O/X(game_ox · gsStartHtml)는 QUIZ_CARD = false 한 줄로 되돌린다(코드 보존 · 휴면)
   v5.00 (261002 사용자 요구 「10문제는 너무 많다 · 1층에서 서서 1~3분」) 한 판 = 5문항(QZ_CARD · O/X 4 + 순서형 1 · 쉬움 2 · 보통 2 · 어려움 1 · 정답 200 · 만점 1,000 그대로) · 은행 49 → 29
     판 크기는 문항 수로 가른다(qzCardOf · 서버도 같은 규칙) · 새 판 크기 = 서버가 5문항 판을 안다고 할 때(ox_start card.sizes)만 5 · 옛 서버면 10(QZ_CARD_OLD · 옛 서버가 받는 판)
     이 기기에 남은 10문항 판은 답한 문항이 있으면 10문항 그대로 이어 풀고(새 서버도 받는다) · 하나도 안 풀었으면 5문항 새 판 */
var QZ_CARD = { per: [2, 2, 1], key: 1, pt: 200 };
var QZ_CARD_OLD = { per: [5, 4, 1], key: 1, pt: 100 }, QZ_CARDS = [QZ_CARD, QZ_CARD_OLD];
function qzCardOf(n) { for (var i = 0; i < QZ_CARDS.length; i++) { var P = QZ_CARDS[i].per; if (P[0] + P[1] + P[2] === n) return QZ_CARDS[i]; } return null; }
function qzSizeNew() { var c = OXS.card; return c && typeof c === "object" && !(Array.isArray(c.sizes) && c.sizes.indexOf(5) >= 0) ? 10 : 5; }   /* 응답 전(undefined) · 새 서버 = 5 · card 는 있는데 sizes 가 없는 옛 서버 = 10 */
/* v4.98 문제 은행 판 번호(서버 OX_BANK_REV · ox_start card.bank) · QZ_NEW = 이 판에서 새로 넣은 O/X · 옛 서버는 모르는 id 로 거절하므로 서버가 bank 2 이상이라고 알려 줄 때만 낸다(oxOffList · 앱을 먼저 올려도 안전) */
var QZ_BANK = 2, QZ_NEW = ["F83", "F84", "F85"];
function oxNewOk() { return !!(OXS.card && OXS.card.bank >= QZ_BANK); }
/* 핵심 순서형 · 서버 OX_KEYQ 와 id · 난이도 · 짝 그룹 · 조각 수가 같다(검사 141절) · 조각 = order 는 pairs 의 오른쪽 · sentence 는 words · 미끼(pool)는 지금 없다(D 는 서버 형식에만 남긴다)
   g = 같은 판에 내지 않는 O/X 짝 그룹(로드맵 키워드 · 목표 · 슬로건 문항이 정답을 미리 알려 주지 않게) */
var QZ_KEYQ = [
  { id: "K01", lv: 1, h: "vision.2026", g: ["r26", "r27", "r28"], kind: "order", q: "AX 로드맵 연도별 키워드를 순서대로 놓아 보세요",
    pairs: [["2026", "공감과 참여"], ["2027", "확산과 체화"], ["2028", "혁신과 연결"]], pool: [], e: "AX 필요성을 체감하고, 현업 경험을 넓혀, 비즈니스 모델 혁신으로 잇는다." },
  { id: "K02", lv: 1, h: "vision.metowe", g: ["slg"], kind: "sentence", q: "슬로건 「ME to WE :」 다음 문장을 순서대로 놓아 보세요", lead: "ME to WE :",
    words: ["나의", "경험을", "우리의", "가능성으로"], pool: [], e: "나의 경험이 모여 우리의 큰 가능성이 된다." },
  { id: "K03", lv: 2, h: "vision.2026", g: ["r26", "r27", "r28"], kind: "order", q: "AX 로드맵 연도별 대표 목표를 순서대로 놓아 보세요",
    pairs: [["2026", "사내 LLM 도입"], ["2027", "업무 영역별 Agent"], ["2028", "1인 1 AI Agent"]], pool: [], e: "사내 LLM에서 시작해 업무별 Agent를 거쳐 1인 1 AI Agent로 간다." }
];
/* 서버가 판 퀴즈를 아는가 · ox_start 응답에 card 가 있으면 새 서버 · 없으면 옛 서버(false) → 유리다리 O/X 로 물러선다 · 받기 전(undefined)은 판 퀴즈
   그래서 앱을 서버보다 먼저 올려도 된다(옛 서버에서는 예전 화면 그대로 · 판 퀴즈로 이미 다 푼 판은 qz_pend 로 기다렸다가 새 서버에 보낸다) */
function qzLive() { return QUIZ_CARD && OXS.card !== false; }
function qzKeyq(id) { return QZ_KEYQ.filter(function (k) { return k.id === id; })[0] || null; }
function qzPieces(k) { return k.kind === "order" ? k.pairs.map(function (p) { return p[1]; }) : k.words; }
/* 판 표기 · 힌트 코드(OX_BANK h · QZ_KEYQ h) → [줄, 판 제목] · 구역은 코드 앞 마디(FLOOR1 id) · 판 번호는 쓰지 않는다(현장에 인쇄되지 않음 · 사용자 261001)
   정본 = 「기억력 문제 은행 v3.json」 hint_codes(검사 141절이 대조) · 판 제목은 현장 판에 인쇄된 영문 그대로 */
var QZ_PANEL = {
  "vision.cover": ["", "AX Festival 2026"], "vision.metowe": ["", "AX Festival 2026"], "vision.dbc": ["", "Data Business Company"],   /* 261008 1층 수정본 · 옛 판 3(ME to WE :)이 판 2(AX Festival 2026)에 합쳐져 두 코드가 같은 판 */
  "vision.2026": ["", "AX Roadmap 2026"], "vision.2027": ["", "2027"], "vision.2028": ["", "2028"],
  "lab.dap": ["", "DAP"], "lab.history": ["", "History"], "lab.project": ["", "Project"], "lab.idea": ["", "아이디어 QR"],
  "action.intro": ["", "AX in Action"], "action.sales": ["", "Sales AX"], "action.consult": ["", "AI 컨설팅 도우미"], "action.claims": ["", "Claims AX"],
  /* 261008 1층 수정본 · AX 라운지 판 · 간판 삭제(데스크만) = lounge.intro · lounge.steps 힌트 걷음(문항은 「AX 상식」 칩으로 유지 · 구현 계획 결정 6) */
  "play.hq.hidi": ["HiDI-Q", "HiDI"], "play.hq.intro": ["HiDI-Q", "Introduce"], "play.hq.tips": ["HiDI-Q", "Tips"], "play.hq.feedback": ["HiDI-Q", "Feedback"],
  "play.hh.helper": ["Hi-Helper", "Hi-Helper"], "play.hh.intro": ["Hi-Helper", "Introduce"], "play.hh.tips": ["Hi-Helper", "Tips"], "play.hh.check": ["Hi-Helper", "Check Point."], "play.hh.feedback": ["Hi-Helper", "Feedback"],
  "event.photo": ["", "AI 포토부스"], "event.roulette": ["", "룰렛 이벤트"], "event.typing": ["", "타자왕 게임"], "event.typingking": ["", "AX 타자왕"]
};
/* 구역 간판이 현장에 없는 구역 · 힌트에 옆 판 기준 한 줄(1층 부스 최종 정리 1장 · 판 14~18 · AX LAB 판 08~13 다음) */
var QZ_NOSIGN = { action: "구역 간판이 없어요 · AX LAB 판 바로 다음, 「AX in Action」 제목 판부터예요" };
var QZ_GEN = "AX 상식";   /* 판 근거가 없는 문항(A 13 · 힌트 없음)의 회색 칩 */
var QZ = { tapBad: -1, tapAt: 0, sending: false };
/* 문항 하나 · id → { id, lv, q, a(O/X 정답 · 순서형은 ''), e, h, z(구역 id), key(순서형 정의) } */
function qzItem(id) {
  var k = qzKeyq(id);
  if (k) return { id: id, lv: k.lv, q: k.q, a: "", e: k.e, h: k.h, z: k.h.split(".")[0], key: k };
  var b = OX_BANK.filter(function (x) { return x.id === id; })[0];
  if (!b) return null;
  return { id: id, lv: b.lv, q: b.q, a: b.a, e: b.e, h: b.h || "", z: b.z || (b.h ? b.h.split(".")[0] : ""), key: null };
}
function qzZone(z) { return z ? zoneById(z) : null; }
/* 구역 칩 · K1 axs-sign 그대로(오렌지 면 + 흰 굵은 글자 · 사용자 확정 261002) · 판 근거가 없으면 회색 「AX 상식」 */
function qzChip(it, big) {
  var zz = it.h ? qzZone(it.z) : null;   /* 261008 힌트 판이 없는 문항(A · 라운지 F74) = 「AX 상식」 · 구역 z 는 출제 섞기용으로 남는다 */
  if (!zz) return '<span class="qz-gen">' + QZ_GEN + "</span>";
  return zoneSign(zz.sign, big ? "lg" : "");
}
/* 출처 한 줄 「AX PLAY › HiDI-Q › Introduce 판」 · 줄이 없는 구역은 두 마디 */
function qzSrc(h) {
  var p = QZ_PANEL[h], zz = h ? qzZone(h.split(".")[0]) : null;
  if (!p || !zz) return "";
  return [zz.sign].concat(p[0] ? [p[0]] : []).concat([p[1] + " 판"]).join(" › ");
}
function qzLinePan(h) { var p = QZ_PANEL[h]; return p ? (p[0] ? p[0] + " 줄 › " : "") + p[1] + " 판" : ""; }

/* ── 이어 풀기 저장 · qz_run = { emp, t, q[10 ids], a[답 · O/X 또는 누른 순서], k(풀던 순서형 누른 차례), ks(순서형 타일 순서), see(해설을 연 문항 · -1) } ── */
function qzRun() {
  var r = S.get("qz_run", null);
  return r && ownIs(r) && Array.isArray(r.q) && !!qzCardOf(r.q.length) && Array.isArray(r.a) && r.a.length === r.q.length && (r.q.length === qzSizeNew() || qzAnswered(r) > 0) && r.q.every(function (id) { return !!qzItem(id); }) ? r : null;   /* v4.98 은행에서 뺀 문항이 든 판(이 기기에 남은 옛 판)은 이어 풀지 않고 새 판 · v5.00 판 크기가 지금과 다른 판은 답한 문항이 있을 때만 그대로 이어 푼다(서버가 5 · 10 둘 다 받는다) */
}
function qzN(r) { return r && Array.isArray(r.q) ? r.q.length : qzSizeNew(); }   /* v5.00 그 판의 문항 수 · 판이 없으면 새 판 크기 */
function qzLenTxt() { return qzSizeNew() + "문제 · 약 " + (qzSizeNew() > 5 ? 4 : 2) + "분"; }   /* v5.00 홈 다음 스탬프 · 스탬프 탭 줄 · 5문항 약 2분(QA 추정 1~2.7분) */
function qzAnswered(r) { var n = 0; for (var i = 0; i < r.q.length; i++) if (r.a[i] != null) n++; return n; }
function qzCur(r) { for (var i = 0; i < r.q.length; i++) if (r.a[i] == null) return i; return -1; }
function qzSave(r) { S.set("qz_run", r); }
/* 한 판 뽑기 · 순서형 한 문항(QZ_KEYQ 에서 돌려 가며 · 끈 것 빼고) · O/X 는 난이도마다 per(순서형 자리만큼 하나 덜) · 짝 그룹 하나 · 최근 본 문항 뒤로 · O·X 각 60%까지(유리다리 oxPick 과 같은 규칙)
   위 난이도 문항이 모자라면(끈 문항이 많을 때) 아래 난이도로 채운다(서버 per 판정이 허락하는 방향) · 순서형은 자기 난이도 칸 안 아무 자리
   v5.00 n = 판 크기(5 · 옛 서버면 10) · 난이도 묶음이 1~2문항이라 묶음 60% 규칙이 듣지 않으므로 판 전체 O/X 도 60%까지(4문항이면 같은 답 3개까지) */
function qzPick(n) {
  var CD = qzCardOf(n || qzSizeNew()) || QZ_CARD, P = CD.per, off = oxOffList(), seen = S.get("ox_seen", []) || [], used = {}, grp = {};
  var kseen = S.get("qz_kseen", []) || [], keys = QZ_KEYQ.filter(function (k) { return off.indexOf(k.id) < 0; });
  var key = null;
  if (CD.key > 0 && keys.length) {
    var fresh = keys.filter(function (k) { return kseen.indexOf(k.id) < 0; });
    key = shuf((fresh.length ? fresh : keys).slice())[0];
    S.set("qz_kseen", (fresh.length ? kseen : []).concat([key.id]));
    key.g.forEach(function (g) { grp[g] = 1; });
  }
  var free = function (x) { return off.indexOf(x.id) < 0 && !used[x.id] && !(x.g && grp[x.g]); };
  var out = [[], [], []], carry = 0, tot = { O: 0, X: 0 }, tcap = Math.ceil((P[0] + P[1] + P[2] - (key ? 1 : 0)) * 0.6);
  [3, 2, 1].forEach(function (lv) {
    var d = lv - 1, need = P[d] - (key && key.lv === lv ? 1 : 0) + carry, cand = shuf(OX_BANK.filter(function (x) { return x.lv === lv && free(x); }));
    var fr = cand.filter(function (x) { return seen.indexOf(x.id) < 0; });
    if (fr.length < need) seen = seen.filter(function (id) { return !OX_KEY[id] || OX_KEY[id][0] !== lv; });
    var order = fr.length < need ? cand : fr.concat(cand.filter(function (x) { return fr.indexOf(x) < 0; }));
    var cap = Math.ceil(need * 0.6), cnt = { O: 0, X: 0 };
    [true, false].forEach(function (bal) {
      order.forEach(function (x) {
        if (out[d].length >= need || !free(x) || (bal && (cnt[x.a] >= cap || tot[x.a] >= tcap))) return;
        out[d].push(x.id); used[x.id] = 1; if (x.g) grp[x.g] = 1; cnt[x.a]++; tot[x.a]++;
      });
    });
    carry = need - out[d].length;   /* 모자라면 아래 난이도가 채운다 */
  });
  if (key) { var d0 = key.lv - 1; out[d0].splice(Math.floor(Math.random() * (out[d0].length + 1)), 0, key.id); }
  var list = out[0].concat(out[1], out[2]);
  S.set("ox_seen", seen.concat(list.filter(function (id) { return id.charAt(0) !== "K"; })).slice(-OX_SEEN_MAX));
  return list;
}
function qzNew() {
  var n = qzSizeNew(), q = qzPick(n);
  if (q.length !== n) { toast("문제를 준비하지 못했어요 · 잠시 뒤 다시 해 주세요"); return null; }
  var r = { emp: ownEmp(), t: Date.now(), q: q, a: q.map(function () { return null; }), k: "", ks: [], see: -1 };
  qzSave(r);
  S.set("qz_last", null);
  return r;
}
function qzStart(fresh) {
  if (fresh || !qzRun()) { if (!qzNew()) return; }
  QZ.tapBad = -1;
  oxPrefetch();   /* 모두의 선택 비율 · 끈 문항(판을 시작하기 전에 받아 두면 좋지만 기다리지 않는다) */
  App.go("quiz_play");
}

/* ── 채점 · 서버 판 퀴즈 채점과 글자 그대로 같은 규칙(검사 141절이 무작위 판으로 대조) ── */
function qzIsCard(ql) {
  var s = String(ql == null ? "" : ql);
  return !!s && s.split(",").every(function (x) { return /^[ASRF]\d{2}\.[OX]$/.test(x) || /^K\d{2}\.[1-9D]{1,24}$/.test(x); });
}
function qzTapMiss(seq, n) {
  var want = 1, miss = 0;
  for (var i = 0; i < seq.length; i++) {
    if (want > n) return -1;
    var c = seq.charAt(i);
    if (c === String(want)) want++;
    else { if (c !== "D" && Number(c) > n) return -1; miss++; }
  }
  return want > n ? miss : -1;
}
function qzTally(ql) {
  var T = { ok: true, card: 1, items: [], n: 0, c1: 0, c2: 0, c3: 0, wr: 0, kq: 0, pts: 0, why: "" };
  var bad = function (w) { T.ok = false; T.pts = 0; T.why = w; return T; };
  if (!qzIsCard(ql)) return bad("form");
  var list = String(ql).split(","), seen = {}, grp = {}, cnt = [0, 0, 0, 0], prev = 1;
  var CD = qzCardOf(list.length) || QZ_CARD, P = CD.per, N = P[0] + P[1] + P[2];   /* v5.00 판 크기 = 문항 수(5 · 옛 10) */
  for (var i = 0; i < list.length; i++) {
    var a = list[i].split("."), id = a[0], ans = a[1], it;
    if (id.charAt(0) === "K") {
      var q = qzKeyq(id);
      if (!q) return bad("id");
      var miss = qzTapMiss(ans, qzPieces(q).length);
      if (miss < 0) return bad("tap");
      it = { id: id, lv: q.lv, g: q.g, a: "", ans: ans, key: 1, miss: miss, right: miss === 0 };
      T.kq++;
    } else {
      var k = oxKey(id);
      if (!k) return bad("id");
      it = { id: id, lv: k[0], g: k[2] ? [k[2]] : [], a: k[1], ans: ans, key: 0, right: ans === k[1] };
    }
    if (seen[id]) return bad("dup");
    seen[id] = 1;
    for (var j = 0; j < it.g.length; j++) { if (grp[it.g[j]]) return bad("grp"); grp[it.g[j]] = 1; }
    if (it.lv < prev) return bad("lv");
    prev = it.lv; cnt[it.lv]++; T.n++;
    if (it.right) { T["c" + it.lv]++; T.pts += CD.pt; } else T.wr++;
    T.items.push(it);
  }
  if (T.n !== N) return bad("n");
  if (cnt[1] > P[0] || cnt[1] + cnt[2] > P[0] + P[1]) return bad("per");
  if (T.kq > CD.key) return bad("key");
  return T;
}
function qzQl(r) { return r.q.map(function (id, i) { return id + "." + r.a[i]; }).join(","); }
function qzParts(ql) { var X = qzTally(ql); return { n: X.n, c1: X.c1, c2: X.c2, c3: X.c3, wr: X.wr, ql: ql }; }
function qzIsRight(id, a) { var it = qzItem(id); if (!it) return false; return it.key ? qzTapMiss(String(a), qzPieces(it.key).length) === 0 : a === it.a; }
/* 내 최고 · 서버 판 퀴즈 기록(ev.ox card · right)과 이 기기 qz_best 중 큰 쪽 · 유리다리 옛 기록은 세지 않는다
   v5.00 [정답, 문항 수] · 판 크기가 다를 수 있어(5 · 옛 10) 맞힌 비율로 고른다 · 서버 of 가 없으면(옛 서버) 10 · 이 기기 옛 값(숫자)도 10문항 판 · 기록이 없으면 null */
function qzBest() {
  var sv = OLY.board && OLY.board.me && OLY.board.me.ev && OLY.board.me.ev.ox, s = sv && sv.card ? [Number(sv.right) || 0, Number(sv.of) || 10] : null;
  var l = S.get("qz_best", null);
  l = l == null ? null : typeof l === "object" ? [Number(l.r) || 0, Number(l.n) || 10] : [Number(l) || 0, 10];
  return qzBetter(s, l);
}
function qzBetter(a, b) { return !a ? b : !b ? a : b[0] * a[1] > a[0] * b[1] ? b : a; }
function qzDoneEver() { var sv = OLY.board && OLY.board.me && OLY.board.me.ev && OLY.board.me.ev.ox; return (sv && sv.card) || S.get("qz_best", null) != null; }

/* ── 답하기 ── */
function qzAns(v) {
  var r = qzRun(); if (!r) return App.go("quiz");
  var i = qzCur(r);
  if (i < 0 || r.see >= 0 || qzKeyq(r.q[i])) return;
  r.a[i] = v === "O" ? "O" : "X"; r.see = i;
  var it = qzItem(r.q[i]); QZ.oxfx = it && it.a === r.a[i] ? { id: it.id, at: Date.now() } : null;   /* v5.60 O/X 정답 작은 팡 */
  qzSave(r); sfx("tok");
  App.render(); qzFocusFb();
}
/* 순서형 타일 · p = 조각 번호(1부터) 또는 0(미끼) · 바른 다음 조각이면 칸이 찬다 · 아니면 그 타일이 짧게 흔들리고 「순서가 달라요」 */
function qzTap(p) {
  var r = qzRun(); if (!r) return App.go("quiz");
  var i = qzCur(r), k = i >= 0 ? qzKeyq(r.q[i]) : null;
  if (!k || r.see >= 0) return;
  var n = qzPieces(k).length, want = qzFilled(r.k) + 1, c = p > 0 ? String(p) : "D";
  if (r.k.length >= 24) return;
  r.k += c;
  if (p === want) { QZ.tapBad = -1; sfx("tok"); }
  else { QZ.tapBad = p; QZ.tapAt = Date.now(); sfx("ttuk"); }
  if (qzFilled(r.k) >= n) { r.a[i] = r.k; r.k = ""; r.ks = []; r.see = i; QZ.tapBad = -1; QZ.fx = { id: k.id, ok: qzTapMiss(r.a[i], n) === 0, at: Date.now() }; }   /* v5.57 다 채운 순간 한 번(정답 팡 · 오답 흔들림) */
  qzSave(r); App.render();
  if (r.see >= 0) qzFxRun();
}
function qzFilled(seq) { var w = 1; for (var i = 0; i < seq.length; i++) if (seq.charAt(i) === String(w)) w++; return w - 1; }
function qzNext() {
  var r = qzRun(); if (!r) return App.go("quiz");
  r.see = -1; qzSave(r);
  if (qzCur(r) < 0) return qzFinish(r);
  App.render();
  var m = el("main"); if (m) m.scrollTop = 0;
  window.scrollTo(0, 0);
}
function qzFocusFb() { setTimeout(function () { var f = el("qzFb"); if (f && f.scrollIntoView) f.scrollIntoView({ block: "nearest", behavior: qzRm() ? "auto" : "smooth" }); }, 30); }
function qzRm() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
/* v5.57 (사용자 261004 「빈칸을 다 채워서 맞추면 팡 하는 이미지가 있거나 맞췄다는 연출이 있으면 좋겠어」) 순서형을 다 채운 순간 한 번(QZ.fx · 1.6초 안 · 다시 그려도 지난 시간 --qe 로 이어짐)
   정답(한 번도 다시 놓지 않음) = 채운 칸이 차례로 반짝(칸마다 0.09초) → 가운데 「팡」(링 2겹 + 잉크 튐 inkSplash · 스탬프 도장 연출과 같은 문법 · O100~O30) + 「정답」 알약 · 팡 소리(ppok) → 해설 · 다음 버튼이 뒤따름
   오답(다시 놓은 적 있음) = 칸 묶음이 한 번 짧게 흔들림(5px · 0.32초) · 움직임 줄이기 = 반짝 · 팡 · 흔들림 없이 칸 색만(정답 = 주황 테 · 연주황 면)
   판정 · 기록 · 서버 호출은 그대로(보이는 것만) · O/X 문항은 지금처럼 답 버튼 색 · 정답/오답 칩 */
var QZ_FX_MS = 1600;
function qzFxOn(id) { return !!(QZ.fx && QZ.fx.id === id && Date.now() - QZ.fx.at < QZ_FX_MS && !qzRm()); }
function qzFxT(n) { return n * 90 + 220; }   /* 팡 시각(ms) · 마지막 칸 반짝이 거의 끝날 때 */
function qzFxRun() {
  var fx = QZ.fx;
  if (!fx || !fx.ok || qzRm()) { qzFocusFb(); return; }
  var k = qzKeyq(fx.id), t = qzFxT(k ? qzPieces(k).length : 3);
  setTimeout(function () {
    if (QZ.fx !== fx) return;
    var p = document.querySelector("#view .qz-pang");
    if (p) inkSplash(p, 14, 1.3);
    sfx("ppok"); stampBuzz(30);
  }, t);
  setTimeout(function () { if (QZ.fx === fx) qzFocusFb(); }, t + 700);
}

/* ── 다 풀면 · 서버에 한 번(olySubmit · 판 번호 gid · 붐비면 oly_pend) · 결과 화면은 qz_last 로 그린다 ── */
function qzFinish(r) {
  if (!qzClose(r)) { toast("이번 판을 채점하지 못했어요 · 새 판으로 다시 해 주세요"); return App.go("quiz"); }
  tourRetDone(false);   /* v5.57 판 완주 = 마침(둘러보기에서 출발했으면 결과 화면에서 뒤로 = 1층 · 스탬프가 새로 들어오면 연출 뒤 자동) */
  App.render();
  window.scrollTo(0, 0);
}
/* 판 닫기(화면을 다시 그리지 않는다 · 그리는 중에도 부를 수 있다) · 내 최고 · qz_last · 이어 풀기 지움 · 서버 제출 */
function qzClose(r) {
  var ql = qzQl(r), X = qzTally(ql);
  S.set("qz_run", null);   /* 먼저 지운다 · 저장이 다시 그리기를 불러도 같은 판을 두 번 닫지 않는다 */
  if (!X.ok) return false;
  var right = X.c1 + X.c2 + X.c3, me = [right, X.n], prev = qzBest();
  if (qzBetter(prev, me) === me) S.set("qz_best", { r: right, n: X.n });   /* v5.00 { 정답, 문항 수 } · 옛 값(숫자)은 10문항 판 */
  S.set("qz_last", { emp: ownEmp(), t: Date.now(), ql: ql, right: right, best: qzBetter(prev, me) });
  olySubmit("ox", qzParts(ql));
  return true;
}
function qzLast() { var x = S.get("qz_last", null); return x && ownIs(x) && qzIsCard(x.ql) ? x : null; }

/* ── 화면 ── */
var QZ_O_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="4"/></svg>';
var QZ_X_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 8l16 16M24 8L8 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
function qzProgHtml(r, i) {
  var n = qzN(r), a = qzAnswered(r);
  return '<div class="qz-prog"><p><b>' + (i + 1) + " / " + n + '</b></p><div class="qz-seg" aria-hidden="true">' +
    r.q.map(function (id, k) { return "<i" + (r.a[k] != null ? ' class="on"' : k === i ? ' class="cur"' : "") + "></i>"; }).join("") + "</div>" +
    '<span class="ax-sr-only">' + a + "문제 답함</span></div>";
}
function quizPlayHtml() {
  var last = qzLast(), r = qzRun();
  if (!r && last) return qzResultHtml(last);
  if (!r) return qzHubHtml();
  var i = r.see >= 0 ? r.see : qzCur(r);
  if (i < 0) { setTimeout(function () { var r2 = qzRun(); if (r2 && qzCur(r2) < 0) qzFinish(r2); }, 0); return '<div class="ax-stack axs-pan qz">' + botHtml("채점하는 중이에요", { wait: 1 }) + "</div>"; }   /* 그리는 중에는 저장 · 제출하지 않는다(다시 그리기가 겹친다) */
  var it = qzItem(r.q[i]), see = r.see === i;
  if (!it) { S.set("qz_run", null); return qzHubHtml(); }
  var body = it.key ? qzKeyHtml(r, it, see) : qzOxHtml(r, it, see);
  var hint = it.h && QZ_PANEL[it.h] ? '<button type="button" class="qz-hint" id="qzHintBtn" onclick="qzHint(\'' + it.id + '\')">힌트 · 1층에서 찾기' + CHEV_SVG + "</button>" : "";
  var last1 = qzCur(r) < 0 || (see && qzAnswered(r) === qzN(r));
  var fxl = see && it.key && qzFxOn(it.id) && QZ.fx.ok ? ' qz-late" style="--t:' + qzFxT(qzPieces(it.key).length) + "ms;--qe:-" + (Date.now() - QZ.fx.at) + "ms" : "";   /* v5.57 정답 팡 · 해설 · 다음 버튼은 팡 뒤에 */
  return '<div class="ax-stack axs-pan qz' + fxl + '">' + qzProgHtml(r, i) +
    '<section class="qz-card" aria-labelledby="qzStm"><div class="qz-top">' + qzChip(it) + '<span class="axs-pill">Q' + (i + 1) + "</span></div>" +
    body + (see ? "" : hint) + (see ? qzFbHtml(it, r.a[i]) : "") + "</section>" +
    (see ? '<button type="button" class="ax-button" onclick="qzNext()">' + (last1 ? "결과 보기" : "다음 문제") + "</button>" : "") + "</div>";
}
/* v5.60 (권장안 · 아침 보고) O/X 정답에도 작은 팡 · 고른 답이 맞은 순간 한 번(0.6초 안 · 다시 그려도 --qe 로 이어짐) · 답 버튼이 살짝 튀고(1.06배) 링 하나가 퍼진다(약 0.4초)
   순서형 팡(v5.57)과 같은 계열(링 + 튐) · 정답 버튼 색(초록) 그대로 링도 같은 색 · 움직임 줄이기 = 색만(지금처럼) · 오답은 지금처럼 색만 */
var QZ_OXFX_MS = 600;
function qzOxFxOn(id) { return !!(QZ.oxfx && QZ.oxfx.id === id && Date.now() - QZ.oxfx.at < QZ_OXFX_MS && !qzRm()); }
function qzOxHtml(r, it, see) {
  var a = r.a[r.q.indexOf(it.id)], pop = see && a === it.a && qzOxFxOn(it.id);
  var btn = function (v, lbl, svg) {
    var cls = "qz-ab", dis = see ? " disabled" : "", fx = pop && v === it.a;
    if (see) cls += v === it.a ? " ok" : v === a ? " no" : " dim";
    if (fx) cls += " pop";
    return '<button type="button" class="' + cls + '" onclick="qzAns(\'' + v + '\')"' + dis + (fx ? ' style="--qe:-' + (Date.now() - QZ.oxfx.at) + 'ms"' : "") + ' aria-label="' + lbl + (see && v === a ? " · 고른 답" : "") + '">' + svg + "<span>" + lbl + "</span>" + (fx ? '<i class="qz-oxr" aria-hidden="true"></i>' : "") + "</button>";
  };
  return '<div class="axs-bar qz-stm" id="qzStm"><b>' + esc(it.q) + "</b></div>" +
    '<div class="qz-ans" role="group" aria-label="답">' + btn("O", "맞아요", QZ_O_SVG) + btn("X", "아니에요", QZ_X_SVG) + "</div>";
}
/* 순서형 · order = 연도 칸(검정 알약 라벨) · sentence = 앞 글(ME to WE :) + 빈 칸 · 타일 순서는 판에 한 번 섞어 저장(ks) */
function qzKeyHtml(r, it, see) {
  var k = it.key, pcs = qzPieces(k), n = pcs.length, seq = see ? r.a[r.q.indexOf(it.id)] : r.k, filled = see ? n : qzFilled(seq);
  if (!see && (!Array.isArray(r.ks) || r.ks.length !== n + k.pool.length)) {
    var ks = []; for (var j = 1; j <= n; j++) ks.push(j); k.pool.forEach(function () { ks.push(0); });
    do { shuf(ks); } while (n > 1 && ks.join() === ks.slice().sort().join());   /* 처음부터 정답 순서로 놓이지 않게 */
    r.ks = ks; qzSave(r);
  }
  var ok = see && qzIsRight(it.id, seq), fx = see && qzFxOn(k.id) ? QZ.fx : null;   /* v5.57 다 채운 순간 · 정답 팡 · 오답 흔들림 */
  var slot = function (j) {
    var on = j < filled, lab = k.kind === "order" ? '<span class="axs-pill">' + esc(k.pairs[j][0]) + "</span>" : "";
    return '<div class="qz-sl' + (on ? " f" : j === filled && !see ? " c" : "") + '"' + (fx && fx.ok ? ' style="--i:' + j + '"' : "") + ">" + lab + "<span>" + (on ? esc(pcs[j]) : "") + "</span></div>";
  };
  var slots = '<div class="qz-slots' + (k.kind === "order" ? " ord" : "") + (ok ? " qz-ok" : "") + (fx ? (fx.ok ? " qz-win" : " qz-lose") : "") + (fx && !fx.ok ? '" style="--qe:-' + (Date.now() - fx.at) + "ms" : "") + '">' + (k.lead ? '<span class="qz-lead">' + esc(k.lead) + "</span>" : "") + pcs.map(function (p, j) { return slot(j); }).join("") +
    (fx && fx.ok ? '<span class="qz-pang" aria-hidden="true"><i class="r"></i><i class="r r2"></i><b>정답</b></span>' : "") + "</div>";
  var tiles = see ? "" : '<div class="qz-tiles" role="group" aria-label="조각">' + r.ks.map(function (p, t) {
    var used = p > 0 && p <= filled, txt = p > 0 ? pcs[p - 1] : k.pool[t - n] || "", bad = QZ.tapBad === p && Date.now() - QZ.tapAt < 1500;
    return '<button type="button" class="qz-tl' + (used ? " u" : "") + (bad ? " w" : "") + '" onclick="qzTap(' + p + ')"' + (used ? " disabled" : "") + ">" + esc(txt) + "</button>";
  }).join("") + "</div>" + (QZ.tapBad >= 0 && Date.now() - QZ.tapAt < 1500 ? '<p class="qz-miss" role="status">순서가 달라요</p>' : '<p class="ax-meta">눌러서 순서대로 놓기</p>');
  return '<div class="axs-bar qz-stm" id="qzStm"><b>' + esc(it.q) + "</b></div>" + slots + tiles;
}
/* 해설 · 얇은 ink 줄(K4) · 정답 / 오답 칩 · 「정답 O」 · 주황 점 해설(K5) · 출처(구역 › 줄 › 판) · 모두의 선택(20명 이상일 때) */
function qzFbHtml(it, a) {
  var ok = qzIsRight(it.id, a), src = qzSrc(it.h), ratio = it.key ? "" : oxRatioText(it.id);
  var ans = it.key ? (it.key.kind === "order" ? it.key.pairs.map(function (p) { return p[0] + " " + p[1]; }).join(" → ") : (it.key.lead ? it.key.lead + " " : "") + it.key.words.join(" ")) : "정답 " + it.a;
  var miss = it.key && !ok ? qzTapMiss(String(a), qzPieces(it.key).length) : 0;
  return '<div class="qz-fb" id="qzFb" tabindex="-1"><hr class="axs-rule"><p class="qz-fh"><span class="axs-chip ' + (ok ? "ok" : "bad") + '">' + (ok ? "정답" : "오답") + "</span><b>" + esc(ans) + "</b></p>" +
    (miss ? '<p class="ax-meta">' + miss + "번 다시 놓았어요</p>" : "") +
    '<div class="axs-todo"><p>' + esc(it.e) + "</p></div>" +
    (src ? '<p class="qz-src">' + esc(src) + "</p>" : "") + (ratio ? '<p class="ax-meta">' + esc(ratio) + "</p>" : "") + "</div>";
}
/* 결과 · 완주 · 정답 n / 10 · 내 최고 · 틀린 문제 전부(문장 · 정답 · 해설 · 「판에서 확인」 = 그 구역 상세) · 주 버튼 스탬프 보기 · 한 판 더 */
function qzResultHtml(x) {
  var X = qzTally(x.ql), N = String(x.ql).split(",").length, right = X.ok ? X.c1 + X.c2 + X.c3 : x.right || 0, best = qzBetter(qzBest(), [right, N]);   /* v5.00 N = 그 판의 문항 수 · 내 최고 = [정답, 문항 수] */
  var wrong = X.ok ? X.items.filter(function (t) { return !t.right; }) : [];
  var got = S.get("stamps", []).indexOf("qz") >= 0;
  var rows = wrong.map(function (t) {
    var it = qzItem(t.id); if (!it) return "";
    var ans = it.key ? (it.key.kind === "order" ? it.key.pairs.map(function (p) { return p[0] + " " + p[1]; }).join(" → ") : (it.key.lead ? it.key.lead + " " : "") + it.key.words.join(" ")) : "정답 " + it.a;
    var lp = it.h && QZ_PANEL[it.h] && it.z ? '<button type="button" class="qz-hint" onclick="zoneOpen(\'' + it.z + '\')">' + esc(qzLinePan(it.h)) + "에서 확인" + CHEV_SVG + "</button>" : "";
    return '<section class="qz-card qz-wr"><div class="qz-top">' + qzChip(it) + '<span class="axs-chip bad">오답</span></div><p class="qz-wq">' + esc(it.q) + "</p>" +
      '<p class="qz-we"><b>' + esc(ans) + "</b> · " + esc(it.e) + "</p>" + lp + "</section>";
  }).join("");
  return '<div class="ax-stack axs-pan qz">' +
    '<section class="qz-card qz-res">' + (stampV2() ? '<span class="qz-smkr">' + stampMkHtml("qz", got ? "AX 퀴즈 스탬프" : "AX 퀴즈") + "</span>" : "") +
    '<h2 class="ax-type-t2">AX 퀴즈 완주</h2><p class="qz-big"><b>' + right + "</b><span> / " + N + " 정답</span></p>" +
    '<p class="ax-meta">내 최고 ' + best[0] + " / " + best[1] + "</p></section>" +
    (wrong.length ? '<p class="axs-dot">틀린 문제 ' + wrong.length + "</p>" + rows : '<p class="axs-dot">모두 맞혔어요</p>') +
    '<div class="ax-stack-tight"><button type="button" class="ax-button" onclick="App.tab(\'exp\')">스탬프 보기</button>' +   /* v5.67 둘러보기 복귀 = 떠 있는 「3D로 돌아가기」(trf) 하나 · 옛 v5.57 결과 주 버튼 없앰 */
    '<button type="button" class="ax-button ax-button-weak" onclick="qzStart(true)">한 판 더</button></div></div>';
}
/* 목록(quiz) · 한 행 · 상태 칩(시작 전 · 이어 풀기 n / 10 · 완주 · 내 최고 n / 10) · 진행 막대 · 주 버튼 하나 */
function qzHubHtml() {
  olyPull(); oxPrefetch();
  var r = qzRun(), N = qzN(r), a = r ? qzAnswered(r) : 0, best = qzBest() || [0, N], done = qzDoneEver();   /* v5.00 N = 이어 푸는 판 또는 새 판의 문항 수 · 내 최고는 그 판의 문항 수로 */
  var chip = r ? '<span class="axs-chip">이어 풀기 ' + a + " / " + N + "</span>" : done ? '<span class="axs-chip ok">완주 · 내 최고 ' + best[0] + " / " + best[1] + "</span>" : '<span class="axs-chip off">시작 전</span>';
  var seg = r ? '<div class="qz-seg" aria-hidden="true">' + r.q.map(function (id, k) { return "<i" + (r.a[k] != null ? ' class="on"' : "") + "></i>"; }).join("") + "</div>" : "";
  return '<div class="ax-stack axs-pan qz">' +
    '<section class="qz-card qz-hub"><div class="qz-top"><div class="ax-stack-tight"><h2 class="ax-section-title">AX 퀴즈</h2><p class="ax-meta">' + segHtml("1층 부스 내용 " + N + "문제 · 모두 답하면 완주") + "</p></div>" +
    (stampV2() ? '<span class="qz-smkr">' + stampMkHtml("qz", "AX 퀴즈") + "</span>" : "") + "</div>" + '<p class="qz-stl">' + chip + "</p>" + seg +
    '<button type="button" class="ax-button" onclick="qzStart(' + (r ? "false" : "true") + ')">' + (r ? "이어 풀기" : done ? "한 판 더" : "AX 퀴즈 시작") + "</button></section>" +
    '<p class="ax-meta">순위 없음 · 시간 제한 없음 · 힌트는 1층 판에</p></div>';
}
/* 힌트 시트 · 구역 간판(크게) · 줄 › 판 · 6구역 칩(그 구역 강조) · 이 구역에서 받는 스탬프 · 「이 구역 보기」(구역 상세) · 「문제로 돌아가기」 */
function qzHint(id) {
  var it = qzItem(id); if (!it || !QZ_PANEL[it.h]) return;
  var zz = qzZone(it.z), st = zz && zz.st ? STAMPS.filter(function (s) { return s.id === zz.st; })[0] : null;
  var map = '<div class="qz-map" role="list" aria-label="1F 부스 6구역">' + FLOOR1.map(function (z) { return '<span role="listitem" class="' + (z.id === it.z ? "on" : "") + '"' + (z.id === it.z ? ' aria-current="true"' : "") + ">" + esc(z.sign) + "</span>"; }).join("") + "</div>";
  var body = '<div class="axs-pan qz qz-hs">' + (zz ? zoneSign(zz.sign, "lg chip") : "") + '<p class="qz-lp">' + esc(qzLinePan(it.h)) + "</p>" +
    (tourOn() ? '<button type="button" class="qz-hint" onclick="sheetClose(true); tourOpen({ hint: \'' + it.h + '\' })">모형에서 보기' + CHEV_SVG + "</button>" : "") +   /* v5.11 (사용자 261003 결정 4) 1층 둘러보기가 이 판으로 바로 열린다(TOUR_ON 일 때만) */
    (QZ_NOSIGN[it.z] ? '<p class="ax-meta">' + esc(QZ_NOSIGN[it.z]) + "</p>" : "") +
    '<p class="axs-dot">1F 부스 6구역</p>' + map +
    (st ? '<p class="qz-zin"><b>이 구역에서</b><span>' + esc(zz.stl || st.title) + " 스탬프</span></p>" : "") +
    '<p class="ax-meta">풀던 문제는 저장돼요</p></div>';
  sheetOpen({ id: "qzhint", title: "힌트", body: body, keep: "문제로 돌아가기", keepWeak: true, go: "sheetClose(true); zoneOpen('" + it.z + "')", goLbl: "이 구역 보기", back: "qzHintBtn" });
}
/* 옛 서버(판 퀴즈 형식을 모름 · range)에 보낸 판 · 이 기기에 두었다가(24시간) 동기화 때 10분에 한 번 다시 보낸다 */
var QZ_PEND_MAX = 86400000, QZ_PEND_GAP = 600000;
function qzPendAdd(body, score, gid) { S.set("qz_pend", { emp: ownEmp(), body: body, score: score, gid: gid || "", t: Date.now(), at: Date.now() }); }
function qzPendFlush() {
  var x = S.get("qz_pend", null), u = S.get("user", {}) || {};
  if (!x) return;
  if (!ownIs(x) || Date.now() - (x.t || 0) > QZ_PEND_MAX) { S.set("qz_pend", null); return; }
  if (Date.now() - (x.at || 0) < QZ_PEND_GAP || !BE.on || !u.empId || testEmp()) return;
  x.at = Date.now(); S.set("qz_pend", x);
  beCall({ action: "game_submit", emp: u.empId, name: u.name || "", game: "ox", v: "g5", parts: JSON.stringify(x.body), score: x.score, gid: x.gid || "" }, function (r) {
    if (!r || beBusy(r) || r.reason === "range") return;
    S.set("qz_pend", null);
    if (r.ok) { if (OLY.board) OLY.board.me = r.me; else OLY.board = { me: r.me }; qzStampCheck(r.qz || null); }
  }, function () {});
}
/* v4.83 (261001 사용자 수정) AX 퀴즈 · 게임 허브 밖의 별도 활동(1층 부스 내용을 배우는 퀴즈) · O/X · 기억력 두 행 · 순위판 · 총점 없음 · 내 최고와 완주만
   스탬프 2(qz) 는 두 종목 모두 한 판 · 옛 서버(stv 없음)에는 qz 스탬프가 없어 도장 줄을 그리지 않는다 */
function quizHubHtml() {
  olyPull();
  var me = olyMe();
  return (stampV2() ? stampLineHtml("qz", '<p class="ax-meta">' + "O/X 12문제 · 한 판 완주" + "</p>") : "") +
    olyKeysEvents(OLY_QUIZ_KEYS).map(function (e) {
      var v = me.ev[e.key];
      return rcHtml({ cls: v ? " done" : "", onclick: "App.go('" + e.view + "')", link: true, left: rcIcon(STAMP_ICONS.qz),
        title: esc(e.name), sub: v ? "완주 · 내 최고 " + olyFmt(v.best) : "", right: '<span class="st">' + (v ? "완주" : "") + "</span>" });
    }).join("") +
    '<p class="ax-meta">순위 없음 · 내 최고 기록만</p>';
}
/* v4.16 (사용자 확정 260922) 가짜 참가자 목업(OLY_FAKE·olyTestBoard·olyPosOf) 삭제 · 관리자·테스트 계정도 실서버 oly_board 를 읽는다 */
/* ── 순위판 조각 (§7.3) ── */
/* 종합 포디움 2-1-3 · 1위 월계수 84px · 2·3위 64px */
function olyPodiumHtml(list) {
  var slot = function (x, rank) {
    if (!x) return '<div class="oly-pd r' + rank + ' empty"><div class="oly-pd-top"><span class="oly-pd-no">' + rank + '</span></div><div class="oly-pd-st"></div></div>';
    return '<div class="oly-pd r' + rank + (x.me ? " me" : "") + '"><div class="oly-pd-top">' + olyLw(rank, rank === 1 ? 84 : 64) +
      '<b class="oly-pd-nm">' + esc(x.name) + '</b><span class="oly-pd-sc">' + olyFmt(x.total) + '</span></div><div class="oly-pd-st"><span>' + rank + "</span></div></div>";
  };
  return '<div class="oly-podium">' + slot(list[1], 2) + slot(list[0], 1) + slot(list[2], 3) + "</div>";
}
/* 목록 행 · big = 1~3위 72px 행(월계수 48px) · 나머지 56px 숫자 순위 */
function olyRowHtml(x, val, sub, big, me) {
  var lw = big ? olyLw(x.rank, 48) : "";
  return '<div class="oly-row' + (big ? " big" : "") + (me ? " me" : "") + '"><span class="no">' + (lw || x.rank) + '</span><span class="nm">' + esc(x.name) +
    (sub ? "<small>" + esc(sub) + "</small>" : "") + '</span><span class="sc">' + val + "</span></div>";
}
/* 261009 순위 구분 칸 바꾸기 = 기준 모션(동작 모션 통일 · AXM.seg) */
function olyTab(k, b) { AXM.seg(b, function () { S.set("oly_tab", k); App.render(); }, { ok: function () { return App.current === "oly_rank"; } }); }
/* 순위판 화면 (oly_rank) · 종합 = 포디움 2-1-3 + 4~10위 + 내 줄 · 종목별 = 1~3위 72px 행 + 4~10위 + 내 줄 */
function olyRankHtml() {
  olyPull();
  var b = OLY.board, tab = S.get("oly_tab", "all") === "event" ? "event" : "all", evk = S.get("oly_ev", OLY_EVENTS[0].key), me = olyMe(), nick = typeNick() || "나", OVE = olyOvEvents();
  if (!OVE.some(function (e) { return e.key === evk; })) evk = OVE[0].key;   /* v4.83 퀴즈 종목은 순위판 칩이 없다 */
  var seg = '<div class="axs-seg" role="tablist" aria-label="순위 구분">' + [["all", "종합"], ["event", "종목별"]].map(function (t) {
    return '<button type="button" role="tab" aria-selected="' + (tab === t[0]) + '" onclick="olyTab(\'' + t[0] + '\', this)">' + t[1] + "</button>";
  }).join("") + "</div>";
  var h = '<div class="ax-stack oly-rk">' + seg;   /* v4.16 항상 실서버 값 · 가짜 닉네임 안내 삭제 */
  if (!b || !b.overall) return h + botHtml("순위를 불러오는 중이에요", { wait: 1 }) + "</div>";
  var at = b.t ? String(b.t).slice(11, 16) : "";
  if (tab === "event") {
    var ev = olyEv(evk), mv = me.ev[evk], list = (b.perEvent && b.perEvent[evk]) || [];
    h += '<div class="axs-chiprow" role="group" aria-label="종목">' + OVE.map(function (e) {
      return '<button type="button" class="axs-chip" aria-pressed="' + (e.key === evk) + '" onclick="S.set(\'oly_ev\', \'' + e.key + '\'); App.render()">' + esc(e.short) + "</button>";
    }).join("") + "</div>";
    var mine = function (x) { return x.me || (me.sv && mv && mv.rank && x.rank === mv.rank); };
    var rows = list.map(function (x) { return olyRowHtml(x, olyFmt(x.score), x.key, x.rank <= 3, mine(x)); }).join("");
    if (mv && me.sv && mv.rank > list.length) rows += '<div class="oly-gap"></div>' + olyRowHtml({ rank: mv.rank, name: nick + " (나)" }, olyFmt(mv.best), "", false, true);
    h += '<section class="ax-card oly-card"><div class="ax-stack-tight"><h2 class="ax-section-title">' + esc(ev.name) + '</h2><p class="ax-description">' + esc(olyRuleLine(evk)) + "</p></div>" +
      '<div class="oly-list">' + (list.length ? rows : '<p class="ax-description">아직 기록이 없어요</p>') + "</div>" +
      (mv ? (olyEvPos(evk, mv) ? '<p class="oly-pos">' + segHtml(esc(olyEvPos(evk, mv))) + "</p>" : "")
        : '<p class="oly-pos">한 판 하면 순위에 올라가요</p><button type="button" class="ax-button" onclick="App.go(\'' + ev.view + '\')">' + esc(ev.name) + " 한 판</button>") + "</section>";
  } else {
    var ov = b.overall || [], isMe = function (x) { return x.me || (me.sv && me.rank && x.rank === me.rank); };
    var top = ov.slice(0, 3).map(function (x) { return Object.assign({}, x, { me: isMe(x) }); });
    var rest = ov.slice(3).map(function (x) { return olyRowHtml(x, olyFmt(x.total), "", false, isMe(x)); }).join("");
    if (me.sv && me.rank > ov.length) rest += '<div class="oly-gap"></div>' + olyRowHtml({ rank: me.rank, name: nick + " (나)" }, olyFmt(me.total), "", false, true);
    var op = olyOverallPos(me);
    h += '<section class="ax-card oly-card"><div class="ax-stack-tight"><h2 class="ax-section-title">종합 순위</h2><p class="ax-description">' + segHtml(olyOvEvents().length + "종목 최고점 합계" + (at ? " · " + at + " 기준" : "") + " · " + olyFmt(olyMax()) + "점 만점") + "</p></div>" +
      (ov.length ? olyPodiumHtml(top) + '<div class="oly-list">' + rest + "</div>" : '<p class="ax-description">아직 ' + (OVE.length === 3 ? "세" : "다섯") + " 종목을 모두 한 사람이 없어요</p>") +
      '<p class="oly-pos">' + (op ? segHtml(esc(op)) : me.done ? "내 총점 " + olyFmt(me.total) : "한 판 하면 순위에 올라가요") + "</p></section>";
  }
  return h + '</div>';   /* v6.27 바닥 문구(명예 순위 · 경품 없음 · 종합 호명) 삭제(사용자 261008 · 올림픽 시상 없음 261006) */
}
/* ── TV 순위판 (wall_type · 1920×1080) · ① 종합 포디움(1위 180px · 2·3위 140px) + 4~10위 ② 종목별 1~3위(96px) ── */
function olyTvPodium() {
  var ov = (OLY.board && OLY.board.overall) || [];
  var slot = function (x, r) {
    return '<div class="tvp r' + r + '">' + (x ? olyLw(r, r === 1 ? 180 : 140) + '<b>' + esc(x.name) + "</b><span>" + olyFmt(x.total) + "</span>" : '<b class="wait">도전을 기다려요</b>') + '<i>' + r + "</i></div>";
  };
  var rest = "";
  for (var i = 3; i < 10; i++) { var x = ov[i]; rest += '<div class="tytv-row"><span class="no">' + (i + 1) + '</span><span class="nm">' + (x ? esc(x.name) : '<span style="opacity:0.35">도전을 기다려요</span>') + '</span><span class="sc">' + (x ? olyFmt(x.total) : "") + "</span></div>"; }
  return '<div class="tvp-wrap"><div class="tvp-stage">' + slot(ov[1], 2) + slot(ov[0], 1) + slot(ov[2], 3) + '</div><div class="tytv-list tvp-rest">' + rest + "</div></div>";
}
function olyTvEvents() {
  var pe = (OLY.board && OLY.board.perEvent) || {}, ev = olyOvEvents();   /* v4.83 종목별 = 미니 게임 세 종목(퀴즈 순위 없음) */
  return '<div class="tve-grid' + (ev.length === 3 ? " n3" : "") + '">' + ev.map(function (e) {
    var l = pe[e.key] || [];
    return '<div class="tve"><p class="tve-h">' + esc(e.name) + "</p>" + [0, 1, 2].map(function (i) {
      var x = l[i];
      return '<div class="tve-row">' + (x ? olyLw(i + 1, 96) : '<span class="tve-no">' + (i + 1) + "</span>") + '<span class="nm">' + (x ? esc(x.name) + "<small>" + esc(x.key || "") + "</small>" : '<span style="opacity:0.35">도전을 기다려요</span>') + '</span><span class="sc">' + (x ? olyFmt(x.score) : "") + "</span></div>";
    }).join("") + "</div>";
  }).join("") + "</div>";
}

