/* AXF CONTROL v2 · 미팅 탭 (261016 밤 · 디자인 시안/커피챗 콘솔 기획 · 목업 · 서버 계약 · 사용자 D1~D10 권장안 · AI 는 하지 않음)
 * 칩 2개 = 18F 커피챗(시간표 · 명단 · 아이디어) · 1F AX 라운지(시간표 · 명단) · 오른쪽 「당일 모드」
 * 커피챗 시간표 = 행사 전에는 이 기기의 초안(localStorage) → 「반영」 때 cchat_set · cchat_status 대기 · meet_order_set(순번) · 당일 모드 = 놓는 즉시(확인 창 · D2)
 * 라운지 시간표 = lng_board · 놓는 즉시 resv_move(확인 창 · 참가자 알림 없음) · 쉬는 칸(설정 라운지_쉬는칸 · 없으면 12:00 · 12:30)은 그리지 않는다
 * 메모 · 순번 = meet_note_list · meet_note_set · meet_order_set · 서버가 모르는 액션이면 메모 칸을 숨기고 순번은 이 기기에만 둔다
 * 회차 · 테이블 = cfg_list 커피챗_회차 · 커피챗_회차정원(cchat.js ccCfg) · 라운지 칸 = lng_board(start · step · seats) · 없으면 설계값
 * 끌어다 놓기 = 마우스(6px 움직이면) · 터치(길게 누르기 · 보조) · 키보드(카드에서 Space = 고르기 → 칸에서 Enter) · 사람 상세 「옮기기」도 같은 고르기
 * 노쇼(커피챗) = staff_mark noshow + cchat_status 취소(why 노쇼) · 칸이 빈다 · 되돌리기 7초 */
var MT_REST_DEF=["12:00","12:30"];
var MT={ ov:lsGet("axf_v2_meet_ov",{})||{}, ord:lsGet("axf_v2_meet_ord",[])||[], ordD:lsGet("axf_v2_meet_ordd",0)?1:0, day:lsGet("axf_v2_meet_day",0)?1:0,
  pick:null, past:0, ns:{}, log:{}, fail:null, det:null, qno:{}, nowT:null, memo:null, jd:0 };
var MTD=null;
function mtSave(){ lsSet("axf_v2_meet_ov",MT.ov); lsSet("axf_v2_meet_ord",MT.ord); lsSet("axf_v2_meet_ordd",MT.ordD); }
function mtSub(){ var a=String(S.sub.meet||"cc").split("-"), p=a[0]==="ln"?"ln":"cc", v=a[1]||"board";
  if((p==="cc"&&["board","list","idea"].indexOf(v)<0)||(p==="ln"&&["board","list"].indexOf(v)<0)) v="board"; return { p:p, v:v }; }
function mtGo(p, v){ MT.pick=null; goSub(p+(v&&v!=="board"?"-"+v:"")); }
function mtKp(k){ var i=String(k).lastIndexOf(":"); return [k.slice(0,i), k.slice(i+1)]; }
function mtNowMin(){ if(MT.nowT!=null) return MT.nowT; var d=srvNow(); return d.getHours()*60+d.getMinutes(); }

/* ── 1. 메모 · 순번(meet_note_list) · 261016 밤 분류 걷음(사용자 「너무 정신이 없다」) ── */
function mtNoteD(p){ return S.data[p==="cc"?"mnc":"mnl"]; }
function mtNoteOk(p){ var d=mtNoteD(p); return !!(d&&d.ok&&Array.isArray(d.rows)); }
function mtNote(p, emp){ var d=mtNoteD(p); if(!d||!d.ok||!Array.isArray(d.rows)) return null; var e=normE(emp);
  for(var i=0;i<d.rows.length;i++){ var r=d.rows[i]; if(normE(r.emp)===e&&(!r.prog||r.prog===p)) return r; } return null; }
function mtNotePatch(p, emp, o){ var d=mtNoteD(p); if(!d||!d.ok||!Array.isArray(d.rows)) return; var n=mtNote(p, emp); if(!n){ n={ prog:p, emp:normE(emp) }; d.rows.push(n); } for(var k in o) n[k]=o[k]; }

/* ── 2. 커피챗 모양 · 서버 칸 + 이 기기 초안(MT.ov = 사번 → { to 칸 | "" 대기 줄, base 초안 만들 때 서버 칸 }) ── */
function mtSrvK(r){ return CC_ON.indexOf(r.status)>=0&&hm(r.round)&&r.table?hm(r.round)+":"+r.table:""; }
function mtCcM(){
  var cf=ccCfg(), rows=ccRows(), useOv=!MT.day, at={}, out=[], q=[], by={}, chg=[], conf=[];
  rows.forEach(function(r){
    if(r.status==="취소") return;
    var e=jq(r.emp), s=mtSrvK(r), o=useOv?MT.ov[e]:null, k=s; by[e]=r;
    if(o){ if(o.base!==s||["대기","매칭"].indexOf(r.status)<0) conf.push(e); else { k=o.to; if(k!==s) chg.push({ e:e, r:r, from:s, to:k }); } }
    r._k=k; r._s=s;
    if(!k){ q.push(r); return; }
    var ks=mtKp(k); if(cf.rounds.indexOf(ks[0])<0||cf.tables.indexOf(ks[1])<0||at[k]){ out.push(r); return; }
    at[k]=r;
  });
  var so=function(r){ var n=mtNote("cc", r.emp); return n&&num(n.ord)?num(n.ord):1e9; };
  q.sort(function(a,b){
    if(MT.ordD){ var ia=MT.ord.indexOf(jq(a.emp)), ib=MT.ord.indexOf(jq(b.emp)); if(ia>=0||ib>=0){ if(ia<0) return 1; if(ib<0) return -1; return ia-ib; } }
    return (so(a)-so(b))||String(a.ts).localeCompare(String(b.ts)); });
  MT.qno={}; q.forEach(function(r,i){ MT.qno[jq(r.emp)]=i+1; });
  return { p:"cc", cf:cf, at:at, out:out, q:q, by:by, chg:chg, conf:conf, len:CC_LEN, tables:cf.tables,
    rows:cf.rounds.map(function(t){ return { t:t, to:m2hm(mins(t)+CC_LEN) }; }) };
}
function mtQno(r){ return MT.qno[jq(r.emp)]||""; }
function mtOrdChanged(){ return !!(MT.ordD&&mtNoteOk("cc")); }
/* 미팅 탭 배지 = 커피챗 대기 줄(미선정 알림 전) */
function meetCount(){ var d=S.data.cc; if(d&&d.ok) return mtCcM().q.filter(function(r){ return r.status==="대기"&&!r.overAt; }).length; var b=S.data.nb; return b&&b.ok?num(b.cchat&&b.cchat.wait):0; }

/* ── 3. 라운지 모양 · lng_board(cells · none · over) ── */
function mtRest(){ var d=S.data.ccf, rows=d&&d.ok&&d.rows||[], r=rows.filter(function(x){ return x.k==="라운지_쉬는칸"; })[0];
  return r?String(r.v||"").split(/[\s,·]+/).map(hm).filter(Boolean):MT_REST_DEF; }
function mtLnM(){
  var d=S.data.lgb; if(!d||!d.ok||!Array.isArray(d.cells)) return null;
  var rest=mtRest(), at={}, rows=[], by={}, q=[], out=[], seats=num(d.seats)||2, tb=[];
  for(var s=1;s<=seats;s++) tb.push(String(s));
  d.cells.forEach(function(c){ var t=hm(c.from), any=(c.seats||[]).some(Boolean);
    rows.push({ t:t, to:hm(c.to), rest:rest.indexOf(t)>=0&&!any });
    (c.seats||[]).forEach(function(x,j){ if(x){ var k=t+":"+(j+1); x._k=k; at[k]=x; by[String(x.id)]=x; } }); });
  (d.none||[]).forEach(function(x){ x._k=""; by[String(x.id)]=x; q.push(x); });
  (d.over||[]).forEach(function(x){ x._k=""; by[String(x.id)]=x; out.push(x); });
  return { p:"ln", d:d, at:at, rows:rows, by:by, q:q, out:out, tables:tb, len:num(d.step)||30 };
}
function meetLnCount(){ var L=mtLnM(); return L?L.q.length:null; }

