/* AXF CONTROL v2 · S2 처리함 (261016)
 * 칩 = AX 라운지(배치판) · 커피챗(cchat.js) · 체크인존(지급 현황) · 스태프 요청 · PIN 분실. 한 건씩 처리하고 처리한 줄만 고친다.
 * 승인 · 체크인 · 선정 = L2(확인 창, PIN 없음) · 요청 닫기 · 잘못된 PIN 요청 닫기 = L1(바로 · 토스트)
 * 261016 체크인존 = 스태프 폰 한 번 찍기(ck_gate · 키트 · 스태프 옷 · 선착순 참여상) · 창구 A~D · 번호표 · 창구 대기는 걷음(서버 ck_ticket · ck_next 는 쓰지 않음)
 * 261016 콘솔 동작에는 PIN 을 묻지 않는다(「PIN 분실」은 참가자 앱 PIN 요청 처리) */
var IB_SUBS=[["lounge","AX 라운지","신청"],["cchat","커피챗","희망"],["ck","체크인존",null],["req","스태프 요청",""],["pw","PIN 분실",""]];
var RV_ON=["신청","승인","체크인"];
var RV_CLS={ "신청":"req", "승인":"okc", "체크인":"in", "완료":"done", "노쇼":"no" };
var RV_TAG={ "신청":"warn", "승인":"", "체크인":"", "완료":"ok", "노쇼":"bad", "취소":"off" };
function ibSub(){ var s=S.sub.inbox; return IB_SUBS.some(function(x){ return x[0]===s; })?s:"lounge"; }
SCREENS.inbox={
  title:"처리함", desc:"",
  need:function(){ var s=ibSub();
    return s==="lounge"?[{ k:"resv", a:"resv_list", ttl:20000 }]:s==="cchat"?[{ k:"cc", a:"cchat_list", ttl:20000 },{ k:"ccf", a:"cfg_list", ttl:60000 }]:s==="ck"?[{ k:"inv", a:"inv_state", ttl:30000 },{ k:"ckg", a:"scan_log", p:{ act:"ck_gate", n:300 }, ttl:15000 },{ k:"ckf", a:"fcfs_list", p:{ st:"수령", page:1 }, ttl:15000 },{ k:"cno", a:"ck_no_state", ttl:30000 },{ k:"cnl", a:"ck_no_list", ttl:60000 }]:s==="req"?[{ k:"sreq", a:"sreq_list", p:{ st:"all", n:100 }, ttl:15000 }]:[{ k:"pwl", a:"pw_req_list", ttl:30000 }]; },
  mount:function(vb){
    var s=ibSub();
    el("phCap").textContent={ lounge:"1F AX 라운지 · 사전 신청 · 상담석 x 1시간 칸 배치판", cchat:"18F AX 커피챗 · 희망(회차 · 관심 영역 · 메모) → 선정(회차 · 테이블) → 참석 · 완료", ck:"1F 체크인존 · 키트 · 스태프 옷 · 참여상 지급", req:"스태프 폰 「운영자에게 요청」", pw:"앱 로그인 「PIN 을 잊었어요」 요청" }[s];
    vb.innerHTML='<div class="chips" id="ibChips" role="tablist" aria-label="처리함"></div><div id="ibB"></div>';
    var b=el("ibB");
    if(s==="lounge"&&S.ui.lup&&UP){ upMount(b); return; }
    if(s==="lounge") b.innerHTML='<div class="up-bar"><span class="cap">사전 명단 = 「사번 · 시간 · 상담석」 엑셀</span><button class="btn sm pri" type="button" onclick="lgUpOpen()">명단 올리기</button><button class="btn sm" type="button" onclick="lngUndoAsk()">마지막 올리기 되돌리기</button></div><div id="lgErr"></div><div class="grid gside"><div class="card" style="padding:8px 12px" id="lgBoard"></div><div class="col" id="lgSide"></div></div><div class="card mt"><h2>AX 라운지 신청 명단</h2><div id="lgList"></div></div>';
    else if(s==="cchat") ccMount(b);
    else if(s==="ck") b.innerHTML='<div id="ckTop"></div><div class="grid g4" id="ckK"></div><div class="card mt"><h2>최근 지급 명단 <span class="cap">체크인존에서 찍은 사람 · 줄을 누르면 한 사람 카드</span></h2><div id="ckL"></div></div>'+ckExtraHtml();
    else if(s==="req") b.innerHTML='<div class="card"><h2>스태프 요청</h2><div id="rqList"></div></div>';
    else b.innerHTML='<div class="card"><h2>PIN 분실 요청 <span class="cap">본인 확인(사원증) 뒤 초기화</span></h2><div id="pwList"></div></div>';
  },
  paint:function(){
    var b=S.data.nb, s=ibSub(), c=b&&b.ok?{ lounge:num(b.resv&&b.resv.wait), cchat:num(b.cchat&&b.cchat.wait), req:num(b.sreq&&b.sreq.open), pw:num(b.pw) }:{};
    el("ibChips").innerHTML=IB_SUBS.map(function(x){ return '<button type="button" role="tab" aria-selected="'+(x[0]===s)+'" class="chip'+(x[0]===s?" on":"")+'" onclick="goSub(\''+x[0]+'\')">'+esc(x[1])+(x[2]===null?"":' <span class="c">'+(x[2]?x[2]+" ":"")+(c[x[0]]!=null?n0(c[x[0]]):"-")+'</span>')+'</button>'; }).join("");
    if(s==="lounge"&&S.ui.lup&&UP) return;   /* 명단 올리기 화면은 자기 동작 때만 다시 그린다(5초 갱신이 입력을 지우지 않게) */
    ({ lounge:lgPaint, cchat:ccPaint, ck:function(){ ckPaint(); ckExtraPaint(); }, req:rqPaint, pw:pwPaint })[s]();
  }
};

