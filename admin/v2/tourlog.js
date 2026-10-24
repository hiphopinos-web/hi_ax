/* AXF CONTROL v2 · 명단 › 행사 둘러보기 (261024 사용자 「행사 둘러보기를 사람들이 얼마나 눌러 봤고 얼마나 체류했는지 · 누가 봤는지 · 게임 순위처럼」)
 * 자리 = 명단 탭 칩 「게임 순위」 바로 뒤(PP_SUBS 에 끼운다 · people.js 는 고치지 않는다 · SCREENS.people need · mount · paint 를 감싼다)
 * 읽기 = tour_stats(관리코드 · day = 그날 들어간 방문만 · 없으면 전체) · 서버 시트 둘러보기기록(앱 v8.78 부터 · 그 전 방문은 없다)
 * 위 = 숫자 카드 4(들어간 사람 · 들어간 횟수 · 총 체류 · 1회 평균 체류) · 시간대별 들어간 횟수 · 체류 분포 · 들어온 곳 · 3D · TV 영상
 *   요약 숫자는 시험 사번을 뺀다 · 표는 구분 칩(시험 제외 · 전체 · 시험)
 * 표 = table.js · 사람별(순위 = 누적 횟수 → 총 체류 · 빠른 정렬 단추 누적 횟수 · 총 체류 · 최근) | 방문별(최근 2,000회) · 엑셀 = 화면 그대로 · 줄을 누르면 한 사람 카드 */
