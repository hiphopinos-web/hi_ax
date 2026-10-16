/* AXF CONTROL v2 · S2 처리함 (261016)
 * 칩 = AX 라운지(배치판) · 커피챗 · 체크인존 · 스태프 요청 · PIN 분실. 한 건씩 처리하고 처리한 줄만 고친다.
 * 승인 · 체크인 · 선정 · 다음 번호 · 번호표 무효 = L2(확인 창, PIN 없음) · 요청 닫기 · 잘못된 PIN 요청 닫기 = L1(바로 · 토스트)
 * 서버가 아직 PIN 을 요구하는 동작(PIN 초기화)은 같은 확인 창이 PIN 칸으로 바뀐다(옛 서버 · 갱신 뒤 없어짐) */
var IB_SUBS=[["lounge","AX 라운지","신청"],["cchat","커피챗","희망"],["ck","체크인존","대기"],["req","스태프 요청",""],["pw","PIN 분실",""]];
var RV_CLS={ "신청":"req", "승인":"okc", "체크인":"in", "완료":"done", "노쇼":"no" };
var RV_TAG={ "신청":"warn", "승인":"", "체크인":"", "완료":"ok", "노쇼":"bad", "취소":"off" };
var CC_ROUNDS=["13:00","13:30","14:00","14:30","15:00","15:30"], CC_TABLES=["A","B","C","D","E","F"];
function ibSub(){ var s=S.sub.inbox; return IB_SUBS.some(function(x){ return x[0]===s; })?s:"lounge"; }
SCREENS.inbox={
  title:"처리함", desc:"",
  need:function(){ var s=ibSub();
    return s==="lounge"?[{ k:"resv", a:"resv_list", ttl:20000 }]:s==="cchat"?[{ k:"cc", a:"cchat_list", ttl:20000 }]:s==="ck"?[{ k:"ck", a:"ck_state", ttl:15000 }]:s==="req"?[{ k:"sreq", a:"sreq_list", p:{ st:"all", n:100 }, ttl:15000 }]:[{ k:"pwl", a:"pw_req_list", ttl:30000 }]; },
  mount:function(vb){
    var s=ibSub();
    el("phCap").textContent={ lounge:"1F AX 라운지 · 상담석 2 x 1시간 칸 배치판", cchat:"18F AX 커피챗 · 희망 → 선정(회차 · 테이블) → 참석", ck:"1F 체크인존 · 창구 A~D 번호표", req:"스태프 폰 「운영자에게 요청」", pw:"앱 로그인 「PIN 을 잊었어요」 요청" }[s];
    vb.innerHTML='<div class="chips" id="ibChips" role="tablist" aria-label="처리함"></div><div id="ibB"></div>';
    var b=el("ibB");
    if(s==="lounge") b.innerHTML='<div id="lgErr"></div><div class="grid gside"><div class="card" style="padding:8px 12px" id="lgBoard"></div><div class="col" id="lgSide"></div></div><div class="card mt"><h2>AX 라운지 신청 명단</h2><div id="lgList"></div></div>';
    else if(s==="cchat") b.innerHTML='<div class="card"><h2>커피챗 명단 <span class="cap">희망 → 선정 → 참석 · 회차 '+CC_ROUNDS.join(" · ")+'</span></h2><div id="ccList"></div>'+laterH("희망 접수 마감 · 재개 단추")+'</div>';
    else if(s==="ck") b.innerHTML='<div id="ckTop"></div><div class="grid g4" id="ckWin"></div><div class="mt">'+oldLink("E 창구(교환 · 명단 밖) 기록과 번호표 명단")+'</div>';
    else if(s==="req") b.innerHTML='<div class="card"><h2>스태프 요청</h2><div id="rqList"></div></div>';
    else b.innerHTML='<div class="card"><h2>PIN 분실 요청 <span class="cap">본인 확인(사원증) 뒤 초기화</span></h2><div id="pwList"></div></div>';
  },
  paint:function(){
    var b=S.data.nb, s=ibSub(), c=b&&b.ok?{ lounge:num(b.resv&&b.resv.wait), cchat:num(b.cchat&&b.cchat.wait), ck:num(b.ck&&b.ck.wait), req:num(b.sreq&&b.sreq.open), pw:num(b.pw) }:{};
    el("ibChips").innerHTML=IB_SUBS.map(function(x){ return '<button type="button" role="tab" aria-selected="'+(x[0]===s)+'" class="chip'+(x[0]===s?" on":"")+'" onclick="goSub(\''+x[0]+'\')">'+esc(x[1])+' <span class="c">'+(x[2]?x[2]+" ":"")+(c[x[0]]!=null?n0(c[x[0]]):"-")+'</span></button>'; }).join("");
    ({ lounge:lgPaint, cchat:ccPaint, ck:ckPaint, req:rqPaint, pw:pwPaint })[s]();
  }
};

