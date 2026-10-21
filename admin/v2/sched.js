/* AXF CONTROL v2 · 알림 › 예약 (261016 4단계 · 지금 콘솔 「알림 › 예약」을 옮김)
 * 데이터 = sched_list(대기 · 실행중 + 지난 40건) · 만들기 = sched_add(kind outro | notice · at · title · body · push · spec · nto) · 처리 = sched_edit(run · delay 5분 · cancel · edit)
 * 푸시 받는 사람 미리 세기 = push_preview(지금 기준 · 실행할 때 서버가 다시 셈) · 자동 예약(커피챗 · 라운지 10분 전)은 선정 · 승인 때 서버가 잡는다
 * 명단 = 공통 표 · 대기 줄의 단추(고치기 · 지금 실행 · +5분 · 취소) · 줄을 누르면 서랍 · 확인 창(PIN 없음)
 * 261021 꺼짐 칩(공지 줄을 꺼 둔 것 · 켜기 · 취소 단추와 자동 줄 내용 글자는 ntf.js 가 덧씌움)
 * 261021 후속(사용자) 대상 = 전체 · 구분(AX 라운지 신청자 · 커피챗 대기 · 커피챗 매칭 · 그룹) · 사람(찾기 · 사번 붙여 넣기 · 50명) + 조건 AND(스탬프 · 행운권 · 룰렛 · 근무 층 · 부문 · 기기)
 *   nto = 앱 공지도 그 대상에게만(사람 지정은 늘) · 대상 · 조건이 바뀔 때마다 push_preview 로 다시 셈 · 고치기 = 같은 칸에 불러와 sched_edit edit(시각 · 글자 · 대상 · 조건 · 푸시) */
var SCH_K={ notice:"공지", outro:"Closing Speech", crowd_notify:"혼잡 만료 알림", visit_slot:"관람 시간 알림", cchat_remind:"커피챗 10분 전", dap_remind:"AX 라운지 10분 전" };
var SCH_ST={ "대기":"warn", "실행중":"", "완료":"ok", "취소":"off", "지남":"bad", "오류":"bad" };
var SCH_PRE=[{ n:"Closing Speech 10분 전", kind:"outro", t:"Closing Speech 10분 전", b:"17F 대강당 · 17:00 시작", at:"16:50", tgt:"all" },{ n:"경품 추첨 시작", kind:"outro", t:"경품 추첨 시작", b:"17F 대강당", at:"", tgt:"tickets" }];
var SCH_GRP=[["dap","AX 라운지 신청자"],["cc_wait","커피챗 대기"],["cc_match","커피챗 매칭"],["g","그룹"]];
var SCH_DEV=[["android","안드로이드"],["ios","아이폰"],["pc","PC"]];
var SCH_C0=function(){ return { smin:"", smax:"", tk:"", rl:"", fl:"", dept:"", dev:"" }; };
var SCH={ k:"outro", d:"2026-10-26", hm:"", t:"", b:"", push:false, tgt:"all", grp:"dap", gname:"", ppl:[], q:"", qr:null, qseq:0, paste:"", c:SCH_C0(), cOpen:false, nto:null, edit:"", pv:null, seq:0, tm:0, grps:null };
NT_SUBS.splice(1,0,["sched","예약"]);
function schWhat(r){ return r.kind==="notice"||r.kind==="outro"?(r.title||"")+(r.body?" · "+r.body:""):r.kind==="cchat_remind"?"18F 커피챗 "+(r.slot||"")+" · 선정된 사람에게 푸시":r.kind==="dap_remind"?"1F AX 라운지 "+(r.slot||"")+" · 승인된 사람에게 푸시":(r.slot||r.tgt||""); }
function schWho(r){ if(r.kind!=="notice"&&r.kind!=="outro") return r.push?"푸시 · "+(r.pdesc||""):"";
  return r.push?"푸시 · "+(r.pdesc||"전체 구독자")+(r.nto?" · 앱 공지도 대상만":" · 앱 공지 모두"):r.nto?"앱 공지 · "+(r.pdesc||"대상"):"앱 공지 모두 · 푸시 없음"; }
