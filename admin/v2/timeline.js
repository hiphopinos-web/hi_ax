/* AXF CONTROL v2 · 설정 › 시간순 보기 (261022 단순판 · 사용자 「정보가 너무 많고 자세해서 보고 싶은 마음이 없다 · 날짜 구분이 없다」)
 * 날짜 머리(오늘 알약) 아래 「시각 + 무슨 일」 한 줄 · 줄을 누르면 관련 화면으로 이동(›) · 상태는 오른쪽 알약 하나 · 지난 날짜는 「지난 일정 n개」로 접음 · 행사일은 「지금」 선
 * 날짜 범위 = 오픈_1차 날짜 ~ 행사일 다음 날(클로즈) · 시각은 설정 · 예약 · 출석 표 · 추첨 상태에서 읽음(하드코딩 없음)
 * 데이터 = 읽기만: cfg_list · sched_list · push_stats · att_list · draw_stats · now_board · 이 화면이 새로 쓰는 액션 없음 */
var TL={ chk:false, past:false, memo:false };
var TL_DEF={ draw:"16:40-17:25" };   /* 서버 DRAW_WIN_DEFAULT 와 같다(draw_stats 가 없을 때만) */
function tlD(k){ return S.data[k]&&S.data[k].ok?S.data[k]:null; }
function tlC(k){ var d=tlD("cfgl"); if(!d) return null; return (d.rows||[]).filter(function(r){ return r.k===k; })[0]||null; }
function tlV(k, dflt){ var r=tlC(k); return r&&String(r.v).trim()!==""?String(r.v).trim():dflt; }
function tlM(hm){ var m=String(hm||"").match(/(\d{1,2}):(\d{2})/); return m?Number(m[1])*60+Number(m[2]):null; }
function tlHM(n){ if(n==null) return ""; var x=Math.max(0,n), h=Math.floor(x/60), m=x%60; return (h<10?"0":"")+h+":"+(m<10?"0":"")+m; }
function tlWin(v){ var m=String(v||"").replace(/\s/g,"").match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/); return m?[m[1],m[2]]:null; }
function tlPair(v){ var m=String(v||"").match(/^\s*(\d+)\s*,\s*(\d+)\s*$/); return m?[Number(m[1]),Number(m[2])]:null; }
function tlEv(){ var b=S.data.nb; return (b&&b.ev)||"2026-10-26"; }
function tlToday(){ var b=S.data.nb; if(b&&b.day) return b.day; var t=srvNow(); return t.getFullYear()+"-"+("0"+(t.getMonth()+1)).slice(-2)+"-"+("0"+t.getDate()).slice(-2); }
function tlMD(d){ var m=String(d||"").match(/^\d{4}-(\d{2})-(\d{2})/); return m?Number(m[1])+"/"+Number(m[2]):String(d||""); }
/* 설정 한 칸 점검 · ty = hm | win | dt | pair · o.empty = 비어 있을 때 뜻(경고 아님) · o.noDiff = 기본값과 달라도 경고 안 함 */
function tlChk(k, ty, o){ o=o||{}; var r=tlC(k), w=[], RX={ hm:/^\d{1,2}:\d{2}$/, win:/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/, dt:/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/, pair:/^\d+,\d+$/ };
  if(!tlD("cfgl")) return w;
  if(!r){ if(!o.empty) w.push("설정값 없음 · 기본값 "+(o.def||"-")+"으로 돎"); return w; }
  var v=String(r.v==null?"":r.v).trim(); if(ty!=="dt") v=v.replace(/\s/g,"");
  if(v===""){ if(!o.empty) w.push("값이 비어 있음 · 기본값 "+(r.def||o.def||"-")+"으로 돎"); return w; }
  if(RX[ty]&&!RX[ty].test(v)) w.push("형식이 틀림 · 「"+r.v+"」 · 서버는 기본값으로 돎");
  if(ty==="dt"&&!o.anyDay&&RX.dt.test(v)&&v.slice(0,10)!==tlEv()) w.push("날짜가 행사일과 다름 · "+r.v);
  if(!o.noDiff&&r.def!=null&&String(r.def)!==""&&String(r.v)!==String(r.def)) w.push("기본값과 다름 · 기본 "+r.def+""+(o.back?" · "+o.back:""));
  return w; }
