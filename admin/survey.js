/* ── 261013 밤 기록 › 숫자 · 설문 › 「설문」 서브탭 · 행사 사후 설문(서버 764ef1a95365 · 앱 v7.15 · 명세 기획 문서/설문/ json) ──
 * 화면 수 24개 상한(검사 360)이라 새 메뉴 대신 기록 › 숫자 화면에 서브탭 「숫자 | 설문」을 둔다 · SV_NUM = 그 화면의 view(숫자 = VIEWS.num 에 그대로 넘김)
 * 위 = 툴바(테스트 사번 빼고 | 포함 · CSV 내려받기) · 숫자(응답 · 전반 만족 평균 · 참여한 프로그램이 없다 · 자유 의견)
 * 아래 = Q1 셋 · 프로그램 8개 참여율 · 평균 표 + 점수 분포 · Q3 셋 · Q4 자유 의견 목록(시각 · 글)
 * 서버 = survey_list(집계 · test=1 이면 테스트 사번 포함) · survey_rows(CSV · 사번 포함 · 슈퍼관리자 + 본인 확인 뒤에만 부른다)
 * 따로 둔 파일 · admin/index.html 이 본문 스크립트보다 먼저 <script src="survey.js?v=..."> 로 불러 SV_NUM 을 VIEWS.sv(NAV r_num view sv)로 건다(index.html 400KB 상한) */
