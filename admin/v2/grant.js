/* AXF CONTROL v2 · 종이 기록 일괄 반영(261017 B6 · 설계 「스탬프 · 행운권 백업 · 복구 · 비상 계획_261017」 5절)
 * 사람 › 명단 올리기 › 「종이 기록 반영」 · 서버 장애 중 현장 종이 출석부(사번 · 항목 · 현장 시각)를 엑셀 · CSV · 붙여넣기로 한 번에 넣는다
 * 흐름 = upload.js 공통 부품 · 미리 세기 = stamp_grant_many dry=1 · 적용 = 같은 액션(확인 창 · 사유) · 되돌리기 = roll_undo { batch }(오늘만 · 토스트 · 이 화면 · 활동 기록)
 * 항목 = p2 AX PLAY · st 계단 · p3 17F 양쪽 · p3h 17F 한쪽 · p10 10F 양쪽 · p10h 10F 한쪽 · cc 18F 커피챗 · ln 1F AX 라운지(한글 이름도 읽는다)
 * 결과 = 넣음 · 기록만(6개 다 참 · 프로그램 참여 2개 다 참) · 이미 있음 · 넣지 않음(행사 전 · 명부에 없음) · 보상 = 선착순 순번 · 201번째부터 · 마감 뒤 · 행운권 17:00 마감 */
