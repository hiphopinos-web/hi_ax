/* AXF CONTROL v2 · 알림 › 공지 · 자동 알림 + 정상으로 바꾸면 나갈 것 (261021 사용자 「무엇이 나가는지 미리 보고 · 문구를 고치고 · 하나씩 켜고 끄기」)
 * 칩 = 보내기 · 예약 · 보낸 기록 · 공지 · 자동 알림(이 파일이 뒤 두 칸을 더한다)
 * 데이터 = ntf_list(알림 15종 · 261021 키트 · 체크인 호출 · 포토부스 3종 걷음 · 켜짐 · 기본 · 고친 문구 · 예시 글자 · soon = 정상으로 바꾸면 24시간 안 나갈 예약 줄 · 일이 생기면 곧바로 나가는 알림) · sched_list(공지 줄)
 * 자동 알림 = ntf_set(id · on 1|0 · t · b 틀 · 빈칸 = 기본 문구) · 되돌리기 토스트(응답 prev)
 * 공지 = 공지 · Closing Speech 예약 줄 · sched_edit(off 끄기 · on 켜기 · edit 고치기 · cancel 취소) · 켜기는 확인 창(그때 나갈 글자 · 받는 사람)
 * 맨 위 푸시 띠 아래 = 요약 한 줄(ntfSoonLine) · 정상 · 잠금 전환 확인 창 목록(ntfSoonBody) · notify.js ntStopPaint · ntStopAsk 가 부른다 */
