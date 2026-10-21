/* AXF CONTROL v2 · 미팅 › 아이디어(전체) (261016 4단계 · 지금 콘솔 idea.js 를 옮김 · 261021 사람 탭 › 아이디어 한 줄 에서 미팅 탭으로 · 신청자 글은 meet.js 의 아이디어(신청자))
 * 화면 붙이기 = meet.js 가 id2Mount · id2Paint 를 부른다(커피챗 칩 › 아이디어(전체) · 주소 #meet/cc-ideaall)
 * 데이터 = idea_list(읽기 · 최근 순 · 시험 사번 줄 포함 · test 칸) · 숫자 = 시험 사번 뺀 수
 * 명단 = 공통 표(경로 칩 · 시험 · 숨김 · 마감 뒤) · 줄을 누르면 서랍에 전문 + 한 사람 카드 · 엑셀 = 같은 액션 dl=1
 * 아이디어왕 고르기는 무대 › 아이디어왕 */
var ID2_CH={ app:"앱", booth:"부스", board:"보드", lounge_pre:"라운지 사전", lounge_day:"라운지 당일", chat:"커피챗" };
function id2Day(){ var t=String(S.srvT||""); if(/^\d{4}-\d\d-\d\d/.test(t)) return t.slice(0,10); var n=new Date(), p=function(v){ return (v<10?"0":"")+v; }; return n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate()); }
function id2Chips(rows){
  var a=[["all","전체",null]], seen={};
  rows.forEach(function(r){ var c=r.ch||"app"; if(!seen[c]){ seen[c]=1; a.push(["c:"+jq(c), ID2_CH[c]||c, function(x){ return (x.ch||"app")===c; }]); } });
  a.push(["today","오늘",function(r){ return String(r.ts||"").slice(0,10)===id2Day(); }],["late","마감 뒤",function(r){ return !!r.late; }],["hid","숨김",function(r){ return !!r.hidden; }],["test","시험",function(r){ return !!r.test; }]);
  return a;
}
function id2Grid(){
  return gridOf("idea",{ file:"아이디어(전체)", key:function(r){ return String(r.id||(r.emp+"|"+r.ts)); }, sort:{ k:"ts", d:-1 }, chips:[["all","전체",null]], ph:"사번 · 이름 · 부서 · 태그 · 글", find:["tag","text"],
    src:{ a:"idea_list", p:{} }, onRow:function(k){ id2Open(k); }, h:540, empty:"아직 남긴 아이디어가 없습니다",
    cols:[{ k:"ts", t:"시각", type:"date", w:96 },{ k:"name", t:"이름", w:100, tags:function(r){ return (r.test?" "+tag("시험","off"):"")+(r.hidden?" "+tag("숨김","off"):""); } },{ k:"dept", t:"부서", w:140 },{ k:"emp", t:"사번", w:84 },
      { k:"tag", t:"분야", w:90 },{ k:"text", t:"한 줄", w:360 },{ k:"ch", t:"경로", w:90, v:function(r){ return (ID2_CH[r.ch]||r.ch||"앱")+(r.late?" · 마감 뒤":""); } },{ k:"anon", t:"공개", w:72, v:function(r){ return r.anon?"익명":"실명"; } }] });
}
function id2Open(k){
  var g=MG.idea; rowDetail(g, k, { title:function(r){ return whoOf(r).n||"아이디어"; },
    extra:function(r){ return '<div class="memo mt" style="white-space:pre-wrap">'+(r.tag?tag(r.tag)+" ":"")+esc(r.text||"")+'</div><p class="cap mt4">'+esc((ID2_CH[r.ch]||r.ch||"앱")+(r.late?" · 마감 뒤":"")+(r.anon?" · 게시판 익명":"")+(r.hidden?" · 게시판에 안 보임":""))+'</p>'; } });
}
function id2Kpi(){
  var b=el("idK"), d=S.data.idl; if(!b) return;
  var ok=d&&d.ok, real=ok?(d.rows||[]).filter(function(r){ return !r.test; }):[], td=real.filter(function(r){ return String(r.ts||"").slice(0,10)===id2Day(); }), who={};
  td.forEach(function(r){ who[r.emp]=1; });
  var app=real.filter(function(r){ return (r.ch||"app")==="app"; }).length;
  b.innerHTML=drKpi({ l:"전체", v:ok?n0(d.n):"-", u:"건", s:ok?"참여한 사람 "+drN("idea", n0(d.people), d.people)+"명":"" })+drKpi({ l:"오늘", v:ok?n0(td.length):"-", u:"건", s:ok?"오늘 남긴 사람 "+drN("idea:today", n0(Object.keys(who).length), Object.keys(who).length)+"명":"" })+
    kpi({ l:"앱에서", v:ok?n0(app):"-", u:"건", s:ok?"현장에서 대신 "+n0(real.length-app)+"건":"" })+kpi({ l:"숨김", v:ok?n0(real.filter(function(r){ return r.hidden; }).length):"-", u:"건", s:"게시판에 안 보임" });
}
function id2Mount(b){
  id2Grid();
  b.innerHTML='<div class="grid g4 mb" id="idK"></div><div class="card"><div id="mg_idea"></div><p class="cap mt">아이디어왕 고르기 = 무대 › 아이디어왕</p></div>';
}
function id2Paint(){
  id2Kpi(); var g=MG.idea;
  gridPaint("idea","idl","아이디어 목록",function(d){ var rows=d.rows||[]; var nc=id2Chips(rows); if(nc.map(function(c){ return c[0]; }).join()!==g.o.chips.map(function(c){ return c[0]; }).join()){ g.o.chips=nc; if(!nc.some(function(c){ return c[0]===g.chip; })) g.chip="all"; } return rows; });
}
