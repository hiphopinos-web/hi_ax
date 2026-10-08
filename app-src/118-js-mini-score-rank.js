/* ════════════════ v4.02 AX 올림픽 점수 체계 v2 (사용자 확정 260919 · 설계 정본 「AX 올림픽 점수 체계 v2.md」) ════════════════
   종목 점수 = 게임 화면에 보이는 행동 점수 그대로 · 종목 최고 한 판 · 종목 상한 3,000 · 종합 = 다섯 종목 최고 점수의 합(만점 15,000 · v4.09 AI O/X 편입).
   AX 팡 = 80칸 완주 시간 환산(1000 × (기준 초 / 완주 초)^지수) · 점프 = 장애물 40 · 코인 5 · AI 상식 100 ·
   테트리스 = 블록 10(60개까지) · 줄 50(30줄까지, 그 뒤 10) · 동시 삭제 보너스 · 기억력 = 칸마다 속도 등급 · 오답 −50 · 무오답 라운드 +40.
   계수는 서버 설정 「올림픽_점수」가 정본 · oly_board 응답의 rule 을 받아 쓴다 · 받기 전에는 아래 OLY_RULE(서버 기본값과 같은 값 · 검사 60절이 대조).
   제출 = 구성 요소(parts) + 점수 · 서버가 같은 식으로 다시 계산해 다르면 거부(mismatch) · 옛 기록(g1·g2 · v4.12 전 O/X g3)은 집계 제외 · 제출 버전 g4(v4.12) · 로컬 최고는 oly2_best_<종목>.
   명예 순위만(경품 없음) · 부문 통계·부문 메달 없음 · 공개 순위는 닉네임 · 1~3위 표식 = 월계수(A안 · 48px 미만으로 쓰지 않는다). */
/* v4.96 (261001 사용자 확정) AX 퀴즈 = 판 퀴즈(quiz · quiz_play) · 정리 #10(261005) 유리다리 O/X(game_ox)는 지웠다 · false 는 옛 서버 갈래(B8 · 행사 뒤)만 남는다 */
var QUIZ_CARD = true;
var OLY_EVENTS = [
  { key: "pang", name: "AX 팡", short: "팡", view: "game_pang", best: "oly2_best_pang" },
  { key: "jump", name: "ME to WE 점프", short: "점프", view: "game_jump", best: "oly2_best_jump" },
  { key: "tetris", name: "테트리스", short: "테트리스", view: "game_tetris", best: "oly2_best_tetris" },
  { key: "word", name: "기억력 퀴즈", short: "기억력", view: "quiz", best: "oly2_best_word" },
  { key: "ox", name: "AX 퀴즈", short: "AX 퀴즈", view: "game_ox", best: "oly2_best_ox" }
];
/* v4.83 (261001 사용자 확정 · 앱 개편 1묶음) 미니 게임 = 팡 · 점프 · 테트리스 · 종합 = 세 종목 최고 한 판 합(만점 9,000) · 종합 자격 = 세 종목 모두 1판 이상
   AX 퀴즈 = O/X · 기억력 · 게임으로 묶지 않는다(사용자 수정 261001) · 순위 · 점수판에 넣지 않는다(내 최고 기록만) · 점수 식 · 서버 재계산은 그대로
   종합 종목은 서버가 알려 준다(oly_board oev · 새 서버) · 받은 순위판이 옛 서버 것이면 다섯 종목(옛 서버 숫자 그대로) · 아직 못 받았으면 지금 체계 판 */
/* v4.92 (261001 저녁 사용자 확정) AX 퀴즈 = O/X 한 판 · 정리 #1(261005) 기억력 퀴즈 게임은 지웠다(옛 기록 집계 · OLY_EVENTS.word 는 옛 서버 호환으로 남김)
   OLY_QUIZ_KEYS = 스탬프 판정 · 퀴즈 목록 · OLY_NOT_MINI = 미니 게임 · 순위에서 빼는 종목(기억력도 계속 뺀다) */
var OLY_MINI_KEYS = ["pang", "jump", "tetris"], OLY_QUIZ_KEYS = ["ox"], OLY_NOT_MINI = ["ox", "word"];
function olyIsQuiz(key) { return OLY_NOT_MINI.indexOf(key) >= 0; }
function olyAllKeys() { return OLY_EVENTS.map(function (e) { return e.key; }); }
function olyOvKeys(src) {
  var b = src || OLY.board;
  if (b && Array.isArray(b.oev) && b.oev.length) return b.oev;
  if (b && (b.overall || b.events)) return olyAllKeys();   /* 옛 서버 응답(oev 없음) */
  return stampV2() ? OLY_MINI_KEYS : olyAllKeys();
}
function olyOvEvents(src) { var k = olyOvKeys(src); return OLY_EVENTS.filter(function (e) { return k.indexOf(e.key) >= 0; }); }
function olyKeysEvents(keys) { return keys.map(function (k) { return olyEv(k); }); }
/* 이름 · 미니 게임 세 종목이면 「미니 게임」 · 옛 서버 다섯 종목이면 예전 이름 「AX 올림픽」 */
function olyOvName(src) { return olyOvKeys(src).length === OLY_MINI_KEYS.length ? "미니 게임" : "AX 올림픽"; }
function olyOvSum(src) { return olyOvKeys(src).length === OLY_MINI_KEYS.length ? "팡 · 점프 · 테트리스" : "다섯 종목"; }
/* 폴백 규칙 · 서버 OLY_RULE_DEFAULT 와 같은 값 (팡 base = 기준 초 · pow = 지수 · 260919 봇 재보정) */
var OLY_RULE = {
  rev: 1, cap: 3000,
  pang: { goal: 80, base: 27, pow: 0.87, pauseMax: 3 },
  jump: { obs: 40, coin: 5, fact: 100, pauseMax: 3 },
  tetris: { block: 10, blockMax: 60, line: 50, lineFull: 30, lineAfter: 10, multi: [0, 0, 20, 60, 120], pauseMax: 3 },
  word: { tiers: [[50, 200], [80, 130], [120, 90], [200, 60]], base: 30, clean: 40, wrong: 50 },
  /* v4.30 출제 비율 쉬움 6 · 보통 5 · 어려움 1(마지막 · 사용자 확정 260924) · 재보정 어려움 기본 50 → 55 · 오답·낙하 −80 → −120 (「올림픽 보정/ox_v430_sim.js」 · 다섯 종목 균형 유지)
     v4.14 유리다리 12줄(사용자 확정 260922 · 보정 「올림픽 보정/ox_bridge_sim.js」) · rowT = 줄 시간 첫 줄 → 마지막 줄(1/100초 · 두 번째 값이 속도 상한 · 평균 5초) · lead = 여유 줄(1/100줄) [시작, 떨어진 뒤·최소, 최대] */
  ox: { sec: 6000, per: [6, 5, 1], lives: 3, base: [40, 45, 55], pen: 120, hasty: 60, speed: 20, full: 100, limit: 400, combo: 6, comboMax: 5,
    feverAt: 5, feverLen: 3, feverMul: 2, goldMul: 3, bonusAt: 10, bonusSec: 300, pass: 1, lock: 30,
    rowT: [600, 400], lead: [130, 100, 150], arrive: 100, lifeBonus: 50, secBonus: 12, pauseMax: 3 }
};
/* v4.09 AI O/X 문제 은행 · v4.92 (261001 사용자 승인 · 앱 개편 4묶음) 정본 「QA/문제 은행 확정안 v1.json」 ox 95문제 = 1층 부스 F01~F82 + 기존 A 13 · 서버 OX_KEY 와 검사 68절이 대조
   id · c 분야(1 AI 기초·생성형 AI · 4 1층 부스) · lv 난이도 · q 문장 · a 정답 · e 해설 · g 짝 그룹(한 판에 하나) · z 1층 구역(틀린 문제 카드 「다시 볼 곳」 · OX_ZONE) ·
   h 힌트 코드(구역.줄.판 · 기억력 문제 은행 v3.json hint_codes · 판이 갈리거나 판 근거가 없으면 빈 값 · 지금 화면은 쓰지 않는다) ·
   rv 검수 통과(0 이면 문장 옆 「(예시)」 · 지금 은행은 모두 1) · 답이 틀린 문항은 서버 설정 OX_OFF 로 뺀다 · 옛 86문제에서 빠진 73개(A 31 · S 21 · R 21)는 서버 OX_KEY_OLD 가 옛 기록 채점에만 쓴다
   v4.98 (261002 사용자 결정 · 「QA/문제 은행 품질 감사 v1.md」 5-2 · 5-3) 95 → 49문제 · 49개 뺌(서버 OX_KEY_OLD 로 · 채점만) · 문구 7곳 고침(A30 문장 · 해설 6) · 새 F83 ~ F85(QZ_NEW · 서버 bank 2 이상일 때만 낸다)
   v5.00 (261002 사용자 요구 · 한 판 5문항) 49 → 29문제(쉬움 12 · 보통 12 · 어려움 5 · O 15 / X 14 · 1층 판 23 + AX 상식 6) · 뺀 20(A03 A10 A19 A27 F07 F11 F13 F15 F26 F29 F38 F43 F46 F47 F51 F54 F56 F67 F69 F80)은 서버 OX_KEY_OLD(채점만) · 정본 json _meta.ox_v3 */
