/* AXF CONTROL v2 · 공통 (261016 콘솔 재구축 화면 1단계)
 * 서버 호출 · 로그인 · 확인 창 · 토스트 · 화면 틀(상단 띠 · 하단 탭 8 · 261016 밤 미팅 탭) · 숫자 카드 · 행 목록 · 상태(불러오는 중 · 빈 · 오류 · 서버 갱신 뒤)
 * 서버 경로 · 로그인(admin_check) · 토큰 저장 키는 지금 콘솔(admin/index.html)과 같다. 관리코드는 저장하지 않는다.
 * 261016 사용자 「로그인하고 나면 쓸데없는 PIN 번호 넣는 일을 없애줘」 · 사번 + 관리코드로 들어온 뒤에는 어떤 동작에도 PIN 을 묻지 않는다. 되돌리기 어려운 동작은 확인 창 · 확인 문구로 막는다.
 * 서버 계약(디자인 시안/콘솔 재구축/3_서버 계약.md)이 아직 없는 기능은 화면에 「서버 갱신 뒤」로 비워 둔다(가짜 숫자 없음). */
var BE_DEFAULT="https://script.google.com/macros/s/AKfycbwjCaSSUnQ7W1lrM8T426Cn_LgKs_UhI0Qi5XRVk-_eF-oD55-Wwjsot0DkPJCX9JqMBA/exec";
function beUrlOk(u){ return typeof u==="string"&&/^https:\/\/([a-z0-9-]+\.[a-z0-9-]+\.workers\.dev|script\.google\.com\/macros\/s\/[\w-]{20,})\/exec$/.test(u); }
var BE=beUrlOk(typeof AXF_SERVER==="string"?AXF_SERVER:"")?AXF_SERVER:BE_DEFAULT;
if(typeof AXF_SERVER==="string"&&/^http:\/\/127\.0\.0\.1:\d+\/exec$/.test(AXF_SERVER)) BE=AXF_SERVER;   /* 로컬 QA 서버(QA/local.mjs · 127.0.0.1 만) */
else if(/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) BE="http://127.0.0.1:9/exec";   /* 로컬에서 서버 주소를 못 받으면 원격 기본값(옛 서버)으로 가지 않고 실패로 둔다 */
/* 261019 럭키드로우 리허설 · 주소에 ?srv=qa = 시험 서버(hi-qa) · 무대 stage.html?srv=qa 와 같은 방식 · 저장 키(로그인 · 화면 기억)에 qa_ 를 붙여 운영과 섞지 않는다 · 위에 띠(qaBand)
 * 없으면 BE · 저장 키 · 화면 모두 지금 그대로(skey(k) = k) */
var BE_QA=/[?&]srv=qa(&|$)/.test(location.search);
if(BE_QA) BE="https://hi-qa.axf2026.workers.dev/exec";
function skey(k){ return BE_QA?"qa_"+k:k; }
var LOUNGE_DEF={ start:"09:30", n:7, seats:2 };   /* 배치판 기본값 · 서버가 칸 설정을 주면 그 값(now_board lounge · 서버 갱신 뒤) */

/* ── 1. 작은 도구 ── */
function el(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; }); }
function jq(s){ return String(s==null?"":s).replace(/[^0-9A-Za-z_\-.:가-힣]/g,""); }
function n0(v){ var n=Number(v); return isFinite(n)?n.toLocaleString("ko-KR"):"-"; }
function num(v){ var n=Number(v); return isFinite(n)?n:0; }
function hm(s){ var m=String(s||"").match(/(\d{1,2}):(\d{2})/); return m?("0"+m[1]).slice(-2)+":"+m[2]:""; }
function mins(s){ var m=String(s||"").match(/(\d{1,2}):(\d{2})/); return m?Number(m[1])*60+Number(m[2]):-1; }
function m2hm(m){ return ("0"+Math.floor(m/60)).slice(-2)+":"+("0"+(m%60)).slice(-2); }
/* 날짜 형식 통일 · 화면 「MM-DD HH:mm」 · 오늘이면 「HH:mm」 */
function fmtD(s){ s=String(s||""); var m=s.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/); if(!m){ return hm(s)||s; } var t=S.srvT?String(S.srvT).slice(0,10):""; return (t===m[1]+"-"+m[2]+"-"+m[3]?"":m[2]+"-"+m[3]+" ")+m[4]+":"+m[5]; }
function ago(s){ var m=String(s||"").match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/); if(!m||!S.srvT) return fmtD(s); var a=new Date(m[1],m[2]-1,m[3],m[4],m[5],m[6]||0), b=srvNow(); var d=Math.max(0,Math.round((b-a)/60000)); return d<1?"방금":d<60?d+"분 전":fmtD(s); }
function srvNow(){ var m=String(S.srvT||"").match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/); if(!m) return new Date(); var d=new Date(m[1],m[2]-1,m[3],m[4],m[5],m[6]||0); return new Date(d.getTime()+(Date.now()-S.srvAt)); }
function tag(t,c){ return '<span class="tag '+(c||"")+'">'+esc(t)+'</span>'; }
function stt(c,t){ return '<span class="st '+c+'"><i></i>'+esc(t)+'</span>'; }
function lsGet(k,d){ try{ var v=localStorage.getItem(skey(k)); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(skey(k),JSON.stringify(v)); }catch(e){} }
function aemp(){ try{ return sessionStorage.getItem(skey("axf_adm_emp"))||""; }catch(e){ return window.__e||""; } }
function setAemp(v){ try{ sessionStorage.setItem(skey("axf_adm_emp"),v||""); }catch(e){ window.__e=v||""; } }
function tok(){ try{ return sessionStorage.getItem(skey("axf_adm_tok"))||""; }catch(e){ return window.__t||""; } }
function setTok(v){ try{ sessionStorage.setItem(skey("axf_adm_tok"),v||""); }catch(e){ window.__t=v||""; } }
function normE(v){ return String(v==null?"":v).replace(/\s/g,"").toUpperCase().replace(/^0+(?=.)/,""); }
function envName(){ return /127\.0\.0\.1/.test(BE)?"로컬":/hi-qa/.test(BE)?"QA":/hi-load/.test(BE)?"부하 시험":/script\.google/.test(BE)?"옛 서버":"운영"; }