function schRow(id){ var d=S.data.sched; return d&&d.ok?(d.rows||[]).filter(function(x){ return String(x.id)===String(id); })[0]:null; }
function schManual(r){ return r&&(r.kind==="notice"||r.kind==="outro"); }
function schActs(r){ if(r.st!=="대기") return ""; var J=jq(r.id);
  return '<span class="btns">'+(schManual(r)?'<button class="btn sm" type="button" onclick="schLoad(\''+J+'\')">고치기</button>':'')+'<button class="btn sm" type="button" onclick="schEdit(\''+J+'\',\'run\')">지금 실행</button><button class="btn sm" type="button" onclick="schEdit(\''+J+'\',\'delay\')">+5분</button><button class="btn sm dng" type="button" onclick="schEdit(\''+J+'\',\'cancel\')">취소</button></span>'; }
function schGrid(){
  return gridOf("sched",{ file:"알림 예약", key:function(r){ return String(r.id); }, sort:{ k:"at", d:1 }, src:{ a:"sched_list", p:{} }, onRow:function(k){ schOpen(k); }, h:420, empty:"예약이 없습니다",
    chips:[["all","전체",null],["wait","대기",function(r){ return r.st==="대기"||r.st==="실행중"; }],["off","꺼짐",function(r){ return r.st==="꺼짐"; }],["done","끝남",function(r){ return r.st!=="대기"&&r.st!=="실행중"&&r.st!=="꺼짐"; }],["auto","자동",function(r){ return r.kind!=="notice"&&r.kind!=="outro"; }]],
    cols:[{ k:"at", t:"실행 시각", type:"date", w:96 },{ k:"kind", t:"종류", w:120, v:function(r){ return SCH_K[r.kind]||r.kname||r.kind; } },{ k:"what", t:"내용", w:240, v:schWhat },
      { k:"push", t:"대상", w:240, v:schWho },{ k:"st", t:"상태", w:70, f:function(r){ return tag(r.st, SCH_ST[r.st]||""); } },{ k:"_a", t:"", w:300, act:schActs },{ k:"res", t:"결과", w:150 },{ k:"by", t:"만든 사람", w:110 }] });
}
function schOpen(id){ var g=MG.sched; rowDetail(g, id, { title:function(r){ return (SCH_K[r.kind]||r.kind)+" · "+hm(r.at); }, extra:function(r){ return r.st==="대기"?'<div class="mt">'+schActs(r)+'</div>':""; } }); }
/* 대상 · 조건 → 명세(pushSpec_ 가 받는 모양) · 틀리면 null */
function schBase(){
  if(SCH.tgt==="all") return {};
  if(SCH.tgt==="grp") return SCH.grp==="dap"?{ group:"dap" }:SCH.grp==="cc_wait"?{ group:"cchat", st:"대기" }:SCH.grp==="cc_match"?{ group:"cchat", st:"매칭" }:SCH.gname?{ group:"g:"+SCH.gname }:null;
  var L=SCH.ppl.map(function(x){ return x.emp; }); return L.length&&L.length<=50?{ emps:L }:null;
}
function schFl(){ var a=String(SCH.c.fl||"").split(/[^0-9]+/).filter(Boolean).map(Number); return a.every(function(n){ return n>=1&&n<=30; })?a.filter(function(n,i){ return a.indexOf(n)===i; }):null; }
function schCond(){ var c=SCH.c, o={};
  if(c.smin!==""||c.smax!==""){ var mn=c.smin===""?0:Number(c.smin), mx=c.smax===""?6:Number(c.smax); if(mn>mx) return null; o.stamps={ min:mn, max:mx }; }
  if(c.tk!=="") o.tickets={ min:Number(c.tk) };
  if(c.rl!=="") o.roulette=Number(c.rl);
  if(String(c.fl||"").trim()){ var f=schFl(); if(!f||!f.length) return null; o.floors=f; }
  if(String(c.dept||"").trim()) o.dept=String(c.dept).trim().slice(0,40);
  if(c.dev) o.dev=c.dev;
  return o; }