/* ── 4. 화면 틀 ── */
SCREENS.meet={
  title:"미팅", desc:"18F 커피챗 · 1F AX 라운지 · 시간표 짜기 · 명단 · 당일 진행",
  need:function(){ var s=mtSub(), t=MT.day?15000:30000, a=[{ k:"cc", a:"cchat_list", ttl:t },{ k:"ccf", a:"cfg_list", ttl:60000 },{ k:"lgb", a:"lng_board", ttl:t }];
    if(s.p==="cc") a.push({ k:"mnc", a:"meet_note_list", p:{ prog:"cc" }, ttl:60000 });
    else a.push({ k:"mnl", a:"meet_note_list", p:{ prog:"ln" }, ttl:60000 },{ k:"resv", a:"resv_list", ttl:t });
    return a; },
  mount:function(vb){
    var s=mtSub();
    el("phCap").textContent=s.p==="cc"?"18F 커피챗 · 1:1 20분 · 신청 순서대로 놓고 반영하면 선정 알림":"1F AX 라운지 · 1:1 상담 · 사전 명단 · 놓으면 바로 반영(알림 없음)";
    vb.innerHTML='<div class="mtg'+(MT.pick?" picking":"")+'" id="mtgR"><div class="mtg-hd" id="mtgHd"></div><div id="mtgB"></div></div>';
    var b=el("mtgB");
    if(s.v==="list"){ if(s.p==="cc") b.innerHTML='<div class="card"><div id="mtgL"></div></div>'; else lgShell(b); }
    else if(s.v==="idea") b.innerHTML='<div class="card"><h2>신청 글 <span class="cap">신청 순서 · 줄을 누르면 사람 상세 · 메모</span></h2><div id="mtIb"></div></div>';
  },
  paint:function(){
    var s=mtSub(); mtHead(s);
    if(s.v==="list"){ if(s.p==="cc"){ mtCcM(); ccListPaint(el("mtgL")); } else lgPaint(); }
    else if(s.v==="idea") mtIdeaPaint();
    else mtBoardPaint(s.p);
  }
};
function mtHead(s){
  var hd=el("mtgHd"); if(!hd) return;
  var cn=meetCount(), ln=meetLnCount();
  var chip=function(p, lab, n){ var on=s.p===p; return '<button type="button" role="tab" aria-selected="'+on+'" class="chip'+(on?" on":"")+'" onclick="mtGo(\''+p+'\',\''+(on?s.v:"board")+'\')">'+lab+' <span class="c">'+(n==null?"-":n0(n))+'</span></button>'; };
  var vs=s.p==="cc"?[["board","시간표"],["list","명단"],["idea","아이디어"]]:[["board","시간표"],["list","명단"]];
  var h='<div class="chips" role="tablist" aria-label="미팅">'+chip("cc","18F 커피챗",cn)+chip("ln","1F AX 라운지",ln)+'</div>'+
    '<div class="mtg-seg" role="group" aria-label="보기">'+vs.map(function(v){ return '<button type="button" aria-pressed="'+(s.v===v[0])+'" class="'+(s.v===v[0]?"on":"")+'" onclick="mtGo(\''+s.p+'\',\''+v[0]+'\')">'+v[1]+'</button>'; }).join("")+'</div>'+
    '<button type="button" class="mtg-sw" role="switch" aria-checked="'+(MT.day?"true":"false")+'" onclick="mtDay()"><i></i>당일 모드</button>';
  if(hd._h!==h){ hd._h=h; hd.innerHTML=h; }
}
function mtDay(){ MT.day=MT.day?0:1; lsSet("axf_v2_meet_day",MT.day); MT.pick=null; MT.fail=null; var s=mtSub(); if(MT.day&&s.v!=="board") mtGo(s.p,"board"); else { var b=el("mtgB"); if(b) b._h=""; paint(); } reload(["cc","lgb"]); }

/* ── 5. 시간표 ── */
function mtBoardPaint(p){
  if(MTD) return;
  var b=el("mtgB"); if(!b) return;
  var gt=p==="cc"?dataGate("cc","커피챗 명단"):dataGate("lgb","라운지 시간표");
  var h=gt||mtBoardH(p);
  el("mtgR").classList.toggle("picking",!!MT.pick);
  if(b._h===h) return; b._h=h;
  var a=document.activeElement, fk=a&&b.contains(a)?(a.getAttribute("data-k")?'[data-k="'+jq(a.getAttribute("data-k"))+'"]':a.getAttribute("data-drop")?'[data-drop="'+jq(a.getAttribute("data-drop"))+'"]':""):"";
  b.innerHTML=h;
  if(fk){ var f=b.querySelector(fk); if(f) f.focus(); }
}
function mtTagSt(p, x){ var s=p==="cc"?x.status:x.st;
  if(p==="cc") return s==="참석"?tag("왔음","ok"):s==="완료"?tag("끝","ok"):"";
  return s==="체크인"?tag("왔음","ok"):s==="완료"?tag("끝","ok"):s==="노쇼"?tag("노쇼","bad"):""; }
