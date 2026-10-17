/* AXF CONTROL v2 · S6 알림 (261016 2단계)
 * 칩 = 보내기 · 보낸 기록 · 맨 위 띠 = 푸시 상태(정상 · 공지 푸시 잠금 · 전체 정지 · push_cfg · 확인 창 · 되돌리기 토스트)
 * 보내기 = 받는 사람(전체 · 구분 · 사람 칩 검색) · 보낸 사람(기본 「AX Festival」) · 제목 · 내용 · 미리보기(잠금 화면 모양 + push_preview 인원)
 *   → 확인 창(전체급이면 서버가 요구할 때 도달 인원 숫자 입력) → notice_set(push=1 · spec · cnt · pt 보낸 사람 · pb 제목+내용) · 지금 콘솔 「알리기」와 같은 서버 액션
 * 보낸 기록 = notice_hist + push_hist 한 명단 · 줄 상세 서랍에서 공지 중지(notice_clear) · 보류 중 푸시 취소(push_cancel) · 261016 PIN 없음 */
var NT_SUBS=[["send","보내기"],["hist","보낸 기록"]];
var NT_GRP=[["dap","AX 라운지 신청자"],["cchat","커피챗 희망자"],["stamps","스탬프 개수"]];
var NT_MAX={ t:40, b:120, from:20 }, NT_FROM="AX Festival";
var NT=(function(){ var g={}; try{ g=JSON.parse(sessionStorage.getItem("axf_v2_nt")||"{}")||{}; }catch(e){} return { tgt:g.tgt||"all", grp:g.grp||"dap", smin:g.smin!=null?g.smin:3, smax:g.smax!=null?g.smax:6, ppl:g.ppl||[], from:g.from!=null?g.from:NT_FROM, t:g.t||"", b:g.b||"", push:g.push!==false, pv:null, seq:0, q:"", qr:null, qseq:0, hold:null }; })();
function ntSave(){ try{ sessionStorage.setItem("axf_v2_nt",JSON.stringify({ tgt:NT.tgt, grp:NT.grp, smin:NT.smin, smax:NT.smax, ppl:NT.ppl, from:NT.from, t:NT.t, b:NT.b, push:NT.push })); }catch(e){} }
function ntAddPerson(p){ if(!p||!p.emp) return; NT.tgt="ppl"; if(!NT.ppl.some(function(x){ return x.emp===p.emp; })) NT.ppl.push({ emp:p.emp, name:p.name||"", dept:p.dept||"" }); NT.pv=null; ntSave(); }
function ntSub(){ return subsOf(NT_SUBS,"send"); }
function pushSt(){ var d=S.data.pst; return d&&d.ok&&d.rt?d:null; }
SCREENS.notify={
  title:"알림", desc:"",
  need:function(){ var a=[{ k:"pst", a:"push_stats", ttl:30000 }]; if(ntSub()==="hist"||NT.hold) a.push({ k:"phist", a:"push_hist", p:{ n:100 }, ttl:NT.hold?5000:30000 },{ k:"nhist", a:"notice_hist", p:{ n:50 }, ttl:30000 }); return a; },
  mount:function(vb){
    var s=ntSub();
    el("phCap").textContent=s==="send"?"앱 안 공지 + 푸시 · 받는 사람 · 미리보기 · 확인 창":"보낸 공지 · 푸시 · 줄을 누르면 상세 · 공지 중지";
    var h=chipsH(NT_SUBS,s)+'<div id="ntStop"></div><div id="ntHold"></div>';
    if(s==="hist"){
      gridOf("nthist",{ file:"보낸 알림 기록", key:function(r){ return r.id; }, sort:{ k:"t", d:-1 }, onRow:function(k){ ntHistOpen(k); },
        chips:[["all","전체",null],["notice","공지",function(r){ return r.kind==="notice"; }],["push","푸시",function(r){ return r.kind==="push"; }],["fail","실패 있음",function(r){ return num(r.fail)>0; }],["hold","보류 중",function(r){ return r.st==="대기"; }]],
        cols:[{ k:"t", t:"시각", type:"date", w:100 },{ k:"kn", t:"종류", w:96 },{ k:"title", t:"제목", w:220 },{ k:"desc", t:"받는 사람", w:150 },{ k:"n", t:"인원", type:"num", w:64 },{ k:"reach", t:"푸시 도달", type:"num", w:80 },{ k:"fail", t:"실패", type:"num", w:60, f:function(r){ return num(r.fail)?'<b style="color:var(--bad)">'+n0(r.fail)+'</b>':esc(r.fail===""?"":n0(r.fail)); } },{ k:"st", t:"상태", w:80 },{ k:"by", t:"보낸 사람", w:110 }],
        empty:"보낸 기록이 없습니다", h:520 });
      vb.innerHTML=h+'<div class="card"><div id="mg_nthist"></div></div>';
      return; }
    vb.innerHTML=h+'<div class="grid g32"><div class="card" id="ntForm"></div><div class="col"><div class="card" id="ntPv"></div><div class="card" id="ntSub"></div></div></div>';
    ntForm();
  },
  paint:function(){
    ntStopPaint(); ntHoldPaint();
    if(ntSub()==="hist"){ var g=MG.nthist, gt=dataGate("phist","푸시 기록")||dataGate("nhist","공지 기록"); g.gate=gt||""; XG.set(g, gt?null:ntHistRows(), el("mg_nthist")); return; }
    ntTxN(); ntSubPaint(); if(NT.push&&pushSt()&&!NT.pv&&!NT.pvBusy) ntPvGo(); else ntPvPaint();
  }
};
/* ── 푸시 상태 띠 · 정지 ── */
function ntCur(){ var st=pushSt(); return !st?"":!st.on?"stop":st.manual===0?"lock":"ok"; }
function ntStopPaint(){
  var box=el("ntStop"); if(!box) return; var st=pushSt(), cur=ntCur();
  if(!st){ box.innerHTML=S.data.pst&&S.data.pst.ok===false?band("warn","푸시 상태를 받지 못했습니다 · "+esc(why(S.data.pst))):S.data.pst?band("info","이 서버는 알림 기능이 없어 앱 안 공지만 나갑니다"):""; return; }
  var seg='<span class="seg">'+[["ok","정상"],["lock","공지 푸시 잠금"],["stop","전체 정지"]].map(function(x){ return '<button type="button" class="'+(cur===x[0]?"on":"")+'" aria-pressed="'+(cur===x[0])+'" onclick="ntStopAsk(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</span>';
  box.innerHTML=band(cur==="ok"?"info":cur==="lock"?"warn":"bad",'<b>푸시 '+(cur==="ok"?"정상":cur==="lock"?"공지 푸시 잠금":"전체 정지")+'</b> · '+(cur==="ok"?"공지 · 예약 · 자동 알림이 나감":cur==="lock"?"공지 · 대상 지정 · 예약 푸시가 나가지 않음 · 자동 알림은 나감":"모든 푸시가 멈춤")+(st.dateOk===0?" · 오늘은 발송 허용 날짜가 아님":"")+(st.err?" · 발송기 오류 있음":""),seg);
}
function ntStopAsk(to){
  var cur=ntCur(); if(!cur||to===cur) return;
  var p=to==="ok"?{ on:"ON", manual:"ON" }:to==="lock"?{ on:"ON", manual:"OFF" }:{ on:"OFF" };
  var NM={ ok:"정상", lock:"공지 푸시 잠금", stop:"전체 정지" };
  confirmBox({ t:to==="ok"?"푸시를 다시 켤까요?":to==="lock"?"공지 푸시를 잠글까요?":"푸시를 전체 정지할까요?", who:NM[cur]+" → "+NM[to],
    sub:to==="ok"?"공지 푸시 · 예약 · 자동 알림이 다시 나감":to==="lock"?"공지 · 대상 지정 · 예약 푸시가 멈추고 보류 중인 사람 알림은 취소 · 커피챗 · 라운지 자동 알림은 나감":"자동 알림까지 모든 푸시가 멈춤 · 오발송이 이어질 때",
    ok:to==="ok"?"다시 켜기":to==="lock"?"잠그기":"전체 정지", danger:to!=="ok",
    run:function(){ return call("push_cfg",p); },
    done:function(r){ S.data.pst=r&&r.rt!=null?r:S.data.pst; reload(["pst","nb"]); paint(); toast(to==="ok"?"푸시를 다시 켰습니다":to==="lock"?"공지 푸시를 잠갔습니다":"푸시를 전체 정지했습니다",{ undo:function(){ call("push_cfg",cur==="ok"?{ on:"ON", manual:"ON" }:cur==="lock"?{ on:"ON", manual:"OFF" }:{ on:"OFF" }).then(function(x){ reload(["pst","nb"]); toast(x&&x.ok?"되돌렸습니다 · 푸시 "+NM[cur]:"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); } }); } });
}
/* ── 보내기 ── */
function ntSpec(){
  if(NT.tgt==="all") return { all:1 };
  if(NT.tgt==="grp") return NT.grp==="stamps"?{ stamps:{ min:Number(NT.smin), max:Number(NT.smax) } }:{ group:NT.grp };
  var L=NT.ppl.map(function(x){ return x.emp; }); return L.length&&L.length<=50?{ emps:L }:null;
}
function ntTgtTx(){ return NT.tgt==="all"?"전체":NT.tgt==="grp"?(NT.grp==="stamps"?"스탬프 "+NT.smin+"~"+NT.smax+"개":(NT_GRP.filter(function(x){ return x[0]===NT.grp; })[0]||[0,""])[1]):NT.ppl.length+"명(사람)"; }
function ntPushTx(){ var t=NT.t.trim(), b=NT.b.trim(), st=pushSt()||{}; return st.ntgt?{ t:(NT.from.trim()||NT_FROM), b:t+(b?"\n"+b:"") }:{ t:t, b:b }; }
function ntForm(){
  var f=el("ntForm"); if(!f) return;
  var o=function(v){ return [0,1,2,3,4,5,6].map(function(i){ return '<option'+(String(i)===String(v)?" selected":"")+'>'+i+'</option>'; }).join(""); };
  f.innerHTML='<h2>보낼 말 <span class="cap">앱 안 공지 + 푸시</span></h2>'+
    '<div class="nt-f"><div class="nt-l" id="ntTgtL">받는 사람</div><div class="chips" role="radiogroup" aria-labelledby="ntTgtL" style="margin:0">'+[["all","전체"],["grp","구분"],["ppl","사람"]].map(function(x){ return '<button type="button" role="radio" aria-checked="'+(NT.tgt===x[0])+'" class="chip'+(NT.tgt===x[0]?" on":"")+'" onclick="ntTgt(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</div>'+
    (NT.tgt==="grp"?'<div class="chips mt4" role="radiogroup" aria-label="구분" style="margin:6px 0 0">'+NT_GRP.map(function(x){ return '<button type="button" role="radio" aria-checked="'+(NT.grp===x[0])+'" class="chip'+(NT.grp===x[0]?" on":"")+'" onclick="ntGrp(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</div>'+
      (NT.grp==="stamps"?'<div class="nt-row mt4"><label class="up-f">몇 개부터<select onchange="ntIn(\'smin\',this.value)">'+o(NT.smin)+'</select></label><label class="up-f">몇 개까지<select onchange="ntIn(\'smax\',this.value)">'+o(NT.smax)+'</select></label></div>':'<p class="cap mt4">'+(NT.grp==="dap"?"AX 라운지 상담 신청 · 승인 상태인 사람":"커피챗 희망 · 선정 상태인 사람")+'</p>'):"")+
    (NT.tgt==="ppl"?'<div class="nt-ppl mt4" id="ntPpl"></div><div class="nt-q"><input class="xg-q" id="ntQ" type="search" autocomplete="off" placeholder="사번 · 이름으로 찾아 더하기" aria-label="받는 사람 찾기" value="'+esc(NT.q)+'" oninput="ntQ(this.value)"><div class="nt-qr" id="ntQr"></div></div><p class="cap mt4">한 번에 50명까지 · 한 사람 카드 「이 사람에게 푸시」가 여기에 더합니다</p>':"")+'</div>'+
    '<label class="nt-f up-f">보낸 사람 <span class="cap">푸시 제목 자리 · 기본 '+NT_FROM+'</span><input class="xg-q nt-in" id="ntFrom" maxlength="'+NT_MAX.from+'" value="'+esc(NT.from)+'" oninput="ntIn(\'from\',this.value)"></label>'+
    '<label class="nt-f up-f">제목 <span class="cap" id="ntCT"></span><input class="xg-q nt-in" id="ntT" maxlength="'+NT_MAX.t+'" placeholder="예: 17:00 Closing Speech 곧 시작" value="'+esc(NT.t)+'" oninput="ntIn(\'t\',this.value)"></label>'+
    '<label class="nt-f up-f">내용 <span class="cap" id="ntCB"></span><textarea id="ntB" rows="3" maxlength="'+NT_MAX.b+'" placeholder="잠금 화면에 그대로 보입니다 · 이름 · 행운권 수 · 경품은 쓰지 않습니다" oninput="ntIn(\'b\',this.value)">'+esc(NT.b)+'</textarea></label>'+
    '<label class="up-ck nt-f"><input type="checkbox"'+(NT.push?" checked":"")+' onchange="ntIn(\'push\',this.checked)"> 푸시도 보내기 · 끄면 앱 안 공지만</label>'+
    '<div class="btns mt"><button class="btn pri" type="button" onclick="ntAsk()">보내기</button><button class="btn" type="button" onclick="ntTest()">나에게 테스트</button></div>';
  ntPplPaint(); ntCnt();
}
function ntTgt(t){ NT.tgt=t; NT.pv=null; ntSave(); ntForm(); ntPvGo(); if(t==="ppl") setTimeout(function(){ var i=el("ntQ"); if(i) i.focus(); },30); }
function ntGrp(g){ NT.grp=g; NT.pv=null; ntSave(); ntForm(); ntPvGo(); }
function ntIn(k, v){ NT[k]=k==="push"?!!v:v; NT.pv=null; ntSave(); if(k==="t"||k==="b"||k==="from") ntCnt(); clearTimeout(NT._q); NT._q=setTimeout(ntPvGo,450); ntPvPaint(); }
function ntCnt(){ var c=function(id,n,mx){ var e=el(id); if(e) e.textContent=n+" / "+mx; }; c("ntCT",NT.t.length,NT_MAX.t); c("ntCB",NT.b.length,NT_MAX.b); }
function ntPplPaint(){ var b=el("ntPpl"); if(!b) return; b.innerHTML=NT.ppl.length?NT.ppl.map(function(p){ return '<span class="pchip">'+esc(personLine(p))+'<button type="button" aria-label="'+esc(personLine(p)+" 빼기")+'" onclick="ntDel(\''+jq(p.emp)+'\')">×</button></span>'; }).join("")+(NT.ppl.length>50?'<span class="cap" style="color:var(--bad)">50명을 넘습니다 · 나눠 보냅니다</span>':''):'<span class="cap">아직 고른 사람이 없습니다</span>'; }
function ntDel(e){ NT.ppl=NT.ppl.filter(function(p){ return p.emp!==e; }); NT.pv=null; ntSave(); ntPplPaint(); ntTxN(); ntPvGo(); }
function ntQ(v){ NT.q=v; clearTimeout(NT._qq); var q=String(v||"").trim(); if(q.length<2){ NT.qr=null; ntQrPaint(); return; } NT._qq=setTimeout(function(){ var s=++NT.qseq; call("acct_page",{ q:q, n:8, sort:"last" }).then(function(r){ if(s!==NT.qseq) return; NT.qr=r; ntQrPaint(); }); },300); }
function ntQrPaint(){ var b=el("ntQr"); if(!b) return; var r=NT.qr; if(!r){ b.innerHTML=""; return; }
  if(!r.ok){ b.innerHTML='<div class="cap">찾지 못했습니다 · '+esc(why(r))+'</div>'; return; }
  var rows=(r.rows||[]); b.innerHTML=rows.length?rows.map(function(x){ var on=NT.ppl.some(function(p){ return p.emp===x.emp; });
    return '<button type="button" class="nt-hit"'+(on?' aria-disabled="true"':'')+' onclick="ntPick(\''+jq(x.emp)+'\',\''+jq(x.name)+'\',\''+jq(x.dept)+'\')"><b>'+esc(whoOf(x).n||"-")+'</b><span class="cap">'+esc(whoSub(x))+'</span>'+(on?tag("고름","ok"):x.acct?"":tag("가입 전","off"))+'</button>'; }).join(""):'<div class="cap">찾는 사람이 없습니다</div>'; }
function ntPick(e, n, d){ ntAddPerson({ emp:e, name:n, dept:d }); ntPplPaint(); ntQrPaint(); ntTxN(); ntPvGo(); }
function ntTxN(){}
/* 미리보기 · 잠금 화면 모양 + 인원 */
function ntPvGo(){
  if(!NT.push||!pushSt()){ ntPvPaint(); return; }
  var sp=ntSpec(), tx=ntPushTx(); if(!NT.t.trim()||!sp){ NT.pv=null; ntPvPaint(); return; }
  var s=++NT.seq; NT.pvBusy=1; ntPvPaint();
  call("push_preview",{ spec:JSON.stringify(sp), title:tx.t, body:tx.b, go:"notices" }).then(function(r){ if(s!==NT.seq) return; NT.pvBusy=0; NT.pv=r||{ ok:false }; ntPvPaint(); });
}
var NT_WHY={ nopush:"이 서버에는 알림 기능이 없습니다", text:"제목 40자 · 푸시 본문(제목 + 내용) 120자까지", spec:"받는 사람이 올바르지 않습니다", confirm:"인원이 바뀌었습니다", recent:"10분 안에 전체급 발송이 있었습니다", dup:"같은 제목 · 같은 대상으로 5분 안에 보냈습니다",
  allmax:"전체급 발송 하루 상한입니다", time:"보낼 수 있는 시간 밖입니다", off:"푸시 전체 정지 중입니다", empty:"받을 사람이 없습니다", manual:"공지 푸시 잠금 중입니다", date:"오늘은 발송 허용 날짜가 아닙니다(나에게 테스트만)", by:"보내는 사람을 확인합니다", run:"이미 나가기 시작해 취소할 수 없습니다" };
function ntWhy(r){ r=r||{}; return NT_WHY[r.reason]||why(r); }
function ntPvPaint(){
  var box=el("ntPv"); if(!box) return; var tx=ntPushTx(), st=pushSt(), v=NT.pv;
  var line=!NT.push?"푸시 없이 앱 안 공지만":!st?"알림 상태를 받는 중":!NT.t.trim()?"제목을 넣으면 받는 인원이 나옵니다":!ntSpec()?"받는 사람을 고릅니다":NT.pvBusy?"받는 사람을 세는 중":!v?"":!v.ok?'<span style="color:var(--bad)">'+esc(ntWhy(v))+'</span>':
    '받는 사람 <b class="n">'+n0(v.n)+'</b>명 · 푸시 도달 <b class="n">'+n0(v.reach)+'</b>명 · 기기 '+n0(v.subs)+'대'+(v.block?' · <span style="color:var(--bad)">'+esc(NT_WHY[v.block]||v.block)+'</span>':'')+(v.need?' · 보낼 때 인원 숫자 확인'+(v.hold?' · '+v.hold+'초 보류':''):'')+((v.warn||[]).length?' · <span style="color:var(--warn)">'+esc(v.warn.join(" · "))+'</span>':'');
  var pbLen=tx.b.length;
  box.innerHTML='<h2>미리보기 <span class="cap">'+esc(ntTgtTx())+'</span></h2>'+
    (NT.push?'<div class="nt-lock"><div class="nt-lk-h"><span class="nt-ico" aria-hidden="true">AX</span><b>'+esc(tx.t||"보낸 사람")+'</b><span class="cap">지금</span></div><div class="nt-lk-b">'+(tx.b?esc(tx.b).replace(/\n/g,"<br>"):'<span class="cap">제목 · 내용</span>')+'</div></div><div class="cap mt4">잠금 화면 · 푸시 본문 '+pbLen+' / 120'+(pbLen>120?' · <b style="color:var(--bad)">넘음</b>':'')+'</div>':'')+
    '<div class="nt-in-app mt"><span class="cap">앱 안 공지</span><b>'+esc(NT.t.trim()||"제목")+'</b>'+(NT.b.trim()?'<p>'+esc(NT.b.trim())+'</p>':'')+'</div><div class="cap mt">'+line+'</div>';
}
function ntSubPaint(){ var b=el("ntSub"); if(!b) return; var st=pushSt(), td=st&&st.today||{};
  b.innerHTML='<h2>오늘 푸시</h2><div class="mini">'+[["구독 기기",st?n0(st.subs):"-","대"],["오늘 발송",n0(td.jobs||0),"건"],["성공",n0(td.ok||0),"건"],["실패",n0(td.fail||0),"건"]].map(function(x){ return '<div><div class="cap">'+x[0]+'</div><div class="v">'+x[1]+'<small> '+x[2]+'</small></div></div>'; }).join("")+'</div>'+(st?'<p class="cap mt4">보낼 수 있는 시간 '+esc(st.time||"-")+' · 전체급 하루 '+n0(st.limits&&st.limits.all)+'회 · 사람 지정 50명까지</p>':''); }
function ntBy(){ return "콘솔 "+((S.me&&S.me.emp)||aemp()); }
function ntAsk(){
  var t=NT.t.trim(), b=NT.b.trim(), sp=ntSpec(), grp=NT.tgt!=="all";
  if(!t){ toast("제목을 넣습니다"); el("ntT").focus(); return; }
  if(/○○/.test(t+b)){ toast("○○ 칸을 채웁니다"); return; }
  if(!sp){ toast("받는 사람을 고릅니다 · 사람 1~50명"); return; }
  if(!NT.push||!pushSt()){
    confirmBox({ t:"공지를 보낼까요?", who:ntTgtTx()+" · 앱 안 공지", sub:t+(grp?" · 고른 사람들의 앱에만":" · 앱을 여는 모든 사람"), ok:"보내기",
      run:function(){ return call("notice_set",grp?{ title:t, body:b, nto:1, spec:JSON.stringify(sp), by:ntBy() }:{ title:t, body:b, by:ntBy() }); },
      fail:function(r){ return ntWhy(r); }, done:function(){ ntDone(t); } });
    return; }
  var tx=ntPushTx();
  call("push_preview",{ spec:JSON.stringify(sp), title:tx.t, body:tx.b, go:"notices" }).then(function(v){
    if(!v||!v.ok){ toast("보낼 수 없습니다 · "+ntWhy(v),{ bad:1, ms:5000 }); return; }
    if(v.block){ toast("푸시를 보낼 수 없습니다 · "+(NT_WHY[v.block]||v.block)+" · 푸시를 끄면 앱 안 공지만 나감",{ bad:1, ms:6000 }); return; }
    ntConfirm(t, b, sp, grp, tx, v, 0);
  });
}
function ntConfirm(t, b, sp, grp, tx, v, force){
  var need=!!v.need;
  confirmBox({ t:force?"그래도 보낼까요?":"공지 · 푸시를 보낼까요?", who:(sp.all?"전체":n0(v.n)+"명")+"에게 · "+t, sub:"푸시 도달 "+n0(v.reach)+"명 · 보낸 사람 "+tx.t+(v.hold?" · 보내면 "+v.hold+"초 동안 취소 가능":""),
    body:(force?band("warn","10분 안에 전체급 발송이 있었습니다 · 같은 사람들이 또 받습니다"):v.recent?band("warn",v.recent+"분 전에 전체급 발송이 있었습니다"):"")+(need?'<label class="fld">확인 · 푸시 도달 인원 숫자를 그대로 넣습니다<input class="in" id="ntCnt" inputmode="numeric" autocomplete="off" oninput="gateUpd()"></label>':''),
    focus:need?"ntCnt":"", ok:force?"그래도 보내기":"보내기", danger:!!force, gate:need?function(){ var c=el("ntCnt"), x=c?c.value.replace(/[\s,]/g,""):""; return /^\d+$/.test(x)&&Number(x)===num(v.reach); }:null,
    run:function(){ return call("notice_set",{ title:t, body:b, push:1, spec:JSON.stringify(sp), cnt:need?v.reach:null, force:force?1:null, by:ntBy(), nto:grp?1:null, pt:tx.t!==t?tx.t:null, pb:tx.t!==t?tx.b:null }).then(function(r){
      if(r&&r.ok===false&&r.reason==="push"&&r.push&&r.push.reason==="recent"&&!force){ setTimeout(function(){ ntConfirm(t, b, sp, grp, tx, v, 1); },220); return { ok:true, _again:1 }; }
      if(r&&r.ok===false&&r.reason==="push") return { ok:false, reason:(r.push||{}).reason||"push" };
      return r; }); },
    fail:function(r){ return r&&r.reason==="confirm"?"그 사이 인원이 바뀌었습니다 · 닫고 다시 보냅니다":"보내지 못했습니다 · 공지도 나가지 않았습니다 · "+ntWhy(r); },
    done:function(r){ if(r._again) return; var p=r.push||{}; if(p.hold&&p.id){ NT.hold={ id:p.id, until:Date.now()+p.hold*1000, t:t }; ntHoldPaint(); }
      ntDone(t, p.reason?" · 푸시 못 보냄("+ntWhy(p)+")":" · 푸시 "+n0(p.reach||0)+"명"+(p.hold?" · "+p.hold+"초 뒤 나감":"")); } });
}
function ntDone(t, more){ NT.t=""; NT.b=""; NT.pv=null; ntSave(); ntForm(); ntPvPaint(); reload(["pst","phist","nhist","nb"]); toast("보냈습니다 · "+t+(more||"")); }
function ntHoldPaint(){ var b=el("ntHold"); if(!b) return; var H=NT.hold, left=H?Math.ceil((H.until-Date.now())/1000):0;
  if(left<=0){ if(H){ NT.hold=null; reload(["phist"]); } b.innerHTML=""; return; }
  b.innerHTML=band("warn",'<b>푸시 보류 중 · <span class="n">'+left+'</span>초 뒤 나감</b> · '+esc(H.t),'<button class="btn sm dng" type="button" onclick="ntHoldCancel(\''+jq(H.id)+'\')">푸시 취소</button>'); }
setInterval(function(){ if(NT.hold&&S.tab==="notify") ntHoldPaint(); },1000);
function ntHoldCancel(id){ call("push_cancel",{ id:id, by:ntBy() }).then(function(r){ if(NT.hold&&NT.hold.id===id) NT.hold=null; ntHoldPaint(); reload(["phist","pst"]); toast(r&&r.ok?"푸시를 취소했습니다 · 앱 안 공지는 남음(보낸 기록에서 공지 중지)":"취소하지 못했습니다 · "+ntWhy(r),{ bad:!(r&&r.ok) }); }); }
function ntTest(){ var tx=ntPushTx(), me=(S.me&&S.me.emp)||aemp(); if(!NT.t.trim()){ toast("제목을 넣습니다"); return; }
  call("push_send",{ test:1, me:me, title:tx.t, body:tx.b, go:"notices", by:ntBy() }).then(function(r){ toast(r&&r.ok?"나에게 보냈습니다 · 내 기기 "+n0(r.subs||r.reach||0)+"대":"테스트 실패 · "+ntWhy(r),{ bad:!(r&&r.ok) }); reload(["phist"]); }); }
/* ── 보낸 기록(공지 + 푸시 한 명단) ── */
function ntHistRows(){
  var ph=S.data.phist, nh=S.data.nhist, rows=[];
  ((nh&&nh.ok&&nh.rows)||[]).forEach(function(r){ rows.push({ id:"n:"+r.id, nid:r.id, kind:"notice", kn:r.push?"공지 + 푸시":"앱 공지", t:r.at, title:r.title, body:r.body, desc:r.desc||"전체", n:r.to||"", reach:r.push?r.reach:"", fail:"", st:r.off?"중지됨":"보냄", by:r.by||"" }); });
  ((ph&&ph.ok&&ph.rows)||[]).forEach(function(j){ if(j.kind==="notice"&&j.st!=="대기") return; rows.push({ id:"p:"+j.id, pid:j.id, kind:"push", kn:j.kind==="test"?"시험":j.st==="대기"?"보류 중":(j.kname||j.kind||"푸시"), t:j.made, title:j.title, body:j.body||"", desc:j.desc||"", n:j.n, reach:j.ok, fail:j.fail, st:j.st||"", by:j.by||"" }); });
  return rows;
}
function ntHistOpen(k){
  var g=MG.nthist;
  rowDetail(g, k, { title:function(r){ return r.title||"(제목 없음)"; }, extra:function(r){
    return (r.body?'<div class="cc-fld">내용</div><div class="memo cc-memo">'+esc(r.body)+'</div>':'')+
      (r.kind==="notice"&&r.st!=="중지됨"?'<div class="btns mt"><button class="btn dng" type="button" onclick="ntStopNotice(\''+jq(r.nid)+'\')">공지 중지</button></div><p class="cap mt4">앱 화면에서 내립니다 · 이미 나간 푸시는 회수되지 않음</p>':'')+
      (r.kind==="push"&&r.st==="대기"?'<div class="btns mt"><button class="btn dng" type="button" onclick="ntHoldCancel(\''+jq(r.pid)+'\')">푸시 취소</button></div>':''); } });
}
function ntStopNotice(id){
  confirmBox({ t:"공지를 중지할까요?", who:"공지 "+id, sub:"다음 동기화 때 모든 기기 화면에서 사라짐 · 이미 나간 푸시는 회수되지 않음", ok:"공지 중지", danger:true,
    run:function(){ return call("notice_clear",{ id:id }); }, done:function(){ drwClose(); reload(["nhist","phist"]); toast("공지를 중지했습니다"); } });
}
