/* AXF CONTROL v2 · 재고 장부 · 사이즈 교환 · 체크인 번호 (261016 3단계 · 지금 콘솔에만 있던 재고 조정 · 입고 · 교환 기록 · 체크인 번호 명단 · 261016 창구 글자 걷음)
 * 경품 · 재고 › 재고 장부 = inv_state 품목 표(공통 명단 표) · 줄 누르면 서랍(남은 수 · 맞추기 · 총수량 · 입고 · 누가 받았나 inv_list · 기록 되돌리기 inv_undo)
 *   남은 수 맞추기 = inv_adjust(id · cnt · why · memo) · 총수량 · 입고 = inv_cfg(id · q · memo) · 확인 창만(PIN 없음 · 콘솔 사람 입장이면 서버가 받는다)
 * 처리함 › 체크인존 = 사이즈 교환(inv_swap · 되돌리기 inv_undo) · 교환 기록(inv_state swap) · 명단 밖 지급(inv_list k1 · 명단 밖 줄)
 *   체크인 번호 = ck_no_state(세션별 현황) · 번호 매기기 ck_no_assign(확인 문구 「번호매기기」) · 체크인 번호 명단 ck_no_list(공통 명단 표 · 엑셀)
 * 금액 표시 없음 · 사번 · 이름만(부문 통계 없음). */
var IV={ g:null, lat:{}, list:{}, gsw:null, gout:null, gno:null };
var IV_KIND={ give:"나감", box:"박스 개봉", chk:"체크인", adj:"남은 수 맞추기", cfg:"품목 편집", "void":"되돌림", auto:"자동", swap:"사이즈 교환" };
var IV_PLACE={ swap:"사이즈 교환", roulette:"룰렛", gate:"체크인존", box:"박스", console:"콘솔", lucky:"행운권", fin:"참여상 추첨", type:"타자왕", dap:"상담", fcfs:"선착순", lk7:"7등 굿즈", idea:"아이디어왕" };
var IV_WHY0=["분실","파손","추가 입고","세기 오류","기타"];
var KS4=["SS","L","2XL","3XL"], KS4_AB={ SS:"A", L:"B", "2XL":"C", "3XL":"D" };
function ivWhy(r){ r=r||{}; return { dup:"이 사번은 이미 받았습니다", notfound:"품목이나 기록을 찾지 못했습니다", already:"이미 되돌린 기록입니다", kind:"조정 · 편집 기록은 되돌리지 않습니다(다시 맞춥니다)", noq:"총수량이 정해진 품목만 맞춥니다", memo:"사유를 2~60자로 넣습니다", same:"바뀐 것이 없습니다", drawn:"참여상 추첨 뒤라 룰렛 · 가습기 수량은 바꾸지 않습니다", q:"총수량을 확인합니다", size:"두 사이즈를 다르게 고릅니다", word:"확인 문구가 다릅니다" }[r.reason]||why(r); }
function ivItems(){ var d=S.data.inv; return d&&d.ok?(d.items||[]):null; }
function ivItem(id){ return (ivItems()||[]).filter(function(x){ return x.id===id; })[0]||null; }
function ivSt(it){ if(it.q==null) return ["수량 미정","off"]; if(!it.on) return ["안 씀","off"]; var l=num(it.left), q=num(it.q), w=num(it.w)||15; return l<=0?["없음","bad"]:q&&l<=q*0.05?["곧 바닥","bad"]:q&&l<=q*w/100?["적음","warn"]:["여유","ok"]; }

