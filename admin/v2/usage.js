/* AXF CONTROL v2 · 지금 › 앱 사용 (261017 · 설계 = 디자인 시안/앱 사용 대시보드/설계.md · 사용자 D1~D9 · D5 3분)
 * 261022 대시보드 모양(dashfx.js) · 지표 칸 4개(접속한 사람 = 고른 칸 · 꺾은선 = 당일 10분 칸 · 그 밖 날짜별) · 지금 칸 빗금 · 면적 그래프 = 거르기 알약 + 꺾은선 + 비교(서버 prev)
 * 데이터 = usage_stats(관리코드 · per pre | all | day · 당일 1분 · 그 밖 5분) · 사람 이름 · 사번 · 부문 없음 · 5 미만 칸 = -1
 * 기간 = 이 브라우저에만 기억(localStorage · 실패해도 기본값) · 기본 = 사전 오픈 날 pre · 행사일 day · 그 밖 all
 * 261023 처음부터(full · 10/19~27 누적 · 서버 cum = 그날까지 한 번이라도 연 사람) · 칸 이름 「처음부터」(「전체 오픈」 · 거르기 알약 「전체」와 헷갈리지 않게)
 * 그리는 곳 = now.js(홈 탭 · 주소 #now 그대로) · 당일 08:00~17:30 이면 이상 신호 아래, 그 밖은 맨 위(D6) */
