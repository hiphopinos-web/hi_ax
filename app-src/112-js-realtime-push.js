/* ════════════════ v17 · 알림·승인·매칭·발사 (폴링 기반) ════════════════
 * 진짜 OS 푸시(앱을 닫은 상태)는 GAS 스택으론 불가 · 앱이 열려 있는 기기에
 * BE_POLL_MS 주기 sync 폴링으로 전달하고, 팝업 + (허용 시) 브라우저 알림을 띄운다. */
/* 시트 자동 형변환으로 "Sat Dec 30 1899 14:00:00..." 이 와도 HH:MM만 추린다 */
function hhmm(v) {
  var m = String(v == null ? "" : v).match(/(\d{1,2}):(\d{2})/);
  return m ? m[1] + ":" + m[2] : String(v == null ? "" : v);
}
function notifOK() { return ("Notification" in window) && Notification.permission === "granted"; }
function notifyUser(title, body, target, focus) {
  try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate([80, 40, 80]); } catch (e) {}   /* 상호작용 전 차단 경고 방지 */
  if (notifOK()) { try { new Notification(title, { body: body }); } catch (e) {} }
  /* v3.53 팝업 대기열로 · 모달·스탬프 팝·게임 플레이가 끝나면 차례로 · 호출은 게임 중 제목 토스트도 */
  notice({ key: "nu:" + title + "|" + body, title: title, body: body, go: target || "", focus: focus || "", goLbl: target === "home" ? "홈에서 보기" : "", urgent: /입장|차례/.test(title) });
}
/* 내 상태 전환 감지 · 서버 sync·로컬 storage 어느 쪽이 바꿔도 여기서 팝업 1회 */
function checkMyState() {
  if (App.current === "admin" || SIGNAGE.indexOf(App.current) >= 0) return;
  var seen = S.get("noti_seen", {});
  var changed = false;
  var my = myResv();
  if (my && my.status === "approved" && seen.resv !== my.id + ":approved") {
    seen.resv = my.id + ":approved"; changed = true;
    notifyUser("AX 라운지 승인 완료", "1F AX 라운지", "dap");
  }
  if (my && my.status === "canceled" && seen.resvX !== my.id + ":canceled") {
    seen.resvX = my.id + ":canceled"; changed = true;
    notifyUser("AX 라운지 신청 취소", "", "dap");
  }
  var c = S.get("cchat", null);
  if (c && c.status === "matched" && seen.cchat !== "m:" + c.round + c.table) {
    seen.cchat = "m:" + c.round + c.table; changed = true;
    notifyUser("커피챗 매칭 완료", "18F · " + hhmm(c.round) + " · TABLE " + c.table, "ev_cchat");
  }
  /* v5.90 선착순 참여상 수령 자격 · 앱이 열려 있으면 팝업 1회(푸시 없음 · 계약 5.1) · 옛 완주 경품 당첨 팝업은 지웠다 */
  var fq = fcfsMy();
  if (fq && fq.st === "got" && seen.fcfs !== "got") {
    seen.fcfs = "got"; changed = true;
    notice({ key: "fcfs:got", title: "선착순 참여상", body: "선착순 참여상 수령 자격이 생겼어요 · 1F 체크인존에서 수령", go: "rewards", focus: "fin", goLbl: "나의 보상에서 보기" });
  }
  if (changed) S.set("noti_seen", seen);
}
/* 폴링 1회 = 월 + 내 상담·커피챗 상태 + 공지 (v3.50 Outro 문항 기능 폐지 · 서버 응답의 옛 문항 필드는 읽지 않는다) */
/* v4.57 폴링 예약 · 화면이 가려져 있으면 예약하지 않는다(보이면 visibilitychange 가 곧바로 한 번) */
function pollNext(ms) {
  if (POLL.t) { clearTimeout(POLL.t); POLL.t = null; }
  if (!BE.on || document.hidden) return;
  POLL.t = setTimeout(pollTick, ms);
}
function pollTick() {
  POLL.t = null;
  if (document.hidden) return;
  beSync(function (ok) {
    if (ok) { POLL.fails = 0; POLL.ms = wsPollMs(); pollNext(POLL.ms); }   /* v4.75 소켓이 붙어 있으면 ws.p 초(기본 120) · 끊기면 평소(30초) */
    else { POLL.fails++; POLL.ms = Math.min(BE_POLL_MAX, POLL.ms * 2); pollNext(POLL.ms + beJit()); }
  });
}
document.addEventListener("visibilitychange", function () {
  if (!BE.on) return;
  if (document.hidden) { if (POLL.t) { clearTimeout(POLL.t); POLL.t = null; } return; }
  pollNext(0);   /* 다시 보이면 곧바로 한 번 */
});
function beSync(after) {
  if (!BE.on) return;
  var u = S.get("user", {});
  beCall({ action: "sync", emp: u.empId || "" }, function (res) {
    if (res && res.ok && res.poll >= 30 && res.poll <= 120) POLL.base = res.poll * 1000;   /* v4.57 운영이 붐비는 시간에 서버 설정으로 폴링을 늘린다(재배포 없이) */
    if (res && res.ok) wsCfg(res.ws);   /* v4.75 소켓 설정(새 서버만 보낸다 · 없거나 0 이면 소켓을 닫고 폴링만) */
    if (res && res.ok && typeof pushCfg === "function") pushCfg(res.push);   /* v4.76 웹 푸시 공개키(새 서버 · 비밀값 있는 Worker 만 · 없으면 알림 항목이 뜨지 않는다) */
    if (after) after(!!(res && res.ok));
    if (!res || !res.ok) return;
    if (stampVerSet(res.stv === 2 ? 2 : 1)) setTimeout(function () { App.render(); }, 0);   /* v4.83 스탬프 체계 판 · 새 서버 stv 2 = 새 8종 · 없으면 옛 서버(옛 8종) · 스탬프 목록 맞추기(stampSync)보다 먼저 */
    if (u.empId && res.sesNeed === 1) SES.need = true;   /* v4.68 세션필수 ON 인데 토큰이 없거나 지난 토큰(PIN 초기화) · 서버가 개인 부분(my)을 빼고 보냈다 · 이 기기 기록은 그대로 둔다 */
    if (u.empId && (res.ses === 1 && !u.ses || SES.need)) setTimeout(sesAsk, 600);   /* v4.67 세션필수 ON · 토큰 없는 로그인(옛 앱)이면 비밀번호 한 번 더 */
    if (scanQList().length) setTimeout(scanQFlush, 200 + beJit());   /* v3.34b 연결이 살아났으면 저장된 스캔 재전송 · v4.57 0~5초 무작위 지연 */
    setTimeout(ideaFlush, 400 + beJit());
    setTimeout(olyPendFlush, 600 + beJit());   /* v4.64 못 보낸 미니게임 기록 다시 보내기 */
    if (Array.isArray(res.resvTaken)) { RESV_SRV.taken = res.resvTaken.map(hhmm); RESV_SRV.miss = {}; }   /* v4.64 잡힌 상담 시간(새 서버만 보낸다) */   /* v4.15 서버에 아직 닿지 않은 내 아이디어 다시 보내기 */
    if (!BE.stats) BE.stats = {};
    BE.stats.wall = res.wall;
    BE.stats.sess = res.sess || null;
    if ("rouletteOut" in res && !!res.rouletteOut !== S.get("roulette_out", false)) S.set("roulette_out", !!res.rouletteOut);   /* v3.33 · v5.90 룰렛_마감 시각 지남도 여기(서버가 합쳐 보낸다) */
    /* v5.90 (261006 경품 기획 변경 · 계약 4.5) 서버가 보낼 때만 저장 · 없으면 앱은 그 요소를 그리지 않는다 */
    var sv9 = function (k, v) { if (JSON.stringify(v) !== JSON.stringify(S.get(k, null))) S.set(k, v); };
    if ("fx" in res) sv9("fx", res.fx && typeof res.fx === "object" ? res.fx : null);
    if ("rcut" in res) sv9("rcut", String(res.rcut || ""));
    if ("lkcond" in res) sv9("lkcond", res.lkcond ? 1 : 0);
    if ("idea" in res) sv9("idea_pub", res.idea && typeof res.idea === "object" ? res.idea : null);
    if (res.lng && typeof res.lng === "object" && "end" in res.lng) sv9("lng_end", String(res.lng.end || ""));
    if ("cchatOut" in res && !!res.cchatOut !== S.get("cchat_out", false)) S.set("cchat_out", !!res.cchatOut);   /* v4.47 GAS 가 생기면 */
    if ("betaForm" in res && (res.betaForm || "") !== S.get("beta_form", "")) S.set("beta_form", res.betaForm || "");   /* v4.55 클로즈 베타 배너 링크(없으면 빈 문자열) */
    if (res.crowd) crowdStore(res.crowd);   /* v4.71 혼잡 제보(새 서버만 보낸다 · 없으면 「제보 없음」 그대로) */
    if (res.aw && res.aw.i && res.aw.o && JSON.stringify(res.aw) !== JSON.stringify(S.get("att_w", null))) S.put("att_w", { i: res.aw.i, o: res.aw.o });   /* v5.68 17F 입장 · 끝 QR 창(서버 설정) · 조용히 저장 */
    beNoticeIn(res.notice, res.noticeOff || []);   /* v4.75 공지 · 중지는 소켓(WS.h.notice)과 같은 함수 */
    if (res.my) {
      var all = resvAll();
      if (res.my.resv) {
        var map = { "신청": "requested", "승인": "approved", "체크인": "checked", "완료": "done", "노쇼": "noshow", "취소": "canceled" };
        var stt = map[res.my.resv.status];
        var mine = all.find(function (r) { return r.mine && (r.beId === res.my.resv.id); });
        if (!mine && stt && RESV_LIVE.indexOf(stt) >= 0) {
          all.push({ id: uid(), beId: res.my.resv.id, room: 2, slot: hhmm(res.my.resv.slot), name: u.name || "", dept: S.get("dept", null) || "미지정", status: stt, mine: true, ts: Date.now() });
          S.set("resv", all);
        } else if (mine && stt && mine.status !== stt) {
          mine.status = stt; S.set("resv", all);
        }
      } else {
        /* 서버에 내 신청이 없다(=시트에서 취소·삭제됨) · 진행 중이던 로컬 신청을 취소로 */
        var mine2 = all.find(function (r) { return r.mine && r.beId && RESV_LIVE.indexOf(r.status) >= 0; });
        if (mine2 && Date.now() - mine2.ts > 30000) { mine2.status = "canceled"; S.set("resv", all); }
      }
      /* v4.07 서버에 대기 중인 요청이 있는데 이 기기에 없으면(자동 요청 시절 행 · 다른 기기) 보여 줘서 취소할 수 있게 한다 · 방금 취소한 30초는 제외 */
      if (res.my.cchat && res.my.cchat.status === "대기" && !S.get("cchat", null) && Date.now() - CCHAT_CX_TS > 30000) S.set("cchat", { status: "pending", pref: res.my.cchat.pref || String(res.my.cchat.tag || "").split(CCHAT_TAG_SEP)[1] || "", ts: Date.now() });
      if (!res.my.cchat) {
        var c0 = S.get("cchat", null);
        if (c0 && Date.now() - (c0.ts || 0) > 30000) S.set("cchat", null);
      }
      var ccAtt = !!(res.my.cchat && (res.my.cchat.status === "참석" || res.my.cchat.status === "완료"));   /* v4.47 커피챗 참석 표시 · 18F 입장 스캔 또는 콘솔 참석 · 완료 */
      if (ccAtt !== !!S.get("cchat_att", false)) S.set("cchat_att", ccAtt);
      if (res.my.cchat && res.my.cchat.status === "매칭") {
        var c = S.get("cchat", null);
        var sr = hhmm(res.my.cchat.round), stb = String(res.my.cchat.table || "");
        if (!c || c.status !== "matched" || c.round !== sr || c.table !== stb) S.set("cchat", { status: "matched", round: sr, table: stb, ts: Date.now() });   /* v3.43 서버가 정본 */
      }
      if (res.my.sess) {
        /* 강의 신청 · 서버 우선. 서버에 없는 로컬 신청은 30초(전송 유예)만 유지 */
        var srv = {}, curS = sessMy(), chg = false, k3;
        res.my.sess.forEach(function (x) { srv[x.sid] = { slot: x.slot ? hhmm(x.slot) : null, ts: (curS[x.sid] || {}).ts || Date.now() }; });
        for (k3 in srv) if (!curS[k3]) chg = true;
        for (k3 in curS) {
          if (srv[k3]) continue;
          if (Date.now() - (curS[k3].ts || 0) > 30000) chg = true;
          else srv[k3] = curS[k3];
        }
        if (chg) S.set("sess_my", srv);
      }
      /* v5 · 체크인·대기 상태는 서버가 정본이다(운영 데스크 스캐너가 쓰므로 앱은 받아쓰기만 한다).
         내 차례가 되면 한 번만 알린다 · 폴링마다 토스트가 뜨지 않게 직전 상태와 비교. */
      if (res.my.checkin) S.set("checkin", res.my.checkin);
      if (res.my.stamps) { stampSync(res.my.stamps); stampPendRetry(); lgCheck(res.my.stamps); }   /* v4.83 최초 로그인 스탬프 */
      if (res.my.stair) { var st9 = Object.assign({}, res.my.stair, { emp: String(u.empId || "") }); if (JSON.stringify(st9) !== JSON.stringify(S.get("stair", null))) S.set("stair", st9); }   /* v4.06 계단 진행 · 서버가 정본 · v4.54 물어본 사번을 붙여 저장 */   /* 스탬프는 서버가 정본 · v3.97 빈 목록 포함 · 못 보낸 적립은 다시 보낸다 */
      if ("roulette" in res.my && !testEmp()) S.set("roulette_used", !!res.my.roulette);   /* 룰렛 사용 여부도 서버가 정본 (260909) · 테스트 사번은 로컬 */
      if (res.my.tickets && !testEmp()) S.set("raffle_nums", res.my.tickets);   /* v3.12 응모권 번호 · 서버 발급 정본 */
      /* v5.90 선착순 참여상 · 7등 랜덤 굿즈 · 서버가 보낼 때만(없으면 null = 그리지 않는다) · 옛 my.fin 은 저장하지 않는다 */
      var fc9 = res.my.fcfs && typeof res.my.fcfs === "object" ? res.my.fcfs : null, lk9 = res.my.lk7 && typeof res.my.lk7 === "object" ? res.my.lk7 : null;
      if (JSON.stringify(fc9) !== JSON.stringify(S.get("fcfs", null))) S.set("fcfs", fc9);
      if (JSON.stringify(lk9) !== JSON.stringify(S.get("lk7", null))) S.set("lk7", lk9);
      /* v3.21 B 포토부스 번호표 · 서버가 정본(없으면 null) · 바뀐 경우에만 저장해 불필요한 재렌더를 막는다 */
      /* v3.35 · v3.99 서버 스탬프 목록에 설문(sv)이 있을 때만 · 관리자가 08 을 취소하면 답이 남아 있어도 다시 제출할 수 있다(GAS @74) */
      if (res.my.survey === true && !S.get("survey_done", false) && !testEmp() && (res.my.stamps || []).indexOf("sv") >= 0) S.set("survey_done", true);
      if (res.my.queue) {
        var was = S.get("queue", {}), nowQ = res.my.queue, kq;
        for (kq in nowQ) {
          if (nowQ[kq].status === "call" && (!was[kq] || was[kq].status !== "call")) {
            var spN = scanSpot(kq);
            notice({ key: "q:" + kq + ":" + nowQ[kq].no, title: "지금 입장하세요", body: (spN ? spN.nm + " · " : "") + nowQ[kq].no + "번", urgent: true });
          }
        }
        S.set("queue", nowQ);
      }
    }
    checkMyState();
    qrMineCheck();   /* v4.06 내 QR 이 열려 있으면 방금 바뀐 것 한 줄(확인됨) */
    if (App.current === "home") App.render();
  }, function () { if (after) after(false); });
}
/* v3.14 공지 중지: 서버가 내려준 중지 id 는 로컬에서도 지운다(LED 띠·뱃지·목록·팝업이 자연 소멸).
   중지 목록에 든 공지는 다시 추가하지 않는다 · notice 가 null 이면 신규 추가 없음
   v4.75 sync 와 소켓(WS.h.notice · noticeOff)이 같이 쓴다 · 공지 id 로 겹침을 거른다 */
