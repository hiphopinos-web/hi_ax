/* AXF CONTROL v2 · 체크인 탭 (261020 사용자 「체크인존 기능을 한곳에 · 체크인 여부 · 고유번호를 한 번에 · 오류도 직관적으로 · 선착순 참여상도 묶어 · 미팅 탭처럼 체크인존 스태프가 씀」)
 * 쓰는 사람 = 콘솔 입장 명단에 든 사람 누구나(미팅 탭과 같음) · 슈퍼관리자 칸(빈 번호 채우기 · 번호 매기기 · 선착순 명부 내려받기)은 슈퍼관리자에게만
 * 한 사람 처리 = 찾기(이름 · 사번 · 세션 번호 C-2 · 신청번호 K-001 · 앱 내 QR 글자 · USB QR 리더 · 카메라) → 카드 → 단추 한 번
 * 서버 읽기 = ckin_get(q 찾기 · emp 카드 · list=1 명단 · 현황) · 쓰기는 기존 액션 그대로
 *   체크인 + 참여상 = ck_gate(스태프 폰 「체크인존」과 같은 액션) · 체크인만 = ck_gate only=kit · 참여상만 = fcfs_give · 되돌리기 = fcfs_undo(참여상) · 자격 취소 = fcfs_void
 * 261021 사용자 「1F 체크인존은 재고 확인 역할 없음(기념품은 10F 자리에서) · 사이즈별 남은 수 걷음 · 체크인 대상 / 체크인 여부 · 사전신청자 명단 / 선착순 명단」
 *   체크인 대상 = 10F 사전 신청자(kind ten)만 · 옷 · 키트 · 사이즈 · 재고 숫자 · 칸 · 단추(옷만 지급 · 옷 되돌리기 · 사이즈 교환)는 이 화면에서 걷음 · 옷 오류 코드(CKI_KITISS)는 보이지 않게
 *   QR 로 찾은 사람은 그 QR 글자를 같이 보낸다(스태프 폰과 같은 서명 확인 · 스캔 기록) · 지난 QR 이면 QR 없이 한 번 더
 * 선착순 참여상 한 줄(card.fh) = 서버 fcfsHead_ 문구 그대로(스태프 폰과 같은 판정 · 같은 문구) · 카드 맨 위 크게
 * 오류(iss) = 서버 코드 → CKI_ISS(색 · 이름 · 할 일 한 줄) · 카드와 표가 같은 표 · 신청번호(K-001)는 화면에 쓰지 않는다(사용자 261020 · 찾기 입력은 받음) */
var CKI={ card:null, hits:null, by:"", q:"", qr:"", qrEmp:"", busy:0, msg:null, err:"", view:lsGet("axf_v2_ckin_v","kit")==="fx"?"fx":"kit", gk:null, gf:null, supAt:0, cam:null };
var CKI_SZ={ SS:"A", L:"B", "2XL":"C", "3XL":"D" };
var CKI_SES={ fld:"A", ta:"B", tb:"C", aws:"D", ms1:"E 1회차", ms2:"E 2회차" };
var CKI_KIND={ ten:"사전 신청자", lng:"라운지 사전", staff:"스태프", none:"일반" };
/* 코드 → [색 bad | warn | info | off, 이름, 할 일 한 줄] · f 로 시작 = 선착순 참여상(카드에서는 맨 위 한 줄이 대신 말한다) */
var CKI_ISS={
  nolist:["warn","옷 명단에 없음","옷 · 키트는 주지 않음 · 참여상만 확인"],
  nono:["warn","세션 번호 없음","슈퍼관리자가 「빈 번호 채우기」 · 지급은 그대로 함"],
  nodup:["bad","세션 번호 겹침","같은 번호가 두 사람 · 이름 · 사번으로 확인 뒤 지급 · 슈퍼관리자에게 알림"],
  nosz:["warn","사이즈 미선택","사이즈를 물어 그 사이즈로 지급 · 슈퍼관리자가 한 사람 카드에서 사이즈 넣기"],
  "short":["bad","그 사이즈 남은 0","다른 사이즈로 지급 뒤 「사이즈 교환」 기록"],
  hum:["info","옷 대신 가습기","라운지 사전 등록 순 초과 · 지급하면 가습기 대체로 기록"],
  test:["warn","테스트 사번","실제 물건을 주지 않음"],
  noacct:["info","앱 미가입","스탬프 0개 · 체크인은 그대로"],
  fnoelig:["off","참여상 완주 전","스탬프 6개 전 · 주지 않음"],
  fvoid:["bad","참여상 자격 취소","주지 않음 · 운영 본부 확인"],
  ffull:["warn","참여상 대기마감","선착순 수량을 넘음 · 주지 않음"],
  fearly:["warn","참여상 지급 시작 전","시작 시각부터 지급"],
  flate:["bad","참여상 지급 마감","주지 않음 · 발송 대상"],
  fout:["bad","참여상 모두 나감","주지 않음"],
  foff:["off","참여상 꺼짐","지급하지 않음"]
};
var CKI_KITW=["nodup","test"];   /* 체크인할 때 확인 창을 거치는 오류 */
var CKI_KITISS=["nolist","nosz","short","hum"];   /* 261021 옷 · 키트 오류 · 체크인존 화면에 보이지 않음 */
function ckiIssOk(k, skipF){ return !!CKI_ISS[k]&&CKI_KITISS.indexOf(k)<0&&!(skipF&&/^f/.test(k)); }
function ckiTgt(r){ return r.kind==="ten"; }   /* 체크인 대상 = 10F 사전 신청자 */
function ckiSz(z){ return z?(CKI_SZ[z]?CKI_SZ[z]+" ("+z+")":z):""; }
function ckiSes(r){ return r.kind==="ten"?(CKI_SES[r.sid]||(r.no?r.no.charAt(0):"")):r.kind==="staff"?"스태프":r.kind==="lng"?"라운지 사전":""; }
function ckiTone(k){ return (CKI_ISS[k]||["off"])[0]; }
function ckiWorst(iss){ var t=(iss||[]).filter(function(k){ return CKI_KITISS.indexOf(k)<0; }).map(ckiTone); return t.indexOf("bad")>=0?"bad":t.indexOf("warn")>=0?"warn":""; }
function ckiIssTags(iss, skipF){ return (iss||[]).filter(function(k){ return ckiIssOk(k, skipF); }).map(function(k){ var x=CKI_ISS[k]; return tag(x[1],x[0]==="info"?"":x[0]); }).join(" "); }
function ckiRows(){ var d=S.data.ckl; return d&&d.ok&&Array.isArray(d.rows)?d.rows:null; }
function ckiSum(){ var d=S.data.ckl; return d&&d.ok?d.sum||null:null; }
function ckiPh(ph, f){ f=f||{}; var day=String(f.day||"").slice(5).replace("-","/"); return ph==="before"?["warn","지급 시작 전",(day?day+" ":"")+(f.start||"10:30")+"부터"]:ph==="closed"?["bad","지급 마감",(f.cut||"17:00")+" 마감 · 못 받은 사람 발송"]:ph==="off"?["off","선착순 꺼짐","지급하지 않음"]:["ok","지급 중",(f.start||"10:30")+" ~ "+(f.cut||"17:00")]; }

