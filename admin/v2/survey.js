/* AXF CONTROL v2 · 기록 · 설정 › 설문 (261016 4단계 · 지금 콘솔 survey.js 집계 부분을 옮김)
 * 데이터 = survey_list(집계 · test=1 이면 시험 사번 포함 · 30초) · 사번이 든 원본 CSV 는 화면에 두지 않는다(대화로)
 * 위 = 시험 사번 빼고 | 포함 · 숫자 4칸 · Q1 넷(261021 Q1-4 추가 · 3점 만점 · 옛 응답은 빈 값) · Q2 프로그램 참여율 · 평균 + 분포 · Q3 셋 · 아래 = Q4 자유 의견(공통 표 · 엑셀 · 사번 없음)
 * v8.60 (사용자 261023 새 설문안) Q1-1~3 · Q2-x = 슬라이더 0.5 단위(분포 9칸 · 서버 opts 그대로) · 프로그램 7개 · 서버 설문 id post3(옛 post2 도 그대로 읽음) */
var SVY_T={ q1_1:"전반 만족", q1_2:"행사 운영", q1_3:"재참여 · 추천", q1_4:"업무에 AI 활용 생각", q3_1:"AX 3개년 로드맵", q3_2:"Hi-헬퍼 · HiDi-Q 이해", q3_3:"DAP" };
var SVY={ test:false };
LG_SUBS.splice(1,0,["sv","설문"]);
function svyPc(a,b){ return b>0?Math.round(a/b*1000)/10:0; }
function svyAvg(v){ return v==null||v===""?"-":Number(v).toFixed(2); }
function svyNo(id){ return String(id||"").toUpperCase().replace("_","-"); }
function svyBlock(q, title){
  var n=q.n||0;
  return '<div class="svy-q"><div class="svy-h"><b>'+esc(svyNo(q.id))+' · '+esc(title)+'</b><span class="n svy-av" title="평균 · '+(q.top||5)+'점 만점">'+svyAvg(q.avg)+'</span></div><p class="cap">'+esc(q.q||"")+'</p>'+
    '<table class="tb svy-d"><tbody>'+(q.opts||[]).map(function(o){ var c=(q.dist||{})[o[0]]||0; return '<tr><td><b class="n">'+esc(o[0])+'</b> · '+esc(o[1])+'</td><td class="svy-b"><div class="bar"><i style="width:'+svyPc(c,n)+'%"></i></div></td><td class="n">'+n0(c)+' · '+svyPc(c,n)+'%</td></tr>'; }).join("")+'</tbody></table><p class="cap mt4">답 '+n0(n)+'명 · 평균은 빈 값 뺌</p></div>';
}
function svyProgs(d){
  var n=d.n||0;
  return '<table class="tb"><thead><tr><th>층</th><th>프로그램</th><th class="n">고른 사람</th><th>참여율</th><th class="n">평균</th></tr></thead><tbody>'+
    (d.progs||[]).map(function(p){ var r=Math.min(100,Number(p.rate)||0); return '<tr><td>'+esc(p.fl)+'</td><td>'+esc(p.nm)+'</td><td class="n"><b>'+n0(p.n)+'</b>명</td><td class="svy-r"><div class="bar"><i style="width:'+r+'%"></i></div><span class="n">'+r+'%</span></td><td class="n"><b>'+svyAvg(p.avg)+'</b></td></tr>'; }).join("")+
    '<tr><td class="cap">-</td><td>참여한 프로그램이 없다</td><td class="n"><b>'+n0(d.none)+'</b>명</td><td class="svy-r"><div class="bar"><i style="width:'+svyPc(d.none,n)+'%"></i></div><span class="n">'+svyPc(d.none,n)+'%</span></td><td class="cap n">-</td></tr></tbody></table>';
}
function svyTest(on){ if(SVY.test===!!on) return; SVY.test=!!on; S.data.svl=null; render(); load(true,["svl"]); }
function svyGrid(){
  return gridOf("svq4",{ file:"설문 자유 의견", key:function(r){ return String(r.i); }, sort:{ k:"t", d:-1 }, noDl:0, ph:"글에서 찾기", h:420, empty:"아직 남긴 의견이 없습니다", onRow:function(k){ rowDetail(MG.svq4,k,{ title:function(){ return "자유 의견"; } }); },
    src:null, cols:[{ k:"t", t:"시각", type:"date", w:110 },{ k:"line", t:"자유 의견", w:640 }] });
}
function svyPaint(){
  var kb=el("svyK"), bx=el("svyB"), d=S.data.svl; if(!kb||!bx) return;
  var g=MG.svq4, gt=dataGate("svl","설문 집계");
  if(!gt&&(!/^post[23]$/.test(d.sv||"")||!d.progs)) gt=band("warn","서버가 옛 설문 형식으로 답합니다 · 사후 설문 서버 배포 뒤 채워집니다");
  if(gt){ kb.innerHTML=""; bx.innerHTML=gt; g.gate=""; XG.set(g, null, el("mg_svq4")); return; }
  var by={}; (d.qs||[]).forEach(function(q){ by[q.id]=q; });
  var q4=by.q4||{ n:0, lines:[] }, q11=by.q1_1||{}, n=d.n||0;
  kb.innerHTML=drKpiGo({ l:"응답", v:n0(n), u:"명", s:SVY.test?"시험 사번 포함":"시험 사번 "+n0(d.nt)+"명 뺌" }, "st:id:sv")+kpi({ l:"전반 만족 평균", v:svyAvg(q11.avg), u:"/ 5", s:"Q1-1 · 답 "+n0(q11.n)+"명" })+
    kpi({ l:"참여한 프로그램 없음", v:n0(d.none), u:"명", s:"응답의 "+svyPc(d.none,n)+"%" })+kpi({ l:"자유 의견", v:n0(q4.n), u:"건", s:"Q4 · 선택 문항" });
  var grp=function(ids){ return '<div class="svy-g">'+ids.filter(function(id){ return by[id]; }).map(function(id){ return svyBlock(by[id], SVY_T[id]||id); }).join("")+'</div>'; };
  var pq=(d.progs||[]).filter(function(p){ return by[p.id]; }).map(function(p){ return svyBlock(by[p.id], p.fl+" "+p.nm); }).join("");
  bx.innerHTML=!n?'<div class="card">'+emptyH("아직 응답이 없습니다"+(!SVY.test&&d.nt?" · 시험 사번 응답 "+n0(d.nt)+"명은 「시험 사번 포함」에서":""))+'</div>':
    '<div class="card"><h2>Q1 · 행사 전반 <span class="cap">점수 5 = 가장 좋음(Q1-1~3 = 0.5 단위 · Q1-4 는 3점 만점) · 오른쪽 위 = 평균</span></h2>'+grp(["q1_1","q1_2","q1_3","q1_4"])+'</div>'+
    '<div class="card mt"><h2>Q2 · 프로그램 참여율 · 만족도 <span class="cap">참여율 = 고른 사람 ÷ 응답 '+n0(n)+'명</span></h2>'+svyProgs(d)+'<details class="memo mt"><summary>프로그램별 점수 분포</summary><div class="svy-g mt">'+pq+'</div></details></div>'+
    '<div class="card mt"><h2>Q3 · AX 이해도</h2>'+grp(["q3_1","q3_2","q3_3"])+'</div>';
  var lines=(q4.lines||[]).map(function(x,i){ return { i:i, t:x.t, line:x.line }; });
  g.gate=""; XG.set(g, lines, el("mg_svq4"));
}
(function(){
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return lgSub()==="sv"?[{ k:"svl", a:"survey_list", p:SVY.test?{ test:"1" }:{}, ttl:30000 }]:n0_(); };
  sc.mount=function(vb){
    if(lgSub()!=="sv") return m0(vb);
    el("phCap").textContent="사후 설문 집계 · 30초마다 · 사번이 든 원본은 대화로 받음";
    svyGrid();
    vb.innerHTML=chipsH(LG_SUBS,"sv")+'<div class="chips" role="group" aria-label="시험 사번">'+[[false,"시험 사번 빼고"],[true,"시험 사번 포함"]].map(function(x){ return '<button type="button" class="chip'+(SVY.test===x[0]?" on":"")+'" aria-pressed="'+(SVY.test===x[0])+'" onclick="svyTest('+x[0]+')">'+x[1]+'</button>'; }).join("")+'</div>'+
      '<div class="grid g4 mb" id="svyK"></div><div id="svyB"></div><div class="card mt"><h2>Q4 · 자유 의견</h2><div id="mg_svq4"></div></div>';
  };
  sc.paint=function(vb){ if(lgSub()!=="sv") return p0(vb); svyPaint(); };
})();
