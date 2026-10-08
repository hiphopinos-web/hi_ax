/* ════════════════ 스플래시 → 앱 진입 ════════════════ */
(function () {
  var splash = el("splash");
  function enterApp() { xitionRun(enterNow); }
  function enterNow(scene) {   /* v4.87 scene = 최초 로그인 장면이 덮은 뒤 · 찍은 QR · 알림 이동 · 큰글씨 안내는 장면이 닫힌 뒤(lgxAfter) */
    splash.classList.add("gone");
    el("frame").classList.remove("splash-mode");
    el("app").hidden = false;
    axfStop(el("kvCv"));
    BILL.t0 = performance.now();   /* v3.89 입장 전환이 끝나는 순간 = 광고판 위상 0 · 전환의 ME to WE 심볼에서 그대로 이어진다 */
    /* v5.83 (최초 진입 가볍게) 큰글씨 안내 토스트 삭제 · 헤더 「일반 · 큰글씨」 토글이 늘 보인다 */
    /* v4.06 스캔 링크(#s= · #q=)는 스크립트 시작 때 주소에서 꺼내 두었다(scanLinkTake) · 보던 탭으로 들어간 뒤 같은 분기(qrRoute)로 */
    var target = "home";
    try {
      var lt = sessionStorage.getItem("axf_last_tab");
      if (["home", "guide", "exp", "my", "passport", "guide_time"].indexOf(lt) >= 0) target = lt;
      var lf = parseInt(sessionStorage.getItem("axf_last_fl"), 10);
      if ([1, 10, 17, 18].indexOf(lf) >= 0) PROG.fl = lf;
    } catch (e) {}
    App.go(target);
    if (!scene) {
      setTimeout(scanLinkRun, 400);
      setTimeout(pushGoRun, 500);   /* v4.76 알림을 눌러 들어왔으면 그 화면으로 */
    }
    setTimeout(function () { if (typeof ntcCheck === "function") ntcCheck(); }, 700);   /* 261007 앱을 열 때 안 읽은 최근 공지 = 시트 한 번(장면 · 팝 · 다른 안내가 끝난 뒤 · 대기열) */
  }
  // 캡처 모드(#...cap): 프레임을 좌상단 고정 정폭으로 · 헤드리스 스크린샷용
  if (/cap/.test(location.hash)) {
    document.body.style.justifyContent = "flex-start";
    var fr = el("frame");
    fr.style.width = "448px"; fr.style.maxWidth = "none"; fr.style.boxShadow = "none";
  }

  /* v4.32 1F 현장 셀프 모드 노트북 · 로그인 없음 · #self(스태프가 켜는 화면) 또는 이미 켠 기기(새로 고침 · 재부팅해도 참가자 화면으로) */
  if (/^#self/i.test(location.hash) || (tsfOn() && !/^#tv=type/i.test(location.hash))) {   /* v4.65 셀프 노트북에서도 #tv=type 주소는 TV 판으로 */
    splash.classList.add("gone");
    el("frame").classList.remove("splash-mode");
    el("app").hidden = false;
    App.go("type_site");
    return;
  }

  /* v3.37 1F TV 순위판 · 로그인 없음 · 공개 순위(닉네임만)만 읽는다 */
  if (/^#tv=type/i.test(location.hash)) {
    TYTV.fix = tyTvFix(location.hash);   /* v4.59 #tv=type&fix=site = 1F 타자왕 부스 세로 TV(현장 TOP 10 고정) · 없으면 기존 순환 */
    splash.classList.add("gone");
    el("frame").classList.remove("splash-mode");
    el("app").hidden = false;
    App.go("wall_type");
    return;
  }

  // 데모/캡처 훅: #demo=화면명 으로 열면 로그인·데이터 세팅 후 해당 화면으로 바로 진입 (스크린샷·시연용)
  var dm = location.hash.match(/^#demo(?:=(\w+))?/i);
  if (dm) {
    LS_OK = false;   /* 데모 시드가 실사용 저장소를 오염시키지 않게 */
    /* 서버 sync 가 시드를 덮어 화면마다 스탬프 수가 달라졌다. 데모는 결정적이어야 한다 */
    GAS_URL = ""; BE.on = false;
    S.set("user", { empId: "1234", name: "박형동" });
    stampVerSet(2);
    S.set("stamps", ["lg", "qz", "p4"]);   /* 3/6 = 룰렛 열림 · v4.83 새 8종(최초 로그인 · AX 퀴즈 · 미니 게임) */
    S.set("roulette_open", true);
    /* v3.40 · 캡처(&cap)만 결정적 고정 시드 · 일반 데모는 테스트 오버레이(test_mine)가 내 일정을 채운다 */
    if (/cap/.test(location.hash)) {
      S.set("cchat", { status: "matched", round: "14:30", table: "B", ts: Date.now() });
    }
    S.set("gw_cleared", true);
    S.set("dept", "보상부문");
    S.set("ev_phase", "live");
    var nq = location.hash.match(/[&#]now=(\d{1,2}:\d{2})/);   /* v5.21 시험 시각 고정(hmNow · attNow) · 데모에서만 · 261007 시험 시각 tt(10/26)로 */
    if (nq) S.set("tt", { d: "day", m: t2m(nq[1]) });
    /* v4.71 혼잡 제보 캡처 · &crowd=e(엘리베이터 혼잡) · l(로비 혼잡) · p(엘리베이터 예상) · s(계단 연결 ON) 글자를 섞어 쓴다 */
    var cnq = location.hash.match(/[&#]cn=((?:[rpa][0-3]|h[0-5])+)/);   /* 261008 지금 현장 캡처 · &cn=r3p2a1h4 · r · p · a = 0 정보 없음 · 1 여유 · 2 보통 · 3 혼잡 · h = 0 ~ 5 · &cnst = 스태프 칸(명단 사번처럼) */
    if (cnq) {
      var t9 = appNow().getTime() - 180000, cnv = function (k) { var m = cnq[1].match(new RegExp(k + "(\\d)")); return m ? Number(m[1]) : 0; }, cnn = { on: 1, dot: /[&#]cnst/.test(location.hash) ? "h" : "", cal: { r: [40, 0], p: [40, 0], a: [300, 0] } };
      var Q = { r: [null, { lv: "ok", m: 1.3, q: 2 }, { lv: "mid", m: 6.7, q: 10 }, { lv: "jam", m: 13.3, q: 20 }], a: [null, { lv: "ok", m: 0, q: 0 }, { lv: "mid", m: 2.5, q: 4 }, { lv: "jam", m: 5, q: 8 }] };
      ["r", "p", "a"].forEach(function (k) { var v = cnv(k), b = (k === "a" ? Q.a : Q.r)[v]; cnn[k] = b ? { lv: b.lv, m: b.m, q: b.q, at: t9, s: "s" } : 0; });
      cnn.h = cnv("h") ? { lv: cnv("h"), at: t9 + 60000, s: "s" } : 0;
      S.set("crowd", { l: 0, e: 0, p: "", w: "", st: 0, h: 0, n: cnn });
      if (/[&#]cnst/.test(location.hash)) S.set("staff_me", true);
    }
    var cq = location.hash.match(/crowd=([elpshmj]+)/);   /* v5.68 h · m · j = 17F 대강당 여유 · 보통 · 혼잡(기조연설 · 데모 수) */
    if (cq) { var n0 = Date.now(), jm = { at: n0 - 180000, x: n0 + 720000 }, hl = /j/.test(cq[1]) ? ["jam", 210] : /m/.test(cq[1]) ? ["mid", 150] : /h/.test(cq[1]) ? ["ok", 120] : null; S.set("crowd", { l: /l/.test(cq[1]) ? jm : 0, e: /e/.test(cq[1]) ? jm : 0, p: /p/.test(cq[1]) ? "11:00-11:20" : "", w: /p/.test(cq[1]) ? "11:00-11:20" : "", st: /s/.test(cq[1]) ? 1 : 0, h: hl ? { id: "key", n: hl[1], lv: hl[0], seats: 230 } : 0 }); }
    var target = dm[1] || "home";
    if (["admin", "type_site", "type_award"].indexOf(target) >= 0) S.set("admin_authed", true);
    splash.classList.add("gone");
    el("frame").classList.remove("splash-mode");
    el("app").hidden = false;
    /* 캡처 전용 진입점 · qr = 내 QR 패널 (lec_<세션id> 훅은 v3.31 소개 영상 폐지로 삭제) */
    if (target === "qr") { App.go("home"); qrPanelOpen("mine"); return; }
    /* v4.87 최초 로그인 장면 시연 · #demo=home&lgx(=slow · fail · none · scan) · 로그인 화면(1막) 1.4초 뒤 장면 · 서버 흉내(기본 0.6초 뒤 적립) */
    var lq = location.hash.match(/[&#]lgx(?:=(\w+))?/);
    if (lq) {
      S.set("stamps", []); S.set("roulette_open", false); S.set("pp_seen", []);
      if (lq[1] === "scan") { try { sessionStorage.setItem(SCANLINK_KEY, JSON.stringify({ raw: "#q=idea", t: Date.now() })); } catch (e) {} }
      splash.classList.remove("gone"); el("frame").classList.add("splash-mode"); el("app").hidden = true; kvMountAll();
      setTimeout(function () {
        lgxStart("1234", "send", function () { splash.classList.add("gone"); el("frame").classList.remove("splash-mode"); el("app").hidden = false; App.go(target); }, true);
        var md = lq[1] || "ok";
        setTimeout(function () { if (md === "fail") lgxSrv("fail"); else if (md === "none") lgxSrv("none"); else { lgxLocal(); lgxSrv("ok"); } }, md === "slow" ? 6500 : md === "fail" ? 2000 : 600);
      }, 1400);
      return;
    }
    if (/xt/.test(location.hash)) { splash.classList.remove("gone"); xitionRun(function () { splash.classList.add("gone"); App.go(target); }); return; }
    App.go(target);
    return;
  }

  /* ── 재방문: 이 기기를 기억하고 있으면 영상 스플래시를 건너뛰고 비밀번호만 받는다 ── */
  /* v19: 이 기기에서 입장한 적 있으면 스플래시·비밀번호 없이 바로 재입장 (로그아웃은 설정에서) */
  scanLinkNote();   /* v4.06 찍고 들어왔는데 로그인 전이면 로그인 화면에 한 줄 */
  ogCheck();   /* 261008 단계별 오픈 · 지난번 「열려요」 화면을 받은 기기 = 그 화면을 먼저 깔고 서버에 다시 묻는다 */
  var savedU = S.get("user", {});
  if (savedU && savedU.empId) {
    /* 261007 (사용자 「로그인 기록이 있는 사람이 재차 들어오면 바로 메인으로」) 저장된 로그인 = 로그인 화면 · 입장 전환(1초) 없이 바로 홈(axf-saved 가 첫 그림부터 로그인 화면을 가린다) */
    enterNow(); document.documentElement.classList.remove("axf-saved");
    a2hsAuto();   /* v5.34 (311537 진단 · 사용자 261003) 로그인 유지로 홈 화면 앱을 처음 연 사람에게도 「알림을 켤까요?」 한 번(pushFirst · 기기당 1회 push_first · 차단이면 묻지 않음) · 허용된 기기는 다시 등록 */
    return;
  }
  document.documentElement.classList.remove("axf-saved");
  if (visitStandalone() && el("saCard")) { el("saCard").hidden = false; lfSoon(); }   /* v4.76 홈 화면 앱으로 처음 열림 · 로그인을 한 번 더 */
  var known = BE.on ? knownGet() : null;
  function quickLogin() {
    var pin = el("quickPin").value.trim();
    var qe = el("qErr"), btn = el("qBtn");
    if (btn.disabled) return;   /* v4.25 확인 중에 Enter · 버튼이 겹쳐도 한 번만 */
    var show = function (m, f) { lfErr(el("quickForm"), qe, m, f); };   /* v5.02 오류 = 흰 알약 + 문제 칸 테두리 */
    if (!/^\d{4}$/.test(pin)) { show("비밀번호 4자리를 입력해 주세요.", "quickPin"); return; }
    lfErrClear(el("quickForm"), qe);
    try { el("quickPin").blur(); } catch (e) {}   /* v4.94 키보드를 먼저 닫는다(서버를 기다리는 동안 · 장면은 키보드 없는 화면에서 시작) */
    lfBusy(btn, true);   /* v4.95 로그인 두 화면 예외 · 회색 대기 덮개(botWait) 없이 버튼 안에서만 기다린다 · 점은 계속 숨쉰다(design.md A-5 5번) */
    var reset = function () { lfBusy(btn, false, "입장"); };
    beHash(known.empId, pin).then(function (h) {
      beCall({ action: "login", emp: known.empId, name: known.name, h: h }, function (res) {
        if (!res || !res.ok) {
          reset();
          if (res && res.reason === "notopen") return;   /* 261008 단계별 오픈 · beCall 이 「열려요」 화면을 띄웠다 */
          var msg = {
            pw: "비밀번호가 맞지 않습니다. 처음 정한 4자리를 입력해 주세요.",
            lock: "비밀번호를 여러 번 틀렸어요. 10분 뒤 다시 시도하거나 운영 데스크에 문의해 주세요.",
            notfound: "사번을 확인하지 못했어요. 다시 확인해 주세요 · 계속되면 운영 데스크에 문의해 주세요",   /* v5.60 T11 */
            name: "이름이 사번과 맞지 않아요. 다시 확인해 주세요",
            param: "다시 시도해주세요."
          };
          show((res && msg[res.reason]) || "연결에 실패했어요. 잠시 후 다시 시도해주세요.", res && (res.reason === "pw" || res.reason === "lock") ? "quickPin" : "");
          el("quickPin").value = "";
          return;
        }
        personClaim(known.empId);   /* v4.56 */
        S.set("user", { empId: known.empId, name: res.name || known.name, dept: res.dept || "", ses: res.ses || "" });   /* v4.67 참가자 세션 토큰(새 서버만) */
        staffMeIn(res.staff);   /* v6.00 앱 스태프 명단 사번 = 가운데 단추 「스캔」 */
        if (res.dept) S.set("dept", res.dept);
        knownSet({ empId: known.empId, name: res.name || known.name, dept: res.dept || "" });
        /* v4.87 최초 로그인이면 장면 · 아니면 예전 입장 · v4.94 재방문 화면은 장면이 덮은 뒤(또는 예전 입장 직전)에 걷는다(장면이 이 화면의 점에서 시작)
           v4.95 버튼은 화면이 바뀔 때까지 「확인 중」(lgxEnter 가 최초 로그인 적립을 기다리는 동안 다시 누르지 않게) */
        lgxEnter(res, function () { el("quick").hidden = true; enterApp(); a2hsAuto(); setTimeout(reset, 1500); }, function () { el("quick").hidden = true; enterNow(true); reset(); });
        beSync();   /* v4.57 로그인 직후 내 상태를 곧바로(예전 stats 한 번 대신) */
        visitSend("login");   /* v4.27 같은 방문에 사번을 붙여 한 번 더 · 비로그인 → 로그인 전환 */
      }, function () { reset(); show("서버에 연결할 수 없어요. 네트워크를 확인해주세요."); });
    });
  }
  if (known && known.empId) {
    splash.classList.add("gone");
    el("qName").textContent = known.name || "";
    el("qEmp").textContent = known.empId;
    el("quick").hidden = false;
    lfMount(el("quick"));   /* v5.02 재방문도 첫 화면과 같은 틀(전체 오렌지 · 유동 배치) */
    setTimeout(function () { try { el("quickPin").focus(); } catch (e) {} }, 150);
    el("qBtn").addEventListener("click", quickLogin);
    el("quickPin").addEventListener("keydown", function (e) { onEnter(e, quickLogin); });
    el("quickPin").addEventListener("input", function () { lfErrClear(el("quickForm"), el("qErr")); });   /* v5.02 고치면 안내 자리로 */
    el("qOther").addEventListener("click", function () {
      knownClear();
      el("quick").hidden = true;
      splash.classList.remove("gone");
      kvMountAll();
    });
  }

  /* 첫 화면 · KV 오브젝트 루프 시작 (재방문 비밀번호 화면이 떠 있으면 그 뒤에서 돌지 않는다) */
  if (!splash.classList.contains("gone")) kvMountAll();

  /* 오프라인(서버 미연결)이면 비밀번호 입력을 숨긴다 */
  if (!BE.on) {
    if (el("userPin")) el("userPin").parentNode.style.display = "none";   /* v4.94 뜨는 라벨째 */
    if (el("pinNote")) el("pinNote").parentNode.style.display = "none";   /* v5.02 안내 줄째(유동 배치 줄) */
    lfSoon();
  }

  el("entryForm").addEventListener("input", function () { lfErrClear(el("entryForm"), el("err")); });   /* v5.02 입력을 고치면 오류 알약이 안내 한 줄로 돌아온다 */
  el("entryForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = el("empId").value.trim();
    var nm = el("userName").value.trim();
    var pin = el("userPin") ? el("userPin").value.trim() : "";
    var err = el("err");
    var btn = el("entryForm").querySelector("button[type=submit]");
    var show = function (m, f) { lfErr(el("entryForm"), err, m, f); };   /* v5.02 오류 = 안내 자리에 흰 알약 + 문제 칸 테두리 */
    /* 사번 형식은 회사마다 달라 느슨하게 받고, 실제 확인은 서버(명부)가 한다 */
    if (!/^[A-Za-z0-9-]{3,15}$/.test(id)) { show("사번을 확인해주세요.", "empId"); return; }
    if (nm.length < 2) { show("이름을 입력해주세요.", "userName"); return; }
    lfErrClear(el("entryForm"), err);

    if (!BE.on) {                       /* 서버 없이 단독 동작 (기존 방식) */
      personClaim(id);   /* v4.56 */
      S.set("user", { empId: id, name: nm });
      enterApp();
      a2hsAuto();
      return;
    }
    if (!/^\d{4}$/.test(pin)) { show("비밀번호 4자리를 정해 주세요.", "userPin"); return; }
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}   /* v4.94 키보드를 먼저 닫는다(장면은 키보드 없는 화면에서 시작) */

    lfBusy(btn, true);   /* v4.95 로그인 두 화면 예외 · 덮개 없이 버튼 안에서만 */
    var reset = function () { lfBusy(btn, false, "페스티벌 입장"); };
    beHash(id, pin).then(function (h) {
      beCall({ action: "login", emp: id, name: nm, h: h }, function (res) {
        if (!res || !res.ok) {
          reset();
          if (res && res.reason === "notopen") return;   /* 261008 단계별 오픈 · beCall 이 「열려요」 화면을 띄웠다 */
          var msg = {
            notfound: "사번을 확인하지 못했어요. 다시 확인해 주세요 · 계속되면 운영 데스크에 문의해 주세요",   /* v5.60 T11 */
            name: "이름이 사번과 맞지 않아요. 다시 확인해 주세요",
            pw: "비밀번호가 맞지 않습니다. 처음 정한 4자리를 입력해 주세요.",
            lock: "비밀번호를 여러 번 틀렸어요. 10분 뒤 다시 시도하거나 운영 데스크에 문의해 주세요.",
            param: "입력값을 다시 확인해주세요."
          };
          show((res && msg[res.reason]) || "연결에 실패했어요. 잠시 후 다시 시도해주세요.", { notfound: "empId", name: "userName", pw: "userPin", lock: "userPin" }[res && res.reason] || "");
          return;
        }
        personClaim(id);   /* v4.56 로그인 사번이 이 기기 기록 주인과 다르면 먼저 지운다 */
        S.set("user", { empId: id, name: res.name || nm, dept: res.dept || "", ses: res.ses || "" });   /* v4.67 참가자 세션 토큰(새 서버만) */
        staffMeIn(res.staff);   /* v6.00 앱 스태프 명단 사번 = 가운데 단추 「스캔」 */
        if (res.dept) S.set("dept", res.dept);
        knownSet({ empId: id, name: res.name || nm, dept: res.dept || "" });   /* 다음 접속엔 비밀번호만 */
        /* v4.87 최초 로그인이면 장면(띠가 화면 전체로 커진다) · 아니면 예전 입장 · 장면을 튼 새 계정에는 「비밀번호가 등록되었어요」 팝업을 띄우지 않는다(입력칸 아래 안내가 같은 말) */
        lgxEnter(res, function () {
          enterApp(); a2hsAuto(); setTimeout(reset, 1500);   /* v5.83 「비밀번호가 등록되었어요」 팝업 삭제(입력칸 아래 안내가 같은 말) */
        }, function () { enterNow(true); reset(); });
        beSync();   /* v4.57 로그인 직후 내 상태를 곧바로(예전 stats 한 번 대신) */
        visitSend("login");   /* v4.27 같은 방문에 사번을 붙여 한 번 더 · 비로그인 → 로그인 전환 */
      }, function () {
        reset();
        show("서버에 연결할 수 없어요. 네트워크를 확인해주세요.");
      });
    });
  });
})();
/* v4.27 접속 기록 · 앱을 연 기록 · 부팅이 끝난 뒤 조용히 한 번(결과를 기다리지 않는다 · 데모 · TV 는 visitSkip 이 거른다) */
setTimeout(function () { visitSend("open"); }, 1500);