/* ── 경품 · 재고 › 재고 장부(표) ── */
function ivTable(ph){
  if(!ph) return;
  if(!IV.g) IV.g=XG.make({ id:"inv", file:"재고 장부", key:function(r){ return r.id; }, sort:{ k:"ord", d:1 }, ph:"품목 찾기",
    chips:[["all","전체",null],["roul","룰렛",function(r){ return r.src==="roul"; }],["box","지급품",function(r){ return r.src==="box"; }],["low","적음 · 없음",function(r){ return ivSt(r)[1]!=="ok"&&r.q!=null&&r.on; }]],
    cols:[{ k:"ord", t:"순서", type:"num", w:56 },{ k:"n", t:"품목", w:180 },{ k:"how", t:"세는 곳", w:120 },{ k:"q", t:"처음 수량", type:"num", w:84 },{ k:"out", t:"나감", type:"num", w:70 },
      { k:"left", t:"남음", type:"num", w:70, f:function(r){ return r.q==null?'<span class="cap">-</span>':'<b>'+n0(r.left)+'</b>'; } },
      { k:"st", t:"상태", w:90, v:function(r){ return ivSt(r)[0]; }, f:function(r){ var s=ivSt(r); return tag(s[0],s[1]); } }],
    src:{ a:"inv_state", pick:function(res){ return ivRows(res.items||[]); } }, empty:"품목이 없습니다", h:420, onRow:function(k){ ivOpen(k); } });
  var gt=dataGate("inv","재고"), it=ivItems(); IV.g.gate=gt||""; XG.set(IV.g, gt||!it?null:ivRows(it), ph);
}
function ivRows(items){ return items.map(function(x,i){ var o={}; for(var k in x) o[k]=x[k]; o.ord=i+1; return o; }); }
function ivAfter(id){ delete IV.list[id]; reload(["inv"]); setTimeout(function(){ if(DRW.k==="inv:"+id) ivOpen(id); },900); }
function ivListLoad(id){
  if(IV.list[id]&&!(IV.list[id]!=="busy"&&num(S.at.inv)>num(IV.lat[id])+1500)) return; IV.list[id]="busy"; IV.lat[id]=Date.now();   /* 재고를 다시 받으면 목록도 다시 */
  call("inv_list",{ id:id }).then(function(r){ IV.list[id]=r||{ ok:false }; if(DRW.k==="inv:"+id) ivOpen(id); });
}
function ivOpen(id){
  var it=ivItem(id); if(!it){ drwClose(); return; }
  ivListLoad(id);
  var s=ivSt(it), L=IV.list[id], J=jq(id);
  var h=drwHead(it.n, (it.how||"")+(it.q==null?" · 수량 미정":" · 처음 "+n0(it.q)+" · 나감 "+n0(it.out)), " "+tag(s[0],s[1]));
  h+='<div class="iv-big"><span class="cap">남은 수</span><b>'+(it.q==null?"-":n0(it.left))+'</b></div>';
  h+='<div class="btns mt">'+(it.q!=null?'<button class="btn pri" type="button" onclick="ivAdjAsk(\''+J+'\')">남은 수 맞추기</button>':'')+'<button class="btn" type="button" onclick="ivCfgAsk(\''+J+'\')">총수량 · 입고</button></div>';
  h+='<dl class="cc-kv mt"><dt>최근 30분</dt><dd>'+n0(it.r30)+'</dd><dt>자동 나감</dt><dd>'+(it.auto?n0(it.auto):"-")+'</dd><dt>박스당</dt><dd>'+(it.box?n0(it.box)+"개":"-")+'</dd><dt>경고율</dt><dd>'+n0(it.w||15)+'%</dd>'+(it.note?'<dt>메모</dt><dd>'+esc(it.note)+'</dd>':'')+'</dl>';
  var rows=L&&L.ok?(L.rows||[]):[];
  h+='<h3 class="iv-h">누가 받았나'+(L&&L.ok?' · '+n0(rows.length)+'줄':'')+'</h3>';
  if(!L||L==="busy") h+=skel();
  else if(!L.ok) h+='<p class="cap">받지 못했습니다 · '+esc(ivWhy(L))+'</p>';
  else if(!rows.length) h+='<p class="cap">아직 없습니다</p>';
  else h+='<ul class="iv-ls">'+rows.slice(0,60).map(function(r){ var can=!r.v&&r.rid&&["give","box","chk","swap"].indexOf(r.k)>=0;
    return '<li'+(r.v?' class="dim"':'')+'><div><b>'+esc(r.emp?whoOf(r).n||"-":r.name||"-")+'</b>'+(r.emp?whoFlags(whoOf(r)):"")+' <span class="cap n">'+esc((r.emp?whoSub(r)+' · ':'')+fmtD(r.t))+'</span><div class="cap">'+esc((IV_KIND[r.k]||r.k)+(r.place?" · "+(IV_PLACE[r.place]||r.place):"")+(r.why?" · "+r.why:"")+(r.q&&r.q!==1?" · "+r.q+"개":""))+(r.v?" · 되돌림":"")+'</div></div>'+
      (can?'<button class="btn sm" type="button" onclick="ivUndoAsk(\''+jq(r.rid)+'\',\''+J+'\')">되돌리기</button>':'')+'</li>'; }).join("")+'</ul>'+(rows.length>60?'<p class="cap">앞 60줄 · 전체 '+n0(rows.length)+'줄</p>':'');
  drwOpen("inv:"+id, h+'</div>', { g:IV.g, label:it.n+" 재고 상세" });
}
function ivAdjAsk(id){
  var it=ivItem(id); if(!it||it.q==null) return;
  var whys=(S.data.inv&&S.data.inv.why)||IV_WHY0; IV.why="";
  confirmBox({ t:"남은 수를 맞출까요?", who:it.n, sub:"지금 남은 수 "+n0(it.left)+" · 실물을 센 수를 넣습니다",
    body:'<label class="fld">실물 센 수<input class="in n" id="ivAc" inputmode="numeric" maxlength="5" autocomplete="off" oninput="this.value=this.value.replace(/\\D/g,\'\');ivAdjDiff('+num(it.left)+');gateUpd()"></label><div class="cap mt4" id="ivAd">-</div>'+
      '<div class="fld">사유</div><div class="chips" id="ivWy">'+whys.map(function(w){ return '<button type="button" class="chip" aria-pressed="false" onclick="ivWhyPick(this)">'+esc(w)+'</button>'; }).join("")+'</div>'+
      '<label class="fld">메모(선택 · 비우면 「현장 실사」)<input class="in" id="ivAm" maxlength="60" autocomplete="off"></label>',
    focus:"ivAc", ok:"맞추기", danger:true, gate:function(){ var v=String((el("ivAc")||{}).value||""); return v!==""&&!!IV.why; },
    run:function(){ var m=String(el("ivAm").value||"").trim(); return call("inv_adjust",{ id:id, cnt:String(Number(el("ivAc").value)), why:IV.why, memo:m.length>=2?m:"현장 실사" }); },
    fail:function(r){ return "맞추지 못했습니다 · "+ivWhy(r); },
    done:function(r){ var w=IV.why; toast("맞췄습니다 · "+(r.n||it.n)+" "+n0(r.before)+" → "+n0(r.after),r.delta?{ undo:function(){ ivAdjUndo(id, r, w); } }:{}); ivAfter(id); } });
}
/* 261017 맞추기 되돌리기(토스트 7초) = 같은 inv_adjust 로 맞추기 전 남은 수로 · 서버 새 액션 없음 · 원장에 「맞추기 되돌림」 줄이 하나 더 남음 */
function ivAdjUndo(id, r, w){
  call("inv_adjust",{ id:id, cnt:String(num(r.before)), why:w||"기타", memo:"맞추기 되돌림("+num(r.after)+" → "+num(r.before)+")" }).then(function(x){
    if(x&&x.ok){ toast("되돌렸습니다 · "+(x.n||id)+" "+n0(x.before)+" → "+n0(x.after)); ivAfter(id); } else toast("되돌리지 못했습니다 · "+ivWhy(x),{ bad:1 }); });
}
function ivAdjDiff(left){ var i=el("ivAc"), o=el("ivAd"); if(!i||!o) return; var v=i.value; if(v===""){ o.textContent="-"; return; } var n=Number(v), d=n-left; o.textContent=n0(left)+" → "+n0(n)+" · 차이 "+(d>0?"+":"")+n0(d); }
function ivWhyPick(b){ var on=b.getAttribute("aria-pressed")==="true"; Array.prototype.forEach.call(el("ivWy").children,function(x){ x.classList.remove("on"); x.setAttribute("aria-pressed","false"); }); if(!on){ b.classList.add("on"); b.setAttribute("aria-pressed","true"); IV.why=b.textContent; } else IV.why=""; gateUpd(); }
function ivCfgAsk(id){
  var it=ivItem(id); if(!it) return;
  confirmBox({ t:"총수량을 바꿀까요?", who:it.n, sub:"입고 · 수량 정정 · 지금 총수량 "+(it.q==null?"미정":n0(it.q))+" · 나감 "+n0(it.out),
    body:'<label class="fld">새 총수량'+(it.id==="hum"?" · 가습기 = 참여상 수량과 함께":"")+'<input class="in n" id="ivCq" inputmode="numeric" maxlength="5" autocomplete="off" value="'+(it.q==null?"":esc(it.q))+'" oninput="this.value=this.value.replace(/\\D/g,\'\');ivCfgDiff('+(it.q==null?"null":num(it.q))+');gateUpd()"></label><div class="cap mt4" id="ivCd">-</div>'+
      '<label class="fld">사유(2~60자 · 예 「추가 입고 2박스」)<input class="in" id="ivCm" maxlength="60" autocomplete="off" oninput="gateUpd()"></label>',
    focus:"ivCq", ok:"저장", danger:true, gate:function(){ var q=String((el("ivCq")||{}).value||""), m=String((el("ivCm")||{}).value||"").trim(); return q!==""&&m.length>=2&&Number(q)!==it.q; },
    run:function(){ return call("inv_cfg",{ id:id, q:String(Number(el("ivCq").value)), memo:String(el("ivCm").value).trim() }); },
    fail:function(r){ return "저장하지 못했습니다 · "+ivWhy(r); },
    done:function(r){ toast("저장했습니다"+((r.ch||[]).length?" · "+r.ch.join(" · "):"")); ivAfter(id); } });
}
function ivCfgDiff(q0){ var i=el("ivCq"), o=el("ivCd"); if(!i||!o) return; var v=i.value; if(v===""){ o.textContent="-"; return; } var n=Number(v); o.textContent=(q0==null?"미정":n0(q0))+" → "+n0(n)+(q0!=null?" · "+(n-q0>0?"+":"")+n0(n-q0):""); }
function ivUndoAsk(rid, id){
  var it=ivItem(id);
  confirmBox({ t:"이 기록을 되돌릴까요?", who:(it?it.n:"재고")+" · 기록 "+rid, sub:"원장에 되돌림 한 줄이 남습니다(지우지 않음) · 이 기록만큼 남은 수가 돌아옵니다", ok:"되돌리기", danger:true,
    run:function(){ return call("inv_undo",{ rid:rid }); }, fail:function(r){ return "되돌리지 못했습니다 · "+ivWhy(r); },
    done:function(r){ toast("되돌렸습니다 · "+(r.n||(it&&it.n)||"")); delete IV.list[id]; reload(["inv"]); if(id==="k1") ckExtra(); setTimeout(function(){ if(DRW.k==="inv:"+id) ivOpen(id); },900); } });
}

