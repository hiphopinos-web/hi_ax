/* 1층 둘러보기 · 데이터 한 곳(v5.11 · 261003)
 * 배치 정본 = 「[현대해상] AX페스티벌 부스 발주_설명.pdf」(261002 · 1층 공간 구성 + 구역별 위치 · 설치 품목). 사용자 261003 「동선이나 위치가 다 확정이 되어 있어」.
 *   PDF 2쪽 평면 위 색 막대(벡터)를 도면 좌표로 옮겼다 · 환산 = 기둥 4개(간격 6.47m)와 남쪽 치수 32,568 기준 21.15pt/m · 오차 ±0.3m.
 *   판 순서 = PDF 구역 쪽의 판 그림 왼쪽 → 오른쪽 = 판 앞에 선 사람의 왼쪽 → 오른쪽.
 * 좌표: 도면 미터 · x = 서쪽 벽 안쪽에서 동쪽으로 · z = 남쪽 유리벽 안쪽에서 북쪽으로. 로비 32.57 × 11.34m.
 * 판 그림: 부스 발주 원본(.ai) 쪽 번호 = pg. 썸네일은 아틀라스 a/atlas0 · atlas1(ATLAS 표), 확대는 d/pNN.webp.
 * 이 파일은 3D · 평면 지도 · 목록이 같이 쓴다. 렌더러(tour-scene.js)를 바꿔도 이 표는 그대로다. */