var GM_IDN={ p2:"AX PLAY", st:"계단 이용", p3:"17F 강연 양쪽", p3h:"17F 강연 한쪽", p10:"10F 실습 양쪽", p10h:"10F 실습 한쪽", cc:"18F 커피챗", ln:"1F AX 라운지" };
var GM_WHY={ preday:"10/26 행사 당일부터 넣음", noemp:"명부 · 계정에 없는 사번", noid:"넣지 않는 항목", emp:"사번 모양", again:"파일 안 같은 줄", full2:"양쪽(2개) 기록이 이미 있음", have:"이미 받음(폰 · 현장)", err:"서버 오류" };
var GM_LAST=null;
/* 항목 글자 → id · 못 읽으면 "" */
function gmId(v){
  var s=upCell(v), u=s.toLowerCase().replace(/\s+/g,""); if(!s) return "";
  if(GM_IDN[u]) return u;
  var half=/한쪽|입장만|끝만|종료만|1개/.test(s);
  if(/axplay|하이디큐|하이헬퍼/.test(u)) return "p2";
  if(/계단/.test(s)) return "st";
  if(/커피챗|18f/.test(u)) return "cc";
  if(/라운지|^1f/.test(u)) return "ln";
  if(/17f|강연/.test(u)) return half?"p3h":"p3";
  if(/10f|실습/.test(u)) return half?"p10h":"p10";
  return "";
}
function gmRew(r){
  var a=[];
  if(r.fcfs==="in") a.push("선착순 "+r.rk+"번");
  else if(r.fcfs==="out") a.push("선착순 "+r.rk+"번째 · 수량 밖");
  else if(r.fcfs==="late") a.push("선착순 마감 뒤 · 순번 없음");
  if(r.raf==="no") a.push("행운권 17:00 마감 · 새 번호 없음");
  else if(r.raf==="yes") a.push("행운권 번호 · 다음 접속 때");
  if(r.roul) a.push("룰렛 3개");
  return a;
}
var GM_UP={
  people:1, who:1, id:"gmup", file:"종이 기록 미리 세기", title:"종이 기록 반영", desc:"서버 장애 중 종이 출석부 · 사번 · 항목 · 현장 시각", backT:"명단 고르기로", askT:"종이 기록을 스탬프로 넣을까요?",
  pasteT:"사번 항목 시각", pasteEx:"990001	p2	14:05&#10;990002	17F 한쪽	14:40&#10;990003	ln",
  preview:"stamp_grant_many", apply:"stamp_grant_many", pp:{ dry:"1" },
  ap:function(){ return { dry:"0", why:String((el("gmWhy")||{}).value||"").trim().slice(0,60), rid:"gm"+Date.now().toString(36) }; },
  fields:[UP_EMPF,{ k:"id", t:"항목", need:1, re:/항목|종류|스탬프|id|장소/i, shape:function(v){ return !!gmId(v)&&!/\d{5,}/.test(v); } },
    { k:"t", t:"현장 시각", re:/시각|시간|time/i, shape:function(v){ return /^\d{1,2}\s*[:시]\s*\d{0,2}/.test(v); } },UP_NAMEF],
  modes:[["add","넣기만","지금 기록에 더함 · 빼는 줄 없음 · 이미 받은 줄은 그대로"]],
  line:function(o){
    var x=upLine1(o); if(x.bad) return x;
    var id=gmId(o.id0); if(!id) return { bad:o.id0?"항목을 읽지 못함 · "+o.id0:"항목 없음", emp:x.emp };
    var t=upTime(o.t0); if(t===null) return { bad:"시각 모양 · "+o.t0, emp:x.emp };
    o.id=id; return { emp:x.emp, txt:x.emp+" "+id+(t?" "+t:"") };
  },
  isBad:function(o){ return o.k==="fmt"||o.k==="name"; },
  judge:function(o, pr){
    if(o.bad) return { k:"fmt", msg:o.bad };
    if(!pr) return { k:"fmt", msg:"서버 줄 없음" };
    o.name=pr.name||""; o.dept=pr.dept||""; o.gk=pr.k; o.rewA=gmRew(pr); o.rew=o.rewA.join(" · "); o.tt=pr.t||"";
    var nj=upNameJ(o, pr); if(nj) return nj;
    if(pr.k==="put") return { k:"ok", res:"넣음", msg:"스탬프 "+pr.n0+" → "+pr.n1+"개" };
    if(pr.k==="cap") return { k:"ok", res:"기록만", msg:pr.n0>=6?"6개 다 참 · 개수 그대로":"프로그램 참여 2개 다 참 · 개수 그대로" };
    if(pr.k==="dup") return { k:"ok", res:"이미 있음", msg:GM_WHY[pr.why]||"" };
    return { k:"deny", res:"넣지 않음", msg:GM_WHY[pr.why]||pr.why||"" };
  },
  chips:[["all","전체",null],["put","넣음",function(r){ return r.gk==="put"; }],["cap","기록만",function(r){ return r.gk==="cap"; }],["dup","이미 있음",function(r){ return r.gk==="dup"; }],
    ["deny","넣지 않음",function(r){ return r.k==="deny"; }],["rew","보상 확인",function(r){ return !!r.rew; }],["bad","문제",function(r){ return r.k==="fmt"||r.k==="name"; }]],
  cols:[{ k:"no", t:"파일 줄", type:"num", w:64 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:120 },{ k:"name", t:"이름", w:90 },
    { k:"id", t:"항목", w:110, v:function(r){ return GM_IDN[r.id]||r.id0||""; } },{ k:"tt", t:"현장 시각", w:76, v:function(r){ return r.tt||r.t0||""; } },
    { k:"k", t:"결과", w:90, v:function(r){ return r.res||"문제"; }, f:function(r){ return r.k==="fmt"||r.k==="name"?tag("문제","bad"):r.k==="deny"?tag(r.res,"warn"):tag(r.res,r.gk==="put"?"ok":"off"); } },
    { k:"rew", t:"보상", w:280, f:function(r){ return r.rewA&&r.rewA.length?r.rewA.map(function(x){ return /수량 밖|마감/.test(x)?tag(x,"warn"):esc(x); }).join(" · "):'<span class="cap">-</span>'; } },
    { k:"msg", t:"내용", w:220 }],
  sum:function(pv){ var s=pv.sum||{};
    return { who:n0(pv.n)+"줄 · 넣음 "+n0(s.put)+" · 기록만 "+n0(s.cap)+" · 이미 있음 "+n0(s.dup)+" · 넣지 않음 "+n0(s.deny)+" · "+n0(s.people)+"명",
      sub:"선착순 수량 밖 "+n0(num(s.fcfsOut)+num(s.fcfsLate))+"명 · 17:00 뒤라 행운권 없음 "+n0(s.rafNo)+"명 · 오늘 안에 되돌릴 수 있음",
      body:'<label class="fld">사유 · 운영로그에 남음(선택)<input class="in" id="gmWhy" maxlength="60" autocomplete="off" placeholder="비상 모드 14:10~14:40 · paper.csv"></label>', focus:"gmWhy" }; },
  kpis:function(pv, rows){ var s=pv.sum||{}, bad=rows.filter(GM_UP.isBad).length, fo=num(s.fcfsOut)+num(s.fcfsLate);
    return '<div class="grid up-kp">'+
      kpi({ l:"넣음", v:n0(s.put), u:"줄", s:n0(s.people)+"명 · 기록만 "+n0(s.cap) })+
      kpi({ l:"이미 있음", v:n0(s.dup), u:"줄", s:"폰 · 현장에서 이미 받음" })+
      kpi({ l:"넣지 않음", v:n0(s.deny), u:"줄", s:"행사 전 "+n0(s.preday)+" · 명부 밖 "+n0(s.noemp), st:num(s.deny)?"warn":"" })+
      kpi({ l:"선착순 수량 밖", v:n0(fo), u:"명", s:"201번째부터 "+n0(s.fcfsOut)+" · 마감 뒤 "+n0(s.fcfsLate), st:fo?"warn":"" })+
      kpi({ l:"행운권 마감", v:n0(s.rafNo), u:"명", s:"17:00 뒤 · 새 번호 없음", st:num(s.rafNo)?"warn":"", stt:bad?"문제 "+bad+"줄":"" })+'</div>';
  },
  back:function(){ ppUpBack(); },
  done:function(r){ GM_LAST={ r:r, at:hm(String(r.t||""))||"", undone:"" }; S.ui.pup=0; UP=null; ppStale(); render(); load(true);
    toast("반영했습니다 · 넣음 "+n0(r.done)+"줄"+(r.sum&&r.sum.deny?" · 넣지 않음 "+n0(r.sum.deny):""),{ undo:r.batch?gmUndoAsk:null }); }
};
/* 마지막 반영 카드(명단 올리기 고르기 위) · 선착순 수량 밖 · 행운권 마감 사람 · 되돌리기 */
function gmLastH(){
  var L=GM_LAST; if(!L) return "";
  var r=L.r, s=r.sum||{}, rows=r.rows||[], fo=rows.filter(function(x){ return x.fcfs==="out"||x.fcfs==="late"; }), rn=rows.filter(function(x){ return x.raf==="no"; });
  var li=function(a, f){ return a.length?'<ul class="gm-l" style="list-style:none;margin:4px 0 0;padding:0;font-size:13px;line-height:1.7">'+a.slice(0,30).map(function(x){ return '<li>'+esc(personLine(x))+' <span class="cap">· '+esc(f(x))+'</span></li>'; }).join("")+(a.length>30?'<li class="cap">외 '+(a.length-30)+'명</li>':'')+'</ul>':''; };
  return '<div class="card mb"><h2>마지막 종이 기록 반영 <span class="cap">'+esc(L.at)+' · 넣음 '+n0(r.done)+'줄 · 이미 있음 '+n0(s.dup)+' · 넣지 않음 '+n0(s.deny)+'</span>'+
    '<span class="r">'+(L.undone?'<span class="cap">'+esc(L.undone)+' 되돌림</span>':r.batch?'<button class="btn sm dng" type="button" onclick="gmUndoAsk()">되돌리기</button>':'')+'</span></h2>'+
    (fo.length?'<p class="cap mt4">선착순 수량 밖 '+fo.length+'명 · 발송 명단 포함은 사용자 판단</p>'+li(fo,function(x){ return x.fcfs==="late"?"마감 뒤 · 순번 없음":x.rk+"번째"; }):'')+
    (rn.length?'<p class="cap mt4">17:00 뒤라 행운권 없음 '+rn.length+'명</p>'+li(rn,function(x){ return GM_IDN[x.id]||x.id; }):'')+
    (!fo.length&&!rn.length?'<p class="cap mt4">선착순 · 행운권 따로 볼 사람 없음</p>':'')+'</div>';
}
function gmUndoAsk(){
  var L=GM_LAST; if(!L||!L.r.batch||L.undone) return;
  confirmBox({ t:"종이 기록 반영을 되돌릴까요?", who:"넣은 "+n0(L.r.done)+"줄 · "+n0((L.r.sum||{}).people)+"명 · "+L.at+" 반영",
    sub:"넣은 스탬프를 줄마다 취소 · 그 뒤 따로 바뀐 줄 · 룰렛 · 행운권 · 선착순과 엮인 줄은 건너뜀 · 오늘만", ok:"되돌리기", danger:true,
    run:function(){ return call("roll_undo",{ batch:L.r.batch }); },
    fail:function(r){ return r&&r.reason==="expired"?"다른 날 반영한 묶음입니다":r&&r.reason==="done"?"이미 되돌렸습니다":""; },
    done:function(x){ L.undone=hm(String(x.t||""))||"방금"; ppStale(); render(); load(true); toast("되돌렸습니다 · "+n0(x.done)+"줄"+((x.skip||[]).length?" · 건너뜀 "+x.skip.length+"줄":"")); } });
}
