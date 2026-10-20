/* AXF CONTROL v2 · 지금 › 앱 사용 (261017 · 설계 = 디자인 시안/앱 사용 대시보드/설계.md · 사용자 D1~D9 · D5 3분)
 * 데이터 = usage_stats(관리코드 · per pre | all | day · 당일 1분 · 그 밖 5분) · 사람 이름 · 사번 · 부문 없음 · 5 미만 칸 = -1
 * 기간 = 이 브라우저에만 기억(localStorage · 실패해도 기본값) · 기본 = 사전 오픈 날 pre · 행사일 day · 그 밖 all
 * 그리는 곳 = now.js(지금 탭) · 당일 08:00~17:30 이면 이상 신호 아래, 그 밖은 맨 위(D6) */
var US={ per:"", am:"h", rs:0 };
var US_LS=skey("axf_usage_p");
var US_PROG=[["09:30","Opening · Keynote"],["13:30","AWS"],["15:10","MS"],["17:00","Closing"]];
var US_OP=[1,.78,.56,.38,.22];   /* 화면 겹 · 네이비 농도(순위 1~5) · 그 밖 = 회색 */
function usDay(ymd, n){ var a=String(ymd||"").split("-"); if(a.length<3) return ""; var d=new Date(+a[0],+a[1]-1,+a[2]+n); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
function usMd(ymd){ var s=String(ymd||""); return s.length>=10?Number(s.slice(5,7))+"/"+Number(s.slice(8,10)):""; }
function usEv(){ var b=S.data.nb; return b&&b.ev?String(b.ev):"2026-10-26"; }
function usPerDef(){ var b=S.data.nb||{}, d=String(b.day||""), ev=usEv(); if(!d) return "day"; if(d===ev) return "day"; if(d<usDay(ev,-4)) return "pre"; return "all"; }
function usPer(){ if(US.per) return US.per; var v=""; try{ v=localStorage.getItem(US_LS)||""; }catch(e){ v=""; } return /^(pre|all|day)$/.test(v)?v:usPerDef(); }
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
  var ev=usEv(), L={ pre:usMd(usDay(ev,-7))+"~"+usMd(usDay(ev,-5)).split("/")[1], all:usMd(usDay(ev,-4))+"~"+usMd(usDay(ev,1)).split("/")[1], day:usMd(ev) };
  return '<div class="us-seg" role="tablist" aria-label="기간">'+[["pre","사전 오픈"],["all","전체 오픈"],["day","행사 당일"]].map(function(x){ var on=x[0]===per; return '<button type="button" role="tab" aria-selected="'+(on?"true":"false")+'" class="'+(on?"on":"")+'" onclick="usSet(\''+x[0]+'\')">'+x[1]+'<small>'+esc(L[x[0]])+'</small></button>'; }).join("")+'</div>';
}
function nwUsage(b){
  var per=usPer(), d=S.data.use, g=dataGate("use","앱 사용"), live=d&&d.ok&&d.per===per;
  var upd=live?'갱신 '+esc(String(d.t||"").slice(11,16))+' · '+(per==="day"?"1분마다":"5분마다")+' · 시험 사번 제외':"";
  var h='<div class="us-h"><h2>앱 사용</h2>'+usSegH(per)+'<span class="cap us-upd">'+upd+'</span></div>';
  if(g) return h+'<div class="card mb">'+g+'</div>'+usAccLine(b);
  if(!live) return h+'<div class="card mb">'+skel()+'</div>'+usAccLine(b);
  var k=d.kpi||{}, stale=S.err.use?" stale":"";
  var k4=per==="day"?{ l:"지금 보는 사람", v:k.now==null?"-":usN(k.now), u:k.now!=null&&k.now>=0?"명":"", s:k.now==null?"행사 당일에만 셉니다":"최근 3분 · 비로그인 기기 제외" }
    :{ l:"가장 붐빈 때", v:k.peak?usN(k.peak.n):"-", u:k.peak&&k.peak.n>=0?"명":"", s:k.peak?usMd(k.peak.t)+" "+String(k.peak.t).slice(11,16)+"~"+usHm(String(k.peak.t).slice(11,16),10):"기록 없음" };
  h+='<div class="grid g4 mb'+stale+'">'+
    drKpiGo({ l:"접속한 사람", v:n0(k.people), u:"명", s:"명부 "+n0(k.roster)+"명 중 "+(k.roster?(Math.round(num(k.people)*1000/num(k.roster))/10):0)+"%" }, "usage")+
    kpi({ l:"1인 체류 중앙값", v:n0(k.med), u:"분", s:"합계 "+n0(k.sumH)+"시간" })+
    kpi({ l:"앱 연 횟수", v:n0(k.opens), u:"회", s:"1인 "+(k.opp||0)+"회" })+
    kpi(k4)+'</div>';
  h+='<div class="grid g32 mb"><div class="card'+stale+'">'+(per==="day"?usTimeDay(d):usTimeDays(d))+'</div><div class="card'+stale+'">'+usScr(d)+'</div></div>';
  h+='<div class="card mb us-area'+stale+'"><div class="us-ah"><h2>화면별 체류 · 시간대</h2><span class="cap">'+(per==="day"?"10분 칸":"1시간 칸")+' · 앱이 그 화면에 떠 있던 시간</span><div class="us-seg sm" role="tablist" aria-label="면적도 단위"><button type="button" id="usAmH" onclick="usSetAm(\'h\')">시간</button><button type="button" id="usAmP" onclick="usSetAm(\'p\')">비중 %</button></div></div><div id="usArea"></div></div>';
  h+='<div class="grid g32 mb"><div class="card'+stale+'">'+usFloor(d)+'</div><div class="card'+stale+'">'+usRoute(d)+'</div></div>';
  return h+usAccLine(b);
}
/* 옛 「접속」 카드 숫자(사전 신청자 · 스태프 · 가입 · PIN 대기)를 한 줄로 · 260919 콘솔 토큰 그대로 */
function usAccLine(b){
  var r=S.data.rst, ok=r&&r.ok, p=(b&&b.people)||{}, att=(b&&b.att)||{};
  var pre=p.todayPre!=null?n0(p.todayPre)+" / "+n0(p.pre):(ok?n0(r.pre10&&r.pre10.acct)+" / "+n0(r.pre10&&r.pre10.n)+" 가입":"-");
  var stf=p.todayStaff!=null?n0(p.todayStaff)+" / "+n0(p.staff):(ok?n0(r.staff&&r.staff.acct)+" / "+n0(r.staff&&r.staff.n)+" 가입":"-");
  return '<div class="card mb us-acc"><span><b>오늘 접속</b> '+n0(p.today)+'명</span><span><b>사전 신청자</b> '+pre+'</span><span><b>스태프</b> '+stf+'</span><span><b>PIN 대기</b> '+n0(b&&b.pw)+'</span><span><b>가입</b> '+n0(p.acct)+'</span><span><b>17F 출석</b> '+n0(num(att.l1&&att.l1.in)+num(att.l2&&att.l2.in))+'</span><span><b>구독</b> '+n0(b&&b.push&&b.push.subs)+'대</span></div>';
}
/* 시간대 · 당일 07:00~19:00 10분 막대 */
function usTimeDay(d){
  var B=d.bars||{ n:[] }, a=B.n||[], mob=usMob(), cur=B.now?Math.round((mins(B.now)-mins("07:00"))/10):-1;
  var mx=Math.max.apply(null,[1].concat(a.map(num))), top=usNice(mx), gl=[top/3,top*2/3,top].map(function(v){ v=Math.round(v); return '<div class="us-gl" style="bottom:'+(v/top*100)+'%"><span>'+n0(v)+'</span></div>'; }).join("");
  var best=-1; a.forEach(function(v,i){ if(best<0||num(v)>num(a[best])) best=i; });
  var h='<h2>시간대별 접속 <span class="cap">10분마다 앱을 본 사람</span></h2>';
  if(!a.some(function(v){ return num(v)!==0; })) return h+emptyH("아직 기록이 없습니다","");
  h+='<div class="us-bars" role="img" aria-label="10분 칸 접속 막대">'+gl+a.map(function(v,i){ var fut=cur>=0&&i>cur, m=Number(v)<0; var t=usHm("07:00",i*10); return '<i class="'+(fut?"fut":i===cur?"now":m?"m":"")+'" style="height:'+(fut?0:m?3:Math.round(num(v)/top*1000)/10)+'%" title="'+t+' · '+usN(v)+'"></i>'; }).join("")+'</div>';
  var ax=""; for(var t=7;t<=19;t++){ if(mob&&t%2) continue; ax+='<span style="left:'+((t-7)/12*100)+'%">'+("0"+t).slice(-2)+'</span>'; }
  h+='<div class="us-axis">'+ax+'</div><div class="us-mk">'+US_PROG.map(function(x){ return '<span style="left:'+((mins(x[0])-mins("07:00"))/720*100)+'%">'+esc(mob?x[1].split(" · ")[0]:x[1])+'</span>'; }).join("")+'</div>';
  return h+'<div class="us-lg">'+(cur>=0&&cur<a.length?'<span><b class="now"></b>지금 '+usHm("07:00",cur*10)+'~ · '+usN(a[cur])+'명</span>':'')+'<span><b></b>지난 10분 칸</span>'+(best>=0?'<span>최다 '+usHm("07:00",best*10)+'~ · '+usN(a[best])+'명</span>':'')+'</div>';
}
function usNice(v){ var p=Math.pow(10,Math.floor(Math.log10(Math.max(1,v)))), m=[1,1.5,2,3,5,10]; for(var i=0;i<m.length;i++) if(m[i]*p>=v) return m[i]*p; return 10*p; }
/* 시간대 · 사전 · 전체 = 날짜 막대 + 날짜 × 시 열지도 */
function usTimeDays(d){
  var days=d.days||[], dn=d.daysN||[], heat=d.heat||[], mob=usMob(), mx=Math.max.apply(null,[1].concat(dn.map(num)));
  var h='<h2>날짜별 접속 <span class="cap">그날 앱을 연 사람</span></h2>';
  if(!dn.some(function(v){ return num(v)!==0; })) return h+emptyH(d.per==="pre"?"아직 기록이 없습니다 · "+usMd(days[0])+" 00:00 부터":"아직 기록이 없습니다","");
  h+='<div class="us-dbars">'+dn.map(function(v){ var m=Number(v)<0; return '<div class="'+(num(v)===mx?"mx":"")+'"><em class="n">'+usN(v)+'</em><i style="height:'+(m?3:Math.round(num(v)/mx*92))+'px"></i></div>'; }).join("")+'</div><div class="us-dlab">'+days.map(function(x){ return '<span>'+usMd(x)+'</span>'; }).join("")+'</div>';
  var hrs=[]; for(var t=7;t<=23;t++) hrs.push(t);
  var hm2=Math.max.apply(null,[1].concat([].concat.apply([],heat).map(num))), step=mob?4:2;
  var g='<div class="us-hm" style="grid-template-columns:40px repeat('+hrs.length+',minmax(0,1fr))"><span></span>'+hrs.map(function(t){ return '<span class="hl">'+((t-7)%step===0?t:"")+'</span>'; }).join("");
  days.forEach(function(x,i){ g+='<span class="rl">'+usMd(x)+'</span>'; hrs.forEach(function(t){ var v=(heat[i]||[])[t]; var m=Number(v)<0; g+='<i class="c'+(m?" m":"")+'" style="'+(m||!num(v)?"":"opacity:"+(0.12+0.88*num(v)/hm2).toFixed(2))+'" title="'+usMd(x)+' '+t+'시 · '+usN(v)+'"></i>'; }); });
  return h+g+'</div><div class="us-lg"><span>칸 색 = 그 시간에 앱을 본 사람(진할수록 많음) · 연한 회색 = 5 미만</span></div>';
}
/* 화면별 총 체류 · 스태프 화면은 맨 아래 따로 */
function usScr(d){
  var all=(d.scr||[]), rows=all.filter(function(x){ return x.g!=="a"&&(num(x.sec)>0||num(x.n)!==0); }).sort(function(a,b){ return num(b.sec)-num(a.sec); }), st=all.filter(function(x){ return x.g==="a"; })[0];
  var h='<h2>화면별 총 체류 <span class="cap">앱이 그 화면에 떠 있던 시간</span></h2>';
  if(!rows.length) return h+emptyH("아직 화면 기록이 없습니다","");
  var mx=Math.max.apply(null,[1].concat(rows.map(function(x){ return num(x.sec); }))), rank=usRank(d);
  var row=function(x,dim){ var j=rank.indexOf(x.g), bg=dim?"":j>=0&&j<5?'background:var(--navy);opacity:'+US_OP[j]:'background:var(--line3)'; return '<span class="nm'+(dim?" dim":"")+'">'+esc(x.nm)+'</span><span><span class="bar'+(dim?" dim":"")+'"><i style="width:'+Math.round(num(x.sec)/mx*1000)/10+'%;'+bg+'"></i></span></span><span class="r">'+usDur(x.sec)+'</span><span class="r">'+(x.avg==null?(Number(x.n)<0?"5 미만":"-"):usMin(Math.round(x.avg)))+'</span>'; };
  h+='<div class="us-rk"><span class="hd">화면</span><span></span><span class="hd">합계</span><span class="hd">1인</span>'+rows.map(function(x){ return row(x,false); }).join("")+(st&&(num(st.sec)>0)?'<span class="sep"></span>'+row(st,true):'')+'</div>';
  return h+'<div class="cap mt">시험 사번 제외 · 사람 5명 미만 칸은 「5 미만」 · 알 수 없음 = 화면 이름을 보내지 않는 옛 앱</div>';
}
/* 면적도 겹 순위(스태프 제외 · 합계 큰 순 5개 · 나머지 = 그 밖) */
function usRank(d){ return (d.scr||[]).filter(function(x){ return x.g!=="a"&&num(x.sec)>0; }).sort(function(a,b){ return num(b.sec)-num(a.sec); }).slice(0,5).map(function(x){ return x.g; }); }
function usAreaDraw(){
  var box=el("usArea"), d=S.data.use; if(!box||!d||!d.ok||!d.area) return;
  var hb=el("usAmH"), pb=el("usAmP"), pct=US.am==="p";
  if(hb){ hb.className=pct?"":"on"; pb.className=pct?"on":""; }
  var A=d.area, rank=usRank(d), n=A.n, mob=usMob();
  var pts=[]; for(var i=0;i<n;i++){ var v=rank.map(function(g){ return num(A.g[g]&&A.g[g][i]); }), o=0; Object.keys(A.g).forEach(function(g){ if(g!=="a"&&rank.indexOf(g)<0) o+=num(A.g[g][i]); }); v.push(o); pts.push(v); }
  var tot=pts.map(function(v){ return v.reduce(function(a,b){ return a+b; },0); });
  if(!tot.some(function(x){ return x>0; })){ box.innerHTML=emptyH("아직 화면 기록이 없습니다",""); return; }
  if(d.per==="day"&&A.unit===10&&d.bars&&d.bars.now){ var cut=Math.round((mins(d.bars.now)-mins("07:00"))/10); pts=pts.map(function(v,i){ return i>cut?null:v; }); }
  var W=Math.max(280,box.clientWidth), H=mob?190:230, T=22, B=22, mxS=Math.max.apply(null,[1].concat(tot)), mxH=usNice(mxS/3600);
  var x=function(i){ return i*(W)/(Math.max(1,n-1)); }, y=function(v){ return T+(H-T-B)*(1-v); };
  var acc=pts.map(function(){ return 0; }), paths=[];
  for(var j=0;j<rank.length+1;j++){
    var top=[], bot=[];
    pts.forEach(function(v,i){ if(!v) return; var s=pct?(tot[i]?1/tot[i]:0):1/(mxH*3600); bot.push([x(i),y(acc[i]*s)]); acc[i]+=v[j]; top.push([x(i),y(acc[i]*s)]); });
    if(!top.length) continue;
    var dd="M"+top.map(function(q){ return q[0].toFixed(1)+","+q[1].toFixed(1); }).join("L")+"L"+bot.reverse().map(function(q){ return q[0].toFixed(1)+","+q[1].toFixed(1); }).join("L")+"Z";
    paths.push('<path d="'+dd+'" style="fill:'+(j<rank.length?"var(--navy);fill-opacity:"+US_OP[j]:"var(--line3)")+'"/>');
  }
  var gr=[.5,1].map(function(v){ return '<line x1="0" x2="'+W+'" y1="'+y(v)+'" y2="'+y(v)+'" class="gl"/><text x="'+(W-2)+'" y="'+(y(v)-4)+'" text-anchor="end">'+(pct?Math.round(v*100)+"%":(Math.round(v*mxH*10)/10)+"시간")+'</text>'; }).join("");
  var ax="";
  if(A.unit===10){ for(var t=7;t<=19;t++){ if(mob&&t%2) continue; var ix=(t-7)*6; ax+='<text x="'+Math.min(W-8,Math.max(8,x(ix)))+'" y="'+(H-6)+'" text-anchor="middle">'+("0"+t).slice(-2)+'</text>'; } }
  else (d.days||[]).forEach(function(dy,di){ var ix=di*24; if(di) ax+='<line x1="'+x(ix)+'" x2="'+x(ix)+'" y1="'+T+'" y2="'+(H-B)+'" class="dl"/>'; if(!mob||di%2===0||(d.days||[]).length<=3) ax+='<text x="'+(x(ix)+(di?4:0))+'" y="'+(H-6)+'" text-anchor="start">'+usMd(dy)+'</text>'; });
  var sums=[]; for(var k=0;k<rank.length+1;k++) sums.push(0); pts.forEach(function(v){ if(v) v.forEach(function(q,k2){ sums[k2]+=q; }); }); var all=sums.reduce(function(a,b){ return a+b; },0)||1;
  var nm=function(g){ return ((d.grp||{})[g])||g; }, other=Object.keys(A.g).filter(function(g){ return g!=="a"&&rank.indexOf(g)<0&&(d.scr||[]).some(function(s){ return s.g===g&&num(s.sec)>0; }); }).map(nm);
  box.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="화면별 체류 누적 면적도">'+gr+paths.reverse().join("")+'<line x1="0" x2="'+W+'" y1="'+(H-B)+'" y2="'+(H-B)+'" class="ax"/>'+ax+'</svg>'+
    '<div class="us-lg">'+rank.map(function(g,i){ return '<span><b style="background:var(--navy);opacity:'+US_OP[i]+'"></b>'+esc(nm(g))+'<em>'+Math.round(sums[i]/all*100)+'%</em></span>'; }).join("")+(other.length?'<span><b style="background:var(--line3)"></b>그 밖 '+other.length+'개<em>'+Math.round(sums[rank.length]/all*100)+'%</em></span>':'')+'</div>'+
    (other.length?'<div class="cap mt4">그 밖 = '+esc(other.join(", "))+'</div>':'')+(A.unit===60?'<div class="cap mt4">흰 세로선 = 날짜 경계</div>':'');
}
/* 현장 층별 */
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
function usRoute(d){
  var r=d.route||{ r:[], d:[] }, h='<h2>접속 경로 · 기기 <span class="cap">사람 기준</span></h2>';
  if(!r.r.some(function(x){ return num(x.rate)>0; })) return h+emptyH("아직 접속 기록이 없습니다","")+(r.anon?'<div class="cap mt">로그인 전 이탈 '+n0(r.anon)+'대 · 사람 수에 넣지 않음</div>':'');
  var strip=function(a){ a=a.filter(function(x){ return num(x.rate)>0; }); return '<div class="us-st">'+a.map(function(x,i){ return '<i style="width:'+x.rate+'%;background:var(--navy);opacity:'+(US_OP[i]||.15)+'" title="'+esc(x.nm)+' '+x.rate+'%"></i>'; }).join("")+'</div><div class="us-sl">'+a.map(function(x,i){ return '<span><b style="background:var(--navy);opacity:'+(US_OP[i]||.15)+'"></b>'+esc(x.nm)+'<em>'+x.rate+'%</em></span>'; }).join("")+'</div>'; };
  return h+'<div class="cap">경로</div>'+strip(r.r)+'<div class="cap mt">기기</div>'+strip(r.d)+'<div class="cap mt">로그인 전 이탈 '+n0(r.anon)+'대 · 사람 수에 넣지 않음</div>';
}
window.addEventListener("resize",function(){ clearTimeout(US.rs); US.rs=setTimeout(function(){ if(S.tab==="now") usAreaDraw(); },150); });