/* 시간순 보기 › 화면 안 칸으로 이동 · 칸이 그려지면 가운데로 스크롤 · 1.6초 테두리 · 동작 줄이기면 즉시 · 그 사이 칸을 다시 그려도 강조 유지
 * 추첨 설정 › 17F 입구 체크인(drawset.js #dwsCl) · 행운권 › 럭키드로우 › 2. 체크인(lkui.js #lkuCk) */
function tlJump(tab, sub, id, ok){ var n=0, rm=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches; go(tab,sub);
  var hi=function(until){ var c=el(id), on=Date.now()<until; if(c){ if(id==="dwsCl") c.classList.toggle("tl-hi",on); else { c.style.outline=on?"2px solid var(--navy)":""; c.style.outlineOffset=on?"2px":""; c.style.boxShadow=on?"0 0 0 4px var(--navy1)":""; c.style.borderRadius=on?"8px":""; } } if(on) setTimeout(function(){ hi(until); },200); };
  var tick=function(){ var c=el(id); if(c&&ok(c)&&tlD("draw")){ setTimeout(function(){ var c2=el(id); if(!c2) return; c2.scrollIntoView({ block:"center", behavior:rm?"auto":"smooth" }); hi(Date.now()+1600); },rm?0:80); return; } if(++n<60&&S.tab===tab) setTimeout(tick,100); };
  setTimeout(tick,30); }
function tlDrawSet(){ tlJump("stage","set","dwsCl",function(c){ return !!c.querySelector("h2"); }); }
function tlDrawCk(){ tlJump("stage","lk","lkuCk",function(c){ return !c.querySelector(".skel"); }); }
function tlCfg(k){ var r=tlC(k), q=(r&&r.n)||k, n=0; go("log","cfg");   /* 운영 설정 표 = 이름으로 찾고 그 줄 상세를 연다(표 검색은 이름 · 설명만 본다) */
  var tick=function(){ var g=MG.cfgv; if(g&&lgSub()==="cfg"){ if(g.q!==q){ g.q=q; var i=document.querySelector("#mg_cfgv .xg-q"); if(i) i.value=q; XG.paint(g); } if((g.rows||[]).length){ rowDetail(g,k,{ title:function(x){ return x.k; } }); return; } } if(++n<40&&S.tab==="log") setTimeout(tick,100); };
  setTimeout(tick,30); }
/* ───── 261022 단순판 · 날짜 머리 아래 「시각 + 무슨 일」 한 줄 · 줄을 누르면 관련 화면으로(›) · 지난 날짜 접힘 · 행사일 「지금」 선 ─────
 * 줄 = { d 날짜, t 시각, ti 제목, js 이동, pill 짧은 상태 { t, w }, auto 자동 알약 } · 설정 점검 글은 맨 위 「확인할 것 n개」 로만 */
function tlDT(v){ var m=String(v||"").match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})/); return m?{ d:m[1], t:hm(m[2]) }:null; }
function tlDay(d, n){ var m=String(d||"").match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return ""; var x=new Date(Number(m[1]),Number(m[2])-1,Number(m[3])+(n||0)); return x.getFullYear()+"-"+("0"+(x.getMonth()+1)).slice(-2)+"-"+("0"+x.getDate()).slice(-2); }
function tlDayH(d){ var m=String(d||"").match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return d; var wd="일월화수목금토".charAt(new Date(Number(m[1]),Number(m[2])-1,Number(m[3])).getDay()); return Number(m[2])+"월 "+Number(m[3])+"일 ("+wd+")"; }
/* 17F 추첨 체크인 줄 상태 · 받는 중 · 마감만 · dsCk(dstart.js)가 있을 때만 부름 */
function tlDrawPill(dr){ if(!dr) return null;
  if(dr.closed) return { t:"마감" };
  var c=typeof dsCk==="function"?dsCk(dr,null,num(dr["in"])):null;
  return c&&c.k==="open"?{ t:"받는 중" }:null; }
