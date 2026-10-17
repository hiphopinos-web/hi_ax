/* AXF CONTROL v2 · 접속 거부 · 관리자 명단 (261016 4단계 · 지금 콘솔 「접속 현황 › 들어오지 못한 사람」 · 예전 「관리자 명단」 화면을 옮김)
 * 사람 › 접속 거부 = og_deny_list(명단 밖이라 로그인 · 쓰기가 거절된 사번 · 마지막 시도 순 500줄 · open 1 = 지금은 들어올 수 있음)
 *   넣기 = roll_apply(list gate · op add · 되돌리기 roll_undo 묶음) · 기록 비우기 = og_deny_clear(확인 문구 「접속거부기록」 · 되돌릴 수 없음)
 * 기록 · 설정 › 관리자 명단 = adm_roster(c 콘솔 입장 · a 앱 스태프 폰 권한 · 이름 · 부서) · 추가 = adm_roster_set(sc · op · emps) · 되돌리기 = 반대 동작
 *   261016 저녁 선택 삭제 = list_rows_cancel(c = kind admin · a = kind staff part app) · 되돌리기 roll_undo
 *   맨 앞 사번(sup)은 서버가 빼지 못하게 막는다 · 처음 저장하는 순간부터 그 명단대로 들어온다 · 261016 PIN 없음(확인 창) */
var DNY_W="접속거부기록";
PP_SUBS.splice(PP_SUBS.map(function(x){ return x[0]; }).indexOf("gate")+1,0,["deny","접속 거부"]);
LG_SUBS.splice(LG_SUBS.map(function(x){ return x[0]; }).indexOf("code"),0,["adm","관리자 명단"]);
/* ── 접속 거부 ── */
function dnyGrid(){
  return gridOf("deny",{ file:"접속 거부", key:function(r){ return r.emp; }, sort:{ k:"last", d:-1 }, src:{ a:"og_deny_list", p:{} }, h:480, empty:"거부 기록이 없습니다", onRow:function(k){ pcOpen(k, MG.deny); },
    chips:[["all","전체",null],["shut","지금도 막힘",function(r){ return !r.open; }],["open","이제 들어올 수 있음",function(r){ return !!r.open; }]],
    cols:[{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:90 },{ k:"dept", t:"부서", w:160 },{ k:"last", t:"마지막 시도", type:"date", w:110 },{ k:"first", t:"처음", type:"date", w:110 },{ k:"n", t:"횟수", type:"num", w:64 },
      { k:"open", t:"지금", w:120, v:function(r){ return r.open?"들어올 수 있음":"막힘"; }, f:function(r){ return r.open?tag("들어올 수 있음","ok"):tag("막힘","warn"); } },
      { k:"_a", t:"", w:96, act:function(r){ return r.open?"":'<button class="btn sm" type="button" onclick="dnyAdd([\''+jq(r.emp)+'\'])">넣기</button>'; } }] });
}
function dnyShut(){ var d=S.data.dny; return d&&d.ok?(d.rows||[]).filter(function(x){ return !x.open; }):[]; }
function dnyTop(){
  var b=el("dnyT"), d=S.data.dny; if(!b) return;
  if(!d||!d.ok){ b.innerHTML=""; return; }
  var sh=dnyShut();
  b.innerHTML=kpi({ l:"지금도 막힌 사람", v:n0(d.wait!=null?d.wait:sh.length), u:"명", st:sh.length?"warn":"", s:"명단 밖 · 지금 범위 기준" })+kpi({ l:"거부 기록", v:n0(d.n), u:"명", s:d.more?"앞 "+n0((d.rows||[]).length)+"줄만 표에":"마지막 시도 순" })+
    '<div class="card"><div class="btns">'+(sh.length?'<button class="btn pri" type="button" onclick="dnyAdd(null)">막힌 '+n0(Math.min(500,sh.length))+'명 모두 넣기</button>':'')+'<button class="btn dng" type="button" onclick="dnyClearAsk()"'+(num(d.n)?"":" disabled")+'>기록 비우기</button></div><p class="cap mt4">넣기 = 접속 허용 명단에 넣음 · 되돌리기 7초 · 활동 기록에서 그날 안</p></div>';
}
function dnyAdd(emps){
  var all=!emps; if(all) emps=dnyShut().slice(0,500).map(function(x){ return x.emp; }); if(!emps.length) return;
  var rows=(S.data.dny&&S.data.dny.rows)||[], nm=function(e){ return personLine(rows.filter(function(x){ return x.emp===e; })[0]||{ emp:e }); };
  confirmBox({ t:"접속 허용 명단에 "+emps.length+"명을 넣을까요?", who:emps.slice(0,3).map(nm).join(", ")+(emps.length>3?" 외 "+(emps.length-3)+"명":""), sub:"클로즈 베타 · 사전 신청자까지 범위에서 바로 로그인 · 명부에 없는 사번은 서버가 뺌", ok:emps.length+"명 넣기",
    run:function(){ return call("roll_apply",{ list:"gate", op:"add", emps:emps.join(","), rid:rid() }); },
    done:function(r){ var n=(r.done||[]).length; reload(["dny"]); ppStale();
      toast(n+"명을 접속 허용 명단에 넣었습니다"+((r.noros||[]).length?" · 명부 밖 "+r.noros.length+"명 뺌":""), r.batch?{ undo:function(){ rollBack(r.batch, function(){ reload(["dny"]); }); } }:{}); } });
}
function dnyClearAsk(){
  var d=S.data.dny||{};
  confirmBox({ t:"접속 거부 기록을 모두 비울까요?", who:"거부 기록 "+n0(d.n)+"명", sub:"기록만 지웁니다 · 명단 · 앱 범위는 그대로 · 되돌릴 수 없음",
    body:'<label class="fld">확인 문구 「'+DNY_W+'」를 그대로 넣습니다<input class="in" id="dnyQ" autocomplete="off" oninput="gateUpd()"></label>', focus:"dnyQ", ok:"기록 비우기", danger:true,
    gate:function(){ var i=el("dnyQ"); return !!i&&i.value.trim()===DNY_W; },
    run:function(){ return call("og_deny_clear",{ confirm:DNY_W }); },
    done:function(r){ reload(["dny"]); toast("접속 거부 기록을 비웠습니다 · "+n0(r.del)+"명"); } });
}
(function(){
  var sc=SCREENS.people, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return ppSub()==="deny"?[{ k:"dny", a:"og_deny_list", ttl:30000 }]:n0_(); };
  sc.mount=function(vb){
    if(ppSub()!=="deny") return m0(vb);
    el("phCap").textContent="명단 밖이라 로그인 · 쓰기가 거절된 사번 · 넣기 · 기록 비우기 · 줄을 누르면 한 사람 카드";
    dnyGrid();
    vb.innerHTML=chipsH(PP_SUBS,"deny")+'<div class="grid g3 mb" id="dnyT"></div><div class="card"><div id="mg_deny"></div></div>';
  };
  sc.paint=function(vb){ if(ppSub()!=="deny") return p0(vb); dnyTop(); gridPaint("deny","dny","접속 거부 기록",function(d){ return d.rows||[]; }); };
})();

