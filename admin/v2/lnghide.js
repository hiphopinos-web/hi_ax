/* AXF CONTROL v2 · 미팅 탭 › 1F AX 라운지 › 명단 · 「대상자 삭제」 = 고른 줄 숨김 · 숨긴 줄 보기 · 되돌리기 (사용자 261022 · Admin 세션 경유)
 * 「대상자 삭제」 = 표 위 오른쪽 맨 앞(table.js o.topAct · 늘 보임) · 슈퍼관리자(S.me.top) 또는 AX 라운지 담당(S.me.lo)만 켜짐
 *   왼쪽 칸에서 고른 줄 → 확인 창(고른 n건 · 삭제할 줄 · 막히는 줄 이유별 · 사람 표) → 입력칸에 「삭제」를 쳐야 확인 단추가 켜짐 → lng_row_hide(ids · on 1)
 *   서버 = 행을 지우지 않고 숨김 표시 · 배정 · 노쇼 줄은 취소로 · 명단 · 시간표 · 참가자 앱에서 빠짐 · 참가자 알림 없음 · 운영로그(활동 기록 되돌리기)
 *   막는 줄 = 왔음(체크인) · 끝(완료) · 잠금(확정) · 먼저 되돌리기 · 잠금 풀기
 * 「숨긴 줄 보기」 = 명단 위 단추 · 켜면 명단 아래 「숨긴 줄」 표 · 줄마다 「되돌리기」(lng_row_hide on 0 · 숨기기 전 상태로 · 칸이 찼으면 취소로 보임) */