/* ── 2. 서버 호출 · POST 폼 본문 · 주소에 tok 이 남지 않는다(지금 콘솔과 같은 계약) ── */
var NET=[];
function call(action, params, ms){
  params=params||{}; var body=new URLSearchParams(), t0=Date.now();
  var p={}; for(var k in params) if(params[k]!=null) p[k]=params[k];
  p.action=action; if(!("aemp" in p)&&aemp()) p.aemp=aemp(); if(!("tok" in p)&&tok()) p.tok=tok();
  for(var k2 in p) body.append(k2,p[k2]);
  var ctl=window.AbortController?new AbortController():null, to=0;
  var timer=setTimeout(function(){ to=1; if(ctl) ctl.abort(); },ms||20000);
  return fetch(BE,{ method:"POST", body:body, cache:"no-store", redirect:"follow", signal:ctl?ctl.signal:undefined }).then(function(r){ return r.text(); }).then(function(t){
    clearTimeout(timer); var res; try{ res=JSON.parse(t); }catch(e){ res={ ok:false, reason:"network" }; }
    NET.push({ t:Date.now(), ms:Date.now()-t0, ok:!(res&&res.ok===false&&(res.reason==="busy"||res.err)) }); if(NET.length>60) NET.shift();
    try{ whoLearn(res, action); }catch(e){}
    if(res&&res.ok===false&&res.reason==="auth"&&action!=="admin_check"&&action!=="adm_pw_set"&&action!=="adm_pw_info"){ lock("입장이 끊겼습니다 · 코드 · 비밀번호가 바뀌었거나 명단에서 빠짐 · 다시 들어옵니다."); }
    return res||{ ok:false, reason:"network" };
  }).catch(function(){ clearTimeout(timer); NET.push({ t:Date.now(), ms:Date.now()-t0, ok:false }); return { ok:false, reason:to?"timeout":"network" }; });
}
function why(r){
  r=r||{}; var m={ network:"서버에 연결하지 못했습니다", timeout:"응답이 늦습니다", auth:"관리코드가 맞지 않습니다", spin:"서버 갱신 전입니다 · 서버가 바뀐 뒤 됩니다",
    pinwho:"사번으로 다시 들어온 뒤 합니다", post:"POST 로 보내야 합니다", state:"다른 사람이 먼저 처리했습니다", taken:"그 시간에 이미 다른 신청이 있습니다", dup:"같은 사람의 다른 신청이 있습니다", notfound:"찾지 못했습니다", param:"입력값을 확인합니다", ro:"읽기 전용 상태입니다", busy:"서버가 바쁩니다 · 잠시 뒤", locked:"잠겨 있습니다",
    preday:"10/26 행사 당일부터 줍니다 · 행사 전 적립은 로그인 · AX 퀴즈 · 미니 게임 · 아이디어 한 줄", eventday:"10/26 행사 당일에 합니다", seat:"그 자리가 찼습니다",
    notable:"배정 칸(테이블)이 없습니다 · 시간표에서 칸에 놓습니다", round:"설정에 없는 회차입니다", already:"이미 처리했습니다", "in":"이미 입장 처리한 사람입니다", cat:"이 종류는 처리하지 않습니다",
    expired:"다른 날 처리한 묶음입니다", done:"이미 되돌렸습니다", rows:"한 번에 넣을 수 있는 수를 넘었습니다", closed:"마감했습니다", confirm:"확인 문구가 맞지 않습니다", word:"확인 문구가 맞지 않습니다",
    full:"정원이 찼습니다", drawn:"이미 추첨했습니다", same:"지금과 같습니다", have:"이미 들어 있습니다", used:"이미 썼습니다", window:"처리할 수 있는 시간이 아닙니다", late:"마감 시각이 지났습니다", early:"아직 시작 전입니다",
    max:"최대 수를 넘었습니다", self:"지금 이 콘솔을 쓰는 본인은 처리하지 않습니다", "super":"슈퍼관리자만 합니다", kind:"이 종류는 처리하지 않습니다", empty:"비어 있습니다", none:"대상이 없습니다", "long":"글자 수가 너무 깁니다",
    changed:"다른 곳에서 먼저 고쳤습니다 · 다시 받은 뒤 합니다", stale:"그 사이 기록이 바뀌었습니다 · 다시 받은 뒤 합니다", notlast:"그 뒤에 또 바뀌어 되돌리지 못합니다", sold:"그 사이즈가 남지 않았습니다", got:"이미 받았습니다",
    noros:"명부에 없는 사번입니다", nostamp:"서버 기록에 이 스탬프가 없습니다", noid:"처리할 수 없는 항목입니다", test:"시험 사번입니다", ccwait:"대기 줄에서 처리합니다", nolock:"먼저 대상을 확정합니다", nodraw:"아직 추첨 전입니다",
    pwonly:"이 콘솔은 사번 + 개인 비밀번호로 들어옵니다", pwrule:"비밀번호 규칙에 맞지 않습니다", nopw:"개인 비밀번호로 들어온 뒤 켭니다", codeexp:"설정 코드가 만료됐습니다 · 다시 발급" };
  if(r.err==="unknown action") return "이 서버는 아직 이 기능을 모릅니다";
  return m[r.reason]||r.msg||r.reason||r.err||"처리하지 못했습니다";
}
function unknownSrv(r){ return !!(r&&r.ok===false&&(r.err==="unknown action"||r.reason==="unknown")); }

