/* AXF CONTROL v2 · 옛 처리함 부품 (261016 · 261021 처리함 탭 걷음)
 * 261021 사용자 「권장대로」 · 처리함 탭 · 스태프 요청 폐지 · 체크인존 · 참여상 = 체크인 탭 · 스태프 묶음 · 번호 = 명단 › 목록 › 스태프(ckzone.js) · 비밀번호 초기화 요청 = 명단 탭 칩(people.js)
 * 이 파일에 남는 것 = AX 라운지 명단 부품(미팅 탭) · 비밀번호 초기화 요청 명단(pwPaint · 명단 탭이 부른다)
 * 서버 sreq_* 액션 · 지난 기록은 그대로(콘솔이 부르지 않음) */
var RV_ON=["신청","승인","체크인"];
var RV_CLS={ "신청":"req", "승인":"okc", "체크인":"in", "완료":"done", "노쇼":"no" };
var RV_TAG={ "신청":"warn", "승인":"", "체크인":"", "완료":"ok", "노쇼":"bad", "취소":"off" };
/* ── AX 라운지 명단 부품 · 미팅 탭 › 1F AX 라운지 › 명단(meet.js) · lgPlace = 추가 창(lngrow.js)의 칸별 남은 자리 셈 ── */
function lgCfg(){ var b=S.data.nb, L=b&&b.lounge; return { start:(L&&L.start)||LOUNGE_DEF.start, n:num(L&&L.n)||LOUNGE_DEF.n, seats:num(L&&L.seats)||LOUNGE_DEF.seats, step:num(L&&L.step)||60, srv:!!L }; }
/* 261016 놓기 = 서버 lngPlace_ 와 같은 규칙 · 시간 빈칸 = 칸 미정(none) · 정한 상담석(seat) 먼저 · 나머지 신청 시각 순 · 못 놓으면 칸 밖(out) */
function lgPlace(rows, day){   /* 261021 day = 그 날짜 줄만 칸에 셈(시간 빈 줄 · 취소는 날짜와 상관없이) · 없으면 날짜 구분 없음 */
  var cf=lgCfg(), s0=mins(cf.start), grid=[], out=[], cx=[], none=[], left=[], mainD=S.data.lgb&&S.data.lgb.main||"";
  if(day) rows=rows.filter(function(r){ return r.status==="취소"||!hm(r.slot)||(r.day||mainD)===day; });
  for(var i=0;i<cf.n;i++){ grid.push([]); for(var j=0;j<cf.seats;j++) grid[i].push(null); }
  rows.slice().sort(function(a,b){ return String(a.ts).localeCompare(String(b.ts)); }).forEach(function(r){
    if(r.status==="취소"){ cx.push(r); return; }
    if(!hm(r.slot)){ none.push(r); return; }
    var m=mins(r.slot), i=Math.floor((m-s0)/cf.step);
    if(m<0||i<0||i>=cf.n){ out.push(r); return; }
    var j=num(r.seat)-1;
    if(j>=0&&j<cf.seats&&!grid[i][j]){ grid[i][j]=r; return; }
    left.push([r,i]);
  });
  left.forEach(function(x){ var j=grid[x[1]].indexOf(null); if(j<0){ out.push(x[0]); return; } grid[x[1]][j]=x[0]; });
  return { cf:cf, grid:grid, out:out, cx:cx, none:none, s0:s0 };
}
var LG={ sel:null, g:null, mv:null };
/* 261016 명단 올리기(upload.js) · 명단 자리에 열고 · 적용하면 명단으로 */
function lgUpOpen(){ upOpen(LNG_UP); S.ui.lup=1; render(); el("main").scrollTop=0; }
/* 미팅 탭 라운지 명단 틀 · 올리기 단추 · 명단 표 */
function lgShell(b){
  if(S.ui.lup&&UP){ upMount(b); return; }
  b.innerHTML='<div class="up-bar"><span class="cap">사전 명단 = 「사번 · 시간 · 미팅룸」 엑셀</span><button class="btn sm pri" type="button" onclick="lgUpOpen()">명단 올리기</button><button class="btn sm" type="button" onclick="lngUndoAsk()">마지막 올리기 되돌리기</button></div><div id="lgErr"></div><div class="card"><h2>AX 라운지 사전 명단 <span class="cap">줄을 누르면 사람 상세</span></h2><div id="lgList"></div></div>';
}
function lgPaint(){
  if(S.ui.lup&&UP) return;   /* 명단 올리기 화면은 자기 동작 때만 다시 그린다(5초 갱신이 입력을 지우지 않게) */
  var box=el("lgList"); if(!box) return;
  var gt=dataGate("resv","AX 라운지 신청");
  if(gt){ box.innerHTML=gt; return; }
  var rows=S.data.resv.rows||[]; LG.P=lgPlace(rows, typeof mtLnDay==="function"?mtLnDay():"");
  el("lgErr").innerHTML=errTop("resv");
  if(!LG.g) LG.g=XG.make({ id:"lounge", file:"AX 라운지 신청", key:function(r){ return r.id; }, sort:{ k:"day", d:1 },   /* 261021 날짜 열 · 날짜 + 시간 순 */
    onRow:function(k){ var r=rvRow(k); if(r&&typeof mtOpen==="function") mtOpen("ln", k, LG.g); },
    chips:[["all","전체",null],["none","칸 미정",function(r){ return r.status!=="취소"&&!hm(r.slot); }],["in","왔음",function(r){ return r.status==="체크인"; }],["dn","끝",function(r){ return r.status==="완료"; }],["no","노쇼",function(r){ return r.status==="노쇼"; }],["cx","취소",function(r){ return r.status==="취소"; }]],
    cols:[{ k:"day", t:"날짜", w:80, v:function(r){ return (r.day||"")+" "+(hm(r.slot)||"99"); }, f:function(r){ return r.day&&typeof mtDl==="function"?esc(mtDl(r.day)):"-"; } },{ k:"slot", t:"시간", w:70, v:function(r){ return hm(r.slot)||"칸 미정"; } },{ k:"seat", t:"미팅룸", w:60 },{ k:"name", t:"이름", w:110 },{ k:"emp", t:"사번", w:90 },{ k:"dept", t:"부서", w:130 },{ k:"status", t:"상태", w:80, v:lnView, f:function(r){ return tag(lnView(r), RV_TAG[r.status]); } },
      { k:"mm", t:"운영 메모", w:160, v:function(r){ var n=typeof mtNote==="function"?mtNote("ln",r.emp):null; return n&&n.memo?String(n.memo).slice(0,20):""; } },{ k:"memo", t:"명단 표지", w:150 },{ k:"ts", t:"신청 시각", type:"date", w:110 },{ k:"cxAt", t:"취소 시각", type:"date", w:110 }],
    src:{ a:"resv_list", p:{} }, h:520, select:1, onAdd:function(){ paOpen(laSp()); }, cancel:laCx() });
  XG.set(LG.g, rows, box);
}
/* 화면 상태 이름 · 신청 · 승인 단계는 쓰지 않는다(사용자 261016 밤) · 없음 · 왔음 · 끝 · 노쇼 · 취소 */
function lnView(r){ var s=r.status||r.st; return s==="체크인"?"왔음":s==="완료"?"끝":s==="노쇼"?"노쇼":s==="취소"?"취소":"배정"; }
var RV_FX={ "승인":"참가자 앱에 승인 알림이 갑니다", "체크인":"출석만 · 스탬프는 완료 때", "완료":"완료하면 스탬프 07 프로그램 참여(라운지 2개) · 사은품 대상", "노쇼":"자리는 그대로 · 완료였으면 스탬프를 거둡니다", "취소":"자리가 비고 참가자 앱에 바로 반영됩니다" };
function rvRow(id){ var d=S.data.resv; return d&&d.rows?d.rows.filter(function(x){ return x.id===id; })[0]:null; }
function rvAsk(id, to){
  var r=rvRow(id); if(!r) return;
  var from=r.status, lab={ "승인":from==="신청"?"승인 · 알림 보내기":"되돌리기", "체크인":from==="승인"?"체크인":"되돌리기", "완료":"상담 완료", "노쇼":"노쇼 처리", "취소":"취소 처리" }[to];
  var q={ "승인":from==="신청"?"상담을 승인할까요?":"승인 상태로 되돌릴까요?", "체크인":from==="승인"?"체크인할까요?":"체크인 상태로 되돌릴까요?", "완료":"상담을 완료할까요?", "노쇼":"노쇼로 바꿀까요?", "취소":"신청을 취소할까요?" }[to];
  confirmBox({ t:q, who:personLine(r)+" · "+(r.day&&typeof mtDl==="function"?mtDl(r.day)+" ":"")+hm(r.slot)+" · "+from+" → "+to, sub:RV_FX[to], ok:lab, danger:to==="노쇼"||to==="취소",
    run:function(){ return call("resv_set",{ id:id, status:to, from:from }); },
    fail:function(x){ return x&&x.reason==="state"?"이미 "+(x.cur||"다른 상태")+"입니다 · 목록을 다시 받습니다":""; },
    done:function(x){ r.status=to; paint(); if(typeof mtDetRe==="function") mtDetRe(); reload(["resv","lgb","nb"]); toast((r.name||r.emp)+" · "+to+(x&&x.stamp&&x.stamp.ok?" · 스탬프":""),{ undo:function(){ rvUndo(id, to, from); } }); } });
}
function rvUndo(id, cur, back){
  call("resv_set",{ id:id, status:back, from:cur }).then(function(x){ var r=rvRow(id); if(x&&x.ok){ if(r) r.status=back; paint(); toast("되돌렸습니다 · "+lnView({ status:back })); } else toast("되돌리지 못했습니다 · "+why(x),{ bad:1 }); reload(["resv","lgb"]); });
}

