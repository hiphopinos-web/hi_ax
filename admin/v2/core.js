/* AXF CONTROL v2 · 공통 (261016 콘솔 재구축 화면 1단계)
 * 서버 호출 · 로그인 · 확인 창 · 토스트 · 화면 틀(상단 띠 · 하단 탭 7) · 숫자 카드 · 행 목록 · 상태(불러오는 중 · 빈 · 오류 · 서버 갱신 뒤)
 * 서버 경로 · 로그인(admin_check) · 토큰 저장 키는 지금 콘솔(admin/index.html)과 같다. 관리코드는 저장하지 않는다.
 * 261016 사용자 「로그인하고 나면 쓸데없는 PIN 번호 넣는 일을 없애줘」 · 사번 + 관리코드로 들어온 뒤에는 어떤 동작에도 PIN 을 묻지 않는다. 되돌리기 어려운 동작은 확인 창 · 확인 문구로 막는다.
 * 서버 계약(디자인 시안/콘솔 재구축/3_서버 계약.md)이 아직 없는 기능은 화면에 「서버 갱신 뒤」로 비워 둔다(가짜 숫자 없음). */
var BE_DEFAULT="https://script.google.com/macros/s/AKfycbwjCaSSUnQ7W1lrM8T426Cn_LgKs_UhI0Qi5XRVk-_eF-oD55-Wwjsot0DkPJCX9JqMBA/exec";
function beUrlOk(u){ return typeof u==="string"&&/^https:\/\/([a-z0-9-]+\.[a-z0-9-]+\.workers\.dev|script\.google\.com\/macros\/s\/[\w-]{20,})\/exec$/.test(u); }
var BE=beUrlOk(typeof AXF_SERVER==="string"?AXF_SERVER:"")?AXF_SERVER:BE_DEFAULT;
if(typeof AXF_SERVER==="string"&&/^http:\/\/127\.0\.0\.1:\d+\/exec$/.test(AXF_SERVER)) BE=AXF_SERVER;   /* 로컬 QA 서버(QA/local.mjs · 127.0.0.1 만) */
else if(/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) BE="http://127.0.0.1:9/exec";   /* 로컬에서 서버 주소를 못 받으면 원격 기본값(옛 서버)으로 가지 않고 실패로 둔다 */
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
function lsGet(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function aemp(){ try{ return sessionStorage.getItem("axf_adm_emp")||""; }catch(e){ return window.__e||""; } }
function setAemp(v){ try{ sessionStorage.setItem("axf_adm_emp",v||""); }catch(e){ window.__e=v||""; } }
function tok(){ try{ return sessionStorage.getItem("axf_adm_tok")||""; }catch(e){ return window.__t||""; } }
function setTok(v){ try{ sessionStorage.setItem("axf_adm_tok",v||""); }catch(e){ window.__t=v||""; } }
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
    if(res&&res.ok===false&&res.reason==="auth"&&action!=="admin_check"){ lock("관리코드가 바뀌었거나 명단에서 빠졌습니다. 다시 입력합니다."); }
    return res||{ ok:false, reason:"network" };
  }).catch(function(){ clearTimeout(timer); NET.push({ t:Date.now(), ms:Date.now()-t0, ok:false }); return { ok:false, reason:to?"timeout":"network" }; });
}
function why(r){
  r=r||{}; var m={ network:"서버에 연결하지 못했습니다", timeout:"응답이 늦습니다", auth:"관리코드가 맞지 않습니다", spin:"서버 갱신 전입니다 · 서버가 바뀐 뒤 됩니다",
    pinwho:"사번으로 다시 들어온 뒤 합니다", post:"POST 로 보내야 합니다", state:"다른 사람이 먼저 처리했습니다", taken:"그 시간에 이미 다른 신청이 있습니다", dup:"같은 사람의 다른 신청이 있습니다", notfound:"찾지 못했습니다", param:"입력값을 확인합니다", ro:"읽기 전용 상태입니다", busy:"서버가 바쁩니다 · 잠시 뒤", locked:"잠겨 있습니다" };
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

/* ── 4. 로그인 · 잠금 ── */
function lock(msg){ setTok(""); S.me=null; el("lock").hidden=false; el("lockErr").textContent=msg||""; if(aemp()) el("aemp").value=aemp(); setTimeout(function(){ el(aemp()?"key":"aemp").focus(); },30); }
function unlock(){
  var e=normE(el("aemp").value), v=el("key").value.trim();
  if(!e){ el("lockErr").textContent="사번을 넣습니다."; el("aemp").focus(); return; }
  if(!v){ el("lockErr").textContent="관리코드를 넣습니다."; el("key").focus(); return; }
  el("lockErr").textContent="확인 중";
  call("admin_check",{ key:v, aemp:e, asc:"c", tok:"" },25000).then(function(r){
    el("key").value="";
    if(r&&r.ok&&r.role==="admin"){ setAemp(e); setTok(r.tok||""); S.me={ emp:r.emp||e, name:r.name||"" }; el("lock").hidden=true; el("lockErr").textContent=""; start(); }
    else if(r&&r.ok&&r.role==="grade") el("lockErr").textContent="등급코드입니다. 이 콘솔은 관리코드로 들어옵니다.";
    else if(r&&r.reason==="locked") el("lockErr").textContent="여러 번 틀려 잠겼습니다. 잠시 뒤 다시 합니다.";
    else if(r&&(r.reason==="network"||r.reason==="timeout")) el("lockErr").textContent="서버에 연결하지 못했습니다.";
    else el("lockErr").textContent="명단에 없는 사번이거나 관리코드가 맞지 않습니다.";
  });
}
function boot(){
  el("aemp").addEventListener("keydown",function(e){ if(e.key==="Enter"){ if(el("key").value) unlock(); else el("key").focus(); } });
  el("key").addEventListener("keydown",function(e){ if(e.key==="Enter") unlock(); });
  el("lockGo").onclick=unlock;
  el("envTx").textContent=envName();
  routeFromHash();
  if(!tok()){ lock(""); return; }
  call("adm_me",{}).then(function(r){
    if(r&&r.ok&&r.role==="admin"){ S.me={ emp:r.emp||aemp(), name:r.name||"" }; start(); }
    else if(r&&r.err==="unknown action"){ S.me={ emp:aemp() }; start(); }
    else if(r&&(r.reason==="network"||r.reason==="timeout")){ S.me={ emp:aemp() }; start(); }
    else lock("다시 들어옵니다.");
  });
}
function start(){ el("lock").hidden=true; render(); load(true); }

/* ── 5. 확인 창 · 261016 PIN 없음 ──
 * o = { t 제목(동사형 질문) · who 대상 한 줄 · sub 영향 한 줄 · body 추가 html · ok 단추 이름 · danger · gate() 단추 조건(확인 문구 등)
 *       run() → Promise(res) · done(res) · fail(res) → 창에 이유 } */
var DLG={ o:null, busy:false, ret:null };
function confirmBox(o){
  DLG.o=o; DLG.busy=false; DLG.ret=document.activeElement;
  var bg=el("dlg");
  el("dlgCard").innerHTML='<h3 id="dlgT">'+esc(o.t)+'</h3>'+
    (o.who?'<div class="who"><b>'+esc(o.who)+'</b>'+(o.sub?'<span>'+esc(o.sub)+'</span>':'')+'</div>':'')+
    (o.body||"")+'<div class="err" id="dlgErr" role="alert"></div>'+
    '<div class="acts"><button class="btn" type="button" id="dlgNo">닫기</button><button class="btn '+(o.danger?"dng fill":"pri")+'" type="button" id="dlgOk">'+esc(o.ok)+'</button></div>';
  el("dlgNo").onclick=dlgClose; el("dlgOk").onclick=dlgGo;
  bg.hidden=false; requestAnimationFrame(function(){ bg.classList.add("on"); });
  el("app").inert=true;
  gateUpd();
  setTimeout(function(){ var f=o.focus&&el(o.focus); (f||el(o.danger?"dlgNo":"dlgOk")).focus(); },40);
}
function gateUpd(){ var ok=el("dlgOk"); if(!ok||!DLG.o) return; var g=!DLG.o.gate||DLG.o.gate(); ok.setAttribute("aria-disabled",g?"false":"true"); return g; }
function dlgGo(){
  var o=DLG.o; if(!o||DLG.busy) return;
  if(!gateUpd()) return;
  DLG.busy=true; var ok=el("dlgOk"), lab=ok.textContent; ok.textContent="처리 중"; ok.setAttribute("aria-disabled","true");
  var fin=function(res){
    DLG.busy=false;
    if(res&&res.ok){ var d=o.done; dlgClose(true); d&&d(res); return; }
    ok.textContent=lab;
    el("dlgErr").textContent=(o.fail?o.fail(res):"")||("처리하지 못했습니다 · "+why(res)); gateUpd();
  };
  Promise.resolve(o.run({})).then(fin,function(){ fin({ ok:false, reason:"network" }); });
}
function dlgClose(force){
  if(DLG.busy&&force!==true) return;
  var bg=el("dlg"); bg.classList.remove("on"); DLG.o=null; el("app").inert=false;
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

/* ── 8. 틀 · 상단 띠 · 하단 탭 7(고정) · 화면 ── */
var IC=(function(){ var s=function(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>'; };
  return { now:s('<path d="M3 12h4l3-8 4 16 3-8h4"/>'), inbox:s('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'), people:s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.6A6.5 6.5 0 0 1 21.5 20"/>'),
    prize:s('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'), stage:s('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
    notify:s('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'), log:s('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>') }; })();
var TABS=[["now","지금","지금"],["inbox","처리함","처리함"],["people","사람","사람"],["prize","경품 · 재고","경품"],["stage","무대","무대"],["notify","알림","알림"],["log","기록 · 설정","설정"]];
var SCREENS={};
function go(tab, sub){ if(!SCREENS[tab]) tab="now"; if(sub!=null) S.sub[tab]=sub; var ch=S.tab!==tab; S.tab=tab; hashSet(); render(); load(false); if(ch) el("main").scrollTop=0; }
function goSub(sub){ go(S.tab, sub); }
function hashSet(){ var h="#"+S.tab+(S.sub[S.tab]?"/"+S.sub[S.tab]:""); if(location.hash!==h) try{ history.replaceState(null,"",h); }catch(e){} }
function routeFromHash(){ var m=String(location.hash||"").replace(/^#/,"").split("/"); if(SCREENS[m[0]]){ S.tab=m[0]; if(m[1]) S.sub[m[0]]=decodeURIComponent(m[1]); } }
window.addEventListener("hashchange",function(){ routeFromHash(); render(); load(false); });
function stageDim(){ var t=srvNow(); return !(S.data.nb&&S.data.nb.day===S.data.nb.ev&&t.getHours()>=16); }
function tabsPaint(){
  var bd=inboxCount();
  var h=TABS.map(function(t){ var on=S.tab===t[0], dim=t[0]==="stage"&&stageDim();
    return '<button type="button" class="'+(on?"on ":"")+(dim&&!on?"dim":"")+'"'+(on?' aria-current="page"':'')+' onclick="go(\''+t[0]+'\')">'+IC[t[0]]+'<span class="l">'+esc(t[1])+'</span><span class="s">'+esc(t[2])+'</span>'+(t[0]==="inbox"&&bd?'<span class="bd" aria-label="처리할 일 '+bd+'건">'+bd+'</span>':'')+'</button>'; }).join("");
  if(el("tabs")._h!==h){ el("tabs")._h=h; el("tabs").innerHTML=h; }
}
/* 처리함 배지 = 라운지 신청 + 커피챗 희망 + 스태프 요청 + PIN 분실(체크인존 대기는 줄이라 빼다) */
function inboxCount(){ var b=S.data.nb; if(!b||!b.ok) return 0; return num(b.resv&&b.resv.wait)+num(b.cchat&&b.cchat.wait)+num(b.sreq&&b.sreq.open)+num(b.pw); }
function sigCount(){ return typeof nowSignals==="function"?nowSignals().filter(function(x){ return x.st==="warn"||x.st==="bad"; }).length:0; }
function topPaint(){
  var b=S.data.nb, ok=b&&b.ok, er=S.err.nb, busy=Object.keys(S.busy).some(function(k){ return S.busy[k]; });
  var age=S.at.nb?Date.now()-S.at.nb:0, stale=age>60000;
  var srv='<span class="chip-s hide-s"><i class="dot '+(er?"bad":ok?"ok":"")+'"></i>'+(er?"서버 연결 실패":ok?(b.ro?"읽기 전용":"서버 정상"):"연결 중")+'</span>';
  var sg=sigCount(), rq=ok&&b.sreq?num(b.sreq.open):0;
  var t=busy&&!S.at.nb?"불러오는 중":S.at.nb?(stale?Math.floor(age/60000)+"분 전":hm(S.srvT)+" 갱신"):"";
  var h=srv+'<button type="button" class="chip-s'+(sg?" w":"")+' hide-s" onclick="go(\'now\')">이상 '+sg+'</button><button type="button" class="chip-s'+(rq?" w":"")+'" onclick="go(\'inbox\',\'req\')">요청 '+rq+'</button>';
  if(el("topL")._h!==h){ el("topL")._h=h; el("topL").innerHTML=h; }
  var r=el("upd"); r.textContent=t||"갱신"; r.className="chip-s"+(stale?" old":"");
}
function render(){
  var sc=SCREENS[S.tab]; if(DRW.k&&!DRW.keep) drwClose(); DRW.keep=0;
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
  var cols=xgCols(g).filter(function(c){ return !c.act&&c.t; }), emp=r.emp?normE(r.emp):"";
  var kv='<dl class="cc-kv">'+cols.map(function(c){ var v=xgText(c,r); return '<dt>'+esc(c.t)+'</dt><dd>'+(v?esc(v):'<span class="cap">-</span>')+'</dd>'; }).join("")+'</dl>';
  drwOpen(g.id+":"+key, drwHead(o.title?o.title(r):(r.name||r.emp||g.o.file||"줄"), (g.o.file||"명단")+" · 줄 상세")+kv+(o.extra?o.extra(r):"")+
    (emp&&/^[0-9A-Z]{3,12}$/.test(emp)&&typeof pcOpen==="function"?'<div class="mt"><button class="btn big" type="button" onclick="pcOpen(\''+jq(emp)+'\')">한 사람 카드 열기</button></div>':'')+'</div>', { g:g, label:(g.o.file||"명단")+" 줄 상세" });
}
function copyTx(t, ok){ var done=function(){ toast(ok||"복사했습니다"); };
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(done,function(){ copyOld(t); done(); }); return; } }catch(e){}
  copyOld(t); done(); }
function copyOld(t){ var a=document.createElement("textarea"); a.value=t; a.style.position="fixed"; a.style.opacity="0"; document.body.appendChild(a); a.select(); try{ document.execCommand("copy"); }catch(e){} a.remove(); }