/* ── AX 라운지 배치판 · 세로 1시간 칸(칸 수 = 설정 값) × 가로 상담석 ── */
function lgCfg(){ var b=S.data.nb, L=b&&b.lounge; return { start:(L&&L.start)||LOUNGE_DEF.start, n:num(L&&L.n)||LOUNGE_DEF.n, seats:num(L&&L.seats)||LOUNGE_DEF.seats, srv:!!L }; }
function lgPlace(rows){
  var cf=lgCfg(), s0=mins(cf.start), grid=[], out=[], cx=[];
  for(var i=0;i<cf.n;i++){ grid.push([]); for(var j=0;j<cf.seats;j++) grid[i].push(null); }
  rows.slice().sort(function(a,b){ return String(a.ts).localeCompare(String(b.ts)); }).forEach(function(r){
    if(r.status==="취소"){ cx.push(r); return; }
    var m=mins(r.slot), i=Math.floor((m-s0)/60);
    if(m<0||i<0||i>=cf.n){ out.push(r); return; }
    var j=r.seat?num(r.seat)-1:grid[i].indexOf(null);
    if(j<0||j>=cf.seats||grid[i][j]){ j=grid[i].indexOf(null); }
    if(j<0){ out.push(r); return; }
    grid[i][j]=r;
  });
  return { cf:cf, grid:grid, out:out, cx:cx, s0:s0 };
}
var LG={ sel:null, g:null };
function lgPaint(){
  var gt=dataGate("resv","AX 라운지 신청");
  if(gt){ el("lgBoard").innerHTML=gt; el("lgSide").innerHTML=""; return; }
  var rows=S.data.resv.rows||[], P=lgPlace(rows), cf=P.cf;
  el("lgErr").innerHTML=errTop("resv");
  var hd='<div class="h"></div>'; for(var j=0;j<cf.seats;j++) hd+='<div class="h">상담석 '+(j+1)+'</div>';
  var cells="";
  P.grid.forEach(function(rw,i){
    var t=m2hm(P.s0+i*60); cells+='<div class="tm">'+t+'</div>';
    rw.forEach(function(r,j){ var key=i+":"+j, sel=LG.sel===key?" sel":"";
      cells+=r?'<button type="button" class="cell '+(RV_CLS[r.status]||"")+sel+'" onclick="lgPick(\''+key+'\')" aria-label="'+esc(t+" 상담석 "+(j+1)+" "+r.name+" "+r.status)+'"><span class="nm">'+esc(r.name||r.emp)+'</span><span class="s">'+esc(r.status)+'</span></button>'
        :'<button type="button" class="cell empty'+sel+'" onclick="lgPick(\''+key+'\')">빈 자리</button>'; });
  });
  var cols='56px'+new Array(cf.seats+1).join(' minmax(0,1fr)');
  el("lgBoard").innerHTML='<div class="legend"><span class="cap">칸 '+cf.n+'개 · '+(cf.srv?"운영 시간 설정":"기본값 "+cf.start+" 부터")+'</span><span><i style="background:var(--warn-bg)"></i>신청</span><span><i style="background:var(--navy05)"></i>승인</span><span><i style="background:var(--navy)"></i>체크인</span><span><i style="background:var(--ok-bg)"></i>완료</span><span><i style="background:var(--bad-bg)"></i>노쇼</span><span><i style="background:#fff;border-style:dashed"></i>빈 자리</span></div>'+
    '<div class="board" style="grid-template-columns:'+cols+'">'+hd+cells+'</div>'+
    (P.out.length?'<div class="band warn mt">칸 밖 신청 '+P.out.length+'건 · '+esc(P.out.map(function(r){ return hm(r.slot)+" "+(r.name||r.emp); }).join(", "))+'</div>':'')+
    '<div class="cap mt">취소 '+P.cx.length+'건은 아래 명단에 · '+(cf.srv?"":"상담석 번호는 서버 갱신 뒤 서버 값")+'</div>';
  LG.P=P; lgSide();
  if(!LG.g) LG.g=XG.make({ id:"lounge", file:"AX 라운지 신청", key:function(r){ return r.id; }, sort:{ k:"slot", d:1 },
    chips:[["all","전체",null],["w","신청",function(r){ return r.status==="신청"; }],["ok","승인",function(r){ return r.status==="승인"; }],["in","체크인",function(r){ return r.status==="체크인"; }],["dn","완료",function(r){ return r.status==="완료"; }],["no","노쇼",function(r){ return r.status==="노쇼"; }],["cx","취소",function(r){ return r.status==="취소"; }]],
    cols:[{ k:"slot", t:"시간", w:70, v:function(r){ return hm(r.slot); } },{ k:"name", t:"이름", w:110 },{ k:"emp", t:"사번", w:90 },{ k:"dept", t:"부서", w:130 },{ k:"status", t:"상태", w:80, f:function(r){ return tag(r.status, RV_TAG[r.status]); } },{ k:"memo", t:"메모", w:160 },{ k:"ts", t:"신청 시각", type:"date", w:110 },{ k:"cxAt", t:"취소 시각", type:"date", w:110 }],
    src:{ a:"resv_list", p:{} }, h:360 });
  XG.set(LG.g, rows, el("lgList"));
}
function lgPick(key){ LG.sel=key; lgPaint(); }
function lgSide(){
  var P=LG.P, box=el("lgSide"); if(!P) return;
  if(!LG.sel){ var w=null; P.grid.some(function(rw,i){ return rw.some(function(r,j){ if(r&&r.status==="신청"){ w=i+":"+j; return true; } }); }); if(w){ LG.sel=w; return lgPaint(); } }
  if(!LG.sel){ box.innerHTML='<div class="card">'+emptyH("대기 중인 신청이 없습니다")+'<p class="cap">칸을 누르면 여기에 나옵니다</p></div>'+lgNext(); return; }
  var ij=LG.sel.split(":"), i=num(ij[0]), j=num(ij[1]), r=(P.grid[i]||[])[j], t=m2hm(P.s0+i*60)+"~"+m2hm(P.s0+i*60+60);
  if(!r){ box.innerHTML='<div class="card"><h2>'+t+' · 상담석 '+(j+1)+' '+tag("빈 자리","off")+'</h2>'+laterH("다른 신청을 이 칸으로 옮기기(시간 · 상담석 바꾸기)")+'</div>'+lgNext(); return; }
  var st=r.status, A="";
  var b=function(to,lab,cls){ return '<button class="btn '+(cls||"")+'" type="button" onclick="rvAsk(\''+jq(r.id)+'\',\''+to+'\')">'+esc(lab)+'</button>'; };
  if(st==="신청") A='<button class="btn pri big" type="button" onclick="rvAsk(\''+jq(r.id)+'\',\'승인\')">승인 · 알림 보내기</button><div class="btns mt"><button class="btn" type="button" aria-disabled="true" title="서버 갱신 뒤" onclick="toast(\'다른 시간으로 옮기기는 서버 갱신 뒤에 씁니다\')">다른 시간으로</button>'+b("취소","취소","dng")+'</div>';
  else if(st==="승인") A='<button class="btn pri big" type="button" onclick="rvAsk(\''+jq(r.id)+'\',\'체크인\')">체크인</button><div class="btns mt">'+b("노쇼","노쇼","dng")+b("취소","취소","dng")+'</div>';
  else if(st==="체크인") A='<button class="btn pri big" type="button" onclick="rvAsk(\''+jq(r.id)+'\',\'완료\')">상담 완료</button><div class="btns mt">'+b("승인","체크인 되돌리기")+b("노쇼","노쇼","dng")+'</div>';
  else if(st==="완료") A='<div class="btns">'+b("체크인","완료 되돌리기")+'</div>';
  else if(st==="노쇼") A='<div class="btns">'+b("승인","노쇼 되돌리기")+'</div>';
  box.innerHTML='<div class="card"><h2>'+t+' · 상담석 '+(j+1)+' '+tag(st,RV_TAG[st])+'</h2>'+rowH(r.name||r.emp,[r.dept,"사번 "+r.emp,"신청 "+hm(r.slot),"앱 신청 "+fmtD(r.ts)].filter(Boolean).join(" · "))+
    '<div class="cap mt">메모</div><div class="memo">'+(r.memo?esc(r.memo):'<span class="cap">없음</span>')+'</div><div class="mt">'+A+'</div></div>'+lgNext();
}
function lgNext(){ return '<div class="card"><h2>이어지는 일</h2><p class="cap">승인 → 체크인(스태프 스캔 또는 여기) → 완료. 체크인 · 완료하면 스탬프 07 프로그램 참여(라운지 참석 확인)가 붙고, 노쇼 · 취소로 바꾸면 거둡니다.</p></div>'; }
var RV_FX={ "승인":"참가자 앱에 승인 알림이 갑니다", "체크인":"스탬프 07 프로그램 참여 · 라운지 참석 확인", "완료":"상담 완료 · 사은품 대상", "노쇼":"참석 확인 스탬프를 거둡니다 · 자리는 그대로", "취소":"자리가 비고 참가자 앱에 바로 반영됩니다" };
function rvRow(id){ var d=S.data.resv; return d&&d.rows?d.rows.filter(function(x){ return x.id===id; })[0]:null; }
function rvAsk(id, to){
  var r=rvRow(id); if(!r) return;
  var from=r.status, lab={ "승인":from==="신청"?"승인 · 알림 보내기":"되돌리기", "체크인":from==="승인"?"체크인":"되돌리기", "완료":"상담 완료", "노쇼":"노쇼 처리", "취소":"취소 처리" }[to];
  var q={ "승인":from==="신청"?"상담을 승인할까요?":"승인 상태로 되돌릴까요?", "체크인":from==="승인"?"체크인할까요?":"체크인 상태로 되돌릴까요?", "완료":"상담을 완료할까요?", "노쇼":"노쇼로 바꿀까요?", "취소":"신청을 취소할까요?" }[to];
  confirmBox({ t:q, who:(r.name||r.emp)+" · "+hm(r.slot)+" · "+from+" → "+to, sub:RV_FX[to], ok:lab, danger:to==="노쇼"||to==="취소",
    run:function(){ return call("resv_set",{ id:id, status:to, from:from }); },
    fail:function(x){ return x&&x.reason==="state"?"이미 "+(x.cur||"다른 상태")+"입니다 · 목록을 다시 받습니다":""; },
    done:function(x){ r.status=to; lgPaint(); reload(["resv"]); toast((r.name||r.emp)+" · "+to+(x&&x.stamp&&x.stamp.ok?" · 스탬프":""),{ undo:function(){ rvUndo(id, to, from); } }); } });
}
function rvUndo(id, cur, back){
  call("resv_set",{ id:id, status:back, from:cur }).then(function(x){ var r=rvRow(id); if(x&&x.ok){ if(r) r.status=back; lgPaint(); toast("되돌렸습니다 · "+back); } else toast("되돌리지 못했습니다 · "+why(x),{ bad:1 }); reload(["resv"]); });
}