var OX_BANK = [
  { id: "A02", c: 1, lv: 1, q: "AI가 자신 있게 말하면 사실이다", a: "X", e: "틀린 내용도 자신 있게 말할 수 있어 따로 확인한다.", g: "conf", rv: 1, h: "" },
  { id: "A05", c: 1, lv: 1, q: "읽을 사람을 알려 주면 답이 나아진다", a: "O", e: "누구에게 무엇을 위해 쓰는지 알면 맞춤 답을 준다.", g: "ctxq", rv: 1, h: "" },
  { id: "A26", c: 1, lv: 2, q: "역할을 정해 주면 답의 관점이 분명해진다", a: "O", e: "「인사 담당자로서」처럼 역할을 주면 관점이 맞춰진다.", g: "", rv: 1, h: "" },
  { id: "A28", c: 1, lv: 2, q: "AI가 알려 준 출처는 모두 실제로 있다", a: "X", e: "없는 논문이나 링크를 지어낼 때도 있어 확인한다.", g: "cite", rv: 1, h: "" },
  { id: "A29", c: 1, lv: 2, q: "AI가 요약하면 빠지는 내용이 없다", a: "X", e: "중요한 내용을 빼먹을 수 있어 원문과 대조한다.", g: "", rv: 1, h: "" },
  { id: "A30", c: 1, lv: 2, q: "근거 자료를 주면 엉뚱한 답이 줄어든다", a: "O", e: "「이 자료만 보고 답해 줘」처럼 범위를 정해 준다.", g: "", rv: 1, h: "" },
  { id: "F02", c: 4, lv: 1, q: "AX의 X는 Experience를 뜻한다", a: "X", e: "AX는 AI Transformation의 약자다.", g: "ax", rv: 1, z: "vision", h: "vision.metowe" },
  { id: "F10", c: 4, lv: 2, q: "목표를 정하고 결과를 판단하는 쪽은 AI다", a: "X", e: "목표를 정하고 결과를 판단하는 쪽은 사람이다.", g: "dbc", rv: 1, z: "vision", h: "vision.dbc" },
  { id: "F18", c: 4, lv: 3, q: "의료심사 Agent는 심사 정보 확인을 돕는다", a: "O", e: "진단서 등 의료 서류에서 심사 정보를 확인하게 돕는다.", g: "agt", rv: 1, z: "vision", h: "vision.2027" },
  { id: "F20", c: 4, lv: 3, q: "1인 1 AI Agent는 IT 부서만 만든다", a: "X", e: "각자 자기 업무에 필요한 Agent를 스스로 만든다.", g: "r28", rv: 1, z: "vision", h: "vision.2028" },
  { id: "F21", c: 4, lv: 3, q: "1인 1 Agent는 쌓인 데이터를 학습한다", a: "O", e: "2026~2027년 데이터를 학습해 업무를 잘 아는 AI가 된다.", g: "r28b", rv: 1, z: "vision", h: "vision.2028" },
  { id: "F22", c: 4, lv: 3, q: "지금의 DAP는 나만의 Agent의 첫걸음이다", a: "O", e: "지금 참여하는 DAP가 2028년 나만의 Agent로 이어진다.", g: "r28c", rv: 1, z: "vision", h: "vision.2028" },
  { id: "F28", c: 4, lv: 1, q: "DAP에 지원하려면 코딩을 할 줄 알아야 한다", a: "X", e: "코딩과 데이터를 몰라도 누구나 지원할 수 있다.", g: "dapc", rv: 1, z: "lab", h: "lab.idea" },
  { id: "F30", c: 4, lv: 1, q: "내 업무 고민도 DAP가 될 수 있다", a: "O", e: "반복 업무, 자료 찾기, 예측 같은 고민이 과제가 된다.", g: "dapm", rv: 1, z: "lab", h: "lab.idea" },
  { id: "F31", c: 4, lv: 1, q: "AX LAB QR로 아이디어 한 줄을 쓸 수 있다", a: "O", e: "QR을 찍어 한 줄을 쓰면 스탬프도 받는다.", g: "idea", rv: 1, z: "lab", h: "lab.idea" },
  { id: "F50", c: 4, lv: 1, q: "결과물은 「정리해줘」처럼 짧게 시키는 게 좋다", a: "X", e: "A4 1장, 존댓말처럼 형태를 구체적으로 알려 준다.", g: "tipf", rv: 1, z: "play", h: "play.hq.tips" },
  { id: "F52", c: 4, lv: 1, q: "HiDI-Q에는 문서를 5개까지 올릴 수 있다", a: "O", e: "최대 5개까지 올리고 그 내용으로 질문한다.", g: "hq5", rv: 1, z: "play", h: "play.hq.intro" },
  { id: "F55", c: 4, lv: 1, q: "문서는 아무거나 통째로 올리는 게 좋다", a: "X", e: "필요한 자료의 필요한 부분만 올린다.", g: "tipu", rv: 1, z: "play", h: "play.hq.tips" },
  { id: "F57", c: 4, lv: 1, q: "Hi-Helper는 설계를 1분 안에 추천한다", a: "O", e: "계약 빅데이터를 바탕으로 1분 안에 추천한다.", g: "hh1", rv: 1, z: "play", h: "play.hh.helper" },
  { id: "F64", c: 4, lv: 2, q: "HiDI-Q는 번역해도 원본 양식을 유지한다", a: "O", e: "양식 그대로 번역해 옮겨 적을 필요가 없다.", g: "hqt", rv: 1, z: "play", h: "play.hq.intro" },
  { id: "F65", c: 4, lv: 2, q: "HiDI-Q에는 암호화된 문서를 올릴 수 없다", a: "X", e: "암호화된 문서를 그대로 올리고 내려받을 수 있다.", g: "hqs", rv: 1, z: "play", h: "play.hq.intro" },
  { id: "F66", c: 4, lv: 2, q: "HiDI-Q로 보고서 초안을 받아 볼 수 있다", a: "O", e: "Word, Excel, PPT 기반 보고서 초안을 받는다.", g: "hqr", rv: 1, z: "play", h: "play.hq.intro" },
  { id: "F68", c: 4, lv: 2, q: "질문은 한꺼번에 여러 개 묻는 게 좋다", a: "X", e: "질문은 하나씩 나누어 한다.", g: "tipq", rv: 1, z: "play", h: "play.hq.tips" },
  { id: "F71", c: 4, lv: 2, q: "태아보험 설계는 출산예정일만 넣으면 된다", a: "O", e: "임신 주수별 필수 담보를 담아 설계한다.", g: "hhf", rv: 1, z: "play", h: "play.hh.intro" },
  { id: "F72", c: 4, lv: 3, q: "Hi-Helper는 신상품도 바로 추천에 반영한다", a: "X", e: "신상품과 신담보는 반영까지 시간이 걸린다.", g: "hhn", rv: 1, z: "play", h: "play.hh.check" },
  { id: "F74", c: 4, lv: 1, q: "AX 라운지는 업무 고민을 이야기하는 곳이다", a: "O", e: "바꾸고 싶은 업무와 반복되는 불편을 이야기한다.", g: "lg", rv: 1, z: "lounge", h: "lounge.intro" },
  { id: "F83", c: 4, lv: 1, q: "in Action 앱은 외부 업체가 만들어 줬다", a: "X", e: "현장 구성원이 AI와 데이터로 직접 만들었다.", g: "ia", rv: 1, z: "action", h: "action.intro" },
  { id: "F84", c: 4, lv: 2, q: "AI컨설팅 도우미는 판매 화법을 알려 준다", a: "O", e: "상품의 강점을 판매 화법으로 제공하는 앱이다.", g: "ap", rv: 1, z: "action", h: "action.consult" },
  { id: "F85", c: 4, lv: 2, q: "Hi-Helper는 추천 설계안을 하나만 준다", a: "X", e: "추천 설계안 TOP1~3을 비교해 볼 수 있다.", g: "hhr", rv: 1, z: "play", h: "play.hh.tips" }
];
var OX_KEY = {};   /* id: [난이도, 정답, 짝, 검수, 문장] · 서버 OX_KEY 와 같은 모양(채점 식을 글자 그대로 같게 쓰려고) */
OX_BANK.forEach(function (x) { OX_KEY[x.id] = [x.lv, x.a, x.g, x.rv, x.q]; });
function oxKey(id) { return OX_KEY[id]; }   /* v4.92 채점 식이 부르는 정답 찾기 · 앱은 지금 은행만 · 서버 oxKey_ 는 옛 id 표(OX_KEY_OLD)도 본다 */
var OLY_MEDAL = ["", "금메달", "은메달", "동메달"];
var OLY = { board: null, t: 0 };
function olyRule() {
  var r = OLY.board && OLY.board.rule;
  return r && r.cap > 0 && r.pang && r.jump && r.tetris && r.word && r.word.tiers && r.word.tiers.length === 4 && r.tetris.multi && r.tetris.multi.length === 5 &&
    r.ox && r.ox.sec > 0 && r.ox.base && r.ox.base.length === 3 && r.ox.per && r.ox.per.length === 3 && r.ox.lives > 0 && r.ox.rowT && r.ox.rowT.length === 2 && r.ox.lead && r.ox.lead.length === 3 ? r : OLY_RULE;
}
function olyCap() { return olyRule().cap; }
function olyMax(src) { return olyOvKeys(src).length * olyCap(); }   /* v4.83 미니 게임 3 × 3,000 = 9,000(옛 서버는 다섯 종목 15,000) */
function olyEv(key) { return OLY_EVENTS.filter(function (e) { return e.key === key; })[0]; }
function olyFmt(n) { return Math.round(Number(n) || 0).toLocaleString(); }
/* 점수 계산 · 서버 olyScore_ 와 글자 그대로 같은 식 (검사 60절이 같은 parts 로 대조) */
function olyScore(game, p, rule) {
  rule = rule || olyRule();
  var R = rule[game], n = function (k) { return Number(p && p[k]) || 0; }, s = 0, i;
  if (!R) return 0;
  if (game === "pang") {
    s = n("fin") > 0 ? Math.round(1000 * Math.pow(R.base * 100 / n("fin"), R.pow)) : 0;
  } else if (game === "jump") {
    s = n("obs") * R.obs + n("coin") * R.coin + n("fact") * R.fact;
  } else if (game === "tetris") {
    var ln = n("lines");
    s = Math.min(n("blk"), R.blockMax) * R.block + Math.min(ln, R.lineFull) * R.line + Math.max(0, ln - R.lineFull) * R.lineAfter +
      n("c2") * R.multi[2] + n("c3") * R.multi[3] + n("c4") * R.multi[4];
  } else if (game === "word") {
    for (i = 0; i < R.tiers.length; i++) s += n("j" + i) * R.tiers[i][1];
    s += n("j" + R.tiers.length) * R.base + n("cl") * R.clean - n("wr") * R.wrong;
  } else if (game === "ox") {
    s = qzIsCard(p && p.ql) ? qzTally(p.ql).pts : oxTally(p && p.ql, R, oxGold(p && p.tk)).pts;   /* v4.96 판 퀴즈(정답 × 100) · 유리다리 */
  }
  return Math.max(0, Math.min(rule.cap, s));
}
/* v4.12 AI O/X 유리다리 채점 · 서버 oxTally_ 와 글자 그대로 같은 식(검사 68·70절) · ql = 「id.답.시간」 · 답 O|X|P(판자)|T(발판이 아래 끝에 닿아 떨어짐) · 시간 1/100초 · gold = 황금 자리
   다리는 문제가 떠 있는 동안 흘러내린다 · 문제마다 한도 lim = ceil(여유 × 줄 시간 / 100) · 한도 안에 답한다 · T 는 한도에 정확히 · 답하면 한 줄 올라가 여유 +100
   정답 = (기본 + 속도 + 연속) × 배수(황금 > 피버 > 1) · 오답 −pen(hasty 미만이면 2배) · 떨어짐 −pen · 둘 다 목숨 −1 · 판자 0점(연속·피버 그대로) · 12줄(v4.14)을 건너면 도착 보너스
   시계 = 문제 시간 + 연출 시간(OX_STEP) · 끝 = life | arrive | time(연출 중 시간 끝) | ''(문제가 떠 있다) */
