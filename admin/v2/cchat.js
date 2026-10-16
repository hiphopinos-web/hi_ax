/* AXF CONTROL v2 · 처리함 › 커피챗 (261016 · 서버 U4 커피챗 계약 · 지문 8d4cdf355b73 이후)
 * 회차 표(정원 · 선정 · 참석 · 희망) → 신청 명단(공통 명단 표 XG · 전체 폭) → 줄을 누르면 오른쪽에서 상세 서랍(메모 전문 · 선정 · 참석 · 완료 · 취소)
 * 서버: cchat_list(행 pref 희망 회차 · text 상담하고 싶은 내용 전문 · ideaId 경로 cchat 아이디어 · overAt 미선정 알림 시각)
 *       cchat_set · cchat_status(정원 넘으면 { ok:true, warn:"full", round, n, cap } · 막지 않는다) · cchat_close(남은 희망 전원 미선정 알림 · { n, sent })
 *       cfg_list 의 커피챗_회차(쉼표) · 커피챗_회차정원(기본 4) · 없으면 아래 기본값
 * 아이디어: 신청 글이 신청 순간 아이디어 시트(경로 cchat)에 한 줄로 들어간다(서버 · p5 도 그때) · 콘솔 「승인」 액션은 서버에 없어 연결 여부만 보인다
 * 모든 쓰기 = 확인 창(L2 · 261016 PIN 없음) · 처리한 줄만 고친다 */
var CC_ROUNDS=["13:00","13:30","14:00","14:30","15:00","15:30"], CC_TABLES=["A","B","C","D","E","F"], CC_CAP_DEF=4;
var CC={ g:null, sel:null };
var CC_ON=["매칭","참석","완료"];
function ccCfg(){
  var d=S.data.ccf, rows=d&&d.ok&&d.rows||[], v=function(k){ var r=rows.filter(function(x){ return x.k===k; })[0]; return r?String(r.v==null?"":r.v):null; };
  var rs=v("커피챗_회차"), cp=v("커피챗_회차정원"), seen={};
  var rounds=rs==null?CC_ROUNDS:rs.split(/[\s,·]+/).map(hm).filter(function(x){ if(!x||seen[x]) return false; seen[x]=1; return true; }).sort();
  var cap=parseInt(cp,10);
  return { rounds:rounds.length?rounds:CC_ROUNDS, cap:cap>=1&&cap<=50?cap:CC_CAP_DEF, srv:rs!=null||cp!=null };
}
function ccRows(){ var d=S.data.cc; return d&&d.ok&&d.rows||[]; }
function ccSt(s){ return s==="대기"?"희망":s==="매칭"?"선정":s; }
/* 화면 상태 · 대기인데 미선정 알림을 받았으면 「미선정」 */
function ccView(r){ return r.status==="대기"&&r.overAt?"미선정":ccSt(r.status); }
function ccTagH(r){ var s=ccView(r); return tag(s, s==="희망"?"warn":s==="참석"||s==="완료"?"ok":s==="취소"||s==="미선정"?"off":""); }
function ccPrefTx(r){ return r.pref?String(r.pref).split(",").map(hm).filter(Boolean).join(" · "):(r.text?"언제든":"-"); }
function ccRow(e){ return ccRows().filter(function(x){ return jq(x.emp)===e; })[0]||null; }
/* 회차마다 선정(매칭 · 참석 · 완료) · 참석(참석 · 완료) · 희망(대기 · 미선정 알림 전 · 그 회차를 골랐거나 언제든) */
function ccCount(rows, rounds){
  var c={}, any=0, wait=0, over=0; rounds.forEach(function(t){ c[t]={ on:0, att:0, want:0 }; });
  rows.forEach(function(r){ var t=hm(r.round);
    if(CC_ON.indexOf(r.status)>=0&&c[t]){ c[t].on++; if(r.status!=="매칭") c[t].att++; }
    if(r.status==="대기"){ if(r.overAt){ over++; return; } wait++;
      var p=r.pref?String(r.pref).split(",").map(hm).filter(Boolean):[];
      if(!p.length) any++; else p.forEach(function(h){ if(c[h]) c[h].want++; }); } });
  return { c:c, any:any, wait:wait, over:over };
}

