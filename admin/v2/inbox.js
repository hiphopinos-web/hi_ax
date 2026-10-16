/* AXF CONTROL v2 · S2 처리함 (261016)
 * 칩 = 체크인존(지급 현황) · 스태프 요청 · PIN 분실. 한 건씩 처리하고 처리한 줄만 고친다.
 * 261016 밤 AX 라운지 · 커피챗 칩은 미팅 탭(meet.js)으로 옮김 · 이 파일에는 라운지 명단 부품(명단 올리기 · 명단 표 · 상태 바꾸기)만 남긴다
 * 승인 · 체크인 · 선정 = L2(확인 창, PIN 없음) · 요청 닫기 · 잘못된 PIN 요청 닫기 = L1(바로 · 토스트)
 * 261016 체크인존 = 스태프 폰 한 번 찍기(ck_gate · 키트 · 스태프 옷 · 선착순 참여상) · 창구 A~D · 번호표 · 창구 대기는 걷음(서버 ck_ticket · ck_next 는 쓰지 않음)
 * 261016 콘솔 동작에는 PIN 을 묻지 않는다(「PIN 분실」은 참가자 앱 PIN 요청 처리) */
var IB_SUBS=[["ck","체크인존",null],["req","스태프 요청",""],["pw","PIN 분실",""]];
var RV_ON=["신청","승인","체크인"];
var RV_CLS={ "신청":"req", "승인":"okc", "체크인":"in", "완료":"done", "노쇼":"no" };
var RV_TAG={ "신청":"warn", "승인":"", "체크인":"", "완료":"ok", "노쇼":"bad", "취소":"off" };
function ibSub(){ var s=S.sub.inbox; return IB_SUBS.some(function(x){ return x[0]===s; })?s:"ck"; }
SCREENS.inbox={
  title:"처리함", desc:"",
  need:function(){ var s=ibSub();
    return s==="ck"?[{ k:"inv", a:"inv_state", ttl:30000 },{ k:"ckg", a:"scan_log", p:{ act:"ck_gate", n:300 }, ttl:15000 },{ k:"ckf", a:"fcfs_list", p:{ st:"수령", page:1 }, ttl:15000 },{ k:"cno", a:"ck_no_state", ttl:30000 },{ k:"cnl", a:"ck_no_list", ttl:60000 }]:s==="req"?[{ k:"sreq", a:"sreq_list", p:{ st:"all", n:100 }, ttl:15000 }]:[{ k:"pwl", a:"pw_req_list", ttl:30000 }]; },
  mount:function(vb){
    var s=ibSub();
    el("phCap").textContent={ ck:"1F 체크인존 · 키트 · 스태프 옷 · 참여상 지급", req:"스태프 폰 「운영자에게 요청」", pw:"앱 로그인 「PIN 을 잊었어요」 요청" }[s];
    vb.innerHTML='<div class="chips" id="ibChips" role="tablist" aria-label="처리함"></div><div id="ibB"></div>';
    var b=el("ibB");
    if(s==="ck") b.innerHTML='<div id="ckTop"></div><div class="grid g4" id="ckK"></div><div class="card mt"><h2>최근 지급 명단 <span class="cap">체크인존에서 찍은 사람 · 줄을 누르면 한 사람 카드</span></h2><div id="ckL"></div></div>'+ckExtraHtml();
    else if(s==="req") b.innerHTML='<div class="card"><h2>스태프 요청</h2><div id="rqList"></div></div>';
    else b.innerHTML='<div class="card"><h2>PIN 분실 요청 <span class="cap">본인 확인(사원증) 뒤 초기화</span></h2><div id="pwList"></div></div>';
  },
  paint:function(){
    var b=S.data.nb, s=ibSub(), c=b&&b.ok?{ req:num(b.sreq&&b.sreq.open), pw:num(b.pw) }:{};
    el("ibChips").innerHTML=IB_SUBS.map(function(x){ return '<button type="button" role="tab" aria-selected="'+(x[0]===s)+'" class="chip'+(x[0]===s?" on":"")+'" onclick="goSub(\''+x[0]+'\')">'+esc(x[1])+(x[2]===null?"":' <span class="c">'+(x[2]?x[2]+" ":"")+(c[x[0]]!=null?n0(c[x[0]]):"-")+'</span>')+'</button>'; }).join("");
    ({ ck:function(){ ckPaint(); ckExtraPaint(); }, req:rqPaint, pw:pwPaint })[s]();
  }
};

