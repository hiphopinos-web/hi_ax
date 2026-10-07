/* ════════════════ 홈 조각 · 상시 블록 6개, 나머지는 해당될 때만 ════════════════ */

/* 행사 국면 · 홈 히어로가 「지금 행사가 어떤 상태인가」를 첫눈에 말한다 (260915 UX 피드백).
   before = 행사 전(D-day) / live = 당일 진행 중 / after = 종료 후(감사 인사 + 보상 안내, 카카오 if 종료 화면 문법).
   관리자·데모는 S "ev_phase" 로 강제할 수 있다. */
var BILL_LOOP = 8;   /* v3.71 광고판 뒤집기 한 바퀴(초) · CSS axFlip 과 같은 값 */
/* ── v3.89 (사용자 피드백 260918 「입장 연출이 ME to WE 로 끝나는데 광고판은 뜬금없이 점부터 시작한다」) ──
   입장 전환이 끝나는 순간을 이 세션의 위상 기준(BILL.t0)으로 삼는다. 광고판 글자는 0초(= 모여 있는 ME to WE)에서 출발하고,
   오른쪽 캔버스는 시퀀스의 「me」 구간 머리에서 출발해 그대로 앞으로 흐른다 → 전환의 심볼과 광고판이 이어져 보인다.
   공용 시계(AXF.t0)를 건드리지 않고 기준 시각만 세션 것으로 바꾸므로, 홈이 4초마다 다시 그려져도 애니메이션은 이어진다.
   탭을 옮겼다 돌아오는 것은 입장이 아니므로 기준을 다시 잡지 않는다(그 사이에도 위상은 계속 흐른 것처럼 보인다). */
var BILL = { t0: 0 };
/* v4.17 (사용자 결정 260923 · 홍보부 협의 완료 「광고판을 흰색으로 맞추다 보니 와우가 없다」) 260922 의 흰 면(A안)을 뒤집어 주황 스테이지로 되돌린다.
   true = 주황 면 + 흰 글자 + 흰 심볼(bill-o 클래스 · data-axf-stage="orange") · false = v4.03~v4.16 의 흰 surface 연출.
   이 값 하나로 CSS 클래스·캔버스 색·입장 전환 잉크 보간이 함께 움직인다(한쪽만 바뀌어 어긋나지 않게). */
var BILL_ORANGE = true;   /* performance.now() 기준 · AXF.t0 와 같은 시계를 쓴다 */
function billBase() { return BILL.t0 || (window.AXF && AXF.t0 ? AXF.t0 : performance.now()); }
var EV_START = new Date(2026, 9, 26, 9, 0), EV_END = new Date(2026, 9, 26, 18, 0);
function evPhase() {
  var o = ttGet() ? null : S.get("ev_phase", null);   /* 261007 시험 시각(tt)이 있으면 그 시각으로 · ev_phase 는 데모 강제 */
  if (o) return o;
  var now = appNow();
  return now < EV_START ? "before" : now > EV_END ? "after" : "live";
}
/* 홈 히어로 = 지금 진행 중 (한 화면 안에 들어가야 하므로 시간·제목·장소·다음 일정만). 눌러서 타임라인으로 */
/* v3.13: 히어로(nowCardHtml)는 폐지 · 「지금·다음」은 나의 스케줄 첫 줄로 흡수(schedNowRow), 연출은 광고판이 맡는다 */
function schedNowRow() {
  var ph = evPhase(), go = "homeSched()";
  /* v3.22 공용 행 카드 · 한 줄 말줄임(one) · 진행 중 뱃지만 검정 */
  /* v3.71 (사용자 확정 260918) 행사 전 D-N 줄 삭제 · 날짜·장소는 홈 머리에 이미 있다 */
  if (ph === "before") return "";
  if (ph === "after") {
    var fh = fcfsMy() && (fcfsReady(fcfsMy()) || fcfsMy().st === "done");   /* v5.90 선착순 참여상 · v5.98 수령순 ready */
    return rcHtml({ cls: " past", onclick: fh ? "App.go('rewards')" : go, link: true, left: tokBadge("종료", "dim"), title: "행사가 끝났습니다", sub: fh ? (fcfsReady(fcfsMy()) ? "선착순 참여상 받을 수 있어요" : "선착순 참여상 수령 완료") + " · 나의 보상" : "" });   /* v5.04 옛 「추첨 결과는 개별 안내」(260909 사후 추첨 안) 폐기 · 참여상 상태가 있을 때만 내 보상으로 */
  }
  var ni = nowIdx(), now = TIMELINE[ni];
  /* 다음 일정에서 상시 항목(always)은 건너뛴다 (v3.18) */
  var nx = null;
  for (var xi = ni + 1; xi < TIMELINE.length; xi++) if (!TIMELINE[xi].always && !TIMELINE[xi].off) { nx = TIMELINE[xi]; break; }
  /* v3.25 · 검정을 못 받으면 기본 옅은 주황 뱃지로 한 단계 낮춘다 */
  return rcHtml({ cls: "", onclick: go, link: true, left: tokBadge("지금", isBlack("now") ? "act" : "", now.time),
    title: esc(now.title), sub: nx ? "다음 " + nx.time + " " + esc(nx.title) : "" });
}
/* v3.13 홈 광고판 · 스플래시와 같은 AXF 시퀀스 엔진(axfSeqMount, 점 → 구체 → 달리는 사람 → ME to WE) 재사용.
   공용 시계(AXF.t0)라 재렌더에도 시퀀스가 이어진다 · isConnected 검사로 화면을 떠나면 raf 정지 ·
   reduced-motion 은 엔진이 자체 처리 · 장식 전용(탭 없음 · 링크 금지) */
