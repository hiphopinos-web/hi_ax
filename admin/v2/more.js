/* AXF CONTROL v2 · S3 사람 · S5 무대 · S6 알림 · S7 기록 · 설정 (261016 · 이번 단계 = 명단 표로 보기만 + 앱 접속 범위)
 * 넣기 · 빼기 · 한 사람 카드 · 추첨 진행 · 보내기 · 예약은 아직 옛 콘솔에서 한다(「옛 콘솔에서」 링크). */
var TEN_N={ fld:"A 영업 · 보상", ta:"B 통계 리포팅", tb:"C 리서치 자동화", aws:"D 바이브 코딩", ms1:"E MS Copilot 1회", ms2:"E MS Copilot 2회" };
function yes(v){ return v?"예":""; }
function subsOf(list, def){ var s=S.sub[S.tab]; return list.some(function(x){ return x[0]===s; })?s:def; }
function chipsH(list, cur){ return '<div class="chips" role="tablist">'+list.map(function(x){ return '<button type="button" role="tab" aria-selected="'+(x[0]===cur)+'" class="chip'+(x[0]===cur?" on":"")+'" onclick="goSub(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</div>'; }
/* 공통 · 명단 표 한 장을 데이터 키에 붙인다 */
var MG={};
function gridOf(id, spec){ if(!MG[id]) MG[id]=XG.make(Object.assign({ id:id }, spec)); return MG[id]; }
function gridPaint(id, k, label, rowsOf){ var g=MG[id], gt=dataGate(k,label); g.gate=gt||""; XG.set(g, gt?null:rowsOf(S.data[k]), el("mg_"+id)); }

/* ── S3 사람 ── */
var PP_SUBS=[["find","가입자"],["gate","접속 허용"],["staff","스태프"],["pre10","10F 사전 신청"],["att10","10F 출석"],["lounge","라운지 사전"],["idea","아이디어"]];
var PP_SPEC={
  find:{ k:"acct", lg:"visit", a:"acct_page", p:function(){ return { q:S.ui.pq||"", n:2000, sort:"joined" }; }, label:"가입자", file:"가입자", rows:function(d){ return d.rows||[]; }, sort:{ k:"joined", d:-1 },
    chips:[["all","전체",null],["today","오늘 접속",function(r){ return !!r.today; }],["pw0","PIN 대기",function(r){ return !r.pw; }],["st3","스탬프 3개 이상",function(r){ return num(r.n)>=3; }],["nolog","접속 없음",function(r){ return !!r.nolog; }]],
    cols:[{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"부서", w:130 },{ k:"n", t:"스탬프", type:"num", w:70 },{ k:"joined", t:"가입", type:"date", w:100 },{ k:"last", t:"최근 접속", type:"date", w:100 },{ k:"pw", t:"PIN", w:70, v:function(r){ return r.pw?"있음":"대기"; } },{ k:"today", t:"오늘", w:60, v:function(r){ return yes(r.today); } }] },
  gate:{ k:"rl_gate", lg:"gate", a:"roll_list", p:function(){ return { list:"gate" }; }, rd:1, label:"접속 허용 명단", file:"접속 허용", rows:function(d){ return d.rows||[]; }, sort:{ k:"at", d:-1 },
    chips:[["all","전체",null],["acct","가입",function(r){ return !!r.acct; }],["no","가입 전",function(r){ return !r.acct; }],["today","오늘 접속",function(r){ return !!r.today; }]],
    cols:[{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"부서", w:130 },{ k:"memo", t:"메모", w:120 },{ k:"at", t:"넣은 시각", type:"date", w:100 },{ k:"byName", t:"넣은 사람", w:90, v:function(r){ return r.byName||r.by||""; } },{ k:"last", t:"최근 접속", type:"date", w:100 }] },
  staff:{ k:"rl_staff", lg:"staff", a:"roll_list", p:function(){ return { list:"staff" }; }, rd:1, label:"스태프 명단", file:"스태프", rows:function(d){ return d.rows||[]; }, sort:{ k:"name", d:1 },
    chips:[["all","전체",null],["app","폰 권한",function(r){ return !!r.app; }],["wear","옷",function(r){ return !!r.wear; }],["today","오늘 접속",function(r){ return !!r.today; }]],
    cols:[{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"부서", w:130 },{ k:"app", t:"폰 권한", w:70, v:function(r){ return yes(r.app); } },{ k:"wear", t:"옷", w:50, v:function(r){ return yes(r.wear); } },{ k:"sz", t:"사이즈", w:70 },{ k:"scan30", t:"30분 스캔", type:"num", w:80 },{ k:"last", t:"최근 접속", type:"date", w:100 }] },
  pre10:{ k:"rl_pre10", lg:"pre10", a:"roll_list", p:function(){ return { list:"pre10" }; }, rd:1, label:"10F 사전 신청 명단", file:"10F 사전 신청", rows:function(d){ return d.rows||[]; }, sort:{ k:"sid", d:1 },
    chips:[["all","전체",null]].concat(Object.keys(TEN_N).map(function(s){ return [s, TEN_N[s].split(" ")[0]+(s==="ms1"?"1":s==="ms2"?"2":""), function(r){ return r.sid===s; }]; })),
    cols:[{ k:"sid", t:"세션", w:130, v:function(r){ return TEN_N[r.sid]||r.sid; } },{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"부서", w:130 },{ k:"role", t:"구분", w:70 },{ k:"size", t:"사이즈", w:70 },{ k:"at", t:"신청 시각", type:"date", w:100 },{ k:"last", t:"최근 접속", type:"date", w:100 }] },
  att10:{ k:"att10", lg:"att10", a:"att_stats", p:function(){ return { who:"1" }; }, label:"10F 출석", file:"10F 출석", noKey:1,
    rows:function(d){ var o=[]; (d.ten||[]).forEach(function(x){ (x.ppl||[]).forEach(function(p){ o.push({ sid:x.id, n:p.n, d:p.d, "in":p["in"], out:p.out, x:0 }); }); (x.xs||[]).forEach(function(p){ o.push({ sid:x.id, n:p.n, d:p.d, "in":p["in"], out:p.out, x:1 }); }); }); return o; }, sort:{ k:"sid", d:1 },
    chips:[["all","전체",null],["in","입장",function(r){ return !!r["in"]; }],["noin","입장 안 함",function(r){ return !r["in"]&&!r.x; }],["out","종료",function(r){ return !!r.out; }],["x","명단 밖",function(r){ return !!r.x; }]],
    cols:[{ k:"sid", t:"세션", w:130, v:function(r){ return TEN_N[r.sid]||r.sid; } },{ k:"n", t:"이름", w:100 },{ k:"d", t:"부서", w:130 },{ k:"in", t:"입장", w:70 },{ k:"out", t:"종료", w:70 },{ k:"x", t:"구분", w:80, v:function(r){ return r.x?"명단 밖":"신청자"; } }] },
  lounge:{ k:"rl_lng", lg:"lounge_pre", a:"roll_list", p:function(){ return { list:"lounge" }; }, rd:1, label:"라운지 사전 명단", file:"라운지 사전", rows:function(d){ return d.rows||[]; }, sort:{ k:"rk", d:1 },
    chips:[["all","전체",null],["kit","키트",function(r){ return !!r.kit; }],["hum","가습기 대체",function(r){ return !r.kit; }],["got","받음",function(r){ return !!r.got; }]],
    cols:[{ k:"rk", t:"순번", type:"num", w:56 },{ k:"name", t:"이름", w:100 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"부서", w:130 },{ k:"kit", t:"받을 것", w:90, v:function(r){ return r.kit?"키트":"가습기"; } },{ k:"sz", t:"사이즈", w:70 },{ k:"got", t:"받은 시각", type:"date", w:100 }] },
  idea:{ k:"idl", lg:"idea", a:"idea_list", p:function(){ return {}; }, label:"아이디어 목록", file:"아이디어 한 줄", rows:function(d){ return d.rows||[]; }, sort:{ k:"ts", d:-1 },
    chips:[["all","전체",null],["app","앱",function(r){ return r.ch==="app"; }],["site","현장",function(r){ return r.ch&&r.ch!=="app"; }],["hid","숨김",function(r){ return !!r.hidden; }]],
    cols:[{ k:"ts", t:"시각", type:"date", w:100 },{ k:"name", t:"이름", w:90, v:function(r){ return r.anon?"(익명) "+r.name:r.name; } },{ k:"dept", t:"부서", w:120 },{ k:"tag", t:"태그", w:70 },{ k:"text", t:"내용", w:320 },{ k:"ch", t:"경로", w:60 }] }
};
SCREENS.people={
  title:"사람", desc:"",
  need:function(){ var s=subsOf(PP_SUBS,"find"), x=PP_SPEC[s]; return [s==="find"&&S.ui.pq?{ k:x.k, a:x.a, p:x.p(), ttl:60000 }:lgNeed(x.k, x.lg, { a:x.a, p:x.p(), rd:x.rd })]; },
  mount:function(vb){ var s=subsOf(PP_SUBS,"find"), x=PP_SPEC[s];
    el("phCap").textContent="명단 보기 · 검색 · 엑셀 · 이번 단계는 보기만";
    gridOf("pp_"+s,{ file:x.file, key:x.noKey?null:function(r){ return r.emp; }, sort:x.sort, chips:x.chips, cols:x.cols, src:{ a:x.a, p:x.p(), pick:x.rows }, lg:x.lg, h:480 });
    if(s==="find"&&S.ui.pq) MG["pp_find"].q="";
    vb.innerHTML=chipsH(PP_SUBS,s)+'<div class="card">'+(s==="find"?'<div class="cap mb">'+(S.ui.pq?"상단 찾기 「"+esc(S.ui.pq)+"」 결과 · ":"")+'가입한 사람 · 시험 사번 포함</div>':'')+'<div id="mg_pp_'+s+'"></div></div>'+oldLink("한 사람 카드(스탬프 부여 · 취소 · PIN 초기화) · 명단에 넣기 · 빼기");
  },
  paint:function(){ var s=subsOf(PP_SUBS,"find"), x=PP_SPEC[s], g=MG["pp_"+s]; gridPaint("pp_"+s, x.k, x.label, function(d){ return lgRows(x.k, g, x.rows); }); }
};
function peopleQ(q){ S.ui.pq=q; S.at.acct=0; render(); load(true,["acct"]); }

/* ── S5 무대 ── */
SCREENS.stage={
  title:"무대", desc:"Closing 추첨 기록 · 16:00부터",
  need:function(){ return [{ k:"draw", a:"draw_stats", ttl:15000 }]; },
  mount:function(vb){
    gridOf("draw",{ file:"추첨 기록", key:function(r){ return r.id; }, sort:{ k:"t", d:-1 },
      chips:[["all","전체",null],["ok","유효",function(r){ return r.st!=="undo"; }],["undo","취소",function(r){ return r.st==="undo"; }]],
      cols:[{ k:"t", t:"시각", type:"date", w:96 },{ k:"round", t:"회차", w:70 },{ k:"prize", t:"상품", w:150 },{ k:"no", t:"행운권", w:80 },{ k:"name", t:"이름", w:100, v:function(r){ return r.name||r.nm; } },{ k:"dept", t:"부서", w:130 },{ k:"st", t:"상태", w:70 },{ k:"ack", t:"확인", w:60 }],
      src:{ a:"draw_stats", p:{}, pick:function(r){ return r.recs; } }, empty:"아직 추첨 기록이 없습니다", h:420 });
    vb.innerHTML='<div class="grid g4 mb" id="stK"></div><div class="card"><h2>당첨 기록</h2><div id="mg_draw"></div></div>'+oldLink("추첨 진행 단추 · 아이디어왕 · 타자왕 · 7등");
  },
  paint:function(){
    var d=S.data.draw, g=dataGate("draw","추첨");
    el("stK").innerHTML=g?'<div style="grid-column:1/-1">'+g+'</div>':kpi({ l:"추첨 대상", v:n0(d.pool&&d.pool.n), u:"명" })+kpi({ l:"행운권", v:n0(d.pool&&d.pool.balls), u:"장" })+kpi({ l:"당첨", v:n0(d.wins), u:"명" })+kpi({ l:"추첨 화면", v:d.scr?"연결":"없음", st:d.scr?"ok":"warn", stt:d.scr?"정상":"주의", s:"창 "+(d.win||"") });
    gridPaint("draw","draw","추첨",function(x){ return x.recs||[]; });
  }
};

/* ── S6 알림 ── */
var NT_SUBS=[["push","푸시 기록"],["notice","공지 기록"]];
SCREENS.notify={
  title:"알림", desc:"보낸 푸시 · 공지 기록 · 보내기와 예약은 옛 콘솔에서",
  need:function(){ return subsOf(NT_SUBS,"push")==="push"?[{ k:"phist", a:"push_hist", p:{ n:200 }, ttl:30000 }]:[{ k:"nhist", a:"notice_hist", p:{ n:100 }, ttl:30000 }]; },
  mount:function(vb){ var s=subsOf(NT_SUBS,"push");
    if(s==="push") gridOf("push",{ file:"푸시 기록", key:function(r){ return r.id; }, sort:{ k:"made", d:-1 },
      chips:[["all","전체",null],["fail","실패 있음",function(r){ return num(r.fail)>0; }]],
      cols:[{ k:"made", t:"만든 시각", type:"date", w:96 },{ k:"kname", t:"종류", w:90 },{ k:"title", t:"제목", w:180 },{ k:"desc", t:"대상", w:120 },{ k:"n", t:"인원", type:"num", w:60 },{ k:"ok", t:"성공", type:"num", w:60 },{ k:"fail", t:"실패", type:"num", w:60 },{ k:"st", t:"상태", w:70 },{ k:"by", t:"보낸 사람", w:90 }],
      src:{ a:"push_hist", p:{ n:200 } }, empty:"보낸 기록이 없습니다", h:460 });
    else gridOf("notice",{ file:"공지 기록", key:function(r){ return r.id; }, sort:{ k:"at", d:-1 },
      cols:[{ k:"at", t:"시각", type:"date", w:96 },{ k:"title", t:"제목", w:180 },{ k:"body", t:"내용", w:260 },{ k:"desc", t:"대상", w:110 },{ k:"to", t:"인원", type:"num", w:60 },{ k:"reach", t:"푸시 도달", type:"num", w:80 },{ k:"by", t:"보낸 사람", w:90 }],
      src:{ a:"notice_hist", p:{ n:100 } }, empty:"보낸 기록이 없습니다", h:460 });
    vb.innerHTML=chipsH(NT_SUBS,s)+'<div class="card"><div id="mg_'+s+'"></div></div>'+oldLink("보내기 · 예약 · 푸시 정지");
  },
  paint:function(){ var s=subsOf(NT_SUBS,"push"); if(s==="push") gridPaint("push","phist","푸시 기록",function(d){ return d.rows||[]; }); else gridPaint("notice","nhist","공지 기록",function(d){ return d.rows||[]; }); }
};

/* ── S7 기록 · 설정 · 급한 단추 3개 중 「앱 범위」(PIN 매번) + 활동 기록 ── */
var OG_OPT=[["클로즈베타","클로즈 베타","접속 허용 명단 + 스태프"],["사전신청","사전 신청","사전 신청자 + 스태프 + 허용 명단"],["전체","전체","전 임직원"],["자동","자동","날짜대로(10/19 사전 신청 · 10/21 전체)"],["종료","행사 종료","앱 닫힘 안내 · 10/27 클로즈"]];
var OG_PH={ beta:"클로즈 베타", first:"사전 신청", all:"전체", end:"행사 종료", test:"클로즈 베타" };
var OG_CNT={ "클로즈베타":"beta", "사전신청":"first", "전체":"all", "자동":"auto", "종료":"end" };
var LOG_CAT=[["all","전체",null],["p","사람",function(r){ return r.cat==="p"; }],["r","명단",function(r){ return r.cat==="r"; }],["s","스탬프 · 경품",function(r){ return r.cat==="s"; }],["n","알림",function(r){ return r.cat==="n"; }],["c","설정",function(r){ return r.cat==="c"; }],["x","스캔",function(r){ return r.cat==="x"; }]];
SCREENS.log={
  title:"기록 · 설정", desc:"앱 접속 범위 · 급한 단추 · 오늘 활동 기록",
  need:function(){ return [{ k:"ogs", a:"og_scope_state", ttl:30000, rd:1 },{ k:"alog", a:"act_log", p:{ n:200 }, ttl:30000 }]; },
  mount:function(vb){
    gridOf("alog",{ file:"활동 기록", key:null, sort:{ k:"t", d:-1 }, chips:LOG_CAT,
      cols:[{ k:"t", t:"시각", type:"date", w:96 },{ k:"verb", t:"한 일", w:70 },{ k:"x", t:"내용", w:300 },{ k:"name", t:"대상", w:100, v:function(r){ return r.name||r.emp||""; } },{ k:"byName", t:"처리자", w:100, v:function(r){ return r.byName||r.by||""; } },{ k:"byK", t:"어디서", w:70 },{ k:"res", t:"결과", w:70 }],
      src:{ a:"act_log", p:{ n:200 }, pick:function(r){ return r.rows; } }, empty:"오늘 기록이 없습니다", h:420 });
    vb.innerHTML='<div class="grid g32"><div class="card" id="ogC"></div><div class="col"><div class="card"><h2>급한 단추</h2>'+
      rowH("앱 접속 범위","왼쪽 칸 · 바꿀 때마다 PIN",'<span class="tag">이 화면</span>')+
      rowH("룰렛 소진 안내","경품 · 재고 › 룰렛",'<button class="btn sm" type="button" onclick="go(\'prize\')">열기</button>')+
      rowH("푸시 정지","이번 단계는 옛 콘솔 › 알림",'<a class="btn sm" href="'+OLD_URL+'" target="_blank" rel="noopener">옛 콘솔</a>')+'</div>'+oldLink("서버 상태 · 화면 주소 · QR · 스태프 코드")+'</div></div>'+
      '<div class="card mt"><h2>활동 기록 <span class="cap">오늘 · 최근 200줄</span></h2><div id="mg_alog"></div></div>';
  },
  paint:function(){ ogPaint(); gridPaint("alog","alog","활동 기록",function(d){ return d.rows||[]; }); }
};
function ogCur(){ var s=S.data.ogs, b=S.data.nb; return s&&s.ok?{ sc:s.sc, ph:s.ph, cnt:s.cnt, t1:s.t1, t2:s.t2 }:b&&b.ok&&b.og?{ sc:b.og.sc, ph:b.og.ph, cnt:null, t1:b.og.t1, t2:b.og.t2 }:null; }
function ogPaint(){
  var c=ogCur(), box=el("ogC"); if(!box) return;
  if(!c){ box.innerHTML='<h2>앱 접속 범위</h2>'+(dataGate("nb","진행판")||skel()); return; }
  var spin=S.data.ogs&&S.data.ogs.reason==="spin";
  box.innerHTML='<h2>앱 접속 범위 <span class="cap">지금 들어올 수 있는 사람</span><span class="r">'+tag("지금 "+(OG_OPT.filter(function(o){ return o[0]===c.sc; })[0]||[0,c.sc])[1]+(c.sc==="자동"?" · "+(OG_PH[c.ph]||c.ph):""),c.sc==="종료"?"bad":"")+'</span></h2>'+
    OG_OPT.map(function(o){ var on=o[0]===c.sc, n=c.cnt&&c.cnt[OG_CNT[o[0]]];
      return '<div class="row"><div class="t"><b>'+esc(o[1])+(on?' '+tag("지금","ok"):'')+'</b><span>'+esc(o[2])+(n!=null&&o[0]!=="종료"?" · 약 "+n0(n)+"명":"")+'</span></div>'+(on?'':'<button class="btn sm lock'+(o[0]==="종료"?" dng":"")+'" type="button" onclick="ogSet(\''+o[0]+'\')">'+esc(o[0]==="종료"?"행사 종료로":"이 범위로")+'</button>')+'</div>'; }).join("")+
    (spin?'<div class="cap mt">명단별 인원은 PIN 확인 뒤 보입니다 · <button class="btn sm" type="button" onclick="readPinAsk()">PIN 넣고 보기</button></div>':'')+
    '<p class="cap mt">자동 = '+esc(String(c.t1||"").slice(5,16))+' 사전 신청 · '+esc(String(c.t2||"").slice(5,16))+' 전체 · 행사 종료는 자동으로 바뀌지 않습니다</p>';
}
function ogSet(sc){
  var c=ogCur()||{}, o=OG_OPT.filter(function(x){ return x[0]===sc; })[0], from=(OG_OPT.filter(function(x){ return x[0]===c.sc; })[0]||[0,c.sc])[1], n=c.cnt&&c.cnt[OG_CNT[sc]];
  confirmBox({ t:sc==="종료"?"앱을 행사 종료로 바꿀까요?":"앱 접속 범위를 바꿀까요?", who:from+" → "+o[1], sub:o[2]+(n!=null&&sc!=="종료"?" · 약 "+n0(n)+"명":"")+" · 참가자 앱에 바로 반영", ok:sc==="종료"?"행사 종료로 바꾸기":"범위 바꾸기", danger:sc==="종료"||sc==="클로즈베타", pin:true,
    run:function(pp){ return call("og_scope_set",Object.assign({ sc:sc },pp)); },
    done:function(r){ if(S.data.ogs&&S.data.ogs.ok){ S.data.ogs.sc=r.sc; S.data.ogs.ph=r.ph; } if(S.data.nb&&S.data.nb.og){ S.data.nb.og.sc=r.sc; S.data.nb.og.ph=r.ph; } paint(); reload(["ogs","nb","alog"]); toast("앱 접속 범위 · "+o[1]); } });
}