/* ── AX 라운지 배치판 · 세로 1시간 칸(칸 수 = 설정 값) × 가로 상담석 ── */
function lgCfg(){ var b=S.data.nb, L=b&&b.lounge; return { start:(L&&L.start)||LOUNGE_DEF.start, n:num(L&&L.n)||LOUNGE_DEF.n, seats:num(L&&L.seats)||LOUNGE_DEF.seats, step:num(L&&L.step)||60, srv:!!L }; }
/* 261016 놓기 = 서버 lngPlace_ 와 같은 규칙 · 시간 빈칸 = 칸 미정(none) · 정한 상담석(seat) 먼저 · 나머지 신청 시각 순 · 못 놓으면 칸 밖(out) */
function lgPlace(rows){
  var cf=lgCfg(), s0=mins(cf.start), grid=[], out=[], cx=[], none=[], left=[];
  for(var i=0;i<cf.n;i++){ grid.push([]); for(var j=0;j<cf.seats;j++) grid[i].push(null); }
  rows.slice().sort(function(a,b){ return String(a.ts).localeCompare(String(b.ts)); }).forEach(function(r){
    if(r.status==="취소"){ cx.push(r); return; }
    if(!hm(r.slot)){ none.push(r); return; }
    var m=mins(r.slot), i=Math.floor((m-s0)/cf.step);
    if(m<0||i<0||i>=cf.n){ out.push(r); return; }
    var j=num(r.seat)-1;
    if(j>=0&&j<cf.seats&&!grid[i][j]){ grid[i][j]=r; return; }
    left.push([r,i]);
  });
  left.forEach(function(x){ var j=grid[x[1]].indexOf(null); if(j<0){ out.push(x[0]); return; } grid[x[1]][j]=x[0]; });
  return { cf:cf, grid:grid, out:out, cx:cx, none:none, s0:s0 };
}
var LG={ sel:null, g:null, mv:null };
/* 261016 명단 올리기(upload.js) · 배치판 자리에 열고 · 적용하면 배치판으로 */
function lgUpOpen(){ upOpen(LNG_UP); S.ui.lup=1; render(); el("main").scrollTop=0; }
function lgPaint(){
  var gt=dataGate("resv","AX 라운지 신청");
  if(gt){ el("lgBoard").innerHTML=gt; el("lgSide").innerHTML=""; return; }
  var rows=S.data.resv.rows||[], P=lgPlace(rows), cf=P.cf;
  el("lgErr").innerHTML=errTop("resv");
  var hd='<div class="h"></div>'; for(var j=0;j<cf.seats;j++) hd+='<div class="h">상담석 '+(j+1)+'</div>';
  var cells="";
  P.grid.forEach(function(rw,i){
    var t=m2hm(P.s0+i*cf.step); cells+='<div class="tm">'+t+'</div>';
    rw.forEach(function(r,j){ var key=i+":"+j, sel=LG.sel===key?" sel":"";
      cells+=r?'<button type="button" class="cell '+(RV_CLS[r.status]||"")+sel+'" onclick="lgPick(\''+key+'\')" aria-label="'+esc(t+" 상담석 "+(j+1)+" "+r.name+" "+r.status)+'"><span class="nm">'+esc(r.name||r.emp)+'</span><span class="s">'+esc(r.status)+'</span></button>'
        :'<button type="button" class="cell empty'+sel+'" onclick="lgPick(\''+key+'\')">빈 자리</button>'; });
  });
  var cols='56px'+new Array(cf.seats+1).join(' minmax(0,1fr)');
  el("lgBoard").innerHTML='<div class="legend"><span class="cap">칸 '+cf.n+'개 · '+(cf.srv?"운영 시간 설정":"기본값 "+cf.start+" 부터")+'</span><span><i style="background:var(--warn-bg)"></i>신청</span><span><i style="background:var(--navy05)"></i>승인</span><span><i style="background:var(--navy)"></i>체크인</span><span><i style="background:var(--ok-bg)"></i>완료</span><span><i style="background:var(--bad-bg)"></i>노쇼</span><span><i style="background:#fff;border-style:dashed"></i>빈 자리</span></div>'+
    '<div class="board" style="grid-template-columns:'+cols+'">'+hd+cells+'</div>'+
    (P.none.length?'<div class="band mt" id="lgNone"><span><b>칸 미정 '+P.none.length+'명</b> · 이름을 눌러 칸에 넣습니다</span><span>'+P.none.map(function(r){ return '<button type="button" class="btn sm'+(LG.sel==="n:"+r.id?" pri":"")+'" onclick="lgPick(\'n:'+jq(r.id)+'\')">'+esc(r.name||r.emp)+'</button>'; }).join(" ")+'</span></div>':'')+
    (P.out.length?'<div class="band warn mt">칸 밖 신청 '+P.out.length+'건 · '+esc(P.out.map(function(r){ return hm(r.slot)+" "+(r.name||r.emp); }).join(", "))+'</div>':'')+
    '<div class="cap mt">취소 '+P.cx.length+'건은 아래 명단에'+(cf.srv?"":" · 칸 설정은 서버 갱신 뒤 서버 값")+'</div>';
  LG.P=P; lgSide();
  if(!LG.g) LG.g=XG.make({ id:"lounge", file:"AX 라운지 신청", key:function(r){ return r.id; }, sort:{ k:"slot", d:1 },
    chips:[["all","전체",null],["w","신청",function(r){ return r.status==="신청"; }],["ok","승인",function(r){ return r.status==="승인"; }],["in","체크인",function(r){ return r.status==="체크인"; }],["dn","완료",function(r){ return r.status==="완료"; }],["no","노쇼",function(r){ return r.status==="노쇼"; }],["cx","취소",function(r){ return r.status==="취소"; }]],
    cols:[{ k:"slot", t:"시간", w:70, v:function(r){ return hm(r.slot)||"칸 미정"; } },{ k:"seat", t:"상담석", w:60 },{ k:"name", t:"이름", w:110 },{ k:"emp", t:"사번", w:90 },{ k:"dept", t:"부서", w:130 },{ k:"status", t:"상태", w:80, f:function(r){ return tag(r.status, RV_TAG[r.status]); } },{ k:"memo", t:"메모", w:160 },{ k:"ts", t:"신청 시각", type:"date", w:110 },{ k:"cxAt", t:"취소 시각", type:"date", w:110 }],
    src:{ a:"resv_list", p:{} }, h:360 });
  XG.set(LG.g, rows, el("lgList"));
}
function lgPick(key){ LG.sel=key; LG.mv=null; lgPaint(); }
/* 261016 칸에 넣기 · 다른 시간으로(resv_move · L2) · 칸마다 남은 자리 · 상담석(자동 = 빈 자리 · 1 · 2 = 그 자리에 고정) */
function lgMoveH(r){
  var P=LG.P, cf=P.cf, rows='';
  for(var i=0;i<cf.n;i++){ var t=m2hm(P.s0+i*cf.step), used=P.grid[i].filter(function(x){ return x&&x.id!==r.id&&RV_ON.indexOf(x.status)>=0; }).length, left=cf.seats-used, me=hm(r.slot)===t;   /* 정원 = 신청 · 승인 · 체크인(서버와 같다 · 완료 · 노쇼는 자리를 차지해도 세지 않는다) */
    rows+='<div class="row"><div class="t"><b>'+t+'~'+m2hm(P.s0+i*cf.step+cf.step)+'</b><span>'+(me?"지금 칸":left>0?cf.seats+"자리 중 "+left+"자리 남음":"마감")+'</span></div>'+
      (left>0||me?[0].concat(Array.apply(null,{length:cf.seats}).map(function(_,k){ return k+1; })).map(function(s){ var busy=s&&P.grid[i][s-1]&&P.grid[i][s-1].id!==r.id;   /* 다른 사람이 놓인 자리는 고르지 않는다(서버는 고정 자리만 막지만 놓인 사람이 밀려나지 않게) */ return busy?'':'<button class="btn sm" type="button" onclick="lgMoveAsk(\''+jq(r.id)+'\',\''+t+'\','+s+')">'+(s?"상담석 "+s:"빈 자리")+'</button>'; }).join(" "):'')+'</div>'; }
  return '<div class="card"><h2>'+(hm(r.slot)?"다른 시간으로":"칸에 넣기")+' · '+esc(r.name||r.emp)+'</h2>'+rows+'<div class="btns mt"><button class="btn" type="button" onclick="LG.mv=null;lgPaint()">닫기</button></div></div>';
}
function lgMoveAsk(id, t, seat){
  var r=rvRow(id); if(!r) return;
  var was=hm(r.slot)||"칸 미정";
  confirmBox({ t:hm(r.slot)?"시간을 바꿀까요?":"이 칸에 넣을까요?", who:(r.name||r.emp)+" · "+was+" → "+t+(seat?" · 상담석 "+seat:""), sub:r.status==="승인"?"10분 전 알림이 새 시각으로 바뀝니다":"", ok:hm(r.slot)?"시간 바꾸기":"칸에 넣기",
    run:function(){ return call("resv_move",{ id:id, slot:t, seat:seat?String(seat):null, from:r.status }); },
    fail:function(x){ return x&&x.reason==="taken"?"그 칸은 다 찼습니다":x&&x.reason==="seat"?"그 상담석은 다른 사람 자리입니다":x&&x.reason==="same"?"지금과 같은 자리입니다":x&&x.reason==="state"?"이미 "+(x.cur||"다른 상태")+"입니다 · 목록을 다시 받습니다":""; },
    done:function(x){ r.slot=x&&x.slot||t; r.seat=x&&x.seat?String(x.seat):""; LG.mv=null; LG.sel=null; lgPaint(); reload(["resv"]); toast((r.name||r.emp)+" · "+(x&&x.slot||t)+(seat?" · 상담석 "+seat:"")); } });
}
function lgSide(){
  var P=LG.P, box=el("lgSide"); if(!P) return;
  if(!LG.sel){ var w=null; P.grid.some(function(rw,i){ return rw.some(function(r,j){ if(r&&r.status==="신청"){ w=i+":"+j; return true; } }); }); if(w){ LG.sel=w; return lgPaint(); } }
  if(!LG.sel){ box.innerHTML='<div class="card">'+emptyH("대기 중인 신청이 없습니다")+'<p class="cap">칸을 누르면 여기에 나옵니다</p></div>'+lgNext(); return; }
  if(LG.mv){ var rm=rvRow(LG.mv); if(rm){ box.innerHTML=lgMoveH(rm)+lgNext(); return; } LG.mv=null; }
  if(LG.sel.indexOf("n:")===0){ var rn=rvRow(LG.sel.slice(2)); if(!rn||hm(rn.slot)){ LG.sel=null; return lgPaint(); }
    box.innerHTML='<div class="card"><h2>칸 미정 '+tag(rn.status,RV_TAG[rn.status])+'</h2>'+rowH(rn.name||rn.emp,[rn.dept,"사번 "+rn.emp,rn.memo].filter(Boolean).join(" · "))+'<div class="mt"><button class="btn pri big" type="button" onclick="LG.mv=\''+jq(rn.id)+'\';lgPaint()">칸에 넣기</button></div></div>'+lgNext(); return; }
  var ij=LG.sel.split(":"), i=num(ij[0]), j=num(ij[1]), r=(P.grid[i]||[])[j], t=m2hm(P.s0+i*P.cf.step)+"~"+m2hm(P.s0+i*P.cf.step+P.cf.step);
  if(!r){ box.innerHTML='<div class="card"><h2>'+t+' · 상담석 '+(j+1)+' '+tag("빈 자리","off")+'</h2><p class="cap">칸 미정인 사람은 위 「칸 미정」에서 고르고, 다른 칸 사람은 그 칸을 눌러 「다른 시간으로」로 옮깁니다</p></div>'+lgNext(); return; }
  var st=r.status, A="";
  var b=function(to,lab,cls){ return '<button class="btn '+(cls||"")+'" type="button" onclick="rvAsk(\''+jq(r.id)+'\',\''+to+'\')">'+esc(lab)+'</button>'; };
  if(st==="신청") A='<button class="btn pri big" type="button" onclick="rvAsk(\''+jq(r.id)+'\',\'승인\')">승인 · 알림 보내기</button><div class="btns mt"><button class="btn" type="button" onclick="LG.mv=\''+jq(r.id)+'\';lgPaint()">다른 시간으로</button>'+b("취소","취소","dng")+'</div>';
  else if(st==="승인") A='<button class="btn pri big" type="button" onclick="rvAsk(\''+jq(r.id)+'\',\'체크인\')">체크인</button><div class="btns mt"><button class="btn" type="button" onclick="LG.mv=\''+jq(r.id)+'\';lgPaint()">다른 시간으로</button>'+b("노쇼","노쇼","dng")+b("취소","취소","dng")+'</div>';
  else if(st==="체크인") A='<button class="btn pri big" type="button" onclick="rvAsk(\''+jq(r.id)+'\',\'완료\')">상담 완료</button><div class="btns mt">'+b("승인","체크인 되돌리기")+b("노쇼","노쇼","dng")+'</div>';
  else if(st==="완료") A='<div class="btns">'+b("체크인","완료 되돌리기")+'</div>';
  else if(st==="노쇼") A='<div class="btns">'+b("승인","노쇼 되돌리기")+'</div>';
  box.innerHTML='<div class="card"><h2>'+t+' · 상담석 '+(j+1)+' '+tag(st,RV_TAG[st])+'</h2>'+rowH(r.name||r.emp,[r.dept,"사번 "+r.emp,/^사전 명단/.test(r.memo||"")?"사전 명단":"앱 신청 "+fmtD(r.ts),num(r.seat)?"상담석 고정 "+r.seat:""].filter(Boolean).join(" · "))+
    '<div class="cap mt">메모</div><div class="memo">'+(r.memo?esc(r.memo):'<span class="cap">없음</span>')+'</div><div class="mt">'+A+'</div></div>'+lgNext();
}
function lgNext(){ return '<div class="card"><h2>이어지는 일</h2><p class="cap">사전 명단 = 승인으로 들어옵니다. 체크인(스태프 폰 스캔 또는 여기) → 완료. 체크인은 출석만 남깁니다. 완료하면 스탬프 07 프로그램 참여(라운지 2개)가 붙고, 완료에서 다른 상태로 바꾸면 거둡니다.</p></div>'; }
var RV_FX={ "승인":"참가자 앱에 승인 알림이 갑니다", "체크인":"출석만 · 스탬프는 완료 때", "완료":"완료하면 스탬프 07 프로그램 참여(라운지 2개) · 사은품 대상", "노쇼":"자리는 그대로 · 완료였으면 스탬프를 거둡니다", "취소":"자리가 비고 참가자 앱에 바로 반영됩니다" };
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