function schCondN(){ var o=schCond(); return o?Object.keys(o).length:0; }
function schNto(){ if(SCH.tgt==="ppl") return true; if(SCH.tgt==="all"&&!schCondN()) return false; return SCH.nto!=null?!!SCH.nto:SCH.tgt==="grp"; }
function schSpec(){ var b=schBase(), c=schCond(); if(!b||!c) return null; for(var k in c) b[k]=c[k]; if(SCH.tgt==="all"&&!Object.keys(c).length) b.all=1; return b; }
function schSpecTx(){ var sp=schSpec(); if(!sp) return "";
  var g=SCH.tgt==="all"?(Object.keys(sp).length&&!sp.all?"":"전체"):SCH.tgt==="ppl"?"개인 "+sp.emps.length+"명":(SCH_GRP.filter(function(x){ return x[0]===SCH.grp; })[0]||[0,""])[1]+(SCH.grp==="g"?" "+SCH.gname:""), d=[];
  if(sp.stamps) d.push("스탬프 "+sp.stamps.min+"~"+sp.stamps.max+"개"); if(sp.tickets) d.push("행운권 "+sp.tickets.min+"장 이상"); if(sp.roulette!=null) d.push(sp.roulette?"룰렛 씀":"룰렛 안 씀");
  if(sp.floors) d.push("근무 층 "+sp.floors.join("·")); if(sp.dept) d.push("부문 "+sp.dept); if(sp.dev) d.push("기기 "+(SCH_DEV.filter(function(x){ return x[0]===sp.dev; })[0]||[0,""])[1]);
  return (g?[g]:[]).concat(d).join(" · "); }