function beNoticeIn(n, nOff) {
  nOff = nOff || [];
  if (nOff.length) {
    var nz0 = S.get("notices", []);
    var kept = nz0.filter(function (x) { return nOff.indexOf(x.id) < 0; });
    if (kept.length !== nz0.length) S.set("notices", kept);
    if (S.get("cchat_close_id", "") && nOff.indexOf(S.get("cchat_close_id", "")) >= 0) S.set("cchat_close_id", "");   /* v4.47 콘솔이 마감 신호를 중지 = 다시 열기 */
  }
  /* v4.47 커피챗 마감 신호 · 참가자 공지로 쌓지 않는다 */
  if (n && n.title === CCHAT_CLOSE_T && n.id && nOff.indexOf(n.id) < 0 && S.get("cchat_close_id", "") !== n.id) S.set("cchat_close_id", n.id);
  if (n && n.id && n.title !== CCHAT_CLOSE_T && nOff.indexOf(n.id) < 0) {
    var nz = S.get("notices", []);
    if (!nz.some(function (x) { return x.id === n.id; })) {
      nz.unshift({ id: n.id, title: n.title || "", body: n.body || "", ts: n.ts || Date.now() });
      S.set("notices", nz);
    }
  }
}
/* ════════════════ v4.75 실시간 연결(웹 소켓) · 260930 사용자 확정 ════════════════
 * 원칙: 소켓은 「빨리 알려 주는 통로」다 · 상태의 정본은 늘 sync 다(놓쳐도 다음 sync 가 맞춘다).
 * 켜지는 조건: sync 응답에 ws(= { n: 조각 수, p: 연결 중 폴링 초 })가 있고 서버 주소가 workers.dev 일 때만. 옛 서버(GAS · 소켓 없는 Worker)는 ws 가 없어 지금처럼 폴링만.
 * 방: 참가자 = p(사번 조각 · 세션 토큰 ses 로 hello) · TV(#tv=) = tv(인증 없음 · 순위판 힌트만).
 * 연결 중에는 sync 폴링을 30초 → ws.p 초(기본 120)로 늦추고, 끊기면 곧바로 30초 폴링으로 돌아간다.
 * 재연결: 열린 뒤 끊김(재배포 1006 등)은 실패로 세지 않고 0~10초 무작위 뒤 다시 · 열기 실패는 1 · 2 · 4 · 8초 → 30초 상한 + 지터 · 연달아 3번 실패하면 이 화면에서는 포기(폴링만).
 * 닫힘 코드: 4000 = 같은 기기 새 연결로 바뀜 · 최대 개수(다시 열지 않는다) · 4001 = 인증 거절(토큰이 바뀌면 다시) · 4002 = 조각 바뀜(sync 로 다시 받고) · 4003 = hello 시간 초과.
 * 화면이 5분 넘게 가려지면 닫고, 다시 보이면 sync 1회 + 다시 연결. 25초마다 핑(p → o) · 70초 넘게 답이 없으면 닫고 다시.
 * 받는 것: notice · noticeOff(공지 · sync 와 같은 함수) · photo(포토부스 공개 현황) · me photoQ(내 번호 · 호출이면 곧바로 「지금 입장하세요」) · sync(힌트 · 0~3초 뒤 sync) · tv(TV 순위판 다시 받기). */
