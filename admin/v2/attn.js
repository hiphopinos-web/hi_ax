/* AXF CONTROL v2 · 출석 탭(사용자 261022 「출석 탭 메뉴 · 세션별 출석 체크 여부를 직관적으로 · 체크가 안 된 사람 바로 대응(스탬프 부여)」)
 * 칩 = 전체(세션 카드 8개) · 세션 8개(17F AWS · MS · 10F A · B · C · D · E 1회차 · E 2회차) · 카드를 누르면 그 세션 칩
 * 데이터 = att_board(sid · 30초마다 · 서버 15초 캐시) · 날짜 = 오늘(행사일 뒤면 행사일) · 시험 사번 · 송출 줄 빼고
 *   카드 = 시간 · 장소 · 지금 상태(입장 열림 · 종료 열림 · 닫힘 · 지남) · 10F 사전 신청 · 입장 · 종료 · 둘 다 · 없음 · 명단 밖 / 17F 찍은 사람 · 입장 · 종료 · 둘 다
 *   명단 = 10F 사전 신청자 전원 + 명단 밖 줄 · 17F 찍은 사람 · 구분 칩(전체 · 입장만 · 종료만 · 둘 다 · 없음 · 명단 밖) · 검색 · 엑셀
 * 처리 = 고른 줄 「입장 처리」 · 「종료 처리」(표 위) · 줄마다 「입장」 · 「종료」 → att_mark dry=1(미리 보기 · 쓰지 않음) → 확인 창(몇 명 · 스탬프 몇 개 · 막히는 사람 이유)
 *   → att_mark(rid) = QR 을 찍은 것과 같은 출석 기록 + 같은 스탬프 판정(서버) · 참가자 알림 없음 · 토스트 「되돌리기」 = roll_undo(그날 · 활동 기록에서도)
 *   권한 = 슈퍼관리자 또는 출석 담당(261022 밤 · 설정 › 관리자 명단 「출석 담당」 칸 · 지정 · 해제 = 슈퍼관리자 · att_owner_set) · 다른 입장 = 보기만 */