function schSel(id, v, opts, on){ return '<select id="'+id+'" onchange="'+on+'">'+opts.map(function(o){ return '<option value="'+esc(o[0])+'"'+(String(o[0])===String(v)?" selected":"")+'>'+esc(o[1])+'</option>'; }).join("")+'</select>'; }
function schForm(){
  var b=el("schF"); if(!b) return; var pOk=!!pushSt(), E=SCH.edit, c=SCH.c, cn=schCondN(), nto=schNto(), num=function(a,z){ var r=[["","상관없음"]]; for(var i=a;i<=z;i++) r.push([String(i),String(i)]); return r; };
  b.innerHTML='<h2>'+(E?"예약 고치기":"예약 만들기")+' <span class="cap">'+(E?"시각 · 글자 · 대상 · 조건을 바꿉니다":pOk?"공지 · Closing Speech · 푸시":"공지 · Closing Speech")+'</span></h2>'+
    (E?'':'<div class="chips mt">'+SCH_PRE.map(function(p,i){ return '<button type="button" class="chip" onclick="schPre('+i+')">'+esc(p.n)+'</button>'; }).join("")+'</div>')+
    '<div class="nt-row"><label class="nt-f up-f">종류<select class="xg-q nt-in" id="schK" onchange="SCH.k=this.value"'+(E?" disabled":"")+'><option value="outro"'+(SCH.k==="outro"?" selected":"")+'>Closing Speech</option><option value="notice"'+(SCH.k==="notice"?" selected":"")+'>공지</option></select></label>'+
    '<label class="nt-f up-f">날짜<input class="xg-q nt-in n" id="schD" value="'+esc(SCH.d)+'" oninput="SCH.d=this.value"></label>'+
    '<label class="nt-f up-f">시각<input class="xg-q nt-in n" id="schT" inputmode="numeric" placeholder="17:00" value="'+esc(SCH.hm)+'" oninput="SCH.hm=this.value"></label></div>'+
    '<label class="nt-f">제목<input class="xg-q nt-in" id="schTi" maxlength="40" placeholder="예: 경품 추첨 시작" value="'+esc(SCH.t)+'" oninput="SCH.t=this.value;schPvQ()"></label>'+
    '<label class="nt-f">내용<input class="xg-q nt-in" id="schB" maxlength="120" placeholder="예: 17F 대강당" value="'+esc(SCH.b)+'" oninput="SCH.b=this.value;schPvQ()"></label>'+
    '<div class="nt-f"><div class="nt-l" id="schTgtL">대상</div><div class="chips" role="radiogroup" aria-labelledby="schTgtL" style="margin:0">'+[["all","전체"],["grp","구분"],["ppl","사람"]].map(function(x){ return '<button type="button" role="radio" aria-checked="'+(SCH.tgt===x[0])+'" class="chip'+(SCH.tgt===x[0]?" on":"")+'" onclick="schTgt(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</div>'+
    (SCH.tgt==="grp"?'<div class="chips mt4" role="radiogroup" aria-label="구분" style="margin:6px 0 0">'+SCH_GRP.map(function(x){ return '<button type="button" role="radio" aria-checked="'+(SCH.grp===x[0])+'" class="chip'+(SCH.grp===x[0]?" on":"")+'" onclick="schGrp(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</div>'+
      (SCH.grp==="g"?'<div class="nt-row mt4"><label class="up-f">그룹'+schGrpSel()+'</label></div>':'<p class="cap mt4">'+(SCH.grp==="dap"?"AX 라운지 상담 신청 · 승인 상태인 사람":SCH.grp==="cc_wait"?"커피챗 희망 · 아직 선정 전인 사람":"커피챗 선정(매칭)된 사람")+' · 실행할 때의 상태로 셉니다</p>'):"")+
    (SCH.tgt==="ppl"?'<div class="nt-ppl mt4" id="schPpl"></div><div class="nt-q"><input class="xg-q" id="schQ" type="search" autocomplete="off" placeholder="사번 · 이름으로 찾아 더하기" aria-label="대상 찾기" value="'+esc(SCH.q)+'" oninput="schQ(this.value)"><div class="nt-qr" id="schQr"></div></div>'+
      '<label class="nt-f up-f">사번 여러 개 붙여 넣기 <span class="cap">줄바꿈 · 쉼표 · 띄어쓰기로 나눔</span><textarea id="schPaste" rows="2" placeholder="예: 2019001, 2020123" oninput="SCH.paste=this.value">'+esc(SCH.paste)+'</textarea></label><div class="mt4"><button class="btn sm" id="schPasteB" type="button" onclick="schPasteAdd()">사번 더하기</button> <span class="cap">한 예약에 50명까지</span></div>':"")+'</div>'+
    '<details class="sc-cd nt-f" id="schCd"'+(SCH.cOpen||cn?" open":"")+' ontoggle="SCH.cOpen=this.open"><summary>조건 <span class="cap">'+(cn?cn+"개 · 모두 맞는 사람":"없음 · 고른 대상 모두")+'</span></summary>'+
      '<div class="nt-row mt4"><label class="up-f">스탬프 몇 개부터'+schSel("schC1",c.smin,num(0,6),"schC('smin',this.value)")+'</label><label class="up-f">몇 개까지'+schSel("schC2",c.smax,num(0,6),"schC('smax',this.value)")+'</label>'+
      '<label class="up-f">행운권'+schSel("schC3",c.tk,[["","상관없음"],["1","1장 이상"],["2","2장 이상"],["3","3장"]],"schC('tk',this.value)")+'</label>'+
      '<label class="up-f">룰렛'+schSel("schC4",c.rl,[["","상관없음"],["1","씀"],["0","안 씀"]],"schC('rl',this.value)")+'</label></div>'+
      '<div class="nt-row mt4"><label class="up-f">근무 층 <span class="cap">예: 10, 17</span><input class="xg-q nt-in n" id="schC5" value="'+esc(c.fl)+'" oninput="schC(\'fl\',this.value,\'schC5\')"></label>'+
      '<label class="up-f">부문<input class="xg-q nt-in" id="schC6" maxlength="40" placeholder="예: 보상부문" value="'+esc(c.dept)+'" oninput="schC(\'dept\',this.value,\'schC6\')"></label>'+
      '<label class="up-f">기기'+schSel("schC7",c.dev,[["","상관없음"]].concat(SCH_DEV),"schC('dev',this.value)")+'</label></div>'+
      '<p class="cap mt4" id="schCe" style="color:var(--bad)">'+(schCond()?'':'조건을 확인합니다 · 스탬프 「부터」가 「까지」보다 크거나 층이 1~30 밖입니다')+'</p>'+
      (cn?'<div class="mt4"><button class="btn sm" type="button" onclick="SCH.c=SCH_C0();schForm();schPvQ()">조건 모두 지우기</button></div>':'')+'</details>'+
    (pOk?'<label class="up-ck nt-f"><input type="checkbox" id="schP"'+(SCH.push?" checked":"")+' onchange="SCH.push=this.checked;schForm();schPvQ()"> 푸시도 보내기 · 대상에게</label>':'')+
    (SCH.tgt==="ppl"?'<p class="cap mt4">사람 지정은 앱 공지도 그 사람에게만 나갑니다</p>':SCH.tgt==="all"&&!cn?'':'<label class="up-ck nt-f"><input type="checkbox" id="schN"'+(nto?" checked":"")+' onchange="SCH.nto=this.checked;schForm();schPvQ()"> 앱 공지도 이 대상에게만 · 끄면 앱 공지는 모두에게</label>')+
    '<p class="cap mt4" id="schPv">'+schPvTx()+'</p>'+
    '<div class="btns mt">'+(E?'<button class="btn pri" type="button" onclick="schSaveAsk()">고친 내용 저장</button><button class="btn" type="button" onclick="schNew()">고치기 그만</button>':'<button class="btn pri" type="button" onclick="schAddAsk()">예약 만들기</button>')+'</div>'+
    '<p class="cap mt">그 시각에 서버가 공지를 냅니다 · 대상 · 조건은 실행할 때 다시 풉니다 · 3분 넘게 늦으면 보내지 않고 「지남」</p>';
  schPplPaint(); schQrPaint();
}
function schGrpSel(){ var g=SCH.grps; if(!g) return '<span class="cap"> 그룹을 불러오는 중</span>'; if(!g.ok) return '<span class="cap"> 그룹을 불러오지 못했습니다 · '+esc(why(g))+'</span>';
  var L=g.groups||[]; if(!L.length) return '<span class="cap"> 만든 그룹이 없습니다</span>';
  return schSel("schG",SCH.gname,[["","그룹 고르기"]].concat(L.map(function(x){ return [x.name, x.name+" · "+n0(x.n)+"명"]; })),"SCH.gname=this.value;schForm();schPvQ()"); }
function schGrpLoad(){ if(SCH.grps&&SCH.grps.ok) return; call("push_group_list",{}).then(function(r){ SCH.grps=r||{ ok:false }; schForm(); }); }
function schTgt(t){ SCH.tgt=t; SCH.nto=null; schForm(); schPvQ(); if(t==="grp"&&SCH.grp==="g") schGrpLoad(); if(t==="ppl") setTimeout(function(){ var i=el("schQ"); if(i) i.focus(); },30); }
function schGrp(g){ SCH.grp=g; schForm(); schPvQ(); if(g==="g") schGrpLoad(); }
function schC(k, v, typed){ var a=schCondN(); SCH.c[k]=v;
  if(!typed||(schCondN()>0)!==(a>0)){ schForm(); var i=typed&&el(typed); if(i){ i.focus(); try{ i.setSelectionRange(i.value.length,i.value.length); }catch(e){} } } else { var e=el("schCe"); if(e) e.textContent=schCond()?"":"조건을 확인합니다 · 스탬프 「부터」가 「까지」보다 크거나 층이 1~30 밖입니다"; }
  schPvQ(); }
function schPplPaint(){ var b=el("schPpl"); if(!b) return; b.innerHTML=SCH.ppl.length?SCH.ppl.map(function(p){ var nm=p.name?personLine(p):p.emp; return '<span class="pchip">'+esc(nm)+'<button type="button" aria-label="'+esc(nm+" 빼기")+'" onclick="schDel(\''+jq(p.emp)+'\')">×</button></span>'; }).join("")+(SCH.ppl.length>50?'<span class="cap" style="color:var(--bad)">50명을 넘습니다 · 나눠서 예약합니다</span>':''):'<span class="cap">아직 고른 사람이 없습니다</span>'; }
function schAddP(p){ if(!p||!p.emp) return; if(!SCH.ppl.some(function(x){ return x.emp===p.emp; })) SCH.ppl.push({ emp:p.emp, name:p.name||"", dept:p.dept||"" }); }
function schDel(e){ SCH.ppl=SCH.ppl.filter(function(p){ return p.emp!==e; }); schPplPaint(); schQrPaint(); schPvQ(); }
function schPasteAdd(){ var a=(String(SCH.paste||"").toUpperCase().match(/[0-9A-Z]{3,12}/g)||[]), n=SCH.ppl.length; a.forEach(function(e){ schAddP({ emp:e }); });
  var k=SCH.ppl.length-n; SCH.paste=""; var t=el("schPaste"); if(t) t.value=""; schPplPaint(); schPvQ(); toast(k?"사번 "+k+"개를 더했습니다":"더할 사번이 없습니다",{ bad:!k }); }
function schQ(v){ SCH.q=v; clearTimeout(SCH._qq); var q=String(v||"").trim(); if(q.length<2){ SCH.qr=null; schQrPaint(); return; } SCH._qq=setTimeout(function(){ var s=++SCH.qseq; call("acct_page",{ q:q, n:8, sort:"last" }).then(function(r){ if(s!==SCH.qseq) return; SCH.qr=r; schQrPaint(); }); },300); }
function schQrPaint(){ var b=el("schQr"); if(!b) return; var r=SCH.qr; if(!r){ b.innerHTML=""; return; }
  if(!r.ok){ b.innerHTML='<div class="cap">찾지 못했습니다 · '+esc(why(r))+'</div>'; return; }
  var rows=(r.rows||[]); b.innerHTML=rows.length?rows.map(function(x){ var on=SCH.ppl.some(function(p){ return p.emp===x.emp; });
    return '<button type="button" class="nt-hit"'+(on?' aria-disabled="true"':'')+' onclick="schPick(\''+jq(x.emp)+'\',\''+jq(x.name)+'\',\''+jq(x.dept)+'\')"><b>'+esc(whoOf(x).n||"-")+'</b><span class="cap">'+esc(whoSub(x))+'</span>'+(on?tag("고름","ok"):x.acct?"":tag("가입 전","off"))+'</button>'; }).join(""):'<div class="cap">찾는 사람이 없습니다</div>'; }
function schPick(e, n, d){ schAddP({ emp:e, name:n, dept:d }); schPplPaint(); schQrPaint(); schPvQ(); }
function schPre(i){ var p=SCH_PRE[i]; if(!p) return; SCH.edit=""; SCH._r=null; SCH.k=p.kind; SCH.t=p.t; SCH.b=p.b; SCH.hm=p.at; SCH.tgt="all"; SCH.c=SCH_C0(); SCH.nto=null; if(p.tgt==="tickets"){ SCH.c.tk="1"; SCH.cOpen=true; } SCH.push=!!pushSt(); SCH.pv=null; schForm(); schPvQ(); if(!p.at) setTimeout(function(){ var t=el("schT"); if(t) t.focus(); },30); }
/* 받는 사람 세기 · 대상 · 조건 · 글자가 바뀔 때마다(0.5초 뒤) */
function schPvTx(){ var v=SCH.pv, nto=schNto(), sp=schSpec(), d=schSpecTx();
  if(!sp) return SCH.tgt==="ppl"?"사람을 고릅니다":SCH.tgt==="grp"&&SCH.grp==="g"&&!SCH.gname?"그룹을 고릅니다":"대상 · 조건을 확인합니다";
  var head=esc(schLine(nto,SCH.push,d));
  if(!nto&&!SCH.push) return head;
  if(!v) return head+" · 세는 중"; if(!v.ok) return head+" · 세지 못했습니다 · "+esc(ntWhy(v));
  return head+'<br>지금 기준 대상 <b class="n">'+n0(v.n)+'</b>명'+(SCH.push?' · 푸시 도달 <b class="n">'+n0(v.reach)+'</b>명':'')+(v.bad&&v.bad.length?' · 명부에 없는 사번 <b class="n">'+n0(v.bad.length)+'</b>개':'')+' · 실행할 때 다시 셈'; }
function schPvQ(){
  SCH.pv=null; clearTimeout(SCH.tm); var p0=el("schPv"); if(p0) p0.innerHTML=schPvTx();
  var sp=schSpec(); if(!sp||(!SCH.push&&!schNto())) return;
  SCH.tm=setTimeout(function(){ var s=++SCH.seq; call("push_preview",{ spec:JSON.stringify(sp), title:SCH.t.trim()||"예약", body:SCH.b.trim(), go:"notices" }).then(function(r){ if(s!==SCH.seq) return; SCH.pv=r||{ ok:false }; var p=el("schPv"); if(p) p.innerHTML=schPvTx(); }); },500);
}
var SCH_WHY={ range:"지금부터 1분 뒤 ~ 30일 안으로 넣습니다", at:"날짜 · 시각 형식을 확인합니다", text:"제목(40자) · 내용(120자)을 확인합니다", spec:"대상 · 조건이 올바르지 않습니다", kind:"이 종류는 만들 수 없습니다", state:"대기 · 꺼짐 줄만 고칩니다" };
function schAt(){ var dy=String(SCH.d).trim(), tm=String(SCH.hm).trim().replace(/\s/g,"");
  if(/^\d{3,4}$/.test(tm)) tm=("0"+tm).slice(-4).replace(/(\d\d)(\d\d)/,"$1:$2");
  if(/^\d:\d\d$/.test(tm)) tm="0"+tm;
  return /^\d{4}-\d\d-\d\d$/.test(dy)&&/^\d\d:\d\d$/.test(tm)?[dy,tm]:null; }
/* 보낼 값 · 앱 공지만 모두에게면 대상 없이(예전 그대로) */
function schOut(){ var push=!!(SCH.push&&pushSt()), nto=schNto(), sp=schSpec();
  if((push||nto)&&!sp){ toast(schPvTx(),{ bad:1 }); return null; }
  return { push:push, nto:nto, spec:push||nto?JSON.stringify(sp):"", d:schSpecTx() }; }
function schCheck(){ var a=schAt(); if(!a){ toast("날짜(2026-10-26)와 시각(17:00)을 넣습니다",{ bad:1 }); return null; }
  if(!SCH.t.trim()){ toast("제목을 넣습니다",{ bad:1 }); var f=el("schTi"); if(f) f.focus(); return null; }
  var o=schOut(); if(!o) return null; o.dy=a[0]; o.tm=a[1]; return o; }
function schLine(nto, push, d){ return nto?(push?"앱 공지 · 푸시 · "+d+" 에게만":"앱 공지만 · "+d+" 에게만 · 푸시 없음"):push?"앱 공지 모두 · 푸시 "+(d||"전체 구독자"):"앱 공지 모두 · 푸시 없음"; }
function schWhoTx(o){ var v=SCH.pv&&SCH.pv.ok?SCH.pv:null; return schLine(o.nto,o.push,o.d)+(v&&(o.push||o.nto)?" · 지금 "+n0(o.push?v.reach:v.n)+"명":""); }
function schAddAsk(){
  var o=schCheck(); if(!o) return; var dy=o.dy, tm=o.tm, ti=SCH.t.trim(), bo=SCH.b.trim(), push=o.push;
  confirmBox({ t:"예약을 만들까요?", who:ti+(bo?" · "+bo:""), sub:dy+" "+tm+" · "+SCH_K[SCH.k]+" · "+schWhoTx(o),
    body:'<p class="cap">그 시각에 서버가 '+(o.nto?"대상의":"모든 참가자")+' 앱에 공지를 냅니다.'+(push?" 푸시는 실행할 때 다시 세고 인원 확인 없이 나갑니다.":"")+' 대기 중에는 고치거나 취소할 수 있습니다.</p>', ok:"예약",
    run:function(){ return call("sched_add",{ kind:SCH.k, at:dy+" "+tm, title:ti, body:bo, push:push?1:null, spec:o.spec||null, nto:o.nto?1:null, by:ntBy() }); },
    fail:function(r){ return r&&SCH_WHY[r.reason]||""; },
    done:function(r){ schNew(); reload(["sched"]); var id=r&&(r.id||(r.row&&r.row.id));
      toast("예약했습니다 · "+tm+" "+ti, id?{ undo:function(){ call("sched_edit",{ id:id, op:"cancel" }).then(function(x){ reload(["sched"]); toast(x&&x.ok?"예약을 취소했습니다":"취소하지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); } }:{}); } });
}
/* 고치기 · 줄을 칸에 불러온다 */
function schLoad(id){
  var r=schRow(id)||(typeof nfNoGet==="function"?nfNoGet(id):null); if(!schManual(r)) return;
  var sp=r.spec||{}, c=SCH_C0();
  SCH.edit=String(r.id); SCH.k=r.kind; SCH.d=String(r.at||"").slice(0,10); SCH.hm=hm(r.at); SCH.t=r.title||""; SCH.b=r.body||""; SCH.push=!!r.push; SCH.nto=r.nto?true:false; SCH.ppl=[]; SCH.q=""; SCH.qr=null;
  if(sp.emps){ SCH.tgt="ppl"; SCH.ppl=sp.emps.map(function(e){ return { emp:e }; }); }
  else if(sp.group){ SCH.tgt="grp"; var g=String(sp.group); SCH.grp=g==="dap"?"dap":g==="cchat"?(sp.st==="매칭"?"cc_match":"cc_wait"):"g"; SCH.gname=g.indexOf("g:")===0?g.slice(2):""; if(SCH.grp==="g") schGrpLoad(); }
  else SCH.tgt="all";
  if(sp.stamps){ c.smin=String(sp.stamps.min); c.smax=String(sp.stamps.max); } if(sp.tickets) c.tk=String(sp.tickets.min); if(sp.roulette!=null) c.rl=String(sp.roulette);
  if(sp.floors) c.fl=sp.floors.join(", "); if(sp.dept) c.dept=sp.dept; if(sp.dev) c.dev=sp.dev;
  SCH.c=c; SCH.cOpen=Object.keys(c).some(function(k){ return c[k]!==""; }); SCH.pv=null; SCH._r=r;
  if(ntSub()!=="sched"){ goSub("sched"); return; }
  schForm(); schPvQ(); var f=el("schF"); if(f&&f.scrollIntoView) f.scrollIntoView({ block:"start" });
}
function schNew(){ SCH.edit=""; SCH._r=null; SCH.t=""; SCH.b=""; SCH.hm=""; SCH.tgt="all"; SCH.ppl=[]; SCH.c=SCH_C0(); SCH.nto=null; SCH.push=false; SCH.pv=null; schForm(); }
function schSaveAsk(){
  var r=SCH._r||schRow(SCH.edit); if(!r) return; var o=schCheck(); if(!o) return; var id=String(r.id), at=o.dy+" "+o.tm, ti=SCH.t.trim(), bo=SCH.b.trim();
  var prev={ id:id, op:"edit", title:r.title, body:r.body||"", at:String(r.at).slice(0,16), push:r.push?"1":"0", nto:r.nto?"1":"0", spec:r.spec&&(r.push||r.nto)?JSON.stringify(r.spec):"" };
  confirmBox({ t:"고친 내용을 저장할까요?", who:ti+(bo?" · "+bo:""), sub:at+" · "+(SCH_K[r.kind]||r.kind)+" · "+schWhoTx(o), ok:"저장",
    body:'<p class="cap">바꾸기 전 · '+esc(String(r.at).slice(0,16))+" · "+esc(r.title)+" · "+esc(schWho(r))+'</p>',
    run:function(){ return call("sched_edit",{ id:id, op:"edit", title:ti, body:bo, at:at===prev.at?"":at, push:o.push?"1":"0", nto:o.nto?"1":"0", spec:o.spec }); },
    fail:function(x){ return x&&SCH_WHY[x.reason]||""; },
    done:function(x){ schNew(); reload(["sched","ntf"]); toast("고쳤습니다 · "+((x.item&&x.item.title)||ti),{ undo:function(){ call("sched_edit",prev).then(function(z){ reload(["sched","ntf"]); toast(z&&z.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(z),{ bad:!(z&&z.ok) }); }); } }); } });
}
function schEdit(id, op){
  var r=schRow(id)||{}, nm=(r.title||SCH_K[r.kind]||"")+" · "+hm(r.at);
  var go=function(){ return call("sched_edit",{ id:id, op:op, min:op==="delay"?5:null }); };
  var fin=function(x){ reload(["sched"]); return x; };
  if(op==="delay"){ go().then(function(x){ fin(x); toast(x&&x.ok?"5분 미뤘습니다 · "+nm:"미루지 못했습니다 · "+(x&&x.reason==="state"?"이미 "+(x.st||"처리")+" 상태":why(x)),{ bad:!(x&&x.ok) }); }); return; }
  confirmBox({ t:op==="cancel"?"예약을 취소할까요?":"지금 실행할까요?", who:nm, sub:op==="cancel"?"이 예약은 실행되지 않습니다 · 다시 만들면 됩니다":"예약한 시각을 기다리지 않고 지금 "+(r.nto?"대상의":"모든 참가자")+" 앱에 공지를 냅니다"+(r.push?" · 푸시 포함":""),
    ok:op==="cancel"?"예약 취소":"지금 실행", danger:true, run:go,
    fail:function(x){ return x&&x.reason==="state"?"이미 "+(x.st||"처리")+" 상태입니다":""; },
    done:function(){ fin(); if(op==="cancel"&&SCH.edit===String(id)) schNew(); toast(op==="cancel"?"예약을 취소했습니다 · "+nm:"지금 실행했습니다 · "+nm); } });
}
(function(){
  var sc=SCREENS.notify, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return ntSub()==="sched"?[{ k:"sched", a:"sched_list", ttl:30000 },{ k:"pst", a:"push_stats", ttl:60000 }]:n0_(); };
  sc.mount=function(vb){
    if(ntSub()!=="sched") return m0(vb);
    el("phCap").textContent="정해진 시각에 서버가 내는 공지 · 푸시 · 대상 · 조건 · 고치기 · 지금 실행 · +5분 · 취소";
    schGrid();
    vb.innerHTML=chipsH(NT_SUBS,"sched")+'<div class="card"><div id="mg_sched"></div><p class="cap mt">커피챗 · 라운지 10분 전 알림은 선정 · 승인할 때 서버가 스스로 잡습니다 · 문구 · 켜고 끄기는 자동 알림 칸</p></div><div class="card mt" id="schF"></div>';
    schForm(); if(SCH.edit) schPvQ();
  };
  sc.paint=function(vb){
    if(ntSub()!=="sched") return p0(vb);
    gridPaint("sched","sched","예약",function(d){ return d.rows||[]; });
    if(DRW.k&&DRW.k.indexOf("sched:")===0) schOpen(DRW.k.slice(6));
    var f=el("schF"); if(f&&!f._p&&S.data.pst){ f._p=1; schForm(); }
  };
})();
