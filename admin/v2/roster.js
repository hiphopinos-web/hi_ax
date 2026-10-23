/* AXF CONTROL v2 · 접속 거부 · 관리자 명단 (261016 4단계 · 지금 콘솔 「접속 현황 › 들어오지 못한 사람」 · 예전 「관리자 명단」 화면을 옮김)
 * 사람 › 접속 거부 = og_deny_list(명단 밖이라 로그인 · 쓰기가 거절된 사번 · 마지막 시도 순 500줄 · open 1 = 지금은 들어올 수 있음)
 *   넣기 = roll_apply(list gate · op add · 되돌리기 roll_undo 묶음) · 기록 비우기 = og_deny_clear(확인 문구 「접속거부기록」 · 되돌릴 수 없음)
 * 기록 · 설정 › 관리자 명단 = adm_roster(c 콘솔 입장 · a 앱 스태프 폰 권한 · 이름 · 부서) · 추가 = adm_roster_set(sc · op · emps) · 되돌리기 = 반대 동작
 *   261016 저녁 선택 삭제 = list_rows_cancel(c = kind admin · a = kind staff part app) · 되돌리기 roll_undo
 *   맨 앞 사번(sup)은 서버가 빼지 못하게 막는다 · 처음 저장하는 순간부터 그 명단대로 들어온다 · 261016 PIN 없음(확인 창) */
