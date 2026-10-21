/* 1F 타자왕 · 55인치 가로 LED 대기 루프 · 1위 바뀜 띠 (261021 · 제3 송출 화면 · 예비 노트북 3 · 플랜 B)
 * 주소: tv/typing/?live=1&seats=1,2&o=land (+ &test=1 리허설 · &demo=1 가짜 순위)  · seats 가 없거나 o=port 면 곧바로 나간다(세로 TV · 옛 화면 그대로)
 * 화면 셋(한 화면에 한 가지) = 하는 법(노트북 화면 QR 찍기 · SPACE로 시작 · 떨어지는 단어 입력) 8초 · 상품 7초 · 오늘 순위 TOP 10 13초 · 행사일 17:00 뒤 = 순위 · 상품
 *   데이터 = 광고 루프(typing.js)가 30초마다 받는 type_rank TOP 10(window.__ty.rk) · 이 파일은 서버를 부르지 않는다 · 가상 이름 채우기는 세로 TV 와 같은 규칙(TY.fillTop)
 *   세로 광고 루프(#stage)는 숨기고 그리기도 멈춘다(TY.hold) · 판이 오면 live.js 가 중계를 덮고 idle(false) · 판이 다 끝나면 idle(true, "rank" | "ad")
 * 움직임 = 장면이 바뀔 때만(들어옴 0.45초 · 사라짐 0.3초 · 곡선 하나) · 1위 바뀜 띠 = 새 기록이 들어온 때만 · QR 그림 · 사번 · 실명 없음(닉네임만) */
