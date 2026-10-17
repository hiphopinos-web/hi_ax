/* AXF CONTROL v2 · S7 기록 · 설정 (261016 2단계)
 * 칩 = 활동 기록 · 급한 단추 · 서버 상태 · 화면 주소 · 스태프 코드
 * 활동 기록 = act_log(오늘 · 최근 200줄) 명단 · 줄을 누르면 서랍 · 되돌리기(roll_undo 묶음 · resv_set · cchat_status · stamp_revoke · inv_undo · pre10_undo · 서버가 준 undo 그대로)
 * 급한 단추 3개 = 룰렛 소진 안내(roulette_out · 되돌리기 토스트) · 푸시 정지(push_cfg · 알림 탭과 같은 함수) · 앱 접속 범위(og_scope_set · 확인 창)
 * 서버 상태 = now_board · 이 콘솔의 최근 호출(NET) · 화면 주소 = 추첨 · 타자왕 TV · 타자왕 체험(열기 · 복사) · 261016 체크인 창구 · 대기판 걷음 · 261017 스탬프 월 걷음(사이니지 폐기)
 * 스태프 코드 = adm_roster.staffCode(설정됨 · 비어 있음만 · 값은 받지도 그리지도 않음) · 바꾸기 · 비우기 = adm_code_set(POST · 확인 창) · 운영 설정 76개 「바꾸기」는 넣지 않는다(결정 · 대화로 처리) */
var LG_SUBS=[["log","활동 기록"],["urgent","급한 단추"],["srv","서버 상태"],["urls","화면 주소"],["qr","현장 QR"],["code","스태프 코드"]];
var LOG_CAT=[["all","전체",null],["p","사람",function(r){ return r.cat==="p"; }],["r","명단",function(r){ return r.cat==="r"; }],["s","스탬프 · 경품",function(r){ return r.cat==="s"; }],["n","알림",function(r){ return r.cat==="n"; }],["c","설정",function(r){ return r.cat==="c"; }],["x","스캔",function(r){ return r.cat==="x"; }],["ck","체크인존",function(r){ return r.k==="ck_gate"; }],["u","되돌릴 수 있음",function(r){ return !!(r.undo&&r.undo.ok&&!r.undo.done&&!LG_DONE[r.ref]); }],["f","실패",function(r){ return /^x:/.test(r.res||""); }]];
var BYK_N={ "콘솔":"콘솔", "스태프":"스태프 폰", "기기":"코드 기기", "서버":"서버 자동" };
var GEN_UNDO={ roll_undo:"명단 넣기 · 빼기 되돌리기", resv_set:"라운지 상담 상태 되돌리기", cchat_status:"커피챗 상태 되돌리기", stamp_revoke:"담당자 스탬프 취소", inv_undo:"교환 기록 되돌리기", pre10_undo:"10F 묶음 넣기 되돌리기",
  list_rows_cancel:"커피챗 넣음 취소", lng_pre_row_add:"라운지 명단에 다시 넣기", lng_pre_row_del:"라운지 명단에서 빼기" };   /* 261017 서버 act_log 가 주는 되돌리기 3종 */
var GEN_NOTE={ roll_undo:"그 뒤에 따로 바뀐 사람은 건너뜀 · 종이 기록 반영은 룰렛 · 행운권 · 선착순과 엮인 줄도 건너뜀", resv_set:"참가자 앱에 바로 반영 · 승인으로 되돌리면 승인 알림이 다시 나갈 수 있음", cchat_status:"참가자 앱에 바로 반영", stamp_revoke:"룰렛 · 행운권 · 선착순과 엮이면 서버가 막음", inv_undo:"원장에 되돌림 한 줄이 남음(지우지 않음)", pre10_undo:"그 뒤에 10F 명단이 또 바뀌었으면 되돌리지 못함",
  list_rows_cancel:"대기 상태일 때만 · 상태 = 취소 · 활동 기록에서 다시 되돌릴 수 있음", lng_pre_row_add:"넣었던 시간 · 미팅룸으로 · 그 자리가 찼으면 서버가 막음", lng_pre_row_del:"체크인 · 완료 전일 때만 · 상담 줄은 취소로 남음" };