function tlRows(){
  var R=[], ev=tlEv(), pst=tlD("pst"), sch=tlD("sched"), al=tlD("qal"), dr=tlD("draw"), W=[];
  var add=function(d, t, ti, js, x){ x=x||{}; R.push({ d:d||ev, t:hm(t)||String(t||""), ti:ti, js:js||"", pill:x.pill||null, auto:!!x.auto }); if(x.w&&x.w.length) x.w.forEach(function(w){ if(w) W.push({ ti:ti, w:w, js:x.cfg?"tlCfg('"+jq(x.cfg)+"')":(js||"") }); }); };
  var cfgW=function(k, ty, o){ return tlChk(k,ty,Object.assign({ noDiff:1, anyDay:1 },o||{})); };
  var at=function(k, dflt){ var v=tlV(k,dflt), x=tlDT(v); return x?x:{ d:ev, t:hm(v)||String(dflt||"") }; };
  /* 오픈 · 옷 사이즈 */
  var t1=tlDT(tlV("오픈_1차","2026-10-19 00:00")), t2=tlDT(tlV("오픈_2차","2026-10-22 00:00")), sc=tlV("오픈_범위","자동"), door=tlV("오픈_문","ON").toUpperCase();
  var ow1=cfgW("오픈_1차","dt"), ow2=cfgW("오픈_2차","dt"), op=null;
  if(sc==="클로즈베타"||sc==="사전신청"||sc==="종료") op={ t:sc==="종료"?"행사 종료":sc==="사전신청"?"사전 신청자만":"클로즈 베타", w:1 };
  if(door==="OFF") op={ t:"문 닫힘", w:1 };
  if(t1) add(t1.d,t1.t,"앱 오픈 · 사전 신청자 · 스태프","go('log','urgent')",{ w:ow1, cfg:"오픈_1차" });
  if(t2) add(t2.d,t2.t,"앱 오픈 · 전 구성원","go('log','urgent')",{ pill:op, w:ow2, cfg:"오픈_2차" });
  var kc=at("키트사이즈_마감","2026-10-21 18:00"), kg=at("키트사이즈_변경마감","2026-10-23 18:00");
  add(kc.d,kc.t,"옷 사이즈 선택 마감","go('prize','main')",{ w:cfgW("키트사이즈_마감","dt"), cfg:"키트사이즈_마감" });
  if(kg.d!==kc.d||kg.t!==kc.t) add(kg.d,kg.t,"옷 사이즈 변경 마감","go('prize','main')",{ w:cfgW("키트사이즈_변경마감","dt"), cfg:"키트사이즈_변경마감" });
  /* 행사일 */
  var fcOn=tlV("선착순_사용","ON").toUpperCase()!=="OFF";
  add(ev,tlV("선착순_지급시작","10:30"),"선착순 참여상 지급 시작","go('ckin','fc')",{ pill:fcOn?null:{ t:"꺼짐", w:1 }, w:cfgW("선착순_지급시작","hm"), cfg:"선착순_지급시작" });
  if(al){ (al.progs||[]).forEach(function(p,i,a){ if(p.id==="road") return; add(ev,p.s,"17F "+p.n,"go('people','att')"); });
    var s10=(al.progs10||[]).map(function(p){ return p.s; }).sort()[0]; if(s10) add(ev,s10,"10F 실습 시작","go('people','att')"); }
  add(ev,tlV("설문_시작","14:30"),"설문 열림","go('log','sv')",{ w:cfgW("설문_시작","hm"), cfg:"설문_시작" });
  var dwv=(dr&&dr.win)||tlV("추첨_창",TL_DEF.draw), dw=tlWin(dwv)||tlWin(TL_DEF.draw), dd=(dr&&dr.day)||ev;
  add(dd,dw[0],"17F 추첨 체크인 받기 시작","tlDrawCk()",{ pill:tlDrawPill(dr), w:dr?[]:["추첨 상태를 읽지 못함"] });
  add(dd,"17:13","17F 추첨 체크인 마감","tlDrawSet()");
  var cl=function(k, ti, js){ var x=at(k,"17:00"); add(x.d,x.t,ti,js,{ auto:1, w:cfgW(k,"dt"), cfg:k }); };
  cl("선착순_마감","선착순 참여상 마감","go('ckin','fc')");
  /* 직접 보내는 알림 예약만 */
  var pOn=pst?!!pst.on:null;
  if(pst&&!pOn) W.push({ ti:"푸시 알림", w:"푸시 꺼짐 · 행사일 알림이 나가지 않음", js:"go('notify','send')" });
  if(pst&&pst.dateOk===0) W.push({ ti:"푸시 알림", w:"푸시 허용 날짜가 지남 · 앱이 구독을 스스로 해제", js:"go('notify','send')" });
  if(sch){ (sch.rows||[]).filter(function(r){ return r.st!=="취소"&&(r.kind==="notice"||r.kind==="outro"); }).forEach(function(r){
      var x=tlDT(r.at); if(!x) return; var kn=SCH_K[r.kind]||r.kind, p=null;
      if(r.st==="대기"&&pst&&!pOn) p={ t:"푸시 꺼짐", w:1 }; else if(r.st==="지남"||r.st==="오류") p={ t:r.st, w:1 }; else if(r.st==="꺼짐"||r.st==="완료") p={ t:r.st };
      add(x.d,x.t,"알림 · "+String(r.title||kn),"go('notify','sched')",{ pill:p }); }); }
  /* 끝 · 클로즈 */
  /* 17F Closing Speech 17:00 · 행사 종료 17:30 = 설정 값이 없는 고정 안내(프로그램 정본 · att_list 에 없음) */
  add(ev,"17:00","17F Closing Speech","go('stage','draw')");
  add(ev,"17:30","행사 종료","");
  add(tlDay(ev,1),"23:59","클로즈 · 오픈 범위 「행사 종료」로 바꿈","go('log','urgent')");
  var lo=t1?t1.d:"";   /* 범위 = 사전 오픈 날짜부터 */
  R=R.filter(function(r){ return !lo||r.d>=lo; });
  R.sort(function(a,b){ return a.d<b.d?-1:a.d>b.d?1:tlM(a.t)-tlM(b.t); });
  R.warns=W; return R;
}
function tlRowH(r){
  var p=r.pill?'<span class="tag'+(r.pill.w?" warn":" off")+' tl-pl">'+esc(r.pill.t)+'</span>':"", au=r.auto?'<span class="tag off tl-pl">자동</span>':"";
  var h='<span class="tl-tm n">'+esc(r.t)+'</span><span class="tl-ti">'+esc(r.ti)+'</span>'+au+p+(r.js?'<span class="tl-go" aria-hidden="true">›</span>':'');
  return r.js?'<button type="button" class="tl-row go" onclick="'+r.js+'">'+h+'</button>':'<div class="tl-row">'+h+'</div>'; }