function ccMount(b){
  CC.sel=null;
  b.innerHTML='<div class="up-bar"><span class="cap" id="ccTop"></span><button class="btn sm dng" type="button" id="ccEnd" onclick="ccClose()">희망 접수 마감 · 미선정 알림</button></div>'+
    '<div id="ccErr"></div><div class="card"><h2>회차 <span class="cap" id="ccCapTx"></span></h2><div id="ccRounds"></div></div>'+
    '<div class="card mt"><h2>신청 명단 <span class="cap">줄을 누르면 상세</span></h2><div id="ccList"></div></div>'+
    '<aside class="cc-drawer" id="ccDet" aria-label="커피챗 신청 상세" aria-hidden="true"></aside>';
}
function ccPaint(){
  var gt=dataGate("cc","커피챗 명단"), cf=ccCfg(), rows=gt?[]:ccRows(), K=ccCount(rows, cf.rounds);
  el("ccErr").innerHTML=gt?"":errTop("cc");
  el("ccCapTx").textContent="정원 "+cf.cap+"명"+(cf.srv?"":" · 기본값(설정을 받지 못함)")+" · 선정 = 선정 · 참석 · 완료";
  el("ccTop").textContent=gt?"":"희망 "+n0(K.wait)+"명 · 미선정 알림 "+n0(K.over)+"명";
  var end=el("ccEnd"); if(end) end.setAttribute("aria-disabled", !gt&&K.wait?"false":"true");
  el("ccRounds").innerHTML=gt?gt:'<table class="tb cc-rt"><thead><tr><th scope="col"></th>'+cf.rounds.map(function(t){ return '<th scope="col" class="n">'+t+'</th>'; }).join("")+'<th scope="col" class="n">언제든</th></tr></thead><tbody>'+
    '<tr><th scope="row">선정 / 정원</th>'+cf.rounds.map(function(t){ var n=K.c[t].on, o=n>cf.cap;
      return '<td class="n'+(o?" cc-over":"")+'"><b>'+n0(n)+'</b> / '+cf.cap+(o?' '+tag("넘침 "+(n-cf.cap),"warn"):n===cf.cap?' '+tag("가득","off"):"")+'</td>'; }).join("")+'<td class="n">-</td></tr>'+
    '<tr><th scope="row">참석 · 완료</th>'+cf.rounds.map(function(t){ return '<td class="n">'+n0(K.c[t].att)+'</td>'; }).join("")+'<td class="n">-</td></tr>'+
    '<tr><th scope="row">희망</th>'+cf.rounds.map(function(t){ return '<td class="n">'+n0(K.c[t].want)+'</td>'; }).join("")+'<td class="n">'+n0(K.any)+'</td></tr></tbody></table>';
  if(!CC.g) CC.g=XG.make({ id:"cchat2", file:"18F 커피챗", key:function(r){ return jq(r.emp); }, sort:{ k:"ts", d:1 }, find:["emp","text"],
    onRow:function(k){ CC.sel=k; ccDet(); },
    chips:[["all","전체",null],["w","희망",function(r){ return r.status==="대기"&&!r.overAt; }],["m","선정",function(r){ return r.status==="매칭"; }],["in","참석 · 완료",function(r){ return r.status==="참석"||r.status==="완료"; }],["ov","미선정",function(r){ return r.status==="대기"&&!!r.overAt; }],["cx","취소",function(r){ return r.status==="취소"; }]],
    cols:[{ k:"ts", t:"신청", type:"date", w:96 },{ k:"name", t:"이름", w:76 },{ k:"emp", t:"사번", w:76 },{ k:"dept", t:"부서", w:110 },
      { k:"pref", t:"희망 회차", w:100, v:ccPrefTx },
      { k:"text", t:"관심 영역 · 메모", v:function(r){ return r.text||r.tag||""; } },
      { k:"st", t:"상태", w:72, v:ccView, f:ccTagH },
      { k:"round", t:"자리", w:84, v:function(r){ return CC_ON.indexOf(r.status)>=0&&r.round?hm(r.round)+" "+(r.table||""):""; } },
      { k:"ideaId", t:"아이디어", w:72, v:function(r){ return r.ideaId?"연결":""; }, f:function(r){ return r.ideaId?tag("연결","ok"):'<span class="cap">-</span>'; } }],
    src:{ a:"cchat_list", p:{} }, h:420 });
  CC.g.gate=gt||""; XG.set(CC.g, gt?null:rows, el("ccList"));
  ccDet();
}
/* 오른쪽 상세 · 고른 줄이 없으면 닫는다 */
function ccDet(){
  var box=el("ccDet"); if(!box) return;
  var r=CC.sel?ccRow(CC.sel):null;
  if(!r){ CC.sel=null; box.classList.remove("on"); box.setAttribute("aria-hidden","true"); if(CC.g&&CC.g.sel!=null){ CC.g.sel=null; XG.paint(CC.g); } return; }
  if(CC.g&&CC.g.sel!==CC.sel){ CC.g.sel=CC.sel; XG.paint(CC.g); }
  box.classList.add("on"); box.setAttribute("aria-hidden","false");
  var e=jq(r.emp), st=r.status, A="";
  var b=function(to,lab,cls){ return '<button class="btn '+(cls||"")+'" type="button" onclick="ccSet(\''+e+'\',\''+to+'\')">'+esc(lab)+'</button>'; };
  if(st==="대기") A='<button class="btn pri big" type="button" onclick="ccPick(\''+e+'\')">선정 · 알림 보내기</button><div class="btns mt">'+b("취소","신청 취소","dng")+'</div>';
  else if(st==="매칭") A='<button class="btn pri big" type="button" onclick="ccSet(\''+e+'\',\'참석\')">참석</button><div class="btns mt"><button class="btn" type="button" onclick="ccPick(\''+e+'\')">회차 · 테이블 바꾸기</button>'+b("대기","선정 취소")+b("취소","신청 취소","dng")+'</div>';
  else if(st==="참석") A='<button class="btn pri big" type="button" onclick="ccSet(\''+e+'\',\'완료\')">상담 완료</button><div class="btns mt">'+b("매칭","참석 취소","dng")+'</div>';
  else if(st==="완료") A='<div class="btns">'+b("참석","완료 되돌리기")+'</div>';
  else if(st==="취소") A='<div class="btns">'+b("대기","신청 되살리기")+'</div>';
  var idea='<div class="row"><div class="t"><b>아이디어 한 줄 '+(r.ideaId?tag("연결","ok"):tag("없음","off"))+'</b><span>'+(r.ideaId?"신청 글이 아이디어 한 줄(경로 커피챗)로 들어가 있습니다<br>ID "+esc(r.ideaId):"글 없이 신청한 줄(옛 앱)")+'</span></div></div>';
  box.innerHTML='<div class="card"><h2>'+esc(r.name||r.emp)+' '+ccTagH(r)+'<span class="r"><button class="btn sm" type="button" onclick="ccDetClose()" aria-label="상세 닫기">닫기</button></span></h2>'+
    '<div class="cap">'+esc([r.dept,"사번 "+r.emp,"신청 "+fmtD(r.ts)].filter(Boolean).join(" · "))+'</div>'+
    '<dl class="cc-kv"><dt>희망 회차</dt><dd>'+esc(ccPrefTx(r))+'</dd>'+
    (CC_ON.indexOf(st)>=0?'<dt>자리</dt><dd><b>'+esc(hm(r.round))+' · 테이블 '+esc(r.table||"-")+'</b></dd>':'')+
    (r.overAt?'<dt>미선정 알림</dt><dd>'+esc(fmtD(r.overAt))+'</dd>':'')+
    (st==="취소"&&r.cxAt?'<dt>취소</dt><dd>'+esc(fmtD(r.cxAt)+" · "+(r.cxBy||"")+(r.cxSeat?" · "+r.cxSeat:""))+'</dd>':'')+'</dl>'+
    '<div class="fld cc-fld">관심 영역 · 메모</div><div class="memo cc-memo">'+(r.text?esc(r.text):'<span class="cap">'+esc(r.tag?"관심 "+r.tag+" · 글 없음(옛 앱 신청)":"글 없음")+'</span>')+'</div>'+
    '<div class="mt">'+A+'</div><div class="mt">'+idea+'</div></div>';
}
function ccDetClose(){ CC.sel=null; ccDet(); }
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&!DLG.o&&CC.sel&&el("ccDet")){ CC.sel=null; ccDet(); } });