/* ── 커피챗 · 명단 표 + 줄 단추 ── */
var CC={ g:null };
function ccPaint(){
  if(!CC.g) CC.g=XG.make({ id:"cchat", file:"18F 커피챗", key:function(r){ return r.emp; }, sort:{ k:"ts", d:1 },
    chips:[["all","전체",null],["w","희망",function(r){ return r.status==="대기"; }],["m","선정",function(r){ return r.status==="매칭"; }],["in","참석",function(r){ return r.status==="참석"||r.status==="완료"; }],["cx","취소",function(r){ return r.status==="취소"; }]],
    cols:[{ k:"ts", t:"신청 시각", type:"date", w:100 },{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"부서", w:120 },{ k:"tag", t:"관심", w:110 },{ k:"status", t:"상태", w:72, v:function(r){ return ccSt(r.status); }, f:function(r){ var s=ccSt(r.status); return tag(s, s==="희망"?"warn":s==="참석"||s==="완료"?"ok":s==="취소"?"off":""); } },{ k:"round", t:"회차", w:64 },{ k:"table", t:"테이블", w:64 },
      { t:"", w:190, act:function(r){ var e=jq(r.emp);
        if(r.status==="대기") return '<button class="btn sm pri" type="button" onclick="ccPick(\''+e+'\')">선정</button>';
        if(r.status==="매칭") return '<button class="btn sm pri" type="button" onclick="ccSet(\''+e+'\',\'참석\')">참석</button> <button class="btn sm" type="button" onclick="ccSet(\''+e+'\',\'대기\')">선정 취소</button>';
        if(r.status==="참석") return '<button class="btn sm" type="button" onclick="ccSet(\''+e+'\',\'완료\')">완료</button> <button class="btn sm dng" type="button" onclick="ccSet(\''+e+'\',\'매칭\')">참석 취소</button>';
        return ""; } }],
    src:{ a:"cchat_list", p:{} }, h:480 });
  var gt=dataGate("cc","커피챗 명단"); CC.g.gate=gt||""; XG.set(CC.g, gt?null:(S.data.cc.rows||[]), el("ccList"));
}
function ccSt(s){ return s==="대기"?"희망":s==="매칭"?"선정":s; }
function ccRow(e){ var d=S.data.cc; return d&&d.rows?d.rows.filter(function(x){ return jq(x.emp)===e; })[0]:null; }
var CCP={ round:"", table:"" };
function ccPick(e){
  var r=ccRow(e); if(!r) return; CCP.round=""; CCP.table="";
  var chip=function(k,v){ return '<button type="button" class="chip" data-'+k+'="'+v+'" onclick="ccChoose(\''+k+'\',\''+v+'\')">'+v+'</button>'; };
  confirmBox({ t:"커피챗 자리를 정할까요?", who:(r.name||r.emp)+" · "+(r.dept||""), sub:"관심 "+(r.tag||"-")+" · 선정하면 참가자 앱에 알림이 갑니다",
    body:'<div class="fld">회차</div><div class="chips">'+CC_ROUNDS.map(function(v){ return chip("round",v); }).join("")+'</div><div class="fld">테이블</div><div class="chips">'+CC_TABLES.map(function(v){ return chip("table",v); }).join("")+'</div>',
    ok:"선정 · 알림 보내기", gate:function(){ return !!(CCP.round&&CCP.table); },
    run:function(){ return call("cchat_set",{ emp:r.emp, round:CCP.round, table:CCP.table, from:r.status }); },
    done:function(){ var prev=r.status; r.status="매칭"; r.round=CCP.round; r.table=CCP.table; ccPaint(); reload(["cc"]); toast((r.name||r.emp)+" · "+CCP.round+" "+CCP.table+" 선정",{ undo:function(){ ccSet(e, prev, 1); } }); } });
}
function ccChoose(k, v){ CCP[k]=v; [].forEach.call(document.querySelectorAll("#dlgCard [data-"+k+"]"),function(b){ b.classList.toggle("on", b.getAttribute("data-"+k)===v); }); gateUpd(); }
function ccSet(e, to, quiet){
  var r=ccRow(e); if(!r) return; var from=r.status;
  var run=function(){ return call("cchat_status",{ emp:r.emp, status:to, from:from }); };
  var after=function(){ r.status=to; if(to==="대기"){ r.round=""; r.table=""; } ccPaint(); reload(["cc"]); };
  if(quiet){ run().then(function(x){ if(x&&x.ok){ after(); toast("되돌렸습니다"); } else toast("되돌리지 못했습니다 · "+why(x),{ bad:1 }); }); return; }
  confirmBox({ t:{ "참석":"참석으로 바꿀까요?", "완료":"완료로 바꿀까요?", "대기":"선정을 취소할까요?", "매칭":"참석을 취소할까요?" }[to]||"바꿀까요?", who:(r.name||r.emp)+" · "+ccSt(from)+" → "+ccSt(to), sub:to==="참석"?"스탬프 07 프로그램 참여가 붙습니다":to==="매칭"?"참석 스탬프는 서버 규칙대로":"참가자 앱에 바로 반영됩니다", ok:{ "참석":"참석", "완료":"완료", "대기":"선정 취소", "매칭":"참석 취소" }[to], danger:to==="대기"||to==="매칭",
    run:run, done:function(){ after(); toast((r.name||r.emp)+" · "+ccSt(to),{ undo:function(){ ccSet(e, from, 1); } }); } });
}

