// AX magic 공용 엔진 · 추적 보조 (261004)
// 프레임마다 새로 잡힌 점(손 · 사람 발 위치)을 이미 따라가던 것과 잇는다.
// 게임 규칙(2인 왼쪽/오른쪽 배정 · 잃은 손 자리 기억 등)은 각 프로그램에 남긴다.

// 거리순 짝짓기 · 모든 (기존, 새) 쌍을 가까운 순으로 묶는다(가운데서 가까이 붙어도 뒤바뀌지 않게)
//   tracks: 기존 목록 · points: 새 목록
//   dist(track, point, ti, pi) = 거리 · 문턱을 넘으면 Infinity 를 돌려 제외
//   반환 { pairs: [[ti, pi]], freeT: [ti], freeP: [pi] } · pairs 는 묶인 순서(가까운 것부터)
export function greedyMatch(tracks, points, dist) {
  const cand = [];
  tracks.forEach((t, i) => points.forEach((p, j) => {
    const d = dist(t, p, i, j);
    if (d < Infinity) cand.push([d, i, j]);
  }));
  cand.sort((a, b) => a[0] - b[0]);
  const usedT = new Array(tracks.length).fill(false), usedP = new Array(points.length).fill(false), pairs = [];
  for (const [, i, j] of cand) {
    if (usedT[i] || usedP[j]) continue;
    usedT[i] = usedP[j] = true;
    pairs.push([i, j]);
  }
  const freeT = [], freeP = [];
  usedT.forEach((u, i) => { if (!u) freeT.push(i); });
  usedP.forEach((u, j) => { if (!u) freeP.push(j); });
  return { pairs, freeT, freeP };
}

// 다각형 안인지(정규화 좌표 [x, y]) · 구역 판정 공용
export function inPoly(p, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// 구역 상태 · 보통 warn 명 이상, 혼잡 crowd 명 이상
export const zoneState = (z, n) => (n >= z.crowd ? "bad" : n >= z.warn ? "mid" : "ok");
