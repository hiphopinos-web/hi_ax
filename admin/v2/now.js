/* AXF CONTROL v2 · S1 지금 (261016)
 * 탭은 고정, 이 화면만 시간대(서버 시각)에 따라 위 칩과 카드 순서가 바뀐다(2_화면 설계 S1 · 대안 B).
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
/* 이상 신호 4칸 · 상단 띠 「이상 n」과 같은 값 */
function nowSignals(){
  var b=S.data.nb; if(!b||!b.ok) return [];
  var sc=b.scan||{}, m10=num(sc.m10), bad=num(sc.bad10), rate=m10?Math.round(bad*1000/m10)/10:0;
  var q=num(b.resv&&b.resv.wait)+num(b.cchat&&b.cchat.wait);
  var ms=median(NET.slice(-20).map(function(x){ return x.ms; })), fails=NET.slice(-20).filter(function(x){ return !x.ok; }).length;
  var al=b.alarm||{}, pf=al.pushFail!=null?num(al.pushFail):num(b.push&&b.push.today&&b.push.today.fail), pe=al.pushFailWhy||(b.push&&b.push.err);
  var lv=function(v,w,x){ return v>=x?"bad":v>=w?"warn":"ok"; };
  return [
    { l:"스캔 실패", v:String(rate), u:"%", st:m10<5?"ok":lv(rate,10,25), s:"최근 10분 "+n0(m10)+"건", go:"go('log')" },
    { l:"대기 줄", v:n0(q), u:"명", st:lv(q,10,30), s:"라운지 신청 "+n0(b.resv&&b.resv.wait)+" · 커피챗 희망 "+n0(b.cchat&&b.cchat.wait), go:"go('meet')" },
    { l:"서버 지연", v:(ms/1000).toFixed(2), u:"초", st:fails>=3?"bad":lv(ms,1500,3000), s:"콘솔 왕복 중앙값"+(fails?" · 실패 "+fails:""), go:"" },
    { l:"푸시 실패", v:n0(pf), u:"건", st:pe?"bad":pf?"warn":"ok", s:pe?"오류 · "+String(pe).slice(0,20):"오늘 발송 "+n0(b.push&&b.push.today&&b.push.today.jobs)+"건", go:"go('notify')" }
  ];
}
var STN={ ok:"정상", warn:"주의", bad:"위험" };
/* 스탬프 종류 순서 · 이름(서버 now_board st.kind 의 id 로 사람 수를 가져온다) · 261016 ck(옛 사전등록 체크인) 뺌 · p10 · p10h(10F 실습) 넣음 */
var NB_KIND=[["lg","최초 로그인"],["qz","AX 퀴즈"],["p4","미니 게임"],["p5","아이디어 한 줄"],["p2","AX PLAY"],["st","계단 이용"],["p3","17F 강연(2개)"],["p3h","17F 강연 한쪽(1개)"],["p10","10F 실습(2개)"],["p10h","10F 실습 한쪽(1개)"],["ln","AX 라운지 완료(2개)"],["cc","18F 커피챗 완료(1개)"],["sv","설문 참여"]];
function nbKinds(kinds){ var m={}; kinds.forEach(function(k){ m[k.id]=k; }); return NB_KIND.map(function(x){ var k=m[x[0]]; return { id:x[0], n:x[1], c:k?k.c:null }; }); }
SCREENS.now={
  title:"지금", desc:"앱 사용 · 지금까지 · 이상 신호 · 지금 단계 · 스탬프 · 경품",
  need:function(){ return [usNeed(),sfNeed(),{ k:"rst", a:"roll_stat", ttl:60000 },{ k:"inv", a:"inv_state", ttl:60000 },{ k:"kss", a:"kit_size_state", ttl:60000 }]; },
  mount:function(vb){ vb.innerHTML='<div id="nwPda"></div><div id="nwChips" class="chips"></div><div id="nwErr"></div><div id="nwUseA"></div><div id="nwSfA"></div><div class="grid g4 mb" id="nwSig"></div><div id="nwUseB"></div><div class="grid g32"><div class="col" id="nwL"></div><div class="col" id="nwR"></div></div><div id="nwSfB"></div>'; },
  paint:function(){
    if(typeof pdaBand==="function") el("nwPda").innerHTML=pdaBand();   /* 261020 행사 전 스탬프 점검(preday.js) · 맨 위 · 진행판보다 먼저 */
    var b=S.data.nb, g=dataGate("nb","진행판");
    if(g){ el("nwSig").innerHTML=g; return; }
    var ph=nowPhase()||{ n:"-" };
    el("phCap").textContent=String(b.day||"").slice(5).replace("-","/")+" "+hm(srvNow().toTimeString())+" · "+ph.n+" · 다음 "+ph.nx;
    var og=b.og||{}, dr=b.draw&&b.draw.scr;
    el("nwChips").innerHTML='<span class="chip on">'+esc(ph.n)+'</span>'+
      '<span class="chip">앱 범위 '+esc(og.sc||"-")+'</span>'+
      '<span class="chip'+(b.push&&b.push.on?"":" st-warn")+'">푸시 '+(b.push&&b.push.on?"켜짐":"꺼짐")+'</span>'+
      '<span class="chip'+(b.ro?" st-bad":"")+'">읽기 전용 '+(b.ro?"켜짐":"꺼짐")+'</span>'+
      '<span class="chip'+(dr==null?"":dr>15?" st-warn":"")+'">추첨 화면 '+(dr==null?"연결 없음":"연결 "+n0(dr)+"초 전")+'</span>';
    el("nwErr").innerHTML=errTop("nb")+(ph.off?band("info","행사일이 아니라 지금 단계가 없습니다 · 준비 순서로 보여 줍니다"):"");
    var old=!!S.err.nb;
    el("nwSig").innerHTML=nowSignals().map(function(x){ return kpi({ l:x.l, v:x.v, u:x.u, st:x.st, stt:STN[x.st], s:x.s, go:x.go, old:old }); }).join("");
    /* 261017 앱 사용 · 당일 08:00~17:30 = 이상 신호 아래 · 그 밖 = 맨 위(D6) · 옛 접속 카드는 앱 사용 아래 한 줄로 합침 */
    var ub=usBelow(); el(ub?"nwUseA":"nwUseB").innerHTML=""; el(ub?"nwUseB":"nwUseA").innerHTML=nwUsage(b); usAreaDraw();
    var C={ stamp:nwStamp(b), focus:nwFocus(b, ph), prize:nwPrize(b) };
    /* 261017 지금까지 · 행사일이 아닌 날 = 앱 사용 아래 펼침(스탬프 카드는 지금까지가 대신) · 행사일 = 맨 아래 접힘 */
    var ev=sfEvDay(); el(ev?"nwSfA":"nwSfB").innerHTML=""; el(ev?"nwSfB":"nwSfA").innerHTML=nwSofarWrap();
    var L=ev?["stamp"]:["focus"];
    var R=!ev?["prize"]:["focus","prize"];
    el("nwL").innerHTML=L.map(function(k){ return C[k]; }).join("");
    el("nwR").innerHTML=R.map(function(k){ return C[k]; }).join("");
  }
};
/* 261017 사람 수 = 누르면 명단(drill.js) */
function nwD(key, n){ return drN(key, n0(n), n); }
function nwStamp(b){
  var st=b.st||{}, d=st.d||[], tot=d.reduce(function(a,x){ return a+num(x); },0)||1, mx=Math.max.apply(null,[1].concat(d.map(num)));
  var kinds=st.kind&&st.kind.length?nbKinds(st.kind):null, body, miss=kinds?kinds.filter(function(k){ return k.c==null; }):[];   /* 서버 계약 3-1 st.kind = [{ id, n 이름, c 사람 수 }] */
  if(kinds&&kinds.length){
    var km=Math.max.apply(null,[1].concat(kinds.map(function(k){ return num(k.c); })));
    body='<table class="tb"><thead><tr><th>스탬프</th><th class="n" style="width:80px">발행</th><th class="barc" style="width:40%"></th></tr></thead><tbody>'+kinds.map(function(k){ return '<tr><td>'+esc(k.n||k.id)+'</td><td class="n">'+(k.c==null?'<span class="cap">-</span>':drN("st:id:"+k.id, n0(k.c), k.c))+'</td><td class="barc"><div class="bar"><i style="width:'+Math.round(num(k.c)*100/km)+'%"></i></div></td></tr>'; }).join("")+'</tbody></table>'+
      (miss.length?'<div class="mt">'+laterH(miss.map(function(k){ return k.n; }).join(" · ")+" 발행 수")+'</div>':'');
  } else {
    body='<table class="tb"><thead><tr><th>모은 개수</th><th class="n" style="width:80px">사람</th><th class="barc" style="width:45%"></th></tr></thead><tbody>'+[1,2,3,4,5,6].map(function(i){ return '<tr><td>'+i+'개'+(i===3?' · 룰렛 자격':i===6?' · 상한':'')+'</td><td class="n">'+drN("st:eq:"+i, n0(d[i]), d[i])+'</td><td class="barc"><div class="bar"><i style="width:'+Math.round(num(d[i])*100/mx)+'%"></i></div></td></tr>'; }).join("")+'</tbody></table>'+
      '<div class="mt">'+laterH("종류별 발행 수(01 최초 로그인 ~ 08 설문)")+'</div>';
  }
  return '<div class="card'+(S.err.nb?" stale":"")+'"><h2>스탬프 발행 현황 <span class="cap">'+(kinds?"종류별 발행 수":"개수별 사람 수")+' · 6개 상한</span></h2>'+body+
    '<div class="mt cap">3개 이상(룰렛 자격) <b>'+nwD("st:ge:3", st.n3!=null?st.n3:st.elig)+'</b>명 · 6개 달성 <b>'+nwD("st:ge:6", st.n6!=null?st.n6:d[6])+'</b>명 · 룰렛 사용 <b>'+nwD("st:rl", st.used)+'</b>명 · 한 개 이상 '+nwD("st:ge:1", tot-num(d[0]))+'명</div></div>';
}
function nwPrize(b){
  var fx=b.fcfs||{}, st=b.st||{}, inv=S.data.inv, rl="";
  if(inv&&inv.ok){ var r=(inv.items||[]).filter(function(x){ return x.src==="roul"; }), lf=r.reduce(function(a,x){ return a+num(x.left); },0), q=r.reduce(function(a,x){ return a+num(x.q); },0); rl=n0(lf)+'<small> / '+n0(q)+'</small>'; }
  return '<div class="card"><h2>경품 <span class="cap">남은 수</span><span class="r"><button class="btn sm" type="button" onclick="go(\'prize\')">경품 · 재고</button></span></h2>'+
    drRow("선착순 가습기","지급 "+nwD("fx:got", fx.got)+" · 달성순 · 17:00 마감"+(fx.on?"":" · 꺼짐"),'<span class="big">'+n0(fx.left)+'<small> / '+n0(fx.cap)+'</small></span>')+
    drRow("룰렛","사용 "+nwD("st:rl", st.used)+"명 · 소진 안내 "+(b.rout?"켜짐":"꺼짐"),(rl?'<span class="big">'+rl+'</span>':'')+(b.rout?tag("소진 안내","warn"):tag("진행 중","ok")))+
    drRow("행운권","가진 사람 "+nwD("tk", st.holders)+"명",drBig("tk", st.tickets, "장"))+'</div>';
}
function nwFocus(b, ph){
  var id=ph.id, h="", t="";
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
    h=drRow("키트 지급","사전 신청 "+nwD("kit:pre", kt.pre)+"명 중",drBig("kit:preGot", kt.givenPre, "명"))+
      drRow("스태프 옷 지급","스태프 의류 명단",kt.givenStaff==null?'<span class="big">-<small> 명</small></span>':drBig("kit:staffGot", kt.givenStaff, "명"))+
      drRow("선착순 참여상","남음 "+n0(fq.left)+" · 달성순 · 17:00 마감",drBig("fx:got", fq.got, "지급"))+
      rowH("사이즈 남음",sz||"-","")+'<div class="mt"><button class="btn sm" type="button" onclick="go(\'ckin\')">체크인 탭</button></div>';
  } else if(id==="am"){ t="오전 · 라운지 · 룰렛";
    var rv=b.resv||{}, st=b.st||{};
    h=drRow("AX 라운지","신청 "+nwD("ln:st:신청", rv.wait)+" · 승인 "+nwD("ln:st:승인", rv.ok)+" · 체크인 "+nwD("ln:st:체크인", rv["in"])+" · 완료 "+nwD("ln:st:완료", rv.done),'<button class="btn sm pri" type="button" onclick="go(\'meet\',\'ln\')">시간표</button>')+
      drRow("룰렛","자격 "+nwD("st:ge:3", st.elig)+"명 중 사용",drBig("st:rl", st.used, "명"))+
      drRow("선착순 가습기","10:30부터 · 달성순 · 17:00 마감",drBig("fx:got", b.fcfs&&b.fcfs.got, "지급"));
  } else if(id==="pm"){ t="오후 · 커피챗 · 출석 · 설문";
    var cc=b.cchat||{}, at=b.att||{};
    h=drRow("18F 커피챗","희망 "+nwD("cc:wait", cc.wait)+" · 선정 "+nwD("cc:pick", cc.match)+" · 참석 "+nwD("cc:in", cc["in"]),'<button class="btn sm pri" type="button" onclick="go(\'meet\',\'cc\')">시간표</button>')+
      drRow("17F 출석","AWS 입장 "+nwD("att:l1:in", at.l1&&at.l1.in)+" · 끝 "+nwD("att:l1:out", at.l1&&at.l1.out)+" · MS 입장 "+nwD("att:l2:in", at.l2&&at.l2.in)+" · 끝 "+nwD("att:l2:out", at.l2&&at.l2.out),"")+
      drRow("참가자 설문","14:30 열림 · 명단 = 설문 스탬프 기준",drBig("st:id:sv", b.survey, "건"));
  } else if(id==="close"){ t="Closing · 추첨";
    var dr2=b.draw&&b.draw.scr, st2=b.st||{};
    h=rowH("추첨 화면",dr2==null?"연결 없음":"마지막 신호 "+n0(dr2)+"초 전",dr2==null||dr2>15?stt("warn","확인"):stt("ok","연결"))+
      drRow("행운권","가진 사람 "+nwD("tk", st2.holders)+"명 · 당첨 "+nwD("draw", b.draw&&b.draw.wins)+"명",drBig("tk", st2.tickets, "장"))+
      drRow("아이디어 한 줄","16:00 마감 · 낸 사람 "+nwD("idea", b.idea&&b.idea.people)+"명",drBig("idea", b.idea&&b.idea.n, "건"))+
      '<div class="mt fx-w"><button class="btn sm pri" type="button" onclick="go(\'stage\',\'draw\')">추첨 진행판</button><button class="btn sm" type="button" onclick="go(\'stage\',\'ik\')">아이디어왕</button><button class="btn sm" type="button" onclick="go(\'stage\',\'lk7\')">7등 굿즈</button></div>';
  } else { t="행사 후 · 발송 대상";
    var d=(b.st||{}).d||[];
    h=drRow("6개 달성","선착순 참여상 · 달성순 1~200 · 당일 1F 주차장 체크인존 10:30~17:00 지급 · 못 받은 사람은 발송",drBig("st:ge:6", d[6], "명"))+
      drRow("행운권 가진 사람","",drBig("tk", b.st&&b.st.holders, "명"))+
      drRow("선착순 가습기 지급","미수령 · 지방 근무자 발송은 기록 · 설정에서",drBig("fx:got", b.fcfs&&b.fcfs.got, "명"));
  }
  return '<div class="card"><h2>'+esc(t)+' <span class="cap">지금 단계</span></h2>'+h+'</div>';
}