function billboardHtml() {
  /* v3.77 (사용자 피드백 260918 「문자 변경이 경박스럽고 글자가 작다」) 카드 뒤집기 폐지.
     왼쪽 = 「ME to WE」 한 줄(가로)이 글자마다 흩어졌다가 우리말 두 줄로 모인다 · 오른쪽 = 기존 AXF 시퀀스 모션.
     홈은 4초마다 다시 그려진다 → 공용 시계(AXF.t0)로 음수 delay 를 줘 이어서 돈다 · transform·투명도만 쓴다.
     슬로건 부제는 확정본 「나의 경험을 우리의 가능성으로」(CLAUDE.md 261001)를 따른다. */
  var sq = BILL_SEQ.map(function (x) { return x[0] + ":" + x[1]; }).join(",");   /* v4.87 달리는 사람 다음에 Me │ We 거울 → 심볼 */
  var off = ((performance.now() - billBase()) / 1000) % BILL_LOOP;   /* v3.89 세션 기준 · 입장 직후엔 0(= 모여 있는 ME to WE) */
  var d = (-off).toFixed(2) + "s";
  var chars = "ME to WE".split("").map(function (ch, i2) {
    if (ch === " ") return '<span class="sp"> </span>';
    var dx = (i2 - 3.5) * 9 + (i2 % 2 ? 6 : -6), dy = (i2 % 3 - 1) * 14 - 6, rot = (i2 % 2 ? 1 : -1) * (5 + i2);
    return '<span class="c" style="animation-delay:' + d + ';--dx:' + dx.toFixed(0) + "px;--dy:" + dy.toFixed(0) + "px;--rot:" + rot + 'deg">' + ch + "</span>";
  }).join("");
  /* v4.17 BILL_ORANGE = 주황 스테이지(브랜드 연출 · 화면당 1개) · 끄면 흰 surface 위 원본 주황 심볼 */
  var stage = BILL_ORANGE ? ' data-axf-stage="orange" data-axf-colors="#FFFFFF,rgba(255,255,255,0.78),#FFFFFF"' : "";
  return '<div class="bill' + (BILL_ORANGE ? " bill-o" : "") + '" aria-hidden="true"><div class="bc">' +
    '<p class="bmw">' + chars + "</p>" +
    '<p class="bko" style="animation-delay:' + d + '"><span>나의 경험을</span><span>우리의 가능성으로</span></p>' +
    "</div>" +
    '<canvas data-axf="loop" data-axf-seq="' + sq + '" data-axf-zoom="0.95" data-axf-start="me"' + stage + "></canvas></div>";
}



/* 나의 스케줄 · 내가 신청한 것만 담는다 (260830 사용자 지시).
   자유 참석인 17F 강연(v3.29 kind open)이라도 자동으로 채우지 않는다. 「모두가 가는 것」을 미리 넣어 두면
   내가 신청한 것과 그냥 열려 있는 것이 섞여, 이 영역이 무슨 뜻인지 흐려진다.
   ⚠홈은 한 화면에 들어와야 하므로 이 목록은 2행까지만 편다(260830).
   목록만 길이가 가변이라, 여기를 안 막으면 신청이 많은 사람에게서 홈이 넘친다. */