/* ── 3. 상태 · 불러오기 ── */
var S={ me:null, tab:"now", sub:{}, data:{}, at:{}, err:{}, busy:{}, sig:{}, srvT:"", srvAt:0, ui:{}, lg:null };   /* lg = 서버 list_get 을 아는지(null 모름 · true · false) */
/* 명단 한 장 · 새 서버면 list_get(kind) · 모르는 서버면 옛 액션(old = { a, p, rd }) */
function lgNeed(k, kind, old, ttl){ if(S.lg===false||!kind) return { k:k, a:old.a, p:old.p, rd:old.rd, ttl:ttl||60000 }; return { k:k, a:"list_get", p:{ kind:kind }, ttl:ttl||60000 }; }
function lgRows(k, g, oldRows){
  var d=S.data[k]; if(!d||d.ok===false) return null;
  if(d.kind!=null&&Array.isArray(d.rows)){ S.lg=true; XG.useCols(g, d.cols);
    if(g.o.lgChips){ var nc=g.o.lgChips(d.rows); g.o.chips0=g.o.chips0||g.o.chips; g.o.chips=nc; if(!nc.some(function(c){ return c[0]===g.chip; })) g.chip="all"; }
    else if(!g.o.chips0){ g.o.chips0=g.o.chips; g.o.chips=[["all","전체",null]]; g.chip="all"; }
    return d.rows; }
  return oldRows(d);
}
var COMMON_NEED=[{ k:"nb", a:"now_board", ttl:20000 },{ k:"pwc", a:"pw_req_count", ttl:60000 }];
function authed(){ return !!tok(); }
function needs(){ var sc=SCREENS[S.tab]; var a=sc&&sc.need?sc.need():[]; return a.concat(COMMON_NEED); }
function sigOf(a,p){ p=p||{}; return a+"?"+Object.keys(p).sort().map(function(k){ return k+"="+p[k]; }).join("&"); }
function load(force, only){
  if(!authed()||document.hidden) return;
  needs().forEach(function(n){
    if(only&&only.indexOf(n.k)<0) return;
    var sg=sigOf(n.a,n.p), age=Date.now()-(S.at[n.k]||0);
    if(!force&&S.sig[n.k]===sg&&age<n.ttl) return;
    if(S.busy[n.k]) return;
    S.busy[n.k]=1; S.sig[n.k]=sg; topPaint();
    var p={}; for(var k in (n.p||{})) p[k]=n.p[k];
    call(n.a,p).then(function(r){
      S.busy[n.k]=0; S.at[n.k]=Date.now();
      if(n.a==="list_get"&&unknownSrv(r)){ S.lg=false; S.sig[n.k]=""; S.at[n.k]=0; setTimeout(function(){ load(true,[n.k]); },0); return; }
      if(r&&r.ok===false&&(r.reason==="network"||r.reason==="timeout"||r.reason==="busy")){ S.err[n.k]=r; }
      else { S.data[n.k]=r; S.err[n.k]=null; }
      if(n.k==="nb"&&r&&r.t){ S.srvT=r.t; S.srvAt=Date.now(); }
      paint();
    });
  });
}
function reload(keys){ keys.forEach(function(k){ S.at[k]=0; }); load(true, keys); }
setInterval(function(){ load(false); },5000);
document.addEventListener("visibilitychange",function(){ if(!document.hidden) load(false); });

/* 261019 ?srv=qa 띠 · 화면 맨 위에 늘(입장 화면 · 확인 창 위에도) · 운영 주소에는 만들지 않는다 */
function qaBand(){ if(!BE_QA||el("qaBand")) return; var b=document.createElement("div"); b.id="qaBand"; b.className="qa-band"; b.setAttribute("role","status");
  b.innerHTML='<b>시험 서버(hi-qa)</b><span>운영 데이터가 아닙니다 · 주소에서 ?srv=qa 를 지우면 운영</span>'; document.body.insertBefore(b, document.body.firstChild); document.body.classList.add("qa"); try{ document.title="[시험] "+document.title; }catch(e){} }
/* ── 4. 로그인 · 잠금 ── */
/* 261017 입장 화면 · 들어가기 · 비밀번호 정하기 · 바꾸기는 auth.js(lockUI · unlock · pwDetect · pwChangeAsk) · 옛 서버면 사번 + 관리코드 그대로 */
function lock(msg){ setTok(""); S.me=null; PWM.set=null; el("lock").hidden=false; lockUI(msg); }
function boot(){
  whoHook();
  el("envTx").textContent=envName();
  qaBand();
  routeFromHash();
  pwDetect(function(){
    if(!tok()){ lock(""); return; }
    call("adm_me",{}).then(function(r){
      if(r&&r.ok&&r.role==="admin"){ S.me=meOf(r,aemp()); start(); }
      else if(r&&r.err==="unknown action"){ S.me={ emp:aemp() }; start(); }
      else if(r&&(r.reason==="network"||r.reason==="timeout")){ S.me={ emp:aemp() }; start(); }
      else lock("다시 들어옵니다.");
    });
  });
}
function start(){ el("lock").hidden=true; render(); load(true); }

/* ── 5. 확인 창 · 261016 PIN 없음 ──
 * o = { t 제목(동사형 질문) · who 대상 한 줄 · sub 영향 한 줄 · body 추가 html · ok 단추 이름 · danger · gate() 단추 조건(확인 문구 등)
 *       run() → Promise(res) · done(res) · fail(res) → 창에 이유 } */
var DLG={ o:null, busy:false, ret:null };
var DLG_BACK=["app","drw","toasts"];   /* 261017 확인 창이 열리면 뒤(본문 · 서랍 · 토스트) 전부 누르지 못함 */
function dlgBack(on){ DLG_BACK.forEach(function(id){ var x=el(id); if(x) x.inert=!!on; }); }
function confirmBox(o){
  if(DLG.o&&DLG.busy) return;   /* 261017 처리 중인 창 위에 새 창을 덮지 않는다(두 번 눌림) */
  DLG.o=o; DLG.busy=false; DLG.ret=document.activeElement;
  var bg=el("dlg");
  el("dlgCard").innerHTML='<h3 id="dlgT">'+esc(o.t)+'</h3>'+
    (o.who?'<div class="who"><b>'+esc(o.who)+'</b>'+(o.sub?'<span>'+esc(o.sub)+'</span>':'')+'</div>':'')+
    (o.body||"")+'<div class="err" id="dlgErr" role="alert"></div>'+
    '<div class="acts"><button class="btn" type="button" id="dlgNo">닫기</button><button class="btn '+(o.danger?"dng fill":"pri")+'" type="button" id="dlgOk">'+esc(o.ok)+'</button></div>';
  el("dlgNo").onclick=dlgClose; el("dlgOk").onclick=dlgGo;
  bg.hidden=false; requestAnimationFrame(function(){ bg.classList.add("on"); });
  dlgBack(true); el("dlgCard").removeAttribute("aria-busy");
  gateUpd();
  setTimeout(function(){ var f=o.focus&&el(o.focus); (f||el(o.danger?"dlgNo":"dlgOk")).focus(); },40);
}
function gateUpd(){ var ok=el("dlgOk"); if(!ok||!DLG.o) return; var g=!DLG.o.gate||DLG.o.gate(); ok.setAttribute("aria-disabled",g?"false":"true"); return g; }
function dlgGo(){
  var o=DLG.o; if(!o||DLG.busy) return;
  if(!gateUpd()) return;
  DLG.busy=true; var ok=el("dlgOk"), no=el("dlgNo"), card=el("dlgCard"), lab=ok.textContent; ok.textContent="처리 중"; ok.setAttribute("aria-disabled","true"); no.setAttribute("aria-disabled","true"); card.setAttribute("aria-busy","true");
  var fin=function(res){
    DLG.busy=false; no.removeAttribute("aria-disabled"); card.removeAttribute("aria-busy");
    if(res&&res.ok){ var d=o.done; dlgClose(true); d&&d(res); return; }
    ok.textContent=lab;
    var em=(o.fail?o.fail(res):"")||("처리하지 못했습니다 · "+why(res));
    el("dlgErr").textContent=em; toast(em,{ bad:1, ms:6000 }); gateUpd();
  };
  Promise.resolve(o.run({})).then(fin,function(){ fin({ ok:false, reason:"network" }); });
}
function dlgClose(force){
  if(DLG.busy&&force!==true) return;
  var bg=el("dlg"); bg.classList.remove("on"); DLG.o=null; dlgBack(false);
  setTimeout(function(){ if(!bg.classList.contains("on")){ bg.hidden=true; el("dlgCard").innerHTML=""; } },180);
  var r=DLG.ret; DLG.ret=null; if(r&&r.focus&&document.body.contains(r)) r.focus();
}
document.addEventListener("keydown",function(e){
  if(!DLG.o) { if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||"")&&authed()){ e.preventDefault(); el("gq").focus(); } return; }
  if(e.key==="Escape"){ e.preventDefault(); dlgClose(); return; }
  var tg=(e.target||{}).tagName;
  if(e.key==="Enter"&&tg!=="TEXTAREA"&&tg!=="BUTTON"){ e.preventDefault(); dlgGo(); }
});
document.addEventListener("click",function(e){ if(e.target===el("dlg")) dlgClose(); });

