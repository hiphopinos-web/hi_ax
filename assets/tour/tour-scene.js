/* 1층 둘러보기 · 장면(렌더러 교체 지점 · v5.11 · 261003)
 * 지금 = 상자 · 판 · 글자로 짓는 절차 모형(데모 그대로 · 모양 다듬기는 보류 · 사용자 261003 「모델하우스 수준」 검토 중).
 * 구운 조명 GLB 모형으로 바꿀 때는 이 파일만 바꾼다. tour.js(조작 · 시트 · 판 보기 · 지도 · 목록 · 뒤로)는 아래 약속만 쓴다.
 *
 * 약속: window.TourScene.build(ctx) → S
 *   ctx = { T: THREE, D: TOUR_DATA, P(x, z, y) → Vector3(도면 미터 → three), N3([nx, nz]) → Vector3, labelFont }
 *   S.lobby · S.cafe        THREE.Group 두 개(cafe 는 처음에 숨김 · 1층과 다른 x 자리)
 *   S.picks                 누를 수 있는 메시 · userData { zone?: 구역 id, pg?: 판 번호 } · 판 앞면은 PlaneGeometry
 *   S.faces[pg]             판 앞면 메시 · 판 보기 비행(panelView)과 「판 자리에서 넓어지기」에 쓴다
 *   S.anchors[zone]         구역 간판 칩(DOM)을 붙일 3D 점
 *   S.zoneBox(zone)         { t: Vector3 가운데, w: 폭(m), h: 높이(m), th: 카메라 방위 } · 구역 시점
 *   S.mark(zone | null)     고른 구역 바닥 강조
 *   S.setAtlas(i, texture)  판 아틀라스 i 가 받아지면 판 재질에 붙인다
 *   S.DEF · S.CAFE_DEF      기본 시점 { t, r, th, ph } · S.cafeX · S.bubbleAt(말풍선 3D 점)
 *   S.limits(scn)           카메라 목표점 범위 { x: [a, b], z: [a, b] } */
