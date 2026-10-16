/* AXF CONTROL v2 · 공통 (261016 콘솔 재구축 화면 1단계)
 * 서버 호출 · 로그인 · 확인 창(PIN 매번) · 토스트 · 화면 틀(상단 띠 · 하단 탭 7) · 숫자 카드 · 행 목록 · 상태(불러오는 중 · 빈 · 오류 · 서버 갱신 뒤)
 * 서버 경로 · 로그인(admin_check) · 토큰 저장 키는 지금 콘솔(admin/index.html)과 같다. 관리코드 · PIN · 해시는 저장하지 않는다.
 * PIN = 위험 동작만 · 확인 창에서 매번 받는다(유지 시간 없음 · 261014 결정). 받은 PIN 은 그 한 번의 요청에만 쓴다.
 * 서버 계약(디자인 시안/콘솔 재구축/3_서버 계약.md)이 아직 없는 기능은 화면에 「서버 갱신 뒤」로 비워 둔다(가짜 숫자 없음). */
var BE_DEFAULT="https://script.google.com/macros/s/AKfycbwjCaSSUnQ7W1lrM8T426Cn_LgKs_UhI0Qi5XRVk-_eF-oD55-Wwjsot0DkPJCX9JqMBA/exec";
function beUrlOk(u){ return typeof u==="string"&&/^https:\/\/([a-z0-9-]+\.[a-z0-9-]+\.workers\.dev|script\.google\.com\/macros\/s\/[\w-]{20,})\/exec$/.test(u); }
var BE=beUrlOk(typeof AXF_SERVER==="string"?AXF_SERVER:"")?AXF_SERVER:BE_DEFAULT;
if(typeof AXF_SERVER==="string"&&/^http:\/\/127\.0\.0\.1:\d+\/exec$/.test(AXF_SERVER)) BE=AXF_SERVER;   /* 로컬 QA 서버(QA/local.mjs · 127.0.0.1 만) */
else if(/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) BE="http://127.0.0.1:9/exec";   /* 로컬에서 서버 주소를 못 받으면 원격 기본값(옛 서버)으로 가지 않고 실패로 둔다 */
var OLD_URL="../";   /* 지금 콘솔 · 이번 단계에서 옮기지 않은 일은 여기서 */
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

/* ── 2. 서버 호출 · POST 폼 본문 · 주소에 tok · sp 가 남지 않는다(지금 콘솔과 같은 계약) ── */
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
  r=r||{}; var m={ network:"서버에 연결하지 못했습니다", timeout:"응답이 늦습니다", auth:"관리코드가 맞지 않습니다", spin:"PIN 확인이 필요합니다", pin:"PIN 이 맞지 않습니다", pinlock:"여러 번 틀려 잠겼습니다",
    nopin:"앱에서 이 사번으로 로그인해 PIN 을 정한 뒤 다시 합니다", pinwho:"사번으로 다시 들어온 뒤 합니다", post:"POST 로 보내야 합니다", state:"다른 사람이 먼저 처리했습니다", taken:"그 시간에 이미 다른 신청이 있습니다", dup:"같은 사람의 다른 신청이 있습니다", notfound:"찾지 못했습니다", param:"입력값을 확인합니다", ro:"읽기 전용 상태입니다", busy:"서버가 바쁩니다 · 잠시 뒤", locked:"잠겨 있습니다" };
  if(r.err==="unknown action") return "이 서버는 아직 이 기능을 모릅니다";
  if(r.reason==="pin") return "PIN 이 맞지 않습니다"+(r.left!=null?" · 남은 횟수 "+r.left:"");
  if(r.reason==="pinlock") return "잠겼습니다"+(r.retry?" · "+Math.max(1,Math.ceil(num(r.retry)/60))+"분 뒤":"");
  return m[r.reason]||r.msg||r.reason||r.err||"처리하지 못했습니다";
}
function unknownSrv(r){ return !!(r&&r.ok===false&&(r.err==="unknown action"||r.reason==="unknown")); }
function pinHash(emp, pin){
  if(!(window.crypto&&crypto.subtle&&window.TextEncoder)) return Promise.reject(new Error("https"));
  return crypto.subtle.digest("SHA-256",new TextEncoder().encode("AXF26:"+emp+":"+pin)).then(function(buf){ var b=new Uint8Array(buf),o=""; for(var i=0;i<b.length;i++) o+=("0"+b[i].toString(16)).slice(-2); return o; });
}
/* 서버 계약(3_서버 계약.md 0절) · 위험 동작 = 그 요청에 ph(본인 앱 PIN 해시)를 같이 POST · 유지 시간 없음
 * 옛 서버(ph 를 모름 · spin 으로 거절)면 같은 해시로 adm_pin → 그 한 번에만 sp 를 붙여 다시 보낸다 */