var WS = { ws: null, st: "off", cfg: null, role: "", fails: 0, give: false, t: null, pingT: null, pongAt: 0, hidT: null, ids: [], dev: "", emp: "", ses: "", okAt: 0, h: {}, syncT: null };
function wsUrl() { return /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/exec$/.test(GAS_URL) ? GAS_URL.replace(/^https:/, "wss:").replace(/\/exec$/, "/ws") : ""; }
/* 사번 → 조각 · 서버(hub.js shardOf)와 같은 식 */
function wsShard(emp, n) {
  var s = String(emp == null ? "" : emp).trim().replace(/\s/g, "").replace(/^0+(?=.)/, "").toUpperCase(), h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000003;
  return h % Math.max(1, Number(n) || 1);
}
function wsLive() { return WS.st === "ok" && !!WS.cfg; }
/* 연결 중 폴링 간격(ms) · 끊겨 있으면 평소 간격 */
function wsPollMs() { return wsLive() ? Math.max(POLL.base, (Number(WS.cfg.p) || 120) * 1000) : POLL.base; }
function wsRole() {
  if (/^#tv=/i.test(location.hash)) return "tv";
  if (/^#(self|demo)/i.test(location.hash) || (typeof tsfOn === "function" && tsfOn())) return "";
  if (App.current === "admin" && S.get("admin_authed", false) && typeof admTok === "function" && (admTok() || admKey())) return "ops";   /* v4.76 스태프 폰(앱 관리자 모드) = ops 방 · 다른 스태프의 혼잡 제보가 곧바로 */
  var u = S.get("user", {}) || {};
  return u.empId ? "p" : "";
}
/* v4.76 화면이 바뀌면(관리자 모드에 들어가고 나오기 · 코드 확인) 방을 다시 고른다 · App.render 가 부른다(방이 같으면 아무 일도 안 한다) */
function wsRoleCheck() {
  if (!WS.cfg) return;
  if (WS.ws && WS.role !== wsRole()) { wsClose("role"); WS.fails = 0; WS.no = false; }
  if (!WS.ws && !WS.t) wsEnsure();
}
/* sync(또는 TV 가 부르는 sync)의 ws 값을 받는다 · 없거나 0 이면 소켓을 닫고 폴링만 */
function wsCfg(c) {
  var on = !!(c && typeof c === "object" && c.n >= 1);
  if (!on) { WS.cfg = null; if (WS.ws) wsClose("off"); return; }
  var shardChanged = WS.cfg && WS.cfg.n !== c.n;
  WS.cfg = { n: Number(c.n) || 1, p: Number(c.p) || 120 };
  if (shardChanged && WS.ws) wsClose("shard");
  wsEnsure();
}
function wsEnsure() {
  if (WS.give || !WS.cfg || WS.ws || WS.t || document.hidden || !BE.on || !wsUrl() || typeof WebSocket === "undefined") return;
  var role = wsRole();
  if (!role) return;
  var u = S.get("user", {}) || {};
  if (role === "p" && !u.ses) return;   /* v4.76 (사용자 결정 260930) 로그인 토큰이 없는 폰(옛 로그인)은 소켓을 열지 않고 폴링만 · 서버 WS_토큰필수 기본 ON */
  if (role === "p" && (WS.emp !== String(u.empId) || WS.ses !== String(u.ses || ""))) { WS.fails = 0; WS.no = false; }   /* 다른 사람 · 새 토큰이면 인증 거절 기록을 버린다 */
  if (WS.no) return;
  wsOpen(role, u);
}
function wsOpen(role, u) {
  if (!WS.dev) WS.dev = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);   /* 이 화면 한 번의 id · 같은 id 로 다시 붙으면 서버가 옛 연결을 닫는다 */
  WS.role = role; WS.emp = role === "p" ? String(u.empId) : ""; WS.ses = role === "p" ? String(u.ses || "") : "";
  var url = wsUrl() + (role === "tv" ? "?r=tv" : role === "ops" ? "?r=ops" : "?r=p&s=" + wsShard(WS.emp, WS.cfg.n)), ws;
  try { ws = new WebSocket(url); } catch (e) { wsFail(); return; }
  WS.ws = ws; WS.st = "open"; WS.okAt = 0;
  ws.onopen = function () {
    if (WS.ws !== ws) return;
    var hi = role === "tv" ? { t: "hello", v: "v4.76" } : role === "ops" ? { t: "hello", tok: admTok(), key: admTok() ? "" : admKey(), d: WS.dev, v: "v4.76", emp: admEmp() } : { t: "hello", emp: WS.emp, ses: WS.ses, d: WS.dev, v: "v4.76" };
    try { ws.send(JSON.stringify(hi)); } catch (e) {}
  };
  ws.onmessage = function (e) {
    if (WS.ws !== ws) return;
    var d = e.data;
    if (d === "o") { WS.pongAt = Date.now(); return; }
    var m;
    try { m = JSON.parse(d); } catch (x) { return; }
    if (!m || typeof m.t !== "string") return;
    if (m.t === "ok") { wsUp(m); return; }
    if (m.t === "no") { if (m.reason === "ses" || m.reason === "auth") WS.no = true; return; }
    if (m.id) { if (WS.ids.indexOf(m.id) >= 0) return; WS.ids.push(m.id); if (WS.ids.length > 64) WS.ids.shift(); }
    var f = WS.h[m.t];
    if (f) { try { f(m); } catch (x) {} }
  };
  ws.onclose = function (e) {
    if (WS.ws !== ws) return;
    var wasOk = WS.st === "ok", code = e && e.code;
    WS.ws = null; WS.st = "off"; wsTimers(false);
    if (wasOk) pollNext(POLL.base);   /* 끊기면 곧바로 평소 폴링으로 */
    if (code === 4000 || WS.no || !WS.cfg) return;
    if (code === 4002) { WS.cfg = null; pollNext(beJit()); return; }   /* 조각이 바뀌었다 · sync 가 새 값을 준다 */
    if (wasOk) { WS.t = setTimeout(wsRetry, Math.random() * 10000); return; }   /* 열린 뒤 끊김(재배포 1006 등) · 실패로 세지 않는다 */
    wsFail();
  };
  ws.onerror = function () {};
}
function wsRetry() { WS.t = null; wsEnsure(); }
function wsFail() {
  WS.ws = null; WS.st = "off";
  if (++WS.fails >= 3) { WS.give = true; return; }   /* 이 화면에서는 소켓을 포기하고 폴링만 */
  WS.t = setTimeout(wsRetry, Math.min(30000, 1000 * Math.pow(2, WS.fails - 1)) + Math.random() * 1000);
}
function wsUp(m) {
  var re = WS.hadOk;
  WS.st = "ok"; WS.okAt = Date.now(); WS.pongAt = Date.now(); WS.fails = 0; WS.hadOk = true;
  wsTimers(true);
  if (re && WS.role !== "tv") wsSyncSoon(3000); else pollNext(wsPollMs());   /* 다시 붙었으면 그사이 놓친 것을 sync 1회로 · 처음이면 폴링만 늦춘다 */
  if (WS.role === "tv") tvWsPull(true);
}
function wsTimers(on) {
  if (WS.pingT) { clearInterval(WS.pingT); WS.pingT = null; }
  if (!on) return;
  WS.pingT = setInterval(function () {
    var ws = WS.ws;
    if (!ws || WS.st !== "ok") return;
    if (Date.now() - WS.pongAt > 70000) { try { ws.close(); } catch (e) {} return; }   /* 답 없는 연결(망 전환 · 반쯤 끊김) */
    try { ws.send("p"); } catch (e) {}
  }, 25000);
}
function wsClose(why) {
  if (WS.t) { clearTimeout(WS.t); WS.t = null; }
  var ws = WS.ws;
  WS.ws = null; WS.st = "off"; wsTimers(false);
  if (ws) { try { ws.close(1000, why || "bye"); } catch (e) {} }
  if (BE.on && why !== "hidden") pollNext(POLL.base);
}
/* 힌트 · 전원이 한꺼번에 sync 하지 않게 0~ms 무작위 */
function wsSyncSoon(ms) {
  if (WS.syncT) return;
  WS.syncT = setTimeout(function () { WS.syncT = null; if (POLL.t) { clearTimeout(POLL.t); POLL.t = null; } pollTick(); }, Math.floor(Math.random() * (ms || 3000)));
}
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    if (WS.hidT) clearTimeout(WS.hidT);
    WS.hidT = setTimeout(function () { WS.hidT = null; if (document.hidden) wsClose("hidden"); }, 300000);
    return;
  }
  if (WS.hidT) { clearTimeout(WS.hidT); WS.hidT = null; }
  wsEnsure();
});
/* 받는 곳 · 새 화면은 여기에 한 줄(WS.h.종류 = 함수) */
WS.h.notice = function (m) { if (m.notice) { beNoticeIn(m.notice, null); if (App.current === "home") App.render(); } };
WS.h.noticeOff = function (m) { if (Array.isArray(m.off)) beNoticeIn(null, m.off); };
WS.h.sync = function () { wsSyncSoon(3000); };
WS.h.crowd = function (m) { if (m.crowd && typeof crowdStore === "function") crowdStore(m.crowd); };   /* v4.76 혼잡 제보 · 홈 아래 2칸이 곧바로 */
WS.h.ops = function (m) {   /* v4.76 스태프 폰 ops 방 · 혼잡 카드 곧바로(다른 스태프가 누른 제보 · 해소) */
  if (WS.role !== "ops" || m.k !== "crowd") return;
  if (m.crowd && typeof crowdStore === "function") crowdStore(m.crowd); else wsSyncSoon(1500);
};
WS.h.tv = function (m) { if (WS.role === "tv") tvWsPull(false, m.k); };
/* TV · 힌트가 오면 기존 읽기 1회(순위판 · 올림픽) · 처음 붙었을 때도 1회 */
function tvWsPull(all, k) {
  if (App.current !== "wall_type") return;
  if (all || k === "site") { TYTV.pullT = 0; tyTvPull(); if (hsOn()) hsPull(); }
  if ((all || k === "oly") && !TYTV.fix) olyPull(true);
}