function mtCard(M, x, no){
  var cc=M.p==="cc", key=cc?jq(x.emp):String(x.id), st=cc?x.status:x.st, k=x._k||"", tags=[], acts="", sc="", lock=false;
  var done=cc?st==="완료":st==="완료", ns=!cc&&st==="노쇼", inn=cc?st==="참석":st==="체크인";
  lock=cc?(st!=="대기"&&st!=="매칭"):RV_ON.indexOf(st)<0;
  if(cc&&!(MT.day&&k)){
    var pl=x.pref?String(x.pref).split(",").map(hm).filter(Boolean):[], rr=k?mtKp(k)[0]:"";
    tags.push(pl.length?(rr&&pl.indexOf(rr)<0?tag("희망 밖","warn"):tag(pl.join(" · "),"off")):tag("언제든","off"));
    if(st==="대기"&&x.overAt) tags.push(tag("미선정 알림","off"));
  }
  var stt0=mtTagSt(M.p, x); if(stt0) tags.unshift(stt0);
  if(MT.day&&k){
    var r0=mins(mtKp(k)[0]), nm=mtNowMin();
    if(!inn&&!done&&!ns&&nm>=r0+5&&nm<r0+M.len) tags.unshift(tag("늦음","warn"));
    if(ns) sc=" st-no"; else if(done) sc=" st-dn";
    if(!done&&!ns) acts='<div class="acts"><button type="button" data-a="in" aria-pressed="'+inn+'" class="'+(inn?"on":"")+'">왔음</button><button type="button" data-a="ns">노쇼</button><button type="button" data-a="dn">종료</button></div>';
  }
  var chg=cc&&!MT.day&&k!==x._s;
  var memo=mtNote(M.p, x.emp), md=memo&&memo.memo?'<i class="md" title="메모 있음" aria-label="메모 있음"></i>':"";
  var pick=MT.pick&&MT.pick.p===M.p&&MT.pick.k===key;
  var tx=cc&&!MT.day&&(x.text||x.tag)?'<div class="tx">'+esc(x.text||x.tag)+'</div>':"";
  return '<div class="mtg-pc'+(chg?" chg":"")+(lock?" lock":"")+(pick?" pick":"")+sc+'" data-p="'+M.p+'" data-k="'+esc(key)+'" tabindex="0" role="button" aria-label="'+esc((x.name||x.emp)+(lock?" · 상세":" · 상세 · Space 로 옮길 사람 고르기"))+'">'+
    '<div class="l1">'+(no?'<span class="no">'+no+'</span>':'')+'<span class="nm">'+esc(x.name||x.emp)+'</span><span class="dp">'+esc(x.dept||"")+'</span><span class="sp"></span>'+md+'</div>'+
    (tags.length?'<div class="l2">'+tags.join("")+'</div>':'')+tx+acts+'</div>';
}
function mtBoardH(p){
  var cc=p==="cc", M=cc?mtCcM():mtLnM(); if(!M) return band("info","이 서버는 아직 라운지 시간표를 모릅니다 · 서버 갱신 뒤");
  var nm=mtNowMin(), len=M.len, rows=M.rows, h="";
  var on=function(r){ return !r.rest; }, live=rows.filter(on);
  var curR=MT.day?live.filter(function(r){ return nm>=mins(r.t)&&nm<mins(r.t)+len; })[0]:null;
  var nxt=MT.day?live.filter(function(r){ return mins(r.t)>(curR?mins(curR.t):nm); })[0]:null;
  var lab=function(t){ return (cc?"테이블 ":"미팅룸 ")+t; };
  if(MT.day){
    var who=function(r,t){ if(!r) return "-"; var x=M.at[r.t+":"+t]; return x?esc(x.name||x.emp):"빈 칸"; };
    h+='<div class="mtg-now"><div class="cur"><h3>'+(curR?'지금 <em class="n">'+curR.t+'</em> 회차':'지금 진행 중인 회차 없음')+'</h3><div class="rw">'+(curR?M.tables.map(function(t){ return '<div><small>'+lab(t)+'</small><span>'+who(curR,t)+'</span></div>'; }).join(""):'')+'</div></div>'+
      '<div><h3>'+(nxt?'다음 <span class="n">'+nxt.t+'</span> 회차':'다음 회차 없음')+'</h3><div class="rw">'+(nxt?M.tables.map(function(t){ return '<div><small>'+lab(t)+'</small><span>'+who(nxt,t)+'</span></div>'; }).join(""):'')+'</div></div></div>';
  } else if(cc){
    var n=M.chg.length, od=mtOrdChanged();
    if(M.conf.length) h+='<div class="mtg-bar draft"><b>다른 곳에서 바뀜 '+M.conf.length+'명</b><span class="cap">'+esc(M.conf.map(function(e){ var r=M.by[e]; return r?(r.name||r.emp):e; }).join(", "))+' · 이 사람들은 서버 칸으로 보입니다</span><span class="sp"></span><button class="btn sm" type="button" onclick="mtConfDrop()">초안에서 빼기</button></div>';
    h+=n||od?'<div class="mtg-bar draft"><b>초안 바뀜 '+(n+(od?1:0))+'건</b><span class="cap">'+(n?"칸 "+n+"명":"")+(n&&od?" · ":"")+(od?"대기 줄 순서":"")+' · 이 기기에만 있음 · 반영하면 참가자에게 선정 알림</span><span class="sp"></span><button class="btn sm" type="button" onclick="mtUndoAsk()">되돌리기</button><button class="btn sm pri" type="button" onclick="mtApplyAsk()">반영 · 선정 알림 보내기</button></div>'
      :'<div class="mtg-bar"><span class="cap">초안 바뀜 없음 · 서버와 같음'+(MT.ordD&&!mtNoteOk("cc")?" · 대기 줄 순서는 이 기기에만":"")+'</span></div>';
  }
  if(MT.fail&&MT.fail.length) h+=band("warn","<b>못 한 "+MT.fail.length+"명</b> · "+esc(MT.fail.map(function(f){ return f.nm+" "+f.why; }).join(" · ")),'<button class="btn sm" type="button" onclick="MT.fail=null;paint()">닫기</button>');
  if(MT.pick) h+=band("info","<b>"+esc(mtPickName())+"</b> · 놓을 칸을 누릅니다 · Esc 로 그만",'<button class="btn sm" type="button" onclick="mtPickOff()">그만</button>');
  /* 왼쪽 · 대기 줄(커피챗) · 칸 미정(라운지) */
  var q=M.q, qn=cc?q.length:q.length;
  h+='<div class="mtg-wrap"><section class="card mtg-q" aria-label="'+(cc?"대기 줄":"칸 미정")+'"><h2>'+(cc?"대기 줄":"칸 미정")+' <span class="cap n">'+n0(qn)+'명</span><span class="sp"></span>'+
    (cc&&!MT.day?'<button class="btn sm" type="button" onclick="mtAuto()">자동 배정 채우기</button>':'')+'</h2>'+
    '<p class="cap" style="margin-bottom:6px">'+(cc?"신청 순서 · 끌어서 칸에 놓기":"시간 없는 사람 · 끌어서 칸에 놓기")+'</p>'+
    '<div class="mtg-ql" data-drop="q"'+(MT.pick&&cc?' tabindex="0"':'')+'>'+q.map(function(x,i){ return mtCard(M, x, cc?i+1:0); }).join("")+(q.length?'':'<span class="cap" style="padding:8px 4px">'+(cc?"대기 줄 비어 있음":"칸 미정 없음")+'</span>')+'</div>'+
    (M.out.length?'<h2 class="mt">칸 밖 <span class="cap n">'+M.out.length+'명</span></h2><p class="cap" style="margin-bottom:6px">'+(cc?"지금 회차 · 테이블 설정에 없는 칸":"운영 시간 밖 칸")+' · 칸으로 끌어 놓기</p><div class="mtg-ql">'+M.out.map(function(x){ return mtCard(M, x, 0); }).join("")+'</div>':'')+
    (cc?'<div class="mt"><button class="btn sm dng" type="button" onclick="ccClose()"'+(ccWaitN()?'':' aria-disabled="true"')+'>희망 접수 마감 · 미선정 알림</button></div>':'')+'</section>';
  /* 오른쪽 · 격자 */
  h+='<section class="card mtg-bd"><h2>'+(cc?"18F 커피챗 · 1:1 "+len+"분 · 테이블 "+M.tables.join(" · "):"1F AX 라운지 · 1:1 "+len+"분 · 미팅룸 "+M.tables.join(" · "))+'</h2>'+
    (cc&&!ccCfg().srv?'<p class="cap" style="margin-bottom:6px">회차 · 테이블 = 설계값(서버 설정 커피챗_회차 · 커피챗_회차정원을 받으면 그 값)</p>':'')+
    '<div class="mtg-grid" style="grid-template-columns:'+(window.innerWidth<=760?"52px":"76px")+' repeat('+M.tables.length+',minmax(0,1fr))"><div class="th">회차</div>'+M.tables.map(function(t){ return '<div class="th"><b>'+lab(t)+'</b></div>'; }).join("");
  var pastN=MT.day?live.filter(function(r){ return nm>=mins(r.t)+len; }).length:0, foldDone=false, gap=null;
  var flushGap=function(){ if(gap){ h+='<div class="mtg-gap">'+(mins(gap[0])>=11*60&&mins(gap[0])<14*60?"점심 ":"쉬는 시간 ")+gap[0]+"~"+gap[1]+' · 칸 없음</div>'; gap=null; } };
  rows.forEach(function(r){
    if(r.rest){ gap=gap?[gap[0],r.to]:[r.t,r.to]; return; }
    flushGap();
    var past=MT.day&&nm>=mins(r.t)+len, cur=curR&&curR.t===r.t;
    if(past&&!MT.past){ if(!foldDone){ foldDone=true; h+='<button type="button" class="mtg-fold" onclick="MT.past=1;paint()">지난 회차 '+pastN+'개 접힘 · 펼치기</button>'; } return; }
    var cl=(cur?" cur":"")+(past?" past":"");
    h+='<div class="mtg-tm'+cl+'"><b>'+r.t+'</b><span>~'+r.to+'</span></div>';
    M.tables.forEach(function(t){ var key=r.t+":"+t, x=M.at[key];
      h+='<div class="mtg-sl'+(x?" fill":"")+cl+'" data-drop="'+key+'"'+(x?'':' tabindex="0" aria-label="'+r.t+' '+lab(t)+' 빈 칸"')+'>'+(x?mtCard(M, x, 0):'<span class="em">빈 칸</span>')+'</div>'; });
  });
  flushGap();
  if(MT.day&&MT.past&&pastN) h+='<button type="button" class="mtg-fold" onclick="MT.past=0;paint()">지난 회차 접기</button>';
  h+='</div></section></div>';
  return h;
}

