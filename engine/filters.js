// AX magic 공용 엔진 · 떨림 보정 필터 (261004)
// One Euro 필터(Casiez · Roussel · Vogel, CHI 2012): 손이 멈춰 있으면 세게 눌러 떨림을 없애고, 빨리 움직이면 약하게 눌러 늦어짐을 줄인다.
//   minCutoff(Hz) : 멈춰 있을 때의 차단 주파수. 낮을수록 덜 떨리고 더 늦다
//   beta          : 속도(단위/초)에 따라 차단 주파수를 올리는 정도. 클수록 빠른 움직임을 덜 늦춘다
//   dCutoff(Hz)   : 속도 추정에 쓰는 차단 주파수
// 시각 t 는 초. 같은 시각(또는 앞선 시각)으로 다시 들어오면 앞 값을 그대로 돌려준다(카메라 프레임보다 그리기가 잦을 때 같은 표본을 두 번 먹지 않게).
// 화면 표시(점 · 선)에만 쓴다. 게임 판정 값에는 쓰지 않는다.

const alpha = (cutoff, dt) => { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); };

export class OneEuro {
  constructor({ minCutoff = 1.2, beta = 0.004, dCutoff = 1 } = {}) {
    this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff;
    this.reset();
  }

  reset() { this.t = null; this.x = 0; this.dx = 0; }

  filter(x, t) {
    if (this.t === null) { this.t = t; this.x = x; this.dx = 0; return x; }
    const dt = t - this.t;
    if (!(dt > 0)) return this.x;
    const dx = (x - this.x) / dt;
    this.dx += alpha(this.dCutoff, dt) * (dx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += alpha(cutoff, dt) * (x - this.x);
    this.t = t;
    return this.x;
  }
}

// 점 여러 개({x, y})를 한꺼번에 · 손 21점 등
export class PointsFilter {
  constructor(opts = {}) { this.opts = opts; this.fx = []; this.fy = []; }

  reset() { this.fx = []; this.fy = []; }

  filter(pts, t) {
    if (this.fx.length !== pts.length) {
      this.fx = pts.map(() => new OneEuro(this.opts));
      this.fy = pts.map(() => new OneEuro(this.opts));
    }
    return pts.map((p, i) => ({ x: this.fx[i].filter(p.x, t), y: this.fy[i].filter(p.y, t) }));
  }
}
