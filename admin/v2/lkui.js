/* AXF CONTROL v2 · 행운권 탭 첫 화면 「럭키드로우」 (261022 사용자 「누가 대상자 · 체크인을 언제 어떻게 정지 · 누가 체크인 · 누가 등수」)
 * 261024 다시 짬(사용자 「네 칸으로 쪼개 명부가 어설프다 · 한 번 쓸 마감 단추가 너무 크다」) · 위에서 아래로
 *   상태 줄 한 줄 = 무대 감시(dmon.js) · 체크인 상태 · 오른쪽 끝 작은 「체크인 마감」(테두리 단추 · 확인 창) · 「체크인 QR」 글 단추 · 경고 띠는 있을 때만 그 아래
 *   숫자 줄 = 전체 통 명 · 장 / 체크인 통 명 · 장 / 17F 체크인 명 / 당첨 n · 10 · 공 넣기 뒤 무대 고정 숫자를 같은 칸에서 대조
 *   탭 하나(대상 명단 · 체크인한 사람 · 당첨 결과) · 한 번에 표 하나 · 표는 높이 상한 안에서만 스크롤(1280 × 720 첫 화면에 상태 줄 · 숫자 줄 · 탭)
 *   맨 아래 「고급 · 평소에는 열지 않음」 = 옛 칩(현황 · 명단 · 종이 대비 · 추첨 설정 · 당첨 기록)
 * 읽기 = draw_stats(숫자 · 마감 · 고정 · 당첨 기록 · 슈퍼관리자면 who 1 · 10초) · draw_board(사람 줄 · 10초 · 슈퍼관리자 아님 + 대상 명단 탭 = v all)
 * 대상 명단 탭(슈퍼관리자) = lucky.js lkyTable 같은 부품(칸 lkuTb · 「명단 불러오기」 · 「표 새로 받기」를 누를 때만 받음 · 10초 갱신 · 탭 열기 · 탭 오가기에는 받지 않음 · 화면을 다시 열면 처음 상태)
 * 쓰기 = 체크인 마감 · 다시 열기(draw_cfg closed · 확인 창 · 되돌리기 · 무대 공 넣기 뒤 다시 열기 막음) 하나뿐
 * 추첨 진행은 무대 노트북(draw/) · 무대는 콘솔 원격 명령을 받지 않는다(261016 E1) · 원격 진행 칸은 추첨 설정 칩 맨 아래 접힘(stage.js)
 * 261025 「연습 체크인 보기」(사용자 261025 · 기본 끔 · 10/26 16:40 부터 숨김) · 켜면 사람 줄 · 숫자 = draw_bprac(연습 기록 · draw_board 와 같은 모양 · 같은 거름) · 맨 위 띠 · 체크인 마감 못 누름 · 무대 고정 대조 안 함
 *   당첨 결과 · 무대 감시 = draw_stats 그대로(실제) · 슈퍼관리자 = 고급 맨 아래 「연습 체크인 받기」 켜기 · 끄기(cfg_set 추첨_연습체크인 · 확인 창 · 되돌리기) */
var LKU={ q:"", inOnly:false, open:false, tab:"all", qr:false, lim:200, limIn:100, sig:{}, w:{ wins:0, abs:0 }, prac:false };
var LKU_PRAC_CUT="2026-10-26 16:40", LKU_PRAC_KEY="추첨_연습체크인";
var LKU_RK=[[6,3],[5,2],[4,2],[3,1],[2,1],[1,1]], LKU_SLOTS=10;
var LKU_TABS=[["all","대상 명단"],["in","체크인한 사람"],["win","당첨 결과"]];
var LKU_ADV=[["now","현황","발급 숫자 · 장수별 · 발급 흐름"],["list","명단","엑셀 · CSV · 번호만 · 종이 키트"],["paper","종이 대비","서버가 멈출 때 종이 추첨"],
  ["draw","추첨 설정","체크인 코드 · 시간 · 원격 진행"],["rec","당첨 기록","당첨 · 부재 · 취소 전체 표"]];