var TVL_SUB=["tour","행사 둘러보기"];
var TVL_SORT=[["n","누적 횟수"],["sec","총 체류"],["last","최근"]];
(function(){
  var ix=PP_SUBS.map(function(x){ return x[0]; }).indexOf("rank");
  if(!PP_SUBS.some(function(x){ return x[0]==="tour"; })) PP_SUBS.splice(ix<0?PP_SUBS.length:ix+1,0,TVL_SUB);
  var sc=SCREENS.people, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return ppSub()==="tour"?tvlNeed():n0_.apply(this,arguments); };
  sc.mount=function(vb){ if(ppSub()!=="tour") return m0.apply(this,arguments); el("phCap").textContent="행사 둘러보기에 들어간 사람 · 횟수 · 체류 · 줄을 누르면 한 사람 카드"; tvlMount(vb, chipsH(PP_SUBS,"tour")); };
  sc.paint=function(vb){ if(ppSub()!=="tour") return p0.apply(this,arguments); tvlPaint(); };
  var cs=document.createElement("style"); cs.id="tvlCss";
  cs.textContent=".tvl-g2{margin-top:10px}.tvl-box{border:1px solid var(--line);border-radius:var(--r);padding:10px 12px;min-width:0}.tvl-box h3{font-size:13px;font-weight:700;margin:0 0 8px;display:flex;gap:6px;align-items:baseline}.tvl-box h3 .cap{font-weight:400}"+
    ".tvl-hb{display:flex;align-items:flex-end;gap:2px;height:110px;border-bottom:1px solid var(--line3)}.tvl-hb i{flex:1;min-width:0;background:var(--navy);border-radius:2px 2px 0 0}.tvl-hb i.z{background:var(--line2)}"+
    ".tvl-hl{display:flex;gap:2px;margin-top:4px;font-size:11px;color:var(--tx3);font-variant-numeric:tabular-nums}.tvl-hl span{flex:1;min-width:0;text-align:center}"+
    ".tvl-db{display:grid;grid-template-columns:88px minmax(0,1fr) 56px;align-items:center;gap:8px;font-size:12px;margin:5px 0}.tvl-db b{font-weight:400;color:var(--tx2)}.tvl-db em{font-style:normal;text-align:right;font-variant-numeric:tabular-nums}.tvl-db .bar{height:12px;background:var(--navy05);border-radius:2px;overflow:hidden}.tvl-db .bar i{display:block;height:100%;background:var(--navy)}"+
    ".tvl-ln{font-size:12px;color:var(--tx2);margin-top:8px;line-height:1.6}.tvl-seg{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}.tvl-seg .sp{flex:1}@media (max-width:720px){.tvl-g2{grid-template-columns:minmax(0,1fr)}}";
  document.head.appendChild(cs);
})();
function tvlDay(){ return S.ui.tvDay||""; }
function tvlToday(){ var t=String(S.srvT||"").slice(0,10); if(/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
function tvlView(){ return S.ui.tvView==="v"?"v":"p"; }
function tvlNeed(){ var d=tvlDay(); return [{ k:"tvst", a:"tour_stats", p:d?{ day:d }:{}, ttl:60000 }]; }
function tvlSetDay(d){ if(d===tvlDay()) return; S.ui.tvDay=d; S.data.tvst=null; S.at.tvst=0; render(); load(true,["tvst"]); }
function tvlSetView(v){ if(v===tvlView()) return; S.ui.tvView=v; render(); }
function tvlSortBy(k){ var g=MG.tvp; if(!g) return; g.sort={ k:k, d:-1 }; xgSave(g); XG.paint(g); tvlSortChips(); }
/* 초 → 「1분 05초」 · 「1시간 02분」 · 모름 = null */
function tvlDur(s){ if(s==null||s==="") return ""; s=Math.max(0,Math.round(Number(s)||0)); if(s<60) return s+"초"; if(s<3600) return Math.floor(s/60)+"분 "+("0"+s%60).slice(-2)+"초"; return Math.floor(s/3600)+"시간 "+("0"+Math.floor(s%3600/60)).slice(-2)+"분"; }
var TVL_SRC={ home:"홈 카드", hint:"퀴즈 힌트", back:"돌아가기", etc:"기타" };
function tvlChips(){ return [["real","시험 제외",function(r){ return !r.test; }],["all","전체",null],["test","시험",function(r){ return !!r.test; }]]; }
function tvlTestTag(r){ return r.test?" "+tag("시험","off"):""; }
function tvlGrids(){
  gridOf("tvp",{ file:"행사 둘러보기 사람별", key:function(r){ return r.emp; }, sort:{ k:"n", d:-1 }, chips:tvlChips(), h:560, ph:"사번 · 소속 · 이름 찾기",
    onRow:function(k){ pcOpen(k, MG.tvp); }, empty:"아직 들어간 사람이 없습니다",
    cols:[{ k:"rank", t:"순위", type:"num", w:60 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:150 },{ k:"name", t:"이름", w:90, tags:tvlTestTag },
      { k:"n", t:"누적 횟수", type:"num", w:84 },
      { k:"sec", t:"총 체류", type:"num", w:96, f:function(r){ return esc(tvlDur(r.sec))||'<span class="cap">모름</span>'; }, x:function(r){ return tvlDur(r.sec); } },
      { k:"avg", t:"1회 평균", type:"num", w:90, v:function(r){ return r.avg==null?"":r.avg; }, f:function(r){ return r.avg==null?'<span class="cap">모름</span>':esc(tvlDur(r.avg)); }, x:function(r){ return tvlDur(r.avg); } },
      { k:"first", t:"처음 들어간 시각", type:"date", w:120 },{ k:"last", t:"최근 들어간 시각", type:"date", w:120 },
      { k:"d3", t:"3D", w:56, v:function(r){ return r.d3?"3D":""; } },{ k:"vp", t:"TV 영상", type:"num", w:72 }] });
  gridOf("tvv",{ file:"행사 둘러보기 방문별", key:function(r){ return r.emp+"|"+r.in; }, sort:{ k:"in", d:-1 }, chips:tvlChips(), h:560, ph:"사번 · 소속 · 이름 찾기",
    onRow:function(k){ pcOpen(String(k).split("|")[0], MG.tvv); }, empty:"아직 방문 기록이 없습니다",
    cols:[{ k:"in", t:"들어간 시각", type:"date", w:120 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:150 },{ k:"name", t:"이름", w:90, tags:tvlTestTag },
      { k:"sec", t:"체류", type:"num", w:96, v:function(r){ return r.sec==null?"":r.sec; }, f:function(r){ return r.sec==null?'<span class="cap">모름</span>':esc(tvlDur(r.sec)); }, x:function(r){ return r.sec==null?"모름":tvlDur(r.sec); } },
      { k:"out", t:"나온 시각", type:"date", w:120 },
      { k:"src", t:"들어온 곳", w:96, v:function(r){ return TVL_SRC[r.src]||""; } },
      { k:"d3", t:"3D", w:56, v:function(r){ return r.d3==="Y"?"3D":r.d3==="N"?"평면":""; } },
      { k:"vp", t:"TV 영상", type:"num", w:72 },{ k:"z", t:"들른 구역", type:"num", w:80 }] });
}
function tvlSegH(){
  var day=tvlDay(), v=tvlView(), td=tvlToday();
  var b=function(on, fn, t){ return '<button type="button" class="chip'+(on?" on":"")+'" aria-pressed="'+on+'" onclick="'+fn+'">'+esc(t)+'</button>'; };
  return '<div class="chips" role="group" aria-label="기간">'+b(!day,"tvlSetDay('')","전체 기간")+b(day===td,"tvlSetDay('"+td+"')","오늘")+'</div>';
}
function tvlMount(vb, head){
  tvlGrids(); var v=tvlView();
  vb.innerHTML=head+'<div class="card"><h2>행사 둘러보기 <span class="cap">앱 v8.78 부터 기록 · 요약 숫자는 시험 사번 제외</span><span class="r" id="tvlT"></span></h2>'+tvlSegH()+
    '<div id="tvlSum" class="mt"></div>'+
    '<div class="tvl-seg"><div class="chips" role="group" aria-label="표">'+
      '<button type="button" class="chip'+(v==="p"?" on":"")+'" aria-pressed="'+(v==="p")+'" onclick="tvlSetView(\'p\')">사람별</button>'+
      '<button type="button" class="chip'+(v==="v"?" on":"")+'" aria-pressed="'+(v==="v")+'" onclick="tvlSetView(\'v\')">방문별</button></div><span class="sp"></span>'+
      (v==="p"?'<div class="chips" role="group" aria-label="정렬" id="tvlSort"></div>':'<span class="cap" id="tvlMore"></span>')+'</div>'+
    '<div id="mg_'+(v==="p"?"tvp":"tvv")+'" class="mt"></div></div>';
  if(v==="p") tvlSortChips();
}
function tvlSortChips(){ var c=el("tvlSort"), g=MG.tvp; if(!c) return; var k=g&&g.sort?g.sort.k:"n";
  c.innerHTML='<span class="cap">정렬</span> '+TVL_SORT.map(function(x){ var on=x[0]===k; return '<button type="button" class="chip'+(on?" on":"")+'" aria-pressed="'+on+'" onclick="tvlSortBy(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join(""); }
function tvlSumH(d){
  var s=d.sum||{}, t=s.test||{}, pp=num(s.people), vs=num(s.visits);
  var k='<div class="grid g4">'+
    kpi({ l:"들어간 사람", v:n0(pp), u:"명", s:"시험 사번 "+n0(t.people)+"명 따로" })+
    kpi({ l:"들어간 횟수", v:n0(vs), u:"회", s:pp?"1인 평균 "+(Math.round(vs/pp*10)/10)+"회":"" })+
    kpi({ l:"총 체류", v:s.known?tvlDur(s.sec):"-", s:"나온 기록이 있는 "+n0(s.known)+"회 합" })+
    kpi({ l:"1회 평균 체류", v:s.avg!=null?tvlDur(s.avg):"-", s:s.med!=null?"가운데값 "+tvlDur(s.med):"" })+'</div>';
  var hs=d.hours||[], mx=Math.max.apply(null,[1].concat(hs.map(function(h){ return num(h.n); })));
  var lo=24, hi=-1; hs.forEach(function(h){ if(num(h.n)){ lo=Math.min(lo,h.h); hi=Math.max(hi,h.h); } });
  if(hi<0){ lo=9; hi=18; } else { lo=Math.min(lo,9); hi=Math.max(hi,18); }
  var hh=hs.filter(function(h){ return h.h>=lo&&h.h<=hi; });
  var bars='<div class="tvl-hb" role="img" aria-label="시간대별 들어간 횟수">'+hh.map(function(h){ var n=num(h.n); return '<i class="'+(n?"":"z")+'" style="height:'+(n?Math.max(3,Math.round(n/mx*100)):1)+'%" title="'+h.h+'시 · '+n0(n)+'회"></i>'; }).join("")+'</div>'+
    '<div class="tvl-hl" aria-hidden="true">'+hh.map(function(h){ return '<span>'+(h.h%3===0?h.h:"")+'</span>'; }).join("")+'</div>';
  var ds=d.dist||[], dm=Math.max.apply(null,[1].concat(ds.map(function(x){ return num(x.n); })));
  var dist=ds.map(function(x){ var n=num(x.n); return '<div class="tvl-db"><b>'+esc(x.nm)+'</b><span class="bar"><i style="width:'+Math.round(n/dm*100)+'%"></i></span><em>'+n0(n)+'회</em></div>'; }).join("");
  var d3=s.d3||{}, src=(d.src||[]).filter(function(x){ return num(x.n); }).map(function(x){ return esc(x.nm)+" "+n0(x.n); }).join(" · ");
  var ln='<p class="tvl-ln">들어온 곳 '+(src||"-")+'<br>3D '+n0(d3.y)+' · 평면 안내 '+n0(d3.n)+(num(d3.u)?' · 모름 '+n0(d3.u):'')+' · TV 영상 누름 '+n0(s.vp)+'회</p>';
  return k+'<div class="grid g2 tvl-g2"><div class="tvl-box"><h3>시간대별 들어간 횟수 <span class="cap">'+(tvlDay()?"오늘":"전체 기간 합")+' · '+lo+'시 ~ '+hi+'시</span></h3>'+bars+'</div>'+
    '<div class="tvl-box"><h3>체류 분포 <span class="cap">방문 한 번</span></h3>'+dist+'</div></div>'+ln;
}
function tvlRank(rows){
  var real=rows.filter(function(r){ return !r.test; }).sort(function(a,b){ return num(b.n)-num(a.n)||num(b.sec)-num(a.sec)||String(a.first).localeCompare(String(b.first)); });
  var rk={}; real.forEach(function(r,i){ rk[r.emp]=i+1; });
  return rows.map(function(r){ return Object.assign({}, r, { rank:r.test?"":rk[r.emp] }); });
}
function tvlPaint(){
  var d=S.data.tvst, box=el("tvlSum"), gt=dataGate("tvst","행사 둘러보기");
  if(box) box.innerHTML=gt||tvlSumH(d);
  var tt=el("tvlT"); if(tt) tt.textContent=!gt&&d&&d.t?"기준 "+fmtD(d.t):"";
  if(tvlView()==="p") gridPaint("tvp","tvst","행사 둘러보기",function(dd){ return tvlRank(dd.people||[]); });
  else { gridPaint("tvv","tvst","행사 둘러보기",function(dd){ return dd.rows||[]; }); var m=el("tvlMore"); if(m) m.textContent=!gt&&d&&d.more?"최근 "+n0((d.rows||[]).length)+"회 · 전체 "+n0(d.total)+"회":""; }
}
