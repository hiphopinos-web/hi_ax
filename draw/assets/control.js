/* 럭키드로우 조작 창 (index.html#control) · 운영자 노트북 화면에 띄운다 · LED 에는 송출 화면만
 * 송출 창이 P 키로 연다(window.opener 로 명령) · 따로 열었으면 BroadcastChannel 로 붙는다 */
window.AXDRAW_CONTROL = function () {
  "use strict";
  document.body.className = "ctl";
  document.documentElement.style.overflow = "auto"; document.documentElement.style.cursor = "auto"; document.documentElement.style.background = "#F2F4F6";
  ["cv", "gl", "fx"].forEach(function (id) { var el = document.getElementById(id); if (el) el.remove(); });
  document.getElementById("frame").remove();
  var S = null, bc = null;
  try { bc = new BroadcastChannel("axf-draw"); bc.onmessage = function (e) { recv(e.data); }; } catch (e) {}
  window.addEventListener("message", function (e) { recv(e.data); });
  function send(m) { m.axd = 1; try { if (window.opener && !window.opener.closed) { window.opener.postMessage(m, "*"); return; } } catch (e) {} try { bc && bc.postMessage(m); } catch (e) {} }
  function cmd(c, a) { send({ type: "cmd", cmd: c, arg: a }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var SCN = { idle: "대기", checkin: "체크인 중", closed: "체크인 마감", nock_checkin: "공 넣는 중", nock_closed: "추첨 준비 끝", card: "등수 카드", mix: "섞는 중", tension: "감속 · 배출 대기", exit: "배출", reveal: "당첨 공개", board: "결과판", fin: "완주 경품 추첨 발표", end: "끝 화면" };
  var NEXT_NOCK = { idle: "추첨 준비 · 공 넣기", checkin: "" };   /* 261006 체크인 없음 · 다 넣으면 저절로 준비 끝 */
  var NEXT = { idle: "체크인 시작", checkin: "체크인 마감(두 번)", closed: "등수 추첨 시작", card: "섞기 시작", mix: "뽑기", reveal: "확정", board: "끝 화면(서버 설정 완주추첨_사용 ON 이면 그 발표 먼저)", fin: "끝 화면", end: "" };   /* 261004 · 송출 화면 nextCmd 와 같은 순서 */

  var css = document.createElement("style");
  css.textContent = [
    "body.ctl{font:15px/1.5 'AXP','Pretendard Variable','Malgun Gothic',sans-serif;padding:20px;max-width:560px;margin:0 auto}",
    ".c-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}.c-h h1{font-size:20px;font-weight:700}.c-h span{color:#6B7684;font-size:13px}",
    ".c-card{background:#fff;border-radius:20px;padding:16px 18px;margin-bottom:12px}.c-card h2{font-size:15px;font-weight:700;margin-bottom:10px}",
    ".c-st{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.c-st div{background:#F9FAFB;border-radius:12px;padding:8px 10px}.c-st b{display:block;font-size:20px}.c-st i{font-style:normal;color:#6B7684;font-size:12px}",
    ".c-next{width:100%;height:64px;border:0;border-radius:16px;background:#FF7F32;color:#351A0C;font:700 20px inherit;font-family:inherit;cursor:pointer;margin-top:10px}",
    ".c-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}",
    ".c-b{height:44px;border:0;border-radius:12px;background:#FFF1E8;color:#A63D00;font-weight:600;font-family:inherit;font-size:14px;cursor:pointer}.c-b.g{background:#F2F4F6;color:#4E5968}.c-b.x{background:#FDECEC;color:#C0392B}",
    "table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:5px 4px;border-top:1px solid #E5E8EB;text-align:left}th{color:#6B7684;font-weight:600}",
    "input,select{font-family:inherit;font-size:14px;border:1px solid #D1D6DB;border-radius:10px;padding:6px 8px;width:100%}input[type=checkbox]{width:auto}",
    ".c-f{display:grid;grid-template-columns:150px 1fr;gap:6px 10px;align-items:center}.c-f label{color:#4E5968;font-size:13px}",
    ".c-toast{min-height:22px;color:#A63D00;font-weight:600;margin-top:6px}.c-warn{color:#C0392B;font-size:12px}.c-mut{color:#6B7684;font-size:12px}"
  ].join("");
  document.head.appendChild(css);
  var root = document.createElement("div"); document.body.appendChild(root);
  root.innerHTML =
    '<div class="c-h"><h1>럭키드로우 조작</h1><span id="k-conn">송출 창 연결 대기</span></div>' +
    '<div class="c-card"><div class="c-st"><div><i>장면</i><b id="k-sc">-</b></div><div><i>체크인</i><b id="k-ar">0</b></div><div><i>통 안의 공</i><b id="k-bl">0</b></div></div>' +
    '<button class="c-next" id="k-next">다음</button><div class="c-toast" id="k-toast"></div>' +
    '<div class="c-row"><button class="c-b" data-c="close">체크인 마감 (두 번)</button><button class="c-b" data-c="redraw">부재 · 다시 추첨 (두 번)</button>' +
    '<button class="c-b g" data-c="undo">마지막 당첨 취소 (두 번)</button><button class="c-b g" data-c="mute" id="k-mute">소리</button>' +
    '<button class="c-b g" data-c="end">끝 화면 (두 번)</button><button class="c-b g" data-c="idle">대기 화면 (두 번)</button>' +
    '<button class="c-b g" data-c="add">데모 10명 체크인</button><button class="c-b g" data-c="auto">데모 자동 체크인</button></div>' +
    '<p class="c-mut" style="margin-top:8px">전체 화면은 송출 창에서 F 키. 이 창의 버튼은 송출 창의 키와 같습니다.</p></div>' +
    '<div class="c-card"><h2>당첨 기록</h2><table><thead><tr><th>라운드</th><th>번호</th><th>이름</th><th>상태</th><th>시각</th></tr></thead><tbody id="k-log"></tbody></table>' +
    '<div class="c-row"><button class="c-b g" id="k-csv">CSV 저장</button><button class="c-b x" id="k-reset">처음부터 (기록 지움)</button></div></div>' +
    '<div class="c-card"><h2>경품 단계</h2><table><thead><tr><th>라운드 이름</th><th>경품명</th><th style="width:70px">인원</th><th></th></tr></thead><tbody id="k-rounds"></tbody></table>' +
    '<div class="c-row"><button class="c-b g" id="k-addr">줄 추가</button><button class="c-b" id="k-saver">경품 단계 적용</button></div></div>' +
    '<div class="c-card"><h2>규칙 · 데이터</h2><div class="c-f">' +
    '<label>데이터</label><select id="f-mode"><option value="demo">데모 (가짜 참가자)</option><option value="server">서버 (응모권 원장)</option></select>' +
    '<label>데모 인원</label><input id="f-demoN" type="number" min="10" max="3000">' +
    '<label>데모 체크인 속도</label><input id="f-demoRate" type="number" min="1" max="60">' +
    '<label>1인 1회 당첨</label><input id="f-one" type="checkbox">' +
    '<label>부재 시 공 제외</label><input id="f-abs" type="checkbox">' +
    '<label>첫 추첨 최소 섞기</label><input id="f-minmix" type="text" placeholder="0:30, 5:20, 10:10" title="체크인 분:초 · 체크인이 그 분 이상이면 그 초">' +
    '<label>체크인한 분만</label><input id="f-chk" type="checkbox">' +
    '<label>체크인 화면 쓰기</label><input id="f-ckui" type="checkbox" title="끄면(기본 · 261006) 체크인 QR · 인원 없이 행운권 번호 전체에서 추첨">' +
    '<label>통에 보이는 공 상한</label><input id="f-bmax" type="number" min="100" max="4000" title="행운권이 더 많으면 무작위 대표 공만 · 당첨은 행운권 전체에서">' +
    '<label>이름 표시</label><select id="f-name"><option value="mask">가운데 가림 (홍*동)</option><option value="none">번호만</option></select>' +
    '<label>부서 표시</label><input id="f-dept" type="checkbox">' +
    '<label>체크인 티커 이름</label><input id="f-tick" type="checkbox">' +
    '<label>섞기 박자음</label><input id="f-beat" type="checkbox">' +
    '<label>서버 주소</label><input id="f-srv" placeholder="비우면 ../assets/server.js">' +
    '<label>관리코드</label><input id="f-key" type="password" placeholder="서버 모드에서만 · 이 창을 닫으면 지워짐">' +
    '</div><div class="c-row"><button class="c-b" id="k-savecfg">규칙 적용</button><button class="c-b g" data-c="reload">서버 다시 읽기</button></div>' +
    '<p class="c-mut" id="k-srv"></p><p class="c-warn">규칙·데이터 바꾸기는 대기 화면에서만 안전합니다. 추첨 중에 바꾸면 이미 뽑힌 기록은 그대로 두고 다음 추첨부터 적용됩니다.</p></div>';

  function $(id) { return document.getElementById(id); }
  root.addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (b) cmd(b.getAttribute("data-c"), b.getAttribute("data-c") === "add" ? 10 : undefined); });
  $("k-next").onclick = function () { cmd("next"); };
  var rounds = null, cfgLoaded = false;
  function drawRounds() {
    $("k-rounds").innerHTML = rounds.map(function (r, i) {
      return '<tr><td><input data-r="' + i + '" data-k="name" value="' + esc(r.name) + '"></td><td><input data-r="' + i + '" data-k="prize" value="' + esc(r.prize) + '"></td><td><input type="number" min="1" max="200" data-r="' + i + '" data-k="count" value="' + r.count + '"></td><td><button class="c-b g" data-del="' + i + '" style="height:32px;padding:0 8px">빼기</button></td></tr>';
    }).join("");
  }
  $("k-rounds").addEventListener("input", function (e) { var t = e.target, i = +t.dataset.r; if (isNaN(i)) return; rounds[i][t.dataset.k] = t.dataset.k === "count" ? Math.max(1, +t.value || 1) : t.value; });
  $("k-rounds").addEventListener("click", function (e) { var d = e.target.dataset.del; if (d != null && rounds.length > 1) { rounds.splice(+d, 1); drawRounds(); } });
  $("k-addr").onclick = function () { rounds.push({ name: "ROUND " + ("0" + (rounds.length + 1)).slice(-2), prize: "경품", count: 1 }); drawRounds(); };
  $("k-saver").onclick = function () { send({ type: "cfg", cfg: { rounds: rounds } }); };
  $("k-savecfg").onclick = function () {
    var c = { mode: $("f-mode").value, demoN: +$("f-demoN").value || 170, demoRate: +$("f-demoRate").value || 9, onePerPerson: $("f-one").checked, absentRemove: $("f-abs").checked,
      checkinOnly: $("f-chk").checked, ckUI: $("f-ckui").checked, ballMax: +$("f-bmax").value || 1000, nameMode: $("f-name").value, showDept: $("f-dept").checked, tickerNames: $("f-tick").checked, beat: $("f-beat").checked, server: $("f-srv").value.trim(),
      minMix: ($("f-minmix").value || "").split(",").map(function (x) { var a = x.split(":"); return [+a[0], +a[1]]; }).filter(function (x) { return x[0] >= 0 && x[1] > 0; }) };
    if (!c.minMix.length) delete c.minMix;
    if ($("f-key").value) c.key = $("f-key").value;
    send({ type: "cfg", cfg: c });
  };
  $("k-reset").onclick = function () { if (confirm("추첨 기록과 체크인을 모두 지우고 처음 상태로 돌립니다. 되돌릴 수 없습니다.")) cmd("reset"); };
  $("k-csv").onclick = function () {
    if (!S) return;
    var rows = [["라운드", "경품", "순번", "응모번호", "이름(가림)", "상태", "시각", "후보 공 수"]];
    S.results.forEach(function (r) { rows.push([r.rname || "", r.prize, r.slot, "'" + r.no, maskN(r.nm), { win: "당첨", absent: "부재", undone: "취소" }[r.st] || r.st, r.at, r.pool || ""]); });
    var csv = "﻿" + rows.map(function (r) { return r.map(function (x) { return '"' + String(x == null ? "" : x).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "럭키드로우_기록.csv"; a.click();
  };
  function maskN(n) { n = String(n || ""); if (n.length <= 1) return n; if (n.length === 2) return n[0] + "*"; return n[0] + new Array(n.length - 1).join("*") + n[n.length - 1]; }
  function recv(m) {
    if (!m || !m.axd || m.type !== "state") return;
    S = m;
    $("k-conn").textContent = "송출 창 연결됨 · " + (m.demo ? "데모" : "서버") + " · " + m.fps + " fps";
    var nock = !m.cfg.ckUI, nx = nock && m.scene in NEXT_NOCK ? NEXT_NOCK[m.scene] : NEXT[m.scene];
    $("k-sc").textContent = (nock && SCN["nock_" + m.scene]) || SCN[m.scene] || m.scene;
    $("k-ar").textContent = m.arrived + "명";
    $("k-bl").textContent = m.inside + "개";
    $("k-next").textContent = "다음 · " + (nx || "연출 중");
    $("k-next").disabled = !nx;
    $("k-mute").textContent = m.muted ? "소리 켜기" : "소리 끄기";
    if (m.toast) $("k-toast").textContent = m.toast;
    $("k-srv").textContent = "서버: " + (m.srv.url || "주소 없음") + (m.srv.status ? " · " + m.srv.status : "") + (m.srv.log ? " · " + m.srv.log : "") + (m.srv.queue ? " · 미전송 " + m.srv.queue : "") + (m.srv.close ? " · " + m.srv.close : "") + (m.qr && m.cfg.ckUI ? " · 체크인 QR " + (m.qr.code || m.qr.st || "없음") : "") + (m.srv.att === "ON" && !m.cfg.ckUI ? " · 주의: 서버 행운권_참석조건 ON(체크인한 사람만 통에 들어감) · 체크인 화면이 꺼져 있습니다" : "");
    $("k-log").innerHTML = m.results.slice().reverse().map(function (r) {
      return "<tr><td>" + esc(r.rname || "") + " " + r.slot + "</td><td><b>" + r.no + "</b></td><td>" + esc(maskN(r.nm)) + "</td><td>" + ({ win: "당첨", absent: "부재", undone: "취소" }[r.st] || r.st) + "</td><td>" + String(r.at).slice(11, 19) + "</td></tr>";
    }).join("") || '<tr><td colspan="5" class="c-mut">아직 없음</td></tr>';
    if (!cfgLoaded) {
      cfgLoaded = true; var c = m.cfg;
      rounds = JSON.parse(JSON.stringify(c.rounds)); drawRounds();
      $("f-mode").value = c.mode; $("f-demoN").value = c.demoN; $("f-demoRate").value = c.demoRate; $("f-one").checked = c.onePerPerson; $("f-abs").checked = c.absentRemove;
      $("f-chk").checked = c.checkinOnly; $("f-ckui").checked = !!c.ckUI; $("f-bmax").value = c.ballMax || 1000; $("f-name").value = c.nameMode; $("f-dept").checked = c.showDept; $("f-tick").checked = c.tickerNames; $("f-beat").checked = c.beat; $("f-srv").value = c.server || ""; $("f-minmix").value = (c.minMix || []).map(function (x) { return x[0] + ":" + x[1]; }).join(", ");
    }
  }
  document.addEventListener("keydown", function (e) { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === " " || e.key === "Enter") { e.preventDefault(); cmd("next"); } });
  send({ type: "hello" });
  setInterval(function () { if (!S) send({ type: "hello" }); }, 1500);
};