/* 선정 · 회차 바꾸기 · 회차 칩에 지금 선정 수 · 정원을 넘기는 회차를 고르면 창에 경고 */
var CCP={ round:"", table:"", emp:"" };
function ccPick(e){
  var r=ccRow(e); if(!r) return; var cf=ccCfg(), K=ccCount(ccRows(), cf.rounds), wasM=r.status==="매칭";
  CCP.emp=e; CCP.round=wasM?hm(r.round):""; CCP.table=wasM?(r.table||""):"";
  var want=r.pref?String(r.pref).split(",").map(hm):[];
  var rchip=function(t){ var n=K.c[t]?K.c[t].on:0, mine=wasM&&hm(r.round)===t?1:0, full=n-mine>=cf.cap;
    return '<button type="button" class="chip'+(full?" st-warn":"")+(CCP.round===t?" on":"")+'" data-round="'+t+'" onclick="ccChoose(\'round\',\''+t+'\')">'+t+' <span class="c">'+n0(n)+'/'+cf.cap+'</span>'+(want.indexOf(t)>=0?' <span class="c">희망</span>':'')+'</button>'; };
  var tchip=function(v){ return '<button type="button" class="chip'+(CCP.table===v?" on":"")+'" data-table="'+v+'" onclick="ccChoose(\'table\',\''+v+'\')">'+v+'</button>'; };
  confirmBox({ t:wasM?"커피챗 회차 · 테이블을 바꿀까요?":"커피챗 자리를 정할까요?", who:(r.name||r.emp)+" · "+(r.dept||""), sub:"희망 "+ccPrefTx(r)+" · "+(wasM?"바꾸면 참가자 앱에 변경 알림이 갑니다":"선정하면 참가자 앱에 알림이 갑니다"),
    body:'<div class="fld">회차 <span class="cap">선정 / 정원</span></div><div class="chips">'+cf.rounds.map(rchip).join("")+'</div><div class="fld">테이블</div><div class="chips">'+CC_TABLES.map(tchip).join("")+'</div><div id="ccWarn"></div>',
    ok:wasM?"바꾸기 · 알림 보내기":"선정 · 알림 보내기", gate:function(){ return !!(CCP.round&&CCP.table)&&!(wasM&&CCP.round===hm(r.round)&&CCP.table===r.table); },
    fail:function(x){ return x&&(x.reason==="round"||x.reason==="notable")?"회차 · 테이블 값이 맞지 않습니다":x&&x.reason==="state"?"다른 사람이 먼저 처리했습니다 · 지금 "+ccSt(x.cur||""):""; },
    run:function(){ var p={ emp:r.emp, round:CCP.round, table:CCP.table, from:r.status }; if(ccFullOf(r, CCP.round)) p.over="1"; return call("cchat_set",p); },
    done:function(x){ var prev=r.status, pr=r.round, pt=r.table; r.status="매칭"; r.round=CCP.round; r.table=CCP.table; CC.sel=e; ccPaint(); reload(["cc"]);
      toast((r.name||r.emp)+" · "+CCP.round+" "+CCP.table+" 선정"+(x&&x.warn==="full"?" · 정원 넘침 "+n0(x.n)+"/"+n0(x.cap):""),{ bad:x&&x.warn==="full"?1:0, undo:function(){ if(prev==="매칭") ccMoveBack(e, pr, pt); else ccSet(e, prev, 1); } }); } });
}
/* 이 사람을 그 회차에 넣으면 정원을 넘는가 · { n 넣은 뒤 인원, cap } 또는 null(서버 cchatFull_ 과 같은 셈) */
function ccFullOf(r, t){ var cf=ccCfg(), n=1; ccRows().forEach(function(x){ if(x!==r&&CC_ON.indexOf(x.status)>=0&&hm(x.round)===t) n++; }); return n>cf.cap?{ n:n, cap:cf.cap }:null; }
function ccChoose(k, v){
  CCP[k]=v; [].forEach.call(document.querySelectorAll("#dlgCard [data-"+k+"]"),function(b){ b.classList.toggle("on", b.getAttribute("data-"+k)===v); });
  var w=el("ccWarn"), who=ccRow(CCP.emp); if(!w) return gateUpd();
  var f=CCP.round&&who?ccFullOf(who, CCP.round):null;
  w.innerHTML=f?band("warn","<b>"+esc(CCP.round)+" 정원 "+f.cap+"명</b> · 넣으면 "+f.n+"명 · 정원을 넘겨 선정합니다"):"";
  var ok=el("dlgOk"); if(ok&&DLG.o&&!DLG.busy) ok.textContent=f?"정원 넘겨 선정 · 알림":DLG.o.ok;
  gateUpd();
}
function ccMoveBack(e, round, table){
  var r=ccRow(e); if(!r) return;
  call("cchat_set",{ emp:r.emp, round:hm(round), table:table, from:"매칭" }).then(function(x){ if(x&&x.ok){ r.round=hm(round); r.table=table; ccPaint(); toast("되돌렸습니다 · "+hm(round)+" "+table); } else toast("되돌리지 못했습니다 · "+why(x),{ bad:1 }); reload(["cc"]); });
}
function ccSet(e, to, quiet){
  var r=ccRow(e); if(!r) return; var from=r.status;
  var run=function(){ return call("cchat_status",{ emp:r.emp, status:to, from:from }); };
  var after=function(x){ r.status=to; if(to==="대기"){ r.round=""; r.table=""; if(from==="취소"){ r.overAt=""; } } ccPaint(); reload(["cc"]); return x&&x.warn==="full"?" · 정원 넘침 "+n0(x.n)+"/"+n0(x.cap):""; };
  if(quiet){ run().then(function(x){ if(x&&x.ok){ var w=after(x); toast("되돌렸습니다"+w,{ bad:w?1:0 }); } else toast("되돌리지 못했습니다 · "+why(x),{ bad:1 }); }); return; }
  var T={ "참석":"참석으로 바꿀까요?", "완료":"상담 완료로 바꿀까요?", "대기":from==="취소"?"신청을 되살릴까요?":"선정을 취소할까요?", "매칭":"참석을 취소할까요?", "취소":"커피챗 신청을 취소할까요?" };
  var O={ "참석":"참석", "완료":"상담 완료", "대기":from==="취소"?"되살리기":"선정 취소", "매칭":"참석 취소", "취소":"신청 취소" };
  var SUB={ "참석":"참석 확인 스탬프 1개가 붙습니다", "완료":from==="참석"?"스탬프는 그대로":"참석 확인 스탬프 1개가 붙습니다", "매칭":"참석 확인 스탬프를 거둡니다", "취소":"참가자 앱에 바로 반영 · 신청 글 · 아이디어 한 줄은 그대로", "대기":from==="취소"?"희망 상태로 돌아갑니다":"회차 · 테이블을 비우고 희망으로 돌립니다" };
  if(from==="완료"&&to==="참석") SUB["참석"]="스탬프는 그대로";
  confirmBox({ t:T[to]||"바꿀까요?", who:(r.name||r.emp)+" · "+ccView(r)+" → "+ccSt(to), sub:SUB[to]||"", ok:O[to]||"바꾸기", danger:to==="취소"||to==="매칭"||(to==="대기"&&from!=="취소"),
    run:run, done:function(x){ var w=after(x); toast((r.name||r.emp)+" · "+ccSt(to)+w,{ bad:w?1:0, undo:function(){ ccSet(e, from, 1); } }); } });
}
/* 마감 · 지금 희망(대기 · 미선정 알림 전) 전원에게 미선정 알림 한 번 · 되돌릴 수 없다 */
function ccClose(){
  var K=ccCount(ccRows(), ccCfg().rounds); if(!K.wait){ toast("남은 희망자가 없습니다"); return; }
  confirmBox({ t:"커피챗 희망 접수를 마감할까요?", who:"남은 희망 "+n0(K.wait)+"명 · 미선정 처리", sub:"「커피챗 신청한 시간이 모두 지났어요」 알림 한 번 · 되돌릴 수 없습니다", ok:"마감 · 알림 보내기", danger:1,
    body:'<div class="fld">확인 문구 · 「마감」을 입력합니다</div><input class="in" id="ccEndQ" autocomplete="off" oninput="gateUpd()">', focus:"ccEndQ",
    gate:function(){ var q=el("ccEndQ"); return !!q&&q.value.trim()==="마감"; },
    run:function(){ return call("cchat_close",{}); },
    done:function(x){ var at=new Date().toISOString(); ccRows().forEach(function(r){ if(r.status==="대기"&&!r.overAt) r.overAt=at; }); ccPaint(); reload(["cc","nb"]); toast("마감했습니다 · 미선정 "+n0(x.n)+"명 · 알림 받는 사람 "+n0(x.sent)+"명"); } });
}