var LG_DONE={};   /* 261017 이 콘솔에서 되돌린 줄(ref → 시각) · 서버가 다시 줄 때까지 단추 숨김 */
var SCR_URLS=[["추첨 화면","17F 대형 스크린 · 원격 모드","../../draw/?remote=1"],["타자왕 TV","1F 타자왕 순위판","../../tv/typing/"],["타자왕 체험","1F 현장 노트북","../../typing/"],
  ["타자왕 노트북 1","1F 현장 노트북 · 관리코드로 셀프","../../#self&seat=1"],["타자왕 노트북 2","1F 현장 노트북","../../#self&seat=2"],["타자왕 TV 1","1F 스탠바이미","../../tv/typing/?live=1&mode=1&seat=1&o=port"],["타자왕 TV 2","1F 스탠바이미","../../tv/typing/?live=1&mode=1&seat=2&o=port"],["타자왕 송출 테스트","리허설 · 테스트 사번 판 보이기","../../tv/typing/?live=1&test=1"]];
function lgSub(){ return subsOf(LG_SUBS,"log"); }
SCREENS.log={
  title:"기록 · 설정", desc:"",
  need:function(){ var s=lgSub(); return s==="log"?[{ k:"alog", a:"act_log", p:{ n:200 }, ttl:30000 }]:s==="urgent"?[{ k:"ogs", a:"og_scope_state", ttl:30000 },{ k:"pst", a:"push_stats", ttl:30000 }]:s==="code"?[{ k:"admr", a:"adm_roster", ttl:30000 }]:s==="srv"?[{ k:"pst", a:"push_stats", ttl:60000 }]:s==="qr"?[{ k:"qal", a:"att_list", ttl:300000 },{ k:"qst", a:"stair_list", ttl:300000 },{ k:"qss", a:"stair_stats", ttl:60000 },{ k:"qqs", a:"qr_stats", ttl:60000 },{ k:"qa10", a:"att_stats", p:{ who:"1" }, ttl:60000 }]:[]; },
  mount:function(vb){
    var s=lgSub();
    el("phCap").textContent={ qr:"현장에 붙는 QR · 묶음별 그림 · 담긴 주소 · PNG · 찍힌 수", log:"오늘 누가 무엇을 했는지 · 줄을 누르면 상세 · 되돌리기", urgent:"룰렛 소진 안내 · 푸시 정지 · 앱 접속 범위 · 모두 확인 창 또는 되돌리기", srv:"서버 · 이 콘솔의 연결", urls:"현장 화면 주소 · 열기 · 복사", code:"스태프 폰을 여는 공용 코드 · 값은 보이지 않음" }[s];
    var h=chipsH(LG_SUBS,s);
    if(s==="log"){
      gridOf("alog",{ file:"활동 기록", key:function(r){ return r.ref; }, sort:{ k:"t", d:-1 }, chips:LOG_CAT, onRow:function(k){ lgOpen(k); },
        cols:[{ k:"t", t:"시각", type:"date", w:90 },{ k:"verb", t:"한 일", w:70 },{ k:"x", t:"내용", w:320, v:function(r){ return lgWhat(r); } },{ k:"name", t:"이름", w:110, whoV:function(r){ return r.cnt?r.cnt+"명":whoOf(r).n; } },
          { k:"byName", t:"처리자", w:110, v:function(r){ return r.byName||r.by||""; } },{ k:"byK", t:"어디서", w:84, v:function(r){ return BYK_N[r.byK]||r.byK||""; } },{ k:"res", t:"결과", w:70, v:function(r){ return /^x:/.test(r.res||"")?"실패":r.res==="dup"?"이미 받음":""; } },
          { k:"undo", t:"되돌리기", w:96, v:function(r){ return lgUndoTx(r); }, f:function(r){ var t=lgUndoTx(r); return t==="가능"?tag("가능",""):t?'<span class="cap">'+esc(t)+'</span>':""; } }],
        empty:"오늘 기록이 없습니다", h:540 });
      vb.innerHTML=h+'<div id="lgK" class="grid g4 mb"></div><div class="card"><div id="mg_alog"></div></div>';
      return; }
    if(s==="qr"){ qrMount(vb,h); return; }
    if(s==="urgent"){ vb.innerHTML=h+'<div class="grid g2"><div class="col"><div class="card" id="urR"></div><div class="card" id="urP"></div></div><div class="card" id="ogC"></div></div>'; return; }
    if(s==="srv"){ vb.innerHTML=h+'<div class="grid g2"><div class="card" id="svA"></div><div class="card" id="svB"></div></div>'; return; }
    if(s==="urls"){ vb.innerHTML=h+'<div class="card"><table class="tb"><thead><tr><th>화면</th><th>어디</th><th>주소</th><th></th></tr></thead><tbody>'+SCR_URLS.map(function(x,i){ var u=scrUrl(x[2]); return '<tr><td><b>'+esc(x[0])+'</b></td><td class="cap">'+esc(x[1])+'</td><td class="cap ur-u">'+esc(u)+'</td><td class="n"><span class="btns ur-b"><a class="btn sm" href="'+esc(u)+'" target="_blank" rel="noopener">열기</a><button class="btn sm" type="button" onclick="copyTx(scrUrl(SCR_URLS['+i+'][2]),\'주소를 복사했습니다\')">복사</button></span></td></tr>'; }).join("")+'</tbody></table><p class="cap mt">추첨 화면은 화면에서 관리코드를 한 번 넣습니다 · 추첨 진행은 무대 › 행운권 추첨</p><p class="cap">노트북은 주소로 한 번 열면 자리 저장 · 바꾸기 F2 관리 › 송출 자리</p><p class="cap">노트북마다 실행 아이콘(현장 실행/타자왕 노트북1.bat · 2.bat)을 두 번 누르면 게임 창과 TV 송출 창이 함께 열립니다</p></div>'; return; }
    vb.innerHTML=h+'<div class="card" id="scB"></div>';
  },
  paint:function(){ var s=lgSub();
    if(s==="log"){ lgKpi(); gridPaint("alog","alog","활동 기록",function(d){ return d.rows||[]; }); if(DRW.k&&DRW.k.indexOf("alog:")===0) lgOpen(DRW.k.slice(5)); return; }
    if(s==="urgent"){ urPaint(); ogPaint(); return; }
    if(s==="srv") return svPaint();
    if(s==="qr") return qrPaint();
    if(s==="code") return scPaint();
  }
};
function scrUrl(p){ try{ return new URL(p, location.href).href; }catch(e){ return p; } }
/* ── 활동 기록 ── */
function lgWhat(r){ if(r.cnt&&r.list==="stamp") return "종이 기록 일괄 반영 · 스탬프 "+(r.gmN||"")+"줄 · "+r.cnt+"명"; if(r.cnt) return (r.list==="gate"?"접속 허용 명단":r.list==="staff_app"?"앱 스태프 명단":r.list==="staff_wear"?"스태프 의류 명단":"명단")+(r.op==="add"?"에 넣음":"에서 뺌")+" · "+r.cnt+"명"; return String(r.x||"").replace(/상담석/g,"미팅룸"); }   /* 261016 밤 라운지 상담석 = 미팅룸(서버 운영로그 글자는 그대로 · 화면만) */
function lgUndoTx(r){ var u=r.undo; if(!u) return ""; if(u.done) return u.done+" 되돌림"; if(LG_DONE[r.ref]) return LG_DONE[r.ref]+" 되돌림"; if(u.a==="roulette_undo") return ""; if(u.ok) return GEN_UNDO[u.a]?"가능":""; return u.cur?"지금 "+u.cur:"오늘만 · 지남"; }
function lgKpi(){ var d=S.data.alog, b=el("lgK"); if(!b) return; if(!d||!d.ok){ b.innerHTML=""; return; } var c=d.cnt||{};
  b.innerHTML=kpi({ l:"오늘 기록", v:n0(c.all), u:"건", s:"스캔 "+n0(c.x)+"건 포함" })+kpi({ l:"되돌릴 수 있는 묶음", v:n0(d.undo), u:"묶음", s:"명단 넣기 · 빼기" })+kpi({ l:"실패", v:n0(d.fail), u:"건", st:num(d.fail)?"warn":"", s:"스캔 거절 등" })+kpi({ l:"실패한 콘솔 쓰기", v:n0(d.wfailN||0), u:"건", st:num(d.wfailN)?"warn":"", s:"서버가 거절한 처리" }); }
