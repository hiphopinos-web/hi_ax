// AX magic 공용 엔진 · 상태 점 (261004)
// 스태프가 화면 구석 점 하나로 계수가 도는지 본다(관람객에게는 뜻이 없는 작은 점).
//   off  = 계수 꺼짐(점 없음)
//   ok   = 정상(빨강 · 천천히 깜빡임) · 서버로 보내고 있고 최근에 셌다
//   weak = 약함(주황) · 세고는 있는데 서버 전송이 꺼졌거나 실패 중, 또는 막 시작
//   stop = 멈춤(회색) · 오류 · 연속 실패 3회 · 인식기를 20초 넘게 못 불러옴
export const DOT_COL = { off: "transparent", ok: "#E5484D", weak: "rgba(255,126,49,.8)", stop: "rgba(150,150,150,.75)" };

// s = { on, err, fails, ready, lastAt, since, interval, srv } · srv = transport.server(없으면 null)
export function healthOf(s, nowMs = Date.now()) {
  if (!s.on) return { k: "off", col: DOT_COL.off };
  const sv = s.srv && s.srv.target !== "off" ? s.srv.status() : null, ref = s.lastAt || s.since, age = nowMs - ref;
  if (s.err || s.fails >= 3 || (!s.ready && age > 20000)) return { k: "stop", col: DOT_COL.stop };
  if (sv && sv.k === "ok" && s.fails === 0 && age < Math.max(10000, s.interval * 5)) return { k: "ok", col: DOT_COL.ok };
  return { k: "weak", col: DOT_COL.weak };
}