(function () {
  'use strict';
  var PG = {
    1: 'AX VISION 간판', 2: 'AX Festival 2026', 3: 'ME to WE : 나의 경험을 우리의 가능성으로', 4: 'Data Business Company',
    5: 'AX Roadmap · 2026 공감과 참여', 6: '2027 확산과 체화', 7: '2028 혁신과 연결',
    8: 'AX LAB 간판', 9: 'DAP · 데이터 분석 프로젝트', 10: 'History · 2024~2025 우수 과제', 11: 'Project · 2026 DAP 프로젝트 1', 12: 'Project · 2026 DAP 프로젝트 2', 13: '내 업무 고민도 DAP가 될 수 있어요 · 아이디어 QR',
    14: 'AX in Action · 현장의 AX', 15: '현장 인터뷰 영상 TV 자리', 16: 'Sales AX · 강북이', 17: 'AI컨설팅 도우미', 18: 'Claims AX · 하이핑거',
    19: 'AX LOUNGE 간판', 20: 'AX Lounge · 그 업무 고민, AI와 함께', 21: '상담 3단계',
    22: 'AX PLAY 간판', 23: 'HiDI', 24: 'HiDI-Q · Introduce', 25: 'HiDI-Q · Tips', 26: 'HiDI-Q · Tips 이어서', 27: 'HiDI-Q · Feedback',
    28: 'Hi-Helper', 29: 'Hi-Helper · Introduce', 30: 'Hi-Helper · Tips', 31: 'Hi-Helper · Check Point', 32: 'Hi-Helper · Feedback',
    33: 'EVENT 간판', 34: 'AX Festival 2026 (왼쪽)', 35: 'AX Festival 2026 (오른쪽)', 36: 'AI 포토부스', 37: '룰렛 이벤트', 38: '룰렛 휠 자리', 39: 'AX 타자왕',
    40: '사전등록자 체크인존 현수막', 41: '출입구 안내 배너', 42: '층별 안내 배너', 43: '키노트 안내 배너', 44: '세션 강의장 안내 배너', 45: '층별 안내 배너', 46: 'ME to WE 포스터', 47: '사전등록자 체크인 배너', 48: 'AX 타자왕 배너'
  };
  /* 판 크기(미터) · 큰 판 1.0 × 2.5 · 간판 1.3 × 0.4 · 배너 0.6 × 1.8 · 포스터 A0 0.84 × 1.19 · 현수막 2.8 × 0.6 */
  var SIGNS = [1, 8, 19, 22, 33];
  function pgSize(p) {
    if (SIGNS.indexOf(p) >= 0) return [1.3, 0.4];
    if (p === 40) return [2.8, 0.6];
    if (p === 46) return [0.84, 1.19];
    if (p >= 41) return [0.6, 1.8];
    return [1.0, 2.5];
  }
  /* 아틀라스 · pg → [장 번호, x, y, 폭, 높이](px) · 0 = 2048², 1 = 1024² */
  var ATLAS = { files: ['a/atlas0.webp', 'a/atlas1.webp'], size: [2048, 1024],
    at: {"1":[1,0,0,512,158],"2":[0,0,0,204,512],"3":[0,204,0,204,512],"4":[0,408,0,204,512],"5":[0,612,0,204,512],"6":[0,816,0,204,512],"7":[0,1020,0,204,512],"8":[1,0,158,512,158],"9":[0,1224,0,204,512],"10":[0,1428,0,204,512],"11":[0,1632,0,204,512],"12":[0,1836,0,204,512],"13":[0,0,512,204,512],"14":[0,204,512,204,512],"15":[0,408,512,204,512],"16":[0,612,512,204,512],"17":[0,816,512,204,512],"18":[0,1020,512,204,512],"19":[1,0,316,512,158],"20":[0,1224,512,204,512],"21":[0,1428,512,204,512],"22":[1,0,474,512,158],"23":[0,1632,512,204,512],"24":[0,1836,512,204,512],"25":[0,0,1024,204,512],"26":[0,204,1024,204,512],"27":[0,408,1024,204,512],"28":[0,612,1024,204,512],"29":[0,816,1024,204,512],"30":[0,1020,1024,204,512],"31":[0,1224,1024,204,512],"32":[0,1428,1024,204,512],"33":[1,0,632,512,158],"34":[0,1632,1024,204,512],"35":[0,1836,1024,204,512],"36":[0,0,1536,204,512],"37":[0,204,1536,204,512],"38":[0,408,1536,204,512],"39":[0,612,1536,204,512],"40":[1,0,790,512,110],"41":[0,816,1536,171,512],"42":[0,1020,1536,171,512],"43":[0,1224,1536,171,512],"44":[0,1428,1536,171,512],"45":[0,1632,1536,171,512],"46":[1,512,512,363,512],"47":[0,1836,1536,171,512],"48":[1,512,0,171,512]} };

  /* 건물 · 도면 1/200(2024.12) · 로비 + 서쪽 날개(미팅룸) + 코어 */
  var BLD = {
    outline: [[0, 0], [32.5, 0], [32.5, 19.5], [6.8, 19.5], [6.8, 24.5], [0, 24.5]],
    lobbyN: 11.34,
    cols: [7.5, 14.06, 20.55, 27.08], colZ: 4.8,              /* 기둥 4개 · 면마다 ME to WE A0 포스터(PDF 12쪽 「기둥 4개 × 4면」) */
    pier: [1.05, 4.8],                                       /* 서쪽 벽 기둥(벽에 붙음 · 포스터 없음) */
    revolve: 17.3, doorsS: [[10.9, 13.0], [21.7, 23.8]], doorE: [7.2, 10.3],
    cores: [[6.8, 16.6], [20.1, 26.1]], hall: 18.35,
    rooms: [[12.2, 15.6, '미팅룸 3'], [16.0, 19.6, '미팅룸 2'], [20.0, 23.2, '미팅룸 1']],
    bust: [15.3, 10.0], desk: [24.7, 10.6],
    hatch: { at: [29.3, 15.5], w: 6.4, d: 8.0 },
    outside: { x0: 32.9, x1: 38.6, z0: -0.6, z1: 7.0 }       /* 동쪽 출입문 밖 · 체크인 몽골텐트(PDF 3쪽) */
  };

  /* 구역 · 순서 = PDF 동선 번호(2 VISION → 3 LAB · in Action → 4 PLAY → 5 EVENT → 6 LOUNGE) · 18F 커피챗은 맨 끝
   * rows: a = 판 줄의 보는 사람 왼쪽 끝 · r = 오른쪽 방향 · n = 판 앞면 방향 · pages = 왼쪽부터 · tv = 앞에 TV가 서는 판 칸 · desk = 앞 인포메이션 데스크 수
   * sign = 간판이 올라가는 판 칸(PDF 판 그림 기준 왼쪽 첫 판 위) · where = 시트 한 줄(정문 회전문으로 들어와 북쪽을 본 사람 기준) · map = 평면 지도 이름표 자리(-1 왼쪽 · 0 가운데 · 1 위) */
  var ZONES = [
    { id: 'vision', name: 'AX VISION', fl: '1F', signPg: 1, where: '정문으로 들어와 오른쪽 끝 벽 · 동쪽 출입문 바로 안', map: [-1, 0],
      rows: [{ a: [31.7, 6.4], r: [0, -1], n: [-1, 0], pages: [2, 3, 4, 5, 6, 7], tv: [0], sign: 0 }] },
    { id: 'lab', name: 'AX LAB', fl: '1F', signPg: 8, where: '정문으로 들어와 오른쪽 · 유리벽 앞 둘째 줄', map: [0, 1],
      rows: [{ a: [30.3, 0.8], r: [-1, 0], n: [0, 1], pages: [9, 10, 11, 12, 13], sign: 0 }] },
    { id: 'action', name: 'AX in Action', fl: '1F', signPg: 0, where: '정문으로 들어와 오른쪽 · 유리벽 앞 첫 줄 · 간판 없음',
      rows: [{ a: [24.8, 0.8], r: [-1, 0], n: [0, 1], pages: [14, 15, 16, 17, 18], tv: [1] }] },
    { id: 'play', name: 'AX PLAY', fl: '1F', signPg: 22, where: '정문으로 들어와 왼쪽 · 유리벽 앞 두 줄(HiDI-Q · Hi-Helper)',
      rows: [{ a: [14.9, 0.8], r: [-1, 0], n: [0, 1], pages: [23, 24, 25, 26, 27], tv: [0], desk: 4, sign: 0, label: 'HiDI-Q' },
             { a: [7.7, 0.8], r: [-1, 0], n: [0, 1], pages: [28, 29, 30, 31, 32], tv: [0], desk: 4, label: 'Hi-Helper' }] },
    { id: 'event', name: 'EVENT', fl: '1F', signPg: 33, where: '정문으로 들어와 왼쪽 끝 벽 · 타자왕 · 포토부스 · 룰렛 순', extra: [48],
      rows: [{ a: [0.75, 1.9], r: [0, 1], n: [1, 0], pages: [39], label: 'AX 타자왕' },
             { a: [0.75, 5.6], r: [0, 1], n: [1, 0], pages: [34, 35, 36], sign: 0, label: 'AI 포토부스' },
             { a: [0.75, 8.9], r: [0, 1], n: [1, 0], pages: [37, 38], label: '룰렛' }] },
    { id: 'lounge', name: 'AX LOUNGE', fl: '1F', signPg: 19, where: '로비 왼쪽 안쪽 · 미팅룸 들어가는 곳',
      rows: [{ a: [7.7, 10.9], r: [1, 0], n: [0, -1], pages: [20, 21], desk: 1, sign: 0 }],
      area: [0.24, 6.87, 11.34, 24.3] },                     /* 미팅룸 날개 전체(PDF 2쪽 초록 면) · 상담 자리 */
    { id: 'cafe', name: 'AX 커피챗', fl: '18F', signPg: 0, ghost: 1, rows: [] }
  ];
  /* 구역에 딸린 소품 · 위치는 PDF 판 그림의 집기 자리 */
  var PROPS = {
    photobooth: [2.4, 7.1],          /* 포토부스 기 제작품 · 포토부스 판 앞 */
    wheel: [1.7, 10.4],              /* 룰렛 휠 · 판 38(빈 주황 판) 앞 */
    typingBanner: { pg: 48, at: [0.75, 3.45], n: [1, 0] },   /* 타자왕 판 39 오른쪽(북쪽) 엑스배너 */
    checkin: { at: [36.0, 3.0], n: [-1, 0], banner: { pg: 47, at: [34.2, 5.4], n: [-1, 0] }, cloth: 40 }
  };
  /* 모형에 자리가 없는 안내물 · PDF 8쪽 「엑스배너 5개 출력」 · 세울 자리는 PDF에 없다 */
  var UNPLACED = [41, 42, 43, 44, 45];
  /* 판 퀴즈 힌트 코드 → 판 · 앱 QZ_PANEL 키와 같은 이름(검사 절이 대조) */
  var HINT_PG = {
    'vision.cover': 2, 'vision.metowe': 3, 'vision.dbc': 4, 'vision.2026': 5, 'vision.2027': 6, 'vision.2028': 7,
    'lab.dap': 9, 'lab.history': 10, 'lab.project': 11, 'lab.idea': 13,
    'action.intro': 14, 'action.sales': 16, 'action.consult': 17, 'action.claims': 18,
    'lounge.intro': 20, 'lounge.steps': 21,
    'play.hq.hidi': 23, 'play.hq.intro': 24, 'play.hq.tips': 25, 'play.hq.feedback': 27,
    'play.hh.helper': 28, 'play.hh.intro': 29, 'play.hh.tips': 30, 'play.hh.check': 31, 'play.hh.feedback': 32,
    'event.photo': 36, 'event.roulette': 37, 'event.typing': 48, 'event.typingking': 39
  };
  function Z(id) { for (var i = 0; i < ZONES.length; i++) if (ZONES[i].id === id) return ZONES[i]; return null; }
  function zonePages(z) {
    var o = [];
    if (z.signPg) o.push(z.signPg);
    z.rows.forEach(function (r) { o = o.concat(r.pages); });
    return o.concat(z.extra || []);
  }
  function zoneOfPg(p) { for (var i = 0; i < ZONES.length; i++) if (zonePages(ZONES[i]).indexOf(p) >= 0) return ZONES[i]; return null; }
  window.TOUR_DATA = { PG: PG, SIGNS: SIGNS, pgSize: pgSize, ATLAS: ATLAS, BLD: BLD, ZONES: ZONES, PROPS: PROPS, UNPLACED: UNPLACED, HINT_PG: HINT_PG, Z: Z, zonePages: zonePages, zoneOfPg: zoneOfPg };
})();