SCREENS.ckin={
  title:"체크인", desc:"1F 주차장 체크인존 · 사전 신청자 체크인 · 선착순 참여상 · 찾기 → 카드 → 처리",
  need:function(){ var a=[{ k:"ckl", a:"ckin_get", p:{ list:"1" }, ttl:30000 }]; if(typeof APM_NEED!=="undefined") a.push(APM_NEED); if(ckiTop()) a.push({ k:"cno", a:"ck_no_state", ttl:60000 }); return a; },
  mount:function(vb){
    vb.innerHTML='<div class="cki" id="ckiR">'+
      '<div class="card cki-find"><div class="cki-fbar">'+
        '<input class="cki-q" id="ckiQ" type="search" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="search" placeholder="이름 · 사번 · 세션 번호(C-2) · QR" aria-label="찾기 · 이름 · 사번 · 세션 번호 · QR" value="'+esc(CKI.q)+'" onkeydown="if(event.key===\'Enter\'){ event.preventDefault(); ckiGo(this.value); }">'+
        '<button class="btn pri cki-go" type="button" onclick="ckiGo(el(\'ckiQ\').value)">찾기</button>'+
        '<button class="btn cki-camb" type="button" onclick="ckiCam()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 16h3"/></svg>QR 찍기</button>'+
      '</div><div id="ckiHit"></div></div>'+
      '<div id="ckiCard"></div>'+
      '<div class="grid g4 cki-k mt" id="ckiK"></div>'+
      '<div class="card mt"><div class="chips" id="ckiV" role="tablist" aria-label="명단"></div><div id="ckiL"></div></div>'+
      '<div id="ckiSup"></div></div>';
    setTimeout(function(){ var q=el("ckiQ"); if(q&&!CKI.card&&document.activeElement===document.body) q.focus(); },60);
  },
  paint:function(){
    if(CKI.supAt&&S.at.cno>CKI.supAt){ CKI.supAt=0; reload(["ckl"]); }
    ckiHitPaint(); ckiCardPaint(); ckiNowPaint(); ckiListPaint(); ckiSupPaint();
  }
};
function ckiTop(){ return typeof adrTop==="function"?adrTop():!!(S.me&&S.me.top); }