var OX_STEP = { hop: 50, plank: 80, fall: 170 };   /* 연출 시간(1/100초) · 한 줄 건너기 · 판자 · 떨어졌다 올라오기 · 서버 OX_STEP 과 같다 */
function oxRowT(R, i) { var N = R.per[0] + R.per[1] + R.per[2]; return Math.round(R.rowT[0] + (R.rowT[1] - R.rowT[0]) * Math.min(i, N - 1) / Math.max(1, N - 1)); }
function oxTally(ql, R, gold) {
  var T = { ok: true, items: [], n: 0, c1: 0, c2: 0, c3: 0, wr: 0, hs: 0, fl: 0, pa: 0, sp: 0, cb: 0, fb: 0, gb: 0, gc: 0, pn: 0, hp: 0, mx: 0, used: 0, life: R.lives, arr: 0, pts: 0,
    lead: R.lead[0], dl: R.sec, rt: 0, lim: 0, end: '' }, run = 0, fever = 0, N = R.per[0] + R.per[1] + R.per[2];
  var list = String(ql == null ? '' : ql) ? String(ql).split(',') : [];
  gold = gold || [];
  for (var i = 0; ; i++) {
    T.rt = oxRowT(R, i); T.lim = Math.ceil(T.lead * T.rt / 100);
    T.end = T.life <= 0 ? 'life' : T.n >= N ? 'arrive' : T.used >= T.dl ? 'time' : '';
    if (i >= list.length) break;
    var m = /^([ASRF]\d{2})\.([OXPT])\.(\d{1,5})$/.exec(list[i]), k = m && oxKey(m[1]), ans = m ? m[2] : '', t = m ? Number(m[3]) : 0;
    if (!k || T.end || (ans === 'T' ? t !== T.lim : t >= T.lim) || t >= T.dl - T.used) { T.ok = false; T.pts = 0; return T; }
    var lv = k[0], it = { id: m[1], lv: lv, a: k[1], g: k[2], ans: ans, t: t, lim: T.lim, right: ans === k[1], gold: gold.indexOf(i) >= 0, mul: 1, pts: 0 };
    T.n++;
    if (ans === 'P') T.pa++;
    else if (it.right) {
      var sp = Math.round(R.speed * Math.max(0, Math.min(1, (R.limit - t) / (R.limit - R.full)))), cb = R.combo * Math.min(run, R.comboMax), raw = R.base[lv - 1] + sp + cb;
      it.mul = it.gold ? R.goldMul : fever > 0 ? R.feverMul : 1; it.pts = raw * it.mul;
      T['c' + lv]++; T.sp += sp; T.cb += cb; T.pts += it.pts;
      if (it.gold) { T.gb += raw * (it.mul - 1); T.gc++; } else T.fb += raw * (it.mul - 1);
      if (fever > 0) fever--;
      run++;
      if (run > T.mx) T.mx = run;
      if (run % R.feverAt === 0) { fever = R.feverLen; it.fever = 1; }
      if (run % R.bonusAt === 0) { T.hp++; T.dl += R.bonusSec; it.bonus = 1; }
    } else {
      var pn = R.pen * (ans !== 'T' && t < R.hasty ? 2 : 1);
      it.pts = -pn; T.pn += pn; T.pts -= pn; T.life--;
      if (ans === 'T') T.fl++; else { T.wr++; if (t < R.hasty) T.hs++; }
      run = 0; fever = 0;
    }
    T.used += t + (ans === 'P' ? OX_STEP.plank : it.right ? OX_STEP.hop : OX_STEP.fall);
    T.lead = Math.min(R.lead[2], Math.max(R.lead[1], T.lead - Math.round(t * 100 / T.rt) + 100));
    T.items.push(it);
  }
  if (T.end === 'arrive') { T.arr = R.arrive + T.life * R.lifeBonus + Math.floor(Math.max(0, T.dl - T.used) / 100) * R.secBonus; T.pts += T.arr; }
  if (!T.n) T.ok = false;
  return T;
}
/* 황금 자리 · 서버 토큰 「발급시각36진.자리1.자리2.서명」 · 서버 oxGold_ 와 같다 · 토큰이 없으면 황금 없음 */
function oxGold(tk) {
  var m = /^[0-9a-z]{1,12}\.(\d{1,2})\.(\d{1,2})\.[0-9a-z]{1,20}$/.exec(String(tk == null ? '' : tk));
  return m ? [Number(m[1]), Number(m[2])] : [];
}
/* 규칙 한 줄 · 시작 화면·순위판 종목 탭 */
function olyRuleLine(key) {
  var R = olyRule()[key], cap = olyFmt(olyCap());
  if (key === "pang") return R.goal + "칸 완주가 빠를수록 점수 · " + R.base + "초 = 1,000점 · 종목 최대 " + cap;
  if (key === "jump") return "넘은 장애물 " + R.obs + " · 코인 " + R.coin + " · AX 상식 " + R.fact + " · 종목 최대 " + cap;
  if (key === "tetris") return "블록 " + R.block + "점(" + R.blockMax + "개까지) · 줄 " + R.line + "점 · 한 번에 여러 줄 보너스";   /* v4.28 「시간은 점수가 아니에요」 설명 문장은 결과 접힘의 참고 기록 표가 대신한다 */
  if (key === "word") return "빨리 맞힐수록 칸 점수가 커요 · 오답 −" + R.wrong + " · 오답 없는 라운드 +" + R.clean;
  if (key === "ox") return "정답 " + R.base[0] + "~" + R.base[2] + " · 빠르면 +" + R.speed + " · " + R.feverAt + "연속마다 피버 ×" + R.feverMul + " · 황금 발판 ×" + R.goldMul + " · 도착 +" + R.arrive + " · 오답·떨어짐 −" + R.pen;
  return "";
}
function olyPull(force) {   /* v4.16 관리자·테스트 계정이어도 순위판은 실서버 값(읽기 전용이라 안전) */
  if (!BE.on || (!force && Date.now() - OLY.t < 20000)) return;
  OLY.t = Date.now();
  var u = S.get("user", {}) || {};
  beCall({ action: "oly_board", emp: u.empId || "" }, function (r) {
    if (r && r.ok) { OLY.board = r; if (["exp", "quiz", "games", "oly_rank", "wall_type"].indexOf(App.current) >= 0) App.render(); }
  }, function () {});
}
/* 내 현황 · 종목 점수는 이 기기 최고와 서버 최고 중 큰 쪽(바로 보이게) · 순위·메달·위치는 서버 값(없으면 숨긴다) */
function olyMe() {
  var sv = (OLY.board && OLY.board.me) || null, me = { total: 0, done: 0, qdone: 0, ev: {}, rank: sv ? sv.rank : 0, up: sv ? sv.up : 0, podium: sv ? sv.podium : 0, lead: sv ? sv.lead : 0, sv: !!sv };
  var ovk = olyOvKeys();
  OLY_EVENTS.forEach(function (e) {
    var sve = sv && sv.ev && sv.ev[e.key], best = Math.max(Number(S.get(e.best, 0)) || 0, sve ? sve.best : 0), q = olyIsQuiz(e.key);
    if (best > 0 || sve || S.get("oly2_done_" + e.key, 0)) {
      /* v4.83 AX 퀴즈는 순위 · 메달을 보이지 않는다(옛 서버가 순위를 보내도) */
      me.ev[e.key] = { best: best, rank: sve && !q ? sve.rank : 0, medal: sve && !q ? sve.medal : 0, up: sve && !q ? sve.up : 0, podium: sve && !q ? sve.podium : 0, lead: sve && !q ? sve.lead : 0, sync: !!sve && sve.best === best };
      if (ovk.indexOf(e.key) >= 0) { me.total += best; me.done++; }
      if (q) me.qdone++;
    }
  });
  me.left = ovk.length - me.done;
  me.qleft = OLY_QUIZ_KEYS.length - me.qdone;
  return me;
}
/* 판이 끝나면 한 번 · parts = 종목별 구성 요소 · 점수는 여기서 계산해 함께 보낸다 · 이 기기 최고는 oly2_best_<종목> */
function olySubmit(key, parts) {
  var score = olyScore(key, parts), e = olyEv(key), prev = Number(S.get(e.best, 0)) || 0;
  if (score > prev) S.set(e.best, score);
  S.set("oly2_done_" + key, 1);   /* 0점 판도 한 판(종합 자격) */
  var svb = OLY.board && OLY.board.me && OLY.board.me.ev && OLY.board.me.ev[key] ? Number(OLY.board.me.ev[key].best) || 0 : 0;   /* v4.28 서버에 이미 있던 최고(다른 기기 기록 포함) · 결과 「신기록!」 은 이것까지 넘어야 */
  OLY.last = { key: key, score: score, best: score > Math.max(prev, svb), prev: Math.max(prev, svb) };
  var u = S.get("user", {}) || {};
  OLY.t = 0;
  if (!BE.on || !u.empId || testEmp()) { mgStampCheck(null); qzStampCheck(null); return score; }   /* v4.16 테스트 계정은 서버에 쓰지 않는다(dry) · 순위판(olyPull)은 항상 실서버 값 · v4.63 스탬프는 이 기기 종목 수로 */
  var body = {};
  Object.keys(parts).forEach(function (k) { body[k] = k === "ql" || k === "tk" ? String(parts[k] || "") : Math.max(0, Math.round(Number(parts[k]) || 0)); });   /* v4.09 O/X 문항 기록·토큰은 문자열 */
  var gid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);   /* v4.68 (QA 5) 판 번호 · 다시 보낼 때도 같은 값 · 새 서버는 같은 판을 한 줄만 쓴다(옛 서버는 읽지 않는다) */
  beCall({ action: "game_submit", emp: u.empId, name: u.name || "", game: key, v: "g5", parts: JSON.stringify(body), score: score, gid: gid }, function (r) {
    if (r && r.ok) { if (OLY.board) OLY.board.me = r.me; else OLY.board = { me: r.me }; olyResMeFill(key); mgStampCheck(r.p4 || null); qzStampCheck(r.qz || null); return; }   /* v4.63 세 번째 종목이면 서버가 적립해 알려 준다 · p4 가 없는 응답(새 규칙 전 서버)이면 이 기기 종목 수로 · v4.83 qz 도 같은 방식 */
    var why = r && r.reason;
    if (why === "ver") toast("앱이 새로 나왔어요 · 새로고침한 뒤 다시 해 주세요");
    else if (why === "mismatch") { toast("점수 규칙이 바뀌었어요 · 새로고침한 뒤 다시 해 주세요"); olyPull(true); }
    else if (why === "range" && key === "ox" && qzIsCard(body.ql)) { qzPendAdd(body, score, gid); toast("기록을 아직 보내지 못했어요 · 잠시 뒤 다시 보내요"); }   /* v4.96 옛 서버(판 퀴즈를 모름) · 이 기기에 두었다가 다시 */
    else if (why === "range") toast("이번 판은 순위에 올리지 않았어요");
    else if (beBusy(r)) olyPendAdd(key, body, score, gid);   /* v4.64 서버 붐빔 · 다음 동기화 때 다시 */
    olyResMeFill(key);
  }, function () { olyPendAdd(key, body, score, gid); olyResMeFill(key); });
  return score;
}
/* v4.64 (QA 1단계 260930) 판 기록을 서버에 못 보냈으면(연결 끊김 · 붐빔) 이 기기에 두었다가 다음 동기화 때 다시 보낸다.
   예전에는 그대로 사라져, 이 기기 종목 수(n / 3)는 올라가는데 서버는 몰라 스탬프(p4)가 나오지 않았다.
   사번에 묶는다(ownIs) · 1시간 · 20판까지 · 한 번에 한 판 · 서버가 받았든 거절했든(ver · mismatch · range) 한 번 답을 받으면 버린다(같은 판을 두 번 올리지 않게) */