/* ═══ 관리 코드 · 앱에 두지 않는다 (260830 보안) ═══
 * 구판은 FESTIVAL.adminCode에 상수로 박혀 있었고 저장소가 public이라, 소스만 열면
 * GAS 주소와 함께 읽혔다. 주소창만으로 전 참여자 공지 발송·가짜 쿠폰 발급이 가능했다.
 * 이제 입력값을 서버에 물어 확인하고, 맞으면 그 입력값을 이 기기에만 보관해 이후 호출에 쓴다.
 * 서버 응답은 맞다/틀리다와 role뿐이고 코드 자체는 돌려주지 않는다. */
function admKey() { return S.get("adm_key", ""); }
function admRole() { return S.get("adm_role", ""); }
/* v4.65 (QA 2단계 260930) 스태프 토큰 · 새 서버가 코드를 맞힌 기기에 준다(admin_check tok) · 함께 보내면 틀린 코드 잠금(같은 와이파이)에 막히지 않는다 · 옛 서버는 주지 않아 빈 값 */
function admTok() { return S.get("adm_tok", ""); }
/* v4.86 (261001 · 서버 v4.85 관리자 명단) 스태프 사번 · 로그인한 폰에서 관리자 모드를 열면 admin_check 에 사번(aemp) · 명단 구분(asc a) · 참가자 세션(ases)을 같이 보낸다
   새 서버가 사번(emp)과 사람 토큰을 돌려주면 adm_emp 로 두고 관리 요청(admA) · 소켓 hello 에 싣는다 · 명단에서 빠지면 그 토큰이 곧바로 auth(admAuthLost)
   옛 서버(명단 없음)는 emp 를 주지 않아 adm_emp 가 비고 예전처럼 코드 · 기기 토큰만 · 명단을 아직 저장하지 않은 서버는 코드만 맞으면 들어온다(서버 admIn_ 이행) */
function admEmp() { return S.get("adm_emp", ""); }
/* 관리 요청 인증 한 곳 · 토큰이 있으면 코드는 보내지 않는다(코드가 바뀐 뒤 옛 코드로 틀린 횟수가 쌓이지 않게) · 토큰이 없으면(옛 서버) 코드 · 사번이 있으면 aemp */
function admA(o) {
  var t = admTok(), e = admEmp();
  o.tok = t;
  if (!t) o.key = admKey();
  if (e) { o.aemp = e; if (!t) o.asc = "a"; }
  return o;
}
function admLock() { S.set("adm_key", ""); S.set("adm_role", ""); S.set("adm_tok", ""); S.set("adm_emp", ""); S.set("admin_authed", false); App.render(); }
/* v4.65 서버 잠금(reason locked · 이 연결에서 코드를 30번 틀림 · 10분) 문구 · retry = 남은 초 */
function admLockedMsg(r) { var m = Math.max(1, Math.ceil(Number((r && r.retry) || 600) / 60)); return "코드를 여러 번 틀려 이 연결이 잠겼어요 · " + m + "분 뒤 다시 · 급하면 모바일 데이터로 바꿔 주세요"; }
/* v4.65 저장해 둔 코드가 더는 맞지 않는다(코드를 바꿈) · 같은 코드로 계속 보내면 틀린 횟수가 쌓여 이 연결이 잠기므로 지우고 다시 받는다 */
/* v4.86 사번으로 들어온 폰은 명단에서 빠져도 auth 다(서버가 둘을 가르지 않는다) */
function admLostMsg() { return admEmp() ? "코드가 바뀌었거나 명단에서 빠졌어요" : "관리코드가 바뀌었어요"; }
function admAuthLost() { var m = admLostMsg(); admLock(); toast(m + " · 다시 입력해 주세요"); }
/* keep=false 면 코드를 이 기기에 남기지 않는다.
   담당자 적립은 **참가자 폰**에서 도는 화면이라, 여기서 관리코드를 저장하면
   그 참가자 기기에 코드가 영구히 남는다(260830 발견 · cd92d8c에서 들어간 회귀).
   v4.86 staffEmp = 담당자 적립에서 스태프가 친 사번(참가자 세션은 싣지 않는다 · 그 폰의 로그인은 참가자 것) · done(역할, 코드, 응답) */