/* ── AX 라운지 명단 부품 · 미팅 탭 › 1F AX 라운지 › 명단(meet.js) · lgPlace = 추가 창(lngrow.js)의 칸별 남은 자리 셈 ── */
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
/* 261016 명단 올리기(upload.js) · 명단 자리에 열고 · 적용하면 명단으로 */
function lgUpOpen(){ upOpen(LNG_UP); S.ui.lup=1; render(); el("main").scrollTop=0; }
/* 미팅 탭 라운지 명단 틀 · 올리기 단추 · 명단 표 */
function lgShell(b){
  if(S.ui.lup&&UP){ upMount(b); return; }
  b.innerHTML='<div class="up-bar"><span class="cap">사전 명단 = 「사번 · 시간 · 미팅룸」 엑셀</span><button class="btn sm pri" type="button" onclick="lgUpOpen()">명단 올리기</button><button class="btn sm" type="button" onclick="lngUndoAsk()">마지막 올리기 되돌리기</button></div><div id="lgErr"></div><div class="card"><h2>AX 라운지 사전 명단 <span class="cap">줄을 누르면 사람 상세</span></h2><div id="lgList"></div></div>';
}
function lgPaint(){
  if(S.ui.lup&&UP) return;   /* 명단 올리기 화면은 자기 동작 때만 다시 그린다(5초 갱신이 입력을 지우지 않게) */
  var box=el("lgList"); if(!box) return;
  var gt=dataGate("resv","AX 라운지 신청");
  if(gt){ box.innerHTML=gt; return; }
  var rows=S.data.resv.rows||[]; LG.P=lgPlace(rows);
  el("lgErr").innerHTML=errTop("resv");
  if(!LG.g) LG.g=XG.make({ id:"lounge", file:"AX 라운지 신청", key:function(r){ return r.id; }, sort:{ k:"slot", d:1 },
    onRow:function(k){ var r=rvRow(k); if(r&&typeof mtOpen==="function") mtOpen("ln", k, LG.g); },
    chips:[["all","전체",null],["none","칸 미정",function(r){ return r.status!=="취소"&&!hm(r.slot); }],["in","왔음",function(r){ return r.status==="체크인"; }],["dn","끝",function(r){ return r.status==="완료"; }],["no","노쇼",function(r){ return r.status==="노쇼"; }],["cx","취소",function(r){ return r.status==="취소"; }]],
    cols:[{ k:"slot", t:"시간", w:70, v:function(r){ return hm(r.slot)||"칸 미정"; } },{ k:"seat", t:"미팅룸", w:60 },{ k:"name", t:"이름", w:110 },{ k:"emp", t:"사번", w:90 },{ k:"dept", t:"부서", w:130 },{ k:"status", t:"상태", w:80, v:lnView, f:function(r){ return tag(lnView(r), RV_TAG[r.status]); } },
      { k:"mm", t:"운영 메모", w:160, v:function(r){ var n=typeof mtNote==="function"?mtNote("ln",r.emp):null; return n&&n.memo?String(n.memo).slice(0,20):""; } },{ k:"memo", t:"명단 표지", w:150 },{ k:"ts", t:"신청 시각", type:"date", w:110 },{ k:"cxAt", t:"취소 시각", type:"date", w:110 }],
    src:{ a:"resv_list", p:{} }, h:520, select:1, onAdd:function(){ paOpen(laSp()); }, cancel:laCx() });
  XG.set(LG.g, rows, box);
}
/* 화면 상태 이름 · 신청 · 승인 단계는 쓰지 않는다(사용자 261016 밤) · 없음 · 왔음 · 끝 · 노쇼 · 취소 */
function lnView(r){ var s=r.status||r.st; return s==="체크인"?"왔음":s==="완료"?"끝":s==="노쇼"?"노쇼":s==="취소"?"취소":"배정"; }
var RV_FX={ "승인":"참가자 앱에 승인 알림이 갑니다", "체크인":"출석만 · 스탬프는 완료 때", "완료":"완료하면 스탬프 07 프로그램 참여(라운지 2개) · 사은품 대상", "노쇼":"자리는 그대로 · 완료였으면 스탬프를 거둡니다", "취소":"자리가 비고 참가자 앱에 바로 반영됩니다" };
function rvRow(id){ var d=S.data.resv; return d&&d.rows?d.rows.filter(function(x){ return x.id===id; })[0]:null; }
function rvAsk(id, to){
  var r=rvRow(id); if(!r) return;
  var from=r.status, lab={ "승인":from==="신청"?"승인 · 알림 보내기":"되돌리기", "체크인":from==="승인"?"체크인":"되돌리기", "완료":"상담 완료", "노쇼":"노쇼 처리", "취소":"취소 처리" }[to];
  var q={ "승인":from==="신청"?"상담을 승인할까요?":"승인 상태로 되돌릴까요?", "체크인":from==="승인"?"체크인할까요?":"체크인 상태로 되돌릴까요?", "완료":"상담을 완료할까요?", "노쇼":"노쇼로 바꿀까요?", "취소":"신청을 취소할까요?" }[to];
  confirmBox({ t:q, who:personLine(r)+" · "+hm(r.slot)+" · "+from+" → "+to, sub:RV_FX[to], ok:lab, danger:to==="노쇼"||to==="취소",
    run:function(){ return call("resv_set",{ id:id, status:to, from:from }); },
    fail:function(x){ return x&&x.reason==="state"?"이미 "+(x.cur||"다른 상태")+"입니다 · 목록을 다시 받습니다":""; },
    done:function(x){ r.status=to; paint(); if(typeof mtDetRe==="function") mtDetRe(); reload(["resv","lgb","nb"]); toast((r.name||r.emp)+" · "+to+(x&&x.stamp&&x.stamp.ok?" · 스탬프":""),{ undo:function(){ rvUndo(id, to, from); } }); } });
}
function rvUndo(id, cur, back){
  call("resv_set",{ id:id, status:back, from:cur }).then(function(x){ var r=rvRow(id); if(x&&x.ok){ if(r) r.status=back; paint(); toast("되돌렸습니다 · "+lnView({ status:back })); } else toast("되돌리지 못했습니다 · "+why(x),{ bad:1 }); reload(["resv","lgb"]); });
}

