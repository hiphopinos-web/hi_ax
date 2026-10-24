/* AXF CONTROL v2 · 설문 탭(261024 · 사용자 「ADMIN 페이지 자체에 설문 탭 · 테스트 숫자들만 따로 · 대시보드는 홈 화면 참고」)
 * 하단 탭 「설문」(설정 앞 · core.js TABS 글자는 그대로 두고 여기서 끼움) · 옛 설정 › 설문 칩 · #log/sv = 이 탭으로 넘김(routeFix)
 * 맨 위 = 실제 응답 | 테스트 응답 · 칩 = 전체 | 일반 | 사전 신청자(서버 kind gen · pre)
 * 데이터 = survey_list(30초) · 실제 = 사후설문 시트(시험 사번 뺌 · test=1 이면 포함) · 테스트 = src=test(설문 테스트 페이지 응답 · 설문테스트 시트 · 실제와 섞지 않음)
 *   더한 칸(261024 서버) = kinds { gen, pre } · tl [[YYYY-MM-DD HH:M0, 수]] 10분 칸 · p1(PART 1 집계 · 사전 줄) · sess { A: 수 } · sessNm
 * 화면 = 숫자 4칸(dxTile · 홈과 같은 부품) · 시간대별 응답(10분 막대) · 세션별 · Q1 · Q2 · Q3(분포 svyBlock) · PART 1(사전) · Q4 자유 의견 · PART 1 서술(공통 표)
 * 엑셀 = 집계(사번 없음 · 문항 · 프로그램 · 서술 · PART 1 · 세션) · 테스트 응답 행(survey_test_rows · 사번 없음)
 *        원본(survey_rows · 사번 · 이름 · 부문 · 슈퍼관리자만 · 확인 창) · 테스트 응답 지우기(sv_test_clear · 슈퍼관리자 · 확인 창) · 실제 응답 지우기는 없다
 * v8.60 (사용자 261023 새 설문안) Q1-1~3 · Q2-x = 슬라이더 0.5 단위(분포 9칸 · 서버 opts 그대로) · 프로그램 8개 · 서버 설문 id post3(옛 post2 도 그대로 읽음) */
var SVY_T={ q1_1:"전반 만족", q1_2:"행사 운영", q1_3:"재참여 · 추천", q1_4:"업무에 AI 활용 생각", q3_1:"AX 3개년 로드맵", q3_2:"Hi-헬퍼 · HiDi-Q 이해", q3_3:"DAP" };
var SVY_P1T={ session:"참여 세션", job:"소속 직군", level:"듣기 전 AI 활용 수준", s_difficulty:"교육 난이도", s_instructor:"강사 설명", s_pacing:"실습 시간 · 진행 속도", s_env:"실습 환경", overall:"세션 전반 만족",
  e_skill:"AI 활용 역량 향상", e_share:"동료에게 공유할 의향", e_retake:"심화 교육 재참여 의향", apply:"적용해 볼 업무", parts:"AI가 맡을 부분", task_name:"그 업무", customer_data:"고객 정보 자료 필요",
  barriers:"업무 연결이 어려운 이유", good:"좋았던 점 · 아쉬웠던 점", wish:"듣고 싶은 AI 교육 주제", interview:"인터뷰 참여 의향" };
var SVY={ test:false, src:"", busy:"", Q:{}, open:"", ret:null, ct:0 };
var SV_KINDS=[["all","전체"],["gen","일반"],["pre","사전 신청자"]];
var SV_PRE_P=["q2_1","q2_2","q2_3","q2_4","q2_5"];   /* 사전 신청자 설문 PART 2 프로그램 = 1F 5개(서버 SVP_PIDS) */
LG_SUBS.splice(1,0,["sv","설문"]);   /* 옛 자리 · 누르면 설문 탭(routeFix) */
TABS.splice(Math.max(0,TABS.length-1),0,["sv","설문","설문"]);
IC.sv='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5h16v11.5H10l-6 4.5z"/><path d="M8 8.5h8M8 12h5"/></svg>';
(function(){ var rf0=routeFix; routeFix=function(tab, sub){ if(tab==="log"&&String(sub==null?"":sub)==="sv") return ["sv"]; return rf0(tab, sub); }; })();
function svSub(){ return subsOf(SV_KINDS,"all"); }
function svKind(){ var s=svSub(); return s==="all"?"":s; }
function svKey(){ return "svl"+(SVY.src?"t":SVY.test?"x":"")+svSub(); }
function svParams(){ var p={}; if(SVY.src) p.src="test"; else if(SVY.test) p.test="1"; var k=svKind(); if(k) p.kind=k; return p; }
function svData(){ var d=S.data[svKey()]; return d&&d.ok&&(!SVY.src||d.src==="test")?d:null; }
function svUnit(){ return SVY.src?"건":"명"; }
function svyPc(a,b){ return b>0?Math.round(a/b*1000)/10:0; }
function svyAvg(v){ return v==null||v===""?"-":Number(v).toFixed(2); }
function svyNo(id){ return String(id||"").toUpperCase().replace("_","-"); }
/* 261024 (사용자 확정 · 시안 svdash_mock) 문항 카드 = 제목 + 「전체 보기 ›」 + 질문 한 줄 + 도넛(평균 ÷ 만점) 또는 선택지 막대 + 답 수 · 카드 전체가 단추
 * 5점 문항 = q.top 5 · 선택지형 = q.top 5 미만(Q1-4 3점) 또는 점수 없는 보기 문항(PART 1 직군 · 수준 · 여러 개 고름) · 평균 · 점수 표기 없음 · 최다 선택지만 네이비(동률 = 둘 다)
 * 전체 보기 = svyOpen(열쇠) · 넓은 화면 = 가운데 창 · 600px 아래 = 전체 화면 · 창은 #vb 밖(body 끝)이라 30초 갱신(svyPaint)이 다시 그려도 닫히지 않고 내용만 바뀜
 * 움직임 = 전역 스킬 mobile-popup-motion(들어옴 300ms 6px 떠오름 · 나감 180ms 흐려짐 · 동작 줄이기 = 바로) */
