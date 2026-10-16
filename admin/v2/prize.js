/* AXF CONTROL v2 · S4 경품 · 재고 (261016)
 * 왼쪽 = 옷 한 화면(숫자 카드 4 → 구분 칩 → 사이즈 표 → 사람 명단 표) · 오른쪽 = 룰렛 5등급 · 선착순 가습기 · 지급품(커피 박스)
 * 데이터 = kit_size_state · roll_list(kit · lounge) · ck_state(창구) · inv_state · fcfs_list · lk7_state · 읽기는 PIN 없음(옛 서버는 명단만 PIN)
 * 룰렛 소진 안내 = L1(바로 · 되돌리기 토스트) · 17:00 잔여 입력 = L2(확인 창) */
var PZ={ chip:"all", g:null, gf:null };
var PZ_CH=[["all","전체"],["pre","사전 신청자"],["staff","스태프"],["lng","라운지 사전"]];
var LK_ROUL=[["r1","1등 텀블러"],["r2","2등 커피 + 키캡 키링"],["r3","3등 컵받침"],["r4","4등 판스티커"],["r5","5등 볼펜"]];
SCREENS.prize={
  title:"경품 · 재고", desc:"옷 · 키트 / 룰렛 / 선착순 / 지급품",
  need:function(){ return [{ k:"kb", a:"kit_board", ttl:60000 },{ k:"kss", a:"kit_size_state", ttl:60000 },{ k:"kit", a:"roll_list", p:{ list:"kit" }, ttl:60000, rd:1 },{ k:"lng", a:"roll_list", p:{ list:"lounge" }, ttl:60000, rd:1 },{ k:"ck", a:"ck_state", ttl:60000 },{ k:"inv", a:"inv_state", ttl:60000 },{ k:"fxl", a:"fcfs_list", p:{ page:1 }, ttl:30000 },{ k:"lk", a:"lk7_state", ttl:60000 }]; },
  mount:function(vb){
    vb.innerHTML='<div class="grid g32"><div class="col"><div class="grid g4" id="pzK"></div><div class="chips" id="pzC" role="group" aria-label="구분" style="margin:0"></div><div class="card" id="pzT"></div><div class="card"><h2>옷 명단 <span class="cap">구분 · 사이즈 · 받음</span></h2><div id="pzP"></div></div></div>'+
      '<div class="col"><div class="card" id="pzR"></div><div class="card" id="pzF"></div><div class="card" id="pzB"></div><div class="card"><h2>선착순 가습기 수령 명단</h2><div id="pzFL"></div></div>'+oldLink("재고 조정 · 입고 · E 창구 교환 기록")+'</div></div>';
  },
  paint:function(){ pzKpi(); pzTable(); pzPeople(); pzRoul(); pzFcfs(); pzBox(); pzFcfsList(); }
};
function pzPool(r){ return pzLng()[r.emp]?"lng":r.pool==="staff"?"staff":"pre"; }
function pzLng(){ var d=S.data.lng, m={}; if(d&&d.ok) (d.rows||[]).forEach(function(r){ m[r.emp]=1; }); return m; }
function pzRows(){ var d=S.data.kit; return d&&d.ok?(d.rows||[]):null; }
function sum(o){ var t=0; for(var k in (o||{})) t+=num(o[k]); return t; }
var KB_G={ pre:"pre", staff:"staff", lng:"lounge" };
function kbOk(){ var k=S.data.kb; return k&&k.ok&&k.tot?k:null; }
function pzKpi(){
  var kb=kbOk();
  if(kb){ var T=kb.tot, gs={}; (kb.groups||[]).forEach(function(x){ gs[x.g]=x; });
    el("pzK").innerHTML=kpi({ l:"옷 총 수량", v:n0(T.qty), s:(kb.sizes||[]).length+"개 사이즈" })+kpi({ l:"신청", v:n0(T.req), u:"명", s:"사전 "+n0(gs.pre&&gs.pre.req)+" · 스태프 "+n0(gs.staff&&gs.staff.req) })+
      kpi({ l:"받음", v:n0(T.got), u:"명", s:"행사일 08:00부터" })+kpi({ l:"미신청", v:n0(T.none), u:"명", st:T.none?"warn":"ok", stt:T.none?"주의":"정상", s:"자동 배정 대상" });
    var all=(kb.groups||[]).reduce(function(a,x){ return a+num(x.people); },0);
    el("pzC").innerHTML=PZ_CH.map(function(c){ var n=c[0]==="all"?all:gs[KB_G[c[0]]]&&gs[KB_G[c[0]]].people; return '<button type="button" class="chip'+(PZ.chip===c[0]?" on":"")+'" aria-pressed="'+(PZ.chip===c[0])+'" onclick="pzChip(\''+c[0]+'\')">'+esc(c[1])+' <span class="c">'+(n==null?"-":n0(n))+'</span></button>'; }).join("");
    return; }
  var d=S.data.kss, g=dataGate("kss","옷 사이즈");
  if(g){ el("pzK").innerHTML='<div style="grid-column:1/-1">'+g+'</div>'; return; }
  var A=d.all||{}, pre=sum(A.kit||d.taken), st=sum(A.st||(d.st||{}).taken), got=sum(d.got), none=num(d.none);
  el("pzK").innerHTML=kpi({ l:"옷 총 수량", v:n0(A.tot||d.tot), s:(d.sizes||[]).length+"개 사이즈" })+
    kpi({ l:"신청", v:n0(pre+st), u:"명", s:"사전 "+n0(pre)+" · 스태프 "+n0(st) })+
    kpi({ l:"받음", v:n0(got), u:"명", s:"행사일 08:00부터" })+
    kpi({ l:"미신청", v:n0(none), u:"명", st:none?"warn":"ok", stt:none?"주의":"정상", s:"자동 배정 대상" });
  var rows=pzRows(), lg=pzLng(), cnt={ all:null, pre:null, staff:null, lng:null };
  if(rows){ cnt.all=rows.length; cnt.pre=rows.filter(function(r){ return pzPool(r)==="pre"; }).length; cnt.staff=rows.filter(function(r){ return r.pool==="staff"; }).length; cnt.lng=Object.keys(lg).length; }
  el("pzC").innerHTML=PZ_CH.map(function(c){ return '<button type="button" class="chip'+(PZ.chip===c[0]?" on":"")+'" aria-pressed="'+(PZ.chip===c[0])+'" onclick="pzChip(\''+c[0]+'\')">'+esc(c[1])+' <span class="c">'+(cnt[c[0]]==null?"-":n0(cnt[c[0]]))+'</span></button>'; }).join("");
}
function pzChip(c){ PZ.chip=c; if(PZ.g){ PZ.g.chip=c; } paint(); }
/* 사이즈 표 · 총량 · 신청 · 받음 · 남음(총량 − 받음) · 여유(총량 − 신청, 모자라면 빨강) */
function pzTable(){
  var kb=kbOk();
  if(kb){ var map0=(S.data.ck&&S.data.ck.cfg&&S.data.ck.cfg.map)||{}, ch0=PZ.chip, key=KB_G[ch0], sh=0;
    var body0=(kb.rows||[]).map(function(r){ var q=num(r.qty), t=key?num(r[key]):num(r.req), left=num(r.left), pct=q?Math.max(0,Math.round(left*100/q)):0; if(left<0) sh++;
      return '<tr'+(left<0?' class="hot"':'')+'><td>'+esc(r.sz)+'</td><td>'+esc(map0[r.sz]||"-")+'</td><td class="n">'+n0(q)+'</td><td class="n">'+n0(t)+'</td><td class="n">'+n0(r.got)+'</td><td class="n"'+(left<0?' style="color:var(--bad);font-weight:700"':'')+'><b>'+n0(left)+'</b></td><td class="barc"><div class="bar'+(pct<20?" w":"")+'"><i style="width:'+pct+'%"></i></div></td></tr>'; }).join("");
    el("pzT").innerHTML=(sh?band("bad","남음이 모자랍니다 · 빨간 줄 사이즈"):"")+'<table class="tb"><thead><tr><th>사이즈</th><th>창구</th><th class="n">총량</th><th class="n">신청'+(key?" · "+PZ_CH.filter(function(c){ return c[0]===ch0; })[0][1]:"")+'</th><th class="n">받음</th><th class="n">남음</th><th class="barc" style="width:24%"></th></tr></thead><tbody>'+body0+'</tbody></table><p class="cap mt">서버 옷 집계(kit_board) · 교환은 E 창구 기록으로 반영</p>';
    return; }
  var d=S.data.kss; if(!d||!d.ok){ el("pzT").innerHTML=d?"":skel(); return; }
  var A=d.all||{}, Q=A.qty||d.qty||{}, map=(S.data.ck&&S.data.ck.cfg&&S.data.ck.cfg.map)||{}, rows=pzRows(), ch=PZ.chip;
  var T={}, G={}; (d.sizes||[]).forEach(function(z){ T[z]=0; G[z]=0; });
  if(rows&&ch!=="all"){ rows.forEach(function(r){ if(pzPool(r)!==ch||!r.sz) return; T[r.sz]=num(T[r.sz])+1; if(r.got) G[r.sz]=num(G[r.sz])+1; }); }
  else { (d.sizes||[]).forEach(function(z){ T[z]=num((A.kit||{})[z])+num((A.st||{})[z]); G[z]=num((d.got||{})[z]); }); }
  var short=0, body=(d.sizes||[]).map(function(z){ var q=num(Q[z]), t=T[z], g=G[z], left=q-g, fr=q-num((A.kit||{})[z])-num((A.st||{})[z]); if(fr<0) short++;
    var pct=q?Math.max(0,Math.round(left*100/q)):0;
    return '<tr'+(fr<0?' class="hot"':'')+'><td>'+esc(z)+'</td><td>'+esc(map[z]||"-")+'</td><td class="n">'+n0(q)+'</td><td class="n">'+n0(t)+'</td><td class="n">'+n0(g)+'</td><td class="n"><b>'+n0(left)+'</b></td><td class="n"'+(fr<0?' style="color:var(--bad);font-weight:700"':'')+'>'+n0(fr)+'</td><td class="barc"><div class="bar'+(pct<20?" w":"")+'"><i style="width:'+pct+'%"></i></div></td></tr>'; }).join("");
  el("pzT").innerHTML=(short?band("bad","여유가 모자랍니다 · 빨간 줄 사이즈"):"")+'<table class="tb"><thead><tr><th>사이즈</th><th>창구</th><th class="n">총량</th><th class="n">신청'+(ch==="all"?"":" · "+PZ_CH.filter(function(c){ return c[0]===ch; })[0][1])+'</th><th class="n">받음</th><th class="n">남음</th><th class="n">여유</th><th class="barc" style="width:22%"></th></tr></thead><tbody>'+body+'</tbody></table>'+
    '<p class="cap mt">남음 = 총량 − 받음 · 여유 = 총량 − 사전 · 스태프 신청 · 교환은 E 창구 기록으로 반영'+(ch!=="all"&&!rows?" · 구분별 수는 명단을 받은 뒤":"")+'</p>';
}
function pzPeople(){
  if(!PZ.g) PZ.g=XG.make({ id:"kit", file:"옷 명단", key:function(r){ return r.emp; }, sort:{ k:"no", d:1 },
    chips:[["all","전체",null],["pre","사전 신청자",function(r){ return pzPool(r)==="pre"; }],["staff","스태프",function(r){ return r.pool==="staff"; }],["lng","라운지 사전",function(r){ return pzPool(r)==="lng"; }],["none","미신청",function(r){ return !r.sz; }]],
    onChip:function(c){ if(c!=="none"){ PZ.chip=c; paint(); } },
    cols:[{ k:"no", t:"신청번호", w:88 },{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"부서", w:120 },{ k:"pool", t:"구분", w:96, v:function(r){ var p=pzPool(r); return p==="staff"?"스태프":p==="lng"?"라운지 사전":"사전 신청자"; } },
      { k:"sz", t:"사이즈", w:70, f:function(r){ return r.sz?'<b>'+esc(r.sz)+'</b>':tag("미신청","warn"); } },{ k:"how", t:"고른 방식", w:80, v:function(r){ return r.how==="auto"?"자동":r.how==="pick"?"직접":""; } },{ k:"at", t:"고른 시각", type:"date", w:100 },
      { k:"got", t:"받음", w:96, v:function(r){ return r.got||""; }, x:function(r){ return r.got?"받음 "+r.got:r.pool==="staff"?"따로 전달":"받기 전"; }, f:function(r){ return r.got?tag("받음 "+fmtD(r.got),"ok"):r.pool==="staff"?tag("따로 전달","off"):tag("받기 전","off"); } }],
    src:{ a:"roll_list", p:{ list:"kit" } }, h:360 });
  if(PZ.chip!=="all"&&PZ.g.chip!=="none") PZ.g.chip=PZ.chip;
  var gt=dataGate("kit","옷 명단"); PZ.g.gate=gt||""; XG.set(PZ.g, gt?null:pzRows(), el("pzP"));
}
function pzRoul(){
  var d=S.data.inv, b=S.data.nb, out=b&&b.ok?!!b.rout:null;
  if(!d||!d.ok){ el("pzR").innerHTML='<h2>룰렛</h2>'+(dataGate("inv","재고")||""); return; }
  var it=(d.items||[]).filter(function(x){ return x.src==="roul"; });
  var lk=S.data.lk, rem=lk&&lk.ok&&lk.rem;
  el("pzR").innerHTML='<h2>룰렛 <span class="cap">남은 수 · 09:30~17:00</span>'+(out?'<span class="r">'+tag("소진 안내 켜짐","warn")+'</span>':'')+'</h2>'+
    '<table class="tb"><tbody>'+it.map(function(x){ return '<tr><td>'+esc(String(x.n).replace(/^룰렛 /,""))+'</td><td class="n"><b>'+n0(x.left)+'</b> <span class="cap">/ '+n0(x.q)+'</span></td></tr>'; }).join("")+'</tbody></table>'+
    '<div class="btns mt"><button class="btn'+(out?"":" dng")+'" type="button" onclick="rlOut('+(out?0:1)+')">'+(out?"소진 안내 끄기":"소진 안내 켜기")+'</button><button class="btn" type="button" onclick="lkRem()">17:00 잔여 입력</button></div>'+
    (rem?'<p class="cap mt">17:00 잔여 저장됨 · '+esc(fmtD(rem.at||""))+'</p>':'');
}
/* 룰렛 소진 안내 · L1 · 바로 바꾸고 7초 되돌리기 */
function rlOut(on){
  call("roulette_out",{ on:on?"1":"0" }).then(function(r){
    if(r&&r.ok){ if(S.data.nb) S.data.nb.rout=r.out?1:0; paint(); toast(r.out?"룰렛 소진 안내를 켰습니다":"룰렛 소진 안내를 껐습니다",{ undo:function(){ rlOut(on?0:1); } }); reload(["nb"]); }
    else toast("바꾸지 못했습니다 · "+why(r),{ bad:1 });
  });
}
function lkRem(){
  var lk=S.data.lk; if(lk&&lk.ok&&lk.ph==="drawn"){ toast("7등 추첨 뒤라 잠겼습니다"); return; }
  var inv=S.data.inv, left={}; ((inv&&inv.items)||[]).forEach(function(x){ left[x.id]=x.left; });
  confirmBox({ t:"17:00 룰렛 잔여를 저장할까요?", who:"부스 실물을 품목별로 센 수", sub:"서버가 입고 − 사용과 대조해 차이가 크면 알립니다 · 7등 추첨 전까지 다시 저장",
    body:LK_ROUL.map(function(x){ return '<label class="fld">'+esc(x[1])+' <span class="cap">(계산값 '+n0(left[x[0]])+')</span><input class="in n" id="lkR_'+x[0]+'" inputmode="numeric" maxlength="4" autocomplete="off" oninput="this.value=this.value.replace(/\\D/g,\'\');gateUpd()"></label>'; }).join(""),
    focus:"lkR_r1", ok:"잔여 저장", gate:function(){ return LK_ROUL.every(function(x){ var i=el("lkR_"+x[0]); return i&&i.value!==""; }); },
    run:function(){ var p={}; LK_ROUL.forEach(function(x){ p[x[0]]=Number(el("lkR_"+x[0]).value); }); return call("lk7_rem",p); },
    done:function(r){ toast(r.warn?"저장했습니다 · 예상("+n0(r.expect)+")과 차이가 큽니다":"룰렛 잔여를 저장했습니다"); reload(["lk"]); } });
}
function pzFcfs(){
  var b=S.data.nb; if(!b||!b.ok){ el("pzF").innerHTML='<h2>선착순 가습기</h2>'+skel(); return; }
  var f=b.fcfs||{};
  el("pzF").innerHTML='<h2>선착순 가습기 '+(f.on?"":tag("꺼짐","off"))+'</h2>'+rowH("남음","지급 "+n0(f.got)+" · 17:00 마감 · 6개 달성자",'<span class="big">'+n0(f.left)+'<small> / '+n0(f.cap)+'</small></span>');
}
function pzBox(){
  var d=S.data.inv; if(!d||!d.ok){ el("pzB").innerHTML='<h2>지급품</h2>'+(d?"":skel()); return; }
  var it=(d.items||[]).filter(function(x){ return x.src==="box"; });
  el("pzB").innerHTML='<h2>지급품 <span class="cap">커피챗 · 라운지 · 스태프</span></h2>'+(it.length?'<table class="tb"><tbody>'+it.map(function(x){ var low=num(x.q)&&num(x.left)<=num(x.q)*0.15; return '<tr><td>'+esc(x.n)+'</td><td class="n"'+(low?' style="color:var(--warn)"':'')+'><b>'+n0(x.left)+'</b> <span class="cap">/ '+n0(x.q)+'</span></td></tr>'; }).join("")+'</tbody></table>':emptyH("지급품이 없습니다"));
}
function pzFcfsList(){
  if(!PZ.gf) PZ.gf=XG.make({ id:"fcfs", file:"선착순 가습기 수령", key:function(r){ return r.emp; }, sort:{ k:"rk", d:1 },
    chips:[["all","전체",null],["got","받음",function(r){ return !!r.got; }],["no","받기 전",function(r){ return !r.got&&r.st!=="취소"; }],["cx","취소",function(r){ return r.st==="취소"; }]],
    cols:[{ k:"rk", t:"순번", type:"num", w:56 },{ k:"name", t:"이름", w:90 },{ k:"emp", t:"사번", w:80 },{ k:"dept", t:"부서", w:110 },{ k:"at", t:"자격 시각", type:"date", w:90 },{ k:"gotAt", t:"받은 시각", type:"date", w:90 },{ k:"st", t:"상태", w:70 }],
    src:{ a:"fcfs_list", p:{ page:1 } }, empty:"아직 대상이 없습니다", h:300 });
  var gt=dataGate("fxl","선착순 명단"), d=S.data.fxl; PZ.gf.gate=(gt||"")+(d&&d.ok&&num(d.n)>(d.rows||[]).length?'<div class="cap" style="padding:6px 2px">앞 '+n0((d.rows||[]).length)+'명 · 전체 '+n0(d.n)+'명은 서버 갱신 뒤</div>':'');
  XG.set(PZ.gf, gt?null:(d.rows||[]), el("pzFL"));
}