/* ── 처리함 › 체크인존 · 사이즈 교환 · 명단 밖 지급 · 체크인 번호 ── */
function ckExtraHtml(){
  return '<div class="card mt"><h2>사이즈 교환 <span class="cap" id="swCap"></span><span class="r"><button class="btn sm pri" type="button" onclick="swAsk()">교환 기록</button></span></h2><div id="swL"></div></div>'+
    '<div class="card mt"><h2>명단 밖 지급 <span class="cap">여유 키트 · 재고 장부 기록</span></h2><div id="outL"></div></div>'+
    '<div class="card mt"><h2>체크인 번호 <span class="cap">10F 사전 신청자 · 세션별 가나다순 고정</span></h2><div id="cnK"></div><div id="cnL" class="mt"></div></div>';
}
function ckExtra(){ delete IV.list.k1; ivListLoad("k1"); }
function ckExtraPaint(){
  /* 교환 기록 · inv_state swap */
  var iv=S.data.inv, sw=iv&&iv.ok?iv.swap:null, net=sw?KS4.map(function(z){ var v=num((sw.net||{})[z]); return KS4_AB[z]+"("+z+") "+(v>0?"+":"")+v; }).join(" · "):"";
  if(el("swCap")) el("swCap").textContent=sw?"지금까지 "+n0(sw.n)+"건 · 현물 "+net:"";
  if(!IV.gsw) IV.gsw=XG.make({ id:"swap", file:"사이즈 교환 기록", key:function(r){ return r.rid; }, sort:{ k:"t", d:-1 },
    cols:[{ k:"t", t:"시각", type:"date", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"name", t:"이름", w:90 },{ k:"why", t:"교환", w:200, v:function(r){ return String(r.why||"").replace(/^교환 /,""); } },{ k:"by", t:"처리", w:90 },
      { t:"", w:96, act:function(r){ return '<button class="btn sm" type="button" onclick="ivUndoAsk(\''+jq(r.rid)+'\',\'k1\')">되돌리기</button>'; } }],
    src:{ a:"inv_state", pick:function(res){ return (res.swap&&res.swap.rows)||[]; } }, empty:"교환 기록이 없습니다", h:300 });
  var gt=dataGate("inv","교환 기록"); IV.gsw.gate=gt?gt:(iv&&iv.ok&&!sw?laterH("사이즈 교환 기록"):"");
  XG.set(IV.gsw, gt?null:(sw?swRows(sw.rows||[]):[]), el("swL"));
  /* 명단 밖 지급 · inv_list k1 */
  ivListLoad("k1");
  var L=IV.list.k1;
  if(!IV.gout) IV.gout=XG.make({ id:"kout", file:"명단 밖 지급", key:function(r){ return r.rid||(r.emp+r.t); }, sort:{ k:"t", d:-1 },
    chips:[["all","전체",null],["give","지급",function(r){ return r.k==="give"&&!r.v; }],["chk","체크인만",function(r){ return r.k==="chk"; }],["v","되돌림",function(r){ return !!r.v; }]],
    cols:[{ k:"t", t:"시각", type:"date", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"name", t:"이름", w:90 },{ k:"kk", t:"구분", w:100, v:function(r){ return (IV_KIND[r.k]||r.k)+(r.v?" · 되돌림":""); } },{ k:"by", t:"처리", w:90 },
      { t:"", w:96, act:function(r){ return !r.v&&r.rid&&r.k==="give"?'<button class="btn sm" type="button" onclick="ivUndoAsk(\''+jq(r.rid)+'\',\'k1\')">되돌리기</button>':''; } }],
    src:{ a:"inv_list", p:{ id:"k1" }, pick:function(res){ return outRows(res.rows||[]); } }, empty:"명단 밖 지급이 없습니다", h:300 });
  IV.gout.gate=!L||L==="busy"?"":L.ok?"":'<span class="cap">받지 못했습니다 · '+esc(ivWhy(L))+'</span>';
  XG.set(IV.gout, L&&L!=="busy"&&L.ok?outRows(L.rows||[]):(L&&L!=="busy"?[]:null), el("outL"));
  cnPaint();
}
function swRows(rows){ var who=swWho(); return rows.map(function(r){ var o={}; for(var k in r) o[k]=r[k]; o.name=who[r.emp]||""; return o; }); }
function swWho(){ var m={}, L=IV.list.k1; if(L&&L.ok) (L.rows||[]).forEach(function(r){ if(r.emp&&r.name) m[r.emp]=r.name; }); return m; }
function outRows(rows){ return rows.filter(function(r){ return /명단 밖/.test(r.why||""); }); }
function swAsk(){
  var op=function(id){ return '<select class="in" id="'+id+'" onchange="gateUpd()"><option value="">사이즈</option>'+KS4.map(function(z){ return '<option value="'+z+'">'+KS4_AB[z]+' ('+z+')</option>'; }).join("")+'</select>'; };
  confirmBox({ t:"사이즈 교환을 기록할까요?", who:"재고 장부에 교환 한 줄", sub:"키트 나감 · 체크인 수는 그대로 · 잘못 적으면 되돌리기",
    body:'<label class="fld">사번<input class="in n" id="swE" inputmode="numeric" maxlength="12" autocomplete="off" oninput="gateUpd()"></label><label class="fld">돌려받은 사이즈'+op("swF")+'</label><label class="fld">새로 가져간 사이즈'+op("swT")+'</label><label class="fld">메모(선택)<input class="in" id="swM" maxlength="40" autocomplete="off"></label>',
    focus:"swE", ok:"교환 기록", gate:function(){ var e=String((el("swE")||{}).value||"").trim(), f=(el("swF")||{}).value, t=(el("swT")||{}).value; return /^[0-9A-Za-z]{3,12}$/.test(e)&&!!f&&!!t&&f!==t; },
    run:function(){ return call("inv_swap",{ emp:String(el("swE").value).trim(), from:el("swF").value, to:el("swT").value, memo:String(el("swM").value||"").trim() }); },
    fail:function(r){ return "기록하지 못했습니다 · "+ivWhy(r); },
    done:function(r){ reload(["inv"]); ckExtra();
      toast("교환 기록 · "+(r.name||r.emp)+" · "+r.from+" → "+r.to,{ undo:function(){ call("inv_undo",{ rid:r.rid }).then(function(x){ toast(x&&x.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+ivWhy(x),{ bad:!(x&&x.ok) }); reload(["inv"]); ckExtra(); }); } }); } });
}
/* 체크인 번호 */
function cnPaint(){
  var k=el("cnK"); if(!k) return;
  var gt=dataGate("cno","체크인 번호"), d=S.data.cno;
  if(gt){ k.innerHTML=gt; }
  else if(!d.seg){ k.innerHTML='<p class="cap">이 서버는 세션별 번호를 아직 모릅니다</p>'; }
  else {
    var sg=d.seg, segs=["A","B","C","D","E"];
    k.innerHTML='<div class="grid g4">'+kpi({ l:"10F 사전 신청", v:n0(d.list), u:"명", s:d.lng?"라운지만 신청 "+n0(d.lng)+"명은 번호 없음":"" })+kpi({ l:"번호 있음", v:n0(d.has), u:"명", s:d.moved?"세션 바뀜 "+n0(d.moved)+"명 · 번호 그대로":"" })+
      kpi({ l:"번호 없음", v:n0(num(d.pend)+num(d.nseg)), u:"명", st:d.pend||d.nseg||d.spend?"warn":"", s:(d.nseg?"세션 모름 "+n0(d.nseg)+"명":"")+(d.spend?(d.nseg?" · ":"")+"스태프 "+n0(d.spend)+"명":"") })+kpi({ l:"명단에서 빠짐", v:n0(d.gone), u:"명", s:"번호 비움 · 새로 든 사람이 받음" })+'</div>'+
      '<div class="xg-wrap mt" style="--xg-h:auto"><table class="tb"><thead><tr><th>세션</th><th class="n">명단</th><th class="n">번호 있음</th><th class="n">번호 없음</th><th class="n">마지막 번호</th></tr></thead><tbody>'+
      segs.map(function(g){ var x=sg[g]||{}; return '<tr><td><b>'+g+'</b></td><td class="n">'+n0(x.list||0)+'</td><td class="n">'+n0(x.has||0)+'</td><td class="n">'+(x.pend?'<b>'+n0(x.pend)+'</b>':"0")+'</td><td class="n">'+(x.max?g+"-"+x.max:"-")+'</td></tr>'; }).join("")+'</tbody></table></div>'+
      '<div class="btns mt"><button class="btn'+(cnPend(d)?" pri":"")+'" type="button" onclick="'+(d.has||!d.pend?"cnFillAsk()":"cnAsk()")+'"'+(cnPend(d)?'':' disabled')+'>'+(cnPend(d)?(d.has||!d.pend?"빈 번호 채우기 · "+n0(cnPend(d))+"명":"번호 매기기 · "+n0(d.pend)+"명"):"새로 매길 사람 없음")+'</button></div>'+
      '<p class="cap mt">'+(d.at?"마지막으로 매긴 시각 "+esc(fmtD(d.at))+" · ":"")+'번호 = 세션 글자 + 세션 안 순번(A-1 · E 는 두 회차 한 줄) · 한 번 매긴 번호는 바뀌지 않습니다 · 10F 명단에 한 사람을 넣으면 그 세션의 가장 작은 빈 번호가 자동으로 붙습니다</p>';
  }
  if(!IV.gno) IV.gno=XG.make({ id:"ckno", file:"체크인 번호 명단", key:function(r){ return r.no; }, sort:{ k:"no", d:1 },
    chips:[["all","전체",null]].concat(["A","B","C","D","E"].map(function(g){ return [g,g,function(r){ return r.seg===g; }]; })),
    cols:[{ k:"seg", t:"세션", w:60 },{ k:"no", t:"번호", w:80, v:function(r){ return r.no; }, f:function(r){ return '<b>'+esc(r.no)+'</b>'; } },{ k:"name", t:"이름", w:100 },{ k:"dept", t:"부서", w:140 },{ k:"sz", t:"사이즈", w:100, v:function(r){ return r.hum?"가습기 대체":r.sz||""; } }],
    src:{ a:"ck_no_list" }, whoPool:"kit", empty:"번호를 매긴 사람이 없습니다", h:420, onRow:function(k){ rowDetail(IV.gno,k,{ title:function(r){ return r.no+" · "+(whoOf(r).n||""); } }); } });
  var L=S.data.cnl, g2=dataGate("cnl","체크인 번호 명단"); IV.gno.gate=g2||"";
  XG.set(IV.gno, g2?null:cnSort(L.rows||[]), el("cnL"));
}
function cnSort(rows){ return rows.map(function(r){ var o={}; for(var k in r) o[k]=r[k]; var m=String(r.no||"").match(/^([A-E])-(\d+)$/); o._k=m?m[1]+("000"+m[2]).slice(-4):String(r.no); return o; }); }
/* 261020 빈 번호 채우기(ck_no_fill) · 번호 없는 10F 사람에게 명단에 든 시각 순서로 그 세션의 가장 작은 빈 번호 · 미리 보기(dry) → 확인 문구 「번호채우기」 */
function cnFillAsk(){
  call("ck_no_fill",{ dry:"1" }).then(function(v){
    if(!v||!v.ok){ toast("미리 보지 못했습니다 · "+ivWhy(v),{ bad:1 }); return; }
    if(!v.no&&!v.gAdd){ toast("채울 사람이 없습니다"); reload(["cno","cnl"]); return; }
    var li=(v.rows||[]).map(function(r){ return '<tr><td><b>'+esc(r.no)+'</b></td><td>'+esc(r.name||"")+'</td><td>'+esc(cnSid(r.sid))+'</td><td>'+esc(r.at||"")+'</td><td>'+(r.reuse?"빈 번호":"새 번호")+'</td></tr>'; }).join("");
    confirmBox({ t:"빈 번호를 채울까요?", who:"번호 "+n0(v.no)+"명 · 접속 허용 추가 "+n0(v.gAdd)+"명", sub:"이미 번호가 있는 사람은 그대로 · 명단에 든 시각 순서 · 빠진 사람 번호 줄은 새 사람으로 바뀌고 운영로그에 남음",
      body:(li?'<div class="xg-wrap mt4" style="--xg-h:auto"><table class="tb"><thead><tr><th>번호</th><th>이름</th><th>세션</th><th>명단에 든 시각</th><th></th></tr></thead><tbody>'+li+'</tbody></table></div>':'')+
        '<label class="fld">확인 문구 · 「번호채우기」를 입력합니다<input class="in" id="cnFW" autocomplete="off" oninput="gateUpd()"></label>', focus:"cnFW", ok:"빈 번호 채우기",
      gate:function(){ return String((el("cnFW")||{}).value||"").trim()==="번호채우기"; },
      run:function(){ return call("ck_no_fill",{ confirm:"번호채우기" }); }, fail:function(r){ return "채우지 못했습니다 · "+ivWhy(r); },
      done:function(r){ toast("빈 번호를 채웠습니다 · "+n0(r.no)+"명"+(r.gAdd?" · 접속 허용 "+n0(r.gAdd)+"명":"")); reload(["cno","cnl"]); } });
  });
}
function cnPend(d){ return num(d&&d.pend)+num(d&&d.spend); }   /* 261020 빈 번호 채우기 = 10F + 스태프(S) */
function cnSid(sid){ if(sid==="staff") return "스태프"; return typeof TEN_N!=="undefined"&&TEN_N[sid]||sid||""; }
function cnAsk(){
  var d=S.data.cno; if(!d||!d.ok||!d.pend) return;
  var sg=d.seg||{}, rg=["A","B","C","D","E"].filter(function(g){ return sg[g]&&sg[g].pend; }).map(function(g){ var x=sg[g]; return g+"-"+(num(x.max)+1)+(x.pend>1?" ~ "+g+"-"+(num(x.max)+x.pend):""); }).join(" · ");
  confirmBox({ t:d.has?"새 사람에게 번호를 이어서 매길까요?":"체크인 번호를 매길까요?", who:"새로 매길 사람 "+n0(d.pend)+"명 · "+rg, sub:"이미 번호가 있는 "+n0(d.has)+"명은 그대로 · 세션 안 이름 가나다순 · 참가자 앱 홈 · 내 QR 에 번호가 보입니다",
    body:'<label class="fld">확인 문구 · 「번호매기기」를 입력합니다<input class="in" id="cnW" autocomplete="off" oninput="gateUpd()"></label>', focus:"cnW", ok:"번호 매기기",
    gate:function(){ return String((el("cnW")||{}).value||"").trim()==="번호매기기"; },
    run:function(){ return call("ck_no_assign",{ confirm:"번호매기기" }); }, fail:function(r){ return "매기지 못했습니다 · "+ivWhy(r); },
    done:function(r){ toast(r.add?"번호를 매겼습니다 · "+n0(r.add)+"명":"새로 매길 사람이 없습니다"); reload(["cno","cnl"]); } });
}