(function(){ if(SG_SUBS.some(function(x){ return x[0]==="lk"; })) return; SG_SUBS.unshift(["lk","럭키드로우"]); SG_SUBS.forEach(function(x){ if(x[0]==="draw") x[1]="추첨 설정"; }); })();
(function(){ var sc=SCREENS.stage; if(!sc||sc.lku) return; sc.lku=1; var n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return sgSub()==="lk"?lkuNeed():n0_.apply(this,arguments); };
  sc.mount=function(vb){ if(sgSub()!=="lk") return m0.apply(this,arguments); lkuMount(vb); };
  sc.paint=function(vb){ if(sgSub()!=="lk") return p0.apply(this,arguments); lkuPaint(); };
})();
function lkuNeed(){ var a=[{ k:"draw", a:"draw_stats", p:isTop()?{ who:"1" }:null, ttl:10000 },{ k:"dbd", a:lkuPr()?"draw_bprac":"draw_board", p:{ v:LKU.open?"all":"in" }, ttl:10000 }];
  if(isTop()&&lkuPracOk()) a.push({ k:"cfgl", a:"cfg_list", ttl:60000 });   /* 261025 연습 체크인 받기 스위치 값 */
  return a; }
/* 261025 연습 체크인 보기 · 서버 시각 10/26 16:40 전 · 서버가 연습 보기를 끝냈다고(prac 0) 하면 숨김 */
function lkuNowS(){ var t=srvNow(); return lkuToday()+" "+("0"+t.getHours()).slice(-2)+":"+("0"+t.getMinutes()).slice(-2); }
function lkuPracOk(){ var b=S.data.dbd; return lkuNowS()<LKU_PRAC_CUT&&!(b&&b.ok&&b.prac===0); }
function lkuPr(){ return LKU.prac&&lkuPracOk(); }
function lkuPrT(){ LKU.prac=!LKU.prac&&lkuPracOk(); S.data.dbd=null; LKU.sig={}; lkuPrSync(); lkuSet("lkuIn","in",skel()); lkuSet("lkuT","top",skel()); reload(["dbd"]); paint(); }
function lkuPrSync(){ var b=el("lkuPrB"), ok=lkuPracOk(); if(LKU.prac&&!ok) LKU.prac=false; if(!b) return; b.hidden=!ok; b.className="chip lku-prt"+(LKU.prac?" on":""); b.setAttribute("aria-pressed",String(LKU.prac)); }
function lkuMount(vb){
  el("phCap").textContent="17F Closing Speech 행운권 1~6등 · 추첨 진행은 무대 노트북";
  LKU.sig={}; var top=isTop();
  LKU.open=!top&&LKU.tab==="all";   /* 슈퍼관리자 아님 = 대상 명단 탭이 draw_board v all 목록 */
  if(typeof LKY_U==="object"){ LKY_U.rows=null; LKY_U.tkey=""; LKY_U.err=""; LKY_U.h=Math.max(200,Math.min(560,innerHeight-480)); }   /* 화면을 다시 열면 불러오기 전 상태 · 표 높이 = 창 높이에 맞춤(첫 화면 안) */
  var tabs='<div class="seg" role="tablist" aria-label="럭키드로우 표">'+LKU_TABS.map(function(x){ return '<button type="button" role="tab" id="lkuTab_'+x[0]+'" aria-controls="lkuP_'+x[0]+'" onclick="lkuTab(\''+x[0]+'\')">'+esc(x[1])+(x[0]==="in"?' <span class="c n" id="lkuInC"></span>':x[0]==="win"?' <span class="c n" id="lkuWC"></span>':'')+'</button>'; }).join("")+'</div>';
  vb.innerHTML='<div class="chips" role="tablist"><button type="button" role="tab" aria-selected="true" class="chip on">럭키드로우</button><button type="button" class="chip" onclick="lkuAdvGo()">고급</button><button type="button" class="chip lku-prt" id="lkuPrB" aria-pressed="false" onclick="lkuPrT()" hidden>연습 체크인 보기</button></div>'+
    '<section class="card lku-hd" aria-label="무대 · 체크인 상태"><div class="lku-row"><div id="lkuMon" class="lku-mon"></div><div id="lkuCk" class="lku-ck">'+skel()+'</div></div><div id="lkuQrB" class="lku-qr" hidden></div></section>'+
    '<div id="lkuBand"></div>'+
    '<div id="lkuT" class="lku-kp">'+skel()+'</div>'+
    '<div class="lku-tabs">'+tabs+
      '<div class="r" data-p="all">'+(top?'<span class="cap n" id="lkuRt"></span><span class="lku-rb" id="lkuRb"></span>':'<span class="cap" id="lkuLsC"></span>')+'</div>'+
      '<div class="r" data-p="in"><span class="cap" id="lkuInN">최근 체크인이 위 · 10초마다</span></div>'+
      '<div class="r" data-p="win"><span class="cap">무대 기록대로 · 10초마다</span></div></div>'+
    '<section class="card lku-pane">'+
      '<div id="lkuP_all" role="tabpanel" aria-labelledby="lkuTab_all">'+(top?'<div id="lkuTb"></div>':
        '<div class="lku-bar"><input class="xg-q" id="lkuQ" type="search" placeholder="이름 · 부서 찾기" aria-label="대상 명단 찾기" value="'+esc(LKU.q)+'" oninput="lkuFind(this.value)">'+
        '<button type="button" class="chip'+(LKU.inOnly?" on":"")+'" id="lkuIo" aria-pressed="'+LKU.inOnly+'" onclick="lkuInOnly()">체크인한 사람만</button></div><div id="lkuLst">'+skel()+'</div>')+'</div>'+
      '<div id="lkuP_in" role="tabpanel" aria-labelledby="lkuTab_in"><div id="lkuIn">'+skel()+'</div></div>'+
      '<div id="lkuP_win" role="tabpanel" aria-labelledby="lkuTab_win"><div id="lkuW">'+skel()+'</div></div>'+
    '</section>'+
    '<details class="memo card mt" id="lkuAdv"><summary>고급 · 평소에는 열지 않음</summary><div class="mt4">'+LKU_ADV.map(function(x){ return '<div class="row"><div class="t"><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></div><button class="btn sm" type="button" style="flex:none" onclick="go(\'stage\',\''+x[0]+'\')">열기</button></div>'; }).join("")+(top&&lkuPracOk()?'<div class="row" id="lkuPrS"></div>':'')+'</div></details>';
  lkuTabSync(); lkuPrSync();
}
function lkuAdvGo(){ var a=el("lkuAdv"); if(!a) return; a.open=true; try{ a.scrollIntoView({ behavior:"smooth", block:"start" }); }catch(e){ a.scrollIntoView(); } }
/* 탭 · 한 번에 표 하나 · 슈퍼관리자 아님 + 대상 명단 = draw_board v all 로 한 번(그 뒤 10초) · 명단 표(roster)는 여기서 받지 않음 */
function lkuTab(k){
  if(!LKU_TABS.some(function(x){ return x[0]===k; })) return;
  LKU.tab=k; lkuTabSync();
  var need=!isTop()&&k==="all";
  if(need!==LKU.open){ LKU.open=need; LKU.sig.ls=""; if(need){ lkuSet("lkuLst","ls",skel()); reload(["dbd"]); return; } }
  lkuPaint();
}
function lkuTabSync(){
  LKU_TABS.forEach(function(x){ var on=x[0]===LKU.tab, b=el("lkuTab_"+x[0]), p=el("lkuP_"+x[0]);
    if(b){ b.className=on?"on":""; b.setAttribute("aria-selected",String(on)); b.tabIndex=on?0:-1; } if(p) p.hidden=!on; });
  document.querySelectorAll(".lku-tabs .r").forEach(function(r){ r.hidden=r.getAttribute("data-p")!==LKU.tab; });
}
function lkuQrT(){ LKU.qr=!LKU.qr; LKU.sig.qr=""; LKU.sig.ck=""; var q=el("lkuQrB"); if(q) q.hidden=!LKU.qr; lkuPaint(); }
function lkuFind(v){ LKU.q=String(v||""); LKU.lim=200; LKU.sig.ls=""; lkuPaint(); }
function lkuInOnly(){ LKU.inOnly=!LKU.inOnly; LKU.lim=200; LKU.sig.ls=""; var b=el("lkuIo"); if(b){ b.className="chip"+(LKU.inOnly?" on":""); b.setAttribute("aria-pressed",String(LKU.inOnly)); } lkuPaint(); }
function lkuMore(k){ if(k==="in") LKU.limIn+=200; else LKU.lim+=400; LKU.sig[k]=""; lkuPaint(); }
function lkuSet(id, k, h){ if(LKU.sig[k]===h) return; LKU.sig[k]=h; var x=el(id); if(x) x.innerHTML=h; }
function lkuB(){ var b=S.data.dbd; if(!(b&&b.ok&&Array.isArray(b.rows))) return null; return (b.prac===1?1:0)===(lkuPr()?1:0)?b:null; }   /* 261025 연습 보기 · 켠 쪽 응답만 그린다(바꾼 직후 옛 응답 안 그림) */
function lkuRows(b){ var dp=b.dps||[]; return (b.rows||[]).map(function(r){ return { nm:String(r[0]||""), dp:String(dp[r[1]]||""), c:num(r[2]), at:String(r[3]||"") }; }); }
function lkuMd(day){ var m=String(day||"").match(/^\d{4}-(\d{2})-(\d{2})$/); return m?(+m[1])+"/"+(+m[2]):""; }
function lkuToday(){ var t=srvNow(); return t.getFullYear()+"-"+("0"+(t.getMonth()+1)).slice(-2)+"-"+("0"+t.getDate()).slice(-2); }
/* 체크인 상태 · pre 날짜 · 시간 전 · open 받는 중 · after 날짜 지남 · closed 마감 · 261022 밤 서버 why(nocode | closed | day | time | 빈 값)가 있으면 그것으로(창검사 · 매일 날짜까지 서버와 같게) */
function lkuCk(d, b){
  var closed=d&&"closed" in d?d.closed:b.closed, n=b?num(b.inAll):num(d["in"]), day=(b?b.day:d.day)||"", st=(b?b.start:hm(String(d.win||"").split("-")[0]))||"16:40", on=b?!!b.winOn:!!d.winOn;
  if(closed) return { k:"closed", t:"마감"+(b&&b.closed&&b.closedAt?" · "+hm(String(b.closedAt).slice(11,16)):""), s:"체크인 "+n0(n)+"명에서 멈춤", n:n };
  var sw=d&&("why" in d)?d.why:b&&("why" in b)?b.why:null;
  if(sw!=null){ var md=lkuMd(day), whn=(md?md+" ":"")+st;
    if(sw==="nocode") return { k:"after", t:"받지 않음", s:"서버 추첨 코드 없음", n:n };
    if(sw==="day"&&day&&lkuToday()>day) return { k:"after", t:"받지 않음", s:"체크인 날짜 "+md, n:n };
    if(sw==="day"||sw==="time") return { k:"pre", t:whn+"부터 받음", s:"끝 시각 없음 · 17:13쯤 「체크인 마감」", n:n };
    if(sw==="") return { k:"open", t:"받는 중 · "+n0(n)+"명", s:on?"시작 "+st+" · 끝 시각 없음 · 17:13쯤 「체크인 마감」":"시간 검사 꺼짐 · 지금도 받음", n:n }; }
  var td=lkuToday(), t=srvNow(), m=t.getHours()*60+t.getMinutes();
  if(on&&day&&(td<day||(td===day&&m<mins(st)))) return { k:"pre", t:lkuMd(day)+" "+st+"부터 받음", s:"끝 시각 없음 · 17:13쯤 「체크인 마감」", n:n };
  if(on&&day&&td>day) return { k:"after", t:"받지 않음", s:"체크인 날짜 "+lkuMd(day), n:n };
  return { k:"open", t:"받는 중 · "+n0(n)+"명", s:on?"시작 "+st+" · 끝 시각 없음 · 17:13쯤 「체크인 마감」":"시간 검사 꺼짐 · 지금도 받음", n:n };
}
function lkuPaint(){
  if(!el("lkuT")) return;
  var gt=dataGate("draw","행운권 추첨"), d=S.data.draw, b=lkuB(), gb=dataGate("dbd","체크인한 사람 실명 목록");
  lkuSet("lkuMon","mon",d&&d.ok&&d.mon&&typeof dmonLine==="function"?dmonLine(d.mon):"");   /* 261023 무대 감시 한 줄(서버 판정 mon · 10초 · 서버가 모르면 비움) */
  lkuPrSync(); lkuPrSw();
  lkuSet("lkuBand","band",(lkuPr()?band("info",'<span><b>연습 체크인 보기</b> · 실제 체크인 아님</span>','<button class="btn sm" type="button" onclick="lkuPrT()">연습 보기 끄기</button>'):"")+errTop("draw")+errTop("dbd")+(d&&d.ok&&(String(d.att||"").toUpperCase()==="ON"||(b&&b.cond))?band("warn","행운권 참석조건 ON · 6 · 5 · 4등도 체크인한 사람만"):""));
  if(gt){ ["lkuT","lkuCk","lkuW"].forEach(function(id){ lkuSet(id,id,gt); }); }
  else { lkuWin(d); lkuTop(d,b); lkuCkPaint(d,b); }
  if(LKU.tab==="all") lkuRo();
  if(gb&&!b){ var lh=unknownSrv(S.data.dbd)?laterH("체크인한 사람 실명 목록 · 대상 명단"):gb; lkuSet("lkuIn","in",lh); lkuSet("lkuLst","ls",lh); lkuSet("lkuInC","inc",""); }
  else if(b){ lkuIn(b); lkuList(b); }
}
/* 명단 표 · 받은 것이 없으면 「명단 불러오기」 단추 · 받은 뒤는 lucky.js lkyTable(같은 데이터면 표를 다시 만들지 않음) · 여기서 서버를 부르지 않음 */
function lkuRo(){
  if(!el("lkuTb")||typeof LKY_U!=="object") return;
  var U=LKY_U;
  if(!U.rows){ lkuSet("lkuRt","rt",""); lkuSet("lkuRb","rb","");
    lkuSet("lkuTb","rtb",'<div class="lku-ld"><p class="cap">'+(U.err?"불러오지 못했습니다 · "+esc(U.err):"행운권 번호 · 이름 · 소속 · 장수 · 당첨 · 발급 시각 · 누르면 서버에서 한 번 받음 · 10초 갱신에서는 받지 않음")+'</p><button class="btn pri sm" type="button" onclick="lkyUGet()"'+(U.busy?" disabled":"")+'>'+(U.busy?"불러오는 중":"명단 불러오기")+'</button></div>');
    return; }
  if(LKU.sig.rtb){ LKU.sig.rtb=""; var tb=el("lkuTb"); if(tb) tb.innerHTML=""; }
  lkuSet("lkuRb","rb",'<button class="btn sm" type="button" id="lkuVw" onclick="lkyView(1)">사람 단위</button><button class="btn sm" type="button" onclick="lkyUGet()">표 새로 받기</button>');
  var rb=el("lkuRb"); if(rb){ var bs=rb.querySelectorAll("button"); if(bs[1]){ bs[1].disabled=!!U.busy; bs[1].textContent=U.busy?"받는 중":"표 새로 받기"; } }
  lkyTable(U, LKY_UI);
}
/* 숫자 줄 · 1 · 2 = 무대 숫자 대조(공 넣기 뒤 = 무대 고정 숫자를 같은 칸 아래 줄 · 다르면 주의 칸) · 3 = 17F 체크인 · 4 = 당첨 n · 10 */
function lkuTop(d, b){
  var pr=lkuPr(), p=b?{ n:b.n, balls:b.balls, inN:b.inN, inBalls:b.inBalls }:pr?null:dtPool(d), k=pr?null:d.lock, zero=b?num(b.zero):pr?0:num(d.zero), inA=b?num(b.inAll):pr?0:num(d["in"]), W=LKU.w;   /* 261025 연습 보기 = 무대 고정 대조 안 함 */
  var ma=function(v){ return n0(v[0])+'<em>명</em> '+n0(v[1])+'<em>장</em>'; };
  var cell=function(l,v,s,c){ return '<div class="lku-k'+(c?" "+c:"")+'"><span class="l">'+esc(l)+'</span><span class="v n">'+v+'</span><span class="s">'+s+'</span></div>'; };
  var fix=function(a,bb){ if(!k||!p) return null; var df=num(k[a])!==num(p[a])||num(k[bb])!==num(p[bb]); return { s:'무대 고정 '+n0(k[a])+'명 '+n0(k[bb])+'장'+(df?' · 지금과 다름':' · 같음'), c:df?"warn":"" }; };
  var f1=fix("n","balls"), f2=fix("inN","inBalls");
  var h=cell("6 · 5 · 4등 대상 · 행운권 전체",p?ma([p.n,p.balls]):"-",f1?esc(f1.s):"한 사람 한 번 · 장수만큼 뽑힐 확률",f1&&f1.c)+
    cell(pr?"3 · 2 · 1등 대상 · 연습 체크인":"3 · 2 · 1등 대상 · 17F 체크인",p&&p.inN!=null?ma([p.inN,p.inBalls]):"-",f2?esc(f2.s):pr?"연습 체크인한 행운권 보유자":"체크인한 행운권 보유자",f2&&f2.c)+
    cell(pr?"연습 체크인":"17F 체크인",n0(inA)+'<em>명</em>',zero?"행운권 없는 사람 "+n0(zero)+"명 포함":"&nbsp;")+
    cell("당첨",n0(W.wins)+'<em>/ '+LKU_SLOTS+'</em>',W.abs?"부재 "+n0(W.abs)+"명 · 다시 추첨":"무대 기록대로");
  lkuSet("lkuT","top",h);
}
/* 상태 줄 · 체크인 상태 + 오른쪽 끝 작은 단추(받는 중 = 체크인 마감 · 마감 = 다시 열기 · 공 넣기 뒤 = 다시 열기 흐림) */
function lkuCkPaint(d, b){
  var c=lkuCk(d,b), k=d.lock, t=c.t, s=c.s, act;
  if(lkuPr()){ var pn=b?num(b.inAll):0, on=!!(b&&b.on); c={ k:on?"open":"pre" };   /* 261025 연습 보기 · 마감 단추는 흐림 */
    lkuSet("lkuCk","ck",'<div class="lku-st '+c.k+'"><b>'+esc((on?"연습 받는 중 · ":"연습 체크인 꺼짐 · ")+n0(pn)+"명")+'</b><span class="cap">'+esc(on?"10/26 0시 전까지 · 실제 체크인과 따로 기록":"설정 「럭키드로우 연습 체크인」 꺼짐 · 받은 연습 기록은 그대로")+'</span></div>'+
      '<div class="lku-act"><button class="btn sm lku-cl" type="button" disabled title="연습 체크인 보기에서는 누를 수 없음">체크인 마감</button></div>');
    return; }
  if(c.k==="closed"&&k){ t="무대 고정"+(k.at?" · "+hm(String(k.at).slice(11,16)):""); s=c.t+" · "+c.s+" · 다시 열 수 없음"; }
  else if(c.k==="closed") s=c.s+" · 무대 공 넣기 전까지 다시 열 수 있음";
  if(c.k==="closed") act='<button class="btn sm" type="button" onclick="lkuClose(0)"'+(k?' disabled title="무대 공 넣기 뒤라 다시 열 수 없음"':' title="다시 열면 그 뒤 찍는 사람도 3 · 2 · 1등 통"')+'>다시 열기</button>';
  else act='<button class="btn sm lku-cl" type="button" onclick="lkuClose(1)"'+(c.k==="open"?' title="누르면 확인 창 · 마감 뒤 찍는 사람은 3 · 2 · 1등 통 밖"':' disabled title="체크인을 받는 동안 켜짐"')+'>체크인 마감</button>';
  var h='<div class="lku-st '+c.k+(k?" lock":"")+'"><b>'+esc(t)+'</b><span class="cap">'+esc(s)+'</span></div>'+
    '<div class="lku-act"><button type="button" class="lku-lnk" aria-expanded="'+LKU.qr+'" aria-controls="lkuQrB" onclick="lkuQrT()">'+(LKU.qr?"체크인 QR 닫기":"체크인 QR")+'</button>'+act+'</div>';
  lkuSet("lkuCk","ck",h);
  if(LKU.qr) lkuSet("lkuQrB","qr",typeof dtQrH==="function"?dtQrH(d):"");
}
function lkuClose(v){
  if(lkuPr()) return;   /* 261025 연습 보기에서는 마감 · 다시 열기 없음 */
  var d=S.data.draw||{};
  if(!v&&d.lock){ toast("무대 공 넣기 뒤에는 다시 열 수 없습니다",{ bad:1 }); return; }
  var n=lkuCk(d,lkuB()).n;
  confirmBox({ t:v?"체크인을 마감할까요?":"체크인을 다시 열까요?", who:"17F 입구 럭키드로우 체크인 · 지금 "+n0(n)+"명",
    sub:v?"마감하면 그 뒤 찍는 사람은 3 · 2 · 1등 통에 들어가지 않습니다":"다시 열면 그 뒤 찍는 사람도 3 · 2 · 1등 통에 들어갑니다", ok:v?"마감":"다시 열기", danger:!!v,
    run:function(){ return call("draw_cfg",{ closed:String(v) }); },
    done:function(r){ if(r&&r.code!=null) S.data.draw=r; reload(["draw"]); lkuFresh();
      toast(v?"체크인을 마감했습니다":"체크인을 다시 열었습니다",{ undo:function(){ var x0=S.data.draw||{}; if(v&&x0.lock){ toast("무대 공 넣기 뒤라 되돌리지 않습니다",{ bad:1 }); return; }
        call("draw_cfg",{ closed:String(v?0:1) }).then(function(x){ reload(["draw"]); lkuFresh(); toast(x&&x.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); } }); } });
}
/* 마감 · 다시 열기 뒤 사람 줄 · 마감 시각은 서버 캐시(5초)를 건너뛰고 한 번 */
function lkuFresh(){ call("draw_board",{ v:LKU.open?"all":"in", fresh:"1" }).then(function(r){ if(r&&r.ok){ S.data.dbd=r; S.at.dbd=Date.now(); S.err.dbd=null; } paint(); }); }
function lkuTk(c){ return c?n0(c)+"장":'<span class="lku-0">행운권 없음</span>'; }
function lkuNmH(r){ return '<td class="lku-nm">'+esc(r.nm||"-")+'</td><td class="lku-dp" title="'+esc(r.dp||"")+'">'+esc(r.dp||"-")+'</td>'; }
function lkuIn(b){
  var all=lkuRows(b).filter(function(r){ return r.at; }).sort(function(a,c){ return a.at<c.at?-1:a.at>c.at?1:0; });
  all.forEach(function(r,i){ r.k=i+1; });
  var rows=all.slice().reverse(), sh=rows.slice(0,LKU.limIn);
  lkuSet("lkuInC","inc",n0(all.length)); lkuSet("lkuInN","inn",(b.prac===1?"연습 체크인 · ":"")+"최근 체크인이 위 · 10초마다"+(b.real?"":" · 이름 일부 가림 · 사번 입장에서 실명"));
  var h=all.length?'<div class="lku-tw"><table class="tb lku-tb"><thead><tr><th class="n">순서</th><th>이름</th><th>부서</th><th class="n">시각</th><th class="n">행운권</th></tr></thead><tbody>'+
    sh.map(function(r){ return '<tr><td class="n">'+r.k+'</td>'+lkuNmH(r)+'<td class="n">'+esc(r.at)+'</td><td class="n">'+lkuTk(r.c)+'</td></tr>'; }).join("")+'</tbody></table></div>'+
    (rows.length>sh.length?'<div class="btns mt"><button class="btn sm" type="button" onclick="lkuMore(\'in\')">'+n0(rows.length-sh.length)+'명 더 보기</button></div>':''):emptyH(b.prac===1?"아직 연습 체크인한 사람이 없습니다":"아직 체크인한 사람이 없습니다");
  lkuSet("lkuIn","in",h);
}
/* 슈퍼관리자 아님 · 대상 명단 탭 = draw_board v all(이름 · 부서 · 장수 · 체크인 시각) */
function lkuList(b){
  if(!LKU.open||!el("lkuLst")) return;
  if(b.v!=="all"){ lkuSet("lkuLst","ls",skel()); return; }
  var q=LKU.q.replace(/\s/g,"").toLowerCase(), all=lkuRows(b).filter(function(r){ return r.c>0||r.at; });
  var f=all.filter(function(r){ return (!LKU.inOnly||r.at)&&(!q||(r.nm+r.dp).replace(/\s/g,"").toLowerCase().indexOf(q)>=0); });
  f.sort(function(a,c){ return a.nm<c.nm?-1:a.nm>c.nm?1:0; });
  var sh=f.slice(0,LKU.lim);
  lkuSet("lkuLsC","lsc",n0(f.length)+"명"+(f.length!==all.length?" · 전체 "+n0(all.length)+"명":"")+(b.real?"":" · 이름 일부 가림 · 사번 입장에서 실명"));
  var h=f.length?'<div class="lku-tw"><table class="tb lku-tb"><thead><tr><th>이름</th><th>부서</th><th class="n">행운권</th><th class="n">체크인</th></tr></thead><tbody>'+
    sh.map(function(r){ return '<tr>'+lkuNmH(r)+'<td class="n">'+lkuTk(r.c)+'</td><td class="n">'+(r.at?esc(r.at.slice(0,5)):'<span class="lku-0">-</span>')+'</td></tr>'; }).join("")+'</tbody></table></div>'+
    (f.length>sh.length?'<div class="btns mt"><button class="btn sm" type="button" onclick="lkuMore(\'ls\')">'+n0(f.length-sh.length)+'명 더 보기</button></div>':''):emptyH(q?"찾는 사람이 없습니다":"아직 대상이 없습니다");
  lkuSet("lkuLst","ls",h);
}
function lkuWin(d){
  var R=typeof dcRecs==="function"?dcRecs(d):(d.recs||[]), by={};
  R.forEach(function(r){ if(!r.live||(r.st!=="win"&&r.st!=="absent")) return; var k=dcRk(r); if(!k) return; (by[k]||(by[k]=[])).push(r); });
  var wins=0, abs=0, rows=[];
  LKU_RK.forEach(function(x){ var k=x[0], L=(by[k]||[]).slice().sort(function(a,c){ return String(a.t)<String(c.t)?-1:1; }), w=L.filter(function(r){ return r.st==="win"; }), a=L.filter(function(r){ return r.st==="absent"; });
    wins+=w.length; abs+=a.length;
    L.forEach(function(r){ rows.push(lkuWRow(k,r,r.st==="absent"?1:0)); });
    for(var i=w.length;i<x[1];i++) rows.push('<tr class="lku-yet"><td><b>'+k+'등</b></td><td colspan="4">아직 추첨 전</td></tr>'); });
  LKU.w={ wins:wins, abs:abs };
  lkuSet("lkuWC","wc",n0(wins)+"/"+LKU_SLOTS);
  lkuSet("lkuW","win",'<div class="lku-tw"><table class="tb lku-tb"><thead><tr><th>등수</th><th>이름</th><th>부서</th><th class="n">번호</th><th>확인</th></tr></thead><tbody>'+rows.join("")+'</tbody></table></div>');
}
function lkuWRow(k, r, ab){
  var tg="";
  if(ab) tg=tag("부재 · 다시 추첨","off");
  else if(r.fb) tg=tag("전체 통 이어 뽑기","off");
  else if(k<=3) tg=r.warn==="in"?tag("체크인 없음","warn"):tag("체크인","ok");
  return '<tr'+(ab?' class="lku-ab"':'')+'><td><b>'+k+'등</b></td>'+lkuNmH({ nm:r.name||r.nm, dp:r.dept })+'<td class="n">'+esc(r.no||"-")+'</td><td>'+tg+'</td></tr>';
}
/* 261025 고급 맨 아래 「연습 체크인 받기」(슈퍼관리자 · 10/26 16:40 전) · 값 = cfg_list · 바꾸기 = cfg_set(서버 L3 · 운영로그) · 확인 창 · 되돌리기 */
function lkuPrV(){ var c=S.data.cfgl, r=c&&c.ok&&(c.rows||[]).filter(function(x){ return x.k===LKU_PRAC_KEY; })[0]; return r?String(r.v||"").toUpperCase():null; }
function lkuPrSw(){
  var row=el("lkuPrS"); if(!row) return;
  row.style.display=lkuPracOk()?"":"none"; if(!lkuPracOk()) return;   /* 화면을 연 뒤 16:40 이 지나면 숨김 */
  var v=lkuPrV(), on=v==="ON";
  lkuSet("lkuPrS","prs",v==null?'<div class="t"><b>연습 체크인 받기</b><span>'+(S.data.cfgl&&S.data.cfgl.ok?"서버 갱신 뒤":"불러오는 중")+'</span></div>':
    '<div class="t"><b>연습 체크인 받기 · '+(on?"켬":"꺼짐")+'</b><span>켜면 10/26 0시 전까지 체크인 QR 을 연습 기록에만 남김 · 행운권 번호 · 추첨 통 · 실제 체크인 그대로</span></div><button class="btn sm" type="button" style="flex:none" onclick="lkuPrSet('+(on?0:1)+')">'+(on?"끄기":"켜기")+'</button>');
}
function lkuPrSet(on){
  var put=function(x){ return call("cfg_set",{ k:LKU_PRAC_KEY, v:x?"ON":"OFF" }); };
  confirmBox({ t:on?"연습 체크인을 켤까요?":"연습 체크인을 끌까요?", who:"17F 럭키드로우 체크인 QR · 10/26 0시 전까지",
    sub:on?"켜면 체크인 QR 을 찍은 기록이 연습 기록에만 남습니다 · 실제 체크인 · 추첨 통은 그대로":"끄면 체크인 QR 이 지금처럼 시간 전 안내로 돌아갑니다 · 받은 연습 기록은 그대로", ok:on?"켜기":"끄기", danger:false,
    run:function(){ return put(on); },
    done:function(){ reload(["cfgl","dbd"]); toast(on?"연습 체크인을 켰습니다":"연습 체크인을 껐습니다",{ undo:function(){ put(!on).then(function(x){ reload(["cfgl","dbd"]); toast(x&&x.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); } }); } });
}
