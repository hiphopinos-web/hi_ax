/* AXF CONTROL v2 · 미팅 › 아이디어(전체) (261016 4단계 · 지금 콘솔 idea.js 를 옮김 · 261021 사람 탭 › 아이디어 한 줄 에서 미팅 탭으로 · 신청자 글은 meet.js 의 아이디어(신청자))
 * 화면 붙이기 = meet.js 가 id2Mount · id2Paint 를 부른다(커피챗 칩 › 아이디어(전체) · 주소 #meet/cc-ideaall)
 * 데이터 = idea_list(읽기 · 최근 순 · 시험 사번 줄 포함 · test 칸) · 숫자 = 시험 사번 뺀 수
 * 명단 = 공통 표(경로 칩 · 시험 · 숨김 · 마감 뒤) · 줄을 누르면 서랍에 전문 + 한 사람 카드 · 엑셀 = 같은 액션 dl=1
 * 아이디어왕 고르기는 무대 › 아이디어왕
 * 261021 운영자 메모(사용자 「아이디어(신청자)처럼 · 리스트에서도」) = 한 줄(아이디어 ID)마다 · meet_note_list · meet_note_set prog id(신청자 메모 cc 와 따로)
 *   데이터 idm = meet.js need 에 id2Mount 가 한 줄 덧붙인다(meet.js 는 그대로) · 서버가 모르면(param) 메모 열 · 칩 · 칸을 숨긴다 */
var ID2_CH={ app:"앱", booth:"부스", board:"보드", lounge_pre:"라운지 사전", lounge_day:"라운지 당일", chat:"커피챗" };
var ID2M={ k:null };
function id2MemoOk(){ var d=S.data.idm; return !!(d&&d.ok&&Array.isArray(d.rows)); }
function id2Memo(r){ var d=S.data.idm, id=String(r&&r.id||""); if(!id||!id2MemoOk()) return null;
  for(var i=0;i<d.rows.length;i++) if(String(d.rows[i].id)===id) return d.rows[i]; return null; }
function id2MemoTx(r){ var n=id2Memo(r); return n&&n.memo||""; }
function id2NeedHook(){ var sc=SCREENS.meet; if(!sc||sc.id2m) return; var f=sc.need; sc.id2m=1;
  sc.need=function(){ var a=f.apply(this,arguments), s=mtSub(); if(s.p==="cc"&&s.v==="ideaall") a.push({ k:"idm", a:"meet_note_list", p:{ prog:"id" }, ttl:60000 }); return a; }; }