function admVerify(v, done, keep, staffEmp) {
  v = String(v || "").trim();
  if (!v) { toast("코드를 입력해 주세요"); return; }
  /* 서버가 판정하므로 서버 없이는 열 수 없다. 로컬 비교로 되돌리면 상수가 되살아난다. */
  if (!BE.on) { toast("서버에 연결되지 않아 관리자 모드를 열 수 없습니다."); return; }
  var u = S.get("user", {}) || {}, q = { action: "admin_check", key: v };
  if (keep === false) { if (staffEmp) { q.aemp = String(staffEmp); q.asc = "a"; } }
  else if (u.empId) { q.aemp = String(u.empId); q.asc = "a"; if (u.ses) q.ases = String(u.ses); }   /* v4.86 로그인 안 한 폰은 예전처럼 코드만(기기) */
  beCall(q, function (res) {
    if (res && res.ok) {
      if (keep !== false) {
        S.set("adm_key", v);
        S.set("adm_role", res.role || "admin");
        S.set("adm_tok", res.tok || "");   /* v4.65 */
        S.set("adm_emp", res.emp && res.tok ? String(res.emp) : "");   /* v4.86 새 서버만 · 옛 서버는 빈 값(예전 방식) */
      }
      done(res.role || "admin", v, res);
    } else if (res && res.reason === "ses") { SES.need = true; toast("로그인 확인이 필요해요 · 비밀번호를 넣은 뒤 다시 확인해 주세요"); setTimeout(sesAsk, 300); }   /* v4.86 이 폰의 로그인 토큰이 그 사번 것이 아님 · 지남 */
    else toast(res && res.reason === "locked" ? admLockedMsg(res) : q.aemp ? "명단에 없는 사번이거나 코드가 맞지 않아요" : "코드가 올바르지 않습니다.");   /* v4.65 잠금은 틀린 코드와 다르게 */
  }, function () { toast("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."); });
}

/* ════════════════ v4.76 웹 푸시 · 260930 사용자 확정 (루트 「웹 푸시 기획.md」 2 · 4장 · 「홈 화면 설치 유도 · 레드팀 토론.md」 3장 채택 1 · 2) ════════════════
 * 원칙: 푸시는 「알림」이지 정본이 아니다 · 푸시에 실린 것은 모두 앱 안(sync)에도 있다 · 못 받아도 앱을 열면 같은 것을 본다.
 * 켜지는 조건: sync 공용 push = { k: 공개키 }(새 서버 · 비밀값 있는 Worker) · 로그인 · 데모 · TV · 셀프 화면이 아님. 옛 서버(GAS)는 push 가 없어 아무것도 뜨지 않는다.
 * 권한은 첫 화면에서 묻지 않는다: 가치가 생기는 순간 세 곳(포토부스 번호 받은 직후 · 커피챗 신청 직후 · 혼잡 「풀리면 알림」)과
 *   홈 화면 앱으로 처음 입장한 직후 한 번 · 설정 › 알림 에서 언제든. 앱 안 안내 시트 → 브라우저 허용창 두 단계(시트를 X 로 닫아도 허용창은 소모되지 않는다).
 *   같은 자리는 이 화면에서 한 번 · 하루 3번(axf_push_ask · 기기 저장) · 브라우저에서 「차단」이면 더 묻지 않는다.
 * 환경(envKind): push(안드로이드 크롬 · 삼성 인터넷 · 엣지 · PC · 아이폰 홈 화면 앱) · ios-tab(아이폰 사파리 탭 → 홈 화면 추가 단계 시트)
 *   · ios-old(iOS 16.3 이하 · 알림 항목 숨김) · inapp(카카오톡 · 네이버 · 하이웍스 등 앱 속 화면 → 다른 브라우저로 열기) · none.
 * 앱을 열 때마다(첫 sync) 허용된 기기는 구독을 다시 확인해 서버에 보낸다(push_sub · 같은 기기 덮어쓰기 · 사번이 바뀌면 소유가 옮겨진다).
 *   전에 보낸 주소인데 서버에 없었으면(had 0 · 410 · 연속 실패로 서버가 지웠다) 새로 구독한다(260930 실폰에서 410 을 봤다).
 * 로그아웃 = 이 기기 구독을 지우고 서버에서도 해제(공용 폰에서 앞 사람 알림이 다음 사람에게 뜨지 않게).
 * 알림을 누르면 서비스워커가 열린 앱 창에 화면 이동을 넘기거나 index.html#go=화면&n=사건키 로 연다(pushGoTake · 로그인 전이면 로그인 뒤).
 * 앱 화면이 보이는 동안 온 푸시는 서비스워커가 OS 알림 대신 여기로 넘긴다(아이폰은 늘 OS 알림 · 실폰 확인 항목) · 포토 · 커피챗 · 공지는 sync 한 번으로(앱 안 팝업 한 곳) · 그 밖은 앱 안 팝업.
 * v4.78 (260930 레드팀 채택안 · 루트 「웹 푸시 레드팀 토론.md」) 관람 시간 행은 서버 발송 스위치가 켜졌을 때만(vis) · 시트 버튼 「허용을 눌러 주세요」 · 아이폰 탭 · 앱 속 안내는 하루 한 번 ·
 *   서버가 푸시 없음(push = 0 · 행사 끝 · 옛 서버)을 알리면 이 기기 구독을 스스로 해제(전체 정지 { off: 1 } 은 숨기기만) · 알림이 꺼진 번호 보유자에게 한 줄 · 누르면 공지 목록(notices) · DAP 상담 알림. */