var DNY_W="접속거부기록";
PP_SUBS.push(["deny","접속 거부"]);   /* 261021 명단 탭 칩 6개 뒤(옛 「접속 허용」 칩 다음 자리 · 접속 허용은 목록 구분으로 옮김) */
LG_SUBS.splice(LG_SUBS.map(function(x){ return x[0]; }).indexOf("code"),0,["adm","관리자 명단"]);   /* 261017 「스태프 코드」 칩은 이 화면 오른쪽으로 옮겨 LG_SUBS 에 없다(-1 = 마지막 칩 「현장 QR」 앞 · 검사 442 자리 그대로) */
/* ── 접속 거부 ── */
function dnyGrid(){
  return gridOf("deny",{ file:"접속 거부", key:function(r){ return r.emp; }, sort:{ k:"last", d:-1 }, src:{ a:"og_deny_list", p:{} }, h:480, empty:"거부 기록이 없습니다", onRow:function(k){ pcOpen(k, MG.deny); },
    chips:[["all","전체",null],["shut","지금도 막힘",function(r){ return !r.open; }],["open","이제 들어올 수 있음",function(r){ return !!r.open; }]],
    cols:[{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:90 },{ k:"dept", t:"부서", w:160 },{ k:"last", t:"마지막 시도", type:"date", w:110 },{ k:"first", t:"처음", type:"date", w:110 },{ k:"n", t:"횟수", type:"num", w:64 },
      { k:"open", t:"지금", w:120, v:function(r){ return r.open?"들어올 수 있음":"막힘"; }, f:function(r){ return r.open?tag("들어올 수 있음","ok"):tag("막힘","warn"); } },
      { k:"_a", t:"", w:96, act:function(r){ return r.open?"":'<button class="btn sm" type="button" onclick="dnyAdd([\''+jq(r.emp)+'\'])">넣기</button>'; } }] });
}
function dnyCan(){ return isTop(); }   /* 261023 권한 QA · 기록 비우기 = 슈퍼관리자(서버 og_deny_clear admTop_) · 넣기는 콘솔 사람 그대로 */
function dnyShut(){ var d=S.data.dny; return d&&d.ok?(d.rows||[]).filter(function(x){ return !x.open; }):[]; }
function dnyTop(){
  var b=el("dnyT"), d=S.data.dny; if(!b) return;
  if(!d||!d.ok){ b.innerHTML=""; return; }
  var sh=dnyShut();
  b.innerHTML=kpi({ l:"지금도 막힌 사람", v:n0(d.wait!=null?d.wait:sh.length), u:"명", st:sh.length?"warn":"", s:"명단 밖 · 지금 범위 기준" })+kpi({ l:"거부 기록", v:n0(d.n), u:"명", s:d.more?"앞 "+n0((d.rows||[]).length)+"줄만 표에":"마지막 시도 순" })+
    '<div class="card"><div class="btns">'+(sh.length?'<button class="btn pri" type="button" onclick="dnyAdd(null)">막힌 '+n0(Math.min(500,sh.length))+'명 모두 넣기</button>':'')+(dnyCan()?'<button class="btn dng" type="button" onclick="dnyClearAsk()"'+(num(d.n)?"":" disabled")+'>기록 비우기</button>':'')+'</div><p class="cap mt4">넣기 = 접속 허용 명단에 넣음 · 되돌리기 7초 · 활동 기록에서 그날 안</p></div>';
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

/* ── 관리자 명단 ── 261017 콘솔 개인 비밀번호(사용자 확정) · 비밀번호 열(설정함 · 설정 코드 대기 · 코드 만료 · 없음 · 잠김) · 설정 코드 발급 · 초기화(adm_pw_issue · 한 번만 보이는 창 · 복사) ·
 *   콘솔 입장 명단의 추가 · 선택 삭제 · 발급 · 초기화와 스태프 코드 바꾸기는 슈퍼관리자(adm_roster.top)에게만 보이고 서버도 슈퍼관리자만 받는다 · 앱 스태프 명단은 콘솔 사람 그대로
 *   스태프 코드 칸(setting.js scPaint)은 오른쪽 「앱 스태프 폰 권한」 아래로 옮김(P5) */
var ADR_SC={ c:["콘솔 입장 명단","이 콘솔에 사번 + 개인 비밀번호로 들어오는 사람 · 추가 · 설정 코드 · 초기화 · 삭제는 슈퍼관리자"], a:["앱 스태프 폰 권한","앱에서 스태프 화면(스캔 · 현장 부여)을 여는 사람"] };
var ADR_WHY={ emp:"사번 모양이 아닙니다", self:"맨 앞 사번(슈퍼관리자)은 뺄 수 없습니다", max:"명단은 200명까지입니다", param:"입력값을 확인합니다", "super":"슈퍼관리자만 합니다", notfound:"콘솔 입장 명단에 없는 사번입니다" };
var ADR_PW={ set:["설정함","ok"], code:["설정 코드 대기",""], expired:["코드 만료","warn"], none:["없음","off"] };
function adrTop(){ var d=S.data.admr; return !!((d&&d.ok&&d.top)||(S.me&&S.me.top)); }
function adrRows(sc){ var d=S.data.admr; return d&&d.ok?((d[sc]||{}).rows||[]):[]; }
function adrPwA(r){ return r.pw==="code"&&num(r.had)?["초기화 · 첫 입장 대기",""]:ADR_PW[r.pw]||ADR_PW.none; }   /* 261023 정한 적 있는 사람의 초기화 = 다음 입장 값이 새 비밀번호 */
function adrPwTx(r){ if(r.pw==null) return ""; var t=adrPwA(r)[0]; if(r.lock>0) t+=" · 잠김 "+Math.ceil(r.lock/60)+"분"; if(r.pw==="code"&&r.exp) t+=" · "+fmtD(r.exp)+" 까지"; return t; }
function adrPwTag(r){ if(r.pw==null) return '<span class="cap">서버 갱신 뒤</span>'; var a=adrPwA(r); return tag(a[0],a[1])+(r.lock>0?" "+tag("잠김 "+Math.ceil(r.lock/60)+"분","warn"):"")+(r.pw==="code"&&r.exp?' <span class="cap">'+esc(fmtD(r.exp))+' 까지</span>':''); }
function adrGrid(sc){
  var top=adrTop(), may=sc==="a"||top;
  var o={ file:ADR_SC[sc][0], key:function(r){ return r.emp; }, sort:{ k:"name", d:1 }, src:{ a:"adm_roster", p:{}, pick:function(res){ return (res[sc]||{}).rows||[]; } }, h:360, empty:"명단이 비어 있습니다", onRow:function(k){ pcOpen(k, MG["adr_"+sc]); },
    cols:[{ k:"name", t:"이름", w:120, tags:function(r){ return r.sup?" "+tag("고정"):""; } },{ k:"emp", t:"사번", w:80 },{ k:"dept", t:"부서", w:120 },{ k:"acct", t:"앱 가입", w:64, v:function(r){ return r.acct?"가입":"명부만"; } }] };
  if(sc==="c"){
    o.cols.push({ k:"lo", t:"AX 라운지 담당", w:130, v:function(r){ return r.lo?"담당":""; }, f:function(r){ return typeof lsmOwnCell==="function"?lsmOwnCell(r):(r.lo?tag("담당","ok"):""); } });   /* 261021 라운지 스탬프 일괄 부여 권한(lngstamp.js) */
    o.cols.push({ k:"ao", t:"출석 담당", w:120, v:function(r){ return r.ao?"담당":""; }, f:function(r){ return typeof atOwnCell==="function"?atOwnCell(r):(r.ao?tag("담당","ok"):""); } });   /* 261022 출석 탭 입장 · 종료 처리 권한(attn.js) */
    o.cols.push({ k:"co", t:"커피챗 담당", w:120, v:function(r){ return r.co?"담당":""; }, f:function(r){ return typeof cwOwnCell==="function"?cwOwnCell(r):(r.co?tag("담당","ok"):""); } });   /* 261022 현장 상담(ccwalk.js · 설정 커피챗_담당) */
    o.cols.push({ k:"pw", t:"비밀번호", w:170, v:adrPwTx, f:adrPwTag });
    o.cols.push({ k:"_a", t:"", w:96, act:function(r){ return adrTop()&&r.pw!=null?'<button class="btn sm" type="button" onclick="adrIssueAsk(\''+jq(r.emp)+'\')">'+(r.pw==="set"||r.pw==="code"?"초기화":"설정 코드")+'</button>':""; } });
  }
  if(may){
    o.select=1; o.onAdd=function(){ paOpen(adrSp(sc)); };
    o.cancel={ kind:sc==="c"?"admin":"staff", part:sc==="c"?null:function(){ return "app"; }, what:ADR_SC[sc][0], sub:"빼는 즉시 이 사람의 "+(sc==="c"?"콘솔":"앱 스태프 화면")+" 로그인이 끊김 · 맨 앞 사번 · 본인은 서버가 막음", after:function(){ reload(["admr"]); } };
  }
  var g=gridOf("adr_"+sc,o); g._top=may; return g;
}
/* 슈퍼관리자 여부가 명단 응답 뒤에 확정되면 표 틀(선택 칸 · 추가 단추)을 다시 만든다 */
function adrSync(sc){ var g=MG["adr_"+sc], may=sc==="a"||adrTop(); if(g&&g._top!==may){ delete MG["adr_"+sc]; delete XG.reg["adr_"+sc]; var ph=el("mg_adr_"+sc); if(ph) ph.innerHTML=""; adrGrid(sc); } }
function adrCapTx(sc){ var d=S.data.admr, L=d&&d.ok?d[sc]||{}:null; return L?' <span class="cap">'+(L.set?n0((L.rows||[]).length)+"명 · 적용 중":sc==="c"?"저장 전 · 맨 앞 사번만 들어옴":"저장 전 · 코드만 맞으면 열림")+'</span>':''; }
function adrPwBand(){
  var d=S.data.admr; if(PWM.mode!=="pw"||!d||!d.ok) return "";
  return band(d.pwon?"info":"warn", d.pwon?"개인 비밀번호 입장 ON · 콘솔은 사번 + 개인 비밀번호로만 들어옵니다 · 관리코드는 백업 · 점검 도구만":"개인 비밀번호 입장 OFF · 지금은 관리코드 · 개인 비밀번호 둘 다 들어옵니다 · 각자 설정 코드로 비밀번호를 먼저 정하는 기간 · 켜기 = 설정 「콘솔_개인비밀번호」(슈퍼관리자 · 개인 비밀번호로 들어온 뒤)");
}
function adrCard(sc){
  return '<div class="card"><h2 id="adrH_'+sc+'">'+esc(ADR_SC[sc][0])+adrCapTx(sc)+'</h2><p class="cap">'+esc(ADR_SC[sc][1])+'</p>'+(sc==="c"?'<div id="adrPwB" class="mt4">'+adrPwBand()+'</div>':'')+
    '<div id="mg_adr_'+sc+'" class="mt"></div></div>';
}
function adrNm(sc, e){ return personLine(adrRows(sc).filter(function(x){ return x.emp===e; })[0]||{ emp:e }); }
function adrSet(sc, op, emps){ return call("adm_roster_set",{ sc:sc, op:op, emps:emps }).then(function(r){ if(r&&r.ok&&r.list&&S.data.admr&&S.data.admr.ok){ S.data.admr[sc]=r.list; paint(); } return r; }); }
/* 「추가」 창(edit.js paOpen) · 명부 찾기 → 넣기 · 처음 저장이면 경고 한 줄 · 되돌리기 = 반대 동작 · 콘솔 명단이면 이어서 설정 코드 발급을 묻는다 */
function adrSp(sc){
  var nm=ADR_SC[sc][0];
  return { t:nm+" 추가", cap:"명부에서 찾기 → 넣기 · "+(sc==="c"?(PWM.mode==="pw"?"넣은 뒤 설정 코드를 발급해 전달합니다":"관리코드와 함께 이 콘솔에 들어옴"):"로그인하면 스태프 화면이 열림"),
    have:function(e){ return adrRows(sc).some(function(x){ return normE(x.emp)===e; })?"이미 명단에 있습니다":""; },
    note:function(){ var L=(S.data.admr&&S.data.admr[sc])||{}; return L.set?"":band("warn","처음 넣는 순간부터 이 명단대로 들어옵니다 · 명단 밖 사람은 "+(sc==="c"?"콘솔":"앱 스태프 화면")+"에 못 들어옴"); },
    run:function(p){ return adrSet(sc,"add",normE(p.emp)); }, fail:function(r){ return r&&ADR_WHY[r.reason]||""; },
    done:function(r){ var dn=r.done||[]; reload(["admr"]); toast(dn.length?"넣었습니다 · "+dn.join(", ")+(r.started?" · 이 명단 적용 시작":""):"이미 명단에 있습니다", dn.length?{ undo:function(){ adrSet(sc,"del",dn.join(",")).then(function(x){ toast(x&&x.ok?"되돌렸습니다 · "+dn.join(", "):"되돌리지 못했습니다 · "+(ADR_WHY[(x||{}).reason]||why(x)),{ bad:!(x&&x.ok) }); }); } }:{});
      if(sc==="c"&&dn.length===1&&PWM.mode==="pw") setTimeout(function(){ adrIssueAsk(dn[0]); },300); } };
}
/* 설정 코드 발급 · 초기화(슈퍼관리자 · 확인 창 · 활동 기록 adm_pw) · 성공 = 코드를 한 번만 보이는 창(복사) */
function adrIssueAsk(emp){
  var r=adrRows("c").filter(function(x){ return x.emp===emp; })[0]||{ emp:emp }, has=r.pw==="set"||r.pw==="code", had=r.pw==="set"||num(r.had);
  confirmBox({ t:has?"비밀번호를 초기화할까요?":"설정 코드를 발급할까요?", who:personLine(r), sub:had?"지금 비밀번호와 열려 있는 콘솔 입장이 바로 끊김 · 다음 입장 때 넣는 비밀번호가 새 비밀번호가 됩니다":has?"지금 비밀번호와 열려 있는 콘솔 입장이 바로 끊김 · 새 설정 코드(6자리 · 24시간 · 한 번만 보임)":"설정 코드(6자리 · 24시간 · 한 번만 보임) · 그 사람이 「설정 코드로 처음 입장」에서 비밀번호를 정합니다",
    body:had?'<p class="cap">초기화 뒤 24시간 안 · 한 번 · 지나면 다시 초기화</p>':"",
    ok:has?"초기화":"설정 코드 발급", danger:has,
    run:function(){ return call("adm_pw_issue",{ emp:emp },25000); }, fail:function(x){ return x&&ADR_WHY[x.reason]||""; },
    done:function(x){ reload(["admr"]); if(num(x.rs)){ toast("초기화했습니다 · 다음 입장 때 넣는 비밀번호가 새 비밀번호 · "+fmtD(x.exp)+" 까지",{ ms:6000 }); return; } adrCodeShow(x, r); } });
}
function adrCodeShow(x, r){
  var code=String(x.code||"").replace(/\D/g,"").slice(0,6);
  confirmBox({ t:"설정 코드 · 한 번만 보입니다", who:personLine(r), sub:"만료 "+fmtD(x.exp)+" · 본인에게 직접 전달 · 창을 닫으면 다시 볼 수 없음(필요하면 다시 발급)",
    body:'<div class="pw-code">'+esc(code)+'</div><div class="btns"><button class="btn" type="button" onclick="copyTx(\''+code+'\',\'설정 코드를 복사했습니다\')">복사</button></div><p class="cap mt4">받은 사람 : 콘솔 입장 화면 「설정 코드로 처음 입장」 → 사번 + 이 코드 → 비밀번호 정하기</p>',
    ok:"확인", run:function(){ return Promise.resolve({ ok:true }); }, done:function(){} });
}
(function(){
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return lgSub()==="adm"?[{ k:"admr", a:"adm_roster", ttl:30000 }]:n0_(); };
  sc.mount=function(vb){
    if(lgSub()!=="adm") return m0(vb);
    el("phCap").textContent="콘솔에 들어오는 사람 · 앱 스태프 화면을 여는 사람 · 추가 · 선택 삭제 · 설정 코드 · 초기화 · 스태프 코드";
    adrGrid("c"); adrGrid("a");
    vb.innerHTML=chipsH(LG_SUBS,"adm")+'<div class="grid g2 s1" id="adrB">'+adrCard("c")+'<div class="col">'+adrCard("a")+'<div class="card" id="scB"></div></div></div><p class="cap mt">스태프 옷 명단은 명단 › 명단 올리기 · 관리코드 · 등급코드 바꾸기는 대화로 · 비밀번호를 잊은 사람은 슈퍼관리자가 「초기화」</p>';
  };
  sc.paint=function(vb){
    if(lgSub()!=="adm") return p0(vb);
    ["c","a"].forEach(function(k){ adrSync(k); var cap=el("adrH_"+k); if(cap&&S.data.admr&&S.data.admr.ok) cap.innerHTML=esc(ADR_SC[k][0])+adrCapTx(k);
      gridPaint("adr_"+k,"admr","관리자 명단",function(d){ return (d[k]||{}).rows||[]; }); });
    var pb=el("adrPwB"); if(pb){ var h=adrPwBand(); if(pb._h!==h){ pb._h=h; pb.innerHTML=h; } }
    scPaint();
  };
})();