/* v3.22: 행이 개별 카드(64px)가 되어 목록형보다 커졌다 · 사용자 지시(카드 통일)가 홈 한 화면보다 우선이라
   내 항목 상한을 2 → 1 로 줄여 넘침을 최소화한다(2건이면 둘 다, 3건 이상이면 1건 + 「외 n건」) */
/* v3.68 세로 스크롤(myscroll)은 v4.13 에서 폐지(창 안의 창 · 사용자 260922) · 다가올 일정 3개 + 「일정 더보기 +N」 버튼 */
var SCHED_VIEW = 3;
function myScheduleHtml() {
  var rows = [];   /* [정렬 분, onclick, 뱃지 글자, 제목, 보조 줄, 뱃지 상태] */
  /* 지금 걸려 있는 대기는 시간이 정해진 일정보다 급하다 · 맨 위(정렬키 -1)에 둔다.
     내 것을 보여주는 자리는 여기 하나뿐이다(홈에 별도 스트립을 만들지 않는다, design.md) */
  var q = S.get("queue", {}), qk;
  /* v3.35 · Outro 전 사회자 안내(16:45 설문 안내) 시간대에만 홈 첫 줄로 · 그 밖에는 스탬프 탭 카드가 입구 */
  var hm0 = hmNow();
  if (!surveyLock() && !surveyDone() && evPhase() === "live" && hm0 >= t2m("16:40") && hm0 < t2m("17:10"))
    rows.push([-1, "App.go('survey')", "설문", "오늘 한 판 설문", "60초 · 스탬프 1개", "mine"]);
  var fgr = fcfsGotRow(); if (fgr) rows.push(fgr);   /* v5.97 선착순 참여상 수령 전 = 맨 위 한 줄(받으면 사라진다) */
  var ckr = ckGuideRow(); if (ckr) rows.push(ckr);   /* v5.94 사전등록 체크인 3개 → 룰렛 → 강의장(룰렛을 쓰면 사라진다) */
  /* v3.43 · 내 항목은 myItems 하나에서 (종류별 1건 · 테스트 오버레이 겹침 제거) */
  myItems(true).forEach(function (x) {
    rows.push([x.min, x.go, x.badge, x.title, x.sub, x.call && !x.photo && isBlack("call") ? "act" : "mine", x.place, x.iv ? x.iv[1] : null]);
  });
  rows.sort(function (a, b) { return a[0] - b[0]; });
  /* v4.13 (사용자 결정 260922) 다가올 일정만 · 행사 중에는 끝 시각이 지난 일정을 뺀다(대기·계단처럼 시각이 없는 것은 늘 남긴다) · 지난 일정은 내 일정에서 */
  var all0 = rows.length;
  if (evPhase() === "live") rows = rows.filter(function (r) { return r[7] == null || r[7] > hm0; });
  var head = '<div class="sect"><b>나의 일정</b>' +
    '<span role="button" tabindex="0" aria-label="나의 일정 바로가기" onclick="mySched()">' + lnkChev("바로가기") + "</span></div>";
  /* v3.13: 첫 줄 = 「지금·다음」(구 히어로 흡수 · 시간 뱃지 공용 tok, 진행 중 = 검정) · v3.22 모든 행 = 공용 행 카드 */
  /* v5.82 (사용자 261006 「커피챗 앞으로」 결정 2) 커피챗 신청 줄 한 줄 · 신청 전 · 마감 아님 · 행사 끝나기 전만(cchatRowHtml) · 일정 3개 상한(SCHED_VIEW)에 넣지 않는 별도 줄 · v5.85 누르면 프로그램 › 신청하기 칸(progApplyGo)
     일정이 비었으면 「신청한 프로그램 없음」 줄을 이 줄로 대체 · 일정이 있으면 목록 끝(더보기 버튼 앞) · 신청한 뒤에는 myItems 의 커피챗 줄(대기 · 시각)이 맡아 이 줄은 사라진다 */
  var ap = cchatRowHtml();
  /* v6.06 (사용자 261007 「홈 나의 일정은 신청 카드만 · 하루 전체 타임라인은 나의 참여에서만」) 10F 명단 홈 = 신청 카드만(내 10F 세션 · AX 라운지 · 커피챗) · 노드 · 레일 · 큰 점 없음(axs-myfl-h) · 진행 중이면 그 카드 칩 「진행 중」 + 둘레 고리
     v6.04 (사용자 261007) 10F 명단 = 나의 참여 › 나의 일정과 같은 하루 흐름 · 홈은 남은 줄 3개(SCHED_VIEW) + 「일정 더보기 +N」
     위 행 카드 = 시각 없는 줄만(설문 · 선착순 참여상 · 체크인 → 룰렛 · 대기 · 계단 · 커피챗 매칭 대기 · 커피챗 신청 줄) · 시각 있는 신청(상담 · 커피챗)은 흐름 안 · 행사 중 「지금」 줄은 흐름의 큰 점이 맡는다 */
  if (myFlowOn()) {
    var ph1 = evPhase(), fr = rows.filter(function (r) { return r[7] == null; });
    var fl = ph1 === "after" ? [] : myFlowItems().filter(function (o) { return o.mine && (ph1 !== "live" || o.b > hm0); }), fm = Math.max(0, fl.length - SCHED_VIEW);
    var top = (ph1 === "after" ? schedNowRow() : "") + fr.map(function (r) {
      return rcHtml({ cls: " my", onclick: r[1], link: true, left: tokBadge(esc(r[2]), r[5]), title: esc(r[3]), sub: esc(r[4]), place: r[6] });
    }).join("") + ap;
    /* v6.11 (사용자 261007) 신청 일정이 다 끝났으면 Outro 안내 카드 · Outro 도 끝났으면(또는 행사 뒤) 「남은 일정 없음」 그대로 */
    var oc = !fl.length && ph1 !== "after" ? myOutroItem() : null;
    if (oc && ph1 === "live" && oc.b <= hm0) oc = null;
    if (!fl.length && !oc) top += rcHtml({ cls: "", onclick: "mySched()", link: true, left: rcIcon(App.ICONS.guide_time), title: "남은 일정 없음", sub: "지난 일정은 나의 일정에서" });
    return head + (top ? '<div class="axs-rows">' + top + "</div>" : "") + (fl.length ? myFlowHomeHtml(fl.slice(0, SCHED_VIEW)) : oc ? myFlowHomeHtml([oc]) : "") +
      (fm ? '<button type="button" class="ax-button ax-button-weak axs-more" onclick="mySched()" aria-label="나의 일정 ' + fm + '개 더 보기">일정 더보기 +' + fm + "</button>" : "");
  }
  if (!rows.length) {
    return head + '<div class="axs-rows">' + schedNowRow() +
      (all0 ? rcHtml({ cls: "", onclick: "mySched()", link: true, left: rcIcon(App.ICONS.guide_time), title: "남은 일정 없음", sub: "지난 일정은 나의 일정에서" }) + ap
        : ap || rcHtml({ cls: "", onclick: "progApplyGo()", link: true, left: rcIcon(App.ICONS.guide), title: "신청한 프로그램 없음", sub: "프로그램에서 신청" })) + "</div>";   /* v5.85 = 프로그램 › 신청하기 칸 */
  }
  /* v4.13 (사용자 결정 260922) 카드 안 스크롤(창 안의 창) 폐지 · 3개만 · 4개 이상이면 목록 바로 아래 전폭 버튼 「일정 더보기 +N」(숨은 개수) → 나의 참여 › 내 일정 · 3개 이하면 버튼 없음 */
  var more = Math.max(0, rows.length - SCHED_VIEW);
  var cards = rows.slice(0, SCHED_VIEW).map(function (r) {
    return rcHtml({ cls: " my", onclick: r[1], link: true, left: tokBadge(esc(r[2]), r[5]), title: esc(r[3]), sub: esc(r[4]), place: r[6] });
  }).join("");
  return head + '<div class="axs-rows">' + schedNowRow() + cards + ap + "</div>" +
    (more ? '<button type="button" class="ax-button ax-button-weak axs-more" onclick="mySched()" aria-label="나의 일정 ' + more + '개 더 보기">일정 더보기 +' + more + "</button>" : "");
}

