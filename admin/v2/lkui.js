/* AXF CONTROL v2 · 행운권 탭 첫 화면 「럭키드로우」 (261022 사용자 「누가 대상자 · 체크인을 언제 어떻게 정지 · 누가 체크인 · 누가 등수」)
 * 4칸 = 1 추첨 대상 · 2 체크인 · 3 체크인한 사람 · 4 당첨 결과 · 맨 아래 「고급 · 평소에는 열지 않음」 = 옛 칩(현황 · 명단 · 종이 대비 · 추첨 설정 · 당첨 기록)
 * 읽기 = draw_stats(숫자 · 마감 · 고정 · 당첨 기록 · 슈퍼관리자면 who 1 · 10초) · draw_board(사람 줄 · 10초 · 대상 명단 펼침 = v all)
 * 쓰기 = 체크인 마감 · 다시 열기(draw_cfg closed · 확인 창 · 되돌리기 · 무대 공 넣기 뒤 다시 열기 막음) 하나뿐
 * 추첨 진행은 무대 노트북(draw/) · 무대는 콘솔 원격 명령을 받지 않는다(261016 E1) · 원격 진행 칸은 추첨 설정 칩 맨 아래 접힘(stage.js) */
var LKU={ q:"", inOnly:false, open:false, qr:false, lim:200, limIn:100, sig:{} };
var LKU_RK=[[6,3],[5,2],[4,2],[3,1],[2,1],[1,1]];
var LKU_ADV=[["now","현황","발급 숫자 · 장수별 · 발급 흐름"],["list","명단","엑셀 · CSV · 번호만 · 종이 키트"],["paper","종이 대비","서버가 멈출 때 종이 추첨"],
  ["draw","추첨 설정","체크인 코드 · 시간 · 원격 진행"],["rec","당첨 기록","당첨 · 부재 · 취소 전체 표"]];