var AT_SUBS=[["all","전체"],["l1","17F AWS"],["l2","17F MS"],["fld","10F A"],["ta","10F B"],["tb","10F C"],["aws","10F D"],["ms1","10F E 1회차"],["ms2","10F E 2회차"]];
var AT_META={
  l1:{ h:"17F · AWS", t:"Agentic AI 시대 일하는 방식의 변화", w:"AWS 구태훈", p:"17F 대강당" },
  l2:{ h:"17F · MS", t:"AI와 친해지기", w:"Microsoft 김한결, 이나경", p:"17F 대강당" },
  fld:{ h:"10F · 세션 A", t:"영업 및 보상 현장 우수 사례", w:"김동건 전임, 이은정 지점장, 이승철 대리", p:"컨퍼런스룸" },
  ta:{ h:"10F · 세션 B", t:"\"내 데이터\"로 만드는 통계 현황", w:"임경덕 강사", p:"01 HEART" },
  tb:{ h:"10F · 세션 C", t:"\"내가 보는 자료\"로 만드는 외부자료 리서치 자동화", w:"권혜영 강사", p:"06 HEART" },
  aws:{ h:"10F · 세션 D", t:"바이브 코딩 실습", w:"AWS 조재구 강사", p:"08 HEART" },
  ms1:{ h:"10F · 세션 E 1회차", t:"MS Copilot을 활용한 문서 작성", w:"Microsoft 김진우 강사", p:"07 HEART" },
  ms2:{ h:"10F · 세션 E 2회차", t:"MS Copilot을 활용한 문서 작성", w:"Microsoft 김진우 강사", p:"07 HEART" }
};
var AT_WHY={ noemp:"명부 · 계정에 없음", preday:"10/26 행사 당일부터", postday:"행사일이 지남", notpre:"사전 신청 명단 밖", other:"다른 세션 신청자", round:"E 다른 회차 신청자", done:"기록 · 스탬프 이미 있음", err:"서버 오류" };
var AT_UWHY={ later:"그 뒤 종료까지 받음", changed:"그 뒤 다시 받음", roulette:"룰렛 씀", tickets:"행운권 받음", fcfs:"선착순 참여상", fin:"참여상 확정", nostamp:"스탬프 없음", err:"서버 오류" };
var AT_X={ notpre:"명단 밖", other:"다른 세션", round:"E 다른 회차" };
function atSub(){ return subsOf(AT_SUBS,"all"); }
function atTen(id){ return id!=="l1"&&id!=="l2"; }
function atCan(){ return !!(isTop()||(S.me&&S.me.ao)); }   /* 261022 밤 슈퍼관리자 또는 출석 담당(서버 atMay_ 와 같은 기준) */
function atM(s){ var m=String(s||"").match(/(\d{1,2}):(\d{2})/); return m?Number(m[1])*60+Number(m[2]):NaN; }
function atWin(s){ var a=String(s||"").split("~"); return { a:atM(a[0]), b:atM(a[1]) }; }
/* 지금 상태 · 서버 창 글자(wIn · wOut)와 지금 시각(서버 시각 기준) */
function atState(c){
  var t=srvNow(), m=t.getHours()*60+t.getMinutes(), i=atWin(c.wIn), o=atWin(c.wOut), inO=m>=i.a&&m<=i.b, outO=m>=o.a&&m<=o.b;
  if(inO&&outO) return ["입장 · 종료 열림","ok"]; if(inO) return ["입장 열림","ok"]; if(outO) return ["종료 열림","ok"];
  if(m>o.b) return ["지남","off"]; return ["닫힘","off"];
}
SCREENS.att={
  title:"출석", desc:"17F 오후 강연 · 10F 실습 세션 입장 · 종료 기록 · 빠진 사람 수기 처리",
  need:function(){ var s=atSub(); return [{ k:"atb", a:"att_board", p:s==="all"?{}:{ sid:s }, ttl:30000 }]; },
  mount:function(vb){
    var s=atSub();
    el("phCap").textContent=s==="all"?"세션을 누르면 명단 · 30초마다 새로":"고른 줄 입장 · 종료 처리 = QR 과 같은 기록 · 스탬프 · 슈퍼관리자";
    vb.innerHTML=chipsH(AT_SUBS,s)+'<div id="atBar" class="atn-bar"></div><div id="atBand"></div><div id="atRes">'+(AT_DRES.s===s?AT_DRES.h:"")+'</div>'+(s==="all"?'<div id="atCards" class="atn-grid"></div>':'<div id="atOne"></div><div class="card mt"><div id="mg_'+(atTen(s)?"atn10":"atn17")+'"></div></div>');
    if(s!=="all") atGrid(s);
  },
  paint:function(){
    var s=atSub(), d=S.data.atb, gt=dataGate("atb","출석 현황");
    var age=S.at.atb?Math.max(0,Math.round((Date.now()-S.at.atb)/1000)):0;
    var bar=el("atBar"); if(bar) bar.innerHTML='<span class="cap">'+(d&&d.ok?esc((d.day||"").slice(5).replace("-","/"))+' 기록 · '+esc(hm(d.t))+' 기준'+(d.cached?' · 서버 캐시':'')+' · '+(age<5?"방금 받음":age+"초 전 받음"):"")+'</span><span class="sp"></span><button class="btn sm" type="button" onclick="reload([\'atb\'])"'+(S.busy.atb?' disabled':'')+'>'+(S.busy.atb?"받는 중":"새로 고침")+'</button>';
    var bd=el("atBand");
    if(bd) bd.innerHTML=d&&d.ok&&d.today!==d.ev?band("info",(d.today<d.ev?"행사일(10/26) 전 · 숫자는 오늘 기록 · 수기 처리는 시험 사번만":"행사일이 지남 · 숫자는 10/26 기록 · 수기 처리 없음")):"";
    if(s==="all"){ var c=el("atCards"); if(!c) return; if(gt){ c.innerHTML=gt; return; } c.innerHTML=(d.ses||[]).map(function(x){ return atCard(x); }).join(""); return; }
    var one=el("atOne"), g=MG[atTen(s)?"atn10":"atn17"];
    if(gt){ if(one) one.innerHTML=""; g.gate=gt; XG.set(g,null,el("mg_"+g.id)); return; }
    var cd=(d.ses||[]).filter(function(x){ return x.id===s; })[0];
    if(one) one.innerHTML=cd?atCard(cd,1):"";
    g.gate=""; XG.set(g, d.sid===s?(d.rows||[]):null, el("mg_"+g.id));
  }
};
function atNum(l, v, c){ return '<div class="atn-n'+(c?" "+c:"")+'"><span class="l">'+esc(l)+'</span><b class="num">'+n0(v)+'</b></div>'; }
function atCard(c, one){
  var m=AT_META[c.id]||{ h:c.n, t:"", p:"" }, st=atState(c), ten=c.fl==="10F";
  var nums=ten?atNum("사전 신청",c.pre)+atNum("입장",c.in)+atNum("종료",c.out)+atNum("둘 다",c.both,"ok")+atNum("없음",c.none,c.none&&st[0]==="지남"?"warn":"")
    :atNum("찍은 사람",c.any)+atNum("입장",c.in)+atNum("종료",c.out)+atNum("둘 다",c.both,"ok");
  var tagN='<'+(one?'div':'button type="button" onclick="goSub(\''+c.id+'\')" aria-label="'+esc(m.h)+' 명단 보기"')+' class="card atn-card'+(one?" one":"")+'">';
  return tagN+'<div class="atn-h"><b>'+esc(m.h)+'</b>'+tag(st[0],st[1])+'</div>'+
    '<div class="atn-t">'+esc(m.t)+'</div><div class="cap">'+esc(c.s)+'~'+esc(c.e)+' · '+esc(m.p)+'<br>찍는 시간 · 입장 '+esc(c.wIn)+' · 종료 '+esc(c.wOut)+'</div>'+
    '<div class="atn-ns'+(ten?'':' f17')+'">'+nums+'</div>'+(c.old?'<div class="atn-old"><span class="cap">다른 날 기록 '+n0(c.old)+'줄 · 표에 없음</span>'+(one&&atDelCan()?'<button class="btn sm dng atn-del" type="button" onclick="atDelAsk(null,1)">다른 날 기록 지우기</button>':'')+'</div>':'')+(ten&&c.xn?'<div class="cap">명단 밖 '+n0(c.xn)+'명 찍음(기록만)</div>':(!ten?'<div class="cap">자유 참석 · 신청 명단 없음</div>':''))+
    (one?'':'<span class="atn-go cap">명단 보기 ›</span>')+'</'+(one?'div':'button')+'>';
}
function atStampTx(r, ten){ return (r.u?n0(r.u)+"/2":"0/2")+" · 전체 "+n0(r.n); }
function atGrid(s){
  var ten=atTen(s), id=ten?"atn10":"atn17";
  var chips=[["all","전체",null],["in","입장만",function(r){ return r.in&&!r.out&&!r.x; }],["out","종료만",function(r){ return r.out&&!r.in&&!r.x; }],["both","둘 다",function(r){ return r.in&&r.out&&!r.x; }]];
  if(ten) chips.push(["none","없음",function(r){ return !r.in&&!r.out&&!r.x; }],["x","명단 밖",function(r){ return !!r.x; }]);
  var cols=[];
  if(ten) cols.push({ k:"no", t:"번호", w:70 });
  cols.push({ k:"emp", t:"사번", w:90 },{ k:"name", t:"이름", w:100, f:function(r){ return '<b>'+esc(r.name||"-")+'</b>'+(r.x?" "+tag(AT_X[r.x]+(r.pre?" · "+r.pre:""),"off"):""); }, v:function(r){ return r.name; } },{ k:"dept", t:"소속", w:150, v:function(r){ return dptU(r.dept); } },
    { k:"in", t:"입장", w:70, f:function(r){ return r.in?'<span class="num">'+esc(r.in)+'</span>':'<span class="cap">-</span>'; } },
    { k:"out", t:"종료", w:70, f:function(r){ return r.out?'<span class="num">'+esc(r.out)+'</span>':'<span class="cap">-</span>'; } },
    { k:"u", t:"프로그램 참여", w:120, type:"num", v:function(r){ return r.u; }, f:function(r){ return '<span class="num">'+esc(atStampTx(r))+'</span>'; }, x:function(r){ return atStampTx(r); } },
    { k:"act", t:"처리", w:150, act:function(r){ if(r.x) return tag(AT_X[r.x]+(r.pre?" · "+r.pre:""),"off")+' <span class="cap">기록만</span>'; if(!atCan()) return ""; var e=jq(r.emp);
      return (r.in?'':'<button class="btn sm" type="button" onclick="atAsk(\'in\',[\''+e+'\'])">입장</button> ')+(r.out?'':'<button class="btn sm" type="button" onclick="atAsk(\'out\',[\''+e+'\'])">종료</button>'); } });
  gridOf(id,{ file:ten?"10F 출석":"17F 출석", key:function(r){ return r.emp; }, sort:{ k:ten?"no":"in", d:1 }, h:520, select:true, unit:"명", chips:chips, cols:cols,
    empty:ten?"사전 신청자가 없습니다":"아직 찍은 사람이 없습니다 · 사번을 넣어 처리합니다",
    topAct:function(g, n){ return (atCan()&&!ten?'<button class="btn sm" type="button" onclick="atAddAsk()">사번으로 처리</button>':"")+(atDelCan()?'<button class="btn sm dng atn-del" type="button" onclick="atDelAsk(null)">이 세션 기록 전부 지우기</button>':""); },
    pickAct:function(g, n){ if(!atCan()) return '<span class="cap">수기 처리 = 슈퍼관리자 · 출석 담당</span>'; return '<button class="btn sm pri" type="button" onclick="atPickAsk(\'in\')">입장 처리 '+n0(n)+'명</button><button class="btn sm pri" type="button" onclick="atPickAsk(\'out\')">종료 처리 '+n0(n)+'명</button>'+(atDelCan()?'<button class="btn sm dng atn-del" type="button" onclick="atDelPick()">기록 지우기 '+n0(n)+'명</button>':""); },
    onRow:function(k2){ if(typeof pcOpen==="function"&&isTop()) pcOpen(k2, MG[id]); } });
}
function atPickAsk(k){ var s=atSub(), g=MG[atTen(s)?"atn10":"atn17"]; if(!g) return; var e=xgPicked(g).map(function(r){ return r.emp; }); if(e.length) atAsk(k, e); }   /* 명단 밖 줄도 보내 확인 창에 막힌 이유를 보인다(서버 판정) */
/* 17F = 신청 명단이 없어 표에 없는 사람도 사번으로 넣는다 */
function atAddAsk(){
  confirmBox({ t:"사번으로 처리할까요?", who:(AT_META[atSub()]||{}).h, sub:"사번을 쉼표 · 줄바꿈으로 · 다음 단계에서 미리 보기",
    body:'<label class="fld">사번<textarea class="in" id="atEmps" rows="3" autocomplete="off" oninput="gateUpd()"></textarea></label><div class="chips mt4" role="group" aria-label="구분"><label class="chip"><input type="radio" name="atK" value="in" checked> 입장</label><label class="chip"><input type="radio" name="atK" value="out"> 종료</label></div>',
    focus:"atEmps", ok:"미리 보기", gate:function(){ var q=el("atEmps"); return !!q&&q.value.trim().length>2; },
    run:function(){ var q=el("atEmps"), e=q.value.split(/[\s,;]+/).map(normE).filter(Boolean), kk=(document.querySelector('input[name="atK"]:checked')||{}).value||"in"; setTimeout(function(){ atAsk(kk, e); },220); return Promise.resolve({ ok:true }); } });
}
function atAsk(k, emps){
  if(!atCan()){ toast("수기 처리는 슈퍼관리자 · 출석 담당이 합니다",{ bad:1 }); return; }
  var s=atSub(); if(s==="all"||!emps.length) return;
  if(emps.length>300){ toast("한 번에 300명까지 · 지금 "+n0(emps.length)+"명",{ bad:1, ms:4000 }); return; }
  toast("미리 보는 중");
  call("att_mark",{ sid:s, k:k, emps:emps.join(","), dry:"1" }).then(function(pv){
    if(!pv||!pv.ok){ toast("미리 보지 못했습니다 · "+(pv&&pv.reason==="owner"?"슈퍼관리자 · 출석 담당만 합니다":why(pv)),{ bad:1, ms:5000 }); return; }
    atConfirm(s, k, emps, pv);
  });
}
function atRowTx(x){
  if(x.why) return tag(AT_WHY[x.why]||x.why,"off")+(x.pn?' <span class="cap">'+esc(x.pn)+'</span>':'');
  var rec=x.rec==="new"?"기록 새로":"기록 있음";
  if(x.st==="put") return tag(rec+" · 스탬프 "+n0(x.n0)+" → "+n0(x.n1)+"개","ok")+(x.test?" "+tag("시험","off"):"");
  if(x.st==="cap") return tag(rec+" · 스탬프 기록만(개수 그대로)","")+(x.test?" "+tag("시험","off"):"");
  return tag(rec+" · 스탬프 이미 있음","")+(x.test?" "+tag("시험","off"):"");
}
function atConfirm(s, k, emps, pv){
  var m=AT_META[s]||{ h:s }, kn=k==="out"?"종료":"입장", sm=pv.sum||{}, ok=(pv.rows||[]).filter(function(x){ return !x.why; }), no=(pv.rows||[]).filter(function(x){ return x.why; });
  var wk=Object.keys(sm.why||{}).map(function(w){ return (AT_WHY[w]||w)+" "+n0(sm.why[w]); }).join(" · ");
  var tr=function(x){ return '<tr><td>'+esc(x.name||"-")+'</td><td>'+esc(x.emp)+'</td><td>'+atRowTx(x)+'</td></tr>'; };
  var body=band(sm.put?"warn":"info",sm.put?"실제 스탬프가 나갑니다 · 참가자 앱 알림 없음 · 다음 앱 열 때 반영":"스탬프 개수는 바뀌지 않습니다 · 출석 기록만")+
    '<dl class="cc-kv mt4"><dt>처리</dt><dd><b>'+n0(sm.ok)+'명</b> <span class="cap">(새 기록 '+n0(sm.rec)+')</span></dd><dt>스탬프</dt><dd>늘어남 <b>'+n0(sm.put)+'명</b> · 기록만 '+n0(sm.cap)+' · 이미 있음 '+n0(sm.dup)+'</dd><dt>막힘</dt><dd>'+n0(sm.deny)+'명'+(wk?' <span class="cap">'+esc(wk)+'</span>':'')+'</dd></dl>'+
    '<div class="xg-wrap mt4" style="--xg-h:220px"><table class="tb xg-fail"><thead><tr><th scope="col">이름</th><th scope="col">사번</th><th scope="col">결과</th></tr></thead><tbody>'+ok.concat(no).map(tr).join("")+'</tbody></table></div>';
  confirmBox({ t:m.h+" "+kn+" 처리할까요?", who:"고른 "+n0(pv.sum.n)+"명 · 처리 "+n0(sm.ok)+"명 · 막힘 "+n0(sm.deny)+"명", sub:"QR 을 찍은 것과 같은 기록 · 스탬프 판정(묶음 최대 2 · 상한 6) · 활동 기록에서 그날 되돌리기",
    body:body, ok:kn+" 처리 "+n0(sm.ok)+"명", danger:!!sm.put,
    gate:function(){ return sm.ok>0; },
    run:function(){ return call("att_mark",{ sid:s, k:k, emps:ok.map(function(x){ return x.emp; }).join(","), rid:"a"+Date.now().toString(36)+Math.random().toString(36).slice(2,6) },30000); },
    fail:function(r){ return r&&r.reason==="owner"?"슈퍼관리자 · 출석 담당만 합니다":""; },
    done:function(r){ atDone(s, k, r); } });
}
function atDone(s, k, r){
  var g=MG[atTen(s)?"atn10":"atn17"], hmNow=hm(r.t), by={};
  (r.rows||[]).forEach(function(x){ if(!x.why) by[x.emp]=x; });
  if(g){ g.pick={}; (g.rows||[]).forEach(function(row){ var x=by[row.emp]; if(!x) return; if(!row[k]) row[k]=hmNow; if(x.got) row.u=x.got==="p10"||x.got==="p3"?2:Math.max(row.u||0,1); if(x.n1!=null&&x.st==="put") row.n=x.n1; }); XG.paint(g); }   /* 처리한 줄만 바로 고침 · 이어서 다시 읽기 */
  reload(["atb"]);
  var sm=r.sum||{};
  toast(num(r.done)?(k==="out"?"종료":"입장")+" 처리했습니다 · "+n0(r.done)+"명 · 스탬프 "+n0(sm.put)+"명"+(sm.deny?" · 막힘 "+n0(sm.deny):""):"처리한 사람이 없습니다", r.batch?{ ms:9000, undo:function(){ atUndo(r.batch); } }:{ bad:!num(r.done) });
}
function atUndo(b){
  call("roll_undo",{ batch:b }).then(function(x){ reload(["atb"]);
    var sk=(x&&x.skip||[]), wm={}; sk.forEach(function(y){ var w=AT_UWHY[y.why]||y.why; wm[w]=(wm[w]||0)+1; });
    toast(x&&x.ok?"되돌렸습니다 · "+n0(x.done)+"명"+(sk.length?" · 건너뜀 "+Object.keys(wm).map(function(w){ return w+" "+wm[w]; }).join(" · "):""):"되돌리지 못했습니다 · "+(x&&x.reason==="owner"?"슈퍼관리자 · 출석 담당만 합니다":why(x)),{ bad:!(x&&x.ok), ms:sk.length?6000:0 }); });
}
/* ── 261023 출석 기록 지우기(att_del · 슈퍼관리자) · 고른 줄 · 이 세션 전부(「지우기」 입력) · 미리 보기 → 확인 창 → 결과 목록 · 토스트 되돌리기(스탬프를 거두지 않은 사람만)
 *   서버 = 원래 줄은 남기고 세션 칸만 「지움:」 · 10/26 기록은 그 기록으로 받은 프로그램 참여 스탬프를 거둠 · 보상 · 추첨 통 고정이면 막힘(이유) ── */
