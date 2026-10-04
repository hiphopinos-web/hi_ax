// AX magic 공용 엔진 · 혼잡 판단 (사용자 확정 261004 · 구현 261005)
// 카메라 숫자로 「현장 확인 요청」 여부를 정한다. 순수 함수만 둔다(화면 · 저장 · 전송 없음 · node 로 바로 시험).
// 쓰는 곳은 혼잡도 계수기(crowd/)뿐이다. AX magic 숫자(체험하는 사람이 섞인 참여자 수)는 판단에 쓰지 않는다.
//
// 규칙
//   1) 장소(구역)마다 기준 인원 base 를 둔다 · 계수기에서는 구역의 「혼잡」 값(z.crowd)
//   2) 최근 1분(WIN_MS) 계수의 중앙값을 본다 · 한두 번 튄 값은 중앙값에 묻힌다
//   3) 중앙값 ≥ base 인 상태가 2분(HOLD_MS) 끊기지 않고 이어지면 「확인 요청」(check)
//   4) 확인 요청은 중앙값 < base × 0.8(OFF_RATIO) 인 상태가 2분 이어져야 「평소」(calm)로 돌아온다(히스테리시스)
//      그 사이(기준의 80% 이상 · 기준 미만)는 지금 상태를 그대로 둔다
//   5) 빈 구간: 앞 계수와 GAP_MS(30초) 넘게 떨어지면 그 앞 계수 · 유지 시간을 버리고 새로 센다(상태는 둔다)
//      RESET_MS(10분) 넘게 끊겼다 다시 오면 상태도 평소로 되돌린다(오래된 붐빔을 들고 있지 않게)
//   6) 신호 없음: 마지막 계수가 GAP_MS 넘게 지났으면 보기는 「신호 없음」(lost) · 상태 자체는 바꾸지 않는다
//
// 쓰는 법
//   let s = judgeInit();
//   s = judgeStep(s, Date.now(), 7, 6);          // 계수할 때마다 (시각 ms, 인원, 기준 인원)
//   judgeView(s, Date.now()).k                   // "calm" | "check" | "lost"
//   시험용으로 시간을 줄이려면 opt 에 { WIN_MS, HOLD_MS, GAP_MS, RESET_MS } 를 넘긴다(scaleOpt)

export const JUDGE = Object.freeze({ WIN_MS: 60000, HOLD_MS: 120000, OFF_RATIO: 0.8, GAP_MS: 30000, RESET_MS: 600000 });
export const JUDGE_WORD = Object.freeze({ calm: "평소", check: "현장 확인 요청", lost: "신호 없음", na: "판단 제외" });

// 시험 모드 · 시간 길이만 1/f 로 줄인다(비율은 그대로)
export function scaleOpt(f) {
  const k = Number(f) > 0 ? Number(f) : 1;
  return Object.freeze({ WIN_MS: JUDGE.WIN_MS / k, HOLD_MS: JUDGE.HOLD_MS / k, OFF_RATIO: JUDGE.OFF_RATIO, GAP_MS: JUDGE.GAP_MS / k, RESET_MS: JUDGE.RESET_MS / k });
}

export function median(a) {
  if (!a.length) return null;
  const b = a.slice().sort((x, y) => x - y), m = b.length >> 1;
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
}

export function judgeInit() {
  return { st: "calm", samples: [], hiSince: null, loSince: null, lastT: 0, med: null, base: 0, changedAt: 0 };
}

// 계수 한 번 · 새 상태를 돌려준다(받은 상태는 바꾸지 않는다)
export function judgeStep(prev, t, n, base, opt) {
  const o = opt || JUDGE;
  const s = { st: prev.st, samples: prev.samples.slice(), hiSince: prev.hiSince, loSince: prev.loSince, lastT: prev.lastT, med: prev.med, base: prev.base, changedAt: prev.changedAt };
  const cnt = Math.max(0, Number(n) || 0), b = Number(base);
  if (!(b >= 1)) return Object.assign(s, { lastT: t, med: null, base: 0, hiSince: null, loSince: null, samples: [] });   // 기준이 없으면 판단하지 않는다
  if (s.lastT && (t < s.lastT || t - s.lastT > o.GAP_MS)) {   // 빈 구간(또는 시계가 뒤로 감)
    if (t - s.lastT > o.RESET_MS && s.st !== "calm") { s.st = "calm"; s.changedAt = t; }
    s.samples = []; s.hiSince = null; s.loSince = null;
  }
  s.samples.push([t, cnt]);
  while (s.samples.length && s.samples[0][0] <= t - o.WIN_MS) s.samples.shift();
  s.lastT = t; s.base = b;
  s.med = median(s.samples.map((x) => x[1]));
  const hi = s.med >= b, lo = s.med < b * o.OFF_RATIO;
  if (s.st === "calm") {
    s.loSince = null;
    if (!hi) s.hiSince = null;
    else {
      if (s.hiSince === null) s.hiSince = t;
      if (t - s.hiSince >= o.HOLD_MS) { s.st = "check"; s.changedAt = t; s.hiSince = null; }
    }
  } else {
    s.hiSince = null;
    if (!lo) s.loSince = null;
    else {
      if (s.loSince === null) s.loSince = t;
      if (t - s.loSince >= o.HOLD_MS) { s.st = "calm"; s.changedAt = t; s.loSince = null; }
    }
  }
  return s;
}

// 화면에 보일 것 · k(상태) · med(1분 중앙값) · left(상태가 바뀌기까지 남은 ms · 바뀔 조짐이 없으면 -1)
export function judgeView(s, now, opt) {
  const o = opt || JUDGE;
  if (!s || !s.lastT || now - s.lastT > o.GAP_MS) return { k: "lost", med: s ? s.med : null, left: -1 };
  if (!s.base) return { k: "na", med: null, left: -1 };
  const since = s.st === "calm" ? s.hiSince : s.loSince;
  return { k: s.st, med: s.med, left: since === null ? -1 : Math.max(0, o.HOLD_MS - (s.lastT - since)) };
}

// 구역 여러 개 · 구역 id 마다 상태를 둔다 · rows = [{ id, count, crowd }] · 없어진 구역은 버린다
export function judgeZones(map, t, rows, opt) {
  const out = new Map();
  for (const r of rows) out.set(r.id, judgeStep(map.get(r.id) || judgeInit(), t, r.count, r.crowd, opt));
  return out;
}