/* ── 커피챗 · cchat.js(261016 U4 서버 계약 · 회차 표 · 명단 · 상세 · 마감) ── */

/* ── 체크인존 지급 현황 · ck_gate(스태프 폰 한 번 찍기) ──
 * 숫자 = inv_state kit(givenPre 키트 · givenStaff 스태프 옷 · givenOut 명단 밖 · chk 체크인 기록) · now_board fcfs(참여상 지급 · 남음)
 * 명단 = scan_log act ck_gate(오늘 · 사람마다 마지막 찍은 시각) + inv_list k1 · hum(곳 gate · 무엇을 받았나) + fcfs_list 수령(참여상 · 달성 순번) */
var CKG={ g:null };
function ckGive(){ var m={}, put=function(L,id){ if(!L||L==="busy"||!L.ok) return; (L.rows||[]).forEach(function(r){ if(r.place!=="gate"||r.v||!r.emp) return; var o=m[r.emp]||(m[r.emp]={});
    if(id==="hum"&&r.k==="give") o.kit="가습기 대체"; else if(r.k==="give") o.kit=/^스태프 의류/.test(r.why||"")?"스태프 옷":"키트"; else if(r.k==="chk"&&!o.kit) o.kit="명단 밖"; }); };
  put(IV.list.k1,"k1"); put(IV.list.hum,"hum"); return m; }
