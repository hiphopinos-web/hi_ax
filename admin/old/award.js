/* ── 261016 현장 › 시상 화면(7등 랜덤 굿즈 lk7_* · 아이디어왕 ideaking_* · 타자왕 type_result) · index.html 에서 떼어 냄(본문 400KB 상한) ──
 * 따로 둔 파일 · admin/index.html 이 본문 스크립트보다 먼저 <script src="award.js?v=..."> 로 불러 AWARD_VIEW 를 VIEWS.award 로 건다(본문 var VIEWS 줄)
 * 타자왕 카드 = type_result 에 n=10 을 보낸다(서버 기본 5 · 최대 10 · 인자 없으면 앱 TV 순위판과 옛 콘솔은 5명 그대로) */
var TY_N=10;
(function(){ try{ var st=document.createElement("style"); st.textContent=".tb tr.tyg td{height:34px;background:var(--soft);font-size:var(--fs-c);font-weight:600;color:var(--tx3)}.tb tr.tyl td{height:36px;font-size:13px;color:var(--tx2)}.tb tr.tyl td.cap{font-size:var(--fs-c);color:var(--tx3)}.tb .ty1{color:var(--navy)}"; document.head.appendChild(st); }catch(e){} })();
/* ══ 19. 현장 › 시상 (7등 랜덤 굿즈 lk7_* · 아이디어왕 ideaking_* · 타자왕 type_result) ══ */
var LK_PH={ open:["마감 전",""], wait:["마감 · 확정 전","warn"], lock:["대상 확정","pri"], drawn:["추첨 완료","ok"] };
var IK={ ch:"lounge_pre", late:0, open:{} };
var IK_CH={ lounge_pre:"AX 라운지 사전 신청", lounge_day:"AX 라운지 당일", chat:"18F 커피챗", app:"앱" };
var IK_PH={ open:["접수 중","ok"], judging:["심사 중","warn"], done:["선정 끝",""] };
var IK_PRZ=[{ rk:1, mo:6, n:1 },{ rk:2, mo:3, n:1 },{ rk:3, mo:1, n:3 }];
function awSub(){ var v=S.sub.f_award; return v==="ik"||v==="type"?v:"lk7"; }
var AWARD_VIEW={
  need:function(){ var s=awSub(); if(s==="ik") return [{ k:"ik", a:"ideaking_state", ttl:20000 },{ k:"ikl", a:"ideaking_list", p:{ ch:IK.ch, late:IK.late?"":"0" }, ttl:30000 }]; if(s==="type") return [{ k:"tres", a:"type_result", p:{ n:TY_N }, ttl:30000 }]; return [{ k:"lk", a:"lk7_state", ttl:20000 }]; },
  mount:function(){ var s=awSub(); el("vb").innerHTML='<div class="fx" style="margin-bottom:12px">'+subSeg("f_award",[["lk7","7등 랜덤 굿즈"],["ik","아이디어왕"],["type","타자왕"]],s)+'</div><div id="awB"></div>'+
    (s==="lk7"?memo('<p><b>대상</b> · 풀 기준 시각(기본 17:00)까지 행운권 번호가 한 장이라도 있는 사람입니다. 무대 행운권 1~6등 당첨자와 테스트 사번은 빠집니다. 지방 근무자도 들어갑니다.</p><p><b>순서</b> · 17:00 룰렛 마감 → 부스 실물을 세어 잔여 저장(필수) → 대상 확정 → 추첨(행사 뒤 · 한 번만) → 재현 검증 → CSV 로 사내 우편. 발송 불가는 「당첨 교체」로 예비가 이어받습니다.</p><p><b>상품</b> · 서버는 당첨자만 뽑습니다. 상자에 담을 경품은 포장 때 룰렛 남은 경품에서 무작위로 고릅니다.</p>'):
     s==="ik"?memo('<p><b>후보</b> · AX 라운지 사전 신청자 · 당일 라운지 신청자 · 18F 커피챗 참석자 중 아이디어가 있는 사람입니다.</p><p><b>선정</b> · 1등 1명(AI 구독권 6개월) · 2등 1명(3개월) · 3등 3명(1개월). 자리가 차면 서버가 더 받지 않습니다. 마감 뒤 접수는 확인 칸을 체크해야 선정됩니다.</p>'):
     memo('<p><b>1~3위</b> · 사회자가 닉네임으로 부르고 실명으로 상품을 전달합니다.</p><p><b>4~10위</b> · 엑셀 단축키 데스크 매트입니다. 참여상 마감 뒤 재고에서 나감으로 자동 집계됩니다.</p><p>읽기만 합니다. 순위 · 닉네임 관리는 고급 · 보관의 옛 화면에서 합니다. 부문 통계는 두지 않습니다.</p>')); },
  paint:function(){ var s=awSub(), b=el("awB"); if(!b) return; if(s==="ik") return ikPaint(b); if(s==="type") return tyPaint(b); lkPaint(b); }
};
function lkPaint(b){
  var d=S.data.lk;
  if(!d){ b.innerHTML=skel(); return; }
  if(unknownSrv(d)){ b.innerHTML=srvMissing("7등 랜덤 굿즈"); return; }
  if(!d.ok){ b.innerHTML=loadErr(d,"lk"); return; }
  if(b.contains(document.activeElement)&&/^(lkR_|lkV|lkC)/.test(document.activeElement.id||"")) return;
  var P=LK_PH[d.ph]||["-",""], pool=d.pool||{}, qty=lkQty(d), dr=d.draw||null, tot=lkTotal(d), rem=lkRemDone(d);
  var steps=[["마감 "+String(d.cut||"").slice(11,16), d.ph!=="open"],["17:00 룰렛 잔여", rem],["대상 확정", d.ph==="lock"||d.ph==="drawn"],["추첨", d.ph==="drawn"]], cur=-1;
  for(var i=0;i<steps.length;i++) if(!steps[i][1]){ cur=i; break; }
  var h='<div class="fx" style="margin-bottom:12px">'+tag(P[0],P[1])+'<div class="steps">'+steps.map(function(x,i){ return (i?'<i>›</i>':'')+'<span class="'+(x[1]?"done":i===cur?"cur":"")+'">'+(i+1)+' '+esc(x[0])+'</span>'; }).join("")+'</div></div>';
  h+='<div class="card kpis">'+kpiCell({ l:d.ph==="lock"||d.ph==="drawn"?"대상(확정)":"대상(미리 보기)", v:n0(d.lock&&d.lock.n!=null?d.lock.n:pool.n), u:"명", s:"1~6등 "+n0(pool.lucky)+" · 테스트 "+n0(pool.test)+" 제외" })+kpiCell({ l:"당첨 수", v:n0(qty), u:"명", s:"사람마다 남은 경품에서 무작위" })+
    kpiCell({ l:"남은 경품", v:n0(tot), u:"개", cls:tot<qty?"warn":"", s:tot<qty?"당첨 수보다 "+n0(qty-tot)+"개 적음":rem?"17:00 실사 기준":"계산값 · 실사 전" })+kpiCell({ l:"당첨", v:dr?n0(dr.W):"-", u:dr?"명":"", s:dr?"추첨 "+esc(short(dr.at||"")):"행사 뒤 추첨" })+'</div>';
  h+='<div class="grid g2"><div class="card" id="lkRem2"></div>';
  if(dr){
    var v=LK.ver;
    h+=card("추첨 결과","이름 없이 숫자만 · 명단은 CSV",imp([["추첨 번호",esc(dr.id||"-")],["시각",esc(dr.at||"-")+(dr.by?" · "+esc(dr.by):"")],["대상 · 당첨",n0(dr.N)+"명 · "+n0(dr.W)+"명"],["시드",'<span class="n cap">'+esc(String(dr.seed||"").slice(0,24))+'</span>'],["풀 해시",'<span class="n cap">'+esc(String(dr.hash||"").slice(0,24))+'</span>']])+
      '<div class="acts"><button class="btn" data-qa="lk.verify" onclick="lkVerify()">재현 검증</button><button class="btn" data-qa="lk.csv" onclick="lkCsv()">사내 우편 CSV</button></div>'+(v?(v.ok&&v.same?band("pri","재현 같음 · 저장된 시드 · 대상으로 다시 계산해 기록과 같습니다"):band("bad","<b>재현 결과가 다릅니다.</b> "+esc(v.ok?"다른 줄 "+(v.nDiff||"?")+"개":pzWhy(v)))):""))+'</div>';
    h+=card("당첨 교체","발송 불가 · 자격 취소 · 예비 1순위가 이어받습니다",'<div class="fx"><input class="in" id="lkVE" style="width:110px" inputmode="numeric" placeholder="사번" value="'+esc(LK.vo.emp)+'" oninput="LK.vo.emp=this.value"><input class="in" id="lkVW" style="flex:1;min-width:160px" maxlength="60" placeholder="사유 · 예: 퇴사 · 발송 불가" value="'+esc(LK.vo.why)+'" oninput="LK.vo.why=this.value"><button class="btn" data-qa="lk.void" onclick="lkVoidAsk()">미리 보기</button></div>',"","mt16");
  } else {
    var N=d.lock?Number(d.lock.n)||0:Number(pool.n)||0, ready=d.ph==="lock"&&!d.stale;
    h+=card("대상 확정 · 추첨","행운권 번호 보유자 · "+esc(String(d.cut||"").slice(11,16))+" 서버 시각 기준",imp([["행운권 보유",n0((Number(pool.n)||0)+(Number(pool.lucky)||0))+"명"],["무대 1~6등 제외",n0(pool.lucky)+"명","loss"],["대상",n0(N)+"명","chg"],["당첨(예상)",n0(Math.min(N,qty))+"명"]])+
      (d.stale?band("warn","확정 뒤 기록이 바뀌었습니다. <b>다시 확정</b>해야 추첨합니다."):"")+
      '<div class="acts"><button class="btn pri" data-qa="lk.lock" onclick="lkLockAsk()"'+(d.ph==="open"||!rem?" disabled":"")+'>'+(d.ph==="lock"?"다시 확정":"대상 확정")+'</button><button class="btn danger fill" data-qa="lk.draw" onclick="lkDrawAsk()"'+(ready&&rem?"":" disabled")+'>7등 추첨 실행</button></div>'+
      '<p class="cap mt8">'+(d.ph==="open"?esc(String(d.cut||"").slice(0,16))+" 뒤에 확정합니다":!rem?"17:00 룰렛 잔여 다섯 숫자를 먼저 저장합니다":d.ph==="lock"&&d.lock?"확정 "+esc(short(d.lock.at||""))+" · "+n0(d.lock.n)+"명":"확정하면 대상이 기록에 남습니다")+'</p>')+'</div>';
  }
  var cv=LK.cfg||{ qty:String((d.cfg||{}).qty!=null?d.cfg.qty:d.qty||""), cut:String((d.cfg||{}).cut||d.cut||"") }, off=d.ph==="drawn"?" disabled":"";
  h+='<details class="memo mt16"><summary>7등 설정 · 당첨 '+esc(cv.qty||"-")+'명 · 기준 '+esc(String(cv.cut).slice(11,16)||"-")+'</summary><div class="mb"><div class="fx"><label class="fld">당첨 수<input class="in n" id="lkCq" style="width:90px" value="'+esc(cv.qty)+'" oninput="lkCfgIn(\'qty\',this.value)"'+off+'></label><label class="fld">풀 기준 시각<input class="in n" id="lkCc" style="width:170px" value="'+esc(cv.cut)+'" placeholder="2026-10-26 17:00" oninput="lkCfgIn(\'cut\',this.value)"'+off+'></label><button class="btn" style="align-self:flex-end" data-qa="lk.cfg.save" onclick="lkCfgSave()"'+off+'>설정 저장</button></div></div></details>';
  b.innerHTML=h; lkRemPaint("lkRem2");
}
function lkCfgIn(k, v){ var d=S.data.lk||{}; if(!LK.cfg) LK.cfg={ qty:String((d.cfg||{}).qty!=null?d.cfg.qty:d.qty||""), cut:String((d.cfg||{}).cut||d.cut||"") }; LK.cfg[k]=v; }
function lkCfgSave(){
  var d=S.data.lk||{}, o={ qty:String((d.cfg||{}).qty!=null?d.cfg.qty:d.qty||""), cut:String((d.cfg||{}).cut||d.cut||"") }, v=LK.cfg||o, p={}, rows=[], N={ qty:"당첨 수", cut:"풀 기준 시각" };
  Object.keys(N).forEach(function(k){ var a=String(o[k]).trim(), b=String(v[k]).trim(); if(a!==b){ p[k]=b; rows.push([N[k],esc(a||"(없음)")+" → "+esc(b||"(없음)"),"chg"]); } });
  if(!rows.length){ toast("바뀐 것이 없습니다"); return; }
  dialog({ t:"7등 설정을 바꿀까요?", x:imp(rows), s:"기준 시각을 바꾸면 대상을 다시 확정합니다. 활동 기록에 남습니다.", ok:"저장", onOk:function(){ pzCall("lk7_cfg",p,["lk7_state"],function(r){ if(r.ok){ LK.cfg=null; toast("저장했습니다"); } else toast("실패 · "+pzWhy(r)); }); } });
}
function lkLockAsk(){
  var d=S.data.lk||{}, pool=d.pool||{};
  if(!lkRemDone(d)){ toast("17:00 룰렛 잔여를 먼저 저장합니다"); return; }
  dialog({ t:"7등 대상을 확정할까요?", x:imp([["대상",n0(pool.n)+"명","chg"],["무대 1~6등 제외",n0(pool.lucky)+"명"],["17:00 룰렛 잔여",n0(lkTotal(d))+"개"]]), s:"추첨 전까지 다시 확정할 수 있습니다.", ok:d.ph==="lock"?"다시 확정":"확정",
    onOk:function(){ pzCall("lk7_lock",{},["lk7_state"],function(r){ toast(r.ok?"대상 "+n0(r.locked&&r.locked.n)+"명을 확정했습니다":"실패 · "+pzWhy(r)); }); } });
}
function lkDrawAsk(){
  var d=S.data.lk||{}, qty=lkQty(d), tot=lkTotal(d), N=d.lock?Number(d.lock.n)||0:0;
  if(!lkRemDone(d)){ toast("17:00 룰렛 잔여를 먼저 저장합니다"); return; }
  dialog({ t:"7등 랜덤 굿즈 추첨을 실행할까요?", who:"7등 랜덤 굿즈<span>대상 "+n0(N)+"명 · 당첨 "+n0(Math.min(N,qty))+"명</span>", x:tot<qty?band("warn","남은 경품 "+n0(tot)+"개 · 당첨 "+n0(qty)+"명보다 적습니다(안내만)."):"",
    s:"<b>한 번 실행하면 되돌릴 수 없습니다.</b> 시드 · 풀 해시가 남고 「재현 검증」으로 같은 결과를 다시 계산합니다. 결과는 참가자 앱 보상에 반영됩니다.", ok:"추첨 실행", danger:true,
    onOk:function(){ pzCall("lk7_draw",{ ack:"1" },["lk7_state"],function(r){ toast(r.ok?"추첨했습니다 · 당첨 "+n0(r.drawn&&r.drawn.W)+"명":"실패 · "+pzWhy(r),{ ms:5000 }); }); } });
}
function lkVerify(){ call("lk7_verify",{},function(r){ LK.ver=r||{ ok:false }; paint(); toast(r&&r.ok&&r.same?"재현 결과가 같습니다":"재현 결과를 확인합니다"); },function(e){ toast(why(e)); }); }
function lkVoidAsk(){
  var e=normE(LK.vo.emp), w=String(LK.vo.why||"").trim();
  if(!/^[0-9A-Z]{3,12}$/.test(e)){ toast("사번을 확인합니다"); return; }
  if(w.length<2){ toast("사유를 적습니다"); return; }
  call("lk7_void",{ emp:e, dry:"1" },function(r){
    if(!r||!r.ok){ toast("실패 · "+pzWhy(r)); return; }
    dialog({ t:"이 당첨을 취소할까요?", who:esc(r.name||"-")+" · "+esc(e)+"<span>7등 랜덤 굿즈</span>", x:imp([["사유",esc(w)],["승계",r.sub?esc(r.sub.name||"-")+" · "+esc(r.sub.emp||"")+(r.sub.rk?" (예비 "+r.sub.rk+"순위)":""):"예비 없음 · 경품 보관",r.sub?"chg":"loss"]]),
      s:"<b>되돌릴 수 없습니다.</b> 승계자는 앱에서 당첨으로 바뀝니다.", ok:"당첨 취소", danger:true,
      onOk:function(){ pzCall("lk7_void",{ emp:e, why:w },["lk7_state"],function(x){ if(x.ok){ LK.vo={ emp:"", why:"" }; toast("취소했습니다"+(x.sub?" · 예비 승계":" · 경품 보관"),{ ms:5000 }); } else toast("실패 · "+pzWhy(x)); }); } });
  },function(e2){ toast(why(e2)); });
}
function lkResetAsk(){
  dialog({ t:"7등 시험 데이터를 비울까요?", s:"확정 · 추첨 결과 · 잔여 입력을 지웁니다. 설정은 남습니다. 행사일(10/26)에는 서버가 받지 않습니다. <b>되돌릴 수 없습니다.</b>", ok:"비우기", danger:true, x2:1,
    onOk:function(){ pzCall("lk7_reset",{ confirm:"RESET" },["lk7_state"],function(r){ if(r.ok){ LK.ver=null; LK.rem=null; } toast(r.ok?"비웠습니다":"실패 · "+pzWhy(r)); }); } });
}
function lkCsv(){
  call("lk7_export",{},function(r){
    if(!r||!r.ok){ toast("실패 · "+pzWhy(r)); return; }
    var rows=r.rows||[]; csvSave("7등랜덤굿즈_사내우편_"+csvDay(r.t)+".csv",["순번","사번","이름","부문","당첨 번호","당첨 시각"],rows.map(function(x){ return [x.no,x.emp,x.name,x.dept,x.set,x.at]; }));
    toast("내려받았습니다 · "+rows.length+"줄");
  },function(e){ toast(why(e)); });
}
/* ── 아이디어왕 ── */
function ikPrz(d){ return d&&d.prz&&d.prz.length?d.prz:IK_PRZ; }
function ikPickOf(emp){ var d=S.data.ik, ps=d&&d.ok&&d.picks||[]; for(var i=0;i<ps.length;i++) if(normE(ps[i].emp)===normE(emp)) return ps[i]; return null; }
function ikRow(emp){ var L=S.data.ikl, rs=L&&L.ok&&L.rows||[]; for(var i=0;i<rs.length;i++) if(normE(rs[i].emp)===normE(emp)) return rs[i]; return null; }
function ikPaint(b){
  var d=S.data.ik;
  if(!d){ b.innerHTML=skel(); return; }
  if(unknownSrv(d)){ b.innerHTML=srvMissing("아이디어왕"); return; }
  if(!d.ok){ b.innerHTML=loadErr(d,"ik"); return; }
  var P=IK_PH[d.ph]||["-",""], C=d.cand||{}, prz=ikPrz(d), picks=d.picks||[], mx=d.max||5;
  var slots='<div class="slots">'+prz.map(function(z){ var got=picks.filter(function(p){ return Number(p.rk)===Number(z.rk); }), out="";
    for(var i=0;i<(Number(z.n)||0);i++){ var p=got[i];
      out+='<div class="slot'+(p?" got":"")+'"><div class="fx"><b>'+z.rk+'등</b><span class="cap">AI 구독권 '+z.mo+'개월</span></div>'+(p?'<div class="mt8"><b>'+esc(p.name||"-")+'</b> <span class="cap">'+esc(p.emp)+'</span></div><div class="cap">'+esc(IK_CH[p.ch]||p.ch||"")+(p.why?" · "+esc(p.why):"")+'</div><div class="acts" style="margin-top:8px"><button class="btn sm" data-qa="ik.unpick" onclick="ikUnpickAsk(\''+jq(p.emp)+'\')">선정 취소</button></div>':'<div class="cap mt8">비어 있음</div>')+'</div>'; }
    return out; }).join("")+'</div>';
  var L=S.data.ikl, rows=L&&L.ok?L.rows||[]:[];
  var seg='<span class="seg">'+["lounge_pre","lounge_day","chat"].map(function(k){ return '<button class="'+(IK.ch===k?"on":"")+'" data-qa="ik.ch.'+k+'" onclick="ikCh(\''+k+'\')">'+esc(IK_CH[k])+' <span class="c">'+n0(C[k])+'</span></button>'; }).join("")+'</span>';
  var tb=!L?skel():!L.ok?loadErr(L,"ikl"):'<div class="scrl"><table class="tb"><colgroup><col style="width:60px"><col style="width:150px"><col><col style="width:120px"><col style="width:80px"></colgroup><thead><tr><th>시각</th><th>사람</th><th>아이디어</th><th>상태</th><th class="r"></th></tr></thead><tbody>'+
    (rows.length?rows.map(function(r){ var pk=ikPickOf(r.emp), key=jq(r.emp), op=!!IK.open[key], tx=String(r.text||""), lg=tx.length>60;
      return '<tr><td class="n cap">'+esc(String(r.at||"").slice(11,16)||"-")+'</td><td class="nm"><b>'+esc(r.name||"-")+'</b><div>'+esc(r.emp)+'</div></td><td class="wrap">'+(tx?esc(op||!lg?tx:tx.slice(0,60)+"…"):'<span class="cap">본문 없음</span>')+(lg?' <button class="lnk" onclick="ikOpen(\''+key+'\')">'+(op?"접기":"전체")+'</button>':'')+'</td><td>'+(r.late?tag("마감 뒤","warn")+" ":"")+(pk?tag(pk.rk+"등","ok"):"")+'</td><td class="r">'+(pk?'':'<button class="btn sm pri" data-qa="ik.pick" onclick="ikPickAsk(\''+key+'\')">선정</button>')+'</td></tr>'; }).join(""):
      '<tr><td colspan="5"><div class="empty"><b>이 경로의 후보가 없습니다</b></div></td></tr>')+'</tbody></table></div>';
  b.innerHTML='<div class="fx" style="margin-bottom:12px">'+tag(P[0],P[1])+'<span class="cap">마감 <b class="n">'+esc(d.cut||"없음")+'</b> · 접수 '+(d.open?"열림":"닫힘")+' · 선정 <b class="n">'+picks.length+' / '+mx+'</b></span></div>'+card("선정","1등 1 · 2등 1 · 3등 3 · AI 구독권",slots)+
    '<div class="card mt16"><div class="bar">'+seg+'<span class="sp"></span><label class="cap"><input type="checkbox" data-qa="ik.late"'+(IK.late?" checked":"")+' onchange="ikLate(this.checked)"> 마감 뒤 접수도</label></div>'+tb+'</div>';
}
function ikCh(k){ IK.ch=k; S.at.ikl=0; S.data.ikl=null; paint(); load(false); }
function ikLate(v){ IK.late=v?1:0; S.at.ikl=0; S.data.ikl=null; paint(); load(false); }
function ikOpen(k){ IK.open[k]=!IK.open[k]; paint(); }
function ikPickAsk(emp){
  var d=S.data.ik||{}, r=ikRow(emp)||{ emp:emp }, prz=ikPrz(d), picks=d.picks||[];
  var opts=prz.map(function(z){ var left=Math.max(0,(Number(z.n)||0)-picks.filter(function(p){ return Number(p.rk)===Number(z.rk); }).length); return '<option value="'+z.rk+'"'+(left?"":" disabled")+'>'+z.rk+'등 · AI 구독권 '+z.mo+'개월 · 남은 자리 '+left+'</option>'; }).join("");
  dialog({ t:"아이디어왕으로 선정할까요?", who:esc(r.name||emp)+"<span>사번 "+esc(emp)+" · "+esc(IK_CH[r.ch]||r.ch||IK_CH[IK.ch])+"</span>",
    x:'<label class="fld mt12">등수<select class="in" style="width:100%" id="ikRk" onchange="dlgGate()"><option value="">고릅니다</option>'+opts+'</select></label><label class="fld mt8">선정 사유(필수)<input class="in" style="width:100%" id="ikWhy" maxlength="80" oninput="dlgGate()" placeholder="예: 보상 서류 자동 분류 · 바로 적용 가능"></label>'+
      (r.late?'<label class="fx mt12"><input type="checkbox" id="ikAck" onchange="dlgGate()"><span>마감 뒤 접수입니다. 그래도 선정합니다.</span></label>':''),
    s:"Closing Speech 에서 사회자가 이름을 읽습니다. 7초 동안 되돌릴 수 있고, 뒤에는 「선정 취소」로 돌립니다.", ok:"선정", focus:"ikRk",
    gate:function(){ var k=el("ikRk"), w=el("ikWhy"), a=el("ikAck"); return !!(k&&k.value)&&String((w||{}).value||"").trim().length>=2&&(!r.late||!!(a&&a.checked)); },
    onOk:function(){ var rk=el("ikRk").value, w=String(el("ikWhy").value).trim();
      pzCall("ideaking_pick",{ emp:normE(emp), rk:rk, why:w, ack:r.late?"1":"" },["ideaking_state"],function(x){ if(x.ok){ if(x.picks&&S.data.ik) S.data.ik.picks=x.picks; paint(); toast(rk+"등으로 선정했습니다 · "+(r.name||emp),{ undo:function(){ ikUnpickGo(emp); } }); } else toast("실패 · "+(x.reason==="max"?rk+"등 자리가 다 찼습니다. 먼저 한 명을 선정 취소합니다":pzWhy(x)),{ ms:5000 }); }); } });
}
function ikUnpickAsk(emp){ var p=ikPickOf(emp)||{ emp:emp }; dialog({ t:"선정을 취소할까요?", who:esc(p.name||emp)+"<span>사번 "+esc(emp)+(p.rk?" · "+p.rk+"등":"")+"</span>", s:"후보로 돌아갑니다. 활동 기록에 남습니다.", ok:"선정 취소", danger:true, onOk:function(){ ikUnpickGo(emp); } }); }
function ikUnpickGo(emp){ pzCall("ideaking_unpick",{ emp:normE(emp) },["ideaking_state"],function(x){ if(x.ok){ var d=S.data.ik; if(d&&d.picks) d.picks=d.picks.filter(function(p){ return normE(p.emp)!==normE(emp); }); paint(); toast("선정을 취소했습니다 · "+emp); } else toast("실패 · "+pzWhy(x)); }); }
/* ── 타자왕 · 읽기 · 261016 1~10위(사용자 확정 2안) · 1~3위 = 시상 줄(네이비) · 4~10위 = 한 단계 작게 + 「엑셀 단축키 데스크 매트」 묶음 머리 한 줄 · 서버가 5명만 줘도 있는 만큼만 그린다 ── */
function tyRow(r, lo){
  return '<tr'+(lo?' class="tyl"':'')+'><td class="n">'+(lo?r.rank+'위':'<b class="ty1">'+r.rank+'위</b>')+'</td><td>'+(lo?esc(r.nick||"-"):'<b>'+esc(r.nick||"-")+'</b>')+'</td><td>'+esc(r.name||"-")+' <span class="cap">'+esc(r.emp||"")+'</span></td><td class="n r">'+(lo?n0(r.score):'<b class="ty1">'+n0(r.score)+'</b>')+'</td><td class="n r hm">'+esc(r.acc!=null?r.acc+"%":"-")+'</td><td class="n cap hm">'+esc(short(r.ts))+'</td></tr>';
}
function tyPaint(b){
  var d=S.data.tres;
  if(!d){ b.innerHTML=skel(); return; }
  if(!d.ok){ b.innerHTML=loadErr(d,"tres"); return; }
  var all=(d.top||[]).slice(0,TY_N), top=all.slice(0,3), rest=all.slice(3);
  b.innerHTML=card("1F 현장 타자왕 1~"+TY_N+"위","1~3위는 사회자가 닉네임으로 부르고 실명으로 상품을 전달합니다",'<table class="tb"><thead><tr><th style="width:60px">순위</th><th>닉네임</th><th>이름</th><th class="r">점수</th><th class="r hm">정확도</th><th class="hm">시각</th></tr></thead><tbody>'+
    (all.length?top.map(function(r){ return tyRow(r,0); }).join("")+(rest.length?'<tr class="tyg"><td colspan="6">4~'+rest[rest.length-1].rank+'위 '+rest.length+'명 · 엑셀 단축키 데스크 매트</td></tr>'+rest.map(function(r){ return tyRow(r,1); }).join(""):""):'<tr><td colspan="6"><div class="empty"><b>아직 기록이 없습니다</b></div></td></tr>')+'</tbody></table>'+
    '<p class="cap mt8">집계 시간 '+esc((d.win||[]).join(" · ")||"-")+'</p>');
}