var PUSH = { k: "", vis: 0, booted: false, busy: false, asked: {}, after: null, me: null, firstWant: false };
var PUSH_ASK_DAY = 3;
function pushPerm() { try { return "Notification" in window ? Notification.permission : "denied"; } catch (e) { return "denied"; } }
function pushIosVer(ua) { var m = /OS (\d+)_(\d+)/.exec(ua || ""); return m ? [Number(m[1]), Number(m[2])] : [17, 0]; }   /* 아이패드 데스크톱 UA 는 버전이 없다 · 최신으로 본다 */
function envKind() {
  var ua = navigator.userAgent || "", sa = visitStandalone(), r = visitRoute(ua, sa);
  if (r === "kakao" || r === "naver" || r === "inapp") return "inapp";
  var ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.isSecureContext !== false;
  if (visitDev(ua, navigator.maxTouchPoints || 0) === "ios") {
    if (ok && sa) return "push";
    var v = pushIosVer(ua);
    return v[0] > 16 || (v[0] === 16 && v[1] >= 4) ? "ios-tab" : "ios-old";
  }
  return ok ? "push" : "none";
}
function pushReady() { var u = S.get("user", {}) || {}; return !!PUSH.k && BE.on && !!u.empId && !!u.ses && !/^#(demo|self|tv=)/i.test(VISIT.hash0) && !(typeof tsfOn === "function" && tsfOn()); }
/* v5.34 로그인 토큰(ses)이 없는 옛 로그인 폰 · 알림 줄을 숨기지 않고 「다시 로그인하면 알림을 켤 수 있어요」 */
function pushRelogin() { var u = S.get("user", {}) || {}; return !!PUSH.k && BE.on && !!u.empId && !u.ses && !/^#(demo|self|tv=)/i.test(VISIT.hash0) && !(typeof tsfOn === "function" && tsfOn()); }
function pushB64(s) { s = String(s).replace(/-/g, "+").replace(/_/g, "/"); var b = atob(s + "===".slice((s.length + 3) % 4)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function pushB64e(buf) { var u = new Uint8Array(buf), s = ""; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
/* sync 공용 push · 공개키가 바뀌면(환경 · 키 교체) 다시 확인한다 */
function pushCfg(p) {
  var k = p && typeof p === "object" && p.k ? String(p.k) : "";
  PUSH.vis = p && typeof p === "object" && Number(p.vis) === 1 ? 1 : 0;   /* v4.78 A6 관람 시간 발송 스위치 */
  if (p === 0) pushDrop();   /* v4.78 A15 서버가 푸시 없음(행사 끝 · 옛 서버) · 이 기기 구독을 스스로 해제(서버 호출 없이) */
  if (k === PUSH.k) return;
  PUSH.k = k;
  if (!k) { if (el("fsPush")) el("fsPush").hidden = true; return; }
  PUSH.booted = false;
  setTimeout(pushBoot, 1200);
  if (PUSH.firstWant) setTimeout(pushFirst, 1600);
  if (el("fsPush")) el("fsPush").hidden = false;
}
/* v4.78 A15 · 이 기기 구독 해제(브라우저 구독 객체 · 저장한 주소 · 내 상태) · 서버에는 묻지 않는다(서버가 이미 푸시 없음이라고 했다) · 권한은 그대로라 다시 켜지면 앱을 열 때 새로 구독한다 */
function pushDrop() {
  if (!S.get("push_ep", "") && !PUSH.k) return;
  S.put("push_ep", ""); S.set("push_me", null); PUSH.me = null; PUSH.booted = false;
  try {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistration) return;
    navigator.serviceWorker.getRegistration().then(function (reg) { return reg && reg.pushManager ? reg.pushManager.getSubscription() : null; })
      .then(function (sub) { if (sub) sub.unsubscribe().then(function () {}, function () {}); }, function () {});
  } catch (e) {}
}
function pushBoot() { if (PUSH.booted || !pushReady()) return; PUSH.booted = true; if (envKind() === "push" && pushPerm() === "granted") pushEnsure(); }
function pushSw(cb) {
  if (!("serviceWorker" in navigator)) { cb(null); return; }
  var done = false, t = setTimeout(function () { if (!done) { done = true; cb(null); } }, 8000);
  var fin = function (r) { if (!done) { done = true; clearTimeout(t); cb(r || null); } };
  navigator.serviceWorker.getRegistration().then(function (r) { return r || navigator.serviceWorker.register("sw.js"); })
    .then(function () { return navigator.serviceWorker.ready; }).then(fin, function () { fin(null); });
}
function pushKeySame(sub) { try { var k = sub.options && sub.options.applicationServerKey; return !k || pushB64e(k) === PUSH.k; } catch (e) { return true; } }
/* 허용된 기기 · 구독을 확인하고(없거나 키가 바뀌었으면 새로) 서버에 보낸다 · then(ok, 까닭) */
function pushEnsure(then, again) {
  then = then || function () {};
  if (!pushReady() || envKind() !== "push" || pushPerm() !== "granted") { then(false, "env"); return; }
  if (PUSH.busy && !again) { then(false, "busy"); return; }
  PUSH.busy = true;
  var fin = function (ok, why) { PUSH.busy = false; then(ok, why); };
  pushSw(function (reg) {
    if (!reg || !reg.pushManager) { fin(false, "sw"); return; }
    reg.pushManager.getSubscription().then(function (sub) {
      if (sub && (!pushKeySame(sub) || again)) return sub.unsubscribe().then(function () { return null; }, function () { return null; });
      return sub;
    }).then(function (sub) {
      return sub || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: pushB64(PUSH.k) });
    }).then(function (sub) {
      var j = sub && sub.toJSON ? sub.toJSON() : null, u = S.get("user", {}) || {};
      if (!j || !j.endpoint || !j.keys) { fin(false, "sub"); return; }
      beCall({ action: "push_sub", emp: u.empId, ep: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, dev: visitDev(navigator.userAgent, navigator.maxTouchPoints || 0) }, function (r) {
        if (!r || !r.ok) { fin(false, (r && r.reason) || "srv"); return; }
        var was = S.get("push_ep", "");
        S.put("push_ep", j.endpoint);
        if (!r.had && was === j.endpoint && !again) { PUSH.busy = false; pushEnsure(then, true); return; }   /* 서버가 지운 주소(410 · 연속 실패) · 새로 구독 */
        PUSH.me = r.push || null; S.set("push_me", r.push || null);
        fin(true);
      }, function () { fin(false, "net"); });
    }).catch(function (e) { fin(false, "sub:" + ((e && e.name) || "")); });
  });
}
function pushAskOk() { var a = S.get("push_ask", {}) || {}; return a.d !== new Date().toDateString() || (a.n || 0) < PUSH_ASK_DAY; }
function pushAskMark() { var a = S.get("push_ask", {}) || {}, d = new Date().toDateString(); if (a.d !== d) a = { d: d, n: 0 }; a.n = (a.n || 0) + 1; S.put("push_ask", a); }
/* 가치 순간 · ctx = photo | cchat | crowd | first · after(ok) = 켠 뒤 이어서 할 일(혼잡 감시 등) · 시트를 띄웠으면 true */
function pushAsk(ctx, opt, after) {
  if (!pushReady()) return false;
  var k = envKind(), perm = pushPerm();
  if (k === "push" && perm === "granted") { pushEnsure(after); return false; }
  if (perm === "denied" || k === "none" || k === "ios-old") return false;
  if (k === "ios-tab" || k === "inapp") {   /* v4.78 A13 같은 「홈 화면에 추가」 · 「다른 브라우저」 안내는 하루 한 번(자리마다 되풀이하면 압박) */
    var today = new Date().toDateString();
    if (S.get("push_ask_ios", "") === today) return false;
    S.put("push_ask_ios", today);
    PUSH.after = null;
    pushSheetWait(ctx, opt || {}, 0);
    return true;
  }
  if (PUSH.asked[ctx] || !pushAskOk()) return false;
  PUSH.asked[ctx] = 1;
  pushAskMark();
  PUSH.after = after || null;
  pushSheetWait(ctx, opt || {}, 0);
  return true;
}
/* 떠 있는 팝업(번호표 안내 등) · 시트 · 스탬프 연출이 닫힌 뒤에 */
function pushSheetWait(ctx, opt, n) {
  if (n > 150) return;
  if (typeof tourInvHold === "function" && tourInvHold()) { setTimeout(function () { pushSheetWait(ctx, opt, n); }, 400); return; }   /* v5.46 둘러보기가 열려 있는 동안 · 닫힌 뒤(기다린 시간은 세지 않는다) · v5.83 초대 시트 삭제 */
  if (el("modal") || el("axsSheet") || SPOP.cur || SPOP.q.length || el("app").hidden || el("rgPlay")) { setTimeout(function () { pushSheetWait(ctx, opt, n + 1); }, 400); return; }
  pushSheet(ctx, opt);
}
var PUSH_T = { photo: "차례가 되면 알려 드려요", cchat: "매칭되면 알려 드려요", crowd: "풀리면 알려 드려요", dap: "승인되면 알려 드려요", first: "알림을 켤까요?" };   /* v5.83 dap = DAP 과제상담 신청 직후(가치 순간 · 최초 진입 가볍게) */
function pushExHtml(ctx, opt) {
  var t = "포토부스 입장하세요", b = "1F · " + (opt.no || 14) + "번 · 10분 안에 입장";   /* v4.78 A10 실제 푸시 문구와 같게(제목에 주제어) */
  if (ctx === "cchat" || ctx === "first") { t = "커피챗 매칭 완료"; b = "18F · 15:00 · TABLE 3"; }   /* v5.05 포토부스 대기 폐지면 처음 안내 예시도 커피챗 */
  if (ctx === "dap") { t = "AX 라운지 승인 완료"; b = "1F AX 라운지 · 14:20"; }   /* v5.83 실제 승인 알림(notifyUser)과 같은 말 · 개편안 초안 「과제상담」은 v5.64 이름 규칙(AX LOUNGE 상담)으로 */
  if (ctx === "crowd") { t = opt.tgt === "lobby" ? "1F 로비 혼잡이 풀렸어요" : "엘리베이터 혼잡이 풀렸어요"; b = (opt.tgt === "lobby" ? "1F 로비" : "1F 승강기 홀") + " · 15:07"; }
  return '<div class="axs-pex" aria-hidden="true"><img src="icons/icon-192.png" alt=""><div><b>' + esc(t) + "</b><span>" + esc(b) + "</span></div></div>";
}
function pushSheet(ctx, opt) {
  var k = envKind();
  if (k === "ios-tab") { pushIosSheet(); return; }
  if (k === "inapp") { pushInappSheet(); return; }
  sheetOpen({ id: "push", title: PUSH_T[ctx] || PUSH_T.first, lead: ctx === "first" ? ("커피챗 매칭과 공지를 알려 드려요") : "앱을 닫아도 잠금 화면에 알림이 와요",
    body: pushExHtml(ctx, opt) + '<p class="axs-pnote">허용하면 이 기기로 알림을 보냅니다. 행사 후 삭제됩니다</p>',
    go: "pushAllow()", goLbl: "알림 받기", goBusy: "허용을 눌러 주세요" });   /* v4.78 A13 브라우저 허용창이 떠 있는 동안 */
}
/* 브라우저 허용창은 사용자의 탭 안에서만(아이폰 규칙) · 허용되면 구독 → 서버 · 거절이면 시트만 닫는다(앱 안 알림은 그대로) */
function pushAllow() {
  if (SHEET.busy) return;
  if (!("Notification" in window)) { sheetFail("이 브라우저는 알림을 받을 수 없어요"); return; }
  sheetBusy(true);
  var once = false, tmo = null;
  var done = function (r) {
    if (once) return;
    once = true;
    clearTimeout(tmo);
    var a = PUSH.after;
    PUSH.after = null;
    if (r !== "granted") { sheetClose(true); App.render(); return; }
    pushEnsure(function (ok) {
      sheetClose(true);
      toast(ok ? "알림을 켰어요" : "알림을 켜지 못했어요 · 설정 › 알림에서 다시");
      if (a) a(ok);
      App.render();
    });
  };
  /* v5.76 밤샘 QA · 허용창이 뜨지 않거나(조용한 권한 알림 · 일부 브라우저) 답이 오지 않으면 「허용을 눌러 주세요」 덮개가 끝없이 남아 뒤로 · 탭으로도 빠져나갈 수 없었다 · 25초 뒤 닫는다(나중에 허용하면 다음에 열 때 pushFirst 가 구독한다) */
  tmo = setTimeout(function () { if (!once) { done("timeout"); toast("알림 허용 창이 보이지 않으면 설정 › 알림에서 다시 켜 주세요"); } }, 25000);
  try { var pr = Notification.requestPermission(done); if (pr && pr.then) pr.then(done, function () { done("default"); }); } catch (e) { done("default"); }
}
/* 아이폰 사파리 탭 · 알림은 홈 화면 앱에서만(iOS 16.4 · 설치 뒤 로그인을 다시 한다) */
function pushIosSheet() {
  var io = a2hsIosSteps(navigator.userAgent, navigator.maxTouchPoints || 0);   /* v5.01 바로가기 설치 안내와 같은 단계 */
  sheetOpen({ id: "pushios", title: "알림은 홈 화면 앱에서 받아요",
    body: (io.steps.length ? '<ol class="axs-psteps">' + io.steps.map(function (t, i) { return '<li><span class="n">' + (i + 1) + "</span><span>" + t + "</span></li>"; }).join("") + "</ol>" : "") +
      io.notes.map(function (t) { return '<p class="axs-pnote">' + t + "</p>"; }).join("") + '<p class="axs-pnote">앱 안 브라우저에서는 추가할 수 없어요. Safari로 열어 주세요</p>',
    go: "sheetClose()", goLbl: "확인" });
}
function pushInappSheet() {
  sheetOpen({ id: "pushin", title: "다른 브라우저로 열어 주세요", lead: "메신저 안에서는 알림을 받을 수 없어요",
    body: '<p class="axs-pnote">오른쪽 위 메뉴에서 다른 브라우저로 열기 · 아이폰은 Safari · 안드로이드는 Chrome</p>',
    go: "a2hsCopy(); sheetClose()", goLbl: "주소 복사" });
}
/* 로그인 직후(a2hsAuto) · 허용된 기기는 이 사번으로 다시 등록 · 홈 화면 앱으로 처음 들어온 사람에게만 한 번 묻는다 */
function pushFirst() {
  PUSH.firstWant = true;
  if (!pushReady()) return;
  PUSH.firstWant = false;
  if (envKind() === "push" && pushPerm() === "granted") { pushEnsure(); return; }
  if (!visitStandalone() || S.get("push_first", false)) return;
  S.put("push_first", true);
  pushAsk("first", {});
}
/* 설정 › 알림 · 상태 한 줄 + 내 차례 · 매칭(끌 수 없음) · 공지 · 추첨 · 관람 시간(근무 층) */
function pushState() {
  var k = envKind(), perm = pushPerm(), me = PUSH.me || S.get("push_me", null);
  if (k === "inapp") return { st: "다른 브라우저로 열어야 켤 수 있어요", act: "inapp" };
  if (k === "ios-tab") return { st: "홈 화면 앱에서만 켤 수 있어요", act: "ios" };
  if (k !== "push") return { st: "이 기기는 알림을 받을 수 없어요" };
  if (perm === "denied") return { st: "알림이 꺼져 있어요", sub: "브라우저 설정에서 알림을 허용해야 켜져요" };
  if (perm === "granted" && me && me.n > 0) return { st: "알림 켜짐", on: 1, me: me };
  return { st: "알림 꺼짐", act: "on" };
}
function pushTgl(nm, k, on) {
  return '<button type="button" class="axs-pset axs-ptgl' + (on ? " on" : "") + '" role="switch" aria-checked="' + on + '" onclick="pushPrefSet(\'' + k + "', " + (on ? 0 : 1) + ')"><span>' + nm + "</span><b>" + (on ? "켜짐" : "꺼짐") + "</b></button>";
}
function pushSetPaint() {
  var s = pushState(), me = s.me || {}, rows = "";
  if (s.on) {
    var fl = Number(me.floor) || 0, fls = "";
    for (var f = 3; f <= 15; f++) fls += '<button type="button" class="axs-flr' + (f === fl ? " on" : "") + '" aria-pressed="' + (f === fl) + '" onclick="pushPrefSet(\'floor\', ' + f + ')">' + f + "층</button>";
    rows = '<div class="axs-psets"><div class="axs-pset"><span>내 차례 · 매칭</span><b>켜짐</b></div>' + pushTgl("공지 · 추첨", "pub", me.pub !== 0) + (PUSH.vis === 1 ? pushTgl("관람 시간", "visit", me.visit === 1) : "") + "</div>" +
      (PUSH.vis === 1 && me.visit === 1 ? '<p class="axs-pnote">근무 층</p><div class="axs-flrs">' + fls + "</div>" : "");   /* v4.78 A6 관람 시간 행 · 근무 층은 서버 발송 스위치가 켜졌을 때만(꺼져 있으면 유령 스위치) */
  }
  var go = s.act === "on" ? "pushSetOn()" : s.act === "ios" ? "sheetClose(true); pushIosSheet()" : s.act === "inapp" ? "sheetClose(true); pushInappSheet()" : "sheetClose()";
  var spec = { id: "pushset", title: "알림", lead: esc(s.st) + (s.sub ? "<br>" + esc(s.sub) : ""), body: rows, go: go, goLbl: s.act === "on" ? "알림 받기" : s.act ? "방법 보기" : "닫기", goBusy: s.act === "on" ? "허용을 눌러 주세요" : "켜는 중" };
  if (SHEET.id === "pushset" && el("axsSheet")) { SHEET.spec = spec; sheetPaint(); } else sheetOpen(spec);
}
function pushSetOpen() {
  if (!pushReady() && pushRelogin()) {
    sheetOpen({ id: "pushrl", title: "알림", lead: "다시 로그인하면 알림을 켤 수 있어요",
      body: '<p class="axs-pnote">설정 › 로그아웃 · 다른 사번으로 입장 › 사번 · 이름 · 비밀번호로 다시 입장</p>', go: "sheetClose()", goLbl: "확인" });
    return;
  }
  pushSetPaint();
  var u = S.get("user", {}) || {};
  if (BE.on && u.empId && PUSH.k) beCall({ action: "push_me", emp: u.empId }, function (r) {
    if (r && r.ok) { PUSH.me = r.push || null; S.set("push_me", r.push || null); if (SHEET.id === "pushset" && el("axsSheet") && !SHEET.busy) pushSetPaint(); }
  }, function () {});
}
function pushSetOn() { PUSH.after = function () { pushSetOpen(); }; pushAllow(); }
/* k = pub | visit | floor · 같은 층을 다시 누르면 층을 비운다 */
function pushPrefSet(k, v) {
  var me = PUSH.me || S.get("push_me", null) || {}, u = S.get("user", {}) || {};
  if (!u.empId || SHEET.busy) return;
  var kinds = { pub: me.pub === 0 ? 0 : 1, visit: me.visit === 1 ? 1 : 0 }, p = { action: "push_pref", emp: u.empId };
  if (k === "floor") p.floor = String(Number(me.floor) === v ? "" : v);
  else { kinds[k] = v; p.kinds = JSON.stringify(kinds); }
  SHEET.busy = true;
  beCall(p, function (r) {
    SHEET.busy = false;
    if (r && r.ok) { PUSH.me = r.push || null; S.set("push_me", r.push || null); }
    else toast("바꾸지 못했어요 · 잠시 뒤 다시");
    if (SHEET.id === "pushset" && el("axsSheet")) pushSetPaint();
  }, function () { SHEET.busy = false; toast("서버에 연결할 수 없어요"); });
}
/* 로그아웃 · 이 기기 구독 지우기 + 서버 해제(주소로 · 토큰 없이도) · 1.5초 안에 끝나지 않아도 로그아웃은 한다 */
function pushLogout(next) {
  var fin = false, go = function () { if (!fin) { fin = true; next(); } };
  setTimeout(go, 1500);
  try {
    if (!("serviceWorker" in navigator)) { go(); return; }
    navigator.serviceWorker.getRegistration().then(function (reg) { return reg && reg.pushManager ? reg.pushManager.getSubscription() : null; }).then(function (sub) {
      if (!sub) { go(); return; }
      var ep = sub.endpoint, u = S.get("user", {}) || {};
      sub.unsubscribe().then(function () {}, function () {});
      if (BE.on) beCall({ action: "push_unsub", emp: u.empId || "", ep: ep }, go, go); else go();
    }, go);
  } catch (e) { go(); }
}
/* 알림을 누름 · 화면 이동 + 같은 사건의 앱 안 팝업을 본 것으로(폴링 팝업이 다시 뜨지 않게) */
function pushSeen(tag) {
  var m, s = S.get("noti_seen", {}), chg = false;
  if ((m = /^photo:(\d+):(near|call)$/.exec(tag || ""))) {
    var no = Number(m[1]);
    if (s.photoNear !== no) { s.photoNear = no; chg = true; }
    if (m[2] === "call" && s.photoCall !== no) { s.photoCall = no; chg = true; }
  } else if ((m = /^cchat:(\d{1,2}:\d{2}):(.+)$/.exec(tag || ""))) {
    var k = "m:" + m[1] + m[2];
    if (s.cchat !== k) { s.cchat = k; chg = true; }
  } else if ((m = /^dap:([A-Za-z0-9]+):ok$/.exec(tag || ""))) {   /* v4.78 D1 DAP 상담 승인 알림 = 앱 안 「과제상담 승인 완료」를 본 것으로 */
    if (s.resv !== m[1] + ":approved") { s.resv = m[1] + ":approved"; chg = true; }
  }
  if (chg) S.set("noti_seen", s);
}
function pushGo(go, tag) {
  pushSeen(tag);
  if (["home", "photoq", "ev_cchat", "dap", "notices"].indexOf(go) < 0) go = "home";   /* v4.78 A5 notices = 공지 목록(긴급 공지 · 대상 지정) */
  if (!((S.get("user", {}) || {}).empId) || el("app").hidden) { PUSHGO = { go: go, tag: tag || "" }; return; }
  if (typeof DET !== "undefined") DET.canon = Date.now();   /* v5.69 푸시 · 딥링크 = 그 항목이 있는 목록 위에 상세 시트 */
  App.go(go);
}
function pushGoRun() { if (!PUSHGO) return; var g = PUSHGO; PUSHGO = null; pushGo(g.go, g.tag); }
/* 앱 화면이 보일 때 온 푸시 · 포토 · 커피챗 · 공지는 sync 로(앱 안 팝업 한 곳) · 그 밖은 앱 안 팝업 */
function pushIn(d) {
  if (!d || document.visibilityState !== "visible") return;
  var tag = String(d.tag || "");
  if (/^(photo|cchat|dap):/.test(tag) || /^N\d+$/.test(tag)) { if (typeof wsSyncSoon === "function") wsSyncSoon(800); return; }   /* v4.78 dap: 승인은 앱 안 「과제상담 승인 완료」 한 곳 */
  if (!d.t) return;
  notice({ key: "push:" + (tag || d.j || d.t), title: String(d.t), body: String(d.b || ""), go: d.go && d.go !== "home" ? d.go : "", urgent: !!d.u });
}
if ("serviceWorker" in navigator) {
  try {
    navigator.serviceWorker.addEventListener("message", function (e) {
      var m = e.data || {};
      if (m.axf === "go") pushGo(String(m.go || "home"), String(m.tag || ""));
      else if (m.axf === "push") pushIn(m.d || {});
    });
  } catch (e) {}
}
/* 혼잡 「풀리면 알림」 · 그 대상이 지금 혼잡일 때만 · 한 번짜리(풀리거나 제보가 끝나면 알림 1건 · 90분) */
var CWATCH_MS = 5400000;
function crowdWatchGet() {
  var w = S.get("crowd_watch", {}) || {}, o = {}, now = Date.now();
  [["lobby", "l"], ["elev", "e"]].forEach(function (t) { if (w[t[0]] && now - w[t[0]] < CWATCH_MS && crowdJam(t[1])) o[t[0]] = w[t[0]]; });
  return o;
}
function crowdWatchHtml() {
  if (!pushReady() || envKind() === "ios-old" || envKind() === "none") return "";
  var w = crowdWatchGet(), rows = [["l", "lobby", "1F 로비"], ["e", "elev", "엘리베이터"]].filter(function (t) { return crowdJam(t[0]); });
  if (!rows.length) return "";
  return '<div class="cwatch">' + rows.map(function (t) {
    return w[t[1]] ? '<p class="cw-on">' + t[2] + " · 풀리면 알림 받는 중</p>"
      : '<button type="button" class="ax-link cw-go" onclick="crowdWatchOn(\'' + t[1] + "')\">" + t[2] + " 풀리면 알림</button>";
  }).join("") + "</div>";
}
function crowdWatchOn(tgt) {
  var send = function () {
    var u = S.get("user", {}) || {};
    beCall({ action: "push_watch", emp: u.empId || "", tgt: tgt, on: "1" }, function (r) {
      if (r && r.ok) { var w = S.get("crowd_watch", {}) || {}; w[tgt] = Date.now(); S.set("crowd_watch", w); toast("풀리면 알려 드려요"); return; }
      toast({ nojam: "지금은 혼잡 제보가 없어요", max: "오늘은 더 켤 수 없어요", late: "18:00 뒤에는 알림을 보내지 않아요" }[r && r.reason] || "켜지 못했어요 · 잠시 뒤 다시");
    }, function () { toast("서버에 연결할 수 없어요"); });
  };
  if (envKind() === "push" && pushPerm() === "granted") { pushEnsure(function (ok) { if (ok) send(); else toast("알림을 켜지 못했어요"); }); return; }
  if (!pushAsk("crowd", { tgt: tgt }, function (ok) { if (ok) send(); })) {
    if (pushPerm() === "denied") toast("브라우저 설정에서 알림을 허용해야 켜져요");
    else { var k = envKind(); if (k === "ios-tab") pushIosSheet(); else if (k === "inapp") pushInappSheet(); }
  }
}