/* ── 체크인존 · 창구 A~D ── */
function ckPaint(){
  var gt=dataGate("ck","체크인존"); if(gt){ el("ckWin").innerHTML=gt; return; }
  var d=S.data.ck, bd=d.board||{}, W=bd.w||{}, st=d.stat||{}, cf=d.cfg||{};
  el("ckTop").innerHTML=errTop("ck")+(cf.on==="ON"?band("info","창구 열림 · "+esc(cf.open||"")+"부터 · 대기 "+n0(bd.n)+"명"):band("warn","체크인존 접수가 꺼져 있습니다 · 행사일 "+esc(cf.open||"08:00")+" 시작"));
  el("ckWin").innerHTML=["A","B","C","D"].map(function(w){ var b=W[w]||{}, s=st[w]||{}, cur=b.cur;
    return '<div class="win"><div class="cap">창구 '+w+' · '+esc((b.sz||[]).join(" "))+'</div><div class="no">'+(cur?esc(cur.no):"-")+'</div><div class="cap">'+(cur?"호출 중 · "+esc(cur.nm||""):"호출 없음")+'</div>'+
      '<div class="cap">대기 <b>'+n0(s.wait)+'</b> · 받음 <b>'+n0(s.done)+'</b> · 번호표 '+n0(s.issued)+'</div>'+
      '<button class="btn pri" type="button" onclick="ckNext(\''+w+'\')">다음 번호 부르기</button><button class="btn sm dng" type="button" onclick="ckVoid(\''+w+'\')">번호표 무효</button></div>'; }).join("");
}
function ckNext(w){
  var d=S.data.ck, b=((d.board||{}).w||{})[w]||{}, cur=b.cur, nx=(b.nx||[])[0];
  confirmBox({ t:"창구 "+w+"의 다음 번호를 부를까요?", who:"지금 "+(cur?cur.no:"없음")+" → 다음 "+(nx?(nx.no||nx):"대기 없음"), sub:cur?"지금 호출 중인 사람을 건너뜁니다 · TV와 그 사람 폰에 알림":"TV와 그 사람 폰에 알림", ok:"다음 번호 부르기",
    run:function(){ return call("ck_next",{ w:w }); }, done:function(r){ toast(r.called?"창구 "+w+" · "+r.called.no+" 호출":"창구 "+w+" · 부를 번호가 없습니다"); reload(["ck"]); } });
}
function ckVoid(w){
  var d=S.data.ck, cur=(((d.board||{}).w||{})[w]||{}).cur;
  confirmBox({ t:"번호표를 무효로 할까요?", who:"창구 "+w, sub:"TV와 그 사람 폰에서 내립니다 · 호출 중이면 다음 번호를 부릅니다",
    body:'<label class="fld">번호(예 '+w+'-007)<input class="in" id="ckNo" value="'+esc(cur?cur.no:w+"-")+'" autocomplete="off" oninput="gateUpd()"></label><label class="fld">사유(선택)<input class="in" id="ckWhy" maxlength="40" autocomplete="off"></label>',
    focus:"ckNo", ok:"무효로", danger:true, gate:function(){ return /^[A-Da-d]-\d{3}$/.test(String((el("ckNo")||{}).value||"").trim()); },
    run:function(){ return call("ck_void",{ no:String(el("ckNo").value).trim().toUpperCase(), why:String(el("ckWhy").value||"").trim() }); },
    fail:function(r){ return r&&r.reason==="state"?"이미 끝났거나 무효인 번호입니다":r&&r.reason==="notfound"?"오늘 그 번호가 없습니다":""; },
    done:function(r){ toast(r.no+" 무효"+(r.called?" · 다음 "+r.called.no+" 호출":"")); reload(["ck"]); } });
}