/* ── 1. 찾기 ── */
function ckiGo(v){
  v=String(v==null?"":v).trim(); if(!v){ el("ckiQ")&&el("ckiQ").focus(); return; }
  CKI.q=v; CKI.err=""; CKI.msg=null; CKI.hits=null; CKI.card=null; CKI.busy=1; ckiHitPaint(); ckiCardPaint();
  var isQr=/^AXU:/i.test(v);
  call("ckin_get",{ q:v }).then(function(r){
    CKI.busy=0;
    if(!r||!r.ok){ CKI.err=unknownSrv(r)?"이 서버는 아직 체크인 탭을 모릅니다 · 서버 갱신 뒤":"찾지 못했습니다 · "+why(r); ckiHitPaint(); ckiCardPaint(); return; }
    CKI.by=r.by||""; CKI.hits=r.hits||[]; CKI.more=r.more?1:0;
    if(r.card){ CKI.card=r.card; CKI.hits=null; CKI.qr=isQr&&r.by==="qr"?v:""; CKI.qrEmp=CKI.qr?r.card.emp:""; ckiPatch(r.card); }
    else if(!CKI.hits.length) CKI.err=(isQr?"이 QR 의 사번을 찾지 못했습니다":"찾지 못했습니다")+" · 이름 · 사번 · 세션 번호를 다시 넣습니다";
    ckiHitPaint(); ckiCardPaint(); ckiListPaint();
    var q=el("ckiQ"); if(q){ q.value=v; if(r.card){ q.select(); } }
  });
}
function ckiOpen(emp, keepMsg){
  emp=normE(emp); if(!emp) return; if(!keepMsg) CKI.msg=null;
  if(CKI.qrEmp!==emp){ CKI.qr=""; CKI.qrEmp=""; }
  CKI.hits=null; CKI.err=""; if(!CKI.card||CKI.card.emp!==emp){ CKI.card=null; CKI.busy=1; } ckiHitPaint(); ckiCardPaint();
  return call("ckin_get",{ emp:emp }).then(function(r){
    CKI.busy=0;
    if(r&&r.ok&&r.card){ CKI.card=r.card; ckiPatch(r.card); }
    else CKI.err="카드를 받지 못했습니다 · "+why(r);
    ckiHitPaint(); ckiCardPaint(); ckiNowPaint(); ckiListPaint();
  });
}
function ckiRowGo(emp){ ckiOpen(emp); var m=el("main"); if(m) m.scrollTop=0; }
function ckiHitPaint(){
  var b=el("ckiHit"); if(!b) return;
  if(CKI.err){ b.innerHTML=band("warn",esc(CKI.err)); return; }
  if(!CKI.hits||!CKI.hits.length){ b.innerHTML=CKI.busy&&!CKI.card?'<p class="cap mt4">찾는 중</p>':""; return; }
  b.innerHTML='<p class="cap mt4">'+n0(CKI.hits.length)+(CKI.more?"명 넘음 · 앞 "+n0(CKI.hits.length)+"명":"명")+' · 누르면 카드</p><div class="cki-hits">'+CKI.hits.map(function(h){
    return '<button type="button" class="cki-hit" onclick="ckiOpen(\''+jq(h.emp)+'\')"><b>'+esc(h.name||"-")+'</b><span>'+esc(h.emp)+(h.dept?" · "+esc(dptU(h.dept)):"")+'</span><span class="cki-hno">'+esc(h.no||CKI_KIND[h.kind]||"")+'</span>'+(h.iss?'<i class="cki-dot" aria-label="확인할 것 있음"></i>':'')+'</button>'; }).join("")+'</div>';
}

