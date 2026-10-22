/* AXF CONTROL v2 · S6 알림 (261016 2단계)
 * 칩 = 보내기 · 예약(sched.js) · 보낸 기록 · 공지 · 자동 알림(ntf.js · 261021) · 맨 위 띠 = 푸시 상태(정상 · 공지 푸시 잠금 · 전체 정지 · push_cfg · 확인 창 · 되돌리기 토스트)
 *   261021 띠 아래 요약 한 줄 · 정상 · 잠금으로 바꾸는 확인 창에 「그러면 나갈 것」 목록(ntf.js ntfSoonLine · ntfSoonBody · 창을 열기 전에 ntf_list 를 새로 받음)
 * 보내기 = 받는 사람(전체 · 구분 · 사람 칩 검색) · 보낸 사람(기본 「AX Festival」) · 제목 · 내용 · 미리보기(잠금 화면 모양 + push_preview 인원)
 *   261022 기본 = 푸시만(push_send · 누르면 앱 홈) · 「앱 안 공지도 띄우기」 = notice_set(push=1 · spec · cnt · pt 보낸 사람 · pb 제목+내용) · 글자는 ntPay 한 곳
 *   → 확인 창 = 미리 보기(ntPrevH · 받는 사람 목록 · 푸시 닿음 · 안 닿음 · 보낸 사람 · 잠금 화면 · 앱 안 공지 · 보류 · 시간 밖) · 전체급이면 도달 인원 숫자 입력
 * 보낸 기록 = notice_hist + push_hist 한 명단 · 줄 상세 서랍에서 공지 중지(notice_clear) · 보류 중 푸시 취소(push_cancel) · 261016 PIN 없음 */