/* ── 6. 토스트 · 되돌리기(7초) ── */
function toast(msg, o){
  o=o||{}; var box=el("toasts"), d=document.createElement("div");
  d.className="toast"+(o.bad?" bad":""); d.setAttribute("role","status");
  d.innerHTML='<span>'+esc(msg)+'</span>'+(o.undo?'<button type="button">되돌리기</button>':'');
  box.appendChild(d); while(box.children.length>3) box.removeChild(box.firstChild);
  requestAnimationFrame(function(){ d.classList.add("on"); });
  var gone=function(){ d.classList.remove("on"); setTimeout(function(){ d.remove(); },200); };
  if(o.undo) d.querySelector("button").onclick=function(){ gone(); o.undo(); };
  setTimeout(gone,o.undo?7000:(o.ms||2800));
}

/* ── 7. 부품 · 숫자 카드 · 행 · 상태 ── */
/* k = { l 라벨 · v 값 · u 단위 · st(ok|warn|bad|off) · stt 상태 글자 · s 기준 한 줄 · go 누르면 갈 곳(없으면 단추 아님) · old 마지막 값(회색) } */
function kpi(k){
  var tagN=k.go?"button":"div", st=k.st||"";
  return '<'+tagN+(k.go?' type="button" onclick="'+k.go+'"':'')+' class="kpi '+st+(k.old?" old stale":"")+'"><span class="l">'+esc(k.l)+'</span><span class="v">'+esc(k.v)+(k.u?'<em>'+esc(k.u)+'</em>':'')+'</span><span class="s">'+(k.stt?stt(st||"off",k.stt)+" · ":"")+esc(k.s||"")+'</span></'+tagN+'>';
}
function rowH(title, sub, right){ return '<div class="row"><div class="t"><b>'+esc(title)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</div>'+(right||"")+'</div>'; }
function skel(){ return '<div class="skel" aria-label="불러오는 중"><i></i><i></i><i></i></div>'+(S.ui.slow?'<div class="cap">불러오는 중 · 오래 걸립니다</div>':''); }
function emptyH(msg, btn){ return '<div class="empty"><b>'+esc(msg)+'</b>'+(btn||"")+'</div>'; }
function band(c, msg, btn){ return '<div class="band '+c+'">'+msg+(btn||"")+'</div>'; }
function laterH(what){ return '<div class="later"><b>서버 갱신 뒤</b> · '+esc(what)+'</div>'; }
/* 데이터 상태 한 번에 · 반환 null = 그릴 수 있음 · 아니면 대신 그릴 html */
function dataGate(k, label){
  var d=S.data[k], e=S.err[k];
  if(!d&&!e) return skel();
  if(!d&&e) return band("warn","받지 못했습니다 · "+esc(why(e)),'<button class="btn sm" type="button" onclick="reload([\''+k+'\'])">다시 시도</button>');
  if(unknownSrv(d)) return band("info","이 서버는 아직 "+esc(label||"이 기능")+"을 모릅니다 · 서버 갱신 뒤");
  if(d&&d.ok===false) return band("warn","받지 못했습니다 · "+esc(why(d)),'<button class="btn sm" type="button" onclick="reload([\''+k+'\'])">다시 시도</button>');
  return null;
}
function errTop(k){ return S.err[k]&&S.data[k]?band("warn","받지 못했습니다 · "+esc(why(S.err[k]))+" · 마지막 값을 회색으로 둡니다",'<button class="btn sm" type="button" onclick="reload([\''+k+'\'])">다시 시도</button>'):""; }

/* ── 8. 틀 · 상단 띠 · 하단 탭 7(고정 · 261021 처리함 · 알림 탭 걷음 · 사람 → 명단 · 무대 → 행운권) · 화면 ── */
var IC=(function(){ var s=function(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>'; };
  return { now:s('<path d="M3 12h4l3-8 4 16 3-8h4"/>'), inbox:s('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'), people:s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.6A6.5 6.5 0 0 1 21.5 20"/>'),
    prize:s('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'), stage:s('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
    meet:s('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2.5v3M16 2.5v3M8 14h3M13 14h3M8 17.5h3"/>'),
    ckin:s('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8.5 12.2l2.4 2.4 4.8-5"/>'),   /* 261020 체크인 탭 */
    att:s('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4"/><path d="M8.5 12.8l2.3 2.3 4.7-4.8"/>'),   /* 261022 출석 탭(attn.js) */
    notify:s('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'), log:s('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>') }; })();
var TABS=[["now","홈","홈"],["people","명단","명단"],["meet","미팅","미팅"],["ckin","체크인","체크인"],["att","출석","출석"],["prize","경품 · 재고","경품"],["stage","행운권","행운권"],["log","설정","설정"]];   /* 261021 사용자 · 처리함 걷음(체크인존 · 참여상 = 체크인 탭 · 비밀번호 초기화 = 명단 탭 · 스태프 요청 폐지) · 알림 = 설정 탭 칩 */
var SCREENS={};
/* 261021 옛 주소 옮기기 · #inbox/ck · fx = 체크인 · #inbox/pw = 명단 › 비밀번호 초기화 · #inbox/req = 지금 · #notify/x = 설정 › 알림(x) · #people/visit 등 = 명단 › 목록(구분) · 10F · 17F 출석 = 명단 › 출석 */
var PP_KIND_IDS={ visit:1, gate:1, staff:1, pre10:1, test:1 }, PP_ATT_IDS={ att10:1, att17:1 };
function routeFix(tab, sub){
  sub=sub==null?"":String(sub);
  if(tab==="inbox") return ({ ck:["ckin"], fx:["ckin"], pw:["people","pw"], req:["now"], cchat:["meet","cc"], lounge:["meet","ln"] })[sub]||["ckin"];
  if(tab==="notify"){ if(sub) S.sub.notify=sub; return ["log","ntf"]; }
  if(tab==="people"&&PP_KIND_IDS[sub]){ S.ui.ppk=sub; return ["people","roll"]; }
  if(tab==="people"&&PP_ATT_IDS[sub]){ S.ui.ppa=sub; return ["people","att"]; }
  return null;
}
function isTop(){ return typeof adrTop==="function"?adrTop():!!(S.me&&S.me.top); }   /* 슈퍼관리자 본인(서버 admTop_ 와 같은 기준) */
function go(tab, sub){ var rf=routeFix(tab, sub); if(rf){ tab=rf[0]; sub=rf.length>1?rf[1]:""; } if(!SCREENS[tab]) tab="now"; if(sub!=null) S.sub[tab]=sub; var ch=S.tab!==tab; S.tab=tab; hashSet(); render(); load(false); if(ch) el("main").scrollTop=0; }
function goSub(sub){ if(S.tab==="log"&&S.sub.log==="ntf"&&typeof NT_SUBS!=="undefined"&&NT_SUBS.some(function(x){ return x[0]===sub; })){ S.sub.notify=sub; hashSet(); render(); load(false); return; } go(S.tab, sub); }   /* 261021 설정 › 알림 안 칩 = S.sub.notify */
function hashOf(){ return "#"+S.tab+(S.sub[S.tab]?"/"+S.sub[S.tab]:"")+(S.tab==="log"&&S.sub.log==="ntf"&&S.sub.notify?"/"+S.sub.notify:""); }
function hashSet(){ var h=hashOf(); if(location.hash===h) return; if(typeof bkNav==="function") bkNav(h); else try{ history.replaceState(history.state,"",h); }catch(e){} }   /* 261022 기기 뒤로 가기 = back.js(탭 · 칩 바꿈은 누른 직후 한 칸 · 같은 탭 · 갱신은 칸 안 늘어남) */
function routeFromHash(){ var m=String(location.hash||"").replace(/^#/,"").split("/");
  if(m[0]==="inbox"&&(m[1]==="cchat"||m[1]==="lounge")){ m=["meet",m[1]==="cchat"?"cc":"ln"]; try{ history.replaceState(null,"","#meet/"+m[1]); }catch(e){} }   /* 261016 밤 옛 처리함 커피챗 · 라운지 주소 = 미팅 탭 */
  if(m[0]==="people"&&m[1]==="idea"){ m=["meet","cc-ideaall"]; try{ history.replaceState(null,"","#meet/cc-ideaall"); }catch(e){} }   /* 261021 옛 사람 › 아이디어 한 줄 주소 = 미팅 › 아이디어(전체) */
  var rf=routeFix(m[0], m[1]?decodeURIComponent(m[1]):""); if(rf){ m=[rf[0], rf[1]||""]; try{ history.replaceState(null,"","#"+m[0]+(m[1]?"/"+m[1]:"")); }catch(e){} }
  if(m[0]==="log"&&m[1]==="ntf"&&m[2]) S.sub.notify=decodeURIComponent(m[2]);
  if(SCREENS[m[0]]){ S.tab=m[0]; if(m[1]) S.sub[m[0]]=decodeURIComponent(m[1]); } }
window.addEventListener("hashchange",function(){ if(typeof bkHcSkip==="function"&&bkHcSkip()) return; routeFromHash(); render(); load(false); });
function stageDim(){ var t=srvNow(); return !(S.data.nb&&S.data.nb.day===S.data.nb.ev&&t.getHours()>=16); }
function tabsPaint(){
  var bdOf={ people:pwCount(), meet:typeof meetCount==="function"?meetCount():0 };
  var h=TABS.map(function(t){ var on=S.tab===t[0], dim=false, bd=bdOf[t[0]]||0;
    return '<button type="button" class="'+(on?"on ":"")+(dim&&!on?"dim":"")+'"'+(on?' aria-current="page"':'')+' onclick="go(\''+t[0]+'\')">'+IC[t[0]]+'<span class="l">'+esc(t[1])+'</span><span class="s">'+esc(t[2])+'</span>'+(bd?'<span class="bd" aria-label="'+(t[0]==="meet"?"칸에 안 놓은 신청 ":"비밀번호 초기화 요청 ")+bd+'건">'+bd+'</span>':'')+'</button>'; }).join("");
  if(el("tabs")._h!==h){ el("tabs")._h=h; el("tabs").innerHTML=h; }
}
/* 261021 명단 탭 배지 = 비밀번호 초기화 요청(열림 · now_board pw) · 스태프 요청은 폐지 */
function pwCount(){ var b=S.data.nb; if(!b||!b.ok) return 0; return num(b.pw); }
function sigCount(){ return typeof nowSignals==="function"?nowSignals().filter(function(x){ return x.st==="warn"||x.st==="bad"; }).length:0; }
function topPaint(){
  var b=S.data.nb, ok=b&&b.ok, er=S.err.nb, busy=Object.keys(S.busy).some(function(k){ return S.busy[k]; });
  var age=S.at.nb?Date.now()-S.at.nb:0, stale=age>60000;
  var srv='<span class="chip-s hide-s"><i class="dot '+(er?"bad":ok?"ok":"")+'"></i>'+(er?"서버 연결 실패":ok?(b.ro?"읽기 전용":"서버 정상"):"연결 중")+'</span>';
  var sg=sigCount();
  var t=busy&&!S.at.nb?"불러오는 중":S.at.nb?(stale?Math.floor(age/60000)+"분 전":hm(S.srvT)+" 갱신"):"";
  var h=srv+'<button type="button" class="chip-s'+(sg?" w":"")+' hide-s" onclick="go(\'now\')">이상 '+sg+'</button>';
  if(el("topL")._h!==h){ el("topL")._h=h; el("topL").innerHTML=h; }
  var r=el("upd"); r.textContent=t||"갱신"; r.className="chip-s"+(stale?" old":"");
}
function render(){
  var sc=SCREENS[S.tab]; if(DRW.k&&!DRW.keep) drwClose(); DRW.keep=0; if(!DRW.k) document.body.classList.remove("drw-on","drw-wide");
  el("view").innerHTML='<div class="ph"><h1>'+esc(sc.title)+'</h1><span class="cap" id="phCap">'+esc(sc.desc)+'</span></div><div id="vb"></div>';
  sc.mount&&sc.mount(el("vb"));
  paint();
}
function paint(){
  var sc=SCREENS[S.tab];
  try{ sc.paint&&sc.paint(el("vb")); }catch(e){ if(window.console) console.error(e); var vb=el("vb"); if(vb&&!el("paintErr")) vb.insertAdjacentHTML("afterbegin",'<div id="paintErr">'+band("bad","화면 일부를 그리지 못했습니다 · "+esc(String(e&&e.message||e)))+'</div>'); }
  topPaint(); tabsPaint();
}
function refreshAll(){ load(true); toast("다시 받는 중"); }
function searchGo(e){ if(e.key!=="Enter") return; var q=el("gq").value.trim(); S.ui.pq=q; go("people","find"); if(typeof peopleQ==="function") peopleQ(q); }
setInterval(function(){ if(authed()) topPaint(); },15000);

/* ── 9. 오른쪽 서랍(공통 · 261016 2단계) · 명단 줄 상세 · 한 사람 카드 · 커피챗(cchat.js)과 같은 모양 · 명단은 늘 전체 폭, 줄을 누르면 여기 ──
 * drwOpen(k 열린 것 이름 · html · o{ g 명단 표(닫으면 고른 줄 풀기) · wide 넓게 · label · close() }) · 같은 k 를 다시 그리면 스크롤 그대로 */
var DRW={ k:"", g:null, close:null, keep:0 };
function drwOpen(k, html, o){
  o=o||{}; var b=el("drw"); if(!b) return;
  var same=DRW.k===k, st=same?b.scrollTop:0;
  if(DRW.g&&DRW.g!==o.g&&DRW.g.sel!=null){ DRW.g.sel=null; XG.paint(DRW.g); }
  DRW.k=k; DRW.g=o.g||null; DRW.close=o.close||null;
  b.className="cc-drawer"+(o.wide?" wide":"")+" on"; b.setAttribute("aria-hidden","false"); b.setAttribute("aria-label",o.label||"상세");
  b.innerHTML=html; b.scrollTop=st;
  document.body.classList.add("drw-on"); document.body.classList.toggle("drw-wide",!!o.wide);   /* 넓은 화면 = 본문을 서랍 폭만큼 줄여 나란히(v2.css) */
}
function drwClose(){
  var b=el("drw"); if(!b) return; var g=DRW.g, c=DRW.close;
  DRW.k=""; DRW.g=null; DRW.close=null; b.classList.remove("on"); b.setAttribute("aria-hidden","true"); document.body.classList.remove("drw-on","drw-wide");
  if(g&&g.sel!=null){ g.sel=null; XG.paint(g); } if(c) c();
}
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&!DLG.o&&DRW.k) drwClose(); });
function drwHead(t, sub, tags){ return '<div class="card"><h2>'+esc(t)+(tags||"")+'<span class="r"><button class="btn sm" type="button" onclick="drwClose()" aria-label="상세 닫기">닫기</button></span></h2>'+(sub?'<div class="cap">'+esc(sub)+'</div>':''); }
/* 명단 줄 상세(공통) · 보이는 열 전부 · 사번이 있으면 「한 사람 카드」 · o.extra(r) 추가 html */
function rowDetail(g, key, o){
  o=o||{}; var r=(g.rows||[]).filter(function(x){ return g.o.key&&String(g.o.key(x))===String(key); })[0];
  if(!r){ drwClose(); return; }
  var cols=xgCols(g).filter(function(c){ return !c.act&&c.t&&!c.noDet; }), w=whoOf(r), emp=w.e, isP=!!(w.e||w.n);
  var kv='<dl class="cc-kv">'+cols.map(function(c){ var v=xgText(c,r); return '<dt>'+esc(c.t)+'</dt><dd>'+(v?esc(v):'<span class="cap">-</span>')+'</dd>'+(c.k==="dept"&&w.t?'<dt>팀 · 지점</dt><dd>'+esc(w.t)+'</dd>':''); }).join("")+'</dl>';
  drwOpen(g.id+":"+key, drwHead(o.title?o.title(r):(isP?w.n||"-":g.o.file||"줄"), (isP?whoSub(r)+" · ":"")+(g.o.file||"명단")+" · 줄 상세", isP?whoFlags(w):"")+kv+(o.extra?o.extra(r):"")+
    (emp&&/^[0-9A-Z]{3,12}$/.test(emp)&&typeof pcOpen==="function"?'<div class="mt"><button class="btn big" type="button" onclick="pcOpen(\''+jq(emp)+'\')">한 사람 카드 열기</button></div>':'')+'</div>', { g:g, label:(g.o.file||"명단")+" 줄 상세" });
}
function copyTx(t, ok){ var done=function(){ toast(ok||"복사했습니다"); };
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(done,function(){ copyOld(t); done(); }); return; } }catch(e){}
  copyOld(t); done(); }
