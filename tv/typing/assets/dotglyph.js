/* 도트 글자 렌더러 (AX Festival 2026 · 261003 계획 · 데모용 · 앱 코드 아님)
   원본 = 1층 부스 발주 .ai 의 구역 사인(AX VISION · AX LAB · AX LOUNGE · AX PLAY · EVENT) 실측.
   쓰는 법: DotGlyph.svg("AX VISION", { h: 16, color: "currentColor", label: "AX VISION", anim: false })  ->  <svg> 문자열
   영문 대문자 · 숫자 · 기호 / - . : + ! · ? 만. 소문자는 대문자로 바꿔 그린다. 한글 없음(없는 글자는 건너뛴다). */
var DotGlyph = (function () {
  var T = {"A":[".XXX.","X...X","XXXXX","X...X","X...X"],"B":["XXXX.","X...X","XXXXX","X...X","XXXX."],"C":[".XXXX","X....","X....","X....",".XXXX"],"D":["XXXX.","X...X","X...X","X...X","XXXX."],"E":["XXXXX","X....","XXXXX","X....","XXXXX"],"F":["XXXXX","X....","XXXX.","X....","X...."],"G":[".XXXX","X....","X.XXX","X...X",".XXXX"],"H":["X...X","X...X","XXXXX","X...X","X...X"],"I":["X","X","X","X","X"],"J":["....X","....X","....X","X...X",".XXX."],"K":["X...X","X..X.","XXX..","X..X.","X...X"],"L":["X....","X....","X....","X....","XXXXX"],"M":["X...X","XX.XX","X.X.X","X...X","X...X"],"N":["X...X","XX..X","X.X.X","X..XX","X...X"],"O":[".XXX.","X...X","X...X","X...X",".XXX."],"P":["XXXX.","X...X","XXXX.","X....","X...."],"Q":[".XXX.","X...X","X...X","X..XX",".XXXX"],"R":["XXXX.","X...X","XXXX.","X..X.","X...X"],"S":[".XXXX","X....",".XXX.","....X","XXXX."],"T":["XXXXX","..X..","..X..","..X..","..X.."],"U":["X...X","X...X","X...X","X...X",".XXX."],"V":["X...X","X...X","X...X",".X.X.","..X.."],"W":["X...X","X...X","X.X.X","XX.XX","X...X"],"X":["X...X",".X.X.","..X..",".X.X.","X...X"],"Y":["X...X",".X.X.","..X..","..X..","..X.."],"Z":["XXXXX","...X.","..X..",".X...","XXXXX"],"0":[".XXX.","X..XX","X.X.X","XX..X",".XXX."],"1":["..X..",".XX..","..X..","..X..",".XXX."],"2":[".XXX.","X...X","...X.","..X..","XXXXX"],"3":["XXXX.","....X",".XXX.","....X","XXXX."],"4":["X...X","X...X","XXXXX","....X","....X"],"5":["XXXXX","X....","XXXX.","....X","XXXX."],"6":[".XXX.","X....","XXXX.","X...X",".XXX."],"7":["XXXXX","....X","...X.","..X..","..X.."],"8":[".XXX.","X...X",".XXX.","X...X",".XXX."],"9":[".XXX.","X...X",".XXXX","....X",".XXX."],"/":["....X","...X.","..X..",".X...","X...."],"-":["...","...","XXX","...","..."],".":[".",".",".",".","X"],":":[".","X",".","X","."],"+":["...",".X.","XXX",".X.","..."],"!":["X","X","X",".","X"],"·":[".",".","X",".","."],"?":[".XXX.","X...X","...X.",".....","..X.."]};
  var PX = 1, PY = 0.9715, D = 1.3081, R = D * 0.485, LG = 0.571, WG = 2.8563, ORIG = ["A", "B", "E", "G", "I", "L", "N", "O", "P", "S", "T", "U", "V", "X", "Y"];
  function layout(text) {
    var s = String(text).toUpperCase(), x = 0, gap = 0, dots = [], first = true, w = 0, i, c, rows, cols, r, k;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (c === " ") { gap = WG; continue; }
      rows = T[c]; if (!rows) continue;
      if (!first) x += gap; first = false;
      cols = rows[0].length;
      for (k = 0; k < cols; k++) for (r = 0; r < 5; r++) if (rows[r].charAt(k) === "X") dots.push([x + k * PX, r * PY, i]);
      w = x + (cols - 1) * PX + D; x = w; gap = LG;
    }
    return { dots: dots, w: w, h: 4 * PY + D };
  }
  function f(n) { return Math.round(n * 1000) / 1000; }
  /* o.h 글자 높이 px(기본 16) · o.color · o.label 읽어 주는 이름(기본 text) · o.anim true 면 점이 차례로 켜진다(o.step ms · o.total 전체 상한 ms)
     o.cls 추가 클래스 · o.pad 점 한 칸 바깥 여백 없음(원본 사인은 면이 따로 있다) */
  function svg(text, o) {
    o = o || {}; var L = layout(text), h = o.h || 16, u = h / L.h, w = Math.round(L.w * u * 100) / 100;
    var label = o.label == null ? String(text) : o.label, step = o.step || 26, n = L.dots.length;
    if (o.total && n * step > o.total) step = o.total / n;
    var body, ac = o.accent || null;
    function pathOf(ds, color) {
      var r = f(D / 2), ex = !!o.exact;   /* 기본 = 원(점 하나 약 50자 · 12px에서 차이 안 보임) · o.exact = 원본 둥근 사각(점 하나 약 160자 · 큰 인쇄·확대용) */
      var rr = f(R), ss = f(D - 2 * R), ARC = "a" + rr + " " + rr + " 0 0 1 ";
      return '<path' + (color ? ' fill="' + color + '"' : "") + ' d="' + ds.map(function (d) {
        var x = d[0], y = d[1];
        if (ex) return "M" + f(x + R) + " " + f(y) + "h" + ss + ARC + rr + " " + rr + "v" + ss + ARC + "-" + rr + " " + rr + "h-" + ss + ARC + "-" + rr + " -" + rr + "v-" + ss + ARC + rr + " -" + rr + "z";
        return "M" + f(x) + " " + f(y + D / 2) + "a" + r + " " + r + " 0 1 0 " + f(D) + " 0a" + r + " " + r + " 0 1 0 -" + f(D) + " 0z";
      }).join("") + '"/>';
    }
    if (o.anim) {
      body = L.dots.map(function (d, j) { return '<rect class="dgd" x="' + f(d[0]) + '" y="' + f(d[1]) + '" width="' + f(D) + '" height="' + f(D) + '" rx="' + f(R) + '"' + (ac && d[2] < ac.n ? ' fill="' + ac.color + '"' : "") + ' style="animation-delay:' + Math.round(j * step) + 'ms"/>'; }).join("");
    } else if (ac) {   /* o.accent = { n: 앞 글자 n개, color } · 앞 글자만 다른 색(예: AX 주황 + PASSPORT 먹색) */
      body = pathOf(L.dots.filter(function (d) { return d[2] < ac.n; }), ac.color) + pathOf(L.dots.filter(function (d) { return d[2] >= ac.n; }));
    } else {
      body = pathOf(L.dots);
    }
    return '<svg class="dg' + (o.cls ? " " + o.cls : "") + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f(L.w) + " " + f(L.h) + '" width="' + w + '" height="' + h + '" fill="' + (o.color || "currentColor") + '" role="img" aria-label="' + String(label).replace(/"/g, "&quot;") + '"' + (o.style ? ' style="' + o.style + '"' : "") + ">" + body + "</svg>";
  }
  function size(text, h) { var L = layout(text), u = (h || 16) / L.h; return { w: L.w * u, h: h || 16, dots: L.dots.length }; }
  function width(text, h) { var L = layout(text); return L.w * (h || 16) / L.h; }   /* 앱 DotGlyph.width 와 같은 값 · 게임 엔진 제목 카드(rgCardDraw)가 쓴다 */
  return { svg: svg, size: size, width: width, layout: layout, table: T, orig: ORIG, D: D, PY: PY, LG: LG, WG: WG };
})();
