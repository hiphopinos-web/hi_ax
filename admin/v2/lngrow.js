/* AXF CONTROL v2 · 처리함 › AX 라운지 · 사전 명단 한 사람 넣기 · 빼기 (261016 사용자 결정 · 10F 명단 한 사람 넣기(edit.js)와 같은 모양)
 * 넣기 = lng_pre_row_add(POST · PIN 없음 · emp · time · seat · memo) · 시간 없으면 칸 미정 · 상담석은 시간과 함께
 *   거절 = param · noros · dup · time · seat · cap · clash(with = 그 자리 사번) → 쉬운 한국어로 확인 창에 표시
 * 빼기 = lng_pre_row_del(POST · emp) · 거절 = param · notfound · done(체크인 · 완료 줄 있음 · cur = 그 상태)
 * 시간 · 상담석 바꾸기는 resv_move(inbox.js lgMoveAsk) 그대로 · 줄 되돌리기는 활동 기록(서버가 lng_pre 종류를 되돌림)
 * 넣은 뒤 · 뺀 뒤 표와 배치판을 다시 읽는다(reload resv) · 입력은 처리함 갱신(5초)이 지우지 않게 한 번만 그린다 */
var LA={ q:"", rows:null, pick:null, time:"", seat:0, memo:"", seq:0, done:0 };
var LA_WHY={ param:"사번을 확인하세요", noros:"명부에 없는 사번입니다", dup:"이미 라운지 명단에 있습니다", time:"그 시간은 칸 밖입니다", seat:"상담석이 범위 밖이거나, 시간 없이 상담석만 골랐습니다", cap:"그 칸은 정원이 찼습니다" };
var LA_DWHY={ param:"사번을 확인하세요", notfound:"라운지 명단에 없습니다 · 목록을 다시 받습니다" };
function laWhoAt(emp){ var e=normE(emp), r=((S.data.resv&&S.data.resv.rows)||[]).filter(function(x){ return normE(x.emp)===e; })[0]; return r?(r.name||"")+" · 사번 "+r.emp:"사번 "+emp; }
function laFail(r){
  if(!r) return "";
  if(r.reason==="clash") return "같은 칸 같은 상담석에 "+laWhoAt(r.with)+" 님이 있습니다";
  return LA_WHY[r.reason]||"";
}
/* 이 사람의 지금 라운지 줄(취소 제외) */
function laHave(emp){ var e=normE(emp); return ((S.data.resv&&S.data.resv.rows)||[]).filter(function(x){ return normE(x.emp)===e&&x.status!=="취소"; })[0]||null; }
function lgAddPaint(){ var b=el("lgAdd"); if(b&&!b.getAttribute("data-on")){ b.setAttribute("data-on","1"); laPaint(); } }
function laPaint(){
  var b=el("lgAdd"); if(!b) return;
  b.innerHTML='<h2>한 사람 넣기 <span class="cap">명부에서 찾기 → 시간 · 상담석 고르기 → 넣기 · 시간을 비우면 칸 미정</span></h2>'+
    '<div class="pp-find mt4"><input class="xg-q pp-q" id="laQ" type="search" autocomplete="off" placeholder="이름 · 사번" aria-label="라운지 명단에 넣을 사람 찾기" value="'+esc(LA.q)+'" oninput="LA.q=this.value" onkeydown="if(event.key===\'Enter\'&&!event.isComposing){ event.preventDefault(); laFind(this.value); }"><button class="btn" type="button" onclick="laFind(el(\'laQ\').value)">찾기</button></div><div id="laR"></div>';
  laRes();
}
function laFind(q){
  q=String(q||"").trim(); LA.q=q; LA.pick=null; LA.time=""; LA.seat=0;
  if(!q){ LA.rows=null; laRes(); return; }
  var s=++LA.seq; LA.rows="busy"; laRes();
  call("og_gate_find",{ by:"name", q:q.slice(0,30) }).then(function(r){ if(s!==LA.seq) return; LA.rows=r&&r.ok?(r.rows||[]):{ err:why(r) }; if(Array.isArray(LA.rows)&&LA.rows.length===1) LA.pick=LA.rows[0]; laRes(); });
}
function laPick(i){ LA.pick=(LA.rows||[])[i]||null; LA.time=""; LA.seat=0; laRes(); }
function laTime(t){ LA.time=LA.time===t?"":t; if(!LA.time) LA.seat=0; laRes(); }
function laSeat(s){ LA.seat=LA.seat===s?0:s; laRes(); }
function laRes(){
  var b=el("laR"); if(!b) return; var R=LA.rows;
  if(R==null){ b.innerHTML=""; return; }
  if(R==="busy"){ b.innerHTML=skel(); return; }
  if(R.err){ b.innerHTML=band("warn","찾지 못했습니다 · "+esc(R.err)); return; }
  if(!R.length){ b.innerHTML='<p class="cap mt4">명부에 없는 이름 · 사번입니다</p>'; return; }
  var h='<div class="chips mt4" role="radiogroup" aria-label="찾은 사람">'+R.slice(0,20).map(function(x,i){ var on=LA.pick&&LA.pick.emp===x.emp, hv=laHave(x.emp);
    return '<button type="button" role="radio" aria-checked="'+on+'" class="chip'+(on?" on":"")+'" onclick="laPick('+i+')">'+esc(x.name||"-")+' · '+esc(x.emp)+(x.dept?' · '+esc(x.dept):'')+(hv?' · 명단에 있음':'')+'</button>'; }).join("")+'</div>';
  var p=LA.pick;
  if(p){
    var hv=laHave(p.emp), P=LG.P, cf=lgCfg(), tm="";
    if(P){ tm='<button type="button" role="radio" aria-checked="'+(!LA.time)+'" class="chip'+(!LA.time?" on":"")+'" onclick="laTime(\'\')">칸 미정</button>';
      for(var i=0;i<cf.n;i++){ var t=m2hm(P.s0+i*cf.step), used=P.grid[i].filter(function(x){ return x&&RV_ON.indexOf(x.status)>=0; }).length, left=cf.seats-used, on=LA.time===t;
        tm+='<button type="button" role="radio" aria-checked="'+on+'" class="chip'+(on?" on":"")+'" onclick="laTime(\''+t+'\')">'+t+' <span class="c">'+(left>0?left+"자리":"마감")+'</span></button>'; } }
    h+='<div class="nt-f"><div class="nt-l">시간</div><div class="chips" role="radiogroup" aria-label="시간 칸">'+tm+'</div></div>';
    if(LA.time&&P){ var ti=Math.floor((mins(LA.time)-P.s0)/cf.step), sh='<button type="button" role="radio" aria-checked="'+(!LA.seat)+'" class="chip'+(!LA.seat?" on":"")+'" onclick="laSeat(0)">자동 · 빈 자리</button>';
      for(var s=1;s<=cf.seats;s++){ var o=(P.grid[ti]||[])[s-1], busy=o&&RV_ON.indexOf(o.status)>=0, on2=LA.seat===s;
        sh+='<button type="button" role="radio" aria-checked="'+on2+'" class="chip'+(on2?" on":"")+'"'+(busy?' disabled aria-disabled="true"':'')+' onclick="laSeat('+s+')">상담석 '+s+(busy?' <span class="c">'+esc(o.name||o.emp)+'</span>':'')+'</button>'; }
      h+='<div class="nt-f"><div class="nt-l">상담석</div><div class="chips" role="radiogroup" aria-label="상담석">'+sh+'</div></div>'; }
    h+='<label class="nt-f"><span class="nt-l">메모(선택)</span><input class="xg-q" id="laMemo" maxlength="60" autocomplete="off" placeholder="60자까지" aria-label="메모" value="'+esc(LA.memo)+'" oninput="LA.memo=this.value" style="width:100%;max-width:360px"></label>';
    if(hv) h+=band("info",esc(p.name||p.emp)+" 님은 이미 "+esc(hv.status)+" 상태로 있습니다"+(hm(hv.slot)?" · "+hm(hv.slot):" · 칸 미정")+" · 시간 바꾸기는 배치판에서");
    h+='<div class="btns mt"><button class="btn pri" type="button" onclick="laGo()"'+(hv?' aria-disabled="true" disabled':'')+'>'+esc((p.name||p.emp)+" 넣기")+'</button></div>';
  }
  b.innerHTML=h;
}
function laGo(){
  var p=LA.pick; if(!p||laHave(p.emp)) return; var e=normE(p.emp), t=LA.time, s=t&&LA.seat?LA.seat:0, memo=String(LA.memo||"").trim().slice(0,60);
  confirmBox({ t:"라운지 사전 명단에 넣을까요?", who:(p.name||"")+" · 사번 "+e+(p.dept?" · "+p.dept:""), sub:(t?t+" 칸"+(s?" · 상담석 "+s:" · 빈 자리"):"칸 미정")+(memo?" · 메모 "+memo:"")+" · 키트명단 라운지 줄과 상담 신청 줄이 같이 생김", ok:"넣기",
    run:function(){ return call("lng_pre_row_add",{ emp:e, time:t||null, seat:s?String(s):null, memo:memo||null }); }, fail:laFail,
    done:function(r){ LA.pick=null; LA.rows=null; LA.q=""; LA.time=""; LA.seat=0; LA.memo=""; laPaint(); reload(["resv"]);
      toast("넣었습니다 · "+(r.name||p.name||e)+" · "+(r.slot?r.slot+(r.seat?" · 상담석 "+r.seat:""):"칸 미정")+(r.over?" · 정원 넘음":""), { undo:function(){ laDel(e, 1); } }); } });
}
/* 빼기 · 배치판 오른쪽 카드 단추 · 확인 창 뒤 lng_pre_row_del */
function laDelAsk(id){
  var r=rvRow(id); if(!r) return; var e=normE(r.emp);
  confirmBox({ t:"라운지 사전 명단에서 뺄까요?", who:(r.name||r.emp)+" · 사번 "+e+" · "+(hm(r.slot)||"칸 미정")+(num(r.seat)?" · 상담석 "+r.seat:"")+" · "+r.status,
    sub:"상담 신청 줄과 키트명단 라운지 줄이 같이 빠짐 · 체크인 · 완료한 줄이 있으면 빼지 못함 · 되돌리기 7초 · 활동 기록에서도 가능", ok:"빼기", danger:true,
    run:function(){ return call("lng_pre_row_del",{ emp:e }); },
    fail:function(x){ return x&&x.reason==="done"?"이미 "+(x.cur||"체크인 · 완료")+" 줄이 있어 뺄 수 없습니다":LA_DWHY[x&&x.reason]||""; },
    done:function(x){ LG.sel=null; LG.mv=null; reload(["resv"]); lgPaint();
      toast("뺐습니다 · "+(r.name||r.emp)+(x&&x.cx?" · 상담 줄 취소 "+x.cx:""), { undo:function(){ laBack(e, r); } }); } });
}
/* 넣은 직후 되돌리기 = 빼기(확인 창 없이) */
function laDel(e){ call("lng_pre_row_del",{ emp:e }).then(function(x){ LG.sel=null; reload(["resv"]); toast(x&&x.ok?"되돌렸습니다 · 명단에서 뺌":"되돌리지 못했습니다 · "+(x&&x.reason==="done"?"이미 "+(x.cur||"체크인 · 완료")+" 줄이 있습니다":why(x)),{ bad:!(x&&x.ok) }); }); }
/* 뺀 직후 되돌리기 = 같은 시간 · 상담석 · 메모로 다시 넣기 */
function laBack(e, r){
  call("lng_pre_row_add",{ emp:e, time:hm(r.slot)||null, seat:hm(r.slot)&&num(r.seat)?String(r.seat):null, memo:r.memo||null }).then(function(x){ reload(["resv"]); toast(x&&x.ok?"되돌렸습니다 · 다시 넣음":"되돌리지 못했습니다 · "+(laFail(x)||why(x)),{ bad:!(x&&x.ok) }); });
}