/* ── 2. 한 사람 카드 ── */
function ckiKitDue(c){ return ckiTgt(c)&&!c.ck; }   /* 261021 = 체크인할 사람(사전 신청자 · 체크인 전) */
function ckiFxDue(c){ return !!(c.fh&&c.fh.k==="due"); }
function ckiCardPaint(){
  var b=el("ckiCard"); if(!b) return;
  var c=CKI.card;
  if(!c){ b.innerHTML=CKI.busy?'<div class="card cki-card mt">'+skel()+'</div>':""; return; }
  var fh=c.fh||{}, kd=ckiKitDue(c), fd=ckiFxDue(c), both=kd&&fd, fx=c.fx||{};
  var head='<div class="cki-fh t-'+esc(fh.tone||"off")+'" role="status"><b>'+esc(fh.t||"선착순 참여상 · 확인 못 함")+'</b>'+(fh.s?'<span>'+esc(fh.s)+'</span>':'')+'</div>';
  var msg=CKI.msg?'<div class="cki-msg t-'+esc(CKI.msg.c)+'" role="alert"><b>'+esc(CKI.msg.t)+'</b>'+(CKI.msg.s?'<span>'+esc(CKI.msg.s)+'</span>':'')+'</div>':'';
  var ses=ckiSes(c);
  var who='<div class="cki-who"><div class="cki-nm"><h2>'+esc(c.name||"이름 없음")+'</h2><span class="cap">'+esc(c.emp)+(c.dept?" · "+esc(c.dept):"")+'</span>'+
    '<div class="cki-tags">'+tag(CKI_KIND[c.kind]||"-",c.kind==="none"?"off":"")+(c.stf?" "+tag("스태프 겸","off"):"")+" "+tag("스탬프 "+n0(c.n)+"/6",c.n>=6?"ok":"off")+" "+(c.ck?tag("체크인 "+fmtD(c.ck),"ok"):tag("체크인 전","off"))+'</div></div>'+
    '<div class="cki-no'+(c.no?"":" none")+'"><span class="l">세션 번호</span><b>'+esc(c.no||"없음")+'</b><span class="s">'+esc(ses||"번호 없음")+'</span></div></div>';
  var iss=(c.iss||[]).filter(function(k){ return ckiIssOk(k, true); });
  var issH=iss.length?'<ul class="cki-iss">'+iss.map(function(k){ var x=CKI_ISS[k]; return '<li class="t-'+x[0]+'"><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></li>'; }).join("")+'</ul>':'';
  /* 체크인 칸(261021 옷 · 키트 · 사이즈 칸 걷음) */
  var kSt, kBig, kBtn="";
  if(c.ck){ kBig='<b class="cki-big">'+esc(hm(c.ck)||"-")+'</b>'; kSt=tag("체크인 함","ok"); }
  else if(ckiTgt(c)){ kBig='<b class="cki-big off">전</b>'; kSt=tag("체크인 전",""); }
  else { kBig='<b class="cki-big off">-</b>'; kSt=tag("체크인 명단 밖","off"); }
  if(both) kBtn='<button class="btn sm" type="button" onclick="ckiGive(\'kit\')"'+(CKI.busy?' disabled':'')+'>체크인만</button>';
  var kitB='<div class="cki-blk"><div class="cki-bh">체크인</div><div class="cki-bv">'+kBig+'</div><div class="cki-bst">'+kSt+'</div>'+(kBtn?'<div class="cki-bb">'+kBtn+'</div>':'')+'</div>';
  /* 참여상 칸 */
  var fBig=fx.rk?'<b class="cki-big">'+n0(fx.rk)+'<small>번째</small></b>':'<b class="cki-big off">'+n0(c.n||0)+'<small>/6</small></b>';
  var fSt=fx.st==="got"?tag("받음 "+fmtD(fx.gotAt),"ok"):fd?tag("줄 것",""):tag(fh.k==="none"?"완주 전":fh.k==="full"?"대기마감":fh.k==="void"?"자격 취소":fh.k==="early"?"시작 전":fh.k==="late"?"마감":fh.k==="test"?"테스트":fh.k==="out"?"모두 나감":"주지 않음",fh.tone==="bad"?"bad":fh.tone==="warn"?"warn":"off");
  var fBtn="";
  if(both) fBtn+='<button class="btn sm" type="button" onclick="ckiGive(\'fx\')"'+(CKI.busy?' disabled':'')+'>참여상만 지급</button>';
  if(fx.st==="got") fBtn+='<button class="btn sm" type="button" onclick="ckiUndoFx()"'+(CKI.busy?' disabled':'')+'>되돌리기</button>';
  if(fx.rk&&fx.st!=="got"&&fx.st!=="void") fBtn+='<button class="btn sm dng" type="button" onclick="ckiVoid()"'+(CKI.busy?' disabled':'')+'>자격 취소</button>';
  var fxB='<div class="cki-blk"><div class="cki-bh">선착순 참여상</div><div class="cki-bv">'+fBig+'</div><div class="cki-bst">'+fSt+'</div>'+(fBtn?'<div class="cki-bb">'+fBtn+'</div>':'')+'</div>';
  /* 큰 단추 */
  var lbl=both?"체크인 + 참여상 지급":kd?"체크인":fd?"선착순 참여상 지급":"";
  var mode=both?"both":kd?"kit":fd?"fx":"";
  var big=mode?'<button class="btn pri big cki-give" type="button" onclick="ckiGive(\''+mode+'\')"'+(CKI.busy?' aria-disabled="true"':'')+'>'+esc(CKI.busy?"처리 중":lbl)+'</button>':
    '<button class="btn big cki-give" type="button" disabled>'+esc(fx.st==="got"?"참여상 이미 받음 · 다시 주지 않음":c.ck?"체크인 끝 · 처리할 것 없음":"처리할 것 없음")+'</button>';
  b.innerHTML='<div class="card cki-card mt'+(ckiWorst(c.iss)==="bad"?" bad":"")+'">'+head+msg+who+issH+'<div class="cki-blks">'+kitB+fxB+'</div>'+big+
    '<div class="cki-foot"><button class="btn sm" type="button" onclick="pcOpen(\''+jq(c.emp)+'\')">한 사람 카드</button><button class="btn sm" type="button" onclick="ckiNext()">다음 사람</button><span class="cap">'+(CKI.qr?"QR 로 찾음 · ":"")+'카드 '+esc(hm(S.srvT)||"")+'</span></div></div>';
}
function ckiNext(){ CKI.card=null; CKI.msg=null; CKI.hits=null; CKI.err=""; CKI.qr=""; CKI.qrEmp=""; ckiHitPaint(); ckiCardPaint(); var q=el("ckiQ"); if(q){ q.value=""; q.focus(); } }