/* ── 6. 초안(행사 전 · 커피챗) ── */
function mtOvSet(r, to){ var e=jq(r.emp); if(to===r._s) delete MT.ov[e]; else MT.ov[e]={ to:to, base:r._s }; }
function mtCcDraftDrop(e, to, before){
  var M=mtCcM(), r=M.by[e]; if(!r) return;
  if(r.status!=="대기"&&r.status!=="매칭"){ toast("왔음 · 끝 처리한 사람은 옮기지 않습니다",{ bad:1 }); return; }
  if(M.conf.indexOf(e)>=0){ toast("다른 곳에서 바뀐 사람입니다 · 위 띠에서 초안을 정리합니다",{ bad:1 }); return; }
  var from=r._k, qs=M.q.map(function(x){ return jq(x.emp); });
  if(to==="q"){ mtOvSet(r,""); qs=qs.filter(function(x){ return x!==e; }); var at=before?qs.indexOf(before):-1; if(at<0) qs.push(e); else qs.splice(at,0,e); MT.ord=qs; MT.ordD=1; mtSave(); paint(); return; }
  if(from===to) return;
  var o=M.at[to];
  if(o){ var oe=jq(o.emp);
    if(o.status!=="대기"&&o.status!=="매칭"){ toast("그 칸 사람은 이미 왔음 · 끝입니다",{ bad:1 }); return; }
    if(M.conf.indexOf(oe)>=0){ toast("그 칸 사람은 다른 곳에서 바뀌었습니다",{ bad:1 }); return; }
    mtOvSet(o, from||"");
    if(!from){ var i=qs.indexOf(e); if(i>=0) qs.splice(i,1,oe); else qs.unshift(oe); MT.ord=qs; MT.ordD=1; } }
  mtOvSet(r, to); mtSave(); paint();
}
/* 자동 배정 · 대기 줄 순서대로 · 그 사람이 고른 시간 중 가장 이른 빈 칸(테이블 A 먼저) · 고른 시간이 없으면 모든 회차 · 놓인 사람은 그대로 · 미선정 알림 받은 사람은 건너뜀 */
function mtAuto(){
  var M=mtCcM(), used={}, n=0; Object.keys(M.at).forEach(function(k){ used[k]=1; });
  M.q.forEach(function(r){
    if(r.status!=="대기"&&r.status!=="매칭"||r.overAt||M.conf.indexOf(jq(r.emp))>=0) return;
    var pl=r.pref?String(r.pref).split(",").map(hm).filter(function(t){ return M.cf.rounds.indexOf(t)>=0; }):[]; if(!pl.length) pl=M.cf.rounds; pl=pl.slice().sort();
    for(var i=0;i<pl.length;i++) for(var j=0;j<M.tables.length;j++){ var k=pl[i]+":"+M.tables[j]; if(!used[k]){ used[k]=1; mtOvSet(r,k); n++; return; } }
  });
  mtSave(); paint(); toast(n?"대기 줄 순서대로 "+n+"명을 고른 시간 안의 빈 칸에 놓았습니다 · 반영 전 초안":"고른 시간에 빈 칸이 없습니다");
}
function mtUndoAsk(){
  var M=mtCcM(), n=M.chg.length+(mtOrdChanged()?1:0);
  confirmBox({ t:"초안을 버릴까요?", who:"초안 바뀜 "+n+"건", sub:"서버에 반영된 칸 · 순서로 돌아갑니다 · 참가자에게 가는 것 없음", ok:"초안 버리기", danger:1,
    run:function(){ return { ok:true }; }, done:function(){ MT.ov={}; MT.ord=[]; MT.ordD=0; mtSave(); paint(); toast("초안을 버렸습니다"); } });
}
function mtConfDrop(){ var M=mtCcM(); M.conf.forEach(function(e){ delete MT.ov[e]; }); mtSave(); paint(); toast("다른 곳에서 바뀐 "+M.conf.length+"명을 초안에서 뺐습니다"); }
function mtApplyAsk(){
  var M=mtCcM(), add=0, mv=0, out=0, od=mtOrdChanged();
  M.chg.forEach(function(c){ if(!c.from) add++; else if(!c.to) out++; else mv++; });
  if(!M.chg.length&&!od) return;
  confirmBox({ t:"초안을 반영할까요?", who:"선정 "+add+"명 · 시간 바뀜 "+mv+"명 · 칸에서 뺌 "+out+"명", sub:"참가자 앱 알림 "+(add+mv)+"건(선정 · 시간 바뀜)"+(od?" · 대기 줄 순서 저장":""), ok:"반영 · 알림 보내기",
    run:function(){ return mtCcRun(M.chg.map(function(c){ return { e:c.e, to:c.to }; })).then(function(res){ return (od?mtOrdSave():Promise.resolve(null)).then(function(){ return res; }); }); },
    done:function(res){ MT.fail=res.fail.length?res.fail:null; paint(); reload(["cc","nb","mnc"]);
      toast("반영했습니다 · "+res.done+"명"+(res.fail.length?" · 못 함 "+res.fail.length+"명":"")+(res.full?" · 정원 넘침 경고 "+res.full+"건":""),{ bad:res.fail.length?1:0 }); } });
}
/* 서버에 차례로 · 빼기 먼저 · 빈 칸부터 · 맞바꾸기(칸이 서로 물린 경우)는 한 사람을 잠시 대기로 돌린 뒤 놓는다(서버가 같은 칸 두 사람을 거절해도 됨 · S7) */
function mtCcRun(items){
  var st={}, at={}, cur={}, emp={}, nmOf={}, res={ ok:true, done:0, fail:[], full:0 };
  ccRows().forEach(function(r){ if(r.status==="취소") return; var e=jq(r.emp); st[e]=r.status; emp[e]=r.emp; nmOf[e]=r.name||r.emp; var k=mtSrvK(r); if(k){ at[k]=e; cur[e]=k; } });
  var pend=items.filter(function(it){ return !!st[it.e]; }).sort(function(a,b){ return (a.to?1:0)-(b.to?1:0); });
  var one=function(e, to){ var ks=to?mtKp(to):null;
    return (to?call("cchat_set",{ emp:emp[e], round:ks[0], table:ks[1], from:st[e] }):call("cchat_status",{ emp:emp[e], status:"대기", from:st[e] })).then(function(x){
      if(x&&x.ok){ if(cur[e]&&at[cur[e]]===e) delete at[cur[e]]; if(to){ at[to]=e; cur[e]=to; st[e]="매칭"; } else { delete cur[e]; st[e]="대기"; } if(x.warn==="full") res.full++; return true; }
      return x||{ ok:false, reason:"network" }; }); };
  var fail=function(it, x){ res.fail.push({ e:it.e, nm:nmOf[it.e]||it.e, why:x&&x.reason==="seat"?"그 칸에 다른 사람이 있음":x&&x.reason==="state"?"이미 "+(x.cur||"다른 상태"):why(x) }); };
  var step=function(){
    if(!pend.length) return Promise.resolve(res);
    var i=-1; for(var j=0;j<pend.length;j++){ var it=pend[j]; if(!it.to||!at[it.to]||at[it.to]===it.e){ i=j; break; } }
    if(i<0){ var it0=pend[0], oc=at[it0.to];
      if(!pend.some(function(x){ return x.e===oc; })){ pend.shift(); fail(it0,{ ok:false, reason:"seat" }); return step(); }
      return one(oc,"").then(function(x){ if(x!==true){ pend.shift(); fail(it0,x); } return step(); }); }
    var it1=pend.splice(i,1)[0];
    if(it1.to===(cur[it1.e]||"")&&!(it1.to===""&&st[it1.e]==="매칭")){ res.done++; delete MT.ov[it1.e]; return step(); }
    return one(it1.e, it1.to).then(function(x){ if(x===true){ res.done++; delete MT.ov[it1.e]; } else fail(it1,x); return step(); });
  };
  return step().then(function(r){ mtSave(); return r; });
}
function mtOrdSave(){
  var M=mtCcM(), list=M.q.filter(function(r){ return r.status==="대기"; }).map(function(r){ return normE(r.emp); });
  return call("meet_order_set",{ prog:"cc", list:list.join(",") }).then(function(x){
    if(x&&x.ok){ list.forEach(function(e,i){ mtNotePatch("cc", e, { ord:i+1 }); }); MT.ordD=0; MT.ord=[]; mtSave(); }
    else if(!unknownSrv(x)) toast("대기 줄 순서를 저장하지 못했습니다 · "+why(x),{ bad:1 });
    return x; });
}

