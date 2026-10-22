/* AXF CONTROL v2 · 지금 탭 대시보드 모양 · 움직임 (261022 · 시안 확정 · 사용자 결정 1 큰 숫자 28 · 2 내보내기 없음 · 3 서버 10분 칸 · 4 운영 상태 = 점 + 글자)
 * 그리는 부품 = dxN(굴러가는 숫자) · dxBar(막대) · dxRing(원형 게이지) · dxSpark(작은 꺾은선 · 서버 · 콘솔에 시간 순 기록이 있는 지표만) · dxTile(지표 칸)
 * 움직임 = 지금 탭에 들어온 뒤 첫 자료 때만 카드 차례 등장 · 숫자 올라감 · 막대 · 게이지 차오름(DX_WIN 안)
 *          그 뒤 다시 그릴 때(갱신)는 바뀐 숫자 · 막대만 DX_ROLL 동안 · 동작 줄이기 = 늘 바로 최종 값
 * 곡선 · 시간 = v2.css --ease · --t-in(카드) · 움직이는 속성 = transform · opacity(게이지만 선 길이)
 * core.js · v2.css 는 고치지 않는다 · now.js mount 가 dxMount · paint 끝이 dxAfter 를 부른다 */
var DX={ t0:0, prev:{}, roll:{}, ba:{}, ca:{}, raf:0 };
var DX_STEP=40, DX_FILL=600, DX_ROLL=300, DX_WIN=1600, DX_CAP=14, DX_RC=2*Math.PI*36;
function dxMount(){ DX.t0=0; DX.prev={}; DX.roll={}; DX.ba={}; DX.ca={}; }
function dxRM(){ return !!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
function dxCss(n, d){ var v=""; try{ v=getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }catch(e){} return v||d; }
function dxFmt(v, d){ return Number(v).toLocaleString("ko-KR",{ minimumFractionDigits:d||0, maximumFractionDigits:d||0 }); }
function dxClamp(f){ f=Number(f); return isFinite(f)?Math.max(0,Math.min(1,f)):0; }
/* 숫자 · t = 보일 글자(없으면 n0) · d = 소수 자리(구르는 동안) */
function dxN(k, v, d, t){ var n=Number(v); if(v==null||!isFinite(n)) return esc(t!=null?t:"-"); return '<span class="dx-n" data-dxk="'+esc(k)+'" data-dxv="'+n+'" data-dxd="'+(d||0)+'">'+esc(t!=null?t:dxFmt(n,d))+'</span>'; }
/* 사람 수 숫자 = 누르면 명단(drill.js drN) · 숫자는 구른다 */
function dxD(key, n, k){ return drN(key, dxN(k||key, num(n)), n); }
function dxBig(key, n, unit, k){ return drN(key, '<span class="big">'+dxN(k||key, num(n))+'<small> '+esc(unit)+'</small></span>', n); }
function dxBar(k, f, y, inner){ return '<i class="dx-bi" data-dxk-b="'+esc(k)+'" data-dxf="'+dxClamp(f).toFixed(4)+'"'+(y?' data-dxy="1"':'')+'>'+(inner||"")+'</i>'; }
function dxRing(k, f, inner){ return '<div class="dx-ring"><svg viewBox="0 0 84 84" aria-hidden="true"><circle class="bg" cx="42" cy="42" r="36"/><circle class="fg" cx="42" cy="42" r="36" stroke-dasharray="'+DX_RC.toFixed(2)+'" data-dxk-b="'+esc(k)+'" data-dxf="'+dxClamp(f).toFixed(4)+'"/></svg><b>'+inner+'</b></div>'; }
function dxPill(c, t){ return '<span class="dx-pill '+c+'"><i></i>'+esc(t)+'</span>'; }
/* 한 줄 · 「 · 」 자리에서만 줄을 바꾼다 */
function dxNw(h){ return String(h||"").split(" · ").map(function(x){ return '<span class="dx-nw">'+x+'</span>'; }).join(" · "); }
/* 작은 꺾은선 · null = 기록 없는 칸(선을 끊지 않고 건너뜀) · 점 2개 미만이면 안 그림 */
function dxSpark(a, lbl){
  var pts=[]; (a||[]).forEach(function(v,i){ if(v!=null&&isFinite(Number(v))) pts.push([i,Number(v)]); });
  if(pts.length<2) return "";
  var W=88, H=28, L=Math.max(1,(a.length-1)), vs=pts.map(function(p){ return p[1]; }), mx=Math.max.apply(null,vs), mn=Math.min.apply(null,vs);
  var X=function(i){ return (i/L*W).toFixed(1); }, Y=function(v){ return (2+(H-4)*(1-(v-mn)/Math.max(1e-9,mx-mn||1))).toFixed(1); };
  var p=pts.map(function(q){ return X(q[0])+","+Y(q[1]); }).join(" "), last=pts[pts.length-1];
  return '<svg class="dx-sp" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="'+esc(lbl||"추이")+'"><polygon points="'+X(pts[0][0])+','+H+' '+p+' '+X(last[0])+','+H+'"/><polyline points="'+p+'"/><circle cx="'+X(last[0])+'" cy="'+Y(last[1])+'" r="2.2"/></svg>';
}
/* 선 아이콘 16px */
var DX_IC=(function(){ var s=function(d){ return '<svg viewBox="0 0 16 16" aria-hidden="true">'+d+'</svg>'; };
  return { user:s('<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/>'), clock:s('<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.2l2 1.3"/>'),
    open:s('<rect x="4.5" y="2" width="7" height="12" rx="1.5"/><path d="M7 11.5h2"/>'), eye:s('<path d="M1.8 8S4 4 8 4s6.2 4 6.2 4S12 12 8 12 1.8 8 1.8 8z"/><circle cx="8" cy="8" r="1.8"/>'),
    peak:s('<path d="M2 13l4-6 3 3 5-7"/>'), scan:s('<path d="M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3M4.5 8h7"/>'), line:s('<path d="M2.5 4.5h11M2.5 8h7M2.5 11.5h4"/>'),
    srv:s('<rect x="2.5" y="3" width="11" height="4" rx="1"/><rect x="2.5" y="9" width="11" height="4" rx="1"/><path d="M5 5h.01M5 11h.01"/>'), bell:s('<path d="M4 11V7.5a4 4 0 0 1 8 0V11l1 1.5H3z"/><path d="M6.8 14h2.4"/>') }; })();
/* 지표 칸 · o = { k 열쇠 · ic · l 이름 · v 값 · d · t 보일 글자 · u 단위 · sub html · pill · meter · sp 꺾은선 배열 · dl { v, t } 증감 · on 고른 칸 · st 상태 · go 누르면 · key 명단 열쇠 } */
function dxTile(o){
  var tg=o.go?"button":"div", num0=o.key?drN(o.key, dxN(o.k,o.v,o.d,o.t), o.v):dxN(o.k,o.v,o.d,o.t);
  return '<'+tg+(o.go?' type="button" onclick="'+o.go+'"':'')+' class="dx-tile dx-a'+(o.on?" on":"")+(o.st?" "+o.st:"")+(S.err.nb&&o.nb?" stale":"")+'" data-dxc="t:'+esc(o.k)+'">'+
    '<div class="dx-hd"><span class="dx-ic">'+(o.ic||"")+'</span><span class="l">'+esc(o.l)+'</span>'+(o.pill||"")+'</div>'+
    '<div class="dx-v">'+num0+(o.u?'<em>'+esc(o.u)+'</em>':'')+'</div>'+(o.meter||"")+
    '<div class="dx-tb"><div class="dx-tl">'+(o.dl&&o.dl.v!=null?'<span class="dx-dl">'+(o.dl.v>=0?"▲ ":"▼ ")+dxFmt(Math.abs(o.dl.v),o.dl.d||0)+(o.dl.u||"")+'<small>'+esc(o.dl.t)+'</small></span>':'')+'<span class="dx-sub">'+dxNw(o.sub)+'</span></div>'+(o.sp?dxSpark(o.sp,o.l+" 추이"):'')+'</div></'+tg+'>';
}
/* ── 움직임 ── */
function dxSet(e, f){ if(e.tagName==="circle"||e.tagName==="CIRCLE") e.style.strokeDashoffset=(DX_RC*(1-f)).toFixed(2); else e.style.transform=(e.getAttribute("data-dxy")?"scaleY(":"scaleX(")+f+")"; }
function dxKf(e, a, b){ if(/circle/i.test(e.tagName)) return [{ strokeDashoffset:(DX_RC*(1-a)).toFixed(2) },{ strokeDashoffset:(DX_RC*(1-b)).toFixed(2) }]; var y=e.getAttribute("data-dxy"); return [{ transform:(y?"scaleY(":"scaleX(")+a+")" },{ transform:(y?"scaleY(":"scaleX(")+b+")" }]; }
function dxCur(r, now){ var p=Math.max(0,Math.min(1,(now-r.at)/r.dur)); return r.a+(r.b-r.a)*dxEase(p); }
var dxEase=(function(){ var x1=.2,y1=.8,x2=.2,y2=1; return function(t){ var lo=0,hi=1,m; for(var k=0;k<18;k++){ m=(lo+hi)/2; var cx=3*x1*m*(1-m)*(1-m)+3*x2*m*m*(1-m)+m*m*m; if(cx<t) lo=m; else hi=m; } m=(lo+hi)/2; return 3*y1*m*(1-m)*(1-m)+3*y2*m*m*(1-m)+m*m*m; }; })();
function dxTick(){
  var now=performance.now(), live=0, root=document.getElementById("vb");
  Object.keys(DX.roll).forEach(function(k){
    var r=DX.roll[k], e=root&&root.querySelector('[data-dxk="'+k+'"]');
    if(now>=r.at+r.dur){ if(e) e.textContent=e.getAttribute("data-dxt")||dxFmt(r.b,r.d); delete DX.roll[k]; return; }
    live=1; if(e) e.textContent=dxFmt(r.d?dxCur(r,now):Math.round(dxCur(r,now)),r.d);
  });
  DX.raf=live?requestAnimationFrame(dxTick):0;
}
function dxAfter(root){
  if(!root) return;
  var now=performance.now(), nums=[].slice.call(root.querySelectorAll("[data-dxk]")), bars=[].slice.call(root.querySelectorAll("[data-dxf]")), cards=[].slice.call(root.querySelectorAll(".dx-a"));
  nums.forEach(function(e){ e.setAttribute("data-dxt",e.textContent); });
  bars.forEach(function(e){ dxSet(e, Number(e.getAttribute("data-dxf"))); });
  var snap=function(){ var m={}; nums.forEach(function(e){ m["n:"+e.getAttribute("data-dxk")]=Number(e.getAttribute("data-dxv")); }); bars.forEach(function(e){ m["b:"+e.getAttribute("data-dxk-b")]=Number(e.getAttribute("data-dxf")); }); return m; };
  if(dxRM()||typeof Element.prototype.animate!=="function"){ DX.roll={}; DX.prev=snap(); if(!DX.t0&&nums.length) DX.t0=now; return; }
  if(!DX.t0&&nums.length) DX.t0=now;
  var win=DX.t0&&now-DX.t0<DX_WIN, tin=parseFloat(dxCss("--t-in","220"))||220, ease=dxCss("--ease","cubic-bezier(.2,.8,.2,1)");
  /* 카드 · 첫 자료 뒤 DX_WIN 안에 처음 보인 카드만 차례로 · 다시 그려도 같은 시각표(음수 지연으로 이어 감) */
  var cAt={};
  cards.forEach(function(c,i){
    var k=c.getAttribute("data-dxc")||("i"+i), r=DX.ca[k];
    if(!r&&win) r=DX.ca[k]={ at:Math.max(DX.t0+Math.min(i,DX_CAP)*DX_STEP, now) };
    if(!r) return;
    cAt[k]=r.at;
    if(now<r.at+tin) c.animate([{ opacity:0, transform:"translateY(6px)" },{ opacity:1, transform:"none" }],{ duration:tin, delay:r.at-now, easing:ease, fill:"backwards" });
  });
  var startOf=function(e){ var c=e.closest(".dx-a"), k=c&&(c.getAttribute("data-dxc")); return (k&&cAt[k]!=null?cAt[k]:now)+120; };
  /* 막대 · 게이지 */
  bars.forEach(function(e){
    var k="b:"+e.getAttribute("data-dxk-b"), f=Number(e.getAttribute("data-dxf")), r=DX.ba[k], o=DX.prev[k];
    if(r&&r.b!==f){ r.a=dxCur(r,now); r.b=f; r.at=now; r.dur=DX_ROLL; }
    if(!r){ if(win&&o==null) r=DX.ba[k]={ a:0, b:f, at:startOf(e), dur:DX_FILL }; else if(o!=null&&o!==f) r=DX.ba[k]={ a:o, b:f, at:now, dur:DX_ROLL }; }
    if(!r) return;
    if(now>=r.at+r.dur){ delete DX.ba[k]; return; }
    e.animate(dxKf(e,r.a,r.b),{ duration:r.dur, delay:r.at-now, easing:ease, fill:"backwards" });
  });
  /* 숫자 */
  nums.forEach(function(e){
    var k=e.getAttribute("data-dxk"), v=Number(e.getAttribute("data-dxv")), d=Number(e.getAttribute("data-dxd"))||0, r=DX.roll[k], o=DX.prev["n:"+k];
    if(r&&r.b!==v){ r.a=dxCur(r,now); r.b=v; r.at=now; r.dur=DX_ROLL; }
    if(!r){ if(win&&o==null&&v) r=DX.roll[k]={ a:0, b:v, d:d, at:startOf(e), dur:DX_FILL }; else if(o!=null&&o!==v) r=DX.roll[k]={ a:o, b:v, d:d, at:now, dur:DX_ROLL }; }
    if(r) e.textContent=dxFmt(r.d?dxCur(r,now):Math.round(dxCur(r,now)),r.d);
  });
  DX.prev=snap();
  if(Object.keys(DX.roll).length&&!DX.raf) DX.raf=requestAnimationFrame(dxTick);
}
