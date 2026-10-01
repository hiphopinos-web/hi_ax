/* AX Festival 2026 럭키드로우 · QR 만들기(브라우저 안 · 외부 라이브러리 없음)
 * 바이트 모드 · 오류 정정 M · 버전 1~10 중 가장 작은 것 · 마스크 8개 중 벌점이 가장 낮은 것(ISO/IEC 18004 규칙)
 * 체크인 QR 한 장만 그린다(앱 주소 #s=AXD…) · 일반 QR(흰 바탕 · 검정 정사각 · 여백 4칸)
 * 쓰는 법: var q = AXQR.make("https://…"); q.size · q.get(x, y) → true(검정) */
(function () {
  "use strict";
  var ECC_M = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];   /* 블록당 오류 정정 코드어 수(M) */
  var BLK_M = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];              /* 블록 수(M) */
  var FMT_M = 0;                                               /* 형식 정보의 오류 정정 단계 비트(M = 00) */

  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) { var na = Math.floor(ver / 7) + 2; r -= (25 * na - 10) * na - 55; if (ver >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(ver) { return Math.floor(rawModules(ver) / 8) - ECC_M[ver] * BLK_M[ver]; }
  function alignPos(ver) {
    if (ver === 1) return [];
    var na = Math.floor(ver / 7) + 2, size = ver * 4 + 17, step = Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2, out = [6];
    for (var p = size - 7; out.length < na; p -= step) out.splice(1, 0, p);
    return out;
  }
  /* GF(256) · 원시 다항식 0x11D */
  function gmul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function rsDivisor(deg) {
    var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1);
    var root = 1;
    for (i = 0; i < deg; i++) { for (var j = 0; j < r.length; j++) { r[j] = gmul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = gmul(root, 2); }
    return r;
  }
  function rsRemainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); div.forEach(function (c, i) { r[i] ^= gmul(c, f); }); });
    return r;
  }
  function utf8(s) { var out = [], e = unescape(encodeURIComponent(s)); for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i)); return out; }

  function make(text) {
    var bytes = utf8(text), ver;
    for (ver = 1; ver <= 10; ver++) if (4 + (ver < 10 ? 8 : 16) + bytes.length * 8 <= dataCodewords(ver) * 8) break;
    if (ver > 10) throw new Error("QR 내용이 깁니다");
    /* 1. 데이터 비트 */
    var bits = [];
    function put(v, n) { for (var i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); }
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCodewords(ver) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) { var v = 0; for (var k = 0; k < 8; k++) v = (v << 1) | bits[i + k]; data.push(v); }
    /* 2. 오류 정정 · 블록 나누기 · 엇갈려 담기 */
    var nb = BLK_M[ver], el = ECC_M[ver], raw = Math.floor(rawModules(ver) / 8), nShort = nb - raw % nb, sLen = Math.floor(raw / nb);
    var div = rsDivisor(el), blocks = [], at = 0;
    for (i = 0; i < nb; i++) {
      var d = data.slice(at, at + sLen - el + (i < nShort ? 0 : 1)); at += d.length;
      var ecc = rsRemainder(d, div);
      if (i < nShort) d.push(0);
      blocks.push(d.concat(ecc));
    }
    var cw = [];
    for (i = 0; i < blocks[0].length; i++) for (var j = 0; j < blocks.length; j++) if (i !== sLen - el || j >= nShort) cw.push(blocks[j][i]);
    /* 3. 기능 패턴 */
    var size = ver * 4 + 17, M = [], F = [];
    for (i = 0; i < size; i++) { M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    function setF(x, y, dark) { M[y][x] = dark; F[y][x] = true; }
    for (i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var x = c[0] + dx, y = c[1] + dy, dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, dist !== 2 && dist !== 4);
      }
    });
    var ap = alignPos(ver), na = ap.length;
    for (i = 0; i < na; i++) for (j = 0; j < na; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) setF(ap[i] + dx2, ap[j] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
    }
    function drawFormat(mask) {
      var dat = FMT_M << 3 | mask, rem = dat;
      for (var q = 0; q < 10; q++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var b = (dat << 10 | rem) ^ 0x5412;
      function g(n) { return ((b >>> n) & 1) !== 0; }
      for (q = 0; q <= 5; q++) setF(8, q, g(q));
      setF(8, 7, g(6)); setF(8, 8, g(7)); setF(7, 8, g(8));
      for (q = 9; q < 15; q++) setF(14 - q, 8, g(q));
      for (q = 0; q < 8; q++) setF(size - 1 - q, 8, g(q));
      for (q = 8; q < 15; q++) setF(8, size - 15 + q, g(q));
      setF(8, size - 8, true);
    }
    drawFormat(0);
    if (ver >= 7) {                                  /* 버전 정보(7 이상) */
      var rem2 = ver; for (i = 0; i < 12; i++) rem2 = (rem2 << 1) ^ ((rem2 >>> 11) * 0x1F25);
      var vb = ver << 12 | rem2;
      for (i = 0; i < 18; i++) { var bt = ((vb >>> i) & 1) !== 0, a = size - 11 + i % 3, bb = Math.floor(i / 3); setF(a, bb, bt); setF(bb, a, bt); }
    }
    /* 4. 코드어 배치(지그재그) */
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) {
        var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!F[y][x] && bi < cw.length * 8) { M[y][x] = ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; }
      }
    }
    /* 5. 마스크 · 벌점이 가장 낮은 것 */
    function maskFn(m, x, y) {
      switch (m) {
        case 0: return (x + y) % 2 === 0; case 1: return y % 2 === 0; case 2: return x % 3 === 0; case 3: return (x + y) % 3 === 0;
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; case 5: return x * y % 2 + x * y % 3 === 0;
        case 6: return (x * y % 2 + x * y % 3) % 2 === 0; default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
      }
    }
    function applyMask(m) { for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) if (!F[yy][xx] && maskFn(m, xx, yy)) M[yy][xx] = !M[yy][xx]; }
    function penalty() {
      var p = 0, x, y, run, dark = 0;
      function line(get) {                            /* 같은 색 5칸 이상 · 1:1:3:1:1 비슷한 무늬 */
        for (var a = 0; a < size; a++) {
          run = 1;
          for (var b = 1; b <= size; b++) {
            if (b < size && get(a, b) === get(a, b - 1)) run++;
            else { if (run >= 5) p += run - 2; run = 1; }
          }
          for (b = 0; b + 10 < size; b++) {
            var s = ""; for (var k = 0; k < 11; k++) s += get(a, b + k) ? "1" : "0";
            if (s === "10111010000" || s === "00001011101") p += 40;
          }
        }
      }
      line(function (a, b) { return M[a][b]; }); line(function (a, b) { return M[b][a]; });
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (M[y][x]) dark++;
      var total = size * size, kk = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      return p + Math.max(0, kk) * 10;
    }
    var best = 0, bestP = 1e9;
    for (var m = 0; m < 8; m++) { applyMask(m); drawFormat(m); var pp = penalty(); if (pp < bestP) { bestP = pp; best = m; } applyMask(m); }
    applyMask(best); drawFormat(best);
    return { size: size, ver: ver, mask: best, get: function (x, y) { return x >= 0 && y >= 0 && x < size && y < size && M[y][x]; } };
  }
  window.AXQR = { make: make };
})();