/* 홈 · 스탬프 블록 (v3.2): 홈도 스탬프 탭과 같은 railHtml 공용 컴포넌트를 쓴다 (design.md 컴포넌트 일관성).
   홈용은 컴팩트 변형(캡션 축약 + 하단 CTA)일 뿐 레일의 시각 문법은 동일 · 마커 탭 동작(모달)도 동일하다. */
function myCouponHtml() {
  return '<div class="sect"><b>스탬프</b>' +
    '<span role="button" tabindex="0" aria-label="스탬프 바로가기" onclick="App.tab(\'exp\')">' + lnkChev("바로가기") + "</span></div>" +
    railHtml(stampCount(), false, null, true);
}
/* v5.57 (사용자 261004 「다음 스탬프 없애자」) 홈 「다음 스탬프」 카드(v4.84 · nextStampHtml · nextStampPick · nxEvents · nxLectureNow)를 걷었다 · 홈 = 레일 → 나의 일정 · 다음 할 일은 스탬프 탭 한 목록에서
   STAMP_MODE(수단 칩)는 스탬프 탭 줄(stpRowHtml)이 그대로 쓴다 · 카드 틀 CSS(axs-nx · axs-nx-c · axs-nx-t)는 최초 로그인 시트의 「찍은 QR」 카드가 쓰므로 남긴다(axs-nx-i · axs-nx1 은 지움) */