(function () {
  "use strict";
  var Q = {}; location.search.replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var i = kv.indexOf("="); var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i)); Q[k] = i < 0 ? "1" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); });
  if (Q.live !== "1" || Q.promo === "1") return;
  var LEDS = []; String(Q.seats || "").split(",").forEach(function (s) { s = s.trim(); if (/^[123]$/.test(s) && LEDS.indexOf(Number(s)) < 0) LEDS.push(Number(s)); });
  if (!LEDS.length || Q.o === "port") return;
  var TY = window.__ty; if (!TY) return;
  var body = document.body;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return Math.round(n || 0).toLocaleString("en-US"); }
  function score(v, unit) { return unit === "cs" ? (Number(v || 0) / 100).toFixed(1) + "초" : fmt(v) + (unit === "pts" ? "점" : ""); }
  var CLOSE_TXT = /^\d{1,2}:\d{2}/.test(Q.close || "") ? ("0" + Q.close).slice(-5) : "17:00";
  var DUR = { how: 8000, prize: 7000, rank: 13000 }, OUT_MS = 300, BN_MS = 3600;

  body.classList.add("led");
  if (TY.hold) TY.hold(true);   /* 세로 광고 루프 그리기 멈춤 · 순위 폴링(30초)은 그대로 */
  var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "assets/led.css?v=261021a"; document.head.appendChild(css);

  /* ── 겉모습 ── */
  var STEP = [
    ['<div class="lsNtb"><div class="lsScr"><i></i></div></div>', '노트북 화면 <b>QR</b> 찍기'],
    ['<div class="lsKey">SPACE</div>', '<b>SPACE</b>로 시작'],
    ['<div class="lsWd"><span class="a">프롬프트</span><span class="b">AI</span></div>', '떨어지는 <b>단어</b> 입력']];
  var PRZ = [
    ["1", "ty1_cherry_lp10.webp", "기계식 키보드", "체리 MX Board 10.0<br>Low Profile"],
    ["2", "ty2_mxmaster4.webp", "마우스", "로지텍 MX Master 4"],
    ["3", "ty3_aula.webp", "기계식 키보드", "AULA F108 Pro"]];
  var L = document.createElement("div"); L.id = "led"; L.setAttribute("aria-hidden", "true");
  var h = '<div id="ledSt"><div id="ledHd"><b>AX 타자왕 · 1F</b><span>AX Festival 2026</span></div>';
  h += '<div class="ls" id="lsHow"><div class="lsH"><i>1F 로비</i> 노트북에서 도전</div>' + STEP.map(function (s, i) {
    return '<div class="lsSt lsIn" style="left:' + (84 + i * 604) + 'px"><div class="lsBx">' + s[0] + '</div><div class="lsNo">' + (i + 1) + '</div><div class="lsLb">' + s[1] + "</div></div>";
  }).join("") + "</div>";
  h += '<div class="ls" id="lsPz">' + PRZ.map(function (p, i) {
    return '<div class="lsPc lsIn' + (i ? "" : " p1") + '" style="left:' + (84 + i * 604) + 'px"><span class="no">' + p[0] + '</span><span class="im"><img src="../../assets/prize/' + p[1] + '" alt=""></span><b>' + p[2] + "</b><small>" + p[3] + "</small></div>";
  }).join("") + '<div class="lsPf lsIn">4~10위 데스크 매트 · <b id="lsCl"></b></div></div>';
  h += '<div class="ls" id="lsRk"><div class="lsRh lsIn">HIGH SCORE</div><div class="lsRs lsIn" id="lsRs"></div><div id="lsRows"></div><div class="lsRe" id="lsRe"></div><div class="lsRn" id="lsRn"></div></div>';
  h += '<div id="ledNet">연결 다시 시도 중 · 마지막 순위 표시</div><div id="ledDemo">DEMO · 가짜 순위</div></div>';
  L.innerHTML = h;
  body.appendChild(L);
  var B = document.createElement("div"); B.id = "ledTop"; B.setAttribute("aria-hidden", "true");
  B.innerHTML = '<div id="ledBnSt"><div id="ledBn"><i>새 1위</i><b></b><em></em></div></div>';
  body.appendChild(B);
  var ST = $("ledSt"), BST = $("ledBnSt"), BN = $("ledBn");

  /* ── 화면 맞추기 · 1920×1080 논리 판을 배율로 ── */
  var FIT = "";
  function fit() {
    var key = window.innerWidth + "x" + window.innerHeight; if (key === FIT) return; FIT = key;
    var K = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1;
    ST.style.transform = BST.style.transform = "scale(" + K + ")";
    document.documentElement.style.setProperty("--ldot", (36 * K).toFixed(2) + "px");
  }
  window.addEventListener("resize", fit); fit();

  /* ── 순위 줄 · 장면에 들어올 때 한 번 그린다(장면 안에서는 움직이지 않는다) ── */
  function rows() {
    var d = TY.rk && TY.rk.data, top = d && d.top ? d.top : null;
    var list = top ? (TY.fillTop ? TY.fillTop(top) : top) : [];
    var done = TY.closed && TY.closed();
    $("lsRs").textContent = done ? "최종 순위 · 1F 현장" : "1F 현장 TOP 10";
    $("lsRe").textContent = done ? "기록 마감 · 17F 대강당" : CLOSE_TXT + " 마감";
    var n = $("lsRn"), host = $("lsRows"), hh = "";
    if (!list.length) { n.textContent = top ? "첫 기록을 기다리는 중" : "순위를 불러오는 중"; n.style.display = "block"; host.innerHTML = ""; return; }
    n.style.display = "none";
    for (var i = 0; i < 10; i++) {
      var r = list[i], x = i < 5 ? 96 : 984, y = 330 + (i % 5) * 128;
      hh += '<div class="lsR lsIn' + (i < 3 ? " r" + (i + 1) : "") + (r ? "" : " nil") + '" style="left:' + x + "px;top:" + y + 'px"><span class="no">' + (i + 1) + '</span><span class="nm">' + (r ? esc(r.name) : "") + '</span><span class="lsSc">' + (r ? score(r.score, d.unit) : "") + "</span></div>";
    }
    host.innerHTML = hh;
  }

  /* ── 장면 진행 ── */
  var SC = { how: $("lsHow"), prize: $("lsPz"), rank: $("lsRk") };
  var IDLE = false, CUR = "", T = 0, OT = 0, IN_T = 0;
  function order() { return TY.closed && TY.closed() ? ["rank", "prize"] : ["how", "prize", "rank"]; }
  function show(id) {
    clearTimeout(T); clearTimeout(IN_T);
    var prev = CUR ? SC[CUR] : null;
    CUR = id;
    if (prev && prev !== SC[id]) { prev.classList.add("out"); var p0 = prev; setTimeout(function () { p0.classList.remove("on", "out", "in"); }, OUT_MS); }
    IN_T = setTimeout(function () {
      if (!IDLE || CUR !== id) return;
      if (id === "rank") rows();
      if (id === "prize") $("lsCl").textContent = TY.closed && TY.closed() ? "기록 마감" : CLOSE_TXT + " 마감";
      var s = SC[id]; s.classList.remove("out", "in"); s.classList.add("on");
      var a = s.querySelectorAll(".lsIn"); for (var i = 0; i < a.length; i++) a[i].style.transitionDelay = (id === "rank" ? i * 0.05 : i * 0.18).toFixed(2) + "s";
      void s.offsetWidth; s.classList.add("in");
    }, prev && prev !== SC[id] ? OUT_MS : 0);
    T = setTimeout(function () { if (!IDLE) return; var o = order(), k = o.indexOf(CUR); show(o[(k + 1) % o.length]); }, DUR[id] + (prev ? OUT_MS : 0));
  }
  function idle(on, from) {
    clearTimeout(OT);
    if (on) {
      if (IDLE) return; IDLE = true;
      var o = order(); show(from === "rank" && o.indexOf("rank") >= 0 ? "rank" : o[0]);
    } else {
      if (!IDLE) return; IDLE = false; clearTimeout(T); clearTimeout(IN_T);
      OT = setTimeout(function () { if (IDLE) return; Object.keys(SC).forEach(function (k) { SC[k].classList.remove("on", "in", "out"); }); CUR = ""; }, 400);   /* 중계가 덮은 뒤(0.35초) 장면을 내린다 */
    }
  }

  /* ── 오늘 1위가 바뀜 · 띠 3.6초(들어옴 0.45 · 사라짐 0.3) · 화면만 · 점수와 무관 ── */
  var LEAD = null, BOOT = Date.now(), DAT = 0, BT = 0, BQ = [];
  function lead(nick, sc) {
    LEAD = { name: String(nick || ""), score: Number(sc) || 0 };
    BQ.push([LEAD.name, LEAD.score]); if (BQ.length > 2) BQ.shift();
    if (!BT) bnNext();
  }
  function bnNext() {
    var x = BQ.shift(); if (!x) { BT = 0; return; }
    BN.querySelector("b").textContent = x[0]; BN.querySelector("em").textContent = fmt(x[1]) + "점";
    BN.classList.remove("in", "out"); void BN.offsetWidth; BN.classList.add("in");
    BT = setTimeout(function () { BN.classList.add("out"); BT = setTimeout(function () { BN.classList.remove("in", "out"); BT = 0; bnNext(); }, OUT_MS + 100); }, BN_MS);
  }
  setInterval(function () {   /* 순위 응답이 새로 왔을 때만 · 켠 뒤 처음 받은 1위가 기준 · 판 중 띠(live.js)와 같은 이름이면 다시 띄우지 않는다 */
    var d = TY.rk && TY.rk.data; if (!d || !d.at || d.at === DAT || d.at < BOOT) return;
    DAT = d.at;
    var t0 = d.top && d.top[0]; if (!t0 || !(t0.score > 0)) return;
    if (LEAD && t0.name !== LEAD.name) lead(t0.name, t0.score);
    else LEAD = { name: t0.name, score: t0.score };
  }, 1000);

  window.__tyled = { idle: idle, lead: lead, scene: function () { return IDLE ? CUR : ""; }, leader: function () { return LEAD; }, dur: DUR };
  idle(true, "ad");
})();
