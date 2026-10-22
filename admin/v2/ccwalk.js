/* AXF CONTROL v2 · 미팅 › 18F 커피챗 › 현장 상담 (사용자 확정 261022)
 * 아침에 18F 에 온 사람을 커피챗 담당이 붙잡아 이야기 · 그 자리에서 기록 · 「상담 완료」 = 스탬프 2개(커피챗 참석 cc · 아이디어 한 줄 p5) · 슬롯 틀 없이 명단으로
 * 서버 = ccw_list(읽기 · 콘솔 사람 누구나) · ccw_find · ccw_add · ccw_save · ccw_done(dry=1 미리 보기) · ccw_del(on=0 되살리기) = 슈퍼관리자 또는 커피챗 담당(설정 커피챗_담당)
 *   찾기 = 사번(정확히) 또는 이름 2글자 이상 · 결과 최대 5줄(이름 · 소속 · 사번 · 앱 가입) · 10분 60번 · 운영로그에 남음
 *   아이디어 한 줄 = 완료 때 아이디어 시트(경로 ccw) · 앱 「내 아이디어」 · 아이디어왕 후보 · 30자 이상 3,000자 이하(앱과 같다) · 상담 메모 = 콘솔에만(500자)
 * 담당 지정 · 해제 = 설정 › 관리자 명단 › 콘솔 입장 명단 「커피챗 담당」 칸(roster.js 열 · 슈퍼관리자만 단추) · cc_owner_set */
var CW={ open:"", dr:{}, q:"", fr:null, fbusy:0, f:"live", busy:{} };
var CW_RES={ put:["줌","ok"], cap:["기록만 · 개수 그대로","off"], has:["이미 받음 · 건너뜀","off"], preday:["행사 전 · 건너뜀","warn"], later:["당일 첫 접속 때 줌","off"], noidea:["아이디어 없음 · 건너뜀","warn"], err:["못 줌","bad"] };
var CW_FAIL={ owner:"커피챗 담당 · 슈퍼관리자가 합니다 · 설정 › 관리자 명단에서 지정", rate:"찾기를 너무 많이 했습니다 · 10분 뒤 다시", noros:"명부에 없는 사번입니다", "short":"아이디어 한 줄은 30자 이상입니다", "long":"글자 수가 너무 깁니다", done:"상담을 마친 뒤에는 아이디어 글을 고치지 않습니다", late:"아이디어 마감이 지나 받지 않습니다", param:"사번 또는 이름 2글자 이상을 넣습니다", preday:"행사 전이라 커피챗 스탬프가 나가지 않습니다 · 완료하지 않고 그대로 둡니다 · 10/26에 다시 누릅니다" };
function cwMay(){ var d=S.data.ccw; return !!(isTop()||(S.me&&S.me.co)||(d&&d.ok&&d.may)); }
function cwRows(){ var d=S.data.ccw; return d&&d.ok&&d.rows||[]; }
function cwRow(id){ return cwRows().filter(function(x){ return x.id===id; })[0]||null; }
function cwLen(t){ return Array.from?Array.from(String(t||"")).length:String(t||"").length; }
function cwWhy(r){ return CW_FAIL[r&&r.reason]||why(r); }
function cwDr(id){ var x=cwRow(id)||{}; return CW.dr[id]||(CW.dr[id]={ memo:x.memo||"", idea:x.idea||"", at:x.upAt||"" }); }
function cwDirty(id){ var x=cwRow(id), d=CW.dr[id]; return !!(x&&d&&(d.memo!==(x.memo||"")||(x.st!=="완료"&&d.idea!==(x.idea||"")))); }