NT_SUBS.push(["notice","공지"],["auto","자동 알림"]);
var NF={ ed:"", f:{ t:"", b:"" }, last:"t" };
var NF_G=["커피챗","AX 라운지","스태프 스캔","혼잡","관람 시간","럭키드로우"];
var NF_WHY={ var:"모르는 칸이 있습니다 · 아래 칸 단추로 넣습니다", len:"제목 40자 · 내용 120자까지", lock:"코드에서 꺼 둔 알림입니다", id:"없는 알림입니다", text:"제목(40자) · 내용(120자)을 확인합니다", at:"날짜 · 시각 형식을 확인합니다", range:"지금부터 1분 뒤 ~ 30일 안으로 넣습니다", kind:"이 줄은 자동 알림에서 켜고 끕니다", state:"이미 처리된 줄입니다" };
function nfD(){ var d=S.data.ntf; return d&&d.ok&&d.items?d:null; }
function nfItem(id){ var d=nfD(); return d?d.items.filter(function(x){ return x.id===id; })[0]:null; }
function nfAt(s){ s=String(s||""); return s.length>=16?s.slice(5,7)+"/"+s.slice(8,10)+" "+s.slice(11,16):s; }
function nfFill(t, v){ return String(t||"").replace(/\{([^{}\s]{1,8})\}/g,function(m,k){ return v&&Object.prototype.hasOwnProperty.call(v,k)?String(v[k]):m; }); }
function nfWhy(r){ return r&&NF_WHY[r.reason]||why(r); }
function ntfFresh(cb){ call("ntf_list",{}).then(function(r){ if(r&&r.ok){ S.data.ntf=r; S.at.ntf=Date.now(); S.err.ntf=null; } cb(); },function(){ cb(); }); }
/* ── 정상으로 바꾸면 나갈 것 ── */
function nfGo(r, to){ return r.push&&!r.off&&(to!=="lock"||(r.kind!=="notice"&&r.kind!=="outro"&&r.kind!=="visit_slot")); }
function ntfSoonLine(cur){
  var d=nfD(); if(!d||!d.soon||!d.st||!d.st.rt) return "";
  var so=d.soon, go=so.rows.filter(function(r){ return nfGo(r,"ok"); }), ev=so.ev.filter(function(x){ return x.on; }), f=go[0];
  return '<div class="nf-sum" id="nfSum"><span>'+(cur==="ok"?"지금 나가는 중":"정상으로 바꾸면")+' · '+so.h+'시간 안 예약 푸시 <b class="n">'+n0(go.length)+'</b>건'+
    (f?' · 가장 이른 것 <b class="n">'+esc(nfAt(f.at))+'</b> '+esc(f.kname)+(f.n?' '+n0(f.n)+'명':''):'')+
    (so.later?' · 그 뒤 '+n0(so.later)+'건'+(so.laterFirst?'(첫 '+esc(nfAt(so.laterFirst.at))+')':''):'')+
    ' · 일이 생기면 곧바로 나가는 알림 <b class="n">'+n0(ev.length)+'</b>종 켜짐</span>'+
    '<button class="btn sm" type="button" onclick="goSub(\'auto\')">자동 알림 보기</button></div>';
}
function nfSoonRow(r, to){
  var go=nfGo(r,to);
  return '<div class="nf-sr'+(go?"":" off")+'"><span class="n nf-sr-t">'+esc(nfAt(r.at))+'</span><div><b>'+esc(r.title||r.kname)+(r.body?'<span class="nf-sr-b"> · '+esc(r.body)+'</span>':'')+'</b>'+
    '<span class="nf-sr-w">'+esc([r.title&&r.title!==r.kname?r.kname:"",r.who].filter(Boolean).join(" · "))+(r.push&&!r.off?' · 지금 '+n0(r.n)+'명':'')+'</span></div>'+
    (r.off?tag(r.off,"off"):to==="lock"&&r.push&&!go?tag("잠금 중 안 나감","off"):"")+'</div>';
}
function ntfSoonBody(to){
  var d=nfD();
  if(!d||!d.soon) return band("info","이 서버는 나갈 목록을 아직 보여 주지 않습니다 · 서버 갱신 뒤");
  var so=d.soon, st=d.st||{}, ev=so.ev.filter(function(x){ return x.on; }), evOff=so.ev.filter(function(x){ return !x.on; }), go=so.rows.filter(function(r){ return nfGo(r,to); });
  return '<div class="nf-soon"><div class="nf-h">정해진 시각에 나갈 푸시 · '+so.h+'시간 안 <b class="n">'+n0(go.length)+'</b>건</div>'+
    (so.rows.length?so.rows.slice(0,12).map(function(r){ return nfSoonRow(r,to); }).join("")+(so.rows.length>12?'<p class="nf-note">외 '+n0(so.rows.length-12)+'건 · 예약 칸에서 봅니다</p>':''):'<p class="nf-note">24시간 안 예약 줄이 없습니다</p>')+
    (so.later?'<div class="nf-h mt">그 뒤 예약 <b class="n">'+n0(so.later)+'</b>건'+(so.later>5?' · 가장 이른 5건':'')+'</div>'+(so.next||[]).slice(0,5).map(function(r){ return nfSoonRow(r,to); }).join(""):'')+
    '<div class="nf-h mt">일이 생기면 곧바로 나가는 알림 · 켜짐 <b class="n">'+n0(ev.length)+'</b>종</div><p class="nf-ev">'+(ev.length?ev.map(function(x){ return '<span class="nf-evi">'+esc(x.n)+'</span>'; }).join(" · "):"없음")+'</p>'+
    (evOff.length?'<p class="nf-note">꺼 둠 · '+evOff.map(function(x){ return '<span class="nf-evi">'+esc(x.n)+'</span>'; }).join(" · ")+'</p>':'')+
    '<p class="nf-note">보낼 수 있는 시간 '+esc(st.time||"-")+(st.dateOk===0?' · 오늘은 발송 허용 날짜가 아님':'')+' · 알림을 켠 기기 '+n0(so.subs)+'대에만 · 하나씩 끄기는 자동 알림 칸</p></div>';
}
/* ── 자동 알림 ── */
function nfSw(on, fn, lab, dis){ return '<button type="button" class="nf-sw" role="switch" aria-checked="'+(on?"true":"false")+'" aria-label="'+esc(lab)+'"'+(dis?' disabled':'')+' onclick="'+fn+'"><i></i><span>'+(on?"켜짐":"꺼짐")+'</span></button>'; }
function nfRowAuto(x){
  var fix=!!(x.ct||x.cb), ed=NF.ed===x.id;
  var tags=tag(x.sc?"예약 줄":"곧바로","")+(fix?tag("고친 문구",""):"")+(x.lock?tag("잠김","off"):"")+(x.idle?tag("쓰지 않음","off"):"")+(x.cond?tag(x.cond,"warn"):"");
  return '<div class="nf-row'+(x.on?"":" is-off")+'" id="nfr_'+esc(x.id)+'"><div class="nf-bd"><div class="nf-tt"><b>'+esc(x.n)+'</b>'+tags+'</div>'+
    '<div class="nf-when">'+esc(x.when)+' · '+esc(x.who)+'</div>'+
    '<div class="nf-pv"><b>'+esc(x.ex.t)+'</b>'+(x.ex.b?'<span>'+esc(x.ex.b)+'</span>':'')+'</div>'+
    (x.lock?'<div class="nf-when">'+esc(x.lock)+'</div>':x.idle?'<div class="nf-when">'+esc(x.idle)+'</div>':'')+'</div>'+
    '<div class="nf-ac">'+(x.lock?'':nfSw(x.on,"nfToggle('"+jq(x.id)+"')",x.n+" 켜고 끄기")+'<button class="btn sm" type="button" aria-expanded="'+ed+'" onclick="nfEdit(\''+jq(x.id)+'\')">문구 고치기</button>')+'</div>'+
    (ed?nfEditor(x):'')+'</div>';
}
function nfEditor(x){
  var t=NF.f.t, b=NF.f.b, v=x.v||{};
  return '<div class="nf-ed"><label class="nf-fl">제목 <span class="nf-c n" id="nfCT">'+t.length+' / 40</span><input class="xg-q nt-in" id="nfT" maxlength="40" value="'+esc(t)+'" onfocus="NF.last=\'t\'" oninput="nfIn(\'t\',this.value)"></label>'+
    '<label class="nf-fl">내용 <span class="nf-c n" id="nfCB">'+b.length+' / 120</span><textarea id="nfB" rows="2" maxlength="120" onfocus="NF.last=\'b\'" oninput="nfIn(\'b\',this.value)">'+esc(b)+'</textarea></label>'+
    (x.vars.length?'<div class="nf-vars"><span class="nf-vl">칸 넣기</span>'+x.vars.map(function(k){ return '<button type="button" class="chip" onclick="nfVar(\''+jq(k)+'\')">{'+esc(k)+'}</button>'; }).join("")+'<span class="nf-vl">보낼 때 그 사람의 값으로 바뀝니다</span></div>':'')+
    '<div class="nf-pv nf-pv2" id="nfPv"></div>'+
    '<p class="nf-note">기본 문구 · '+esc(x.t)+(x.b?' / '+esc(x.b):'')+'</p>'+
    '<div class="btns mt"><button class="btn pri" type="button" onclick="nfSave(\''+jq(x.id)+'\')">저장</button><button class="btn" type="button" onclick="nfDefault(\''+jq(x.id)+'\')">기본 문구로</button><button class="btn" type="button" onclick="nfEdit(\'\')">닫기</button></div></div>';
}
function nfPvPaint(){
  var p=el("nfPv"), x=nfItem(NF.ed); if(!p||!x) return;
  var v=x.v||{}, t=nfFill(NF.f.t.trim()||x.t,v), b=nfFill(NF.f.b.trim()||x.b,v), left=/\{[^{}\s]{1,8}\}/.test(t+b), over=t.length>40||b.length>120;
  p.innerHTML='<span class="nf-vl">보기 · 예시 값</span><b>'+esc(t)+'</b>'+(b?'<span>'+esc(b)+'</span>':'')+(left?'<em class="nf-err">모르는 칸이 있습니다</em>':over?'<em class="nf-err">값을 넣으면 길이를 넘어 기본 문구로 나갑니다</em>':'');
}
function nfIn(k, v){ NF.f[k]=v; var c=el(k==="t"?"nfCT":"nfCB"); if(c) c.textContent=v.length+" / "+(k==="t"?40:120); nfPvPaint(); }
function nfVar(k){ var f=el(NF.last==="b"?"nfB":"nfT"); if(!f) return; var s=f.selectionStart==null?f.value.length:f.selectionStart, e=f.selectionEnd==null?s:f.selectionEnd, ins="{"+k+"}";
  f.value=f.value.slice(0,s)+ins+f.value.slice(e); f.focus(); try{ f.setSelectionRange(s+ins.length,s+ins.length); }catch(x){} nfIn(NF.last==="b"?"b":"t",f.value); }
