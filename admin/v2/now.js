/* AXF CONTROL v2 · S1 지금 (261016)
 * 탭은 고정, 이 화면만 시간대(서버 시각)에 따라 위 칩과 카드 순서가 바뀐다(2_화면 설계 S1 · 대안 B).
 * 261022 대시보드 모양 · 움직임 = dashfx.js(단계 알약 · 지표 칸 · 막대 · 게이지 · 처음 들어올 때만 등장) · 서버 now_board scan.h · st.h = 최근 2시간 10분 칸
 * 데이터 = now_board(공통) · roll_stat · inv_state · kit_size_state · 모두 읽기, PIN 없음 · 261021 스태프 「운영자에게 요청」 폐지(카드 걷음 · 서버 기록은 남김) */
var PHASES=[
  { id:"prep", a:"00:00", n:"07:00 준비", nx:"08:00 체크인 시작" },
  { id:"ck", a:"08:00", n:"08:00 체크인", nx:"09:30 Opening · 룰렛 · 라운지 시작" },
  { id:"am", a:"09:30", n:"09:30 오전", nx:"13:00 커피챗 · 오후 강연" },
  { id:"pm", a:"13:00", n:"13:00 오후", nx:"16:40 Closing 준비" },
  { id:"close", a:"16:40", n:"16:40 Closing", nx:"17:30 마무리" },
  { id:"after", a:"17:30", n:"행사 후", nx:"10/27 발송 · 정리" }
];
function nowPhase(){
  var b=S.data.nb; if(!b||!b.ok) return null;
  var day=String(b.day||""), ev=String(b.ev||"");
  if(day&&ev&&day<ev) return { id:"pre", n:"행사 전", nx:"행사일 "+ev.slice(5).replace("-","/")+" 07:00 준비", off:1 };
  if(day&&ev&&day>ev) return PHASES[5];
  var t=mins(hm(srvNow().toTimeString())), p=PHASES[0];
  PHASES.forEach(function(x){ if(t>=mins(x.a)) p=x; });
  return p;
}
function median(a){ if(!a.length) return 0; a=a.slice().sort(function(x,y){ return x-y; }); return a[Math.floor(a.length/2)]; }
/* 이상 신호 4칸 · 상단 띠 「이상 n」과 같은 값 · 261022 지표 칸 모양(dashfx.js) · n = 굴릴 숫자 · w · x = 주의 · 위험 문턱(막대 눈금) · sp = 작은 꺾은선(시간 순 기록이 있는 것만) */
function nowSignals(){
  var b=S.data.nb; if(!b||!b.ok) return [];
  var sc=b.scan||{}, m10=num(sc.m10), bad=num(sc.bad10), rate=m10?Math.round(bad*1000/m10)/10:0;
  var q=num(b.resv&&b.resv.wait)+num(b.cchat&&b.cchat.wait);
  var ms=median(NET.slice(-20).map(function(x){ return x.ms; })), fails=NET.slice(-20).filter(function(x){ return !x.ok; }).length;
  var al=b.alarm||{}, pf=al.pushFail!=null?num(al.pushFail):num(b.push&&b.push.today&&b.push.today.fail), pe=al.pushFailWhy||(b.push&&b.push.err), jobs=num(b.push&&b.push.today&&b.push.today.jobs);
  var lv=function(v,w,x){ return v>=x?"bad":v>=w?"warn":"ok"; };
  var sh=sc.h&&sc.h.n?sc.h.n.map(function(n,i){ var x=sc.h.bad&&sc.h.bad[i]; return n==null?null:n?Math.round(num(x)*1000/n)/10:0; }):null;   /* 서버 10분 칸(최근 2시간 · 261022) · 칸 실패율 */
  return [
    { l:"스캔 실패", v:String(rate), n:rate, d:1, u:"%", st:m10<5?"ok":lv(rate,10,25), s:"최근 10분 "+n0(m10)+"건", go:"go('log')", f:rate/30, w:10/30, x:25/30, sp:sh, ic:"scan" },
    { l:"대기 줄", v:n0(q), n:q, u:"명", st:lv(q,10,30), s:"라운지 신청 "+n0(b.resv&&b.resv.wait)+" · 커피챗 희망 "+n0(b.cchat&&b.cchat.wait), go:"go('meet')", f:q/36, w:10/36, x:30/36, ic:"line" },
    { l:"서버 지연", v:(ms/1000).toFixed(2), n:ms/1000, d:2, u:"초", st:fails>=3?"bad":lv(ms,1500,3000), s:"콘솔 왕복 중앙값"+(fails?" · 실패 "+fails:""), go:"", f:ms/3600, w:1500/3600, x:3000/3600, sp:NET.slice(-20).map(function(x){ return x.ms; }), ic:"srv" },
    { l:"푸시 실패", v:n0(pf), n:pf, u:"건", st:pe?"bad":pf?"warn":"ok", s:pe?"오류 · "+String(pe).slice(0,20):"오늘 발송 "+n0(jobs)+"건", go:"go('notify')", f:jobs?pf/jobs:0, ic:"bell" }
  ];
}
var STN={ ok:"정상", warn:"주의", bad:"위험" };
/* 스탬프 종류 순서 · 이름(서버 now_board st.kind 의 id 로 사람 수를 가져온다) · 261016 ck(옛 사전등록 체크인) 뺌 · p10 · p10h(10F 실습) 넣음 */
var NB_KIND=[["lg","최초 로그인"],["qz","AX 퀴즈"],["p4","미니 게임"],["p5","아이디어 한 줄"],["p2","AX PLAY"],["st","계단 이용"],["p3","17F 강연(2개)"],["p3h","17F 강연 한쪽(1개)"],["p10","10F 실습(2개)"],["p10h","10F 실습 한쪽(1개)"],["ln","AX 라운지 완료(2개)"],["cc","18F 커피챗 완료(1개)"],["sv","설문 참여"]];
function nbKinds(kinds){ var m={}; kinds.forEach(function(k){ m[k.id]=k; }); return NB_KIND.map(function(x){ var k=m[x[0]]; return { id:x[0], n:x[1], c:k?k.c:null }; }); }
SCREENS.now={
  title:"홈", desc:"앱 사용 · 지금까지 · 이상 신호 · 지금 단계 · 스탬프 · 경품",
  need:function(){ return [usNeed(),sfNeed(),{ k:"rst", a:"roll_stat", ttl:60000 },{ k:"inv", a:"inv_state", ttl:60000 },{ k:"kss", a:"kit_size_state", ttl:60000 }]; },
  mount:function(vb){ dxMount(); vb.innerHTML='<div id="nwPulse"></div><div id="nwPda"></div><div id="nwTop"></div><div id="nwErr"></div><div id="nwUseA"></div><div id="nwSfA"></div><div class="grid g4 mb" id="nwSig"></div><div id="nwUseB"></div><div id="nwMid"></div><div id="nwPz"></div><div id="nwSfB"></div>'; if(typeof puTick==="function") setTimeout(puTick,0); },   /* 261022 서버 맥박(pulse.js) · 맨 위 */
  paint:function(){
    if(typeof pdaBand==="function") el("nwPda").innerHTML=pdaBand();   /* 261020 행사 전 스탬프 점검(preday.js) · 맨 위 · 진행판보다 먼저 */
    var b=S.data.nb, g=dataGate("nb","진행판");
    if(g){ el("nwSig").innerHTML=g; return; }
    var ph=nowPhase()||{ n:"-" };
    el("phCap").textContent=String(b.day||"").slice(5).replace("-","/")+" "+hm(srvNow().toTimeString())+" · "+ph.n+" · 다음 "+ph.nx;
    el("nwTop").innerHTML=nwTop(b, ph);
    el("nwErr").innerHTML=errTop("nb")+(ph.off?band("info","행사일이 아니라 지금 단계가 없습니다 · 준비 순서로 보여 줍니다"):"");
    el("nwSig").innerHTML=nowSignals().map(function(x){
      return dxTile({ k:"sg:"+x.l, nb:1, ic:DX_IC[x.ic], l:x.l, pill:dxPill(x.st,STN[x.st]), v:x.n, d:x.d, t:x.v, u:x.u, st:x.st, sub:esc(x.s), sp:x.sp, go:x.go||"",
        meter:'<div class="dx-mt">'+dxBar("sgm:"+x.l,x.f)+(x.w?'<u style="left:'+(x.w*100).toFixed(1)+'%"></u><u style="left:'+(x.x*100).toFixed(1)+'%"></u>':'')+'</div>' }); }).join("");
    /* 261017 앱 사용 · 당일 08:00~17:30 = 이상 신호 아래 · 그 밖 = 맨 위(D6) · 옛 접속 카드는 앱 사용 아래 한 줄로 합침 */
    var ub=usBelow(); el(ub?"nwUseA":"nwUseB").innerHTML=""; el(ub?"nwUseB":"nwUseA").innerHTML=nwUsage(b); usAreaDraw();
    /* 261017 지금까지 · 행사일이 아닌 날 = 앱 사용 아래 펼침(스탬프 카드는 지금까지가 대신) · 행사일 = 맨 아래 접힘 */
    var ev=sfEvDay(); el(ev?"nwSfA":"nwSfB").innerHTML=""; el(ev?"nwSfB":"nwSfA").innerHTML=nwSofarWrap();
    /* 261022 행사일 = 스탬프 | 지금 단계 · 그 밖 = 지금 단계 한 칸 · 경품 = 아래 한 줄 */
    el("nwMid").innerHTML=ev?'<div class="grid g32 mb">'+nwStamp(b)+nwFocus(b, ph)+'</div>':'<div class="mb">'+nwFocus(b, ph)+'</div>';
    el("nwPz").innerHTML=nwPrize(b);
    dxAfter(el("vb"));
  }
};
/* 261022 단계 알약 줄 + 운영 상태(점 + 글자 · 옛 칩 다섯 개) */
function nwTop(b, ph){
  var og=b.og||{}, dr=b.draw&&b.draw.scr, on=-1;
  PHASES.forEach(function(x,i){ if(x.id===ph.id) on=i; });
  var pills=PHASES.map(function(x,i){ var tm=(x.n.match(/^\d\d:\d\d/)||[x.a])[0], nm=x.n.replace(/^\d\d:\d\d /,""); return '<span role="listitem" class="'+(i===on?"on":on>=0&&i<on?"past":"")+'"'+(i===on?' aria-current="step"':'')+'>'+esc(nm)+'<small>'+esc(tm)+'</small></span>'; }).join("");
  var st=function(l, c, t, s){ return '<div><span>'+esc(l)+'</span><span class="dx-st8 '+c+'"><i></i>'+esc(t)+(s?'<small>'+esc(s)+'</small>':'')+'</span></div>'; };
  var pOn=b.push&&b.push.on;
  return '<div class="dx-top"><div class="card dx-a" data-dxc="top:ph"><div class="dx-ph" role="list" aria-label="지금 단계">'+pills+'</div>'+
    '<div class="dx-nx">'+dxPill("",on>=0?"지금":"행사 전")+'<b>'+esc(ph.n||"-")+'</b><span>· 다음 '+esc(ph.nx||"-")+'</span></div></div>'+
    '<div class="card dx-a" data-dxc="top:st"><div class="dx-sw" role="list" aria-label="운영 상태">'+
      st("앱 범위","off",og.sc||"-","")+
      st("푸시",pOn?"ok":"warn",pOn?"켜짐":"꺼짐","")+
      st("읽기 전용",b.ro?"bad":"off",b.ro?"켜짐":"꺼짐","")+
      st("추첨 화면",dr==null||dr>15?"warn":"ok",dr==null?"연결 없음":"연결",dr==null?"":n0(dr)+"초 전")+
    '</div></div></div>';
}
/* 261017 사람 수 = 누르면 명단(drill.js) · 261022 숫자는 구른다(k = 화면 안 고유 열쇠) */
function nwD(key, n, k){ return dxD(key, n, k); }
/* 원형 게이지 하나 · v / of · dk = 명단 열쇠 */
function nwRing(k, nm, v, of, ofl, dk){
  var f=num(of)?num(v)/num(of):0;
  return '<div class="dx-rg">'+dxRing(k, f, dxN(k+":p", Math.round(f*100))+'<small>%</small>')+'<span class="nm">'+esc(nm)+'</span><span class="of"><b>'+(dk?nwD(dk, v, k+":n"):dxN(k+":n", num(v)))+'</b> / '+esc(ofl)+' '+n0(of)+'</span></div>';
}
function nwStamp(b){
  var st=b.st||{}, d=st.d||[], tot=d.reduce(function(a,x){ return a+num(x); },0)||1, mx=Math.max.apply(null,[1].concat(d.map(num)));
  var kinds=st.kind&&st.kind.length?nbKinds(st.kind):null, body, miss=kinds?kinds.filter(function(k){ return k.c==null; }):[];   /* 서버 계약 3-1 st.kind = [{ id, n 이름, c 사람 수 }] */
  if(kinds&&kinds.length){
    var km=Math.max.apply(null,[1].concat(kinds.map(function(k){ return num(k.c); }))), hot=-1;
    kinds.forEach(function(k,i){ if(k.c!=null&&num(k.c)>0&&(hot<0||num(k.c)>num(kinds[hot].c))) hot=i; });
    body='<div class="dx-hb"><span class="hd">스탬프</span><span></span><span class="hd r s">발행</span>'+kinds.map(function(k,i){ return '<span class="nm">'+esc(k.n||k.id)+'</span><span class="tr'+(i===hot?" hot":"")+'">'+dxBar("sk:"+k.id, num(k.c)/km)+'</span><span class="r">'+(k.c==null?'<span class="cap">-</span>':drN("st:id:"+k.id, dxN("sk:"+k.id, num(k.c)), k.c))+'</span>'; }).join("")+'</div>'+
      (miss.length?'<div class="mt">'+laterH(miss.map(function(k){ return k.n; }).join(" · ")+" 발행 수")+'</div>':'');
  } else {
    var hx=0; [1,2,3,4,5,6].forEach(function(i){ if(num(d[i])>num(d[hx])) hx=i; });
    body='<div class="dx-hb"><span class="hd">모은 개수</span><span></span><span class="hd r s">사람</span>'+[1,2,3,4,5,6].map(function(i){ return '<span class="nm">'+i+'개'+(i===3?' · 룰렛 자격':i===6?' · 상한':'')+'</span><span class="tr'+(i===hx&&hx?" hot":"")+'">'+dxBar("sd:"+i, num(d[i])/mx)+'</span><span class="r">'+nwD("st:eq:"+i, d[i], "sd:"+i)+'</span>'; }).join("")+'</div>'+
      '<div class="mt">'+laterH("종류별 발행 수(01 최초 로그인 ~ 08 설문)")+'</div>';
  }
  var h=st.h&&st.h.n?st.h.n:null, hs=h?h.reduce(function(a,x){ return a+num(x); },0):0;
  var spk=h?dxSpark(h,"10분마다 스탬프 발행"):"";
  return '<div class="card dx-a'+(S.err.nb?" stale":"")+'" data-dxc="nw:stamp"><div class="dx-ch"><h2>스탬프 발행 현황 <span class="cap">'+(kinds?"종류별 발행 수":"개수별 사람 수")+' · 6개 상한</span></h2>'+
    (spk?'<div class="dx-spw">'+spk+'<span>최근 2시간 <b>'+dxN("sk:h2", hs)+'</b>건 · 10분마다</span></div>':'')+'</div>'+body+
    '<div class="dx-mini">'+
      '<div><span>3개 이상 · 룰렛 자격</span><b>'+nwD("st:ge:3", st.n3!=null?st.n3:st.elig, "sm:3")+'<small>명</small></b></div>'+
      '<div><span>6개 달성</span><b>'+nwD("st:ge:6", st.n6!=null?st.n6:d[6], "sm:6")+'<small>명</small></b></div>'+
      '<div><span>룰렛 사용</span><b>'+nwD("st:rl", st.used, "sm:rl")+'<small>명</small></b></div>'+
      '<div><span>한 개 이상</span><b>'+nwD("st:ge:1", tot-num(d[0]), "sm:1")+'<small>명</small></b></div>'+
    '</div></div>';
}
function nwPrize(b){
  var fx=b.fcfs||{}, st=b.st||{}, inv=S.data.inv, lf=null, q=0;
  if(inv&&inv.ok){ var r=(inv.items||[]).filter(function(x){ return x.src==="roul"; }); lf=r.reduce(function(a,x){ return a+num(x.left); },0); q=r.reduce(function(a,x){ return a+num(x.q); },0); }
  var cap=num(fx.cap), got=num(fx.got), left=num(fx.left), only=Math.max(0,cap-left-got), pc=function(v){ return cap?(v/cap*100).toFixed(2)+"%":"0"; };
  var hero='<div class="card dx-a" data-dxc="pz:fx"><div class="dx-hd"><span class="l">선착순 가습기</span>'+dxPill(fx.on?"ok":"off",fx.on?"진행 중":"꺼짐")+'</div>'+
    '<div class="dx-v">'+dxN("pz:left", left)+'<em>/ '+n0(cap)+' 남음</em></div>'+
    '<div class="dx-thick" role="img" aria-label="지급 '+got+' · 순번만 '+only+' · 남음 '+left+'">'+dxBar("pz:bar",1,0,'<i class="s1" style="width:'+pc(got)+'"></i><i class="s2" style="width:'+pc(only)+'"></i>')+'</div>'+
    '<div class="dx-lg"><span><b style="background:var(--navy)"></b>지급<em>'+nwD("fx:got", got, "pz:got")+'</em></span><span><b style="background:var(--navy1)"></b>순번만<em>'+n0(only)+'</em></span><span><b class="h"></b>남음<em>'+n0(left)+'</em></span><span class="cap">달성순 · 17:00 마감</span></div></div>';
  var rl='<div class="card dx-a" data-dxc="pz:rl"><div class="dx-rgx">'+dxRing("pz:rl", q?num(lf)/q:0, lf==null?"-":dxN("pz:rl:p", q?Math.round(num(lf)*100/q):0)+'<small>%</small>')+
    '<div><span class="nm">룰렛 경품 남음</span><span class="of"><b>'+(lf==null?"-":dxN("pz:rl:n", lf))+'</b> / '+n0(q)+'</span><span class="of">사용 '+nwD("st:rl", st.used, "pz:rlu")+'명</span>'+(b.rout?dxPill("warn","소진 안내"):dxPill("ok","진행 중"))+'</div></div></div>';
  var tk='<div class="card dx-a" data-dxc="pz:tk"><div class="dx-hd"><span class="l">행운권</span></div><div class="dx-v">'+drN("lky", dxN("pz:tk", num(st.tickets)), st.tickets)+'<em>장</em></div><div class="dx-sub">가진 사람 <b>'+nwD("tk", st.holders, "pz:hold")+'</b>명</div></div>';
  return '<div class="dx-sh dx-a" data-dxc="pz:h"><h2>경품</h2><span class="cap">남은 수</span><span class="dx-shr"><button class="btn sm" type="button" onclick="go(\'prize\')">경품 · 재고</button></span></div><div class="dx-pz mb">'+hero+rl+tk+'</div>';
}
function nwFocus(b, ph){
  var id=ph.id, h="", t="", rg="";
  if(id==="pre"||id==="prep"){ t="준비 점검";
    var og=b.og||{}, dr=b.draw&&b.draw.scr;
    h=rowH("서버",S.err.nb?"연결 실패":"연결 · "+envName(),S.err.nb?stt("bad","위험"):stt("ok","정상"))+
      rowH("앱 접속 범위","지금 "+(og.sc||"-")+" · 행사일은 전체",og.sc==="전체"||og.sc==="자동"?stt("ok","정상"):stt("warn","확인"))+
      rowH("룰렛 소진 안내","행사 시작 전에는 꺼짐",b.rout?stt("warn","켜짐"):stt("ok","꺼짐"))+
      rowH("추첨 화면 연결","17F 노트북 · 15초 안 신호",dr==null?stt("warn","연결 없음"):dr>15?stt("warn",n0(dr)+"초 전"):stt("ok","연결"))+
      rowH("읽기 전용","행사 중에는 꺼짐",b.ro?stt("bad","켜짐"):stt("ok","꺼짐"));
  } else if(id==="ck"){ t="체크인존";
    var iv=S.data.inv, kt=iv&&iv.ok?iv.kit||{}:{}, fq=b.fcfs||{}, k=S.data.kss, sz="";
    if(k&&k.ok){ sz=(k.sizes||[]).map(function(z){ var l=num(k.left&&k.left[z]); return z+" "+n0(l); }).join(" · "); }
    rg=nwRing("fc:rk","키트 지급",kt.givenPre,kt.pre,"사전 신청","kit:preGot")+nwRing("fc:rf","선착순 지급",fq.got,fq.cap,"준비","fx:got");
    h=drRow("키트 지급","사전 신청 "+nwD("kit:pre", kt.pre, "fc:kpre")+"명 중",dxBig("kit:preGot", kt.givenPre, "명", "fc:kgot"))+
      drRow("스태프 옷 지급","스태프 의류 명단",kt.givenStaff==null?'<span class="big">-<small> 명</small></span>':dxBig("kit:staffGot", kt.givenStaff, "명", "fc:sgot"))+
      drRow("선착순 참여상","남음 "+n0(fq.left)+" · 달성순 · 17:00 마감",dxBig("fx:got", fq.got, "지급", "fc:fgot"))+
      rowH("사이즈 남음",sz||"-","")+'<div class="mt"><button class="btn sm" type="button" onclick="go(\'ckin\')">체크인 탭</button></div>';
  } else if(id==="am"){ t="오전 · 라운지 · 룰렛";
    var rv=b.resv||{}, st=b.st||{};
    rg=nwRing("fc:rr","룰렛 사용",st.used,st.elig,"자격","st:rl")+nwRing("fc:rf","선착순 지급",b.fcfs&&b.fcfs.got,b.fcfs&&b.fcfs.cap,"준비","fx:got");
    h=drRow("AX 라운지","신청 "+nwD("ln:st:신청", rv.wait, "fc:lw")+" · 승인 "+nwD("ln:st:승인", rv.ok, "fc:lo")+" · 체크인 "+nwD("ln:st:체크인", rv["in"], "fc:li")+" · 완료 "+nwD("ln:st:완료", rv.done, "fc:ld"),'<button class="btn sm pri" type="button" onclick="go(\'meet\',\'ln\')">시간표</button>')+
      drRow("룰렛","자격 "+nwD("st:ge:3", st.elig, "fc:el")+"명 중 사용",dxBig("st:rl", st.used, "명", "fc:used"))+
      drRow("선착순 가습기","10:30부터 · 달성순 · 17:00 마감",dxBig("fx:got", b.fcfs&&b.fcfs.got, "지급", "fc:fgot"));
  } else if(id==="pm"){ t="오후 · 커피챗 · 출석 · 설문";
    var cc=b.cchat||{}, at=b.att||{}, l1=at.l1||{}, l2=at.l2||{};
    rg=nwRing("fc:rc","18F 커피챗 참석",cc["in"],num(cc.match)+num(cc["in"]),"선정","cc:in")+nwRing("fc:r1","17F AWS 끝",l1.out,l1["in"],"입장","att:l1:out")+nwRing("fc:r2","17F MS 끝",l2.out,l2["in"],"입장","att:l2:out");
    h=drRow("18F 커피챗","희망 "+nwD("cc:wait", cc.wait, "fc:cw")+" · 선정 "+nwD("cc:pick", cc.match, "fc:cm")+" · 참석 "+nwD("cc:in", cc["in"], "fc:ci"),'<button class="btn sm pri" type="button" onclick="go(\'meet\',\'cc\')">시간표</button>')+
      drRow("17F 출석","AWS 입장 "+nwD("att:l1:in", l1["in"], "fc:a1i")+" · 끝 "+nwD("att:l1:out", l1.out, "fc:a1o")+" · MS 입장 "+nwD("att:l2:in", l2["in"], "fc:a2i")+" · 끝 "+nwD("att:l2:out", l2.out, "fc:a2o"),"")+
      drRow("참가자 설문","14:30 열림 · 명단 = 설문 스탬프 기준",dxBig("st:id:sv", b.survey, "건", "fc:sv"));
  } else if(id==="close"){ t="Closing · 추첨";
    var dr2=b.draw&&b.draw.scr, st2=b.st||{};
    h=rowH("추첨 화면",dr2==null?"연결 없음":"마지막 신호 "+n0(dr2)+"초 전",dr2==null||dr2>15?stt("warn","확인"):stt("ok","연결"))+
      drRow("행운권","가진 사람 "+nwD("tk", st2.holders, "fc:th")+"명 · 당첨 "+nwD("draw", b.draw&&b.draw.wins, "fc:dw")+"명",dxBig("lky", st2.tickets, "장", "fc:tk"))+
      drRow("아이디어 한 줄","16:00 마감 · 낸 사람 "+nwD("idea", b.idea&&b.idea.people, "fc:ip")+"명",dxBig("idea", b.idea&&b.idea.n, "건", "fc:in"))+
      '<div class="mt fx-w"><button class="btn sm pri" type="button" onclick="go(\'stage\',\'draw\')">추첨 진행판</button><button class="btn sm" type="button" onclick="go(\'stage\',\'ik\')">아이디어왕</button><button class="btn sm" type="button" onclick="go(\'stage\',\'lk7\')">7등 굿즈</button></div>';
  } else { t="행사 후 · 발송 대상";
    var d=(b.st||{}).d||[];
    h=drRow("6개 달성","선착순 참여상 · 달성순 1~200 · 당일 1F 주차장 체크인존 10:30~17:00 지급 · 못 받은 사람은 발송",dxBig("st:ge:6", d[6], "명", "fc:6"))+
      drRow("행운권 가진 사람","",dxBig("tk", b.st&&b.st.holders, "명", "fc:th"))+
      drRow("선착순 가습기 지급","미수령 · 지방 근무자 발송은 기록 · 설정에서",dxBig("fx:got", b.fcfs&&b.fcfs.got, "명", "fc:fgot"));
  }
  return '<div class="card dx-a" data-dxc="nw:focus"><h2>'+esc(t)+' <span class="cap">지금 단계</span></h2>'+(rg?'<div class="dx-rings">'+rg+'</div>':'')+h+'</div>';
}