var SV_T={ q1_1:"전반 만족", q1_2:"행사 운영", q1_3:"재참여 · 추천", q3_1:"AX 3개년 로드맵", q3_2:"Hi-Helper · HiDI-Q 사용 계획", q3_3:"DAP" }, SV_SHOW=200, SV_COLS=23;
(function(){ try{ var st=document.createElement("style"); st.textContent=".svg{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}.svq{border:1px solid var(--line2);border-radius:var(--r-s);padding:12px 14px}.svq .hd{display:flex;align-items:baseline;gap:8px}.svq .hd b{font-size:var(--fs-b)}.svq .av{margin-left:auto;font-size:var(--fs-h2);font-weight:700;font-variant-numeric:tabular-nums}.svq .qt{margin:4px 0 8px;line-height:1.45}.svd{width:100%;border-collapse:collapse}.svd td{padding:3px 0;font-size:var(--fs-c);vertical-align:middle}.svd td.l{width:46%;padding-right:8px;color:var(--tx2);line-height:1.35}.svd td.c{width:72px;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.svp .barw{display:inline-block;width:calc(100% - 64px);vertical-align:middle;margin-right:8px}"; document.head.appendChild(st); }catch(e){} })();
function svSt(){ return S.ui.sv||(S.ui.sv={ test:false, q:"", show:SV_SHOW }); }
function svTest(on){ var u=svSt(); if(u.test===!!on) return; u.test=!!on; render(); load(false); }
function svQ(v){ var u=svSt(); u.q=String(v||""); u.show=SV_SHOW; svLines(); }
function svPc(a,b){ return b>0?Math.round(a/b*1000)/10:0; }
function svAvg(v){ return v==null?"-":Number(v).toFixed(2); }
function svQno(id){ return String(id||"").toUpperCase().replace("_","-"); }
function svDist(q){
  var n=q.n||0;
  return '<table class="svd">'+(q.opts||[]).map(function(o){ var c=(q.dist||{})[o[0]]||0; return '<tr><td class="l"><b class="n">'+o[0]+'</b> · '+esc(o[1])+'</td><td><div class="barw"><i style="width:'+svPc(c,n)+'%"></i></div></td><td class="c"><b>'+n0(c)+'</b> · '+svPc(c,n)+'%</td></tr>'; }).join("")+'</table>';
}
function svBlock(q, title){
  return '<div class="svq" data-qa="sv.q.'+esc(q.id)+'"><div class="hd"><b>'+esc(svQno(q.id))+' · '+esc(title)+'</b><span class="av" title="평균(5점 만점)">'+svAvg(q.avg)+'</span></div><p class="cap qt">'+esc(q.q)+'</p>'+svDist(q)+'<p class="cap mt8">답 '+n0(q.n)+'명 · 평균은 빈 값 뺌</p></div>';
}
function svProgs(d){
  var n=d.n||0, ps=d.progs||[];
  return '<div class="scrl"><table class="tb svp"><colgroup><col style="width:64px"><col><col style="width:96px"><col style="width:300px"><col style="width:96px"></colgroup><thead><tr><th>층</th><th>프로그램</th><th class="r">고른 사람</th><th>참여율</th><th class="r">평균</th></tr></thead><tbody>'+
    ps.map(function(p){ return '<tr><td>'+esc(p.fl)+'</td><td class="wrap">'+esc(p.nm)+'</td><td class="n r"><b>'+n0(p.n)+'</b>명</td><td><div class="barw"><i style="width:'+Math.min(100,Number(p.rate)||0)+'%"></i></div><span class="n">'+(Number(p.rate)||0)+'%</span></td><td class="n r"><b>'+svAvg(p.avg)+'</b></td></tr>'; }).join("")+
    '<tr><td class="cap">-</td><td class="wrap">참여한 프로그램이 없다</td><td class="n r"><b>'+n0(d.none)+'</b>명</td><td><div class="barw"><i style="width:'+svPc(d.none,n)+'%"></i></div><span class="n">'+svPc(d.none,n)+'%</span></td><td class="cap r">-</td></tr></tbody></table></div>';
}
function svLines(){
  var box=el("svL"), d=S.data.svl; if(!box) return;
  if(!(d&&d.ok&&d.sv)){ box.innerHTML=""; return; }
  var u=svSt(), q4=(d.qs||[]).filter(function(q){ return q.t==="text"; })[0]||{ lines:[] }, k=u.q.trim().toLowerCase();
  var rows=(q4.lines||[]).slice().reverse().filter(function(x){ return !k||String(x.line).toLowerCase().indexOf(k)>=0; }), sh=rows.slice(0,u.show);
  box.innerHTML='<div class="scrl"><table class="tb"><colgroup><col style="width:110px"><col></colgroup><thead><tr><th>시각</th><th>자유 의견</th></tr></thead><tbody>'+
    (sh.length?sh.map(function(x){ return '<tr><td class="n cap">'+esc(short(x.t))+'</td><td class="wrap">'+esc(x.line)+'</td></tr>'; }).join(""):'<tr><td colspan="2"><div class="empty"><b>'+(k?"해당하는 글이 없습니다":"아직 남긴 의견이 없습니다")+'</b></div></td></tr>')+
    '</tbody></table></div><div class="foot"><span class="n">'+n0(rows.length)+'건</span><span class="sp"></span>'+(rows.length>sh.length?'<button class="btn sm" data-qa="sv.more" onclick="svSt().show+='+SV_SHOW+';svLines()">'+SV_SHOW+'건 더</button>':'')+'</div>';
}
function svStamp(){ var d=new Date(), p=function(v){ return (v<10?"0":"")+v; }; return String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes()); }
function svCsv(){
  if(!(S.me&&S.me.sup)){ toast("CSV 는 슈퍼관리자가 내려받습니다"); return; }
  supNeed(function(){
    SP_ACT.survey_rows=1;
    var b=el("svCsvB"); if(b) b.disabled=true;
    callPost("survey_rows",{},function(r){
      if(b) b.disabled=false;
      if(unknownSrv(r)){ toast("이 서버는 아직 설문 CSV 를 모릅니다"); return; }
      if(!(r&&r.ok&&r.cols)){ toastErr("CSV 를 받지 못했습니다 · "+why(r)); return; }
      if(r.cols.length!==SV_COLS){ toastErr("칸 수가 "+r.cols.length+"개입니다(23개여야 함) · 서버 확인"); return; }
      csvSave("AXF_사후설문_"+svStamp()+".csv", r.cols, r.rows||[]);
      toast("내려받았습니다 · "+n0((r.rows||[]).length)+"줄");
    },function(e){ if(b) b.disabled=false; toastErr("CSV 를 받지 못했습니다 · "+why(e)); });
  });
}
var SV_VIEW={
  need:function(){ return [{ k:"svl", a:"survey_list", p:svSt().test?{ test:"1" }:{}, ttl:30000 }]; },
  mount:function(){
    var u=svSt(), sup=!!(S.me&&S.me.sup);
    el("vb").innerHTML='<div class="card"><div class="bar" style="border-bottom:0"><span class="seg" role="group" aria-label="테스트 사번"><button class="'+(u.test?"":"on")+'" aria-pressed="'+!u.test+'" data-qa="sv.real" onclick="svTest(false)">테스트 사번 빼고</button><button class="'+(u.test?"on":"")+'" aria-pressed="'+u.test+'" data-qa="sv.test" onclick="svTest(true)">테스트 사번 포함</button></span><span class="sp"></span>'+
      (sup?'<span class="cap">개인정보 포함(사번 · 이름 · 부문)</span><button class="btn" id="svCsvB" data-qa="sv.csv" onclick="svCsv()">CSV 내려받기</button>':'<span class="cap">CSV(사번 포함)는 슈퍼관리자가 내려받습니다</span>')+'</div></div>'+
      '<div class="card kpis mt16" id="svK"></div><div id="svB"></div>'+
      '<div class="card list mt16"><div class="bar"><h2 style="font-size:var(--fs-h2)">Q4 · 자유 의견</h2><span class="sp"></span><input class="in" id="svQ" data-qa="sv.q" type="search" autocomplete="off" aria-label="자유 의견에서 찾기" placeholder="글에서 찾기" value="'+esc(u.q)+'" oninput="svQ(this.value)"></div><div id="svL"></div></div>'+
      memo('<p>서버 집계를 30초마다 다시 받습니다. 기본은 테스트 사번을 뺀 수입니다. 평균은 빈 값(고르지 않은 프로그램)을 뺀 값, 참여율은 고른 사람 ÷ 응답 수입니다. 점수 5 = 가장 위 보기.</p><p>CSV = 한 사람 한 줄 · 23칸 · 테스트 사번 줄 포함(테스트 칸 Y) · q2_0 = 고른 프로그램 문항 id 목록 · 고르지 않은 프로그램 칸은 비어 있습니다. 사번 · 이름이 들어간 파일이라 받은 뒤 공용 폴더 · 메신저에 두지 않습니다.</p>');
  },
  paint:function(){
    var kb=el("svK"), bx=el("svB"), d=S.data.svl, u=svSt(); if(!kb||!bx) return;
    if(!d){ kb.innerHTML=""; bx.innerHTML=skel(); return; }
    if(unknownSrv(d)){ kb.innerHTML=""; bx.innerHTML=srvMissing("설문 집계(survey_list)"); return; }
    if(!d.ok){ kb.innerHTML=""; bx.innerHTML=loadErr(d,"svl"); return; }
    if(d.sv!=="post2"||!d.progs){ kb.innerHTML=""; bx.innerHTML=band("warn","서버가 옛 설문 형식(기본 문항)으로 답합니다. 사후 설문 서버(764ef1a95365 이후) 배포 뒤 이 화면이 채워집니다."); return; }
    var qs=d.qs||[], by={}; qs.forEach(function(q){ by[q.id]=q; });
    var q4=by.q4||{ n:0 }, q11=by.q1_1||{}, n=d.n||0;
    kb.innerHTML=kpiCell({ l:"응답", v:n0(n), u:"명", s:u.test?"테스트 사번 포함":"테스트 사번 "+n0(d.nt)+"명 뺌" })+kpiCell({ l:"전반 만족 평균", v:svAvg(q11.avg), u:"/ 5", s:"Q1-1 · 답 "+n0(q11.n)+"명" })+
      kpiCell({ l:"참여한 프로그램이 없다", v:n0(d.none), u:"명", s:"응답의 "+svPc(d.none,n)+"%" })+kpiCell({ l:"자유 의견", v:n0(q4.n), u:"건", s:"Q4 · 선택 문항" });
    if(!n){ bx.innerHTML=card("","",'<div class="empty"><b>아직 응답이 없습니다</b>'+(!u.test&&d.nt?'<p class="mt8">테스트 사번 응답 '+n0(d.nt)+'명 · 「테스트 사번 포함」에서 봅니다</p>':'')+'</div>',"","pad mt16"); svLines(); return; }
    var grp=function(ids){ return '<div class="svg">'+ids.filter(function(id){ return by[id]; }).map(function(id){ return svBlock(by[id], SV_T[id]||id); }).join("")+'</div>'; };
    var pq=(d.progs||[]).filter(function(p){ return by[p.id]; }).map(function(p){ return svBlock(by[p.id], p.fl+" "+p.nm); }).join("");
    bx.innerHTML=card("Q1 · 행사 전반","점수 5 = 가장 좋음 · 오른쪽 위 = 평균",grp(["q1_1","q1_2","q1_3"]),"","mt16")+
      '<div class="card mt16"><div class="ch"><h2>Q2 · 프로그램 참여율 · 만족도</h2><span class="cap">참여율 = 고른 사람 ÷ 응답 '+n0(n)+'명 · 평균 = 고른 사람의 점수</span></div>'+svProgs(d)+'<div class="cb0"><h5 class="h5">프로그램별 점수 분포(고른 사람)</h5><div class="svg">'+pq+'</div></div></div>'+
      card("Q3 · AX 이해도","점수 5 = 가장 위 보기",grp(["q3_1","q3_2","q3_3"]),"","mt16")+
      '<p class="cap mt8">서버 시각 '+esc(short(d.t))+'</p>';
    svLines();
  }
};
function svSub(){ return S.sub.r_num==="sv"?"sv":""; }
function svV(){ return svSub()?SV_VIEW:VIEWS.num; }
function svTab(k){ go("r_num", k||""); }
function svChips(){ var c=svSub(), b=function(k,t){ return '<button class="chip'+(c===k?" on":"")+'" role="tab" aria-selected="'+(c===k)+'" data-qa="sv.tab.'+(k||"num")+'" onclick="svTab(\''+k+'\')">'+t+'</button>'; };
  return '<div class="chips" role="tablist" aria-label="숫자 · 설문" style="margin:-4px 0 14px">'+b("","숫자")+b("sv","설문")+'</div>'; }
var SV_NUM={
  need:function(it){ return svV().need(it); },
  mount:function(it){ svV().mount(it); el("vb").insertAdjacentHTML("afterbegin", svChips()); },
  paint:function(it){ var V=svV(); if(V.paint) V.paint(it); },
  right:function(it){ var V=svV(); return V.right?V.right(it):""; }
};