function ckRows(){
  var d=S.data.ckg; if(!d||!d.ok) return null;
  var gv=ckGive(), f=S.data.ckf, fx={}, by={}, out=[];
  if(f&&f.ok) (f.rows||[]).forEach(function(r){ fx[normE(r.emp)]=r; });
  (d.rows||[]).forEach(function(r){ var e=normE(r.emp); if(!e) return; var o=by[e]; if(!o){ o=by[e]={ emp:e, name:r.name||"", t:r.t, by:r.byName||r.by||"", n:0 }; out.push(o); } o.n++; if(r.t>o.t){ o.t=r.t; o.by=r.byName||r.by||""; } });
  out.forEach(function(o){ var k=gv[o.emp], x=fx[o.emp]; o.kit=k&&k.kit||""; o.fx=x?x.rk:0; o.fxAt=x?x.gotAt:""; });
  return out;
}
function ckPaint(){
  var iv=S.data.inv, kit=iv&&iv.ok?iv.kit||{}:null, b=S.data.nb, fx=b&&b.ok?b.fcfs||{}:{}, d=S.data.ckg;
  ivListLoad("k1"); ivListLoad("hum");
  el("ckTop").innerHTML=errTop("inv")+errTop("ckg");
  var ppl=d&&d.ok?ckRows():null;
  el("ckK").innerHTML=kit?kpi({ l:"키트 지급", v:n0(kit.givenPre), u:"명", s:"사전 신청 "+n0(kit.pre)+"명 중" })+
    kpi({ l:"스태프 옷 지급", v:kit.givenStaff==null?"-":n0(kit.givenStaff), u:kit.givenStaff==null?"":"명", s:kit.givenStaff==null?"서버 갱신 뒤":"스태프 의류 명단" })+
    kpi({ l:"참여상 지급", v:n0(fx.got), u:"명", s:"남음 "+n0(fx.left)+" / "+n0(fx.cap)+" · 17:00 마감"+(fx.on?"":" · 꺼짐") })+
    kpi({ l:"찍은 사람", v:ppl?n0(ppl.length):"-", u:"명", s:"명단 밖 "+n0(kit.givenOut)+" · 체크인 기록 "+n0(kit.chk)+"명" }):'<div style="grid-column:1/-1">'+(dataGate("inv","체크인존 지급")||skel())+'</div>';
  if(!CKG.g) CKG.g=XG.make({ id:"ckgate", file:"체크인존 지급 명단", key:function(r){ return r.emp; }, sort:{ k:"t", d:-1 },
    chips:[["all","전체",null],["kit","키트",function(r){ return r.kit==="키트"||r.kit==="가습기 대체"; }],["staff","스태프 옷",function(r){ return r.kit==="스태프 옷"; }],["fx","참여상",function(r){ return !!r.fxAt; }],["out","명단 밖",function(r){ return r.kit==="명단 밖"||!r.kit; }]],
    cols:[{ k:"t", t:"마지막 찍음", type:"date", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"name", t:"이름", w:90 },
      { k:"kit", t:"키트 · 옷", w:110, v:function(r){ return r.kit||"없음"; }, f:function(r){ return r.kit==="명단 밖"||!r.kit?tag(r.kit||"없음","off"):tag(r.kit,"ok"); } },
      { k:"fx", t:"참여상", w:120, v:function(r){ return r.fxAt?"받음 · "+r.fx+"번째":""; }, f:function(r){ return r.fxAt?tag("받음 "+hm(r.fxAt),"ok")+' <span class="cap">'+n0(r.fx)+'번째</span>':'<span class="cap">-</span>'; } },
      { k:"n", t:"찍은 수", type:"num", w:70 },{ k:"by", t:"스태프", w:100 }],
    src:{ a:"scan_log", p:{ act:"ck_gate", n:300 }, pick:function(){ return ckRows()||[]; } }, empty:"아직 체크인존에서 찍은 사람이 없습니다", h:420, onRow:function(k){ pcOpen(k, CKG.g); } });
  var gt=dataGate("ckg","체크인존 명단"); CKG.g.gate=gt||"";
  XG.set(CKG.g, gt?null:ppl, el("ckL"));
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