/* ── 커피챗 · cchat.js 부품 · 화면 = 미팅 탭(meet.js) ── */

function pwBy(s){ var a=[]; String(s||"").split(/\s*·\s*/).forEach(function(x){ if(x&&a.indexOf(x)<0) a.push(x); }); return a.join(" · "); }   /* 261017 옛 줄 「콘솔 990901 · 콘솔 990901」 한 번만 */
/* ── 비밀번호 초기화 요청(앱 로그인 「비밀번호를 잊었어요」) · 명단 표 · 명단 탭 › 비밀번호 초기화 ── */
var PW={ g:null };
function pwPaint(){
  if(!PW.g) PW.g=XG.make({ id:"pw", file:"비밀번호 초기화 요청", whoCheck:1, key:function(r){ return String(r.row); }, sort:{ k:"ts", d:-1 },
    chips:[["w","기다림",function(r){ return r.status==="대기"; }],["d","처리함",function(r){ return r.status!=="대기"; }],["all","전체",null]],
    cols:[{ k:"ts", t:"요청 시각", type:"date", w:100 },{ k:"name", t:"이름", w:110 },{ k:"emp", t:"사번", w:90 },{ k:"status", t:"상태", w:80, f:function(r){ return tag(r.status, r.status==="대기"?"warn":"off"); } },{ k:"pwSet", t:"비밀번호", w:80, v:function(r){ return r.pwSet?"있음":r.joined?"없음":"가입 전"; } },{ k:"doneAt", t:"처리 시각", type:"date", w:100 },
      { t:"", w:250, act:function(r){ if(r.status!=="대기") return '<span class="cap">'+esc(pwBy(r.by))+'</span>'; return '<button class="btn sm pri" type="button" onclick="pwDo('+num(r.row)+')">초기화하고 처리</button> <button class="btn sm" type="button" onclick="pwCancel('+num(r.row)+')">잘못된 요청</button>'; } }],
    src:{ a:"pw_req_list", p:{} }, empty:"요청이 없습니다", h:420 });
  var gt=dataGate("pwl","비밀번호 초기화 요청"); PW.g.gate=gt||""; XG.set(PW.g, gt?null:(S.data.pwl.rows||[]), el("pwList"));
}
function pwRow(row){ var d=S.data.pwl; return d&&d.rows?d.rows.filter(function(x){ return num(x.row)===row; })[0]:null; }
function pwDo(row){
  var r=pwRow(row); if(!r) return;
  confirmBox({ t:"비밀번호를 초기화할까요?", who:personLine(r), sub:"본인 확인 뒤 · 다음 로그인에 넣는 4자리가 새 비밀번호 · 되돌릴 수 없음", ok:"초기화하고 처리", danger:true,
    run:function(pp){ return call("pw_req_done",Object.assign({ row:row },pp)); },   /* 처리자 = 서버가 로그인 사번으로 적음(by 를 보내면 두 번 적힘) */
    done:function(){ r.status="처리"; pwPaint(); reload(["pwl","pwc","nb"]); toast("비밀번호를 초기화했습니다 · "+(r.name||r.emp)); } });
}
function pwCancel(row){
  var r=pwRow(row); if(!r) return;
  call("pw_req_cancel",{ row:row }).then(function(x){ if(x&&x.ok){ r.status="취소"; pwPaint(); reload(["pwl","pwc"]); toast("요청을 닫았습니다 · 비밀번호는 그대로"); } else toast("닫지 못했습니다 · "+why(x),{ bad:1 }); });
}