function cwMount(b){
  b.innerHTML='<div class="cw">'+
    '<div class="card cw-find" id="cwFind"></div>'+
    '<div class="card mt8"><div class="cw-hd"><h2>현장 상담 명단</h2><span class="sp"></span><div class="mtg-seg" role="group" aria-label="보기" id="cwSeg"></div></div><div id="cwList"></div></div></div>';
  cwFindPaint(); cwPaint();
}
/* ── 찾기 ── */
function cwFindPaint(){
  var box=el("cwFind"); if(!box) return;
  if(!cwMay()){ box.innerHTML='<h2>사람 찾기</h2>'+band("info","현장 상담 기록은 커피챗 담당 · 슈퍼관리자가 합니다 · 설정 › 관리자 명단에서 지정"); return; }
  if(!box.querySelector("#cwQ")) box.innerHTML='<h2>사람 찾기 <span class="cap">사번 또는 이름 · 최대 5명</span></h2>'+
    '<form class="cw-qf" onsubmit="cwFindGo();return false"><input class="cw-in" id="cwQ" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" placeholder="사번 또는 이름" aria-label="사번 또는 이름" maxlength="20"><button class="btn pri" type="submit" id="cwQb">찾기</button></form><div id="cwFr" aria-live="polite"></div>';
  var r=CW.fr, h="";
  if(CW.fbusy) h='<div class="cap mt8">찾는 중</div>';
  else if(r&&!r.ok) h=band("warn",esc(cwWhy(r)));
  else if(r){
    if(!r.rows.length) h='<div class="cap mt8">찾은 사람이 없습니다</div>';
    else h='<ul class="cw-fr">'+r.rows.map(function(x){
      var inL=!!x.inList||!!cwRows().filter(function(y){ return y.emp===x.emp; })[0];
      return '<li><div class="w"><b>'+esc(x.name||"-")+'</b>'+(x.acct?"":" "+tag("앱 미가입","off"))+'<span>'+esc((x.dept||"소속 없음")+" · "+x.emp)+'</span></div>'+
        (inL?'<button class="btn sm" type="button" onclick="cwOpenEmp(\''+jq(x.emp)+'\')">명단에 있음</button>':'<button class="btn sm pri" type="button" onclick="cwAdd(\''+jq(x.emp)+'\')"'+(CW.busy["a"+x.emp]?' aria-disabled="true"':'')+'>명단에 넣기</button>')+'</li>'; }).join("")+'</ul>'+
      (r.more?'<div class="cap mt4">더 있습니다 · 이름을 더 적거나 사번으로 찾습니다</div>':'');
  }
  var fr=el("cwFr"); if(fr&&fr._h!==h){ fr._h=h; fr.innerHTML=h; }
}
function cwFindGo(){
  var q=(el("cwQ")||{}).value||""; q=q.replace(/\s+/g,"");
  if(!q||(!/\d/.test(q)&&q.length<2)){ CW.fr={ ok:false, reason:"param" }; cwFindPaint(); return; }
  if(CW.fbusy) return; CW.fbusy=1; CW.q=q; cwFindPaint();
  call("ccw_find",{ q:q }).then(function(r){ CW.fbusy=0; CW.fr=r&&r.ok?r:(r||{ ok:false }); cwFindPaint(); });
}
function cwAdd(emp){
  if(CW.busy["a"+emp]) return; CW.busy["a"+emp]=1; cwFindPaint();
  call("ccw_add",{ emp:emp }).then(function(r){
    delete CW.busy["a"+emp];
    if(!r||!r.ok){ toast("넣지 못했습니다 · "+cwWhy(r),{ bad:1, ms:4000 }); cwFindPaint(); return; }
    var d=S.data.ccw; if(d&&d.ok&&!cwRow(r.row.id)) d.rows.push(r.row);
    CW.open=r.row.id; CW.f="live"; if(CW.fr&&CW.fr.rows) CW.fr.rows.forEach(function(x){ if(x.emp===emp) x.inList=r.row.id; });
    toast(r.dup?"이미 명단에 있습니다 · "+(r.row.name||emp):"명단에 넣었습니다 · "+(r.row.name||emp));
    cwFindPaint(); cwPaint(true); setTimeout(function(){ var t=el("cwI_"+r.row.id); if(t){ t.scrollIntoView({ block:"center" }); t.focus(); } },60);
  });
}
function cwOpenEmp(emp){ var x=cwRows().filter(function(y){ return y.emp===emp; })[0]; if(!x) return; CW.open=x.id; CW.f=x.st==="완료"?"done":"live"; cwPaint(true); }
/* ── 명단 ── */
function cwTags(x){
  var t=[];
  if(!x.acct) t.push(tag("앱 미가입","off"));
  if(x.app) t.push(tag("시간표 신청 · "+(x.app==="매칭"?"배정":x.app==="참석"?"왔음":x.app==="완료"?"끝":x.app),"off"));
  if(x.st==="완료") t.push(tag("완료 "+hm(x.doneAt),"ok"));
  return t.join("");
}
function cwStampLine(x){ return '<span class="cw-st">'+(x.cc?"커피챗 받음":"커피챗 아직")+" · "+(x.p5?"아이디어 받음":"아이디어 아직")+" · 스탬프 "+n0(x.n)+"/6"+'</span>'; }
function cwPaint(force){
  var box=el("cwList"); if(!box) return;
  cwFindPaint();
  var a=document.activeElement; if(!force&&a&&box.contains(a)&&/TEXTAREA|INPUT/.test(a.tagName)) return;   /* 쓰는 중이면 다시 그리지 않는다(한글 조합 보호) */
  var gt=dataGate("ccw","현장 상담"), rows=gt?[]:cwRows();
  var live=rows.filter(function(x){ return x.st!=="완료"; }), done=rows.filter(function(x){ return x.st==="완료"; });
  var seg=el("cwSeg"), sh=[["live","상담 중",live.length],["done","완료",done.length],["all","전체",rows.length]].map(function(v){ return '<button type="button" aria-pressed="'+(CW.f===v[0])+'" class="'+(CW.f===v[0]?"on":"")+'" onclick="CW.f=\''+v[0]+'\';cwPaint(true)">'+v[1]+' <span class="c">'+n0(v[2])+'</span></button>'; }).join("");
  if(seg&&seg._h!==sh){ seg._h=sh; seg.innerHTML=sh; }
  var list=CW.f==="live"?live:CW.f==="done"?done:rows;
  list=list.slice().sort(function(p,q){ var a1=p.st==="완료"?p.doneAt:p.at, b1=q.st==="완료"?q.doneAt:q.at; return a1<b1?1:a1>b1?-1:0; });
  var h=gt||(list.length?'<ul class="cw-ls">'+list.map(cwItem).join("")+'</ul>':emptyH(CW.f==="done"?"완료한 상담이 없습니다":"상담 중인 사람이 없습니다 · 위에서 찾아 넣습니다"));
  if(!force&&box._h===h) return; box._h=h; box.innerHTML=h;
}
function cwItem(x){
  var on=CW.open===x.id;
  return '<li class="cw-it'+(on?" on":"")+(x.st==="완료"?" cw-dn":"")+'"><button type="button" class="cw-row" aria-expanded="'+on+'" onclick="cwToggle(\''+jq(x.id)+'\')"><span class="w"><b>'+esc(x.name||"-")+'</b>'+cwTags(x)+'<span class="d">'+esc((x.dept||"소속 없음")+" · "+x.emp)+'</span></span><span class="cw-cv" aria-hidden="true"></span></button>'+
    (on?cwEd(x):"")+'</li>';
}
function cwToggle(id){ CW.open=CW.open===id?"":id; cwPaint(true); }
function cwEd(x){
  var d=cwDr(x.id), may=cwMay(), dn=x.st==="완료", id=jq(x.id), dmin=(S.data.ccw||{}).min||30, dmax=(S.data.ccw||{}).max||3000;
  var il=cwLen(d.idea);
  var ideaF=dn?'<div class="cw-lab">아이디어 한 줄 <span class="cap">저장됨 · 아이디어왕 후보</span></div><div class="cw-ro">'+(x.idea?esc(x.idea):'<span class="cap">글 없음</span>')+'</div>':
    '<label class="cw-lab" for="cwI_'+id+'">아이디어 한 줄 <span class="cap">그 사람 아이디어로 저장 · 아이디어왕 후보</span></label>'+
    '<textarea class="cw-ta" id="cwI_'+id+'" rows="3" maxlength="'+dmax+'" oninput="cwIn(\''+id+'\',\'idea\',this.value)"'+(may?"":" readonly")+'>'+esc(d.idea)+'</textarea><div class="cw-cnt'+(il&&il<dmin?" bad":"")+'" id="cwIc_'+id+'">'+n0(il)+' / '+n0(dmax)+'자 · '+dmin+'자 이상</div>';
  var memoF='<label class="cw-lab" for="cwM_'+id+'">상담 메모 <span class="cap">콘솔에만 · 그 사람 앱에 안 보임</span></label>'+
    '<textarea class="cw-ta" id="cwM_'+id+'" rows="3" maxlength="500" oninput="cwIn(\''+id+'\',\'memo\',this.value)"'+(may?"":" readonly")+'>'+esc(d.memo)+'</textarea><div class="cw-cnt" id="cwMc_'+id+'">'+n0(cwLen(d.memo))+' / 500자</div>';
  var res=dn&&x.res?'<div class="cw-res">'+cwResTag("커피챗 참석", x.res.cc)+cwResTag("아이디어 한 줄", x.res.p5)+'<span class="cap">스탬프 '+n0(x.res.n0)+' → '+n0(x.res.n1)+'개</span></div>':"";
  var acts=!may?'<div class="cap mt8">보기만 · 커피챗 담당 · 슈퍼관리자가 기록합니다</div>':
    '<div class="cw-acts"><button class="btn" type="button" id="cwS_'+id+'" onclick="cwSave(\''+id+'\')"'+(cwDirty(x.id)?"":' aria-disabled="true"')+'>'+(cwDirty(x.id)?"저장":"저장됨")+'</button>'+
    (dn?'':'<button class="btn pri" type="button" onclick="cwDoneAsk(\''+id+'\')"'+(CW.busy["d"+x.id]?' aria-disabled="true"':'')+'>상담 완료</button><span class="sp"></span><button class="btn sm dng" type="button" onclick="cwDelAsk(\''+id+'\')">명단에서 빼기</button>')+'</div>';
  return '<div class="cw-ed">'+cwStampLine(x)+res+'<div class="cw-f">'+ideaF+'</div><div class="cw-f">'+memoF+'</div>'+acts+(x.by?'<div class="cap mt4">마지막 고침 · '+esc(x.by)+' · '+esc(hm(x.upAt))+'</div>':'')+'</div>';
}
function cwResTag(l, k){ var r=CW_RES[k]||[k||"-","off"]; return '<span class="cw-rt"><span class="l">'+esc(l)+'</span>'+tag(r[0],r[1])+'</span>'; }
function cwIn(id, k, v){
  var d=cwDr(id); d[k]=v;
  var c=el((k==="idea"?"cwIc_":"cwMc_")+id), dmin=(S.data.ccw||{}).min||30, dmax=(S.data.ccw||{}).max||3000, n=cwLen(v);
  if(c){ c.textContent=k==="idea"?n0(n)+" / "+n0(dmax)+"자 · "+dmin+"자 이상":n0(n)+" / 500자"; c.classList.toggle("bad",k==="idea"&&n>0&&n<dmin); }
  var b=el("cwS_"+id); if(b){ var dt=cwDirty(id); b.textContent=dt?"저장":"저장됨"; if(dt) b.removeAttribute("aria-disabled"); else b.setAttribute("aria-disabled","true"); }
}
function cwSave(id, then){
  var x=cwRow(id), d=cwDr(id); if(!x) return Promise.resolve(null);
  if(!cwDirty(id)){ if(then) then(x); return Promise.resolve(x); }
  if(CW.busy["s"+id]) return Promise.resolve(null); CW.busy["s"+id]=1;
  var p={ id:id, memo:d.memo, at:x.upAt }; if(x.st!=="완료") p.idea=d.idea;
  return call("ccw_save",p).then(function(r){
    delete CW.busy["s"+id];
    if(!r||!r.ok){ toast("저장하지 못했습니다 · "+cwWhy(r),{ bad:1, ms:5000 }); if(r&&r.reason==="changed") reload(["ccw"]); return null; }
    cwPut(r.row); var dd=CW.dr[id]; dd.at=r.row.upAt;
    if(!then){ toast("저장했습니다 · "+(r.row.name||r.row.emp)); cwPaint(true); }
    else then(r.row);
    return r.row;
  });
}
function cwPut(row){ var d=S.data.ccw; if(!d||!d.ok) return; var i=d.rows.findIndex?d.rows.findIndex(function(y){ return y.id===row.id; }):-1; if(i>=0) d.rows[i]=row; else d.rows.push(row); }
function cwDoneAsk(id){
  var x=cwRow(id); if(!x||CW.busy["d"+id]) return;
  if(!cwMay()){ toast(CW_FAIL.owner,{ bad:1 }); return; }
  var d=cwDr(id), n=cwLen(d.idea.trim()), dmin=(S.data.ccw||{}).min||30;
  if(n&&n<dmin){ toast("아이디어 한 줄은 "+dmin+"자 이상입니다 · 지금 "+n+"자",{ bad:1, ms:4000 }); var t=el("cwI_"+id); if(t) t.focus(); return; }
  CW.busy["d"+id]=1;
  cwSave(id, function(){
    call("ccw_done",{ id:id, dry:"1" }).then(function(pv){
      delete CW.busy["d"+id];
      if(!pv||!pv.ok){ toast(pv&&pv.reason==="preday"?CW_FAIL.preday:"미리 보지 못했습니다 · "+cwWhy(pv),{ bad:1, ms:6000 }); return; }
      if(pv.again){ cwPut(pv.row); cwPaint(true); toast("이미 완료한 상담입니다"); return; }
      cwConfirm(id, pv);
    });
  }).then(function(r){ if(r===null) delete CW.busy["d"+id]; });
}
function cwConfirm(id, pv){
  var x=pv.row, pl=pv.plan||{};
  var li=function(l, k, s){ var r=CW_RES[k]||[k,"off"]; return '<li><span class="l">'+esc(l)+'</span>'+tag(r[0],r[1])+(s?'<span class="cap">'+esc(s)+'</span>':'')+'</li>'; };
  var body=band(pl.cc==="put"||pl.p5==="put"?"warn":"info", pl.cc==="put"||pl.p5==="put"?"실제 스탬프가 나갑니다 · 완료 뒤 아이디어 글은 고치지 않습니다":"새로 나가는 스탬프가 없습니다 · 기록만 남깁니다")+
    '<ul class="cw-pl">'+li("커피챗 참석", pl.cc, pl.cc==="cap"?"6개 다 참 또는 프로그램 참여 2개 참":"")+li("아이디어 한 줄", pl.p5, pl.idea?"글은 그 사람 아이디어로 저장":"")+'</ul>'+
    '<div class="cap mt4">스탬프 '+n0(pl.n0)+' → '+n0(pl.n1)+'개 · 이미 받은 것 · 상한 · 행사 전은 건너뜀</div>';
  confirmBox({ t:"상담 완료할까요?", who:personLine(x), sub:"스탬프 2개 · 커피챗 참석 · 아이디어 한 줄", body:body, ok:"상담 완료",
    run:function(){ return call("ccw_done",{ id:id },20000); },
    fail:function(r){ return CW_FAIL[r&&r.reason]||""; },
    done:function(r){ cwPut(r.row); delete CW.dr[id]; CW.open=""; cwPaint(true);
      var rs=r.res||{}, tx=function(k){ return (CW_RES[k]||[k])[0]; };
      toast((r.again?"이미 완료한 상담입니다 · ":"완료했습니다 · ")+(r.row.name||r.row.emp)+" · 커피챗 "+tx(rs.cc)+" · 아이디어 "+tx(rs.p5),{ ms:6000 }); } });
}
function cwDelAsk(id){
  var x=cwRow(id); if(!x) return;
  confirmBox({ t:"명단에서 뺄까요?", who:personLine(x), sub:"스탬프는 나가지 않은 상태 · 적은 메모 · 아이디어 글은 이 줄에 남음 · 되돌리기 7초", ok:"명단에서 빼기", danger:true,
    run:function(){ return call("ccw_del",{ id:id }); },
    fail:function(r){ return CW_FAIL[r&&r.reason]||""; },
    done:function(){ var d=S.data.ccw; if(d&&d.ok) d.rows=d.rows.filter(function(y){ return y.id!==id; }); if(CW.open===id) CW.open=""; cwPaint(true);
      toast("뺐습니다 · "+(x.name||x.emp),{ undo:function(){ call("ccw_del",{ id:id, on:"0" }).then(function(y){ reload(["ccw"]); toast(y&&y.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+cwWhy(y),{ bad:!(y&&y.ok) }); }); } }); } });
}
/* ── 커피챗 담당 · 관리자 명단(콘솔 입장) 칸 ── */
function cwOwnCell(r){
  if(r.co==null) return '<span class="cap">서버 갱신 뒤</span>';
  var h=r.co?tag("담당","ok"):'<span class="cap">-</span>';
  if(typeof adrTop==="function"&&adrTop()) h+=' <button class="btn sm" type="button" onclick="cwOwnAsk(\''+jq(r.emp)+'\','+(r.co?0:1)+')">'+(r.co?"해제":"지정")+'</button>';
  return h;
}
function cwOwnRow(emp){ var d=S.data.admr; return d&&d.ok?(((d.c||{}).rows||[]).filter(function(x){ return x.emp===emp; })[0]||null):null; }
function cwOwnAsk(emp, on){
  var r=cwOwnRow(emp)||{ emp:emp };
  confirmBox({ t:on?"커피챗 담당으로 지정할까요?":"커피챗 담당을 해제할까요?", who:personLine(r), sub:on?"미팅 탭 › 18F 커피챗 › 현장 상담에서 사람 찾기 · 기록 · 상담 완료(스탬프)를 할 수 있음 · 활동 기록에 남음":"이 사람의 현장 상담 쓰기 단추가 사라짐 · 활동 기록에 남음", ok:on?"지정":"해제", danger:!on,
    run:function(){ return call("cc_owner_set",{ emp:emp, on:on?"1":"0" }); },
    fail:function(x){ return x&&x.reason==="notfound"?"콘솔 입장 명단에 먼저 넣습니다":x&&x.reason==="super"?"슈퍼관리자만 합니다":""; },
    done:function(x){ cwOwnAfter(emp, on); toast((on?"지정했습니다 · ":"해제했습니다 · ")+(r.name||emp), x.same?{}:{ undo:function(){ call("cc_owner_set",{ emp:emp, on:on?"0":"1" }).then(function(y){ if(y&&y.ok) cwOwnAfter(emp, !on); toast(y&&y.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(y),{ bad:!(y&&y.ok) }); }); } }); } });
}
function cwOwnAfter(emp, on){ var r=cwOwnRow(emp); if(r) r.co=on?1:0; if(S.me&&normE(S.me.emp)===normE(emp)) S.me.co=on?1:0; paint(); reload(["admr"]); }