var OLY_PEND_MAX = 3600000, OLY_PEND = { busy: false };
function olyPend() { var a = S.get("oly_pend", []); return Array.isArray(a) ? a.filter(function (x) { return ownIs(x) && Date.now() - (x.t || 0) < OLY_PEND_MAX; }) : []; }
function olyPendAdd(key, body, score, gid) { var a = olyPend(); if (a.length >= 20) a.shift(); a.push({ key: key, body: body, score: score, gid: gid || "", t: Date.now(), emp: ownEmp() }); S.set("oly_pend", a); }
function olyPendFlush() {
  qzPendFlush();   /* v4.96 판 퀴즈 판(옛 서버가 받지 않은 것) */
  var a = olyPend(), u = S.get("user", {}) || {};
  if (!a.length) { if ((S.get("oly_pend", []) || []).length) S.set("oly_pend", []); return; }
  if (OLY_PEND.busy || !BE.on || !u.empId || testEmp()) return;
  OLY_PEND.busy = true;
  var x = a[0];
  beCall({ action: "game_submit", emp: u.empId, name: u.name || "", game: x.key, v: "g5", parts: JSON.stringify(x.body), score: x.score, gid: x.gid || "" }, function (r) {
    OLY_PEND.busy = false;
    if (!r || beBusy(r)) return;
    S.set("oly_pend", olyPend().filter(function (y) { return !(y.t === x.t && y.key === x.key); }));
    if (r.ok) { if (OLY.board) OLY.board.me = r.me; else OLY.board = { me: r.me }; mgStampCheck(r.p4 || null); qzStampCheck(r.qz || null); }
    if (olyPend().length) setTimeout(olyPendFlush, 400);
  }, function () { OLY_PEND.busy = false; });
}
/* ── 월계수 표식 (A안 · 디자인 시안/포디움 표식/A_월계수 · 도트 잎 + ME to WE 심볼 + 순위 원) ──
   원본 SVG(각 150KB · 원 3,098개)를 같은 좌표의 선 끝 둥근 점 경로로 줄였다(모양·색 동일) · 숫자는 윤곽선(NotoSansKR 800) ·
   금·은·동 색은 원본 값 그대로(표식 색 · 앱 셸 색과 별개) · 최소 48px · 그보다 작은 자리에는 숫자 순위만 둔다. */