var STAMP_MODE = { lg: "자동", qz: "폰으로", p4: "폰으로", p2: "스태프 인증", p5: "폰으로", p3: "현장", st: "현장", sv: "폰으로", p1: "현장", p7: "현장" };
/* v4.84 Outro 추첨 체크인 카드 · 16:40~17:25(서버 기본 창) · 체크인하면(draw_in 기록) 내린다 · 행사 중에만 */
function drawCardHtml() {
  if (!lkCond()) return "";   /* v5.92 (사용자 261006) 행운권 참석 조건 OFF = 추첨 체크인 카드 없음 */
  if (evPhase() !== "live" || S.get("draw_in", false)) return "";
  var hm = hmNow();
  if (hm < t2m("16:40") || hm >= t2m("17:25")) return "";
  return '<button type="button" class="ax-destination axs-dest" onclick="qrScanOpen()">' +
    '<span class="axs-tx"><span class="axs-chiprow"><span class="axs-chip">추첨 체크인</span></span>' +
    '<span class="ax-card-title">16:40–17:25 · 17F 대강당</span><span class="ax-meta">대강당 화면의 QR · 현장에서만</span></span>' +
    '<span class="ax-destination-action">QR 스캔</span></button>';
}

/* v4.62 층별 혼잡도 · 홈 맨 아래 (260929 사용자 결정 · v3.31c 삭제를 되돌림).
   모양은 v3.22 압축 스트립(층 4칸 · 막대 · 상태 한 단어). 옛 값은 시뮬레이션(CROWD_SIM)이라 되살리지 않는다.
   참가자 앱이 읽을 수 있는 혼잡도 원천이 아직 없다(존 등급 · 재실 실측은 관리코드 전용 ops_snapshot 에만 있다).
   원천이 생기기 전까지 crowdGrade 는 빈 값 · 막대는 비우고 「정보 없음」. 가짜 수치를 넣지 않는다.
   색은 design.md 시맨틱(여유 success · 보통 muted · 혼잡 error) 토큰만. 실제 운영 방식(1F 스태프 제보)은 별도 설계 뒤 연결. */
/* v4.71 (260930 사용자 확정 · 「혼잡도 제보 기획.md」 권장안) 4개 층 칸 → 「1F 로비 · 엘리베이터」 2칸 · 원천 = 1F 스태프 혼잡 제보(sync crowd)
   칸 3상태: 혼잡(errorSoft · 「혼잡」 + 14:52 제보) > 예상(엘리베이터만 · brandSoft · 「예상」 + 11:00~11:20) > 제보 없음(surface · muted)
   제보가 없으면 「제보 없음」이라고만 쓴다 · 「여유」라고 단정하지 않는다 · 옛 서버(crowd 없음)도 「제보 없음」 · 색만으로 전하지 않게 상태 글자를 늘 함께 */
