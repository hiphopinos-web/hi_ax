/* AXF CONTROL v2 · 미팅 탭 › 1F AX 라운지 › 명단 · 고른 줄 스탬프 일괄 부여 · AX 라운지 담당 지정 (사용자 261021)
 * 「스탬프 부여」 = 표 위 오른쪽(고른 줄이 있을 때 · table.js o.pickAct) · AX 라운지 담당자(S.me.lo · 설정 라운지_담당)만 켜짐 · 아니면 꺼진 단추 + 안내 한 줄
 *   누르면 lng_stamp_many dry=1(미리 보기 · 쓰지 않음) → 경고 창(고른 n · 줄 사람 m · 건너뜀 k 이유별 · 사람 표) → 입력칸에 「스탬프 부여」를 그대로 쳐야 확인 단추가 켜짐
 *   → lng_stamp_many(confirm · rid) · 서버가 같은 판정을 다시(스태프 폰 「라운지 종료」와 같은 길 · 상담 줄 끝 · 프로그램 참여 2개) → 토스트 「되돌리기」 = roll_undo(그날 · 활동 기록에서도)
 * 담당 지정 · 해제 = 설정 › 관리자 명단 › 콘솔 입장 명단 「AX 라운지 담당」 칸(roster.js 열 · 슈퍼관리자만 단추) · lng_owner_set(emp · on) · 활동 기록 lng_owner */