function lgRow(ref){ var d=S.data.alog; return d&&d.ok?(d.rows||[]).filter(function(x){ return x.ref===ref; })[0]:null; }
function lgOpen(ref){
  var r=lgRow(ref); if(!r){ drwClose(); return; }
  var u=r.undo, dn=u&&(u.done||LG_DONE[r.ref]), ok=u&&u.ok&&!dn&&GEN_UNDO[u.a];
  var body='<dl class="cc-kv"><dt>시각</dt><dd>'+esc(r.t)+'</dd><dt>누가</dt><dd>'+esc((r.byName||r.by||"기록 없음")+" · "+(BYK_N[r.byK]||""))+'</dd><dt>어디서</dt><dd>'+esc((r.src==="scan"?"스태프 폰 스캔":r.src==="stamp"?"참여 기록":"운영로그")+" · "+(r.k||""))+'</dd><dt>무엇</dt><dd>'+esc(lgWhat(r))+'</dd>'+
    (r.emp&&!r.cnt?'<dt>누구에게</dt><dd>'+esc(personLine(r))+'</dd>':'')+'<dt>결과</dt><dd>'+(/^x:/.test(r.res||"")?tag("실패 · "+r.res.slice(2),"bad"):r.res==="dup"?tag("이미 받음","warn"):tag("성공","ok"))+'</dd></dl>'+
    (r.cnt&&(r.names||[]).length?'<div class="cc-fld">대상 '+r.cnt+'명'+(r.cnt>40?" 중 40명":"")+'</div><div class="fx-w mt4">'+r.names.map(function(n,i){ var e=(r.emps||[])[i]; return '<span class="pchip">'+esc(e?personLine({ emp:e, name:n }):n)+'</span>'; }).join("")+'</div>':'')+
    (ok?'<div class="mt"><button class="btn pri big" type="button" onclick="lgUndoAsk(\''+jq(r.ref)+'\')">되돌리기 · '+esc(u.lbl||GEN_UNDO[u.a])+'</button><p class="cap mt4">'+esc(GEN_NOTE[u.a]||"")+' · 되돌린 일도 기록에 새 줄로 남음</p></div>':dn?'<p class="cap mt">'+esc(dn)+' 되돌림</p>':u&&u.a==="roulette_undo"?'<div class="mt"><button class="btn dng big" type="button" onclick="rlUndoAsk(\''+jq(u.emp)+'\')">룰렛 사용 취소</button><p class="cap mt4">룰렛 타일로 잘못 찍었을 때 · 사유가 기록에 남음</p></div>':'')+
    (r.emp&&!r.cnt?'<div class="mt"><button class="btn big" type="button" onclick="pcOpen(\''+jq(r.emp)+'\')">한 사람 카드 열기</button></div>':'');
  drwOpen("alog:"+ref, drwHead((r.verb||"기록")+" · "+(r.cnt?r.cnt+"명":r.emp||r.name?personLine(r):r.k||""), fmtD(r.t))+body+'</div>', { g:MG.alog, label:"활동 기록 상세" });
}
function lgUndoAsk(ref){
  var r=lgRow(ref); if(!r||!r.undo) return; var u=r.undo;
  var a=u.a, p={}; if(a==="roll_undo") p={ batch:u.b }; else { for(var k in (u.p||{})) p[k]=u.p[k]; p.uref=r.ref; }
  confirmBox({ t:(u.lbl||GEN_UNDO[a])+"를 할까요?", who:(r.cnt?r.cnt+"명":r.emp||r.name?personLine(r):"")+" · "+lgWhat(r), sub:"처음 처리 "+fmtD(r.t)+" · "+(r.byName||r.by||"-")+" · "+(GEN_NOTE[a]||""), ok:"되돌리기", danger:a==="stamp_revoke",
    run:function(){ return call(a,p); },
    fail:function(x){ return x&&({ state:"그 사이 상태가 바뀌었습니다", roulette:"룰렛을 이미 돌렸습니다", tickets:"행운권이 이미 나갔습니다", fcfs:"선착순 가습기를 받았습니다", notlast:"그 뒤에 10F 명단이 또 바뀌었습니다" })[x.reason]||""; },
    done:function(x){ LG_DONE[r.ref]=hm(String(S.srvT||""))||"방금"; if(u.a==="roll_undo"){ var d0=S.data.alog; ((d0&&d0.rows)||[]).forEach(function(y){ if(y.undo&&y.undo.a==="roll_undo"&&y.undo.b===u.b) LG_DONE[y.ref]=LG_DONE[r.ref]; }); } if(DRW.k==="alog:"+r.ref) lgOpen(r.ref); reload(["alog","nb"]); ppStale(); toast("되돌렸습니다 · "+(u.lbl||GEN_UNDO[a])+(x&&x.done!=null&&a==="roll_undo"?" · "+n0(x.done)+"명"+((x.skip||[]).length?" · 건너뜀 "+x.skip.length:""):"")); } });
}
/* ── 급한 단추 ── */
function urPaint(){
  var b=S.data.nb, r=el("urR"), p=el("urP"); if(!r) return;
  var out=b&&b.ok?!!b.rout:null;
  r.innerHTML='<h2>룰렛 소진 안내 '+(out==null?"":out?tag("켜짐","warn"):tag("꺼짐","off"))+'</h2><p class="cap">켜면 참가자 앱 룰렛에 「경품 소진」 안내가 뜹니다 · 바로 바뀌고 7초 안에 되돌릴 수 있음</p>'+
    '<div class="btns mt"><button class="btn'+(out?"":" dng")+'" type="button"'+(out==null?' aria-disabled="true"':'')+' onclick="rlOut('+(out?0:1)+')">'+(out?"소진 안내 끄기":"소진 안내 켜기")+'</button><button class="btn" type="button" onclick="go(\'prize\')">경품 · 재고 보기</button></div>';
  var st=pushSt(), cur=ntCur();
  p.innerHTML='<h2>푸시 정지 '+(cur==="stop"?tag("전체 정지","bad"):cur==="lock"?tag("공지 푸시 잠금","warn"):cur==="ok"?tag("정상","ok"):"")+'</h2><p class="cap">오발송이 이어질 때 모든 푸시를 멈춤 · 확인 창 · 7초 안에 되돌릴 수 있음</p>'+
    (st?'<div class="btns mt">'+(cur==="stop"?'<button class="btn pri" type="button" onclick="ntStopAsk(\'ok\')">푸시 다시 켜기</button>':'<button class="btn dng fill" type="button" onclick="ntStopAsk(\'stop\')">푸시 전체 정지</button>')+'<button class="btn" type="button" onclick="go(\'notify\')">알림 보기</button></div>':(dataGate("pst","푸시 상태")||'<p class="cap mt">이 서버는 알림 기능이 없습니다</p>'));
}
/* 룰렛 소진 안내 · 바로 바꾸고 7초 되돌리기(경품 · 재고 화면과 같은 함수) */
function rlOut(on){
  call("roulette_out",{ on:on?"1":"0" }).then(function(r){
    if(r&&r.ok){ if(S.data.nb) S.data.nb.rout=r.out?1:0; paint(); toast(r.out?"룰렛 소진 안내를 켰습니다":"룰렛 소진 안내를 껐습니다",{ undo:function(){ rlOut(on?0:1); } }); reload(["nb"]); }
    else toast("바꾸지 못했습니다 · "+why(r),{ bad:1 });
  });
}
/* 앱 접속 범위 */
var OG_OPT=[["클로즈베타","클로즈 베타","접속 허용 명단 + 스태프"],["사전신청","사전 신청","사전 신청자 + 스태프 + 허용 명단"],["전체","전체","전 임직원"],["자동","자동","날짜대로(10/19 사전 신청 · 10/21 전체)"],["종료","행사 종료","앱 닫힘 안내 · 10/27 클로즈"]];
var OG_PH={ beta:"클로즈 베타", first:"사전 신청", all:"전체", end:"행사 종료", test:"클로즈 베타" };
var OG_CNT={ "클로즈베타":"beta", "사전신청":"first", "전체":"all", "자동":"auto", "종료":"end" };
function ogCur(){ var s=S.data.ogs, b=S.data.nb; return s&&s.ok?{ sc:s.sc, ph:s.ph, cnt:s.cnt, t1:s.t1, t2:s.t2 }:b&&b.ok&&b.og?{ sc:b.og.sc, ph:b.og.ph, cnt:null, t1:b.og.t1, t2:b.og.t2 }:null; }
function ogPaint(){
  var c=ogCur(), box=el("ogC"); if(!box) return;
  if(!c){ box.innerHTML='<h2>앱 접속 범위</h2>'+(dataGate("ogs","앱 접속 범위")||skel()); return; }
  box.innerHTML='<h2>앱 접속 범위 <span class="cap">지금 들어올 수 있는 사람</span><span class="r">'+tag("지금 "+(OG_OPT.filter(function(o){ return o[0]===c.sc; })[0]||[0,c.sc])[1]+(c.sc==="자동"?" · "+(OG_PH[c.ph]||c.ph):""),c.sc==="종료"?"bad":"")+'</span></h2>'+
    OG_OPT.map(function(o){ var on=o[0]===c.sc, n=c.cnt&&c.cnt[OG_CNT[o[0]]];
      return '<div class="row"><div class="t"><b>'+esc(o[1])+(on?' '+tag("지금","ok"):'')+'</b><span>'+esc(o[2])+(n!=null&&o[0]!=="종료"?" · 약 "+n0(n)+"명":"")+'</span></div>'+(on?'':'<button class="btn sm'+(o[0]==="종료"?" dng":"")+'" type="button" onclick="ogSet(\''+o[0]+'\')">'+esc(o[0]==="종료"?"행사 종료로":"이 범위로")+'</button>')+'</div>'; }).join("")+
    '<p class="cap mt">자동 = '+esc(String(c.t1||"").slice(5,16))+' 사전 신청 · '+esc(String(c.t2||"").slice(5,16))+' 전체 · 행사 종료는 자동으로 바뀌지 않음</p>';
}
function ogSet(sc){
  var c=ogCur()||{}, o=OG_OPT.filter(function(x){ return x[0]===sc; })[0], from=(OG_OPT.filter(function(x){ return x[0]===c.sc; })[0]||[0,c.sc])[1], n=c.cnt&&c.cnt[OG_CNT[sc]];
  confirmBox({ t:sc==="종료"?"앱을 행사 종료로 바꿀까요?":"앱 접속 범위를 바꿀까요?", who:from+" → "+o[1], sub:o[2]+(n!=null&&sc!=="종료"?" · 약 "+n0(n)+"명":"")+" · 참가자 앱에 바로 반영", ok:sc==="종료"?"행사 종료로 바꾸기":"범위 바꾸기", danger:sc==="종료"||sc==="클로즈베타",
    run:function(){ return call("og_scope_set",{ sc:sc }); },
    done:function(r){ if(S.data.ogs&&S.data.ogs.ok){ S.data.ogs.sc=r.sc; S.data.ogs.ph=r.ph; } if(S.data.nb&&S.data.nb.og){ S.data.nb.og.sc=r.sc; S.data.nb.og.ph=r.ph; } paint(); reload(["ogs","nb"]); toast("앱 접속 범위 · "+o[1]); } });
}
/* ── 서버 상태 ── */
function svPaint(){
  var a=el("svA"), b=el("svB"); if(!a) return; var nb=S.data.nb, ok=nb&&nb.ok, st=pushSt();
  var recent=NET.slice(-30), bad=recent.filter(function(x){ return !x.ok; }).length, ms=recent.length?Math.round(recent.reduce(function(s,x){ return s+x.ms; },0)/recent.length):0;
  var kv=function(rows){ return '<dl class="cc-kv sv-kv">'+rows.map(function(x){ return '<dt>'+esc(x[0])+'</dt><dd>'+x[1]+'</dd>'; }).join("")+'</dl>'; };
  a.innerHTML='<h2>서버</h2>'+kv([["환경",tag(envName(),envName()==="운영"?"":"off")],["주소",'<span class="cap">'+esc(String(BE).replace(/^https?:\/\//,"").replace(/\/exec$/,""))+'</span>'],["연결",S.err.nb?tag("연결 실패","bad"):ok?tag("정상","ok"):tag("연결 중","off")],["읽기 전용",ok?(nb.ro?tag("켜짐","warn"):tag("꺼짐","off")):"-"],["서버 시각",esc(ok?nb.t:"-")],["앱 접속 범위",esc(ok&&nb.og?(nb.og.sc||"")+(nb.og.ph?" · "+(OG_PH[nb.og.ph]||nb.og.ph):""):"-")],["앱 새로 받기 간격",ok&&nb.poll?n0(nb.poll)+"초":"-"]])+
    '<p class="cap mt">백업 · 시점 복구 · 읽기 전용 스위치는 서버 담당(대화로)</p>';
  b.innerHTML='<h2>이 콘솔 · 푸시</h2>'+kv([["최근 호출",n0(recent.length)+"번 · 평균 "+n0(ms)+"ms"],["실패",bad?tag(bad+"번","warn"):tag("없음","ok")],["들어온 사람",esc(((S.me&&S.me.name)||"")+" "+((S.me&&S.me.emp)||aemp()))],["푸시",st?(st.on?tag("켜짐","ok"):tag("전체 정지","bad"))+(st.err?" "+tag("발송기 오류","bad"):""):"-"],["구독 기기",st?n0(st.subs)+"대 · "+n0(st.emps)+"명":"-"],["가입 · 명부",ok&&nb.people?n0(nb.people.acct)+"명 · 명부 "+n0(nb.people.roster)+"명":"-"]])+
    '<div class="btns mt"><button class="btn" type="button" onclick="refreshAll()">다시 받기</button></div>';
}
/* ── 스태프 코드 ── */
function scPaint(){
  var b=el("scB"); if(!b) return; var d=S.data.admr, on=d&&d.ok?d.staffCode:null;
  var gt=dataGate("admr","스태프 코드"); if(gt){ b.innerHTML='<h2>스태프 코드</h2>'+gt; return; }
  if(on==null){ b.innerHTML='<h2>스태프 코드</h2>'+band("info","이 서버는 아직 스태프 코드를 모릅니다"); return; }
  if(!el("sc1")) b.innerHTML='<h2>스태프 코드 <span id="scTag"></span></h2><p class="cap">앱 스태프 명단에 있는 사번이 스태프 폰(스캔 · 현장 부여)을 여는 코드 · 콘솔은 열지 못함 · 바꾸면 기존 스태프 폰은 코드를 다시 묻습니다</p><p class="cap mt4" id="scS"></p>'+
    '<div class="nt-row mt"><label class="up-f">새 코드<input class="xg-q" id="sc1" type="password" inputmode="numeric" autocomplete="new-password" maxlength="16" oninput="scIn(this)"></label><label class="up-f">한 번 더<input class="xg-q" id="sc2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="16" oninput="scIn(this)"></label></div>'+
    '<p class="cap mt4" id="scH">숫자 6~16자리</p><div class="btns mt"><button class="btn pri" type="button" onclick="scGo()">스태프 코드 바꾸기</button><span id="scX"></span></div>';
  el("scTag").innerHTML=on?tag("설정됨","ok"):tag("비어 있음","off");
  el("scS").textContent=on?"지금 설정돼 있습니다 · 명단 사번 + 스태프 코드로 스태프 폰이 열립니다":"지금 비어 있습니다 · 스태프 폰은 관리코드로만 들어옵니다";
  el("scX").innerHTML=on?'<button class="btn dng" type="button" onclick="scClearAsk()">비우기</button>':'';
}
function scVals(){ return [(el("sc1")||{}).value||"", (el("sc2")||{}).value||""]; }
function scIn(i){ var v=String(i.value||"").replace(/\D/g,"").slice(0,16); if(v!==i.value) i.value=v; var a=scVals(), h=el("scH"); if(h) h.textContent=!a[0]?"숫자 6~16자리":!/^\d{6,16}$/.test(a[0])?"숫자 6~16자리 · 지금 "+a[0].length+"자리":!a[1]?a[0].length+"자리 · 한 번 더 넣습니다":a[0]===a[1]?a[0].length+"자리 · 두 칸이 같습니다":"두 칸이 다릅니다"; }
function scClr(){ ["sc1","sc2"].forEach(function(k){ var i=el(k); if(i) i.value=""; }); var h=el("scH"); if(h) h.textContent="숫자 6~16자리"; }
function scWhy(r, clr){ r=r||{}; return ({ rule:"숫자 6~16자리로 넣습니다", twice:"두 번 넣은 코드가 다릅니다", weak:"같은 숫자 반복 · 이어진 숫자는 쓸 수 없습니다", same:clr?"이미 비어 있습니다":"지금 스태프 코드와 같습니다", clash:"관리코드나 등급코드와 같은 값입니다" })[r.reason]||why(r); }
function scGo(){
  var a=scVals();
  if(!/^\d{6,16}$/.test(a[0])){ toast("숫자 6~16자리로 넣습니다"); return; }
  if(a[0]!==a[1]){ toast("두 번 넣은 코드가 다릅니다"); return; }
  confirmBox({ t:"스태프 코드를 바꿀까요?", who:"새 스태프 코드 · "+a[0].length+"자리", sub:"기존 스태프 폰은 다음 스캔에서 코드를 다시 묻습니다 · 관리코드 · 등급코드는 그대로 · 새 코드는 스태프에게 직접 전합니다", ok:"바꾸기", danger:true,
    run:function(){ return call("adm_code_set",{ which:"staff", code:a[0], code2:a[1] }); },
    fail:function(r){ return scWhy(r); },
    done:function(){ scClr(); reload(["admr"]); toast("스태프 코드를 바꿨습니다 · 스태프 폰은 코드를 다시 묻습니다",{ ms:6000 }); } });
}
function scClearAsk(){
  confirmBox({ t:"스태프 코드를 비울까요?", who:"스태프 코드 · 설정됨 → 비어 있음", sub:"스태프 폰은 다음 요청부터 코드를 다시 묻고 · 비운 동안은 관리코드로만 들어옵니다", ok:"비우기", danger:true,
    run:function(){ return call("adm_code_set",{ which:"staff", clear:"1" }); },
    fail:function(r){ return scWhy(r,1); },
    done:function(){ scClr(); reload(["admr"]); toast("스태프 코드를 비웠습니다",{ ms:6000 }); } });
}
/* 룰렛 사용 취소 · 사유(2~60자) · 확인 창 · 실물 경품을 이미 받았으면 먼저 회수 */
function rlUndoAsk(emp){
  call("roulette_undo",{ emp:emp, dry:1 }).then(function(d){
    d=d||{}; if(!d.ok){ toast(d.reason==="notused"?"서버 기록에 룰렛 사용이 없습니다":"확인하지 못했습니다 · "+why(d),{ bad:1 }); return; }
    confirmBox({ t:"룰렛 사용을 취소할까요?", who:personLine({ emp:emp, name:d.name, dept:d.dept }), sub:"룰렛을 다시 돌릴 수 있게 됨"+(d.g?" · 등급 기록 "+d.g+" 함께 되돌림":"")+" · 실물 경품을 이미 받았으면 먼저 회수",
      body:'<div class="chips">'+["스캔 오류(잘못 찍음)","같은 사람 두 번","기타"].map(function(c){ return '<button type="button" class="chip" onclick="el(\'rluWhy\').value=\''+c+'\';gateUpd()">'+esc(c)+'</button>'; }).join("")+'</div><label class="fld">사유(2~60자)<input class="in" id="rluWhy" maxlength="60" autocomplete="off" oninput="gateUpd()"></label>',
      focus:"rluWhy", ok:"사용 취소", danger:true, gate:function(){ return String((el("rluWhy")||{}).value||"").trim().length>=2; },
      run:function(){ return call("roulette_undo",{ emp:emp, why:String(el("rluWhy").value).trim() }); },
      done:function(x){ reload(["alog","nb"]); ppStale(); if(PC.emp===normE(emp)) pcLoad(); toast("룰렛 사용을 취소했습니다 · "+(x.name||emp)); } });
  });
}