function crowdCell(k) {
  var j = crowdJam(k), c = crowdGet() || {};
  if (j) return { cls: " jam", st: "혼잡", sub: crowdHm(j.at) + " 제보" };
  if (k === "e" && c.p) return { cls: " pred", st: "예상", sub: crowdWin(c.p) };
  return { cls: "", st: "제보 없음", sub: "" };
}
/* v4.73 (260930 사용자 결정) 엘리베이터 혼잡을 홈 맨 위 카드로 올리지 않는다 · 혼잡 표시는 이 2칸에서만.
   「계단 이용」 + 셰브론 = 엘리베이터 칸이 혼잡(제보)이고 설정 혼잡_계단 ON(총무 피난계단 승인 뒤 · sync crowd.st)일 때만 · 칸을 누르면 계단 스탬프 화면(stairOpen) · OFF 면 누를 수 없는 표시 그대로 */
/* v5.68 (사용자 결정 261005 · design.md 5-2 개정) 셋째 칸 「17F 대강당」 · 원천 = 제보가 아니라 지금 강의의 현장 입장 QR 수 ÷ 좌석(서버 sync crowd.h · 송출 제외)
   강의 시간 창 안에서만 수가 있다 · 상태 = 여유(surface) · 보통(brandSoft) · 혼잡(errorSoft) · 아래 줄 「입장 약 120명」(10명 단위 · 서버가 반올림) · 창 밖 = 「강의 없음」 */
var HALL_LV = { ok: ["여유", ""], mid: ["보통", " pred"], jam: ["혼잡", " jam"] };
function crowdHallCell() {
  var c = crowdGet() || {}, h = c.h;
  if (!h || !h.id) return { cls: "", st: "강의 없음", sub: "" };
  var lv = HALL_LV[h.lv] || HALL_LV.ok;
  return { cls: lv[1], st: lv[0], sub: h.n ? "입장 약 " + h.n + "명" : "입장 0명" };
}
function crowdStripHtml() {
  var st = crowdGet() && crowdGet().st ? 1 : 0;
  return '<div class="sect"><b>혼잡 제보</b></div>' +
    '<div class="cstrip2 c3">' + [["l", "1F 로비"], ["e", "엘리베이터"], ["h", "17F 대강당"]].map(function (t) {
      var x = t[0] === "h" ? crowdHallCell() : crowdCell(t[0]), go = t[0] === "e" && x.cls === " jam" && st;
      var inner = '<p class="nm">' + t[1] + '</p><p class="st">' + x.st + "</p>" + (x.sub ? '<p class="sb">' + esc(x.sub) + "</p>" : "") + (go ? '<p class="go">' + lnkChev("계단 이용") + "</p>" : "");
      return go ? '<button type="button" class="cc' + x.cls + '" onclick="stairOpen()" aria-label="엘리베이터 혼잡 · 계단 이용">' + inner + "</button>" : '<div class="cc' + x.cls + '">' + inner + "</div>";
    }).join("") + "</div>" + (typeof crowdWatchHtml === "function" ? crowdWatchHtml() : "");   /* v4.76 혼잡일 때만 「풀리면 알림」 */
}

