/* AXF CONTROL v2 · 행운권 탭(옛 무대 · 261021 사용자 「순수하게 행운권만」 · 행운권 탭 설계 261021) · 흐려짐 없음(D2) · 진행 칩에만 16:00 전 「리허설 중」
 * 칩 = 현황 · 명단 · 종이 대비(lucky.js · raffle_board · roster_export) · 진행(옛 행운권 추첨 + 추첨 설정 접이식) · 당첨 기록
 * 진행 = 지금 콘솔 추첨 원격(runCmd)과 같은 서버 액션 · draw_stats(2~5초) + 소켓 방 draw(운영 Worker 만) · draw_cmd(cmd · arg · rid 멱등)
 *   큰 단추 하나 = 화면 장면에서 다음 차례(dcNext) · 부재 · 다시 뽑기 · 마지막 취소 · 끝 화면은 두 번 누르기(3초) · 세부 명령은 접힘
 * 아이디어왕 · 타자왕 · 7등 굿즈 = 경품 · 재고 탭 칩(D3 · 아래 AW_SUBS 가 SCREENS.prize 를 감싼다 · 코드는 이 파일 그대로)
 *   아이디어왕 = ideaking_state · ideaking_list · ideaking_pick · ideaking_unpick · 타자왕 = type_result(n=10) · 7등 굿즈 = lk7_state · lk7_lock · lk7_draw · lk7_verify · lk7_void · lk7_export
 * 261016 PIN 없음 · 7등 추첨은 확인 문구 「추첨」 */
var SG_SUBS=[["now","현황"],["list","명단"],["paper","종이 대비"],["draw","진행"],["rec","당첨 기록"]];
function sgSub(){ return subsOf(SG_SUBS,SG_SUBS[0][0]); }   /* 261022 첫 칩 = 럭키드로우(lkui.js 가 앞에 넣음) */
/* 261022 옛 칩 = 「럭키드로우」 다음에 「고급」 글자 뒤로 */
function sgChipsH(s){ var h=chipsH(SG_SUBS,s); return SG_SUBS[0][0]==="lk"?h.replace("</button>",'</button><span class="cap" style="align-self:center">고급</span>'):h; }
SCREENS.stage={
  title:"행운권", desc:"",
  need:function(){ var s=sgSub();
    if(s==="draw") return [{ k:"fin", a:"fin_state", ttl:60000 },{ k:"cfgl", a:"cfg_list", ttl:60000 }].concat(DC.open?[]:[{ k:"draw", a:"draw_stats", ttl:15000 }]);   /* 261022 원격 진행 접힘이면 설정 칸 숫자는 여기서 */
    if(s==="rec") return [{ k:"draw", a:"draw_stats", p:{ who:"1" }, ttl:15000 }];
    return lkyNeed(s); },
  mount:function(vb){
    var s=sgSub();
    el("phCap").textContent={ now:"발급 현황 · 추첨 통 기준 · 5초마다", list:"명단 받기 · 엑셀 · CSV · 번호만 · 종이 추첨 키트 · 이 PC 백업", paper:"서버가 멈추면 키트 한 파일로 쪽지 인쇄부터 당첨 기록까지 · 인터넷 없이", draw:"17F 입구 체크인 코드 · 시간 · 날짜 · 당일 점검 · 원격 진행(무대는 받지 않음)", rec:"추첨 화면이 보낸 당첨 · 부재(3 · 2 · 1등만) · 취소 · 실명은 상품 전달용" }[s];
    var h=sgChipsH(s);
    /* 261022 추첨 설정 칩 = 설정 먼저 · 원격 진행(draw_cmd)은 맨 아래 접힘 · 무대는 콘솔 원격 명령을 받지 않는다(261016 E1) · 펼칠 때만 draw_stats 2~5초 */
    if(s==="draw"){ vb.innerHTML=h+lkyDrawSet()+'<details class="memo card mt" id="dcDet"'+(DC.open?" open":"")+' ontoggle="DC.open=this.open;DC.sig=null;if(this.open)dcStart()"><summary>원격 진행 · 무대는 원격 명령을 받지 않음</summary><p class="cap mt4">추첨 진행은 무대 노트북(Space) · 여기 단추를 눌러도 무대 화면은 바뀌지 않음</p><div class="mt">'+lkyDrawTop()+'<div id="dcRoot">'+skel()+'</div></div></details>'; DC.sig=""; if(DC.open) dcStart(); lkyDrawSetMount(); return; }
    if(s==="rec"){
      gridOf("drawrec",{ file:"추첨 당첨 기록", key:function(r){ return r.id+":"+r.st; }, sort:{ k:"t", d:-1 }, onRow:function(k){ rowDetail(MG.drawrec,k); },
        chips:[["all","전체",null],["win","당첨",function(r){ return r.st==="win"&&r.live; }],["absent","부재 · 3 · 2 · 1등",function(r){ return r.st==="absent"&&(dcAbsOk(r)||!dcRk(r)); }],["undo","취소",function(r){ return !r.live||r.st==="undo"; }],["inw","체크인 없음",function(r){ return r.warn==="in"&&r.live; }],["fb","전체 통 이어 뽑기",function(r){ return !!r.fb&&r.live; }]],
        cols:[{ k:"t", t:"시각", type:"date", w:96 },{ k:"round", t:"등수 · 칸", w:110, v:function(r){ var k=dcRk(r); return (k?k+"등":(r.round||""))+(r.slot?" · "+r.slot:""); } },{ k:"no", t:"행운권", w:84 },{ k:"name", t:"이름", w:100, v:function(r){ return r.name||r.nm||""; } },{ k:"dept", t:"부서", w:140 },{ k:"prize", t:"경품", w:160 },
          { k:"st", t:"상태", w:90, v:function(r){ return (r.st==="win"?(r.live?"당첨":"당첨 · 취소됨"):r.st==="absent"?(r.live?"부재":"부재 · 취소됨"):"취소")+dtRecTxt(r); },
          f:function(r){ return dtRecCell(r,r.st==="win"?(r.live?"당첨":"당첨 · 취소됨"):r.st==="absent"?(r.live?"부재":"부재 · 취소됨"):"취소"); } }],
        empty:"아직 추첨 기록이 없습니다", h:520 });
      vb.innerHTML=h+'<div class="grid g4 mb" id="rcK"></div><div class="card"><div id="mg_drawrec"></div></div>'; return; }
    vb.innerHTML=h+lkyMount(s);
  },
  paint:function(){ var s=sgSub();
    if(s==="draw"){ lkyDrawSetPaint(); return dcPaint(); }
    if(s==="rec"){ var d=S.data.draw; el("rcK").innerHTML=d&&d.ok?kpi({ l:"당첨", v:n0(d.wins), u:"명", s:"취소 뺀 수" })+kpi({ l:"부재", v:n0(d.absent), u:"명", s:"3 · 2 · 1등 다시 추첨" })+kpi({ l:"추첨 대상", v:n0(d.pool&&d.pool.n), u:"명", s:"행운권 "+n0(d.pool&&d.pool.balls)+"장" })+(function(){ var n=dcScrsLive(d).length; return kpi({ l:"추첨 화면", v:n?"연결":"없음", st:n?"ok":"warn", stt:n?"정상":"주의", s:DC_FRESH+"초 안 보고" }); })():"";
      gridPaint("drawrec","draw","추첨",function(x){ return dcRecs(x); }); return; }
    lkyPaint(s);
  }
};
/* ── 261021 D3 · 아이디어왕 · 타자왕 · 7등 굿즈 = 경품 · 재고 탭 칩 · 옷 · 재고 칩은 prize.js 그대로 ── */
var AW_SUBS=[["main","옷 · 재고"],["lk7","7등 굿즈"],["ik","아이디어왕"],["type","타자왕"]];
function awSub(){ return S.tab==="prize"?subsOf(AW_SUBS,"main"):"main"; }
(function(){ var sc=SCREENS.prize; if(!sc||sc.aw) return; sc.aw=1; var n0_=sc.need, m0=sc.mount, p0=sc.paint, d0=sc.desc;
  sc.need=function(){ var s=awSub();
    if(s==="ik") return [{ k:"ik", a:"ideaking_state", ttl:20000 },{ k:"ikl", a:"ideaking_list", p:{ ch:IK.ch, late:IK.late?"":"0" }, ttl:30000 }];
    if(s==="type") return [{ k:"tres", a:"type_result", p:{ n:10 }, ttl:30000 }];
    if(s==="lk7") return [{ k:"lk", a:"lk7_state", ttl:20000 },{ k:"inv", a:"inv_state", ttl:60000 }];
    return n0_.apply(this,arguments); };
  sc.mount=function(vb){ var s=awSub(), h=chipsH(AW_SUBS,s);
    if(s==="main"){ var r=m0.apply(this,arguments); vb.insertAdjacentHTML("afterbegin",h); el("phCap").textContent=d0; if(typeof rdlFcfsMount==="function") rdlFcfsMount(); return r; }
    el("phCap").textContent={ ik:"아이디어왕 1등 1 · 2등 1 · 3등 3 · AI 구독권", type:"1F 현장 타자왕 1~10위 · 1~3위 시상", lk7:"7등 랜덤 굿즈 · 17:00 잔여 → 대상 확정 → 추첨(한 번) → 사내 우편" }[s];
    if(s==="ik"){ vb.innerHTML=h+'<div id="ikTop"></div><div class="card mt"><h2>후보 <span class="cap">아이디어가 있는 사람 · 줄을 누르면 전문 · 선정</span><span class="r" id="ikLate"></span></h2><div id="ikCh" class="chips"></div><div id="mg_ikl"></div></div>'; return; }
    if(s==="type"){
      gridOf("tyres",{ file:"타자왕 순위", key:function(r){ return String(r.rank); }, sort:{ k:"rank", d:1 }, onRow:function(k){ rowDetail(MG.tyres,k,{ title:function(r){ return r.rank+"위 · "+(r.nick||"-"); } }); },
        chips:[["all","전체",null],["top3","1~3위 시상",function(r){ return num(r.rank)<=3; }],["mat","4~10위 데스크 매트",function(r){ return num(r.rank)>3; }]],
        cols:[{ k:"rank", t:"순위", type:"num", w:64 },{ k:"nick", t:"닉네임", w:130, f:function(r){ return num(r.rank)<=3?'<b>'+esc(r.nick||"-")+'</b>':esc(r.nick||"-"); } },{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:90 },{ k:"score", t:"점수", type:"num", w:80 },{ k:"acc", t:"정확도", w:80, v:function(r){ return r.acc!=null?r.acc+"%":""; } },{ k:"ts", t:"시각", type:"date", w:100 },
          { k:"gift", t:"상품", w:200, v:function(r){ var k=num(r.rank); return k===1?"체리 G80-3872 기계식 키보드":k===2?"로지텍 MX Master 4 마우스":k===3?"AULA F108 Pro 기계식 키보드":"엑셀 단축키 데스크 매트"; } }],
        empty:"아직 기록이 없습니다", h:520 });
      vb.innerHTML=h+'<div class="card"><div id="mg_tyres"></div><p class="cap mt" id="tyWin"></p></div>'; return; }
    vb.innerHTML=h+'<div id="lkB"></div>';
  };
  sc.paint=function(){ var s=awSub();
    if(s==="main") return p0.apply(this,arguments);
    if(s==="ik") return ikPaint();
    if(s==="type"){ gridPaint("tyres","tres","타자왕",function(x){ return (x.top||[]).slice(0,10); }); var t=S.data.tres; el("tyWin").textContent=t&&t.ok?"집계 시간 "+((t.win||[]).join(" · ")||"-")+" · 1~3위는 사회자가 닉네임으로 부르고 실명으로 상품 전달 · 부문 통계 없음":""; return; }
    lkPaint(); };
})();