function myPh(pin){ return pinHash((S.me&&S.me.emp)||aemp(), pin); }
function phToSp(ph){ return call("adm_pin",{ h:ph }).then(function(r){ return r&&r.ok&&r.sp?{ ok:true, sp:r.sp }:{ ok:false, r:r }; }); }
/* 옛 서버가 읽기에도 PIN(sp)을 요구할 때 · 읽기 전용으로만 서버 수명 동안 쓴다(위험 동작은 이 값을 쓰지 않고 매번 묻는다) · 서버 갱신 뒤 필요 없음 */
var READ_SP={ sp:"", until:0 };
function readSp(){ return READ_SP.sp&&Date.now()<READ_SP.until?READ_SP.sp:""; }

/* ── 3. 상태 · 불러오기 ── */
var S={ me:null, tab:"now", sub:{}, data:{}, at:{}, err:{}, busy:{}, sig:{}, srvT:"", srvAt:0, ui:{}, lg:null };   /* lg = 서버 list_get 을 아는지(null 모름 · true · false) */
/* 명단 한 장 · 새 서버면 list_get(kind) · 모르는 서버면 옛 액션(old = { a, p, rd }) */
function lgNeed(k, kind, old, ttl){ if(S.lg===false||!kind) return { k:k, a:old.a, p:old.p, rd:old.rd, ttl:ttl||60000 }; return { k:k, a:"list_get", p:{ kind:kind }, ttl:ttl||60000 }; }
function lgRows(k, g, oldRows){
  var d=S.data[k]; if(!d||d.ok===false) return null;
  if(d.kind!=null&&Array.isArray(d.rows)){ S.lg=true; XG.useCols(g, d.cols); if(!g.o.chips0){ g.o.chips0=g.o.chips; g.o.chips=[["all","전체",null]]; g.chip="all"; } return d.rows; }
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
    if(n.rd&&readSp()) p.sp=readSp();
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

/* ── 5. 확인 창 · 위험 동작은 같은 창 안에서 PIN 4칸(매번) ──
 * o = { t 제목(동사형 질문) · who 대상 한 줄 · sub 영향 한 줄 · body 추가 html · ok 단추 이름 · danger · pin(true = PIN 받기) · gate() 단추 조건
 *       run(pp) → Promise(res) · pp = 요청에 더할 값({} | { ph } | 옛 서버 { ph, sp }) · done(res) · fail(res) → 창에 이유 }
 * 서버가 PIN 을 요구하면(reason spin) 같은 창을 PIN 칸으로 바꿔 한 번 더 받는다(옛 서버 · 갱신 전 L2 동작). */
var DLG={ o:null, pin:"", busy:false, ret:null };
function confirmBox(o){
  DLG.o=o; DLG.pin=""; DLG.busy=false; DLG.ret=document.activeElement;
  var bg=el("dlg");
  el("dlgCard").innerHTML='<h3 id="dlgT">'+esc(o.t)+'</h3>'+
    (o.who?'<div class="who"><b>'+esc(o.who)+'</b>'+(o.sub?'<span>'+esc(o.sub)+'</span>':'')+'</div>':'')+
    (o.body||"")+'<div id="dlgPin"></div><div class="err" id="dlgErr" role="alert"></div>'+
    '<div class="acts"><button class="btn" type="button" id="dlgNo">닫기</button><button class="btn '+(o.danger?"dng fill":"pri")+(o.pin?" lock":"")+'" type="button" id="dlgOk">'+esc(o.ok)+'</button></div>';
  if(o.pin) pinUi();
  el("dlgNo").onclick=dlgClose; el("dlgOk").onclick=dlgGo;
  bg.hidden=false; requestAnimationFrame(function(){ bg.classList.add("on"); });
  el("app").inert=true;
  gateUpd();
  setTimeout(function(){ var f=o.focus&&el(o.focus); (f||el(o.pin?"dlgOk":"dlgNo")).focus(); },40);
}
function pinUi(note){
  var h='<div class="pinw"><div class="lb">'+esc(note||"앱 로그인 PIN 4자리")+'</div><div class="pin" id="pinC" aria-label="PIN 4자리 · 입력한 자리 수 0">'+[0,1,2,3].map(function(i){ return '<i'+(i===0?' class="cur"':'')+'></i>'; }).join("")+'</div>'+
    '<div class="pad">'+[1,2,3,4,5,6,7,8,9].map(function(d){ return '<button type="button" data-d="'+d+'">'+d+'</button>'; }).join("")+'<button type="button" class="fn" data-d="c">모두 지움</button><button type="button" data-d="0">0</button><button type="button" class="fn" data-d="b">한 칸 지움</button></div></div>';
  el("dlgPin").innerHTML=h; DLG.needPin=true;
  [].forEach.call(el("dlgPin").querySelectorAll(".pad button"),function(b){ b.onclick=function(){ pinKey(b.getAttribute("data-d")); }; });
  if(el("dlgOk")) el("dlgOk").classList.add("lock");
}
function pinKey(d){
  if(DLG.busy) return;
  if(d==="c") DLG.pin=""; else if(d==="b") DLG.pin=DLG.pin.slice(0,-1); else if(/^\d$/.test(d)&&DLG.pin.length<4) DLG.pin+=d;
  var c=el("pinC"); if(!c) return;
  [].forEach.call(c.children,function(x,i){ x.textContent=i<DLG.pin.length?"●":""; x.className=i===DLG.pin.length?"cur":""; });
  c.setAttribute("aria-label","PIN 4자리 · 입력한 자리 수 "+DLG.pin.length);
  el("dlgErr").textContent=""; gateUpd();
}
function gateUpd(){ var ok=el("dlgOk"); if(!ok||!DLG.o) return; var g=(!DLG.needPin||DLG.pin.length===4)&&(!DLG.o.gate||DLG.o.gate()); ok.setAttribute("aria-disabled",g?"false":"true"); return g; }
function dlgGo(){
  var o=DLG.o; if(!o||DLG.busy) return;
  if(!gateUpd()){ if(DLG.needPin&&DLG.pin.length<4) el("dlgErr").textContent="PIN 4자리를 넣습니다"; return; }
  DLG.busy=true; var ok=el("dlgOk"), lab=ok.textContent; ok.textContent="처리 중"; ok.setAttribute("aria-disabled","true");
  var ph="", spTried=false;
  var fin=function(res){
    if(res&&res.reason==="spin"&&ph&&!spTried){ spTried=true;   /* 옛 서버 · 같은 해시로 본인 확인 → 이 한 번만 sp */
      phToSp(ph).then(function(x){ if(x.ok) go({ ph:ph, sp:x.sp }); else { spTried=true; fin(x.r||{ ok:false }); } }); return; }
    DLG.busy=false;
    if(res&&res.ok){ var d=o.done; dlgClose(true); d&&d(res); return; }
    if(res&&res.reason==="spin"&&!DLG.needPin){ ok.textContent=lab; pinUi("이 동작은 PIN 을 받습니다 · 앱 PIN 4자리"); el("dlgErr").textContent=res.big?"전체급 발송 · 약 "+n0(res.reach)+"명":""; gateUpd(); return; }
    ok.textContent=lab; if(DLG.needPin) pinKey("c");
    el("dlgErr").textContent=(o.fail?o.fail(res):"")||("처리하지 못했습니다 · "+why(res)); gateUpd();
  };
  var go=function(pp){ Promise.resolve(o.run(pp||{})).then(fin,function(){ fin({ ok:false, reason:"network" }); }); };
  if(DLG.needPin){ var pin=DLG.pin; DLG.pin=""; myPh(pin).then(function(h){ ph=h; go({ ph:h }); },function(){ fin({ ok:false, msg:"https 주소에서 엽니다", reason:"https" }); }); }
  else go({});
}
function dlgClose(force){
  if(DLG.busy&&force!==true) return;
  var bg=el("dlg"); bg.classList.remove("on"); DLG.o=null; DLG.pin=""; DLG.needPin=false; el("app").inert=false;
  setTimeout(function(){ if(!bg.classList.contains("on")){ bg.hidden=true; el("dlgCard").innerHTML=""; } },180);
  var r=DLG.ret; DLG.ret=null; if(r&&r.focus&&document.body.contains(r)) r.focus();
}
document.addEventListener("keydown",function(e){
  if(!DLG.o) { if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||"")&&authed()){ e.preventDefault(); el("gq").focus(); } return; }
  if(e.key==="Escape"){ e.preventDefault(); dlgClose(); return; }
  var tg=(e.target||{}).tagName;
  if(DLG.needPin&&tg!=="INPUT"&&tg!=="TEXTAREA"){ if(/^\d$/.test(e.key)){ e.preventDefault(); pinKey(e.key); return; } if(e.key==="Backspace"){ e.preventDefault(); pinKey("b"); return; } }
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
function oldLink(where){ return '<div class="legacy">'+esc(where)+' · <a href="'+OLD_URL+'" target="_blank" rel="noopener">옛 콘솔에서</a></div>'; }
/* 데이터 상태 한 번에 · 반환 null = 그릴 수 있음 · 아니면 대신 그릴 html */
function dataGate(k, label){
  var d=S.data[k], e=S.err[k];
  if(!d&&!e) return skel();
  if(!d&&e) return band("warn","받지 못했습니다 · "+esc(why(e)),'<button class="btn sm" type="button" onclick="reload([\''+k+'\'])">다시 시도</button>');
  if(unknownSrv(d)) return band("info","이 서버는 아직 "+esc(label||"이 기능")+"을 모릅니다 · 서버 갱신 뒤");
  if(d&&d.ok===false&&d.reason==="spin") return band("info","이 서버는 아직 명단 보기에 PIN 을 받습니다 · 서버 갱신 뒤 PIN 없이 열림",'<button class="btn sm pri" type="button" onclick="readPinAsk()">PIN 넣고 보기</button>');
  if(d&&d.ok===false) return band("warn","받지 못했습니다 · "+esc(why(d)),'<button class="btn sm" type="button" onclick="reload([\''+k+'\'])">다시 시도</button>');
  return null;
}
function errTop(k){ return S.err[k]&&S.data[k]?band("warn","받지 못했습니다 · "+esc(why(S.err[k]))+" · 마지막 값을 회색으로 둡니다",'<button class="btn sm" type="button" onclick="reload([\''+k+'\'])">다시 시도</button>'):""; }
function readPinAsk(){
  confirmBox({ t:"명단을 PIN 확인 뒤 볼까요?", who:"옛 서버 · 명단 읽기", sub:"서버 갱신 뒤에는 묻지 않습니다", ok:"PIN 확인", pin:true,
    run:function(pp){ return phToSp(pp.ph).then(function(x){ if(!x.ok) return x.r||{ ok:false }; READ_SP.sp=x.sp; READ_SP.until=Date.now()+25*60000; return { ok:true }; }); },
    done:function(){ var ks=needs().filter(function(n){ return n.rd; }).map(function(n){ return n.k; }); reload(ks); } });
}

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
  var sc=SCREENS[S.tab];
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
