/* AXF CONTROL v2 · 처리함 › AX 라운지 · 사전 명단 넣기 · 빼기 (261016 사용자 결정 · 261016 저녁 표 위 「추가」 창 · 선택 삭제로 옮김 · edit.js paOpen · table.js)
 * 넣기 = lng_pre_row_add(POST · PIN 없음 · emp · time · seat · memo) · 시간 없으면 칸 미정 · 상담석은 시간과 함께
 *   거절 = param · noros · dup · time · seat · cap · clash(with = 그 자리 사번) → 쉬운 한국어로 확인 창에 표시
 * 빼기 = lng_pre_row_del(POST · emp) · 거절 = param · notfound · done(체크인 · 완료 줄 있음 · cur = 그 상태)
 * 시간 · 상담석 바꾸기는 resv_move(미팅 탭 시간표 · meet.js) 그대로 · 줄 되돌리기는 활동 기록(서버가 lng_pre 종류를 되돌림)
 * 넣은 뒤 · 뺀 뒤 표와 배치판을 다시 읽는다(reload resv) · 입력은 처리함 갱신(5초)이 지우지 않게 한 번만 그린다 */
var LA={ time:"", seat:0, memo:"", pre:0, day:"" };   /* 261021 day = 상담일(날짜 칩 · 기본 = 미팅 탭에서 고른 날짜) */
var LA_WHY={ day:"라운지 날짜가 아닙니다", param:"사번을 확인하세요", noros:"명부에 없는 사번입니다", dup:"이미 라운지 명단에 있습니다", time:"그 시간은 칸 밖입니다", seat:"미팅룸이 범위 밖이거나, 시간 없이 미팅룸만 골랐습니다", cap:"그 칸은 정원이 찼습니다", self:"같은 사람이 그 날 그 시간에 이미 있습니다" };   /* 261022 self = 한 사람 여러 과제 · 같은 날 같은 칸 */
var LA_DWHY={ param:"사번을 확인하세요", notfound:"라운지 명단에 없습니다 · 목록을 다시 받습니다" };
function laWhoAt(emp){ var e=normE(emp), r=((S.data.resv&&S.data.resv.rows)||[]).filter(function(x){ return normE(x.emp)===e; })[0]; return personLine(r||{ emp:emp }); }
function laFail(r){
  if(!r) return "";
  if(r.reason==="clash") return "같은 칸 같은 미팅룸에 "+laWhoAt(r.with)+" 님이 있습니다";
  return LA_WHY[r.reason]||"";
}
/* 261022 (사용자 「한 사람 여러 과제」) 이 사람의 라운지 줄 모두(취소 제외 · 날짜 · 시간 순) */
function laAll(emp){ var e=normE(emp); return ((S.data.resv&&S.data.resv.rows)||[]).filter(function(x){ return normE(x.emp)===e&&x.status!=="취소"; }).sort(function(a,b){ var p=(a.day||"")+" "+(hm(a.slot)||"99:99"), q=(b.day||"")+" "+(hm(b.slot)||"99:99"); return p<q?-1:p>q?1:0; }); }
function laAt(x){ return (x.day&&typeof mtDl==="function"?mtDl(x.day)+" ":"")+(hm(x.slot)||"칸 미정"); }
/* 이 사람의 지금 라운지 줄(취소 제외) */
function laHave(emp){ var e=normE(emp); return ((S.data.resv&&S.data.resv.rows)||[]).filter(function(x){ return normE(x.emp)===e&&x.status!=="취소"; })[0]||null; }
/* 261016 저녁 「추가」 창(edit.js paOpen · 맨 위 「한 사람 넣기」 카드 대신) · 시간 · 상담석 · 메모 고르기 */
function laTime(t){ LA.time=LA.time===t?"":t; if(!LA.time) LA.seat=0; paPaint(); }
function laSeat(s){ LA.seat=LA.seat===s?0:s; paPaint(); }
function laDay(d){ if(LA.day===d) return; LA.day=d; LA.seat=0; LG.P=lgPlace((S.data.resv&&S.data.resv.rows)||[], d); paPaint(); }
function laSp(){
  LA.time=""; LA.seat=0; LA.memo=""; LA.day=typeof mtLnDay==="function"?mtLnDay():"";
  return { t:"AX 라운지 사전 명단 추가", cap:"명부에서 찾기 → 시간 · 미팅룸 고르기 → 넣기 · 시간을 비우면 칸 미정 · 키트명단 라운지 줄과 상담 신청 줄이 같이 생김 · 이미 있는 사람 = 추가 상담 한 건 더", again:true,
    init:function(){ LA.time=""; LA.seat=0; LA.memo=""; LA.day=typeof mtLnDay==="function"?mtLnDay():""; LG.P=lgPlace((S.data.resv&&S.data.resv.rows)||[], LA.day); },
    have:function(e){ var a=laAll(e); return a.length?"이미 "+a.length+"건("+a.map(laAt).join(" · ")+") · 넣으면 추가 상담 "+(a.length+1)+"건째 · 같은 날 같은 시간은 안 됨":""; },   /* 261022 막지 않고 알린다(again) */
    opts:function(){
      var P=LG.P, cf=lgCfg(), tm="", h="", ds=typeof mtLnDays==="function"?mtLnDays():null;
      if(ds) h+='<div class="nt-f"><div class="nt-l">날짜</div><div class="chips" role="radiogroup" aria-label="상담 날짜">'+ds.map(function(x){ var on=LA.day===x.d; return '<button type="button" role="radio" aria-checked="'+on+'" class="chip'+(on?" on":"")+'" onclick="laDay(\''+x.d+'\')">'+esc(x.l)+'</button>'; }).join("")+'</div></div>';
      if(P){ tm='<button type="button" role="radio" aria-checked="'+(!LA.time)+'" class="chip'+(!LA.time?" on":"")+'" onclick="laTime(\'\')">칸 미정</button>';
        for(var i=0;i<cf.n;i++){ var t=m2hm(P.s0+i*cf.step), used=P.grid[i].filter(function(x){ return x&&RV_ON.indexOf(x.status)>=0; }).length, left=cf.seats-used, on=LA.time===t;
          tm+='<button type="button" role="radio" aria-checked="'+on+'" class="chip'+(on?" on":"")+'" onclick="laTime(\''+t+'\')">'+t+' <span class="c">'+(left>0?left+"자리":"마감")+'</span></button>'; } }
      h+='<div class="nt-f"><div class="nt-l">시간</div><div class="chips" role="radiogroup" aria-label="시간 칸">'+tm+'</div></div>';
      if(LA.time&&P){ var ti=Math.floor((mins(LA.time)-P.s0)/cf.step), sh='<button type="button" role="radio" aria-checked="'+(!LA.seat)+'" class="chip'+(!LA.seat?" on":"")+'" onclick="laSeat(0)">자동 · 빈 자리</button>';
        for(var s=1;s<=cf.seats;s++){ var o=(P.grid[ti]||[])[s-1], busy=o&&RV_ON.indexOf(o.status)>=0, on2=LA.seat===s;
          sh+='<button type="button" role="radio" aria-checked="'+on2+'" class="chip'+(on2?" on":"")+'"'+(busy?' disabled aria-disabled="true"':'')+' onclick="laSeat('+s+')">미팅룸 '+s+(busy?' <span class="c">'+esc(personLine(o))+'</span>':'')+'</button>'; }
        h+='<div class="nt-f"><div class="nt-l">미팅룸</div><div class="chips" role="radiogroup" aria-label="미팅룸">'+sh+'</div></div>'; }
      return h+'<label class="nt-f"><span class="nt-l">메모(선택)</span><input class="xg-q" id="laMemo" maxlength="60" autocomplete="off" placeholder="60자까지" aria-label="메모" value="'+esc(LA.memo)+'" oninput="LA.memo=this.value" style="width:100%;max-width:360px"></label>'; },
    run:function(p){ var e=normE(p.emp), t=LA.time, s=t&&LA.seat?LA.seat:0, memo=String(LA.memo||"").trim().slice(0,60); return call("lng_pre_row_add",{ emp:e, time:t||null, seat:s?String(s):null, memo:memo||null, day:LA.day||null, more:laAll(e).length?"1":null }); },   /* 261022 more = 추가 상담 줄 */
    fail:laFail,
    done:function(r, p){ var e=normE(p.emp); LA.time=""; LA.seat=0; LA.memo=""; reload(["resv","lgb"]);
      toast("넣었습니다 · "+(r.name||p.name||e)+" · "+(r.dl?r.dl+" ":"")+(r.slot?r.slot+(r.seat?" · 미팅룸 "+r.seat:""):"칸 미정")+(r.rv==="more"?" · 추가 상담 · 이 사람 "+r.mine+"건":"")+(r.over?" · 정원 넘음":"")+(r.gate==="add"?" · 접속 허용 명단에도 넣음":""), { undo:function(){ if(r.rv==="more") laDelOne(e, r.id); else laDel(e, 1); } }); } };
}
/* 선택 삭제 · 상담 줄 취소(kind lounge · 줄 id) · 「사전 명단에서도 뺌」을 고르면 kind lounge_pre(사번 · 명단 · 라운지시간에서 빠지고 신청 · 승인 줄 취소) */
function laCx(){
  return { what:"AX 라운지 신청", sub:"상담 줄 상태 = 취소(이전 상태 남김) · 완료였으면 라운지 스탬프 거둠",
    opts:function(){ LA.pre=0; return '<label class="nt-f" style="display:flex;gap:8px;align-items:center"><input type="checkbox" onchange="LA.pre=this.checked?1:0">사전 명단에서도 뺌(키트 · 가습기 대상에서 빠짐 · 체크인 · 완료한 사람은 못 함)</label>'; },
    kind:function(){ return LA.pre?"lounge_pre":"lounge"; },
    keys:function(rows, kind){ var seen={}; return rows.map(function(r){ return kind==="lounge_pre"?normE(r.emp):String(r.id); }).filter(function(k){ if(seen[k]) return false; seen[k]=1; return true; }); },
    after:function(){ LG.sel=null; LG.mv=null; reload(["resv","lgb"]); } };
}
/* 빼기 · 배치판 오른쪽 카드 단추 · 확인 창 뒤 lng_pre_row_del */
function laDelAsk(id){
  var r=rvRow(id); if(!r) return; var e=normE(r.emp);
  confirmBox({ t:"라운지 사전 명단에서 뺄까요?", who:personLine(r)+" · "+(r.day&&typeof mtDl==="function"?mtDl(r.day)+" ":"")+(hm(r.slot)||"칸 미정")+(num(r.seat)?" · 미팅룸 "+r.seat:"")+" · "+r.status,
    sub:"상담 신청 줄과 키트명단 라운지 줄이 같이 빠짐 · 체크인 · 완료한 줄이 있으면 빼지 못함 · 되돌리기 7초 · 활동 기록에서도 가능", ok:"빼기", danger:true,
    run:function(){ return call("lng_pre_row_del",{ emp:e, id:String(id) }); },   /* 261022 id = 그 줄만(하나뿐인 줄이면 옛 빼기) */
    fail:function(x){ return x&&x.reason==="done"?"이미 "+(x.cur||"체크인 · 완료")+" 줄이 있어 뺄 수 없습니다":LA_DWHY[x&&x.reason]||""; },
    done:function(x){ LG.sel=null; LG.mv=null; reload(["resv","lgb"]); lgPaint();
      toast("뺐습니다 · "+(r.name||r.emp)+(x&&x.cx?" · 상담 줄 취소 "+x.cx:""), { undo:function(){ laBack(e, r); } }); } });
}
/* 261022 추가 상담 줄 넣은 직후 되돌리기 = 그 줄만 빼기 */
function laDelOne(e, id){ call("lng_pre_row_del",{ emp:e, id:String(id) }).then(function(x){ reload(["resv","lgb"]); toast(x&&x.ok?"되돌렸습니다 · 그 줄만 뺌":"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); }
/* 넣은 직후 되돌리기 = 빼기(확인 창 없이) */
function laDel(e){ call("lng_pre_row_del",{ emp:e }).then(function(x){ LG.sel=null; reload(["resv","lgb"]); toast(x&&x.ok?"되돌렸습니다 · 명단에서 뺌":"되돌리지 못했습니다 · "+(x&&x.reason==="done"?"이미 "+(x.cur||"체크인 · 완료")+" 줄이 있습니다":why(x)),{ bad:!(x&&x.ok) }); }); }
/* 뺀 직후 되돌리기 = 같은 시간 · 상담석 · 메모로 다시 넣기 */
function laBack(e, r){
  call("lng_pre_row_add",{ emp:e, time:hm(r.slot)||null, seat:hm(r.slot)&&num(r.seat)?String(r.seat):null, memo:r.memo||null, day:r.day||null, more:laAll(e).length?"1":null }).then(function(x){ reload(["resv","lgb"]); toast(x&&x.ok?"되돌렸습니다 · 다시 넣음":"되돌리지 못했습니다 · "+(laFail(x)||why(x)),{ bad:!(x&&x.ok) }); });
}