/* ── 스태프 요청 · 명단 표 ── */
var RQ={ g:null };
function rqPaint(){
  if(!RQ.g) RQ.g=XG.make({ id:"sreq", file:"스태프 요청", key:function(r){ return r.id; }, sort:{ k:"t", d:-1 },
    chips:[["open","열림",function(r){ return r.st==="open"; }],["done","닫힘",function(r){ return r.st!=="open"; }],["all","전체",null]],
    cols:[{ k:"t", t:"요청 시각", type:"date", w:96 },{ k:"kind", t:"종류", w:120, v:function(r){ return SREQ_K[r.kind]||r.kind; } },{ k:"name", t:"대상", w:100, v:function(r){ return r.name||r.emp||""; } },{ k:"spot", t:"자리", w:90 },{ k:"byName", t:"보낸 스태프", w:100, v:function(r){ return r.byName||r.by||""; } },{ k:"note", t:"메모", w:150 },
      { k:"res", t:"결과", w:70, v:function(r){ return r.st==="open"?"열림":r.res||"닫힘"; }, f:function(r){ return r.st==="open"?tag("열림","warn"):tag(r.res||"닫힘","off"); } },
      { t:"", w:200, act:function(r){ if(r.st!=="open") return '<span class="cap">'+esc(fmtD(r.doneAt))+' '+esc(r.doneByName||"")+'</span>'; var i=jq(r.id); return '<button class="btn sm pri" type="button" onclick="reqDone(\''+i+'\',\'처리\')">처리</button> <button class="btn sm" type="button" onclick="reqDone(\''+i+'\',\'안내\')">안내</button> <button class="btn sm dng" type="button" onclick="reqDone(\''+i+'\',\'거절\')">거절</button>'; } }],
    src:{ a:"sreq_list", p:{ st:"all", n:100 }, pick:function(r){ return r.rows; } }, empty:"열린 요청이 없습니다", h:480 });
  var gt=dataGate("sreq","스태프 요청"); RQ.g.gate=gt||""; XG.set(RQ.g, gt?null:(S.data.sreq.rows||[]), el("rqList"));
}