/* ── 7. 놓기 · 고르기 ── */
function mtDrop(p, k, to, before){
  if(p==="ln") return mtLnDrop(k, to);
  var M=mtCcM(), r=M.by[k]; if(!r) return;
  if(to==="q"&&!r._k){ var qs=M.q.map(function(x){ return jq(x.emp); }).filter(function(x){ return x!==k; }), at=before?qs.indexOf(before):-1; if(at<0) qs.push(k); else qs.splice(at,0,k); MT.ord=qs; MT.ordD=1; mtSave(); paint(); return; }
  if(MT.day) mtCcDayDrop(k, to); else mtCcDraftDrop(k, to, before);
}
function mtCcDayDrop(e, to){
  var M=mtCcM(), r=M.by[e]; if(!r) return; var from=r._k;
  if(r.status!=="대기"&&r.status!=="매칭"){ toast("왔음 · 끝 처리한 사람은 옮기지 않습니다",{ bad:1 }); return; }
  if(to==="q"){ if(from) ccSet(e,"대기"); return; }
  if(from===to) return;
  var o=M.at[to], ks=mtKp(to);
  if(o&&o.status!=="매칭"){ toast("그 칸 사람은 이미 왔음 · 끝입니다",{ bad:1 }); return; }
  var items=[{ e:e, to:to }]; if(o) items.push({ e:jq(o.emp), to:from||"" });
  confirmBox({ t:"바로 반영할까요?", who:(r.name||r.emp)+" → "+ks[0]+" · 테이블 "+ks[1], sub:"참가자 앱에 선정 알림"+(o?" · "+(o.name||o.emp)+" → "+(from?mtKp(from).join(" · 테이블 "):"대기 줄"):""), ok:"반영 · 알림 보내기",
    run:function(){ return mtCcRun(items).then(function(res){ return res.fail.length?{ ok:false, msg:res.fail.map(function(f){ return f.nm+" "+f.why; }).join(" · ") }:res; }); },
    done:function(){ paint(); reload(["cc","nb"]); toast("반영했습니다 · "+(r.name||r.emp)+" "+ks[0]+" "+ks[1]); } });
}
var MT_MVWHY={ taken:"그 칸은 다 찼습니다", seat:"그 미팅룸은 다른 사람 자리입니다", same:"지금과 같은 자리입니다", closed:"운영 시간 밖입니다", slot:"칸 시각이 맞지 않습니다" };
function mtLnDrop(id, to){
  var L=mtLnM(); if(!L) return; var x=L.by[id]; if(!x) return;
  if(to==="q"){ toast("라운지는 칸 미정으로 되돌리지 않습니다 · 다른 칸으로 옮깁니다"); return; }
  if(RV_ON.indexOf(x.st)<0){ toast("끝 · 노쇼 처리한 사람은 옮기지 않습니다",{ bad:1 }); return; }
  if(x._k===to) return;
  if(L.at[to]){ toast("빈 자리에 놓습니다 · 그 자리에는 "+(L.at[to].name||L.at[to].emp)+" 님",{ bad:1 }); return; }
  var ks=mtKp(to), was=x._k;
  confirmBox({ t:"이 칸으로 옮길까요?", who:(x.name||x.emp)+" · "+(was?mtKp(was).join(" · 미팅룸 "):"칸 미정")+" → "+ks[0]+" · 미팅룸 "+ks[1], sub:"바로 반영 · 참가자에게 알림 없음", ok:"옮기기",
    run:function(){ return call("resv_move",{ id:x.id, slot:ks[0], seat:ks[1], from:x.st }); },
    fail:function(r){ return r&&r.reason==="state"?"이미 "+(r.cur||"다른 상태")+" · 다시 받습니다":MT_MVWHY[r&&r.reason]||""; },
    done:function(){ mtLgbPut(x, to); paint(); reload(["lgb","resv","nb"]);
      toast((x.name||x.emp)+" · "+ks[0]+" 미팅룸 "+ks[1], was?{ undo:function(){ var w=mtKp(was); call("resv_move",{ id:x.id, slot:w[0], seat:w[1], from:x.st }).then(function(r){ reload(["lgb","resv"]); toast(r&&r.ok?"되돌렸습니다 · "+w[0]+" 미팅룸 "+w[1]:"되돌리지 못했습니다 · "+(MT_MVWHY[r&&r.reason]||why(r)),{ bad:!(r&&r.ok) }); }); } }:{}); } });
}
function mtLgbPut(x, to){ var d=S.data.lgb; if(!d||!d.cells) return; var ks=mtKp(to), id=String(x.id);
  d.cells.forEach(function(c){ c.seats=(c.seats||[]).map(function(y){ return y&&String(y.id)===id?null:y; }); });
  d.none=(d.none||[]).filter(function(y){ return String(y.id)!==id; }); d.over=(d.over||[]).filter(function(y){ return String(y.id)!==id; });
  var c=d.cells.filter(function(c){ return hm(c.from)===ks[0]; })[0]; if(c) c.seats[num(ks[1])-1]=x; }
function mtPickName(){ var pk=MT.pick; if(!pk) return ""; var x=pk.p==="cc"?ccRow(pk.k):(mtLnM()||{ by:{} }).by[pk.k]; return x?(x.name||x.emp):""; }
function mtPickOn(p, k){ MT.pick={ p:p, k:String(k) }; paint(); var b=el("mtgB"), f=b&&b.querySelector('.mtg-sl:not(.fill)'); if(f) f.focus(); }
function mtPickOff(){ MT.pick=null; paint(); }
/* 사람 상세 「옮기기」 = 고르기 · 서랍 닫고 시간표로 */
function mtMoveStart(p, k){ drwClose(); var s=mtSub(); if(s.v!=="board"||s.p!==p){ MT.pick=null; goSub(p); } mtPickOn(p, k); }