/* ── 관리자 명단 ── */
var ADR_SC={ c:["콘솔 입장 명단","이 콘솔에 사번 + 관리코드로 들어오는 사람"], a:["앱 스태프 폰 권한","앱에서 스태프 화면(스캔 · 현장 부여)을 여는 사람"] };
var ADR_WHY={ emp:"사번 모양이 아닙니다", self:"맨 앞 사번(슈퍼관리자)은 뺄 수 없습니다", max:"명단은 200명까지입니다", param:"입력값을 확인합니다" };
function adrGrid(sc){
  return gridOf("adr_"+sc,{ file:ADR_SC[sc][0], key:function(r){ return r.emp; }, sort:{ k:"name", d:1 }, src:{ a:"adm_roster", p:{}, pick:function(res){ return (res[sc]||{}).rows||[]; } }, h:360, empty:"명단이 비어 있습니다", onRow:function(k){ pcOpen(k, MG["adr_"+sc]); },
    select:1, onAdd:function(){ paOpen(adrSp(sc)); },
    cancel:{ kind:sc==="c"?"admin":"staff", part:sc==="c"?null:function(){ return "app"; }, what:ADR_SC[sc][0], sub:"빼는 즉시 이 사람의 "+(sc==="c"?"콘솔":"앱 스태프 화면")+" 로그인이 끊김 · 맨 앞 사번 · 본인은 서버가 막음", after:function(){ reload(["admr"]); } },
    cols:[{ k:"name", t:"이름", w:120, tags:function(r){ return r.sup?" "+tag("고정"):""; } },{ k:"emp", t:"사번", w:80 },{ k:"dept", t:"부서", w:120 },{ k:"acct", t:"앱 가입", w:64, v:function(r){ return r.acct?"가입":"명부만"; } }] });
}
function adrCard(sc){
  var d=S.data.admr, L=d&&d.ok?d[sc]||{}:null;
  return '<div class="card"><h2>'+esc(ADR_SC[sc][0])+(L?' <span class="cap">'+(L.set?n0((L.rows||[]).length)+"명 · 적용 중":sc==="c"?"저장 전 · 맨 앞 사번만 들어옴":"저장 전 · 코드만 맞으면 열림")+'</span>':'')+'</h2><p class="cap">'+esc(ADR_SC[sc][1])+'</p>'+
    '<div id="mg_adr_'+sc+'" class="mt"></div></div>';
}
function adrRows(sc){ var d=S.data.admr; return d&&d.ok?((d[sc]||{}).rows||[]):[]; }
function adrNm(sc, e){ return personLine(adrRows(sc).filter(function(x){ return x.emp===e; })[0]||{ emp:e }); }
function adrSet(sc, op, emps){ return call("adm_roster_set",{ sc:sc, op:op, emps:emps }).then(function(r){ if(r&&r.ok&&r.list&&S.data.admr&&S.data.admr.ok){ S.data.admr[sc]=r.list; paint(); } return r; }); }
/* 「추가」 창(edit.js paOpen) · 명부 찾기 → 넣기 · 처음 저장이면 경고 한 줄 · 되돌리기 = 반대 동작 */
function adrSp(sc){
  var nm=ADR_SC[sc][0];
  return { t:nm+" 추가", cap:"명부에서 찾기 → 넣기 · "+(sc==="c"?"관리코드와 함께 이 콘솔에 들어옴":"로그인하면 스태프 화면이 열림"),
    have:function(e){ return adrRows(sc).some(function(x){ return normE(x.emp)===e; })?"이미 명단에 있습니다":""; },
    note:function(){ var L=(S.data.admr&&S.data.admr[sc])||{}; return L.set?"":band("warn","처음 넣는 순간부터 이 명단대로 들어옵니다 · 명단 밖 사람은 "+(sc==="c"?"콘솔":"앱 스태프 화면")+"에 못 들어옴"); },
    run:function(p){ return adrSet(sc,"add",normE(p.emp)); }, fail:function(r){ return r&&ADR_WHY[r.reason]||""; },
    done:function(r){ var dn=r.done||[]; reload(["admr"]); toast(dn.length?"넣었습니다 · "+dn.join(", ")+(r.started?" · 이 명단 적용 시작":""):"이미 명단에 있습니다", dn.length?{ undo:function(){ adrSet(sc,"del",dn.join(",")).then(function(x){ toast(x&&x.ok?"되돌렸습니다 · "+dn.join(", "):"되돌리지 못했습니다 · "+(ADR_WHY[(x||{}).reason]||why(x)),{ bad:!(x&&x.ok) }); }); } }:{}); } };
}
(function(){
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return lgSub()==="adm"?[{ k:"admr", a:"adm_roster", ttl:30000 }]:n0_(); };
  sc.mount=function(vb){
    if(lgSub()!=="adm") return m0(vb);
    el("phCap").textContent="콘솔에 들어오는 사람 · 앱 스태프 화면을 여는 사람 · 추가 · 선택 삭제 · 되돌리기";
    adrGrid("c"); adrGrid("a");
    vb.innerHTML=chipsH(LG_SUBS,"adm")+'<div class="grid g2 s1" id="adrB">'+adrCard("c")+adrCard("a")+'</div><p class="cap mt">스태프 옷 명단은 사람 › 명단 올리기 · 스태프 폰 코드는 기록 · 설정 › 스태프 코드 · 관리코드 · 등급코드 바꾸기는 대화로</p>';
  };
  sc.paint=function(vb){
    if(lgSub()!=="adm") return p0(vb);
    ["c","a"].forEach(function(k){ var h=el("adrB"); if(!h) return; var cap=h.children[k==="c"?0:1].querySelector("h2"); if(cap&&S.data.admr&&S.data.admr.ok){ var L=S.data.admr[k]||{}; cap.innerHTML=esc(ADR_SC[k][0])+' <span class="cap">'+(L.set?n0((L.rows||[]).length)+"명 · 적용 중":k==="c"?"저장 전 · 맨 앞 사번만 들어옴":"저장 전 · 코드만 맞으면 열림")+'</span>'; }
      gridPaint("adr_"+k,"admr","관리자 명단",function(d){ return (d[k]||{}).rows||[]; }); });
  };
})();
