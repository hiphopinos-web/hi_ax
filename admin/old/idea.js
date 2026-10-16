/* ── 261012 현장 › 신청 · 참여 › 아이디어 한 줄(사용자 261012 「현황과 메뉴가 어디 있는지 명확하지 않다 · 현장 탭에 연결」) · 새 서버 데이터 없음 ──
 * 위 = 숫자(전체 · 오늘 · 참여한 사람 · 숨김) · 아래 = 목록(idea_list · 최근 순 · 찾기 · 경로 거르기) · 아이디어왕 고르기는 현장 › 시상 · 엑셀 · 전체 열은 옛 화면
 * 따로 둔 파일 · admin/index.html 이 본문 스크립트보다 먼저 <script src="idea.js?v=..."> 로 불러 IDEA_VIEW 를 VIEWS.idea 로 건다(index.html 400KB 상한) */
var IDEA_CHN={ app:"앱", booth:"부스", board:"보드", lounge_pre:"라운지 사전", lounge_day:"라운지 당일", chat:"커피챗" }, IDEA_SHOW=200;
function ideaSt(){ return S.ui.idea||(S.ui.idea={ q:"", ch:"", show:IDEA_SHOW }); }
function ideaToday(ts){ var n=new Date(), p=function(v){ return (v<10?"0":"")+v; }; return String(ts||"").slice(0,10)===n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate()); }
function ideaQ(v){ var u=ideaSt(); u.q=String(v||""); u.show=IDEA_SHOW; ideaList(); }
function ideaCh(c){ var u=ideaSt(); u.ch=u.ch===c?"":c; u.show=IDEA_SHOW; paint(); }
function ideaRows(){
  var d=S.data.idl, u=ideaSt(), q=u.q.trim().toLowerCase();
  return ((d&&d.rows)||[]).filter(function(r){ if(u.ch&&(r.ch||"app")!==u.ch) return false; if(!q) return true; return [r.emp,r.name,r.dept,r.tag,r.text].join(" ").toLowerCase().indexOf(q)>=0; });
}
function ideaList(){
  var box=el("idL"); if(!box) return;
  var u=ideaSt(), d=S.data.idl;
  if(!d){ box.innerHTML=skel(); return; }
  if(unknownSrv(d)){ box.innerHTML=srvMissing("아이디어 목록(idea_list)"); return; }
  if(!d.ok){ box.innerHTML=loadErr(d,"idl"); return; }
  var rows=ideaRows(), sh=rows.slice(0,u.show);
  box.innerHTML='<div class="scrl"><table class="tb"><colgroup><col style="width:96px"><col style="width:180px"><col><col style="width:110px"></colgroup><thead><tr><th>시각</th><th>사람</th><th>한 줄</th><th>경로</th></tr></thead><tbody>'+
    (sh.length?sh.map(function(r){ return '<tr class="'+(r.test||r.hidden?"locked":"")+'"><td class="n cap">'+esc(short(r.ts))+'</td><td class="nm"><b>'+esc(r.name||"-")+'</b>'+(r.anon?' '+tag("익명 공개"):'')+(r.test?' '+tag("시험"):'')+(r.hidden?' '+tag("숨김"):'')+'<div>'+esc(r.dept||"")+' · '+esc(r.emp)+'</div></td><td class="wrap">'+(r.tag?tag(r.tag)+' ':'')+esc(r.text)+'</td><td class="cap">'+esc(IDEA_CHN[r.ch]||r.ch||"앱")+(r.late?' · 마감 뒤':'')+'</td></tr>'; }).join(""):'<tr><td colspan="4"><div class="empty"><b>'+(u.q||u.ch?"해당하는 줄이 없습니다":"아직 남긴 아이디어가 없습니다")+'</b></div></td></tr>')+
    '</tbody></table></div><div class="foot"><span class="n">'+n0(rows.length)+'줄</span><span class="sp"></span>'+(rows.length>sh.length?'<button class="btn sm" data-qa="idea.more" onclick="ideaSt().show+='+IDEA_SHOW+';ideaList()">'+IDEA_SHOW+'줄 더</button>':'')+'</div>';
}
var IDEA_VIEW={
  need:function(){ return [{ k:"idl", a:"idea_list", ttl:30000 }]; },
  mount:function(){
    var u=ideaSt();
    el("vb").innerHTML='<div class="card kpis" id="idK"></div><div class="card list mt16"><div class="bar"><input class="in" id="idQ" data-qa="idea.q" type="search" autocomplete="off" aria-label="아이디어에서 찾기" placeholder="사번 · 이름 · 부서 · 태그 · 글" value="'+esc(u.q)+'" oninput="ideaQ(this.value)"><span class="sp"></span><span class="chips" id="idC"></span></div><div id="idL"></div></div>'+
      '<p class="cap mt12"><button class="lnk" data-qa="idea.ik" onclick="go(\'f_award\',\'ik\')">아이디어왕 고르기 › 현장 › 시상</button> · <button class="lnk" data-qa="idea.legacy" onclick="legacyOpen(\'r_idea\',0)">엑셀 · 전체 열 › 옛 화면</button></p>'+
      memo('<p>앱 · 부스 · 라운지 상담 · 커피챗에서 남긴 한 줄이 최근 순으로 쌓입니다. 숫자는 시험 사번을 뺀 수입니다. 회색 줄 = 시험 사번 또는 숨김.</p>');
  },
  paint:function(){
    var d=S.data.idl, u=ideaSt(), ok=d&&d.ok, rows=ok?d.rows||[]:[], real=rows.filter(function(r){ return !r.test; });
    var td=real.filter(function(r){ return ideaToday(r.ts); }), hid=real.filter(function(r){ return r.hidden; }).length, by={};
    real.forEach(function(r){ var c=r.ch||"app"; by[c]=(by[c]||0)+1; });
    el("idK").innerHTML=kpiCell({ l:"전체", v:ok?n0(d.n):"-", u:"건", s:ok?"참여한 사람 "+n0(d.people)+"명":"&nbsp;" })+kpiCell({ l:"오늘", v:ok?n0(td.length):"-", u:"건", s:ok?"오늘 남긴 사람 "+n0(Object.keys(td.reduce(function(a,r){ a[r.emp]=1; return a; },{})).length)+"명":"&nbsp;" })+
      kpiCell({ l:"앱에서", v:ok?n0(by.app||0):"-", u:"건", s:ok?"현장에서 대신 "+n0(real.length-(by.app||0))+"건":"&nbsp;" })+kpiCell({ l:"숨김", v:ok?n0(hid):"-", u:"건", s:"게시판에 안 보임" });
    var ch=Object.keys(by);
    el("idC").innerHTML=ch.length>1?ch.map(function(c){ return '<button class="chip'+(u.ch===c?" on":"")+'" aria-pressed="'+(u.ch===c)+'" data-qa="idea.ch.'+esc(c)+'" onclick="ideaCh(\''+esc(c)+'\')">'+esc(IDEA_CHN[c]||c)+' <span class="c">'+n0(by[c])+'</span></button>'; }).join(""):"";
    ideaList();
  }
};
