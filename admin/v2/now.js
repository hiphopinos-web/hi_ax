/* AXF CONTROL v2 · S1 지금 (261016)
 * 탭은 고정, 이 화면만 시간대(서버 시각)에 따라 위 칩과 카드 순서가 바뀐다(2_화면 설계 S1 · 대안 B).
 * 데이터 = now_board(공통) · roll_stat · sreq_list(열림) · inv_state · kit_size_state · 모두 읽기, PIN 없음 */
var SREQ_K={ qr:"QR이 안 돼요", pay:"수동 지급 부탁", stamp:"스탬프 확인 부탁", swap:"사이즈 교환", out:"룰렛 경품 소진", other:"기타" };
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
  var q=num(b.ck&&b.ck.wait)+num(b.resv&&b.resv.wait)+num(b.cchat&&b.cchat.wait);
  var ms=median(NET.slice(-20).map(function(x){ return x.ms; })), fails=NET.slice(-20).filter(function(x){ return !x.ok; }).length;
  var al=b.alarm||{}, pf=al.pushFail!=null?num(al.pushFail):num(b.push&&b.push.today&&b.push.today.fail), pe=al.pushFailWhy||(b.push&&b.push.err);
  var lv=function(v,w,x){ return v>=x?"bad":v>=w?"warn":"ok"; };
  return [
    { l:"스캔 실패", v:String(rate), u:"%", st:m10<5?"ok":lv(rate,10,25), s:"최근 10분 "+n0(m10)+"건", go:"go('log')" },
    { l:"대기 줄", v:n0(q), u:"명", st:lv(q,10,30), s:"체크인 "+n0(b.ck&&b.ck.wait)+" · 상담 "+n0(b.resv&&b.resv.wait)+" · 커피챗 "+n0(b.cchat&&b.cchat.wait), go:"go('inbox')" },
    { l:"서버 지연", v:(ms/1000).toFixed(2), u:"초", st:fails>=3?"bad":lv(ms,1500,3000), s:"콘솔 왕복 중앙값"+(fails?" · 실패 "+fails:""), go:"" },
    { l:"푸시 실패", v:n0(pf), u:"건", st:pe?"bad":pf?"warn":"ok", s:pe?"오류 · "+String(pe).slice(0,20):"오늘 발송 "+n0(b.push&&b.push.today&&b.push.today.jobs)+"건", go:"go('notify')" }
  ];
}
var STN={ ok:"정상", warn:"주의", bad:"위험" };
SCREENS.now={
  title:"지금", desc:"이상 신호 · 지금 단계 · 접속 · 스탬프 · 경품 · 스태프 요청",
  need:function(){ return [{ k:"rst", a:"roll_stat", ttl:60000 },{ k:"sreqo", a:"sreq_list", p:{ st:"open", n:20 }, ttl:15000 },{ k:"inv", a:"inv_state", ttl:60000 },{ k:"kss", a:"kit_size_state", ttl:60000 }]; },
  mount:function(vb){ vb.innerHTML='<div id="nwChips" class="chips"></div><div id="nwErr"></div><div class="grid g4 mb" id="nwSig"></div><div class="grid g32"><div class="col" id="nwL"></div><div class="col" id="nwR"></div></div>'; },
  paint:function(){
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
    var C={ acc:nwAcc(b), stamp:nwStamp(b), focus:nwFocus(b, ph), prize:nwPrize(b), req:nwReq() };
    var L=ph.id==="ck"?["acc","stamp"]:ph.id==="after"?["stamp","acc"]:["acc","stamp"];
    var R=ph.id==="after"||ph.id==="close"?["focus","prize","req"]:["focus","req","prize"];
    el("nwL").innerHTML=L.map(function(k){ return C[k]; }).join("");
    el("nwR").innerHTML=R.map(function(k){ return C[k]; }).join("");
  }
};
function nwAcc(b){
  var r=S.data.rst, ok=r&&r.ok, p=b.people||{}, att=b.att||{};
  var cell=function(l,v,of){ return '<div><div class="cap">'+esc(l)+'</div><div class="v">'+v+(of!=null?'<small> / '+esc(of)+'</small>':'<small> 명</small>')+'</div></div>'; };
  return '<div class="card'+(S.err.nb?" stale":"")+'"><h2>접속 <span class="cap">오늘 · 시험 사번 제외</span></h2><div class="mini">'+
    cell("오늘 접속", n0(p.today))+
    (p.todayPre!=null?cell("사전 신청자 접속", n0(p.todayPre), n0(p.pre)):cell("사전 신청자 가입", ok?n0(r.pre10&&r.pre10.acct):"-", ok?n0(r.pre10&&r.pre10.n):"-"))+
    (p.todayStaff!=null?cell("스태프 접속", n0(p.todayStaff), n0(p.staff)):cell("스태프 가입", ok?n0(r.staff&&r.staff.acct):"-", ok?n0(r.staff&&r.staff.n):"-"))+
    cell("PIN 대기", n0(b.pw))+'</div>'+
    '<div class="cap mt">가입 '+n0(p.acct)+' · 아이디어 '+n0(b.idea&&b.idea.n)+' · 17F 출석 '+n0(num(att.l1&&att.l1.in)+num(att.l2&&att.l2.in))+' · 설문 '+n0(b.survey)+' · 구독 '+n0(b.push&&b.push.subs)+'대</div></div>';
}
function nwStamp(b){
  var st=b.st||{}, d=st.d||[], tot=d.reduce(function(a,x){ return a+num(x); },0)||1, mx=Math.max.apply(null,[1].concat(d.map(num)));
  var kinds=st.kind&&st.kind.length?st.kind:null, body;   /* 서버 계약 3-1 st.kind = [{ id, n 이름, c 사람 수 }] */
  if(kinds&&kinds.length){
    var km=Math.max.apply(null,[1].concat(kinds.map(function(k){ return num(k.c); })));
    body='<table class="tb"><thead><tr><th>스탬프</th><th class="n" style="width:80px">발행</th><th class="barc" style="width:40%"></th></tr></thead><tbody>'+kinds.map(function(k){ return '<tr><td>'+esc(k.n||k.id)+'</td><td class="n">'+n0(k.c)+'</td><td class="barc"><div class="bar"><i style="width:'+Math.round(num(k.c)*100/km)+'%"></i></div></td></tr>'; }).join("")+'</tbody></table>';
  } else {
    body='<table class="tb"><thead><tr><th>모은 개수</th><th class="n" style="width:80px">사람</th><th class="barc" style="width:45%"></th></tr></thead><tbody>'+[1,2,3,4,5,6].map(function(i){ return '<tr><td>'+i+'개'+(i===3?' · 룰렛 자격':i===6?' · 상한':'')+'</td><td class="n">'+n0(d[i])+'</td><td class="barc"><div class="bar"><i style="width:'+Math.round(num(d[i])*100/mx)+'%"></i></div></td></tr>'; }).join("")+'</tbody></table>'+
      '<div class="mt">'+laterH("종류별 발행 수(01 최초 로그인 ~ 08 설문)")+'</div>';
  }
  return '<div class="card'+(S.err.nb?" stale":"")+'"><h2>스탬프 발행 현황 <span class="cap">'+(kinds?"종류별 발행 수":"개수별 사람 수")+' · 6개 상한</span></h2>'+body+
    '<div class="mt cap">3개 이상(룰렛 자격) <b>'+n0(st.n3!=null?st.n3:st.elig)+'</b>명 · 6개 달성 <b>'+n0(st.n6!=null?st.n6:d[6])+'</b>명 · 룰렛 사용 <b>'+n0(st.used)+'</b>명 · 한 개 이상 '+n0(tot-num(d[0]))+'명</div></div>';
}
function nwPrize(b){
  var fx=b.fcfs||{}, st=b.st||{}, inv=S.data.inv, rl="";
  if(inv&&inv.ok){ var r=(inv.items||[]).filter(function(x){ return x.src==="roul"; }), lf=r.reduce(function(a,x){ return a+num(x.left); },0), q=r.reduce(function(a,x){ return a+num(x.q); },0); rl=n0(lf)+'<small> / '+n0(q)+'</small>'; }
  return '<div class="card"><h2>경품 <span class="cap">남은 수</span><span class="r"><button class="btn sm" type="button" onclick="go(\'prize\')">경품 · 재고</button></span></h2>'+
    rowH("선착순 가습기","지급 "+n0(fx.got)+" · 17:00 마감"+(fx.on?"":" · 꺼짐"),'<span class="big">'+n0(fx.left)+'<small> / '+n0(fx.cap)+'</small></span>')+
    rowH("룰렛","사용 "+n0(st.used)+"명 · 소진 안내 "+(b.rout?"켜짐":"꺼짐"),(rl?'<span class="big">'+rl+'</span>':'')+(b.rout?tag("소진 안내","warn"):tag("진행 중","ok")))+
    rowH("행운권","가진 사람 "+n0(st.holders)+"명",'<span class="big">'+n0(st.tickets)+'<small> 장</small></span>')+'</div>';
}
function nwReq(){
  var d=S.data.sreqo, rows=d&&d.ok?(d.rows||[]).filter(function(r){ return r.st==="open"; }):null, n=S.data.nb&&S.data.nb.sreq?num(S.data.nb.sreq.open):0;
  var body=rows==null?(dataGate("sreqo","스태프 요청")||skel()):rows.length?rows.slice(0,5).map(function(r){ return rowH(SREQ_K[r.kind]||r.kind, [r.spot,r.byName||r.by,ago(r.t)].filter(Boolean).join(" · "),'<button class="btn sm pri" type="button" onclick="reqDone(\''+jq(r.id)+'\',\'처리\')">처리</button>'); }).join("")+(rows.length>5?'<div class="cap mt">외 '+(rows.length-5)+'건 · 처리함에서</div>':''):emptyH("열린 요청이 없습니다");
  return '<div class="card"><h2>스태프 요청 '+(n?tag(n+"건 열림","warn"):tag("0건","off"))+'<span class="r"><button class="btn sm" type="button" onclick="go(\'inbox\',\'req\')">처리함</button></span></h2>'+body+'</div>';
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
    var ck=b.ck||{}, k=S.data.kss, sz="";
    if(k&&k.ok){ sz=(k.sizes||[]).map(function(z){ var l=num(k.left&&k.left[z]); return z+" "+n0(l); }).join(" · "); }
    h=rowH("접수 대기",ck.on?"창구 열림":"창구 꺼짐",'<span class="big">'+n0(ck.wait)+'<small> 명</small></span>')+rowH("호출 중 · 받음","번호표 "+n0(ck.issued)+"장",'<span class="big">'+n0(ck.call)+'<small> · '+n0(ck.done)+'</small></span>')+
      rowH("사이즈 남음",sz||"-","")+'<div class="mt"><button class="btn sm" type="button" onclick="go(\'inbox\',\'ck\')">체크인존 열기</button></div>';
  } else if(id==="am"){ t="오전 · 라운지 · 룰렛";
    var rv=b.resv||{}, st=b.st||{};
    h=rowH("AX 라운지","신청 "+n0(rv.wait)+" · 승인 "+n0(rv.ok)+" · 체크인 "+n0(rv["in"])+" · 완료 "+n0(rv.done),'<button class="btn sm pri" type="button" onclick="go(\'inbox\',\'lounge\')">배치판</button>')+
      rowH("룰렛","자격 "+n0(st.elig)+"명 중 사용",'<span class="big">'+n0(st.used)+'<small> 명</small></span>')+
      rowH("선착순 가습기","10:30부터 · 6개 달성자",'<span class="big">'+n0(b.fcfs&&b.fcfs.got)+'<small> 지급</small></span>');
  } else if(id==="pm"){ t="오후 · 커피챗 · 출석 · 설문";
    var cc=b.cchat||{}, at=b.att||{};
    h=rowH("18F 커피챗","희망 "+n0(cc.wait)+" · 선정 "+n0(cc.match)+" · 참석 "+n0(cc["in"]),'<button class="btn sm pri" type="button" onclick="go(\'inbox\',\'cchat\')">선정</button>')+
      rowH("17F 출석","AWS 입장 "+n0(at.l1&&at.l1.in)+" · 끝 "+n0(at.l1&&at.l1.out)+" · MS 입장 "+n0(at.l2&&at.l2.in)+" · 끝 "+n0(at.l2&&at.l2.out),"")+
      rowH("참가자 설문","14:30 열림",'<span class="big">'+n0(b.survey)+'<small> 건</small></span>');
  } else if(id==="close"){ t="Closing · 추첨";
    var dr2=b.draw&&b.draw.scr, st2=b.st||{};
    h=rowH("추첨 화면",dr2==null?"연결 없음":"마지막 신호 "+n0(dr2)+"초 전",dr2==null||dr2>15?stt("warn","확인"):stt("ok","연결"))+
      rowH("행운권","가진 사람 "+n0(st2.holders)+"명 · 당첨 "+n0(b.draw&&b.draw.wins)+"명",'<span class="big">'+n0(st2.tickets)+'<small> 장</small></span>')+
      rowH("아이디어 한 줄","16:00 마감 · 낸 사람 "+n0(b.idea&&b.idea.people)+"명",'<span class="big">'+n0(b.idea&&b.idea.n)+'<small> 건</small></span>')+
      '<div class="mt">'+oldLink("추첨 진행 · 아이디어왕 · 7등은 이번 단계에서 옮기지 않음")+'</div>';
  } else { t="행사 후 · 발송 대상";
    var d=(b.st||{}).d||[];
    h=rowH("6개 달성(참여상 대상)","추첨 · 다음 날 발송",'<span class="big">'+n0(d[6])+'<small> 명</small></span>')+
      rowH("행운권 가진 사람","",'<span class="big">'+n0(b.st&&b.st.holders)+'<small> 명</small></span>')+
      rowH("선착순 가습기 지급","미수령 · 지방 근무자 발송은 기록 · 설정에서",'<span class="big">'+n0(b.fcfs&&b.fcfs.got)+'<small> 명</small></span>');
  }
  return '<div class="card"><h2>'+esc(t)+' <span class="cap">지금 단계</span></h2>'+h+'</div>';
}
/* 스태프 요청 닫기 · L1(확인 창 없음) */
function reqDone(id, res){
  call("sreq_done",{ id:id, res:res, memo:"" }).then(function(r){
    if(r&&r.ok){ toast("요청을 닫았습니다 · "+res); var d=S.data.sreqo; if(d&&d.rows) d.rows=d.rows.filter(function(x){ return x.id!==id; }); var e=S.data.sreq; if(e&&e.rows) e.rows.forEach(function(x){ if(x.id===id){ x.st="done"; x.res=res; } }); if(S.data.nb&&S.data.nb.sreq) S.data.nb.sreq.open=Math.max(0,num(S.data.nb.sreq.open)-1); paint(); reload(["sreqo","sreq"]); }
    else toast("닫지 못했습니다 · "+why(r),{ bad:1 });
  });
}