/* ── 3. 지급 · 되돌리기 ── */
function ckiCall(a, p){
  var c=CKI.card, qr=c&&CKI.qr&&CKI.qrEmp===c.emp?CKI.qr:"";
  if(qr) p.qr=qr;
  return call(a,p).then(function(r){
    if(qr&&r&&r.ok===false&&(r.reason==="qrexp"||r.reason==="qrold")){ CKI.qr=""; CKI.qrEmp=""; delete p.qr; return call(a,p); }   /* 지난 QR = 콘솔 입장으로 한 번 더(누가 처리했는지는 남는다) */
    return r;
  });
}
function ckiGiveCall(mode, c){ return mode==="fx"?ckiCall("fcfs_give",{ emp:c.emp }):ckiCall("ck_gate",mode==="kit"?{ emp:c.emp, only:"kit" }:{ emp:c.emp }); }
function ckiGive(mode){
  var c=CKI.card; if(!c||CKI.busy) return;
  var w=mode==="fx"?(c.iss.indexOf("test")>=0?["test"]:[]):c.iss.filter(function(k){ return CKI_KITW.indexOf(k)>=0; });
  if(w.length){
    confirmBox({ t:"확인하고 처리할까요?", who:(c.name||"")+" · "+c.emp+(c.no?" · "+c.no:""), sub:w.map(function(k){ return CKI_ISS[k][1]; }).join(" · "),
      body:'<ul class="cki-iss">'+w.map(function(k){ var x=CKI_ISS[k]; return '<li class="t-'+x[0]+'"><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></li>'; }).join("")+'</ul>',
      ok:"처리", run:function(){ return ckiGiveCall(mode, c); }, fail:function(r){ return ckiFailTx(r); }, done:function(r){ ckiGiveDone(mode, c, r); } });
    return;
  }
  CKI.busy=1; ckiCardPaint();
  ckiGiveCall(mode, c).then(function(r){ CKI.busy=0; if(r&&r.ok) ckiGiveDone(mode, c, r); else { CKI.msg={ c:"bad", t:"처리하지 못했습니다", s:ckiFailTx(r) }; ckiCardPaint(); } });
}
function ckiFailTx(r){ r=r||{}; return r.reason==="qr"?"확인할 수 없는 QR · 참가자 폰에서 내 QR 을 다시 열어 찍음":why(r); }
var CKI_FXR={ noelig:"스탬프 6개 전", norank:"스탬프 6개 전", full:"선착순 마감", void:"자격 취소", notyet:"지급 시작 전", early:"지급 시작 전", closed:"지급 마감", late:"지급 마감", off:"지급하지 않음", test:"테스트 사번", out:"모두 나감" };
function ckiGiveDone(mode, c, r){
  var got=[], dup=[], no=[];
  if(mode==="fx"){
    if(r.give==="new") got.push("참여상"+(r.rk?" "+r.rk+"번째":"")); else if(r.give==="dup") dup.push("참여상 이미 받음"+(r.at?" · "+r.at:"")); else no.push("참여상 · "+(CKI_FXR[r.reason]||r.reason||"주지 않음"));
  } else {
    var f=r.fcfs||{};
    var ch=r.chk||null;   /* 261021 서버 ck_gate = 체크인 기록만 · chk { st new | dup | out, at HH:MM } · 옛 서버(chk 없음) = 체크인 */
    if(!ch||ch.st==="new") got.push("체크인"+(ch&&ch.at?" "+ch.at:""));
    else if(ch.st==="dup") dup.push("이미 체크인"+(ch.at?" · "+ch.at:""));
    else no.push("10F 사전 신청자 아님 · 체크인 기록 안 함");
    if(f.st==="give") got.push("참여상"+(f.rk?" "+f.rk+"번째":"")); else if(f.st==="dup") dup.push("참여상 이미 받음"+(f.at?" · "+f.at:"")); else if(f.st==="none"&&mode==="both") no.push("참여상 · "+(CKI_FXR[f.reason]||f.reason||"주지 않음"));
  }
  if(dup.length) CKI.msg={ c:"bad", t:"이미 처리됨 · 다시 기록하지 않음", s:dup.concat(got.length?["처리 "+got.join(" · ")]:[]).join(" · ") };
  else if(got.length){ CKI.msg={ c:"ok", t:"처리 · "+got.join(" + "), s:no.join(" · ") }; toast("처리 · "+(c.name||c.emp)+" · "+got.join(" + ")); }
  else CKI.msg={ c:"warn", t:"처리한 것 없음", s:no.join(" · ") };
  ckiOpen(c.emp, true);
}
function ckiUndoFx(){
  var c=CKI.card; if(!c) return;
  confirmBox({ t:"참여상 수령을 되돌릴까요?", who:(c.name||"")+" · "+c.emp, sub:"받은 시각 "+fmtD(c.fx.gotAt)+" · 물건을 돌려받은 뒤 · 순번 "+(c.fx.rk||"-")+"번째는 그대로", ok:"되돌리기", danger:1,
    body:'<label class="fld">사유(선택)<input class="in" id="ckiW" maxlength="40" autocomplete="off"></label>',
    run:function(){ return call("fcfs_undo",{ emp:c.emp, why:String((el("ckiW")||{}).value||"").trim()||"콘솔 체크인 탭" }); },
    fail:function(r){ return r&&r.reason==="notgot"?"받은 기록이 없습니다":""; },
    done:function(){ CKI.msg={ c:"warn", t:"참여상 수령을 되돌렸습니다", s:"" }; toast("되돌렸습니다 · "+(c.name||c.emp)); ckiOpen(c.emp, true); } });
}
function ckiVoid(){
  var c=CKI.card; if(!c||!c.fx||!c.fx.rk) return;
  confirmBox({ t:"선착순 참여상 자격을 취소할까요?", who:(c.name||"")+" · "+c.emp+" · "+c.fx.rk+"번째", sub:"다시 6개를 채워도 순번이 돌아오지 않음 · 운영로그에 사유", ok:"자격 취소", danger:1,
    body:'<label class="fld">사유(필수 · 2자 이상)<input class="in" id="ckiVW" maxlength="40" autocomplete="off" oninput="gateUpd()"></label>', focus:"ckiVW",
    gate:function(){ return String((el("ckiVW")||{}).value||"").trim().length>=2; },
    run:function(){ return call("fcfs_void",{ emp:c.emp, why:String(el("ckiVW").value).trim() }); },
    fail:function(r){ return r&&r.reason==="got"?"이미 받은 사람입니다 · 먼저 수령 되돌리기":""; },
    done:function(){ CKI.msg={ c:"warn", t:"참여상 자격을 취소했습니다", s:"" }; ckiOpen(c.emp, true); } });
}
/* 처리한 사람만 명단 줄 바꿈(card 값이 명단 줄과 같은 모양) */
function ckiPatch(card){
  var rows=ckiRows(); if(!rows||!card) return;
  var o={}; ["emp","name","dept","kind","stf","sid","no","sz","hum","kit","fx","ck","iss"].forEach(function(k){ o[k]=card[k]; });
  o.iss=(card.iss||[]).filter(function(k){ return k!=="noacct"&&k!=="fnoelig"; });
  var i=-1; rows.some(function(r,j){ if(r.emp===card.emp){ i=j; return true; } return false; });
  if(i>=0) rows[i]=o; else if(o.kind!=="none"||(o.fx&&o.fx.rk)) rows.push(o);
}