function id2Day(){ var t=String(S.srvT||""); if(/^\d{4}-\d\d-\d\d/.test(t)) return t.slice(0,10); var n=new Date(), p=function(v){ return (v<10?"0":"")+v; }; return n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate()); }
function id2Chips(rows){
  var a=[["all","전체",null]], seen={};
  rows.forEach(function(r){ var c=r.ch||"app"; if(!seen[c]){ seen[c]=1; a.push(["c:"+jq(c), ID2_CH[c]||c, function(x){ return (x.ch||"app")===c; }]); } });
  a.push(["today","오늘",function(r){ return String(r.ts||"").slice(0,10)===id2Day(); }],["late","마감 뒤",function(r){ return !!r.late; }],["hid","숨김",function(r){ return !!r.hidden; }],["test","시험",function(r){ return !!r.test; }]);
  if(id2MemoOk()) a.push(["memo","메모 있음",function(r){ return !!id2MemoTx(r); }]);
  return a;
}
function id2Grid(){
  return gridOf("idea",{ file:"아이디어(전체)", key:function(r){ return String(r.id||(r.emp+"|"+r.ts)); }, sort:{ k:"ts", d:-1 }, chips:[["all","전체",null]], ph:"사번 · 이름 · 부서 · 태그 · 글", find:["tag","text"],
    src:{ a:"idea_list", p:{} }, onRow:function(k){ id2Open(k); }, h:540, empty:"아직 남긴 아이디어가 없습니다",
    cols:[{ k:"ts", t:"시각", type:"date", w:96 },{ k:"name", t:"이름", w:100, tags:function(r){ return (r.test?" "+tag("시험","off"):"")+(r.hidden?" "+tag("숨김","off"):""); } },{ k:"dept", t:"부서", w:140 },{ k:"emp", t:"사번", w:84 },
      { k:"tag", t:"분야", w:90 },{ k:"text", t:"한 줄", w:360 },{ k:"ch", t:"경로", w:90, v:function(r){ return (ID2_CH[r.ch]||r.ch||"앱")+(r.late?" · 마감 뒤":""); } },{ k:"anon", t:"공개", w:72, v:function(r){ return r.anon?"익명":"실명"; } },
      { k:"memo", t:"메모", w:200, noDet:1, v:id2MemoTx }] });
}
function id2Open(k){
  var g=MG.idea; ID2M.k=String(k);
  rowDetail(g, k, { title:function(r){ return whoOf(r).n||"아이디어"; },
    extra:function(r){ return '<div class="memo mt" style="white-space:pre-wrap">'+(r.tag?tag(r.tag)+" ":"")+esc(r.text||"")+'</div><p class="cap mt4">'+esc((ID2_CH[r.ch]||r.ch||"앱")+(r.late?" · 마감 뒤":"")+(r.anon?" · 게시판 익명":"")+(r.hidden?" · 게시판에 안 보임":""))+'</p>'+id2MemoBox(r); } });
}
/* 운영자 메모 칸(meet.js 사람 상세와 같은 모양 · 문구 · 500자) */
function id2MemoBox(r){
  if(!r.id||!id2MemoOk()) return "";
  var n=id2Memo(r);
  return '<div class="fld mt">운영자 메모 <span class="cap">참가자에게 보이지 않음 · 500자</span></div><textarea class="mtg-memo" id="id2Memo" maxlength="500" aria-label="운영자 메모">'+esc(n&&n.memo||"")+'</textarea>'+
    (n&&n.at?'<p class="cap mt4">'+esc((n.by||"")+" · "+fmtD(n.at)+" 저장")+'</p>':'')+'<div class="btns mt"><button class="btn sm pri" type="button" id="id2MemoGo" onclick="id2MemoSave()">메모 저장</button></div>';
}
function id2MemoSave(){
  var g=MG.idea, k=ID2M.k, t=el("id2Memo"), go=el("id2MemoGo"); if(!g||k==null||!t) return;
  var r=(g.rows||[]).filter(function(x){ return String(g.o.key(x))===k; })[0]; if(!r||!r.id) return;
  var n=id2Memo(r), v=t.value.slice(0,500), id=String(r.id), who=whoOf(r).n||r.emp||"";
  if(go){ go.setAttribute("aria-disabled","true"); go.textContent="저장 중"; }
  call("meet_note_set",{ prog:"id", id:id, memo:v, at:n&&n.at||"" }).then(function(x){
    if(x&&x.ok){ var d=S.data.idm, m=id2Memo(r); if(!m){ m={ prog:"id", id:id }; d.rows.push(m); } m.memo=x.memo!=null?x.memo:v; m.by=x.by||""; m.at=x.at||"";
      paint(); if(ID2M.k===k&&DRW.k===g.id+":"+k) id2Open(k); toast("메모를 저장했습니다 · "+who); return; }
    if(go){ go.removeAttribute("aria-disabled"); go.textContent="메모 저장"; }
    if(x&&x.reason==="changed"){ toast("다른 곳에서 먼저 고쳤습니다 · 다시 받은 뒤 저장합니다",{ bad:1 }); reload(["idm"]); }
    else toast("저장하지 못했습니다 · "+(x&&x.reason==="long"?"500자까지":why(x)),{ bad:1 }); });
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
  id2NeedHook(); if(!S.data.idm) reload(["idm"]);
  id2Grid();
  b.innerHTML='<div class="grid g4 mb" id="idK"></div><div class="card"><div id="mg_idea"></div><p class="cap mt">아이디어왕 고르기 = 무대 › 아이디어왕</p></div>';
}
function id2Paint(){
  id2Kpi(); var g=MG.idea;
  gridPaint("idea","idl","아이디어 목록",function(d){ var rows=d.rows||[]; var nc=id2Chips(rows); if(nc.map(function(c){ return c[0]; }).join()!==g.o.chips.map(function(c){ return c[0]; }).join()){ g.o.chips=nc; if(!nc.some(function(c){ return c[0]===g.chip; })) g.chip="all"; } return rows; });
}