/* ════════════════ 261007 홈 「다음 할 일」 카드 (사용자 261007 결정 (나) 「홈 막지 않는 카드 한 장」 · 기획 `디자인 시안/재로그인 · 다음 할 일/분석.md` 5장) ════════════════
   자리 = 광고판 바로 아래 · 「행사 둘러보기」 카드와 한 자리를 교대한다(한 번에 한 장 · Views.home 의 tourHeroHtml() 바로 뒤 · 새 자리 없음)
   막지 않는다(시트 · 팝업 줄 밖의 정적 카드 · 재로그인해도 같은 상태면 같은 카드) · 묻지 않는다 · 자동 이동 없음 · 누르면 그 활동 화면
   언제 = 행사 당일(10/26 · 18:00 전 · 앱 「지금」 appNow 한 곳 · 테스트 계정은 「시각 바꿔 보기」 tt)만 · 그 밖의 날 · 스탬프 6개(선착순 참여상 줄이 맡는다) = 없음
   고르는 순서(위에서 처음 맞는 것 하나 · nxPick)
     ① 급한 내 것 · 체크인 번호 카드(ckqCardHtml)가 홈 맨 위에 있으면 없음 · 커피챗 선정 10분 전 ~ 시작 5분 = 카드
     ② 사전등록 체크인 → 룰렛(ckGuideOn) = 없음(홈 줄 ckGuideRow 가 맡는다) · ③ 6개 = 없음
     ④ 시각 창 · 오후 강연 카드(시작 30분 전 ~ 15분 뒤 · 강연 시각 기준 · 출석 QR 창 설정과 무관(261008) · 10F 명단은 내 세션과 겹치는 강연 제외 · 프로그램 참여 2칸이면 없음) → 아이디어 마감 1시간 전 → 설문(14:30~ · 16:40~17:10 은 나의 일정 줄이 맡는다)
     ⑤ 둘러보기를 다 보기 전 = 없음(「행사 둘러보기」 카드가 그 자리 · nxTourHero) · ⑥ 다 본 뒤 = 아직 안 받은 짧은 스탬프(퀴즈 → 아이디어 → 미니 게임 → AX PLAY → 계단)
   「다 봤다」(tour_done · 기기 키) = 한 번 열어 1층 구역 멈춤 자리 8곳 중 6곳(70%) 이상 들르거나 3분(엘리베이터 권유와 같은 기준 · 분석 결정 5) · 다 본 뒤 둘러보기 카드는 나의 일정 아래로
   끄기 = 카드 × → 그날 끔(nx_off = 그날 날짜 · 기기 키) · 설정 「앱」 「다음 할 일 카드」 줄로 다시 켬(줄에서 끄면 nx_off = all) · 꺼져 있으면 둘러보기 카드 자리는 옛 규칙(tour_seen)
   문구 = 행동 · 조건만(코칭 어조 · 「추천」 없음 · 이모지 없음) · 칩 = 상태 이름 하나 · 보조 줄 = 소요 시간 · 방법 · 장소 중 있는 것만 */