var LW_MIN = 48;
var LW_PAL = {"1": ["#8A6A26", "#C9A34E", "#E8D194", "#D8BC72", "#3F2E0C"], "2": ["#6C737A", "#A9AFB5", "#DADDE1", "#C0C5CA", "#24292E"], "3": ["#7A4D32", "#B27B57", "#D9AB8A", "#C5916F", "#3A2213"]};
var LW_BASE = '<path d="M72.64 171.18h0M67.46 169.08h0M62.44 166.64h0M57.61 163.84h0M52.98 160.72h0M48.58 157.28h0M44.43 153.55h0M40.55 149.53h0M36.96 145.25h0M33.68 140.74h0M30.72 136h0M28.1 131.07h0M25.83 125.97h0M23.92 120.72h0M22.38 115.35h0M21.22 109.89h0M20.44 104.36h0M20.05 98.79h0M20.05 93.21h0M20.44 87.64h0M21.22 82.11h0M22.38 76.65h0M23.92 71.28h0M25.83 66.03h0M28.1 60.93h0M30.72 56h0M33.68 51.26h0M36.96 46.75h0M40.55 42.47h0M44.43 38.45h0M127.36 171.18h0M132.54 169.08h0M137.56 166.64h0M142.39 163.84h0M147.02 160.72h0M151.42 157.28h0M155.57 153.55h0M159.45 149.53h0M163.04 145.25h0M166.32 140.74h0M169.28 136h0M171.9 131.07h0M174.17 125.97h0M176.08 120.72h0M177.62 115.35h0M178.78 109.89h0M179.56 104.36h0M179.95 98.79h0M179.95 93.21h0M179.56 87.64h0M178.78 82.11h0M177.62 76.65h0M176.08 71.28h0M174.17 66.03h0M171.9 60.93h0M169.28 56h0M166.32 51.26h0M163.04 46.75h0M159.45 42.47h0M155.57 38.45h0" style="stroke:var(--l0);stroke-width:2.56;stroke-linecap:round;fill:none"/><path d="M55.26 29.68h0M144.74 29.68h0" style="stroke:var(--l1);stroke-width:6.8;stroke-linecap:round;fill:none"/><path transform="translate(64.93 167.90) rotate(174.00)" d="M0 0Q12.50 -9.00 25.00 0Q12.50 9.00 0 0Z" style="fill:var(--l1)"/><path transform="translate(64.93 167.90) rotate(238.00)" d="M0 0Q9.75 -7.02 19.50 0Q9.75 7.02 0 0Z" style="fill:var(--l2)"/><path transform="translate(47.52 156.38) rotate(189.00)" d="M0 0Q11.71 -8.43 23.43 0Q11.71 8.43 0 0Z" style="fill:var(--l1)"/><path transform="translate(47.52 156.38) rotate(253.00)" d="M0 0Q9.14 -6.58 18.27 0Q9.14 6.58 0 0Z" style="fill:var(--l2)"/><path transform="translate(33.68 140.74) rotate(204.00)" d="M0 0Q10.93 -7.87 21.86 0Q10.93 7.87 0 0Z" style="fill:var(--l1)"/><path transform="translate(33.68 140.74) rotate(268.00)" d="M0 0Q8.52 -6.14 17.05 0Q8.52 6.14 0 0Z" style="fill:var(--l2)"/><path transform="translate(24.36 122.05) rotate(219.00)" d="M0 0Q10.14 -7.30 20.29 0Q10.14 7.30 0 0Z" style="fill:var(--l1)"/><path transform="translate(24.36 122.05) rotate(283.00)" d="M0 0Q7.91 -5.70 15.82 0Q7.91 5.70 0 0Z" style="fill:var(--l2)"/><path transform="translate(20.19 101.58) rotate(234.00)" d="M0 0Q9.36 -6.74 18.71 0Q9.36 6.74 0 0Z" style="fill:var(--l1)"/><path transform="translate(20.19 101.58) rotate(298.00)" d="M0 0Q7.30 -5.25 14.60 0Q7.30 5.25 0 0Z" style="fill:var(--l2)"/><path transform="translate(21.47 80.74) rotate(249.00)" d="M0 0Q8.57 -6.17 17.14 0Q8.57 6.17 0 0Z" style="fill:var(--l1)"/><path transform="translate(21.47 80.74) rotate(313.00)" d="M0 0Q6.69 -4.81 13.37 0Q6.69 4.81 0 0Z" style="fill:var(--l2)"/><path transform="translate(28.10 60.93) rotate(264.00)" d="M0 0Q7.79 -5.61 15.57 0Q7.79 5.61 0 0Z" style="fill:var(--l1)"/><path transform="translate(28.10 60.93) rotate(328.00)" d="M0 0Q6.07 -4.37 12.15 0Q6.07 4.37 0 0Z" style="fill:var(--l2)"/><path transform="translate(39.62 43.52) rotate(279.00)" d="M0 0Q7.00 -5.04 14.00 0Q7.00 5.04 0 0Z" style="fill:var(--l1)"/><path transform="translate(39.62 43.52) rotate(343.00)" d="M0 0Q5.46 -3.93 10.92 0Q5.46 3.93 0 0Z" style="fill:var(--l2)"/><path transform="translate(135.07 167.90) rotate(6.00)" d="M0 0Q12.50 -9.00 25.00 0Q12.50 9.00 0 0Z" style="fill:var(--l1)"/><path transform="translate(135.07 167.90) rotate(-58.00)" d="M0 0Q9.75 -7.02 19.50 0Q9.75 7.02 0 0Z" style="fill:var(--l2)"/><path transform="translate(152.48 156.38) rotate(-9.00)" d="M0 0Q11.71 -8.43 23.43 0Q11.71 8.43 0 0Z" style="fill:var(--l1)"/><path transform="translate(152.48 156.38) rotate(-73.00)" d="M0 0Q9.14 -6.58 18.27 0Q9.14 6.58 0 0Z" style="fill:var(--l2)"/><path transform="translate(166.32 140.74) rotate(-24.00)" d="M0 0Q10.93 -7.87 21.86 0Q10.93 7.87 0 0Z" style="fill:var(--l1)"/><path transform="translate(166.32 140.74) rotate(-88.00)" d="M0 0Q8.52 -6.14 17.05 0Q8.52 6.14 0 0Z" style="fill:var(--l2)"/><path transform="translate(175.64 122.05) rotate(-39.00)" d="M0 0Q10.14 -7.30 20.29 0Q10.14 7.30 0 0Z" style="fill:var(--l1)"/><path transform="translate(175.64 122.05) rotate(-103.00)" d="M0 0Q7.91 -5.70 15.82 0Q7.91 5.70 0 0Z" style="fill:var(--l2)"/><path transform="translate(179.81 101.58) rotate(-54.00)" d="M0 0Q9.36 -6.74 18.71 0Q9.36 6.74 0 0Z" style="fill:var(--l1)"/><path transform="translate(179.81 101.58) rotate(-118.00)" d="M0 0Q7.30 -5.25 14.60 0Q7.30 5.25 0 0Z" style="fill:var(--l2)"/><path transform="translate(178.53 80.74) rotate(-69.00)" d="M0 0Q8.57 -6.17 17.14 0Q8.57 6.17 0 0Z" style="fill:var(--l1)"/><path transform="translate(178.53 80.74) rotate(-133.00)" d="M0 0Q6.69 -4.81 13.37 0Q6.69 4.81 0 0Z" style="fill:var(--l2)"/><path transform="translate(171.90 60.93) rotate(-84.00)" d="M0 0Q7.79 -5.61 15.57 0Q7.79 5.61 0 0Z" style="fill:var(--l1)"/><path transform="translate(171.90 60.93) rotate(-148.00)" d="M0 0Q6.07 -4.37 12.15 0Q6.07 4.37 0 0Z" style="fill:var(--l2)"/><path transform="translate(160.38 43.52) rotate(-99.00)" d="M0 0Q7.00 -5.04 14.00 0Q7.00 5.04 0 0Z" style="fill:var(--l1)"/><path transform="translate(160.38 43.52) rotate(-163.00)" d="M0 0Q5.46 -3.93 10.92 0Q5.46 3.93 0 0Z" style="fill:var(--l2)"/><g transform="translate(41.200 29.200) scale(0.10889)"><path d="M277.9 104.1h0m17.8 0h0m17.8 0h0m17.8 0h0m-89 124.5h0m0 17.8h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -106.7h0m0 17.8h0m0 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.7 0h0m142.4 -106.7h0m-35.6 35.6h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-53.4 17.7h0m0 17.8h0m-35.6 35.6h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-302.5 17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -124.6h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-89 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m53.4 -160.2h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.7 -53.4h0m0 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.1 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.7 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m35.6 -106.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-89 17.8h0m35.6 0h0m0 17.8h0m0 17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m0 17.7h0m0 17.8h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -320.2h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m35.6 0.7h0m-35.6 17.1h0m0 17.8h0m35.6 -17.1h0m0 17.8h0m35.5 -89h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -35.6h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-88.9 17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m-35.5 17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -106.8h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m17.8 0h0m17.8 0h0m0 17.8h0m-35.6 35.6h0m17.8 0h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -89h0m0 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-320.3 17.1h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m35.6 0.7h0m0 17.8h0m0 17.7h0m0 17.8h0m-71.2 17.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m71.2 -106.1h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m-35.5 17.7h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 0h0m-71.1 17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m0 17.8h0m17.8 -35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-177.9 17.2h0m0 17.8h0m0 17.7h0m0 17.8h0m63.1 -48.2h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m17.8 0h0m0 17.8h0m17.8 -124.6h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m39.6 -9.4h0m21.8 -262h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m17.8 -35.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.7h0m17.8 0h0m-71.2 35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -124.5h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.7h0m17.8 0h0m17.8 0h0m-35.6 53.4h0m0 17.8h0m-75.3 119.7h0m17.8 0h0m-35.5 17.8h0m0 17.8h0m17.7 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-713.2 142.9h0m17.8 0h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-71.2 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m0 17.8h0m17.8 -71.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.7 0h0m-53.3 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.7 -53.4h0m0 17.8h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m35.6 -177.9h0m-17.8 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -35.5h0m17.8 0h0m17.8 0h0m-35.6 17.7h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m89 -53.3h0m0 17.8h0m0 17.7h0m0 17.8h0m-178 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m35.6 -124.6h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m35.6 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-89 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-266.9 17.8h0m17.8 0h0m0 17.8h0m0 17.8h0m17.7 -35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m0 17.8h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m71.2 -106.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.7 -320.2h0m17.8 0h0m17.8 0h0m50.9 -44.6h0m0 17.8h0m0 17.8h0m-86.5 26.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.9h0m0 17.8h0m0 17.8h0m0 17.8h0m50.9 -115.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m39.6 -27.2h0m0 17.8h0m-39.6 27.2h0m0 17.8h0m39.6 -27.2h0m-75.2 45h0m17.8 0h0m17.8 0h0m-139.9 62.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m54.4 -14.2h0m0 17.8h0m35.6 -71.2h0m17.8 0h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m18.3 -271.1h0m0 17.8h0m17.7 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.5 17.8h0m0 17.7h0m17.7 -17.7h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m53.4 -53.3h0m-35.6 53.3h0m35.6 -17.7h0m-17.8 17.7h0m17.8 0h0m-88.9 17.8h0m17.7 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -88.9h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.7h0m17.8 -17.7h0m0 17.7h0m17.8 -53.3h0m0 17.8h0m0 17.8h0m0 17.7h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m-142.8 111h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-88.9 17.8h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m-35.5 35.6h0m53.3 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -71.2h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-339.1 14.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m54.4 -49.8h0m0 17.8h0m0 17.8h0m0 17.7h0m-72.2 14.2h0m17.8 0h0m54.4 3.6h0m17.8 -71.1h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m17.8 -17.7h0m0 17.7h0m17.8 -53.3h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m17.8 -17.7h0m-89 35.5h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -142.3h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m-35.5 17.8h0m17.8 0h0m17.7 0h0m0 17.7h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.7h0m17.8 -17.7h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m-88.9 35.6h0m17.8 0h0m17.7 0h0m-35.5 17.8h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -35.6h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.7h0m17.8 -17.7h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m-35.6 71.2h0m-106.7 17.8h0m17.8 0h0m17.7 0h0m17.8 0h0m17.8 0h0m17.8 0h0" style="stroke:var(--l1);stroke-width:28.17;stroke-linecap:round;fill:none"/><path d="M277.9 104.1h0m17.8 0h0m17.8 0h0m17.8 0h0m-89 124.5h0m0 17.8h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -106.7h0m0 17.8h0m0 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.7 0h0m142.4 -106.7h0m-35.6 35.6h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-53.4 17.7h0m0 17.8h0m-35.6 35.6h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-302.5 17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -124.6h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-89 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m53.4 -160.2h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.7 -53.4h0m0 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.1 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.7 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m35.6 -106.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-89 17.8h0m35.6 0h0m0 17.8h0m0 17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m0 17.7h0m0 17.8h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -320.2h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m35.6 0.7h0m-35.6 17.1h0m0 17.8h0m35.6 -17.1h0m0 17.8h0m35.5 -89h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -35.6h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-88.9 17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m-35.5 17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -106.8h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m17.8 0h0m17.8 0h0m0 17.8h0m-35.6 35.6h0m17.8 0h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -89h0m0 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-320.3 17.1h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m35.6 0.7h0m0 17.8h0m0 17.7h0m0 17.8h0m-71.2 17.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m71.2 -106.1h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m-35.5 17.7h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 0h0m-71.1 17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m0 17.8h0m17.8 -35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-177.9 17.2h0m0 17.8h0m0 17.7h0m0 17.8h0m63.1 -48.2h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m17.8 0h0m0 17.8h0m17.8 -124.6h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m39.6 -9.4h0m21.8 -262h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m17.8 -35.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.7h0m17.8 0h0m-71.2 35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -124.5h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.7h0m17.8 0h0m17.8 0h0m-35.6 53.4h0m0 17.8h0m-75.3 119.7h0m17.8 0h0m-35.5 17.8h0m0 17.8h0m17.7 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-713.2 142.9h0m17.8 0h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-71.2 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m0 17.8h0m17.8 -71.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.7 0h0m-53.3 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.7 -53.4h0m0 17.8h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m35.6 -177.9h0m-17.8 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -35.5h0m17.8 0h0m17.8 0h0m-35.6 17.7h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m89 -53.3h0m0 17.8h0m0 17.7h0m0 17.8h0m-178 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m35.6 -124.6h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m35.6 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-89 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-266.9 17.8h0m17.8 0h0m0 17.8h0m0 17.8h0m17.7 -35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m0 17.8h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m71.2 -106.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.7 -320.2h0m17.8 0h0m17.8 0h0m50.9 -44.6h0m0 17.8h0m0 17.8h0m-86.5 26.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.9h0m0 17.8h0m0 17.8h0m0 17.8h0m50.9 -115.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m39.6 -27.2h0m0 17.8h0m-39.6 27.2h0m0 17.8h0m39.6 -27.2h0m-75.2 45h0m17.8 0h0m17.8 0h0m-139.9 62.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m54.4 -14.2h0m0 17.8h0m35.6 -71.2h0m17.8 0h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m18.3 -271.1h0m0 17.8h0m17.7 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.5 17.8h0m0 17.7h0m17.7 -17.7h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m53.4 -53.3h0m-35.6 53.3h0m35.6 -17.7h0m-17.8 17.7h0m17.8 0h0m-88.9 17.8h0m17.7 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -88.9h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.7h0m17.8 -17.7h0m0 17.7h0m17.8 -53.3h0m0 17.8h0m0 17.8h0m0 17.7h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m-142.8 111h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-88.9 17.8h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m-35.5 35.6h0m53.3 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -71.2h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-339.1 14.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m54.4 -49.8h0m0 17.8h0m0 17.8h0m0 17.7h0m-72.2 14.2h0m17.8 0h0m54.4 3.6h0m17.8 -71.1h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m17.8 -17.7h0m0 17.7h0m17.8 -53.3h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m17.8 -17.7h0m-89 35.5h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -142.3h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m-35.5 17.8h0m17.8 0h0m17.7 0h0m0 17.7h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.7h0m17.8 -17.7h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m-88.9 35.6h0m17.8 0h0m17.7 0h0m-35.5 17.8h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -35.6h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.7h0m17.8 -17.7h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m-35.6 71.2h0m-106.7 17.8h0m17.8 0h0m17.7 0h0m17.8 0h0m17.8 0h0m17.8 0h0" style="stroke:var(--l3);stroke-width:13.34;stroke-linecap:round;fill:none"/><g style="stroke:#fff;stroke-opacity:.35;stroke-linecap:round;fill:none"><path d="M682.6 744.6h0" style="stroke-width:0.09"/><path d="M682.6 886.9h0" style="stroke-width:0.43"/><path d="M539.3 687.6h0" style="stroke-width:0.52"/><path d="M607.9 500.7h0" style="stroke-width:0.93"/><path d="M718.2 940.3h0" style="stroke-width:0.99"/><path d="M661.3 625.3h0" style="stroke-width:1.67"/><path d="M793.9 353.8h0" style="stroke-width:1.98"/><path d="M687.1 336h0" style="stroke-width:2.05"/><path d="M580.4 353.2h0" style="stroke-width:2.4"/><path d="M100 176h0" style="stroke-width:32"/><path d="M776.1 389.4h0" style="stroke-width:4.07"/><path d="M521.5 687.6h0" style="stroke-width:4.93"/><path d="M219 705.4h0" style="stroke-width:5.25"/><path d="M580.4 193h0" style="stroke-width:5.62"/><path d="M580.4 335.4h0" style="stroke-width:5.78"/><path d="M277.9 104.1h0m17.8 0h0m17.8 0h0m17.8 0h0m-89 124.5h0m0 17.8h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m17.8 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m53.4 -88.9h0m0 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.7 0h0m142.4 -106.7h0m-35.6 35.6h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-53.4 17.7h0m0 17.8h0m-35.6 35.6h0m17.8 -17.8h0m0 17.8h0m35.6 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-302.5 17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -124.6h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 35.6h0m17.8 0h0m-89 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m53.4 -160.2h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.7 -53.4h0m0 17.8h0m0 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.1 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.7 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m35.6 -106.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 0h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-89 17.8h0m35.6 0h0m0 17.8h0m0 17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 17.8h0m-17.8 17.8h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m0 17.7h0m0 17.8h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -320.2h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-35.6 35.5h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m35.6 0.7h0m-35.6 17.1h0m0 17.8h0m35.6 -17.1h0m0 17.8h0m35.5 -89h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -35.6h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-88.9 35.6h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m-35.5 17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -106.8h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m17.8 0h0m17.8 0h0m0 17.8h0m-35.6 35.6h0m17.8 0h0m17.8 0h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-320.3 17.1h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m35.6 0.7h0m0 17.8h0m0 17.7h0m0 17.8h0m-71.2 17.2h0m0 17.8h0m0 35.6h0m17.8 -17.8h0m71.2 -106.1h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m-35.5 17.7h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 0h0m-71.1 17.8h0m0 17.8h0m35.5 17.8h0m17.8 -35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-177.9 17.2h0m0 17.8h0m0 17.7h0m0 17.8h0m63.1 -48.2h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m-17.8 17.8h0m35.6 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m17.8 0h0m0 17.8h0m17.8 -124.6h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m17.8 0h0m-53.4 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m35.6 -35.6h0m-17.8 17.8h0m0 17.8h0m39.6 -9.4h0m21.8 -262h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m17.8 -35.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.7h0m17.8 0h0m-71.2 35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 35.6h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -124.5h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.7h0m17.8 0h0m17.8 0h0m-35.6 53.4h0m0 17.8h0m-75.3 119.7h0m17.8 0h0m-35.5 17.8h0m17.7 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m17.8 0h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-713.2 142.9h0m17.8 0h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-53.4 17.8h0m17.8 0h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m0 17.8h0m17.8 -71.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.7 0h0m-53.3 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 35.6h0m17.8 0h0m17.7 -53.4h0m0 17.8h0m17.8 0h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m35.6 -177.9h0m-17.8 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -35.5h0m17.8 0h0m17.8 0h0m-35.6 17.7h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m106.8 -17.7h0m0 17.7h0m0 17.8h0m-178 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m35.6 -124.6h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m35.6 -35.6h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-89 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-249.1 17.8h0m17.8 0h0m0 17.8h0m0 17.8h0m17.7 -35.6h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m0 17.8h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-17.8 17.8h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -35.6h0m0 17.8h0m0 17.8h0m71.2 -106.7h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m0 17.8h0m0 17.8h0m35.6 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.7h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.7 -320.2h0m17.8 0h0m17.8 0h0m50.9 -44.6h0m0 17.8h0m0 17.8h0m-86.5 26.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-35.6 35.5h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -53.9h0m0 17.8h0m0 17.8h0m0 17.8h0m50.9 -115.2h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m0 17.8h0m39.6 -27.2h0m0 17.8h0m-39.6 27.2h0m0 17.8h0m39.6 -27.2h0m-57.4 45h0m-122.1 62.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m54.4 -14.2h0m0 17.8h0m35.6 -71.2h0m35.6 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-71.2 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m36.1 -271.1h0m0 17.8h0m17.7 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.5 17.8h0m0 17.7h0m17.7 -17.7h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m53.4 -53.3h0m-35.6 53.3h0m35.6 -17.7h0m-17.8 17.7h0m17.8 0h0m-88.9 17.8h0m17.7 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m35.6 -88.9h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.7h0m17.8 -17.7h0m0 17.7h0m17.8 -53.3h0m0 17.8h0m0 17.8h0m0 17.7h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m-142.8 111h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-88.9 35.6h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m-35.5 35.6h0m53.3 -53.4h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m17.8 0h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -71.2h0m0 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m-321.3 32h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m0 17.8h0m17.8 -17.8h0m0 17.8h0m54.4 -49.8h0m0 17.8h0m0 17.8h0m0 17.7h0m-72.2 14.2h0m17.8 0h0m54.4 3.6h0m17.8 -71.1h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m35.6 -53.3h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 0h0m-17.8 17.7h0m17.8 0h0m17.8 -17.7h0m-89 35.5h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m0 17.8h0m17.8 -53.4h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -17.8h0m0 17.8h0m-35.6 17.8h0m17.8 17.8h0m17.8 -17.8h0m0 17.8h0m-17.8 17.8h0m17.8 0h0m17.8 -142.3h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m-35.5 17.8h0m17.8 0h0m17.7 0h0m0 17.7h0m17.8 -53.3h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.7h0m17.8 -17.7h0m17.8 0h0m-71.1 53.3h0m17.7 0h0m-35.5 17.8h0m0 17.8h0m17.8 -17.8h0m17.7 0h0m-17.7 17.8h0m17.7 0h0m17.8 -35.6h0m17.8 -17.8h0m0 17.8h0m17.8 0h0m-35.6 17.8h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m17.8 -124.5h0m0 17.8h0m17.8 -17.8h0m17.8 0h0m-17.8 17.8h0m17.8 0h0m-35.6 35.5h0m35.6 -17.7h0m-17.8 17.7h0m17.8 0h0m-35.6 71.2h0m-106.7 17.8h0m17.8 0h0m17.7 0h0m17.8 0h0m17.8 0h0m17.8 0h0" style="stroke-width:5.93"/></g></g><circle cx="100" cy="176" r="16" style="fill:var(--l1)"/>';
var LW_DIG = {"1": "M94.95 184.5V181.47H98.61V171.23H95.48V168.91Q96.81 168.67 97.77 168.31Q98.72 167.96 99.58 167.41H102.34V181.47H105.48V184.5Z", "2": "M94.09 184.5V182.35Q96.32 180.33 97.95 178.61Q99.57 176.89 100.46 175.4Q101.34 173.9 101.34 172.62Q101.34 171.81 101.06 171.23Q100.79 170.65 100.25 170.35Q99.71 170.04 98.95 170.04Q98.05 170.04 97.32 170.55Q96.58 171.05 95.95 171.75L93.9 169.73Q95.12 168.41 96.4 167.76Q97.67 167.11 99.45 167.11Q101.08 167.11 102.32 167.77Q103.55 168.43 104.25 169.62Q104.94 170.81 104.94 172.42Q104.94 173.93 104.18 175.49Q103.41 177.06 102.18 178.59Q100.95 180.13 99.52 181.56Q100.17 181.48 100.95 181.41Q101.73 181.35 102.32 181.35H105.73V184.5Z", "3": "M99.46 184.82Q98.11 184.82 97.04 184.52Q95.96 184.21 95.13 183.67Q94.29 183.13 93.69 182.44L95.42 180.08Q96.2 180.8 97.11 181.3Q98.03 181.79 99.1 181.79Q99.94 181.79 100.56 181.54Q101.18 181.29 101.52 180.81Q101.87 180.32 101.87 179.62Q101.87 178.83 101.49 178.26Q101.12 177.69 100.14 177.39Q99.16 177.09 97.34 177.09V174.42Q98.86 174.42 99.72 174.12Q100.58 173.82 100.95 173.27Q101.33 172.72 101.33 172.01Q101.33 171.08 100.77 170.56Q100.22 170.04 99.21 170.04Q98.33 170.04 97.59 170.43Q96.84 170.81 96.07 171.51L94.17 169.21Q95.33 168.22 96.6 167.67Q97.87 167.11 99.38 167.11Q101.08 167.11 102.37 167.65Q103.65 168.18 104.36 169.21Q105.07 170.23 105.07 171.74Q105.07 173.05 104.35 174.04Q103.64 175.02 102.29 175.56V175.68Q103.24 175.94 104 176.51Q104.75 177.07 105.19 177.91Q105.63 178.75 105.63 179.86Q105.63 181.43 104.78 182.54Q103.93 183.65 102.53 184.23Q101.13 184.82 99.46 184.82Z"};
function olyLwInit() {
  if (el("lwSprite")) return;
  var d = document.createElement("div");
  d.id = "lwSprite";
  d.setAttribute("aria-hidden", "true");
  d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><defs><symbol id="lwB" viewBox="0 0 200 200">' + LW_BASE + "</symbol>" +
    [1, 2, 3].map(function (n) { return '<symbol id="lwN' + n + '" viewBox="0 0 200 200"><path d="' + LW_DIG[n] + '" style="fill:var(--l4)"/></symbol>'; }).join("") + "</defs></svg>";
  document.body.appendChild(d);
}
/* rank 1~3 · size px (48 미만이면 빈 문자열 → 부르는 쪽이 숫자 순위를 둔다) */
function olyLw(rank, size) {
  if (!(rank >= 1 && rank <= 3) || !(size >= LW_MIN)) return "";
  olyLwInit();
  var c = LW_PAL[rank];
  return '<svg class="lw" width="' + size + '" height="' + size + '" viewBox="0 0 200 200" role="img" aria-label="' + OLY_MEDAL[rank] + '" style="--l0:' + c[0] + ";--l1:" + c[1] + ";--l2:" + c[2] + ";--l3:" + c[3] + ";--l4:" + c[4] + '">' +
    '<use href="#lwB"/><use href="#lwN' + rank + '"/></svg>';
}
/* ── 내 위치 줄 (§7.4) · 서버 up·podium·lead(동점 규칙 반영) · 서버 값이 없으면 빈 문자열(추정치를 보여 주지 않는다) ── */
function olyPosText(p) {
  if (!p || !p.rank) return "";
  if (p.rank === 1) return p.lead > 0 ? "2위와 " + olyFmt(p.lead) + "점 차" : "";
  if (p.rank === 2) return "금메달까지 " + olyFmt(p.up) + "점";
  if (p.rank === 3) return "은메달까지 " + olyFmt(p.up) + "점";
  return "동메달까지 " + olyFmt(p.podium) + "점";
}
/* 종목 한 줄 · 「테트리스 5위 · 동메달까지 320점」 · 만점이면 「만점 3,000 · 먼저 달성한 순서로 2위」 */
function olyEvPos(key, v) {
  if (!v || !v.rank || !olyMe().sv) return "";
  if (v.best >= olyCap() && v.rank > 1) return "만점 " + olyFmt(olyCap()) + " · 먼저 달성한 순서로 " + v.rank + "위";
  var t = olyPosText(v);
  return olyEv(key).short + " " + v.rank + "위" + (t ? " · " + t : "");
}
/* 종합 한 줄 · 「종합 12위 · 동메달까지 1,150점」 · 자격 전이면 「종합 순위까지 2종목 · 테트리스 · 기억력」 */
function olyOverallPos(me) {
  if (me.left) return "남은 종목 · " + olyOvEvents().filter(function (e) { return !me.ev[e.key]; }).map(function (e) { return e.short; }).join(" · ");
  if (testEmp()) return "내 기록 · 테스트라 순위에 들어가지 않아요";   /* v4.16 테스트 계정은 서버에 쓰지 않아 순위 계산이 안 된다(가짜 순위 대신 안내) */
  if (!me.sv || !me.rank) return "";
  var t = olyPosText(me);
  return "종합 " + me.rank + "위" + (t ? " · " + t : "");
}
/* ── 결과 화면 구성 표 (§7.2) · 종목마다 행만 바뀐다 · 0개인 행은 접는다 ── */
function olyRowsFor(key, p) {
  var R = olyRule()[key], rows = [], n = function (k) { return Number(p[k]) || 0; };
  var add = function (label, cnt, detail, pts, note) { rows.push({ l: label, c: cnt, d: detail, v: pts, note: note || "" }); };
  if (key === "pang") {
    add("완주 시간", 1, (n("fin") / 100).toFixed(1) + "초", olyScore("pang", p), R.base + "초 = 1,000점");
  } else if (key === "jump") {
    add("넘은 장애물", n("obs"), n("obs") + "개 × " + R.obs, n("obs") * R.obs);
    add("코인", n("coin"), n("coin") + "개 × " + R.coin, n("coin") * R.coin, "높은 코인은 2개");
    add("AX 상식", n("fact"), n("fact") + "개 × " + R.fact, n("fact") * R.fact);
  } else if (key === "tetris") {
    var b = Math.min(n("blk"), R.blockMax), ln = n("lines"), l1 = Math.min(ln, R.lineFull), l2 = Math.max(0, ln - R.lineFull);
    add("놓은 블록", b, b + "개 × " + R.block, b * R.block, R.blockMax + "개까지");
    add("지운 줄", l1, l1 + "줄 × " + R.line, l1 * R.line);
    add((R.lineFull + 1) + "번째 줄부터", l2, l2 + "줄 × " + R.lineAfter, l2 * R.lineAfter);
    [2, 3, 4].forEach(function (k) { add(k + "줄 한 번에", n("c" + k), n("c" + k) + "번 × " + R.multi[k], n("c" + k) * R.multi[k]); });
  } else if (key === "word") {
    ["번개", "빠름", "좋음", "보통"].forEach(function (nm, i) { var t = R.tiers[i]; add(nm, n("j" + i), n("j" + i) + "칸 × " + t[1], n("j" + i) * t[1], t[0] / 100 + "초 안"); });
    add("느림", n("j4"), n("j4") + "칸 × " + R.base, n("j4") * R.base);
    add("틀린 뒤 맞힌 칸", n("jx"), n("jx") + "칸 × 0", 0);
    add("오답 없는 라운드", n("cl"), n("cl") + "번 × " + R.clean, n("cl") * R.clean);
    add("오답", n("wr"), n("wr") + "번 × −" + R.wrong, -n("wr") * R.wrong);
  } else if (key === "ox") {
    [1, 2, 3].forEach(function (d) { add(d + "단계 정답", n("c" + d), n("c" + d) + "개 × " + R.base[d - 1], n("c" + d) * R.base[d - 1]); });
    add("빠른 답", n("sp"), "1초 안 +" + R.speed, n("sp"));
    add("연속 정답", n("cb"), "최대 +" + R.combo * R.comboMax, n("cb"));
    add("피버 ×" + R.feverMul, n("fb"), R.feverAt + "연속마다 " + R.feverLen + "문제", n("fb"));
    add("황금 발판 ×" + R.goldMul, n("gc"), n("gc") + "개", n("gb"));
    add("도착 보너스", n("arr") ? 1 : 0, "목숨 " + n("life") + " · 남은 시간", n("arr"), R.arrive + " + 목숨 × " + R.lifeBonus + " + 남은 초 × " + R.secBonus);
    add("오답", n("wr"), n("wr") + "번", -(n("pn") - n("fl") * R.pen), n("hs") ? (R.hasty / 100) + "초 안 오답 " + n("hs") + "번은 2배" : "");
    add("늦어서 떨어짐", n("fl"), n("fl") + "번 × −" + R.pen, -n("fl") * R.pen);
  }
  return rows.filter(function (r) { return r.c > 0; });
}
function olyBreakHtml(key, p, score) {
  var raw = key === "word" ? olyScoreRaw(p) : key === "ox" ? oxTally(p.ql, olyRule().ox, oxGold(p.tk)).pts : 0;
  return '<table class="oly-brk">' + olyRowsFor(key, p).map(function (r) {
    return "<tr><th>" + esc(r.l) + (r.note ? "<small>" + esc(r.note) + "</small>" : "") + "</th><td>" + esc(r.d) + '</td><td class="n">' + (r.v < 0 ? "−" + olyFmt(-r.v) : olyFmt(r.v)) + "</td></tr>";
  }).join("") +
    '<tr class="sum"><th>합계</th><td>' + (raw < 0 ? "최저 0 · " : "") + "종목 최대 " + olyFmt(olyCap()) + '</td><td class="n">' + olyFmt(score) + "</td></tr></table>";   /* v4.28 설명 문장 대신 짧은 값 */
}
function olyScoreRaw(p) { var R = olyRule().word, s = 0; R.tiers.forEach(function (t, i) { s += (Number(p["j" + i]) || 0) * t[1]; }); return s + (Number(p.j4) || 0) * R.base + (Number(p.cl) || 0) * R.clean - (Number(p.wr) || 0) * R.wrong; }
/* v4.28 결과 둘째 줄 · 이번 판이 내 최고를 넘었으면 「신기록!」 · 아니면 「내 최고 N점」(이 기기 최고와 서버 최고 중 큰 쪽) */
function olyResCmp(key) {
  var v = olyMe().ev[key], last = OLY.last && OLY.last.key === key ? OLY.last : null, best = v ? v.best : 0;
  if (last && last.score > 0 && last.score > last.prev && last.score >= best) return "신기록!";
  return "내 최고 " + olyFmt(best) + "점";
}
/* 결과 셋째 줄 · AX 올림픽 진행 */
/* v4.83 AX 퀴즈 = 「AX 퀴즈 n/2 완주」(순위 · 총점 없음) · 미니 게임 = 「미니 게임 n/3종목 · 총점」(옛 서버면 올림픽 n/5종목) */
function olyResOly(key) {
  var me = olyMe();
  if (olyIsQuiz(key)) return QZ_NEED <= 1 ? (me.qdone >= 1 ? "AX 퀴즈 완주" : "") : "AX 퀴즈 " + me.qdone + "/" + OLY_QUIZ_KEYS.length + " 완주";
  return (olyOvName() === "미니 게임" ? "미니 게임 " : "올림픽 ") + me.done + "/" + olyOvKeys().length + "종목 · 총점 " + olyFmt(me.total) + "점";
}
/* 결과 접힘 안 「내 위치」 · 종목 순위 · 종합(자격 전이면 남은 종목) · 서버 응답이 오면 다시 채운다 · v4.83 AX 퀴즈는 순위가 없어 빈칸 */
function olyResMeHtml(key) {
  if (olyIsQuiz(key)) return "";
  var me = olyMe(), v = me.ev[key], left = olyOvEvents().filter(function (e) { return !me.ev[e.key]; }).map(function (e) { return e.short; }).join(" · ");
  return rtFoldSec("내 위치", rtRefTable([["종목", v ? olyEvPos(key, v) : ""], me.left ? ["남은 종목", left] : ["종합", olyOverallPos(me)]]));
}
function olyResMeFill(key) {
  var d = el("olyResMe"); if (d) d.innerHTML = olyResMeHtml(key);
  var c = el("olyResCmp"); if (c) c.textContent = olyResCmp(key);
  var t = el("olyResOly"); if (t) t.textContent = olyResOly(key);
  var m = el("olyResLw"), v = olyMe().ev[key];
  if (m) m.innerHTML = v && v.medal ? olyLw(v.medal, 64) : "";
}
/* 결과 화면 본문 (게임 결과 카드 안) · o = { key, parts, score, deco(점수 옆 장식 · 기억력 별), ref(참고 기록 [[이름, 값]]), extra(참고 기록 아래 HTML · O/X 칭호) }
   v4.28 보이는 것 = 점수 · 내 최고 비교 · AX 올림픽 진행 세 줄 · 나머지 = 「점수 계산 보기」 접힘(점수 구성 표 · 참고 기록 · 점수 규칙 · 내 위치) */