/* ── PIN 분실 · 명단 표 ── */
var PW={ g:null };
function pwPaint(){
  if(!PW.g) PW.g=XG.make({ id:"pw", file:"PIN 분실 요청", key:function(r){ return String(r.row); }, sort:{ k:"ts", d:-1 },
    chips:[["w","기다림",function(r){ return r.status==="대기"; }],["d","처리함",function(r){ return r.status!=="대기"; }],["all","전체",null]],
    cols:[{ k:"ts", t:"요청 시각", type:"date", w:100 },{ k:"name", t:"이름", w:110 },{ k:"emp", t:"사번", w:90 },{ k:"status", t:"상태", w:80, f:function(r){ return tag(r.status, r.status==="대기"?"warn":"off"); } },{ k:"pwSet", t:"PIN 있음", w:80, v:function(r){ return r.pwSet?"있음":r.joined?"없음":"가입 전"; } },{ k:"doneAt", t:"처리 시각", type:"date", w:100 },
      { t:"", w:250, act:function(r){ if(r.status!=="대기") return '<span class="cap">'+esc(r.by||"")+'</span>'; return '<button class="btn sm pri" type="button" onclick="pwDo('+num(r.row)+')">PIN 초기화하고 처리</button> <button class="btn sm" type="button" onclick="pwCancel('+num(r.row)+')">잘못된 요청</button>'; } }],
    src:{ a:"pw_req_list", p:{} }, empty:"요청이 없습니다", h:420 });
  var gt=dataGate("pwl","PIN 분실 요청"); PW.g.gate=gt||""; XG.set(PW.g, gt?null:(S.data.pwl.rows||[]), el("pwList"));
}
function pwRow(row){ var d=S.data.pwl; return d&&d.rows?d.rows.filter(function(x){ return num(x.row)===row; })[0]:null; }
function pwDo(row){
  var r=pwRow(row); if(!r) return;
  confirmBox({ t:"PIN 을 초기화할까요?", who:(r.name||"")+" · 사번 "+r.emp, sub:"본인 확인 뒤 · 다음 로그인에 넣는 4자리가 새 PIN · 되돌릴 수 없음", ok:"초기화하고 처리", danger:true,
    run:function(pp){ return call("pw_req_done",Object.assign({ row:row, by:"콘솔 "+((S.me&&S.me.emp)||aemp()) },pp)); },
    done:function(){ r.status="처리"; pwPaint(); reload(["pwl","pwc","nb"]); toast("PIN 을 초기화했습니다 · "+(r.name||r.emp)); } });
}
function pwCancel(row){
  var r=pwRow(row); if(!r) return;
  call("pw_req_cancel",{ row:row, by:"콘솔 "+((S.me&&S.me.emp)||aemp()) }).then(function(x){ if(x&&x.ok){ r.status="취소"; pwPaint(); reload(["pwl","pwc"]); toast("요청을 닫았습니다 · PIN 은 그대로"); } else toast("닫지 못했습니다 · "+why(x),{ bad:1 }); });
}