(function(){ if(SG_SUBS.some(function(x){ return x[0]==="lk"; })) return; SG_SUBS.unshift(["lk","럭키드로우"]); SG_SUBS.forEach(function(x){ if(x[0]==="draw") x[1]="추첨 설정"; }); })();
(function(){ var sc=SCREENS.stage; if(!sc||sc.lku) return; sc.lku=1; var n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return sgSub()==="lk"?lkuNeed():n0_.apply(this,arguments); };
  sc.mount=function(vb){ if(sgSub()!=="lk") return m0.apply(this,arguments); lkuMount(vb); };
  sc.paint=function(vb){ if(sgSub()!=="lk") return p0.apply(this,arguments); lkuPaint(); };
})();
function lkuNeed(){ return [{ k:"draw", a:"draw_stats", p:isTop()?{ who:"1" }:null, ttl:10000 },{ k:"dbd", a:"draw_board", p:{ v:LKU.open?"all":"in" }, ttl:10000 }]; }
function lkuMount(vb){
  el("phCap").textContent="17F Closing Speech 행운권 1~6등 · 추첨 진행은 무대 노트북";
  LKU.sig={};
  vb.innerHTML='<div class="chips" role="tablist"><button type="button" role="tab" aria-selected="true" class="chip on">럭키드로우</button><button type="button" class="chip" onclick="lkuAdvGo()">고급</button></div>'+
    '<div id="lkuBand"></div>'+
    '<div class="lku">'+
    '<section class="card"><h2>1. 추첨 대상</h2><div id="lkuT">'+skel()+'</div>'+
      '<details class="lku-det" id="lkuLs"'+(LKU.open?" open":"")+' ontoggle="lkuOpen(this.open)"><summary>대상 명단 보기</summary>'+
      '<div class="lku-bar"><input class="xg-q" id="lkuQ" type="search" placeholder="이름 · 부서 찾기" aria-label="대상 명단 찾기" value="'+esc(LKU.q)+'" oninput="lkuFind(this.value)">'+
      '<button type="button" class="chip'+(LKU.inOnly?" on":"")+'" id="lkuIo" aria-pressed="'+LKU.inOnly+'" onclick="lkuInOnly()">체크인한 사람만</button></div><div id="lkuLst"></div></details></section>'+
    '<section class="card"><h2>2. 체크인</h2><div id="lkuCk">'+skel()+'</div>'+
      '<details class="lku-det" id="lkuQr"'+(LKU.qr?" open":"")+' ontoggle="LKU.qr=this.open;LKU.sig.qr=\'\';lkuPaint()"><summary>체크인 QR 보기</summary><div id="lkuQrB"></div></details></section>'+
    '<section class="card"><h2>3. 체크인한 사람 <span class="cap" id="lkuInC"></span></h2><div id="lkuIn">'+skel()+'</div></section>'+
    '<section class="card"><h2>4. 당첨 결과 <span class="cap" id="lkuWC"></span></h2><div id="lkuW">'+skel()+'</div></section>'+
    '</div>'+
    '<details class="memo card mt" id="lkuAdv"><summary>고급 · 평소에는 열지 않음</summary><div class="mt4">'+LKU_ADV.map(function(x){ return '<div class="row"><div class="t"><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></div><button class="btn sm" type="button" style="flex:none" onclick="go(\'stage\',\''+x[0]+'\')">열기</button></div>'; }).join("")+'</div></details>';
}
function lkuAdvGo(){ var a=el("lkuAdv"); if(!a) return; a.open=true; try{ a.scrollIntoView({ behavior:"smooth", block:"start" }); }catch(e){ a.scrollIntoView(); } }
function lkuOpen(v){ LKU.open=!!v; LKU.sig.ls=""; if(v) reload(["dbd"]); else lkuPaint(); }
function lkuFind(v){ LKU.q=String(v||""); LKU.lim=200; LKU.sig.ls=""; lkuPaint(); }
function lkuInOnly(){ LKU.inOnly=!LKU.inOnly; LKU.lim=200; LKU.sig.ls=""; var b=el("lkuIo"); if(b){ b.className="chip"+(LKU.inOnly?" on":""); b.setAttribute("aria-pressed",String(LKU.inOnly)); } lkuPaint(); }
function lkuMore(k){ if(k==="in") LKU.limIn+=200; else LKU.lim+=400; LKU.sig[k]=""; lkuPaint(); }
function lkuSet(id, k, h){ if(LKU.sig[k]===h) return; LKU.sig[k]=h; var x=el(id); if(x) x.innerHTML=h; }
function lkuB(){ var b=S.data.dbd; return b&&b.ok&&Array.isArray(b.rows)?b:null; }
function lkuRows(b){ var dp=b.dps||[]; return (b.rows||[]).map(function(r){ return { nm:String(r[0]||""), dp:String(dp[r[1]]||""), c:num(r[2]), at:String(r[3]||"") }; }); }
function lkuMd(day){ var m=String(day||"").match(/^\d{4}-(\d{2})-(\d{2})$/); return m?(+m[1])+"/"+(+m[2]):""; }
function lkuToday(){ var t=srvNow(); return t.getFullYear()+"-"+("0"+(t.getMonth()+1)).slice(-2)+"-"+("0"+t.getDate()).slice(-2); }
/* 체크인 상태 · pre 시작 전 · open 받는 중 · after 날짜 지남 · closed 마감 */
function lkuCk(d, b){
  var closed=d&&"closed" in d?d.closed:b.closed, n=b?num(b.inAll):num(d["in"]), day=(b?b.day:d.day)||"", st=(b?b.start:hm(String(d.win||"").split("-")[0]))||"16:40", on=b?!!b.winOn:!!d.winOn;
  if(closed) return { k:"closed", t:"마감"+(b&&b.closed&&b.closedAt?" · "+hm(String(b.closedAt).slice(11,16)):""), s:"체크인 "+n0(n)+"명에서 멈춤", n:n };
  var td=lkuToday(), t=srvNow(), m=t.getHours()*60+t.getMinutes();
  if(on&&day&&(td<day||(td===day&&m<mins(st)))) return { k:"pre", t:lkuMd(day)+" "+st+"부터 받음", s:"끝 시각 없음 · 17:13쯤 「체크인 마감」", n:n };
  if(on&&day&&td>day) return { k:"after", t:"받지 않음", s:"체크인 날짜 "+lkuMd(day), n:n };
  return { k:"open", t:"받는 중 · "+n0(n)+"명", s:on?"시작 "+st+" · 끝 시각 없음 · 17:13쯤 「체크인 마감」":"시간 검사 꺼짐 · 지금도 받음", n:n };
}
function lkuPaint(){
  if(!el("lkuT")) return;
  var gt=dataGate("draw","행운권 추첨"), d=S.data.draw, b=lkuB(), gb=dataGate("dbd","체크인한 사람 실명 목록");
  lkuSet("lkuBand","band",errTop("draw")+errTop("dbd")+(d&&d.ok&&(String(d.att||"").toUpperCase()==="ON"||(b&&b.cond))?band("warn","행운권 참석조건 ON · 6 · 5 · 4등도 체크인한 사람만"):""));
  if(gt){ ["lkuT","lkuCk","lkuW"].forEach(function(id){ lkuSet(id,id,gt); }); }
  else { lkuTop(d,b); lkuCkPaint(d,b); lkuWin(d); }
  if(gb&&!b){ var lh=unknownSrv(S.data.dbd)?laterH("체크인한 사람 실명 목록 · 대상 명단"):gb; lkuSet("lkuIn","in",lh); lkuSet("lkuLst","ls",lh); lkuSet("lkuInC","inc",""); }
  else if(b){ lkuIn(b); lkuList(b); }
}
function lkuTop(d, b){
  var p=b?{ n:b.n, balls:b.balls, inN:b.inN, inBalls:b.inBalls }:dtPool(d), k=d.lock;
  var big=function(l,v){ return '<div class="lku-big"><span class="l">'+esc(l)+'</span><span class="v n">'+(v?n0(v[0])+'<em>명</em> '+n0(v[1])+'<em>장</em>':'-')+'</span></div>'; };
  var h='<div class="grid g2 s1">'+big("6 · 5 · 4등 대상 · 행운권 전체",p?[p.n,p.balls]:null)+big("3 · 2 · 1등 대상 · 17F 체크인",p&&p.inN!=null?[p.inN,p.inBalls]:null)+'</div>'+
    '<p class="cap mt4">한 사람 한 번 · 행운권 장수만큼 뽑힐 확률'+(k?' · 무대 고정 '+esc(dtLockTxt(k)):'')+(b&&!b.real?' · 이름 일부 가림 · 사번 입장에서 실명':'')+'</p>';
  lkuSet("lkuT","top",h);
}
function lkuCkPaint(d, b){
  var c=lkuCk(d,b), k=d.lock, h='<div class="lku-st '+c.k+'"><b>'+esc(c.t)+'</b><span class="cap">'+esc(c.s)+'</span></div>';
  if(c.k==="closed") h+='<div class="btns mt"><button class="btn sm" type="button" style="flex:none" onclick="lkuClose(0)"'+(k?" disabled":"")+'>다시 열기</button></div><p class="cap mt4">'+(k?"무대 공 넣기 뒤라 다시 열 수 없음":"무대 공 넣기 전까지 다시 열 수 있음")+'</p>';
  else h+='<button class="btn dng big mt lku-go" type="button" onclick="lkuClose(1)"'+(c.k==="open"?"":" disabled")+'>체크인 마감</button><p class="cap mt4">'+(c.k==="open"?"누르면 확인 창 · 마감 뒤 찍는 사람은 3 · 2 · 1등 통 밖":"체크인을 받는 동안 켜짐")+'</p>';
  lkuSet("lkuCk","ck",h);
  if(LKU.qr) lkuSet("lkuQrB","qr",typeof dtQrH==="function"?dtQrH(d):"");
}
function lkuClose(v){
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
function lkuNmH(r){ return '<b>'+esc(r.nm||"-")+'</b><span class="lku-dp">'+esc(r.dp||"-")+'</span>'; }
function lkuIn(b){
  var all=lkuRows(b).filter(function(r){ return r.at; }).sort(function(a,c){ return a.at<c.at?-1:a.at>c.at?1:0; });
  all.forEach(function(r,i){ r.k=i+1; });
  var tk=all.filter(function(r){ return r.c; }), rows=all.slice().reverse(), sh=rows.slice(0,LKU.limIn);
  lkuSet("lkuInC","inc",n0(all.length)+"명 · 행운권 있음 "+n0(tk.length)+"명");
  var h=all.length?'<div class="lku-tw"><table class="tb lku-tb"><thead><tr><th class="n">순서</th><th>이름 · 부서</th><th class="n">시각</th><th class="n">행운권</th></tr></thead><tbody>'+
    sh.map(function(r){ return '<tr><td class="n">'+r.k+'</td><td class="lku-who">'+lkuNmH(r)+'</td><td class="n">'+esc(r.at)+'</td><td class="n">'+lkuTk(r.c)+'</td></tr>'; }).join("")+'</tbody></table></div>'+
    (rows.length>sh.length?'<div class="btns mt"><button class="btn sm" type="button" onclick="lkuMore(\'in\')">'+n0(rows.length-sh.length)+'명 더 보기</button></div>':'')+'<p class="cap mt4">최근 체크인이 위 · 10초마다</p>':emptyH("아직 체크인한 사람이 없습니다");
  lkuSet("lkuIn","in",h);
}
function lkuList(b){
  if(!LKU.open) return;
  if(b.v!=="all"){ lkuSet("lkuLst","ls",skel()); return; }
  var q=LKU.q.replace(/\s/g,"").toLowerCase(), all=lkuRows(b).filter(function(r){ return r.c>0||r.at; });
  var f=all.filter(function(r){ return (!LKU.inOnly||r.at)&&(!q||(r.nm+r.dp).replace(/\s/g,"").toLowerCase().indexOf(q)>=0); });
  f.sort(function(a,c){ return a.nm<c.nm?-1:a.nm>c.nm?1:0; });
  var sh=f.slice(0,LKU.lim);
  var h='<p class="cap mt">'+n0(f.length)+'명'+(f.length!==all.length?' · 전체 '+n0(all.length)+'명':'')+'</p>'+(f.length?'<div class="lku-tw"><table class="tb lku-tb"><thead><tr><th>이름 · 부서</th><th class="n">행운권</th><th class="n">체크인</th></tr></thead><tbody>'+
    sh.map(function(r){ return '<tr><td class="lku-who">'+lkuNmH(r)+'</td><td class="n">'+lkuTk(r.c)+'</td><td class="n">'+(r.at?esc(r.at.slice(0,5)):'<span class="lku-0">-</span>')+'</td></tr>'; }).join("")+'</tbody></table></div>'+
    (f.length>sh.length?'<div class="btns mt"><button class="btn sm" type="button" onclick="lkuMore(\'ls\')">'+n0(f.length-sh.length)+'명 더 보기</button></div>':''):emptyH(q?"찾는 사람이 없습니다":"아직 대상이 없습니다"));
  lkuSet("lkuLst","ls",h);
}
function lkuWin(d){
  var R=typeof dcRecs==="function"?dcRecs(d):(d.recs||[]), by={};
  R.forEach(function(r){ if(!r.live||(r.st!=="win"&&r.st!=="absent")) return; var k=dcRk(r); if(!k) return; (by[k]||(by[k]=[])).push(r); });
  var wins=0, abs=0, rows=[];
  LKU_RK.forEach(function(x){ var k=x[0], L=(by[k]||[]).slice().sort(function(a,c){ return String(a.t)<String(c.t)?-1:1; }), w=L.filter(function(r){ return r.st==="win"; }), a=L.filter(function(r){ return r.st==="absent"; });
    wins+=w.length; abs+=a.length;
    L.forEach(function(r){ rows.push(lkuWRow(k,r,r.st==="absent"?1:0)); });
    for(var i=w.length;i<x[1];i++) rows.push('<tr class="lku-yet"><td><b>'+k+'등</b></td><td colspan="3">아직 추첨 전</td></tr>'); });
  lkuSet("lkuWC","wc",wins||abs?"당첨 "+n0(wins)+"명"+(abs?" · 부재 "+n0(abs)+"명":"")+" · 무대 기록대로":"무대 기록대로");
  lkuSet("lkuW","win",'<div class="lku-tw all"><table class="tb lku-tb"><thead><tr><th>등수</th><th>이름 · 부서</th><th class="n">번호</th><th>확인</th></tr></thead><tbody>'+rows.join("")+'</tbody></table></div>');
}
function lkuWRow(k, r, ab){
  var tg="";
  if(ab) tg=tag("부재 · 다시 추첨","off");
  else if(r.fb) tg=tag("전체 통 이어 뽑기","off");
  else if(k<=3) tg=r.warn==="in"?tag("체크인 없음","warn"):tag("체크인","ok");
  return '<tr'+(ab?' class="lku-ab"':'')+'><td><b>'+k+'등</b></td><td class="lku-who"><b>'+esc(r.name||r.nm||"-")+'</b><span class="lku-dp">'+esc(r.dept||"-")+'</span></td><td class="n">'+esc(r.no||"-")+'</td><td>'+tg+'</td></tr>';
}