/* ── 8. 당일 단추(왔음 · 노쇼 · 종료) · 바로 · 되돌리기 7초 · 노쇼만 확인 창 ── */
function mtQuick(pr, okMsg, undo, after){ pr.then(function(x){ if(x&&x.ok){ after&&after(x); paint(); mtDetRe(); toast(okMsg(x),{ undo:undo }); } else toast("처리하지 못했습니다 · "+(x&&x.reason==="state"?"이미 "+(x.cur||"다른 상태"):why(x)),{ bad:1 }); }); }
function mtAct(p, k, a){
  if(p==="cc"){
    var r=ccRow(k); if(!r) return; var s=r.status, e=jq(r.emp);
    var set=function(to, from){ return call("cchat_status",{ emp:r.emp, status:to, from:from }); };
    var back=function(to, from){ return function(){ set(to, from).then(function(x){ if(x&&x.ok){ r.status=to; paint(); } toast(x&&x.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); reload(["cc"]); }); }; };
    if(a==="in"){ if(s!=="매칭"&&s!=="참석") return; var to=s==="참석"?"매칭":"참석";
      mtQuick(set(to, s), function(){ return (r.name||r.emp)+" · "+(to==="참석"?"왔음 · 출석만":"왔음 취소"); }, back(s, to), function(){ r.status=to; reload(["cc"]); }); }
    else if(a==="dn"){ if(s!=="매칭"&&s!=="참석") return;
      mtQuick(set("완료", s), function(){ return (r.name||r.emp)+" · 끝 · 프로그램 참여 1개"; }, back(s, "완료"), function(){ r.status="완료"; reload(["cc"]); }); }
    else if(a==="ns"){ if(s!=="매칭") return;
      confirmBox({ t:"노쇼로 처리할까요?", who:(r.name||r.emp)+" · "+hm(r.round)+" · 테이블 "+(r.table||""), sub:"칸이 빕니다 · 대기 줄에서 다음 사람을 끌어 놓습니다 · 스탬프 없음", ok:"노쇼", danger:1,
        run:function(){ return call("staff_mark",{ prog:"cchat", emp:r.emp, mark:"noshow" }).then(function(){ return call("cchat_status",{ emp:r.emp, status:"취소", from:"매칭", why:"노쇼" }); }); },
        done:function(){ MT.ns[e]=1; r.status="취소"; paint(); mtDetRe(); reload(["cc","nb"]);
          toast((r.name||r.emp)+" · 노쇼 · 칸 비움",{ undo:function(){ set("매칭","취소").then(function(x){ if(x&&x.ok){ delete MT.ns[e]; r.status="매칭"; call("staff_mark",{ prog:"cchat", emp:r.emp, mark:"clear" }); paint(); } toast(x&&x.ok?"되돌렸습니다 · 다시 배정":"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); reload(["cc"]); }); } }); } });
    }
    return;
  }
  var L=mtLnM(), x=L&&L.by[k]; if(!x) return; var s2=x.st;
  var rs=function(to, from){ return call("resv_set",{ id:x.id, status:to, from:from }); };
  var bk=function(to, from){ return function(){ rs(to, from).then(function(y){ if(y&&y.ok){ x.st=to; paint(); } toast(y&&y.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(y),{ bad:!(y&&y.ok) }); reload(["lgb","resv"]); }); }; };
  if(a==="in"){ if(RV_ON.indexOf(s2)<0) return; var t2=s2==="체크인"?"승인":"체크인";
    mtQuick(rs(t2, s2), function(){ return (x.name||x.emp)+" · "+(t2==="체크인"?"왔음 · 출석만":"왔음 취소"); }, bk(s2, t2), function(){ x.st=t2; reload(["lgb","resv"]); }); }
  else if(a==="dn"){ if(RV_ON.indexOf(s2)<0) return;
    mtQuick(rs("완료", s2), function(){ return (x.name||x.emp)+" · 끝 · 프로그램 참여 2개"; }, bk(s2, "완료"), function(){ x.st="완료"; reload(["lgb","resv","nb"]); }); }
  else if(a==="ns"){ if(RV_ON.indexOf(s2)<0) return;
    confirmBox({ t:"노쇼로 처리할까요?", who:(x.name||x.emp)+" · "+(x._k?mtKp(x._k).join(" · 미팅룸 "):""), sub:"자리는 그대로 · 스탬프 없음", ok:"노쇼", danger:1,
      run:function(){ return rs("노쇼", s2); }, done:function(){ x.st="노쇼"; paint(); mtDetRe(); reload(["lgb","resv","nb"]); toast((x.name||x.emp)+" · 노쇼",{ undo:bk(s2,"노쇼") }); } }); }
}

/* ── 9. 사람 상세(공통 서랍 drwOpen) · 원문 · 운영자 메모 · 기록 ── */
function mtDetRow(){ var D=MT.det; if(!D) return null;
  if(D.p==="cc") return ccRow(D.k);
  var L=mtLnM(), x=L&&L.by[D.k], r=typeof rvRow==="function"?rvRow(D.k):null;
  if(!x&&!r) return null; return { id:D.k, emp:(x||r).emp, name:(x||r).name, dept:(x||r).dept, st:x?x.st:r.status, k:x?x._k:"", ts:r?r.ts:"", memo:r?r.memo:(x.memo||"") }; }
function mtOpen(p, k, g){ MT.det={ p:p, k:String(k), g:g||null }; MT.memo=null; mtDetRe(true); mtLogLoad(); }
function mtDetRe(first){
  var D=MT.det; if(!D) return;
  if(!first&&DRW.k!=="meet:"+D.p+":"+D.k){ MT.det=null; return; }
  var me=el("mtMemo"); if(me&&!first) MT.memo=me.value;
  var x=mtDetRow(); if(!x){ if(!first) drwClose(); return; }
  var cc=D.p==="cc", emp=normE(x.emp), nOk=mtNoteOk(D.p), n=mtNote(D.p, emp), k, st, h;
  if(cc){ k=mtSrvK(x); st=x.status; }
  else { k=x.k; st=x.st; }
  var stTag=cc?ccTagH(x):tag(lnView({ status:st }), RV_TAG[st]);
  h=drwHead(x.name||x.emp, [x.dept,"사번 "+x.emp,x.ts?"신청 "+fmtD(x.ts):""].filter(Boolean).join(" · "), ' '+stTag+(k?' '+tag(mtKp(k)[0]+" · "+(cc?"테이블 ":"미팅룸 ")+mtKp(k)[1],"off"):''));
  if(cc){
    h+='<div class="fld cc-fld">상담 내용 · 원문</div><div class="mtg-orig">'+(x.text?esc(x.text):'<span class="cap">'+esc(x.tag?"관심 "+x.tag+" · 글 없음":"글 없음")+'</span>')+'</div>';
    h+='<dl class="cc-kv"><dt>희망 시간</dt><dd>'+esc(ccPrefTx(x))+'</dd><dt>배정</dt><dd>'+(k?esc(mtKp(k).join(" · 테이블 ")):"대기 줄"+(mtQno(x)?" "+mtQno(x)+"번":""))+'</dd><dt>스탬프</dt><dd>아이디어 한 줄 · 신청 때 · 프로그램 참여 1개 · '+(st==="완료"?"받음":"상담 끝나면")+'</dd></dl>';
  } else {
    h+='<dl class="cc-kv"><dt>시간</dt><dd>'+(k?esc(mtKp(k)[0]):"칸 미정")+'</dd><dt>미팅룸</dt><dd>'+(k?esc(mtKp(k)[1]):"-")+'</dd><dt>명단</dt><dd>'+(/^사전 명단/.test(x.memo||"")?"사전 명단":esc(x.memo||"사전 명단"))+'</dd><dt>스탬프</dt><dd>프로그램 참여 2개 · '+(st==="완료"?"받음":"상담 끝나면")+'</dd></dl>';
  }
  if(nOk) h+='<div class="fld">운영자 메모 <span class="cap">참가자에게 보이지 않음 · 500자</span></div><textarea class="mtg-memo" id="mtMemo" maxlength="500" aria-label="운영자 메모">'+esc(MT.memo!=null?MT.memo:(n&&n.memo||""))+'</textarea>'+
    '<div class="btns mt"><span class="cap" style="flex:1;align-self:center">'+(n&&n.at?esc((n.by||"")+" · "+fmtD(n.at)+" 저장"):"")+'</span><button class="btn sm pri" type="button" id="mtMemoGo" onclick="mtMemoSave()">메모 저장</button></div>';
  /* 단추 */
  var b=[], e=jq(cc?x.emp:D.k), act=function(a,lab,cls){ return '<button class="btn '+(cls||"")+'" type="button" onclick="mtAct(\''+D.p+'\',\''+e+'\',\''+a+'\')">'+lab+'</button>'; };
  if(cc){
    if(st==="대기"||st==="매칭") b.push('<button class="btn" type="button" onclick="mtMoveStart(\'cc\',\''+e+'\')">옮기기</button>');
    if(st==="매칭"&&MT.day){ b.push(act("in","왔음")); b.push(act("dn","종료")); b.push(act("ns","노쇼","dng")); }
    else if(st==="참석"&&MT.day){ b.push(act("dn","종료","pri")); b.push(act("in","왔음 취소")); }
    if(st==="매칭") b.push(MT.day?'<button class="btn" type="button" onclick="ccSet(\''+e+'\',\'대기\')">대기 줄로</button>':'<button class="btn" type="button" onclick="mtCcDraftDrop(\''+e+'\',\'q\');mtDetRe()">대기 줄로(초안)</button>');
    if(st==="완료") b.push('<button class="btn" type="button" onclick="ccSet(\''+e+'\',\'참석\')">끝 되돌리기</button>');
    if(st==="참석"&&!MT.day) b.push('<button class="btn" type="button" onclick="ccSet(\''+e+'\',\'매칭\')">왔음 취소</button>');
    if(st==="취소") b.push('<button class="btn" type="button" onclick="ccSet(\''+e+'\',\'대기\')">신청 되살리기</button>');
    else if(st==="대기"||st==="매칭") b.push('<button class="btn dng" type="button" onclick="ccSet(\''+e+'\',\'취소\')">신청 취소</button>');
  } else {
    var id=jq(D.k), rv=function(to,lab,cls){ return '<button class="btn '+(cls||"")+'" type="button" onclick="rvAsk(\''+id+'\',\''+to+'\')">'+lab+'</button>'; }, hasR=typeof rvRow==="function"&&!!rvRow(D.k);
    if(RV_ON.indexOf(st)>=0) b.push('<button class="btn" type="button" onclick="mtMoveStart(\'ln\',\''+id+'\')">옮기기</button>');
    if(hasR){ if(RV_ON.indexOf(st)>=0&&st!=="체크인") b.push(rv("체크인","왔음")); if(RV_ON.indexOf(st)>=0) b.push(rv("완료","종료")); if(st==="체크인") b.push(rv("승인","왔음 취소"));
      if(RV_ON.indexOf(st)>=0) b.push(rv("노쇼","노쇼","dng")); if(st==="완료") b.push(rv("체크인","끝 되돌리기")); if(st==="노쇼") b.push(rv("승인","노쇼 되돌리기")); }
  }
  if(b.length) h+='<div class="btns mt">'+b.join("")+'</div>';
  h+='<div class="fld mt">기록</div><div class="mtg-log" id="mtLog">'+mtLogH(emp)+'</div></div>';
  drwOpen("meet:"+D.p+":"+D.k, h, { g:D.g, wide:1, label:"사람 상세", close:function(){ MT.det=null; MT.memo=null; } });
}
function mtLogLoad(){ var x=mtDetRow(); if(!x) return; var e=normE(x.emp);
  call("act_log",{ emp:e, day:"all", n:30 }).then(function(r){ MT.log[e]=r; var b=el("mtLog"), y=mtDetRow(); if(b&&y&&normE(y.emp)===e) b.innerHTML=mtLogH(e); }); }
function mtLogH(e){ var x=MT.log[e]; if(!x) return '<span class="cap">불러오는 중</span>'; if(unknownSrv(x)) return '<span class="cap">서버 갱신 뒤</span>';
  if(!x.ok) return '<span class="cap">받지 못했습니다 · '+esc(why(x))+'</span>';
  var rows=(x.rows||[]).slice(0,20); if(!rows.length) return '<span class="cap">기록 없음</span>';
  return rows.map(function(r){ return '<div><span>'+esc(fmtD(r.t))+'</span>'+esc(String(r.x||r.verb||"").replace(/상담석/g,"미팅룸")+(r.byName?" · "+r.byName:""))+'</div>'; }).join(""); }
function mtMemoSave(){
  var D=MT.det, x=mtDetRow(), t=el("mtMemo"), go=el("mtMemoGo"); if(!D||!x||!t) return; var e=normE(x.emp), n=mtNote(D.p, e), v=t.value.slice(0,500);
  if(go){ go.setAttribute("aria-disabled","true"); go.textContent="저장 중"; }
  call("meet_note_set",{ prog:D.p, emp:e, memo:v, at:n&&n.at||"" }).then(function(r){
    if(r&&r.ok){ mtNotePatch(D.p, e, { memo:r.memo!=null?r.memo:v, by:r.by||"", at:r.at||"" }); MT.memo=null; paint(); mtDetRe(); toast("메모를 저장했습니다 · "+(x.name||e)); return; }
    if(go){ go.removeAttribute("aria-disabled"); go.textContent="메모 저장"; }
    if(r&&r.reason==="changed"){ toast("다른 곳에서 먼저 고쳤습니다 · 다시 받은 뒤 저장합니다",{ bad:1 }); reload([D.p==="cc"?"mnc":"mnl"]); }
    else toast("저장하지 못했습니다 · "+(r&&r.reason==="long"?"500자까지":why(r)),{ bad:1 }); });
}
/* ── 10. 아이디어 = 신청 글 명단(공통 표 XG · 사용자 261016 밤 「무슨 아이디어를 냈는지 쫙 보여야」) · 분류 없음 ──
 * 본문 = cchat_list text(아이디어 시트 경로 cchat 전문 · 없으면 커피챗 시트 글 칸) · 줄바꿈해 전문 · 엑셀도 전문 */
var MT_IST={ "대기":"대기", "매칭":"선정", "참석":"참석", "완료":"완료", "취소":"취소" };
var MTI={ g:null };
function mtIdeaPaint(){
  var box=el("mtIb"); if(!box) return;
  var gt=dataGate("cc","커피챗 명단"), rows=gt?[]:ccRows(), seq={};
  rows.slice().sort(function(a,b){ return String(a.ts).localeCompare(String(b.ts)); }).forEach(function(r,i){ seq[jq(r.emp)]=i+1; });
  var st=function(r){ return MT_IST[r.status]||r.status||""; };
  if(!MTI.g) MTI.g=XG.make({ id:"mtidea", file:"18F 커피챗 아이디어", key:function(r){ return jq(r.emp); }, sort:{ k:"no", d:1 }, find:["emp"],
    onRow:function(k){ mtOpen("cc", k, MTI.g); },
    chips:[["all","전체",null]].concat(["대기","선정","참석","완료","취소"].map(function(t){ return [t,t,function(r){ return st(r)===t; }]; })),
    cols:[{ k:"no", t:"순번", type:"num", w:56, v:function(r){ return seq[jq(r.emp)]||""; } },{ k:"ts", t:"신청 시각", type:"date", w:96 },{ k:"name", t:"이름", w:80 },{ k:"dept", t:"부서", w:120 },
      { k:"text", t:"아이디어 한 줄", w:460, v:function(r){ return r.text||r.tag||""; }, f:function(r){ var t=r.text||r.tag||""; return t?'<div class="mtg-full">'+esc(t)+'</div>':'<span class="cap">글 없음</span>'; } },
      { k:"pref", t:"희망 시간", w:130, v:ccPrefTx, f:function(r){ return '<div class="mtg-full">'+esc(ccPrefTx(r))+'</div>'; } },
      { k:"st", t:"상태", w:64, v:st, f:function(r){ var t=st(r); return tag(t, t==="대기"?"warn":t==="참석"||t==="완료"?"ok":t==="취소"?"off":""); } },
      { k:"seat", t:"배정", w:84, v:function(r){ return CC_ON.indexOf(r.status)>=0&&r.round?hm(r.round)+" · "+(r.table||""):""; } },
      { k:"memo", t:"메모", w:180, v:function(r){ var n=mtNote("cc", r.emp); return n&&n.memo||""; }, f:function(r){ var n=mtNote("cc", r.emp); return n&&n.memo?'<div class="mtg-full">'+esc(n.memo)+'</div>':""; } }],
    src:{ a:"cchat_list", p:{} }, empty:"아직 신청 글이 없습니다", h:640 });
  MTI.g.gate=gt||""; XG.set(MTI.g, gt?null:rows, box);
}

/* ── 11. 끌어다 놓기(포인터 · 마우스 6px · 터치 길게 누르기) · 클릭 · 키보드 ── */
function mtDragOn(d, x, y){
  d.on=true; var r=d.c.getBoundingClientRect(); d.dx=x-r.left; d.dy=y-r.top;
  d.g=d.c.cloneNode(true); d.g.classList.add("ghost"); d.g.classList.remove("pick"); d.g.style.width=r.width+"px"; d.g.removeAttribute("tabindex"); d.g.setAttribute("aria-hidden","true");
  document.body.appendChild(d.g); d.c.classList.add("lift"); mtDragMove(d, x, y);
}
function mtDragMove(d, x, y){
  d.g.style.transform="translate("+Math.round(x-d.dx)+"px,"+Math.round(y-d.dy)+"px) rotate(-1deg)";
  var t=document.elementFromPoint(x, y), z=t&&t.closest&&t.closest("#mtgB [data-drop]");
  if(d.over&&d.over!==z) d.over.classList.remove("over"); if(z) z.classList.add("over"); d.over=z; d.lx=x; d.ly=y;
  var m=el("main"), b=m.getBoundingClientRect(); if(y<b.top+40) m.scrollTop-=12; else if(y>b.bottom-40) m.scrollTop+=12;
  var ql=z&&z.getAttribute("data-drop")==="q"?z:null; if(ql&&ql.scrollHeight>ql.clientHeight){ var qb=ql.getBoundingClientRect(); if(y<qb.top+36) ql.scrollTop-=10; else if(y>qb.bottom-36) ql.scrollTop+=10; }   /* 대기 줄이 길면 끝에서 저절로 넘김 */
}
function mtDragOff(d){ if(d.g) d.g.remove(); d.c.classList.remove("lift"); if(d.over) d.over.classList.remove("over"); }
function mtDropAt(d){
  var z=d.over, to=z.getAttribute("data-drop"), before=null;
  if(to==="q"){ var cs=[].slice.call(z.querySelectorAll(".mtg-pc")).filter(function(c){ return c.getAttribute("data-k")!==d.k; }), horiz=getComputedStyle(z).flexDirection==="row";
    for(var i=0;i<cs.length;i++){ var r=cs[i].getBoundingClientRect(); if(horiz?d.lx<r.left+r.width/2:d.ly<r.top+r.height/2){ before=cs[i].getAttribute("data-k"); break; } } }
  mtDrop(d.p, d.k, to, before);
}
document.addEventListener("pointerdown",function(ev){
  if(S.tab!=="meet"||ev.button!==0||MT.pick) return;
  if(ev.target.closest(".acts")) return;
  var c=ev.target.closest(".mtg-pc"); if(!c||!c.closest("#mtgB")||c.classList.contains("lock")) return;
  var d=MTD={ c:c, p:c.getAttribute("data-p"), k:c.getAttribute("data-k"), x:ev.clientX, y:ev.clientY, on:false, touch:ev.pointerType==="touch", over:null };
  if(d.touch) d.tm=setTimeout(function(){ if(MTD===d&&!d.on){ mtDragOn(d, d.x, d.y); if(navigator.vibrate) try{ navigator.vibrate(10); }catch(e){} } },320);
});
document.addEventListener("pointermove",function(ev){
  var d=MTD; if(!d) return;
  if(!d.on){ var mv=Math.abs(ev.clientX-d.x)+Math.abs(ev.clientY-d.y); if(d.touch){ if(mv>8){ clearTimeout(d.tm); MTD=null; } return; } if(mv<6) return; mtDragOn(d, ev.clientX, ev.clientY); }
  ev.preventDefault(); mtDragMove(d, ev.clientX, ev.clientY);
},{ passive:false });
document.addEventListener("touchmove",function(ev){ if(MTD&&MTD.on) ev.preventDefault(); },{ passive:false });
document.addEventListener("pointerup",function(){ var d=MTD; if(!d) return; MTD=null; clearTimeout(d.tm); if(!d.on) return;
  mtDragOff(d); MT.jd=Date.now(); var b=el("mtgB"); if(b) b._h=""; if(d.over) mtDropAt(d); else paint(); });
document.addEventListener("pointercancel",function(){ var d=MTD; MTD=null; if(!d) return; clearTimeout(d.tm); if(d.on){ mtDragOff(d); var b=el("mtgB"); if(b) b._h=""; paint(); } });
document.addEventListener("contextmenu",function(ev){ if(MTD&&MTD.touch) ev.preventDefault(); });
function mtPickDrop(z, c2){ var pk=MT.pick; if(!pk) return; if(c2&&c2.getAttribute("data-k")===pk.k){ mtPickOff(); return; }
  var to=z.getAttribute("data-drop"); MT.pick=null; mtDrop(pk.p, pk.k, to, to==="q"&&c2?c2.getAttribute("data-k"):null); paint(); }
document.addEventListener("click",function(ev){
  if(S.tab!=="meet"||!ev.target.closest) return; var root=ev.target.closest("#mtgB"); if(!root) return;
  if(Date.now()-MT.jd<350) return;
  var b=ev.target.closest(".mtg-pc .acts button"); if(b){ var c=b.closest(".mtg-pc"); mtAct(c.getAttribute("data-p"), c.getAttribute("data-k"), b.getAttribute("data-a")); return; }
  var c2=ev.target.closest(".mtg-pc");
  if(MT.pick){ var z=ev.target.closest("[data-drop]"); if(z) mtPickDrop(z, c2); return; }
  if(c2) mtOpen(c2.getAttribute("data-p"), c2.getAttribute("data-k"));
});
document.addEventListener("keydown",function(ev){
  if(S.tab!=="meet"||DLG.o) return;
  if(ev.key==="Escape"&&MT.pick){ ev.preventDefault(); ev.stopPropagation(); mtPickOff(); return; }
  var t=ev.target; if(!t||!t.closest||!t.closest("#mtgB")) return;
  if(ev.key!=="Enter"&&ev.key!==" ") return;
  if(t.closest(".acts")) return;
  if(MT.pick){ var z=t.closest("[data-drop]"); if(z){ ev.preventDefault(); mtPickDrop(z, t.closest(".mtg-pc")); } return; }
  if(t.classList.contains("mtg-pc")){ ev.preventDefault(); if(ev.key==="Enter"||t.classList.contains("lock")) mtOpen(t.getAttribute("data-p"), t.getAttribute("data-k")); else mtPickOn(t.getAttribute("data-p"), t.getAttribute("data-k")); }
}, true);
