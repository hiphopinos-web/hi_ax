/* AXF CONTROL v2 · 알림 › 예약 (261016 4단계 · 지금 콘솔 「알림 › 예약」을 옮김)
 * 데이터 = sched_list(대기 · 실행중 + 지난 40건) · 만들기 = sched_add(kind outro | notice · at · title · body · push · spec) · 처리 = sched_edit(run · delay 5분 · cancel)
 * 푸시 받는 사람 미리 세기 = push_preview(지금 기준 · 실행할 때 서버가 다시 셈) · 자동 예약(커피챗 · 라운지 10분 전)은 선정 · 승인 때 서버가 잡는다
 * 명단 = 공통 표 · 대기 줄의 단추(지금 실행 · +5분 · 취소) · 줄을 누르면 서랍 · 확인 창(PIN 없음)
 * 261021 꺼짐 칩(공지 줄을 꺼 둔 것 · 켜기 · 취소 단추와 자동 줄 내용 글자는 ntf.js 가 덧씌움) */
var SCH_K={ notice:"공지", outro:"Closing Speech", crowd_notify:"혼잡 만료 알림", visit_slot:"관람 시간 알림", cchat_remind:"커피챗 10분 전", dap_remind:"AX 라운지 10분 전" };
var SCH_ST={ "대기":"warn", "실행중":"", "완료":"ok", "취소":"off", "지남":"bad", "오류":"bad" };
var SCH_PRE=[{ n:"Closing Speech 10분 전", kind:"outro", t:"Closing Speech 10분 전", b:"17F 대강당 · 17:00 시작", at:"16:50", tgt:"all" },{ n:"경품 추첨 시작", kind:"outro", t:"경품 추첨 시작", b:"17F 대강당", at:"", tgt:"tickets" }];
var SCH={ k:"outro", d:"2026-10-26", hm:"", t:"", b:"", push:false, tgt:"all", pv:null, seq:0, tm:0 };
NT_SUBS.splice(1,0,["sched","예약"]);
function schWhat(r){ return r.kind==="notice"||r.kind==="outro"?(r.title||"")+(r.body?" · "+r.body:""):r.kind==="cchat_remind"?"18F 커피챗 "+(r.slot||"")+" · 선정된 사람에게 푸시":r.kind==="dap_remind"?"1F AX 라운지 "+(r.slot||"")+" · 승인된 사람에게 푸시":(r.slot||r.tgt||""); }
function schRow(id){ var d=S.data.sched; return d&&d.ok?(d.rows||[]).filter(function(x){ return String(x.id)===String(id); })[0]:null; }
function schActs(r){ if(r.st!=="대기") return ""; var J=jq(r.id);
  return '<span class="btns"><button class="btn sm" type="button" onclick="schEdit(\''+J+'\',\'run\')">지금 실행</button><button class="btn sm" type="button" onclick="schEdit(\''+J+'\',\'delay\')">+5분</button><button class="btn sm dng" type="button" onclick="schEdit(\''+J+'\',\'cancel\')">취소</button></span>'; }
