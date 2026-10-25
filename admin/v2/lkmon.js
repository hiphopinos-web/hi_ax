/* AXF CONTROL v2 · 행운권 › 럭키드로우 「체크인 감시」 띠 (261026 사용자 「실제 체크인이 실시간으로 쌓이는지 · 서버가 터지지 않는지 · 지연 · 체크인이 되지 않는 경우」 · 300~400명 한꺼번에)
 * 자리 = 상태 줄 아래 · 숫자 4칸(lkuT) 위 · lkui.js 는 고치지 않고 감싼다(lkuNeed · lkuMount · lkuPaint)
 * 칸 = 판정(정상 · 느림 · 끊김) / 17F 체크인 흐름(누적 · 최근 1분 · 5분 · 마지막 체크인 · 분당 막대 16:40 부터) / 콘솔 → 서버(응답 ms · 1분 최대 · 연속 실패 · 마지막 갱신 · 지문) / 서버 처리(srv_pulse · 이미 있는 읽기)
 * 판정 = 끊김(체크인 표 읽기 연속 실패 3회 이상) › 느림(실패 1 · 2회 · 응답 2초 넘음 · 갱신 20초 넘게 없음 · 서버 맥박 위험) › 정상
 * 읽기 = draw_board(lkui 그대로 · 서버 5초 캐시) · srv_pulse(메모리) · /__ax/info(1분) · 쓰기 없음 · 서버 변경 없음(261026 기획담당자 「drawIn_ 거절 이유 셈은 넣지 않음」)
 * 체크인 창(추첨 날 16:40 ~ 마감 뒤 10분) = 체크인 표 · 맥박 5초 · 그 밖 = 10초 그대로 · 화면이 숨으면 불러오기 멈춤(core load) · 다시 보이면 바로
 * 연습 체크인 보기 = 띠에 「연습」 · 흐름 = 연습 기록 */
var LKM={ log:[], fail:0, okAt:0, okMs:null, visAt:Date.now(), info:"", infoAt:0, infoBusy:0, sig:"" };
var LKM_FAST=3000, LKM_SLOW_MS=2000, LKM_STALE=20000, LKM_CUT=3, LKM_TAIL=10;
/* 콘솔 → 서버 왕복 · call 을 감싼다(응답 그대로 돌려줌 · 세기만) */
(function(){ if(typeof call!=="function"||call.lkm) return; var c0=call;
  call=function(a,p,ms){ var t0=Date.now(); return c0(a,p,ms).then(function(r){ try{ lkmNet(a,Date.now()-t0,r); }catch(e){} return r; }); };
  call.lkm=1; })();