function nfEdit(id){ var x=id&&nfItem(id); NF.ed=x?id:""; NF.f={ t:x?(x.ct||x.t):"", b:x?(x.cb||x.b):"" }; NF.last="t"; nfAutoPaint(); if(x){ nfPvPaint(); setTimeout(function(){ var r=el("nfr_"+id), i=el("nfT"); if(r&&r.scrollIntoView) r.scrollIntoView({ block:"nearest" }); if(i) i.focus(); },30); } }
function nfSet(p, msg){
  return call("ntf_set",p).then(function(r){
    if(!r||!r.ok){ toast("바꾸지 못했습니다 · "+nfWhy(r),{ bad:1, ms:5000 }); return r; }
    var pv=r.prev||{}, x=r.item||{};
    nfPatch(x); toast(msg(x),{ undo:function(){ call("ntf_set",{ id:p.id, on:String(pv.on), t:pv.t, b:pv.b }).then(function(z){ if(z&&z.ok) nfPatch(z.item); reload(["ntf"]); toast(z&&z.ok?"되돌렸습니다 · "+x.n:"되돌리지 못했습니다 · "+nfWhy(z),{ bad:!(z&&z.ok) }); }); } });
    reload(["ntf"]); return r; });
}
function nfPatch(x){ var d=nfD(); if(!d||!x||!x.id) return; d.items=d.items.map(function(y){ return y.id===x.id?x:y; }); if(d.soon&&d.soon.ev) d.soon.ev.forEach(function(e){ if(e.id===x.id) e.on=x.on; }); nfAutoPaint(); ntStopPaint(); }
function nfToggle(id){ var x=nfItem(id); if(!x) return; nfSet({ id:id, on:x.on?"0":"1" },function(y){ return y.n+(y.on?" 알림을 켰습니다":" 알림을 껐습니다 · 이 알림 푸시가 나가지 않음"); }); }
function nfSave(id){ var x=nfItem(id); if(!x) return; var t=NF.f.t.trim(), b=NF.f.b.trim();
  if(!t){ toast("제목을 넣습니다 · 기본 문구로 되돌리려면 「기본 문구로」",{ bad:1 }); return; }
  nfSet({ id:id, t:t, b:b },function(y){ return y.n+" 문구를 "+(y.ct||y.cb?"고쳤습니다":"기본으로 두었습니다"); }).then(function(r){ if(r&&r.ok){ NF.ed=""; nfAutoPaint(); } }); }