var NT_SUBS=[["send","보내기"],["hist","보낸 기록"]];
var NT_GRP=[["dap","AX 라운지 신청자"],["cc_wait","커피챗 대기"],["cc_match","커피챗 매칭"],["g","그룹"]];   /* 261021 (사용자) 예약과 같은 구분 · 스탬프 개수는 조건 칸으로 */
function ntC0(){ return { smin:"", smax:"", tk:"", rl:"", fl:"", dept:"", dev:"" }; }
var NT_MAX={ t:40, b:120, from:20 }, NT_FROM="AX Festival";
var NT=(function(){ var g={}; try{ g=JSON.parse(sessionStorage.getItem(skey("axf_v2_nt"))||"{}")||{}; }catch(e){} var c=g.c&&typeof g.c==="object"?g.c:ntC0(), tg=g.tgt||"all", gr=g.grp||"dap"; if(gr==="stamps"){ if(tg==="grp"){ tg="all"; c=ntC0(); c.smin=String(g.smin!=null?g.smin:3); c.smax=String(g.smax!=null?g.smax:6); } gr="dap"; } else if(gr==="cchat") gr="cc_wait"; return { tgt:tg, grp:gr, gname:g.gname||"", c:c, cOpen:false, ppl:g.ppl||[], from:g.from!=null?g.from:NT_FROM, t:g.t||"", b:g.b||"", ntc:g.ntc===true, pv:null, seq:0, q:"", qr:null, qseq:0, hold:null }; })();
function ntSave(){ try{ sessionStorage.setItem(skey("axf_v2_nt"),JSON.stringify({ tgt:NT.tgt, grp:NT.grp, gname:NT.gname, c:NT.c, ppl:NT.ppl, from:NT.from, t:NT.t, b:NT.b, ntc:NT.ntc })); }catch(e){} }
function ntAddPerson(p){ if(!p||!p.emp) return; NT.tgt="ppl"; if(!NT.ppl.some(function(x){ return x.emp===p.emp; })) NT.ppl.push({ emp:p.emp, name:p.name||"", dept:p.dept||"" }); NT.pv=null; ntSave(); }
function ntSub(){ var s=S.sub.notify; return NT_SUBS.some(function(x){ return x[0]===s; })?s:"send"; }   /* 261021 알림 = 설정 탭 칩(S.sub.log = ntf) · 안쪽 칩 = S.sub.notify */
function ntOn(){ return S.tab==="log"&&S.sub.log==="ntf"; }
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
    ntTxN(); ntSubPaint(); var hb=el("ntForm")&&el("ntForm").getAttribute("data-push"); if(hb!==(pushSt()?"1":"0")) ntForm(); if(pushSt()&&!NT.pv&&!NT.pvBusy) ntPvGo(); else ntPvPaint();
  }
};
/* ── 푸시 상태 띠 · 정지 ── */
function ntCur(){ var st=pushSt(); return !st?"":!st.on?"stop":st.manual===0?"lock":"ok"; }
function ntStopPaint(){
  var box=el("ntStop"); if(!box) return; var st=pushSt(), cur=ntCur();
  if(!st){ box.innerHTML=S.data.pst&&S.data.pst.ok===false?band("warn","푸시 상태를 받지 못했습니다 · "+esc(why(S.data.pst))):S.data.pst?band("info","이 서버는 알림 기능이 없어 앱 안 공지만 나갑니다"):""; return; }
  var seg='<span class="seg">'+[["ok","정상"],["lock","공지 푸시 잠금"],["stop","전체 정지"]].map(function(x){ return '<button type="button" class="'+(cur===x[0]?"on":"")+'" aria-pressed="'+(cur===x[0])+'" onclick="ntStopAsk(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</span>';
  box.innerHTML=band(cur==="ok"?"info":cur==="lock"?"warn":"bad",'<b>푸시 '+(cur==="ok"?"정상":cur==="lock"?"공지 푸시 잠금":"전체 정지")+'</b> · '+(cur==="ok"?"공지 · 예약 · 자동 알림이 나감":cur==="lock"?"공지 · 대상 지정 · 예약 푸시가 나가지 않음 · 자동 알림은 나감":"모든 푸시가 멈춤")+(st.dateOk===0?" · 오늘은 발송 허용 날짜가 아님":"")+(st.err?" · 발송기 오류 있음":""),seg)+(typeof ntfSoonLine==="function"?ntfSoonLine(cur):"");
}
function ntStopAsk(to){
  var cur=ntCur(); if(!cur||to===cur) return;
  var p=to==="ok"?{ on:"ON", manual:"ON" }:to==="lock"?{ on:"ON", manual:"OFF" }:{ on:"OFF" };
  var NM={ ok:"정상", lock:"공지 푸시 잠금", stop:"전체 정지" };
  var ask=function(){ confirmBox({ t:to==="ok"?"푸시를 다시 켤까요?":to==="lock"?"공지 푸시를 잠글까요?":"푸시를 전체 정지할까요?", who:NM[cur]+" → "+NM[to],
    sub:to==="ok"?"공지 푸시 · 예약 · 자동 알림이 다시 나감 · 아래가 나갈 것":to==="lock"?"공지 · 대상 지정 · 예약 푸시가 멈추고 보류 중인 사람 알림은 취소 · 커피챗 · 라운지 자동 알림은 나감":"자동 알림까지 모든 푸시가 멈춤 · 오발송이 이어질 때",
    body:to!=="stop"&&typeof ntfSoonBody==="function"?ntfSoonBody(to):"",
    ok:to==="ok"?"다시 켜기":to==="lock"?"잠그기":"전체 정지", danger:to!=="ok",
    run:function(){ return call("push_cfg",p); },
    done:function(r){ S.data.pst=r&&r.rt!=null?r:S.data.pst; reload(["pst","nb"]); paint(); toast(to==="ok"?"푸시를 다시 켰습니다":to==="lock"?"공지 푸시를 잠갔습니다":"푸시를 전체 정지했습니다",{ undo:function(){ call("push_cfg",cur==="ok"?{ on:"ON", manual:"ON" }:cur==="lock"?{ on:"ON", manual:"OFF" }:{ on:"OFF" }).then(function(x){ reload(["pst","nb"]); toast(x&&x.ok?"되돌렸습니다 · 푸시 "+NM[cur]:"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); } }); } }); };
  if(to!=="stop"&&typeof ntfFresh==="function") ntfFresh(ask); else ask();
}
/* ── 보내기 ── */
function ntBase(){
  if(NT.tgt==="all") return {};
  if(NT.tgt==="grp") return NT.grp==="dap"?{ group:"dap" }:NT.grp==="cc_wait"?{ group:"cchat", st:"대기" }:NT.grp==="cc_match"?{ group:"cchat", st:"매칭" }:NT.gname?{ group:"g:"+NT.gname }:null;
  var L=NT.ppl.map(function(x){ return x.emp; }); return L.length&&L.length<=50?{ emps:L }:null;
}
function ntCond(){ return typeof schCondOf==="function"?schCondOf(NT.c):{}; }
function ntSpec(){ var b=ntBase(), c=ntCond(); if(!b||!c) return null; for(var k in c) b[k]=c[k]; if(NT.tgt==="all"&&!Object.keys(c).length) b.all=1; return b; }
/* 앱 공지도 고른 사람에게만 = 전체(조건 없음)가 아닐 때 */
function ntTo(){ var sp=ntSpec(); return !!(sp&&!sp.all); }
function ntTgtTx(){ var sp=ntSpec(), d=sp&&typeof schCondTx==="function"?schCondTx(sp):[];
  var g=NT.tgt==="all"?(d.length?"":"전체"):NT.tgt==="grp"?(NT_GRP.filter(function(x){ return x[0]===NT.grp; })[0]||[0,""])[1]+(NT.grp==="g"?" "+(NT.gname||"(고르기)"):""):NT.ppl.length+"명(사람)";
  return (g?[g]:[]).concat(d).join(" · "); }
function ntPushTx(){ var t=NT.t.trim(), b=NT.b.trim(), st=pushSt()||{}; return st.ntgt?{ t:(NT.from.trim()||NT_FROM), b:t+(b?"\n"+b:"") }:{ t:t, b:b }; }
/* 261022 (사용자) 기본 = 푸시만 · 「앱 안 공지도 띄우기」를 켜면 공지 + 푸시 · 알림 기능이 없는 서버면 공지만 */
function ntNtc(){ return !!NT.ntc||!pushSt(); }
/* 실제로 나가는 글자 한 곳 · 옆 미리보기 · 확인 창 미리 보기 · 보내기 · 나에게 테스트가 모두 이것을 쓴다
 * 공지 + 푸시 = notice_set(pt · pb 는 보낸 사람 형식일 때만 · 서버는 pt 가 있으면 pt · pb, 없으면 공지 제목 · 내용) · 누르면 공지 목록
 * 푸시만 = push_send(대상 지정 · 보낸 사람 형식 글자 그대로) · 누르면 앱 홈 */
function ntPay(t, b, ntc){ var tx=ntPushTx(), pt=ntc&&tx.t!==t;
  return ntc?{ ntc:1, t:t, b:b, pt:pt?tx.t:null, pb:pt?tx.b:null, pushT:pt?tx.t:t, pushB:pt?tx.b:b, go:"notices" }:{ ntc:0, t:t, b:b, pushT:tx.t, pushB:tx.b, go:"home" }; }
function ntForm(){
  var f=el("ntForm"); if(!f) return;
  f.setAttribute("data-push",pushSt()?"1":"0");
  f.innerHTML='<h2>보낼 말 <span class="cap">'+(ntNtc()?"앱 안 공지 + 푸시":"푸시")+'</span></h2>'+
    '<div class="nt-f"><div class="nt-l" id="ntTgtL">받는 사람</div><div class="chips" role="radiogroup" aria-labelledby="ntTgtL" style="margin:0">'+[["all","전체"],["grp","구분"],["ppl","사람"]].map(function(x){ return '<button type="button" role="radio" aria-checked="'+(NT.tgt===x[0])+'" class="chip'+(NT.tgt===x[0]?" on":"")+'" onclick="ntTgt(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</div>'+
    (NT.tgt==="grp"?'<div class="chips mt4" role="radiogroup" aria-label="구분" style="margin:6px 0 0">'+NT_GRP.map(function(x){ return '<button type="button" role="radio" aria-checked="'+(NT.grp===x[0])+'" class="chip'+(NT.grp===x[0]?" on":"")+'" onclick="ntGrp(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</div>'+
      (NT.grp==="g"?'<div class="nt-row mt4"><label class="up-f">그룹'+ntGrpSel()+'</label></div>':'<p class="cap mt4">'+(NT.grp==="dap"?"AX 라운지 상담 신청 · 승인 상태인 사람":NT.grp==="cc_wait"?"커피챗 희망 · 아직 선정 전인 사람":"커피챗 선정(매칭)된 사람")+'</p>'):"")+
    (NT.tgt==="ppl"?'<div class="nt-ppl mt4" id="ntPpl"></div><div class="nt-q"><input class="xg-q" id="ntQ" type="search" autocomplete="off" placeholder="사번 · 이름으로 찾아 더하기" aria-label="받는 사람 찾기" value="'+esc(NT.q)+'" oninput="ntQ(this.value)"><div class="nt-qr" id="ntQr"></div></div><p class="cap mt4">한 번에 50명까지 · 한 사람 카드 「이 사람에게 푸시」가 여기에 더합니다</p>':"")+'</div>'+
    (typeof schCondBox==="function"?schCondBox(NT.c,"nt","ntC",NT.cOpen,"NT.cOpen=this.open","NT.c=ntC0();NT.pv=null;ntSave();ntForm();ntPvGo()"):"")+
    (ntTo()&&ntNtc()?'<p class="cap mt4">앱 안 공지도 고른 사람에게만 나갑니다</p>':'')+
    '<label class="nt-f up-f">보낸 사람 <span class="cap">푸시 제목 자리 · 기본 '+NT_FROM+'</span><input class="xg-q nt-in" id="ntFrom" maxlength="'+NT_MAX.from+'" value="'+esc(NT.from)+'" oninput="ntIn(\'from\',this.value)"></label>'+
    '<label class="nt-f up-f">제목 <span class="cap" id="ntCT"></span><input class="xg-q nt-in" id="ntT" maxlength="'+NT_MAX.t+'" placeholder="예: 17:00 Closing Speech 곧 시작" value="'+esc(NT.t)+'" oninput="ntIn(\'t\',this.value)"></label>'+
    '<label class="nt-f up-f">내용 <span class="cap" id="ntCB"></span><textarea id="ntB" rows="3" maxlength="'+NT_MAX.b+'" placeholder="잠금 화면에 그대로 보입니다 · 이름 · 행운권 수 · 경품은 쓰지 않습니다" oninput="ntIn(\'b\',this.value)">'+esc(NT.b)+'</textarea></label>'+
    (pushSt()?'<label class="up-ck nt-f"><input type="checkbox"'+(NT.ntc?" checked":"")+' onchange="ntIn(\'ntc\',this.checked);ntForm()"> 앱 안 공지도 띄우기</label>':'<p class="cap nt-f">이 서버는 알림 기능이 없어 앱 안 공지로 나갑니다</p>')+
    '<div class="btns mt"><button class="btn pri" type="button" onclick="ntAsk()">보내기</button><button class="btn" type="button" onclick="ntTest()">나에게 테스트</button></div>';
  ntPplPaint(); ntCnt();
}
function ntTgt(t){ NT.tgt=t; NT.pv=null; ntSave(); ntForm(); ntPvGo(); if(t==="grp"&&NT.grp==="g") ntGrpLoad(); if(t==="ppl") setTimeout(function(){ var i=el("ntQ"); if(i) i.focus(); },30); }
function ntGrp(g){ NT.grp=g; NT.pv=null; ntSave(); ntForm(); ntPvGo(); if(g==="g") ntGrpLoad(); }
function ntGrpSel(){ var g=typeof SCH!=="undefined"?SCH.grps:null; if(!g) return '<span class="cap"> 그룹을 불러오는 중</span>'; if(!g.ok) return '<span class="cap"> 그룹을 불러오지 못했습니다 · '+esc(why(g))+'</span>';
  var L=g.groups||[]; if(!L.length) return '<span class="cap"> 만든 그룹이 없습니다</span>';
  return '<select id="ntG" onchange="NT.gname=this.value;NT.pv=null;ntSave();ntForm();ntPvGo()">'+[["","그룹 고르기"]].concat(L.map(function(x){ return [x.name, x.name+" · "+n0(x.n)+"명"]; })).map(function(o){ return '<option value="'+esc(o[0])+'"'+(o[0]===NT.gname?" selected":"")+'>'+esc(o[1])+'</option>'; }).join("")+'</select>'; }
function ntGrpLoad(){ if(typeof SCH==="undefined"||(SCH.grps&&SCH.grps.ok)) return; call("push_group_list",{}).then(function(r){ SCH.grps=r||{ ok:false }; ntForm(); }); }
function ntC(k, v, typed){ NT.pv=null; schCondSet(NT.c, k, v, typed, "nt", ntForm); ntSave(); clearTimeout(NT._q); NT._q=setTimeout(ntPvGo,450); ntPvPaint(); }
function ntIn(k, v){ NT[k]=k==="ntc"?!!v:v; NT.pv=null; ntSave(); if(k==="t"||k==="b"||k==="from") ntCnt(); clearTimeout(NT._q); NT._q=setTimeout(ntPvGo,450); ntPvPaint(); }
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
  if(!pushSt()){ ntPvPaint(); return; }
  var sp=ntSpec(), pay=ntPay(NT.t.trim(), NT.b.trim(), ntNtc()); if(!NT.t.trim()||!sp){ NT.pv=null; ntPvPaint(); return; }
  var s=++NT.seq; NT.pvBusy=1; ntPvPaint();
  call("push_preview",{ spec:JSON.stringify(sp), title:pay.pushT, body:pay.pushB, go:pay.go }).then(function(r){ if(s!==NT.seq) return; NT.pvBusy=0; NT.pv=r||{ ok:false }; ntPvPaint(); });
}
var NT_WHY={ nopush:"이 서버에는 알림 기능이 없습니다", text:"제목 40자 · 푸시 본문(제목 + 내용) 120자까지", spec:"받는 사람이 올바르지 않습니다", confirm:"인원이 바뀌었습니다", recent:"10분 안에 전체급 발송이 있었습니다", dup:"같은 제목 · 같은 대상으로 5분 안에 보냈습니다",
  allmax:"전체급 발송 하루 상한입니다", time:"보낼 수 있는 시간 밖입니다", off:"푸시 전체 정지 중입니다", empty:"받을 사람이 없습니다", manual:"공지 푸시 잠금 중입니다", date:"오늘은 발송 허용 날짜가 아닙니다(나에게 테스트만)", by:"보내는 사람을 확인합니다", run:"이미 나가기 시작해 취소할 수 없습니다" };
function ntWhy(r){ r=r||{}; return NT_WHY[r.reason]||why(r); }
/* 휴대폰에 찍히는 모양 · 앱 이름(manifest short_name) · 아이콘(sw.js showNotification icon) · 굵은 줄 = 푸시 제목(pushT) · 아래 = 푸시 본문(pushB) */
var NT_APP="AX Festival", NT_ICON="../../icons/icon-192.png";
function ntLockH(pay){
  return '<div class="ntpv-lock" role="img" aria-label="휴대폰 잠금 화면 알림 모양"><div class="ntpv-lk-h"><img src="'+NT_ICON+'" alt="" width="20" height="20"><span>'+esc(NT_APP)+'</span><span class="ntpv-now">지금</span></div>'+
    '<b class="ntpv-lk-t">'+esc(pay.pushT||"보낸 사람")+'</b><div class="ntpv-lk-b">'+(pay.pushB?esc(pay.pushB):'<span class="ntpv-ph">제목 · 내용</span>')+'</div></div>'; }
/* 앱 안 공지 = 앱을 열면 뜨는 공지 창(앱 ntcOpen 과 같은 순서 · 제목 · 「공지」 칩 · 시각 · 내용 · 주소가 있으면 「링크 열기」) */
function ntAppH(pay){ var d=new Date(), hm=("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2), u=/https?:\/\/[^\s<>"']+/.test(pay.b||"");
  return '<div class="ntpv-app" role="img" aria-label="앱 안 공지 창 모양"><b class="ntpv-app-t">'+esc(pay.t||"제목")+'</b><div class="ntpv-app-c"><span class="ntpv-chip">공지</span><span>'+hm+'</span></div>'+
    (pay.b?'<p class="ntpv-app-b">'+esc(pay.b)+'</p>':'')+'<div class="ntpv-app-btn">'+(u?"링크 열기":"확인")+'</div></div>'; }
function ntPvPaint(){
  var box=el("ntPv"); if(!box) return; var st=pushSt(), v=NT.pv, ntc=ntNtc(), pay=ntPay(NT.t.trim(), NT.b.trim(), ntc);
  var line=!st?(S.data.pst&&S.data.pst.ok?"앱 안 공지만 나갑니다":"알림 상태를 받는 중"):!NT.t.trim()?"제목을 넣으면 받는 인원이 나옵니다":!ntSpec()?"받는 사람을 고릅니다":NT.pvBusy?"받는 사람을 세는 중":!v?"":!v.ok?'<span style="color:var(--bad)">'+esc(ntWhy(v))+'</span>':
    '받는 사람 <b class="n">'+n0(v.n)+'</b>명 · 푸시 도달 <b class="n">'+n0(v.reach)+'</b>명 · 기기 '+n0(v.subs)+'대'+(!ntc&&num(v.miss)?' · <span style="color:var(--warn)">못 받음 '+n0(v.miss)+'명</span>':'')+(v.block?' · <span style="color:var(--bad)">'+esc(NT_WHY[v.block]||v.block)+'</span>':'')+(v.need?' · 보낼 때 인원 숫자 확인'+(v.hold?' · '+v.hold+'초 보류':''):'')+((v.warn||[]).length?' · <span style="color:var(--warn)">'+esc(v.warn.join(" · "))+'</span>':'');
  var pbLen=pay.pushB.length;
  box.innerHTML='<h2>미리보기 <span class="cap">'+esc(ntTgtTx())+'</span></h2>'+
    (st?ntLockH(pay)+'<div class="cap mt4">잠금 화면 · 푸시 본문 '+pbLen+' / 120'+(pbLen>120?' · <b style="color:var(--bad)">넘음</b>':'')+'</div>':'')+
    (ntc?'<div class="mt">'+ntAppH(pay)+'</div><div class="cap mt4">앱 안 공지</div>':'')+'<div class="cap mt">'+line+'</div>';
}
function ntSubPaint(){ var b=el("ntSub"); if(!b) return; var st=pushSt(), td=st&&st.today||{};
  b.innerHTML='<h2>오늘 푸시</h2><div class="mini">'+[["구독 기기",st?n0(st.subs):"-","대"],["오늘 발송",n0(td.jobs||0),"건"],["성공",n0(td.ok||0),"건"],["실패",n0(td.fail||0),"건"]].map(function(x){ return '<div><div class="cap">'+x[0]+'</div><div class="v">'+x[1]+'<small> '+x[2]+'</small></div></div>'; }).join("")+'</div>'+(st?'<p class="cap mt4">보낼 수 있는 시간 '+esc(st.time||"-")+' · 전체급 하루 '+n0(st.limits&&st.limits.all)+'회 · 사람 지정 50명까지</p>':''); }
function ntBy(){ return "콘솔 "+((S.me&&S.me.emp)||aemp()); }
/* ── 261022 (사용자) 확인 창 = 미리 보기 · 받는 사람(목록 · 푸시 닿음 · 안 닿음) · 보낸 사람(휴대폰에 찍히는 이름 · 아이콘) · 최종 메시지(잠금 화면 · 앱 안 공지) · 지금 안 나가거나 늦게 나가는 사실 ── */
var NT_BLK_TX={ time:"보낼 수 있는 시간 밖이라", date:"오늘은 푸시 발송 날짜가 아니라", manual:"공지 푸시 잠금 중이라", off:"푸시 전체 정지 중이라" };
function ntAcct(){ var nb=S.data.nb; return nb&&nb.ok&&nb.people?num(nb.people.acct):0; }
function ntWho(sp, v){ var a=ntAcct(); return sp.all?"전체"+(a?" "+n0(a)+"명":""):v?n0(v.n)+"명":NT.tgt==="ppl"?n0(NT.ppl.length)+"명":ntTgtTx(); }
function ntPrevH(o){
  var v=o.v||{}, sp=o.sp, pay=o.pay, ntc=!!pay.ntc, push=!!o.push, st=pushSt()||{}, all=!!sp.all, a=ntAcct();
  var n=all?a:o.v?num(v.n):NT.tgt==="ppl"?NT.ppl.length:0, reach=push?num(v.reach):0, miss=all?Math.max(0,a-reach):Math.max(0,n-reach);
  var sec=function(h, body){ return '<section class="ntpv-sec"><div class="ntpv-h">'+h+'</div>'+body+'</section>'; };
  /* 받는 사람 */
  var head='<div class="ntpv-who"><b>'+(all?"전체"+(a?' <span class="n">'+n0(a)+'</span>명':""):n||o.v?'<span class="n">'+n0(n)+'</span>명':"")+'</b><span class="cap">'+esc(ntTgtTx().replace(/^\d+명\(사람\)/,"사람 지정"))+(all&&ntc?" · 앱을 여는 모든 사람":"")+'</span></div>';
  var stat='<div class="ntpv-st">'+(push?
      '<div><span class="cap">푸시 닿음</span><b><span class="n">'+n0(reach)+'</span>명</b><span class="cap">기기 '+n0(v.subs)+'대</span></div>'+
      '<div class="'+(!ntc&&miss?"miss":"")+'"><span class="cap">푸시 안 닿음</span><b><span class="n">'+n0(miss)+'</span>명</b><span class="cap">'+(ntc?"앱 안 공지로만 보임":"받지 못함(앱 안 공지 꺼짐)")+'</span></div>':
      '<div><span class="cap">푸시</span><b>나가지 않음</b><span class="cap">'+(ntc?"모두 앱 안 공지로 봄":"")+'</span></div>')+'</div>';
  var list="";
  if(NT.tgt==="ppl"&&!all){
    var bad=v.bad||[], rows=function(L, off){ return L.map(function(p, i){ var w=whoOf(p), k=off+i;
      return '<tr><td class="n">'+esc(w.e||p.emp)+'</td><td>'+esc(w.n||"-")+'</td><td>'+esc(w.d||"-")+'</td><td id="ntpr'+k+'">'+(bad.indexOf(p.emp)>=0?tag("명부에 없음","bad"):push&&k<10?'<span class="cap">확인 중</span>':"")+'</td></tr>'; }).join(""); };
    list='<table class="ntpv-ppl"><tbody>'+rows(NT.ppl.slice(0,10),0)+'</tbody></table>'+
      (NT.ppl.length>10?'<details class="ntpv-more"><summary>외 '+n0(NT.ppl.length-10)+'명</summary><table class="ntpv-ppl"><tbody>'+rows(NT.ppl.slice(10),10)+'</tbody></table></details>':'')+
      (o.v&&num(v.n)<NT.ppl.length?'<p class="cap mt4">조건에 맞는 '+n0(v.n)+'명이 받음</p>':'');
  } else if(push&&(v.sample||[]).length) list='<p class="cap mt4">푸시 받는 사람 예(이름 가림) · '+esc(v.sample.join(" · "))+(reach>v.sample.length?" 외":"")+'</p>';
  var h=sec("받는 사람", head+stat+list);
  /* 보낸 사람 */
  if(push) h+=sec("보낸 사람", '<dl class="ntpv-dl"><dt>굵은 첫 줄</dt><dd><b>'+esc(pay.pushT)+'</b> <span class="cap">'+(pay.pushT===pay.t?"공지 제목":"보낸 사람 칸")+'</span></dd>'+
    '<dt>앱 이름 · 아이콘</dt><dd><img src="'+NT_ICON+'" alt="" width="20" height="20"> '+esc(NT_APP)+' <span class="cap">홈 화면 앱 · 크롬 브라우저로 받으면 Chrome · hiax.app</span></dd></dl>');
  /* 최종 메시지 */
  h+=sec("최종 메시지", '<div class="ntpv-msg">'+
    (push?'<div>'+ntLockH(pay)+'<p class="cap mt4">잠금 화면 · 푸시 본문 '+pay.pushB.length+' / 120 · 누르면 '+(pay.go==="notices"?"앱 › 공지 목록":"앱 홈")+'</p></div>':'')+
    (ntc?'<div>'+ntAppH(pay)+'<p class="cap mt4">앱 안 공지 · 앱을 열면 이 창 · 공지 목록에 남음</p></div>':'')+'</div>');
  /* 지금 안 나가거나 늦게 나감 */
  var tl=o.blk?(o.blk==="time"&&(v.time||st.time)?"보낼 수 있는 시간("+(v.time||st.time)+") 밖이라":NT_BLK_TX[o.blk])+" 푸시는 지금 나가지 않음 · 앱 안 공지만 나감":push&&num(v.hold)?"보내면 "+v.hold+"초 뒤에 나감 · 그 사이 「푸시 취소」 가능":"";
  if(tl) h+=band(o.blk?"warn":"info", esc(tl));
  if(push&&st.limits&&st.limits.day) h+='<p class="cap">한 사람 하루 '+n0(st.limits.day)+'회까지 · 넘은 사람은 빠짐</p>';
  return '<div class="ntpv">'+h+'</div>';
}
/* 고른 사람 앞 10명 · 한 명씩 푸시가 닿는지(push_preview 읽기만 · 같은 조건 · 같은 글자) */
function ntPerReach(sp, pay){ if(NT.tgt!=="ppl"||sp.all) return;
  NT.ppl.slice(0,10).forEach(function(p, i){ var c=el("ntpr"+i); if(!c||c.querySelector(".tag")) return; var s1={}; for(var k in sp) s1[k]=sp[k]; s1.emps=[p.emp];
    call("push_preview",{ spec:JSON.stringify(s1), title:pay.pushT, body:pay.pushB, go:pay.go }).then(function(r){ var c2=el("ntpr"+i); if(!c2) return;
      c2.innerHTML=!r||!r.ok?'<span class="cap">-</span>':!num(r.n)?tag("조건 밖","off"):num(r.reach)?tag("푸시 닿음","ok"):tag(pay.ntc?"공지로만":"못 받음",pay.ntc?"off":"warn"); }); }); }
function ntAsk(){
  var t=NT.t.trim(), b=NT.b.trim(), sp=ntSpec(), grp=ntTo(), ntc=ntNtc(), pay=ntPay(t, b, ntc);
  if(!t){ toast("제목을 넣습니다"); el("ntT").focus(); return; }
  if(/○○/.test(t+b)){ toast("○○ 칸을 채웁니다"); return; }
  if(!sp){ toast(ntCond()?"받는 사람을 고릅니다 · 사람 1~50명 · 그룹":"조건을 확인합니다"); return; }
  if(!pushSt()){ ntConfirmNtc(t, b, sp, grp, pay, null, ""); return; }
  call("push_preview",{ spec:JSON.stringify(sp), title:pay.pushT, body:pay.pushB, go:pay.go }).then(function(v){
    if(!v||!v.ok){ toast("보낼 수 없습니다 · "+ntWhy(v),{ bad:1, ms:5000 }); return; }
    if(v.block){
      if(ntc&&NT_BLK_TX[v.block]){ ntConfirmNtc(t, b, sp, grp, pay, v, v.block); return; }
      toast("푸시를 보낼 수 없습니다 · "+(NT_WHY[v.block]||v.block)+(NT_BLK_TX[v.block]?" · 「앱 안 공지도 띄우기」를 켜면 앱 안 공지만 나감":""),{ bad:1, ms:6000 }); return; }
    if(!ntc&&!num(v.reach)){ toast("푸시가 닿는 사람이 없습니다 · 「앱 안 공지도 띄우기」를 켜면 앱 안 공지로 보임",{ bad:1, ms:6000 }); return; }
    ntConfirm(t, b, sp, grp, pay, v, 0);
  });
}
/* 앱 안 공지만(알림 기능 없는 서버 · 푸시가 시간 · 날짜 · 잠금 · 정지로 막혔을 때) */
function ntConfirmNtc(t, b, sp, grp, pay, v, blk){
  confirmBox({ t:"공지를 보낼까요?", who:ntWho(sp, v)+"에게 · "+t, sub:blk?"푸시는 나가지 않음 · 앱 안 공지만":"앱 안 공지", body:ntPrevH({ sp:sp, v:v, pay:pay, push:false, blk:blk }), ok:blk?"앱 안 공지만 보내기":"보내기",
    run:function(){ return call("notice_set",grp?{ title:t, body:b, nto:1, spec:JSON.stringify(sp), by:ntBy() }:{ title:t, body:b, by:ntBy() }); },
    fail:function(r){ return ntWhy(r); }, done:function(){ ntDone(t, " · 앱 안 공지만"); } });
}
function ntConfirm(t, b, sp, grp, pay, v, force){
  var need=!!v.need, ntc=!!pay.ntc;
  confirmBox({ t:force?"그래도 보낼까요?":ntc?"공지 · 푸시를 보낼까요?":"푸시를 보낼까요?", who:ntWho(sp, v)+"에게 · "+t, sub:"푸시 닿음 "+n0(v.reach)+"명 · 보낸 사람 "+pay.pushT+(ntc?" · 앱 안 공지 함께":" · 앱 안 공지 없음"),
    body:(force?band("warn","10분 안에 전체급 발송이 있었습니다 · 같은 사람들이 또 받습니다"):v.recent?band("warn",v.recent+"분 전에 전체급 발송이 있었습니다"):"")+ntPrevH({ sp:sp, v:v, pay:pay, push:true })+(need?'<label class="fld">확인 · 푸시 도달 인원 숫자를 그대로 넣습니다<input class="in" id="ntCnt" inputmode="numeric" autocomplete="off" oninput="gateUpd()"></label>':''),
    focus:need?"ntCnt":"", ok:force?"그래도 보내기":"보내기", danger:!!force, gate:need?function(){ var c=el("ntCnt"), x=c?c.value.replace(/[\s,]/g,""):""; return /^\d+$/.test(x)&&Number(x)===num(v.reach); }:null,
    run:function(){
      var q=ntc?call("notice_set",{ title:t, body:b, push:1, spec:JSON.stringify(sp), cnt:need?v.reach:null, force:force?1:null, by:ntBy(), nto:grp?1:null, pt:pay.pt, pb:pay.pb })
        :call("push_send",{ spec:JSON.stringify(sp), title:pay.pushT, body:pay.pushB, go:pay.go, cnt:need?v.reach:null, force:force?1:null, by:ntBy() });
      return q.then(function(r){
        if(r&&r.ok===false){ var rs=ntc?(r.reason==="push"?(r.push||{}).reason||"push":r.reason):r.reason;
          if(rs==="recent"&&!force){ setTimeout(function(){ ntConfirm(t, b, sp, grp, pay, v, 1); },220); return { ok:true, _again:1 }; }
          return ntc&&r.reason!=="push"?r:{ ok:false, reason:rs||"push" }; }
        return ntc||!r?r:{ ok:true, push:{ id:r.id, reach:r.reach, hold:r.hold } }; }); },
    fail:function(r){ return r&&r.reason==="confirm"?"그 사이 인원이 바뀌었습니다 · 닫고 다시 보냅니다":"보내지 못했습니다"+(ntc?" · 공지도 나가지 않았습니다":"")+" · "+ntWhy(r); },
    done:function(r){ if(r._again) return; var p=r.push||{}; if(p.hold&&p.id){ NT.hold={ id:p.id, until:Date.now()+p.hold*1000, t:t, ntc:ntc?1:0 }; ntHoldPaint(); }
      ntDone(t, p.reason?" · 푸시 못 보냄("+ntWhy(p)+")":" · 푸시 "+n0(p.reach||0)+"명"+(p.hold?" · "+p.hold+"초 뒤 나감":"")+(ntc?"":" · 앱 안 공지 없음")); } });
  ntPerReach(sp, pay);
}
function ntDone(t, more){ NT.t=""; NT.b=""; NT.pv=null; ntSave(); ntForm(); ntPvPaint(); reload(["pst","phist","nhist","nb"]); toast("보냈습니다 · "+t+(more||"")); }
function ntHoldPaint(){ var b=el("ntHold"); if(!b) return; var H=NT.hold, left=H?Math.ceil((H.until-Date.now())/1000):0;
  if(left<=0){ if(H){ NT.hold=null; reload(["phist"]); } b.innerHTML=""; return; }
  b.innerHTML=band("warn",'<b>푸시 보류 중 · <span class="n">'+left+'</span>초 뒤 나감</b> · '+esc(H.t),'<button class="btn sm dng" type="button" onclick="ntHoldCancel(\''+jq(H.id)+'\')">푸시 취소</button>'); }
setInterval(function(){ if(NT.hold&&ntOn()) ntHoldPaint(); },1000);
function ntHoldCancel(id){ var po=!!(NT.hold&&NT.hold.id===id&&NT.hold.ntc===0); call("push_cancel",{ id:id, by:ntBy() }).then(function(r){ if(NT.hold&&NT.hold.id===id) NT.hold=null; ntHoldPaint(); reload(["phist","pst"]); toast(r&&r.ok?(po?"푸시를 취소했습니다":"푸시를 취소했습니다 · 앱 안 공지는 남음(보낸 기록에서 공지 중지)"):"취소하지 못했습니다 · "+ntWhy(r),{ bad:!(r&&r.ok) }); }); }
/* 나에게 테스트 = 고른 값 그대로(푸시만 · 앱 안 공지도) · 같은 글자(ntPay) · 앱 안 공지는 나에게만(nto · 내 사번) */
function ntTest(){ var t=NT.t.trim(), b=NT.b.trim(), ntc=ntNtc(), pay=ntPay(t, b, ntc), me=(S.me&&S.me.emp)||aemp(); if(!t){ toast("제목을 넣습니다"); return; }
  var J=[pushSt()?call("push_send",{ test:1, me:me, title:pay.pushT, body:pay.pushB, go:pay.go, by:ntBy() }):Promise.resolve(null)];
  if(ntc) J.push(call("notice_set",{ title:t, body:b, nto:1, spec:JSON.stringify({ emps:[me] }), by:ntBy() }));
  Promise.all(J).then(function(a){ var p=a[0], n=a[1], ok=(!p||p.ok)&&(!ntc||(n&&n.ok));
    toast([p?(p.ok?"나에게 푸시 · 내 기기 "+n0(p.subs||p.reach||0)+"대":"푸시 테스트 실패 · "+ntWhy(p)):"", ntc?(n&&n.ok?"앱 안 공지 나에게":"앱 안 공지 실패 · "+ntWhy(n)):""].filter(Boolean).join(" · "),{ bad:!ok }); reload(["phist","nhist"]); }); }
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