/* ── 4. 현황 · 체크인 대상 = 10F 사전 신청자 · 사이즈별 남은 수는 걷음(261021) ── */
function ckiNowPaint(){
  var k=el("ckiK"); if(!k) return;
  var rows=ckiRows(), sm=ckiSum(), gt=dataGate("ckl","체크인 명단");
  if(!rows||!sm){ k.innerHTML='<div style="grid-column:1/-1">'+(gt||skel())+'</div>'; return; }
  var pre=rows.filter(ckiTgt), nIn=pre.filter(function(r){ return !!r.ck; }).length, f=sm.fcfs||{};
  var fxGot=rows.filter(function(r){ return r.fx&&r.fx.st==="got"; }).length, fxDue=rows.filter(function(r){ return r.fx&&r.fx.st==="due"; }).length, ph=ckiPh(f.ph, f);
  k.innerHTML=errTop("ckl")+kpi({ l:"체크인 대상", v:n0(pre.length), u:"명", s:"10F 사전 신청자" })+
    kpi({ l:"체크인", v:n0(nIn), u:"/ "+n0(pre.length), s:"안 온 사람 "+n0(pre.length-nIn)+"명" })+
    kpi({ l:"선착순 받음 / 수량", v:n0(fxGot), u:"/ "+n0(f.cap), s:"받기 전 자격 "+n0(fxDue)+"명 · "+(f.mode||"달성순") })+
    kpi({ l:"선착순 지급", v:ph[1], st:ph[0]==="ok"?"ok":ph[0]==="bad"?"bad":ph[0]==="warn"?"warn":"", s:ph[2] });
}