(function () {
  'use strict';
  window.TourScene = {
    build: function (ctx) {
      var T = ctx.T, D = ctx.D, P = ctx.P, N3 = ctx.N3, BLD = D.BLD;
      var picks = [], faces = {}, anchors = {}, pads = {}, padLines = {}, atlasMats = [[], []], zones = {};
      var matCache = {};
      function lam(c) { return matCache[c] || (matCache[c] = new T.MeshLambertMaterial({ color: c })); }
      function box(g, w, h, d, c, x, y, z, ry) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), typeof c === 'string' || typeof c === 'number' ? lam(c) : c); m.position.set(x, y, z); if (ry) m.rotation.y = ry; g.add(m); return m; }
      function canvasTex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
      function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
      function textTex(text, opt) {
        opt = opt || {}; var fs = opt.fs || 64, font = (opt.w || 600) + ' ' + fs + 'px ' + (opt.font || ctx.labelFont);
        var m = document.createElement('canvas').getContext('2d'); m.font = font; var tw = Math.ceil(m.measureText(text).width) + fs * 0.6;
        var t = canvasTex(tw, Math.ceil(fs * 1.5), function (g, w, h) { if (opt.bg) { g.fillStyle = opt.bg; roundRect(g, 0, 0, w, h, opt.rad || 8); g.fill(); } g.font = font; g.fillStyle = opt.color || '#6B7684'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, w / 2, h / 2 + fs * 0.04); });
        t.userData = { aspect: tw / Math.ceil(fs * 1.5) }; return t;
      }
      /* 바닥 글자는 기본 시점에서 바로 읽히게 돌린다 */
      var DEF = { t: P(16.0, 6.6, 0), r: 52, th: -1.95, ph: 0.58 };
      function floorLabel(g, text, x, z, hm, opt) {
        var t = textTex(text, opt), w = hm * t.userData.aspect;
        var m = new T.Mesh(new T.PlaneGeometry(w, hm), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.rotation.z = DEF.th; m.position.copy(P(x, z, 0.012)); g.add(m); return m;
      }
      /* 바닥 도트 격자 · 0.5m 간격 · 1.5%는 주황(design.md §2 「켜질 수 있는 자리」) */
      function dotFloorTex(wm, dm, ppm, seed) {
        return canvasTex(Math.round(wm * ppm), Math.round(dm * ppm), function (g, w, h) {
          g.fillStyle = '#EFEFEF'; g.fillRect(0, 0, w, h);
          var s = seed || 7; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
          var st = 0.5 * ppm, d = Math.max(2, Math.round(ppm * 0.06));
          for (var y = st / 2; y < h; y += st) for (var x = st / 2; x < w; x += st) { g.fillStyle = rnd() < 0.015 ? '#FF7F32' : '#D9D9D9'; g.fillRect(Math.round(x - d / 2), Math.round(y - d / 2), d, d); }
        });
      }
      /* 판 앞면 · 아틀라스 칸을 UV 로 잘라 쓴다(여백 2px 안쪽) */
      function atlasMat(p) {
        var a = D.ATLAS.at[p], m = new T.MeshBasicMaterial({ color: 0xffffff });
        if (a) atlasMats[a[0]].push(m);
        return m;
      }
      function atlasUV(geo, p) {
        var a = D.ATLAS.at[p]; if (!a) return geo;
        var S = D.ATLAS.size[a[0]], u0 = (a[1] + 2) / S, u1 = (a[1] + a[3] - 2) / S, v1 = 1 - (a[2] + 2) / S, v0 = 1 - (a[2] + a[4] - 2) / S;
        var uv = geo.attributes.uv;
        for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0);
        uv.needsUpdate = true; return geo;
      }
      function panelFace(g, p, w, h, zid) {
        var f = new T.Mesh(atlasUV(new T.PlaneGeometry(w, h), p), atlasMat(p));
        f.userData = { pg: p, zone: zid || null, size: D.pgSize(p) }; g.add(f); picks.push(f);
        if (!faces[p] || zid) faces[p] = f;
        return f;
      }
      function addPanel(g, p, c, nv, y0, zid) {
        var s = D.pgSize(p), ry = Math.atan2(nv.x, nv.z);
        var back = box(g, s[0], s[1], 0.04, '#FFFFFF', c.x, y0 + s[1] / 2, c.z, ry);
        back.userData = { zone: zid || null, pg: p }; picks.push(back);
        var f = panelFace(g, p, s[0] * 0.985, s[1] * 0.985, zid);
        f.position.copy(c).addScaledVector(nv, 0.022); f.position.y = y0 + s[1] / 2; f.rotation.y = ry;
        return f;
      }
      function shadowPad(g, cx, cz, w, d, ry) { var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ color: 0x191F28, transparent: true, opacity: 0.07, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.rotation.z = ry || 0; m.position.set(cx, 0.006, cz); g.add(m); }
      function tv(g, c, ry) {
        box(g, 0.05, 1.1, 0.05, '#DADDE1', c.x, 0.55, c.z, ry); box(g, 0.5, 0.03, 0.5, '#DADDE1', c.x, 0.015, c.z, ry);
        box(g, 1.23, 0.71, 0.05, '#2B2F33', c.x, 1.45, c.z, ry);
      }
      function buildRow(g, z, row) {
        var a = P(row.a[0], row.a[1]), rv = N3(row.r), nv = N3(row.n), n = row.pages.length, ry = Math.atan2(nv.x, nv.z);
        row.pages.forEach(function (p, i) { addPanel(g, p, a.clone().addScaledVector(rv, i + 0.5), nv, 0.06, z.id); });
        for (var i = 0; i <= n; i++) { var c = a.clone().addScaledVector(rv, i); box(g, 0.04, 2.66, 0.06, '#C3C9D0', c.x, 1.33, c.z, ry); }
        var mid = a.clone().addScaledVector(rv, n / 2);
        box(g, n + 0.04, 0.05, 0.06, '#C3C9D0', mid.x, 2.62, mid.z, ry);
        box(g, n + 0.04, 0.06, 0.08, '#C3C9D0', mid.x, 0.03, mid.z, ry);
        /* 측면 판(PDF 「+ 2ea(측면)」) · 줄 양 끝에서 뒤로 */
        [0, n].forEach(function (k) { var c = a.clone().addScaledVector(rv, k).addScaledVector(nv, -0.25); box(g, 0.04, 2.5, 0.5, '#FFFFFF', c.x, 1.31, c.z, ry); });
        shadowPad(g, mid.x - nv.x * 0.05, mid.z - nv.z * 0.05, n + 0.4, 0.5, ry);
        (row.tv || []).forEach(function (i) { tv(g, a.clone().addScaledVector(rv, i + 0.5).addScaledVector(nv, 0.75), ry); });
        if (row.desk) {
          var k = row.desk, dw = Math.min(1.2, (n - 0.2) / k);
          for (var j = 0; j < k; j++) {
            var off = k === 1 ? n / 2 : (n - (row.tv && row.tv.indexOf(0) >= 0 ? 1.2 : 0)) * (j + 0.5) / k + (row.tv && row.tv.indexOf(0) >= 0 ? 1.2 : 0);
            var dc = a.clone().addScaledVector(rv, off).addScaledVector(nv, 0.95);
            box(g, dw - 0.1, 0.05, 0.6, '#E9DCC8', dc.x, 0.9, dc.z, ry); box(g, dw - 0.16, 0.86, 0.04, '#E2D3BD', dc.x - nv.x * 0.26, 0.45, dc.z - nv.z * 0.26, ry);
            if (z.id === 'play') { box(g, 0.34, 0.02, 0.24, '#3A3F45', dc.x, 0.935, dc.z, ry); box(g, 0.34, 0.22, 0.015, '#3A3F45', dc.x - nv.x * 0.11, 1.05, dc.z - nv.z * 0.11, ry); }
          }
        }
        if (row.sign != null && z.signPg) {
          var sc = a.clone().addScaledVector(rv, row.sign + 0.65);
          box(g, 1.34, 0.44, 0.05, '#FF7F32', sc.x, 2.87, sc.z, ry);
          var sf = panelFace(g, z.signPg, 1.3, 0.4, z.id); sf.position.copy(sc).addScaledVector(nv, 0.03); sf.position.y = 2.87; sf.rotation.y = ry;
        }
        return { a: a, rv: rv, nv: nv, n: n, mid: mid };
      }
      function buildPad(g, zid, cx, cz, w, d, ry) {
        var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ color: 0xFFF1E8 })); m.rotation.x = -Math.PI / 2; m.rotation.z = ry; m.position.set(cx, 0.008, cz); g.add(m);
        m.userData = { zone: zid }; picks.push(m); (pads[zid] = pads[zid] || []).push(m);
        var hw = w / 2, hd = d / 2, pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(function (q) { return new T.Vector3(q[0], q[1], 0); });
        var ln = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xFF7F32, transparent: true, opacity: 0 }));
        ln.rotation.copy(m.rotation); ln.position.copy(m.position); ln.position.y = 0.012; g.add(ln); (padLines[zid] = padLines[zid] || []).push(ln);
      }

      function buildLobby() {
        var g = new T.Group();
        var sh = new T.Shape();
        BLD.outline.forEach(function (q, i) { var x = q[0] - 16, y = q[1] - 6; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); });
        var ft = dotFloorTex(32.5, 24.5, 48, 11); ft.wrapS = ft.wrapT = T.ClampToEdgeWrapping; ft.repeat.set(1 / 32.5, 1 / 24.5); ft.offset.set(16 / 32.5, 6 / 24.5);
        var base = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: false }), [new T.MeshBasicMaterial({ map: ft }), lam('#D3D7DC')]);
        base.rotation.x = -Math.PI / 2; base.position.y = -0.45; g.add(base);
        /* 동쪽 출입문 밖 · 체크인 마당 */
        var O = BLD.outside, oc = P((O.x0 + O.x1) / 2, (O.z0 + O.z1) / 2);
        box(g, O.x1 - O.x0, 0.3, O.z1 - O.z0, '#E1E4E8', oc.x, -0.15, oc.z);
        floorLabel(g, '건물 밖', (O.x0 + O.x1) / 2, O.z1 - 0.5, 0.42, { color: '#8B95A1' });
        /* 행사 구역 아님(고객 동선) */
        var hz = canvasTex(256, 256, function (c, w, h) { c.fillStyle = '#E6E8EB'; c.fillRect(0, 0, w, h); c.strokeStyle = '#D3D7DC'; c.lineWidth = 10; for (var i = -h; i < w; i += 40) { c.beginPath(); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke(); } });
        hz.wrapS = hz.wrapT = T.RepeatWrapping; hz.repeat.set(3, 4);
        var hm = new T.Mesh(new T.PlaneGeometry(BLD.hatch.w, BLD.hatch.d), new T.MeshBasicMaterial({ map: hz })); hm.rotation.x = -Math.PI / 2; hm.position.copy(P(BLD.hatch.at[0], BLD.hatch.at[1], 0.004)); g.add(hm);
        floorLabel(g, '행사 구역 아님 · 고객 동선', BLD.hatch.at[0], BLD.hatch.at[1], 0.55, { color: '#8B95A1' });
        /* 코어 */
        BLD.cores.forEach(function (xx) { var w = xx[1] - xx[0], c = P((xx[0] + xx[1]) / 2, 15.65); box(g, w, 0.5, 7.7, '#E1E4E8', c.x, 0.25, c.z); var m = floorLabel(g, '엘리베이터 · 계단', (xx[0] + xx[1]) / 2, 15.6, 0.5, { color: '#8B95A1' }); m.position.y = 0.52; });
        floorLabel(g, '엘리베이터 홀', BLD.hall, 14.5, 0.5);
        /* 남쪽 유리벽 · 회전문 · 옆문 */
        var gl = new T.MeshLambertMaterial({ color: 0xF4F6F8, transparent: true, opacity: 0.28, depthWrite: false });
        var glass = new T.Mesh(new T.PlaneGeometry(32.5, 3.4), gl); glass.position.copy(P(16.25, 0.02, 1.7)); g.add(glass);
        for (var x = 0; x <= 32.5; x += 1.625) box(g, 0.05, 3.4, 0.08, '#C3C9D0', x - 16, 1.7, 6);
        box(g, 32.6, 0.08, 0.1, '#C3C9D0', 0.25, 3.4, 6);
        var rd = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 2.4, 32, 1, true, 0, Math.PI), new T.MeshLambertMaterial({ color: 0xE9ECEF, transparent: true, opacity: 0.55, side: T.DoubleSide, depthWrite: false }));
        rd.position.copy(P(BLD.revolve, 0.0, 1.2)); g.add(rd);
        floorLabel(g, '정문 · 회전문', BLD.revolve, 2.4, 0.5, { color: '#4E5968', w: 700 });
        floorLabel(g, '동쪽 출입문', 31.4, (BLD.doorE[0] + BLD.doorE[1]) / 2, 0.4);
        /* 낮은 외벽 */
        var wallC = '#D9DDE2';
        box(g, 0.2, 0.9, 24.5, wallC, -16.1, 0.45, 6 - 12.25);
        var eA = P(32.6, BLD.doorE[0] / 2), eB = P(32.6, (BLD.doorE[1] + 19.5) / 2);
        box(g, 0.2, 0.9, BLD.doorE[0], wallC, eA.x, 0.45, eA.z); box(g, 0.2, 0.9, 19.5 - BLD.doorE[1], wallC, eB.x, 0.45, eB.z);
        box(g, 6.8, 0.9, 0.2, wallC, P(3.4, 24.5).x, 0.45, P(3.4, 24.5).z);
        box(g, 0.2, 0.9, 5.0, wallC, P(6.8, 22).x, 0.45, P(6.8, 22).z);
        /* 미팅룸 3칸(서쪽 날개) + 롱테이블 */
        BLD.rooms.forEach(function (r) {
          var cz = (r[0] + r[1]) / 2, d = r[1] - r[0], c = P(1.9, cz);
          box(g, 3.4, 1.0, 0.12, wallC, c.x, 0.5, P(1.9, r[0]).z); box(g, 3.4, 1.0, 0.12, wallC, c.x, 0.5, P(1.9, r[1]).z);
          box(g, 0.12, 1.0, d, wallC, P(3.6, cz).x, 0.5, c.z);
          box(g, 1.6, 0.74, 0.9, '#E9DCC8', c.x, 0.37, c.z);
          floorLabel(g, r[2], 1.9, cz - 1.2, 0.42);
        });
        var lt = P(5.55, 17.5); box(g, 0.9, 0.74, 3.9, '#E9DCC8', lt.x, 0.37, lt.z);
        /* 기둥 4개 · 면마다 ME to WE 포스터 · 서쪽 벽 기둥 · 흉상 · 건물 안내데스크 */
        BLD.cols.forEach(function (x) {
          var c = P(x, BLD.colZ); box(g, 0.9, 3.0, 0.9, '#E8EBEE', c.x, 1.5, c.z);
          [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(function (n) { var nv = N3(n), f = panelFace(g, 46, 0.62, 0.88, null); f.position.set(c.x + nv.x * 0.456, 1.55, c.z + nv.z * 0.456); f.rotation.y = Math.atan2(nv.x, nv.z); });
        });
        var pc = P(BLD.pier[0], BLD.pier[1]); box(g, 1.0, 3.0, 1.0, '#E8EBEE', pc.x, 1.5, pc.z);
        var bc = P(BLD.bust[0], BLD.bust[1]); var bs = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 1.1, 24), lam('#D9DDE2')); bs.position.set(bc.x, 0.55, bc.z); g.add(bs);
        floorLabel(g, '흉상', BLD.bust[0], BLD.bust[1] - 0.9, 0.32);
        var dc = P(BLD.desk[0], BLD.desk[1]); box(g, 4.4, 1.05, 0.8, '#E1E4E8', dc.x, 0.525, dc.z); floorLabel(g, '안내데스크(건물)', BLD.desk[0], BLD.desk[1] - 1.0, 0.34);

        /* 구역 */
        D.ZONES.forEach(function (z) {
          if (!z.rows.length) return;
          var rs = z.rows.map(function (row) { return buildRow(g, z, row); });
          rs.forEach(function (r) { var pcn = r.mid.clone().addScaledVector(r.nv, 1.2); buildPad(g, z.id, pcn.x, pcn.z, r.n + 0.6, 1.9, Math.atan2(r.nv.x, r.nv.z)); });
          if (z.area) { var ac = P((z.area[0] + z.area[1]) / 2, (z.area[2] + z.area[3]) / 2); buildPad(g, z.id, ac.x, ac.z, z.area[1] - z.area[0], z.area[3] - z.area[2], 0); }
          zones[z.id] = rs;
          var zb = new T.Box3(); rs.forEach(function (r) { zb.expandByPoint(r.a); zb.expandByPoint(r.a.clone().addScaledVector(r.rv, r.n)); });
          var zc = zb.getCenter(new T.Vector3()); anchors[z.id] = new T.Vector3(zc.x, z.signPg ? 3.45 : 3.0, zc.z);   /* 칩 = 구역 판 줄 가운데 위(간판 자리 위에 두면 이웃 구역 칩과 겹친다) */
        });
        /* EVENT 소품 · 포토부스 기 제작품 · 룰렛 휠 · 타자왕 배너 */
        var pb = P(D.PROPS.photobooth[0], D.PROPS.photobooth[1]); box(g, 1.8, 2.3, 2.2, '#FFFFFF', pb.x, 1.15, pb.z); box(g, 1.82, 0.18, 2.22, '#FF7F32', pb.x, 2.2, pb.z);
        var wt = canvasTex(256, 256, function (c) { var cols = ['#FF7F32', '#FFB284', '#FFD8C1', '#FFEBE0', '#FFFFFF']; for (var i = 0; i < 10; i++) { c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 124, i * Math.PI / 5, (i + 1) * Math.PI / 5); c.closePath(); c.fillStyle = cols[i % 5]; c.fill(); } c.lineWidth = 6; c.strokeStyle = '#FF7F32'; c.beginPath(); c.arc(128, 128, 124, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(128, 128, 18, 0, Math.PI * 2); c.fill(); });
        var wc = P(D.PROPS.wheel[0], D.PROPS.wheel[1]), wh = new T.Mesh(new T.CircleGeometry(0.55, 40), new T.MeshBasicMaterial({ map: wt })); wh.position.set(wc.x, 1.25, wc.z); wh.rotation.y = Math.PI / 2; g.add(wh);
        box(g, 0.05, 0.7, 0.05, '#DADDE1', wc.x - 0.03, 0.35, wc.z); wh.userData = { zone: 'event' }; picks.push(wh);
        [D.PROPS.typingBanner].forEach(function (o) { var nv = N3(o.n), c = P(o.at[0], o.at[1]); box(g, 0.4, 0.04, 0.04, '#C3C9D0', c.x, 0.02, c.z, Math.atan2(nv.x, nv.z)); addPanel(g, o.pg, c, nv, 0.08, 'event'); });
        /* 체크인 몽골텐트(건물 밖 · 앞만 열림) · 현수막 40 · 배너 47 */
        var ci = D.PROPS.checkin, tc = P(ci.at[0], ci.at[1]), tn = N3(ci.n), tr = Math.atan2(tn.x, tn.z);
        box(g, 3.0, 2.3, 0.05, '#FFFFFF', tc.x - tn.x * 1.5, 1.15, tc.z - tn.z * 1.5, tr);
        box(g, 0.05, 2.3, 3.0, '#FFFFFF', tc.x, 1.15, tc.z - 1.5); box(g, 0.05, 2.3, 3.0, '#FFFFFF', tc.x, 1.15, tc.z + 1.5);
        var roof = new T.Mesh(new T.ConeGeometry(2.15, 1.3, 4, 1), lam('#FFFFFF')); roof.position.set(tc.x, 2.95, tc.z); roof.rotation.y = Math.PI / 4; g.add(roof);
        box(g, 1.8, 0.74, 0.7, '#F2F4F6', tc.x + tn.x * 0.3, 0.37, tc.z + tn.z * 0.3, tr);
        var cf = panelFace(g, ci.cloth, 2.8, 0.6, null); cf.position.set(tc.x + tn.x * 1.52, 2.0, tc.z + tn.z * 1.52); cf.rotation.y = tr;
        var bo = ci.banner, bn = N3(bo.n), bpos = P(bo.at[0], bo.at[1]); addPanel(g, bo.pg, bpos, bn, 0.08, null);
        anchors.checkin = new T.Vector3(tc.x, 3.7, tc.z);
        return g;
      }

      /* 18F 커피챗 장면 · 탁자 1컷 + 멘토 캐릭터(챗봇 원본 path 합성 · design.md A-4 「합성만」) */
      var BOT_PATHS = [
        ['M104.68 56.4898V43.0698C103.23 43.6498 101.66 43.9698 100 43.9698C98.3401 43.9698 96.7601 43.6398 95.3101 43.0598V56.4798C64.7401 58.8698 40.6701 84.4198 40.6701 115.6H40.6201V128.09H159.32V115.6C159.32 84.4098 135.25 58.8698 104.68 56.4798V56.4898Z', '#FFC56E'],
        ['M149.96 156.2H50.0399C44.8699 156.2 40.6699 152 40.6699 146.83V131.22H159.32V146.83C159.32 152 155.12 156.2 149.95 156.2', '#FF7F32'],
        ['M112.67 31.3099C112.67 38.2999 107 43.9699 100.01 43.9699C93.0203 43.9699 87.3403 38.2999 87.3403 31.3099C87.3403 24.3199 93.0103 18.6499 100.01 18.6499C107.01 18.6499 112.67 24.3199 112.67 31.3099Z', '#FF7F32'],
        ['M86.5902 99.9999C86.5902 102.94 84.2002 105.33 81.2602 105.33C78.3202 105.33 75.9302 102.94 75.9302 99.9999C75.9302 97.0599 78.3202 94.6699 81.2602 94.6699C84.2002 94.6699 86.5902 97.0599 86.5902 99.9999Z', '#282320'],
        ['M124.06 99.9999C124.06 102.94 121.67 105.33 118.73 105.33C115.79 105.33 113.4 102.94 113.4 99.9999C113.4 97.0599 115.79 94.6699 118.73 94.6699C121.67 94.6699 124.06 97.0599 124.06 99.9999Z', '#282320']
      ];
      var CAFE_X = 70;
      function buildCafe() {
        var g = new T.Group(); g.position.x = CAFE_X;
        var ft = dotFloorTex(10, 7, 64, 5);
        var base = new T.Mesh(new T.BoxGeometry(10, 0.45, 7), [lam('#D3D7DC'), lam('#D3D7DC'), new T.MeshBasicMaterial({ map: ft }), lam('#D3D7DC'), lam('#D3D7DC'), lam('#D3D7DC')]);
        base.position.y = -0.225; g.add(base);
        var gl = new T.MeshLambertMaterial({ color: 0xF4F6F8, transparent: true, opacity: 0.3, depthWrite: false });
        var w1 = new T.Mesh(new T.PlaneGeometry(10, 3.0), gl); w1.position.set(0, 1.5, -3.5); g.add(w1);
        for (var x = -5; x <= 5; x += 1.25) box(g, 0.05, 3.0, 0.08, '#C3C9D0', x, 1.5, -3.5);
        box(g, 0.2, 0.9, 7, '#D9DDE2', -5, 0.45, 0);
        function table(x, z, r) {
          var t = new T.Mesh(new T.CylinderGeometry(r, r, 0.05, 40), lam('#E9DCC8')); t.position.set(x, 0.74, z); g.add(t);
          var l = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.72, 12), lam('#C3C9D0')); l.position.set(x, 0.36, z); g.add(l);
          for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2 + Math.PI / 4, cx = x + Math.sin(a) * (r + 0.42), cz = z + Math.cos(a) * (r + 0.42); box(g, 0.46, 0.46, 0.46, '#FFFFFF', cx, 0.23, cz, a); box(g, 0.46, 0.5, 0.06, '#FFFFFF', cx + Math.sin(a) * 0.2, 0.7, cz + Math.cos(a) * 0.2, a); }
        }
        table(0, 0.3, 0.62); table(-3.2, -1.6, 0.45); table(3.2, -1.6, 0.45);
        [[-0.18, 0.15], [0.2, 0.42]].forEach(function (q) { var b = new T.Mesh(new T.CylinderGeometry(0.04, 0.045, 0.22, 16), lam('#8A5A3C')); b.position.set(q[0], 0.88, q[1]); g.add(b); var c = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.04, 12), lam('#FF7F32')); c.position.set(q[0], 1.01, q[1]); g.add(c); });
        var tt = textTex('AX 커피챗', { fs: 64, w: 700, color: '#FFFFFF', bg: '#FF7F32' });
        var tent = new T.Mesh(new T.PlaneGeometry(0.42, 0.42 / tt.userData.aspect), new T.MeshBasicMaterial({ map: tt })); tent.position.set(0.25, 0.83, -0.05); tent.rotation.y = 0.5; g.add(tent);
        var bt = canvasTex(512, 512, function (c) { c.scale(512 / 200, 512 / 200); BOT_PATHS.forEach(function (p) { c.fillStyle = p[1]; c.fill(new Path2D(p[0])); }); });
        var sp = new T.Sprite(new T.SpriteMaterial({ map: bt })); sp.scale.set(1.15, 1.15, 1); sp.position.set(-0.55, 1.15, -0.5); g.add(sp);
        var fl = textTex('18F', { fs: 120, w: 800, color: '#C9CED4' }); var fm = new T.Mesh(new T.PlaneGeometry(1.6, 1.6 / fl.userData.aspect), new T.MeshBasicMaterial({ map: fl, transparent: true, depthWrite: false })); fm.rotation.x = -Math.PI / 2; fm.position.set(3.4, 0.012, 2.4); g.add(fm);
        g.traverse(function (o) { if (o.isMesh || o.isSprite) { o.userData = o.userData || {}; o.userData.zone = 'cafe'; picks.push(o); } });
        g.visible = false; return g;
      }

      var lobby = buildLobby(), cafe = buildCafe();
      anchors.cafe = new T.Vector3(CAFE_X - 0.55, 1.9, -0.5);
      return {
        lobby: lobby, cafe: cafe, picks: picks, faces: faces, anchors: anchors,
        DEF: DEF, CAFE_DEF: { t: new T.Vector3(CAFE_X - 0.3, 1.0, -0.2), r: 11.5, th: 0.55, ph: 1.12 }, cafeX: CAFE_X,
        bubbleAt: new T.Vector3(CAFE_X - 0.55, 1.85, -0.5),
        limits: function (scn) { return scn === 'cafe' ? { x: [CAFE_X - 5, CAFE_X + 5], z: [-3.5, 3.5] } : { x: [-17, 23], z: [-19, 7] }; },
        zoneBox: function (zid) {
          var rs = zones[zid]; if (!rs) return null;
          var bb = new T.Box3();
          rs.forEach(function (r) { bb.expandByPoint(r.a); bb.expandByPoint(r.a.clone().addScaledVector(r.rv, r.n)); bb.expandByPoint(r.mid.clone().addScaledVector(r.nv, 1.6)); });
          var c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3()), nv = rs[0].nv;
          var along = Math.abs(rs[0].rv.x) > 0.5 ? sz.x : sz.z;
          c.y = 1.35; return { t: c, w: along + 1.2, h: 3.6, th: Math.atan2(nv.x, nv.z) + 0.32 };
        },
        mark: function (zid) {
          for (var id in pads) {
            var on = id === zid;
            pads[id].forEach(function (m) { m.material.color.set(on ? 0xFFD8C1 : 0xFFF1E8); });
            (padLines[id] || []).forEach(function (l) { l.material.opacity = on ? 1 : 0; });
          }
        },
        setAtlas: function (i, tex) { atlasMats[i].forEach(function (m) { m.map = tex; m.needsUpdate = true; }); }
      };
    }
  };
})();
