// AX magic 공용 엔진 · 실행 주기 스케줄러 (261004)
// 모델마다 도는 주기를 「구독」으로 받는다.
//   프레임 구독  every(name, n, run)     : 카메라에 새 프레임이 들어올 때 n 프레임마다 run(video, ts, frameNo)
//                                          (매지션: 손 = 매 프레임, 얼굴 = 2프레임마다)
//   시간 구독    interval(name, run, ms) : 워커 타이머로 run() · run 이 숫자(ms)를 돌려주면 그만큼 뒤에 다시, 아니면 ms 뒤에 다시
//                                          (계수기 · 매지션: 사람 감지 1~5초)
// 프레임 구독은 그리기 루프가 pump() 를 부를 때만 돈다(같은 프레임은 한 번만).
// 시간 구독은 창이 가려져도 늦춰지지 않게 워커 안 setTimeout 으로 깨운다(크롬은 숨은 탭의 setTimeout 을 분 단위로 늦춘다).
// detectForVideo 의 시각(ts)은 영상 하나에 대해 늘 앞으로만 가야 해서 스케줄러가 한 곳에서 만든다.

// 워커 타이머 · schedule(ms) 를 부를 때마다 앞 예약은 지운다
export function createTicker(fn) {
  let timer = null;
  const w = (() => {
    try {
      const code = "let t=null;onmessage=(e)=>{clearTimeout(t);t=setTimeout(()=>postMessage(0),e.data)}";
      const wk = new Worker(URL.createObjectURL(new Blob([code], { type: "text/javascript" })));
      wk.onmessage = () => fn();
      return wk;
    } catch (e) {
      return null;
    }
  })();
  return {
    worker: !!w,
    schedule(ms) {
      clearTimeout(timer);
      if (w) w.postMessage(ms);
      else timer = setTimeout(fn, ms);
    },
  };
}

export class FrameScheduler {
  // source() = 지금 쓸 video 요소(없으면 null)
  constructor(source) {
    this.source = source;
    this.subs = [];
    this.lastVT = -1;
    this.lastTs = 0;
    this.frame = 0;
  }

  every(name, n, run) {
    const s = { name, n: Math.max(1, n | 0), run, on: true };
    this.subs.push(s);
    return { stop: () => { s.on = false; this.subs = this.subs.filter((q) => q !== s); }, set every(v) { s.n = Math.max(1, v | 0); } };
  }

  // 새 프레임이면 구독을 돌리고 true · 같은 프레임 · 영상 없음이면 false
  pump() {
    const v = this.source();
    if (!v || v.readyState < 2 || v.currentTime === this.lastVT) return false;
    this.lastVT = v.currentTime;
    let ts = performance.now();
    if (ts <= this.lastTs) ts = this.lastTs + 1;
    this.lastTs = ts;
    this.frame++;
    for (const s of this.subs) {
      if (!s.on || this.frame % s.n !== 0) continue;
      try { s.run(v, ts, this.frame); } catch (e) { console.warn(s.name, e); }
    }
    return true;
  }

  // 시간 구독 · 반환 { kick(ms), stop() } · kick 으로 바로(또는 ms 뒤) 다시 돌린다
  interval(name, run, ms = 1000) {
    let on = true;
    const t = createTicker(async () => {
      if (!on) return;
      let next;
      try { next = await run(); } catch (e) { console.warn(name, e); }
      if (on && typeof next === "number") t.schedule(next);
    });
    const h = { name, kick: (d = 0) => { if (on) t.schedule(d); }, stop: () => { on = false; t.schedule(1e9); }, get worker() { return t.worker; } };
    if (ms >= 0) h.kick(ms);
    return h;
  }
}