/* ── 5. 명단 표(사전신청자 명단 · 선착순 명단 · 칩으로 바꿈 · 261021 옷 명단 걷음) ── */
function ckiView(v){ CKI.view=v; lsSet("axf_v2_ckin_v",v); ckiListPaint(); }
function ckiFxSt(r){ var s=r.fx&&r.fx.st; return s==="got"?"받음":s==="due"?"받기 전":s==="full"?"대기마감":s==="void"?"자격 취소":s==="test"?"테스트":s==="off"?"꺼짐":"-"; }
function ckiErrCol(skipF){ return { k:"iss", t:"확인", w:200, v:function(r){ return (r.iss||[]).filter(function(k){ return ckiIssOk(k, skipF); }).map(function(k){ return CKI_ISS[k][1]; }).join(" · "); }, f:function(r){ return ckiIssTags(r.iss, skipF)||'<span class="cap">-</span>'; } }; }
function ckiRowCls(skipF){ return function(r){ var t=ckiWorst((r.iss||[]).filter(function(k){ return !(skipF&&/^f/.test(k)); })); return t?"cki-"+t:""; }; }
function ckiErrAny(skipF){ return function(r){ return !!ckiWorst((r.iss||[]).filter(function(k){ return !(skipF&&/^f/.test(k)); })); }; }
function ckiListPaint(){
  var v=el("ckiV"), L=el("ckiL"); if(!v||!L) return;
  var rows=ckiRows(), kitR=rows?rows.filter(ckiTgt):null, fxR=rows?rows.filter(function(r){ return r.fx&&r.fx.rk; }):null;
  var chip=function(k,t,n){ var on=CKI.view===k; return '<button type="button" role="tab" aria-selected="'+on+'" class="chip'+(on?" on":"")+'" onclick="ckiView(\''+k+'\')">'+t+' <span class="c">'+(n==null?"-":n0(n))+'</span></button>'; };
  v.innerHTML=chip("kit","사전신청자 명단",kitR&&kitR.length)+chip("fx","선착순 명단",fxR&&fxR.length)+'<span class="cap">줄을 누르면 위 카드</span>';
  var gt=dataGate("ckl","체크인 명단");
  if(CKI.view==="kit"){
    if(!CKI.gk) CKI.gk=XG.make({ id:"ckin_pre", file:"체크인 사전신청자 명단", key:function(r){ return r.emp; }, sort:{ k:"no", d:1 },
      chips:[["all","전체",null],["out","안 옴",function(r){ return !r.ck; }],["in","체크인",function(r){ return !!r.ck; }],["err","확인할 것",ckiErrAny(true)]],
      rowCls:function(r){ return ckiRowCls(true)(r)||(r.ck?"dim":""); },
      cols:[{ k:"no", t:"세션 번호", w:84, v:function(r){ return r.no||""; }, f:function(r){ return r.no?'<b>'+esc(r.no)+'</b>':tag("없음","warn"); } },
        { k:"ses", t:"세션", w:92, v:ckiSes },{ k:"name", t:"이름", w:90 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:150 }].concat(typeof apmCol==="function"?[apmCol()]:[]).concat([
        { k:"ck", t:"체크인", type:"date", w:110, v:function(r){ return r.ck||""; }, f:function(r){ return r.ck?tag("체크인 "+fmtD(r.ck),"ok"):'<span class="cap">안 옴</span>'; } },ckiErrCol(true)]),
      src:{ a:"ckin_get", p:{ list:"1" }, pick:function(res){ return (res.rows||[]).filter(ckiTgt); } }, empty:"사전 신청 명단이 비었습니다", h:520, onRow:function(k){ ckiRowGo(k); } });
    CKI.gk.gate=gt||""; XG.set(CKI.gk, gt?null:kitR, L);
  } else {
    if(!CKI.gf) CKI.gf=XG.make({ id:"ckin_fx", file:"체크인 선착순 명단", key:function(r){ return r.emp; }, sort:{ k:"rk", d:1 },
      chips:[["all","전체",null],["due","받기 전",function(r){ return r.fx.st==="due"; }],["got","받음",function(r){ return r.fx.st==="got"; }],["full","대기마감",function(r){ return r.fx.st==="full"; }],["void","자격 취소",function(r){ return r.fx.st==="void"; }]],
      rowCls:function(r){ return r.fx.st==="void"?"cki-bad":r.fx.st==="full"?"cki-warn":""; },
      cols:[{ k:"rk", t:"순번", type:"num", w:64, v:function(r){ return r.fx.rk; } },{ k:"name", t:"이름", w:90 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:150 },
        { k:"kind", t:"구분", w:96, v:function(r){ return CKI_KIND[r.kind]||""; } },{ k:"no", t:"세션 번호", w:84, v:function(r){ return r.no||""; } },{ k:"ses", t:"세션", w:92, v:ckiSes },
        { k:"at", t:"완주 시각", type:"date", w:96, v:function(r){ return r.fx.at||""; } },
        { k:"st", t:"상태", w:110, v:ckiFxSt, f:function(r){ var s=r.fx.st; return s==="got"?tag("받음 "+fmtD(r.fx.gotAt),"ok"):s==="void"?tag("자격 취소","bad"):s==="full"?tag("대기마감","warn"):'<span class="cap">'+esc(ckiFxSt(r))+'</span>'; } },
        ckiErrCol(false)],
      src:{ a:"ckin_get", p:{ list:"1" }, pick:function(res){ return (res.rows||[]).filter(function(r){ return r.fx&&r.fx.rk; }); } }, empty:"아직 6개를 모은 사람이 없습니다", h:520, onRow:function(k){ ckiRowGo(k); } });
    CKI.gf.gate=gt||""; XG.set(CKI.gf, gt?null:fxR, L);
  }
}

/* ── 6. 슈퍼관리자 칸 · 기존 함수 그대로(stock.js cnFillAsk · cnAsk · rosterdl.js rdlGo) ── */
function ckiSupPaint(){
  var b=el("ckiSup"); if(!b) return;
  if(!ckiTop()){ b.innerHTML=""; return; }
  var d=S.data.cno, ok=d&&d.ok, pn=ok&&typeof cnPend==="function"?cnPend(d):0;
  b.innerHTML='<div class="card mt cki-sup"><h2>슈퍼관리자 <span class="cap">세션 번호 · 선착순 명부</span></h2><div class="btns">'+
    (ok&&!d.has&&d.pend?'<button class="btn pri" type="button" onclick="CKI.supAt=Date.now(); cnAsk()">번호 매기기 · '+n0(d.pend)+'명</button>':
      '<button class="btn'+(pn?" pri":"")+'" type="button" onclick="CKI.supAt=Date.now(); cnFillAsk()"'+(pn?'':' disabled')+'>'+(ok?(pn?"빈 번호 채우기 · "+n0(pn)+"명":"번호 없는 사람 없음"):"번호 현황 받는 중")+'</button>')+
    (typeof rdlGo==="function"?'<button class="btn" type="button" onclick="rdlGo(\'fcfs\')">선착순 명부 내려받기</button>':'')+'</div>'+
    '<p class="cap mt">빈 번호 채우기 = 10F 사전 신청자 · 스태프 중 번호 없는 사람에게 그 세션(스태프 S)의 가장 작은 빈 번호 · 이미 있는 번호는 그대로</p></div>';
}