/* 등수 · 상품 글자(상품권 6 · 마사지기 5 · 에어팟 5 · 음식물 3 · 뷔페 2 · 아이패드 1)가 먼저, 없으면 「N등」 글자, 없으면 칸 번호(0 = 6등 ... 5 = 1등) · 모르면 0 */
var DC_RKP=[["아이패드",1],["뷔페",2],["신라호텔",2],["음식물",3],["미닉스",3],["에어팟",4],["마사지",5],["풀리오",5],["상품권",6]];
function dcRk(r){ var t=String((r&&r.prize)||""), i, m;
  for(i=0;i<DC_RKP.length;i++) if(t.indexOf(DC_RKP[i][0])>=0) return DC_RKP[i][1];
  m=/^([1-6])\s*등/.exec(String((r&&r.round)||"")); if(m) return +m[1];
  m=/^[0-5]$/.exec(String((r&&r.round)||"")); return m?6-(+m[0]):0; }
function dcAbsOk(r){ var k=dcRk(r); return k>=1&&k<=3; }
/* 261019 리허설 · 당첨 기록 줄 · 나중에 부재가 된 같은 기록 id 의 당첨 줄은 숨긴다(한 사람 한 줄) · 서버가 사번을 붙여 줬으면(who 1) 이름으로 명부를 찾지 않는다(동명이인) */
function dcRecs(d){ var rs=(d&&d.recs)||[], last={};
  rs.forEach(function(r){ if(r&&r.st!=="undo"&&!(r.id in last)) last[r.id]=r.st; });   /* recs = 최근 먼저 */
  return rs.filter(function(r){ if(d.who&&!r.emp) r._noNm=1; return !(r.st==="win"&&last[r.id]==="absent"); }); }
/* 화면 보고 · 실제 최근 보고만(서버 목록은 2분 · 꺼진 노트북이 남는다) · 받은 뒤 지난 시간도 더한다 */
var DC_FRESH=15;
function dcScrsLive(d){ var lag=Math.max(0,(Date.now()-num(S.at.draw||Date.now()))/1000); return ((d&&d.scrs)||[]).filter(function(x){ return num(x.age)+lag<=DC_FRESH; }); }
/* ══ 행운권 추첨 진행판 · 지금 콘솔 「추첨 원격」과 같은 서버 액션 ══ */
var DC_SCN={ idle:"대기", checkin:"추첨 준비 · 공 넣는 중", closed:"추첨 준비 끝", card:"등수 카드", mix:"부저 화면", spin:"부저 · 회전", tension:"감속 · 배출 대기", exit:"배출", reveal:"당첨 공개", board:"결과판", end:"끝 화면", intro:"인트로", fin:"완주 경품 추첨 발표" };
var DC_BTN=[ { c:"checkin", n:"추첨 준비 · 공 넣기" }, { c:"round", n:"등수 시작" }, { c:"mix", n:"부저 화면" }, { c:"draw", n:"부저" }, { c:"confirm", n:"확정" },
  { c:"absent", n:"부재 · 다시 뽑기", two:1 }, { c:"undo", n:"마지막 취소", two:1 }, { c:"board", n:"결과판" }, { c:"end", n:"끝 화면", two:1 }, { c:"idle", n:"대기 화면" },
  { c:"intro", n:"인트로 영상" }, { c:"close", n:"체크인 마감 · 시험용", two:1 }, { c:"fin", n:"완주 경품 추첨 발표" }, { c:"reset_screen", n:"화면 초기화", two:1, hide:1 } ];