function nfDefault(id){ nfSet({ id:id, t:"", b:"" },function(y){ return y.n+" 문구를 기본으로 되돌렸습니다"; }).then(function(r){ if(r&&r.ok){ NF.ed=""; nfAutoPaint(); } }); }
function nfAutoPaint(){
  var box=el("nfAu"); if(!box) return; var g=dataGate("ntf","알림 하나씩 켜고 끄기"); if(g){ box.innerHTML='<div class="card">'+g+'</div>'; return; }
  var d=nfD(), it=d.items, on=it.filter(function(x){ return x.on; }).length, s=d.st||{};
  var head='<div class="card"><h2>자동 알림 <span class="cap">켜짐 '+on+' / '+it.length+'종</span></h2><p class="nf-note">조건이 되면 서버가 저절로 보내는 푸시입니다 · 끄면 그 알림 푸시만 멈추고 처리(선정 · 적립 · 승인)는 그대로 · 앱이 열려 있을 때 뜨는 앱 안 팝업 글자는 앱 코드라 여기서 바뀌지 않음'+
    (!s.rt?' · 이 서버는 푸시가 없습니다':!s.on?' · 지금 푸시 전체 정지라 아무것도 나가지 않음':'')+'</p></div>';
  box.innerHTML=head+NF_G.map(function(gn){ var L=it.filter(function(x){ return x.g===gn; }); if(!L.length) return "";
    return '<div class="card mt"><h2>'+esc(gn)+' <span class="cap">'+L.length+'종</span></h2>'+L.map(nfRowAuto).join("")+'</div>'; }).join("");
  if(NF.ed) nfPvPaint();
}
/* ── 공지(정해진 시각의 공지 · Closing Speech 예약 줄) ── */
function nfNo(){ var d=S.data.sched; return d&&d.ok?(d.rows||[]).filter(function(r){ return r.kind==="notice"||r.kind==="outro"; }):[]; }
function nfNoRow(r){
  var live=r.st==="대기"||r.st==="꺼짐", on=r.st==="대기";
  return '<div class="nf-row'+(on||r.st==="실행중"?"":" is-off")+'"><div class="nf-tm"><span class="n">'+esc(String(r.at||"").slice(5,10).replace("-","/"))+'</span><b class="n">'+esc(hm(r.at))+'</b></div>'+
    '<div class="nf-bd"><div class="nf-tt"><b>'+esc(r.title||"(제목 없음)")+'</b>'+tag(SCH_K[r.kind]||r.kind,"")+(live?"":tag(r.st,SCH_ST[r.st]||""))+'</div>'+(r.body?'<div class="nf-tx">'+esc(r.body)+'</div>':'')+
    '<div class="nf-when">'+esc(schWho(r))+(r.quiet?" · 소리 없이":"")+(r.by?' · 만든 사람 '+esc(r.by):'')+(r.res&&!live?' · '+esc(r.res):'')+'</div></div>'+
    '<div class="nf-ac">'+(live?nfSw(on,"nfNoToggle('"+jq(r.id)+"')",(r.title||"공지")+" 켜고 끄기")+'<button class="btn sm" type="button" onclick="nfNoEdit(\''+jq(r.id)+'\')">문구 고치기</button><button class="btn sm" type="button" onclick="schLoad(\''+jq(r.id)+'\')">대상 · 조건</button><button class="btn sm dng" type="button" onclick="nfNoCancel(\''+jq(r.id)+'\')">취소</button>':'')+'</div></div>';
}
function nfNoPaint(){
  var box=el("nfNo"); if(!box) return; var g=dataGate("sched","예약"); if(g){ box.innerHTML=g; return; }
  var all=nfNo(), live=all.filter(function(r){ return r.st==="대기"||r.st==="꺼짐"||r.st==="실행중"; }).sort(function(a,b){ return (a.ms||0)-(b.ms||0); }), past=all.filter(function(r){ return live.indexOf(r)<0; }).slice(0,10);
  box.innerHTML='<h2>정해진 공지 <span class="cap">나갈 '+live.filter(function(r){ return r.st==="대기"; }).length+'건 · 꺼 둠 '+live.filter(function(r){ return r.st==="꺼짐"; }).length+'건</span></h2>'+
    '<p class="nf-note">정한 시각에 서버가 앱에 공지를 내고(대상을 고른 줄은 그 사람에게만), 푸시를 고른 줄은 푸시도 보냅니다 · 꺼 두면 그 시각에 아무것도 나가지 않음 · 3분 넘게 늦으면 「지남」</p>'+
    (live.length?live.map(nfNoRow).join(""):emptyH("정해진 공지가 없습니다",'<button class="btn sm" type="button" onclick="goSub(\'sched\')">예약에서 만들기</button>'))+
    (past.length?'<details class="nf-past mt"><summary>지난 공지 '+past.length+'건</summary>'+past.map(nfNoRow).join("")+'</details>':'');
  var pre=el("nfPre"); if(pre) pre.innerHTML='<h2>자주 쓰는 공지 틀 <span class="cap">아직 예약 안 됨</span></h2>'+SCH_PRE.map(function(p,i){ return '<div class="nf-row"><div class="nf-bd"><div class="nf-tt"><b>'+esc(p.t)+'</b>'+tag(SCH_K[p.kind]||p.kind,"")+'</div><div class="nf-tx">'+esc(p.b)+'</div><div class="nf-when">'+(p.at?"시각 "+esc(p.at):"시각은 정해서 넣음")+' · 푸시 '+(p.tgt==="tickets"?"행운권 보유자":"전체 구독자")+'</div></div><div class="nf-ac"><button class="btn sm" type="button" onclick="schPre('+i+');goSub(\'sched\')">예약으로 만들기</button></div></div>'; }).join("");
}
function nfNoGet(id){ return nfNo().filter(function(r){ return String(r.id)===String(id); })[0]||null; }
function nfNoToggle(id){
  var r=nfNoGet(id); if(!r) return;
  if(r.st==="대기"){ call("sched_edit",{ id:id, op:"off" }).then(function(x){ reload(["sched","ntf"]); toast(x&&x.ok?"껐습니다 · "+hm(r.at)+" "+r.title+" · 그 시각에 나가지 않음":"끄지 못했습니다 · "+nfWhy(x),x&&x.ok?{ undo:function(){ call("sched_edit",{ id:id, op:"on" }).then(function(z){ reload(["sched","ntf"]); toast(z&&z.ok?"다시 켰습니다":"켜지 못했습니다 · "+nfWhy(z),{ bad:!(z&&z.ok) }); }); } }:{ bad:1 }); }); return; }
  confirmBox({ t:"이 공지를 켤까요?", who:nfAt(r.at)+" · "+r.title, sub:schWho(r)+(r.body?" · "+r.body:""), ok:"켜기",
    body:'<p class="nf-note">켜면 그 시각에 서버가 '+(r.nto?"대상의":"모든 참가자")+' 앱에 공지를 냅니다'+(r.push?' · 푸시는 그때 받는 사람을 다시 세고 인원 확인 없이 나갑니다':'')+'</p>',
    run:function(){ return call("sched_edit",{ id:id, op:"on" }); }, fail:function(x){ return x&&x.reason==="range"?"시각이 지났습니다 · 문구 고치기에서 시각을 옮긴 뒤 켭니다":nfWhy(x); },
    done:function(){ reload(["sched","ntf"]); toast("켰습니다 · "+nfAt(r.at)+" "+r.title); } });
}
function nfNoEdit(id){
  var r=nfNoGet(id); if(!r) return; var d0=String(r.at||"").slice(0,10), t0=hm(r.at);
  confirmBox({ t:"공지 문구 고치기", who:(SCH_K[r.kind]||r.kind)+" · "+nfAt(r.at), sub:schWho(r), ok:"저장", focus:"nfeT",
    body:'<div class="nt-row"><label class="nt-f up-f">날짜<input class="xg-q nt-in n" id="nfeD" value="'+esc(d0)+'"></label><label class="nt-f up-f">시각<input class="xg-q nt-in n" id="nfeH" inputmode="numeric" value="'+esc(t0)+'"></label></div>'+
      '<label class="nt-f up-f">제목<input class="xg-q nt-in" id="nfeT" maxlength="40" value="'+esc(r.title)+'" oninput="gateUpd()"></label><label class="nt-f up-f">내용<textarea id="nfeB" rows="2" maxlength="120">'+esc(r.body||"")+'</textarea></label>'+
      '<p class="nf-note">제목 40자 · 내용 120자 · 대상 · 조건 · 푸시는 그대로(바꾸려면 「대상 · 조건」)</p>',
    gate:function(){ var t=el("nfeT"); return !!(t&&t.value.trim()); },
    run:function(){ var dy=el("nfeD").value.trim(), tm=el("nfeH").value.trim().replace(/\s/g,""); if(/^\d{3,4}$/.test(tm)) tm=("0"+tm).slice(-4).replace(/(\d\d)(\d\d)/,"$1:$2"); if(/^\d:\d\d$/.test(tm)) tm="0"+tm;
      var at=dy+" "+tm; return call("sched_edit",{ id:id, op:"edit", title:el("nfeT").value.trim(), body:el("nfeB").value.trim(), at:at===String(r.at).slice(0,16)?"":at }); },
    fail:function(x){ return nfWhy(x); },
    done:function(x){ reload(["sched","ntf"]); toast("고쳤습니다 · "+((x.item&&x.item.title)||r.title),{ undo:function(){ call("sched_edit",{ id:id, op:"edit", title:r.title, body:r.body||"", at:String(r.at).slice(0,16) }).then(function(z){ reload(["sched","ntf"]); toast(z&&z.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+nfWhy(z),{ bad:!(z&&z.ok) }); }); } }); } });
}
function nfNoCancel(id){ var r=nfNoGet(id); if(!r) return;
  confirmBox({ t:"이 공지를 취소할까요?", who:nfAt(r.at)+" · "+r.title, sub:"취소한 줄은 다시 켤 수 없습니다 · 잠깐 멈추려면 꺼 둡니다", ok:"공지 취소", danger:true,
    run:function(){ return call("sched_edit",{ id:id, op:"cancel" }); }, fail:function(x){ return nfWhy(x); }, done:function(){ reload(["sched","ntf"]); toast("취소했습니다 · "+r.title); } }); }