function lkmBad(r){ return !r||(r.ok===false&&(r.reason==="network"||r.reason==="timeout"||r.reason==="busy"||(!!r.err&&r.err!=="unknown action"))); }
function lkmNet(a, ms, r){
  if(a!=="draw_board"&&a!=="draw_bprac"&&a!=="draw_stats"&&a!=="srv_pulse") return;
  var now=Date.now(), bad=lkmBad(r);
  LKM.log.push({ t:now, ms:ms, ok:!bad, a:a }); if(LKM.log.length>120) LKM.log.shift();
  if(a==="draw_board"||a==="draw_bprac"){ if(bad) LKM.fail++; else { LKM.fail=0; LKM.okAt=now; LKM.okMs=ms; } }
}
document.addEventListener("visibilitychange",function(){ if(!document.hidden) LKM.visAt=Date.now(); });
/* 체크인 창 · 서버 시각 · 추첨 날(day) · 시작(start) ~ 마감 뒤 10분(마감 전이면 끝 없음) */
function lkmTod(s){ var m=String(s||"").match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/); return m?(+m[1])*3600+(+m[2])*60+(+(m[3]||0)):-1; }
function lkmNowS(){ var t=srvNow(); return t.getHours()*3600+t.getMinutes()*60+t.getSeconds(); }
function lkmBd(){ var b=S.data.dbd; return b&&b.ok&&Array.isArray(b.rows)?b:null; }
function lkmLive(){
  var b=lkmBd(); if(!b||!b.day||lkuToday()!==b.day) return false;
  var n=lkmNowS(), s=lkmTod(b.start||"16:40"); if(s<0||n<s) return false;
  if(b.closed&&b.closedAt){ var c=lkmTod(String(b.closedAt).slice(11,19)); if(c>=0&&n>c+LKM_TAIL*60) return false; }
  return true;
}
(function(){
  if(typeof lkuNeed!=="function"||lkuNeed.lkm) return;
  var n0_=lkuNeed, m0=lkuMount, p0=lkuPaint;
  lkuNeed=function(){ var a=n0_.apply(this,arguments), live=lkmLive();
    a.forEach(function(n){ if(n.k==="dbd"&&live) n.ttl=LKM_FAST; });
    a.push({ k:"lkmP", a:"srv_pulse", ttl:live?LKM_FAST:10000 });
    return a; };
  lkuNeed.lkm=1;
  lkuMount=function(vb){ m0.apply(this,arguments); LKM.sig="";
    var t=el("lkuT"); if(t&&!el("lkmBox")){ var d=document.createElement("section"); d.className="card lkm"; d.id="lkmBox"; d.setAttribute("aria-label","체크인 감시"); d.setAttribute("aria-live","off"); t.parentNode.insertBefore(d,t); }
    lkmInfo(); lkmPaint(); };
  lkuPaint=function(){ p0.apply(this,arguments); lkmPaint(); };
})();
/* 운영 지문 · /__ax/info backend.sha · 1분에 한 번 · 지금 화면일 때만 */
function lkmInfo(){
  if(LKM.infoBusy||Date.now()-LKM.infoAt<60000) return;
  var u=String(BE||"").replace(/\/exec$/,"/__ax/info"); if(u===BE) return;
  LKM.infoBusy=1; var ctl=window.AbortController?new AbortController():null, to=setTimeout(function(){ if(ctl) ctl.abort(); },6000);
  fetch(u,{ cache:"no-store", signal:ctl?ctl.signal:undefined }).then(function(r){ return r.ok?r.json():null; }).then(function(j){ LKM.info=j&&j.backend&&j.backend.sha?String(j.backend.sha).slice(0,12):""; },function(){}).then(function(){ clearTimeout(to); LKM.infoBusy=0; LKM.infoAt=Date.now(); lkmPaint(); });
}
function lkmOn(){ return typeof S!=="undefined"&&S.tab==="stage"&&typeof sgSub==="function"&&sgSub()==="lk"&&!!el("lkmBox"); }
setInterval(function(){ if(lkmOn()&&!document.hidden){ lkmPaint(); lkmInfo(); } },1000);
function lkmSec(s){ s=Math.max(0,Math.round(s)); return s<90?s+"초 전":Math.floor(s/60)+"분 전"; }
function lkmMs(v){ return v==null?"-":v>=1000?(Math.round(v/100)/10)+"초":Math.round(v)+"ms"; }
/* 체크인 흐름 · draw_board 줄 체크인 시각(HH:MM:SS · 추첨 날) */
function lkmFlow(b){
  var tod=[], ns=lkmNowS(), td=b.day&&lkuToday()===b.day;
  (b.rows||[]).forEach(function(r){ var s=lkmTod(r[3]); if(r[3]&&s>=0) tod.push(s); });
  var o={ all:num(b.inAll), m1:0, m5:0, last:null, bars:[], max:0 }, s0=lkmTod(b.start||"16:40");
  if(td){ tod.forEach(function(s){ var a=ns-s; if(a>=0&&a<60) o.m1++; if(a>=0&&a<300) o.m5++; if(o.last==null||s>o.last) o.last=s; }); }
  if(td&&s0>=0&&ns>=s0){
    var endS=ns; if(b.closed&&b.closedAt){ var c=lkmTod(String(b.closedAt).slice(11,19)); if(c>=0) endS=Math.min(ns,c+LKM_TAIL*60); }
    var nb=Math.min(60,Math.floor((endS-s0)/60)+1), cnt=[]; for(var i=0;i<nb;i++) cnt.push(0);
    tod.forEach(function(s){ var k=Math.floor((s-s0)/60); if(k>=0&&k<nb) cnt[k]++; });
    o.bars=cnt; o.max=Math.max.apply(null,cnt.concat([1])); o.s0=s0;
  }
  o.lastAgo=o.last!=null?ns-o.last:null;
  return o;
}
function lkmBars(f){
  if(!f.bars.length) return '<div class="lkm-bars e" aria-hidden="true"></div>';
  var h=f.bars.map(function(c,i){ var m=Math.floor(f.s0/60)+i, t=("0"+Math.floor(m/60)).slice(-2)+":"+("0"+(m%60)).slice(-2);
    return '<i style="height:'+(c?Math.max(2,Math.round(c/f.max*24)):1)+'px"'+(c?'':' class="z"')+' title="'+t+' · '+c+'명"></i>'; }).join("");
  var m0=Math.floor(f.s0/60);
  return '<div class="lkm-bars" role="img" aria-label="분당 체크인 · '+("0"+Math.floor(m0/60)).slice(-2)+":"+("0"+(m0%60)).slice(-2)+' 부터 · 최대 '+f.max+'명">'+h+'</div>';
}
function lkmJudge(f, P){
  var now=Date.now(), w=[];
  if(LKM.fail>=LKM_CUT) return { c:"bad", t:"끊김", w:"체크인 표 읽기 연속 실패 "+LKM.fail+"회" };
  var base=Math.max(LKM.okAt,LKM.visAt), st=LKM.okAt?now-base:0;
  if(!LKM.okAt&&!LKM.fail) return { c:"", t:"확인 중", w:"" };
  if(LKM.fail) w.push("읽기 실패 "+LKM.fail+"회");
  if(LKM.okMs!=null&&LKM.okMs>LKM_SLOW_MS) w.push("응답 "+lkmMs(LKM.okMs));
  if(st>LKM_STALE) w.push("갱신 "+Math.round(st/1000)+"초 없음");
  if(P&&P.ok&&num(P.lv)>=2) w.push("서버 맥박 위험");
  return w.length?{ c:"warn", t:"느림", w:w.join(" · ") }:{ c:"ok", t:"정상", w:"" };
}
function lkmPaint(){
  var box=el("lkmBox"); if(!box) return;
  var b=lkuB?lkuB():lkmBd(), pr=typeof lkuPr==="function"&&lkuPr(), P=S.data.lkmP, f=b?lkmFlow(b):null, live=lkmLive(), now=Date.now();
  var J=lkmJudge(f,P), mx=null;
  LKM.log.forEach(function(x){ if(x.ok&&now-x.t<60000&&(mx==null||x.ms>mx)) mx=x.ms; });
  var g=function(l,v,c){ return '<div class="lkm-g'+(c?" "+c:"")+'"><span class="l">'+l+'</span><span class="v">'+v+'</span></div>'; }, B=function(v){ return '<b>'+v+'</b>'; };
  var h='<div class="lkm-r"><div class="lkm-j '+J.c+'" role="status"><i aria-hidden="true"></i><b>'+esc(J.t)+'</b>'+(pr?'<span class="tag">연습</span>':'')+'<span class="cap">'+esc((J.w||(live?"5초마다":"10초마다"))+(J.c==="bad"?" · 아래 숫자는 마지막 값":""))+'</span></div>';
  if(f){
    var fv=(pr?'연습 ':'')+'누적 '+B(n0(f.all))+'명 · 1분 '+B(n0(f.m1))+' · 5분 '+B(n0(f.m5))+' · 마지막 체크인 '+B(f.lastAgo!=null?lkmSec(f.lastAgo):"-");
    h+='<div class="lkm-fl">'+g(pr?"연습 체크인 흐름":"17F 체크인 흐름",fv)+lkmBars(f)+'</div>';
  } else h+=g("17F 체크인 흐름","-");
  h+='</div><div class="lkm-r lkm-r2">';
  var sv='응답 '+B(lkmMs(LKM.okMs))+' · 1분 최대 '+B(lkmMs(mx))+' · 연속 실패 '+B(n0(LKM.fail))+' · 갱신 '+B(LKM.okAt?lkmSec((now-LKM.okAt)/1000):"-")+(LKM.info?' · 지문 <span class="lkm-fp">'+esc(LKM.info)+'</span>':'');
  h+=g("콘솔 → 서버",sv,LKM.fail>=LKM_CUT?"bad":(LKM.fail||(LKM.okMs!=null&&LKM.okMs>LKM_SLOW_MS))?"warn":"");
  if(P&&P.ok&&P.m){ var pm=P.m, lv=num(P.lv);
    h+=g("서버 처리",'초당 '+(pm.rps==null?B("-"):B(n0(pm.rps))+'건')+' · 응답 p95 '+B(lkmMs(pm.p95))+' · 오류 1분 '+B(n0(pm.err))+(pm.live!=null?' · 지금 접속 '+B(n0(pm.live)):''),lv>=2?"bad":lv>=1?"warn":""); }
  h+='</div>';
  if(LKM.sig===h) return; LKM.sig=h; box.className="card lkm "+J.c; box.innerHTML=h;
}