var NX_DAY = [2026, 9, 26], NX_TOUR_MS = 180000, NX_TOUR_Z = 6, NX_CC = [10, 5];
var NXT = { on: 0, ms: 0 };
function nxDate() { var dn = appNow(true); return dn.getFullYear() + "-" + (dn.getMonth() + 1) + "-" + dn.getDate(); }
function nxDay() { var dn = appNow(true); return dn.getFullYear() === NX_DAY[0] && dn.getMonth() === NX_DAY[1] && dn.getDate() === NX_DAY[2] && dn < EV_END; }
function nxOff() { var o = S.get("nx_off", ""); return o === "all" || o === nxDate(); }
function nxOn() { return !!((S.get("user", null) || {}).empId) && nxDay() && !nxOff(); }
function nxTourDone() { return !tourOn() || !!S.get("tour_done", false); }
function nxGot(id) { return S.get("stamps", []).indexOf(id) >= 0; }
/* 둘러보기 카드가 광고판 아래 자리를 쓰는가 · null = 이 카드가 꺼져 있음(옛 규칙 tourHeroOn) */
function nxTourHero() { return nxOn() ? !nxTourDone() && !nxPick() : null; }
function nxPick() {
  if (!nxOn() || stampCount() >= STAMP_DENOM) return null;
  if (typeof ckqCardHtml === "function" && ckqCardHtml()) return null;   /* ① 체크인 번호 카드(홈 맨 위)가 급한 것 */
  var hm = hmNow(), c = S.get("cchat", null);
  if (c && c.status === "matched" && c.round) {
    var r = t2m(c.round);
    if (hm >= r - NX_CC[0] && hm < r + NX_CC[1]) return { id: "cc", chip: "곧 시작", t: "AX 커피챗 " + hhmm(c.round), s: "18F" + (c.table ? " · TABLE " + c.table : ""), a: "보기", go: "App.go('ev_cchat')" };
  }
  if (typeof ckGuideOn === "function" && ckGuideOn()) return null;   /* ② 홈 줄 「체크인 → 룰렛 → 강의장」 */
  var tm = tenMine(), tp = tm ? tm.tm.split("~").map(function (x) { return t2m(x); }) : null;
  if (progUnits() < 2) for (var i = 0; i < MYFL_LEC.length; i++) {   /* ④ 오후 강연 입장 창 */
    var s = sessById(MYFL_LEC[i]); if (!s) continue;
    var iv = s.tm.split("~").map(function (x) { return t2m(x); });
    if (tp && iv[0] < tp[1] && iv[1] > tp[0]) continue;   /* 내 10F 세션 시간 */
    if (hm >= iv[0] - 30 && hm < iv[0] + 15) return { id: "lec:" + s.id, chip: hm < iv[0] ? "곧 시작" : "진행 중", t: hm2(iv[0]) + " " + SESS_NM[s.id], s: "17F 대강당 · 입장 QR과 끝 QR", a: "보기", go: "progOpen('" + s.id + "')" };
  }
  var ip = S.get("idea_pub", null) || {}, cut = t2m(ip.cut || "16:00");
  if (!nxGot("p5") && !ideaGateOff() && !ip.late && hm >= cut - 60 && hm < cut) return { id: "p5c", chip: hm2(cut) + " 마감", t: "아이디어 한 줄", s: "스탬프 1개 · 폰으로", a: "쓰기", go: "App.go('ideas')" };
  if (!surveyDone() && !surveyLock() && !(hm >= t2m("16:40") && hm < t2m("17:10"))) return { id: "sv", chip: "다음 할 일", t: "오늘 한 판 설문", s: "60초 · 스탬프 1개", a: "설문 시작", go: "App.go('survey')" };
  if (!nxTourDone()) return null;   /* ⑤ 둘러보기 카드가 그 자리 */
  var L = [
    ["qz", "AX 퀴즈 한 판", "5문제 · 약 2분 · 폰으로", "시작", "App.go('quiz')"],
    ["p5", "아이디어 한 줄", "스탬프 1개 · 폰으로", "쓰기", "App.go('ideas')"],
    ["p4", "미니 게임 3종", "팡 · 점프 · 테트리스 · 종목마다 한 판", "게임 보기", "App.go('games')"],
    ["p2", "AX PLAY", "1F 하이디큐 · 하이헬퍼 체험 · 스태프 인증", "내 QR", "qrPanelOpen('mine')"],
    ["st", "계단 이용", "한 개 층만 오르내려도 돼요", "안내", "stairOpen()"]
  ];
  for (var j = 0; j < L.length; j++) {
    if (nxGot(L[j][0]) || (L[j][0] === "p5" && ideaGateOff())) continue;
    return { id: L[j][0], chip: "다음 할 일", t: L[j][1], s: L[j][2], a: L[j][3], go: L[j][4] };
  }
  return null;
}
function nxCardHtml() {
  var p = nxPick(); if (!p) return "";
  return '<section class="axs-sec axs-nxh" data-nx="' + esc(p.id) + '"><button type="button" class="ax-destination axs-dest" onclick="' + p.go + '">' +
    '<span class="axs-tx"><span class="axs-chiprow"><span class="axs-chip">' + esc(p.chip) + "</span></span>" +
    '<span class="ax-card-title">' + esc(p.t) + '</span><span class="ax-meta">' + esc(p.s) + "</span></span>" +
    '<span class="ax-destination-action">' + esc(p.a) + "</span></button>" +
    '<button type="button" class="axs-x axs-nxh-x" onclick="nxOffToday()" aria-label="다음 할 일 카드 오늘 끄기">' + X_SVG + "</button></section>";
}
function nxOffToday() { S.set("nx_off", nxDate()); toast("다음 할 일 카드를 오늘 껐어요 · 설정에서 다시 켜요"); }
function nxFsToggle() { if (nxOff()) S.set("nx_off", ""); else S.set("nx_off", "all"); fsRowState(); }
function nxFsState() { var b = el("fsNx"), st = el("fsNxSt"), on = !nxOff(); if (st) st.textContent = on ? "켜짐" : "꺼짐"; if (b) { b.setAttribute("aria-checked", String(on)); b.classList.toggle("on", on); } }
/* 둘러보기를 「다 봤다」 · 1초마다(가려진 동안은 세지 않음) · 열린 동안 머문 시간과 들른 구역 수(tlogZ · 둘러보기 접속 기록과 같은 값) */
function nxTourTick() {
  if (document.hidden || S.get("tour_done", false)) return;
  if (!(window.AXTour && AXTour.isOpen())) { NXT.on = 0; NXT.ms = 0; return; }
  if (!NXT.on) { NXT.on = 1; NXT.ms = 0; } else NXT.ms += 1000;
  if (NXT.ms >= NX_TOUR_MS || (typeof tlogZ === "function" && tlogZ() >= NX_TOUR_Z)) S.set("tour_done", true);
}
setInterval(nxTourTick, 1000);