var LSM_W="스탬프 부여", LSM_MAX=200;
var LSM_WHY={ cancel:"취소된 줄", noshow:"노쇼", nomatch:"승인 전", done:"이미 끝(받음)", has:"이미 라운지 스탬프 있음", again:"같은 사람 다른 줄", preday:"행사 전 · 상담일이 오늘이 아님", notfound:"명단에 없음", emp:"사번 없음", state:"그 사이 상태가 바뀜", err:"서버 오류" };
var LSM_FAIL={ owner:"슈퍼관리자 · AX 라운지 담당자가 합니다 · 설정 › 관리자 명단에서 지정", word:"확인 문구가 맞지 않습니다 · 「"+LSM_W+"」", rows:"한 번에 "+LSM_MAX+"줄까지입니다" };
function lsmOwner(){ return !!(S.me&&(S.me.lo||S.me.top)); }   /* 261023 권한 QA · 슈퍼관리자도(서버 lngHideOk_ 와 같은 기준) */
function lsmBtn(g, n){
  if(lsmOwner()) return '<button class="btn sm pri" type="button" onclick="lsmAsk()">스탬프 부여 '+n0(n)+'명</button>';
  return '<span style="display:inline-flex;flex-direction:column;align-items:flex-end;gap:2px"><button class="btn sm" type="button" disabled aria-disabled="true">스탬프 부여</button><span class="cap">AX 라운지 담당자만 · 설정 › 관리자 명단에서 지정</span></span>';
}
function lsmWhyTx(w){ return LSM_WHY[w]||w||"-"; }
function lsmByK(){ var m={}; ((S.data.resv&&S.data.resv.rows)||[]).forEach(function(r){ m[String(r.id)]=r; }); return m; }
function lsmWhen(x, r){ return (x.day&&typeof mtDl==="function"?mtDl(x.day)+" ":"")+(x.slot||hm(r&&r.slot)||"칸 미정"); }
function lsmAsk(){
  var g=LG.g; if(!g||g.busy) return; if(!lsmOwner()){ toast(LSM_FAIL.owner,{ bad:1 }); return; }
  var rows=xgPicked(g), ids=rows.map(function(r){ return String(r.id); }); if(!ids.length) return;
  if(ids.length>LSM_MAX){ toast("한 번에 "+LSM_MAX+"줄까지 · 지금 "+n0(ids.length)+"줄 선택",{ bad:1, ms:4000 }); return; }
  g.busy=1; xgActs(g);
  call("lng_stamp_many",{ ids:ids.join(","), dry:"1" }).then(function(pv){
    g.busy=0; xgActs(g);
    if(!pv||!pv.ok){ toast("미리 보지 못했습니다 · "+(LSM_FAIL[pv&&pv.reason]||why(pv)),{ bad:1, ms:5000 }); return; }
    lsmConfirm(ids, pv);
  });
}
function lsmConfirm(ids, pv){
  var bk=lsmByK(), give=pv.rows.filter(function(x){ return x.ok; }), skip=pv.rows.filter(function(x){ return !x.ok; });
  var wk=Object.keys(pv.why||{}).map(function(k){ return lsmWhyTx(k)+" "+n0(pv.why[k]); }).join(" · ");
  var tr=function(x){ var r=bk[x.k]||{}; return '<tr><td>'+esc(x.name||r.name||"-")+'</td><td>'+esc(x.emp||r.emp||"-")+'</td><td style="white-space:nowrap">'+esc(lsmWhen(x, r))+'</td><td>'+(x.ok?(x.u==="cap"?tag("기록만 · 개수 그대로",""):tag("줌 · "+n0(x.n0)+" → "+n0(x.n1)+"개","ok")):tag(lsmWhyTx(x.why),"off"))+'</td></tr>'; };
  var body=band("warn","실제 스탬프가 나갑니다 · 참가자 앱에 알림 · 상담 줄이 「끝」으로 바뀝니다")+
    '<dl class="cc-kv mt4"><dt>고른 줄</dt><dd>'+n0(pv.n)+'줄</dd><dt>줄 사람</dt><dd><b>'+n0(pv.give)+'명</b>'+(pv.cap?' <span class="cap">(그중 '+n0(pv.cap)+'명 기록만 · 6개 다 참 또는 프로그램 참여 2개 참)</span>':'')+'</dd><dt>건너뜀</dt><dd>'+n0(pv.skip)+'명'+(wk?' <span class="cap">'+esc(wk)+'</span>':'')+'</dd></dl>'+
    '<div class="xg-wrap mt4" style="--xg-h:220px"><table class="tb xg-fail"><thead><tr><th scope="col">이름</th><th scope="col">사번</th><th scope="col">상담</th><th scope="col">처리</th></tr></thead><tbody>'+give.concat(skip).map(tr).join("")+'</tbody></table></div>'+
    '<label class="fld">확인 문구 · 「'+LSM_W+'」를 그대로 입력합니다<input class="in" id="lsmQ" autocomplete="off" oninput="gateUpd()"></label>';
  confirmBox({ t:"라운지 스탬프를 부여할까요?", who:"고른 "+n0(pv.n)+"줄 · 줄 사람 "+n0(pv.give)+"명 · 건너뜀 "+n0(pv.skip)+"명", sub:"프로그램 참여 2개(AX 라운지) · 스태프 폰 「라운지 종료」와 같은 처리 · 활동 기록에서 그날 되돌리기",
    body:body, focus:"lsmQ", ok:"스탬프 부여 "+n0(pv.give)+"명", danger:true,
    gate:function(){ var q=el("lsmQ"); return pv.give>0&&!!q&&q.value.trim()===LSM_W; },
    run:function(){ var q=el("lsmQ"); return call("lng_stamp_many",{ ids:ids.join(","), confirm:q?q.value.trim():"", rid:"s"+Date.now().toString(36)+Math.random().toString(36).slice(2,6) },30000); },
    fail:function(r){ return LSM_FAIL[r&&r.reason]||""; },
    done:function(r){ lsmDone(r); } });
}
function lsmDone(r){
  var g=LG.g, bk=lsmByK(); if(g) g.pick={};
  (r.rows||[]).forEach(function(x){ if(x.ok&&bk[x.k]) bk[x.k].status="완료"; });   /* 처리한 줄만 바로 고침 · 이어서 다시 읽기 */
  if(typeof lgPaint==="function") lgPaint(); reload(["resv","lgb","nb"]);
  var sk=num(r.skip);
  toast(num(r.done)?"스탬프를 부여했습니다 · "+n0(r.done)+"명"+(sk?" · 건너뜀 "+n0(sk):""):"부여한 사람이 없습니다"+(sk?" · 건너뜀 "+n0(sk):""), r.batch?{ ms:9000, undo:function(){ lsmUndo(r.batch); } }:{ bad:!num(r.done) });
}
function lsmUndo(b){
  call("roll_undo",{ batch:b }).then(function(x){ reload(["resv","lgb","nb"]);
    var sk=(x&&x.skip||[]).length; toast(x&&x.ok?"되돌렸습니다 · "+n0(x.done)+"명"+(sk?" · 건너뜀 "+sk:""):"되돌리지 못했습니다 · "+(x&&x.reason==="expired"?"다른 날 처리한 묶음입니다":x&&x.reason==="done"?"이미 되돌렸습니다":why(x)),{ bad:!(x&&x.ok) }); });
}
/* ── AX 라운지 담당 · 관리자 명단(콘솔 입장) 칸 ── */
function lsmOwnCell(r){
  if(r.lo==null) return '<span class="cap">서버 갱신 뒤</span>';
  var h=r.lo?tag("담당","ok"):'<span class="cap">-</span>';
  if(typeof adrTop==="function"&&adrTop()) h+=' <button class="btn sm" type="button" onclick="lsmOwnAsk(\''+jq(r.emp)+'\','+(r.lo?0:1)+')">'+(r.lo?"해제":"지정")+'</button>';
  return h;
}
function lsmOwnRow(emp){ var d=S.data.admr; return d&&d.ok?(((d.c||{}).rows||[]).filter(function(x){ return x.emp===emp; })[0]||null):null; }
function lsmOwnAsk(emp, on){
  var r=lsmOwnRow(emp)||{ emp:emp };
  confirmBox({ t:on?"AX 라운지 담당으로 지정할까요?":"AX 라운지 담당을 해제할까요?", who:personLine(r), sub:on?"미팅 탭 › 1F AX 라운지 › 명단에서 고른 줄 「스탬프 부여」를 할 수 있음 · 활동 기록에 남음":"이 사람의 「스탬프 부여」 단추가 꺼짐 · 활동 기록에 남음", ok:on?"지정":"해제", danger:!on,
    run:function(){ return call("lng_owner_set",{ emp:emp, on:on?"1":"0" }); },
    fail:function(x){ return x&&x.reason==="notfound"?"콘솔 입장 명단에 먼저 넣습니다":x&&x.reason==="super"?"슈퍼관리자만 합니다":""; },
    done:function(x){ lsmOwnAfter(emp, on); toast((on?"지정했습니다 · ":"해제했습니다 · ")+(r.name||emp), x.same?{}:{ undo:function(){ call("lng_owner_set",{ emp:emp, on:on?"0":"1" }).then(function(y){ if(y&&y.ok) lsmOwnAfter(emp, !on); toast(y&&y.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(y),{ bad:!(y&&y.ok) }); }); } }); } });
}
function lsmOwnAfter(emp, on){ var r=lsmOwnRow(emp); if(r) r.lo=on?1:0; if(S.me&&normE(S.me.emp)===normE(emp)) S.me.lo=on?1:0; paint(); reload(["admr"]); }