var US={ per:"", am:"h", rs:0, ag:"all", cmp:false };   /* 261022 ag = 면적 그래프 거르기(all · 화면 · etc) · cmp = 전날 같은 시간대 비교 */
var US_LS=skey("axf_usage_p");
var US_PROG=[["09:30","Opening · Keynote"],["13:30","AWS"],["15:10","MS"],["17:00","Closing"]];
var US_OP=[1,.78,.56,.38,.22];   /* 화면 겹 · 네이비 농도(순위 1~5) · 그 밖 = 회색 */
function usDay(ymd, n){ var a=String(ymd||"").split("-"); if(a.length<3) return ""; var d=new Date(+a[0],+a[1]-1,+a[2]+n); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
function usMd(ymd){ var s=String(ymd||""); return s.length>=10?Number(s.slice(5,7))+"/"+Number(s.slice(8,10)):""; }
function usEv(){ var b=S.data.nb; return b&&b.ev?String(b.ev):"2026-10-26"; }
function usPerDef(){ var b=S.data.nb||{}, d=String(b.day||""), ev=usEv(); if(!d) return "day"; if(d===ev) return "day"; if(d<usDay(ev,-4)) return "pre"; return "all"; }
function usPer(){ if(US.per) return US.per; var v=""; try{ v=localStorage.getItem(US_LS)||""; }catch(e){ v=""; } return /^(pre|all|day|full)$/.test(v)?v:usPerDef(); }
function usNeed(){ var p=usPer(); return { k:"use", a:"usage_stats", p:{ per:p }, ttl:p==="day"?60000:300000 }; }
function usSet(p){ US.per=p; try{ localStorage.setItem(US_LS,p); }catch(e){} paint(); load(false); }
function usSetAm(m){ US.am=m; usAreaDraw(); }
function usN(v){ return v==null?"-":Number(v)<0?"5 미만":n0(v); }
function usDur(sec){ sec=num(sec); if(sec<3600) return n0(Math.round(sec/60))+"분"; var h=sec/3600; return (h<10?(Math.round(h*10)/10).toLocaleString("ko-KR"):n0(Math.round(h)))+"시간"; }
function usMin(m){ m=num(m); if(m<60) return n0(m)+"분"; return Math.floor(m/60)+"시간"+(m%60?" "+(m%60)+"분":""); }
function usMob(){ return window.matchMedia?window.matchMedia("(max-width:600px)").matches:false; }
function usHm(t, add){ var m=Number(String(t).slice(0,2))*60+Number(String(t).slice(3,5))+(add||0); return ("0"+Math.floor(m/60)).slice(-2)+":"+("0"+m%60).slice(-2); }
/* 당일 08:00~17:30 = 이상 신호 아래(D6) */
function usBelow(){ var b=S.data.nb; if(!b||String(b.day||"")!==usEv()) return false; var t=mins(hm(srvNow().toTimeString())); return t>=mins("08:00")&&t<mins("17:30"); }
function usSegH(per){
  var ev=usEv(), L={ pre:usMd(usDay(ev,-7))+"~"+usMd(usDay(ev,-5)).split("/")[1], all:usMd(usDay(ev,-4))+"~"+usMd(usDay(ev,1)).split("/")[1], day:usMd(ev), full:usMd(usDay(ev,-7))+"~"+usMd(usDay(ev,1)).split("/")[1] };
  return '<div class="dx-seg us-per" role="tablist" aria-label="기간">'+[["pre","사전 오픈"],["all","전체 오픈"],["day","행사 당일"],["full","처음부터"]].map(function(x){ var on=x[0]===per; return '<button type="button" role="tab" aria-selected="'+(on?"true":"false")+'" class="'+(on?"on":"")+'" onclick="usSet(\''+x[0]+'\')">'+x[1]+'<small>'+esc(L[x[0]])+'</small></button>'; }).join("")+'</div>';
}
/* 261022 접속한 사람 꺾은선 · 당일 = 10분 칸(지금까지) · 그 밖 = 날짜별(오늘까지) · 5 미만 칸(-1) = 빈 칸 */
function usSeries(d){
  if(d.per==="day"){ var B=d.bars||{ n:[] }, a=B.n||[], cur=B.now?Math.round((mins(B.now)-mins("07:00"))/10):-1; if(cur<0) return null; a=a.slice(0,cur+1); return { a:a.map(function(v){ return Number(v)<0?null:num(v); }), t:"직전 10분 칸" }; }
  var days=d.days||[], dn=d.daysN||[], n=0; days.forEach(function(x,i){ if(!d.today||x<=d.today) n=i+1; });
  if(n<1) return null; if(d.per==="full"&&d.cum) return { a:d.cum.slice(0,n).map(function(v){ return Number(v)<0?null:num(v); }), t:"전날 누적" };
  return { a:dn.slice(0,n).map(function(v){ return Number(v)<0?null:num(v); }), t:"전날" };
}
function nwUsage(b){
  var per=usPer(), d=S.data.use, g=dataGate("use","앱 사용"), live=d&&d.ok&&d.per===per;
  var upd=live?'갱신 '+esc(String(d.t||"").slice(11,16))+' · '+(per==="day"?"1분마다":"5분마다")+' · 시험 사번 제외':"";
  var h='<div class="dx-sh dx-a" data-dxc="u:h"><h2>앱 사용</h2><span class="cap">'+upd+'</span><span class="dx-shr">'+usSegH(per)+'</span></div>';
  if(g) return h+'<div class="card mb">'+g+'</div>'+usAccLine(b);
  if(!live) return h+'<div class="card mb">'+skel()+'</div>'+usAccLine(b);
  var k=d.kpi||{}, stale=S.err.use?" stale":"", se=usSeries(d), dl=null;
  if(se){ var q=se.a.filter(function(v){ return v!=null; }); if(q.length>=2&&se.a[se.a.length-1]!=null&&se.a[se.a.length-2]!=null) dl={ v:se.a[se.a.length-1]-se.a[se.a.length-2], t:se.t }; }
  var pct=k.roster?(Math.round(num(k.people)*1000/num(k.roster))/10):0;
  var k4=per==="day"?{ k:"u:now", ic:DX_IC.eye, l:"지금 보는 사람", v:k.now!=null&&k.now>=0?k.now:null, t:k.now==null?"-":usN(k.now), u:k.now!=null&&k.now>=0?"명":"", sub:k.now==null?"행사 당일에만 셉니다":"최근 3분 · 비로그인 기기 제외" }
    :{ k:"u:peak", ic:DX_IC.peak, l:"가장 붐빈 때", v:k.peak&&k.peak.n>=0?k.peak.n:null, t:k.peak?usN(k.peak.n):"-", u:k.peak&&k.peak.n>=0?"명":"", sub:k.peak?usMd(k.peak.t)+" "+String(k.peak.t).slice(11,16)+"~"+usHm(String(k.peak.t).slice(11,16),10):"기록 없음" };
  h+='<div class="grid g4 mb'+stale+'">'+
    dxTile({ k:"u:people", on:1, ic:DX_IC.user, l:"접속한 사람", v:num(k.people), u:"명", key:num(k.people)?"usage":"", sub:"명부 "+n0(k.roster)+"명 중 <b>"+pct+"</b>%", sp:se?se.a:null, dl:dl })+
    dxTile({ k:"u:med", ic:DX_IC.clock, l:"1인 체류 중앙값", v:num(k.med), u:"분", sub:"합계 <b>"+n0(k.sumH)+"</b>시간" })+
    dxTile({ k:"u:opens", ic:DX_IC.open, l:"앱 연 횟수", v:num(k.opens), u:"회", sub:"1인 <b>"+(k.opp||0)+"</b>회" })+
    dxTile(k4)+'</div>';
  h+='<div class="grid g32 mb"><div class="card dx-a'+stale+'" data-dxc="u:time">'+(per==="day"?usTimeDay(d):per==="full"&&d.cum?usTimeCum(d):usTimeDays(d))+'</div><div class="card dx-a'+stale+'" data-dxc="u:scr">'+usScr(d)+'</div></div>';
  h+='<div class="card mb dx-area dx-a'+stale+'" data-dxc="u:area"><div id="usArea"></div></div>';
  h+='<div class="grid g32 mb"><div class="card dx-a'+stale+'" data-dxc="u:floor">'+usFloor(d)+'</div><div class="card dx-a'+stale+'" data-dxc="u:route">'+usRoute(d)+'</div></div>';
  return h+usAccLine(b);
}
/* 옛 「접속」 카드 숫자(사전 신청자 · 스태프 · 가입 · PIN 대기)를 한 줄로 · 261022 알약 */
function usAccLine(b){
  var r=S.data.rst, ok=r&&r.ok, p=(b&&b.people)||{}, att=(b&&b.att)||{};
  var pre=p.todayPre!=null?n0(p.todayPre)+" / "+n0(p.pre):(ok?n0(r.pre10&&r.pre10.acct)+" / "+n0(r.pre10&&r.pre10.n)+" 가입":"-");
  var stf=p.todayStaff!=null?n0(p.todayStaff)+" / "+n0(p.staff):(ok?n0(r.staff&&r.staff.acct)+" / "+n0(r.staff&&r.staff.n)+" 가입":"-");
  return '<div class="dx-acc dx-a" data-dxc="u:acc">'+[["오늘 접속",n0(p.today)+"명"],["사전 신청자",pre],["스태프",stf],["PIN 대기",n0(b&&b.pw)],["가입",n0(p.acct)],["17F 출석",n0(num(att.l1&&att.l1.in)+num(att.l2&&att.l2.in))],["구독",n0(b&&b.push&&b.push.subs)+"대"]].map(function(x){ return '<span><em>'+x[0]+'</em><b>'+esc(x[1])+'</b></span>'; }).join("")+'</div>';
}
/* 시간대 · 당일 07:00~19:00 10분 막대 · 지금 칸 하나만 빗금 */
function usTimeDay(d){
  var B=d.bars||{ n:[] }, a=B.n||[], mob=usMob(), cur=B.now?Math.round((mins(B.now)-mins("07:00"))/10):-1;
  var mx=Math.max.apply(null,[1].concat(a.map(num))), top=usNice(mx), gl=[top/3,top*2/3,top].map(function(v){ v=Math.round(v); return '<div class="us-gl" style="bottom:'+(v/top*100)+'%"><span>'+n0(v)+'</span></div>'; }).join("");
  var best=-1; a.forEach(function(v,i){ if(best<0||num(v)>num(a[best])) best=i; });
  var h='<h2>시간대별 접속 <span class="cap">10분마다 앱을 본 사람</span></h2>';
  if(!a.some(function(v){ return num(v)!==0; })) return h+emptyH("아직 기록이 없습니다","");
  var tip=cur>=0&&cur<a.length?'<span class="dx-tip" style="left:'+((cur+.5)/a.length*100).toFixed(2)+'%;top:'+(100-(Number(a[cur])<0?3:num(a[cur])/top*100)).toFixed(1)+'%">지금 '+usN(a[cur])+(Number(a[cur])>=0?'명':'')+'</span>':'';
  h+='<div class="dx-vb" role="img" aria-label="10분 칸 접속 막대">'+gl+a.map(function(v,i){ var fut=cur>=0&&i>cur, m=Number(v)<0; var t=usHm("07:00",i*10); return '<i class="'+(fut?"fut":i===cur?"now":m?"m":i===best?"mx":"")+'" title="'+t+' · '+usN(v)+'">'+dxBar("ut:"+i, fut?0:m?.03:num(v)/top, 1)+'</i>'; }).join("")+tip+'</div>';
  var ax=""; for(var t=7;t<=19;t++){ if(mob&&t%2) continue; ax+='<span style="left:'+((t-7)/12*100)+'%">'+("0"+t).slice(-2)+'</span>'; }
  h+='<div class="us-axis">'+ax+'</div><div class="us-mk">'+US_PROG.map(function(x){ return '<span style="left:'+((mins(x[0])-mins("07:00"))/720*100)+'%">'+esc(mob?x[1].split(" · ")[0]:x[1])+'</span>'; }).join("")+'</div>';
  return h+'<div class="us-lg">'+(cur>=0&&cur<a.length?'<span><b style="background:var(--dx-hot)"></b>지금 '+usHm("07:00",cur*10)+'~ · '+usN(a[cur])+'명</span>':'')+'<span><b></b>지난 10분 칸</span>'+(best>=0?'<span><b style="background:#C3CBE0"></b>최다 '+usHm("07:00",best*10)+'~ · '+usN(a[best])+'명</span>':'')+'</div>';
}
function usNice(v){ var p=Math.pow(10,Math.floor(Math.log10(Math.max(1,v)))), m=[1,1.5,2,3,5,10]; for(var i=0;i<m.length;i++) if(m[i]*p>=v) return m[i]*p; return 10*p; }
/* 시간대 · 사전 · 전체 = 날짜 막대(가장 많은 날 하나만 빗금) + 날짜 × 시 열지도 */
function usTimeDays(d){
  var days=d.days||[], dn=d.daysN||[], heat=d.heat||[], mob=usMob(), mx=Math.max.apply(null,[1].concat(dn.map(num)));
  var h='<h2>날짜별 접속 <span class="cap">그날 앱을 연 사람</span></h2>';
  if(!dn.some(function(v){ return num(v)!==0; })) return h+emptyH(d.per==="pre"?"아직 기록이 없습니다 · "+usMd(days[0])+" 00:00 부터":"아직 기록이 없습니다","");
  h+='<div class="dx-vd">'+dn.map(function(v,i){ var m=Number(v)<0; return '<div class="'+(num(v)===mx?"mx":"")+'"><em>'+usN(v)+'</em><span>'+dxBar("ud:"+i, m?.03:num(v)/mx, 1)+'</span></div>'; }).join("")+'</div><div class="us-dlab">'+days.map(function(x){ return '<span>'+usMd(x)+'</span>'; }).join("")+'</div>';
  var hrs=[]; for(var t=7;t<=23;t++) hrs.push(t);
  var hm2=Math.max.apply(null,[1].concat([].concat.apply([],heat).map(num))), step=mob?4:2;
  var g='<div class="us-hm" style="grid-template-columns:40px repeat('+hrs.length+',minmax(0,1fr))"><span></span>'+hrs.map(function(t){ return '<span class="hl">'+((t-7)%step===0?t:"")+'</span>'; }).join("");
  days.forEach(function(x,i){ g+='<span class="rl">'+usMd(x)+'</span>'; hrs.forEach(function(t){ var v=(heat[i]||[])[t]; var m=Number(v)<0; g+='<i class="c'+(m?" m":"")+'" style="'+(m||!num(v)?"":"opacity:"+(0.12+0.88*num(v)/hm2).toFixed(2))+'" title="'+usMd(x)+' '+t+'시 · '+usN(v)+'"></i>'; }); });
  return h+g+'</div><div class="us-lg"><span>칸 색 = 그 시간에 앱을 본 사람(진할수록 많음) · 연한 회색 = 5 미만</span></div>';
}
/* 261023 처음부터 · 누적선(그날까지 한 번이라도 연 사람) + 옅은 날짜 막대(그날 연 사람) · 오늘 뒤 날은 비움 · 날짜 × 시 열지도는 다른 기간과 같다 */
function usTimeCum(d){
  var cu=d.cum||[], days=d.days||[];
  var h='<h2>처음부터 누적 접속 <span class="cap">그날까지 한 번이라도 앱을 연 사람</span></h2>';
  if(!cu.some(function(v){ return num(v)>0; })) return h+emptyH("아직 기록이 없습니다 · "+usMd(days[0])+" 00:00 부터","");
  return h+'<div class="dx-area" id="usCum"></div>';
}
function usCumDraw(){
  var box=el("usCum"), d=S.data.use; if(!box||!d||!d.ok||!d.cum) return;
  var days=d.days||[], dn=d.daysN||[], cu=d.cum, n=0; days.forEach(function(x,i){ if(!d.today||x<=d.today) n=i+1; });
  var mob=usMob(), W=Math.max(260,box.clientWidth), H=mob?170:200, T=16, B=22, N=days.length, mx=Math.max.apply(null,[1].concat(cu.slice(0,n).map(num))), top=usNice(mx);
  var cx=function(i){ return (i+.5)*W/N; }, bw=W/N*.56, y=function(v){ return T+(H-T-B)*(1-v/top); };
  var gl=[.5,1].map(function(f){ var v=Math.round(top*f); return '<line x1="0" x2="'+W+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" class="gl"/><text x="'+(W-2)+'" y="'+(y(v)-4).toFixed(1)+'" text-anchor="end">'+n0(v)+'</text>'; }).join("");
  var bars=dn.slice(0,n).map(function(v,i){ var hv=Number(v)<0?0:num(v); return '<rect x="'+(cx(i)-bw/2).toFixed(1)+'" y="'+y(hv).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(0,y(0)-y(hv)).toFixed(1)+'" rx="2" class="bd"><title>'+usMd(days[i])+' 그날 '+usN(v)+'</title></rect>'; }).join("");
  var pts=[]; for(var i=0;i<n;i++){ if(Number(cu[i])>=0) pts.push(cx(i).toFixed(1)+","+y(num(cu[i])).toFixed(1)); }
  var lp=pts.length?pts[pts.length-1].split(","):null;
  var ax=days.map(function(x,i){ return (!mob||i%2===0)?'<text x="'+cx(i).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle">'+usMd(x)+'</text>':''; }).join("");
  box.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="처음부터 누적 접속 꺾은선">'+gl+bars+
    (pts.length>1?'<polyline points="'+pts.join(" ")+'" class="ln"/>':'')+(lp?'<circle cx="'+lp[0]+'" cy="'+lp[1]+'" r="4" class="pt"/>':'')+'<line x1="0" x2="'+W+'" y1="'+(H-B)+'" y2="'+(H-B)+'" class="ax"/>'+ax+'</svg>'+
    '<div class="dx-lg"><span><b style="background:var(--navy)"></b>누적 '+(n?usN(cu[n-1])+(Number(cu[n-1])>=0?"명":""):"-")+'</span><span><b style="background:var(--navy1)"></b>그날 연 사람</span></div>';
}
/* 화면별 총 체류 · 1위만 빗금 · 스태프 화면은 맨 아래 따로 */
function usScr(d){
  var all=(d.scr||[]), rows=all.filter(function(x){ return x.g!=="a"&&(num(x.sec)>0||num(x.n)!==0); }).sort(function(a,b){ return num(b.sec)-num(a.sec); }), st=all.filter(function(x){ return x.g==="a"; })[0];
  var h='<h2>화면별 총 체류 <span class="cap">앱이 그 화면에 떠 있던 시간</span></h2>';
  if(!rows.length) return h+emptyH("아직 화면 기록이 없습니다","");
  var mx=Math.max.apply(null,[1].concat(rows.map(function(x){ return num(x.sec); })));
  var row=function(x,i,dim){ return '<span class="nm'+(dim?" dim":"")+'">'+esc(x.nm)+'</span><span class="tr'+(!dim&&i===0?" hot":"")+'">'+dxBar("us:"+x.g, num(x.sec)/mx)+'</span><span class="r'+(dim?" dim":"")+'">'+usDur(x.sec)+'</span><span class="r s">'+(x.avg==null?(Number(x.n)<0?"5 미만":"-"):usMin(Math.round(x.avg)))+'</span>'; };
  h+='<div class="dx-hb c4"><span class="hd">화면</span><span></span><span class="hd r s">합계</span><span class="hd r s">1인</span>'+rows.map(function(x,i){ return row(x,i,false); }).join("")+(st&&(num(st.sec)>0)?'<span class="sep"></span>'+row(st,-1,true):'')+'</div>';
  return h+'<div class="cap mt">시험 사번 제외 · 사람 5명 미만 칸은 「5 미만」 · 알 수 없음 = 화면 이름을 보내지 않는 옛 앱</div>';
}
/* 면적 그래프 순위(스태프 제외 · 합계 큰 순 5개 · 나머지 = 그 밖) */
function usRank(d){ return (d.scr||[]).filter(function(x){ return x.g!=="a"&&num(x.sec)>0; }).sort(function(a,b){ return num(b.sec)-num(a.sec); }).slice(0,5).map(function(x){ return x.g; }); }
/* 261022 화면별 체류 · 시간대 = 거르기 알약(전체 · 순위 5개 · 그 밖) + 한 줄 꺾은선 + 옅은 면 + 비교(전날 같은 시간대 점선 · 서버 prev) */
function usSetAg(g){ US.ag=g; if(g==="all"&&US.am==="p") US.am="h"; usAreaDraw(); }
function usSetCmp(){ US.cmp=!US.cmp; usAreaDraw(); }
function usAreaDraw(){
  usCumDraw();   /* 261023 처음부터 누적선 · 폭에 맞춰 그림(같은 때 · 창 크기 바뀔 때) */
  var box=el("usArea"), d=S.data.use; if(!box||!d||!d.ok||!d.area) return;
  var A=d.area, rank=usRank(d), n=A.n, mob=usMob(), pv=d.prev&&d.prev.g?d.prev.g:null;
  var nm=function(g){ return ((d.grp||{})[g])||g; }, other=Object.keys(A.g).filter(function(g){ return g!=="a"&&rank.indexOf(g)<0&&(d.scr||[]).some(function(s){ return s.g===g&&num(s.sec)>0; }); });
  if(US.ag!=="all"&&US.ag!=="etc"&&rank.indexOf(US.ag)<0) US.ag="all";
  if(US.ag==="etc"&&!other.length) US.ag="all";
  var pick=function(G){ var gs=US.ag==="all"?Object.keys(G).filter(function(g){ return g!=="a"; }):US.ag==="etc"?other:[US.ag]; var o=[]; for(var i=0;i<n;i++){ var s=0; gs.forEach(function(g){ s+=num(G[g]&&G[g][i]); }); o.push(s); } return o; };
  var tot=function(G){ var o=[]; for(var i=0;i<n;i++){ var s=0; Object.keys(G).forEach(function(g){ if(g!=="a") s+=num(G[g]&&G[g][i]); }); o.push(s); } return o; };
  var T0=tot(A.g), cur=pick(A.g), pct=US.am==="p"&&US.ag!=="all";
  var sums=rank.map(function(g){ var s=0; (A.g[g]||[]).forEach(function(v){ s+=num(v); }); return s; }), so=0; other.forEach(function(g){ (A.g[g]||[]).forEach(function(v){ so+=num(v); }); });
  var all=sums.reduce(function(a,b){ return a+b; },so)||1;
  var pills='<div class="dx-flt" role="tablist" aria-label="화면 거르기"><button type="button" role="tab" aria-selected="'+(US.ag==="all")+'" class="'+(US.ag==="all"?"on":"")+'" onclick="usSetAg(\'all\')">전체</button>'+
    rank.map(function(g,i){ return '<button type="button" role="tab" aria-selected="'+(US.ag===g)+'" class="'+(US.ag===g?"on":"")+'" onclick="usSetAg(\''+g+'\')"><b style="opacity:'+US_OP[i]+'"></b>'+esc(nm(g))+'<small>'+Math.round(sums[i]/all*100)+'%</small></button>'; }).join("")+
    (other.length?'<button type="button" role="tab" aria-selected="'+(US.ag==="etc")+'" class="'+(US.ag==="etc"?"on":"")+'" onclick="usSetAg(\'etc\')"><b style="background:var(--line3)"></b>그 밖 '+other.length+'개<small>'+Math.round(so/all*100)+'%</small></button>':'')+'</div>';
  var head='<div class="dx-ah"><div><h2>화면별 체류 · 시간대</h2><span class="cap">'+(A.unit===10?"10분 칸":"1시간 칸")+' · 앱이 그 화면에 떠 있던 시간</span></div><span class="dx-shr">'+
    '<span class="dx-seg sm" role="tablist" aria-label="단위"><button type="button" class="'+(pct?"":"on")+'" onclick="usSetAm(\'h\')">시간</button><button type="button" class="'+(pct?"on":"")+'"'+(US.ag==="all"?' disabled title="화면 하나를 고르면 비중"':'')+' onclick="usSetAm(\'p\')">비중 %</button></span>'+
    '<button type="button" class="dx-cmp" aria-pressed="'+(US.cmp&&pv?"true":"false")+'"'+(pv?' onclick="usSetCmp()"':' disabled')+'><i></i>비교<span class="cap">전날 같은 시간대</span></button></span></div>';
  if(!T0.some(function(x){ return x>0; })){ box.innerHTML=head+pills+emptyH("아직 화면 기록이 없습니다",""); return; }
  var cut=-1; if(d.per==="day"&&A.unit===10&&d.bars&&d.bars.now) cut=Math.round((mins(d.bars.now)-mins("07:00"))/10);
  else if(A.unit===60&&d.t){ var di=(d.days||[]).indexOf(String(d.t).slice(0,10)); if(di>=0) cut=di*24+Number(String(d.t).slice(11,13)); }   /* 261022 지금 뒤 칸은 선을 긋지 않는다 */
  var val=function(a,TT,i){ return pct?(TT[i]?a[i]/TT[i]:0):a[i]; };
  var P=null, PT=null; if(US.cmp&&pv){ P=pick(pv); PT=tot(pv); }
  var mxV=0; for(var i=0;i<n;i++){ if(cut<0||i<=cut) mxV=Math.max(mxV,val(cur,T0,i)); if(P) mxV=Math.max(mxV,val(P,PT,i)); }
  var W=Math.max(280,box.clientWidth), H=mob?190:230, T=14, B=24, top=pct?Math.min(1,Math.ceil(mxV*10)/10||1):mxV<3600?usNice(Math.max(1,mxV/60))*60:usNice(mxV/3600)*3600;
  var x=function(i){ return i*W/Math.max(1,n-1); }, y=function(v){ return T+(H-T-B)*(1-v/top); };
  var line=function(a,TT,lim){ var p=[]; for(var i=0;i<n;i++){ if(lim>=0&&i>lim) break; p.push(x(i).toFixed(1)+","+y(val(a,TT,i)).toFixed(1)); } return p; };
  var pc=line(cur,T0,cut), last=pc.length?pc[pc.length-1].split(","):null;
  var gr=[.5,1].map(function(f){ var v=top*f; return '<line x1="0" x2="'+W+'" y1="'+y(v)+'" y2="'+y(v)+'" class="gl"/><text x="'+(W-2)+'" y="'+(y(v)-4)+'" text-anchor="end">'+(pct?Math.round(v*100)+"%":v<3600?Math.round(v/60)+"분":(Math.round(v/360)/10)+"시간")+'</text>'; }).join("");
  var ax="";
  if(A.unit===10){ for(var t=7;t<=19;t++){ if(mob&&t%2) continue; var ix=(t-7)*6; ax+='<text x="'+Math.min(W-8,Math.max(8,x(ix)))+'" y="'+(H-6)+'" text-anchor="middle">'+("0"+t).slice(-2)+'</text>'; } }
  else (d.days||[]).forEach(function(dy,di){ var ix=di*24; if(di) ax+='<line x1="'+x(ix)+'" x2="'+x(ix)+'" y1="'+T+'" y2="'+(H-B)+'" class="gl"/>'; if(!mob||di%2===0||(d.days||[]).length<=3) ax+='<text x="'+(x(ix)+(di?4:0))+'" y="'+(H-6)+'" text-anchor="start">'+usMd(dy)+'</text>'; });
  var svg='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="화면별 체류 꺾은선"><defs><linearGradient id="usFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00205B" stop-opacity=".16"/><stop offset="1" stop-color="#00205B" stop-opacity="0"/></linearGradient></defs>'+gr+
    (pc.length>1?'<polygon points="0,'+y(0)+' '+pc.join(" ")+' '+last[0]+','+y(0)+'" fill="url(#usFill)"/>':'')+
    (P?'<polyline points="'+line(P,PT,-1).join(" ")+'" class="pv"/>':'')+
    (pc.length>1?'<polyline points="'+pc.join(" ")+'" class="ln"/><circle cx="'+last[0]+'" cy="'+last[1]+'" r="4" class="pt"/>':'')+
    '<line x1="0" x2="'+W+'" y1="'+(H-B)+'" y2="'+(H-B)+'" class="ax"/>'+ax+'</svg>';
  var lg='<div class="dx-lg"><span><b style="background:var(--navy)"></b>'+(US.ag==="all"?"전체":US.ag==="etc"?"그 밖":esc(nm(US.ag)))+(pct?" 비중":"")+'</span>'+(P?'<span><b class="pv"></b>전날 같은 시간대</span>':'')+'</div>';
  box.innerHTML=head+pills+svg+lg+(other.length?'<div class="cap mt4">그 밖 = '+esc(other.map(nm).join(", "))+'</div>':'')+(A.unit===60?'<div class="cap mt4">세로 점선 = 날짜 경계</div>':'');
}
function usFloor(d){
  var h='<h2>현장 층별 <span class="cap">사람 · 머문 시간 중앙값</span></h2>';
  if(!d.floor) return h+emptyH("현장 기록 없음 · 행사 당일 "+usMd(d.ev)+" 부터","");
  var rows=d.floor, any=rows.some(function(r){ return num(r.n)!==0; });
  if(!any) return h+emptyH("아직 현장 기록이 없습니다","");
  var mv=function(r){ if(r.live) return tag("진행 중","ok"); if(r.basis==="방문 수") return r.n?"방문 "+n0(r.visits)+"회":"-"; if(r.basis==="오른 층") return r.n?n0(r.floors)+"층":"-"; return r.min==null?"-":usMin(r.min)+(r.noEnd?'<small class="cap"> · 끝 없음 '+n0(r.noEnd)+'</small>':''); };
  h+='<table class="tb us-fl"><thead><tr><th>층</th><th>곳</th><th class="n">사람</th><th class="n">머문 시간</th><th class="n hs">근거</th></tr></thead><tbody>'+rows.map(function(r){ return '<tr><td>'+esc(r.fl)+'</td><td>'+esc(r.nm)+'</td><td class="n">'+usN(r.n)+'</td><td class="n">'+mv(r)+'</td><td class="n hs">'+tag(r.basis,"off")+'</td></tr>'; }).join("")+'</tbody></table>';
  return h+'<div class="cap mt">실측 = 입장 · 끝 QR 사이 · 추정 = 참석 × 칸 길이 · 방문 수 = 스캔 횟수</div>';
}
/* 접속 경로 · 기기 · 사람 기준 */
/* 접속 경로 · 기기 · 사람 기준 · 261022 띠 굵게 · 차오름 */
function usRoute(d){
  var r=d.route||{ r:[], d:[] }, h='<h2>접속 경로 · 기기 <span class="cap">사람 기준</span></h2>';
  if(!r.r.some(function(x){ return num(x.rate)>0; })) return h+emptyH("아직 접속 기록이 없습니다","")+(r.anon?'<div class="cap mt">로그인 전 이탈 '+n0(r.anon)+'대 · 사람 수에 넣지 않음</div>':'');
  var strip=function(k,a){ a=a.filter(function(x){ return num(x.rate)>0; }); return '<div class="dx-st">'+dxBar(k,1,0,a.map(function(x,i){ return '<i style="width:'+x.rate+'%;background:var(--navy);opacity:'+(US_OP[i]||.15)+'" title="'+esc(x.nm)+' '+x.rate+'%"></i>'; }).join(""))+'</div><div class="dx-lg">'+a.map(function(x,i){ return '<span><b style="background:var(--navy);opacity:'+(US_OP[i]||.15)+'"></b>'+esc(x.nm)+'<em>'+x.rate+'%</em></span>'; }).join("")+'</div>'; };
  return h+'<div class="cap">경로</div>'+strip("ur:r",r.r)+'<div class="cap mt">기기</div>'+strip("ur:d",r.d)+'<div class="cap mt">로그인 전 이탈 '+n0(r.anon)+'대 · 사람 수에 넣지 않음</div>';
}
window.addEventListener("resize",function(){ clearTimeout(US.rs); US.rs=setTimeout(function(){ if(S.tab==="now") usAreaDraw(); },150); });
