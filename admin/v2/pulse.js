/* AXF CONTROL v2 · 지금 › 서버 맥박 (261022) · 맨 위 한 칸
 * 서버 srv_pulse(관리코드 · 읽기 · Worker 메모리 10초 칸 · 시트 읽지 않음)를 5초마다 받는다 · 지금 탭이 보일 때만 · 숨으면 멈춘다
 * 선 = 10초 칸 초당 요청 · 최근 5분 · 오른쪽이 지금 · 시간이 흐르면 왼쪽으로 밀린다(requestAnimationFrame · 숨으면 멈춤 · 동작 줄이기 = 받을 때마다 한 장)
 * 상태(보통 · 주의 · 위험)와 문턱은 서버가 정한다(정본 PULSE_TH 한 곳) · 위험에서는 선 색만 바뀐다 · 깜빡임 · 소리 없음
 * dashfx 첫 진입 동작과 따로 논다(이 칸은 dx-* 를 쓰지 않는다) */
var PU={ d:null, at:0, busy:0, off:0, raf:0, unk:0, err:0, cv:null, w:0, h:0 };
var PU_POLL=5000, PU_WIN=300000;
function puRM(){ return !!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
function puOn(){ return typeof S!=="undefined"&&S.tab==="now"&&!document.hidden&&typeof authed==="function"&&authed()&&!!el("nwPulse"); }
function puMs(v){ return v==null?"-":v>=1000?(Math.round(v/100)/10)+"초":Math.round(v)+"ms"; }
function puN(v){ return v==null?"-":Number(v).toLocaleString("ko-KR"); }
var PU_LV=[["ok","보통"],["warn","주의"],["bad","위험"]];
function puBuild(box){
  box.innerHTML='<div class="card mb pu-card"><div class="pu-h"><h2>서버 맥박</h2><span class="cap" id="puCap">불러오는 중</span></div>'+
    '<div class="pu-body"><div class="pu-plot"><div class="pu-cv"><canvas id="puCv" aria-label="최근 5분 초당 요청 흐름" role="img"></canvas></div><div class="pu-ax"><span>5분 전</span><span>지금</span></div></div>'+
    '<div class="pu-side"><div class="pu-st" id="puSt"><i></i><b>-</b><span class="cap" id="puWhy"></span></div><div class="pu-nums" id="puNums"></div></div></div></div>';
  PU.cv=el("puCv"); PU.w=0; puText(); puDraw();
}
function puText(){
  var d=PU.d, st=el("puSt"); if(!st) return;
  var cap=el("puCap");
  if(PU.unk){ cap.textContent="이 서버는 아직 서버 맥박을 모릅니다 · 서버 갱신 뒤 나옵니다"; }
  else if(!d){ cap.textContent=PU.err?"서버 응답이 없습니다 · 5초 뒤 다시":"불러오는 중"; }
  else { var t=new Date(d.now); cap.textContent="10초 칸 · 최근 5분 · "+("0"+t.getHours()).slice(-2)+":"+("0"+t.getMinutes()).slice(-2)+":"+("0"+t.getSeconds()).slice(-2)+(PU.err?" · 응답 없음 · 마지막 값":"")+(d.src==="min"?" · 분 단위 오류만(서버 갱신 전)":""); }
  if(!d){ st.className="pu-st"; st.querySelector("b").textContent="-"; el("puWhy").textContent=""; el("puNums").innerHTML=puNums({}); return; }
  var lv=PU_LV[Math.max(0,Math.min(2,d.lv|0))], w=d.why||{}, ws=[];
  if(w.rps) ws.push("요청 많음"); if(w.p95) ws.push("응답 느림"); if(w.err) ws.push("오류");
  st.className="pu-st "+lv[0]; st.querySelector("b").textContent=lv[1]; el("puWhy").textContent=ws.join(" · ");
  el("puNums").innerHTML=puNums(d.m||{}, w);
}
function puNums(m, w){
  w=w||{};
  var c=function(k){ return w[k]?" hit":""; };
  var it=function(l, v, u, s, k){ return '<div class="pu-n'+c(k)+'"><span class="cap">'+l+'</span><b class="num">'+v+(u?'<small>'+u+'</small>':'')+'</b><span class="cap">'+s+'</span></div>'; };
  return it("분당 요청", puN(m.rpm), "", m.rps==null?"-":"초당 "+m.rps, "rps")+
    it("오류", puN(m.err), m.err==null?"":"건", "지난 1분", "err")+
    it("응답 시간", puMs(m.p95), "", "p95 · 30초", "p95")+
    it("지금 접속 추정", puN(m.live), m.live==null?"":"명", "3분 안 요청 사번", "");
}
function puPts(d){
  var st=d.step||10000, cur=d.now-d.now%st, a=[];
  (d.b||[]).forEach(function(r){ if(r[0]<cur&&r[1]!=null) a.push([r[0]+st, r[1]/(st/1000)]); });
  return a;
}
function puDraw(){
  var cv=PU.cv; if(!cv||!cv.isConnected) return;
  var dpr=window.devicePixelRatio||1, w=cv.clientWidth, h=cv.clientHeight; if(!w||!h) return;
  if(PU.w!==w||PU.h!==h||cv.width!==Math.round(w*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); PU.w=w; PU.h=h; }
  var g=cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);
  var cs=getComputedStyle(cv), col=function(n,f){ return (cs.getPropertyValue(n)||"").trim()||f; };
  var navy=col("--navy","#00205B"), bad=col("--bad","#A63A34"), ln=col("--line2","#EFF0F3"), tx3=col("--tx3","#6B7080");
  var now=Date.now()+PU.off, x=function(t){ return w-(now-t)/PU_WIN*w; };
  /* 30초 세로 눈금 · 시간과 함께 흐른다 */
  g.strokeStyle=ln; g.lineWidth=1; g.beginPath();
  for(var t=now-now%30000; t>now-PU_WIN; t-=30000){ var gx=Math.round(x(t))+.5; g.moveTo(gx,0); g.lineTo(gx,h); }
  g.stroke();
  var d=PU.d; if(!d||d.src!=="mem") return;
  var p=puPts(d).filter(function(q){ return q[0]>now-PU_WIN-(d.step||10000); });
  var top=10; p.forEach(function(q){ if(q[1]*1.25>top) top=q[1]*1.25; });
  var th=d.th&&d.th.rps; top=Math.ceil(top);
  var y=function(v){ return h-4-(v/top)*(h-12); };
  if(th&&th[0]<=top){ g.save(); g.setLineDash([4,4]); g.strokeStyle=col("--line3","#D1D5DB"); g.beginPath(); var ty=Math.round(y(th[0]))+.5; g.moveTo(0,ty); g.lineTo(w,ty); g.stroke(); g.restore();
    g.fillStyle=tx3; g.font="12px "+cs.fontFamily; g.textAlign="left"; g.fillText("주의 "+th[0]+"/초", 4, ty-4); }
  g.fillStyle=tx3; g.font="12px "+cs.fontFamily; g.textAlign="right"; g.fillText(top+"/초", w-4, 12);
  if(!p.length) return;
  var lc=(d.lv|0)>=2?bad:navy;
  g.strokeStyle=lc; g.lineWidth=2; g.lineJoin="round"; g.lineCap="round"; g.beginPath();
  p.forEach(function(q,i){ var px=x(q[0]), py=y(q[1]); if(!i) g.moveTo(px,py); else { var pq=p[i-1], mx=(x(pq[0])+px)/2; g.bezierCurveTo(mx,y(pq[1]),mx,py,px,py); } });
  g.stroke();
  var l=p[p.length-1], lx=x(l[0]), ly=y(l[1]);
  g.fillStyle=lc; g.globalAlpha=.16; g.beginPath(); g.arc(lx,ly,7,0,Math.PI*2); g.fill(); g.globalAlpha=1;
  g.beginPath(); g.arc(lx,ly,3.5,0,Math.PI*2); g.fill();
}
function puLoop(){
  PU.raf=0;
  if(!puOn()||puRM()) return;
  puDraw(); PU.raf=requestAnimationFrame(puLoop);
}
function puKick(){ if(!PU.raf&&puOn()&&!puRM()) PU.raf=requestAnimationFrame(puLoop); }   /* 동작 줄이기 = 칸을 만들 때 · 받을 때만 그린다(puBuild · puFetch) */
function puFetch(){
  PU.busy=1; PU.at=Date.now();
  call("srv_pulse",{},8000).then(function(r){
    PU.busy=0;
    if(typeof unknownSrv==="function"&&unknownSrv(r)){ PU.unk=1; PU.d=null; }
    else if(r&&r.ok&&Array.isArray(r.b)){ PU.unk=0; PU.err=0; PU.d=r; PU.off=(Number(r.now)||Date.now())-Date.now(); }
    else PU.err=1;
    if(el("puSt")){ puText(); puDraw(); }
  });
}
function puTick(){
  if(!puOn()) return;
  var box=el("nwPulse"); if(!el("puCv")||!box.contains(el("puCv"))) puBuild(box);
  if(!PU.busy&&Date.now()-PU.at>=(PU.unk?60000:PU_POLL)-300) puFetch();   /* 1초 틱 흔들림 · 5초 간격이 6초로 밀리지 않게 */
  puKick();
}
setInterval(puTick, 1000);
document.addEventListener("visibilitychange", function(){ if(!document.hidden) puTick(); });