function svyCh(q){ return !(Number(q.top)>=5); }
function svyKey(q, no){ return (no===""?"p1:":"q:")+q.id; }
/* 도넛 · 링 = 평균 ÷ 만점 · 선 끝 둥글게 · 0건 = 빈 링과 「-」 */
function svyDonut(avg, top, big){
  top=Number(top)||5; var v=avg==null||avg===""||!isFinite(Number(avg))?null:Number(avg), f=v==null?0:Math.max(0,Math.min(1,v/top)), r=42, C=2*Math.PI*r;
  return '<span class="svd-dn'+(big?" svd-lg":"")+'" role="img" aria-label="평균 '+(v==null?"없음":v.toFixed(2))+' · '+top+'점 만점"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="svd-tr" cx="50" cy="50" r="'+r+'"/>'+
    (f>0?'<circle class="svd-fl" cx="50" cy="50" r="'+r+'" stroke-dasharray="'+(C*f).toFixed(2)+' '+C.toFixed(2)+'"/>':'')+
    '</svg><span class="svd-ct"><span class="svd-v n">'+(v==null?"-":v.toFixed(2))+'</span><span class="svd-u">/ '+top+'</span></span></span>';
}
/* 선택지 막대 · 글 + 막대 + 「18명 · 60%」 · 최다만 네이비 · 굵게 */
function svyChoice(q){
  var n=q.n||0, D=q.dist||{}, mx=0, u=svUnit();
  (q.opts||[]).forEach(function(o){ mx=Math.max(mx, num(D[o[0]])); });
  return '<span class="svd-ch">'+(q.opts||[]).map(function(o){ var c=num(D[o[0]]), p=svyPc(c,n);
    return '<span class="svd-o'+(c>0&&c===mx?" hi":"")+'"><span class="svd-ot"><span>'+esc(o[1])+'</span><span class="n">'+n0(c)+u+' · '+p+'%</span></span><span class="svd-ob"><i style="width:'+p+'%"></i></span></span>'; }).join("")+'</span>';
}
/* 점수별 분포 · 전체 보기 오른쪽(좁은 화면 = 도넛 아래) · q.opts 그대로(0.5 단위 9칸 · 정수 5칸) */
function svyDist(q){
  var n=q.n||0;
  return '<table class="tb svy-d svd-dt"><tbody>'+(q.opts||[]).map(function(o){ var c=num((q.dist||{})[o[0]]); return '<tr><td><b class="n">'+esc(o[0])+'</b><span class="svd-lb">'+esc(o[1])+'</span></td><td class="svy-b"><div class="bar"><i style="width:'+svyPc(c,n)+'%"></i></div></td><td class="n">'+n0(c)+' · '+svyPc(c,n)+'%</td></tr>'; }).join("")+'</tbody></table>';
}
/* 문항 카드 · no = 문항 번호 글자(빈 글자 = 번호 없음 · PART 1) */
function svyBlock(q, title, no){
  var n=q.n||0, nb=no===""?"":esc(no||svyNo(q.id))+' · ', k=svyKey(q, no), ch=svyCh(q);
  SVY.Q[k]={ q:q, title:title, nb:nb };
  return '<button type="button" class="svy-q svd-c" data-svk="'+esc(k)+'" aria-haspopup="dialog" onclick="svyOpen(\''+esc(k)+'\')"><span class="svy-h"><b>'+nb+esc(title)+'</b><span class="svd-more">전체 보기 ›</span></span>'+
    '<span class="svd-qt" title="'+esc(q.q||"")+'">'+esc(q.q||"")+'</span>'+(ch?svyChoice(q):'<span class="svd-dnw" title="평균 · '+(q.top||5)+'점 만점">'+svyDonut(q.avg, q.top)+'</span>')+
    '<span class="svd-cn">답 '+n0(n)+svUnit()+(q.when?' · 보인 사람만':'')+(q.t==="pick"?' · 여러 개 고름':'')+'</span></button>';
}
/* 보기 문항(점수 없음 · PART 1) = 같은 카드 · 선택지형 */
function svyCat(q, title){ return svyBlock(q, title, ""); }
/* ── 전체 보기 창 ── */
function svyOv(){
  var o=el("svdOv"); if(o) return o;
  document.body.insertAdjacentHTML("beforeend",'<div class="svd-ov" id="svdOv" hidden><div class="svd-dim" onclick="svyClose()"></div><div class="svd-sh" id="svdSh" role="dialog" aria-modal="true" aria-labelledby="svdT" tabindex="-1"></div></div>');
  return el("svdOv");
}
function svyDetail(k){
  var e=SVY.Q[k]; if(!e) return ""; var q=e.q, n=q.n||0, ch=svyCh(q), half=(q.opts||[]).length>5;
  return '<div class="svd-hd"><b id="svdT">'+e.nb+esc(e.title)+'</b><button type="button" class="svd-x" onclick="svyClose()">닫기</button></div><div class="svd-bd" id="svdBd"><p class="svd-q">'+esc(q.q||"")+'</p>'+
    (ch?svyChoice(q):'<div class="svd-row">'+svyDonut(q.avg, q.top, 1)+'<div class="svd-dw"><p class="cap">점수별 분포'+(half?" · 0.5 단위":"")+'</p>'+svyDist(q)+'</div></div>')+
    '<p class="cap">답 '+n0(n)+svUnit()+(ch?(q.when?' · 보인 사람만':'')+(q.t==="pick"?' · 여러 개 고름 · 비율 = 고른 사람 ÷ 답한 사람':''):' · 평균은 빈 값 뺌')+'</p></div>';
}
function svyRM(){ return !!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
function svyOpen(k){
  if(!SVY.Q[k]) return; var o=svyOv(), sh=el("svdSh");
  clearTimeout(SVY.ct); SVY.open=k; if(!SVY.ret) SVY.ret=document.activeElement;
  sh.innerHTML=svyDetail(k);
  o.classList.remove("is-closing","is-opening"); o.hidden=false; void o.offsetWidth; o.classList.add("is-opening");
  document.documentElement.classList.add("svd-lock"); var ap=el("app"); if(ap) ap.inert=true;
  var x=sh.querySelector(".svd-x"); if(x) x.focus();
}
function svyClose(){
  var o=el("svdOv"), k=SVY.open; if(!k||!o) return; SVY.open="";
  o.classList.remove("is-opening"); o.classList.add("is-closing");
  document.documentElement.classList.remove("svd-lock"); var ap=el("app"); if(ap) ap.inert=false;
  clearTimeout(SVY.ct); SVY.ct=setTimeout(function(){ if(!SVY.open){ o.hidden=true; o.classList.remove("is-closing"); el("svdSh").innerHTML=""; } }, svyRM()?0:180);
  var r=SVY.ret; SVY.ret=null; if(!(r&&r!==document.body&&document.body.contains(r))) r=document.querySelector('.svd-c[data-svk="'+k+'"]');   /* 갱신으로 카드가 다시 그려졌으면 같은 문항 카드로 */
  if(r&&r.focus) r.focus();
}
/* 30초 갱신 · 열린 창은 내용만 바꾼다(스크롤 그대로) · 그 문항이 사라지면(구분 바꿈) 닫는다 */
function svyRefresh(){
  if(!SVY.open) return; if(!SVY.Q[SVY.open]){ svyClose(); return; }
  var b=el("svdBd"), st=b?b.scrollTop:0, sh=el("svdSh"), f=document.activeElement&&document.activeElement.classList.contains("svd-x");
  sh.innerHTML=svyDetail(SVY.open); b=el("svdBd"); if(b) b.scrollTop=st; if(f){ var x=sh.querySelector(".svd-x"); if(x) x.focus(); }
}
document.addEventListener("keydown",function(e){ if(SVY.open&&(e.key==="Escape"||e.key==="Esc")){ e.preventDefault(); svyClose(); } });
window.addEventListener("hashchange",function(){ if(SVY.open&&S.tab!=="sv") svyClose(); });
function svyProgs(d){
  var n=d.n||0, pre=svKind()==="pre", ps=(d.progs||[]).filter(function(p){ return !pre||SV_PRE_P.indexOf(p.id)>=0; });
  return '<table class="tb"><thead><tr><th>층</th><th>프로그램</th><th class="n">고른 사람</th><th>참여율</th><th class="n">평균</th></tr></thead><tbody>'+
    ps.map(function(p){ var r=Math.min(100,Number(p.rate)||0); return '<tr><td>'+esc(p.fl)+'</td><td>'+esc(p.nm)+'</td><td class="n"><b>'+n0(p.n)+'</b>'+svUnit()+'</td><td class="svy-r"><div class="bar"><i style="width:'+r+'%"></i></div><span class="n">'+r+'%</span></td><td class="n"><b>'+svyAvg(p.avg)+'</b></td></tr>'; }).join("")+
    '<tr><td class="cap">-</td><td>참여한 프로그램이 없다</td><td class="n"><b>'+n0(d.none)+'</b>'+svUnit()+'</td><td class="svy-r"><div class="bar"><i style="width:'+svyPc(d.none,n)+'%"></i></div><span class="n">'+svyPc(d.none,n)+'%</span></td><td class="cap n">-</td></tr></tbody></table>';
}
/* 바꾸기 · 실제 | 테스트 · 시험 사번 포함 */
function svySrc(t){ t=t?"test":""; if(SVY.src===t) return; SVY.src=t; render(); load(true); }
function svyTest(on){ if(SVY.test===!!on) return; SVY.test=!!on; render(); load(true); }
function svyGrid(){
  return gridOf("svq4",{ file:"설문 자유 의견", key:function(r){ return String(r.i); }, sort:{ k:"t", d:-1 }, noDl:0, ph:"글에서 찾기", h:420, empty:"아직 남긴 의견이 없습니다", onRow:function(k){ rowDetail(MG.svq4,k,{ title:function(){ return "자유 의견"; } }); },
    src:null, cols:[{ k:"t", t:"시각", type:"date", w:110 },{ k:"k", t:"구분", w:80 },{ k:"line", t:"자유 의견", w:640 }] });
}
function svpGrid(){
  var T=function(id){ return function(r){ return r.id===id; }; };
  return gridOf("svp1t",{ file:"실습 세션 서술 응답", key:function(r){ return String(r.i); }, sort:{ k:"t", d:-1 }, noDl:0, ph:"글에서 찾기", h:420, empty:"아직 적은 글이 없습니다", onRow:function(k){ rowDetail(MG.svp1t,k,{ title:function(){ return "실습 세션 서술 응답"; } }); },
    chips:[["all","전체",null],["good","좋았던 점 · 아쉬웠던 점",T("good")],["wish","듣고 싶은 주제",T("wish")],["task","그 업무",T("task_name")],["etc","기타 글",function(r){ return /_etc$/.test(r.id); }]],
    src:null, cols:[{ k:"t", t:"시각", type:"date", w:110 },{ k:"qt", t:"문항", w:170 },{ k:"line", t:"글", w:560 }] });
}
/* 시간대 · 10분 칸 · 오늘(서버 시각) 기록이 있으면 오늘, 없으면 기록이 있는 마지막 날 */
function svyDay(d){
  var tl=(d.tl||[]).filter(function(x){ return x&&String(x[0]).length>=16; }), t=String(d.t||S.srvT||""), today=t.slice(0,10), nowM=mins(t.slice(11,16)), days={};
  tl.forEach(function(x){ var dy=String(x[0]).slice(0,10); days[dy]=(days[dy]||0)+num(x[1]); });
  var dl=Object.keys(days).sort(), day=days[today]?today:(dl[dl.length-1]||today);
  var a=tl.filter(function(x){ return String(x[0]).slice(0,10)===day; }).map(function(x){ return [mins(String(x[0]).slice(11,16)), num(x[1])]; });
  var best=null; a.forEach(function(x){ if(!best||x[1]>best[1]) best=x; });
  var h=0; if(day===today&&nowM>=0) a.forEach(function(x){ if(x[0]>nowM-60&&x[0]<=nowM) h+=x[1]; });
  return { day:day, today:today, nowM:nowM, days:days, dl:dl, a:a, best:best, tn:days[today]||0, h:h };
}
function svyMd(s){ s=String(s||""); return s.length>=10?Number(s.slice(5,7))+"/"+Number(s.slice(8,10)):s; }
function svyNice(v){ var p=Math.pow(10,Math.floor(Math.log10(Math.max(1,v)))), m=[1,2,3,5,10]; for(var i=0;i<m.length;i++) if(m[i]*p>=v) return m[i]*p; return 10*p; }
function svyTl(d){
  var D=svyDay(d), a=D.a, cur0=D.day===D.today?D.nowM:-1;
  var h='<h2>시간대별 응답 <span class="cap">10분 칸 · '+esc(svyMd(D.day))+(D.day===D.today?" 오늘":"")+'</span></h2>';
  if(!a.length) return h+emptyH("아직 응답이 없습니다","");
  var lo=Math.min.apply(null,a.map(function(x){ return x[0]; })), hi=Math.max.apply(null,a.map(function(x){ return x[0]; }));
  if(cur0>=0) hi=Math.max(hi,cur0);
  var m0=Math.floor(lo/60)*60, m1=Math.min(1440,Math.ceil((hi+10)/60)*60);
  if(m1-m0<180){ m1=Math.min(1440,m0+180); m0=Math.max(0,m1-180); }
  var nb=(m1-m0)/10, v=[], i; for(i=0;i<nb;i++) v.push(0);
  a.forEach(function(x){ var k=Math.floor((x[0]-m0)/10); if(k>=0&&k<nb) v[k]+=x[1]; });
  var cur=cur0>=0?Math.floor((cur0-m0)/10):-1, mx=Math.max.apply(null,[1].concat(v)), top=svyNice(mx), best=-1;
  v.forEach(function(x,k){ if(x>0&&(best<0||x>v[best])) best=k; });
  var ticks=top<=2?[top]:[Math.round(top/2),top];
  var gl=ticks.map(function(t){ return '<div class="us-gl" style="bottom:'+(t/top*100)+'%"><span>'+n0(t)+'</span></div>'; }).join("");
  h+='<div class="dx-vb svd-vb" role="img" aria-label="10분 칸 응답 막대">'+gl+v.map(function(x,k){ var t=m2hm(m0+k*10); return '<i class="'+(k===cur?"now":k===best?"mx":"")+'" title="'+t+' · '+n0(x)+svUnit()+'">'+dxBar("svt:"+k, x?x/top:0, 1)+'</i>'; }).join("")+'</div>';
  var hrs=(m1-m0)/60, st=hrs>8||(window.innerWidth<600&&hrs>4)?2:1, ax="";
  for(var t=m0/60;t<=m1/60;t+=st) ax+='<span style="left:'+((t*60-m0)/(m1-m0)*100).toFixed(2)+'%">'+("0"+t).slice(-2)+'</span>';
  h+='<div class="us-axis">'+ax+'</div>';
  var lg=[];
  if(cur>=0&&cur<nb) lg.push('<span><b style="background:var(--dx-hot)"></b>지금 '+m2hm(m0+cur*10)+'~ · '+n0(v[cur])+svUnit()+'</span>');
  lg.push('<span><b></b>10분 칸</span>');
  if(best>=0&&best!==cur) lg.push('<span><b style="background:#C3CBE0"></b>최다 '+m2hm(m0+best*10)+'~ · '+n0(v[best])+svUnit()+'</span>');
  h+='<div class="us-lg">'+lg.join("")+'</div>';
  if(D.dl.length>1) h+='<p class="cap mt">날짜별 · '+D.dl.map(function(x){ return esc(svyMd(x))+' '+n0(D.days[x]); }).join(" · ")+'</p>';
  return h;
}
/* 사전 신청자 · 세션별 응답 수(서버 sess · 세션 칸 빈 응답은 따로 한 줄)
 * 261024 (사용자 「권장대로」) 세션별 만족 평균(서버 sessAvg { A: { n, overall, ops, skill } } · 5점) · 전반 만족 = overall · 교육 4문항 = 난이도 · 강사 설명 · 진행 속도 · 실습 환경 · 역량 향상 = e_skill */
var SVY_SA=[["overall","전반 만족"],["ops","교육 4문항"],["skill","역량 향상"]];
function svySess(d){
  var ss=d.sess||{}, nm=d.sessNm||{}, sa=d.sessAvg||{}, L=Object.keys(nm).length?Object.keys(nm).sort():["A","B","C","D","E"], kd=d.kinds||{}, tot=svKind()==="gen"?0:num(kd.pre), sum=0;
  L.forEach(function(x){ sum+=num(ss[x]); });
  var row=function(a, c, av){ return '<tr><td>'+a+'</td><td class="n"><b>'+n0(c)+'</b>'+svUnit()+'</td><td class="svy-r"><div class="bar"><i style="width:'+svyPc(c,tot)+'%"></i></div><span class="n">'+svyPc(c,tot)+'%</span></td>'+
    SVY_SA.map(function(k){ var v=av?av[k[0]]:null; return v==null?'<td class="cap n">-</td>':'<td class="n"><b>'+svyAvg(v)+'</b></td>'; }).join("")+'</tr>'; };
  var h='<h2>세션별 응답 <span class="cap">사전 신청자 '+n0(tot)+svUnit()+' · 10F 실습 세션</span></h2><div class="svd-ssw"><table class="tb svd-ss"><thead><tr><th>세션</th><th class="n">응답</th><th>비율</th>'+
    SVY_SA.map(function(k){ return '<th class="n">'+k[1]+'</th>'; }).join("")+'</tr></thead><tbody>'+
    L.map(function(x){ return row('<b>'+esc(x)+'</b> · '+esc(nm[x]||""), num(ss[x]), sa[x]); }).join("")+(tot>sum?row('<span class="cap">세션 칸 비어 있음</span>', tot-sum, null):"")+'</tbody></table></div>'+
    (d.preNoAtt!=null&&tot?'<p class="mt4 svd-na"><b>10F 출석 기록 없음 '+n0(d.preNoAtt)+svUnit()+'</b>'+(function(){ var na=d.sessNoAtt||{}, l=L.filter(function(x){ return num(na[x]); }).map(function(x){ return esc(x)+' '+n0(na[x]); }); return l.length?' <span class="cap">· '+l.join(" · ")+'</span>':''; })()+' <span class="cap">· 원본 엑셀 「10F 출석」 칸으로 거름</span></p>':'')+
    '<p class="cap mt4">평균 = 5점 만점 · 교육 4문항 = 난이도 · 강사 설명 · 진행 속도 · 실습 환경<br>· 역량 향상 = AI 활용 역량 향상</p>';
  if(svKind()!=="pre") h+='<div class="mt"><button class="btn sm" type="button" onclick="goSub(\'pre\')">실습 세션 문항 보기 ›</button></div>';
  return h;
}
function svyKindChips(d){
  var kd=d&&d.kinds?d.kinds:null, s=svSub(), c=function(id){ return !kd?"":id==="all"?num(kd.gen)+num(kd.pre):num(kd[id]); };
  return '<div class="chips" role="tablist" aria-label="응답 구분">'+SV_KINDS.map(function(x){ var on=x[0]===s; return '<button type="button" role="tab" aria-selected="'+on+'" class="chip'+(on?" on":"")+'" onclick="goSub(\''+x[0]+'\')">'+esc(x[1])+(kd?'<span class="c">'+n0(c(x[0]))+'</span>':'')+'</button>'; }).join("")+'</div>';
}
function svyBar(d){
  var t=!!SVY.src, top=isTop(), k=svKey(), b=SVY.busy;
  return '<span class="cap svd-upd">'+(d?"기준 "+esc(hm(d.t))+" · 30초마다":"")+'</span>'+
    (t?'':'<button type="button" class="chip svd-chip'+(SVY.test?" on":"")+'" aria-pressed="'+SVY.test+'" onclick="svyTest('+!SVY.test+')">시험 사번 포함</button>')+'<span class="sp"></span>'+
    '<button class="btn sm" type="button" onclick="svyAggDl()"'+(d&&!b?'':' disabled')+'>'+(b==="agg"?"만드는 중":"집계 엑셀")+'</button>'+
    (t?'<button class="btn sm" type="button" onclick="svyTestDl()"'+(b?' disabled':'')+'>'+(b==="trow"?"받는 중":"응답 행 엑셀")+'</button>'+(top?'<button class="btn sm dng" type="button" onclick="svyTestClear()"'+(d&&!b?'':' disabled')+'>테스트 응답 지우기</button>':'')
      :(top?'<button class="btn sm" type="button" onclick="svyRawDl()"'+(b?' disabled':'')+'>'+(b==="raw"?"받는 중":"원본 엑셀 · 사번 포함")+'</button>':''))+
    '<button class="btn sm" type="button" onclick="reload([\''+k+'\'])"'+(S.busy[k]?' disabled':'')+'>'+(S.busy[k]?"받는 중":"새로 고침")+'</button>';
}
function svyPaint(){
  var kb=el("svyK"), bx=el("svyB"), k=svKey(), d=S.data[k]; if(!kb||!bx) return;
  SVY.Q={};
  var g=MG.svq4, gp=MG.svp1t, gt=dataGate(k,"설문 집계"), kind=svKind(), test=!!SVY.src;
  if(!gt&&(!/^post[23]$/.test(d.sv||"")||!d.progs)) gt=band("warn","서버가 옛 설문 형식으로 답합니다 · 사후 설문 서버 배포 뒤 채워집니다");
  if(!gt&&(!d.kinds||(test&&d.src!=="test"))) gt=band("info","이 서버는 아직 일반 · 사전 구분과 테스트 응답을 모릅니다 · 서버 갱신 뒤");
  var ch=el("svChips"); if(ch) ch.innerHTML=svyKindChips(gt?null:d);
  var br=el("svBar"); if(br) br.innerHTML=svyBar(gt?null:d);
  g.o.file=test?"설문 테스트 자유 의견":"설문 자유 의견"; if(gp) gp.o.file=test?"실습 세션 테스트 서술 응답":"실습 세션 서술 응답";
  var hasP=gp&&el("mg_svp1t");
  if(gt){ kb.innerHTML=""; bx.innerHTML=gt; g.gate=""; XG.set(g, null, el("mg_svq4")); if(hasP){ gp.gate=""; XG.set(gp, null, el("mg_svp1t")); } svyRefresh(); return; }
  var by={}; (d.qs||[]).forEach(function(q){ by[q.id]=q; });
  if(kind==="pre") delete by.q1_4;   /* 사전 신청자 설문에 Q1-4 없음 */
  var P={}; (d.p1||[]).forEach(function(q){ P[q.id]=q; });
  var q4=by.q4||{ n:0, lines:[] }, q11=by.q1_1||{}, ov=P.overall||{}, n=d.n||0, kd=d.kinds||{ gen:0, pre:0 }, D=svyDay(d), u=svUnit(), I=typeof DX_IC==="object"?DX_IC:{};
  var mt=function(k2, v, top){ return '<div class="dx-mt">'+dxBar(k2, v==null?0:num(v)/top)+'</div>'; };
  var t4=kind!=="gen"&&num(kd.pre)?{ k:"sv:ov", ic:I.peak, l:"실습 세션 만족", v:ov.avg, d:2, t:svyAvg(ov.avg), u:"/ 5", meter:mt("sv:ovm",ov.avg,5), sub:"사전 신청자 · 답 "+n0(ov.n)+u }
    :{ k:"sv:q4", ic:I.line, l:"자유 의견", v:num(q4.n), u:"건", sub:"Q4 · 선택 문항" };
  kb.innerHTML=[
    { k:"sv:n", ic:I.user, l:test?"테스트 응답":"응답", v:n, u:u, key:!test&&!kind&&!SVY.test?"st:id:sv":"", sub:kind?(kind==="pre"?"사전 신청자":"일반")+" · 전체 "+n0(num(kd.gen)+num(kd.pre)):"일반 "+n0(kd.gen)+" · 사전 신청자 "+n0(kd.pre) },
    { k:"sv:td", ic:I.clock, l:"오늘 응답", v:D.tn, u:u, sub:"최근 1시간 "+n0(D.h)+(D.best&&D.day===D.today?" · 최다 "+m2hm(D.best[0])+"~":"") },
    { k:"sv:q11", ic:I.peak, l:"행사 전반 만족", v:q11.avg, d:2, t:svyAvg(q11.avg), u:"/ 5", meter:mt("sv:q11m",q11.avg,5), sub:"Q1-1 · 답 "+n0(q11.n)+u },
    t4
  ].map(function(o){ if(!o.key) delete o.key; return dxTile(o); }).join("");
  var grp=function(ids){ return '<div class="svy-g svd-g">'+ids.filter(function(id){ return by[id]; }).map(function(id){ return svyBlock(by[id], SVY_T[id]||id); }).join("")+'</div>'; };
  var pg=function(ids){ return '<div class="svy-g svd-g">'+ids.filter(function(id){ return P[id]; }).map(function(id){ var q=P[id]; return q.t==="slider"?svyBlock(q, SVY_P1T[id]||id, ""):svyCat(q, SVY_P1T[id]||id); }).join("")+'</div>'; };
  var pq=(d.progs||[]).filter(function(p){ return by[p.id]&&(kind!=="pre"||SV_PRE_P.indexOf(p.id)>=0); }).map(function(p){ return svyBlock(by[p.id], p.fl+" "+p.nm); }).join("");
  var hasPre=kind!=="gen"&&num(kd.pre)>0;
  if(!n){
    bx.innerHTML='<div class="card">'+emptyH(test?"아직 테스트 응답이 없습니다 · 설문 테스트 페이지에서 끝까지 내면 쌓입니다":"아직 응답이 없습니다"+(!SVY.test&&d.nt?" · 시험 사번 응답 "+n0(d.nt)+"명은 「시험 사번 포함」에서":""))+'</div>';
  } else {
    bx.innerHTML=(hasPre?'<div class="grid g32 mb svd-two"><div class="card dx-a" data-dxc="sv:tl">'+svyTl(d)+'</div><div class="card dx-a" data-dxc="sv:ss">'+svySess(d)+'</div></div>':'<div class="card mb dx-a" data-dxc="sv:tl">'+svyTl(d)+'</div>')+
      (kind==="pre"?
        '<div class="card mb"><h2>PART 1 · 실습 세션 만족 <span class="cap">점수 5 = 가장 좋음 · 0.5 단위 · 도넛 = 평균 ÷ 5점 · 카드를 누르면 전체 보기</span></h2>'+pg(["overall","s_difficulty","s_instructor","s_pacing","s_env"])+'</div>'+
        '<div class="card mb"><h2>PART 1 · 실습 뒤</h2>'+pg(["e_skill","e_share","e_retake"])+'</div>'+
        '<div class="card mb"><h2>PART 1 · 업무 적용 <span class="cap">「적용해 볼 업무」 답에 따라 보인 문항이 다름</span></h2>'+pg(["apply","parts","customer_data","barriers"])+'</div>'+
        '<div class="card mb"><h2>PART 1 · 참여자</h2>'+pg(["job","level","interview"])+'</div>':'')+
      '<div class="card"><h2>'+(kind==="pre"?"PART 2 · ":"")+'Q1 · 행사 전반 <span class="cap">점수 5 = 가장 좋음(Q1-1~3 = 0.5 단위'+(kind==="pre"?"":" · Q1-4 = 선택지")+') · 도넛 = 평균 ÷ 만점 · 카드를 누르면 전체 보기</span></h2>'+grp(["q1_1","q1_2","q1_3","q1_4"])+'</div>'+
      '<div class="card mt"><h2>Q2 · 프로그램 참여율 · 만족도 <span class="cap">참여율 = 고른 사람 ÷ 응답 '+n0(n)+u+(kind==="pre"?" · 사전 신청자 설문 = 1F 5개":kind===""&&num(kd.pre)?" · 17F · 18F 는 일반 설문 문항":"")+'</span></h2>'+svyProgs(d)+'<details class="memo mt"><summary>프로그램별 점수</summary><div class="svy-g svd-g mt">'+pq+'</div></details></div>'+
      '<div class="card mt"><h2>Q3 · AX 이해도</h2>'+grp(["q3_1","q3_2","q3_3"])+'</div>';
  }
  var lines=(q4.lines||[]).map(function(x,i){ return { i:i, t:x.t, k:x.k||"일반", line:x.line }; });
  g.gate=""; XG.set(g, lines, el("mg_svq4"));
  if(hasP){
    var pr=[], ii=0; (d.p1||[]).forEach(function(q){ (q.lines||[]).forEach(function(x){ var id=x.id||q.id; pr.push({ i:ii++, t:x.t, id:id, qt:(SVY_P1T[q.id]||q.id)+(id!==q.id?" · 기타":""), line:x.line }); }); });
    gp.gate=""; XG.set(gp, pr, el("mg_svp1t"));
  }
  dxAfter(el("vb"));
  svyRefresh();
}
SCREENS.sv={
  title:"설문", desc:"참가자 설문 응답 집계 · 일반 · 사전 신청자 · 30초마다",
  need:function(){ return [{ k:svKey(), a:"survey_list", p:svParams(), ttl:30000 }]; },
  mount:function(vb){
    var t=!!SVY.src, s=svSub();
    svyClose(); dxMount(); svyGrid(); if(s!=="gen") svpGrid();
    el("phCap").textContent=t?"설문 테스트 페이지(hiax.app/survey-review/)에서 낸 응답 · 실제 집계와 따로":"참가자 설문 응답 · 시험 사번 "+(SVY.test?"포함":"뺌")+" · 30초마다";
    vb.innerHTML='<div class="svd-top"><div class="dx-seg" role="tablist" aria-label="응답 종류">'+[["","실제 응답"],["test","테스트 응답"]].map(function(x){ var on=SVY.src===x[0]; return '<button type="button" role="tab" aria-selected="'+on+'" class="'+(on?"on":"")+'" onclick="svySrc('+(x[0]?1:0)+')">'+x[1]+'</button>'; }).join("")+'</div>'+
      '<div id="svChips">'+svyKindChips(null)+'</div></div>'+
      (t?band("warn","<b>테스트 응답</b> · 실제 집계에 들어가지 않음 · 스탬프 없음"):'')+
      '<div class="svd-bar" id="svBar"></div><div class="grid g4 mb svd-k" id="svyK"></div><div id="svyB"></div>'+
      '<div class="card mt"><h2>Q4 · 자유 의견</h2><div id="mg_svq4"></div></div>'+
      (s!=="gen"?'<div class="card mt"><h2>PART 1 · 서술 응답 <span class="cap">사전 신청자</span></h2><div id="mg_svp1t"></div></div>':'')+
      '<details class="memo mt"><summary>운영 메모</summary><p class="cap">· 실제 응답 = 사후설문 시트 · 시험 사번 줄은 「시험 사번 포함」에서 함께 셈<br>· 테스트 응답 = 설문 테스트 페이지에서 끝까지 낸 응답 · 설문테스트 시트 · 실제 집계 · 스탬프와 섞이지 않음<br>'+
      '· 사전 신청자 = 10F 실습 출석 기록이 있는 사람 · PART 1(실습 세션) + PART 2(1F 프로그램 5개 · Q1-4 없음)<br>· 시간대 = 10분 칸 · 집계 엑셀 = 사번 없음<br>· 원본 엑셀(사번 · 이름 · 부문) · 테스트 응답 지우기 = 슈퍼관리자</p></details>';
  },
  paint:function(){ svyPaint(); }
};
/* ── 엑셀 ── */
function svyKindNm(){ var k=svKind(); return k==="pre"?"사전 신청자":k==="gen"?"일반":"전체"; }
function svySave(bytes, name){ rdlSave(new Blob([bytes],{ type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name); }
/* 집계 · 사번 없음 · 문항 · 프로그램 · 서술(bkup.js 와 같은 시트) + PART 1 · 세션 */
function svyAggSheets(d, st){
  var test=!!SVY.src, pre=svKind()==="pre", head=(test?"테스트 응답 · ":"")+svyKindNm(), day=st.s.slice(0,10);
  var keep=pre?function(q){ return q.id!=="q1_4"&&(!/^q2_[1-9]$/.test(q.id)||SV_PRE_P.indexOf(q.id)>=0); }:null;
  var shs=bkSurveySh(d, st, { head:"설문 · "+head+" · 응답 "+n0(d.n)+svUnit()+(test?"":SVY.test?"(시험 사번 포함)":"(시험 사번 제외)"), keep:keep });   /* 5점 문항 · 선택지 문항 · 문항 원문 · 프로그램별 · 서술 응답 */
  if(pre) shs[3].rows=shs[3].rows.filter(function(r,i){ var p=(d.progs||[])[i]; return p&&SV_PRE_P.indexOf(p.id)>=0; });
  shs[4].rows=(((d.qs||[]).filter(function(q){ return q.t==="text"; })[0]||{}).lines||[]).map(function(x){ return [rdlHm(x.t, day), x.k||"일반", x.line]; });
  shs[4].head=["시각","구분","답"]; shs[4].w=[12,9,90]; shs[4].kind=["c","c","w"];
  var p1=(d.p1||[]).filter(function(q){ return q.n; });
  if(p1.length){
    /* 실습 세션 문항 = 같은 구조 세 장 · 번호 = P1-순번(서버 문항 순서) */
    var P1=d.p1||[], pno={}; P1.forEach(function(q,i){ pno[q.id]="P1-"+(i+1); });
    shs=shs.concat(bkSvQSh(P1.filter(function(q){ return q.t!=="text"&&q.n; }), st, { pre:"실습 세션 ", head:"PART 1 실습 세션 · "+head, nm:function(q){ return SVY_P1T[q.id]||q.q; }, no:function(q){ return pno[q.id]; } }));
    var tx=[]; p1.forEach(function(q){ (q.lines||[]).forEach(function(x){ var id=x.id||q.id; tx.push([rdlHm(x.t, day), (SVY_P1T[q.id]||q.id)+(id!==q.id?" · 기타":""), x.line]); }); });
    shs.push(bkSh("실습 세션 서술", "PART 1 서술 응답 · "+head+" · 기준 시각 "+st.s+" · "+n0(tx.length)+"줄", ["시각","문항","답"], [12,24,80], ["c","t","w"], tx));
    var nm=d.sessNm||{}, ss=d.sess||{}, sa=d.sessAvg||{}, na=d.sessNoAtt;
    shs.push(bkSh("세션별", "세션별 응답 · 만족 평균(5점) · "+head+" · 기준 시각 "+st.s, ["세션","이름","응답"].concat(SVY_SA.map(function(k){ return k[1]; })).concat(na?["10F 출석 기록 없음"]:[]), [7,48,9,11,11,11,14].slice(0,na?7:6), ["c","t","n","n","n","n","n"].slice(0,na?7:6),
      Object.keys(nm).sort().map(function(x){ var a=sa[x]||{}; return [x, nm[x], num(ss[x])].concat(SVY_SA.map(function(k){ return a[k[0]]==null?"":a[k[0]]; })).concat(na?[num(na[x])]:[]); })));
  }
  return shs;
}
function svyAggDl(){
  var d=svData(); if(!d){ toast("집계를 받은 뒤 내려받습니다"); return; }
  if(typeof bkXlsx!=="function"||typeof bkSurveySh!=="function"){ toast("엑셀 도구를 불러오지 못했습니다",{ bad:1 }); return; }
  var st=rdlStamp(d.t), name="AXF_설문_집계_"+(SVY.src?"테스트_":"")+svyKindNm().replace(/\s+/g,"")+"_"+st.f+".xlsx";
  SVY.busy="agg"; paint();
  bkXlsx(svyAggSheets(d, st)).then(function(b){ SVY.busy=""; svySave(b, name); paint(); toast("내려받았습니다 · "+name); },function(){ SVY.busy=""; paint(); toast("엑셀을 만들지 못했습니다",{ bad:1 }); });
}
/* 행 엑셀(원본 · 테스트) · 칸 = 서버 cols 그대로 · 숫자 칸 = 숫자 · 긴 글 = 줄바꿈 */
function svyRowSheet(r, name, title){
  var cols=r.cols||[], rows=r.rows||[];
  var kind=cols.map(function(c,i){ var any=0, numOnly=true, len=0;
    rows.forEach(function(x){ var v=x[i]; if(v===""||v==null) return; any=1; len=Math.max(len,String(v).length); if(typeof v!=="number"&&!/^-?\d+(\.\d+)?$/.test(String(v))) numOnly=false; });
    return i<=1?"c":any&&numOnly?"n":len>24?"w":"c"; });
  var w=kind.map(function(k,i){ return i===0?17:k==="w"?40:Math.max(8,Math.min(16,String(cols[i]).length+4)); });
  return bkSh(name, title, cols, w, kind, rows.map(function(x){ return cols.map(function(c,i){ var v=x[i]; return v==null?"":v; }); }));
}
function svyRawDl(){
  if(!isTop()){ toast("슈퍼관리자가 내려받습니다",{ bad:1 }); return; }
  if(SVY.busy) return;
  var k=svKind(), nm=svyKindNm();
  confirmBox({ t:"사번이 든 원본을 내려받을까요?", who:"설문 원본 · "+nm, sub:"사번 · 이름 · 부문 포함 · 시험 사번 줄 포함(테스트 칸 Y) · 개인정보 파일", ok:"엑셀 다운로드",
    run:function(){ SVY.busy="raw"; paint();
      return call("survey_rows", k?{ kind:k }:{}, 60000).then(function(r){
        if(!(r&&r.ok)){ SVY.busy=""; paint(); return r||{ ok:false }; }
        var st=rdlStamp(r.t), name="AXF_설문_원본_"+nm.replace(/\s+/g,"")+"_"+st.f+".xlsx";
        return bkXlsx([svyRowSheet(r, "설문 원본", "설문 원본 · "+nm+" · 기준 시각 "+st.s+" · "+n0(r.n)+"줄 · 사번 포함")]).then(function(b){ SVY.busy=""; svySave(b, name); paint(); return { ok:true, name:name, n:r.n }; });
      }); },
    done:function(r){ toast("내려받았습니다 · "+r.name+" · "+n0(r.n)+"줄",{ ms:7000 }); } });
}
function svyTestDl(){
  if(SVY.busy) return;
  var k=svKind(), nm=svyKindNm();
  SVY.busy="trow"; paint();
  call("survey_test_rows", k?{ kind:k }:{}, 60000).then(function(r){
    if(!(r&&r.ok)){ SVY.busy=""; paint(); toast("내려받지 못했습니다 · "+why(r),{ bad:1 }); return; }
    var st=rdlStamp(r.t), name="AXF_설문_테스트응답_"+nm.replace(/\s+/g,"")+"_"+st.f+".xlsx";
    return bkXlsx([svyRowSheet(r, "설문 테스트 응답", "설문 테스트 응답 · "+nm+" · 기준 시각 "+st.s+" · "+n0(r.n)+"줄 · 기기 = 테스트 페이지 기기 id")]).then(function(b){ SVY.busy=""; svySave(b, name); paint(); toast("내려받았습니다 · "+name+" · "+n0(r.n)+"줄"); });
  }).catch(function(){ SVY.busy=""; paint(); toast("엑셀을 만들지 못했습니다",{ bad:1 }); });
}
/* 테스트 응답 지우기 · 슈퍼관리자 · 지금 고른 구분(전체 = 전부) · 실제 응답은 지우지 않는다 */
function svyTestClear(){
  if(!isTop()){ toast("슈퍼관리자가 지웁니다",{ bad:1 }); return; }
  var d=svData(); if(!d||!SVY.src) return;
  var k=svKind(), kd=d.kinds||{}, n=k?num(kd[k]):num(kd.gen)+num(kd.pre);
  confirmBox({ t:"테스트 응답을 지울까요?", who:"설문 테스트 응답 · "+(k?svyKindNm():"일반 · 사전 신청자 전부")+" · "+n0(n)+"건",
    sub:"설문테스트 시트에서 지움 · 실제 응답 · 스탬프는 그대로 · 되돌릴 수 없음 · 필요하면 먼저 「응답 행 엑셀」", ok:"지우기", danger:true,
    run:function(){ return call("sv_test_clear", k?{ kind:k }:{}); },
    done:function(r){ Object.keys(S.data).forEach(function(x){ if(/^svlt/.test(x)){ S.data[x]=null; S.at[x]=0; } }); render(); load(true); toast("테스트 응답을 지웠습니다 · "+n0(r.removed)+"건 · 남음 "+n0(r.left)+"건"); } });
}