/* 예약 표 · 꺼짐 줄 단추(켜기 · 취소) · 자동 줄 내용 = 나갈 문구 */
(function(){
  var a0=schActs; schActs=function(r){ if(r.st==="꺼짐"){ var J=jq(r.id); return '<span class="btns">'+(schManual(r)?'<button class="btn sm" type="button" onclick="schLoad(\''+J+'\')">고치기</button>':'')+'<button class="btn sm" type="button" onclick="nfNoToggle(\''+J+'\')">켜기</button><button class="btn sm dng" type="button" onclick="nfNoCancel(\''+J+'\')">취소</button></span>'; } return a0(r); };
  var w0=schWhat; schWhat=function(r){ var id={ cchat_remind:"cc_10", dap_remind:"dap_10", visit_slot:"visit", crowd_notify:"crowd_exp" }[r.kind], x=id&&nfItem(id);
    if(!x) return w0(r); var cw=r.kind==="crowd_notify", v=r.kind==="visit_slot"?{ 시간:String(r.slot||"").replace("-","~") }:cw?{ 대상:r.tgt==="elev"?"엘리베이터":"1F 로비" }:{ 회차:r.slot||"", 테이블:"(테이블마다)", 시간:r.slot||"" };
    return nfFill(x.ct||x.t,v)+(cw?"":" · "+nfFill(x.cb||x.b,v))+(x.on?"":" · 꺼 둠(안 나감)"); };
  SCH_ST["꺼짐"]="off";
})();
(function(){
  var sc=SCREENS.notify, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ var s=ntSub(), a=s==="notice"?[{ k:"sched", a:"sched_list", ttl:30000 },{ k:"pst", a:"push_stats", ttl:30000 }]:s==="auto"?[{ k:"pst", a:"push_stats", ttl:30000 }]:n0_(); return a.concat([{ k:"ntf", a:"ntf_list", ttl:30000 }]); };
  sc.mount=function(vb){
    var s=ntSub();
    if(s==="notice"){ el("phCap").textContent="정해진 시각에 나가는 공지 · 켜고 끄기 · 문구 고치기 · 취소"; vb.innerHTML=chipsH(NT_SUBS,"notice")+'<div id="ntStop"></div><div id="ntHold"></div><div class="card" id="nfNo"></div><div class="card mt" id="nfPre"></div>'; return; }
    if(s==="auto"){ el("phCap").textContent="조건이 되면 저절로 나가는 알림 · 하나씩 켜고 끄기 · 문구 고치기"; vb.innerHTML=chipsH(NT_SUBS,"auto")+'<div id="ntStop"></div><div id="ntHold"></div><div id="nfAu"></div>'; return; }
    return m0(vb);
  };
  sc.paint=function(vb){
    var s=ntSub();
    if(s==="notice"){ ntStopPaint(); ntHoldPaint(); nfNoPaint(); return; }
    if(s==="auto"){ ntStopPaint(); ntHoldPaint(); if(!(NF.ed&&document.activeElement&&/nfT|nfB/.test(document.activeElement.id||""))) nfAutoPaint(); return; }
    return p0(vb);
  };
})();