function copyOld(t){ var a=document.createElement("textarea"); a.value=t; a.style.position="fixed"; a.style.opacity="0"; document.body.appendChild(a); a.select(); try{ document.execCommand("copy"); }catch(e){} a.remove(); }

/* ── 10. 사람 표시 · 사번 · 소속 · 이름(261016 밤 사용자 「사람이 나오는 모든 곳에 세 가지」 · 소속 = 부서 단위) ──
 * 표 열 = 사번 · 소속 · 이름(첫 사람 열 자리에) · 좁은 카드 = 두 줄(이름 굵게 + 「사번 · 소속」) · 한 줄 글 = 「사번 · 소속 · 이름」
 * 소속 = 서버 dept(명부 부서 「부서 · 팀」, 없으면 명부 부문)의 앞 칸 = 부서 · 뒤 칸(팀 · 지점)은 줄 상세에만
 * 빈 값 = 콘솔이 받은 다른 명단과 사번으로 맞추고 · 그래도 없으면 서버 명부 찾기(og_gate_find · 읽기)로 채운다 · 없으면 「-」
 * 이름만 있는 줄 = 이름으로 찾고 · 동명이인이면 채우지 않고 「동명이인 n」 · 사번 · 이름이 다 있는데 명부 이름과 다르면 「명부와 다름」
 * 직원 명부 파일은 콘솔에 두지 않는다(공개 저장소) · 늘 서버에서 읽는다 */