function olyResultBody(o) {
  var v = olyMe().ev[o.key];
  return '<div id="olyResLw" class="oly-res-lw">' + (v && v.medal ? olyLw(v.medal, 64) : "") + "</div>" +
    '<p class="gs-sc">' + olyFmt(o.score) + "<small>점</small></p>" + (o.deco || "") +
    '<p class="gs-l2" id="olyResCmp">' + esc(olyResCmp(o.key)) + "</p>" +
    '<p class="gs-l3" id="olyResOly">' + esc(olyResOly(o.key)) + "</p>" +
    rtFoldHtml("점수 계산 보기", rtFoldSec("점수 구성", olyBreakHtml(o.key, o.parts, o.score)) +
      rtFoldSec("참고 기록", rtRefTable(o.ref) + (o.extra || "")) +
      rtFoldSec("점수 규칙", '<p class="rt-fold-p">' + esc(gsRuleText(o.key)) + "</p>") +
      '<div id="olyResMe">' + olyResMeHtml(o.key) + "</div>");
}
/* ── 스탬프 탭 올림픽 허브 (§7.5) ── */
/* v4.83 (261001) 미니 게임 허브 · 팡 · 점프 · 테트리스 세 행만(AX 퀴즈는 quizHubHtml · 화면 quiz) · 총점 = 종합 종목 합 */
function olyHubHtml() {
  olyPull();
  var me = olyMe(), op = me.left ? "종합 순위까지 " + me.left + "종목" : olyOverallPos(me), nm = olyOvName();   /* v4.95 남은 종목 이름은 바로 아래 세 행이 보여 준다(375px 한 줄) */
  var p4got = S.get("stamps", []).indexOf("p4") >= 0;   /* v5.16 받은 뒤 = 「스탬프 받음 · 순위는 종목 최고 기록」(다시 해도 스탬프는 그대로) */
  return stampLineHtml("p4", '<p class="ax-meta">' + (p4got ? "스탬프 받음 · 순위는 종목 최고 기록" : stampV2() ? "팡 · 점프 · 테트리스 · 종목마다 한 판" : "서로 다른 " + MG_NEED + "종목 · 종목마다 한 판") + "</p>") +   /* v4.70 스탬프 조건 + 도장(n/3) */
    '<section class="ax-card oly-sum"><div><p class="ax-meta">내 ' + nm + " 총점</p><p class=\"oly-sum-n\">" + olyFmt(me.total) + "<small> / " + olyFmt(olyMax()) + "</small></p></div>" +
    '<p class="ax-meta oly-sum-r">종목 ' + me.done + "/" + olyOvKeys().length + (op ? "<br>" + esc(op) : "") + "</p></section>" +
    olyKeysEvents(OLY_MINI_KEYS).map(function (e) {
      var v = me.ev[e.key], lw = v && v.medal ? olyLw(v.medal, 48) : "";
      return rcHtml({ cls: v ? " done" : "", onclick: "App.go('" + e.view + "')", link: true, left: lw ? '<span class="oly-lwbox">' + lw + "</span>" : tokBadge(e.short, v ? "mine" : ""),
        title: esc(e.name),
        sub: v ? "최고 " + olyFmt(v.best) + (me.sv && v.rank ? " · 종목 " + v.rank + "위" : "") : "",
        right: '<span class="st">' + (v ? olyFmt(v.best) : "-") + "</span>" });
    }).join("") +
    '<button type="button" class="ax-button ax-button-weak oly-rank-go" onclick="App.go(\'oly_rank\')">' + (nm === "미니 게임" ? "미니 게임 순위" : "AX 올림픽 순위판") + "</button>" +
    (testMode() ? '<button class="btn test" style="margin-top:8px" onclick="testGameReset(false)">테스트 · 게임 기록만 초기화</button>' +
      '<button class="btn test" style="margin-top:6px" onclick="testGameReset(true)">테스트 · 닉네임까지 초기화</button>' : "");
}