var DC_MAP={ idle:["checkin","intro","board","end","fin"], intro:["idle","checkin"], checkin:["close","idle"], closed:["round","idle","fin"], card:["mix","undo","board","idle"], mix:["draw"], spin:[], tension:[], exit:[],
  reveal:["confirm","absent","undo"], board:["round","undo","end","idle","fin"], end:["idle","fin"], fin:["end","idle","fin"] };
var DC_NAME={}; DC_BTN.forEach(function(b){ DC_NAME[b.c]=b.n; });
var DC_STEPS=[["추첨 준비",["idle","intro","checkin"]],["행운권 6등 → 1등",["closed","card","mix","spin","tension","exit","reveal"]],["결과판",["board"]],["완주 경품",["fin"]],["끝",["end"]]];
var DC_WHY={ busy:"연출 중이었습니다", scene:"지금 장면에서는 받지 않습니다", drawing:"뽑는 중이었습니다", same:"이미 그 화면입니다", done:"인트로는 이미 틀었습니다", notclosed:"체크인 마감 전입니다",
  round:"없는 등수입니다", loading:"공을 넣는 중이었습니다", full:"이 등수 인원이 다 찼습니다", empty:"통에 공이 없습니다", none:"취소할 당첨이 없습니다", id:"다른 당첨이었습니다", arg:"완주 경품 추첨 숫자가 없습니다", stale:"30초 넘게 늦게 도착해 실행하지 않았습니다", unknown:"화면이 모르는 명령입니다", error:"화면 오류" };
