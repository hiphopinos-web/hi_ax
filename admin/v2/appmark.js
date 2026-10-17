/* AXF CONTROL v2 · 앱 설치 표시 · 한 사람 카드 「최근 기록」(261017 사용자 요청)
 * 「앱」 열 = 서버 app_marks(관리코드 · 읽기 · 60초) · 값 미가입(주황 글자) · 가입(계정 있음) · 홈 화면(접속 기록 경로 「홈 화면 앱」으로 로그인 상태 접속이 한 번이라도)
 *   서버가 아직 모르면 「-」 · 쓰는 곳 = 처리함 › 체크인존(열 + 「앱 미가입」 칩) · 사람 › 가입자 · 접속 허용 · 스태프 · 10F 사전 신청 · 시험 사번
 * 최근 기록 = 서버 person_log(문장 · 시간순 · 읽기) · 칩 전체 · 스탬프 · 게임 · 현장 · 신청 · 접속 · 처음 20줄 · 더 보기 30줄씩(받은 줄을 다 보이면 200줄 더 받기)
 *   이어진 접속 줄 = 한 줄로 묶음(「앱 열기 4회 · 23:07~00:05 · 홈 화면」) · 서버가 person_log 를 모르면 person_card 시간순(tl) 그대로 */
var APM_NEED={ k:"apm", a:"app_marks", ttl:60000 }, APM_T=["미가입","가입","홈 화면"];
function apmMap(){ var d=S.data.apm; if(!d||d.ok===false||!Array.isArray(d.h)) return null; if(d._m) return d._m; var m={}; (d.j||[]).forEach(function(e){ m[normE(e)]=1; }); d.h.forEach(function(e){ m[normE(e)]=2; }); d._m=m; return m; }
function apmOf(emp){ var m=apmMap(), e=normE(emp), d=PL.d[""]; if(e&&PL.emp===e&&d&&d.ok&&d.app!=null) return d.app; return m?(m[e]||0):null; }
function apmTxt(v){ return v==null?"":APM_T[v]; }
function apmHtml(v){ return v==null?'<span class="cap">-</span>':v===0?'<span class="apm-no">미가입</span>':esc(APM_T[v]); }
function apmCol(){ return { k:"_app", t:"앱", w:76, v:function(r){ return apmTxt(apmOf(r.emp)); }, f:function(r){ return apmHtml(apmOf(r.emp)); } }; }
/* 서버 열(useCols) 뒤에 「앱」 열 · 이름 다음 자리 */
function apmColAdd(g, after){
  if(!g||g.o.cols.some(function(c){ return c.k==="_app"; })) return;
  var i=-1; g.o.cols.forEach(function(c,j){ if(c.k===(after||"name")) i=j; });
  g.o.cols.splice(i<0?g.o.cols.length:i+1,0,apmCol());
  var root=XG.root(g); if(root) root.remove();
}
function apmChip(base){ return function(rows){ return base(rows).concat([["f:noapp","앱 미가입",function(r){ return apmOf(r.emp)===0; }]]); }; }

/* ── 한 사람 카드 · 최근 기록 ── */
var PL_CH=[["","전체"],["st","스탬프"],["gm","게임"],["sp","현장"],["ap","신청"],["vs","접속"]], PL_STEP=200, PL_FIRST=20, PL_MORE=30;
var PL={ emp:"", c:"", d:{}, busy:{}, show:PL_FIRST, seq:0 };
function plReset(emp){ PL.emp=emp; PL.c=""; PL.d={}; PL.busy={}; PL.show=PL_FIRST; PL.seq++; }
function plLoad(c, n){
  var e=PL.emp, s=PL.seq; if(!e) return; c=c||"";
  if(PL.busy[c]) return; PL.busy[c]=1;
  call("person_log",{ emp:e, c:c, n:n||PL_STEP }).then(function(r){ if(s!==PL.seq) return; PL.busy[c]=0; PL.d[c]=r||{ ok:false }; if(!c&&PC.emp===e&&PC.d) pcDraw(); else plPaint(); });
}
function plChip(c){ PL.c=c; PL.show=PL_FIRST; if(!PL.d[c]) plLoad(c); plPaint(); }
function plMore(){
  var d=PL.d[PL.c]; if(!d||!d.ok) return;
  var vis=plRows(d.rows||[]).length;
  PL.show+=PL_MORE;
  if(PL.show>vis&&d.more) plLoad(PL.c,(d.rows||[]).length+PL_STEP);
  plPaint();
}
/* 이어진 접속 줄 묶기 · 줄 = { t, x, by, byName, n, t0, rs(경로들) } */
function plRows(rows){
  var out=[];
  rows.forEach(function(r){
    var p=out[out.length-1];
    if(r.c==="vs"&&p&&p.vs){ p.n++; p.t0=r.t; if(r.r&&p.rs.indexOf(r.r)<0) p.rs.push(r.r); return; }
    out.push(r.c==="vs"?{ t:r.t, t0:r.t, vs:1, n:1, x:r.x, rs:r.r?[r.r]:[] }:r);
  });
  return out;
}
function plLine(r){
  if(r.vs&&r.n>1) return '앱 열기 '+r.n+'회 · '+hm(r.t0)+'~'+hm(r.t)+(r.rs.length?' · '+r.rs.join(" · "):'');
  return r.x;
}
function plHtml(){
  var d=PL.d[PL.c], d0=PL.d[""], cnt=(d0&&d0.ok&&d0.cnt)||(d&&d.ok&&d.cnt)||null;
  var h='<div class="chips pl-ch" role="group" aria-label="기록 종류">'+PL_CH.map(function(x){ var on=PL.c===x[0], k=x[0]||"all";
    return '<button type="button" class="chip'+(on?" on":"")+'" aria-pressed="'+on+'" onclick="plChip(\''+x[0]+'\')">'+esc(x[1])+(cnt?' <b class="n">'+n0(cnt[k]||0)+'</b>':'')+'</button>'; }).join("")+'</div>';
  if(!d) return h+skel();
  if(!d.ok) return h+band("warn","받지 못했습니다 · "+esc(why(d)),'<button class="btn sm" type="button" onclick="plLoad(PL.c)">다시 시도</button>');
  var all=plRows(d.rows||[]), rows=all.slice(0,PL.show);
  if(!rows.length) return h+'<p class="cap">기록이 없습니다</p>';
  h+='<ul class="pc-tl">'+rows.map(function(r){ return '<li><span class="n cap">'+esc(fmtD(r.t))+'</span><span>'+esc(plLine(r))+(r.byName||r.by?' <span class="cap">· 처리 '+esc(r.byName||r.by)+'</span>':'')+'</span></li>'; }).join("")+'</ul>';
  var more=all.length>PL.show||d.more;
  return h+'<div class="pl-ft">'+(more?'<button class="btn sm" type="button" onclick="plMore()"'+(PL.busy[PL.c]?' disabled':'')+'>'+(PL.busy[PL.c]?"받는 중":"더 보기")+'</button>':'<span class="cap">끝 · '+n0(all.length)+'줄</span>')+'<span class="cap">전체 기록 = 기록 · 설정 › 활동 기록</span></div>';
}
function plPaint(){ var b=el("pcLog"); if(b) b.innerHTML=plHtml(); }
/* 카드 「최근 기록」 칸 · 서버가 person_log 를 모르면 옛 tl */
function plSecHtml(d, oldTl){
  var d0=PL.d[""];
  if(d0&&unknownSrv(d0)) return oldTl;
  return '<div id="pcLog">'+plHtml()+'</div>';
}
