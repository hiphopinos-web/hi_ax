/* AXF CONTROL v2 · 지금 › 지금까지 (261017 · 사용자 「그동안 로그가 있었다면 지금까지 현황」)
 * 데이터 = now_sofar(관리코드 · 읽기 · 60초 캐시) · 사람 이름 · 사번 · 부문 없음 · test = 1 테스트 사번 포함(기본 뺌 · 이 브라우저에만 기억)
 * 행사일이 아닌 날 = 앱 사용 아래에 펼쳐 둔다 · 행사일 = 맨 아래 접힘(이상 신호 우선 D6) */
var SF={ t:null };
var SF_LS="axf_sofar_t";
var SF_TH=[[3,"룰렛 1회"],[4,"행운권 1장"],[5,"행운권 2장"],[6,"행운권 3장 · 선착순"]];
function sfTest(){ if(SF.t!=null) return SF.t; var v=""; try{ v=localStorage.getItem(SF_LS)||""; }catch(e){ v=""; } return v==="1"?1:0; }
function sfNeed(){ return { k:"sf", a:"now_sofar", p:{ test:String(sfTest()) }, ttl:60000 }; }
function sfSet(){ SF.t=sfTest()?0:1; try{ localStorage.setItem(SF_LS,String(SF.t)); }catch(e){} paint(); load(false); }
function sfEvDay(){ var b=S.data.nb; return !!(b&&b.day&&String(b.day)===usEv()); }
function sfMd(t){ t=String(t||""); return t.length>=16?Number(t.slice(5,7))+"/"+Number(t.slice(8,10))+" "+t.slice(11,16):"-"; }
function sfBar(v, mx){ return '<div class="bar"><i style="width:'+Math.round(num(v)*100/Math.max(1,mx))+'%"></i></div>'; }
function nwSofar(){
  var d=S.data.sf, g=dataGate("sf","지금까지"), on=sfTest(), live=d&&d.ok&&num(d.test)===on;
  var head='<div class="us-h"><h2>지금까지</h2><button type="button" class="chip'+(on?" on":"")+'" aria-pressed="'+(on?"true":"false")+'" onclick="sfSet()">테스트 포함</button>'+
    '<span class="cap us-upd">'+(live?"첫 기록 "+esc(sfMd(d.first))+" · 갱신 "+esc(String(d.t||"").slice(11,16))+" · 1분마다":"")+'</span></div>';
  if(!live) return head+(g||skel());
  var pp=d.people||{}, st=d.st||{}, dd=st.d||[], fx=d.fcfs||{};
  var k=[
    { l:"가입", v:n0(pp.acct), u:"명", s:"명부 "+n0(pp.roster)+"명" },
    { l:"최초 로그인 스탬프", v:n0(pp.login), u:"명", s:"스탬프 1개 이상 "+n0(pp.stamp1)+"명" },
    { l:"3개 이상", v:n0(st.n3), u:"명", s:"룰렛 사용 "+n0(st.used)+"명" },
    { l:"6개 달성", v:n0(st.n6), u:"명", s:"선착순 순번 "+n0(fx.issued)+" / "+n0(fx.cap) }
  ].map(kpi).join("");
  var mx=Math.max.apply(null,[1].concat([1,2,3,4,5,6].map(function(i){ return num(dd[i]); })));
  var dist='<table class="tb"><thead><tr><th>모은 개수</th><th class="n" style="width:72px">사람</th><th class="barc" style="width:42%"></th></tr></thead><tbody>'+[1,2,3,4,5,6].map(function(i){
    var th=SF_TH.filter(function(x){ return x[0]===i; })[0];
    return '<tr><td>'+i+'개'+(th?' <span class="cap">· '+th[1]+'</span>':'')+'</td><td class="n">'+n0(dd[i])+'</td><td class="barc">'+sfBar(dd[i],mx)+'</td></tr>'; }).join("")+'</tbody></table>'+
    '<div class="mt cap sf-nw">'+['4개 이상 <b>'+n0(st.n4)+'</b>명','5개 이상 <b>'+n0(st.n5)+'</b>명','행운권 <b>'+n0(st.tickets)+'</b>장(가진 사람 '+n0(st.holders)+'명)','선착순 지급 '+n0(fx.got)+'명'].map(function(x){ return '<span>'+x+'</span>'; }).join(' · ')+'</div>';
  var ln=d.lines||[], lm=Math.max.apply(null,[1].concat(ln.map(function(x){ return num(x.c); })));
  var lines='<table class="tb"><thead><tr><th>판 줄</th><th class="n" style="width:72px">발행</th><th class="barc" style="width:42%"></th></tr></thead><tbody>'+ln.map(function(x,i){
    return '<tr><td><span class="cap">'+(i+1)+'</span> '+esc(x.n)+'</td><td class="n">'+n0(x.c)+'</td><td class="barc">'+sfBar(x.c,lm)+'</td></tr>'; }).join("")+'</tbody></table>'+
    '<div class="mt cap">프로그램 참여 = 사람마다 최대 2개</div>';
  var id=d.idea||{}, cc=d.cchat||{}, lg=d.lounge||{}, kt=d.kit||{}, gm=d.game||{};
  var apps=rowH("아이디어 한 줄","낸 사람 "+n0(id.people)+"명",'<span class="big">'+n0(id.n)+'<small> 건</small></span>')+
    rowH("18F 커피챗 신청","선정 "+n0(cc.match)+"명",'<span class="big">'+n0(cc.n)+'<small> 명</small></span>')+
    rowH("AX 라운지 사전 명단","예약 "+n0(lg.resv)+"건",'<span class="big">'+n0(lg.pre)+'<small> 명</small></span>')+
    rowH("키트 사이즈 신청","사전 신청자 "+n0(kt.pre)+"명 중",'<span class="big">'+n0(kt.preReq)+'<small> 명</small></span>')+
    rowH("스태프 의류 사이즈 신청","스태프 의류 명단 "+n0(kt.staff)+"명 중",'<span class="big">'+n0(kt.staffReq)+'<small> 명</small></span>')+
    rowH("미니 게임","한 사람 "+n0(gm.miniP)+"명",'<span class="big">'+n0(gm.mini)+'<small> 판</small></span>')+
    rowH("AX 퀴즈","한 사람 "+n0(gm.quizP)+"명",'<span class="big">'+n0(gm.quiz)+'<small> 판</small></span>')+
    rowH("설문","",'<span class="big">'+n0(d.survey)+'<small> 건</small></span>');
  var rc=d.recent||[];
  var rec=rc.length?rc.map(function(x){ return '<div class="sf-rc"><span class="cap">'+esc(sfMd(x.t))+'</span>'+esc(x.k)+'</div>'; }).join(""):emptyH("참여 기록이 없습니다");
  return head+'<div class="grid g4 mb">'+k+'</div>'+
    '<div class="grid g2 mb"><div class="card"><h2>개수별 사람 <span class="cap">스탬프 6개 상한</span></h2>'+dist+'</div><div class="card"><h2>항목별 발행 수 <span class="cap">스탬프 판 8줄</span></h2>'+lines+'</div></div>'+
    '<div class="grid g2 mb"><div class="card"><h2>신청 · 참여</h2>'+apps+'</div><div class="card"><h2>최근 참여 <span class="cap">스탬프 · 룰렛 8줄</span></h2>'+rec+'</div></div>';
}
/* 행사일 = 맨 아래 접힘(열어 둔 상태는 다시 그려도 유지) */
function nwSofarWrap(){
  if(!sfEvDay()) return '<div class="sf-blk">'+nwSofar()+'</div>';
  var op=!!(el("sfDet")&&el("sfDet").open);
  return '<details class="memo sf-blk" id="sfDet"'+(op?" open":"")+'><summary>지금까지 누적 현황</summary>'+nwSofar()+'</details>';
}