function tlPaint(){
  var b=el("tlBox"); if(!b) return;
  if(!tlD("cfgl")){ b.innerHTML=S.err.cfgl?emptyH("운영 설정을 불러오지 못했습니다 · "+S.err.cfgl):emptyH("불러오는 중"); return; }
  var R=tlRows(), ev=tlEv(), td=tlToday(), nowM=null;
  if(td===ev){ var t=srvNow(); nowM=t.getHours()*60+t.getMinutes(); }
  var days=[]; R.forEach(function(r){ var g=days.length&&days[days.length-1].d===r.d?days[days.length-1]:null; if(!g){ g={ d:r.d, rows:[] }; days.push(g); } g.rows.push(r); });
  if(!days.some(function(g){ return g.d===td; })&&days.length&&td>days[0].d&&td<days[days.length-1].d){ days.push({ d:td, rows:[] }); days.sort(function(a,b){ return a.d<b.d?-1:1; }); }
  var past=days.filter(function(g){ return g.d<td; }), cur=days.filter(function(g){ return g.d>=td; }), pn=past.reduce(function(n,g){ return n+g.rows.length; },0);
  var dayH=function(g){ var nowDone=g.d!==td||nowM==null, h='<div class="tl-dh"><b>'+esc(tlDayH(g.d))+'</b>'+(g.d===td?'<span class="tag tl-today">오늘</span>':'')+'</div><div class="card tl-list">';
    if(!g.rows.length) h+='<div class="tl-none">일정 없음</div>';
    g.rows.forEach(function(r){ if(!nowDone&&tlM(r.t)>=nowM){ h+='<div class="tl-now" role="separator"><span class="tl-nl">지금 '+tlHM(nowM)+'</span></div>'; nowDone=true; } h+=tlRowH(r); });
    if(!nowDone) h+='<div class="tl-now" role="separator"><span class="tl-nl">지금 '+tlHM(nowM)+'</span></div>';
    return h+'</div>'; };
  var W=R.warns||[], html='';
  if(W.length) html+='<button type="button" class="tl-chk" aria-expanded="'+!!TL.chk+'" onclick="TL.chk=!TL.chk;tlPaint()">확인할 것 '+W.length+'개 <span aria-hidden="true">'+(TL.chk?"⌃":"›")+'</span></button>'+
    (TL.chk?'<div class="card tl-wl">'+W.map(function(w){ return '<button type="button" class="tl-wi" onclick="'+w.js+'"><b>'+esc(w.ti)+'</b><span>'+esc(w.w)+'</span></button>'; }).join("")+'</div>':'');
  if(pn) html+='<button type="button" class="tl-past" aria-expanded="'+!!TL.past+'" onclick="TL.past=!TL.past;tlPaint()">지난 일정 '+pn+'개 <span aria-hidden="true">'+(TL.past?"⌃":"⌄")+'</span></button>'+(TL.past?'<div class="tl-pastbox">'+past.map(dayH).join("")+'</div>':'');
  html+=cur.map(dayH).join("");
  html+='<details class="memo mt"'+(TL.memo?" open":"")+' ontoggle="TL.memo=this.open"><summary>운영 메모</summary><div class="cap mt4">시각은 운영 설정 · 예약 · 출석 표 · 추첨 상태에서 읽음 · 설정이 바뀌면 줄 시각도 바뀜 · 줄을 누르면 관련 화면으로 이동 · 클로즈는 행사일 다음 날 23:59 안내(오픈 범위는 사람이 바꿈)</div></details>';
  if(b._h!==html){ b._h=html; b.innerHTML=html; }
}
(function(){
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return lgSub()==="tl"?[{ k:"cfgl", a:"cfg_list", ttl:60000 },{ k:"sched", a:"sched_list", ttl:30000 },{ k:"pst", a:"push_stats", ttl:60000 },{ k:"qal", a:"att_list", ttl:300000 },{ k:"draw", a:"draw_stats", ttl:30000 }]:n0_(); };
  sc.mount=function(vb){ if(lgSub()!=="tl") return m0(vb); el("phCap").textContent="날짜별로 시각과 일 · 줄을 누르면 관련 화면으로"; vb.innerHTML=chipsH(LG_SUBS,"tl")+'<div id="tlBox"></div>'; };
  sc.paint=function(vb){ if(lgSub()!=="tl") return p0(vb); tlPaint(); };
})();