function schGrid(){
  return gridOf("sched",{ file:"알림 예약", key:function(r){ return String(r.id); }, sort:{ k:"at", d:1 }, src:{ a:"sched_list", p:{} }, onRow:function(k){ schOpen(k); }, h:420, empty:"예약이 없습니다",
    chips:[["all","전체",null],["wait","대기",function(r){ return r.st==="대기"||r.st==="실행중"; }],["off","꺼짐",function(r){ return r.st==="꺼짐"; }],["done","끝남",function(r){ return r.st!=="대기"&&r.st!=="실행중"&&r.st!=="꺼짐"; }],["auto","자동",function(r){ return r.kind!=="notice"&&r.kind!=="outro"; }]],
    cols:[{ k:"at", t:"실행 시각", type:"date", w:96 },{ k:"kind", t:"종류", w:120, v:function(r){ return SCH_K[r.kind]||r.kname||r.kind; } },{ k:"what", t:"내용", w:240, v:schWhat },
      { k:"st", t:"상태", w:70, f:function(r){ return tag(r.st, SCH_ST[r.st]||""); } },{ k:"_a", t:"", w:220, act:schActs },{ k:"push", t:"푸시", w:120, v:function(r){ return r.push?("푸시"+(r.pdesc?" · "+r.pdesc:"")):""; } },{ k:"res", t:"결과", w:150 },{ k:"by", t:"만든 사람", w:110 }] });
}
function schOpen(id){ var g=MG.sched; rowDetail(g, id, { title:function(r){ return (SCH_K[r.kind]||r.kind)+" · "+hm(r.at); }, extra:function(r){ return r.st==="대기"?'<div class="mt">'+schActs(r)+'</div>':""; } }); }
function schForm(){
  var b=el("schF"); if(!b) return; var pOk=!!pushSt();
  b.innerHTML='<h2>예약 만들기 <span class="cap">'+(pOk?"공지 · Closing Speech · 푸시":"공지 · Closing Speech")+'</span></h2>'+
    '<div class="chips mt">'+SCH_PRE.map(function(p,i){ return '<button type="button" class="chip" onclick="schPre('+i+')">'+esc(p.n)+'</button>'; }).join("")+'</div>'+
    '<div class="nt-row"><label class="nt-f up-f">종류<select class="xg-q nt-in" id="schK" onchange="SCH.k=this.value"><option value="outro"'+(SCH.k==="outro"?" selected":"")+'>Closing Speech</option><option value="notice"'+(SCH.k==="notice"?" selected":"")+'>공지</option></select></label>'+
    '<label class="nt-f up-f">날짜<input class="xg-q nt-in n" id="schD" value="'+esc(SCH.d)+'" oninput="SCH.d=this.value"></label>'+
    '<label class="nt-f up-f">시각<input class="xg-q nt-in n" id="schT" inputmode="numeric" placeholder="17:00" value="'+esc(SCH.hm)+'" oninput="SCH.hm=this.value"></label></div>'+
    '<label class="nt-f">제목<input class="xg-q nt-in" id="schTi" maxlength="40" placeholder="예: 경품 추첨 시작" value="'+esc(SCH.t)+'" oninput="SCH.t=this.value;schPvQ()"></label>'+
    '<label class="nt-f">내용<input class="xg-q nt-in" id="schB" maxlength="120" placeholder="예: 17F 대강당" value="'+esc(SCH.b)+'" oninput="SCH.b=this.value;schPvQ()"></label>'+
    (pOk?'<label class="nt-f" style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" id="schP"'+(SCH.push?" checked":"")+' onchange="SCH.push=this.checked;schForm();schPvQ()">푸시도 보내기</label>'+
      (SCH.push?'<div class="chips mt4" role="radiogroup" aria-label="푸시 받는 사람">'+[["all","전체 구독자"],["tickets","행운권 보유자"]].map(function(x){ return '<button type="button" role="radio" aria-checked="'+(SCH.tgt===x[0])+'" class="chip'+(SCH.tgt===x[0]?" on":"")+'" onclick="SCH.tgt=\''+x[0]+'\';schForm();schPvQ()">'+x[1]+'</button>'; }).join("")+'</div><p class="cap" id="schPv">'+schPvTx()+'</p>':''):'')+
    '<div class="btns mt"><button class="btn pri" type="button" onclick="schAddAsk()">예약 만들기</button></div>'+
    '<p class="cap mt">그 시각에 서버가 모든 참가자 앱에 공지를 냅니다 · 3분 넘게 늦으면 보내지 않고 「지남」 · 푸시는 실행할 때 대상을 다시 셉니다</p>';
}
function schPre(i){ var p=SCH_PRE[i]; if(!p) return; SCH.k=p.kind; SCH.t=p.t; SCH.b=p.b; SCH.hm=p.at; SCH.tgt=p.tgt; SCH.pv=null; schForm(); schPvQ(); if(!p.at) setTimeout(function(){ var t=el("schT"); if(t) t.focus(); },30); }
function schSpec(){ return SCH.tgt==="tickets"?{ tickets:{ min:1 } }:{ all:1 }; }
function schPvTx(){ var v=SCH.pv; if(!SCH.push) return ""; if(!SCH.t.trim()) return "제목을 넣으면 받는 인원이 나옵니다"; if(!v) return "받는 사람을 세는 중"; if(!v.ok) return "세지 못했습니다 · "+esc(ntWhy(v)); return '지금 기준 받는 사람 <b class="n">'+n0(v.n)+'</b>명 · 푸시 도달 <b class="n">'+n0(v.reach)+'</b>명 · 실행할 때 다시 셈'; }
function schPvQ(){
  SCH.pv=null; clearTimeout(SCH.tm); var p0=el("schPv"); if(p0) p0.innerHTML=schPvTx();
  if(!SCH.push||!SCH.t.trim()) return;
  SCH.tm=setTimeout(function(){ var s=++SCH.seq; call("push_preview",{ spec:JSON.stringify(schSpec()), title:SCH.t.trim(), body:SCH.b.trim(), go:"notices" }).then(function(r){ if(s!==SCH.seq) return; SCH.pv=r||{ ok:false }; var p=el("schPv"); if(p) p.innerHTML=schPvTx(); }); },500);
}
var SCH_WHY={ range:"지금부터 1분 뒤 ~ 30일 안으로 넣습니다", at:"날짜 · 시각 형식을 확인합니다", text:"제목(40자) · 내용(120자)을 확인합니다", spec:"푸시 대상이 올바르지 않습니다", kind:"이 종류는 만들 수 없습니다" };
function schAddAsk(){
  var dy=String(SCH.d).trim(), tm=String(SCH.hm).trim().replace(/\s/g,""), ti=SCH.t.trim(), bo=SCH.b.trim();
  if(/^\d{3,4}$/.test(tm)) tm=("0"+tm).slice(-4).replace(/(\d\d)(\d\d)/,"$1:$2");
  if(/^\d:\d\d$/.test(tm)) tm="0"+tm;
  if(!/^\d{4}-\d\d-\d\d$/.test(dy)||!/^\d\d:\d\d$/.test(tm)){ toast("날짜(2026-10-26)와 시각(17:00)을 넣습니다",{ bad:1 }); return; }
  if(!ti){ toast("제목을 넣습니다",{ bad:1 }); var f=el("schTi"); if(f) f.focus(); return; }
  var push=!!(SCH.push&&pushSt()), v=SCH.pv&&SCH.pv.ok?SCH.pv:null;
  confirmBox({ t:"예약을 만들까요?", who:ti+(bo?" · "+bo:""), sub:dy+" "+tm+" · "+SCH_K[SCH.k]+(push?" · 푸시 "+(SCH.tgt==="tickets"?"행운권 보유자":"전체 구독자")+(v?" 지금 "+n0(v.reach)+"명":""):""),
    body:'<p class="cap">그 시각에 서버가 모든 참가자 앱에 공지를 냅니다.'+(push?" 푸시는 실행할 때 다시 세고 인원 확인 없이 나갑니다.":"")+' 대기 중에는 취소할 수 있습니다.</p>', ok:"예약",
    run:function(){ return call("sched_add",{ kind:SCH.k, at:dy+" "+tm, title:ti, body:bo, push:push?1:null, spec:push?JSON.stringify(schSpec()):null, by:ntBy() }); },
    fail:function(r){ return r&&SCH_WHY[r.reason]||""; },
    done:function(r){ SCH.t=""; SCH.b=""; SCH.hm=""; SCH.pv=null; schForm(); reload(["sched"]); var id=r&&(r.id||(r.row&&r.row.id));
      toast("예약했습니다 · "+tm+" "+ti, id?{ undo:function(){ call("sched_edit",{ id:id, op:"cancel" }).then(function(x){ reload(["sched"]); toast(x&&x.ok?"예약을 취소했습니다":"취소하지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); } }:{}); } });
}
function schEdit(id, op){
  var r=schRow(id)||{}, nm=(r.title||SCH_K[r.kind]||"")+" · "+hm(r.at);
  var go=function(){ return call("sched_edit",{ id:id, op:op, min:op==="delay"?5:null }); };
  var fin=function(x){ reload(["sched"]); return x; };
  if(op==="delay"){ go().then(function(x){ fin(x); toast(x&&x.ok?"5분 미뤘습니다 · "+nm:"미루지 못했습니다 · "+(x&&x.reason==="state"?"이미 "+(x.st||"처리")+" 상태":why(x)),{ bad:!(x&&x.ok) }); }); return; }
  confirmBox({ t:op==="cancel"?"예약을 취소할까요?":"지금 실행할까요?", who:nm, sub:op==="cancel"?"이 예약은 실행되지 않습니다 · 다시 만들면 됩니다":"예약한 시각을 기다리지 않고 지금 모든 참가자 앱에 공지를 냅니다"+(r.push?" · 푸시 포함":""),
    ok:op==="cancel"?"예약 취소":"지금 실행", danger:true, run:go,
    fail:function(x){ return x&&x.reason==="state"?"이미 "+(x.st||"처리")+" 상태입니다":""; },
    done:function(){ fin(); toast(op==="cancel"?"예약을 취소했습니다 · "+nm:"지금 실행했습니다 · "+nm); } });
}
(function(){
  var sc=SCREENS.notify, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return ntSub()==="sched"?[{ k:"sched", a:"sched_list", ttl:30000 },{ k:"pst", a:"push_stats", ttl:60000 }]:n0_(); };
  sc.mount=function(vb){
    if(ntSub()!=="sched") return m0(vb);
    el("phCap").textContent="정해진 시각에 서버가 내는 공지 · 푸시 · 지금 실행 · +5분 · 취소";
    schGrid();
    vb.innerHTML=chipsH(NT_SUBS,"sched")+'<div class="card"><div id="mg_sched"></div><p class="cap mt">커피챗 · 라운지 10분 전 알림은 선정 · 승인할 때 서버가 스스로 잡습니다 · 문구 · 켜고 끄기는 자동 알림 칸</p></div><div class="card mt" id="schF"></div>';
    schForm();
  };
  sc.paint=function(vb){
    if(ntSub()!=="sched") return p0(vb);
    gridPaint("sched","sched","예약",function(d){ return d.rows||[]; });
    if(DRW.k&&DRW.k.indexOf("sched:")===0) schOpen(DRW.k.slice(6));
    var f=el("schF"); if(f&&!f._p&&S.data.pst){ f._p=1; schForm(); }
  };
})();