var DC={ open:false, on:false, ws:null, st:"off", t:null, fails:0, give:false, ping:null, pongAt:0, poll:null, scr:null, scrAt:0, cmd:null, sent:null, busy:"", arm:null, rejOff:0, sig:"", more:false };
var DRAW_SCR_GONE=120;
function finOn(){ var f=S.data.fin; return !!(f&&f.ok); }
function dcOn(){ return authed()&&S.tab==="stage"&&sgSub()==="draw"&&DC.open; }
function dcStart(){ if(!DC.on){ DC.on=true; DC.give=false; DC.fails=0; dcOpen(); } dcPull(); }
setInterval(function(){ var on=dcOn(); if(on&&!DC.on) dcStart(); else if(!on&&DC.on){ DC.on=false; dcClose(); clearTimeout(DC.poll); DC.poll=null; } if(DC.on) dcAge(); },1000);
function dcUrl(){ return /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/exec$/.test(BE)?BE.replace(/^https:/,"wss:").replace(/\/exec$/,"/ws?r=draw"):""; }
function dcPull(){
  clearTimeout(DC.poll); DC.poll=null; if(!DC.on) return;
  if(document.hidden){ DC.poll=setTimeout(dcPull,5000); return; }
  call("draw_stats",{ who:"1" }).then(function(r){
    if(r&&r.ok){ S.data.draw=r; S.at.draw=Date.now(); DC.cmd=r.cmd||null; if(r.scr&&(!DC.scr||r.scr.age<dcAgeNow()-0.5)){ DC.scr=r.scr; DC.scrAt=Date.now()-num(r.scr.age)*1000; } else if(!r.scr&&dcAgeNow()>DRAW_SCR_GONE) DC.scr=null; }
    else S.data.draw=r||{ ok:false };
    dcPaint(); if(DC.on) DC.poll=setTimeout(dcPull, DC.st==="ok"?5000:2000);
  });
}
function dcOpen(){
  if(DC.ws||DC.t||DC.give||!DC.on||!dcUrl()||typeof WebSocket==="undefined") return;
  var ws; try{ ws=new WebSocket(dcUrl()); }catch(e){ dcFail(); return; }
  DC.ws=ws; DC.st="open";
  ws.onopen=function(){ if(DC.ws!==ws) return; try{ ws.send(JSON.stringify({ t:"hello", tok:tok(), emp:aemp() })); }catch(e){} };
  ws.onmessage=function(e){ if(DC.ws!==ws) return; if(e.data==="o"){ DC.pongAt=Date.now(); return; } var m; try{ m=JSON.parse(e.data); }catch(x){ return; }
    if(m.t==="ok"){ DC.st="ok"; DC.fails=0; DC.pongAt=Date.now(); dcPing(true); dcPaint(); return; }
    if(m.t==="no"){ DC.give=true; return; }
    if(m.t==="drawscr"&&m.s){ var s={}; for(var k in m.s) s[k]=m.s[k]; s.sid=m.sid||"main"; s.age=0; DC.scr=s; DC.scrAt=Date.now(); dcPaint(); return; }
    if(m.t==="draw"&&m.seq){ DC.cmd={ seq:m.seq, cmd:m.cmd, arg:m.arg||"", at:m.at }; dcPaint(); } };
  ws.onclose=function(e){ if(DC.ws!==ws) return; var was=DC.st==="ok"; DC.ws=null; DC.st="off"; dcPing(false); dcPaint();
    if(e&&(e.code===4000||e.code===4001)||DC.give||!DC.on) return;
    if(was){ DC.t=setTimeout(function(){ DC.t=null; dcOpen(); },500+Math.random()*2000); return; }
    dcFail(); };
}
function dcFail(){ DC.ws=null; DC.st="off"; if(++DC.fails>=4){ DC.give=true; return; } DC.t=setTimeout(function(){ DC.t=null; dcOpen(); },1000*Math.pow(2,DC.fails-1)+Math.random()*1000); }
function dcPing(on){ clearInterval(DC.ping); DC.ping=null; if(on) DC.ping=setInterval(function(){ if(!DC.ws||DC.st!=="ok") return; if(Date.now()-DC.pongAt>70000){ try{ DC.ws.close(); }catch(e){} return; } try{ DC.ws.send("p"); }catch(e){} },25000); }
function dcClose(){ clearTimeout(DC.t); DC.t=null; var ws=DC.ws; DC.ws=null; DC.st="off"; dcPing(false); if(ws){ try{ ws.close(1000); }catch(e){} } }
function dcAgeNow(){ return DC.scr?Math.max(0,(Date.now()-DC.scrAt)/1000):Infinity; }
function dcGone(){ return !!DC.scr&&dcAgeNow()>DC_FRESH; }   /* 261019 무대 노트북이 꺼짐 · 보고가 15초 넘게 없음 = 큰 단추 끔 */
function dcConn(){ var a=dcAgeNow(); if(!DC.scr) return ["bad","화면 보고 없음"]; if(a>5) return ["bad","화면 끊김 · "+Math.round(a)+"초 전 보고"]; return ["ok","화면 연결됨 · "+Math.round(a)+"초 전"]; }
function dcAge(){ var p=el("dcAge"); if(!p) return; if(DC.scr&&dcAgeNow()>DRAW_SCR_GONE+5){ DC.scr=null; dcPaint(true); return; } var c=dcConn(); p.innerHTML=stt(c[0],c[1]); }
function dcReady(c){ if(c==="reset_screen") return true; var s=DC.scr; if(!s) return true; if(Array.isArray(s.ready)) return s.ready.indexOf(c)>=0; return (DC_MAP[s.scene]||[]).indexOf(c)>=0; }
function dcRid(){ return "c"+Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function dcArm(k){ if(DC.arm&&DC.arm.c===k&&Date.now()-DC.arm.at<3000){ DC.arm=null; return true; } DC.arm={ c:k, at:Date.now() }; dcPaint(true); setTimeout(function(){ if(DC.arm&&DC.arm.c===k&&Date.now()-DC.arm.at>=3000){ DC.arm=null; dcPaint(true); } },3100); return false; }
function dcPress(c){
  var b=DC_BTN.filter(function(x){ return x.c===c; })[0]; if(!b||DC.busy) return;
  if(!dcReady(c)){ toast("지금 장면에서는 보낼 수 없습니다"); return; }
  if(b.two&&!dcArm(c)) return; DC.arm=null;
  var last=(DC.scr&&DC.scr.last)||null, arg=(c==="absent"||c==="undo")&&last&&last.id?last.id:"";
  if(arg&&!/^[0-9A-Za-z_.:-]{1,40}$/.test(arg)) arg="";
  dcSend(c, arg, dcRid(), 0);
}
function dcGo(){
  var nx=dcNext(DC.scr); if(!nx.c||DC.busy) return;
  if(dcGone()){ toast("추첨 화면 보고가 끊겼습니다 · 무대 노트북을 확인합니다",{ bad:1 }); return; }
  if(!dcReady(nx.c)){ toast("화면이 아직 받지 않습니다 · 잠시 뒤"); return; }
  if(nx.two&&!dcArm("go:"+nx.c)) return; DC.arm=null;
  var arg=nx.arg||""; if(arg&&!/^[0-9A-Za-z_.:-]{1,40}$/.test(arg)) arg="";
  dcSend(nx.c, arg, dcRid(), 0);
}
function dcSend(c, arg, rid, tries){
  DC.busy=c; dcPaint(true); var t0=Date.now();
  call("draw_cmd",{ cmd:c, arg:arg, rid:rid }).then(function(r){
    if(r&&r.ok===false&&(r.reason==="timeout"||r.reason==="network")&&tries<1){ dcSend(c, arg, rid, tries+1); return; }
    DC.busy="";
    if(r&&r.ok){ DC.sent={ seq:r.seq, cmd:r.cmd, at:Date.now(), ms:Date.now()-t0, again:!!r.again }; DC.cmd={ seq:r.seq, cmd:r.cmd, arg:r.arg, at:r.at }; if(S.data.draw&&"closed" in r) S.data.draw.closed=r.closed; toast((DC_NAME[c]||c)+" 보냄 · #"+r.seq); setTimeout(dcPull,600); }
    else toast("보내지 못했습니다 · "+(r&&r.reason==="cmd"?"서버가 이 명령을 모릅니다":r&&r.reason==="fin"?"완주 경품 추첨 전입니다":why(r)),{ bad:1 });
    dcPaint(true);
  });
}
function dcRejOff(seq){ DC.rejOff=seq; dcPaint(true); }
function dcNext(s){
  if(!s) return { c:"", n:"화면 보고 없음", sub:"17F 대형 스크린에 추첨 화면을 먼저 엽니다(기록 · 설정 › 화면 주소 › 추첨 화면)" };
  var R=s.round&&!/^\d+$/.test(String(s.round))?s.round:"다음 등수";
  switch(s.scene){
    case "idle": { var iv=dcReady("intro"); return { c:iv?"intro":"checkin", n:"추첨 준비 · 공 넣기", sub:iv?"처음 한 번은 인트로 영상이 먼저 · 영상이 끝난 순간까지의 행운권이 대상 · 공 넣기 약 10초":"누른 순간까지의 행운권이 대상 · 공 넣기 약 10초" }; }
    case "intro": return { c:"", n:"인트로 재생 중", sub:"끝나면 공이 들어갑니다" };
    case "checkin": return { c:"", n:"공을 넣는 중", sub:"약 10초 · 다 넣으면 첫 등수 단추가 켜집니다" };
    case "closed": return { c:"round", n:R+" 추첨 시작", sub:"등수 · 경품 카드가 나옵니다" };
    case "card": return { c:"mix", n:"부저 화면", sub:"3.2초 뒤 저절로 넘어갑니다" };
    case "mix": if(Array.isArray(s.ready)&&s.ready.indexOf("draw")<0) return { c:"", n:"공을 넣는 중", sub:"잠시 뒤 뽑기가 켜집니다" }; return { c:"draw", n:"부저 · "+R+" 뽑기", sub:"부저는 무대 노트북 Space" };
    case "spin": case "tension": case "exit": return { c:"", n:"뽑는 중", sub:"공이 나오면 당첨 공개" };
    case "reveal": return { c:"confirm", n:"확정", arg:(s.last&&s.last.id)||"", sub:dcAbsOk({ prize:s.last&&s.last.prize, round:s.round&&String(s.round) })?"확정 · 다시 추첨은 무대 화면 오른쪽 아래 단추":"호명으로 마무리 · 부재 처리 없음" };
    case "board": return finOn()?{ c:"fin", n:"완주 경품 추첨 발표", sub:"완주 경품 추첨 결과(숫자)" }:{ c:"end", n:"끝 화면", two:1, sub:"ME to WE 마무리 화면 · 7등 랜덤 굿즈는 행사 뒤 추첨" };
    case "fin": return { c:"end", n:"끝 화면", sub:"ME to WE 마무리 화면" };
    case "end": return { c:"", n:"끝", sub:"모든 순서를 마쳤습니다" };
  }
  return { c:"", n:DC_SCN[s.scene]||s.scene||"-", sub:"" };
}
function dcSteps(s){
  var L=DC_STEPS.filter(function(x){ return x[1][0]!=="fin"||finOn(); }), at=-1;
  if(s) L.forEach(function(x,i){ if(x[1].indexOf(s.scene)>=0) at=i; });
  return '<ol class="up-steps dc-steps">'+L.map(function(x,i){ var t=x[0]; if(i===1&&at===1&&s.round&&!/^\d+$/.test(String(s.round))) t="지금 "+s.round+(s.slot?" "+s.slot:""); return '<li class="'+(i<at?"done":i===at?"on":"")+'"><b>'+(i+1)+'</b>'+esc(t)+'</li>'; }).join("")+'</ol>';
}
function dcPaint(force){
  var box=el("dcRoot"); if(!box) return;
  var d=S.data.draw;
  if(!d){ box.innerHTML=skel(); DC.sig=""; return; }
  if(unknownSrv(d)){ box.innerHTML=band("info","이 서버는 아직 추첨 원격을 모릅니다"); DC.sig=""; return; }
  if(!d.ok){ box.innerHTML=band("warn","받지 못했습니다 · "+esc(why(d)),'<button class="btn sm" type="button" onclick="dcPull()">다시 시도</button>'); DC.sig=""; return; }
  var h=dcBody(d); if(!force&&h===DC.sig){ dcAge(); return; }
  DC.sig=h; var c=dcConn(); box.innerHTML=h.replace("@@DCCONN@@",'<span id="dcAge">'+stt(c[0],c[1])+'</span>');
}
function dcBody(d){
  if(!("cmd" in d)) return band("warn","지금 서버는 원격 진행 이전입니다 · 추첨 화면 키보드로 진행합니다");
  var s=DC.scr, sc=s?s.scene:"", nx=dcNext(s), pl=d.pool||null, aOff=String(d.att||"").toUpperCase()!=="ON";
  var head='<div class="dc-top">@@DCCONN@@<span class="cap">'+(DC.st==="ok"?"실시간 연결":"실시간 연결 없음 · 2초마다 확인")+(dcScrsLive(d).length>1?" · 화면 "+dcScrsLive(d).length+"대가 보고 중":"")+'</span><span class="sp"></span><a class="btn sm" href="'+esc(scrUrl("../../draw/?remote=1"))+'" target="axf_draw" rel="noopener">추첨 화면 열기</a></div>';
  var rej=s&&s.rej&&s.rej.seq&&s.rej.seq>DC.rejOff&&(!DC.cmd||s.rej.seq>=DC.cmd.seq-3)?band("bad",'<b>화면이 「'+esc(DC_NAME[s.rej.cmd]||s.rej.cmd)+'」(#'+s.rej.seq+')를 받지 않았습니다</b> · '+esc(DC_WHY[s.rej.why]||s.rej.why||""),'<button class="btn sm" type="button" onclick="dcRejOff('+Number(s.rej.seq)+')">확인</button>'):"";
  var k="go:"+nx.c, arm=DC.arm&&DC.arm.c===k, gone=dcGone(), ok=!!nx.c&&dcReady(nx.c)&&!DC.busy&&!gone, busy=DC.busy&&DC.busy===nx.c;
  var go='<button class="dc-go'+(arm?" arm":"")+'" type="button"'+(ok?'':' disabled')+' onclick="dcGo()"><b>'+(busy?"보내는 중":arm?"한 번 더 누르면 "+esc(nx.n):esc(nx.n))+'</b><em>'+(nx.c?(busy?"보내는 중":!ok?(gone?"화면 끊김 · 보고가 다시 오면 켜짐":DC.busy?"다른 명령을 보내는 중":s&&Array.isArray(s.ready)&&!s.ready.length?"무대 노트북 Space 로 진행":"화면이 아직 받지 않음"):arm?"3초 안에 한 번 더":nx.two?"두 번 누름":"누르면 추첨 화면이 바로 바뀜"):"기다리는 중")+'</em></button>';
  var abs=sc==="reveal"&&dcAbsOk({ prize:s.last&&s.last.prize, round:s.round&&String(s.round) })?(function(){ var a=DC.arm&&DC.arm.c==="absent"; return '<button class="dc-abs'+(a?" arm":"")+'" type="button"'+(dcReady("absent")&&!DC.busy&&!dcGone()?'':' disabled')+' onclick="dcPress(\'absent\')"><b>'+(a?"한 번 더 누르면 부재":"부재 · 다시 뽑기")+'</b><em>'+(a?"3초 안에":"두 번 누름")+'</em></button>'; })():"";
  var now='<div class="dc-now"><span class="cap">지금 화면</span><b>'+esc(s?(DC_SCN[sc]||sc||"-"):"화면 보고 없음")+'</b>'+(s&&s.round&&!/^\d+$/.test(String(s.round))&&DC_STEPS[1][1].indexOf(sc)>=0?tag(s.round+(s.slot?" · "+s.slot:"")):'')+'</div>';
  var kp='<div class="grid g4 mb">'+kpi({ l:"추첨 대상", v:pl?n0(pl.n):n0(d["in"]), u:"명", s:dtPoolSub(d,aOff) })+kpi({ l:"통 안의 공", v:n0(s?s.pool:d.balls), u:"개", s:"당첨 확률은 공 단위" })+kpi({ l:"당첨", v:n0(d.wins), u:"명", s:"부재 "+n0(d.absent)+" · 취소 뺀 수" })+kpi({ l:"마지막 명령", v:DC.cmd?"#"+DC.cmd.seq:"-", s:DC.cmd?(DC_NAME[DC.cmd.cmd]||DC.cmd.cmd)+(DC.sent&&DC.sent.seq===DC.cmd.seq?" · "+DC.sent.ms+"ms":""):"보낸 명령 없음" })+'</div>';
  var main='<div class="card">'+dcSteps(s)+now+'<div class="dc-gorow">'+go+abs+'</div><p class="cap mt"><b>진행은 무대 노트북(Space) · 이 판은 보기</b></p><p class="cap mt4">'+esc(nx.sub||"")+'</p></div>';
  var btn=function(b){ var ok2=dcReady(b.c)&&(b.c!=="fin"||finOn()), a=DC.arm&&DC.arm.c===b.c, bz=DC.busy===b.c; return '<button class="btn sm'+(a?" pri":"")+(b.two?" dng":"")+'" type="button"'+(ok2&&!DC.busy?'':' disabled')+' onclick="dcPress(\''+b.c+'\')">'+(bz?"보내는 중":a?"한 번 더 · "+esc(b.n):esc(b.n))+'</button>'; };
  var more='<details class="memo mt"'+(DC.more?" open":"")+' ontoggle="DC.more=this.open"><summary>세부 명령 · 화면이 지금 받는 명령만 켜짐 · 빨간 단추는 두 번</summary><div class="dc-pad mt">'+DC_BTN.filter(function(b){ return !b.hide&&(b.c!=="fin"||finOn())&&(b.c!=="absent"||(sc==="reveal"&&dcAbsOk({ prize:s&&s.last&&s.last.prize, round:s&&s.round&&String(s.round) }))); }).map(btn).join("")+'</div>'+(s&&s.ver?'<p class="cap mt4">화면 '+esc(s.ver)+'</p>':'')+'</details>';
  var last=s&&s.last&&s.last.no?s.last:null, rec=null;
  var R9=dcRecs(d); if(last&&last.id) rec=(R9.filter(function(r){ return r.id===last.id; })[0])||null;
  var won=last?'<div class="win"><span class="cap">'+esc((last.round||"")+(last.slot?" · "+last.slot:""))+'</span><div class="no">'+esc(last.no)+'</div><b>'+esc(whoOf(rec||{ nm:last.nm, _noNm:1 }).n||"-")+'</b><span class="cap">'+esc(whoSub(rec||{ nm:last.nm, _noNm:1 }))+'</span>'+whoFlags(whoOf(rec||{ nm:last.nm, _noNm:1 }))+'<div>'+(last.st&&last.st!=="win"?tag(last.st==="absent"?"부재":"취소","off"):tag("당첨","ok"))+' '+esc(last.prize||(rec&&rec.prize)||"")+'</div>'+'</div>':'<p class="cap">아직 당첨 공개가 없습니다</p>';
  var w=R9.filter(function(r){ return r.st==="win"&&r.live; }).slice(0,12);
  var ack=w.length?'<div class="card mt"><h2>최근 당첨자 <span class="cap">호명 · 현장 확인 · '+w.length+'명</span></h2><table class="tb"><tbody>'+w.map(function(r){ return '<tr><td class="n"><b>'+esc(r.no||"-")+'</b></td><td class="n">'+esc(whoOf(r).e||"-")+'</td><td>'+esc(whoOf(r).d||"-")+'</td><td>'+esc(whoOf(r).n||"-")+whoFlags(whoOf(r))+'</td><td>'+esc(r.prize||"")+'</td></tr>'; }).join("")+'</tbody></table></div>':"";
  return head+rej+(!aOff?band("warn","행운권 참석조건 ON · 체크인 화면은 옛 추첨 화면(?classic=1&ck=1)에서 씁니다"):"")+kp+'<div class="grid g32"><div>'+main+more+'</div><div><div class="card"><h2>방금 당첨 <span class="cap">실명 · 부서는 상품 전달용</span></h2>'+won+'</div>'+ack+'</div></div>';
}

/* ══ 아이디어왕 ══ */
var IK={ ch:"lounge_pre", late:0 };
var IK_CH={ lounge_pre:"AX 라운지 사전", lounge_day:"AX 라운지 당일", chat:"18F 커피챗", app:"앱" };
var IK_PH={ open:["접수 중","ok"], judging:["심사 중","warn"], done:["선정 끝",""] };
var IK_PRZ=[{ rk:1, mo:6, n:1 },{ rk:2, mo:3, n:2 },{ rk:3, mo:1, n:3 }];
function ikPrz(d){ return d&&d.prz&&d.prz.length?d.prz:IK_PRZ; }
function ikPickOf(emp){ var d=S.data.ik, ps=d&&d.ok&&d.picks||[]; for(var i=0;i<ps.length;i++) if(normE(ps[i].emp)===normE(emp)) return ps[i]; return null; }
function ikRow(emp){ var L=S.data.ikl, rs=L&&L.ok&&L.rows||[]; for(var i=0;i<rs.length;i++) if(normE(rs[i].emp)===normE(emp)) return rs[i]; return null; }
function ikPaint(){
  var top=el("ikTop"); if(!top) return; var d=S.data.ik, gt=dataGate("ik","아이디어왕");
  if(gt){ top.innerHTML=gt; } else {
    var P=IK_PH[d.ph]||["-",""], prz=ikPrz(d), picks=d.picks||[], mx=d.max||6;
    top.innerHTML='<div class="card"><h2>선정 '+tag(P[0],P[1])+' <span class="cap">마감 '+esc(d.cut||"없음")+' · 접수 '+(d.open?"열림":"닫힘")+' · 선정 '+picks.length+' / '+mx+'</span></h2><div class="ik-slots">'+prz.map(function(z){ var got=picks.filter(function(p){ return Number(p.rk)===Number(z.rk); }), out="";
      for(var i=0;i<(Number(z.n)||0);i++){ var p=got[i]; out+='<div class="ik-slot'+(p?" got":"")+'"><div><b>'+z.rk+'등</b> <span class="cap">AI 구독권 '+z.mo+'개월</span></div>'+(p?'<div class="mt4">'+personTwo(p)+'</div><div class="cap">'+esc(IK_CH[p.ch]||p.ch||"")+(p.why?" · "+esc(p.why):"")+'</div><button class="btn sm mt4" type="button" onclick="ikUnpickAsk(\''+jq(p.emp)+'\')">선정 취소</button>':'<div class="cap mt4">비어 있음</div>')+'</div>'; }
      return out; }).join("")+'</div></div>'; }
  var C=d&&d.ok?d.cand||{}:{};
  el("ikCh").innerHTML=["lounge_pre","lounge_day","chat"].map(function(k){ return '<button type="button" class="chip'+(IK.ch===k?" on":"")+'" aria-pressed="'+(IK.ch===k)+'" onclick="ikCh(\''+k+'\')">'+esc(IK_CH[k])+' <span class="c">'+n0(C[k])+'</span></button>'; }).join("");
  el("ikLate").innerHTML='<label class="up-ck" style="margin:0"><input type="checkbox"'+(IK.late?" checked":"")+' onchange="ikLate(this.checked)"> 마감 뒤 접수도</label>';
  gridOf("ikl",{ file:"아이디어왕 후보", key:function(r){ return r.emp; }, sort:{ k:"at", d:1 }, onRow:function(k){ ikOpen(k); },
    cols:[{ k:"at", t:"시각", type:"date", w:110 },{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:90 },{ k:"text", t:"아이디어", w:380 },{ k:"st", t:"상태", w:110, v:function(r){ var p=ikPickOf(r.emp); return (r.late?"마감 뒤 ":"")+(p?p.rk+"등 선정":""); } }],
    empty:"이 경로의 후보가 없습니다", h:440 });
  gridPaint("ikl","ikl","아이디어왕 후보",function(x){ return x.rows||[]; });
}
function ikCh(k){ IK.ch=k; S.at.ikl=0; S.data.ikl=null; paint(); load(false); }
function ikLate(v){ IK.late=v?1:0; S.at.ikl=0; S.data.ikl=null; paint(); load(false); }
function ikOpen(emp){
  var r=ikRow(emp); if(!r) return; var pk=ikPickOf(emp);
  drwOpen("ik:"+emp, drwHead(whoOf(r).n||emp, [whoSub(r), IK_CH[r.ch]||IK_CH[IK.ch], fmtD(r.at)].filter(Boolean).join(" · "), whoFlags(whoOf(r))+(r.late?" "+tag("마감 뒤","warn"):""))+
    '<div class="cc-fld">아이디어</div><div class="memo cc-memo">'+(r.text?esc(r.text):'<span class="cap">본문 없음</span>')+'</div>'+
    '<div class="mt">'+(pk?tag(pk.rk+"등 선정","ok")+'<div class="btns mt"><button class="btn" type="button" onclick="ikUnpickAsk(\''+jq(emp)+'\')">선정 취소</button></div>':'<button class="btn pri big" type="button" onclick="ikPickAsk(\''+jq(emp)+'\')">아이디어왕으로 선정</button>')+'</div>'+
    '<div class="mt"><button class="btn big" type="button" onclick="pcOpen(\''+jq(emp)+'\')">한 사람 카드 열기</button></div></div>', { g:MG.ikl, label:"아이디어 후보 상세" });
}
function ikPickAsk(emp){
  var d=S.data.ik||{}, r=ikRow(emp)||{ emp:emp }, prz=ikPrz(d), picks=d.picks||[];
  var opts=prz.map(function(z){ var left=Math.max(0,(Number(z.n)||0)-picks.filter(function(p){ return Number(p.rk)===Number(z.rk); }).length); return '<option value="'+z.rk+'"'+(left?"":" disabled")+'>'+z.rk+'등 · AI 구독권 '+z.mo+'개월 · 남은 자리 '+left+'</option>'; }).join("");
  confirmBox({ t:"아이디어왕으로 선정할까요?", who:personLine({ emp:emp, name:r.name, dept:r.dept }), sub:(IK_CH[r.ch]||IK_CH[IK.ch])+" · Closing Speech 에서 사회자가 이름을 읽음 · 7초 안 되돌리기",
    body:'<label class="fld">등수<select class="in" id="ikRk" onchange="gateUpd()"><option value="">고릅니다</option>'+opts+'</select></label><label class="fld">선정 사유(필수)<input class="in" id="ikWhy" maxlength="80" autocomplete="off" oninput="gateUpd()" placeholder="예: 보상 서류 자동 분류 · 바로 적용 가능"></label>'+
      (r.late?'<label class="up-ck mt"><input type="checkbox" id="ikAck" onchange="gateUpd()"> 마감 뒤 접수 · 그래도 선정합니다</label>':''),
    focus:"ikRk", ok:"선정", gate:function(){ var k=el("ikRk"), w=el("ikWhy"), a=el("ikAck"); return !!(k&&k.value)&&String((w||{}).value||"").trim().length>=2&&(!r.late||!!(a&&a.checked)); },
    run:function(){ return call("ideaking_pick",{ emp:normE(emp), rk:el("ikRk").value, why:String(el("ikWhy").value).trim(), ack:r.late?"1":"" }); },
    fail:function(x){ return x&&x.reason==="max"?"그 등수 자리가 다 찼습니다 · 먼저 한 명을 선정 취소합니다":x&&PZ_WHY2[x.reason]||""; },
    done:function(x){ if(x.picks&&S.data.ik) S.data.ik.picks=x.picks; reload(["ik","ikl"]); paint(); if(DRW.k==="ik:"+emp) ikOpen(emp); toast("선정했습니다 · "+(r.name||emp),{ undo:function(){ ikUnpickGo(emp); } }); } });
}
var PZ_WHY2={ nocand:"후보가 아닌 사번입니다", max:"그 등수는 이미 다 찼습니다", rk:"등수를 고릅니다", why:"사유를 적습니다", early:"마감 시각 전에는 확정할 수 없습니다", nolock:"먼저 대상을 확정합니다", stale:"확정 뒤 바뀌었습니다 · 대상을 다시 확정합니다", drawn:"이미 추첨했습니다", done:"이미 추첨했습니다", rem:"룰렛 잔여를 먼저 저장합니다", notwin:"지금 당첨자가 아닙니다", eventday:"행사일에는 할 수 없습니다" };
function ikUnpickAsk(emp){ var p=ikPickOf(emp)||{ emp:emp }; confirmBox({ t:"선정을 취소할까요?", who:personLine({ emp:emp, name:p.name, dept:p.dept })+(p.rk?" · "+p.rk+"등":""), sub:"후보로 돌아감 · 활동 기록에 남음", ok:"선정 취소", danger:true, run:function(){ return call("ideaking_unpick",{ emp:normE(emp) }); }, done:function(){ ikAfterUnpick(emp); toast("선정을 취소했습니다 · "+emp); } }); }
function ikUnpickGo(emp){ call("ideaking_unpick",{ emp:normE(emp) }).then(function(x){ if(x&&x.ok){ ikAfterUnpick(emp); toast("되돌렸습니다 · "+emp); } else toast("되돌리지 못했습니다 · "+why(x),{ bad:1 }); }); }
function ikAfterUnpick(emp){ var d=S.data.ik; if(d&&d.picks) d.picks=d.picks.filter(function(p){ return normE(p.emp)!==normE(emp); }); reload(["ik","ikl"]); paint(); if(DRW.k==="ik:"+emp) ikOpen(emp); }

/* ══ 7등 랜덤 굿즈 ══ */
var LK={ ver:null, vo:{ emp:"", why:"" } };
var LK_PH={ open:["마감 전","off"], wait:["마감 · 확정 전","warn"], lock:["대상 확정",""], drawn:["추첨 완료","ok"] };
function lkRemDone(d){ return !!(d&&(d.rem||(d.stock&&d.stock.src==="rem"))); }
function lkLeft(d){ var q={}, sk=(d&&d.stock)||{}; (sk.parts||[]).forEach(function(x){ q[x.id]=num(x.left); }); if(d&&d.rem&&d.rem.q) Object.keys(d.rem.q).forEach(function(k){ q[k]=num(d.rem.q[k]); }); return q; }
function lkTotal(d){ var q=lkLeft(d), t=0; LK_ROUL.forEach(function(x){ t+=q[x[0]]||0; }); return t; }
function lkQty(d){ return num(d.qty!=null?d.qty:(d.cfg||{}).qty); }
function lkPaint(){
  var b=el("lkB"); if(!b) return; var d=S.data.lk, gt=dataGate("lk","7등 랜덤 굿즈"); if(gt){ b.innerHTML=gt; return; }
  var P=LK_PH[d.ph]||["-",""], pool=d.pool||{}, qty=lkQty(d), dr=d.draw||null, tot=lkTotal(d), rem=lkRemDone(d), q=lkLeft(d);
  var steps=[["마감 "+String(d.cut||"").slice(11,16), d.ph!=="open"],["17:00 룰렛 잔여", rem],["대상 확정", d.ph==="lock"||d.ph==="drawn"],["추첨", d.ph==="drawn"]], cur=-1;
  for(var i=0;i<steps.length;i++) if(!steps[i][1]){ cur=i; break; }
  var h='<ol class="up-steps mb">'+steps.map(function(x,i){ return '<li class="'+(x[1]?"done":i===cur?"on":"")+'"><b>'+(i+1)+'</b>'+esc(x[0])+'</li>'; }).join("")+'</ol>';
  if(d.tx) h+='<div class="mb">'+band("info",esc(String(d.tx)))+'</div>';
  h+='<div class="grid g4 mb">'+kpi({ l:d.ph==="lock"||d.ph==="drawn"?"대상(확정)":"대상(미리 보기)", v:n0(d.lock&&d.lock.n!=null?d.lock.n:pool.n), u:"명", s:"1~6등 "+n0(pool.lucky)+" · 시험 "+n0(pool.test)+" 제외" })+kpi({ l:"당첨 수", v:n0(qty), u:"명", s:"사람마다 남은 경품에서 무작위" })+
    kpi({ l:"남은 경품", v:n0(tot), u:"개", st:tot<qty?"warn":"", s:tot<qty?"당첨 수보다 "+n0(qty-tot)+"개 적음":rem?"17:00 실사 기준":"계산값 · 실사 전" })+kpi({ l:"당첨", v:dr?n0(dr.W):"-", u:dr?"명":"", s:dr?"추첨 "+fmtD(dr.at||""):"행사 뒤 추첨" })+'</div>';
  var remT='<div class="card"><h2>17:00 룰렛 잔여 '+(rem?tag("저장됨","ok"):tag("아직","warn"))+'</h2><table class="tb"><tbody>'+LK_ROUL.map(function(x){ return '<tr><td>'+esc(x[1])+'</td><td class="n"><b>'+n0(q[x[0]]||0)+'</b></td></tr>'; }).join("")+'</tbody></table><div class="btns mt"><button class="btn" type="button" onclick="lkRem()"'+(d.ph==="drawn"?' aria-disabled="true"':'')+'>17:00 잔여 입력</button></div></div>';
  var act;
  if(dr){ var v=LK.ver;
    act='<div class="card"><h2>추첨 결과 <span class="cap">이름 없이 숫자만 · 명단은 엑셀</span></h2><dl class="cc-kv"><dt>추첨 번호</dt><dd>'+esc(dr.id||"-")+'</dd><dt>시각</dt><dd>'+esc(fmtD(dr.at||""))+(dr.by?" · "+esc(dr.by):"")+'</dd><dt>대상 · 당첨</dt><dd>'+n0(dr.N)+'명 · '+n0(dr.W)+'명</dd><dt>시드</dt><dd class="cap">'+esc(String(dr.seed||"").slice(0,24))+'</dd></dl>'+
      '<div class="btns mt"><button class="btn" type="button" onclick="lkVerify()">재현 검증</button><button class="btn" type="button" onclick="lkXls()">사내 우편 엑셀</button></div>'+(v?(v.ok&&v.same?band("info","재현 같음 · 저장된 시드 · 대상으로 다시 계산해 기록과 같습니다"):band("bad","재현 결과가 다릅니다 · "+esc(v.ok?"다른 줄 "+(v.nDiff||"?")+"개":why(v)))):"")+
      '<div class="cc-fld mt">당첨 교체 · 발송 불가 · 자격 취소 · 예비 1순위가 이어받음</div><div class="nt-row mt4"><input class="xg-q" id="lkVE" style="width:120px" inputmode="numeric" placeholder="사번" value="'+esc(LK.vo.emp)+'" oninput="LK.vo.emp=this.value"><input class="xg-q" id="lkVW" maxlength="60" placeholder="사유 · 예: 퇴사 · 발송 불가" value="'+esc(LK.vo.why)+'" oninput="LK.vo.why=this.value"><button class="btn" type="button" onclick="lkVoidAsk()">미리 보기</button></div></div>';
  } else {
    var N=d.lock?num(d.lock.n):num(pool.n), ready=d.ph==="lock"&&!d.stale;
    act='<div class="card"><h2>대상 확정 · 추첨 '+tag(P[0],P[1])+'</h2><dl class="cc-kv"><dt>행운권 보유</dt><dd>'+n0(num(pool.n)+num(pool.lucky))+'명</dd><dt>1~6등 제외</dt><dd>'+n0(pool.lucky)+'명</dd><dt>대상</dt><dd><b>'+n0(N)+'명</b></dd><dt>당첨(예상)</dt><dd>'+n0(Math.min(N,qty))+'명</dd></dl>'+
      (d.stale?band("warn","확정 뒤 기록이 바뀌었습니다 · 다시 확정해야 추첨합니다"):"")+
      '<div class="btns mt"><button class="btn pri" type="button" onclick="lkLockAsk()"'+(d.ph==="open"||!rem?' aria-disabled="true"':'')+'>'+(d.ph==="lock"?"다시 확정":"대상 확정")+'</button><button class="btn dng fill" type="button" onclick="lkDrawAsk()"'+(ready&&rem?'':' aria-disabled="true"')+'>7등 추첨 실행</button></div>'+
      '<p class="cap mt4">'+(d.ph==="open"?esc(String(d.cut||"").slice(0,16))+" 뒤에 확정합니다":!rem?"17:00 룰렛 잔여 다섯 숫자를 먼저 저장합니다":d.ph==="lock"&&d.lock?"확정 "+esc(fmtD(d.lock.at||""))+" · "+n0(d.lock.n)+"명":"확정하면 대상이 기록에 남습니다")+'</p></div>';
  }
  b.innerHTML=h+'<div class="grid g2">'+act+remT+'</div>';
}
function lkLockAsk(){
  var d=S.data.lk||{}, pool=d.pool||{};
  if(d.ph==="open"){ toast("마감 시각 "+String(d.cut||"").slice(11,16)+" 뒤에 확정합니다"); return; }
  if(!lkRemDone(d)){ toast("17:00 룰렛 잔여를 먼저 저장합니다"); return; }
  confirmBox({ t:"7등 대상을 확정할까요?", who:"대상 "+n0(pool.n)+"명 · 1~6등 "+n0(pool.lucky)+"명 제외", sub:"17:00 룰렛 잔여 "+n0(lkTotal(d))+"개 · 추첨 전까지 다시 확정할 수 있음", ok:d.ph==="lock"?"다시 확정":"확정",
    run:function(){ return call("lk7_lock",{}); }, fail:function(r){ return r&&PZ_WHY2[r.reason]||""; }, done:function(r){ reload(["lk"]); toast("대상 "+n0(r.locked&&r.locked.n)+"명을 확정했습니다"); } });
}
function lkDrawAsk(){
  var d=S.data.lk||{}, qty=lkQty(d), tot=lkTotal(d), N=d.lock?num(d.lock.n):0;
  if(!(d.ph==="lock"&&!d.stale&&lkRemDone(d))){ toast(!lkRemDone(d)?"17:00 룰렛 잔여를 먼저 저장합니다":"먼저 대상을 확정합니다"); return; }
  confirmBox({ t:"7등 랜덤 굿즈 추첨을 실행할까요?", who:"대상 "+n0(N)+"명 · 당첨 "+n0(Math.min(N,qty))+"명", sub:"되돌릴 수 없음 · 당첨자에게 앱 알림 · 재현 검증으로 다시 계산",
    body:(tot<qty?band("warn","남은 경품 "+n0(tot)+"개 · 당첨 "+n0(qty)+"명보다 적습니다"):"")+'<label class="fld">확인 문구 「추첨」을 넣습니다<input class="in" id="lkW" autocomplete="off" oninput="gateUpd()"></label>',
    focus:"lkW", ok:"추첨 실행", danger:true, gate:function(){ var i=el("lkW"); return !!i&&i.value.trim()==="추첨"; },
    run:function(){ return call("lk7_draw",{ ack:"1" }); }, fail:function(r){ return r&&PZ_WHY2[r.reason]||""; },
    done:function(r){ reload(["lk"]); toast("추첨했습니다 · 당첨 "+n0(r.drawn&&r.drawn.W)+"명"+(r.push!=null?" · 알림 "+n0(r.push)+"명":""),{ ms:5000 }); } });
}
function lkVerify(){ call("lk7_verify",{}).then(function(r){ LK.ver=r||{ ok:false }; paint(); toast(r&&r.ok&&r.same?"재현 결과가 같습니다":"재현 결과를 확인합니다"); }); }
function lkVoidAsk(){
  var e=normE(LK.vo.emp), w=String(LK.vo.why||"").trim();
  if(!/^[0-9A-Z]{3,12}$/.test(e)){ toast("사번을 확인합니다"); return; }
  if(w.length<2){ toast("사유를 적습니다"); return; }
  call("lk7_void",{ emp:e, dry:"1" }).then(function(r){
    if(!r||!r.ok){ toast("교체할 수 없습니다 · "+(r&&PZ_WHY2[r.reason]||why(r)),{ bad:1 }); return; }
    confirmBox({ t:"이 당첨을 취소할까요?", who:personLine({ emp:e, name:r.name, dept:r.dept })+" · 7등 랜덤 굿즈", sub:"사유 "+w+" · "+(r.sub?"승계 "+personLine(r.sub)+(r.sub.rk?" (예비 "+r.sub.rk+"순위)":""):"예비 없음 · 경품 보관")+" · 되돌릴 수 없음", ok:"당첨 취소", danger:true,
      run:function(){ return call("lk7_void",{ emp:e, why:w }); }, fail:function(x){ return x&&PZ_WHY2[x.reason]||""; },
      done:function(x){ LK.vo={ emp:"", why:"" }; reload(["lk"]); toast("취소했습니다"+(x.sub?" · 예비 승계":" · 경품 보관"),{ ms:5000 }); } });
  });
}
/* 사내 우편 엑셀 · lk7_export 줄을 공통 표 내려받기 모양으로 */
function lkXls(){
  confirmBox({ t:"7등 당첨 명단을 엑셀로 내려받을까요?", who:"7등 랜덤 굿즈 사내 우편", sub:"순번 · 사번 · 이름 · 부문 · 당첨 번호 · 당첨 시각 · 개인정보 파일", ok:"엑셀 다운로드",
    run:function(){ return call("lk7_export",{}).then(function(r){ if(!r||!r.ok) return r||{ ok:false };
      var g=MG.lk7x||gridOf("lk7x",{ file:"7등 사내 우편", whoFull:1, key:function(x){ return x.emp; }, cols:[{ k:"no", t:"순번", type:"num", w:60 },{ k:"emp", t:"사번", w:90 },{ k:"name", t:"이름", w:100 },{ k:"dept", t:"소속", w:160 },{ k:"set", t:"당첨 번호", w:90 },{ k:"at", t:"당첨 시각", type:"date", w:120 }] });
      g.rows=r.rows||[]; return xgFile(g, g.rows); }); },
    done:function(x){ toast("내려받았습니다 · "+x.name); } });
}