var AT_DWHY={ none:"지울 기록 없음", drawlock:"추첨 통 고정 뒤 · 10/26 기록", roulette:"룰렛 씀", tickets:"행운권 번호 나감", fin:"참여상 확정", fcfs:"선착순 참여상 받음", nostamp:"스탬프 없음", preday:"행사 전", err:"서버 오류" };
var AT_DRES={ s:"", h:"" };
function atDelCan(){ return !!isTop(); }
function atDelPick(){ var s=atSub(), g=MG[atTen(s)?"atn10":"atn17"]; if(!g) return; var e=xgPicked(g).map(function(r){ return r.emp; }); if(e.length) atDelAsk(e); }
function atDelQ(q, emps, old){ if(old) q.old="1"; else if(emps) q.emps=emps.join(","); else q.all="1"; return q; }
function atDelAsk(emps, old){
  if(!atDelCan()){ toast("기록 지우기는 슈퍼관리자가 합니다",{ bad:1 }); return; }
  var s=atSub(); if(s==="all"||(emps&&!emps.length)) return;
  if(emps&&emps.length>300){ toast("한 번에 300명까지 · 지금 "+n0(emps.length)+"명",{ bad:1, ms:4000 }); return; }
  toast("미리 보는 중");
  call("att_del",atDelQ({ sid:s, dry:"1" }, emps, old)).then(function(pv){
    if(!pv||!pv.ok){ toast("미리 보지 못했습니다 · "+(pv&&pv.reason==="super"?"슈퍼관리자만 합니다":pv&&pv.reason==="rows"?"한 번에 "+n0(pv.max)+"명까지":why(pv)),{ bad:1, ms:5000 }); return; }
    atDelConfirm(s, emps, pv, old);
  });
}
function atDelTx(x){
  if(x.why) return tag("막힘 · "+(AT_DWHY[x.why]||x.why),"warn");
  if(x.st==="rev") return tag("지움 · 스탬프 거둠 "+n0(x.n0)+" → "+n0(x.n1)+"개","warn");
  return tag("지움","")+(x.test?" "+tag("시험","off"):"");
}
function atDelTable(rows){
  var ok=rows.filter(function(x){ return !x.why; }), no=rows.filter(function(x){ return x.why; });
  return '<div class="xg-wrap mt4" style="--xg-h:220px"><table class="tb xg-fail"><thead><tr><th scope="col">이름</th><th scope="col">사번</th><th scope="col">줄</th><th scope="col">결과</th></tr></thead><tbody>'+
    ok.concat(no).map(function(x){ return '<tr><td>'+esc(x.name||"-")+'</td><td>'+esc(x.emp)+'</td><td class="num">'+n0(x.n)+'</td><td>'+atDelTx(x)+'</td></tr>'; }).join("")+'</tbody></table></div>';
}
function atDelConfirm(s, emps, pv, old){
  var m=AT_META[s]||{ h:s }, sm=pv.sum||{}, all=!emps&&!old, rows=pv.rows||[];
  var days=Object.keys(sm.days||{}).sort().map(function(d){ return d.slice(5).replace("-","/")+" "+n0(sm.days[d])+"줄"; }).join(" · ");
  var wk=Object.keys(sm.why||{}).map(function(w){ return (AT_DWHY[w]||w)+" "+n0(sm.why[w]); }).join(" · ");
  var body=band(sm.rev?"warn":"info",sm.rev?"10/26 기록으로 받은 프로그램 참여 스탬프를 거둡니다 · 거둔 사람은 되돌리기 없음":"출석 숫자 · 명단 · 엑셀 · 스탬프 셈에서 빠짐 · 원래 줄은 서버에 남음")+(sm.rev?'<div class="cap mt4">잘못 거뒀으면 이 세션 「입장 처리」 · 「종료 처리」로 기록과 스탬프를 다시 줍니다</div>':'')+
    '<dl class="cc-kv mt4"><dt>지움</dt><dd><b>'+n0(sm.ok)+'명</b> <span class="cap">'+n0(sm.lines)+'줄'+(days?' · '+esc(days):'')+'</span></dd><dt>스탬프</dt><dd>거둠 <b>'+n0(sm.rev)+'명</b></dd><dt>막힘</dt><dd>'+n0(sm.deny)+'명'+(wk?' <span class="cap">'+esc(wk)+'</span>':'')+'</dd></dl>'+
    atDelTable(rows)+(all?'<label class="fld mt4">확인 · 「지우기」 입력<input class="in" id="atDelW" autocomplete="off" oninput="gateUpd()"></label>':'');
  confirmBox({ t:old?m.h+" 다른 날 기록을 지울까요?":all?m.h+" 기록을 전부 지울까요?":m.h+" 출석 기록을 지울까요?", who:old?String(pv.skip||"").slice(5).replace("-","/")+" 기록은 그대로 · "+n0(sm.ok)+"명 "+n0(sm.lines)+"줄":all?"이 세션 기록 전부 · "+n0(sm.ok)+"명 "+n0(sm.lines)+"줄":"고른 "+n0(sm.n)+"명 · 지움 "+n0(sm.ok)+"명 · 막힘 "+n0(sm.deny)+"명",
    sub:"같은 사람이 다시 찍으면 새 기록 · 활동 기록에 남음", body:body, ok:"지우기 "+n0(sm.ok)+"명", danger:true, focus:all?"atDelW":"",
    gate:function(){ if(!(sm.ok>0)) return false; if(!all) return true; var w=el("atDelW"); return !!w&&w.value.trim()==="지우기"; },
    run:function(){ var q={ sid:s, rid:"d"+Date.now().toString(36)+Math.random().toString(36).slice(2,6) }; if(old) q.old="1"; else if(all){ q.all="1"; q.word=el("atDelW").value.trim(); } else q.emps=rows.filter(function(x){ return !x.why; }).map(function(x){ return x.emp; }).join(","); return call("att_del",q,30000); },
    fail:function(r){ return r&&r.reason==="super"?"슈퍼관리자만 합니다":r&&r.reason==="word"?"「지우기」를 그대로 입력합니다":""; },
    done:function(r){ atDelDone(s, r); } });
}
function atDelDone(s, r){
  var g=MG[atTen(s)?"atn10":"atn17"], gone={}, sm=r.sum||{};
  (r.rows||[]).forEach(function(x){ if(!x.why) gone[x.emp]=1; });
  if(g){ g.pick={}; g.rows=(g.rows||[]).filter(function(row){ if(!gone[row.emp]) return true; if(atTen(s)&&!row.x){ row.in=""; row.out=""; return true; } return false; }); XG.paint(g); }   /* 처리한 줄만 바로 고침 · 이어서 다시 읽기 */
  reload(["atb"]);
  AT_DRES={ s:s, h:'<div class="card mt"><div class="atn-bar"><b>기록 지우기 결과 · '+esc(hm(r.t))+'</b><span class="sp"></span><button class="btn sm" type="button" onclick="atDelRes0()">닫기</button></div><div class="cap">지움 '+n0(sm.del)+'명 · 스탬프 거둠 '+n0(sm.rev)+'명 · 막힘 '+n0(sm.deny)+'명</div>'+atDelTable(r.rows||[])+'</div>' };
  var re=el("atRes"); if(re) re.innerHTML=AT_DRES.h;
  toast(r.done?"지웠습니다 · "+n0(r.done)+"명 "+n0(r.lines)+"줄"+(sm.rev?" · 스탬프 거둠 "+n0(sm.rev):"")+(sm.deny?" · 막힘 "+n0(sm.deny):""):"지운 기록이 없습니다", r.batch&&r.undo?{ undo:function(){ atDelUndo(r.batch); } }:{ bad:!r.done, ms:5000 });
}
function atDelRes0(){ AT_DRES={ s:"", h:"" }; var re=el("atRes"); if(re) re.innerHTML=""; }
function atDelUndo(b){
  call("roll_undo",{ batch:b }).then(function(x){ reload(["atb"]);
    var sk=(x&&x.skip)||[];
    if(x&&x.ok) atDelRes0();
    toast(x&&x.ok?"되돌렸습니다 · "+n0(x.done)+"명 "+n0(x.lines)+"줄"+(sk.length?" · 건너뜀 "+n0(sk.length)+"(스탬프 거둠 · 바뀜)":""):"되돌리지 못했습니다 · "+(x&&x.reason==="super"?"슈퍼관리자만 합니다":why(x)),{ bad:!(x&&x.ok), ms:sk.length?6000:0 }); });
}
/* ── 261022 밤 출석 담당 · 설정 › 관리자 명단(콘솔 입장) 「출석 담당」 칸 · AX 라운지 담당(lngstamp.js lsmOwnCell)과 같은 모양 ── */
function atOwnCell(r){
  if(r.ao==null) return '<span class="cap">서버 갱신 뒤</span>';
  var h=r.ao?tag("담당","ok"):'<span class="cap">-</span>';
  if(typeof adrTop==="function"&&adrTop()) h+=' <button class="btn sm" type="button" onclick="atOwnAsk(\''+jq(r.emp)+'\','+(r.ao?0:1)+')">'+(r.ao?"해제":"지정")+'</button>';
  return h;
}
function atOwnRow(emp){ var d=S.data.admr; return d&&d.ok?(((d.c||{}).rows||[]).filter(function(x){ return x.emp===emp; })[0]||null):null; }
function atOwnAsk(emp, on){
  var r=atOwnRow(emp)||{ emp:emp };
  confirmBox({ t:on?"출석 담당으로 지정할까요?":"출석 담당을 해제할까요?", who:personLine(r), sub:on?"출석 탭에서 입장 · 종료 처리 · 되돌리기를 할 수 있음 · 활동 기록에 남음":"이 사람의 출석 탭 처리 단추가 꺼짐 · 활동 기록에 남음", ok:on?"지정":"해제", danger:!on,
    run:function(){ return call("att_owner_set",{ emp:emp, on:on?"1":"0" }); },
    fail:function(x){ return x&&x.reason==="notfound"?"콘솔 입장 명단에 먼저 넣습니다":x&&x.reason==="super"?"슈퍼관리자만 합니다":""; },
    done:function(x){ atOwnAfter(emp, on); toast((on?"지정했습니다 · ":"해제했습니다 · ")+(r.name||emp), x.same?{}:{ undo:function(){ call("att_owner_set",{ emp:emp, on:on?"0":"1" }).then(function(y){ if(y&&y.ok) atOwnAfter(emp, !on); toast(y&&y.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(y),{ bad:!(y&&y.ok) }); }); } }); } });
}
function atOwnAfter(emp, on){ var r=atOwnRow(emp); if(r) r.ao=on?1:0; if(S.me&&normE(S.me.emp)===normE(emp)) S.me.ao=on?1:0; paint(); reload(["admr"]); }