var WHO={ e:{}, n:{}, ask:{}, q:[], run:0, used:0, cap:400, pool:{}, pt:0 };
var WHO_PRI={ og_gate_find:3, list_get:2, acct_page:2, roll_list:2, person_card:2 };
function wNm(s){ return String(s==null?"":s).replace(/\s+/g,""); }
function dptU(d){ return String(d==null?"":d).split(" · ")[0].trim(); }
function dptT(d){ var a=String(d==null?"":d).split(" · "); return a.length>1?a.slice(1).join(" · ").trim():""; }
function whoOkE(e){ return /^[0-9A-Z]{3,12}$/.test(e); }
function whoPut(e, n, d, p){
  e=normE(e); if(!whoOkE(e)) return; var o=WHO.e[e]||(WHO.e[e]={ n:"", d:"", p:0, pn:0, r:"" });
  n=String(n==null?"":n).trim(); d=String(d==null?"":d).trim();
  if(n&&(!o.n||p>=o.pn)){ o.n=n; o.pn=p; } if(d&&(!o.d||p>=o.p)){ o.d=d; o.p=p; } if(p>=3&&n) o.r=n;
}
/* 서버 응답에서 사람 줄(emp + name | dept)을 배운다 · 3단계까지 */
function whoLearn(res, a){
  if(!res||res.ok===false) return; var p=WHO_PRI[a]||1;
  var walk=function(o, dep){ if(!o||typeof o!=="object"||dep>3) return;
    if(Array.isArray(o)){ for(var i=0;i<o.length&&i<8000;i++){ var x=o[i]; if(x&&typeof x==="object"){ if(x.emp&&(x.name||x.dept)) whoPut(x.emp, x.name, x.dept, p); if(dep<3) for(var k in x) if(x[k]&&typeof x[k]==="object") walk(x[k], dep+1); } } return; }
    for(var k2 in o) if(o[k2]&&typeof o[k2]==="object") walk(o[k2], dep+1); };
  walk(res, 0);
}
/* 서버 명부 찾기 줄 세우기 · 한 번에 하나 · 같은 것은 한 번만 · 한 화면 열기에 최대 cap 번 */
function whoAsk(kind, v){
  var key=kind+":"+v; if(WHO.ask[key]||WHO.used>=WHO.cap||!authed()) return; WHO.ask[key]=1; WHO.q.push([kind, v]); whoPump();
}
function whoPump(){
  if(WHO.run||!WHO.q.length) return; var j=WHO.q.shift(); WHO.run=1; WHO.used++;
  call("og_gate_find",{ by:"name", q:String(j[1]).slice(0,30) }).then(function(r){
    WHO.run=0; var rs=r&&r.ok&&Array.isArray(r.rows)?r.rows:null;
    if(rs&&j[0]==="n"){ var k=wNm(j[1]); WHO.n[k]=rs.filter(function(x){ return wNm(x.name)===k; }).map(function(x){ return normE(x.emp); }); }
    if(rs&&j[0]==="e"){ var e=normE(j[1]); (WHO.e[e]=WHO.e[e]||{ n:"", d:"", p:0, pn:0, r:"" }).asked=1; }   /* 명부에 없어도 다시 묻지 않는다 */
    if(!rs) setTimeout(function(){ delete WHO.ask[j[0]+":"+j[1]]; },60000);   /* 실패는 1분 뒤 다시 */
    whoRepaint(); whoPump(); });
}
function whoRepaint(){ if(WHO.pt) return; WHO.pt=setTimeout(function(){ WHO.pt=0; if(authed()&&!DLG.o) paint(); },300); }
/* 같은 명단 안에서 이름 맞추기(o.whoPool = list_get 종류 · 그 명단의 부분 집합인 줄만 · 예 체크인 번호 = 옷 명단) */
function whoPoolGet(kind){
  if(PP_KIND_IDS[kind]&&!isTop()) return { busy:0, m:{} };   /* 261021 목록(가입자 등)은 슈퍼관리자만 · 다른 입장은 명부 찾기로 */
  var P=WHO.pool[kind]; if(P&&(P.busy||Date.now()-P.at<300000)) return P.busy?P:P.ok?P:{ busy:0, m:{} };
  WHO.pool[kind]={ busy:1, at:Date.now(), ok:P&&P.ok, m:P&&P.m };
  call("list_get",{ kind:kind }).then(function(r){ var m={};
    if(r&&r.ok&&Array.isArray(r.rows)) r.rows.forEach(function(x){ var k=wNm(x.name), e=normE(x.emp); if(!k||!e) return; m[k]=m[k]||[]; if(m[k].indexOf(e)<0) m[k].push(e); });
    WHO.pool[kind]={ busy:0, at:Date.now(), ok:!!(r&&r.ok), m:m }; whoRepaint(); });
  return P&&P.ok?P:null;
}
function whoByName(n, pool){
  var k=wNm(n); if(!k) return null;
  if(pool){ var P=whoPoolGet(pool); return P&&!P.busy?(P.m[k]||[]):null; }
  if(WHO.n[k]) return WHO.n[k];
  whoAsk("n", n); return null;
}
/* 한 사람 = { e 사번 · n 이름 · d 소속(부서) · t 팀 · 지점 · dup 동명이인 수 · diff 명부와 다름 } */
function whoOf(r){
  r=r||{}; var e=normE(r.emp||""), n=String(r.name||r.nm||"").trim(), d=String(r.dept||"").trim(), dup=0;
  if(!whoOkE(e)) e="";
  if(!e&&n&&!r._noNm){ var hit=whoByName(n, r._wp); if(hit&&hit.length===1) e=hit[0]; else if(hit&&hit.length>1) dup=hit.length; }
  var o=e?WHO.e[e]:null;
  /* 소속은 명부 부서를 쓰는 명단(list_get · 찾기)의 값이 먼저 · 줄에 딸린 부서(부문일 수 있음)는 그다음
   * 없으면 먼저 접속 명단(가입한 사람 전부 · 5분에 한 번) · 거기도 없으면 명부 찾기(한 사람 한 번) · 이름을 사람이 넣는 명단(PIN 분실)은 바로 명부 찾기 */
  if(e&&r._wck&&!(o&&o.asked)) whoAsk("e", e);
  else if(e&&!(o&&o.asked)&&!(o&&o.p>=2)){ var V=whoPoolGet("visit"); if(V&&!V.busy&&!((o=WHO.e[e])&&o.p>=2)) whoAsk("e", e); }
  o=e?WHO.e[e]:null;
  var nn=n||(o&&o.n)||"", dd=(o&&o.p>=2&&o.d)||d||(o&&o.d)||"";
  return { e:e, n:nn, d:dptU(dd), t:dptT(dd), dup:dup, diff:!!(e&&n&&o&&o.r&&wNm(o.r)!==wNm(n)) };
}
function whoFlags(w){ return (w.dup?" "+tag("동명이인 "+w.dup,"warn"):"")+(w.diff?" "+tag("명부와 다름","warn"):""); }
/* 한 줄 글 「사번 · 소속 · 이름」(확인 창 · 서랍) */
function personLine(r){ var w=whoOf(r); return [w.e||"-", w.d||"-", (w.n||"-")+(w.dup?" (동명이인 "+w.dup+")":"")+(w.diff?" (명부와 다름)":"")].join(" · "); }
/* 둘째 줄 「사번 · 소속」 */
function whoSub(r){ var w=whoOf(r); return (w.e||"-")+" · "+(w.d||"-"); }
/* 「사번 · 소속」 html · 줄을 넘기면 「 · 」 자리에서(값은 가르지 않음) */
function whoSubH(r){ var w=whoOf(r); return '<span class="nw">'+esc(w.e||"-")+'</span> <span class="nw">· '+esc(w.d||"-")+'</span>'; }
/* 좁은 카드 두 줄 html · 이름 굵게 + 「사번 · 소속」 작게 */
function personTwo(r, extra){ var w=whoOf(r); return '<span class="who2"><span class="wl"><b class="wn">'+esc(w.n||"-")+'</b>'+whoFlags(w)+(extra||"")+'</span><span class="ws">'+whoSubH(r)+'</span></span>'; }
/* 표 열 · 사번 · 소속 · 이름을 첫 사람 열 자리에 · 이름 열 tags(r) = 이름 뒤 꼬리표 · whoV(r) = 이름 칸 값 바꾸기(여러 명 기록 「n명」) */
function whoCols(cols, o){
  o=o||{}; if(!Array.isArray(cols)||o.noWho) return cols;
  var P={ emp:1, name:1, dept:1 }, by={}, ix=-1;
  cols.forEach(function(c,i){ if(c&&P[c.k]){ by[c.k]=c; if(ix<0) ix=i; } });
  if(ix<0||(by.emp&&by.emp._who)) return cols;
  var N=by.name||{}, E=by.emp||{}, D=by.dept||{}, full=!!o.whoFull;
  var dash=function(s){ return s?esc(s):'<span class="cap">-</span>'; };
  var dv=function(r){ var w=whoOf(r); return full&&w.t?w.d+" · "+w.t:w.d; };
  var ce={ k:"emp", t:"사번", w:E.w||84, _who:1, v:function(r){ return whoOf(r).e; }, f:function(r){ return dash(whoOf(r).e); } };
  var cd={ k:"dept", t:"소속", w:Math.max(D.w||0,full?160:120), _who:1, v:dv, f:function(r){ return dash(dv(r)); } };
  var cn={ k:"name", t:"이름", w:N.w||90, _who:1, v:function(r){ return N.whoV?N.whoV(r):whoOf(r).n; },
    f:function(r){ var w=whoOf(r), t=N.whoV?N.whoV(r):w.n; return (t?esc(t):'<span class="cap">-</span>')+(N.whoV&&N.whoV(r)!==w.n?"":whoFlags(w))+(N.tags?N.tags(r):""); } };
  var out=cols.filter(function(c){ return !(c&&P[c.k]); });
  out.splice(ix,0,ce,cd,cn); return out;
}
/* 서버 열(list_get cols) · 사번 · 소속 · 이름 순서 · 「부서」 → 「소속」 */
function whoSrvCols(sc){
  if(!Array.isArray(sc)) return sc; var P={ emp:1, name:1, dept:1 }, ix=-1, by={};
  sc.forEach(function(c,i){ if(c&&P[c.k]){ by[c.k]=c; if(ix<0) ix=i; } }); if(ix<0) return sc;
  var mk=function(k,n,w){ var c={}, b=by[k]||{}; for(var x in b) c[x]=b[x]; c.k=k; c.n=n; c.w=Math.max(c.w||0,w); return c; };
  var out=sc.filter(function(c){ return !(c&&P[c.k]); }); out.splice(ix,0,mk("emp","사번",84),mk("dept","소속",120),mk("name","이름",80)); return out;
}
/* 표 부품(table.js)은 고치지 않고 감싼다 · boot 에서 한 번 · 열 정의 · 서버 열 · 줄 · 선택 삭제 이름 */
function whoHook(){
  if(typeof XG==="undefined"||XG._who) return; XG._who=1;
  var mk=XG.make, uc=XG.useCols, st=XG.set;
  XG.make=function(o){ if(o&&o.cols) o.cols=whoCols(o.cols, o); return mk.apply(this, arguments); };
  XG.useCols=function(g, sc){ var r=uc.call(this, g, whoSrvCols(sc)); if(!g.o.noWho) g.o.cols=whoCols(g.o.cols, g.o); return r; };
  XG.set=function(g, rows){ if(rows&&g&&g.o&&(g.o.whoPool||g.o.whoCheck)) rows.forEach(function(r){ if(r&&typeof r==="object"){ if(g.o.whoPool) r._wp=g.o.whoPool; if(g.o.whoCheck) r._wck=1; } }); return st.apply(this, arguments); };
  if(typeof xgWho==="function") xgWho=function(r){ return personLine(r); };
}

/* 261021 CSV 수식 주입 방지 · CSV 로 내려받는 모든 칸은 csvCell 을 거친다(= + - @ 탭 CR 로 시작하면 앞에 ' · 순수 숫자 -12 · 0012 는 그대로) */
function csvCell(v){ if(v==null) return ""; if(typeof v==="number") return String(v); var s=String(v); if(/^[=+\-@\t\r]/.test(s)&&!/^-?\d+(\.\d+)?$/.test(s)) s="'"+s; return s; }