/* ── 7. 카메라 QR 읽기 · 앱 스캐너와 같은 방식(BarcodeDetector → 없으면 jsQR · 긴 변 800 으로 줄여 읽기) ──
 * 권한 거부 · 카메라 없음 = 창을 닫고 찾기 칸(USB QR 리더 · 손 입력) · 참가자 앱 내 QR(AXU:)이 아니면 계속 찾는다 */
var CKI_QR_PX=800;
function ckiCamTx(t){ var x=el("ckiCamTx"); if(x) x.textContent=t; }
function ckiCamFail(t){ ckiCamClose(); toast(t+" · 찾기 칸에 QR 리더 · 이름 · 번호를 넣습니다",{ bad:1, ms:4200 }); var q=el("ckiQ"); if(q) q.focus(); }
function ckiCam(){
  if(S.tab!=="ckin"){ go("ckin"); setTimeout(ckiCam,80); return; }
  if(CKI.cam) return;
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){ ckiCamFail("이 기기에서는 카메라를 쓸 수 없습니다"); return; }
  var bg=document.createElement("div"); bg.className="cki-cam-bg"; bg.id="ckiCamBg"; bg.setAttribute("role","dialog"); bg.setAttribute("aria-modal","true"); bg.setAttribute("aria-label","QR 찍기");
  bg.innerHTML='<div class="cki-cam"><div class="cki-cam-v"><video id="ckiCamV" playsinline muted autoplay></video><i class="cki-cam-box" aria-hidden="true"></i></div><p id="ckiCamTx">카메라를 켜는 중</p><button class="btn big" type="button" onclick="ckiCamClose()">닫기</button></div>';
  document.body.appendChild(bg); requestAnimationFrame(function(){ bg.classList.add("on"); });
  var C=CKI.cam={ bg:bg, stream:null, det:null, t:0, cv:document.createElement("canvas"), off:0 };
  try{ C.det="BarcodeDetector" in window?new BarcodeDetector({ formats:["qr_code"] }):null; }catch(e){ C.det=null; }
  var ready=C.det?Promise.resolve():ckiJsqr();
  navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:"environment" }, width:{ ideal:1280 }, height:{ ideal:720 } }, audio:false }).then(function(st){
    if(C.off){ st.getTracks().forEach(function(t){ t.stop(); }); return; }
    C.stream=st; var v=el("ckiCamV"); v.srcObject=st; var p=v.play(); if(p&&p.catch) p.catch(function(){});
    ready.then(function(){ if(C.off) return; if(!C.det&&typeof jsQR!=="function"){ ckiCamFail("QR 읽기 도구를 불러오지 못했습니다"); return; } ckiCamTx("참가자 앱 「내 QR」을 네모 안에"); ckiCamTick(); },function(){ ckiCamFail("QR 읽기 도구를 불러오지 못했습니다"); });
  },function(e){ var n=e&&e.name; ckiCamFail(n==="NotAllowedError"||n==="SecurityError"?"카메라 권한이 거부됐습니다":n==="NotFoundError"||n==="OverconstrainedError"?"카메라를 찾지 못했습니다":"카메라를 열지 못했습니다"); });
}
function ckiJsqr(){
  if(typeof jsQR==="function") return Promise.resolve();
  return new Promise(function(ok, no){ var s=document.createElement("script"); s.src="jsqr.js?v=26102030"; s.onload=function(){ ok(); }; s.onerror=function(){ no(); }; document.head.appendChild(s); });
}
function ckiCamTick(){
  var C=CKI.cam; if(!C||C.off) return;
  var v=el("ckiCamV"), next=function(){ if(CKI.cam===C&&!C.off) C.t=setTimeout(ckiCamTick,140); };
  if(!v||v.readyState<2||!v.videoWidth){ next(); return; }
  var hit=function(t){ t=String(t||"").trim(); if(!t) return next();
    if(!/^AXU:/i.test(t)){ ckiCamTx("참가자 앱 「내 QR」이 아닙니다 · 다시 찍습니다"); return next(); }
    ckiCamClose(); var q=el("ckiQ"); if(q) q.value=t; ckiGo(t); };
  if(C.det){ C.det.detect(v).then(function(a){ hit(a&&a[0]&&a[0].rawValue); },function(){ next(); }); return; }
  try{
    var w=v.videoWidth, h=v.videoHeight, k=Math.min(1, CKI_QR_PX/Math.max(w,h)); w=Math.round(w*k); h=Math.round(h*k);
    C.cv.width=w; C.cv.height=h; var g=C.g||(C.g=C.cv.getContext("2d",{ willReadFrequently:true }));
    g.drawImage(v,0,0,w,h); var r=jsQR(g.getImageData(0,0,w,h).data,w,h,{ inversionAttempts:"dontInvert" });
    hit(r&&r.data);
  }catch(e){ next(); }
}
function ckiCamClose(){
  var C=CKI.cam; if(!C) return; C.off=1; clearTimeout(C.t); CKI.cam=null;
  if(C.stream) C.stream.getTracks().forEach(function(t){ t.stop(); });
  var bg=C.bg; bg.classList.remove("on"); setTimeout(function(){ bg.remove(); },160);
}
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&CKI.cam){ e.preventDefault(); ckiCamClose(); } });
