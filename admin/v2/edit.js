/* AXF CONTROL v2 · 명단 한 사람씩 넣기 · 빼기 · 고치기 (261016 4단계 · 사용자 「이 화면에서 대상자를 삭제하거나 넣거나 하는 버튼이나 관리가 있어야 하는데 없어」)
 * 표 위 「한 사람 넣기」 = 명부 찾기(og_gate_find by name · 이름 · 사번 20명) → 고르기 → 넣기
 *   10F 사전 신청 = pre10_row_set(emp · sid · from · confirm 명단수정 · role 운영진) · 정원(A 63 · B 32 · C 28 · D 20 · E 20 · 20)을 넘으면 경고만
 *   접속 허용 = roll_apply(list gate) · 스태프 = roll_apply(staff_app · staff_wear) · 되돌리기 = roll_undo(묶음)
 * 줄을 누르면 한 사람 카드 · 카드 「명단」 칸에서 세션 바꾸기 · 빼기 · 넣기(pcRoll · pcP10) · 10F 되돌리기 = pre10_undo(마지막 한 건 · 확인 문구 명단되돌리기)
 * 카드 「경품」 칸 선착순 가습기 = fcfs_add(수동 지급) · fcfs_undo(수령 되돌리기) · fcfs_void(자격 취소 · dry 먼저) · 사유 2자 이상 · 261016 PIN 없음 */