var LH={ on:0, g:null }, LH_W="삭제", LH_MAX=200;
var LH_WHY={ "in":"왔음", done:"끝", lock:"잠금(확정)", same:"이미 숨긴 줄", notfound:"명단에 없음", state:"그 사이 상태가 바뀜", err:"서버 오류" };
var LH_HOW=["왔음 · 끝 = 먼저 상태 되돌리기(끝은 스탬프 거둠)","잠금 = 시간표에서 먼저 잠금 풀기"];
var LH_FAIL={ owner:"슈퍼관리자 · AX 라운지 담당자만 합니다", rows:"한 번에 "+LH_MAX+"줄까지입니다", param:"고른 줄이 없습니다" };
var LH_BACK={ taken:"그 칸이 차서 취소로 보임", dup:"같은 사람 같은 칸 줄이 있어 취소로 보임", state:"상태가 바뀌어 취소로 보임" };
function lhOk(){ return !!(S.me&&(S.me.top||S.me.lo)); }
function lhBtn(g, n){
  if(!lhOk()) return '<span style="display:inline-flex;flex-direction:column;align-items:flex-end;gap:2px"><button class="btn sm" type="button" disabled aria-disabled="true">대상자 삭제</button><span class="cap">슈퍼관리자 · AX 라운지 담당만</span></span>';
  return '<button class="btn sm dng" type="button" onclick="lhAsk()"'+(g.busy?' disabled aria-disabled="true"':'')+'>대상자 삭제'+(n?' '+n0(n)+'건':'')+'</button>';
}
/* 화면 판정(서버가 같은 판정을 다시 한다) */
function lhWhy(r){ return r.status==="체크인"?"in":r.status==="완료"?"done":num(r.lk)?"lock":""; }
function lhWhen(r){ return (r.day&&typeof mtDl==="function"?mtDl(r.day)+" ":"")+(hm(r.slot)||"칸 미정")+(num(r.seat)?" · 미팅룸 "+r.seat:""); }
function lhWhenS(r){ return (r.day?String(r.day).slice(5).replace("-","/")+" ":"")+(hm(r.slot)||"칸 미정"); }
function lhAsk(){
  var g=LG.g; if(!g||g.busy) return;
  if(!lhOk()){ toast(LH_FAIL.owner,{ bad:1 }); return; }
  var rows=xgPicked(g); if(!rows.length){ toast("왼쪽 칸에서 삭제할 줄을 고릅니다"); return; }
  if(rows.length>LH_MAX){ toast("한 번에 "+LH_MAX+"줄까지 · 지금 "+n0(rows.length)+"줄 선택",{ bad:1, ms:4000 }); return; }
  var go=rows.filter(function(r){ return !lhWhy(r); }), no=rows.filter(function(r){ return !!lhWhy(r); }), wk={};
  no.forEach(function(r){ var w=lhWhy(r); wk[w]=(wk[w]||0)+1; });
  var wt=Object.keys(wk).map(function(k){ return LH_WHY[k]+" "+n0(wk[k]); }).join(" · ");
  var cx=go.filter(function(r){ return r.status!=="취소"; }).length, all=(S.data.resv&&S.data.resv.rows)||[];
  var one=go.filter(function(r){ return (r.status==="신청"||r.status==="승인")&&!all.some(function(y){ return y.id!==r.id&&normE(y.emp)===normE(r.emp)&&y.status!=="취소"; }); }).length;   /* 그 사람의 하나뿐인 줄 · 다음 명단 올리기 때 다시 생길 수 있음 */
  var tr=function(r){ var w=lhWhy(r); return '<tr><td>'+esc(r.name||"-")+'</td><td>'+esc(r.emp||"-")+'</td><td style="white-space:nowrap">'+esc(lhWhenS(r))+'</td><td>'+tag(lnView(r), RV_TAG[r.status])+'</td><td style="white-space:nowrap">'+(w?tag("막힘 · "+LH_WHY[w],"off"):tag(r.status==="취소"?"숨김":"취소 후 숨김","warn"))+'</td></tr>'; };
  var body=band("warn",(cx||one?"· ":"")+"줄을 지우지 않고 숨깁니다 · 명단 · 시간표 · 참가자 앱에서 빠집니다"+(cx?"<br>· 배정 · 노쇼 "+n0(cx)+"건은 취소로 바뀝니다":"")+(one?"<br>· 하나뿐인 줄 "+n0(one)+"건은 다음 명단 올리기 때 다시 생길 수 있습니다":""))+
    '<dl class="cc-kv mt4"><dt>고른 줄</dt><dd>'+n0(rows.length)+'건</dd><dt>삭제할 줄</dt><dd><b>'+n0(go.length)+'건</b></dd><dt>막히는 줄</dt><dd>'+n0(no.length)+'건'+(wt?' <span class="cap">'+esc(wt)+'</span>':'')+'</dd></dl>'+
    '<div class="xg-wrap mt4" style="--xg-h:220px"><table class="tb xg-fail"><thead><tr><th scope="col">이름</th><th scope="col">사번</th><th scope="col">상담</th><th scope="col">상태</th><th scope="col">처리</th></tr></thead><tbody>'+go.concat(no).map(tr).join("")+'</tbody></table></div>'+(no.length?'<p class="cap mt4">'+LH_HOW.map(function(x){ return "· "+esc(x); }).join("<br>")+'</p>':'')+
    '<label class="fld">확인 문구 · 「'+LH_W+'」를 그대로 입력합니다<input class="in" id="lhQ" autocomplete="off" oninput="gateUpd()"></label>';
  var ids=go.map(function(r){ return String(r.id); });
  confirmBox({ t:"고른 줄을 명단에서 삭제할까요?", who:"고른 "+n0(rows.length)+"건 · 삭제 "+n0(go.length)+"건 · 막힘 "+n0(no.length)+"건", sub:"참가자 알림 없음 · 「숨긴 줄 보기」에서 되돌리기",
    body:body, focus:"lhQ", ok:"삭제 "+n0(go.length)+"건", danger:true,
    gate:function(){ var q=el("lhQ"); return go.length>0&&!!q&&q.value.trim()===LH_W; },
    run:function(){ g.busy=1; xgActs(g); return call("lng_row_hide",{ ids:ids.join(","), on:"1" },30000).then(function(r){ g.busy=0; xgActs(g); return r; }); },
    fail:function(r){ return LH_FAIL[r&&r.reason]||""; },
    done:function(r){ lhDone(r, 1); } });
}
/* 처리한 줄만 바로 고친다(숨긴 줄 = 명단 rows → hid) · 이어서 다시 읽기 */
function lhMove(r, on){
  var d=S.data.resv; if(!d||!d.rows) return; if(!d.hid) d.hid=[];
  (r.rows||[]).forEach(function(x){ if(!x.ok) return;
    var from=on?d.rows:d.hid, to=on?d.hid:d.rows, j=-1;
    for(var i=0;i<from.length;i++) if(String(from[i].id)===String(x.k)){ j=i; break; }
    if(j<0) return; var y=from.splice(j,1)[0]; y.status=x.st||y.status; if(on){ y.hid=1; y.hPrev=x.was; y.hAt=r.t; } else { delete y.hid; } to.push(y); });
}
function lhDone(r, on){
  var g=LG.g; if(g&&on) g.pick={};
  lhMove(r, on);
  if(typeof lgPaint==="function") lgPaint(); reload(["resv","lgb","nb"]);
  var dn=num(r.done), sk=num(r.skip), ids=(r.rows||[]).filter(function(x){ return x.ok; }).map(function(x){ return x.k; });
  var bk=(r.rows||[]).filter(function(x){ return x.ok&&x.back; }).length;
  if(on) toast(dn?"삭제했습니다 · "+n0(dn)+"건"+(sk?" · 막힘 "+n0(sk):""):"삭제한 줄이 없습니다"+(sk?" · 막힘 "+n0(sk):""), dn?{ ms:9000, undo:function(){ lhUndo(ids); } }:{ bad:1 });
  else toast(dn?"되돌렸습니다 · "+n0(dn)+"건"+(bk?" · 그중 "+n0(bk)+"건 취소로 보임":""):"되돌리지 못했습니다"+(sk?" · "+(LH_WHY[Object.keys(r.why||{})[0]]||""):""),{ bad:!dn });
}
function lhUndo(ids){
  if(!ids||!ids.length) return;
  call("lng_row_hide",{ ids:ids.join(","), on:"0" },30000).then(function(x){ if(x&&x.ok) lhDone(x, 0); else toast("되돌리지 못했습니다 · "+(LH_FAIL[x&&x.reason]||why(x)),{ bad:1 }); });
}
/* ── 숨긴 줄 보기 ── */
function lhToggle(){ LH.on=LH.on?0:1; lhPaint(); }
function lhRows(){ var d=S.data.resv; return d&&d.ok&&d.hid||[]; }
function lhPaint(){
  var tg=el("lhTg"), box=el("lhBox"), hr=lhRows();
  if(tg){ var tx="숨긴 줄 보기 "+n0(hr.length); if(tg.textContent!==tx) tg.textContent=tx; tg.setAttribute("aria-pressed",LH.on?"true":"false"); tg.classList.toggle("on",!!LH.on); }
  if(!box) return;
  if(!LH.on){ if(box.innerHTML) box.innerHTML=""; return; }
  if(!box.querySelector("#lhList")) box.innerHTML='<div class="card mt4"><h2>숨긴 줄 <span class="cap">대상자 삭제로 숨긴 줄 · 명단 · 시간표 · 참가자 앱에 없음 · 되돌리면 숨기기 전 상태로</span></h2><div id="lhList"></div></div>';
  if(!LH.g) LH.g=XG.make({ id:"lounge_hid", file:"AX 라운지 숨긴 줄", key:function(r){ return r.id; }, sort:{ k:"hAt", d:-1 }, noDl:1, empty:"숨긴 줄이 없습니다", h:360,
    cols:[{ k:"day", t:"날짜", w:80, v:function(r){ return (r.day||"")+" "+(hm(r.slot)||"99"); }, f:function(r){ return r.day&&typeof mtDl==="function"?esc(mtDl(r.day)):"-"; } },{ k:"slot", t:"시간", w:70, v:function(r){ return hm(r.slot)||"칸 미정"; } },{ k:"seat", t:"미팅룸", w:60 },
      { k:"name", t:"이름", w:110 },{ k:"emp", t:"사번", w:90 },{ k:"dept", t:"부서", w:130 },{ k:"hPrev", t:"숨기기 전", w:80, v:function(r){ return lnView({ status:r.hPrev }); } },{ k:"hAt", t:"숨긴 시각", type:"date", w:110 },{ k:"ts", t:"신청 시각", type:"date", w:110 },
      { t:"", w:110, act:function(r){ return lhOk()?'<button class="btn sm" type="button" onclick="event.stopPropagation();lhBackAsk(\''+jq(String(r.id))+'\')">되돌리기</button>':'<span class="cap">-</span>'; } }] });
  XG.set(LH.g, hr, el("lhList"));
}
function lhBackAsk(id){
  var r=lhRows().filter(function(x){ return String(x.id)===id; })[0]; if(!r) return;
  confirmBox({ t:"숨긴 줄을 되돌릴까요?", who:personLine(r)+" · "+lhWhen(r)+" · 숨기기 전 "+lnView({ status:r.hPrev }), sub:"명단에 다시 보임 · 숨기기 전 상태로(그 칸이 찼으면 취소로 보임) · 참가자 알림 없음", ok:"되돌리기",
    run:function(){ return call("lng_row_hide",{ ids:id, on:"0" }); },
    fail:function(x){ return LH_FAIL[x&&x.reason]||""; },
    done:function(x){ lhDone(x, 0); var b=(x.rows||[])[0]; if(b&&b.back) setTimeout(function(){ toast(LH_BACK[b.back]||"취소로 보임",{ ms:5000 }); },400); } });
}