/* ── 커피챗 · cchat.js 부품 · 화면 = 미팅 탭(meet.js) ── */

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
  if(!PW.g) PW.g=XG.make({ id:"pw", file:"PIN 분실 요청", whoCheck:1, key:function(r){ return String(r.row); }, sort:{ k:"ts", d:-1 },
    chips:[["w","기다림",function(r){ return r.status==="대기"; }],["d","처리함",function(r){ return r.status!=="대기"; }],["all","전체",null]],
    cols:[{ k:"ts", t:"요청 시각", type:"date", w:100 },{ k:"name", t:"이름", w:110 },{ k:"emp", t:"사번", w:90 },{ k:"status", t:"상태", w:80, f:function(r){ return tag(r.status, r.status==="대기"?"warn":"off"); } },{ k:"pwSet", t:"PIN 있음", w:80, v:function(r){ return r.pwSet?"있음":r.joined?"없음":"가입 전"; } },{ k:"doneAt", t:"처리 시각", type:"date", w:100 },
      { t:"", w:250, act:function(r){ if(r.status!=="대기") return '<span class="cap">'+esc(r.by||"")+'</span>'; return '<button class="btn sm pri" type="button" onclick="pwDo('+num(r.row)+')">PIN 초기화하고 처리</button> <button class="btn sm" type="button" onclick="pwCancel('+num(r.row)+')">잘못된 요청</button>'; } }],
    src:{ a:"pw_req_list", p:{} }, empty:"요청이 없습니다", h:420 });
  var gt=dataGate("pwl","PIN 분실 요청"); PW.g.gate=gt||""; XG.set(PW.g, gt?null:(S.data.pwl.rows||[]), el("pwList"));
}
function pwRow(row){ var d=S.data.pwl; return d&&d.rows?d.rows.filter(function(x){ return num(x.row)===row; })[0]:null; }
function pwDo(row){
  var r=pwRow(row); if(!r) return;
  confirmBox({ t:"PIN 을 초기화할까요?", who:personLine(r), sub:"본인 확인 뒤 · 다음 로그인에 넣는 4자리가 새 PIN · 되돌릴 수 없음", ok:"초기화하고 처리", danger:true,
    run:function(pp){ return call("pw_req_done",Object.assign({ row:row, by:"콘솔 "+((S.me&&S.me.emp)||aemp()) },pp)); },
    done:function(){ r.status="처리"; pwPaint(); reload(["pwl","pwc","nb"]); toast("PIN 을 초기화했습니다 · "+(r.name||r.emp)); } });
}
function pwCancel(row){
  var r=pwRow(row); if(!r) return;
  call("pw_req_cancel",{ row:row, by:"콘솔 "+((S.me&&S.me.emp)||aemp()) }).then(function(x){ if(x&&x.ok){ r.status="취소"; pwPaint(); reload(["pwl","pwc"]); toast("요청을 닫았습니다 · PIN 은 그대로"); } else toast("닫지 못했습니다 · "+why(x),{ bad:1 }); });
}