var P10_CAP={ fld:63, ta:32, tb:28, aws:20, ms1:20, ms2:20 }, P10_IDS=["fld","ta","tb","aws","ms1","ms2"];
var P10_W={ set:"명단수정", del:"명단삭제", undo:"명단되돌리기" };
var P10_WHY={ noros:"명부에 없는 사번입니다", state:"그 사이 다른 사람이 바꿨습니다 · 새로 받은 뒤 다시", same:"지금 세션과 같습니다", notin:"이미 명단에 없습니다", notlast:"그 뒤에 명단이 또 바뀌어 되돌리지 못합니다", already:"이미 되돌렸습니다" };
var RL_N={ gate:"접속 허용 명단", staff_app:"스태프 폰 권한", staff_wear:"스태프 옷 명단", test:"시험 사번" };
var PA={ k:"", q:"", rows:null, pick:null, sid:"fld", role:false, app:true, wear:false, busy:0, seq:0 };
function rid(){ return "r"+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function rollBack(batch, after){ call("roll_undo",{ batch:batch }).then(function(x){ after&&after(); ppStale(); load(false); toast(x&&x.ok?"되돌렸습니다 · "+n0(x.done||0)+"명"+((x.skip||[]).length?" · 건너뜀 "+x.skip.length:""):"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); }
function p10Cnt(){ var d=S.data.pl_pre10, c={}; P10_IDS.forEach(function(k){ c[k]=0; }); if(d&&d.ok) (d.rows||[]).forEach(function(r){ if(!r.role&&c[r.sid]!=null) c[r.sid]++; }); return c; }
function p10Nm(sid){ return TEN_N[sid]||sid||"-"; }
/* ── 표 위 「한 사람 넣기」 ── */
function paBox(k){
  if(PA.k!==k){ PA.k=k; PA.q=""; PA.rows=null; PA.pick=null; }
  return '<div class="card mb" id="paB"><h2>한 사람 넣기 <span class="cap">'+(k==="pre10"?"명부에서 찾기 → 세션 고르기 → 넣기":k==="staff"?"명부에서 찾기 → 폰 권한 · 옷 고르기 → 넣기":"명부에서 찾기 → 넣기")+'</span></h2>'+
    '<div class="pp-find mt4"><input class="xg-q pp-q" id="paQ" type="search" autocomplete="off" placeholder="이름 · 사번" aria-label="넣을 사람 찾기" value="'+esc(PA.q)+'" onkeydown="if(event.key===\'Enter\'&&!event.isComposing){ event.preventDefault(); paFind(this.value); }"><button class="btn" type="button" onclick="paFind(el(\'paQ\').value)">찾기</button></div><div id="paR"></div></div>';
}
function paFind(q){
  q=String(q||"").trim(); PA.q=q; PA.pick=null; if(!q){ PA.rows=null; paPaint(); return; }
  var s=++PA.seq; PA.rows="busy"; paPaint();
  call("og_gate_find",{ by:"name", q:q.slice(0,30) }).then(function(r){ if(s!==PA.seq) return; PA.rows=r&&r.ok?(r.rows||[]):{ err:why(r) }; if(Array.isArray(PA.rows)&&PA.rows.length===1) PA.pick=PA.rows[0]; paPaint(); });
}
function paHave(e){ var d=S.data["pl_"+PA.k]; return d&&d.ok?(d.rows||[]).filter(function(x){ return normE(x.emp)===e; })[0]:null; }
function paPaint(){
  var b=el("paR"); if(!b) return; var R=PA.rows;
  if(R==null){ b.innerHTML=""; return; }
  if(R==="busy"){ b.innerHTML=skel(); return; }
  if(R.err){ b.innerHTML=band("warn","찾지 못했습니다 · "+esc(R.err)); return; }
  if(!R.length){ b.innerHTML='<p class="cap mt4">명부에 없는 이름 · 사번입니다</p>'; return; }
  var h='<div class="chips mt4" role="radiogroup" aria-label="찾은 사람">'+R.slice(0,20).map(function(x,i){ var on=PA.pick&&PA.pick.emp===x.emp, hv=paHave(normE(x.emp));
    return '<button type="button" role="radio" aria-checked="'+on+'" class="chip'+(on?" on":"")+'" onclick="paPick('+i+')">'+esc(x.name||"-")+' · '+esc(x.emp)+(x.dept?' · '+esc(x.dept):'')+(hv?' · 명단에 있음':'')+'</button>'; }).join("")+'</div>';
  var p=PA.pick;
  if(p){
    var hv=paHave(normE(p.emp));
    if(PA.k==="pre10"){ var c=p10Cnt();
      h+='<div class="nt-f"><div class="nt-l">세션</div><div class="chips" role="radiogroup" aria-label="세션">'+P10_IDS.map(function(k){ var on=PA.sid===k, ov=c[k]>=P10_CAP[k]; return '<button type="button" role="radio" aria-checked="'+on+'" class="chip'+(on?" on":"")+'" onclick="PA.sid=\''+k+'\';paPaint()">'+esc(p10Nm(k))+' <span class="c">'+c[k]+' / '+P10_CAP[k]+'</span>'+(ov?' '+tag("정원","warn"):'')+'</button>'; }).join("")+'</div></div>'+
        '<label class="nt-f" style="display:flex;gap:8px;align-items:center"><input type="checkbox"'+(PA.role?" checked":"")+' onchange="PA.role=this.checked;paPaint()">운영진(정원에 안 셈)</label>';
      if(hv) h+=band("info",esc(p.name||p.emp)+" 님은 이미 "+esc(hv.sn||p10Nm(hv.sid))+"에 있습니다 · 세션 바꾸기는 줄을 눌러 카드에서");
      else if(!PA.role&&c[PA.sid]>=P10_CAP[PA.sid]) h+=band("warn","정원을 넘습니다 · "+esc(p10Nm(PA.sid))+" "+c[PA.sid]+" / "+P10_CAP[PA.sid]+" · 넣을 수는 있습니다");
    }
    if(PA.k==="staff") h+='<div class="nt-f" style="display:flex;gap:16px;flex-wrap:wrap"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox"'+(PA.app?" checked":"")+' onchange="PA.app=this.checked;paPaint()">폰 권한(스캔 · 현장 부여)</label><label style="display:flex;gap:8px;align-items:center"><input type="checkbox"'+(PA.wear?" checked":"")+' onchange="PA.wear=this.checked;paPaint()">스태프 옷</label></div>';
    var dis=(PA.k==="pre10"&&hv)||(PA.k==="gate"&&hv)||(PA.k==="staff"&&!PA.app&&!PA.wear);
    h+='<div class="btns mt"><button class="btn pri" type="button" onclick="paGo()"'+(dis?' aria-disabled="true" disabled':'')+'>'+esc((p.name||p.emp)+" 넣기")+'</button></div>';
  }
  b.innerHTML=h;
}
function paPick(i){ PA.pick=(PA.rows||[])[i]||null; paPaint(); }
function paGo(){
  var p=PA.pick; if(!p) return; var e=normE(p.emp), who=(p.name||"")+" · 사번 "+e+(p.dept?" · "+p.dept:"");
  var after=function(){ PA.pick=null; PA.rows=null; PA.q=""; var q=el("paQ"); if(q) q.value=""; paPaint(); ppStale(); load(false); };
  if(PA.k==="pre10"){ var c=p10Cnt(), ov=!PA.role&&c[PA.sid]>=P10_CAP[PA.sid];
    confirmBox({ t:"10F 사전 신청에 넣을까요?", who:who, sub:p10Nm(PA.sid)+(PA.role?" · 운영진":"")+" · 참가자 앱 「내 세션」 · 키트 · 끝 QR 자격이 같이 생김"+(ov?" · 정원 넘음 "+c[PA.sid]+" / "+P10_CAP[PA.sid]:""), ok:"넣기",
      run:function(){ return call("pre10_row_set",{ emp:e, sid:PA.sid, from:"", role:PA.role?"staff":null, confirm:P10_W.set }); }, fail:function(r){ return r&&P10_WHY[r.reason]||""; },
      done:function(r){ after(); toast("넣었습니다 · "+(p.name||e)+" · "+p10Nm(PA.sid), r.id?{ undo:function(){ p10Undo(r.id); } }:{}); } }); return; }
  var lists=PA.k==="gate"?["gate"]:[PA.app?"staff_app":"",PA.wear?"staff_wear":""].filter(Boolean);
  confirmBox({ t:lists.map(function(l){ return RL_N[l]; }).join(" · ")+"에 넣을까요?", who:who, sub:PA.k==="gate"?"클로즈 베타 · 사전 신청자까지 범위에서 바로 로그인":(PA.app?"로그인하면 스태프 화면 · ":"")+(PA.wear?"스태프 옷 대상":""), ok:"넣기",
    run:function(){ return Promise.all(lists.map(function(l){ return call("roll_apply",{ list:l, op:"add", emps:e, rid:rid() }); })).then(function(a){ var ok=a.filter(function(x){ return x&&x.ok; }); return ok.length?{ ok:true, a:a }:a[0]; }); },
    fail:function(r){ return r&&r.reason==="noros"?"명부에 없는 사번입니다":""; },
    done:function(r){ after(); var bs=r.a.filter(function(x){ return x&&x.ok&&x.batch; }).map(function(x){ return x.batch; }), n=r.a.filter(function(x){ return x&&x.ok&&(x.done||[]).length; }).length;
      toast(n?"넣었습니다 · "+(p.name||e):r.a.some(function(x){ return x&&(x.noros||[]).length; })?"명부에 없는 사번이라 넣지 못했습니다":"이미 명단에 있습니다 · "+(p.name||e), bs.length?{ undo:function(){ bs.forEach(function(b){ rollBack(b); }); } }:{}); } });
}
function p10Undo(id){ call("pre10_undo",{ id:id, confirm:P10_W.undo }).then(function(x){ ppStale(); load(false); if(PC.emp) pcLoad(); toast(x&&x.ok?"되돌렸습니다 · 10F 명단":"되돌리지 못했습니다 · "+(x&&P10_WHY[x.reason]||why(x)),{ bad:!(x&&x.ok) }); }); }
/* ── 한 사람 카드 · 명단 칸 ── */
function pcListsHtml(d){
  var L=d.lists||{}, e=d.emp, J=jq(e), p=d.p10, h='';
  var row=function(lk, key, nm, note){ var on=!!L[key]; return '<div class="pc-pr'+(on?" got":"")+'"><span class="t"><b>'+esc(nm)+'</b><span class="cap">'+(on?"있음":"없음")+(note?" · "+esc(note):"")+'</span></span>'+(lk?'<button class="btn sm'+(on?" dng":"")+'" type="button" aria-label="'+esc(nm+(on?" 빼기":" 넣기"))+'" onclick="pcRoll(\''+lk+'\',\''+(on?"del":"add")+'\',\''+J+'\')">'+(on?"빼기":"넣기")+'</button>':'')+'</div>'; };
  h+=row("gate","gate","접속 허용","클로즈 베타 기간에 들어옴")+row("staff_app","staffApp","스태프 폰 권한","스캔 · 현장 부여")+row("staff_wear","staffWear","스태프 옷","")+row("","test","시험 사번","넣기 · 빼기는 대화로");
  var opt=P10_IDS.map(function(k){ return '<option value="'+k+'"'+(p&&p.sid===k?" selected":"")+'>'+esc(p10Nm(k))+'</option>'; }).join("");
  h+='<div class="pc-pr'+(p?" got":"")+'"><span class="t"><b>10F 사전 신청</b><span class="cap">'+(p?esc(p10Nm(p.sid))+(p.role?" · 운영진":"")+" · 키트 "+(p.kit?"받음":"아직"):"없음")+'</span></span></div>'+
    '<div class="btns mt4"><select class="xg-q" id="pcP10" aria-label="10F 세션" style="width:auto">'+opt+'</select>'+(p?'<button class="btn sm" type="button" onclick="pcP10Set(\''+J+'\')">세션 바꾸기</button><button class="btn sm dng" type="button" onclick="pcP10Del(\''+J+'\')">10F 명단에서 빼기</button>':'<button class="btn sm" type="button" onclick="pcP10Set(\''+J+'\')">10F 명단에 넣기</button>')+'</div>';
  return h;
}
function pcRoll(list, op, emp){
  var nm=RL_N[list];
  confirmBox({ t:op==="add"?nm+"에 넣을까요?":nm+"에서 뺄까요?", who:pcNm()+" · 사번 "+emp,
    sub:op==="add"?(list==="gate"?"클로즈 베타 · 사전 신청자까지 범위에서 바로 로그인":list==="staff_app"?"로그인하면 스태프 화면":"스태프 옷 대상"):(list==="gate"?"클로즈 베타 동안 다음 쓰기부터 앱이 거절":list==="staff_app"?"그 폰의 스태프 화면이 다음 요청부터 멈춤":"고른 사이즈가 풀림")+" · 되돌리기 7초 · 활동 기록에서 그날 안",
    ok:op==="add"?"넣기":"빼기", danger:op!=="add",
    run:function(){ return call("roll_apply",{ list:list, op:op, emps:emp, rid:rid() }); }, fail:function(r){ return r&&r.reason==="noros"?"명부에 없는 사번입니다":""; },
    done:function(r){ pcAfter(); var n=(r.done||[]).length; toast(n?(op==="add"?"넣었습니다 · ":"뺐습니다 · ")+nm:(r.noros||[]).length?"명부에 없는 사번이라 넣지 못했습니다":"바뀐 것이 없습니다 · "+nm, r.batch&&n?{ undo:function(){ rollBack(r.batch, pcLoad); } }:{}); } });
}
function pcP10Set(emp){
  var d=PC.d||{}, cur=d.p10?d.p10.sid:"", to=(el("pcP10")||{}).value; if(!to) return;
  if(cur===to){ toast("지금 세션과 같습니다"); return; }
  var c=p10Cnt(), ov=c[to]>=P10_CAP[to]&&!(d.p10&&d.p10.role);
  confirmBox({ t:cur?"세션을 바꿀까요?":"10F 사전 신청에 넣을까요?", who:pcNm()+" · 사번 "+emp, sub:(cur?p10Nm(cur)+" → ":"")+p10Nm(to)+" · 참가자 앱 「내 세션」이 바로 바뀜"+(ov?" · 정원 넘음 "+c[to]+" / "+P10_CAP[to]:""), ok:cur?"바꾸기":"넣기",
    run:function(){ return call("pre10_row_set",{ emp:emp, sid:to, from:cur, confirm:P10_W.set }); }, fail:function(r){ return r&&P10_WHY[r.reason]||""; },
    done:function(r){ pcAfter(); toast((cur?"세션을 바꿨습니다 · ":"넣었습니다 · ")+p10Nm(to), r.id?{ undo:function(){ p10Undo(r.id); } }:{}); } });
}
function pcP10Del(emp){
  var d=PC.d||{}, cur=d.p10?d.p10.sid:""; if(!cur) return;
  confirmBox({ t:"10F 명단에서 뺄까요?", who:pcNm()+" · 사번 "+emp, sub:p10Nm(cur)+" · 키트 · 끝 QR 자격이 같이 빠짐"+(d.p10.kit?" · 키트를 이미 받음(기록은 남김)":""), ok:"빼기", danger:true,
    run:function(){ return call("pre10_row_del",{ emp:emp, from:cur, confirm:P10_W.del }); }, fail:function(r){ return r&&P10_WHY[r.reason]||""; },
    done:function(r){ pcAfter(); toast("뺐습니다 · "+p10Nm(cur), r.id?{ undo:function(){ p10Undo(r.id); } }:{}); } });
}
/* ── 한 사람 카드 · 선착순 가습기 ── */
function fxWhyBox(ph){ return '<label class="fld">사유(2자 이상)<input class="in" id="fxWhy" maxlength="60" autocomplete="off" placeholder="'+esc(ph)+'" oninput="gateUpd()"></label>'; }
function fxWhyOk(){ var i=el("fxWhy"); return !!i&&i.value.trim().length>=2; }
var FX_WHY={ full:"남은 수량이 없습니다", dup:"이미 받은 사람입니다 · 잘못 찍었으면 「수령 되돌리기」 먼저", state:"그 사이 상태가 바뀌었습니다" };
function pcFxBtns(d){
  var fx=d.fcfs, J=jq(d.emp), b=[];
  if(!fx||(fx.st!=="done"&&fx.st!=="void")) b.push('<button class="btn sm" type="button" onclick="fxAddAsk(\''+J+'\')">수동 지급</button>');
  if(fx&&fx.st==="done") b.push('<button class="btn sm dng" type="button" onclick="fxUndoAsk(\''+J+'\')">수령 되돌리기</button>');
  if(fx&&fx.st!=="void"&&fx.st!=="done") b.push('<button class="btn sm dng" type="button" onclick="fxVoidAsk(\''+J+'\')">자격 취소</button>');
  return b.length?'<span class="btns">'+b.join("")+'</span>':"";
}
function fxAddAsk(emp){
  confirmBox({ t:"선착순 가습기를 수동 지급할까요?", who:pcNm()+" · 사번 "+emp, sub:"실물을 건넨 뒤 누름 · 스탬프 수는 보지 않음 · 남은 수량 하나 줄어듦", body:fxWhyBox("예: 스캔 장애"), focus:"fxWhy", ok:"수동 지급", gate:fxWhyOk,
    run:function(){ return call("fcfs_add",{ emp:emp, why:el("fxWhy").value.trim() }); }, fail:function(r){ return r&&FX_WHY[r.reason]||""; },
    done:function(r){ pcAfter(); toast("수동 지급했습니다 · "+pcNm()+(r.rk?" · "+r.rk+"번":"")); } });
}
function fxUndoAsk(emp){
  confirmBox({ t:"수령 기록을 지울까요?", who:pcNm()+" · 사번 "+emp, sub:"잘못 찍은 수령만 · 남은 수 하나 늘고 다시 받을 수 있음 · 실물을 돌려받았는지 먼저", body:fxWhyBox("예: 다른 사람 QR 을 찍음"), focus:"fxWhy", ok:"수령 되돌리기", danger:true, gate:fxWhyOk,
    run:function(){ return call("fcfs_undo",{ emp:emp, why:el("fxWhy").value.trim() }); }, fail:function(r){ return r&&FX_WHY[r.reason]||""; },
    done:function(){ pcAfter(); toast("수령 기록을 지웠습니다 · "+pcNm()); } });
}
function fxVoidAsk(emp){
  call("fcfs_void",{ emp:emp, dry:"1" }).then(function(x){
    if(!(x&&x.ok)){ toast("자격을 취소할 수 없습니다 · "+(FX_WHY[(x||{}).reason]||why(x)),{ bad:1, ms:5000 }); return; }
    confirmBox({ t:"선착순 자격을 취소할까요?", who:pcNm()+" · 사번 "+emp+(x.rk?" · "+x.rk+"번":""), sub:"6개여도 이 사람에게는 주지 않음 · 자리는 다른 사람에게 돌아가지 않음 · 활동 기록에 남음", body:fxWhyBox("예: 부정 적립 확인"), focus:"fxWhy", ok:"자격 취소", danger:true, gate:fxWhyOk,
      run:function(){ return call("fcfs_void",{ emp:emp, why:el("fxWhy").value.trim() }); }, fail:function(r){ return r&&FX_WHY[r.reason]||""; },
      done:function(){ pcAfter(); toast("자격을 취소했습니다 · "+pcNm()); } });
  });
}
/* ── 사람 화면에 붙이기 · 10F 표 빈 열 숨김 ── */
function xgHideEmpty(g, keep){
  if(!g||!g.rows) return; var ch=0;
  g.o.cols.forEach(function(c){ if(c.act||keep.indexOf(c.k)>=0) return; var empty=!g.rows.some(function(r){ var v=xgVal(c,r); return v!=null&&v!==""&&v!==0&&v!=="0"; }); if(!!c.hide!==empty){ c.hide=empty; ch=1; } });
  if(ch){ var root=XG.root(g), ph=root&&root.parentNode; if(root) root.remove(); if(ph) XG.put(g, ph); }
}
(function(){
  var sc=SCREENS.people, m0=sc.mount, p0=sc.paint, ADD={ pre10:1, gate:1, staff:1 };
  sc.mount=function(vb){ m0(vb); var s=ppSub(); if(!ADD[s]) return; var g=el("mg_pp_"+s), c=g&&g.closest(".card"); if(c){ c.insertAdjacentHTML("beforebegin", paBox(s)); paPaint(); } };
  sc.paint=function(vb){ p0(vb); var s=ppSub(); if(s==="pre10") xgHideEmpty(MG.pp_pre10, ["sn","emp","name","dept"]); if(ADD[s]&&PA.pick) paPaint(); };
})();
